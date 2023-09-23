import {
  ColorRepresentation,
  Matrix3,
  Matrix4,
  Texture,
  Vector2,
  Vector3,
  Vector4,
} from 'three';

import { VaryingArrayNode } from '..';

import { ArrayNode } from './arrays';
import { ShaderNode } from './compiler';
import { getX, getY, getZ } from './helpers';
import { ComponentsVec3Node } from './types';
import {
  BooleanNode,
  ComponentsRgbaNode,
  ComponentsVec4Node,
  ConstantBooleanNode,
  ConstantFloatNode,
  ConstantIntNode,
  ConstantRgbaNode,
  ConstantRgbNode,
  ConstantVec2Node,
  ConstantVec3Node,
  ConstantVec4Node,
  FloatNode,
  IntNode,
  Mat2Node,
  Mat3Node,
  Mat4Node,
  RgbaNode,
  Sampler2DNode,
  Vec2Node,
  Vec3Node,
  Vec4Node,
} from './types';
import {
  UniformBoolNode,
  UniformFloatNode,
  UniformMat2Node,
  UniformMat3Node,
  UniformMat4Node,
  UniformSampler2d,
  UniformVec2Node,
  UniformVec3Node,
  UniformVec4Node,
} from './uniforms';
import {
  VaryingFloatNode,
  VaryingMat2Node,
  VaryingMat3Node,
  VaryingMat4Node,
  VaryingVec2Node,
  VaryingVec3Node,
  VaryingVec4Node,
} from './varying';

export function uniformBool(name: string, value = false) {
  return new UniformBoolNode(name, value);
}
export function uniformFloat(name: string, value = 0) {
  return new UniformFloatNode(name, value);
}
export function uniformVec2(name: string, value?: Vector2) {
  return new UniformVec2Node(name, value);
}
export function uniformVec3(name: string, value?: Vector3) {
  return new UniformVec3Node(name, value);
}
export function uniformVec4(name: string, value?: Vector4) {
  return new UniformVec4Node(name, value);
}
export function uniformMat2(name: string, value?: any) {
  return new UniformMat2Node(name, value);
}
export function uniformMat3(name: string, value: Matrix3 = new Matrix3()) {
  return new UniformMat3Node(name, value);
}
export function uniformMat4(name: string, value?: Matrix4) {
  return new UniformMat4Node(name, value);
}
export function uniformSampler2d(name: string) {
  return new UniformSampler2d(name);
}
export function textureSampler2d(texture: Texture) {
  return new UniformSampler2d(null, texture);
}
export function varyingFloat(n: FloatNode): FloatNode {
  return new VaryingFloatNode(n);
}
export function varyingVec2(n: Vec2Node) {
  return new VaryingVec2Node(n);
}
export function varyingVec3(n: Vec3Node) {
  return new VaryingVec3Node(n);
}
export function varyingVec4(n: Vec4Node) {
  return new VaryingVec4Node(n);
}
export function varyingMat2(n: Mat2Node) {
  return new VaryingMat2Node(n);
}
export function varyingMat3(n: Mat3Node) {
  return new VaryingMat3Node(n);
}
export function varyingMat4(n: Mat4Node) {
  return new VaryingMat4Node(n);
}

export function varyingArray<T extends ShaderNode<string>>(node: ArrayNode<T>) {
  return new VaryingArrayNode(node);
}

export function neg(f: FloatNode): FloatNode {
  return float(-1).multiply(f);
}

export function negVec2(n: Vec2Node): Vec2Node {
  return n.multiplyScalar(float(-1));
}

export function negVec3(n: Vec3Node): Vec3Node {
  return n.multiplyScalar(float(-1));
}

export function negVec4(n: Vec4Node): Vec4Node {
  return n.multiplyScalar(float(-1));
}

export function rgba(
  color: ColorRepresentation | Vec4Node | Vec3Node,
  alpha: number | FloatNode = 1
): RgbaNode {
  if (color instanceof Vec3Node) {
    return new ComponentsRgbaNode(
      color.x(),
      color.y(),
      color.z(),
      float(alpha)
    );
  } else if (color instanceof Vec4Node) {
    return new ComponentsRgbaNode(color.x(), color.y(), color.z(), color.w());
  }
  return new ConstantRgbaNode(color, alpha as number);
}

export function rgb(color: ColorRepresentation) {
  return new ConstantRgbNode(color);
}

export function bool(b: boolean | BooleanNode): BooleanNode {
  if (b instanceof BooleanNode) {
    return b;
  }
  return new ConstantBooleanNode(b);
}

export function float(f: number | FloatNode): FloatNode {
  if (f instanceof FloatNode) {
    return f;
  }
  return new ConstantFloatNode(f);
}

export function int(i: number | IntNode): IntNode {
  if (i instanceof IntNode) {
    return i;
  }
  return new ConstantIntNode(i);
}

export function vec2(
  x: number | Vector2 | Vector3 | Vector4 | Vec3Node | Vec4Node,
  y?: number
): Vec2Node {
  if (x instanceof Vec3Node || x instanceof Vec4Node) {
    return x.xy();
  } else if (typeof x === 'number') {
    return new ConstantVec2Node(new Vector2(x, y));
  }
  return new ConstantVec2Node(x);
}

export function vec3(
  x: number | Vector3 | Vector4 | Vec3Node | Vec4Node | FloatNode,
  y?: number | FloatNode,
  z?: number | FloatNode
): Vec3Node {
  if (x instanceof Vec3Node) {
    return x;
  } else if (x instanceof Vec4Node) {
    return x.xyz();
  } else if (
    (typeof x === 'number' || x instanceof FloatNode) &&
    (typeof y === 'number' || y instanceof FloatNode) &&
    (typeof z === 'number' || z instanceof FloatNode)
  ) {
    return new ComponentsVec3Node(float(x), float(y), float(z));
  } else if (x instanceof Vector3 || x instanceof Vector4) {
    return new ConstantVec3Node(x);
  } else {
    throw new Error('Invalid arguments for vec3');
  }
}

export function vec4(
  x: number | Vector4 | Vec3Node,
  y: number | FloatNode,
  z?: number,
  w?: number
): Vec4Node {
  if (x instanceof Vec3Node) {
    if (typeof y === 'number') {
      return new ComponentsVec4Node(getX(x), getY(x), getZ(x), float(y));
    } else {
      return new ComponentsVec4Node(getX(x), getY(x), getZ(x), y);
    }
  } else if (typeof x === 'number') {
    return new ConstantVec4Node(new Vector4(x, y as number, z, w));
  }
  return new ConstantVec4Node(x);
}

export function texture2d(
  sampler2d: Sampler2DNode,
  cord: Vec2Node,
  bias?: FloatNode
): RgbaNode {
  return sampler2d.sample(cord, bias);
}
