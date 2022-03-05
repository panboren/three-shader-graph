import { attributes, uniforms, varyingAttributes } from '../common';
import { vec3, vec4, varyingVec3, float } from '../dsl';
import { normalize, cross, dFdx, dFdy, max, dot, inversesqrt } from '../functions';
import { select } from '../nodes';
import { transformed, varyingTransformed } from '../transformed';
import { Vec3Node, Vec4Node, FloatNode, ComponentsMat3Node } from "../types"

function perturbNormal2Arb(eyePos: Vec3Node, surfNorm: Vec3Node, mapN: Vec3Node, faceDirection: FloatNode): Vec3Node {
  const q0 = vec3(dFdx(eyePos.x()), dFdx(eyePos.y()), dFdx(eyePos.z()));
  const q1 = vec3(dFdy(eyePos.x()), dFdy(eyePos.y()), dFdy(eyePos.z()));
  const st0 = dFdx(varyingAttributes.uv);
  const st1 = dFdy(varyingAttributes.uv);

  const N = surfNorm

  const q1perp = cross(q1, N);
  const q0perp = cross(N, q0);

  const T = q1perp.multiplyScalar(st0.x()).add(q0perp.multiplyScalar(st1.x()));
  const B = q1perp.multiplyScalar(st0.y()).add(q0perp.multiplyScalar(st1.y()));

  const det = max(dot(T, T), dot(B, B));
  const zero = float(0);
  const scale = select(det.equals(zero), zero, faceDirection.multiply(inversesqrt(det)))

  return normalize(T.multiplyScalar(mapN.x().multiply(scale)).add(B.multiplyScalar(mapN.y().multiply(scale))).add(N.multiplyScalar(mapN.z())))
}

export function colorToNormal(normalSample: Vec3Node | Vec4Node, normalScale: FloatNode | number) {
  const _normalSample = vec3(normalSample)

  const mapN = _normalSample.multiplyScalar(float(2)).subtractScalar(float(1))
  const scaledMapN = mapN.multiply(vec3(normalScale, normalScale, float(1)))

  const vViewPosition = varyingVec3(transformed.mvPosition.xyz())
  return perturbNormal2Arb((vViewPosition), varyingTransformed.normal, scaledMapN, float(1))
}

export function colorToNormalWithTangent(normalSample: Vec3Node | Vec4Node, normalScale: FloatNode | number) {
  const _normalSample = vec3(normalSample)
  const objectTangent = attributes.tangent.xyz()
  const transformedTangent: Vec3Node = uniforms.modelViewMatrix.multiplyVec(vec4(objectTangent, 0)).xyz()
  const vNormal = varyingTransformed.normal
  const vTangent = varyingVec3(normalize(transformedTangent))
  const vBitangent = varyingVec3(normalize(cross(transformed.normal, transformedTangent).multiplyScalar(attributes.tangent.w())))
  const vTBN = new ComponentsMat3Node(
    vTangent.x(), vTangent.y(), vTangent.z(),
    vBitangent.x(), vBitangent.y(), vBitangent.z(),
    vNormal.x(), vNormal.y(), vNormal.z()
  )
  const mapN = _normalSample.multiplyScalar(float(2)).subtractScalar(float(1))
  const scaledMapN = mapN.multiply(vec3(normalScale, normalScale, float(1)))
  return normalize(vTBN.multiplyVec(scaledMapN))
}