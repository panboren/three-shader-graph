import { float } from '../dsl';
import { FloatNode, RgbaNode } from '../types';

export class AlphaTestNode extends RgbaNode {
  constructor(private input: RgbaNode, private alphaTest: FloatNode | number) {
    super();
  }
  compile(c) {
    const color = c.get(this.input);
    const threshold = c.get(float(this.alphaTest));
    return {
      chunk: `
        if (${color}.w < ${threshold}) { discard; }
      `,
      out: color,
    };
  }
}
