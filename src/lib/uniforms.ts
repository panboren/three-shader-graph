import { Texture, Matrix4, Vector2, Matrix3, Vector3, Vector4 } from 'three';
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

export class UniformBoolNode extends BooleanNode {
  constructor(private readonly name: string, private readonly value: boolean = false) {
    super();
  }
  public compile(c: Compiler) {
    return c.defineUniform('bool', this.name, this.value)
  }
}

export class UniformFloatNode extends FloatNode {
  constructor(private readonly name: string, private readonly value: number = 0) {
    super();
  }
  public compile(c: Compiler) {
    return c.defineUniform('float', this.name, this.value);
  }
}

export class UniformVec2Node extends Vec2Node {
  constructor(private readonly name: string, private readonly value?: Vector2) {
    super();
  }
  public compile(c: Compiler) {
    return c.defineUniform('vec2', this.name, this.value)
  }
}

export class UniformVec3Node extends Vec3Node {
  constructor(private readonly name: string, private readonly value?: Vector3) {
    super();
  }
  public compile(c: Compiler) {
    return c.defineUniform('vec3', this.name, this.value)
  }
}

export class UniformVec4Node extends Vec4Node {
  constructor(private readonly name: string, private readonly value?: Vector4) {
    super();
  }
  public compile(c: Compiler) {
    return c.defineUniform('vec4', this.name, this.value)
  }
}

export class UniformMat2Node extends Mat2Node {
  constructor(private readonly name: string, private readonly value?: any) {
    super();
  }
  public compile(c: Compiler) {
    return c.defineUniform('mat2', this.name, this.value)
  }
}

export class UniformMat3Node extends Mat3Node {
  constructor(private readonly name: string, private readonly value?: Matrix3) {
    super();
  }
  public compile(c: Compiler) {
    return c.defineUniform('mat3', this.name, this.value)
  }
}

export class UniformMat4Node extends Mat4Node {
  constructor(private readonly name: string, private readonly value?: Matrix4) {
    super();
  }
  public compile(c: Compiler) {
    return c.defineUniform('mat4', this.name, this.value)
  }
}

export class UniformSampler2d extends Sampler2DNode {
  constructor(private readonly name: string | null, private readonly value?: Texture) {
    super();
  }
  public compile(c: Compiler) {
    return c.defineUniform('sampler2D', this.name, this.value)
  }
}
