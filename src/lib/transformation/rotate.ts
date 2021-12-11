import { attributes } from '../common';
import { float, vec4 } from '../dsl';
import { cos, normalize, sin } from '../functions';
import {
  ComponentsMat4Node,
  FloatNode,
  Vec3Node,
  Vec4Node
} from '../types';

/*

mat4 rotationMatrix(vec3 axis, float angle) {
    axis = normalize(axis);
    float s = sin(angle);
    float c = cos(angle);
    float oc = 1.0 - c;
    
    return mat4(oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,  0.0,
                oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,  0.0,
                oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c,           0.0,
                0.0,                                0.0,                                0.0,                                1.0);
}
*/

export function rotateAxis(rotationAxis: Vec3Node, angle: FloatNode) {
  const axis = normalize(rotationAxis);
  const s = sin(angle);
  const c = cos(angle);
  const oc = float(1).subtract(c);

  const a1 = oc.multiply(axis.x()).multiply(axis.x()).add(c);
  const a2 = oc
    .multiply(axis.x())
    .multiply(axis.y())
    .subtract(axis.z().multiply(s));
  const a3 = oc.multiply(axis.z()).multiply(axis.x()).add(axis.y().multiply(s));
  const a4 = float(0);

  const b1 = oc.multiply(axis.x()).multiply(axis.y()).add(axis.z().multiply(s));
  const b2 = oc.multiply(axis.y()).multiply(axis.y()).add(c);
  const b3 = oc
    .multiply(axis.y())
    .multiply(axis.z())
    .subtract(axis.x().multiply(s));
  const b4 = float(0);

  const c1 = oc
    .multiply(axis.z())
    .multiply(axis.x())
    .subtract(axis.y().multiply(s));
  const c2 = oc.multiply(axis.y()).multiply(axis.z()).add(axis.x().multiply(s));
  const c3 = oc.multiply(axis.z()).multiply(axis.z()).add(c);
  const c4 = float(0);

  const d1 = float(0);
  const d2 = float(0);
  const d3 = float(0);
  const d4 = float(1);

  return new ComponentsMat4Node(
    a1,
    a2,
    a3,
    a4,
    b1,
    b2,
    b3,
    b4,
    c1,
    c2,
    c3,
    c4,
    d1,
    d2,
    d3,
    d4
  );
}

export function rotateVertex(
  position: Vec3Node = attributes.position,
  rotationAxis: Vec3Node,
  angle: FloatNode
): Vec4Node {
  return rotateAxis(rotationAxis, angle).multiplyVec(vec4(position, 1));
}
