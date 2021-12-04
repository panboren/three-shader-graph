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

export const uniforms = {
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
