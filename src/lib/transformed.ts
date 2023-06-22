import { attributes, uniforms } from './common';
import { Mat4ExpressionNode } from './expressions';
import { inverse, transpose } from './functions';
import { getX, getY, getZ } from './helpers';
import { ComponentsVec4Node, ConstantFloatNode, Vec3Node } from './types';
import { VaryingVec3Node, VaryingVec4Node } from './varying';

const vertexTransform = new Mat4ExpressionNode('vertexTransform');
const transformedVertex = uniforms.instanceMatrix.multiplyVec(
  vertexTransform.multiplyVec(vec3toVec4(attributes.position))
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

export const varyingTransformed = {
  position: new VaryingVec4Node(transformed.position),
  mvPosition: new VaryingVec4Node(transformed.mvPosition),
  normal: new VaryingVec3Node(transformed.normal),
};

function vec3toVec4(v: Vec3Node) {
  return new ComponentsVec4Node(
    getX(v),
    getY(v),
    getZ(v),
    new ConstantFloatNode(1)
  );
}
