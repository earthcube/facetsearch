(window["webpackJsonp"] = window["webpackJsonp"] || []).push([["npm.vue-functional-data-merge"],{

/***/ "./node_modules/vue-functional-data-merge/dist/lib.esm.js":
/*!****************************************************************!*\
  !*** ./node_modules/vue-functional-data-merge/dist/lib.esm.js ***!
  \****************************************************************/
/*! exports provided: mergeData */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, \"mergeData\", function() { return a; });\nvar e=function(){return(e=Object.assign||function(e){for(var t,r=1,s=arguments.length;r<s;r++)for(var a in t=arguments[r])Object.prototype.hasOwnProperty.call(t,a)&&(e[a]=t[a]);return e}).apply(this,arguments)},t={kebab:/-(\\w)/g,styleProp:/:(.*)/,styleList:/;(?![^(]*\\))/g};function r(e,t){return t?t.toUpperCase():\"\"}function s(e){for(var s,a={},c=0,o=e.split(t.styleList);c<o.length;c++){var n=o[c].split(t.styleProp),i=n[0],l=n[1];(i=i.trim())&&(\"string\"==typeof l&&(l=l.trim()),a[(s=i,s.replace(t.kebab,r))]=l)}return a}function a(){for(var t,r,a={},c=arguments.length;c--;)for(var o=0,n=Object.keys(arguments[c]);o<n.length;o++)switch(t=n[o]){case\"class\":case\"style\":case\"directives\":if(Array.isArray(a[t])||(a[t]=[]),\"style\"===t){var i=void 0;i=Array.isArray(arguments[c].style)?arguments[c].style:[arguments[c].style];for(var l=0;l<i.length;l++){var y=i[l];\"string\"==typeof y&&(i[l]=s(y))}arguments[c].style=i}a[t]=a[t].concat(arguments[c][t]);break;case\"staticClass\":if(!arguments[c][t])break;void 0===a[t]&&(a[t]=\"\"),a[t]&&(a[t]+=\" \"),a[t]+=arguments[c][t].trim();break;case\"on\":case\"nativeOn\":a[t]||(a[t]={});for(var p=0,f=Object.keys(arguments[c][t]||{});p<f.length;p++)r=f[p],a[t][r]?a[t][r]=[].concat(a[t][r],arguments[c][t][r]):a[t][r]=arguments[c][t][r];break;case\"attrs\":case\"props\":case\"domProps\":case\"scopedSlots\":case\"staticStyle\":case\"hook\":case\"transition\":a[t]||(a[t]={}),a[t]=e({},arguments[c][t],a[t]);break;case\"slot\":case\"key\":case\"ref\":case\"tag\":case\"show\":case\"keepAlive\":default:a[t]||(a[t]=arguments[c][t])}return a}\n//# sourceMappingURL=lib.esm.js.map\n\n\n//# sourceURL=webpack:///./node_modules/vue-functional-data-merge/dist/lib.esm.js?");

/***/ })

}]);