var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// node_modules/is-any-array/lib/index.js
var require_lib = __commonJS({
  "node_modules/is-any-array/lib/index.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.isAnyArray = void 0;
    var toString = Object.prototype.toString;
    function isAnyArray(value) {
      const tag = toString.call(value);
      return tag.endsWith("Array]") && !tag.includes("Big");
    }
    exports2.isAnyArray = isAnyArray;
  }
});

// node_modules/ml-array-max/lib/index.js
var require_lib2 = __commonJS({
  "node_modules/ml-array-max/lib/index.js"(exports2, module2) {
    "use strict";
    var isAnyArray = require_lib();
    function max(input, options = {}) {
      if (!isAnyArray.isAnyArray(input)) {
        throw new TypeError("input must be an array");
      }
      if (input.length === 0) {
        throw new TypeError("input must not be empty");
      }
      const { fromIndex = 0, toIndex = input.length } = options;
      if (fromIndex < 0 || fromIndex >= input.length || !Number.isInteger(fromIndex)) {
        throw new Error("fromIndex must be a positive integer smaller than length");
      }
      if (toIndex <= fromIndex || toIndex > input.length || !Number.isInteger(toIndex)) {
        throw new Error(
          "toIndex must be an integer greater than fromIndex and at most equal to length"
        );
      }
      let maxValue = input[fromIndex];
      for (let i = fromIndex + 1; i < toIndex; i++) {
        if (input[i] > maxValue) maxValue = input[i];
      }
      return maxValue;
    }
    module2.exports = max;
  }
});

// node_modules/ml-array-min/lib/index.js
var require_lib3 = __commonJS({
  "node_modules/ml-array-min/lib/index.js"(exports2, module2) {
    "use strict";
    var isAnyArray = require_lib();
    function min(input, options = {}) {
      if (!isAnyArray.isAnyArray(input)) {
        throw new TypeError("input must be an array");
      }
      if (input.length === 0) {
        throw new TypeError("input must not be empty");
      }
      const { fromIndex = 0, toIndex = input.length } = options;
      if (fromIndex < 0 || fromIndex >= input.length || !Number.isInteger(fromIndex)) {
        throw new Error("fromIndex must be a positive integer smaller than length");
      }
      if (toIndex <= fromIndex || toIndex > input.length || !Number.isInteger(toIndex)) {
        throw new Error(
          "toIndex must be an integer greater than fromIndex and at most equal to length"
        );
      }
      let minValue = input[fromIndex];
      for (let i = fromIndex + 1; i < toIndex; i++) {
        if (input[i] < minValue) minValue = input[i];
      }
      return minValue;
    }
    module2.exports = min;
  }
});

// node_modules/ml-array-rescale/lib/index.js
var require_lib4 = __commonJS({
  "node_modules/ml-array-rescale/lib/index.js"(exports2, module2) {
    "use strict";
    var isAnyArray = require_lib();
    var max = require_lib2();
    var min = require_lib3();
    function _interopDefaultLegacy(e) {
      return e && typeof e === "object" && "default" in e ? e : { "default": e };
    }
    var max__default = /* @__PURE__ */ _interopDefaultLegacy(max);
    var min__default = /* @__PURE__ */ _interopDefaultLegacy(min);
    function rescale(input, options = {}) {
      if (!isAnyArray.isAnyArray(input)) {
        throw new TypeError("input must be an array");
      } else if (input.length === 0) {
        throw new TypeError("input must not be empty");
      }
      let output;
      if (options.output !== void 0) {
        if (!isAnyArray.isAnyArray(options.output)) {
          throw new TypeError("output option must be an array if specified");
        }
        output = options.output;
      } else {
        output = new Array(input.length);
      }
      const currentMin = min__default["default"](input);
      const currentMax = max__default["default"](input);
      if (currentMin === currentMax) {
        throw new RangeError(
          "minimum and maximum input values are equal. Cannot rescale a constant array"
        );
      }
      const {
        min: minValue = options.autoMinMax ? currentMin : 0,
        max: maxValue = options.autoMinMax ? currentMax : 1
      } = options;
      if (minValue >= maxValue) {
        throw new RangeError("min option must be smaller than max option");
      }
      const factor = (maxValue - minValue) / (currentMax - currentMin);
      for (let i = 0; i < input.length; i++) {
        output[i] = (input[i] - currentMin) * factor + minValue;
      }
      return output;
    }
    module2.exports = rescale;
  }
});

// node_modules/ml-matrix/matrix.js
var require_matrix = __commonJS({
  "node_modules/ml-matrix/matrix.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var isAnyArray = require_lib();
    var rescale = require_lib4();
    var indent = " ".repeat(2);
    var indentData = " ".repeat(4);
    function inspectMatrix() {
      return inspectMatrixWithOptions(this);
    }
    function inspectMatrixWithOptions(matrix2, options = {}) {
      const {
        maxRows = 15,
        maxColumns = 10,
        maxNumSize = 8,
        padMinus = "auto"
      } = options;
      return `${matrix2.constructor.name} {
${indent}[
${indentData}${inspectData(matrix2, maxRows, maxColumns, maxNumSize, padMinus)}
${indent}]
${indent}rows: ${matrix2.rows}
${indent}columns: ${matrix2.columns}
}`;
    }
    function inspectData(matrix2, maxRows, maxColumns, maxNumSize, padMinus) {
      const { rows, columns } = matrix2;
      const maxI = Math.min(rows, maxRows);
      const maxJ = Math.min(columns, maxColumns);
      const result = [];
      if (padMinus === "auto") {
        padMinus = false;
        loop: for (let i = 0; i < maxI; i++) {
          for (let j = 0; j < maxJ; j++) {
            if (matrix2.get(i, j) < 0) {
              padMinus = true;
              break loop;
            }
          }
        }
      }
      for (let i = 0; i < maxI; i++) {
        let line = [];
        for (let j = 0; j < maxJ; j++) {
          line.push(formatNumber(matrix2.get(i, j), maxNumSize, padMinus));
        }
        result.push(`${line.join(" ")}`);
      }
      if (maxJ !== columns) {
        result[result.length - 1] += ` ... ${columns - maxColumns} more columns`;
      }
      if (maxI !== rows) {
        result.push(`... ${rows - maxRows} more rows`);
      }
      return result.join(`
${indentData}`);
    }
    function formatNumber(num, maxNumSize, padMinus) {
      return (num >= 0 && padMinus ? ` ${formatNumber2(num, maxNumSize - 1)}` : formatNumber2(num, maxNumSize)).padEnd(maxNumSize);
    }
    function formatNumber2(num, len) {
      let str = num.toString();
      if (str.length <= len) return str;
      let fix = num.toFixed(len);
      if (fix.length > len) {
        fix = num.toFixed(Math.max(0, len - (fix.length - len)));
      }
      if (fix.length <= len && !fix.startsWith("0.000") && !fix.startsWith("-0.000")) {
        return fix;
      }
      let exp = num.toExponential(len);
      if (exp.length > len) {
        exp = num.toExponential(Math.max(0, len - (exp.length - len)));
      }
      return exp.slice(0);
    }
    function installMathOperations(AbstractMatrix3, Matrix4) {
      AbstractMatrix3.prototype.add = function add(value) {
        if (typeof value === "number") return this.addS(value);
        return this.addM(value);
      };
      AbstractMatrix3.prototype.addS = function addS(value) {
        for (let i = 0; i < this.rows; i++) {
          for (let j = 0; j < this.columns; j++) {
            this.set(i, j, this.get(i, j) + value);
          }
        }
        return this;
      };
      AbstractMatrix3.prototype.addM = function addM(matrix2) {
        matrix2 = Matrix4.checkMatrix(matrix2);
        if (this.rows !== matrix2.rows || this.columns !== matrix2.columns) {
          throw new RangeError("Matrices dimensions must be equal");
        }
        for (let i = 0; i < this.rows; i++) {
          for (let j = 0; j < this.columns; j++) {
            this.set(i, j, this.get(i, j) + matrix2.get(i, j));
          }
        }
        return this;
      };
      AbstractMatrix3.add = function add(matrix2, value) {
        const newMatrix = new Matrix4(matrix2);
        return newMatrix.add(value);
      };
      AbstractMatrix3.prototype.sub = function sub(value) {
        if (typeof value === "number") return this.subS(value);
        return this.subM(value);
      };
      AbstractMatrix3.prototype.subS = function subS(value) {
        for (let i = 0; i < this.rows; i++) {
          for (let j = 0; j < this.columns; j++) {
            this.set(i, j, this.get(i, j) - value);
          }
        }
        return this;
      };
      AbstractMatrix3.prototype.subM = function subM(matrix2) {
        matrix2 = Matrix4.checkMatrix(matrix2);
        if (this.rows !== matrix2.rows || this.columns !== matrix2.columns) {
          throw new RangeError("Matrices dimensions must be equal");
        }
        for (let i = 0; i < this.rows; i++) {
          for (let j = 0; j < this.columns; j++) {
            this.set(i, j, this.get(i, j) - matrix2.get(i, j));
          }
        }
        return this;
      };
      AbstractMatrix3.sub = function sub(matrix2, value) {
        const newMatrix = new Matrix4(matrix2);
        return newMatrix.sub(value);
      };
      AbstractMatrix3.prototype.subtract = AbstractMatrix3.prototype.sub;
      AbstractMatrix3.prototype.subtractS = AbstractMatrix3.prototype.subS;
      AbstractMatrix3.prototype.subtractM = AbstractMatrix3.prototype.subM;
      AbstractMatrix3.subtract = AbstractMatrix3.sub;
      AbstractMatrix3.prototype.mul = function mul(value) {
        if (typeof value === "number") return this.mulS(value);
        return this.mulM(value);
      };
      AbstractMatrix3.prototype.mulS = function mulS(value) {
        for (let i = 0; i < this.rows; i++) {
          for (let j = 0; j < this.columns; j++) {
            this.set(i, j, this.get(i, j) * value);
          }
        }
        return this;
      };
      AbstractMatrix3.prototype.mulM = function mulM(matrix2) {
        matrix2 = Matrix4.checkMatrix(matrix2);
        if (this.rows !== matrix2.rows || this.columns !== matrix2.columns) {
          throw new RangeError("Matrices dimensions must be equal");
        }
        for (let i = 0; i < this.rows; i++) {
          for (let j = 0; j < this.columns; j++) {
            this.set(i, j, this.get(i, j) * matrix2.get(i, j));
          }
        }
        return this;
      };
      AbstractMatrix3.mul = function mul(matrix2, value) {
        const newMatrix = new Matrix4(matrix2);
        return newMatrix.mul(value);
      };
      AbstractMatrix3.prototype.multiply = AbstractMatrix3.prototype.mul;
      AbstractMatrix3.prototype.multiplyS = AbstractMatrix3.prototype.mulS;
      AbstractMatrix3.prototype.multiplyM = AbstractMatrix3.prototype.mulM;
      AbstractMatrix3.multiply = AbstractMatrix3.mul;
      AbstractMatrix3.prototype.div = function div(value) {
        if (typeof value === "number") return this.divS(value);
        return this.divM(value);
      };
      AbstractMatrix3.prototype.divS = function divS(value) {
        for (let i = 0; i < this.rows; i++) {
          for (let j = 0; j < this.columns; j++) {
            this.set(i, j, this.get(i, j) / value);
          }
        }
        return this;
      };
      AbstractMatrix3.prototype.divM = function divM(matrix2) {
        matrix2 = Matrix4.checkMatrix(matrix2);
        if (this.rows !== matrix2.rows || this.columns !== matrix2.columns) {
          throw new RangeError("Matrices dimensions must be equal");
        }
        for (let i = 0; i < this.rows; i++) {
          for (let j = 0; j < this.columns; j++) {
            this.set(i, j, this.get(i, j) / matrix2.get(i, j));
          }
        }
        return this;
      };
      AbstractMatrix3.div = function div(matrix2, value) {
        const newMatrix = new Matrix4(matrix2);
        return newMatrix.div(value);
      };
      AbstractMatrix3.prototype.divide = AbstractMatrix3.prototype.div;
      AbstractMatrix3.prototype.divideS = AbstractMatrix3.prototype.divS;
      AbstractMatrix3.prototype.divideM = AbstractMatrix3.prototype.divM;
      AbstractMatrix3.divide = AbstractMatrix3.div;
      AbstractMatrix3.prototype.mod = function mod(value) {
        if (typeof value === "number") return this.modS(value);
        return this.modM(value);
      };
      AbstractMatrix3.prototype.modS = function modS(value) {
        for (let i = 0; i < this.rows; i++) {
          for (let j = 0; j < this.columns; j++) {
            this.set(i, j, this.get(i, j) % value);
          }
        }
        return this;
      };
      AbstractMatrix3.prototype.modM = function modM(matrix2) {
        matrix2 = Matrix4.checkMatrix(matrix2);
        if (this.rows !== matrix2.rows || this.columns !== matrix2.columns) {
          throw new RangeError("Matrices dimensions must be equal");
        }
        for (let i = 0; i < this.rows; i++) {
          for (let j = 0; j < this.columns; j++) {
            this.set(i, j, this.get(i, j) % matrix2.get(i, j));
          }
        }
        return this;
      };
      AbstractMatrix3.mod = function mod(matrix2, value) {
        const newMatrix = new Matrix4(matrix2);
        return newMatrix.mod(value);
      };
      AbstractMatrix3.prototype.modulus = AbstractMatrix3.prototype.mod;
      AbstractMatrix3.prototype.modulusS = AbstractMatrix3.prototype.modS;
      AbstractMatrix3.prototype.modulusM = AbstractMatrix3.prototype.modM;
      AbstractMatrix3.modulus = AbstractMatrix3.mod;
      AbstractMatrix3.prototype.and = function and(value) {
        if (typeof value === "number") return this.andS(value);
        return this.andM(value);
      };
      AbstractMatrix3.prototype.andS = function andS(value) {
        for (let i = 0; i < this.rows; i++) {
          for (let j = 0; j < this.columns; j++) {
            this.set(i, j, this.get(i, j) & value);
          }
        }
        return this;
      };
      AbstractMatrix3.prototype.andM = function andM(matrix2) {
        matrix2 = Matrix4.checkMatrix(matrix2);
        if (this.rows !== matrix2.rows || this.columns !== matrix2.columns) {
          throw new RangeError("Matrices dimensions must be equal");
        }
        for (let i = 0; i < this.rows; i++) {
          for (let j = 0; j < this.columns; j++) {
            this.set(i, j, this.get(i, j) & matrix2.get(i, j));
          }
        }
        return this;
      };
      AbstractMatrix3.and = function and(matrix2, value) {
        const newMatrix = new Matrix4(matrix2);
        return newMatrix.and(value);
      };
      AbstractMatrix3.prototype.or = function or(value) {
        if (typeof value === "number") return this.orS(value);
        return this.orM(value);
      };
      AbstractMatrix3.prototype.orS = function orS(value) {
        for (let i = 0; i < this.rows; i++) {
          for (let j = 0; j < this.columns; j++) {
            this.set(i, j, this.get(i, j) | value);
          }
        }
        return this;
      };
      AbstractMatrix3.prototype.orM = function orM(matrix2) {
        matrix2 = Matrix4.checkMatrix(matrix2);
        if (this.rows !== matrix2.rows || this.columns !== matrix2.columns) {
          throw new RangeError("Matrices dimensions must be equal");
        }
        for (let i = 0; i < this.rows; i++) {
          for (let j = 0; j < this.columns; j++) {
            this.set(i, j, this.get(i, j) | matrix2.get(i, j));
          }
        }
        return this;
      };
      AbstractMatrix3.or = function or(matrix2, value) {
        const newMatrix = new Matrix4(matrix2);
        return newMatrix.or(value);
      };
      AbstractMatrix3.prototype.xor = function xor(value) {
        if (typeof value === "number") return this.xorS(value);
        return this.xorM(value);
      };
      AbstractMatrix3.prototype.xorS = function xorS(value) {
        for (let i = 0; i < this.rows; i++) {
          for (let j = 0; j < this.columns; j++) {
            this.set(i, j, this.get(i, j) ^ value);
          }
        }
        return this;
      };
      AbstractMatrix3.prototype.xorM = function xorM(matrix2) {
        matrix2 = Matrix4.checkMatrix(matrix2);
        if (this.rows !== matrix2.rows || this.columns !== matrix2.columns) {
          throw new RangeError("Matrices dimensions must be equal");
        }
        for (let i = 0; i < this.rows; i++) {
          for (let j = 0; j < this.columns; j++) {
            this.set(i, j, this.get(i, j) ^ matrix2.get(i, j));
          }
        }
        return this;
      };
      AbstractMatrix3.xor = function xor(matrix2, value) {
        const newMatrix = new Matrix4(matrix2);
        return newMatrix.xor(value);
      };
      AbstractMatrix3.prototype.leftShift = function leftShift(value) {
        if (typeof value === "number") return this.leftShiftS(value);
        return this.leftShiftM(value);
      };
      AbstractMatrix3.prototype.leftShiftS = function leftShiftS(value) {
        for (let i = 0; i < this.rows; i++) {
          for (let j = 0; j < this.columns; j++) {
            this.set(i, j, this.get(i, j) << value);
          }
        }
        return this;
      };
      AbstractMatrix3.prototype.leftShiftM = function leftShiftM(matrix2) {
        matrix2 = Matrix4.checkMatrix(matrix2);
        if (this.rows !== matrix2.rows || this.columns !== matrix2.columns) {
          throw new RangeError("Matrices dimensions must be equal");
        }
        for (let i = 0; i < this.rows; i++) {
          for (let j = 0; j < this.columns; j++) {
            this.set(i, j, this.get(i, j) << matrix2.get(i, j));
          }
        }
        return this;
      };
      AbstractMatrix3.leftShift = function leftShift(matrix2, value) {
        const newMatrix = new Matrix4(matrix2);
        return newMatrix.leftShift(value);
      };
      AbstractMatrix3.prototype.signPropagatingRightShift = function signPropagatingRightShift(value) {
        if (typeof value === "number") return this.signPropagatingRightShiftS(value);
        return this.signPropagatingRightShiftM(value);
      };
      AbstractMatrix3.prototype.signPropagatingRightShiftS = function signPropagatingRightShiftS(value) {
        for (let i = 0; i < this.rows; i++) {
          for (let j = 0; j < this.columns; j++) {
            this.set(i, j, this.get(i, j) >> value);
          }
        }
        return this;
      };
      AbstractMatrix3.prototype.signPropagatingRightShiftM = function signPropagatingRightShiftM(matrix2) {
        matrix2 = Matrix4.checkMatrix(matrix2);
        if (this.rows !== matrix2.rows || this.columns !== matrix2.columns) {
          throw new RangeError("Matrices dimensions must be equal");
        }
        for (let i = 0; i < this.rows; i++) {
          for (let j = 0; j < this.columns; j++) {
            this.set(i, j, this.get(i, j) >> matrix2.get(i, j));
          }
        }
        return this;
      };
      AbstractMatrix3.signPropagatingRightShift = function signPropagatingRightShift(matrix2, value) {
        const newMatrix = new Matrix4(matrix2);
        return newMatrix.signPropagatingRightShift(value);
      };
      AbstractMatrix3.prototype.rightShift = function rightShift(value) {
        if (typeof value === "number") return this.rightShiftS(value);
        return this.rightShiftM(value);
      };
      AbstractMatrix3.prototype.rightShiftS = function rightShiftS(value) {
        for (let i = 0; i < this.rows; i++) {
          for (let j = 0; j < this.columns; j++) {
            this.set(i, j, this.get(i, j) >>> value);
          }
        }
        return this;
      };
      AbstractMatrix3.prototype.rightShiftM = function rightShiftM(matrix2) {
        matrix2 = Matrix4.checkMatrix(matrix2);
        if (this.rows !== matrix2.rows || this.columns !== matrix2.columns) {
          throw new RangeError("Matrices dimensions must be equal");
        }
        for (let i = 0; i < this.rows; i++) {
          for (let j = 0; j < this.columns; j++) {
            this.set(i, j, this.get(i, j) >>> matrix2.get(i, j));
          }
        }
        return this;
      };
      AbstractMatrix3.rightShift = function rightShift(matrix2, value) {
        const newMatrix = new Matrix4(matrix2);
        return newMatrix.rightShift(value);
      };
      AbstractMatrix3.prototype.zeroFillRightShift = AbstractMatrix3.prototype.rightShift;
      AbstractMatrix3.prototype.zeroFillRightShiftS = AbstractMatrix3.prototype.rightShiftS;
      AbstractMatrix3.prototype.zeroFillRightShiftM = AbstractMatrix3.prototype.rightShiftM;
      AbstractMatrix3.zeroFillRightShift = AbstractMatrix3.rightShift;
      AbstractMatrix3.prototype.not = function not() {
        for (let i = 0; i < this.rows; i++) {
          for (let j = 0; j < this.columns; j++) {
            this.set(i, j, ~this.get(i, j));
          }
        }
        return this;
      };
      AbstractMatrix3.not = function not(matrix2) {
        const newMatrix = new Matrix4(matrix2);
        return newMatrix.not();
      };
      AbstractMatrix3.prototype.abs = function abs() {
        for (let i = 0; i < this.rows; i++) {
          for (let j = 0; j < this.columns; j++) {
            this.set(i, j, Math.abs(this.get(i, j)));
          }
        }
        return this;
      };
      AbstractMatrix3.abs = function abs(matrix2) {
        const newMatrix = new Matrix4(matrix2);
        return newMatrix.abs();
      };
      AbstractMatrix3.prototype.acos = function acos() {
        for (let i = 0; i < this.rows; i++) {
          for (let j = 0; j < this.columns; j++) {
            this.set(i, j, Math.acos(this.get(i, j)));
          }
        }
        return this;
      };
      AbstractMatrix3.acos = function acos(matrix2) {
        const newMatrix = new Matrix4(matrix2);
        return newMatrix.acos();
      };
      AbstractMatrix3.prototype.acosh = function acosh() {
        for (let i = 0; i < this.rows; i++) {
          for (let j = 0; j < this.columns; j++) {
            this.set(i, j, Math.acosh(this.get(i, j)));
          }
        }
        return this;
      };
      AbstractMatrix3.acosh = function acosh(matrix2) {
        const newMatrix = new Matrix4(matrix2);
        return newMatrix.acosh();
      };
      AbstractMatrix3.prototype.asin = function asin() {
        for (let i = 0; i < this.rows; i++) {
          for (let j = 0; j < this.columns; j++) {
            this.set(i, j, Math.asin(this.get(i, j)));
          }
        }
        return this;
      };
      AbstractMatrix3.asin = function asin(matrix2) {
        const newMatrix = new Matrix4(matrix2);
        return newMatrix.asin();
      };
      AbstractMatrix3.prototype.asinh = function asinh() {
        for (let i = 0; i < this.rows; i++) {
          for (let j = 0; j < this.columns; j++) {
            this.set(i, j, Math.asinh(this.get(i, j)));
          }
        }
        return this;
      };
      AbstractMatrix3.asinh = function asinh(matrix2) {
        const newMatrix = new Matrix4(matrix2);
        return newMatrix.asinh();
      };
      AbstractMatrix3.prototype.atan = function atan() {
        for (let i = 0; i < this.rows; i++) {
          for (let j = 0; j < this.columns; j++) {
            this.set(i, j, Math.atan(this.get(i, j)));
          }
        }
        return this;
      };
      AbstractMatrix3.atan = function atan(matrix2) {
        const newMatrix = new Matrix4(matrix2);
        return newMatrix.atan();
      };
      AbstractMatrix3.prototype.atanh = function atanh() {
        for (let i = 0; i < this.rows; i++) {
          for (let j = 0; j < this.columns; j++) {
            this.set(i, j, Math.atanh(this.get(i, j)));
          }
        }
        return this;
      };
      AbstractMatrix3.atanh = function atanh(matrix2) {
        const newMatrix = new Matrix4(matrix2);
        return newMatrix.atanh();
      };
      AbstractMatrix3.prototype.cbrt = function cbrt() {
        for (let i = 0; i < this.rows; i++) {
          for (let j = 0; j < this.columns; j++) {
            this.set(i, j, Math.cbrt(this.get(i, j)));
          }
        }
        return this;
      };
      AbstractMatrix3.cbrt = function cbrt(matrix2) {
        const newMatrix = new Matrix4(matrix2);
        return newMatrix.cbrt();
      };
      AbstractMatrix3.prototype.ceil = function ceil() {
        for (let i = 0; i < this.rows; i++) {
          for (let j = 0; j < this.columns; j++) {
            this.set(i, j, Math.ceil(this.get(i, j)));
          }
        }
        return this;
      };
      AbstractMatrix3.ceil = function ceil(matrix2) {
        const newMatrix = new Matrix4(matrix2);
        return newMatrix.ceil();
      };
      AbstractMatrix3.prototype.clz32 = function clz32() {
        for (let i = 0; i < this.rows; i++) {
          for (let j = 0; j < this.columns; j++) {
            this.set(i, j, Math.clz32(this.get(i, j)));
          }
        }
        return this;
      };
      AbstractMatrix3.clz32 = function clz32(matrix2) {
        const newMatrix = new Matrix4(matrix2);
        return newMatrix.clz32();
      };
      AbstractMatrix3.prototype.cos = function cos() {
        for (let i = 0; i < this.rows; i++) {
          for (let j = 0; j < this.columns; j++) {
            this.set(i, j, Math.cos(this.get(i, j)));
          }
        }
        return this;
      };
      AbstractMatrix3.cos = function cos(matrix2) {
        const newMatrix = new Matrix4(matrix2);
        return newMatrix.cos();
      };
      AbstractMatrix3.prototype.cosh = function cosh() {
        for (let i = 0; i < this.rows; i++) {
          for (let j = 0; j < this.columns; j++) {
            this.set(i, j, Math.cosh(this.get(i, j)));
          }
        }
        return this;
      };
      AbstractMatrix3.cosh = function cosh(matrix2) {
        const newMatrix = new Matrix4(matrix2);
        return newMatrix.cosh();
      };
      AbstractMatrix3.prototype.exp = function exp() {
        for (let i = 0; i < this.rows; i++) {
          for (let j = 0; j < this.columns; j++) {
            this.set(i, j, Math.exp(this.get(i, j)));
          }
        }
        return this;
      };
      AbstractMatrix3.exp = function exp(matrix2) {
        const newMatrix = new Matrix4(matrix2);
        return newMatrix.exp();
      };
      AbstractMatrix3.prototype.expm1 = function expm1() {
        for (let i = 0; i < this.rows; i++) {
          for (let j = 0; j < this.columns; j++) {
            this.set(i, j, Math.expm1(this.get(i, j)));
          }
        }
        return this;
      };
      AbstractMatrix3.expm1 = function expm1(matrix2) {
        const newMatrix = new Matrix4(matrix2);
        return newMatrix.expm1();
      };
      AbstractMatrix3.prototype.floor = function floor() {
        for (let i = 0; i < this.rows; i++) {
          for (let j = 0; j < this.columns; j++) {
            this.set(i, j, Math.floor(this.get(i, j)));
          }
        }
        return this;
      };
      AbstractMatrix3.floor = function floor(matrix2) {
        const newMatrix = new Matrix4(matrix2);
        return newMatrix.floor();
      };
      AbstractMatrix3.prototype.fround = function fround() {
        for (let i = 0; i < this.rows; i++) {
          for (let j = 0; j < this.columns; j++) {
            this.set(i, j, Math.fround(this.get(i, j)));
          }
        }
        return this;
      };
      AbstractMatrix3.fround = function fround(matrix2) {
        const newMatrix = new Matrix4(matrix2);
        return newMatrix.fround();
      };
      AbstractMatrix3.prototype.log = function log() {
        for (let i = 0; i < this.rows; i++) {
          for (let j = 0; j < this.columns; j++) {
            this.set(i, j, Math.log(this.get(i, j)));
          }
        }
        return this;
      };
      AbstractMatrix3.log = function log(matrix2) {
        const newMatrix = new Matrix4(matrix2);
        return newMatrix.log();
      };
      AbstractMatrix3.prototype.log1p = function log1p() {
        for (let i = 0; i < this.rows; i++) {
          for (let j = 0; j < this.columns; j++) {
            this.set(i, j, Math.log1p(this.get(i, j)));
          }
        }
        return this;
      };
      AbstractMatrix3.log1p = function log1p(matrix2) {
        const newMatrix = new Matrix4(matrix2);
        return newMatrix.log1p();
      };
      AbstractMatrix3.prototype.log10 = function log10() {
        for (let i = 0; i < this.rows; i++) {
          for (let j = 0; j < this.columns; j++) {
            this.set(i, j, Math.log10(this.get(i, j)));
          }
        }
        return this;
      };
      AbstractMatrix3.log10 = function log10(matrix2) {
        const newMatrix = new Matrix4(matrix2);
        return newMatrix.log10();
      };
      AbstractMatrix3.prototype.log2 = function log2() {
        for (let i = 0; i < this.rows; i++) {
          for (let j = 0; j < this.columns; j++) {
            this.set(i, j, Math.log2(this.get(i, j)));
          }
        }
        return this;
      };
      AbstractMatrix3.log2 = function log2(matrix2) {
        const newMatrix = new Matrix4(matrix2);
        return newMatrix.log2();
      };
      AbstractMatrix3.prototype.round = function round() {
        for (let i = 0; i < this.rows; i++) {
          for (let j = 0; j < this.columns; j++) {
            this.set(i, j, Math.round(this.get(i, j)));
          }
        }
        return this;
      };
      AbstractMatrix3.round = function round(matrix2) {
        const newMatrix = new Matrix4(matrix2);
        return newMatrix.round();
      };
      AbstractMatrix3.prototype.sign = function sign() {
        for (let i = 0; i < this.rows; i++) {
          for (let j = 0; j < this.columns; j++) {
            this.set(i, j, Math.sign(this.get(i, j)));
          }
        }
        return this;
      };
      AbstractMatrix3.sign = function sign(matrix2) {
        const newMatrix = new Matrix4(matrix2);
        return newMatrix.sign();
      };
      AbstractMatrix3.prototype.sin = function sin() {
        for (let i = 0; i < this.rows; i++) {
          for (let j = 0; j < this.columns; j++) {
            this.set(i, j, Math.sin(this.get(i, j)));
          }
        }
        return this;
      };
      AbstractMatrix3.sin = function sin(matrix2) {
        const newMatrix = new Matrix4(matrix2);
        return newMatrix.sin();
      };
      AbstractMatrix3.prototype.sinh = function sinh() {
        for (let i = 0; i < this.rows; i++) {
          for (let j = 0; j < this.columns; j++) {
            this.set(i, j, Math.sinh(this.get(i, j)));
          }
        }
        return this;
      };
      AbstractMatrix3.sinh = function sinh(matrix2) {
        const newMatrix = new Matrix4(matrix2);
        return newMatrix.sinh();
      };
      AbstractMatrix3.prototype.sqrt = function sqrt() {
        for (let i = 0; i < this.rows; i++) {
          for (let j = 0; j < this.columns; j++) {
            this.set(i, j, Math.sqrt(this.get(i, j)));
          }
        }
        return this;
      };
      AbstractMatrix3.sqrt = function sqrt(matrix2) {
        const newMatrix = new Matrix4(matrix2);
        return newMatrix.sqrt();
      };
      AbstractMatrix3.prototype.tan = function tan() {
        for (let i = 0; i < this.rows; i++) {
          for (let j = 0; j < this.columns; j++) {
            this.set(i, j, Math.tan(this.get(i, j)));
          }
        }
        return this;
      };
      AbstractMatrix3.tan = function tan(matrix2) {
        const newMatrix = new Matrix4(matrix2);
        return newMatrix.tan();
      };
      AbstractMatrix3.prototype.tanh = function tanh() {
        for (let i = 0; i < this.rows; i++) {
          for (let j = 0; j < this.columns; j++) {
            this.set(i, j, Math.tanh(this.get(i, j)));
          }
        }
        return this;
      };
      AbstractMatrix3.tanh = function tanh(matrix2) {
        const newMatrix = new Matrix4(matrix2);
        return newMatrix.tanh();
      };
      AbstractMatrix3.prototype.trunc = function trunc() {
        for (let i = 0; i < this.rows; i++) {
          for (let j = 0; j < this.columns; j++) {
            this.set(i, j, Math.trunc(this.get(i, j)));
          }
        }
        return this;
      };
      AbstractMatrix3.trunc = function trunc(matrix2) {
        const newMatrix = new Matrix4(matrix2);
        return newMatrix.trunc();
      };
      AbstractMatrix3.pow = function pow(matrix2, arg0) {
        const newMatrix = new Matrix4(matrix2);
        return newMatrix.pow(arg0);
      };
      AbstractMatrix3.prototype.pow = function pow(value) {
        if (typeof value === "number") return this.powS(value);
        return this.powM(value);
      };
      AbstractMatrix3.prototype.powS = function powS(value) {
        for (let i = 0; i < this.rows; i++) {
          for (let j = 0; j < this.columns; j++) {
            this.set(i, j, this.get(i, j) ** value);
          }
        }
        return this;
      };
      AbstractMatrix3.prototype.powM = function powM(matrix2) {
        matrix2 = Matrix4.checkMatrix(matrix2);
        if (this.rows !== matrix2.rows || this.columns !== matrix2.columns) {
          throw new RangeError("Matrices dimensions must be equal");
        }
        for (let i = 0; i < this.rows; i++) {
          for (let j = 0; j < this.columns; j++) {
            this.set(i, j, this.get(i, j) ** matrix2.get(i, j));
          }
        }
        return this;
      };
    }
    function checkRowIndex(matrix2, index, outer) {
      let max = outer ? matrix2.rows : matrix2.rows - 1;
      if (index < 0 || index > max) {
        throw new RangeError("Row index out of range");
      }
    }
    function checkColumnIndex(matrix2, index, outer) {
      let max = outer ? matrix2.columns : matrix2.columns - 1;
      if (index < 0 || index > max) {
        throw new RangeError("Column index out of range");
      }
    }
    function checkRowVector(matrix2, vector) {
      if (vector.to1DArray) {
        vector = vector.to1DArray();
      }
      if (vector.length !== matrix2.columns) {
        throw new RangeError(
          "vector size must be the same as the number of columns"
        );
      }
      return vector;
    }
    function checkColumnVector(matrix2, vector) {
      if (vector.to1DArray) {
        vector = vector.to1DArray();
      }
      if (vector.length !== matrix2.rows) {
        throw new RangeError("vector size must be the same as the number of rows");
      }
      return vector;
    }
    function checkRowIndices(matrix2, rowIndices) {
      if (!isAnyArray.isAnyArray(rowIndices)) {
        throw new TypeError("row indices must be an array");
      }
      for (let i = 0; i < rowIndices.length; i++) {
        if (rowIndices[i] < 0 || rowIndices[i] >= matrix2.rows) {
          throw new RangeError("row indices are out of range");
        }
      }
    }
    function checkColumnIndices(matrix2, columnIndices) {
      if (!isAnyArray.isAnyArray(columnIndices)) {
        throw new TypeError("column indices must be an array");
      }
      for (let i = 0; i < columnIndices.length; i++) {
        if (columnIndices[i] < 0 || columnIndices[i] >= matrix2.columns) {
          throw new RangeError("column indices are out of range");
        }
      }
    }
    function checkRange(matrix2, startRow, endRow, startColumn, endColumn) {
      if (arguments.length !== 5) {
        throw new RangeError("expected 4 arguments");
      }
      checkNumber("startRow", startRow);
      checkNumber("endRow", endRow);
      checkNumber("startColumn", startColumn);
      checkNumber("endColumn", endColumn);
      if (startRow > endRow || startColumn > endColumn || startRow < 0 || startRow >= matrix2.rows || endRow < 0 || endRow >= matrix2.rows || startColumn < 0 || startColumn >= matrix2.columns || endColumn < 0 || endColumn >= matrix2.columns) {
        throw new RangeError("Submatrix indices are out of range");
      }
    }
    function newArray(length, value = 0) {
      let array = [];
      for (let i = 0; i < length; i++) {
        array.push(value);
      }
      return array;
    }
    function checkNumber(name, value) {
      if (typeof value !== "number") {
        throw new TypeError(`${name} must be a number`);
      }
    }
    function checkNonEmpty(matrix2) {
      if (matrix2.isEmpty()) {
        throw new Error("Empty matrix has no elements to index");
      }
    }
    function sumByRow(matrix2) {
      let sum2 = newArray(matrix2.rows);
      for (let i = 0; i < matrix2.rows; ++i) {
        for (let j = 0; j < matrix2.columns; ++j) {
          sum2[i] += matrix2.get(i, j);
        }
      }
      return sum2;
    }
    function sumByColumn(matrix2) {
      let sum2 = newArray(matrix2.columns);
      for (let i = 0; i < matrix2.rows; ++i) {
        for (let j = 0; j < matrix2.columns; ++j) {
          sum2[j] += matrix2.get(i, j);
        }
      }
      return sum2;
    }
    function sumAll(matrix2) {
      let v = 0;
      for (let i = 0; i < matrix2.rows; i++) {
        for (let j = 0; j < matrix2.columns; j++) {
          v += matrix2.get(i, j);
        }
      }
      return v;
    }
    function productByRow(matrix2) {
      let sum2 = newArray(matrix2.rows, 1);
      for (let i = 0; i < matrix2.rows; ++i) {
        for (let j = 0; j < matrix2.columns; ++j) {
          sum2[i] *= matrix2.get(i, j);
        }
      }
      return sum2;
    }
    function productByColumn(matrix2) {
      let sum2 = newArray(matrix2.columns, 1);
      for (let i = 0; i < matrix2.rows; ++i) {
        for (let j = 0; j < matrix2.columns; ++j) {
          sum2[j] *= matrix2.get(i, j);
        }
      }
      return sum2;
    }
    function productAll(matrix2) {
      let v = 1;
      for (let i = 0; i < matrix2.rows; i++) {
        for (let j = 0; j < matrix2.columns; j++) {
          v *= matrix2.get(i, j);
        }
      }
      return v;
    }
    function varianceByRow(matrix2, unbiased, mean2) {
      const rows = matrix2.rows;
      const cols = matrix2.columns;
      const variance = [];
      for (let i = 0; i < rows; i++) {
        let sum1 = 0;
        let sum2 = 0;
        let x = 0;
        for (let j = 0; j < cols; j++) {
          x = matrix2.get(i, j) - mean2[i];
          sum1 += x;
          sum2 += x * x;
        }
        if (unbiased) {
          variance.push((sum2 - sum1 * sum1 / cols) / (cols - 1));
        } else {
          variance.push((sum2 - sum1 * sum1 / cols) / cols);
        }
      }
      return variance;
    }
    function varianceByColumn(matrix2, unbiased, mean2) {
      const rows = matrix2.rows;
      const cols = matrix2.columns;
      const variance = [];
      for (let j = 0; j < cols; j++) {
        let sum1 = 0;
        let sum2 = 0;
        let x = 0;
        for (let i = 0; i < rows; i++) {
          x = matrix2.get(i, j) - mean2[j];
          sum1 += x;
          sum2 += x * x;
        }
        if (unbiased) {
          variance.push((sum2 - sum1 * sum1 / rows) / (rows - 1));
        } else {
          variance.push((sum2 - sum1 * sum1 / rows) / rows);
        }
      }
      return variance;
    }
    function varianceAll(matrix2, unbiased, mean2) {
      const rows = matrix2.rows;
      const cols = matrix2.columns;
      const size = rows * cols;
      let sum1 = 0;
      let sum2 = 0;
      let x = 0;
      for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
          x = matrix2.get(i, j) - mean2;
          sum1 += x;
          sum2 += x * x;
        }
      }
      if (unbiased) {
        return (sum2 - sum1 * sum1 / size) / (size - 1);
      } else {
        return (sum2 - sum1 * sum1 / size) / size;
      }
    }
    function centerByRow(matrix2, mean2) {
      for (let i = 0; i < matrix2.rows; i++) {
        for (let j = 0; j < matrix2.columns; j++) {
          matrix2.set(i, j, matrix2.get(i, j) - mean2[i]);
        }
      }
    }
    function centerByColumn(matrix2, mean2) {
      for (let i = 0; i < matrix2.rows; i++) {
        for (let j = 0; j < matrix2.columns; j++) {
          matrix2.set(i, j, matrix2.get(i, j) - mean2[j]);
        }
      }
    }
    function centerAll(matrix2, mean2) {
      for (let i = 0; i < matrix2.rows; i++) {
        for (let j = 0; j < matrix2.columns; j++) {
          matrix2.set(i, j, matrix2.get(i, j) - mean2);
        }
      }
    }
    function getScaleByRow(matrix2) {
      const scale = [];
      for (let i = 0; i < matrix2.rows; i++) {
        let sum2 = 0;
        for (let j = 0; j < matrix2.columns; j++) {
          sum2 += matrix2.get(i, j) ** 2 / (matrix2.columns - 1);
        }
        scale.push(Math.sqrt(sum2));
      }
      return scale;
    }
    function scaleByRow(matrix2, scale) {
      for (let i = 0; i < matrix2.rows; i++) {
        for (let j = 0; j < matrix2.columns; j++) {
          matrix2.set(i, j, matrix2.get(i, j) / scale[i]);
        }
      }
    }
    function getScaleByColumn(matrix2) {
      const scale = [];
      for (let j = 0; j < matrix2.columns; j++) {
        let sum2 = 0;
        for (let i = 0; i < matrix2.rows; i++) {
          sum2 += matrix2.get(i, j) ** 2 / (matrix2.rows - 1);
        }
        scale.push(Math.sqrt(sum2));
      }
      return scale;
    }
    function scaleByColumn(matrix2, scale) {
      for (let i = 0; i < matrix2.rows; i++) {
        for (let j = 0; j < matrix2.columns; j++) {
          matrix2.set(i, j, matrix2.get(i, j) / scale[j]);
        }
      }
    }
    function getScaleAll(matrix2) {
      const divider = matrix2.size - 1;
      let sum2 = 0;
      for (let j = 0; j < matrix2.columns; j++) {
        for (let i = 0; i < matrix2.rows; i++) {
          sum2 += matrix2.get(i, j) ** 2 / divider;
        }
      }
      return Math.sqrt(sum2);
    }
    function scaleAll(matrix2, scale) {
      for (let i = 0; i < matrix2.rows; i++) {
        for (let j = 0; j < matrix2.columns; j++) {
          matrix2.set(i, j, matrix2.get(i, j) / scale);
        }
      }
    }
    var AbstractMatrix2 = class _AbstractMatrix {
      static from1DArray(newRows, newColumns, newData) {
        let length = newRows * newColumns;
        if (length !== newData.length) {
          throw new RangeError("data length does not match given dimensions");
        }
        let newMatrix = new Matrix3(newRows, newColumns);
        for (let row = 0; row < newRows; row++) {
          for (let column2 = 0; column2 < newColumns; column2++) {
            newMatrix.set(row, column2, newData[row * newColumns + column2]);
          }
        }
        return newMatrix;
      }
      static rowVector(newData) {
        let vector = new Matrix3(1, newData.length);
        for (let i = 0; i < newData.length; i++) {
          vector.set(0, i, newData[i]);
        }
        return vector;
      }
      static columnVector(newData) {
        let vector = new Matrix3(newData.length, 1);
        for (let i = 0; i < newData.length; i++) {
          vector.set(i, 0, newData[i]);
        }
        return vector;
      }
      static zeros(rows, columns) {
        return new Matrix3(rows, columns);
      }
      static ones(rows, columns) {
        return new Matrix3(rows, columns).fill(1);
      }
      static rand(rows, columns, options = {}) {
        if (typeof options !== "object") {
          throw new TypeError("options must be an object");
        }
        const { random = Math.random } = options;
        let matrix2 = new Matrix3(rows, columns);
        for (let i = 0; i < rows; i++) {
          for (let j = 0; j < columns; j++) {
            matrix2.set(i, j, random());
          }
        }
        return matrix2;
      }
      static randInt(rows, columns, options = {}) {
        if (typeof options !== "object") {
          throw new TypeError("options must be an object");
        }
        const { min = 0, max = 1e3, random = Math.random } = options;
        if (!Number.isInteger(min)) throw new TypeError("min must be an integer");
        if (!Number.isInteger(max)) throw new TypeError("max must be an integer");
        if (min >= max) throw new RangeError("min must be smaller than max");
        let interval = max - min;
        let matrix2 = new Matrix3(rows, columns);
        for (let i = 0; i < rows; i++) {
          for (let j = 0; j < columns; j++) {
            let value = min + Math.round(random() * interval);
            matrix2.set(i, j, value);
          }
        }
        return matrix2;
      }
      static eye(rows, columns, value) {
        if (columns === void 0) columns = rows;
        if (value === void 0) value = 1;
        let min = Math.min(rows, columns);
        let matrix2 = this.zeros(rows, columns);
        for (let i = 0; i < min; i++) {
          matrix2.set(i, i, value);
        }
        return matrix2;
      }
      static diag(data, rows, columns) {
        let l = data.length;
        if (rows === void 0) rows = l;
        if (columns === void 0) columns = rows;
        let min = Math.min(l, rows, columns);
        let matrix2 = this.zeros(rows, columns);
        for (let i = 0; i < min; i++) {
          matrix2.set(i, i, data[i]);
        }
        return matrix2;
      }
      static min(matrix1, matrix2) {
        matrix1 = this.checkMatrix(matrix1);
        matrix2 = this.checkMatrix(matrix2);
        let rows = matrix1.rows;
        let columns = matrix1.columns;
        let result = new Matrix3(rows, columns);
        for (let i = 0; i < rows; i++) {
          for (let j = 0; j < columns; j++) {
            result.set(i, j, Math.min(matrix1.get(i, j), matrix2.get(i, j)));
          }
        }
        return result;
      }
      static max(matrix1, matrix2) {
        matrix1 = this.checkMatrix(matrix1);
        matrix2 = this.checkMatrix(matrix2);
        let rows = matrix1.rows;
        let columns = matrix1.columns;
        let result = new this(rows, columns);
        for (let i = 0; i < rows; i++) {
          for (let j = 0; j < columns; j++) {
            result.set(i, j, Math.max(matrix1.get(i, j), matrix2.get(i, j)));
          }
        }
        return result;
      }
      static checkMatrix(value) {
        return _AbstractMatrix.isMatrix(value) ? value : new Matrix3(value);
      }
      static isMatrix(value) {
        return value != null && value.klass === "Matrix";
      }
      get size() {
        return this.rows * this.columns;
      }
      apply(callback) {
        if (typeof callback !== "function") {
          throw new TypeError("callback must be a function");
        }
        for (let i = 0; i < this.rows; i++) {
          for (let j = 0; j < this.columns; j++) {
            callback.call(this, i, j);
          }
        }
        return this;
      }
      to1DArray() {
        let array = [];
        for (let i = 0; i < this.rows; i++) {
          for (let j = 0; j < this.columns; j++) {
            array.push(this.get(i, j));
          }
        }
        return array;
      }
      to2DArray() {
        let copy = [];
        for (let i = 0; i < this.rows; i++) {
          copy.push([]);
          for (let j = 0; j < this.columns; j++) {
            copy[i].push(this.get(i, j));
          }
        }
        return copy;
      }
      toJSON() {
        return this.to2DArray();
      }
      isRowVector() {
        return this.rows === 1;
      }
      isColumnVector() {
        return this.columns === 1;
      }
      isVector() {
        return this.rows === 1 || this.columns === 1;
      }
      isSquare() {
        return this.rows === this.columns;
      }
      isEmpty() {
        return this.rows === 0 || this.columns === 0;
      }
      isSymmetric() {
        if (this.isSquare()) {
          for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j <= i; j++) {
              if (this.get(i, j) !== this.get(j, i)) {
                return false;
              }
            }
          }
          return true;
        }
        return false;
      }
      isDistance() {
        if (!this.isSymmetric()) return false;
        for (let i = 0; i < this.rows; i++) {
          if (this.get(i, i) !== 0) return false;
        }
        return true;
      }
      isEchelonForm() {
        let i = 0;
        let j = 0;
        let previousColumn = -1;
        let isEchelonForm = true;
        let checked = false;
        while (i < this.rows && isEchelonForm) {
          j = 0;
          checked = false;
          while (j < this.columns && checked === false) {
            if (this.get(i, j) === 0) {
              j++;
            } else if (this.get(i, j) === 1 && j > previousColumn) {
              checked = true;
              previousColumn = j;
            } else {
              isEchelonForm = false;
              checked = true;
            }
          }
          i++;
        }
        return isEchelonForm;
      }
      isReducedEchelonForm() {
        let i = 0;
        let j = 0;
        let previousColumn = -1;
        let isReducedEchelonForm = true;
        let checked = false;
        while (i < this.rows && isReducedEchelonForm) {
          j = 0;
          checked = false;
          while (j < this.columns && checked === false) {
            if (this.get(i, j) === 0) {
              j++;
            } else if (this.get(i, j) === 1 && j > previousColumn) {
              checked = true;
              previousColumn = j;
            } else {
              isReducedEchelonForm = false;
              checked = true;
            }
          }
          for (let k = j + 1; k < this.rows; k++) {
            if (this.get(i, k) !== 0) {
              isReducedEchelonForm = false;
            }
          }
          i++;
        }
        return isReducedEchelonForm;
      }
      echelonForm() {
        let result = this.clone();
        let h = 0;
        let k = 0;
        while (h < result.rows && k < result.columns) {
          let iMax = h;
          for (let i = h; i < result.rows; i++) {
            if (result.get(i, k) > result.get(iMax, k)) {
              iMax = i;
            }
          }
          if (result.get(iMax, k) === 0) {
            k++;
          } else {
            result.swapRows(h, iMax);
            let tmp = result.get(h, k);
            for (let j = k; j < result.columns; j++) {
              result.set(h, j, result.get(h, j) / tmp);
            }
            for (let i = h + 1; i < result.rows; i++) {
              let factor = result.get(i, k) / result.get(h, k);
              result.set(i, k, 0);
              for (let j = k + 1; j < result.columns; j++) {
                result.set(i, j, result.get(i, j) - result.get(h, j) * factor);
              }
            }
            h++;
            k++;
          }
        }
        return result;
      }
      reducedEchelonForm() {
        let result = this.echelonForm();
        let m = result.columns;
        let n = result.rows;
        let h = n - 1;
        while (h >= 0) {
          if (result.maxRow(h) === 0) {
            h--;
          } else {
            let p = 0;
            let pivot = false;
            while (p < n && pivot === false) {
              if (result.get(h, p) === 1) {
                pivot = true;
              } else {
                p++;
              }
            }
            for (let i = 0; i < h; i++) {
              let factor = result.get(i, p);
              for (let j = p; j < m; j++) {
                let tmp = result.get(i, j) - factor * result.get(h, j);
                result.set(i, j, tmp);
              }
            }
            h--;
          }
        }
        return result;
      }
      set() {
        throw new Error("set method is unimplemented");
      }
      get() {
        throw new Error("get method is unimplemented");
      }
      repeat(options = {}) {
        if (typeof options !== "object") {
          throw new TypeError("options must be an object");
        }
        const { rows = 1, columns = 1 } = options;
        if (!Number.isInteger(rows) || rows <= 0) {
          throw new TypeError("rows must be a positive integer");
        }
        if (!Number.isInteger(columns) || columns <= 0) {
          throw new TypeError("columns must be a positive integer");
        }
        let matrix2 = new Matrix3(this.rows * rows, this.columns * columns);
        for (let i = 0; i < rows; i++) {
          for (let j = 0; j < columns; j++) {
            matrix2.setSubMatrix(this, this.rows * i, this.columns * j);
          }
        }
        return matrix2;
      }
      fill(value) {
        for (let i = 0; i < this.rows; i++) {
          for (let j = 0; j < this.columns; j++) {
            this.set(i, j, value);
          }
        }
        return this;
      }
      neg() {
        return this.mulS(-1);
      }
      getRow(index) {
        checkRowIndex(this, index);
        let row = [];
        for (let i = 0; i < this.columns; i++) {
          row.push(this.get(index, i));
        }
        return row;
      }
      getRowVector(index) {
        return Matrix3.rowVector(this.getRow(index));
      }
      setRow(index, array) {
        checkRowIndex(this, index);
        array = checkRowVector(this, array);
        for (let i = 0; i < this.columns; i++) {
          this.set(index, i, array[i]);
        }
        return this;
      }
      swapRows(row1, row2) {
        checkRowIndex(this, row1);
        checkRowIndex(this, row2);
        for (let i = 0; i < this.columns; i++) {
          let temp = this.get(row1, i);
          this.set(row1, i, this.get(row2, i));
          this.set(row2, i, temp);
        }
        return this;
      }
      getColumn(index) {
        checkColumnIndex(this, index);
        let column2 = [];
        for (let i = 0; i < this.rows; i++) {
          column2.push(this.get(i, index));
        }
        return column2;
      }
      getColumnVector(index) {
        return Matrix3.columnVector(this.getColumn(index));
      }
      setColumn(index, array) {
        checkColumnIndex(this, index);
        array = checkColumnVector(this, array);
        for (let i = 0; i < this.rows; i++) {
          this.set(i, index, array[i]);
        }
        return this;
      }
      swapColumns(column1, column2) {
        checkColumnIndex(this, column1);
        checkColumnIndex(this, column2);
        for (let i = 0; i < this.rows; i++) {
          let temp = this.get(i, column1);
          this.set(i, column1, this.get(i, column2));
          this.set(i, column2, temp);
        }
        return this;
      }
      addRowVector(vector) {
        vector = checkRowVector(this, vector);
        for (let i = 0; i < this.rows; i++) {
          for (let j = 0; j < this.columns; j++) {
            this.set(i, j, this.get(i, j) + vector[j]);
          }
        }
        return this;
      }
      subRowVector(vector) {
        vector = checkRowVector(this, vector);
        for (let i = 0; i < this.rows; i++) {
          for (let j = 0; j < this.columns; j++) {
            this.set(i, j, this.get(i, j) - vector[j]);
          }
        }
        return this;
      }
      mulRowVector(vector) {
        vector = checkRowVector(this, vector);
        for (let i = 0; i < this.rows; i++) {
          for (let j = 0; j < this.columns; j++) {
            this.set(i, j, this.get(i, j) * vector[j]);
          }
        }
        return this;
      }
      divRowVector(vector) {
        vector = checkRowVector(this, vector);
        for (let i = 0; i < this.rows; i++) {
          for (let j = 0; j < this.columns; j++) {
            this.set(i, j, this.get(i, j) / vector[j]);
          }
        }
        return this;
      }
      addColumnVector(vector) {
        vector = checkColumnVector(this, vector);
        for (let i = 0; i < this.rows; i++) {
          for (let j = 0; j < this.columns; j++) {
            this.set(i, j, this.get(i, j) + vector[i]);
          }
        }
        return this;
      }
      subColumnVector(vector) {
        vector = checkColumnVector(this, vector);
        for (let i = 0; i < this.rows; i++) {
          for (let j = 0; j < this.columns; j++) {
            this.set(i, j, this.get(i, j) - vector[i]);
          }
        }
        return this;
      }
      mulColumnVector(vector) {
        vector = checkColumnVector(this, vector);
        for (let i = 0; i < this.rows; i++) {
          for (let j = 0; j < this.columns; j++) {
            this.set(i, j, this.get(i, j) * vector[i]);
          }
        }
        return this;
      }
      divColumnVector(vector) {
        vector = checkColumnVector(this, vector);
        for (let i = 0; i < this.rows; i++) {
          for (let j = 0; j < this.columns; j++) {
            this.set(i, j, this.get(i, j) / vector[i]);
          }
        }
        return this;
      }
      mulRow(index, value) {
        checkRowIndex(this, index);
        for (let i = 0; i < this.columns; i++) {
          this.set(index, i, this.get(index, i) * value);
        }
        return this;
      }
      mulColumn(index, value) {
        checkColumnIndex(this, index);
        for (let i = 0; i < this.rows; i++) {
          this.set(i, index, this.get(i, index) * value);
        }
        return this;
      }
      max(by) {
        if (this.isEmpty()) {
          return NaN;
        }
        switch (by) {
          case "row": {
            const max = new Array(this.rows).fill(Number.NEGATIVE_INFINITY);
            for (let row = 0; row < this.rows; row++) {
              for (let column2 = 0; column2 < this.columns; column2++) {
                if (this.get(row, column2) > max[row]) {
                  max[row] = this.get(row, column2);
                }
              }
            }
            return max;
          }
          case "column": {
            const max = new Array(this.columns).fill(Number.NEGATIVE_INFINITY);
            for (let row = 0; row < this.rows; row++) {
              for (let column2 = 0; column2 < this.columns; column2++) {
                if (this.get(row, column2) > max[column2]) {
                  max[column2] = this.get(row, column2);
                }
              }
            }
            return max;
          }
          case void 0: {
            let max = this.get(0, 0);
            for (let row = 0; row < this.rows; row++) {
              for (let column2 = 0; column2 < this.columns; column2++) {
                if (this.get(row, column2) > max) {
                  max = this.get(row, column2);
                }
              }
            }
            return max;
          }
          default:
            throw new Error(`invalid option: ${by}`);
        }
      }
      maxIndex() {
        checkNonEmpty(this);
        let v = this.get(0, 0);
        let idx = [0, 0];
        for (let i = 0; i < this.rows; i++) {
          for (let j = 0; j < this.columns; j++) {
            if (this.get(i, j) > v) {
              v = this.get(i, j);
              idx[0] = i;
              idx[1] = j;
            }
          }
        }
        return idx;
      }
      min(by) {
        if (this.isEmpty()) {
          return NaN;
        }
        switch (by) {
          case "row": {
            const min = new Array(this.rows).fill(Number.POSITIVE_INFINITY);
            for (let row = 0; row < this.rows; row++) {
              for (let column2 = 0; column2 < this.columns; column2++) {
                if (this.get(row, column2) < min[row]) {
                  min[row] = this.get(row, column2);
                }
              }
            }
            return min;
          }
          case "column": {
            const min = new Array(this.columns).fill(Number.POSITIVE_INFINITY);
            for (let row = 0; row < this.rows; row++) {
              for (let column2 = 0; column2 < this.columns; column2++) {
                if (this.get(row, column2) < min[column2]) {
                  min[column2] = this.get(row, column2);
                }
              }
            }
            return min;
          }
          case void 0: {
            let min = this.get(0, 0);
            for (let row = 0; row < this.rows; row++) {
              for (let column2 = 0; column2 < this.columns; column2++) {
                if (this.get(row, column2) < min) {
                  min = this.get(row, column2);
                }
              }
            }
            return min;
          }
          default:
            throw new Error(`invalid option: ${by}`);
        }
      }
      minIndex() {
        checkNonEmpty(this);
        let v = this.get(0, 0);
        let idx = [0, 0];
        for (let i = 0; i < this.rows; i++) {
          for (let j = 0; j < this.columns; j++) {
            if (this.get(i, j) < v) {
              v = this.get(i, j);
              idx[0] = i;
              idx[1] = j;
            }
          }
        }
        return idx;
      }
      maxRow(row) {
        checkRowIndex(this, row);
        if (this.isEmpty()) {
          return NaN;
        }
        let v = this.get(row, 0);
        for (let i = 1; i < this.columns; i++) {
          if (this.get(row, i) > v) {
            v = this.get(row, i);
          }
        }
        return v;
      }
      maxRowIndex(row) {
        checkRowIndex(this, row);
        checkNonEmpty(this);
        let v = this.get(row, 0);
        let idx = [row, 0];
        for (let i = 1; i < this.columns; i++) {
          if (this.get(row, i) > v) {
            v = this.get(row, i);
            idx[1] = i;
          }
        }
        return idx;
      }
      minRow(row) {
        checkRowIndex(this, row);
        if (this.isEmpty()) {
          return NaN;
        }
        let v = this.get(row, 0);
        for (let i = 1; i < this.columns; i++) {
          if (this.get(row, i) < v) {
            v = this.get(row, i);
          }
        }
        return v;
      }
      minRowIndex(row) {
        checkRowIndex(this, row);
        checkNonEmpty(this);
        let v = this.get(row, 0);
        let idx = [row, 0];
        for (let i = 1; i < this.columns; i++) {
          if (this.get(row, i) < v) {
            v = this.get(row, i);
            idx[1] = i;
          }
        }
        return idx;
      }
      maxColumn(column2) {
        checkColumnIndex(this, column2);
        if (this.isEmpty()) {
          return NaN;
        }
        let v = this.get(0, column2);
        for (let i = 1; i < this.rows; i++) {
          if (this.get(i, column2) > v) {
            v = this.get(i, column2);
          }
        }
        return v;
      }
      maxColumnIndex(column2) {
        checkColumnIndex(this, column2);
        checkNonEmpty(this);
        let v = this.get(0, column2);
        let idx = [0, column2];
        for (let i = 1; i < this.rows; i++) {
          if (this.get(i, column2) > v) {
            v = this.get(i, column2);
            idx[0] = i;
          }
        }
        return idx;
      }
      minColumn(column2) {
        checkColumnIndex(this, column2);
        if (this.isEmpty()) {
          return NaN;
        }
        let v = this.get(0, column2);
        for (let i = 1; i < this.rows; i++) {
          if (this.get(i, column2) < v) {
            v = this.get(i, column2);
          }
        }
        return v;
      }
      minColumnIndex(column2) {
        checkColumnIndex(this, column2);
        checkNonEmpty(this);
        let v = this.get(0, column2);
        let idx = [0, column2];
        for (let i = 1; i < this.rows; i++) {
          if (this.get(i, column2) < v) {
            v = this.get(i, column2);
            idx[0] = i;
          }
        }
        return idx;
      }
      diag() {
        let min = Math.min(this.rows, this.columns);
        let diag = [];
        for (let i = 0; i < min; i++) {
          diag.push(this.get(i, i));
        }
        return diag;
      }
      norm(type = "frobenius") {
        switch (type) {
          case "max":
            return this.max();
          case "frobenius":
            return Math.sqrt(this.dot(this));
          default:
            throw new RangeError(`unknown norm type: ${type}`);
        }
      }
      cumulativeSum() {
        let sum2 = 0;
        for (let i = 0; i < this.rows; i++) {
          for (let j = 0; j < this.columns; j++) {
            sum2 += this.get(i, j);
            this.set(i, j, sum2);
          }
        }
        return this;
      }
      dot(vector2) {
        if (_AbstractMatrix.isMatrix(vector2)) vector2 = vector2.to1DArray();
        let vector1 = this.to1DArray();
        if (vector1.length !== vector2.length) {
          throw new RangeError("vectors do not have the same size");
        }
        let dot2 = 0;
        for (let i = 0; i < vector1.length; i++) {
          dot2 += vector1[i] * vector2[i];
        }
        return dot2;
      }
      mmul(other) {
        other = Matrix3.checkMatrix(other);
        let m = this.rows;
        let n = this.columns;
        let p = other.columns;
        let result = new Matrix3(m, p);
        let Bcolj = new Float64Array(n);
        for (let j = 0; j < p; j++) {
          for (let k = 0; k < n; k++) {
            Bcolj[k] = other.get(k, j);
          }
          for (let i = 0; i < m; i++) {
            let s = 0;
            for (let k = 0; k < n; k++) {
              s += this.get(i, k) * Bcolj[k];
            }
            result.set(i, j, s);
          }
        }
        return result;
      }
      mpow(scalar) {
        if (!this.isSquare()) {
          throw new RangeError("Matrix must be square");
        }
        if (!Number.isInteger(scalar) || scalar < 0) {
          throw new RangeError("Exponent must be a non-negative integer");
        }
        let result = Matrix3.eye(this.rows);
        let bb = this;
        for (let e = scalar; e >= 1; e /= 2) {
          if ((e & 1) !== 0) {
            result = result.mmul(bb);
          }
          bb = bb.mmul(bb);
        }
        return result;
      }
      strassen2x2(other) {
        other = Matrix3.checkMatrix(other);
        let result = new Matrix3(2, 2);
        const a11 = this.get(0, 0);
        const b11 = other.get(0, 0);
        const a12 = this.get(0, 1);
        const b12 = other.get(0, 1);
        const a21 = this.get(1, 0);
        const b21 = other.get(1, 0);
        const a22 = this.get(1, 1);
        const b22 = other.get(1, 1);
        const m1 = (a11 + a22) * (b11 + b22);
        const m2 = (a21 + a22) * b11;
        const m3 = a11 * (b12 - b22);
        const m4 = a22 * (b21 - b11);
        const m5 = (a11 + a12) * b22;
        const m6 = (a21 - a11) * (b11 + b12);
        const m7 = (a12 - a22) * (b21 + b22);
        const c00 = m1 + m4 - m5 + m7;
        const c01 = m3 + m5;
        const c10 = m2 + m4;
        const c11 = m1 - m2 + m3 + m6;
        result.set(0, 0, c00);
        result.set(0, 1, c01);
        result.set(1, 0, c10);
        result.set(1, 1, c11);
        return result;
      }
      strassen3x3(other) {
        other = Matrix3.checkMatrix(other);
        let result = new Matrix3(3, 3);
        const a00 = this.get(0, 0);
        const a01 = this.get(0, 1);
        const a02 = this.get(0, 2);
        const a10 = this.get(1, 0);
        const a11 = this.get(1, 1);
        const a12 = this.get(1, 2);
        const a20 = this.get(2, 0);
        const a21 = this.get(2, 1);
        const a22 = this.get(2, 2);
        const b00 = other.get(0, 0);
        const b01 = other.get(0, 1);
        const b02 = other.get(0, 2);
        const b10 = other.get(1, 0);
        const b11 = other.get(1, 1);
        const b12 = other.get(1, 2);
        const b20 = other.get(2, 0);
        const b21 = other.get(2, 1);
        const b22 = other.get(2, 2);
        const m1 = (a00 + a01 + a02 - a10 - a11 - a21 - a22) * b11;
        const m2 = (a00 - a10) * (-b01 + b11);
        const m3 = a11 * (-b00 + b01 + b10 - b11 - b12 - b20 + b22);
        const m4 = (-a00 + a10 + a11) * (b00 - b01 + b11);
        const m5 = (a10 + a11) * (-b00 + b01);
        const m6 = a00 * b00;
        const m7 = (-a00 + a20 + a21) * (b00 - b02 + b12);
        const m8 = (-a00 + a20) * (b02 - b12);
        const m9 = (a20 + a21) * (-b00 + b02);
        const m10 = (a00 + a01 + a02 - a11 - a12 - a20 - a21) * b12;
        const m11 = a21 * (-b00 + b02 + b10 - b11 - b12 - b20 + b21);
        const m12 = (-a02 + a21 + a22) * (b11 + b20 - b21);
        const m13 = (a02 - a22) * (b11 - b21);
        const m14 = a02 * b20;
        const m15 = (a21 + a22) * (-b20 + b21);
        const m16 = (-a02 + a11 + a12) * (b12 + b20 - b22);
        const m17 = (a02 - a12) * (b12 - b22);
        const m18 = (a11 + a12) * (-b20 + b22);
        const m19 = a01 * b10;
        const m20 = a12 * b21;
        const m21 = a10 * b02;
        const m22 = a20 * b01;
        const m23 = a22 * b22;
        const c00 = m6 + m14 + m19;
        const c01 = m1 + m4 + m5 + m6 + m12 + m14 + m15;
        const c02 = m6 + m7 + m9 + m10 + m14 + m16 + m18;
        const c10 = m2 + m3 + m4 + m6 + m14 + m16 + m17;
        const c11 = m2 + m4 + m5 + m6 + m20;
        const c12 = m14 + m16 + m17 + m18 + m21;
        const c20 = m6 + m7 + m8 + m11 + m12 + m13 + m14;
        const c21 = m12 + m13 + m14 + m15 + m22;
        const c22 = m6 + m7 + m8 + m9 + m23;
        result.set(0, 0, c00);
        result.set(0, 1, c01);
        result.set(0, 2, c02);
        result.set(1, 0, c10);
        result.set(1, 1, c11);
        result.set(1, 2, c12);
        result.set(2, 0, c20);
        result.set(2, 1, c21);
        result.set(2, 2, c22);
        return result;
      }
      mmulStrassen(y) {
        y = Matrix3.checkMatrix(y);
        let x = this.clone();
        let r1 = x.rows;
        let c1 = x.columns;
        let r2 = y.rows;
        let c2 = y.columns;
        if (c1 !== r2) {
          console.warn(
            `Multiplying ${r1} x ${c1} and ${r2} x ${c2} matrix: dimensions do not match.`
          );
        }
        function embed(mat, rows, cols) {
          let r3 = mat.rows;
          let c3 = mat.columns;
          if (r3 === rows && c3 === cols) {
            return mat;
          } else {
            let resultat = _AbstractMatrix.zeros(rows, cols);
            resultat = resultat.setSubMatrix(mat, 0, 0);
            return resultat;
          }
        }
        let r = Math.max(r1, r2);
        let c = Math.max(c1, c2);
        x = embed(x, r, c);
        y = embed(y, r, c);
        function blockMult(a, b, rows, cols) {
          if (rows <= 512 || cols <= 512) {
            return a.mmul(b);
          }
          if (rows % 2 === 1 && cols % 2 === 1) {
            a = embed(a, rows + 1, cols + 1);
            b = embed(b, rows + 1, cols + 1);
          } else if (rows % 2 === 1) {
            a = embed(a, rows + 1, cols);
            b = embed(b, rows + 1, cols);
          } else if (cols % 2 === 1) {
            a = embed(a, rows, cols + 1);
            b = embed(b, rows, cols + 1);
          }
          let halfRows = parseInt(a.rows / 2, 10);
          let halfCols = parseInt(a.columns / 2, 10);
          let a11 = a.subMatrix(0, halfRows - 1, 0, halfCols - 1);
          let b11 = b.subMatrix(0, halfRows - 1, 0, halfCols - 1);
          let a12 = a.subMatrix(0, halfRows - 1, halfCols, a.columns - 1);
          let b12 = b.subMatrix(0, halfRows - 1, halfCols, b.columns - 1);
          let a21 = a.subMatrix(halfRows, a.rows - 1, 0, halfCols - 1);
          let b21 = b.subMatrix(halfRows, b.rows - 1, 0, halfCols - 1);
          let a22 = a.subMatrix(halfRows, a.rows - 1, halfCols, a.columns - 1);
          let b22 = b.subMatrix(halfRows, b.rows - 1, halfCols, b.columns - 1);
          let m1 = blockMult(
            _AbstractMatrix.add(a11, a22),
            _AbstractMatrix.add(b11, b22),
            halfRows,
            halfCols
          );
          let m2 = blockMult(_AbstractMatrix.add(a21, a22), b11, halfRows, halfCols);
          let m3 = blockMult(a11, _AbstractMatrix.sub(b12, b22), halfRows, halfCols);
          let m4 = blockMult(a22, _AbstractMatrix.sub(b21, b11), halfRows, halfCols);
          let m5 = blockMult(_AbstractMatrix.add(a11, a12), b22, halfRows, halfCols);
          let m6 = blockMult(
            _AbstractMatrix.sub(a21, a11),
            _AbstractMatrix.add(b11, b12),
            halfRows,
            halfCols
          );
          let m7 = blockMult(
            _AbstractMatrix.sub(a12, a22),
            _AbstractMatrix.add(b21, b22),
            halfRows,
            halfCols
          );
          let c11 = _AbstractMatrix.add(m1, m4);
          c11.sub(m5);
          c11.add(m7);
          let c12 = _AbstractMatrix.add(m3, m5);
          let c21 = _AbstractMatrix.add(m2, m4);
          let c22 = _AbstractMatrix.sub(m1, m2);
          c22.add(m3);
          c22.add(m6);
          let result = _AbstractMatrix.zeros(2 * c11.rows, 2 * c11.columns);
          result = result.setSubMatrix(c11, 0, 0);
          result = result.setSubMatrix(c12, c11.rows, 0);
          result = result.setSubMatrix(c21, 0, c11.columns);
          result = result.setSubMatrix(c22, c11.rows, c11.columns);
          return result.subMatrix(0, rows - 1, 0, cols - 1);
        }
        return blockMult(x, y, r, c);
      }
      scaleRows(options = {}) {
        if (typeof options !== "object") {
          throw new TypeError("options must be an object");
        }
        const { min = 0, max = 1 } = options;
        if (!Number.isFinite(min)) throw new TypeError("min must be a number");
        if (!Number.isFinite(max)) throw new TypeError("max must be a number");
        if (min >= max) throw new RangeError("min must be smaller than max");
        let newMatrix = new Matrix3(this.rows, this.columns);
        for (let i = 0; i < this.rows; i++) {
          const row = this.getRow(i);
          if (row.length > 0) {
            rescale(row, { min, max, output: row });
          }
          newMatrix.setRow(i, row);
        }
        return newMatrix;
      }
      scaleColumns(options = {}) {
        if (typeof options !== "object") {
          throw new TypeError("options must be an object");
        }
        const { min = 0, max = 1 } = options;
        if (!Number.isFinite(min)) throw new TypeError("min must be a number");
        if (!Number.isFinite(max)) throw new TypeError("max must be a number");
        if (min >= max) throw new RangeError("min must be smaller than max");
        let newMatrix = new Matrix3(this.rows, this.columns);
        for (let i = 0; i < this.columns; i++) {
          const column2 = this.getColumn(i);
          if (column2.length) {
            rescale(column2, {
              min,
              max,
              output: column2
            });
          }
          newMatrix.setColumn(i, column2);
        }
        return newMatrix;
      }
      flipRows() {
        const middle = Math.ceil(this.columns / 2);
        for (let i = 0; i < this.rows; i++) {
          for (let j = 0; j < middle; j++) {
            let first = this.get(i, j);
            let last = this.get(i, this.columns - 1 - j);
            this.set(i, j, last);
            this.set(i, this.columns - 1 - j, first);
          }
        }
        return this;
      }
      flipColumns() {
        const middle = Math.ceil(this.rows / 2);
        for (let j = 0; j < this.columns; j++) {
          for (let i = 0; i < middle; i++) {
            let first = this.get(i, j);
            let last = this.get(this.rows - 1 - i, j);
            this.set(i, j, last);
            this.set(this.rows - 1 - i, j, first);
          }
        }
        return this;
      }
      kroneckerProduct(other) {
        other = Matrix3.checkMatrix(other);
        let m = this.rows;
        let n = this.columns;
        let p = other.rows;
        let q = other.columns;
        let result = new Matrix3(m * p, n * q);
        for (let i = 0; i < m; i++) {
          for (let j = 0; j < n; j++) {
            for (let k = 0; k < p; k++) {
              for (let l = 0; l < q; l++) {
                result.set(p * i + k, q * j + l, this.get(i, j) * other.get(k, l));
              }
            }
          }
        }
        return result;
      }
      kroneckerSum(other) {
        other = Matrix3.checkMatrix(other);
        if (!this.isSquare() || !other.isSquare()) {
          throw new Error("Kronecker Sum needs two Square Matrices");
        }
        let m = this.rows;
        let n = other.rows;
        let AxI = this.kroneckerProduct(Matrix3.eye(n, n));
        let IxB = Matrix3.eye(m, m).kroneckerProduct(other);
        return AxI.add(IxB);
      }
      transpose() {
        let result = new Matrix3(this.columns, this.rows);
        for (let i = 0; i < this.rows; i++) {
          for (let j = 0; j < this.columns; j++) {
            result.set(j, i, this.get(i, j));
          }
        }
        return result;
      }
      sortRows(compareFunction = compareNumbers) {
        for (let i = 0; i < this.rows; i++) {
          this.setRow(i, this.getRow(i).sort(compareFunction));
        }
        return this;
      }
      sortColumns(compareFunction = compareNumbers) {
        for (let i = 0; i < this.columns; i++) {
          this.setColumn(i, this.getColumn(i).sort(compareFunction));
        }
        return this;
      }
      subMatrix(startRow, endRow, startColumn, endColumn) {
        checkRange(this, startRow, endRow, startColumn, endColumn);
        let newMatrix = new Matrix3(
          endRow - startRow + 1,
          endColumn - startColumn + 1
        );
        for (let i = startRow; i <= endRow; i++) {
          for (let j = startColumn; j <= endColumn; j++) {
            newMatrix.set(i - startRow, j - startColumn, this.get(i, j));
          }
        }
        return newMatrix;
      }
      subMatrixRow(indices, startColumn, endColumn) {
        if (startColumn === void 0) startColumn = 0;
        if (endColumn === void 0) endColumn = this.columns - 1;
        if (startColumn > endColumn || startColumn < 0 || startColumn >= this.columns || endColumn < 0 || endColumn >= this.columns) {
          throw new RangeError("Argument out of range");
        }
        let newMatrix = new Matrix3(indices.length, endColumn - startColumn + 1);
        for (let i = 0; i < indices.length; i++) {
          for (let j = startColumn; j <= endColumn; j++) {
            if (indices[i] < 0 || indices[i] >= this.rows) {
              throw new RangeError(`Row index out of range: ${indices[i]}`);
            }
            newMatrix.set(i, j - startColumn, this.get(indices[i], j));
          }
        }
        return newMatrix;
      }
      subMatrixColumn(indices, startRow, endRow) {
        if (startRow === void 0) startRow = 0;
        if (endRow === void 0) endRow = this.rows - 1;
        if (startRow > endRow || startRow < 0 || startRow >= this.rows || endRow < 0 || endRow >= this.rows) {
          throw new RangeError("Argument out of range");
        }
        let newMatrix = new Matrix3(endRow - startRow + 1, indices.length);
        for (let i = 0; i < indices.length; i++) {
          for (let j = startRow; j <= endRow; j++) {
            if (indices[i] < 0 || indices[i] >= this.columns) {
              throw new RangeError(`Column index out of range: ${indices[i]}`);
            }
            newMatrix.set(j - startRow, i, this.get(j, indices[i]));
          }
        }
        return newMatrix;
      }
      setSubMatrix(matrix2, startRow, startColumn) {
        matrix2 = Matrix3.checkMatrix(matrix2);
        if (matrix2.isEmpty()) {
          return this;
        }
        let endRow = startRow + matrix2.rows - 1;
        let endColumn = startColumn + matrix2.columns - 1;
        checkRange(this, startRow, endRow, startColumn, endColumn);
        for (let i = 0; i < matrix2.rows; i++) {
          for (let j = 0; j < matrix2.columns; j++) {
            this.set(startRow + i, startColumn + j, matrix2.get(i, j));
          }
        }
        return this;
      }
      selection(rowIndices, columnIndices) {
        checkRowIndices(this, rowIndices);
        checkColumnIndices(this, columnIndices);
        let newMatrix = new Matrix3(rowIndices.length, columnIndices.length);
        for (let i = 0; i < rowIndices.length; i++) {
          let rowIndex = rowIndices[i];
          for (let j = 0; j < columnIndices.length; j++) {
            let columnIndex = columnIndices[j];
            newMatrix.set(i, j, this.get(rowIndex, columnIndex));
          }
        }
        return newMatrix;
      }
      trace() {
        let min = Math.min(this.rows, this.columns);
        let trace = 0;
        for (let i = 0; i < min; i++) {
          trace += this.get(i, i);
        }
        return trace;
      }
      clone() {
        return this.constructor.copy(this, new Matrix3(this.rows, this.columns));
      }
      /**
       * @template {AbstractMatrix} M
       * @param {AbstractMatrix} from
       * @param {M} to
       * @return {M}
       */
      static copy(from, to) {
        for (const [row, column2, value] of from.entries()) {
          to.set(row, column2, value);
        }
        return to;
      }
      sum(by) {
        switch (by) {
          case "row":
            return sumByRow(this);
          case "column":
            return sumByColumn(this);
          case void 0:
            return sumAll(this);
          default:
            throw new Error(`invalid option: ${by}`);
        }
      }
      product(by) {
        switch (by) {
          case "row":
            return productByRow(this);
          case "column":
            return productByColumn(this);
          case void 0:
            return productAll(this);
          default:
            throw new Error(`invalid option: ${by}`);
        }
      }
      mean(by) {
        const sum2 = this.sum(by);
        switch (by) {
          case "row": {
            for (let i = 0; i < this.rows; i++) {
              sum2[i] /= this.columns;
            }
            return sum2;
          }
          case "column": {
            for (let i = 0; i < this.columns; i++) {
              sum2[i] /= this.rows;
            }
            return sum2;
          }
          case void 0:
            return sum2 / this.size;
          default:
            throw new Error(`invalid option: ${by}`);
        }
      }
      variance(by, options = {}) {
        if (typeof by === "object") {
          options = by;
          by = void 0;
        }
        if (typeof options !== "object") {
          throw new TypeError("options must be an object");
        }
        const { unbiased = true, mean: mean2 = this.mean(by) } = options;
        if (typeof unbiased !== "boolean") {
          throw new TypeError("unbiased must be a boolean");
        }
        switch (by) {
          case "row": {
            if (!isAnyArray.isAnyArray(mean2)) {
              throw new TypeError("mean must be an array");
            }
            return varianceByRow(this, unbiased, mean2);
          }
          case "column": {
            if (!isAnyArray.isAnyArray(mean2)) {
              throw new TypeError("mean must be an array");
            }
            return varianceByColumn(this, unbiased, mean2);
          }
          case void 0: {
            if (typeof mean2 !== "number") {
              throw new TypeError("mean must be a number");
            }
            return varianceAll(this, unbiased, mean2);
          }
          default:
            throw new Error(`invalid option: ${by}`);
        }
      }
      standardDeviation(by, options) {
        if (typeof by === "object") {
          options = by;
          by = void 0;
        }
        const variance = this.variance(by, options);
        if (by === void 0) {
          return Math.sqrt(variance);
        } else {
          for (let i = 0; i < variance.length; i++) {
            variance[i] = Math.sqrt(variance[i]);
          }
          return variance;
        }
      }
      center(by, options = {}) {
        if (typeof by === "object") {
          options = by;
          by = void 0;
        }
        if (typeof options !== "object") {
          throw new TypeError("options must be an object");
        }
        const { center = this.mean(by) } = options;
        switch (by) {
          case "row": {
            if (!isAnyArray.isAnyArray(center)) {
              throw new TypeError("center must be an array");
            }
            centerByRow(this, center);
            return this;
          }
          case "column": {
            if (!isAnyArray.isAnyArray(center)) {
              throw new TypeError("center must be an array");
            }
            centerByColumn(this, center);
            return this;
          }
          case void 0: {
            if (typeof center !== "number") {
              throw new TypeError("center must be a number");
            }
            centerAll(this, center);
            return this;
          }
          default:
            throw new Error(`invalid option: ${by}`);
        }
      }
      scale(by, options = {}) {
        if (typeof by === "object") {
          options = by;
          by = void 0;
        }
        if (typeof options !== "object") {
          throw new TypeError("options must be an object");
        }
        let scale = options.scale;
        switch (by) {
          case "row": {
            if (scale === void 0) {
              scale = getScaleByRow(this);
            } else if (!isAnyArray.isAnyArray(scale)) {
              throw new TypeError("scale must be an array");
            }
            scaleByRow(this, scale);
            return this;
          }
          case "column": {
            if (scale === void 0) {
              scale = getScaleByColumn(this);
            } else if (!isAnyArray.isAnyArray(scale)) {
              throw new TypeError("scale must be an array");
            }
            scaleByColumn(this, scale);
            return this;
          }
          case void 0: {
            if (scale === void 0) {
              scale = getScaleAll(this);
            } else if (typeof scale !== "number") {
              throw new TypeError("scale must be a number");
            }
            scaleAll(this, scale);
            return this;
          }
          default:
            throw new Error(`invalid option: ${by}`);
        }
      }
      toString(options) {
        return inspectMatrixWithOptions(this, options);
      }
      [Symbol.iterator]() {
        return this.entries();
      }
      /**
       * iterator from left to right, from top to bottom
       * yield [row, column, value]
       * @returns {Generator<[number, number, number], void, void>}
       */
      *entries() {
        for (let row = 0; row < this.rows; row++) {
          for (let col = 0; col < this.columns; col++) {
            yield [row, col, this.get(row, col)];
          }
        }
      }
      /**
       * iterator from left to right, from top to bottom
       * yield value
       * @returns {Generator<number, void, void>}
       */
      *values() {
        for (let row = 0; row < this.rows; row++) {
          for (let col = 0; col < this.columns; col++) {
            yield this.get(row, col);
          }
        }
      }
    };
    AbstractMatrix2.prototype.klass = "Matrix";
    if (typeof Symbol !== "undefined") {
      AbstractMatrix2.prototype[Symbol.for("nodejs.util.inspect.custom")] = inspectMatrix;
    }
    function compareNumbers(a, b) {
      return a - b;
    }
    function isArrayOfNumbers(array) {
      return array.every((element) => {
        return typeof element === "number";
      });
    }
    AbstractMatrix2.random = AbstractMatrix2.rand;
    AbstractMatrix2.randomInt = AbstractMatrix2.randInt;
    AbstractMatrix2.diagonal = AbstractMatrix2.diag;
    AbstractMatrix2.prototype.diagonal = AbstractMatrix2.prototype.diag;
    AbstractMatrix2.identity = AbstractMatrix2.eye;
    AbstractMatrix2.prototype.negate = AbstractMatrix2.prototype.neg;
    AbstractMatrix2.prototype.tensorProduct = AbstractMatrix2.prototype.kroneckerProduct;
    var Matrix3 = class _Matrix extends AbstractMatrix2 {
      /**
       * @type {Float64Array[]}
       */
      data;
      /**
       * Init an empty matrix
       * @param {number} nRows
       * @param {number} nColumns
       */
      #initData(nRows, nColumns) {
        this.data = [];
        if (Number.isInteger(nColumns) && nColumns >= 0) {
          for (let i = 0; i < nRows; i++) {
            this.data.push(new Float64Array(nColumns));
          }
        } else {
          throw new TypeError("nColumns must be a positive integer");
        }
        this.rows = nRows;
        this.columns = nColumns;
      }
      constructor(nRows, nColumns) {
        super();
        if (_Matrix.isMatrix(nRows)) {
          this.#initData(nRows.rows, nRows.columns);
          _Matrix.copy(nRows, this);
        } else if (Number.isInteger(nRows) && nRows >= 0) {
          this.#initData(nRows, nColumns);
        } else if (isAnyArray.isAnyArray(nRows)) {
          const arrayData = nRows;
          nRows = arrayData.length;
          nColumns = nRows ? arrayData[0].length : 0;
          if (typeof nColumns !== "number") {
            throw new TypeError(
              "Data must be a 2D array with at least one element"
            );
          }
          this.data = [];
          for (let i = 0; i < nRows; i++) {
            if (arrayData[i].length !== nColumns) {
              throw new RangeError("Inconsistent array dimensions");
            }
            if (!isArrayOfNumbers(arrayData[i])) {
              throw new TypeError("Input data contains non-numeric values");
            }
            this.data.push(Float64Array.from(arrayData[i]));
          }
          this.rows = nRows;
          this.columns = nColumns;
        } else {
          throw new TypeError(
            "First argument must be a positive number or an array"
          );
        }
      }
      set(rowIndex, columnIndex, value) {
        this.data[rowIndex][columnIndex] = value;
        return this;
      }
      get(rowIndex, columnIndex) {
        return this.data[rowIndex][columnIndex];
      }
      removeRow(index) {
        checkRowIndex(this, index);
        this.data.splice(index, 1);
        this.rows -= 1;
        return this;
      }
      addRow(index, array) {
        if (array === void 0) {
          array = index;
          index = this.rows;
        }
        checkRowIndex(this, index, true);
        array = Float64Array.from(checkRowVector(this, array));
        this.data.splice(index, 0, array);
        this.rows += 1;
        return this;
      }
      removeColumn(index) {
        checkColumnIndex(this, index);
        for (let i = 0; i < this.rows; i++) {
          const newRow = new Float64Array(this.columns - 1);
          for (let j = 0; j < index; j++) {
            newRow[j] = this.data[i][j];
          }
          for (let j = index + 1; j < this.columns; j++) {
            newRow[j - 1] = this.data[i][j];
          }
          this.data[i] = newRow;
        }
        this.columns -= 1;
        return this;
      }
      addColumn(index, array) {
        if (typeof array === "undefined") {
          array = index;
          index = this.columns;
        }
        checkColumnIndex(this, index, true);
        array = checkColumnVector(this, array);
        for (let i = 0; i < this.rows; i++) {
          const newRow = new Float64Array(this.columns + 1);
          let j = 0;
          for (; j < index; j++) {
            newRow[j] = this.data[i][j];
          }
          newRow[j++] = array[i];
          for (; j < this.columns + 1; j++) {
            newRow[j] = this.data[i][j - 1];
          }
          this.data[i] = newRow;
        }
        this.columns += 1;
        return this;
      }
    };
    installMathOperations(AbstractMatrix2, Matrix3);
    var SymmetricMatrix2 = class _SymmetricMatrix extends AbstractMatrix2 {
      /** @type {Matrix} */
      #matrix;
      get size() {
        return this.#matrix.size;
      }
      get rows() {
        return this.#matrix.rows;
      }
      get columns() {
        return this.#matrix.columns;
      }
      get diagonalSize() {
        return this.rows;
      }
      /**
       * not the same as matrix.isSymmetric()
       * Here is to check if it's instanceof SymmetricMatrix without bundling issues
       *
       * @param value
       * @returns {boolean}
       */
      static isSymmetricMatrix(value) {
        return Matrix3.isMatrix(value) && value.klassType === "SymmetricMatrix";
      }
      /**
       * @param diagonalSize
       * @return {SymmetricMatrix}
       */
      static zeros(diagonalSize) {
        return new this(diagonalSize);
      }
      /**
       * @param diagonalSize
       * @return {SymmetricMatrix}
       */
      static ones(diagonalSize) {
        return new this(diagonalSize).fill(1);
      }
      /**
       * @param {number | AbstractMatrix | ArrayLike<ArrayLike<number>>} diagonalSize
       * @return {this}
       */
      constructor(diagonalSize) {
        super();
        if (Matrix3.isMatrix(diagonalSize)) {
          if (!diagonalSize.isSymmetric()) {
            throw new TypeError("not symmetric data");
          }
          this.#matrix = Matrix3.copy(
            diagonalSize,
            new Matrix3(diagonalSize.rows, diagonalSize.rows)
          );
        } else if (Number.isInteger(diagonalSize) && diagonalSize >= 0) {
          this.#matrix = new Matrix3(diagonalSize, diagonalSize);
        } else {
          this.#matrix = new Matrix3(diagonalSize);
          if (!this.isSymmetric()) {
            throw new TypeError("not symmetric data");
          }
        }
      }
      clone() {
        const matrix2 = new _SymmetricMatrix(this.diagonalSize);
        for (const [row, col, value] of this.upperRightEntries()) {
          matrix2.set(row, col, value);
        }
        return matrix2;
      }
      toMatrix() {
        return new Matrix3(this);
      }
      get(rowIndex, columnIndex) {
        return this.#matrix.get(rowIndex, columnIndex);
      }
      set(rowIndex, columnIndex, value) {
        this.#matrix.set(rowIndex, columnIndex, value);
        this.#matrix.set(columnIndex, rowIndex, value);
        return this;
      }
      removeCross(index) {
        this.#matrix.removeRow(index);
        this.#matrix.removeColumn(index);
        return this;
      }
      addCross(index, array) {
        if (array === void 0) {
          array = index;
          index = this.diagonalSize;
        }
        const row = array.slice();
        row.splice(index, 1);
        this.#matrix.addRow(index, row);
        this.#matrix.addColumn(index, array);
        return this;
      }
      /**
       * @param {Mask[]} mask
       */
      applyMask(mask) {
        if (mask.length !== this.diagonalSize) {
          throw new RangeError("Mask size do not match with matrix size");
        }
        const sidesToRemove = [];
        for (const [index, passthroughs] of mask.entries()) {
          if (passthroughs) continue;
          sidesToRemove.push(index);
        }
        sidesToRemove.reverse();
        for (const sideIndex of sidesToRemove) {
          this.removeCross(sideIndex);
        }
        return this;
      }
      /**
       * Compact format upper-right corner of matrix
       * iterate from left to right, from top to bottom.
       *
       * ```
       *   A B C D
       * A 1 2 3 4
       * B 2 5 6 7
       * C 3 6 8 9
       * D 4 7 9 10
       * ```
       *
       * will return compact 1D array `[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]`
       *
       * length is S(i=0, n=sideSize) => 10 for a 4 sideSized matrix
       *
       * @returns {number[]}
       */
      toCompact() {
        const { diagonalSize } = this;
        const compact = new Array(diagonalSize * (diagonalSize + 1) / 2);
        for (let col = 0, row = 0, index = 0; index < compact.length; index++) {
          compact[index] = this.get(row, col);
          if (++col >= diagonalSize) col = ++row;
        }
        return compact;
      }
      /**
       * @param {number[]} compact
       * @return {SymmetricMatrix}
       */
      static fromCompact(compact) {
        const compactSize = compact.length;
        const diagonalSize = (Math.sqrt(8 * compactSize + 1) - 1) / 2;
        if (!Number.isInteger(diagonalSize)) {
          throw new TypeError(
            `This array is not a compact representation of a Symmetric Matrix, ${JSON.stringify(
              compact
            )}`
          );
        }
        const matrix2 = new _SymmetricMatrix(diagonalSize);
        for (let col = 0, row = 0, index = 0; index < compactSize; index++) {
          matrix2.set(col, row, compact[index]);
          if (++col >= diagonalSize) col = ++row;
        }
        return matrix2;
      }
      /**
       * half iterator upper-right-corner from left to right, from top to bottom
       * yield [row, column, value]
       *
       * @returns {Generator<[number, number, number], void, void>}
       */
      *upperRightEntries() {
        for (let row = 0, col = 0; row < this.diagonalSize; void 0) {
          const value = this.get(row, col);
          yield [row, col, value];
          if (++col >= this.diagonalSize) col = ++row;
        }
      }
      /**
       * half iterator upper-right-corner from left to right, from top to bottom
       * yield value
       *
       * @returns {Generator<[number, number, number], void, void>}
       */
      *upperRightValues() {
        for (let row = 0, col = 0; row < this.diagonalSize; void 0) {
          const value = this.get(row, col);
          yield value;
          if (++col >= this.diagonalSize) col = ++row;
        }
      }
    };
    SymmetricMatrix2.prototype.klassType = "SymmetricMatrix";
    var DistanceMatrix2 = class _DistanceMatrix extends SymmetricMatrix2 {
      /**
       * not the same as matrix.isSymmetric()
       * Here is to check if it's instanceof SymmetricMatrix without bundling issues
       *
       * @param value
       * @returns {boolean}
       */
      static isDistanceMatrix(value) {
        return SymmetricMatrix2.isSymmetricMatrix(value) && value.klassSubType === "DistanceMatrix";
      }
      constructor(sideSize) {
        super(sideSize);
        if (!this.isDistance()) {
          throw new TypeError("Provided arguments do no produce a distance matrix");
        }
      }
      set(rowIndex, columnIndex, value) {
        if (rowIndex === columnIndex) value = 0;
        return super.set(rowIndex, columnIndex, value);
      }
      addCross(index, array) {
        if (array === void 0) {
          array = index;
          index = this.diagonalSize;
        }
        array = array.slice();
        array[index] = 0;
        return super.addCross(index, array);
      }
      toSymmetricMatrix() {
        return new SymmetricMatrix2(this);
      }
      clone() {
        const matrix2 = new _DistanceMatrix(this.diagonalSize);
        for (const [row, col, value] of this.upperRightEntries()) {
          if (row === col) continue;
          matrix2.set(row, col, value);
        }
        return matrix2;
      }
      /**
       * Compact format upper-right corner of matrix
       * no diagonal (only zeros)
       * iterable from left to right, from top to bottom.
       *
       * ```
       *   A B C D
       * A 0 1 2 3
       * B 1 0 4 5
       * C 2 4 0 6
       * D 3 5 6 0
       * ```
       *
       * will return compact 1D array `[1, 2, 3, 4, 5, 6]`
       *
       * length is S(i=0, n=sideSize-1) => 6 for a 4 side sized matrix
       *
       * @returns {number[]}
       */
      toCompact() {
        const { diagonalSize } = this;
        const compactLength = (diagonalSize - 1) * diagonalSize / 2;
        const compact = new Array(compactLength);
        for (let col = 1, row = 0, index = 0; index < compact.length; index++) {
          compact[index] = this.get(row, col);
          if (++col >= diagonalSize) col = ++row + 1;
        }
        return compact;
      }
      /**
       * @param {number[]} compact
       */
      static fromCompact(compact) {
        const compactSize = compact.length;
        if (compactSize === 0) {
          return new this(0);
        }
        const diagonalSize = (Math.sqrt(8 * compactSize + 1) + 1) / 2;
        if (!Number.isInteger(diagonalSize)) {
          throw new TypeError(
            `This array is not a compact representation of a DistanceMatrix, ${JSON.stringify(
              compact
            )}`
          );
        }
        const matrix2 = new this(diagonalSize);
        for (let col = 1, row = 0, index = 0; index < compactSize; index++) {
          matrix2.set(col, row, compact[index]);
          if (++col >= diagonalSize) col = ++row + 1;
        }
        return matrix2;
      }
    };
    DistanceMatrix2.prototype.klassSubType = "DistanceMatrix";
    var BaseView = class extends AbstractMatrix2 {
      constructor(matrix2, rows, columns) {
        super();
        this.matrix = matrix2;
        this.rows = rows;
        this.columns = columns;
      }
    };
    var MatrixColumnView2 = class extends BaseView {
      constructor(matrix2, column2) {
        checkColumnIndex(matrix2, column2);
        super(matrix2, matrix2.rows, 1);
        this.column = column2;
      }
      set(rowIndex, columnIndex, value) {
        this.matrix.set(rowIndex, this.column, value);
        return this;
      }
      get(rowIndex) {
        return this.matrix.get(rowIndex, this.column);
      }
    };
    var MatrixColumnSelectionView2 = class extends BaseView {
      constructor(matrix2, columnIndices) {
        checkColumnIndices(matrix2, columnIndices);
        super(matrix2, matrix2.rows, columnIndices.length);
        this.columnIndices = columnIndices;
      }
      set(rowIndex, columnIndex, value) {
        this.matrix.set(rowIndex, this.columnIndices[columnIndex], value);
        return this;
      }
      get(rowIndex, columnIndex) {
        return this.matrix.get(rowIndex, this.columnIndices[columnIndex]);
      }
    };
    var MatrixFlipColumnView2 = class extends BaseView {
      constructor(matrix2) {
        super(matrix2, matrix2.rows, matrix2.columns);
      }
      set(rowIndex, columnIndex, value) {
        this.matrix.set(rowIndex, this.columns - columnIndex - 1, value);
        return this;
      }
      get(rowIndex, columnIndex) {
        return this.matrix.get(rowIndex, this.columns - columnIndex - 1);
      }
    };
    var MatrixFlipRowView2 = class extends BaseView {
      constructor(matrix2) {
        super(matrix2, matrix2.rows, matrix2.columns);
      }
      set(rowIndex, columnIndex, value) {
        this.matrix.set(this.rows - rowIndex - 1, columnIndex, value);
        return this;
      }
      get(rowIndex, columnIndex) {
        return this.matrix.get(this.rows - rowIndex - 1, columnIndex);
      }
    };
    var MatrixRowView2 = class extends BaseView {
      constructor(matrix2, row) {
        checkRowIndex(matrix2, row);
        super(matrix2, 1, matrix2.columns);
        this.row = row;
      }
      set(rowIndex, columnIndex, value) {
        this.matrix.set(this.row, columnIndex, value);
        return this;
      }
      get(rowIndex, columnIndex) {
        return this.matrix.get(this.row, columnIndex);
      }
    };
    var MatrixRowSelectionView2 = class extends BaseView {
      constructor(matrix2, rowIndices) {
        checkRowIndices(matrix2, rowIndices);
        super(matrix2, rowIndices.length, matrix2.columns);
        this.rowIndices = rowIndices;
      }
      set(rowIndex, columnIndex, value) {
        this.matrix.set(this.rowIndices[rowIndex], columnIndex, value);
        return this;
      }
      get(rowIndex, columnIndex) {
        return this.matrix.get(this.rowIndices[rowIndex], columnIndex);
      }
    };
    var MatrixSelectionView2 = class extends BaseView {
      constructor(matrix2, rowIndices, columnIndices) {
        checkRowIndices(matrix2, rowIndices);
        checkColumnIndices(matrix2, columnIndices);
        super(matrix2, rowIndices.length, columnIndices.length);
        this.rowIndices = rowIndices;
        this.columnIndices = columnIndices;
      }
      set(rowIndex, columnIndex, value) {
        this.matrix.set(
          this.rowIndices[rowIndex],
          this.columnIndices[columnIndex],
          value
        );
        return this;
      }
      get(rowIndex, columnIndex) {
        return this.matrix.get(
          this.rowIndices[rowIndex],
          this.columnIndices[columnIndex]
        );
      }
    };
    var MatrixSubView2 = class extends BaseView {
      constructor(matrix2, startRow, endRow, startColumn, endColumn) {
        checkRange(matrix2, startRow, endRow, startColumn, endColumn);
        super(matrix2, endRow - startRow + 1, endColumn - startColumn + 1);
        this.startRow = startRow;
        this.startColumn = startColumn;
      }
      set(rowIndex, columnIndex, value) {
        this.matrix.set(
          this.startRow + rowIndex,
          this.startColumn + columnIndex,
          value
        );
        return this;
      }
      get(rowIndex, columnIndex) {
        return this.matrix.get(
          this.startRow + rowIndex,
          this.startColumn + columnIndex
        );
      }
    };
    var MatrixTransposeView2 = class extends BaseView {
      constructor(matrix2) {
        super(matrix2, matrix2.columns, matrix2.rows);
      }
      set(rowIndex, columnIndex, value) {
        this.matrix.set(columnIndex, rowIndex, value);
        return this;
      }
      get(rowIndex, columnIndex) {
        return this.matrix.get(columnIndex, rowIndex);
      }
    };
    var WrapperMatrix1D2 = class extends AbstractMatrix2 {
      constructor(data, options = {}) {
        const { rows = 1 } = options;
        if (data.length % rows !== 0) {
          throw new Error("the data length is not divisible by the number of rows");
        }
        super();
        this.rows = rows;
        this.columns = data.length / rows;
        this.data = data;
      }
      set(rowIndex, columnIndex, value) {
        let index = this._calculateIndex(rowIndex, columnIndex);
        this.data[index] = value;
        return this;
      }
      get(rowIndex, columnIndex) {
        let index = this._calculateIndex(rowIndex, columnIndex);
        return this.data[index];
      }
      _calculateIndex(row, column2) {
        return row * this.columns + column2;
      }
    };
    var WrapperMatrix2D2 = class extends AbstractMatrix2 {
      constructor(data) {
        super();
        this.data = data;
        this.rows = data.length;
        this.columns = data[0].length;
      }
      set(rowIndex, columnIndex, value) {
        this.data[rowIndex][columnIndex] = value;
        return this;
      }
      get(rowIndex, columnIndex) {
        return this.data[rowIndex][columnIndex];
      }
    };
    function wrap2(array, options) {
      if (isAnyArray.isAnyArray(array)) {
        if (array[0] && isAnyArray.isAnyArray(array[0])) {
          return new WrapperMatrix2D2(array);
        } else {
          return new WrapperMatrix1D2(array, options);
        }
      } else {
        throw new Error("the argument is not an array");
      }
    }
    var LuDecomposition2 = class {
      constructor(matrix2) {
        matrix2 = WrapperMatrix2D2.checkMatrix(matrix2);
        let lu = matrix2.clone();
        let rows = lu.rows;
        let columns = lu.columns;
        let pivotVector = new Float64Array(rows);
        let pivotSign = 1;
        let i, j, k, p, s, t, v;
        let LUcolj, kmax;
        for (i = 0; i < rows; i++) {
          pivotVector[i] = i;
        }
        LUcolj = new Float64Array(rows);
        for (j = 0; j < columns; j++) {
          for (i = 0; i < rows; i++) {
            LUcolj[i] = lu.get(i, j);
          }
          for (i = 0; i < rows; i++) {
            kmax = Math.min(i, j);
            s = 0;
            for (k = 0; k < kmax; k++) {
              s += lu.get(i, k) * LUcolj[k];
            }
            LUcolj[i] -= s;
            lu.set(i, j, LUcolj[i]);
          }
          p = j;
          for (i = j + 1; i < rows; i++) {
            if (Math.abs(LUcolj[i]) > Math.abs(LUcolj[p])) {
              p = i;
            }
          }
          if (p !== j) {
            for (k = 0; k < columns; k++) {
              t = lu.get(p, k);
              lu.set(p, k, lu.get(j, k));
              lu.set(j, k, t);
            }
            v = pivotVector[p];
            pivotVector[p] = pivotVector[j];
            pivotVector[j] = v;
            pivotSign = -pivotSign;
          }
          if (j < rows && lu.get(j, j) !== 0) {
            for (i = j + 1; i < rows; i++) {
              lu.set(i, j, lu.get(i, j) / lu.get(j, j));
            }
          }
        }
        this.LU = lu;
        this.pivotVector = pivotVector;
        this.pivotSign = pivotSign;
      }
      isSingular() {
        let data = this.LU;
        let col = data.columns;
        for (let j = 0; j < col; j++) {
          if (data.get(j, j) === 0) {
            return true;
          }
        }
        return false;
      }
      solve(value) {
        value = Matrix3.checkMatrix(value);
        let lu = this.LU;
        let rows = lu.rows;
        if (rows !== value.rows) {
          throw new Error("Invalid matrix dimensions");
        }
        if (this.isSingular()) {
          throw new Error("LU matrix is singular");
        }
        let count = value.columns;
        let X = value.subMatrixRow(this.pivotVector, 0, count - 1);
        let columns = lu.columns;
        let i, j, k;
        for (k = 0; k < columns; k++) {
          for (i = k + 1; i < columns; i++) {
            for (j = 0; j < count; j++) {
              X.set(i, j, X.get(i, j) - X.get(k, j) * lu.get(i, k));
            }
          }
        }
        for (k = columns - 1; k >= 0; k--) {
          for (j = 0; j < count; j++) {
            X.set(k, j, X.get(k, j) / lu.get(k, k));
          }
          for (i = 0; i < k; i++) {
            for (j = 0; j < count; j++) {
              X.set(i, j, X.get(i, j) - X.get(k, j) * lu.get(i, k));
            }
          }
        }
        return X;
      }
      get determinant() {
        let data = this.LU;
        if (!data.isSquare()) {
          throw new Error("Matrix must be square");
        }
        let determinant3 = this.pivotSign;
        let col = data.columns;
        for (let j = 0; j < col; j++) {
          determinant3 *= data.get(j, j);
        }
        return determinant3;
      }
      get lowerTriangularMatrix() {
        let data = this.LU;
        let rows = data.rows;
        let columns = data.columns;
        let X = new Matrix3(rows, columns);
        for (let i = 0; i < rows; i++) {
          for (let j = 0; j < columns; j++) {
            if (i > j) {
              X.set(i, j, data.get(i, j));
            } else if (i === j) {
              X.set(i, j, 1);
            } else {
              X.set(i, j, 0);
            }
          }
        }
        return X;
      }
      get upperTriangularMatrix() {
        let data = this.LU;
        let rows = data.rows;
        let columns = data.columns;
        let X = new Matrix3(rows, columns);
        for (let i = 0; i < rows; i++) {
          for (let j = 0; j < columns; j++) {
            if (i <= j) {
              X.set(i, j, data.get(i, j));
            } else {
              X.set(i, j, 0);
            }
          }
        }
        return X;
      }
      get pivotPermutationVector() {
        return Array.from(this.pivotVector);
      }
    };
    function hypotenuse(a, b) {
      let r = 0;
      if (Math.abs(a) > Math.abs(b)) {
        r = b / a;
        return Math.abs(a) * Math.sqrt(1 + r * r);
      }
      if (b !== 0) {
        r = a / b;
        return Math.abs(b) * Math.sqrt(1 + r * r);
      }
      return 0;
    }
    var QrDecomposition2 = class {
      constructor(value) {
        value = WrapperMatrix2D2.checkMatrix(value);
        let qr = value.clone();
        let m = value.rows;
        let n = value.columns;
        let rdiag = new Float64Array(n);
        let i, j, k, s;
        for (k = 0; k < n; k++) {
          let nrm = 0;
          for (i = k; i < m; i++) {
            nrm = hypotenuse(nrm, qr.get(i, k));
          }
          if (nrm !== 0) {
            if (qr.get(k, k) < 0) {
              nrm = -nrm;
            }
            for (i = k; i < m; i++) {
              qr.set(i, k, qr.get(i, k) / nrm);
            }
            qr.set(k, k, qr.get(k, k) + 1);
            for (j = k + 1; j < n; j++) {
              s = 0;
              for (i = k; i < m; i++) {
                s += qr.get(i, k) * qr.get(i, j);
              }
              s = -s / qr.get(k, k);
              for (i = k; i < m; i++) {
                qr.set(i, j, qr.get(i, j) + s * qr.get(i, k));
              }
            }
          }
          rdiag[k] = -nrm;
        }
        this.QR = qr;
        this.Rdiag = rdiag;
      }
      solve(value) {
        value = Matrix3.checkMatrix(value);
        let qr = this.QR;
        let m = qr.rows;
        if (value.rows !== m) {
          throw new Error("Matrix row dimensions must agree");
        }
        if (!this.isFullRank()) {
          throw new Error("Matrix is rank deficient");
        }
        let count = value.columns;
        let X = value.clone();
        let n = qr.columns;
        let i, j, k, s;
        for (k = 0; k < n; k++) {
          for (j = 0; j < count; j++) {
            s = 0;
            for (i = k; i < m; i++) {
              s += qr.get(i, k) * X.get(i, j);
            }
            s = -s / qr.get(k, k);
            for (i = k; i < m; i++) {
              X.set(i, j, X.get(i, j) + s * qr.get(i, k));
            }
          }
        }
        for (k = n - 1; k >= 0; k--) {
          for (j = 0; j < count; j++) {
            X.set(k, j, X.get(k, j) / this.Rdiag[k]);
          }
          for (i = 0; i < k; i++) {
            for (j = 0; j < count; j++) {
              X.set(i, j, X.get(i, j) - X.get(k, j) * qr.get(i, k));
            }
          }
        }
        return X.subMatrix(0, n - 1, 0, count - 1);
      }
      isFullRank() {
        let columns = this.QR.columns;
        for (let i = 0; i < columns; i++) {
          if (this.Rdiag[i] === 0) {
            return false;
          }
        }
        return true;
      }
      get upperTriangularMatrix() {
        let qr = this.QR;
        let n = qr.columns;
        let X = new Matrix3(n, n);
        let i, j;
        for (i = 0; i < n; i++) {
          for (j = 0; j < n; j++) {
            if (i < j) {
              X.set(i, j, qr.get(i, j));
            } else if (i === j) {
              X.set(i, j, this.Rdiag[i]);
            } else {
              X.set(i, j, 0);
            }
          }
        }
        return X;
      }
      get orthogonalMatrix() {
        let qr = this.QR;
        let rows = qr.rows;
        let columns = qr.columns;
        let X = new Matrix3(rows, columns);
        let i, j, k, s;
        for (k = columns - 1; k >= 0; k--) {
          for (i = 0; i < rows; i++) {
            X.set(i, k, 0);
          }
          X.set(k, k, 1);
          for (j = k; j < columns; j++) {
            if (qr.get(k, k) !== 0) {
              s = 0;
              for (i = k; i < rows; i++) {
                s += qr.get(i, k) * X.get(i, j);
              }
              s = -s / qr.get(k, k);
              for (i = k; i < rows; i++) {
                X.set(i, j, X.get(i, j) + s * qr.get(i, k));
              }
            }
          }
        }
        return X;
      }
    };
    var SingularValueDecomposition2 = class {
      constructor(value, options = {}) {
        value = WrapperMatrix2D2.checkMatrix(value);
        if (value.isEmpty()) {
          throw new Error("Matrix must be non-empty");
        }
        let m = value.rows;
        let n = value.columns;
        const {
          computeLeftSingularVectors = true,
          computeRightSingularVectors = true,
          autoTranspose = false
        } = options;
        let wantu = Boolean(computeLeftSingularVectors);
        let wantv = Boolean(computeRightSingularVectors);
        let swapped = false;
        let a;
        if (m < n) {
          if (!autoTranspose) {
            a = value.clone();
            console.warn(
              "Computing SVD on a matrix with more columns than rows. Consider enabling autoTranspose"
            );
          } else {
            a = value.transpose();
            m = a.rows;
            n = a.columns;
            swapped = true;
            let aux = wantu;
            wantu = wantv;
            wantv = aux;
          }
        } else {
          a = value.clone();
        }
        let nu = Math.min(m, n);
        let ni = Math.min(m + 1, n);
        let s = new Float64Array(ni);
        let U = new Matrix3(m, nu);
        let V = new Matrix3(n, n);
        let e = new Float64Array(n);
        let work = new Float64Array(m);
        let si = new Float64Array(ni);
        for (let i = 0; i < ni; i++) si[i] = i;
        let nct = Math.min(m - 1, n);
        let nrt = Math.max(0, Math.min(n - 2, m));
        let mrc = Math.max(nct, nrt);
        for (let k = 0; k < mrc; k++) {
          if (k < nct) {
            s[k] = 0;
            for (let i = k; i < m; i++) {
              s[k] = hypotenuse(s[k], a.get(i, k));
            }
            if (s[k] !== 0) {
              if (a.get(k, k) < 0) {
                s[k] = -s[k];
              }
              for (let i = k; i < m; i++) {
                a.set(i, k, a.get(i, k) / s[k]);
              }
              a.set(k, k, a.get(k, k) + 1);
            }
            s[k] = -s[k];
          }
          for (let j = k + 1; j < n; j++) {
            if (k < nct && s[k] !== 0) {
              let t = 0;
              for (let i = k; i < m; i++) {
                t += a.get(i, k) * a.get(i, j);
              }
              t = -t / a.get(k, k);
              for (let i = k; i < m; i++) {
                a.set(i, j, a.get(i, j) + t * a.get(i, k));
              }
            }
            e[j] = a.get(k, j);
          }
          if (wantu && k < nct) {
            for (let i = k; i < m; i++) {
              U.set(i, k, a.get(i, k));
            }
          }
          if (k < nrt) {
            e[k] = 0;
            for (let i = k + 1; i < n; i++) {
              e[k] = hypotenuse(e[k], e[i]);
            }
            if (e[k] !== 0) {
              if (e[k + 1] < 0) {
                e[k] = 0 - e[k];
              }
              for (let i = k + 1; i < n; i++) {
                e[i] /= e[k];
              }
              e[k + 1] += 1;
            }
            e[k] = -e[k];
            if (k + 1 < m && e[k] !== 0) {
              for (let i = k + 1; i < m; i++) {
                work[i] = 0;
              }
              for (let i = k + 1; i < m; i++) {
                for (let j = k + 1; j < n; j++) {
                  work[i] += e[j] * a.get(i, j);
                }
              }
              for (let j = k + 1; j < n; j++) {
                let t = -e[j] / e[k + 1];
                for (let i = k + 1; i < m; i++) {
                  a.set(i, j, a.get(i, j) + t * work[i]);
                }
              }
            }
            if (wantv) {
              for (let i = k + 1; i < n; i++) {
                V.set(i, k, e[i]);
              }
            }
          }
        }
        let p = Math.min(n, m + 1);
        if (nct < n) {
          s[nct] = a.get(nct, nct);
        }
        if (m < p) {
          s[p - 1] = 0;
        }
        if (nrt + 1 < p) {
          e[nrt] = a.get(nrt, p - 1);
        }
        e[p - 1] = 0;
        if (wantu) {
          for (let j = nct; j < nu; j++) {
            for (let i = 0; i < m; i++) {
              U.set(i, j, 0);
            }
            U.set(j, j, 1);
          }
          for (let k = nct - 1; k >= 0; k--) {
            if (s[k] !== 0) {
              for (let j = k + 1; j < nu; j++) {
                let t = 0;
                for (let i = k; i < m; i++) {
                  t += U.get(i, k) * U.get(i, j);
                }
                t = -t / U.get(k, k);
                for (let i = k; i < m; i++) {
                  U.set(i, j, U.get(i, j) + t * U.get(i, k));
                }
              }
              for (let i = k; i < m; i++) {
                U.set(i, k, -U.get(i, k));
              }
              U.set(k, k, 1 + U.get(k, k));
              for (let i = 0; i < k - 1; i++) {
                U.set(i, k, 0);
              }
            } else {
              for (let i = 0; i < m; i++) {
                U.set(i, k, 0);
              }
              U.set(k, k, 1);
            }
          }
        }
        if (wantv) {
          for (let k = n - 1; k >= 0; k--) {
            if (k < nrt && e[k] !== 0) {
              for (let j = k + 1; j < n; j++) {
                let t = 0;
                for (let i = k + 1; i < n; i++) {
                  t += V.get(i, k) * V.get(i, j);
                }
                t = -t / V.get(k + 1, k);
                for (let i = k + 1; i < n; i++) {
                  V.set(i, j, V.get(i, j) + t * V.get(i, k));
                }
              }
            }
            for (let i = 0; i < n; i++) {
              V.set(i, k, 0);
            }
            V.set(k, k, 1);
          }
        }
        let pp = p - 1;
        let eps = Number.EPSILON;
        while (p > 0) {
          let k, kase;
          for (k = p - 2; k >= -1; k--) {
            if (k === -1) {
              break;
            }
            const alpha = Number.MIN_VALUE + eps * Math.abs(s[k] + Math.abs(s[k + 1]));
            if (Math.abs(e[k]) <= alpha || Number.isNaN(e[k])) {
              e[k] = 0;
              break;
            }
          }
          if (k === p - 2) {
            kase = 4;
          } else {
            let ks;
            for (ks = p - 1; ks >= k; ks--) {
              if (ks === k) {
                break;
              }
              let t = (ks !== p ? Math.abs(e[ks]) : 0) + (ks !== k + 1 ? Math.abs(e[ks - 1]) : 0);
              if (Math.abs(s[ks]) <= eps * t) {
                s[ks] = 0;
                break;
              }
            }
            if (ks === k) {
              kase = 3;
            } else if (ks === p - 1) {
              kase = 1;
            } else {
              kase = 2;
              k = ks;
            }
          }
          k++;
          switch (kase) {
            case 1: {
              let f = e[p - 2];
              e[p - 2] = 0;
              for (let j = p - 2; j >= k; j--) {
                let t = hypotenuse(s[j], f);
                let cs = s[j] / t;
                let sn = f / t;
                s[j] = t;
                if (j !== k) {
                  f = -sn * e[j - 1];
                  e[j - 1] = cs * e[j - 1];
                }
                if (wantv) {
                  for (let i = 0; i < n; i++) {
                    t = cs * V.get(i, j) + sn * V.get(i, p - 1);
                    V.set(i, p - 1, -sn * V.get(i, j) + cs * V.get(i, p - 1));
                    V.set(i, j, t);
                  }
                }
              }
              break;
            }
            case 2: {
              let f = e[k - 1];
              e[k - 1] = 0;
              for (let j = k; j < p; j++) {
                let t = hypotenuse(s[j], f);
                let cs = s[j] / t;
                let sn = f / t;
                s[j] = t;
                f = -sn * e[j];
                e[j] = cs * e[j];
                if (wantu) {
                  for (let i = 0; i < m; i++) {
                    t = cs * U.get(i, j) + sn * U.get(i, k - 1);
                    U.set(i, k - 1, -sn * U.get(i, j) + cs * U.get(i, k - 1));
                    U.set(i, j, t);
                  }
                }
              }
              break;
            }
            case 3: {
              const scale = Math.max(
                Math.abs(s[p - 1]),
                Math.abs(s[p - 2]),
                Math.abs(e[p - 2]),
                Math.abs(s[k]),
                Math.abs(e[k])
              );
              const sp = s[p - 1] / scale;
              const spm1 = s[p - 2] / scale;
              const epm1 = e[p - 2] / scale;
              const sk = s[k] / scale;
              const ek = e[k] / scale;
              const b = ((spm1 + sp) * (spm1 - sp) + epm1 * epm1) / 2;
              const c = sp * epm1 * (sp * epm1);
              let shift = 0;
              if (b !== 0 || c !== 0) {
                if (b < 0) {
                  shift = 0 - Math.sqrt(b * b + c);
                } else {
                  shift = Math.sqrt(b * b + c);
                }
                shift = c / (b + shift);
              }
              let f = (sk + sp) * (sk - sp) + shift;
              let g = sk * ek;
              for (let j = k; j < p - 1; j++) {
                let t = hypotenuse(f, g);
                if (t === 0) t = Number.MIN_VALUE;
                let cs = f / t;
                let sn = g / t;
                if (j !== k) {
                  e[j - 1] = t;
                }
                f = cs * s[j] + sn * e[j];
                e[j] = cs * e[j] - sn * s[j];
                g = sn * s[j + 1];
                s[j + 1] = cs * s[j + 1];
                if (wantv) {
                  for (let i = 0; i < n; i++) {
                    t = cs * V.get(i, j) + sn * V.get(i, j + 1);
                    V.set(i, j + 1, -sn * V.get(i, j) + cs * V.get(i, j + 1));
                    V.set(i, j, t);
                  }
                }
                t = hypotenuse(f, g);
                if (t === 0) t = Number.MIN_VALUE;
                cs = f / t;
                sn = g / t;
                s[j] = t;
                f = cs * e[j] + sn * s[j + 1];
                s[j + 1] = -sn * e[j] + cs * s[j + 1];
                g = sn * e[j + 1];
                e[j + 1] = cs * e[j + 1];
                if (wantu && j < m - 1) {
                  for (let i = 0; i < m; i++) {
                    t = cs * U.get(i, j) + sn * U.get(i, j + 1);
                    U.set(i, j + 1, -sn * U.get(i, j) + cs * U.get(i, j + 1));
                    U.set(i, j, t);
                  }
                }
              }
              e[p - 2] = f;
              break;
            }
            case 4: {
              if (s[k] <= 0) {
                s[k] = s[k] < 0 ? -s[k] : 0;
                if (wantv) {
                  for (let i = 0; i <= pp; i++) {
                    V.set(i, k, -V.get(i, k));
                  }
                }
              }
              while (k < pp) {
                if (s[k] >= s[k + 1]) {
                  break;
                }
                let t = s[k];
                s[k] = s[k + 1];
                s[k + 1] = t;
                if (wantv && k < n - 1) {
                  for (let i = 0; i < n; i++) {
                    t = V.get(i, k + 1);
                    V.set(i, k + 1, V.get(i, k));
                    V.set(i, k, t);
                  }
                }
                if (wantu && k < m - 1) {
                  for (let i = 0; i < m; i++) {
                    t = U.get(i, k + 1);
                    U.set(i, k + 1, U.get(i, k));
                    U.set(i, k, t);
                  }
                }
                k++;
              }
              p--;
              break;
            }
          }
        }
        if (swapped) {
          let tmp = V;
          V = U;
          U = tmp;
        }
        this.m = m;
        this.n = n;
        this.s = s;
        this.U = U;
        this.V = V;
      }
      solve(value) {
        let Y = value;
        let e = this.threshold;
        let scols = this.s.length;
        let Ls = Matrix3.zeros(scols, scols);
        for (let i = 0; i < scols; i++) {
          if (Math.abs(this.s[i]) <= e) {
            Ls.set(i, i, 0);
          } else {
            Ls.set(i, i, 1 / this.s[i]);
          }
        }
        let U = this.U;
        let V = this.rightSingularVectors;
        let VL = V.mmul(Ls);
        let vrows = V.rows;
        let urows = U.rows;
        let VLU = Matrix3.zeros(vrows, urows);
        for (let i = 0; i < vrows; i++) {
          for (let j = 0; j < urows; j++) {
            let sum2 = 0;
            for (let k = 0; k < scols; k++) {
              sum2 += VL.get(i, k) * U.get(j, k);
            }
            VLU.set(i, j, sum2);
          }
        }
        return VLU.mmul(Y);
      }
      solveForDiagonal(value) {
        return this.solve(Matrix3.diag(value));
      }
      inverse() {
        let V = this.V;
        let e = this.threshold;
        let vrows = V.rows;
        let vcols = V.columns;
        let X = new Matrix3(vrows, this.s.length);
        for (let i = 0; i < vrows; i++) {
          for (let j = 0; j < vcols; j++) {
            if (Math.abs(this.s[j]) > e) {
              X.set(i, j, V.get(i, j) / this.s[j]);
            }
          }
        }
        let U = this.U;
        let urows = U.rows;
        let ucols = U.columns;
        let Y = new Matrix3(vrows, urows);
        for (let i = 0; i < vrows; i++) {
          for (let j = 0; j < urows; j++) {
            let sum2 = 0;
            for (let k = 0; k < ucols; k++) {
              sum2 += X.get(i, k) * U.get(j, k);
            }
            Y.set(i, j, sum2);
          }
        }
        return Y;
      }
      get condition() {
        return this.s[0] / this.s[Math.min(this.m, this.n) - 1];
      }
      get norm2() {
        return this.s[0];
      }
      get rank() {
        let tol = Math.max(this.m, this.n) * this.s[0] * Number.EPSILON;
        let r = 0;
        let s = this.s;
        for (let i = 0, ii = s.length; i < ii; i++) {
          if (s[i] > tol) {
            r++;
          }
        }
        return r;
      }
      get diagonal() {
        return Array.from(this.s);
      }
      get threshold() {
        return Number.EPSILON / 2 * Math.max(this.m, this.n) * this.s[0];
      }
      get leftSingularVectors() {
        return this.U;
      }
      get rightSingularVectors() {
        return this.V;
      }
      get diagonalMatrix() {
        return Matrix3.diag(this.s);
      }
    };
    function inverse3(matrix2, useSVD = false) {
      matrix2 = WrapperMatrix2D2.checkMatrix(matrix2);
      if (useSVD) {
        return new SingularValueDecomposition2(matrix2).inverse();
      } else {
        return solve2(matrix2, Matrix3.eye(matrix2.rows));
      }
    }
    function solve2(leftHandSide, rightHandSide, useSVD = false) {
      leftHandSide = WrapperMatrix2D2.checkMatrix(leftHandSide);
      rightHandSide = WrapperMatrix2D2.checkMatrix(rightHandSide);
      if (useSVD) {
        return new SingularValueDecomposition2(leftHandSide).solve(rightHandSide);
      } else {
        return leftHandSide.isSquare() ? new LuDecomposition2(leftHandSide).solve(rightHandSide) : new QrDecomposition2(leftHandSide).solve(rightHandSide);
      }
    }
    function determinant2(matrix2) {
      matrix2 = Matrix3.checkMatrix(matrix2);
      if (matrix2.isSquare()) {
        if (matrix2.columns === 0) {
          return 1;
        }
        let a, b, c, d;
        if (matrix2.columns === 2) {
          a = matrix2.get(0, 0);
          b = matrix2.get(0, 1);
          c = matrix2.get(1, 0);
          d = matrix2.get(1, 1);
          return a * d - b * c;
        } else if (matrix2.columns === 3) {
          let subMatrix0, subMatrix1, subMatrix2;
          subMatrix0 = new MatrixSelectionView2(matrix2, [1, 2], [1, 2]);
          subMatrix1 = new MatrixSelectionView2(matrix2, [1, 2], [0, 2]);
          subMatrix2 = new MatrixSelectionView2(matrix2, [1, 2], [0, 1]);
          a = matrix2.get(0, 0);
          b = matrix2.get(0, 1);
          c = matrix2.get(0, 2);
          return a * determinant2(subMatrix0) - b * determinant2(subMatrix1) + c * determinant2(subMatrix2);
        } else {
          return new LuDecomposition2(matrix2).determinant;
        }
      } else {
        throw Error("determinant can only be calculated for a square matrix");
      }
    }
    function xrange(n, exception) {
      let range = [];
      for (let i = 0; i < n; i++) {
        if (i !== exception) {
          range.push(i);
        }
      }
      return range;
    }
    function dependenciesOneRow(error, matrix2, index, thresholdValue = 1e-9, thresholdError = 1e-9) {
      if (error > thresholdError) {
        return new Array(matrix2.rows + 1).fill(0);
      } else {
        let returnArray = matrix2.addRow(index, [0]);
        for (let i = 0; i < returnArray.rows; i++) {
          if (Math.abs(returnArray.get(i, 0)) < thresholdValue) {
            returnArray.set(i, 0, 0);
          }
        }
        return returnArray.to1DArray();
      }
    }
    function linearDependencies2(matrix2, options = {}) {
      const { thresholdValue = 1e-9, thresholdError = 1e-9 } = options;
      matrix2 = Matrix3.checkMatrix(matrix2);
      let n = matrix2.rows;
      let results = new Matrix3(n, n);
      for (let i = 0; i < n; i++) {
        let b = Matrix3.columnVector(matrix2.getRow(i));
        let Abis = matrix2.subMatrixRow(xrange(n, i)).transpose();
        let svd = new SingularValueDecomposition2(Abis);
        let x = svd.solve(b);
        let error = Matrix3.sub(b, Abis.mmul(x)).abs().max();
        results.setRow(
          i,
          dependenciesOneRow(error, x, i, thresholdValue, thresholdError)
        );
      }
      return results;
    }
    function pseudoInverse3(matrix2, threshold = Number.EPSILON) {
      matrix2 = Matrix3.checkMatrix(matrix2);
      if (matrix2.isEmpty()) {
        return matrix2.transpose();
      }
      let svdSolution = new SingularValueDecomposition2(matrix2, { autoTranspose: true });
      let U = svdSolution.leftSingularVectors;
      let V = svdSolution.rightSingularVectors;
      let s = svdSolution.diagonal;
      for (let i = 0; i < s.length; i++) {
        if (Math.abs(s[i]) > threshold) {
          s[i] = 1 / s[i];
        } else {
          s[i] = 0;
        }
      }
      return V.mmul(Matrix3.diag(s).mmul(U.transpose()));
    }
    function covariance3(xMatrix, yMatrix = xMatrix, options = {}) {
      xMatrix = new Matrix3(xMatrix);
      let yIsSame = false;
      if (typeof yMatrix === "object" && !Matrix3.isMatrix(yMatrix) && !isAnyArray.isAnyArray(yMatrix)) {
        options = yMatrix;
        yMatrix = xMatrix;
        yIsSame = true;
      } else {
        yMatrix = new Matrix3(yMatrix);
      }
      if (xMatrix.rows !== yMatrix.rows) {
        throw new TypeError("Both matrices must have the same number of rows");
      }
      const { center = true } = options;
      if (center) {
        xMatrix = xMatrix.center("column");
        if (!yIsSame) {
          yMatrix = yMatrix.center("column");
        }
      }
      const cov = xMatrix.transpose().mmul(yMatrix);
      for (let i = 0; i < cov.rows; i++) {
        for (let j = 0; j < cov.columns; j++) {
          cov.set(i, j, cov.get(i, j) * (1 / (xMatrix.rows - 1)));
        }
      }
      return cov;
    }
    function correlation2(xMatrix, yMatrix = xMatrix, options = {}) {
      xMatrix = new Matrix3(xMatrix);
      let yIsSame = false;
      if (typeof yMatrix === "object" && !Matrix3.isMatrix(yMatrix) && !isAnyArray.isAnyArray(yMatrix)) {
        options = yMatrix;
        yMatrix = xMatrix;
        yIsSame = true;
      } else {
        yMatrix = new Matrix3(yMatrix);
      }
      if (xMatrix.rows !== yMatrix.rows) {
        throw new TypeError("Both matrices must have the same number of rows");
      }
      const { center = true, scale = true } = options;
      if (center) {
        xMatrix.center("column");
        if (!yIsSame) {
          yMatrix.center("column");
        }
      }
      if (scale) {
        xMatrix.scale("column");
        if (!yIsSame) {
          yMatrix.scale("column");
        }
      }
      const sdx = xMatrix.standardDeviation("column", { unbiased: true });
      const sdy = yIsSame ? sdx : yMatrix.standardDeviation("column", { unbiased: true });
      const corr = xMatrix.transpose().mmul(yMatrix);
      for (let i = 0; i < corr.rows; i++) {
        for (let j = 0; j < corr.columns; j++) {
          corr.set(
            i,
            j,
            corr.get(i, j) * (1 / (sdx[i] * sdy[j])) * (1 / (xMatrix.rows - 1))
          );
        }
      }
      return corr;
    }
    var EigenvalueDecomposition3 = class {
      constructor(matrix2, options = {}) {
        const { assumeSymmetric = false } = options;
        matrix2 = WrapperMatrix2D2.checkMatrix(matrix2);
        if (!matrix2.isSquare()) {
          throw new Error("Matrix is not a square matrix");
        }
        if (matrix2.isEmpty()) {
          throw new Error("Matrix must be non-empty");
        }
        let n = matrix2.columns;
        let V = new Matrix3(n, n);
        let d = new Float64Array(n);
        let e = new Float64Array(n);
        let value = matrix2;
        let i, j;
        let isSymmetric = false;
        if (assumeSymmetric) {
          isSymmetric = true;
        } else {
          isSymmetric = matrix2.isSymmetric();
        }
        if (isSymmetric) {
          for (i = 0; i < n; i++) {
            for (j = 0; j < n; j++) {
              V.set(i, j, value.get(i, j));
            }
          }
          tred2(n, e, d, V);
          tql2(n, e, d, V);
        } else {
          let H = new Matrix3(n, n);
          let ort = new Float64Array(n);
          for (j = 0; j < n; j++) {
            for (i = 0; i < n; i++) {
              H.set(i, j, value.get(i, j));
            }
          }
          orthes(n, H, ort, V);
          hqr2(n, e, d, V, H);
        }
        this.n = n;
        this.e = e;
        this.d = d;
        this.V = V;
      }
      get realEigenvalues() {
        return Array.from(this.d);
      }
      get imaginaryEigenvalues() {
        return Array.from(this.e);
      }
      get eigenvectorMatrix() {
        return this.V;
      }
      get diagonalMatrix() {
        let n = this.n;
        let e = this.e;
        let d = this.d;
        let X = new Matrix3(n, n);
        let i, j;
        for (i = 0; i < n; i++) {
          for (j = 0; j < n; j++) {
            X.set(i, j, 0);
          }
          X.set(i, i, d[i]);
          if (e[i] > 0) {
            X.set(i, i + 1, e[i]);
          } else if (e[i] < 0) {
            X.set(i, i - 1, e[i]);
          }
        }
        return X;
      }
    };
    function tred2(n, e, d, V) {
      let f, g, h, i, j, k, hh, scale;
      for (j = 0; j < n; j++) {
        d[j] = V.get(n - 1, j);
      }
      for (i = n - 1; i > 0; i--) {
        scale = 0;
        h = 0;
        for (k = 0; k < i; k++) {
          scale = scale + Math.abs(d[k]);
        }
        if (scale === 0) {
          e[i] = d[i - 1];
          for (j = 0; j < i; j++) {
            d[j] = V.get(i - 1, j);
            V.set(i, j, 0);
            V.set(j, i, 0);
          }
        } else {
          for (k = 0; k < i; k++) {
            d[k] /= scale;
            h += d[k] * d[k];
          }
          f = d[i - 1];
          g = Math.sqrt(h);
          if (f > 0) {
            g = -g;
          }
          e[i] = scale * g;
          h = h - f * g;
          d[i - 1] = f - g;
          for (j = 0; j < i; j++) {
            e[j] = 0;
          }
          for (j = 0; j < i; j++) {
            f = d[j];
            V.set(j, i, f);
            g = e[j] + V.get(j, j) * f;
            for (k = j + 1; k <= i - 1; k++) {
              g += V.get(k, j) * d[k];
              e[k] += V.get(k, j) * f;
            }
            e[j] = g;
          }
          f = 0;
          for (j = 0; j < i; j++) {
            e[j] /= h;
            f += e[j] * d[j];
          }
          hh = f / (h + h);
          for (j = 0; j < i; j++) {
            e[j] -= hh * d[j];
          }
          for (j = 0; j < i; j++) {
            f = d[j];
            g = e[j];
            for (k = j; k <= i - 1; k++) {
              V.set(k, j, V.get(k, j) - (f * e[k] + g * d[k]));
            }
            d[j] = V.get(i - 1, j);
            V.set(i, j, 0);
          }
        }
        d[i] = h;
      }
      for (i = 0; i < n - 1; i++) {
        V.set(n - 1, i, V.get(i, i));
        V.set(i, i, 1);
        h = d[i + 1];
        if (h !== 0) {
          for (k = 0; k <= i; k++) {
            d[k] = V.get(k, i + 1) / h;
          }
          for (j = 0; j <= i; j++) {
            g = 0;
            for (k = 0; k <= i; k++) {
              g += V.get(k, i + 1) * V.get(k, j);
            }
            for (k = 0; k <= i; k++) {
              V.set(k, j, V.get(k, j) - g * d[k]);
            }
          }
        }
        for (k = 0; k <= i; k++) {
          V.set(k, i + 1, 0);
        }
      }
      for (j = 0; j < n; j++) {
        d[j] = V.get(n - 1, j);
        V.set(n - 1, j, 0);
      }
      V.set(n - 1, n - 1, 1);
      e[0] = 0;
    }
    function tql2(n, e, d, V) {
      let g, h, i, j, k, l, m, p, r, dl1, c, c2, c3, el1, s, s2;
      for (i = 1; i < n; i++) {
        e[i - 1] = e[i];
      }
      e[n - 1] = 0;
      let f = 0;
      let tst1 = 0;
      let eps = Number.EPSILON;
      for (l = 0; l < n; l++) {
        tst1 = Math.max(tst1, Math.abs(d[l]) + Math.abs(e[l]));
        m = l;
        while (m < n) {
          if (Math.abs(e[m]) <= eps * tst1) {
            break;
          }
          m++;
        }
        if (m > l) {
          do {
            g = d[l];
            p = (d[l + 1] - g) / (2 * e[l]);
            r = hypotenuse(p, 1);
            if (p < 0) {
              r = -r;
            }
            d[l] = e[l] / (p + r);
            d[l + 1] = e[l] * (p + r);
            dl1 = d[l + 1];
            h = g - d[l];
            for (i = l + 2; i < n; i++) {
              d[i] -= h;
            }
            f = f + h;
            p = d[m];
            c = 1;
            c2 = c;
            c3 = c;
            el1 = e[l + 1];
            s = 0;
            s2 = 0;
            for (i = m - 1; i >= l; i--) {
              c3 = c2;
              c2 = c;
              s2 = s;
              g = c * e[i];
              h = c * p;
              r = hypotenuse(p, e[i]);
              e[i + 1] = s * r;
              s = e[i] / r;
              c = p / r;
              p = c * d[i] - s * g;
              d[i + 1] = h + s * (c * g + s * d[i]);
              for (k = 0; k < n; k++) {
                h = V.get(k, i + 1);
                V.set(k, i + 1, s * V.get(k, i) + c * h);
                V.set(k, i, c * V.get(k, i) - s * h);
              }
            }
            p = -s * s2 * c3 * el1 * e[l] / dl1;
            e[l] = s * p;
            d[l] = c * p;
          } while (Math.abs(e[l]) > eps * tst1);
        }
        d[l] = d[l] + f;
        e[l] = 0;
      }
      for (i = 0; i < n - 1; i++) {
        k = i;
        p = d[i];
        for (j = i + 1; j < n; j++) {
          if (d[j] < p) {
            k = j;
            p = d[j];
          }
        }
        if (k !== i) {
          d[k] = d[i];
          d[i] = p;
          for (j = 0; j < n; j++) {
            p = V.get(j, i);
            V.set(j, i, V.get(j, k));
            V.set(j, k, p);
          }
        }
      }
    }
    function orthes(n, H, ort, V) {
      let low = 0;
      let high = n - 1;
      let f, g, h, i, j, m;
      let scale;
      for (m = low + 1; m <= high - 1; m++) {
        scale = 0;
        for (i = m; i <= high; i++) {
          scale = scale + Math.abs(H.get(i, m - 1));
        }
        if (scale !== 0) {
          h = 0;
          for (i = high; i >= m; i--) {
            ort[i] = H.get(i, m - 1) / scale;
            h += ort[i] * ort[i];
          }
          g = Math.sqrt(h);
          if (ort[m] > 0) {
            g = -g;
          }
          h = h - ort[m] * g;
          ort[m] = ort[m] - g;
          for (j = m; j < n; j++) {
            f = 0;
            for (i = high; i >= m; i--) {
              f += ort[i] * H.get(i, j);
            }
            f = f / h;
            for (i = m; i <= high; i++) {
              H.set(i, j, H.get(i, j) - f * ort[i]);
            }
          }
          for (i = 0; i <= high; i++) {
            f = 0;
            for (j = high; j >= m; j--) {
              f += ort[j] * H.get(i, j);
            }
            f = f / h;
            for (j = m; j <= high; j++) {
              H.set(i, j, H.get(i, j) - f * ort[j]);
            }
          }
          ort[m] = scale * ort[m];
          H.set(m, m - 1, scale * g);
        }
      }
      for (i = 0; i < n; i++) {
        for (j = 0; j < n; j++) {
          V.set(i, j, i === j ? 1 : 0);
        }
      }
      for (m = high - 1; m >= low + 1; m--) {
        if (H.get(m, m - 1) !== 0) {
          for (i = m + 1; i <= high; i++) {
            ort[i] = H.get(i, m - 1);
          }
          for (j = m; j <= high; j++) {
            g = 0;
            for (i = m; i <= high; i++) {
              g += ort[i] * V.get(i, j);
            }
            g = g / ort[m] / H.get(m, m - 1);
            for (i = m; i <= high; i++) {
              V.set(i, j, V.get(i, j) + g * ort[i]);
            }
          }
        }
      }
    }
    function hqr2(nn, e, d, V, H) {
      let n = nn - 1;
      let low = 0;
      let high = nn - 1;
      let eps = Number.EPSILON;
      let exshift = 0;
      let norm = 0;
      let p = 0;
      let q = 0;
      let r = 0;
      let s = 0;
      let z = 0;
      let iter = 0;
      let i, j, k, l, m, t, w, x, y;
      let ra, sa, vr, vi;
      let notlast, cdivres;
      for (i = 0; i < nn; i++) {
        if (i < low || i > high) {
          d[i] = H.get(i, i);
          e[i] = 0;
        }
        for (j = Math.max(i - 1, 0); j < nn; j++) {
          norm = norm + Math.abs(H.get(i, j));
        }
      }
      while (n >= low) {
        l = n;
        while (l > low) {
          s = Math.abs(H.get(l - 1, l - 1)) + Math.abs(H.get(l, l));
          if (s === 0) {
            s = norm;
          }
          if (Math.abs(H.get(l, l - 1)) < eps * s) {
            break;
          }
          l--;
        }
        if (l === n) {
          H.set(n, n, H.get(n, n) + exshift);
          d[n] = H.get(n, n);
          e[n] = 0;
          n--;
          iter = 0;
        } else if (l === n - 1) {
          w = H.get(n, n - 1) * H.get(n - 1, n);
          p = (H.get(n - 1, n - 1) - H.get(n, n)) / 2;
          q = p * p + w;
          z = Math.sqrt(Math.abs(q));
          H.set(n, n, H.get(n, n) + exshift);
          H.set(n - 1, n - 1, H.get(n - 1, n - 1) + exshift);
          x = H.get(n, n);
          if (q >= 0) {
            z = p >= 0 ? p + z : p - z;
            d[n - 1] = x + z;
            d[n] = d[n - 1];
            if (z !== 0) {
              d[n] = x - w / z;
            }
            e[n - 1] = 0;
            e[n] = 0;
            x = H.get(n, n - 1);
            s = Math.abs(x) + Math.abs(z);
            p = x / s;
            q = z / s;
            r = Math.sqrt(p * p + q * q);
            p = p / r;
            q = q / r;
            for (j = n - 1; j < nn; j++) {
              z = H.get(n - 1, j);
              H.set(n - 1, j, q * z + p * H.get(n, j));
              H.set(n, j, q * H.get(n, j) - p * z);
            }
            for (i = 0; i <= n; i++) {
              z = H.get(i, n - 1);
              H.set(i, n - 1, q * z + p * H.get(i, n));
              H.set(i, n, q * H.get(i, n) - p * z);
            }
            for (i = low; i <= high; i++) {
              z = V.get(i, n - 1);
              V.set(i, n - 1, q * z + p * V.get(i, n));
              V.set(i, n, q * V.get(i, n) - p * z);
            }
          } else {
            d[n - 1] = x + p;
            d[n] = x + p;
            e[n - 1] = z;
            e[n] = -z;
          }
          n = n - 2;
          iter = 0;
        } else {
          x = H.get(n, n);
          y = 0;
          w = 0;
          if (l < n) {
            y = H.get(n - 1, n - 1);
            w = H.get(n, n - 1) * H.get(n - 1, n);
          }
          if (iter === 10) {
            exshift += x;
            for (i = low; i <= n; i++) {
              H.set(i, i, H.get(i, i) - x);
            }
            s = Math.abs(H.get(n, n - 1)) + Math.abs(H.get(n - 1, n - 2));
            x = y = 0.75 * s;
            w = -0.4375 * s * s;
          }
          if (iter === 30) {
            s = (y - x) / 2;
            s = s * s + w;
            if (s > 0) {
              s = Math.sqrt(s);
              if (y < x) {
                s = -s;
              }
              s = x - w / ((y - x) / 2 + s);
              for (i = low; i <= n; i++) {
                H.set(i, i, H.get(i, i) - s);
              }
              exshift += s;
              x = y = w = 0.964;
            }
          }
          iter = iter + 1;
          m = n - 2;
          while (m >= l) {
            z = H.get(m, m);
            r = x - z;
            s = y - z;
            p = (r * s - w) / H.get(m + 1, m) + H.get(m, m + 1);
            q = H.get(m + 1, m + 1) - z - r - s;
            r = H.get(m + 2, m + 1);
            s = Math.abs(p) + Math.abs(q) + Math.abs(r);
            p = p / s;
            q = q / s;
            r = r / s;
            if (m === l) {
              break;
            }
            if (Math.abs(H.get(m, m - 1)) * (Math.abs(q) + Math.abs(r)) < eps * (Math.abs(p) * (Math.abs(H.get(m - 1, m - 1)) + Math.abs(z) + Math.abs(H.get(m + 1, m + 1))))) {
              break;
            }
            m--;
          }
          for (i = m + 2; i <= n; i++) {
            H.set(i, i - 2, 0);
            if (i > m + 2) {
              H.set(i, i - 3, 0);
            }
          }
          for (k = m; k <= n - 1; k++) {
            notlast = k !== n - 1;
            if (k !== m) {
              p = H.get(k, k - 1);
              q = H.get(k + 1, k - 1);
              r = notlast ? H.get(k + 2, k - 1) : 0;
              x = Math.abs(p) + Math.abs(q) + Math.abs(r);
              if (x !== 0) {
                p = p / x;
                q = q / x;
                r = r / x;
              }
            }
            if (x === 0) {
              break;
            }
            s = Math.sqrt(p * p + q * q + r * r);
            if (p < 0) {
              s = -s;
            }
            if (s !== 0) {
              if (k !== m) {
                H.set(k, k - 1, -s * x);
              } else if (l !== m) {
                H.set(k, k - 1, -H.get(k, k - 1));
              }
              p = p + s;
              x = p / s;
              y = q / s;
              z = r / s;
              q = q / p;
              r = r / p;
              for (j = k; j < nn; j++) {
                p = H.get(k, j) + q * H.get(k + 1, j);
                if (notlast) {
                  p = p + r * H.get(k + 2, j);
                  H.set(k + 2, j, H.get(k + 2, j) - p * z);
                }
                H.set(k, j, H.get(k, j) - p * x);
                H.set(k + 1, j, H.get(k + 1, j) - p * y);
              }
              for (i = 0; i <= Math.min(n, k + 3); i++) {
                p = x * H.get(i, k) + y * H.get(i, k + 1);
                if (notlast) {
                  p = p + z * H.get(i, k + 2);
                  H.set(i, k + 2, H.get(i, k + 2) - p * r);
                }
                H.set(i, k, H.get(i, k) - p);
                H.set(i, k + 1, H.get(i, k + 1) - p * q);
              }
              for (i = low; i <= high; i++) {
                p = x * V.get(i, k) + y * V.get(i, k + 1);
                if (notlast) {
                  p = p + z * V.get(i, k + 2);
                  V.set(i, k + 2, V.get(i, k + 2) - p * r);
                }
                V.set(i, k, V.get(i, k) - p);
                V.set(i, k + 1, V.get(i, k + 1) - p * q);
              }
            }
          }
        }
      }
      if (norm === 0) {
        return;
      }
      for (n = nn - 1; n >= 0; n--) {
        p = d[n];
        q = e[n];
        if (q === 0) {
          l = n;
          H.set(n, n, 1);
          for (i = n - 1; i >= 0; i--) {
            w = H.get(i, i) - p;
            r = 0;
            for (j = l; j <= n; j++) {
              r = r + H.get(i, j) * H.get(j, n);
            }
            if (e[i] < 0) {
              z = w;
              s = r;
            } else {
              l = i;
              if (e[i] === 0) {
                H.set(i, n, w !== 0 ? -r / w : -r / (eps * norm));
              } else {
                x = H.get(i, i + 1);
                y = H.get(i + 1, i);
                q = (d[i] - p) * (d[i] - p) + e[i] * e[i];
                t = (x * s - z * r) / q;
                H.set(i, n, t);
                H.set(
                  i + 1,
                  n,
                  Math.abs(x) > Math.abs(z) ? (-r - w * t) / x : (-s - y * t) / z
                );
              }
              t = Math.abs(H.get(i, n));
              if (eps * t * t > 1) {
                for (j = i; j <= n; j++) {
                  H.set(j, n, H.get(j, n) / t);
                }
              }
            }
          }
        } else if (q < 0) {
          l = n - 1;
          if (Math.abs(H.get(n, n - 1)) > Math.abs(H.get(n - 1, n))) {
            H.set(n - 1, n - 1, q / H.get(n, n - 1));
            H.set(n - 1, n, -(H.get(n, n) - p) / H.get(n, n - 1));
          } else {
            cdivres = cdiv(0, -H.get(n - 1, n), H.get(n - 1, n - 1) - p, q);
            H.set(n - 1, n - 1, cdivres[0]);
            H.set(n - 1, n, cdivres[1]);
          }
          H.set(n, n - 1, 0);
          H.set(n, n, 1);
          for (i = n - 2; i >= 0; i--) {
            ra = 0;
            sa = 0;
            for (j = l; j <= n; j++) {
              ra = ra + H.get(i, j) * H.get(j, n - 1);
              sa = sa + H.get(i, j) * H.get(j, n);
            }
            w = H.get(i, i) - p;
            if (e[i] < 0) {
              z = w;
              r = ra;
              s = sa;
            } else {
              l = i;
              if (e[i] === 0) {
                cdivres = cdiv(-ra, -sa, w, q);
                H.set(i, n - 1, cdivres[0]);
                H.set(i, n, cdivres[1]);
              } else {
                x = H.get(i, i + 1);
                y = H.get(i + 1, i);
                vr = (d[i] - p) * (d[i] - p) + e[i] * e[i] - q * q;
                vi = (d[i] - p) * 2 * q;
                if (vr === 0 && vi === 0) {
                  vr = eps * norm * (Math.abs(w) + Math.abs(q) + Math.abs(x) + Math.abs(y) + Math.abs(z));
                }
                cdivres = cdiv(
                  x * r - z * ra + q * sa,
                  x * s - z * sa - q * ra,
                  vr,
                  vi
                );
                H.set(i, n - 1, cdivres[0]);
                H.set(i, n, cdivres[1]);
                if (Math.abs(x) > Math.abs(z) + Math.abs(q)) {
                  H.set(
                    i + 1,
                    n - 1,
                    (-ra - w * H.get(i, n - 1) + q * H.get(i, n)) / x
                  );
                  H.set(
                    i + 1,
                    n,
                    (-sa - w * H.get(i, n) - q * H.get(i, n - 1)) / x
                  );
                } else {
                  cdivres = cdiv(
                    -r - y * H.get(i, n - 1),
                    -s - y * H.get(i, n),
                    z,
                    q
                  );
                  H.set(i + 1, n - 1, cdivres[0]);
                  H.set(i + 1, n, cdivres[1]);
                }
              }
              t = Math.max(Math.abs(H.get(i, n - 1)), Math.abs(H.get(i, n)));
              if (eps * t * t > 1) {
                for (j = i; j <= n; j++) {
                  H.set(j, n - 1, H.get(j, n - 1) / t);
                  H.set(j, n, H.get(j, n) / t);
                }
              }
            }
          }
        }
      }
      for (i = 0; i < nn; i++) {
        if (i < low || i > high) {
          for (j = i; j < nn; j++) {
            V.set(i, j, H.get(i, j));
          }
        }
      }
      for (j = nn - 1; j >= low; j--) {
        for (i = low; i <= high; i++) {
          z = 0;
          for (k = low; k <= Math.min(j, high); k++) {
            z = z + V.get(i, k) * H.get(k, j);
          }
          V.set(i, j, z);
        }
      }
    }
    function cdiv(xr, xi, yr, yi) {
      let r, d;
      if (Math.abs(yr) > Math.abs(yi)) {
        r = yi / yr;
        d = yr + r * yi;
        return [(xr + r * xi) / d, (xi - r * xr) / d];
      } else {
        r = yr / yi;
        d = yi + r * yr;
        return [(r * xr + xi) / d, (r * xi - xr) / d];
      }
    }
    var CholeskyDecomposition2 = class {
      constructor(value) {
        value = WrapperMatrix2D2.checkMatrix(value);
        if (!value.isSymmetric()) {
          throw new Error("Matrix is not symmetric");
        }
        let a = value;
        let dimension = a.rows;
        let l = new Matrix3(dimension, dimension);
        let positiveDefinite = true;
        let i, j, k;
        for (j = 0; j < dimension; j++) {
          let d = 0;
          for (k = 0; k < j; k++) {
            let s = 0;
            for (i = 0; i < k; i++) {
              s += l.get(k, i) * l.get(j, i);
            }
            s = (a.get(j, k) - s) / l.get(k, k);
            l.set(j, k, s);
            d = d + s * s;
          }
          d = a.get(j, j) - d;
          positiveDefinite &&= d > 0;
          l.set(j, j, Math.sqrt(Math.max(d, 0)));
          for (k = j + 1; k < dimension; k++) {
            l.set(j, k, 0);
          }
        }
        this.L = l;
        this.positiveDefinite = positiveDefinite;
      }
      isPositiveDefinite() {
        return this.positiveDefinite;
      }
      solve(value) {
        value = WrapperMatrix2D2.checkMatrix(value);
        let l = this.L;
        let dimension = l.rows;
        if (value.rows !== dimension) {
          throw new Error("Matrix dimensions do not match");
        }
        if (this.isPositiveDefinite() === false) {
          throw new Error("Matrix is not positive definite");
        }
        let count = value.columns;
        let B = value.clone();
        let i, j, k;
        for (k = 0; k < dimension; k++) {
          for (j = 0; j < count; j++) {
            for (i = 0; i < k; i++) {
              B.set(k, j, B.get(k, j) - B.get(i, j) * l.get(k, i));
            }
            B.set(k, j, B.get(k, j) / l.get(k, k));
          }
        }
        for (k = dimension - 1; k >= 0; k--) {
          for (j = 0; j < count; j++) {
            for (i = k + 1; i < dimension; i++) {
              B.set(k, j, B.get(k, j) - B.get(i, j) * l.get(i, k));
            }
            B.set(k, j, B.get(k, j) / l.get(k, k));
          }
        }
        return B;
      }
      get lowerTriangularMatrix() {
        return this.L;
      }
    };
    var nipals = class {
      constructor(X, options = {}) {
        X = WrapperMatrix2D2.checkMatrix(X);
        let { Y } = options;
        const {
          scaleScores = false,
          maxIterations = 1e3,
          terminationCriteria = 1e-10
        } = options;
        let u;
        if (Y) {
          if (isAnyArray.isAnyArray(Y) && typeof Y[0] === "number") {
            Y = Matrix3.columnVector(Y);
          } else {
            Y = WrapperMatrix2D2.checkMatrix(Y);
          }
          if (Y.rows !== X.rows) {
            throw new Error("Y should have the same number of rows as X");
          }
          u = Y.getColumnVector(0);
        } else {
          u = X.getColumnVector(0);
        }
        let diff = 1;
        let t, q, w, tOld;
        for (let counter = 0; counter < maxIterations && diff > terminationCriteria; counter++) {
          w = X.transpose().mmul(u).div(u.transpose().mmul(u).get(0, 0));
          w = w.div(w.norm());
          t = X.mmul(w).div(w.transpose().mmul(w).get(0, 0));
          if (counter > 0) {
            diff = t.clone().sub(tOld).pow(2).sum();
          }
          tOld = t.clone();
          if (Y) {
            q = Y.transpose().mmul(t).div(t.transpose().mmul(t).get(0, 0));
            q = q.div(q.norm());
            u = Y.mmul(q).div(q.transpose().mmul(q).get(0, 0));
          } else {
            u = t;
          }
        }
        if (Y) {
          let p = X.transpose().mmul(t).div(t.transpose().mmul(t).get(0, 0));
          p = p.div(p.norm());
          let xResidual = X.clone().sub(t.clone().mmul(p.transpose()));
          let residual = u.transpose().mmul(t).div(t.transpose().mmul(t).get(0, 0));
          let yResidual = Y.clone().sub(
            t.clone().mulS(residual.get(0, 0)).mmul(q.transpose())
          );
          this.t = t;
          this.p = p.transpose();
          this.w = w.transpose();
          this.q = q;
          this.u = u;
          this.s = t.transpose().mmul(t);
          this.xResidual = xResidual;
          this.yResidual = yResidual;
          this.betas = residual;
        } else {
          this.w = w.transpose();
          this.s = t.transpose().mmul(t).sqrt();
          if (scaleScores) {
            this.t = t.clone().div(this.s.get(0, 0));
          } else {
            this.t = t;
          }
          this.xResidual = X.sub(t.mmul(w.transpose()));
        }
      }
    };
    exports2.AbstractMatrix = AbstractMatrix2;
    exports2.CHO = CholeskyDecomposition2;
    exports2.CholeskyDecomposition = CholeskyDecomposition2;
    exports2.DistanceMatrix = DistanceMatrix2;
    exports2.EVD = EigenvalueDecomposition3;
    exports2.EigenvalueDecomposition = EigenvalueDecomposition3;
    exports2.LU = LuDecomposition2;
    exports2.LuDecomposition = LuDecomposition2;
    exports2.Matrix = Matrix3;
    exports2.MatrixColumnSelectionView = MatrixColumnSelectionView2;
    exports2.MatrixColumnView = MatrixColumnView2;
    exports2.MatrixFlipColumnView = MatrixFlipColumnView2;
    exports2.MatrixFlipRowView = MatrixFlipRowView2;
    exports2.MatrixRowSelectionView = MatrixRowSelectionView2;
    exports2.MatrixRowView = MatrixRowView2;
    exports2.MatrixSelectionView = MatrixSelectionView2;
    exports2.MatrixSubView = MatrixSubView2;
    exports2.MatrixTransposeView = MatrixTransposeView2;
    exports2.NIPALS = nipals;
    exports2.Nipals = nipals;
    exports2.QR = QrDecomposition2;
    exports2.QrDecomposition = QrDecomposition2;
    exports2.SVD = SingularValueDecomposition2;
    exports2.SingularValueDecomposition = SingularValueDecomposition2;
    exports2.SymmetricMatrix = SymmetricMatrix2;
    exports2.WrapperMatrix1D = WrapperMatrix1D2;
    exports2.WrapperMatrix2D = WrapperMatrix2D2;
    exports2.correlation = correlation2;
    exports2.covariance = covariance3;
    exports2.default = Matrix3;
    exports2.determinant = determinant2;
    exports2.inverse = inverse3;
    exports2.linearDependencies = linearDependencies2;
    exports2.pseudoInverse = pseudoInverse3;
    exports2.solve = solve2;
    exports2.wrap = wrap2;
  }
});

// node_modules/javascript-lp-solver/src/Tableau/Solution.js
var require_Solution = __commonJS({
  "node_modules/javascript-lp-solver/src/Tableau/Solution.js"(exports2, module2) {
    function Solution(tableau, evaluation, feasible, bounded) {
      this.feasible = feasible;
      this.evaluation = evaluation;
      this.bounded = bounded;
      this._tableau = tableau;
    }
    module2.exports = Solution;
    Solution.prototype.generateSolutionSet = function() {
      var solutionSet = {};
      var tableau = this._tableau;
      var varIndexByRow = tableau.varIndexByRow;
      var variablesPerIndex = tableau.variablesPerIndex;
      var matrix2 = tableau.matrix;
      var rhsColumn = tableau.rhsColumn;
      var lastRow = tableau.height - 1;
      var roundingCoeff = Math.round(1 / tableau.precision);
      for (var r = 1; r <= lastRow; r += 1) {
        var varIndex = varIndexByRow[r];
        var variable = variablesPerIndex[varIndex];
        if (variable === void 0 || variable.isSlack === true) {
          continue;
        }
        var varValue = matrix2[r][rhsColumn];
        solutionSet[variable.id] = Math.round((Number.EPSILON + varValue) * roundingCoeff) / roundingCoeff;
      }
      return solutionSet;
    };
  }
});

// node_modules/javascript-lp-solver/src/Tableau/MilpSolution.js
var require_MilpSolution = __commonJS({
  "node_modules/javascript-lp-solver/src/Tableau/MilpSolution.js"(exports2, module2) {
    var Solution = require_Solution();
    function MilpSolution(tableau, evaluation, feasible, bounded, branchAndCutIterations) {
      Solution.call(this, tableau, evaluation, feasible, bounded);
      this.iter = branchAndCutIterations;
    }
    module2.exports = MilpSolution;
    MilpSolution.prototype = Object.create(Solution.prototype);
    MilpSolution.constructor = MilpSolution;
  }
});

// node_modules/javascript-lp-solver/src/Tableau/Tableau.js
var require_Tableau = __commonJS({
  "node_modules/javascript-lp-solver/src/Tableau/Tableau.js"(exports2, module2) {
    var Solution = require_Solution();
    var MilpSolution = require_MilpSolution();
    function Tableau(precision) {
      this.model = null;
      this.matrix = null;
      this.width = 0;
      this.height = 0;
      this.costRowIndex = 0;
      this.rhsColumn = 0;
      this.variablesPerIndex = [];
      this.unrestrictedVars = null;
      this.feasible = true;
      this.evaluation = 0;
      this.simplexIters = 0;
      this.varIndexByRow = null;
      this.varIndexByCol = null;
      this.rowByVarIndex = null;
      this.colByVarIndex = null;
      this.precision = precision || 1e-8;
      this.optionalObjectives = [];
      this.objectivesByPriority = {};
      this.savedState = null;
      this.availableIndexes = [];
      this.lastElementIndex = 0;
      this.variables = null;
      this.nVars = 0;
      this.bounded = true;
      this.unboundedVarIndex = null;
      this.branchAndCutIterations = 0;
    }
    module2.exports = Tableau;
    Tableau.prototype.solve = function() {
      if (this.model.getNumberOfIntegerVariables() > 0) {
        this.branchAndCut();
      } else {
        this.simplex();
      }
      this.updateVariableValues();
      return this.getSolution();
    };
    function OptionalObjective(priority, nColumns) {
      this.priority = priority;
      this.reducedCosts = new Array(nColumns);
      for (var c = 0; c < nColumns; c += 1) {
        this.reducedCosts[c] = 0;
      }
    }
    OptionalObjective.prototype.copy = function() {
      var copy = new OptionalObjective(this.priority, this.reducedCosts.length);
      copy.reducedCosts = this.reducedCosts.slice();
      return copy;
    };
    Tableau.prototype.setOptionalObjective = function(priority, column2, cost) {
      var objectiveForPriority = this.objectivesByPriority[priority];
      if (objectiveForPriority === void 0) {
        var nColumns = Math.max(this.width, column2 + 1);
        objectiveForPriority = new OptionalObjective(priority, nColumns);
        this.objectivesByPriority[priority] = objectiveForPriority;
        this.optionalObjectives.push(objectiveForPriority);
        this.optionalObjectives.sort(function(a, b) {
          return a.priority - b.priority;
        });
      }
      objectiveForPriority.reducedCosts[column2] = cost;
    };
    Tableau.prototype.initialize = function(width, height, variables, unrestrictedVars) {
      this.variables = variables;
      this.unrestrictedVars = unrestrictedVars;
      this.width = width;
      this.height = height;
      var tmpRow = new Array(width);
      for (var i = 0; i < width; i++) {
        tmpRow[i] = 0;
      }
      this.matrix = new Array(height);
      for (var j = 0; j < height; j++) {
        this.matrix[j] = tmpRow.slice();
      }
      this.varIndexByRow = new Array(this.height);
      this.varIndexByCol = new Array(this.width);
      this.varIndexByRow[0] = -1;
      this.varIndexByCol[0] = -1;
      this.nVars = width + height - 2;
      this.rowByVarIndex = new Array(this.nVars);
      this.colByVarIndex = new Array(this.nVars);
      this.lastElementIndex = this.nVars;
    };
    Tableau.prototype._resetMatrix = function() {
      var variables = this.model.variables;
      var constraints = this.model.constraints;
      var nVars = variables.length;
      var nConstraints = constraints.length;
      var v, varIndex;
      var costRow = this.matrix[0];
      var coeff = this.model.isMinimization === true ? -1 : 1;
      for (v = 0; v < nVars; v += 1) {
        var variable = variables[v];
        var priority = variable.priority;
        var cost = coeff * variable.cost;
        if (priority === 0) {
          costRow[v + 1] = cost;
        } else {
          this.setOptionalObjective(priority, v + 1, cost);
        }
        varIndex = variables[v].index;
        this.rowByVarIndex[varIndex] = -1;
        this.colByVarIndex[varIndex] = v + 1;
        this.varIndexByCol[v + 1] = varIndex;
      }
      var rowIndex = 1;
      for (var c = 0; c < nConstraints; c += 1) {
        var constraint = constraints[c];
        var constraintIndex = constraint.index;
        this.rowByVarIndex[constraintIndex] = rowIndex;
        this.colByVarIndex[constraintIndex] = -1;
        this.varIndexByRow[rowIndex] = constraintIndex;
        var t, term, column2;
        var terms = constraint.terms;
        var nTerms = terms.length;
        var row = this.matrix[rowIndex++];
        if (constraint.isUpperBound) {
          for (t = 0; t < nTerms; t += 1) {
            term = terms[t];
            column2 = this.colByVarIndex[term.variable.index];
            row[column2] = term.coefficient;
          }
          row[0] = constraint.rhs;
        } else {
          for (t = 0; t < nTerms; t += 1) {
            term = terms[t];
            column2 = this.colByVarIndex[term.variable.index];
            row[column2] = -term.coefficient;
          }
          row[0] = -constraint.rhs;
        }
      }
    };
    Tableau.prototype.setModel = function(model) {
      this.model = model;
      var width = model.nVariables + 1;
      var height = model.nConstraints + 1;
      this.initialize(width, height, model.variables, model.unrestrictedVariables);
      this._resetMatrix();
      return this;
    };
    Tableau.prototype.getNewElementIndex = function() {
      if (this.availableIndexes.length > 0) {
        return this.availableIndexes.pop();
      }
      var index = this.lastElementIndex;
      this.lastElementIndex += 1;
      return index;
    };
    Tableau.prototype.density = function() {
      var density = 0;
      var matrix2 = this.matrix;
      for (var r = 0; r < this.height; r++) {
        var row = matrix2[r];
        for (var c = 0; c < this.width; c++) {
          if (row[c] !== 0) {
            density += 1;
          }
        }
      }
      return density / (this.height * this.width);
    };
    Tableau.prototype.setEvaluation = function() {
      var roundingCoeff = Math.round(1 / this.precision);
      var evaluation = this.matrix[this.costRowIndex][this.rhsColumn];
      var roundedEvaluation = Math.round((Number.EPSILON + evaluation) * roundingCoeff) / roundingCoeff;
      this.evaluation = roundedEvaluation;
      if (this.simplexIters === 0) {
        this.bestPossibleEval = roundedEvaluation;
      }
    };
    Tableau.prototype.getSolution = function() {
      var evaluation = this.model.isMinimization === true ? this.evaluation : -this.evaluation;
      if (this.model.getNumberOfIntegerVariables() > 0) {
        return new MilpSolution(this, evaluation, this.feasible, this.bounded, this.branchAndCutIterations);
      } else {
        return new Solution(this, evaluation, this.feasible, this.bounded);
      }
    };
  }
});

// node_modules/javascript-lp-solver/src/Tableau/simplex.js
var require_simplex = __commonJS({
  "node_modules/javascript-lp-solver/src/Tableau/simplex.js"() {
    var Tableau = require_Tableau();
    Tableau.prototype.simplex = function() {
      this.bounded = true;
      this.phase1();
      if (this.feasible === true) {
        this.phase2();
      }
      return this;
    };
    Tableau.prototype.phase1 = function() {
      var debugCheckForCycles = this.model.checkForCycles;
      var varIndexesCycle = [];
      var matrix2 = this.matrix;
      var rhsColumn = this.rhsColumn;
      var lastColumn = this.width - 1;
      var lastRow = this.height - 1;
      var unrestricted;
      var iterations = 0;
      while (true) {
        var leavingRowIndex = 0;
        var rhsValue = -this.precision;
        for (var r = 1; r <= lastRow; r++) {
          unrestricted = this.unrestrictedVars[this.varIndexByRow[r]] === true;
          var value = matrix2[r][rhsColumn];
          if (value < rhsValue) {
            rhsValue = value;
            leavingRowIndex = r;
          }
        }
        if (leavingRowIndex === 0) {
          this.feasible = true;
          return iterations;
        }
        var enteringColumn = 0;
        var maxQuotient = -Infinity;
        var costRow = matrix2[0];
        var leavingRow = matrix2[leavingRowIndex];
        for (var c = 1; c <= lastColumn; c++) {
          var coefficient = leavingRow[c];
          unrestricted = this.unrestrictedVars[this.varIndexByCol[c]] === true;
          if (unrestricted || coefficient < -this.precision) {
            var quotient = -costRow[c] / coefficient;
            if (maxQuotient < quotient) {
              maxQuotient = quotient;
              enteringColumn = c;
            }
          }
        }
        if (enteringColumn === 0) {
          this.feasible = false;
          return iterations;
        }
        if (debugCheckForCycles) {
          varIndexesCycle.push([this.varIndexByRow[leavingRowIndex], this.varIndexByCol[enteringColumn]]);
          var cycleData = this.checkForCycles(varIndexesCycle);
          if (cycleData.length > 0) {
            this.model.messages.push("Cycle in phase 1");
            this.model.messages.push("Start :" + cycleData[0]);
            this.model.messages.push("Length :" + cycleData[1]);
            this.feasible = false;
            return iterations;
          }
        }
        this.pivot(leavingRowIndex, enteringColumn);
        iterations += 1;
      }
    };
    Tableau.prototype.phase2 = function() {
      var debugCheckForCycles = this.model.checkForCycles;
      var varIndexesCycle = [];
      var matrix2 = this.matrix;
      var rhsColumn = this.rhsColumn;
      var lastColumn = this.width - 1;
      var lastRow = this.height - 1;
      var precision = this.precision;
      var nOptionalObjectives = this.optionalObjectives.length;
      var optionalCostsColumns = null;
      var iterations = 0;
      var reducedCost, unrestricted;
      while (true) {
        var costRow = matrix2[this.costRowIndex];
        if (nOptionalObjectives > 0) {
          optionalCostsColumns = [];
        }
        var enteringColumn = 0;
        var enteringValue = precision;
        var isReducedCostNegative = false;
        for (var c = 1; c <= lastColumn; c++) {
          reducedCost = costRow[c];
          unrestricted = this.unrestrictedVars[this.varIndexByCol[c]] === true;
          if (nOptionalObjectives > 0 && -precision < reducedCost && reducedCost < precision) {
            optionalCostsColumns.push(c);
            continue;
          }
          if (unrestricted && reducedCost < 0) {
            if (-reducedCost > enteringValue) {
              enteringValue = -reducedCost;
              enteringColumn = c;
              isReducedCostNegative = true;
            }
            continue;
          }
          if (reducedCost > enteringValue) {
            enteringValue = reducedCost;
            enteringColumn = c;
            isReducedCostNegative = false;
          }
        }
        if (nOptionalObjectives > 0) {
          var o = 0;
          while (enteringColumn === 0 && optionalCostsColumns.length > 0 && o < nOptionalObjectives) {
            var optionalCostsColumns2 = [];
            var reducedCosts = this.optionalObjectives[o].reducedCosts;
            enteringValue = precision;
            for (var i = 0; i < optionalCostsColumns.length; i++) {
              c = optionalCostsColumns[i];
              reducedCost = reducedCosts[c];
              unrestricted = this.unrestrictedVars[this.varIndexByCol[c]] === true;
              if (-precision < reducedCost && reducedCost < precision) {
                optionalCostsColumns2.push(c);
                continue;
              }
              if (unrestricted && reducedCost < 0) {
                if (-reducedCost > enteringValue) {
                  enteringValue = -reducedCost;
                  enteringColumn = c;
                  isReducedCostNegative = true;
                }
                continue;
              }
              if (reducedCost > enteringValue) {
                enteringValue = reducedCost;
                enteringColumn = c;
                isReducedCostNegative = false;
              }
            }
            optionalCostsColumns = optionalCostsColumns2;
            o += 1;
          }
        }
        if (enteringColumn === 0) {
          this.setEvaluation();
          this.simplexIters += 1;
          return iterations;
        }
        var leavingRow = 0;
        var minQuotient = Infinity;
        var varIndexByRow = this.varIndexByRow;
        for (var r = 1; r <= lastRow; r++) {
          var row = matrix2[r];
          var rhsValue = row[rhsColumn];
          var colValue = row[enteringColumn];
          if (-precision < colValue && colValue < precision) {
            continue;
          }
          if (colValue > 0 && precision > rhsValue && rhsValue > -precision) {
            minQuotient = 0;
            leavingRow = r;
            break;
          }
          var quotient = isReducedCostNegative ? -rhsValue / colValue : rhsValue / colValue;
          if (quotient > precision && minQuotient > quotient) {
            minQuotient = quotient;
            leavingRow = r;
          }
        }
        if (minQuotient === Infinity) {
          this.evaluation = -Infinity;
          this.bounded = false;
          this.unboundedVarIndex = this.varIndexByCol[enteringColumn];
          return iterations;
        }
        if (debugCheckForCycles) {
          varIndexesCycle.push([this.varIndexByRow[leavingRow], this.varIndexByCol[enteringColumn]]);
          var cycleData = this.checkForCycles(varIndexesCycle);
          if (cycleData.length > 0) {
            this.model.messages.push("Cycle in phase 2");
            this.model.messages.push("Start :" + cycleData[0]);
            this.model.messages.push("Length :" + cycleData[1]);
            this.feasible = false;
            return iterations;
          }
        }
        this.pivot(leavingRow, enteringColumn, true);
        iterations += 1;
      }
    };
    var nonZeroColumns = [];
    Tableau.prototype.pivot = function(pivotRowIndex, pivotColumnIndex) {
      var matrix2 = this.matrix;
      var quotient = matrix2[pivotRowIndex][pivotColumnIndex];
      var lastRow = this.height - 1;
      var lastColumn = this.width - 1;
      var leavingBasicIndex = this.varIndexByRow[pivotRowIndex];
      var enteringBasicIndex = this.varIndexByCol[pivotColumnIndex];
      this.varIndexByRow[pivotRowIndex] = enteringBasicIndex;
      this.varIndexByCol[pivotColumnIndex] = leavingBasicIndex;
      this.rowByVarIndex[enteringBasicIndex] = pivotRowIndex;
      this.rowByVarIndex[leavingBasicIndex] = -1;
      this.colByVarIndex[enteringBasicIndex] = -1;
      this.colByVarIndex[leavingBasicIndex] = pivotColumnIndex;
      var pivotRow = matrix2[pivotRowIndex];
      var nNonZeroColumns = 0;
      for (var c = 0; c <= lastColumn; c++) {
        if (!(pivotRow[c] >= -1e-16 && pivotRow[c] <= 1e-16)) {
          pivotRow[c] /= quotient;
          nonZeroColumns[nNonZeroColumns] = c;
          nNonZeroColumns += 1;
        } else {
          pivotRow[c] = 0;
        }
      }
      pivotRow[pivotColumnIndex] = 1 / quotient;
      var coefficient, i, v0;
      var precision = this.precision;
      for (var r = 0; r <= lastRow; r++) {
        if (r !== pivotRowIndex) {
          if (!(matrix2[r][pivotColumnIndex] >= -1e-16 && matrix2[r][pivotColumnIndex] <= 1e-16)) {
            var row = matrix2[r];
            coefficient = row[pivotColumnIndex];
            if (!(coefficient >= -1e-16 && coefficient <= 1e-16)) {
              for (i = 0; i < nNonZeroColumns; i++) {
                c = nonZeroColumns[i];
                v0 = pivotRow[c];
                if (!(v0 >= -1e-16 && v0 <= 1e-16)) {
                  row[c] = row[c] - coefficient * v0;
                } else {
                  if (v0 !== 0) {
                    pivotRow[c] = 0;
                  }
                }
              }
              row[pivotColumnIndex] = -coefficient / quotient;
            } else {
              if (coefficient !== 0) {
                row[pivotColumnIndex] = 0;
              }
            }
          }
        }
      }
      var nOptionalObjectives = this.optionalObjectives.length;
      if (nOptionalObjectives > 0) {
        for (var o = 0; o < nOptionalObjectives; o += 1) {
          var reducedCosts = this.optionalObjectives[o].reducedCosts;
          coefficient = reducedCosts[pivotColumnIndex];
          if (coefficient !== 0) {
            for (i = 0; i < nNonZeroColumns; i++) {
              c = nonZeroColumns[i];
              v0 = pivotRow[c];
              if (v0 !== 0) {
                reducedCosts[c] = reducedCosts[c] - coefficient * v0;
              }
            }
            reducedCosts[pivotColumnIndex] = -coefficient / quotient;
          }
        }
      }
    };
    Tableau.prototype.checkForCycles = function(varIndexes) {
      for (var e1 = 0; e1 < varIndexes.length - 1; e1++) {
        for (var e2 = e1 + 1; e2 < varIndexes.length; e2++) {
          var elt1 = varIndexes[e1];
          var elt2 = varIndexes[e2];
          if (elt1[0] === elt2[0] && elt1[1] === elt2[1]) {
            if (e2 - e1 > varIndexes.length - e2) {
              break;
            }
            var cycleFound = true;
            for (var i = 1; i < e2 - e1; i++) {
              var tmp1 = varIndexes[e1 + i];
              var tmp2 = varIndexes[e2 + i];
              if (tmp1[0] !== tmp2[0] || tmp1[1] !== tmp2[1]) {
                cycleFound = false;
                break;
              }
            }
            if (cycleFound) {
              return [e1, e2 - e1];
            }
          }
        }
      }
      return [];
    };
  }
});

// node_modules/javascript-lp-solver/src/expressions.js
var require_expressions = __commonJS({
  "node_modules/javascript-lp-solver/src/expressions.js"(exports2, module2) {
    function Variable(id, cost, index, priority) {
      this.id = id;
      this.cost = cost;
      this.index = index;
      this.value = 0;
      this.priority = priority;
    }
    function IntegerVariable(id, cost, index, priority) {
      Variable.call(this, id, cost, index, priority);
    }
    IntegerVariable.prototype.isInteger = true;
    function SlackVariable(id, index) {
      Variable.call(this, id, 0, index, 0);
    }
    SlackVariable.prototype.isSlack = true;
    function Term(variable, coefficient) {
      this.variable = variable;
      this.coefficient = coefficient;
    }
    function createRelaxationVariable(model, weight, priority) {
      if (priority === 0 || priority === "required") {
        return null;
      }
      weight = weight || 1;
      priority = priority || 1;
      if (model.isMinimization === false) {
        weight = -weight;
      }
      return model.addVariable(weight, "r" + model.relaxationIndex++, false, false, priority);
    }
    function Constraint(rhs, isUpperBound, index, model) {
      this.slack = new SlackVariable("s" + index, index);
      this.index = index;
      this.model = model;
      this.rhs = rhs;
      this.isUpperBound = isUpperBound;
      this.terms = [];
      this.termsByVarIndex = {};
      this.relaxation = null;
    }
    Constraint.prototype.addTerm = function(coefficient, variable) {
      var varIndex = variable.index;
      var term = this.termsByVarIndex[varIndex];
      if (term === void 0) {
        term = new Term(variable, coefficient);
        this.termsByVarIndex[varIndex] = term;
        this.terms.push(term);
        if (this.isUpperBound === true) {
          coefficient = -coefficient;
        }
        this.model.updateConstraintCoefficient(this, variable, coefficient);
      } else {
        var newCoefficient = term.coefficient + coefficient;
        this.setVariableCoefficient(newCoefficient, variable);
      }
      return this;
    };
    Constraint.prototype.removeTerm = function(term) {
      return this;
    };
    Constraint.prototype.setRightHandSide = function(newRhs) {
      if (newRhs !== this.rhs) {
        var difference = newRhs - this.rhs;
        if (this.isUpperBound === true) {
          difference = -difference;
        }
        this.rhs = newRhs;
        this.model.updateRightHandSide(this, difference);
      }
      return this;
    };
    Constraint.prototype.setVariableCoefficient = function(newCoefficient, variable) {
      var varIndex = variable.index;
      if (varIndex === -1) {
        console.warn("[Constraint.setVariableCoefficient] Trying to change coefficient of inexistant variable.");
        return;
      }
      var term = this.termsByVarIndex[varIndex];
      if (term === void 0) {
        this.addTerm(newCoefficient, variable);
      } else {
        if (newCoefficient !== term.coefficient) {
          var difference = newCoefficient - term.coefficient;
          if (this.isUpperBound === true) {
            difference = -difference;
          }
          term.coefficient = newCoefficient;
          this.model.updateConstraintCoefficient(this, variable, difference);
        }
      }
      return this;
    };
    Constraint.prototype.relax = function(weight, priority) {
      this.relaxation = createRelaxationVariable(this.model, weight, priority);
      this._relax(this.relaxation);
    };
    Constraint.prototype._relax = function(relaxationVariable) {
      if (relaxationVariable === null) {
        return;
      }
      if (this.isUpperBound) {
        this.setVariableCoefficient(-1, relaxationVariable);
      } else {
        this.setVariableCoefficient(1, relaxationVariable);
      }
    };
    function Equality(constraintUpper, constraintLower) {
      this.upperBound = constraintUpper;
      this.lowerBound = constraintLower;
      this.model = constraintUpper.model;
      this.rhs = constraintUpper.rhs;
      this.relaxation = null;
    }
    Equality.prototype.isEquality = true;
    Equality.prototype.addTerm = function(coefficient, variable) {
      this.upperBound.addTerm(coefficient, variable);
      this.lowerBound.addTerm(coefficient, variable);
      return this;
    };
    Equality.prototype.removeTerm = function(term) {
      this.upperBound.removeTerm(term);
      this.lowerBound.removeTerm(term);
      return this;
    };
    Equality.prototype.setRightHandSide = function(rhs) {
      this.upperBound.setRightHandSide(rhs);
      this.lowerBound.setRightHandSide(rhs);
      this.rhs = rhs;
    };
    Equality.prototype.relax = function(weight, priority) {
      this.relaxation = createRelaxationVariable(this.model, weight, priority);
      this.upperBound.relaxation = this.relaxation;
      this.upperBound._relax(this.relaxation);
      this.lowerBound.relaxation = this.relaxation;
      this.lowerBound._relax(this.relaxation);
    };
    module2.exports = {
      Constraint,
      Variable,
      IntegerVariable,
      SlackVariable,
      Equality,
      Term
    };
  }
});

// node_modules/javascript-lp-solver/src/Tableau/cuttingStrategies.js
var require_cuttingStrategies = __commonJS({
  "node_modules/javascript-lp-solver/src/Tableau/cuttingStrategies.js"() {
    var Tableau = require_Tableau();
    var SlackVariable = require_expressions().SlackVariable;
    Tableau.prototype.addCutConstraints = function(cutConstraints) {
      var nCutConstraints = cutConstraints.length;
      var height = this.height;
      var heightWithCuts = height + nCutConstraints;
      for (var h = height; h < heightWithCuts; h += 1) {
        if (this.matrix[h] === void 0) {
          this.matrix[h] = this.matrix[h - 1].slice();
        }
      }
      this.height = heightWithCuts;
      this.nVars = this.width + this.height - 2;
      var c;
      var lastColumn = this.width - 1;
      for (var i = 0; i < nCutConstraints; i += 1) {
        var cut = cutConstraints[i];
        var r = height + i;
        var sign = cut.type === "min" ? -1 : 1;
        var varIndex = cut.varIndex;
        var varRowIndex = this.rowByVarIndex[varIndex];
        var constraintRow = this.matrix[r];
        if (varRowIndex === -1) {
          constraintRow[this.rhsColumn] = sign * cut.value;
          for (c = 1; c <= lastColumn; c += 1) {
            constraintRow[c] = 0;
          }
          constraintRow[this.colByVarIndex[varIndex]] = sign;
        } else {
          var varRow = this.matrix[varRowIndex];
          var varValue = varRow[this.rhsColumn];
          constraintRow[this.rhsColumn] = sign * (cut.value - varValue);
          for (c = 1; c <= lastColumn; c += 1) {
            constraintRow[c] = -sign * varRow[c];
          }
        }
        var slackVarIndex = this.getNewElementIndex();
        this.varIndexByRow[r] = slackVarIndex;
        this.rowByVarIndex[slackVarIndex] = r;
        this.colByVarIndex[slackVarIndex] = -1;
        this.variablesPerIndex[slackVarIndex] = new SlackVariable("s" + slackVarIndex, slackVarIndex);
        this.nVars += 1;
      }
    };
    Tableau.prototype._addLowerBoundMIRCut = function(rowIndex) {
      if (rowIndex === this.costRowIndex) {
        return false;
      }
      var model = this.model;
      var matrix2 = this.matrix;
      var intVar = this.variablesPerIndex[this.varIndexByRow[rowIndex]];
      if (!intVar.isInteger) {
        return false;
      }
      var d = matrix2[rowIndex][this.rhsColumn];
      var frac_d = d - Math.floor(d);
      if (frac_d < this.precision || 1 - this.precision < frac_d) {
        return false;
      }
      var r = this.height;
      matrix2[r] = matrix2[r - 1].slice();
      this.height += 1;
      this.nVars += 1;
      var slackVarIndex = this.getNewElementIndex();
      this.varIndexByRow[r] = slackVarIndex;
      this.rowByVarIndex[slackVarIndex] = r;
      this.colByVarIndex[slackVarIndex] = -1;
      this.variablesPerIndex[slackVarIndex] = new SlackVariable("s" + slackVarIndex, slackVarIndex);
      matrix2[r][this.rhsColumn] = Math.floor(d);
      for (var colIndex = 1; colIndex < this.varIndexByCol.length; colIndex += 1) {
        var variable = this.variablesPerIndex[this.varIndexByCol[colIndex]];
        if (!variable.isInteger) {
          matrix2[r][colIndex] = Math.min(0, matrix2[rowIndex][colIndex] / (1 - frac_d));
        } else {
          var coef = matrix2[rowIndex][colIndex];
          var termCoeff = Math.floor(coef) + Math.max(0, coef - Math.floor(coef) - frac_d) / (1 - frac_d);
          matrix2[r][colIndex] = termCoeff;
        }
      }
      for (var c = 0; c < this.width; c += 1) {
        matrix2[r][c] -= matrix2[rowIndex][c];
      }
      return true;
    };
    Tableau.prototype._addUpperBoundMIRCut = function(rowIndex) {
      if (rowIndex === this.costRowIndex) {
        return false;
      }
      var model = this.model;
      var matrix2 = this.matrix;
      var intVar = this.variablesPerIndex[this.varIndexByRow[rowIndex]];
      if (!intVar.isInteger) {
        return false;
      }
      var b = matrix2[rowIndex][this.rhsColumn];
      var f = b - Math.floor(b);
      if (f < this.precision || 1 - this.precision < f) {
        return false;
      }
      var r = this.height;
      matrix2[r] = matrix2[r - 1].slice();
      this.height += 1;
      this.nVars += 1;
      var slackVarIndex = this.getNewElementIndex();
      this.varIndexByRow[r] = slackVarIndex;
      this.rowByVarIndex[slackVarIndex] = r;
      this.colByVarIndex[slackVarIndex] = -1;
      this.variablesPerIndex[slackVarIndex] = new SlackVariable("s" + slackVarIndex, slackVarIndex);
      matrix2[r][this.rhsColumn] = -f;
      for (var colIndex = 1; colIndex < this.varIndexByCol.length; colIndex += 1) {
        var variable = this.variablesPerIndex[this.varIndexByCol[colIndex]];
        var aj = matrix2[rowIndex][colIndex];
        var fj = aj - Math.floor(aj);
        if (variable.isInteger) {
          if (fj <= f) {
            matrix2[r][colIndex] = -fj;
          } else {
            matrix2[r][colIndex] = -(1 - fj) * f / fj;
          }
        } else {
          if (aj >= 0) {
            matrix2[r][colIndex] = -aj;
          } else {
            matrix2[r][colIndex] = aj * f / (1 - f);
          }
        }
      }
      return true;
    };
    Tableau.prototype.applyMIRCuts = function() {
    };
  }
});

// node_modules/javascript-lp-solver/src/Tableau/dynamicModification.js
var require_dynamicModification = __commonJS({
  "node_modules/javascript-lp-solver/src/Tableau/dynamicModification.js"() {
    var Tableau = require_Tableau();
    Tableau.prototype._putInBase = function(varIndex) {
      var r = this.rowByVarIndex[varIndex];
      if (r === -1) {
        var c = this.colByVarIndex[varIndex];
        for (var r1 = 1; r1 < this.height; r1 += 1) {
          var coefficient = this.matrix[r1][c];
          if (coefficient < -this.precision || this.precision < coefficient) {
            r = r1;
            break;
          }
        }
        this.pivot(r, c);
      }
      return r;
    };
    Tableau.prototype._takeOutOfBase = function(varIndex) {
      var c = this.colByVarIndex[varIndex];
      if (c === -1) {
        var r = this.rowByVarIndex[varIndex];
        var pivotRow = this.matrix[r];
        for (var c1 = 1; c1 < this.height; c1 += 1) {
          var coefficient = pivotRow[c1];
          if (coefficient < -this.precision || this.precision < coefficient) {
            c = c1;
            break;
          }
        }
        this.pivot(r, c);
      }
      return c;
    };
    Tableau.prototype.updateVariableValues = function() {
      var nVars = this.variables.length;
      var roundingCoeff = Math.round(1 / this.precision);
      for (var v = 0; v < nVars; v += 1) {
        var variable = this.variables[v];
        var varIndex = variable.index;
        var r = this.rowByVarIndex[varIndex];
        if (r === -1) {
          variable.value = 0;
        } else {
          var varValue = this.matrix[r][this.rhsColumn];
          variable.value = Math.round((varValue + Number.EPSILON) * roundingCoeff) / roundingCoeff;
        }
      }
    };
    Tableau.prototype.updateRightHandSide = function(constraint, difference) {
      var lastRow = this.height - 1;
      var constraintRow = this.rowByVarIndex[constraint.index];
      if (constraintRow === -1) {
        var slackColumn = this.colByVarIndex[constraint.index];
        for (var r = 0; r <= lastRow; r += 1) {
          var row = this.matrix[r];
          row[this.rhsColumn] -= difference * row[slackColumn];
        }
        var nOptionalObjectives = this.optionalObjectives.length;
        if (nOptionalObjectives > 0) {
          for (var o = 0; o < nOptionalObjectives; o += 1) {
            var reducedCosts = this.optionalObjectives[o].reducedCosts;
            reducedCosts[this.rhsColumn] -= difference * reducedCosts[slackColumn];
          }
        }
      } else {
        this.matrix[constraintRow][this.rhsColumn] -= difference;
      }
    };
    Tableau.prototype.updateConstraintCoefficient = function(constraint, variable, difference) {
      if (constraint.index === variable.index) {
        throw new Error("[Tableau.updateConstraintCoefficient] constraint index should not be equal to variable index !");
      }
      var r = this._putInBase(constraint.index);
      var colVar = this.colByVarIndex[variable.index];
      if (colVar === -1) {
        var rowVar = this.rowByVarIndex[variable.index];
        for (var c = 0; c < this.width; c += 1) {
          this.matrix[r][c] += difference * this.matrix[rowVar][c];
        }
      } else {
        this.matrix[r][colVar] -= difference;
      }
    };
    Tableau.prototype.updateCost = function(variable, difference) {
      var varIndex = variable.index;
      var lastColumn = this.width - 1;
      var varColumn = this.colByVarIndex[varIndex];
      if (varColumn === -1) {
        var variableRow = this.matrix[this.rowByVarIndex[varIndex]];
        var c;
        if (variable.priority === 0) {
          var costRow = this.matrix[0];
          for (c = 0; c <= lastColumn; c += 1) {
            costRow[c] += difference * variableRow[c];
          }
        } else {
          var reducedCosts = this.objectivesByPriority[variable.priority].reducedCosts;
          for (c = 0; c <= lastColumn; c += 1) {
            reducedCosts[c] += difference * variableRow[c];
          }
        }
      } else {
        this.matrix[0][varColumn] -= difference;
      }
    };
    Tableau.prototype.addConstraint = function(constraint) {
      var sign = constraint.isUpperBound ? 1 : -1;
      var lastRow = this.height;
      var constraintRow = this.matrix[lastRow];
      if (constraintRow === void 0) {
        constraintRow = this.matrix[0].slice();
        this.matrix[lastRow] = constraintRow;
      }
      var lastColumn = this.width - 1;
      for (var c = 0; c <= lastColumn; c += 1) {
        constraintRow[c] = 0;
      }
      constraintRow[this.rhsColumn] = sign * constraint.rhs;
      var terms = constraint.terms;
      var nTerms = terms.length;
      for (var t = 0; t < nTerms; t += 1) {
        var term = terms[t];
        var coefficient = term.coefficient;
        var varIndex = term.variable.index;
        var varRowIndex = this.rowByVarIndex[varIndex];
        if (varRowIndex === -1) {
          constraintRow[this.colByVarIndex[varIndex]] += sign * coefficient;
        } else {
          var varRow = this.matrix[varRowIndex];
          var varValue = varRow[this.rhsColumn];
          for (c = 0; c <= lastColumn; c += 1) {
            constraintRow[c] -= sign * coefficient * varRow[c];
          }
        }
      }
      var slackIndex = constraint.index;
      this.varIndexByRow[lastRow] = slackIndex;
      this.rowByVarIndex[slackIndex] = lastRow;
      this.colByVarIndex[slackIndex] = -1;
      this.height += 1;
    };
    Tableau.prototype.removeConstraint = function(constraint) {
      var slackIndex = constraint.index;
      var lastRow = this.height - 1;
      var r = this._putInBase(slackIndex);
      var tmpRow = this.matrix[lastRow];
      this.matrix[lastRow] = this.matrix[r];
      this.matrix[r] = tmpRow;
      this.varIndexByRow[r] = this.varIndexByRow[lastRow];
      this.varIndexByRow[lastRow] = -1;
      this.rowByVarIndex[slackIndex] = -1;
      this.availableIndexes[this.availableIndexes.length] = slackIndex;
      constraint.slack.index = -1;
      this.height -= 1;
    };
    Tableau.prototype.addVariable = function(variable) {
      var lastRow = this.height - 1;
      var lastColumn = this.width;
      var cost = this.model.isMinimization === true ? -variable.cost : variable.cost;
      var priority = variable.priority;
      var nOptionalObjectives = this.optionalObjectives.length;
      if (nOptionalObjectives > 0) {
        for (var o = 0; o < nOptionalObjectives; o += 1) {
          this.optionalObjectives[o].reducedCosts[lastColumn] = 0;
        }
      }
      if (priority === 0) {
        this.matrix[0][lastColumn] = cost;
      } else {
        this.setOptionalObjective(priority, lastColumn, cost);
        this.matrix[0][lastColumn] = 0;
      }
      for (var r = 1; r <= lastRow; r += 1) {
        this.matrix[r][lastColumn] = 0;
      }
      var varIndex = variable.index;
      this.varIndexByCol[lastColumn] = varIndex;
      this.rowByVarIndex[varIndex] = -1;
      this.colByVarIndex[varIndex] = lastColumn;
      this.width += 1;
    };
    Tableau.prototype.removeVariable = function(variable) {
      var varIndex = variable.index;
      var c = this._takeOutOfBase(varIndex);
      var lastColumn = this.width - 1;
      if (c !== lastColumn) {
        var lastRow = this.height - 1;
        for (var r = 0; r <= lastRow; r += 1) {
          var row = this.matrix[r];
          row[c] = row[lastColumn];
        }
        var nOptionalObjectives = this.optionalObjectives.length;
        if (nOptionalObjectives > 0) {
          for (var o = 0; o < nOptionalObjectives; o += 1) {
            var reducedCosts = this.optionalObjectives[o].reducedCosts;
            reducedCosts[c] = reducedCosts[lastColumn];
          }
        }
        var switchVarIndex = this.varIndexByCol[lastColumn];
        this.varIndexByCol[c] = switchVarIndex;
        this.colByVarIndex[switchVarIndex] = c;
      }
      this.varIndexByCol[lastColumn] = -1;
      this.colByVarIndex[varIndex] = -1;
      this.availableIndexes[this.availableIndexes.length] = varIndex;
      variable.index = -1;
      this.width -= 1;
    };
  }
});

// node_modules/javascript-lp-solver/src/Tableau/log.js
var require_log = __commonJS({
  "node_modules/javascript-lp-solver/src/Tableau/log.js"() {
    var Tableau = require_Tableau();
    Tableau.prototype.log = function(message, force) {
      if (false) {
        return;
      }
      console.log("****", message, "****");
      console.log("Nb Variables", this.width - 1);
      console.log("Nb Constraints", this.height - 1);
      console.log("Basic Indexes", this.varIndexByRow);
      console.log("Non Basic Indexes", this.varIndexByCol);
      console.log("Rows", this.rowByVarIndex);
      console.log("Cols", this.colByVarIndex);
      var digitPrecision = 5;
      var varNameRowString = "", spacePerColumn = [" "], j, c, s, r, variable, varIndex, varName, varNameLength, nSpaces, valueSpace, nameSpace;
      var row, rowString;
      for (c = 1; c < this.width; c += 1) {
        varIndex = this.varIndexByCol[c];
        variable = this.variablesPerIndex[varIndex];
        if (variable === void 0) {
          varName = "c" + varIndex;
        } else {
          varName = variable.id;
        }
        varNameLength = varName.length;
        nSpaces = Math.abs(varNameLength - 5);
        valueSpace = " ";
        nameSpace = "	";
        if (varNameLength > 5) {
          valueSpace += " ";
        } else {
          nameSpace += "	";
        }
        spacePerColumn[c] = valueSpace;
        varNameRowString += nameSpace + varName;
      }
      console.log(varNameRowString);
      var signSpace;
      var firstRow = this.matrix[this.costRowIndex];
      var firstRowString = "	";
      for (j = 1; j < this.width; j += 1) {
        signSpace = "	";
        firstRowString += signSpace;
        firstRowString += spacePerColumn[j];
        firstRowString += firstRow[j].toFixed(digitPrecision);
      }
      signSpace = "	";
      firstRowString += signSpace + spacePerColumn[0] + firstRow[0].toFixed(digitPrecision);
      console.log(firstRowString + "	Z");
      for (r = 1; r < this.height; r += 1) {
        row = this.matrix[r];
        rowString = "	";
        for (c = 1; c < this.width; c += 1) {
          signSpace = "	";
          rowString += signSpace + spacePerColumn[c] + row[c].toFixed(digitPrecision);
        }
        signSpace = "	";
        rowString += signSpace + spacePerColumn[0] + row[0].toFixed(digitPrecision);
        varIndex = this.varIndexByRow[r];
        variable = this.variablesPerIndex[varIndex];
        if (variable === void 0) {
          varName = "c" + varIndex;
        } else {
          varName = variable.id;
        }
        console.log(rowString + "	" + varName);
      }
      console.log("");
      var nOptionalObjectives = this.optionalObjectives.length;
      if (nOptionalObjectives > 0) {
        console.log("    Optional objectives:");
        for (var o = 0; o < nOptionalObjectives; o += 1) {
          var reducedCosts = this.optionalObjectives[o].reducedCosts;
          var reducedCostsString = "";
          for (j = 1; j < this.width; j += 1) {
            signSpace = reducedCosts[j] < 0 ? "" : " ";
            reducedCostsString += signSpace;
            reducedCostsString += spacePerColumn[j];
            reducedCostsString += reducedCosts[j].toFixed(digitPrecision);
          }
          signSpace = reducedCosts[0] < 0 ? "" : " ";
          reducedCostsString += signSpace + spacePerColumn[0] + reducedCosts[0].toFixed(digitPrecision);
          console.log(reducedCostsString + " z" + o);
        }
      }
      console.log("Feasible?", this.feasible);
      console.log("evaluation", this.evaluation);
      return this;
    };
  }
});

// node_modules/javascript-lp-solver/src/Tableau/backup.js
var require_backup = __commonJS({
  "node_modules/javascript-lp-solver/src/Tableau/backup.js"() {
    var Tableau = require_Tableau();
    Tableau.prototype.copy = function() {
      var copy = new Tableau(this.precision);
      copy.width = this.width;
      copy.height = this.height;
      copy.nVars = this.nVars;
      copy.model = this.model;
      copy.variables = this.variables;
      copy.variablesPerIndex = this.variablesPerIndex;
      copy.unrestrictedVars = this.unrestrictedVars;
      copy.lastElementIndex = this.lastElementIndex;
      copy.varIndexByRow = this.varIndexByRow.slice();
      copy.varIndexByCol = this.varIndexByCol.slice();
      copy.rowByVarIndex = this.rowByVarIndex.slice();
      copy.colByVarIndex = this.colByVarIndex.slice();
      copy.availableIndexes = this.availableIndexes.slice();
      var optionalObjectivesCopy = [];
      for (var o = 0; o < this.optionalObjectives.length; o++) {
        optionalObjectivesCopy[o] = this.optionalObjectives[o].copy();
      }
      copy.optionalObjectives = optionalObjectivesCopy;
      var matrix2 = this.matrix;
      var matrixCopy = new Array(this.height);
      for (var r = 0; r < this.height; r++) {
        matrixCopy[r] = matrix2[r].slice();
      }
      copy.matrix = matrixCopy;
      return copy;
    };
    Tableau.prototype.save = function() {
      this.savedState = this.copy();
    };
    Tableau.prototype.restore = function() {
      if (this.savedState === null) {
        return;
      }
      var save = this.savedState;
      var savedMatrix = save.matrix;
      this.nVars = save.nVars;
      this.model = save.model;
      this.variables = save.variables;
      this.variablesPerIndex = save.variablesPerIndex;
      this.unrestrictedVars = save.unrestrictedVars;
      this.lastElementIndex = save.lastElementIndex;
      this.width = save.width;
      this.height = save.height;
      var r, c;
      for (r = 0; r < this.height; r += 1) {
        var savedRow = savedMatrix[r];
        var row = this.matrix[r];
        for (c = 0; c < this.width; c += 1) {
          row[c] = savedRow[c];
        }
      }
      var savedBasicIndexes = save.varIndexByRow;
      for (c = 0; c < this.height; c += 1) {
        this.varIndexByRow[c] = savedBasicIndexes[c];
      }
      while (this.varIndexByRow.length > this.height) {
        this.varIndexByRow.pop();
      }
      var savedNonBasicIndexes = save.varIndexByCol;
      for (r = 0; r < this.width; r += 1) {
        this.varIndexByCol[r] = savedNonBasicIndexes[r];
      }
      while (this.varIndexByCol.length > this.width) {
        this.varIndexByCol.pop();
      }
      var savedRows = save.rowByVarIndex;
      var savedCols = save.colByVarIndex;
      for (var v = 0; v < this.nVars; v += 1) {
        this.rowByVarIndex[v] = savedRows[v];
        this.colByVarIndex[v] = savedCols[v];
      }
      if (save.optionalObjectives.length > 0 && this.optionalObjectives.length > 0) {
        this.optionalObjectives = [];
        this.optionalObjectivePerPriority = {};
        for (var o = 0; o < save.optionalObjectives.length; o++) {
          var optionalObjectiveCopy = save.optionalObjectives[o].copy();
          this.optionalObjectives[o] = optionalObjectiveCopy;
          this.optionalObjectivePerPriority[optionalObjectiveCopy.priority] = optionalObjectiveCopy;
        }
      }
    };
  }
});

// node_modules/javascript-lp-solver/src/Tableau/branchingStrategies.js
var require_branchingStrategies = __commonJS({
  "node_modules/javascript-lp-solver/src/Tableau/branchingStrategies.js"() {
    var Tableau = require_Tableau();
    function VariableData(index, value) {
      this.index = index;
      this.value = value;
    }
    Tableau.prototype.getMostFractionalVar = function() {
      var biggestFraction = 0;
      var selectedVarIndex = null;
      var selectedVarValue = null;
      var mid = 0.5;
      var integerVariables = this.model.integerVariables;
      var nIntegerVars = integerVariables.length;
      for (var v = 0; v < nIntegerVars; v++) {
        var varIndex = integerVariables[v].index;
        var varRow = this.rowByVarIndex[varIndex];
        if (varRow === -1) {
          continue;
        }
        var varValue = this.matrix[varRow][this.rhsColumn];
        var fraction = Math.abs(varValue - Math.round(varValue));
        if (biggestFraction < fraction) {
          biggestFraction = fraction;
          selectedVarIndex = varIndex;
          selectedVarValue = varValue;
        }
      }
      return new VariableData(selectedVarIndex, selectedVarValue);
    };
    Tableau.prototype.getFractionalVarWithLowestCost = function() {
      var highestCost = Infinity;
      var selectedVarIndex = null;
      var selectedVarValue = null;
      var integerVariables = this.model.integerVariables;
      var nIntegerVars = integerVariables.length;
      for (var v = 0; v < nIntegerVars; v++) {
        var variable = integerVariables[v];
        var varIndex = variable.index;
        var varRow = this.rowByVarIndex[varIndex];
        if (varRow === -1) {
          continue;
        }
        var varValue = this.matrix[varRow][this.rhsColumn];
        if (Math.abs(varValue - Math.round(varValue)) > this.precision) {
          var cost = variable.cost;
          if (highestCost > cost) {
            highestCost = cost;
            selectedVarIndex = varIndex;
            selectedVarValue = varValue;
          }
        }
      }
      return new VariableData(selectedVarIndex, selectedVarValue);
    };
  }
});

// node_modules/javascript-lp-solver/src/Tableau/integerProperties.js
var require_integerProperties = __commonJS({
  "node_modules/javascript-lp-solver/src/Tableau/integerProperties.js"() {
    var Tableau = require_Tableau();
    Tableau.prototype.countIntegerValues = function() {
      var count = 0;
      for (var r = 1; r < this.height; r += 1) {
        if (this.variablesPerIndex[this.varIndexByRow[r]].isInteger) {
          var decimalPart = this.matrix[r][this.rhsColumn];
          decimalPart = decimalPart - Math.floor(decimalPart);
          if (decimalPart < this.precision && -decimalPart < this.precision) {
            count += 1;
          }
        }
      }
      return count;
    };
    Tableau.prototype.isIntegral = function() {
      var integerVariables = this.model.integerVariables;
      var nIntegerVars = integerVariables.length;
      for (var v = 0; v < nIntegerVars; v++) {
        var varRow = this.rowByVarIndex[integerVariables[v].index];
        if (varRow === -1) {
          continue;
        }
        var varValue = this.matrix[varRow][this.rhsColumn];
        if (Math.abs(varValue - Math.round(varValue)) > this.precision) {
          return false;
        }
      }
      return true;
    };
    Tableau.prototype.computeFractionalVolume = function(ignoreIntegerValues) {
      var volume = -1;
      for (var r = 1; r < this.height; r += 1) {
        if (this.variablesPerIndex[this.varIndexByRow[r]].isInteger) {
          var rhs = this.matrix[r][this.rhsColumn];
          rhs = Math.abs(rhs);
          var decimalPart = Math.min(rhs - Math.floor(rhs), Math.floor(rhs + 1));
          if (decimalPart < this.precision) {
            if (!ignoreIntegerValues) {
              return 0;
            }
          } else {
            if (volume === -1) {
              volume = rhs;
            } else {
              volume *= rhs;
            }
          }
        }
      }
      if (volume === -1) {
        return 0;
      }
      return volume;
    };
  }
});

// node_modules/javascript-lp-solver/src/Tableau/index.js
var require_Tableau2 = __commonJS({
  "node_modules/javascript-lp-solver/src/Tableau/index.js"(exports2, module2) {
    require_simplex();
    require_cuttingStrategies();
    require_dynamicModification();
    require_log();
    require_backup();
    require_branchingStrategies();
    require_integerProperties();
    module2.exports = require_Tableau();
  }
});

// node_modules/javascript-lp-solver/src/Tableau/branchAndCut.js
var require_branchAndCut = __commonJS({
  "node_modules/javascript-lp-solver/src/Tableau/branchAndCut.js"() {
    var Tableau = require_Tableau();
    function Cut(type, varIndex, value) {
      this.type = type;
      this.varIndex = varIndex;
      this.value = value;
    }
    function Branch(relaxedEvaluation, cuts) {
      this.relaxedEvaluation = relaxedEvaluation;
      this.cuts = cuts;
    }
    function sortByEvaluation(a, b) {
      return b.relaxedEvaluation - a.relaxedEvaluation;
    }
    Tableau.prototype.applyCuts = function(branchingCuts) {
      this.restore();
      this.addCutConstraints(branchingCuts);
      this.simplex();
      if (this.model.useMIRCuts) {
        var fractionalVolumeImproved = true;
        while (fractionalVolumeImproved) {
          var fractionalVolumeBefore = this.computeFractionalVolume(true);
          this.applyMIRCuts();
          this.simplex();
          var fractionalVolumeAfter = this.computeFractionalVolume(true);
          if (fractionalVolumeAfter >= 0.9 * fractionalVolumeBefore) {
            fractionalVolumeImproved = false;
          }
        }
      }
    };
    Tableau.prototype.branchAndCut = function() {
      var branches = [];
      var iterations = 0;
      var tolerance = this.model.tolerance;
      var toleranceFlag = true;
      var terminalTime = 1e99;
      if (this.model.timeout) {
        terminalTime = Date.now() + this.model.timeout;
      }
      var bestEvaluation = Infinity;
      var bestBranch = null;
      var bestOptionalObjectivesEvaluations = [];
      for (var oInit = 0; oInit < this.optionalObjectives.length; oInit += 1) {
        bestOptionalObjectivesEvaluations.push(Infinity);
      }
      var branch = new Branch(-Infinity, []);
      var acceptableThreshold;
      branches.push(branch);
      while (branches.length > 0 && toleranceFlag === true && Date.now() < terminalTime) {
        if (this.model.isMinimization) {
          acceptableThreshold = this.bestPossibleEval * (1 + tolerance);
        } else {
          acceptableThreshold = this.bestPossibleEval * (1 - tolerance);
        }
        if (tolerance > 0) {
          if (bestEvaluation < acceptableThreshold) {
            toleranceFlag = false;
          }
        }
        branch = branches.pop();
        if (branch.relaxedEvaluation > bestEvaluation) {
          continue;
        }
        var cuts = branch.cuts;
        this.applyCuts(cuts);
        iterations++;
        if (this.feasible === false) {
          continue;
        }
        var evaluation = this.evaluation;
        if (evaluation > bestEvaluation) {
          continue;
        }
        if (evaluation === bestEvaluation) {
          var isCurrentEvaluationWorse = true;
          for (var o = 0; o < this.optionalObjectives.length; o += 1) {
            if (this.optionalObjectives[o].reducedCosts[0] > bestOptionalObjectivesEvaluations[o]) {
              break;
            } else if (this.optionalObjectives[o].reducedCosts[0] < bestOptionalObjectivesEvaluations[o]) {
              isCurrentEvaluationWorse = false;
              break;
            }
          }
          if (isCurrentEvaluationWorse) {
            continue;
          }
        }
        if (this.isIntegral() === true) {
          this.__isIntegral = true;
          if (iterations === 1) {
            this.branchAndCutIterations = iterations;
            return;
          }
          bestBranch = branch;
          bestEvaluation = evaluation;
          for (var oCopy = 0; oCopy < this.optionalObjectives.length; oCopy += 1) {
            bestOptionalObjectivesEvaluations[oCopy] = this.optionalObjectives[oCopy].reducedCosts[0];
          }
        } else {
          if (iterations === 1) {
            this.save();
          }
          var variable = this.getMostFractionalVar();
          var varIndex = variable.index;
          var cutsHigh = [];
          var cutsLow = [];
          var nCuts = cuts.length;
          for (var c = 0; c < nCuts; c += 1) {
            var cut = cuts[c];
            if (cut.varIndex === varIndex) {
              if (cut.type === "min") {
                cutsLow.push(cut);
              } else {
                cutsHigh.push(cut);
              }
            } else {
              cutsHigh.push(cut);
              cutsLow.push(cut);
            }
          }
          var min = Math.ceil(variable.value);
          var max = Math.floor(variable.value);
          var cutHigh = new Cut("min", varIndex, min);
          cutsHigh.push(cutHigh);
          var cutLow = new Cut("max", varIndex, max);
          cutsLow.push(cutLow);
          branches.push(new Branch(evaluation, cutsHigh));
          branches.push(new Branch(evaluation, cutsLow));
          branches.sort(sortByEvaluation);
        }
      }
      if (bestBranch !== null) {
        this.applyCuts(bestBranch.cuts);
      }
      this.branchAndCutIterations = iterations;
    };
  }
});

// node_modules/javascript-lp-solver/src/Model.js
var require_Model = __commonJS({
  "node_modules/javascript-lp-solver/src/Model.js"(exports2, module2) {
    var Tableau = require_Tableau();
    var branchAndCut = require_branchAndCut();
    var expressions = require_expressions();
    var Constraint = expressions.Constraint;
    var Equality = expressions.Equality;
    var Variable = expressions.Variable;
    var IntegerVariable = expressions.IntegerVariable;
    var Term = expressions.Term;
    function Model(precision, name) {
      this.tableau = new Tableau(precision);
      this.name = name;
      this.variables = [];
      this.integerVariables = [];
      this.unrestrictedVariables = {};
      this.constraints = [];
      this.nConstraints = 0;
      this.nVariables = 0;
      this.isMinimization = true;
      this.tableauInitialized = false;
      this.relaxationIndex = 1;
      this.useMIRCuts = false;
      this.checkForCycles = true;
      this.messages = [];
    }
    module2.exports = Model;
    Model.prototype.minimize = function() {
      this.isMinimization = true;
      return this;
    };
    Model.prototype.maximize = function() {
      this.isMinimization = false;
      return this;
    };
    Model.prototype._getNewElementIndex = function() {
      if (this.availableIndexes.length > 0) {
        return this.availableIndexes.pop();
      }
      var index = this.lastElementIndex;
      this.lastElementIndex += 1;
      return index;
    };
    Model.prototype._addConstraint = function(constraint) {
      var slackVariable = constraint.slack;
      this.tableau.variablesPerIndex[slackVariable.index] = slackVariable;
      this.constraints.push(constraint);
      this.nConstraints += 1;
      if (this.tableauInitialized === true) {
        this.tableau.addConstraint(constraint);
      }
    };
    Model.prototype.smallerThan = function(rhs) {
      var constraint = new Constraint(rhs, true, this.tableau.getNewElementIndex(), this);
      this._addConstraint(constraint);
      return constraint;
    };
    Model.prototype.greaterThan = function(rhs) {
      var constraint = new Constraint(rhs, false, this.tableau.getNewElementIndex(), this);
      this._addConstraint(constraint);
      return constraint;
    };
    Model.prototype.equal = function(rhs) {
      var constraintUpper = new Constraint(rhs, true, this.tableau.getNewElementIndex(), this);
      this._addConstraint(constraintUpper);
      var constraintLower = new Constraint(rhs, false, this.tableau.getNewElementIndex(), this);
      this._addConstraint(constraintLower);
      return new Equality(constraintUpper, constraintLower);
    };
    Model.prototype.addVariable = function(cost, id, isInteger, isUnrestricted, priority) {
      if (typeof priority === "string") {
        switch (priority) {
          case "required":
            priority = 0;
            break;
          case "strong":
            priority = 1;
            break;
          case "medium":
            priority = 2;
            break;
          case "weak":
            priority = 3;
            break;
          default:
            priority = 0;
            break;
        }
      }
      var varIndex = this.tableau.getNewElementIndex();
      if (id === null || id === void 0) {
        id = "v" + varIndex;
      }
      if (cost === null || cost === void 0) {
        cost = 0;
      }
      if (priority === null || priority === void 0) {
        priority = 0;
      }
      var variable;
      if (isInteger) {
        variable = new IntegerVariable(id, cost, varIndex, priority);
        this.integerVariables.push(variable);
      } else {
        variable = new Variable(id, cost, varIndex, priority);
      }
      this.variables.push(variable);
      this.tableau.variablesPerIndex[varIndex] = variable;
      if (isUnrestricted) {
        this.unrestrictedVariables[varIndex] = true;
      }
      this.nVariables += 1;
      if (this.tableauInitialized === true) {
        this.tableau.addVariable(variable);
      }
      return variable;
    };
    Model.prototype._removeConstraint = function(constraint) {
      var idx = this.constraints.indexOf(constraint);
      if (idx === -1) {
        console.warn("[Model.removeConstraint] Constraint not present in model");
        return;
      }
      this.constraints.splice(idx, 1);
      this.nConstraints -= 1;
      if (this.tableauInitialized === true) {
        this.tableau.removeConstraint(constraint);
      }
      if (constraint.relaxation) {
        this.removeVariable(constraint.relaxation);
      }
    };
    Model.prototype.removeConstraint = function(constraint) {
      if (constraint.isEquality) {
        this._removeConstraint(constraint.upperBound);
        this._removeConstraint(constraint.lowerBound);
      } else {
        this._removeConstraint(constraint);
      }
      return this;
    };
    Model.prototype.removeVariable = function(variable) {
      var idx = this.variables.indexOf(variable);
      if (idx === -1) {
        console.warn("[Model.removeVariable] Variable not present in model");
        return;
      }
      this.variables.splice(idx, 1);
      if (this.tableauInitialized === true) {
        this.tableau.removeVariable(variable);
      }
      return this;
    };
    Model.prototype.updateRightHandSide = function(constraint, difference) {
      if (this.tableauInitialized === true) {
        this.tableau.updateRightHandSide(constraint, difference);
      }
      return this;
    };
    Model.prototype.updateConstraintCoefficient = function(constraint, variable, difference) {
      if (this.tableauInitialized === true) {
        this.tableau.updateConstraintCoefficient(constraint, variable, difference);
      }
      return this;
    };
    Model.prototype.setCost = function(cost, variable) {
      var difference = cost - variable.cost;
      if (this.isMinimization === false) {
        difference = -difference;
      }
      variable.cost = cost;
      this.tableau.updateCost(variable, difference);
      return this;
    };
    Model.prototype.loadJson = function(jsonModel) {
      this.isMinimization = jsonModel.opType !== "max";
      var variables = jsonModel.variables;
      var constraints = jsonModel.constraints;
      var constraintsMin = {};
      var constraintsMax = {};
      var constraintIds = Object.keys(constraints);
      var nConstraintIds = constraintIds.length;
      for (var c = 0; c < nConstraintIds; c += 1) {
        var constraintId = constraintIds[c];
        var constraint = constraints[constraintId];
        var equal = constraint.equal;
        var weight = constraint.weight;
        var priority = constraint.priority;
        var relaxed = weight !== void 0 || priority !== void 0;
        var lowerBound, upperBound;
        if (equal === void 0) {
          var min = constraint.min;
          if (min !== void 0) {
            lowerBound = this.greaterThan(min);
            constraintsMin[constraintId] = lowerBound;
            if (relaxed) {
              lowerBound.relax(weight, priority);
            }
          }
          var max = constraint.max;
          if (max !== void 0) {
            upperBound = this.smallerThan(max);
            constraintsMax[constraintId] = upperBound;
            if (relaxed) {
              upperBound.relax(weight, priority);
            }
          }
        } else {
          lowerBound = this.greaterThan(equal);
          constraintsMin[constraintId] = lowerBound;
          upperBound = this.smallerThan(equal);
          constraintsMax[constraintId] = upperBound;
          var equality = new Equality(lowerBound, upperBound);
          if (relaxed) {
            equality.relax(weight, priority);
          }
        }
      }
      var variableIds = Object.keys(variables);
      var nVariables = variableIds.length;
      this.tolerance = jsonModel.tolerance || 0;
      if (jsonModel.timeout) {
        this.timeout = jsonModel.timeout;
      }
      if (jsonModel.options) {
        if (jsonModel.options.timeout) {
          this.timeout = jsonModel.options.timeout;
        }
        if (this.tolerance === 0) {
          this.tolerance = jsonModel.options.tolerance || 0;
        }
        if (jsonModel.options.useMIRCuts) {
          this.useMIRCuts = jsonModel.options.useMIRCuts;
        }
        if (typeof jsonModel.options.exitOnCycles === "undefined") {
          this.checkForCycles = true;
        } else {
          this.checkForCycles = jsonModel.options.exitOnCycles;
        }
      }
      var integerVarIds = jsonModel.ints || {};
      var binaryVarIds = jsonModel.binaries || {};
      var unrestrictedVarIds = jsonModel.unrestricted || {};
      var objectiveName = jsonModel.optimize;
      for (var v = 0; v < nVariables; v += 1) {
        var variableId = variableIds[v];
        var variableConstraints = variables[variableId];
        var cost = variableConstraints[objectiveName] || 0;
        var isBinary = !!binaryVarIds[variableId];
        var isInteger = !!integerVarIds[variableId] || isBinary;
        var isUnrestricted = !!unrestrictedVarIds[variableId];
        var variable = this.addVariable(cost, variableId, isInteger, isUnrestricted);
        if (isBinary) {
          this.smallerThan(1).addTerm(1, variable);
        }
        var constraintNames = Object.keys(variableConstraints);
        for (c = 0; c < constraintNames.length; c += 1) {
          var constraintName = constraintNames[c];
          if (constraintName === objectiveName) {
            continue;
          }
          var coefficient = variableConstraints[constraintName];
          var constraintMin = constraintsMin[constraintName];
          if (constraintMin !== void 0) {
            constraintMin.addTerm(coefficient, variable);
          }
          var constraintMax = constraintsMax[constraintName];
          if (constraintMax !== void 0) {
            constraintMax.addTerm(coefficient, variable);
          }
        }
      }
      return this;
    };
    Model.prototype.getNumberOfIntegerVariables = function() {
      return this.integerVariables.length;
    };
    Model.prototype.solve = function() {
      if (this.tableauInitialized === false) {
        this.tableau.setModel(this);
        this.tableauInitialized = true;
      }
      return this.tableau.solve();
    };
    Model.prototype.isFeasible = function() {
      return this.tableau.feasible;
    };
    Model.prototype.save = function() {
      return this.tableau.save();
    };
    Model.prototype.restore = function() {
      return this.tableau.restore();
    };
    Model.prototype.activateMIRCuts = function(useMIRCuts) {
      this.useMIRCuts = useMIRCuts;
    };
    Model.prototype.debug = function(debugCheckForCycles) {
      this.checkForCycles = debugCheckForCycles;
    };
    Model.prototype.log = function(message) {
      return this.tableau.log(message);
    };
  }
});

// node_modules/javascript-lp-solver/src/Validation.js
var require_Validation = __commonJS({
  "node_modules/javascript-lp-solver/src/Validation.js"(exports2) {
    exports2.CleanObjectiveAttributes = function(model) {
      var fakeAttr, x, z;
      if (typeof model.optimize === "string") {
        if (model.constraints[model.optimize]) {
          fakeAttr = Math.random();
          for (x in model.variables) {
            if (model.variables[x][model.optimize]) {
              model.variables[x][fakeAttr] = model.variables[x][model.optimize];
            }
          }
          model.constraints[fakeAttr] = model.constraints[model.optimize];
          delete model.constraints[model.optimize];
          return model;
        } else {
          return model;
        }
      } else {
        for (z in model.optimize) {
          if (model.constraints[z]) {
            if (model.constraints[z] === "equal") {
              delete model.optimize[z];
            } else {
              fakeAttr = Math.random();
              for (x in model.variables) {
                if (model.variables[x][z]) {
                  model.variables[x][fakeAttr] = model.variables[x][z];
                }
              }
              model.constraints[fakeAttr] = model.constraints[z];
              delete model.constraints[z];
            }
          }
        }
        return model;
      }
    };
  }
});

// node_modules/javascript-lp-solver/src/External/lpsolve/Reformat.js
var require_Reformat = __commonJS({
  "node_modules/javascript-lp-solver/src/External/lpsolve/Reformat.js"(exports2, module2) {
    function to_JSON(input) {
      var rxo = {
        /* jshint ignore:start */
        "is_blank": /^\W{0,}$/,
        "is_objective": /(max|min)(imize){0,}\:/i,
        "is_int": /^(?!\/\*)\W{0,}int/i,
        "is_bin": /^(?!\/\*)\W{0,}bin/i,
        "is_constraint": /(\>|\<){0,}\=/i,
        "is_unrestricted": /^\S{0,}unrestricted/i,
        "parse_lhs": /(\-|\+){0,1}\s{0,1}\d{0,}\.{0,}\d{0,}\s{0,}[A-Za-z]\S{0,}/gi,
        "parse_rhs": /(\-|\+){0,1}\d{1,}\.{0,}\d{0,}\W{0,}\;{0,1}$/i,
        "parse_dir": /(\>|\<){0,}\=/gi,
        "parse_int": /[^\s|^\,]+/gi,
        "parse_bin": /[^\s|^\,]+/gi,
        "get_num": /(\-|\+){0,1}(\W|^)\d+\.{0,1}\d{0,}/g,
        "get_word": /[A-Za-z].*/
        /* jshint ignore:end */
      }, model = {
        "opType": "",
        "optimize": "_obj",
        "constraints": {},
        "variables": {}
      }, constraints = {
        ">=": "min",
        "<=": "max",
        "=": "equal"
      }, tmp = "", tst = 0, ary = null, hldr = "", hldr2 = "", constraint = "", rhs = 0;
      if (typeof input === "string") {
        input = input.split("\n");
      }
      for (var i = 0; i < input.length; i++) {
        constraint = "__" + i;
        tmp = input[i];
        tst = 0;
        ary = null;
        if (rxo.is_objective.test(tmp)) {
          model.opType = tmp.match(/(max|min)/gi)[0];
          ary = tmp.match(rxo.parse_lhs).map(function(d) {
            return d.replace(/\s+/, "");
          }).slice(1);
          ary.forEach(function(d) {
            hldr = d.match(rxo.get_num);
            if (hldr === null) {
              if (d.substr(0, 1) === "-") {
                hldr = -1;
              } else {
                hldr = 1;
              }
            } else {
              hldr = hldr[0];
            }
            hldr = parseFloat(hldr);
            hldr2 = d.match(rxo.get_word)[0].replace(/\;$/, "");
            model.variables[hldr2] = model.variables[hldr2] || {};
            model.variables[hldr2]._obj = hldr;
          });
        } else if (rxo.is_int.test(tmp)) {
          ary = tmp.match(rxo.parse_int).slice(1);
          model.ints = model.ints || {};
          ary.forEach(function(d) {
            d = d.replace(";", "");
            model.ints[d] = 1;
          });
        } else if (rxo.is_bin.test(tmp)) {
          ary = tmp.match(rxo.parse_bin).slice(1);
          model.binaries = model.binaries || {};
          ary.forEach(function(d) {
            d = d.replace(";", "");
            model.binaries[d] = 1;
          });
        } else if (rxo.is_constraint.test(tmp)) {
          var separatorIndex = tmp.indexOf(":");
          var constraintExpression = separatorIndex === -1 ? tmp : tmp.slice(separatorIndex + 1);
          ary = constraintExpression.match(rxo.parse_lhs).map(function(d) {
            return d.replace(/\s+/, "");
          });
          ary.forEach(function(d) {
            hldr = d.match(rxo.get_num);
            if (hldr === null) {
              if (d.substr(0, 1) === "-") {
                hldr = -1;
              } else {
                hldr = 1;
              }
            } else {
              hldr = hldr[0];
            }
            hldr = parseFloat(hldr);
            hldr2 = d.match(rxo.get_word)[0];
            model.variables[hldr2] = model.variables[hldr2] || {};
            model.variables[hldr2][constraint] = hldr;
          });
          rhs = parseFloat(tmp.match(rxo.parse_rhs)[0]);
          tmp = constraints[tmp.match(rxo.parse_dir)[0]];
          model.constraints[constraint] = model.constraints[constraint] || {};
          model.constraints[constraint][tmp] = rhs;
        } else if (rxo.is_unrestricted.test(tmp)) {
          ary = tmp.match(rxo.parse_int).slice(1);
          model.unrestricted = model.unrestricted || {};
          ary.forEach(function(d) {
            d = d.replace(";", "");
            model.unrestricted[d] = 1;
          });
        }
      }
      return model;
    }
    function from_JSON(model) {
      if (!model) {
        throw new Error("Solver requires a model to operate on");
      }
      var output = "", ary = [], norm = 1, lookup = {
        "max": "<=",
        "min": ">=",
        "equal": "="
      }, rxClean = new RegExp("[^A-Za-z0-9_[{}/.&#$%~'@^]", "gi");
      if (model.opType) {
        output += model.opType + ":";
        for (var x in model.variables) {
          model.variables[x][x] = model.variables[x][x] ? model.variables[x][x] : 1;
          if (model.variables[x][model.optimize]) {
            output += " " + model.variables[x][model.optimize] + " " + x.replace(rxClean, "_");
          }
        }
      } else {
        output += "max:";
      }
      output += ";\n\n";
      for (var xx in model.constraints) {
        for (var y in model.constraints[xx]) {
          if (typeof lookup[y] !== "undefined") {
            for (var z in model.variables) {
              if (typeof model.variables[z][xx] !== "undefined") {
                output += " " + model.variables[z][xx] + " " + z.replace(rxClean, "_");
              }
            }
            output += " " + lookup[y] + " " + model.constraints[xx][y];
            output += ";\n";
          }
        }
      }
      if (model.ints) {
        output += "\n\n";
        for (var xxx in model.ints) {
          output += "int " + xxx.replace(rxClean, "_") + ";\n";
        }
      }
      if (model.unrestricted) {
        output += "\n\n";
        for (var xxxx in model.unrestricted) {
          output += "unrestricted " + xxxx.replace(rxClean, "_") + ";\n";
        }
      }
      return output;
    }
    module2.exports = function(model) {
      if (model.length) {
        return to_JSON(model);
      } else {
        return from_JSON(model);
      }
    };
  }
});

// node_modules/javascript-lp-solver/src/External/lpsolve/main.js
var require_main = __commonJS({
  "node_modules/javascript-lp-solver/src/External/lpsolve/main.js"(exports2) {
    exports2.reformat = require_Reformat();
    function clean_data(data) {
      data = data.replace("\\r\\n", "\r\n");
      data = data.split("\r\n");
      data = data.filter(function(x) {
        var rx;
        rx = new RegExp(" 0$", "gi");
        if (rx.test(x) === true) {
          return false;
        }
        rx = new RegExp("\\d$", "gi");
        if (rx.test(x) === false) {
          return false;
        }
        return true;
      }).map(function(x) {
        return x.split(/\:{0,1} +(?=\d)/);
      }).reduce(function(o, k, i) {
        o[k[0]] = k[1];
        return o;
      }, {});
      return data;
    }
    exports2.solve = function(model) {
      return new Promise(function(res, rej) {
        if (typeof window !== "undefined") {
          rej("Function Not Available in Browser");
        }
        var data = require_Reformat()(model);
        if (!model.external) {
          rej("Data for this function must be contained in the 'external' attribute. Not seeing anything there.");
        }
        if (!model.external.binPath) {
          rej("No Executable | Binary path provided in arguments as 'binPath'");
        }
        if (!model.external.args) {
          rej("No arguments array for cli | bash provided on 'args' attribute");
        }
        if (!model.external.tempName) {
          rej("No 'tempName' given. This is necessary to produce a staging file for the solver to operate on");
        }
        var fs = require("fs");
        fs.writeFile(model.external.tempName, data, function(fe, fd) {
          if (fe) {
            rej(fe);
          } else {
            var exec = require("child_process").execFile;
            model.external.args.push(model.external.tempName);
            exec(model.external.binPath, model.external.args, function(e, data2) {
              if (e) {
                if (e.code === 1) {
                  res(clean_data(data2));
                } else {
                  var codes = {
                    "-2": "Out of Memory",
                    "1": "SUBOPTIMAL",
                    "2": "INFEASIBLE",
                    "3": "UNBOUNDED",
                    "4": "DEGENERATE",
                    "5": "NUMFAILURE",
                    "6": "USER-ABORT",
                    "7": "TIMEOUT",
                    "9": "PRESOLVED",
                    "25": "ACCURACY ERROR",
                    "255": "FILE-ERROR"
                  };
                  var ret_obj = {
                    "code": e.code,
                    "meaning": codes[e.code],
                    "data": data2
                  };
                  rej(ret_obj);
                }
              } else {
                res(clean_data(data2));
              }
            });
          }
        });
      });
    };
  }
});

// node_modules/javascript-lp-solver/src/External/main.js
var require_main2 = __commonJS({
  "node_modules/javascript-lp-solver/src/External/main.js"(exports2, module2) {
    module2.exports = {
      "lpsolve": require_main()
    };
  }
});

// node_modules/javascript-lp-solver/src/Polyopt.js
var require_Polyopt = __commonJS({
  "node_modules/javascript-lp-solver/src/Polyopt.js"(exports2, module2) {
    module2.exports = function(solver4, model) {
      var objectives = model.optimize, new_constraints = JSON.parse(JSON.stringify(model.optimize)), keys = Object.keys(model.optimize), tmp, counter = 0, vectors = {}, vector_key = "", obj = {}, pareto = [], i, j, x, y, z;
      delete model.optimize;
      for (i = 0; i < keys.length; i++) {
        new_constraints[keys[i]] = 0;
      }
      for (i = 0; i < keys.length; i++) {
        model.optimize = keys[i];
        model.opType = objectives[keys[i]];
        tmp = solver4.Solve(model, void 0, void 0, true);
        for (y in keys) {
          if (!model.variables[keys[y]]) {
            tmp[keys[y]] = tmp[keys[y]] ? tmp[keys[y]] : 0;
            for (x in model.variables) {
              if (model.variables[x][keys[y]] && tmp[x]) {
                tmp[keys[y]] += tmp[x] * model.variables[x][keys[y]];
              }
            }
          }
        }
        vector_key = "base";
        for (j = 0; j < keys.length; j++) {
          if (tmp[keys[j]]) {
            vector_key += "-" + (tmp[keys[j]] * 1e3 | 0) / 1e3;
          } else {
            vector_key += "-0";
          }
        }
        if (!vectors[vector_key]) {
          vectors[vector_key] = 1;
          counter++;
          for (j = 0; j < keys.length; j++) {
            if (tmp[keys[j]]) {
              new_constraints[keys[j]] += tmp[keys[j]];
            }
          }
          delete tmp.feasible;
          delete tmp.result;
          pareto.push(tmp);
        }
      }
      for (i = 0; i < keys.length; i++) {
        model.constraints[keys[i]] = { "equal": new_constraints[keys[i]] / counter };
      }
      model.optimize = "cheater-" + Math.random();
      model.opType = "max";
      for (i in model.variables) {
        model.variables[i].cheater = 1;
      }
      for (i in pareto) {
        for (x in pareto[i]) {
          obj[x] = obj[x] || { min: 1e99, max: -1e99 };
        }
      }
      for (i in obj) {
        for (x in pareto) {
          if (pareto[x][i]) {
            if (pareto[x][i] > obj[i].max) {
              obj[i].max = pareto[x][i];
            }
            if (pareto[x][i] < obj[i].min) {
              obj[i].min = pareto[x][i];
            }
          } else {
            pareto[x][i] = 0;
            obj[i].min = 0;
          }
        }
      }
      tmp = solver4.Solve(model, void 0, void 0, true);
      return {
        midpoint: tmp,
        vertices: pareto,
        ranges: obj
      };
    };
  }
});

// node_modules/javascript-lp-solver/src/main.js
var require_main3 = __commonJS({
  "node_modules/javascript-lp-solver/src/main.js"(exports2, module2) {
    var Tableau = require_Tableau2();
    var Model = require_Model();
    var branchAndCut = require_branchAndCut();
    var expressions = require_expressions();
    var validation = require_Validation();
    var Constraint = expressions.Constraint;
    var Variable = expressions.Variable;
    var Numeral = expressions.Numeral;
    var Term = expressions.Term;
    var External = require_main2();
    var Solver = function() {
      "use strict";
      this.Model = Model;
      this.branchAndCut = branchAndCut;
      this.Constraint = Constraint;
      this.Variable = Variable;
      this.Numeral = Numeral;
      this.Term = Term;
      this.Tableau = Tableau;
      this.lastSolvedModel = null;
      this.External = External;
      this.Solve = function(model, precision, full, validate) {
        if (validate) {
          for (var test in validation) {
            model = validation[test](model);
          }
        }
        if (!model) {
          throw new Error("Solver requires a model to operate on");
        }
        if (typeof model.optimize === "object") {
          if (Object.keys(model.optimize > 1)) {
            return require_Polyopt()(this, model);
          }
        }
        if (model.external) {
          var solvers = Object.keys(External);
          solvers = JSON.stringify(solvers);
          if (!model.external.solver) {
            throw new Error("The model you provided has an 'external' object that doesn't have a solver attribute. Use one of the following:" + solvers);
          }
          if (!External[model.external.solver]) {
            throw new Error("No support (yet) for " + model.external.solver + ". Please use one of these instead:" + solvers);
          }
          return External[model.external.solver].solve(model);
        } else {
          if (model instanceof Model === false) {
            model = new Model(precision).loadJson(model);
          }
          var solution = model.solve();
          this.lastSolvedModel = model;
          solution.solutionSet = solution.generateSolutionSet();
          if (full) {
            return solution;
          } else {
            var store = {};
            store.feasible = solution.feasible;
            store.result = solution.evaluation;
            store.bounded = solution.bounded;
            if (solution._tableau.__isIntegral) {
              store.isIntegral = true;
            }
            Object.keys(solution.solutionSet).forEach(function(d) {
              if (solution.solutionSet[d] !== 0) {
                store[d] = solution.solutionSet[d];
              }
            });
            return store;
          }
        }
      };
      this.ReformatLP = require_Reformat();
      this.MultiObjective = function(model) {
        return require_Polyopt()(this, model);
      };
    };
    if (typeof define === "function") {
      define([], function() {
        return new Solver();
      });
    } else if (typeof window === "object") {
      window.solver = new Solver();
    } else if (typeof self === "object") {
      self.solver = new Solver();
    }
    module2.exports = new Solver();
  }
});

// node_modules/quadprog/lib/vsmall.js
var require_vsmall = __commonJS({
  "node_modules/quadprog/lib/vsmall.js"(exports2, module2) {
    "use strict";
    var epsilon = 1e-60;
    var tmpa;
    var tmpb;
    do {
      epsilon += epsilon;
      tmpa = 1 + 0.1 * epsilon;
      tmpb = 1 + 0.2 * epsilon;
    } while (tmpa <= 1 || tmpb <= 1);
    module2.exports = epsilon;
  }
});

// node_modules/quadprog/lib/dpori.js
var require_dpori = __commonJS({
  "node_modules/quadprog/lib/dpori.js"(exports2, module2) {
    "use strict";
    function dpori(a, lda, n) {
      let kp1, t;
      for (let k = 1; k <= n; k += 1) {
        a[k][k] = 1 / a[k][k];
        t = -a[k][k];
        for (let i = 1; i < k; i += 1) {
          a[i][k] *= t;
        }
        kp1 = k + 1;
        if (n < kp1) {
          break;
        }
        for (let j = kp1; j <= n; j += 1) {
          t = a[k][j];
          a[k][j] = 0;
          for (let i = 1; i <= k; i += 1) {
            a[i][j] += t * a[i][k];
          }
        }
      }
    }
    module2.exports = dpori;
  }
});

// node_modules/quadprog/lib/dposl.js
var require_dposl = __commonJS({
  "node_modules/quadprog/lib/dposl.js"(exports2, module2) {
    "use strict";
    function dposl(a, lda, n, b) {
      let k, t;
      for (k = 1; k <= n; k += 1) {
        t = 0;
        for (let i = 1; i < k; i += 1) {
          t += a[i][k] * b[i];
        }
        b[k] = (b[k] - t) / a[k][k];
      }
      for (let kb = 1; kb <= n; kb += 1) {
        k = n + 1 - kb;
        b[k] /= a[k][k];
        t = -b[k];
        for (let i = 1; i < k; i += 1) {
          b[i] += t * a[i][k];
        }
      }
    }
    module2.exports = dposl;
  }
});

// node_modules/quadprog/lib/dpofa.js
var require_dpofa = __commonJS({
  "node_modules/quadprog/lib/dpofa.js"(exports2, module2) {
    "use strict";
    function dpofa(a, lda, n, info) {
      let jm1, t, s;
      for (let j = 1; j <= n; j += 1) {
        info[1] = j;
        s = 0;
        jm1 = j - 1;
        if (jm1 < 1) {
          s = a[j][j] - s;
          if (s <= 0) {
            break;
          }
          a[j][j] = Math.sqrt(s);
        } else {
          for (let k = 1; k <= jm1; k += 1) {
            t = a[k][j];
            for (let i = 1; i < k; i += 1) {
              t -= a[i][j] * a[i][k];
            }
            t /= a[k][k];
            a[k][j] = t;
            s += t * t;
          }
          s = a[j][j] - s;
          if (s <= 0) {
            break;
          }
          a[j][j] = Math.sqrt(s);
        }
        info[1] = 0;
      }
    }
    module2.exports = dpofa;
  }
});

// node_modules/quadprog/lib/qpgen2.js
var require_qpgen2 = __commonJS({
  "node_modules/quadprog/lib/qpgen2.js"(exports2, module2) {
    "use strict";
    var vsmall = require_vsmall();
    var dpori = require_dpori();
    var dposl = require_dposl();
    var dpofa = require_dpofa();
    function qpgen2(dmat, dvec, fddmat, n, sol, lagr, crval, amat, bvec, fdamat, q, meq, iact, nnact = 0, iter, work, ierr) {
      let l1, it1, nvl, nact, temp, sum2, t1, tt, gc, gs, nu, t1inf, t2min, go;
      const r = Math.min(n, q);
      let l = 2 * n + r * (r + 5) / 2 + 2 * q + 1;
      for (let i = 1; i <= n; i += 1) {
        work[i] = dvec[i];
      }
      for (let i = n + 1; i <= l; i += 1) {
        work[i] = 0;
      }
      for (let i = 1; i <= q; i += 1) {
        iact[i] = 0;
        lagr[i] = 0;
      }
      const info = [];
      if (ierr[1] === 0) {
        dpofa(dmat, fddmat, n, info);
        if (info[1] !== 0) {
          ierr[1] = 2;
          return;
        }
        dposl(dmat, fddmat, n, dvec);
        dpori(dmat, fddmat, n);
      } else {
        for (let j = 1; j <= n; j += 1) {
          sol[j] = 0;
          for (let i = 1; i <= j; i += 1) {
            sol[j] += dmat[i][j] * dvec[i];
          }
        }
        for (let j = 1; j <= n; j += 1) {
          dvec[j] = 0;
          for (let i = j; i <= n; i += 1) {
            dvec[j] += dmat[j][i] * sol[i];
          }
        }
      }
      crval[1] = 0;
      for (let j = 1; j <= n; j += 1) {
        sol[j] = dvec[j];
        crval[1] += work[j] * sol[j];
        work[j] = 0;
        for (let i = j + 1; i <= n; i += 1) {
          dmat[i][j] = 0;
        }
      }
      crval[1] = -crval[1] / 2;
      ierr[1] = 0;
      const iwzv = n;
      const iwrv = iwzv + n;
      const iwuv = iwrv + r;
      const iwrm = iwuv + r + 1;
      const iwsv = iwrm + r * (r + 1) / 2;
      const iwnbv = iwsv + q;
      for (let i = 1; i <= q; i += 1) {
        sum2 = 0;
        for (let j = 1; j <= n; j += 1) {
          sum2 += amat[j][i] * amat[j][i];
        }
        work[iwnbv + i] = Math.sqrt(sum2);
      }
      nact = nnact;
      iter[1] = 0;
      iter[2] = 0;
      function fnGoto50() {
        iter[1] += 1;
        l = iwsv;
        for (let i = 1; i <= q; i += 1) {
          l += 1;
          sum2 = -bvec[i];
          for (let j = 1; j <= n; j += 1) {
            sum2 += amat[j][i] * sol[j];
          }
          if (Math.abs(sum2) < vsmall) {
            sum2 = 0;
          }
          if (i > meq) {
            work[l] = sum2;
          } else {
            work[l] = -Math.abs(sum2);
            if (sum2 > 0) {
              for (let j = 1; j <= n; j += 1) {
                amat[j][i] = -amat[j][i];
              }
              bvec[i] = -bvec[i];
            }
          }
        }
        for (let i = 1; i <= nact; i += 1) {
          work[iwsv + iact[i]] = 0;
        }
        nvl = 0;
        temp = 0;
        for (let i = 1; i <= q; i += 1) {
          if (work[iwsv + i] < temp * work[iwnbv + i]) {
            nvl = i;
            temp = work[iwsv + i] / work[iwnbv + i];
          }
        }
        if (nvl === 0) {
          for (let i = 1; i <= nact; i += 1) {
            lagr[iact[i]] = work[iwuv + i];
          }
          return 999;
        }
        return 0;
      }
      function fnGoto55() {
        for (let i = 1; i <= n; i += 1) {
          sum2 = 0;
          for (let j = 1; j <= n; j += 1) {
            sum2 += dmat[j][i] * amat[j][nvl];
          }
          work[i] = sum2;
        }
        l1 = iwzv;
        for (let i = 1; i <= n; i += 1) {
          work[l1 + i] = 0;
        }
        for (let j = nact + 1; j <= n; j += 1) {
          for (let i = 1; i <= n; i += 1) {
            work[l1 + i] = work[l1 + i] + dmat[i][j] * work[j];
          }
        }
        t1inf = true;
        for (let i = nact; i >= 1; i -= 1) {
          sum2 = work[i];
          l = iwrm + i * (i + 3) / 2;
          l1 = l - i;
          for (let j = i + 1; j <= nact; j += 1) {
            sum2 -= work[l] * work[iwrv + j];
            l += j;
          }
          sum2 /= work[l1];
          work[iwrv + i] = sum2;
          if (iact[i] <= meq) {
            continue;
          }
          if (sum2 <= 0) {
            continue;
          }
          t1inf = false;
          it1 = i;
        }
        if (!t1inf) {
          t1 = work[iwuv + it1] / work[iwrv + it1];
          for (let i = 1; i <= nact; i += 1) {
            if (iact[i] <= meq) {
              continue;
            }
            if (work[iwrv + i] <= 0) {
              continue;
            }
            temp = work[iwuv + i] / work[iwrv + i];
            if (temp < t1) {
              t1 = temp;
              it1 = i;
            }
          }
        }
        sum2 = 0;
        for (let i = iwzv + 1; i <= iwzv + n; i += 1) {
          sum2 += work[i] * work[i];
        }
        if (Math.abs(sum2) <= vsmall) {
          if (t1inf) {
            ierr[1] = 1;
            return 999;
          }
          for (let i = 1; i <= nact; i += 1) {
            work[iwuv + i] = work[iwuv + i] - t1 * work[iwrv + i];
          }
          work[iwuv + nact + 1] = work[iwuv + nact + 1] + t1;
          return 700;
        }
        sum2 = 0;
        for (let i = 1; i <= n; i += 1) {
          sum2 += work[iwzv + i] * amat[i][nvl];
        }
        tt = -work[iwsv + nvl] / sum2;
        t2min = true;
        if (!t1inf) {
          if (t1 < tt) {
            tt = t1;
            t2min = false;
          }
        }
        for (let i = 1; i <= n; i += 1) {
          sol[i] += tt * work[iwzv + i];
          if (Math.abs(sol[i]) < vsmall) {
            sol[i] = 0;
          }
        }
        crval[1] += tt * sum2 * (tt / 2 + work[iwuv + nact + 1]);
        for (let i = 1; i <= nact; i += 1) {
          work[iwuv + i] = work[iwuv + i] - tt * work[iwrv + i];
        }
        work[iwuv + nact + 1] = work[iwuv + nact + 1] + tt;
        if (t2min) {
          nact += 1;
          iact[nact] = nvl;
          l = iwrm + (nact - 1) * nact / 2 + 1;
          for (let i = 1; i <= nact - 1; i += 1) {
            work[l] = work[i];
            l += 1;
          }
          if (nact === n) {
            work[l] = work[n];
          } else {
            for (let i = n; i >= nact + 1; i -= 1) {
              if (work[i] === 0) {
                continue;
              }
              gc = Math.max(Math.abs(work[i - 1]), Math.abs(work[i]));
              gs = Math.min(Math.abs(work[i - 1]), Math.abs(work[i]));
              if (work[i - 1] >= 0) {
                temp = Math.abs(gc * Math.sqrt(1 + gs * gs / (gc * gc)));
              } else {
                temp = -Math.abs(gc * Math.sqrt(1 + gs * gs / (gc * gc)));
              }
              gc = work[i - 1] / temp;
              gs = work[i] / temp;
              if (gc === 1) {
                continue;
              }
              if (gc === 0) {
                work[i - 1] = gs * temp;
                for (let j = 1; j <= n; j += 1) {
                  temp = dmat[j][i - 1];
                  dmat[j][i - 1] = dmat[j][i];
                  dmat[j][i] = temp;
                }
              } else {
                work[i - 1] = temp;
                nu = gs / (1 + gc);
                for (let j = 1; j <= n; j += 1) {
                  temp = gc * dmat[j][i - 1] + gs * dmat[j][i];
                  dmat[j][i] = nu * (dmat[j][i - 1] + temp) - dmat[j][i];
                  dmat[j][i - 1] = temp;
                }
              }
            }
            work[l] = work[nact];
          }
        } else {
          sum2 = -bvec[nvl];
          for (let j = 1; j <= n; j += 1) {
            sum2 += sol[j] * amat[j][nvl];
          }
          if (nvl > meq) {
            work[iwsv + nvl] = sum2;
          } else {
            work[iwsv + nvl] = -Math.abs(sum2);
            if (sum2 > 0) {
              for (let j = 1; j <= n; j += 1) {
                amat[j][nvl] = -amat[j][nvl];
              }
              bvec[nvl] = -bvec[nvl];
            }
          }
          return 700;
        }
        return 0;
      }
      function fnGoto797() {
        l = iwrm + it1 * (it1 + 1) / 2 + 1;
        l1 = l + it1;
        if (work[l1] === 0) {
          return 798;
        }
        gc = Math.max(Math.abs(work[l1 - 1]), Math.abs(work[l1]));
        gs = Math.min(Math.abs(work[l1 - 1]), Math.abs(work[l1]));
        if (work[l1 - 1] >= 0) {
          temp = Math.abs(gc * Math.sqrt(1 + gs * gs / (gc * gc)));
        } else {
          temp = -Math.abs(gc * Math.sqrt(1 + gs * gs / (gc * gc)));
        }
        gc = work[l1 - 1] / temp;
        gs = work[l1] / temp;
        if (gc === 1) {
          return 798;
        }
        if (gc === 0) {
          for (let i = it1 + 1; i <= nact; i += 1) {
            temp = work[l1 - 1];
            work[l1 - 1] = work[l1];
            work[l1] = temp;
            l1 += i;
          }
          for (let i = 1; i <= n; i += 1) {
            temp = dmat[i][it1];
            dmat[i][it1] = dmat[i][it1 + 1];
            dmat[i][it1 + 1] = temp;
          }
        } else {
          nu = gs / (1 + gc);
          for (let i = it1 + 1; i <= nact; i += 1) {
            temp = gc * work[l1 - 1] + gs * work[l1];
            work[l1] = nu * (work[l1 - 1] + temp) - work[l1];
            work[l1 - 1] = temp;
            l1 += i;
          }
          for (let i = 1; i <= n; i += 1) {
            temp = gc * dmat[i][it1] + gs * dmat[i][it1 + 1];
            dmat[i][it1 + 1] = nu * (dmat[i][it1] + temp) - dmat[i][it1 + 1];
            dmat[i][it1] = temp;
          }
        }
        return 0;
      }
      function fnGoto798() {
        l1 = l - it1;
        for (let i = 1; i <= it1; i += 1) {
          work[l1] = work[l];
          l += 1;
          l1 += 1;
        }
        work[iwuv + it1] = work[iwuv + it1 + 1];
        iact[it1] = iact[it1 + 1];
        it1 += 1;
        if (it1 < nact) {
          return 797;
        }
        return 0;
      }
      function fnGoto799() {
        work[iwuv + nact] = work[iwuv + nact + 1];
        work[iwuv + nact + 1] = 0;
        iact[nact] = 0;
        nact -= 1;
        iter[2] += 1;
        return 0;
      }
      go = 0;
      while (true) {
        go = fnGoto50();
        if (go === 999) {
          return;
        }
        while (true) {
          go = fnGoto55();
          if (go === 0) {
            break;
          }
          if (go === 999) {
            return;
          }
          if (go === 700) {
            if (it1 === nact) {
              fnGoto799();
            } else {
              while (true) {
                fnGoto797();
                go = fnGoto798();
                if (go !== 797) {
                  break;
                }
              }
              fnGoto799();
            }
          }
        }
      }
    }
    module2.exports = qpgen2;
  }
});

// node_modules/quadprog/lib/quadprog.js
var require_quadprog = __commonJS({
  "node_modules/quadprog/lib/quadprog.js"(exports2) {
    "use strict";
    var qpgen2 = require_qpgen2();
    function solveQP(Dmat, dvec, Amat, bvec = [], meq = 0, factorized = [0, 0]) {
      const crval = [];
      const iact = [];
      const sol = [];
      const lagr = [];
      const work = [];
      const iter = [];
      let message = "";
      const n = Dmat.length - 1;
      const q = Amat[1].length - 1;
      if (!bvec) {
        for (let i = 1; i <= q; i += 1) {
          bvec[i] = 0;
        }
      }
      if (n !== Dmat[1].length - 1) {
        message = "Dmat is not symmetric!";
      }
      if (n !== dvec.length - 1) {
        message = "Dmat and dvec are incompatible!";
      }
      if (n !== Amat.length - 1) {
        message = "Amat and dvec are incompatible!";
      }
      if (q !== bvec.length - 1) {
        message = "Amat and bvec are incompatible!";
      }
      if (meq > q || meq < 0) {
        message = "Value of meq is invalid!";
      }
      if (message !== "") {
        return {
          message
        };
      }
      for (let i = 1; i <= q; i += 1) {
        iact[i] = 0;
        lagr[i] = 0;
      }
      const nact = 0;
      const r = Math.min(n, q);
      for (let i = 1; i <= n; i += 1) {
        sol[i] = 0;
      }
      crval[1] = 0;
      for (let i = 1; i <= 2 * n + r * (r + 5) / 2 + 2 * q + 1; i += 1) {
        work[i] = 0;
      }
      for (let i = 1; i <= 2; i += 1) {
        iter[i] = 0;
      }
      qpgen2(Dmat, dvec, n, n, sol, lagr, crval, Amat, bvec, n, q, meq, iact, nact, iter, work, factorized);
      if (factorized[1] === 1) {
        message = "constraints are inconsistent, no solution!";
      }
      if (factorized[1] === 2) {
        message = "matrix D in quadratic function is not positive definite!";
      }
      return {
        solution: sol,
        Lagrangian: lagr,
        value: crval,
        unconstrained_solution: dvec,
        // eslint-disable-line camelcase
        iterations: iter,
        iact,
        message
      };
    }
    exports2.solveQP = solveQP;
  }
});

// node_modules/quadprog/index.js
var require_quadprog2 = __commonJS({
  "node_modules/quadprog/index.js"(exports2, module2) {
    "use strict";
    module2.exports = require_quadprog();
  }
});

// src/index.js
var src_exports = {};
__export(src_exports, {
  BaseConvexOptimizer: () => BaseConvexOptimizer,
  BaseOptimizer: () => BaseOptimizer,
  BlackLittermanModel: () => BlackLittermanModel,
  CLA: () => CLA,
  CovarianceShrinkage: () => CovarianceShrinkage,
  DiscreteAllocation: () => DiscreteAllocation,
  EfficientCDaR: () => EfficientCDaR,
  EfficientCVaR: () => EfficientCVaR,
  EfficientFrontier: () => EfficientFrontier,
  EfficientSemivariance: () => EfficientSemivariance,
  HRPOpt: () => HRPOpt,
  L2Reg: () => L2Reg,
  L2_reg: () => L2_reg,
  _is_positive_semidefinite: () => _is_positive_semidefinite,
  capmReturn: () => capmReturn,
  capm_return: () => capm_return,
  corrToCov: () => corrToCov,
  corr_to_cov: () => corr_to_cov,
  covToCorr: () => covToCorr,
  cov_to_corr: () => cov_to_corr,
  emaHistoricalReturn: () => emaHistoricalReturn,
  ema_historical_return: () => ema_historical_return,
  exAnteTrackingError: () => exAnteTrackingError,
  exPostTrackingError: () => exPostTrackingError,
  ex_ante_tracking_error: () => ex_ante_tracking_error,
  ex_post_tracking_error: () => ex_post_tracking_error,
  expCov: () => expCov,
  exp_cov: () => exp_cov,
  fixNonpositiveSemidefinite: () => fixNonpositiveSemidefinite,
  fix_nonpositive_semidefinite: () => fix_nonpositive_semidefinite,
  getLatestPrices: () => getLatestPrices,
  getPrior: () => getPrior,
  get_latest_prices: () => get_latest_prices,
  isPositiveSemidefinite: () => isPositiveSemidefinite,
  marketImpliedPriorReturns: () => marketImpliedPriorReturns,
  marketImpliedRiskAversion: () => marketImpliedRiskAversion,
  market_implied_prior_returns: () => market_implied_prior_returns,
  market_implied_risk_aversion: () => market_implied_risk_aversion,
  meanHistoricalReturn: () => meanHistoricalReturn,
  mean_historical_return: () => mean_historical_return,
  minCovDeterminant: () => minCovDeterminant,
  min_cov_determinant: () => min_cov_determinant,
  portfolioReturn: () => portfolioReturn,
  portfolioVariance: () => portfolioVariance,
  portfolio_return: () => portfolio_return,
  portfolio_variance: () => portfolio_variance,
  pricesFromReturns: () => pricesFromReturns,
  prices_from_returns: () => prices_from_returns,
  quadraticUtility: () => quadraticUtility,
  quadratic_utility: () => quadratic_utility,
  returnModel: () => returnModel,
  return_model: () => return_model,
  returnsFromPrices: () => returnsFromPrices,
  returns_from_prices: () => returns_from_prices,
  riskMatrix: () => riskMatrix,
  risk_matrix: () => risk_matrix,
  sampleCov: () => sampleCov,
  sample_cov: () => sample_cov,
  semicovariance: () => semicovariance,
  sharpeRatio: () => sharpeRatio,
  sharpe_ratio: () => sharpe_ratio,
  transactionCost: () => transactionCost,
  transaction_cost: () => transaction_cost,
  validateReturnsInput: () => validateReturnsInput
});
module.exports = __toCommonJS(src_exports);

// src/_utils/math.js
function assertArray(name, value) {
  if (!Array.isArray(value)) {
    throw new TypeError(`${name} must be an array`);
  }
}
function isMatrix(matrix2) {
  return Array.isArray(matrix2) && matrix2.every((row) => Array.isArray(row));
}
function validateMatrix(name, matrix2) {
  if (!isMatrix(matrix2)) {
    throw new TypeError(`${name} must be a 2D numeric array`);
  }
  const width = matrix2[0]?.length ?? 0;
  if (width === 0) {
    throw new Error(`${name} cannot be empty`);
  }
  for (const row of matrix2) {
    if (row.length !== width) {
      throw new Error(`${name} rows must have equal length`);
    }
    for (const cell of row) {
      if (!Number.isFinite(cell)) {
        throw new Error(`${name} contains non-finite values`);
      }
    }
  }
}
function dot(a, b) {
  assertArray("a", a);
  assertArray("b", b);
  if (a.length !== b.length) {
    throw new Error("dot: vectors must have same length");
  }
  let sum2 = 0;
  for (let i = 0; i < a.length; i += 1) {
    sum2 += a[i] * b[i];
  }
  return sum2;
}
function matVec(matrix2, vector) {
  validateMatrix("matrix", matrix2);
  assertArray("vector", vector);
  if (matrix2[0].length !== vector.length) {
    throw new Error("matVec: incompatible shapes");
  }
  return matrix2.map((row) => dot(row, vector));
}
function mean(values) {
  assertArray("values", values);
  if (values.length === 0) {
    throw new Error("mean: values cannot be empty");
  }
  return values.reduce((acc, v) => acc + v, 0) / values.length;
}
function covariance(x, y) {
  assertArray("x", x);
  assertArray("y", y);
  if (x.length !== y.length) {
    throw new Error("covariance: vectors must have same length");
  }
  if (x.length < 2) {
    return 0;
  }
  const mx = mean(x);
  const my = mean(y);
  let acc = 0;
  for (let i = 0; i < x.length; i += 1) {
    acc += (x[i] - mx) * (y[i] - my);
  }
  return acc / (x.length - 1);
}
function column(matrix2, index) {
  validateMatrix("matrix", matrix2);
  return matrix2.map((row) => row[index]);
}

// src/expected_returns.js
function returnsFromPricesImpl(prices, { logReturns = false } = {}) {
  validateMatrix("prices", prices);
  const rows = prices.length;
  const cols = prices[0].length;
  if (rows < 2) {
    return [];
  }
  const out = [];
  for (let r = 1; r < rows; r += 1) {
    const row = [];
    for (let c = 0; c < cols; c += 1) {
      const prev = prices[r - 1][c];
      const next = prices[r][c];
      if (prev === 0) {
        throw new Error("prices contain a zero entry; cannot compute returns");
      }
      const simple = next / prev - 1;
      row.push(logReturns ? Math.log1p(simple) : simple);
    }
    out.push(row);
  }
  return out;
}
function pricesFromReturnsImpl(returns, { logReturns = false } = {}) {
  validateMatrix("returns", returns);
  const rows = returns.length;
  const cols = returns[0].length;
  const out = Array.from({ length: rows }, () => Array(cols).fill(1));
  if (rows === 0) {
    return out;
  }
  const running = Array(cols).fill(1);
  for (let r = 1; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const ret = returns[r][c];
      const growth = logReturns ? Math.exp(ret) : 1 + ret;
      running[c] *= growth;
      out[r][c] = running[c];
    }
  }
  return out;
}
function meanHistoricalReturnImpl(prices, {
  returnsData = false,
  compounding = true,
  frequency = 252,
  logReturns = false
} = {}) {
  const returns = returnsData ? prices : returnsFromPricesImpl(prices, { logReturns });
  validateMatrix("returns", returns);
  const cols = returns[0].length;
  return Array.from({ length: cols }, (_, c) => {
    const assetReturns = column(returns, c);
    if (compounding) {
      let growth = 1;
      for (const r of assetReturns) {
        growth *= 1 + r;
      }
      return growth ** (frequency / assetReturns.length) - 1;
    }
    return mean(assetReturns) * frequency;
  });
}
function ewmMeanAdjustTrue(values, span) {
  const alpha = 2 / (span + 1);
  let numerator = 0;
  let denominator = 0;
  for (const value of values) {
    numerator = value + (1 - alpha) * numerator;
    denominator = 1 + (1 - alpha) * denominator;
  }
  return denominator === 0 ? 0 : numerator / denominator;
}
function emaHistoricalReturnImpl(prices, {
  returnsData = false,
  compounding = true,
  span = 500,
  frequency = 252,
  logReturns = false
} = {}) {
  const returns = returnsData ? prices : returnsFromPricesImpl(prices, { logReturns });
  validateMatrix("returns", returns);
  const cols = returns[0].length;
  return Array.from({ length: cols }, (_, c) => {
    const assetReturns = column(returns, c);
    const mu = ewmMeanAdjustTrue(assetReturns, span);
    return compounding ? (1 + mu) ** frequency - 1 : mu * frequency;
  });
}
function capmReturnImpl(prices, {
  marketPrices = null,
  returnsData = false,
  riskFreeRate = 0,
  compounding = true,
  frequency = 252,
  logReturns = false
} = {}) {
  let returns = returnsData ? prices : returnsFromPricesImpl(prices, { logReturns });
  validateMatrix("returns", returns);
  let marketReturns = null;
  if (marketPrices) {
    marketReturns = returnsData ? marketPrices.map((row) => row[0]) : returnsFromPricesImpl(marketPrices, { logReturns }).map((row) => row[0]);
  } else {
    marketReturns = returns.map((row) => mean(row));
  }
  const n = Math.min(returns.length, marketReturns.length);
  returns = returns.slice(-n);
  marketReturns = marketReturns.slice(-n);
  const mktMean = (() => {
    if (compounding) {
      let growth = 1;
      for (const r of marketReturns) {
        growth *= 1 + r;
      }
      return growth ** (frequency / marketReturns.length) - 1;
    }
    return mean(marketReturns) * frequency;
  })();
  const marketMean = mean(marketReturns);
  let mktVariance = 0;
  for (const v of marketReturns) {
    const d = v - marketMean;
    mktVariance += d * d;
  }
  mktVariance /= Math.max(marketReturns.length - 1, 1);
  const cols = returns[0].length;
  return Array.from({ length: cols }, (_, c) => {
    const asset = column(returns, c);
    const assetMean = mean(asset);
    let cov = 0;
    for (let i = 0; i < asset.length; i += 1) {
      cov += (asset[i] - assetMean) * (marketReturns[i] - marketMean);
    }
    cov /= Math.max(asset.length - 1, 1);
    const beta = mktVariance === 0 ? 0 : cov / mktVariance;
    return riskFreeRate + beta * (mktMean - riskFreeRate);
  });
}
function returnModelImpl(prices, { method = "mean_historical_return", ...kwargs } = {}) {
  switch (method) {
    case "mean_historical_return":
      return meanHistoricalReturnImpl(prices, kwargs);
    case "ema_historical_return":
      return emaHistoricalReturnImpl(prices, kwargs);
    case "capm_return":
      return capmReturnImpl(prices, kwargs);
    default:
      throw new Error(`return_model: method ${method} not implemented`);
  }
}
function returnsFromPrices(prices, options = {}) {
  return returnsFromPricesImpl(prices, options);
}
function pricesFromReturns(returns, options = {}) {
  return pricesFromReturnsImpl(returns, options);
}
function returnModel(prices, options = {}) {
  return returnModelImpl(prices, options);
}
function meanHistoricalReturn(prices, options = {}) {
  return meanHistoricalReturnImpl(prices, options);
}
function emaHistoricalReturn(prices, options = {}) {
  return emaHistoricalReturnImpl(prices, options);
}
function capmReturn(prices, options = {}) {
  return capmReturnImpl(prices, options);
}
var returns_from_prices = returnsFromPrices;
var prices_from_returns = pricesFromReturns;
var return_model = returnModel;
var mean_historical_return = meanHistoricalReturn;
var ema_historical_return = emaHistoricalReturn;
var capm_return = capmReturn;
function validateReturnsInput(data) {
  assertArray("data", data);
  if (data.length === 0) {
    throw new Error("returns input cannot be empty");
  }
}

// node_modules/ml-matrix/matrix.mjs
var matrix = __toESM(require_matrix(), 1);
var EigenvalueDecomposition2 = matrix.EigenvalueDecomposition;
var Matrix2 = matrix.Matrix;
var matrix_default = matrix.default.Matrix ? matrix.default.Matrix : matrix.Matrix;
var inverse2 = matrix.inverse;
var pseudoInverse2 = matrix.pseudoInverse;

// src/risk_models.js
function isPositiveSemidefinite(matrix2) {
  validateMatrix("matrix", matrix2);
  const n = matrix2.length;
  const L = Array.from({ length: n }, () => Array(n).fill(0));
  for (let i = 0; i < n; i += 1) {
    for (let j = 0; j <= i; j += 1) {
      let sum2 = matrix2[i][j];
      for (let k = 0; k < j; k += 1) {
        sum2 -= L[i][k] * L[j][k];
      }
      if (i === j) {
        if (sum2 < -1e-12) {
          return false;
        }
        L[i][j] = Math.sqrt(Math.max(sum2, 0));
      } else {
        if (L[j][j] === 0) {
          L[i][j] = 0;
        } else {
          L[i][j] = sum2 / L[j][j];
        }
      }
    }
  }
  return true;
}
function fixNonpositiveSemidefinite(matrix2, { fixMethod = "spectral" } = {}) {
  validateMatrix("matrix", matrix2);
  if (isPositiveSemidefinite(matrix2)) {
    return matrix2;
  }
  if (fixMethod === "diag") {
    const eig2 = new EigenvalueDecomposition2(new Matrix2(matrix2), { assumeSymmetric: true });
    const minEig = Math.min(...eig2.realEigenvalues);
    const bump = Math.abs(minEig) * 1.1;
    return matrix2.map((row, i) => row.map((v, j) => i === j ? v + bump : v));
  }
  if (fixMethod !== "spectral") {
    throw new Error(`fix_nonpositive_semidefinite: method ${fixMethod} not implemented`);
  }
  const evd = new EigenvalueDecomposition2(new Matrix2(matrix2), { assumeSymmetric: true });
  const V = evd.eigenvectorMatrix;
  const eig = evd.realEigenvalues.map((v) => v > 0 ? v : 0);
  const reconstructed = V.mmul(Matrix2.diag(eig)).mmul(V.transpose());
  return reconstructed.to2DArray();
}
function computeCovarianceMatrix(returns, frequency) {
  validateMatrix("returns", returns);
  const cols = returns[0].length;
  const out = Array.from({ length: cols }, () => Array(cols).fill(0));
  for (let i = 0; i < cols; i += 1) {
    const xi = column(returns, i);
    for (let j = i; j < cols; j += 1) {
      const xj = column(returns, j);
      const cov = covariance(xi, xj) * frequency;
      out[i][j] = cov;
      out[j][i] = cov;
    }
  }
  return out;
}
function sampleCov(prices, { returnsData = false, frequency = 252, logReturns = false, fixMethod = "spectral" } = {}) {
  const returns = returnsData ? prices : returnsFromPrices(prices, { logReturns });
  const cov = computeCovarianceMatrix(returns, frequency);
  return fixNonpositiveSemidefinite(cov, { fixMethod });
}
function semicovariance(prices, {
  returnsData = false,
  benchmark = 79e-6,
  frequency = 252,
  logReturns = false,
  fixMethod = "spectral"
} = {}) {
  const returns = returnsData ? prices : returnsFromPrices(prices, { logReturns });
  validateMatrix("returns", returns);
  const downside = returns.map((row) => row.map((v) => Math.min(v - benchmark, 0)));
  const cols = downside[0].length;
  const T = downside.length;
  const cov = Array.from({ length: cols }, () => Array(cols).fill(0));
  for (let i = 0; i < cols; i += 1) {
    for (let j = i; j < cols; j += 1) {
      let acc = 0;
      for (let t = 0; t < T; t += 1) {
        acc += downside[t][i] * downside[t][j];
      }
      const value = acc / T * frequency;
      cov[i][j] = value;
      cov[j][i] = value;
    }
  }
  return fixNonpositiveSemidefinite(cov, { fixMethod });
}
function pairExpCovariance(x, y, span) {
  const alpha = 2 / (span + 1);
  const mx = mean(x);
  const my = mean(y);
  let numerator = 0;
  let denominator = 0;
  for (let i = 0; i < x.length; i += 1) {
    const covariation = (x[i] - mx) * (y[i] - my);
    numerator = covariation + (1 - alpha) * numerator;
    denominator = 1 + (1 - alpha) * denominator;
  }
  return denominator === 0 ? 0 : numerator / denominator;
}
function nanToNumMatrix(matrix2) {
  return matrix2.map((row) => row.map((v) => Number.isFinite(v) ? v : 0));
}
function empiricalCovarianceMle(X, { assumeCentered = false } = {}) {
  validateMatrix("X", X);
  const nSamples = X.length;
  const nFeatures = X[0].length;
  const means = Array(nFeatures).fill(0);
  if (!assumeCentered) {
    for (let j = 0; j < nFeatures; j += 1) {
      for (let i = 0; i < nSamples; i += 1) {
        means[j] += X[i][j];
      }
      means[j] /= nSamples;
    }
  }
  const out = Array.from({ length: nFeatures }, () => Array(nFeatures).fill(0));
  for (let i = 0; i < nFeatures; i += 1) {
    for (let j = i; j < nFeatures; j += 1) {
      let acc = 0;
      for (let t = 0; t < nSamples; t += 1) {
        const xi = assumeCentered ? X[t][i] : X[t][i] - means[i];
        const xj = assumeCentered ? X[t][j] : X[t][j] - means[j];
        acc += xi * xj;
      }
      const cov = acc / nSamples;
      out[i][j] = cov;
      out[j][i] = cov;
    }
  }
  return out;
}
function ledoitWolfConstantVariance(X) {
  validateMatrix("X", X);
  const nSamples = X.length;
  const nFeatures = X[0].length;
  if (nFeatures === 1) {
    return { covariance: empiricalCovarianceMle(X), shrinkage: 0 };
  }
  const empCov = empiricalCovarianceMle(X);
  const mu = empCov.reduce((acc, row, i) => acc + row[i], 0) / nFeatures;
  let delta = 0;
  for (let i = 0; i < nFeatures; i += 1) {
    for (let j = 0; j < nFeatures; j += 1) {
      const centered = empCov[i][j] - (i === j ? mu : 0);
      delta += centered * centered;
    }
  }
  delta /= nFeatures;
  let betaNumerator = 0;
  for (let i = 0; i < nFeatures; i += 1) {
    for (let j = 0; j < nFeatures; j += 1) {
      let dotX2 = 0;
      for (let t = 0; t < nSamples; t += 1) {
        dotX2 += X[t][i] * X[t][i] * X[t][j] * X[t][j];
      }
      betaNumerator += dotX2 / nSamples - empCov[i][j] * empCov[i][j];
    }
  }
  const betaRaw = betaNumerator / (nFeatures * nSamples);
  const beta = Math.min(betaRaw, delta);
  const shrinkage = delta === 0 ? 0 : beta / delta;
  const shrunk = Array.from(
    { length: nFeatures },
    (_, i) => Array.from({ length: nFeatures }, (_2, j) => {
      const target = i === j ? mu : 0;
      return (1 - shrinkage) * empCov[i][j] + shrinkage * target;
    })
  );
  return { covariance: shrunk, shrinkage };
}
function oasEstimator(X) {
  validateMatrix("X", X);
  const nSamples = X.length;
  const nFeatures = X[0].length;
  if (nFeatures === 1) {
    const mean2 = X.reduce((acc, row) => acc + row[0], 0) / nSamples;
    const variance = X.reduce((acc, row) => {
      const d = row[0] - mean2;
      return acc + d * d;
    }, 0) / nSamples;
    return { covariance: [[variance]], shrinkage: 0 };
  }
  const empCov = empiricalCovarianceMle(X);
  let sumSquares = 0;
  for (let i = 0; i < nFeatures; i += 1) {
    for (let j = 0; j < nFeatures; j += 1) {
      sumSquares += empCov[i][j] * empCov[i][j];
    }
  }
  const alpha = sumSquares / (nFeatures * nFeatures);
  const mu = empCov.reduce((acc, row, i) => acc + row[i], 0) / nFeatures;
  const muSquared = mu * mu;
  const num = alpha + muSquared;
  const den = (nSamples + 1) * (alpha - muSquared / nFeatures);
  const shrinkage = den === 0 ? 1 : Math.min(num / den, 1);
  const shrunk = Array.from(
    { length: nFeatures },
    (_, i) => Array.from({ length: nFeatures }, (_2, j) => {
      let value = (1 - shrinkage) * empCov[i][j];
      if (i === j) {
        value += shrinkage * mu;
      }
      return value;
    })
  );
  return { covariance: shrunk, shrinkage };
}
function median(values) {
  const sorted = values.slice().sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}
function mad(values, center) {
  const deviations = values.map((value) => Math.abs(value - center));
  return median(deviations);
}
function robustSubset(returns, supportFraction = null) {
  const nObs = returns.length;
  const nAssets = returns[0].length;
  if (nObs <= nAssets + 1) {
    return returns;
  }
  const minSupport = nAssets + 1;
  let h;
  if (supportFraction == null) {
    h = Math.floor((nObs + nAssets + 1) / 2);
  } else {
    if (typeof supportFraction !== "number" || !Number.isFinite(supportFraction) || supportFraction <= 0 || supportFraction > 1) {
      throw new Error("supportFraction must be in (0, 1]");
    }
    h = Math.floor(supportFraction * nObs);
  }
  h = Math.max(minSupport, Math.min(nObs, h));
  const medians = Array.from({ length: nAssets }, (_, colIndex) => median(column(returns, colIndex)));
  const scales = Array.from({ length: nAssets }, (_, colIndex) => {
    const s = mad(column(returns, colIndex), medians[colIndex]);
    return s > 1e-12 ? s : 1;
  });
  const scored = returns.map((row, rowIndex) => {
    let score = 0;
    for (let colIndex = 0; colIndex < nAssets; colIndex += 1) {
      const z = (row[colIndex] - medians[colIndex]) / scales[colIndex];
      score += z * z;
    }
    return { row, rowIndex, score };
  });
  scored.sort((a, b) => a.score === b.score ? a.rowIndex - b.rowIndex : a.score - b.score);
  return scored.slice(0, h).map((item) => item.row);
}
function expCov(prices, {
  returnsData = false,
  span = 180,
  frequency = 252,
  logReturns = false,
  fixMethod = "spectral"
} = {}) {
  const returns = returnsData ? prices : returnsFromPrices(prices, { logReturns });
  validateMatrix("returns", returns);
  const cols = returns[0].length;
  const out = Array.from({ length: cols }, () => Array(cols).fill(0));
  for (let i = 0; i < cols; i += 1) {
    const xi = column(returns, i);
    for (let j = i; j < cols; j += 1) {
      const xj = column(returns, j);
      const cov = pairExpCovariance(xi, xj, span) * frequency;
      out[i][j] = cov;
      out[j][i] = cov;
    }
  }
  return fixNonpositiveSemidefinite(out, { fixMethod });
}
function minCovDeterminant(prices, {
  returnsData = false,
  frequency = 252,
  logReturns = false,
  fixMethod = "spectral",
  supportFraction = null
} = {}) {
  const returns = returnsData ? prices : returnsFromPrices(prices, { logReturns });
  validateMatrix("returns", returns);
  const subset = robustSubset(returns, supportFraction);
  const cov = computeCovarianceMatrix(subset, frequency);
  return fixNonpositiveSemidefinite(cov, { fixMethod });
}
function covToCorr(covMatrix) {
  validateMatrix("covMatrix", covMatrix);
  const stdev = covMatrix.map((row, i) => Math.sqrt(Math.max(row[i], 0)));
  return covMatrix.map(
    (row, i) => row.map((v, j) => {
      const denom = stdev[i] * stdev[j];
      return denom === 0 ? 0 : v / denom;
    })
  );
}
function corrToCov(corrMatrix, stdevs) {
  validateMatrix("corrMatrix", corrMatrix);
  if (!Array.isArray(stdevs) || stdevs.length !== corrMatrix.length) {
    throw new Error("corr_to_cov: stdevs shape mismatch");
  }
  return corrMatrix.map((row, i) => row.map((v, j) => v * stdevs[i] * stdevs[j]));
}
function riskMatrix(prices, { method = "sample_cov", ...kwargs } = {}) {
  switch (method) {
    case "sample_cov":
      return sampleCov(prices, kwargs);
    case "semicovariance":
    case "semivariance":
      return semicovariance(prices, kwargs);
    case "exp_cov":
      return expCov(prices, kwargs);
    case "min_cov_determinant":
      return minCovDeterminant(prices, kwargs);
    default:
      throw new Error(`risk_matrix: method ${method} not implemented`);
  }
}
var CovarianceShrinkage = class {
  constructor(prices, { returnsData = false, frequency = 252, logReturns = false } = {}) {
    this.frequency = frequency;
    this.returns = returnsData ? prices : returnsFromPrices(prices, { logReturns });
    this.sample = computeCovarianceMatrix(this.returns, 1);
    this.S = this.sample;
    this.delta = null;
  }
  _formatAndAnnualize(covDaily) {
    const annualized = covDaily.map((row) => row.map((v) => v * this.frequency));
    return fixNonpositiveSemidefinite(annualized, { fixMethod: "spectral" });
  }
  shrunkCovariance({ delta = 0.2 } = {}) {
    this.delta = delta;
    const n = this.sample.length;
    const avgVar = this.sample.reduce((acc, row, i) => acc + row[i], 0) / n;
    const target = Array.from(
      { length: n },
      (_, i) => Array.from({ length: n }, (_2, j) => i === j ? avgVar : 0)
    );
    const shrunk = this.sample.map(
      (row, i) => row.map((value, j) => delta * target[i][j] + (1 - delta) * value)
    );
    return this._formatAndAnnualize(shrunk);
  }
  ledoitWolf({ shrinkageTarget = "constant_variance" } = {}) {
    if (!["constant_variance", "single_factor", "constant_correlation"].includes(shrinkageTarget)) {
      throw new Error(`ledoit_wolf: target ${shrinkageTarget} not implemented`);
    }
    const X = nanToNumMatrix(this.returns);
    const { covariance: covariance3, shrinkage } = ledoitWolfConstantVariance(X);
    this.delta = shrinkage;
    return this._formatAndAnnualize(covariance3);
  }
  oracleApproximating() {
    const X = nanToNumMatrix(this.returns);
    const { covariance: covariance3, shrinkage } = oasEstimator(X);
    this.delta = shrinkage;
    return this._formatAndAnnualize(covariance3);
  }
};
var _is_positive_semidefinite = isPositiveSemidefinite;
var fix_nonpositive_semidefinite = fixNonpositiveSemidefinite;
var risk_matrix = riskMatrix;
var sample_cov = sampleCov;
var exp_cov = expCov;
var min_cov_determinant = minCovDeterminant;
var cov_to_corr = covToCorr;
var corr_to_cov = corrToCov;

// src/objective_functions.js
function asArray(name, value) {
  if (!Array.isArray(value)) {
    throw new TypeError(`${name} must be an array`);
  }
  return value;
}
function portfolioVariance(weights, covMatrix) {
  const w = asArray("weights", weights);
  validateMatrix("covMatrix", covMatrix);
  const cw = matVec(covMatrix, w);
  return dot(w, cw);
}
function portfolioReturn(weights, expectedReturns, { negative = true } = {}) {
  const w = asArray("weights", weights);
  const mu = asArray("expectedReturns", expectedReturns);
  const ret = dot(w, mu);
  return negative ? -ret : ret;
}
function sharpeRatio(weights, expectedReturns, covMatrix, { riskFreeRate = 0, negative = true } = {}) {
  const mu = portfolioReturn(weights, expectedReturns, { negative: false });
  const sigma = Math.sqrt(Math.max(portfolioVariance(weights, covMatrix), 0));
  if (sigma === 0) {
    return negative ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
  }
  const sr = (mu - riskFreeRate) / sigma;
  return negative ? -sr : sr;
}
function L2Reg(weights, { gamma = 1 } = {}) {
  const w = asArray("weights", weights);
  let sum2 = 0;
  for (const x of w) {
    sum2 += x * x;
  }
  return gamma * sum2;
}
function quadraticUtility(weights, expectedReturns, covMatrix, { riskAversion = 1, negative = true } = {}) {
  const mu = portfolioReturn(weights, expectedReturns, { negative: false });
  const variance = portfolioVariance(weights, covMatrix);
  const value = mu - 0.5 * riskAversion * variance;
  return negative ? -value : value;
}
function transactionCost(weights, previousWeights, { k = 1e-3 } = {}) {
  const w = asArray("weights", weights);
  const wp = asArray("previousWeights", previousWeights);
  if (w.length !== wp.length) {
    throw new Error("weights and previousWeights must have same length");
  }
  let turnover = 0;
  for (let i = 0; i < w.length; i += 1) {
    turnover += Math.abs(w[i] - wp[i]);
  }
  return k * turnover;
}
function exAnteTrackingError(weights, covMatrix, benchmarkWeights) {
  const w = asArray("weights", weights);
  const b = asArray("benchmarkWeights", benchmarkWeights);
  if (w.length !== b.length) {
    throw new Error("weights and benchmarkWeights must have same length");
  }
  const diff = w.map((v, i) => v - b[i]);
  return portfolioVariance(diff, covMatrix);
}
function exPostTrackingError(weights, historicReturns, benchmarkReturns) {
  const w = asArray("weights", weights);
  validateMatrix("historicReturns", historicReturns);
  const bm = asArray("benchmarkReturns", benchmarkReturns);
  if (historicReturns.length !== bm.length) {
    throw new Error("historicReturns and benchmarkReturns lengths must match");
  }
  const activeReturns = historicReturns.map((row, i) => dot(row, w) - bm[i]);
  const mean2 = activeReturns.reduce((acc, v) => acc + v, 0) / activeReturns.length;
  return activeReturns.reduce((acc, v) => {
    const d = v - mean2;
    return acc + d * d;
  }, 0);
}
var portfolio_variance = portfolioVariance;
var portfolio_return = portfolioReturn;
var sharpe_ratio = sharpeRatio;
var L2_reg = L2Reg;
var quadratic_utility = quadraticUtility;
var transaction_cost = transactionCost;
var ex_ante_tracking_error = exAnteTrackingError;
var ex_post_tracking_error = exPostTrackingError;

// src/base_optimizer.js
function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}
function normalizeTickers(nAssets, tickers) {
  if (tickers == null) {
    return Array.from({ length: nAssets }, (_, i) => i);
  }
  if (!Array.isArray(tickers) || tickers.length !== nAssets) {
    throw new Error("tickers must be an array with one label per asset");
  }
  return tickers.slice();
}
function cloneValue(value) {
  if (Array.isArray(value)) {
    return value.map((item) => cloneValue(item));
  }
  if (value instanceof Map) {
    return new Map(Array.from(value.entries(), ([k, v]) => [k, cloneValue(v)]));
  }
  if (value && typeof value === "object" && value.constructor === Object) {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, cloneValue(v)]));
  }
  return value;
}
var BaseOptimizer = class {
  constructor(nAssets, tickers = null) {
    if (!Number.isInteger(nAssets) || nAssets <= 0) {
      throw new Error("nAssets must be a positive integer");
    }
    this.nAssets = nAssets;
    this.tickers = normalizeTickers(nAssets, tickers);
    this._riskFreeRate = null;
    this.weights = null;
  }
  _makeOutputWeights(weights = null) {
    const vector = weights ?? this.weights;
    if (!Array.isArray(vector) || vector.length !== this.nAssets) {
      throw new Error("weights are not set");
    }
    return Object.fromEntries(this.tickers.map((ticker, i) => [ticker, Number(vector[i])]));
  }
  setWeights(inputWeights) {
    if (!inputWeights || typeof inputWeights !== "object") {
      throw new TypeError("inputWeights must be an object keyed by ticker");
    }
    this.weights = this.tickers.map((ticker) => {
      const value = inputWeights[ticker];
      if (!isFiniteNumber(value)) {
        throw new Error(`missing or invalid weight for ticker ${ticker}`);
      }
      return value;
    });
    return void 0;
  }
  cleanWeights({ cutoff = 1e-4, rounding = 5 } = {}) {
    if (this.weights == null) {
      throw new Error("weights have not been set");
    }
    if (rounding != null && (!Number.isInteger(rounding) || rounding < 1)) {
      throw new Error("rounding must be a positive integer");
    }
    const cleaned = this.weights.map((weight) => {
      const clipped = Math.abs(weight) < cutoff ? 0 : weight;
      return rounding == null ? clipped : Number(clipped.toFixed(rounding));
    });
    return this._makeOutputWeights(cleaned);
  }
  set_weights(...args) {
    return this.setWeights(...args);
  }
  clean_weights(...args) {
    return this.cleanWeights(...args);
  }
};
var BaseConvexOptimizer = class extends BaseOptimizer {
  constructor(nAssets, tickers = null, {
    weightBounds = [0, 1],
    solver: solver4 = null,
    verbose = false,
    solverOptions = null
  } = {}) {
    super(nAssets, tickers);
    this._additionalObjectives = [];
    this._constraints = [];
    this._parameters = /* @__PURE__ */ new Map();
    this._solver = solver4;
    this._verbose = verbose;
    this._solverOptions = solverOptions ?? {};
    this._mapBoundsToConstraints(weightBounds);
  }
  _mapBoundsToConstraints(weightBounds) {
    let lower;
    let upper;
    if (Array.isArray(weightBounds) && weightBounds.length === this.nAssets && Array.isArray(weightBounds[0])) {
      lower = weightBounds.map((pair) => pair[0] == null ? -1 : pair[0]);
      upper = weightBounds.map((pair) => pair[1] == null ? 1 : pair[1]);
    } else if (Array.isArray(weightBounds) && weightBounds.length === 2) {
      const lb = weightBounds[0] == null ? -1 : weightBounds[0];
      const ub = weightBounds[1] == null ? 1 : weightBounds[1];
      lower = Array.from({ length: this.nAssets }, () => lb);
      upper = Array.from({ length: this.nAssets }, () => ub);
    } else {
      throw new TypeError("weightBounds must be [lb, ub] or per-asset [[lb, ub], ...]");
    }
    this._lowerBounds = lower;
    this._upperBounds = upper;
    this.addConstraint(() => true);
    this.addConstraint(() => true);
  }
  deepcopy() {
    const copy = Object.create(Object.getPrototypeOf(this));
    for (const [key, value] of Object.entries(this)) {
      copy[key] = cloneValue(value);
    }
    return copy;
  }
  addObjective(objective, kwargs = {}) {
    if (typeof objective !== "function") {
      throw new TypeError("objective must be a function");
    }
    this._additionalObjectives.push({ objective, kwargs });
  }
  addConstraint(constraint) {
    if (typeof constraint !== "function") {
      throw new TypeError("constraint must be a function");
    }
    this._constraints.push(constraint);
  }
  isParameterDefined(parameterName) {
    return this._parameters.has(parameterName);
  }
  updateParameterValue(parameterName, newValue) {
    if (typeof parameterName !== "string" || parameterName.length === 0) {
      throw new TypeError("parameterName must be a non-empty string");
    }
    if (!isFiniteNumber(newValue)) {
      throw new TypeError("newValue must be a finite number");
    }
    this._parameters.set(parameterName, newValue);
  }
  add_objective(...args) {
    return this.addObjective(...args);
  }
  add_constraint(...args) {
    return this.addConstraint(...args);
  }
  is_parameter_defined(...args) {
    return this.isParameterDefined(...args);
  }
  update_parameter_value(...args) {
    return this.updateParameterValue(...args);
  }
};

// src/discrete_allocation.js
var import_javascript_lp_solver = __toESM(require_main3(), 1);
function getLatestPrices(prices) {
  if (!Array.isArray(prices) || prices.length === 0) {
    throw new TypeError("prices must be a non-empty array");
  }
  const first = prices[0];
  if (Array.isArray(first)) {
    const cols = first.length;
    const latest = Array(cols).fill(null);
    for (const row of prices) {
      if (!Array.isArray(row) || row.length !== cols) {
        throw new TypeError("prices rows must be arrays of consistent length");
      }
      for (let c = 0; c < cols; c += 1) {
        if (Number.isFinite(row[c])) {
          latest[c] = row[c];
        }
      }
    }
    if (latest.some((v) => !Number.isFinite(v))) {
      throw new TypeError("could not infer latest finite price for each asset");
    }
    return latest;
  }
  if (typeof first === "object" && first !== null) {
    const latest = {};
    for (const row of prices) {
      if (typeof row !== "object" || row == null || Array.isArray(row)) {
        throw new TypeError("prices rows must be arrays or objects");
      }
      for (const [key, value] of Object.entries(row)) {
        if (Number.isFinite(value)) {
          latest[key] = value;
        }
      }
    }
    const values = Object.values(latest);
    if (values.length === 0 || values.some((v) => !Number.isFinite(v))) {
      throw new TypeError("could not infer latest finite price for each asset");
    }
    return latest;
  }
  throw new TypeError("prices rows must be arrays or objects");
}
function argmax(values) {
  let bestIdx = 0;
  let bestVal = values[0];
  for (let i = 1; i < values.length; i += 1) {
    if (values[i] > bestVal) {
      bestVal = values[i];
      bestIdx = i;
    }
  }
  return bestIdx;
}
function sum(values) {
  return values.reduce((acc, v) => acc + v, 0);
}
function isObjectLike(value) {
  return value && typeof value === "object" && !Array.isArray(value);
}
function toPriceMap(latestPrices) {
  if (Array.isArray(latestPrices)) {
    return Object.fromEntries(latestPrices.map((price, i) => [String(i), price]));
  }
  if (isObjectLike(latestPrices)) {
    return { ...latestPrices };
  }
  throw new TypeError("latestPrices must be an array or object");
}
function removeZeroPositions(allocation) {
  return Object.fromEntries(
    Object.entries(allocation).filter(([, shares]) => shares !== 0)
  );
}
var DiscreteAllocation = class _DiscreteAllocation {
  constructor(weights, latestPrices, { totalPortfolioValue = 1e4, shortRatio = null } = {}) {
    if (!isObjectLike(weights)) {
      throw new TypeError("weights should be an object keyed by ticker");
    }
    if (Object.values(weights).some((value) => !Number.isFinite(value))) {
      throw new TypeError("weights should contain only finite numeric values");
    }
    this.weights = Object.entries(weights);
    this.latestPrices = toPriceMap(latestPrices);
    if (Object.values(this.latestPrices).some((value) => !Number.isFinite(value))) {
      throw new TypeError("latestPrices should contain only finite numeric values");
    }
    if (!(totalPortfolioValue > 0)) {
      throw new Error("totalPortfolioValue must be greater than zero");
    }
    if (shortRatio != null && shortRatio < 0) {
      throw new Error("shortRatio must be non-negative");
    }
    this.totalPortfolioValue = totalPortfolioValue;
    this.shortRatio = shortRatio == null ? this.weights.reduce((acc, [, weight]) => weight < 0 ? acc + -weight : acc, 0) : shortRatio;
  }
  _allocationRmseError() {
    if (!this.allocation) {
      return 0;
    }
    let portfolioValue = 0;
    for (const [ticker, shares] of Object.entries(this.allocation)) {
      portfolioValue += shares * this.latestPrices[ticker];
    }
    if (portfolioValue <= 0) {
      return Number.POSITIVE_INFINITY;
    }
    let sse = 0;
    for (const [ticker, weight] of this.weights) {
      const shares = this.allocation[ticker] ?? 0;
      const allocWeight = shares * this.latestPrices[ticker] / portfolioValue;
      const diff = weight - allocWeight;
      sse += diff * diff;
    }
    return Math.sqrt(sse / this.weights.length);
  }
  _longOnlyGreedy(weightsEntries, availableFunds) {
    const sharesBought = [];
    const buyPrices = [];
    for (const [ticker, weight] of weightsEntries) {
      const price = this.latestPrices[ticker];
      if (!Number.isFinite(price) || price <= 0) {
        throw new Error(`invalid latest price for ticker ${ticker}`);
      }
      const shares = Math.floor(weight * this.totalPortfolioValue / price);
      sharesBought.push(shares);
      buyPrices.push(price);
      availableFunds -= shares * price;
    }
    while (availableFunds > 0) {
      const currentDollar = sharesBought.map((shares, i) => shares * buyPrices[i]);
      const denom = sum(currentDollar);
      if (denom <= 0) {
        break;
      }
      const currentWeights = currentDollar.map((x) => x / denom);
      const idealWeights = weightsEntries.map(([, weight]) => weight);
      const deficit = idealWeights.map((w, i) => w - currentWeights[i]);
      let idx = argmax(deficit);
      let price = buyPrices[idx];
      let counter = 0;
      while (price > availableFunds) {
        deficit[idx] = 0;
        idx = argmax(deficit);
        if (deficit[idx] < 0 || counter === 10) {
          break;
        }
        price = buyPrices[idx];
        counter += 1;
      }
      if (deficit[idx] <= 0 || counter === 10) {
        break;
      }
      sharesBought[idx] += 1;
      availableFunds -= price;
    }
    const allocation = Object.fromEntries(
      weightsEntries.map(([ticker], i) => [ticker, sharesBought[i]])
    );
    return [removeZeroPositions(allocation), availableFunds];
  }
  _longOnlyLp(weightsEntries, budget) {
    const constraints = {
      budget: { max: budget }
    };
    const variables = {};
    const ints = {};
    for (let i = 0; i < weightsEntries.length; i += 1) {
      const [ticker, weight] = weightsEntries[i];
      const price = this.latestPrices[ticker];
      if (!Number.isFinite(price) || price <= 0) {
        throw new Error(`invalid latest price for ticker ${ticker}`);
      }
      const target = weight * this.totalPortfolioValue;
      const xName = `x_${i}`;
      const uName = `u_${i}`;
      const xNonneg = `x_nonneg_${i}`;
      const uNonneg = `u_nonneg_${i}`;
      const posAbs = `pos_abs_${i}`;
      const negAbs = `neg_abs_${i}`;
      constraints[xNonneg] = { min: 0 };
      constraints[uNonneg] = { min: 0 };
      constraints[posAbs] = { max: target };
      constraints[negAbs] = { max: -target };
      variables[xName] = {
        obj: price,
        budget: price,
        [xNonneg]: 1,
        [posAbs]: price,
        [negAbs]: -price
      };
      variables[uName] = {
        obj: -1,
        [uNonneg]: 1,
        [posAbs]: -1,
        [negAbs]: -1
      };
      ints[xName] = 1;
    }
    const model = {
      optimize: "obj",
      opType: "max",
      constraints,
      variables,
      ints
    };
    const result = import_javascript_lp_solver.default.Solve(model);
    if (!result?.feasible) {
      throw new Error("integer LP allocation did not find a feasible solution");
    }
    const allocation = {};
    let spend = 0;
    for (let i = 0; i < weightsEntries.length; i += 1) {
      const [ticker] = weightsEntries[i];
      const xName = `x_${i}`;
      const shares = Math.max(0, Math.round(result[xName] ?? 0));
      allocation[ticker] = shares;
      spend += shares * this.latestPrices[ticker];
    }
    return [removeZeroPositions(allocation), budget - spend];
  }
  greedyPortfolio({ reinvest = false } = {}) {
    this.weights.sort((a, b) => b[1] - a[1]);
    if (this.weights.length > 0 && this.weights[this.weights.length - 1][1] < 0) {
      const longs = Object.fromEntries(this.weights.filter(([, weight]) => weight >= 0));
      const shorts = Object.fromEntries(
        this.weights.filter(([, weight]) => weight < 0).map(([ticker, weight]) => [ticker, -weight])
      );
      const longTotal = sum(Object.values(longs));
      const shortTotal = sum(Object.values(shorts));
      const normalizedLongs = Object.fromEntries(
        Object.entries(longs).map(([ticker, weight]) => [ticker, weight / longTotal])
      );
      const normalizedShorts = Object.fromEntries(
        Object.entries(shorts).map(([ticker, weight]) => [ticker, weight / shortTotal])
      );
      const shortVal = this.totalPortfolioValue * this.shortRatio;
      let longVal = this.totalPortfolioValue;
      if (reinvest) {
        longVal += shortVal;
      }
      const longAlloc = new _DiscreteAllocation(normalizedLongs, this.latestPrices, {
        totalPortfolioValue: longVal
      }).greedyPortfolio();
      const shortAlloc = new _DiscreteAllocation(normalizedShorts, this.latestPrices, {
        totalPortfolioValue: shortVal
      }).greedyPortfolio();
      const combined = { ...longAlloc[0] };
      for (const [ticker, shares] of Object.entries(shortAlloc[0])) {
        combined[ticker] = -shares;
      }
      this.allocation = removeZeroPositions(combined);
      return [this.allocation, longAlloc[1] + shortAlloc[1]];
    }
    const positive = this.weights.filter(([, weight]) => weight > 0);
    const [allocation, leftover] = this._longOnlyGreedy(positive, this.totalPortfolioValue);
    this.allocation = allocation;
    return [allocation, leftover];
  }
  lpPortfolio({ reinvest = false } = {}) {
    this.weights.sort((a, b) => b[1] - a[1]);
    if (this.weights.length > 0 && this.weights[this.weights.length - 1][1] < 0) {
      const longs = Object.fromEntries(this.weights.filter(([, weight]) => weight >= 0));
      const shorts = Object.fromEntries(
        this.weights.filter(([, weight]) => weight < 0).map(([ticker, weight]) => [ticker, -weight])
      );
      const longTotal = sum(Object.values(longs));
      const shortTotal = sum(Object.values(shorts));
      const normalizedLongs = Object.fromEntries(
        Object.entries(longs).map(([ticker, weight]) => [ticker, weight / longTotal])
      );
      const normalizedShorts = Object.fromEntries(
        Object.entries(shorts).map(([ticker, weight]) => [ticker, weight / shortTotal])
      );
      const shortVal = this.totalPortfolioValue * this.shortRatio;
      let longVal = this.totalPortfolioValue;
      if (reinvest) {
        longVal += shortVal;
      }
      const longAlloc = new _DiscreteAllocation(normalizedLongs, this.latestPrices, {
        totalPortfolioValue: longVal
      }).lpPortfolio();
      const shortAlloc = new _DiscreteAllocation(normalizedShorts, this.latestPrices, {
        totalPortfolioValue: shortVal
      }).lpPortfolio();
      const combined = { ...longAlloc[0] };
      for (const [ticker, shares] of Object.entries(shortAlloc[0])) {
        combined[ticker] = -shares;
      }
      this.allocation = removeZeroPositions(combined);
      return [this.allocation, longAlloc[1] + shortAlloc[1]];
    }
    const positive = this.weights.filter(([, weight]) => weight > 0);
    const [allocation, leftover] = this._longOnlyLp(positive, this.totalPortfolioValue);
    this.allocation = allocation;
    return [allocation, leftover];
  }
};
var get_latest_prices = getLatestPrices;

// src/black_litterman.js
function isFiniteNumber2(value) {
  return typeof value === "number" && Number.isFinite(value);
}
function normalizeTickers2(nAssets, tickers) {
  if (tickers == null) {
    return Array.from({ length: nAssets }, (_, i) => String(i));
  }
  if (!Array.isArray(tickers) || tickers.length !== nAssets) {
    throw new Error("tickers must be an array with one label per asset");
  }
  return tickers.map((ticker) => String(ticker));
}
function ensureSquareMatrix(name, matrix2) {
  validateMatrix(name, matrix2);
  if (matrix2.length !== matrix2[0].length) {
    throw new Error(`${name} must be square`);
  }
}
function normalizeMarketCaps(marketCaps, nAssets, tickers = null) {
  let values;
  if (Array.isArray(marketCaps)) {
    values = marketCaps.slice();
  } else if (marketCaps && typeof marketCaps === "object") {
    if (Array.isArray(tickers)) {
      values = tickers.map((ticker) => {
        const value = marketCaps[ticker];
        if (!isFiniteNumber2(value)) {
          throw new Error(`marketCaps missing value for ticker ${ticker}`);
        }
        return value;
      });
    } else {
      values = Object.values(marketCaps);
    }
  } else {
    throw new TypeError("marketCaps must be an array or object");
  }
  if (values.length !== nAssets) {
    throw new Error("market_caps length must match number of assets");
  }
  if (!values.every(isFiniteNumber2)) {
    throw new Error("marketCaps contains non-finite values");
  }
  const total = values.reduce((acc, value) => acc + value, 0);
  if (Math.abs(total) < 1e-16) {
    throw new Error("marketCaps sum cannot be zero");
  }
  return values.map((value) => value / total);
}
function toVector(name, value, expectedLength = null) {
  if (!Array.isArray(value)) {
    throw new TypeError(`${name} must be an array`);
  }
  let vector;
  if (value.length > 0 && Array.isArray(value[0])) {
    vector = value.map((row) => {
      if (!Array.isArray(row) || row.length !== 1 || !isFiniteNumber2(row[0])) {
        throw new Error(`${name} must be a numeric vector`);
      }
      return row[0];
    });
  } else {
    vector = value.slice();
  }
  if (!vector.every(isFiniteNumber2)) {
    throw new Error(`${name} contains non-finite values`);
  }
  if (expectedLength != null && vector.length !== expectedLength) {
    throw new Error(`${name} length mismatch`);
  }
  return vector;
}
function vectorToColumnMatrix(vector) {
  return new Matrix2(vector.map((value) => [value]));
}
function matrixColumnToVector(matrix2) {
  if (matrix2.columns !== 1) {
    throw new Error("expected a column matrix");
  }
  const out = [];
  for (let i = 0; i < matrix2.rows; i += 1) {
    out.push(matrix2.get(i, 0));
  }
  return out;
}
function solveLinearSystem(A, b) {
  try {
    return inverse2(A).mmul(b);
  } catch {
    return pseudoInverse2(A).mmul(b);
  }
}
function cloneMatrix2d(matrix2) {
  return matrix2.map((row) => row.slice());
}
function identity(n) {
  return Array.from(
    { length: n },
    (_, i) => Array.from({ length: n }, (_2, j) => i === j ? 1 : 0)
  );
}
function parseAbsoluteViews(absoluteViews, tickers, nAssets) {
  if (!absoluteViews || typeof absoluteViews !== "object" || Array.isArray(absoluteViews)) {
    throw new TypeError("absoluteViews must be an object keyed by ticker");
  }
  const entries = Object.entries(absoluteViews);
  const Q = [];
  const P = [];
  for (const [ticker, value] of entries) {
    if (!isFiniteNumber2(value)) {
      throw new Error("absoluteViews contains non-finite view values");
    }
    const idx = tickers.indexOf(String(ticker));
    if (idx < 0) {
      throw new Error(`absoluteViews contains unknown ticker: ${ticker}`);
    }
    const row = Array.from({ length: nAssets }, () => 0);
    row[idx] = 1;
    Q.push(value);
    P.push(row);
  }
  if (Q.length === 0) {
    throw new Error("absoluteViews cannot be empty");
  }
  return { Q, P };
}
function parseQAndP(QRaw, PRaw, nAssets) {
  const Q = toVector("Q", QRaw);
  let P;
  if (PRaw == null) {
    if (Q.length !== nAssets) {
      throw new Error("P is required unless one view is provided for each asset");
    }
    P = identity(nAssets);
  } else {
    validateMatrix("P", PRaw);
    if (PRaw.length !== Q.length || PRaw[0].length !== nAssets) {
      throw new Error("P must have shape [numViews x nAssets]");
    }
    P = cloneMatrix2d(PRaw);
  }
  return { Q, P };
}
function parsePi(piRaw, { nAssets, tickers, covMatrix, riskAversion, marketCaps, riskFreeRate }) {
  if (piRaw == null) {
    return Array.from({ length: nAssets }, () => 0);
  }
  if (piRaw === "equal") {
    return Array.from({ length: nAssets }, () => 1 / nAssets);
  }
  if (piRaw === "market") {
    if (marketCaps == null) {
      throw new Error('pi="market" requires marketCaps');
    }
    return marketImpliedPriorReturns(marketCaps, riskAversion, covMatrix, { riskFreeRate, tickers });
  }
  if (Array.isArray(piRaw)) {
    return toVector("pi", piRaw, nAssets);
  }
  if (piRaw && typeof piRaw === "object") {
    return tickers.map((ticker) => {
      const value = piRaw[ticker];
      if (!isFiniteNumber2(value)) {
        throw new Error(`pi missing value for ticker ${ticker}`);
      }
      return value;
    });
  }
  throw new TypeError('pi must be an array, object, "equal", "market", or null');
}
function parseOmega(omegaRaw, nViews) {
  if (Array.isArray(omegaRaw) && omegaRaw.length === nViews && !Array.isArray(omegaRaw[0])) {
    const diag = omegaRaw;
    if (!diag.every(isFiniteNumber2)) {
      throw new Error("omega diagonal contains non-finite values");
    }
    return Array.from(
      { length: nViews },
      (_, i) => Array.from({ length: nViews }, (_2, j) => i === j ? diag[i] : 0)
    );
  }
  validateMatrix("omega", omegaRaw);
  if (omegaRaw.length !== nViews || omegaRaw[0].length !== nViews) {
    throw new Error("omega must have shape [numViews x numViews]");
  }
  return cloneMatrix2d(omegaRaw);
}
function marketImpliedPriorReturns(marketCaps, riskAversion, covMatrix, { riskFreeRate = 0, tickers = null } = {}) {
  ensureSquareMatrix("covMatrix", covMatrix);
  const weights = normalizeMarketCaps(marketCaps, covMatrix.length, tickers);
  const implied = matVec(covMatrix, weights);
  return implied.map((v) => riskAversion * v + riskFreeRate);
}
function marketImpliedRiskAversion(marketPrices, { frequency = 252, riskFreeRate = 0 } = {}) {
  if (!Array.isArray(marketPrices) || marketPrices.length < 2) {
    throw new Error("market_prices must contain at least 2 prices");
  }
  const returns = [];
  for (let i = 1; i < marketPrices.length; i += 1) {
    returns.push(marketPrices[i] / marketPrices[i - 1] - 1);
  }
  const mean2 = returns.reduce((acc, v) => acc + v, 0) / returns.length;
  const variance = returns.reduce((acc, v) => acc + (v - mean2) ** 2, 0) / Math.max(returns.length - 1, 1);
  return (mean2 * frequency - riskFreeRate) / (variance * frequency);
}
var BlackLittermanModel = class _BlackLittermanModel {
  constructor(covMatrix, options = {}) {
    ensureSquareMatrix("covMatrix", covMatrix);
    const {
      pi = null,
      absoluteViews = options.absolute_views,
      Q = null,
      P = null,
      omega = null,
      viewConfidences = options.view_confidences,
      tau = 0.05,
      riskAversion = options.risk_aversion ?? 1,
      marketCaps = options.market_caps,
      riskFreeRate = options.risk_free_rate ?? 0,
      tickers = null
    } = options;
    if (!isFiniteNumber2(tau) || tau <= 0 || tau > 1) {
      throw new Error("tau must be in (0, 1]");
    }
    if (!isFiniteNumber2(riskAversion) || riskAversion <= 0) {
      throw new Error("riskAversion must be positive");
    }
    this.covMatrix = cloneMatrix2d(covMatrix);
    this.nAssets = covMatrix.length;
    this.tickers = normalizeTickers2(this.nAssets, tickers);
    this.tau = tau;
    this.riskAversion = riskAversion;
    this.riskFreeRate = riskFreeRate;
    if (absoluteViews != null) {
      const parsed = parseAbsoluteViews(absoluteViews, this.tickers, this.nAssets);
      this.Q = parsed.Q;
      this.P = parsed.P;
    } else {
      if (Q == null) {
        throw new TypeError("BlackLittermanModel requires Q or absoluteViews");
      }
      const parsed = parseQAndP(Q, P, this.nAssets);
      this.Q = parsed.Q;
      this.P = parsed.P;
    }
    this.pi = parsePi(pi, {
      nAssets: this.nAssets,
      tickers: this.tickers,
      covMatrix: this.covMatrix,
      riskAversion: this.riskAversion,
      marketCaps,
      riskFreeRate: this.riskFreeRate
    });
    if (omega == null || omega === "default") {
      this.omega = _BlackLittermanModel.defaultOmega(this.covMatrix, this.P, this.tau);
    } else if (omega === "idzorek") {
      if (viewConfidences == null) {
        throw new Error('omega="idzorek" requires viewConfidences');
      }
      this.omega = _BlackLittermanModel.idzorekMethod(
        viewConfidences,
        this.covMatrix,
        this.pi,
        this.Q,
        this.P,
        this.tau
      );
    } else {
      this.omega = parseOmega(omega, this.Q.length);
    }
    if (this.omega.length !== this.Q.length || this.omega[0].length !== this.Q.length) {
      throw new Error("omega shape mismatch with number of views");
    }
    this.posteriorReturns = null;
    this.posteriorCov = null;
    this.weights = null;
    this._tauSigmaP = null;
    this._A = null;
  }
  _vectorToSeries(vector) {
    return Object.fromEntries(this.tickers.map((ticker, i) => [ticker, vector[i]]));
  }
  _seriesToVector(series, fieldName = "values") {
    if (Array.isArray(series)) {
      return toVector(fieldName, series, this.nAssets);
    }
    if (series && typeof series === "object") {
      return this.tickers.map((ticker) => {
        const value = series[ticker];
        if (!isFiniteNumber2(value)) {
          throw new Error(`${fieldName} missing value for ticker ${ticker}`);
        }
        return value;
      });
    }
    throw new TypeError(`${fieldName} must be an array or object keyed by ticker`);
  }
  _ensureIntermediates() {
    if (this._tauSigmaP == null) {
      const cov = new Matrix2(this.covMatrix);
      const P = new Matrix2(this.P);
      this._tauSigmaP = cov.clone().mul(this.tau).mmul(P.transpose());
    }
    if (this._A == null) {
      const P = new Matrix2(this.P);
      const omega = new Matrix2(this.omega);
      this._A = P.mmul(this._tauSigmaP).add(omega);
    }
  }
  static defaultOmega(covMatrix, P, tau) {
    ensureSquareMatrix("covMatrix", covMatrix);
    validateMatrix("P", P);
    if (!isFiniteNumber2(tau) || tau <= 0) {
      throw new Error("tau must be positive");
    }
    if (P[0].length !== covMatrix.length) {
      throw new Error("P must have as many columns as covMatrix assets");
    }
    const projected = new Matrix2(P).mmul(new Matrix2(covMatrix)).mmul(new Matrix2(P).transpose());
    const out = Array.from({ length: projected.rows }, () => Array(projected.rows).fill(0));
    for (let i = 0; i < projected.rows; i += 1) {
      out[i][i] = projected.get(i, i) * tau;
    }
    return out;
  }
  static idzorekMethod(viewConfidences, covMatrix, pi, Q, P, tau) {
    ensureSquareMatrix("covMatrix", covMatrix);
    validateMatrix("P", P);
    const confidences = toVector("viewConfidences", viewConfidences, Q.length);
    const base = _BlackLittermanModel.defaultOmega(covMatrix, P, tau);
    const out = Array.from({ length: Q.length }, () => Array(Q.length).fill(0));
    for (let i = 0; i < Q.length; i += 1) {
      const conf = confidences[i];
      if (conf < 0 || conf > 1) {
        throw new Error("view confidences must be between 0 and 1");
      }
      if (conf === 0) {
        out[i][i] = 1e6;
        continue;
      }
      const alpha = (1 - conf) / conf;
      out[i][i] = alpha * base[i][i];
    }
    return out;
  }
  blReturns() {
    this._ensureIntermediates();
    const pi = vectorToColumnMatrix(this.pi);
    const Q = vectorToColumnMatrix(this.Q);
    const P = new Matrix2(this.P);
    const b = Q.sub(P.mmul(pi));
    const solution = solveLinearSystem(this._A, b);
    const post = pi.add(this._tauSigmaP.mmul(solution));
    this.posteriorReturns = matrixColumnToVector(post);
    return this._vectorToSeries(this.posteriorReturns);
  }
  blCov() {
    this._ensureIntermediates();
    const tauCov = new Matrix2(this.covMatrix).mul(this.tau);
    const mSolution = solveLinearSystem(this._A, this._tauSigmaP.transpose());
    const M = tauCov.sub(this._tauSigmaP.mmul(mSolution));
    this.posteriorCov = new Matrix2(this.covMatrix).add(M).to2DArray();
    return cloneMatrix2d(this.posteriorCov);
  }
  blWeights(riskAversion = null) {
    const delta = riskAversion ?? this.riskAversion;
    if (!isFiniteNumber2(delta) || delta <= 0) {
      throw new Error("riskAversion must be positive");
    }
    if (this.posteriorReturns == null) {
      this.blReturns();
    }
    const A = new Matrix2(this.covMatrix).mul(delta);
    const b = vectorToColumnMatrix(this.posteriorReturns);
    const raw = matrixColumnToVector(solveLinearSystem(A, b));
    const sum2 = raw.reduce((acc, value) => acc + value, 0);
    if (Math.abs(sum2) < 1e-16) {
      throw new Error("posterior-implied weights sum is zero");
    }
    this.weights = raw.map((value) => value / sum2);
    return this._vectorToSeries(this.weights);
  }
  optimize(riskAversion = null) {
    return this.blWeights(riskAversion);
  }
  setWeights(weights) {
    this.weights = this._seriesToVector(weights, "weights");
    return this._vectorToSeries(this.weights);
  }
  set_weights(...args) {
    return this.setWeights(...args);
  }
  cleanWeights({ cutoff = 1e-4, rounding = 5 } = {}) {
    if (this.weights == null) {
      throw new Error("weights have not been set");
    }
    const cleaned = this.weights.map((weight) => {
      const clipped = Math.abs(weight) < cutoff ? 0 : weight;
      return Number(clipped.toFixed(rounding));
    });
    return this._vectorToSeries(cleaned);
  }
  clean_weights(...args) {
    return this.cleanWeights(...args);
  }
  portfolioPerformance({ riskFreeRate = this.riskFreeRate, risk_free_rate = null } = {}) {
    if (this.weights == null) {
      throw new Error("portfolio_performance requires weights to be computed first");
    }
    const rf = risk_free_rate == null ? riskFreeRate : risk_free_rate;
    if (this.posteriorReturns == null) {
      this.blReturns();
    }
    if (this.posteriorCov == null) {
      this.blCov();
    }
    const expectedReturn = dot(this.weights, this.posteriorReturns);
    const variance = dot(this.weights, matVec(this.posteriorCov, this.weights));
    const volatility = Math.sqrt(Math.max(variance, 0));
    const sharpe = volatility === 0 ? Number.POSITIVE_INFINITY : (expectedReturn - rf) / volatility;
    return [expectedReturn, volatility, sharpe];
  }
  // Python aliases
  static default_omega(...args) {
    return _BlackLittermanModel.defaultOmega(...args);
  }
  static idzorek_method(...args) {
    return _BlackLittermanModel.idzorekMethod(...args);
  }
  bl_returns(...args) {
    return this.blReturns(...args);
  }
  bl_cov(...args) {
    return this.blCov(...args);
  }
  bl_weights(...args) {
    return this.blWeights(...args);
  }
  portfolio_performance(...args) {
    return this.portfolioPerformance(...args);
  }
};
var market_implied_prior_returns = marketImpliedPriorReturns;
var market_implied_risk_aversion = marketImpliedRiskAversion;

// src/custom.js
function isFiniteNumber3(value) {
  return typeof value === "number" && Number.isFinite(value);
}
function validateReturnsMatrix(returns) {
  if (!Array.isArray(returns) || returns.length === 0 || !Array.isArray(returns[0])) {
    throw new TypeError("returns must be a non-empty 2D numeric array");
  }
  const nAssets = returns[0].length;
  if (nAssets === 0) {
    throw new Error("returns must contain at least one asset column");
  }
  for (const row of returns) {
    if (!Array.isArray(row) || row.length !== nAssets) {
      throw new Error("returns must be a rectangular matrix");
    }
    if (!row.every(isFiniteNumber3)) {
      throw new Error("returns contains non-finite values");
    }
  }
  return nAssets;
}
function normalizeTickers3(tickers, nAssets) {
  if (tickers == null) {
    return null;
  }
  if (!Array.isArray(tickers) || tickers.length !== nAssets) {
    throw new Error("tickers must be an array with one label per asset");
  }
  return tickers.map((ticker) => String(ticker));
}
function parseMu(mu, tickers, nAssets) {
  if (mu == null) {
    return null;
  }
  if (Array.isArray(mu)) {
    if (mu.length !== nAssets || !mu.every(isFiniteNumber3)) {
      throw new Error("mu must be a numeric array with one value per asset");
    }
    return mu.slice();
  }
  if (mu && typeof mu === "object") {
    if (tickers == null) {
      throw new Error("mu as object requires tickers");
    }
    return tickers.map((ticker) => {
      const value = mu[ticker];
      if (!isFiniteNumber3(value)) {
        throw new Error(`mu missing value for ticker ${ticker}`);
      }
      return value;
    });
  }
  throw new TypeError("mu must be null, an array, or an object keyed by ticker");
}
function columnSampleVariance(matrix2) {
  const nRows = matrix2.length;
  const nCols = matrix2[0].length;
  const means = Array.from({ length: nCols }, () => 0);
  for (const row of matrix2) {
    for (let j = 0; j < nCols; j += 1) {
      means[j] += row[j];
    }
  }
  for (let j = 0; j < nCols; j += 1) {
    means[j] /= nRows;
  }
  const variances = Array.from({ length: nCols }, () => 0);
  for (const row of matrix2) {
    for (let j = 0; j < nCols; j += 1) {
      const d = row[j] - means[j];
      variances[j] += d * d;
    }
  }
  const denom = Math.max(nRows - 1, 1);
  for (let j = 0; j < nCols; j += 1) {
    variances[j] /= denom;
  }
  return variances;
}
function replaceZerosWithSmallestPositive(values, fallback = 1e-6) {
  const positive = values.filter((v) => v > 0);
  const floor = positive.length > 0 ? Math.min(...positive) : fallback;
  return values.map((v) => v === 0 ? floor : v);
}
function normalizeWeights(weights) {
  const total = weights.reduce((acc, v) => acc + v, 0);
  if (!isFiniteNumber3(total) || Math.abs(total) < 1e-16) {
    throw new Error("prior weights sum cannot be zero");
  }
  return weights.map((v) => v / total);
}
function equalWeighted(nAssets) {
  return Array.from({ length: nAssets }, () => 1 / nAssets);
}
function toOutput(vector, tickers) {
  if (tickers == null) {
    return vector.slice();
  }
  return Object.fromEntries(tickers.map((ticker, i) => [ticker, vector[i]]));
}
function getPrior(returns, { mu = null, priorMethod = "equal_weighted", priorBlendAlpha = 0.5, tickers = null } = {}) {
  const nAssets = validateReturnsMatrix(returns);
  const normalizedTickers = normalizeTickers3(tickers, nAssets);
  const muVector = parseMu(mu, normalizedTickers, nAssets);
  let weights;
  if (priorMethod === "risk_parity") {
    const variance = columnSampleVariance(returns);
    const vol = replaceZerosWithSmallestPositive(variance.map((v) => Math.sqrt(v)));
    weights = normalizeWeights(vol.map((v) => 1 / v));
  } else if (priorMethod === "inverse_variance") {
    const variance = replaceZerosWithSmallestPositive(columnSampleVariance(returns));
    weights = normalizeWeights(variance.map((v) => 1 / v));
  } else if (priorMethod === "momentum_positive") {
    if (muVector == null) {
      throw new Error("For 'momentum_positive' you must provide 'mu'");
    }
    const muPos = muVector.map((v) => Math.max(v, 0));
    const sumPos = muPos.reduce((acc, v) => acc + v, 0);
    weights = sumPos <= 0 ? equalWeighted(nAssets) : muPos.map((v) => v / sumPos);
  } else if (priorMethod === "blend_eq_inv_vol") {
    const variance = columnSampleVariance(returns);
    const vol = replaceZerosWithSmallestPositive(variance.map((v) => Math.sqrt(v)));
    const invVol = normalizeWeights(vol.map((v) => 1 / v));
    const alpha = Math.min(Math.max(priorBlendAlpha, 0), 1);
    const eq = equalWeighted(nAssets);
    weights = eq.map((w, i) => alpha * w + (1 - alpha) * invVol[i]);
  } else if (priorMethod === "equal_weighted") {
    weights = equalWeighted(nAssets);
  } else {
    throw new Error(`Unsupported prior_method: ${priorMethod}`);
  }
  return toOutput(weights, normalizedTickers);
}

// src/efficient_frontier/_base.js
function isFiniteNumber4(value) {
  return typeof value === "number" && Number.isFinite(value);
}
function cloneValue2(value) {
  if (Array.isArray(value)) {
    return value.map((item) => cloneValue2(item));
  }
  if (value instanceof Map) {
    return new Map(Array.from(value.entries(), ([k, v]) => [k, cloneValue2(v)]));
  }
  if (value && typeof value === "object" && value.constructor === Object) {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, cloneValue2(v)]));
  }
  return value;
}
function normalizeTickers4(nAssets, tickers) {
  if (tickers == null) {
    return Array.from({ length: nAssets }, (_, i) => String(i));
  }
  if (!Array.isArray(tickers) || tickers.length !== nAssets) {
    throw new Error("tickers must be an array with one label per asset");
  }
  return tickers.map((t) => String(t));
}
var BaseOptimizerAdapter = class {
  constructor(expectedReturns, covarianceOrReturns, { weightBounds = [0, 1], tickers = null } = {}) {
    if (!Array.isArray(expectedReturns) || expectedReturns.length === 0) {
      throw new TypeError("expectedReturns must be a non-empty numeric array");
    }
    if (!expectedReturns.every(isFiniteNumber4)) {
      throw new Error("expectedReturns contains non-finite values");
    }
    this.expectedReturns = expectedReturns.slice();
    this.nAssets = expectedReturns.length;
    this.tickers = normalizeTickers4(this.nAssets, tickers);
    this.data = covarianceOrReturns;
    this.weightBounds = weightBounds;
    this.weights = null;
    this._additionalObjectives = [];
    this._additionalConstraints = [];
    this._parameters = /* @__PURE__ */ new Map();
  }
  _mapVectorToWeights(vector) {
    return Object.fromEntries(this.tickers.map((ticker, i) => [ticker, vector[i]]));
  }
  _mapWeightsToVector(weights) {
    if (Array.isArray(weights)) {
      if (weights.length !== this.nAssets) {
        throw new Error("weights array length mismatch");
      }
      return weights.slice();
    }
    if (weights && typeof weights === "object") {
      return this.tickers.map((ticker) => {
        const value = weights[ticker];
        if (!isFiniteNumber4(value)) {
          throw new Error(`missing or invalid weight for ticker ${ticker}`);
        }
        return value;
      });
    }
    throw new TypeError("weights must be an array or an object keyed by ticker");
  }
  setWeights(weights) {
    this.weights = this._mapWeightsToVector(weights);
    return this._mapVectorToWeights(this.weights);
  }
  set_weights(weights) {
    return this.setWeights(weights);
  }
  cleanWeights({ cutoff = 1e-4, rounding = 5 } = {}) {
    if (this.weights == null) {
      throw new Error("weights have not been set");
    }
    const cleaned = this.weights.map((w) => {
      const clipped = Math.abs(w) < cutoff ? 0 : w;
      return Number(clipped.toFixed(rounding));
    });
    return this._mapVectorToWeights(cleaned);
  }
  clean_weights(options = {}) {
    return this.cleanWeights(options);
  }
  addObjective(objective, kwargs = {}) {
    if (typeof objective !== "function") {
      throw new TypeError("objective must be a function");
    }
    this._additionalObjectives.push({ objective, kwargs });
  }
  add_objective(objective, kwargs = {}) {
    return this.addObjective(objective, kwargs);
  }
  addConstraint(constraint) {
    if (typeof constraint !== "function") {
      throw new TypeError("constraint must be a function");
    }
    this._additionalConstraints.push(constraint);
  }
  add_constraint(constraint) {
    return this.addConstraint(constraint);
  }
  deepcopy() {
    const copy = Object.create(Object.getPrototypeOf(this));
    for (const [key, value] of Object.entries(this)) {
      copy[key] = cloneValue2(value);
    }
    return copy;
  }
  isParameterDefined(name) {
    return this._parameters.has(name);
  }
  updateParameterValue(name, value) {
    if (typeof name !== "string" || name.length === 0) {
      throw new TypeError("parameter name must be a non-empty string");
    }
    if (!isFiniteNumber4(value)) {
      throw new TypeError("parameter value must be a finite number");
    }
    this._parameters.set(name, value);
  }
  is_parameter_defined(...args) {
    return this.isParameterDefined(...args);
  }
  update_parameter_value(...args) {
    return this.updateParameterValue(...args);
  }
  _extraPenalty(weights) {
    let penalty = 0;
    for (const { objective, kwargs } of this._additionalObjectives) {
      const value = objective(weights, kwargs);
      if (typeof value === "number" && Number.isFinite(value)) {
        penalty += value;
      }
    }
    for (const constraint of this._additionalConstraints) {
      const value = constraint(weights);
      if (typeof value === "boolean") {
        if (!value) {
          penalty += 1e6;
        }
      } else if (typeof value === "number" && Number.isFinite(value)) {
        penalty += Math.max(0, value) ** 2 * 1e4;
      }
    }
    return penalty;
  }
  portfolioPerformance({ riskFreeRate = 0 } = {}) {
    if (this.weights == null) {
      throw new Error("portfolio_performance requires weights to be computed first");
    }
    const expectedReturn = portfolioReturn(this.weights, this.expectedReturns, { negative: false });
    const volatility = Math.sqrt(Math.max(portfolioVariance(this.weights, this.covMatrix), 0));
    const sharpe = sharpeRatio(this.weights, this.expectedReturns, this.covMatrix, {
      riskFreeRate,
      negative: false
    });
    return [expectedReturn, volatility, sharpe];
  }
  portfolio_performance(options = {}) {
    return this.portfolioPerformance(options);
  }
  _notImplemented(name) {
    throw new Error(`${name} is not implemented yet in the pure JS optimizer backend`);
  }
};

// src/efficient_frontier/efficient_frontier.js
var import_quadprog = __toESM(require_quadprog2(), 1);
function parseWeightBounds(weightBounds, nAssets) {
  const isNumber = (v) => typeof v === "number" && Number.isFinite(v);
  if (Array.isArray(weightBounds) && weightBounds.length === nAssets && Array.isArray(weightBounds[0])) {
    const lower = [];
    const upper = [];
    for (const pair of weightBounds) {
      if (!Array.isArray(pair) || pair.length !== 2) {
        throw new Error("weightBounds per-asset format must be [[lb, ub], ...]");
      }
      const [lbRaw, ubRaw] = pair;
      const lb = lbRaw == null ? -1 : lbRaw;
      const ub = ubRaw == null ? 1 : ubRaw;
      if (!isNumber(lb) || !isNumber(ub) || lb > ub) {
        throw new Error("invalid per-asset weight bounds");
      }
      lower.push(lb);
      upper.push(ub);
    }
    return { lower, upper };
  }
  if (Array.isArray(weightBounds) && weightBounds.length === 2 && Array.isArray(weightBounds[0]) && Array.isArray(weightBounds[1]) && weightBounds[0].length === nAssets && weightBounds[1].length === nAssets) {
    const lower = weightBounds[0].map((v) => v == null ? -1 : v);
    const upper = weightBounds[1].map((v) => v == null ? 1 : v);
    for (let i = 0; i < nAssets; i += 1) {
      if (!isNumber(lower[i]) || !isNumber(upper[i]) || lower[i] > upper[i]) {
        throw new Error("invalid vectorized weight bounds");
      }
    }
    return { lower, upper };
  }
  if (Array.isArray(weightBounds) && weightBounds.length === 2) {
    const lb = weightBounds[0] == null ? -1 : weightBounds[0];
    const ub = weightBounds[1] == null ? 1 : weightBounds[1];
    if (!isNumber(lb) || !isNumber(ub) || lb > ub) {
      throw new Error("invalid scalar weight bounds");
    }
    return {
      lower: Array.from({ length: nAssets }, () => lb),
      upper: Array.from({ length: nAssets }, () => ub)
    };
  }
  throw new Error("weightBounds format not supported");
}
function projectBoundedSimplex(vector, lower, upper, targetSum = 1) {
  const n = vector.length;
  const lowerSum = lower.reduce((acc, v) => acc + v, 0);
  const upperSum = upper.reduce((acc, v) => acc + v, 0);
  const clampedTarget = Math.min(Math.max(targetSum, lowerSum), upperSum);
  let lo = Number.POSITIVE_INFINITY;
  let hi = Number.NEGATIVE_INFINITY;
  for (let i = 0; i < n; i += 1) {
    lo = Math.min(lo, vector[i] - upper[i]);
    hi = Math.max(hi, vector[i] - lower[i]);
  }
  const clipped = (x, i) => Math.min(Math.max(x, lower[i]), upper[i]);
  const summedAt = (lambda2) => {
    let sum2 = 0;
    for (let i = 0; i < n; i += 1) {
      sum2 += clipped(vector[i] - lambda2, i);
    }
    return sum2;
  };
  for (let iter = 0; iter < 120; iter += 1) {
    const mid = (lo + hi) / 2;
    const s = summedAt(mid);
    if (s > clampedTarget) {
      lo = mid;
    } else {
      hi = mid;
    }
  }
  const lambda = (lo + hi) / 2;
  const out = Array(n);
  for (let i = 0; i < n; i += 1) {
    out[i] = clipped(vector[i] - lambda, i);
  }
  return out;
}
function numericalGradient(fn, w) {
  const grad = Array(w.length).fill(0);
  for (let i = 0; i < w.length; i += 1) {
    const eps = 1e-6 * Math.max(1, Math.abs(w[i]));
    const up = w.slice();
    const down = w.slice();
    up[i] += eps;
    down[i] -= eps;
    grad[i] = (fn(up) - fn(down)) / (2 * eps);
  }
  return grad;
}
function l2Norm(vector) {
  return Math.sqrt(vector.reduce((acc, v) => acc + v * v, 0));
}
function linspace(start, end, points) {
  if (points <= 1) {
    return [start];
  }
  const out = [];
  const step = (end - start) / (points - 1);
  for (let i = 0; i < points; i += 1) {
    out.push(start + step * i);
  }
  return out;
}
function to1BasedVector(values) {
  return [0, ...values];
}
function to1BasedMatrix(matrix2) {
  return [[], ...matrix2.map((row) => [0, ...row])];
}
function addDiagonalJitter(matrix2, jitter) {
  return matrix2.map((row, i) => row.map((value, j) => i === j ? value + jitter : value));
}
var EfficientFrontier = class extends BaseOptimizerAdapter {
  constructor(expectedReturns, covMatrix, options = {}) {
    super(expectedReturns, covMatrix, options);
    this.covMatrix = covMatrix;
    if (!Array.isArray(covMatrix) || covMatrix.length !== this.nAssets || !covMatrix.every((row) => Array.isArray(row) && row.length === this.nAssets)) {
      throw new Error("covMatrix shape mismatch with expectedReturns");
    }
    const { lower, upper } = parseWeightBounds(options.weightBounds ?? [0, 1], this.nAssets);
    this._lowerBounds = lower;
    this._upperBounds = upper;
    this._targetSum = 1;
  }
  _initialWeights() {
    const equal = Array.from({ length: this.nAssets }, () => 1 / this.nAssets);
    return projectBoundedSimplex(equal, this._lowerBounds, this._upperBounds, this._targetSum);
  }
  _optimize(objective, { maxIter = 800, learningRate = 0.05, tolerance = 1e-9 } = {}) {
    let w = this._initialWeights();
    let bestW = w.slice();
    let bestVal = objective(w);
    let lr = learningRate;
    for (let iter = 0; iter < maxIter; iter += 1) {
      const grad = numericalGradient(objective, w);
      const candidateRaw = w.map((v, i) => v - lr * grad[i]);
      const candidate = projectBoundedSimplex(
        candidateRaw,
        this._lowerBounds,
        this._upperBounds,
        this._targetSum
      );
      const candidateVal = objective(candidate);
      if (Number.isFinite(candidateVal) && candidateVal <= bestVal + 1e-12) {
        const stepNorm = l2Norm(candidate.map((v, i) => v - w[i]));
        w = candidate;
        bestW = candidate.slice();
        bestVal = candidateVal;
        lr = Math.min(lr * 1.05, 0.2);
        if (stepNorm < tolerance) {
          break;
        }
      } else {
        lr *= 0.5;
        if (lr < 1e-7) {
          break;
        }
      }
    }
    this.weights = bestW;
    return this._mapVectorToWeights(bestW);
  }
  _portfolioReturn(weights) {
    return portfolioReturn(weights, this.expectedReturns, { negative: false });
  }
  _portfolioVariance(weights) {
    return portfolioVariance(weights, this.covMatrix);
  }
  _penalized(objective) {
    return (w) => objective(w) + this._extraPenalty(w);
  }
  _canUseExactQp() {
    return this._additionalObjectives.length === 0 && this._additionalConstraints.length === 0;
  }
  _isFeasibleTargetSum(targetSum) {
    const minSum = this._lowerBounds.reduce((acc, v) => acc + v, 0);
    const maxSum = this._upperBounds.reduce((acc, v) => acc + v, 0);
    return targetSum >= minSum - 1e-10 && targetSum <= maxSum + 1e-10;
  }
  _buildConstraintSets({ targetSum = 1, minReturn = null } = {}) {
    const eqConstraints = [{ a: Array(this.nAssets).fill(1), b: targetSum }];
    const ineqConstraints = [];
    for (let i = 0; i < this.nAssets; i += 1) {
      const lower = this._lowerBounds[i];
      const upper = this._upperBounds[i];
      const aLower = Array(this.nAssets).fill(0);
      const aUpper = Array(this.nAssets).fill(0);
      aLower[i] = 1;
      aUpper[i] = -1;
      ineqConstraints.push({ a: aLower, b: lower });
      ineqConstraints.push({ a: aUpper, b: -upper });
    }
    if (minReturn != null) {
      ineqConstraints.push({ a: this.expectedReturns.slice(), b: minReturn });
    }
    return { eqConstraints, ineqConstraints };
  }
  _solveQp({ D, d, eqConstraints = [], ineqConstraints = [] }) {
    const n = this.nAssets;
    const allConstraints = [...eqConstraints, ...ineqConstraints];
    const q = allConstraints.length;
    const meq = eqConstraints.length;
    const Amat = Array.from({ length: n + 1 }, () => Array(q + 1).fill(0));
    const bvec = Array(q + 1).fill(0);
    for (let j = 1; j <= q; j += 1) {
      const { a, b } = allConstraints[j - 1];
      bvec[j] = b;
      for (let i = 1; i <= n; i += 1) {
        Amat[i][j] = a[i - 1];
      }
    }
    const jitterLevels = [0, 1e-12, 1e-10, 1e-8, 1e-6, 1e-4];
    for (const jitter of jitterLevels) {
      const Dtry = jitter === 0 ? D : addDiagonalJitter(D, jitter);
      const result = import_quadprog.default.solveQP(to1BasedMatrix(Dtry), to1BasedVector(d), Amat, bvec, meq);
      if (result?.message) {
        continue;
      }
      const solution = (result?.solution ?? []).slice(1);
      if (solution.length !== n) {
        continue;
      }
      if (!solution.every((v) => Number.isFinite(v))) {
        continue;
      }
      return solution;
    }
    return null;
  }
  _solveMinVarianceWeights({ targetSum = 1, minReturn = null } = {}) {
    const D = this.covMatrix.map((row) => row.map((v) => 2 * v));
    const d = Array(this.nAssets).fill(0);
    const { eqConstraints, ineqConstraints } = this._buildConstraintSets({ targetSum, minReturn });
    return this._solveQp({ D, d, eqConstraints, ineqConstraints });
  }
  _solveQuadraticUtilityWeights({ riskAversion = 1, targetSum = 1 } = {}) {
    const D = this.covMatrix.map((row) => row.map((v) => riskAversion * v));
    const d = this.expectedReturns.slice();
    const { eqConstraints, ineqConstraints } = this._buildConstraintSets({ targetSum });
    return this._solveQp({ D, d, eqConstraints, ineqConstraints });
  }
  _solveMaxReturnWeights({ targetSum = 1 } = {}) {
    if (!this._isFeasibleTargetSum(targetSum)) {
      return null;
    }
    const w = this._lowerBounds.slice();
    let remaining = targetSum - w.reduce((acc, v) => acc + v, 0);
    if (remaining < -1e-10) {
      return null;
    }
    const order = Array.from({ length: this.nAssets }, (_, i) => i).sort(
      (a, b) => this.expectedReturns[b] - this.expectedReturns[a]
    );
    for (const idx of order) {
      if (remaining <= 1e-12) {
        break;
      }
      const room = this._upperBounds[idx] - w[idx];
      const add = Math.min(room, remaining);
      w[idx] += add;
      remaining -= add;
    }
    if (remaining > 1e-8) {
      return null;
    }
    return w;
  }
  _setSolvedWeights(weights) {
    this.weights = weights.slice();
    return this._mapVectorToWeights(this.weights);
  }
  minVolatility() {
    if (this._canUseExactQp() && this._isFeasibleTargetSum(this._targetSum)) {
      const w = this._solveMinVarianceWeights({ targetSum: this._targetSum });
      if (w) {
        return this._setSolvedWeights(w);
      }
    }
    return this._optimize(this._penalized((w) => this._portfolioVariance(w)));
  }
  maxSharpe({ riskFreeRate = 0 } = {}) {
    if (this._canUseExactQp() && this._isFeasibleTargetSum(this._targetSum)) {
      const minVolW = this._solveMinVarianceWeights({ targetSum: this._targetSum });
      const maxRetW = this._solveMaxReturnWeights({ targetSum: this._targetSum });
      if (minVolW && maxRetW) {
        const minRet = this._portfolioReturn(minVolW);
        const maxRet = this._portfolioReturn(maxRetW);
        const evalCache = /* @__PURE__ */ new Map();
        const evaluate = (targetReturn) => {
          const key = targetReturn.toPrecision(16);
          if (evalCache.has(key)) {
            return evalCache.get(key);
          }
          const w = this._solveMinVarianceWeights({
            targetSum: this._targetSum,
            minReturn: targetReturn
          });
          if (!w) {
            evalCache.set(key, null);
            return null;
          }
          const ret = this._portfolioReturn(w);
          const vol = Math.sqrt(Math.max(this._portfolioVariance(w), 0));
          const sharpe = vol === 0 ? Number.NEGATIVE_INFINITY : (ret - riskFreeRate) / vol;
          const out = { w, ret, vol, sharpe };
          evalCache.set(key, out);
          return out;
        };
        let best = null;
        const consider = (candidate) => {
          if (!candidate) {
            return;
          }
          if (!best || candidate.sharpe > best.sharpe) {
            best = candidate;
          }
        };
        const gridPoints = 80;
        for (let i = 0; i <= gridPoints; i += 1) {
          const t = i / gridPoints;
          const r = minRet + t * (maxRet - minRet);
          consider(evaluate(r));
        }
        let left = minRet;
        let right = maxRet;
        for (let iter = 0; iter < 45; iter += 1) {
          const r1 = left + (right - left) / 3;
          const r2 = right - (right - left) / 3;
          const c1 = evaluate(r1);
          const c2 = evaluate(r2);
          const s1 = c1 ? c1.sharpe : Number.NEGATIVE_INFINITY;
          const s2 = c2 ? c2.sharpe : Number.NEGATIVE_INFINITY;
          if (s1 < s2) {
            left = r1;
          } else {
            right = r2;
          }
          consider(c1);
          consider(c2);
        }
        if (best) {
          return this._setSolvedWeights(best.w);
        }
      }
    }
    return this._optimize(
      this._penalized((w) => {
        const variance = Math.max(this._portfolioVariance(w), 1e-16);
        const sigma = Math.sqrt(variance);
        const mu = this._portfolioReturn(w);
        return -((mu - riskFreeRate) / sigma);
      })
    );
  }
  maxQuadraticUtility({ riskAversion = 1 } = {}) {
    if (this._canUseExactQp() && this._isFeasibleTargetSum(this._targetSum)) {
      const w = this._solveQuadraticUtilityWeights({
        riskAversion,
        targetSum: this._targetSum
      });
      if (w) {
        return this._setSolvedWeights(w);
      }
    }
    return this._optimize(
      this._penalized((w) => {
        const mu = this._portfolioReturn(w);
        const variance = this._portfolioVariance(w);
        return -(mu - 0.5 * riskAversion * variance);
      })
    );
  }
  efficientRisk(targetVolatility, { marketNeutral = false } = {}) {
    if (marketNeutral) {
      this._targetSum = 0;
    }
    if (!marketNeutral && this._canUseExactQp() && this._isFeasibleTargetSum(this._targetSum)) {
      const minVolW = this._solveMinVarianceWeights({ targetSum: this._targetSum });
      const maxRetW = this._solveMaxReturnWeights({ targetSum: this._targetSum });
      if (minVolW && maxRetW) {
        const targetSigma = targetVolatility;
        const minVolSigma = Math.sqrt(Math.max(this._portfolioVariance(minVolW), 0));
        if (minVolSigma >= targetSigma - 1e-10) {
          this._targetSum = 1;
          return this._setSolvedWeights(minVolW);
        }
        const maxVolSigma = Math.sqrt(Math.max(this._portfolioVariance(maxRetW), 0));
        if (maxVolSigma <= targetSigma + 1e-10) {
          this._targetSum = 1;
          return this._setSolvedWeights(maxRetW);
        }
        let lo = this._portfolioReturn(minVolW);
        let hi = this._portfolioReturn(maxRetW);
        let best = minVolW;
        for (let iter = 0; iter < 70; iter += 1) {
          const mid = (lo + hi) / 2;
          const w = this._solveMinVarianceWeights({
            targetSum: this._targetSum,
            minReturn: mid
          });
          if (!w) {
            hi = mid;
            continue;
          }
          const sigma = Math.sqrt(Math.max(this._portfolioVariance(w), 0));
          if (sigma <= targetSigma + 1e-10) {
            lo = mid;
            best = w;
          } else {
            hi = mid;
          }
        }
        this._targetSum = 1;
        return this._setSolvedWeights(best);
      }
    }
    const penaltyScale = 5e3;
    const result = this._optimize(
      this._penalized((w) => {
        const variance = Math.max(this._portfolioVariance(w), 0);
        const sigma = Math.sqrt(variance);
        const mu = this._portfolioReturn(w);
        const penalty = Math.max(0, sigma - targetVolatility) ** 2 * penaltyScale;
        return -mu + penalty;
      })
    );
    this._targetSum = 1;
    return result;
  }
  efficientReturn(targetReturn, { marketNeutral = false } = {}) {
    if (marketNeutral) {
      this._targetSum = 0;
    }
    if (!marketNeutral && this._canUseExactQp() && this._isFeasibleTargetSum(this._targetSum)) {
      const w = this._solveMinVarianceWeights({
        targetSum: this._targetSum,
        minReturn: targetReturn
      });
      if (w) {
        this._targetSum = 1;
        return this._setSolvedWeights(w);
      }
    }
    const penaltyScale = 5e3;
    const result = this._optimize(
      this._penalized((w) => {
        const variance = this._portfolioVariance(w);
        const mu = this._portfolioReturn(w);
        const penalty = Math.max(0, targetReturn - mu) ** 2 * penaltyScale;
        return variance + penalty;
      })
    );
    this._targetSum = 1;
    return result;
  }
  maxReturn() {
    if (this._canUseExactQp() && this._isFeasibleTargetSum(this._targetSum)) {
      const w2 = this._solveMaxReturnWeights({ targetSum: this._targetSum });
      if (w2) {
        return this._setSolvedWeights(w2);
      }
    }
    let best = 0;
    let bestIdx = 0;
    for (let i = 0; i < this.expectedReturns.length; i += 1) {
      if (this.expectedReturns[i] > best || i === 0) {
        best = this.expectedReturns[i];
        bestIdx = i;
      }
    }
    const w = Array.from({ length: this.nAssets }, () => 0);
    w[bestIdx] = 1;
    this.weights = projectBoundedSimplex(w, this._lowerBounds, this._upperBounds, this._targetSum);
    return this._mapVectorToWeights(this.weights);
  }
  efficientFrontier({ points = 50 } = {}) {
    const minVol = this.minVolatility();
    const perfMin = this.portfolioPerformance();
    const maxRet = this.maxReturn();
    const perfMax = this.portfolioPerformance();
    const targets = linspace(perfMin[0], perfMax[0], points);
    const frontier = [];
    for (const target of targets) {
      this.efficientReturn(target);
      const [ret, vol, sharpe] = this.portfolioPerformance();
      frontier.push({ targetReturn: target, return: ret, volatility: vol, sharpe, weights: this.cleanWeights() });
    }
    this.setWeights(minVol);
    this.portfolioPerformance();
    this._max_return = maxRet;
    return frontier;
  }
  // Python-style aliases
  min_volatility(...args) {
    return this.minVolatility(...args);
  }
  max_sharpe(...args) {
    return this.maxSharpe(...args);
  }
  max_quadratic_utility(...args) {
    return this.maxQuadraticUtility(...args);
  }
  efficient_risk(...args) {
    return this.efficientRisk(...args);
  }
  efficient_return(...args) {
    return this.efficientReturn(...args);
  }
  max_return(...args) {
    return this.maxReturn(...args);
  }
  efficient_frontier(...args) {
    return this.efficientFrontier(...args);
  }
  portfolio_performance(...args) {
    return this.portfolioPerformance(...args);
  }
};

// src/cla.js
function linspace2(start, end, points) {
  if (points <= 1) {
    return [start];
  }
  const step = (end - start) / (points - 1);
  return Array.from({ length: points }, (_, i) => start + i * step);
}
var CLA = class {
  constructor(expectedReturns, covMatrix, { weightBounds = [0, 1], tickers = null } = {}) {
    this.expectedReturns = expectedReturns;
    this.covMatrix = covMatrix;
    this.weightBounds = weightBounds;
    this.weights = null;
    this.ef = new EfficientFrontier(expectedReturns, covMatrix, { weightBounds, tickers });
    this.tickers = this.ef.tickers;
  }
  _syncFromEf() {
    this.weights = this.ef.weights ? this.ef.weights.slice() : null;
  }
  maxSharpe(options = {}) {
    const result = this.ef.maxSharpe(options);
    this._syncFromEf();
    return result;
  }
  minVolatility(options = {}) {
    const result = this.ef.minVolatility(options);
    this._syncFromEf();
    return result;
  }
  efficientFrontier({ points = 50 } = {}) {
    const minPoint = this.minVolatility();
    const [minRet] = this.portfolioPerformance();
    const maxPoint = this.maxSharpe();
    const [maxRet] = this.portfolioPerformance();
    const targets = linspace2(minRet, maxRet, points);
    const frontier = [];
    for (const target of targets) {
      this.ef.efficientReturn(target);
      this._syncFromEf();
      const [ret, vol, sharpe] = this.portfolioPerformance();
      frontier.push({ targetReturn: target, return: ret, volatility: vol, sharpe, weights: this.cleanWeights() });
    }
    this.setWeights(minPoint);
    this._max_sharpe_weights = maxPoint;
    return frontier;
  }
  setWeights(weights) {
    const result = this.ef.setWeights(weights);
    this._syncFromEf();
    return result;
  }
  cleanWeights(options = {}) {
    return this.ef.cleanWeights(options);
  }
  portfolioPerformance(options = {}) {
    return this.ef.portfolioPerformance(options);
  }
  max_sharpe(...args) {
    return this.maxSharpe(...args);
  }
  min_volatility(...args) {
    return this.minVolatility(...args);
  }
  efficient_frontier(...args) {
    return this.efficientFrontier(...args);
  }
  set_weights(...args) {
    return this.setWeights(...args);
  }
  clean_weights(...args) {
    return this.cleanWeights(...args);
  }
  portfolio_performance(...args) {
    return this.portfolioPerformance(...args);
  }
};

// src/hierarchical_portfolio.js
function validateReturnsMatrix2(returns) {
  if (!Array.isArray(returns) || returns.length === 0) {
    throw new TypeError("returns are not a matrix");
  }
  const cols = returns[0].length;
  for (const row of returns) {
    if (!Array.isArray(row) || row.length !== cols) {
      throw new TypeError("returns rows must have equal length");
    }
  }
}
function validateCovarianceMatrix(covMatrix) {
  if (!Array.isArray(covMatrix) || covMatrix.length === 0) {
    throw new TypeError("covMatrix is not a matrix");
  }
  const n = covMatrix.length;
  for (const row of covMatrix) {
    if (!Array.isArray(row) || row.length !== n) {
      throw new TypeError("covMatrix must be square");
    }
  }
}
function covarianceFromReturns(returns, frequency = 1) {
  const cols = returns[0].length;
  const out = Array.from({ length: cols }, () => Array(cols).fill(0));
  const mean2 = Array.from({ length: cols }, (_, c) => {
    let acc = 0;
    for (const row of returns) {
      acc += row[c];
    }
    return acc / returns.length;
  });
  for (let i = 0; i < cols; i += 1) {
    for (let j = i; j < cols; j += 1) {
      let acc = 0;
      for (const row of returns) {
        acc += (row[i] - mean2[i]) * (row[j] - mean2[j]);
      }
      const cov = acc / Math.max(returns.length - 1, 1) * frequency;
      out[i][j] = cov;
      out[j][i] = cov;
    }
  }
  return out;
}
function correlationFromReturns(returns) {
  const cov = covarianceFromReturns(returns, 1);
  return covToCorr(cov);
}
function roundMatrix(matrix2, digits = 6) {
  const scale = 10 ** digits;
  return matrix2.map((row) => row.map((v) => Math.round(v * scale) / scale));
}
function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
function pairKey(a, b) {
  return a < b ? `${a}::${b}` : `${b}::${a}`;
}
function singleLinkage(distanceMatrix) {
  const n = distanceMatrix.length;
  const distances = /* @__PURE__ */ new Map();
  for (let i = 0; i < n; i += 1) {
    for (let j = i + 1; j < n; j += 1) {
      distances.set(pairKey(i, j), distanceMatrix[i][j]);
    }
  }
  const size = new Map(Array.from({ length: n }, (_, i) => [i, 1]));
  let active = Array.from({ length: n }, (_, i) => i);
  const linkage = [];
  let nextId = n;
  const getDistance = (a, b) => distances.get(pairKey(a, b));
  const setDistance = (a, b, v) => {
    distances.set(pairKey(a, b), v);
  };
  while (active.length > 1) {
    let bestA = active[0];
    let bestB = active[1];
    let bestDistance = getDistance(bestA, bestB);
    for (let i = 0; i < active.length; i += 1) {
      for (let j = i + 1; j < active.length; j += 1) {
        const a = active[i];
        const b = active[j];
        const d = getDistance(a, b);
        if (d < bestDistance - 1e-12 || Math.abs(d - bestDistance) <= 1e-12 && (a < bestA || a === bestA && b < bestB)) {
          bestA = a;
          bestB = b;
          bestDistance = d;
        }
      }
    }
    const count = (size.get(bestA) ?? 0) + (size.get(bestB) ?? 0);
    linkage.push([bestA, bestB, bestDistance, count]);
    const survivors = active.filter((id) => id !== bestA && id !== bestB);
    for (const k of survivors) {
      const d = Math.min(getDistance(bestA, k), getDistance(bestB, k));
      setDistance(nextId, k, d);
    }
    size.set(nextId, count);
    active = [...survivors, nextId].sort((a, b) => a - b);
    nextId += 1;
  }
  return linkage;
}
function quasiDiagonal(linkage, nLeaves) {
  const nodes = /* @__PURE__ */ new Map();
  for (let i = 0; i < nLeaves; i += 1) {
    nodes.set(i, { leaf: true });
  }
  for (let i = 0; i < linkage.length; i += 1) {
    const [left, right] = linkage[i];
    nodes.set(nLeaves + i, { leaf: false, left, right });
  }
  const rootId = nLeaves + linkage.length - 1;
  const out = [];
  const walk = (id) => {
    const node = nodes.get(id);
    if (!node) {
      throw new Error("invalid linkage tree");
    }
    if (node.leaf) {
      out.push(id);
      return;
    }
    walk(node.left);
    walk(node.right);
  };
  walk(rootId);
  return out;
}
function getClusterVariance(covMatrix, indices) {
  const diagInv = indices.map((idx) => 1 / covMatrix[idx][idx]);
  const denom = diagInv.reduce((acc, v) => acc + v, 0);
  const weights = diagInv.map((v) => v / denom);
  let variance = 0;
  for (let i = 0; i < indices.length; i += 1) {
    for (let j = 0; j < indices.length; j += 1) {
      variance += weights[i] * covMatrix[indices[i]][indices[j]] * weights[j];
    }
  }
  return variance;
}
function rawHrpAllocation(covMatrix, orderedIndices) {
  const weights = Array(covMatrix.length).fill(0);
  for (const idx of orderedIndices) {
    weights[idx] = 1;
  }
  let clusterItems = [orderedIndices.slice()];
  while (clusterItems.length > 0) {
    clusterItems = clusterItems.flatMap((items) => {
      if (items.length <= 1) {
        return [];
      }
      const mid = Math.floor(items.length / 2);
      return [items.slice(0, mid), items.slice(mid)];
    });
    for (let i = 0; i < clusterItems.length; i += 2) {
      const first = clusterItems[i];
      const second = clusterItems[i + 1];
      const firstVariance = getClusterVariance(covMatrix, first);
      const secondVariance = getClusterVariance(covMatrix, second);
      const alpha = 1 - firstVariance / (firstVariance + secondVariance);
      for (const idx of first) {
        weights[idx] *= alpha;
      }
      for (const idx of second) {
        weights[idx] *= 1 - alpha;
      }
    }
  }
  return weights;
}
var HRPOpt = class {
  constructor(returns = null, { covMatrix = null, tickers = null } = {}) {
    if (returns == null && covMatrix == null) {
      throw new Error("Either returns or covMatrix must be provided");
    }
    if (returns != null) {
      validateReturnsMatrix2(returns);
    }
    if (covMatrix != null) {
      validateCovarianceMatrix(covMatrix);
    }
    this.returns = returns;
    this.covMatrix = covMatrix;
    this.clusters = null;
    const nAssets = returns?.[0]?.length ?? covMatrix?.length ?? 0;
    this.tickers = tickers ?? Array.from({ length: nAssets }, (_, i) => String(i));
    this.weights = null;
  }
  optimize(linkageMethod = "single") {
    if (linkageMethod !== "single") {
      throw new Error("linkage_method must be one recognised by scipy");
    }
    let cov;
    let corr;
    if (this.returns == null) {
      cov = this.covMatrix;
      corr = roundMatrix(covToCorr(this.covMatrix), 6);
    } else {
      cov = covarianceFromReturns(this.returns, 1);
      corr = correlationFromReturns(this.returns);
    }
    const n = corr.length;
    const distance = Array.from(
      { length: n },
      (_, i) => Array.from(
        { length: n },
        (_2, j) => Math.sqrt(clamp((1 - corr[i][j]) / 2, 0, 1))
      )
    );
    this.clusters = singleLinkage(distance);
    const sortIx = quasiDiagonal(this.clusters, n);
    const hrpWeights = rawHrpAllocation(cov, sortIx);
    this.weights = hrpWeights.slice();
    return Object.fromEntries(this.tickers.map((ticker, i) => [ticker, this.weights[i]]));
  }
  portfolioPerformance({ riskFreeRate = 0, frequency = 252 } = {}) {
    if (this.weights == null) {
      throw new Error("portfolio_performance requires optimize() first");
    }
    let cov;
    let mu = null;
    if (this.returns == null) {
      cov = this.covMatrix;
    } else {
      cov = covarianceFromReturns(this.returns, frequency);
      mu = Array.from({ length: this.tickers.length }, (_, c) => {
        let acc = 0;
        for (const row of this.returns) {
          acc += row[c];
        }
        return acc / this.returns.length * frequency;
      });
    }
    const volatility = Math.sqrt(Math.max(portfolioVariance(this.weights, cov), 0));
    if (mu == null) {
      return [null, volatility, null];
    }
    const annualReturn = portfolioReturn(this.weights, mu, { negative: false });
    const sharpe = volatility === 0 ? Number.POSITIVE_INFINITY : (annualReturn - riskFreeRate) / volatility;
    return [annualReturn, volatility, sharpe];
  }
  portfolio_performance(...args) {
    return this.portfolioPerformance(...args);
  }
};

// src/efficient_frontier/efficient_semivariance.js
var import_quadprog2 = __toESM(require_quadprog2(), 1);
function validateReturnsMatrix3(historicReturns) {
  if (!Array.isArray(historicReturns) || historicReturns.length === 0) {
    throw new Error("historicReturns must be a non-empty matrix");
  }
  const cols = historicReturns[0].length;
  if (cols === 0) {
    throw new Error("historicReturns cannot have empty rows");
  }
  for (const row of historicReturns) {
    if (!Array.isArray(row) || row.length !== cols) {
      throw new Error("historicReturns rows must have equal length");
    }
  }
}
function covarianceFromReturns2(returns, frequency) {
  const cols = returns[0].length;
  const out = Array.from({ length: cols }, () => Array(cols).fill(0));
  const mean2 = Array.from({ length: cols }, (_, c) => {
    let acc = 0;
    for (const row of returns) {
      acc += row[c];
    }
    return acc / returns.length;
  });
  for (let i = 0; i < cols; i += 1) {
    for (let j = i; j < cols; j += 1) {
      let acc = 0;
      for (const row of returns) {
        acc += (row[i] - mean2[i]) * (row[j] - mean2[j]);
      }
      const cov = acc / Math.max(returns.length - 1, 1) * frequency;
      out[i][j] = cov;
      out[j][i] = cov;
    }
  }
  return out;
}
function to1BasedVector2(values) {
  return [0, ...values];
}
function to1BasedMatrix2(matrix2) {
  return [[], ...matrix2.map((row) => [0, ...row])];
}
function addDiagonalJitter2(matrix2, jitter) {
  return matrix2.map((row, i) => row.map((value, j) => i === j ? value + jitter : value));
}
function dotVec(a, b) {
  let acc = 0;
  for (let i = 0; i < a.length; i += 1) {
    acc += a[i] * b[i];
  }
  return acc;
}
function semideviation(portfolioReturns, benchmark = 0) {
  const downside = portfolioReturns.map((r) => Math.min(r - benchmark, 0));
  const variance = downside.reduce((acc, d) => acc + d * d, 0) / Math.max(portfolioReturns.length, 1);
  return Math.sqrt(Math.max(variance, 0));
}
var EfficientSemivariance = class extends EfficientFrontier {
  constructor(expectedReturns, historicReturns, options = {}) {
    validateReturnsMatrix3(historicReturns);
    const covProxy = covarianceFromReturns2(historicReturns, options.frequency ?? 252);
    super(expectedReturns, covProxy, options);
    this.historicReturns = historicReturns;
    this.benchmark = options.benchmark ?? 0;
    this.frequency = options.frequency ?? 252;
  }
  _portfolioReturns(weights) {
    return this.historicReturns.map((row) => dot(row, weights));
  }
  _semivariance(weights) {
    const rets = this._portfolioReturns(weights);
    const semi = semideviation(rets, this.benchmark);
    return semi * semi * this.frequency;
  }
  _canUseExactSemivarianceQp() {
    return this._additionalObjectives.length === 0 && this._additionalConstraints.length === 0 && this.historicReturns.length <= 250 && this._isFeasibleTargetSum(this._targetSum);
  }
  _solveSemivarianceWeights({ targetSum = 1, minReturn = null } = {}) {
    const n = this.nAssets;
    const T = this.historicReturns.length;
    const pOffset = n;
    const nOffset = n + T;
    const dim = n + 2 * T;
    const D = Array.from({ length: dim }, () => Array(dim).fill(0));
    for (let t = 0; t < T; t += 1) {
      D[nOffset + t][nOffset + t] = 2;
    }
    const d = Array(dim).fill(0);
    const eqConstraints = [];
    const ineqConstraints = [];
    const sumConstraint = Array(dim).fill(0);
    for (let i = 0; i < n; i += 1) {
      sumConstraint[i] = 1;
    }
    eqConstraints.push({ a: sumConstraint, b: targetSum });
    const scale = Math.sqrt(T);
    for (let t = 0; t < T; t += 1) {
      const a = Array(dim).fill(0);
      const row = this.historicReturns[t];
      for (let i = 0; i < n; i += 1) {
        a[i] = (row[i] - this.benchmark) / scale;
      }
      a[pOffset + t] = -1;
      a[nOffset + t] = 1;
      eqConstraints.push({ a, b: 0 });
    }
    for (let i = 0; i < n; i += 1) {
      const lower = this._lowerBounds[i];
      const upper = this._upperBounds[i];
      const aLower = Array(dim).fill(0);
      aLower[i] = 1;
      ineqConstraints.push({ a: aLower, b: lower });
      const aUpper = Array(dim).fill(0);
      aUpper[i] = -1;
      ineqConstraints.push({ a: aUpper, b: -upper });
    }
    for (let t = 0; t < T; t += 1) {
      const aP = Array(dim).fill(0);
      aP[pOffset + t] = 1;
      ineqConstraints.push({ a: aP, b: 0 });
      const aN = Array(dim).fill(0);
      aN[nOffset + t] = 1;
      ineqConstraints.push({ a: aN, b: 0 });
    }
    if (minReturn != null) {
      const aRet = Array(dim).fill(0);
      for (let i = 0; i < n; i += 1) {
        aRet[i] = this.expectedReturns[i];
      }
      ineqConstraints.push({ a: aRet, b: minReturn });
    }
    const allConstraints = [...eqConstraints, ...ineqConstraints];
    const q = allConstraints.length;
    const meq = eqConstraints.length;
    const Amat = Array.from({ length: dim + 1 }, () => Array(q + 1).fill(0));
    const bvec = Array(q + 1).fill(0);
    for (let j = 1; j <= q; j += 1) {
      const { a, b } = allConstraints[j - 1];
      bvec[j] = b;
      for (let i = 1; i <= dim; i += 1) {
        Amat[i][j] = a[i - 1];
      }
    }
    const jitterLevels = [0, 1e-12, 1e-10, 1e-8, 1e-6];
    for (const jitter of jitterLevels) {
      const Dtry = jitter === 0 ? D : addDiagonalJitter2(D, jitter);
      const result = import_quadprog2.default.solveQP(to1BasedMatrix2(Dtry), to1BasedVector2(d), Amat, bvec, meq);
      if (result?.message) {
        continue;
      }
      const solution = (result?.solution ?? []).slice(1);
      if (solution.length !== dim) {
        continue;
      }
      if (!solution.every((v) => Number.isFinite(v))) {
        continue;
      }
      const eqValid = eqConstraints.every(({ a, b }) => Math.abs(dotVec(a, solution) - b) <= 1e-5);
      const ineqValid = ineqConstraints.every(({ a, b }) => dotVec(a, solution) >= b - 1e-5);
      if (!eqValid || !ineqValid) {
        continue;
      }
      return solution.slice(0, n);
    }
    return null;
  }
  minSemivariance({ marketNeutral = false } = {}) {
    if (marketNeutral) {
      this._targetSum = 0;
    }
    if (!marketNeutral && this._canUseExactSemivarianceQp()) {
      const w = this._solveSemivarianceWeights({ targetSum: this._targetSum });
      if (w) {
        this._targetSum = 1;
        return this._setSolvedWeights(w);
      }
    }
    const result = this._optimize(this._penalized((w) => this._semivariance(w)));
    this._targetSum = 1;
    return result;
  }
  efficientRisk(targetSemideviation, { marketNeutral = false } = {}) {
    if (marketNeutral) {
      this._targetSum = 0;
    }
    if (!marketNeutral && this._canUseExactSemivarianceQp()) {
      const minSemiW = this._solveSemivarianceWeights({ targetSum: this._targetSum });
      const maxRetW = this._solveMaxReturnWeights({ targetSum: this._targetSum });
      if (minSemiW && maxRetW) {
        const targetSemivariance = targetSemideviation ** 2;
        const minSemi = this._semivariance(minSemiW);
        if (minSemi > targetSemivariance + 1e-10) {
          this._targetSum = 1;
          return this._setSolvedWeights(minSemiW);
        }
        const maxSemi = this._semivariance(maxRetW);
        if (maxSemi <= targetSemivariance + 1e-10) {
          this._targetSum = 1;
          return this._setSolvedWeights(maxRetW);
        }
        let lo = this._portfolioReturn(minSemiW);
        let hi = this._portfolioReturn(maxRetW);
        let best = minSemiW;
        for (let iter = 0; iter < 50; iter += 1) {
          const mid = (lo + hi) / 2;
          const w = this._solveSemivarianceWeights({
            targetSum: this._targetSum,
            minReturn: mid
          });
          if (!w) {
            hi = mid;
            continue;
          }
          const semi = this._semivariance(w);
          if (semi <= targetSemivariance + 1e-10) {
            lo = mid;
            best = w;
          } else {
            hi = mid;
          }
        }
        this._targetSum = 1;
        return this._setSolvedWeights(best);
      }
    }
    const maxRetWeightsByTicker = this.maxReturn();
    const candidate = this.tickers.map((ticker) => maxRetWeightsByTicker[ticker]);
    const candidateSemi = Math.sqrt(Math.max(this._semivariance(candidate), 0));
    if (candidateSemi <= targetSemideviation + 1e-10) {
      this.weights = candidate;
      this._targetSum = 1;
      return this._mapVectorToWeights(this.weights);
    }
    const penaltyScale = 5e3;
    const result = this._optimize(
      this._penalized((w) => {
        const semi = Math.sqrt(Math.max(this._semivariance(w), 0));
        const penalty = Math.max(0, semi - targetSemideviation) ** 2 * penaltyScale;
        return -this._portfolioReturn(w) + penalty;
      })
    );
    this._targetSum = 1;
    return result;
  }
  efficientReturn(targetReturn, { marketNeutral = false } = {}) {
    if (marketNeutral) {
      this._targetSum = 0;
    }
    if (!marketNeutral && this._canUseExactSemivarianceQp()) {
      const w = this._solveSemivarianceWeights({
        targetSum: this._targetSum,
        minReturn: targetReturn
      });
      if (w) {
        this._targetSum = 1;
        return this._setSolvedWeights(w);
      }
    }
    const penaltyScale = 5e3;
    const result = this._optimize(
      this._penalized((w) => {
        const penalty = Math.max(0, targetReturn - this._portfolioReturn(w)) ** 2 * penaltyScale;
        return this._semivariance(w) + penalty;
      })
    );
    this._targetSum = 1;
    return result;
  }
  portfolioPerformance({ riskFreeRate = 0 } = {}) {
    if (this.weights == null) {
      throw new Error("portfolio_performance requires weights to be computed first");
    }
    const ret = this._portfolioReturn(this.weights);
    const semiDev = Math.sqrt(Math.max(this._semivariance(this.weights), 0));
    const sortino = semiDev === 0 ? Number.POSITIVE_INFINITY : (ret - riskFreeRate) / semiDev;
    return [ret, semiDev, sortino];
  }
  // Python alias
  min_semivariance(...args) {
    return this.minSemivariance(...args);
  }
  efficient_risk(...args) {
    return this.efficientRisk(...args);
  }
  efficient_return(...args) {
    return this.efficientReturn(...args);
  }
};

// src/efficient_frontier/efficient_cvar.js
var import_javascript_lp_solver2 = __toESM(require_main3(), 1);
function validateReturnsMatrix4(historicReturns) {
  if (!Array.isArray(historicReturns) || historicReturns.length === 0) {
    throw new Error("historicReturns must be a non-empty matrix");
  }
  const cols = historicReturns[0].length;
  for (const row of historicReturns) {
    if (!Array.isArray(row) || row.length !== cols) {
      throw new Error("historicReturns rows must have equal length");
    }
  }
}
function covarianceFromReturns3(returns, frequency) {
  const cols = returns[0].length;
  const out = Array.from({ length: cols }, () => Array(cols).fill(0));
  const mean2 = Array.from({ length: cols }, (_, c) => {
    let acc = 0;
    for (const row of returns) {
      acc += row[c];
    }
    return acc / returns.length;
  });
  for (let i = 0; i < cols; i += 1) {
    for (let j = i; j < cols; j += 1) {
      let acc = 0;
      for (const row of returns) {
        acc += (row[i] - mean2[i]) * (row[j] - mean2[j]);
      }
      const cov = acc / Math.max(returns.length - 1, 1) * frequency;
      out[i][j] = cov;
      out[j][i] = cov;
    }
  }
  return out;
}
var EfficientCVaR = class extends EfficientFrontier {
  constructor(expectedReturns, historicReturns, options = {}) {
    validateReturnsMatrix4(historicReturns);
    const covProxy = covarianceFromReturns3(historicReturns, options.frequency ?? 252);
    super(expectedReturns, covProxy, options);
    this.historicReturns = historicReturns;
    this.beta = options.beta ?? 0.95;
    this.frequency = options.frequency ?? 252;
    this._alphaValue = null;
    this._uValues = null;
  }
  _portfolioReturns(weights) {
    return this.historicReturns.map((row) => dot(row, weights));
  }
  _cvar(weights) {
    const losses = this._portfolioReturns(weights).map((r) => -r);
    const sorted = losses.slice().sort((a, b) => a - b);
    const T = sorted.length;
    const c = 1 / (T * (1 - this.beta));
    let best = Number.POSITIVE_INFINITY;
    for (let i = 0; i < T; i += 1) {
      const alpha = sorted[i];
      let tail = 0;
      for (let t = 0; t < T; t += 1) {
        tail += Math.max(losses[t] - alpha, 0);
      }
      best = Math.min(best, alpha + c * tail);
    }
    return best;
  }
  _canUseExactLp() {
    return this._additionalObjectives.length === 0 && this._additionalConstraints.length === 0;
  }
  _solveCvarLp({ targetSum = 1, targetReturn = null, targetCvar = null, maximizeReturn = false }) {
    const T = this.historicReturns.length;
    const tailScale = 1 / (T * (1 - this.beta));
    const constraints = {
      sum_w: { equal: targetSum }
    };
    const variables = {};
    for (let i = 0; i < this.nAssets; i += 1) {
      constraints[`w_lb_${i}`] = { min: this._lowerBounds[i] };
      constraints[`w_ub_${i}`] = { max: this._upperBounds[i] };
    }
    for (let t = 0; t < T; t += 1) {
      constraints[`loss_${t}`] = { min: 0 };
      constraints[`u_nonneg_${t}`] = { min: 0 };
    }
    if (targetReturn != null) {
      constraints.ret_min = { min: targetReturn };
    }
    if (targetCvar != null) {
      constraints.cvar_max = { max: targetCvar };
    }
    for (let i = 0; i < this.nAssets; i += 1) {
      const variable = {
        obj: maximizeReturn ? this.expectedReturns[i] : 0,
        sum_w: 1,
        [`w_lb_${i}`]: 1,
        [`w_ub_${i}`]: 1
      };
      for (let t = 0; t < T; t += 1) {
        variable[`loss_${t}`] = this.historicReturns[t][i];
      }
      if (targetReturn != null) {
        variable.ret_min = this.expectedReturns[i];
      }
      variables[`w_${i}`] = variable;
    }
    const alpha = { obj: maximizeReturn ? 0 : -1 };
    for (let t = 0; t < T; t += 1) {
      alpha[`loss_${t}`] = 1;
    }
    if (targetCvar != null) {
      alpha.cvar_max = 1;
    }
    variables.alpha = alpha;
    for (let t = 0; t < T; t += 1) {
      const variable = {
        obj: maximizeReturn ? 0 : -tailScale,
        [`loss_${t}`]: 1,
        [`u_nonneg_${t}`]: 1
      };
      if (targetCvar != null) {
        variable.cvar_max = tailScale;
      }
      variables[`u_${t}`] = variable;
    }
    const model = {
      optimize: "obj",
      opType: "max",
      constraints,
      variables
    };
    const result = import_javascript_lp_solver2.default.Solve(model);
    if (!result?.feasible) {
      return null;
    }
    const weights = Array.from(
      { length: this.nAssets },
      (_, i) => Number(result[`w_${i}`] ?? 0)
    );
    const alphaValue = Number(result.alpha ?? 0);
    const uValues = Array.from({ length: T }, (_, t) => Number(result[`u_${t}`] ?? 0));
    return { weights, alphaValue, uValues };
  }
  _setLpSolution(solution) {
    this.weights = solution.weights.slice();
    this._alphaValue = solution.alphaValue;
    this._uValues = solution.uValues.slice();
    return this._mapVectorToWeights(this.weights);
  }
  minCvar({ marketNeutral = false } = {}) {
    const targetSum = marketNeutral ? 0 : 1;
    if (this._canUseExactLp()) {
      const solution = this._solveCvarLp({ targetSum, maximizeReturn: false });
      if (solution) {
        return this._setLpSolution(solution);
      }
    }
    if (marketNeutral) {
      this._targetSum = 0;
    }
    const result = this._optimize(this._penalized((w) => this._cvar(w)));
    this._targetSum = 1;
    return result;
  }
  efficientRisk(targetCvar, { marketNeutral = false } = {}) {
    const targetSum = marketNeutral ? 0 : 1;
    if (this._canUseExactLp()) {
      const solution = this._solveCvarLp({
        targetSum,
        targetCvar,
        maximizeReturn: true
      });
      if (solution) {
        return this._setLpSolution(solution);
      }
    }
    if (marketNeutral) {
      this._targetSum = 0;
    }
    const penaltyScale = 5e3;
    const result = this._optimize(
      this._penalized((w) => {
        const cvar = this._cvar(w);
        const penalty = Math.max(0, cvar - targetCvar) ** 2 * penaltyScale;
        return -this._portfolioReturn(w) + penalty;
      })
    );
    this._targetSum = 1;
    return result;
  }
  efficientReturn(targetReturn, { marketNeutral = false } = {}) {
    const targetSum = marketNeutral ? 0 : 1;
    if (this._canUseExactLp()) {
      const solution = this._solveCvarLp({
        targetSum,
        targetReturn,
        maximizeReturn: false
      });
      if (solution) {
        return this._setLpSolution(solution);
      }
    }
    if (marketNeutral) {
      this._targetSum = 0;
    }
    const penaltyScale = 5e3;
    const result = this._optimize(
      this._penalized((w) => {
        const penalty = Math.max(0, targetReturn - this._portfolioReturn(w)) ** 2 * penaltyScale;
        return this._cvar(w) + penalty;
      })
    );
    this._targetSum = 1;
    return result;
  }
  portfolioPerformance() {
    if (this.weights == null) {
      throw new Error("portfolio_performance requires weights to be computed first");
    }
    const mu = this._portfolioReturn(this.weights);
    if (this._alphaValue != null && this._uValues != null) {
      const T = this.historicReturns.length;
      const tailScale = 1 / (T * (1 - this.beta));
      const cvar = this._alphaValue + tailScale * this._uValues.reduce((acc, v) => acc + v, 0);
      return [mu, cvar];
    }
    return [mu, this._cvar(this.weights)];
  }
  min_cvar(...args) {
    return this.minCvar(...args);
  }
  efficient_risk(...args) {
    return this.efficientRisk(...args);
  }
  efficient_return(...args) {
    return this.efficientReturn(...args);
  }
};

// src/efficient_frontier/efficient_cdar.js
var import_javascript_lp_solver3 = __toESM(require_main3(), 1);
function validateReturnsMatrix5(historicReturns) {
  if (!Array.isArray(historicReturns) || historicReturns.length === 0) {
    throw new Error("historicReturns must be a non-empty matrix");
  }
  const cols = historicReturns[0].length;
  for (const row of historicReturns) {
    if (!Array.isArray(row) || row.length !== cols) {
      throw new Error("historicReturns rows must have equal length");
    }
  }
}
function covarianceFromReturns4(returns, frequency) {
  const cols = returns[0].length;
  const out = Array.from({ length: cols }, () => Array(cols).fill(0));
  const mean2 = Array.from({ length: cols }, (_, c) => {
    let acc = 0;
    for (const row of returns) {
      acc += row[c];
    }
    return acc / returns.length;
  });
  for (let i = 0; i < cols; i += 1) {
    for (let j = i; j < cols; j += 1) {
      let acc = 0;
      for (const row of returns) {
        acc += (row[i] - mean2[i]) * (row[j] - mean2[j]);
      }
      const cov = acc / Math.max(returns.length - 1, 1) * frequency;
      out[i][j] = cov;
      out[j][i] = cov;
    }
  }
  return out;
}
var EfficientCDaR = class extends EfficientFrontier {
  constructor(expectedReturns, historicReturns, options = {}) {
    validateReturnsMatrix5(historicReturns);
    const covProxy = covarianceFromReturns4(historicReturns, options.frequency ?? 252);
    super(expectedReturns, covProxy, options);
    this.historicReturns = historicReturns;
    this.beta = options.beta ?? 0.95;
    this.frequency = options.frequency ?? 252;
    this._alphaValue = null;
    this._zValues = null;
  }
  _portfolioReturns(weights) {
    return this.historicReturns.map((row) => dot(row, weights));
  }
  _cdar(weights) {
    const rets = this._portfolioReturns(weights);
    const cumulative = [];
    let running = 0;
    for (const r of rets) {
      running += r;
      cumulative.push(running);
    }
    let maxSoFar = Number.NEGATIVE_INFINITY;
    const drawdowns = cumulative.map((c2) => {
      if (c2 > maxSoFar) {
        maxSoFar = c2;
      }
      return maxSoFar - c2;
    });
    const sorted = drawdowns.slice().sort((a, b) => a - b);
    const T = sorted.length;
    const c = 1 / (T * (1 - this.beta));
    let best = Number.POSITIVE_INFINITY;
    for (let i = 0; i < T; i += 1) {
      const alpha = sorted[i];
      let tail = 0;
      for (let t = 0; t < T; t += 1) {
        tail += Math.max(drawdowns[t] - alpha, 0);
      }
      best = Math.min(best, alpha + c * tail);
    }
    return best;
  }
  _canUseExactLp() {
    return this._additionalObjectives.length === 0 && this._additionalConstraints.length === 0;
  }
  _solveCdarLp({ targetSum = 1, targetReturn = null, targetCdar = null, maximizeReturn = false }) {
    const T = this.historicReturns.length;
    const tailScale = 1 / (T * (1 - this.beta));
    const constraints = {
      sum_w: { equal: targetSum },
      u0_eq: { equal: 0 }
    };
    const variables = {};
    for (let i = 0; i < this.nAssets; i += 1) {
      constraints[`w_lb_${i}`] = { min: this._lowerBounds[i] };
      constraints[`w_ub_${i}`] = { max: this._upperBounds[i] };
    }
    for (let t = 0; t < T; t += 1) {
      constraints[`z_ge_${t}`] = { min: 0 };
      constraints[`u_dyn_${t}`] = { min: 0 };
      constraints[`z_nonneg_${t}`] = { min: 0 };
      constraints[`u_nonneg_${t + 1}`] = { min: 0 };
    }
    if (targetReturn != null) {
      constraints.ret_min = { min: targetReturn };
    }
    if (targetCdar != null) {
      constraints.cdar_max = { max: targetCdar };
    }
    for (let i = 0; i < this.nAssets; i += 1) {
      const variable = {
        obj: maximizeReturn ? this.expectedReturns[i] : 0,
        sum_w: 1,
        [`w_lb_${i}`]: 1,
        [`w_ub_${i}`]: 1
      };
      for (let t = 0; t < T; t += 1) {
        variable[`u_dyn_${t}`] = this.historicReturns[t][i];
      }
      if (targetReturn != null) {
        variable.ret_min = this.expectedReturns[i];
      }
      variables[`w_${i}`] = variable;
    }
    const alpha = { obj: maximizeReturn ? 0 : -1 };
    for (let t = 0; t < T; t += 1) {
      alpha[`z_ge_${t}`] = 1;
    }
    if (targetCdar != null) {
      alpha.cdar_max = 1;
    }
    variables.alpha = alpha;
    for (let k = 0; k <= T; k += 1) {
      const variable = {};
      if (k === 0) {
        variable.u0_eq = 1;
      } else {
        variable[`u_nonneg_${k}`] = 1;
        variable[`z_ge_${k - 1}`] = -1;
      }
      if (k > 0) {
        variable[`u_dyn_${k - 1}`] = 1;
      }
      if (k < T) {
        variable[`u_dyn_${k}`] = (variable[`u_dyn_${k}`] ?? 0) - 1;
      }
      variables[`u_${k}`] = variable;
    }
    for (let t = 0; t < T; t += 1) {
      const variable = {
        obj: maximizeReturn ? 0 : -tailScale,
        [`z_ge_${t}`]: 1,
        [`z_nonneg_${t}`]: 1
      };
      if (targetCdar != null) {
        variable.cdar_max = tailScale;
      }
      variables[`z_${t}`] = variable;
    }
    const model = {
      optimize: "obj",
      opType: "max",
      constraints,
      variables
    };
    const result = import_javascript_lp_solver3.default.Solve(model);
    if (!result?.feasible) {
      return null;
    }
    const weights = Array.from(
      { length: this.nAssets },
      (_, i) => Number(result[`w_${i}`] ?? 0)
    );
    const alphaValue = Number(result.alpha ?? 0);
    const zValues = Array.from({ length: T }, (_, t) => Number(result[`z_${t}`] ?? 0));
    return { weights, alphaValue, zValues };
  }
  _setLpSolution(solution) {
    this.weights = solution.weights.slice();
    this._alphaValue = solution.alphaValue;
    this._zValues = solution.zValues.slice();
    return this._mapVectorToWeights(this.weights);
  }
  minCdar({ marketNeutral = false } = {}) {
    const targetSum = marketNeutral ? 0 : 1;
    if (this._canUseExactLp()) {
      const solution = this._solveCdarLp({ targetSum, maximizeReturn: false });
      if (solution) {
        return this._setLpSolution(solution);
      }
    }
    if (marketNeutral) {
      this._targetSum = 0;
    }
    const result = this._optimize(this._penalized((w) => this._cdar(w)));
    this._targetSum = 1;
    return result;
  }
  efficientRisk(targetCdar, { marketNeutral = false } = {}) {
    const targetSum = marketNeutral ? 0 : 1;
    if (this._canUseExactLp()) {
      const solution = this._solveCdarLp({
        targetSum,
        targetCdar,
        maximizeReturn: true
      });
      if (solution) {
        return this._setLpSolution(solution);
      }
    }
    if (marketNeutral) {
      this._targetSum = 0;
    }
    const penaltyScale = 5e3;
    const result = this._optimize(
      this._penalized((w) => {
        const cdar = this._cdar(w);
        const penalty = Math.max(0, cdar - targetCdar) ** 2 * penaltyScale;
        return -this._portfolioReturn(w) + penalty;
      })
    );
    this._targetSum = 1;
    return result;
  }
  efficientReturn(targetReturn, { marketNeutral = false } = {}) {
    const targetSum = marketNeutral ? 0 : 1;
    if (this._canUseExactLp()) {
      const solution = this._solveCdarLp({
        targetSum,
        targetReturn,
        maximizeReturn: false
      });
      if (solution) {
        return this._setLpSolution(solution);
      }
    }
    if (marketNeutral) {
      this._targetSum = 0;
    }
    const penaltyScale = 5e3;
    const result = this._optimize(
      this._penalized((w) => {
        const penalty = Math.max(0, targetReturn - this._portfolioReturn(w)) ** 2 * penaltyScale;
        return this._cdar(w) + penalty;
      })
    );
    this._targetSum = 1;
    return result;
  }
  portfolioPerformance() {
    if (this.weights == null) {
      throw new Error("portfolio_performance requires weights to be computed first");
    }
    const mu = this._portfolioReturn(this.weights);
    if (this._alphaValue != null && this._zValues != null) {
      const T = this.historicReturns.length;
      const tailScale = 1 / (T * (1 - this.beta));
      const cdar = this._alphaValue + tailScale * this._zValues.reduce((acc, v) => acc + v, 0);
      return [mu, cdar];
    }
    return [mu, this._cdar(this.weights)];
  }
  min_cdar(...args) {
    return this.minCdar(...args);
  }
  efficient_risk(...args) {
    return this.efficientRisk(...args);
  }
  efficient_return(...args) {
    return this.efficientReturn(...args);
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BaseConvexOptimizer,
  BaseOptimizer,
  BlackLittermanModel,
  CLA,
  CovarianceShrinkage,
  DiscreteAllocation,
  EfficientCDaR,
  EfficientCVaR,
  EfficientFrontier,
  EfficientSemivariance,
  HRPOpt,
  L2Reg,
  L2_reg,
  _is_positive_semidefinite,
  capmReturn,
  capm_return,
  corrToCov,
  corr_to_cov,
  covToCorr,
  cov_to_corr,
  emaHistoricalReturn,
  ema_historical_return,
  exAnteTrackingError,
  exPostTrackingError,
  ex_ante_tracking_error,
  ex_post_tracking_error,
  expCov,
  exp_cov,
  fixNonpositiveSemidefinite,
  fix_nonpositive_semidefinite,
  getLatestPrices,
  getPrior,
  get_latest_prices,
  isPositiveSemidefinite,
  marketImpliedPriorReturns,
  marketImpliedRiskAversion,
  market_implied_prior_returns,
  market_implied_risk_aversion,
  meanHistoricalReturn,
  mean_historical_return,
  minCovDeterminant,
  min_cov_determinant,
  portfolioReturn,
  portfolioVariance,
  portfolio_return,
  portfolio_variance,
  pricesFromReturns,
  prices_from_returns,
  quadraticUtility,
  quadratic_utility,
  returnModel,
  return_model,
  returnsFromPrices,
  returns_from_prices,
  riskMatrix,
  risk_matrix,
  sampleCov,
  sample_cov,
  semicovariance,
  sharpeRatio,
  sharpe_ratio,
  transactionCost,
  transaction_cost,
  validateReturnsInput
});
