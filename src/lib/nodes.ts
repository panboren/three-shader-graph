import { Compiler, ShaderNode } from './compiler';
import { float, vec2 } from './dsl';
import {
  BooleanNode,
  FloatNode,
  Mat2Node,
  Mat3Node,
  Mat4Node,
  Vec2Node,
  Vec3Node,
  Vec4Node,
} from './types';

export type BaseType<T> = (abstract new (...args: any[]) => T) & {
  typeName: string;
};

function selectOfType<T extends ShaderNode<string>>(
  type: BaseType<T>,
  condition: BooleanNode,
  a: T,
  b: T
): T {
  // @ts-expect-error
  const k = class extends type {
    compile(c: Compiler) {
      const k = c.variable();
      const out = `select_out_${k}`;
      return {
        chunk: `
            ${type.typeName} ${out};
            if (${c.get(condition)}) {
              ${out} = ${c.get(a)};
            } else {
              ${out} = ${c.get(b)};
            }
          `,
        out,
      };
    }
  };
  return new k() as unknown as T;
}

export const select = <T extends ShaderNode<string>>(
  condition: BooleanNode,
  a: T,
  b: T
): T => {
  if (a instanceof BooleanNode && b instanceof BooleanNode)
    return selectOfType(BooleanNode, condition, a, b) as unknown as T;
  if (a instanceof FloatNode && b instanceof FloatNode)
    return selectOfType(FloatNode, condition, a, b) as unknown as T;
  if (a instanceof Vec2Node && b instanceof Vec2Node)
    return selectOfType(Vec2Node, condition, a, b) as unknown as T;
  if (a instanceof Vec3Node && b instanceof Vec3Node)
    return selectOfType(Vec3Node, condition, a, b) as unknown as T;
  if (a instanceof Vec4Node && b instanceof Vec4Node)
    return selectOfType(Vec4Node, condition, a, b) as unknown as T;
  if (a instanceof Mat2Node && b instanceof Mat2Node)
    return selectOfType(Mat2Node, condition, a, b) as unknown as T;
  if (a instanceof Mat3Node && b instanceof Mat3Node)
    return selectOfType(Mat3Node, condition, a, b) as unknown as T;
  if (a instanceof Mat4Node && b instanceof Mat4Node)
    return selectOfType(Mat4Node, condition, a, b) as unknown as T;
  throw new Error('Can not select on type of ' + a + ' and ' + b);
};

select(float(5).gt(float(3)), vec2(1, 2), vec2(1, 4));
