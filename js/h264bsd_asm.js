// Note: For maximum-speed code, see "Optimizing Code" on the Emscripten wiki, https://github.com/kripken/emscripten/wiki/Optimizing-Code
// Note: Some Emscripten settings may limit the speed of the generated code.
// The Module object: Our interface to the outside world. We import
// and export values on it, and do the work to get that through
// closure compiler if necessary. There are various ways Module can be used:
// 1. Not defined. We create it here
// 2. A function parameter, function(Module) { ..generated code.. }
// 3. pre-run appended it, var Module = {}; ..generated code..
// 4. External script tag defines var Module.
// We need to do an eval in order to handle the closure compiler
// case, where this code here is minified but Module was defined
// elsewhere (e.g. case 4 above). We also need to check if Module
// already exists (e.g. case 3 above).
// Note that if you want to run closure, and also to use Module
// after the generated code, you will need to define   var Module = {};
// before the code. Then that object will be used in the code, and you
// can continue to use Module afterwards as well.
var Module;
if (!Module) Module = eval('(function() { try { return Module || {} } catch(e) { return {} } })()');
// Sometimes an existing Module object exists with properties
// meant to overwrite the default module functionality. Here
// we collect those properties and reapply _after_ we configure
// the current environment's defaults to avoid having to be so
// defensive during initialization.
var moduleOverrides = {};
for (var key in Module) {
  if (Module.hasOwnProperty(key)) {
    moduleOverrides[key] = Module[key];
  }
}
// The environment setup code below is customized to use Module.
// *** Environment setup code ***
var ENVIRONMENT_IS_NODE = typeof process === 'object' && typeof require === 'function';
var ENVIRONMENT_IS_WEB = typeof window === 'object';
var ENVIRONMENT_IS_WORKER = typeof importScripts === 'function';
var ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;
if (ENVIRONMENT_IS_NODE) {
  // Expose functionality in the same simple way that the shells work
  // Note that we pollute the global namespace here, otherwise we break in node
  Module['print'] = function print(x) {
    process['stdout'].write(x + '\n');
  };
  Module['printErr'] = function printErr(x) {
    process['stderr'].write(x + '\n');
  };
  var nodeFS = require('fs');
  var nodePath = require('path');
  Module['read'] = function read(filename, binary) {
    filename = nodePath['normalize'](filename);
    var ret = nodeFS['readFileSync'](filename);
    // The path is absolute if the normalized version is the same as the resolved.
    if (!ret && filename != nodePath['resolve'](filename)) {
      filename = path.join(__dirname, '..', 'src', filename);
      ret = nodeFS['readFileSync'](filename);
    }
    if (ret && !binary) ret = ret.toString();
    return ret;
  };
  Module['readBinary'] = function readBinary(filename) { return Module['read'](filename, true) };
  Module['load'] = function load(f) {
    globalEval(read(f));
  };
  Module['arguments'] = process['argv'].slice(2);
  module['exports'] = Module;
}
else if (ENVIRONMENT_IS_SHELL) {
  Module['print'] = print;
  if (typeof printErr != 'undefined') Module['printErr'] = printErr; // not present in v8 or older sm
  if (typeof read != 'undefined') {
    Module['read'] = read;
  } else {
    Module['read'] = function read() { throw 'no read() available (jsc?)' };
  }
  Module['readBinary'] = function readBinary(f) {
    return read(f, 'binary');
  };
  if (typeof scriptArgs != 'undefined') {
    Module['arguments'] = scriptArgs;
  } else if (typeof arguments != 'undefined') {
    Module['arguments'] = arguments;
  }
  this['Module'] = Module;
  eval("if (typeof gc === 'function' && gc.toString().indexOf('[native code]') > 0) var gc = undefined"); // wipe out the SpiderMonkey shell 'gc' function, which can confuse closure (uses it as a minified name, and it is then initted to a non-falsey value unexpectedly)
}
else if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
  Module['read'] = function read(url) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, false);
    xhr.send(null);
    return xhr.responseText;
  };
  if (typeof arguments != 'undefined') {
    Module['arguments'] = arguments;
  }
  if (typeof console !== 'undefined') {
    Module['print'] = function print(x) {
      console.log(x);
    };
    Module['printErr'] = function printErr(x) {
      console.log(x);
    };
  } else {
    // Probably a worker, and without console.log. We can do very little here...
    var TRY_USE_DUMP = false;
    Module['print'] = (TRY_USE_DUMP && (typeof(dump) !== "undefined") ? (function(x) {
      dump(x);
    }) : (function(x) {
      // self.postMessage(x); // enable this if you want stdout to be sent as messages
    }));
  }
  if (ENVIRONMENT_IS_WEB) {
    this['Module'] = Module;
  } else {
    Module['load'] = importScripts;
  }
}
else {
  // Unreachable because SHELL is dependant on the others
  throw 'Unknown runtime environment. Where are we?';
}
function globalEval(x) {
  eval.call(null, x);
}
if (!Module['load'] == 'undefined' && Module['read']) {
  Module['load'] = function load(f) {
    globalEval(Module['read'](f));
  };
}
if (!Module['print']) {
  Module['print'] = function(){};
}
if (!Module['printErr']) {
  Module['printErr'] = Module['print'];
}
if (!Module['arguments']) {
  Module['arguments'] = [];
}
// *** Environment setup code ***
// Closure helpers
Module.print = Module['print'];
Module.printErr = Module['printErr'];
// Callbacks
Module['preRun'] = [];
Module['postRun'] = [];
// Merge back in the overrides
for (var key in moduleOverrides) {
  if (moduleOverrides.hasOwnProperty(key)) {
    Module[key] = moduleOverrides[key];
  }
}
// === Auto-generated preamble library stuff ===
//========================================
// Runtime code shared with compiler
//========================================
var Runtime = {
  stackSave: function () {
    return STACKTOP;
  },
  stackRestore: function (stackTop) {
    STACKTOP = stackTop;
  },
  forceAlign: function (target, quantum) {
    quantum = quantum || 4;
    if (quantum == 1) return target;
    if (isNumber(target) && isNumber(quantum)) {
      return Math.ceil(target/quantum)*quantum;
    } else if (isNumber(quantum) && isPowerOfTwo(quantum)) {
      return '(((' +target + ')+' + (quantum-1) + ')&' + -quantum + ')';
    }
    return 'Math.ceil((' + target + ')/' + quantum + ')*' + quantum;
  },
  isNumberType: function (type) {
    return type in Runtime.INT_TYPES || type in Runtime.FLOAT_TYPES;
  },
  isPointerType: function isPointerType(type) {
  return type[type.length-1] == '*';
},
  isStructType: function isStructType(type) {
  if (isPointerType(type)) return false;
  if (isArrayType(type)) return true;
  if (/<?{ ?[^}]* ?}>?/.test(type)) return true; // { i32, i8 } etc. - anonymous struct types
  // See comment in isStructPointerType()
  return type[0] == '%';
},
  INT_TYPES: {"i1":0,"i8":0,"i16":0,"i32":0,"i64":0},
  FLOAT_TYPES: {"float":0,"double":0},
  or64: function (x, y) {
    var l = (x | 0) | (y | 0);
    var h = (Math.round(x / 4294967296) | Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  and64: function (x, y) {
    var l = (x | 0) & (y | 0);
    var h = (Math.round(x / 4294967296) & Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  xor64: function (x, y) {
    var l = (x | 0) ^ (y | 0);
    var h = (Math.round(x / 4294967296) ^ Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  getNativeTypeSize: function (type) {
    switch (type) {
      case 'i1': case 'i8': return 1;
      case 'i16': return 2;
      case 'i32': return 4;
      case 'i64': return 8;
      case 'float': return 4;
      case 'double': return 8;
      default: {
        if (type[type.length-1] === '*') {
          return Runtime.QUANTUM_SIZE; // A pointer
        } else if (type[0] === 'i') {
          var bits = parseInt(type.substr(1));
          assert(bits % 8 === 0);
          return bits/8;
        } else {
          return 0;
        }
      }
    }
  },
  getNativeFieldSize: function (type) {
    return Math.max(Runtime.getNativeTypeSize(type), Runtime.QUANTUM_SIZE);
  },
  dedup: function dedup(items, ident) {
  var seen = {};
  if (ident) {
    return items.filter(function(item) {
      if (seen[item[ident]]) return false;
      seen[item[ident]] = true;
      return true;
    });
  } else {
    return items.filter(function(item) {
      if (seen[item]) return false;
      seen[item] = true;
      return true;
    });
  }
},
  set: function set() {
  var args = typeof arguments[0] === 'object' ? arguments[0] : arguments;
  var ret = {};
  for (var i = 0; i < args.length; i++) {
    ret[args[i]] = 0;
  }
  return ret;
},
  STACK_ALIGN: 8,
  getAlignSize: function (type, size, vararg) {
    // we align i64s and doubles on 64-bit boundaries, unlike x86
    if (type == 'i64' || type == 'double' || vararg) return 8;
    if (!type) return Math.min(size, 8); // align structures internally to 64 bits
    return Math.min(size || (type ? Runtime.getNativeFieldSize(type) : 0), Runtime.QUANTUM_SIZE);
  },
  calculateStructAlignment: function calculateStructAlignment(type) {
    type.flatSize = 0;
    type.alignSize = 0;
    var diffs = [];
    var prev = -1;
    var index = 0;
    type.flatIndexes = type.fields.map(function(field) {
      index++;
      var size, alignSize;
      if (Runtime.isNumberType(field) || Runtime.isPointerType(field)) {
        size = Runtime.getNativeTypeSize(field); // pack char; char; in structs, also char[X]s.
        alignSize = Runtime.getAlignSize(field, size);
      } else if (Runtime.isStructType(field)) {
        if (field[1] === '0') {
          // this is [0 x something]. When inside another structure like here, it must be at the end,
          // and it adds no size
          // XXX this happens in java-nbody for example... assert(index === type.fields.length, 'zero-length in the middle!');
          size = 0;
          if (Types.types[field]) {
            alignSize = Runtime.getAlignSize(null, Types.types[field].alignSize);
          } else {
            alignSize = type.alignSize || QUANTUM_SIZE;
          }
        } else {
          size = Types.types[field].flatSize;
          alignSize = Runtime.getAlignSize(null, Types.types[field].alignSize);
        }
      } else if (field[0] == 'b') {
        // bN, large number field, like a [N x i8]
        size = field.substr(1)|0;
        alignSize = 1;
      } else if (field[0] === '<') {
        // vector type
        size = alignSize = Types.types[field].flatSize; // fully aligned
      } else if (field[0] === 'i') {
        // illegal integer field, that could not be legalized because it is an internal structure field
        // it is ok to have such fields, if we just use them as markers of field size and nothing more complex
        size = alignSize = parseInt(field.substr(1))/8;
        assert(size % 1 === 0, 'cannot handle non-byte-size field ' + field);
      } else {
        assert(false, 'invalid type for calculateStructAlignment');
      }
      if (type.packed) alignSize = 1;
      type.alignSize = Math.max(type.alignSize, alignSize);
      var curr = Runtime.alignMemory(type.flatSize, alignSize); // if necessary, place this on aligned memory
      type.flatSize = curr + size;
      if (prev >= 0) {
        diffs.push(curr-prev);
      }
      prev = curr;
      return curr;
    });
    if (type.name_[0] === '[') {
      // arrays have 2 elements, so we get the proper difference. then we scale here. that way we avoid
      // allocating a potentially huge array for [999999 x i8] etc.
      type.flatSize = parseInt(type.name_.substr(1))*type.flatSize/2;
    }
    type.flatSize = Runtime.alignMemory(type.flatSize, type.alignSize);
    if (diffs.length == 0) {
      type.flatFactor = type.flatSize;
    } else if (Runtime.dedup(diffs).length == 1) {
      type.flatFactor = diffs[0];
    }
    type.needsFlattening = (type.flatFactor != 1);
    return type.flatIndexes;
  },
  generateStructInfo: function (struct, typeName, offset) {
    var type, alignment;
    if (typeName) {
      offset = offset || 0;
      type = (typeof Types === 'undefined' ? Runtime.typeInfo : Types.types)[typeName];
      if (!type) return null;
      if (type.fields.length != struct.length) {
        printErr('Number of named fields must match the type for ' + typeName + ': possibly duplicate struct names. Cannot return structInfo');
        return null;
      }
      alignment = type.flatIndexes;
    } else {
      var type = { fields: struct.map(function(item) { return item[0] }) };
      alignment = Runtime.calculateStructAlignment(type);
    }
    var ret = {
      __size__: type.flatSize
    };
    if (typeName) {
      struct.forEach(function(item, i) {
        if (typeof item === 'string') {
          ret[item] = alignment[i] + offset;
        } else {
          // embedded struct
          var key;
          for (var k in item) key = k;
          ret[key] = Runtime.generateStructInfo(item[key], type.fields[i], alignment[i]);
        }
      });
    } else {
      struct.forEach(function(item, i) {
        ret[item[1]] = alignment[i];
      });
    }
    return ret;
  },
  dynCall: function (sig, ptr, args) {
    if (args && args.length) {
      if (!args.splice) args = Array.prototype.slice.call(args);
      args.splice(0, 0, ptr);
      return Module['dynCall_' + sig].apply(null, args);
    } else {
      return Module['dynCall_' + sig].call(null, ptr);
    }
  },
  functionPointers: [],
  addFunction: function (func) {
    for (var i = 0; i < Runtime.functionPointers.length; i++) {
      if (!Runtime.functionPointers[i]) {
        Runtime.functionPointers[i] = func;
        return 2*(1 + i);
      }
    }
    throw 'Finished up all reserved function pointers. Use a higher value for RESERVED_FUNCTION_POINTERS.';
  },
  removeFunction: function (index) {
    Runtime.functionPointers[(index-2)/2] = null;
  },
  getAsmConst: function (code, numArgs) {
    // code is a constant string on the heap, so we can cache these
    if (!Runtime.asmConstCache) Runtime.asmConstCache = {};
    var func = Runtime.asmConstCache[code];
    if (func) return func;
    var args = [];
    for (var i = 0; i < numArgs; i++) {
      args.push(String.fromCharCode(36) + i); // $0, $1 etc
    }
    return Runtime.asmConstCache[code] = eval('(function(' + args.join(',') + '){ ' + Pointer_stringify(code) + ' })'); // new Function does not allow upvars in node
  },
  warnOnce: function (text) {
    if (!Runtime.warnOnce.shown) Runtime.warnOnce.shown = {};
    if (!Runtime.warnOnce.shown[text]) {
      Runtime.warnOnce.shown[text] = 1;
      Module.printErr(text);
    }
  },
  funcWrappers: {},
  getFuncWrapper: function (func, sig) {
    assert(sig);
    if (!Runtime.funcWrappers[func]) {
      Runtime.funcWrappers[func] = function dynCall_wrapper() {
        return Runtime.dynCall(sig, func, arguments);
      };
    }
    return Runtime.funcWrappers[func];
  },
  UTF8Processor: function () {
    var buffer = [];
    var needed = 0;
    this.processCChar = function (code) {
      code = code & 0xFF;
      if (buffer.length == 0) {
        if ((code & 0x80) == 0x00) {        // 0xxxxxxx
          return String.fromCharCode(code);
        }
        buffer.push(code);
        if ((code & 0xE0) == 0xC0) {        // 110xxxxx
          needed = 1;
        } else if ((code & 0xF0) == 0xE0) { // 1110xxxx
          needed = 2;
        } else {                            // 11110xxx
          needed = 3;
        }
        return '';
      }
      if (needed) {
        buffer.push(code);
        needed--;
        if (needed > 0) return '';
      }
      var c1 = buffer[0];
      var c2 = buffer[1];
      var c3 = buffer[2];
      var c4 = buffer[3];
      var ret;
      if (buffer.length == 2) {
        ret = String.fromCharCode(((c1 & 0x1F) << 6)  | (c2 & 0x3F));
      } else if (buffer.length == 3) {
        ret = String.fromCharCode(((c1 & 0x0F) << 12) | ((c2 & 0x3F) << 6)  | (c3 & 0x3F));
      } else {
        // http://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
        var codePoint = ((c1 & 0x07) << 18) | ((c2 & 0x3F) << 12) |
                        ((c3 & 0x3F) << 6)  | (c4 & 0x3F);
        ret = String.fromCharCode(
          Math.floor((codePoint - 0x10000) / 0x400) + 0xD800,
          (codePoint - 0x10000) % 0x400 + 0xDC00);
      }
      buffer.length = 0;
      return ret;
    }
    this.processJSString = function processJSString(string) {
      string = unescape(encodeURIComponent(string));
      var ret = [];
      for (var i = 0; i < string.length; i++) {
        ret.push(string.charCodeAt(i));
      }
      return ret;
    }
  },
  stackAlloc: function (size) { var ret = STACKTOP;STACKTOP = (STACKTOP + size)|0;STACKTOP = (((STACKTOP)+7)&-8); return ret; },
  staticAlloc: function (size) { var ret = STATICTOP;STATICTOP = (STATICTOP + size)|0;STATICTOP = (((STATICTOP)+7)&-8); return ret; },
  dynamicAlloc: function (size) { var ret = DYNAMICTOP;DYNAMICTOP = (DYNAMICTOP + size)|0;DYNAMICTOP = (((DYNAMICTOP)+7)&-8); if (DYNAMICTOP >= TOTAL_MEMORY) enlargeMemory();; return ret; },
  alignMemory: function (size,quantum) { var ret = size = Math.ceil((size)/(quantum ? quantum : 8))*(quantum ? quantum : 8); return ret; },
  makeBigInt: function (low,high,unsigned) { var ret = (unsigned ? ((+((low>>>0)))+((+((high>>>0)))*(+4294967296))) : ((+((low>>>0)))+((+((high|0)))*(+4294967296)))); return ret; },
  GLOBAL_BASE: 8,
  QUANTUM_SIZE: 4,
  __dummy__: 0
}
//========================================
// Runtime essentials
//========================================
var __THREW__ = 0; // Used in checking for thrown exceptions.
var ABORT = false; // whether we are quitting the application. no code should run after this. set in exit() and abort()
var EXITSTATUS = 0;
var undef = 0;
// tempInt is used for 32-bit signed values or smaller. tempBigInt is used
// for 32-bit unsigned values or more than 32 bits. TODO: audit all uses of tempInt
var tempValue, tempInt, tempBigInt, tempInt2, tempBigInt2, tempPair, tempBigIntI, tempBigIntR, tempBigIntS, tempBigIntP, tempBigIntD, tempDouble, tempFloat;
var tempI64, tempI64b;
var tempRet0, tempRet1, tempRet2, tempRet3, tempRet4, tempRet5, tempRet6, tempRet7, tempRet8, tempRet9;
function assert(condition, text) {
  if (!condition) {
    abort('Assertion failed: ' + text);
  }
}
var globalScope = this;
// C calling interface. A convenient way to call C functions (in C files, or
// defined with extern "C").
//
// Note: LLVM optimizations can inline and remove functions, after which you will not be
//       able to call them. Closure can also do so. To avoid that, add your function to
//       the exports using something like
//
//         -s EXPORTED_FUNCTIONS='["_main", "_myfunc"]'
//
// @param ident      The name of the C function (note that C++ functions will be name-mangled - use extern "C")
// @param returnType The return type of the function, one of the JS types 'number', 'string' or 'array' (use 'number' for any C pointer, and
//                   'array' for JavaScript arrays and typed arrays; note that arrays are 8-bit).
// @param argTypes   An array of the types of arguments for the function (if there are no arguments, this can be ommitted). Types are as in returnType,
//                   except that 'array' is not possible (there is no way for us to know the length of the array)
// @param args       An array of the arguments to the function, as native JS values (as in returnType)
//                   Note that string arguments will be stored on the stack (the JS string will become a C string on the stack).
// @return           The return value, as a native JS value (as in returnType)
function ccall(ident, returnType, argTypes, args) {
  return ccallFunc(getCFunc(ident), returnType, argTypes, args);
}
Module["ccall"] = ccall;
// Returns the C function with a specified identifier (for C++, you need to do manual name mangling)
function getCFunc(ident) {
  try {
    var func = Module['_' + ident]; // closure exported function
    if (!func) func = eval('_' + ident); // explicit lookup
  } catch(e) {
  }
  assert(func, 'Cannot call unknown function ' + ident + ' (perhaps LLVM optimizations or closure removed it?)');
  return func;
}
// Internal function that does a C call using a function, not an identifier
function ccallFunc(func, returnType, argTypes, args) {
  var stack = 0;
  function toC(value, type) {
    if (type == 'string') {
      if (value === null || value === undefined || value === 0) return 0; // null string
      value = intArrayFromString(value);
      type = 'array';
    }
    if (type == 'array') {
      if (!stack) stack = Runtime.stackSave();
      var ret = Runtime.stackAlloc(value.length);
      writeArrayToMemory(value, ret);
      return ret;
    }
    return value;
  }
  function fromC(value, type) {
    if (type == 'string') {
      return Pointer_stringify(value);
    }
    assert(type != 'array');
    return value;
  }
  var i = 0;
  var cArgs = args ? args.map(function(arg) {
    return toC(arg, argTypes[i++]);
  }) : [];
  var ret = fromC(func.apply(null, cArgs), returnType);
  if (stack) Runtime.stackRestore(stack);
  return ret;
}
// Returns a native JS wrapper for a C function. This is similar to ccall, but
// returns a function you can call repeatedly in a normal way. For example:
//
//   var my_function = cwrap('my_c_function', 'number', ['number', 'number']);
//   alert(my_function(5, 22));
//   alert(my_function(99, 12));
//
function cwrap(ident, returnType, argTypes) {
  var func = getCFunc(ident);
  return function() {
    return ccallFunc(func, returnType, argTypes, Array.prototype.slice.call(arguments));
  }
}
Module["cwrap"] = cwrap;
// Sets a value in memory in a dynamic way at run-time. Uses the
// type data. This is the same as makeSetValue, except that
// makeSetValue is done at compile-time and generates the needed
// code then, whereas this function picks the right code at
// run-time.
// Note that setValue and getValue only do *aligned* writes and reads!
// Note that ccall uses JS types as for defining types, while setValue and
// getValue need LLVM types ('i8', 'i32') - this is a lower-level operation
function setValue(ptr, value, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': HEAP8[(ptr)]=value; break;
      case 'i8': HEAP8[(ptr)]=value; break;
      case 'i16': HEAP16[((ptr)>>1)]=value; break;
      case 'i32': HEAP32[((ptr)>>2)]=value; break;
      case 'i64': (tempI64 = [value>>>0,(tempDouble=value,(+(Math_abs(tempDouble))) >= (+1) ? (tempDouble > (+0) ? ((Math_min((+(Math_floor((tempDouble)/(+4294967296)))), (+4294967295)))|0)>>>0 : (~~((+(Math_ceil((tempDouble - +(((~~(tempDouble)))>>>0))/(+4294967296))))))>>>0) : 0)],HEAP32[((ptr)>>2)]=tempI64[0],HEAP32[(((ptr)+(4))>>2)]=tempI64[1]); break;
      case 'float': HEAPF32[((ptr)>>2)]=value; break;
      case 'double': HEAPF64[((ptr)>>3)]=value; break;
      default: abort('invalid type for setValue: ' + type);
    }
}
Module['setValue'] = setValue;
// Parallel to setValue.
function getValue(ptr, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': return HEAP8[(ptr)];
      case 'i8': return HEAP8[(ptr)];
      case 'i16': return HEAP16[((ptr)>>1)];
      case 'i32': return HEAP32[((ptr)>>2)];
      case 'i64': return HEAP32[((ptr)>>2)];
      case 'float': return HEAPF32[((ptr)>>2)];
      case 'double': return HEAPF64[((ptr)>>3)];
      default: abort('invalid type for setValue: ' + type);
    }
  return null;
}
Module['getValue'] = getValue;
var ALLOC_NORMAL = 0; // Tries to use _malloc()
var ALLOC_STACK = 1; // Lives for the duration of the current function call
var ALLOC_STATIC = 2; // Cannot be freed
var ALLOC_DYNAMIC = 3; // Cannot be freed except through sbrk
var ALLOC_NONE = 4; // Do not allocate
Module['ALLOC_NORMAL'] = ALLOC_NORMAL;
Module['ALLOC_STACK'] = ALLOC_STACK;
Module['ALLOC_STATIC'] = ALLOC_STATIC;
Module['ALLOC_DYNAMIC'] = ALLOC_DYNAMIC;
Module['ALLOC_NONE'] = ALLOC_NONE;
// allocate(): This is for internal use. You can use it yourself as well, but the interface
//             is a little tricky (see docs right below). The reason is that it is optimized
//             for multiple syntaxes to save space in generated code. So you should
//             normally not use allocate(), and instead allocate memory using _malloc(),
//             initialize it with setValue(), and so forth.
// @slab: An array of data, or a number. If a number, then the size of the block to allocate,
//        in *bytes* (note that this is sometimes confusing: the next parameter does not
//        affect this!)
// @types: Either an array of types, one for each byte (or 0 if no type at that position),
//         or a single type which is used for the entire block. This only matters if there
//         is initial data - if @slab is a number, then this does not matter at all and is
//         ignored.
// @allocator: How to allocate memory, see ALLOC_*
function allocate(slab, types, allocator, ptr) {
  var zeroinit, size;
  if (typeof slab === 'number') {
    zeroinit = true;
    size = slab;
  } else {
    zeroinit = false;
    size = slab.length;
  }
  var singleType = typeof types === 'string' ? types : null;
  var ret;
  if (allocator == ALLOC_NONE) {
    ret = ptr;
  } else {
    ret = [_malloc, Runtime.stackAlloc, Runtime.staticAlloc, Runtime.dynamicAlloc][allocator === undefined ? ALLOC_STATIC : allocator](Math.max(size, singleType ? 1 : types.length));
  }
  if (zeroinit) {
    var ptr = ret, stop;
    assert((ret & 3) == 0);
    stop = ret + (size & ~3);
    for (; ptr < stop; ptr += 4) {
      HEAP32[((ptr)>>2)]=0;
    }
    stop = ret + size;
    while (ptr < stop) {
      HEAP8[((ptr++)|0)]=0;
    }
    return ret;
  }
  if (singleType === 'i8') {
    if (slab.subarray || slab.slice) {
      HEAPU8.set(slab, ret);
    } else {
      HEAPU8.set(new Uint8Array(slab), ret);
    }
    return ret;
  }
  var i = 0, type, typeSize, previousType;
  while (i < size) {
    var curr = slab[i];
    if (typeof curr === 'function') {
      curr = Runtime.getFunctionIndex(curr);
    }
    type = singleType || types[i];
    if (type === 0) {
      i++;
      continue;
    }
    if (type == 'i64') type = 'i32'; // special case: we have one i32 here, and one i32 later
    setValue(ret+i, curr, type);
    // no need to look up size unless type changes, so cache it
    if (previousType !== type) {
      typeSize = Runtime.getNativeTypeSize(type);
      previousType = type;
    }
    i += typeSize;
  }
  return ret;
}
Module['allocate'] = allocate;
function Pointer_stringify(ptr, /* optional */ length) {
  // TODO: use TextDecoder
  // Find the length, and check for UTF while doing so
  var hasUtf = false;
  var t;
  var i = 0;
  while (1) {
    t = HEAPU8[(((ptr)+(i))|0)];
    if (t >= 128) hasUtf = true;
    else if (t == 0 && !length) break;
    i++;
    if (length && i == length) break;
  }
  if (!length) length = i;
  var ret = '';
  if (!hasUtf) {
    var MAX_CHUNK = 1024; // split up into chunks, because .apply on a huge string can overflow the stack
    var curr;
    while (length > 0) {
      curr = String.fromCharCode.apply(String, HEAPU8.subarray(ptr, ptr + Math.min(length, MAX_CHUNK)));
      ret = ret ? ret + curr : curr;
      ptr += MAX_CHUNK;
      length -= MAX_CHUNK;
    }
    return ret;
  }
  var utf8 = new Runtime.UTF8Processor();
  for (i = 0; i < length; i++) {
    t = HEAPU8[(((ptr)+(i))|0)];
    ret += utf8.processCChar(t);
  }
  return ret;
}
Module['Pointer_stringify'] = Pointer_stringify;
// Given a pointer 'ptr' to a null-terminated UTF16LE-encoded string in the emscripten HEAP, returns
// a copy of that string as a Javascript String object.
function UTF16ToString(ptr) {
  var i = 0;
  var str = '';
  while (1) {
    var codeUnit = HEAP16[(((ptr)+(i*2))>>1)];
    if (codeUnit == 0)
      return str;
    ++i;
    // fromCharCode constructs a character from a UTF-16 code unit, so we can pass the UTF16 string right through.
    str += String.fromCharCode(codeUnit);
  }
}
Module['UTF16ToString'] = UTF16ToString;
// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr', 
// null-terminated and encoded in UTF16LE form. The copy will require at most (str.length*2+1)*2 bytes of space in the HEAP.
function stringToUTF16(str, outPtr) {
  for(var i = 0; i < str.length; ++i) {
    // charCodeAt returns a UTF-16 encoded code unit, so it can be directly written to the HEAP.
    var codeUnit = str.charCodeAt(i); // possibly a lead surrogate
    HEAP16[(((outPtr)+(i*2))>>1)]=codeUnit
  }
  // Null-terminate the pointer to the HEAP.
  HEAP16[(((outPtr)+(str.length*2))>>1)]=0
}
Module['stringToUTF16'] = stringToUTF16;
// Given a pointer 'ptr' to a null-terminated UTF32LE-encoded string in the emscripten HEAP, returns
// a copy of that string as a Javascript String object.
function UTF32ToString(ptr) {
  var i = 0;
  var str = '';
  while (1) {
    var utf32 = HEAP32[(((ptr)+(i*4))>>2)];
    if (utf32 == 0)
      return str;
    ++i;
    // Gotcha: fromCharCode constructs a character from a UTF-16 encoded code (pair), not from a Unicode code point! So encode the code point to UTF-16 for constructing.
    if (utf32 >= 0x10000) {
      var ch = utf32 - 0x10000;
      str += String.fromCharCode(0xD800 | (ch >> 10), 0xDC00 | (ch & 0x3FF));
    } else {
      str += String.fromCharCode(utf32);
    }
  }
}
Module['UTF32ToString'] = UTF32ToString;
// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr', 
// null-terminated and encoded in UTF32LE form. The copy will require at most (str.length+1)*4 bytes of space in the HEAP,
// but can use less, since str.length does not return the number of characters in the string, but the number of UTF-16 code units in the string.
function stringToUTF32(str, outPtr) {
  var iChar = 0;
  for(var iCodeUnit = 0; iCodeUnit < str.length; ++iCodeUnit) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! We must decode the string to UTF-32 to the heap.
    var codeUnit = str.charCodeAt(iCodeUnit); // possibly a lead surrogate
    if (codeUnit >= 0xD800 && codeUnit <= 0xDFFF) {
      var trailSurrogate = str.charCodeAt(++iCodeUnit);
      codeUnit = 0x10000 + ((codeUnit & 0x3FF) << 10) | (trailSurrogate & 0x3FF);
    }
    HEAP32[(((outPtr)+(iChar*4))>>2)]=codeUnit
    ++iChar;
  }
  // Null-terminate the pointer to the HEAP.
  HEAP32[(((outPtr)+(iChar*4))>>2)]=0
}
Module['stringToUTF32'] = stringToUTF32;
function demangle(func) {
  try {
    if (typeof func === 'number') func = Pointer_stringify(func);
    if (func[0] !== '_') return func;
    if (func[1] !== '_') return func; // C function
    if (func[2] !== 'Z') return func;
    switch (func[3]) {
      case 'n': return 'operator new()';
      case 'd': return 'operator delete()';
    }
    var i = 3;
    // params, etc.
    var basicTypes = {
      'v': 'void',
      'b': 'bool',
      'c': 'char',
      's': 'short',
      'i': 'int',
      'l': 'long',
      'f': 'float',
      'd': 'double',
      'w': 'wchar_t',
      'a': 'signed char',
      'h': 'unsigned char',
      't': 'unsigned short',
      'j': 'unsigned int',
      'm': 'unsigned long',
      'x': 'long long',
      'y': 'unsigned long long',
      'z': '...'
    };
    function dump(x) {
      //return;
      if (x) Module.print(x);
      Module.print(func);
      var pre = '';
      for (var a = 0; a < i; a++) pre += ' ';
      Module.print (pre + '^');
    }
    var subs = [];
    function parseNested() {
      i++;
      if (func[i] === 'K') i++; // ignore const
      var parts = [];
      while (func[i] !== 'E') {
        if (func[i] === 'S') { // substitution
          i++;
          var next = func.indexOf('_', i);
          var num = func.substring(i, next) || 0;
          parts.push(subs[num] || '?');
          i = next+1;
          continue;
        }
        if (func[i] === 'C') { // constructor
          parts.push(parts[parts.length-1]);
          i += 2;
          continue;
        }
        var size = parseInt(func.substr(i));
        var pre = size.toString().length;
        if (!size || !pre) { i--; break; } // counter i++ below us
        var curr = func.substr(i + pre, size);
        parts.push(curr);
        subs.push(curr);
        i += pre + size;
      }
      i++; // skip E
      return parts;
    }
    var first = true;
    function parse(rawList, limit, allowVoid) { // main parser
      limit = limit || Infinity;
      var ret = '', list = [];
      function flushList() {
        return '(' + list.join(', ') + ')';
      }
      var name;
      if (func[i] === 'N') {
        // namespaced N-E
        name = parseNested().join('::');
        limit--;
        if (limit === 0) return rawList ? [name] : name;
      } else {
        // not namespaced
        if (func[i] === 'K' || (first && func[i] === 'L')) i++; // ignore const and first 'L'
        var size = parseInt(func.substr(i));
        if (size) {
          var pre = size.toString().length;
          name = func.substr(i + pre, size);
          i += pre + size;
        }
      }
      first = false;
      if (func[i] === 'I') {
        i++;
        var iList = parse(true);
        var iRet = parse(true, 1, true);
        ret += iRet[0] + ' ' + name + '<' + iList.join(', ') + '>';
      } else {
        ret = name;
      }
      paramLoop: while (i < func.length && limit-- > 0) {
        //dump('paramLoop');
        var c = func[i++];
        if (c in basicTypes) {
          list.push(basicTypes[c]);
        } else {
          switch (c) {
            case 'P': list.push(parse(true, 1, true)[0] + '*'); break; // pointer
            case 'R': list.push(parse(true, 1, true)[0] + '&'); break; // reference
            case 'L': { // literal
              i++; // skip basic type
              var end = func.indexOf('E', i);
              var size = end - i;
              list.push(func.substr(i, size));
              i += size + 2; // size + 'EE'
              break;
            }
            case 'A': { // array
              var size = parseInt(func.substr(i));
              i += size.toString().length;
              if (func[i] !== '_') throw '?';
              i++; // skip _
              list.push(parse(true, 1, true)[0] + ' [' + size + ']');
              break;
            }
            case 'E': break paramLoop;
            default: ret += '?' + c; break paramLoop;
          }
        }
      }
      if (!allowVoid && list.length === 1 && list[0] === 'void') list = []; // avoid (void)
      return rawList ? list : ret + flushList();
    }
    return parse();
  } catch(e) {
    return func;
  }
}
function demangleAll(text) {
  return text.replace(/__Z[\w\d_]+/g, function(x) { var y = demangle(x); return x === y ? x : (x + ' [' + y + ']') });
}
function stackTrace() {
  var stack = new Error().stack;
  return stack ? demangleAll(stack) : '(no stack trace available)'; // Stack trace is not available at least on IE10 and Safari 6.
}
// Memory management
var PAGE_SIZE = 4096;
function alignMemoryPage(x) {
  return (x+4095)&-4096;
}
var HEAP;
var HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;
var STATIC_BASE = 0, STATICTOP = 0, staticSealed = false; // static area
var STACK_BASE = 0, STACKTOP = 0, STACK_MAX = 0; // stack area
var DYNAMIC_BASE = 0, DYNAMICTOP = 0; // dynamic area handled by sbrk
function enlargeMemory() {
  abort('Cannot enlarge memory arrays in asm.js. Either (1) compile with -s TOTAL_MEMORY=X with X higher than the current value ' + TOTAL_MEMORY + ', or (2) set Module.TOTAL_MEMORY before the program runs.');
}
var TOTAL_STACK = Module['TOTAL_STACK'] || 5242880;
var TOTAL_MEMORY = Module['TOTAL_MEMORY'] || 16777216;
var FAST_MEMORY = Module['FAST_MEMORY'] || 2097152;
// Initialize the runtime's memory
// check for full engine support (use string 'subarray' to avoid closure compiler confusion)
assert(typeof Int32Array !== 'undefined' && typeof Float64Array !== 'undefined' && !!(new Int32Array(1)['subarray']) && !!(new Int32Array(1)['set']),
       'Cannot fallback to non-typed array case: Code is too specialized');
var buffer = new ArrayBuffer(TOTAL_MEMORY);
HEAP8 = new Int8Array(buffer);
HEAP16 = new Int16Array(buffer);
HEAP32 = new Int32Array(buffer);
HEAPU8 = new Uint8Array(buffer);
HEAPU16 = new Uint16Array(buffer);
HEAPU32 = new Uint32Array(buffer);
HEAPF32 = new Float32Array(buffer);
HEAPF64 = new Float64Array(buffer);
// Endianness check (note: assumes compiler arch was little-endian)
HEAP32[0] = 255;
assert(HEAPU8[0] === 255 && HEAPU8[3] === 0, 'Typed arrays 2 must be run on a little-endian system');
Module['HEAP'] = HEAP;
Module['HEAP8'] = HEAP8;
Module['HEAP16'] = HEAP16;
Module['HEAP32'] = HEAP32;
Module['HEAPU8'] = HEAPU8;
Module['HEAPU16'] = HEAPU16;
Module['HEAPU32'] = HEAPU32;
Module['HEAPF32'] = HEAPF32;
Module['HEAPF64'] = HEAPF64;
function callRuntimeCallbacks(callbacks) {
  while(callbacks.length > 0) {
    var callback = callbacks.shift();
    if (typeof callback == 'function') {
      callback();
      continue;
    }
    var func = callback.func;
    if (typeof func === 'number') {
      if (callback.arg === undefined) {
        Runtime.dynCall('v', func);
      } else {
        Runtime.dynCall('vi', func, [callback.arg]);
      }
    } else {
      func(callback.arg === undefined ? null : callback.arg);
    }
  }
}
var __ATPRERUN__  = []; // functions called before the runtime is initialized
var __ATINIT__    = []; // functions called during startup
var __ATMAIN__    = []; // functions called when main() is to be run
var __ATEXIT__    = []; // functions called during shutdown
var __ATPOSTRUN__ = []; // functions called after the runtime has exited
var runtimeInitialized = false;
function preRun() {
  // compatibility - merge in anything from Module['preRun'] at this time
  if (Module['preRun']) {
    if (typeof Module['preRun'] == 'function') Module['preRun'] = [Module['preRun']];
    while (Module['preRun'].length) {
      addOnPreRun(Module['preRun'].shift());
    }
  }
  callRuntimeCallbacks(__ATPRERUN__);
}
function ensureInitRuntime() {
  if (runtimeInitialized) return;
  runtimeInitialized = true;
  callRuntimeCallbacks(__ATINIT__);
}
function preMain() {
  callRuntimeCallbacks(__ATMAIN__);
}
function exitRuntime() {
  callRuntimeCallbacks(__ATEXIT__);
}
function postRun() {
  // compatibility - merge in anything from Module['postRun'] at this time
  if (Module['postRun']) {
    if (typeof Module['postRun'] == 'function') Module['postRun'] = [Module['postRun']];
    while (Module['postRun'].length) {
      addOnPostRun(Module['postRun'].shift());
    }
  }
  callRuntimeCallbacks(__ATPOSTRUN__);
}
function addOnPreRun(cb) {
  __ATPRERUN__.unshift(cb);
}
Module['addOnPreRun'] = Module.addOnPreRun = addOnPreRun;
function addOnInit(cb) {
  __ATINIT__.unshift(cb);
}
Module['addOnInit'] = Module.addOnInit = addOnInit;
function addOnPreMain(cb) {
  __ATMAIN__.unshift(cb);
}
Module['addOnPreMain'] = Module.addOnPreMain = addOnPreMain;
function addOnExit(cb) {
  __ATEXIT__.unshift(cb);
}
Module['addOnExit'] = Module.addOnExit = addOnExit;
function addOnPostRun(cb) {
  __ATPOSTRUN__.unshift(cb);
}
Module['addOnPostRun'] = Module.addOnPostRun = addOnPostRun;
// Tools
// This processes a JS string into a C-line array of numbers, 0-terminated.
// For LLVM-originating strings, see parser.js:parseLLVMString function
function intArrayFromString(stringy, dontAddNull, length /* optional */) {
  var ret = (new Runtime.UTF8Processor()).processJSString(stringy);
  if (length) {
    ret.length = length;
  }
  if (!dontAddNull) {
    ret.push(0);
  }
  return ret;
}
Module['intArrayFromString'] = intArrayFromString;
function intArrayToString(array) {
  var ret = [];
  for (var i = 0; i < array.length; i++) {
    var chr = array[i];
    if (chr > 0xFF) {
      chr &= 0xFF;
    }
    ret.push(String.fromCharCode(chr));
  }
  return ret.join('');
}
Module['intArrayToString'] = intArrayToString;
// Write a Javascript array to somewhere in the heap
function writeStringToMemory(string, buffer, dontAddNull) {
  var array = intArrayFromString(string, dontAddNull);
  var i = 0;
  while (i < array.length) {
    var chr = array[i];
    HEAP8[(((buffer)+(i))|0)]=chr
    i = i + 1;
  }
}
Module['writeStringToMemory'] = writeStringToMemory;
function writeArrayToMemory(array, buffer) {
  for (var i = 0; i < array.length; i++) {
    HEAP8[(((buffer)+(i))|0)]=array[i];
  }
}
Module['writeArrayToMemory'] = writeArrayToMemory;
function writeAsciiToMemory(str, buffer, dontAddNull) {
  for (var i = 0; i < str.length; i++) {
    HEAP8[(((buffer)+(i))|0)]=str.charCodeAt(i)
  }
  if (!dontAddNull) HEAP8[(((buffer)+(str.length))|0)]=0
}
Module['writeAsciiToMemory'] = writeAsciiToMemory;
function unSign(value, bits, ignore, sig) {
  if (value >= 0) {
    return value;
  }
  return bits <= 32 ? 2*Math.abs(1 << (bits-1)) + value // Need some trickery, since if bits == 32, we are right at the limit of the bits JS uses in bitshifts
                    : Math.pow(2, bits)         + value;
}
function reSign(value, bits, ignore, sig) {
  if (value <= 0) {
    return value;
  }
  var half = bits <= 32 ? Math.abs(1 << (bits-1)) // abs is needed if bits == 32
                        : Math.pow(2, bits-1);
  if (value >= half && (bits <= 32 || value > half)) { // for huge values, we can hit the precision limit and always get true here. so don't do that
                                                       // but, in general there is no perfect solution here. With 64-bit ints, we get rounding and errors
                                                       // TODO: In i64 mode 1, resign the two parts separately and safely
    value = -2*half + value; // Cannot bitshift half, as it may be at the limit of the bits JS uses in bitshifts
  }
  return value;
}
if (!Math['imul']) Math['imul'] = function imul(a, b) {
  var ah  = a >>> 16;
  var al = a & 0xffff;
  var bh  = b >>> 16;
  var bl = b & 0xffff;
  return (al*bl + ((ah*bl + al*bh) << 16))|0;
};
Math.imul = Math['imul'];
var Math_abs = Math.abs;
var Math_cos = Math.cos;
var Math_sin = Math.sin;
var Math_tan = Math.tan;
var Math_acos = Math.acos;
var Math_asin = Math.asin;
var Math_atan = Math.atan;
var Math_atan2 = Math.atan2;
var Math_exp = Math.exp;
var Math_log = Math.log;
var Math_sqrt = Math.sqrt;
var Math_ceil = Math.ceil;
var Math_floor = Math.floor;
var Math_pow = Math.pow;
var Math_imul = Math.imul;
var Math_fround = Math.fround;
var Math_min = Math.min;
// A counter of dependencies for calling run(). If we need to
// do asynchronous work before running, increment this and
// decrement it. Incrementing must happen in a place like
// PRE_RUN_ADDITIONS (used by emcc to add file preloading).
// Note that you can add dependencies in preRun, even though
// it happens right before run - run will be postponed until
// the dependencies are met.
var runDependencies = 0;
var runDependencyWatcher = null;
var dependenciesFulfilled = null; // overridden to take different actions when all run dependencies are fulfilled
function addRunDependency(id) {
  runDependencies++;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
}
Module['addRunDependency'] = addRunDependency;
function removeRunDependency(id) {
  runDependencies--;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
  if (runDependencies == 0) {
    if (runDependencyWatcher !== null) {
      clearInterval(runDependencyWatcher);
      runDependencyWatcher = null;
    }
    if (dependenciesFulfilled) {
      var callback = dependenciesFulfilled;
      dependenciesFulfilled = null;
      callback(); // can add another dependenciesFulfilled
    }
  }
}
Module['removeRunDependency'] = removeRunDependency;
Module["preloadedImages"] = {}; // maps url to image data
Module["preloadedAudios"] = {}; // maps url to audio data
var memoryInitializer = null;
// === Body ===
STATIC_BASE = 8;
STATICTOP = STATIC_BASE + 7624;
/* global initializers */ __ATINIT__.push({ func: function() { runPostSets() } });
/* memory initializer */ allocate([22,6,117,117,36,36,36,36,83,83,83,83,83,83,83,83,98,98,98,98,98,98,98,98,98,98,98,98,98,98,98,98,66,66,66,66,66,66,66,66,66,66,66,66,66,66,66,66,50,50,50,50,50,50,50,50,50,50,50,50,50,50,50,50,134,6,37,37,20,20,20,20,115,115,115,115,115,115,115,115,99,99,99,99,99,99,99,99,51,51,51,51,51,51,51,51,82,82,82,82,82,82,82,82,82,82,82,82,82,82,82,82,66,66,66,66,66,66,66,66,66,66,66,66,66,66,66,66,150,6,21,21,116,116,116,116,131,131,131,131,131,131,131,131,99,99,99,99,99,99,99,99,67,67,67,67,67,67,67,67,51,51,51,51,51,51,51,51,35,35,35,35,35,35,35,35,82,82,82,82,82,82,82,82,82,82,82,82,82,82,82,82,166,6,21,21,132,132,132,132,147,147,147,147,147,147,147,147,115,115,115,115,115,115,115,115,99,99,99,99,99,99,99,99,83,83,83,83,83,83,83,83,67,67,67,67,67,67,67,67,51,51,51,51,51,51,51,51,35,35,35,35,35,35,35,35,181,149,164,164,132,132,36,36,20,20,4,4,115,115,115,115,99,99,99,99,83,83,83,83,67,67,67,67,51,51,51,51,197,181,165,5,148,148,116,116,52,52,36,36,131,131,131,131,99,99,99,99,83,83,83,83,67,67,67,67,19,19,19,19,214,182,197,197,165,165,149,149,132,132,132,132,84,84,84,84,68,68,68,68,4,4,4,4,115,115,115,115,115,115,115,115,99,99,99,99,99,99,99,99,51,51,51,51,51,51,51,51,35,35,35,35,35,35,35,35,19,19,19,19,19,19,19,19,230,214,198,182,165,165,149,149,132,132,132,132,116,116,116,116,100,100,100,100,84,84,84,84,67,67,67,67,67,67,67,67,51,51,51,51,51,51,51,51,35,35,35,35,35,35,35,35,19,19,19,19,19,19,19,19,3,3,3,3,3,3,3,3,0,249,233,217,200,200,184,184,167,167,167,167,151,151,151,151,134,134,134,134,134,134,134,134,118,118,118,118,118,118,118,118,0,0,101,85,68,68,52,52,35,35,35,35,19,19,19,19,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,18,33,33,0,0,0,0,3,19,50,50,33,33,33,33,4,20,67,67,34,34,34,34,49,49,49,49,49,49,49,49,4,20,35,35,51,51,83,83,65,65,65,65,65,65,65,65,21,5,100,100,35,35,35,35,82,82,82,82,82,82,82,82,66,66,66,66,66,66,66,66,50,50,50,50,50,50,50,50,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,1,0,0,1,0,0,1,0,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,1,1,2,1,1,2,1,1,2,1,2,3,1,2,3,2,2,3,2,2,4,2,3,4,2,3,4,3,3,5,3,4,6,3,4,6,4,5,7,4,5,8,4,6,9,5,7,10,6,8,11,6,8,13,7,10,14,8,11,16,9,12,18,10,13,20,11,15,23,13,17,25,0,0,0,0,1,0,0,0,2,0,0,0,4,0,0,0,8,0,0,0,16,0,0,0,32,0,0,0,64,0,0,0,128,0,0,0,19,35,67,51,99,83,2,2,83,67,51,35,18,18,2,2,67,51,34,34,18,18,2,2,50,34,18,2,0,0,0,0,34,18,1,1,0,0,0,0,17,1,0,0,0,0,0,0,0,1,2,3,4,5,0,1,2,3,4,5,0,1,2,3,4,5,0,1,2,3,4,5,0,1,2,3,4,5,0,1,2,3,4,5,0,1,2,3,4,5,0,1,2,3,4,5,0,1,2,3,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,2,2,2,2,2,2,3,3,3,3,3,3,4,4,4,4,4,4,5,5,5,5,5,5,6,6,6,6,6,6,7,7,7,7,7,7,8,8,8,8,0,0,0,0,0,0,0,0,1,0,0,0,2,0,0,0,3,0,0,0,4,0,0,0,5,0,0,0,6,0,0,0,7,0,0,0,8,0,0,0,9,0,0,0,10,0,0,0,11,0,0,0,12,0,0,0,13,0,0,0,14,0,0,0,15,0,0,0,10,0,0,0,13,0,0,0,16,0,0,0,11,0,0,0,14,0,0,0,18,0,0,0,13,0,0,0,16,0,0,0,20,0,0,0,14,0,0,0,18,0,0,0,23,0,0,0,16,0,0,0,20,0,0,0,25,0,0,0,18,0,0,0,23,0,0,0,29,0,0,0,0,0,0,0,1,0,0,0,2,0,0,0,3,0,0,0,4,0,0,0,5,0,0,0,6,0,0,0,7,0,0,0,8,0,0,0,9,0,0,0,10,0,0,0,11,0,0,0,12,0,0,0,13,0,0,0,14,0,0,0,15,0,0,0,16,0,0,0,17,0,0,0,18,0,0,0,19,0,0,0,20,0,0,0,21,0,0,0,22,0,0,0,23,0,0,0,24,0,0,0,25,0,0,0,26,0,0,0,27,0,0,0,28,0,0,0,29,0,0,0,29,0,0,0,30,0,0,0,31,0,0,0,32,0,0,0,32,0,0,0,33,0,0,0,34,0,0,0,34,0,0,0,35,0,0,0,35,0,0,0,36,0,0,0,36,0,0,0,37,0,0,0,37,0,0,0,37,0,0,0,38,0,0,0,38,0,0,0,38,0,0,0,39,0,0,0,39,0,0,0,39,0,0,0,39,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91,92,93,94,95,96,97,98,99,100,101,102,103,104,105,106,107,108,109,110,111,112,113,114,115,116,117,118,119,120,121,122,123,124,125,126,127,128,129,130,131,132,133,134,135,136,137,138,139,140,141,142,143,144,145,146,147,148,149,150,151,152,153,154,155,156,157,158,159,160,161,162,163,164,165,166,167,168,169,170,171,172,173,174,175,176,177,178,179,180,181,182,183,184,185,186,187,188,189,190,191,192,193,194,195,196,197,198,199,200,201,202,203,204,205,206,207,208,209,210,211,212,213,214,215,216,217,218,219,220,221,222,223,224,225,226,227,228,229,230,231,232,233,234,235,236,237,238,239,240,241,242,243,244,245,246,247,248,249,250,251,252,253,254,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,0,0,0,0,0,0,0,0,4,0,0,0,4,0,0,0,0,0,0,0,0,0,0,0,4,0,0,0,4,0,0,0,8,0,0,0,8,0,0,0,12,0,0,0,12,0,0,0,8,0,0,0,8,0,0,0,12,0,0,0,12,0,0,0,0,0,0,0,4,0,0,0,0,0,0,0,4,0,0,0,8,0,0,0,12,0,0,0,8,0,0,0,12,0,0,0,0,0,0,0,4,0,0,0,0,0,0,0,4,0,0,0,8,0,0,0,12,0,0,0,8,0,0,0,12,0,0,0,0,0,0,0,1,0,0,0,4,0,0,0,5,0,0,0,2,0,0,0,3,0,0,0,6,0,0,0,7,0,0,0,8,0,0,0,9,0,0,0,12,0,0,0,13,0,0,0,10,0,0,0,11,0,0,0,14,0,0,0,15,0,0,0,103,32,103,32,72,32,40,32,71,24,71,24,39,24,39,24,6,32,6,32,6,32,6,32,6,24,6,24,6,24,6,24,6,16,6,16,6,16,6,16,102,24,102,24,102,24,102,24,38,16,38,16,38,16,38,16,6,8,6,8,6,8,6,8,0,0,67,16,2,0,2,0,33,8,33,8,33,8,33,8,6,8,38,8,0,0,6,0,6,16,38,16,70,16,0,0,6,24,38,24,70,24,102,24,6,32,38,32,70,32,102,32,6,40,38,40,70,40,102,40,6,48,38,48,70,48,102,48,6,56,38,56,70,56,102,56,6,64,38,64,70,64,102,64,6,72,38,72,70,72,102,72,6,80,38,80,70,80,102,80,6,88,38,88,70,88,102,88,6,96,38,96,70,96,102,96,6,104,38,104,70,104,102,104,6,112,38,112,70,112,102,112,6,120,38,120,70,120,102,120,6,128,38,128,70,128,102,128,0,0,10,128,106,128,74,128,42,128,10,120,106,120,74,120,42,120,10,112,106,112,74,112,42,112,10,104,41,104,41,104,9,96,9,96,73,104,73,104,41,96,41,96,9,88,9,88,105,104,105,104,73,96,73,96,41,88,41,88,9,80,9,80,104,96,104,96,104,96,104,96,72,88,72,88,72,88,72,88,40,80,40,80,40,80,40,80,8,72,8,72,8,72,8,72,104,88,104,88,104,88,104,88,72,80,72,80,72,80,72,80,40,72,40,72,40,72,40,72,8,64,8,64,8,64,8,64,7,56,7,56,7,56,7,56,7,56,7,56,7,56,7,56,7,48,7,48,7,48,7,48,7,48,7,48,7,48,7,48,71,72,71,72,71,72,71,72,71,72,71,72,71,72,71,72,7,40,7,40,7,40,7,40,7,40,7,40,7,40,7,40,103,80,103,80,103,80,103,80,103,80,103,80,103,80,103,80,71,64,71,64,71,64,71,64,71,64,71,64,71,64,71,64,39,64,39,64,39,64,39,64,39,64,39,64,39,64,39,64,7,32,7,32,7,32,7,32,7,32,7,32,7,32,7,32,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6,24,70,56,38,56,6,16,102,72,70,48,38,48,6,8,37,40,37,40,69,40,69,40,37,32,37,32,69,32,69,32,37,24,37,24,101,64,101,64,69,24,69,24,37,16,37,16,100,56,100,56,100,56,100,56,100,48,100,48,100,48,100,48,100,40,100,40,100,40,100,40,100,32,100,32,100,32,100,32,100,24,100,24,100,24,100,24,68,16,68,16,68,16,68,16,36,8,36,8,36,8,36,8,4,0,4,0,4,0,4,0,0,0,0,0,109,120,109,120,110,128,78,128,46,128,14,128,46,120,14,120,78,120,46,112,77,112,77,112,13,112,13,112,109,112,109,112,77,104,77,104,45,104,45,104,13,104,13,104,109,104,109,104,77,96,77,96,45,96,45,96,13,96,13,96,12,88,12,88,12,88,12,88,76,88,76,88,76,88,76,88,44,88,44,88,44,88,44,88,12,80,12,80,12,80,12,80,108,96,108,96,108,96,108,96,76,80,76,80,76,80,76,80,44,80,44,80,44,80,44,80,12,72,12,72,12,72,12,72,107,88,107,88,107,88,107,88,107,88,107,88,107,88,107,88,75,72,75,72,75,72,75,72,75,72,75,72,75,72,75,72,43,72,43,72,43,72,43,72,43,72,43,72,43,72,43,72,11,64,11,64,11,64,11,64,11,64,11,64,11,64,11,64,107,80,107,80,107,80,107,80,107,80,107,80,107,80,107,80,75,64,75,64,75,64,75,64,75,64,75,64,75,64,75,64,43,64,43,64,43,64,43,64,43,64,43,64,43,64,43,64,11,56,11,56,11,56,11,56,11,56,11,56,11,56,11,56,0,0,0,0,0,0,0,0,105,72,73,56,41,56,9,48,8,40,8,40,72,48,72,48,40,48,40,48,8,32,8,32,103,64,103,64,103,64,103,64,71,40,71,40,71,40,71,40,39,40,39,40,39,40,39,40,7,24,7,24,7,24,7,24,0,0,0,0,0,0,0,0,102,56,70,32,38,32,6,16,102,48,70,24,38,24,6,8,101,40,101,40,37,16,37,16,100,32,100,32,100,32,100,32,100,24,100,24,100,24,100,24,67,16,67,16,67,16,67,16,67,16,67,16,67,16,67,16,0,0,0,0,47,104,47,104,16,128,80,128,48,128,16,120,112,128,80,120,48,120,16,112,112,120,80,112,48,112,16,104,111,112,111,112,79,104,79,104,47,96,47,96,15,96,15,96,111,104,111,104,79,96,79,96,47,88,47,88,15,88,15,88,110,96,78,88,46,80,14,80,110,88,78,80,46,72,14,72,13,64,13,64,77,72,77,72,45,64,45,64,13,56,13,56,109,80,109,80,77,64,77,64,45,56,45,56,13,48,13,48,107,72,107,72,107,72,107,72,107,72,107,72,107,72,107,72,75,56,75,56,75,56,75,56,75,56,75,56,75,56,75,56,43,48,43,48,43,48,43,48,43,48,43,48,43,48,43,48,11,40,11,40,11,40,11,40,11,40,11,40,11,40,11,40,0,0,0,0,0,0,0,0,106,64,74,48,42,40,10,32,105,56,105,56,73,40,73,40,41,32,41,32,9,24,9,24,104,48,104,48,104,48,104,48,72,32,72,32,72,32,72,32,40,24,40,24,40,24,40,24,8,16,8,16,8,16,8,16,103,40,103,40,103,40,103,40,103,40,103,40,103,40,103,40,71,24,71,24,71,24,71,24,71,24,71,24,71,24,71,24,0,0,0,0,0,0,102,32,38,16,6,8,101,24,101,24,67,16,67,16,67,16,67,16,67,16,67,16,67,16,67,16,34,8,34,8,34,8,34,8,34,8,34,8,34,8,34,8,34,8,34,8,34,8,34,8,34,8,34,8,34,8,34,8,47,31,15,0,23,27,29,30,7,11,13,14,39,43,45,46,16,3,5,10,12,19,21,26,28,35,37,42,44,1,2,4,8,17,18,20,24,6,9,22,25,32,33,34,36,40,38,41,0,16,1,2,4,8,32,3,5,10,12,15,47,7,11,13,14,6,9,31,35,37,42,44,33,34,36,40,39,43,45,46,17,18,20,24,19,21,26,28,23,27,29,30,22,25,38,41,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,2,2,3,3,3,3,4,4,4,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13,14,14,15,15,16,16,17,17,18,18,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4,4,5,6,7,8,9,10,12,13,15,17,20,22,25,28,32,36,40,45,50,56,63,71,80,90,101,113,127,144,162,182,203,226,255,255,0,0,0,0,3,0,0,0,15,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,3,0,0,0,15,0,0,0,0,0,0,0,5,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,3,0,0,0,15,0,0,0,1,0,0,0,10,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,3,0,0,0,15,0,0,0,1,0,0,0,10,0,0,0,0,0,0,0,5,0,0,0,4,0,0,0,0,0,0,0,1,0,0,0,11,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,1,0,0,0,11,0,0,0,4,0,0,0,1,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,1,0,0,0,11,0,0,0,1,0,0,0,14,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,1,0,0,0,11,0,0,0,1,0,0,0,14,0,0,0,4,0,0,0,1,0,0,0,4,0,0,0,4,0,0,0,0,0,0,0,7,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,0,0,0,0,7,0,0,0,0,0,0,0,13,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,0,0,0,0,7,0,0,0,4,0,0,0,2,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,0,0,0,0,7,0,0,0,4,0,0,0,2,0,0,0,0,0,0,0,13,0,0,0,4,0,0,0,8,0,0,0,4,0,0,0,3,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,4,0,0,0,3,0,0,0,4,0,0,0,9,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,4,0,0,0,3,0,0,0,4,0,0,0,6,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,4,0,0,0,3,0,0,0,4,0,0,0,6,0,0,0,4,0,0,0,9,0,0,0,4,0,0,0,12,0,0,0,3,0,0,0,15,0,0,0,1,0,0,0,10,0,0,0,0,0,0,0,5,0,0,0,4,0,0,0,0,0,0,0,1,0,0,0,11,0,0,0,1,0,0,0,14,0,0,0,4,0,0,0,1,0,0,0,4,0,0,0,4,0,0,0,0,0,0,0,7,0,0,0,4,0,0,0,2,0,0,0,0,0,0,0,13,0,0,0,4,0,0,0,8,0,0,0,4,0,0,0,3,0,0,0,4,0,0,0,6,0,0,0,4,0,0,0,9,0,0,0,4,0,0,0,12,0,0,0,3,0,0,0,19,0,0,0,1,0,0,0,18,0,0,0,0,0,0,0,17,0,0,0,4,0,0,0,16,0,0,0,3,0,0,0,23,0,0,0,1,0,0,0,22,0,0,0,0,0,0,0,21,0,0,0,4,0,0,0,20,0,0,0,1,0,0,0,14,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,1,0,0,0,14,0,0,0,255,0,0,0,4,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,1,0,0,0,11,0,0,0,1,0,0,0,14,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,1,0,0,0,11,0,0,0,1,0,0,0,14,0,0,0,4,0,0,0,1,0,0,0,255,0,0,0,4,0,0,0,2,0,0,0,10,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,2,0,0,0,10,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,1,0,0,0,15,0,0,0,2,0,0,0,10,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,1,0,0,0,15,0,0,0,2,0,0,0,10,0,0,0,4,0,0,0,5,0,0,0,255,0,0,0,0,0,0,0,4,0,0,0,6,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,4,0,0,0,6,0,0,0,255,0,0,0,12,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,4,0,0,0,3,0,0,0,4,0,0,0,6,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,4,0,0,0,3,0,0,0,4,0,0,0,6,0,0,0,4,0,0,0,9,0,0,0,255,0,0,0,12,0,0,0,255,0,0,0,2,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,2,0,0,0,255,0,0,0,8,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,4,0,0,0,7,0,0,0,255,0,0,0,2,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,4,0,0,0,7,0,0,0,255,0,0,0,2,0,0,0,4,0,0,0,13,0,0,0,255,0,0,0,8,0,0,0,1,0,0,0,11,0,0,0,1,0,0,0,14,0,0,0,4,0,0,0,1,0,0,0,255,0,0,0,4,0,0,0,1,0,0,0,15,0,0,0,2,0,0,0,10,0,0,0,4,0,0,0,5,0,0,0,255,0,0,0,0,0,0,0,4,0,0,0,3,0,0,0,4,0,0,0,6,0,0,0,4,0,0,0,9,0,0,0,255,0,0,0,12,0,0,0,4,0,0,0,7,0,0,0,255,0,0,0,2,0,0,0,4,0,0,0,13,0,0,0,255,0,0,0,8,0,0,0,1,0,0,0,19,0,0,0,2,0,0,0,18,0,0,0,4,0,0,0,17,0,0,0,255,0,0,0,16,0,0,0,1,0,0,0,23,0,0,0,2,0,0,0,22,0,0,0,4,0,0,0,21,0,0,0,255,0,0,0,20,0,0,0,1,0,0,0,10,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,1,0,0,0,10,0,0,0,4,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,1,0,0,0,10,0,0,0,1,0,0,0,11,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,1,0,0,0,10,0,0,0,1,0,0,0,11,0,0,0,4,0,0,0,0,0,0,0,4,0,0,0,1,0,0,0,1,0,0,0,14,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,1,0,0,0,14,0,0,0,4,0,0,0,4,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,1,0,0,0,14,0,0,0,1,0,0,0,15,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,1,0,0,0,14,0,0,0,1,0,0,0,15,0,0,0,4,0,0,0,4,0,0,0,4,0,0,0,5,0,0,0,4,0,0,0,2,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,4,0,0,0,2,0,0,0,4,0,0,0,8,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,4,0,0,0,2,0,0,0,4,0,0,0,3,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,4,0,0,0,2,0,0,0,4,0,0,0,3,0,0,0,4,0,0,0,8,0,0,0,4,0,0,0,9,0,0,0,4,0,0,0,6,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,4,0,0,0,6,0,0,0,4,0,0,0,12,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,4,0,0,0,6,0,0,0,4,0,0,0,7,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,4,0,0,0,6,0,0,0,4,0,0,0,7,0,0,0,4,0,0,0,12,0,0,0,4,0,0,0,13,0,0,0,1,0,0,0,10,0,0,0,1,0,0,0,11,0,0,0,4,0,0,0,0,0,0,0,4,0,0,0,1,0,0,0,1,0,0,0,14,0,0,0,1,0,0,0,15,0,0,0,4,0,0,0,4,0,0,0,4,0,0,0,5,0,0,0,4,0,0,0,2,0,0,0,4,0,0,0,3,0,0,0,4,0,0,0,8,0,0,0,4,0,0,0,9,0,0,0,4,0,0,0,6,0,0,0,4,0,0,0,7,0,0,0,4,0,0,0,12,0,0,0,4,0,0,0,13,0,0,0,1,0,0,0,18,0,0,0,1,0,0,0,19,0,0,0,4,0,0,0,16,0,0,0,4,0,0,0,17,0,0,0,1,0,0,0,22,0,0,0,1,0,0,0,23,0,0,0,4,0,0,0,20,0,0,0,4,0,0,0,21,0,0,0,0,0,0,0,5,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,0,0,0,0,5,0,0,0,0,0,0,0,7,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,0,0,0,0,5,0,0,0,4,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,0,0,0,0,5,0,0,0,4,0,0,0,0,0,0,0,0,0,0,0,7,0,0,0,4,0,0,0,2,0,0,0,4,0,0,0,1,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,4,0,0,0,1,0,0,0,4,0,0,0,3,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,4,0,0,0,1,0,0,0,4,0,0,0,4,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,4,0,0,0,1,0,0,0,4,0,0,0,4,0,0,0,4,0,0,0,3,0,0,0,4,0,0,0,6,0,0,0,0,0,0,0,13,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,0,0,0,0,13,0,0,0,0,0,0,0,15,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,0,0,0,0,13,0,0,0,4,0,0,0,8,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,0,0,0,0,13,0,0,0,4,0,0,0,8,0,0,0,0,0,0,0,15,0,0,0,4,0,0,0,10,0,0,0,4,0,0,0,9,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,4,0,0,0,9,0,0,0,4,0,0,0,11,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,4,0,0,0,9,0,0,0,4,0,0,0,12,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,4,0,0,0,9,0,0,0,4,0,0,0,12,0,0,0,4,0,0,0,11,0,0,0,4,0,0,0,14,0,0,0,0,0,0,0,5,0,0,0,4,0,0,0,0,0,0,0,0,0,0,0,7,0,0,0,4,0,0,0,2,0,0,0,4,0,0,0,1,0,0,0,4,0,0,0,4,0,0,0,4,0,0,0,3,0,0,0,4,0,0,0,6,0,0,0,0,0,0,0,13,0,0,0,4,0,0,0,8,0,0,0,0,0,0,0,15,0,0,0,4,0,0,0,10,0,0,0,4,0,0,0,9,0,0,0,4,0,0,0,12,0,0,0,4,0,0,0,11,0,0,0,4,0,0,0,14,0,0,0,0,0,0,0,17,0,0,0,4,0,0,0,16,0,0,0,0,0,0,0,19,0,0,0,4,0,0,0,18,0,0,0,0,0,0,0,21,0,0,0,4,0,0,0,20,0,0,0,0,0,0,0,23,0,0,0,4,0,0,0,22,0,0,0,1,0,0,0,1,0,0,0,2,0,0,0,2,0,0,0,3,0,0,0,3,0,0,0,3,0,0,0,3,0,0,0], "i8", ALLOC_NONE, Runtime.GLOBAL_BASE)
var tempDoublePtr = Runtime.alignMemory(allocate(12, "i8", ALLOC_STATIC), 8);
assert(tempDoublePtr % 8 == 0);
function copyTempFloat(ptr) { // functions, because inlining this code increases code size too much
  HEAP8[tempDoublePtr] = HEAP8[ptr];
  HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];
  HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];
  HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];
}
function copyTempDouble(ptr) {
  HEAP8[tempDoublePtr] = HEAP8[ptr];
  HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];
  HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];
  HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];
  HEAP8[tempDoublePtr+4] = HEAP8[ptr+4];
  HEAP8[tempDoublePtr+5] = HEAP8[ptr+5];
  HEAP8[tempDoublePtr+6] = HEAP8[ptr+6];
  HEAP8[tempDoublePtr+7] = HEAP8[ptr+7];
}
  Module["_memset"] = _memset;var _llvm_memset_p0i8_i32=_memset;
  Module["_memcpy"] = _memcpy;var _llvm_memcpy_p0i8_p0i8_i32=_memcpy;
  var _llvm_memset_p0i8_i64=_memset;
  function _llvm_lifetime_start() {}
  function _llvm_lifetime_end() {}
  function _abort() {
      Module['abort']();
    }
  var ___errno_state=0;function ___setErrNo(value) {
      // For convenient setting and returning of errno.
      HEAP32[((___errno_state)>>2)]=value
      return value;
    }function ___errno_location() {
      return ___errno_state;
    }
  function _sbrk(bytes) {
      // Implement a Linux-like 'memory area' for our 'process'.
      // Changes the size of the memory area by |bytes|; returns the
      // address of the previous top ('break') of the memory area
      // We control the "dynamic" memory - DYNAMIC_BASE to DYNAMICTOP
      var self = _sbrk;
      if (!self.called) {
        DYNAMICTOP = alignMemoryPage(DYNAMICTOP); // make sure we start out aligned
        self.called = true;
        assert(Runtime.dynamicAlloc);
        self.alloc = Runtime.dynamicAlloc;
        Runtime.dynamicAlloc = function() { abort('cannot dynamically allocate, sbrk now has control') };
      }
      var ret = DYNAMICTOP;
      if (bytes != 0) self.alloc(bytes);
      return ret;  // Previous break location.
    }
  var ERRNO_CODES={EPERM:1,ENOENT:2,ESRCH:3,EINTR:4,EIO:5,ENXIO:6,E2BIG:7,ENOEXEC:8,EBADF:9,ECHILD:10,EAGAIN:11,EWOULDBLOCK:11,ENOMEM:12,EACCES:13,EFAULT:14,ENOTBLK:15,EBUSY:16,EEXIST:17,EXDEV:18,ENODEV:19,ENOTDIR:20,EISDIR:21,EINVAL:22,ENFILE:23,EMFILE:24,ENOTTY:25,ETXTBSY:26,EFBIG:27,ENOSPC:28,ESPIPE:29,EROFS:30,EMLINK:31,EPIPE:32,EDOM:33,ERANGE:34,ENOMSG:42,EIDRM:43,ECHRNG:44,EL2NSYNC:45,EL3HLT:46,EL3RST:47,ELNRNG:48,EUNATCH:49,ENOCSI:50,EL2HLT:51,EDEADLK:35,ENOLCK:37,EBADE:52,EBADR:53,EXFULL:54,ENOANO:55,EBADRQC:56,EBADSLT:57,EDEADLOCK:35,EBFONT:59,ENOSTR:60,ENODATA:61,ETIME:62,ENOSR:63,ENONET:64,ENOPKG:65,EREMOTE:66,ENOLINK:67,EADV:68,ESRMNT:69,ECOMM:70,EPROTO:71,EMULTIHOP:72,EDOTDOT:73,EBADMSG:74,ENOTUNIQ:76,EBADFD:77,EREMCHG:78,ELIBACC:79,ELIBBAD:80,ELIBSCN:81,ELIBMAX:82,ELIBEXEC:83,ENOSYS:38,ENOTEMPTY:39,ENAMETOOLONG:36,ELOOP:40,EOPNOTSUPP:95,EPFNOSUPPORT:96,ECONNRESET:104,ENOBUFS:105,EAFNOSUPPORT:97,EPROTOTYPE:91,ENOTSOCK:88,ENOPROTOOPT:92,ESHUTDOWN:108,ECONNREFUSED:111,EADDRINUSE:98,ECONNABORTED:103,ENETUNREACH:101,ENETDOWN:100,ETIMEDOUT:110,EHOSTDOWN:112,EHOSTUNREACH:113,EINPROGRESS:115,EALREADY:114,EDESTADDRREQ:89,EMSGSIZE:90,EPROTONOSUPPORT:93,ESOCKTNOSUPPORT:94,EADDRNOTAVAIL:99,ENETRESET:102,EISCONN:106,ENOTCONN:107,ETOOMANYREFS:109,EUSERS:87,EDQUOT:122,ESTALE:116,ENOTSUP:95,ENOMEDIUM:123,EILSEQ:84,EOVERFLOW:75,ECANCELED:125,ENOTRECOVERABLE:131,EOWNERDEAD:130,ESTRPIPE:86};function _sysconf(name) {
      // long sysconf(int name);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/sysconf.html
      switch(name) {
        case 30: return PAGE_SIZE;
        case 132:
        case 133:
        case 12:
        case 137:
        case 138:
        case 15:
        case 235:
        case 16:
        case 17:
        case 18:
        case 19:
        case 20:
        case 149:
        case 13:
        case 10:
        case 236:
        case 153:
        case 9:
        case 21:
        case 22:
        case 159:
        case 154:
        case 14:
        case 77:
        case 78:
        case 139:
        case 80:
        case 81:
        case 79:
        case 82:
        case 68:
        case 67:
        case 164:
        case 11:
        case 29:
        case 47:
        case 48:
        case 95:
        case 52:
        case 51:
        case 46:
          return 200809;
        case 27:
        case 246:
        case 127:
        case 128:
        case 23:
        case 24:
        case 160:
        case 161:
        case 181:
        case 182:
        case 242:
        case 183:
        case 184:
        case 243:
        case 244:
        case 245:
        case 165:
        case 178:
        case 179:
        case 49:
        case 50:
        case 168:
        case 169:
        case 175:
        case 170:
        case 171:
        case 172:
        case 97:
        case 76:
        case 32:
        case 173:
        case 35:
          return -1;
        case 176:
        case 177:
        case 7:
        case 155:
        case 8:
        case 157:
        case 125:
        case 126:
        case 92:
        case 93:
        case 129:
        case 130:
        case 131:
        case 94:
        case 91:
          return 1;
        case 74:
        case 60:
        case 69:
        case 70:
        case 4:
          return 1024;
        case 31:
        case 42:
        case 72:
          return 32;
        case 87:
        case 26:
        case 33:
          return 2147483647;
        case 34:
        case 1:
          return 47839;
        case 38:
        case 36:
          return 99;
        case 43:
        case 37:
          return 2048;
        case 0: return 2097152;
        case 3: return 65536;
        case 28: return 32768;
        case 44: return 32767;
        case 75: return 16384;
        case 39: return 1000;
        case 89: return 700;
        case 71: return 256;
        case 40: return 255;
        case 2: return 100;
        case 180: return 64;
        case 25: return 20;
        case 5: return 16;
        case 6: return 6;
        case 73: return 4;
        case 84: return 1;
      }
      ___setErrNo(ERRNO_CODES.EINVAL);
      return -1;
    }
  function _time(ptr) {
      var ret = Math.floor(Date.now()/1000);
      if (ptr) {
        HEAP32[((ptr)>>2)]=ret
      }
      return ret;
    }
  Module["_strlen"] = _strlen;
  var ERRNO_MESSAGES={0:"Success",1:"Not super-user",2:"No such file or directory",3:"No such process",4:"Interrupted system call",5:"I/O error",6:"No such device or address",7:"Arg list too long",8:"Exec format error",9:"Bad file number",10:"No children",11:"No more processes",12:"Not enough core",13:"Permission denied",14:"Bad address",15:"Block device required",16:"Mount device busy",17:"File exists",18:"Cross-device link",19:"No such device",20:"Not a directory",21:"Is a directory",22:"Invalid argument",23:"Too many open files in system",24:"Too many open files",25:"Not a typewriter",26:"Text file busy",27:"File too large",28:"No space left on device",29:"Illegal seek",30:"Read only file system",31:"Too many links",32:"Broken pipe",33:"Math arg out of domain of func",34:"Math result not representable",35:"File locking deadlock error",36:"File or path name too long",37:"No record locks available",38:"Function not implemented",39:"Directory not empty",40:"Too many symbolic links",42:"No message of desired type",43:"Identifier removed",44:"Channel number out of range",45:"Level 2 not synchronized",46:"Level 3 halted",47:"Level 3 reset",48:"Link number out of range",49:"Protocol driver not attached",50:"No CSI structure available",51:"Level 2 halted",52:"Invalid exchange",53:"Invalid request descriptor",54:"Exchange full",55:"No anode",56:"Invalid request code",57:"Invalid slot",59:"Bad font file fmt",60:"Device not a stream",61:"No data (for no delay io)",62:"Timer expired",63:"Out of streams resources",64:"Machine is not on the network",65:"Package not installed",66:"The object is remote",67:"The link has been severed",68:"Advertise error",69:"Srmount error",70:"Communication error on send",71:"Protocol error",72:"Multihop attempted",73:"Cross mount point (not really error)",74:"Trying to read unreadable message",75:"Value too large for defined data type",76:"Given log. name not unique",77:"f.d. invalid for this operation",78:"Remote address changed",79:"Can   access a needed shared lib",80:"Accessing a corrupted shared lib",81:".lib section in a.out corrupted",82:"Attempting to link in too many libs",83:"Attempting to exec a shared library",84:"Illegal byte sequence",86:"Streams pipe error",87:"Too many users",88:"Socket operation on non-socket",89:"Destination address required",90:"Message too long",91:"Protocol wrong type for socket",92:"Protocol not available",93:"Unknown protocol",94:"Socket type not supported",95:"Not supported",96:"Protocol family not supported",97:"Address family not supported by protocol family",98:"Address already in use",99:"Address not available",100:"Network interface is not configured",101:"Network is unreachable",102:"Connection reset by network",103:"Connection aborted",104:"Connection reset by peer",105:"No buffer space available",106:"Socket is already connected",107:"Socket is not connected",108:"Can't send after socket shutdown",109:"Too many references",110:"Connection timed out",111:"Connection refused",112:"Host is down",113:"Host is unreachable",114:"Socket already connected",115:"Connection already in progress",116:"Stale file handle",122:"Quota exceeded",123:"No medium (in tape drive)",125:"Operation canceled",130:"Previous owner died",131:"State not recoverable"};
  var TTY={ttys:[],init:function () {
        // https://github.com/kripken/emscripten/pull/1555
        // if (ENVIRONMENT_IS_NODE) {
        //   // currently, FS.init does not distinguish if process.stdin is a file or TTY
        //   // device, it always assumes it's a TTY device. because of this, we're forcing
        //   // process.stdin to UTF8 encoding to at least make stdin reading compatible
        //   // with text files until FS.init can be refactored.
        //   process['stdin']['setEncoding']('utf8');
        // }
      },shutdown:function () {
        // https://github.com/kripken/emscripten/pull/1555
        // if (ENVIRONMENT_IS_NODE) {
        //   // inolen: any idea as to why node -e 'process.stdin.read()' wouldn't exit immediately (with process.stdin being a tty)?
        //   // isaacs: because now it's reading from the stream, you've expressed interest in it, so that read() kicks off a _read() which creates a ReadReq operation
        //   // inolen: I thought read() in that case was a synchronous operation that just grabbed some amount of buffered data if it exists?
        //   // isaacs: it is. but it also triggers a _read() call, which calls readStart() on the handle
        //   // isaacs: do process.stdin.pause() and i'd think it'd probably close the pending call
        //   process['stdin']['pause']();
        // }
      },register:function (dev, ops) {
        TTY.ttys[dev] = { input: [], output: [], ops: ops };
        FS.registerDevice(dev, TTY.stream_ops);
      },stream_ops:{open:function (stream) {
          var tty = TTY.ttys[stream.node.rdev];
          if (!tty) {
            throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
          }
          stream.tty = tty;
          stream.seekable = false;
        },close:function (stream) {
          // flush any pending line data
          if (stream.tty.output.length) {
            stream.tty.ops.put_char(stream.tty, 10);
          }
        },read:function (stream, buffer, offset, length, pos /* ignored */) {
          if (!stream.tty || !stream.tty.ops.get_char) {
            throw new FS.ErrnoError(ERRNO_CODES.ENXIO);
          }
          var bytesRead = 0;
          for (var i = 0; i < length; i++) {
            var result;
            try {
              result = stream.tty.ops.get_char(stream.tty);
            } catch (e) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
            if (result === undefined && bytesRead === 0) {
              throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
            }
            if (result === null || result === undefined) break;
            bytesRead++;
            buffer[offset+i] = result;
          }
          if (bytesRead) {
            stream.node.timestamp = Date.now();
          }
          return bytesRead;
        },write:function (stream, buffer, offset, length, pos) {
          if (!stream.tty || !stream.tty.ops.put_char) {
            throw new FS.ErrnoError(ERRNO_CODES.ENXIO);
          }
          for (var i = 0; i < length; i++) {
            try {
              stream.tty.ops.put_char(stream.tty, buffer[offset+i]);
            } catch (e) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
          }
          if (length) {
            stream.node.timestamp = Date.now();
          }
          return i;
        }},default_tty_ops:{get_char:function (tty) {
          if (!tty.input.length) {
            var result = null;
            if (ENVIRONMENT_IS_NODE) {
              result = process['stdin']['read']();
              if (!result) {
                if (process['stdin']['_readableState'] && process['stdin']['_readableState']['ended']) {
                  return null;  // EOF
                }
                return undefined;  // no data available
              }
            } else if (typeof window != 'undefined' &&
              typeof window.prompt == 'function') {
              // Browser.
              result = window.prompt('Input: ');  // returns null on cancel
              if (result !== null) {
                result += '\n';
              }
            } else if (typeof readline == 'function') {
              // Command line.
              result = readline();
              if (result !== null) {
                result += '\n';
              }
            }
            if (!result) {
              return null;
            }
            tty.input = intArrayFromString(result, true);
          }
          return tty.input.shift();
        },put_char:function (tty, val) {
          if (val === null || val === 10) {
            Module['print'](tty.output.join(''));
            tty.output = [];
          } else {
            tty.output.push(TTY.utf8.processCChar(val));
          }
        }},default_tty1_ops:{put_char:function (tty, val) {
          if (val === null || val === 10) {
            Module['printErr'](tty.output.join(''));
            tty.output = [];
          } else {
            tty.output.push(TTY.utf8.processCChar(val));
          }
        }}};
  var MEMFS={ops_table:null,CONTENT_OWNING:1,CONTENT_FLEXIBLE:2,CONTENT_FIXED:3,mount:function (mount) {
        return MEMFS.createNode(null, '/', 16384 | 0777, 0);
      },createNode:function (parent, name, mode, dev) {
        if (FS.isBlkdev(mode) || FS.isFIFO(mode)) {
          // no supported
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (!MEMFS.ops_table) {
          MEMFS.ops_table = {
            dir: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr,
                lookup: MEMFS.node_ops.lookup,
                mknod: MEMFS.node_ops.mknod,
                mknod: MEMFS.node_ops.mknod,
                rename: MEMFS.node_ops.rename,
                unlink: MEMFS.node_ops.unlink,
                rmdir: MEMFS.node_ops.rmdir,
                readdir: MEMFS.node_ops.readdir,
                symlink: MEMFS.node_ops.symlink
              },
              stream: {
                llseek: MEMFS.stream_ops.llseek
              }
            },
            file: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr
              },
              stream: {
                llseek: MEMFS.stream_ops.llseek,
                read: MEMFS.stream_ops.read,
                write: MEMFS.stream_ops.write,
                allocate: MEMFS.stream_ops.allocate,
                mmap: MEMFS.stream_ops.mmap
              }
            },
            link: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr,
                readlink: MEMFS.node_ops.readlink
              },
              stream: {}
            },
            chrdev: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr
              },
              stream: FS.chrdev_stream_ops
            },
          };
        }
        var node = FS.createNode(parent, name, mode, dev);
        if (FS.isDir(node.mode)) {
          node.node_ops = MEMFS.ops_table.dir.node;
          node.stream_ops = MEMFS.ops_table.dir.stream;
          node.contents = {};
        } else if (FS.isFile(node.mode)) {
          node.node_ops = MEMFS.ops_table.file.node;
          node.stream_ops = MEMFS.ops_table.file.stream;
          node.contents = [];
          node.contentMode = MEMFS.CONTENT_FLEXIBLE;
        } else if (FS.isLink(node.mode)) {
          node.node_ops = MEMFS.ops_table.link.node;
          node.stream_ops = MEMFS.ops_table.link.stream;
        } else if (FS.isChrdev(node.mode)) {
          node.node_ops = MEMFS.ops_table.chrdev.node;
          node.stream_ops = MEMFS.ops_table.chrdev.stream;
        }
        node.timestamp = Date.now();
        // add the new node to the parent
        if (parent) {
          parent.contents[name] = node;
        }
        return node;
      },ensureFlexible:function (node) {
        if (node.contentMode !== MEMFS.CONTENT_FLEXIBLE) {
          var contents = node.contents;
          node.contents = Array.prototype.slice.call(contents);
          node.contentMode = MEMFS.CONTENT_FLEXIBLE;
        }
      },node_ops:{getattr:function (node) {
          var attr = {};
          // device numbers reuse inode numbers.
          attr.dev = FS.isChrdev(node.mode) ? node.id : 1;
          attr.ino = node.id;
          attr.mode = node.mode;
          attr.nlink = 1;
          attr.uid = 0;
          attr.gid = 0;
          attr.rdev = node.rdev;
          if (FS.isDir(node.mode)) {
            attr.size = 4096;
          } else if (FS.isFile(node.mode)) {
            attr.size = node.contents.length;
          } else if (FS.isLink(node.mode)) {
            attr.size = node.link.length;
          } else {
            attr.size = 0;
          }
          attr.atime = new Date(node.timestamp);
          attr.mtime = new Date(node.timestamp);
          attr.ctime = new Date(node.timestamp);
          // NOTE: In our implementation, st_blocks = Math.ceil(st_size/st_blksize),
          //       but this is not required by the standard.
          attr.blksize = 4096;
          attr.blocks = Math.ceil(attr.size / attr.blksize);
          return attr;
        },setattr:function (node, attr) {
          if (attr.mode !== undefined) {
            node.mode = attr.mode;
          }
          if (attr.timestamp !== undefined) {
            node.timestamp = attr.timestamp;
          }
          if (attr.size !== undefined) {
            MEMFS.ensureFlexible(node);
            var contents = node.contents;
            if (attr.size < contents.length) contents.length = attr.size;
            else while (attr.size > contents.length) contents.push(0);
          }
        },lookup:function (parent, name) {
          throw FS.genericErrors[ERRNO_CODES.ENOENT];
        },mknod:function (parent, name, mode, dev) {
          return MEMFS.createNode(parent, name, mode, dev);
        },rename:function (old_node, new_dir, new_name) {
          // if we're overwriting a directory at new_name, make sure it's empty.
          if (FS.isDir(old_node.mode)) {
            var new_node;
            try {
              new_node = FS.lookupNode(new_dir, new_name);
            } catch (e) {
            }
            if (new_node) {
              for (var i in new_node.contents) {
                throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
              }
            }
          }
          // do the internal rewiring
          delete old_node.parent.contents[old_node.name];
          old_node.name = new_name;
          new_dir.contents[new_name] = old_node;
          old_node.parent = new_dir;
        },unlink:function (parent, name) {
          delete parent.contents[name];
        },rmdir:function (parent, name) {
          var node = FS.lookupNode(parent, name);
          for (var i in node.contents) {
            throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
          }
          delete parent.contents[name];
        },readdir:function (node) {
          var entries = ['.', '..']
          for (var key in node.contents) {
            if (!node.contents.hasOwnProperty(key)) {
              continue;
            }
            entries.push(key);
          }
          return entries;
        },symlink:function (parent, newname, oldpath) {
          var node = MEMFS.createNode(parent, newname, 0777 | 40960, 0);
          node.link = oldpath;
          return node;
        },readlink:function (node) {
          if (!FS.isLink(node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          return node.link;
        }},stream_ops:{read:function (stream, buffer, offset, length, position) {
          var contents = stream.node.contents;
          if (position >= contents.length)
            return 0;
          var size = Math.min(contents.length - position, length);
          assert(size >= 0);
          if (size > 8 && contents.subarray) { // non-trivial, and typed array
            buffer.set(contents.subarray(position, position + size), offset);
          } else
          {
            for (var i = 0; i < size; i++) {
              buffer[offset + i] = contents[position + i];
            }
          }
          return size;
        },write:function (stream, buffer, offset, length, position, canOwn) {
          var node = stream.node;
          node.timestamp = Date.now();
          var contents = node.contents;
          if (length && contents.length === 0 && position === 0 && buffer.subarray) {
            // just replace it with the new data
            if (canOwn && offset === 0) {
              node.contents = buffer; // this could be a subarray of Emscripten HEAP, or allocated from some other source.
              node.contentMode = (buffer.buffer === HEAP8.buffer) ? MEMFS.CONTENT_OWNING : MEMFS.CONTENT_FIXED;
            } else {
              node.contents = new Uint8Array(buffer.subarray(offset, offset+length));
              node.contentMode = MEMFS.CONTENT_FIXED;
            }
            return length;
          }
          MEMFS.ensureFlexible(node);
          var contents = node.contents;
          while (contents.length < position) contents.push(0);
          for (var i = 0; i < length; i++) {
            contents[position + i] = buffer[offset + i];
          }
          return length;
        },llseek:function (stream, offset, whence) {
          var position = offset;
          if (whence === 1) {  // SEEK_CUR.
            position += stream.position;
          } else if (whence === 2) {  // SEEK_END.
            if (FS.isFile(stream.node.mode)) {
              position += stream.node.contents.length;
            }
          }
          if (position < 0) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          stream.ungotten = [];
          stream.position = position;
          return position;
        },allocate:function (stream, offset, length) {
          MEMFS.ensureFlexible(stream.node);
          var contents = stream.node.contents;
          var limit = offset + length;
          while (limit > contents.length) contents.push(0);
        },mmap:function (stream, buffer, offset, length, position, prot, flags) {
          if (!FS.isFile(stream.node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
          }
          var ptr;
          var allocated;
          var contents = stream.node.contents;
          // Only make a new copy when MAP_PRIVATE is specified.
          if ( !(flags & 2) &&
                (contents.buffer === buffer || contents.buffer === buffer.buffer) ) {
            // We can't emulate MAP_SHARED when the file is not backed by the buffer
            // we're mapping to (e.g. the HEAP buffer).
            allocated = false;
            ptr = contents.byteOffset;
          } else {
            // Try to avoid unnecessary slices.
            if (position > 0 || position + length < contents.length) {
              if (contents.subarray) {
                contents = contents.subarray(position, position + length);
              } else {
                contents = Array.prototype.slice.call(contents, position, position + length);
              }
            }
            allocated = true;
            ptr = _malloc(length);
            if (!ptr) {
              throw new FS.ErrnoError(ERRNO_CODES.ENOMEM);
            }
            buffer.set(contents, ptr);
          }
          return { ptr: ptr, allocated: allocated };
        }}};
  var IDBFS={dbs:{},indexedDB:function () {
        return window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
      },DB_VERSION:20,DB_STORE_NAME:"FILE_DATA",mount:function (mount) {
        return MEMFS.mount.apply(null, arguments);
      },syncfs:function (mount, populate, callback) {
        IDBFS.getLocalSet(mount, function(err, local) {
          if (err) return callback(err);
          IDBFS.getRemoteSet(mount, function(err, remote) {
            if (err) return callback(err);
            var src = populate ? remote : local;
            var dst = populate ? local : remote;
            IDBFS.reconcile(src, dst, callback);
          });
        });
      },reconcile:function (src, dst, callback) {
        var total = 0;
        var create = {};
        for (var key in src.files) {
          if (!src.files.hasOwnProperty(key)) continue;
          var e = src.files[key];
          var e2 = dst.files[key];
          if (!e2 || e.timestamp > e2.timestamp) {
            create[key] = e;
            total++;
          }
        }
        var remove = {};
        for (var key in dst.files) {
          if (!dst.files.hasOwnProperty(key)) continue;
          var e = dst.files[key];
          var e2 = src.files[key];
          if (!e2) {
            remove[key] = e;
            total++;
          }
        }
        if (!total) {
          // early out
          return callback(null);
        }
        var completed = 0;
        function done(err) {
          if (err) return callback(err);
          if (++completed >= total) {
            return callback(null);
          }
        };
        // create a single transaction to handle and IDB reads / writes we'll need to do
        var db = src.type === 'remote' ? src.db : dst.db;
        var transaction = db.transaction([IDBFS.DB_STORE_NAME], 'readwrite');
        transaction.onerror = function transaction_onerror() { callback(this.error); };
        var store = transaction.objectStore(IDBFS.DB_STORE_NAME);
        for (var path in create) {
          if (!create.hasOwnProperty(path)) continue;
          var entry = create[path];
          if (dst.type === 'local') {
            // save file to local
            try {
              if (FS.isDir(entry.mode)) {
                FS.mkdir(path, entry.mode);
              } else if (FS.isFile(entry.mode)) {
                var stream = FS.open(path, 'w+', 0666);
                FS.write(stream, entry.contents, 0, entry.contents.length, 0, true /* canOwn */);
                FS.close(stream);
              }
              done(null);
            } catch (e) {
              return done(e);
            }
          } else {
            // save file to IDB
            var req = store.put(entry, path);
            req.onsuccess = function req_onsuccess() { done(null); };
            req.onerror = function req_onerror() { done(this.error); };
          }
        }
        for (var path in remove) {
          if (!remove.hasOwnProperty(path)) continue;
          var entry = remove[path];
          if (dst.type === 'local') {
            // delete file from local
            try {
              if (FS.isDir(entry.mode)) {
                // TODO recursive delete?
                FS.rmdir(path);
              } else if (FS.isFile(entry.mode)) {
                FS.unlink(path);
              }
              done(null);
            } catch (e) {
              return done(e);
            }
          } else {
            // delete file from IDB
            var req = store.delete(path);
            req.onsuccess = function req_onsuccess() { done(null); };
            req.onerror = function req_onerror() { done(this.error); };
          }
        }
      },getLocalSet:function (mount, callback) {
        var files = {};
        function isRealDir(p) {
          return p !== '.' && p !== '..';
        };
        function toAbsolute(root) {
          return function(p) {
            return PATH.join2(root, p);
          }
        };
        var check = FS.readdir(mount.mountpoint)
          .filter(isRealDir)
          .map(toAbsolute(mount.mountpoint));
        while (check.length) {
          var path = check.pop();
          var stat, node;
          try {
            var lookup = FS.lookupPath(path);
            node = lookup.node;
            stat = FS.stat(path);
          } catch (e) {
            return callback(e);
          }
          if (FS.isDir(stat.mode)) {
            check.push.apply(check, FS.readdir(path)
              .filter(isRealDir)
              .map(toAbsolute(path)));
            files[path] = { mode: stat.mode, timestamp: stat.mtime };
          } else if (FS.isFile(stat.mode)) {
            files[path] = { contents: node.contents, mode: stat.mode, timestamp: stat.mtime };
          } else {
            return callback(new Error('node type not supported'));
          }
        }
        return callback(null, { type: 'local', files: files });
      },getDB:function (name, callback) {
        // look it up in the cache
        var db = IDBFS.dbs[name];
        if (db) {
          return callback(null, db);
        }
        var req;
        try {
          req = IDBFS.indexedDB().open(name, IDBFS.DB_VERSION);
        } catch (e) {
          return onerror(e);
        }
        req.onupgradeneeded = function req_onupgradeneeded() {
          db = req.result;
          db.createObjectStore(IDBFS.DB_STORE_NAME);
        };
        req.onsuccess = function req_onsuccess() {
          db = req.result;
          // add to the cache
          IDBFS.dbs[name] = db;
          callback(null, db);
        };
        req.onerror = function req_onerror() {
          callback(this.error);
        };
      },getRemoteSet:function (mount, callback) {
        var files = {};
        IDBFS.getDB(mount.mountpoint, function(err, db) {
          if (err) return callback(err);
          var transaction = db.transaction([IDBFS.DB_STORE_NAME], 'readonly');
          transaction.onerror = function transaction_onerror() { callback(this.error); };
          var store = transaction.objectStore(IDBFS.DB_STORE_NAME);
          store.openCursor().onsuccess = function store_openCursor_onsuccess(event) {
            var cursor = event.target.result;
            if (!cursor) {
              return callback(null, { type: 'remote', db: db, files: files });
            }
            files[cursor.key] = cursor.value;
            cursor.continue();
          };
        });
      }};
  var NODEFS={isWindows:false,staticInit:function () {
        NODEFS.isWindows = !!process.platform.match(/^win/);
      },mount:function (mount) {
        assert(ENVIRONMENT_IS_NODE);
        return NODEFS.createNode(null, '/', NODEFS.getMode(mount.opts.root), 0);
      },createNode:function (parent, name, mode, dev) {
        if (!FS.isDir(mode) && !FS.isFile(mode) && !FS.isLink(mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var node = FS.createNode(parent, name, mode);
        node.node_ops = NODEFS.node_ops;
        node.stream_ops = NODEFS.stream_ops;
        return node;
      },getMode:function (path) {
        var stat;
        try {
          stat = fs.lstatSync(path);
          if (NODEFS.isWindows) {
            // On Windows, directories return permission bits 'rw-rw-rw-', even though they have 'rwxrwxrwx', so 
            // propagate write bits to execute bits.
            stat.mode = stat.mode | ((stat.mode & 146) >> 1);
          }
        } catch (e) {
          if (!e.code) throw e;
          throw new FS.ErrnoError(ERRNO_CODES[e.code]);
        }
        return stat.mode;
      },realPath:function (node) {
        var parts = [];
        while (node.parent !== node) {
          parts.push(node.name);
          node = node.parent;
        }
        parts.push(node.mount.opts.root);
        parts.reverse();
        return PATH.join.apply(null, parts);
      },flagsToPermissionStringMap:{0:"r",1:"r+",2:"r+",64:"r",65:"r+",66:"r+",129:"rx+",193:"rx+",514:"w+",577:"w",578:"w+",705:"wx",706:"wx+",1024:"a",1025:"a",1026:"a+",1089:"a",1090:"a+",1153:"ax",1154:"ax+",1217:"ax",1218:"ax+",4096:"rs",4098:"rs+"},flagsToPermissionString:function (flags) {
        if (flags in NODEFS.flagsToPermissionStringMap) {
          return NODEFS.flagsToPermissionStringMap[flags];
        } else {
          return flags;
        }
      },node_ops:{getattr:function (node) {
          var path = NODEFS.realPath(node);
          var stat;
          try {
            stat = fs.lstatSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          // node.js v0.10.20 doesn't report blksize and blocks on Windows. Fake them with default blksize of 4096.
          // See http://support.microsoft.com/kb/140365
          if (NODEFS.isWindows && !stat.blksize) {
            stat.blksize = 4096;
          }
          if (NODEFS.isWindows && !stat.blocks) {
            stat.blocks = (stat.size+stat.blksize-1)/stat.blksize|0;
          }
          return {
            dev: stat.dev,
            ino: stat.ino,
            mode: stat.mode,
            nlink: stat.nlink,
            uid: stat.uid,
            gid: stat.gid,
            rdev: stat.rdev,
            size: stat.size,
            atime: stat.atime,
            mtime: stat.mtime,
            ctime: stat.ctime,
            blksize: stat.blksize,
            blocks: stat.blocks
          };
        },setattr:function (node, attr) {
          var path = NODEFS.realPath(node);
          try {
            if (attr.mode !== undefined) {
              fs.chmodSync(path, attr.mode);
              // update the common node structure mode as well
              node.mode = attr.mode;
            }
            if (attr.timestamp !== undefined) {
              var date = new Date(attr.timestamp);
              fs.utimesSync(path, date, date);
            }
            if (attr.size !== undefined) {
              fs.truncateSync(path, attr.size);
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },lookup:function (parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          var mode = NODEFS.getMode(path);
          return NODEFS.createNode(parent, name, mode);
        },mknod:function (parent, name, mode, dev) {
          var node = NODEFS.createNode(parent, name, mode, dev);
          // create the backing node for this in the fs root as well
          var path = NODEFS.realPath(node);
          try {
            if (FS.isDir(node.mode)) {
              fs.mkdirSync(path, node.mode);
            } else {
              fs.writeFileSync(path, '', { mode: node.mode });
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          return node;
        },rename:function (oldNode, newDir, newName) {
          var oldPath = NODEFS.realPath(oldNode);
          var newPath = PATH.join2(NODEFS.realPath(newDir), newName);
          try {
            fs.renameSync(oldPath, newPath);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },unlink:function (parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          try {
            fs.unlinkSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },rmdir:function (parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          try {
            fs.rmdirSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },readdir:function (node) {
          var path = NODEFS.realPath(node);
          try {
            return fs.readdirSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },symlink:function (parent, newName, oldPath) {
          var newPath = PATH.join2(NODEFS.realPath(parent), newName);
          try {
            fs.symlinkSync(oldPath, newPath);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },readlink:function (node) {
          var path = NODEFS.realPath(node);
          try {
            return fs.readlinkSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        }},stream_ops:{open:function (stream) {
          var path = NODEFS.realPath(stream.node);
          try {
            if (FS.isFile(stream.node.mode)) {
              stream.nfd = fs.openSync(path, NODEFS.flagsToPermissionString(stream.flags));
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },close:function (stream) {
          try {
            if (FS.isFile(stream.node.mode) && stream.nfd) {
              fs.closeSync(stream.nfd);
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },read:function (stream, buffer, offset, length, position) {
          // FIXME this is terrible.
          var nbuffer = new Buffer(length);
          var res;
          try {
            res = fs.readSync(stream.nfd, nbuffer, 0, length, position);
          } catch (e) {
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          if (res > 0) {
            for (var i = 0; i < res; i++) {
              buffer[offset + i] = nbuffer[i];
            }
          }
          return res;
        },write:function (stream, buffer, offset, length, position) {
          // FIXME this is terrible.
          var nbuffer = new Buffer(buffer.subarray(offset, offset + length));
          var res;
          try {
            res = fs.writeSync(stream.nfd, nbuffer, 0, length, position);
          } catch (e) {
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          return res;
        },llseek:function (stream, offset, whence) {
          var position = offset;
          if (whence === 1) {  // SEEK_CUR.
            position += stream.position;
          } else if (whence === 2) {  // SEEK_END.
            if (FS.isFile(stream.node.mode)) {
              try {
                var stat = fs.fstatSync(stream.nfd);
                position += stat.size;
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES[e.code]);
              }
            }
          }
          if (position < 0) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          stream.position = position;
          return position;
        }}};
  var _stdin=allocate(1, "i32*", ALLOC_STATIC);
  var _stdout=allocate(1, "i32*", ALLOC_STATIC);
  var _stderr=allocate(1, "i32*", ALLOC_STATIC);
  function _fflush(stream) {
      // int fflush(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fflush.html
      // we don't currently perform any user-space buffering of data
    }var FS={root:null,mounts:[],devices:[null],streams:[null],nextInode:1,nameTable:null,currentPath:"/",initialized:false,ignorePermissions:true,ErrnoError:null,genericErrors:{},handleFSError:function (e) {
        if (!(e instanceof FS.ErrnoError)) throw e + ' : ' + stackTrace();
        return ___setErrNo(e.errno);
      },lookupPath:function (path, opts) {
        path = PATH.resolve(FS.cwd(), path);
        opts = opts || { recurse_count: 0 };
        if (opts.recurse_count > 8) {  // max recursive lookup of 8
          throw new FS.ErrnoError(ERRNO_CODES.ELOOP);
        }
        // split the path
        var parts = PATH.normalizeArray(path.split('/').filter(function(p) {
          return !!p;
        }), false);
        // start at the root
        var current = FS.root;
        var current_path = '/';
        for (var i = 0; i < parts.length; i++) {
          var islast = (i === parts.length-1);
          if (islast && opts.parent) {
            // stop resolving
            break;
          }
          current = FS.lookupNode(current, parts[i]);
          current_path = PATH.join2(current_path, parts[i]);
          // jump to the mount's root node if this is a mountpoint
          if (FS.isMountpoint(current)) {
            current = current.mount.root;
          }
          // follow symlinks
          // by default, lookupPath will not follow a symlink if it is the final path component.
          // setting opts.follow = true will override this behavior.
          if (!islast || opts.follow) {
            var count = 0;
            while (FS.isLink(current.mode)) {
              var link = FS.readlink(current_path);
              current_path = PATH.resolve(PATH.dirname(current_path), link);
              var lookup = FS.lookupPath(current_path, { recurse_count: opts.recurse_count });
              current = lookup.node;
              if (count++ > 40) {  // limit max consecutive symlinks to 40 (SYMLOOP_MAX).
                throw new FS.ErrnoError(ERRNO_CODES.ELOOP);
              }
            }
          }
        }
        return { path: current_path, node: current };
      },getPath:function (node) {
        var path;
        while (true) {
          if (FS.isRoot(node)) {
            var mount = node.mount.mountpoint;
            if (!path) return mount;
            return mount[mount.length-1] !== '/' ? mount + '/' + path : mount + path;
          }
          path = path ? node.name + '/' + path : node.name;
          node = node.parent;
        }
      },hashName:function (parentid, name) {
        var hash = 0;
        for (var i = 0; i < name.length; i++) {
          hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
        }
        return ((parentid + hash) >>> 0) % FS.nameTable.length;
      },hashAddNode:function (node) {
        var hash = FS.hashName(node.parent.id, node.name);
        node.name_next = FS.nameTable[hash];
        FS.nameTable[hash] = node;
      },hashRemoveNode:function (node) {
        var hash = FS.hashName(node.parent.id, node.name);
        if (FS.nameTable[hash] === node) {
          FS.nameTable[hash] = node.name_next;
        } else {
          var current = FS.nameTable[hash];
          while (current) {
            if (current.name_next === node) {
              current.name_next = node.name_next;
              break;
            }
            current = current.name_next;
          }
        }
      },lookupNode:function (parent, name) {
        var err = FS.mayLookup(parent);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        var hash = FS.hashName(parent.id, name);
        for (var node = FS.nameTable[hash]; node; node = node.name_next) {
          var nodeName = node.name;
          if (node.parent.id === parent.id && nodeName === name) {
            return node;
          }
        }
        // if we failed to find it in the cache, call into the VFS
        return FS.lookup(parent, name);
      },createNode:function (parent, name, mode, rdev) {
        if (!FS.FSNode) {
          FS.FSNode = function(parent, name, mode, rdev) {
            this.id = FS.nextInode++;
            this.name = name;
            this.mode = mode;
            this.node_ops = {};
            this.stream_ops = {};
            this.rdev = rdev;
            this.parent = null;
            this.mount = null;
            if (!parent) {
              parent = this;  // root node sets parent to itself
            }
            this.parent = parent;
            this.mount = parent.mount;
            FS.hashAddNode(this);
          };
          // compatibility
          var readMode = 292 | 73;
          var writeMode = 146;
          FS.FSNode.prototype = {};
          // NOTE we must use Object.defineProperties instead of individual calls to
          // Object.defineProperty in order to make closure compiler happy
          Object.defineProperties(FS.FSNode.prototype, {
            read: {
              get: function() { return (this.mode & readMode) === readMode; },
              set: function(val) { val ? this.mode |= readMode : this.mode &= ~readMode; }
            },
            write: {
              get: function() { return (this.mode & writeMode) === writeMode; },
              set: function(val) { val ? this.mode |= writeMode : this.mode &= ~writeMode; }
            },
            isFolder: {
              get: function() { return FS.isDir(this.mode); },
            },
            isDevice: {
              get: function() { return FS.isChrdev(this.mode); },
            },
          });
        }
        return new FS.FSNode(parent, name, mode, rdev);
      },destroyNode:function (node) {
        FS.hashRemoveNode(node);
      },isRoot:function (node) {
        return node === node.parent;
      },isMountpoint:function (node) {
        return node.mounted;
      },isFile:function (mode) {
        return (mode & 61440) === 32768;
      },isDir:function (mode) {
        return (mode & 61440) === 16384;
      },isLink:function (mode) {
        return (mode & 61440) === 40960;
      },isChrdev:function (mode) {
        return (mode & 61440) === 8192;
      },isBlkdev:function (mode) {
        return (mode & 61440) === 24576;
      },isFIFO:function (mode) {
        return (mode & 61440) === 4096;
      },isSocket:function (mode) {
        return (mode & 49152) === 49152;
      },flagModes:{"r":0,"rs":1052672,"r+":2,"w":577,"wx":705,"xw":705,"w+":578,"wx+":706,"xw+":706,"a":1089,"ax":1217,"xa":1217,"a+":1090,"ax+":1218,"xa+":1218},modeStringToFlags:function (str) {
        var flags = FS.flagModes[str];
        if (typeof flags === 'undefined') {
          throw new Error('Unknown file open mode: ' + str);
        }
        return flags;
      },flagsToPermissionString:function (flag) {
        var accmode = flag & 2097155;
        var perms = ['r', 'w', 'rw'][accmode];
        if ((flag & 512)) {
          perms += 'w';
        }
        return perms;
      },nodePermissions:function (node, perms) {
        if (FS.ignorePermissions) {
          return 0;
        }
        // return 0 if any user, group or owner bits are set.
        if (perms.indexOf('r') !== -1 && !(node.mode & 292)) {
          return ERRNO_CODES.EACCES;
        } else if (perms.indexOf('w') !== -1 && !(node.mode & 146)) {
          return ERRNO_CODES.EACCES;
        } else if (perms.indexOf('x') !== -1 && !(node.mode & 73)) {
          return ERRNO_CODES.EACCES;
        }
        return 0;
      },mayLookup:function (dir) {
        return FS.nodePermissions(dir, 'x');
      },mayCreate:function (dir, name) {
        try {
          var node = FS.lookupNode(dir, name);
          return ERRNO_CODES.EEXIST;
        } catch (e) {
        }
        return FS.nodePermissions(dir, 'wx');
      },mayDelete:function (dir, name, isdir) {
        var node;
        try {
          node = FS.lookupNode(dir, name);
        } catch (e) {
          return e.errno;
        }
        var err = FS.nodePermissions(dir, 'wx');
        if (err) {
          return err;
        }
        if (isdir) {
          if (!FS.isDir(node.mode)) {
            return ERRNO_CODES.ENOTDIR;
          }
          if (FS.isRoot(node) || FS.getPath(node) === FS.cwd()) {
            return ERRNO_CODES.EBUSY;
          }
        } else {
          if (FS.isDir(node.mode)) {
            return ERRNO_CODES.EISDIR;
          }
        }
        return 0;
      },mayOpen:function (node, flags) {
        if (!node) {
          return ERRNO_CODES.ENOENT;
        }
        if (FS.isLink(node.mode)) {
          return ERRNO_CODES.ELOOP;
        } else if (FS.isDir(node.mode)) {
          if ((flags & 2097155) !== 0 ||  // opening for write
              (flags & 512)) {
            return ERRNO_CODES.EISDIR;
          }
        }
        return FS.nodePermissions(node, FS.flagsToPermissionString(flags));
      },MAX_OPEN_FDS:4096,nextfd:function (fd_start, fd_end) {
        fd_start = fd_start || 1;
        fd_end = fd_end || FS.MAX_OPEN_FDS;
        for (var fd = fd_start; fd <= fd_end; fd++) {
          if (!FS.streams[fd]) {
            return fd;
          }
        }
        throw new FS.ErrnoError(ERRNO_CODES.EMFILE);
      },getStream:function (fd) {
        return FS.streams[fd];
      },createStream:function (stream, fd_start, fd_end) {
        if (!FS.FSStream) {
          FS.FSStream = function(){};
          FS.FSStream.prototype = {};
          // compatibility
          Object.defineProperties(FS.FSStream.prototype, {
            object: {
              get: function() { return this.node; },
              set: function(val) { this.node = val; }
            },
            isRead: {
              get: function() { return (this.flags & 2097155) !== 1; }
            },
            isWrite: {
              get: function() { return (this.flags & 2097155) !== 0; }
            },
            isAppend: {
              get: function() { return (this.flags & 1024); }
            }
          });
        }
        if (stream.__proto__) {
          // reuse the object
          stream.__proto__ = FS.FSStream.prototype;
        } else {
          var newStream = new FS.FSStream();
          for (var p in stream) {
            newStream[p] = stream[p];
          }
          stream = newStream;
        }
        var fd = FS.nextfd(fd_start, fd_end);
        stream.fd = fd;
        FS.streams[fd] = stream;
        return stream;
      },closeStream:function (fd) {
        FS.streams[fd] = null;
      },chrdev_stream_ops:{open:function (stream) {
          var device = FS.getDevice(stream.node.rdev);
          // override node's stream ops with the device's
          stream.stream_ops = device.stream_ops;
          // forward the open call
          if (stream.stream_ops.open) {
            stream.stream_ops.open(stream);
          }
        },llseek:function () {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }},major:function (dev) {
        return ((dev) >> 8);
      },minor:function (dev) {
        return ((dev) & 0xff);
      },makedev:function (ma, mi) {
        return ((ma) << 8 | (mi));
      },registerDevice:function (dev, ops) {
        FS.devices[dev] = { stream_ops: ops };
      },getDevice:function (dev) {
        return FS.devices[dev];
      },syncfs:function (populate, callback) {
        if (typeof(populate) === 'function') {
          callback = populate;
          populate = false;
        }
        var completed = 0;
        var total = FS.mounts.length;
        function done(err) {
          if (err) {
            return callback(err);
          }
          if (++completed >= total) {
            callback(null);
          }
        };
        // sync all mounts
        for (var i = 0; i < FS.mounts.length; i++) {
          var mount = FS.mounts[i];
          if (!mount.type.syncfs) {
            done(null);
            continue;
          }
          mount.type.syncfs(mount, populate, done);
        }
      },mount:function (type, opts, mountpoint) {
        var lookup;
        if (mountpoint) {
          lookup = FS.lookupPath(mountpoint, { follow: false });
          mountpoint = lookup.path;  // use the absolute path
        }
        var mount = {
          type: type,
          opts: opts,
          mountpoint: mountpoint,
          root: null
        };
        // create a root node for the fs
        var root = type.mount(mount);
        root.mount = mount;
        mount.root = root;
        // assign the mount info to the mountpoint's node
        if (lookup) {
          lookup.node.mount = mount;
          lookup.node.mounted = true;
          // compatibility update FS.root if we mount to /
          if (mountpoint === '/') {
            FS.root = mount.root;
          }
        }
        // add to our cached list of mounts
        FS.mounts.push(mount);
        return root;
      },lookup:function (parent, name) {
        return parent.node_ops.lookup(parent, name);
      },mknod:function (path, mode, dev) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var err = FS.mayCreate(parent, name);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.mknod) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return parent.node_ops.mknod(parent, name, mode, dev);
      },create:function (path, mode) {
        mode = mode !== undefined ? mode : 0666;
        mode &= 4095;
        mode |= 32768;
        return FS.mknod(path, mode, 0);
      },mkdir:function (path, mode) {
        mode = mode !== undefined ? mode : 0777;
        mode &= 511 | 512;
        mode |= 16384;
        return FS.mknod(path, mode, 0);
      },mkdev:function (path, mode, dev) {
        if (typeof(dev) === 'undefined') {
          dev = mode;
          mode = 0666;
        }
        mode |= 8192;
        return FS.mknod(path, mode, dev);
      },symlink:function (oldpath, newpath) {
        var lookup = FS.lookupPath(newpath, { parent: true });
        var parent = lookup.node;
        var newname = PATH.basename(newpath);
        var err = FS.mayCreate(parent, newname);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.symlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return parent.node_ops.symlink(parent, newname, oldpath);
      },rename:function (old_path, new_path) {
        var old_dirname = PATH.dirname(old_path);
        var new_dirname = PATH.dirname(new_path);
        var old_name = PATH.basename(old_path);
        var new_name = PATH.basename(new_path);
        // parents must exist
        var lookup, old_dir, new_dir;
        try {
          lookup = FS.lookupPath(old_path, { parent: true });
          old_dir = lookup.node;
          lookup = FS.lookupPath(new_path, { parent: true });
          new_dir = lookup.node;
        } catch (e) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        // need to be part of the same mount
        if (old_dir.mount !== new_dir.mount) {
          throw new FS.ErrnoError(ERRNO_CODES.EXDEV);
        }
        // source must exist
        var old_node = FS.lookupNode(old_dir, old_name);
        // old path should not be an ancestor of the new path
        var relative = PATH.relative(old_path, new_dirname);
        if (relative.charAt(0) !== '.') {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        // new path should not be an ancestor of the old path
        relative = PATH.relative(new_path, old_dirname);
        if (relative.charAt(0) !== '.') {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
        }
        // see if the new path already exists
        var new_node;
        try {
          new_node = FS.lookupNode(new_dir, new_name);
        } catch (e) {
          // not fatal
        }
        // early out if nothing needs to change
        if (old_node === new_node) {
          return;
        }
        // we'll need to delete the old entry
        var isdir = FS.isDir(old_node.mode);
        var err = FS.mayDelete(old_dir, old_name, isdir);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        // need delete permissions if we'll be overwriting.
        // need create permissions if new doesn't already exist.
        err = new_node ?
          FS.mayDelete(new_dir, new_name, isdir) :
          FS.mayCreate(new_dir, new_name);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!old_dir.node_ops.rename) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(old_node) || (new_node && FS.isMountpoint(new_node))) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        // if we are going to change the parent, check write permissions
        if (new_dir !== old_dir) {
          err = FS.nodePermissions(old_dir, 'w');
          if (err) {
            throw new FS.ErrnoError(err);
          }
        }
        // remove the node from the lookup hash
        FS.hashRemoveNode(old_node);
        // do the underlying fs rename
        try {
          old_dir.node_ops.rename(old_node, new_dir, new_name);
        } catch (e) {
          throw e;
        } finally {
          // add the node back to the hash (in case node_ops.rename
          // changed its name)
          FS.hashAddNode(old_node);
        }
      },rmdir:function (path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var err = FS.mayDelete(parent, name, true);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.rmdir) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(node)) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        parent.node_ops.rmdir(parent, name);
        FS.destroyNode(node);
      },readdir:function (path) {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        if (!node.node_ops.readdir) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
        }
        return node.node_ops.readdir(node);
      },unlink:function (path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var err = FS.mayDelete(parent, name, false);
        if (err) {
          // POSIX says unlink should set EPERM, not EISDIR
          if (err === ERRNO_CODES.EISDIR) err = ERRNO_CODES.EPERM;
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.unlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(node)) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        parent.node_ops.unlink(parent, name);
        FS.destroyNode(node);
      },readlink:function (path) {
        var lookup = FS.lookupPath(path, { follow: false });
        var link = lookup.node;
        if (!link.node_ops.readlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        return link.node_ops.readlink(link);
      },stat:function (path, dontFollow) {
        var lookup = FS.lookupPath(path, { follow: !dontFollow });
        var node = lookup.node;
        if (!node.node_ops.getattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return node.node_ops.getattr(node);
      },lstat:function (path) {
        return FS.stat(path, true);
      },chmod:function (path, mode, dontFollow) {
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: !dontFollow });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        node.node_ops.setattr(node, {
          mode: (mode & 4095) | (node.mode & ~4095),
          timestamp: Date.now()
        });
      },lchmod:function (path, mode) {
        FS.chmod(path, mode, true);
      },fchmod:function (fd, mode) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        FS.chmod(stream.node, mode);
      },chown:function (path, uid, gid, dontFollow) {
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: !dontFollow });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        node.node_ops.setattr(node, {
          timestamp: Date.now()
          // we ignore the uid / gid for now
        });
      },lchown:function (path, uid, gid) {
        FS.chown(path, uid, gid, true);
      },fchown:function (fd, uid, gid) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        FS.chown(stream.node, uid, gid);
      },truncate:function (path, len) {
        if (len < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: true });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isDir(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!FS.isFile(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var err = FS.nodePermissions(node, 'w');
        if (err) {
          throw new FS.ErrnoError(err);
        }
        node.node_ops.setattr(node, {
          size: len,
          timestamp: Date.now()
        });
      },ftruncate:function (fd, len) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        FS.truncate(stream.node, len);
      },utime:function (path, atime, mtime) {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        node.node_ops.setattr(node, {
          timestamp: Math.max(atime, mtime)
        });
      },open:function (path, flags, mode, fd_start, fd_end) {
        flags = typeof flags === 'string' ? FS.modeStringToFlags(flags) : flags;
        mode = typeof mode === 'undefined' ? 0666 : mode;
        if ((flags & 64)) {
          mode = (mode & 4095) | 32768;
        } else {
          mode = 0;
        }
        var node;
        if (typeof path === 'object') {
          node = path;
        } else {
          path = PATH.normalize(path);
          try {
            var lookup = FS.lookupPath(path, {
              follow: !(flags & 131072)
            });
            node = lookup.node;
          } catch (e) {
            // ignore
          }
        }
        // perhaps we need to create the node
        if ((flags & 64)) {
          if (node) {
            // if O_CREAT and O_EXCL are set, error out if the node already exists
            if ((flags & 128)) {
              throw new FS.ErrnoError(ERRNO_CODES.EEXIST);
            }
          } else {
            // node doesn't exist, try to create it
            node = FS.mknod(path, mode, 0);
          }
        }
        if (!node) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
        }
        // can't truncate a device
        if (FS.isChrdev(node.mode)) {
          flags &= ~512;
        }
        // check permissions
        var err = FS.mayOpen(node, flags);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        // do truncation if necessary
        if ((flags & 512)) {
          FS.truncate(node, 0);
        }
        // we've already handled these, don't pass down to the underlying vfs
        flags &= ~(128 | 512);
        // register the stream with the filesystem
        var stream = FS.createStream({
          node: node,
          path: FS.getPath(node),  // we want the absolute path to the node
          flags: flags,
          seekable: true,
          position: 0,
          stream_ops: node.stream_ops,
          // used by the file family libc calls (fopen, fwrite, ferror, etc.)
          ungotten: [],
          error: false
        }, fd_start, fd_end);
        // call the new stream's open function
        if (stream.stream_ops.open) {
          stream.stream_ops.open(stream);
        }
        if (Module['logReadFiles'] && !(flags & 1)) {
          if (!FS.readFiles) FS.readFiles = {};
          if (!(path in FS.readFiles)) {
            FS.readFiles[path] = 1;
            Module['printErr']('read file: ' + path);
          }
        }
        return stream;
      },close:function (stream) {
        try {
          if (stream.stream_ops.close) {
            stream.stream_ops.close(stream);
          }
        } catch (e) {
          throw e;
        } finally {
          FS.closeStream(stream.fd);
        }
      },llseek:function (stream, offset, whence) {
        if (!stream.seekable || !stream.stream_ops.llseek) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        return stream.stream_ops.llseek(stream, offset, whence);
      },read:function (stream, buffer, offset, length, position) {
        if (length < 0 || position < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 1) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!stream.stream_ops.read) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var seeking = true;
        if (typeof position === 'undefined') {
          position = stream.position;
          seeking = false;
        } else if (!stream.seekable) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        var bytesRead = stream.stream_ops.read(stream, buffer, offset, length, position);
        if (!seeking) stream.position += bytesRead;
        return bytesRead;
      },write:function (stream, buffer, offset, length, position, canOwn) {
        if (length < 0 || position < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!stream.stream_ops.write) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var seeking = true;
        if (typeof position === 'undefined') {
          position = stream.position;
          seeking = false;
        } else if (!stream.seekable) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        if (stream.flags & 1024) {
          // seek to the end before writing in append mode
          FS.llseek(stream, 0, 2);
        }
        var bytesWritten = stream.stream_ops.write(stream, buffer, offset, length, position, canOwn);
        if (!seeking) stream.position += bytesWritten;
        return bytesWritten;
      },allocate:function (stream, offset, length) {
        if (offset < 0 || length <= 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (!FS.isFile(stream.node.mode) && !FS.isDir(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
        }
        if (!stream.stream_ops.allocate) {
          throw new FS.ErrnoError(ERRNO_CODES.EOPNOTSUPP);
        }
        stream.stream_ops.allocate(stream, offset, length);
      },mmap:function (stream, buffer, offset, length, position, prot, flags) {
        // TODO if PROT is PROT_WRITE, make sure we have write access
        if ((stream.flags & 2097155) === 1) {
          throw new FS.ErrnoError(ERRNO_CODES.EACCES);
        }
        if (!stream.stream_ops.mmap) {
          throw new FS.errnoError(ERRNO_CODES.ENODEV);
        }
        return stream.stream_ops.mmap(stream, buffer, offset, length, position, prot, flags);
      },ioctl:function (stream, cmd, arg) {
        if (!stream.stream_ops.ioctl) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTTY);
        }
        return stream.stream_ops.ioctl(stream, cmd, arg);
      },readFile:function (path, opts) {
        opts = opts || {};
        opts.flags = opts.flags || 'r';
        opts.encoding = opts.encoding || 'binary';
        var ret;
        var stream = FS.open(path, opts.flags);
        var stat = FS.stat(path);
        var length = stat.size;
        var buf = new Uint8Array(length);
        FS.read(stream, buf, 0, length, 0);
        if (opts.encoding === 'utf8') {
          ret = '';
          var utf8 = new Runtime.UTF8Processor();
          for (var i = 0; i < length; i++) {
            ret += utf8.processCChar(buf[i]);
          }
        } else if (opts.encoding === 'binary') {
          ret = buf;
        } else {
          throw new Error('Invalid encoding type "' + opts.encoding + '"');
        }
        FS.close(stream);
        return ret;
      },writeFile:function (path, data, opts) {
        opts = opts || {};
        opts.flags = opts.flags || 'w';
        opts.encoding = opts.encoding || 'utf8';
        var stream = FS.open(path, opts.flags, opts.mode);
        if (opts.encoding === 'utf8') {
          var utf8 = new Runtime.UTF8Processor();
          var buf = new Uint8Array(utf8.processJSString(data));
          FS.write(stream, buf, 0, buf.length, 0);
        } else if (opts.encoding === 'binary') {
          FS.write(stream, data, 0, data.length, 0);
        } else {
          throw new Error('Invalid encoding type "' + opts.encoding + '"');
        }
        FS.close(stream);
      },cwd:function () {
        return FS.currentPath;
      },chdir:function (path) {
        var lookup = FS.lookupPath(path, { follow: true });
        if (!FS.isDir(lookup.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
        }
        var err = FS.nodePermissions(lookup.node, 'x');
        if (err) {
          throw new FS.ErrnoError(err);
        }
        FS.currentPath = lookup.path;
      },createDefaultDirectories:function () {
        FS.mkdir('/tmp');
      },createDefaultDevices:function () {
        // create /dev
        FS.mkdir('/dev');
        // setup /dev/null
        FS.registerDevice(FS.makedev(1, 3), {
          read: function() { return 0; },
          write: function() { return 0; }
        });
        FS.mkdev('/dev/null', FS.makedev(1, 3));
        // setup /dev/tty and /dev/tty1
        // stderr needs to print output using Module['printErr']
        // so we register a second tty just for it.
        TTY.register(FS.makedev(5, 0), TTY.default_tty_ops);
        TTY.register(FS.makedev(6, 0), TTY.default_tty1_ops);
        FS.mkdev('/dev/tty', FS.makedev(5, 0));
        FS.mkdev('/dev/tty1', FS.makedev(6, 0));
        // we're not going to emulate the actual shm device,
        // just create the tmp dirs that reside in it commonly
        FS.mkdir('/dev/shm');
        FS.mkdir('/dev/shm/tmp');
      },createStandardStreams:function () {
        // TODO deprecate the old functionality of a single
        // input / output callback and that utilizes FS.createDevice
        // and instead require a unique set of stream ops
        // by default, we symlink the standard streams to the
        // default tty devices. however, if the standard streams
        // have been overwritten we create a unique device for
        // them instead.
        if (Module['stdin']) {
          FS.createDevice('/dev', 'stdin', Module['stdin']);
        } else {
          FS.symlink('/dev/tty', '/dev/stdin');
        }
        if (Module['stdout']) {
          FS.createDevice('/dev', 'stdout', null, Module['stdout']);
        } else {
          FS.symlink('/dev/tty', '/dev/stdout');
        }
        if (Module['stderr']) {
          FS.createDevice('/dev', 'stderr', null, Module['stderr']);
        } else {
          FS.symlink('/dev/tty1', '/dev/stderr');
        }
        // open default streams for the stdin, stdout and stderr devices
        var stdin = FS.open('/dev/stdin', 'r');
        HEAP32[((_stdin)>>2)]=stdin.fd;
        assert(stdin.fd === 1, 'invalid handle for stdin (' + stdin.fd + ')');
        var stdout = FS.open('/dev/stdout', 'w');
        HEAP32[((_stdout)>>2)]=stdout.fd;
        assert(stdout.fd === 2, 'invalid handle for stdout (' + stdout.fd + ')');
        var stderr = FS.open('/dev/stderr', 'w');
        HEAP32[((_stderr)>>2)]=stderr.fd;
        assert(stderr.fd === 3, 'invalid handle for stderr (' + stderr.fd + ')');
      },ensureErrnoError:function () {
        if (FS.ErrnoError) return;
        FS.ErrnoError = function ErrnoError(errno) {
          this.errno = errno;
          for (var key in ERRNO_CODES) {
            if (ERRNO_CODES[key] === errno) {
              this.code = key;
              break;
            }
          }
          this.message = ERRNO_MESSAGES[errno];
          this.stack = stackTrace();
        };
        FS.ErrnoError.prototype = new Error();
        FS.ErrnoError.prototype.constructor = FS.ErrnoError;
        // Some errors may happen quite a bit, to avoid overhead we reuse them (and suffer a lack of stack info)
        [ERRNO_CODES.ENOENT].forEach(function(code) {
          FS.genericErrors[code] = new FS.ErrnoError(code);
          FS.genericErrors[code].stack = '<generic error, no stack>';
        });
      },staticInit:function () {
        FS.ensureErrnoError();
        FS.nameTable = new Array(4096);
        FS.root = FS.createNode(null, '/', 16384 | 0777, 0);
        FS.mount(MEMFS, {}, '/');
        FS.createDefaultDirectories();
        FS.createDefaultDevices();
      },init:function (input, output, error) {
        assert(!FS.init.initialized, 'FS.init was previously called. If you want to initialize later with custom parameters, remove any earlier calls (note that one is automatically added to the generated code)');
        FS.init.initialized = true;
        FS.ensureErrnoError();
        // Allow Module.stdin etc. to provide defaults, if none explicitly passed to us here
        Module['stdin'] = input || Module['stdin'];
        Module['stdout'] = output || Module['stdout'];
        Module['stderr'] = error || Module['stderr'];
        FS.createStandardStreams();
      },quit:function () {
        FS.init.initialized = false;
        for (var i = 0; i < FS.streams.length; i++) {
          var stream = FS.streams[i];
          if (!stream) {
            continue;
          }
          FS.close(stream);
        }
      },getMode:function (canRead, canWrite) {
        var mode = 0;
        if (canRead) mode |= 292 | 73;
        if (canWrite) mode |= 146;
        return mode;
      },joinPath:function (parts, forceRelative) {
        var path = PATH.join.apply(null, parts);
        if (forceRelative && path[0] == '/') path = path.substr(1);
        return path;
      },absolutePath:function (relative, base) {
        return PATH.resolve(base, relative);
      },standardizePath:function (path) {
        return PATH.normalize(path);
      },findObject:function (path, dontResolveLastLink) {
        var ret = FS.analyzePath(path, dontResolveLastLink);
        if (ret.exists) {
          return ret.object;
        } else {
          ___setErrNo(ret.error);
          return null;
        }
      },analyzePath:function (path, dontResolveLastLink) {
        // operate from within the context of the symlink's target
        try {
          var lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
          path = lookup.path;
        } catch (e) {
        }
        var ret = {
          isRoot: false, exists: false, error: 0, name: null, path: null, object: null,
          parentExists: false, parentPath: null, parentObject: null
        };
        try {
          var lookup = FS.lookupPath(path, { parent: true });
          ret.parentExists = true;
          ret.parentPath = lookup.path;
          ret.parentObject = lookup.node;
          ret.name = PATH.basename(path);
          lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
          ret.exists = true;
          ret.path = lookup.path;
          ret.object = lookup.node;
          ret.name = lookup.node.name;
          ret.isRoot = lookup.path === '/';
        } catch (e) {
          ret.error = e.errno;
        };
        return ret;
      },createFolder:function (parent, name, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(canRead, canWrite);
        return FS.mkdir(path, mode);
      },createPath:function (parent, path, canRead, canWrite) {
        parent = typeof parent === 'string' ? parent : FS.getPath(parent);
        var parts = path.split('/').reverse();
        while (parts.length) {
          var part = parts.pop();
          if (!part) continue;
          var current = PATH.join2(parent, part);
          try {
            FS.mkdir(current);
          } catch (e) {
            // ignore EEXIST
          }
          parent = current;
        }
        return current;
      },createFile:function (parent, name, properties, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(canRead, canWrite);
        return FS.create(path, mode);
      },createDataFile:function (parent, name, data, canRead, canWrite, canOwn) {
        var path = name ? PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name) : parent;
        var mode = FS.getMode(canRead, canWrite);
        var node = FS.create(path, mode);
        if (data) {
          if (typeof data === 'string') {
            var arr = new Array(data.length);
            for (var i = 0, len = data.length; i < len; ++i) arr[i] = data.charCodeAt(i);
            data = arr;
          }
          // make sure we can write to the file
          FS.chmod(node, mode | 146);
          var stream = FS.open(node, 'w');
          FS.write(stream, data, 0, data.length, 0, canOwn);
          FS.close(stream);
          FS.chmod(node, mode);
        }
        return node;
      },createDevice:function (parent, name, input, output) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(!!input, !!output);
        if (!FS.createDevice.major) FS.createDevice.major = 64;
        var dev = FS.makedev(FS.createDevice.major++, 0);
        // Create a fake device that a set of stream ops to emulate
        // the old behavior.
        FS.registerDevice(dev, {
          open: function(stream) {
            stream.seekable = false;
          },
          close: function(stream) {
            // flush any pending line data
            if (output && output.buffer && output.buffer.length) {
              output(10);
            }
          },
          read: function(stream, buffer, offset, length, pos /* ignored */) {
            var bytesRead = 0;
            for (var i = 0; i < length; i++) {
              var result;
              try {
                result = input();
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES.EIO);
              }
              if (result === undefined && bytesRead === 0) {
                throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
              }
              if (result === null || result === undefined) break;
              bytesRead++;
              buffer[offset+i] = result;
            }
            if (bytesRead) {
              stream.node.timestamp = Date.now();
            }
            return bytesRead;
          },
          write: function(stream, buffer, offset, length, pos) {
            for (var i = 0; i < length; i++) {
              try {
                output(buffer[offset+i]);
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES.EIO);
              }
            }
            if (length) {
              stream.node.timestamp = Date.now();
            }
            return i;
          }
        });
        return FS.mkdev(path, mode, dev);
      },createLink:function (parent, name, target, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        return FS.symlink(target, path);
      },forceLoadFile:function (obj) {
        if (obj.isDevice || obj.isFolder || obj.link || obj.contents) return true;
        var success = true;
        if (typeof XMLHttpRequest !== 'undefined') {
          throw new Error("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.");
        } else if (Module['read']) {
          // Command-line.
          try {
            // WARNING: Can't read binary files in V8's d8 or tracemonkey's js, as
            //          read() will try to parse UTF8.
            obj.contents = intArrayFromString(Module['read'](obj.url), true);
          } catch (e) {
            success = false;
          }
        } else {
          throw new Error('Cannot load without read() or XMLHttpRequest.');
        }
        if (!success) ___setErrNo(ERRNO_CODES.EIO);
        return success;
      },createLazyFile:function (parent, name, url, canRead, canWrite) {
        if (typeof XMLHttpRequest !== 'undefined') {
          if (!ENVIRONMENT_IS_WORKER) throw 'Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc';
          // Lazy chunked Uint8Array (implements get and length from Uint8Array). Actual getting is abstracted away for eventual reuse.
          function LazyUint8Array() {
            this.lengthKnown = false;
            this.chunks = []; // Loaded chunks. Index is the chunk number
          }
          LazyUint8Array.prototype.get = function LazyUint8Array_get(idx) {
            if (idx > this.length-1 || idx < 0) {
              return undefined;
            }
            var chunkOffset = idx % this.chunkSize;
            var chunkNum = Math.floor(idx / this.chunkSize);
            return this.getter(chunkNum)[chunkOffset];
          }
          LazyUint8Array.prototype.setDataGetter = function LazyUint8Array_setDataGetter(getter) {
            this.getter = getter;
          }
          LazyUint8Array.prototype.cacheLength = function LazyUint8Array_cacheLength() {
              // Find length
              var xhr = new XMLHttpRequest();
              xhr.open('HEAD', url, false);
              xhr.send(null);
              if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
              var datalength = Number(xhr.getResponseHeader("Content-length"));
              var header;
              var hasByteServing = (header = xhr.getResponseHeader("Accept-Ranges")) && header === "bytes";
              var chunkSize = 1024*1024; // Chunk size in bytes
              if (!hasByteServing) chunkSize = datalength;
              // Function to get a range from the remote URL.
              var doXHR = (function(from, to) {
                if (from > to) throw new Error("invalid range (" + from + ", " + to + ") or no bytes requested!");
                if (to > datalength-1) throw new Error("only " + datalength + " bytes available! programmer error!");
                // TODO: Use mozResponseArrayBuffer, responseStream, etc. if available.
                var xhr = new XMLHttpRequest();
                xhr.open('GET', url, false);
                if (datalength !== chunkSize) xhr.setRequestHeader("Range", "bytes=" + from + "-" + to);
                // Some hints to the browser that we want binary data.
                if (typeof Uint8Array != 'undefined') xhr.responseType = 'arraybuffer';
                if (xhr.overrideMimeType) {
                  xhr.overrideMimeType('text/plain; charset=x-user-defined');
                }
                xhr.send(null);
                if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
                if (xhr.response !== undefined) {
                  return new Uint8Array(xhr.response || []);
                } else {
                  return intArrayFromString(xhr.responseText || '', true);
                }
              });
              var lazyArray = this;
              lazyArray.setDataGetter(function(chunkNum) {
                var start = chunkNum * chunkSize;
                var end = (chunkNum+1) * chunkSize - 1; // including this byte
                end = Math.min(end, datalength-1); // if datalength-1 is selected, this is the last block
                if (typeof(lazyArray.chunks[chunkNum]) === "undefined") {
                  lazyArray.chunks[chunkNum] = doXHR(start, end);
                }
                if (typeof(lazyArray.chunks[chunkNum]) === "undefined") throw new Error("doXHR failed!");
                return lazyArray.chunks[chunkNum];
              });
              this._length = datalength;
              this._chunkSize = chunkSize;
              this.lengthKnown = true;
          }
          var lazyArray = new LazyUint8Array();
          Object.defineProperty(lazyArray, "length", {
              get: function() {
                  if(!this.lengthKnown) {
                      this.cacheLength();
                  }
                  return this._length;
              }
          });
          Object.defineProperty(lazyArray, "chunkSize", {
              get: function() {
                  if(!this.lengthKnown) {
                      this.cacheLength();
                  }
                  return this._chunkSize;
              }
          });
          var properties = { isDevice: false, contents: lazyArray };
        } else {
          var properties = { isDevice: false, url: url };
        }
        var node = FS.createFile(parent, name, properties, canRead, canWrite);
        // This is a total hack, but I want to get this lazy file code out of the
        // core of MEMFS. If we want to keep this lazy file concept I feel it should
        // be its own thin LAZYFS proxying calls to MEMFS.
        if (properties.contents) {
          node.contents = properties.contents;
        } else if (properties.url) {
          node.contents = null;
          node.url = properties.url;
        }
        // override each stream op with one that tries to force load the lazy file first
        var stream_ops = {};
        var keys = Object.keys(node.stream_ops);
        keys.forEach(function(key) {
          var fn = node.stream_ops[key];
          stream_ops[key] = function forceLoadLazyFile() {
            if (!FS.forceLoadFile(node)) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
            return fn.apply(null, arguments);
          };
        });
        // use a custom read function
        stream_ops.read = function stream_ops_read(stream, buffer, offset, length, position) {
          if (!FS.forceLoadFile(node)) {
            throw new FS.ErrnoError(ERRNO_CODES.EIO);
          }
          var contents = stream.node.contents;
          if (position >= contents.length)
            return 0;
          var size = Math.min(contents.length - position, length);
          assert(size >= 0);
          if (contents.slice) { // normal array
            for (var i = 0; i < size; i++) {
              buffer[offset + i] = contents[position + i];
            }
          } else {
            for (var i = 0; i < size; i++) { // LazyUint8Array from sync binary XHR
              buffer[offset + i] = contents.get(position + i);
            }
          }
          return size;
        };
        node.stream_ops = stream_ops;
        return node;
      },createPreloadedFile:function (parent, name, url, canRead, canWrite, onload, onerror, dontCreateFile, canOwn) {
        Browser.init();
        // TODO we should allow people to just pass in a complete filename instead
        // of parent and name being that we just join them anyways
        var fullname = name ? PATH.resolve(PATH.join2(parent, name)) : parent;
        function processData(byteArray) {
          function finish(byteArray) {
            if (!dontCreateFile) {
              FS.createDataFile(parent, name, byteArray, canRead, canWrite, canOwn);
            }
            if (onload) onload();
            removeRunDependency('cp ' + fullname);
          }
          var handled = false;
          Module['preloadPlugins'].forEach(function(plugin) {
            if (handled) return;
            if (plugin['canHandle'](fullname)) {
              plugin['handle'](byteArray, fullname, finish, function() {
                if (onerror) onerror();
                removeRunDependency('cp ' + fullname);
              });
              handled = true;
            }
          });
          if (!handled) finish(byteArray);
        }
        addRunDependency('cp ' + fullname);
        if (typeof url == 'string') {
          Browser.asyncLoad(url, function(byteArray) {
            processData(byteArray);
          }, onerror);
        } else {
          processData(url);
        }
      },indexedDB:function () {
        return window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
      },DB_NAME:function () {
        return 'EM_FS_' + window.location.pathname;
      },DB_VERSION:20,DB_STORE_NAME:"FILE_DATA",saveFilesToDB:function (paths, onload, onerror) {
        onload = onload || function(){};
        onerror = onerror || function(){};
        var indexedDB = FS.indexedDB();
        try {
          var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
        } catch (e) {
          return onerror(e);
        }
        openRequest.onupgradeneeded = function openRequest_onupgradeneeded() {
          console.log('creating db');
          var db = openRequest.result;
          db.createObjectStore(FS.DB_STORE_NAME);
        };
        openRequest.onsuccess = function openRequest_onsuccess() {
          var db = openRequest.result;
          var transaction = db.transaction([FS.DB_STORE_NAME], 'readwrite');
          var files = transaction.objectStore(FS.DB_STORE_NAME);
          var ok = 0, fail = 0, total = paths.length;
          function finish() {
            if (fail == 0) onload(); else onerror();
          }
          paths.forEach(function(path) {
            var putRequest = files.put(FS.analyzePath(path).object.contents, path);
            putRequest.onsuccess = function putRequest_onsuccess() { ok++; if (ok + fail == total) finish() };
            putRequest.onerror = function putRequest_onerror() { fail++; if (ok + fail == total) finish() };
          });
          transaction.onerror = onerror;
        };
        openRequest.onerror = onerror;
      },loadFilesFromDB:function (paths, onload, onerror) {
        onload = onload || function(){};
        onerror = onerror || function(){};
        var indexedDB = FS.indexedDB();
        try {
          var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
        } catch (e) {
          return onerror(e);
        }
        openRequest.onupgradeneeded = onerror; // no database to load from
        openRequest.onsuccess = function openRequest_onsuccess() {
          var db = openRequest.result;
          try {
            var transaction = db.transaction([FS.DB_STORE_NAME], 'readonly');
          } catch(e) {
            onerror(e);
            return;
          }
          var files = transaction.objectStore(FS.DB_STORE_NAME);
          var ok = 0, fail = 0, total = paths.length;
          function finish() {
            if (fail == 0) onload(); else onerror();
          }
          paths.forEach(function(path) {
            var getRequest = files.get(path);
            getRequest.onsuccess = function getRequest_onsuccess() {
              if (FS.analyzePath(path).exists) {
                FS.unlink(path);
              }
              FS.createDataFile(PATH.dirname(path), PATH.basename(path), getRequest.result, true, true, true);
              ok++;
              if (ok + fail == total) finish();
            };
            getRequest.onerror = function getRequest_onerror() { fail++; if (ok + fail == total) finish() };
          });
          transaction.onerror = onerror;
        };
        openRequest.onerror = onerror;
      }};var PATH={splitPath:function (filename) {
        var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
        return splitPathRe.exec(filename).slice(1);
      },normalizeArray:function (parts, allowAboveRoot) {
        // if the path tries to go above the root, `up` ends up > 0
        var up = 0;
        for (var i = parts.length - 1; i >= 0; i--) {
          var last = parts[i];
          if (last === '.') {
            parts.splice(i, 1);
          } else if (last === '..') {
            parts.splice(i, 1);
            up++;
          } else if (up) {
            parts.splice(i, 1);
            up--;
          }
        }
        // if the path is allowed to go above the root, restore leading ..s
        if (allowAboveRoot) {
          for (; up--; up) {
            parts.unshift('..');
          }
        }
        return parts;
      },normalize:function (path) {
        var isAbsolute = path.charAt(0) === '/',
            trailingSlash = path.substr(-1) === '/';
        // Normalize the path
        path = PATH.normalizeArray(path.split('/').filter(function(p) {
          return !!p;
        }), !isAbsolute).join('/');
        if (!path && !isAbsolute) {
          path = '.';
        }
        if (path && trailingSlash) {
          path += '/';
        }
        return (isAbsolute ? '/' : '') + path;
      },dirname:function (path) {
        var result = PATH.splitPath(path),
            root = result[0],
            dir = result[1];
        if (!root && !dir) {
          // No dirname whatsoever
          return '.';
        }
        if (dir) {
          // It has a dirname, strip trailing slash
          dir = dir.substr(0, dir.length - 1);
        }
        return root + dir;
      },basename:function (path) {
        // EMSCRIPTEN return '/'' for '/', not an empty string
        if (path === '/') return '/';
        var lastSlash = path.lastIndexOf('/');
        if (lastSlash === -1) return path;
        return path.substr(lastSlash+1);
      },extname:function (path) {
        return PATH.splitPath(path)[3];
      },join:function () {
        var paths = Array.prototype.slice.call(arguments, 0);
        return PATH.normalize(paths.join('/'));
      },join2:function (l, r) {
        return PATH.normalize(l + '/' + r);
      },resolve:function () {
        var resolvedPath = '',
          resolvedAbsolute = false;
        for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
          var path = (i >= 0) ? arguments[i] : FS.cwd();
          // Skip empty and invalid entries
          if (typeof path !== 'string') {
            throw new TypeError('Arguments to path.resolve must be strings');
          } else if (!path) {
            continue;
          }
          resolvedPath = path + '/' + resolvedPath;
          resolvedAbsolute = path.charAt(0) === '/';
        }
        // At this point the path should be resolved to a full absolute path, but
        // handle relative paths to be safe (might happen when process.cwd() fails)
        resolvedPath = PATH.normalizeArray(resolvedPath.split('/').filter(function(p) {
          return !!p;
        }), !resolvedAbsolute).join('/');
        return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
      },relative:function (from, to) {
        from = PATH.resolve(from).substr(1);
        to = PATH.resolve(to).substr(1);
        function trim(arr) {
          var start = 0;
          for (; start < arr.length; start++) {
            if (arr[start] !== '') break;
          }
          var end = arr.length - 1;
          for (; end >= 0; end--) {
            if (arr[end] !== '') break;
          }
          if (start > end) return [];
          return arr.slice(start, end - start + 1);
        }
        var fromParts = trim(from.split('/'));
        var toParts = trim(to.split('/'));
        var length = Math.min(fromParts.length, toParts.length);
        var samePartsLength = length;
        for (var i = 0; i < length; i++) {
          if (fromParts[i] !== toParts[i]) {
            samePartsLength = i;
            break;
          }
        }
        var outputParts = [];
        for (var i = samePartsLength; i < fromParts.length; i++) {
          outputParts.push('..');
        }
        outputParts = outputParts.concat(toParts.slice(samePartsLength));
        return outputParts.join('/');
      }};var Browser={mainLoop:{scheduler:null,shouldPause:false,paused:false,queue:[],pause:function () {
          Browser.mainLoop.shouldPause = true;
        },resume:function () {
          if (Browser.mainLoop.paused) {
            Browser.mainLoop.paused = false;
            Browser.mainLoop.scheduler();
          }
          Browser.mainLoop.shouldPause = false;
        },updateStatus:function () {
          if (Module['setStatus']) {
            var message = Module['statusMessage'] || 'Please wait...';
            var remaining = Browser.mainLoop.remainingBlockers;
            var expected = Browser.mainLoop.expectedBlockers;
            if (remaining) {
              if (remaining < expected) {
                Module['setStatus'](message + ' (' + (expected - remaining) + '/' + expected + ')');
              } else {
                Module['setStatus'](message);
              }
            } else {
              Module['setStatus']('');
            }
          }
        }},isFullScreen:false,pointerLock:false,moduleContextCreatedCallbacks:[],workers:[],init:function () {
        if (!Module["preloadPlugins"]) Module["preloadPlugins"] = []; // needs to exist even in workers
        if (Browser.initted || ENVIRONMENT_IS_WORKER) return;
        Browser.initted = true;
        try {
          new Blob();
          Browser.hasBlobConstructor = true;
        } catch(e) {
          Browser.hasBlobConstructor = false;
          console.log("warning: no blob constructor, cannot create blobs with mimetypes");
        }
        Browser.BlobBuilder = typeof MozBlobBuilder != "undefined" ? MozBlobBuilder : (typeof WebKitBlobBuilder != "undefined" ? WebKitBlobBuilder : (!Browser.hasBlobConstructor ? console.log("warning: no BlobBuilder") : null));
        Browser.URLObject = typeof window != "undefined" ? (window.URL ? window.URL : window.webkitURL) : undefined;
        if (!Module.noImageDecoding && typeof Browser.URLObject === 'undefined') {
          console.log("warning: Browser does not support creating object URLs. Built-in browser image decoding will not be available.");
          Module.noImageDecoding = true;
        }
        // Support for plugins that can process preloaded files. You can add more of these to
        // your app by creating and appending to Module.preloadPlugins.
        //
        // Each plugin is asked if it can handle a file based on the file's name. If it can,
        // it is given the file's raw data. When it is done, it calls a callback with the file's
        // (possibly modified) data. For example, a plugin might decompress a file, or it
        // might create some side data structure for use later (like an Image element, etc.).
        var imagePlugin = {};
        imagePlugin['canHandle'] = function imagePlugin_canHandle(name) {
          return !Module.noImageDecoding && /\.(jpg|jpeg|png|bmp)$/i.test(name);
        };
        imagePlugin['handle'] = function imagePlugin_handle(byteArray, name, onload, onerror) {
          var b = null;
          if (Browser.hasBlobConstructor) {
            try {
              b = new Blob([byteArray], { type: Browser.getMimetype(name) });
              if (b.size !== byteArray.length) { // Safari bug #118630
                // Safari's Blob can only take an ArrayBuffer
                b = new Blob([(new Uint8Array(byteArray)).buffer], { type: Browser.getMimetype(name) });
              }
            } catch(e) {
              Runtime.warnOnce('Blob constructor present but fails: ' + e + '; falling back to blob builder');
            }
          }
          if (!b) {
            var bb = new Browser.BlobBuilder();
            bb.append((new Uint8Array(byteArray)).buffer); // we need to pass a buffer, and must copy the array to get the right data range
            b = bb.getBlob();
          }
          var url = Browser.URLObject.createObjectURL(b);
          var img = new Image();
          img.onload = function img_onload() {
            assert(img.complete, 'Image ' + name + ' could not be decoded');
            var canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            var ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            Module["preloadedImages"][name] = canvas;
            Browser.URLObject.revokeObjectURL(url);
            if (onload) onload(byteArray);
          };
          img.onerror = function img_onerror(event) {
            console.log('Image ' + url + ' could not be decoded');
            if (onerror) onerror();
          };
          img.src = url;
        };
        Module['preloadPlugins'].push(imagePlugin);
        var audioPlugin = {};
        audioPlugin['canHandle'] = function audioPlugin_canHandle(name) {
          return !Module.noAudioDecoding && name.substr(-4) in { '.ogg': 1, '.wav': 1, '.mp3': 1 };
        };
        audioPlugin['handle'] = function audioPlugin_handle(byteArray, name, onload, onerror) {
          var done = false;
          function finish(audio) {
            if (done) return;
            done = true;
            Module["preloadedAudios"][name] = audio;
            if (onload) onload(byteArray);
          }
          function fail() {
            if (done) return;
            done = true;
            Module["preloadedAudios"][name] = new Audio(); // empty shim
            if (onerror) onerror();
          }
          if (Browser.hasBlobConstructor) {
            try {
              var b = new Blob([byteArray], { type: Browser.getMimetype(name) });
            } catch(e) {
              return fail();
            }
            var url = Browser.URLObject.createObjectURL(b); // XXX we never revoke this!
            var audio = new Audio();
            audio.addEventListener('canplaythrough', function() { finish(audio) }, false); // use addEventListener due to chromium bug 124926
            audio.onerror = function audio_onerror(event) {
              if (done) return;
              console.log('warning: browser could not fully decode audio ' + name + ', trying slower base64 approach');
              function encode64(data) {
                var BASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
                var PAD = '=';
                var ret = '';
                var leftchar = 0;
                var leftbits = 0;
                for (var i = 0; i < data.length; i++) {
                  leftchar = (leftchar << 8) | data[i];
                  leftbits += 8;
                  while (leftbits >= 6) {
                    var curr = (leftchar >> (leftbits-6)) & 0x3f;
                    leftbits -= 6;
                    ret += BASE[curr];
                  }
                }
                if (leftbits == 2) {
                  ret += BASE[(leftchar&3) << 4];
                  ret += PAD + PAD;
                } else if (leftbits == 4) {
                  ret += BASE[(leftchar&0xf) << 2];
                  ret += PAD;
                }
                return ret;
              }
              audio.src = 'data:audio/x-' + name.substr(-3) + ';base64,' + encode64(byteArray);
              finish(audio); // we don't wait for confirmation this worked - but it's worth trying
            };
            audio.src = url;
            // workaround for chrome bug 124926 - we do not always get oncanplaythrough or onerror
            Browser.safeSetTimeout(function() {
              finish(audio); // try to use it even though it is not necessarily ready to play
            }, 10000);
          } else {
            return fail();
          }
        };
        Module['preloadPlugins'].push(audioPlugin);
        // Canvas event setup
        var canvas = Module['canvas'];
        canvas.requestPointerLock = canvas['requestPointerLock'] ||
                                    canvas['mozRequestPointerLock'] ||
                                    canvas['webkitRequestPointerLock'];
        canvas.exitPointerLock = document['exitPointerLock'] ||
                                 document['mozExitPointerLock'] ||
                                 document['webkitExitPointerLock'] ||
                                 function(){}; // no-op if function does not exist
        canvas.exitPointerLock = canvas.exitPointerLock.bind(document);
        function pointerLockChange() {
          Browser.pointerLock = document['pointerLockElement'] === canvas ||
                                document['mozPointerLockElement'] === canvas ||
                                document['webkitPointerLockElement'] === canvas;
        }
        document.addEventListener('pointerlockchange', pointerLockChange, false);
        document.addEventListener('mozpointerlockchange', pointerLockChange, false);
        document.addEventListener('webkitpointerlockchange', pointerLockChange, false);
        if (Module['elementPointerLock']) {
          canvas.addEventListener("click", function(ev) {
            if (!Browser.pointerLock && canvas.requestPointerLock) {
              canvas.requestPointerLock();
              ev.preventDefault();
            }
          }, false);
        }
      },createContext:function (canvas, useWebGL, setInModule, webGLContextAttributes) {
        var ctx;
        try {
          if (useWebGL) {
            var contextAttributes = {
              antialias: false,
              alpha: false
            };
            if (webGLContextAttributes) {
              for (var attribute in webGLContextAttributes) {
                contextAttributes[attribute] = webGLContextAttributes[attribute];
              }
            }
            ['experimental-webgl', 'webgl'].some(function(webglId) {
              return ctx = canvas.getContext(webglId, contextAttributes);
            });
          } else {
            ctx = canvas.getContext('2d');
          }
          if (!ctx) throw ':(';
        } catch (e) {
          Module.print('Could not create canvas - ' + e);
          return null;
        }
        if (useWebGL) {
          // Set the background of the WebGL canvas to black
          canvas.style.backgroundColor = "black";
          // Warn on context loss
          canvas.addEventListener('webglcontextlost', function(event) {
            alert('WebGL context lost. You will need to reload the page.');
          }, false);
        }
        if (setInModule) {
          Module.ctx = ctx;
          Module.useWebGL = useWebGL;
          Browser.moduleContextCreatedCallbacks.forEach(function(callback) { callback() });
          Browser.init();
        }
        return ctx;
      },destroyContext:function (canvas, useWebGL, setInModule) {},fullScreenHandlersInstalled:false,lockPointer:undefined,resizeCanvas:undefined,requestFullScreen:function (lockPointer, resizeCanvas) {
        Browser.lockPointer = lockPointer;
        Browser.resizeCanvas = resizeCanvas;
        if (typeof Browser.lockPointer === 'undefined') Browser.lockPointer = true;
        if (typeof Browser.resizeCanvas === 'undefined') Browser.resizeCanvas = false;
        var canvas = Module['canvas'];
        function fullScreenChange() {
          Browser.isFullScreen = false;
          if ((document['webkitFullScreenElement'] || document['webkitFullscreenElement'] ||
               document['mozFullScreenElement'] || document['mozFullscreenElement'] ||
               document['fullScreenElement'] || document['fullscreenElement']) === canvas) {
            canvas.cancelFullScreen = document['cancelFullScreen'] ||
                                      document['mozCancelFullScreen'] ||
                                      document['webkitCancelFullScreen'];
            canvas.cancelFullScreen = canvas.cancelFullScreen.bind(document);
            if (Browser.lockPointer) canvas.requestPointerLock();
            Browser.isFullScreen = true;
            if (Browser.resizeCanvas) Browser.setFullScreenCanvasSize();
          } else if (Browser.resizeCanvas){
            Browser.setWindowedCanvasSize();
          }
          if (Module['onFullScreen']) Module['onFullScreen'](Browser.isFullScreen);
        }
        if (!Browser.fullScreenHandlersInstalled) {
          Browser.fullScreenHandlersInstalled = true;
          document.addEventListener('fullscreenchange', fullScreenChange, false);
          document.addEventListener('mozfullscreenchange', fullScreenChange, false);
          document.addEventListener('webkitfullscreenchange', fullScreenChange, false);
        }
        canvas.requestFullScreen = canvas['requestFullScreen'] ||
                                   canvas['mozRequestFullScreen'] ||
                                   (canvas['webkitRequestFullScreen'] ? function() { canvas['webkitRequestFullScreen'](Element['ALLOW_KEYBOARD_INPUT']) } : null);
        canvas.requestFullScreen();
      },requestAnimationFrame:function requestAnimationFrame(func) {
        if (typeof window === 'undefined') { // Provide fallback to setTimeout if window is undefined (e.g. in Node.js)
          setTimeout(func, 1000/60);
        } else {
          if (!window.requestAnimationFrame) {
            window.requestAnimationFrame = window['requestAnimationFrame'] ||
                                           window['mozRequestAnimationFrame'] ||
                                           window['webkitRequestAnimationFrame'] ||
                                           window['msRequestAnimationFrame'] ||
                                           window['oRequestAnimationFrame'] ||
                                           window['setTimeout'];
          }
          window.requestAnimationFrame(func);
        }
      },safeCallback:function (func) {
        return function() {
          if (!ABORT) return func.apply(null, arguments);
        };
      },safeRequestAnimationFrame:function (func) {
        return Browser.requestAnimationFrame(function() {
          if (!ABORT) func();
        });
      },safeSetTimeout:function (func, timeout) {
        return setTimeout(function() {
          if (!ABORT) func();
        }, timeout);
      },safeSetInterval:function (func, timeout) {
        return setInterval(function() {
          if (!ABORT) func();
        }, timeout);
      },getMimetype:function (name) {
        return {
          'jpg': 'image/jpeg',
          'jpeg': 'image/jpeg',
          'png': 'image/png',
          'bmp': 'image/bmp',
          'ogg': 'audio/ogg',
          'wav': 'audio/wav',
          'mp3': 'audio/mpeg'
        }[name.substr(name.lastIndexOf('.')+1)];
      },getUserMedia:function (func) {
        if(!window.getUserMedia) {
          window.getUserMedia = navigator['getUserMedia'] ||
                                navigator['mozGetUserMedia'];
        }
        window.getUserMedia(func);
      },getMovementX:function (event) {
        return event['movementX'] ||
               event['mozMovementX'] ||
               event['webkitMovementX'] ||
               0;
      },getMovementY:function (event) {
        return event['movementY'] ||
               event['mozMovementY'] ||
               event['webkitMovementY'] ||
               0;
      },mouseX:0,mouseY:0,mouseMovementX:0,mouseMovementY:0,calculateMouseEvent:function (event) { // event should be mousemove, mousedown or mouseup
        if (Browser.pointerLock) {
          // When the pointer is locked, calculate the coordinates
          // based on the movement of the mouse.
          // Workaround for Firefox bug 764498
          if (event.type != 'mousemove' &&
              ('mozMovementX' in event)) {
            Browser.mouseMovementX = Browser.mouseMovementY = 0;
          } else {
            Browser.mouseMovementX = Browser.getMovementX(event);
            Browser.mouseMovementY = Browser.getMovementY(event);
          }
          // check if SDL is available
          if (typeof SDL != "undefined") {
          	Browser.mouseX = SDL.mouseX + Browser.mouseMovementX;
          	Browser.mouseY = SDL.mouseY + Browser.mouseMovementY;
          } else {
          	// just add the mouse delta to the current absolut mouse position
          	// FIXME: ideally this should be clamped against the canvas size and zero
          	Browser.mouseX += Browser.mouseMovementX;
          	Browser.mouseY += Browser.mouseMovementY;
          }        
        } else {
          // Otherwise, calculate the movement based on the changes
          // in the coordinates.
          var rect = Module["canvas"].getBoundingClientRect();
          var x, y;
          if (event.type == 'touchstart' ||
              event.type == 'touchend' ||
              event.type == 'touchmove') {
            var t = event.touches.item(0);
            if (t) {
              x = t.pageX - (window.scrollX + rect.left);
              y = t.pageY - (window.scrollY + rect.top);
            } else {
              return;
            }
          } else {
            x = event.pageX - (window.scrollX + rect.left);
            y = event.pageY - (window.scrollY + rect.top);
          }
          // the canvas might be CSS-scaled compared to its backbuffer;
          // SDL-using content will want mouse coordinates in terms
          // of backbuffer units.
          var cw = Module["canvas"].width;
          var ch = Module["canvas"].height;
          x = x * (cw / rect.width);
          y = y * (ch / rect.height);
          Browser.mouseMovementX = x - Browser.mouseX;
          Browser.mouseMovementY = y - Browser.mouseY;
          Browser.mouseX = x;
          Browser.mouseY = y;
        }
      },xhrLoad:function (url, onload, onerror) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'arraybuffer';
        xhr.onload = function xhr_onload() {
          if (xhr.status == 200 || (xhr.status == 0 && xhr.response)) { // file URLs can return 0
            onload(xhr.response);
          } else {
            onerror();
          }
        };
        xhr.onerror = onerror;
        xhr.send(null);
      },asyncLoad:function (url, onload, onerror, noRunDep) {
        Browser.xhrLoad(url, function(arrayBuffer) {
          assert(arrayBuffer, 'Loading data file "' + url + '" failed (no arrayBuffer).');
          onload(new Uint8Array(arrayBuffer));
          if (!noRunDep) removeRunDependency('al ' + url);
        }, function(event) {
          if (onerror) {
            onerror();
          } else {
            throw 'Loading data file "' + url + '" failed.';
          }
        });
        if (!noRunDep) addRunDependency('al ' + url);
      },resizeListeners:[],updateResizeListeners:function () {
        var canvas = Module['canvas'];
        Browser.resizeListeners.forEach(function(listener) {
          listener(canvas.width, canvas.height);
        });
      },setCanvasSize:function (width, height, noUpdates) {
        var canvas = Module['canvas'];
        canvas.width = width;
        canvas.height = height;
        if (!noUpdates) Browser.updateResizeListeners();
      },windowedWidth:0,windowedHeight:0,setFullScreenCanvasSize:function () {
        var canvas = Module['canvas'];
        this.windowedWidth = canvas.width;
        this.windowedHeight = canvas.height;
        canvas.width = screen.width;
        canvas.height = screen.height;
        // check if SDL is available   
        if (typeof SDL != "undefined") {
        	var flags = HEAPU32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)];
        	flags = flags | 0x00800000; // set SDL_FULLSCREEN flag
        	HEAP32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)]=flags
        }
        Browser.updateResizeListeners();
      },setWindowedCanvasSize:function () {
        var canvas = Module['canvas'];
        canvas.width = this.windowedWidth;
        canvas.height = this.windowedHeight;
        // check if SDL is available       
        if (typeof SDL != "undefined") {
        	var flags = HEAPU32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)];
        	flags = flags & ~0x00800000; // clear SDL_FULLSCREEN flag
        	HEAP32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)]=flags
        }
        Browser.updateResizeListeners();
      }};
___errno_state = Runtime.staticAlloc(4); HEAP32[((___errno_state)>>2)]=0;
Module["requestFullScreen"] = function Module_requestFullScreen(lockPointer, resizeCanvas) { Browser.requestFullScreen(lockPointer, resizeCanvas) };
  Module["requestAnimationFrame"] = function Module_requestAnimationFrame(func) { Browser.requestAnimationFrame(func) };
  Module["setCanvasSize"] = function Module_setCanvasSize(width, height, noUpdates) { Browser.setCanvasSize(width, height, noUpdates) };
  Module["pauseMainLoop"] = function Module_pauseMainLoop() { Browser.mainLoop.pause() };
  Module["resumeMainLoop"] = function Module_resumeMainLoop() { Browser.mainLoop.resume() };
  Module["getUserMedia"] = function Module_getUserMedia() { Browser.getUserMedia() }
FS.staticInit();__ATINIT__.unshift({ func: function() { if (!Module["noFSInit"] && !FS.init.initialized) FS.init() } });__ATMAIN__.push({ func: function() { FS.ignorePermissions = false } });__ATEXIT__.push({ func: function() { FS.quit() } });Module["FS_createFolder"] = FS.createFolder;Module["FS_createPath"] = FS.createPath;Module["FS_createDataFile"] = FS.createDataFile;Module["FS_createPreloadedFile"] = FS.createPreloadedFile;Module["FS_createLazyFile"] = FS.createLazyFile;Module["FS_createLink"] = FS.createLink;Module["FS_createDevice"] = FS.createDevice;
__ATINIT__.unshift({ func: function() { TTY.init() } });__ATEXIT__.push({ func: function() { TTY.shutdown() } });TTY.utf8 = new Runtime.UTF8Processor();
if (ENVIRONMENT_IS_NODE) { var fs = require("fs"); NODEFS.staticInit(); }
STACK_BASE = STACKTOP = Runtime.alignMemory(STATICTOP);
staticSealed = true; // seal the static portion of memory
STACK_MAX = STACK_BASE + 5242880;
DYNAMIC_BASE = DYNAMICTOP = Runtime.alignMemory(STACK_MAX);
assert(DYNAMIC_BASE < TOTAL_MEMORY); // Stack must fit in TOTAL_MEMORY; allocations from here on may enlarge TOTAL_MEMORY
var Math_min = Math.min;
function invoke_viiiii(index,a1,a2,a3,a4,a5) {
  try {
    Module["dynCall_viiiii"](index,a1,a2,a3,a4,a5);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_vi(index,a1) {
  try {
    Module["dynCall_vi"](index,a1);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_ii(index,a1) {
  try {
    return Module["dynCall_ii"](index,a1);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_v(index) {
  try {
    Module["dynCall_v"](index);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_iii(index,a1,a2) {
  try {
    return Module["dynCall_iii"](index,a1,a2);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function asmPrintInt(x, y) {
  Module.print('int ' + x + ',' + y);// + ' ' + new Error().stack);
}
function asmPrintFloat(x, y) {
  Module.print('float ' + x + ',' + y);// + ' ' + new Error().stack);
}
// EMSCRIPTEN_START_ASM
var asm=(function(global,env,buffer){"use asm";var a=new global.Int8Array(buffer);var b=new global.Int16Array(buffer);var c=new global.Int32Array(buffer);var d=new global.Uint8Array(buffer);var e=new global.Uint16Array(buffer);var f=new global.Uint32Array(buffer);var g=new global.Float32Array(buffer);var h=new global.Float64Array(buffer);var i=env.STACKTOP|0;var j=env.STACK_MAX|0;var k=env.tempDoublePtr|0;var l=env.ABORT|0;var m=+env.NaN;var n=+env.Infinity;var o=0;var p=0;var q=0;var r=0;var s=0,t=0,u=0,v=0,w=0.0,x=0,y=0,z=0,A=0.0;var B=0;var C=0;var D=0;var E=0;var F=0;var G=0;var H=0;var I=0;var J=0;var K=0;var L=global.Math.floor;var M=global.Math.abs;var N=global.Math.sqrt;var O=global.Math.pow;var P=global.Math.cos;var Q=global.Math.sin;var R=global.Math.tan;var S=global.Math.acos;var T=global.Math.asin;var U=global.Math.atan;var V=global.Math.atan2;var W=global.Math.exp;var X=global.Math.log;var Y=global.Math.ceil;var Z=global.Math.imul;var _=env.abort;var $=env.assert;var aa=env.asmPrintInt;var ab=env.asmPrintFloat;var ac=env.min;var ad=env.invoke_viiiii;var ae=env.invoke_vi;var af=env.invoke_ii;var ag=env.invoke_v;var ah=env.invoke_iii;var ai=env._llvm_lifetime_end;var aj=env._sysconf;var ak=env._sbrk;var al=env.___setErrNo;var am=env.___errno_location;var an=env._llvm_lifetime_start;var ao=env._abort;var ap=env._time;var aq=env._fflush;var ar=0.0;
// EMSCRIPTEN_START_FUNCS
function ax(a){a=a|0;var b=0;b=i;i=i+a|0;i=i+7&-8;return b|0}function ay(){return i|0}function az(a){a=a|0;i=a}function aA(a,b){a=a|0;b=b|0;if((o|0)==0){o=a;p=b}}function aB(b){b=b|0;a[k]=a[b];a[k+1|0]=a[b+1|0];a[k+2|0]=a[b+2|0];a[k+3|0]=a[b+3|0]}function aC(b){b=b|0;a[k]=a[b];a[k+1|0]=a[b+1|0];a[k+2|0]=a[b+2|0];a[k+3|0]=a[b+3|0];a[k+4|0]=a[b+4|0];a[k+5|0]=a[b+5|0];a[k+6|0]=a[b+6|0];a[k+7|0]=a[b+7|0]}function aD(a){a=a|0;B=a}function aE(a){a=a|0;C=a}function aF(a){a=a|0;D=a}function aG(a){a=a|0;E=a}function aH(a){a=a|0;F=a}function aI(a){a=a|0;G=a}function aJ(a){a=a|0;H=a}function aK(a){a=a|0;I=a}function aL(a){a=a|0;J=a}function aM(a){a=a|0;K=a}function aN(){}function aO(b,e,f,g){b=b|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0;L1:do{if(e>>>0>3>>>0){if((a[b]|0)!=0){h=19;break}if((a[b+1|0]|0)!=0){h=19;break}i=a[b+2|0]|0;if((i&255)>>>0>=2>>>0){h=19;break}L6:do{if((e|0)!=3){j=2;k=b+3|0;l=3;m=-3;n=i;while(1){if((n<<24>>24|0)==0){o=j+1|0}else if((n<<24>>24|0)==1){if(j>>>0>1>>>0){p=k;q=0;r=0;s=0;t=l;break}else{o=0}}else{o=0}u=l+1|0;if((u|0)==(e|0)){break L6}v=~l;w=a[k]|0;j=o;k=k+1|0;l=u;m=v;n=w}while(1){n=a[p]|0;k=t+1|0;j=n<<24>>24!=0;x=(j&1^1)+s|0;y=n<<24>>24==3&(x|0)==2?1:r;if(n<<24>>24==1&x>>>0>1>>>0){h=14;break}if(j){z=x>>>0>2>>>0?1:q;A=0}else{z=q;A=x}if((k|0)==(e|0)){h=18;break}else{p=p+1|0;q=z;r=y;s=A;t=k}}if((h|0)==14){k=m+t-x|0;c[f+12>>2]=k;B=q;C=y;D=x-(x>>>0<3>>>0?x:3)|0;E=l;F=k;break L1}else if((h|0)==18){k=m+e-A|0;c[f+12>>2]=k;B=z;C=y;D=A;E=l;F=k;break L1}}}while(0);c[g>>2]=e;G=1;return G|0}else{h=19}}while(0);if((h|0)==19){c[f+12>>2]=e;B=0;C=1;D=0;E=0;F=e}e=b+E|0;b=f|0;c[b>>2]=e;c[f+4>>2]=e;c[f+8>>2]=0;c[f+16>>2]=0;e=f+12|0;c[g>>2]=D+E+F;if((B|0)!=0){G=1;return G|0}if((C|0)==0){G=0;return G|0}C=c[b>>2]|0;b=C;B=C;C=0;F=c[e>>2]|0;L35:while(1){H=B;E=C;D=F;while(1){I=D-1|0;if((D|0)==0){h=31;break L35}J=a[H]|0;if((E|0)!=2){K=E;break}if(J<<24>>24!=3){h=29;break}if((I|0)==0){G=1;h=36;break L35}g=H+1|0;if((d[g]|0)>>>0>3>>>0){G=1;h=37;break L35}else{H=g;E=0;D=I}}if((h|0)==29){h=0;if((J&255)>>>0<3>>>0){G=1;h=38;break}else{K=2}}a[b]=J;b=b+1|0;B=H+1|0;C=J<<24>>24==0?K+1|0:0;F=I}if((h|0)==31){c[e>>2]=b-H+(c[e>>2]|0);G=0;return G|0}else if((h|0)==36){return G|0}else if((h|0)==37){return G|0}else if((h|0)==38){return G|0}return 0}function aP(e,f,g,h){e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0,al=0,am=0,an=0,ao=0,ap=0,aq=0,ar=0,as=0,at=0,au=0,av=0,aw=0;j=i;i=i+128|0;k=j|0;l=j+64|0;m=ck(e)|0;n=m>>>16;do{if(g>>>0<2>>>0){if((m|0)<0){o=1;break}if(m>>>0>201326591>>>0){p=4016+(m>>>26<<1)|0;q=64;break}if(m>>>0>16777215>>>0){p=3920+(m>>>22<<1)|0;q=64;break}if(m>>>0>2097151>>>0){p=3808+((m>>>18)-8<<1)|0;q=64;break}else{p=3744+(n<<1)|0;q=64;break}}else{if(g>>>0<4>>>0){if((m|0)<0){o=(n&16384|0)!=0?2:2082;break}if(m>>>0>268435455>>>0){p=3680+(m>>>26<<1)|0;q=64;break}if(m>>>0>33554431>>>0){p=3616+(m>>>23<<1)|0;q=64;break}else{p=3360+(m>>>18<<1)|0;q=64;break}}else{if(g>>>0<8>>>0){r=m>>>26;if((r-8|0)>>>0<56>>>0){p=3232+(r<<1)|0;q=64;break}p=2976+(m>>>22<<1)|0;q=64;break}if(g>>>0<17>>>0){p=2848+(m>>>26<<1)|0;q=64;break}r=m>>>29;if((r|0)!=0){p=2832+(r<<1)|0;q=64;break}p=2768+(m>>>24<<1)|0;q=64;break}}}while(0);do{if((q|0)==64){g=b[p>>1]|0;if(g<<16>>16==0){s=1}else{o=g&65535;break}i=j;return s|0}}while(0);p=o&31;g=m<<p;m=32-p|0;n=o>>>11;if(n>>>0>h>>>0){s=1;i=j;return s|0}r=o>>>5&63;do{if((n|0)==0){t=m;u=0}else{if((r|0)==0){v=m;w=g;x=0}else{do{if(m>>>0<r>>>0){if((cl(e,p)|0)==-1){s=1;i=j;return s|0}else{y=32;z=ck(e)|0;break}}else{y=m;z=g}}while(0);A=z>>>((32-r|0)>>>0);B=z<<r;C=1<<r-1;D=0;do{c[k+(D<<2)>>2]=(C&A|0)!=0?-1:1;C=C>>>1;D=D+1|0;}while((C|0)!=0);v=y-r|0;w=B;x=D}C=r>>>0<3>>>0;L107:do{if(x>>>0<n>>>0){A=x;E=o>>>0>22527>>>0&C&1;F=w;G=v;L109:while(1){if(G>>>0<16>>>0){if((cl(e,32-G|0)|0)==-1){s=1;q=169;break}H=32;I=ck(e)|0}else{H=G;I=F}do{if((I|0)<0){J=0;q=95}else{if(I>>>0>1073741823>>>0){J=1;q=95;break}if(I>>>0>536870911>>>0){J=2;q=95;break}if(I>>>0>268435455>>>0){J=3;q=95;break}if(I>>>0>134217727>>>0){J=4;q=95;break}if(I>>>0>67108863>>>0){J=5;q=95;break}if(I>>>0>33554431>>>0){J=6;q=95;break}if(I>>>0>16777215>>>0){J=7;q=95;break}if(I>>>0>8388607>>>0){J=8;q=95;break}if(I>>>0>4194303>>>0){J=9;q=95;break}if(I>>>0>2097151>>>0){J=10;q=95;break}if(I>>>0>1048575>>>0){J=11;q=95;break}if(I>>>0>524287>>>0){J=12;q=95;break}if(I>>>0>262143>>>0){J=13;q=95;break}if(I>>>0>131071>>>0){K=(E|0)!=0?E:4;L=14;M=I<<15;N=H-15|0;q=98;break}if(I>>>0<65536>>>0){s=1;q=170;break L109}O=(E|0)!=0?E:1;P=H-16|0;Q=I<<16;R=12;S=O;T=(O|0)==0;U=15<<O;q=99}}while(0);if((q|0)==95){q=0;O=J+1|0;K=E;L=J;M=I<<O;N=H-O|0;q=98}if((q|0)==98){q=0;O=(E|0)==0;V=L<<E;if((K|0)==0){W=N;X=M;Y=V;Z=E;_=O}else{P=N;Q=M;R=K;S=E;T=O;U=V;q=99}}if((q|0)==99){q=0;if(P>>>0<R>>>0){if((cl(e,32-P|0)|0)==-1){s=1;q=171;break}$=32;aa=ck(e)|0}else{$=P;aa=Q}W=$-R|0;X=aa<<R;Y=(aa>>>((32-R|0)>>>0))+U|0;Z=S;_=T}V=(A|0)==(r|0)&C?Y+2|0:Y;O=(V+2|0)>>>1;ab=_?1:Z;c[k+(A<<2)>>2]=(V&1|0)==0?O:-O|0;V=A+1|0;if(V>>>0<n>>>0){A=V;E=((O|0)>(3<<ab-1|0)&ab>>>0<6>>>0&1)+ab|0;F=X;G=W}else{ac=X;ad=W;break L107}}if((q|0)==169){i=j;return s|0}else if((q|0)==170){i=j;return s|0}else if((q|0)==171){i=j;return s|0}}else{ac=w;ad=v}}while(0);if(n>>>0<h>>>0){do{if(ad>>>0<9>>>0){if((cl(e,32-ad|0)|0)==-1){s=1;i=j;return s|0}else{ae=32;af=ck(e)|0;break}}else{ae=ad;af=ac}}while(0);C=af>>>23;L158:do{if((h|0)==4){if((af|0)<0){ag=1;break}if((n|0)==3){ag=17;break}if(af>>>0>1073741823>>>0){ag=18;break}if((n|0)==2){ag=34;break}ag=af>>>0>536870911>>>0?35:51}else{L160:do{switch(n|0){case 1:{if(af>>>0>268435455>>>0){ah=488+(af>>>27)|0;break L160}ah=456+C|0;break};case 2:{ah=392+(af>>>26)|0;break};case 3:{ah=328+(af>>>26)|0;break};case 4:{ah=296+(af>>>27)|0;break};case 5:{ah=264+(af>>>27)|0;break};case 6:{ah=200+(af>>>26)|0;break};case 7:{ah=136+(af>>>26)|0;break};case 8:{ah=72+(af>>>26)|0;break};case 9:{ah=8+(af>>>26)|0;break};case 10:{ah=568+(af>>>27)|0;break};case 11:{ah=552+(af>>>28)|0;break};case 12:{ah=536+(af>>>28)|0;break};case 13:{ah=528+(af>>>29)|0;break};case 14:{ah=520+(af>>>30)|0;break};default:{ag=af>>31&16|1;break L158}}}while(0);D=a[ah]|0;if(D<<24>>24==0){s=1}else{ag=D&255;break}i=j;return s|0}}while(0);C=ag&15;ai=ae-C|0;aj=af<<C;ak=ag>>>4&15}else{ai=ad;aj=ac;ak=0}C=n-1|0;D=(C|0)==0;if(D){c[f+(ak<<2)>>2]=c[k+(C<<2)>>2];t=ai;u=1<<ak;break}else{al=0;am=ak;an=aj;ao=ai}while(1){if((am|0)==0){c[l+(al<<2)>>2]=1;ap=ao;aq=an;ar=0}else{if(ao>>>0<11>>>0){if((cl(e,32-ao|0)|0)==-1){s=1;q=176;break}as=32;at=ck(e)|0}else{as=ao;at=an}switch(am|0){case 1:{au=832+(at>>>31)|0;q=157;break};case 2:{au=824+(at>>>30)|0;q=157;break};case 3:{au=816+(at>>>30)|0;q=157;break};case 4:{au=808+(at>>>29)|0;q=157;break};case 5:{au=800+(at>>>29)|0;q=157;break};case 6:{au=792+(at>>>29)|0;q=157;break};default:{do{if(at>>>0>536870911>>>0){av=at>>>29<<4^115}else{if(at>>>0>268435455>>>0){av=116;break}if(at>>>0>134217727>>>0){av=133;break}if(at>>>0>67108863>>>0){av=150;break}if(at>>>0>33554431>>>0){av=167;break}if(at>>>0>16777215>>>0){av=184;break}if(at>>>0>8388607>>>0){av=201;break}if(at>>>0>4194303>>>0){av=218;break}av=at>>>0<2097152>>>0?0:235}}while(0);aw=(av>>>4&15)>>>0>am>>>0?0:av}}if((q|0)==157){q=0;aw=d[au]|0}if((aw|0)==0){s=1;q=177;break}B=aw&15;G=aw>>>4&15;c[l+(al<<2)>>2]=G+1;ap=as-B|0;aq=at<<B;ar=am-G|0}G=al+1|0;if(G>>>0<C>>>0){al=G;am=ar;an=aq;ao=ap}else{q=162;break}}if((q|0)==162){c[f+(ar<<2)>>2]=c[k+(C<<2)>>2];G=1<<ar;if(D){t=ap;u=G;break}B=ar;F=G;G=n-2|0;while(1){E=(c[l+(G<<2)>>2]|0)+B|0;A=1<<E|F;c[f+(E<<2)>>2]=c[k+(G<<2)>>2];if((G|0)==0){t=ap;u=A;break}else{B=E;F=A;G=G-1|0}}}else if((q|0)==176){i=j;return s|0}else if((q|0)==177){i=j;return s|0}}}while(0);if((cl(e,32-t|0)|0)!=0){s=1;i=j;return s|0}s=u<<16|n<<4;i=j;return s|0}function aQ(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0;e=c[b+4>>2]|0;f=c[b+8>>2]|0;if((d|0)==5|(d|0)==0){g=182}else{if((c[a+3384>>2]|0)==0){h=0}else{g=182}}if((g|0)==182){i=a+1220|0;j=0;while(1){k=ba(i,j)|0;l=j+1|0;if(l>>>0<16>>>0&(k|0)==0){j=l}else{h=k;break}}}j=a+1176|0;i=c[j>>2]|0;do{if((i|0)!=0){k=c[a+1212>>2]|0;l=0;m=0;n=0;while(1){if((c[k+(n*216|0)+196>>2]|0)!=0){o=l;p=m;q=n;break}r=n+1|0;s=m+1|0;t=(s|0)==(e|0);u=(t&1)+l|0;v=t?0:s;if(r>>>0<i>>>0){l=u;m=v;n=r}else{o=u;p=v;q=r;break}}if((q|0)==(i|0)){break}n=a+1212|0;m=c[n>>2]|0;l=Z(o,e)|0;if((p|0)!=0){k=a+1204|0;r=p;do{r=r-1|0;v=r+l|0;aR(m+(v*216|0)|0,b,o,r,d,h);c[m+(v*216|0)+196>>2]=1;c[k>>2]=(c[k>>2]|0)+1;}while((r|0)!=0)}r=p+1|0;if(r>>>0<e>>>0){k=a+1204|0;v=r;do{r=v+l|0;u=m+(r*216|0)+196|0;if((c[u>>2]|0)==0){aR(m+(r*216|0)|0,b,o,v,d,h);c[u>>2]=1;c[k>>2]=(c[k>>2]|0)+1}v=v+1|0;}while(v>>>0<e>>>0)}do{if((o|0)==0){w=0}else{if((e|0)==0){w=o;break}v=o-1|0;k=Z(v,e)|0;m=a+1204|0;l=-e|0;u=0;while(1){r=(c[n>>2]|0)+((u+k|0)*216|0)|0;s=v;while(1){aR(r,b,s,u,d,h);c[r+196>>2]=1;c[m>>2]=(c[m>>2]|0)+1;if((s|0)==0){break}else{r=r+(l*216|0)|0;s=s-1|0}}s=u+1|0;if(s>>>0<e>>>0){u=s}else{w=o;break}}}}while(0);u=w+1|0;if(u>>>0>=f>>>0){return 0}l=a+1204|0;if((e|0)==0){return 0}else{x=u}do{u=c[n>>2]|0;m=Z(x,e)|0;v=0;do{k=v+m|0;s=u+(k*216|0)+196|0;if((c[s>>2]|0)==0){aR(u+(k*216|0)|0,b,x,v,d,h);c[s>>2]=1;c[l>>2]=(c[l>>2]|0)+1}v=v+1|0;}while(v>>>0<e>>>0);x=x+1|0;}while(x>>>0<f>>>0);return 0}}while(0);if((d|0)==7|(d|0)==2){if((c[a+3384>>2]|0)==0|(h|0)==0){g=192}else{g=193}}else{if((h|0)==0){g=192}else{g=193}}if((g|0)==192){cD(c[b>>2]|0,-128|0,Z(e*384|0,f)|0)}else if((g|0)==193){g=c[b>>2]|0;b=Z(e*384|0,f)|0;cE(g|0,h|0,b)|0}b=c[j>>2]|0;c[a+1204>>2]=b;if((b|0)==0){return 0}b=a+1212|0;a=0;do{c[(c[b>>2]|0)+(a*216|0)+8>>2]=1;a=a+1|0;}while(a>>>0<(c[j>>2]|0)>>>0);return 0}function aR(b,e,f,g,h,j){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0,al=0,am=0,an=0,ao=0,ap=0,aq=0,ar=0,as=0,at=0,au=0,av=0,aw=0,ax=0,ay=0,az=0,aA=0,aB=0,aC=0,aD=0,aE=0,aF=0,aG=0,aH=0,aI=0,aJ=0,aK=0,aL=0,aM=0,aN=0,aO=0,aP=0,aQ=0,aR=0,aT=0,aU=0,aV=0,aW=0,aX=0,aY=0,aZ=0,a_=0,a$=0,a0=0,a1=0,a2=0,a3=0,a4=0,a5=0;k=i;i=i+456|0;l=k|0;m=k+384|0;n=k+448|0;o=n;p=i;i=i+24|0;q=c[e+4>>2]|0;r=c[e+8>>2]|0;cu(e,(Z(q,f)|0)+g|0);s=e|0;t=c[s>>2]|0;u=f<<4;v=g<<4;w=(Z(f<<8,q)|0)+v|0;c[b+20>>2]=40;c[b+8>>2]=0;c[b>>2]=6;c[b+12>>2]=0;c[b+16>>2]=0;c[b+24>>2]=0;do{if((h|0)==7|(h|0)==2){cD(l|0,0,384)}else{c[n>>2]=0;c[p+4>>2]=q;c[p+8>>2]=r;c[p>>2]=j;x=l|0;if((j|0)==0){cD(x|0,0,384);break}bW(x,o,p,v,u,0,0,16,16);bj(e,x);i=k;return}}while(0);u=m;cD(u|0,0,64);do{if((f|0)==0){y=0;z=0;A=0;B=0;C=0;D=0;E=0}else{if((c[b+((-q|0)*216|0)+196>>2]|0)==0){y=0;z=0;A=0;B=0;C=0;D=0;E=0;break}v=w-(q<<4)|0;p=v|1;o=v|3;j=(d[t+p|0]|0)+(d[t+v|0]|0)+(d[t+(p+1)|0]|0)+(d[t+o|0]|0)|0;p=v|7;n=(d[t+(o+2)|0]|0)+(d[t+(o+1)|0]|0)+(d[t+(o+3)|0]|0)+(d[t+p|0]|0)|0;o=(d[t+(p+2)|0]|0)+(d[t+(p+1)|0]|0)+(d[t+(p+3)|0]|0)+(d[t+(p+4)|0]|0)|0;h=(d[t+(p+6)|0]|0)+(d[t+(p+5)|0]|0)+(d[t+(p+7)|0]|0)+(d[t+(v|15)|0]|0)|0;v=n+j|0;p=o+v+h|0;c[m>>2]=p;x=v-o-h|0;c[m+4>>2]=x;y=j;z=n;A=o;B=h;C=1;D=p;E=x}}while(0);do{if((r-1|0)==(f|0)){F=0;G=0;H=0;I=0;J=0;K=C;L=D;M=E}else{if((c[b+(q*216|0)+196>>2]|0)==0){F=0;G=0;H=0;I=0;J=0;K=C;L=D;M=E;break}x=w+(q<<8)|0;p=x|1;h=x|3;o=(d[t+p|0]|0)+(d[t+x|0]|0)+(d[t+(p+1)|0]|0)+(d[t+h|0]|0)|0;p=x|7;n=(d[t+(h+2)|0]|0)+(d[t+(h+1)|0]|0)+(d[t+(h+3)|0]|0)+(d[t+p|0]|0)|0;h=(d[t+(p+2)|0]|0)+(d[t+(p+1)|0]|0)+(d[t+(p+3)|0]|0)+(d[t+(p+4)|0]|0)|0;j=(d[t+(p+6)|0]|0)+(d[t+(p+5)|0]|0)+(d[t+(p+7)|0]|0)+(d[t+(x|15)|0]|0)|0;x=n+o|0;p=h+x+D+j|0;c[m>>2]=p;v=x-h-j+E|0;c[m+4>>2]=v;F=1;G=o;H=n;I=h;J=j;K=C+1|0;L=p;M=v}}while(0);do{if((g|0)==0){N=0;O=0;P=0;Q=0;R=K;S=0;T=0;U=L}else{if((c[b-216+196>>2]|0)==0){N=0;O=0;P=0;Q=0;R=K;S=0;T=0;U=L;break}E=w-1|0;D=q<<4;v=q<<5;p=q*48|0;j=(d[t+(E+D)|0]|0)+(d[t+E|0]|0)+(d[t+(E+v)|0]|0)+(d[t+(E+p)|0]|0)|0;h=q<<6;n=E+h|0;E=(d[t+(n+D)|0]|0)+(d[t+n|0]|0)+(d[t+(n+v)|0]|0)+(d[t+(n+p)|0]|0)|0;o=n+h|0;n=(d[t+(o+D)|0]|0)+(d[t+o|0]|0)+(d[t+(o+v)|0]|0)+(d[t+(o+p)|0]|0)|0;x=o+h|0;h=(d[t+(x+D)|0]|0)+(d[t+x|0]|0)+(d[t+(x+v)|0]|0)+(d[t+(x+p)|0]|0)|0;p=E+j|0;x=n+p+L+h|0;c[m>>2]=x;v=p-n-h|0;c[m+16>>2]=v;N=j;O=E;P=n;Q=h;R=K+1|0;S=1;T=v;U=x}}while(0);do{if((q-1|0)==(g|0)){V=240}else{if((c[b+412>>2]|0)==0){V=240;break}L=w+16|0;x=q<<4;v=q<<5;h=q*48|0;n=(d[t+(L+x)|0]|0)+(d[t+L|0]|0)+(d[t+(L+v)|0]|0)+(d[t+(L+h)|0]|0)|0;E=q<<6;j=L+E|0;L=(d[t+(j+x)|0]|0)+(d[t+j|0]|0)+(d[t+(j+v)|0]|0)+(d[t+(j+h)|0]|0)|0;p=j+E|0;j=(d[t+(p+x)|0]|0)+(d[t+p|0]|0)+(d[t+(p+v)|0]|0)+(d[t+(p+h)|0]|0)|0;D=p+E|0;E=(d[t+(D+x)|0]|0)+(d[t+D|0]|0)+(d[t+(D+v)|0]|0)+(d[t+(D+h)|0]|0)|0;h=R+1|0;D=S+1|0;v=L+n|0;x=j+v+U+E|0;c[m>>2]=x;p=m+16|0;o=v-j-E+T|0;c[p>>2]=o;v=(K|0)!=0;if(v|(S|0)==0){if(v){W=1;X=h;Y=D;_=o;$=x;V=244;break}else{aa=D;ab=h;ac=1;ad=o;ae=x;af=p;V=249;break}}else{c[m+4>>2]=P+Q+O+N-n-L-j-E>>5;aa=D;ab=h;ac=1;ad=o;ae=x;af=p;V=249;break}}}while(0);if((V|0)==240){if((K|0)==0){ag=S;ah=R;ai=0;aj=T;ak=U;V=245}else{W=0;X=R;Y=S;_=T;$=U;V=244}}if((V|0)==244){c[m+4>>2]=M>>K+3;ag=Y;ah=X;ai=W;aj=_;ak=$;V=245}do{if((V|0)==245){$=(ag|0)!=0;if(!($|(C|0)==0|(F|0)==0)){c[m+16>>2]=A+B+z+y-J-I-H-G>>5;al=ai;am=ah;an=ak;break}if(!$){al=ai;am=ah;an=ak;break}aa=ag;ab=ah;ac=ai;ad=aj;ae=ak;af=m+16|0;V=249}}while(0);if((V|0)==249){c[af>>2]=ad>>aa+3;al=ac;am=ab;an=ae}if((am|0)==1){c[m>>2]=an>>4}else if((am|0)==2){c[m>>2]=an>>5}else if((am|0)==3){c[m>>2]=(an*21|0)>>10}else{c[m>>2]=an>>6}an=m|0;aS(an);am=l|0;ae=0;ab=am;ac=an;while(1){aa=c[ac+((ae>>>2&3)<<2)>>2]|0;if((aa|0)<0){ao=0}else{ao=(aa|0)>255?-1:aa&255}a[ab]=ao;aa=ae+1|0;if(aa>>>0<256>>>0){ae=aa;ab=ab+1|0;ac=(aa&63|0)==0?ac+16|0:ac}else{break}}ac=Z(r,q)|0;r=(C|0)!=0;C=q<<3;ab=-C|0;ae=ab|1;ao=ae+1|0;aa=ab|3;ad=aa+1|0;af=aa+2|0;ak=aa+3|0;aj=ab|7;ai=m+4|0;ah=(F|0)!=0;F=q<<6;ag=F|1;$=ag+1|0;_=F|3;W=_+1|0;X=_+2|0;Y=_+3|0;K=F|7;M=(S|0)!=0;S=C-1|0;U=q<<4;T=U-1|0;R=T+C|0;t=T+U|0;w=t+C|0;b=t+U|0;p=b+C|0;x=m+16|0;m=(al|0)!=0;al=C+8|0;o=U|8;h=o+C|0;D=o+U|0;E=D+C|0;j=D+U|0;U=j+C|0;C=M^1;L=m^1;n=r^1;v=ah^1;ap=ac<<6;aq=0;ar=(c[s>>2]|0)+((Z(f<<6,q)|0)+(g<<3)+(ac<<8))|0;ac=B;B=A;A=z;z=y;y=J;J=I;I=H;H=G;G=Q;Q=P;P=O;O=N;while(1){cD(u|0,0,64);if(r){N=(d[ar+ae|0]|0)+(d[ar+ab|0]|0)|0;g=(d[ar+aa|0]|0)+(d[ar+ao|0]|0)|0;q=(d[ar+af|0]|0)+(d[ar+ad|0]|0)|0;f=(d[ar+aj|0]|0)+(d[ar+ak|0]|0)|0;s=g+N|0;as=q+s+f|0;c[an>>2]=as;at=s-q-f|0;c[ai>>2]=at;au=N;av=g;aw=q;ax=f;ay=1;az=as;aA=at}else{au=z;av=A;aw=B;ax=ac;ay=0;az=0;aA=0}if(ah){at=(d[ar+ag|0]|0)+(d[ar+F|0]|0)|0;as=(d[ar+_|0]|0)+(d[ar+$|0]|0)|0;f=(d[ar+X|0]|0)+(d[ar+W|0]|0)|0;q=(d[ar+K|0]|0)+(d[ar+Y|0]|0)|0;g=as+at|0;N=f+g+az+q|0;c[an>>2]=N;s=g-f-q+aA|0;c[ai>>2]=s;aB=at;aC=as;aD=f;aE=q;aF=ay+1|0;aG=N;aH=s}else{aB=H;aC=I;aD=J;aE=y;aF=ay;aG=az;aH=aA}if(M){s=(d[ar+S|0]|0)+(d[ar-1|0]|0)|0;N=(d[ar+R|0]|0)+(d[ar+T|0]|0)|0;q=(d[ar+w|0]|0)+(d[ar+t|0]|0)|0;f=(d[ar+p|0]|0)+(d[ar+b|0]|0)|0;as=N+s|0;at=q+as+aG+f|0;c[an>>2]=at;g=as-q-f|0;c[x>>2]=g;aI=s;aJ=N;aK=q;aL=f;aM=aF+1|0;aN=1;aO=at;aP=g}else{aI=O;aJ=P;aK=Q;aL=G;aM=aF;aN=0;aO=aG;aP=0}do{if(m){g=(d[ar+al|0]|0)+(d[ar+8|0]|0)|0;at=(d[ar+h|0]|0)+(d[ar+o|0]|0)|0;f=(d[ar+E|0]|0)+(d[ar+D|0]|0)|0;q=(d[ar+U|0]|0)+(d[ar+j|0]|0)|0;N=aM+1|0;s=aN+1|0;as=at+g|0;aQ=f+as+aO+q|0;c[an>>2]=aQ;aR=as-f-q+aP|0;c[x>>2]=aR;as=(aF|0)!=0;if(as|C|L){if(as){aT=N;aU=s;aV=aR;aW=aQ;V=271;break}else{aX=s;aY=N;aZ=aR;a_=aQ;V=275;break}}else{c[ai>>2]=aK+aL+aJ+aI-g-at-f-q>>4;aX=s;aY=N;aZ=aR;a_=aQ;V=275;break}}else{if((aF|0)==0){a$=aN;a0=aM;a1=aP;a2=aO;V=272}else{aT=aM;aU=aN;aV=aP;aW=aO;V=271}}}while(0);if((V|0)==271){V=0;c[ai>>2]=aH>>aF+2;a$=aU;a0=aT;a1=aV;a2=aW;V=272}do{if((V|0)==272){V=0;aQ=(a$|0)!=0;if(aQ|n|v){if(aQ){aX=a$;aY=a0;aZ=a1;a_=a2;V=275;break}else{a3=a0;a4=a2;break}}else{c[x>>2]=aw+ax+av+au-aE-aD-aC-aB>>4;a3=a0;a4=a2;break}}}while(0);if((V|0)==275){V=0;c[x>>2]=aZ>>aX+2;a3=aY;a4=a_}if((a3|0)==2){c[an>>2]=a4>>4}else if((a3|0)==3){c[an>>2]=(a4*21|0)>>9}else if((a3|0)==1){c[an>>2]=a4>>3}else{c[an>>2]=a4>>5}aS(an);aQ=0;aR=l+((aq<<6)+256)|0;N=an;while(1){s=c[N+((aQ>>>1&3)<<2)>>2]|0;if((s|0)<0){a5=0}else{a5=(s|0)>255?-1:s&255}a[aR]=a5;s=aQ+1|0;if(s>>>0<64>>>0){aQ=s;aR=aR+1|0;N=(s&15|0)==0?N+16|0:N}else{break}}N=aq+1|0;if(N>>>0<2>>>0){aq=N;ar=ar+ap|0;ac=ax;B=aw;A=av;z=au;y=aE;J=aD;I=aC;H=aB;G=aL;Q=aK;P=aJ;O=aI}else{break}}bj(e,am);i=k;return}function aS(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0;b=a+4|0;d=c[b>>2]|0;e=a+16|0;f=c[e>>2]|0;g=c[a>>2]|0;if((d|f|0)==0){c[a+60>>2]=g;c[a+56>>2]=g;c[a+52>>2]=g;c[a+48>>2]=g;c[a+44>>2]=g;c[a+40>>2]=g;c[a+36>>2]=g;c[a+32>>2]=g;c[a+28>>2]=g;c[a+24>>2]=g;c[a+20>>2]=g;c[e>>2]=g;c[a+12>>2]=g;c[a+8>>2]=g;c[b>>2]=g;return}else{e=d+g|0;h=d>>1;i=h+g|0;j=g-h|0;h=g-d|0;c[a>>2]=f+e;d=f>>1;c[a+16>>2]=d+e;c[a+32>>2]=e-d;c[a+48>>2]=e-f;c[b>>2]=f+i;c[a+20>>2]=d+i;c[a+36>>2]=i-d;c[a+52>>2]=i-f;c[a+8>>2]=f+j;c[a+24>>2]=d+j;c[a+40>>2]=j-d;c[a+56>>2]=j-f;c[a+12>>2]=f+h;c[a+28>>2]=d+h;c[a+44>>2]=h-d;c[a+60>>2]=h-f;return}}function aT(e,f){e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0,al=0,am=0,an=0,ao=0,ap=0,aq=0,ar=0,as=0,at=0,au=0,av=0,aw=0,ax=0,ay=0,az=0,aA=0,aB=0,aC=0,aD=0,aE=0,aF=0,aG=0,aH=0,aI=0,aJ=0,aK=0,aL=0,aM=0,aN=0,aO=0,aP=0,aQ=0,aR=0,aS=0,aT=0,a_=0,a$=0,a0=0,a1=0,a2=0,a3=0,a4=0,a5=0,a6=0,a7=0,a8=0,a9=0,ba=0,bb=0,bc=0,bd=0,be=0,bf=0,bg=0,bh=0,bi=0,bj=0,bk=0,bl=0,bm=0,bn=0,bo=0,bp=0,bq=0,br=0,bs=0,bt=0,bv=0,bw=0,bx=0,by=0,bz=0,bA=0,bB=0,bC=0,bD=0,bE=0,bF=0,bG=0,bH=0,bI=0,bJ=0,bK=0,bL=0,bM=0,bN=0,bO=0,bP=0,bQ=0,bR=0,bS=0,bT=0,bU=0,bV=0,bW=0,bX=0,bY=0,bZ=0,b_=0,b$=0,b0=0,b1=0,b2=0,b3=0,b4=0,b5=0,b6=0,b7=0,b8=0,b9=0,ca=0,cb=0,cc=0,cd=0,ce=0,cf=0,cg=0,ch=0,ci=0,cj=0,ck=0,cl=0,cm=0,cn=0,co=0,cp=0,cq=0,cr=0,cs=0,ct=0,cu=0,cv=0,cw=0,cx=0,cy=0,cz=0,cA=0,cB=0,cC=0,cD=0,cE=0,cF=0,cG=0,cH=0,cI=0,cJ=0,cK=0,cL=0,cM=0,cN=0,cO=0,cP=0,cQ=0,cR=0,cS=0,cT=0,cU=0,cV=0,cW=0,cX=0,cY=0,cZ=0,c_=0,c$=0,c0=0,c1=0,c2=0,c3=0,c4=0,c5=0;g=i;i=i+168|0;h=g|0;j=g+128|0;k=c[e+4>>2]|0;l=e|0;m=e+8|0;e=c[m>>2]|0;n=Z(e,k)|0;if((e|0)==0){i=g;return}e=h|0;o=h+24|0;p=h+16|0;q=h+8|0;r=h|0;s=h+100|0;t=h+68|0;u=h+36|0;v=h+4|0;w=h+120|0;x=h+112|0;y=h+104|0;z=h+96|0;A=h+88|0;B=h+80|0;C=h+72|0;D=h+64|0;E=h+56|0;F=h+48|0;G=h+40|0;H=h+32|0;I=h+124|0;J=h+116|0;K=h+108|0;L=h+92|0;M=h+84|0;N=h+76|0;O=h+60|0;P=h+52|0;Q=h+44|0;R=h+28|0;S=h+20|0;T=h+12|0;h=j+28|0;U=j+32|0;V=j+24|0;W=k<<4;X=-W|0;Y=X<<1;_=k*-48|0;$=k<<5;aa=X<<2;ab=k*48|0;ac=k<<6;ad=j+24|0;ae=j+12|0;af=n<<8;ag=n<<6;n=k<<3;ah=W|4;ai=j+16|0;aj=j+20|0;ak=j+12|0;al=j+4|0;am=j+8|0;an=j|0;ao=0;ap=0;aq=f;while(1){f=c[aq+8>>2]|0;L403:do{if((f|0)!=1){ar=aq+200|0;as=c[ar>>2]|0;do{if((as|0)==0){at=1}else{if((f|0)==2){if((c[aq+4>>2]|0)!=(c[as+4>>2]|0)){at=1;break}}at=5}}while(0);as=aq+204|0;au=c[as>>2]|0;do{if((au|0)==0){av=at}else{if((f|0)==2){if((c[aq+4>>2]|0)!=(c[au+4>>2]|0)){av=at;break}}av=at|2}}while(0);aw=(av&2|0)==0;L417:do{if(aw){c[o>>2]=0;c[p>>2]=0;c[q>>2]=0;c[r>>2]=0;ax=0}else{do{if((c[aq>>2]|0)>>>0<=5>>>0){if((c[au>>2]|0)>>>0>5>>>0){break}do{if((b[aq+28>>1]|0)==0){if((b[au+48>>1]|0)!=0){ay=2;break}if((c[aq+116>>2]|0)!=(c[au+124>>2]|0)){ay=1;break}az=(b[aq+132>>1]|0)-(b[au+172>>1]|0)|0;if(((az|0)<0?-az|0:az)>>>0>3>>>0){ay=1;break}az=(b[aq+134>>1]|0)-(b[au+174>>1]|0)|0;ay=((az|0)<0?-az|0:az)>>>0>3>>>0|0}else{ay=2}}while(0);c[r>>2]=ay;az=c[as>>2]|0;do{if((b[aq+30>>1]|0)==0){if((b[az+50>>1]|0)!=0){aA=2;break}if((c[aq+116>>2]|0)!=(c[az+124>>2]|0)){aA=1;break}aB=(b[aq+136>>1]|0)-(b[az+176>>1]|0)|0;if(((aB|0)<0?-aB|0:aB)>>>0>3>>>0){aA=1;break}aB=(b[aq+138>>1]|0)-(b[az+178>>1]|0)|0;aA=((aB|0)<0?-aB|0:aB)>>>0>3>>>0|0}else{aA=2}}while(0);c[q>>2]=aA;az=c[as>>2]|0;do{if((b[aq+36>>1]|0)==0){if((b[az+56>>1]|0)!=0){aC=2;break}if((c[aq+120>>2]|0)!=(c[az+128>>2]|0)){aC=1;break}aB=(b[aq+148>>1]|0)-(b[az+188>>1]|0)|0;if(((aB|0)<0?-aB|0:aB)>>>0>3>>>0){aC=1;break}aB=(b[aq+150>>1]|0)-(b[az+190>>1]|0)|0;aC=((aB|0)<0?-aB|0:aB)>>>0>3>>>0|0}else{aC=2}}while(0);c[p>>2]=aC;az=c[as>>2]|0;do{if((b[aq+38>>1]|0)==0){if((b[az+58>>1]|0)!=0){aD=2;break}if((c[aq+120>>2]|0)!=(c[az+128>>2]|0)){aD=1;break}aB=(b[aq+152>>1]|0)-(b[az+192>>1]|0)|0;if(((aB|0)<0?-aB|0:aB)>>>0>3>>>0){aD=1;break}aB=(b[aq+154>>1]|0)-(b[az+194>>1]|0)|0;aD=((aB|0)<0?-aB|0:aB)>>>0>3>>>0|0}else{aD=2}}while(0);c[o>>2]=aD;if((aA|ay|0)==0){if((aD|aC|0)==0){ax=0;break L417}}ax=1;break L417}}while(0);c[o>>2]=4;c[p>>2]=4;c[q>>2]=4;c[r>>2]=4;ax=1}}while(0);au=(av&4|0)==0;L452:do{if(au){c[s>>2]=0;c[t>>2]=0;c[u>>2]=0;c[v>>2]=0;aE=ax;aF=aq|0}else{az=aq|0;do{if((c[az>>2]|0)>>>0<=5>>>0){aB=c[ar>>2]|0;if((c[aB>>2]|0)>>>0>5>>>0){break}do{if((b[aq+28>>1]|0)==0){if((b[aB+38>>1]|0)!=0){aG=2;break}if((c[aq+116>>2]|0)!=(c[aB+120>>2]|0)){aG=1;break}aH=(b[aq+132>>1]|0)-(b[aB+152>>1]|0)|0;if(((aH|0)<0?-aH|0:aH)>>>0>3>>>0){aG=1;break}aH=(b[aq+134>>1]|0)-(b[aB+154>>1]|0)|0;aG=((aH|0)<0?-aH|0:aH)>>>0>3>>>0|0}else{aG=2}}while(0);c[v>>2]=aG;aB=c[ar>>2]|0;do{if((b[aq+32>>1]|0)==0){if((b[aB+42>>1]|0)!=0){aI=2;break}if((c[aq+116>>2]|0)!=(c[aB+120>>2]|0)){aI=1;break}aH=(b[aq+140>>1]|0)-(b[aB+160>>1]|0)|0;if(((aH|0)<0?-aH|0:aH)>>>0>3>>>0){aI=1;break}aH=(b[aq+142>>1]|0)-(b[aB+162>>1]|0)|0;aI=((aH|0)<0?-aH|0:aH)>>>0>3>>>0|0}else{aI=2}}while(0);c[u>>2]=aI;aB=c[ar>>2]|0;do{if((b[aq+44>>1]|0)==0){if((b[aB+54>>1]|0)!=0){aJ=2;break}if((c[aq+124>>2]|0)!=(c[aB+128>>2]|0)){aJ=1;break}aH=(b[aq+164>>1]|0)-(b[aB+184>>1]|0)|0;if(((aH|0)<0?-aH|0:aH)>>>0>3>>>0){aJ=1;break}aH=(b[aq+166>>1]|0)-(b[aB+186>>1]|0)|0;aJ=((aH|0)<0?-aH|0:aH)>>>0>3>>>0|0}else{aJ=2}}while(0);c[t>>2]=aJ;aB=c[ar>>2]|0;do{if((b[aq+48>>1]|0)==0){if((b[aB+58>>1]|0)!=0){aK=2;break}if((c[aq+124>>2]|0)!=(c[aB+128>>2]|0)){aK=1;break}aH=(b[aq+172>>1]|0)-(b[aB+192>>1]|0)|0;if(((aH|0)<0?-aH|0:aH)>>>0>3>>>0){aK=1;break}aH=(b[aq+174>>1]|0)-(b[aB+194>>1]|0)|0;aK=((aH|0)<0?-aH|0:aH)>>>0>3>>>0|0}else{aK=2}}while(0);c[s>>2]=aK;if((ax|0)!=0){aE=ax;aF=az;break L452}if((aI|aG|0)==0){if((aK|aJ|0)==0){aE=0;aF=az;break L452}}aE=1;aF=az;break L452}}while(0);c[s>>2]=4;c[t>>2]=4;c[u>>2]=4;c[v>>2]=4;aE=1;aF=az}}while(0);aB=c[aF>>2]|0;do{if(aB>>>0>5>>>0){c[w>>2]=3;c[x>>2]=3;c[y>>2]=3;c[z>>2]=3;c[A>>2]=3;c[B>>2]=3;c[C>>2]=3;c[D>>2]=3;c[E>>2]=3;c[F>>2]=3;c[G>>2]=3;c[H>>2]=3;c[I>>2]=3;c[J>>2]=3;c[K>>2]=3;c[L>>2]=3;c[M>>2]=3;c[N>>2]=3;c[O>>2]=3;c[P>>2]=3;c[Q>>2]=3;c[R>>2]=3;c[S>>2]=3;c[T>>2]=3}else{do{if((bu(aB)|0)==1){aU(aq,e)}else{aH=c[aF>>2]|0;if((aH|0)==3){aL=aq+28|0;aM=aq+32|0;if((b[aM>>1]|0)==0){aN=(b[aL>>1]|0)!=0?2:0}else{aN=2}c[H>>2]=aN;aO=aq+34|0;if((b[aO>>1]|0)==0){aP=(b[aq+30>>1]|0)!=0?2:0}else{aP=2}c[G>>2]=aP;aQ=aq+40|0;if((b[aQ>>1]|0)==0){aR=(b[aq+36>>1]|0)!=0?2:0}else{aR=2}c[F>>2]=aR;aS=aq+42|0;if((b[aS>>1]|0)==0){aT=(b[aq+38>>1]|0)!=0?2:0}else{aT=2}c[E>>2]=aT;a_=aq+44|0;if((b[a_>>1]|0)==0){a$=(b[aM>>1]|0)!=0?2:0}else{a$=2}c[D>>2]=a$;a0=aq+46|0;if((b[a0>>1]|0)==0){a1=(b[aO>>1]|0)!=0?2:0}else{a1=2}c[C>>2]=a1;a2=aq+52|0;if((b[a2>>1]|0)==0){a3=(b[aQ>>1]|0)!=0?2:0}else{a3=2}c[B>>2]=a3;a4=aq+54|0;if((b[a4>>1]|0)==0){a5=(b[aS>>1]|0)!=0?2:0}else{a5=2}c[A>>2]=a5;a6=aq+48|0;if((b[a6>>1]|0)==0){a7=(b[a_>>1]|0)!=0?2:0}else{a7=2}c[z>>2]=a7;a8=aq+50|0;if((b[a8>>1]|0)==0){a9=(b[a0>>1]|0)!=0?2:0}else{a9=2}c[y>>2]=a9;ba=aq+56|0;if((b[ba>>1]|0)==0){bb=(b[a2>>1]|0)!=0?2:0}else{bb=2}c[x>>2]=bb;bc=aq+58|0;if((b[bc>>1]|0)==0){bd=(b[a4>>1]|0)!=0?2:0}else{bd=2}c[w>>2]=bd;be=aq+30|0;if((b[be>>1]|0)==0){bf=(b[aL>>1]|0)!=0?2:0}else{bf=2}c[T>>2]=bf;if((b[aq+38>>1]|0)==0){bg=(b[aq+36>>1]|0)!=0?2:0}else{bg=2}c[R>>2]=bg;if((b[aO>>1]|0)==0){bh=(b[aM>>1]|0)!=0?2:0}else{bh=2}c[Q>>2]=bh;if((b[aS>>1]|0)==0){bi=(b[aQ>>1]|0)!=0?2:0}else{bi=2}c[O>>2]=bi;if((b[a0>>1]|0)==0){bj=(b[a_>>1]|0)!=0?2:0}else{bj=2}c[N>>2]=bj;if((b[a4>>1]|0)==0){bk=(b[a2>>1]|0)!=0?2:0}else{bk=2}c[L>>2]=bk;if((b[a8>>1]|0)==0){bl=(b[a6>>1]|0)!=0?2:0}else{bl=2}c[K>>2]=bl;if((b[bc>>1]|0)==0){bm=(b[ba>>1]|0)!=0?2:0}else{bm=2}c[I>>2]=bm;bc=b[aq+148>>1]|0;a6=b[aq+136>>1]|0;a4=b[aq+150>>1]|0;a_=b[aq+138>>1]|0;do{if((b[aq+36>>1]|0)==0){if((b[be>>1]|0)!=0){bn=2;break}aS=bc-a6|0;if(((aS|0)<0?-aS|0:aS)>>>0>3>>>0){bn=1;break}aS=a4-a_|0;if(((aS|0)<0?-aS|0:aS)>>>0>3>>>0){bn=1;break}bn=(c[aq+120>>2]|0)!=(c[aq+116>>2]|0)|0}else{bn=2}}while(0);c[S>>2]=bn;a_=b[aq+156>>1]|0;a4=b[aq+144>>1]|0;a6=b[aq+158>>1]|0;bc=b[aq+146>>1]|0;do{if((b[aQ>>1]|0)==0){if((b[aO>>1]|0)!=0){bo=2;break}be=a_-a4|0;if(((be|0)<0?-be|0:be)>>>0>3>>>0){bo=1;break}be=a6-bc|0;if(((be|0)<0?-be|0:be)>>>0>3>>>0){bo=1;break}bo=(c[aq+120>>2]|0)!=(c[aq+116>>2]|0)|0}else{bo=2}}while(0);c[P>>2]=bo;bc=b[aq+180>>1]|0;a6=b[aq+168>>1]|0;a4=b[aq+182>>1]|0;a_=b[aq+170>>1]|0;do{if((b[a2>>1]|0)==0){if((b[a0>>1]|0)!=0){bp=2;break}aO=bc-a6|0;if(((aO|0)<0?-aO|0:aO)>>>0>3>>>0){bp=1;break}aO=a4-a_|0;if(((aO|0)<0?-aO|0:aO)>>>0>3>>>0){bp=1;break}bp=(c[aq+128>>2]|0)!=(c[aq+124>>2]|0)|0}else{bp=2}}while(0);c[M>>2]=bp;a_=b[aq+188>>1]|0;a4=b[aq+176>>1]|0;a6=b[aq+190>>1]|0;bc=b[aq+178>>1]|0;do{if((b[ba>>1]|0)==0){if((b[a8>>1]|0)!=0){bq=2;break}a0=a_-a4|0;if(((a0|0)<0?-a0|0:a0)>>>0>3>>>0){bq=1;break}a0=a6-bc|0;if(((a0|0)<0?-a0|0:a0)>>>0>3>>>0){bq=1;break}bq=(c[aq+128>>2]|0)!=(c[aq+124>>2]|0)|0}else{bq=2}}while(0);c[J>>2]=bq;break}else if((aH|0)==2){bc=aq+28|0;a6=aq+32|0;if((b[a6>>1]|0)==0){br=(b[bc>>1]|0)!=0?2:0}else{br=2}c[H>>2]=br;a4=aq+34|0;if((b[a4>>1]|0)==0){bs=(b[aq+30>>1]|0)!=0?2:0}else{bs=2}c[G>>2]=bs;a_=aq+40|0;if((b[a_>>1]|0)==0){bt=(b[aq+36>>1]|0)!=0?2:0}else{bt=2}c[F>>2]=bt;a8=aq+42|0;if((b[a8>>1]|0)==0){bv=(b[aq+38>>1]|0)!=0?2:0}else{bv=2}c[E>>2]=bv;ba=aq+48|0;if((b[ba>>1]|0)==0){bw=(b[aq+44>>1]|0)!=0?2:0}else{bw=2}c[z>>2]=bw;a0=aq+50|0;if((b[a0>>1]|0)==0){bx=(b[aq+46>>1]|0)!=0?2:0}else{bx=2}c[y>>2]=bx;a2=aq+56|0;if((b[a2>>1]|0)==0){by=(b[aq+52>>1]|0)!=0?2:0}else{by=2}c[x>>2]=by;aO=aq+58|0;if((b[aO>>1]|0)==0){bz=(b[aq+54>>1]|0)!=0?2:0}else{bz=2}c[w>>2]=bz;aQ=aq+44|0;be=b[aq+164>>1]|0;aS=b[aq+140>>1]|0;aM=b[aq+166>>1]|0;aL=b[aq+142>>1]|0;do{if((b[aQ>>1]|0)==0){if((b[a6>>1]|0)!=0){bA=2;break}bB=be-aS|0;if(((bB|0)<0?-bB|0:bB)>>>0>3>>>0){bA=1;break}bB=aM-aL|0;if(((bB|0)<0?-bB|0:bB)>>>0>3>>>0){bA=1;break}bA=(c[aq+124>>2]|0)!=(c[aq+116>>2]|0)|0}else{bA=2}}while(0);c[D>>2]=bA;aL=aq+46|0;aM=b[aq+168>>1]|0;aS=b[aq+144>>1]|0;be=b[aq+170>>1]|0;aH=b[aq+146>>1]|0;do{if((b[aL>>1]|0)==0){if((b[a4>>1]|0)!=0){bC=2;break}bB=aM-aS|0;if(((bB|0)<0?-bB|0:bB)>>>0>3>>>0){bC=1;break}bB=be-aH|0;if(((bB|0)<0?-bB|0:bB)>>>0>3>>>0){bC=1;break}bC=(c[aq+124>>2]|0)!=(c[aq+116>>2]|0)|0}else{bC=2}}while(0);c[C>>2]=bC;aH=aq+52|0;be=b[aq+180>>1]|0;aS=b[aq+156>>1]|0;aM=b[aq+182>>1]|0;bB=b[aq+158>>1]|0;do{if((b[aH>>1]|0)==0){if((b[a_>>1]|0)!=0){bD=2;break}bE=be-aS|0;if(((bE|0)<0?-bE|0:bE)>>>0>3>>>0){bD=1;break}bE=aM-bB|0;if(((bE|0)<0?-bE|0:bE)>>>0>3>>>0){bD=1;break}bD=(c[aq+128>>2]|0)!=(c[aq+120>>2]|0)|0}else{bD=2}}while(0);c[B>>2]=bD;bB=aq+54|0;aM=b[aq+184>>1]|0;aS=b[aq+160>>1]|0;be=b[aq+186>>1]|0;bE=b[aq+162>>1]|0;do{if((b[bB>>1]|0)==0){if((b[a8>>1]|0)!=0){bF=2;break}bG=aM-aS|0;if(((bG|0)<0?-bG|0:bG)>>>0>3>>>0){bF=1;break}bG=be-bE|0;if(((bG|0)<0?-bG|0:bG)>>>0>3>>>0){bF=1;break}bF=(c[aq+128>>2]|0)!=(c[aq+120>>2]|0)|0}else{bF=2}}while(0);c[A>>2]=bF;bE=aq+30|0;if((b[bE>>1]|0)==0){bH=(b[bc>>1]|0)!=0?2:0}else{bH=2}c[T>>2]=bH;be=aq+36|0;if((b[be>>1]|0)==0){bI=(b[bE>>1]|0)!=0?2:0}else{bI=2}c[S>>2]=bI;if((b[aq+38>>1]|0)==0){bJ=(b[be>>1]|0)!=0?2:0}else{bJ=2}c[R>>2]=bJ;if((b[a4>>1]|0)==0){bK=(b[a6>>1]|0)!=0?2:0}else{bK=2}c[Q>>2]=bK;if((b[a_>>1]|0)==0){bL=(b[a4>>1]|0)!=0?2:0}else{bL=2}c[P>>2]=bL;if((b[a8>>1]|0)==0){bM=(b[a_>>1]|0)!=0?2:0}else{bM=2}c[O>>2]=bM;if((b[aL>>1]|0)==0){bN=(b[aQ>>1]|0)!=0?2:0}else{bN=2}c[N>>2]=bN;if((b[aH>>1]|0)==0){bO=(b[aL>>1]|0)!=0?2:0}else{bO=2}c[M>>2]=bO;if((b[bB>>1]|0)==0){bP=(b[aH>>1]|0)!=0?2:0}else{bP=2}c[L>>2]=bP;if((b[a0>>1]|0)==0){bQ=(b[ba>>1]|0)!=0?2:0}else{bQ=2}c[K>>2]=bQ;if((b[a2>>1]|0)==0){bR=(b[a0>>1]|0)!=0?2:0}else{bR=2}c[J>>2]=bR;if((b[aO>>1]|0)==0){bS=(b[a2>>1]|0)!=0?2:0}else{bS=2}c[I>>2]=bS;break}else{be=aq+32|0;bE=aq+140|0;aS=b[bE>>1]|0;aM=aq+132|0;bG=b[aM>>1]|0;bT=aq+142|0;bU=b[bT>>1]|0;bV=aq+134|0;bW=b[bV>>1]|0;do{if((b[be>>1]|0)==0){if((b[aq+28>>1]|0)!=0){bX=2;break}bY=aS-bG|0;if(((bY|0)<0?-bY|0:bY)>>>0>3>>>0){bX=1;break}bY=bU-bW|0;bX=((bY|0)<0?-bY|0:bY)>>>0>3>>>0|0}else{bX=2}}while(0);c[H>>2]=bX;bW=aq+34|0;bU=aq+144|0;bG=b[bU>>1]|0;aS=aq+136|0;a2=b[aS>>1]|0;aO=aq+146|0;a0=b[aO>>1]|0;ba=aq+138|0;aH=b[ba>>1]|0;do{if((b[bW>>1]|0)==0){if((b[aq+30>>1]|0)!=0){bZ=2;break}bB=bG-a2|0;if(((bB|0)<0?-bB|0:bB)>>>0>3>>>0){bZ=1;break}bB=a0-aH|0;bZ=((bB|0)<0?-bB|0:bB)>>>0>3>>>0|0}else{bZ=2}}while(0);c[G>>2]=bZ;aH=aq+40|0;a0=aq+156|0;a2=b[a0>>1]|0;bG=aq+148|0;bB=b[bG>>1]|0;aL=aq+158|0;aQ=b[aL>>1]|0;a_=aq+150|0;a8=b[a_>>1]|0;do{if((b[aH>>1]|0)==0){if((b[aq+36>>1]|0)!=0){b_=2;break}a4=a2-bB|0;if(((a4|0)<0?-a4|0:a4)>>>0>3>>>0){b_=1;break}a4=aQ-a8|0;b_=((a4|0)<0?-a4|0:a4)>>>0>3>>>0|0}else{b_=2}}while(0);c[F>>2]=b_;a8=aq+42|0;aQ=aq+160|0;bB=b[aQ>>1]|0;a2=aq+152|0;a4=b[a2>>1]|0;a6=aq+162|0;bc=b[a6>>1]|0;bY=aq+154|0;b$=b[bY>>1]|0;do{if((b[a8>>1]|0)==0){if((b[aq+38>>1]|0)!=0){b0=2;break}b1=bB-a4|0;if(((b1|0)<0?-b1|0:b1)>>>0>3>>>0){b0=1;break}b1=bc-b$|0;b0=((b1|0)<0?-b1|0:b1)>>>0>3>>>0|0}else{b0=2}}while(0);c[E>>2]=b0;b$=aq+44|0;bc=aq+164|0;a4=b[bc>>1]|0;bB=b[bE>>1]|0;b1=aq+166|0;b2=b[b1>>1]|0;b3=b[bT>>1]|0;do{if((b[b$>>1]|0)==0){if((b[be>>1]|0)!=0){b4=2;break}b5=a4-bB|0;if(((b5|0)<0?-b5|0:b5)>>>0>3>>>0){b4=1;break}b5=b2-b3|0;if(((b5|0)<0?-b5|0:b5)>>>0>3>>>0){b4=1;break}b4=(c[aq+124>>2]|0)!=(c[aq+116>>2]|0)|0}else{b4=2}}while(0);c[D>>2]=b4;b3=aq+46|0;b2=aq+168|0;bB=b[b2>>1]|0;a4=b[bU>>1]|0;b5=aq+170|0;b6=b[b5>>1]|0;b7=b[aO>>1]|0;do{if((b[b3>>1]|0)==0){if((b[bW>>1]|0)!=0){b8=2;break}b9=bB-a4|0;if(((b9|0)<0?-b9|0:b9)>>>0>3>>>0){b8=1;break}b9=b6-b7|0;if(((b9|0)<0?-b9|0:b9)>>>0>3>>>0){b8=1;break}b8=(c[aq+124>>2]|0)!=(c[aq+116>>2]|0)|0}else{b8=2}}while(0);c[C>>2]=b8;b7=aq+52|0;b6=aq+180|0;a4=b[b6>>1]|0;bB=b[a0>>1]|0;b9=aq+182|0;ca=b[b9>>1]|0;cb=b[aL>>1]|0;do{if((b[b7>>1]|0)==0){if((b[aH>>1]|0)!=0){cc=2;break}cd=a4-bB|0;if(((cd|0)<0?-cd|0:cd)>>>0>3>>>0){cc=1;break}cd=ca-cb|0;if(((cd|0)<0?-cd|0:cd)>>>0>3>>>0){cc=1;break}cc=(c[aq+128>>2]|0)!=(c[aq+120>>2]|0)|0}else{cc=2}}while(0);c[B>>2]=cc;cb=aq+54|0;ca=aq+184|0;bB=b[ca>>1]|0;a4=b[aQ>>1]|0;cd=aq+186|0;ce=b[cd>>1]|0;cf=b[a6>>1]|0;do{if((b[cb>>1]|0)==0){if((b[a8>>1]|0)!=0){cg=2;break}ch=bB-a4|0;if(((ch|0)<0?-ch|0:ch)>>>0>3>>>0){cg=1;break}ch=ce-cf|0;if(((ch|0)<0?-ch|0:ch)>>>0>3>>>0){cg=1;break}cg=(c[aq+128>>2]|0)!=(c[aq+120>>2]|0)|0}else{cg=2}}while(0);c[A>>2]=cg;cf=aq+48|0;ce=aq+172|0;a4=b[ce>>1]|0;bB=b[bc>>1]|0;ch=aq+174|0;ci=b[ch>>1]|0;cj=b[b1>>1]|0;do{if((b[cf>>1]|0)==0){if((b[b$>>1]|0)!=0){ck=2;break}cl=a4-bB|0;if(((cl|0)<0?-cl|0:cl)>>>0>3>>>0){ck=1;break}cl=ci-cj|0;ck=((cl|0)<0?-cl|0:cl)>>>0>3>>>0|0}else{ck=2}}while(0);c[z>>2]=ck;cj=aq+50|0;ci=aq+176|0;bB=b[ci>>1]|0;a4=b[b2>>1]|0;cl=aq+178|0;cm=b[cl>>1]|0;cn=b[b5>>1]|0;do{if((b[cj>>1]|0)==0){if((b[b3>>1]|0)!=0){co=2;break}cp=bB-a4|0;if(((cp|0)<0?-cp|0:cp)>>>0>3>>>0){co=1;break}cp=cm-cn|0;co=((cp|0)<0?-cp|0:cp)>>>0>3>>>0|0}else{co=2}}while(0);c[y>>2]=co;cn=aq+56|0;cm=aq+188|0;a4=b[cm>>1]|0;bB=b[b6>>1]|0;cp=aq+190|0;cq=b[cp>>1]|0;cr=b[b9>>1]|0;do{if((b[cn>>1]|0)==0){if((b[b7>>1]|0)!=0){cs=2;break}ct=a4-bB|0;if(((ct|0)<0?-ct|0:ct)>>>0>3>>>0){cs=1;break}ct=cq-cr|0;cs=((ct|0)<0?-ct|0:ct)>>>0>3>>>0|0}else{cs=2}}while(0);c[x>>2]=cs;cr=aq+58|0;cq=aq+192|0;bB=b[cq>>1]|0;a4=b[ca>>1]|0;ct=aq+194|0;cu=b[ct>>1]|0;cv=b[cd>>1]|0;do{if((b[cr>>1]|0)==0){if((b[cb>>1]|0)!=0){cw=2;break}cx=bB-a4|0;if(((cx|0)<0?-cx|0:cx)>>>0>3>>>0){cw=1;break}cx=cu-cv|0;cw=((cx|0)<0?-cx|0:cx)>>>0>3>>>0|0}else{cw=2}}while(0);c[w>>2]=cw;cv=aq+30|0;cu=b[aS>>1]|0;a4=b[aM>>1]|0;bB=b[ba>>1]|0;cx=b[bV>>1]|0;do{if((b[cv>>1]|0)==0){if((b[aq+28>>1]|0)!=0){cy=2;break}cz=cu-a4|0;if(((cz|0)<0?-cz|0:cz)>>>0>3>>>0){cy=1;break}cz=bB-cx|0;cy=((cz|0)<0?-cz|0:cz)>>>0>3>>>0|0}else{cy=2}}while(0);c[T>>2]=cy;cx=aq+36|0;bB=b[bG>>1]|0;a4=b[aS>>1]|0;cu=b[a_>>1]|0;bV=b[ba>>1]|0;do{if((b[cx>>1]|0)==0){if((b[cv>>1]|0)!=0){cA=2;break}aM=bB-a4|0;if(((aM|0)<0?-aM|0:aM)>>>0>3>>>0){cA=1;break}aM=cu-bV|0;if(((aM|0)<0?-aM|0:aM)>>>0>3>>>0){cA=1;break}cA=(c[aq+120>>2]|0)!=(c[aq+116>>2]|0)|0}else{cA=2}}while(0);c[S>>2]=cA;bV=b[a2>>1]|0;cu=b[bG>>1]|0;a4=b[bY>>1]|0;bB=b[a_>>1]|0;do{if((b[aq+38>>1]|0)==0){if((b[cx>>1]|0)!=0){cB=2;break}cv=bV-cu|0;if(((cv|0)<0?-cv|0:cv)>>>0>3>>>0){cB=1;break}cv=a4-bB|0;cB=((cv|0)<0?-cv|0:cv)>>>0>3>>>0|0}else{cB=2}}while(0);c[R>>2]=cB;bB=b[bU>>1]|0;a4=b[bE>>1]|0;cu=b[aO>>1]|0;bV=b[bT>>1]|0;do{if((b[bW>>1]|0)==0){if((b[be>>1]|0)!=0){cC=2;break}cx=bB-a4|0;if(((cx|0)<0?-cx|0:cx)>>>0>3>>>0){cC=1;break}cx=cu-bV|0;cC=((cx|0)<0?-cx|0:cx)>>>0>3>>>0|0}else{cC=2}}while(0);c[Q>>2]=cC;bV=b[a0>>1]|0;cu=b[bU>>1]|0;a4=b[aL>>1]|0;bB=b[aO>>1]|0;do{if((b[aH>>1]|0)==0){if((b[bW>>1]|0)!=0){cD=2;break}be=bV-cu|0;if(((be|0)<0?-be|0:be)>>>0>3>>>0){cD=1;break}be=a4-bB|0;if(((be|0)<0?-be|0:be)>>>0>3>>>0){cD=1;break}cD=(c[aq+120>>2]|0)!=(c[aq+116>>2]|0)|0}else{cD=2}}while(0);c[P>>2]=cD;bB=b[aQ>>1]|0;a4=b[a0>>1]|0;cu=b[a6>>1]|0;bV=b[aL>>1]|0;do{if((b[a8>>1]|0)==0){if((b[aH>>1]|0)!=0){cE=2;break}bW=bB-a4|0;if(((bW|0)<0?-bW|0:bW)>>>0>3>>>0){cE=1;break}bW=cu-bV|0;cE=((bW|0)<0?-bW|0:bW)>>>0>3>>>0|0}else{cE=2}}while(0);c[O>>2]=cE;bV=b[b2>>1]|0;cu=b[bc>>1]|0;a4=b[b5>>1]|0;bB=b[b1>>1]|0;do{if((b[b3>>1]|0)==0){if((b[b$>>1]|0)!=0){cF=2;break}aH=bV-cu|0;if(((aH|0)<0?-aH|0:aH)>>>0>3>>>0){cF=1;break}aH=a4-bB|0;cF=((aH|0)<0?-aH|0:aH)>>>0>3>>>0|0}else{cF=2}}while(0);c[N>>2]=cF;bB=b[b6>>1]|0;a4=b[b2>>1]|0;cu=b[b9>>1]|0;bV=b[b5>>1]|0;do{if((b[b7>>1]|0)==0){if((b[b3>>1]|0)!=0){cG=2;break}b$=bB-a4|0;if(((b$|0)<0?-b$|0:b$)>>>0>3>>>0){cG=1;break}b$=cu-bV|0;if(((b$|0)<0?-b$|0:b$)>>>0>3>>>0){cG=1;break}cG=(c[aq+128>>2]|0)!=(c[aq+124>>2]|0)|0}else{cG=2}}while(0);c[M>>2]=cG;bV=b[ca>>1]|0;cu=b[b6>>1]|0;a4=b[cd>>1]|0;bB=b[b9>>1]|0;do{if((b[cb>>1]|0)==0){if((b[b7>>1]|0)!=0){cH=2;break}b3=bV-cu|0;if(((b3|0)<0?-b3|0:b3)>>>0>3>>>0){cH=1;break}b3=a4-bB|0;cH=((b3|0)<0?-b3|0:b3)>>>0>3>>>0|0}else{cH=2}}while(0);c[L>>2]=cH;bB=b[ci>>1]|0;a4=b[ce>>1]|0;cu=b[cl>>1]|0;bV=b[ch>>1]|0;do{if((b[cj>>1]|0)==0){if((b[cf>>1]|0)!=0){cI=2;break}b7=bB-a4|0;if(((b7|0)<0?-b7|0:b7)>>>0>3>>>0){cI=1;break}b7=cu-bV|0;cI=((b7|0)<0?-b7|0:b7)>>>0>3>>>0|0}else{cI=2}}while(0);c[K>>2]=cI;bV=b[cm>>1]|0;cu=b[ci>>1]|0;a4=b[cp>>1]|0;bB=b[cl>>1]|0;do{if((b[cn>>1]|0)==0){if((b[cj>>1]|0)!=0){cJ=2;break}cf=bV-cu|0;if(((cf|0)<0?-cf|0:cf)>>>0>3>>>0){cJ=1;break}cf=a4-bB|0;if(((cf|0)<0?-cf|0:cf)>>>0>3>>>0){cJ=1;break}cJ=(c[aq+128>>2]|0)!=(c[aq+124>>2]|0)|0}else{cJ=2}}while(0);c[J>>2]=cJ;bB=b[cq>>1]|0;a4=b[cm>>1]|0;cu=b[ct>>1]|0;bV=b[cp>>1]|0;do{if((b[cr>>1]|0)==0){if((b[cn>>1]|0)!=0){cK=2;break}cj=bB-a4|0;if(((cj|0)<0?-cj|0:cj)>>>0>3>>>0){cK=1;break}cj=cu-bV|0;cK=((cj|0)<0?-cj|0:cj)>>>0>3>>>0|0}else{cK=2}}while(0);c[I>>2]=cK;break}}}while(0);if((aE|0)!=0){break}if((c[H>>2]|0)!=0){break}if((c[G>>2]|0)!=0){break}if((c[F>>2]|0)!=0){break}if((c[E>>2]|0)!=0){break}if((c[D>>2]|0)!=0){break}if((c[C>>2]|0)!=0){break}if((c[B>>2]|0)!=0){break}if((c[A>>2]|0)!=0){break}if((c[z>>2]|0)!=0){break}if((c[y>>2]|0)!=0){break}if((c[x>>2]|0)!=0){break}if((c[w>>2]|0)!=0){break}if((c[T>>2]|0)!=0){break}if((c[S>>2]|0)!=0){break}if((c[R>>2]|0)!=0){break}if((c[Q>>2]|0)!=0){break}if((c[P>>2]|0)!=0){break}if((c[O>>2]|0)!=0){break}if((c[N>>2]|0)!=0){break}if((c[M>>2]|0)!=0){break}if((c[L>>2]|0)!=0){break}if((c[K>>2]|0)!=0){break}if((c[J>>2]|0)!=0){break}if((c[I>>2]|0)==0){break L403}}}while(0);aB=aq+20|0;az=c[aB>>2]|0;bV=aq+12|0;cu=(c[bV>>2]|0)+az|0;if((cu|0)<0){cL=0}else{cL=(cu|0)>51?51:cu}cu=aq+16|0;a4=(c[cu>>2]|0)+az|0;if((a4|0)<0){cM=0}else{cM=(a4|0)>51?51:a4}a4=d[4232+cL|0]|0;c[h>>2]=a4;bB=d[4176+cM|0]|0;c[U>>2]=bB;cn=600+(cL*3|0)|0;c[V>>2]=cn;do{if(!aw){cr=c[(c[as>>2]|0)+20>>2]|0;if((cr|0)==(az|0)){c[al>>2]=a4;c[am>>2]=bB;c[an>>2]=cn;break}cp=(az+1+cr|0)>>>1;cr=(c[bV>>2]|0)+cp|0;if((cr|0)<0){cN=0}else{cN=(cr|0)>51?51:cr}cr=(c[cu>>2]|0)+cp|0;if((cr|0)<0){cO=0}else{cO=(cr|0)>51?51:cr}c[al>>2]=d[4232+cN|0]|0;c[am>>2]=d[4176+cO|0]|0;c[an>>2]=600+(cN*3|0)}}while(0);do{if(!au){cr=c[(c[ar>>2]|0)+20>>2]|0;if((cr|0)==(az|0)){c[ai>>2]=a4;c[aj>>2]=bB;c[ak>>2]=cn;break}cp=(az+1+cr|0)>>>1;cr=(c[bV>>2]|0)+cp|0;if((cr|0)<0){cP=0}else{cP=(cr|0)>51?51:cr}cr=(c[cu>>2]|0)+cp|0;if((cr|0)<0){cQ=0}else{cQ=(cr|0)>51?51:cr}c[ai>>2]=d[4232+cP|0]|0;c[aj>>2]=d[4176+cQ|0]|0;c[ak>>2]=600+(cP*3|0)}}while(0);az=Z(ap,k)|0;cn=e;bB=(c[l>>2]|0)+((az<<8)+(ao<<4))|0;a4=0;cr=3;while(1){cp=c[cn+4>>2]|0;if((cp|0)!=0){aY(bB,cp,ae,W)}cp=c[cn+12>>2]|0;if((cp|0)!=0){aY(bB+4|0,cp,ad,W)}cp=cn+16|0;ct=c[cn+20>>2]|0;if((ct|0)!=0){aY(bB+8|0,ct,ad,W)}ct=cn+24|0;cm=c[cn+28>>2]|0;if((cm|0)!=0){aY(bB+12|0,cm,ad,W)}cm=c[cn>>2]|0;cq=cn+8|0;cj=c[cq>>2]|0;L864:do{if((cm|0)==(cj|0)){if((cm|0)!=(c[cp>>2]|0)){cR=684;break}if((cm|0)!=(c[ct>>2]|0)){cR=684;break}if((cm|0)==0){break}cl=c[j+(a4*12|0)+4>>2]|0;ci=c[j+(a4*12|0)+8>>2]|0;if(cm>>>0>=4>>>0){cf=(cl>>>2)+2|0;ch=16;ce=bB;while(1){b7=ce+Y|0;cb=d[b7]|0;b9=ce+X|0;cd=d[b9]|0;b6=d[ce]|0;ca=ce+W|0;b3=d[ca]|0;b5=cd-b6|0;b2=(b5|0)<0?-b5|0:b5;L873:do{if(b2>>>0<cl>>>0){b5=cb-cd|0;if(((b5|0)<0?-b5|0:b5)>>>0>=ci>>>0){break}b5=b3-b6|0;if(((b5|0)<0?-b5|0:b5)>>>0>=ci>>>0){break}b5=ce+_|0;b$=d[b5]|0;b1=ce+$|0;bc=d[b1]|0;do{if(b2>>>0<cf>>>0){aH=b$-cd|0;if(((aH|0)<0?-aH|0:aH)>>>0<ci>>>0){aH=cd+cb+b6|0;a[b9]=(b3+4+(aH<<1)+b$|0)>>>3&255;a[b7]=(aH+2+b$|0)>>>2&255;a[b5]=(aH+4+(b$*3|0)+(d[ce+aa|0]<<1)|0)>>>3&255}else{a[b9]=(cd+2+(cb<<1)+b3|0)>>>2&255}aH=bc-b6|0;if(((aH|0)<0?-aH|0:aH)>>>0>=ci>>>0){break}aH=b6+cd+b3|0;a[ce]=(cb+4+(aH<<1)+bc|0)>>>3&255;a[ca]=(aH+2+bc|0)>>>2&255;a[b1]=(aH+4+(bc*3|0)+(d[ce+ab|0]<<1)|0)>>>3&255;break L873}else{a[b9]=(cd+2+(cb<<1)+b3|0)>>>2&255}}while(0);a[ce]=(cb+2+b6+(b3<<1)|0)>>>2&255}}while(0);b3=ch-1|0;if((b3|0)==0){break L864}else{ch=b3;ce=ce+1|0}}}ce=d[(c[j+(a4*12|0)>>2]|0)+(cm-1)|0]|0;ch=-ce|0;cf=ce+1|0;b3=16;b6=bB;while(1){cb=b6+Y|0;cd=d[cb]|0;b9=b6+X|0;ca=d[b9]|0;b7=d[b6]|0;b2=b6+W|0;bc=d[b2]|0;b1=ca-b7|0;do{if(((b1|0)<0?-b1|0:b1)>>>0<cl>>>0){b$=cd-ca|0;if(((b$|0)<0?-b$|0:b$)>>>0>=ci>>>0){break}b$=bc-b7|0;if(((b$|0)<0?-b$|0:b$)>>>0>=ci>>>0){break}b$=d[b6+_|0]|0;b5=b$-ca|0;if(((b5|0)<0?-b5|0:b5)>>>0<ci>>>0){b5=((ca+1+b7|0)>>>1)-(cd<<1)+b$>>1;if((b5|0)<(ch|0)){cS=ch}else{cS=(b5|0)>(ce|0)?ce:b5}a[cb]=cS+cd&255;cT=cf}else{cT=ce}b5=d[b6+$|0]|0;b$=b5-b7|0;if(((b$|0)<0?-b$|0:b$)>>>0<ci>>>0){b$=((ca+1+b7|0)>>>1)-(bc<<1)+b5>>1;if((b$|0)<(ch|0)){cU=ch}else{cU=(b$|0)>(ce|0)?ce:b$}a[b2]=cU+bc&255;cV=cT+1|0}else{cV=cT}b$=cd+4-bc+(b7-ca<<2)>>3;b5=-cV|0;if((b$|0)<(b5|0)){cW=b5}else{cW=(b$|0)>(cV|0)?cV:b$}b$=a[1296+((b7|512)-cW)|0]|0;a[b9]=a[1296+(cW+(ca|512))|0]|0;a[b6]=b$}}while(0);ca=b3-1|0;if((ca|0)==0){break}else{b3=ca;b6=b6+1|0}}}else{cR=684}}while(0);do{if((cR|0)==684){cR=0;if((cm|0)==0){cX=cj}else{aZ(bB,cm,j+(a4*12|0)|0,W);cX=c[cq>>2]|0}if((cX|0)!=0){aZ(bB+4|0,cX,j+(a4*12|0)|0,W)}b6=c[cp>>2]|0;if((b6|0)!=0){aZ(bB+8|0,b6,j+(a4*12|0)|0,W)}b6=c[ct>>2]|0;if((b6|0)==0){break}aZ(bB+12|0,b6,j+(a4*12|0)|0,W)}}while(0);if((cr|0)==0){break}else{cn=cn+32|0;bB=bB+ac|0;a4=2;cr=cr-1|0}}cr=c[aq+24>>2]|0;a4=(c[aB>>2]|0)+cr|0;if((a4|0)<0){cY=0}else{cY=(a4|0)>51?51:a4}a4=c[1088+(cY<<2)>>2]|0;bB=(c[bV>>2]|0)+a4|0;if((bB|0)<0){cZ=0}else{cZ=(bB|0)>51?51:bB}bB=(c[cu>>2]|0)+a4|0;if((bB|0)<0){c_=0}else{c_=(bB|0)>51?51:bB}bB=d[4232+cZ|0]|0;c[h>>2]=bB;cn=d[4176+c_|0]|0;c[U>>2]=cn;ct=600+(cZ*3|0)|0;c[V>>2]=ct;do{if(!aw){cp=c[(c[as>>2]|0)+20>>2]|0;if((cp|0)==(c[aB>>2]|0)){c[al>>2]=bB;c[am>>2]=cn;c[an>>2]=ct;break}cq=cp+cr|0;if((cq|0)<0){c$=0}else{c$=(cq|0)>51?51:cq}cq=(a4+1+(c[1088+(c$<<2)>>2]|0)|0)>>>1;cp=cq+(c[bV>>2]|0)|0;if((cp|0)<0){c0=0}else{c0=(cp|0)>51?51:cp}cp=(c[cu>>2]|0)+cq|0;if((cp|0)<0){c1=0}else{c1=(cp|0)>51?51:cp}c[al>>2]=d[4232+c0|0]|0;c[am>>2]=d[4176+c1|0]|0;c[an>>2]=600+(c0*3|0)}}while(0);do{if(!au){as=c[(c[ar>>2]|0)+20>>2]|0;if((as|0)==(c[aB>>2]|0)){c[ai>>2]=bB;c[aj>>2]=cn;c[ak>>2]=ct;break}aw=as+cr|0;if((aw|0)<0){c2=0}else{c2=(aw|0)>51?51:aw}aw=(a4+1+(c[1088+(c2<<2)>>2]|0)|0)>>>1;as=aw+(c[bV>>2]|0)|0;if((as|0)<0){c3=0}else{c3=(as|0)>51?51:as}as=(c[cu>>2]|0)+aw|0;if((as|0)<0){c4=0}else{c4=(as|0)>51?51:as}c[ai>>2]=d[4232+c3|0]|0;c[aj>>2]=d[4176+c4|0]|0;c[ak>>2]=600+(c3*3|0)}}while(0);cu=c[l>>2]|0;bV=(ao<<3)+af+(az<<6)|0;a4=cu+(bV+ag)|0;cr=cu+bV|0;bV=0;cu=e;ct=0;while(1){cn=cu+4|0;bB=c[cn>>2]|0;if((bB|0)!=0){aV(cr,bB,ae,n);aV(a4,c[cn>>2]|0,ae,n)}cn=cu+36|0;bB=c[cn>>2]|0;if((bB|0)!=0){aV(cr+W|0,bB,ae,n);aV(a4+W|0,c[cn>>2]|0,ae,n)}cn=cu+16|0;bB=cu+20|0;aB=c[bB>>2]|0;if((aB|0)!=0){aV(cr+4|0,aB,ad,n);aV(a4+4|0,c[bB>>2]|0,ad,n)}bB=cu+52|0;aB=c[bB>>2]|0;if((aB|0)!=0){aV(cr+ah|0,aB,ad,n);aV(a4+ah|0,c[bB>>2]|0,ad,n)}bB=cu|0;aB=c[bB>>2]|0;ar=cu+8|0;au=c[ar>>2]|0;do{if((aB|0)==(au|0)){if((aB|0)!=(c[cn>>2]|0)){cR=733;break}if((aB|0)!=(c[cu+24>>2]|0)){cR=733;break}if((aB|0)==0){break}as=j+(ct*12|0)|0;aW(cr,aB,as,n);aW(a4,c[bB>>2]|0,as,n)}else{cR=733}}while(0);do{if((cR|0)==733){cR=0;if((aB|0)==0){c5=au}else{as=j+(ct*12|0)|0;aX(cr,aB,as,n);aX(a4,c[bB>>2]|0,as,n);c5=c[ar>>2]|0}if((c5|0)!=0){as=j+(ct*12|0)|0;aX(cr+2|0,c5,as,n);aX(a4+2|0,c[ar>>2]|0,as,n)}as=cn|0;aw=c[as>>2]|0;if((aw|0)!=0){cp=j+(ct*12|0)|0;aX(cr+4|0,aw,cp,n);aX(a4+4|0,c[as>>2]|0,cp,n)}cp=cu+24|0;as=c[cp>>2]|0;if((as|0)==0){break}aw=j+(ct*12|0)|0;aX(cr+6|0,as,aw,n);aX(a4+6|0,c[cp>>2]|0,aw,n)}}while(0);cn=bV+1|0;if(cn>>>0<2>>>0){a4=a4+$|0;cr=cr+$|0;bV=cn;cu=cu+64|0;ct=2}else{break}}}}while(0);f=ao+1|0;ct=(f|0)==(k|0);cu=(ct&1)+ap|0;if(cu>>>0<(c[m>>2]|0)>>>0){ao=ct?0:f;ap=cu;aq=aq+216|0}else{break}}i=g;return}function aU(a,d){a=a|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0;e=a+28|0;f=a+32|0;if((b[f>>1]|0)==0){g=(b[e>>1]|0)!=0?2:0}else{g=2}c[d+32>>2]=g;g=a+34|0;if((b[g>>1]|0)==0){h=(b[a+30>>1]|0)!=0?2:0}else{h=2}c[d+40>>2]=h;h=a+40|0;if((b[h>>1]|0)==0){i=(b[a+36>>1]|0)!=0?2:0}else{i=2}c[d+48>>2]=i;i=a+42|0;if((b[i>>1]|0)==0){j=(b[a+38>>1]|0)!=0?2:0}else{j=2}c[d+56>>2]=j;j=a+44|0;if((b[j>>1]|0)==0){k=(b[f>>1]|0)!=0?2:0}else{k=2}c[d+64>>2]=k;k=a+46|0;if((b[k>>1]|0)==0){l=(b[g>>1]|0)!=0?2:0}else{l=2}c[d+72>>2]=l;l=a+52|0;if((b[l>>1]|0)==0){m=(b[h>>1]|0)!=0?2:0}else{m=2}c[d+80>>2]=m;m=a+54|0;if((b[m>>1]|0)==0){n=(b[i>>1]|0)!=0?2:0}else{n=2}c[d+88>>2]=n;n=a+48|0;if((b[n>>1]|0)==0){o=(b[j>>1]|0)!=0?2:0}else{o=2}c[d+96>>2]=o;o=a+50|0;if((b[o>>1]|0)==0){p=(b[k>>1]|0)!=0?2:0}else{p=2}c[d+104>>2]=p;p=a+56|0;if((b[p>>1]|0)==0){q=(b[l>>1]|0)!=0?2:0}else{q=2}c[d+112>>2]=q;q=a+58|0;if((b[q>>1]|0)==0){r=(b[m>>1]|0)!=0?2:0}else{r=2}c[d+120>>2]=r;r=a+30|0;if((b[r>>1]|0)==0){s=(b[e>>1]|0)!=0?2:0}else{s=2}c[d+12>>2]=s;s=a+36|0;if((b[s>>1]|0)==0){t=(b[r>>1]|0)!=0?2:0}else{t=2}c[d+20>>2]=t;if((b[a+38>>1]|0)==0){u=(b[s>>1]|0)!=0?2:0}else{u=2}c[d+28>>2]=u;if((b[g>>1]|0)==0){v=(b[f>>1]|0)!=0?2:0}else{v=2}c[d+44>>2]=v;if((b[h>>1]|0)==0){w=(b[g>>1]|0)!=0?2:0}else{w=2}c[d+52>>2]=w;if((b[i>>1]|0)==0){x=(b[h>>1]|0)!=0?2:0}else{x=2}c[d+60>>2]=x;if((b[k>>1]|0)==0){y=(b[j>>1]|0)!=0?2:0}else{y=2}c[d+76>>2]=y;if((b[l>>1]|0)==0){z=(b[k>>1]|0)!=0?2:0}else{z=2}c[d+84>>2]=z;if((b[m>>1]|0)==0){A=(b[l>>1]|0)!=0?2:0}else{A=2}c[d+92>>2]=A;if((b[o>>1]|0)==0){B=(b[n>>1]|0)!=0?2:0}else{B=2}c[d+108>>2]=B;if((b[p>>1]|0)==0){C=(b[o>>1]|0)!=0?2:0}else{C=2}c[d+116>>2]=C;if((b[q>>1]|0)!=0){D=2;E=d+124|0;c[E>>2]=D;return}D=(b[p>>1]|0)!=0?2:0;E=d+124|0;c[E>>2]=D;return}function aV(b,e,f,g){b=b|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0;h=b-1|0;i=a[b+1|0]|0;j=d[h]|0;k=d[b]|0;l=j-k|0;m=f+4|0;do{if(((l|0)<0?-l|0:l)>>>0<(c[m>>2]|0)>>>0){n=d[b-2|0]|0;o=n-j|0;p=c[f+8>>2]|0;if(((o|0)<0?-o|0:o)>>>0>=p>>>0){break}o=i&255;q=o-k|0;if(((q|0)<0?-q|0:q)>>>0>=p>>>0){break}if(e>>>0>=4>>>0){a[h]=(j+2+o+(n<<1)|0)>>>2&255;a[b]=(k+2+(o<<1)+n|0)>>>2&255;break}p=d[(c[f>>2]|0)+(e-1)|0]|0;q=p+1|0;r=4-o+(k-j<<2)+n>>3;n=~p;if((r|0)<(n|0)){s=n}else{s=(r|0)>(q|0)?q:r}r=a[1296+((k|512)-s)|0]|0;a[h]=a[1296+((j|512)+s)|0]|0;a[b]=r}}while(0);s=b+g|0;j=b+(g-1)|0;h=d[j]|0;k=d[s]|0;i=h-k|0;if(((i|0)<0?-i|0:i)>>>0>=(c[m>>2]|0)>>>0){return}m=d[b+(g-2)|0]|0;i=m-h|0;l=c[f+8>>2]|0;if(((i|0)<0?-i|0:i)>>>0>=l>>>0){return}i=d[b+(g+1)|0]|0;g=i-k|0;if(((g|0)<0?-g|0:g)>>>0>=l>>>0){return}if(e>>>0>=4>>>0){a[j]=(h+2+i+(m<<1)|0)>>>2&255;a[s]=(k+2+(i<<1)+m|0)>>>2&255;return}l=d[(c[f>>2]|0)+(e-1)|0]|0;e=l+1|0;f=4-i+(k-h<<2)+m>>3;m=~l;if((f|0)<(m|0)){t=m}else{t=(f|0)>(e|0)?e:f}f=a[1296+((k|512)-t)|0]|0;a[j]=a[1296+((h|512)+t)|0]|0;a[s]=f;return}function aW(b,e,f,g){b=b|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0;if(e>>>0>=4>>>0){h=-g|0;i=f+4|0;j=h<<1;k=f+8|0;l=7;m=b;while(1){n=m+h|0;o=a[m+g|0]|0;p=d[n]|0;q=d[m]|0;r=p-q|0;do{if(((r|0)<0?-r|0:r)>>>0<(c[i>>2]|0)>>>0){s=d[m+j|0]|0;t=s-p|0;u=c[k>>2]|0;if(((t|0)<0?-t|0:t)>>>0>=u>>>0){break}t=o&255;v=t-q|0;if(((v|0)<0?-v|0:v)>>>0>=u>>>0){break}a[n]=(p+2+t+(s<<1)|0)>>>2&255;a[m]=(q+2+(t<<1)+s|0)>>>2&255}}while(0);if((l|0)==0){break}l=l-1|0;m=m+1|0}return}m=d[(c[f>>2]|0)+(e-1)|0]|0;e=m+1|0;l=-g|0;k=f+4|0;j=l<<1;i=f+8|0;f=~m;m=7;h=b;while(1){b=h+l|0;q=a[h+g|0]|0;p=d[b]|0;n=d[h]|0;o=p-n|0;do{if(((o|0)<0?-o|0:o)>>>0<(c[k>>2]|0)>>>0){r=d[h+j|0]|0;s=r-p|0;t=c[i>>2]|0;if(((s|0)<0?-s|0:s)>>>0>=t>>>0){break}s=q&255;u=s-n|0;if(((u|0)<0?-u|0:u)>>>0>=t>>>0){break}t=4-s+(n-p<<2)+r>>3;if((t|0)<(f|0)){w=f}else{w=(t|0)>(e|0)?e:t}t=a[1296+((n|512)-w)|0]|0;a[b]=a[1296+((p|512)+w)|0]|0;a[h]=t}}while(0);if((m|0)==0){break}m=m-1|0;h=h+1|0}return}function aX(b,e,f,g){b=b|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0;h=d[(c[f>>2]|0)+(e-1)|0]|0;e=h+1|0;i=-g|0;j=f+4|0;k=i<<1;l=f+8|0;f=~h;h=b+i|0;i=a[b+g|0]|0;m=d[h]|0;n=d[b]|0;o=m-n|0;p=c[j>>2]|0;do{if(((o|0)<0?-o|0:o)>>>0<p>>>0){q=d[b+k|0]|0;r=q-m|0;s=c[l>>2]|0;if(((r|0)<0?-r|0:r)>>>0>=s>>>0){t=p;break}r=i&255;u=r-n|0;if(((u|0)<0?-u|0:u)>>>0>=s>>>0){t=p;break}s=4-r+(n-m<<2)+q>>3;if((s|0)<(f|0)){v=f}else{v=(s|0)>(e|0)?e:s}s=a[1296+((n|512)-v)|0]|0;a[h]=a[1296+((m|512)+v)|0]|0;a[b]=s;t=c[j>>2]|0}else{t=p}}while(0);p=b+1|0;j=b+(1-g)|0;v=d[j]|0;m=d[p]|0;h=v-m|0;if(((h|0)<0?-h|0:h)>>>0>=t>>>0){return}t=d[b+(k|1)|0]|0;k=t-v|0;h=c[l>>2]|0;if(((k|0)<0?-k|0:k)>>>0>=h>>>0){return}k=d[b+(g+1)|0]|0;g=k-m|0;if(((g|0)<0?-g|0:g)>>>0>=h>>>0){return}h=4-k+(m-v<<2)+t>>3;if((h|0)<(f|0)){w=f}else{w=(h|0)>(e|0)?e:h}h=a[1296+((m|512)-w)|0]|0;a[j]=a[1296+((v|512)+w)|0]|0;a[p]=h;return}function aY(b,e,f,g){b=b|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0;h=c[f+4>>2]|0;i=c[f+8>>2]|0;if(e>>>0>=4>>>0){j=(h>>>2)+2|0;k=4;l=b;while(1){m=l-2|0;n=d[m]|0;o=l-1|0;p=d[o]|0;q=d[l]|0;r=l+1|0;s=d[r]|0;t=p-q|0;u=(t|0)<0?-t|0:t;L1152:do{if(u>>>0<h>>>0){t=n-p|0;if(((t|0)<0?-t|0:t)>>>0>=i>>>0){break}t=s-q|0;if(((t|0)<0?-t|0:t)>>>0>=i>>>0){break}t=l-3|0;v=d[t]|0;w=l+2|0;x=d[w]|0;do{if(u>>>0<j>>>0){y=v-p|0;if(((y|0)<0?-y|0:y)>>>0<i>>>0){y=p+n+q|0;a[o]=(s+4+(y<<1)+v|0)>>>3&255;a[m]=(y+2+v|0)>>>2&255;a[t]=(y+4+(v*3|0)+((d[l-4|0]|0)<<1)|0)>>>3&255}else{a[o]=(p+2+(n<<1)+s|0)>>>2&255}y=x-q|0;if(((y|0)<0?-y|0:y)>>>0>=i>>>0){break}y=q+p+s|0;a[l]=(n+4+(y<<1)+x|0)>>>3&255;a[r]=(y+2+x|0)>>>2&255;a[w]=(y+4+(x*3|0)+((d[l+3|0]|0)<<1)|0)>>>3&255;break L1152}else{a[o]=(p+2+(n<<1)+s|0)>>>2&255}}while(0);a[l]=(n+2+q+(s<<1)|0)>>>2&255}}while(0);s=k-1|0;if((s|0)==0){break}else{k=s;l=l+g|0}}return}l=d[(c[f>>2]|0)+(e-1)|0]|0;e=-l|0;f=l+1|0;k=4;j=b;while(1){b=j-2|0;s=d[b]|0;q=j-1|0;n=d[q]|0;p=d[j]|0;o=j+1|0;r=d[o]|0;m=n-p|0;do{if(((m|0)<0?-m|0:m)>>>0<h>>>0){u=s-n|0;if(((u|0)<0?-u|0:u)>>>0>=i>>>0){break}u=r-p|0;if(((u|0)<0?-u|0:u)>>>0>=i>>>0){break}u=d[j-3|0]|0;x=d[j+2|0]|0;w=u-n|0;if(((w|0)<0?-w|0:w)>>>0<i>>>0){w=((n+1+p|0)>>>1)-(s<<1)+u>>1;if((w|0)<(e|0)){z=e}else{z=(w|0)>(l|0)?l:w}a[b]=z+s&255;A=f}else{A=l}w=x-p|0;if(((w|0)<0?-w|0:w)>>>0<i>>>0){w=((n+1+p|0)>>>1)-(r<<1)+x>>1;if((w|0)<(e|0)){B=e}else{B=(w|0)>(l|0)?l:w}a[o]=B+r&255;C=A+1|0}else{C=A}w=s+4-r+(p-n<<2)>>3;x=-C|0;if((w|0)<(x|0)){D=x}else{D=(w|0)>(C|0)?C:w}w=a[1296+((p|512)-D)|0]|0;a[q]=a[1296+((n|512)+D)|0]|0;a[j]=w}}while(0);n=k-1|0;if((n|0)==0){break}else{k=n;j=j+g|0}}return}function aZ(b,e,f,g){b=b|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0;h=d[(c[f>>2]|0)+(e-1)|0]|0;e=-g|0;i=e<<1;j=f+4|0;k=f+8|0;f=g*-3|0;l=-h|0;m=h+1|0;n=g<<1;o=3;p=b;while(1){b=p+i|0;q=p+e|0;r=p+g|0;s=a[r]|0;t=d[q]|0;u=d[p]|0;v=t-u|0;do{if(((v|0)<0?-v|0:v)>>>0<(c[j>>2]|0)>>>0){w=d[b]|0;x=w-t|0;y=c[k>>2]|0;if(((x|0)<0?-x|0:x)>>>0>=y>>>0){break}x=s&255;z=x-u|0;if(((z|0)<0?-z|0:z)>>>0>=y>>>0){break}z=d[p+f|0]|0;A=z-t|0;if(((A|0)<0?-A|0:A)>>>0<y>>>0){A=((t+1+u|0)>>>1)-(w<<1)+z>>1;if((A|0)<(l|0)){B=l}else{B=(A|0)>(h|0)?h:A}a[b]=B+w&255;C=m;D=c[k>>2]|0}else{C=h;D=y}y=d[p+n|0]|0;A=y-u|0;if(((A|0)<0?-A|0:A)>>>0<D>>>0){A=((t+1+u|0)>>>1)-(x<<1)+y>>1;if((A|0)<(l|0)){E=l}else{E=(A|0)>(h|0)?h:A}a[r]=E+x&255;F=C+1|0}else{F=C}A=4-x+(u-t<<2)+w>>3;w=-F|0;if((A|0)<(w|0)){G=w}else{G=(A|0)>(F|0)?F:A}A=a[1296+((u|512)-G)|0]|0;a[q]=a[1296+((t|512)+G)|0]|0;a[p]=A}}while(0);if((o|0)==0){break}o=o-1|0;p=p+1|0}return}function a_(a,b){a=a|0;b=b|0;var d=0,e=0;ca(a);d=cB(2112)|0;c[a+3376>>2]=d;if((d|0)==0){e=1;return e|0}if((b|0)==0){e=0;return e|0}c[a+1216>>2]=1;e=0;return e|0}function a$(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0;g=i;i=i+16|0;h=g|0;j=g+8|0;k=j;l=i;i=i+92|0;i=i+7&-8;m=i;i=i+72|0;n=i;i=i+20|0;i=i+7&-8;o=i;i=i+4|0;i=i+7&-8;p=i;i=i+4|0;i=i+7&-8;c[o>>2]=0;q=a+3344|0;do{if((c[q>>2]|0)==0){r=917}else{if((c[a+3348>>2]|0)!=(b|0)){r=917;break}s=n;t=a+3356|0;c[s>>2]=c[t>>2];c[s+4>>2]=c[t+4>>2];c[s+8>>2]=c[t+8>>2];c[s+12>>2]=c[t+12>>2];c[n+4>>2]=c[n>>2];c[n+8>>2]=0;c[n+16>>2]=0;c[f>>2]=c[a+3352>>2]}}while(0);do{if((r|0)==917){if((aO(b,d,n,f)|0)==0){t=a+3356|0;s=n;c[t>>2]=c[s>>2];c[t+4>>2]=c[s+4>>2];c[t+8>>2]=c[s+8>>2];c[t+12>>2]=c[s+12>>2];c[t+16>>2]=c[s+16>>2];c[a+3352>>2]=c[f>>2];c[a+3348>>2]=b;break}else{u=3;i=g;return u|0}}}while(0);c[q>>2]=0;if((bA(n,k)|0)!=0){u=3;i=g;return u|0}b=j;d=c[b>>2]|0;if((d|0)==0|d>>>0>12>>>0){u=0;i=g;return u|0}d=ci(n,k,a,o)|0;if((d|0)==65520){u=4;i=g;return u|0}else if((d|0)==0){L1245:do{if((c[o>>2]|0)==0){r=932}else{do{if((c[a+1184>>2]|0)!=0){if((c[a+16>>2]|0)==0){break}if((c[a+3380>>2]|0)!=0){u=3;i=g;return u|0}if((c[a+1188>>2]|0)==0){d=a+1220|0;s=a+1336|0;c[s>>2]=bb(d)|0;bf(d);aQ(a,s,0)|0}else{s=a+1336|0;d=c[a+1372>>2]|0;aQ(a,s,d)|0}c[f>>2]=0;c[q>>2]=1;c[a+1180>>2]=0;v=a+1336|0;w=a+1360|0;break L1245}}while(0);c[a+1188>>2]=0;c[a+1180>>2]=0;r=932}}while(0);do{if((r|0)==932){o=c[b>>2]|0;if((o|0)==8){if((bJ(n,m)|0)==0){cc(a,m)|0;u=0;i=g;return u|0}else{d=m+20|0;cC(c[d>>2]|0);c[d>>2]=0;d=m+24|0;cC(c[d>>2]|0);c[d>>2]=0;d=m+28|0;cC(c[d>>2]|0);c[d>>2]=0;d=m+44|0;cC(c[d>>2]|0);c[d>>2]=0;u=3;i=g;return u|0}}else if((o|0)==5|(o|0)==1){d=a+1180|0;if((c[d>>2]|0)!=0){u=0;i=g;return u|0}c[a+1184>>2]=1;do{if((cf(a)|0)!=0){c[a+1204>>2]=0;c[a+1208>>2]=e;b3(n,h)|0;s=a+8|0;t=c[s>>2]|0;x=cd(a,c[h>>2]|0,(c[b>>2]|0)==5|0)|0;if((x|0)!=0){c[a+4>>2]=256;c[a+12>>2]=0;c[s>>2]=32;c[a+16>>2]=0;c[a+3380>>2]=0;u=(x|0)==65535?5:4;i=g;return u|0}if((t|0)==(c[s>>2]|0)){break}t=c[a+16>>2]|0;c[p>>2]=1;x=a|0;y=c[x>>2]|0;if(y>>>0<32>>>0){z=c[a+20+(y<<2)>>2]|0}else{z=0}c[f>>2]=0;c[q>>2]=1;do{if((c[b>>2]|0)==5){y=b9(p,n,t,c[a+12>>2]|0,5)|0;if((c[p>>2]|y|0)!=0){r=952;break}if((c[a+1276>>2]|0)!=0|(z|0)==0){r=952;break}if((c[z+52>>2]|0)!=(c[t+52>>2]|0)){r=952;break}if((c[z+56>>2]|0)!=(c[t+56>>2]|0)){r=952;break}if((c[z+88>>2]|0)!=(c[t+88>>2]|0)){r=952;break}bi(a+1220|0)}else{r=952}}while(0);if((r|0)==952){c[a+1280>>2]=0}c[x>>2]=c[s>>2];u=2;i=g;return u|0}}while(0);if((c[a+3380>>2]|0)!=0){u=3;i=g;return u|0}t=a+1368|0;y=t|0;A=a+2356|0;B=a+16|0;if((b2(n,A,c[B>>2]|0,c[a+12>>2]|0,k)|0)!=0){u=3;i=g;return u|0}if((cf(a)|0)==0){C=a+1220|0}else{D=a+1220|0;do{if((c[b>>2]|0)!=5){if((bg(D,c[a+2368>>2]|0,(c[k+4>>2]|0)!=0|0,c[(c[B>>2]|0)+48>>2]|0)|0)==0){break}else{u=3}i=g;return u|0}}while(0);c[a+1336>>2]=bb(D)|0;C=D}B=t;E=A;cE(B|0,E|0,988)|0;c[a+1188>>2]=1;E=a+1360|0;B=E;F=c[j+4>>2]|0;c[B>>2]=c[j>>2];c[B+4>>2]=F;ch(a,c[a+1432>>2]|0);bf(C);if((a7(C,a+1436|0,c[a+1380>>2]|0,c[a+1412>>2]|0)|0)!=0){u=3;i=g;return u|0}F=a+1336|0;if((b$(n,a,F,y)|0)!=0){b0(a,c[t>>2]|0);u=3;i=g;return u|0}if((cg(a)|0)==0){u=0;i=g;return u|0}else{c[d>>2]=1;v=F;w=E;break}}else if((o|0)==7){if((bZ(n,l)|0)==0){cb(a,l)|0;u=0;i=g;return u|0}else{E=l+40|0;cC(c[E>>2]|0);c[E>>2]=0;E=l+84|0;cC(c[E>>2]|0);c[E>>2]=0;u=3;i=g;return u|0}}else{u=0;i=g;return u|0}}}while(0);aT(v,c[a+1212>>2]|0);ce(a);l=bI(a+1284|0,c[a+16>>2]|0,a+1368|0,w)|0;n=a+1188|0;do{if((c[n>>2]|0)!=0){C=a+1220|0;if((c[a+1364>>2]|0)==0){j=c[a+1380>>2]|0;k=(c[w>>2]|0)==5|0;b=c[a+1208>>2]|0;r=c[a+1204>>2]|0;a8(C,0,v,j,l,k,b,r)|0;break}else{r=a+1644|0;b=c[a+1380>>2]|0;k=(c[w>>2]|0)==5|0;j=c[a+1208>>2]|0;z=c[a+1204>>2]|0;a8(C,r,v,b,l,k,j,z)|0;break}}}while(0);c[a+1184>>2]=0;c[n>>2]=0;u=1;i=g;return u|0}else{u=3;i=g;return u|0}return 0}function a0(a){a=a|0;var b=0,d=0,e=0,f=0;b=0;while(1){d=a+20+(b<<2)|0;e=c[d>>2]|0;if((e|0)!=0){cC(c[e+40>>2]|0);c[(c[d>>2]|0)+40>>2]=0;cC(c[(c[d>>2]|0)+84>>2]|0);c[(c[d>>2]|0)+84>>2]=0;cC(c[d>>2]|0);c[d>>2]=0}d=b+1|0;if(d>>>0<32>>>0){b=d}else{f=0;break}}do{b=a+148+(f<<2)|0;d=c[b>>2]|0;if((d|0)!=0){cC(c[d+20>>2]|0);c[(c[b>>2]|0)+20>>2]=0;cC(c[(c[b>>2]|0)+24>>2]|0);c[(c[b>>2]|0)+24>>2]=0;cC(c[(c[b>>2]|0)+28>>2]|0);c[(c[b>>2]|0)+28>>2]=0;cC(c[(c[b>>2]|0)+44>>2]|0);c[(c[b>>2]|0)+44>>2]=0;cC(c[b>>2]|0);c[b>>2]=0}f=f+1|0;}while(f>>>0<256>>>0);f=a+3376|0;cC(c[f>>2]|0);c[f>>2]=0;f=a+1212|0;cC(c[f>>2]|0);c[f>>2]=0;f=a+1172|0;cC(c[f>>2]|0);c[f>>2]=0;be(a+1220|0);return}function a1(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0;f=bh(a+1220|0)|0;if((f|0)==0){g=0;return g|0}c[b>>2]=c[f+4>>2];c[d>>2]=c[f+12>>2];c[e>>2]=c[f+8>>2];g=c[f>>2]|0;return g|0}function a2(a){a=a|0;var b=0,d=0;b=c[a+16>>2]|0;if((b|0)==0){d=0;return d|0}d=c[b+52>>2]|0;return d|0}function a3(a){a=a|0;var b=0,d=0;b=c[a+16>>2]|0;if((b|0)==0){d=0;return d|0}d=c[b+56>>2]|0;return d|0}function a4(a,b,d,e,f,g){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0;h=a+16|0;a=c[h>>2]|0;do{if((a|0)!=0){if((c[a+60>>2]|0)==0){break}c[b>>2]=1;c[d>>2]=c[(c[h>>2]|0)+64>>2]<<1;i=c[h>>2]|0;c[e>>2]=(c[i+52>>2]<<4)-((c[i+68>>2]|0)+(c[i+64>>2]|0)<<1);c[f>>2]=c[(c[h>>2]|0)+72>>2]<<1;i=c[h>>2]|0;j=(c[i+56>>2]<<4)-((c[i+76>>2]|0)+(c[i+72>>2]|0)<<1)|0;c[g>>2]=j;return}}while(0);c[b>>2]=0;c[d>>2]=0;c[e>>2]=0;c[f>>2]=0;j=0;c[g>>2]=j;return}function a5(){return cB(3388)|0}function a6(a){a=a|0;cC(a);return}function a7(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0;f=a+40|0;g=c[f>>2]|0;if((g|0)!=0){h=a|0;i=a+32|0;j=0;k=g;while(1){g=c[h>>2]|0;if(((c[g+(j*40|0)+20>>2]|0)-1|0)>>>0<2>>>0){l=c[g+(j*40|0)+12>>2]|0;if(l>>>0>d>>>0){m=l-(c[i>>2]|0)|0}else{m=l}c[g+(j*40|0)+8>>2]=m;n=c[f>>2]|0}else{n=k}g=j+1|0;if(g>>>0<n>>>0){j=g;k=n}else{break}}}if((c[b>>2]|0)==0){o=0;return o|0}n=c[b+4>>2]|0;if(n>>>0>=3>>>0){o=0;return o|0}k=a+32|0;j=a+24|0;f=a|0;m=a+4|0;a=d;i=0;h=n;L1386:while(1){L1388:do{if(h>>>0<2>>>0){n=c[b+4+(i*12|0)+4>>2]|0;do{if((h|0)==0){g=a-n|0;if((g|0)>=0){p=g;break}p=(c[k>>2]|0)+g|0}else{g=n+a|0;l=c[k>>2]|0;p=g-((g|0)<(l|0)?0:l)|0}}while(0);if(p>>>0>d>>>0){q=p-(c[k>>2]|0)|0}else{q=p}n=c[j>>2]|0;if((n|0)==0){o=1;r=1065;break L1386}l=c[f>>2]|0;g=0;while(1){s=c[l+(g*40|0)+20>>2]|0;if((s-1|0)>>>0<2>>>0){if((c[l+(g*40|0)+8>>2]|0)==(q|0)){t=g;u=p;v=l;w=s;break L1388}}s=g+1|0;if(s>>>0<n>>>0){g=s}else{o=1;r=1067;break L1386}}}else{g=c[b+4+(i*12|0)+8>>2]|0;n=c[j>>2]|0;if((n|0)==0){o=1;r=1066;break L1386}l=c[f>>2]|0;s=0;while(1){if((c[l+(s*40|0)+20>>2]|0)==3){if((c[l+(s*40|0)+8>>2]|0)==(g|0)){t=s;u=a;v=l;w=3;break L1388}}x=s+1|0;if(x>>>0<n>>>0){s=x}else{o=1;r=1068;break L1386}}}}while(0);if(!((t|0)>-1&w>>>0>1>>>0)){o=1;r=1069;break}if(i>>>0<e>>>0){s=e;while(1){n=s-1|0;l=c[m>>2]|0;c[l+(s<<2)>>2]=c[l+(n<<2)>>2];if(n>>>0>i>>>0){s=n}else{break}}y=c[f>>2]|0}else{y=v}s=i+1|0;c[(c[m>>2]|0)+(i<<2)>>2]=y+(t*40|0);if(s>>>0<=e>>>0){n=s;l=s;while(1){g=c[m>>2]|0;x=c[g+(n<<2)>>2]|0;if((x|0)==((c[f>>2]|0)+(t*40|0)|0)){z=l}else{c[g+(l<<2)>>2]=x;z=l+1|0}x=n+1|0;if(x>>>0>e>>>0){break}else{n=x;l=z}}}l=c[b+4+(s*12|0)>>2]|0;if(l>>>0<3>>>0){a=u;i=s;h=l}else{o=0;r=1070;break}}if((r|0)==1065){return o|0}else if((r|0)==1066){return o|0}else if((r|0)==1067){return o|0}else if((r|0)==1068){return o|0}else if((r|0)==1069){return o|0}else if((r|0)==1070){return o|0}return 0}function a8(a,b,d,e,f,g,h,i){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0,al=0,am=0,an=0,ao=0,ap=0,aq=0,ar=0;j=a+8|0;k=c[j>>2]|0;if((c[d>>2]|0)!=(c[k>>2]|0)){l=1;return l|0}d=a+52|0;c[d>>2]=0;m=a+56|0;n=(c[m>>2]|0)==0|0;L1436:do{if((b|0)==0){c[k+20>>2]=0;c[(c[j>>2]|0)+12>>2]=e;c[(c[j>>2]|0)+8>>2]=e;c[(c[j>>2]|0)+16>>2]=f;c[(c[j>>2]|0)+24>>2]=n;if((c[m>>2]|0)!=0){o=0;break}p=a+44|0;c[p>>2]=(c[p>>2]|0)+1;o=0}else{if((g|0)!=0){p=a+20|0;c[p>>2]=0;q=a+16|0;c[q>>2]=0;r=a|0;s=a+44|0;t=0;u=c[r>>2]|0;while(1){v=u+(t*40|0)+20|0;do{if((c[v>>2]|0)==0){w=u}else{c[v>>2]=0;x=c[r>>2]|0;if((c[x+(t*40|0)+24>>2]|0)!=0){w=x;break}c[s>>2]=(c[s>>2]|0)-1;w=x}}while(0);v=t+1|0;if(v>>>0<16>>>0){t=v;u=w}else{break}}u=c[m>>2]|0;L1449:do{if((u|0)==0){t=a+28|0;v=a+12|0;x=w;while(1){y=c[t>>2]|0;z=0;A=2147483647;B=0;while(1){if((c[x+(z*40|0)+24>>2]|0)==0){C=B;D=A}else{E=c[x+(z*40|0)+16>>2]|0;F=(E|0)<(A|0);C=F?x+(z*40|0)|0:B;D=F?E:A}E=z+1|0;if(E>>>0>y>>>0){break}else{z=E;A=D;B=C}}if((C|0)==0){G=0;break L1449}c[(c[v>>2]|0)+(c[q>>2]<<4)>>2]=c[C>>2];c[(c[v>>2]|0)+(c[q>>2]<<4)+12>>2]=c[C+36>>2];c[(c[v>>2]|0)+(c[q>>2]<<4)+4>>2]=c[C+28>>2];c[(c[v>>2]|0)+(c[q>>2]<<4)+8>>2]=c[C+32>>2];c[q>>2]=(c[q>>2]|0)+1;c[C+24>>2]=0;if((c[C+20>>2]|0)==0){c[s>>2]=(c[s>>2]|0)-1}B=c[m>>2]|0;if((B|0)!=0){G=B;break L1449}x=c[r>>2]|0}}else{G=u}}while(0);u=a+40|0;c[u>>2]=0;r=a+36|0;c[r>>2]=65535;c[a+48>>2]=0;if((c[b>>2]|G|0)!=0){c[q>>2]=0;c[p>>2]=0}x=(c[b+4>>2]|0)==0;c[(c[j>>2]|0)+20>>2]=x?2:3;c[r>>2]=x?65535:0;c[(c[j>>2]|0)+12>>2]=0;c[(c[j>>2]|0)+8>>2]=0;c[(c[j>>2]|0)+16>>2]=0;c[(c[j>>2]|0)+24>>2]=n;c[s>>2]=1;c[u>>2]=1;o=0;break}do{if((c[b+8>>2]|0)==0){u=a+40|0;x=c[u>>2]|0;if(x>>>0<(c[a+24>>2]|0)>>>0){H=e;I=0;J=x;break}if((x|0)==0){H=e;I=1;J=0;break}r=a|0;v=c[r>>2]|0;t=-1;B=0;A=0;while(1){if(((c[v+(A*40|0)+20>>2]|0)-1|0)>>>0<2>>>0){z=c[v+(A*40|0)+8>>2]|0;y=(z|0)<(B|0)|(t|0)==-1;K=y?z:B;L=y?A:t}else{K=B;L=t}y=A+1|0;if(y>>>0<x>>>0){t=L;B=K;A=y}else{break}}if((L|0)<=-1){H=e;I=1;J=x;break}c[v+(L*40|0)+20>>2]=0;A=(c[u>>2]|0)-1|0;c[u>>2]=A;if((c[(c[r>>2]|0)+(L*40|0)+24>>2]|0)!=0){H=e;I=0;J=A;break}B=a+44|0;c[B>>2]=(c[B>>2]|0)-1;H=e;I=0;J=A}else{A=a+24|0;B=a|0;t=a+40|0;y=a+44|0;z=a+36|0;E=a+48|0;F=a+28|0;M=a+16|0;N=a+12|0;O=0;P=0;Q=e;L1471:while(1){L1473:do{switch(c[b+12+(P*20|0)>>2]|0){case 1:{R=Q-(c[b+12+(P*20|0)+4>>2]|0)|0;S=c[A>>2]|0;if((S|0)==0){T=1;break L1471}U=c[B>>2]|0;V=0;while(1){W=U+(V*40|0)+20|0;if(((c[W>>2]|0)-1|0)>>>0<2>>>0){if((c[U+(V*40|0)+8>>2]|0)==(R|0)){break}}X=V+1|0;if(X>>>0<S>>>0){V=X}else{T=1;break L1471}}if((V|0)<0){T=1;break L1471}c[W>>2]=0;c[t>>2]=(c[t>>2]|0)-1;if((c[(c[B>>2]|0)+(V*40|0)+24>>2]|0)!=0){Y=Q;Z=O;break L1473}c[y>>2]=(c[y>>2]|0)-1;Y=Q;Z=O;break};case 2:{S=c[b+12+(P*20|0)+8>>2]|0;R=c[A>>2]|0;if((R|0)==0){T=1;break L1471}U=c[B>>2]|0;X=0;while(1){_=U+(X*40|0)+20|0;if((c[_>>2]|0)==3){if((c[U+(X*40|0)+8>>2]|0)==(S|0)){break}}$=X+1|0;if($>>>0<R>>>0){X=$}else{T=1;break L1471}}if((X|0)<0){T=1;break L1471}c[_>>2]=0;c[t>>2]=(c[t>>2]|0)-1;if((c[(c[B>>2]|0)+(X*40|0)+24>>2]|0)!=0){Y=Q;Z=O;break L1473}c[y>>2]=(c[y>>2]|0)-1;Y=Q;Z=O;break};case 3:{R=c[b+12+(P*20|0)+4>>2]|0;S=c[b+12+(P*20|0)+12>>2]|0;U=c[z>>2]|0;if((U|0)==65535|U>>>0<S>>>0){T=1;break L1471}U=c[A>>2]|0;if((U|0)==0){T=1;break L1471}V=c[B>>2]|0;$=0;while(1){aa=V+($*40|0)+20|0;if((c[aa>>2]|0)==3){if((c[V+($*40|0)+8>>2]|0)==(S|0)){ab=1119;break}}ac=$+1|0;if(ac>>>0<U>>>0){$=ac}else{ad=V;break}}do{if((ab|0)==1119){ab=0;c[aa>>2]=0;c[t>>2]=(c[t>>2]|0)-1;V=c[B>>2]|0;if((c[V+($*40|0)+24>>2]|0)!=0){ad=V;break}c[y>>2]=(c[y>>2]|0)-1;ad=V}}while(0);$=c[A>>2]|0;V=Q-R|0;if(($|0)==0){T=1;break L1471}else{ae=0}while(1){af=ad+(ae*40|0)+20|0;ag=c[af>>2]|0;if((ag-1|0)>>>0<2>>>0){if((c[ad+(ae*40|0)+8>>2]|0)==(V|0)){break}}U=ae+1|0;if(U>>>0<$>>>0){ae=U}else{T=1;break L1471}}if(!((ae|0)>-1&ag>>>0>1>>>0)){T=1;break L1471}c[af>>2]=3;c[(c[B>>2]|0)+(ae*40|0)+8>>2]=S;Y=Q;Z=O;break};case 4:{$=c[b+12+(P*20|0)+16>>2]|0;c[z>>2]=$;if((c[A>>2]|0)==0){Y=Q;Z=O;break L1473}V=0;R=c[B>>2]|0;while(1){U=R+(V*40|0)+20|0;do{if((c[U>>2]|0)==3){if((c[R+(V*40|0)+8>>2]|0)>>>0<=$>>>0){if((c[z>>2]|0)!=65535){ah=R;break}}c[U>>2]=0;c[t>>2]=(c[t>>2]|0)-1;X=c[B>>2]|0;if((c[X+(V*40|0)+24>>2]|0)!=0){ah=X;break}c[y>>2]=(c[y>>2]|0)-1;ah=X}else{ah=R}}while(0);U=V+1|0;if(U>>>0<(c[A>>2]|0)>>>0){V=U;R=ah}else{Y=Q;Z=O;break}}break};case 5:{R=0;V=c[B>>2]|0;while(1){$=V+(R*40|0)+20|0;do{if((c[$>>2]|0)==0){ai=V}else{c[$>>2]=0;S=c[B>>2]|0;if((c[S+(R*40|0)+24>>2]|0)!=0){ai=S;break}c[y>>2]=(c[y>>2]|0)-1;ai=S}}while(0);$=R+1|0;if($>>>0<16>>>0){R=$;V=ai}else{break}}L1532:do{if((c[m>>2]|0)==0){V=ai;while(1){R=c[F>>2]|0;$=0;S=2147483647;U=0;while(1){if((c[V+($*40|0)+24>>2]|0)==0){aj=U;ak=S}else{X=c[V+($*40|0)+16>>2]|0;ac=(X|0)<(S|0);aj=ac?V+($*40|0)|0:U;ak=ac?X:S}X=$+1|0;if(X>>>0>R>>>0){break}else{$=X;S=ak;U=aj}}if((aj|0)==0){break L1532}c[(c[N>>2]|0)+(c[M>>2]<<4)>>2]=c[aj>>2];c[(c[N>>2]|0)+(c[M>>2]<<4)+12>>2]=c[aj+36>>2];c[(c[N>>2]|0)+(c[M>>2]<<4)+4>>2]=c[aj+28>>2];c[(c[N>>2]|0)+(c[M>>2]<<4)+8>>2]=c[aj+32>>2];c[M>>2]=(c[M>>2]|0)+1;c[aj+24>>2]=0;if((c[aj+20>>2]|0)==0){c[y>>2]=(c[y>>2]|0)-1}if((c[m>>2]|0)!=0){break L1532}V=c[B>>2]|0}}}while(0);c[t>>2]=0;c[z>>2]=65535;c[E>>2]=0;c[d>>2]=1;Y=0;Z=O;break};case 6:{V=c[b+12+(P*20|0)+12>>2]|0;U=c[z>>2]|0;if((U|0)==65535|U>>>0<V>>>0){al=1;ab=1173;break L1471}U=c[A>>2]|0;L1549:do{if((U|0)==0){ab=1160}else{S=c[B>>2]|0;$=0;while(1){am=S+($*40|0)+20|0;if((c[am>>2]|0)==3){if((c[S+($*40|0)+8>>2]|0)==(V|0)){break}}R=$+1|0;if(R>>>0<U>>>0){$=R}else{ab=1160;break L1549}}c[am>>2]=0;S=(c[t>>2]|0)-1|0;c[t>>2]=S;if((c[(c[B>>2]|0)+($*40|0)+24>>2]|0)!=0){an=S;break}c[y>>2]=(c[y>>2]|0)-1;an=S}}while(0);if((ab|0)==1160){ab=0;an=c[t>>2]|0}if(an>>>0>=(c[A>>2]|0)>>>0){al=1;ab=1173;break L1471}c[(c[j>>2]|0)+12>>2]=Q;c[(c[j>>2]|0)+8>>2]=V;c[(c[j>>2]|0)+16>>2]=f;c[(c[j>>2]|0)+20>>2]=3;c[(c[j>>2]|0)+24>>2]=(c[m>>2]|0)==0;c[t>>2]=(c[t>>2]|0)+1;c[y>>2]=(c[y>>2]|0)+1;Y=Q;Z=1;break};case 0:{al=0;ab=1173;break L1471;break};default:{T=1;break L1471}}}while(0);O=Z;P=P+1|0;Q=Y}if((ab|0)==1173){T=al}if((O|0)!=0){o=T;break L1436}H=Q;I=T;J=c[t>>2]|0}}while(0);s=a+40|0;if(J>>>0>=(c[a+24>>2]|0)>>>0){o=1;break}c[(c[j>>2]|0)+12>>2]=H;c[(c[j>>2]|0)+8>>2]=H;c[(c[j>>2]|0)+16>>2]=f;c[(c[j>>2]|0)+20>>2]=2;c[(c[j>>2]|0)+24>>2]=n;p=a+44|0;c[p>>2]=(c[p>>2]|0)+1;c[s>>2]=(c[s>>2]|0)+1;o=I}}while(0);c[(c[j>>2]|0)+36>>2]=g;c[(c[j>>2]|0)+28>>2]=h;c[(c[j>>2]|0)+32>>2]=i;L1581:do{if((c[m>>2]|0)==0){i=a+44|0;h=c[i>>2]|0;g=a+28|0;I=c[g>>2]|0;if(h>>>0<=I>>>0){ao=I;break}n=a|0;f=a+16|0;H=a+12|0;J=I;I=1;T=h;while(1){do{if(I){h=c[n>>2]|0;al=0;ab=2147483647;Y=0;while(1){if((c[h+(al*40|0)+24>>2]|0)==0){ap=Y;aq=ab}else{Z=c[h+(al*40|0)+16>>2]|0;an=(Z|0)<(ab|0);ap=an?h+(al*40|0)|0:Y;aq=an?Z:ab}Z=al+1|0;if(Z>>>0>J>>>0){break}else{al=Z;ab=aq;Y=ap}}if((ap|0)==0){ar=T;break}c[(c[H>>2]|0)+(c[f>>2]<<4)>>2]=c[ap>>2];c[(c[H>>2]|0)+(c[f>>2]<<4)+12>>2]=c[ap+36>>2];c[(c[H>>2]|0)+(c[f>>2]<<4)+4>>2]=c[ap+28>>2];c[(c[H>>2]|0)+(c[f>>2]<<4)+8>>2]=c[ap+32>>2];c[f>>2]=(c[f>>2]|0)+1;c[ap+24>>2]=0;Y=c[i>>2]|0;if((c[ap+20>>2]|0)!=0){ar=Y;break}ab=Y-1|0;c[i>>2]=ab;ar=ab}else{ar=T}}while(0);t=c[g>>2]|0;if(ar>>>0<=t>>>0){ao=t;break L1581}J=t;I=(c[m>>2]|0)==0;T=ar}}else{T=a+16|0;I=a+12|0;c[(c[I>>2]|0)+(c[T>>2]<<4)>>2]=c[c[j>>2]>>2];c[(c[I>>2]|0)+(c[T>>2]<<4)+12>>2]=c[(c[j>>2]|0)+36>>2];c[(c[I>>2]|0)+(c[T>>2]<<4)+4>>2]=c[(c[j>>2]|0)+28>>2];c[(c[I>>2]|0)+(c[T>>2]<<4)+8>>2]=c[(c[j>>2]|0)+32>>2];c[T>>2]=(c[T>>2]|0)+1;ao=c[a+28>>2]|0}}while(0);a9(c[a>>2]|0,ao+1|0);l=o;return l|0}function a9(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0;d=i;i=i+24|0;e=d|0;f=d+8|0;g=7;do{if(g>>>0<b>>>0){h=g;do{j=a+(h*40|0)|0;k=c[j>>2]|0;l=c[j+4>>2]|0;j=c[a+(h*40|0)+8>>2]|0;m=a+(h*40|0)+12|0;n=c[m+4>>2]|0;c[e>>2]=c[m>>2];c[e+4>>2]=n;n=c[a+(h*40|0)+20>>2]|0;m=c[a+(h*40|0)+24>>2]|0;o=a+(h*40|0)+28|0;c[f>>2]=c[o>>2];c[f+4>>2]=c[o+4>>2];c[f+8>>2]=c[o+8>>2];L1607:do{if(h>>>0<g>>>0){p=h;q=1209}else{o=(m|0)==0;L1609:do{if((n|0)==0){r=h;while(1){s=r-g|0;if((c[a+(s*40|0)+20>>2]|0)!=0){t=r;break L1609}if((c[a+(s*40|0)+24>>2]|0)!=0|o){t=r;break L1609}u=a+(r*40|0)|0;v=a+(s*40|0)|0;cE(u|0,v|0,40)|0;if(s>>>0<g>>>0){p=s;q=1209;break L1607}else{r=s}}}else{if((n-1|0)>>>0<2>>>0){w=h}else{r=h;while(1){s=r-g|0;v=c[a+(s*40|0)+20>>2]|0;if((v|0)!=0){if((v-1|0)>>>0<2>>>0){t=r;break L1609}if((c[a+(s*40|0)+8>>2]|0)<=(j|0)){t=r;break L1609}}v=a+(r*40|0)|0;u=a+(s*40|0)|0;cE(v|0,u|0,40)|0;if(s>>>0<g>>>0){p=s;q=1209;break L1607}else{r=s}}}while(1){r=w-g|0;s=c[a+(r*40|0)+20>>2]|0;if((s|0)!=0&(s-1|0)>>>0<2>>>0){s=c[a+(r*40|0)+8>>2]|0;if((s|0)>(j|0)){t=w;break L1609}u=a+(w*40|0)|0;if((s|0)<(j|0)){x=u}else{y=u;break L1607}}else{x=a+(w*40|0)|0}u=x;s=a+(r*40|0)|0;cE(u|0,s|0,40)|0;if(r>>>0<g>>>0){p=r;q=1209;break L1607}else{w=r}}}}while(0);y=a+(t*40|0)|0}}while(0);if((q|0)==1209){q=0;y=a+(p*40|0)|0}o=y;c[o>>2]=k;c[o+4>>2]=l;c[y+8>>2]=j;o=y+12|0;r=c[e+4>>2]|0;c[o>>2]=c[e>>2];c[o+4>>2]=r;c[y+20>>2]=n;c[y+24>>2]=m;r=y+28|0;c[r>>2]=c[f>>2];c[r+4>>2]=c[f+4>>2];c[r+8>>2]=c[f+8>>2];h=h+1|0;}while(h>>>0<b>>>0)}g=g>>>1;}while((g|0)!=0);i=d;return}function ba(a,b){a=a|0;b=b|0;var d=0,e=0;do{if(b>>>0>16>>>0){d=0}else{e=c[(c[a+4>>2]|0)+(b<<2)>>2]|0;if((e|0)==0){d=0;break}if((c[e+20>>2]|0)>>>0<=1>>>0){d=0;break}d=c[e>>2]|0}}while(0);return d|0}function bb(a){a=a|0;var b=0;b=(c[a>>2]|0)+((c[a+28>>2]|0)*40|0)|0;c[a+8>>2]=b;return c[b>>2]|0}function bc(a,b,d,e,f,g){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;c[a+36>>2]=65535;h=e>>>0>1>>>0?e:1;c[a+24>>2]=h;e=a+28|0;i=(g|0)==0?d:h;c[e>>2]=i;c[a+32>>2]=f;c[a+56>>2]=g;c[a+44>>2]=0;c[a+40>>2]=0;c[a+48>>2]=0;g=cB(680)|0;f=g;h=a|0;c[h>>2]=f;if((g|0)==0){j=65535;return j|0}cD(g|0,0,680);do{if((i|0)==-1){k=0}else{g=b*384|0|47;d=0;l=f;while(1){c[l+(d*40|0)+4>>2]=cB(g)|0;m=c[h>>2]|0;n=c[m+(d*40|0)+4>>2]|0;if((n|0)==0){j=65535;o=1234;break}c[m+(d*40|0)>>2]=n+(-n&15);n=d+1|0;p=c[e>>2]|0;if(n>>>0>=(p+1|0)>>>0){o=1230;break}d=n;l=c[h>>2]|0}if((o|0)==1230){k=(p<<4)+16|0;break}else if((o|0)==1234){return j|0}}}while(0);o=cB(68)|0;c[a+4>>2]=o;p=cB(k)|0;c[a+12>>2]=p;if((o|0)==0|(p|0)==0){j=65535;return j|0}cD(o|0,0,68);c[a+20>>2]=0;c[a+16>>2]=0;j=0;return j|0}function bd(a,b,d,e,f,g){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0;h=a|0;i=c[h>>2]|0;do{if((i|0)==0){j=0}else{k=a+28|0;if((c[k>>2]|0)==-1){j=i;break}else{l=0;m=i}while(1){cC(c[m+(l*40|0)+4>>2]|0);c[(c[h>>2]|0)+(l*40|0)+4>>2]=0;n=l+1|0;o=c[h>>2]|0;if(n>>>0<((c[k>>2]|0)+1|0)>>>0){l=n;m=o}else{j=o;break}}}}while(0);cC(j);c[h>>2]=0;h=a+4|0;cC(c[h>>2]|0);c[h>>2]=0;h=a+12|0;cC(c[h>>2]|0);c[h>>2]=0;return bc(a,b,d,e,f,g)|0}function be(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0;b=a|0;d=c[b>>2]|0;do{if((d|0)==0){e=0}else{f=a+28|0;if((c[f>>2]|0)==-1){e=d;break}else{g=0;h=d}while(1){cC(c[h+(g*40|0)+4>>2]|0);c[(c[b>>2]|0)+(g*40|0)+4>>2]=0;i=g+1|0;j=c[b>>2]|0;if(i>>>0<((c[f>>2]|0)+1|0)>>>0){g=i;h=j}else{e=j;break}}}}while(0);cC(e);c[b>>2]=0;b=a+4|0;cC(c[b>>2]|0);c[b>>2]=0;b=a+12|0;cC(c[b>>2]|0);c[b>>2]=0;return}function bf(a){a=a|0;var b=0,d=0,e=0;b=a+40|0;if((c[b>>2]|0)==0){return}d=a|0;e=a+4|0;a=0;do{c[(c[e>>2]|0)+(a<<2)>>2]=(c[d>>2]|0)+(a*40|0);a=a+1|0;}while(a>>>0<(c[b>>2]|0)>>>0);return}function bg(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0;f=a+16|0;c[f>>2]=0;c[a+20>>2]=0;if((e|0)==0){g=0;return g|0}e=a+48|0;h=c[e>>2]|0;i=(h|0)==(b|0);L1683:do{if(i){j=1288}else{k=a+32|0;l=((h+1|0)>>>0)%((c[k>>2]|0)>>>0)|0;if((l|0)==(b|0)){j=1288;break}m=a+28|0;n=a|0;o=c[(c[n>>2]|0)+((c[m>>2]|0)*40|0)>>2]|0;p=a+40|0;q=a+24|0;r=a+44|0;s=a+56|0;t=a+12|0;u=l;L1686:while(1){l=c[p>>2]|0;if((l|0)==0){v=0}else{w=0;x=l;while(1){l=c[n>>2]|0;if(((c[l+(w*40|0)+20>>2]|0)-1|0)>>>0<2>>>0){y=c[l+(w*40|0)+12>>2]|0;if(y>>>0>u>>>0){z=y-(c[k>>2]|0)|0}else{z=y}c[l+(w*40|0)+8>>2]=z;A=c[p>>2]|0}else{A=x}l=w+1|0;if(l>>>0<A>>>0){w=l;x=A}else{v=A;break}}}do{if(v>>>0>=(c[q>>2]|0)>>>0){if((v|0)==0){g=1;j=1296;break L1686}x=c[n>>2]|0;w=-1;l=0;y=0;while(1){if(((c[x+(y*40|0)+20>>2]|0)-1|0)>>>0<2>>>0){B=c[x+(y*40|0)+8>>2]|0;C=(B|0)<(l|0)|(w|0)==-1;D=C?B:l;E=C?y:w}else{D=l;E=w}C=y+1|0;if(C>>>0<v>>>0){w=E;l=D;y=C}else{break}}if((E|0)<=-1){g=1;j=1298;break L1686}c[x+(E*40|0)+20>>2]=0;c[p>>2]=(c[p>>2]|0)-1;if((c[(c[n>>2]|0)+(E*40|0)+24>>2]|0)!=0){break}c[r>>2]=(c[r>>2]|0)-1}}while(0);y=c[r>>2]|0;l=c[m>>2]|0;if(y>>>0<l>>>0){F=l}else{w=l;l=y;while(1){do{if((c[s>>2]|0)==0){y=c[n>>2]|0;C=0;B=2147483647;G=0;while(1){if((c[y+(C*40|0)+24>>2]|0)==0){H=G;I=B}else{J=c[y+(C*40|0)+16>>2]|0;K=(J|0)<(B|0);H=K?y+(C*40|0)|0:G;I=K?J:B}J=C+1|0;if(J>>>0>w>>>0){break}else{C=J;B=I;G=H}}if((H|0)==0){L=l;break}c[(c[t>>2]|0)+(c[f>>2]<<4)>>2]=c[H>>2];c[(c[t>>2]|0)+(c[f>>2]<<4)+12>>2]=c[H+36>>2];c[(c[t>>2]|0)+(c[f>>2]<<4)+4>>2]=c[H+28>>2];c[(c[t>>2]|0)+(c[f>>2]<<4)+8>>2]=c[H+32>>2];c[f>>2]=(c[f>>2]|0)+1;c[H+24>>2]=0;G=c[r>>2]|0;if((c[H+20>>2]|0)!=0){L=G;break}B=G-1|0;c[r>>2]=B;L=B}else{L=l}}while(0);x=c[m>>2]|0;if(L>>>0<x>>>0){F=x;break}else{w=x;l=L}}}c[(c[n>>2]|0)+(F*40|0)+20>>2]=1;c[(c[n>>2]|0)+((c[m>>2]|0)*40|0)+12>>2]=u;c[(c[n>>2]|0)+((c[m>>2]|0)*40|0)+8>>2]=u;c[(c[n>>2]|0)+((c[m>>2]|0)*40|0)+16>>2]=0;c[(c[n>>2]|0)+((c[m>>2]|0)*40|0)+24>>2]=0;c[r>>2]=(c[r>>2]|0)+1;c[p>>2]=(c[p>>2]|0)+1;a9(c[n>>2]|0,(c[m>>2]|0)+1|0);l=((u+1|0)>>>0)%((c[k>>2]|0)>>>0)|0;if((l|0)==(b|0)){j=1282;break}else{u=l}}if((j|0)==1296){return g|0}else if((j|0)==1298){return g|0}else if((j|0)==1282){u=c[f>>2]|0;if((u|0)==0){j=1290;break}else{M=0}while(1){if(M>>>0>=u>>>0){j=1290;break L1683}N=c[(c[t>>2]|0)+(M<<4)>>2]|0;O=c[m>>2]|0;P=c[n>>2]|0;if((N|0)==(c[P+(O*40|0)>>2]|0)){Q=0;break}else{M=M+1|0}}while(1){if(Q>>>0>=O>>>0){j=1290;break L1683}R=P+(Q*40|0)|0;if((c[R>>2]|0)==(o|0)){break}else{Q=Q+1|0}}c[R>>2]=N;c[(c[n>>2]|0)+((c[m>>2]|0)*40|0)>>2]=o;j=1290;break}}}while(0);do{if((j|0)==1288){if((d|0)==0){S=h;break}if(i){g=1}else{j=1290;break}return g|0}}while(0);do{if((j|0)==1290){if((d|0)==0){S=c[e>>2]|0;break}c[e>>2]=b;g=0;return g|0}}while(0);if((S|0)==(b|0)){g=0;return g|0}S=c[a+32>>2]|0;c[e>>2]=((b-1+S|0)>>>0)%(S>>>0)|0;g=0;return g|0}function bh(a){a=a|0;var b=0,d=0,e=0,f=0;b=a+20|0;d=c[b>>2]|0;if(d>>>0>=(c[a+16>>2]|0)>>>0){e=0;return e|0}f=c[a+12>>2]|0;c[b>>2]=d+1;e=f+(d<<4)|0;return e|0}function bi(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;b=a|0;d=c[b>>2]|0;if((d|0)==0){return}c[a+60>>2]=1;e=a+56|0;if((c[e>>2]|0)!=0){return}f=a+28|0;g=a+16|0;h=a+12|0;i=a+44|0;a=d;while(1){d=c[f>>2]|0;j=0;k=2147483647;l=0;while(1){if((c[a+(j*40|0)+24>>2]|0)==0){m=l;n=k}else{o=c[a+(j*40|0)+16>>2]|0;p=(o|0)<(k|0);m=p?a+(j*40|0)|0:l;n=p?o:k}o=j+1|0;if(o>>>0>d>>>0){break}else{j=o;k=n;l=m}}if((m|0)==0){q=1322;break}c[(c[h>>2]|0)+(c[g>>2]<<4)>>2]=c[m>>2];c[(c[h>>2]|0)+(c[g>>2]<<4)+12>>2]=c[m+36>>2];c[(c[h>>2]|0)+(c[g>>2]<<4)+4>>2]=c[m+28>>2];c[(c[h>>2]|0)+(c[g>>2]<<4)+8>>2]=c[m+32>>2];c[g>>2]=(c[g>>2]|0)+1;c[m+24>>2]=0;if((c[m+20>>2]|0)==0){c[i>>2]=(c[i>>2]|0)-1}if((c[e>>2]|0)!=0){q=1323;break}a=c[b>>2]|0}if((q|0)==1323){return}else if((q|0)==1322){return}}function bj(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0;d=c[a+4>>2]|0;e=c[a+16>>2]|0;f=c[a+20>>2]|0;g=d<<2;h=b+256|0;i=16;j=c[a+12>>2]|0;a=b;while(1){k=c[a+4>>2]|0;c[j>>2]=c[a>>2];c[j+4>>2]=k;k=c[a+12>>2]|0;c[j+8>>2]=c[a+8>>2];c[j+12>>2]=k;k=i-1|0;if((k|0)==0){break}else{i=k;j=j+(g<<2)|0;a=a+16|0}}a=e;g=f;j=d<<1&2147483646;i=c[b+260>>2]|0;c[a>>2]=c[h>>2];c[e+4>>2]=i;i=c[b+268>>2]|0;c[a+(j<<2)>>2]=c[b+264>>2];c[a+((j|1)<<2)>>2]=i;i=d<<2;e=c[b+276>>2]|0;c[a+(i<<2)>>2]=c[b+272>>2];c[a+((i|1)<<2)>>2]=e;e=i+j|0;i=c[b+284>>2]|0;c[a+(e<<2)>>2]=c[b+280>>2];c[a+((e|1)<<2)>>2]=i;i=e+j|0;e=c[b+292>>2]|0;c[a+(i<<2)>>2]=c[b+288>>2];c[a+((i|1)<<2)>>2]=e;e=i+j|0;i=c[b+300>>2]|0;c[a+(e<<2)>>2]=c[b+296>>2];c[a+((e|1)<<2)>>2]=i;i=e+j|0;e=c[b+308>>2]|0;c[a+(i<<2)>>2]=c[b+304>>2];c[a+((i|1)<<2)>>2]=e;e=i+j|0;i=c[b+316>>2]|0;c[a+(e<<2)>>2]=c[b+312>>2];c[a+((e|1)<<2)>>2]=i;i=c[b+324>>2]|0;c[g>>2]=c[b+320>>2];c[f+4>>2]=i;i=c[b+332>>2]|0;c[g+(j<<2)>>2]=c[b+328>>2];c[g+((j|1)<<2)>>2]=i;i=d<<2;d=c[b+340>>2]|0;c[g+(i<<2)>>2]=c[b+336>>2];c[g+((i|1)<<2)>>2]=d;d=i+j|0;i=c[b+348>>2]|0;c[g+(d<<2)>>2]=c[b+344>>2];c[g+((d|1)<<2)>>2]=i;i=d+j|0;d=c[b+356>>2]|0;c[g+(i<<2)>>2]=c[b+352>>2];c[g+((i|1)<<2)>>2]=d;d=i+j|0;i=c[b+364>>2]|0;c[g+(d<<2)>>2]=c[b+360>>2];c[g+((d|1)<<2)>>2]=i;i=d+j|0;d=c[b+372>>2]|0;c[g+(i<<2)>>2]=c[b+368>>2];c[g+((i|1)<<2)>>2]=d;d=i+j|0;j=c[b+380>>2]|0;c[g+(d<<2)>>2]=c[b+376>>2];c[g+((d|1)<<2)>>2]=j;return}function bk(b,e,f,g){b=b|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0;h=c[b+4>>2]|0;i=Z(c[b+8>>2]|0,h)|0;j=(e>>>0)%(h>>>0)|0;k=c[b>>2]|0;b=e-j|0;e=(b<<8)+(j<<4)|0;l=i<<8;m=j<<3;j=h<<4;n=h<<2&1073741820;o=n<<1;p=o+n|0;q=0;do{r=c[2640+(q<<2)>>2]|0;s=c[2576+(q<<2)>>2]|0;t=(s<<4)+r|0;u=f+t|0;v=e+r+(Z(s,j)|0)|0;s=k+v|0;r=c[g+(q<<6)>>2]|0;if((r|0)==16777215){w=s;x=c[f+(t+16)>>2]|0;c[w>>2]=c[u>>2];c[w+(n<<2)>>2]=x;x=c[f+(t+48)>>2]|0;c[w+(o<<2)>>2]=c[f+(t+32)>>2];c[w+(p<<2)>>2]=x}else{x=d[f+(t+1)|0]|0;w=c[g+(q<<6)+4>>2]|0;a[s]=a[1296+(r+512+(d[u]|0))|0]|0;u=d[f+(t+2)|0]|0;r=c[g+(q<<6)+8>>2]|0;a[k+(v+1)|0]=a[1296+((x|512)+w)|0]|0;w=d[f+(t+3)|0]|0;x=c[g+(q<<6)+12>>2]|0;a[k+(v+2)|0]=a[1296+(r+512+u)|0]|0;a[k+(v+3)|0]=a[1296+(x+512+w)|0]|0;w=v+j|0;v=d[f+(t+17)|0]|0;x=c[g+(q<<6)+20>>2]|0;a[k+w|0]=a[1296+((c[g+(q<<6)+16>>2]|0)+512+(d[f+(t+16)|0]|0))|0]|0;u=d[f+(t+18)|0]|0;r=c[g+(q<<6)+24>>2]|0;a[k+(w+1)|0]=a[1296+((v|512)+x)|0]|0;x=d[f+(t+19)|0]|0;v=c[g+(q<<6)+28>>2]|0;a[k+(w+2)|0]=a[1296+(r+512+u)|0]|0;a[k+(w+3)|0]=a[1296+(v+512+x)|0]|0;x=w+j|0;w=d[f+(t+33)|0]|0;v=c[g+(q<<6)+36>>2]|0;a[k+x|0]=a[1296+((c[g+(q<<6)+32>>2]|0)+512+(d[f+(t+32)|0]|0))|0]|0;u=d[f+(t+34)|0]|0;r=c[g+(q<<6)+40>>2]|0;a[k+(x+1)|0]=a[1296+((w|512)+v)|0]|0;v=d[f+(t+35)|0]|0;w=c[g+(q<<6)+44>>2]|0;a[k+(x+2)|0]=a[1296+(r+512+u)|0]|0;a[k+(x+3)|0]=a[1296+(w+512+v)|0]|0;v=x+j|0;x=d[f+(t+49)|0]|0;w=c[g+(q<<6)+52>>2]|0;a[k+v|0]=a[1296+((c[g+(q<<6)+48>>2]|0)+512+(d[f+(t+48)|0]|0))|0]|0;u=d[f+(t+50)|0]|0;r=c[g+(q<<6)+56>>2]|0;a[k+(v+1)|0]=a[1296+((x|512)+w)|0]|0;w=d[f+(t+51)|0]|0;t=c[g+(q<<6)+60>>2]|0;a[k+(v+2)|0]=a[1296+(r+512+u)|0]|0;a[k+(v+3)|0]=a[1296+(t+512+w)|0]|0}q=q+1|0;}while(q>>>0<16>>>0);q=i<<6;i=h<<3&2147483640;h=f+256|0;j=f+320|0;f=m+l+(b<<6)|0;b=i>>>2;l=i>>>1;m=l+b|0;p=16;do{o=p&3;n=c[2640+(o<<2)>>2]|0;e=c[2576+(o<<2)>>2]|0;o=p>>>0>19>>>0;w=o?j:h;t=(e<<3)+n|0;v=w+t|0;u=f+(o?q:0)+n+(Z(e,i)|0)|0;e=k+u|0;n=c[g+(p<<6)>>2]|0;if((n|0)==16777215){o=e;r=c[w+(t+8)>>2]|0;c[o>>2]=c[v>>2];c[o+(b<<2)>>2]=r;r=c[w+(t+24)>>2]|0;c[o+(l<<2)>>2]=c[w+(t+16)>>2];c[o+(m<<2)>>2]=r}else{r=d[w+(t+1)|0]|0;o=c[g+(p<<6)+4>>2]|0;a[e]=a[1296+(n+512+(d[v]|0))|0]|0;v=d[w+(t+2)|0]|0;n=c[g+(p<<6)+8>>2]|0;a[k+(u+1)|0]=a[1296+((r|512)+o)|0]|0;o=d[w+(t+3)|0]|0;r=c[g+(p<<6)+12>>2]|0;a[k+(u+2)|0]=a[1296+(n+512+v)|0]|0;a[k+(u+3)|0]=a[1296+(r+512+o)|0]|0;o=u+i|0;u=d[w+(t+9)|0]|0;r=c[g+(p<<6)+20>>2]|0;a[k+o|0]=a[1296+((c[g+(p<<6)+16>>2]|0)+512+(d[w+(t+8)|0]|0))|0]|0;v=d[w+(t+10)|0]|0;n=c[g+(p<<6)+24>>2]|0;a[k+(o+1)|0]=a[1296+((u|512)+r)|0]|0;r=d[w+(t+11)|0]|0;u=c[g+(p<<6)+28>>2]|0;a[k+(o+2)|0]=a[1296+(n+512+v)|0]|0;a[k+(o+3)|0]=a[1296+(u+512+r)|0]|0;r=o+i|0;o=d[w+(t+17)|0]|0;u=c[g+(p<<6)+36>>2]|0;a[k+r|0]=a[1296+((c[g+(p<<6)+32>>2]|0)+512+(d[w+(t+16)|0]|0))|0]|0;v=d[w+(t+18)|0]|0;n=c[g+(p<<6)+40>>2]|0;a[k+(r+1)|0]=a[1296+((o|512)+u)|0]|0;u=d[w+(t+19)|0]|0;o=c[g+(p<<6)+44>>2]|0;a[k+(r+2)|0]=a[1296+(n+512+v)|0]|0;a[k+(r+3)|0]=a[1296+(o+512+u)|0]|0;u=r+i|0;r=d[w+(t+25)|0]|0;o=c[g+(p<<6)+52>>2]|0;a[k+u|0]=a[1296+((c[g+(p<<6)+48>>2]|0)+512+(d[w+(t+24)|0]|0))|0]|0;v=d[w+(t+26)|0]|0;n=c[g+(p<<6)+56>>2]|0;a[k+(u+1)|0]=a[1296+((r|512)+o)|0]|0;o=d[w+(t+27)|0]|0;t=c[g+(p<<6)+60>>2]|0;a[k+(u+2)|0]=a[1296+(n+512+v)|0]|0;a[k+(u+3)|0]=a[1296+(t+512+o)|0]|0}p=p+1|0;}while(p>>>0<24>>>0);return}function bl(a,f,g,h,j,k){a=a|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0,al=0,am=0,an=0,ao=0,ap=0,aq=0,ar=0,as=0,at=0,au=0,av=0,aw=0,ax=0,ay=0,az=0,aA=0,aB=0,aC=0,aD=0,aE=0,aF=0,aG=0,aH=0,aI=0,aJ=0,aK=0,aL=0,aM=0,aN=0,aO=0,aP=0,aQ=0,aR=0,aS=0,aT=0,aU=0,aV=0,aW=0,aX=0,aY=0,aZ=0,a_=0,a$=0,a0=0,a1=0,a2=0,a3=0,a4=0,a5=0,a6=0,a7=0,a8=0,a9=0,bb=0,bc=0,bd=0,be=0,bf=0,bg=0,bh=0,bi=0,bl=0,bm=0,bn=0,bo=0,bp=0,bq=0,br=0,bs=0,bt=0,bu=0,bw=0,bx=0,bz=0,bA=0,bB=0,bD=0,bE=0,bF=0,bG=0,bH=0;l=i;i=i+24|0;m=l|0;n=c[j+4>>2]|0;o=(h>>>0)/(n>>>0)|0;p=o<<4;q=h-(Z(o,n)|0)<<4;c[m+4>>2]=n;c[m+8>>2]=c[j+8>>2];n=a|0;o=c[n>>2]|0;do{if((o|0)==3){r=b[f+160>>1]|0;s=b[f+162>>1]|0;u=c[f+144>>2]|0;v=a+4|0;w=c[a+200>>2]|0;do{if((w|0)==0){x=0;y=-1;z=0;A=0}else{if((c[w+4>>2]|0)!=(c[v>>2]|0)){x=0;y=-1;z=0;A=0;break}if((c[w>>2]|0)>>>0>=6>>>0){x=1;y=-1;z=0;A=0;break}B=w+152|0;C=e[B>>1]|e[B+2>>1]<<16;x=1;y=c[w+104>>2]|0;z=C>>>16&65535;A=C&65535}}while(0);L1806:do{if((y|0)==(u|0)){D=A;E=z}else{w=c[a+204>>2]|0;do{if((w|0)==0){F=1443}else{if((c[w+4>>2]|0)!=(c[v>>2]|0)){F=1443;break}if((c[w>>2]|0)>>>0>=6>>>0){G=0;H=0;I=-1;J=0;K=0;L=-1;break}C=w+172|0;B=e[C>>1]|e[C+2>>1]<<16;C=w+188|0;M=e[C>>1]|e[C+2>>1]<<16;G=B&65535;H=B>>>16&65535;I=c[w+108>>2]|0;J=M&65535;K=M>>>16&65535;L=c[w+112>>2]|0}}while(0);L1812:do{if((F|0)==1443){w=c[a+212>>2]|0;do{if((w|0)!=0){if((c[w+4>>2]|0)!=(c[v>>2]|0)){break}if((c[w>>2]|0)>>>0>=6>>>0){G=0;H=0;I=-1;J=0;K=0;L=-1;break L1812}M=w+192|0;B=e[M>>1]|e[M+2>>1]<<16;G=0;H=0;I=-1;J=B&65535;K=B>>>16&65535;L=c[w+112>>2]|0;break L1812}}while(0);if((x|0)==0){G=0;H=0;I=-1;J=0;K=0;L=-1}else{D=A;E=z;break L1806}}}while(0);w=(I|0)==(u|0);if(((w&1)+((L|0)==(u|0))|0)==1){D=w?G:J;E=w?H:K;break}w=A<<16>>16;B=G<<16>>16;M=J<<16>>16;if(G<<16>>16>A<<16>>16){N=w;O=B}else{N=(B|0)<(w|0)?B:w;O=w}if((O|0)<(M|0)){P=O&65535}else{P=((N|0)>(M|0)?N:M)&65535}M=z<<16>>16;w=H<<16>>16;B=K<<16>>16;if(H<<16>>16>z<<16>>16){Q=M;R=w}else{Q=(w|0)<(M|0)?w:M;R=M}if((R|0)<(B|0)){D=P;E=R&65535;break}D=P;E=((Q|0)>(B|0)?Q:B)&65535}}while(0);B=D+r&65535;M=E+s&65535;if(((B<<16>>16)+8192|0)>>>0>16383>>>0){S=1;i=l;return S|0}if(((M<<16>>16)+2048|0)>>>0>4095>>>0){S=1;i=l;return S|0}w=ba(g,u)|0;if((w|0)==0){S=1;i=l;return S|0}b[a+176>>1]=B;b[a+178>>1]=M;M=a+176|0;B=a+172|0;C=e[M>>1]|e[M+2>>1]<<16;t=C;b[B>>1]=t&65535;b[B+2>>1]=t>>16;B=a+168|0;t=C;b[B>>1]=t&65535;b[B+2>>1]=t>>16;B=a+164|0;t=C;b[B>>1]=t&65535;b[B+2>>1]=t>>16;B=a+144|0;t=C;b[B>>1]=t&65535;b[B+2>>1]=t>>16;B=a+140|0;t=C;b[B>>1]=t&65535;b[B+2>>1]=t>>16;B=a+136|0;t=C;b[B>>1]=t&65535;b[B+2>>1]=t>>16;B=a+132|0;t=C;b[B>>1]=t&65535;b[B+2>>1]=t>>16;c[a+100>>2]=u;c[a+108>>2]=u;B=a+116|0;c[B>>2]=w;c[a+124>>2]=w;w=b[f+164>>1]|0;M=b[f+166>>1]|0;T=c[f+148>>2]|0;U=c[a+208>>2]|0;do{if((U|0)==0){F=1465}else{if((c[U+4>>2]|0)!=(c[v>>2]|0)){F=1465;break}if((c[U>>2]|0)>>>0>=6>>>0){V=1;W=-1;X=0;Y=0;break}_=U+172|0;$=e[_>>1]|e[_+2>>1]<<16;V=1;W=c[U+108>>2]|0;X=$>>>16&65535;Y=$&65535}}while(0);do{if((F|0)==1465){U=c[a+204>>2]|0;if((U|0)==0){V=0;W=-1;X=0;Y=0;break}if((c[U+4>>2]|0)!=(c[v>>2]|0)){V=0;W=-1;X=0;Y=0;break}if((c[U>>2]|0)>>>0>=6>>>0){V=1;W=-1;X=0;Y=0;break}s=U+176|0;r=e[s>>1]|e[s+2>>1]<<16;V=1;W=c[U+108>>2]|0;X=r>>>16&65535;Y=r&65535}}while(0);L1853:do{if((W|0)==(T|0)){aa=Y;ab=X}else{r=c[a+204>>2]|0;do{if((r|0)==0){F=1474}else{if((c[r+4>>2]|0)!=(c[v>>2]|0)){F=1474;break}if((c[r>>2]|0)>>>0>=6>>>0){ac=0;ad=0;ae=-1;break}U=r+188|0;s=e[U>>1]|e[U+2>>1]<<16;ac=s>>>16&65535;ad=s&65535;ae=c[r+112>>2]|0}}while(0);do{if((F|0)==1474){if((V|0)!=0){ac=0;ad=0;ae=-1;break}aa=C&65535;ab=C>>>16&65535;break L1853}}while(0);r=(u|0)==(T|0);s=(ae|0)==(T|0);if(((s&1)+(r&1)|0)==1){if(r){aa=C&65535;ab=C>>>16&65535;break}else{aa=s?ad:Y;ab=s?ac:X;break}}s=C&65535;r=s<<16>>16;U=ad<<16>>16;$=Y<<16>>16;if(ad<<16>>16>s<<16>>16){af=r;ag=U}else{af=(U|0)<(r|0)?U:r;ag=r}if((ag|0)<($|0)){ah=ag&65535}else{ah=((af|0)>($|0)?af:$)&65535}$=C>>>16&65535;r=$<<16>>16;U=ac<<16>>16;s=X<<16>>16;if(ac<<16>>16>$<<16>>16){ai=r;aj=U}else{ai=(U|0)<(r|0)?U:r;aj=r}if((aj|0)<(s|0)){aa=ah;ab=aj&65535;break}aa=ah;ab=((ai|0)>(s|0)?ai:s)&65535}}while(0);C=aa+w&65535;u=ab+M&65535;if(((C<<16>>16)+8192|0)>>>0>16383>>>0){S=1;i=l;return S|0}if(((u<<16>>16)+2048|0)>>>0>4095>>>0){S=1;i=l;return S|0}v=ba(g,T)|0;if((v|0)==0){S=1;i=l;return S|0}else{s=a+148|0;b[a+192>>1]=C;b[a+194>>1]=u;u=a+192|0;C=a+188|0;r=e[u>>1]|e[u+2>>1]<<16;t=r;b[C>>1]=t&65535;b[C+2>>1]=t>>16;C=a+184|0;t=r;b[C>>1]=t&65535;b[C+2>>1]=t>>16;C=a+180|0;t=r;b[C>>1]=t&65535;b[C+2>>1]=t>>16;C=a+160|0;t=r;b[C>>1]=t&65535;b[C+2>>1]=t>>16;C=a+156|0;t=r;b[C>>1]=t&65535;b[C+2>>1]=t>>16;C=a+152|0;t=r;b[C>>1]=t&65535;b[C+2>>1]=t>>16;C=s;t=r;b[C>>1]=t&65535;b[C+2>>1]=t>>16;c[a+104>>2]=T;c[a+112>>2]=T;C=a+120|0;c[C>>2]=v;c[a+128>>2]=v;v=m|0;c[v>>2]=c[B>>2];bW(k,a+132|0,m,q,p,0,0,8,16);c[v>>2]=c[C>>2];bW(k,s,m,q,p,8,0,8,16);break}}else if((o|0)==0|(o|0)==1){s=c[f+144>>2]|0;C=a+4|0;v=c[a+200>>2]|0;do{if((v|0)==0){ak=0;al=-1;am=0}else{if((c[v+4>>2]|0)!=(c[C>>2]|0)){ak=0;al=-1;am=0;break}if((c[v>>2]|0)>>>0>=6>>>0){ak=1;al=-1;am=0;break}r=v+152|0;ak=1;al=c[v+104>>2]|0;am=e[r>>1]|e[r+2>>1]<<16}}while(0);v=c[a+204>>2]|0;do{if((v|0)==0){an=0;ao=-1;ap=0}else{if((c[v+4>>2]|0)!=(c[C>>2]|0)){an=0;ao=-1;ap=0;break}if((c[v>>2]|0)>>>0>=6>>>0){an=1;ao=-1;ap=0;break}B=v+172|0;an=1;ao=c[v+108>>2]|0;ap=e[B>>1]|e[B+2>>1]<<16}}while(0);do{if((o|0)==0){if((ak|0)==0|(an|0)==0){aq=0;ar=0;break}if((al|am|0)==0){aq=0;ar=0;break}if((ao|ap|0)==0){aq=0;ar=0}else{F=1352}}else{F=1352}}while(0);do{if((F|0)==1352){v=b[f+160>>1]|0;B=b[f+162>>1]|0;T=c[a+208>>2]|0;do{if((T|0)==0){F=1356}else{if((c[T+4>>2]|0)!=(c[C>>2]|0)){F=1356;break}if((c[T>>2]|0)>>>0>=6>>>0){as=0;at=0;au=-1;F=1361;break}M=T+172|0;w=e[M>>1]|e[M+2>>1]<<16;as=w&65535;at=w>>>16&65535;au=c[T+108>>2]|0;F=1361}}while(0);L1978:do{if((F|0)==1356){T=c[a+212>>2]|0;do{if((T|0)!=0){if((c[T+4>>2]|0)!=(c[C>>2]|0)){break}if((c[T>>2]|0)>>>0>=6>>>0){as=0;at=0;au=-1;F=1361;break L1978}w=T+192|0;M=e[w>>1]|e[w+2>>1]<<16;as=M&65535;at=M>>>16&65535;au=c[T+112>>2]|0;F=1361;break L1978}}while(0);if((ak|0)==0|(an|0)!=0){as=0;at=0;au=-1;F=1361;break}av=am&65535;aw=am>>>16&65535}}while(0);do{if((F|0)==1361){T=(al|0)==(s|0);M=(ao|0)==(s|0);if(((M&1)+(T&1)+((au|0)==(s|0))|0)==1){if(T){av=am&65535;aw=am>>>16&65535;break}if(!M){av=as;aw=at;break}av=ap&65535;aw=ap>>>16&65535;break}M=am&65535;T=M<<16>>16;w=ap&65535;r=w<<16>>16;u=as<<16>>16;if(w<<16>>16>M<<16>>16){ax=T;ay=r}else{ax=(r|0)<(T|0)?r:T;ay=T}if((ay|0)<(u|0)){az=ay&65535}else{az=((ax|0)>(u|0)?ax:u)&65535}u=am>>>16&65535;T=u<<16>>16;r=ap>>>16&65535;M=r<<16>>16;w=at<<16>>16;if(r<<16>>16>u<<16>>16){aA=T;aB=M}else{aA=(M|0)<(T|0)?M:T;aB=T}if((aB|0)<(w|0)){av=az;aw=aB&65535;break}av=az;aw=((aA|0)>(w|0)?aA:w)&65535}}while(0);w=av+v&65535;T=aw+B&65535;if(((w<<16>>16)+8192|0)>>>0>16383>>>0){S=1;i=l;return S|0}if(((T<<16>>16)+2048|0)>>>0>4095>>>0){S=1}else{aq=T;ar=w;break}i=l;return S|0}}while(0);C=ba(g,s)|0;if((C|0)==0){S=1;i=l;return S|0}else{b[a+192>>1]=ar;b[a+194>>1]=aq;w=a+192|0;T=a+188|0;M=e[w>>1]|e[w+2>>1]<<16;t=M;b[T>>1]=t&65535;b[T+2>>1]=t>>16;T=a+184|0;t=M;b[T>>1]=t&65535;b[T+2>>1]=t>>16;T=a+180|0;t=M;b[T>>1]=t&65535;b[T+2>>1]=t>>16;T=a+176|0;t=M;b[T>>1]=t&65535;b[T+2>>1]=t>>16;T=a+172|0;t=M;b[T>>1]=t&65535;b[T+2>>1]=t>>16;T=a+168|0;t=M;b[T>>1]=t&65535;b[T+2>>1]=t>>16;T=a+164|0;t=M;b[T>>1]=t&65535;b[T+2>>1]=t>>16;T=a+160|0;t=M;b[T>>1]=t&65535;b[T+2>>1]=t>>16;T=a+156|0;t=M;b[T>>1]=t&65535;b[T+2>>1]=t>>16;T=a+152|0;t=M;b[T>>1]=t&65535;b[T+2>>1]=t>>16;T=a+148|0;t=M;b[T>>1]=t&65535;b[T+2>>1]=t>>16;T=a+144|0;t=M;b[T>>1]=t&65535;b[T+2>>1]=t>>16;T=a+140|0;t=M;b[T>>1]=t&65535;b[T+2>>1]=t>>16;T=a+136|0;t=M;b[T>>1]=t&65535;b[T+2>>1]=t>>16;T=a+132|0;t=M;b[T>>1]=t&65535;b[T+2>>1]=t>>16;c[a+100>>2]=s;c[a+104>>2]=s;c[a+108>>2]=s;c[a+112>>2]=s;c[a+116>>2]=C;c[a+120>>2]=C;c[a+124>>2]=C;c[a+128>>2]=C;c[m>>2]=C;bW(k,a+132|0,m,q,p,0,0,16,16);break}}else if((o|0)==2){C=b[f+160>>1]|0;T=b[f+162>>1]|0;M=c[f+144>>2]|0;w=a+4|0;u=c[a+204>>2]|0;do{if((u|0)==0){aC=0;aD=-1;aE=0;aF=0}else{if((c[u+4>>2]|0)!=(c[w>>2]|0)){aC=0;aD=-1;aE=0;aF=0;break}if((c[u>>2]|0)>>>0>=6>>>0){aC=1;aD=-1;aE=0;aF=0;break}r=u+172|0;U=e[r>>1]|e[r+2>>1]<<16;aC=1;aD=c[u+108>>2]|0;aE=U>>>16&65535;aF=U&65535}}while(0);L2020:do{if((aD|0)==(M|0)){aG=aF;aH=aE}else{u=c[a+200>>2]|0;do{if((u|0)==0){aI=0;aJ=-1;aK=0;aL=0}else{if((c[u+4>>2]|0)!=(c[w>>2]|0)){aI=0;aJ=-1;aK=0;aL=0;break}if((c[u>>2]|0)>>>0>=6>>>0){aI=1;aJ=-1;aK=0;aL=0;break}s=u+152|0;U=e[s>>1]|e[s+2>>1]<<16;aI=1;aJ=c[u+104>>2]|0;aK=U>>>16&65535;aL=U&65535}}while(0);u=c[a+208>>2]|0;do{if((u|0)==0){F=1392}else{if((c[u+4>>2]|0)!=(c[w>>2]|0)){F=1392;break}if((c[u>>2]|0)>>>0>=6>>>0){aM=0;aN=0;aO=-1;break}B=u+172|0;v=e[B>>1]|e[B+2>>1]<<16;aM=v&65535;aN=v>>>16&65535;aO=c[u+108>>2]|0}}while(0);L2031:do{if((F|0)==1392){u=c[a+212>>2]|0;do{if((u|0)!=0){if((c[u+4>>2]|0)!=(c[w>>2]|0)){break}if((c[u>>2]|0)>>>0>=6>>>0){aM=0;aN=0;aO=-1;break L2031}v=u+192|0;B=e[v>>1]|e[v+2>>1]<<16;aM=B&65535;aN=B>>>16&65535;aO=c[u+112>>2]|0;break L2031}}while(0);if((aI|0)==0|(aC|0)!=0){aM=0;aN=0;aO=-1}else{aG=aL;aH=aK;break L2020}}}while(0);u=(aJ|0)==(M|0);if((((aO|0)==(M|0))+(u&1)|0)==1){aG=u?aL:aM;aH=u?aK:aN;break}u=aL<<16>>16;B=aF<<16>>16;v=aM<<16>>16;if(aF<<16>>16>aL<<16>>16){aP=u;aQ=B}else{aP=(B|0)<(u|0)?B:u;aQ=u}if((aQ|0)<(v|0)){aR=aQ&65535}else{aR=((aP|0)>(v|0)?aP:v)&65535}v=aK<<16>>16;u=aE<<16>>16;B=aN<<16>>16;if(aE<<16>>16>aK<<16>>16){aS=v;aT=u}else{aS=(u|0)<(v|0)?u:v;aT=v}if((aT|0)<(B|0)){aG=aR;aH=aT&65535;break}aG=aR;aH=((aS|0)>(B|0)?aS:B)&65535}}while(0);B=aG+C&65535;v=aH+T&65535;if(((B<<16>>16)+8192|0)>>>0>16383>>>0){S=1;i=l;return S|0}if(((v<<16>>16)+2048|0)>>>0>4095>>>0){S=1;i=l;return S|0}u=ba(g,M)|0;if((u|0)==0){S=1;i=l;return S|0}b[a+160>>1]=B;b[a+162>>1]=v;v=a+160|0;B=a+156|0;U=e[v>>1]|e[v+2>>1]<<16;t=U;b[B>>1]=t&65535;b[B+2>>1]=t>>16;B=a+152|0;t=U;b[B>>1]=t&65535;b[B+2>>1]=t>>16;B=a+148|0;t=U;b[B>>1]=t&65535;b[B+2>>1]=t>>16;B=a+144|0;t=U;b[B>>1]=t&65535;b[B+2>>1]=t>>16;B=a+140|0;t=U;b[B>>1]=t&65535;b[B+2>>1]=t>>16;B=a+136|0;t=U;b[B>>1]=t&65535;b[B+2>>1]=t>>16;B=a+132|0;t=U;b[B>>1]=t&65535;b[B+2>>1]=t>>16;c[a+100>>2]=M;c[a+104>>2]=M;B=a+116|0;c[B>>2]=u;c[a+120>>2]=u;u=b[f+164>>1]|0;v=b[f+166>>1]|0;s=c[f+148>>2]|0;r=c[a+200>>2]|0;$=(r|0)==0;do{if($){aU=-1;aV=0;aW=0}else{if((c[r+4>>2]|0)!=(c[w>>2]|0)){aU=-1;aV=0;aW=0;break}if((c[r>>2]|0)>>>0>=6>>>0){aU=-1;aV=0;aW=0;break}_=r+184|0;aX=e[_>>1]|e[_+2>>1]<<16;aU=c[r+112>>2]|0;aV=aX>>>16&65535;aW=aX&65535}}while(0);do{if((aU|0)==(s|0)){aY=aW;aZ=aV}else{do{if($){a_=-1;a$=0;a0=0}else{if((c[r+4>>2]|0)!=(c[w>>2]|0)){a_=-1;a$=0;a0=0;break}if((c[r>>2]|0)>>>0>=6>>>0){a_=-1;a$=0;a0=0;break}T=r+160|0;C=e[T>>1]|e[T+2>>1]<<16;a_=c[r+104>>2]|0;a$=C>>>16&65535;a0=C&65535}}while(0);C=(M|0)==(s|0);if((((a_|0)==(s|0))+(C&1)|0)==1){if(!C){aY=a0;aZ=a$;break}aY=U&65535;aZ=U>>>16&65535;break}C=aW<<16>>16;T=U&65535;aX=T<<16>>16;_=a0<<16>>16;if(T<<16>>16>aW<<16>>16){a1=C;a2=aX}else{a1=(aX|0)<(C|0)?aX:C;a2=C}if((a2|0)<(_|0)){a3=a2&65535}else{a3=((a1|0)>(_|0)?a1:_)&65535}_=aV<<16>>16;C=U>>>16&65535;aX=C<<16>>16;T=a$<<16>>16;if(C<<16>>16>aV<<16>>16){a4=_;a5=aX}else{a4=(aX|0)<(_|0)?aX:_;a5=_}if((a5|0)<(T|0)){aY=a3;aZ=a5&65535;break}aY=a3;aZ=((a4|0)>(T|0)?a4:T)&65535}}while(0);U=aY+u&65535;M=aZ+v&65535;if(((U<<16>>16)+8192|0)>>>0>16383>>>0){S=1;i=l;return S|0}if(((M<<16>>16)+2048|0)>>>0>4095>>>0){S=1;i=l;return S|0}r=ba(g,s)|0;if((r|0)==0){S=1;i=l;return S|0}else{w=a+164|0;b[a+192>>1]=U;b[a+194>>1]=M;M=a+192|0;U=a+188|0;$=e[M>>1]|e[M+2>>1]<<16;t=$;b[U>>1]=t&65535;b[U+2>>1]=t>>16;U=a+184|0;t=$;b[U>>1]=t&65535;b[U+2>>1]=t>>16;U=a+180|0;t=$;b[U>>1]=t&65535;b[U+2>>1]=t>>16;U=a+176|0;t=$;b[U>>1]=t&65535;b[U+2>>1]=t>>16;U=a+172|0;t=$;b[U>>1]=t&65535;b[U+2>>1]=t>>16;U=a+168|0;t=$;b[U>>1]=t&65535;b[U+2>>1]=t>>16;U=w;t=$;b[U>>1]=t&65535;b[U+2>>1]=t>>16;c[a+108>>2]=s;c[a+112>>2]=s;U=a+124|0;c[U>>2]=r;c[a+128>>2]=r;r=m|0;c[r>>2]=c[B>>2];bW(k,a+132|0,m,q,p,0,0,16,8);c[r>>2]=c[U>>2];bW(k,w,m,q,p,0,8,16,8);break}}else{w=a+4|0;U=0;L1890:while(1){r=f+176+(U<<2)|0;$=bv(c[r>>2]|0)|0;M=f+192+(U<<2)|0;c[a+100+(U<<2)>>2]=c[M>>2];T=ba(g,c[M>>2]|0)|0;c[a+116+(U<<2)>>2]=T;if((T|0)==0){S=1;F=1553;break}if(($|0)!=0){T=U<<2;_=a+132+(T<<2)|0;aX=a+132+(T<<2)+2|0;C=T|1;a6=a+132+(C<<2)|0;a7=a+132+(C<<2)+2|0;C=T|2;a8=a+132+(C<<2)|0;a9=a+132+(C<<2)+2|0;C=T|3;bb=a+132+(C<<2)|0;bc=a+132+(C<<2)+2|0;C=0;do{bd=b[f+208+(U<<4)+(C<<2)>>1]|0;be=b[f+208+(U<<4)+(C<<2)+2>>1]|0;bf=by(c[r>>2]|0)|0;bg=c[M>>2]|0;bh=bC(a,c[6400+(U<<7)+(bf<<5)+(C<<3)>>2]|0)|0;bi=d[6400+(U<<7)+(bf<<5)+(C<<3)+4|0]|0;do{if((bh|0)==0){bl=0;bm=-1;bn=0;bo=0}else{if((c[bh+4>>2]|0)!=(c[w>>2]|0)){bl=0;bm=-1;bn=0;bo=0;break}if((c[bh>>2]|0)>>>0>=6>>>0){bl=1;bm=-1;bn=0;bo=0;break}bp=bh+132+(bi<<2)|0;bq=e[bp>>1]|e[bp+2>>1]<<16;bl=1;bm=c[bh+100+(bi>>>2<<2)>>2]|0;bn=bq>>>16&65535;bo=bq&65535}}while(0);bi=bC(a,c[5696+(U<<7)+(bf<<5)+(C<<3)>>2]|0)|0;bh=d[5696+(U<<7)+(bf<<5)+(C<<3)+4|0]|0;do{if((bi|0)==0){br=0;bs=-1;bt=0;bu=0}else{if((c[bi+4>>2]|0)!=(c[w>>2]|0)){br=0;bs=-1;bt=0;bu=0;break}if((c[bi>>2]|0)>>>0>=6>>>0){br=1;bs=-1;bt=0;bu=0;break}bq=bi+132+(bh<<2)|0;bp=e[bq>>1]|e[bq+2>>1]<<16;br=1;bs=c[bi+100+(bh>>>2<<2)>>2]|0;bt=bp>>>16&65535;bu=bp&65535}}while(0);bh=bC(a,c[4992+(U<<7)+(bf<<5)+(C<<3)>>2]|0)|0;bi=d[4992+(U<<7)+(bf<<5)+(C<<3)+4|0]|0;do{if((bh|0)==0){F=1508}else{if((c[bh+4>>2]|0)!=(c[w>>2]|0)){F=1508;break}if((c[bh>>2]|0)>>>0>=6>>>0){bw=0;bx=0;bz=-1;F=1513;break}bp=bh+132+(bi<<2)|0;bq=e[bp>>1]|e[bp+2>>1]<<16;bw=bq&65535;bx=bq>>>16&65535;bz=c[bh+100+(bi>>>2<<2)>>2]|0;F=1513}}while(0);L1911:do{if((F|0)==1508){F=0;bi=bC(a,c[4288+(U<<7)+(bf<<5)+(C<<3)>>2]|0)|0;bh=d[4288+(U<<7)+(bf<<5)+(C<<3)+4|0]|0;do{if((bi|0)!=0){if((c[bi+4>>2]|0)!=(c[w>>2]|0)){break}if((c[bi>>2]|0)>>>0>=6>>>0){bw=0;bx=0;bz=-1;F=1513;break L1911}bq=bi+132+(bh<<2)|0;bp=e[bq>>1]|e[bq+2>>1]<<16;bw=bp&65535;bx=bp>>>16&65535;bz=c[bi+100+(bh>>>2<<2)>>2]|0;F=1513;break L1911}}while(0);if((bl|0)==0|(br|0)!=0){bw=0;bx=0;bz=-1;F=1513}else{bA=bo;bB=bn}}}while(0);do{if((F|0)==1513){F=0;bh=(bm|0)==(bg|0);bi=(bs|0)==(bg|0);if(((bi&1)+(bh&1)+((bz|0)==(bg|0))|0)==1){if(bh){bA=bo;bB=bn;break}bA=bi?bu:bw;bB=bi?bt:bx;break}bi=bo<<16>>16;bh=bu<<16>>16;bp=bw<<16>>16;if(bu<<16>>16>bo<<16>>16){bD=bi;bE=bh}else{bD=(bh|0)<(bi|0)?bh:bi;bE=bi}if((bE|0)<(bp|0)){bF=bE&65535}else{bF=((bD|0)>(bp|0)?bD:bp)&65535}bp=bn<<16>>16;bi=bt<<16>>16;bh=bx<<16>>16;if(bt<<16>>16>bn<<16>>16){bG=bp;bH=bi}else{bG=(bi|0)<(bp|0)?bi:bp;bH=bp}if((bH|0)<(bh|0)){bA=bF;bB=bH&65535;break}bA=bF;bB=((bG|0)>(bh|0)?bG:bh)&65535}}while(0);bg=bA+bd&65535;bh=bB+be&65535;if(((bg<<16>>16)+8192|0)>>>0>16383>>>0){S=1;F=1564;break L1890}if(((bh<<16>>16)+2048|0)>>>0>4095>>>0){S=1;F=1565;break L1890}if((bf|0)==0){b[_>>1]=bg;b[aX>>1]=bh;b[a6>>1]=bg;b[a7>>1]=bh;b[a8>>1]=bg;b[a9>>1]=bh;b[bb>>1]=bg;b[bc>>1]=bh}else if((bf|0)==1){bp=(C<<1)+T|0;b[a+132+(bp<<2)>>1]=bg;b[a+132+(bp<<2)+2>>1]=bh;bi=bp|1;b[a+132+(bi<<2)>>1]=bg;b[a+132+(bi<<2)+2>>1]=bh}else if((bf|0)==2){bi=C+T|0;b[a+132+(bi<<2)>>1]=bg;b[a+132+(bi<<2)+2>>1]=bh;bp=bi+2|0;b[a+132+(bp<<2)>>1]=bg;b[a+132+(bp<<2)+2>>1]=bh}else if((bf|0)==3){bp=C+T|0;b[a+132+(bp<<2)>>1]=bg;b[a+132+(bp<<2)+2>>1]=bh}C=C+1|0;}while(C>>>0<$>>>0)}$=U+1|0;if($>>>0<4>>>0){U=$}else{F=1533;break}}if((F|0)==1553){i=l;return S|0}else if((F|0)==1564){i=l;return S|0}else if((F|0)==1565){i=l;return S|0}else if((F|0)==1533){U=m|0;w=0;do{c[U>>2]=c[a+116+(w<<2)>>2];B=by(c[f+176+(w<<2)>>2]|0)|0;s=w<<3&8;v=w>>>0<2>>>0?0:8;if((B|0)==0){bW(k,a+132+(w<<2<<2)|0,m,q,p,s,v,8,8)}else if((B|0)==1){u=w<<2;bW(k,a+132+(u<<2)|0,m,q,p,s,v,8,4);bW(k,a+132+((u|2)<<2)|0,m,q,p,s,v|4,8,4)}else if((B|0)==2){B=w<<2;bW(k,a+132+(B<<2)|0,m,q,p,s,v,4,8);bW(k,a+132+((B|1)<<2)|0,m,q,p,s|4,v,4,8)}else{B=w<<2;bW(k,a+132+(B<<2)|0,m,q,p,s,v,4,4);u=s|4;bW(k,a+132+((B|1)<<2)|0,m,q,p,u,v,4,4);$=v|4;bW(k,a+132+((B|2)<<2)|0,m,q,p,s,$,4,4);bW(k,a+132+((B|3)<<2)|0,m,q,p,u,$,4,4)}w=w+1|0;}while(w>>>0<4>>>0)}}}while(0);if((c[a+196>>2]|0)>>>0>1>>>0){S=0;i=l;return S|0}if((c[n>>2]|0)==0){bj(j,k);S=0;i=l;return S|0}else{bk(j,h,k,f+328|0);S=0;i=l;return S|0}return 0}function bm(a,b,d,e,f,g){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0;h=i;i=i+72|0;j=h|0;k=h+40|0;l=j|0;m=k|0;bn(d,l,m,e);do{if((bt(c[a>>2]|0)|0)==1){e=bo(a,g,b+328|0,l,m,f)|0;if((e|0)==0){break}else{n=e}i=h;return n|0}else{e=bp(a,g,b,l,m,f)|0;if((e|0)==0){break}else{n=e}i=h;return n|0}}while(0);m=bq(a,g+256|0,b+1352|0,j+21|0,k+16|0,c[b+140>>2]|0,f)|0;if((m|0)!=0){n=m;i=h;return n|0}if((c[a+196>>2]|0)>>>0>1>>>0){n=0;i=h;return n|0}bj(d,g);n=0;i=h;return n|0}function bn(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;if((f|0)==0){return}g=c[b+4>>2]|0;h=Z(c[b+8>>2]|0,g)|0;i=(f>>>0)/(g>>>0)|0;j=Z(i,g)|0;k=f-j|0;l=g<<4;m=b|0;b=c[m>>2]|0;n=(k<<4)+(Z(g<<8,i)|0)|0;o=(i|0)!=0;if(o){p=n-(l|1)|0;a[d]=a[b+p|0]|0;a[d+1|0]=a[b+(p+1)|0]|0;a[d+2|0]=a[b+(p+2)|0]|0;a[d+3|0]=a[b+(p+3)|0]|0;a[d+4|0]=a[b+(p+4)|0]|0;a[d+5|0]=a[b+(p+5)|0]|0;a[d+6|0]=a[b+(p+6)|0]|0;a[d+7|0]=a[b+(p+7)|0]|0;a[d+8|0]=a[b+(p+8)|0]|0;a[d+9|0]=a[b+(p+9)|0]|0;a[d+10|0]=a[b+(p+10)|0]|0;a[d+11|0]=a[b+(p+11)|0]|0;a[d+12|0]=a[b+(p+12)|0]|0;a[d+13|0]=a[b+(p+13)|0]|0;a[d+14|0]=a[b+(p+14)|0]|0;a[d+15|0]=a[b+(p+15)|0]|0;a[d+16|0]=a[b+(p+16)|0]|0;a[d+17|0]=a[b+(p+17)|0]|0;a[d+18|0]=a[b+(p+18)|0]|0;a[d+19|0]=a[b+(p+19)|0]|0;a[d+20|0]=a[b+(p+20)|0]|0;q=d+21|0}else{q=d}d=(j|0)!=(f|0);if(d){f=n-1|0;a[e]=a[b+f|0]|0;n=f+l|0;a[e+1|0]=a[b+n|0]|0;f=n+l|0;a[e+2|0]=a[b+f|0]|0;n=f+l|0;a[e+3|0]=a[b+n|0]|0;f=n+l|0;a[e+4|0]=a[b+f|0]|0;n=f+l|0;a[e+5|0]=a[b+n|0]|0;f=n+l|0;a[e+6|0]=a[b+f|0]|0;n=f+l|0;a[e+7|0]=a[b+n|0]|0;f=n+l|0;a[e+8|0]=a[b+f|0]|0;n=f+l|0;a[e+9|0]=a[b+n|0]|0;f=n+l|0;a[e+10|0]=a[b+f|0]|0;n=f+l|0;a[e+11|0]=a[b+n|0]|0;f=n+l|0;a[e+12|0]=a[b+f|0]|0;n=f+l|0;a[e+13|0]=a[b+n|0]|0;f=n+l|0;a[e+14|0]=a[b+f|0]|0;a[e+15|0]=a[b+(f+l)|0]|0;r=e+16|0}else{r=e}e=g<<3&2147483640;l=c[m>>2]|0;m=(Z(i<<3,e)|0)+(h<<8)+(k<<3)|0;if(o){o=m-(e|1)|0;f=(Z((i<<3)-1|0,g<<3&2147483640)|0)+(h<<8)+(k<<3)|7;a[q]=a[l+o|0]|0;a[q+1|0]=a[l+(o+1)|0]|0;a[q+2|0]=a[l+(o+2)|0]|0;a[q+3|0]=a[l+(o+3)|0]|0;a[q+4|0]=a[l+(o+4)|0]|0;a[q+5|0]=a[l+(o+5)|0]|0;a[q+6|0]=a[l+(o+6)|0]|0;a[q+7|0]=a[l+(o+7)|0]|0;a[q+8|0]=a[l+(o+8)|0]|0;o=h<<6;b=f+(o-8)|0;a[q+9|0]=a[l+b|0]|0;a[q+10|0]=a[l+(b+1)|0]|0;a[q+11|0]=a[l+(b+2)|0]|0;a[q+12|0]=a[l+(b+3)|0]|0;a[q+13|0]=a[l+(b+4)|0]|0;a[q+14|0]=a[l+(b+5)|0]|0;a[q+15|0]=a[l+(b+6)|0]|0;a[q+16|0]=a[l+(b+7)|0]|0;a[q+17|0]=a[l+(f+o)|0]|0}if(!d){return}d=m-1|0;m=(Z(i<<3|7,g<<3&2147483640)|0)+(h<<8)+(k<<3)-1|0;a[r]=a[l+d|0]|0;k=d+e|0;a[r+1|0]=a[l+k|0]|0;d=k+e|0;a[r+2|0]=a[l+d|0]|0;k=d+e|0;a[r+3|0]=a[l+k|0]|0;d=k+e|0;a[r+4|0]=a[l+d|0]|0;k=d+e|0;a[r+5|0]=a[l+k|0]|0;d=k+e|0;a[r+6|0]=a[l+d|0]|0;a[r+7|0]=a[l+(d+e)|0]|0;d=m+(e+((h<<6)-(g<<6)))|0;a[r+8|0]=a[l+d|0]|0;g=d+e|0;a[r+9|0]=a[l+g|0]|0;d=g+e|0;a[r+10|0]=a[l+d|0]|0;g=d+e|0;a[r+11|0]=a[l+g|0]|0;d=g+e|0;a[r+12|0]=a[l+d|0]|0;g=d+e|0;a[r+13|0]=a[l+g|0]|0;d=g+e|0;a[r+14|0]=a[l+d|0]|0;a[r+15|0]=a[l+(d+e)|0]|0;return}function bo(b,e,f,g,h,i){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0;j=b+200|0;k=bH(b,c[j>>2]|0)|0;l=(i|0)==0;if((k|0)==0|l){m=k}else{i=(bt(c[c[j>>2]>>2]|0)|0)==2;m=i?0:k}k=b+204|0;i=bH(b,c[k>>2]|0)|0;if((i|0)==0|l){n=i}else{j=(bt(c[c[k>>2]>>2]|0)|0)==2;n=j?0:i}i=b+212|0;j=bH(b,c[i>>2]|0)|0;if((j|0)==0|l){o=j}else{l=(bt(c[c[i>>2]>>2]|0)|0)==2;o=l?0:j}j=bw(c[b>>2]|0)|0;if((j|0)==0){if((n|0)==0){p=1;return p|0}b=g+1|0;l=g+2|0;i=g+3|0;k=g+4|0;q=g+5|0;r=g+6|0;s=g+7|0;t=g+8|0;u=g+9|0;v=g+10|0;w=g+11|0;x=g+12|0;y=g+13|0;z=g+14|0;A=g+15|0;B=g+16|0;C=e;D=0;while(1){a[C]=a[b]|0;a[C+1|0]=a[l]|0;a[C+2|0]=a[i]|0;a[C+3|0]=a[k]|0;a[C+4|0]=a[q]|0;a[C+5|0]=a[r]|0;a[C+6|0]=a[s]|0;a[C+7|0]=a[t]|0;a[C+8|0]=a[u]|0;a[C+9|0]=a[v]|0;a[C+10|0]=a[w]|0;a[C+11|0]=a[x]|0;a[C+12|0]=a[y]|0;a[C+13|0]=a[z]|0;a[C+14|0]=a[A]|0;a[C+15|0]=a[B]|0;E=D+1|0;if(E>>>0<16>>>0){C=C+16|0;D=E}else{break}}}else if((j|0)==1){if((m|0)==0){p=1;return p|0}else{D=e;C=0;while(1){B=h+C|0;a[D]=a[B]|0;a[D+1|0]=a[B]|0;a[D+2|0]=a[B]|0;a[D+3|0]=a[B]|0;a[D+4|0]=a[B]|0;a[D+5|0]=a[B]|0;a[D+6|0]=a[B]|0;a[D+7|0]=a[B]|0;a[D+8|0]=a[B]|0;a[D+9|0]=a[B]|0;a[D+10|0]=a[B]|0;a[D+11|0]=a[B]|0;a[D+12|0]=a[B]|0;a[D+13|0]=a[B]|0;a[D+14|0]=a[B]|0;a[D+15|0]=a[B]|0;B=C+1|0;if(B>>>0<16>>>0){D=D+16|0;C=B}else{break}}}}else if((j|0)==2){j=g+1|0;C=(m|0)!=0;D=(n|0)==0;do{if(D|C^1){if(C){F=((d[h]|0)+8+(d[h+1|0]|0)+(d[h+2|0]|0)+(d[h+3|0]|0)+(d[h+4|0]|0)+(d[h+5|0]|0)+(d[h+6|0]|0)+(d[h+7|0]|0)+(d[h+8|0]|0)+(d[h+9|0]|0)+(d[h+10|0]|0)+(d[h+11|0]|0)+(d[h+12|0]|0)+(d[h+13|0]|0)+(d[h+14|0]|0)+(d[h+15|0]|0)|0)>>>4&255;break}if(D){F=-128;break}F=((d[j]|0)+8+(d[g+2|0]|0)+(d[g+3|0]|0)+(d[g+4|0]|0)+(d[g+5|0]|0)+(d[g+6|0]|0)+(d[g+7|0]|0)+(d[g+8|0]|0)+(d[g+9|0]|0)+(d[g+10|0]|0)+(d[g+11|0]|0)+(d[g+12|0]|0)+(d[g+13|0]|0)+(d[g+14|0]|0)+(d[g+15|0]|0)+(d[g+16|0]|0)|0)>>>4&255}else{B=0;A=0;while(1){z=B+1|0;G=(d[g+z|0]|0)+A+(d[h+B|0]|0)|0;if(z>>>0<16>>>0){B=z;A=G}else{break}}F=(G+16|0)>>>5&255}}while(0);cD(e|0,F|0,256)}else{if((m|0)==0|(n|0)==0|(o|0)==0){p=1;return p|0}o=d[g+16|0]|0;n=d[h+15|0]|0;m=d[g]|0;F=(((d[g+9|0]|0)-(d[g+7|0]|0)+((d[g+10|0]|0)-(d[g+6|0]|0)<<1)+(((d[g+11|0]|0)-(d[g+5|0]|0)|0)*3|0)+((d[g+12|0]|0)-(d[g+4|0]|0)<<2)+(((d[g+13|0]|0)-(d[g+3|0]|0)|0)*5|0)+(((d[g+14|0]|0)-(d[g+2|0]|0)|0)*6|0)+(((d[g+15|0]|0)-(d[g+1|0]|0)|0)*7|0)+(o-m<<3)|0)*5|0)+32>>6;g=(((d[h+8|0]|0)-(d[h+6|0]|0)+(n-m<<3)+((d[h+9|0]|0)-(d[h+5|0]|0)<<1)+(((d[h+10|0]|0)-(d[h+4|0]|0)|0)*3|0)+((d[h+11|0]|0)-(d[h+3|0]|0)<<2)+(((d[h+12|0]|0)-(d[h+2|0]|0)|0)*5|0)+(((d[h+13|0]|0)-(d[h+1|0]|0)|0)*6|0)+(((d[h+14|0]|0)-(d[h]|0)|0)*7|0)|0)*5|0)+32>>6;h=(n+o<<4)+16|0;o=0;do{n=h+(Z(o-7|0,g)|0)|0;m=o<<4;G=0;do{j=n+(Z(G-7|0,F)|0)>>5;if((j|0)<0){H=0}else{H=(j|0)>255?-1:j&255}a[e+(G+m)|0]=H;G=G+1|0;}while(G>>>0<16>>>0);o=o+1|0;}while(o>>>0<16>>>0)}br(e,f|0,0);br(e,f+64|0,1);br(e,f+128|0,2);br(e,f+192|0,3);br(e,f+256|0,4);br(e,f+320|0,5);br(e,f+384|0,6);br(e,f+448|0,7);br(e,f+512|0,8);br(e,f+576|0,9);br(e,f+640|0,10);br(e,f+704|0,11);br(e,f+768|0,12);br(e,f+832|0,13);br(e,f+896|0,14);br(e,f+960|0,15);p=0;return p|0}function bp(b,e,f,g,h,i){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0;j=(i|0)==0;i=0;L2186:while(1){k=bD(i)|0;l=c[k+4>>2]|0;m=bC(b,c[k>>2]|0)|0;k=bH(b,m)|0;if((k|0)==0|j){n=k}else{o=(bt(c[m>>2]|0)|0)==2;n=o?0:k}k=bE(i)|0;o=c[k+4>>2]|0;p=bC(b,c[k>>2]|0)|0;k=bH(b,p)|0;if((k|0)==0|j){q=k}else{r=(bt(c[p>>2]|0)|0)==2;q=r?0:k}k=(n|0)!=0;r=(q|0)==0;s=r|k^1;if(s){t=2}else{if((bt(c[m>>2]|0)|0)==0){u=d[(l&255)+(m+82)|0]|0}else{u=2}if((bt(c[p>>2]|0)|0)==0){v=d[(o&255)+(p+82)|0]|0}else{v=2}t=u>>>0<v>>>0?u:v}if((c[f+12+(i<<2)>>2]|0)==0){p=c[f+76+(i<<2)>>2]|0;w=(p>>>0>=t>>>0)+p|0}else{w=t}a[b+82+i|0]=w&255;p=c[(bF(i)|0)>>2]|0;o=bC(b,p)|0;p=bH(b,o)|0;if((p|0)==0|j){x=p}else{m=(bt(c[o>>2]|0)|0)==2;x=m?0:p}p=c[(bG(i)|0)>>2]|0;m=bC(b,p)|0;p=bH(b,m)|0;if((p|0)==0|j){y=p}else{o=(bt(c[m>>2]|0)|0)==2;y=o?0:p}p=c[2640+(i<<2)>>2]|0;o=c[2576+(i<<2)>>2]|0;m=(1285>>>(i>>>0)&1|0)!=0;if(m){z=h+o|0;A=h+(o+1)|0;B=h+(o+2)|0;C=h+(o+3)|0}else{l=(o<<4)+p|0;z=e+(l-1)|0;A=e+(l+15)|0;B=e+(l+31)|0;C=e+(l+47)|0}l=a[z]|0;D=a[A]|0;E=a[B]|0;F=a[C]|0;do{if((51>>>(i>>>0)&1|0)==0){G=o-1|0;H=(G<<4)+p|0;I=a[e+H|0]|0;J=a[e+(H+1)|0]|0;K=a[e+(H+2)|0]|0;L=a[e+(H+3)|0]|0;M=a[e+(H+4)|0]|0;N=a[e+(H+5)|0]|0;O=a[e+(H+6)|0]|0;P=a[e+(H+7)|0]|0;if(m){Q=h+G|0;R=I;S=J;T=K;U=L;V=M;W=N;X=O;Y=P;break}else{Q=e+(H-1)|0;R=I;S=J;T=K;U=L;V=M;W=N;X=O;Y=P;break}}else{Q=g+p|0;R=a[g+(p+1)|0]|0;S=a[g+(p+2)|0]|0;T=a[g+(p+3)|0]|0;U=a[g+(p+4)|0]|0;V=a[g+(p+5)|0]|0;W=a[g+(p+6)|0]|0;X=a[g+(p+7)|0]|0;Y=a[g+(p+8)|0]|0}}while(0);m=a[Q]|0;switch(w|0){case 0:{if(r){_=1;$=1675;break L2186}P=(T&255)<<16|(U&255)<<24|(S&255)<<8|R&255;aa=P;ab=P;ac=P;ad=P;break};case 1:{if(!k){_=1;$=1676;break L2186}aa=Z(l&255,16843009)|0;ab=Z(D&255,16843009)|0;ac=Z(E&255,16843009)|0;ad=Z(F&255,16843009)|0;break};case 2:{do{if(s){if(k){ae=((l&255)+2+(D&255)+(E&255)+(F&255)|0)>>>2&255;break}if(r){ae=-128;break}ae=((U&255)+2+(T&255)+(S&255)+(R&255)|0)>>>2&255}else{ae=((l&255)+4+(D&255)+(E&255)+(F&255)+(U&255)+(T&255)+(S&255)+(R&255)|0)>>>3&255}}while(0);P=Z(ae&255,16843009)|0;aa=P;ab=P;ac=P;ad=P;break};case 3:{if(r){_=1;$=1677;break L2186}P=(x|0)==0;O=S&255;N=T&255;M=N+2|0;L=U&255;K=L+2|0;J=(K+O+(N<<1)|0)>>>2&255;N=(P?U:V)&255;I=(M+(L<<1)+N|0)>>>2&255;L=(P?U:W)&255;H=(K+L+(N<<1)|0)>>>2;K=H&255;G=(P?U:X)&255;af=(N+2+G+(L<<1)|0)>>>2;N=af&255;ag=(P?U:Y)&255;P=(L+2+ag+(G<<1)|0)>>>2;aa=J<<8|H<<24|(M+(R&255)+(O<<1)|0)>>>2&255|I<<16;ab=K<<16|J|af<<24|I<<8;ac=I|K<<8|P<<24|N<<16;ad=(G+2+(ag*3|0)|0)>>>2<<24|K|N<<8|P<<16&16711680;break};case 4:{if(s|(y|0)==0){_=1;$=1678;break L2186}P=R&255;N=m&255;K=l&255;ag=P+2|0;G=(ag+K+(N<<1)|0)>>>2;I=G&255;af=S&255;J=N+2|0;N=((P<<1)+af+J|0)>>>2;P=N&255;O=T&255;M=((af<<1)+O+ag|0)>>>2;ag=D&255;H=(ag+(K<<1)+J|0)>>>2&255;J=E&255;L=(K+2+(ag<<1)+J|0)>>>2&255;aa=M<<16&16711680|((U&255)+2+af+(O<<1)|0)>>>2<<24|I|P<<8;ab=H|M<<24|P<<16|I<<8;ac=N<<24|L|I<<16|H<<8;ad=(ag+2+(J<<1)+(F&255)|0)>>>2&255|L<<8|G<<24|H<<16;break};case 5:{if(s|(y|0)==0){_=1;$=1679;break L2186}H=m&255;G=R&255;L=(G+1+H|0)>>>1&255;J=S&255;ag=(J+2+(G<<1)+H|0)>>>2&255;I=l&255;N=G+2|0;P=(N+I+(H<<1)|0)>>>2&255;M=(J+1+G|0)>>>1&255;G=T&255;O=((J<<1)+G+N|0)>>>2;N=(G+1+J|0)>>>1;af=U&255;K=D&255;aa=N<<16&16711680|(af+1+G|0)>>>1<<24|M<<8|L;ab=O<<16&16711680|(af+2+J+(G<<1)|0)>>>2<<24|P|ag<<8;ac=M<<16|N<<24|(K+2+(I<<1)+H|0)>>>2&255|L<<8;ad=O<<24|(I+2+(E&255)+(K<<1)|0)>>>2&255|ag<<16|P<<8;break};case 6:{if(s|(y|0)==0){_=1;$=1680;break L2186}P=m&255;ag=l&255;K=ag+1|0;I=(K+P|0)>>>1&255;O=D&255;L=((ag<<1)+2+O+P|0)>>>2;H=(K+O|0)>>>1&255;K=E&255;N=ag+2|0;ag=(N+(O<<1)+K|0)>>>2;M=(O+1+K|0)>>>1&255;G=F&255;J=R&255;af=(N+J+(P<<1)|0)>>>2;N=S&255;aa=I|((T&255)+2+(N<<1)+J|0)>>>2<<24|(N+2+(J<<1)+P|0)>>>2<<16&16711680|af<<8&65280;ab=L<<8&65280|H|I<<16|af<<24;ac=M|H<<16|ag<<8&65280|L<<24;ad=ag<<24|M<<16|(K+1+G|0)>>>1&255|(O+2+(K<<1)+G|0)>>>2<<8&65280;break};case 7:{if(r){_=1;$=1681;break L2186}G=(x|0)==0;K=R&255;O=S&255;M=T&255;ag=(M+1+O|0)>>>1&255;L=U&255;H=L+1|0;af=(H+M|0)>>>1&255;I=(G?U:V)&255;P=(H+I|0)>>>1;H=M+2|0;J=L+2|0;N=(J+O+(M<<1)|0)>>>2&255;M=(H+(L<<1)+I|0)>>>2&255;L=(G?U:W)&255;ah=(J+L+(I<<1)|0)>>>2;aa=af<<16|P<<24|ag<<8|(O+1+K|0)>>>1&255;ab=N<<8|ah<<24|(H+K+(O<<1)|0)>>>2&255|M<<16;ac=ag|af<<8|P<<16&16711680|(I+1+L|0)>>>1<<24;ad=ah<<16&16711680|N|(I+2+((G?U:X)&255)+(L<<1)|0)>>>2<<24|M<<8;break};default:{if(!k){_=1;$=1682;break L2186}M=l&255;L=D&255;G=E&255;I=(L+1+G|0)>>>1&255;N=F&255;ah=(L+2+(G<<1)+N|0)>>>2;P=(G+1+N|0)>>>1&255;af=(G+2+(N*3|0)|0)>>>2;ag=N<<16;O=N<<24;aa=I<<16|(M+1+L|0)>>>1&255|(M+2+(L<<1)+G|0)>>>2<<8&65280|ah<<24;ab=P<<16|I|af<<24|ah<<8&65280;ac=O|ag|P|af<<8&65280;ad=N<<8|N|ag|O}}O=(o<<4)+p|0;c[e+O>>2]=aa;c[e+(O+16)>>2]=ab;c[e+(O+32)>>2]=ac;c[e+(O+48)>>2]=ad;br(e,f+328+(i<<6)|0,i);O=i+1|0;if(O>>>0<16>>>0){i=O}else{_=0;$=1683;break}}if(($|0)==1675){return _|0}else if(($|0)==1676){return _|0}else if(($|0)==1677){return _|0}else if(($|0)==1678){return _|0}else if(($|0)==1679){return _|0}else if(($|0)==1680){return _|0}else if(($|0)==1681){return _|0}else if(($|0)==1682){return _|0}else if(($|0)==1683){return _|0}return 0}function bq(b,e,f,g,h,i,j){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0;k=b+200|0;l=bH(b,c[k>>2]|0)|0;m=(j|0)==0;if((l|0)==0|m){n=l}else{j=(bt(c[c[k>>2]>>2]|0)|0)==2;n=j?0:l}l=b+204|0;j=bH(b,c[l>>2]|0)|0;if((j|0)==0|m){o=j}else{k=(bt(c[c[l>>2]>>2]|0)|0)==2;o=k?0:j}j=b+212|0;k=bH(b,c[j>>2]|0)|0;if((k|0)==0|m){p=k}else{m=(bt(c[c[j>>2]>>2]|0)|0)==2;p=m?0:k}k=(n|0)==0;m=(o|0)==0;o=k|m|(p|0)==0;p=(n|0)!=0;n=m|p^1;j=f;f=g;g=h;h=e;e=0;b=16;while(1){if((i|0)==1){if(k){q=1;r=1714;break}else{s=h;t=g;u=8}while(1){l=u-1|0;a[s]=a[t]|0;a[s+1|0]=a[t]|0;a[s+2|0]=a[t]|0;a[s+3|0]=a[t]|0;a[s+4|0]=a[t]|0;a[s+5|0]=a[t]|0;a[s+6|0]=a[t]|0;a[s+7|0]=a[t]|0;if((l|0)==0){break}else{s=s+8|0;t=t+1|0;u=l}}}else if((i|0)==2){if(m){q=1;r=1715;break}else{v=h;w=f;x=8}while(1){l=w+1|0;y=x-1|0;a[v]=a[l]|0;a[v+8|0]=a[l]|0;a[v+16|0]=a[l]|0;a[v+24|0]=a[l]|0;a[v+32|0]=a[l]|0;a[v+40|0]=a[l]|0;a[v+48|0]=a[l]|0;a[v+56|0]=a[l]|0;if((y|0)==0){break}else{v=v+1|0;w=l;x=y}}}else if((i|0)==0){y=f+1|0;do{if(n){if(!m){z=((d[f+5|0]|0)+2+(d[f+6|0]|0)+(d[f+7|0]|0)+(d[f+8|0]|0)|0)>>>2&255;A=((d[y]|0)+2+(d[f+2|0]|0)+(d[f+3|0]|0)+(d[f+4|0]|0)|0)>>>2&255;break}if(!p){z=-128;A=-128;break}l=((d[g]|0)+2+(d[g+1|0]|0)+(d[g+2|0]|0)+(d[g+3|0]|0)|0)>>>2&255;z=l;A=l}else{z=((d[f+5|0]|0)+2+(d[f+6|0]|0)+(d[f+7|0]|0)+(d[f+8|0]|0)|0)>>>2&255;A=((d[y]|0)+4+(d[f+2|0]|0)+(d[f+3|0]|0)+(d[f+4|0]|0)+(d[g]|0)+(d[g+1|0]|0)+(d[g+2|0]|0)+(d[g+3|0]|0)|0)>>>3&255}}while(0);cD(h|0,A|0,4);cD(h+4|0,z|0,4);cD(h+8|0,A|0,4);cD(h+12|0,z|0,4);cD(h+16|0,A|0,4);cD(h+20|0,z|0,4);l=h+32|0;cD(h+24|0,A|0,4);cD(h+28|0,z|0,4);do{if(p){B=d[g+4|0]|0;C=d[g+5|0]|0;D=d[g+6|0]|0;E=d[g+7|0]|0;F=(B+2+C+D+E|0)>>>2;if(m){G=F&255;H=G;I=G;break}else{H=(B+4+C+D+E+(d[f+5|0]|0)+(d[f+6|0]|0)+(d[f+7|0]|0)+(d[f+8|0]|0)|0)>>>3&255;I=F&255;break}}else{if(m){H=-128;I=-128;break}H=((d[f+5|0]|0)+2+(d[f+6|0]|0)+(d[f+7|0]|0)+(d[f+8|0]|0)|0)>>>2&255;I=((d[y]|0)+2+(d[f+2|0]|0)+(d[f+3|0]|0)+(d[f+4|0]|0)|0)>>>2&255}}while(0);cD(l|0,I|0,4);cD(h+36|0,H|0,4);cD(h+40|0,I|0,4);cD(h+44|0,H|0,4);cD(h+48|0,I|0,4);cD(h+52|0,H|0,4);cD(h+56|0,I|0,4);cD(h+60|0,H|0,4)}else{if(o){q=1;r=1716;break}y=d[f+8|0]|0;F=d[g+7|0]|0;E=d[f]|0;D=(((d[f+5|0]|0)-(d[f+3|0]|0)+((d[f+6|0]|0)-(d[f+2|0]|0)<<1)+(((d[f+7|0]|0)-(d[f+1|0]|0)|0)*3|0)+(y-E<<2)|0)*17|0)+16>>5;C=(((d[g+4|0]|0)-(d[g+2|0]|0)+(F-E<<2)+((d[g+5|0]|0)-(d[g+1|0]|0)<<1)+(((d[g+6|0]|0)-(d[g]|0)|0)*3|0)|0)*17|0)+16>>5;E=D*-3|0;B=(F+y<<4)+16+(C*-3|0)|0;y=8;F=h;while(1){G=y-1|0;J=B+E|0;a[F]=a[(J>>5)+1808|0]|0;K=J+D|0;a[F+1|0]=a[(K>>5)+1808|0]|0;J=K+D|0;a[F+2|0]=a[(J>>5)+1808|0]|0;K=J+D|0;a[F+3|0]=a[(K>>5)+1808|0]|0;J=K+D|0;a[F+4|0]=a[(J>>5)+1808|0]|0;K=J+D|0;a[F+5|0]=a[(K>>5)+1808|0]|0;J=K+D|0;a[F+6|0]=a[(J>>5)+1808|0]|0;a[F+7|0]=a[(J+D>>5)+1808|0]|0;if((G|0)==0){break}else{B=B+C|0;y=G;F=F+8|0}}}br(h,j|0,b);F=b|1;br(h,j+64|0,F);br(h,j+128|0,F+1|0);br(h,j+192|0,b|3);F=e+1|0;if(F>>>0<2>>>0){j=j+256|0;f=f+9|0;g=g+8|0;h=h+64|0;e=F;b=b+4|0}else{q=0;r=1717;break}}if((r|0)==1714){return q|0}else if((r|0)==1715){return q|0}else if((r|0)==1716){return q|0}else if((r|0)==1717){return q|0}return 0}function br(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0;g=c[e>>2]|0;if((g|0)==16777215){return}h=f>>>0<16>>>0;i=h?16:8;j=h?f:f&3;f=(Z(c[2576+(j<<2)>>2]|0,i)|0)+(c[2640+(j<<2)>>2]|0)|0;j=b+f|0;h=c[e+4>>2]|0;k=b+(f+1)|0;l=d[k]|0;a[j]=a[1296+(g+512+(d[j]|0))|0]|0;j=c[e+8>>2]|0;g=b+(f+2)|0;m=d[g]|0;a[k]=a[1296+(h+512+l)|0]|0;l=b+(f+3)|0;h=a[1296+((c[e+12>>2]|0)+512+(d[l]|0))|0]|0;a[g]=a[1296+(j+512+m)|0]|0;a[l]=h;h=f+i|0;f=b+h|0;l=c[e+20>>2]|0;m=b+(h+1)|0;j=d[m]|0;a[f]=a[1296+((c[e+16>>2]|0)+512+(d[f]|0))|0]|0;f=c[e+24>>2]|0;g=b+(h+2)|0;k=d[g]|0;a[m]=a[1296+(l+512+j)|0]|0;j=b+(h+3)|0;l=a[1296+((c[e+28>>2]|0)+512+(d[j]|0))|0]|0;a[g]=a[1296+(f+512+k)|0]|0;a[j]=l;l=h+i|0;h=b+l|0;j=c[e+36>>2]|0;k=b+(l+1)|0;f=d[k]|0;a[h]=a[1296+((c[e+32>>2]|0)+512+(d[h]|0))|0]|0;h=c[e+40>>2]|0;g=b+(l+2)|0;m=d[g]|0;a[k]=a[1296+(j+512+f)|0]|0;f=b+(l+3)|0;j=a[1296+((c[e+44>>2]|0)+512+(d[f]|0))|0]|0;a[g]=a[1296+(h+512+m)|0]|0;a[f]=j;j=l+i|0;i=b+j|0;l=c[e+52>>2]|0;f=b+(j+1)|0;m=d[f]|0;a[i]=a[1296+((c[e+48>>2]|0)+512+(d[i]|0))|0]|0;i=c[e+56>>2]|0;h=b+(j+2)|0;g=d[h]|0;a[f]=a[1296+(l+512+m)|0]|0;m=b+(j+3)|0;j=a[1296+((c[e+60>>2]|0)+512+(d[m]|0))|0]|0;a[h]=a[1296+(i+512+g)|0]|0;a[m]=j;return}function bs(a,d,e,f,g){a=a|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0;h=i;i=i+48|0;j=h|0;k=h+8|0;l=h+16|0;m=h+24|0;n=h+32|0;o=h+40|0;cD(d|0,0,2088);p=cv(a,n)|0;q=c[n>>2]|0;do{if((f|0)==7|(f|0)==2){r=q+6|0;if(r>>>0<32>>>0&(p|0)==0){c[d>>2]=r;s=r;break}else{t=1;i=h;return t|0}}else{r=q+1|0;if(r>>>0<32>>>0&(p|0)==0){c[d>>2]=r;s=r;break}else{t=1;i=h;return t|0}}}while(0);p=d|0;L2322:do{if((s|0)==31){while(1){if((cm(a)|0)!=0){break}if((cj(a,1)|0)!=0){t=1;u=1857;break}}if((u|0)==1857){i=h;return t|0}q=0;f=d+328|0;while(1){r=cj(a,8)|0;c[n>>2]=r;if((r|0)==-1){t=1;break}c[f>>2]=r;r=q+1|0;if(r>>>0<384>>>0){q=r;f=f+4|0}else{break L2322}}i=h;return t|0}else{L2334:do{if(s>>>0<6>>>0){if((s|0)==1|(s|0)==0){v=j;w=k}else if((s|0)==2|(s|0)==3){v=j;w=k}else{if((cv(a,l)|0)!=0){t=1;i=h;return t|0}f=c[l>>2]|0;if(f>>>0>3>>>0){t=1;i=h;return t|0}q=d+176|0;c[q>>2]=f;if((cv(a,l)|0)!=0){t=1;i=h;return t|0}f=c[l>>2]|0;if(f>>>0>3>>>0){t=1;i=h;return t|0}r=d+180|0;c[r>>2]=f;if((cv(a,l)|0)!=0){t=1;i=h;return t|0}f=c[l>>2]|0;if(f>>>0>3>>>0){t=1;i=h;return t|0}x=d+184|0;c[x>>2]=f;if((cv(a,l)|0)!=0){t=1;i=h;return t|0}f=c[l>>2]|0;if(f>>>0>3>>>0){t=1;i=h;return t|0}y=d+188|0;c[y>>2]=f;do{if(!(g>>>0<2>>>0|(s|0)==5)){f=g>>>0>2>>>0|0;if((cy(a,l,f)|0)!=0){t=1;i=h;return t|0}z=c[l>>2]|0;if(z>>>0>=g>>>0){t=1;i=h;return t|0}c[d+192>>2]=z;if((cy(a,l,f)|0)!=0){t=1;i=h;return t|0}z=c[l>>2]|0;if(z>>>0>=g>>>0){t=1;i=h;return t|0}c[d+196>>2]=z;if((cy(a,l,f)|0)!=0){t=1;i=h;return t|0}z=c[l>>2]|0;if(z>>>0>=g>>>0){t=1;i=h;return t|0}c[d+200>>2]=z;if((cy(a,l,f)|0)!=0){t=1;i=h;return t|0}f=c[l>>2]|0;if(f>>>0<g>>>0){c[d+204>>2]=f;break}else{t=1;i=h;return t|0}}}while(0);f=c[q>>2]|0;if((f|0)==1|(f|0)==2){A=1}else if((f|0)==0){A=0}else{A=3}c[l>>2]=A;f=0;while(1){z=cw(a,m)|0;if((z|0)!=0){t=z;u=1865;break}b[d+208+(f<<2)>>1]=c[m>>2]&65535;z=cw(a,m)|0;if((z|0)!=0){t=z;u=1866;break}b[d+208+(f<<2)+2>>1]=c[m>>2]&65535;z=c[l>>2]|0;c[l>>2]=z-1;if((z|0)==0){u=1749;break}else{f=f+1|0}}if((u|0)==1865){i=h;return t|0}else if((u|0)==1866){i=h;return t|0}else if((u|0)==1749){f=c[r>>2]|0;if((f|0)==1|(f|0)==2){B=1}else if((f|0)==0){B=0}else{B=3}c[l>>2]=B;f=0;while(1){q=cw(a,m)|0;if((q|0)!=0){t=q;u=1867;break}b[d+224+(f<<2)>>1]=c[m>>2]&65535;q=cw(a,m)|0;if((q|0)!=0){t=q;u=1868;break}b[d+224+(f<<2)+2>>1]=c[m>>2]&65535;q=c[l>>2]|0;c[l>>2]=q-1;if((q|0)==0){u=1756;break}else{f=f+1|0}}if((u|0)==1867){i=h;return t|0}else if((u|0)==1868){i=h;return t|0}else if((u|0)==1756){f=c[x>>2]|0;if((f|0)==1|(f|0)==2){C=1}else if((f|0)==0){C=0}else{C=3}c[l>>2]=C;f=0;while(1){r=cw(a,m)|0;if((r|0)!=0){t=r;u=1869;break}b[d+240+(f<<2)>>1]=c[m>>2]&65535;r=cw(a,m)|0;if((r|0)!=0){t=r;u=1870;break}b[d+240+(f<<2)+2>>1]=c[m>>2]&65535;r=c[l>>2]|0;c[l>>2]=r-1;if((r|0)==0){u=1763;break}else{f=f+1|0}}if((u|0)==1763){f=c[y>>2]|0;if((f|0)==1|(f|0)==2){D=1}else if((f|0)==0){D=0}else{D=3}c[l>>2]=D;f=0;while(1){x=cw(a,m)|0;if((x|0)!=0){t=x;u=1871;break}b[d+256+(f<<2)>>1]=c[m>>2]&65535;x=cw(a,m)|0;if((x|0)!=0){t=x;u=1872;break}b[d+256+(f<<2)+2>>1]=c[m>>2]&65535;x=c[l>>2]|0;c[l>>2]=x-1;if((x|0)==0){E=2;u=1823;break L2334}else{f=f+1|0}}if((u|0)==1871){i=h;return t|0}else if((u|0)==1872){i=h;return t|0}}else if((u|0)==1869){i=h;return t|0}else if((u|0)==1870){i=h;return t|0}}}}if(g>>>0>1>>>0){if((s|0)==2|(s|0)==3){F=1}else if((s|0)==1|(s|0)==0){F=0}else{F=3}f=g>>>0>2>>>0|0;y=0;x=F;while(1){if((cy(a,j,f)|0)!=0){G=1;H=v;I=w;u=1821;break L2334}r=c[j>>2]|0;if(r>>>0>=g>>>0){G=1;H=v;I=w;u=1821;break L2334}c[d+144+(y<<2)>>2]=r;if((x|0)==0){break}else{y=y+1|0;x=x-1|0}}}if((s|0)==2|(s|0)==3){J=0;K=1}else if((s|0)==1|(s|0)==0){J=0;K=0}else{J=0;K=3}while(1){x=cw(a,k)|0;if((x|0)!=0){G=x;H=v;I=w;u=1821;break L2334}b[d+160+(J<<2)>>1]=c[k>>2]&65535;x=cw(a,k)|0;if((x|0)!=0){G=x;H=v;I=w;u=1821;break L2334}b[d+160+(J<<2)+2>>1]=c[k>>2]&65535;if((K|0)==0){E=2;u=1823;break}else{J=J+1|0;K=K-1|0}}}else{x=(s|0)!=6;y=x&1;f=j;r=k;if((y|0)==0){c[k>>2]=0;q=0;while(1){z=ck(a)|0;c[j>>2]=z;L=z>>>31;c[d+12+(q<<2)>>2]=L;if((L|0)==0){c[d+76+(q<<2)>>2]=z>>>28&7;M=1;N=z<<4}else{M=0;N=z<<1}z=q|1;L=N>>>31;c[d+12+(z<<2)>>2]=L;if((L|0)==0){c[d+76+(z<<2)>>2]=N>>>28&7;O=M+1|0;P=N<<4}else{O=M;P=N<<1}L=z+1|0;z=P>>>31;c[d+12+(L<<2)>>2]=z;if((z|0)==0){c[d+76+(L<<2)>>2]=P>>>28&7;Q=O+1|0;R=P<<4}else{Q=O;R=P<<1}L=q|3;z=R>>>31;c[d+12+(L<<2)>>2]=z;if((z|0)==0){c[d+76+(L<<2)>>2]=R>>>28&7;S=Q+1|0;T=R<<4}else{S=Q;T=R<<1}z=L+1|0;U=T>>>31;c[d+12+(z<<2)>>2]=U;if((U|0)==0){c[d+76+(z<<2)>>2]=T>>>28&7;V=S+1|0;W=T<<4}else{V=S;W=T<<1}z=L+2|0;U=W>>>31;c[d+12+(z<<2)>>2]=U;if((U|0)==0){c[d+76+(z<<2)>>2]=W>>>28&7;X=V+1|0;Y=W<<4}else{X=V;Y=W<<1}z=L+3|0;L=Y>>>31;c[d+12+(z<<2)>>2]=L;if((L|0)==0){c[d+76+(z<<2)>>2]=Y>>>28&7;Z=X+1|0;_=Y<<4}else{Z=X;_=Y<<1}z=q|7;L=_>>>31;c[d+12+(z<<2)>>2]=L;if((L|0)==0){c[d+76+(z<<2)>>2]=_>>>28&7;$=Z+1|0;aa=_<<4}else{$=Z;aa=_<<1}c[j>>2]=aa;if((cl(a,($*3|0)+8|0)|0)==-1){G=1;H=f;I=r;u=1821;break L2334}z=(c[k>>2]|0)+1|0;c[k>>2]=z;if((z|0)<2){q=q+8|0}else{u=1804;break}}}else if((y|0)==1){u=1804}if((u|0)==1804){if((cv(a,j)|0)!=0){G=1;H=f;I=r;u=1821;break}q=c[j>>2]|0;if(q>>>0>3>>>0){G=1;H=f;I=r;u=1821;break}c[d+140>>2]=q}if(!x){E=y;u=1823;break}q=c[p>>2]|0;z=q-7|0;L=z>>>2;c[d+4>>2]=(z>>>0>11>>>0?L+268435453|0:L)<<4|(q>>>0>18>>>0?15:0)}}while(0);if((u|0)==1821){t=G;i=h;return t|0}do{if((u|0)==1823){q=cx(a,n,(E|0)==0|0)|0;if((q|0)==0){L=c[n>>2]|0;c[d+4>>2]=L;if((L|0)==0){break L2322}else{break}}else{t=q;i=h;return t|0}}}while(0);if((cw(a,o)|0)!=0){t=1;i=h;return t|0}q=c[o>>2]|0;if((q+26|0)>>>0>51>>>0){t=1;i=h;return t|0}c[d+8>>2]=q;q=c[d+4>>2]|0;L=d+272|0;L2508:do{if((c[p>>2]|0)>>>0<7>>>0){z=q;U=0;ab=3;while(1){ac=z>>>1;if((z&1|0)!=0){ad=aP(a,d+328+(U<<6)|0,bz(e,U,L)|0,16)|0;c[d+1992+(U<<2)>>2]=ad>>>16;if((ad&15|0)!=0){ae=ad;break L2508}b[d+272+(U<<1)>>1]=ad>>>4&255;ad=U|1;af=aP(a,d+328+(ad<<6)|0,bz(e,ad,L)|0,16)|0;c[d+1992+(ad<<2)>>2]=af>>>16;if((af&15|0)!=0){ae=af;break L2508}b[d+272+(ad<<1)>>1]=af>>>4&255;af=U|2;ad=aP(a,d+328+(af<<6)|0,bz(e,af,L)|0,16)|0;c[d+1992+(af<<2)>>2]=ad>>>16;if((ad&15|0)!=0){ae=ad;break L2508}b[d+272+(af<<1)>>1]=ad>>>4&255;ad=U|3;af=aP(a,d+328+(ad<<6)|0,bz(e,ad,L)|0,16)|0;c[d+1992+(ad<<2)>>2]=af>>>16;if((af&15|0)!=0){ae=af;break L2508}b[d+272+(ad<<1)>>1]=af>>>4&255}af=U+4|0;if((ab|0)==0){ag=ac;ah=af;u=1841;break}else{z=ac;U=af;ab=ab-1|0}}}else{ab=aP(a,d+1864|0,bz(e,0,L)|0,16)|0;if((ab&15|0)!=0){ae=ab;break}b[d+320>>1]=ab>>>4&255;ab=q;U=0;z=3;while(1){y=ab>>>1;if((ab&1|0)!=0){x=aP(a,d+328+(U<<6)+4|0,bz(e,U,L)|0,15)|0;c[d+1992+(U<<2)>>2]=x>>>15;if((x&15|0)!=0){ae=x;break L2508}b[d+272+(U<<1)>>1]=x>>>4&255;x=U|1;r=aP(a,d+328+(x<<6)+4|0,bz(e,x,L)|0,15)|0;c[d+1992+(x<<2)>>2]=r>>>15;if((r&15|0)!=0){ae=r;break L2508}b[d+272+(x<<1)>>1]=r>>>4&255;r=U|2;x=aP(a,d+328+(r<<6)+4|0,bz(e,r,L)|0,15)|0;c[d+1992+(r<<2)>>2]=x>>>15;if((x&15|0)!=0){ae=x;break L2508}b[d+272+(r<<1)>>1]=x>>>4&255;x=U|3;r=aP(a,d+328+(x<<6)+4|0,bz(e,x,L)|0,15)|0;c[d+1992+(x<<2)>>2]=r>>>15;if((r&15|0)!=0){ae=r;break L2508}b[d+272+(x<<1)>>1]=r>>>4&255}r=U+4|0;if((z|0)==0){ag=y;ah=r;u=1841;break}else{ab=y;U=r;z=z-1|0}}}}while(0);L2529:do{if((u|0)==1841){if((ag&3|0)!=0){q=aP(a,d+1928|0,-1,4)|0;if((q&15|0)!=0){ae=q;break}b[d+322>>1]=q>>>4&255;q=aP(a,d+1944|0,-1,4)|0;if((q&15|0)!=0){ae=q;break}b[d+324>>1]=q>>>4&255}if((ag&2|0)==0){ae=0;break}else{ai=ah;aj=7}while(1){q=aP(a,d+328+(ai<<6)+4|0,bz(e,ai,L)|0,15)|0;if((q&15|0)!=0){ae=q;break L2529}b[d+272+(ai<<1)>>1]=q>>>4&255;c[d+1992+(ai<<2)>>2]=q>>>15;if((aj|0)==0){ae=0;break}else{ai=ai+1|0;aj=aj-1|0}}}}while(0);c[a+16>>2]=((c[a+4>>2]|0)-(c[a>>2]|0)<<3)+(c[a+8>>2]|0);if((ae|0)==0){break}else{t=ae}i=h;return t|0}}while(0);t=0;i=h;return t|0}function bt(a){a=a|0;var b=0;if(a>>>0<6>>>0){b=2}else{b=(a|0)!=6|0}return b|0}function bu(a){a=a|0;var b=0;if((a|0)==1|(a|0)==0){b=1}else if((a|0)==2|(a|0)==3){b=2}else{b=4}return b|0}function bv(a){a=a|0;var b=0;if((a|0)==0){b=1}else if((a|0)==1|(a|0)==2){b=2}else{b=4}return b|0}function bw(a){a=a|0;return a+1&3|0}function bx(d,e,f,g,h,i,j,k){d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0;l=c[e>>2]|0;m=d|0;c[m>>2]=l;n=d+196|0;c[n>>2]=(c[n>>2]|0)+1;cu(f,i);if((l|0)==31){o=d+28|0;c[d+20>>2]=0;if((c[n>>2]|0)>>>0>1>>>0){b[o>>1]=16;b[d+30>>1]=16;b[d+32>>1]=16;b[d+34>>1]=16;b[d+36>>1]=16;b[d+38>>1]=16;b[d+40>>1]=16;b[d+42>>1]=16;b[d+44>>1]=16;b[d+46>>1]=16;b[d+48>>1]=16;b[d+50>>1]=16;b[d+52>>1]=16;b[d+54>>1]=16;b[d+56>>1]=16;b[d+58>>1]=16;b[d+60>>1]=16;b[d+62>>1]=16;b[d+64>>1]=16;b[d+66>>1]=16;b[d+68>>1]=16;b[d+70>>1]=16;b[d+72>>1]=16;b[d+74>>1]=16;p=0;return p|0}n=k;q=o;o=e+328|0;r=23;while(1){b[q>>1]=16;a[n]=c[o>>2]&255;a[n+1|0]=c[o+4>>2]&255;a[n+2|0]=c[o+8>>2]&255;a[n+3|0]=c[o+12>>2]&255;a[n+4|0]=c[o+16>>2]&255;a[n+5|0]=c[o+20>>2]&255;a[n+6|0]=c[o+24>>2]&255;a[n+7|0]=c[o+28>>2]&255;a[n+8|0]=c[o+32>>2]&255;a[n+9|0]=c[o+36>>2]&255;a[n+10|0]=c[o+40>>2]&255;a[n+11|0]=c[o+44>>2]&255;a[n+12|0]=c[o+48>>2]&255;a[n+13|0]=c[o+52>>2]&255;a[n+14|0]=c[o+56>>2]&255;a[n+15|0]=c[o+60>>2]&255;if((r|0)==0){break}else{n=n+16|0;q=q+2|0;o=o+64|0;r=r-1|0}}bj(f,k);p=0;return p|0}r=d+28|0;do{if((l|0)==0){cD(r|0,0,54);c[d+20>>2]=c[h>>2];s=1939}else{o=e+272|0;cE(r|0,o|0,54)|0;o=c[e+8>>2]|0;q=c[h>>2]|0;do{if((o|0)==0){t=q}else{n=q+o|0;c[h>>2]=n;if((n|0)<0){u=n+52|0;c[h>>2]=u;t=u;break}if((n|0)<=51){t=n;break}u=n-52|0;c[h>>2]=u;t=u}}while(0);o=d+20|0;c[o>>2]=t;q=e+328|0;u=e+1992|0;n=d+28|0;L2579:do{if((c[m>>2]|0)>>>0<7>>>0){v=u;w=q;x=n;y=15;while(1){z=w|0;if((b[x>>1]|0)==0){c[z>>2]=16777215}else{if((cn(z,c[o>>2]|0,0,c[v>>2]|0)|0)!=0){p=1;break}}z=w+64|0;A=x+2|0;B=v+4|0;if((y|0)==0){C=A;D=z;E=B;break L2579}else{v=B;w=z;x=A;y=y-1|0}}return p|0}else{if((b[d+76>>1]|0)==0){F=u;G=q;H=n;I=2704;J=15}else{co(e+1864|0,t);F=u;G=q;H=n;I=2704;J=15}while(1){y=I+4|0;x=c[e+1864+(c[I>>2]<<2)>>2]|0;w=G|0;c[w>>2]=x;do{if((x|0)==0){if((b[H>>1]|0)!=0){s=1918;break}c[w>>2]=16777215}else{s=1918}}while(0);if((s|0)==1918){s=0;if((cn(w,c[o>>2]|0,1,c[F>>2]|0)|0)!=0){p=1;break}}x=G+64|0;v=H+2|0;A=F+4|0;if((J|0)==0){C=v;D=x;E=A;break L2579}else{F=A;G=x;H=v;I=y;J=J-1|0}}return p|0}}while(0);n=(c[d+24>>2]|0)+(c[o>>2]|0)|0;if((n|0)<0){K=0}else{K=(n|0)>51?51:n}n=c[1088+(K<<2)>>2]|0;do{if((b[d+78>>1]|0)==0){if((b[d+80>>1]|0)!=0){s=1930;break}L=E;M=D;N=C;O=e+1928|0;P=7}else{s=1930}}while(0);if((s|0)==1930){o=e+1928|0;cp(o,n);L=E;M=D;N=C;O=o;P=7}while(1){o=O+4|0;q=c[O>>2]|0;u=M|0;c[u>>2]=q;do{if((q|0)==0){if((b[N>>1]|0)!=0){s=1933;break}c[u>>2]=16777215}else{s=1933}}while(0);if((s|0)==1933){s=0;if((cn(u,n,1,c[L>>2]|0)|0)!=0){p=1;s=1948;break}}if((P|0)==0){break}else{L=L+4|0;M=M+64|0;N=N+2|0;O=o;P=P-1|0}}if((s|0)==1948){return p|0}if(l>>>0<6>>>0){s=1939;break}n=bm(d,e,f,i,j,k)|0;if((n|0)==0){break}else{p=n}return p|0}}while(0);do{if((s|0)==1939){j=bl(d,e,g,i,f,k)|0;if((j|0)==0){break}else{p=j}return p|0}}while(0);p=0;return p|0}function by(a){a=a|0;return a|0}function bz(d,e,f){d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0;g=bD(e)|0;h=bE(e)|0;e=a[g+4|0]|0;i=a[h+4|0]|0;j=(c[h>>2]|0)==4;if((c[g>>2]|0)==4){g=b[f+((e&255)<<1)>>1]|0;if(j){k=g+1+(b[f+((i&255)<<1)>>1]|0)>>1;return k|0}h=d+204|0;if((bH(d,c[h>>2]|0)|0)==0){k=g;return k|0}k=g+1+(b[(c[h>>2]|0)+28+((i&255)<<1)>>1]|0)>>1;return k|0}if(j){j=b[f+((i&255)<<1)>>1]|0;f=d+200|0;if((bH(d,c[f>>2]|0)|0)==0){k=j;return k|0}k=j+1+(b[(c[f>>2]|0)+28+((e&255)<<1)>>1]|0)>>1;return k|0}f=d+200|0;if((bH(d,c[f>>2]|0)|0)==0){l=0;m=0}else{l=1;m=b[(c[f>>2]|0)+28+((e&255)<<1)>>1]|0}e=d+204|0;if((bH(d,c[e>>2]|0)|0)==0){k=m;return k|0}d=b[(c[e>>2]|0)+28+((i&255)<<1)>>1]|0;if((l|0)==0){k=d;return k|0}k=m+1+d>>1;return k|0}function bA(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;if((cj(a,1)|0)==-1){d=1;return d|0}e=b+4|0;c[e>>2]=cj(a,2)|0;f=cj(a,5)|0;c[b>>2]=f;if((f-2|0)>>>0<3>>>0){d=1;return d|0}do{if((f-7|0)>>>0<2>>>0|(f|0)==5){if((c[e>>2]|0)==0){d=1}else{break}return d|0}}while(0);L2668:do{switch(f|0){case 12:case 11:case 10:case 9:case 6:{if((c[e>>2]|0)==0){break L2668}else{d=1}return d|0};default:{}}}while(0);d=0;return d|0}function bB(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;if((d|0)==0){return}e=b-1|0;f=1-b|0;g=~b;h=0;i=0;j=0;while(1){k=(j|0)!=0;if(k){c[a+(h*216|0)+200>>2]=a+((h-1|0)*216|0)}else{c[a+(h*216|0)+200>>2]=0}l=(i|0)!=0;do{if(l){c[a+(h*216|0)+204>>2]=a+((h-b|0)*216|0);if(j>>>0>=e>>>0){m=1995;break}c[a+(h*216|0)+208>>2]=a+((f+h|0)*216|0)}else{c[a+(h*216|0)+204>>2]=0;m=1995}}while(0);if((m|0)==1995){m=0;c[a+(h*216|0)+208>>2]=0}if(l&k){c[a+(h*216|0)+212>>2]=a+((h+g|0)*216|0)}else{c[a+(h*216|0)+212>>2]=0}n=j+1|0;o=(n|0)==(b|0);p=h+1|0;if(p>>>0<d>>>0){h=p;i=(o&1)+i|0;j=o?0:n}else{break}}return}function bC(a,b){a=a|0;b=b|0;var d=0;switch(b|0){case 3:{d=c[a+212>>2]|0;break};case 2:{d=c[a+208>>2]|0;break};case 4:{d=a;break};case 1:{d=c[a+204>>2]|0;break};case 0:{d=c[a+200>>2]|0;break};default:{d=0}}return d|0}function bD(a){a=a|0;return 6912+(a<<3)|0}function bE(a){a=a|0;return 6208+(a<<3)|0}function bF(a){a=a|0;return 5504+(a<<3)|0}function bG(a){a=a|0;return 4800+(a<<3)|0}function bH(a,b){a=a|0;b=b|0;if((b|0)==0){return 0}else{return(c[a+4>>2]|0)==(c[b+4>>2]|0)|0}return 0}function bI(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0;L2712:do{if((c[d+284>>2]|0)==0){f=0}else{g=0;while(1){h=c[d+288+(g*20|0)>>2]|0;if((h|0)==0){break}else if((h|0)==5){f=1;break L2712}g=g+1|0}f=0}}while(0);g=c[b+16>>2]|0;if((g|0)==1){do{if((c[e>>2]|0)==5){i=0}else{h=c[a+12>>2]|0;if((c[a+8>>2]|0)>>>0<=(c[d+12>>2]|0)>>>0){i=h;break}i=(c[b+12>>2]|0)+h|0}}while(0);h=c[b+36>>2]|0;j=(h|0)==0;if(j){k=0}else{k=(c[d+12>>2]|0)+i|0}l=(c[e+4>>2]|0)==0;m=(((k|0)!=0&l)<<31>>31)+k|0;k=(m|0)!=0;if(k){n=m-1|0;o=(n>>>0)%(h>>>0)|0;p=(n>>>0)/(h>>>0)|0}else{o=0;p=0}if(j){q=0}else{j=c[b+40>>2]|0;n=0;m=0;while(1){r=(c[j+(n<<2)>>2]|0)+m|0;s=n+1|0;if(s>>>0<h>>>0){n=s;m=r}else{q=r;break}}}if(k){k=Z(q,p)|0;p=c[b+40>>2]|0;q=0;m=k;while(1){k=(c[p+(q<<2)>>2]|0)+m|0;n=q+1|0;if(n>>>0>o>>>0){t=k;break}else{q=n;m=k}}}else{t=0}if(l){u=(c[b+28>>2]|0)+t|0}else{u=t}t=(c[d+32>>2]|0)+(c[b+32>>2]|0)|0;l=a+12|0;if((f|0)==0){m=((t|0)<0?t:0)+u+(c[d+28>>2]|0)|0;c[l>>2]=i;c[a+8>>2]=c[d+12>>2];v=m;return v|0}else{c[l>>2]=0;c[a+8>>2]=0;v=0;return v|0}}else if((g|0)==0){if((c[e>>2]|0)==5){c[a+4>>2]=0;c[a>>2]=0;w=0}else{w=c[a>>2]|0}g=d+20|0;l=c[g>>2]|0;m=a|0;do{if(l>>>0<w>>>0){i=c[b+20>>2]|0;if((w-l|0)>>>0<i>>>1>>>0){x=2028;break}y=(c[a+4>>2]|0)+i|0}else{x=2028}}while(0);L2770:do{if((x|0)==2028){do{if(l>>>0>w>>>0){i=c[b+20>>2]|0;if((l-w|0)>>>0<=i>>>1>>>0){break}y=(c[a+4>>2]|0)-i|0;break L2770}}while(0);y=c[a+4>>2]|0}}while(0);w=e+4|0;if((c[w>>2]|0)==0){x=c[d+24>>2]|0;v=l+y+((x|0)<0?x:0)|0;return v|0}c[a+4>>2]=y;x=c[g>>2]|0;g=d+24|0;l=c[g>>2]|0;i=x+y+((l|0)<0?l:0)|0;if((c[w>>2]|0)==0){v=i;return v|0}if((f|0)==0){c[m>>2]=x;v=i;return v|0}else{c[a+4>>2]=0;i=c[g>>2]|0;c[m>>2]=(i|0)<0?-i|0:0;v=0;return v|0}}else{do{if((c[e>>2]|0)==5){z=0;A=0;B=a+12|0}else{i=c[d+12>>2]|0;m=a+12|0;g=c[m>>2]|0;if((c[a+8>>2]|0)>>>0>i>>>0){C=(c[b+12>>2]|0)+g|0}else{C=g}g=i+C<<1;if((c[e+4>>2]|0)!=0){z=g;A=C;B=m;break}z=g-1|0;A=C;B=m}}while(0);if((f|0)==0){c[B>>2]=A;c[a+8>>2]=c[d+12>>2];v=z;return v|0}else{c[B>>2]=0;c[a+8>>2]=0;v=0;return v|0}}return 0}function bJ(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0;d=i;i=i+16|0;e=d|0;f=d+8|0;cD(b|0,0,72);g=b|0;h=cv(a,g)|0;L2790:do{if((h|0)==0){if((c[g>>2]|0)>>>0>255>>>0){j=1;break}k=b+4|0;l=cv(a,k)|0;if((l|0)!=0){j=l;break}if((c[k>>2]|0)>>>0>31>>>0){j=1;break}if((cj(a,1)|0)!=0){j=1;break}k=cj(a,1)|0;if((k|0)==-1){j=1;break}c[b+8>>2]=(k|0)==1;k=cv(a,e)|0;if((k|0)!=0){j=k;break}k=(c[e>>2]|0)+1|0;l=b+12|0;c[l>>2]=k;if(k>>>0>8>>>0){j=1;break}L2799:do{if(k>>>0>1>>>0){m=b+16|0;n=cv(a,m)|0;if((n|0)!=0){j=n;break L2790}n=c[m>>2]|0;if(n>>>0>6>>>0){j=1;break L2790}switch(n|0){case 0:{n=c[l>>2]|0;m=cB(n<<2)|0;o=b+20|0;c[o>>2]=m;if((m|0)==0){j=65535;break L2790}if((n|0)==0){break L2799}else{p=0}do{n=cv(a,e)|0;if((n|0)!=0){j=n;break L2790}c[(c[o>>2]|0)+(p<<2)>>2]=(c[e>>2]|0)+1;p=p+1|0;}while(p>>>0<(c[l>>2]|0)>>>0);break};case 2:{o=c[l>>2]|0;n=(o<<2)-4|0;m=cB(n)|0;q=b+24|0;c[q>>2]=m;r=cB(n)|0;n=b+28|0;c[n>>2]=r;if((m|0)==0|(r|0)==0){j=65535;break L2790}if((o|0)==1){break L2799}else{s=0}do{o=cv(a,e)|0;if((o|0)!=0){j=o;break L2790}c[(c[q>>2]|0)+(s<<2)>>2]=c[e>>2];o=cv(a,e)|0;if((o|0)!=0){j=o;break L2790}c[(c[n>>2]|0)+(s<<2)>>2]=c[e>>2];s=s+1|0;}while(s>>>0<((c[l>>2]|0)-1|0)>>>0);break};case 3:case 4:case 5:{n=cj(a,1)|0;if((n|0)==-1){j=1;break L2790}c[b+32>>2]=(n|0)==1;n=cv(a,e)|0;if((n|0)!=0){j=n;break L2790}c[b+36>>2]=(c[e>>2]|0)+1;break L2799;break};case 6:{n=cv(a,e)|0;if((n|0)!=0){j=n;break L2790}n=(c[e>>2]|0)+1|0;q=b+40|0;c[q>>2]=n;o=cB(n<<2)|0;r=b+44|0;c[r>>2]=o;if((o|0)==0){j=65535;break L2790}o=c[7104+((c[l>>2]|0)-1<<2)>>2]|0;m=0;t=n;while(1){if(m>>>0>=t>>>0){break L2799}n=cj(a,o)|0;c[(c[r>>2]|0)+(m<<2)>>2]=n;if((c[(c[r>>2]|0)+(m<<2)>>2]|0)>>>0>=(c[l>>2]|0)>>>0){j=1;break L2790}m=m+1|0;t=c[q>>2]|0}break};default:{break L2799}}}}while(0);l=cv(a,e)|0;if((l|0)!=0){j=l;break}l=c[e>>2]|0;if(l>>>0>31>>>0){j=1;break}c[b+48>>2]=l+1;l=cv(a,e)|0;if((l|0)!=0){j=l;break}if((c[e>>2]|0)>>>0>31>>>0){j=1;break}if((cj(a,1)|0)!=0){j=1;break}if((cj(a,2)|0)>>>0>2>>>0){j=1;break}l=cw(a,f)|0;if((l|0)!=0){j=l;break}l=(c[f>>2]|0)+26|0;if(l>>>0>51>>>0){j=1;break}c[b+52>>2]=l;l=cw(a,f)|0;if((l|0)!=0){j=l;break}if(((c[f>>2]|0)+26|0)>>>0>51>>>0){j=1;break}l=cw(a,f)|0;if((l|0)!=0){j=l;break}l=c[f>>2]|0;if((l+12|0)>>>0>24>>>0){j=1;break}c[b+56>>2]=l;l=cj(a,1)|0;if((l|0)==-1){j=1;break}c[b+60>>2]=(l|0)==1;l=cj(a,1)|0;if((l|0)==-1){j=1;break}c[b+64>>2]=(l|0)==1;l=cj(a,1)|0;if((l|0)==-1){j=1;break}c[b+68>>2]=(l|0)==1;cr(a)|0;j=0}else{j=h}}while(0);i=d;return j|0}function bK(b,c,e,f,g,h,j,k,l){b=b|0;c=c|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;var m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0;m=i;i=i+144|0;n=m|0;do{if((e|0)<0){o=2124}else{if((e+1+k|0)>>>0>g>>>0|(f|0)<0){o=2124;break}if((l+f|0)>>>0>h>>>0){o=2124}else{p=b;q=e;r=f;s=g;t=h}}}while(0);if((o|0)==2124){o=n|0;u=k+1|0;bL(b,o,e,f,g,h,u,l,u);bL(b+(Z(h,g)|0)|0,n+(Z(u,l)|0)|0,e,f,g,h,u,l,u);p=o;q=0;r=0;s=u;t=l}u=8-j|0;o=l>>>1;l=(o|0)==0;h=k>>>1;g=(h|0)==0;f=16-k|0;e=(s<<1)-k|0;k=s+1|0;n=s+2|0;b=h<<1;v=0;do{w=p+((Z((Z(v,t)|0)+r|0,s)|0)+q)|0;if(!(l|g)){x=o;y=w;w=c+(v<<6)|0;while(1){z=h;A=y;B=w;while(1){C=d[A]|0;D=d[A+k|0]|0;E=A+2|0;F=d[A+1|0]|0;a[B+8|0]=(((Z(D,j)|0)+(Z(d[A+s|0]|0,u)|0)<<3)+32|0)>>>6&255;a[B]=(((Z(F,j)|0)+(Z(C,u)|0)<<3)+32|0)>>>6&255;C=d[E]|0;a[B+9|0]=(((Z(d[A+n|0]|0,j)|0)+(Z(D,u)|0)<<3)+32|0)>>>6&255;a[B+1|0]=(((Z(C,j)|0)+(Z(F,u)|0)<<3)+32|0)>>>6&255;F=z-1|0;if((F|0)==0){break}else{z=F;A=E;B=B+2|0}}B=x-1|0;if((B|0)==0){break}else{x=B;y=y+(b+e)|0;w=w+(b+f)|0}}}v=v+1|0;}while(v>>>0<2>>>0);i=m;return}function bL(a,b,c,d,e,f,g,h,i){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0;j=g+c|0;k=h+d|0;l=(c|0)<0|(j|0)>(e|0)?2:4;m=(k|0)<0?-h|0:d;d=(j|0)<0?-g|0:c;c=(m|0)>(f|0)?f:m;m=(d|0)>(e|0)?e:d;d=m+g|0;j=c+h|0;if((m|0)>0){n=a+m|0}else{n=a}if((c|0)>0){o=n+(Z(c,e)|0)|0}else{o=n}n=(m|0)<0?-m|0:0;m=(d|0)>(e|0)?d-e|0:0;d=g-n-m|0;g=(c|0)<0?-c|0:0;c=(j|0)>(f|0)?j-f|0:0;j=h-g|0;a=j-c|0;if((g|0)==0){p=b}else{q=~f;r=h-1-((k|0)>0?k:0)|0;s=(r|0)<(q|0)?q:r;r=~s;q=Z(s+((r|0)>0?r:0)+1|0,i)|0;r=b;s=g;while(1){as[l&7](o,r,n,d,m);g=s-1|0;if((g|0)==0){break}else{r=r+i|0;s=g}}p=b+q|0}if((j|0)==(c|0)){t=p;u=o}else{j=h-1|0;q=~f;b=j-((k|0)>0?k:0)|0;k=(b|0)<(q|0)?q:b;b=j-k|0;j=~k;q=h+f-1-((b|0)<(f|0)?f:b)-k-((j|0)>0?j:0)|0;j=Z(q,i)|0;k=Z(q,e)|0;q=p;b=o;f=a;while(1){as[l&7](b,q,n,d,m);a=f-1|0;if((a|0)==0){break}else{q=q+i|0;b=b+e|0;f=a}}t=p+j|0;u=o+k|0}k=u+(-e|0)|0;if((c|0)==0){return}else{v=t;w=c}while(1){as[l&7](k,v,n,d,m);c=w-1|0;if((c|0)==0){break}else{v=v+i|0;w=c}}return}function bM(b,c,e,f,g,h,j,k,l){b=b|0;c=c|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;var m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0;m=i;i=i+144|0;n=m|0;do{if((e|0)<0){o=2152}else{if((k+e|0)>>>0>g>>>0|(f|0)<0){o=2152;break}if((f+1+l|0)>>>0>h>>>0){o=2152}else{p=b;q=e;r=f;s=g;t=h}}}while(0);if((o|0)==2152){o=n|0;u=l+1|0;bL(b,o,e,f,g,h,k,u,k);bL(b+(Z(h,g)|0)|0,n+(Z(u,k)|0)|0,e,f,g,h,k,u,k);p=o;q=0;r=0;s=k;t=u}u=8-j|0;o=l>>>1;l=(o|0)==0;h=k>>>1;g=(h|0)==0;f=16-k|0;e=s<<1;n=e-k|0;k=e|1;b=s+1|0;v=h<<1;w=0;do{x=p+((Z((Z(w,t)|0)+r|0,s)|0)+q)|0;if(!(l|g)){y=o;z=x;x=c+(w<<6)|0;while(1){A=h;B=z;C=x;while(1){D=d[B+s|0]|0;E=d[B]|0;a[C+8|0]=(((Z(D,u)|0)+(Z(d[B+e|0]|0,j)|0)<<3)+32|0)>>>6&255;a[C]=(((Z(E,u)|0)+(Z(D,j)|0)<<3)+32|0)>>>6&255;D=d[B+b|0]|0;E=d[B+1|0]|0;a[C+9|0]=(((Z(D,u)|0)+(Z(d[B+k|0]|0,j)|0)<<3)+32|0)>>>6&255;a[C+1|0]=(((Z(E,u)|0)+(Z(D,j)|0)<<3)+32|0)>>>6&255;D=A-1|0;if((D|0)==0){break}else{A=D;B=B+2|0;C=C+2|0}}C=y-1|0;if((C|0)==0){break}else{y=C;z=z+(v+n)|0;x=x+(v+f)|0}}}w=w+1|0;}while(w>>>0<2>>>0);i=m;return}function bN(b,c,e,f,g,h,j,k,l,m){b=b|0;c=c|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;m=m|0;var n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0;n=i;i=i+168|0;o=n|0;do{if((e|0)<0){p=2163}else{if((e+1+l|0)>>>0>g>>>0|(f|0)<0){p=2163;break}if((f+1+m|0)>>>0>h>>>0){p=2163}else{q=b;r=e;s=f;t=g;u=h}}}while(0);if((p|0)==2163){p=o|0;v=l+1|0;w=m+1|0;bL(b,p,e,f,g,h,v,w,v);bL(b+(Z(h,g)|0)|0,o+(Z(w,v)|0)|0,e,f,g,h,v,w,v);q=p;r=0;s=0;t=v;u=w}w=8-j|0;v=8-k|0;p=m>>>1;m=(p|0)==0;h=t<<1;g=l>>>1;f=(g|0)==0;e=16-l|0;o=h-l|0;l=t+1|0;b=h|1;x=t+2|0;y=h+2|0;z=g<<1;A=0;do{B=q+((Z((Z(A,u)|0)+s|0,t)|0)+r)|0;if(!(m|f)){C=p;D=B;B=c+(A<<6)|0;while(1){E=d[D+t|0]|0;F=(Z(E,k)|0)+(Z(d[D]|0,v)|0)|0;G=g;H=(Z(d[D+h|0]|0,k)|0)+(Z(E,v)|0)|0;E=D;I=B;while(1){J=d[E+l|0]|0;K=(Z(J,k)|0)+(Z(d[E+1|0]|0,v)|0)|0;L=(Z(d[E+b|0]|0,k)|0)+(Z(J,v)|0)|0;J=((Z(F,w)|0)+32+(Z(K,j)|0)|0)>>>6;a[I+8|0]=((Z(H,w)|0)+32+(Z(L,j)|0)|0)>>>6&255;a[I]=J&255;J=E+2|0;M=d[E+x|0]|0;N=(Z(M,k)|0)+(Z(d[J]|0,v)|0)|0;O=(Z(d[E+y|0]|0,k)|0)+(Z(M,v)|0)|0;M=((Z(K,w)|0)+32+(Z(N,j)|0)|0)>>>6;a[I+9|0]=((Z(L,w)|0)+32+(Z(O,j)|0)|0)>>>6&255;a[I+1|0]=M&255;M=G-1|0;if((M|0)==0){break}else{F=N;G=M;H=O;E=J;I=I+2|0}}I=C-1|0;if((I|0)==0){break}else{C=I;D=D+(z+o)|0;B=B+(z+e)|0}}}A=A+1|0;}while(A>>>0<2>>>0);i=n;return}function bO(b,c,e,f,g,h,j,k){b=b|0;c=c|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0;l=i;i=i+448|0;m=l|0;do{if((e|0)<0){n=2174}else{if((j+e|0)>>>0>g>>>0|(f|0)<0){n=2174;break}if((f+5+k|0)>>>0>h>>>0){n=2174}else{o=b;p=e;q=f;r=g}}}while(0);if((n|0)==2174){n=m;bL(b,n,e,f,g,h,j,k+5|0,j);o=n;p=0;q=0;r=j}n=p+r+(Z(q,r)|0)|0;q=k>>>2;if((q|0)==0){i=l;return}k=r<<2;p=-r|0;h=p<<1;g=r<<1;if((j|0)==0){i=l;return}else{s=q;t=c;u=o+n|0;v=o+(n+(r*5|0))|0}while(1){n=j;o=t;c=u;q=v;while(1){f=d[q+h|0]|0;e=d[q+p|0]|0;b=d[q+r|0]|0;m=d[q]|0;w=b+f|0;x=d[c+g|0]|0;a[o+48|0]=a[((d[q+g|0]|0)+16-w-(w<<2)+x+((m+e|0)*20|0)>>5)+1808|0]|0;w=x+m|0;y=d[c+r|0]|0;a[o+32|0]=a[(b+16-w-(w<<2)+y+((e+f|0)*20|0)>>5)+1808|0]|0;w=y+e|0;b=d[c]|0;a[o+16|0]=a[(m+16-w-(w<<2)+b+((x+f|0)*20|0)>>5)+1808|0]|0;w=b+f|0;a[o]=a[(e+16-w-(w<<2)+(d[c+p|0]|0)+((y+x|0)*20|0)>>5)+1808|0]|0;x=n-1|0;if((x|0)==0){break}else{n=x;o=o+1|0;c=c+1|0;q=q+1|0}}q=s-1|0;if((q|0)==0){break}else{s=q;t=t+64|0;u=u+k|0;v=v+k|0}}i=l;return}function bP(b,c,e,f,g,h,j,k,l){b=b|0;c=c|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;var m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0;m=i;i=i+448|0;n=m|0;do{if((e|0)<0){o=2187}else{if((j+e|0)>>>0>g>>>0|(f|0)<0){o=2187;break}if((f+5+k|0)>>>0>h>>>0){o=2187}else{p=b;q=e;r=f;s=g}}}while(0);if((o|0)==2187){o=n;bL(b,o,e,f,g,h,j,k+5|0,j);p=o;q=0;r=0;s=j}o=q+s+(Z(r,s)|0)|0;r=k>>>2;if((r|0)==0){i=m;return}k=(j|0)==0;q=(s<<2)-j|0;h=64-j|0;g=-s|0;f=g<<1;e=s<<1;b=r;r=c;c=p+o|0;n=p+(o+(s*5|0))|0;t=p+(o+(Z(s,l+2|0)|0))|0;while(1){if(k){u=r;v=c;w=n;x=t}else{l=t+j|0;o=r+j|0;p=j;y=r;z=c;A=n;B=t;while(1){C=d[A+f|0]|0;D=d[A+g|0]|0;E=d[A+s|0]|0;F=d[A]|0;G=E+C|0;H=d[z+e|0]|0;a[y+48|0]=((d[((d[A+e|0]|0)+16-G-(G<<2)+H+((F+D|0)*20|0)>>5)+1808|0]|0)+1+(d[B+e|0]|0)|0)>>>1&255;G=H+F|0;I=d[z+s|0]|0;a[y+32|0]=((d[(E+16-G-(G<<2)+I+((D+C|0)*20|0)>>5)+1808|0]|0)+1+(d[B+s|0]|0)|0)>>>1&255;G=I+D|0;E=d[z]|0;a[y+16|0]=((d[(F+16-G-(G<<2)+E+((H+C|0)*20|0)>>5)+1808|0]|0)+1+(d[B]|0)|0)>>>1&255;G=E+C|0;a[y]=((d[(D+16-G-(G<<2)+(d[z+g|0]|0)+((I+H|0)*20|0)>>5)+1808|0]|0)+1+(d[B+g|0]|0)|0)>>>1&255;H=p-1|0;if((H|0)==0){break}else{p=H;y=y+1|0;z=z+1|0;A=A+1|0;B=B+1|0}}u=o;v=c+j|0;w=n+j|0;x=l}B=b-1|0;if((B|0)==0){break}else{b=B;r=u+h|0;c=v+q|0;n=w+q|0;t=x+q|0}}i=m;return}function bQ(b,c,e,f,g,h,j,k){b=b|0;c=c|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0;l=i;i=i+448|0;m=l|0;do{if((e|0)<0){n=2201}else{if((e+5+j|0)>>>0>g>>>0|(f|0)<0){n=2201;break}if((k+f|0)>>>0>h>>>0){n=2201}else{o=b;p=e;q=f;r=g}}}while(0);if((n|0)==2201){n=m;m=j+5|0;bL(b,n,e,f,g,h,m,k,m);o=n;p=0;q=0;r=m}if((k|0)==0){i=l;return}m=j>>>2;n=(m|0)==0;h=r-j|0;g=16-j|0;j=m<<2;f=o+(p+5+(Z(q,r)|0))|0;r=k;k=c;while(1){if(n){s=f;t=k}else{c=k+j|0;q=f;p=m;o=d[f-1|0]|0;e=d[f-2|0]|0;b=d[f-3|0]|0;u=d[f-4|0]|0;v=d[f-5|0]|0;w=k;while(1){x=u+o|0;y=d[q]|0;a[w]=a[(v+16-x-(x<<2)+y+((b+e|0)*20|0)>>5)+1808|0]|0;x=y+b|0;z=d[q+1|0]|0;a[w+1|0]=a[(u+16-x-(x<<2)+z+((e+o|0)*20|0)>>5)+1808|0]|0;x=z+e|0;A=d[q+2|0]|0;a[w+2|0]=a[(b+16-x-(x<<2)+A+((y+o|0)*20|0)>>5)+1808|0]|0;x=A+o|0;B=d[q+3|0]|0;a[w+3|0]=a[(e+16-x-(x<<2)+B+((z+y|0)*20|0)>>5)+1808|0]|0;x=p-1|0;if((x|0)==0){break}else{q=q+4|0;p=x;v=o;o=B;e=A;b=z;u=y;w=w+4|0}}s=f+j|0;t=c}w=r-1|0;if((w|0)==0){break}else{f=s+h|0;r=w;k=t+g|0}}i=l;return}function bR(b,c,e,f,g,h,j,k,l){b=b|0;c=c|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;var m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0;m=i;i=i+448|0;n=m|0;do{if((e|0)<0){o=2215}else{if((e+5+j|0)>>>0>g>>>0|(f|0)<0){o=2215;break}if((k+f|0)>>>0>h>>>0){o=2215}else{p=b;q=e;r=f;s=g}}}while(0);if((o|0)==2215){o=n;n=j+5|0;bL(b,o,e,f,g,h,n,k,n);p=o;q=0;r=0;s=n}if((k|0)==0){i=m;return}n=j>>>2;o=(n|0)==0;h=s-j|0;g=16-j|0;j=(l|0)!=0;l=n<<2;f=p+(q+5+(Z(r,s)|0))|0;s=k;k=c;while(1){if(o){t=f;u=k}else{c=k+l|0;r=f;q=n;p=k;e=d[f-1|0]|0;b=d[f-2|0]|0;v=d[f-3|0]|0;w=d[f-4|0]|0;x=d[f-5|0]|0;while(1){y=w+e|0;z=d[r]|0;a[p]=((j?b:v)+1+(d[(x+16-y-(y<<2)+z+((v+b|0)*20|0)>>5)+1808|0]|0)|0)>>>1&255;y=z+v|0;A=d[r+1|0]|0;a[p+1|0]=((j?e:b)+1+(d[(w+16-y-(y<<2)+A+((b+e|0)*20|0)>>5)+1808|0]|0)|0)>>>1&255;y=A+b|0;B=d[r+2|0]|0;a[p+2|0]=((j?z:e)+1+(d[(v+16-y-(y<<2)+B+((z+e|0)*20|0)>>5)+1808|0]|0)|0)>>>1&255;y=B+e|0;C=d[r+3|0]|0;a[p+3|0]=((j?A:z)+1+(d[(b+16-y-(y<<2)+C+((A+z|0)*20|0)>>5)+1808|0]|0)|0)>>>1&255;y=q-1|0;if((y|0)==0){break}else{r=r+4|0;q=y;p=p+4|0;x=e;e=C;b=B;v=A;w=z}}t=f+l|0;u=c}w=s-1|0;if((w|0)==0){break}else{f=t+h|0;s=w;k=u+g|0}}i=m;return}function bS(b,c,e,f,g,h,j,k,l){b=b|0;c=c|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;var m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0;m=i;i=i+448|0;n=m|0;do{if((e|0)<0){o=2229}else{if((e+5+j|0)>>>0>g>>>0|(f|0)<0){o=2229;break}if((f+5+k|0)>>>0>h>>>0){o=2229}else{p=b;q=e;r=f;s=g}}}while(0);if((o|0)==2229){o=n;n=j+5|0;bL(b,o,e,f,g,h,n,k+5|0,n);p=o;q=0;r=0;s=n}n=(Z(r,s)|0)+q|0;q=(l&1|2)+s+n|0;r=p+q|0;if((k|0)==0){i=m;return}o=j>>>2;h=(o|0)==0;g=s-j|0;f=16-j|0;e=o<<2;b=c;c=p+((Z(s,l>>>1&1|2)|0)+5+n)|0;n=k;while(1){if(h){t=b;u=c}else{l=b+e|0;v=b;w=c;x=o;y=d[c-1|0]|0;z=d[c-2|0]|0;A=d[c-3|0]|0;B=d[c-4|0]|0;C=d[c-5|0]|0;while(1){D=B+y|0;E=d[w]|0;a[v]=a[(C+16-D-(D<<2)+E+((A+z|0)*20|0)>>5)+1808|0]|0;D=E+A|0;F=d[w+1|0]|0;a[v+1|0]=a[(B+16-D-(D<<2)+F+((z+y|0)*20|0)>>5)+1808|0]|0;D=F+z|0;G=d[w+2|0]|0;a[v+2|0]=a[(A+16-D-(D<<2)+G+((E+y|0)*20|0)>>5)+1808|0]|0;D=G+y|0;H=d[w+3|0]|0;a[v+3|0]=a[(z+16-D-(D<<2)+H+((F+E|0)*20|0)>>5)+1808|0]|0;D=x-1|0;if((D|0)==0){break}else{v=v+4|0;w=w+4|0;x=D;C=y;y=H;z=G;A=F;B=E}}t=l;u=c+e|0}B=n-1|0;if((B|0)==0){break}else{b=t+f|0;c=u+g|0;n=B}}n=k>>>2;if((n|0)==0){i=m;return}g=(j|0)==0;u=(s<<2)-j|0;c=64-j|0;b=-s|0;e=b<<1;o=s<<1;h=t+(f-(k<<4))|0;k=r;r=p+(q+(s*5|0))|0;q=n;while(1){if(g){I=h;J=k;K=r}else{n=h+j|0;p=h;f=k;t=r;B=j;while(1){A=d[t+e|0]|0;z=d[t+b|0]|0;y=d[t+s|0]|0;C=d[t]|0;x=y+A|0;w=d[f+o|0]|0;v=p+48|0;a[v]=((d[((d[t+o|0]|0)+16-x-(x<<2)+w+((C+z|0)*20|0)>>5)+1808|0]|0)+1+(d[v]|0)|0)>>>1&255;v=w+C|0;x=d[f+s|0]|0;E=p+32|0;a[E]=((d[(y+16-v-(v<<2)+x+((z+A|0)*20|0)>>5)+1808|0]|0)+1+(d[E]|0)|0)>>>1&255;E=d[f]|0;v=x+z|0;y=p+16|0;a[y]=((d[(C+16-v-(v<<2)+E+((w+A|0)*20|0)>>5)+1808|0]|0)+1+(d[y]|0)|0)>>>1&255;y=E+A|0;a[p]=((d[(z+16-y-(y<<2)+(d[f+b|0]|0)+((x+w|0)*20|0)>>5)+1808|0]|0)+1+(d[p]|0)|0)>>>1&255;w=B-1|0;if((w|0)==0){break}else{p=p+1|0;f=f+1|0;t=t+1|0;B=w}}I=n;J=k+j|0;K=r+j|0}B=q-1|0;if((B|0)==0){break}else{h=I+c|0;k=J+u|0;r=K+u|0;q=B}}i=m;return}function bT(b,e,f,g,h,j,k,l){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;var m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0;m=i;i=i+1792|0;n=m|0;o=m+448|0;do{if((f|0)<0){p=2252}else{if((f+5+k|0)>>>0>h>>>0|(g|0)<0){p=2252;break}if((g+5+l|0)>>>0>j>>>0){p=2252;break}q=b;r=f+5|0;s=g;t=h;u=l+5|0}}while(0);if((p|0)==2252){p=n;n=k+5|0;v=l+5|0;bL(b,p,f,g,h,j,n,v,n);q=p;r=5;s=0;t=n;u=v}if((u|0)!=0){v=k>>>2;n=(v|0)==0;p=t-k|0;j=v<<2;h=u;u=o|0;g=q+(r+(Z(s,t)|0))|0;while(1){if(n){w=u;x=g}else{t=u+(j<<2)|0;s=v;r=d[g-1|0]|0;q=d[g-2|0]|0;f=d[g-3|0]|0;b=d[g-4|0]|0;y=d[g-5|0]|0;z=u;A=g;while(1){B=b+r|0;C=d[A]|0;c[z>>2]=y-B-(B<<2)+C+((f+q|0)*20|0);B=C+f|0;D=d[A+1|0]|0;c[z+4>>2]=b-B+D-(B<<2)+((q+r|0)*20|0);B=D+q|0;E=d[A+2|0]|0;c[z+8>>2]=f-B+E-(B<<2)+((C+r|0)*20|0);B=E+r|0;F=d[A+3|0]|0;c[z+12>>2]=q-B+F-(B<<2)+((D+C|0)*20|0);B=s-1|0;if((B|0)==0){break}else{s=B;y=r;r=F;q=E;f=D;b=C;z=z+16|0;A=A+4|0}}w=t;x=g+j|0}A=h-1|0;if((A|0)==0){break}else{h=A;u=w;g=x+p|0}}}p=l>>>2;if((p|0)==0){i=m;return}l=(k|0)==0;x=64-k|0;g=k*3|0;w=-k|0;u=w<<1;h=k<<1;j=e;e=p;p=o+(k<<2)|0;v=o+((k*6|0)<<2)|0;while(1){if(l){G=j;H=p;I=v}else{o=j+k|0;n=j;A=k;z=p;b=v;while(1){f=c[b+(u<<2)>>2]|0;q=c[b+(w<<2)>>2]|0;r=c[b+(k<<2)>>2]|0;y=c[b>>2]|0;s=r+f|0;C=c[z+(h<<2)>>2]|0;a[n+48|0]=a[((c[b+(h<<2)>>2]|0)+512-s-(s<<2)+C+((y+q|0)*20|0)>>10)+1808|0]|0;s=C+y|0;D=c[z+(k<<2)>>2]|0;a[n+32|0]=a[(r+512-s-(s<<2)+D+((q+f|0)*20|0)>>10)+1808|0]|0;s=c[z>>2]|0;r=D+q|0;a[n+16|0]=a[(y+512-r-(r<<2)+s+((C+f|0)*20|0)>>10)+1808|0]|0;r=s+f|0;a[n]=a[(q+512-r-(r<<2)+(c[z+(w<<2)>>2]|0)+((D+C|0)*20|0)>>10)+1808|0]|0;C=A-1|0;if((C|0)==0){break}else{n=n+1|0;A=C;z=z+4|0;b=b+4|0}}G=o;H=p+(k<<2)|0;I=v+(k<<2)|0}b=e-1|0;if((b|0)==0){break}else{j=G+x|0;e=b;p=H+(g<<2)|0;v=I+(g<<2)|0}}i=m;return}function bU(b,e,f,g,h,j,k,l,m){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;m=m|0;var n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0;n=i;i=i+1792|0;o=n|0;p=n+448|0;do{if((f|0)<0){q=2274}else{if((f+5+k|0)>>>0>h>>>0|(g|0)<0){q=2274;break}if((g+5+l|0)>>>0>j>>>0){q=2274;break}r=b;s=f+5|0;t=g;u=h;v=l+5|0}}while(0);if((q|0)==2274){q=o;o=k+5|0;w=l+5|0;bL(b,q,f,g,h,j,o,w,o);r=q;s=5;t=0;u=o;v=w}if((v|0)!=0){w=k>>>2;o=(w|0)==0;q=u-k|0;j=w<<2;h=v;v=p|0;g=r+(s+(Z(t,u)|0))|0;while(1){if(o){x=v;y=g}else{u=v+(j<<2)|0;t=w;s=d[g-1|0]|0;r=d[g-2|0]|0;f=d[g-3|0]|0;b=d[g-4|0]|0;z=d[g-5|0]|0;A=v;B=g;while(1){C=b+s|0;D=d[B]|0;c[A>>2]=z-C-(C<<2)+D+((f+r|0)*20|0);C=D+f|0;E=d[B+1|0]|0;c[A+4>>2]=b-C+E-(C<<2)+((r+s|0)*20|0);C=E+r|0;F=d[B+2|0]|0;c[A+8>>2]=f-C+F-(C<<2)+((D+s|0)*20|0);C=F+s|0;G=d[B+3|0]|0;c[A+12>>2]=r-C+G-(C<<2)+((E+D|0)*20|0);C=t-1|0;if((C|0)==0){break}else{t=C;z=s;s=G;r=F;f=E;b=D;A=A+16|0;B=B+4|0}}x=u;y=g+j|0}B=h-1|0;if((B|0)==0){break}else{h=B;v=x;g=y+q|0}}}q=l>>>2;if((q|0)==0){i=n;return}l=(k|0)==0;y=64-k|0;g=k*3|0;x=-k|0;v=x<<1;h=k<<1;j=e;e=q;q=p+(k<<2)|0;w=p+((k*6|0)<<2)|0;o=p+((Z(m+2|0,k)|0)+k<<2)|0;while(1){if(l){H=j;I=q;J=w;K=o}else{m=o+(k<<2)|0;p=j+k|0;B=j;A=k;b=q;f=w;r=o;while(1){s=c[f+(v<<2)>>2]|0;z=c[f+(x<<2)>>2]|0;t=c[f+(k<<2)>>2]|0;D=c[f>>2]|0;E=t+s|0;F=c[b+(h<<2)>>2]|0;a[B+48|0]=((d[((c[f+(h<<2)>>2]|0)+512-E-(E<<2)+F+((D+z|0)*20|0)>>10)+1808|0]|0)+1+(d[((c[r+(h<<2)>>2]|0)+16>>5)+1808|0]|0)|0)>>>1&255;E=F+D|0;G=c[b+(k<<2)>>2]|0;a[B+32|0]=((d[(t+512-E-(E<<2)+G+((z+s|0)*20|0)>>10)+1808|0]|0)+1+(d[((c[r+(k<<2)>>2]|0)+16>>5)+1808|0]|0)|0)>>>1&255;E=c[b>>2]|0;t=G+z|0;a[B+16|0]=((d[(D+512-t-(t<<2)+E+((F+s|0)*20|0)>>10)+1808|0]|0)+1+(d[((c[r>>2]|0)+16>>5)+1808|0]|0)|0)>>>1&255;t=E+s|0;a[B]=((d[(z+512-t-(t<<2)+(c[b+(x<<2)>>2]|0)+((G+F|0)*20|0)>>10)+1808|0]|0)+1+(d[((c[r+(x<<2)>>2]|0)+16>>5)+1808|0]|0)|0)>>>1&255;F=A-1|0;if((F|0)==0){break}else{B=B+1|0;A=F;b=b+4|0;f=f+4|0;r=r+4|0}}H=p;I=q+(k<<2)|0;J=w+(k<<2)|0;K=m}r=e-1|0;if((r|0)==0){break}else{j=H+y|0;e=r;q=I+(g<<2)|0;w=J+(g<<2)|0;o=K+(g<<2)|0}}i=n;return}function bV(b,e,f,g,h,j,k,l,m){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;m=m|0;var n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0;n=i;i=i+1792|0;o=n|0;p=n+448|0;q=k+5|0;do{if((f|0)<0){r=2295}else{if((f+5+k|0)>>>0>h>>>0|(g|0)<0){r=2295;break}if((g+5+l|0)>>>0>j>>>0){r=2295}else{s=b;t=f;u=g;v=h}}}while(0);if((r|0)==2295){r=o;bL(b,r,f,g,h,j,q,l+5|0,q);s=r;t=0;u=0;v=q}r=t+v+(Z(u,v)|0)|0;u=l>>>2;if((u|0)!=0){t=(q|0)==0;j=(v<<2)-k-5|0;h=q*3|0;g=-v|0;f=g<<1;b=v<<1;o=q<<1;w=-5-k|0;x=u;u=p+(q<<2)|0;y=s+r|0;z=s+(r+(v*5|0))|0;while(1){if(t){A=u;B=y;C=z}else{r=u+(q<<2)|0;s=q;D=u;E=y;F=z;while(1){G=d[F+f|0]|0;H=d[F+g|0]|0;I=d[F+v|0]|0;J=d[F]|0;K=I+G|0;L=d[E+b|0]|0;c[D+(o<<2)>>2]=(d[F+b|0]|0)-K-(K<<2)+L+((J+H|0)*20|0);K=L+J|0;M=d[E+v|0]|0;c[D+(q<<2)>>2]=I-K+M-(K<<2)+((H+G|0)*20|0);K=d[E]|0;I=M+H|0;c[D>>2]=J-I+K-(I<<2)+((L+G|0)*20|0);I=K+G|0;c[D+(w<<2)>>2]=H-I+(d[E+g|0]|0)-(I<<2)+((M+L|0)*20|0);L=s-1|0;if((L|0)==0){break}else{s=L;D=D+4|0;E=E+1|0;F=F+1|0}}A=r;B=y+q|0;C=z+q|0}F=x-1|0;if((F|0)==0){break}else{x=F;u=A+(h<<2)|0;y=B+j|0;z=C+j|0}}}if((l|0)==0){i=n;return}j=k>>>2;C=(j|0)==0;z=16-k|0;k=j<<2;B=l;l=p+20|0;y=p+(m+2<<2)|0;m=e;while(1){if(C){N=l;O=y;P=m}else{e=y+(k<<2)|0;p=j;h=c[l-4>>2]|0;A=c[l-8>>2]|0;u=c[l-12>>2]|0;x=c[l-16>>2]|0;q=c[l-20>>2]|0;g=l;w=y;v=m;while(1){b=x+h|0;o=c[g>>2]|0;a[v]=((d[(q+512-b-(b<<2)+o+((u+A|0)*20|0)>>10)+1808|0]|0)+1+(d[((c[w>>2]|0)+16>>5)+1808|0]|0)|0)>>>1&255;b=o+u|0;f=c[g+4>>2]|0;a[v+1|0]=((d[(x+512-b-(b<<2)+f+((A+h|0)*20|0)>>10)+1808|0]|0)+1+(d[((c[w+4>>2]|0)+16>>5)+1808|0]|0)|0)>>>1&255;b=f+A|0;t=c[g+8>>2]|0;a[v+2|0]=((d[(u+512-b-(b<<2)+t+((o+h|0)*20|0)>>10)+1808|0]|0)+1+(d[((c[w+8>>2]|0)+16>>5)+1808|0]|0)|0)>>>1&255;b=t+h|0;F=c[g+12>>2]|0;a[v+3|0]=((d[(A+512-b-(b<<2)+F+((f+o|0)*20|0)>>10)+1808|0]|0)+1+(d[((c[w+12>>2]|0)+16>>5)+1808|0]|0)|0)>>>1&255;b=p-1|0;if((b|0)==0){break}p=b;q=h;h=F;A=t;u=f;x=o;g=g+16|0;w=w+16|0;v=v+4|0}N=l+(k<<2)|0;O=e;P=m+k|0}v=B-1|0;if((v|0)==0){break}else{B=v;l=N+20|0;y=O+20|0;m=P+z|0}}i=n;return}function bW(a,d,e,f,g,h,i,j,k){a=a|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;l=a+((i<<4)+h)|0;m=d|0;n=b[m>>1]|0;o=d+2|0;d=b[o>>1]|0;p=e+4|0;q=c[p>>2]<<4;r=e+8|0;s=c[r>>2]<<4;t=h+f|0;f=t+(n>>2)|0;u=i+g|0;g=u+(d>>2)|0;switch(c[952+((n&3)<<4)+((d&3)<<2)>>2]|0){case 5:{bS(c[e>>2]|0,l,f-2|0,g-2|0,q,s,j,k,0);break};case 1:{bP(c[e>>2]|0,l,f,g-2|0,q,s,j,k,0);break};case 0:{bL(c[e>>2]|0,l,f,g,q,s,j,k,16);break};case 7:{bS(c[e>>2]|0,l,f-2|0,g-2|0,q,s,j,k,2);break};case 6:{bV(c[e>>2]|0,l,f-2|0,g-2|0,q,s,j,k,0);break};case 2:{bO(c[e>>2]|0,l,f,g-2|0,q,s,j,k);break};case 9:{bU(c[e>>2]|0,l,f-2|0,g-2|0,q,s,j,k,0);break};case 11:{bU(c[e>>2]|0,l,f-2|0,g-2|0,q,s,j,k,1);break};case 14:{bV(c[e>>2]|0,l,f-2|0,g-2|0,q,s,j,k,1);break};case 8:{bQ(c[e>>2]|0,l,f-2|0,g,q,s,j,k);break};case 13:{bS(c[e>>2]|0,l,f-2|0,g-2|0,q,s,j,k,1);break};case 10:{bT(c[e>>2]|0,l,f-2|0,g-2|0,q,s,j,k);break};case 3:{bP(c[e>>2]|0,l,f,g-2|0,q,s,j,k,1);break};case 12:{bR(c[e>>2]|0,l,f-2|0,g,q,s,j,k,1);break};case 4:{bR(c[e>>2]|0,l,f-2|0,g,q,s,j,k,0);break};default:{bS(c[e>>2]|0,l,f-2|0,g-2|0,q,s,j,k,3)}}s=(h>>>1)+256+(i>>>1<<3)|0;i=a+s|0;h=c[e>>2]|0;e=c[p>>2]|0;p=c[r>>2]|0;r=e<<3;q=p<<3;g=b[m>>1]|0;m=(g>>3)+(t>>>1)|0;t=b[o>>1]|0;o=(t>>3)+(u>>>1)|0;u=g&7;g=t&7;t=j>>>1;j=k>>>1;k=Z(e<<8,p)|0;p=h+k|0;e=(u|0)!=0;f=(g|0)==0;if(!(f|e^1)){bN(p,i,m,o,r,q,u,g,t,j);return}if(e){bK(p,i,m,o,r,q,u,t,j);return}if(f){bL(p,i,m,o,r,q,t,j,8);bL(h+((Z(q,r)|0)+k)|0,a+(s+64)|0,m,o,r,q,t,j,8);return}else{bM(p,i,m,o,r,q,g,t,j);return}}function bX(b,c,d,e,f){b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0;if((d|0)==0){g=c}else{cD(c|0,a[b]|0,d|0);g=c+d|0}if((e|0)==0){h=b;i=g}else{d=g+e|0;c=b;j=g;g=e;while(1){a[j]=a[c]|0;k=g-1|0;if((k|0)==0){break}c=c+1|0;j=j+1|0;g=k}h=b+e|0;i=d}if((f|0)==0){return}cD(i|0,a[h-1|0]|0,f|0);return}function bY(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;cE(b|0,a|0,d)|0;return}function bZ(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0;d=i;i=i+8|0;e=d|0;cD(b|0,0,92);f=cj(a,8)|0;L3165:do{if((f|0)==-1){g=1}else{c[b>>2]=f;cj(a,1)|0;cj(a,1)|0;if((cj(a,1)|0)==-1){g=1;break}if((cj(a,5)|0)==-1){g=1;break}h=cj(a,8)|0;if((h|0)==-1){g=1;break}j=b+4|0;c[j>>2]=h;h=b+8|0;k=cv(a,h)|0;if((k|0)!=0){g=k;break}if((c[h>>2]|0)>>>0>31>>>0){g=1;break}h=cv(a,e)|0;if((h|0)!=0){g=h;break}h=c[e>>2]|0;if(h>>>0>12>>>0){g=1;break}c[b+12>>2]=1<<h+4;h=cv(a,e)|0;if((h|0)!=0){g=h;break}h=c[e>>2]|0;if(h>>>0>2>>>0){g=1;break}c[b+16>>2]=h;L3176:do{if((h|0)==1){k=cj(a,1)|0;if((k|0)==-1){g=1;break L3165}c[b+24>>2]=(k|0)==1;k=cw(a,b+28|0)|0;if((k|0)!=0){g=k;break L3165}k=cw(a,b+32|0)|0;if((k|0)!=0){g=k;break L3165}k=b+36|0;l=cv(a,k)|0;if((l|0)!=0){g=l;break L3165}l=c[k>>2]|0;if(l>>>0>255>>>0){g=1;break L3165}if((l|0)==0){c[b+40>>2]=0;break}m=cB(l<<2)|0;n=b+40|0;c[n>>2]=m;if((m|0)==0){g=65535;break L3165}else{o=0;p=l}while(1){if(o>>>0>=p>>>0){break L3176}l=cw(a,(c[n>>2]|0)+(o<<2)|0)|0;if((l|0)!=0){g=l;break L3165}o=o+1|0;p=c[k>>2]|0}}else if((h|0)==0){k=cv(a,e)|0;if((k|0)!=0){g=k;break L3165}k=c[e>>2]|0;if(k>>>0>12>>>0){g=1;break L3165}c[b+20>>2]=1<<k+4}}while(0);h=b+44|0;k=cv(a,h)|0;if((k|0)!=0){g=k;break}if((c[h>>2]|0)>>>0>16>>>0){g=1;break}k=cj(a,1)|0;if((k|0)==-1){g=1;break}c[b+48>>2]=(k|0)==1;k=cv(a,e)|0;if((k|0)!=0){g=k;break}k=b+52|0;c[k>>2]=(c[e>>2]|0)+1;n=cv(a,e)|0;if((n|0)!=0){g=n;break}n=b+56|0;c[n>>2]=(c[e>>2]|0)+1;l=cj(a,1)|0;if((l|0)==(-1|0)|(l|0)==0){g=1;break}if((cj(a,1)|0)==-1){g=1;break}l=cj(a,1)|0;if((l|0)==-1){g=1;break}m=(l|0)==1;c[b+60>>2]=m&1;if(m){m=b+64|0;l=cv(a,m)|0;if((l|0)!=0){g=l;break}l=b+68|0;q=cv(a,l)|0;if((q|0)!=0){g=q;break}q=b+72|0;r=cv(a,q)|0;if((r|0)!=0){g=r;break}r=b+76|0;s=cv(a,r)|0;if((s|0)!=0){g=s;break}s=c[k>>2]|0;if((c[m>>2]|0)>((s<<3)+~c[l>>2]|0)){g=1;break}l=c[n>>2]|0;if((c[q>>2]|0)>((l<<3)+~c[r>>2]|0)){g=1;break}else{t=s;u=l}}else{t=c[k>>2]|0;u=c[n>>2]|0}n=Z(u,t)|0;switch(c[j>>2]|0){case 11:{v=396;w=345600;x=2412;break};case 50:{v=22080;w=42393600;x=2412;break};case 51:{v=36864;w=70778880;x=2412;break};case 10:{v=99;w=152064;x=2412;break};case 21:{v=792;w=1824768;x=2412;break};case 22:{v=1620;w=3110400;x=2412;break};case 30:{v=1620;w=3110400;x=2412;break};case 31:{v=3600;w=6912e3;x=2412;break};case 32:{v=5120;w=7864320;x=2412;break};case 40:{v=8192;w=12582912;x=2412;break};case 41:{v=8192;w=12582912;x=2412;break};case 42:{v=8704;w=13369344;x=2412;break};case 12:{v=396;w=912384;x=2412;break};case 13:{v=396;w=912384;x=2412;break};case 20:{v=396;w=912384;x=2412;break};default:{x=2413}}do{if((x|0)==2412){if(v>>>0<n>>>0){x=2413;break}k=(w>>>0)/((n*384|0)>>>0)|0;l=k>>>0<16>>>0?k:16;c[e>>2]=l;k=c[h>>2]|0;if(k>>>0>l>>>0){y=k;x=2415}else{z=l}}}while(0);if((x|0)==2413){c[e>>2]=2147483647;y=c[h>>2]|0;x=2415}if((x|0)==2415){c[e>>2]=y;z=y}n=b+88|0;c[n>>2]=z;j=cj(a,1)|0;if((j|0)==-1){g=1;break}l=(j|0)==1;c[b+80>>2]=l&1;do{if(l){j=cB(952)|0;k=j;s=b+84|0;c[s>>2]=k;if((j|0)==0){g=65535;break L3165}j=cz(a,k)|0;if((j|0)!=0){g=j;break L3165}j=c[s>>2]|0;if((c[j+920>>2]|0)==0){break}s=c[j+948>>2]|0;if((c[j+944>>2]|0)>>>0>s>>>0){g=1;break L3165}if(s>>>0<(c[h>>2]|0)>>>0){g=1;break L3165}if(s>>>0>(c[n>>2]|0)>>>0){g=1;break L3165}c[n>>2]=(s|0)==0?1:s}}while(0);cr(a)|0;g=0}}while(0);i=d;return g|0}function b_(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0;if((c[a>>2]|0)!=(c[b>>2]|0)){d=1;return d|0}if((c[a+4>>2]|0)!=(c[b+4>>2]|0)){d=1;return d|0}if((c[a+12>>2]|0)!=(c[b+12>>2]|0)){d=1;return d|0}e=c[a+16>>2]|0;if((e|0)!=(c[b+16>>2]|0)){d=1;return d|0}if((c[a+44>>2]|0)!=(c[b+44>>2]|0)){d=1;return d|0}if((c[a+48>>2]|0)!=(c[b+48>>2]|0)){d=1;return d|0}if((c[a+52>>2]|0)!=(c[b+52>>2]|0)){d=1;return d|0}if((c[a+56>>2]|0)!=(c[b+56>>2]|0)){d=1;return d|0}f=c[a+60>>2]|0;if((f|0)!=(c[b+60>>2]|0)){d=1;return d|0}if((c[a+80>>2]|0)!=(c[b+80>>2]|0)){d=1;return d|0}L3276:do{if((e|0)==0){if((c[a+20>>2]|0)==(c[b+20>>2]|0)){break}else{d=1}return d|0}else if((e|0)==1){if((c[a+24>>2]|0)!=(c[b+24>>2]|0)){d=1;return d|0}if((c[a+28>>2]|0)!=(c[b+28>>2]|0)){d=1;return d|0}if((c[a+32>>2]|0)!=(c[b+32>>2]|0)){d=1;return d|0}g=c[a+36>>2]|0;if((g|0)!=(c[b+36>>2]|0)){d=1;return d|0}h=a+40|0;i=b+40|0;j=0;while(1){if(j>>>0>=g>>>0){break L3276}if((c[(c[h>>2]|0)+(j<<2)>>2]|0)==(c[(c[i>>2]|0)+(j<<2)>>2]|0)){j=j+1|0}else{d=1;break}}return d|0}}while(0);do{if((f|0)!=0){if((c[a+64>>2]|0)!=(c[b+64>>2]|0)){d=1;return d|0}if((c[a+68>>2]|0)!=(c[b+68>>2]|0)){d=1;return d|0}if((c[a+72>>2]|0)!=(c[b+72>>2]|0)){d=1;return d|0}if((c[a+76>>2]|0)==(c[b+76>>2]|0)){break}else{d=1}return d|0}}while(0);d=0;return d|0}function b$(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0;f=i;i=i+448|0;g=f|0;h=f+432|0;j=f+440|0;k=g+(-g&15)|0;g=c[b+3376>>2]|0;l=c[e>>2]|0;c[h>>2]=0;m=b+1192|0;c[m>>2]=(c[m>>2]|0)+1;n=b+1200|0;c[n>>2]=0;o=b+12|0;c[j>>2]=(c[e+48>>2]|0)+(c[(c[o>>2]|0)+52>>2]|0);p=e+36|0;q=b+1212|0;r=e+52|0;s=e+56|0;t=e+60|0;u=e+4|0;v=b+1176|0;w=g+12|0;x=g|0;y=e+44|0;e=b+1220|0;z=b+1172|0;A=0;B=l;l=0;L3312:while(1){C=c[q>>2]|0;if((c[p>>2]|0)==0){if((c[C+(B*216|0)+196>>2]|0)!=0){D=1;E=2503;break}}F=c[(c[o>>2]|0)+56>>2]|0;G=c[r>>2]|0;H=c[s>>2]|0;I=c[t>>2]|0;c[C+(B*216|0)+4>>2]=c[m>>2];c[C+(B*216|0)+8>>2]=G;c[C+(B*216|0)+12>>2]=H;c[C+(B*216|0)+16>>2]=I;c[C+(B*216|0)+24>>2]=F;F=c[u>>2]|0;do{if((F|0)==2|(F|0)==7){J=l}else{if((l|0)!=0){J=l;break}C=cv(a,h)|0;if((C|0)!=0){D=C;E=2497;break L3312}C=c[h>>2]|0;if(C>>>0>((c[v>>2]|0)-B|0)>>>0){D=1;E=2499;break L3312}if((C|0)==0){J=0;break}cD(w|0,0,164);c[x>>2]=0;J=1}}while(0);F=c[h>>2]|0;if((F|0)==0){C=bs(a,g,(c[q>>2]|0)+(B*216|0)|0,c[u>>2]|0,c[y>>2]|0)|0;if((C|0)==0){K=0}else{D=C;E=2496;break}}else{c[h>>2]=F-1;K=J}F=bx((c[q>>2]|0)+(B*216|0)|0,g,d,e,j,B,c[(c[o>>2]|0)+64>>2]|0,k)|0;if((F|0)!=0){D=F;E=2498;break}L=((c[(c[q>>2]|0)+(B*216|0)+196>>2]|0)==1)+A|0;if((cs(a)|0)==0){M=(c[h>>2]|0)!=0}else{M=1}F=c[u>>2]|0;if((F|0)==2|(F|0)==7){c[n>>2]=B}F=ct(c[z>>2]|0,c[v>>2]|0,B)|0;if(M&(F|0)==0){D=1;E=2502;break}if(M){A=L;B=F;l=K}else{E=2493;break}}if((E|0)==2496){i=f;return D|0}else if((E|0)==2497){i=f;return D|0}else if((E|0)==2499){i=f;return D|0}else if((E|0)==2503){i=f;return D|0}else if((E|0)==2493){K=b+1196|0;b=(c[K>>2]|0)+L|0;if(b>>>0>(c[v>>2]|0)>>>0){D=1;i=f;return D|0}c[K>>2]=b;D=0;i=f;return D|0}else if((E|0)==2502){i=f;return D|0}else if((E|0)==2498){i=f;return D|0}return 0}function b0(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0;d=c[a+1192>>2]|0;e=c[a+1200>>2]|0;f=a+1212|0;L3349:do{if((e|0)==0){g=b}else{h=a+16|0;i=0;j=e;while(1){k=j;do{k=k-1|0;if(k>>>0<=b>>>0){g=k;break L3349}}while((c[(c[f>>2]|0)+(k*216|0)+4>>2]|0)!=(d|0));l=i+1|0;m=c[(c[h>>2]|0)+52>>2]|0;if(l>>>0<(m>>>0>10>>>0?m:10)>>>0){i=l;j=k}else{g=k;break}}}}while(0);b=a+1172|0;e=a+1176|0;a=g;while(1){g=c[f>>2]|0;if((c[g+(a*216|0)+4>>2]|0)!=(d|0)){n=2515;break}j=g+(a*216|0)+196|0;g=c[j>>2]|0;if((g|0)==0){n=2517;break}c[j>>2]=g-1;g=ct(c[b>>2]|0,c[e>>2]|0,a)|0;if((g|0)==0){n=2516;break}else{a=g}}if((n|0)==2517){return}else if((n|0)==2515){return}else if((n|0)==2516){return}}function b1(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0;g=Z(f,e)|0;h=c[b+12>>2]|0;if((h|0)==1){cD(a|0,0,g<<2|0);return}i=c[b+16>>2]|0;do{if((i-3|0)>>>0<3>>>0){j=Z(c[b+36>>2]|0,d)|0;k=j>>>0<g>>>0?j:g;j=c[b+32>>2]|0;if((i-4|0)>>>0<2>>>0){l=(j|0)==0?k:g-k|0;break}if((g|0)!=0){m=0;do{c[a+(m<<2)>>2]=1;m=m+1|0;}while(m>>>0<g>>>0)}m=(e-j|0)>>>1;n=(f-j|0)>>>1;if((k|0)==0){return}o=j<<1;p=o-1|0;q=e-1|0;r=1-o|0;o=f-1|0;s=0;t=m;u=n;v=j-1|0;w=j;x=m;y=n;z=m;m=n;while(1){n=a+((Z(u,e)|0)+t<<2)|0;A=(c[n>>2]|0)==1;B=A&1;if(A){c[n>>2]=0}do{if((v|0)==-1&(t|0)==(x|0)){n=x-1|0;A=(n|0)>0?n:0;C=m;D=z;E=y;F=A;G=p;H=0;I=u;J=A}else{if((v|0)==1&(t|0)==(z|0)){A=z+1|0;n=(A|0)<(q|0)?A:q;C=m;D=n;E=y;F=x;G=r;H=0;I=u;J=n;break}if((w|0)==-1&(u|0)==(y|0)){n=y-1|0;A=(n|0)>0?n:0;C=m;D=z;E=A;F=x;G=0;H=r;I=A;J=t;break}if((w|0)==1&(u|0)==(m|0)){A=m+1|0;n=(A|0)<(o|0)?A:o;C=n;D=z;E=y;F=x;G=0;H=p;I=n;J=t;break}else{C=m;D=z;E=y;F=x;G=w;H=v;I=u+w|0;J=t+v|0;break}}}while(0);n=B+s|0;if(n>>>0<k>>>0){s=n;t=J;u=I;v=H;w=G;x=F;y=E;z=D;m=C}else{break}}return}else{l=0}}while(0);switch(i|0){case 2:{i=c[b+24>>2]|0;C=c[b+28>>2]|0;D=h-1|0;if((g|0)!=0){E=0;do{c[a+(E<<2)>>2]=D;E=E+1|0;}while(E>>>0<g>>>0)}if((D|0)==0){return}D=h-2|0;while(1){E=c[i+(D<<2)>>2]|0;F=(E>>>0)/(e>>>0)|0;G=(E>>>0)%(e>>>0)|0;E=c[C+(D<<2)>>2]|0;H=(E>>>0)/(e>>>0)|0;I=(E>>>0)%(e>>>0)|0;L3421:do{if(F>>>0<=H>>>0){if(G>>>0>I>>>0){E=F;while(1){E=E+1|0;if(E>>>0>H>>>0){break L3421}}}else{K=F}do{E=Z(K,e)|0;B=G;do{c[a+(B+E<<2)>>2]=D;B=B+1|0;}while(B>>>0<=I>>>0);K=K+1|0;}while(K>>>0<=H>>>0)}}while(0);if((D|0)==0){break}else{D=D-1|0}}return};case 5:{D=c[b+32>>2]|0;if((e|0)==0){return}K=1-D|0;if((f|0)==0){return}else{L=0;M=0}while(1){C=0;i=M;while(1){H=a+((Z(C,e)|0)+L<<2)|0;c[H>>2]=i>>>0<l>>>0?D:K;H=C+1|0;if(H>>>0<f>>>0){C=H;i=i+1|0}else{break}}i=L+1|0;if(i>>>0<e>>>0){L=i;M=M+f|0}else{break}}return};case 4:{f=c[b+32>>2]|0;if((g|0)==0){return}M=1-f|0;L=0;do{c[a+(L<<2)>>2]=L>>>0<l>>>0?f:M;L=L+1|0;}while(L>>>0<g>>>0);return};case 1:{if((g|0)==0){return}else{N=0}do{c[a+(N<<2)>>2]=((((Z((N>>>0)/(e>>>0)|0,h)|0)>>>1)+((N>>>0)%(e>>>0)|0)|0)>>>0)%(h>>>0)|0;N=N+1|0;}while(N>>>0<g>>>0);return};case 0:{N=c[b+20>>2]|0;if((g|0)==0){return}else{O=0;P=0}while(1){e=P;while(1){if(e>>>0<h>>>0){break}else{e=0}}L=N+(e<<2)|0;M=c[L>>2]|0;L3466:do{if((M|0)==0){Q=0}else{f=0;l=M;while(1){K=f+O|0;if(K>>>0>=g>>>0){Q=l;break L3466}c[a+(K<<2)>>2]=e;K=f+1|0;D=c[L>>2]|0;if(K>>>0<D>>>0){f=K;l=D}else{Q=D;break}}}}while(0);L=Q+O|0;if(L>>>0<g>>>0){O=L;P=e+1|0}else{break}}return};default:{if((g|0)==0){return}P=b+44|0;b=0;do{c[a+(b<<2)>>2]=c[(c[P>>2]|0)+(b<<2)>>2];b=b+1|0;}while(b>>>0<g>>>0);return}}}function b2(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0;g=i;i=i+48|0;h=g|0;j=g+8|0;k=g+16|0;l=g+24|0;m=g+32|0;n=g+40|0;cD(b|0,0,988);o=Z(c[d+56>>2]|0,c[d+52>>2]|0)|0;p=cv(a,m)|0;if((p|0)!=0){q=p;i=g;return q|0}p=c[m>>2]|0;c[b>>2]=p;if(p>>>0>=o>>>0){q=1;i=g;return q|0}p=cv(a,m)|0;if((p|0)!=0){q=p;i=g;return q|0}p=c[m>>2]|0;r=b+4|0;c[r>>2]=p;if((p|0)==0|(p|0)==5){s=2592}else if(!((p|0)==2|(p|0)==7)){q=1;i=g;return q|0}do{if((s|0)==2592){if((c[f>>2]|0)==5){q=1;i=g;return q|0}if((c[d+44>>2]|0)==0){q=1}else{break}i=g;return q|0}}while(0);p=cv(a,m)|0;if((p|0)!=0){q=p;i=g;return q|0}p=c[m>>2]|0;c[b+8>>2]=p;if((p|0)!=(c[e>>2]|0)){q=1;i=g;return q|0}p=d+12|0;t=c[p>>2]|0;u=0;while(1){if((t>>>(u>>>0)|0)==0){break}else{u=u+1|0}}t=cj(a,u-1|0)|0;if((t|0)==-1){q=1;i=g;return q|0}u=f|0;if(!((c[u>>2]|0)!=5|(t|0)==0)){q=1;i=g;return q|0}c[b+12>>2]=t;do{if((c[u>>2]|0)==5){t=cv(a,m)|0;if((t|0)!=0){q=t;i=g;return q|0}t=c[m>>2]|0;c[b+16>>2]=t;if(t>>>0>65535>>>0){q=1}else{break}i=g;return q|0}}while(0);t=d+16|0;v=c[t>>2]|0;if((v|0)==0){w=d+20|0;x=c[w>>2]|0;y=0;while(1){if((x>>>(y>>>0)|0)==0){break}else{y=y+1|0}}x=cj(a,y-1|0)|0;if((x|0)==-1){q=1;i=g;return q|0}y=b+20|0;c[y>>2]=x;do{if((c[e+8>>2]|0)!=0){x=cw(a,n)|0;if((x|0)==0){c[b+24>>2]=c[n>>2];break}else{q=x;i=g;return q|0}}}while(0);do{if((c[u>>2]|0)==5){x=c[y>>2]|0;if(x>>>0>(c[w>>2]|0)>>>1>>>0){q=1;i=g;return q|0}z=c[b+24>>2]|0;if((x|0)==(((z|0)>0?0:-z|0)|0)){break}else{q=1}i=g;return q|0}}while(0);A=c[t>>2]|0}else{A=v}do{if((A|0)==1){if((c[d+24>>2]|0)!=0){break}v=cw(a,n)|0;if((v|0)!=0){q=v;i=g;return q|0}v=b+28|0;c[v>>2]=c[n>>2];do{if((c[e+8>>2]|0)!=0){t=cw(a,n)|0;if((t|0)==0){c[b+32>>2]=c[n>>2];break}else{q=t;i=g;return q|0}}}while(0);if((c[u>>2]|0)!=5){break}t=c[v>>2]|0;w=(c[d+32>>2]|0)+t+(c[b+32>>2]|0)|0;if((((t|0)<(w|0)?t:w)|0)==0){break}else{q=1}i=g;return q|0}}while(0);do{if((c[e+68>>2]|0)!=0){A=cv(a,m)|0;if((A|0)!=0){q=A;i=g;return q|0}A=c[m>>2]|0;c[b+36>>2]=A;if(A>>>0>127>>>0){q=1}else{break}i=g;return q|0}}while(0);A=c[r>>2]|0;if((A|0)==0|(A|0)==5){w=cj(a,1)|0;if((w|0)==-1){q=1;i=g;return q|0}c[b+40>>2]=w;do{if((w|0)==0){t=c[e+48>>2]|0;if(t>>>0>16>>>0){q=1;i=g;return q|0}else{c[b+44>>2]=t;break}}else{t=cv(a,m)|0;if((t|0)!=0){q=t;i=g;return q|0}t=c[m>>2]|0;if(t>>>0>15>>>0){q=1;i=g;return q|0}else{c[b+44>>2]=t+1;break}}}while(0);B=c[r>>2]|0}else{B=A}do{if((B|0)==0|(B|0)==5){A=c[b+44>>2]|0;r=c[p>>2]|0;w=cj(a,1)|0;if((w|0)==-1){q=1;i=g;return q|0}c[b+68>>2]=w;if((w|0)==0){break}else{C=0}L3581:while(1){if(C>>>0>A>>>0){q=1;s=2711;break}w=cv(a,l)|0;if((w|0)!=0){q=w;s=2712;break}w=c[l>>2]|0;if(w>>>0>3>>>0){q=1;s=2698;break}c[b+72+(C*12|0)>>2]=w;do{if(w>>>0<2>>>0){t=cv(a,k)|0;if((t|0)!=0){q=t;s=2743;break L3581}t=c[k>>2]|0;if(t>>>0>=r>>>0){q=1;s=2744;break L3581}c[b+72+(C*12|0)+4>>2]=t+1}else{if((w|0)!=2){break}t=cv(a,k)|0;if((t|0)!=0){q=t;s=2703;break L3581}c[b+72+(C*12|0)+8>>2]=c[k>>2]}}while(0);if((c[l>>2]|0)==3){s=2648;break}else{C=C+1|0}}if((s|0)==2648){if((C|0)==0){q=1}else{break}i=g;return q|0}else if((s|0)==2703){i=g;return q|0}else if((s|0)==2711){i=g;return q|0}else if((s|0)==2712){i=g;return q|0}else if((s|0)==2698){i=g;return q|0}else if((s|0)==2743){i=g;return q|0}else if((s|0)==2744){i=g;return q|0}}}while(0);do{if((c[f+4>>2]|0)!=0){C=c[d+44>>2]|0;l=(c[u>>2]|0)==5;k=cj(a,1)|0;p=(k|0)==-1;if(l){if(p){q=1;i=g;return q|0}c[b+276>>2]=k;l=cj(a,1)|0;if((l|0)==-1){q=1;i=g;return q|0}c[b+280>>2]=l;if((C|0)!=0|(l|0)==0){break}else{q=1}i=g;return q|0}if(p){q=1;i=g;return q|0}c[b+284>>2]=k;if((k|0)==0){break}k=(C<<1)+2|0;p=0;l=0;B=0;r=0;A=0;while(1){if(A>>>0>k>>>0){q=1;s=2713;break}v=cv(a,j)|0;if((v|0)!=0){q=v;s=2714;break}v=c[j>>2]|0;if(v>>>0>6>>>0){q=1;s=2735;break}c[b+288+(A*20|0)>>2]=v;if((v|0)==3|(v|0)==1){w=cv(a,h)|0;if((w|0)!=0){q=w;s=2736;break}c[b+288+(A*20|0)+4>>2]=(c[h>>2]|0)+1;D=c[j>>2]|0}else{D=v}if((D|0)==2){v=cv(a,h)|0;if((v|0)!=0){q=v;s=2710;break}c[b+288+(A*20|0)+8>>2]=c[h>>2];E=c[j>>2]|0}else{E=D}if((E|0)==6|(E|0)==3){v=cv(a,h)|0;if((v|0)!=0){q=v;s=2739;break}c[b+288+(A*20|0)+12>>2]=c[h>>2];F=c[j>>2]|0}else{F=E}if((F|0)==4){v=cv(a,h)|0;if((v|0)!=0){q=v;s=2754;break}v=c[h>>2]|0;if(v>>>0>C>>>0){q=1;s=2755;break}if((v|0)==0){c[b+288+(A*20|0)+16>>2]=65535}else{c[b+288+(A*20|0)+16>>2]=v-1}G=r+1|0;H=c[j>>2]|0}else{G=r;H=F}I=((H|0)==5)+B|0;J=((H|0)!=0&H>>>0<4>>>0&1)+p|0;K=((H|0)==6)+l|0;if((H|0)==0){s=2677;break}else{p=J;l=K;B=I;r=G;A=A+1|0}}if((s|0)==2677){if(G>>>0>1>>>0|I>>>0>1>>>0|K>>>0>1>>>0){q=1;i=g;return q|0}if((J|0)==0|(I|0)==0){break}else{q=1}i=g;return q|0}else if((s|0)==2710){i=g;return q|0}else if((s|0)==2713){i=g;return q|0}else if((s|0)==2714){i=g;return q|0}else if((s|0)==2754){i=g;return q|0}else if((s|0)==2755){i=g;return q|0}else if((s|0)==2735){i=g;return q|0}else if((s|0)==2736){i=g;return q|0}else if((s|0)==2739){i=g;return q|0}}}while(0);s=cw(a,n)|0;if((s|0)!=0){q=s;i=g;return q|0}s=c[n>>2]|0;c[b+48>>2]=s;I=s+(c[e+52>>2]|0)|0;c[n>>2]=I;if(I>>>0>51>>>0){q=1;i=g;return q|0}do{if((c[e+60>>2]|0)!=0){I=cv(a,m)|0;if((I|0)!=0){q=I;i=g;return q|0}I=c[m>>2]|0;c[b+52>>2]=I;if(I>>>0>2>>>0){q=1;i=g;return q|0}if((I|0)==1){break}I=cw(a,n)|0;if((I|0)!=0){q=I;i=g;return q|0}I=c[n>>2]|0;if((I+6|0)>>>0>12>>>0){q=1;i=g;return q|0}c[b+56>>2]=I<<1;I=cw(a,n)|0;if((I|0)!=0){q=I;i=g;return q|0}I=c[n>>2]|0;if((I+6|0)>>>0>12>>>0){q=1;i=g;return q|0}else{c[b+60>>2]=I<<1;break}}}while(0);do{if((c[e+12>>2]|0)>>>0>1>>>0){if(((c[e+16>>2]|0)-3|0)>>>0>=3>>>0){break}n=e+36|0;I=c[n>>2]|0;s=(((o>>>0)%(I>>>0)|0|0)==0?1:2)+((o>>>0)/(I>>>0)|0)|0;I=0;while(1){L=I+1|0;if((-1<<L&s|0)==0){break}else{I=L}}J=cj(a,((1<<I)-1&s|0)==0?I:L)|0;c[m>>2]=J;if((J|0)==-1){q=1;i=g;return q|0}c[b+64>>2]=J;K=c[n>>2]|0;if(J>>>0>(((o-1+K|0)>>>0)/(K>>>0)|0)>>>0){q=1}else{break}i=g;return q|0}}while(0);q=0;i=g;return q|0}function b3(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0;d=i;i=i+32|0;e=d|0;f=d+8|0;g=f|0;h=f;f=a;c[h>>2]=c[f>>2];c[h+4>>2]=c[f+4>>2];c[h+8>>2]=c[f+8>>2];c[h+12>>2]=c[f+12>>2];c[h+16>>2]=c[f+16>>2];f=cv(g,e)|0;if((f|0)!=0){j=f;i=d;return j|0}f=cv(g,e)|0;if((f|0)!=0){j=f;i=d;return j|0}f=cv(g,e)|0;if((f|0)!=0){j=f;i=d;return j|0}f=c[e>>2]|0;if(f>>>0>255>>>0){j=1;i=d;return j|0}c[b>>2]=f;j=0;i=d;return j|0}function b4(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0;e=i;i=i+32|0;f=e|0;g=e+8|0;h=g|0;j=g;g=a;c[j>>2]=c[g>>2];c[j+4>>2]=c[g+4>>2];c[j+8>>2]=c[g+8>>2];c[j+12>>2]=c[g+12>>2];c[j+16>>2]=c[g+16>>2];g=cv(h,f)|0;if((g|0)!=0){k=g;i=e;return k|0}g=cv(h,f)|0;if((g|0)!=0){k=g;i=e;return k|0}g=cv(h,f)|0;if((g|0)==0){l=0}else{k=g;i=e;return k|0}while(1){if((b>>>(l>>>0)|0)==0){break}else{l=l+1|0}}b=cj(h,l-1|0)|0;if((b|0)==-1){k=1;i=e;return k|0}c[d>>2]=b;k=0;i=e;return k|0}function b5(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0;f=i;i=i+32|0;g=f|0;h=f+8|0;if((d|0)!=5){j=1;i=f;return j|0}d=h|0;k=h;h=a;c[k>>2]=c[h>>2];c[k+4>>2]=c[h+4>>2];c[k+8>>2]=c[h+8>>2];c[k+12>>2]=c[h+12>>2];c[k+16>>2]=c[h+16>>2];h=cv(d,g)|0;if((h|0)!=0){j=h;i=f;return j|0}h=cv(d,g)|0;if((h|0)!=0){j=h;i=f;return j|0}h=cv(d,g)|0;if((h|0)==0){l=0}else{j=h;i=f;return j|0}while(1){if((b>>>(l>>>0)|0)==0){break}else{l=l+1|0}}if((cj(d,l-1|0)|0)==-1){j=1;i=f;return j|0}j=cv(d,e)|0;i=f;return j|0}function b6(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0;f=i;i=i+32|0;g=f|0;h=f+8|0;j=h|0;k=h;h=a;c[k>>2]=c[h>>2];c[k+4>>2]=c[h+4>>2];c[k+8>>2]=c[h+8>>2];c[k+12>>2]=c[h+12>>2];c[k+16>>2]=c[h+16>>2];h=cv(j,g)|0;if((h|0)!=0){l=h;i=f;return l|0}h=cv(j,g)|0;if((h|0)!=0){l=h;i=f;return l|0}h=cv(j,g)|0;if((h|0)!=0){l=h;i=f;return l|0}h=c[b+12>>2]|0;k=0;while(1){if((h>>>(k>>>0)|0)==0){break}else{k=k+1|0}}if((cj(j,k-1|0)|0)==-1){l=1;i=f;return l|0}do{if((d|0)==5){k=cv(j,g)|0;if((k|0)==0){break}else{l=k}i=f;return l|0}}while(0);g=c[b+20>>2]|0;b=0;while(1){if((g>>>(b>>>0)|0)==0){break}else{b=b+1|0}}g=cj(j,b-1|0)|0;if((g|0)==-1){l=1;i=f;return l|0}c[e>>2]=g;l=0;i=f;return l|0}function b7(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0;f=i;i=i+32|0;g=f|0;h=f+8|0;j=h|0;k=h;h=a;c[k>>2]=c[h>>2];c[k+4>>2]=c[h+4>>2];c[k+8>>2]=c[h+8>>2];c[k+12>>2]=c[h+12>>2];c[k+16>>2]=c[h+16>>2];h=cv(j,g)|0;if((h|0)!=0){l=h;i=f;return l|0}h=cv(j,g)|0;if((h|0)!=0){l=h;i=f;return l|0}h=cv(j,g)|0;if((h|0)!=0){l=h;i=f;return l|0}h=c[b+12>>2]|0;k=0;while(1){if((h>>>(k>>>0)|0)==0){break}else{k=k+1|0}}if((cj(j,k-1|0)|0)==-1){l=1;i=f;return l|0}do{if((d|0)==5){k=cv(j,g)|0;if((k|0)==0){break}else{l=k}i=f;return l|0}}while(0);g=c[b+20>>2]|0;b=0;while(1){if((g>>>(b>>>0)|0)==0){break}else{b=b+1|0}}if((cj(j,b-1|0)|0)==-1){l=1;i=f;return l|0}l=cw(j,e)|0;i=f;return l|0}function b8(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0;g=i;i=i+32|0;h=g|0;j=g+8|0;k=j|0;l=j;j=a;c[l>>2]=c[j>>2];c[l+4>>2]=c[j+4>>2];c[l+8>>2]=c[j+8>>2];c[l+12>>2]=c[j+12>>2];c[l+16>>2]=c[j+16>>2];j=cv(k,h)|0;if((j|0)!=0){m=j;i=g;return m|0}j=cv(k,h)|0;if((j|0)!=0){m=j;i=g;return m|0}j=cv(k,h)|0;if((j|0)!=0){m=j;i=g;return m|0}j=c[b+12>>2]|0;b=0;while(1){if((j>>>(b>>>0)|0)==0){break}else{b=b+1|0}}if((cj(k,b-1|0)|0)==-1){m=1;i=g;return m|0}do{if((d|0)==5){b=cv(k,h)|0;if((b|0)==0){break}else{m=b}i=g;return m|0}}while(0);h=cw(k,f)|0;if((h|0)!=0){m=h;i=g;return m|0}do{if((e|0)!=0){h=cw(k,f+4|0)|0;if((h|0)==0){break}else{m=h}i=g;return m|0}}while(0);m=0;i=g;return m|0}function b9(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0;f=i;i=i+40|0;g=f|0;h=f+8|0;j=f+16|0;k=j|0;l=j;j=b;c[l>>2]=c[j>>2];c[l+4>>2]=c[j+4>>2];c[l+8>>2]=c[j+8>>2];c[l+12>>2]=c[j+12>>2];c[l+16>>2]=c[j+16>>2];j=cv(k,g)|0;if((j|0)!=0){m=j;i=f;return m|0}j=cv(k,g)|0;if((j|0)!=0){m=j;i=f;return m|0}j=cv(k,g)|0;if((j|0)!=0){m=j;i=f;return m|0}j=c[d+12>>2]|0;l=0;while(1){if((j>>>(l>>>0)|0)==0){break}else{l=l+1|0}}if((cj(k,l-1|0)|0)==-1){m=1;i=f;return m|0}l=cv(k,g)|0;if((l|0)!=0){m=l;i=f;return m|0}l=d+16|0;j=c[l>>2]|0;if((j|0)==0){b=c[d+20>>2]|0;n=0;while(1){if((b>>>(n>>>0)|0)==0){break}else{n=n+1|0}}if((cj(k,n-1|0)|0)==-1){m=1;i=f;return m|0}do{if((c[e+8>>2]|0)!=0){n=cw(k,h)|0;if((n|0)==0){break}else{m=n}i=f;return m|0}}while(0);o=c[l>>2]|0}else{o=j}do{if((o|0)==1){if((c[d+24>>2]|0)!=0){break}j=cw(k,h)|0;if((j|0)!=0){m=j;i=f;return m|0}if((c[e+8>>2]|0)==0){break}j=cw(k,h)|0;if((j|0)==0){break}else{m=j}i=f;return m|0}}while(0);do{if((c[e+68>>2]|0)!=0){h=cv(k,g)|0;if((h|0)==0){break}else{m=h}i=f;return m|0}}while(0);g=cj(k,1)|0;c[a>>2]=g;m=(g|0)==-1|0;i=f;return m|0}function ca(a){a=a|0;cD(a|0,0,3388);c[a+8>>2]=32;c[a+4>>2]=256;c[a+1332>>2]=1;return}function cb(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0;d=c[b+8>>2]|0;e=a+20+(d<<2)|0;f=c[e>>2]|0;do{if((f|0)==0){g=cB(92)|0;c[e>>2]=g;if((g|0)==0){h=65535}else{break}return h|0}else{g=a+8|0;if((d|0)!=(c[g>>2]|0)){cC(c[f+40>>2]|0);c[(c[e>>2]|0)+40>>2]=0;cC(c[(c[e>>2]|0)+84>>2]|0);c[(c[e>>2]|0)+84>>2]=0;break}i=a+16|0;if((b_(b,c[i>>2]|0)|0)!=0){cC(c[(c[e>>2]|0)+40>>2]|0);c[(c[e>>2]|0)+40>>2]=0;cC(c[(c[e>>2]|0)+84>>2]|0);c[(c[e>>2]|0)+84>>2]=0;c[g>>2]=33;c[a+4>>2]=257;c[i>>2]=0;c[a+12>>2]=0;break}i=b+40|0;cC(c[i>>2]|0);c[i>>2]=0;i=b+84|0;cC(c[i>>2]|0);c[i>>2]=0;h=0;return h|0}}while(0);a=c[e>>2]|0;e=b;cE(a|0,e|0,92)|0;h=0;return h|0}function cc(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0;d=c[b>>2]|0;e=a+148+(d<<2)|0;f=c[e>>2]|0;do{if((f|0)==0){g=cB(72)|0;c[e>>2]=g;if((g|0)==0){h=65535}else{break}return h|0}else{g=a+4|0;if((d|0)!=(c[g>>2]|0)){cC(c[f+20>>2]|0);c[(c[e>>2]|0)+20>>2]=0;cC(c[(c[e>>2]|0)+24>>2]|0);c[(c[e>>2]|0)+24>>2]=0;cC(c[(c[e>>2]|0)+28>>2]|0);c[(c[e>>2]|0)+28>>2]=0;cC(c[(c[e>>2]|0)+44>>2]|0);c[(c[e>>2]|0)+44>>2]=0;break}if((c[b+4>>2]|0)==(c[a+8>>2]|0)){i=f}else{c[g>>2]=257;i=c[e>>2]|0}cC(c[i+20>>2]|0);c[(c[e>>2]|0)+20>>2]=0;cC(c[(c[e>>2]|0)+24>>2]|0);c[(c[e>>2]|0)+24>>2]=0;cC(c[(c[e>>2]|0)+28>>2]|0);c[(c[e>>2]|0)+28>>2]=0;cC(c[(c[e>>2]|0)+44>>2]|0);c[(c[e>>2]|0)+44>>2]=0}}while(0);i=c[e>>2]|0;e=b;cE(i|0,e|0,72)|0;h=0;return h|0}function cd(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0;e=a+148+(b<<2)|0;f=c[e>>2]|0;if((f|0)==0){g=1;return g|0}h=c[f+4>>2]|0;i=c[a+20+(h<<2)>>2]|0;if((i|0)==0){g=1;return g|0}j=c[i+52>>2]|0;k=Z(c[i+56>>2]|0,j)|0;i=c[f+12>>2]|0;L81:do{if(i>>>0>1>>>0){l=c[f+16>>2]|0;if((l|0)==0){m=f+20|0;n=0;while(1){if(n>>>0>=i>>>0){break L81}if((c[(c[m>>2]|0)+(n<<2)>>2]|0)>>>0>k>>>0){g=1;break}else{n=n+1|0}}return g|0}else if((l|0)==2){n=i-1|0;m=f+24|0;o=f+28|0;p=0;while(1){if(p>>>0>=n>>>0){break L81}q=c[(c[m>>2]|0)+(p<<2)>>2]|0;r=c[(c[o>>2]|0)+(p<<2)>>2]|0;if(!(q>>>0<=r>>>0&r>>>0<k>>>0)){g=1;s=97;break}if(((q>>>0)%(j>>>0)|0)>>>0>((r>>>0)%(j>>>0)|0)>>>0){g=1;s=96;break}else{p=p+1|0}}if((s|0)==96){return g|0}else if((s|0)==97){return g|0}}else{if((l-3|0)>>>0<3>>>0){if((c[f+36>>2]|0)>>>0>k>>>0){g=1}else{break}return g|0}if((l|0)!=6){break}if((c[f+40>>2]|0)>>>0<k>>>0){g=1}else{break}return g|0}}}while(0);k=a+4|0;f=c[k>>2]|0;do{if((f|0)==256){c[k>>2]=b;s=c[e>>2]|0;c[a+12>>2]=s;j=c[s+4>>2]|0;c[a+8>>2]=j;s=c[a+20+(j<<2)>>2]|0;c[a+16>>2]=s;j=s+52|0;i=s+56|0;c[a+1176>>2]=Z(c[i>>2]|0,c[j>>2]|0)|0;c[a+1340>>2]=c[j>>2];c[a+1344>>2]=c[i>>2];c[a+3380>>2]=1}else{i=a+3380|0;if((c[i>>2]|0)==0){if((f|0)==(b|0)){break}j=a+8|0;if((h|0)==(c[j>>2]|0)){c[k>>2]=b;c[a+12>>2]=c[e>>2];break}if((d|0)==0){g=1;return g|0}else{c[k>>2]=b;s=c[e>>2]|0;c[a+12>>2]=s;p=c[s+4>>2]|0;c[j>>2]=p;j=c[a+20+(p<<2)>>2]|0;c[a+16>>2]=j;p=j+52|0;s=j+56|0;c[a+1176>>2]=Z(c[s>>2]|0,c[p>>2]|0)|0;c[a+1340>>2]=c[p>>2];c[a+1344>>2]=c[s>>2];c[i>>2]=1;break}}c[i>>2]=0;i=a+1212|0;cC(c[i>>2]|0);c[i>>2]=0;s=a+1172|0;cC(c[s>>2]|0);p=c[a+1176>>2]|0;j=p*216|0;o=cB(j)|0;m=o;c[i>>2]=m;i=cB(p<<2)|0;c[s>>2]=i;if((o|0)==0|(i|0)==0){g=65535;return g|0}cD(o|0,0,j|0);j=a+16|0;bB(m,c[(c[j>>2]|0)+52>>2]|0,p);p=c[j>>2]|0;L121:do{if((c[a+1216>>2]|0)==0){if((c[p+16>>2]|0)==2){t=1;break}do{if((c[p+80>>2]|0)!=0){j=c[p+84>>2]|0;if((c[j+920>>2]|0)==0){break}if((c[j+944>>2]|0)==0){t=1;break L121}}}while(0);t=0}else{t=1}}while(0);l=Z(c[p+56>>2]|0,c[p+52>>2]|0)|0;j=bd(a+1220|0,l,c[p+88>>2]|0,c[p+44>>2]|0,c[p+12>>2]|0,t)|0;if((j|0)==0){break}else{g=j}return g|0}}while(0);g=0;return g|0}function ce(a){a=a|0;var b=0,d=0;c[a+1196>>2]=0;c[a+1192>>2]=0;b=a+1176|0;if((c[b>>2]|0)==0){return}d=a+1212|0;a=0;do{c[(c[d>>2]|0)+(a*216|0)+4>>2]=0;c[(c[d>>2]|0)+(a*216|0)+196>>2]=0;a=a+1|0;}while(a>>>0<(c[b>>2]|0)>>>0);return}function cf(a){a=a|0;return(c[a+1188>>2]|0)==0|0}function cg(a){a=a|0;var b=0,d=0,e=0,f=0,g=0;do{if((c[a+1404>>2]|0)==0){if((c[a+1196>>2]|0)==(c[a+1176>>2]|0)){b=1}else{break}return b|0}else{d=c[a+1176>>2]|0;if((d|0)==0){b=1;return b|0}e=c[a+1212>>2]|0;f=0;g=0;do{g=((c[e+(f*216|0)+196>>2]|0)!=0)+g|0;f=f+1|0;}while(f>>>0<d>>>0);if((g|0)==(d|0)){b=1}else{break}return b|0}}while(0);b=0;return b|0}function ch(a,b){a=a|0;b=b|0;var d=0;d=c[a+16>>2]|0;b1(c[a+1172>>2]|0,c[a+12>>2]|0,b,c[d+52>>2]|0,c[d+56>>2]|0);return}function ci(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0;f=i;i=i+48|0;g=f|0;h=f+8|0;j=f+16|0;k=f+24|0;l=f+32|0;m=f+40|0;c[e>>2]=0;n=b|0;o=c[n>>2]|0;if((o-6|0)>>>0<6>>>0|(o-13|0)>>>0<6>>>0){c[e>>2]=1;p=0;i=f;return p|0}if(!((o|0)==1|(o|0)==5)){p=0;i=f;return p|0}o=d+1300|0;q=d+1332|0;if((c[q>>2]|0)!=0){c[e>>2]=1;c[q>>2]=0}q=b3(a,g)|0;if((q|0)!=0){p=q;i=f;return p|0}q=c[d+148+(c[g>>2]<<2)>>2]|0;if((q|0)==0){p=65520;i=f;return p|0}g=c[q+4>>2]|0;r=c[d+20+(g<<2)>>2]|0;if((r|0)==0){p=65520;i=f;return p|0}s=c[d+8>>2]|0;do{if(!((s|0)==32|(g|0)==(s|0))){if((c[n>>2]|0)==5){break}else{p=65520}i=f;return p|0}}while(0);s=c[d+1304>>2]|0;g=c[b+4>>2]|0;do{if((s|0)!=(g|0)){if(!((s|0)==0|(g|0)==0)){break}c[e>>2]=1}}while(0);g=o|0;s=(c[n>>2]|0)==5;if((c[g>>2]|0)==5){if(!s){t=139}}else{if(s){t=139}}if((t|0)==139){c[e>>2]=1}t=r+12|0;if((b4(a,c[t>>2]|0,h)|0)!=0){p=1;i=f;return p|0}s=d+1308|0;u=c[h>>2]|0;if((c[s>>2]|0)!=(u|0)){c[s>>2]=u;c[e>>2]=1}if((c[n>>2]|0)==5){if((b5(a,c[t>>2]|0,5,j)|0)!=0){p=1;i=f;return p|0}do{if((c[g>>2]|0)==5){t=d+1312|0;u=c[t>>2]|0;s=c[j>>2]|0;if((u|0)==(s|0)){v=u;w=t;break}c[e>>2]=1;v=s;w=t}else{v=c[j>>2]|0;w=d+1312|0}}while(0);c[w>>2]=v}v=c[r+16>>2]|0;do{if((v|0)==0){if((b6(a,r,c[n>>2]|0,k)|0)!=0){p=1;i=f;return p|0}w=d+1316|0;j=c[k>>2]|0;if((c[w>>2]|0)!=(j|0)){c[w>>2]=j;c[e>>2]=1}if((c[q+8>>2]|0)==0){break}j=b7(a,r,c[n>>2]|0,l)|0;if((j|0)!=0){p=j;i=f;return p|0}j=d+1320|0;w=c[l>>2]|0;if((c[j>>2]|0)==(w|0)){break}c[j>>2]=w;c[e>>2]=1}else if((v|0)==1){if((c[r+24>>2]|0)!=0){break}w=q+8|0;j=m|0;g=b8(a,r,c[n>>2]|0,c[w>>2]|0,j)|0;if((g|0)!=0){p=g;i=f;return p|0}g=d+1324|0;t=c[j>>2]|0;if((c[g>>2]|0)!=(t|0)){c[g>>2]=t;c[e>>2]=1}if((c[w>>2]|0)==0){break}w=d+1328|0;t=c[m+4>>2]|0;if((c[w>>2]|0)==(t|0)){break}c[w>>2]=t;c[e>>2]=1}}while(0);e=b;b=o;o=c[e+4>>2]|0;c[b>>2]=c[e>>2];c[b+4>>2]=o;p=0;i=f;return p|0}function cj(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;e=a+4|0;f=c[e>>2]|0;g=c[a+12>>2]<<3;h=a+16|0;i=c[h>>2]|0;j=g-i|0;do{if((j|0)>31){k=a+8|0;l=c[k>>2]|0;m=(d[f+1|0]|0)<<16|(d[f]|0)<<24|(d[f+2|0]|0)<<8|(d[f+3|0]|0);if((l|0)==0){n=m;o=k;break}n=(d[f+4|0]|0)>>>((8-l|0)>>>0)|m<<l;o=k}else{k=a+8|0;if((j|0)<=0){n=0;o=k;break}l=c[k>>2]|0;m=l+24|0;p=(d[f]|0)<<m;q=j-8+l|0;if((q|0)>0){r=p;s=m;t=q;u=f}else{n=p;o=k;break}while(1){p=u+1|0;q=s-8|0;m=(d[p]|0)<<q|r;l=t-8|0;if((l|0)>0){r=m;s=q;t=l;u=p}else{n=m;o=k;break}}}}while(0);u=i+b|0;c[h>>2]=u;c[o>>2]=u&7;if(u>>>0>g>>>0){v=-1;return v|0}c[e>>2]=(c[a>>2]|0)+(u>>>3);v=n>>>((32-b|0)>>>0);return v|0}function ck(a){a=a|0;var b=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0;b=c[a+4>>2]|0;e=(c[a+12>>2]<<3)-(c[a+16>>2]|0)|0;if((e|0)>31){f=c[a+8>>2]|0;g=(d[b+1|0]|0)<<16|(d[b]|0)<<24|(d[b+2|0]|0)<<8|(d[b+3|0]|0);if((f|0)==0){h=g;return h|0}h=(d[b+4|0]|0)>>>((8-f|0)>>>0)|g<<f;return h|0}if((e|0)<=0){h=0;return h|0}f=c[a+8>>2]|0;a=f+24|0;g=(d[b]|0)<<a;i=e-8+f|0;if((i|0)>0){j=g;k=a;l=i;m=b}else{h=g;return h|0}while(1){g=m+1|0;b=k-8|0;i=(d[g]|0)<<b|j;a=l-8|0;if((a|0)>0){j=i;k=b;l=a;m=g}else{h=i;break}}return h|0}function cl(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;d=a+16|0;e=(c[d>>2]|0)+b|0;c[d>>2]=e;c[a+8>>2]=e&7;if(e>>>0>c[a+12>>2]<<3>>>0){f=-1;return f|0}c[a+4>>2]=(c[a>>2]|0)+(e>>>3);f=0;return f|0}function cm(a){a=a|0;return(c[a+8>>2]|0)==0|0}function cn(a,b,e,f){a=a|0;b=b|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0;g=d[896+b|0]|0;h=d[840+b|0]|0;b=c[1016+(h*12|0)>>2]<<g;i=c[1020+(h*12|0)>>2]<<g;j=c[1024+(h*12|0)>>2]<<g;if((e|0)==0){c[a>>2]=Z(c[a>>2]|0,b)|0}L270:do{if((f&65436|0)==0){if((f&98|0)==0){e=(c[a>>2]|0)+32>>6;if((e+512|0)>>>0>1023>>>0){k=1;return k|0}else{c[a+60>>2]=e;c[a+56>>2]=e;c[a+52>>2]=e;c[a+48>>2]=e;c[a+44>>2]=e;c[a+40>>2]=e;c[a+36>>2]=e;c[a+32>>2]=e;c[a+28>>2]=e;c[a+24>>2]=e;c[a+20>>2]=e;c[a+16>>2]=e;c[a+12>>2]=e;c[a+8>>2]=e;c[a+4>>2]=e;c[a>>2]=e;break}}e=a+4|0;g=Z(c[e>>2]|0,i)|0;h=a+20|0;l=Z(c[h>>2]|0,b)|0;m=a+24|0;n=Z(c[m>>2]|0,i)|0;o=c[a>>2]|0;p=(g>>1)-n|0;q=g+(n>>1)|0;n=l+o+32|0;g=n+q>>6;c[a>>2]=g;r=o-l+32|0;l=r+p>>6;c[e>>2]=l;e=r-p>>6;c[a+8>>2]=e;p=n-q>>6;c[a+12>>2]=p;c[a+48>>2]=g;c[a+32>>2]=g;c[a+16>>2]=g;c[a+52>>2]=l;c[a+36>>2]=l;c[h>>2]=l;c[a+56>>2]=e;c[a+40>>2]=e;c[m>>2]=e;c[a+60>>2]=p;c[a+44>>2]=p;c[a+28>>2]=p;if((g+512|0)>>>0>1023>>>0){k=1;return k|0}if((l+512|0)>>>0>1023>>>0){k=1;return k|0}if((e+512|0)>>>0>1023>>>0){k=1;return k|0}if((p+512|0)>>>0>1023>>>0){k=1}else{break}return k|0}else{p=a+4|0;e=c[a+56>>2]|0;l=Z(c[p>>2]|0,i)|0;g=Z(c[a+60>>2]|0,j)|0;m=a+8|0;h=c[m>>2]|0;q=a+16|0;n=Z(c[a+20>>2]|0,b)|0;r=Z(c[q>>2]|0,j)|0;o=a+12|0;s=c[o>>2]|0;t=Z(c[a+32>>2]|0,i)|0;u=Z(c[a+24>>2]|0,i)|0;v=c[a+28>>2]|0;w=c[a+36>>2]|0;x=Z(c[a+48>>2]|0,j)|0;y=c[a+44>>2]|0;z=Z(c[a+40>>2]|0,j)|0;A=Z(c[a+52>>2]|0,i)|0;B=c[a>>2]|0;C=n+B|0;D=B-n|0;n=(l>>1)-u|0;B=(u>>1)+l|0;c[a>>2]=B+C;c[p>>2]=n+D;c[m>>2]=D-n;c[o>>2]=C-B;B=Z(i,v+h|0)|0;C=Z(h-v|0,i)|0;v=(r>>1)-x|0;h=(x>>1)+r|0;c[q>>2]=h+B;c[a+20>>2]=v+C;c[a+24>>2]=C-v;c[a+28>>2]=B-h;h=Z(b,y+s|0)|0;B=Z(s-y|0,b)|0;y=(t>>1)-A|0;s=(A>>1)+t|0;c[a+32>>2]=s+h;c[a+36>>2]=y+B;c[a+40>>2]=B-y;c[a+44>>2]=h-s;s=Z(i,e+w|0)|0;h=Z(w-e|0,i)|0;e=(z>>1)-g|0;w=(g>>1)+z|0;c[a+48>>2]=w+s;c[a+52>>2]=e+h;c[a+56>>2]=h-e;c[a+60>>2]=s-w;w=4;s=a;while(1){if((w|0)==0){break L270}e=c[s>>2]|0;h=s+32|0;z=c[h>>2]|0;g=s+16|0;y=c[g>>2]|0;B=s+48|0;t=c[B>>2]|0;A=(y>>1)-t|0;v=(t>>1)+y|0;y=z+e+32|0;t=y+v>>6;c[s>>2]=t;C=e-z+32|0;z=C+A>>6;c[g>>2]=z;g=C-A>>6;c[h>>2]=g;h=y-v>>6;c[B>>2]=h;if((t+512|0)>>>0>1023>>>0){k=1;E=226;break}if((z+512|0)>>>0>1023>>>0){k=1;E=235;break}if((g+512|0)>>>0>1023>>>0){k=1;E=231;break}if((h+512|0)>>>0>1023>>>0){k=1;E=229;break}else{w=w-1|0;s=s+4|0}}if((E|0)==235){return k|0}else if((E|0)==226){return k|0}else if((E|0)==229){return k|0}else if((E|0)==231){return k|0}}}while(0);k=0;return k|0}function co(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0;e=a[840+d|0]|0;f=a[896+d|0]|0;g=b+8|0;h=c[g>>2]|0;i=c[b+20>>2]|0;j=b+16|0;k=c[j>>2]|0;l=b+32|0;m=c[l>>2]|0;n=b+12|0;o=c[n>>2]|0;p=c[b+24>>2]|0;q=c[b+28>>2]|0;r=b+48|0;s=c[r>>2]|0;t=c[b+36>>2]|0;u=c[b+40>>2]|0;v=c[b+44>>2]|0;w=c[b+52>>2]|0;x=c[b>>2]|0;y=i+x|0;z=x-i|0;i=b+4|0;x=c[i>>2]|0;A=x-p|0;B=p+x|0;x=B+y|0;c[b>>2]=x;p=A+z|0;c[i>>2]=p;C=z-A|0;c[g>>2]=C;g=y-B|0;c[n>>2]=g;n=q+h|0;B=h-q|0;q=k-s|0;h=s+k|0;k=h+n|0;c[j>>2]=k;s=q+B|0;c[b+20>>2]=s;y=B-q|0;c[b+24>>2]=y;q=n-h|0;c[b+28>>2]=q;h=v+o|0;n=o-v|0;v=m-w|0;o=w+m|0;m=o+h|0;c[b+32>>2]=m;w=v+n|0;c[b+36>>2]=w;B=n-v|0;c[b+40>>2]=B;v=h-o|0;c[b+44>>2]=v;o=b+56|0;h=c[o>>2]|0;n=h+t|0;A=t-h|0;h=b+60|0;t=c[h>>2]|0;z=u-t|0;D=t+u|0;u=D+n|0;c[b+48>>2]=u;t=z+A|0;c[b+52>>2]=t;E=A-z|0;c[o>>2]=E;o=n-D|0;c[h>>2]=o;h=f&255;f=c[1016+((e&255)*12|0)>>2]|0;if(d>>>0>11>>>0){e=f<<h-2;D=m+x|0;n=x-m|0;z=k-u|0;A=u+k|0;c[b>>2]=Z(A+D|0,e)|0;c[j>>2]=Z(z+n|0,e)|0;c[l>>2]=Z(n-z|0,e)|0;c[r>>2]=Z(D-A|0,e)|0;A=w+p|0;D=p-w|0;z=s-t|0;n=t+s|0;c[i>>2]=Z(n+A|0,e)|0;c[b+20>>2]=Z(z+D|0,e)|0;c[b+36>>2]=Z(D-z|0,e)|0;c[b+52>>2]=Z(A-n|0,e)|0;n=B+C|0;A=C-B|0;z=y-E|0;D=E+y|0;c[b+8>>2]=Z(D+n|0,e)|0;c[b+24>>2]=Z(z+A|0,e)|0;c[b+40>>2]=Z(A-z|0,e)|0;c[b+56>>2]=Z(n-D|0,e)|0;D=v+g|0;n=g-v|0;z=q-o|0;A=o+q|0;c[b+12>>2]=Z(A+D|0,e)|0;c[b+28>>2]=Z(z+n|0,e)|0;c[b+44>>2]=Z(n-z|0,e)|0;c[b+60>>2]=Z(D-A|0,e)|0;return}else{e=(d-6|0)>>>0<6>>>0?1:2;d=2-h|0;h=m+x|0;A=x-m|0;m=k-u|0;x=u+k|0;c[b>>2]=(Z(x+h|0,f)|0)+e>>d;c[j>>2]=(Z(m+A|0,f)|0)+e>>d;c[l>>2]=(Z(A-m|0,f)|0)+e>>d;c[r>>2]=(Z(h-x|0,f)|0)+e>>d;x=w+p|0;h=p-w|0;w=s-t|0;p=t+s|0;c[i>>2]=(Z(p+x|0,f)|0)+e>>d;c[b+20>>2]=(Z(w+h|0,f)|0)+e>>d;c[b+36>>2]=(Z(h-w|0,f)|0)+e>>d;c[b+52>>2]=(Z(x-p|0,f)|0)+e>>d;p=B+C|0;x=C-B|0;B=y-E|0;C=E+y|0;c[b+8>>2]=(Z(C+p|0,f)|0)+e>>d;c[b+24>>2]=(Z(B+x|0,f)|0)+e>>d;c[b+40>>2]=(Z(x-B|0,f)|0)+e>>d;c[b+56>>2]=(Z(p-C|0,f)|0)+e>>d;C=v+g|0;p=g-v|0;v=q-o|0;g=o+q|0;c[b+12>>2]=(Z(g+C|0,f)|0)+e>>d;c[b+28>>2]=(Z(v+p|0,f)|0)+e>>d;c[b+44>>2]=(Z(p-v|0,f)|0)+e>>d;c[b+60>>2]=(Z(C-g|0,f)|0)+e>>d;return}}function cp(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0;e=c[1016+((d[840+b|0]|0)*12|0)>>2]|0;if(b>>>0>5>>>0){f=0;g=e<<(d[896+b|0]|0)-1}else{f=1;g=e}e=c[a>>2]|0;b=a+8|0;h=c[b>>2]|0;i=h+e|0;j=e-h|0;h=a+4|0;e=c[h>>2]|0;k=a+12|0;l=c[k>>2]|0;m=e-l|0;n=l+e|0;c[a>>2]=(Z(n+i|0,g)|0)>>f;c[h>>2]=(Z(i-n|0,g)|0)>>f;c[b>>2]=(Z(m+j|0,g)|0)>>f;c[k>>2]=(Z(j-m|0,g)|0)>>f;m=a+16|0;j=c[m>>2]|0;k=a+24|0;b=c[k>>2]|0;n=b+j|0;i=j-b|0;b=a+20|0;j=c[b>>2]|0;h=a+28|0;a=c[h>>2]|0;e=j-a|0;l=a+j|0;c[m>>2]=(Z(l+n|0,g)|0)>>f;c[b>>2]=(Z(n-l|0,g)|0)>>f;c[k>>2]=(Z(e+i|0,g)|0)>>f;c[h>>2]=(Z(i-e|0,g)|0)>>f;return}function cq(a,b){a=a|0;b=b|0;var c=0,d=0,e=0,f=0,g=0;c=0;d=1<<b-1;while(1){if((d&a|0)!=0){e=c;f=249;break}b=c+1|0;g=d>>>1;if((g|0)==0){e=b;f=250;break}else{c=b;d=g}}if((f|0)==250){return e|0}else if((f|0)==249){return e|0}return 0}function cr(a){a=a|0;var b=0,d=0,e=0;b=8-(c[a+8>>2]|0)|0;d=cj(a,b)|0;if((d|0)==-1){e=1;return e|0}e=(d|0)!=(c[760+(b-1<<2)>>2]|0)|0;return e|0}function cs(a){a=a|0;var b=0,d=0,e=0,f=0;b=c[a+12>>2]<<3;d=c[a+16>>2]|0;e=b-d|0;if((b|0)==(d|0)){f=0;return f|0}if(e>>>0>8>>>0){f=1;return f|0}else{return((ck(a)|0)>>>((32-e|0)>>>0)|0)!=(1<<e-1|0)|0}return 0}function ct(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0;e=c[a+(d<<2)>>2]|0;f=d;do{f=f+1|0;if(f>>>0>=b>>>0){break}}while((c[a+(f<<2)>>2]|0)!=(e|0));return((f|0)==(b|0)?0:f)|0}function cu(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0;d=c[a+4>>2]|0;e=(b>>>0)%(d>>>0)|0;f=b-e|0;b=Z(c[a+8>>2]|0,d)|0;d=c[a>>2]|0;c[a+12>>2]=d+((f<<8)+(e<<4));g=(e<<3)+(b<<8)+(f<<6)|0;c[a+16>>2]=d+g;c[a+20>>2]=d+(g+(b<<6));return}function cv(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0;d=ck(a)|0;do{if((d|0)<0){cl(a,1)|0;c[b>>2]=0;e=0}else{if(d>>>0>1073741823>>>0){if((cl(a,3)|0)==-1){e=1;break}c[b>>2]=(d>>>29&1)+1;e=0;break}if(d>>>0>536870911>>>0){if((cl(a,5)|0)==-1){e=1;break}c[b>>2]=(d>>>27&3)+3;e=0;break}if(d>>>0>268435455>>>0){if((cl(a,7)|0)==-1){e=1;break}c[b>>2]=(d>>>25&7)+7;e=0;break}f=cq(d,28)|0;g=f+4|0;if((g|0)!=32){h=f+5|0;cl(a,h)|0;h=cj(a,g)|0;if((h|0)==-1){e=1;break}c[b>>2]=(1<<g)-1+h;e=0;break}c[b>>2]=0;cl(a,32)|0;if((cj(a,1)|0)!=1){e=1;break}h=ck(a)|0;if((cl(a,32)|0)==-1){e=1;break}if((h|0)==0){c[b>>2]=-1;e=0;break}else if((h|0)==1){c[b>>2]=-1;e=1;break}else{e=1;break}}}while(0);return e|0}function cw(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0;d=i;i=i+8|0;e=d|0;c[e>>2]=0;f=cv(a,e)|0;a=c[e>>2]|0;e=(f|0)==0;do{if((a|0)==-1){if(e){g=1;break}c[b>>2]=-2147483648;g=0}else{if(!e){g=1;break}f=(a+1|0)>>>1;c[b>>2]=(a&1|0)!=0?f:-f|0;g=0}}while(0);i=d;return g|0}function cx(a,b,e){a=a|0;b=b|0;e=e|0;var f=0,g=0,h=0;f=i;i=i+8|0;g=f|0;if((cv(a,g)|0)!=0){h=1;i=f;return h|0}a=c[g>>2]|0;if(a>>>0>47>>>0){h=1;i=f;return h|0}c[b>>2]=d[((e|0)==0?4128:4080)+a|0]|0;h=0;i=f;return h|0}function cy(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;if((d|0)!=0){e=cv(a,b)|0;return e|0}d=cj(a,1)|0;c[b>>2]=d;if((d|0)==-1){e=1;return e|0}c[b>>2]=d^1;e=0;return e|0}function cz(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0;cD(b|0,0,952);d=cj(a,1)|0;if((d|0)==-1){e=1;return e|0}f=(d|0)==1;c[b>>2]=f&1;do{if(f){d=cj(a,8)|0;if((d|0)==-1){e=1;return e|0}c[b+4>>2]=d;if((d|0)!=255){break}d=cj(a,16)|0;if((d|0)==-1){e=1;return e|0}c[b+8>>2]=d;d=cj(a,16)|0;if((d|0)==-1){e=1;return e|0}else{c[b+12>>2]=d;break}}}while(0);f=cj(a,1)|0;if((f|0)==-1){e=1;return e|0}d=(f|0)==1;c[b+16>>2]=d&1;do{if(d){f=cj(a,1)|0;if((f|0)==-1){e=1;return e|0}else{c[b+20>>2]=(f|0)==1;break}}}while(0);d=cj(a,1)|0;if((d|0)==-1){e=1;return e|0}f=(d|0)==1;c[b+24>>2]=f&1;do{if(f){d=cj(a,3)|0;if((d|0)==-1){e=1;return e|0}c[b+28>>2]=d;d=cj(a,1)|0;if((d|0)==-1){e=1;return e|0}c[b+32>>2]=(d|0)==1;d=cj(a,1)|0;if((d|0)==-1){e=1;return e|0}g=(d|0)==1;c[b+36>>2]=g&1;if(!g){c[b+40>>2]=2;c[b+44>>2]=2;c[b+48>>2]=2;break}g=cj(a,8)|0;if((g|0)==-1){e=1;return e|0}c[b+40>>2]=g;g=cj(a,8)|0;if((g|0)==-1){e=1;return e|0}c[b+44>>2]=g;g=cj(a,8)|0;if((g|0)==-1){e=1;return e|0}else{c[b+48>>2]=g;break}}else{c[b+28>>2]=5;c[b+40>>2]=2;c[b+44>>2]=2;c[b+48>>2]=2}}while(0);f=cj(a,1)|0;if((f|0)==-1){e=1;return e|0}g=(f|0)==1;c[b+52>>2]=g&1;do{if(g){f=b+56|0;d=cv(a,f)|0;if((d|0)!=0){e=d;return e|0}if((c[f>>2]|0)>>>0>5>>>0){e=1;return e|0}f=b+60|0;d=cv(a,f)|0;if((d|0)!=0){e=d;return e|0}if((c[f>>2]|0)>>>0>5>>>0){e=1}else{break}return e|0}}while(0);g=cj(a,1)|0;if((g|0)==-1){e=1;return e|0}f=(g|0)==1;c[b+64>>2]=f&1;do{if(f){g=ck(a)|0;if((cl(a,32)|0)==-1|(g|0)==0){e=1;return e|0}c[b+68>>2]=g;g=ck(a)|0;if((cl(a,32)|0)==-1|(g|0)==0){e=1;return e|0}c[b+72>>2]=g;g=cj(a,1)|0;if((g|0)==-1){e=1;return e|0}else{c[b+76>>2]=(g|0)==1;break}}}while(0);f=cj(a,1)|0;if((f|0)==-1){e=1;return e|0}g=(f|0)==1;f=b+80|0;c[f>>2]=g&1;do{if(g){d=cA(a,b+84|0)|0;if((d|0)==0){break}else{e=d}return e|0}else{c[b+84>>2]=1;c[b+96>>2]=288000001;c[b+224>>2]=288000001;c[b+480>>2]=24;c[b+484>>2]=24;c[b+488>>2]=24;c[b+492>>2]=24}}while(0);g=cj(a,1)|0;if((g|0)==-1){e=1;return e|0}d=(g|0)==1;g=b+496|0;c[g>>2]=d&1;do{if(d){h=cA(a,b+500|0)|0;if((h|0)==0){break}else{e=h}return e|0}else{c[b+500>>2]=1;c[b+512>>2]=240000001;c[b+640>>2]=240000001;c[b+896>>2]=24;c[b+900>>2]=24;c[b+904>>2]=24;c[b+908>>2]=24}}while(0);if((c[f>>2]|0)==0){if((c[g>>2]|0)!=0){i=353}}else{i=353}do{if((i|0)==353){g=cj(a,1)|0;if((g|0)==-1){e=1;return e|0}else{c[b+912>>2]=(g|0)==1;break}}}while(0);i=cj(a,1)|0;if((i|0)==-1){e=1;return e|0}c[b+916>>2]=(i|0)==1;i=cj(a,1)|0;if((i|0)==-1){e=1;return e|0}g=(i|0)==1;c[b+920>>2]=g&1;do{if(g){i=cj(a,1)|0;if((i|0)==-1){e=1;return e|0}c[b+924>>2]=(i|0)==1;i=b+928|0;f=cv(a,i)|0;if((f|0)!=0){e=f;return e|0}if((c[i>>2]|0)>>>0>16>>>0){e=1;return e|0}i=b+932|0;f=cv(a,i)|0;if((f|0)!=0){e=f;return e|0}if((c[i>>2]|0)>>>0>16>>>0){e=1;return e|0}i=b+936|0;f=cv(a,i)|0;if((f|0)!=0){e=f;return e|0}if((c[i>>2]|0)>>>0>16>>>0){e=1;return e|0}i=b+940|0;f=cv(a,i)|0;if((f|0)!=0){e=f;return e|0}if((c[i>>2]|0)>>>0>16>>>0){e=1;return e|0}i=cv(a,b+944|0)|0;if((i|0)!=0){e=i;return e|0}i=cv(a,b+948|0)|0;if((i|0)==0){break}else{e=i}return e|0}else{c[b+924>>2]=1;c[b+928>>2]=2;c[b+932>>2]=1;c[b+936>>2]=16;c[b+940>>2]=16;c[b+944>>2]=16;c[b+948>>2]=16}}while(0);e=0;return e|0}function cA(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0;d=b|0;e=cv(a,d)|0;if((e|0)!=0){f=e;return f|0}e=(c[d>>2]|0)+1|0;c[d>>2]=e;if(e>>>0>32>>>0){f=1;return f|0}e=cj(a,4)|0;if((e|0)==-1){f=1;return f|0}g=b+4|0;c[g>>2]=e;e=cj(a,4)|0;if((e|0)==-1){f=1;return f|0}h=b+8|0;c[h>>2]=e;L551:do{if((c[d>>2]|0)!=0){e=0;while(1){i=b+12+(e<<2)|0;j=cv(a,i)|0;if((j|0)!=0){f=j;k=440;break}j=c[i>>2]|0;if((j|0)==-1){f=1;k=441;break}l=j+1|0;c[i>>2]=l;c[i>>2]=l<<(c[g>>2]|0)+6;l=b+140+(e<<2)|0;i=cv(a,l)|0;if((i|0)!=0){f=i;k=438;break}i=c[l>>2]|0;if((i|0)==-1){f=1;k=443;break}j=i+1|0;c[l>>2]=j;c[l>>2]=j<<(c[h>>2]|0)+4;j=cj(a,1)|0;if((j|0)==-1){f=1;k=437;break}c[b+268+(e<<2)>>2]=(j|0)==1;e=e+1|0;if(e>>>0>=(c[d>>2]|0)>>>0){break L551}}if((k|0)==441){return f|0}else if((k|0)==438){return f|0}else if((k|0)==443){return f|0}else if((k|0)==440){return f|0}else if((k|0)==437){return f|0}}}while(0);k=cj(a,5)|0;if((k|0)==-1){f=1;return f|0}c[b+396>>2]=k+1;k=cj(a,5)|0;if((k|0)==-1){f=1;return f|0}c[b+400>>2]=k+1;k=cj(a,5)|0;if((k|0)==-1){f=1;return f|0}c[b+404>>2]=k+1;k=cj(a,5)|0;if((k|0)==-1){f=1;return f|0}c[b+408>>2]=k;f=0;return f|0}function cB(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,al=0,an=0,aq=0,ar=0,as=0,at=0,au=0,av=0,aw=0,ax=0,ay=0,az=0,aA=0,aB=0,aC=0,aD=0,aE=0,aF=0,aG=0,aH=0,aI=0,aJ=0,aK=0,aL=0;do{if(a>>>0<245>>>0){if(a>>>0<11>>>0){b=16}else{b=a+11&-8}d=b>>>3;e=c[1790]|0;f=e>>>(d>>>0);if((f&3|0)!=0){g=(f&1^1)+d|0;h=g<<1;i=7200+(h<<2)|0;j=7200+(h+2<<2)|0;h=c[j>>2]|0;k=h+8|0;l=c[k>>2]|0;do{if((i|0)==(l|0)){c[1790]=e&~(1<<g)}else{if(l>>>0<(c[1794]|0)>>>0){ao();return 0}m=l+12|0;if((c[m>>2]|0)==(h|0)){c[m>>2]=i;c[j>>2]=l;break}else{ao();return 0}}}while(0);l=g<<3;c[h+4>>2]=l|3;j=h+(l|4)|0;c[j>>2]=c[j>>2]|1;n=k;return n|0}if(b>>>0<=(c[1792]|0)>>>0){o=b;break}if((f|0)!=0){j=2<<d;l=f<<d&(j|-j);j=(l&-l)-1|0;l=j>>>12&16;i=j>>>(l>>>0);j=i>>>5&8;m=i>>>(j>>>0);i=m>>>2&4;p=m>>>(i>>>0);m=p>>>1&2;q=p>>>(m>>>0);p=q>>>1&1;r=(j|l|i|m|p)+(q>>>(p>>>0))|0;p=r<<1;q=7200+(p<<2)|0;m=7200+(p+2<<2)|0;p=c[m>>2]|0;i=p+8|0;l=c[i>>2]|0;do{if((q|0)==(l|0)){c[1790]=e&~(1<<r)}else{if(l>>>0<(c[1794]|0)>>>0){ao();return 0}j=l+12|0;if((c[j>>2]|0)==(p|0)){c[j>>2]=q;c[m>>2]=l;break}else{ao();return 0}}}while(0);l=r<<3;m=l-b|0;c[p+4>>2]=b|3;q=p;e=q+b|0;c[q+(b|4)>>2]=m|1;c[q+l>>2]=m;l=c[1792]|0;if((l|0)!=0){q=c[1795]|0;d=l>>>3;l=d<<1;f=7200+(l<<2)|0;k=c[1790]|0;h=1<<d;do{if((k&h|0)==0){c[1790]=k|h;s=f;t=7200+(l+2<<2)|0}else{d=7200+(l+2<<2)|0;g=c[d>>2]|0;if(g>>>0>=(c[1794]|0)>>>0){s=g;t=d;break}ao();return 0}}while(0);c[t>>2]=q;c[s+12>>2]=q;c[q+8>>2]=s;c[q+12>>2]=f}c[1792]=m;c[1795]=e;n=i;return n|0}l=c[1791]|0;if((l|0)==0){o=b;break}h=(l&-l)-1|0;l=h>>>12&16;k=h>>>(l>>>0);h=k>>>5&8;p=k>>>(h>>>0);k=p>>>2&4;r=p>>>(k>>>0);p=r>>>1&2;d=r>>>(p>>>0);r=d>>>1&1;g=c[7464+((h|l|k|p|r)+(d>>>(r>>>0))<<2)>>2]|0;r=g;d=g;p=(c[g+4>>2]&-8)-b|0;while(1){g=c[r+16>>2]|0;if((g|0)==0){k=c[r+20>>2]|0;if((k|0)==0){break}else{u=k}}else{u=g}g=(c[u+4>>2]&-8)-b|0;k=g>>>0<p>>>0;r=u;d=k?u:d;p=k?g:p}r=d;i=c[1794]|0;if(r>>>0<i>>>0){ao();return 0}e=r+b|0;m=e;if(r>>>0>=e>>>0){ao();return 0}e=c[d+24>>2]|0;f=c[d+12>>2]|0;do{if((f|0)==(d|0)){q=d+20|0;g=c[q>>2]|0;if((g|0)==0){k=d+16|0;l=c[k>>2]|0;if((l|0)==0){v=0;break}else{w=l;x=k}}else{w=g;x=q}while(1){q=w+20|0;g=c[q>>2]|0;if((g|0)!=0){w=g;x=q;continue}q=w+16|0;g=c[q>>2]|0;if((g|0)==0){break}else{w=g;x=q}}if(x>>>0<i>>>0){ao();return 0}else{c[x>>2]=0;v=w;break}}else{q=c[d+8>>2]|0;if(q>>>0<i>>>0){ao();return 0}g=q+12|0;if((c[g>>2]|0)!=(d|0)){ao();return 0}k=f+8|0;if((c[k>>2]|0)==(d|0)){c[g>>2]=f;c[k>>2]=q;v=f;break}else{ao();return 0}}}while(0);L780:do{if((e|0)!=0){f=d+28|0;i=7464+(c[f>>2]<<2)|0;do{if((d|0)==(c[i>>2]|0)){c[i>>2]=v;if((v|0)!=0){break}c[1791]=c[1791]&~(1<<c[f>>2]);break L780}else{if(e>>>0<(c[1794]|0)>>>0){ao();return 0}q=e+16|0;if((c[q>>2]|0)==(d|0)){c[q>>2]=v}else{c[e+20>>2]=v}if((v|0)==0){break L780}}}while(0);if(v>>>0<(c[1794]|0)>>>0){ao();return 0}c[v+24>>2]=e;f=c[d+16>>2]|0;do{if((f|0)!=0){if(f>>>0<(c[1794]|0)>>>0){ao();return 0}else{c[v+16>>2]=f;c[f+24>>2]=v;break}}}while(0);f=c[d+20>>2]|0;if((f|0)==0){break}if(f>>>0<(c[1794]|0)>>>0){ao();return 0}else{c[v+20>>2]=f;c[f+24>>2]=v;break}}}while(0);if(p>>>0<16>>>0){e=p+b|0;c[d+4>>2]=e|3;f=r+(e+4)|0;c[f>>2]=c[f>>2]|1}else{c[d+4>>2]=b|3;c[r+(b|4)>>2]=p|1;c[r+(p+b)>>2]=p;f=c[1792]|0;if((f|0)!=0){e=c[1795]|0;i=f>>>3;f=i<<1;q=7200+(f<<2)|0;k=c[1790]|0;g=1<<i;do{if((k&g|0)==0){c[1790]=k|g;y=q;z=7200+(f+2<<2)|0}else{i=7200+(f+2<<2)|0;l=c[i>>2]|0;if(l>>>0>=(c[1794]|0)>>>0){y=l;z=i;break}ao();return 0}}while(0);c[z>>2]=e;c[y+12>>2]=e;c[e+8>>2]=y;c[e+12>>2]=q}c[1792]=p;c[1795]=m}f=d+8|0;if((f|0)==0){o=b;break}else{n=f}return n|0}else{if(a>>>0>4294967231>>>0){o=-1;break}f=a+11|0;g=f&-8;k=c[1791]|0;if((k|0)==0){o=g;break}r=-g|0;i=f>>>8;do{if((i|0)==0){A=0}else{if(g>>>0>16777215>>>0){A=31;break}f=(i+1048320|0)>>>16&8;l=i<<f;h=(l+520192|0)>>>16&4;j=l<<h;l=(j+245760|0)>>>16&2;B=14-(h|f|l)+(j<<l>>>15)|0;A=g>>>((B+7|0)>>>0)&1|B<<1}}while(0);i=c[7464+(A<<2)>>2]|0;L588:do{if((i|0)==0){C=0;D=r;E=0}else{if((A|0)==31){F=0}else{F=25-(A>>>1)|0}d=0;m=r;p=i;q=g<<F;e=0;while(1){B=c[p+4>>2]&-8;l=B-g|0;if(l>>>0<m>>>0){if((B|0)==(g|0)){C=p;D=l;E=p;break L588}else{G=p;H=l}}else{G=d;H=m}l=c[p+20>>2]|0;B=c[p+16+(q>>>31<<2)>>2]|0;j=(l|0)==0|(l|0)==(B|0)?e:l;if((B|0)==0){C=G;D=H;E=j;break}else{d=G;m=H;p=B;q=q<<1;e=j}}}}while(0);if((E|0)==0&(C|0)==0){i=2<<A;r=k&(i|-i);if((r|0)==0){o=g;break}i=(r&-r)-1|0;r=i>>>12&16;e=i>>>(r>>>0);i=e>>>5&8;q=e>>>(i>>>0);e=q>>>2&4;p=q>>>(e>>>0);q=p>>>1&2;m=p>>>(q>>>0);p=m>>>1&1;I=c[7464+((i|r|e|q|p)+(m>>>(p>>>0))<<2)>>2]|0}else{I=E}if((I|0)==0){J=D;K=C}else{p=I;m=D;q=C;while(1){e=(c[p+4>>2]&-8)-g|0;r=e>>>0<m>>>0;i=r?e:m;e=r?p:q;r=c[p+16>>2]|0;if((r|0)!=0){p=r;m=i;q=e;continue}r=c[p+20>>2]|0;if((r|0)==0){J=i;K=e;break}else{p=r;m=i;q=e}}}if((K|0)==0){o=g;break}if(J>>>0>=((c[1792]|0)-g|0)>>>0){o=g;break}q=K;m=c[1794]|0;if(q>>>0<m>>>0){ao();return 0}p=q+g|0;k=p;if(q>>>0>=p>>>0){ao();return 0}e=c[K+24>>2]|0;i=c[K+12>>2]|0;do{if((i|0)==(K|0)){r=K+20|0;d=c[r>>2]|0;if((d|0)==0){j=K+16|0;B=c[j>>2]|0;if((B|0)==0){L=0;break}else{M=B;N=j}}else{M=d;N=r}while(1){r=M+20|0;d=c[r>>2]|0;if((d|0)!=0){M=d;N=r;continue}r=M+16|0;d=c[r>>2]|0;if((d|0)==0){break}else{M=d;N=r}}if(N>>>0<m>>>0){ao();return 0}else{c[N>>2]=0;L=M;break}}else{r=c[K+8>>2]|0;if(r>>>0<m>>>0){ao();return 0}d=r+12|0;if((c[d>>2]|0)!=(K|0)){ao();return 0}j=i+8|0;if((c[j>>2]|0)==(K|0)){c[d>>2]=i;c[j>>2]=r;L=i;break}else{ao();return 0}}}while(0);L638:do{if((e|0)!=0){i=K+28|0;m=7464+(c[i>>2]<<2)|0;do{if((K|0)==(c[m>>2]|0)){c[m>>2]=L;if((L|0)!=0){break}c[1791]=c[1791]&~(1<<c[i>>2]);break L638}else{if(e>>>0<(c[1794]|0)>>>0){ao();return 0}r=e+16|0;if((c[r>>2]|0)==(K|0)){c[r>>2]=L}else{c[e+20>>2]=L}if((L|0)==0){break L638}}}while(0);if(L>>>0<(c[1794]|0)>>>0){ao();return 0}c[L+24>>2]=e;i=c[K+16>>2]|0;do{if((i|0)!=0){if(i>>>0<(c[1794]|0)>>>0){ao();return 0}else{c[L+16>>2]=i;c[i+24>>2]=L;break}}}while(0);i=c[K+20>>2]|0;if((i|0)==0){break}if(i>>>0<(c[1794]|0)>>>0){ao();return 0}else{c[L+20>>2]=i;c[i+24>>2]=L;break}}}while(0);do{if(J>>>0<16>>>0){e=J+g|0;c[K+4>>2]=e|3;i=q+(e+4)|0;c[i>>2]=c[i>>2]|1}else{c[K+4>>2]=g|3;c[q+(g|4)>>2]=J|1;c[q+(J+g)>>2]=J;i=J>>>3;if(J>>>0<256>>>0){e=i<<1;m=7200+(e<<2)|0;r=c[1790]|0;j=1<<i;do{if((r&j|0)==0){c[1790]=r|j;O=m;P=7200+(e+2<<2)|0}else{i=7200+(e+2<<2)|0;d=c[i>>2]|0;if(d>>>0>=(c[1794]|0)>>>0){O=d;P=i;break}ao();return 0}}while(0);c[P>>2]=k;c[O+12>>2]=k;c[q+(g+8)>>2]=O;c[q+(g+12)>>2]=m;break}e=p;j=J>>>8;do{if((j|0)==0){Q=0}else{if(J>>>0>16777215>>>0){Q=31;break}r=(j+1048320|0)>>>16&8;i=j<<r;d=(i+520192|0)>>>16&4;B=i<<d;i=(B+245760|0)>>>16&2;l=14-(d|r|i)+(B<<i>>>15)|0;Q=J>>>((l+7|0)>>>0)&1|l<<1}}while(0);j=7464+(Q<<2)|0;c[q+(g+28)>>2]=Q;c[q+(g+20)>>2]=0;c[q+(g+16)>>2]=0;m=c[1791]|0;l=1<<Q;if((m&l|0)==0){c[1791]=m|l;c[j>>2]=e;c[q+(g+24)>>2]=j;c[q+(g+12)>>2]=e;c[q+(g+8)>>2]=e;break}if((Q|0)==31){R=0}else{R=25-(Q>>>1)|0}l=J<<R;m=c[j>>2]|0;while(1){if((c[m+4>>2]&-8|0)==(J|0)){break}S=m+16+(l>>>31<<2)|0;j=c[S>>2]|0;if((j|0)==0){T=594;break}else{l=l<<1;m=j}}if((T|0)==594){if(S>>>0<(c[1794]|0)>>>0){ao();return 0}else{c[S>>2]=e;c[q+(g+24)>>2]=m;c[q+(g+12)>>2]=e;c[q+(g+8)>>2]=e;break}}l=m+8|0;j=c[l>>2]|0;i=c[1794]|0;if(m>>>0<i>>>0){ao();return 0}if(j>>>0<i>>>0){ao();return 0}else{c[j+12>>2]=e;c[l>>2]=e;c[q+(g+8)>>2]=j;c[q+(g+12)>>2]=m;c[q+(g+24)>>2]=0;break}}}while(0);q=K+8|0;if((q|0)==0){o=g;break}else{n=q}return n|0}}while(0);K=c[1792]|0;if(o>>>0<=K>>>0){S=K-o|0;J=c[1795]|0;if(S>>>0>15>>>0){R=J;c[1795]=R+o;c[1792]=S;c[R+(o+4)>>2]=S|1;c[R+K>>2]=S;c[J+4>>2]=o|3}else{c[1792]=0;c[1795]=0;c[J+4>>2]=K|3;S=J+(K+4)|0;c[S>>2]=c[S>>2]|1}n=J+8|0;return n|0}J=c[1793]|0;if(o>>>0<J>>>0){S=J-o|0;c[1793]=S;J=c[1796]|0;K=J;c[1796]=K+o;c[K+(o+4)>>2]=S|1;c[J+4>>2]=o|3;n=J+8|0;return n|0}do{if((c[1784]|0)==0){J=aj(30)|0;if((J-1&J|0)==0){c[1786]=J;c[1785]=J;c[1787]=-1;c[1788]=-1;c[1789]=0;c[1901]=0;c[1784]=(ap(0)|0)&-16^1431655768;break}else{ao();return 0}}}while(0);J=o+48|0;S=c[1786]|0;K=o+47|0;R=S+K|0;Q=-S|0;S=R&Q;if(S>>>0<=o>>>0){n=0;return n|0}O=c[1900]|0;do{if((O|0)!=0){P=c[1898]|0;L=P+S|0;if(L>>>0<=P>>>0|L>>>0>O>>>0){n=0}else{break}return n|0}}while(0);L847:do{if((c[1901]&4|0)==0){O=c[1796]|0;L849:do{if((O|0)==0){T=624}else{L=O;P=7608;while(1){U=P|0;M=c[U>>2]|0;if(M>>>0<=L>>>0){V=P+4|0;if((M+(c[V>>2]|0)|0)>>>0>L>>>0){break}}M=c[P+8>>2]|0;if((M|0)==0){T=624;break L849}else{P=M}}if((P|0)==0){T=624;break}L=R-(c[1793]|0)&Q;if(L>>>0>=2147483647>>>0){W=0;break}m=ak(L|0)|0;e=(m|0)==((c[U>>2]|0)+(c[V>>2]|0)|0);X=e?m:-1;Y=e?L:0;Z=m;_=L;T=633}}while(0);do{if((T|0)==624){O=ak(0)|0;if((O|0)==-1){W=0;break}g=O;L=c[1785]|0;m=L-1|0;if((m&g|0)==0){$=S}else{$=S-g+(m+g&-L)|0}L=c[1898]|0;g=L+$|0;if(!($>>>0>o>>>0&$>>>0<2147483647>>>0)){W=0;break}m=c[1900]|0;if((m|0)!=0){if(g>>>0<=L>>>0|g>>>0>m>>>0){W=0;break}}m=ak($|0)|0;g=(m|0)==(O|0);X=g?O:-1;Y=g?$:0;Z=m;_=$;T=633}}while(0);L869:do{if((T|0)==633){m=-_|0;if((X|0)!=-1){aa=Y;ab=X;T=644;break L847}do{if((Z|0)!=-1&_>>>0<2147483647>>>0&_>>>0<J>>>0){g=c[1786]|0;O=K-_+g&-g;if(O>>>0>=2147483647>>>0){ac=_;break}if((ak(O|0)|0)==-1){ak(m|0)|0;W=Y;break L869}else{ac=O+_|0;break}}else{ac=_}}while(0);if((Z|0)==-1){W=Y}else{aa=ac;ab=Z;T=644;break L847}}}while(0);c[1901]=c[1901]|4;ad=W;T=641}else{ad=0;T=641}}while(0);do{if((T|0)==641){if(S>>>0>=2147483647>>>0){break}W=ak(S|0)|0;Z=ak(0)|0;if(!((Z|0)!=-1&(W|0)!=-1&W>>>0<Z>>>0)){break}ac=Z-W|0;Z=ac>>>0>(o+40|0)>>>0;Y=Z?W:-1;if((Y|0)!=-1){aa=Z?ac:ad;ab=Y;T=644}}}while(0);do{if((T|0)==644){ad=(c[1898]|0)+aa|0;c[1898]=ad;if(ad>>>0>(c[1899]|0)>>>0){c[1899]=ad}ad=c[1796]|0;L889:do{if((ad|0)==0){S=c[1794]|0;if((S|0)==0|ab>>>0<S>>>0){c[1794]=ab}c[1902]=ab;c[1903]=aa;c[1905]=0;c[1799]=c[1784];c[1798]=-1;S=0;do{Y=S<<1;ac=7200+(Y<<2)|0;c[7200+(Y+3<<2)>>2]=ac;c[7200+(Y+2<<2)>>2]=ac;S=S+1|0;}while(S>>>0<32>>>0);S=ab+8|0;if((S&7|0)==0){ae=0}else{ae=-S&7}S=aa-40-ae|0;c[1796]=ab+ae;c[1793]=S;c[ab+(ae+4)>>2]=S|1;c[ab+(aa-36)>>2]=40;c[1797]=c[1788]}else{S=7608;while(1){af=c[S>>2]|0;ag=S+4|0;ah=c[ag>>2]|0;if((ab|0)==(af+ah|0)){T=656;break}ac=c[S+8>>2]|0;if((ac|0)==0){break}else{S=ac}}do{if((T|0)==656){if((c[S+12>>2]&8|0)!=0){break}ac=ad;if(!(ac>>>0>=af>>>0&ac>>>0<ab>>>0)){break}c[ag>>2]=ah+aa;ac=c[1796]|0;Y=(c[1793]|0)+aa|0;Z=ac;W=ac+8|0;if((W&7|0)==0){ai=0}else{ai=-W&7}W=Y-ai|0;c[1796]=Z+ai;c[1793]=W;c[Z+(ai+4)>>2]=W|1;c[Z+(Y+4)>>2]=40;c[1797]=c[1788];break L889}}while(0);if(ab>>>0<(c[1794]|0)>>>0){c[1794]=ab}S=ab+aa|0;Y=7608;while(1){al=Y|0;if((c[al>>2]|0)==(S|0)){T=666;break}Z=c[Y+8>>2]|0;if((Z|0)==0){break}else{Y=Z}}do{if((T|0)==666){if((c[Y+12>>2]&8|0)!=0){break}c[al>>2]=ab;S=Y+4|0;c[S>>2]=(c[S>>2]|0)+aa;S=ab+8|0;if((S&7|0)==0){an=0}else{an=-S&7}S=ab+(aa+8)|0;if((S&7|0)==0){aq=0}else{aq=-S&7}S=ab+(aq+aa)|0;Z=S;W=an+o|0;ac=ab+W|0;_=ac;K=S-(ab+an)-o|0;c[ab+(an+4)>>2]=o|3;do{if((Z|0)==(c[1796]|0)){J=(c[1793]|0)+K|0;c[1793]=J;c[1796]=_;c[ab+(W+4)>>2]=J|1}else{if((Z|0)==(c[1795]|0)){J=(c[1792]|0)+K|0;c[1792]=J;c[1795]=_;c[ab+(W+4)>>2]=J|1;c[ab+(J+W)>>2]=J;break}J=aa+4|0;X=c[ab+(J+aq)>>2]|0;if((X&3|0)==1){$=X&-8;V=X>>>3;L934:do{if(X>>>0<256>>>0){U=c[ab+((aq|8)+aa)>>2]|0;Q=c[ab+(aa+12+aq)>>2]|0;R=7200+(V<<1<<2)|0;do{if((U|0)!=(R|0)){if(U>>>0<(c[1794]|0)>>>0){ao();return 0}if((c[U+12>>2]|0)==(Z|0)){break}ao();return 0}}while(0);if((Q|0)==(U|0)){c[1790]=c[1790]&~(1<<V);break}do{if((Q|0)==(R|0)){ar=Q+8|0}else{if(Q>>>0<(c[1794]|0)>>>0){ao();return 0}m=Q+8|0;if((c[m>>2]|0)==(Z|0)){ar=m;break}ao();return 0}}while(0);c[U+12>>2]=Q;c[ar>>2]=U}else{R=S;m=c[ab+((aq|24)+aa)>>2]|0;P=c[ab+(aa+12+aq)>>2]|0;do{if((P|0)==(R|0)){O=aq|16;g=ab+(J+O)|0;L=c[g>>2]|0;if((L|0)==0){e=ab+(O+aa)|0;O=c[e>>2]|0;if((O|0)==0){as=0;break}else{at=O;au=e}}else{at=L;au=g}while(1){g=at+20|0;L=c[g>>2]|0;if((L|0)!=0){at=L;au=g;continue}g=at+16|0;L=c[g>>2]|0;if((L|0)==0){break}else{at=L;au=g}}if(au>>>0<(c[1794]|0)>>>0){ao();return 0}else{c[au>>2]=0;as=at;break}}else{g=c[ab+((aq|8)+aa)>>2]|0;if(g>>>0<(c[1794]|0)>>>0){ao();return 0}L=g+12|0;if((c[L>>2]|0)!=(R|0)){ao();return 0}e=P+8|0;if((c[e>>2]|0)==(R|0)){c[L>>2]=P;c[e>>2]=g;as=P;break}else{ao();return 0}}}while(0);if((m|0)==0){break}P=ab+(aa+28+aq)|0;U=7464+(c[P>>2]<<2)|0;do{if((R|0)==(c[U>>2]|0)){c[U>>2]=as;if((as|0)!=0){break}c[1791]=c[1791]&~(1<<c[P>>2]);break L934}else{if(m>>>0<(c[1794]|0)>>>0){ao();return 0}Q=m+16|0;if((c[Q>>2]|0)==(R|0)){c[Q>>2]=as}else{c[m+20>>2]=as}if((as|0)==0){break L934}}}while(0);if(as>>>0<(c[1794]|0)>>>0){ao();return 0}c[as+24>>2]=m;R=aq|16;P=c[ab+(R+aa)>>2]|0;do{if((P|0)!=0){if(P>>>0<(c[1794]|0)>>>0){ao();return 0}else{c[as+16>>2]=P;c[P+24>>2]=as;break}}}while(0);P=c[ab+(J+R)>>2]|0;if((P|0)==0){break}if(P>>>0<(c[1794]|0)>>>0){ao();return 0}else{c[as+20>>2]=P;c[P+24>>2]=as;break}}}while(0);av=ab+(($|aq)+aa)|0;aw=$+K|0}else{av=Z;aw=K}J=av+4|0;c[J>>2]=c[J>>2]&-2;c[ab+(W+4)>>2]=aw|1;c[ab+(aw+W)>>2]=aw;J=aw>>>3;if(aw>>>0<256>>>0){V=J<<1;X=7200+(V<<2)|0;P=c[1790]|0;m=1<<J;do{if((P&m|0)==0){c[1790]=P|m;ax=X;ay=7200+(V+2<<2)|0}else{J=7200+(V+2<<2)|0;U=c[J>>2]|0;if(U>>>0>=(c[1794]|0)>>>0){ax=U;ay=J;break}ao();return 0}}while(0);c[ay>>2]=_;c[ax+12>>2]=_;c[ab+(W+8)>>2]=ax;c[ab+(W+12)>>2]=X;break}V=ac;m=aw>>>8;do{if((m|0)==0){az=0}else{if(aw>>>0>16777215>>>0){az=31;break}P=(m+1048320|0)>>>16&8;$=m<<P;J=($+520192|0)>>>16&4;U=$<<J;$=(U+245760|0)>>>16&2;Q=14-(J|P|$)+(U<<$>>>15)|0;az=aw>>>((Q+7|0)>>>0)&1|Q<<1}}while(0);m=7464+(az<<2)|0;c[ab+(W+28)>>2]=az;c[ab+(W+20)>>2]=0;c[ab+(W+16)>>2]=0;X=c[1791]|0;Q=1<<az;if((X&Q|0)==0){c[1791]=X|Q;c[m>>2]=V;c[ab+(W+24)>>2]=m;c[ab+(W+12)>>2]=V;c[ab+(W+8)>>2]=V;break}if((az|0)==31){aA=0}else{aA=25-(az>>>1)|0}Q=aw<<aA;X=c[m>>2]|0;while(1){if((c[X+4>>2]&-8|0)==(aw|0)){break}aB=X+16+(Q>>>31<<2)|0;m=c[aB>>2]|0;if((m|0)==0){T=739;break}else{Q=Q<<1;X=m}}if((T|0)==739){if(aB>>>0<(c[1794]|0)>>>0){ao();return 0}else{c[aB>>2]=V;c[ab+(W+24)>>2]=X;c[ab+(W+12)>>2]=V;c[ab+(W+8)>>2]=V;break}}Q=X+8|0;m=c[Q>>2]|0;$=c[1794]|0;if(X>>>0<$>>>0){ao();return 0}if(m>>>0<$>>>0){ao();return 0}else{c[m+12>>2]=V;c[Q>>2]=V;c[ab+(W+8)>>2]=m;c[ab+(W+12)>>2]=X;c[ab+(W+24)>>2]=0;break}}}while(0);n=ab+(an|8)|0;return n|0}}while(0);Y=ad;W=7608;while(1){aC=c[W>>2]|0;if(aC>>>0<=Y>>>0){aD=c[W+4>>2]|0;aE=aC+aD|0;if(aE>>>0>Y>>>0){break}}W=c[W+8>>2]|0}W=aC+(aD-39)|0;if((W&7|0)==0){aF=0}else{aF=-W&7}W=aC+(aD-47+aF)|0;ac=W>>>0<(ad+16|0)>>>0?Y:W;W=ac+8|0;_=ab+8|0;if((_&7|0)==0){aG=0}else{aG=-_&7}_=aa-40-aG|0;c[1796]=ab+aG;c[1793]=_;c[ab+(aG+4)>>2]=_|1;c[ab+(aa-36)>>2]=40;c[1797]=c[1788];c[ac+4>>2]=27;c[W>>2]=c[1902];c[W+4>>2]=c[1903];c[W+8>>2]=c[1904];c[W+12>>2]=c[1905];c[1902]=ab;c[1903]=aa;c[1905]=0;c[1904]=W;W=ac+28|0;c[W>>2]=7;if((ac+32|0)>>>0<aE>>>0){_=W;while(1){W=_+4|0;c[W>>2]=7;if((_+8|0)>>>0<aE>>>0){_=W}else{break}}}if((ac|0)==(Y|0)){break}_=ac-ad|0;W=Y+(_+4)|0;c[W>>2]=c[W>>2]&-2;c[ad+4>>2]=_|1;c[Y+_>>2]=_;W=_>>>3;if(_>>>0<256>>>0){K=W<<1;Z=7200+(K<<2)|0;S=c[1790]|0;m=1<<W;do{if((S&m|0)==0){c[1790]=S|m;aH=Z;aI=7200+(K+2<<2)|0}else{W=7200+(K+2<<2)|0;Q=c[W>>2]|0;if(Q>>>0>=(c[1794]|0)>>>0){aH=Q;aI=W;break}ao();return 0}}while(0);c[aI>>2]=ad;c[aH+12>>2]=ad;c[ad+8>>2]=aH;c[ad+12>>2]=Z;break}K=ad;m=_>>>8;do{if((m|0)==0){aJ=0}else{if(_>>>0>16777215>>>0){aJ=31;break}S=(m+1048320|0)>>>16&8;Y=m<<S;ac=(Y+520192|0)>>>16&4;W=Y<<ac;Y=(W+245760|0)>>>16&2;Q=14-(ac|S|Y)+(W<<Y>>>15)|0;aJ=_>>>((Q+7|0)>>>0)&1|Q<<1}}while(0);m=7464+(aJ<<2)|0;c[ad+28>>2]=aJ;c[ad+20>>2]=0;c[ad+16>>2]=0;Z=c[1791]|0;Q=1<<aJ;if((Z&Q|0)==0){c[1791]=Z|Q;c[m>>2]=K;c[ad+24>>2]=m;c[ad+12>>2]=ad;c[ad+8>>2]=ad;break}if((aJ|0)==31){aK=0}else{aK=25-(aJ>>>1)|0}Q=_<<aK;Z=c[m>>2]|0;while(1){if((c[Z+4>>2]&-8|0)==(_|0)){break}aL=Z+16+(Q>>>31<<2)|0;m=c[aL>>2]|0;if((m|0)==0){T=774;break}else{Q=Q<<1;Z=m}}if((T|0)==774){if(aL>>>0<(c[1794]|0)>>>0){ao();return 0}else{c[aL>>2]=K;c[ad+24>>2]=Z;c[ad+12>>2]=ad;c[ad+8>>2]=ad;break}}Q=Z+8|0;_=c[Q>>2]|0;m=c[1794]|0;if(Z>>>0<m>>>0){ao();return 0}if(_>>>0<m>>>0){ao();return 0}else{c[_+12>>2]=K;c[Q>>2]=K;c[ad+8>>2]=_;c[ad+12>>2]=Z;c[ad+24>>2]=0;break}}}while(0);ad=c[1793]|0;if(ad>>>0<=o>>>0){break}_=ad-o|0;c[1793]=_;ad=c[1796]|0;Q=ad;c[1796]=Q+o;c[Q+(o+4)>>2]=_|1;c[ad+4>>2]=o|3;n=ad+8|0;return n|0}}while(0);c[(am()|0)>>2]=12;n=0;return n|0}function cC(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0;if((a|0)==0){return}b=a-8|0;d=b;e=c[1794]|0;if(b>>>0<e>>>0){ao()}f=c[a-4>>2]|0;g=f&3;if((g|0)==1){ao()}h=f&-8;i=a+(h-8)|0;j=i;L1106:do{if((f&1|0)==0){k=c[b>>2]|0;if((g|0)==0){return}l=-8-k|0;m=a+l|0;n=m;o=k+h|0;if(m>>>0<e>>>0){ao()}if((n|0)==(c[1795]|0)){p=a+(h-4)|0;if((c[p>>2]&3|0)!=3){q=n;r=o;break}c[1792]=o;c[p>>2]=c[p>>2]&-2;c[a+(l+4)>>2]=o|1;c[i>>2]=o;return}p=k>>>3;if(k>>>0<256>>>0){k=c[a+(l+8)>>2]|0;s=c[a+(l+12)>>2]|0;t=7200+(p<<1<<2)|0;do{if((k|0)!=(t|0)){if(k>>>0<e>>>0){ao()}if((c[k+12>>2]|0)==(n|0)){break}ao()}}while(0);if((s|0)==(k|0)){c[1790]=c[1790]&~(1<<p);q=n;r=o;break}do{if((s|0)==(t|0)){u=s+8|0}else{if(s>>>0<e>>>0){ao()}v=s+8|0;if((c[v>>2]|0)==(n|0)){u=v;break}ao()}}while(0);c[k+12>>2]=s;c[u>>2]=k;q=n;r=o;break}t=m;p=c[a+(l+24)>>2]|0;v=c[a+(l+12)>>2]|0;do{if((v|0)==(t|0)){w=a+(l+20)|0;x=c[w>>2]|0;if((x|0)==0){y=a+(l+16)|0;z=c[y>>2]|0;if((z|0)==0){A=0;break}else{B=z;C=y}}else{B=x;C=w}while(1){w=B+20|0;x=c[w>>2]|0;if((x|0)!=0){B=x;C=w;continue}w=B+16|0;x=c[w>>2]|0;if((x|0)==0){break}else{B=x;C=w}}if(C>>>0<e>>>0){ao()}else{c[C>>2]=0;A=B;break}}else{w=c[a+(l+8)>>2]|0;if(w>>>0<e>>>0){ao()}x=w+12|0;if((c[x>>2]|0)!=(t|0)){ao()}y=v+8|0;if((c[y>>2]|0)==(t|0)){c[x>>2]=v;c[y>>2]=w;A=v;break}else{ao()}}}while(0);if((p|0)==0){q=n;r=o;break}v=a+(l+28)|0;m=7464+(c[v>>2]<<2)|0;do{if((t|0)==(c[m>>2]|0)){c[m>>2]=A;if((A|0)!=0){break}c[1791]=c[1791]&~(1<<c[v>>2]);q=n;r=o;break L1106}else{if(p>>>0<(c[1794]|0)>>>0){ao()}k=p+16|0;if((c[k>>2]|0)==(t|0)){c[k>>2]=A}else{c[p+20>>2]=A}if((A|0)==0){q=n;r=o;break L1106}}}while(0);if(A>>>0<(c[1794]|0)>>>0){ao()}c[A+24>>2]=p;t=c[a+(l+16)>>2]|0;do{if((t|0)!=0){if(t>>>0<(c[1794]|0)>>>0){ao()}else{c[A+16>>2]=t;c[t+24>>2]=A;break}}}while(0);t=c[a+(l+20)>>2]|0;if((t|0)==0){q=n;r=o;break}if(t>>>0<(c[1794]|0)>>>0){ao()}else{c[A+20>>2]=t;c[t+24>>2]=A;q=n;r=o;break}}else{q=d;r=h}}while(0);d=q;if(d>>>0>=i>>>0){ao()}A=a+(h-4)|0;e=c[A>>2]|0;if((e&1|0)==0){ao()}do{if((e&2|0)==0){if((j|0)==(c[1796]|0)){B=(c[1793]|0)+r|0;c[1793]=B;c[1796]=q;c[q+4>>2]=B|1;if((q|0)!=(c[1795]|0)){return}c[1795]=0;c[1792]=0;return}if((j|0)==(c[1795]|0)){B=(c[1792]|0)+r|0;c[1792]=B;c[1795]=q;c[q+4>>2]=B|1;c[d+B>>2]=B;return}B=(e&-8)+r|0;C=e>>>3;L1208:do{if(e>>>0<256>>>0){u=c[a+h>>2]|0;g=c[a+(h|4)>>2]|0;b=7200+(C<<1<<2)|0;do{if((u|0)!=(b|0)){if(u>>>0<(c[1794]|0)>>>0){ao()}if((c[u+12>>2]|0)==(j|0)){break}ao()}}while(0);if((g|0)==(u|0)){c[1790]=c[1790]&~(1<<C);break}do{if((g|0)==(b|0)){D=g+8|0}else{if(g>>>0<(c[1794]|0)>>>0){ao()}f=g+8|0;if((c[f>>2]|0)==(j|0)){D=f;break}ao()}}while(0);c[u+12>>2]=g;c[D>>2]=u}else{b=i;f=c[a+(h+16)>>2]|0;t=c[a+(h|4)>>2]|0;do{if((t|0)==(b|0)){p=a+(h+12)|0;v=c[p>>2]|0;if((v|0)==0){m=a+(h+8)|0;k=c[m>>2]|0;if((k|0)==0){E=0;break}else{F=k;G=m}}else{F=v;G=p}while(1){p=F+20|0;v=c[p>>2]|0;if((v|0)!=0){F=v;G=p;continue}p=F+16|0;v=c[p>>2]|0;if((v|0)==0){break}else{F=v;G=p}}if(G>>>0<(c[1794]|0)>>>0){ao()}else{c[G>>2]=0;E=F;break}}else{p=c[a+h>>2]|0;if(p>>>0<(c[1794]|0)>>>0){ao()}v=p+12|0;if((c[v>>2]|0)!=(b|0)){ao()}m=t+8|0;if((c[m>>2]|0)==(b|0)){c[v>>2]=t;c[m>>2]=p;E=t;break}else{ao()}}}while(0);if((f|0)==0){break}t=a+(h+20)|0;u=7464+(c[t>>2]<<2)|0;do{if((b|0)==(c[u>>2]|0)){c[u>>2]=E;if((E|0)!=0){break}c[1791]=c[1791]&~(1<<c[t>>2]);break L1208}else{if(f>>>0<(c[1794]|0)>>>0){ao()}g=f+16|0;if((c[g>>2]|0)==(b|0)){c[g>>2]=E}else{c[f+20>>2]=E}if((E|0)==0){break L1208}}}while(0);if(E>>>0<(c[1794]|0)>>>0){ao()}c[E+24>>2]=f;b=c[a+(h+8)>>2]|0;do{if((b|0)!=0){if(b>>>0<(c[1794]|0)>>>0){ao()}else{c[E+16>>2]=b;c[b+24>>2]=E;break}}}while(0);b=c[a+(h+12)>>2]|0;if((b|0)==0){break}if(b>>>0<(c[1794]|0)>>>0){ao()}else{c[E+20>>2]=b;c[b+24>>2]=E;break}}}while(0);c[q+4>>2]=B|1;c[d+B>>2]=B;if((q|0)!=(c[1795]|0)){H=B;break}c[1792]=B;return}else{c[A>>2]=e&-2;c[q+4>>2]=r|1;c[d+r>>2]=r;H=r}}while(0);r=H>>>3;if(H>>>0<256>>>0){d=r<<1;e=7200+(d<<2)|0;A=c[1790]|0;E=1<<r;do{if((A&E|0)==0){c[1790]=A|E;I=e;J=7200+(d+2<<2)|0}else{r=7200+(d+2<<2)|0;h=c[r>>2]|0;if(h>>>0>=(c[1794]|0)>>>0){I=h;J=r;break}ao()}}while(0);c[J>>2]=q;c[I+12>>2]=q;c[q+8>>2]=I;c[q+12>>2]=e;return}e=q;I=H>>>8;do{if((I|0)==0){K=0}else{if(H>>>0>16777215>>>0){K=31;break}J=(I+1048320|0)>>>16&8;d=I<<J;E=(d+520192|0)>>>16&4;A=d<<E;d=(A+245760|0)>>>16&2;r=14-(E|J|d)+(A<<d>>>15)|0;K=H>>>((r+7|0)>>>0)&1|r<<1}}while(0);I=7464+(K<<2)|0;c[q+28>>2]=K;c[q+20>>2]=0;c[q+16>>2]=0;r=c[1791]|0;d=1<<K;do{if((r&d|0)==0){c[1791]=r|d;c[I>>2]=e;c[q+24>>2]=I;c[q+12>>2]=q;c[q+8>>2]=q}else{if((K|0)==31){L=0}else{L=25-(K>>>1)|0}A=H<<L;J=c[I>>2]|0;while(1){if((c[J+4>>2]&-8|0)==(H|0)){break}M=J+16+(A>>>31<<2)|0;E=c[M>>2]|0;if((E|0)==0){N=951;break}else{A=A<<1;J=E}}if((N|0)==951){if(M>>>0<(c[1794]|0)>>>0){ao()}else{c[M>>2]=e;c[q+24>>2]=J;c[q+12>>2]=q;c[q+8>>2]=q;break}}A=J+8|0;B=c[A>>2]|0;E=c[1794]|0;if(J>>>0<E>>>0){ao()}if(B>>>0<E>>>0){ao()}else{c[B+12>>2]=e;c[A>>2]=e;c[q+8>>2]=B;c[q+12>>2]=J;c[q+24>>2]=0;break}}}while(0);q=(c[1798]|0)-1|0;c[1798]=q;if((q|0)==0){O=7616}else{return}while(1){q=c[O>>2]|0;if((q|0)==0){break}else{O=q+8|0}}c[1798]=-1;return}function cD(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0;f=b+e|0;if((e|0)>=20){d=d&255;e=b&3;g=d|d<<8|d<<16|d<<24;h=f&~3;if(e){e=b+4-e|0;while((b|0)<(e|0)){a[b]=d;b=b+1|0}}while((b|0)<(h|0)){c[b>>2]=g;b=b+4|0}}while((b|0)<(f|0)){a[b]=d;b=b+1|0}}function cE(b,d,e){b=b|0;d=d|0;e=e|0;var f=0;f=b|0;if((b&3)==(d&3)){while(b&3){if((e|0)==0)return f|0;a[b]=a[d]|0;b=b+1|0;d=d+1|0;e=e-1|0}while((e|0)>=4){c[b>>2]=c[d>>2];b=b+4|0;d=d+4|0;e=e-4|0}}while((e|0)>0){a[b]=a[d]|0;b=b+1|0;d=d+1|0;e=e-1|0}return f|0}function cF(b){b=b|0;var c=0;c=b;while(a[c]|0){c=c+1|0}return c-b|0}function cG(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;as[a&7](b|0,c|0,d|0,e|0,f|0)}function cH(a,b){a=a|0;b=b|0;at[a&1](b|0)}function cI(a,b){a=a|0;b=b|0;return au[a&1](b|0)|0}function cJ(a){a=a|0;av[a&1]()}function cK(a,b,c){a=a|0;b=b|0;c=c|0;return aw[a&1](b|0,c|0)|0}function cL(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;_(0)}function cM(a){a=a|0;_(1)}function cN(a){a=a|0;_(2);return 0}function cO(){_(3)}function cP(a,b){a=a|0;b=b|0;_(4);return 0}
// EMSCRIPTEN_END_FUNCS
var as=[cL,cL,bX,cL,bY,cL,cL,cL];var at=[cM,cM];var au=[cN,cN];var av=[cO,cO];var aw=[cP,cP];return{_h264bsdCroppingParams:a4,_strlen:cF,_h264bsdInit:a_,_h264bsdNextOutputPicture:a1,_h264bsdAlloc:a5,_h264bsdShutdown:a0,_memset:cD,_malloc:cB,_memcpy:cE,_h264bsdPicWidth:a2,_h264bsdFree:a6,_free:cC,_h264bsdDecode:a$,_h264bsdPicHeight:a3,runPostSets:aN,stackAlloc:ax,stackSave:ay,stackRestore:az,setThrew:aA,setTempRet0:aD,setTempRet1:aE,setTempRet2:aF,setTempRet3:aG,setTempRet4:aH,setTempRet5:aI,setTempRet6:aJ,setTempRet7:aK,setTempRet8:aL,setTempRet9:aM,dynCall_viiiii:cG,dynCall_vi:cH,dynCall_ii:cI,dynCall_v:cJ,dynCall_iii:cK}})
// EMSCRIPTEN_END_ASM
({ "Math": Math, "Int8Array": Int8Array, "Int16Array": Int16Array, "Int32Array": Int32Array, "Uint8Array": Uint8Array, "Uint16Array": Uint16Array, "Uint32Array": Uint32Array, "Float32Array": Float32Array, "Float64Array": Float64Array }, { "abort": abort, "assert": assert, "asmPrintInt": asmPrintInt, "asmPrintFloat": asmPrintFloat, "min": Math_min, "invoke_viiiii": invoke_viiiii, "invoke_vi": invoke_vi, "invoke_ii": invoke_ii, "invoke_v": invoke_v, "invoke_iii": invoke_iii, "_llvm_lifetime_end": _llvm_lifetime_end, "_sysconf": _sysconf, "_sbrk": _sbrk, "___setErrNo": ___setErrNo, "___errno_location": ___errno_location, "_llvm_lifetime_start": _llvm_lifetime_start, "_abort": _abort, "_time": _time, "_fflush": _fflush, "STACKTOP": STACKTOP, "STACK_MAX": STACK_MAX, "tempDoublePtr": tempDoublePtr, "ABORT": ABORT, "NaN": NaN, "Infinity": Infinity }, buffer);
var _h264bsdCroppingParams = Module["_h264bsdCroppingParams"] = asm["_h264bsdCroppingParams"];
var _strlen = Module["_strlen"] = asm["_strlen"];
var _h264bsdInit = Module["_h264bsdInit"] = asm["_h264bsdInit"];
var _h264bsdNextOutputPicture = Module["_h264bsdNextOutputPicture"] = asm["_h264bsdNextOutputPicture"];
var _h264bsdAlloc = Module["_h264bsdAlloc"] = asm["_h264bsdAlloc"];
var _h264bsdShutdown = Module["_h264bsdShutdown"] = asm["_h264bsdShutdown"];
var _memset = Module["_memset"] = asm["_memset"];
var _malloc = Module["_malloc"] = asm["_malloc"];
var _memcpy = Module["_memcpy"] = asm["_memcpy"];
var _h264bsdPicWidth = Module["_h264bsdPicWidth"] = asm["_h264bsdPicWidth"];
var _h264bsdFree = Module["_h264bsdFree"] = asm["_h264bsdFree"];
var _free = Module["_free"] = asm["_free"];
var _h264bsdDecode = Module["_h264bsdDecode"] = asm["_h264bsdDecode"];
var _h264bsdPicHeight = Module["_h264bsdPicHeight"] = asm["_h264bsdPicHeight"];
var runPostSets = Module["runPostSets"] = asm["runPostSets"];
var dynCall_viiiii = Module["dynCall_viiiii"] = asm["dynCall_viiiii"];
var dynCall_vi = Module["dynCall_vi"] = asm["dynCall_vi"];
var dynCall_ii = Module["dynCall_ii"] = asm["dynCall_ii"];
var dynCall_v = Module["dynCall_v"] = asm["dynCall_v"];
var dynCall_iii = Module["dynCall_iii"] = asm["dynCall_iii"];
Runtime.stackAlloc = function(size) { return asm['stackAlloc'](size) };
Runtime.stackSave = function() { return asm['stackSave']() };
Runtime.stackRestore = function(top) { asm['stackRestore'](top) };
// Warning: printing of i64 values may be slightly rounded! No deep i64 math used, so precise i64 code not included
var i64Math = null;
// === Auto-generated postamble setup entry stuff ===
if (memoryInitializer) {
  function applyData(data) {
    HEAPU8.set(data, STATIC_BASE);
  }
  if (ENVIRONMENT_IS_NODE || ENVIRONMENT_IS_SHELL) {
    applyData(Module['readBinary'](memoryInitializer));
  } else {
    addRunDependency('memory initializer');
    Browser.asyncLoad(memoryInitializer, function(data) {
      applyData(data);
      removeRunDependency('memory initializer');
    }, function(data) {
      throw 'could not load memory initializer ' + memoryInitializer;
    });
  }
}
function ExitStatus(status) {
  this.name = "ExitStatus";
  this.message = "Program terminated with exit(" + status + ")";
  this.status = status;
};
ExitStatus.prototype = new Error();
ExitStatus.prototype.constructor = ExitStatus;
var initialStackTop;
var preloadStartTime = null;
var calledMain = false;
dependenciesFulfilled = function runCaller() {
  // If run has never been called, and we should call run (INVOKE_RUN is true, and Module.noInitialRun is not false)
  if (!Module['calledRun'] && shouldRunNow) run();
  if (!Module['calledRun']) dependenciesFulfilled = runCaller; // try this again later, after new deps are fulfilled
}
Module['callMain'] = Module.callMain = function callMain(args) {
  assert(runDependencies == 0, 'cannot call main when async dependencies remain! (listen on __ATMAIN__)');
  assert(__ATPRERUN__.length == 0, 'cannot call main when preRun functions remain to be called');
  args = args || [];
  if (ENVIRONMENT_IS_WEB && preloadStartTime !== null) {
    Module.printErr('preload time: ' + (Date.now() - preloadStartTime) + ' ms');
  }
  ensureInitRuntime();
  var argc = args.length+1;
  function pad() {
    for (var i = 0; i < 4-1; i++) {
      argv.push(0);
    }
  }
  var argv = [allocate(intArrayFromString("/bin/this.program"), 'i8', ALLOC_NORMAL) ];
  pad();
  for (var i = 0; i < argc-1; i = i + 1) {
    argv.push(allocate(intArrayFromString(args[i]), 'i8', ALLOC_NORMAL));
    pad();
  }
  argv.push(0);
  argv = allocate(argv, 'i32', ALLOC_NORMAL);
  initialStackTop = STACKTOP;
  try {
    var ret = Module['_main'](argc, argv, 0);
    // if we're not running an evented main loop, it's time to exit
    if (!Module['noExitRuntime']) {
      exit(ret);
    }
  }
  catch(e) {
    if (e instanceof ExitStatus) {
      // exit() throws this once it's done to make sure execution
      // has been stopped completely
      return;
    } else if (e == 'SimulateInfiniteLoop') {
      // running an evented main loop, don't immediately exit
      Module['noExitRuntime'] = true;
      return;
    } else {
      if (e && typeof e === 'object' && e.stack) Module.printErr('exception thrown: ' + [e, e.stack]);
      throw e;
    }
  } finally {
    calledMain = true;
  }
}
function run(args) {
  args = args || Module['arguments'];
  if (preloadStartTime === null) preloadStartTime = Date.now();
  if (runDependencies > 0) {
    Module.printErr('run() called, but dependencies remain, so not running');
    return;
  }
  preRun();
  if (runDependencies > 0) {
    // a preRun added a dependency, run will be called later
    return;
  }
  function doRun() {
    ensureInitRuntime();
    preMain();
    Module['calledRun'] = true;
    if (Module['_main'] && shouldRunNow) {
      Module['callMain'](args);
    }
    postRun();
  }
  if (Module['setStatus']) {
    Module['setStatus']('Running...');
    setTimeout(function() {
      setTimeout(function() {
        Module['setStatus']('');
      }, 1);
      if (!ABORT) doRun();
    }, 1);
  } else {
    doRun();
  }
}
Module['run'] = Module.run = run;
function exit(status) {
  ABORT = true;
  EXITSTATUS = status;
  STACKTOP = initialStackTop;
  // exit the runtime
  exitRuntime();
  // TODO We should handle this differently based on environment.
  // In the browser, the best we can do is throw an exception
  // to halt execution, but in node we could process.exit and
  // I'd imagine SM shell would have something equivalent.
  // This would let us set a proper exit status (which
  // would be great for checking test exit statuses).
  // https://github.com/kripken/emscripten/issues/1371
  // throw an exception to halt the current execution
  throw new ExitStatus(status);
}
Module['exit'] = Module.exit = exit;
function abort(text) {
  if (text) {
    Module.print(text);
    Module.printErr(text);
  }
  ABORT = true;
  EXITSTATUS = 1;
  throw 'abort() at ' + stackTrace();
}
Module['abort'] = Module.abort = abort;
// {{PRE_RUN_ADDITIONS}}
if (Module['preInit']) {
  if (typeof Module['preInit'] == 'function') Module['preInit'] = [Module['preInit']];
  while (Module['preInit'].length > 0) {
    Module['preInit'].pop()();
  }
}
// shouldRunNow refers to calling main(), not run().
var shouldRunNow = true;
if (Module['noInitialRun']) {
  shouldRunNow = false;
}
run();
// {{POST_RUN_ADDITIONS}}
// {{MODULE_ADDITIONS}}
