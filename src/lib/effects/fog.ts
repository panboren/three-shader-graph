import { FragmentCompiler } from '../compiler';
import { uniformFloat, varyingFloat } from '../dsl';
import { transformed } from '../transformed';
import { IRgbNode, RgbaNode } from '../types';

export class FogNode extends RgbaNode {
  constructor(
    private readonly source: RgbaNode,
    private readonly fogColor: IRgbNode
  ) {
    super();
  }
  public compile(c: FragmentCompiler) {
    const k = c.variable();

    const sourceColor = c.get(this.source.rgb());
    const sourceAlpha = c.get(this.source.a());
    const fogColor = c.get(this.fogColor);
    const fogFar = c.get(uniformFloat('fogFar'));
    const fogNear = c.get(uniformFloat('fogNear'));
    const fogDensity = c.get(uniformFloat('fogDensity'));

    const vFogDepth = c.get(varyingFloat(transformed.mvPosition.z()));
    return {
      pars: `
      `,
      chunk: `
        #ifdef FOG_EXP2
          float fogFactor_${k} = 1.0 - exp( - ${fogDensity} * ${fogDensity} * ${vFogDepth} * ${vFogDepth} );
        #else
          float fogFactor_${k} = smoothstep( ${fogNear}, ${fogFar}, ${vFogDepth} );
        #endif
        vec4 color_vec4_${k} = vec4(mix(${sourceColor}, ${fogColor}, fogFactor_${k}), ${sourceAlpha});
      `,
      out: `color_vec4_${k}`,
    };
  }
}
