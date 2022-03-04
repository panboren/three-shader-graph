import { attributes, uniforms } from "../common"
import { vec3, vec4, varyingVec3, float } from "../dsl"
import { normalize, cross } from "../functions"
import { transformed, varyingTransformed } from '../transformed';
import { Vec3Node, Vec4Node, FloatNode, ComponentsMat3Node } from "../types"

export function colorToNormal(normalSample: Vec3Node | Vec4Node, normalScale: FloatNode | number) {
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