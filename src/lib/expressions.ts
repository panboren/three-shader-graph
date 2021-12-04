import { Compiler } from './compiler';
import {
  FloatNode,
  IntNode,
  Mat2Node,
  Mat3Node,
  Mat4Node,
  RgbaNode,
  RgbNode,
  Vec2Node,
  Vec3Node,
  Vec4Node
} from './types';

export class IntExpressionNode extends IntNode {
  constructor(private readonly expr: string) {
    super();
  }
  public compile(c: Compiler) {
    return {
      out: this.expr,
    };
  }
}

export class FloatExpressionNode extends FloatNode {
  constructor(private readonly expr: string) {
    super();
  }
  public compile(c: Compiler) {
    return {
      out: this.expr,
    };
  }
}

export class Vec2ExpressionNode extends Vec2Node {
  constructor(private readonly expr: string) {
    super();
  }
  public compile(c: Compiler) {
    return {
      out: this.expr,
    };
  }
}

export class Vec3ExpressionNode extends Vec3Node {
  constructor(private readonly expr: string) {
    super();
  }
  public compile(c: Compiler) {
    return {
      out: this.expr,
    };
  }
}

export class Vec4ExpressionNode extends Vec4Node {
  constructor(private readonly expr: string) {
    super();
  }
  public compile(c: Compiler) {
    return {
      out: this.expr,
    };
  }
}

export class Mat2ExpressionNode extends Mat2Node {
  constructor(private readonly expr: string) {
    super();
  }
  public compile(c: Compiler) {
    return {
      out: this.expr,
    };
  }
}

export class Mat3ExpressionNode extends Mat3Node {
  constructor(private readonly expr: string) {
    super();
  }
  public compile(c: Compiler) {
    return {
      out: this.expr,
    };
  }
}

export class Mat4ExpressionNode extends Mat4Node {
  constructor(private readonly expr: string) {
    super();
  }
  public compile(c: Compiler) {
    return {
      out: this.expr,
    };
  }
}

export class RgbExpression extends RgbNode {
  constructor(private readonly expr: string) {
    super();
  }
  public compile(c: Compiler) {
    return {
      out: this.expr,
    };
  }
}

export class RgbaExpression extends RgbaNode {
  constructor(private readonly expr: string) {
    super();
  }
  public compile(c: Compiler) {
    return {
      out: this.expr,
    };
  }
}
