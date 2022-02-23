import { uniforms } from '../common';
import {
  float,
  negVec3,
  rgb,
  rgba,
  varyingArray,
  varyingVec3,
  vec4,
} from '../dsl';
import { dot, normalize, saturate } from '../functions';
import {
  uniformDirectionalLights,
  uniformDirectionalLightShadows,
  uniformDirectionalShadowMap,
  uniformDirectionalShadowMatrix,
  uniformHemisphereLights,
  uniformPointLights,
  uniformPointLightShadows,
  uniformPointShadowMap,
  uniformPointShadowMatrix,
  uniformSpotLights,
  uniformSpotLightShadows,
  uniformSpotShadowMap,
  uniformSpotShadowMatrix,
} from '../lights';
import { transformed } from '../transformed';
import { FloatNode, RgbNode, Vec3Node } from '../types';

import {
  BRDF_Lambert,
  Geometry,
  getDirectionalLightInfo,
  getHemisphereLightIrradiance,
  getPointLightInfo,
  getSpotLightInfo,
} from './common-material';
import { GetPointShadowNode } from './point-shadow';
import { GetShadowNode } from './shadow';

type PhysicalMaterial = {
  readonly diffuseColor: RgbNode;
};

const worldPosition = uniforms.modelMatrix.multiplyVec(transformed.position);
const shadowWorldNormal = normalize(
  vec4(transformed.normal, 0.0).multiplyMat(uniforms.viewMatrix).xyz()
);

function calculatePointLight(
  geometry: Geometry,
  material: PhysicalMaterial
): Vec3Node {
  const pointShadowCoords = uniformPointLightShadows.map((p, i) => {
    const shadowWorldPosition = worldPosition.add(
      vec4(shadowWorldNormal.multiplyScalar(p.shadowNormalBias), 0)
    );
    return uniformPointShadowMatrix.get(i).multiplyVec(shadowWorldPosition);
  });
  const vPointShadowCoord = varyingArray(pointShadowCoords);

  const directDiffuse = uniformPointLights.sum((light, i) => {
    const pointLightShadow = uniformPointLightShadows.get(i);
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
    return irradiance
      .multiply(BRDF_Lambert(material.diffuseColor))
      .multiplyScalar(shadowFactor);
  });
  return directDiffuse;
}

function calculateSpotLight(
  geometry: Geometry,
  material: PhysicalMaterial
): Vec3Node {
  const spotShadowCoords = uniformSpotLightShadows.map((p, i) => {
    const shadowWorldPosition = worldPosition.add(
      vec4(shadowWorldNormal.multiplyScalar(p.shadowNormalBias), 0)
    );
    return uniformSpotShadowMatrix.get(i).multiplyVec(shadowWorldPosition);
  });
  const vSpotShadowCoord = varyingArray(spotShadowCoords);

  const directDiffuse = uniformSpotLights.sum((light, i) => {
    const spotLightShadow = uniformSpotLightShadows.get(i);
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
    return irradiance
      .multiply(BRDF_Lambert(material.diffuseColor))
      .multiplyScalar(shadowFactor);
  });
  return directDiffuse;
}

function calculateDirectionalLight(
  geometry: Geometry,
  material: PhysicalMaterial
): Vec3Node {
  const directionalShadowCoords = uniformDirectionalLightShadows.map((p, i) => {
    const shadowWorldPosition = worldPosition.add(
      vec4(shadowWorldNormal.multiplyScalar(p.shadowNormalBias), 0)
    );
    return uniformDirectionalShadowMatrix
      .get(i)
      .multiplyVec(shadowWorldPosition);
  });
  const vDirectionalShadowCoord = varyingArray(directionalShadowCoords);

  const directDiffuse = uniformDirectionalLights.sum((light, i) => {
    const directionalLightShadow = uniformDirectionalLightShadows.get(i);
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
    return irradiance
      .multiply(BRDF_Lambert(material.diffuseColor))
      .multiplyScalar(shadowFactor);
  });
  return directDiffuse;
}

function calculateHemisphereLight(
  geometry: Geometry,
  material: PhysicalMaterial
) {
  return uniformHemisphereLights
    .sum((light) => getHemisphereLightIrradiance(light, geometry.normal))
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
    calculateSpotLight(geometry, material),
  ].reduce((a, v) => a.add(v));

  const indirectDiffuse = calculateHemisphereLight(geometry, material);

  const totalDiffuse = directDiffuse.add(indirectDiffuse);

  const outgoingLight =
    emissive != null
      ? totalDiffuse.add(emissive.multiplyScalar(emissiveIntensity))
      : totalDiffuse;

  return rgba(outgoingLight, 1);
}
