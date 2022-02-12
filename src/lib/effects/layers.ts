import { mix } from '../functions';
import { RgbaNode } from '../types';
import { rgba, uniformSampler2d, varyingVec2 } from '../dsl';
import { attributes } from '../common';


/**
 * Superimposes colors on top of each other showing 
 * colors beneath it if transparent. 
 */
export function layerColors(...colors: RgbaNode[]): RgbaNode {
  return colors.reduce((combined, color) =>
    mix(combined, color, color.a()))
}


const vUV = varyingVec2(attributes.uv)
const baseColor = rgba('#fd3d22')
const backgroundColor = uniformSampler2d('backgroundMap').sample(vUV)
const foregroundColor = uniformSampler2d('detailsMap').sample(vUV)
const finalColor = layerColors(baseColor, backgroundColor, foregroundColor)

