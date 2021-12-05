import {
  Compiler,
  CompileResult,
  FragmentCompiler,
  ShaderNode,
} from './compiler';
import { int } from './dsl';
import { IntExpressionNode } from './expressions';
import { BaseType } from './nodes';
import { IntNode } from './types';

export abstract class ArrayNode<T extends ShaderNode<string>>
  implements ShaderNode<string>
{
  constructor(protected readonly type: BaseType<T>) { }

  protected abstract limit: IntNode | number;

  public abstract compile(c: Compiler): CompileResult<string>;

  public get(i: IntNode | number): T {
    const self = this;
    // @ts-expect-error
    return new (class extends this.type {
      public compile(c: Compiler) {
        return { out: `${c.get(self)}[${c.get(int(i))}]` };
      }
    })();
  }

  public sum<R extends ShaderNode<string> & { add(o: R): R }>(
    type: BaseType<R>,
    block: (v: T, index: IntNode) => R
  ) {
    const self = this;
    const indexReference = new IntExpressionNode('i');
    // @ts-expect-error
    return new (class extends type {
      public compile(c: Compiler) {
        const k = c.variable();

        const limit = c.get(int(self.limit));
        const start = `
          ${type.typeName} loop_sum_${k} = ${type.typeName}(0.0);
          #if ${limit} > 0

          for (int i = 0; i < ${c.get(int(self.limit))}; ++i) {
        `;
        // This is a hacky solution to ensure that the block does not append anything before this block does.
        // There should be a better way of wrapping another node in a chunk as it is now only supporting sequential appends.
        c.chunks.push(start);

        c.startScope();
        const blockResult = block(
          self.get(new IntExpressionNode('i')),
          indexReference
        ).compile(c);
        c.stopScope();

        return {
          chunk: `
              ${blockResult.chunk ?? ''}
              loop_sum_${k} += ${blockResult.out};
            }
            #endif
          `,
          out: `loop_sum_${k}`,
        };
      }
    })();
  }

  public map<R extends ShaderNode<string>>(
    type: BaseType<R>,
    block: (v: T, index: IntNode) => R
  ) {
    const self = this;
    const indexReference = new IntExpressionNode('i');
    // @ts-expect-error
    return new (class extends type {
      public compile(c: Compiler) {
        const k = c.variable();

        const limit = c.get(int(self.limit));
        const start = `
          ${type.typeName} loop_map_${k}[${limit}];
          #if ${limit} > 0

          for (int i = 0; i < ${limit}; ++i) {
        `;
        // This is a hacky solution to ensure that the block does not append anything before this block does.
        // There should be a better way of wrapping another node in a chunk as it is now only supporting sequential appends.
        c.chunks.push(start);

        c.startScope();
        const blockResult = block(
          self.get(indexReference),
          indexReference
        ).compile(c);
        c.stopScope();

        return {
          chunk: `
              ${blockResult.chunk ?? ''}
              loop_map_${k}[i] = ${blockResult.out};
            }
            #endif
          `,
          out: `loop_map_${k}`,
        };
      }
    })();
  }
}
// This is usefult to refer to existing uniforms that are predefined.
/*export class ArrayExpressionNode extends ArrayNode {
  constructor(private expr: string, protected limit: IntNode) {super()}
  public compile(c: Compiler) {
    return {
      out: this.expr
    }
  }
}*/

// This will be needed in order to refer to arrays of lights. The limit will need to be defined by a constant.
export class UniformArrayNode<
  T extends ShaderNode<string>
  > extends ArrayNode<T> {
  constructor(
    private readonly name: string,
    protected readonly type: BaseType<T>,
    protected readonly limit: IntNode | number
  ) {
    super(type);
  }
  public compile(c: Compiler) {
    const limit = c.get(int(this.limit));
    return {
      pars: `
        #if ${limit} > 0
          uniform ${this.type.typeName} ${this.name}[ ${limit} ];
        #endif
        `,
      out: `${this.name}`,
    };
  }
}

export class VaryingArrayNode<
  T extends ShaderNode<string>
  > extends ArrayNode<T> {
  constructor(
    private readonly node: T,
    protected readonly type: BaseType<T>,
    protected readonly limit: IntNode
  ) {
    super(type);
  }
  public compile(c: FragmentCompiler) {
    return c.defineVarying(this.type.typeName, this.node, this.limit);
  }
}