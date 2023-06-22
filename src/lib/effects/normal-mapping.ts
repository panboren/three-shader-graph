import { attributes, uniforms, varyingAttributes } from '../common';
import { float, varyingMat3, varyingVec3, vec3, vec4 } from '../dsl';
import {
  cross,
  dFdx,
  dFdy,
  dot,
  inversesqrt,
  max,
  normalize,
} from '../functions';
import { select } from '../nodes';
import { transformed, varyingTransformed } from '../transformed';
import { ComponentsMat3Node, FloatNode, Vec3Node, Vec4Node } from '../types';

function perturbNormal2Arb(
  eyePos: Vec3Node,
  surfNorm: Vec3Node,
  mapN: Vec3Node,
  faceDirection: FloatNode
): Vec3Node {
  const q0 = vec3(dFdx(eyePos.x()), dFdx(eyePos.y()), dFdx(eyePos.z()));
  const q1 = vec3(dFdy(eyePos.x()), dFdy(eyePos.y()), dFdy(eyePos.z()));
  const st0 = dFdx(varyingAttributes.uv);
  const st1 = dFdy(varyingAttributes.uv);

  const N = surfNorm;

  const q1perp = cross(q1, N);
  const q0perp = cross(N, q0);

  const T = q1perp.multiplyScalar(st0.x()).add(q0perp.multiplyScalar(st1.x()));
  const B = q1perp.multiplyScalar(st0.y()).add(q0perp.multiplyScalar(st1.y()));

  const det = max(dot(T, T), dot(B, B));
  const zero = float(0);
  const scale = select(
    det.equals(zero),
    zero,
    faceDirection.multiply(inversesqrt(det))
  );

  return normalize(
    T.multiplyScalar(mapN.x().multiply(scale))
      .add(B.multiplyScalar(mapN.y().multiply(scale)))
      .add(N.multiplyScalar(mapN.z()))
  );
}

export function colorToNormal(
  normalSample: Vec3Node | Vec4Node,
  normalScale: FloatNode | number
) {
  const _normalSample = vec3(normalSample);

  const mapN = _normalSample.multiplyScalar(float(2)).subtractScalar(float(1));
  const scaledMapN = mapN.multiply(vec3(normalScale, normalScale, float(1)));

  const vViewPosition = varyingVec3(transformed.mvPosition.xyz());
  return perturbNormal2Arb(
    vViewPosition,
    varyingTransformed.normal,
    scaledMapN,
    float(1)
  );
}

export function colorToNormalWithTangent(
  normalSample: Vec3Node | Vec4Node,
  normalScale: FloatNode | number
) {
  const _normalSample = vec3(normalSample);
  const objectTangent = attributes.tangent.xyz();
  const transformedTangent: Vec3Node = uniforms.modelViewMatrix
    .multiplyVec(vec4(objectTangent, 0))
    .xyz();
  const vNormal = varyingTransformed.normal;
  const vTangent = varyingVec3(normalize(transformedTangent));
  const vBitangent = varyingVec3(
    normalize(
      cross(transformed.normal, transformedTangent).multiplyScalar(
        attributes.tangent.w()
      )
    )
  );
  const vTBN = new ComponentsMat3Node(
    vTangent.x(),
    vTangent.y(),
    vTangent.z(),
    vBitangent.x(),
    vBitangent.y(),
    vBitangent.z(),
    vNormal.x(),
    vNormal.y(),
    vNormal.z()
  );
  const mapN = _normalSample.multiplyScalar(float(2)).subtractScalar(float(1));
  const scaledMapN = mapN.multiply(vec3(normalScale, normalScale, float(1)));
  return normalize(vTBN.multiplyVec(scaledMapN));
}

export function colorToNormalTriplanar(
  normalSample: Vec3Node | Vec4Node,
  normalScale: FloatNode | number
) {
  const _normalSample = vec3(normalSample);

  const xtan = vec3(0, 0, 1);
  const xbin = vec3(0, 1, 0);

  const ytan = vec3(1, 0, 0);
  const ybin = vec3(0, 0, 1);

  const ztan = vec3(1, 0, 0);
  const zbin = vec3(0, 1, 0);

  const normalizedNormal0 = normalize(transformed.normal);
  const normalizedNormal = normalizedNormal0.multiply(normalizedNormal0);

  const worldBinormal0 = normalize(
    xbin
      .multiplyScalar(normalizedNormal.x())
      .add(ybin.multiplyScalar(normalizedNormal.y()))
      .add(zbin.multiplyScalar(normalizedNormal.z()))
  );
  const worldTangent0 = normalize(
    xtan
      .multiplyScalar(normalizedNormal.x())
      .add(ytan.multiplyScalar(normalizedNormal.y()))
      .add(ztan.multiplyScalar(normalizedNormal.z()))
  );

  const worldTangent = uniforms.modelMatrix
    .multiplyVec(vec4(worldTangent0, 0.0))
    .xyz();
  const worldBinormal = uniforms.modelMatrix
    .multiplyVec(vec4(worldBinormal0, 0.0))
    .xyz();
  const worldNormal = uniforms.modelMatrix
    .multiplyVec(vec4(normalize(transformed.normal), 0.0))
    .xyz();

  const vTBN = varyingMat3(
    new ComponentsMat3Node(
      worldTangent.x(),
      worldTangent.y(),
      worldTangent.z(),
      worldBinormal.x(),
      worldBinormal.y(),
      worldBinormal.z(),
      worldNormal.x(),
      worldNormal.y(),
      worldNormal.z()
    )
  );
  const mapN = _normalSample.multiplyScalar(float(2)).subtractScalar(float(1));
  const scaledMapN = mapN.multiply(vec3(normalScale, normalScale, float(1)));
  return normalize(vTBN.multiplyVec(scaledMapN));
}
