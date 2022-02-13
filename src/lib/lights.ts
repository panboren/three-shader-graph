import { UniformArrayNode } from './arrays';
import { uniformVec3, uniformBool } from './dsl';
import { IntExpressionNode } from './expressions';
import { StructType } from './structs';
import { FloatNode, Mat4Node, RgbNode, Sampler2DNode, Vec2Node, Vec3Node } from './types';

export abstract class PointLight extends StructType {
  static readonly typeName = 'PointLight';
  readonly position = this.get(Vec3Node, 'position');
  readonly color = this.get(RgbNode, 'color');
  readonly distance = this.get(FloatNode, 'distance');
  readonly decay = this.get(FloatNode, 'decay');
}

export abstract class SpotLight extends StructType {
  static readonly typeName = 'SpotLight';
  readonly position = this.get(Vec3Node, 'position');
  readonly direction = this.get(Vec3Node, 'direction');
  readonly color = this.get(RgbNode, 'color');
  readonly distance = this.get(FloatNode, 'distance');
  readonly decay = this.get(FloatNode, 'decay');
  readonly coneCos = this.get(FloatNode, 'coneCos');
  readonly penumbraCos = this.get(FloatNode, 'penumbraCos');
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

export abstract class PointLightShadow extends StructType {
  static readonly typeName = 'PointLightShadow';
  readonly shadowBias = this.get(FloatNode, 'shadowBias');
  readonly shadowNormalBias = this.get(FloatNode, 'shadowNormalBias');
  readonly shadowRadius = this.get(FloatNode, 'shadowRadius');
  readonly shadowMapSize = this.get(Vec2Node, 'shadowMapSize');
  readonly shadowCameraNear = this.get(FloatNode, 'shadowCameraNear');
  readonly shadowCameraFar = this.get(FloatNode, 'shadowCameraFar');
}

export abstract class DirectionalLightShadow extends StructType {
  static readonly typeName = 'DirectionalLightShadow';
  readonly shadowBias = this.get(FloatNode, 'shadowBias');
  readonly shadowNormalBias = this.get(FloatNode, 'shadowNormalBias');
  readonly shadowRadius = this.get(FloatNode, 'shadowRadius');
  readonly shadowMapSize = this.get(Vec2Node, 'shadowMapSize');
}

export abstract class SpotLightShadow extends StructType {
  static readonly typeName = 'SpotLightShadow';
  readonly shadowBias = this.get(FloatNode, 'shadowBias');
  readonly shadowNormalBias = this.get(FloatNode, 'shadowNormalBias');
  readonly shadowRadius = this.get(FloatNode, 'shadowRadius');
  readonly shadowMapSize = this.get(Vec2Node, 'shadowMapSize');
}

export const lightProbe = new UniformArrayNode('lightProbe', Vec3Node, 9);


export const uniformPointLights = new UniformArrayNode(
  'pointLights',
  PointLight,
  new IntExpressionNode('NUM_POINT_LIGHTS')
);
export const uniformSpotLights = new UniformArrayNode(
  'spotLights',
  SpotLight,
  new IntExpressionNode('NUM_SPOT_LIGHTS')
);
export const uniformHemisphereLights = new UniformArrayNode(
  'hemisphereLights',
  HemisphereLight,
  new IntExpressionNode('NUM_HEMI_LIGHTS')
);
export const uniformDirectionalLights = new UniformArrayNode(
  'directionalLights',
  DirectionalLight,
  new IntExpressionNode('NUM_DIR_LIGHTS')
);
export const uniformAmbient = uniformVec3('ambientLightColor');
export const uniformReceiveShadow = uniformBool('receiveShadow');

export const uniformPointLightShadows = new UniformArrayNode(
  'pointLightShadows',
  PointLightShadow,
  new IntExpressionNode('NUM_POINT_LIGHT_SHADOWS')
);

export const uniformPointShadowMap = new UniformArrayNode(
  'pointShadowMap',
  Sampler2DNode,
  new IntExpressionNode('NUM_POINT_LIGHT_SHADOWS')
);
export const uniformPointShadowMatrix = new UniformArrayNode(
  'pointShadowMatrix',
  Mat4Node,
  new IntExpressionNode('NUM_POINT_LIGHT_SHADOWS')
);

export const uniformDirectionalLightShadows = new UniformArrayNode(
  'directionalLightShadows',
  DirectionalLightShadow,
  new IntExpressionNode('NUM_DIR_LIGHT_SHADOWS')
);
export const uniformDirectionalShadowMap = new UniformArrayNode(
  'directionalShadowMap',
  Sampler2DNode,
  new IntExpressionNode('NUM_DIR_LIGHT_SHADOWS')
);
export const uniformDirectionalShadowMatrix = new UniformArrayNode(
  'directionalShadowMatrix',
  Mat4Node,
  new IntExpressionNode('NUM_DIR_LIGHT_SHADOWS')
);


export const uniformSpotLightShadows = new UniformArrayNode(
  'spotLightShadows',
  SpotLightShadow,
  new IntExpressionNode('NUM_SPOT_LIGHT_SHADOWS')
);
export const uniformSpotShadowMap = new UniformArrayNode(
  'spotShadowMap',
  Sampler2DNode,
  new IntExpressionNode('NUM_SPOT_LIGHT_SHADOWS')
);
export const uniformSpotShadowMatrix = new UniformArrayNode(
  'spotShadowMatrix',
  Mat4Node,
  new IntExpressionNode('NUM_SPOT_LIGHT_SHADOWS')
);

export const uniformCsmCascades = new UniformArrayNode(
  'CSM_cascades',
  Vec2Node,
  new IntExpressionNode('CSM_CASCADES')
);