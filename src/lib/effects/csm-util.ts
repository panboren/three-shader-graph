import {
  float,
  FloatNode,
  int,
  IntExpressionNode,
  IntNode,
  select,
  selectPreCompile,
  UniformArrayNode,
  Vec2Node,
} from '../..';
import { varyingTransformed } from '../transformed';

import { uniformCameraNear, uniformShadowFar } from './common-material';

const linearDepth = varyingTransformed.mvPosition
  .z()
  .multiply(float(-1))
  .divide(uniformShadowFar.subtract(uniformCameraNear));

export const CSM_CASCADES = new IntExpressionNode('CSM_CASCADES');
export const CSM_cascades = new UniformArrayNode(
  'CSM_cascades',
  Vec2Node,
  CSM_CASCADES
);

export function CSM_LightFactor(i: IntNode): FloatNode {
  const isCsmLight = i.lt(CSM_CASCADES);
  return selectPreCompile(
    isCsmLight,
    select(
      linearDepth
        .gte(CSM_cascades.get(i).x())
        .and(
          linearDepth
            .lt(CSM_cascades.get(i).y())
            .or(i.equals(CSM_CASCADES.subtract(int(1))))
        ),
      float(1.0),
      float(0.0)
    ),
    float(1.0)
  );
}

export function CSM_ShadowSelector(i: IntNode, shadowNode: FloatNode) {
  const isCsmLight = i.lt(CSM_CASCADES);
  return selectPreCompile(
    isCsmLight,
    select(
      linearDepth
        .gte(CSM_cascades.get(i).x())
        .and(linearDepth.lt(CSM_cascades.get(i).y())),
      shadowNode,
      float(1.0)
    ),
    shadowNode
  );
}
