import { Vec4Node, uniforms, IRgbaNode, Mat4Node, uniformVec3, LinearToOutputTexelNode, AssignNode, vec4, attributes } from "..";
import { Compiler, FragmentCompiler } from "./compiler";
import { FogNode } from "./effects/fog";

export function outputPosition(position: Vec4Node) {
  return uniforms.projectionMatrix
    .multiply(uniforms.modelViewMatrix)
    .multiplyVec(uniforms.instanceMatrix.multiplyVec(position));
}

export class ShaderGraph {
  constructor(
    private readonly out: {
      readonly color: IRgbaNode;
      readonly transform: Mat4Node;
    }
  ) { }
  public compile() {
    const uniformFogColor = uniformVec3('fogColor');
    const colorWithEncoding = new LinearToOutputTexelNode(this.out.color);
    const colorWithFog = new FogNode(colorWithEncoding, uniformFogColor);

    const vertexCompiler = new Compiler();

    const transform = this.out.transform;

    vertexCompiler.get(new AssignNode('mat4 vertexTransform', transform));
    vertexCompiler.get(
      new AssignNode(
        'gl_Position',
        outputPosition(transform.multiplyVec(vec4(attributes.position, 1)))
      )
    );

    const compiler = new FragmentCompiler(vertexCompiler);
    compiler.get(new AssignNode('gl_FragColor', colorWithFog));


    const vertexShader = vertexCompiler.render();
    const fragmentShader = compiler.render();

    const uniforms: { [key: string]: { value: unknown } } = {
      ...vertexCompiler.uniforms,
      ...compiler.uniforms
    }

    return {
      vertexShader,
      fragmentShader,
      uniforms
    };
  }
}
