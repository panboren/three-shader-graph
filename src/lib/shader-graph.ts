import {
  AssignNode,
  IRgbaNode,
  LinearToOutputTexelNode,
  Mat4Node,
  uniforms,
  uniformVec3,
  Vec4Node,
} from '..';

import { Compiler, FragmentCompiler } from './compiler';
import { AlphaTestNode } from './effects/alpha-test';
import { FogNode } from './effects/fog';
import { transformed } from './transformed';

export function outputPosition(position: Vec4Node) {
  return uniforms.projectionMatrix
    .multiply(uniforms.modelViewMatrix)
    .multiplyVec(position);
}

export interface ShaderGraphOptions {
  alphaTest: number;
}

const OptionDefaults = <ShaderGraphOptions>{
  alphaTest: 0,
};

export class ShaderGraph {
  constructor(
    private readonly out: {
      readonly color: IRgbaNode;
      readonly transform: Mat4Node;
    },
    private options: ShaderGraphOptions = OptionDefaults
  ) {}
  public compile() {
    const uniformFogColor = uniformVec3('fogColor');
    const colorWithEncoding = new LinearToOutputTexelNode(this.out.color);
    const colorWithFog = new FogNode(colorWithEncoding, uniformFogColor);
    const colorWithAlphaTest = new AlphaTestNode(
      colorWithFog,
      this.options.alphaTest
    );

    const vertexCompiler = new Compiler();

    const transform = this.out.transform;

    vertexCompiler.get(new AssignNode('mat4 vertexTransform', transform));
    vertexCompiler.get(
      new AssignNode('gl_Position', outputPosition(transformed.position))
    );

    const compiler = new FragmentCompiler(vertexCompiler);
    compiler.get(new AssignNode('gl_FragColor', colorWithAlphaTest));

    const vertexShader = vertexCompiler.render();
    const fragmentShader = compiler.render();

    const uniforms: { [key: string]: { value: unknown } } = {
      ...vertexCompiler.uniforms,
      ...compiler.uniforms,
    };

    return {
      vertexShader,
      fragmentShader,
      uniforms,
    };
  }
}
