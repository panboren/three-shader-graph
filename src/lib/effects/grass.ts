import { attributes } from '../common';
import { float, rgba, varyingFloat } from '../dsl';
import { select } from '../nodes';
import { RgbaNode, RgbNode } from '../types';

export function grassShader(
  main: RgbNode | RgbaNode,
  secondary: RgbNode | RgbaNode,
  threshold = float(0.9)
): RgbaNode {
  const vNormalY = varyingFloat(attributes.normal.y());
  const color = select(vNormalY.gt(threshold), main, secondary);
  return rgba(color);
}
