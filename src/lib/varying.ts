import { Compiler, FragmentCompiler } from './compiler';
import {
  FloatNode,
  IFloatNode,
  IMat2Node,
  IMat3Node,
  IMat4Node,
  IVec2Node,
  IVec3Node,
  IVec4Node,
  Mat2Node,
  Mat3Node,
  Mat4Node,
  Vec2Node,
  Vec3Node,
  Vec4Node,
} from './types';

export class VaryingFloatNode extends FloatNode {
  constructor(private readonly a: IFloatNode) {
    super();
  }
  public compile(c: Compiler) {
    if (c instanceof FragmentCompiler) {
      return c.defineVarying('float', this.a);
    } else {
      throw new Error(
        'A varying can not be defined as input to another varying.'
      );
    }
  }
}

export class VaryingVec2Node extends Vec2Node {
  constructor(private readonly a: IVec2Node) {
    super();
  }
  public compile(c: Compiler) {
    if (c instanceof FragmentCompiler) {
      return c.defineVarying('vec2', this.a);
    } else {
      throw new Error(
        'A varying can not be defined as input to another varying.'
      );
    }
  }
}

export class VaryingVec3Node extends Vec3Node {
  constructor(private readonly a: IVec3Node) {
    super();
  }
  public compile(c: Compiler) {
    if (c instanceof FragmentCompiler) {
      return c.defineVarying('vec3', this.a);
    } else {
      throw new Error(
        'A varying can not be defined as input to another varying.'
      );
    }
  }
}

export class VaryingVec4Node extends Vec4Node {
  constructor(private readonly a: IVec4Node) {
    super();
  }
  public compile(c: Compiler) {
    if (c instanceof FragmentCompiler) {
      return c.defineVarying('vec4', this.a);
    } else {
      throw new Error(
        'A varying can not be defined as input to another varying.'
      );
    }
  }
}

export class VaryingMat2Node extends Mat2Node {
  constructor(private readonly a: IMat2Node) {
    super();
  }
  public compile(c: Compiler) {
    if (c instanceof FragmentCompiler) {
      return c.defineVarying('mat2', this.a);
    } else {
      throw new Error(
        'A varying can not be defined as input to another varying.'
      );
    }
  }
}

export class VaryingMat3Node extends Mat3Node {
  constructor(private readonly a: IMat3Node) {
    super();
  }
  public compile(c: Compiler) {
    if (c instanceof FragmentCompiler) {
      return c.defineVarying('mat3', this.a);
    } else {
      throw new Error(
        'A varying can not be defined as input to another varying.'
      );
    }
  }
}

export class VaryingMat4Node extends Mat4Node {
  constructor(private readonly a: IMat4Node) {
    super();
  }
  public compile(c: Compiler) {
    if (c instanceof FragmentCompiler) {
      return c.defineVarying('mat4', this.a);
    } else {
      throw new Error(
        'A varying can not be defined as input to another varying.'
      );
    }
  }
}
