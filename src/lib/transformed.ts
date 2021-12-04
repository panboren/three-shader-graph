import { attributes, uniforms } from './common';
import { Mat4ExpressionNode } from './expressions';
import { inverse, transpose } from './functions';
import {
  ComponentsVec4Node,
  ConstantFloatNode,
  getX,
  getY,
  getZ,
  Vec3Node,
} from './types';

const vertexTransform = new Mat4ExpressionNode('vertexTransform');
const transformedVertex = vertexTransform.multiplyVec(
  vec3toVec4(attributes.position)
);

export const transformed = {
  position: transformedVertex,
  mvPosition: uniforms.modelViewMatrix.multiplyVec(transformedVertex),
  normal: uniforms.normalMatrix.multiplyVec(
    transpose(inverse(vertexTransform))
      .multiplyVec(vec3toVec4(attributes.normal))
      .xyz()
  ),
};

function vec3toVec4(v: Vec3Node) {
  return new ComponentsVec4Node(
    getX(v),
    getY(v),
    getZ(v),
    new ConstantFloatNode(1)
  );
}
