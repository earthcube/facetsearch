(window["webpackJsonp"] = window["webpackJsonp"] || []).push([["npm.canonicalize"],{

/***/ "./node_modules/canonicalize/lib/canonicalize.js":
/*!*******************************************************!*\
  !*** ./node_modules/canonicalize/lib/canonicalize.js ***!
  \*******************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("/* jshint esversion: 6 */\n/* jslint node: true */\n\n\nmodule.exports = function serialize (object) {\n  if (object === null || typeof object !== 'object' || object.toJSON != null) {\n    return JSON.stringify(object);\n  }\n\n  if (Array.isArray(object)) {\n    return '[' + object.reduce((t, cv, ci) => {\n      const comma = ci === 0 ? '' : ',';\n      const value = cv === undefined || typeof cv === 'symbol' ? null : cv;\n      return t + comma + serialize(value);\n    }, '') + ']';\n  }\n\n  return '{' + Object.keys(object).sort().reduce((t, cv, ci) => {\n    if (object[cv] === undefined ||\n        typeof object[cv] === 'symbol') {\n      return t;\n    }\n    const comma = t.length === 0 ? '' : ',';\n    return t + comma + serialize(cv) + ':' + serialize(object[cv]);\n  }, '') + '}';\n};\n\n\n//# sourceURL=webpack:///./node_modules/canonicalize/lib/canonicalize.js?");

/***/ })

}]);