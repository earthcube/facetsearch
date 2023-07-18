(window["webpackJsonp"] = window["webpackJsonp"] || []).push([["npm.filter-obj"],{

/***/ "./node_modules/filter-obj/index.js":
/*!******************************************!*\
  !*** ./node_modules/filter-obj/index.js ***!
  \******************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\nmodule.exports = function (obj, predicate) {\n\tvar ret = {};\n\tvar keys = Object.keys(obj);\n\tvar isArr = Array.isArray(predicate);\n\n\tfor (var i = 0; i < keys.length; i++) {\n\t\tvar key = keys[i];\n\t\tvar val = obj[key];\n\n\t\tif (isArr ? predicate.indexOf(key) !== -1 : predicate(key, val, obj)) {\n\t\t\tret[key] = val;\n\t\t}\n\t}\n\n\treturn ret;\n};\n\n\n//# sourceURL=webpack:///./node_modules/filter-obj/index.js?");

/***/ })

}]);