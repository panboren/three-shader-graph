import { Compiler, FragmentCompiler } from './compiler';
import {
  FloatNode,
  Mat2Node,
  Mat3Node,
  Mat4Node,
  RgbaNode,
  RgbNode,
  Vec2Node,
  Vec3Node,
  Vec4Node,
} from './types';

function compileAttribute(name: string, type: string) {
  return {
    pars: `
      attribute ${type} ${name};
    `,
    out: name,
  };
}

export class AttributeFloatNode extends FloatNode {
  constructor(private readonly name: string) {
    super();
  }
  public compile(c: Compiler) {
    if (c instanceof FragmentCompiler) {
      return c.defineVarying('float', this);
    }
    return compileAttribute(this.name, 'float');
  }
}

export class AttributeVec2Node extends Vec2Node {
  constructor(private readonly name: string) {
    super();
  }
  public compile(c: Compiler) {
    if (c instanceof FragmentCompiler) {
      return c.defineVarying('vec2', this);
    }
    return compileAttribute(this.name, 'vec2');
  }
}

export class AttributeVec3Node extends Vec3Node {
  constructor(private readonly name: string) {
    super();
  }
  public compile(c: Compiler) {
    if (c instanceof FragmentCompiler) {
      return c.defineVarying('vec3', this);
    }
    return compileAttribute(this.name, 'vec3');
  }
}

export class AttributeVec4Node extends Vec4Node {
  constructor(private readonly name: string) {
    super();
  }
  public compile(c: Compiler) {
    if (c instanceof FragmentCompiler) {
      return c.defineVarying('vec4', this);
    }
    return compileAttribute(this.name, 'vec4');
  }
}

export class AttributeMat2Node extends Mat2Node {
  constructor(private readonly name: string) {
    super();
  }
  public compile(c: Compiler) {
    if (c instanceof FragmentCompiler) {
      return c.defineVarying('mat2', this);
    }
    return compileAttribute(this.name, 'mat2');
  }
}

export class AttributeMat3Node extends Mat3Node {
  constructor(private readonly name: string) {
    super();
  }
  public compile(c: Compiler) {
    if (c instanceof FragmentCompiler) {
      return c.defineVarying('mat3', this);
    }
    return compileAttribute(this.name, 'mat3');
  }
}

export class AttributeMat4Node extends Mat4Node {
  constructor(private readonly name: string) {
    super();
  }
  public compile(c: Compiler) {
    if (c instanceof FragmentCompiler) {
      return c.defineVarying('mat4', this);
    }
    return compileAttribute(this.name, 'mat4');
  }
}

export class AttributeRgbNode extends RgbNode {
  constructor(private readonly name: string) {
    super();
  }
  public compile(c: Compiler) {
    if (c instanceof FragmentCompiler) {
      return c.defineVarying('vec3', this);
    }
    return compileAttribute(this.name, 'vec3');
  }
}

export class AttributeRgbaNode extends RgbaNode {
  constructor(private readonly name: string) {
    super();
  }
  public compile(c: Compiler) {
    if (c instanceof FragmentCompiler) {
      return c.defineVarying('vec4', this);
    }
    return compileAttribute(this.name, 'vec4');
  }
}
