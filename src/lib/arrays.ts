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

const variableRx = /^\s*(?:(\w+)) (?=\w+)/g;
const variableExtractRx = /^\s*(?:(\w+)) (?=(\w+))/g;

export abstract class ArrayNode<T extends ShaderNode<string>>
  implements ShaderNode<string>
{
  constructor(public readonly type: BaseType<T>) {}

  protected startIndex = 0;
  public abstract limit: IntNode | number;

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

  protected abstract clone(): ArrayNode<T>;

  public slice(start: number, end: number): ArrayNode<T> {
    const copy = this.clone();
    copy.limit = copy.startIndex + end;
    copy.startIndex += start;
    return copy;
  }

  public first(num: number) {
    const copy = this.clone();
    copy.limit = num;
    return copy;
  }

  public sum<R extends ShaderNode<string> & { add(o: R): R }>(
    block: (v: T, index: IntNode) => R
  ) {
    const self = this;
    const indexReference = new IntExpressionNode('UNROLLED_LOOP_INDEX');
    const blockReturn = block(self.get(indexReference), indexReference);
    const type = blockReturn.constructor as BaseType<R>;
    // @ts-expect-error
    return new (class extends type {
      public compile(c: Compiler) {
        const k = c.variable();

        const limit = c.get(int(self.limit));
        const start = `
          ${type.typeName} loop_sum_${k} = ${type.typeName}(0.0);
          #if ${limit} > 0
          // Ensure the array is evaluated before the loop
          ${c.get(self)};
          //VARIABLES
          #pragma unroll_loop_start
          for ( int i = 0; i < ${c.get(int(self.limit))}; i ++ ) {
        `;
        // This is a hacky solution to ensure that the block does not append anything before this block does.
        // There should be a better way of wrapping another node in a chunk as it is now only supporting sequential appends.
        c.chunks.push(start);

        const innerChunkStartIndex = c.chunks.length;

        c.startScope(self);
        const blockResultOut = c.get(blockReturn);
        c.stopScope();

        // This deals with extracting variables and declaring them before the loop
        // starts so it can be unrolled without redefining variables
        const variableDeclerations = c.chunks
          .slice(innerChunkStartIndex)
          .map((chunk) => {
            return Array.from(chunk.matchAll(variableExtractRx)).map((m) => {
              return `${m[1]} ${m[2]};`;
            });
          })
          .reduce((a, v) => a.concat(v), [])
          .join('\n');

        c.chunks.slice(innerChunkStartIndex).forEach((innerChunk, i) => {
          c.chunks[innerChunkStartIndex + i] = innerChunk.replace(
            variableRx,
            ''
          );
        });
        c.chunks[innerChunkStartIndex - 1] = c.chunks[
          innerChunkStartIndex - 1
        ].replace('//VARIABLES', variableDeclerations);

        return {
          chunk: `
              loop_sum_${k} += ${blockResultOut};
            }
            #pragma unroll_loop_end
            #endif
          `,
          out: `loop_sum_${k}`,
        };
      }
    })();
  }

  public map<R extends ShaderNode<string>>(block: (v: T, index: IntNode) => R) {
    const self = this;
    const indexReference = new IntExpressionNode('UNROLLED_LOOP_INDEX');
    const blockReturn = block(self.get(indexReference), indexReference);
    const returnType = blockReturn.constructor as BaseType<R>;
    // @ts-expect-error
    return new (class extends ArrayNode<R> {
      protected readonly type = returnType;
      public readonly limit = self.limit;
      public compile(c: Compiler) {
        const k = c.variable();
        const limit = c.get(int(self.limit));
        const start = `
          #if ${limit} > 0
          ${returnType.typeName} loop_map_${k}[${limit}];
          //VARIABLES
          #pragma unroll_loop_start
          for ( int i = 0; i < ${limit}; i ++ ) {
        `;
        // This is a hacky solution to ensure that the block does not append anything before this block does.
        // There should be a better way of wrapping another node in a chunk as it is now only supporting sequential appends.
        c.chunks.push(start);

        const innerChunkStartIndex = c.chunks.length;

        c.startScope();
        const blockResultOut = c.get(blockReturn);
        c.stopScope();

        // This deals with extracting variables and declaring them before the loop
        // starts so it can be unrolled without redefining variables
        const variableDeclerations = c.chunks
          .slice(innerChunkStartIndex)
          .map((chunk) => {
            return Array.from(chunk.matchAll(variableExtractRx)).map((m) => {
              return `${m[1]} ${m[2]};`;
            });
          })
          .reduce((a, v) => a.concat(v), [])
          .join('\n');

        c.chunks.slice(innerChunkStartIndex).forEach((innerChunk, i) => {
          c.chunks[innerChunkStartIndex + i] = innerChunk.replace(
            variableRx,
            ''
          );
        });
        c.chunks[innerChunkStartIndex - 1] = c.chunks[
          innerChunkStartIndex - 1
        ].replace('//VARIABLES', variableDeclerations);

        return {
          chunk: `
              loop_map_${k}[i] = ${blockResultOut};
            }
            #pragma unroll_loop_end
            #else
            ${returnType.typeName} loop_map_${k}[1];
            #endif
          `,
          out: `loop_map_${k}`,
        };
      }
    })() as ArrayNode<R>;
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
    public readonly type: BaseType<T>,
    public readonly limit: IntNode | number
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
  protected clone() {
    return new UniformArrayNode(this.name, this.type, this.limit);
  }
}

export class VaryingArrayNode<
  T extends ShaderNode<string>
> extends ArrayNode<T> {
  constructor(
    private readonly node: ArrayNode<T>,
    public readonly limit = node.limit,
    public readonly type: BaseType<T> = node.type
  ) {
    super(node.type);
  }
  public compile(c: FragmentCompiler) {
    return c.defineVarying(this.type.typeName, this.node, this.node.limit);
  }
  protected clone() {
    return new VaryingArrayNode<T>(this.node, this.limit, this.type);
  }
}
