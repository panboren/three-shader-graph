import { AttributeVec4Node } from './attributes';
import { Compiler } from './compiler';
import {
  Mat3ExpressionNode,
  Mat4ExpressionNode,
  Vec2ExpressionNode,
  Vec3ExpressionNode,
  Vec4ExpressionNode,
} from './expressions';
import { identityTransform } from './transformation/transforms';
import { Mat4Node } from './types';
import { VaryingVec2Node, VaryingVec3Node } from './varying';

export const attributes = {
  tangent: new AttributeVec4Node('tangent'),
  position: new Vec3ExpressionNode('position'),
  normal: new Vec3ExpressionNode('normal'),
  uv: new Vec2ExpressionNode('uv'),
};

export const varyingAttributes = {
  position: new VaryingVec3Node(attributes.position),
  normal: new VaryingVec3Node(attributes.normal),
  uv: new VaryingVec2Node(attributes.uv),
};

class InstanceMatrixNode extends Mat4Node {
  public compile(c: Compiler) {
    const k = c.variable();
    const identity = c.get(identityTransform);
    return {
      chunk: `
        mat4 instanceMatrixOpt_${k} = ${identity};
        #ifdef USE_INSTANCING
          instanceMatrixOpt_${k} = instanceMatrix;
        #endif
      `,
      out: `instanceMatrixOpt_${k}`,
    };
  }
}

export const uniforms = {
  instanceMatrix: new InstanceMatrixNode(),
  modelMatrix: new Mat4ExpressionNode('modelMatrix'),
  modelViewMatrix: new Mat4ExpressionNode('modelViewMatrix'),
  projectionMatrix: new Mat4ExpressionNode('projectionMatrix'),
  viewMatrix: new Mat4ExpressionNode('viewMatrix'),
  normalMatrix: new Mat3ExpressionNode('normalMatrix'),
  cameraPosition: new Vec3ExpressionNode('cameraPosition'),
};

export const defaultVertPositionNode = new Vec4ExpressionNode(
  'projectionMatrix * modelViewMatrix * vec4( position , 1.0 )'
);
