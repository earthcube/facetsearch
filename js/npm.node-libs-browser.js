(window["webpackJsonp"] = window["webpackJsonp"] || []).push([["npm.node-libs-browser"],{

/***/ "./node_modules/node-libs-browser/mock/process.js":
/*!********************************************************!*\
  !*** ./node_modules/node-libs-browser/mock/process.js ***!
  \********************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

eval("exports.nextTick = function nextTick(fn) {\n    var args = Array.prototype.slice.call(arguments);\n    args.shift();\n    setTimeout(function () {\n        fn.apply(null, args);\n    }, 0);\n};\n\nexports.platform = exports.arch = \nexports.execPath = exports.title = 'browser';\nexports.pid = 1;\nexports.browser = true;\nexports.env = {};\nexports.argv = [];\n\nexports.binding = function (name) {\n\tthrow new Error('No such module. (Possibly not yet loaded)')\n};\n\n(function () {\n    var cwd = '/';\n    var path;\n    exports.cwd = function () { return cwd };\n    exports.chdir = function (dir) {\n        if (!path) path = __webpack_require__(/*! path */ \"./node_modules/path-browserify/index.js\");\n        cwd = path.resolve(dir, cwd);\n    };\n})();\n\nexports.exit = exports.kill = \nexports.umask = exports.dlopen = \nexports.uptime = exports.memoryUsage = \nexports.uvCounters = function() {};\nexports.features = {};\n\n\n//# sourceURL=webpack:///./node_modules/node-libs-browser/mock/process.js?");

/***/ })

}]);