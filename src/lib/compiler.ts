import { attributes, uniforms } from './common';
import { uniformVec3, vec4 } from './dsl';
import { FogNode } from './effects/fog';
import { AssignNode, LinearToOutputTexelNode } from './helpers';
import { StructType } from './structs';
import { IntNode, IRgbaNode, Mat4Node, Vec4Node } from './types';

export class Compiler {
  private readonly cachedOuts = new Map<ShaderNode<any>, CompileResult<any>>();
  private readonly scopedCachedOuts = new Map<
    ShaderNode<any>,
    CompileResult<any>
  >();
  public readonly pars: string[] = [];
  public readonly chunks: string[] = [];
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
    arrayLimit: IntNode | null = null
  ): CompileResult<string> {
    const out = this.vertexCompiler.get(node);
    const k = this.vertexCompiler.variable();
    const variable = `v_${type}_${k}`;
    // It should not matter which compiler is used as the limit should be defined as a constant
    // or as a reference to a global defined variable.
    let pars = `
      varying ${type} ${variable};
    `;
    if (arrayLimit != null) {
      const limit = this.vertexCompiler.get(arrayLimit);
      pars = `
        #if ${limit} > 0
          varying ${type} ${variable}[ ${limit} ];
        #endif`;
    }
    this.vertexCompiler.pars.push(pars);
    this.vertexCompiler.chunks.push(`
      ${variable} = ${out};
    `);
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

export function outputPosition(position: Vec4Node) {
  return uniforms.projectionMatrix
    .multiply(uniforms.modelViewMatrix)
    .multiplyVec(position);
}

export class ShaderGraph {
  constructor(
    private readonly out: {
      readonly color: IRgbaNode;
      readonly transform: Mat4Node;
    }
  ) { }
  public compile() {
    const uniformFogColor = uniformVec3('fogColor');
    const colorWithEncoding = new LinearToOutputTexelNode(this.out.color);
    const colorWithFog = new FogNode(colorWithEncoding, uniformFogColor);

    const vertexCompiler = new Compiler();

    const transform = this.out.transform;

    vertexCompiler.get(new AssignNode('mat4 vertexTransform', transform));
    vertexCompiler.get(
      new AssignNode(
        'gl_Position',
        outputPosition(transform.multiplyVec(vec4(attributes.position, 1)))
      )
    );

    const compiler = new FragmentCompiler(vertexCompiler);
    compiler.get(new AssignNode('gl_FragColor', colorWithFog));

    const vertexShader = vertexCompiler.render();
    const fragmentShader = compiler.render();
    return {
      vertexShader,
      fragmentShader,
    };
  }
}