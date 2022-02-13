import { VaryingArrayNode } from '../arrays';
import { uniforms, attributes } from '../common';
import { float, int, negVec3, rgb, rgba, varyingVec2, varyingVec3, vec3, vec4 } from '../dsl';
import { IntExpressionNode } from '../expressions';
import { dot, normalize, saturate } from '../functions';
import { uniformPointLights, uniformDirectionalLights, uniformHemisphereLights, uniformSpotLights, uniformPointShadowMap, PointLightShadow, uniformPointLightShadows, uniformPointShadowMatrix, uniformDirectionalShadowMatrix, uniformDirectionalLightShadows, uniformDirectionalShadowMap, uniformSpotLightShadows, uniformSpotShadowMap, uniformSpotShadowMatrix } from '../lights';
import { transformed } from '../transformed';
import { FloatNode, RgbNode, Vec3Node, Vec4Node } from '../types';
import { getSpotLightInfo } from './common-material';
import {
  BRDF_Lambert,
  Geometry,
  getDirectionalLightInfo,
  getHemisphereLightIrradiance,
  getPointLightInfo
} from './common-material';
import { GetPointShadowNode } from './point-shadow';
import { GetShadowNode } from './shadow';


type PhysicalMaterial = {
  readonly diffuseColor: RgbNode;
};

const worldPosition = uniforms.modelMatrix.multiplyVec(transformed.position)
const shadowWorldNormal = normalize((vec4(transformed.normal, 0.0).multiplyMat(uniforms.viewMatrix)).xyz())

function calculatePointLight(
  geometry: Geometry,
  material: PhysicalMaterial
): Vec3Node {
  // TODO Handle when there are no point lights.
  const pointShadowCoords = uniformPointLightShadows.map(Vec4Node, (p, i) => {
    const shadowWorldPosition = worldPosition.add(vec4(shadowWorldNormal.multiplyScalar(p.shadowNormalBias), 0))
    return uniformPointShadowMatrix.get(i).multiplyVec(shadowWorldPosition)
  })
  const vPointShadowCoord = new VaryingArrayNode(pointShadowCoords, Vec4Node, new IntExpressionNode('NUM_POINT_LIGHT_SHADOWS'))

  const directDiffuse = uniformPointLights.sum(Vec3Node, (light, i) => {

    const pointLightShadow = uniformPointLightShadows.get(i)
    const shadowFactor = new GetPointShadowNode(
      uniformPointShadowMap.get(i),
      pointLightShadow.shadowMapSize,
      pointLightShadow.shadowBias,
      pointLightShadow.shadowRadius,
      vPointShadowCoord.get(i),
      pointLightShadow.shadowCameraNear,
      pointLightShadow.shadowCameraFar
    );

    const directLight = getPointLightInfo(light, geometry);
    const dotNL = saturate(dot(geometry.normal, directLight.direction));
    const irradiance = dotNL.multiplyVec3(light.color);
    return irradiance.multiply(BRDF_Lambert(material.diffuseColor)).multiplyScalar(shadowFactor);
  });
  return directDiffuse;
}

function calculateSpotLight(
  geometry: Geometry,
  material: PhysicalMaterial
): Vec3Node {
  const spotShadowCoords = uniformSpotLightShadows.map(Vec4Node, (p, i) => {
    const shadowWorldPosition = worldPosition.add(vec4(shadowWorldNormal.multiplyScalar(p.shadowNormalBias), 0))
    return uniformSpotShadowMatrix.get(i).multiplyVec(shadowWorldPosition)
  })
  const vSpotShadowCoord = new VaryingArrayNode(spotShadowCoords, Vec4Node, new IntExpressionNode('NUM_SPOT_LIGHT_SHADOWS'))

  const directDiffuse = uniformSpotLights.sum(Vec3Node, (light, i) => {

    const spotLightShadow = uniformSpotLightShadows.get(i)
    const shadowFactor = new GetShadowNode(
      uniformSpotShadowMap.get(i),
      spotLightShadow.shadowMapSize,
      spotLightShadow.shadowBias,
      spotLightShadow.shadowRadius,
      vSpotShadowCoord.get(i)
    );

    const directLight = getSpotLightInfo(light, geometry);
    const dotNL = saturate(dot(geometry.normal, directLight.direction));
    const irradiance = dotNL.multiplyVec3(light.color);
    return irradiance.multiply(BRDF_Lambert(material.diffuseColor)).multiplyScalar(shadowFactor);
  });
  return directDiffuse;
}

function calculateDirectionalLight(
  geometry: Geometry,
  material: PhysicalMaterial
): Vec3Node {
  const directionalShadowCoords = uniformDirectionalLightShadows.map(Vec4Node, (p, i) => {
    const shadowWorldPosition = worldPosition.add(vec4(shadowWorldNormal.multiplyScalar(p.shadowNormalBias), 0))
    return uniformDirectionalShadowMatrix.get(i).multiplyVec(shadowWorldPosition)
  })
  const vDirectionalShadowCoord = new VaryingArrayNode(directionalShadowCoords, Vec4Node, new IntExpressionNode('NUM_DIR_LIGHT_SHADOWS'))

  const directDiffuse = uniformDirectionalLights.sum(Vec3Node, (light, i) => {

    const directionalLightShadow = uniformDirectionalLightShadows.get(i)
    const shadowFactor = new GetShadowNode(
      uniformDirectionalShadowMap.get(i),
      directionalLightShadow.shadowMapSize,
      directionalLightShadow.shadowBias,
      directionalLightShadow.shadowRadius,
      vDirectionalShadowCoord.get(i)
    );

    const directLight = getDirectionalLightInfo(light, geometry);
    const dotNL = saturate(dot(geometry.normal, directLight.direction));
    const irradiance = dotNL.multiplyVec3(light.color);
    return irradiance.multiply(BRDF_Lambert(material.diffuseColor)).multiplyScalar(shadowFactor);
  });
  return directDiffuse;
}

function calculateHemisphereLight(
  geometry: Geometry,
  material: PhysicalMaterial
) {
  return uniformHemisphereLights
    .sum(Vec3Node, (light) =>
      getHemisphereLightIrradiance(light, geometry.normal)
    )
    .multiply(BRDF_Lambert(material.diffuseColor));
}

export type StandardMaterialParameters = {
  readonly color: RgbNode;
  readonly emissive: RgbNode;
  readonly emissiveIntensity: FloatNode;
};

const standardMaterialParametersDefaults: StandardMaterialParameters = {
  color: rgb(0x000000),
  emissive: rgb(0x000000),
  emissiveIntensity: float(1),
};

export function standardMaterial(params: Partial<StandardMaterialParameters>) {
  const { color, emissive, emissiveIntensity } = {
    ...standardMaterialParametersDefaults,
    ...params,
  };

  const material = {
    diffuseColor: color,
  } as PhysicalMaterial;

  const vPos = varyingVec3(transformed.mvPosition.xyz());

  const geometry = {
    position: vPos,
    normal: varyingVec3(normalize(transformed.normal)),
    viewDir: normalize(negVec3(vPos)),
  } as Geometry;

  const directDiffuse = [
    calculatePointLight(geometry, material),
    calculateDirectionalLight(geometry, material),
    calculateSpotLight(geometry, material)
  ].reduce((a, v) => a.add(v))

  const indirectDiffuse = calculateHemisphereLight(geometry, material);

  const totalDiffuse = directDiffuse.add(indirectDiffuse);

  const outgoingLight =
    emissive != null
      ? totalDiffuse.add(emissive.multiplyScalar(emissiveIntensity))
      : totalDiffuse;

  return rgba(outgoingLight, 1);
}
