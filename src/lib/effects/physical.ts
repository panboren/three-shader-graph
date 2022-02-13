import { float, negVec3, rgb, rgba, varyingVec3 } from '../dsl';
import { dot, normalize, saturate } from '../functions';
import { uniformPointLights, uniformDirectionalLights, uniformHemisphereLights, uniformSpotLights } from '../lights';
import { transformed } from '../transformed';
import { FloatNode, RgbNode, Vec3Node } from '../types';
import { getSpotLightInfo } from './common-material';
import {
  BRDF_Lambert,
  Geometry,
  getDirectionalLightInfo,
  getHemisphereLightIrradiance,
  getPointLightInfo
} from './common-material';


type PhysicalMaterial = {
  readonly diffuseColor: RgbNode;
};

function calculatePointLight(
  geometry: Geometry,
  material: PhysicalMaterial
): Vec3Node {
  const directDiffuse = uniformPointLights.sum(Vec3Node, (light) => {
    const directLight = getPointLightInfo(light, geometry);
    const dotNL = saturate(dot(geometry.normal, directLight.direction));
    const irradiance = dotNL.multiplyVec3(light.color);
    return irradiance.multiply(BRDF_Lambert(material.diffuseColor));
  });
  return directDiffuse;
}

function calculateSpotLight(
  geometry: Geometry,
  material: PhysicalMaterial
): Vec3Node {
  const directDiffuse = uniformSpotLights.sum(Vec3Node, (light) => {
    const directLight = getSpotLightInfo(light, geometry);
    const dotNL = saturate(dot(geometry.normal, directLight.direction));
    const irradiance = dotNL.multiplyVec3(light.color);
    return irradiance.multiply(BRDF_Lambert(material.diffuseColor));
  });
  return directDiffuse;
}

function calculateDirectionalLight(
  geometry: Geometry,
  material: PhysicalMaterial
): Vec3Node {
  const directDiffuse = uniformDirectionalLights.sum(Vec3Node, (light) => {
    const directLight = getDirectionalLightInfo(light, geometry);
    const dotNL = saturate(dot(geometry.normal, directLight.direction));
    const irradiance = dotNL.multiplyVec3(light.color);
    return irradiance.multiply(BRDF_Lambert(material.diffuseColor));
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
