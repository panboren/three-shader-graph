import { Mat4Node } from './types';
import { Compiler } from './compiler';
import { identityTransform } from './transformation/transforms';
import {
  Mat3ExpressionNode,
  Mat4ExpressionNode,
  Vec2ExpressionNode,
  Vec3ExpressionNode,
  Vec4ExpressionNode,
} from './expressions';

export const attributes = {
  position: new Vec3ExpressionNode('position'),
  normal: new Vec3ExpressionNode('normal'),
  uv: new Vec2ExpressionNode('uv'),
};

class InstanceMatrixNode extends Mat4Node {
  public compile(c: Compiler) {
    const k = c.variable();
    const identity = c.get(identityTransform)
    return {
      chunk: `
        mat4 instanceMatrixOpt_${k} = ${identity};
        #ifdef USE_INSTANCING
          instanceMatrixOpt_${k} = instanceMatrix;
        #endif
      `,
      out: `instanceMatrixOpt_${k}`
    }
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
