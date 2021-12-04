import { Compiler } from './compiler';
import {
  BooleanNode,
  FloatNode,
  Mat2Node,
  Mat3Node,
  Mat4Node,
  Sampler2DNode,
  Vec2Node,
  Vec3Node,
  Vec4Node,
} from './types';

function compileUniform(name: string, type: string) {
  return {
    pars: `
      uniform ${type} ${name};
    `,
    out: name,
  };
}

export class UniformBoolNode extends BooleanNode {
  constructor(private readonly name: string) {
    super();
  }
  public compile(c: Compiler) {
    return compileUniform(this.name, 'bool');
  }
}

export class UniformFloatNode extends FloatNode {
  constructor(private readonly name: string) {
    super();
  }
  public compile(c: Compiler) {
    return compileUniform(this.name, 'float');
  }
}

export class UniformVec2Node extends Vec2Node {
  constructor(private readonly name: string) {
    super();
  }
  public compile(c: Compiler) {
    return compileUniform(this.name, 'vec2');
  }
}

export class UniformVec3Node extends Vec3Node {
  constructor(private readonly name: string) {
    super();
  }
  public compile(c: Compiler) {
    return compileUniform(this.name, 'vec3');
  }
}

export class UniformVec4Node extends Vec4Node {
  constructor(private readonly name: string) {
    super();
  }
  public compile(c: Compiler) {
    return compileUniform(this.name, 'vec4');
  }
}

export class UniformMat2Node extends Mat2Node {
  constructor(private readonly name: string) {
    super();
  }
  public compile(c: Compiler) {
    return compileUniform(this.name, 'mat2');
  }
}

export class UniformMat3Node extends Mat3Node {
  constructor(private readonly name: string) {
    super();
  }
  public compile(c: Compiler) {
    return compileUniform(this.name, 'mat3');
  }
}

export class UniformMat4Node extends Mat4Node {
  constructor(private readonly name: string) {
    super();
  }
  public compile(c: Compiler) {
    return compileUniform(this.name, 'mat4');
  }
}

export class UniformSampler2d extends Sampler2DNode {
  constructor(private readonly name: string) {
    super();
  }
  public compile(c: Compiler) {
    return compileUniform(this.name, 'sampler2D');
  }
}
