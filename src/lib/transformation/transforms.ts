import { Matrix4, Vector3 } from 'three';

import { ConstantMat4Node, FloatNode, Mat4Node } from '../types';

export const identityTransform = new ConstantMat4Node(new Matrix4().identity());

export function translateX(amount: FloatNode): Mat4Node {
  return translateAxis(new Vector3(1, 0, 0), amount);
}

export function translateY(amount: FloatNode): Mat4Node {
  return translateAxis(new Vector3(0, 1, 0), amount);
}

export function translateZ(amount: FloatNode): Mat4Node {
  return translateAxis(new Vector3(0, 0, 1), amount);
}

export function translateAxis(axis: Vector3, amount: FloatNode): Mat4Node {
  const translateMat = new ConstantMat4Node(
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    axis.x,
    axis.y,
    axis.z,
    0
  );
  return identityTransform.add(translateMat.multiplyScalar(amount));
}


export function combineTransforms(...transforms: Mat4Node[]) {
  return transforms.reduce((a, v) => a.multiply(v), identityTransform)
}