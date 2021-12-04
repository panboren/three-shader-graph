import {
  negVec3,
  rgba,
  varyingVec3
} from '../dsl';
import { dot, normalize, saturate } from '../functions';
import {
  PointLight
} from '../lights';
import { transformed } from '../transformed';
import {
  RgbaNode,
  RgbNode,
  Vec3Node
} from '../types';
import {
  BRDF_Lambert,
  Geometry,
  getDirectionalLightInfo,
  getHemisphereLightIrradiance,
  getPointLightInfo,
  uniformAmbient,
  uniformDirectionalLights, uniformHemisphereLights,
  uniformPointsLights
} from './common-material';


function calculateHemisphereLight(geometry: Geometry) {
  return uniformHemisphereLights.sum(Vec3Node, (light) =>
    getHemisphereLightIrradiance(light, geometry.normal)
  );
}

function calculatePointLight(geometry: Geometry): Vec3Node {
  return uniformPointsLights.sum(Vec3Node, (light: PointLight) => {
    const directLight = getPointLightInfo(light, geometry);
    const dotNl = dot(geometry.normal, directLight.direction);
    const directLightColor_Diffuse = directLight.color;
    return directLightColor_Diffuse.multiplyScalar(saturate(dotNl));
  });
}

function calculateDirLight(geometry: Geometry): Vec3Node {
  return uniformDirectionalLights.sum(Vec3Node, (light) => {
    const directLight = getDirectionalLightInfo(light, geometry);
    const dotNL = dot(geometry.normal, directLight.direction);
    const directLightColor_Diffuse = directLight.color;
    return directLightColor_Diffuse.multiplyScalar(saturate(dotNL));
  });
}

export function lambertMaterial(diffuse: RgbNode): RgbaNode {
  const geometry = {
    position: transformed.mvPosition.xyz(),
    normal: normalize(transformed.normal),
    viewDir: normalize(negVec3(transformed.mvPosition.xyz())),
  };

  const combinedPointLight = calculatePointLight(geometry);
  const combinedHemiLight = calculateHemisphereLight(geometry);
  const combinedDirLight = calculateDirLight(geometry);

  const vLightFront = varyingVec3(combinedPointLight.add(combinedDirLight));
  const vIndirectFront = varyingVec3(combinedHemiLight.add(uniformAmbient));

  const directDiffuse = vLightFront.multiply(BRDF_Lambert(diffuse));
  const indirectDiffuse = vIndirectFront.multiply(BRDF_Lambert(diffuse));

  const outgoingLight = directDiffuse.add(indirectDiffuse);

  return rgba(outgoingLight, 1);
}
