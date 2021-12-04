import { UniformArrayNode } from '../arrays';
import {
  bool,
  float,
  neg,
  uniformBool,
  uniformFloat,
  uniformVec3,
  vec3
} from '../dsl';
import { IntExpressionNode } from '../expressions';
import { dot, length, mix, normalize, pow, saturate } from '../functions';
import {
  DirectionalLight,
  DirectionalLightShadow,
  HemisphereLight,
  PointLight
} from '../lights';
import { select } from '../nodes';
import {
  BooleanNode,
  FloatNode,
  Mat4Node,
  Sampler2DNode,
  Vec2Node,
  Vec3Node
} from '../types';

export const uniformPointsLights = new UniformArrayNode(
  'pointLights',
  PointLight,
  new IntExpressionNode('NUM_POINT_LIGHTS')
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

export const uniformDirectionalLightShadows = new UniformArrayNode(
  'directionalLightShadows',
  DirectionalLightShadow,
  new IntExpressionNode('NUM_DIR_LIGHT_SHADOWS')
);
export const uniformDirectionalShadowMap = new UniformArrayNode(
  'directionalShadowMaps',
  Sampler2DNode,
  new IntExpressionNode('NUM_DIR_LIGHT_SHADOWS')
);
export const uniformDirectionalShadowMatrix = new UniformArrayNode(
  'directionalShadowMatrix',
  Mat4Node,
  new IntExpressionNode('NUM_DIR_LIGHT_SHADOWS')
);
export const uniformCsmCascades = new UniformArrayNode(
  'CSM_cascades',
  Vec2Node,
  new IntExpressionNode('CSM_CASCADES')
);
export const uniformCameraNear = uniformFloat('cameraNear');
export const uniformShadowFar = uniformFloat('shadowFar');

export type Geometry = {
  readonly position: Vec3Node;
  readonly normal: Vec3Node;
  readonly viewDir: Vec3Node;
};

export type IncidentLight = {
  readonly color: Vec3Node;
  readonly direction: Vec3Node;
  readonly visible: BooleanNode;
};

export function getDistanceAttenuation(
  lightDistance: FloatNode,
  cutoffDistance: FloatNode,
  decayExponent: FloatNode
): FloatNode {
  const shouldCalculate = cutoffDistance
    .gt(float(0))
    .and(decayExponent.gt(float(0)));
  const attenuation = pow(
    saturate(neg(lightDistance).divide(cutoffDistance).add(float(1))),
    decayExponent
  );
  return select(shouldCalculate, attenuation, float(1));
}

export function getPointLightInfo(
  pointLight: PointLight,
  geometry: Geometry
): IncidentLight {
  const lVector = pointLight.position.subtract(geometry.position);
  const lightDistance = length(lVector);
  const distanceAttenuation = getDistanceAttenuation(
    lightDistance,
    pointLight.distance,
    pointLight.decay
  );
  const lightColor = pointLight.color.multiplyScalar(distanceAttenuation);
  return {
    direction: normalize(lVector),
    color: lightColor,
    visible: lightColor.notEquals(vec3(0, 0, 0)),
  };
}

export function getDirectionalLightInfo(
  directionalLight: DirectionalLight,
  geometry: Geometry
) {
  return {
    color: directionalLight.color,
    direction: directionalLight.direction,
    visible: bool(true),
  };
}

export function getHemisphereLightIrradiance(
  hemiLight: HemisphereLight,
  normal: Vec3Node
) {
  const dotNL = dot(normal, hemiLight.direction);
  const hemiDiffuseWeight = float(0.5).multiply(dotNL).add(float(0.5));
  const irradiance = mix(
    hemiLight.groundColor,
    hemiLight.skyColor,
    hemiDiffuseWeight
  );
  return irradiance;
}

export const RECIPROCAL_PI = float(0.3183098861837907);

export function BRDF_Lambert(diffuse: Vec3Node) {
  return diffuse.multiplyScalar(RECIPROCAL_PI);
}
