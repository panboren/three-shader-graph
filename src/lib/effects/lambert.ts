import { negVec3, rgba, varyingVec3 } from '../dsl';
import { dot, normalize, saturate } from '../functions';
import {
  PointLight,
  SpotLight,
  uniformAmbient,
  uniformDirectionalLights,
  uniformHemisphereLights,
  uniformPointLights,
  uniformSpotLights,
} from '../lights';
import { transformed } from '../transformed';
import { RgbaNode, RgbNode, Vec3Node } from '../types';

import {
  BRDF_Lambert,
  Geometry,
  getDirectionalLightInfo,
  getHemisphereLightIrradiance,
  getPointLightInfo,
} from './common-material';
import { getSpotLightInfo } from './common-material';
import { CSM_LightFactor } from './csm-util';
import { ShadowMaskNode } from './shadow-mask';
function calculateHemisphereLight(geometry: Geometry) {
  return uniformHemisphereLights.sum((light) =>
    getHemisphereLightIrradiance(light, geometry.normal)
  );
}

function calculatePointLight(geometry: Geometry): Vec3Node {
  return uniformPointLights.sum((light: PointLight) => {
    const directLight = getPointLightInfo(light, geometry);
    const dotNl = dot(geometry.normal, directLight.direction);
    const directLightColor_Diffuse = directLight.color;
    return directLightColor_Diffuse.multiplyScalar(saturate(dotNl));
  });
}

function calculateSpotLight(geometry: Geometry): Vec3Node {
  return uniformSpotLights.sum((light: SpotLight) => {
    const directLight = getSpotLightInfo(light, geometry);
    const dotNl = dot(geometry.normal, directLight.direction);
    const directLightColor_Diffuse = directLight.color;
    return directLightColor_Diffuse.multiplyScalar(saturate(dotNl));
  });
}

function calculateDirLight(geometry: Geometry): Vec3Node {
  return uniformDirectionalLights.sum((light, i) => {
    const directLight = getDirectionalLightInfo(light, geometry);
    const dotNL = dot(geometry.normal, directLight.direction);
    const directLightColor_Diffuse = directLight.color;
    return directLightColor_Diffuse
      .multiplyScalar(saturate(dotNL))
      .multiplyScalar(CSM_LightFactor(i));
  });
}

export function lambertMaterial(
  diffuse: RgbNode | { color: RgbNode }
): RgbaNode {
  const geometry = {
    position: transformed.mvPosition.xyz(),
    normal: normalize(transformed.normal),
    viewDir: normalize(negVec3(transformed.mvPosition.xyz())),
  };

  const combinedPointLight = calculatePointLight(geometry);
  const combinedSpotLight = calculateSpotLight(geometry);
  const combinedHemiLight = calculateHemisphereLight(geometry);
  const combinedDirLight = calculateDirLight(geometry);

  const vLightFront = varyingVec3(
    combinedPointLight.add(combinedDirLight).add(combinedSpotLight)
  );
  const vIndirectFront = varyingVec3(combinedHemiLight.add(uniformAmbient));

  const diffuseColor = diffuse instanceof RgbNode ? diffuse : diffuse.color;
  const directDiffuse = vLightFront
    .multiply(BRDF_Lambert(diffuseColor))
    .multiplyScalar(new ShadowMaskNode());
  const indirectDiffuse = vIndirectFront.multiply(BRDF_Lambert(diffuseColor));

  const outgoingLight = directDiffuse.add(indirectDiffuse);

  return rgba(outgoingLight, 1);
}
