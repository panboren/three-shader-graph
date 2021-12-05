import {
  Color,
  ColorRepresentation,
  Matrix4,
  Vector2,
  Vector3,
  Vector4,
} from 'three';

import { Compiler, CompileResult, ShaderNode } from './compiler';

// Common for types
function compileBiOperator<T extends ShaderNode<string>>(
  a: T,
  b: T,
  op: string,
  type: string,
  c: Compiler
) {
  const k = c.variable();
  return {
    chunk: `
      ${type} ${type}_op_${k} = ${c.get(a)} ${op} ${c.get(b)};
    `,
    out: `${type}_op_${k}`,
  };
}

// Boolean
export abstract class BooleanNode implements ShaderNode<string> {
  static readonly typeName = 'bool';
  public abstract compile(c: Compiler);
  public isBoolean() {
    return true;
  }

  public and(other: BooleanNode) {
    return new BoolAddNode(this, other);
  }

  public or(other: BooleanNode) {
    return new BoolOrNode(this, other);
  }
}

export class ConstantBooleanNode extends BooleanNode {
  constructor(private readonly bool: boolean) {
    super();
  }
  public isBoolean() {
    return true;
  }

  public compile(c: Compiler) {
    return {
      out: `${this.bool}`,
    };
  }
}

export class BoolBiOperatorNode extends BooleanNode {
  constructor(
    private readonly a: IVec2Node,
    private readonly b: IVec2Node,
    private readonly op: string
  ) {
    super();
  }
  public compile(c: Compiler) {
    return compileBiOperator(this.a, this.b, this.op, 'bool', c);
  }
}

export class BoolAddNode extends BoolBiOperatorNode {
  constructor(a: BooleanNode, b: BooleanNode) {
    super(a, b, '&&');
  }
}

export class BoolOrNode extends BoolBiOperatorNode {
  constructor(a: BooleanNode, b: BooleanNode) {
    super(a, b, '||');
  }
}

export type IIntNode = ShaderNode & {};

export abstract class IntNode implements IIntNode {
  static readonly typeName = 'int';
  public abstract compile(c: Compiler);
  public isInt() {
    return true;
  }

  public add(other: IIntNode) {
    return new IntAddNode(this, other);
  }
  public subtract(other: IIntNode) {
    return new IntSubtractNode(this, other);
  }
  public multiply(other: IIntNode) {
    return new IntMultiplyNode(this, other);
  }
  public gt(other: IntNode): BooleanNode {
    return new IntGtNode(this, other);
  }
  public lt(other: IntNode): BooleanNode {
    return new IntLtNode(this, other);
  }
  public gte(other: IntNode): BooleanNode {
    return new IntGteNode(this, other);
  }
  public lte(other: IntNode): BooleanNode {
    return new IntLteNode(this, other);
  }
  public equals(other: IntNode): BooleanNode {
    return equals(this, other);
  }
  public notEquals(other: IntNode): BooleanNode {
    return notEquals(this, other);
  }
}

export class ConstantIntNode extends IntNode {
  constructor(public readonly number: number) {
    super();
  }
  public compile(c: Compiler) {
    return {
      out: `${Math.floor(this.number)}`,
    };
  }
}

export class IntBiOperatorNode extends IntNode {
  constructor(
    private readonly a: IIntNode,
    private readonly b: IIntNode,
    private readonly op: string
  ) {
    super();
  }
  public compile(c: Compiler) {
    return compileBiOperator(this.a, this.b, this.op, 'int', c);
  }
}

export class IntAddNode extends IntBiOperatorNode {
  constructor(a: IIntNode, b: IIntNode) {
    super(a, b, '+');
  }
}

export class IntSubtractNode extends IntBiOperatorNode {
  constructor(a: IIntNode, b: IIntNode) {
    super(a, b, '-');
  }
}

export class IntDivNode extends IntBiOperatorNode {
  constructor(a: IIntNode, b: IIntNode) {
    super(a, b, '/');
  }
}

export class IntMultiplyNode extends IntBiOperatorNode {
  constructor(a: IIntNode, b: IIntNode) {
    super(a, b, '*');
  }
}

// Float

export type IFloatNode = ShaderNode & {};

export abstract class FloatNode implements IFloatNode {
  static readonly typeName = 'float';
  public abstract compile(c: Compiler);
  public isFloat() {
    return true;
  }

  public add(other: IFloatNode) {
    return new FloatAddNode(this, other);
  }
  public subtract(other: IFloatNode) {
    return new FloatSubtractNode(this, other);
  }
  public divide(other: IFloatNode) {
    return new FloatDivNode(this, other);
  }
  public multiply(other: IFloatNode) {
    return new FloatMultiplyNode(this, other);
  }
  public multiplyVec2(other: IVec3Node) {
    return new FloatVec2MultiplyNode(this, other);
  }
  public multiplyVec3(other: IVec3Node) {
    return new FloatVec3MultiplyNode(this, other);
  }
  public multiplyVec4(other: IVec3Node) {
    return new FloatVec4MultiplyNode(this, other);
  }
  public gt(other: FloatNode): BooleanNode {
    return new GtNode(this, other);
  }
  public lt(other: FloatNode): BooleanNode {
    return new LtNode(this, other);
  }
  public gte(other: FloatNode): BooleanNode {
    return new GteNode(this, other);
  }
  public lte(other: FloatNode): BooleanNode {
    return new LteNode(this, other);
  }
  public equals(other: FloatNode): BooleanNode {
    return equals(this, other);
  }
  public notEquals(other: FloatNode): BooleanNode {
    return notEquals(this, other);
  }
}

export class ConstantFloatNode extends FloatNode {
  constructor(public readonly number: number) {
    super();
  }
  public compile(c: Compiler) {
    return {
      out: `${this.number.toFixed(10)}`,
    };
  }
}

export class FloatBiOperatorNode extends FloatNode {
  constructor(
    private readonly a: IFloatNode,
    private readonly b: IFloatNode,
    private readonly op: string
  ) {
    super();
  }
  public compile(c: Compiler) {
    return compileBiOperator(this.a, this.b, this.op, 'float', c);
  }
}

export class FloatAddNode extends FloatBiOperatorNode {
  constructor(a: IFloatNode, b: IFloatNode) {
    super(a, b, '+');
  }
}

export class FloatSubtractNode extends FloatBiOperatorNode {
  constructor(a: IFloatNode, b: IFloatNode) {
    super(a, b, '-');
  }
}

export class FloatDivNode extends FloatBiOperatorNode {
  constructor(a: IFloatNode, b: IFloatNode) {
    super(a, b, '/');
  }
}

export class FloatMultiplyNode extends FloatBiOperatorNode {
  constructor(a: IFloatNode, b: IFloatNode) {
    super(a, b, '*');
  }
}

export type IVec2Node = ShaderNode & {};
export type IVec3Node = ShaderNode & {};
export type IVec4Node = ShaderNode & {};
export type IRgbNode = ShaderNode & {};
export type IRgbaNode = ShaderNode & {};
export type IMat2Node = ShaderNode & {};
export type IMat3Node = ShaderNode & {};
export type IMat4Node = ShaderNode & {};

// Vec2
export abstract class Vec2Node implements IVec2Node {
  static readonly typeName = 'vec2';
  public abstract compile(c: Compiler);
  public isVec2() {
    return true;
  }

  public x() {
    return getX(this);
  }

  public y() {
    return getY(this);
  }

  public subtractScalar(other: FloatNode): Vec2Node {
    return new Vec2FloatSubtractNode(this, other);
  }
  public subtract(other: Vec2Node): Vec2Node {
    return new Vec2SubtractNode(this, other);
  }
  public addScalar(other: FloatNode): Vec2Node {
    return new Vec2FloatAddNode(this, other);
  }
  public add(other: Vec2Node): Vec2Node {
    return new Vec2AddNode(this, other);
  }
  public divideScalar(other: FloatNode): Vec2Node {
    return new Vec2FloatDivideNode(this, other);
  }
  public divide(other: Vec2Node): Vec2Node {
    return new Vec2DivNode(this, other);
  }
  public multiplyScalar(other: FloatNode): Vec2Node {
    return new Vec2FloatMultiplyNode(this, other);
  }
  public multiply(other: Vec2Node): Vec2Node {
    return new Vec2MultiplyNode(this, other);
  }
  public multiplyMat(other: Mat2Node): Vec2Node {
    return new VecMat2MultiplyNode(this, other);
  }
  public equals(other: Vec2Node): BooleanNode {
    return equals(this, other);
  }
  public notEquals(other: Vec2Node): BooleanNode {
    return notEquals(this, other);
  }
}

export class ConstantVec2Node extends Vec2Node {
  constructor(private readonly vec: Vector2 | Vector3 | Vector4) {
    super();
  }
  public compile(c: Compiler) {
    const k = c.variable();
    return {
      chunk: `vec2 vec2_${k} = vec2(${this.vec.x.toFixed(
        10
      )},${this.vec.y.toFixed(10)});`,
      out: `vec2_${k}`,
    };
  }
}

export class ComponentsVec2Node extends Vec2Node {
  constructor(
    private readonly _x: IFloatNode,
    private readonly _y: IFloatNode
  ) {
    super();
  }
  public compile(c: Compiler) {
    return {
      out: `vec2(${c.get(this._x)},${c.get(this._y)})`,
    };
  }
}

export class Vec2BiOperatorNode extends Vec2Node {
  constructor(
    private readonly a: IVec2Node,
    private readonly b: IVec2Node,
    private readonly op: string
  ) {
    super();
  }
  public compile(c: Compiler) {
    return compileBiOperator(this.a, this.b, this.op, 'vec2', c);
  }
}

export class Vec2AddNode extends Vec2BiOperatorNode {
  constructor(a: IVec2Node, b: IVec2Node) {
    super(a, b, '+');
  }
}

export class Vec2SubtractNode extends Vec2BiOperatorNode {
  constructor(a: IVec2Node, b: IVec2Node) {
    super(a, b, '-');
  }
}

export class Vec2FloatAddNode extends Vec2BiOperatorNode {
  constructor(a: IVec2Node, b: IFloatNode) {
    super(a, b, '+');
  }
}

export class Vec2FloatSubtractNode extends Vec2BiOperatorNode {
  constructor(a: IVec2Node, b: IFloatNode) {
    super(a, b, '-');
  }
}

export class Vec2FloatMultiplyNode extends Vec2BiOperatorNode {
  constructor(a: IVec2Node, b: IFloatNode) {
    super(a, b, '*');
  }
}

export class Vec2FloatDivideNode extends Vec2BiOperatorNode {
  constructor(a: IVec2Node, b: IFloatNode) {
    super(a, b, '/');
  }
}

export class Vec2DivNode extends Vec2BiOperatorNode {
  constructor(a: IVec2Node, b: IVec2Node) {
    super(a, b, '/');
  }
}

export class Vec2MultiplyNode extends Vec2BiOperatorNode {
  constructor(a: IVec2Node, b: IVec2Node) {
    super(a, b, '*');
  }
}

export class FloatVec2MultiplyNode extends Vec2BiOperatorNode {
  constructor(a: IFloatNode, b: IVec2Node) {
    super(a, b, '*');
  }
}

// Vec3
export abstract class Vec3Node implements IVec3Node {
  static readonly typeName = 'vec3';
  public abstract compile(c: Compiler);
  public isVec3() {
    return true;
  }

  public x() {
    return getX(this);
  }

  public y() {
    return getY(this);
  }

  public z() {
    return getZ(this);
  }
  public xy() {
    return new ComponentsVec2Node(getX(this), getY(this));
  }
  public xz() {
    return new ComponentsVec2Node(getX(this), getZ(this));
  }
  public yz() {
    return new ComponentsVec2Node(getY(this), getZ(this));
  }

  public rgb() {
    return new ComponentsRgbNode(this.x(), this.y(), this.z());
  }

  public subtractScalar(other: FloatNode): Vec3Node {
    return new Vec3FloatSubtractNode(this, other);
  }
  public subtract(other: Vec3Node): Vec3Node {
    return new Vec3SubtractNode(this, other);
  }
  public addScalar(other: FloatNode): Vec3Node {
    return new Vec3FloatAddNode(this, other);
  }
  public add(other: Vec3Node): Vec3Node {
    return new Vec3AddNode(this, other);
  }
  public divideScalar(other: FloatNode): Vec3Node {
    return new Vec3FloatDivideNode(this, other);
  }
  public divide(other: Vec3Node): Vec3Node {
    return new Vec3DivNode(this, other);
  }
  public multiplyScalar(other: FloatNode): Vec3Node {
    return new Vec3FloatMultiplyNode(this, other);
  }
  public multiply(other: Vec3Node): Vec3Node {
    return new Vec3MultiplyNode(this, other);
  }
  public multiplyMat(other: Mat3Node): Vec3Node {
    return new VecMat3MultiplyNode(this, other);
  }
  public equals(other: Vec3Node): BooleanNode {
    return equals(this, other);
  }
  public notEquals(other: Vec3Node): BooleanNode {
    return notEquals(this, other);
  }
}

export class ConstantVec3Node extends Vec3Node {
  constructor(private readonly vec: Vector3 | Vector4) {
    super();
  }
  public compile(c: Compiler) {
    const k = c.variable();
    return {
      chunk: `vec3 vec3_${k} = vec3(${this.vec.x.toFixed(
        10
      )},${this.vec.y.toFixed(10)},${this.vec.z.toFixed(10)});`,
      out: `vec3_${k}`,
    };
  }
}

export class ComponentsVec3Node extends Vec3Node {
  constructor(
    private readonly _x: IFloatNode,
    private readonly _y: IFloatNode,
    private readonly _z: IFloatNode
  ) {
    super();
  }
  public compile(c: Compiler) {
    return {
      out: `vec3(${c.get(this._x)},${c.get(this._y)},${c.get(this._z)})`,
    };
  }
}

export class Vec3BiOperatorNode extends Vec3Node {
  constructor(
    private readonly a: IVec3Node,
    private readonly b: IVec3Node,
    private readonly op: string
  ) {
    super();
  }
  public compile(c: Compiler) {
    return compileBiOperator(this.a, this.b, this.op, 'vec3', c);
  }
}

export class Vec3AddNode extends Vec3BiOperatorNode {
  constructor(a: IVec3Node, b: IVec3Node) {
    super(a, b, '+');
  }
}

export class Vec3SubtractNode extends Vec3BiOperatorNode {
  constructor(a: IVec3Node, b: IVec3Node) {
    super(a, b, '-');
  }
}

export class Vec3FloatAddNode extends Vec3BiOperatorNode {
  constructor(a: IVec3Node, b: IFloatNode) {
    super(a, b, '+');
  }
}

export class Vec3FloatSubtractNode extends Vec3BiOperatorNode {
  constructor(a: IVec3Node, b: IFloatNode) {
    super(a, b, '-');
  }
}

export class Vec3FloatMultiplyNode extends Vec3BiOperatorNode {
  constructor(a: IVec3Node, b: IFloatNode) {
    super(a, b, '*');
  }
}

export class Vec3FloatDivideNode extends Vec3BiOperatorNode {
  constructor(a: IVec3Node, b: IFloatNode) {
    super(a, b, '/');
  }
}

export class Vec3DivNode extends Vec3BiOperatorNode {
  constructor(a: IVec3Node, b: IVec3Node) {
    super(a, b, '/');
  }
}

export class Vec3MultiplyNode extends Vec3BiOperatorNode {
  constructor(a: IVec3Node, b: IVec3Node) {
    super(a, b, '*');
  }
}

export class FloatVec3MultiplyNode extends Vec3BiOperatorNode {
  constructor(a: IFloatNode, b: IVec3Node) {
    super(a, b, '*');
  }
}

// Vec4
export abstract class Vec4Node implements IVec4Node {
  static readonly typeName = 'vec4';
  public abstract compile(c: Compiler);
  public isVec4() {
    return true;
  }

  public x() {
    return getX(this);
  }

  public y() {
    return getY(this);
  }

  public z() {
    return getZ(this);
  }

  public w() {
    return getW(this);
  }

  public xy() {
    return new ComponentsVec2Node(getX(this), getY(this));
  }

  public xyz() {
    return new ComponentsVec3Node(getX(this), getY(this), getZ(this));
  }

  public rgb() {
    return new ComponentsRgbNode(this.x(), this.y(), this.z());
  }

  public rgba() {
    return new ComponentsRgbaNode(this.x(), this.y(), this.z(), this.w());
  }

  public subtractScalar(other: FloatNode): Vec4Node {
    return new Vec4FloatSubtractNode(this, other);
  }
  public subtract(other: Vec4Node): Vec4Node {
    return new Vec4SubtractNode(this, other);
  }
  public addScalar(other: FloatNode): Vec4Node {
    return new Vec4FloatAddNode(this, other);
  }
  public add(other: Vec4Node): Vec4Node {
    return new Vec4AddNode(this, other);
  }
  public divideScalar(other: FloatNode): Vec4Node {
    return new Vec4FloatDivideNode(this, other);
  }
  public divide(other: Vec4Node): Vec4Node {
    return new Vec4DivNode(this, other);
  }
  public multiplyScalar(other: FloatNode): Vec4Node {
    return new Vec4FloatMultiplyNode(this, other);
  }
  public multiply(other: Vec4Node): Vec4Node {
    return new Vec4MultiplyNode(this, other);
  }
  public multiplyMat(other: Mat4Node): Vec4Node {
    return new VecMat4MultiplyNode(this, other);
  }
  public equals(other: Vec4Node): BooleanNode {
    return equals(this, other);
  }
  public notEquals(other: Vec4Node): BooleanNode {
    return notEquals(this, other);
  }
}

export class ConstantVec4Node extends Vec4Node {
  constructor(private readonly vec: Vector4) {
    super();
  }
  public compile(c: Compiler) {
    const k = c.variable();
    return {
      chunk: `vec4 vec4_${k} = vec4(${this.vec.x.toFixed(
        10
      )},${this.vec.y.toFixed(10)},${this.vec.z.toFixed(
        10
      )},${this.vec.w.toFixed(10)});`,
      out: `vec4_${k}`,
    };
  }
}

export class ComponentsVec4Node extends Vec4Node {
  constructor(
    private readonly _x: IFloatNode,
    private readonly _y: IFloatNode,
    private readonly _z: IFloatNode,
    private readonly _w: IFloatNode
  ) {
    super();
  }
  public compile(c: Compiler) {
    const k = c.variable();
    return {
      chunk: `vec4 comps_${k} = vec4(${c.get(this._x)},${c.get(
        this._y
      )},${c.get(this._z)},${c.get(this._w)});`,
      out: `comps_${k}`,
    };
  }
}

export class Vec4BiOperatorNode extends Vec4Node {
  constructor(
    private readonly a: IVec4Node,
    private readonly b: IVec4Node,
    private readonly op: string
  ) {
    super();
  }
  public compile(c: Compiler) {
    return compileBiOperator(this.a, this.b, this.op, 'vec4', c);
  }
}

export class Vec4AddNode extends Vec4BiOperatorNode {
  constructor(a: IVec4Node, b: IVec4Node) {
    super(a, b, '+');
  }
}

export class Vec4SubtractNode extends Vec4BiOperatorNode {
  constructor(a: IVec4Node, b: IVec4Node) {
    super(a, b, '-');
  }
}

export class Vec4FloatAddNode extends Vec4BiOperatorNode {
  constructor(a: IVec4Node, b: IFloatNode) {
    super(a, b, '+');
  }
}

export class Vec4FloatSubtractNode extends Vec4BiOperatorNode {
  constructor(a: IVec4Node, b: IFloatNode) {
    super(a, b, '-');
  }
}

export class Vec4FloatMultiplyNode extends Vec4BiOperatorNode {
  constructor(a: IVec4Node, b: IFloatNode) {
    super(a, b, '*');
  }
}

export class Vec4FloatDivideNode extends Vec4BiOperatorNode {
  constructor(a: IVec4Node, b: IFloatNode) {
    super(a, b, '/');
  }
}

export class Vec4DivNode extends Vec4BiOperatorNode {
  constructor(a: IVec4Node, b: IVec4Node) {
    super(a, b, '/');
  }
}

export class Vec4MultiplyNode extends Vec4BiOperatorNode {
  constructor(a: IVec4Node, b: IVec4Node) {
    super(a, b, '*');
  }
}

export class FloatVec4MultiplyNode extends Vec4BiOperatorNode {
  constructor(a: IFloatNode, b: IVec4Node) {
    super(a, b, '*');
  }
}

// Mat2
export abstract class Mat2Node implements IMat2Node {
  static readonly typeName = 'mat2';
  public abstract compile(c: Compiler);
  public isMat2() {
    return true;
  }

  add(other: Mat2Node): Mat2Node {
    return new Mat2AddNode(this, other);
  }
  subtract(other: Mat2Node): Mat2Node {
    return new Mat2SubtractNode(this, other);
  }
  divideScalar(other: FloatNode): Mat2Node {
    return new Mat2FloatDivNode(this, other);
  }
  multiplyScalar(other: Vec2Node): Mat2Node {
    return new Mat2FloatMultiplyNode(this, other);
  }
  multiplyVec(other: Vec2Node): Vec2Node {
    return new MatVec2MultiplyNode(this, other);
  }
  multiply(other: Mat2Node): Mat2Node {
    return new Mat2MultiplyNode(this, other);
  }
  public equals(other: Mat2Node): BooleanNode {
    return equals(this, other);
  }
  public notEquals(other: Mat2Node): BooleanNode {
    return notEquals(this, other);
  }
}

export class ConstantMat2Node extends Mat2Node {
  constructor(
    private readonly a: number,
    private readonly b: number,
    private readonly c: number,
    private readonly d: number
  ) {
    super();
  }
  public compile(c: Compiler) {
    const k = c.variable();
    return {
      chunk: `mat2 mat2_${k} = mat2(${this.a.toFixed(10)},${this.b.toFixed(
        10
      )},${this.c.toFixed(10)},${this.d.toFixed(10)});`,
      out: `mat2_${k}`,
    };
  }
}

export class ComponentsMat2Node extends Mat2Node {
  constructor(
    private readonly a: IFloatNode,
    private readonly b: IFloatNode,
    private readonly c: IFloatNode,
    private readonly d: IFloatNode
  ) {
    super();
  }
  public compile(c: Compiler) {
    return {
      out: `mat2(${c.get(this.a)},${c.get(this.b)},${c.get(this.c)},${c.get(
        this.d
      )})`,
    };
  }
}

export class Mat2BiOperatorNode extends Mat2Node {
  constructor(
    private readonly a: IMat2Node,
    private readonly b: IMat2Node,
    private readonly op: string
  ) {
    super();
  }
  public compile(c: Compiler) {
    return compileBiOperator(this.a, this.b, this.op, 'mat2', c);
  }
}

export class Mat2AddNode extends Mat2BiOperatorNode {
  constructor(a: IMat2Node, b: IMat2Node) {
    super(a, b, '+');
  }
}

export class Mat2SubtractNode extends Mat2BiOperatorNode {
  constructor(a: IMat2Node, b: IMat2Node) {
    super(a, b, '-');
  }
}

export class Mat2MultiplyNode extends Mat2BiOperatorNode {
  constructor(a: IMat2Node, b: IMat2Node) {
    super(a, b, '*');
  }
}

export class Mat2FloatDivNode extends Mat2BiOperatorNode {
  constructor(a: IMat2Node, b: IFloatNode) {
    super(a, b, '*');
  }
}

export class Mat2FloatMultiplyNode extends Mat2BiOperatorNode {
  constructor(a: IMat2Node, b: IFloatNode) {
    super(a, b, '*');
  }
}

export class VecMat2MultiplyNode extends Vec2BiOperatorNode {
  constructor(a: Vec2Node, b: Mat2Node) {
    super(a, b, '*');
  }
}

export class MatVec2MultiplyNode extends Vec2BiOperatorNode {
  constructor(a: Mat2Node, b: Vec2Node) {
    super(a, b, '*');
  }
}

// Mat3
export abstract class Mat3Node implements IMat3Node {
  static readonly typeName = 'mat3';
  public abstract compile(c: Compiler);
  public isMat3() {
    return true;
  }

  add(other: Mat3Node): Mat3Node {
    return new Mat3AddNode(this, other);
  }
  subtract(other: Mat3Node): Mat3Node {
    return new Mat3SubtractNode(this, other);
  }
  divideScalar(other: FloatNode): Mat3Node {
    return new Mat3FloatDivNode(this, other);
  }
  multiplyScalar(other: Vec3Node): Mat3Node {
    return new Mat3FloatMultiplyNode(this, other);
  }
  multiplyVec(other: Vec3Node): Vec3Node {
    return new MatVec3MultiplyNode(this, other);
  }
  multiply(other: Mat3Node): Mat3Node {
    return new Mat3MultiplyNode(this, other);
  }
  public equals(other: Mat3Node): BooleanNode {
    return equals(this, other);
  }
  public notEquals(other: Mat3Node): BooleanNode {
    return notEquals(this, other);
  }
}

export class ConstantMat3Node extends Mat3Node {
  constructor(
    private readonly a: number,
    private readonly b: number,
    private readonly c: number,
    private readonly d: number,
    private readonly e: number,
    private readonly f: number,
    private readonly g: number,
    private readonly h: number,
    private readonly i: number
  ) {
    super();
  }
  public compile(c: Compiler) {
    const k = c.variable();
    return {
      chunk: `mat3 mat3_${k} = mat3(
        ${this.a.toFixed(10)},${this.b.toFixed(10)},${this.c.toFixed(10)},
        ${this.d.toFixed(10)},${this.e.toFixed(10)},${this.f.toFixed(10)},
        ${this.g.toFixed(10)},${this.h.toFixed(10)},${this.i.toFixed(10)}
      );`,
      out: `mat3_${k}`,
    };
  }
}
export class ComponentsMat3Node extends Mat3Node {
  constructor(
    private readonly a: FloatNode,
    private readonly b: FloatNode,
    private readonly c: FloatNode,
    private readonly d: FloatNode,
    private readonly e: FloatNode,
    private readonly f: FloatNode,
    private readonly g: FloatNode,
    private readonly h: FloatNode,
    private readonly i: FloatNode
  ) {
    super();
  }
  public compile(c: Compiler) {
    return {
      out: `mat3(
        ${c.get(this.a)},${c.get(this.b)},${c.get(this.c)},
        ${c.get(this.d)},${c.get(this.e)},${c.get(this.f)},
        ${c.get(this.g)},${c.get(this.h)},${c.get(this.i)}
      )`,
    };
  }
}
export class Mat3BiOperatorNode extends Mat3Node {
  constructor(
    private readonly a: IMat3Node,
    private readonly b: IMat3Node,
    private readonly op: string
  ) {
    super();
  }
  public compile(c: Compiler) {
    return compileBiOperator(this.a, this.b, this.op, 'mat3', c);
  }
}

export class Mat3AddNode extends Mat3BiOperatorNode {
  constructor(a: IMat3Node, b: IMat3Node) {
    super(a, b, '+');
  }
}

export class Mat3SubtractNode extends Mat3BiOperatorNode {
  constructor(a: IMat3Node, b: IMat3Node) {
    super(a, b, '-');
  }
}

export class Mat3MultiplyNode extends Mat3BiOperatorNode {
  constructor(a: IMat3Node, b: IMat3Node) {
    super(a, b, '*');
  }
}

export class Mat3FloatDivNode extends Mat3BiOperatorNode {
  constructor(a: IMat3Node, b: IFloatNode) {
    super(a, b, '*');
  }
}

export class Mat3FloatMultiplyNode extends Mat3BiOperatorNode {
  constructor(a: IMat3Node, b: IFloatNode) {
    super(a, b, '*');
  }
}

export class VecMat3MultiplyNode extends Vec3BiOperatorNode {
  constructor(a: Vec3Node, b: Mat3Node) {
    super(a, b, '*');
  }
}

export class MatVec3MultiplyNode extends Vec3BiOperatorNode {
  constructor(a: Mat3Node, b: Vec3Node) {
    super(a, b, '*');
  }
}

// Mat4
export abstract class Mat4Node implements IMat4Node {
  static readonly typeName = 'mat4';
  public abstract compile(c: Compiler);
  public isMat4() {
    return true;
  }

  add(other: Mat4Node): Mat4Node {
    return new Mat4AddNode(this, other);
  }
  subtract(other: Mat4Node): Mat4Node {
    return new Mat4SubtractNode(this, other);
  }
  divideScalar(other: FloatNode): Mat4Node {
    return new Mat4FloatDivNode(this, other);
  }
  multiplyScalar(other: FloatNode): Mat4Node {
    return new Mat4FloatMultiplyNode(this, other);
  }
  multiplyVec(other: Vec4Node): Vec4Node {
    return new MatVec4MultiplyNode(this, other);
  }
  multiply(other: Mat4Node): Mat4Node {
    return new Mat4MultiplyNode(this, other);
  }
  public equals(other: Mat4Node): BooleanNode {
    return equals(this, other);
  }
  public notEquals(other: Mat4Node): BooleanNode {
    return notEquals(this, other);
  }
}

export class ConstantMat4Node extends Mat4Node {
  constructor(
    private readonly a1: number | Matrix4,
    private readonly b1?: number,
    private readonly c1?: number,
    private readonly d1?: number,
    private readonly a2?: number,
    private readonly b2?: number,
    private readonly c2?: number,
    private readonly d2?: number,
    private readonly a3?: number,
    private readonly b3?: number,
    private readonly c3?: number,
    private readonly d3?: number,
    private readonly a4?: number,
    private readonly b4?: number,
    private readonly c4?: number,
    private readonly d4?: number
  ) {
    super();
  }
  public compile(c: Compiler) {
    const k = c.variable();
    if (
      typeof this.a1 == 'number' &&
      typeof this.a2 == 'number' &&
      typeof this.a3 == 'number' &&
      typeof this.a4 == 'number' &&
      typeof this.b1 == 'number' &&
      typeof this.b2 == 'number' &&
      typeof this.b3 == 'number' &&
      typeof this.b4 == 'number' &&
      typeof this.c1 == 'number' &&
      typeof this.c2 == 'number' &&
      typeof this.c3 == 'number' &&
      typeof this.c4 == 'number' &&
      typeof this.d1 == 'number' &&
      typeof this.d2 == 'number' &&
      typeof this.d3 == 'number' &&
      typeof this.d4 == 'number'
    ) {
      return {
        chunk: `mat4 mat4_${k} = mat4(
          ${this.a1.toFixed(10)},${this.b1.toFixed(10)},${this.c1.toFixed(
          10
        )},${this.d1.toFixed(10)},
          ${this.a2.toFixed(10)},${this.b2.toFixed(10)},${this.c2.toFixed(
          10
        )},${this.d2.toFixed(10)},
          ${this.a3.toFixed(10)},${this.b3.toFixed(10)},${this.c3.toFixed(
          10
        )},${this.d3.toFixed(10)},
          ${this.a4.toFixed(10)},${this.b4.toFixed(10)},${this.c4.toFixed(
          10
        )},${this.d4.toFixed(10)}
        );`,
        out: `mat4_${k}`,
      };
    } else if (this.a1 instanceof Matrix4) {
      const m = this.a1
        .toArray()
        .map((v) => v.toFixed(10))
        .join(',');
      return {
        chunk: `mat4 mat4_${k} = mat4(${m});`,
        out: `mat4_${k}`,
      };
    } else {
      throw new Error('Invalid parameters to Matrix4');
    }
  }
}

export class ComponentsMat4Node extends Mat4Node {
  constructor(
    private readonly a1: IFloatNode,
    private readonly b1: IFloatNode,
    private readonly c1: IFloatNode,
    private readonly d1: IFloatNode,
    private readonly a2: IFloatNode,
    private readonly b2: IFloatNode,
    private readonly c2: IFloatNode,
    private readonly d2: IFloatNode,
    private readonly a3: IFloatNode,
    private readonly b3: IFloatNode,
    private readonly c3: IFloatNode,
    private readonly d3: IFloatNode,
    private readonly a4: IFloatNode,
    private readonly b4: IFloatNode,
    private readonly c4: IFloatNode,
    private readonly d4: IFloatNode
  ) {
    super();
  }
  public compile(c: Compiler) {
    return {
      out: `mat4(
        ${c.get(this.a1)},${c.get(this.b1)},${c.get(this.c1)},${c.get(this.d1)},
        ${c.get(this.a2)},${c.get(this.b2)},${c.get(this.c2)},${c.get(this.d2)},
        ${c.get(this.a3)},${c.get(this.b3)},${c.get(this.c3)},${c.get(this.d3)},
        ${c.get(this.a4)},${c.get(this.b4)},${c.get(this.c4)},${c.get(this.d4)}
      )`,
    };
  }
}

export class Mat4BiOperatorNode extends Mat4Node {
  constructor(
    private readonly a: IMat4Node,
    private readonly b: IMat4Node,
    private readonly op: string
  ) {
    super();
  }
  public compile(c: Compiler) {
    return compileBiOperator(this.a, this.b, this.op, 'mat4', c);
  }
}

export class Mat4AddNode extends Mat4BiOperatorNode {
  constructor(a: IMat4Node, b: IMat4Node) {
    super(a, b, '+');
  }
}

export class Mat4SubtractNode extends Mat4BiOperatorNode {
  constructor(a: IMat4Node, b: IMat4Node) {
    super(a, b, '-');
  }
}

export class Mat4MultiplyNode extends Mat4BiOperatorNode {
  constructor(a: IMat4Node, b: IMat4Node) {
    super(a, b, '*');
  }
}

export class Mat4FloatDivNode extends Mat4BiOperatorNode {
  constructor(a: IMat4Node, b: IFloatNode) {
    super(a, b, '/');
  }
}

export class Mat4FloatMultiplyNode extends Mat4BiOperatorNode {
  constructor(a: IMat4Node, b: IFloatNode) {
    super(a, b, '*');
  }
}

export class VecMat4MultiplyNode extends Vec4BiOperatorNode {
  constructor(a: Vec4Node, b: Mat4Node) {
    super(a, b, '*');
  }
}

export class MatVec4MultiplyNode extends Vec4BiOperatorNode {
  constructor(a: Mat4Node, b: Vec4Node) {
    super(a, b, '*');
  }
}

// Rgb and Rgba
// A more easily read interface but have all the capabilities of Vec3 and Vec4

export abstract class RgbaNode extends Vec4Node implements IRgbaNode {
  public abstract compile(c: Compiler);
  public isRgba() {
    return true;
  }
  public r() {
    return this.x()
  }
  public g() {
    return this.y()
  }
  public b() {
    return this.z()
  }
  public a() {
    return this.w();
  }
}

export class ConstantRgbaNode extends RgbaNode {
  constructor(
    public readonly color: ColorRepresentation,
    private readonly alpha: number = 1.0
  ) {
    super();
  }
  public compile(c: Compiler) {
    const vec = new Color(this.color);
    const k = c.variable();
    return {
      chunk: `vec4 vec4_${k} = vec4(${vec.r.toFixed(10)},${vec.g.toFixed(
        10
      )},${vec.b.toFixed(10)},${this.alpha.toFixed(10)});`,
      out: `vec4_${k}`,
    };
  }
}

export abstract class RgbNode extends Vec3Node implements IRgbNode {
  public abstract compile(c: Compiler);
  public isRgb() {
    return true;
  }
  public r() {
    return this.x()
  }
  public g() {
    return this.y()
  }
  public b() {
    return this.z()
  }
  public rgba(alpha: IFloatNode) {
    return new RgbToRgbaNode(this, alpha);
  }
}

export class ComponentsRgbaNode extends RgbaNode {
  constructor(
    private readonly _r: IFloatNode,
    private readonly _g: IFloatNode,
    private readonly _b: IFloatNode,
    private readonly _a: IFloatNode
  ) {
    super();
  }
  public compile(c: Compiler) {
    const k = c.variable();
    return {
      chunk: `vec4 comps_${k} = vec4(${c.get(this._r)},${c.get(
        this._g
      )},${c.get(this._b)},${c.get(this._a)});`,
      out: `comps_${k}`,
    };
  }
}

export class ComponentsRgbNode extends RgbNode {
  constructor(
    private readonly _r: IFloatNode,
    private readonly _g: IFloatNode,
    private readonly _b: IFloatNode
  ) {
    super();
  }
  public compile(c: Compiler) {
    const k = c.variable();
    return {
      chunk: `vec3 vec3_${k} = vec3(${c.get(this._r)},${c.get(this._g)},${c.get(
        this._b
      )});`,
      out: `vec3_${k}`,
    };
  }
}

export class ConstantRgbNode extends RgbNode {
  constructor(private readonly color: ColorRepresentation) {
    super();
  }
  public compile(c: Compiler) {
    const vec = new Color(this.color);
    const k = c.variable();
    return {
      chunk: `vec3 vec3_${k} = vec3(${vec.r.toFixed(10)},${vec.g.toFixed(
        10
      )},${vec.b.toFixed(10)});`,
      out: `vec3_${k}`,
    };
  }
}

export class RgbToRgbaNode implements IRgbaNode {
  constructor(
    private readonly rgb: RgbNode,
    private readonly alpha: IFloatNode
  ) { }
  public compile(c: Compiler) {
    const vec = c.get(this.rgb);
    const a = c.get(this.alpha);
    const k = c.variable();
    return {
      chunk: `vec3 vec3_${k} = vec4(${vec}.x,${vec}.y,${vec}.z, ${a});`,
      out: `vec3_${k}`,
    };
  }
}

export class RgbaToRgbNode implements IRgbNode {
  constructor(
    private readonly rgb: RgbaNode
  ) { }
  public compile(c: Compiler) {
    const vec = c.get(this.rgb);
    const k = c.variable();
    return {
      chunk: `vec3 vec3_${k} = vec4(${vec}.x,${vec}.y,${vec}.z);`,
      out: `vec3_${k}`,
    };
  }
}

// These are copied here to avoid circual imports

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

export class GtNode extends BooleanNode {
  constructor(private readonly a: FloatNode, private readonly b: FloatNode) {
    super();
  }
  public compile(c: Compiler) {
    return {
      out: `${c.get(this.a)} > ${c.get(this.b)}`,
    };
  }
}

export class LtNode extends BooleanNode {
  constructor(private readonly a: FloatNode, private readonly b: FloatNode) {
    super();
  }
  public compile(c: Compiler) {
    return {
      out: `${c.get(this.a)} < ${c.get(this.b)}`,
    };
  }
}

export class GteNode extends BooleanNode {
  constructor(private readonly a: FloatNode, private readonly b: FloatNode) {
    super();
  }
  public compile(c: Compiler) {
    return {
      out: `${c.get(this.a)} >= ${c.get(this.b)}`,
    };
  }
}

export class LteNode extends BooleanNode {
  constructor(private readonly a: FloatNode, private readonly b: FloatNode) {
    super();
  }
  public compile(c: Compiler) {
    return {
      out: `${c.get(this.a)} <= ${c.get(this.b)}`,
    };
  }
}

export class IntGtNode extends BooleanNode {
  constructor(private readonly a: IntNode, private readonly b: IntNode) {
    super();
  }
  public compile(c: Compiler) {
    return {
      out: `${c.get(this.a)} > ${c.get(this.b)}`,
    };
  }
}

export class IntLtNode extends BooleanNode {
  constructor(private readonly a: IntNode, private readonly b: IntNode) {
    super();
  }
  public compile(c: Compiler) {
    return {
      out: `${c.get(this.a)} < ${c.get(this.b)}`,
    };
  }
}

export class IntGteNode extends BooleanNode {
  constructor(private readonly a: IntNode, private readonly b: IntNode) {
    super();
  }
  public compile(c: Compiler) {
    return {
      out: `${c.get(this.a)} >= ${c.get(this.b)}`,
    };
  }
}

export class IntLteNode extends BooleanNode {
  constructor(private readonly a: IntNode, private readonly b: IntNode) {
    super();
  }
  public compile(c: Compiler) {
    return {
      out: `${c.get(this.a)} <= ${c.get(this.b)}`,
    };
  }
}

export class EqualsNode extends BooleanNode {
  constructor(private readonly a: IntNode, private readonly b: IntNode) {
    super();
  }
  public compile(c: Compiler) {
    return {
      out: `${c.get(this.a)} <= ${c.get(this.b)}`,
    };
  }
}

function equals<
  T extends
  | IntNode
  | FloatNode
  | Vec2Node
  | Vec3Node
  | Vec4Node
  | Mat2Node
  | Mat3Node
  | Mat4Node
>(a: T, b: T): BooleanNode {
  return new (class extends BooleanNode {
    public compile(c: Compiler) {
      return { out: `${c.get(a)} == ${c.get(b)}` };
    }
  })();
}

function notEquals<
  T extends
  | IntNode
  | FloatNode
  | Vec2Node
  | Vec3Node
  | Vec4Node
  | Mat2Node
  | Mat3Node
  | Mat4Node
>(a: T, b: T): BooleanNode {
  return new (class extends BooleanNode {
    public compile(c: Compiler) {
      return { out: `${c.get(a)} != ${c.get(b)}` };
    }
  })();
}

// Sampler
export abstract class Sampler2DNode implements ShaderNode<string> {
  public static readonly typeName = 'sampler2D';
  abstract compile(c: Compiler): CompileResult<string>;

  public sample(cord: Vec2Node, bias?: FloatNode): RgbaNode {
    return new Texture2dLookupNode(this, cord, bias);
  }
}

export class Texture2dLookupNode extends RgbaNode {
  constructor(
    private readonly sampler: Sampler2DNode,
    private readonly cord: Vec2Node,
    private readonly bias?: FloatNode
  ) {
    super();
  }
  public compile(c: Compiler) {
    const k = c.variable();
    const sampler = c.get(this.sampler);
    return {
      chunk:
        this.bias != null
          ? `vec4 texture_sample_${k} = texture2D(${sampler}, ${c.get(
            this.cord
          )}, ${c.get(this.bias)});`
          : `vec4 texture_sample_${k} = texture2D(${sampler}, ${c.get(
            this.cord
          )});`,
      out: `texture_sample_${k}`,
    };
  }
}
