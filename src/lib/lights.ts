import { UniformArrayNode } from './arrays';
import { StructType } from './structs';
import { FloatNode, RgbNode, Vec2Node, Vec3Node } from './types';

export abstract class PointLight extends StructType {
  static readonly typeName = 'PointLight';
  readonly position = this.get(Vec3Node, 'position');
  readonly color = this.get(RgbNode, 'color');
  readonly distance = this.get(FloatNode, 'distance');
  readonly decay = this.get(FloatNode, 'decay');
}

export abstract class HemisphereLight extends StructType {
  static readonly typeName = 'HemisphereLight';
  readonly direction = this.get(Vec3Node, 'direction');
  readonly skyColor = this.get(RgbNode, 'skyColor');
  readonly groundColor = this.get(RgbNode, 'groundColor');
}

export abstract class DirectionalLight extends StructType {
  static readonly typeName = 'DirectionalLight';
  readonly direction = this.get(Vec3Node, 'direction');
  readonly color = this.get(RgbNode, 'color');
}

export abstract class DirectionalLightShadow extends StructType {
  static readonly typeName = 'DirectionalLightShadow';
  readonly shadowBias = this.get(FloatNode, 'shadowBias');
  readonly shadowNormalBias = this.get(FloatNode, 'shadowNormalBias');
  readonly shadowRadius = this.get(FloatNode, 'shadowRadius');
  readonly shadowMapSize = this.get(Vec2Node, 'shadowMapSize');
}

export const lightProbe = new UniformArrayNode('lightProbe', Vec3Node, 9);
