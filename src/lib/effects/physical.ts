import { BooleanExpression, IntExpressionNode } from '../..';
import { UniformArrayNode } from '../arrays';
import { uniforms } from '../common';
import {
  float,
  int,
  negVec3,
  rgb,
  rgba,
  varyingArray,
  varyingFloat,
  vec4,
} from '../dsl';
import { dot, normalize, saturate } from '../functions';
import {
  uniformDirectionalLightShadows,
  uniformDirectionalLights,
  uniformDirectionalShadowMap,
  uniformDirectionalShadowMatrix,
  uniformHemisphereLights,
  uniformPointLightShadows,
  uniformPointLights,
  uniformPointShadowMap,
  uniformPointShadowMatrix,
  uniformSpotLightShadows,
  uniformSpotLights,
  uniformSpotShadowMap,
  uniformSpotShadowMatrix,
} from '../lights';
import { select, selectPreCompile } from '../nodes';
import { transformed, varyingTransformed } from '../transformed';
import { FloatNode, RgbNode, Vec2Node, Vec3Node } from '../types';

import {
  BRDF_Lambert,
  Geometry,
  getDirectionalLightInfo,
  getHemisphereLightIrradiance,
  getPointLightInfo,
  getSpotLightInfo,
  uniformCameraNear,
  uniformShadowFar,
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

    const getShadowNode = new GetPointShadowNode(
      uniformPointShadowMap.get(i),
      pointLightShadow.shadowMapSize,
      pointLightShadow.shadowBias,
      pointLightShadow.shadowRadius,
      vPointShadowCoord.get(i),
      pointLightShadow.shadowCameraNear,
      pointLightShadow.shadowCameraFar
    );
    const shadowFactor = selectPreCompile(
      int(uniformPointShadowMap.limit).gt(i),
      getShadowNode,
      float(1.0)
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

    const getShadowNode = new GetShadowNode(
      uniformSpotShadowMap.get(i),
      spotLightShadow.shadowMapSize,
      spotLightShadow.shadowBias,
      spotLightShadow.shadowRadius,
      vSpotShadowCoord.get(i)
    );
    const shadowFactor = selectPreCompile(
      int(uniformSpotShadowMap.limit).gt(i),
      getShadowNode,
      float(1.0)
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

const linearDepth = varyingTransformed.mvPosition.z().multiply(float(-1)).divide(uniformShadowFar.subtract(uniformCameraNear));

const CSM_CASCADES = new IntExpressionNode('CSM_CASCADES');
const CSM_cascades = new UniformArrayNode(
  'CSM_cascades',
  Vec2Node,
  CSM_CASCADES
);

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

    const getShadowNode: FloatNode = new GetShadowNode(
      uniformDirectionalShadowMap.get(i),
      directionalLightShadow.shadowMapSize,
      directionalLightShadow.shadowBias,
      directionalLightShadow.shadowRadius,
      vDirectionalShadowCoord.get(i)
    );

    const shadowsEnabled = int(uniformDirectionalShadowMap.limit).gt(i);

    // If it is not a CSM light, always apply the light and shadow
    // If it is a CSM light, only apply light and shadwos under certain conditions.
    // This check has to be done pre compile though.
    const isCsmLight = i.lt(CSM_CASCADES);

    const getShadowNodeWithCsm: FloatNode = 
        selectPreCompile(
          isCsmLight,
          select(
            linearDepth
              .gte(CSM_cascades.get(i).x())
              .and(linearDepth.lt(CSM_cascades.get(i).y())),
            getShadowNode,
            float(1.0)
          ),
          getShadowNode
        )

    const shadowFactor = selectPreCompile(
      shadowsEnabled,
      getShadowNodeWithCsm,
      float(1.0)
    );

    const directLight = getDirectionalLightInfo(light, geometry);
    const dotNL = saturate(dot(geometry.normal, directLight.direction));
    const irradiance = dotNL.multiplyVec3(light.color);
    return irradiance
      .multiply(BRDF_Lambert(material.diffuseColor))
      .multiplyScalar(shadowFactor)
      .multiplyScalar(
        selectPreCompile(
          isCsmLight,
          select(
            linearDepth
              .gte(CSM_cascades.get(i).x())
              .and(
                linearDepth
                  .lt(CSM_cascades.get(i).y())
                  .or(i.equals(CSM_CASCADES.subtract(int(1))))
              ),
            float(1.0),
            float(0.0)
          ),
          float(1.0)
        )
      );
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
  readonly normal: Vec3Node | null;
};

const standardMaterialParametersDefaults: StandardMaterialParameters = {
  color: rgb(0x000000),
  emissive: rgb(0x000000),
  emissiveIntensity: float(1),
  normal: varyingTransformed.normal,
};

export function standardMaterial(params: Partial<StandardMaterialParameters>) {
  const { color, emissive, emissiveIntensity, normal } = {
    ...standardMaterialParametersDefaults,
    ...params,
  };

  const material = {
    diffuseColor: color,
  } as PhysicalMaterial;

  const vPos = varyingTransformed.mvPosition.xyz();

  const geometry = {
    position: vPos,
    normal: normal,
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
