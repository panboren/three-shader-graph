import { abs, normalize } from '../functions';
import { FloatNode, RgbaNode, Sampler2DNode, Vec3Node } from '../types';

export function triplanarMapping(
  texture: Sampler2DNode,
  normal: Vec3Node,
  position: Vec3Node,
  scale: FloatNode
): RgbaNode {
  // Blending factor of triplanar mapping
  const bf = normalize(abs(normal));

  // Triplanar mapping
  const tx = position.yz().multiplyScalar(scale);
  const ty = position.zx().multiplyScalar(scale);
  const tz = position.xy().multiplyScalar(scale);

  // Base color
  const cx = texture.sample(tx).multiplyScalar(bf.x());
  const cy = texture.sample(ty).multiplyScalar(bf.y());
  const cz = texture.sample(tz).multiplyScalar(bf.z());

  return cx.add(cy).add(cz).rgba();
}
