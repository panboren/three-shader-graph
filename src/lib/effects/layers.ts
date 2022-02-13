import { mix } from '../functions';
import { RgbaNode } from '../types';


/**
 * Superimposes colors on top of each other showing 
 * colors beneath it if transparent. 
 */
export function layerColors(...colors: RgbaNode[]): RgbaNode {
  return colors.reduce((combined, color) => mix(combined, color, color.a()))
}