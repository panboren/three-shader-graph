import { normalize, abs, dot } from "../functions"
import { Sampler2DNode, Vec3Node, FloatNode, RgbaNode } from "../types"
import { float, vec3 } from '../dsl';
import { varyingAttributes } from '../common';


export function triplanarMapping(
  texture: Sampler2DNode,
  scale: FloatNode | number,
  normal: Vec3Node = varyingAttributes.normal,
  position: Vec3Node = varyingAttributes.position
): RgbaNode {
  const _scale = float(scale)

  // Blending factor of triplanar mapping
  const bf0 = normalize(abs(normal))
  const bf = bf0.divideScalar(dot(bf0, vec3(1, 1, 1)))

  // Triplanar mapping
  const tx = position.yz().multiplyScalar(_scale)
  const ty = position.zx().multiplyScalar(_scale)
  const tz = position.xy().multiplyScalar(_scale)

  // Base color
  const cx = texture.sample(tx).multiplyScalar(bf.x())
  const cy = texture.sample(ty).multiplyScalar(bf.y())
  const cz = texture.sample(tz).multiplyScalar(bf.z())

  return cx.add(cy).add(cz).rgba()
}