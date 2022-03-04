import { int } from './dsl';
import { StructType } from './structs';
import { IntNode } from './types';

export class Compiler {
  private readonly cachedOuts = new Map<ShaderNode<any>, CompileResult<any>>();
  private readonly scopedCachedOuts = new Map<
    ShaderNode<any>,
    CompileResult<any>
  >();
  public readonly pars: string[] = [];
  public readonly chunks: string[] = [];
  public readonly uniforms: { [key: string]: { value: unknown } } = {}
  private inScope = false;

  private variableNumber = 0;
  public variable() {
    return ++this.variableNumber;
  }

  public startScope() {
    this.inScope = true;
    this.scopedCachedOuts.clear();
  }

  public stopScope() {
    this.inScope = false;
    this.scopedCachedOuts.clear();
  }

  public get<T>(node: ShaderNode<T>): T {
    if (node instanceof StructType) {
      this.registerStructDefinition(node);
    }
    const cache = this.inScope ? this.scopedCachedOuts : this.cachedOuts;

    if (!cache.has(node)) {
      const result = node.compile(this);
      if (result.chunk != null) {
        this.chunks.push(result.chunk);
      }
      if (result.pars != null) {
        if (!this.pars.includes(result.pars)) {
          this.pars.push(result.pars);
        }
      }
      cache.set(node, result);
    }

    // This is problemeatic if the result of a call ends up inside a scope.
    // could possibly solve this by ensuring that when you start a block, it will always append the chunk even though the node is being reused.
    return cache.get(node)?.out;
  }

  private cachedUniforms = new Map<unknown, string>();

  public defineUniform(type: string, name: string | null, value?: unknown): CompileResult<string> {
    const key = name ?? value
    if (!this.cachedUniforms.has(key)) {
      const _name = name ?? `u_${type}_${this.variable()}`

      this.pars.push(`
        uniform ${type} ${_name};
      `)
      this.uniforms[_name] = { value }
      this.cachedUniforms.set(key, _name)
    }
    return {
      out: this.cachedUniforms.get(key) as string
    }
  }

  private registerStructDefinition(node: StructType) {
    const structDef = node.definition();
    if (!this.pars.includes(structDef)) {
      this.pars.push(structDef);
    }
  }

  public getPars() {
    return this.pars
      .map((c) => c.split('\n'))
      .reduce((a, v) => a.concat(v), [])
      .map((r) => r.trim())
      .filter((r) => r != '')
      .join('\n');
  }

  public getMain() {
    return this.chunks
      .map((c) => c.split('\n'))
      .reduce((a, v) => a.concat(v), [])
      .map((r) => r.trim())
      .filter((r) => r != '')
      .join('\n');
  }

  public render() {
    return `
      ${this.getPars()}

      void main() {
        ${this.getMain()}
      }
    `;
  }
}

export class FragmentCompiler extends Compiler {
  constructor(private readonly vertexCompiler: Compiler) {
    super();
  }

  public defineVarying<T>(
    type: string,
    node: ShaderNode<T>,
    arrayLimit: number | IntNode | null = null
  ): CompileResult<string> {
    const out = this.vertexCompiler.get(node);
    const k = this.vertexCompiler.variable();
    const variable = `v_${type}_${k}`;
    // It should not matter which compiler is used as the limit should be defined as a constant
    // or as a reference to a global defined variable.
    let pars = `
      varying ${type} ${variable};
    `;
    let assignmentChunk = `
      ${variable} = ${out};
    `;
    if (arrayLimit != null) {
      const limit = this.vertexCompiler.get(int(arrayLimit));
      pars = `
        #if ${limit} > 0
          varying ${type} ${variable}[ ${limit} ];
        #endif`;
      assignmentChunk = `
        #if ${limit} > 0
          ${assignmentChunk};
        #endif`;
    }
    this.vertexCompiler.pars.push(pars);
    this.vertexCompiler.chunks.push(assignmentChunk);
    this.pars.push(pars);
    return {
      out: variable,
    };
  }
  public getVarying<T>(type: string, node: ShaderNode<T>): string {
    return this.defineVarying(type, node).out as string;
  }
}

export type CompileResult<T> = {
  readonly chunk?: string;
  readonly out: T;
  readonly pars?: string;
};

export type ShaderNode<T = string> = {
  compile(c: Compiler): CompileResult<T>;
};
