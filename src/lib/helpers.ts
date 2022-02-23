import { Compiler, ShaderNode } from './compiler';
import {
  FloatNode,
  IRgbaNode,
  IRgbNode,
  IVec3Node,
  IVec4Node,
  RgbaNode,
} from './types';

export class SelectorNode<T> implements ShaderNode<string> {
  constructor(
    private readonly other: ShaderNode<T>,
    private readonly selector: (out: T) => string
  ) {}
  public compile(c: Compiler) {
    const o = this.other.compile(c);
    return {
      out: this.selector(o.out as T),
    };
  }
}

// This should probably be moved elsewhere
export class Vec3ComponentsNode
  implements
    ShaderNode<{ readonly x: string; readonly y: string; readonly z: string }>
{
  constructor(private readonly vec: IVec3Node) {}
  public compile(c: Compiler) {
    const v = this.vec.compile(c);
    const k = c.variable();
    return {
      chunk: `
        ${v.chunk}
        float float_${k}_x = ${v.out[0]}.x;
        float float_${k}_y = ${v.out[0]}.y;
        float float_${k}_z = ${v.out[0]}.z;
      `,
      out: {
        x: `float_${k}_x`,
        y: `float_${k}_y`,
        z: `float_${k}_z`,
      },
    };
  }
  // Not sure if I want this here or just one output
  public get x() {
    return new SelectorNode(this, (out) => out.x);
  }
  public get y() {
    return new SelectorNode(this, (out) => out.y);
  }
  public get z() {
    return new SelectorNode(this, (out) => out.z);
  }
  // This is an alternative. This could be a good solution for creating a nicer API later.
  public get outputs() {
    return { x: this.x, y: this.y, z: this.y }; // Or should it instead return another vector?
  }
}

class GetFloatComponentNode extends FloatNode {
  constructor(
    private readonly vec: IVec3Node,
    private readonly component: string
  ) {
    super();
  }
  public compile(c: Compiler) {
    return {
      out: `${c.get(this.vec)}.${this.component}`,
    };
  }
}

export function getX(vec: IVec3Node | IVec4Node | IRgbNode | IRgbaNode) {
  return new GetFloatComponentNode(vec, 'x');
}

export function getY(vec: IVec3Node | IVec4Node | IRgbNode | IRgbaNode) {
  return new GetFloatComponentNode(vec, 'y');
}

export function getZ(vec: IVec3Node | IVec4Node | IRgbNode | IRgbaNode) {
  return new GetFloatComponentNode(vec, 'z');
}

export function getW(vec: IVec4Node | IRgbaNode) {
  return new GetFloatComponentNode(vec, 'w');
}

export class AssignNode implements ShaderNode<string> {
  constructor(
    private readonly name: string,
    private readonly node: ShaderNode<string>
  ) {}
  public compile(c: Compiler) {
    const fc = c.get(this.node);
    return {
      chunk: `
        ${this.name} = ${fc};
      `,
      out: `${this.name}`,
    };
  }
}

export class LinearToOutputTexelNode extends RgbaNode {
  constructor(private readonly node: IRgbaNode) {
    super();
  }
  public compile(c: Compiler) {
    const k = c.variable();
    return {
      chunk: `vec4 encoded_${k} = linearToOutputTexel(${c.get(this.node)});`,
      out: `encoded_${k}`,
    };
  }
}
