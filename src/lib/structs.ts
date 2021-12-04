// Custom struct for uniforms

import { Compiler, CompileResult, ShaderNode } from './compiler';
import { BaseType } from './nodes';

// In order to be able to define your own uniform struct type, you need to define a struct for it
export abstract class StructType implements ShaderNode<string> {
  static readonly typeName: string;
  abstract compile(c: Compiler);
  private readonly properties = new Map<string, BaseType<any>>();

  protected get<T extends ShaderNode<string>>(
    type: BaseType<T>,
    propertyName: string
  ): T {
    this.properties.set(propertyName, type);

    const self = this;
    // @ts-expect-error
    return new (class extends type {
      readonly propertyName = propertyName;
      compile(c: Compiler): CompileResult<string> {
        return { out: `${c.get(self)}.${propertyName}` };
      }
    })();
  }

  public definition() {
    const fields = Array.from(this.properties.entries())
      .map(([key, type]) => `${type.typeName} ${key};`)
      .join('\n');
    const structName = (<typeof StructType>this.constructor).typeName;
    return `
      struct ${structName} {
        ${fields}
      };
    `;
  }
}
