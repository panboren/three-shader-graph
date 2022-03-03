import { normalize, abs, dot } from "../functions"
import { Sampler2DNode, Vec3Node, FloatNode, RgbaNode } from "../types"
import { vec3 } from '../dsl';


export function triplanarMapping(texture: Sampler2DNode, normal: Vec3Node, position: Vec3Node, scale: FloatNode): RgbaNode {
  // Blending factor of triplanar mapping
  const bf0 = normalize(abs(normal))
  const bf = bf0.divideScalar(dot(bf0, vec3(1, 1, 1)))

  // Triplanar mapping
  const tx = position.yz().multiplyScalar(scale)
  const ty = position.zx().multiplyScalar(scale)
  const tz = position.xy().multiplyScalar(scale)

  // Base color
  const cx = texture.sample(tx).multiplyScalar(bf.x())
  const cy = texture.sample(ty).multiplyScalar(bf.y())
  const cz = texture.sample(tz).multiplyScalar(bf.z())

  return cx.add(cy).add(cz).rgba()
}