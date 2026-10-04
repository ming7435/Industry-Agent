(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const r of document.querySelectorAll('link[rel="modulepreload"]'))i(r);new MutationObserver(r=>{for(const s of r)if(s.type==="childList")for(const a of s.addedNodes)a.tagName==="LINK"&&a.rel==="modulepreload"&&i(a)}).observe(document,{childList:!0,subtree:!0});function n(r){const s={};return r.integrity&&(s.integrity=r.integrity),r.referrerPolicy&&(s.referrerPolicy=r.referrerPolicy),r.crossOrigin==="use-credentials"?s.credentials="include":r.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function i(r){if(r.ep)return;r.ep=!0;const s=n(r);fetch(r.href,s)}})();function xy(t){return t&&t.__esModule&&Object.prototype.hasOwnProperty.call(t,"default")?t.default:t}var Wg={exports:{}},lu={},Xg={exports:{}},ut={};/**
 * @license React
 * react.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var al=Symbol.for("react.element"),yy=Symbol.for("react.portal"),Sy=Symbol.for("react.fragment"),My=Symbol.for("react.strict_mode"),Ey=Symbol.for("react.profiler"),wy=Symbol.for("react.provider"),Ty=Symbol.for("react.context"),by=Symbol.for("react.forward_ref"),Ay=Symbol.for("react.suspense"),Cy=Symbol.for("react.memo"),Ry=Symbol.for("react.lazy"),pm=Symbol.iterator;function Py(t){return t===null||typeof t!="object"?null:(t=pm&&t[pm]||t["@@iterator"],typeof t=="function"?t:null)}var $g={isMounted:function(){return!1},enqueueForceUpdate:function(){},enqueueReplaceState:function(){},enqueueSetState:function(){}},qg=Object.assign,Yg={};function ja(t,e,n){this.props=t,this.context=e,this.refs=Yg,this.updater=n||$g}ja.prototype.isReactComponent={};ja.prototype.setState=function(t,e){if(typeof t!="object"&&typeof t!="function"&&t!=null)throw Error("setState(...): takes an object of state variables to update or a function which returns an object of state variables.");this.updater.enqueueSetState(this,t,e,"setState")};ja.prototype.forceUpdate=function(t){this.updater.enqueueForceUpdate(this,t,"forceUpdate")};function Kg(){}Kg.prototype=ja.prototype;function Uh(t,e,n){this.props=t,this.context=e,this.refs=Yg,this.updater=n||$g}var Fh=Uh.prototype=new Kg;Fh.constructor=Uh;qg(Fh,ja.prototype);Fh.isPureReactComponent=!0;var mm=Array.isArray,Zg=Object.prototype.hasOwnProperty,Oh={current:null},Qg={key:!0,ref:!0,__self:!0,__source:!0};function Jg(t,e,n){var i,r={},s=null,a=null;if(e!=null)for(i in e.ref!==void 0&&(a=e.ref),e.key!==void 0&&(s=""+e.key),e)Zg.call(e,i)&&!Qg.hasOwnProperty(i)&&(r[i]=e[i]);var o=arguments.length-2;if(o===1)r.children=n;else if(1<o){for(var l=Array(o),c=0;c<o;c++)l[c]=arguments[c+2];r.children=l}if(t&&t.defaultProps)for(i in o=t.defaultProps,o)r[i]===void 0&&(r[i]=o[i]);return{$$typeof:al,type:t,key:s,ref:a,props:r,_owner:Oh.current}}function Ny(t,e){return{$$typeof:al,type:t.type,key:e,ref:t.ref,props:t.props,_owner:t._owner}}function kh(t){return typeof t=="object"&&t!==null&&t.$$typeof===al}function Ly(t){var e={"=":"=0",":":"=2"};return"$"+t.replace(/[=:]/g,function(n){return e[n]})}var gm=/\/+/g;function Ou(t,e){return typeof t=="object"&&t!==null&&t.key!=null?Ly(""+t.key):e.toString(36)}function lc(t,e,n,i,r){var s=typeof t;(s==="undefined"||s==="boolean")&&(t=null);var a=!1;if(t===null)a=!0;else switch(s){case"string":case"number":a=!0;break;case"object":switch(t.$$typeof){case al:case yy:a=!0}}if(a)return a=t,r=r(a),t=i===""?"."+Ou(a,0):i,mm(r)?(n="",t!=null&&(n=t.replace(gm,"$&/")+"/"),lc(r,e,n,"",function(c){return c})):r!=null&&(kh(r)&&(r=Ny(r,n+(!r.key||a&&a.key===r.key?"":(""+r.key).replace(gm,"$&/")+"/")+t)),e.push(r)),1;if(a=0,i=i===""?".":i+":",mm(t))for(var o=0;o<t.length;o++){s=t[o];var l=i+Ou(s,o);a+=lc(s,e,n,l,r)}else if(l=Py(t),typeof l=="function")for(t=l.call(t),o=0;!(s=t.next()).done;)s=s.value,l=i+Ou(s,o++),a+=lc(s,e,n,l,r);else if(s==="object")throw e=String(t),Error("Objects are not valid as a React child (found: "+(e==="[object Object]"?"object with keys {"+Object.keys(t).join(", ")+"}":e)+"). If you meant to render a collection of children, use an array instead.");return a}function gl(t,e,n){if(t==null)return t;var i=[],r=0;return lc(t,i,"","",function(s){return e.call(n,s,r++)}),i}function Dy(t){if(t._status===-1){var e=t._result;e=e(),e.then(function(n){(t._status===0||t._status===-1)&&(t._status=1,t._result=n)},function(n){(t._status===0||t._status===-1)&&(t._status=2,t._result=n)}),t._status===-1&&(t._status=0,t._result=e)}if(t._status===1)return t._result.default;throw t._result}var Un={current:null},cc={transition:null},Iy={ReactCurrentDispatcher:Un,ReactCurrentBatchConfig:cc,ReactCurrentOwner:Oh};function e_(){throw Error("act(...) is not supported in production builds of React.")}ut.Children={map:gl,forEach:function(t,e,n){gl(t,function(){e.apply(this,arguments)},n)},count:function(t){var e=0;return gl(t,function(){e++}),e},toArray:function(t){return gl(t,function(e){return e})||[]},only:function(t){if(!kh(t))throw Error("React.Children.only expected to receive a single React element child.");return t}};ut.Component=ja;ut.Fragment=Sy;ut.Profiler=Ey;ut.PureComponent=Uh;ut.StrictMode=My;ut.Suspense=Ay;ut.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED=Iy;ut.act=e_;ut.cloneElement=function(t,e,n){if(t==null)throw Error("React.cloneElement(...): The argument must be a React element, but you passed "+t+".");var i=qg({},t.props),r=t.key,s=t.ref,a=t._owner;if(e!=null){if(e.ref!==void 0&&(s=e.ref,a=Oh.current),e.key!==void 0&&(r=""+e.key),t.type&&t.type.defaultProps)var o=t.type.defaultProps;for(l in e)Zg.call(e,l)&&!Qg.hasOwnProperty(l)&&(i[l]=e[l]===void 0&&o!==void 0?o[l]:e[l])}var l=arguments.length-2;if(l===1)i.children=n;else if(1<l){o=Array(l);for(var c=0;c<l;c++)o[c]=arguments[c+2];i.children=o}return{$$typeof:al,type:t.type,key:r,ref:s,props:i,_owner:a}};ut.createContext=function(t){return t={$$typeof:Ty,_currentValue:t,_currentValue2:t,_threadCount:0,Provider:null,Consumer:null,_defaultValue:null,_globalName:null},t.Provider={$$typeof:wy,_context:t},t.Consumer=t};ut.createElement=Jg;ut.createFactory=function(t){var e=Jg.bind(null,t);return e.type=t,e};ut.createRef=function(){return{current:null}};ut.forwardRef=function(t){return{$$typeof:by,render:t}};ut.isValidElement=kh;ut.lazy=function(t){return{$$typeof:Ry,_payload:{_status:-1,_result:t},_init:Dy}};ut.memo=function(t,e){return{$$typeof:Cy,type:t,compare:e===void 0?null:e}};ut.startTransition=function(t){var e=cc.transition;cc.transition={};try{t()}finally{cc.transition=e}};ut.unstable_act=e_;ut.useCallback=function(t,e){return Un.current.useCallback(t,e)};ut.useContext=function(t){return Un.current.useContext(t)};ut.useDebugValue=function(){};ut.useDeferredValue=function(t){return Un.current.useDeferredValue(t)};ut.useEffect=function(t,e){return Un.current.useEffect(t,e)};ut.useId=function(){return Un.current.useId()};ut.useImperativeHandle=function(t,e,n){return Un.current.useImperativeHandle(t,e,n)};ut.useInsertionEffect=function(t,e){return Un.current.useInsertionEffect(t,e)};ut.useLayoutEffect=function(t,e){return Un.current.useLayoutEffect(t,e)};ut.useMemo=function(t,e){return Un.current.useMemo(t,e)};ut.useReducer=function(t,e,n){return Un.current.useReducer(t,e,n)};ut.useRef=function(t){return Un.current.useRef(t)};ut.useState=function(t){return Un.current.useState(t)};ut.useSyncExternalStore=function(t,e,n){return Un.current.useSyncExternalStore(t,e,n)};ut.useTransition=function(){return Un.current.useTransition()};ut.version="18.3.1";Xg.exports=ut;var se=Xg.exports;const Uy=xy(se);/**
 * @license React
 * react-jsx-runtime.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var Fy=se,Oy=Symbol.for("react.element"),ky=Symbol.for("react.fragment"),By=Object.prototype.hasOwnProperty,zy=Fy.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner,Hy={key:!0,ref:!0,__self:!0,__source:!0};function t_(t,e,n){var i,r={},s=null,a=null;n!==void 0&&(s=""+n),e.key!==void 0&&(s=""+e.key),e.ref!==void 0&&(a=e.ref);for(i in e)By.call(e,i)&&!Hy.hasOwnProperty(i)&&(r[i]=e[i]);if(t&&t.defaultProps)for(i in e=t.defaultProps,e)r[i]===void 0&&(r[i]=e[i]);return{$$typeof:Oy,type:t,key:s,ref:a,props:r,_owner:zy.current}}lu.Fragment=ky;lu.jsx=t_;lu.jsxs=t_;Wg.exports=lu;var u=Wg.exports,n_={exports:{}},oi={},i_={exports:{}},r_={};/**
 * @license React
 * scheduler.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */(function(t){function e(k,j){var L=k.length;k.push(j);e:for(;0<L;){var $=L-1>>>1,de=k[$];if(0<r(de,j))k[$]=j,k[L]=de,L=$;else break e}}function n(k){return k.length===0?null:k[0]}function i(k){if(k.length===0)return null;var j=k[0],L=k.pop();if(L!==j){k[0]=L;e:for(var $=0,de=k.length,we=de>>>1;$<we;){var Ke=2*($+1)-1,$e=k[Ke],Ze=Ke+1,Q=k[Ze];if(0>r($e,L))Ze<de&&0>r(Q,$e)?(k[$]=Q,k[Ze]=L,$=Ze):(k[$]=$e,k[Ke]=L,$=Ke);else if(Ze<de&&0>r(Q,L))k[$]=Q,k[Ze]=L,$=Ze;else break e}}return j}function r(k,j){var L=k.sortIndex-j.sortIndex;return L!==0?L:k.id-j.id}if(typeof performance=="object"&&typeof performance.now=="function"){var s=performance;t.unstable_now=function(){return s.now()}}else{var a=Date,o=a.now();t.unstable_now=function(){return a.now()-o}}var l=[],c=[],h=1,p=null,f=3,g=!1,v=!1,S=!1,_=typeof setTimeout=="function"?setTimeout:null,d=typeof clearTimeout=="function"?clearTimeout:null,m=typeof setImmediate<"u"?setImmediate:null;typeof navigator<"u"&&navigator.scheduling!==void 0&&navigator.scheduling.isInputPending!==void 0&&navigator.scheduling.isInputPending.bind(navigator.scheduling);function M(k){for(var j=n(c);j!==null;){if(j.callback===null)i(c);else if(j.startTime<=k)i(c),j.sortIndex=j.expirationTime,e(l,j);else break;j=n(c)}}function y(k){if(S=!1,M(k),!v)if(n(l)!==null)v=!0,N(T);else{var j=n(c);j!==null&&z(y,j.startTime-k)}}function T(k,j){v=!1,S&&(S=!1,d(x),x=-1),g=!0;var L=f;try{for(M(j),p=n(l);p!==null&&(!(p.expirationTime>j)||k&&!D());){var $=p.callback;if(typeof $=="function"){p.callback=null,f=p.priorityLevel;var de=$(p.expirationTime<=j);j=t.unstable_now(),typeof de=="function"?p.callback=de:p===n(l)&&i(l),M(j)}else i(l);p=n(l)}if(p!==null)var we=!0;else{var Ke=n(c);Ke!==null&&z(y,Ke.startTime-j),we=!1}return we}finally{p=null,f=L,g=!1}}var E=!1,C=null,x=-1,b=5,P=-1;function D(){return!(t.unstable_now()-P<b)}function O(){if(C!==null){var k=t.unstable_now();P=k;var j=!0;try{j=C(!0,k)}finally{j?F():(E=!1,C=null)}}else E=!1}var F;if(typeof m=="function")F=function(){m(O)};else if(typeof MessageChannel<"u"){var U=new MessageChannel,W=U.port2;U.port1.onmessage=O,F=function(){W.postMessage(null)}}else F=function(){_(O,0)};function N(k){C=k,E||(E=!0,F())}function z(k,j){x=_(function(){k(t.unstable_now())},j)}t.unstable_IdlePriority=5,t.unstable_ImmediatePriority=1,t.unstable_LowPriority=4,t.unstable_NormalPriority=3,t.unstable_Profiling=null,t.unstable_UserBlockingPriority=2,t.unstable_cancelCallback=function(k){k.callback=null},t.unstable_continueExecution=function(){v||g||(v=!0,N(T))},t.unstable_forceFrameRate=function(k){0>k||125<k?console.error("forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported"):b=0<k?Math.floor(1e3/k):5},t.unstable_getCurrentPriorityLevel=function(){return f},t.unstable_getFirstCallbackNode=function(){return n(l)},t.unstable_next=function(k){switch(f){case 1:case 2:case 3:var j=3;break;default:j=f}var L=f;f=j;try{return k()}finally{f=L}},t.unstable_pauseExecution=function(){},t.unstable_requestPaint=function(){},t.unstable_runWithPriority=function(k,j){switch(k){case 1:case 2:case 3:case 4:case 5:break;default:k=3}var L=f;f=k;try{return j()}finally{f=L}},t.unstable_scheduleCallback=function(k,j,L){var $=t.unstable_now();switch(typeof L=="object"&&L!==null?(L=L.delay,L=typeof L=="number"&&0<L?$+L:$):L=$,k){case 1:var de=-1;break;case 2:de=250;break;case 5:de=1073741823;break;case 4:de=1e4;break;default:de=5e3}return de=L+de,k={id:h++,callback:j,priorityLevel:k,startTime:L,expirationTime:de,sortIndex:-1},L>$?(k.sortIndex=L,e(c,k),n(l)===null&&k===n(c)&&(S?(d(x),x=-1):S=!0,z(y,L-$))):(k.sortIndex=de,e(l,k),v||g||(v=!0,N(T))),k},t.unstable_shouldYield=D,t.unstable_wrapCallback=function(k){var j=f;return function(){var L=f;f=j;try{return k.apply(this,arguments)}finally{f=L}}}})(r_);i_.exports=r_;var Vy=i_.exports;/**
 * @license React
 * react-dom.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var Gy=se,ai=Vy;function ce(t){for(var e="https://reactjs.org/docs/error-decoder.html?invariant="+t,n=1;n<arguments.length;n++)e+="&args[]="+encodeURIComponent(arguments[n]);return"Minified React error #"+t+"; visit "+e+" for the full message or use the non-minified dev environment for full errors and additional helpful warnings."}var s_=new Set,ko={};function zs(t,e){Ia(t,e),Ia(t+"Capture",e)}function Ia(t,e){for(ko[t]=e,t=0;t<e.length;t++)s_.add(e[t])}var Cr=!(typeof window>"u"||typeof window.document>"u"||typeof window.document.createElement>"u"),Xd=Object.prototype.hasOwnProperty,jy=/^[:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD][:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\-.0-9\u00B7\u0300-\u036F\u203F-\u2040]*$/,_m={},vm={};function Wy(t){return Xd.call(vm,t)?!0:Xd.call(_m,t)?!1:jy.test(t)?vm[t]=!0:(_m[t]=!0,!1)}function Xy(t,e,n,i){if(n!==null&&n.type===0)return!1;switch(typeof e){case"function":case"symbol":return!0;case"boolean":return i?!1:n!==null?!n.acceptsBooleans:(t=t.toLowerCase().slice(0,5),t!=="data-"&&t!=="aria-");default:return!1}}function $y(t,e,n,i){if(e===null||typeof e>"u"||Xy(t,e,n,i))return!0;if(i)return!1;if(n!==null)switch(n.type){case 3:return!e;case 4:return e===!1;case 5:return isNaN(e);case 6:return isNaN(e)||1>e}return!1}function Fn(t,e,n,i,r,s,a){this.acceptsBooleans=e===2||e===3||e===4,this.attributeName=i,this.attributeNamespace=r,this.mustUseProperty=n,this.propertyName=t,this.type=e,this.sanitizeURL=s,this.removeEmptyString=a}var vn={};"children dangerouslySetInnerHTML defaultValue defaultChecked innerHTML suppressContentEditableWarning suppressHydrationWarning style".split(" ").forEach(function(t){vn[t]=new Fn(t,0,!1,t,null,!1,!1)});[["acceptCharset","accept-charset"],["className","class"],["htmlFor","for"],["httpEquiv","http-equiv"]].forEach(function(t){var e=t[0];vn[e]=new Fn(e,1,!1,t[1],null,!1,!1)});["contentEditable","draggable","spellCheck","value"].forEach(function(t){vn[t]=new Fn(t,2,!1,t.toLowerCase(),null,!1,!1)});["autoReverse","externalResourcesRequired","focusable","preserveAlpha"].forEach(function(t){vn[t]=new Fn(t,2,!1,t,null,!1,!1)});"allowFullScreen async autoFocus autoPlay controls default defer disabled disablePictureInPicture disableRemotePlayback formNoValidate hidden loop noModule noValidate open playsInline readOnly required reversed scoped seamless itemScope".split(" ").forEach(function(t){vn[t]=new Fn(t,3,!1,t.toLowerCase(),null,!1,!1)});["checked","multiple","muted","selected"].forEach(function(t){vn[t]=new Fn(t,3,!0,t,null,!1,!1)});["capture","download"].forEach(function(t){vn[t]=new Fn(t,4,!1,t,null,!1,!1)});["cols","rows","size","span"].forEach(function(t){vn[t]=new Fn(t,6,!1,t,null,!1,!1)});["rowSpan","start"].forEach(function(t){vn[t]=new Fn(t,5,!1,t.toLowerCase(),null,!1,!1)});var Bh=/[\-:]([a-z])/g;function zh(t){return t[1].toUpperCase()}"accent-height alignment-baseline arabic-form baseline-shift cap-height clip-path clip-rule color-interpolation color-interpolation-filters color-profile color-rendering dominant-baseline enable-background fill-opacity fill-rule flood-color flood-opacity font-family font-size font-size-adjust font-stretch font-style font-variant font-weight glyph-name glyph-orientation-horizontal glyph-orientation-vertical horiz-adv-x horiz-origin-x image-rendering letter-spacing lighting-color marker-end marker-mid marker-start overline-position overline-thickness paint-order panose-1 pointer-events rendering-intent shape-rendering stop-color stop-opacity strikethrough-position strikethrough-thickness stroke-dasharray stroke-dashoffset stroke-linecap stroke-linejoin stroke-miterlimit stroke-opacity stroke-width text-anchor text-decoration text-rendering underline-position underline-thickness unicode-bidi unicode-range units-per-em v-alphabetic v-hanging v-ideographic v-mathematical vector-effect vert-adv-y vert-origin-x vert-origin-y word-spacing writing-mode xmlns:xlink x-height".split(" ").forEach(function(t){var e=t.replace(Bh,zh);vn[e]=new Fn(e,1,!1,t,null,!1,!1)});"xlink:actuate xlink:arcrole xlink:role xlink:show xlink:title xlink:type".split(" ").forEach(function(t){var e=t.replace(Bh,zh);vn[e]=new Fn(e,1,!1,t,"http://www.w3.org/1999/xlink",!1,!1)});["xml:base","xml:lang","xml:space"].forEach(function(t){var e=t.replace(Bh,zh);vn[e]=new Fn(e,1,!1,t,"http://www.w3.org/XML/1998/namespace",!1,!1)});["tabIndex","crossOrigin"].forEach(function(t){vn[t]=new Fn(t,1,!1,t.toLowerCase(),null,!1,!1)});vn.xlinkHref=new Fn("xlinkHref",1,!1,"xlink:href","http://www.w3.org/1999/xlink",!0,!1);["src","href","action","formAction"].forEach(function(t){vn[t]=new Fn(t,1,!1,t.toLowerCase(),null,!0,!0)});function Hh(t,e,n,i){var r=vn.hasOwnProperty(e)?vn[e]:null;(r!==null?r.type!==0:i||!(2<e.length)||e[0]!=="o"&&e[0]!=="O"||e[1]!=="n"&&e[1]!=="N")&&($y(e,n,r,i)&&(n=null),i||r===null?Wy(e)&&(n===null?t.removeAttribute(e):t.setAttribute(e,""+n)):r.mustUseProperty?t[r.propertyName]=n===null?r.type===3?!1:"":n:(e=r.attributeName,i=r.attributeNamespace,n===null?t.removeAttribute(e):(r=r.type,n=r===3||r===4&&n===!0?"":""+n,i?t.setAttributeNS(i,e,n):t.setAttribute(e,n))))}var Ir=Gy.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED,_l=Symbol.for("react.element"),ca=Symbol.for("react.portal"),ua=Symbol.for("react.fragment"),Vh=Symbol.for("react.strict_mode"),$d=Symbol.for("react.profiler"),a_=Symbol.for("react.provider"),o_=Symbol.for("react.context"),Gh=Symbol.for("react.forward_ref"),qd=Symbol.for("react.suspense"),Yd=Symbol.for("react.suspense_list"),jh=Symbol.for("react.memo"),Wr=Symbol.for("react.lazy"),l_=Symbol.for("react.offscreen"),xm=Symbol.iterator;function no(t){return t===null||typeof t!="object"?null:(t=xm&&t[xm]||t["@@iterator"],typeof t=="function"?t:null)}var Xt=Object.assign,ku;function xo(t){if(ku===void 0)try{throw Error()}catch(n){var e=n.stack.trim().match(/\n( *(at )?)/);ku=e&&e[1]||""}return`
`+ku+t}var Bu=!1;function zu(t,e){if(!t||Bu)return"";Bu=!0;var n=Error.prepareStackTrace;Error.prepareStackTrace=void 0;try{if(e)if(e=function(){throw Error()},Object.defineProperty(e.prototype,"props",{set:function(){throw Error()}}),typeof Reflect=="object"&&Reflect.construct){try{Reflect.construct(e,[])}catch(c){var i=c}Reflect.construct(t,[],e)}else{try{e.call()}catch(c){i=c}t.call(e.prototype)}else{try{throw Error()}catch(c){i=c}t()}}catch(c){if(c&&i&&typeof c.stack=="string"){for(var r=c.stack.split(`
`),s=i.stack.split(`
`),a=r.length-1,o=s.length-1;1<=a&&0<=o&&r[a]!==s[o];)o--;for(;1<=a&&0<=o;a--,o--)if(r[a]!==s[o]){if(a!==1||o!==1)do if(a--,o--,0>o||r[a]!==s[o]){var l=`
`+r[a].replace(" at new "," at ");return t.displayName&&l.includes("<anonymous>")&&(l=l.replace("<anonymous>",t.displayName)),l}while(1<=a&&0<=o);break}}}finally{Bu=!1,Error.prepareStackTrace=n}return(t=t?t.displayName||t.name:"")?xo(t):""}function qy(t){switch(t.tag){case 5:return xo(t.type);case 16:return xo("Lazy");case 13:return xo("Suspense");case 19:return xo("SuspenseList");case 0:case 2:case 15:return t=zu(t.type,!1),t;case 11:return t=zu(t.type.render,!1),t;case 1:return t=zu(t.type,!0),t;default:return""}}function Kd(t){if(t==null)return null;if(typeof t=="function")return t.displayName||t.name||null;if(typeof t=="string")return t;switch(t){case ua:return"Fragment";case ca:return"Portal";case $d:return"Profiler";case Vh:return"StrictMode";case qd:return"Suspense";case Yd:return"SuspenseList"}if(typeof t=="object")switch(t.$$typeof){case o_:return(t.displayName||"Context")+".Consumer";case a_:return(t._context.displayName||"Context")+".Provider";case Gh:var e=t.render;return t=t.displayName,t||(t=e.displayName||e.name||"",t=t!==""?"ForwardRef("+t+")":"ForwardRef"),t;case jh:return e=t.displayName||null,e!==null?e:Kd(t.type)||"Memo";case Wr:e=t._payload,t=t._init;try{return Kd(t(e))}catch{}}return null}function Yy(t){var e=t.type;switch(t.tag){case 24:return"Cache";case 9:return(e.displayName||"Context")+".Consumer";case 10:return(e._context.displayName||"Context")+".Provider";case 18:return"DehydratedFragment";case 11:return t=e.render,t=t.displayName||t.name||"",e.displayName||(t!==""?"ForwardRef("+t+")":"ForwardRef");case 7:return"Fragment";case 5:return e;case 4:return"Portal";case 3:return"Root";case 6:return"Text";case 16:return Kd(e);case 8:return e===Vh?"StrictMode":"Mode";case 22:return"Offscreen";case 12:return"Profiler";case 21:return"Scope";case 13:return"Suspense";case 19:return"SuspenseList";case 25:return"TracingMarker";case 1:case 0:case 17:case 2:case 14:case 15:if(typeof e=="function")return e.displayName||e.name||null;if(typeof e=="string")return e}return null}function os(t){switch(typeof t){case"boolean":case"number":case"string":case"undefined":return t;case"object":return t;default:return""}}function c_(t){var e=t.type;return(t=t.nodeName)&&t.toLowerCase()==="input"&&(e==="checkbox"||e==="radio")}function Ky(t){var e=c_(t)?"checked":"value",n=Object.getOwnPropertyDescriptor(t.constructor.prototype,e),i=""+t[e];if(!t.hasOwnProperty(e)&&typeof n<"u"&&typeof n.get=="function"&&typeof n.set=="function"){var r=n.get,s=n.set;return Object.defineProperty(t,e,{configurable:!0,get:function(){return r.call(this)},set:function(a){i=""+a,s.call(this,a)}}),Object.defineProperty(t,e,{enumerable:n.enumerable}),{getValue:function(){return i},setValue:function(a){i=""+a},stopTracking:function(){t._valueTracker=null,delete t[e]}}}}function vl(t){t._valueTracker||(t._valueTracker=Ky(t))}function u_(t){if(!t)return!1;var e=t._valueTracker;if(!e)return!0;var n=e.getValue(),i="";return t&&(i=c_(t)?t.checked?"true":"false":t.value),t=i,t!==n?(e.setValue(t),!0):!1}function Ac(t){if(t=t||(typeof document<"u"?document:void 0),typeof t>"u")return null;try{return t.activeElement||t.body}catch{return t.body}}function Zd(t,e){var n=e.checked;return Xt({},e,{defaultChecked:void 0,defaultValue:void 0,value:void 0,checked:n??t._wrapperState.initialChecked})}function ym(t,e){var n=e.defaultValue==null?"":e.defaultValue,i=e.checked!=null?e.checked:e.defaultChecked;n=os(e.value!=null?e.value:n),t._wrapperState={initialChecked:i,initialValue:n,controlled:e.type==="checkbox"||e.type==="radio"?e.checked!=null:e.value!=null}}function d_(t,e){e=e.checked,e!=null&&Hh(t,"checked",e,!1)}function Qd(t,e){d_(t,e);var n=os(e.value),i=e.type;if(n!=null)i==="number"?(n===0&&t.value===""||t.value!=n)&&(t.value=""+n):t.value!==""+n&&(t.value=""+n);else if(i==="submit"||i==="reset"){t.removeAttribute("value");return}e.hasOwnProperty("value")?Jd(t,e.type,n):e.hasOwnProperty("defaultValue")&&Jd(t,e.type,os(e.defaultValue)),e.checked==null&&e.defaultChecked!=null&&(t.defaultChecked=!!e.defaultChecked)}function Sm(t,e,n){if(e.hasOwnProperty("value")||e.hasOwnProperty("defaultValue")){var i=e.type;if(!(i!=="submit"&&i!=="reset"||e.value!==void 0&&e.value!==null))return;e=""+t._wrapperState.initialValue,n||e===t.value||(t.value=e),t.defaultValue=e}n=t.name,n!==""&&(t.name=""),t.defaultChecked=!!t._wrapperState.initialChecked,n!==""&&(t.name=n)}function Jd(t,e,n){(e!=="number"||Ac(t.ownerDocument)!==t)&&(n==null?t.defaultValue=""+t._wrapperState.initialValue:t.defaultValue!==""+n&&(t.defaultValue=""+n))}var yo=Array.isArray;function wa(t,e,n,i){if(t=t.options,e){e={};for(var r=0;r<n.length;r++)e["$"+n[r]]=!0;for(n=0;n<t.length;n++)r=e.hasOwnProperty("$"+t[n].value),t[n].selected!==r&&(t[n].selected=r),r&&i&&(t[n].defaultSelected=!0)}else{for(n=""+os(n),e=null,r=0;r<t.length;r++){if(t[r].value===n){t[r].selected=!0,i&&(t[r].defaultSelected=!0);return}e!==null||t[r].disabled||(e=t[r])}e!==null&&(e.selected=!0)}}function ef(t,e){if(e.dangerouslySetInnerHTML!=null)throw Error(ce(91));return Xt({},e,{value:void 0,defaultValue:void 0,children:""+t._wrapperState.initialValue})}function Mm(t,e){var n=e.value;if(n==null){if(n=e.children,e=e.defaultValue,n!=null){if(e!=null)throw Error(ce(92));if(yo(n)){if(1<n.length)throw Error(ce(93));n=n[0]}e=n}e==null&&(e=""),n=e}t._wrapperState={initialValue:os(n)}}function f_(t,e){var n=os(e.value),i=os(e.defaultValue);n!=null&&(n=""+n,n!==t.value&&(t.value=n),e.defaultValue==null&&t.defaultValue!==n&&(t.defaultValue=n)),i!=null&&(t.defaultValue=""+i)}function Em(t){var e=t.textContent;e===t._wrapperState.initialValue&&e!==""&&e!==null&&(t.value=e)}function h_(t){switch(t){case"svg":return"http://www.w3.org/2000/svg";case"math":return"http://www.w3.org/1998/Math/MathML";default:return"http://www.w3.org/1999/xhtml"}}function tf(t,e){return t==null||t==="http://www.w3.org/1999/xhtml"?h_(e):t==="http://www.w3.org/2000/svg"&&e==="foreignObject"?"http://www.w3.org/1999/xhtml":t}var xl,p_=function(t){return typeof MSApp<"u"&&MSApp.execUnsafeLocalFunction?function(e,n,i,r){MSApp.execUnsafeLocalFunction(function(){return t(e,n,i,r)})}:t}(function(t,e){if(t.namespaceURI!=="http://www.w3.org/2000/svg"||"innerHTML"in t)t.innerHTML=e;else{for(xl=xl||document.createElement("div"),xl.innerHTML="<svg>"+e.valueOf().toString()+"</svg>",e=xl.firstChild;t.firstChild;)t.removeChild(t.firstChild);for(;e.firstChild;)t.appendChild(e.firstChild)}});function Bo(t,e){if(e){var n=t.firstChild;if(n&&n===t.lastChild&&n.nodeType===3){n.nodeValue=e;return}}t.textContent=e}var bo={animationIterationCount:!0,aspectRatio:!0,borderImageOutset:!0,borderImageSlice:!0,borderImageWidth:!0,boxFlex:!0,boxFlexGroup:!0,boxOrdinalGroup:!0,columnCount:!0,columns:!0,flex:!0,flexGrow:!0,flexPositive:!0,flexShrink:!0,flexNegative:!0,flexOrder:!0,gridArea:!0,gridRow:!0,gridRowEnd:!0,gridRowSpan:!0,gridRowStart:!0,gridColumn:!0,gridColumnEnd:!0,gridColumnSpan:!0,gridColumnStart:!0,fontWeight:!0,lineClamp:!0,lineHeight:!0,opacity:!0,order:!0,orphans:!0,tabSize:!0,widows:!0,zIndex:!0,zoom:!0,fillOpacity:!0,floodOpacity:!0,stopOpacity:!0,strokeDasharray:!0,strokeDashoffset:!0,strokeMiterlimit:!0,strokeOpacity:!0,strokeWidth:!0},Zy=["Webkit","ms","Moz","O"];Object.keys(bo).forEach(function(t){Zy.forEach(function(e){e=e+t.charAt(0).toUpperCase()+t.substring(1),bo[e]=bo[t]})});function m_(t,e,n){return e==null||typeof e=="boolean"||e===""?"":n||typeof e!="number"||e===0||bo.hasOwnProperty(t)&&bo[t]?(""+e).trim():e+"px"}function g_(t,e){t=t.style;for(var n in e)if(e.hasOwnProperty(n)){var i=n.indexOf("--")===0,r=m_(n,e[n],i);n==="float"&&(n="cssFloat"),i?t.setProperty(n,r):t[n]=r}}var Qy=Xt({menuitem:!0},{area:!0,base:!0,br:!0,col:!0,embed:!0,hr:!0,img:!0,input:!0,keygen:!0,link:!0,meta:!0,param:!0,source:!0,track:!0,wbr:!0});function nf(t,e){if(e){if(Qy[t]&&(e.children!=null||e.dangerouslySetInnerHTML!=null))throw Error(ce(137,t));if(e.dangerouslySetInnerHTML!=null){if(e.children!=null)throw Error(ce(60));if(typeof e.dangerouslySetInnerHTML!="object"||!("__html"in e.dangerouslySetInnerHTML))throw Error(ce(61))}if(e.style!=null&&typeof e.style!="object")throw Error(ce(62))}}function rf(t,e){if(t.indexOf("-")===-1)return typeof e.is=="string";switch(t){case"annotation-xml":case"color-profile":case"font-face":case"font-face-src":case"font-face-uri":case"font-face-format":case"font-face-name":case"missing-glyph":return!1;default:return!0}}var sf=null;function Wh(t){return t=t.target||t.srcElement||window,t.correspondingUseElement&&(t=t.correspondingUseElement),t.nodeType===3?t.parentNode:t}var af=null,Ta=null,ba=null;function wm(t){if(t=cl(t)){if(typeof af!="function")throw Error(ce(280));var e=t.stateNode;e&&(e=hu(e),af(t.stateNode,t.type,e))}}function __(t){Ta?ba?ba.push(t):ba=[t]:Ta=t}function v_(){if(Ta){var t=Ta,e=ba;if(ba=Ta=null,wm(t),e)for(t=0;t<e.length;t++)wm(e[t])}}function x_(t,e){return t(e)}function y_(){}var Hu=!1;function S_(t,e,n){if(Hu)return t(e,n);Hu=!0;try{return x_(t,e,n)}finally{Hu=!1,(Ta!==null||ba!==null)&&(y_(),v_())}}function zo(t,e){var n=t.stateNode;if(n===null)return null;var i=hu(n);if(i===null)return null;n=i[e];e:switch(e){case"onClick":case"onClickCapture":case"onDoubleClick":case"onDoubleClickCapture":case"onMouseDown":case"onMouseDownCapture":case"onMouseMove":case"onMouseMoveCapture":case"onMouseUp":case"onMouseUpCapture":case"onMouseEnter":(i=!i.disabled)||(t=t.type,i=!(t==="button"||t==="input"||t==="select"||t==="textarea")),t=!i;break e;default:t=!1}if(t)return null;if(n&&typeof n!="function")throw Error(ce(231,e,typeof n));return n}var of=!1;if(Cr)try{var io={};Object.defineProperty(io,"passive",{get:function(){of=!0}}),window.addEventListener("test",io,io),window.removeEventListener("test",io,io)}catch{of=!1}function Jy(t,e,n,i,r,s,a,o,l){var c=Array.prototype.slice.call(arguments,3);try{e.apply(n,c)}catch(h){this.onError(h)}}var Ao=!1,Cc=null,Rc=!1,lf=null,eS={onError:function(t){Ao=!0,Cc=t}};function tS(t,e,n,i,r,s,a,o,l){Ao=!1,Cc=null,Jy.apply(eS,arguments)}function nS(t,e,n,i,r,s,a,o,l){if(tS.apply(this,arguments),Ao){if(Ao){var c=Cc;Ao=!1,Cc=null}else throw Error(ce(198));Rc||(Rc=!0,lf=c)}}function Hs(t){var e=t,n=t;if(t.alternate)for(;e.return;)e=e.return;else{t=e;do e=t,e.flags&4098&&(n=e.return),t=e.return;while(t)}return e.tag===3?n:null}function M_(t){if(t.tag===13){var e=t.memoizedState;if(e===null&&(t=t.alternate,t!==null&&(e=t.memoizedState)),e!==null)return e.dehydrated}return null}function Tm(t){if(Hs(t)!==t)throw Error(ce(188))}function iS(t){var e=t.alternate;if(!e){if(e=Hs(t),e===null)throw Error(ce(188));return e!==t?null:t}for(var n=t,i=e;;){var r=n.return;if(r===null)break;var s=r.alternate;if(s===null){if(i=r.return,i!==null){n=i;continue}break}if(r.child===s.child){for(s=r.child;s;){if(s===n)return Tm(r),t;if(s===i)return Tm(r),e;s=s.sibling}throw Error(ce(188))}if(n.return!==i.return)n=r,i=s;else{for(var a=!1,o=r.child;o;){if(o===n){a=!0,n=r,i=s;break}if(o===i){a=!0,i=r,n=s;break}o=o.sibling}if(!a){for(o=s.child;o;){if(o===n){a=!0,n=s,i=r;break}if(o===i){a=!0,i=s,n=r;break}o=o.sibling}if(!a)throw Error(ce(189))}}if(n.alternate!==i)throw Error(ce(190))}if(n.tag!==3)throw Error(ce(188));return n.stateNode.current===n?t:e}function E_(t){return t=iS(t),t!==null?w_(t):null}function w_(t){if(t.tag===5||t.tag===6)return t;for(t=t.child;t!==null;){var e=w_(t);if(e!==null)return e;t=t.sibling}return null}var T_=ai.unstable_scheduleCallback,bm=ai.unstable_cancelCallback,rS=ai.unstable_shouldYield,sS=ai.unstable_requestPaint,Zt=ai.unstable_now,aS=ai.unstable_getCurrentPriorityLevel,Xh=ai.unstable_ImmediatePriority,b_=ai.unstable_UserBlockingPriority,Pc=ai.unstable_NormalPriority,oS=ai.unstable_LowPriority,A_=ai.unstable_IdlePriority,cu=null,rr=null;function lS(t){if(rr&&typeof rr.onCommitFiberRoot=="function")try{rr.onCommitFiberRoot(cu,t,void 0,(t.current.flags&128)===128)}catch{}}var Fi=Math.clz32?Math.clz32:dS,cS=Math.log,uS=Math.LN2;function dS(t){return t>>>=0,t===0?32:31-(cS(t)/uS|0)|0}var yl=64,Sl=4194304;function So(t){switch(t&-t){case 1:return 1;case 2:return 2;case 4:return 4;case 8:return 8;case 16:return 16;case 32:return 32;case 64:case 128:case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:return t&4194240;case 4194304:case 8388608:case 16777216:case 33554432:case 67108864:return t&130023424;case 134217728:return 134217728;case 268435456:return 268435456;case 536870912:return 536870912;case 1073741824:return 1073741824;default:return t}}function Nc(t,e){var n=t.pendingLanes;if(n===0)return 0;var i=0,r=t.suspendedLanes,s=t.pingedLanes,a=n&268435455;if(a!==0){var o=a&~r;o!==0?i=So(o):(s&=a,s!==0&&(i=So(s)))}else a=n&~r,a!==0?i=So(a):s!==0&&(i=So(s));if(i===0)return 0;if(e!==0&&e!==i&&!(e&r)&&(r=i&-i,s=e&-e,r>=s||r===16&&(s&4194240)!==0))return e;if(i&4&&(i|=n&16),e=t.entangledLanes,e!==0)for(t=t.entanglements,e&=i;0<e;)n=31-Fi(e),r=1<<n,i|=t[n],e&=~r;return i}function fS(t,e){switch(t){case 1:case 2:case 4:return e+250;case 8:case 16:case 32:case 64:case 128:case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:return e+5e3;case 4194304:case 8388608:case 16777216:case 33554432:case 67108864:return-1;case 134217728:case 268435456:case 536870912:case 1073741824:return-1;default:return-1}}function hS(t,e){for(var n=t.suspendedLanes,i=t.pingedLanes,r=t.expirationTimes,s=t.pendingLanes;0<s;){var a=31-Fi(s),o=1<<a,l=r[a];l===-1?(!(o&n)||o&i)&&(r[a]=fS(o,e)):l<=e&&(t.expiredLanes|=o),s&=~o}}function cf(t){return t=t.pendingLanes&-1073741825,t!==0?t:t&1073741824?1073741824:0}function C_(){var t=yl;return yl<<=1,!(yl&4194240)&&(yl=64),t}function Vu(t){for(var e=[],n=0;31>n;n++)e.push(t);return e}function ol(t,e,n){t.pendingLanes|=e,e!==536870912&&(t.suspendedLanes=0,t.pingedLanes=0),t=t.eventTimes,e=31-Fi(e),t[e]=n}function pS(t,e){var n=t.pendingLanes&~e;t.pendingLanes=e,t.suspendedLanes=0,t.pingedLanes=0,t.expiredLanes&=e,t.mutableReadLanes&=e,t.entangledLanes&=e,e=t.entanglements;var i=t.eventTimes;for(t=t.expirationTimes;0<n;){var r=31-Fi(n),s=1<<r;e[r]=0,i[r]=-1,t[r]=-1,n&=~s}}function $h(t,e){var n=t.entangledLanes|=e;for(t=t.entanglements;n;){var i=31-Fi(n),r=1<<i;r&e|t[i]&e&&(t[i]|=e),n&=~r}}var At=0;function R_(t){return t&=-t,1<t?4<t?t&268435455?16:536870912:4:1}var P_,qh,N_,L_,D_,uf=!1,Ml=[],Jr=null,es=null,ts=null,Ho=new Map,Vo=new Map,$r=[],mS="mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset submit".split(" ");function Am(t,e){switch(t){case"focusin":case"focusout":Jr=null;break;case"dragenter":case"dragleave":es=null;break;case"mouseover":case"mouseout":ts=null;break;case"pointerover":case"pointerout":Ho.delete(e.pointerId);break;case"gotpointercapture":case"lostpointercapture":Vo.delete(e.pointerId)}}function ro(t,e,n,i,r,s){return t===null||t.nativeEvent!==s?(t={blockedOn:e,domEventName:n,eventSystemFlags:i,nativeEvent:s,targetContainers:[r]},e!==null&&(e=cl(e),e!==null&&qh(e)),t):(t.eventSystemFlags|=i,e=t.targetContainers,r!==null&&e.indexOf(r)===-1&&e.push(r),t)}function gS(t,e,n,i,r){switch(e){case"focusin":return Jr=ro(Jr,t,e,n,i,r),!0;case"dragenter":return es=ro(es,t,e,n,i,r),!0;case"mouseover":return ts=ro(ts,t,e,n,i,r),!0;case"pointerover":var s=r.pointerId;return Ho.set(s,ro(Ho.get(s)||null,t,e,n,i,r)),!0;case"gotpointercapture":return s=r.pointerId,Vo.set(s,ro(Vo.get(s)||null,t,e,n,i,r)),!0}return!1}function I_(t){var e=Ts(t.target);if(e!==null){var n=Hs(e);if(n!==null){if(e=n.tag,e===13){if(e=M_(n),e!==null){t.blockedOn=e,D_(t.priority,function(){N_(n)});return}}else if(e===3&&n.stateNode.current.memoizedState.isDehydrated){t.blockedOn=n.tag===3?n.stateNode.containerInfo:null;return}}}t.blockedOn=null}function uc(t){if(t.blockedOn!==null)return!1;for(var e=t.targetContainers;0<e.length;){var n=df(t.domEventName,t.eventSystemFlags,e[0],t.nativeEvent);if(n===null){n=t.nativeEvent;var i=new n.constructor(n.type,n);sf=i,n.target.dispatchEvent(i),sf=null}else return e=cl(n),e!==null&&qh(e),t.blockedOn=n,!1;e.shift()}return!0}function Cm(t,e,n){uc(t)&&n.delete(e)}function _S(){uf=!1,Jr!==null&&uc(Jr)&&(Jr=null),es!==null&&uc(es)&&(es=null),ts!==null&&uc(ts)&&(ts=null),Ho.forEach(Cm),Vo.forEach(Cm)}function so(t,e){t.blockedOn===e&&(t.blockedOn=null,uf||(uf=!0,ai.unstable_scheduleCallback(ai.unstable_NormalPriority,_S)))}function Go(t){function e(r){return so(r,t)}if(0<Ml.length){so(Ml[0],t);for(var n=1;n<Ml.length;n++){var i=Ml[n];i.blockedOn===t&&(i.blockedOn=null)}}for(Jr!==null&&so(Jr,t),es!==null&&so(es,t),ts!==null&&so(ts,t),Ho.forEach(e),Vo.forEach(e),n=0;n<$r.length;n++)i=$r[n],i.blockedOn===t&&(i.blockedOn=null);for(;0<$r.length&&(n=$r[0],n.blockedOn===null);)I_(n),n.blockedOn===null&&$r.shift()}var Aa=Ir.ReactCurrentBatchConfig,Lc=!0;function vS(t,e,n,i){var r=At,s=Aa.transition;Aa.transition=null;try{At=1,Yh(t,e,n,i)}finally{At=r,Aa.transition=s}}function xS(t,e,n,i){var r=At,s=Aa.transition;Aa.transition=null;try{At=4,Yh(t,e,n,i)}finally{At=r,Aa.transition=s}}function Yh(t,e,n,i){if(Lc){var r=df(t,e,n,i);if(r===null)Qu(t,e,i,Dc,n),Am(t,i);else if(gS(r,t,e,n,i))i.stopPropagation();else if(Am(t,i),e&4&&-1<mS.indexOf(t)){for(;r!==null;){var s=cl(r);if(s!==null&&P_(s),s=df(t,e,n,i),s===null&&Qu(t,e,i,Dc,n),s===r)break;r=s}r!==null&&i.stopPropagation()}else Qu(t,e,i,null,n)}}var Dc=null;function df(t,e,n,i){if(Dc=null,t=Wh(i),t=Ts(t),t!==null)if(e=Hs(t),e===null)t=null;else if(n=e.tag,n===13){if(t=M_(e),t!==null)return t;t=null}else if(n===3){if(e.stateNode.current.memoizedState.isDehydrated)return e.tag===3?e.stateNode.containerInfo:null;t=null}else e!==t&&(t=null);return Dc=t,null}function U_(t){switch(t){case"cancel":case"click":case"close":case"contextmenu":case"copy":case"cut":case"auxclick":case"dblclick":case"dragend":case"dragstart":case"drop":case"focusin":case"focusout":case"input":case"invalid":case"keydown":case"keypress":case"keyup":case"mousedown":case"mouseup":case"paste":case"pause":case"play":case"pointercancel":case"pointerdown":case"pointerup":case"ratechange":case"reset":case"resize":case"seeked":case"submit":case"touchcancel":case"touchend":case"touchstart":case"volumechange":case"change":case"selectionchange":case"textInput":case"compositionstart":case"compositionend":case"compositionupdate":case"beforeblur":case"afterblur":case"beforeinput":case"blur":case"fullscreenchange":case"focus":case"hashchange":case"popstate":case"select":case"selectstart":return 1;case"drag":case"dragenter":case"dragexit":case"dragleave":case"dragover":case"mousemove":case"mouseout":case"mouseover":case"pointermove":case"pointerout":case"pointerover":case"scroll":case"toggle":case"touchmove":case"wheel":case"mouseenter":case"mouseleave":case"pointerenter":case"pointerleave":return 4;case"message":switch(aS()){case Xh:return 1;case b_:return 4;case Pc:case oS:return 16;case A_:return 536870912;default:return 16}default:return 16}}var Kr=null,Kh=null,dc=null;function F_(){if(dc)return dc;var t,e=Kh,n=e.length,i,r="value"in Kr?Kr.value:Kr.textContent,s=r.length;for(t=0;t<n&&e[t]===r[t];t++);var a=n-t;for(i=1;i<=a&&e[n-i]===r[s-i];i++);return dc=r.slice(t,1<i?1-i:void 0)}function fc(t){var e=t.keyCode;return"charCode"in t?(t=t.charCode,t===0&&e===13&&(t=13)):t=e,t===10&&(t=13),32<=t||t===13?t:0}function El(){return!0}function Rm(){return!1}function li(t){function e(n,i,r,s,a){this._reactName=n,this._targetInst=r,this.type=i,this.nativeEvent=s,this.target=a,this.currentTarget=null;for(var o in t)t.hasOwnProperty(o)&&(n=t[o],this[o]=n?n(s):s[o]);return this.isDefaultPrevented=(s.defaultPrevented!=null?s.defaultPrevented:s.returnValue===!1)?El:Rm,this.isPropagationStopped=Rm,this}return Xt(e.prototype,{preventDefault:function(){this.defaultPrevented=!0;var n=this.nativeEvent;n&&(n.preventDefault?n.preventDefault():typeof n.returnValue!="unknown"&&(n.returnValue=!1),this.isDefaultPrevented=El)},stopPropagation:function(){var n=this.nativeEvent;n&&(n.stopPropagation?n.stopPropagation():typeof n.cancelBubble!="unknown"&&(n.cancelBubble=!0),this.isPropagationStopped=El)},persist:function(){},isPersistent:El}),e}var Wa={eventPhase:0,bubbles:0,cancelable:0,timeStamp:function(t){return t.timeStamp||Date.now()},defaultPrevented:0,isTrusted:0},Zh=li(Wa),ll=Xt({},Wa,{view:0,detail:0}),yS=li(ll),Gu,ju,ao,uu=Xt({},ll,{screenX:0,screenY:0,clientX:0,clientY:0,pageX:0,pageY:0,ctrlKey:0,shiftKey:0,altKey:0,metaKey:0,getModifierState:Qh,button:0,buttons:0,relatedTarget:function(t){return t.relatedTarget===void 0?t.fromElement===t.srcElement?t.toElement:t.fromElement:t.relatedTarget},movementX:function(t){return"movementX"in t?t.movementX:(t!==ao&&(ao&&t.type==="mousemove"?(Gu=t.screenX-ao.screenX,ju=t.screenY-ao.screenY):ju=Gu=0,ao=t),Gu)},movementY:function(t){return"movementY"in t?t.movementY:ju}}),Pm=li(uu),SS=Xt({},uu,{dataTransfer:0}),MS=li(SS),ES=Xt({},ll,{relatedTarget:0}),Wu=li(ES),wS=Xt({},Wa,{animationName:0,elapsedTime:0,pseudoElement:0}),TS=li(wS),bS=Xt({},Wa,{clipboardData:function(t){return"clipboardData"in t?t.clipboardData:window.clipboardData}}),AS=li(bS),CS=Xt({},Wa,{data:0}),Nm=li(CS),RS={Esc:"Escape",Spacebar:" ",Left:"ArrowLeft",Up:"ArrowUp",Right:"ArrowRight",Down:"ArrowDown",Del:"Delete",Win:"OS",Menu:"ContextMenu",Apps:"ContextMenu",Scroll:"ScrollLock",MozPrintableKey:"Unidentified"},PS={8:"Backspace",9:"Tab",12:"Clear",13:"Enter",16:"Shift",17:"Control",18:"Alt",19:"Pause",20:"CapsLock",27:"Escape",32:" ",33:"PageUp",34:"PageDown",35:"End",36:"Home",37:"ArrowLeft",38:"ArrowUp",39:"ArrowRight",40:"ArrowDown",45:"Insert",46:"Delete",112:"F1",113:"F2",114:"F3",115:"F4",116:"F5",117:"F6",118:"F7",119:"F8",120:"F9",121:"F10",122:"F11",123:"F12",144:"NumLock",145:"ScrollLock",224:"Meta"},NS={Alt:"altKey",Control:"ctrlKey",Meta:"metaKey",Shift:"shiftKey"};function LS(t){var e=this.nativeEvent;return e.getModifierState?e.getModifierState(t):(t=NS[t])?!!e[t]:!1}function Qh(){return LS}var DS=Xt({},ll,{key:function(t){if(t.key){var e=RS[t.key]||t.key;if(e!=="Unidentified")return e}return t.type==="keypress"?(t=fc(t),t===13?"Enter":String.fromCharCode(t)):t.type==="keydown"||t.type==="keyup"?PS[t.keyCode]||"Unidentified":""},code:0,location:0,ctrlKey:0,shiftKey:0,altKey:0,metaKey:0,repeat:0,locale:0,getModifierState:Qh,charCode:function(t){return t.type==="keypress"?fc(t):0},keyCode:function(t){return t.type==="keydown"||t.type==="keyup"?t.keyCode:0},which:function(t){return t.type==="keypress"?fc(t):t.type==="keydown"||t.type==="keyup"?t.keyCode:0}}),IS=li(DS),US=Xt({},uu,{pointerId:0,width:0,height:0,pressure:0,tangentialPressure:0,tiltX:0,tiltY:0,twist:0,pointerType:0,isPrimary:0}),Lm=li(US),FS=Xt({},ll,{touches:0,targetTouches:0,changedTouches:0,altKey:0,metaKey:0,ctrlKey:0,shiftKey:0,getModifierState:Qh}),OS=li(FS),kS=Xt({},Wa,{propertyName:0,elapsedTime:0,pseudoElement:0}),BS=li(kS),zS=Xt({},uu,{deltaX:function(t){return"deltaX"in t?t.deltaX:"wheelDeltaX"in t?-t.wheelDeltaX:0},deltaY:function(t){return"deltaY"in t?t.deltaY:"wheelDeltaY"in t?-t.wheelDeltaY:"wheelDelta"in t?-t.wheelDelta:0},deltaZ:0,deltaMode:0}),HS=li(zS),VS=[9,13,27,32],Jh=Cr&&"CompositionEvent"in window,Co=null;Cr&&"documentMode"in document&&(Co=document.documentMode);var GS=Cr&&"TextEvent"in window&&!Co,O_=Cr&&(!Jh||Co&&8<Co&&11>=Co),Dm=" ",Im=!1;function k_(t,e){switch(t){case"keyup":return VS.indexOf(e.keyCode)!==-1;case"keydown":return e.keyCode!==229;case"keypress":case"mousedown":case"focusout":return!0;default:return!1}}function B_(t){return t=t.detail,typeof t=="object"&&"data"in t?t.data:null}var da=!1;function jS(t,e){switch(t){case"compositionend":return B_(e);case"keypress":return e.which!==32?null:(Im=!0,Dm);case"textInput":return t=e.data,t===Dm&&Im?null:t;default:return null}}function WS(t,e){if(da)return t==="compositionend"||!Jh&&k_(t,e)?(t=F_(),dc=Kh=Kr=null,da=!1,t):null;switch(t){case"paste":return null;case"keypress":if(!(e.ctrlKey||e.altKey||e.metaKey)||e.ctrlKey&&e.altKey){if(e.char&&1<e.char.length)return e.char;if(e.which)return String.fromCharCode(e.which)}return null;case"compositionend":return O_&&e.locale!=="ko"?null:e.data;default:return null}}var XS={color:!0,date:!0,datetime:!0,"datetime-local":!0,email:!0,month:!0,number:!0,password:!0,range:!0,search:!0,tel:!0,text:!0,time:!0,url:!0,week:!0};function Um(t){var e=t&&t.nodeName&&t.nodeName.toLowerCase();return e==="input"?!!XS[t.type]:e==="textarea"}function z_(t,e,n,i){__(i),e=Ic(e,"onChange"),0<e.length&&(n=new Zh("onChange","change",null,n,i),t.push({event:n,listeners:e}))}var Ro=null,jo=null;function $S(t){Z_(t,0)}function du(t){var e=pa(t);if(u_(e))return t}function qS(t,e){if(t==="change")return e}var H_=!1;if(Cr){var Xu;if(Cr){var $u="oninput"in document;if(!$u){var Fm=document.createElement("div");Fm.setAttribute("oninput","return;"),$u=typeof Fm.oninput=="function"}Xu=$u}else Xu=!1;H_=Xu&&(!document.documentMode||9<document.documentMode)}function Om(){Ro&&(Ro.detachEvent("onpropertychange",V_),jo=Ro=null)}function V_(t){if(t.propertyName==="value"&&du(jo)){var e=[];z_(e,jo,t,Wh(t)),S_($S,e)}}function YS(t,e,n){t==="focusin"?(Om(),Ro=e,jo=n,Ro.attachEvent("onpropertychange",V_)):t==="focusout"&&Om()}function KS(t){if(t==="selectionchange"||t==="keyup"||t==="keydown")return du(jo)}function ZS(t,e){if(t==="click")return du(e)}function QS(t,e){if(t==="input"||t==="change")return du(e)}function JS(t,e){return t===e&&(t!==0||1/t===1/e)||t!==t&&e!==e}var Bi=typeof Object.is=="function"?Object.is:JS;function Wo(t,e){if(Bi(t,e))return!0;if(typeof t!="object"||t===null||typeof e!="object"||e===null)return!1;var n=Object.keys(t),i=Object.keys(e);if(n.length!==i.length)return!1;for(i=0;i<n.length;i++){var r=n[i];if(!Xd.call(e,r)||!Bi(t[r],e[r]))return!1}return!0}function km(t){for(;t&&t.firstChild;)t=t.firstChild;return t}function Bm(t,e){var n=km(t);t=0;for(var i;n;){if(n.nodeType===3){if(i=t+n.textContent.length,t<=e&&i>=e)return{node:n,offset:e-t};t=i}e:{for(;n;){if(n.nextSibling){n=n.nextSibling;break e}n=n.parentNode}n=void 0}n=km(n)}}function G_(t,e){return t&&e?t===e?!0:t&&t.nodeType===3?!1:e&&e.nodeType===3?G_(t,e.parentNode):"contains"in t?t.contains(e):t.compareDocumentPosition?!!(t.compareDocumentPosition(e)&16):!1:!1}function j_(){for(var t=window,e=Ac();e instanceof t.HTMLIFrameElement;){try{var n=typeof e.contentWindow.location.href=="string"}catch{n=!1}if(n)t=e.contentWindow;else break;e=Ac(t.document)}return e}function ep(t){var e=t&&t.nodeName&&t.nodeName.toLowerCase();return e&&(e==="input"&&(t.type==="text"||t.type==="search"||t.type==="tel"||t.type==="url"||t.type==="password")||e==="textarea"||t.contentEditable==="true")}function eM(t){var e=j_(),n=t.focusedElem,i=t.selectionRange;if(e!==n&&n&&n.ownerDocument&&G_(n.ownerDocument.documentElement,n)){if(i!==null&&ep(n)){if(e=i.start,t=i.end,t===void 0&&(t=e),"selectionStart"in n)n.selectionStart=e,n.selectionEnd=Math.min(t,n.value.length);else if(t=(e=n.ownerDocument||document)&&e.defaultView||window,t.getSelection){t=t.getSelection();var r=n.textContent.length,s=Math.min(i.start,r);i=i.end===void 0?s:Math.min(i.end,r),!t.extend&&s>i&&(r=i,i=s,s=r),r=Bm(n,s);var a=Bm(n,i);r&&a&&(t.rangeCount!==1||t.anchorNode!==r.node||t.anchorOffset!==r.offset||t.focusNode!==a.node||t.focusOffset!==a.offset)&&(e=e.createRange(),e.setStart(r.node,r.offset),t.removeAllRanges(),s>i?(t.addRange(e),t.extend(a.node,a.offset)):(e.setEnd(a.node,a.offset),t.addRange(e)))}}for(e=[],t=n;t=t.parentNode;)t.nodeType===1&&e.push({element:t,left:t.scrollLeft,top:t.scrollTop});for(typeof n.focus=="function"&&n.focus(),n=0;n<e.length;n++)t=e[n],t.element.scrollLeft=t.left,t.element.scrollTop=t.top}}var tM=Cr&&"documentMode"in document&&11>=document.documentMode,fa=null,ff=null,Po=null,hf=!1;function zm(t,e,n){var i=n.window===n?n.document:n.nodeType===9?n:n.ownerDocument;hf||fa==null||fa!==Ac(i)||(i=fa,"selectionStart"in i&&ep(i)?i={start:i.selectionStart,end:i.selectionEnd}:(i=(i.ownerDocument&&i.ownerDocument.defaultView||window).getSelection(),i={anchorNode:i.anchorNode,anchorOffset:i.anchorOffset,focusNode:i.focusNode,focusOffset:i.focusOffset}),Po&&Wo(Po,i)||(Po=i,i=Ic(ff,"onSelect"),0<i.length&&(e=new Zh("onSelect","select",null,e,n),t.push({event:e,listeners:i}),e.target=fa)))}function wl(t,e){var n={};return n[t.toLowerCase()]=e.toLowerCase(),n["Webkit"+t]="webkit"+e,n["Moz"+t]="moz"+e,n}var ha={animationend:wl("Animation","AnimationEnd"),animationiteration:wl("Animation","AnimationIteration"),animationstart:wl("Animation","AnimationStart"),transitionend:wl("Transition","TransitionEnd")},qu={},W_={};Cr&&(W_=document.createElement("div").style,"AnimationEvent"in window||(delete ha.animationend.animation,delete ha.animationiteration.animation,delete ha.animationstart.animation),"TransitionEvent"in window||delete ha.transitionend.transition);function fu(t){if(qu[t])return qu[t];if(!ha[t])return t;var e=ha[t],n;for(n in e)if(e.hasOwnProperty(n)&&n in W_)return qu[t]=e[n];return t}var X_=fu("animationend"),$_=fu("animationiteration"),q_=fu("animationstart"),Y_=fu("transitionend"),K_=new Map,Hm="abort auxClick cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel".split(" ");function ds(t,e){K_.set(t,e),zs(e,[t])}for(var Yu=0;Yu<Hm.length;Yu++){var Ku=Hm[Yu],nM=Ku.toLowerCase(),iM=Ku[0].toUpperCase()+Ku.slice(1);ds(nM,"on"+iM)}ds(X_,"onAnimationEnd");ds($_,"onAnimationIteration");ds(q_,"onAnimationStart");ds("dblclick","onDoubleClick");ds("focusin","onFocus");ds("focusout","onBlur");ds(Y_,"onTransitionEnd");Ia("onMouseEnter",["mouseout","mouseover"]);Ia("onMouseLeave",["mouseout","mouseover"]);Ia("onPointerEnter",["pointerout","pointerover"]);Ia("onPointerLeave",["pointerout","pointerover"]);zs("onChange","change click focusin focusout input keydown keyup selectionchange".split(" "));zs("onSelect","focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange".split(" "));zs("onBeforeInput",["compositionend","keypress","textInput","paste"]);zs("onCompositionEnd","compositionend focusout keydown keypress keyup mousedown".split(" "));zs("onCompositionStart","compositionstart focusout keydown keypress keyup mousedown".split(" "));zs("onCompositionUpdate","compositionupdate focusout keydown keypress keyup mousedown".split(" "));var Mo="abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting".split(" "),rM=new Set("cancel close invalid load scroll toggle".split(" ").concat(Mo));function Vm(t,e,n){var i=t.type||"unknown-event";t.currentTarget=n,nS(i,e,void 0,t),t.currentTarget=null}function Z_(t,e){e=(e&4)!==0;for(var n=0;n<t.length;n++){var i=t[n],r=i.event;i=i.listeners;e:{var s=void 0;if(e)for(var a=i.length-1;0<=a;a--){var o=i[a],l=o.instance,c=o.currentTarget;if(o=o.listener,l!==s&&r.isPropagationStopped())break e;Vm(r,o,c),s=l}else for(a=0;a<i.length;a++){if(o=i[a],l=o.instance,c=o.currentTarget,o=o.listener,l!==s&&r.isPropagationStopped())break e;Vm(r,o,c),s=l}}}if(Rc)throw t=lf,Rc=!1,lf=null,t}function Dt(t,e){var n=e[vf];n===void 0&&(n=e[vf]=new Set);var i=t+"__bubble";n.has(i)||(Q_(e,t,2,!1),n.add(i))}function Zu(t,e,n){var i=0;e&&(i|=4),Q_(n,t,i,e)}var Tl="_reactListening"+Math.random().toString(36).slice(2);function Xo(t){if(!t[Tl]){t[Tl]=!0,s_.forEach(function(n){n!=="selectionchange"&&(rM.has(n)||Zu(n,!1,t),Zu(n,!0,t))});var e=t.nodeType===9?t:t.ownerDocument;e===null||e[Tl]||(e[Tl]=!0,Zu("selectionchange",!1,e))}}function Q_(t,e,n,i){switch(U_(e)){case 1:var r=vS;break;case 4:r=xS;break;default:r=Yh}n=r.bind(null,e,n,t),r=void 0,!of||e!=="touchstart"&&e!=="touchmove"&&e!=="wheel"||(r=!0),i?r!==void 0?t.addEventListener(e,n,{capture:!0,passive:r}):t.addEventListener(e,n,!0):r!==void 0?t.addEventListener(e,n,{passive:r}):t.addEventListener(e,n,!1)}function Qu(t,e,n,i,r){var s=i;if(!(e&1)&&!(e&2)&&i!==null)e:for(;;){if(i===null)return;var a=i.tag;if(a===3||a===4){var o=i.stateNode.containerInfo;if(o===r||o.nodeType===8&&o.parentNode===r)break;if(a===4)for(a=i.return;a!==null;){var l=a.tag;if((l===3||l===4)&&(l=a.stateNode.containerInfo,l===r||l.nodeType===8&&l.parentNode===r))return;a=a.return}for(;o!==null;){if(a=Ts(o),a===null)return;if(l=a.tag,l===5||l===6){i=s=a;continue e}o=o.parentNode}}i=i.return}S_(function(){var c=s,h=Wh(n),p=[];e:{var f=K_.get(t);if(f!==void 0){var g=Zh,v=t;switch(t){case"keypress":if(fc(n)===0)break e;case"keydown":case"keyup":g=IS;break;case"focusin":v="focus",g=Wu;break;case"focusout":v="blur",g=Wu;break;case"beforeblur":case"afterblur":g=Wu;break;case"click":if(n.button===2)break e;case"auxclick":case"dblclick":case"mousedown":case"mousemove":case"mouseup":case"mouseout":case"mouseover":case"contextmenu":g=Pm;break;case"drag":case"dragend":case"dragenter":case"dragexit":case"dragleave":case"dragover":case"dragstart":case"drop":g=MS;break;case"touchcancel":case"touchend":case"touchmove":case"touchstart":g=OS;break;case X_:case $_:case q_:g=TS;break;case Y_:g=BS;break;case"scroll":g=yS;break;case"wheel":g=HS;break;case"copy":case"cut":case"paste":g=AS;break;case"gotpointercapture":case"lostpointercapture":case"pointercancel":case"pointerdown":case"pointermove":case"pointerout":case"pointerover":case"pointerup":g=Lm}var S=(e&4)!==0,_=!S&&t==="scroll",d=S?f!==null?f+"Capture":null:f;S=[];for(var m=c,M;m!==null;){M=m;var y=M.stateNode;if(M.tag===5&&y!==null&&(M=y,d!==null&&(y=zo(m,d),y!=null&&S.push($o(m,y,M)))),_)break;m=m.return}0<S.length&&(f=new g(f,v,null,n,h),p.push({event:f,listeners:S}))}}if(!(e&7)){e:{if(f=t==="mouseover"||t==="pointerover",g=t==="mouseout"||t==="pointerout",f&&n!==sf&&(v=n.relatedTarget||n.fromElement)&&(Ts(v)||v[Rr]))break e;if((g||f)&&(f=h.window===h?h:(f=h.ownerDocument)?f.defaultView||f.parentWindow:window,g?(v=n.relatedTarget||n.toElement,g=c,v=v?Ts(v):null,v!==null&&(_=Hs(v),v!==_||v.tag!==5&&v.tag!==6)&&(v=null)):(g=null,v=c),g!==v)){if(S=Pm,y="onMouseLeave",d="onMouseEnter",m="mouse",(t==="pointerout"||t==="pointerover")&&(S=Lm,y="onPointerLeave",d="onPointerEnter",m="pointer"),_=g==null?f:pa(g),M=v==null?f:pa(v),f=new S(y,m+"leave",g,n,h),f.target=_,f.relatedTarget=M,y=null,Ts(h)===c&&(S=new S(d,m+"enter",v,n,h),S.target=M,S.relatedTarget=_,y=S),_=y,g&&v)t:{for(S=g,d=v,m=0,M=S;M;M=Xs(M))m++;for(M=0,y=d;y;y=Xs(y))M++;for(;0<m-M;)S=Xs(S),m--;for(;0<M-m;)d=Xs(d),M--;for(;m--;){if(S===d||d!==null&&S===d.alternate)break t;S=Xs(S),d=Xs(d)}S=null}else S=null;g!==null&&Gm(p,f,g,S,!1),v!==null&&_!==null&&Gm(p,_,v,S,!0)}}e:{if(f=c?pa(c):window,g=f.nodeName&&f.nodeName.toLowerCase(),g==="select"||g==="input"&&f.type==="file")var T=qS;else if(Um(f))if(H_)T=QS;else{T=KS;var E=YS}else(g=f.nodeName)&&g.toLowerCase()==="input"&&(f.type==="checkbox"||f.type==="radio")&&(T=ZS);if(T&&(T=T(t,c))){z_(p,T,n,h);break e}E&&E(t,f,c),t==="focusout"&&(E=f._wrapperState)&&E.controlled&&f.type==="number"&&Jd(f,"number",f.value)}switch(E=c?pa(c):window,t){case"focusin":(Um(E)||E.contentEditable==="true")&&(fa=E,ff=c,Po=null);break;case"focusout":Po=ff=fa=null;break;case"mousedown":hf=!0;break;case"contextmenu":case"mouseup":case"dragend":hf=!1,zm(p,n,h);break;case"selectionchange":if(tM)break;case"keydown":case"keyup":zm(p,n,h)}var C;if(Jh)e:{switch(t){case"compositionstart":var x="onCompositionStart";break e;case"compositionend":x="onCompositionEnd";break e;case"compositionupdate":x="onCompositionUpdate";break e}x=void 0}else da?k_(t,n)&&(x="onCompositionEnd"):t==="keydown"&&n.keyCode===229&&(x="onCompositionStart");x&&(O_&&n.locale!=="ko"&&(da||x!=="onCompositionStart"?x==="onCompositionEnd"&&da&&(C=F_()):(Kr=h,Kh="value"in Kr?Kr.value:Kr.textContent,da=!0)),E=Ic(c,x),0<E.length&&(x=new Nm(x,t,null,n,h),p.push({event:x,listeners:E}),C?x.data=C:(C=B_(n),C!==null&&(x.data=C)))),(C=GS?jS(t,n):WS(t,n))&&(c=Ic(c,"onBeforeInput"),0<c.length&&(h=new Nm("onBeforeInput","beforeinput",null,n,h),p.push({event:h,listeners:c}),h.data=C))}Z_(p,e)})}function $o(t,e,n){return{instance:t,listener:e,currentTarget:n}}function Ic(t,e){for(var n=e+"Capture",i=[];t!==null;){var r=t,s=r.stateNode;r.tag===5&&s!==null&&(r=s,s=zo(t,n),s!=null&&i.unshift($o(t,s,r)),s=zo(t,e),s!=null&&i.push($o(t,s,r))),t=t.return}return i}function Xs(t){if(t===null)return null;do t=t.return;while(t&&t.tag!==5);return t||null}function Gm(t,e,n,i,r){for(var s=e._reactName,a=[];n!==null&&n!==i;){var o=n,l=o.alternate,c=o.stateNode;if(l!==null&&l===i)break;o.tag===5&&c!==null&&(o=c,r?(l=zo(n,s),l!=null&&a.unshift($o(n,l,o))):r||(l=zo(n,s),l!=null&&a.push($o(n,l,o)))),n=n.return}a.length!==0&&t.push({event:e,listeners:a})}var sM=/\r\n?/g,aM=/\u0000|\uFFFD/g;function jm(t){return(typeof t=="string"?t:""+t).replace(sM,`
`).replace(aM,"")}function bl(t,e,n){if(e=jm(e),jm(t)!==e&&n)throw Error(ce(425))}function Uc(){}var pf=null,mf=null;function gf(t,e){return t==="textarea"||t==="noscript"||typeof e.children=="string"||typeof e.children=="number"||typeof e.dangerouslySetInnerHTML=="object"&&e.dangerouslySetInnerHTML!==null&&e.dangerouslySetInnerHTML.__html!=null}var _f=typeof setTimeout=="function"?setTimeout:void 0,oM=typeof clearTimeout=="function"?clearTimeout:void 0,Wm=typeof Promise=="function"?Promise:void 0,lM=typeof queueMicrotask=="function"?queueMicrotask:typeof Wm<"u"?function(t){return Wm.resolve(null).then(t).catch(cM)}:_f;function cM(t){setTimeout(function(){throw t})}function Ju(t,e){var n=e,i=0;do{var r=n.nextSibling;if(t.removeChild(n),r&&r.nodeType===8)if(n=r.data,n==="/$"){if(i===0){t.removeChild(r),Go(e);return}i--}else n!=="$"&&n!=="$?"&&n!=="$!"||i++;n=r}while(n);Go(e)}function ns(t){for(;t!=null;t=t.nextSibling){var e=t.nodeType;if(e===1||e===3)break;if(e===8){if(e=t.data,e==="$"||e==="$!"||e==="$?")break;if(e==="/$")return null}}return t}function Xm(t){t=t.previousSibling;for(var e=0;t;){if(t.nodeType===8){var n=t.data;if(n==="$"||n==="$!"||n==="$?"){if(e===0)return t;e--}else n==="/$"&&e++}t=t.previousSibling}return null}var Xa=Math.random().toString(36).slice(2),er="__reactFiber$"+Xa,qo="__reactProps$"+Xa,Rr="__reactContainer$"+Xa,vf="__reactEvents$"+Xa,uM="__reactListeners$"+Xa,dM="__reactHandles$"+Xa;function Ts(t){var e=t[er];if(e)return e;for(var n=t.parentNode;n;){if(e=n[Rr]||n[er]){if(n=e.alternate,e.child!==null||n!==null&&n.child!==null)for(t=Xm(t);t!==null;){if(n=t[er])return n;t=Xm(t)}return e}t=n,n=t.parentNode}return null}function cl(t){return t=t[er]||t[Rr],!t||t.tag!==5&&t.tag!==6&&t.tag!==13&&t.tag!==3?null:t}function pa(t){if(t.tag===5||t.tag===6)return t.stateNode;throw Error(ce(33))}function hu(t){return t[qo]||null}var xf=[],ma=-1;function fs(t){return{current:t}}function Ut(t){0>ma||(t.current=xf[ma],xf[ma]=null,ma--)}function Nt(t,e){ma++,xf[ma]=t.current,t.current=e}var ls={},Cn=fs(ls),Xn=fs(!1),Ls=ls;function Ua(t,e){var n=t.type.contextTypes;if(!n)return ls;var i=t.stateNode;if(i&&i.__reactInternalMemoizedUnmaskedChildContext===e)return i.__reactInternalMemoizedMaskedChildContext;var r={},s;for(s in n)r[s]=e[s];return i&&(t=t.stateNode,t.__reactInternalMemoizedUnmaskedChildContext=e,t.__reactInternalMemoizedMaskedChildContext=r),r}function $n(t){return t=t.childContextTypes,t!=null}function Fc(){Ut(Xn),Ut(Cn)}function $m(t,e,n){if(Cn.current!==ls)throw Error(ce(168));Nt(Cn,e),Nt(Xn,n)}function J_(t,e,n){var i=t.stateNode;if(e=e.childContextTypes,typeof i.getChildContext!="function")return n;i=i.getChildContext();for(var r in i)if(!(r in e))throw Error(ce(108,Yy(t)||"Unknown",r));return Xt({},n,i)}function Oc(t){return t=(t=t.stateNode)&&t.__reactInternalMemoizedMergedChildContext||ls,Ls=Cn.current,Nt(Cn,t),Nt(Xn,Xn.current),!0}function qm(t,e,n){var i=t.stateNode;if(!i)throw Error(ce(169));n?(t=J_(t,e,Ls),i.__reactInternalMemoizedMergedChildContext=t,Ut(Xn),Ut(Cn),Nt(Cn,t)):Ut(Xn),Nt(Xn,n)}var yr=null,pu=!1,ed=!1;function ev(t){yr===null?yr=[t]:yr.push(t)}function fM(t){pu=!0,ev(t)}function hs(){if(!ed&&yr!==null){ed=!0;var t=0,e=At;try{var n=yr;for(At=1;t<n.length;t++){var i=n[t];do i=i(!0);while(i!==null)}yr=null,pu=!1}catch(r){throw yr!==null&&(yr=yr.slice(t+1)),T_(Xh,hs),r}finally{At=e,ed=!1}}return null}var ga=[],_a=0,kc=null,Bc=0,hi=[],pi=0,Ds=null,Mr=1,Er="";function Es(t,e){ga[_a++]=Bc,ga[_a++]=kc,kc=t,Bc=e}function tv(t,e,n){hi[pi++]=Mr,hi[pi++]=Er,hi[pi++]=Ds,Ds=t;var i=Mr;t=Er;var r=32-Fi(i)-1;i&=~(1<<r),n+=1;var s=32-Fi(e)+r;if(30<s){var a=r-r%5;s=(i&(1<<a)-1).toString(32),i>>=a,r-=a,Mr=1<<32-Fi(e)+r|n<<r|i,Er=s+t}else Mr=1<<s|n<<r|i,Er=t}function tp(t){t.return!==null&&(Es(t,1),tv(t,1,0))}function np(t){for(;t===kc;)kc=ga[--_a],ga[_a]=null,Bc=ga[--_a],ga[_a]=null;for(;t===Ds;)Ds=hi[--pi],hi[pi]=null,Er=hi[--pi],hi[pi]=null,Mr=hi[--pi],hi[pi]=null}var si=null,ii=null,Ot=!1,Li=null;function nv(t,e){var n=gi(5,null,null,0);n.elementType="DELETED",n.stateNode=e,n.return=t,e=t.deletions,e===null?(t.deletions=[n],t.flags|=16):e.push(n)}function Ym(t,e){switch(t.tag){case 5:var n=t.type;return e=e.nodeType!==1||n.toLowerCase()!==e.nodeName.toLowerCase()?null:e,e!==null?(t.stateNode=e,si=t,ii=ns(e.firstChild),!0):!1;case 6:return e=t.pendingProps===""||e.nodeType!==3?null:e,e!==null?(t.stateNode=e,si=t,ii=null,!0):!1;case 13:return e=e.nodeType!==8?null:e,e!==null?(n=Ds!==null?{id:Mr,overflow:Er}:null,t.memoizedState={dehydrated:e,treeContext:n,retryLane:1073741824},n=gi(18,null,null,0),n.stateNode=e,n.return=t,t.child=n,si=t,ii=null,!0):!1;default:return!1}}function yf(t){return(t.mode&1)!==0&&(t.flags&128)===0}function Sf(t){if(Ot){var e=ii;if(e){var n=e;if(!Ym(t,e)){if(yf(t))throw Error(ce(418));e=ns(n.nextSibling);var i=si;e&&Ym(t,e)?nv(i,n):(t.flags=t.flags&-4097|2,Ot=!1,si=t)}}else{if(yf(t))throw Error(ce(418));t.flags=t.flags&-4097|2,Ot=!1,si=t}}}function Km(t){for(t=t.return;t!==null&&t.tag!==5&&t.tag!==3&&t.tag!==13;)t=t.return;si=t}function Al(t){if(t!==si)return!1;if(!Ot)return Km(t),Ot=!0,!1;var e;if((e=t.tag!==3)&&!(e=t.tag!==5)&&(e=t.type,e=e!=="head"&&e!=="body"&&!gf(t.type,t.memoizedProps)),e&&(e=ii)){if(yf(t))throw iv(),Error(ce(418));for(;e;)nv(t,e),e=ns(e.nextSibling)}if(Km(t),t.tag===13){if(t=t.memoizedState,t=t!==null?t.dehydrated:null,!t)throw Error(ce(317));e:{for(t=t.nextSibling,e=0;t;){if(t.nodeType===8){var n=t.data;if(n==="/$"){if(e===0){ii=ns(t.nextSibling);break e}e--}else n!=="$"&&n!=="$!"&&n!=="$?"||e++}t=t.nextSibling}ii=null}}else ii=si?ns(t.stateNode.nextSibling):null;return!0}function iv(){for(var t=ii;t;)t=ns(t.nextSibling)}function Fa(){ii=si=null,Ot=!1}function ip(t){Li===null?Li=[t]:Li.push(t)}var hM=Ir.ReactCurrentBatchConfig;function oo(t,e,n){if(t=n.ref,t!==null&&typeof t!="function"&&typeof t!="object"){if(n._owner){if(n=n._owner,n){if(n.tag!==1)throw Error(ce(309));var i=n.stateNode}if(!i)throw Error(ce(147,t));var r=i,s=""+t;return e!==null&&e.ref!==null&&typeof e.ref=="function"&&e.ref._stringRef===s?e.ref:(e=function(a){var o=r.refs;a===null?delete o[s]:o[s]=a},e._stringRef=s,e)}if(typeof t!="string")throw Error(ce(284));if(!n._owner)throw Error(ce(290,t))}return t}function Cl(t,e){throw t=Object.prototype.toString.call(e),Error(ce(31,t==="[object Object]"?"object with keys {"+Object.keys(e).join(", ")+"}":t))}function Zm(t){var e=t._init;return e(t._payload)}function rv(t){function e(d,m){if(t){var M=d.deletions;M===null?(d.deletions=[m],d.flags|=16):M.push(m)}}function n(d,m){if(!t)return null;for(;m!==null;)e(d,m),m=m.sibling;return null}function i(d,m){for(d=new Map;m!==null;)m.key!==null?d.set(m.key,m):d.set(m.index,m),m=m.sibling;return d}function r(d,m){return d=as(d,m),d.index=0,d.sibling=null,d}function s(d,m,M){return d.index=M,t?(M=d.alternate,M!==null?(M=M.index,M<m?(d.flags|=2,m):M):(d.flags|=2,m)):(d.flags|=1048576,m)}function a(d){return t&&d.alternate===null&&(d.flags|=2),d}function o(d,m,M,y){return m===null||m.tag!==6?(m=od(M,d.mode,y),m.return=d,m):(m=r(m,M),m.return=d,m)}function l(d,m,M,y){var T=M.type;return T===ua?h(d,m,M.props.children,y,M.key):m!==null&&(m.elementType===T||typeof T=="object"&&T!==null&&T.$$typeof===Wr&&Zm(T)===m.type)?(y=r(m,M.props),y.ref=oo(d,m,M),y.return=d,y):(y=xc(M.type,M.key,M.props,null,d.mode,y),y.ref=oo(d,m,M),y.return=d,y)}function c(d,m,M,y){return m===null||m.tag!==4||m.stateNode.containerInfo!==M.containerInfo||m.stateNode.implementation!==M.implementation?(m=ld(M,d.mode,y),m.return=d,m):(m=r(m,M.children||[]),m.return=d,m)}function h(d,m,M,y,T){return m===null||m.tag!==7?(m=Ns(M,d.mode,y,T),m.return=d,m):(m=r(m,M),m.return=d,m)}function p(d,m,M){if(typeof m=="string"&&m!==""||typeof m=="number")return m=od(""+m,d.mode,M),m.return=d,m;if(typeof m=="object"&&m!==null){switch(m.$$typeof){case _l:return M=xc(m.type,m.key,m.props,null,d.mode,M),M.ref=oo(d,null,m),M.return=d,M;case ca:return m=ld(m,d.mode,M),m.return=d,m;case Wr:var y=m._init;return p(d,y(m._payload),M)}if(yo(m)||no(m))return m=Ns(m,d.mode,M,null),m.return=d,m;Cl(d,m)}return null}function f(d,m,M,y){var T=m!==null?m.key:null;if(typeof M=="string"&&M!==""||typeof M=="number")return T!==null?null:o(d,m,""+M,y);if(typeof M=="object"&&M!==null){switch(M.$$typeof){case _l:return M.key===T?l(d,m,M,y):null;case ca:return M.key===T?c(d,m,M,y):null;case Wr:return T=M._init,f(d,m,T(M._payload),y)}if(yo(M)||no(M))return T!==null?null:h(d,m,M,y,null);Cl(d,M)}return null}function g(d,m,M,y,T){if(typeof y=="string"&&y!==""||typeof y=="number")return d=d.get(M)||null,o(m,d,""+y,T);if(typeof y=="object"&&y!==null){switch(y.$$typeof){case _l:return d=d.get(y.key===null?M:y.key)||null,l(m,d,y,T);case ca:return d=d.get(y.key===null?M:y.key)||null,c(m,d,y,T);case Wr:var E=y._init;return g(d,m,M,E(y._payload),T)}if(yo(y)||no(y))return d=d.get(M)||null,h(m,d,y,T,null);Cl(m,y)}return null}function v(d,m,M,y){for(var T=null,E=null,C=m,x=m=0,b=null;C!==null&&x<M.length;x++){C.index>x?(b=C,C=null):b=C.sibling;var P=f(d,C,M[x],y);if(P===null){C===null&&(C=b);break}t&&C&&P.alternate===null&&e(d,C),m=s(P,m,x),E===null?T=P:E.sibling=P,E=P,C=b}if(x===M.length)return n(d,C),Ot&&Es(d,x),T;if(C===null){for(;x<M.length;x++)C=p(d,M[x],y),C!==null&&(m=s(C,m,x),E===null?T=C:E.sibling=C,E=C);return Ot&&Es(d,x),T}for(C=i(d,C);x<M.length;x++)b=g(C,d,x,M[x],y),b!==null&&(t&&b.alternate!==null&&C.delete(b.key===null?x:b.key),m=s(b,m,x),E===null?T=b:E.sibling=b,E=b);return t&&C.forEach(function(D){return e(d,D)}),Ot&&Es(d,x),T}function S(d,m,M,y){var T=no(M);if(typeof T!="function")throw Error(ce(150));if(M=T.call(M),M==null)throw Error(ce(151));for(var E=T=null,C=m,x=m=0,b=null,P=M.next();C!==null&&!P.done;x++,P=M.next()){C.index>x?(b=C,C=null):b=C.sibling;var D=f(d,C,P.value,y);if(D===null){C===null&&(C=b);break}t&&C&&D.alternate===null&&e(d,C),m=s(D,m,x),E===null?T=D:E.sibling=D,E=D,C=b}if(P.done)return n(d,C),Ot&&Es(d,x),T;if(C===null){for(;!P.done;x++,P=M.next())P=p(d,P.value,y),P!==null&&(m=s(P,m,x),E===null?T=P:E.sibling=P,E=P);return Ot&&Es(d,x),T}for(C=i(d,C);!P.done;x++,P=M.next())P=g(C,d,x,P.value,y),P!==null&&(t&&P.alternate!==null&&C.delete(P.key===null?x:P.key),m=s(P,m,x),E===null?T=P:E.sibling=P,E=P);return t&&C.forEach(function(O){return e(d,O)}),Ot&&Es(d,x),T}function _(d,m,M,y){if(typeof M=="object"&&M!==null&&M.type===ua&&M.key===null&&(M=M.props.children),typeof M=="object"&&M!==null){switch(M.$$typeof){case _l:e:{for(var T=M.key,E=m;E!==null;){if(E.key===T){if(T=M.type,T===ua){if(E.tag===7){n(d,E.sibling),m=r(E,M.props.children),m.return=d,d=m;break e}}else if(E.elementType===T||typeof T=="object"&&T!==null&&T.$$typeof===Wr&&Zm(T)===E.type){n(d,E.sibling),m=r(E,M.props),m.ref=oo(d,E,M),m.return=d,d=m;break e}n(d,E);break}else e(d,E);E=E.sibling}M.type===ua?(m=Ns(M.props.children,d.mode,y,M.key),m.return=d,d=m):(y=xc(M.type,M.key,M.props,null,d.mode,y),y.ref=oo(d,m,M),y.return=d,d=y)}return a(d);case ca:e:{for(E=M.key;m!==null;){if(m.key===E)if(m.tag===4&&m.stateNode.containerInfo===M.containerInfo&&m.stateNode.implementation===M.implementation){n(d,m.sibling),m=r(m,M.children||[]),m.return=d,d=m;break e}else{n(d,m);break}else e(d,m);m=m.sibling}m=ld(M,d.mode,y),m.return=d,d=m}return a(d);case Wr:return E=M._init,_(d,m,E(M._payload),y)}if(yo(M))return v(d,m,M,y);if(no(M))return S(d,m,M,y);Cl(d,M)}return typeof M=="string"&&M!==""||typeof M=="number"?(M=""+M,m!==null&&m.tag===6?(n(d,m.sibling),m=r(m,M),m.return=d,d=m):(n(d,m),m=od(M,d.mode,y),m.return=d,d=m),a(d)):n(d,m)}return _}var Oa=rv(!0),sv=rv(!1),zc=fs(null),Hc=null,va=null,rp=null;function sp(){rp=va=Hc=null}function ap(t){var e=zc.current;Ut(zc),t._currentValue=e}function Mf(t,e,n){for(;t!==null;){var i=t.alternate;if((t.childLanes&e)!==e?(t.childLanes|=e,i!==null&&(i.childLanes|=e)):i!==null&&(i.childLanes&e)!==e&&(i.childLanes|=e),t===n)break;t=t.return}}function Ca(t,e){Hc=t,rp=va=null,t=t.dependencies,t!==null&&t.firstContext!==null&&(t.lanes&e&&(Wn=!0),t.firstContext=null)}function xi(t){var e=t._currentValue;if(rp!==t)if(t={context:t,memoizedValue:e,next:null},va===null){if(Hc===null)throw Error(ce(308));va=t,Hc.dependencies={lanes:0,firstContext:t}}else va=va.next=t;return e}var bs=null;function op(t){bs===null?bs=[t]:bs.push(t)}function av(t,e,n,i){var r=e.interleaved;return r===null?(n.next=n,op(e)):(n.next=r.next,r.next=n),e.interleaved=n,Pr(t,i)}function Pr(t,e){t.lanes|=e;var n=t.alternate;for(n!==null&&(n.lanes|=e),n=t,t=t.return;t!==null;)t.childLanes|=e,n=t.alternate,n!==null&&(n.childLanes|=e),n=t,t=t.return;return n.tag===3?n.stateNode:null}var Xr=!1;function lp(t){t.updateQueue={baseState:t.memoizedState,firstBaseUpdate:null,lastBaseUpdate:null,shared:{pending:null,interleaved:null,lanes:0},effects:null}}function ov(t,e){t=t.updateQueue,e.updateQueue===t&&(e.updateQueue={baseState:t.baseState,firstBaseUpdate:t.firstBaseUpdate,lastBaseUpdate:t.lastBaseUpdate,shared:t.shared,effects:t.effects})}function Tr(t,e){return{eventTime:t,lane:e,tag:0,payload:null,callback:null,next:null}}function is(t,e,n){var i=t.updateQueue;if(i===null)return null;if(i=i.shared,_t&2){var r=i.pending;return r===null?e.next=e:(e.next=r.next,r.next=e),i.pending=e,Pr(t,n)}return r=i.interleaved,r===null?(e.next=e,op(i)):(e.next=r.next,r.next=e),i.interleaved=e,Pr(t,n)}function hc(t,e,n){if(e=e.updateQueue,e!==null&&(e=e.shared,(n&4194240)!==0)){var i=e.lanes;i&=t.pendingLanes,n|=i,e.lanes=n,$h(t,n)}}function Qm(t,e){var n=t.updateQueue,i=t.alternate;if(i!==null&&(i=i.updateQueue,n===i)){var r=null,s=null;if(n=n.firstBaseUpdate,n!==null){do{var a={eventTime:n.eventTime,lane:n.lane,tag:n.tag,payload:n.payload,callback:n.callback,next:null};s===null?r=s=a:s=s.next=a,n=n.next}while(n!==null);s===null?r=s=e:s=s.next=e}else r=s=e;n={baseState:i.baseState,firstBaseUpdate:r,lastBaseUpdate:s,shared:i.shared,effects:i.effects},t.updateQueue=n;return}t=n.lastBaseUpdate,t===null?n.firstBaseUpdate=e:t.next=e,n.lastBaseUpdate=e}function Vc(t,e,n,i){var r=t.updateQueue;Xr=!1;var s=r.firstBaseUpdate,a=r.lastBaseUpdate,o=r.shared.pending;if(o!==null){r.shared.pending=null;var l=o,c=l.next;l.next=null,a===null?s=c:a.next=c,a=l;var h=t.alternate;h!==null&&(h=h.updateQueue,o=h.lastBaseUpdate,o!==a&&(o===null?h.firstBaseUpdate=c:o.next=c,h.lastBaseUpdate=l))}if(s!==null){var p=r.baseState;a=0,h=c=l=null,o=s;do{var f=o.lane,g=o.eventTime;if((i&f)===f){h!==null&&(h=h.next={eventTime:g,lane:0,tag:o.tag,payload:o.payload,callback:o.callback,next:null});e:{var v=t,S=o;switch(f=e,g=n,S.tag){case 1:if(v=S.payload,typeof v=="function"){p=v.call(g,p,f);break e}p=v;break e;case 3:v.flags=v.flags&-65537|128;case 0:if(v=S.payload,f=typeof v=="function"?v.call(g,p,f):v,f==null)break e;p=Xt({},p,f);break e;case 2:Xr=!0}}o.callback!==null&&o.lane!==0&&(t.flags|=64,f=r.effects,f===null?r.effects=[o]:f.push(o))}else g={eventTime:g,lane:f,tag:o.tag,payload:o.payload,callback:o.callback,next:null},h===null?(c=h=g,l=p):h=h.next=g,a|=f;if(o=o.next,o===null){if(o=r.shared.pending,o===null)break;f=o,o=f.next,f.next=null,r.lastBaseUpdate=f,r.shared.pending=null}}while(!0);if(h===null&&(l=p),r.baseState=l,r.firstBaseUpdate=c,r.lastBaseUpdate=h,e=r.shared.interleaved,e!==null){r=e;do a|=r.lane,r=r.next;while(r!==e)}else s===null&&(r.shared.lanes=0);Us|=a,t.lanes=a,t.memoizedState=p}}function Jm(t,e,n){if(t=e.effects,e.effects=null,t!==null)for(e=0;e<t.length;e++){var i=t[e],r=i.callback;if(r!==null){if(i.callback=null,i=n,typeof r!="function")throw Error(ce(191,r));r.call(i)}}}var ul={},sr=fs(ul),Yo=fs(ul),Ko=fs(ul);function As(t){if(t===ul)throw Error(ce(174));return t}function cp(t,e){switch(Nt(Ko,e),Nt(Yo,t),Nt(sr,ul),t=e.nodeType,t){case 9:case 11:e=(e=e.documentElement)?e.namespaceURI:tf(null,"");break;default:t=t===8?e.parentNode:e,e=t.namespaceURI||null,t=t.tagName,e=tf(e,t)}Ut(sr),Nt(sr,e)}function ka(){Ut(sr),Ut(Yo),Ut(Ko)}function lv(t){As(Ko.current);var e=As(sr.current),n=tf(e,t.type);e!==n&&(Nt(Yo,t),Nt(sr,n))}function up(t){Yo.current===t&&(Ut(sr),Ut(Yo))}var Vt=fs(0);function Gc(t){for(var e=t;e!==null;){if(e.tag===13){var n=e.memoizedState;if(n!==null&&(n=n.dehydrated,n===null||n.data==="$?"||n.data==="$!"))return e}else if(e.tag===19&&e.memoizedProps.revealOrder!==void 0){if(e.flags&128)return e}else if(e.child!==null){e.child.return=e,e=e.child;continue}if(e===t)break;for(;e.sibling===null;){if(e.return===null||e.return===t)return null;e=e.return}e.sibling.return=e.return,e=e.sibling}return null}var td=[];function dp(){for(var t=0;t<td.length;t++)td[t]._workInProgressVersionPrimary=null;td.length=0}var pc=Ir.ReactCurrentDispatcher,nd=Ir.ReactCurrentBatchConfig,Is=0,jt=null,tn=null,dn=null,jc=!1,No=!1,Zo=0,pM=0;function yn(){throw Error(ce(321))}function fp(t,e){if(e===null)return!1;for(var n=0;n<e.length&&n<t.length;n++)if(!Bi(t[n],e[n]))return!1;return!0}function hp(t,e,n,i,r,s){if(Is=s,jt=e,e.memoizedState=null,e.updateQueue=null,e.lanes=0,pc.current=t===null||t.memoizedState===null?vM:xM,t=n(i,r),No){s=0;do{if(No=!1,Zo=0,25<=s)throw Error(ce(301));s+=1,dn=tn=null,e.updateQueue=null,pc.current=yM,t=n(i,r)}while(No)}if(pc.current=Wc,e=tn!==null&&tn.next!==null,Is=0,dn=tn=jt=null,jc=!1,e)throw Error(ce(300));return t}function pp(){var t=Zo!==0;return Zo=0,t}function Zi(){var t={memoizedState:null,baseState:null,baseQueue:null,queue:null,next:null};return dn===null?jt.memoizedState=dn=t:dn=dn.next=t,dn}function yi(){if(tn===null){var t=jt.alternate;t=t!==null?t.memoizedState:null}else t=tn.next;var e=dn===null?jt.memoizedState:dn.next;if(e!==null)dn=e,tn=t;else{if(t===null)throw Error(ce(310));tn=t,t={memoizedState:tn.memoizedState,baseState:tn.baseState,baseQueue:tn.baseQueue,queue:tn.queue,next:null},dn===null?jt.memoizedState=dn=t:dn=dn.next=t}return dn}function Qo(t,e){return typeof e=="function"?e(t):e}function id(t){var e=yi(),n=e.queue;if(n===null)throw Error(ce(311));n.lastRenderedReducer=t;var i=tn,r=i.baseQueue,s=n.pending;if(s!==null){if(r!==null){var a=r.next;r.next=s.next,s.next=a}i.baseQueue=r=s,n.pending=null}if(r!==null){s=r.next,i=i.baseState;var o=a=null,l=null,c=s;do{var h=c.lane;if((Is&h)===h)l!==null&&(l=l.next={lane:0,action:c.action,hasEagerState:c.hasEagerState,eagerState:c.eagerState,next:null}),i=c.hasEagerState?c.eagerState:t(i,c.action);else{var p={lane:h,action:c.action,hasEagerState:c.hasEagerState,eagerState:c.eagerState,next:null};l===null?(o=l=p,a=i):l=l.next=p,jt.lanes|=h,Us|=h}c=c.next}while(c!==null&&c!==s);l===null?a=i:l.next=o,Bi(i,e.memoizedState)||(Wn=!0),e.memoizedState=i,e.baseState=a,e.baseQueue=l,n.lastRenderedState=i}if(t=n.interleaved,t!==null){r=t;do s=r.lane,jt.lanes|=s,Us|=s,r=r.next;while(r!==t)}else r===null&&(n.lanes=0);return[e.memoizedState,n.dispatch]}function rd(t){var e=yi(),n=e.queue;if(n===null)throw Error(ce(311));n.lastRenderedReducer=t;var i=n.dispatch,r=n.pending,s=e.memoizedState;if(r!==null){n.pending=null;var a=r=r.next;do s=t(s,a.action),a=a.next;while(a!==r);Bi(s,e.memoizedState)||(Wn=!0),e.memoizedState=s,e.baseQueue===null&&(e.baseState=s),n.lastRenderedState=s}return[s,i]}function cv(){}function uv(t,e){var n=jt,i=yi(),r=e(),s=!Bi(i.memoizedState,r);if(s&&(i.memoizedState=r,Wn=!0),i=i.queue,mp(hv.bind(null,n,i,t),[t]),i.getSnapshot!==e||s||dn!==null&&dn.memoizedState.tag&1){if(n.flags|=2048,Jo(9,fv.bind(null,n,i,r,e),void 0,null),fn===null)throw Error(ce(349));Is&30||dv(n,e,r)}return r}function dv(t,e,n){t.flags|=16384,t={getSnapshot:e,value:n},e=jt.updateQueue,e===null?(e={lastEffect:null,stores:null},jt.updateQueue=e,e.stores=[t]):(n=e.stores,n===null?e.stores=[t]:n.push(t))}function fv(t,e,n,i){e.value=n,e.getSnapshot=i,pv(e)&&mv(t)}function hv(t,e,n){return n(function(){pv(e)&&mv(t)})}function pv(t){var e=t.getSnapshot;t=t.value;try{var n=e();return!Bi(t,n)}catch{return!0}}function mv(t){var e=Pr(t,1);e!==null&&Oi(e,t,1,-1)}function e0(t){var e=Zi();return typeof t=="function"&&(t=t()),e.memoizedState=e.baseState=t,t={pending:null,interleaved:null,lanes:0,dispatch:null,lastRenderedReducer:Qo,lastRenderedState:t},e.queue=t,t=t.dispatch=_M.bind(null,jt,t),[e.memoizedState,t]}function Jo(t,e,n,i){return t={tag:t,create:e,destroy:n,deps:i,next:null},e=jt.updateQueue,e===null?(e={lastEffect:null,stores:null},jt.updateQueue=e,e.lastEffect=t.next=t):(n=e.lastEffect,n===null?e.lastEffect=t.next=t:(i=n.next,n.next=t,t.next=i,e.lastEffect=t)),t}function gv(){return yi().memoizedState}function mc(t,e,n,i){var r=Zi();jt.flags|=t,r.memoizedState=Jo(1|e,n,void 0,i===void 0?null:i)}function mu(t,e,n,i){var r=yi();i=i===void 0?null:i;var s=void 0;if(tn!==null){var a=tn.memoizedState;if(s=a.destroy,i!==null&&fp(i,a.deps)){r.memoizedState=Jo(e,n,s,i);return}}jt.flags|=t,r.memoizedState=Jo(1|e,n,s,i)}function t0(t,e){return mc(8390656,8,t,e)}function mp(t,e){return mu(2048,8,t,e)}function _v(t,e){return mu(4,2,t,e)}function vv(t,e){return mu(4,4,t,e)}function xv(t,e){if(typeof e=="function")return t=t(),e(t),function(){e(null)};if(e!=null)return t=t(),e.current=t,function(){e.current=null}}function yv(t,e,n){return n=n!=null?n.concat([t]):null,mu(4,4,xv.bind(null,e,t),n)}function gp(){}function Sv(t,e){var n=yi();e=e===void 0?null:e;var i=n.memoizedState;return i!==null&&e!==null&&fp(e,i[1])?i[0]:(n.memoizedState=[t,e],t)}function Mv(t,e){var n=yi();e=e===void 0?null:e;var i=n.memoizedState;return i!==null&&e!==null&&fp(e,i[1])?i[0]:(t=t(),n.memoizedState=[t,e],t)}function Ev(t,e,n){return Is&21?(Bi(n,e)||(n=C_(),jt.lanes|=n,Us|=n,t.baseState=!0),e):(t.baseState&&(t.baseState=!1,Wn=!0),t.memoizedState=n)}function mM(t,e){var n=At;At=n!==0&&4>n?n:4,t(!0);var i=nd.transition;nd.transition={};try{t(!1),e()}finally{At=n,nd.transition=i}}function wv(){return yi().memoizedState}function gM(t,e,n){var i=ss(t);if(n={lane:i,action:n,hasEagerState:!1,eagerState:null,next:null},Tv(t))bv(e,n);else if(n=av(t,e,n,i),n!==null){var r=In();Oi(n,t,i,r),Av(n,e,i)}}function _M(t,e,n){var i=ss(t),r={lane:i,action:n,hasEagerState:!1,eagerState:null,next:null};if(Tv(t))bv(e,r);else{var s=t.alternate;if(t.lanes===0&&(s===null||s.lanes===0)&&(s=e.lastRenderedReducer,s!==null))try{var a=e.lastRenderedState,o=s(a,n);if(r.hasEagerState=!0,r.eagerState=o,Bi(o,a)){var l=e.interleaved;l===null?(r.next=r,op(e)):(r.next=l.next,l.next=r),e.interleaved=r;return}}catch{}finally{}n=av(t,e,r,i),n!==null&&(r=In(),Oi(n,t,i,r),Av(n,e,i))}}function Tv(t){var e=t.alternate;return t===jt||e!==null&&e===jt}function bv(t,e){No=jc=!0;var n=t.pending;n===null?e.next=e:(e.next=n.next,n.next=e),t.pending=e}function Av(t,e,n){if(n&4194240){var i=e.lanes;i&=t.pendingLanes,n|=i,e.lanes=n,$h(t,n)}}var Wc={readContext:xi,useCallback:yn,useContext:yn,useEffect:yn,useImperativeHandle:yn,useInsertionEffect:yn,useLayoutEffect:yn,useMemo:yn,useReducer:yn,useRef:yn,useState:yn,useDebugValue:yn,useDeferredValue:yn,useTransition:yn,useMutableSource:yn,useSyncExternalStore:yn,useId:yn,unstable_isNewReconciler:!1},vM={readContext:xi,useCallback:function(t,e){return Zi().memoizedState=[t,e===void 0?null:e],t},useContext:xi,useEffect:t0,useImperativeHandle:function(t,e,n){return n=n!=null?n.concat([t]):null,mc(4194308,4,xv.bind(null,e,t),n)},useLayoutEffect:function(t,e){return mc(4194308,4,t,e)},useInsertionEffect:function(t,e){return mc(4,2,t,e)},useMemo:function(t,e){var n=Zi();return e=e===void 0?null:e,t=t(),n.memoizedState=[t,e],t},useReducer:function(t,e,n){var i=Zi();return e=n!==void 0?n(e):e,i.memoizedState=i.baseState=e,t={pending:null,interleaved:null,lanes:0,dispatch:null,lastRenderedReducer:t,lastRenderedState:e},i.queue=t,t=t.dispatch=gM.bind(null,jt,t),[i.memoizedState,t]},useRef:function(t){var e=Zi();return t={current:t},e.memoizedState=t},useState:e0,useDebugValue:gp,useDeferredValue:function(t){return Zi().memoizedState=t},useTransition:function(){var t=e0(!1),e=t[0];return t=mM.bind(null,t[1]),Zi().memoizedState=t,[e,t]},useMutableSource:function(){},useSyncExternalStore:function(t,e,n){var i=jt,r=Zi();if(Ot){if(n===void 0)throw Error(ce(407));n=n()}else{if(n=e(),fn===null)throw Error(ce(349));Is&30||dv(i,e,n)}r.memoizedState=n;var s={value:n,getSnapshot:e};return r.queue=s,t0(hv.bind(null,i,s,t),[t]),i.flags|=2048,Jo(9,fv.bind(null,i,s,n,e),void 0,null),n},useId:function(){var t=Zi(),e=fn.identifierPrefix;if(Ot){var n=Er,i=Mr;n=(i&~(1<<32-Fi(i)-1)).toString(32)+n,e=":"+e+"R"+n,n=Zo++,0<n&&(e+="H"+n.toString(32)),e+=":"}else n=pM++,e=":"+e+"r"+n.toString(32)+":";return t.memoizedState=e},unstable_isNewReconciler:!1},xM={readContext:xi,useCallback:Sv,useContext:xi,useEffect:mp,useImperativeHandle:yv,useInsertionEffect:_v,useLayoutEffect:vv,useMemo:Mv,useReducer:id,useRef:gv,useState:function(){return id(Qo)},useDebugValue:gp,useDeferredValue:function(t){var e=yi();return Ev(e,tn.memoizedState,t)},useTransition:function(){var t=id(Qo)[0],e=yi().memoizedState;return[t,e]},useMutableSource:cv,useSyncExternalStore:uv,useId:wv,unstable_isNewReconciler:!1},yM={readContext:xi,useCallback:Sv,useContext:xi,useEffect:mp,useImperativeHandle:yv,useInsertionEffect:_v,useLayoutEffect:vv,useMemo:Mv,useReducer:rd,useRef:gv,useState:function(){return rd(Qo)},useDebugValue:gp,useDeferredValue:function(t){var e=yi();return tn===null?e.memoizedState=t:Ev(e,tn.memoizedState,t)},useTransition:function(){var t=rd(Qo)[0],e=yi().memoizedState;return[t,e]},useMutableSource:cv,useSyncExternalStore:uv,useId:wv,unstable_isNewReconciler:!1};function Pi(t,e){if(t&&t.defaultProps){e=Xt({},e),t=t.defaultProps;for(var n in t)e[n]===void 0&&(e[n]=t[n]);return e}return e}function Ef(t,e,n,i){e=t.memoizedState,n=n(i,e),n=n==null?e:Xt({},e,n),t.memoizedState=n,t.lanes===0&&(t.updateQueue.baseState=n)}var gu={isMounted:function(t){return(t=t._reactInternals)?Hs(t)===t:!1},enqueueSetState:function(t,e,n){t=t._reactInternals;var i=In(),r=ss(t),s=Tr(i,r);s.payload=e,n!=null&&(s.callback=n),e=is(t,s,r),e!==null&&(Oi(e,t,r,i),hc(e,t,r))},enqueueReplaceState:function(t,e,n){t=t._reactInternals;var i=In(),r=ss(t),s=Tr(i,r);s.tag=1,s.payload=e,n!=null&&(s.callback=n),e=is(t,s,r),e!==null&&(Oi(e,t,r,i),hc(e,t,r))},enqueueForceUpdate:function(t,e){t=t._reactInternals;var n=In(),i=ss(t),r=Tr(n,i);r.tag=2,e!=null&&(r.callback=e),e=is(t,r,i),e!==null&&(Oi(e,t,i,n),hc(e,t,i))}};function n0(t,e,n,i,r,s,a){return t=t.stateNode,typeof t.shouldComponentUpdate=="function"?t.shouldComponentUpdate(i,s,a):e.prototype&&e.prototype.isPureReactComponent?!Wo(n,i)||!Wo(r,s):!0}function Cv(t,e,n){var i=!1,r=ls,s=e.contextType;return typeof s=="object"&&s!==null?s=xi(s):(r=$n(e)?Ls:Cn.current,i=e.contextTypes,s=(i=i!=null)?Ua(t,r):ls),e=new e(n,s),t.memoizedState=e.state!==null&&e.state!==void 0?e.state:null,e.updater=gu,t.stateNode=e,e._reactInternals=t,i&&(t=t.stateNode,t.__reactInternalMemoizedUnmaskedChildContext=r,t.__reactInternalMemoizedMaskedChildContext=s),e}function i0(t,e,n,i){t=e.state,typeof e.componentWillReceiveProps=="function"&&e.componentWillReceiveProps(n,i),typeof e.UNSAFE_componentWillReceiveProps=="function"&&e.UNSAFE_componentWillReceiveProps(n,i),e.state!==t&&gu.enqueueReplaceState(e,e.state,null)}function wf(t,e,n,i){var r=t.stateNode;r.props=n,r.state=t.memoizedState,r.refs={},lp(t);var s=e.contextType;typeof s=="object"&&s!==null?r.context=xi(s):(s=$n(e)?Ls:Cn.current,r.context=Ua(t,s)),r.state=t.memoizedState,s=e.getDerivedStateFromProps,typeof s=="function"&&(Ef(t,e,s,n),r.state=t.memoizedState),typeof e.getDerivedStateFromProps=="function"||typeof r.getSnapshotBeforeUpdate=="function"||typeof r.UNSAFE_componentWillMount!="function"&&typeof r.componentWillMount!="function"||(e=r.state,typeof r.componentWillMount=="function"&&r.componentWillMount(),typeof r.UNSAFE_componentWillMount=="function"&&r.UNSAFE_componentWillMount(),e!==r.state&&gu.enqueueReplaceState(r,r.state,null),Vc(t,n,r,i),r.state=t.memoizedState),typeof r.componentDidMount=="function"&&(t.flags|=4194308)}function Ba(t,e){try{var n="",i=e;do n+=qy(i),i=i.return;while(i);var r=n}catch(s){r=`
Error generating stack: `+s.message+`
`+s.stack}return{value:t,source:e,stack:r,digest:null}}function sd(t,e,n){return{value:t,source:null,stack:n??null,digest:e??null}}function Tf(t,e){try{console.error(e.value)}catch(n){setTimeout(function(){throw n})}}var SM=typeof WeakMap=="function"?WeakMap:Map;function Rv(t,e,n){n=Tr(-1,n),n.tag=3,n.payload={element:null};var i=e.value;return n.callback=function(){$c||($c=!0,Uf=i),Tf(t,e)},n}function Pv(t,e,n){n=Tr(-1,n),n.tag=3;var i=t.type.getDerivedStateFromError;if(typeof i=="function"){var r=e.value;n.payload=function(){return i(r)},n.callback=function(){Tf(t,e)}}var s=t.stateNode;return s!==null&&typeof s.componentDidCatch=="function"&&(n.callback=function(){Tf(t,e),typeof i!="function"&&(rs===null?rs=new Set([this]):rs.add(this));var a=e.stack;this.componentDidCatch(e.value,{componentStack:a!==null?a:""})}),n}function r0(t,e,n){var i=t.pingCache;if(i===null){i=t.pingCache=new SM;var r=new Set;i.set(e,r)}else r=i.get(e),r===void 0&&(r=new Set,i.set(e,r));r.has(n)||(r.add(n),t=UM.bind(null,t,e,n),e.then(t,t))}function s0(t){do{var e;if((e=t.tag===13)&&(e=t.memoizedState,e=e!==null?e.dehydrated!==null:!0),e)return t;t=t.return}while(t!==null);return null}function a0(t,e,n,i,r){return t.mode&1?(t.flags|=65536,t.lanes=r,t):(t===e?t.flags|=65536:(t.flags|=128,n.flags|=131072,n.flags&=-52805,n.tag===1&&(n.alternate===null?n.tag=17:(e=Tr(-1,1),e.tag=2,is(n,e,1))),n.lanes|=1),t)}var MM=Ir.ReactCurrentOwner,Wn=!1;function Ln(t,e,n,i){e.child=t===null?sv(e,null,n,i):Oa(e,t.child,n,i)}function o0(t,e,n,i,r){n=n.render;var s=e.ref;return Ca(e,r),i=hp(t,e,n,i,s,r),n=pp(),t!==null&&!Wn?(e.updateQueue=t.updateQueue,e.flags&=-2053,t.lanes&=~r,Nr(t,e,r)):(Ot&&n&&tp(e),e.flags|=1,Ln(t,e,i,r),e.child)}function l0(t,e,n,i,r){if(t===null){var s=n.type;return typeof s=="function"&&!wp(s)&&s.defaultProps===void 0&&n.compare===null&&n.defaultProps===void 0?(e.tag=15,e.type=s,Nv(t,e,s,i,r)):(t=xc(n.type,null,i,e,e.mode,r),t.ref=e.ref,t.return=e,e.child=t)}if(s=t.child,!(t.lanes&r)){var a=s.memoizedProps;if(n=n.compare,n=n!==null?n:Wo,n(a,i)&&t.ref===e.ref)return Nr(t,e,r)}return e.flags|=1,t=as(s,i),t.ref=e.ref,t.return=e,e.child=t}function Nv(t,e,n,i,r){if(t!==null){var s=t.memoizedProps;if(Wo(s,i)&&t.ref===e.ref)if(Wn=!1,e.pendingProps=i=s,(t.lanes&r)!==0)t.flags&131072&&(Wn=!0);else return e.lanes=t.lanes,Nr(t,e,r)}return bf(t,e,n,i,r)}function Lv(t,e,n){var i=e.pendingProps,r=i.children,s=t!==null?t.memoizedState:null;if(i.mode==="hidden")if(!(e.mode&1))e.memoizedState={baseLanes:0,cachePool:null,transitions:null},Nt(ya,Jn),Jn|=n;else{if(!(n&1073741824))return t=s!==null?s.baseLanes|n:n,e.lanes=e.childLanes=1073741824,e.memoizedState={baseLanes:t,cachePool:null,transitions:null},e.updateQueue=null,Nt(ya,Jn),Jn|=t,null;e.memoizedState={baseLanes:0,cachePool:null,transitions:null},i=s!==null?s.baseLanes:n,Nt(ya,Jn),Jn|=i}else s!==null?(i=s.baseLanes|n,e.memoizedState=null):i=n,Nt(ya,Jn),Jn|=i;return Ln(t,e,r,n),e.child}function Dv(t,e){var n=e.ref;(t===null&&n!==null||t!==null&&t.ref!==n)&&(e.flags|=512,e.flags|=2097152)}function bf(t,e,n,i,r){var s=$n(n)?Ls:Cn.current;return s=Ua(e,s),Ca(e,r),n=hp(t,e,n,i,s,r),i=pp(),t!==null&&!Wn?(e.updateQueue=t.updateQueue,e.flags&=-2053,t.lanes&=~r,Nr(t,e,r)):(Ot&&i&&tp(e),e.flags|=1,Ln(t,e,n,r),e.child)}function c0(t,e,n,i,r){if($n(n)){var s=!0;Oc(e)}else s=!1;if(Ca(e,r),e.stateNode===null)gc(t,e),Cv(e,n,i),wf(e,n,i,r),i=!0;else if(t===null){var a=e.stateNode,o=e.memoizedProps;a.props=o;var l=a.context,c=n.contextType;typeof c=="object"&&c!==null?c=xi(c):(c=$n(n)?Ls:Cn.current,c=Ua(e,c));var h=n.getDerivedStateFromProps,p=typeof h=="function"||typeof a.getSnapshotBeforeUpdate=="function";p||typeof a.UNSAFE_componentWillReceiveProps!="function"&&typeof a.componentWillReceiveProps!="function"||(o!==i||l!==c)&&i0(e,a,i,c),Xr=!1;var f=e.memoizedState;a.state=f,Vc(e,i,a,r),l=e.memoizedState,o!==i||f!==l||Xn.current||Xr?(typeof h=="function"&&(Ef(e,n,h,i),l=e.memoizedState),(o=Xr||n0(e,n,o,i,f,l,c))?(p||typeof a.UNSAFE_componentWillMount!="function"&&typeof a.componentWillMount!="function"||(typeof a.componentWillMount=="function"&&a.componentWillMount(),typeof a.UNSAFE_componentWillMount=="function"&&a.UNSAFE_componentWillMount()),typeof a.componentDidMount=="function"&&(e.flags|=4194308)):(typeof a.componentDidMount=="function"&&(e.flags|=4194308),e.memoizedProps=i,e.memoizedState=l),a.props=i,a.state=l,a.context=c,i=o):(typeof a.componentDidMount=="function"&&(e.flags|=4194308),i=!1)}else{a=e.stateNode,ov(t,e),o=e.memoizedProps,c=e.type===e.elementType?o:Pi(e.type,o),a.props=c,p=e.pendingProps,f=a.context,l=n.contextType,typeof l=="object"&&l!==null?l=xi(l):(l=$n(n)?Ls:Cn.current,l=Ua(e,l));var g=n.getDerivedStateFromProps;(h=typeof g=="function"||typeof a.getSnapshotBeforeUpdate=="function")||typeof a.UNSAFE_componentWillReceiveProps!="function"&&typeof a.componentWillReceiveProps!="function"||(o!==p||f!==l)&&i0(e,a,i,l),Xr=!1,f=e.memoizedState,a.state=f,Vc(e,i,a,r);var v=e.memoizedState;o!==p||f!==v||Xn.current||Xr?(typeof g=="function"&&(Ef(e,n,g,i),v=e.memoizedState),(c=Xr||n0(e,n,c,i,f,v,l)||!1)?(h||typeof a.UNSAFE_componentWillUpdate!="function"&&typeof a.componentWillUpdate!="function"||(typeof a.componentWillUpdate=="function"&&a.componentWillUpdate(i,v,l),typeof a.UNSAFE_componentWillUpdate=="function"&&a.UNSAFE_componentWillUpdate(i,v,l)),typeof a.componentDidUpdate=="function"&&(e.flags|=4),typeof a.getSnapshotBeforeUpdate=="function"&&(e.flags|=1024)):(typeof a.componentDidUpdate!="function"||o===t.memoizedProps&&f===t.memoizedState||(e.flags|=4),typeof a.getSnapshotBeforeUpdate!="function"||o===t.memoizedProps&&f===t.memoizedState||(e.flags|=1024),e.memoizedProps=i,e.memoizedState=v),a.props=i,a.state=v,a.context=l,i=c):(typeof a.componentDidUpdate!="function"||o===t.memoizedProps&&f===t.memoizedState||(e.flags|=4),typeof a.getSnapshotBeforeUpdate!="function"||o===t.memoizedProps&&f===t.memoizedState||(e.flags|=1024),i=!1)}return Af(t,e,n,i,s,r)}function Af(t,e,n,i,r,s){Dv(t,e);var a=(e.flags&128)!==0;if(!i&&!a)return r&&qm(e,n,!1),Nr(t,e,s);i=e.stateNode,MM.current=e;var o=a&&typeof n.getDerivedStateFromError!="function"?null:i.render();return e.flags|=1,t!==null&&a?(e.child=Oa(e,t.child,null,s),e.child=Oa(e,null,o,s)):Ln(t,e,o,s),e.memoizedState=i.state,r&&qm(e,n,!0),e.child}function Iv(t){var e=t.stateNode;e.pendingContext?$m(t,e.pendingContext,e.pendingContext!==e.context):e.context&&$m(t,e.context,!1),cp(t,e.containerInfo)}function u0(t,e,n,i,r){return Fa(),ip(r),e.flags|=256,Ln(t,e,n,i),e.child}var Cf={dehydrated:null,treeContext:null,retryLane:0};function Rf(t){return{baseLanes:t,cachePool:null,transitions:null}}function Uv(t,e,n){var i=e.pendingProps,r=Vt.current,s=!1,a=(e.flags&128)!==0,o;if((o=a)||(o=t!==null&&t.memoizedState===null?!1:(r&2)!==0),o?(s=!0,e.flags&=-129):(t===null||t.memoizedState!==null)&&(r|=1),Nt(Vt,r&1),t===null)return Sf(e),t=e.memoizedState,t!==null&&(t=t.dehydrated,t!==null)?(e.mode&1?t.data==="$!"?e.lanes=8:e.lanes=1073741824:e.lanes=1,null):(a=i.children,t=i.fallback,s?(i=e.mode,s=e.child,a={mode:"hidden",children:a},!(i&1)&&s!==null?(s.childLanes=0,s.pendingProps=a):s=xu(a,i,0,null),t=Ns(t,i,n,null),s.return=e,t.return=e,s.sibling=t,e.child=s,e.child.memoizedState=Rf(n),e.memoizedState=Cf,t):_p(e,a));if(r=t.memoizedState,r!==null&&(o=r.dehydrated,o!==null))return EM(t,e,a,i,o,r,n);if(s){s=i.fallback,a=e.mode,r=t.child,o=r.sibling;var l={mode:"hidden",children:i.children};return!(a&1)&&e.child!==r?(i=e.child,i.childLanes=0,i.pendingProps=l,e.deletions=null):(i=as(r,l),i.subtreeFlags=r.subtreeFlags&14680064),o!==null?s=as(o,s):(s=Ns(s,a,n,null),s.flags|=2),s.return=e,i.return=e,i.sibling=s,e.child=i,i=s,s=e.child,a=t.child.memoizedState,a=a===null?Rf(n):{baseLanes:a.baseLanes|n,cachePool:null,transitions:a.transitions},s.memoizedState=a,s.childLanes=t.childLanes&~n,e.memoizedState=Cf,i}return s=t.child,t=s.sibling,i=as(s,{mode:"visible",children:i.children}),!(e.mode&1)&&(i.lanes=n),i.return=e,i.sibling=null,t!==null&&(n=e.deletions,n===null?(e.deletions=[t],e.flags|=16):n.push(t)),e.child=i,e.memoizedState=null,i}function _p(t,e){return e=xu({mode:"visible",children:e},t.mode,0,null),e.return=t,t.child=e}function Rl(t,e,n,i){return i!==null&&ip(i),Oa(e,t.child,null,n),t=_p(e,e.pendingProps.children),t.flags|=2,e.memoizedState=null,t}function EM(t,e,n,i,r,s,a){if(n)return e.flags&256?(e.flags&=-257,i=sd(Error(ce(422))),Rl(t,e,a,i)):e.memoizedState!==null?(e.child=t.child,e.flags|=128,null):(s=i.fallback,r=e.mode,i=xu({mode:"visible",children:i.children},r,0,null),s=Ns(s,r,a,null),s.flags|=2,i.return=e,s.return=e,i.sibling=s,e.child=i,e.mode&1&&Oa(e,t.child,null,a),e.child.memoizedState=Rf(a),e.memoizedState=Cf,s);if(!(e.mode&1))return Rl(t,e,a,null);if(r.data==="$!"){if(i=r.nextSibling&&r.nextSibling.dataset,i)var o=i.dgst;return i=o,s=Error(ce(419)),i=sd(s,i,void 0),Rl(t,e,a,i)}if(o=(a&t.childLanes)!==0,Wn||o){if(i=fn,i!==null){switch(a&-a){case 4:r=2;break;case 16:r=8;break;case 64:case 128:case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:case 4194304:case 8388608:case 16777216:case 33554432:case 67108864:r=32;break;case 536870912:r=268435456;break;default:r=0}r=r&(i.suspendedLanes|a)?0:r,r!==0&&r!==s.retryLane&&(s.retryLane=r,Pr(t,r),Oi(i,t,r,-1))}return Ep(),i=sd(Error(ce(421))),Rl(t,e,a,i)}return r.data==="$?"?(e.flags|=128,e.child=t.child,e=FM.bind(null,t),r._reactRetry=e,null):(t=s.treeContext,ii=ns(r.nextSibling),si=e,Ot=!0,Li=null,t!==null&&(hi[pi++]=Mr,hi[pi++]=Er,hi[pi++]=Ds,Mr=t.id,Er=t.overflow,Ds=e),e=_p(e,i.children),e.flags|=4096,e)}function d0(t,e,n){t.lanes|=e;var i=t.alternate;i!==null&&(i.lanes|=e),Mf(t.return,e,n)}function ad(t,e,n,i,r){var s=t.memoizedState;s===null?t.memoizedState={isBackwards:e,rendering:null,renderingStartTime:0,last:i,tail:n,tailMode:r}:(s.isBackwards=e,s.rendering=null,s.renderingStartTime=0,s.last=i,s.tail=n,s.tailMode=r)}function Fv(t,e,n){var i=e.pendingProps,r=i.revealOrder,s=i.tail;if(Ln(t,e,i.children,n),i=Vt.current,i&2)i=i&1|2,e.flags|=128;else{if(t!==null&&t.flags&128)e:for(t=e.child;t!==null;){if(t.tag===13)t.memoizedState!==null&&d0(t,n,e);else if(t.tag===19)d0(t,n,e);else if(t.child!==null){t.child.return=t,t=t.child;continue}if(t===e)break e;for(;t.sibling===null;){if(t.return===null||t.return===e)break e;t=t.return}t.sibling.return=t.return,t=t.sibling}i&=1}if(Nt(Vt,i),!(e.mode&1))e.memoizedState=null;else switch(r){case"forwards":for(n=e.child,r=null;n!==null;)t=n.alternate,t!==null&&Gc(t)===null&&(r=n),n=n.sibling;n=r,n===null?(r=e.child,e.child=null):(r=n.sibling,n.sibling=null),ad(e,!1,r,n,s);break;case"backwards":for(n=null,r=e.child,e.child=null;r!==null;){if(t=r.alternate,t!==null&&Gc(t)===null){e.child=r;break}t=r.sibling,r.sibling=n,n=r,r=t}ad(e,!0,n,null,s);break;case"together":ad(e,!1,null,null,void 0);break;default:e.memoizedState=null}return e.child}function gc(t,e){!(e.mode&1)&&t!==null&&(t.alternate=null,e.alternate=null,e.flags|=2)}function Nr(t,e,n){if(t!==null&&(e.dependencies=t.dependencies),Us|=e.lanes,!(n&e.childLanes))return null;if(t!==null&&e.child!==t.child)throw Error(ce(153));if(e.child!==null){for(t=e.child,n=as(t,t.pendingProps),e.child=n,n.return=e;t.sibling!==null;)t=t.sibling,n=n.sibling=as(t,t.pendingProps),n.return=e;n.sibling=null}return e.child}function wM(t,e,n){switch(e.tag){case 3:Iv(e),Fa();break;case 5:lv(e);break;case 1:$n(e.type)&&Oc(e);break;case 4:cp(e,e.stateNode.containerInfo);break;case 10:var i=e.type._context,r=e.memoizedProps.value;Nt(zc,i._currentValue),i._currentValue=r;break;case 13:if(i=e.memoizedState,i!==null)return i.dehydrated!==null?(Nt(Vt,Vt.current&1),e.flags|=128,null):n&e.child.childLanes?Uv(t,e,n):(Nt(Vt,Vt.current&1),t=Nr(t,e,n),t!==null?t.sibling:null);Nt(Vt,Vt.current&1);break;case 19:if(i=(n&e.childLanes)!==0,t.flags&128){if(i)return Fv(t,e,n);e.flags|=128}if(r=e.memoizedState,r!==null&&(r.rendering=null,r.tail=null,r.lastEffect=null),Nt(Vt,Vt.current),i)break;return null;case 22:case 23:return e.lanes=0,Lv(t,e,n)}return Nr(t,e,n)}var Ov,Pf,kv,Bv;Ov=function(t,e){for(var n=e.child;n!==null;){if(n.tag===5||n.tag===6)t.appendChild(n.stateNode);else if(n.tag!==4&&n.child!==null){n.child.return=n,n=n.child;continue}if(n===e)break;for(;n.sibling===null;){if(n.return===null||n.return===e)return;n=n.return}n.sibling.return=n.return,n=n.sibling}};Pf=function(){};kv=function(t,e,n,i){var r=t.memoizedProps;if(r!==i){t=e.stateNode,As(sr.current);var s=null;switch(n){case"input":r=Zd(t,r),i=Zd(t,i),s=[];break;case"select":r=Xt({},r,{value:void 0}),i=Xt({},i,{value:void 0}),s=[];break;case"textarea":r=ef(t,r),i=ef(t,i),s=[];break;default:typeof r.onClick!="function"&&typeof i.onClick=="function"&&(t.onclick=Uc)}nf(n,i);var a;n=null;for(c in r)if(!i.hasOwnProperty(c)&&r.hasOwnProperty(c)&&r[c]!=null)if(c==="style"){var o=r[c];for(a in o)o.hasOwnProperty(a)&&(n||(n={}),n[a]="")}else c!=="dangerouslySetInnerHTML"&&c!=="children"&&c!=="suppressContentEditableWarning"&&c!=="suppressHydrationWarning"&&c!=="autoFocus"&&(ko.hasOwnProperty(c)?s||(s=[]):(s=s||[]).push(c,null));for(c in i){var l=i[c];if(o=r!=null?r[c]:void 0,i.hasOwnProperty(c)&&l!==o&&(l!=null||o!=null))if(c==="style")if(o){for(a in o)!o.hasOwnProperty(a)||l&&l.hasOwnProperty(a)||(n||(n={}),n[a]="");for(a in l)l.hasOwnProperty(a)&&o[a]!==l[a]&&(n||(n={}),n[a]=l[a])}else n||(s||(s=[]),s.push(c,n)),n=l;else c==="dangerouslySetInnerHTML"?(l=l?l.__html:void 0,o=o?o.__html:void 0,l!=null&&o!==l&&(s=s||[]).push(c,l)):c==="children"?typeof l!="string"&&typeof l!="number"||(s=s||[]).push(c,""+l):c!=="suppressContentEditableWarning"&&c!=="suppressHydrationWarning"&&(ko.hasOwnProperty(c)?(l!=null&&c==="onScroll"&&Dt("scroll",t),s||o===l||(s=[])):(s=s||[]).push(c,l))}n&&(s=s||[]).push("style",n);var c=s;(e.updateQueue=c)&&(e.flags|=4)}};Bv=function(t,e,n,i){n!==i&&(e.flags|=4)};function lo(t,e){if(!Ot)switch(t.tailMode){case"hidden":e=t.tail;for(var n=null;e!==null;)e.alternate!==null&&(n=e),e=e.sibling;n===null?t.tail=null:n.sibling=null;break;case"collapsed":n=t.tail;for(var i=null;n!==null;)n.alternate!==null&&(i=n),n=n.sibling;i===null?e||t.tail===null?t.tail=null:t.tail.sibling=null:i.sibling=null}}function Sn(t){var e=t.alternate!==null&&t.alternate.child===t.child,n=0,i=0;if(e)for(var r=t.child;r!==null;)n|=r.lanes|r.childLanes,i|=r.subtreeFlags&14680064,i|=r.flags&14680064,r.return=t,r=r.sibling;else for(r=t.child;r!==null;)n|=r.lanes|r.childLanes,i|=r.subtreeFlags,i|=r.flags,r.return=t,r=r.sibling;return t.subtreeFlags|=i,t.childLanes=n,e}function TM(t,e,n){var i=e.pendingProps;switch(np(e),e.tag){case 2:case 16:case 15:case 0:case 11:case 7:case 8:case 12:case 9:case 14:return Sn(e),null;case 1:return $n(e.type)&&Fc(),Sn(e),null;case 3:return i=e.stateNode,ka(),Ut(Xn),Ut(Cn),dp(),i.pendingContext&&(i.context=i.pendingContext,i.pendingContext=null),(t===null||t.child===null)&&(Al(e)?e.flags|=4:t===null||t.memoizedState.isDehydrated&&!(e.flags&256)||(e.flags|=1024,Li!==null&&(kf(Li),Li=null))),Pf(t,e),Sn(e),null;case 5:up(e);var r=As(Ko.current);if(n=e.type,t!==null&&e.stateNode!=null)kv(t,e,n,i,r),t.ref!==e.ref&&(e.flags|=512,e.flags|=2097152);else{if(!i){if(e.stateNode===null)throw Error(ce(166));return Sn(e),null}if(t=As(sr.current),Al(e)){i=e.stateNode,n=e.type;var s=e.memoizedProps;switch(i[er]=e,i[qo]=s,t=(e.mode&1)!==0,n){case"dialog":Dt("cancel",i),Dt("close",i);break;case"iframe":case"object":case"embed":Dt("load",i);break;case"video":case"audio":for(r=0;r<Mo.length;r++)Dt(Mo[r],i);break;case"source":Dt("error",i);break;case"img":case"image":case"link":Dt("error",i),Dt("load",i);break;case"details":Dt("toggle",i);break;case"input":ym(i,s),Dt("invalid",i);break;case"select":i._wrapperState={wasMultiple:!!s.multiple},Dt("invalid",i);break;case"textarea":Mm(i,s),Dt("invalid",i)}nf(n,s),r=null;for(var a in s)if(s.hasOwnProperty(a)){var o=s[a];a==="children"?typeof o=="string"?i.textContent!==o&&(s.suppressHydrationWarning!==!0&&bl(i.textContent,o,t),r=["children",o]):typeof o=="number"&&i.textContent!==""+o&&(s.suppressHydrationWarning!==!0&&bl(i.textContent,o,t),r=["children",""+o]):ko.hasOwnProperty(a)&&o!=null&&a==="onScroll"&&Dt("scroll",i)}switch(n){case"input":vl(i),Sm(i,s,!0);break;case"textarea":vl(i),Em(i);break;case"select":case"option":break;default:typeof s.onClick=="function"&&(i.onclick=Uc)}i=r,e.updateQueue=i,i!==null&&(e.flags|=4)}else{a=r.nodeType===9?r:r.ownerDocument,t==="http://www.w3.org/1999/xhtml"&&(t=h_(n)),t==="http://www.w3.org/1999/xhtml"?n==="script"?(t=a.createElement("div"),t.innerHTML="<script><\/script>",t=t.removeChild(t.firstChild)):typeof i.is=="string"?t=a.createElement(n,{is:i.is}):(t=a.createElement(n),n==="select"&&(a=t,i.multiple?a.multiple=!0:i.size&&(a.size=i.size))):t=a.createElementNS(t,n),t[er]=e,t[qo]=i,Ov(t,e,!1,!1),e.stateNode=t;e:{switch(a=rf(n,i),n){case"dialog":Dt("cancel",t),Dt("close",t),r=i;break;case"iframe":case"object":case"embed":Dt("load",t),r=i;break;case"video":case"audio":for(r=0;r<Mo.length;r++)Dt(Mo[r],t);r=i;break;case"source":Dt("error",t),r=i;break;case"img":case"image":case"link":Dt("error",t),Dt("load",t),r=i;break;case"details":Dt("toggle",t),r=i;break;case"input":ym(t,i),r=Zd(t,i),Dt("invalid",t);break;case"option":r=i;break;case"select":t._wrapperState={wasMultiple:!!i.multiple},r=Xt({},i,{value:void 0}),Dt("invalid",t);break;case"textarea":Mm(t,i),r=ef(t,i),Dt("invalid",t);break;default:r=i}nf(n,r),o=r;for(s in o)if(o.hasOwnProperty(s)){var l=o[s];s==="style"?g_(t,l):s==="dangerouslySetInnerHTML"?(l=l?l.__html:void 0,l!=null&&p_(t,l)):s==="children"?typeof l=="string"?(n!=="textarea"||l!=="")&&Bo(t,l):typeof l=="number"&&Bo(t,""+l):s!=="suppressContentEditableWarning"&&s!=="suppressHydrationWarning"&&s!=="autoFocus"&&(ko.hasOwnProperty(s)?l!=null&&s==="onScroll"&&Dt("scroll",t):l!=null&&Hh(t,s,l,a))}switch(n){case"input":vl(t),Sm(t,i,!1);break;case"textarea":vl(t),Em(t);break;case"option":i.value!=null&&t.setAttribute("value",""+os(i.value));break;case"select":t.multiple=!!i.multiple,s=i.value,s!=null?wa(t,!!i.multiple,s,!1):i.defaultValue!=null&&wa(t,!!i.multiple,i.defaultValue,!0);break;default:typeof r.onClick=="function"&&(t.onclick=Uc)}switch(n){case"button":case"input":case"select":case"textarea":i=!!i.autoFocus;break e;case"img":i=!0;break e;default:i=!1}}i&&(e.flags|=4)}e.ref!==null&&(e.flags|=512,e.flags|=2097152)}return Sn(e),null;case 6:if(t&&e.stateNode!=null)Bv(t,e,t.memoizedProps,i);else{if(typeof i!="string"&&e.stateNode===null)throw Error(ce(166));if(n=As(Ko.current),As(sr.current),Al(e)){if(i=e.stateNode,n=e.memoizedProps,i[er]=e,(s=i.nodeValue!==n)&&(t=si,t!==null))switch(t.tag){case 3:bl(i.nodeValue,n,(t.mode&1)!==0);break;case 5:t.memoizedProps.suppressHydrationWarning!==!0&&bl(i.nodeValue,n,(t.mode&1)!==0)}s&&(e.flags|=4)}else i=(n.nodeType===9?n:n.ownerDocument).createTextNode(i),i[er]=e,e.stateNode=i}return Sn(e),null;case 13:if(Ut(Vt),i=e.memoizedState,t===null||t.memoizedState!==null&&t.memoizedState.dehydrated!==null){if(Ot&&ii!==null&&e.mode&1&&!(e.flags&128))iv(),Fa(),e.flags|=98560,s=!1;else if(s=Al(e),i!==null&&i.dehydrated!==null){if(t===null){if(!s)throw Error(ce(318));if(s=e.memoizedState,s=s!==null?s.dehydrated:null,!s)throw Error(ce(317));s[er]=e}else Fa(),!(e.flags&128)&&(e.memoizedState=null),e.flags|=4;Sn(e),s=!1}else Li!==null&&(kf(Li),Li=null),s=!0;if(!s)return e.flags&65536?e:null}return e.flags&128?(e.lanes=n,e):(i=i!==null,i!==(t!==null&&t.memoizedState!==null)&&i&&(e.child.flags|=8192,e.mode&1&&(t===null||Vt.current&1?rn===0&&(rn=3):Ep())),e.updateQueue!==null&&(e.flags|=4),Sn(e),null);case 4:return ka(),Pf(t,e),t===null&&Xo(e.stateNode.containerInfo),Sn(e),null;case 10:return ap(e.type._context),Sn(e),null;case 17:return $n(e.type)&&Fc(),Sn(e),null;case 19:if(Ut(Vt),s=e.memoizedState,s===null)return Sn(e),null;if(i=(e.flags&128)!==0,a=s.rendering,a===null)if(i)lo(s,!1);else{if(rn!==0||t!==null&&t.flags&128)for(t=e.child;t!==null;){if(a=Gc(t),a!==null){for(e.flags|=128,lo(s,!1),i=a.updateQueue,i!==null&&(e.updateQueue=i,e.flags|=4),e.subtreeFlags=0,i=n,n=e.child;n!==null;)s=n,t=i,s.flags&=14680066,a=s.alternate,a===null?(s.childLanes=0,s.lanes=t,s.child=null,s.subtreeFlags=0,s.memoizedProps=null,s.memoizedState=null,s.updateQueue=null,s.dependencies=null,s.stateNode=null):(s.childLanes=a.childLanes,s.lanes=a.lanes,s.child=a.child,s.subtreeFlags=0,s.deletions=null,s.memoizedProps=a.memoizedProps,s.memoizedState=a.memoizedState,s.updateQueue=a.updateQueue,s.type=a.type,t=a.dependencies,s.dependencies=t===null?null:{lanes:t.lanes,firstContext:t.firstContext}),n=n.sibling;return Nt(Vt,Vt.current&1|2),e.child}t=t.sibling}s.tail!==null&&Zt()>za&&(e.flags|=128,i=!0,lo(s,!1),e.lanes=4194304)}else{if(!i)if(t=Gc(a),t!==null){if(e.flags|=128,i=!0,n=t.updateQueue,n!==null&&(e.updateQueue=n,e.flags|=4),lo(s,!0),s.tail===null&&s.tailMode==="hidden"&&!a.alternate&&!Ot)return Sn(e),null}else 2*Zt()-s.renderingStartTime>za&&n!==1073741824&&(e.flags|=128,i=!0,lo(s,!1),e.lanes=4194304);s.isBackwards?(a.sibling=e.child,e.child=a):(n=s.last,n!==null?n.sibling=a:e.child=a,s.last=a)}return s.tail!==null?(e=s.tail,s.rendering=e,s.tail=e.sibling,s.renderingStartTime=Zt(),e.sibling=null,n=Vt.current,Nt(Vt,i?n&1|2:n&1),e):(Sn(e),null);case 22:case 23:return Mp(),i=e.memoizedState!==null,t!==null&&t.memoizedState!==null!==i&&(e.flags|=8192),i&&e.mode&1?Jn&1073741824&&(Sn(e),e.subtreeFlags&6&&(e.flags|=8192)):Sn(e),null;case 24:return null;case 25:return null}throw Error(ce(156,e.tag))}function bM(t,e){switch(np(e),e.tag){case 1:return $n(e.type)&&Fc(),t=e.flags,t&65536?(e.flags=t&-65537|128,e):null;case 3:return ka(),Ut(Xn),Ut(Cn),dp(),t=e.flags,t&65536&&!(t&128)?(e.flags=t&-65537|128,e):null;case 5:return up(e),null;case 13:if(Ut(Vt),t=e.memoizedState,t!==null&&t.dehydrated!==null){if(e.alternate===null)throw Error(ce(340));Fa()}return t=e.flags,t&65536?(e.flags=t&-65537|128,e):null;case 19:return Ut(Vt),null;case 4:return ka(),null;case 10:return ap(e.type._context),null;case 22:case 23:return Mp(),null;case 24:return null;default:return null}}var Pl=!1,Tn=!1,AM=typeof WeakSet=="function"?WeakSet:Set,De=null;function xa(t,e){var n=t.ref;if(n!==null)if(typeof n=="function")try{n(null)}catch(i){qt(t,e,i)}else n.current=null}function Nf(t,e,n){try{n()}catch(i){qt(t,e,i)}}var f0=!1;function CM(t,e){if(pf=Lc,t=j_(),ep(t)){if("selectionStart"in t)var n={start:t.selectionStart,end:t.selectionEnd};else e:{n=(n=t.ownerDocument)&&n.defaultView||window;var i=n.getSelection&&n.getSelection();if(i&&i.rangeCount!==0){n=i.anchorNode;var r=i.anchorOffset,s=i.focusNode;i=i.focusOffset;try{n.nodeType,s.nodeType}catch{n=null;break e}var a=0,o=-1,l=-1,c=0,h=0,p=t,f=null;t:for(;;){for(var g;p!==n||r!==0&&p.nodeType!==3||(o=a+r),p!==s||i!==0&&p.nodeType!==3||(l=a+i),p.nodeType===3&&(a+=p.nodeValue.length),(g=p.firstChild)!==null;)f=p,p=g;for(;;){if(p===t)break t;if(f===n&&++c===r&&(o=a),f===s&&++h===i&&(l=a),(g=p.nextSibling)!==null)break;p=f,f=p.parentNode}p=g}n=o===-1||l===-1?null:{start:o,end:l}}else n=null}n=n||{start:0,end:0}}else n=null;for(mf={focusedElem:t,selectionRange:n},Lc=!1,De=e;De!==null;)if(e=De,t=e.child,(e.subtreeFlags&1028)!==0&&t!==null)t.return=e,De=t;else for(;De!==null;){e=De;try{var v=e.alternate;if(e.flags&1024)switch(e.tag){case 0:case 11:case 15:break;case 1:if(v!==null){var S=v.memoizedProps,_=v.memoizedState,d=e.stateNode,m=d.getSnapshotBeforeUpdate(e.elementType===e.type?S:Pi(e.type,S),_);d.__reactInternalSnapshotBeforeUpdate=m}break;case 3:var M=e.stateNode.containerInfo;M.nodeType===1?M.textContent="":M.nodeType===9&&M.documentElement&&M.removeChild(M.documentElement);break;case 5:case 6:case 4:case 17:break;default:throw Error(ce(163))}}catch(y){qt(e,e.return,y)}if(t=e.sibling,t!==null){t.return=e.return,De=t;break}De=e.return}return v=f0,f0=!1,v}function Lo(t,e,n){var i=e.updateQueue;if(i=i!==null?i.lastEffect:null,i!==null){var r=i=i.next;do{if((r.tag&t)===t){var s=r.destroy;r.destroy=void 0,s!==void 0&&Nf(e,n,s)}r=r.next}while(r!==i)}}function _u(t,e){if(e=e.updateQueue,e=e!==null?e.lastEffect:null,e!==null){var n=e=e.next;do{if((n.tag&t)===t){var i=n.create;n.destroy=i()}n=n.next}while(n!==e)}}function Lf(t){var e=t.ref;if(e!==null){var n=t.stateNode;switch(t.tag){case 5:t=n;break;default:t=n}typeof e=="function"?e(t):e.current=t}}function zv(t){var e=t.alternate;e!==null&&(t.alternate=null,zv(e)),t.child=null,t.deletions=null,t.sibling=null,t.tag===5&&(e=t.stateNode,e!==null&&(delete e[er],delete e[qo],delete e[vf],delete e[uM],delete e[dM])),t.stateNode=null,t.return=null,t.dependencies=null,t.memoizedProps=null,t.memoizedState=null,t.pendingProps=null,t.stateNode=null,t.updateQueue=null}function Hv(t){return t.tag===5||t.tag===3||t.tag===4}function h0(t){e:for(;;){for(;t.sibling===null;){if(t.return===null||Hv(t.return))return null;t=t.return}for(t.sibling.return=t.return,t=t.sibling;t.tag!==5&&t.tag!==6&&t.tag!==18;){if(t.flags&2||t.child===null||t.tag===4)continue e;t.child.return=t,t=t.child}if(!(t.flags&2))return t.stateNode}}function Df(t,e,n){var i=t.tag;if(i===5||i===6)t=t.stateNode,e?n.nodeType===8?n.parentNode.insertBefore(t,e):n.insertBefore(t,e):(n.nodeType===8?(e=n.parentNode,e.insertBefore(t,n)):(e=n,e.appendChild(t)),n=n._reactRootContainer,n!=null||e.onclick!==null||(e.onclick=Uc));else if(i!==4&&(t=t.child,t!==null))for(Df(t,e,n),t=t.sibling;t!==null;)Df(t,e,n),t=t.sibling}function If(t,e,n){var i=t.tag;if(i===5||i===6)t=t.stateNode,e?n.insertBefore(t,e):n.appendChild(t);else if(i!==4&&(t=t.child,t!==null))for(If(t,e,n),t=t.sibling;t!==null;)If(t,e,n),t=t.sibling}var mn=null,Ni=!1;function Br(t,e,n){for(n=n.child;n!==null;)Vv(t,e,n),n=n.sibling}function Vv(t,e,n){if(rr&&typeof rr.onCommitFiberUnmount=="function")try{rr.onCommitFiberUnmount(cu,n)}catch{}switch(n.tag){case 5:Tn||xa(n,e);case 6:var i=mn,r=Ni;mn=null,Br(t,e,n),mn=i,Ni=r,mn!==null&&(Ni?(t=mn,n=n.stateNode,t.nodeType===8?t.parentNode.removeChild(n):t.removeChild(n)):mn.removeChild(n.stateNode));break;case 18:mn!==null&&(Ni?(t=mn,n=n.stateNode,t.nodeType===8?Ju(t.parentNode,n):t.nodeType===1&&Ju(t,n),Go(t)):Ju(mn,n.stateNode));break;case 4:i=mn,r=Ni,mn=n.stateNode.containerInfo,Ni=!0,Br(t,e,n),mn=i,Ni=r;break;case 0:case 11:case 14:case 15:if(!Tn&&(i=n.updateQueue,i!==null&&(i=i.lastEffect,i!==null))){r=i=i.next;do{var s=r,a=s.destroy;s=s.tag,a!==void 0&&(s&2||s&4)&&Nf(n,e,a),r=r.next}while(r!==i)}Br(t,e,n);break;case 1:if(!Tn&&(xa(n,e),i=n.stateNode,typeof i.componentWillUnmount=="function"))try{i.props=n.memoizedProps,i.state=n.memoizedState,i.componentWillUnmount()}catch(o){qt(n,e,o)}Br(t,e,n);break;case 21:Br(t,e,n);break;case 22:n.mode&1?(Tn=(i=Tn)||n.memoizedState!==null,Br(t,e,n),Tn=i):Br(t,e,n);break;default:Br(t,e,n)}}function p0(t){var e=t.updateQueue;if(e!==null){t.updateQueue=null;var n=t.stateNode;n===null&&(n=t.stateNode=new AM),e.forEach(function(i){var r=OM.bind(null,t,i);n.has(i)||(n.add(i),i.then(r,r))})}}function bi(t,e){var n=e.deletions;if(n!==null)for(var i=0;i<n.length;i++){var r=n[i];try{var s=t,a=e,o=a;e:for(;o!==null;){switch(o.tag){case 5:mn=o.stateNode,Ni=!1;break e;case 3:mn=o.stateNode.containerInfo,Ni=!0;break e;case 4:mn=o.stateNode.containerInfo,Ni=!0;break e}o=o.return}if(mn===null)throw Error(ce(160));Vv(s,a,r),mn=null,Ni=!1;var l=r.alternate;l!==null&&(l.return=null),r.return=null}catch(c){qt(r,e,c)}}if(e.subtreeFlags&12854)for(e=e.child;e!==null;)Gv(e,t),e=e.sibling}function Gv(t,e){var n=t.alternate,i=t.flags;switch(t.tag){case 0:case 11:case 14:case 15:if(bi(e,t),qi(t),i&4){try{Lo(3,t,t.return),_u(3,t)}catch(S){qt(t,t.return,S)}try{Lo(5,t,t.return)}catch(S){qt(t,t.return,S)}}break;case 1:bi(e,t),qi(t),i&512&&n!==null&&xa(n,n.return);break;case 5:if(bi(e,t),qi(t),i&512&&n!==null&&xa(n,n.return),t.flags&32){var r=t.stateNode;try{Bo(r,"")}catch(S){qt(t,t.return,S)}}if(i&4&&(r=t.stateNode,r!=null)){var s=t.memoizedProps,a=n!==null?n.memoizedProps:s,o=t.type,l=t.updateQueue;if(t.updateQueue=null,l!==null)try{o==="input"&&s.type==="radio"&&s.name!=null&&d_(r,s),rf(o,a);var c=rf(o,s);for(a=0;a<l.length;a+=2){var h=l[a],p=l[a+1];h==="style"?g_(r,p):h==="dangerouslySetInnerHTML"?p_(r,p):h==="children"?Bo(r,p):Hh(r,h,p,c)}switch(o){case"input":Qd(r,s);break;case"textarea":f_(r,s);break;case"select":var f=r._wrapperState.wasMultiple;r._wrapperState.wasMultiple=!!s.multiple;var g=s.value;g!=null?wa(r,!!s.multiple,g,!1):f!==!!s.multiple&&(s.defaultValue!=null?wa(r,!!s.multiple,s.defaultValue,!0):wa(r,!!s.multiple,s.multiple?[]:"",!1))}r[qo]=s}catch(S){qt(t,t.return,S)}}break;case 6:if(bi(e,t),qi(t),i&4){if(t.stateNode===null)throw Error(ce(162));r=t.stateNode,s=t.memoizedProps;try{r.nodeValue=s}catch(S){qt(t,t.return,S)}}break;case 3:if(bi(e,t),qi(t),i&4&&n!==null&&n.memoizedState.isDehydrated)try{Go(e.containerInfo)}catch(S){qt(t,t.return,S)}break;case 4:bi(e,t),qi(t);break;case 13:bi(e,t),qi(t),r=t.child,r.flags&8192&&(s=r.memoizedState!==null,r.stateNode.isHidden=s,!s||r.alternate!==null&&r.alternate.memoizedState!==null||(yp=Zt())),i&4&&p0(t);break;case 22:if(h=n!==null&&n.memoizedState!==null,t.mode&1?(Tn=(c=Tn)||h,bi(e,t),Tn=c):bi(e,t),qi(t),i&8192){if(c=t.memoizedState!==null,(t.stateNode.isHidden=c)&&!h&&t.mode&1)for(De=t,h=t.child;h!==null;){for(p=De=h;De!==null;){switch(f=De,g=f.child,f.tag){case 0:case 11:case 14:case 15:Lo(4,f,f.return);break;case 1:xa(f,f.return);var v=f.stateNode;if(typeof v.componentWillUnmount=="function"){i=f,n=f.return;try{e=i,v.props=e.memoizedProps,v.state=e.memoizedState,v.componentWillUnmount()}catch(S){qt(i,n,S)}}break;case 5:xa(f,f.return);break;case 22:if(f.memoizedState!==null){g0(p);continue}}g!==null?(g.return=f,De=g):g0(p)}h=h.sibling}e:for(h=null,p=t;;){if(p.tag===5){if(h===null){h=p;try{r=p.stateNode,c?(s=r.style,typeof s.setProperty=="function"?s.setProperty("display","none","important"):s.display="none"):(o=p.stateNode,l=p.memoizedProps.style,a=l!=null&&l.hasOwnProperty("display")?l.display:null,o.style.display=m_("display",a))}catch(S){qt(t,t.return,S)}}}else if(p.tag===6){if(h===null)try{p.stateNode.nodeValue=c?"":p.memoizedProps}catch(S){qt(t,t.return,S)}}else if((p.tag!==22&&p.tag!==23||p.memoizedState===null||p===t)&&p.child!==null){p.child.return=p,p=p.child;continue}if(p===t)break e;for(;p.sibling===null;){if(p.return===null||p.return===t)break e;h===p&&(h=null),p=p.return}h===p&&(h=null),p.sibling.return=p.return,p=p.sibling}}break;case 19:bi(e,t),qi(t),i&4&&p0(t);break;case 21:break;default:bi(e,t),qi(t)}}function qi(t){var e=t.flags;if(e&2){try{e:{for(var n=t.return;n!==null;){if(Hv(n)){var i=n;break e}n=n.return}throw Error(ce(160))}switch(i.tag){case 5:var r=i.stateNode;i.flags&32&&(Bo(r,""),i.flags&=-33);var s=h0(t);If(t,s,r);break;case 3:case 4:var a=i.stateNode.containerInfo,o=h0(t);Df(t,o,a);break;default:throw Error(ce(161))}}catch(l){qt(t,t.return,l)}t.flags&=-3}e&4096&&(t.flags&=-4097)}function RM(t,e,n){De=t,jv(t)}function jv(t,e,n){for(var i=(t.mode&1)!==0;De!==null;){var r=De,s=r.child;if(r.tag===22&&i){var a=r.memoizedState!==null||Pl;if(!a){var o=r.alternate,l=o!==null&&o.memoizedState!==null||Tn;o=Pl;var c=Tn;if(Pl=a,(Tn=l)&&!c)for(De=r;De!==null;)a=De,l=a.child,a.tag===22&&a.memoizedState!==null?_0(r):l!==null?(l.return=a,De=l):_0(r);for(;s!==null;)De=s,jv(s),s=s.sibling;De=r,Pl=o,Tn=c}m0(t)}else r.subtreeFlags&8772&&s!==null?(s.return=r,De=s):m0(t)}}function m0(t){for(;De!==null;){var e=De;if(e.flags&8772){var n=e.alternate;try{if(e.flags&8772)switch(e.tag){case 0:case 11:case 15:Tn||_u(5,e);break;case 1:var i=e.stateNode;if(e.flags&4&&!Tn)if(n===null)i.componentDidMount();else{var r=e.elementType===e.type?n.memoizedProps:Pi(e.type,n.memoizedProps);i.componentDidUpdate(r,n.memoizedState,i.__reactInternalSnapshotBeforeUpdate)}var s=e.updateQueue;s!==null&&Jm(e,s,i);break;case 3:var a=e.updateQueue;if(a!==null){if(n=null,e.child!==null)switch(e.child.tag){case 5:n=e.child.stateNode;break;case 1:n=e.child.stateNode}Jm(e,a,n)}break;case 5:var o=e.stateNode;if(n===null&&e.flags&4){n=o;var l=e.memoizedProps;switch(e.type){case"button":case"input":case"select":case"textarea":l.autoFocus&&n.focus();break;case"img":l.src&&(n.src=l.src)}}break;case 6:break;case 4:break;case 12:break;case 13:if(e.memoizedState===null){var c=e.alternate;if(c!==null){var h=c.memoizedState;if(h!==null){var p=h.dehydrated;p!==null&&Go(p)}}}break;case 19:case 17:case 21:case 22:case 23:case 25:break;default:throw Error(ce(163))}Tn||e.flags&512&&Lf(e)}catch(f){qt(e,e.return,f)}}if(e===t){De=null;break}if(n=e.sibling,n!==null){n.return=e.return,De=n;break}De=e.return}}function g0(t){for(;De!==null;){var e=De;if(e===t){De=null;break}var n=e.sibling;if(n!==null){n.return=e.return,De=n;break}De=e.return}}function _0(t){for(;De!==null;){var e=De;try{switch(e.tag){case 0:case 11:case 15:var n=e.return;try{_u(4,e)}catch(l){qt(e,n,l)}break;case 1:var i=e.stateNode;if(typeof i.componentDidMount=="function"){var r=e.return;try{i.componentDidMount()}catch(l){qt(e,r,l)}}var s=e.return;try{Lf(e)}catch(l){qt(e,s,l)}break;case 5:var a=e.return;try{Lf(e)}catch(l){qt(e,a,l)}}}catch(l){qt(e,e.return,l)}if(e===t){De=null;break}var o=e.sibling;if(o!==null){o.return=e.return,De=o;break}De=e.return}}var PM=Math.ceil,Xc=Ir.ReactCurrentDispatcher,vp=Ir.ReactCurrentOwner,_i=Ir.ReactCurrentBatchConfig,_t=0,fn=null,Jt=null,_n=0,Jn=0,ya=fs(0),rn=0,el=null,Us=0,vu=0,xp=0,Do=null,Vn=null,yp=0,za=1/0,xr=null,$c=!1,Uf=null,rs=null,Nl=!1,Zr=null,qc=0,Io=0,Ff=null,_c=-1,vc=0;function In(){return _t&6?Zt():_c!==-1?_c:_c=Zt()}function ss(t){return t.mode&1?_t&2&&_n!==0?_n&-_n:hM.transition!==null?(vc===0&&(vc=C_()),vc):(t=At,t!==0||(t=window.event,t=t===void 0?16:U_(t.type)),t):1}function Oi(t,e,n,i){if(50<Io)throw Io=0,Ff=null,Error(ce(185));ol(t,n,i),(!(_t&2)||t!==fn)&&(t===fn&&(!(_t&2)&&(vu|=n),rn===4&&qr(t,_n)),qn(t,i),n===1&&_t===0&&!(e.mode&1)&&(za=Zt()+500,pu&&hs()))}function qn(t,e){var n=t.callbackNode;hS(t,e);var i=Nc(t,t===fn?_n:0);if(i===0)n!==null&&bm(n),t.callbackNode=null,t.callbackPriority=0;else if(e=i&-i,t.callbackPriority!==e){if(n!=null&&bm(n),e===1)t.tag===0?fM(v0.bind(null,t)):ev(v0.bind(null,t)),lM(function(){!(_t&6)&&hs()}),n=null;else{switch(R_(i)){case 1:n=Xh;break;case 4:n=b_;break;case 16:n=Pc;break;case 536870912:n=A_;break;default:n=Pc}n=Qv(n,Wv.bind(null,t))}t.callbackPriority=e,t.callbackNode=n}}function Wv(t,e){if(_c=-1,vc=0,_t&6)throw Error(ce(327));var n=t.callbackNode;if(Ra()&&t.callbackNode!==n)return null;var i=Nc(t,t===fn?_n:0);if(i===0)return null;if(i&30||i&t.expiredLanes||e)e=Yc(t,i);else{e=i;var r=_t;_t|=2;var s=$v();(fn!==t||_n!==e)&&(xr=null,za=Zt()+500,Ps(t,e));do try{DM();break}catch(o){Xv(t,o)}while(!0);sp(),Xc.current=s,_t=r,Jt!==null?e=0:(fn=null,_n=0,e=rn)}if(e!==0){if(e===2&&(r=cf(t),r!==0&&(i=r,e=Of(t,r))),e===1)throw n=el,Ps(t,0),qr(t,i),qn(t,Zt()),n;if(e===6)qr(t,i);else{if(r=t.current.alternate,!(i&30)&&!NM(r)&&(e=Yc(t,i),e===2&&(s=cf(t),s!==0&&(i=s,e=Of(t,s))),e===1))throw n=el,Ps(t,0),qr(t,i),qn(t,Zt()),n;switch(t.finishedWork=r,t.finishedLanes=i,e){case 0:case 1:throw Error(ce(345));case 2:ws(t,Vn,xr);break;case 3:if(qr(t,i),(i&130023424)===i&&(e=yp+500-Zt(),10<e)){if(Nc(t,0)!==0)break;if(r=t.suspendedLanes,(r&i)!==i){In(),t.pingedLanes|=t.suspendedLanes&r;break}t.timeoutHandle=_f(ws.bind(null,t,Vn,xr),e);break}ws(t,Vn,xr);break;case 4:if(qr(t,i),(i&4194240)===i)break;for(e=t.eventTimes,r=-1;0<i;){var a=31-Fi(i);s=1<<a,a=e[a],a>r&&(r=a),i&=~s}if(i=r,i=Zt()-i,i=(120>i?120:480>i?480:1080>i?1080:1920>i?1920:3e3>i?3e3:4320>i?4320:1960*PM(i/1960))-i,10<i){t.timeoutHandle=_f(ws.bind(null,t,Vn,xr),i);break}ws(t,Vn,xr);break;case 5:ws(t,Vn,xr);break;default:throw Error(ce(329))}}}return qn(t,Zt()),t.callbackNode===n?Wv.bind(null,t):null}function Of(t,e){var n=Do;return t.current.memoizedState.isDehydrated&&(Ps(t,e).flags|=256),t=Yc(t,e),t!==2&&(e=Vn,Vn=n,e!==null&&kf(e)),t}function kf(t){Vn===null?Vn=t:Vn.push.apply(Vn,t)}function NM(t){for(var e=t;;){if(e.flags&16384){var n=e.updateQueue;if(n!==null&&(n=n.stores,n!==null))for(var i=0;i<n.length;i++){var r=n[i],s=r.getSnapshot;r=r.value;try{if(!Bi(s(),r))return!1}catch{return!1}}}if(n=e.child,e.subtreeFlags&16384&&n!==null)n.return=e,e=n;else{if(e===t)break;for(;e.sibling===null;){if(e.return===null||e.return===t)return!0;e=e.return}e.sibling.return=e.return,e=e.sibling}}return!0}function qr(t,e){for(e&=~xp,e&=~vu,t.suspendedLanes|=e,t.pingedLanes&=~e,t=t.expirationTimes;0<e;){var n=31-Fi(e),i=1<<n;t[n]=-1,e&=~i}}function v0(t){if(_t&6)throw Error(ce(327));Ra();var e=Nc(t,0);if(!(e&1))return qn(t,Zt()),null;var n=Yc(t,e);if(t.tag!==0&&n===2){var i=cf(t);i!==0&&(e=i,n=Of(t,i))}if(n===1)throw n=el,Ps(t,0),qr(t,e),qn(t,Zt()),n;if(n===6)throw Error(ce(345));return t.finishedWork=t.current.alternate,t.finishedLanes=e,ws(t,Vn,xr),qn(t,Zt()),null}function Sp(t,e){var n=_t;_t|=1;try{return t(e)}finally{_t=n,_t===0&&(za=Zt()+500,pu&&hs())}}function Fs(t){Zr!==null&&Zr.tag===0&&!(_t&6)&&Ra();var e=_t;_t|=1;var n=_i.transition,i=At;try{if(_i.transition=null,At=1,t)return t()}finally{At=i,_i.transition=n,_t=e,!(_t&6)&&hs()}}function Mp(){Jn=ya.current,Ut(ya)}function Ps(t,e){t.finishedWork=null,t.finishedLanes=0;var n=t.timeoutHandle;if(n!==-1&&(t.timeoutHandle=-1,oM(n)),Jt!==null)for(n=Jt.return;n!==null;){var i=n;switch(np(i),i.tag){case 1:i=i.type.childContextTypes,i!=null&&Fc();break;case 3:ka(),Ut(Xn),Ut(Cn),dp();break;case 5:up(i);break;case 4:ka();break;case 13:Ut(Vt);break;case 19:Ut(Vt);break;case 10:ap(i.type._context);break;case 22:case 23:Mp()}n=n.return}if(fn=t,Jt=t=as(t.current,null),_n=Jn=e,rn=0,el=null,xp=vu=Us=0,Vn=Do=null,bs!==null){for(e=0;e<bs.length;e++)if(n=bs[e],i=n.interleaved,i!==null){n.interleaved=null;var r=i.next,s=n.pending;if(s!==null){var a=s.next;s.next=r,i.next=a}n.pending=i}bs=null}return t}function Xv(t,e){do{var n=Jt;try{if(sp(),pc.current=Wc,jc){for(var i=jt.memoizedState;i!==null;){var r=i.queue;r!==null&&(r.pending=null),i=i.next}jc=!1}if(Is=0,dn=tn=jt=null,No=!1,Zo=0,vp.current=null,n===null||n.return===null){rn=1,el=e,Jt=null;break}e:{var s=t,a=n.return,o=n,l=e;if(e=_n,o.flags|=32768,l!==null&&typeof l=="object"&&typeof l.then=="function"){var c=l,h=o,p=h.tag;if(!(h.mode&1)&&(p===0||p===11||p===15)){var f=h.alternate;f?(h.updateQueue=f.updateQueue,h.memoizedState=f.memoizedState,h.lanes=f.lanes):(h.updateQueue=null,h.memoizedState=null)}var g=s0(a);if(g!==null){g.flags&=-257,a0(g,a,o,s,e),g.mode&1&&r0(s,c,e),e=g,l=c;var v=e.updateQueue;if(v===null){var S=new Set;S.add(l),e.updateQueue=S}else v.add(l);break e}else{if(!(e&1)){r0(s,c,e),Ep();break e}l=Error(ce(426))}}else if(Ot&&o.mode&1){var _=s0(a);if(_!==null){!(_.flags&65536)&&(_.flags|=256),a0(_,a,o,s,e),ip(Ba(l,o));break e}}s=l=Ba(l,o),rn!==4&&(rn=2),Do===null?Do=[s]:Do.push(s),s=a;do{switch(s.tag){case 3:s.flags|=65536,e&=-e,s.lanes|=e;var d=Rv(s,l,e);Qm(s,d);break e;case 1:o=l;var m=s.type,M=s.stateNode;if(!(s.flags&128)&&(typeof m.getDerivedStateFromError=="function"||M!==null&&typeof M.componentDidCatch=="function"&&(rs===null||!rs.has(M)))){s.flags|=65536,e&=-e,s.lanes|=e;var y=Pv(s,o,e);Qm(s,y);break e}}s=s.return}while(s!==null)}Yv(n)}catch(T){e=T,Jt===n&&n!==null&&(Jt=n=n.return);continue}break}while(!0)}function $v(){var t=Xc.current;return Xc.current=Wc,t===null?Wc:t}function Ep(){(rn===0||rn===3||rn===2)&&(rn=4),fn===null||!(Us&268435455)&&!(vu&268435455)||qr(fn,_n)}function Yc(t,e){var n=_t;_t|=2;var i=$v();(fn!==t||_n!==e)&&(xr=null,Ps(t,e));do try{LM();break}catch(r){Xv(t,r)}while(!0);if(sp(),_t=n,Xc.current=i,Jt!==null)throw Error(ce(261));return fn=null,_n=0,rn}function LM(){for(;Jt!==null;)qv(Jt)}function DM(){for(;Jt!==null&&!rS();)qv(Jt)}function qv(t){var e=Zv(t.alternate,t,Jn);t.memoizedProps=t.pendingProps,e===null?Yv(t):Jt=e,vp.current=null}function Yv(t){var e=t;do{var n=e.alternate;if(t=e.return,e.flags&32768){if(n=bM(n,e),n!==null){n.flags&=32767,Jt=n;return}if(t!==null)t.flags|=32768,t.subtreeFlags=0,t.deletions=null;else{rn=6,Jt=null;return}}else if(n=TM(n,e,Jn),n!==null){Jt=n;return}if(e=e.sibling,e!==null){Jt=e;return}Jt=e=t}while(e!==null);rn===0&&(rn=5)}function ws(t,e,n){var i=At,r=_i.transition;try{_i.transition=null,At=1,IM(t,e,n,i)}finally{_i.transition=r,At=i}return null}function IM(t,e,n,i){do Ra();while(Zr!==null);if(_t&6)throw Error(ce(327));n=t.finishedWork;var r=t.finishedLanes;if(n===null)return null;if(t.finishedWork=null,t.finishedLanes=0,n===t.current)throw Error(ce(177));t.callbackNode=null,t.callbackPriority=0;var s=n.lanes|n.childLanes;if(pS(t,s),t===fn&&(Jt=fn=null,_n=0),!(n.subtreeFlags&2064)&&!(n.flags&2064)||Nl||(Nl=!0,Qv(Pc,function(){return Ra(),null})),s=(n.flags&15990)!==0,n.subtreeFlags&15990||s){s=_i.transition,_i.transition=null;var a=At;At=1;var o=_t;_t|=4,vp.current=null,CM(t,n),Gv(n,t),eM(mf),Lc=!!pf,mf=pf=null,t.current=n,RM(n),sS(),_t=o,At=a,_i.transition=s}else t.current=n;if(Nl&&(Nl=!1,Zr=t,qc=r),s=t.pendingLanes,s===0&&(rs=null),lS(n.stateNode),qn(t,Zt()),e!==null)for(i=t.onRecoverableError,n=0;n<e.length;n++)r=e[n],i(r.value,{componentStack:r.stack,digest:r.digest});if($c)throw $c=!1,t=Uf,Uf=null,t;return qc&1&&t.tag!==0&&Ra(),s=t.pendingLanes,s&1?t===Ff?Io++:(Io=0,Ff=t):Io=0,hs(),null}function Ra(){if(Zr!==null){var t=R_(qc),e=_i.transition,n=At;try{if(_i.transition=null,At=16>t?16:t,Zr===null)var i=!1;else{if(t=Zr,Zr=null,qc=0,_t&6)throw Error(ce(331));var r=_t;for(_t|=4,De=t.current;De!==null;){var s=De,a=s.child;if(De.flags&16){var o=s.deletions;if(o!==null){for(var l=0;l<o.length;l++){var c=o[l];for(De=c;De!==null;){var h=De;switch(h.tag){case 0:case 11:case 15:Lo(8,h,s)}var p=h.child;if(p!==null)p.return=h,De=p;else for(;De!==null;){h=De;var f=h.sibling,g=h.return;if(zv(h),h===c){De=null;break}if(f!==null){f.return=g,De=f;break}De=g}}}var v=s.alternate;if(v!==null){var S=v.child;if(S!==null){v.child=null;do{var _=S.sibling;S.sibling=null,S=_}while(S!==null)}}De=s}}if(s.subtreeFlags&2064&&a!==null)a.return=s,De=a;else e:for(;De!==null;){if(s=De,s.flags&2048)switch(s.tag){case 0:case 11:case 15:Lo(9,s,s.return)}var d=s.sibling;if(d!==null){d.return=s.return,De=d;break e}De=s.return}}var m=t.current;for(De=m;De!==null;){a=De;var M=a.child;if(a.subtreeFlags&2064&&M!==null)M.return=a,De=M;else e:for(a=m;De!==null;){if(o=De,o.flags&2048)try{switch(o.tag){case 0:case 11:case 15:_u(9,o)}}catch(T){qt(o,o.return,T)}if(o===a){De=null;break e}var y=o.sibling;if(y!==null){y.return=o.return,De=y;break e}De=o.return}}if(_t=r,hs(),rr&&typeof rr.onPostCommitFiberRoot=="function")try{rr.onPostCommitFiberRoot(cu,t)}catch{}i=!0}return i}finally{At=n,_i.transition=e}}return!1}function x0(t,e,n){e=Ba(n,e),e=Rv(t,e,1),t=is(t,e,1),e=In(),t!==null&&(ol(t,1,e),qn(t,e))}function qt(t,e,n){if(t.tag===3)x0(t,t,n);else for(;e!==null;){if(e.tag===3){x0(e,t,n);break}else if(e.tag===1){var i=e.stateNode;if(typeof e.type.getDerivedStateFromError=="function"||typeof i.componentDidCatch=="function"&&(rs===null||!rs.has(i))){t=Ba(n,t),t=Pv(e,t,1),e=is(e,t,1),t=In(),e!==null&&(ol(e,1,t),qn(e,t));break}}e=e.return}}function UM(t,e,n){var i=t.pingCache;i!==null&&i.delete(e),e=In(),t.pingedLanes|=t.suspendedLanes&n,fn===t&&(_n&n)===n&&(rn===4||rn===3&&(_n&130023424)===_n&&500>Zt()-yp?Ps(t,0):xp|=n),qn(t,e)}function Kv(t,e){e===0&&(t.mode&1?(e=Sl,Sl<<=1,!(Sl&130023424)&&(Sl=4194304)):e=1);var n=In();t=Pr(t,e),t!==null&&(ol(t,e,n),qn(t,n))}function FM(t){var e=t.memoizedState,n=0;e!==null&&(n=e.retryLane),Kv(t,n)}function OM(t,e){var n=0;switch(t.tag){case 13:var i=t.stateNode,r=t.memoizedState;r!==null&&(n=r.retryLane);break;case 19:i=t.stateNode;break;default:throw Error(ce(314))}i!==null&&i.delete(e),Kv(t,n)}var Zv;Zv=function(t,e,n){if(t!==null)if(t.memoizedProps!==e.pendingProps||Xn.current)Wn=!0;else{if(!(t.lanes&n)&&!(e.flags&128))return Wn=!1,wM(t,e,n);Wn=!!(t.flags&131072)}else Wn=!1,Ot&&e.flags&1048576&&tv(e,Bc,e.index);switch(e.lanes=0,e.tag){case 2:var i=e.type;gc(t,e),t=e.pendingProps;var r=Ua(e,Cn.current);Ca(e,n),r=hp(null,e,i,t,r,n);var s=pp();return e.flags|=1,typeof r=="object"&&r!==null&&typeof r.render=="function"&&r.$$typeof===void 0?(e.tag=1,e.memoizedState=null,e.updateQueue=null,$n(i)?(s=!0,Oc(e)):s=!1,e.memoizedState=r.state!==null&&r.state!==void 0?r.state:null,lp(e),r.updater=gu,e.stateNode=r,r._reactInternals=e,wf(e,i,t,n),e=Af(null,e,i,!0,s,n)):(e.tag=0,Ot&&s&&tp(e),Ln(null,e,r,n),e=e.child),e;case 16:i=e.elementType;e:{switch(gc(t,e),t=e.pendingProps,r=i._init,i=r(i._payload),e.type=i,r=e.tag=BM(i),t=Pi(i,t),r){case 0:e=bf(null,e,i,t,n);break e;case 1:e=c0(null,e,i,t,n);break e;case 11:e=o0(null,e,i,t,n);break e;case 14:e=l0(null,e,i,Pi(i.type,t),n);break e}throw Error(ce(306,i,""))}return e;case 0:return i=e.type,r=e.pendingProps,r=e.elementType===i?r:Pi(i,r),bf(t,e,i,r,n);case 1:return i=e.type,r=e.pendingProps,r=e.elementType===i?r:Pi(i,r),c0(t,e,i,r,n);case 3:e:{if(Iv(e),t===null)throw Error(ce(387));i=e.pendingProps,s=e.memoizedState,r=s.element,ov(t,e),Vc(e,i,null,n);var a=e.memoizedState;if(i=a.element,s.isDehydrated)if(s={element:i,isDehydrated:!1,cache:a.cache,pendingSuspenseBoundaries:a.pendingSuspenseBoundaries,transitions:a.transitions},e.updateQueue.baseState=s,e.memoizedState=s,e.flags&256){r=Ba(Error(ce(423)),e),e=u0(t,e,i,n,r);break e}else if(i!==r){r=Ba(Error(ce(424)),e),e=u0(t,e,i,n,r);break e}else for(ii=ns(e.stateNode.containerInfo.firstChild),si=e,Ot=!0,Li=null,n=sv(e,null,i,n),e.child=n;n;)n.flags=n.flags&-3|4096,n=n.sibling;else{if(Fa(),i===r){e=Nr(t,e,n);break e}Ln(t,e,i,n)}e=e.child}return e;case 5:return lv(e),t===null&&Sf(e),i=e.type,r=e.pendingProps,s=t!==null?t.memoizedProps:null,a=r.children,gf(i,r)?a=null:s!==null&&gf(i,s)&&(e.flags|=32),Dv(t,e),Ln(t,e,a,n),e.child;case 6:return t===null&&Sf(e),null;case 13:return Uv(t,e,n);case 4:return cp(e,e.stateNode.containerInfo),i=e.pendingProps,t===null?e.child=Oa(e,null,i,n):Ln(t,e,i,n),e.child;case 11:return i=e.type,r=e.pendingProps,r=e.elementType===i?r:Pi(i,r),o0(t,e,i,r,n);case 7:return Ln(t,e,e.pendingProps,n),e.child;case 8:return Ln(t,e,e.pendingProps.children,n),e.child;case 12:return Ln(t,e,e.pendingProps.children,n),e.child;case 10:e:{if(i=e.type._context,r=e.pendingProps,s=e.memoizedProps,a=r.value,Nt(zc,i._currentValue),i._currentValue=a,s!==null)if(Bi(s.value,a)){if(s.children===r.children&&!Xn.current){e=Nr(t,e,n);break e}}else for(s=e.child,s!==null&&(s.return=e);s!==null;){var o=s.dependencies;if(o!==null){a=s.child;for(var l=o.firstContext;l!==null;){if(l.context===i){if(s.tag===1){l=Tr(-1,n&-n),l.tag=2;var c=s.updateQueue;if(c!==null){c=c.shared;var h=c.pending;h===null?l.next=l:(l.next=h.next,h.next=l),c.pending=l}}s.lanes|=n,l=s.alternate,l!==null&&(l.lanes|=n),Mf(s.return,n,e),o.lanes|=n;break}l=l.next}}else if(s.tag===10)a=s.type===e.type?null:s.child;else if(s.tag===18){if(a=s.return,a===null)throw Error(ce(341));a.lanes|=n,o=a.alternate,o!==null&&(o.lanes|=n),Mf(a,n,e),a=s.sibling}else a=s.child;if(a!==null)a.return=s;else for(a=s;a!==null;){if(a===e){a=null;break}if(s=a.sibling,s!==null){s.return=a.return,a=s;break}a=a.return}s=a}Ln(t,e,r.children,n),e=e.child}return e;case 9:return r=e.type,i=e.pendingProps.children,Ca(e,n),r=xi(r),i=i(r),e.flags|=1,Ln(t,e,i,n),e.child;case 14:return i=e.type,r=Pi(i,e.pendingProps),r=Pi(i.type,r),l0(t,e,i,r,n);case 15:return Nv(t,e,e.type,e.pendingProps,n);case 17:return i=e.type,r=e.pendingProps,r=e.elementType===i?r:Pi(i,r),gc(t,e),e.tag=1,$n(i)?(t=!0,Oc(e)):t=!1,Ca(e,n),Cv(e,i,r),wf(e,i,r,n),Af(null,e,i,!0,t,n);case 19:return Fv(t,e,n);case 22:return Lv(t,e,n)}throw Error(ce(156,e.tag))};function Qv(t,e){return T_(t,e)}function kM(t,e,n,i){this.tag=t,this.key=n,this.sibling=this.child=this.return=this.stateNode=this.type=this.elementType=null,this.index=0,this.ref=null,this.pendingProps=e,this.dependencies=this.memoizedState=this.updateQueue=this.memoizedProps=null,this.mode=i,this.subtreeFlags=this.flags=0,this.deletions=null,this.childLanes=this.lanes=0,this.alternate=null}function gi(t,e,n,i){return new kM(t,e,n,i)}function wp(t){return t=t.prototype,!(!t||!t.isReactComponent)}function BM(t){if(typeof t=="function")return wp(t)?1:0;if(t!=null){if(t=t.$$typeof,t===Gh)return 11;if(t===jh)return 14}return 2}function as(t,e){var n=t.alternate;return n===null?(n=gi(t.tag,e,t.key,t.mode),n.elementType=t.elementType,n.type=t.type,n.stateNode=t.stateNode,n.alternate=t,t.alternate=n):(n.pendingProps=e,n.type=t.type,n.flags=0,n.subtreeFlags=0,n.deletions=null),n.flags=t.flags&14680064,n.childLanes=t.childLanes,n.lanes=t.lanes,n.child=t.child,n.memoizedProps=t.memoizedProps,n.memoizedState=t.memoizedState,n.updateQueue=t.updateQueue,e=t.dependencies,n.dependencies=e===null?null:{lanes:e.lanes,firstContext:e.firstContext},n.sibling=t.sibling,n.index=t.index,n.ref=t.ref,n}function xc(t,e,n,i,r,s){var a=2;if(i=t,typeof t=="function")wp(t)&&(a=1);else if(typeof t=="string")a=5;else e:switch(t){case ua:return Ns(n.children,r,s,e);case Vh:a=8,r|=8;break;case $d:return t=gi(12,n,e,r|2),t.elementType=$d,t.lanes=s,t;case qd:return t=gi(13,n,e,r),t.elementType=qd,t.lanes=s,t;case Yd:return t=gi(19,n,e,r),t.elementType=Yd,t.lanes=s,t;case l_:return xu(n,r,s,e);default:if(typeof t=="object"&&t!==null)switch(t.$$typeof){case a_:a=10;break e;case o_:a=9;break e;case Gh:a=11;break e;case jh:a=14;break e;case Wr:a=16,i=null;break e}throw Error(ce(130,t==null?t:typeof t,""))}return e=gi(a,n,e,r),e.elementType=t,e.type=i,e.lanes=s,e}function Ns(t,e,n,i){return t=gi(7,t,i,e),t.lanes=n,t}function xu(t,e,n,i){return t=gi(22,t,i,e),t.elementType=l_,t.lanes=n,t.stateNode={isHidden:!1},t}function od(t,e,n){return t=gi(6,t,null,e),t.lanes=n,t}function ld(t,e,n){return e=gi(4,t.children!==null?t.children:[],t.key,e),e.lanes=n,e.stateNode={containerInfo:t.containerInfo,pendingChildren:null,implementation:t.implementation},e}function zM(t,e,n,i,r){this.tag=e,this.containerInfo=t,this.finishedWork=this.pingCache=this.current=this.pendingChildren=null,this.timeoutHandle=-1,this.callbackNode=this.pendingContext=this.context=null,this.callbackPriority=0,this.eventTimes=Vu(0),this.expirationTimes=Vu(-1),this.entangledLanes=this.finishedLanes=this.mutableReadLanes=this.expiredLanes=this.pingedLanes=this.suspendedLanes=this.pendingLanes=0,this.entanglements=Vu(0),this.identifierPrefix=i,this.onRecoverableError=r,this.mutableSourceEagerHydrationData=null}function Tp(t,e,n,i,r,s,a,o,l){return t=new zM(t,e,n,o,l),e===1?(e=1,s===!0&&(e|=8)):e=0,s=gi(3,null,null,e),t.current=s,s.stateNode=t,s.memoizedState={element:i,isDehydrated:n,cache:null,transitions:null,pendingSuspenseBoundaries:null},lp(s),t}function HM(t,e,n){var i=3<arguments.length&&arguments[3]!==void 0?arguments[3]:null;return{$$typeof:ca,key:i==null?null:""+i,children:t,containerInfo:e,implementation:n}}function Jv(t){if(!t)return ls;t=t._reactInternals;e:{if(Hs(t)!==t||t.tag!==1)throw Error(ce(170));var e=t;do{switch(e.tag){case 3:e=e.stateNode.context;break e;case 1:if($n(e.type)){e=e.stateNode.__reactInternalMemoizedMergedChildContext;break e}}e=e.return}while(e!==null);throw Error(ce(171))}if(t.tag===1){var n=t.type;if($n(n))return J_(t,n,e)}return e}function ex(t,e,n,i,r,s,a,o,l){return t=Tp(n,i,!0,t,r,s,a,o,l),t.context=Jv(null),n=t.current,i=In(),r=ss(n),s=Tr(i,r),s.callback=e??null,is(n,s,r),t.current.lanes=r,ol(t,r,i),qn(t,i),t}function yu(t,e,n,i){var r=e.current,s=In(),a=ss(r);return n=Jv(n),e.context===null?e.context=n:e.pendingContext=n,e=Tr(s,a),e.payload={element:t},i=i===void 0?null:i,i!==null&&(e.callback=i),t=is(r,e,a),t!==null&&(Oi(t,r,a,s),hc(t,r,a)),a}function Kc(t){if(t=t.current,!t.child)return null;switch(t.child.tag){case 5:return t.child.stateNode;default:return t.child.stateNode}}function y0(t,e){if(t=t.memoizedState,t!==null&&t.dehydrated!==null){var n=t.retryLane;t.retryLane=n!==0&&n<e?n:e}}function bp(t,e){y0(t,e),(t=t.alternate)&&y0(t,e)}function VM(){return null}var tx=typeof reportError=="function"?reportError:function(t){console.error(t)};function Ap(t){this._internalRoot=t}Su.prototype.render=Ap.prototype.render=function(t){var e=this._internalRoot;if(e===null)throw Error(ce(409));yu(t,e,null,null)};Su.prototype.unmount=Ap.prototype.unmount=function(){var t=this._internalRoot;if(t!==null){this._internalRoot=null;var e=t.containerInfo;Fs(function(){yu(null,t,null,null)}),e[Rr]=null}};function Su(t){this._internalRoot=t}Su.prototype.unstable_scheduleHydration=function(t){if(t){var e=L_();t={blockedOn:null,target:t,priority:e};for(var n=0;n<$r.length&&e!==0&&e<$r[n].priority;n++);$r.splice(n,0,t),n===0&&I_(t)}};function Cp(t){return!(!t||t.nodeType!==1&&t.nodeType!==9&&t.nodeType!==11)}function Mu(t){return!(!t||t.nodeType!==1&&t.nodeType!==9&&t.nodeType!==11&&(t.nodeType!==8||t.nodeValue!==" react-mount-point-unstable "))}function S0(){}function GM(t,e,n,i,r){if(r){if(typeof i=="function"){var s=i;i=function(){var c=Kc(a);s.call(c)}}var a=ex(e,i,t,0,null,!1,!1,"",S0);return t._reactRootContainer=a,t[Rr]=a.current,Xo(t.nodeType===8?t.parentNode:t),Fs(),a}for(;r=t.lastChild;)t.removeChild(r);if(typeof i=="function"){var o=i;i=function(){var c=Kc(l);o.call(c)}}var l=Tp(t,0,!1,null,null,!1,!1,"",S0);return t._reactRootContainer=l,t[Rr]=l.current,Xo(t.nodeType===8?t.parentNode:t),Fs(function(){yu(e,l,n,i)}),l}function Eu(t,e,n,i,r){var s=n._reactRootContainer;if(s){var a=s;if(typeof r=="function"){var o=r;r=function(){var l=Kc(a);o.call(l)}}yu(e,a,t,r)}else a=GM(n,e,t,r,i);return Kc(a)}P_=function(t){switch(t.tag){case 3:var e=t.stateNode;if(e.current.memoizedState.isDehydrated){var n=So(e.pendingLanes);n!==0&&($h(e,n|1),qn(e,Zt()),!(_t&6)&&(za=Zt()+500,hs()))}break;case 13:Fs(function(){var i=Pr(t,1);if(i!==null){var r=In();Oi(i,t,1,r)}}),bp(t,1)}};qh=function(t){if(t.tag===13){var e=Pr(t,134217728);if(e!==null){var n=In();Oi(e,t,134217728,n)}bp(t,134217728)}};N_=function(t){if(t.tag===13){var e=ss(t),n=Pr(t,e);if(n!==null){var i=In();Oi(n,t,e,i)}bp(t,e)}};L_=function(){return At};D_=function(t,e){var n=At;try{return At=t,e()}finally{At=n}};af=function(t,e,n){switch(e){case"input":if(Qd(t,n),e=n.name,n.type==="radio"&&e!=null){for(n=t;n.parentNode;)n=n.parentNode;for(n=n.querySelectorAll("input[name="+JSON.stringify(""+e)+'][type="radio"]'),e=0;e<n.length;e++){var i=n[e];if(i!==t&&i.form===t.form){var r=hu(i);if(!r)throw Error(ce(90));u_(i),Qd(i,r)}}}break;case"textarea":f_(t,n);break;case"select":e=n.value,e!=null&&wa(t,!!n.multiple,e,!1)}};x_=Sp;y_=Fs;var jM={usingClientEntryPoint:!1,Events:[cl,pa,hu,__,v_,Sp]},co={findFiberByHostInstance:Ts,bundleType:0,version:"18.3.1",rendererPackageName:"react-dom"},WM={bundleType:co.bundleType,version:co.version,rendererPackageName:co.rendererPackageName,rendererConfig:co.rendererConfig,overrideHookState:null,overrideHookStateDeletePath:null,overrideHookStateRenamePath:null,overrideProps:null,overridePropsDeletePath:null,overridePropsRenamePath:null,setErrorHandler:null,setSuspenseHandler:null,scheduleUpdate:null,currentDispatcherRef:Ir.ReactCurrentDispatcher,findHostInstanceByFiber:function(t){return t=E_(t),t===null?null:t.stateNode},findFiberByHostInstance:co.findFiberByHostInstance||VM,findHostInstancesForRefresh:null,scheduleRefresh:null,scheduleRoot:null,setRefreshHandler:null,getCurrentFiber:null,reconcilerVersion:"18.3.1-next-f1338f8080-20240426"};if(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__<"u"){var Ll=__REACT_DEVTOOLS_GLOBAL_HOOK__;if(!Ll.isDisabled&&Ll.supportsFiber)try{cu=Ll.inject(WM),rr=Ll}catch{}}oi.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED=jM;oi.createPortal=function(t,e){var n=2<arguments.length&&arguments[2]!==void 0?arguments[2]:null;if(!Cp(e))throw Error(ce(200));return HM(t,e,null,n)};oi.createRoot=function(t,e){if(!Cp(t))throw Error(ce(299));var n=!1,i="",r=tx;return e!=null&&(e.unstable_strictMode===!0&&(n=!0),e.identifierPrefix!==void 0&&(i=e.identifierPrefix),e.onRecoverableError!==void 0&&(r=e.onRecoverableError)),e=Tp(t,1,!1,null,null,n,!1,i,r),t[Rr]=e.current,Xo(t.nodeType===8?t.parentNode:t),new Ap(e)};oi.findDOMNode=function(t){if(t==null)return null;if(t.nodeType===1)return t;var e=t._reactInternals;if(e===void 0)throw typeof t.render=="function"?Error(ce(188)):(t=Object.keys(t).join(","),Error(ce(268,t)));return t=E_(e),t=t===null?null:t.stateNode,t};oi.flushSync=function(t){return Fs(t)};oi.hydrate=function(t,e,n){if(!Mu(e))throw Error(ce(200));return Eu(null,t,e,!0,n)};oi.hydrateRoot=function(t,e,n){if(!Cp(t))throw Error(ce(405));var i=n!=null&&n.hydratedSources||null,r=!1,s="",a=tx;if(n!=null&&(n.unstable_strictMode===!0&&(r=!0),n.identifierPrefix!==void 0&&(s=n.identifierPrefix),n.onRecoverableError!==void 0&&(a=n.onRecoverableError)),e=ex(e,null,t,1,n??null,r,!1,s,a),t[Rr]=e.current,Xo(t),i)for(t=0;t<i.length;t++)n=i[t],r=n._getVersion,r=r(n._source),e.mutableSourceEagerHydrationData==null?e.mutableSourceEagerHydrationData=[n,r]:e.mutableSourceEagerHydrationData.push(n,r);return new Su(e)};oi.render=function(t,e,n){if(!Mu(e))throw Error(ce(200));return Eu(null,t,e,!1,n)};oi.unmountComponentAtNode=function(t){if(!Mu(t))throw Error(ce(40));return t._reactRootContainer?(Fs(function(){Eu(null,null,t,!1,function(){t._reactRootContainer=null,t[Rr]=null})}),!0):!1};oi.unstable_batchedUpdates=Sp;oi.unstable_renderSubtreeIntoContainer=function(t,e,n,i){if(!Mu(n))throw Error(ce(200));if(t==null||t._reactInternals===void 0)throw Error(ce(38));return Eu(t,e,n,!1,i)};oi.version="18.3.1-next-f1338f8080-20240426";function nx(){if(!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__>"u"||typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE!="function"))try{__REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(nx)}catch(t){console.error(t)}}nx(),n_.exports=oi;var XM=n_.exports,ix,M0=XM;ix=M0.createRoot,M0.hydrateRoot;/**
 * @license
 * Copyright 2010-2026 Three.js Authors
 * SPDX-License-Identifier: MIT
 */const Rp="186",Pa={ROTATE:0,DOLLY:1,PAN:2},Sa={ROTATE:0,PAN:1,DOLLY_PAN:2,DOLLY_ROTATE:3},$M=0,E0=1,qM=2,Uo=1,YM=2,Eo=3,Os=0,Yn=1,jn=2,br=0,Fo=1,w0=2,T0=3,b0=4,KM=5,la=100,ZM=101,QM=102,JM=103,eE=104,tE=200,nE=201,iE=202,rE=203,rx=204,sx=205,sE=206,aE=207,oE=208,lE=209,cE=210,uE=211,dE=212,fE=213,hE=214,Bf=0,zf=1,Hf=2,tl=3,Vf=4,Gf=5,jf=6,Wf=7,ax=0,pE=1,mE=2,ar=0,ox=1,lx=2,cx=3,ux=4,dx=5,fx=6,hx=7,px=300,ks=301,Ha=302,cd=303,ud=304,wu=306,Xf=1e3,wr=1001,$f=1002,gn=1003,gE=1004,Dl=1005,bn=1006,dd=1007,Cs=1008,ni=1009,mx=1010,gx=1011,nl=1012,Pp=1013,or=1014,nr=1015,lr=1016,Np=1017,Lp=1018,il=1020,_x=35902,vx=35899,xx=1021,yx=1022,Ui=1023,Lr=1026,Rs=1027,Sx=1028,Dp=1029,Bs=1030,Ip=1031,Up=1033,yc=33776,Sc=33777,Mc=33778,Ec=33779,qf=35840,Yf=35841,Kf=35842,Zf=35843,Qf=36196,Jf=37492,eh=37496,th=37488,nh=37489,Zc=37490,ih=37491,rh=37808,sh=37809,ah=37810,oh=37811,lh=37812,ch=37813,uh=37814,dh=37815,fh=37816,hh=37817,ph=37818,mh=37819,gh=37820,_h=37821,vh=36492,xh=36494,yh=36495,Sh=36283,Mh=36284,Qc=36285,Eh=36286,_E=3200,wh=0,vE=1,Yr="",ei="srgb",Jc="srgb-linear",eu="linear",Tt="srgb",fd=7680,xE=519,yE=512,SE=513,ME=514,Fp=515,EE=516,wE=517,Op=518,TE=519,bE=35044,A0="300 es",ir=2e3,rl=2001;function AE(t){for(let e=t.length-1;e>=0;--e)if(t[e]>=65535)return!0;return!1}function tu(t){return document.createElementNS("http://www.w3.org/1999/xhtml",t)}function CE(){const t=tu("canvas");return t.style.display="block",t}const C0={};function R0(...t){const e="THREE."+t.shift();console.log(e,...t)}function Mx(t){const e=t[0];if(typeof e=="string"&&e.startsWith("TSL:")){const n=t[1];n&&n.isStackTrace?t[0]+=" "+n.getLocation():t[1]='Stack trace not available. Enable "THREE.Node.captureStackTrace" to capture stack traces.'}return t}function Ve(...t){t=Mx(t);const e="THREE."+t.shift();{const n=t[0];n&&n.isStackTrace?console.warn(n.getError(e)):console.warn(e,...t)}}function gt(...t){t=Mx(t);const e="THREE."+t.shift();{const n=t[0];n&&n.isStackTrace?console.error(n.getError(e)):console.error(e,...t)}}function Na(...t){const e=t.join(" ");e in C0||(C0[e]=!0,Ve(...t))}function RE(t,e,n){return new Promise(function(i,r){function s(){switch(t.clientWaitSync(e,t.SYNC_FLUSH_COMMANDS_BIT,0)){case t.WAIT_FAILED:r();break;case t.TIMEOUT_EXPIRED:setTimeout(s,n);break;default:i()}}setTimeout(s,n)})}const PE={[Bf]:zf,[Hf]:jf,[Vf]:Wf,[tl]:Gf,[zf]:Bf,[jf]:Hf,[Wf]:Vf,[Gf]:tl};class ps{addEventListener(e,n){this._listeners===void 0&&(this._listeners={});const i=this._listeners;i[e]===void 0&&(i[e]=[]),i[e].indexOf(n)===-1&&i[e].push(n)}hasEventListener(e,n){const i=this._listeners;return i===void 0?!1:i[e]!==void 0&&i[e].indexOf(n)!==-1}removeEventListener(e,n){const i=this._listeners;if(i===void 0)return;const r=i[e];if(r!==void 0){const s=r.indexOf(n);s!==-1&&r.splice(s,1)}}dispatchEvent(e){const n=this._listeners;if(n===void 0)return;const i=n[e.type];if(i!==void 0){e.target=this;const r=i.slice(0);for(let s=0,a=r.length;s<a;s++)r[s].call(this,e);e.target=null}}}const Mn=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"],Oo=Math.PI/180,Th=180/Math.PI;function dl(){const t=Math.random()*4294967295|0,e=Math.random()*4294967295|0,n=Math.random()*4294967295|0,i=Math.random()*4294967295|0;return(Mn[t&255]+Mn[t>>8&255]+Mn[t>>16&255]+Mn[t>>24&255]+"-"+Mn[e&255]+Mn[e>>8&255]+"-"+Mn[e>>16&15|64]+Mn[e>>24&255]+"-"+Mn[n&63|128]+Mn[n>>8&255]+"-"+Mn[n>>16&255]+Mn[n>>24&255]+Mn[i&255]+Mn[i>>8&255]+Mn[i>>16&255]+Mn[i>>24&255]).toLowerCase()}function lt(t,e,n){return Math.max(e,Math.min(n,t))}function NE(t,e){return(t%e+e)%e}function hd(t,e,n){return(1-n)*t+n*e}function uo(t,e){switch(e.constructor){case Float32Array:return t;case Uint32Array:return t/4294967295;case Uint16Array:return t/65535;case Uint8Array:case Uint8ClampedArray:return t/255;case Int32Array:return Math.max(t/2147483647,-1);case Int16Array:return Math.max(t/32767,-1);case Int8Array:return Math.max(t/127,-1);default:throw new Error("THREE.MathUtils: Invalid component type.")}}function zn(t,e){switch(e.constructor){case Float32Array:return t;case Uint32Array:return Math.round(t*4294967295);case Uint16Array:return Math.round(t*65535);case Uint8Array:case Uint8ClampedArray:return Math.round(t*255);case Int32Array:return Math.round(t*2147483647);case Int16Array:return Math.round(t*32767);case Int8Array:return Math.round(t*127);default:throw new Error("THREE.MathUtils: Invalid component type.")}}const LE={DEG2RAD:Oo},tm=class tm{constructor(e=0,n=0){this.x=e,this.y=n}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,n){return this.x=e,this.y=n,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,n){switch(e){case 0:this.x=n;break;case 1:this.y=n;break;default:throw new Error("THREE.Vector2: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw new Error("THREE.Vector2: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,n){return this.x=e.x+n.x,this.y=e.y+n.y,this}addScaledVector(e,n){return this.x+=e.x*n,this.y+=e.y*n,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,n){return this.x=e.x-n.x,this.y=e.y-n.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){const n=this.x,i=this.y,r=e.elements;return this.x=r[0]*n+r[3]*i+r[6],this.y=r[1]*n+r[4]*i+r[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,n){return this.x=lt(this.x,e.x,n.x),this.y=lt(this.y,e.y,n.y),this}clampScalar(e,n){return this.x=lt(this.x,e,n),this.y=lt(this.y,e,n),this}clampLength(e,n){const i=this.length();return this.divideScalar(i||1).multiplyScalar(lt(i,e,n))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(e){const n=Math.sqrt(this.lengthSq()*e.lengthSq());if(n===0)return Math.PI/2;const i=this.dot(e)/n;return Math.acos(lt(i,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){const n=this.x-e.x,i=this.y-e.y;return n*n+i*i}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,n){return this.x+=(e.x-this.x)*n,this.y+=(e.y-this.y)*n,this}lerpVectors(e,n,i){return this.x=e.x+(n.x-e.x)*i,this.y=e.y+(n.y-e.y)*i,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,n=0){return this.x=e[n],this.y=e[n+1],this}toArray(e=[],n=0){return e[n]=this.x,e[n+1]=this.y,e}fromBufferAttribute(e,n){return this.x=e.getX(n),this.y=e.getY(n),this}rotateAround(e,n){const i=Math.cos(n),r=Math.sin(n),s=this.x-e.x,a=this.y-e.y;return this.x=s*i-a*r+e.x,this.y=s*r+a*i+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}};tm.prototype.isVector2=!0;let We=tm;class cs{constructor(e=0,n=0,i=0,r=1){this.isQuaternion=!0,this._x=e,this._y=n,this._z=i,this._w=r}static slerpFlat(e,n,i,r,s,a,o){let l=i[r+0],c=i[r+1],h=i[r+2],p=i[r+3],f=s[a+0],g=s[a+1],v=s[a+2],S=s[a+3];if(p!==S||l!==f||c!==g||h!==v){let _=l*f+c*g+h*v+p*S;_<0&&(f=-f,g=-g,v=-v,S=-S,_=-_);let d=1-o;if(_<.9995){const m=Math.acos(_),M=Math.sin(m);d=Math.sin(d*m)/M,o=Math.sin(o*m)/M,l=l*d+f*o,c=c*d+g*o,h=h*d+v*o,p=p*d+S*o}else{l=l*d+f*o,c=c*d+g*o,h=h*d+v*o,p=p*d+S*o;const m=1/Math.sqrt(l*l+c*c+h*h+p*p);l*=m,c*=m,h*=m,p*=m}}e[n]=l,e[n+1]=c,e[n+2]=h,e[n+3]=p}static multiplyQuaternionsFlat(e,n,i,r,s,a){const o=i[r],l=i[r+1],c=i[r+2],h=i[r+3],p=s[a],f=s[a+1],g=s[a+2],v=s[a+3];return e[n]=o*v+h*p+l*g-c*f,e[n+1]=l*v+h*f+c*p-o*g,e[n+2]=c*v+h*g+o*f-l*p,e[n+3]=h*v-o*p-l*f-c*g,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,n,i,r){return this._x=e,this._y=n,this._z=i,this._w=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,n=!0){const i=e._x,r=e._y,s=e._z,a=e._order,o=Math.cos,l=Math.sin,c=o(i/2),h=o(r/2),p=o(s/2),f=l(i/2),g=l(r/2),v=l(s/2);switch(a){case"XYZ":this._x=f*h*p+c*g*v,this._y=c*g*p-f*h*v,this._z=c*h*v+f*g*p,this._w=c*h*p-f*g*v;break;case"YXZ":this._x=f*h*p+c*g*v,this._y=c*g*p-f*h*v,this._z=c*h*v-f*g*p,this._w=c*h*p+f*g*v;break;case"ZXY":this._x=f*h*p-c*g*v,this._y=c*g*p+f*h*v,this._z=c*h*v+f*g*p,this._w=c*h*p-f*g*v;break;case"ZYX":this._x=f*h*p-c*g*v,this._y=c*g*p+f*h*v,this._z=c*h*v-f*g*p,this._w=c*h*p+f*g*v;break;case"YZX":this._x=f*h*p+c*g*v,this._y=c*g*p+f*h*v,this._z=c*h*v-f*g*p,this._w=c*h*p-f*g*v;break;case"XZY":this._x=f*h*p-c*g*v,this._y=c*g*p-f*h*v,this._z=c*h*v+f*g*p,this._w=c*h*p+f*g*v;break;default:Ve("Quaternion: .setFromEuler() encountered an unknown order: "+a)}return n===!0&&this._onChangeCallback(),this}setFromAxisAngle(e,n){const i=n/2,r=Math.sin(i);return this._x=e.x*r,this._y=e.y*r,this._z=e.z*r,this._w=Math.cos(i),this._onChangeCallback(),this}setFromRotationMatrix(e){const n=e.elements,i=n[0],r=n[4],s=n[8],a=n[1],o=n[5],l=n[9],c=n[2],h=n[6],p=n[10],f=i+o+p;if(f>0){const g=.5/Math.sqrt(f+1);this._w=.25/g,this._x=(h-l)*g,this._y=(s-c)*g,this._z=(a-r)*g}else if(i>o&&i>p){const g=2*Math.sqrt(1+i-o-p);this._w=(h-l)/g,this._x=.25*g,this._y=(r+a)/g,this._z=(s+c)/g}else if(o>p){const g=2*Math.sqrt(1+o-i-p);this._w=(s-c)/g,this._x=(r+a)/g,this._y=.25*g,this._z=(l+h)/g}else{const g=2*Math.sqrt(1+p-i-o);this._w=(a-r)/g,this._x=(s+c)/g,this._y=(l+h)/g,this._z=.25*g}return this._onChangeCallback(),this}setFromUnitVectors(e,n){let i=e.dot(n)+1;return i<1e-8?(i=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=i):(this._x=0,this._y=-e.z,this._z=e.y,this._w=i)):(this._x=e.y*n.z-e.z*n.y,this._y=e.z*n.x-e.x*n.z,this._z=e.x*n.y-e.y*n.x,this._w=i),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(lt(this.dot(e),-1,1)))}rotateTowards(e,n){const i=this.angleTo(e);if(i===0)return this;const r=Math.min(1,n/i);return this.slerp(e,r),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x=this._x*e,this._y=this._y*e,this._z=this._z*e,this._w=this._w*e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,n){const i=e._x,r=e._y,s=e._z,a=e._w,o=n._x,l=n._y,c=n._z,h=n._w;return this._x=i*h+a*o+r*c-s*l,this._y=r*h+a*l+s*o-i*c,this._z=s*h+a*c+i*l-r*o,this._w=a*h-i*o-r*l-s*c,this._onChangeCallback(),this}slerp(e,n){let i=e._x,r=e._y,s=e._z,a=e._w,o=this.dot(e);o<0&&(i=-i,r=-r,s=-s,a=-a,o=-o);let l=1-n;if(o<.9995){const c=Math.acos(o),h=Math.sin(c);l=Math.sin(l*c)/h,n=Math.sin(n*c)/h,this._x=this._x*l+i*n,this._y=this._y*l+r*n,this._z=this._z*l+s*n,this._w=this._w*l+a*n,this._onChangeCallback()}else this._x=this._x*l+i*n,this._y=this._y*l+r*n,this._z=this._z*l+s*n,this._w=this._w*l+a*n,this.normalize();return this}slerpQuaternions(e,n,i){return this.copy(e).slerp(n,i)}random(){const e=2*Math.PI*Math.random(),n=2*Math.PI*Math.random(),i=Math.random(),r=Math.sqrt(1-i),s=Math.sqrt(i);return this.set(r*Math.sin(e),r*Math.cos(e),s*Math.sin(n),s*Math.cos(n))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,n=0){return this._x=e[n],this._y=e[n+1],this._z=e[n+2],this._w=e[n+3],this._onChangeCallback(),this}toArray(e=[],n=0){return e[n]=this._x,e[n+1]=this._y,e[n+2]=this._z,e[n+3]=this._w,e}fromBufferAttribute(e,n){return this._x=e.getX(n),this._y=e.getY(n),this._z=e.getZ(n),this._w=e.getW(n),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}}const nm=class nm{constructor(e=0,n=0,i=0){this.x=e,this.y=n,this.z=i}set(e,n,i){return i===void 0&&(i=this.z),this.x=e,this.y=n,this.z=i,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,n){switch(e){case 0:this.x=n;break;case 1:this.y=n;break;case 2:this.z=n;break;default:throw new Error("THREE.Vector3: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("THREE.Vector3: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,n){return this.x=e.x+n.x,this.y=e.y+n.y,this.z=e.z+n.z,this}addScaledVector(e,n){return this.x+=e.x*n,this.y+=e.y*n,this.z+=e.z*n,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,n){return this.x=e.x-n.x,this.y=e.y-n.y,this.z=e.z-n.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,n){return this.x=e.x*n.x,this.y=e.y*n.y,this.z=e.z*n.z,this}applyEuler(e){return this.applyQuaternion(P0.setFromEuler(e))}applyAxisAngle(e,n){return this.applyQuaternion(P0.setFromAxisAngle(e,n))}applyMatrix3(e){const n=this.x,i=this.y,r=this.z,s=e.elements;return this.x=s[0]*n+s[3]*i+s[6]*r,this.y=s[1]*n+s[4]*i+s[7]*r,this.z=s[2]*n+s[5]*i+s[8]*r,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){const n=this.x,i=this.y,r=this.z,s=e.elements,a=1/(s[3]*n+s[7]*i+s[11]*r+s[15]);return this.x=(s[0]*n+s[4]*i+s[8]*r+s[12])*a,this.y=(s[1]*n+s[5]*i+s[9]*r+s[13])*a,this.z=(s[2]*n+s[6]*i+s[10]*r+s[14])*a,this}applyQuaternion(e){const n=this.x,i=this.y,r=this.z,s=e.x,a=e.y,o=e.z,l=e.w,c=2*(a*r-o*i),h=2*(o*n-s*r),p=2*(s*i-a*n);return this.x=n+l*c+a*p-o*h,this.y=i+l*h+o*c-s*p,this.z=r+l*p+s*h-a*c,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){const n=this.x,i=this.y,r=this.z,s=e.elements;return this.x=s[0]*n+s[4]*i+s[8]*r,this.y=s[1]*n+s[5]*i+s[9]*r,this.z=s[2]*n+s[6]*i+s[10]*r,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,n){return this.x=lt(this.x,e.x,n.x),this.y=lt(this.y,e.y,n.y),this.z=lt(this.z,e.z,n.z),this}clampScalar(e,n){return this.x=lt(this.x,e,n),this.y=lt(this.y,e,n),this.z=lt(this.z,e,n),this}clampLength(e,n){const i=this.length();return this.divideScalar(i||1).multiplyScalar(lt(i,e,n))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,n){return this.x+=(e.x-this.x)*n,this.y+=(e.y-this.y)*n,this.z+=(e.z-this.z)*n,this}lerpVectors(e,n,i){return this.x=e.x+(n.x-e.x)*i,this.y=e.y+(n.y-e.y)*i,this.z=e.z+(n.z-e.z)*i,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,n){const i=e.x,r=e.y,s=e.z,a=n.x,o=n.y,l=n.z;return this.x=r*l-s*o,this.y=s*a-i*l,this.z=i*o-r*a,this}projectOnVector(e){const n=e.lengthSq();if(n===0)return this.set(0,0,0);const i=e.dot(this)/n;return this.copy(e).multiplyScalar(i)}projectOnPlane(e){return pd.copy(this).projectOnVector(e),this.sub(pd)}reflect(e){return this.sub(pd.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){const n=Math.sqrt(this.lengthSq()*e.lengthSq());if(n===0)return Math.PI/2;const i=this.dot(e)/n;return Math.acos(lt(i,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){const n=this.x-e.x,i=this.y-e.y,r=this.z-e.z;return n*n+i*i+r*r}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,n,i){const r=Math.sin(n)*e;return this.x=r*Math.sin(i),this.y=Math.cos(n)*e,this.z=r*Math.cos(i),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,n,i){return this.x=e*Math.sin(n),this.y=i,this.z=e*Math.cos(n),this}setFromMatrixPosition(e){const n=e.elements;return this.x=n[12],this.y=n[13],this.z=n[14],this}setFromMatrixScale(e){const n=this.setFromMatrixColumn(e,0).length(),i=this.setFromMatrixColumn(e,1).length(),r=this.setFromMatrixColumn(e,2).length();return this.x=n,this.y=i,this.z=r,this}setFromMatrixColumn(e,n){return this.fromArray(e.elements,n*4)}setFromMatrix3Column(e,n){return this.fromArray(e.elements,n*3)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}setFromColor(e){return this.x=e.r,this.y=e.g,this.z=e.b,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,n=0){return this.x=e[n],this.y=e[n+1],this.z=e[n+2],this}toArray(e=[],n=0){return e[n]=this.x,e[n+1]=this.y,e[n+2]=this.z,e}fromBufferAttribute(e,n){return this.x=e.getX(n),this.y=e.getY(n),this.z=e.getZ(n),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){const e=Math.random()*Math.PI*2,n=Math.random()*2-1,i=Math.sqrt(1-n*n);return this.x=i*Math.cos(e),this.y=n,this.z=i*Math.sin(e),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}};nm.prototype.isVector3=!0;let I=nm;const pd=new I,P0=new cs,im=class im{constructor(e,n,i,r,s,a,o,l,c){this.elements=[1,0,0,0,1,0,0,0,1],e!==void 0&&this.set(e,n,i,r,s,a,o,l,c)}set(e,n,i,r,s,a,o,l,c){const h=this.elements;return h[0]=e,h[1]=r,h[2]=o,h[3]=n,h[4]=s,h[5]=l,h[6]=i,h[7]=a,h[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){const n=this.elements,i=e.elements;return n[0]=i[0],n[1]=i[1],n[2]=i[2],n[3]=i[3],n[4]=i[4],n[5]=i[5],n[6]=i[6],n[7]=i[7],n[8]=i[8],this}extractBasis(e,n,i){return e.setFromMatrix3Column(this,0),n.setFromMatrix3Column(this,1),i.setFromMatrix3Column(this,2),this}setFromMatrix4(e){const n=e.elements;return this.set(n[0],n[4],n[8],n[1],n[5],n[9],n[2],n[6],n[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,n){const i=e.elements,r=n.elements,s=this.elements,a=i[0],o=i[3],l=i[6],c=i[1],h=i[4],p=i[7],f=i[2],g=i[5],v=i[8],S=r[0],_=r[3],d=r[6],m=r[1],M=r[4],y=r[7],T=r[2],E=r[5],C=r[8];return s[0]=a*S+o*m+l*T,s[3]=a*_+o*M+l*E,s[6]=a*d+o*y+l*C,s[1]=c*S+h*m+p*T,s[4]=c*_+h*M+p*E,s[7]=c*d+h*y+p*C,s[2]=f*S+g*m+v*T,s[5]=f*_+g*M+v*E,s[8]=f*d+g*y+v*C,this}multiplyScalar(e){const n=this.elements;return n[0]*=e,n[3]*=e,n[6]*=e,n[1]*=e,n[4]*=e,n[7]*=e,n[2]*=e,n[5]*=e,n[8]*=e,this}determinant(){const e=this.elements,n=e[0],i=e[1],r=e[2],s=e[3],a=e[4],o=e[5],l=e[6],c=e[7],h=e[8];return n*a*h-n*o*c-i*s*h+i*o*l+r*s*c-r*a*l}invert(){const e=this.elements,n=e[0],i=e[1],r=e[2],s=e[3],a=e[4],o=e[5],l=e[6],c=e[7],h=e[8],p=h*a-o*c,f=o*l-h*s,g=c*s-a*l,v=n*p+i*f+r*g;if(v===0)return this.set(0,0,0,0,0,0,0,0,0);const S=1/v;return e[0]=p*S,e[1]=(r*c-h*i)*S,e[2]=(o*i-r*a)*S,e[3]=f*S,e[4]=(h*n-r*l)*S,e[5]=(r*s-o*n)*S,e[6]=g*S,e[7]=(i*l-c*n)*S,e[8]=(a*n-i*s)*S,this}transpose(){let e;const n=this.elements;return e=n[1],n[1]=n[3],n[3]=e,e=n[2],n[2]=n[6],n[6]=e,e=n[5],n[5]=n[7],n[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){const n=this.elements;return e[0]=n[0],e[1]=n[3],e[2]=n[6],e[3]=n[1],e[4]=n[4],e[5]=n[7],e[6]=n[2],e[7]=n[5],e[8]=n[8],this}setUvTransform(e,n,i,r,s,a,o){const l=Math.cos(s),c=Math.sin(s);return this.set(i*l,i*c,-i*(l*a+c*o)+a+e,-r*c,r*l,-r*(-c*a+l*o)+o+n,0,0,1),this}scale(e,n){return Na("Matrix3: .scale() is deprecated. Use .makeScale() instead."),this.premultiply(md.makeScale(e,n)),this}rotate(e){return Na("Matrix3: .rotate() is deprecated. Use .makeRotation() instead."),this.premultiply(md.makeRotation(-e)),this}translate(e,n){return Na("Matrix3: .translate() is deprecated. Use .makeTranslation() instead."),this.premultiply(md.makeTranslation(e,n)),this}makeTranslation(e,n){return e.isVector2?this.set(1,0,e.x,0,1,e.y,0,0,1):this.set(1,0,e,0,1,n,0,0,1),this}makeRotation(e){const n=Math.cos(e),i=Math.sin(e);return this.set(n,-i,0,i,n,0,0,0,1),this}makeScale(e,n){return this.set(e,0,0,0,n,0,0,0,1),this}equals(e){const n=this.elements,i=e.elements;for(let r=0;r<9;r++)if(n[r]!==i[r])return!1;return!0}fromArray(e,n=0){for(let i=0;i<9;i++)this.elements[i]=e[i+n];return this}toArray(e=[],n=0){const i=this.elements;return e[n]=i[0],e[n+1]=i[1],e[n+2]=i[2],e[n+3]=i[3],e[n+4]=i[4],e[n+5]=i[5],e[n+6]=i[6],e[n+7]=i[7],e[n+8]=i[8],e}clone(){return new this.constructor().fromArray(this.elements)}};im.prototype.isMatrix3=!0;let Ye=im;const md=new Ye,N0=new Ye().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),L0=new Ye().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function DE(){const t={enabled:!0,workingColorSpace:Jc,spaces:{},convert:function(r,s,a){return this.enabled===!1||s===a||!s||!a||(this.spaces[s].transfer===Tt&&(r.r=Ar(r.r),r.g=Ar(r.g),r.b=Ar(r.b)),this.spaces[s].primaries!==this.spaces[a].primaries&&(r.applyMatrix3(this.spaces[s].toXYZ),r.applyMatrix3(this.spaces[a].fromXYZ)),this.spaces[a].transfer===Tt&&(r.r=La(r.r),r.g=La(r.g),r.b=La(r.b))),r},workingToColorSpace:function(r,s){return this.convert(r,this.workingColorSpace,s)},colorSpaceToWorking:function(r,s){return this.convert(r,s,this.workingColorSpace)},getPrimaries:function(r){return this.spaces[r].primaries},getTransfer:function(r){return r===Yr?eu:this.spaces[r].transfer},getToneMappingMode:function(r){return this.spaces[r].outputColorSpaceConfig.toneMappingMode||"standard"},getLuminanceCoefficients:function(r,s=this.workingColorSpace){return r.fromArray(this.spaces[s].luminanceCoefficients)},define:function(r){Object.assign(this.spaces,r)},_getMatrix:function(r,s,a){return r.copy(this.spaces[s].toXYZ).multiply(this.spaces[a].fromXYZ)},_getDrawingBufferColorSpace:function(r){return this.spaces[r].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(r=this.workingColorSpace){return this.spaces[r].workingColorSpaceConfig.unpackColorSpace},fromWorkingColorSpace:function(r,s){return Na("ColorManagement: .fromWorkingColorSpace() has been renamed to .workingToColorSpace()."),t.workingToColorSpace(r,s)},toWorkingColorSpace:function(r,s){return Na("ColorManagement: .toWorkingColorSpace() has been renamed to .colorSpaceToWorking()."),t.colorSpaceToWorking(r,s)}},e=[.64,.33,.3,.6,.15,.06],n=[.2126,.7152,.0722],i=[.3127,.329];return t.define({[Jc]:{primaries:e,whitePoint:i,transfer:eu,toXYZ:N0,fromXYZ:L0,luminanceCoefficients:n,workingColorSpaceConfig:{unpackColorSpace:ei},outputColorSpaceConfig:{drawingBufferColorSpace:ei}},[ei]:{primaries:e,whitePoint:i,transfer:Tt,toXYZ:N0,fromXYZ:L0,luminanceCoefficients:n,outputColorSpaceConfig:{drawingBufferColorSpace:ei}}}),t}const ft=DE();function Ar(t){return t<.04045?t*.0773993808:Math.pow(t*.9478672986+.0521327014,2.4)}function La(t){return t<.0031308?t*12.92:1.055*Math.pow(t,.41666)-.055}let $s;class IE{static getDataURL(e,n="image/png"){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>"u")return e.src;let i;if(e instanceof HTMLCanvasElement)i=e;else{$s===void 0&&($s=tu("canvas")),$s.width=e.width,$s.height=e.height;const r=$s.getContext("2d");e instanceof ImageData?r.putImageData(e,0,0):r.drawImage(e,0,0,e.width,e.height),i=$s}return i.toDataURL(n)}static sRGBToLinear(e){if(typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&e instanceof ImageBitmap){const n=tu("canvas");n.width=e.width,n.height=e.height;const i=n.getContext("2d");i.drawImage(e,0,0,e.width,e.height);const r=i.getImageData(0,0,e.width,e.height),s=r.data;for(let a=0;a<s.length;a++)s[a]=Ar(s[a]/255)*255;return i.putImageData(r,0,0),n}else if(e.data){const n=e.data.slice(0);for(let i=0;i<n.length;i++)n instanceof Uint8Array||n instanceof Uint8ClampedArray?n[i]=Math.floor(Ar(n[i]/255)*255):n[i]=Ar(n[i]);return{data:n,width:e.width,height:e.height}}else return Ve("ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),e}}let UE=0;class kp{constructor(e=null){this.isTextureSource=!0,Object.defineProperty(this,"id",{value:UE++}),this.uuid=dl(),this.data=e,this.dataReady=!0,this.version=0}getSize(e){const n=this.data;return typeof HTMLVideoElement<"u"&&n instanceof HTMLVideoElement?e.set(n.videoWidth,n.videoHeight,0):typeof VideoFrame<"u"&&n instanceof VideoFrame?e.set(n.displayWidth,n.displayHeight,0):n!==null?e.set(n.width,n.height,n.depth||0):e.set(0,0,0),e}set needsUpdate(e){e===!0&&this.version++}toJSON(e){const n=e===void 0||typeof e=="string";if(!n&&e.images[this.uuid]!==void 0)return e.images[this.uuid];const i={uuid:this.uuid,url:""},r=this.data;if(r!==null){let s;if(Array.isArray(r)){s=[];for(let a=0,o=r.length;a<o;a++)r[a].isDataTexture?s.push(gd(r[a].image)):s.push(gd(r[a]))}else s=gd(r);i.url=s}return n||(e.images[this.uuid]=i),i}}function gd(t){return typeof HTMLImageElement<"u"&&t instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&t instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&t instanceof ImageBitmap?IE.getDataURL(t):t.data?{data:Array.from(t.data),width:t.width,height:t.height,type:t.data.constructor.name}:(Ve("Texture: Unable to serialize Texture."),{})}let FE=0;const _d=new I;class An extends ps{constructor(e=An.DEFAULT_IMAGE,n=An.DEFAULT_MAPPING,i=wr,r=wr,s=bn,a=Cs,o=Ui,l=ni,c=An.DEFAULT_ANISOTROPY,h=Yr){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:FE++}),this.uuid=dl(),this.name="",this.source=new kp(e),this.mipmaps=[],this.mapping=n,this.channel=0,this.wrapS=i,this.wrapT=r,this.magFilter=s,this.minFilter=a,this.anisotropy=c,this.format=o,this.internalFormat=null,this.type=l,this.offset=new We(0,0),this.repeat=new We(1,1),this.center=new We(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new Ye,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=h,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.isArrayTexture=!!(e&&e.depth&&e.depth>1),this.pmremVersion=0,this.normalized=!1}get width(){return this.source.getSize(_d).x}get height(){return this.source.getSize(_d).y}get depth(){return this.source.getSize(_d).z}get image(){return this.source.data}set image(e){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}addUpdateRange(e,n){this.updateRanges.push({start:e,count:n})}clearUpdateRanges(){this.updateRanges.length=0}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.channel=e.channel,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.normalized=e.normalized,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.colorSpace=e.colorSpace,this.renderTarget=e.renderTarget,this.isRenderTargetTexture=e.isRenderTargetTexture,this.isArrayTexture=e.isArrayTexture,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}setValues(e){for(const n in e){const i=e[n];if(i===void 0){Ve(`Texture.setValues(): parameter '${n}' has value of undefined.`);continue}const r=this[n];if(r===void 0){Ve(`Texture.setValues(): property '${n}' does not exist.`);continue}r&&i&&r.isVector2&&i.isVector2||r&&i&&r.isVector3&&i.isVector3||r&&i&&r.isMatrix3&&i.isMatrix3?r.copy(i):this[n]=i}}toJSON(e){const n=e===void 0||typeof e=="string";if(!n&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];const i={metadata:{version:4.7,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,normalized:this.normalized,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(i.userData=this.userData),n||(e.textures[this.uuid]=i),i}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(e){if(this.mapping!==px)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case Xf:e.x=e.x-Math.floor(e.x);break;case wr:e.x=e.x<0?0:1;break;case $f:Math.abs(Math.floor(e.x)%2)===1?e.x=Math.ceil(e.x)-e.x:e.x=e.x-Math.floor(e.x);break}if(e.y<0||e.y>1)switch(this.wrapT){case Xf:e.y=e.y-Math.floor(e.y);break;case wr:e.y=e.y<0?0:1;break;case $f:Math.abs(Math.floor(e.y)%2)===1?e.y=Math.ceil(e.y)-e.y:e.y=e.y-Math.floor(e.y);break}return this.flipY&&(e.y=1-e.y),e}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(e){e===!0&&this.pmremVersion++}}An.DEFAULT_IMAGE=null;An.DEFAULT_MAPPING=px;An.DEFAULT_ANISOTROPY=1;const rm=class rm{constructor(e=0,n=0,i=0,r=1){this.x=e,this.y=n,this.z=i,this.w=r}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,n,i,r){return this.x=e,this.y=n,this.z=i,this.w=r,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,n){switch(e){case 0:this.x=n;break;case 1:this.y=n;break;case 2:this.z=n;break;case 3:this.w=n;break;default:throw new Error("THREE.Vector4: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("THREE.Vector4: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w!==void 0?e.w:1,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,n){return this.x=e.x+n.x,this.y=e.y+n.y,this.z=e.z+n.z,this.w=e.w+n.w,this}addScaledVector(e,n){return this.x+=e.x*n,this.y+=e.y*n,this.z+=e.z*n,this.w+=e.w*n,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,n){return this.x=e.x-n.x,this.y=e.y-n.y,this.z=e.z-n.z,this.w=e.w-n.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){const n=this.x,i=this.y,r=this.z,s=this.w,a=e.elements;return this.x=a[0]*n+a[4]*i+a[8]*r+a[12]*s,this.y=a[1]*n+a[5]*i+a[9]*r+a[13]*s,this.z=a[2]*n+a[6]*i+a[10]*r+a[14]*s,this.w=a[3]*n+a[7]*i+a[11]*r+a[15]*s,this}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this.w/=e.w,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);const n=Math.sqrt(1-e.w*e.w);return n<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/n,this.y=e.y/n,this.z=e.z/n),this}setAxisAngleFromRotationMatrix(e){let n,i,r,s;const l=e.elements,c=l[0],h=l[4],p=l[8],f=l[1],g=l[5],v=l[9],S=l[2],_=l[6],d=l[10];if(Math.abs(h-f)<.01&&Math.abs(p-S)<.01&&Math.abs(v-_)<.01){if(Math.abs(h+f)<.1&&Math.abs(p+S)<.1&&Math.abs(v+_)<.1&&Math.abs(c+g+d-3)<.1)return this.set(1,0,0,0),this;n=Math.PI;const M=(c+1)/2,y=(g+1)/2,T=(d+1)/2,E=(h+f)/4,C=(p+S)/4,x=(v+_)/4;return M>y&&M>T?M<.01?(i=0,r=.707106781,s=.707106781):(i=Math.sqrt(M),r=E/i,s=C/i):y>T?y<.01?(i=.707106781,r=0,s=.707106781):(r=Math.sqrt(y),i=E/r,s=x/r):T<.01?(i=.707106781,r=.707106781,s=0):(s=Math.sqrt(T),i=C/s,r=x/s),this.set(i,r,s,n),this}let m=Math.sqrt((_-v)*(_-v)+(p-S)*(p-S)+(f-h)*(f-h));return Math.abs(m)<.001&&(m=1),this.x=(_-v)/m,this.y=(p-S)/m,this.z=(f-h)/m,this.w=Math.acos((c+g+d-1)/2),this}setFromMatrixPosition(e){const n=e.elements;return this.x=n[12],this.y=n[13],this.z=n[14],this.w=n[15],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,n){return this.x=lt(this.x,e.x,n.x),this.y=lt(this.y,e.y,n.y),this.z=lt(this.z,e.z,n.z),this.w=lt(this.w,e.w,n.w),this}clampScalar(e,n){return this.x=lt(this.x,e,n),this.y=lt(this.y,e,n),this.z=lt(this.z,e,n),this.w=lt(this.w,e,n),this}clampLength(e,n){const i=this.length();return this.divideScalar(i||1).multiplyScalar(lt(i,e,n))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,n){return this.x+=(e.x-this.x)*n,this.y+=(e.y-this.y)*n,this.z+=(e.z-this.z)*n,this.w+=(e.w-this.w)*n,this}lerpVectors(e,n,i){return this.x=e.x+(n.x-e.x)*i,this.y=e.y+(n.y-e.y)*i,this.z=e.z+(n.z-e.z)*i,this.w=e.w+(n.w-e.w)*i,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,n=0){return this.x=e[n],this.y=e[n+1],this.z=e[n+2],this.w=e[n+3],this}toArray(e=[],n=0){return e[n]=this.x,e[n+1]=this.y,e[n+2]=this.z,e[n+3]=this.w,e}fromBufferAttribute(e,n){return this.x=e.getX(n),this.y=e.getY(n),this.z=e.getZ(n),this.w=e.getW(n),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}};rm.prototype.isVector4=!0;let Gt=rm;class OE extends ps{constructor(e=1,n=1,i={}){super(),i=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:bn,depthBuffer:!0,stencilBuffer:!1,resolveColorBuffer:!0,resolveDepthBuffer:!0,resolveStencilBuffer:!0,storeMultisampledColorBuffer:!0,storeMultisampledDepthBuffer:!0,storeMultisampledStencilBuffer:!0,depthTexture:null,samples:0,count:1,depth:1,multiview:!1,useArrayDepthTexture:!1},i),this.isRenderTarget=!0,this.width=e,this.height=n,this.depth=i.depth,this.scissor=new Gt(0,0,e,n),this.scissorTest=!1,this.viewport=new Gt(0,0,e,n),this.textures=[];const r={width:e,height:n,depth:i.depth},s=new An(r),a=i.count;for(let o=0;o<a;o++)this.textures[o]=s.clone(),this.textures[o].isRenderTargetTexture=!0,this.textures[o].renderTarget=this;this._setTextureOptions(i),this.depthBuffer=i.depthBuffer,this.stencilBuffer=i.stencilBuffer,this.resolveColorBuffer=i.resolveColorBuffer,this.resolveDepthBuffer=i.resolveDepthBuffer,this.resolveStencilBuffer=i.resolveStencilBuffer,this.storeMultisampledColorBuffer=i.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=i.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=i.storeMultisampledStencilBuffer,this._depthTexture=null,this.depthTexture=i.depthTexture,this.samples=i.samples,this.multiview=i.multiview,this.useArrayDepthTexture=i.useArrayDepthTexture}_setTextureOptions(e={}){const n={minFilter:bn,generateMipmaps:!1,flipY:!1,internalFormat:null};e.mapping!==void 0&&(n.mapping=e.mapping),e.wrapS!==void 0&&(n.wrapS=e.wrapS),e.wrapT!==void 0&&(n.wrapT=e.wrapT),e.wrapR!==void 0&&(n.wrapR=e.wrapR),e.magFilter!==void 0&&(n.magFilter=e.magFilter),e.minFilter!==void 0&&(n.minFilter=e.minFilter),e.format!==void 0&&(n.format=e.format),e.type!==void 0&&(n.type=e.type),e.anisotropy!==void 0&&(n.anisotropy=e.anisotropy),e.colorSpace!==void 0&&(n.colorSpace=e.colorSpace),e.flipY!==void 0&&(n.flipY=e.flipY),e.generateMipmaps!==void 0&&(n.generateMipmaps=e.generateMipmaps),e.internalFormat!==void 0&&(n.internalFormat=e.internalFormat);for(let i=0;i<this.textures.length;i++)this.textures[i].setValues(n)}get texture(){return this.textures[0]}set texture(e){this.textures[0]=e}set depthTexture(e){this._depthTexture!==null&&this._depthTexture.renderTarget===this&&(this._depthTexture.renderTarget=null),e!==null&&e.renderTarget===null&&(e.renderTarget=this),this._depthTexture=e}get depthTexture(){return this._depthTexture}setSize(e,n,i=1){if(this.width!==e||this.height!==n||this.depth!==i){this.width=e,this.height=n,this.depth=i;for(let r=0,s=this.textures.length;r<s;r++)this.textures[r].image.width=e,this.textures[r].image.height=n,this.textures[r].image.depth=i,this.textures[r].isData3DTexture!==!0&&(this.textures[r].isArrayTexture=this.textures[r].image.depth>1);this.dispose()}this.viewport.set(0,0,e,n),this.scissor.set(0,0,e,n)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.scissor.copy(e.scissor),this.scissorTest=e.scissorTest,this.viewport.copy(e.viewport),this.textures.length=0;for(let n=0,i=e.textures.length;n<i;n++){this.textures[n]=e.textures[n].clone(),this.textures[n].isRenderTargetTexture=!0,this.textures[n].renderTarget=this;const r=Object.assign({},e.textures[n].image);this.textures[n].source=new kp(r)}if(this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,this.resolveColorBuffer=e.resolveColorBuffer,this.resolveDepthBuffer=e.resolveDepthBuffer,this.resolveStencilBuffer=e.resolveStencilBuffer,this.storeMultisampledColorBuffer=e.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=e.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=e.storeMultisampledStencilBuffer,e.depthTexture!==null)if(e.depthTexture.renderTarget===e){const n=e.depthTexture.clone();n.renderTarget=null,this.depthTexture=n}else this.depthTexture=e.depthTexture;return this.samples=e.samples,this.multiview=e.multiview,this.useArrayDepthTexture=e.useArrayDepthTexture,this}dispose(){this.dispatchEvent({type:"dispose"})}}class ki extends OE{constructor(e=1,n=1,i={}){super(e,n,i),this.isWebGLRenderTarget=!0}}class Ex extends An{constructor(e=null,n=1,i=1,r=1){super(null),this.isDataArrayTexture=!0,this.image={data:e,width:n,height:i,depth:r},this.magFilter=gn,this.minFilter=gn,this.wrapR=wr,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}copy(e){return super.copy(e),this.wrapR=e.wrapR,this}addLayerUpdate(e){this.layerUpdates.add(e)}clearLayerUpdates(){this.layerUpdates.clear()}}class kE extends An{constructor(e=null,n=1,i=1,r=1){super(null),this.isData3DTexture=!0,this.image={data:e,width:n,height:i,depth:r},this.magFilter=gn,this.minFilter=gn,this.wrapR=wr,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}copy(e){return super.copy(e),this.wrapR=e.wrapR,this}}const ou=class ou{constructor(e,n,i,r,s,a,o,l,c,h,p,f,g,v,S,_){this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],e!==void 0&&this.set(e,n,i,r,s,a,o,l,c,h,p,f,g,v,S,_)}set(e,n,i,r,s,a,o,l,c,h,p,f,g,v,S,_){const d=this.elements;return d[0]=e,d[4]=n,d[8]=i,d[12]=r,d[1]=s,d[5]=a,d[9]=o,d[13]=l,d[2]=c,d[6]=h,d[10]=p,d[14]=f,d[3]=g,d[7]=v,d[11]=S,d[15]=_,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new ou().fromArray(this.elements)}copy(e){const n=this.elements,i=e.elements;return n[0]=i[0],n[1]=i[1],n[2]=i[2],n[3]=i[3],n[4]=i[4],n[5]=i[5],n[6]=i[6],n[7]=i[7],n[8]=i[8],n[9]=i[9],n[10]=i[10],n[11]=i[11],n[12]=i[12],n[13]=i[13],n[14]=i[14],n[15]=i[15],this}copyPosition(e){const n=this.elements,i=e.elements;return n[12]=i[12],n[13]=i[13],n[14]=i[14],this}setFromMatrix3(e){const n=e.elements;return this.set(n[0],n[3],n[6],0,n[1],n[4],n[7],0,n[2],n[5],n[8],0,0,0,0,1),this}extractBasis(e,n,i){return this.determinantAffine()===0?(e.set(1,0,0),n.set(0,1,0),i.set(0,0,1),this):(e.setFromMatrixColumn(this,0),n.setFromMatrixColumn(this,1),i.setFromMatrixColumn(this,2),this)}makeBasis(e,n,i){return this.set(e.x,n.x,i.x,0,e.y,n.y,i.y,0,e.z,n.z,i.z,0,0,0,0,1),this}extractRotation(e){if(e.determinantAffine()===0)return this.identity();const n=this.elements,i=e.elements,r=1/qs.setFromMatrixColumn(e,0).length(),s=1/qs.setFromMatrixColumn(e,1).length(),a=1/qs.setFromMatrixColumn(e,2).length();return n[0]=i[0]*r,n[1]=i[1]*r,n[2]=i[2]*r,n[3]=0,n[4]=i[4]*s,n[5]=i[5]*s,n[6]=i[6]*s,n[7]=0,n[8]=i[8]*a,n[9]=i[9]*a,n[10]=i[10]*a,n[11]=0,n[12]=0,n[13]=0,n[14]=0,n[15]=1,this}makeRotationFromEuler(e){const n=this.elements,i=e.x,r=e.y,s=e.z,a=Math.cos(i),o=Math.sin(i),l=Math.cos(r),c=Math.sin(r),h=Math.cos(s),p=Math.sin(s);if(e.order==="XYZ"){const f=a*h,g=a*p,v=o*h,S=o*p;n[0]=l*h,n[4]=-l*p,n[8]=c,n[1]=g+v*c,n[5]=f-S*c,n[9]=-o*l,n[2]=S-f*c,n[6]=v+g*c,n[10]=a*l}else if(e.order==="YXZ"){const f=l*h,g=l*p,v=c*h,S=c*p;n[0]=f+S*o,n[4]=v*o-g,n[8]=a*c,n[1]=a*p,n[5]=a*h,n[9]=-o,n[2]=g*o-v,n[6]=S+f*o,n[10]=a*l}else if(e.order==="ZXY"){const f=l*h,g=l*p,v=c*h,S=c*p;n[0]=f-S*o,n[4]=-a*p,n[8]=v+g*o,n[1]=g+v*o,n[5]=a*h,n[9]=S-f*o,n[2]=-a*c,n[6]=o,n[10]=a*l}else if(e.order==="ZYX"){const f=a*h,g=a*p,v=o*h,S=o*p;n[0]=l*h,n[4]=v*c-g,n[8]=f*c+S,n[1]=l*p,n[5]=S*c+f,n[9]=g*c-v,n[2]=-c,n[6]=o*l,n[10]=a*l}else if(e.order==="YZX"){const f=a*l,g=a*c,v=o*l,S=o*c;n[0]=l*h,n[4]=S-f*p,n[8]=v*p+g,n[1]=p,n[5]=a*h,n[9]=-o*h,n[2]=-c*h,n[6]=g*p+v,n[10]=f-S*p}else if(e.order==="XZY"){const f=a*l,g=a*c,v=o*l,S=o*c;n[0]=l*h,n[4]=-p,n[8]=c*h,n[1]=f*p+S,n[5]=a*h,n[9]=g*p-v,n[2]=v*p-g,n[6]=o*h,n[10]=S*p+f}return n[3]=0,n[7]=0,n[11]=0,n[12]=0,n[13]=0,n[14]=0,n[15]=1,this}makeRotationFromQuaternion(e){return this.compose(BE,e,zE)}lookAt(e,n,i){const r=this.elements;return Zn.subVectors(e,n),Zn.lengthSq()===0&&(Zn.z=1),Zn.normalize(),zr.crossVectors(i,Zn),zr.lengthSq()===0&&(Math.abs(i.z)===1?Zn.x+=1e-4:Zn.z+=1e-4,Zn.normalize(),zr.crossVectors(i,Zn)),zr.normalize(),Il.crossVectors(Zn,zr),r[0]=zr.x,r[4]=Il.x,r[8]=Zn.x,r[1]=zr.y,r[5]=Il.y,r[9]=Zn.y,r[2]=zr.z,r[6]=Il.z,r[10]=Zn.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,n){const i=e.elements,r=n.elements,s=this.elements,a=i[0],o=i[4],l=i[8],c=i[12],h=i[1],p=i[5],f=i[9],g=i[13],v=i[2],S=i[6],_=i[10],d=i[14],m=i[3],M=i[7],y=i[11],T=i[15],E=r[0],C=r[4],x=r[8],b=r[12],P=r[1],D=r[5],O=r[9],F=r[13],U=r[2],W=r[6],N=r[10],z=r[14],k=r[3],j=r[7],L=r[11],$=r[15];return s[0]=a*E+o*P+l*U+c*k,s[4]=a*C+o*D+l*W+c*j,s[8]=a*x+o*O+l*N+c*L,s[12]=a*b+o*F+l*z+c*$,s[1]=h*E+p*P+f*U+g*k,s[5]=h*C+p*D+f*W+g*j,s[9]=h*x+p*O+f*N+g*L,s[13]=h*b+p*F+f*z+g*$,s[2]=v*E+S*P+_*U+d*k,s[6]=v*C+S*D+_*W+d*j,s[10]=v*x+S*O+_*N+d*L,s[14]=v*b+S*F+_*z+d*$,s[3]=m*E+M*P+y*U+T*k,s[7]=m*C+M*D+y*W+T*j,s[11]=m*x+M*O+y*N+T*L,s[15]=m*b+M*F+y*z+T*$,this}multiplyScalar(e){const n=this.elements;return n[0]*=e,n[4]*=e,n[8]*=e,n[12]*=e,n[1]*=e,n[5]*=e,n[9]*=e,n[13]*=e,n[2]*=e,n[6]*=e,n[10]*=e,n[14]*=e,n[3]*=e,n[7]*=e,n[11]*=e,n[15]*=e,this}determinant(){const e=this.elements,n=e[0],i=e[4],r=e[8],s=e[12],a=e[1],o=e[5],l=e[9],c=e[13],h=e[2],p=e[6],f=e[10],g=e[14],v=e[3],S=e[7],_=e[11],d=e[15],m=l*g-c*f,M=o*g-c*p,y=o*f-l*p,T=a*g-c*h,E=a*f-l*h,C=a*p-o*h;return n*(S*m-_*M+d*y)-i*(v*m-_*T+d*E)+r*(v*M-S*T+d*C)-s*(v*y-S*E+_*C)}determinantAffine(){const e=this.elements,n=e[0],i=e[4],r=e[8],s=e[1],a=e[5],o=e[9],l=e[2],c=e[6],h=e[10];return n*(a*h-o*c)-i*(s*h-o*l)+r*(s*c-a*l)}transpose(){const e=this.elements;let n;return n=e[1],e[1]=e[4],e[4]=n,n=e[2],e[2]=e[8],e[8]=n,n=e[6],e[6]=e[9],e[9]=n,n=e[3],e[3]=e[12],e[12]=n,n=e[7],e[7]=e[13],e[13]=n,n=e[11],e[11]=e[14],e[14]=n,this}setPosition(e,n,i){const r=this.elements;return e.isVector3?(r[12]=e.x,r[13]=e.y,r[14]=e.z):(r[12]=e,r[13]=n,r[14]=i),this}invert(){const e=this.elements,n=e[0],i=e[1],r=e[2],s=e[3],a=e[4],o=e[5],l=e[6],c=e[7],h=e[8],p=e[9],f=e[10],g=e[11],v=e[12],S=e[13],_=e[14],d=e[15],m=n*o-i*a,M=n*l-r*a,y=n*c-s*a,T=i*l-r*o,E=i*c-s*o,C=r*c-s*l,x=h*S-p*v,b=h*_-f*v,P=h*d-g*v,D=p*_-f*S,O=p*d-g*S,F=f*d-g*_,U=m*F-M*O+y*D+T*P-E*b+C*x;if(U===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);const W=1/U;return e[0]=(o*F-l*O+c*D)*W,e[1]=(r*O-i*F-s*D)*W,e[2]=(S*C-_*E+d*T)*W,e[3]=(f*E-p*C-g*T)*W,e[4]=(l*P-a*F-c*b)*W,e[5]=(n*F-r*P+s*b)*W,e[6]=(_*y-v*C-d*M)*W,e[7]=(h*C-f*y+g*M)*W,e[8]=(a*O-o*P+c*x)*W,e[9]=(i*P-n*O-s*x)*W,e[10]=(v*E-S*y+d*m)*W,e[11]=(p*y-h*E-g*m)*W,e[12]=(o*b-a*D-l*x)*W,e[13]=(n*D-i*b+r*x)*W,e[14]=(S*M-v*T-_*m)*W,e[15]=(h*T-p*M+f*m)*W,this}scale(e){const n=this.elements,i=e.x,r=e.y,s=e.z;return n[0]*=i,n[4]*=r,n[8]*=s,n[1]*=i,n[5]*=r,n[9]*=s,n[2]*=i,n[6]*=r,n[10]*=s,n[3]*=i,n[7]*=r,n[11]*=s,this}getMaxScaleOnAxis(){const e=this.elements,n=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],i=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],r=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(n,i,r))}makeTranslation(e,n,i){return e.isVector3?this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1):this.set(1,0,0,e,0,1,0,n,0,0,1,i,0,0,0,1),this}makeRotationX(e){const n=Math.cos(e),i=Math.sin(e);return this.set(1,0,0,0,0,n,-i,0,0,i,n,0,0,0,0,1),this}makeRotationY(e){const n=Math.cos(e),i=Math.sin(e);return this.set(n,0,i,0,0,1,0,0,-i,0,n,0,0,0,0,1),this}makeRotationZ(e){const n=Math.cos(e),i=Math.sin(e);return this.set(n,-i,0,0,i,n,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,n){const i=Math.cos(n),r=Math.sin(n),s=1-i,a=e.x,o=e.y,l=e.z,c=s*a,h=s*o;return this.set(c*a+i,c*o-r*l,c*l+r*o,0,c*o+r*l,h*o+i,h*l-r*a,0,c*l-r*o,h*l+r*a,s*l*l+i,0,0,0,0,1),this}makeScale(e,n,i){return this.set(e,0,0,0,0,n,0,0,0,0,i,0,0,0,0,1),this}makeShear(e,n,i,r,s,a){return this.set(1,i,s,0,e,1,a,0,n,r,1,0,0,0,0,1),this}compose(e,n,i){const r=this.elements,s=n._x,a=n._y,o=n._z,l=n._w,c=s+s,h=a+a,p=o+o,f=s*c,g=s*h,v=s*p,S=a*h,_=a*p,d=o*p,m=l*c,M=l*h,y=l*p,T=i.x,E=i.y,C=i.z;return r[0]=(1-(S+d))*T,r[1]=(g+y)*T,r[2]=(v-M)*T,r[3]=0,r[4]=(g-y)*E,r[5]=(1-(f+d))*E,r[6]=(_+m)*E,r[7]=0,r[8]=(v+M)*C,r[9]=(_-m)*C,r[10]=(1-(f+S))*C,r[11]=0,r[12]=e.x,r[13]=e.y,r[14]=e.z,r[15]=1,this}decompose(e,n,i){const r=this.elements;e.x=r[12],e.y=r[13],e.z=r[14];const s=this.determinantAffine();if(s===0)return i.set(1,1,1),n.identity(),this;let a=qs.set(r[0],r[1],r[2]).length();const o=qs.set(r[4],r[5],r[6]).length(),l=qs.set(r[8],r[9],r[10]).length();s<0&&(a=-a),Ai.copy(this);const c=1/a,h=1/o,p=1/l;return Ai.elements[0]*=c,Ai.elements[1]*=c,Ai.elements[2]*=c,Ai.elements[4]*=h,Ai.elements[5]*=h,Ai.elements[6]*=h,Ai.elements[8]*=p,Ai.elements[9]*=p,Ai.elements[10]*=p,n.setFromRotationMatrix(Ai),i.x=a,i.y=o,i.z=l,this}makePerspective(e,n,i,r,s,a,o=ir,l=!1){const c=this.elements,h=2*s/(n-e),p=2*s/(i-r),f=(n+e)/(n-e),g=(i+r)/(i-r);let v,S;if(l)v=s/(a-s),S=a*s/(a-s);else if(o===ir)v=-(a+s)/(a-s),S=-2*a*s/(a-s);else if(o===rl)v=-a/(a-s),S=-a*s/(a-s);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+o);return c[0]=h,c[4]=0,c[8]=f,c[12]=0,c[1]=0,c[5]=p,c[9]=g,c[13]=0,c[2]=0,c[6]=0,c[10]=v,c[14]=S,c[3]=0,c[7]=0,c[11]=-1,c[15]=0,this}makeOrthographic(e,n,i,r,s,a,o=ir,l=!1){const c=this.elements,h=2/(n-e),p=2/(i-r),f=-(n+e)/(n-e),g=-(i+r)/(i-r);let v,S;if(l)v=1/(a-s),S=a/(a-s);else if(o===ir)v=-2/(a-s),S=-(a+s)/(a-s);else if(o===rl)v=-1/(a-s),S=-s/(a-s);else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+o);return c[0]=h,c[4]=0,c[8]=0,c[12]=f,c[1]=0,c[5]=p,c[9]=0,c[13]=g,c[2]=0,c[6]=0,c[10]=v,c[14]=S,c[3]=0,c[7]=0,c[11]=0,c[15]=1,this}equals(e){const n=this.elements,i=e.elements;for(let r=0;r<16;r++)if(n[r]!==i[r])return!1;return!0}fromArray(e,n=0){for(let i=0;i<16;i++)this.elements[i]=e[i+n];return this}toArray(e=[],n=0){const i=this.elements;return e[n]=i[0],e[n+1]=i[1],e[n+2]=i[2],e[n+3]=i[3],e[n+4]=i[4],e[n+5]=i[5],e[n+6]=i[6],e[n+7]=i[7],e[n+8]=i[8],e[n+9]=i[9],e[n+10]=i[10],e[n+11]=i[11],e[n+12]=i[12],e[n+13]=i[13],e[n+14]=i[14],e[n+15]=i[15],e}};ou.prototype.isMatrix4=!0;let kt=ou;const qs=new I,Ai=new kt,BE=new I(0,0,0),zE=new I(1,1,1),zr=new I,Il=new I,Zn=new I,D0=new kt,I0=new cs;class us{constructor(e=0,n=0,i=0,r=us.DEFAULT_ORDER){this.isEuler=!0,this._x=e,this._y=n,this._z=i,this._order=r}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,n,i,r=this._order){return this._x=e,this._y=n,this._z=i,this._order=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,n=this._order,i=!0){const r=e.elements,s=r[0],a=r[4],o=r[8],l=r[1],c=r[5],h=r[9],p=r[2],f=r[6],g=r[10];switch(n){case"XYZ":this._y=Math.asin(lt(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(-h,g),this._z=Math.atan2(-a,s)):(this._x=Math.atan2(f,c),this._z=0);break;case"YXZ":this._x=Math.asin(-lt(h,-1,1)),Math.abs(h)<.9999999?(this._y=Math.atan2(o,g),this._z=Math.atan2(l,c)):(this._y=Math.atan2(-p,s),this._z=0);break;case"ZXY":this._x=Math.asin(lt(f,-1,1)),Math.abs(f)<.9999999?(this._y=Math.atan2(-p,g),this._z=Math.atan2(-a,c)):(this._y=0,this._z=Math.atan2(l,s));break;case"ZYX":this._y=Math.asin(-lt(p,-1,1)),Math.abs(p)<.9999999?(this._x=Math.atan2(f,g),this._z=Math.atan2(l,s)):(this._x=0,this._z=Math.atan2(-a,c));break;case"YZX":this._z=Math.asin(lt(l,-1,1)),Math.abs(l)<.9999999?(this._x=Math.atan2(-h,c),this._y=Math.atan2(-p,s)):(this._x=0,this._y=Math.atan2(o,g));break;case"XZY":this._z=Math.asin(-lt(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(f,c),this._y=Math.atan2(o,s)):(this._x=Math.atan2(-h,g),this._y=0);break;default:Ve("Euler: .setFromRotationMatrix() encountered an unknown order: "+n)}return this._order=n,i===!0&&this._onChangeCallback(),this}setFromQuaternion(e,n,i){return D0.makeRotationFromQuaternion(e),this.setFromRotationMatrix(D0,n,i)}setFromVector3(e,n=this._order){return this.set(e.x,e.y,e.z,n)}reorder(e){return I0.setFromEuler(this),this.setFromQuaternion(I0,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],n=0){return e[n]=this._x,e[n+1]=this._y,e[n+2]=this._z,e[n+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}}us.DEFAULT_ORDER="XYZ";class Bp{constructor(){this.mask=1}set(e){this.mask=(1<<e|0)>>>0}enable(e){this.mask|=1<<e|0}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e|0}disable(e){this.mask&=~(1<<e|0)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!==0}isEnabled(e){return(this.mask&(1<<e|0))!==0}}let HE=0;const U0=new I,Ys=new cs,hr=new kt,Ul=new I,fo=new I,VE=new I,GE=new cs,F0=new I(1,0,0),O0=new I(0,1,0),k0=new I(0,0,1),B0={type:"added"},jE={type:"removed"},Ks={type:"childadded",child:null},vd={type:"childremoved",child:null};class hn extends ps{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:HE++}),this.uuid=dl(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=hn.DEFAULT_UP.clone();const e=new I,n=new us,i=new cs,r=new I(1,1,1);function s(){i.setFromEuler(n,!1)}function a(){n.setFromQuaternion(i,void 0,!1)}n._onChange(s),i._onChange(a),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:e},rotation:{configurable:!0,enumerable:!0,value:n},quaternion:{configurable:!0,enumerable:!0,value:i},scale:{configurable:!0,enumerable:!0,value:r},modelViewMatrix:{value:new kt},normalMatrix:{value:new Ye}}),this.matrix=new kt,this.matrixWorld=new kt,this.matrixAutoUpdate=hn.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=hn.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new Bp,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.static=!1,this.userData={},this.pivot=null}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,n){this.quaternion.setFromAxisAngle(e,n)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,n){return Ys.setFromAxisAngle(e,n),this.quaternion.multiply(Ys),this}rotateOnWorldAxis(e,n){return Ys.setFromAxisAngle(e,n),this.quaternion.premultiply(Ys),this}rotateX(e){return this.rotateOnAxis(F0,e)}rotateY(e){return this.rotateOnAxis(O0,e)}rotateZ(e){return this.rotateOnAxis(k0,e)}translateOnAxis(e,n){return U0.copy(e).applyQuaternion(this.quaternion),this.position.add(U0.multiplyScalar(n)),this}translateX(e){return this.translateOnAxis(F0,e)}translateY(e){return this.translateOnAxis(O0,e)}translateZ(e){return this.translateOnAxis(k0,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(hr.copy(this.matrixWorld).invert())}lookAt(e,n,i){e.isVector3?Ul.copy(e):Ul.set(e,n,i);const r=this.parent;this.updateWorldMatrix(!0,!1),fo.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?hr.lookAt(fo,Ul,this.up):hr.lookAt(Ul,fo,this.up),this.quaternion.setFromRotationMatrix(hr),r&&(hr.extractRotation(r.matrixWorld),Ys.setFromRotationMatrix(hr),this.quaternion.premultiply(Ys.invert()))}add(e){if(arguments.length>1){for(let n=0;n<arguments.length;n++)this.add(arguments[n]);return this}return e===this?(gt("Object3D.add: object can't be added as a child of itself.",e),this):(e&&e.isObject3D?(e.removeFromParent(),e.parent=this,this.children.push(e),e.dispatchEvent(B0),Ks.child=e,this.dispatchEvent(Ks),Ks.child=null):gt("Object3D.add: object not an instance of THREE.Object3D.",e),this)}remove(e){if(arguments.length>1){for(let i=0;i<arguments.length;i++)this.remove(arguments[i]);return this}const n=this.children.indexOf(e);return n!==-1&&(e.parent=null,this.children.splice(n,1),e.dispatchEvent(jE),vd.child=e,this.dispatchEvent(vd),vd.child=null),this}removeFromParent(){const e=this.parent;return e!==null&&e.remove(this),this}clear(){return this.remove(...this.children)}attach(e){return this.updateWorldMatrix(!0,!1),hr.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),hr.multiply(e.parent.matrixWorld)),e.applyMatrix4(hr),e.removeFromParent(),e.parent=this,this.children.push(e),e.updateWorldMatrix(!1,!0),e.dispatchEvent(B0),Ks.child=e,this.dispatchEvent(Ks),Ks.child=null,this}getObjectById(e){return this.getObjectByProperty("id",e)}getObjectByName(e){return this.getObjectByProperty("name",e)}getObjectByProperty(e,n){if(this[e]===n)return this;for(let i=0,r=this.children.length;i<r;i++){const a=this.children[i].getObjectByProperty(e,n);if(a!==void 0)return a}}getObjectsByProperty(e,n,i=[]){this[e]===n&&i.push(this);const r=this.children;for(let s=0,a=r.length;s<a;s++)r[s].getObjectsByProperty(e,n,i);return i}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(fo,e,VE),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(fo,GE,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);const n=this.matrixWorld.elements;return e.set(n[8],n[9],n[10]).normalize()}raycast(){}intersectsFrustum(){}traverse(e){e(this);const n=this.children;for(let i=0,r=n.length;i<r;i++)n[i].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);const n=this.children;for(let i=0,r=n.length;i<r;i++)n[i].traverseVisible(e)}traverseAncestors(e){const n=this.parent;n!==null&&(e(n),n.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale);const e=this.pivot;if(e!==null){const n=e.x,i=e.y,r=e.z,s=this.matrix.elements;s[12]+=n-s[0]*n-s[4]*i-s[8]*r,s[13]+=i-s[1]*n-s[5]*i-s[9]*r,s[14]+=r-s[2]*n-s[6]*i-s[10]*r}this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,e=!0);const n=this.children;for(let i=0,r=n.length;i<r;i++)n[i].updateMatrixWorld(e)}updateWorldMatrix(e,n,i=!1){const r=this.parent;if(e===!0&&r!==null&&r.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||i)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,i=!0),n===!0){const s=this.children;for(let a=0,o=s.length;a<o;a++)s[a].updateWorldMatrix(!1,!0,i)}}toJSON(e){const n=e===void 0||typeof e=="string",i={};n&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},i.metadata={version:4.7,type:"Object",generator:"Object3D.toJSON"});const r={};r.uuid=this.uuid,r.type=this.type,r.name=this.name,r.castShadow=this.castShadow,r.receiveShadow=this.receiveShadow,r.visible=this.visible,r.frustumCulled=this.frustumCulled,r.renderOrder=this.renderOrder,r.static=this.static,r.matrixAutoUpdate=this.matrixAutoUpdate,Object.keys(this.userData).length>0&&(r.userData=this.userData),r.layers=this.layers.mask,r.matrix=this.matrix.toArray(),r.up=this.up.toArray(),this.pivot!==null&&(r.pivot=this.pivot.toArray()),this.morphTargetDictionary!==void 0&&(r.morphTargetDictionary=Object.assign({},this.morphTargetDictionary)),this.morphTargetInfluences!==void 0&&(r.morphTargetInfluences=this.morphTargetInfluences.slice()),this.isInstancedMesh&&(r.type="InstancedMesh",r.count=this.count,r.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(r.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(r.type="BatchedMesh",r.perObjectFrustumCulled=this.perObjectFrustumCulled,r.sortObjects=this.sortObjects,r.drawRanges=this._drawRanges,r.reservedRanges=this._reservedRanges,r.geometryInfo=this._geometryInfo.map(o=>({...o,boundingBox:o.boundingBox?o.boundingBox.toJSON():void 0,boundingSphere:o.boundingSphere?o.boundingSphere.toJSON():void 0})),r.instanceInfo=this._instanceInfo.map(o=>({...o})),r.availableInstanceIds=this._availableInstanceIds.slice(),r.availableGeometryIds=this._availableGeometryIds.slice(),r.nextIndexStart=this._nextIndexStart,r.nextVertexStart=this._nextVertexStart,r.geometryCount=this._geometryCount,r.maxInstanceCount=this._maxInstanceCount,r.maxVertexCount=this._maxVertexCount,r.maxIndexCount=this._maxIndexCount,r.geometryInitialized=this._geometryInitialized,r.matricesTexture=this._matricesTexture.toJSON(e),r.indirectTexture=this._indirectTexture.toJSON(e),this._colorsTexture!==null&&(r.colorsTexture=this._colorsTexture.toJSON(e)),this.boundingSphere!==null&&(r.boundingSphere=this.boundingSphere.toJSON()),this.boundingBox!==null&&(r.boundingBox=this.boundingBox.toJSON()));function s(o,l){return o[l.uuid]===void 0&&(o[l.uuid]=l.toJSON(e)),l.uuid}if(this.isScene)this.background&&(this.background.isColor?r.background=this.background.toJSON():this.background.isTexture&&(r.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(r.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){r.geometry=s(e.geometries,this.geometry);const o=this.geometry.parameters;if(o!==void 0&&o.shapes!==void 0){const l=o.shapes;if(Array.isArray(l))for(let c=0,h=l.length;c<h;c++){const p=l[c];s(e.shapes,p)}else s(e.shapes,l)}}if(this.isSkinnedMesh&&(r.bindMode=this.bindMode,r.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(s(e.skeletons,this.skeleton),r.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){const o=[];for(let l=0,c=this.material.length;l<c;l++)o.push(s(e.materials,this.material[l]));r.material=o}else r.material=s(e.materials,this.material);if(this.children.length>0){r.children=[];for(let o=0;o<this.children.length;o++)r.children.push(this.children[o].toJSON(e).object)}if(this.animations.length>0){r.animations=[];for(let o=0;o<this.animations.length;o++){const l=this.animations[o];r.animations.push(s(e.animations,l))}}if(n){const o=a(e.geometries),l=a(e.materials),c=a(e.textures),h=a(e.images),p=a(e.shapes),f=a(e.skeletons),g=a(e.animations),v=a(e.nodes);o.length>0&&(i.geometries=o),l.length>0&&(i.materials=l),c.length>0&&(i.textures=c),h.length>0&&(i.images=h),p.length>0&&(i.shapes=p),f.length>0&&(i.skeletons=f),g.length>0&&(i.animations=g),v.length>0&&(i.nodes=v)}return i.object=r,i;function a(o){const l=[];for(const c in o){const h=o[c];delete h.metadata,l.push(h)}return l}}clone(e){return new this.constructor().copy(this,e)}copy(e,n=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.pivot=e.pivot!==null?e.pivot.clone():null,this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.static=e.static,this.animations=e.animations.slice(),this.userData=JSON.parse(JSON.stringify(e.userData)),n===!0)for(let i=0;i<e.children.length;i++){const r=e.children[i];this.add(r.clone())}return this}dispose(){this.dispatchEvent({type:"dispose"})}}hn.DEFAULT_UP=new I(0,1,0);hn.DEFAULT_MATRIX_AUTO_UPDATE=!0;hn.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;class wn extends hn{constructor(){super(),this.isGroup=!0,this.type="Group"}}const WE={type:"move"};class xd{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new wn,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new wn,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new I,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new I),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new wn,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new I,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new I,this._grip.eventsEnabled=!1),this._grip}dispatchEvent(e){return this._targetRay!==null&&this._targetRay.dispatchEvent(e),this._grip!==null&&this._grip.dispatchEvent(e),this._hand!==null&&this._hand.dispatchEvent(e),this}connect(e){if(e&&e.hand){const n=this._hand;if(n)for(const i of e.hand.values())this._getHandJoint(n,i)}return this.dispatchEvent({type:"connected",data:e}),this}disconnect(e){return this.dispatchEvent({type:"disconnected",data:e}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(e,n,i){let r=null,s=null,a=null;const o=this._targetRay,l=this._grip,c=this._hand;if(e&&n.session.visibilityState!=="visible-blurred"){if(c&&e.hand){a=!0;for(const S of e.hand.values()){const _=n.getJointPose(S,i),d=this._getHandJoint(c,S);_!==null&&(d.matrix.fromArray(_.transform.matrix),d.matrix.decompose(d.position,d.rotation,d.scale),d.matrixWorldNeedsUpdate=!0,d.jointRadius=_.radius),d.visible=_!==null}const h=c.joints["index-finger-tip"],p=c.joints["thumb-tip"],f=h.position.distanceTo(p.position),g=.02,v=.005;c.inputState.pinching&&f>g+v?(c.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:e.handedness,target:this})):!c.inputState.pinching&&f<=g-v&&(c.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:e.handedness,target:this}))}else l!==null&&e.gripSpace&&(s=n.getPose(e.gripSpace,i),s!==null&&(l.matrix.fromArray(s.transform.matrix),l.matrix.decompose(l.position,l.rotation,l.scale),l.matrixWorldNeedsUpdate=!0,s.linearVelocity?(l.hasLinearVelocity=!0,l.linearVelocity.copy(s.linearVelocity)):l.hasLinearVelocity=!1,s.angularVelocity?(l.hasAngularVelocity=!0,l.angularVelocity.copy(s.angularVelocity)):l.hasAngularVelocity=!1,l.eventsEnabled&&l.dispatchEvent({type:"gripUpdated",data:e,target:this})));o!==null&&(r=n.getPose(e.targetRaySpace,i),r===null&&s!==null&&(r=s),r!==null&&(o.matrix.fromArray(r.transform.matrix),o.matrix.decompose(o.position,o.rotation,o.scale),o.matrixWorldNeedsUpdate=!0,r.linearVelocity?(o.hasLinearVelocity=!0,o.linearVelocity.copy(r.linearVelocity)):o.hasLinearVelocity=!1,r.angularVelocity?(o.hasAngularVelocity=!0,o.angularVelocity.copy(r.angularVelocity)):o.hasAngularVelocity=!1,this.dispatchEvent(WE)))}return o!==null&&(o.visible=r!==null),l!==null&&(l.visible=s!==null),c!==null&&(c.visible=a!==null),this}_getHandJoint(e,n){if(e.joints[n.jointName]===void 0){const i=new wn;i.matrixAutoUpdate=!1,i.visible=!1,e.joints[n.jointName]=i,e.add(i)}return e.joints[n.jointName]}}const wx={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},Hr={h:0,s:0,l:0},Fl={h:0,s:0,l:0};function yd(t,e,n){return n<0&&(n+=1),n>1&&(n-=1),n<1/6?t+(e-t)*6*n:n<1/2?e:n<2/3?t+(e-t)*6*(2/3-n):t}class ct{constructor(e,n,i){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(e,n,i)}set(e,n,i){if(n===void 0&&i===void 0){const r=e;r&&r.isColor?this.copy(r):typeof r=="number"?this.setHex(r):typeof r=="string"&&this.setStyle(r)}else this.setRGB(e,n,i);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,n=ei){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(e&255)/255,ft.colorSpaceToWorking(this,n),this}setRGB(e,n,i,r=ft.workingColorSpace){return this.r=e,this.g=n,this.b=i,ft.colorSpaceToWorking(this,r),this}setHSL(e,n,i,r=ft.workingColorSpace){if(e=NE(e,1),n=lt(n,0,1),i=lt(i,0,1),n===0)this.r=this.g=this.b=i;else{const s=i<=.5?i*(1+n):i+n-i*n,a=2*i-s;this.r=yd(a,s,e+1/3),this.g=yd(a,s,e),this.b=yd(a,s,e-1/3)}return ft.colorSpaceToWorking(this,r),this}setStyle(e,n=ei){function i(s){s!==void 0&&parseFloat(s)<1&&Ve("Color: Alpha component of "+e+" will be ignored.")}let r;if(r=/^(\w+)\(([^\)]*)\)/.exec(e)){let s;const a=r[1],o=r[2];switch(a){case"rgb":case"rgba":if(s=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return i(s[4]),this.setRGB(Math.min(255,parseInt(s[1],10))/255,Math.min(255,parseInt(s[2],10))/255,Math.min(255,parseInt(s[3],10))/255,n);if(s=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return i(s[4]),this.setRGB(Math.min(100,parseInt(s[1],10))/100,Math.min(100,parseInt(s[2],10))/100,Math.min(100,parseInt(s[3],10))/100,n);break;case"hsl":case"hsla":if(s=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return i(s[4]),this.setHSL(parseFloat(s[1])/360,parseFloat(s[2])/100,parseFloat(s[3])/100,n);break;default:Ve("Color: Unknown color model "+e)}}else if(r=/^\#([A-Fa-f\d]+)$/.exec(e)){const s=r[1],a=s.length;if(a===3)return this.setRGB(parseInt(s.charAt(0),16)/15,parseInt(s.charAt(1),16)/15,parseInt(s.charAt(2),16)/15,n);if(a===6)return this.setHex(parseInt(s,16),n);Ve("Color: Invalid hex color "+e)}else if(e&&e.length>0)return this.setColorName(e,n);return this}setColorName(e,n=ei){const i=wx[e.toLowerCase()];return i!==void 0?this.setHex(i,n):Ve("Color: Unknown color "+e),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=Ar(e.r),this.g=Ar(e.g),this.b=Ar(e.b),this}copyLinearToSRGB(e){return this.r=La(e.r),this.g=La(e.g),this.b=La(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=ei){return ft.workingToColorSpace(En.copy(this),e),Math.round(lt(En.r*255,0,255))*65536+Math.round(lt(En.g*255,0,255))*256+Math.round(lt(En.b*255,0,255))}getHexString(e=ei){return("000000"+this.getHex(e).toString(16)).slice(-6)}getHSL(e,n=ft.workingColorSpace){ft.workingToColorSpace(En.copy(this),n);const i=En.r,r=En.g,s=En.b,a=Math.max(i,r,s),o=Math.min(i,r,s);let l,c;const h=(o+a)/2;if(o===a)l=0,c=0;else{const p=a-o;switch(c=h<=.5?p/(a+o):p/(2-a-o),a){case i:l=(r-s)/p+(r<s?6:0);break;case r:l=(s-i)/p+2;break;case s:l=(i-r)/p+4;break}l/=6}return e.h=l,e.s=c,e.l=h,e}getRGB(e,n=ft.workingColorSpace){return ft.workingToColorSpace(En.copy(this),n),e.r=En.r,e.g=En.g,e.b=En.b,e}getStyle(e=ei){ft.workingToColorSpace(En.copy(this),e);const n=En.r,i=En.g,r=En.b;return e!==ei?`color(${e} ${n.toFixed(3)} ${i.toFixed(3)} ${r.toFixed(3)})`:`rgb(${Math.round(n*255)},${Math.round(i*255)},${Math.round(r*255)})`}offsetHSL(e,n,i){return this.getHSL(Hr),this.setHSL(Hr.h+e,Hr.s+n,Hr.l+i)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,n){return this.r=e.r+n.r,this.g=e.g+n.g,this.b=e.b+n.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,n){return this.r+=(e.r-this.r)*n,this.g+=(e.g-this.g)*n,this.b+=(e.b-this.b)*n,this}lerpColors(e,n,i){return this.r=e.r+(n.r-e.r)*i,this.g=e.g+(n.g-e.g)*i,this.b=e.b+(n.b-e.b)*i,this}lerpHSL(e,n){this.getHSL(Hr),e.getHSL(Fl);const i=hd(Hr.h,Fl.h,n),r=hd(Hr.s,Fl.s,n),s=hd(Hr.l,Fl.l,n);return this.setHSL(i,r,s),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){const n=this.r,i=this.g,r=this.b,s=e.elements;return this.r=s[0]*n+s[3]*i+s[6]*r,this.g=s[1]*n+s[4]*i+s[7]*r,this.b=s[2]*n+s[5]*i+s[8]*r,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,n=0){return this.r=e[n],this.g=e[n+1],this.b=e[n+2],this}toArray(e=[],n=0){return e[n]=this.r,e[n+1]=this.g,e[n+2]=this.b,e}fromBufferAttribute(e,n){return this.r=e.getX(n),this.g=e.getY(n),this.b=e.getZ(n),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}}const En=new ct;ct.NAMES=wx;class zp{constructor(e,n=1,i=1e3){this.isFog=!0,this.name="",this.color=new ct(e),this.near=n,this.far=i}clone(){return new zp(this.color,this.near,this.far)}toJSON(){return{type:"Fog",name:this.name,color:this.color.getHex(),near:this.near,far:this.far}}}class Tx extends hn{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new us,this.environmentIntensity=1,this.environmentRotation=new us,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(e,n){return super.copy(e,n),e.background!==null&&(this.background=e.background.clone()),e.environment!==null&&(this.environment=e.environment.clone()),e.fog!==null&&(this.fog=e.fog.clone()),this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,this.backgroundRotation.copy(e.backgroundRotation),this.environmentIntensity=e.environmentIntensity,this.environmentRotation.copy(e.environmentRotation),e.overrideMaterial!==null&&(this.overrideMaterial=e.overrideMaterial.clone()),this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){const n=super.toJSON(e);return this.fog!==null&&(n.object.fog=this.fog.toJSON()),n.object.backgroundBlurriness=this.backgroundBlurriness,n.object.backgroundIntensity=this.backgroundIntensity,n.object.backgroundRotation=this.backgroundRotation.toArray(),n.object.environmentIntensity=this.environmentIntensity,n.object.environmentRotation=this.environmentRotation.toArray(),n}}const Ci=new I,pr=new I,Sd=new I,mr=new I,Zs=new I,Qs=new I,z0=new I,Md=new I,Ed=new I,wd=new I,Td=new Gt,bd=new Gt,Ad=new Gt;class mi{constructor(e=new I,n=new I,i=new I){this.a=e,this.b=n,this.c=i}static getNormal(e,n,i,r){r.subVectors(i,n),Ci.subVectors(e,n),r.cross(Ci);const s=r.lengthSq();return s>0?r.multiplyScalar(1/Math.sqrt(s)):r.set(0,0,0)}static getBarycoord(e,n,i,r,s){Ci.subVectors(r,n),pr.subVectors(i,n),Sd.subVectors(e,n);const a=Ci.dot(Ci),o=Ci.dot(pr),l=Ci.dot(Sd),c=pr.dot(pr),h=pr.dot(Sd),p=a*c-o*o;if(p===0)return s.set(0,0,0),null;const f=1/p,g=(c*l-o*h)*f,v=(a*h-o*l)*f;return s.set(1-g-v,v,g)}static containsPoint(e,n,i,r){return this.getBarycoord(e,n,i,r,mr)===null?!1:mr.x>=0&&mr.y>=0&&mr.x+mr.y<=1}static getInterpolation(e,n,i,r,s,a,o,l){return this.getBarycoord(e,n,i,r,mr)===null?(l.x=0,l.y=0,"z"in l&&(l.z=0),"w"in l&&(l.w=0),null):(l.setScalar(0),l.addScaledVector(s,mr.x),l.addScaledVector(a,mr.y),l.addScaledVector(o,mr.z),l)}static getInterpolatedAttribute(e,n,i,r,s,a){return Td.setScalar(0),bd.setScalar(0),Ad.setScalar(0),Td.fromBufferAttribute(e,n),bd.fromBufferAttribute(e,i),Ad.fromBufferAttribute(e,r),a.setScalar(0),a.addScaledVector(Td,s.x),a.addScaledVector(bd,s.y),a.addScaledVector(Ad,s.z),a}static isFrontFacing(e,n,i,r){return Ci.subVectors(i,n),pr.subVectors(e,n),Ci.cross(pr).dot(r)<0}set(e,n,i){return this.a.copy(e),this.b.copy(n),this.c.copy(i),this}setFromPointsAndIndices(e,n,i,r){return this.a.copy(e[n]),this.b.copy(e[i]),this.c.copy(e[r]),this}setFromAttributeAndIndices(e,n,i,r){return this.a.fromBufferAttribute(e,n),this.b.fromBufferAttribute(e,i),this.c.fromBufferAttribute(e,r),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return Ci.subVectors(this.c,this.b),pr.subVectors(this.a,this.b),Ci.cross(pr).length()*.5}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(e){return mi.getNormal(this.a,this.b,this.c,e)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(e,n){return mi.getBarycoord(e,this.a,this.b,this.c,n)}getInterpolation(e,n,i,r,s){return mi.getInterpolation(e,this.a,this.b,this.c,n,i,r,s)}containsPoint(e){return mi.containsPoint(e,this.a,this.b,this.c)}isFrontFacing(e){return mi.isFrontFacing(this.a,this.b,this.c,e)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,n){const i=this.a,r=this.b,s=this.c;let a,o;Zs.subVectors(r,i),Qs.subVectors(s,i),Md.subVectors(e,i);const l=Zs.dot(Md),c=Qs.dot(Md);if(l<=0&&c<=0)return n.copy(i);Ed.subVectors(e,r);const h=Zs.dot(Ed),p=Qs.dot(Ed);if(h>=0&&p<=h)return n.copy(r);const f=l*p-h*c;if(f<=0&&l>=0&&h<=0)return a=l/(l-h),n.copy(i).addScaledVector(Zs,a);wd.subVectors(e,s);const g=Zs.dot(wd),v=Qs.dot(wd);if(v>=0&&g<=v)return n.copy(s);const S=g*c-l*v;if(S<=0&&c>=0&&v<=0)return o=c/(c-v),n.copy(i).addScaledVector(Qs,o);const _=h*v-g*p;if(_<=0&&p-h>=0&&g-v>=0)return z0.subVectors(s,r),o=(p-h)/(p-h+(g-v)),n.copy(r).addScaledVector(z0,o);const d=1/(_+S+f);return a=S*d,o=f*d,n.copy(i).addScaledVector(Zs,a).addScaledVector(Qs,o)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}}class fl{constructor(e=new I(1/0,1/0,1/0),n=new I(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=n}set(e,n){return this.min.copy(e),this.max.copy(n),this}setFromArray(e){this.makeEmpty();for(let n=0,i=e.length;n<i;n+=3)this.expandByPoint(Ri.fromArray(e,n));return this}setFromBufferAttribute(e){this.makeEmpty();for(let n=0,i=e.count;n<i;n++)this.expandByPoint(Ri.fromBufferAttribute(e,n));return this}setFromPoints(e){this.makeEmpty();for(let n=0,i=e.length;n<i;n++)this.expandByPoint(e[n]);return this}setFromCenterAndSize(e,n){const i=Ri.copy(n).multiplyScalar(.5);return this.min.copy(e).sub(i),this.max.copy(e).add(i),this}setFromObject(e,n=!1){return this.makeEmpty(),this.expandByObject(e,n)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,n=!1){e.updateWorldMatrix(!1,!1);const i=e.geometry;if(i!==void 0){const s=i.getAttribute("position");if(n===!0&&s!==void 0&&e.isInstancedMesh!==!0)for(let a=0,o=s.count;a<o;a++)e.isMesh===!0?e.getVertexPosition(a,Ri):Ri.fromBufferAttribute(s,a),Ri.applyMatrix4(e.matrixWorld),this.expandByPoint(Ri);else e.boundingBox!==void 0?(e.boundingBox===null&&e.computeBoundingBox(),Ol.copy(e.boundingBox)):(i.boundingBox===null&&i.computeBoundingBox(),Ol.copy(i.boundingBox)),Ol.applyMatrix4(e.matrixWorld),this.union(Ol)}const r=e.children;for(let s=0,a=r.length;s<a;s++)this.expandByObject(r[s],n);return this}containsPoint(e){return e.x>=this.min.x&&e.x<=this.max.x&&e.y>=this.min.y&&e.y<=this.max.y&&e.z>=this.min.z&&e.z<=this.max.z}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,n){return n.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return e.max.x>=this.min.x&&e.min.x<=this.max.x&&e.max.y>=this.min.y&&e.min.y<=this.max.y&&e.max.z>=this.min.z&&e.min.z<=this.max.z}intersectsSphere(e){return this.clampPoint(e.center,Ri),Ri.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let n,i;return e.normal.x>0?(n=e.normal.x*this.min.x,i=e.normal.x*this.max.x):(n=e.normal.x*this.max.x,i=e.normal.x*this.min.x),e.normal.y>0?(n+=e.normal.y*this.min.y,i+=e.normal.y*this.max.y):(n+=e.normal.y*this.max.y,i+=e.normal.y*this.min.y),e.normal.z>0?(n+=e.normal.z*this.min.z,i+=e.normal.z*this.max.z):(n+=e.normal.z*this.max.z,i+=e.normal.z*this.min.z),n<=-e.constant&&i>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(ho),kl.subVectors(this.max,ho),Js.subVectors(e.a,ho),ea.subVectors(e.b,ho),ta.subVectors(e.c,ho),Vr.subVectors(ea,Js),Gr.subVectors(ta,ea),vs.subVectors(Js,ta);let n=[0,-Vr.z,Vr.y,0,-Gr.z,Gr.y,0,-vs.z,vs.y,Vr.z,0,-Vr.x,Gr.z,0,-Gr.x,vs.z,0,-vs.x,-Vr.y,Vr.x,0,-Gr.y,Gr.x,0,-vs.y,vs.x,0];return!Cd(n,Js,ea,ta,kl)||(n=[1,0,0,0,1,0,0,0,1],!Cd(n,Js,ea,ta,kl))?!1:(Bl.crossVectors(Vr,Gr),n=[Bl.x,Bl.y,Bl.z],Cd(n,Js,ea,ta,kl))}clampPoint(e,n){return n.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,Ri).distanceTo(e)}getBoundingSphere(e){return this.isEmpty()?e.makeEmpty():(this.getCenter(e.center),e.radius=this.getSize(Ri).length()*.5),e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()?this:(gr[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),gr[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),gr[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),gr[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),gr[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),gr[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),gr[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),gr[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(gr),this)}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(e){return this.min.fromArray(e.min),this.max.fromArray(e.max),this}}const gr=[new I,new I,new I,new I,new I,new I,new I,new I],Ri=new I,Ol=new fl,Js=new I,ea=new I,ta=new I,Vr=new I,Gr=new I,vs=new I,ho=new I,kl=new I,Bl=new I,xs=new I;function Cd(t,e,n,i,r){for(let s=0,a=t.length-3;s<=a;s+=3){xs.fromArray(t,s);const o=r.x*Math.abs(xs.x)+r.y*Math.abs(xs.y)+r.z*Math.abs(xs.z),l=e.dot(xs),c=n.dot(xs),h=i.dot(xs);if(Math.max(-Math.max(l,c,h),Math.min(l,c,h))>o)return!1}return!0}const Qt=new I,zl=new We;let XE=0;class vi extends ps{constructor(e,n,i=!1){if(super(),Array.isArray(e))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:XE++}),this.name="",this.array=e,this.itemSize=n,this.count=e!==void 0?e.length/n:0,this.normalized=i,this.usage=bE,this.updateRanges=[],this.gpuType=nr,this.version=0}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,n){this.updateRanges.push({start:e,count:n})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this.gpuType=e.gpuType,this}copyAt(e,n,i){e*=this.itemSize,i*=n.itemSize;for(let r=0,s=this.itemSize;r<s;r++)this.array[e+r]=n.array[i+r];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let n=0,i=this.count;n<i;n++)zl.fromBufferAttribute(this,n),zl.applyMatrix3(e),this.setXY(n,zl.x,zl.y);else if(this.itemSize===3)for(let n=0,i=this.count;n<i;n++)Qt.fromBufferAttribute(this,n),Qt.applyMatrix3(e),this.setXYZ(n,Qt.x,Qt.y,Qt.z);return this}applyMatrix4(e){for(let n=0,i=this.count;n<i;n++)Qt.fromBufferAttribute(this,n),Qt.applyMatrix4(e),this.setXYZ(n,Qt.x,Qt.y,Qt.z);return this}applyNormalMatrix(e){for(let n=0,i=this.count;n<i;n++)Qt.fromBufferAttribute(this,n),Qt.applyNormalMatrix(e),this.setXYZ(n,Qt.x,Qt.y,Qt.z);return this}transformDirection(e){for(let n=0,i=this.count;n<i;n++)Qt.fromBufferAttribute(this,n),Qt.transformDirection(e),this.setXYZ(n,Qt.x,Qt.y,Qt.z);return this}set(e,n=0){return this.array.set(e,n),this}getComponent(e,n){let i=this.array[e*this.itemSize+n];return this.normalized&&(i=uo(i,this.array)),i}setComponent(e,n,i){return this.normalized&&(i=zn(i,this.array)),this.array[e*this.itemSize+n]=i,this}getX(e){let n=this.array[e*this.itemSize];return this.normalized&&(n=uo(n,this.array)),n}setX(e,n){return this.normalized&&(n=zn(n,this.array)),this.array[e*this.itemSize]=n,this}getY(e){let n=this.array[e*this.itemSize+1];return this.normalized&&(n=uo(n,this.array)),n}setY(e,n){return this.normalized&&(n=zn(n,this.array)),this.array[e*this.itemSize+1]=n,this}getZ(e){let n=this.array[e*this.itemSize+2];return this.normalized&&(n=uo(n,this.array)),n}setZ(e,n){return this.normalized&&(n=zn(n,this.array)),this.array[e*this.itemSize+2]=n,this}getW(e){let n=this.array[e*this.itemSize+3];return this.normalized&&(n=uo(n,this.array)),n}setW(e,n){return this.normalized&&(n=zn(n,this.array)),this.array[e*this.itemSize+3]=n,this}setXY(e,n,i){return e*=this.itemSize,this.normalized&&(n=zn(n,this.array),i=zn(i,this.array)),this.array[e+0]=n,this.array[e+1]=i,this}setXYZ(e,n,i,r){return e*=this.itemSize,this.normalized&&(n=zn(n,this.array),i=zn(i,this.array),r=zn(r,this.array)),this.array[e+0]=n,this.array[e+1]=i,this.array[e+2]=r,this}setXYZW(e,n,i,r,s){return e*=this.itemSize,this.normalized&&(n=zn(n,this.array),i=zn(i,this.array),r=zn(r,this.array),s=zn(s,this.array)),this.array[e+0]=n,this.array[e+1]=i,this.array[e+2]=r,this.array[e+3]=s,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){const e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return e.name=this.name,e.usage=this.usage,e.gpuType=this.gpuType,e}dispose(){this.dispatchEvent({type:"dispose"})}}class bx extends vi{constructor(e,n,i){super(new Uint16Array(e),n,i)}}class Ax extends vi{constructor(e,n,i){super(new Uint32Array(e),n,i)}}class Wt extends vi{constructor(e,n,i){super(new Float32Array(e),n,i)}}const $E=new fl,po=new I,Rd=new I;class Tu{constructor(e=new I,n=-1){this.isSphere=!0,this.center=e,this.radius=n}set(e,n){return this.center.copy(e),this.radius=n,this}setFromPoints(e,n){const i=this.center;n!==void 0?i.copy(n):$E.setFromPoints(e).getCenter(i);let r=0;for(let s=0,a=e.length;s<a;s++)r=Math.max(r,i.distanceToSquared(e[s]));return this.radius=Math.sqrt(r),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){const n=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=n*n}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,n){const i=this.center.distanceToSquared(e);return n.copy(e),i>this.radius*this.radius&&(n.sub(this.center).normalize(),n.multiplyScalar(this.radius).add(this.center)),n}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius=this.radius*e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;po.subVectors(e,this.center);const n=po.lengthSq();if(n>this.radius*this.radius){const i=Math.sqrt(n),r=(i-this.radius)*.5;this.center.addScaledVector(po,r/i),this.radius+=r}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(Rd.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(po.copy(e.center).add(Rd)),this.expandByPoint(po.copy(e.center).sub(Rd))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return{radius:this.radius,center:this.center.toArray()}}fromJSON(e){return this.radius=e.radius,this.center.fromArray(e.center),this}}let qE=0;const fi=new kt,Pd=new hn,na=new I,Qn=new fl,mo=new fl,un=new I;class Rn extends ps{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:qE++}),this.uuid=dl(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.indirectOffset=0,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={},this._transformed=!1}getIndex(){return this.index}setIndex(e){return Array.isArray(e)?this.index=new(AE(e)?Ax:bx)(e,1):this.index=e,this}setIndirect(e,n=0){return this.indirect=e,this.indirectOffset=n,this}getIndirect(){return this.indirect}getAttribute(e){return this.attributes[e]}setAttribute(e,n){return this.attributes[e]=n,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,n,i=0){this.groups.push({start:e,count:n,materialIndex:i})}clearGroups(){this.groups=[]}setDrawRange(e,n){this.drawRange.start=e,this.drawRange.count=n}applyMatrix4(e){const n=this.attributes.position;n!==void 0&&(n.applyMatrix4(e),n.needsUpdate=!0);const i=this.attributes.normal;if(i!==void 0){const s=new Ye().getNormalMatrix(e);i.applyNormalMatrix(s),i.needsUpdate=!0}const r=this.attributes.tangent;return r!==void 0&&(r.transformDirection(e),r.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this._transformed=!0,this}applyQuaternion(e){return fi.makeRotationFromQuaternion(e),this.applyMatrix4(fi),this}rotateX(e){return fi.makeRotationX(e),this.applyMatrix4(fi),this}rotateY(e){return fi.makeRotationY(e),this.applyMatrix4(fi),this}rotateZ(e){return fi.makeRotationZ(e),this.applyMatrix4(fi),this}translate(e,n,i){return fi.makeTranslation(e,n,i),this.applyMatrix4(fi),this}scale(e,n,i){return fi.makeScale(e,n,i),this.applyMatrix4(fi),this}lookAt(e){return Pd.lookAt(e),Pd.updateMatrix(),this.applyMatrix4(Pd.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(na).negate(),this.translate(na.x,na.y,na.z),this}setFromPoints(e){const n=this.getAttribute("position");if(n===void 0){const i=[];for(let r=0,s=e.length;r<s;r++){const a=e[r];i.push(a.x,a.y,a.z||0)}this.setAttribute("position",new Wt(i,3))}else{const i=Math.min(e.length,n.count);for(let r=0;r<i;r++){const s=e[r];n.setXYZ(r,s.x,s.y,s.z||0)}e.length>n.count&&Ve("BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),n.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new fl);const e=this.attributes.position,n=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){gt("BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new I(-1/0,-1/0,-1/0),new I(1/0,1/0,1/0));return}if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),n)for(let i=0,r=n.length;i<r;i++){const s=n[i];Qn.setFromBufferAttribute(s),this.morphTargetsRelative?(un.addVectors(this.boundingBox.min,Qn.min),this.boundingBox.expandByPoint(un),un.addVectors(this.boundingBox.max,Qn.max),this.boundingBox.expandByPoint(un)):(this.boundingBox.expandByPoint(Qn.min),this.boundingBox.expandByPoint(Qn.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&gt('BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new Tu);const e=this.attributes.position,n=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){gt("BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new I,1/0);return}if(e){const i=this.boundingSphere.center;if(Qn.setFromBufferAttribute(e),n)for(let s=0,a=n.length;s<a;s++){const o=n[s];mo.setFromBufferAttribute(o),this.morphTargetsRelative?(un.addVectors(Qn.min,mo.min),Qn.expandByPoint(un),un.addVectors(Qn.max,mo.max),Qn.expandByPoint(un)):(Qn.expandByPoint(mo.min),Qn.expandByPoint(mo.max))}Qn.getCenter(i);let r=0;for(let s=0,a=e.count;s<a;s++)un.fromBufferAttribute(e,s),r=Math.max(r,i.distanceToSquared(un));if(n)for(let s=0,a=n.length;s<a;s++){const o=n[s],l=this.morphTargetsRelative;for(let c=0,h=o.count;c<h;c++)un.fromBufferAttribute(o,c),l&&(na.fromBufferAttribute(e,c),un.add(na)),r=Math.max(r,i.distanceToSquared(un))}this.boundingSphere.radius=Math.sqrt(r),isNaN(this.boundingSphere.radius)&&gt('BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){const e=this.index,n=this.attributes;if(e===null||n.position===void 0||n.normal===void 0||n.uv===void 0){gt("BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}const i=n.position,r=n.normal,s=n.uv;let a=this.getAttribute("tangent");(a===void 0||a.count!==i.count)&&(a=new vi(new Float32Array(4*i.count),4),this.setAttribute("tangent",a));const o=[],l=[];for(let x=0;x<i.count;x++)o[x]=new I,l[x]=new I;const c=new I,h=new I,p=new I,f=new We,g=new We,v=new We,S=new I,_=new I;function d(x,b,P){c.fromBufferAttribute(i,x),h.fromBufferAttribute(i,b),p.fromBufferAttribute(i,P),f.fromBufferAttribute(s,x),g.fromBufferAttribute(s,b),v.fromBufferAttribute(s,P),h.sub(c),p.sub(c),g.sub(f),v.sub(f);const D=1/(g.x*v.y-v.x*g.y);isFinite(D)&&(S.copy(h).multiplyScalar(v.y).addScaledVector(p,-g.y).multiplyScalar(D),_.copy(p).multiplyScalar(g.x).addScaledVector(h,-v.x).multiplyScalar(D),o[x].add(S),o[b].add(S),o[P].add(S),l[x].add(_),l[b].add(_),l[P].add(_))}let m=this.groups;m.length===0&&(m=[{start:0,count:e.count}]);for(let x=0,b=m.length;x<b;++x){const P=m[x],D=P.start,O=P.count;for(let F=D,U=D+O;F<U;F+=3)d(e.getX(F+0),e.getX(F+1),e.getX(F+2))}const M=new I,y=new I,T=new I,E=new I;function C(x){T.fromBufferAttribute(r,x),E.copy(T);const b=o[x];M.copy(b),M.sub(T.multiplyScalar(T.dot(b))).normalize(),y.crossVectors(E,b);const D=y.dot(l[x])<0?-1:1;a.setXYZW(x,M.x,M.y,M.z,D)}for(let x=0,b=m.length;x<b;++x){const P=m[x],D=P.start,O=P.count;for(let F=D,U=D+O;F<U;F+=3)C(e.getX(F+0)),C(e.getX(F+1)),C(e.getX(F+2))}this._transformed=!0}computeVertexNormals(){const e=this.index,n=this.getAttribute("position");if(n!==void 0){let i=this.getAttribute("normal");if(i===void 0||i.count!==n.count)i=new vi(new Float32Array(n.count*3),3),this.setAttribute("normal",i);else for(let f=0,g=i.count;f<g;f++)i.setXYZ(f,0,0,0);const r=new I,s=new I,a=new I,o=new I,l=new I,c=new I,h=new I,p=new I;if(e)for(let f=0,g=e.count;f<g;f+=3){const v=e.getX(f+0),S=e.getX(f+1),_=e.getX(f+2);r.fromBufferAttribute(n,v),s.fromBufferAttribute(n,S),a.fromBufferAttribute(n,_),h.subVectors(a,s),p.subVectors(r,s),h.cross(p),o.fromBufferAttribute(i,v),l.fromBufferAttribute(i,S),c.fromBufferAttribute(i,_),o.add(h),l.add(h),c.add(h),i.setXYZ(v,o.x,o.y,o.z),i.setXYZ(S,l.x,l.y,l.z),i.setXYZ(_,c.x,c.y,c.z)}else for(let f=0,g=n.count;f<g;f+=3)r.fromBufferAttribute(n,f+0),s.fromBufferAttribute(n,f+1),a.fromBufferAttribute(n,f+2),h.subVectors(a,s),p.subVectors(r,s),h.cross(p),i.setXYZ(f+0,h.x,h.y,h.z),i.setXYZ(f+1,h.x,h.y,h.z),i.setXYZ(f+2,h.x,h.y,h.z);this.normalizeNormals(),i.needsUpdate=!0}}normalizeNormals(){const e=this.attributes.normal;for(let n=0,i=e.count;n<i;n++)un.fromBufferAttribute(e,n),un.normalize(),e.setXYZ(n,un.x,un.y,un.z)}toNonIndexed(){function e(o,l){const c=o.array,h=o.itemSize,p=o.normalized,f=new c.constructor(l.length*h);let g=0,v=0;for(let S=0,_=l.length;S<_;S++){o.isInterleavedBufferAttribute?g=l[S]*o.data.stride+o.offset:g=l[S]*h;for(let d=0;d<h;d++)f[v++]=c[g++]}return new vi(f,h,p)}if(this.index===null)return Ve("BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;const n=new Rn,i=this.index.array,r=this.attributes;for(const o in r){const l=r[o],c=e(l,i);n.setAttribute(o,c)}const s=this.morphAttributes;for(const o in s){const l=[],c=s[o];for(let h=0,p=c.length;h<p;h++){const f=c[h],g=e(f,i);l.push(g)}n.morphAttributes[o]=l}n.morphTargetsRelative=this.morphTargetsRelative;const a=this.groups;for(let o=0,l=a.length;o<l;o++){const c=a[o];n.addGroup(c.start,c.count,c.materialIndex)}return n}toJSON(){const e={metadata:{version:4.7,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(e.uuid=this.uuid,e.type=this.parameters!==void 0&&this._transformed===!0?"BufferGeometry":this.type,e.name=this.name,Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0&&this._transformed!==!0){const l=this.parameters;for(const c in l)l[c]!==void 0&&(e[c]=l[c]);return e}e.data={attributes:{}};const n=this.index;n!==null&&(e.data.index={type:n.array.constructor.name,array:Array.prototype.slice.call(n.array)});const i=this.attributes;for(const l in i){const c=i[l];e.data.attributes[l]=c.toJSON(e.data)}const r={};let s=!1;for(const l in this.morphAttributes){const c=this.morphAttributes[l],h=[];for(let p=0,f=c.length;p<f;p++){const g=c[p];h.push(g.toJSON(e.data))}h.length>0&&(r[l]=h,s=!0)}s&&(e.data.morphAttributes=r,e.data.morphTargetsRelative=this.morphTargetsRelative);const a=this.groups;a.length>0&&(e.data.groups=JSON.parse(JSON.stringify(a)));const o=this.boundingSphere;return o!==null&&(e.data.boundingSphere=o.toJSON()),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;const n={};this.name=e.name;const i=e.index;i!==null&&this.setIndex(i.clone());const r=e.attributes;for(const c in r){const h=r[c];this.setAttribute(c,h.clone(n))}const s=e.morphAttributes;for(const c in s){const h=[],p=s[c];for(let f=0,g=p.length;f<g;f++)h.push(p[f].clone(n));this.morphAttributes[c]=h}this.morphTargetsRelative=e.morphTargetsRelative;const a=e.groups;for(let c=0,h=a.length;c<h;c++){const p=a[c];this.addGroup(p.start,p.count,p.materialIndex)}const o=e.boundingBox;o!==null&&(this.boundingBox=o.clone());const l=e.boundingSphere;return l!==null&&(this.boundingSphere=l.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,this._transformed=e._transformed,this}dispose(){this.dispatchEvent({type:"dispose"})}}const Nd=new I,YE=new I,KE=new Ye;class Sr{constructor(e=new I(1,0,0),n=0){this.isPlane=!0,this.normal=e,this.constant=n}set(e,n){return this.normal.copy(e),this.constant=n,this}setComponents(e,n,i,r){return this.normal.set(e,n,i),this.constant=r,this}setFromNormalAndCoplanarPoint(e,n){return this.normal.copy(e),this.constant=-n.dot(this.normal),this}setFromCoplanarPoints(e,n,i){const r=Nd.subVectors(i,n).cross(YE.subVectors(e,n)).normalize();return this.setFromNormalAndCoplanarPoint(r,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){const e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,n){return n.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,n,i=!0){const r=e.delta(Nd),s=this.normal.dot(r);if(s===0)return this.distanceToPoint(e.start)===0?n.copy(e.start):null;const a=-(e.start.dot(this.normal)+this.constant)/s;return i===!0&&(a<0||a>1)?null:n.copy(e.start).addScaledVector(r,a)}intersectsLine(e){const n=this.distanceToPoint(e.start),i=this.distanceToPoint(e.end);return n<0&&i>0||i<0&&n>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,n){const i=n||KE.getNormalMatrix(e),r=this.coplanarPoint(Nd).applyMatrix4(e),s=this.normal.applyMatrix3(i).normalize();return this.constant=-r.dot(s),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}toJSON(){return{normal:this.normal.toArray(),constant:this.constant}}fromJSON(e){return this.normal.fromArray(e.normal),this.constant=e.constant,this}}let ZE=0;class $a extends ps{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:ZE++}),this.uuid=dl(),this.name="",this.type="Material",this.blending=Fo,this.side=Os,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=rx,this.blendDst=sx,this.blendEquation=la,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new ct(0,0,0),this.blendAlpha=0,this.depthFunc=tl,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=xE,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=fd,this.stencilZFail=fd,this.stencilZPass=fd,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(const n in e){const i=e[n];if(i===void 0){Ve(`Material: parameter '${n}' has value of undefined.`);continue}const r=this[n];if(r===void 0){Ve(`Material: '${n}' is not a property of THREE.${this.type}.`);continue}r&&r.isColor?r.set(i):r&&r.isVector2&&i&&i.isVector2||r&&r.isEuler&&i&&i.isEuler||r&&r.isVector3&&i&&i.isVector3?r.copy(i):this[n]=i}}toJSON(e){const n=e===void 0||typeof e=="string";n&&(e={textures:{},images:{}});const i={metadata:{version:4.7,type:"Material",generator:"Material.toJSON"}};i.uuid=this.uuid,i.type=this.type,i.blending=this.blending,i.side=this.side,i.shadowSide=this.shadowSide,i.vertexColors=this.vertexColors,i.opacity=this.opacity,i.transparent=this.transparent,i.blendSrc=this.blendSrc,i.blendDst=this.blendDst,i.blendEquation=this.blendEquation,i.blendSrcAlpha=this.blendSrcAlpha,i.blendDstAlpha=this.blendDstAlpha,i.blendEquationAlpha=this.blendEquationAlpha,i.blendColor=this.blendColor.getHex(),i.blendAlpha=this.blendAlpha,i.depthFunc=this.depthFunc,i.depthTest=this.depthTest,i.depthWrite=this.depthWrite,i.colorWrite=this.colorWrite,i.clipIntersection=this.clipIntersection,i.clipShadows=this.clipShadows,i.stencilWriteMask=this.stencilWriteMask,i.stencilFunc=this.stencilFunc,i.stencilRef=this.stencilRef,i.stencilFuncMask=this.stencilFuncMask,i.stencilFail=this.stencilFail,i.stencilZFail=this.stencilZFail,i.stencilZPass=this.stencilZPass,i.stencilWrite=this.stencilWrite,i.polygonOffset=this.polygonOffset,i.polygonOffsetFactor=this.polygonOffsetFactor,i.polygonOffsetUnits=this.polygonOffsetUnits,i.dithering=this.dithering,i.alphaTest=this.alphaTest,i.alphaHash=this.alphaHash,i.alphaToCoverage=this.alphaToCoverage,i.premultipliedAlpha=this.premultipliedAlpha,i.forceSinglePass=this.forceSinglePass,i.allowOverride=this.allowOverride,i.visible=this.visible,i.toneMapped=this.toneMapped,i.name=this.name,this.color&&this.color.isColor&&(i.color=this.color.getHex()),this.roughness!==void 0&&(i.roughness=this.roughness),this.metalness!==void 0&&(i.metalness=this.metalness),this.sheen!==void 0&&(i.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(i.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(i.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(i.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&(i.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(i.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(i.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(i.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(i.shininess=this.shininess),this.clearcoat!==void 0&&(i.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(i.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(i.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(i.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(i.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,i.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.sheenColorMap&&this.sheenColorMap.isTexture&&(i.sheenColorMap=this.sheenColorMap.toJSON(e).uuid),this.sheenRoughnessMap&&this.sheenRoughnessMap.isTexture&&(i.sheenRoughnessMap=this.sheenRoughnessMap.toJSON(e).uuid),this.dispersion!==void 0&&(i.dispersion=this.dispersion),this.retroreflectivity!==void 0&&(i.retroreflectivity=this.retroreflectivity),this.iridescence!==void 0&&(i.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(i.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(i.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(i.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(i.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.anisotropy!==void 0&&(i.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(i.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(i.anisotropyMap=this.anisotropyMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(i.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(i.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(i.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(i.lightMap=this.lightMap.toJSON(e).uuid,i.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(i.aoMap=this.aoMap.toJSON(e).uuid,i.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(i.bumpMap=this.bumpMap.toJSON(e).uuid,i.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(i.normalMap=this.normalMap.toJSON(e).uuid,i.normalMapType=this.normalMapType,i.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(i.displacementMap=this.displacementMap.toJSON(e).uuid,i.displacementScale=this.displacementScale,i.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(i.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(i.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(i.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(i.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(i.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(i.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(i.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(i.combine=this.combine)),this.envMapRotation!==void 0&&(i.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(i.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(i.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(i.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(i.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(i.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(i.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(i.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(i.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&(i.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(i.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(i.size=this.size),this.sizeAttenuation!==void 0&&(i.sizeAttenuation=this.sizeAttenuation),Array.isArray(this.clippingPlanes)&&this.clippingPlanes.length>0&&(i.clippingPlanes=this.clippingPlanes.map(s=>s.toJSON())),this.rotation!==void 0&&(i.rotation=this.rotation),this.depthPacking!==void 0&&(i.depthPacking=this.depthPacking),this.linewidth!==void 0&&(i.linewidth=this.linewidth),this.linecap!==void 0&&(i.linecap=this.linecap),this.linejoin!==void 0&&(i.linejoin=this.linejoin),this.dashSize!==void 0&&(i.dashSize=this.dashSize),this.gapSize!==void 0&&(i.gapSize=this.gapSize),this.scale!==void 0&&(i.scale=this.scale),this.wireframe!==void 0&&(i.wireframe=this.wireframe),this.wireframeLinewidth!==void 0&&(i.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!==void 0&&(i.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!==void 0&&(i.wireframeLinejoin=this.wireframeLinejoin),this.flatShading!==void 0&&(i.flatShading=this.flatShading),this.fog!==void 0&&(i.fog=this.fog),Object.keys(this.userData).length>0&&(i.userData=this.userData);function r(s){const a=[];for(const o in s){const l=s[o];delete l.metadata,a.push(l)}return a}if(n){const s=r(e.textures),a=r(e.images);s.length>0&&(i.textures=s),a.length>0&&(i.images=a)}return i}fromJSON(e,n){if(e.uuid!==void 0&&(this.uuid=e.uuid),e.name!==void 0&&(this.name=e.name),e.color!==void 0&&this.color!==void 0&&this.color.setHex(e.color),e.roughness!==void 0&&(this.roughness=e.roughness),e.metalness!==void 0&&(this.metalness=e.metalness),e.sheen!==void 0&&(this.sheen=e.sheen),e.sheenColor!==void 0&&(this.sheenColor=new ct().setHex(e.sheenColor)),e.sheenRoughness!==void 0&&(this.sheenRoughness=e.sheenRoughness),e.emissive!==void 0&&this.emissive!==void 0&&this.emissive.setHex(e.emissive),e.specular!==void 0&&this.specular!==void 0&&this.specular.setHex(e.specular),e.specularIntensity!==void 0&&(this.specularIntensity=e.specularIntensity),e.specularColor!==void 0&&this.specularColor!==void 0&&this.specularColor.setHex(e.specularColor),e.shininess!==void 0&&(this.shininess=e.shininess),e.clearcoat!==void 0&&(this.clearcoat=e.clearcoat),e.clearcoatRoughness!==void 0&&(this.clearcoatRoughness=e.clearcoatRoughness),e.dispersion!==void 0&&(this.dispersion=e.dispersion),e.retroreflectivity!==void 0&&(this.retroreflectivity=e.retroreflectivity),e.iridescence!==void 0&&(this.iridescence=e.iridescence),e.iridescenceIOR!==void 0&&(this.iridescenceIOR=e.iridescenceIOR),e.iridescenceThicknessRange!==void 0&&(this.iridescenceThicknessRange=e.iridescenceThicknessRange),e.transmission!==void 0&&(this.transmission=e.transmission),e.thickness!==void 0&&(this.thickness=e.thickness),e.attenuationDistance!==void 0&&(this.attenuationDistance=e.attenuationDistance),e.attenuationColor!==void 0&&this.attenuationColor!==void 0&&this.attenuationColor.setHex(e.attenuationColor),e.anisotropy!==void 0&&(this.anisotropy=e.anisotropy),e.anisotropyRotation!==void 0&&(this.anisotropyRotation=e.anisotropyRotation),e.fog!==void 0&&(this.fog=e.fog),e.flatShading!==void 0&&(this.flatShading=e.flatShading),e.blending!==void 0&&(this.blending=e.blending),e.combine!==void 0&&(this.combine=e.combine),e.side!==void 0&&(this.side=e.side),e.shadowSide!==void 0&&(this.shadowSide=e.shadowSide),e.opacity!==void 0&&(this.opacity=e.opacity),e.transparent!==void 0&&(this.transparent=e.transparent),e.alphaTest!==void 0&&(this.alphaTest=e.alphaTest),e.alphaHash!==void 0&&(this.alphaHash=e.alphaHash),e.depthFunc!==void 0&&(this.depthFunc=e.depthFunc),e.depthTest!==void 0&&(this.depthTest=e.depthTest),e.depthWrite!==void 0&&(this.depthWrite=e.depthWrite),e.colorWrite!==void 0&&(this.colorWrite=e.colorWrite),e.clippingPlanes!==void 0&&(this.clippingPlanes=e.clippingPlanes.map(i=>new Sr().fromJSON(i))),e.clipIntersection!==void 0&&(this.clipIntersection=e.clipIntersection),e.clipShadows!==void 0&&(this.clipShadows=e.clipShadows),e.depthPacking!==void 0&&(this.depthPacking=e.depthPacking),e.blendSrc!==void 0&&(this.blendSrc=e.blendSrc),e.blendDst!==void 0&&(this.blendDst=e.blendDst),e.blendEquation!==void 0&&(this.blendEquation=e.blendEquation),e.blendSrcAlpha!==void 0&&(this.blendSrcAlpha=e.blendSrcAlpha),e.blendDstAlpha!==void 0&&(this.blendDstAlpha=e.blendDstAlpha),e.blendEquationAlpha!==void 0&&(this.blendEquationAlpha=e.blendEquationAlpha),e.blendColor!==void 0&&this.blendColor!==void 0&&this.blendColor.setHex(e.blendColor),e.blendAlpha!==void 0&&(this.blendAlpha=e.blendAlpha),e.stencilWriteMask!==void 0&&(this.stencilWriteMask=e.stencilWriteMask),e.stencilFunc!==void 0&&(this.stencilFunc=e.stencilFunc),e.stencilRef!==void 0&&(this.stencilRef=e.stencilRef),e.stencilFuncMask!==void 0&&(this.stencilFuncMask=e.stencilFuncMask),e.stencilFail!==void 0&&(this.stencilFail=e.stencilFail),e.stencilZFail!==void 0&&(this.stencilZFail=e.stencilZFail),e.stencilZPass!==void 0&&(this.stencilZPass=e.stencilZPass),e.stencilWrite!==void 0&&(this.stencilWrite=e.stencilWrite),e.wireframe!==void 0&&(this.wireframe=e.wireframe),e.wireframeLinewidth!==void 0&&(this.wireframeLinewidth=e.wireframeLinewidth),e.wireframeLinecap!==void 0&&(this.wireframeLinecap=e.wireframeLinecap),e.wireframeLinejoin!==void 0&&(this.wireframeLinejoin=e.wireframeLinejoin),e.rotation!==void 0&&(this.rotation=e.rotation),e.linewidth!==void 0&&(this.linewidth=e.linewidth),e.linecap!==void 0&&(this.linecap=e.linecap),e.linejoin!==void 0&&(this.linejoin=e.linejoin),e.dashSize!==void 0&&(this.dashSize=e.dashSize),e.gapSize!==void 0&&(this.gapSize=e.gapSize),e.scale!==void 0&&(this.scale=e.scale),e.polygonOffset!==void 0&&(this.polygonOffset=e.polygonOffset),e.polygonOffsetFactor!==void 0&&(this.polygonOffsetFactor=e.polygonOffsetFactor),e.polygonOffsetUnits!==void 0&&(this.polygonOffsetUnits=e.polygonOffsetUnits),e.dithering!==void 0&&(this.dithering=e.dithering),e.alphaToCoverage!==void 0&&(this.alphaToCoverage=e.alphaToCoverage),e.premultipliedAlpha!==void 0&&(this.premultipliedAlpha=e.premultipliedAlpha),e.forceSinglePass!==void 0&&(this.forceSinglePass=e.forceSinglePass),e.allowOverride!==void 0&&(this.allowOverride=e.allowOverride),e.visible!==void 0&&(this.visible=e.visible),e.toneMapped!==void 0&&(this.toneMapped=e.toneMapped),e.userData!==void 0&&(this.userData=e.userData),e.vertexColors!==void 0&&(typeof e.vertexColors=="number"?this.vertexColors=e.vertexColors>0:this.vertexColors=e.vertexColors),e.size!==void 0&&(this.size=e.size),e.sizeAttenuation!==void 0&&(this.sizeAttenuation=e.sizeAttenuation),e.map!==void 0&&(this.map=n[e.map]||null),e.matcap!==void 0&&(this.matcap=n[e.matcap]||null),e.alphaMap!==void 0&&(this.alphaMap=n[e.alphaMap]||null),e.bumpMap!==void 0&&(this.bumpMap=n[e.bumpMap]||null),e.bumpScale!==void 0&&(this.bumpScale=e.bumpScale),e.normalMap!==void 0&&(this.normalMap=n[e.normalMap]||null),e.normalMapType!==void 0&&(this.normalMapType=e.normalMapType),e.normalScale!==void 0){let i=e.normalScale;Array.isArray(i)===!1&&(i=[i,i]),this.normalScale=new We().fromArray(i)}return e.displacementMap!==void 0&&(this.displacementMap=n[e.displacementMap]||null),e.displacementScale!==void 0&&(this.displacementScale=e.displacementScale),e.displacementBias!==void 0&&(this.displacementBias=e.displacementBias),e.roughnessMap!==void 0&&(this.roughnessMap=n[e.roughnessMap]||null),e.metalnessMap!==void 0&&(this.metalnessMap=n[e.metalnessMap]||null),e.emissiveMap!==void 0&&(this.emissiveMap=n[e.emissiveMap]||null),e.emissiveIntensity!==void 0&&(this.emissiveIntensity=e.emissiveIntensity),e.specularMap!==void 0&&(this.specularMap=n[e.specularMap]||null),e.specularIntensityMap!==void 0&&(this.specularIntensityMap=n[e.specularIntensityMap]||null),e.specularColorMap!==void 0&&(this.specularColorMap=n[e.specularColorMap]||null),e.envMap!==void 0&&(this.envMap=n[e.envMap]||null),e.envMapRotation!==void 0&&this.envMapRotation.fromArray(e.envMapRotation),e.envMapIntensity!==void 0&&(this.envMapIntensity=e.envMapIntensity),e.reflectivity!==void 0&&(this.reflectivity=e.reflectivity),e.refractionRatio!==void 0&&(this.refractionRatio=e.refractionRatio),e.lightMap!==void 0&&(this.lightMap=n[e.lightMap]||null),e.lightMapIntensity!==void 0&&(this.lightMapIntensity=e.lightMapIntensity),e.aoMap!==void 0&&(this.aoMap=n[e.aoMap]||null),e.aoMapIntensity!==void 0&&(this.aoMapIntensity=e.aoMapIntensity),e.gradientMap!==void 0&&(this.gradientMap=n[e.gradientMap]||null),e.clearcoatMap!==void 0&&(this.clearcoatMap=n[e.clearcoatMap]||null),e.clearcoatRoughnessMap!==void 0&&(this.clearcoatRoughnessMap=n[e.clearcoatRoughnessMap]||null),e.clearcoatNormalMap!==void 0&&(this.clearcoatNormalMap=n[e.clearcoatNormalMap]||null),e.clearcoatNormalScale!==void 0&&(this.clearcoatNormalScale=new We().fromArray(e.clearcoatNormalScale)),e.iridescenceMap!==void 0&&(this.iridescenceMap=n[e.iridescenceMap]||null),e.iridescenceThicknessMap!==void 0&&(this.iridescenceThicknessMap=n[e.iridescenceThicknessMap]||null),e.transmissionMap!==void 0&&(this.transmissionMap=n[e.transmissionMap]||null),e.thicknessMap!==void 0&&(this.thicknessMap=n[e.thicknessMap]||null),e.anisotropyMap!==void 0&&(this.anisotropyMap=n[e.anisotropyMap]||null),e.sheenColorMap!==void 0&&(this.sheenColorMap=n[e.sheenColorMap]||null),e.sheenRoughnessMap!==void 0&&(this.sheenRoughnessMap=n[e.sheenRoughnessMap]||null),this}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.blendColor.copy(e.blendColor),this.blendAlpha=e.blendAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;const n=e.clippingPlanes;let i=null;if(n!==null){const r=n.length;i=new Array(r);for(let s=0;s!==r;++s)i[s]=n[s].clone()}return this.clippingPlanes=i,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaHash=e.alphaHash,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.allowOverride=e.allowOverride,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(e){e===!0&&this.version++}}const _r=new I,Ld=new I,Hl=new I,Vl=new I;class bu{constructor(e=new I,n=new I(0,0,-1)){this.origin=e,this.direction=n}set(e,n){return this.origin.copy(e),this.direction.copy(n),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,n){return n.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,_r)),this}closestPointToPoint(e,n){n.subVectors(e,this.origin);const i=n.dot(this.direction);return i<0?n.copy(this.origin):n.copy(this.origin).addScaledVector(this.direction,i)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){const n=_r.subVectors(e,this.origin).dot(this.direction);return n<0?this.origin.distanceToSquared(e):(_r.copy(this.origin).addScaledVector(this.direction,n),_r.distanceToSquared(e))}distanceSqToSegment(e,n,i,r){Ld.copy(e).add(n).multiplyScalar(.5),Hl.copy(n).sub(e).normalize(),Vl.copy(this.origin).sub(Ld);const s=e.distanceTo(n)*.5,a=-this.direction.dot(Hl),o=Vl.dot(this.direction),l=-Vl.dot(Hl),c=Vl.lengthSq(),h=Math.abs(1-a*a);let p,f,g,v;if(h>0)if(p=a*l-o,f=a*o-l,v=s*h,p>=0)if(f>=-v)if(f<=v){const S=1/h;p*=S,f*=S,g=p*(p+a*f+2*o)+f*(a*p+f+2*l)+c}else f=s,p=Math.max(0,-(a*f+o)),g=-p*p+f*(f+2*l)+c;else f=-s,p=Math.max(0,-(a*f+o)),g=-p*p+f*(f+2*l)+c;else f<=-v?(p=Math.max(0,-(-a*s+o)),f=p>0?-s:Math.min(Math.max(-s,-l),s),g=-p*p+f*(f+2*l)+c):f<=v?(p=0,f=Math.min(Math.max(-s,-l),s),g=f*(f+2*l)+c):(p=Math.max(0,-(a*s+o)),f=p>0?s:Math.min(Math.max(-s,-l),s),g=-p*p+f*(f+2*l)+c);else f=a>0?-s:s,p=Math.max(0,-(a*f+o)),g=-p*p+f*(f+2*l)+c;return i&&i.copy(this.origin).addScaledVector(this.direction,p),r&&r.copy(Ld).addScaledVector(Hl,f),g}intersectSphere(e,n){if(e.radius<0)return null;_r.subVectors(e.center,this.origin);const i=_r.dot(this.direction),r=_r.dot(_r)-i*i,s=e.radius*e.radius;if(r>s)return null;const a=Math.sqrt(s-r),o=i-a,l=i+a;return l<0?null:o<0?this.at(l,n):this.at(o,n)}intersectsSphere(e){return e.radius<0?!1:this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){const n=e.normal.dot(this.direction);if(n===0)return e.distanceToPoint(this.origin)===0?0:null;const i=-(this.origin.dot(e.normal)+e.constant)/n;return i>=0?i:null}intersectPlane(e,n){const i=this.distanceToPlane(e);return i===null?null:this.at(i,n)}intersectsPlane(e){const n=e.distanceToPoint(this.origin);return n===0||e.normal.dot(this.direction)*n<0}intersectBox(e,n){let i,r,s,a,o,l;const c=1/this.direction.x,h=1/this.direction.y,p=1/this.direction.z,f=this.origin;return c>=0?(i=(e.min.x-f.x)*c,r=(e.max.x-f.x)*c):(i=(e.max.x-f.x)*c,r=(e.min.x-f.x)*c),h>=0?(s=(e.min.y-f.y)*h,a=(e.max.y-f.y)*h):(s=(e.max.y-f.y)*h,a=(e.min.y-f.y)*h),i>a||s>r||((s>i||isNaN(i))&&(i=s),(a<r||isNaN(r))&&(r=a),p>=0?(o=(e.min.z-f.z)*p,l=(e.max.z-f.z)*p):(o=(e.max.z-f.z)*p,l=(e.min.z-f.z)*p),i>l||o>r)||((o>i||i!==i)&&(i=o),(l<r||r!==r)&&(r=l),r<0)?null:this.at(i>=0?i:r,n)}intersectsBox(e){return this.intersectBox(e,_r)!==null}intersectTriangle(e,n,i,r,s){const a=this.origin,o=this.direction,l=o.x,c=o.y,h=o.z,p=e.x-a.x,f=e.y-a.y,g=e.z-a.z,v=n.x-a.x,S=n.y-a.y,_=n.z-a.z,d=i.x-a.x,m=i.y-a.y,M=i.z-a.z,y=Math.abs(l),T=Math.abs(c),E=Math.abs(h);let C,x,b,P,D,O,F,U,W,N,z,k;if(y>=T&&y>=E?(b=l,O=p,W=v,k=d,l>=0?(C=c,x=h,P=f,D=g,F=S,U=_,N=m,z=M):(C=h,x=c,P=g,D=f,F=_,U=S,N=M,z=m)):T>=E?(b=c,O=f,W=S,k=m,c>=0?(C=h,x=l,P=g,D=p,F=_,U=v,N=M,z=d):(C=l,x=h,P=p,D=g,F=v,U=_,N=d,z=M)):(b=h,O=g,W=_,k=M,h>=0?(C=l,x=c,P=p,D=f,F=v,U=S,N=d,z=m):(C=c,x=l,P=f,D=p,F=S,U=v,N=m,z=d)),b===0)return null;const j=C/b,L=x/b,$=1/b,de=P-j*O,we=D-L*O,Ke=F-j*W,$e=U-L*W,Ze=N-j*k,Q=z-L*k,ee=Ze*$e-Q*Ke,Ne=de*Q-we*Ze,je=Ke*we-$e*de;if(r){if(ee<0||Ne<0||je<0)return null}else if((ee<0||Ne<0||je<0)&&(ee>0||Ne>0||je>0))return null;const Re=ee+Ne+je;if(Re===0)return null;const Qe=$*(ee*O+Ne*W+je*k);return(Re>0?Qe<0:Qe>0)?null:this.at(Qe/Re,s)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}}class nu extends $a{constructor(e){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new ct(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new us,this.combine=ax,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}}const H0=new kt,ys=new bu,Gl=new Tu,V0=new I,jl=new I,Wl=new I,Xl=new I,Dd=new I,$l=new I,G0=new I,ql=new I;class Be extends hn{constructor(e=new Rn,n=new nu){super(),this.isMesh=!0,this.type="Mesh",this.geometry=e,this.material=n,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.count=1,this.updateMorphTargets()}copy(e,n){return super.copy(e,n),e.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=e.morphTargetInfluences.slice()),e.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary)),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}updateMorphTargets(){const n=this.geometry.morphAttributes,i=Object.keys(n);if(i.length>0){const r=n[i[0]];if(r!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let s=0,a=r.length;s<a;s++){const o=r[s].name||String(s);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=s}}}}getVertexPosition(e,n){const i=this.geometry,r=i.attributes.position,s=i.morphAttributes.position,a=i.morphTargetsRelative;n.fromBufferAttribute(r,e);const o=this.morphTargetInfluences;if(s&&o){$l.set(0,0,0);for(let l=0,c=s.length;l<c;l++){const h=o[l],p=s[l];h!==0&&(Dd.fromBufferAttribute(p,e),a?$l.addScaledVector(Dd,h):$l.addScaledVector(Dd.sub(n),h))}n.add($l)}return n}intersectsFrustum(e){return e.intersectsObject(this)}raycast(e,n){const i=this.geometry,r=this.material,s=this.matrixWorld;r!==void 0&&(i.boundingSphere===null&&i.computeBoundingSphere(),Gl.copy(i.boundingSphere),Gl.applyMatrix4(s),ys.copy(e.ray).recast(e.near),!(Gl.containsPoint(ys.origin)===!1&&(ys.intersectSphere(Gl,V0)===null||ys.origin.distanceToSquared(V0)>(e.far-e.near)**2))&&(H0.copy(s).invert(),ys.copy(e.ray).applyMatrix4(H0),!(i.boundingBox!==null&&ys.intersectsBox(i.boundingBox)===!1)&&this._computeIntersections(e,n,ys)))}_computeIntersections(e,n,i){let r;const s=this.geometry,a=this.material,o=s.index,l=s.attributes.position,c=s.attributes.uv,h=s.attributes.uv1,p=s.attributes.normal,f=s.groups,g=s.drawRange;if(o!==null)if(Array.isArray(a))for(let v=0,S=f.length;v<S;v++){const _=f[v],d=a[_.materialIndex],m=Math.max(_.start,g.start),M=Math.min(o.count,Math.min(_.start+_.count,g.start+g.count));for(let y=m,T=M;y<T;y+=3){const E=o.getX(y),C=o.getX(y+1),x=o.getX(y+2);r=Yl(this,d,e,i,c,h,p,E,C,x),r&&(r.faceIndex=Math.floor(y/3),r.face.materialIndex=_.materialIndex,n.push(r))}}else{const v=Math.max(0,g.start),S=Math.min(o.count,g.start+g.count);for(let _=v,d=S;_<d;_+=3){const m=o.getX(_),M=o.getX(_+1),y=o.getX(_+2);r=Yl(this,a,e,i,c,h,p,m,M,y),r&&(r.faceIndex=Math.floor(_/3),n.push(r))}}else if(l!==void 0)if(Array.isArray(a))for(let v=0,S=f.length;v<S;v++){const _=f[v],d=a[_.materialIndex],m=Math.max(_.start,g.start),M=Math.min(l.count,Math.min(_.start+_.count,g.start+g.count));for(let y=m,T=M;y<T;y+=3){const E=y,C=y+1,x=y+2;r=Yl(this,d,e,i,c,h,p,E,C,x),r&&(r.faceIndex=Math.floor(y/3),r.face.materialIndex=_.materialIndex,n.push(r))}}else{const v=Math.max(0,g.start),S=Math.min(l.count,g.start+g.count);for(let _=v,d=S;_<d;_+=3){const m=_,M=_+1,y=_+2;r=Yl(this,a,e,i,c,h,p,m,M,y),r&&(r.faceIndex=Math.floor(_/3),n.push(r))}}}}function QE(t,e,n,i,r,s,a,o){let l;if(e.side===Yn?l=i.intersectTriangle(a,s,r,!0,o):l=i.intersectTriangle(r,s,a,e.side===Os,o),l===null)return null;ql.copy(o),ql.applyMatrix4(t.matrixWorld);const c=n.ray.origin.distanceTo(ql);return c<n.near||c>n.far?null:{distance:c,point:ql.clone(),object:t}}function Yl(t,e,n,i,r,s,a,o,l,c){t.getVertexPosition(o,jl),t.getVertexPosition(l,Wl),t.getVertexPosition(c,Xl);const h=QE(t,e,n,i,jl,Wl,Xl,G0);if(h){const p=new I;mi.getBarycoord(G0,jl,Wl,Xl,p),r&&(h.uv=mi.getInterpolatedAttribute(r,o,l,c,p,new We)),s&&(h.uv1=mi.getInterpolatedAttribute(s,o,l,c,p,new We)),a&&(h.normal=mi.getInterpolatedAttribute(a,o,l,c,p,new I),h.normal.dot(i.direction)>0&&h.normal.multiplyScalar(-1));const f={a:o,b:l,c,normal:new I,materialIndex:0};mi.getNormal(jl,Wl,Xl,f.normal),h.face=f,h.barycoord=p}return h}class JE extends An{constructor(e=null,n=1,i=1,r,s,a,o,l,c=gn,h=gn,p,f){super(null,a,o,l,c,h,r,s,p,f),this.isDataTexture=!0,this.image={data:e,width:n,height:i},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}const Ss=new Tu,ew=new We(.5,.5),Kl=new I;class Hp{constructor(e=new Sr,n=new Sr,i=new Sr,r=new Sr,s=new Sr,a=new Sr){this.planes=[e,n,i,r,s,a]}set(e,n,i,r,s,a){const o=this.planes;return o[0].copy(e),o[1].copy(n),o[2].copy(i),o[3].copy(r),o[4].copy(s),o[5].copy(a),this}copy(e){const n=this.planes;for(let i=0;i<6;i++)n[i].copy(e.planes[i]);return this}setFromProjectionMatrix(e,n=ir,i=!1){const r=this.planes,s=e.elements,a=s[0],o=s[1],l=s[2],c=s[3],h=s[4],p=s[5],f=s[6],g=s[7],v=s[8],S=s[9],_=s[10],d=s[11],m=s[12],M=s[13],y=s[14],T=s[15];if(r[0].setComponents(c-a,g-h,d-v,T-m).normalize(),r[1].setComponents(c+a,g+h,d+v,T+m).normalize(),r[2].setComponents(c+o,g+p,d+S,T+M).normalize(),r[3].setComponents(c-o,g-p,d-S,T-M).normalize(),i)r[4].setComponents(l,f,_,y).normalize(),r[5].setComponents(c-l,g-f,d-_,T-y).normalize();else if(r[4].setComponents(c-l,g-f,d-_,T-y).normalize(),n===ir)r[5].setComponents(c+l,g+f,d+_,T+y).normalize();else if(n===rl)r[5].setComponents(l,f,_,y).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+n);return this}intersectsObject(e){if(e.boundingSphere!==void 0)e.boundingSphere===null&&e.computeBoundingSphere(),Ss.copy(e.boundingSphere).applyMatrix4(e.matrixWorld);else{const n=e.geometry;n.boundingSphere===null&&n.computeBoundingSphere(),Ss.copy(n.boundingSphere).applyMatrix4(e.matrixWorld)}return this.intersectsSphere(Ss)}intersectsSprite(e){Ss.center.set(0,0,0);const n=ew.distanceTo(e.center);return Ss.radius=.7071067811865476+n,Ss.applyMatrix4(e.matrixWorld),this.intersectsSphere(Ss)}intersectsSphere(e){const n=this.planes,i=e.center,r=-e.radius;for(let s=0;s<6;s++)if(n[s].distanceToPoint(i)<r)return!1;return!0}intersectsBox(e){const n=this.planes;for(let i=0;i<6;i++){const r=n[i];if(Kl.x=r.normal.x>0?e.max.x:e.min.x,Kl.y=r.normal.y>0?e.max.y:e.min.y,Kl.z=r.normal.z>0?e.max.z:e.min.z,r.distanceToPoint(Kl)<0)return!1}return!0}containsPoint(e){const n=this.planes;for(let i=0;i<6;i++)if(n[i].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}}class Cx extends $a{constructor(e){super(),this.isLineBasicMaterial=!0,this.type="LineBasicMaterial",this.color=new ct(16777215),this.map=null,this.linewidth=1,this.linecap="round",this.linejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.linewidth=e.linewidth,this.linecap=e.linecap,this.linejoin=e.linejoin,this.fog=e.fog,this}}const iu=new I,ru=new I,j0=new kt,go=new bu,Zl=new Tu,Id=new I,W0=new I;class tw extends hn{constructor(e=new Rn,n=new Cx){super(),this.isLine=!0,this.type="Line",this.geometry=e,this.material=n,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(e,n){return super.copy(e,n),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}computeLineDistances(){const e=this.geometry;if(e.index===null){const n=e.attributes.position,i=[0];for(let r=1,s=n.count;r<s;r++)iu.fromBufferAttribute(n,r-1),ru.fromBufferAttribute(n,r),i[r]=i[r-1],i[r]+=iu.distanceTo(ru);e.setAttribute("lineDistance",new Wt(i,1))}else Ve("Line.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}intersectsFrustum(e){return e.intersectsObject(this)}raycast(e,n){const i=this.geometry,r=this.matrixWorld,s=e.params.Line.threshold,a=i.drawRange;if(i.boundingSphere===null&&i.computeBoundingSphere(),Zl.copy(i.boundingSphere),Zl.applyMatrix4(r),Zl.radius+=s,e.ray.intersectsSphere(Zl)===!1)return;j0.copy(r).invert(),go.copy(e.ray).applyMatrix4(j0);const o=s/((this.scale.x+this.scale.y+this.scale.z)/3),l=o*o,c=this.isLineSegments?2:1,h=i.index,f=i.attributes.position;if(h!==null){const g=Math.max(0,a.start),v=Math.min(h.count,a.start+a.count);for(let S=g,_=v-1;S<_;S+=c){const d=h.getX(S),m=h.getX(S+1),M=Ql(this,e,go,l,d,m,S);M&&n.push(M)}if(this.isLineLoop){const S=h.getX(v-1),_=h.getX(g),d=Ql(this,e,go,l,S,_,v-1);d&&n.push(d)}}else{const g=Math.max(0,a.start),v=Math.min(f.count,a.start+a.count);for(let S=g,_=v-1;S<_;S+=c){const d=Ql(this,e,go,l,S,S+1,S);d&&n.push(d)}if(this.isLineLoop){const S=Ql(this,e,go,l,v-1,g,v-1);S&&n.push(S)}}}updateMorphTargets(){const n=this.geometry.morphAttributes,i=Object.keys(n);if(i.length>0){const r=n[i[0]];if(r!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let s=0,a=r.length;s<a;s++){const o=r[s].name||String(s);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=s}}}}}function Ql(t,e,n,i,r,s,a){const o=t.geometry.attributes.position;if(iu.fromBufferAttribute(o,r),ru.fromBufferAttribute(o,s),n.distanceSqToSegment(iu,ru,Id,W0)>i)return;Id.applyMatrix4(t.matrixWorld);const c=e.ray.origin.distanceTo(Id);if(!(c<e.near||c>e.far))return{distance:c,point:W0.clone().applyMatrix4(t.matrixWorld),index:a,face:null,faceIndex:null,barycoord:null,object:t}}const X0=new I,$0=new I;class nw extends tw{constructor(e,n){super(e,n),this.isLineSegments=!0,this.type="LineSegments"}computeLineDistances(){const e=this.geometry;if(e.index===null){const n=e.attributes.position,i=[];for(let r=0,s=n.count;r<s;r+=2)X0.fromBufferAttribute(n,r),$0.fromBufferAttribute(n,r+1),i[r]=r===0?0:i[r-1],i[r+1]=i[r]+X0.distanceTo($0);e.setAttribute("lineDistance",new Wt(i,1))}else Ve("LineSegments.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}}class Rx extends An{constructor(e=[],n=ks,i,r,s,a,o,l,c,h){super(e,n,i,r,s,a,o,l,c,h),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}}class iw extends An{constructor(e,n,i,r,s,a,o,l,c){super(e,n,i,r,s,a,o,l,c),this.isCanvasTexture=!0,this.needsUpdate=!0}}class sl extends An{constructor(e,n,i=or,r,s,a,o=gn,l=gn,c,h=Lr,p=1){if(h!==Lr&&h!==Rs)throw new Error("THREE.DepthTexture: format must be either THREE.DepthFormat or THREE.DepthStencilFormat");const f={width:e,height:n,depth:p};super(f,r,s,a,o,l,h,i,c),this.isDepthTexture=!0,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(e){return super.copy(e),this.source=new kp(Object.assign({},e.image)),this.compareFunction=e.compareFunction,this}toJSON(e){const n=super.toJSON(e);return n.compareFunction=this.compareFunction,n}}class rw extends sl{constructor(e,n=or,i=ks,r,s,a=gn,o=gn,l,c=Lr){const h={width:e,height:e,depth:1},p=[h,h,h,h,h,h];super(e,e,n,i,r,s,a,o,l,c),this.image=p,this.isCubeDepthTexture=!0,this.isCubeTexture=!0}get images(){return this.image}set images(e){this.image=e}}class Px extends An{constructor(e=null){super(),this.sourceTexture=e,this.isExternalTexture=!0}copy(e){return super.copy(e),this.sourceTexture=e.sourceTexture,this}}class Ft extends Rn{constructor(e=1,n=1,i=1,r=1,s=1,a=1){super(),this.type="BoxGeometry",this.parameters={width:e,height:n,depth:i,widthSegments:r,heightSegments:s,depthSegments:a};const o=this;r=Math.floor(r),s=Math.floor(s),a=Math.floor(a);const l=[],c=[],h=[],p=[];let f=0,g=0;v("z","y","x",-1,-1,i,n,e,a,s,0),v("z","y","x",1,-1,i,n,-e,a,s,1),v("x","z","y",1,1,e,i,n,r,a,2),v("x","z","y",1,-1,e,i,-n,r,a,3),v("x","y","z",1,-1,e,n,i,r,s,4),v("x","y","z",-1,-1,e,n,-i,r,s,5),this.setIndex(l),this.setAttribute("position",new Wt(c,3)),this.setAttribute("normal",new Wt(h,3)),this.setAttribute("uv",new Wt(p,2));function v(S,_,d,m,M,y,T,E,C,x,b){const P=y/C,D=T/x,O=y/2,F=T/2,U=E/2,W=C+1,N=x+1;let z=0,k=0;const j=new I;for(let L=0;L<N;L++){const $=L*D-F;for(let de=0;de<W;de++){const we=de*P-O;j[S]=we*m,j[_]=$*M,j[d]=U,c.push(j.x,j.y,j.z),j[S]=0,j[_]=0,j[d]=E>0?1:-1,h.push(j.x,j.y,j.z),p.push(de/C),p.push(1-L/x),z+=1}}for(let L=0;L<x;L++)for(let $=0;$<C;$++){const de=f+$+W*L,we=f+$+W*(L+1),Ke=f+($+1)+W*(L+1),$e=f+($+1)+W*L;l.push(de,we,$e),l.push(we,Ke,$e),k+=6}o.addGroup(g,k,b),g+=k,f+=z}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new Ft(e.width,e.height,e.depth,e.widthSegments,e.heightSegments,e.depthSegments)}}class It extends Rn{constructor(e=1,n=1,i=1,r=32,s=1,a=!1,o=0,l=Math.PI*2){super(),this.type="CylinderGeometry",this.parameters={radiusTop:e,radiusBottom:n,height:i,radialSegments:r,heightSegments:s,openEnded:a,thetaStart:o,thetaLength:l};const c=this;r=Math.floor(r),s=Math.floor(s);const h=[],p=[],f=[],g=[];let v=0;const S=[],_=i/2;let d=0;m(),a===!1&&(e>0&&M(!0),n>0&&M(!1)),this.setIndex(h),this.setAttribute("position",new Wt(p,3)),this.setAttribute("normal",new Wt(f,3)),this.setAttribute("uv",new Wt(g,2));function m(){const y=new I,T=new I;let E=0;const C=(n-e)/i;for(let x=0;x<=s;x++){const b=[],P=x/s,D=P*(n-e)+e;for(let O=0;O<=r;O++){const F=O/r,U=F*l+o,W=Math.sin(U),N=Math.cos(U);T.x=D*W,T.y=-P*i+_,T.z=D*N,p.push(T.x,T.y,T.z),y.set(W,C,N).normalize(),f.push(y.x,y.y,y.z),g.push(F,1-P),b.push(v++)}S.push(b)}for(let x=0;x<r;x++)for(let b=0;b<s;b++){const P=S[b][x],D=S[b+1][x],O=S[b+1][x+1],F=S[b][x+1];(e>0||b!==0)&&(h.push(P,D,F),E+=3),(n>0||b!==s-1)&&(h.push(D,O,F),E+=3)}c.addGroup(d,E,0),d+=E}function M(y){const T=v,E=new We,C=new I;let x=0;const b=y===!0?e:n,P=y===!0?1:-1;for(let O=1;O<=r;O++)p.push(0,_*P,0),f.push(0,P,0),g.push(.5,.5),v++;const D=v;for(let O=0;O<=r;O++){const U=O/r*l+o,W=Math.cos(U),N=Math.sin(U);C.x=b*N,C.y=_*P,C.z=b*W,p.push(C.x,C.y,C.z),f.push(0,P,0),E.x=W*.5+.5,E.y=N*.5*P+.5,g.push(E.x,E.y),v++}for(let O=0;O<r;O++){const F=T+O,U=D+O;y===!0?h.push(U,U+1,F):h.push(U+1,U,F),x+=3}c.addGroup(d,x,y===!0?1:2),d+=x}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new It(e.radiusTop,e.radiusBottom,e.height,e.radialSegments,e.heightSegments,e.openEnded,e.thetaStart,e.thetaLength)}}class Vp extends It{constructor(e=1,n=1,i=32,r=1,s=!1,a=0,o=Math.PI*2){super(0,e,n,i,r,s,a,o),this.type="ConeGeometry",this.parameters={radius:e,height:n,radialSegments:i,heightSegments:r,openEnded:s,thetaStart:a,thetaLength:o}}static fromJSON(e){return new Vp(e.radius,e.height,e.radialSegments,e.heightSegments,e.openEnded,e.thetaStart,e.thetaLength)}}const Jl=new I,ec=new I,Ud=new I,tc=new mi;class sw extends Rn{constructor(e=null,n=1){if(super(),this.type="EdgesGeometry",this.parameters={geometry:e,thresholdAngle:n},e!==null){const r=Math.pow(10,4),s=Math.cos(Oo*n),a=e.getIndex(),o=e.getAttribute("position"),l=a?a.count:o.count,c=[0,0,0],h=["a","b","c"],p=new Array(3),f={},g=[];for(let v=0;v<l;v+=3){a?(c[0]=a.getX(v),c[1]=a.getX(v+1),c[2]=a.getX(v+2)):(c[0]=v,c[1]=v+1,c[2]=v+2);const{a:S,b:_,c:d}=tc;if(S.fromBufferAttribute(o,c[0]),_.fromBufferAttribute(o,c[1]),d.fromBufferAttribute(o,c[2]),tc.getNormal(Ud),p[0]=`${Math.round(S.x*r)},${Math.round(S.y*r)},${Math.round(S.z*r)}`,p[1]=`${Math.round(_.x*r)},${Math.round(_.y*r)},${Math.round(_.z*r)}`,p[2]=`${Math.round(d.x*r)},${Math.round(d.y*r)},${Math.round(d.z*r)}`,!(p[0]===p[1]||p[1]===p[2]||p[2]===p[0]))for(let m=0;m<3;m++){const M=(m+1)%3,y=p[m],T=p[M],E=tc[h[m]],C=tc[h[M]],x=`${y}_${T}`,b=`${T}_${y}`;b in f&&f[b]?(Ud.dot(f[b].normal)<=s&&(g.push(E.x,E.y,E.z),g.push(C.x,C.y,C.z)),f[b]=null):x in f||(f[x]={index0:c[m],index1:c[M],normal:Ud.clone()})}}for(const v in f)if(f[v]){const{index0:S,index1:_}=f[v];Jl.fromBufferAttribute(o,S),ec.fromBufferAttribute(o,_),g.push(Jl.x,Jl.y,Jl.z),g.push(ec.x,ec.y,ec.z)}this.setAttribute("position",new Wt(g,3))}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}}class Va extends Rn{constructor(e=1,n=1,i=1,r=1){super(),this.type="PlaneGeometry",this.parameters={width:e,height:n,widthSegments:i,heightSegments:r};const s=e/2,a=n/2,o=Math.floor(i),l=Math.floor(r),c=o+1,h=l+1,p=e/o,f=n/l,g=[],v=[],S=[],_=[];for(let d=0;d<h;d++){const m=d*f-a;for(let M=0;M<c;M++){const y=M*p-s;v.push(y,-m,0),S.push(0,0,1),_.push(M/o),_.push(1-d/l)}}for(let d=0;d<l;d++)for(let m=0;m<o;m++){const M=m+c*d,y=m+c*(d+1),T=m+1+c*(d+1),E=m+1+c*d;g.push(M,y,E),g.push(y,T,E)}this.setIndex(g),this.setAttribute("position",new Wt(v,3)),this.setAttribute("normal",new Wt(S,3)),this.setAttribute("uv",new Wt(_,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new Va(e.width,e.height,e.widthSegments,e.heightSegments)}}class Gp extends Rn{constructor(e=1,n=32,i=16,r=0,s=Math.PI*2,a=0,o=Math.PI){super(),this.type="SphereGeometry",this.parameters={radius:e,widthSegments:n,heightSegments:i,phiStart:r,phiLength:s,thetaStart:a,thetaLength:o},n=Math.max(3,Math.floor(n)),i=Math.max(2,Math.floor(i));const l=Math.min(a+o,Math.PI);let c=0;const h=[],p=new I,f=new I,g=[],v=[],S=[],_=[];for(let d=0;d<=i;d++){const m=[],M=d/i,y=a+M*o,T=e*Math.cos(y),E=Math.sqrt(e*e-T*T);let C=0;d===0&&a===0?C=.5/n:d===i&&l===Math.PI&&(C=-.5/n);for(let x=0;x<=n;x++){const b=x/n,P=r+b*s;p.x=-E*Math.cos(P),p.y=T,p.z=E*Math.sin(P),v.push(p.x,p.y,p.z),f.copy(p).normalize(),S.push(f.x,f.y,f.z),_.push(b+C,1-M),m.push(c++)}h.push(m)}for(let d=0;d<i;d++)for(let m=0;m<n;m++){const M=h[d][m+1],y=h[d][m],T=h[d+1][m],E=h[d+1][m+1];(d!==0||a>0)&&g.push(M,y,E),(d!==i-1||l<Math.PI)&&g.push(y,T,E)}this.setIndex(g),this.setAttribute("position",new Wt(v,3)),this.setAttribute("normal",new Wt(S,3)),this.setAttribute("uv",new Wt(_,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new Gp(e.radius,e.widthSegments,e.heightSegments,e.phiStart,e.phiLength,e.thetaStart,e.thetaLength)}}class su extends Rn{constructor(e=1,n=.4,i=12,r=48,s=Math.PI*2,a=0,o=Math.PI*2){super(),this.type="TorusGeometry",this.parameters={radius:e,tube:n,radialSegments:i,tubularSegments:r,arc:s,thetaStart:a,thetaLength:o},i=Math.floor(i),r=Math.floor(r);const l=[],c=[],h=[],p=[],f=new I,g=new I,v=new I;for(let S=0;S<=i;S++){const _=a+S/i*o;for(let d=0;d<=r;d++){const m=d/r*s;g.x=(e+n*Math.cos(_))*Math.cos(m),g.y=(e+n*Math.cos(_))*Math.sin(m),g.z=n*Math.sin(_),c.push(g.x,g.y,g.z),f.x=e*Math.cos(m),f.y=e*Math.sin(m),v.subVectors(g,f).normalize(),h.push(v.x,v.y,v.z),p.push(d/r),p.push(S/i)}}for(let S=1;S<=i;S++)for(let _=1;_<=r;_++){const d=(r+1)*S+_-1,m=(r+1)*(S-1)+_-1,M=(r+1)*(S-1)+_,y=(r+1)*S+_;l.push(d,m,y),l.push(m,M,y)}this.setIndex(l),this.setAttribute("position",new Wt(c,3)),this.setAttribute("normal",new Wt(h,3)),this.setAttribute("uv",new Wt(p,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new su(e.radius,e.tube,e.radialSegments,e.tubularSegments,e.arc,e.thetaStart,e.thetaLength)}}function Ga(t){const e={};for(const n in t){e[n]={};for(const i in t[n]){const r=t[n][i];if(q0(r))r.isRenderTargetTexture?(Ve("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),e[n][i]=null):e[n][i]=r.clone();else if(Array.isArray(r))if(q0(r[0])){const s=[];for(let a=0,o=r.length;a<o;a++)s[a]=r[a].clone();e[n][i]=s}else e[n][i]=r.slice();else e[n][i]=r}}return e}function Nn(t){const e={};for(let n=0;n<t.length;n++){const i=Ga(t[n]);for(const r in i)e[r]=i[r]}return e}function q0(t){return t&&(t.isColor||t.isMatrix3||t.isMatrix4||t.isVector2||t.isVector3||t.isVector4||t.isTexture||t.isQuaternion)}function aw(t){const e=[];for(let n=0;n<t.length;n++)e.push(t[n].clone());return e}function Nx(t){const e=t.getRenderTarget();return e===null?t.outputColorSpace:e.isXRRenderTarget===!0?e.texture.colorSpace:ft.workingColorSpace}const ow={clone:Ga,merge:Nn};var lw=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,cw=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`;class cr extends $a{constructor(e){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=lw,this.fragmentShader=cw,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0&&this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=Ga(e.uniforms),this.uniformsGroups=aw(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this.defaultAttributeValues=Object.assign({},e.defaultAttributeValues),this.index0AttributeName=e.index0AttributeName,this.uniformsNeedUpdate=e.uniformsNeedUpdate,this}toJSON(e){const n=super.toJSON(e);n.glslVersion=this.glslVersion,n.uniforms={};for(const r in this.uniforms){const a=this.uniforms[r].value;a&&a.isTexture?n.uniforms[r]={type:"t",value:a.toJSON(e).uuid}:a&&a.isColor?n.uniforms[r]={type:"c",value:a.getHex()}:a&&a.isVector2?n.uniforms[r]={type:"v2",value:a.toArray()}:a&&a.isVector3?n.uniforms[r]={type:"v3",value:a.toArray()}:a&&a.isVector4?n.uniforms[r]={type:"v4",value:a.toArray()}:a&&a.isMatrix3?n.uniforms[r]={type:"m3",value:a.toArray()}:a&&a.isMatrix4?n.uniforms[r]={type:"m4",value:a.toArray()}:n.uniforms[r]={value:a}}Object.keys(this.defines).length>0&&(n.defines=this.defines),n.vertexShader=this.vertexShader,n.fragmentShader=this.fragmentShader,n.lights=this.lights,n.clipping=this.clipping;const i={};for(const r in this.extensions)this.extensions[r]===!0&&(i[r]=!0);return Object.keys(i).length>0&&(n.extensions=i),n}fromJSON(e,n){if(super.fromJSON(e,n),e.uniforms!==void 0)for(const i in e.uniforms){const r=e.uniforms[i];switch(this.uniforms[i]={},r.type){case"t":this.uniforms[i].value=n[r.value]||null;break;case"c":this.uniforms[i].value=new ct().setHex(r.value);break;case"v2":this.uniforms[i].value=new We().fromArray(r.value);break;case"v3":this.uniforms[i].value=new I().fromArray(r.value);break;case"v4":this.uniforms[i].value=new Gt().fromArray(r.value);break;case"m3":this.uniforms[i].value=new Ye().fromArray(r.value);break;case"m4":this.uniforms[i].value=new kt().fromArray(r.value);break;default:this.uniforms[i].value=r.value}}if(e.defines!==void 0&&(this.defines=e.defines),e.vertexShader!==void 0&&(this.vertexShader=e.vertexShader),e.fragmentShader!==void 0&&(this.fragmentShader=e.fragmentShader),e.glslVersion!==void 0&&(this.glslVersion=e.glslVersion),e.extensions!==void 0)for(const i in e.extensions)this.extensions[i]=e.extensions[i];return e.lights!==void 0&&(this.lights=e.lights),e.clipping!==void 0&&(this.clipping=e.clipping),this}}class uw extends cr{constructor(e){super(e),this.isRawShaderMaterial=!0,this.type="RawShaderMaterial"}}class it extends $a{constructor(e){super(),this.isMeshStandardMaterial=!0,this.type="MeshStandardMaterial",this.defines={STANDARD:""},this.color=new ct(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new ct(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=wh,this.normalScale=new We(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new us,this.envMapIntensity=1,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.defines={STANDARD:""},this.color.copy(e.color),this.roughness=e.roughness,this.metalness=e.metalness,this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.roughnessMap=e.roughnessMap,this.metalnessMap=e.metalnessMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.envMapIntensity=e.envMapIntensity,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.flatShading=e.flatShading,this.fog=e.fog,this}}class dw extends $a{constructor(e){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=_E,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(e)}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}}class fw extends $a{constructor(e){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e)}copy(e){return super.copy(e),this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}}const Y0={enabled:!1,files:{},add:function(t,e){this.enabled!==!1&&(K0(t)||(this.files[t]=e))},get:function(t){if(this.enabled!==!1&&!K0(t))return this.files[t]},remove:function(t){delete this.files[t]},clear:function(){this.files={}}};function K0(t){try{const e=t.slice(t.indexOf(":")+1);return new URL(e).protocol==="blob:"}catch{return!1}}class hw{constructor(e,n,i){const r=this;let s=!1,a=0,o=0,l;const c=[];this.onStart=void 0,this.onLoad=e,this.onProgress=n,this.onError=i,this._abortController=null,this.itemStart=function(h){o++,s===!1&&r.onStart!==void 0&&r.onStart(h,a,o),s=!0},this.itemEnd=function(h){a++,r.onProgress!==void 0&&r.onProgress(h,a,o),a===o&&(s=!1,r.onLoad!==void 0&&r.onLoad())},this.itemError=function(h){r.onError!==void 0&&r.onError(h)},this.resolveURL=function(h){return h=h.normalize("NFC"),l?l(h):h},this.setURLModifier=function(h){return l=h,this},this.addHandler=function(h,p){return c.push(h,p),this},this.removeHandler=function(h){const p=c.indexOf(h);return p!==-1&&c.splice(p,2),this},this.getHandler=function(h){for(let p=0,f=c.length;p<f;p+=2){const g=c[p],v=c[p+1];if(g.global&&(g.lastIndex=0),g.test(h))return v}return null},this.abort=function(){return this.abortController.abort(),this._abortController=null,this}}get abortController(){return this._abortController||(this._abortController=new AbortController),this._abortController}}const pw=new hw;class jp{constructor(e){this.manager=e!==void 0?e:pw,this.crossOrigin="anonymous",this.withCredentials=!1,this.path="",this.resourcePath="",this.requestHeader={},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}load(){}loadAsync(e,n){const i=this;return new Promise(function(r,s){i.load(e,r,n,s)})}parse(){}setCrossOrigin(e){return this.crossOrigin=e,this}setWithCredentials(e){return this.withCredentials=e,this}setPath(e){return this.path=e,this}setResourcePath(e){return this.resourcePath=e,this}setRequestHeader(e){return this.requestHeader=e,this}abort(){return this}}jp.DEFAULT_MATERIAL_NAME="__DEFAULT";const vr={};class mw extends Error{constructor(e,n){super(e),this.response=n}}class gw extends jp{constructor(e){super(e),this.mimeType="",this.responseType="",this._abortController=new AbortController}load(e,n,i,r){e===void 0&&(e=""),this.path!==void 0&&(e=this.path+e),e=this.manager.resolveURL(e);const s=Y0.get(`file:${e}`);if(s!==void 0){this.manager.itemStart(e),setTimeout(()=>{n&&n(s),this.manager.itemEnd(e)},0);return}if(vr[e]!==void 0){vr[e].push({onLoad:n,onProgress:i,onError:r});return}vr[e]=[],vr[e].push({onLoad:n,onProgress:i,onError:r});const a=new Request(e,{headers:new Headers(this.requestHeader),credentials:this.withCredentials?"include":"same-origin",signal:typeof AbortSignal.any=="function"?AbortSignal.any([this._abortController.signal,this.manager.abortController.signal]):this._abortController.signal}),o=this.mimeType,l=this.responseType;fetch(a).then(c=>{if(c.status===200||c.status===0){if(c.status===0&&Ve("FileLoader: HTTP Status 0 received."),typeof ReadableStream>"u"||c.body===void 0||c.body.getReader===void 0)return c;const h=vr[e],p=c.body.getReader(),f=c.headers.get("X-File-Size")||c.headers.get("Content-Length"),g=f?parseInt(f):0,v=g!==0;let S=0;const _=new ReadableStream({start(d){m();function m(){p.read().then(({done:M,value:y})=>{if(M)d.close();else{S+=y.byteLength;const T=new ProgressEvent("progress",{lengthComputable:v,loaded:S,total:g});for(let E=0,C=h.length;E<C;E++){const x=h[E];x.onProgress&&x.onProgress(T)}d.enqueue(y),m()}},M=>{d.error(M)})}}});return new Response(_)}else throw new mw(`fetch for "${c.url}" responded with ${c.status}: ${c.statusText}`,c)}).then(c=>{switch(l){case"arraybuffer":return c.arrayBuffer();case"blob":return c.blob();case"document":return c.text().then(h=>new DOMParser().parseFromString(h,o));case"json":return c.json();default:if(o==="")return c.text();{const p=/charset="?([^;"\s]*)"?/i.exec(o),f=p&&p[1]?p[1].toLowerCase():void 0,g=new TextDecoder(f);return c.arrayBuffer().then(v=>g.decode(v))}}}).then(c=>{Y0.add(`file:${e}`,c);const h=vr[e];delete vr[e];for(let p=0,f=h.length;p<f;p++){const g=h[p];g.onLoad&&g.onLoad(c)}}).catch(c=>{const h=vr[e];if(h===void 0)throw this.manager.itemError(e),c;delete vr[e];for(let p=0,f=h.length;p<f;p++){const g=h[p];g.onError&&g.onError(c)}this.manager.itemError(e)}).finally(()=>{this.manager.itemEnd(e)}),this.manager.itemStart(e)}setResponseType(e){return this.responseType=e,this}setMimeType(e){return this.mimeType=e,this}abort(){return this._abortController.abort(),this._abortController=new AbortController,this}}class Wp extends hn{constructor(e,n=1){super(),this.isLight=!0,this.type="Light",this.color=new ct(e),this.intensity=n}copy(e,n){return super.copy(e,n),this.color.copy(e.color),this.intensity=e.intensity,this}toJSON(e){const n=super.toJSON(e);return n.object.color=this.color.getHex(),n.object.intensity=this.intensity,n}}class Lx extends Wp{constructor(e,n,i){super(e,i),this.isHemisphereLight=!0,this.type="HemisphereLight",this.position.copy(hn.DEFAULT_UP),this.updateMatrix(),this.groundColor=new ct(n)}copy(e,n){return super.copy(e,n),this.groundColor.copy(e.groundColor),this}toJSON(e){const n=super.toJSON(e);return n.object.groundColor=this.groundColor.getHex(),n}}const Fd=new kt,Z0=new I,Q0=new I;class Dx{constructor(e){this.camera=e,this.intensity=1,this.bias=0,this.biasNode=null,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new We(512,512),this.mapType=ni,this.map=null,this.mapPass=null,this.matrix=new kt,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new Hp,this._frameExtents=new We(1,1),this._viewportCount=1,this._viewports=[new Gt(0,0,1,1)]}getViewportCount(){return this._viewportCount}getCamera(){return this.camera}getFrustum(){return this._frustum}updateMatrices(e){const n=this.camera;Z0.setFromMatrixPosition(e.matrixWorld),n.position.copy(Z0),Q0.setFromMatrixPosition(e.target.matrixWorld),n.lookAt(Q0),n.updateMatrixWorld(),this._updateMatrix(n,this.matrix,this._frustum)}_updateMatrix(e,n,i,r){Fd.multiplyMatrices(e.projectionMatrix,e.matrixWorldInverse),i.setFromProjectionMatrix(Fd,e.coordinateSystem,e.reversedDepth);const s=this._frameExtents,a=r?r.z/s.x:1,o=r?r.w/s.y:1,l=r?r.x/s.x:0,c=r?r.y/s.y:0;e.coordinateSystem===rl||e.reversedDepth?n.set(.5*a,0,0,.5*a+l,0,.5*o,0,.5*o+c,0,0,1,0,0,0,0,1):n.set(.5*a,0,0,.5*a+l,0,.5*o,0,.5*o+c,0,0,.5,.5,0,0,0,1),n.multiply(Fd)}getViewport(e){return this._viewports[e]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(e){return this.camera=e.camera.clone(),this.intensity=e.intensity,this.bias=e.bias,this.radius=e.radius,this.autoUpdate=e.autoUpdate,this.needsUpdate=e.needsUpdate,this.normalBias=e.normalBias,this.blurSamples=e.blurSamples,this.mapSize.copy(e.mapSize),this.biasNode=e.biasNode,this}clone(){return new this.constructor().copy(this)}toJSON(){const e={};return e.intensity=this.intensity,e.bias=this.bias,e.normalBias=this.normalBias,e.radius=this.radius,e.blurSamples=this.blurSamples,e.mapSize=this.mapSize.toArray(),e.camera=this.camera.toJSON(!1).object,delete e.camera.matrix,e}}const nc=new I,ic=new cs,Yi=new I;class Ix extends hn{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new kt,this.projectionMatrix=new kt,this.projectionMatrixInverse=new kt,this.coordinateSystem=ir,this._reversedDepth=!1}get reversedDepth(){return this._reversedDepth}copy(e,n){return super.copy(e,n),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this.coordinateSystem=e.coordinateSystem,this}getWorldDirection(e){return super.getWorldDirection(e).negate()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorld.decompose(nc,ic,Yi),Yi.x===1&&Yi.y===1&&Yi.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(nc,ic,Yi.set(1,1,1)).invert()}updateWorldMatrix(e,n,i=!1){super.updateWorldMatrix(e,n,i),this.matrixWorld.decompose(nc,ic,Yi),Yi.x===1&&Yi.y===1&&Yi.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(nc,ic,Yi.set(1,1,1)).invert()}clone(){return new this.constructor().copy(this)}}const jr=new I,J0=new We,eg=new We;class Gn extends Ix{constructor(e=50,n=1,i=.1,r=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=e,this.zoom=1,this.near=i,this.far=r,this.focus=10,this.aspect=n,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,n){return super.copy(e,n),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){const n=.5*this.getFilmHeight()/e;this.fov=Th*2*Math.atan(n),this.updateProjectionMatrix()}getFocalLength(){const e=Math.tan(Oo*.5*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return Th*2*Math.atan(Math.tan(Oo*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(e,n,i){jr.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),n.set(jr.x,jr.y).multiplyScalar(-e/jr.z),jr.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),i.set(jr.x,jr.y).multiplyScalar(-e/jr.z)}getViewSize(e,n){return this.getViewBounds(e,J0,eg),n.subVectors(eg,J0)}setViewOffset(e,n,i,r,s,a){this.aspect=e/n,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=n,this.view.offsetX=i,this.view.offsetY=r,this.view.width=s,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const e=this.near;let n=e*Math.tan(Oo*.5*this.fov)/this.zoom,i=2*n,r=this.aspect*i,s=-.5*r;const a=this.view;if(this.view!==null&&this.view.enabled){const l=a.fullWidth,c=a.fullHeight;s+=a.offsetX*r/l,n-=a.offsetY*i/c,r*=a.width/l,i*=a.height/c}const o=this.filmOffset;o!==0&&(s+=e*o/this.getFilmWidth()),this.projectionMatrix.makePerspective(s,s+r,n,n-i,e,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){const n=super.toJSON(e);return n.object.fov=this.fov,n.object.zoom=this.zoom,n.object.near=this.near,n.object.far=this.far,n.object.focus=this.focus,n.object.aspect=this.aspect,this.view!==null&&(n.object.view=Object.assign({},this.view)),n.object.filmGauge=this.filmGauge,n.object.filmOffset=this.filmOffset,n}}class _w extends Dx{constructor(){super(new Gn(90,1,.5,500)),this.isPointLightShadow=!0}}class tg extends Wp{constructor(e,n,i=0,r=2){super(e,n),this.isPointLight=!0,this.type="PointLight",this.distance=i,this.decay=r,this.shadow=new _w}get power(){return this.intensity*4*Math.PI}set power(e){this.intensity=e/(4*Math.PI)}dispose(){super.dispose(),this.shadow.dispose()}copy(e,n){return super.copy(e,n),this.distance=e.distance,this.decay=e.decay,this.shadow=e.shadow.clone(),this}toJSON(e){const n=super.toJSON(e);return n.object.distance=this.distance,n.object.decay=this.decay,n.object.shadow=this.shadow.toJSON(),n}}class Xp extends Ix{constructor(e=-1,n=1,i=1,r=-1,s=.1,a=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=e,this.right=n,this.top=i,this.bottom=r,this.near=s,this.far=a,this.updateProjectionMatrix()}copy(e,n){return super.copy(e,n),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,n,i,r,s,a){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=n,this.view.offsetX=i,this.view.offsetY=r,this.view.width=s,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const e=(this.right-this.left)/(2*this.zoom),n=(this.top-this.bottom)/(2*this.zoom),i=(this.right+this.left)/2,r=(this.top+this.bottom)/2;let s=i-e,a=i+e,o=r+n,l=r-n;if(this.view!==null&&this.view.enabled){const c=(this.right-this.left)/this.view.fullWidth/this.zoom,h=(this.top-this.bottom)/this.view.fullHeight/this.zoom;s+=c*this.view.offsetX,a=s+c*this.view.width,o-=h*this.view.offsetY,l=o-h*this.view.height}this.projectionMatrix.makeOrthographic(s,a,o,l,this.near,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){const n=super.toJSON(e);return n.object.zoom=this.zoom,n.object.left=this.left,n.object.right=this.right,n.object.top=this.top,n.object.bottom=this.bottom,n.object.near=this.near,n.object.far=this.far,this.view!==null&&(n.object.view=Object.assign({},this.view)),n}}class vw extends Dx{constructor(){super(new Xp(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}}class bh extends Wp{constructor(e,n){super(e,n),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(hn.DEFAULT_UP),this.updateMatrix(),this.target=new hn,this.shadow=new vw}dispose(){super.dispose(),this.shadow.dispose()}copy(e){return super.copy(e),this.target=e.target.clone(),this.shadow=e.shadow.clone(),this}toJSON(e){const n=super.toJSON(e);return n.object.shadow=this.shadow.toJSON(),n.object.target=this.target.uuid,n}}const ia=-90,ra=1;class xw extends hn{constructor(e,n,i){super(),this.type="CubeCamera",this.renderTarget=i,this.coordinateSystem=null,this.activeMipmapLevel=0;const r=new Gn(ia,ra,e,n);r.layers=this.layers,this.add(r);const s=new Gn(ia,ra,e,n);s.layers=this.layers,this.add(s);const a=new Gn(ia,ra,e,n);a.layers=this.layers,this.add(a);const o=new Gn(ia,ra,e,n);o.layers=this.layers,this.add(o);const l=new Gn(ia,ra,e,n);l.layers=this.layers,this.add(l);const c=new Gn(ia,ra,e,n);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){const e=this.coordinateSystem,n=this.children.concat(),[i,r,s,a,o,l]=n;for(const c of n)this.remove(c);if(e===ir)i.up.set(0,1,0),i.lookAt(1,0,0),r.up.set(0,1,0),r.lookAt(-1,0,0),s.up.set(0,0,-1),s.lookAt(0,1,0),a.up.set(0,0,1),a.lookAt(0,-1,0),o.up.set(0,1,0),o.lookAt(0,0,1),l.up.set(0,1,0),l.lookAt(0,0,-1);else if(e===rl)i.up.set(0,-1,0),i.lookAt(-1,0,0),r.up.set(0,-1,0),r.lookAt(1,0,0),s.up.set(0,0,1),s.lookAt(0,1,0),a.up.set(0,0,-1),a.lookAt(0,-1,0),o.up.set(0,-1,0),o.lookAt(0,0,1),l.up.set(0,-1,0),l.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+e);for(const c of n)this.add(c),c.updateMatrixWorld()}update(e,n){this.parent===null&&this.updateMatrixWorld();const{renderTarget:i,activeMipmapLevel:r}=this;this.coordinateSystem!==e.coordinateSystem&&(this.coordinateSystem=e.coordinateSystem,this.updateCoordinateSystem());const[s,a,o,l,c,h]=this.children,p=e.getRenderTarget(),f=e.getActiveCubeFace(),g=e.getActiveMipmapLevel(),v=e.xr.enabled;e.xr.enabled=!1;const S=i.texture.generateMipmaps;i.texture.generateMipmaps=!1;let _=!1;e.isWebGLRenderer===!0?_=e.state.buffers.depth.getReversed():_=e.reversedDepthBuffer,e.setRenderTarget(i,0,r),_&&e.autoClear===!1&&e.clearDepth(),e.render(n,s),e.setRenderTarget(i,1,r),_&&e.autoClear===!1&&e.clearDepth(),e.render(n,a),e.setRenderTarget(i,2,r),_&&e.autoClear===!1&&e.clearDepth(),e.render(n,o),e.setRenderTarget(i,3,r),_&&e.autoClear===!1&&e.clearDepth(),e.render(n,l),e.setRenderTarget(i,4,r),_&&e.autoClear===!1&&e.clearDepth(),e.render(n,c),i.texture.generateMipmaps=S,e.setRenderTarget(i,5,r),_&&e.autoClear===!1&&e.clearDepth(),e.render(n,h),e.setRenderTarget(p,f,g),e.xr.enabled=v,i.texture.needsPMREMUpdate=!0}}class yw extends Gn{constructor(e=[]){super(),this.isArrayCamera=!0,this.isMultiViewCamera=!1,this.cameras=e}}const ng=new kt;class Sw{constructor(e,n,i=0,r=1/0){this.ray=new bu(e,n),this.near=i,this.far=r,this.camera=null,this.layers=new Bp,this.params={Mesh:{},Line:{threshold:1},LOD:{},Points:{threshold:1},Sprite:{}}}set(e,n){this.ray.set(e,n)}setFromCamera(e,n){n.isPerspectiveCamera?(this.ray.origin.setFromMatrixPosition(n.matrixWorld),this.ray.direction.set(e.x,e.y,.5).unproject(n).sub(this.ray.origin).normalize(),this.camera=n):n.isOrthographicCamera?(this.ray.origin.set(e.x,e.y,n.projectionMatrix.elements[14]).unproject(n),this.ray.direction.set(0,0,-1).transformDirection(n.matrixWorld),this.camera=n):gt("Raycaster: Unsupported camera type: "+n.type)}setFromXRController(e){return ng.identity().extractRotation(e.matrixWorld),this.ray.origin.setFromMatrixPosition(e.matrixWorld),this.ray.direction.set(0,0,-1).applyMatrix4(ng),this}intersectObject(e,n=!0,i=[]){return Ah(e,this,i,n),i.sort(ig),i}intersectObjects(e,n=!0,i=[]){for(let r=0,s=e.length;r<s;r++)Ah(e[r],this,i,n);return i.sort(ig),i}}function ig(t,e){return t.distance-e.distance}function Ah(t,e,n,i){let r=!0;if(t.layers.test(e.layers)&&t.raycast(e,n)===!1&&(r=!1),r===!0&&i===!0){const s=t.children;for(let a=0,o=s.length;a<o;a++)Ah(s[a],e,n,!0)}}class rg{constructor(e=1,n=0,i=0){this.radius=e,this.phi=n,this.theta=i}set(e,n,i){return this.radius=e,this.phi=n,this.theta=i,this}copy(e){return this.radius=e.radius,this.phi=e.phi,this.theta=e.theta,this}makeSafe(){return this.phi=lt(this.phi,1e-6,Math.PI-1e-6),this}setFromVector3(e){return this.setFromCartesianCoords(e.x,e.y,e.z)}setFromCartesianCoords(e,n,i){return this.radius=Math.sqrt(e*e+n*n+i*i),this.radius===0?(this.theta=0,this.phi=0):(this.theta=Math.atan2(e,i),this.phi=Math.acos(lt(n/this.radius,-1,1))),this}clone(){return new this.constructor().copy(this)}}const sm=class sm{constructor(e,n,i,r){this.elements=[1,0,0,1],e!==void 0&&this.set(e,n,i,r)}identity(){return this.set(1,0,0,1),this}fromArray(e,n=0){for(let i=0;i<4;i++)this.elements[i]=e[i+n];return this}set(e,n,i,r){const s=this.elements;return s[0]=e,s[2]=n,s[1]=i,s[3]=r,this}};sm.prototype.isMatrix2=!0;let sg=sm;class Mw extends ps{constructor(e,n=null){super(),this.object=e,this.domElement=n,this.enabled=!0,this.state=-1,this.keys={},this.mouseButtons={LEFT:null,MIDDLE:null,RIGHT:null},this.touches={ONE:null,TWO:null}}connect(e){this.domElement!==null&&this.disconnect(),this.domElement=e}disconnect(){}dispose(){}update(){}}function ag(t,e,n,i){const r=Ew(i);switch(n){case xx:return t*e;case Sx:return t*e/r.components*r.byteLength;case Dp:return t*e/r.components*r.byteLength;case Bs:return t*e*2/r.components*r.byteLength;case Ip:return t*e*2/r.components*r.byteLength;case yx:return t*e*3/r.components*r.byteLength;case Ui:return t*e*4/r.components*r.byteLength;case Up:return t*e*4/r.components*r.byteLength;case yc:case Sc:return Math.floor((t+3)/4)*Math.floor((e+3)/4)*8;case Mc:case Ec:return Math.floor((t+3)/4)*Math.floor((e+3)/4)*16;case Yf:case Zf:return Math.max(t,16)*Math.max(e,8)/4;case qf:case Kf:return Math.max(t,8)*Math.max(e,8)/2;case Qf:case Jf:case th:case nh:return Math.floor((t+3)/4)*Math.floor((e+3)/4)*8;case eh:case Zc:case ih:return Math.floor((t+3)/4)*Math.floor((e+3)/4)*16;case rh:return Math.floor((t+3)/4)*Math.floor((e+3)/4)*16;case sh:return Math.floor((t+4)/5)*Math.floor((e+3)/4)*16;case ah:return Math.floor((t+4)/5)*Math.floor((e+4)/5)*16;case oh:return Math.floor((t+5)/6)*Math.floor((e+4)/5)*16;case lh:return Math.floor((t+5)/6)*Math.floor((e+5)/6)*16;case ch:return Math.floor((t+7)/8)*Math.floor((e+4)/5)*16;case uh:return Math.floor((t+7)/8)*Math.floor((e+5)/6)*16;case dh:return Math.floor((t+7)/8)*Math.floor((e+7)/8)*16;case fh:return Math.floor((t+9)/10)*Math.floor((e+4)/5)*16;case hh:return Math.floor((t+9)/10)*Math.floor((e+5)/6)*16;case ph:return Math.floor((t+9)/10)*Math.floor((e+7)/8)*16;case mh:return Math.floor((t+9)/10)*Math.floor((e+9)/10)*16;case gh:return Math.floor((t+11)/12)*Math.floor((e+9)/10)*16;case _h:return Math.floor((t+11)/12)*Math.floor((e+11)/12)*16;case vh:case xh:case yh:return Math.ceil(t/4)*Math.ceil(e/4)*16;case Sh:case Mh:return Math.ceil(t/4)*Math.ceil(e/4)*8;case Qc:case Eh:return Math.ceil(t/4)*Math.ceil(e/4)*16}throw new Error(`Unable to determine texture byte length for ${n} format.`)}function Ew(t){switch(t){case ni:case mx:return{byteLength:1,components:1};case nl:case gx:case lr:return{byteLength:2,components:1};case Np:case Lp:return{byteLength:2,components:4};case or:case Pp:case nr:return{byteLength:4,components:1};case _x:case vx:return{byteLength:4,components:3}}throw new Error(`THREE.TextureUtils: Unknown texture type ${t}.`)}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:Rp}}));typeof window<"u"&&(window.__THREE__?Ve("WARNING: Multiple instances of Three.js being imported."):window.__THREE__=Rp);/**
 * @license
 * Copyright 2010-2026 Three.js Authors
 * SPDX-License-Identifier: MIT
 */function Ux(){let t=null,e=!1,n=null,i=null;function r(s,a){i=t.requestAnimationFrame(r),n(s,a)}return{start:function(){e!==!0&&n!==null&&t!==null&&(i=t.requestAnimationFrame(r),e=!0)},stop:function(){t!==null&&t.cancelAnimationFrame(i),e=!1},setAnimationLoop:function(s){n=s},setContext:function(s){t=s}}}function ww(t){const e=new WeakMap;function n(o,l){const c=o.array,h=o.usage,p=c.byteLength,f=t.createBuffer();t.bindBuffer(l,f),t.bufferData(l,c,h),o.onUploadCallback();let g;if(c instanceof Float32Array)g=t.FLOAT;else if(typeof Float16Array<"u"&&c instanceof Float16Array)g=t.HALF_FLOAT;else if(c instanceof Uint16Array)o.isFloat16BufferAttribute?g=t.HALF_FLOAT:g=t.UNSIGNED_SHORT;else if(c instanceof Int16Array)g=t.SHORT;else if(c instanceof Uint32Array)g=t.UNSIGNED_INT;else if(c instanceof Int32Array)g=t.INT;else if(c instanceof Int8Array)g=t.BYTE;else if(c instanceof Uint8Array)g=t.UNSIGNED_BYTE;else if(c instanceof Uint8ClampedArray)g=t.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+c);return{buffer:f,type:g,bytesPerElement:c.BYTES_PER_ELEMENT,version:o.version,size:p}}function i(o,l,c){const h=l.array,p=l.updateRanges;if(t.bindBuffer(c,o),p.length===0)t.bufferSubData(c,0,h);else{p.sort((g,v)=>g.start-v.start);let f=0;for(let g=1;g<p.length;g++){const v=p[f],S=p[g];S.start<=v.start+v.count+1?v.count=Math.max(v.count,S.start+S.count-v.start):(++f,p[f]=S)}p.length=f+1;for(let g=0,v=p.length;g<v;g++){const S=p[g];t.bufferSubData(c,S.start*h.BYTES_PER_ELEMENT,h,S.start,S.count)}l.clearUpdateRanges()}l.onUploadCallback()}function r(o){return o.isInterleavedBufferAttribute&&(o=o.data),e.get(o)}function s(o){o.isInterleavedBufferAttribute&&(o=o.data);const l=e.get(o);l&&(t.deleteBuffer(l.buffer),e.delete(o))}function a(o,l){if(o.isInterleavedBufferAttribute&&(o=o.data),o.isGLBufferAttribute){const h=e.get(o);(!h||h.version<o.version)&&e.set(o,{buffer:o.buffer,type:o.type,bytesPerElement:o.elementSize,version:o.version});return}const c=e.get(o);if(c===void 0)e.set(o,n(o,l));else if(c.version<o.version){if(c.size!==o.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");i(c.buffer,o,l),c.version=o.version}}return{get:r,remove:s,update:a}}var Tw=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,bw=`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,Aw=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,Cw=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,Rw=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,Pw=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,Nw=`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,Lw=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,Dw=`#ifdef USE_BATCHING
	#if ! defined( GL_ANGLE_multi_draw )
	#define gl_DrawID _gl_DrawID
	uniform int _gl_DrawID;
	#endif
	uniform highp sampler2D batchingTexture;
	uniform highp usampler2D batchingIdTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
	float getIndirectIndex( const in int i ) {
		int size = textureSize( batchingIdTexture, 0 ).x;
		int x = i % size;
		int y = i / size;
		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );
	}
#endif
#ifdef USE_BATCHING_COLOR
	uniform sampler2D batchingColorTexture;
	vec4 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 );
	}
#endif`,Iw=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,Uw=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,Fw=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,Ow=`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,kw=`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,Bw=`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,zw=`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#ifdef ALPHA_TO_COVERAGE
		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			if ( clipOpacity == 0.0 ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			float unionClipOpacity = 1.0;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			}
			#pragma unroll_loop_end
			clipOpacity *= 1.0 - unionClipOpacity;
		#endif
		diffuseColor.a *= clipOpacity;
		if ( diffuseColor.a == 0.0 ) discard;
	#else
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			bool clipped = true;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
			}
			#pragma unroll_loop_end
			if ( clipped ) discard;
		#endif
	#endif
#endif`,Hw=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,Vw=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,Gw=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,jw=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#endif`,Ww=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#endif`,Xw=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec4 vColor;
#endif`,$w=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec4( 1.0 );
#endif
#ifdef USE_COLOR_ALPHA
	vColor *= color;
#elif defined( USE_COLOR )
	vColor.rgb *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.rgb *= instanceColor.rgb;
#endif
#ifdef USE_BATCHING_COLOR
	vColor *= getBatchingColor( getIndirectIndex( gl_DrawID ) );
#endif`,qw=`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
#define inverseTransformDirection transformDirectionByInverseViewMatrix
vec3 transformNormalByInverseViewMatrix( in vec3 normal, in mat4 viewMatrix ) {
	return normalize( ( vec4( normal, 0.0 ) * viewMatrix ).xyz );
}
vec3 transformDirectionByInverseViewMatrix( in vec3 dir, in mat4 viewMatrix ) {
	return normalize( ( vec4( dir, 0.0 ) * viewMatrix ).xyz );
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,Yw=`#ifdef ENVMAP_TYPE_CUBE_UV
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0
	float getFace( vec3 direction ) {
		vec3 absDirection = abs( direction );
		float face = - 1.0;
		if ( absDirection.x > absDirection.z ) {
			if ( absDirection.x > absDirection.y )
				face = direction.x > 0.0 ? 0.0 : 3.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		} else {
			if ( absDirection.z > absDirection.y )
				face = direction.z > 0.0 ? 2.0 : 5.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		}
		return face;
	}
	vec2 getUV( vec3 direction, float face ) {
		vec2 uv;
		if ( face == 0.0 ) {
			uv = vec2( direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 1.0 ) {
			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
		} else if ( face == 2.0 ) {
			uv = vec2( - direction.x, direction.y ) / abs( direction.z );
		} else if ( face == 3.0 ) {
			uv = vec2( - direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 4.0 ) {
			uv = vec2( - direction.x, direction.z ) / abs( direction.y );
		} else {
			uv = vec2( direction.x, direction.y ) / abs( direction.z );
		}
		return 0.5 * ( uv + 1.0 );
	}
	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
		float face = getFace( direction );
		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
		mipInt = max( mipInt, cubeUV_minMipLevel );
		float faceSize = exp2( mipInt );
		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
		if ( face > 2.0 ) {
			uv.y += faceSize;
			face -= 3.0;
		}
		uv.x += face * faceSize;
		uv.x += filterInt * 3.0 * cubeUV_minTileSize;
		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;
		#ifdef texture2DGradEXT
			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
		#else
			return texture2D( envMap, uv ).rgb;
		#endif
	}
	#define cubeUV_r0 1.0
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_m6 4.0
	float roughnessToMip( float roughness ) {
		float mip = 0.0;
		if ( roughness >= cubeUV_r1 ) {
			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;
		} else if ( roughness >= cubeUV_r4 ) {
			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;
		} else if ( roughness >= cubeUV_r5 ) {
			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;
		} else if ( roughness >= cubeUV_r6 ) {
			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;
		} else {
			mip = - 2.0 * log2( 1.16 * roughness );		}
		return mip;
	}
	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );
		float mipF = fract( mip );
		float mipInt = floor( mip );
		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
		if ( mipF == 0.0 ) {
			return vec4( color0, 1.0 );
		} else {
			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
			return vec4( mix( color0, color1, mipF ), 1.0 );
		}
	}
#endif`,Kw=`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
#endif`,Zw=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,Qw=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,Jw=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,e1=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,t1="gl_FragColor = linearToOutputTexel( gl_FragColor );",n1=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,i1=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * reflectVec );
		#ifdef ENVMAP_BLENDING_MULTIPLY
			outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_MIX )
			outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_ADD )
			outgoingLight += envColor.xyz * specularStrength * reflectivity;
		#endif
	#endif
#endif`,r1=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
#endif`,s1=`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,a1=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,o1=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,l1=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,c1=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,u1=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,d1=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,f1=`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,h1=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,p1=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,m1=`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,g1=`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
	if ( cutoffDistance > 0.0 ) {
		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
	}
	return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_SUN_LIGHTS > 0
	struct SunLight {
		vec3 direction;
		vec3 color;
	};
	uniform SunLight sunLights[ NUM_SUN_LIGHTS ];
	void getSunLightInfo( const in SunLight sunLight, out IncidentLight light ) {
		light.color = sunLight.color;
		light.direction = sunLight.direction;
		light.visible = true;
	}
#endif
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif
#include <lightprobes_pars_fragment>`,_1=`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, pow4( roughness ) ) );
			reflectVec = transformDirectionByInverseViewMatrix( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_RETROREFLECTION
		vec3 getIBLRetroRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 retroVec = normalize( mix( viewDir, normal, pow4( roughness ) ) );
				retroVec = transformDirectionByInverseViewMatrix( retroVec, viewMatrix );
				vec4 envMapColor = textureCubeUV( envMap, envMapRotation * retroVec, roughness );
				return envMapColor.rgb * envMapIntensity;
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
		#ifdef USE_RETROREFLECTION
			vec3 getIBLAnisotropyRetroRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
				#ifdef ENVMAP_TYPE_CUBE_UV
					vec3 bentNormal = cross( bitangent, viewDir );
					bentNormal = normalize( cross( bentNormal, bitangent ) );
					bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
					return getIBLRetroRadiance( viewDir, bentNormal, roughness );
				#else
					return vec3( 0.0 );
				#endif
			}
		#endif
	#endif
#endif`,v1=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,x1=`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,y1=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,S1=`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,M1=`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.diffuseContribution = diffuseColor.rgb * ( 1.0 - metalnessFactor );
material.metalness = metalnessFactor;
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor;
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = vec3( 0.04 );
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_DISPERSION
	material.dispersion = dispersion;
#endif
#ifdef USE_RETROREFLECTION
	material.retroreflectivity = retroreflectivity;
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.0001, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,E1=`uniform sampler2D dfgLUT;
struct PhysicalMaterial {
	vec3 diffuseColor;
	vec3 diffuseContribution;
	vec3 specularColor;
	vec3 specularColorBlended;
	float roughness;
	float metalness;
	float specularF90;
	float dispersion;
	vec2 dfg;
	vec3 multiScatteringCompensation;
	#ifdef USE_RETROREFLECTION
		float retroreflectivity;
	#endif
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0Dielectric;
		vec3 iridescenceF0Metallic;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		return 0.5 / max( gv + gl, EPSILON );
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = material.clearcoatRoughness;
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColorBlended;
	float f90 = material.specularF90;
	float roughness = material.roughness;
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transpose( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float rInv = 1.0 / ( roughness + 0.1 );
	float a = -1.9362 + 1.0678 * roughness + 0.4573 * r2 - 0.8469 * rInv;
	float b = -0.6014 + 0.5538 * roughness - 0.4670 * r2 - 0.1255 * rInv;
	float DG = exp( a * dotNV + b );
	return saturate( DG );
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	vec2 fab = texture2D( dfgLUT, vec2( roughness, dotNV ) ).rg;
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec2 fab, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec2 fab, const in vec3 specularColor, const in float specularF90, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColorBlended * t2.x + ( material.specularF90 - material.specularColorBlended ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseContribution * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
		#ifdef USE_CLEARCOAT
			vec3 Ncc = geometryClearcoatNormal;
			vec2 uvClearcoat = LTC_Uv( Ncc, viewDir, material.clearcoatRoughness );
			vec4 t1Clearcoat = texture2D( ltc_1, uvClearcoat );
			vec4 t2Clearcoat = texture2D( ltc_2, uvClearcoat );
			mat3 mInvClearcoat = mat3(
				vec3( t1Clearcoat.x, 0, t1Clearcoat.y ),
				vec3(             0, 1,             0 ),
				vec3( t1Clearcoat.z, 0, t1Clearcoat.w )
			);
			vec3 fresnelClearcoat = material.clearcoatF0 * t2Clearcoat.x + ( material.clearcoatF90 - material.clearcoatF0 ) * t2Clearcoat.y;
			clearcoatSpecularDirect += lightColor * fresnelClearcoat * LTC_Evaluate( Ncc, viewDir, position, mInvClearcoat, rectCoords );
		#endif
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
 
 		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
 
 		float sheenAlbedoV = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
 		float sheenAlbedoL = IBLSheenBRDF( geometryNormal, directLight.direction, material.sheenRoughness );
 
 		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * max( sheenAlbedoV, sheenAlbedoL );
 
 		irradiance *= sheenEnergyComp;
 
 	#endif
	vec3 specularBRDF = BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );
	#ifdef USE_RETROREFLECTION
		vec3 retroViewDir = reflect( - geometryViewDir, geometryNormal );
		vec3 retroSpecularBRDF = BRDF_GGX( directLight.direction, retroViewDir, geometryNormal, material );
		specularBRDF = mix( specularBRDF, retroSpecularBRDF, saturate( material.retroreflectivity ) );
	#endif
	reflectedLight.directSpecular += irradiance * specularBRDF * material.multiScatteringCompensation;
	vec3 halfDir = normalize( directLight.direction + geometryViewDir );
	float dotVH = saturate( dot( geometryViewDir, halfDir ) );
	vec3 F = F_Schlick( material.specularColor, material.specularF90, dotVH );
	#ifdef USE_RETROREFLECTION
		vec3 retroHalfDir = normalize( directLight.direction + retroViewDir );
		float dotRetroVH = saturate( dot( retroViewDir, retroHalfDir ) );
		vec3 retroF = F_Schlick( material.specularColor, material.specularF90, dotRetroVH );
		F = mix( F, retroF, saturate( material.retroreflectivity ) );
	#endif
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseContribution ) * ( 1.0 - F );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( material.dfg, material.specularColor, material.specularF90, material.iridescence, material.iridescenceF0Dielectric, singleScattering, multiScattering );
	#else
		computeMultiscattering( material.dfg, material.specularColor, material.specularF90, singleScattering, multiScattering );
	#endif
	vec3 diffuse = irradiance * BRDF_Lambert( material.diffuseContribution ) * ( 1.0 - singleScattering - multiScattering );
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		sheenSpecularIndirect += irradiance * material.sheenColor * sheenAlbedo * RECIPROCAL_PI;
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		diffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectDiffuse += diffuse;
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness ) * RECIPROCAL_PI;
 	#endif
	vec3 singleScatteringDielectric = vec3( 0.0 );
	vec3 multiScatteringDielectric = vec3( 0.0 );
	vec3 singleScatteringMetallic = vec3( 0.0 );
	vec3 multiScatteringMetallic = vec3( 0.0 );
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( material.dfg, material.specularColor, material.specularF90, material.iridescence, material.iridescenceF0Dielectric, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscatteringIridescence( material.dfg, material.diffuseColor, material.specularF90, material.iridescence, material.iridescenceF0Metallic, singleScatteringMetallic, multiScatteringMetallic );
	#else
		computeMultiscattering( material.dfg, material.specularColor, material.specularF90, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscattering( material.dfg, material.diffuseColor, material.specularF90, singleScatteringMetallic, multiScatteringMetallic );
	#endif
	vec3 singleScattering = mix( singleScatteringDielectric, singleScatteringMetallic, material.metalness );
	vec3 multiScattering = mix( multiScatteringDielectric, multiScatteringMetallic, material.metalness );
	vec3 totalScatteringDielectric = singleScatteringDielectric + multiScatteringDielectric;
	vec3 diffuse = material.diffuseContribution * ( 1.0 - totalScatteringDielectric );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	vec3 indirectSpecular = radiance * singleScattering;
	indirectSpecular += multiScattering * cosineWeightedIrradiance;
	vec3 indirectDiffuse = diffuse * cosineWeightedIrradiance;
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		indirectSpecular *= sheenEnergyComp;
		indirectDiffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectSpecular += indirectSpecular;
	reflectedLight.indirectDiffuse += indirectDiffuse;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,w1=`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		vec3 iridescenceFresnelDielectric = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		vec3 iridescenceFresnelMetallic = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.diffuseColor );
		material.iridescenceFresnel = mix( iridescenceFresnelDielectric, iridescenceFresnelMetallic, material.metalness );
		material.iridescenceF0Dielectric = Schlick_to_F0( iridescenceFresnelDielectric, 1.0, dotNVi );
		material.iridescenceF0Metallic = Schlick_to_F0( iridescenceFresnelMetallic, 1.0, dotNVi );
	}
#endif
#ifdef STANDARD
	float dotNVms = saturate( dot( geometryNormal, geometryViewDir ) );
	material.dfg = texture2D( dfgLUT, vec2( material.roughness, dotNVms ) ).rg;
	#if ( NUM_SUN_LIGHTS > 0 || NUM_DIR_LIGHTS > 0 || NUM_POINT_LIGHTS > 0 || NUM_SPOT_LIGHTS > 0 )
		float EssMs = material.dfg.x + material.dfg.y;
		material.multiScatteringCompensation = 1.0 + material.specularColorBlended * ( 1.0 / EssMs - 1.0 );
	#endif
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS ) && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SUN_LIGHTS > 0 ) && defined( RE_Direct )
	SunLight sunLight;
	#if defined( USE_SHADOWMAP ) && NUM_SUN_LIGHT_SHADOWS > 0
	SunLightShadow sunLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SUN_LIGHTS; i ++ ) {
		sunLight = sunLights[ i ];
		getSunLightInfo( sunLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SUN_LIGHT_SHADOWS )
		sunLightShadow = sunLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getSunShadow( sunShadowMap[ i ], sunLightShadow, UNROLLED_LOOP_INDEX ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
	#ifdef USE_LIGHT_PROBES_GRID
		vec3 probeWorldPos = ( ( vec4( geometryPosition, 1.0 ) - viewMatrix[ 3 ] ) * viewMatrix ).xyz;
		vec3 probeWorldNormal = transformNormalByInverseViewMatrix( geometryNormal, viewMatrix );
		irradiance += getLightProbeGridIrradiance( probeWorldPos, probeWorldNormal );
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,T1=`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( ENVMAP_TYPE_CUBE_UV )
		#if defined( STANDARD ) || defined( LAMBERT ) || defined( PHONG )
			iblIrradiance += getIBLIrradiance( geometryNormal );
		#endif
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		vec3 iblRadiance = getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		vec3 iblRadiance = getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_RETROREFLECTION
		#ifdef USE_ANISOTROPY
			vec3 retroIBLRadiance = getIBLAnisotropyRetroRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
		#else
			vec3 retroIBLRadiance = getIBLRetroRadiance( geometryViewDir, geometryNormal, material.roughness );
		#endif
		iblRadiance = mix( iblRadiance, retroIBLRadiance, saturate( material.retroreflectivity ) );
	#endif
	radiance += iblRadiance;
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,b1=`#if defined( RE_IndirectDiffuse )
	#if defined( LAMBERT ) || defined( PHONG )
		irradiance += iblIrradiance;
	#endif
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,A1=`#ifdef USE_LIGHT_PROBES_GRID
uniform highp sampler3D probesSH;
uniform vec3 probesMin;
uniform vec3 probesMax;
uniform vec3 probesResolution;
vec3 getLightProbeGridIrradiance( vec3 worldPos, vec3 worldNormal ) {
	vec3 res = probesResolution;
	vec3 gridRange = probesMax - probesMin;
	vec3 resMinusOne = res - 1.0;
	vec3 probeSpacing = gridRange / resMinusOne;
	vec3 samplePos = worldPos + worldNormal * probeSpacing * 0.5;
	vec3 uvw = clamp( ( samplePos - probesMin ) / gridRange, 0.0, 1.0 );
	uvw = uvw * resMinusOne / res + 0.5 / res;
	float nz          = res.z;
	float paddedSlices = nz + 2.0;
	float atlasDepth  = 7.0 * paddedSlices;
	float uvZBase     = uvw.z * nz + 1.0;
	vec4 s0 = texture( probesSH, vec3( uvw.xy, ( uvZBase                       ) / atlasDepth ) );
	vec4 s1 = texture( probesSH, vec3( uvw.xy, ( uvZBase +       paddedSlices   ) / atlasDepth ) );
	vec4 s2 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 2.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s3 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 3.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s4 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 4.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s5 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 5.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s6 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 6.0 * paddedSlices   ) / atlasDepth ) );
	vec3 c0 = s0.xyz;
	vec3 c1 = vec3( s0.w, s1.xy );
	vec3 c2 = vec3( s1.zw, s2.x );
	vec3 c3 = s2.yzw;
	vec3 c4 = s3.xyz;
	vec3 c5 = vec3( s3.w, s4.xy );
	vec3 c6 = vec3( s4.zw, s5.x );
	vec3 c7 = s5.yzw;
	vec3 c8 = s6.xyz;
	float x = worldNormal.x, y = worldNormal.y, z = worldNormal.z;
	vec3 result = c0 * 0.886227;
	result += c1 * 2.0 * 0.511664 * y;
	result += c2 * 2.0 * 0.511664 * z;
	result += c3 * 2.0 * 0.511664 * x;
	result += c4 * 2.0 * 0.429043 * x * y;
	result += c5 * 2.0 * 0.429043 * y * z;
	result += c6 * ( 0.743125 * z * z - 0.247708 );
	result += c7 * 2.0 * 0.429043 * x * z;
	result += c8 * 0.429043 * ( x * x - y * y );
	return max( result, vec3( 0.0 ) );
}
#endif`,C1=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,R1=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,P1=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,N1=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,L1=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,D1=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,I1=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,U1=`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,F1=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,O1=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,k1=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,B1=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,z1=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,H1=`#ifdef USE_MORPHTARGETS
	#ifndef USE_INSTANCING_MORPH
		uniform float morphTargetBaseInfluence;
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	#endif
	uniform sampler2DArray morphTargetsTexture;
	uniform ivec2 morphTargetsTextureSize;
	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
		int y = texelIndex / morphTargetsTextureSize.x;
		int x = texelIndex - y * morphTargetsTextureSize.x;
		ivec3 morphUV = ivec3( x, y, morphTargetIndex );
		return texelFetch( morphTargetsTexture, morphUV, 0 );
	}
#endif`,V1=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,G1=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#ifdef DOUBLE_SIDED
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#ifdef DOUBLE_SIDED
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,j1=`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#if defined( USE_PACKED_NORMALMAP )
		mapN = vec3( mapN.xy, sqrt( saturate( 1.0 - dot( mapN.xy, mapN.xy ) ) ) );
	#endif
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,W1=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,X1=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,$1=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
		#ifdef FLIP_SIDED
			vBitangent = - vBitangent;
		#endif
	#endif
#endif`,q1=`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,Y1=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,K1=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,Z1=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,Q1=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,J1=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,eT=`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;const float ShiftRight8 = 1. / 256.;
const float Inv255 = 1. / 255.;
const vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );
const vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );
const vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );
const vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );
vec4 packDepthToRGBA( const in float v ) {
	if( v <= 0.0 )
		return vec4( 0., 0., 0., 0. );
	if( v >= 1.0 )
		return vec4( 1., 1., 1., 1. );
	float vuf;
	float af = modf( v * PackFactors.a, vuf );
	float bf = modf( vuf * ShiftRight8, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );
}
vec3 packDepthToRGB( const in float v ) {
	if( v <= 0.0 )
		return vec3( 0., 0., 0. );
	if( v >= 1.0 )
		return vec3( 1., 1., 1. );
	float vuf;
	float bf = modf( v * PackFactors.b, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec3( vuf * Inv255, gf * PackUpscale, bf );
}
vec2 packDepthToRG( const in float v ) {
	if( v <= 0.0 )
		return vec2( 0., 0. );
	if( v >= 1.0 )
		return vec2( 1., 1. );
	float vuf;
	float gf = modf( v * 256., vuf );
	return vec2( vuf * Inv255, gf );
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors4 );
}
float unpackRGBToDepth( const in vec3 v ) {
	return dot( v, UnpackFactors3 );
}
float unpackRGToDepth( const in vec2 v ) {
	return v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;
}
vec4 pack2HalfToRGBA( const in vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( const in vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	#ifdef USE_REVERSED_DEPTH_BUFFER
	
		return depth * ( far - near ) - far;
	#else
		return depth * ( near - far ) - near;
	#endif
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	
	#ifdef USE_REVERSED_DEPTH_BUFFER
		return ( near * far ) / ( ( near - far ) * depth - near );
	#else
		return ( near * far ) / ( ( far - near ) * depth - far );
	#endif
}`,tT=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,nT=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,iT=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,rT=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,sT=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,aT=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,oT=`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
		#define SUN_LIGHT_CASCADES 2
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow sunShadowMap[ NUM_SUN_LIGHT_SHADOWS ];
		#else
			uniform sampler2D sunShadowMap[ NUM_SUN_LIGHT_SHADOWS ];
		#endif
		uniform mat4 sunShadowMatrix[ NUM_SUN_LIGHT_SHADOWS * SUN_LIGHT_CASCADES ];
		uniform vec4 sunShadowCascade[ NUM_SUN_LIGHT_SHADOWS * SUN_LIGHT_CASCADES ];
		varying vec4 vSunShadowWorldPosition;
		varying vec3 vSunShadowWorldNormal;
		struct SunLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SunLightShadow sunLightShadows[ NUM_SUN_LIGHT_SHADOWS ];
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#else
			uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#endif
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#else
			uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#endif
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform samplerCubeShadow pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#elif defined( SHADOWMAP_TYPE_BASIC )
			uniform samplerCube pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#endif
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float interleavedGradientNoise( vec2 position ) {
			return fract( 52.9829189 * fract( dot( position, vec2( 0.06711056, 0.00583715 ) ) ) );
		}
		vec2 vogelDiskSample( int sampleIndex, int samplesCount, float phi ) {
			const float goldenAngle = 2.399963229728653;
			float r = sqrt( ( float( sampleIndex ) + 0.5 ) / float( samplesCount ) );
			float theta = float( sampleIndex ) * goldenAngle + phi;
			return vec2( cos( theta ), sin( theta ) ) * r;
		}
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float getShadow( sampler2DShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			shadowCoord.z += shadowBias;
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
				float radius = shadowRadius * texelSize.x;
				float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
				shadow = (
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 0, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 1, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 2, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 3, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 4, 5, phi ) * radius, shadowCoord.z ) )
				) * 0.2;
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#elif defined( SHADOWMAP_TYPE_VSM )
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 distribution = texture2D( shadowMap, shadowCoord.xy ).rg;
				float mean = distribution.x;
				float variance = distribution.y * distribution.y;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					float hard_shadow = step( mean, shadowCoord.z );
				#else
					float hard_shadow = step( shadowCoord.z, mean );
				#endif
				
				if ( hard_shadow == 1.0 ) {
					shadow = 1.0;
				} else {
					variance = max( variance, 0.0000001 );
					float d = shadowCoord.z - mean;
					float p_max = variance / ( variance + d * d );
					p_max = clamp( ( p_max - 0.3 ) / 0.65, 0.0, 1.0 );
					shadow = max( hard_shadow, p_max );
				}
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#else
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				float depth = texture2D( shadowMap, shadowCoord.xy ).r;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					shadow = step( depth, shadowCoord.z );
				#else
					shadow = step( shadowCoord.z, depth );
				#endif
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#endif
	#if NUM_SUN_LIGHT_SHADOWS > 0
		float getSunShadow(
			#if defined( SHADOWMAP_TYPE_PCF )
				sampler2DShadow shadowMap,
			#else
				sampler2D shadowMap,
			#endif
			SunLightShadow sunLightShadow,
			int shadowIndex
		) {
			vec4 shadowWorldPosition = vec4( vSunShadowWorldPosition.xyz + vSunShadowWorldNormal * sunLightShadow.shadowNormalBias, 1.0 );
			float viewDepth = vSunShadowWorldPosition.w;
			int cascadeOffset = shadowIndex * SUN_LIGHT_CASCADES;
			float shadow = 1.0;
			for ( int i = SUN_LIGHT_CASCADES - 1; i >= 0; i -- ) {
				vec4 cascade = sunShadowCascade[ cascadeOffset + i ];
				if ( viewDepth >= cascade.x && viewDepth < cascade.y ) {
					float cascadeShadow = getShadow(
						shadowMap,
						sunLightShadow.shadowMapSize,
						sunLightShadow.shadowIntensity,
						sunLightShadow.shadowBias,
						sunLightShadow.shadowRadius,
						sunShadowMatrix[ cascadeOffset + i ] * shadowWorldPosition
					);
					shadow = mix( cascadeShadow, shadow, smoothstep( cascade.z, cascade.y, viewDepth ) );
				}
			}
			return shadow;
		}
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	#if defined( SHADOWMAP_TYPE_PCF )
	float getPointShadow( samplerCubeShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 bd3D = normalize( lightToPosition );
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			#ifdef USE_REVERSED_DEPTH_BUFFER
				float dp = ( shadowCameraNear * ( shadowCameraFar - viewSpaceZ ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
				dp -= shadowBias;
			#else
				float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
				dp += shadowBias;
			#endif
			float texelSize = shadowRadius / shadowMapSize.x;
			vec3 absDir = abs( bd3D );
			vec3 tangent = absDir.x > absDir.z ? vec3( 0.0, 1.0, 0.0 ) : vec3( 1.0, 0.0, 0.0 );
			tangent = normalize( cross( bd3D, tangent ) );
			vec3 bitangent = cross( bd3D, tangent );
			float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
			vec2 sample0 = vogelDiskSample( 0, 5, phi );
			vec2 sample1 = vogelDiskSample( 1, 5, phi );
			vec2 sample2 = vogelDiskSample( 2, 5, phi );
			vec2 sample3 = vogelDiskSample( 3, 5, phi );
			vec2 sample4 = vogelDiskSample( 4, 5, phi );
			shadow = (
				texture( shadowMap, vec4( bd3D + ( tangent * sample0.x + bitangent * sample0.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample1.x + bitangent * sample1.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample2.x + bitangent * sample2.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample3.x + bitangent * sample3.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample4.x + bitangent * sample4.y ) * texelSize, dp ) )
			) * 0.2;
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#elif defined( SHADOWMAP_TYPE_BASIC )
	float getPointShadow( samplerCube shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
			dp += shadowBias;
			vec3 bd3D = normalize( lightToPosition );
			float depth = textureCube( shadowMap, bd3D ).r;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				depth = 1.0 - depth;
			#endif
			shadow = step( dp, depth );
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#endif
	#endif
#endif`,lT=`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
		varying vec4 vSunShadowWorldPosition;
		varying vec3 vSunShadowWorldNormal;
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,cT=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_SUN_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	#ifdef HAS_NORMAL
		vec3 shadowWorldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );
	#else
		vec3 shadowWorldNormal = vec3( 0.0 );
	#endif
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_SUN_LIGHT_SHADOWS > 0
		vSunShadowWorldPosition = vec4( worldPosition.xyz, - mvPosition.z );
		vSunShadowWorldNormal = shadowWorldNormal;
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,uT=`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
	SunLightShadow sunLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SUN_LIGHT_SHADOWS; i ++ ) {
		sunLight = sunLightShadows[ i ];
		shadow *= receiveShadow ? getSunShadow( sunShadowMap[ i ], sunLight, UNROLLED_LOOP_INDEX ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0 && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,dT=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,fT=`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,hT=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,pT=`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,mT=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,gT=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,_T=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,vT=`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 CineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
vec3 NeutralToneMapping( vec3 color ) {
	const float StartCompression = 0.8 - 0.04;
	const float Desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min( color.r, min( color.g, color.b ) );
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max( color.r, max( color.g, color.b ) );
	if ( peak < StartCompression ) return color;
	float d = 1. - StartCompression;
	float newPeak = 1. - d * d / ( peak + d - StartCompression );
	color *= newPeak / peak;
	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
	return mix( color, vec3( newPeak ), g );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,xT=`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = transformNormalByInverseViewMatrix( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseContribution, material.specularColorBlended, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,yT=`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec4 transmittedLight;
		vec3 transmittance;
		#ifdef USE_DISPERSION
			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;
			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );
			for ( int i = 0; i < 3; i ++ ) {
				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );
				vec3 refractedRayExit = position + transmissionRay;
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;
				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];
			}
			transmittedLight.a /= 3.0;
		#else
			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		#endif
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,ST=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,MT=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,ET=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,wT=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`;const TT=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,bT=`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,AT=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,CT=`#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, backgroundRotation * vWorldDirection );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, backgroundRotation * vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,RT=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,PT=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,NT=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,LT=`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	#ifdef USE_REVERSED_DEPTH_BUFFER
		float fragCoordZ = vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ];
	#else
		float fragCoordZ = 0.5 * vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ] + 0.5;
	#endif
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#elif DEPTH_PACKING == 3202
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );
	#elif DEPTH_PACKING == 3203
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );
	#endif
}`,DT=`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,IT=`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = vec4( dist, 0.0, 0.0, 1.0 );
}`,UT=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,FT=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,OT=`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,kT=`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,BT=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,zT=`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,HT=`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,VT=`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,GT=`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,jT=`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,WT=`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,XT=`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( normalize( normal ) * 0.5 + 0.5, diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,$T=`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,qT=`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,YT=`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,KT=`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_DISPERSION
	uniform float dispersion;
#endif
#ifdef USE_RETROREFLECTION
	uniform float retroreflectivity;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
 
		outgoingLight = outgoingLight + sheenSpecularDirect + sheenSpecularIndirect;
 
 	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,ZT=`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,QT=`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,JT=`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,eb=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,tb=`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,nb=`uniform vec3 color;
uniform float opacity;
#include <common>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,ib=`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix[ 3 ];
	vec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,rb=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,tt={alphahash_fragment:Tw,alphahash_pars_fragment:bw,alphamap_fragment:Aw,alphamap_pars_fragment:Cw,alphatest_fragment:Rw,alphatest_pars_fragment:Pw,aomap_fragment:Nw,aomap_pars_fragment:Lw,batching_pars_vertex:Dw,batching_vertex:Iw,begin_vertex:Uw,beginnormal_vertex:Fw,bsdfs:Ow,iridescence_fragment:kw,bumpmap_pars_fragment:Bw,clipping_planes_fragment:zw,clipping_planes_pars_fragment:Hw,clipping_planes_pars_vertex:Vw,clipping_planes_vertex:Gw,color_fragment:jw,color_pars_fragment:Ww,color_pars_vertex:Xw,color_vertex:$w,common:qw,cube_uv_reflection_fragment:Yw,defaultnormal_vertex:Kw,displacementmap_pars_vertex:Zw,displacementmap_vertex:Qw,emissivemap_fragment:Jw,emissivemap_pars_fragment:e1,colorspace_fragment:t1,colorspace_pars_fragment:n1,envmap_fragment:i1,envmap_common_pars_fragment:r1,envmap_pars_fragment:s1,envmap_pars_vertex:a1,envmap_physical_pars_fragment:_1,envmap_vertex:o1,fog_vertex:l1,fog_pars_vertex:c1,fog_fragment:u1,fog_pars_fragment:d1,gradientmap_pars_fragment:f1,lightmap_pars_fragment:h1,lights_lambert_fragment:p1,lights_lambert_pars_fragment:m1,lights_pars_begin:g1,lights_toon_fragment:v1,lights_toon_pars_fragment:x1,lights_phong_fragment:y1,lights_phong_pars_fragment:S1,lights_physical_fragment:M1,lights_physical_pars_fragment:E1,lights_fragment_begin:w1,lights_fragment_maps:T1,lights_fragment_end:b1,lightprobes_pars_fragment:A1,logdepthbuf_fragment:C1,logdepthbuf_pars_fragment:R1,logdepthbuf_pars_vertex:P1,logdepthbuf_vertex:N1,map_fragment:L1,map_pars_fragment:D1,map_particle_fragment:I1,map_particle_pars_fragment:U1,metalnessmap_fragment:F1,metalnessmap_pars_fragment:O1,morphinstance_vertex:k1,morphcolor_vertex:B1,morphnormal_vertex:z1,morphtarget_pars_vertex:H1,morphtarget_vertex:V1,normal_fragment_begin:G1,normal_fragment_maps:j1,normal_pars_fragment:W1,normal_pars_vertex:X1,normal_vertex:$1,normalmap_pars_fragment:q1,clearcoat_normal_fragment_begin:Y1,clearcoat_normal_fragment_maps:K1,clearcoat_pars_fragment:Z1,iridescence_pars_fragment:Q1,opaque_fragment:J1,packing:eT,premultiplied_alpha_fragment:tT,project_vertex:nT,dithering_fragment:iT,dithering_pars_fragment:rT,roughnessmap_fragment:sT,roughnessmap_pars_fragment:aT,shadowmap_pars_fragment:oT,shadowmap_pars_vertex:lT,shadowmap_vertex:cT,shadowmask_pars_fragment:uT,skinbase_vertex:dT,skinning_pars_vertex:fT,skinning_vertex:hT,skinnormal_vertex:pT,specularmap_fragment:mT,specularmap_pars_fragment:gT,tonemapping_fragment:_T,tonemapping_pars_fragment:vT,transmission_fragment:xT,transmission_pars_fragment:yT,uv_pars_fragment:ST,uv_pars_vertex:MT,uv_vertex:ET,worldpos_vertex:wT,background_vert:TT,background_frag:bT,backgroundCube_vert:AT,backgroundCube_frag:CT,cube_vert:RT,cube_frag:PT,depth_vert:NT,depth_frag:LT,distance_vert:DT,distance_frag:IT,equirect_vert:UT,equirect_frag:FT,linedashed_vert:OT,linedashed_frag:kT,meshbasic_vert:BT,meshbasic_frag:zT,meshlambert_vert:HT,meshlambert_frag:VT,meshmatcap_vert:GT,meshmatcap_frag:jT,meshnormal_vert:WT,meshnormal_frag:XT,meshphong_vert:$T,meshphong_frag:qT,meshphysical_vert:YT,meshphysical_frag:KT,meshtoon_vert:ZT,meshtoon_frag:QT,points_vert:JT,points_frag:eb,shadow_vert:tb,shadow_frag:nb,sprite_vert:ib,sprite_frag:rb},Ee={common:{diffuse:{value:new ct(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new Ye},alphaMap:{value:null},alphaMapTransform:{value:new Ye},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new Ye}},envmap:{envMap:{value:null},envMapRotation:{value:new Ye},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98},dfgLUT:{value:null}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new Ye}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new Ye}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new Ye},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new Ye},normalScale:{value:new We(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new Ye},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new Ye}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new Ye}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new Ye}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new ct(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},sunLights:{value:[],properties:{direction:{},color:{}}},sunLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},sunShadowMatrix:{value:[]},sunShadowCascade:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null},probesSH:{value:null},probesMin:{value:new I},probesMax:{value:new I},probesResolution:{value:new I}},points:{diffuse:{value:new ct(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new Ye},alphaTest:{value:0},uvTransform:{value:new Ye}},sprite:{diffuse:{value:new ct(16777215)},opacity:{value:1},center:{value:new We(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new Ye},alphaMap:{value:null},alphaMapTransform:{value:new Ye},alphaTest:{value:0}}},Qi={basic:{uniforms:Nn([Ee.common,Ee.specularmap,Ee.envmap,Ee.aomap,Ee.lightmap,Ee.fog]),vertexShader:tt.meshbasic_vert,fragmentShader:tt.meshbasic_frag},lambert:{uniforms:Nn([Ee.common,Ee.specularmap,Ee.envmap,Ee.aomap,Ee.lightmap,Ee.emissivemap,Ee.bumpmap,Ee.normalmap,Ee.displacementmap,Ee.fog,Ee.lights,{emissive:{value:new ct(0)},envMapIntensity:{value:1}}]),vertexShader:tt.meshlambert_vert,fragmentShader:tt.meshlambert_frag},phong:{uniforms:Nn([Ee.common,Ee.specularmap,Ee.envmap,Ee.aomap,Ee.lightmap,Ee.emissivemap,Ee.bumpmap,Ee.normalmap,Ee.displacementmap,Ee.fog,Ee.lights,{emissive:{value:new ct(0)},specular:{value:new ct(1118481)},shininess:{value:30},envMapIntensity:{value:1}}]),vertexShader:tt.meshphong_vert,fragmentShader:tt.meshphong_frag},standard:{uniforms:Nn([Ee.common,Ee.envmap,Ee.aomap,Ee.lightmap,Ee.emissivemap,Ee.bumpmap,Ee.normalmap,Ee.displacementmap,Ee.roughnessmap,Ee.metalnessmap,Ee.fog,Ee.lights,{emissive:{value:new ct(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:tt.meshphysical_vert,fragmentShader:tt.meshphysical_frag},toon:{uniforms:Nn([Ee.common,Ee.aomap,Ee.lightmap,Ee.emissivemap,Ee.bumpmap,Ee.normalmap,Ee.displacementmap,Ee.gradientmap,Ee.fog,Ee.lights,{emissive:{value:new ct(0)}}]),vertexShader:tt.meshtoon_vert,fragmentShader:tt.meshtoon_frag},matcap:{uniforms:Nn([Ee.common,Ee.bumpmap,Ee.normalmap,Ee.displacementmap,Ee.fog,{matcap:{value:null}}]),vertexShader:tt.meshmatcap_vert,fragmentShader:tt.meshmatcap_frag},points:{uniforms:Nn([Ee.points,Ee.fog]),vertexShader:tt.points_vert,fragmentShader:tt.points_frag},dashed:{uniforms:Nn([Ee.common,Ee.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:tt.linedashed_vert,fragmentShader:tt.linedashed_frag},depth:{uniforms:Nn([Ee.common,Ee.displacementmap]),vertexShader:tt.depth_vert,fragmentShader:tt.depth_frag},normal:{uniforms:Nn([Ee.common,Ee.bumpmap,Ee.normalmap,Ee.displacementmap,{opacity:{value:1}}]),vertexShader:tt.meshnormal_vert,fragmentShader:tt.meshnormal_frag},sprite:{uniforms:Nn([Ee.sprite,Ee.fog]),vertexShader:tt.sprite_vert,fragmentShader:tt.sprite_frag},background:{uniforms:{uvTransform:{value:new Ye},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:tt.background_vert,fragmentShader:tt.background_frag},backgroundCube:{uniforms:{envMap:{value:null},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new Ye}},vertexShader:tt.backgroundCube_vert,fragmentShader:tt.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:tt.cube_vert,fragmentShader:tt.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:tt.equirect_vert,fragmentShader:tt.equirect_frag},distance:{uniforms:Nn([Ee.common,Ee.displacementmap,{referencePosition:{value:new I},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:tt.distance_vert,fragmentShader:tt.distance_frag},shadow:{uniforms:Nn([Ee.lights,Ee.fog,{color:{value:new ct(0)},opacity:{value:1}}]),vertexShader:tt.shadow_vert,fragmentShader:tt.shadow_frag}};Qi.physical={uniforms:Nn([Qi.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new Ye},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new Ye},clearcoatNormalScale:{value:new We(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new Ye},dispersion:{value:0},retroreflectivity:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new Ye},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new Ye},sheen:{value:0},sheenColor:{value:new ct(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new Ye},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new Ye},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new Ye},transmissionSamplerSize:{value:new We},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new Ye},attenuationDistance:{value:0},attenuationColor:{value:new ct(0)},specularColor:{value:new ct(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new Ye},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new Ye},anisotropyVector:{value:new We},anisotropyMap:{value:null},anisotropyMapTransform:{value:new Ye}}]),vertexShader:tt.meshphysical_vert,fragmentShader:tt.meshphysical_frag};const rc={r:0,b:0,g:0},sb=new kt,Fx=new Ye;Fx.set(-1,0,0,0,1,0,0,0,1);function ab(t,e,n,i,r,s){const a=new ct(0);let o=r===!0?0:1,l,c,h=null,p=0,f=null;function g(m){let M=m.isScene===!0?m.background:null;if(M&&M.isTexture){const y=m.backgroundBlurriness>0;M=e.get(M,y)}return M}function v(m){let M=!1;const y=g(m);y===null?_(a,o):y&&y.isColor&&(_(y,1),M=!0);const T=t.xr.getEnvironmentBlendMode();T==="additive"?n.buffers.color.setClear(0,0,0,1,s):T==="alpha-blend"&&n.buffers.color.setClear(0,0,0,0,s),(t.autoClear||M)&&(n.buffers.depth.setTest(!0),n.buffers.depth.setMask(!0),n.buffers.color.setMask(!0),t.clear(t.autoClearColor,t.autoClearDepth,t.autoClearStencil))}function S(m,M){const y=g(M);y&&(y.isCubeTexture||y.mapping===wu)?(c===void 0&&(c=new Be(new Ft(1,1,1),new cr({name:"BackgroundCubeMaterial",uniforms:Ga(Qi.backgroundCube.uniforms),vertexShader:Qi.backgroundCube.vertexShader,fragmentShader:Qi.backgroundCube.fragmentShader,side:Yn,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),c.geometry.deleteAttribute("normal"),c.geometry.deleteAttribute("uv"),c.onBeforeRender=function(T,E,C){this.matrixWorld.copyPosition(C.matrixWorld)},Object.defineProperty(c.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),i.update(c)),c.material.uniforms.envMap.value=y,c.material.uniforms.backgroundBlurriness.value=M.backgroundBlurriness,c.material.uniforms.backgroundIntensity.value=M.backgroundIntensity,c.material.uniforms.backgroundRotation.value.setFromMatrix4(sb.makeRotationFromEuler(M.backgroundRotation)).transpose(),y.isCubeTexture&&y.isRenderTargetTexture===!1&&c.material.uniforms.backgroundRotation.value.premultiply(Fx),c.material.toneMapped=ft.getTransfer(y.colorSpace)!==Tt,(h!==y||p!==y.version||f!==t.toneMapping)&&(c.material.needsUpdate=!0,h=y,p=y.version,f=t.toneMapping),c.layers.enableAll(),m.unshift(c,c.geometry,c.material,0,0,null)):y&&y.isTexture&&(l===void 0&&(l=new Be(new Va(2,2),new cr({name:"BackgroundMaterial",uniforms:Ga(Qi.background.uniforms),vertexShader:Qi.background.vertexShader,fragmentShader:Qi.background.fragmentShader,side:Os,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),l.geometry.deleteAttribute("normal"),Object.defineProperty(l.material,"map",{get:function(){return this.uniforms.t2D.value}}),i.update(l)),l.material.uniforms.t2D.value=y,l.material.uniforms.backgroundIntensity.value=M.backgroundIntensity,l.material.toneMapped=ft.getTransfer(y.colorSpace)!==Tt,y.matrixAutoUpdate===!0&&y.updateMatrix(),l.material.uniforms.uvTransform.value.copy(y.matrix),(h!==y||p!==y.version||f!==t.toneMapping)&&(l.material.needsUpdate=!0,h=y,p=y.version,f=t.toneMapping),l.layers.enableAll(),m.unshift(l,l.geometry,l.material,0,0,null))}function _(m,M){m.getRGB(rc,Nx(t)),n.buffers.color.setClear(rc.r,rc.g,rc.b,M,s)}function d(){c!==void 0&&(c.geometry.dispose(),c.material.dispose(),c=void 0),l!==void 0&&(l.geometry.dispose(),l.material.dispose(),l=void 0)}return{getClearColor:function(){return a},setClearColor:function(m,M=1){a.set(m),o=M,_(a,o)},getClearAlpha:function(){return o},setClearAlpha:function(m){o=m,_(a,o)},render:v,addToRenderList:S,dispose:d}}function ob(t,e){const n=t.getParameter(t.MAX_VERTEX_ATTRIBS),i={},r=f(null);let s=r,a=!1;function o(D,O,F,U,W){let N=!1;const z=p(D,U,F,O);s!==z&&(s=z,c(s.object)),N=g(D,U,F,W),N&&v(D,U,F,W),W!==null&&e.update(W,t.ELEMENT_ARRAY_BUFFER),(N||a)&&(a=!1,y(D,O,F,U),W!==null&&t.bindBuffer(t.ELEMENT_ARRAY_BUFFER,e.get(W).buffer))}function l(){return t.createVertexArray()}function c(D){return t.bindVertexArray(D)}function h(D){return t.deleteVertexArray(D)}function p(D,O,F,U){const W=U.wireframe===!0;let N=i[O.id];N===void 0&&(N={},i[O.id]=N);const z=D.isInstancedMesh===!0?D.id:0;let k=N[z];k===void 0&&(k={},N[z]=k);let j=k[F.id];j===void 0&&(j={},k[F.id]=j);let L=j[W];return L===void 0&&(L=f(l()),j[W]=L),L}function f(D){const O=[],F=[],U=[];for(let W=0;W<n;W++)O[W]=0,F[W]=0,U[W]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:O,enabledAttributes:F,attributeDivisors:U,object:D,attributes:{},index:null}}function g(D,O,F,U){const W=s.attributes,N=O.attributes;let z=0;const k=F.getAttributes();for(const j in k)if(k[j].location>=0){const $=W[j];let de=N[j];if(de===void 0&&(j==="instanceMatrix"&&D.instanceMatrix&&(de=D.instanceMatrix),j==="instanceColor"&&D.instanceColor&&(de=D.instanceColor)),$===void 0||$.attribute!==de||de&&$.data!==de.data)return!0;z++}return s.attributesNum!==z||s.index!==U}function v(D,O,F,U){const W={},N=O.attributes;let z=0;const k=F.getAttributes();for(const j in k)if(k[j].location>=0){let $=N[j];$===void 0&&(j==="instanceMatrix"&&D.instanceMatrix&&($=D.instanceMatrix),j==="instanceColor"&&D.instanceColor&&($=D.instanceColor));const de={};de.attribute=$,$&&$.data&&(de.data=$.data),W[j]=de,z++}s.attributes=W,s.attributesNum=z,s.index=U}function S(){const D=s.newAttributes;for(let O=0,F=D.length;O<F;O++)D[O]=0}function _(D){d(D,0)}function d(D,O){const F=s.newAttributes,U=s.enabledAttributes,W=s.attributeDivisors;F[D]=1,U[D]===0&&(t.enableVertexAttribArray(D),U[D]=1),W[D]!==O&&(t.vertexAttribDivisor(D,O),W[D]=O)}function m(){const D=s.newAttributes,O=s.enabledAttributes;for(let F=0,U=O.length;F<U;F++)O[F]!==D[F]&&(t.disableVertexAttribArray(F),O[F]=0)}function M(D,O,F,U,W,N,z){z===!0?t.vertexAttribIPointer(D,O,F,W,N):t.vertexAttribPointer(D,O,F,U,W,N)}function y(D,O,F,U){S();const W=U.attributes,N=F.getAttributes(),z=O.defaultAttributeValues;for(const k in N){const j=N[k];if(j.location>=0){let L=W[k];if(L===void 0&&(k==="instanceMatrix"&&D.instanceMatrix&&(L=D.instanceMatrix),k==="instanceColor"&&D.instanceColor&&(L=D.instanceColor)),L!==void 0){const $=L.normalized,de=L.itemSize,we=e.get(L);if(we===void 0)continue;const Ke=we.buffer,$e=we.type,Ze=we.bytesPerElement,Q=$e===t.INT||$e===t.UNSIGNED_INT||L.gpuType===Pp;if(L.isInterleavedBufferAttribute){const ee=L.data,Ne=ee.stride,je=L.offset;if(ee.isInstancedInterleavedBuffer){for(let Re=0;Re<j.locationSize;Re++)d(j.location+Re,ee.meshPerAttribute);D.isInstancedMesh!==!0&&U._maxInstanceCount===void 0&&(U._maxInstanceCount=ee.meshPerAttribute*ee.count)}else for(let Re=0;Re<j.locationSize;Re++)_(j.location+Re);t.bindBuffer(t.ARRAY_BUFFER,Ke);for(let Re=0;Re<j.locationSize;Re++)M(j.location+Re,de/j.locationSize,$e,$,Ne*Ze,(je+de/j.locationSize*Re)*Ze,Q)}else{if(L.isInstancedBufferAttribute){for(let ee=0;ee<j.locationSize;ee++)d(j.location+ee,L.meshPerAttribute);D.isInstancedMesh!==!0&&U._maxInstanceCount===void 0&&(U._maxInstanceCount=L.meshPerAttribute*L.count)}else for(let ee=0;ee<j.locationSize;ee++)_(j.location+ee);t.bindBuffer(t.ARRAY_BUFFER,Ke);for(let ee=0;ee<j.locationSize;ee++)M(j.location+ee,de/j.locationSize,$e,$,de*Ze,de/j.locationSize*ee*Ze,Q)}}else if(z!==void 0){const $=z[k];if($!==void 0)switch($.length){case 2:t.vertexAttrib2fv(j.location,$);break;case 3:t.vertexAttrib3fv(j.location,$);break;case 4:t.vertexAttrib4fv(j.location,$);break;default:t.vertexAttrib1fv(j.location,$)}}}}m()}function T(){b();for(const D in i){const O=i[D];for(const F in O){const U=O[F];for(const W in U){const N=U[W];for(const z in N)h(N[z].object),delete N[z];delete U[W]}}delete i[D]}}function E(D){if(i[D.id]===void 0)return;const O=i[D.id];for(const F in O){const U=O[F];for(const W in U){const N=U[W];for(const z in N)h(N[z].object),delete N[z];delete U[W]}}delete i[D.id]}function C(D){for(const O in i){const F=i[O];for(const U in F){const W=F[U];if(W[D.id]===void 0)continue;const N=W[D.id];for(const z in N)h(N[z].object),delete N[z];delete W[D.id]}}}function x(D){for(const O in i){const F=i[O],U=D.isInstancedMesh===!0?D.id:0,W=F[U];if(W!==void 0){for(const N in W){const z=W[N];for(const k in z)h(z[k].object),delete z[k];delete W[N]}delete F[U],Object.keys(F).length===0&&delete i[O]}}}function b(){P(),a=!0,s!==r&&(s=r,c(s.object))}function P(){r.geometry=null,r.program=null,r.wireframe=!1}return{setup:o,reset:b,resetDefaultState:P,dispose:T,releaseStatesOfGeometry:E,releaseStatesOfObject:x,releaseStatesOfProgram:C,initAttributes:S,enableAttribute:_,disableUnusedAttributes:m}}function lb(t,e,n){let i;function r(l){i=l}function s(l,c){t.drawArrays(i,l,c),n.update(c,i,1)}function a(l,c,h){h!==0&&(t.drawArraysInstanced(i,l,c,h),n.update(c,i,h))}function o(l,c,h){if(h===0)return;e.get("WEBGL_multi_draw").multiDrawArraysWEBGL(i,l,0,c,0,h);let f=0;for(let g=0;g<h;g++)f+=c[g];n.update(f,i,1)}this.setMode=r,this.render=s,this.renderInstances=a,this.renderMultiDraw=o}function cb(t,e,n,i){let r;function s(){if(r!==void 0)return r;if(e.has("EXT_texture_filter_anisotropic")===!0){const C=e.get("EXT_texture_filter_anisotropic");r=t.getParameter(C.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else r=0;return r}function a(C){return!(C!==Ui&&i.convert(C)!==t.getParameter(t.IMPLEMENTATION_COLOR_READ_FORMAT))}function o(C){const x=C===lr&&(e.has("EXT_color_buffer_half_float")||e.has("EXT_color_buffer_float"));return!(C!==ni&&C!==nr&&!x&&i.convert(C)!==t.getParameter(t.IMPLEMENTATION_COLOR_READ_TYPE))}function l(C){if(C==="highp"){if(t.getShaderPrecisionFormat(t.VERTEX_SHADER,t.HIGH_FLOAT).precision>0&&t.getShaderPrecisionFormat(t.FRAGMENT_SHADER,t.HIGH_FLOAT).precision>0)return"highp";C="mediump"}return C==="mediump"&&t.getShaderPrecisionFormat(t.VERTEX_SHADER,t.MEDIUM_FLOAT).precision>0&&t.getShaderPrecisionFormat(t.FRAGMENT_SHADER,t.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let c=n.precision!==void 0?n.precision:"highp";const h=l(c);h!==c&&(Ve("WebGLRenderer:",c,"not supported, using",h,"instead."),c=h);const p=n.logarithmicDepthBuffer===!0,f=n.reversedDepthBuffer===!0&&e.has("EXT_clip_control");n.reversedDepthBuffer===!0&&f===!1&&Ve("WebGLRenderer: Unable to use reversed depth buffer due to missing EXT_clip_control extension. Fallback to default depth buffer.");const g=t.getParameter(t.MAX_TEXTURE_IMAGE_UNITS),v=t.getParameter(t.MAX_VERTEX_TEXTURE_IMAGE_UNITS),S=t.getParameter(t.MAX_TEXTURE_SIZE),_=t.getParameter(t.MAX_CUBE_MAP_TEXTURE_SIZE),d=t.getParameter(t.MAX_VERTEX_ATTRIBS),m=t.getParameter(t.MAX_VERTEX_UNIFORM_VECTORS),M=t.getParameter(t.MAX_VARYING_VECTORS),y=t.getParameter(t.MAX_FRAGMENT_UNIFORM_VECTORS),T=t.getParameter(t.MAX_SAMPLES),E=t.getParameter(t.SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:s,getMaxPrecision:l,textureFormatReadable:a,textureTypeReadable:o,precision:c,logarithmicDepthBuffer:p,reversedDepthBuffer:f,maxTextures:g,maxVertexTextures:v,maxTextureSize:S,maxCubemapSize:_,maxAttributes:d,maxVertexUniforms:m,maxVaryings:M,maxFragmentUniforms:y,maxSamples:T,samples:E}}function ub(t){const e=this;let n=null,i=0,r=!1,s=!1;const a=new Sr,o=new Ye,l={value:null,needsUpdate:!1};this.uniform=l,this.numPlanes=0,this.numIntersection=0,this.init=function(p,f){const g=p.length!==0||f||i!==0||r;return r=f,i=p.length,g},this.beginShadows=function(){s=!0,h(null)},this.endShadows=function(){s=!1},this.setGlobalState=function(p,f){n=h(p,f,0)},this.setState=function(p,f,g){const v=p.clippingPlanes,S=p.clipIntersection,_=p.clipShadows,d=t.get(p);if(!r||v===null||v.length===0||s&&!_)s?h(null):c();else{const m=s?0:i,M=m*4;let y=d.clippingState||null;l.value=y,y=h(v,f,M,g);for(let T=0;T!==M;++T)y[T]=n[T];d.clippingState=y,this.numIntersection=S?this.numPlanes:0,this.numPlanes+=m}};function c(){l.value!==n&&(l.value=n,l.needsUpdate=i>0),e.numPlanes=i,e.numIntersection=0}function h(p,f,g,v){const S=p!==null?p.length:0;let _=null;if(S!==0){if(_=l.value,v!==!0||_===null){const d=g+S*4,m=f.matrixWorldInverse;o.getNormalMatrix(m),(_===null||_.length<d)&&(_=new Float32Array(d));for(let M=0,y=g;M!==S;++M,y+=4)a.copy(p[M]).applyMatrix4(m,o),a.normal.toArray(_,y),_[y+3]=a.constant}l.value=_,l.needsUpdate=!0}return e.numPlanes=S,e.numIntersection=0,_}}const Ma=4,db=6,fb=20,hb=256,_o=new Xp,og=new ct;let Od=null,kd=0,Bd=0,zd=!1;const pb=new I,Ms=new I;class lg{constructor(e){this._renderer=e,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._sizeLods=[],this._lodMeshes=[],this._backgroundBox=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._blurMaterial=null,this._ggxMaterial=null}fromScene(e,n=0,i=.1,r=100,s={}){const{size:a=256,position:o=pb}=s;Od=this._renderer.getRenderTarget(),kd=this._renderer.getActiveCubeFace(),Bd=this._renderer.getActiveMipmapLevel(),zd=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(a);const l=this._allocateTargets();return l.depthBuffer=!0,this._sceneToCubeUV(e,i,r,l,o),n>0&&this._blur(l,0,0,n),this._applyPMREM(l),this._cleanup(l),l}fromEquirectangular(e,n=null){return this._fromTexture(e,n)}fromCubemap(e,n=null){return this._fromTexture(e,n)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=dg(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=ug(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose(),this._backgroundBox!==null&&(this._backgroundBox.geometry.dispose(),this._backgroundBox.material.dispose())}_setSize(e){this._lodMax=Math.floor(Math.log2(e)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._ggxMaterial!==null&&this._ggxMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let e=0;e<this._lodMeshes.length;e++)this._lodMeshes[e].geometry.dispose()}_cleanup(e){this._renderer.setRenderTarget(Od,kd,Bd),this._renderer.xr.enabled=zd,e.scissorTest=!1,sa(e,0,0,e.width,e.height)}_fromTexture(e,n){e.mapping===ks||e.mapping===Ha?this._setSize(e.image.length===0?16:e.image[0].width||e.image[0].image.width):this._setSize(e.image.width/4),Od=this._renderer.getRenderTarget(),kd=this._renderer.getActiveCubeFace(),Bd=this._renderer.getActiveMipmapLevel(),zd=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;const i=n||this._allocateTargets();return this._textureToCubeUV(e,i),this._applyPMREM(i),this._cleanup(i),i}_allocateTargets(){const e=3*Math.max(this._cubeSize,112),n=4*this._cubeSize,i={magFilter:bn,minFilter:bn,generateMipmaps:!1,type:lr,format:Ui,colorSpace:Jc,depthBuffer:!1},r=cg(e,n,i);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==e||this._pingPongRenderTarget.height!==n){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=cg(e,n,i);const{_lodMax:s}=this;({lodMeshes:this._lodMeshes,sizeLods:this._sizeLods}=mb(s)),this._blurMaterial=_b(s,e,n),this._ggxMaterial=gb(s,e,n)}return r}_compileMaterial(e){const n=new Be(new Rn,e);this._renderer.compile(n,_o)}_sceneToCubeUV(e,n,i,r,s){const l=new Gn(90,1,n,i),c=[1,-1,1,1,1,1],h=[1,1,1,-1,-1,-1],p=this._renderer,f=p.autoClear,g=p.toneMapping;p.getClearColor(og),p.toneMapping=ar,p.autoClear=!1,p.state.buffers.depth.getReversed()&&(p.setRenderTarget(r),p.clearDepth(),p.setRenderTarget(null)),this._backgroundBox===null&&(this._backgroundBox=new Be(new Ft,new nu({name:"PMREM.Background",side:Yn,depthWrite:!1,depthTest:!1})));const S=this._backgroundBox,_=S.material;let d=!1;const m=e.background;m?m.isColor&&(_.color.copy(m),e.background=null,d=!0):(_.color.copy(og),d=!0);for(let M=0;M<6;M++){const y=M%3;y===0?(l.up.set(0,c[M],0),l.position.set(s.x,s.y,s.z),l.lookAt(s.x+h[M],s.y,s.z)):y===1?(l.up.set(0,0,c[M]),l.position.set(s.x,s.y,s.z),l.lookAt(s.x,s.y+h[M],s.z)):(l.up.set(0,c[M],0),l.position.set(s.x,s.y,s.z),l.lookAt(s.x,s.y,s.z+h[M]));const T=this._cubeSize;sa(r,y*T,M>2?T:0,T,T),p.setRenderTarget(r),d&&p.render(S,l),p.render(e,l)}p.toneMapping=g,p.autoClear=f,e.background=m}_textureToCubeUV(e,n){const i=this._renderer,r=e.mapping===ks||e.mapping===Ha;r?(this._cubemapMaterial===null&&(this._cubemapMaterial=dg()),this._cubemapMaterial.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=ug());const s=r?this._cubemapMaterial:this._equirectMaterial,a=this._lodMeshes[0];a.material=s;const o=s.uniforms;o.envMap.value=e;const l=this._cubeSize;sa(n,0,0,3*l,2*l),i.setRenderTarget(n),i.render(a,_o)}_applyPMREM(e){const n=this._renderer,i=n.autoClear;n.autoClear=!1;const r=this._lodMeshes.length;for(let s=1;s<r;s++)this._applyGGXFilter(e,s-1,s);n.autoClear=i}_applyGGXFilter(e,n,i){const r=this._renderer,s=this._pingPongRenderTarget,a=this._ggxMaterial,o=this._lodMeshes[i];o.material=a;const l=a.uniforms,c=i/(this._lodMeshes.length-1),h=n/(this._lodMeshes.length-1),p=Math.sqrt(c*c-h*h),f=c*1.25,g=p*f,{_lodMax:v}=this,S=this._sizeLods[i],_=3*S*(i>v-Ma?i-v+Ma:0),d=4*(this._cubeSize-S);l.envMap.value=e.texture,l.roughness.value=g,l.mipInt.value=v-n,sa(s,_,d,3*S,2*S),r.setRenderTarget(s),r.render(o,_o),l.envMap.value=s.texture,l.roughness.value=0,l.mipInt.value=v-i,sa(e,_,d,3*S,2*S),r.setRenderTarget(e),r.render(o,_o)}_blur(e,n,i,r){const s=this._pingPongRenderTarget,a=Math.min(r,Math.PI)/Math.SQRT2;this._blurPass(e,s,n,i,a),this._blurPass(s,e,i,i,a)}_blurPass(e,n,i,r,s){const a=this._renderer,o=this._blurMaterial,l=this._lodMeshes[r];l.material=o;const c=o.uniforms;c.envMap.value=e.texture,c.sigma.value=s,c.mipInt.value=this._lodMax-i;const h=this._sizeLods[r],p=3*h*(r>this._lodMax-Ma?r-this._lodMax+Ma:0),f=4*(this._cubeSize-h);sa(n,p,f,3*h,2*h),a.setRenderTarget(n),a.render(l,_o)}}function mb(t){const e=[],n=[];let i=t;const r=t-Ma+1+db;for(let s=0;s<r;s++){const a=Math.pow(2,i);e.push(a);const o=1/(a-2),l=-o,c=1+o,h=[l,l,c,l,c,c,l,l,c,c,l,c],p=6,f=6,g=3,v=new Float32Array(g*f*p),S=new Float32Array(g*f*p);for(let d=0;d<p;d++){const m=d%3*2/3-1,M=d>2?0:-1,y=[m,M,0,m+2/3,M,0,m+2/3,M+1,0,m,M,0,m+2/3,M+1,0,m,M+1,0];v.set(y,g*f*d);for(let T=0;T<f;T++){const E=h[T*2]*2-1,C=h[T*2+1]*2-1;d===0?Ms.set(1,C,E):d===1?Ms.set(-E,1,-C):d===2?Ms.set(-E,C,1):d===3?Ms.set(-1,C,-E):d===4?Ms.set(-E,-1,C):Ms.set(E,C,-1),Ms.toArray(S,(d*f+T)*g)}}const _=new Rn;_.setAttribute("position",new vi(v,g)),_.setAttribute("outputDirection",new vi(S,g)),n.push(new Be(_,null)),i>Ma&&i--}return{lodMeshes:n,sizeLods:e}}function cg(t,e,n){const i=new ki(t,e,n);return i.texture.mapping=wu,i.texture.name="PMREM.cubeUv",i.scissorTest=!0,i}function sa(t,e,n,i,r){t.viewport.set(e,n,i,r),t.scissor.set(e,n,i,r)}function gb(t,e,n){return new cr({name:"PMREMGGXConvolution",defines:{GGX_SAMPLES:hb,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/n,CUBEUV_MAX_MIP:`${t}.0`},uniforms:{envMap:{value:null},roughness:{value:0},mipInt:{value:0}},vertexShader:Au(),fragmentShader:`

			precision highp float;
			precision highp int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform float roughness;
			uniform float mipInt;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			#define PI 3.14159265359

			// Van der Corput radical inverse
			float radicalInverse_VdC(uint bits) {
				bits = (bits << 16u) | (bits >> 16u);
				bits = ((bits & 0x55555555u) << 1u) | ((bits & 0xAAAAAAAAu) >> 1u);
				bits = ((bits & 0x33333333u) << 2u) | ((bits & 0xCCCCCCCCu) >> 2u);
				bits = ((bits & 0x0F0F0F0Fu) << 4u) | ((bits & 0xF0F0F0F0u) >> 4u);
				bits = ((bits & 0x00FF00FFu) << 8u) | ((bits & 0xFF00FF00u) >> 8u);
				return float(bits) * 2.3283064365386963e-10; // / 0x100000000
			}

			// Hammersley sequence
			vec2 hammersley(uint i, uint N) {
				return vec2(float(i) / float(N), radicalInverse_VdC(i));
			}

			// GGX VNDF importance sampling (Eric Heitz 2018)
			// "Sampling the GGX Distribution of Visible Normals"
			// https://jcgt.org/published/0007/04/01/
			vec3 importanceSampleGGX_VNDF(vec2 Xi, vec3 V, float roughness) {
				float alpha = roughness * roughness;

				// Section 4.1: Orthonormal basis
				vec3 T1 = vec3(1.0, 0.0, 0.0);
				vec3 T2 = cross(V, T1);

				// Section 4.2: Parameterization of projected area
				float r = sqrt(Xi.x);
				float phi = 2.0 * PI * Xi.y;
				float t1 = r * cos(phi);
				float t2 = r * sin(phi);
				float s = 0.5 * (1.0 + V.z);
				t2 = (1.0 - s) * sqrt(1.0 - t1 * t1) + s * t2;

				// Section 4.3: Reprojection onto hemisphere
				vec3 Nh = t1 * T1 + t2 * T2 + sqrt(max(0.0, 1.0 - t1 * t1 - t2 * t2)) * V;

				// Section 3.4: Transform back to ellipsoid configuration
				return normalize(vec3(alpha * Nh.x, alpha * Nh.y, max(0.0, Nh.z)));
			}

			void main() {
				vec3 N = normalize(vOutputDirection);
				vec3 V = N; // Assume view direction equals normal for pre-filtering

				vec3 prefilteredColor = vec3(0.0);
				float totalWeight = 0.0;

				// For very low roughness, just sample the environment directly
				if (roughness < 0.001) {
					gl_FragColor = vec4(bilinearCubeUV(envMap, N, mipInt), 1.0);
					return;
				}

				// Tangent space basis for VNDF sampling
				vec3 up = abs(N.z) < 0.999 ? vec3(0.0, 0.0, 1.0) : vec3(1.0, 0.0, 0.0);
				vec3 tangent = normalize(cross(up, N));
				vec3 bitangent = cross(N, tangent);

				for(uint i = 0u; i < uint(GGX_SAMPLES); i++) {
					vec2 Xi = hammersley(i, uint(GGX_SAMPLES));

					// For PMREM, V = N, so in tangent space V is always (0, 0, 1)
					vec3 H_tangent = importanceSampleGGX_VNDF(Xi, vec3(0.0, 0.0, 1.0), roughness);

					// Transform H back to world space
					vec3 H = normalize(tangent * H_tangent.x + bitangent * H_tangent.y + N * H_tangent.z);
					vec3 L = normalize(2.0 * dot(V, H) * H - V);

					float NdotL = max(dot(N, L), 0.0);

					if(NdotL > 0.0) {
						// Sample environment at fixed mip level
						// VNDF importance sampling handles the distribution filtering
						vec3 sampleColor = bilinearCubeUV(envMap, L, mipInt);

						// Weight by NdotL for the split-sum approximation
						// VNDF PDF naturally accounts for the visible microfacet distribution
						prefilteredColor += sampleColor * NdotL;
						totalWeight += NdotL;
					}
				}

				if (totalWeight > 0.0) {
					prefilteredColor = prefilteredColor / totalWeight;
				}

				gl_FragColor = vec4(prefilteredColor, 1.0);
			}
		`,blending:br,depthTest:!1,depthWrite:!1})}function _b(t,e,n){return new cr({name:"SphericalGaussianBlur",defines:{SAMPLES:fb,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/n,CUBEUV_MAX_MIP:`${t}.0`},uniforms:{envMap:{value:null},sigma:{value:0},mipInt:{value:0}},vertexShader:Au(),fragmentShader:`

			precision highp float;
			precision highp int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform float sigma;
			uniform float mipInt;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			#define PI 3.14159265359
			#define GOLDEN_ANGLE 2.39996322973

			void main() {

				if ( sigma == 0.0 ) {

					gl_FragColor = vec4( bilinearCubeUV( envMap, vOutputDirection, mipInt ), 1.0 );
					return;

				}

				vec3 outputDirection = normalize( vOutputDirection );

				vec3 up = abs( outputDirection.z ) < 0.999 ? vec3( 0.0, 0.0, 1.0 ) : vec3( 1.0, 0.0, 0.0 );
				vec3 tangent = normalize( cross( up, outputDirection ) );
				vec3 bitangent = cross( outputDirection, tangent );

				// Truncate the kernel at three standard deviations or at the antipode.
				float thetaMax = min( 3.0 * sigma, PI );
				float truncation = 1.0 - exp( - 0.5 * thetaMax * thetaMax / ( sigma * sigma ) );

				vec3 accumColor = vec3( 0.0 );
				float accumWeight = 0.0;

				for ( int i = 0; i < SAMPLES; i ++ ) {

					// Stratified inverse-CDF sampling of the Gaussian, placed on a golden-angle spiral.
					float stratum = ( float( i ) + 0.5 ) / float( SAMPLES );
					float theta = sigma * sqrt( - 2.0 * log( 1.0 - stratum * truncation ) );
					float phi = float( i ) * GOLDEN_ANGLE;

					vec3 offset = cos( phi ) * tangent + sin( phi ) * bitangent;
					vec3 sampleDirection = cos( theta ) * outputDirection + sin( theta ) * offset;

					// Correct the planar sample density to solid angle.
					float weight = sin( theta ) / theta;

					accumColor += weight * bilinearCubeUV( envMap, sampleDirection, mipInt );
					accumWeight += weight;

				}

				gl_FragColor = vec4( accumColor / accumWeight, 1.0 );

			}
		`,blending:br,depthTest:!1,depthWrite:!1})}function ug(){return new cr({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:Au(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;

			#include <common>

			void main() {

				vec3 outputDirection = normalize( vOutputDirection );
				vec2 uv = equirectUv( outputDirection );

				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );

			}
		`,blending:br,depthTest:!1,depthWrite:!1})}function dg(){return new cr({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:Au(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:br,depthTest:!1,depthWrite:!1})}function Au(){return`

		precision mediump float;
		precision mediump int;

		attribute vec3 outputDirection;

		varying vec3 vOutputDirection;

		void main() {

			vOutputDirection = outputDirection;
			gl_Position = vec4( position, 1.0 );

		}
	`}class Ox extends ki{constructor(e=1,n={}){super(e,e,n),this.isWebGLCubeRenderTarget=!0;const i={width:e,height:e,depth:1},r=[i,i,i,i,i,i];this.texture=new Rx(r),this._setTextureOptions(n),this.texture.isRenderTargetTexture=!0}fromEquirectangularTexture(e,n){this.texture.type=n.type,this.texture.colorSpace=n.colorSpace,this.texture.generateMipmaps=n.generateMipmaps,this.texture.minFilter=n.minFilter,this.texture.magFilter=n.magFilter;const i={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},r=new Ft(5,5,5),s=new cr({name:"CubemapFromEquirect",uniforms:Ga(i.uniforms),vertexShader:i.vertexShader,fragmentShader:i.fragmentShader,side:Yn,blending:br});s.uniforms.tEquirect.value=n;const a=new Be(r,s),o=n.minFilter;return n.minFilter===Cs&&(n.minFilter=bn),new xw(1,10,this).update(e,a),n.minFilter=o,a.geometry.dispose(),a.material.dispose(),this}clear(e,n=!0,i=!0,r=!0){const s=e.getRenderTarget();for(let a=0;a<6;a++)e.setRenderTarget(this,a),e.clear(n,i,r);e.setRenderTarget(s)}}function vb(t){let e=new WeakMap,n=new WeakMap,i=null;function r(f,g=!1){return f==null?null:g?a(f):s(f)}function s(f){if(f&&f.isTexture){const g=f.mapping;if(g===cd||g===ud)if(e.has(f)){const v=e.get(f).texture;return o(v,f.mapping)}else{const v=f.image;if(v&&v.height>0){const S=new Ox(v.height);return S.fromEquirectangularTexture(t,f),e.set(f,S),f.addEventListener("dispose",c),o(S.texture,f.mapping)}else return null}}return f}function a(f){if(f&&f.isTexture){const g=f.mapping,v=g===cd||g===ud,S=g===ks||g===Ha;if(v||S){let _=n.get(f);const d=_!==void 0?_.texture.pmremVersion:0;if(f.isRenderTargetTexture&&f.pmremVersion!==d)return i===null&&(i=new lg(t)),_=v?i.fromEquirectangular(f,_):i.fromCubemap(f,_),_.texture.pmremVersion=f.pmremVersion,n.set(f,_),_.texture;if(_!==void 0)return _.texture;{const m=f.image;return v&&m&&m.height>0||S&&m&&l(m)?(i===null&&(i=new lg(t)),_=v?i.fromEquirectangular(f):i.fromCubemap(f),_.texture.pmremVersion=f.pmremVersion,n.set(f,_),f.addEventListener("dispose",h),_.texture):null}}}return f}function o(f,g){return g===cd?f.mapping=ks:g===ud&&(f.mapping=Ha),f}function l(f){let g=0;const v=6;for(let S=0;S<v;S++)f[S]!==void 0&&g++;return g===v}function c(f){const g=f.target;g.removeEventListener("dispose",c);const v=e.get(g);v!==void 0&&(e.delete(g),v.dispose())}function h(f){const g=f.target;g.removeEventListener("dispose",h);const v=n.get(g);v!==void 0&&(n.delete(g),v.dispose())}function p(){e=new WeakMap,n=new WeakMap,i!==null&&(i.dispose(),i=null)}return{get:r,dispose:p}}function xb(t){const e={};function n(i){if(e[i]!==void 0)return e[i];const r=t.getExtension(i);return e[i]=r,r}return{has:function(i){return n(i)!==null},init:function(){n("EXT_color_buffer_float"),n("WEBGL_clip_cull_distance"),n("OES_texture_float_linear"),n("EXT_color_buffer_half_float"),n("WEBGL_multisampled_render_to_texture"),n("WEBGL_render_shared_exponent")},get:function(i){const r=n(i);return r===null&&Na("WebGLRenderer: "+i+" extension not supported."),r}}}function yb(t,e,n,i){const r={},s=new WeakMap;function a(p){const f=p.target;f.index!==null&&e.remove(f.index);for(const v in f.attributes)e.remove(f.attributes[v]);f.removeEventListener("dispose",a),delete r[f.id];const g=s.get(f);g&&(e.remove(g),s.delete(f)),i.releaseStatesOfGeometry(f),f.isInstancedBufferGeometry===!0&&delete f._maxInstanceCount,n.memory.geometries--}function o(p,f){return r[f.id]===!0||(f.addEventListener("dispose",a),r[f.id]=!0,n.memory.geometries++),f}function l(p){const f=p.attributes;for(const g in f)e.update(f[g],t.ARRAY_BUFFER)}function c(p){const f=[],g=p.index,v=p.attributes.position;let S=0;if(v===void 0)return;if(g!==null){const m=g.array;S=g.version;for(let M=0,y=m.length;M<y;M+=3){const T=m[M+0],E=m[M+1],C=m[M+2];f.push(T,E,E,C,C,T)}}else{const m=v.array;S=v.version;for(let M=0,y=m.length/3-1;M<y;M+=3){const T=M+0,E=M+1,C=M+2;f.push(T,E,E,C,C,T)}}const _=new(v.count>=65535?Ax:bx)(f,1);_.version=S;const d=s.get(p);d&&e.remove(d),s.set(p,_)}function h(p){const f=s.get(p);if(f){const g=p.index;g!==null&&f.version<g.version&&c(p)}else c(p);return s.get(p)}return{get:o,update:l,getWireframeAttribute:h}}function Sb(t,e,n){let i;function r(p){i=p}let s,a;function o(p){s=p.type,a=p.bytesPerElement}function l(p,f){t.drawElements(i,f,s,p*a),n.update(f,i,1)}function c(p,f,g){g!==0&&(t.drawElementsInstanced(i,f,s,p*a,g),n.update(f,i,g))}function h(p,f,g){if(g===0)return;e.get("WEBGL_multi_draw").multiDrawElementsWEBGL(i,f,0,s,p,0,g);let S=0;for(let _=0;_<g;_++)S+=f[_];n.update(S,i,1)}this.setMode=r,this.setIndex=o,this.render=l,this.renderInstances=c,this.renderMultiDraw=h}function Mb(t){const e={geometries:0,textures:0},n={frame:0,calls:0,triangles:0,points:0,lines:0};function i(s,a,o){switch(n.calls++,a){case t.TRIANGLES:n.triangles+=o*(s/3);break;case t.LINES:n.lines+=o*(s/2);break;case t.LINE_STRIP:n.lines+=o*(s-1);break;case t.LINE_LOOP:n.lines+=o*s;break;case t.POINTS:n.points+=o*s;break;default:gt("WebGLInfo: Unknown draw mode:",a);break}}function r(){n.calls=0,n.triangles=0,n.points=0,n.lines=0}return{memory:e,render:n,programs:null,autoReset:!0,reset:r,update:i}}function Eb(t,e,n){const i=new WeakMap,r=new Gt;function s(a,o,l){const c=a.morphTargetInfluences,h=o.morphAttributes.position||o.morphAttributes.normal||o.morphAttributes.color,p=h!==void 0?h.length:0;let f=i.get(o);if(f===void 0||f.count!==p){let P=function(){x.dispose(),i.delete(o),o.removeEventListener("dispose",P)};var g=P;f!==void 0&&f.texture.dispose();const v=o.morphAttributes.position!==void 0,S=o.morphAttributes.normal!==void 0,_=o.morphAttributes.color!==void 0,d=o.morphAttributes.position||[],m=o.morphAttributes.normal||[],M=o.morphAttributes.color||[];let y=0;v===!0&&(y=1),S===!0&&(y=2),_===!0&&(y=3);let T=o.attributes.position.count*y,E=1;T>e.maxTextureSize&&(E=Math.ceil(T/e.maxTextureSize),T=e.maxTextureSize);const C=new Float32Array(T*E*4*p),x=new Ex(C,T,E,p);x.type=nr,x.needsUpdate=!0;const b=y*4;for(let D=0;D<p;D++){const O=d[D],F=m[D],U=M[D],W=T*E*4*D;for(let N=0;N<O.count;N++){const z=N*b;v===!0&&(r.fromBufferAttribute(O,N),C[W+z+0]=r.x,C[W+z+1]=r.y,C[W+z+2]=r.z,C[W+z+3]=0),S===!0&&(r.fromBufferAttribute(F,N),C[W+z+4]=r.x,C[W+z+5]=r.y,C[W+z+6]=r.z,C[W+z+7]=0),_===!0&&(r.fromBufferAttribute(U,N),C[W+z+8]=r.x,C[W+z+9]=r.y,C[W+z+10]=r.z,C[W+z+11]=U.itemSize===4?r.w:1)}}f={count:p,texture:x,size:new We(T,E)},i.set(o,f),o.addEventListener("dispose",P)}if(a.isInstancedMesh===!0&&a.morphTexture!==null)l.getUniforms().setValue(t,"morphTexture",a.morphTexture,n);else{let v=0;for(let _=0;_<c.length;_++)v+=c[_];const S=o.morphTargetsRelative?1:1-v;l.getUniforms().setValue(t,"morphTargetBaseInfluence",S),l.getUniforms().setValue(t,"morphTargetInfluences",c)}l.getUniforms().setValue(t,"morphTargetsTexture",f.texture,n),l.getUniforms().setValue(t,"morphTargetsTextureSize",f.size)}return{update:s}}function wb(t,e,n,i,r){let s=new WeakMap;function a(c){const h=r.render.frame,p=c.geometry,f=e.get(c,p);if(s.get(f)!==h&&(e.update(f),s.set(f,h)),c.isInstancedMesh&&(c.hasEventListener("dispose",l)===!1&&c.addEventListener("dispose",l),s.get(c)!==h&&(n.update(c.instanceMatrix,t.ARRAY_BUFFER),c.instanceColor!==null&&n.update(c.instanceColor,t.ARRAY_BUFFER),s.set(c,h))),c.isSkinnedMesh){const g=c.skeleton;s.get(g)!==h&&(g.update(),s.set(g,h))}return f}function o(){s=new WeakMap}function l(c){const h=c.target;h.removeEventListener("dispose",l),i.releaseStatesOfObject(h),n.remove(h.instanceMatrix),h.instanceColor!==null&&n.remove(h.instanceColor)}return{update:a,dispose:o}}const Tb={[ox]:"LINEAR_TONE_MAPPING",[lx]:"REINHARD_TONE_MAPPING",[cx]:"CINEON_TONE_MAPPING",[ux]:"ACES_FILMIC_TONE_MAPPING",[fx]:"AGX_TONE_MAPPING",[hx]:"NEUTRAL_TONE_MAPPING",[dx]:"CUSTOM_TONE_MAPPING"};function bb(t,e,n,i,r,s){const a=new ki(e,n,{type:t,depthBuffer:r,stencilBuffer:s,samples:i?4:0,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,resolveDepthBuffer:!1,resolveStencilBuffer:!1});let o=null,l=null;const c=new Rn;c.setAttribute("position",new Wt([-1,3,0,-1,-1,0,3,-1,0],3)),c.setAttribute("uv",new Wt([0,2,0,0,2,0],2));const h=new uw({uniforms:{tDiffuse:{value:null}},vertexShader:`
			precision highp float;

			uniform mat4 modelViewMatrix;
			uniform mat4 projectionMatrix;

			attribute vec3 position;
			attribute vec2 uv;

			varying vec2 vUv;

			void main() {
				vUv = uv;
				gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
			}`,fragmentShader:`
			precision highp float;

			uniform sampler2D tDiffuse;

			varying vec2 vUv;

			#include <tonemapping_pars_fragment>
			#include <colorspace_pars_fragment>

			void main() {
				gl_FragColor = texture2D( tDiffuse, vUv );

				#ifdef LINEAR_TONE_MAPPING
					gl_FragColor.rgb = LinearToneMapping( gl_FragColor.rgb );
				#elif defined( REINHARD_TONE_MAPPING )
					gl_FragColor.rgb = ReinhardToneMapping( gl_FragColor.rgb );
				#elif defined( CINEON_TONE_MAPPING )
					gl_FragColor.rgb = CineonToneMapping( gl_FragColor.rgb );
				#elif defined( ACES_FILMIC_TONE_MAPPING )
					gl_FragColor.rgb = ACESFilmicToneMapping( gl_FragColor.rgb );
				#elif defined( AGX_TONE_MAPPING )
					gl_FragColor.rgb = AgXToneMapping( gl_FragColor.rgb );
				#elif defined( NEUTRAL_TONE_MAPPING )
					gl_FragColor.rgb = NeutralToneMapping( gl_FragColor.rgb );
				#elif defined( CUSTOM_TONE_MAPPING )
					gl_FragColor.rgb = CustomToneMapping( gl_FragColor.rgb );
				#endif

				#ifdef SRGB_TRANSFER
					gl_FragColor = sRGBTransferOETF( gl_FragColor );
				#endif
			}`,depthTest:!1,depthWrite:!1}),p=new Be(c,h),f=new Xp(-1,1,1,-1,0,1);let g=null,v=null,S=!1,_,d=null,m=[],M=!1;this.setSize=function(y,T){a.setSize(y,T),o!==null&&o.setSize(y,T),l!==null&&l.setSize(y,T);for(let E=0;E<m.length;E++){const C=m[E];C.setSize&&C.setSize(y,T)}},this.setEffects=function(y){m=y,M=m.length>0&&m[0].isRenderPass===!0;const T=a.width,E=a.height;m.length>0&&o===null&&(o=new ki(T,E,{type:lr,depthBuffer:!1,stencilBuffer:!1}),l=new ki(T,E,{type:lr,depthBuffer:!1,stencilBuffer:!1}));for(let C=0;C<m.length;C++){const x=m[C];x.setSize&&x.setSize(T,E)}},this.begin=function(y,T){if(S||y.toneMapping===ar&&m.length===0)return!1;if(d=T,T!==null){const E=T.width,C=T.height;(a.width!==E||a.height!==C)&&this.setSize(E,C)}return M===!1&&y.setRenderTarget(a),_=y.toneMapping,y.toneMapping=ar,!0},this.hasRenderPass=function(){return M},this.end=function(y,T){y.toneMapping=_,S=!0;let E=a,C=o;for(let x=0;x<m.length;x++){const b=m[x];b.enabled!==!1&&(b.render(y,C,E,T),b.needsSwap!==!1&&(E=C,C=C===o?l:o))}if(g!==y.outputColorSpace||v!==y.toneMapping){g=y.outputColorSpace,v=y.toneMapping,h.defines={},ft.getTransfer(g)===Tt&&(h.defines.SRGB_TRANSFER="");const x=Tb[v];x&&(h.defines[x]=""),h.needsUpdate=!0}h.uniforms.tDiffuse.value=E.texture,y.setRenderTarget(d),y.render(p,f),d=null,S=!1},this.isCompositing=function(){return S},this.dispose=function(){a.dispose(),o!==null&&o.dispose(),l!==null&&l.dispose(),c.dispose(),h.dispose()}}const kx=new An,Ch=new sl(1,1),Bx=new Ex,zx=new kE,Hx=new Rx,fg=[],hg=[],pg=new Float32Array(16),mg=new Float32Array(9),gg=new Float32Array(4);function qa(t,e,n){const i=t[0];if(i<=0||i>0)return t;const r=e*n;let s=fg[r];if(s===void 0&&(s=new Float32Array(r),fg[r]=s),e!==0){i.toArray(s,0);for(let a=1,o=0;a!==e;++a)o+=n,t[a].toArray(s,o)}return s}function an(t,e){if(t.length!==e.length)return!1;for(let n=0,i=t.length;n<i;n++)if(t[n]!==e[n])return!1;return!0}function on(t,e){for(let n=0,i=e.length;n<i;n++)t[n]=e[n]}function Cu(t,e){let n=hg[e];n===void 0&&(n=new Int32Array(e),hg[e]=n);for(let i=0;i!==e;++i)n[i]=t.allocateTextureUnit();return n}function Ab(t,e){const n=this.cache;n[0]!==e&&(t.uniform1f(this.addr,e),n[0]=e)}function Cb(t,e){const n=this.cache;if(e.x!==void 0)(n[0]!==e.x||n[1]!==e.y)&&(t.uniform2f(this.addr,e.x,e.y),n[0]=e.x,n[1]=e.y);else{if(an(n,e))return;t.uniform2fv(this.addr,e),on(n,e)}}function Rb(t,e){const n=this.cache;if(e.x!==void 0)(n[0]!==e.x||n[1]!==e.y||n[2]!==e.z)&&(t.uniform3f(this.addr,e.x,e.y,e.z),n[0]=e.x,n[1]=e.y,n[2]=e.z);else if(e.r!==void 0)(n[0]!==e.r||n[1]!==e.g||n[2]!==e.b)&&(t.uniform3f(this.addr,e.r,e.g,e.b),n[0]=e.r,n[1]=e.g,n[2]=e.b);else{if(an(n,e))return;t.uniform3fv(this.addr,e),on(n,e)}}function Pb(t,e){const n=this.cache;if(e.x!==void 0)(n[0]!==e.x||n[1]!==e.y||n[2]!==e.z||n[3]!==e.w)&&(t.uniform4f(this.addr,e.x,e.y,e.z,e.w),n[0]=e.x,n[1]=e.y,n[2]=e.z,n[3]=e.w);else{if(an(n,e))return;t.uniform4fv(this.addr,e),on(n,e)}}function Nb(t,e){const n=this.cache,i=e.elements;if(i===void 0){if(an(n,e))return;t.uniformMatrix2fv(this.addr,!1,e),on(n,e)}else{if(an(n,i))return;gg.set(i),t.uniformMatrix2fv(this.addr,!1,gg),on(n,i)}}function Lb(t,e){const n=this.cache,i=e.elements;if(i===void 0){if(an(n,e))return;t.uniformMatrix3fv(this.addr,!1,e),on(n,e)}else{if(an(n,i))return;mg.set(i),t.uniformMatrix3fv(this.addr,!1,mg),on(n,i)}}function Db(t,e){const n=this.cache,i=e.elements;if(i===void 0){if(an(n,e))return;t.uniformMatrix4fv(this.addr,!1,e),on(n,e)}else{if(an(n,i))return;pg.set(i),t.uniformMatrix4fv(this.addr,!1,pg),on(n,i)}}function Ib(t,e){const n=this.cache;n[0]!==e&&(t.uniform1i(this.addr,e),n[0]=e)}function Ub(t,e){const n=this.cache;if(e.x!==void 0)(n[0]!==e.x||n[1]!==e.y)&&(t.uniform2i(this.addr,e.x,e.y),n[0]=e.x,n[1]=e.y);else{if(an(n,e))return;t.uniform2iv(this.addr,e),on(n,e)}}function Fb(t,e){const n=this.cache;if(e.x!==void 0)(n[0]!==e.x||n[1]!==e.y||n[2]!==e.z)&&(t.uniform3i(this.addr,e.x,e.y,e.z),n[0]=e.x,n[1]=e.y,n[2]=e.z);else{if(an(n,e))return;t.uniform3iv(this.addr,e),on(n,e)}}function Ob(t,e){const n=this.cache;if(e.x!==void 0)(n[0]!==e.x||n[1]!==e.y||n[2]!==e.z||n[3]!==e.w)&&(t.uniform4i(this.addr,e.x,e.y,e.z,e.w),n[0]=e.x,n[1]=e.y,n[2]=e.z,n[3]=e.w);else{if(an(n,e))return;t.uniform4iv(this.addr,e),on(n,e)}}function kb(t,e){const n=this.cache;n[0]!==e&&(t.uniform1ui(this.addr,e),n[0]=e)}function Bb(t,e){const n=this.cache;if(e.x!==void 0)(n[0]!==e.x||n[1]!==e.y)&&(t.uniform2ui(this.addr,e.x,e.y),n[0]=e.x,n[1]=e.y);else{if(an(n,e))return;t.uniform2uiv(this.addr,e),on(n,e)}}function zb(t,e){const n=this.cache;if(e.x!==void 0)(n[0]!==e.x||n[1]!==e.y||n[2]!==e.z)&&(t.uniform3ui(this.addr,e.x,e.y,e.z),n[0]=e.x,n[1]=e.y,n[2]=e.z);else{if(an(n,e))return;t.uniform3uiv(this.addr,e),on(n,e)}}function Hb(t,e){const n=this.cache;if(e.x!==void 0)(n[0]!==e.x||n[1]!==e.y||n[2]!==e.z||n[3]!==e.w)&&(t.uniform4ui(this.addr,e.x,e.y,e.z,e.w),n[0]=e.x,n[1]=e.y,n[2]=e.z,n[3]=e.w);else{if(an(n,e))return;t.uniform4uiv(this.addr,e),on(n,e)}}function Vb(t,e,n){const i=this.cache,r=n.allocateTextureUnit();i[0]!==r&&(t.uniform1i(this.addr,r),i[0]=r);let s;this.type===t.SAMPLER_2D_SHADOW?(Ch.compareFunction=n.isReversedDepthBuffer()?Op:Fp,s=Ch):s=kx,n.setTexture2D(e||s,r)}function Gb(t,e,n){const i=this.cache,r=n.allocateTextureUnit();i[0]!==r&&(t.uniform1i(this.addr,r),i[0]=r),n.setTexture3D(e||zx,r)}function jb(t,e,n){const i=this.cache,r=n.allocateTextureUnit();i[0]!==r&&(t.uniform1i(this.addr,r),i[0]=r),n.setTextureCube(e||Hx,r)}function Wb(t,e,n){const i=this.cache,r=n.allocateTextureUnit();i[0]!==r&&(t.uniform1i(this.addr,r),i[0]=r),n.setTexture2DArray(e||Bx,r)}function Xb(t){switch(t){case 5126:return Ab;case 35664:return Cb;case 35665:return Rb;case 35666:return Pb;case 35674:return Nb;case 35675:return Lb;case 35676:return Db;case 5124:case 35670:return Ib;case 35667:case 35671:return Ub;case 35668:case 35672:return Fb;case 35669:case 35673:return Ob;case 5125:return kb;case 36294:return Bb;case 36295:return zb;case 36296:return Hb;case 35678:case 36198:case 36298:case 36306:case 35682:return Vb;case 35679:case 36299:case 36307:return Gb;case 35680:case 36300:case 36308:case 36293:return jb;case 36289:case 36303:case 36311:case 36292:return Wb}}function $b(t,e){t.uniform1fv(this.addr,e)}function qb(t,e){const n=qa(e,this.size,2);t.uniform2fv(this.addr,n)}function Yb(t,e){const n=qa(e,this.size,3);t.uniform3fv(this.addr,n)}function Kb(t,e){const n=qa(e,this.size,4);t.uniform4fv(this.addr,n)}function Zb(t,e){const n=qa(e,this.size,4);t.uniformMatrix2fv(this.addr,!1,n)}function Qb(t,e){const n=qa(e,this.size,9);t.uniformMatrix3fv(this.addr,!1,n)}function Jb(t,e){const n=qa(e,this.size,16);t.uniformMatrix4fv(this.addr,!1,n)}function eA(t,e){t.uniform1iv(this.addr,e)}function tA(t,e){t.uniform2iv(this.addr,e)}function nA(t,e){t.uniform3iv(this.addr,e)}function iA(t,e){t.uniform4iv(this.addr,e)}function rA(t,e){t.uniform1uiv(this.addr,e)}function sA(t,e){t.uniform2uiv(this.addr,e)}function aA(t,e){t.uniform3uiv(this.addr,e)}function oA(t,e){t.uniform4uiv(this.addr,e)}function lA(t,e,n){const i=this.cache,r=e.length,s=Cu(n,r);an(i,s)||(t.uniform1iv(this.addr,s),on(i,s));let a;this.type===t.SAMPLER_2D_SHADOW?a=Ch:a=kx;for(let o=0;o!==r;++o)n.setTexture2D(e[o]||a,s[o])}function cA(t,e,n){const i=this.cache,r=e.length,s=Cu(n,r);an(i,s)||(t.uniform1iv(this.addr,s),on(i,s));for(let a=0;a!==r;++a)n.setTexture3D(e[a]||zx,s[a])}function uA(t,e,n){const i=this.cache,r=e.length,s=Cu(n,r);an(i,s)||(t.uniform1iv(this.addr,s),on(i,s));for(let a=0;a!==r;++a)n.setTextureCube(e[a]||Hx,s[a])}function dA(t,e,n){const i=this.cache,r=e.length,s=Cu(n,r);an(i,s)||(t.uniform1iv(this.addr,s),on(i,s));for(let a=0;a!==r;++a)n.setTexture2DArray(e[a]||Bx,s[a])}function fA(t){switch(t){case 5126:return $b;case 35664:return qb;case 35665:return Yb;case 35666:return Kb;case 35674:return Zb;case 35675:return Qb;case 35676:return Jb;case 5124:case 35670:return eA;case 35667:case 35671:return tA;case 35668:case 35672:return nA;case 35669:case 35673:return iA;case 5125:return rA;case 36294:return sA;case 36295:return aA;case 36296:return oA;case 35678:case 36198:case 36298:case 36306:case 35682:return lA;case 35679:case 36299:case 36307:return cA;case 35680:case 36300:case 36308:case 36293:return uA;case 36289:case 36303:case 36311:case 36292:return dA}}class hA{constructor(e,n,i){this.id=e,this.addr=i,this.cache=[],this.type=n.type,this.setValue=Xb(n.type)}}class pA{constructor(e,n,i){this.id=e,this.addr=i,this.cache=[],this.type=n.type,this.size=n.size,this.setValue=fA(n.type)}}class mA{constructor(e){this.id=e,this.seq=[],this.map={}}setValue(e,n,i){const r=this.seq;for(let s=0,a=r.length;s!==a;++s){const o=r[s];o.setValue(e,n[o.id],i)}}}const Hd=/(\w+)(\])?(\[|\.)?/g;function _g(t,e){t.seq.push(e),t.map[e.id]=e}function gA(t,e,n){const i=t.name,r=i.length;for(Hd.lastIndex=0;;){const s=Hd.exec(i),a=Hd.lastIndex;let o=s[1];const l=s[2]==="]",c=s[3];if(l&&(o=o|0),c===void 0||c==="["&&a+2===r){_g(n,c===void 0?new hA(o,t,e):new pA(o,t,e));break}else{let p=n.map[o];p===void 0&&(p=new mA(o),_g(n,p)),n=p}}}class wc{constructor(e,n){this.seq=[],this.map={};const i=e.getProgramParameter(n,e.ACTIVE_UNIFORMS);for(let a=0;a<i;++a){const o=e.getActiveUniform(n,a),l=e.getUniformLocation(n,o.name);gA(o,l,this)}const r=[],s=[];for(const a of this.seq)a.type===e.SAMPLER_2D_SHADOW||a.type===e.SAMPLER_CUBE_SHADOW||a.type===e.SAMPLER_2D_ARRAY_SHADOW?r.push(a):s.push(a);r.length>0&&(this.seq=r.concat(s))}setValue(e,n,i,r){const s=this.map[n];s!==void 0&&s.setValue(e,i,r)}setOptional(e,n,i){const r=n[i];r!==void 0&&this.setValue(e,i,r)}static upload(e,n,i,r){for(let s=0,a=n.length;s!==a;++s){const o=n[s],l=i[o.id];l.needsUpdate!==!1&&o.setValue(e,l.value,r)}}static seqWithValue(e,n){const i=[];for(let r=0,s=e.length;r!==s;++r){const a=e[r];a.id in n&&i.push(a)}return i}}function vg(t,e,n){const i=t.createShader(e);return t.shaderSource(i,n),t.compileShader(i),i}const _A=37297;let vA=0;function xA(t,e){const n=t.split(`
`),i=[],r=Math.max(e-6,0),s=Math.min(e+6,n.length);for(let a=r;a<s;a++){const o=a+1;i.push(`${o===e?">":" "} ${o}: ${n[a]}`)}return i.join(`
`)}const xg=new Ye;function yA(t){ft._getMatrix(xg,ft.workingColorSpace,t);const e=`mat3( ${xg.elements.map(n=>n.toFixed(4))} )`;switch(ft.getTransfer(t)){case eu:return[e,"LinearTransferOETF"];case Tt:return[e,"sRGBTransferOETF"];default:return Ve("WebGLProgram: Unsupported color space: ",t),[e,"LinearTransferOETF"]}}function yg(t,e,n){const i=t.getShaderParameter(e,t.COMPILE_STATUS),s=(t.getShaderInfoLog(e)||"").trim();if(i&&s==="")return"";const a=/ERROR: 0:(\d+)/.exec(s);if(a){const o=parseInt(a[1]);return n.toUpperCase()+`

`+s+`

`+xA(t.getShaderSource(e),o)}else return s}function SA(t,e){const n=yA(e);return[`vec4 ${t}( vec4 value ) {`,`	return ${n[1]}( vec4( value.rgb * ${n[0]}, value.a ) );`,"}"].join(`
`)}const MA={[ox]:"Linear",[lx]:"Reinhard",[cx]:"Cineon",[ux]:"ACESFilmic",[fx]:"AgX",[hx]:"Neutral",[dx]:"Custom"};function EA(t,e){const n=MA[e];return n===void 0?(Ve("WebGLProgram: Unsupported toneMapping:",e),"vec3 "+t+"( vec3 color ) { return LinearToneMapping( color ); }"):"vec3 "+t+"( vec3 color ) { return "+n+"ToneMapping( color ); }"}const sc=new I;function wA(){ft.getLuminanceCoefficients(sc);const t=sc.x.toFixed(4),e=sc.y.toFixed(4),n=sc.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${t}, ${e}, ${n} );`,"	return dot( weights, rgb );","}"].join(`
`)}function TA(t){return[t.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",t.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(wo).join(`
`)}function bA(t){const e=[];for(const n in t){const i=t[n];i!==!1&&e.push("#define "+n+" "+i)}return e.join(`
`)}function AA(t,e){const n={},i=t.getProgramParameter(e,t.ACTIVE_ATTRIBUTES);for(let r=0;r<i;r++){const s=t.getActiveAttrib(e,r),a=s.name;let o=1;s.type===t.FLOAT_MAT2&&(o=2),s.type===t.FLOAT_MAT3&&(o=3),s.type===t.FLOAT_MAT4&&(o=4),n[a]={type:s.type,location:t.getAttribLocation(e,a),locationSize:o}}return n}function wo(t){return t!==""}function Sg(t,e){const n=e.numSpotLightShadows+e.numSpotLightMaps-e.numSpotLightShadowsWithMaps;return t.replace(/NUM_SUN_LIGHTS/g,e.numSunLights).replace(/NUM_DIR_LIGHTS/g,e.numDirLights).replace(/NUM_SPOT_LIGHTS/g,e.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,e.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,n).replace(/NUM_RECT_AREA_LIGHTS/g,e.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,e.numPointLights).replace(/NUM_HEMI_LIGHTS/g,e.numHemiLights).replace(/NUM_SUN_LIGHT_SHADOWS/g,e.numSunLightShadows).replace(/NUM_DIR_LIGHT_SHADOWS/g,e.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,e.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,e.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,e.numPointLightShadows)}function Mg(t,e){return t.replace(/NUM_CLIPPING_PLANES/g,e.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,e.numClippingPlanes-e.numClipIntersection)}const CA=/^[ \t]*#include +<([\w\d./]+)>/gm;function Rh(t){return t.replace(CA,PA)}const RA=new Map;function PA(t,e){let n=tt[e];if(n===void 0){const i=RA.get(e);if(i!==void 0)n=tt[i],Ve('WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',e,i);else throw new Error("THREE.WebGLProgram: Can not resolve #include <"+e+">")}return Rh(n)}const NA=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function Eg(t){return t.replace(NA,LA)}function LA(t,e,n,i){let r="";for(let s=parseInt(e);s<parseInt(n);s++)r+=i.replace(/\[\s*i\s*\]/g,"[ "+s+" ]").replace(/UNROLLED_LOOP_INDEX/g,s);return r}function wg(t){let e=`precision ${t.precision} float;
	precision ${t.precision} int;
	precision ${t.precision} sampler2D;
	precision ${t.precision} samplerCube;
	precision ${t.precision} sampler3D;
	precision ${t.precision} sampler2DArray;
	precision ${t.precision} sampler2DShadow;
	precision ${t.precision} samplerCubeShadow;
	precision ${t.precision} sampler2DArrayShadow;
	precision ${t.precision} isampler2D;
	precision ${t.precision} isampler3D;
	precision ${t.precision} isamplerCube;
	precision ${t.precision} isampler2DArray;
	precision ${t.precision} usampler2D;
	precision ${t.precision} usampler3D;
	precision ${t.precision} usamplerCube;
	precision ${t.precision} usampler2DArray;
	`;return t.precision==="highp"?e+=`
#define HIGH_PRECISION`:t.precision==="mediump"?e+=`
#define MEDIUM_PRECISION`:t.precision==="lowp"&&(e+=`
#define LOW_PRECISION`),e}const DA={[Uo]:"SHADOWMAP_TYPE_PCF",[Eo]:"SHADOWMAP_TYPE_VSM"};function IA(t){return DA[t.shadowMapType]||"SHADOWMAP_TYPE_BASIC"}const UA={[ks]:"ENVMAP_TYPE_CUBE",[Ha]:"ENVMAP_TYPE_CUBE",[wu]:"ENVMAP_TYPE_CUBE_UV"};function FA(t){return t.envMap===!1?"ENVMAP_TYPE_CUBE":UA[t.envMapMode]||"ENVMAP_TYPE_CUBE"}const OA={[Ha]:"ENVMAP_MODE_REFRACTION"};function kA(t){return t.envMap===!1?"ENVMAP_MODE_REFLECTION":OA[t.envMapMode]||"ENVMAP_MODE_REFLECTION"}const BA={[ax]:"ENVMAP_BLENDING_MULTIPLY",[pE]:"ENVMAP_BLENDING_MIX",[mE]:"ENVMAP_BLENDING_ADD"};function zA(t){return t.envMap===!1?"ENVMAP_BLENDING_NONE":BA[t.combine]||"ENVMAP_BLENDING_NONE"}function HA(t){const e=t.envMapCubeUVHeight;if(e===null)return null;const n=Math.log2(e)-2,i=1/e;return{texelWidth:1/(3*Math.max(Math.pow(2,n),7*16)),texelHeight:i,maxMip:n}}function VA(t,e,n,i){const r=t.getContext(),s=n.defines;let a=n.vertexShader,o=n.fragmentShader;const l=IA(n),c=FA(n),h=kA(n),p=zA(n),f=HA(n),g=TA(n),v=bA(s),S=r.createProgram();let _,d,m=n.glslVersion?"#version "+n.glslVersion+`
`:"";n.isRawShaderMaterial?(_=["#define SHADER_TYPE "+n.shaderType,"#define SHADER_NAME "+n.shaderName,v].filter(wo).join(`
`),_.length>0&&(_+=`
`),d=["#define SHADER_TYPE "+n.shaderType,"#define SHADER_NAME "+n.shaderName,v].filter(wo).join(`
`),d.length>0&&(d+=`
`)):(_=[wg(n),"#define SHADER_TYPE "+n.shaderType,"#define SHADER_NAME "+n.shaderName,v,n.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",n.batching?"#define USE_BATCHING":"",n.batchingColor?"#define USE_BATCHING_COLOR":"",n.instancing?"#define USE_INSTANCING":"",n.instancingColor?"#define USE_INSTANCING_COLOR":"",n.instancingMorph?"#define USE_INSTANCING_MORPH":"",n.useFog&&n.fog?"#define USE_FOG":"",n.useFog&&n.fogExp2?"#define FOG_EXP2":"",n.map?"#define USE_MAP":"",n.envMap?"#define USE_ENVMAP":"",n.envMap?"#define "+h:"",n.lightMap?"#define USE_LIGHTMAP":"",n.aoMap?"#define USE_AOMAP":"",n.bumpMap?"#define USE_BUMPMAP":"",n.normalMap?"#define USE_NORMALMAP":"",n.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",n.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",n.displacementMap?"#define USE_DISPLACEMENTMAP":"",n.emissiveMap?"#define USE_EMISSIVEMAP":"",n.anisotropy?"#define USE_ANISOTROPY":"",n.anisotropyMap?"#define USE_ANISOTROPYMAP":"",n.clearcoatMap?"#define USE_CLEARCOATMAP":"",n.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",n.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",n.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",n.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",n.specularMap?"#define USE_SPECULARMAP":"",n.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",n.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",n.roughnessMap?"#define USE_ROUGHNESSMAP":"",n.metalnessMap?"#define USE_METALNESSMAP":"",n.alphaMap?"#define USE_ALPHAMAP":"",n.alphaHash?"#define USE_ALPHAHASH":"",n.transmission?"#define USE_TRANSMISSION":"",n.transmissionMap?"#define USE_TRANSMISSIONMAP":"",n.thicknessMap?"#define USE_THICKNESSMAP":"",n.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",n.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",n.mapUv?"#define MAP_UV "+n.mapUv:"",n.alphaMapUv?"#define ALPHAMAP_UV "+n.alphaMapUv:"",n.lightMapUv?"#define LIGHTMAP_UV "+n.lightMapUv:"",n.aoMapUv?"#define AOMAP_UV "+n.aoMapUv:"",n.emissiveMapUv?"#define EMISSIVEMAP_UV "+n.emissiveMapUv:"",n.bumpMapUv?"#define BUMPMAP_UV "+n.bumpMapUv:"",n.normalMapUv?"#define NORMALMAP_UV "+n.normalMapUv:"",n.displacementMapUv?"#define DISPLACEMENTMAP_UV "+n.displacementMapUv:"",n.metalnessMapUv?"#define METALNESSMAP_UV "+n.metalnessMapUv:"",n.roughnessMapUv?"#define ROUGHNESSMAP_UV "+n.roughnessMapUv:"",n.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+n.anisotropyMapUv:"",n.clearcoatMapUv?"#define CLEARCOATMAP_UV "+n.clearcoatMapUv:"",n.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+n.clearcoatNormalMapUv:"",n.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+n.clearcoatRoughnessMapUv:"",n.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+n.iridescenceMapUv:"",n.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+n.iridescenceThicknessMapUv:"",n.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+n.sheenColorMapUv:"",n.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+n.sheenRoughnessMapUv:"",n.specularMapUv?"#define SPECULARMAP_UV "+n.specularMapUv:"",n.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+n.specularColorMapUv:"",n.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+n.specularIntensityMapUv:"",n.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+n.transmissionMapUv:"",n.thicknessMapUv?"#define THICKNESSMAP_UV "+n.thicknessMapUv:"",n.vertexTangents&&n.flatShading===!1?"#define USE_TANGENT":"",n.vertexNormals?"#define HAS_NORMAL":"",n.vertexColors?"#define USE_COLOR":"",n.vertexAlphas?"#define USE_COLOR_ALPHA":"",n.vertexUv1s?"#define USE_UV1":"",n.vertexUv2s?"#define USE_UV2":"",n.vertexUv3s?"#define USE_UV3":"",n.pointsUvs?"#define USE_POINTS_UV":"",n.flatShading?"#define FLAT_SHADED":"",n.skinning?"#define USE_SKINNING":"",n.morphTargets?"#define USE_MORPHTARGETS":"",n.morphNormals&&n.flatShading===!1?"#define USE_MORPHNORMALS":"",n.morphColors?"#define USE_MORPHCOLORS":"",n.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+n.morphTextureStride:"",n.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+n.morphTargetsCount:"",n.doubleSided?"#define DOUBLE_SIDED":"",n.flipSided?"#define FLIP_SIDED":"",n.shadowMapEnabled?"#define USE_SHADOWMAP":"",n.shadowMapEnabled?"#define "+l:"",n.sizeAttenuation?"#define USE_SIZEATTENUATION":"",n.numLightProbes>0?"#define USE_LIGHT_PROBES":"",n.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",n.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(wo).join(`
`),d=[wg(n),"#define SHADER_TYPE "+n.shaderType,"#define SHADER_NAME "+n.shaderName,v,n.useFog&&n.fog?"#define USE_FOG":"",n.useFog&&n.fogExp2?"#define FOG_EXP2":"",n.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",n.map?"#define USE_MAP":"",n.matcap?"#define USE_MATCAP":"",n.envMap?"#define USE_ENVMAP":"",n.envMap?"#define "+c:"",n.envMap?"#define "+h:"",n.envMap?"#define "+p:"",f?"#define CUBEUV_TEXEL_WIDTH "+f.texelWidth:"",f?"#define CUBEUV_TEXEL_HEIGHT "+f.texelHeight:"",f?"#define CUBEUV_MAX_MIP "+f.maxMip+".0":"",n.lightMap?"#define USE_LIGHTMAP":"",n.aoMap?"#define USE_AOMAP":"",n.bumpMap?"#define USE_BUMPMAP":"",n.normalMap?"#define USE_NORMALMAP":"",n.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",n.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",n.packedNormalMap?"#define USE_PACKED_NORMALMAP":"",n.emissiveMap?"#define USE_EMISSIVEMAP":"",n.anisotropy?"#define USE_ANISOTROPY":"",n.anisotropyMap?"#define USE_ANISOTROPYMAP":"",n.clearcoat?"#define USE_CLEARCOAT":"",n.clearcoatMap?"#define USE_CLEARCOATMAP":"",n.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",n.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",n.dispersion?"#define USE_DISPERSION":"",n.retroreflection?"#define USE_RETROREFLECTION":"",n.iridescence?"#define USE_IRIDESCENCE":"",n.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",n.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",n.specularMap?"#define USE_SPECULARMAP":"",n.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",n.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",n.roughnessMap?"#define USE_ROUGHNESSMAP":"",n.metalnessMap?"#define USE_METALNESSMAP":"",n.alphaMap?"#define USE_ALPHAMAP":"",n.alphaTest?"#define USE_ALPHATEST":"",n.alphaHash?"#define USE_ALPHAHASH":"",n.sheen?"#define USE_SHEEN":"",n.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",n.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",n.transmission?"#define USE_TRANSMISSION":"",n.transmissionMap?"#define USE_TRANSMISSIONMAP":"",n.thicknessMap?"#define USE_THICKNESSMAP":"",n.vertexTangents&&n.flatShading===!1?"#define USE_TANGENT":"",n.vertexColors||n.instancingColor?"#define USE_COLOR":"",n.vertexAlphas||n.batchingColor?"#define USE_COLOR_ALPHA":"",n.vertexUv1s?"#define USE_UV1":"",n.vertexUv2s?"#define USE_UV2":"",n.vertexUv3s?"#define USE_UV3":"",n.pointsUvs?"#define USE_POINTS_UV":"",n.gradientMap?"#define USE_GRADIENTMAP":"",n.flatShading?"#define FLAT_SHADED":"",n.doubleSided?"#define DOUBLE_SIDED":"",n.flipSided?"#define FLIP_SIDED":"",n.shadowMapEnabled?"#define USE_SHADOWMAP":"",n.shadowMapEnabled?"#define "+l:"",n.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",n.numLightProbes>0?"#define USE_LIGHT_PROBES":"",n.numLightProbeGrids>0?"#define USE_LIGHT_PROBES_GRID":"",n.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",n.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",n.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",n.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",n.toneMapping!==ar?"#define TONE_MAPPING":"",n.toneMapping!==ar?tt.tonemapping_pars_fragment:"",n.toneMapping!==ar?EA("toneMapping",n.toneMapping):"",n.dithering?"#define DITHERING":"",n.opaque?"#define OPAQUE":"",tt.colorspace_pars_fragment,SA("linearToOutputTexel",n.outputColorSpace),wA(),n.useDepthPacking?"#define DEPTH_PACKING "+n.depthPacking:"",`
`].filter(wo).join(`
`)),a=Rh(a),a=Sg(a,n),a=Mg(a,n),o=Rh(o),o=Sg(o,n),o=Mg(o,n),a=Eg(a),o=Eg(o),n.isRawShaderMaterial!==!0&&(m=`#version 300 es
`,_=[g,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+_,d=["#define varying in",n.glslVersion===A0?"":"layout(location = 0) out highp vec4 pc_fragColor;",n.glslVersion===A0?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+d);const M=m+_+a,y=m+d+o,T=vg(r,r.VERTEX_SHADER,M),E=vg(r,r.FRAGMENT_SHADER,y);r.attachShader(S,T),r.attachShader(S,E),n.index0AttributeName!==void 0?r.bindAttribLocation(S,0,n.index0AttributeName):n.hasPositionAttribute===!0&&r.bindAttribLocation(S,0,"position"),r.linkProgram(S);function C(D){if(t.debug.checkShaderErrors){const O=r.getProgramInfoLog(S)||"",F=r.getShaderInfoLog(T)||"",U=r.getShaderInfoLog(E)||"",W=O.trim(),N=F.trim(),z=U.trim();let k=!0,j=!0;if(r.getProgramParameter(S,r.LINK_STATUS)===!1)if(k=!1,typeof t.debug.onShaderError=="function")t.debug.onShaderError(r,S,T,E);else{const L=yg(r,T,"vertex"),$=yg(r,E,"fragment");gt("WebGLProgram: Shader Error "+r.getError()+" - VALIDATE_STATUS "+r.getProgramParameter(S,r.VALIDATE_STATUS)+`

Material Name: `+D.name+`
Material Type: `+D.type+`

Program Info Log: `+W+`
`+L+`
`+$)}else W!==""?Ve("WebGLProgram: Program Info Log:",W):(N===""||z==="")&&(j=!1);j&&(D.diagnostics={runnable:k,programLog:W,vertexShader:{log:N,prefix:_},fragmentShader:{log:z,prefix:d}})}r.deleteShader(T),r.deleteShader(E),x=new wc(r,S),b=AA(r,S)}let x;this.getUniforms=function(){return x===void 0&&C(this),x};let b;this.getAttributes=function(){return b===void 0&&C(this),b};let P=n.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return P===!1&&(P=r.getProgramParameter(S,_A)),P},this.destroy=function(){i.releaseStatesOfProgram(this),r.deleteProgram(S),this.program=void 0},this.type=n.shaderType,this.name=n.shaderName,this.id=vA++,this.cacheKey=e,this.usedTimes=1,this.program=S,this.vertexShader=T,this.fragmentShader=E,this}let GA=0;class jA{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(e,n,i){const r=this._getShaderCacheForMaterial(e);return r.has(n)===!1&&(r.add(n),n.usedTimes++),r.has(i)===!1&&(r.add(i),i.usedTimes++),this}remove(e){const n=this.materialCache.get(e);for(const i of n)i.usedTimes--,i.usedTimes===0&&this.shaderCache.delete(i.code);return this.materialCache.delete(e),this}getVertexShaderStage(e){return this._getShaderStage(e.vertexShader)}getFragmentShaderStage(e){return this._getShaderStage(e.fragmentShader)}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(e){const n=this.materialCache;let i=n.get(e);return i===void 0&&(i=new Set,n.set(e,i)),i}_getShaderStage(e){const n=this.shaderCache;let i=n.get(e);return i===void 0&&(i=new WA(e),n.set(e,i)),i}}class WA{constructor(e){this.id=GA++,this.code=e,this.usedTimes=0}}function XA(t){return t===Bs||t===Zc||t===Qc}function $A(t,e,n,i,r,s){const a=new Bp,o=new jA,l=new Set,c=[],h=new Map,p=i.logarithmicDepthBuffer;let f=i.precision;const g={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distance",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function v(x){return l.add(x),x===0?"uv":`uv${x}`}function S(x,b,P,D,O,F){const U=D.fog,W=O.geometry,N=x.isMeshStandardMaterial||x.isMeshLambertMaterial||x.isMeshPhongMaterial?D.environment:null,z=x.isMeshStandardMaterial||x.isMeshLambertMaterial&&!x.envMap||x.isMeshPhongMaterial&&!x.envMap,k=e.get(x.envMap||N,z),j=k&&k.mapping===wu?k.image.height:null,L=g[x.type];x.precision!==null&&(f=i.getMaxPrecision(x.precision),f!==x.precision&&Ve("WebGLProgram.getParameters:",x.precision,"not supported, using",f,"instead."));const $=W.morphAttributes.position||W.morphAttributes.normal||W.morphAttributes.color,de=$!==void 0?$.length:0;let we=0;W.morphAttributes.position!==void 0&&(we=1),W.morphAttributes.normal!==void 0&&(we=2),W.morphAttributes.color!==void 0&&(we=3);let Ke,$e,Ze,Q;if(L){const pt=Qi[L];Ke=pt.vertexShader,$e=pt.fragmentShader}else{Ke=x.vertexShader,$e=x.fragmentShader;const pt=o.getVertexShaderStage(x),nt=o.getFragmentShaderStage(x);o.update(x,pt,nt),Ze=pt.id,Q=nt.id}const ee=t.getRenderTarget(),Ne=t.state.buffers.depth.getReversed(),je=O.isInstancedMesh===!0,Re=O.isBatchedMesh===!0,Qe=!!x.map,ze=!!x.matcap,et=!!k,ot=!!x.aoMap,yt=!!x.lightMap,rt=!!x.bumpMap&&x.wireframe===!1,Pt=!!x.normalMap,Bt=!!x.displacementMap,pn=!!x.emissiveMap,Ct=!!x.metalnessMap,zt=!!x.roughnessMap,V=x.anisotropy>0,Yt=x.clearcoat>0,ht=x.dispersion>0,R=x.retroreflectivity>0,w=x.iridescence>0,X=x.sheen>0,K=x.transmission>0,ie=V&&!!x.anisotropyMap,fe=Yt&&!!x.clearcoatMap,_e=Yt&&!!x.clearcoatNormalMap,re=Yt&&!!x.clearcoatRoughnessMap,oe=w&&!!x.iridescenceMap,he=w&&!!x.iridescenceThicknessMap,Fe=X&&!!x.sheenColorMap,xe=X&&!!x.sheenRoughnessMap,me=!!x.specularMap,Oe=!!x.specularColorMap,ke=!!x.specularIntensityMap,qe=K&&!!x.transmissionMap,H=K&&!!x.thicknessMap,ve=!!x.gradientMap,te=!!x.alphaMap,ge=x.alphaTest>0,Se=!!x.alphaHash,ae=!!x.extensions;let ye=ar;x.toneMapped&&(ee===null||ee.isXRRenderTarget===!0)&&(ye=t.toneMapping);const Ie={shaderID:L,shaderType:x.type,shaderName:x.name,vertexShader:Ke,fragmentShader:$e,defines:x.defines,customVertexShaderID:Ze,customFragmentShaderID:Q,isRawShaderMaterial:x.isRawShaderMaterial===!0,glslVersion:x.glslVersion,precision:f,batching:Re,batchingColor:Re&&O._colorsTexture!==null,instancing:je,instancingColor:je&&O.instanceColor!==null,instancingMorph:je&&O.morphTexture!==null,outputColorSpace:ee===null?t.outputColorSpace:ee.isXRRenderTarget===!0?ee.texture.colorSpace:ft.workingColorSpace,alphaToCoverage:!!x.alphaToCoverage,map:Qe,matcap:ze,envMap:et,envMapMode:et&&k.mapping,envMapCubeUVHeight:j,aoMap:ot,lightMap:yt,bumpMap:rt,normalMap:Pt,displacementMap:Bt,emissiveMap:pn,normalMapObjectSpace:Pt&&x.normalMapType===vE,normalMapTangentSpace:Pt&&x.normalMapType===wh,packedNormalMap:Pt&&x.normalMapType===wh&&XA(x.normalMap.format),metalnessMap:Ct,roughnessMap:zt,anisotropy:V,anisotropyMap:ie,clearcoat:Yt,clearcoatMap:fe,clearcoatNormalMap:_e,clearcoatRoughnessMap:re,dispersion:ht,retroreflection:R,iridescence:w,iridescenceMap:oe,iridescenceThicknessMap:he,sheen:X,sheenColorMap:Fe,sheenRoughnessMap:xe,specularMap:me,specularColorMap:Oe,specularIntensityMap:ke,transmission:K,transmissionMap:qe,thicknessMap:H,gradientMap:ve,opaque:x.transparent===!1&&x.blending===Fo&&x.alphaToCoverage===!1,alphaMap:te,alphaTest:ge,alphaHash:Se,combine:x.combine,mapUv:Qe&&v(x.map.channel),aoMapUv:ot&&v(x.aoMap.channel),lightMapUv:yt&&v(x.lightMap.channel),bumpMapUv:rt&&v(x.bumpMap.channel),normalMapUv:Pt&&v(x.normalMap.channel),displacementMapUv:Bt&&v(x.displacementMap.channel),emissiveMapUv:pn&&v(x.emissiveMap.channel),metalnessMapUv:Ct&&v(x.metalnessMap.channel),roughnessMapUv:zt&&v(x.roughnessMap.channel),anisotropyMapUv:ie&&v(x.anisotropyMap.channel),clearcoatMapUv:fe&&v(x.clearcoatMap.channel),clearcoatNormalMapUv:_e&&v(x.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:re&&v(x.clearcoatRoughnessMap.channel),iridescenceMapUv:oe&&v(x.iridescenceMap.channel),iridescenceThicknessMapUv:he&&v(x.iridescenceThicknessMap.channel),sheenColorMapUv:Fe&&v(x.sheenColorMap.channel),sheenRoughnessMapUv:xe&&v(x.sheenRoughnessMap.channel),specularMapUv:me&&v(x.specularMap.channel),specularColorMapUv:Oe&&v(x.specularColorMap.channel),specularIntensityMapUv:ke&&v(x.specularIntensityMap.channel),transmissionMapUv:qe&&v(x.transmissionMap.channel),thicknessMapUv:H&&v(x.thicknessMap.channel),alphaMapUv:te&&v(x.alphaMap.channel),vertexTangents:!!W.attributes.tangent&&(Pt||V),vertexNormals:!!W.attributes.normal,vertexColors:x.vertexColors,vertexAlphas:x.vertexColors===!0&&!!W.attributes.color&&W.attributes.color.itemSize===4,pointsUvs:O.isPoints===!0&&!!W.attributes.uv&&(Qe||te),fog:!!U,useFog:x.fog===!0,fogExp2:!!U&&U.isFogExp2,flatShading:x.wireframe===!1&&(x.flatShading===!0||W.attributes.normal===void 0&&Pt===!1&&(x.isMeshLambertMaterial||x.isMeshPhongMaterial||x.isMeshStandardMaterial||x.isMeshPhysicalMaterial)),sizeAttenuation:x.sizeAttenuation===!0,logarithmicDepthBuffer:p,reversedDepthBuffer:Ne,skinning:O.isSkinnedMesh===!0,hasPositionAttribute:W.attributes.position!==void 0,morphTargets:W.morphAttributes.position!==void 0,morphNormals:W.morphAttributes.normal!==void 0,morphColors:W.morphAttributes.color!==void 0,morphTargetsCount:de,morphTextureStride:we,numSunLights:b.sun.length,numDirLights:b.directional.length,numPointLights:b.point.length,numSpotLights:b.spot.length,numSpotLightMaps:b.spotLightMap.length,numRectAreaLights:b.rectArea.length,numHemiLights:b.hemi.length,numSunLightShadows:b.sunShadowMap.length,numDirLightShadows:b.directionalShadowMap.length,numPointLightShadows:b.pointShadowMap.length,numSpotLightShadows:b.spotShadowMap.length,numSpotLightShadowsWithMaps:b.numSpotLightShadowsWithMaps,numLightProbes:b.numLightProbes,numLightProbeGrids:F.length,numClippingPlanes:s.numPlanes,numClipIntersection:s.numIntersection,dithering:x.dithering,shadowMapEnabled:t.shadowMap.enabled&&P.length>0,shadowMapType:t.shadowMap.type,toneMapping:ye,decodeVideoTexture:Qe&&x.map.isVideoTexture===!0&&ft.getTransfer(x.map.colorSpace)===Tt,decodeVideoTextureEmissive:pn&&x.emissiveMap.isVideoTexture===!0&&ft.getTransfer(x.emissiveMap.colorSpace)===Tt,premultipliedAlpha:x.premultipliedAlpha,doubleSided:x.side===jn,flipSided:x.side===Yn,useDepthPacking:x.depthPacking>=0,depthPacking:x.depthPacking||0,index0AttributeName:x.index0AttributeName,extensionClipCullDistance:ae&&x.extensions.clipCullDistance===!0&&n.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(ae&&x.extensions.multiDraw===!0||Re)&&n.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:n.has("KHR_parallel_shader_compile"),customProgramCacheKey:x.customProgramCacheKey()};return Ie.vertexUv1s=l.has(1),Ie.vertexUv2s=l.has(2),Ie.vertexUv3s=l.has(3),l.clear(),Ie}function _(x){const b=[];if(x.shaderID?b.push(x.shaderID):(b.push(x.customVertexShaderID),b.push(x.customFragmentShaderID)),x.defines!==void 0)for(const P in x.defines)b.push(P),b.push(x.defines[P]);return x.isRawShaderMaterial===!1&&(d(b,x),m(b,x),b.push(t.outputColorSpace)),b.push(x.customProgramCacheKey),b.join()}function d(x,b){x.push(b.precision),x.push(b.outputColorSpace),x.push(b.envMapMode),x.push(b.envMapCubeUVHeight),x.push(b.mapUv),x.push(b.alphaMapUv),x.push(b.lightMapUv),x.push(b.aoMapUv),x.push(b.bumpMapUv),x.push(b.normalMapUv),x.push(b.displacementMapUv),x.push(b.emissiveMapUv),x.push(b.metalnessMapUv),x.push(b.roughnessMapUv),x.push(b.anisotropyMapUv),x.push(b.clearcoatMapUv),x.push(b.clearcoatNormalMapUv),x.push(b.clearcoatRoughnessMapUv),x.push(b.iridescenceMapUv),x.push(b.iridescenceThicknessMapUv),x.push(b.sheenColorMapUv),x.push(b.sheenRoughnessMapUv),x.push(b.specularMapUv),x.push(b.specularColorMapUv),x.push(b.specularIntensityMapUv),x.push(b.transmissionMapUv),x.push(b.thicknessMapUv),x.push(b.combine),x.push(b.fogExp2),x.push(b.sizeAttenuation),x.push(b.morphTargetsCount),x.push(b.morphAttributeCount),x.push(b.numSunLights),x.push(b.numDirLights),x.push(b.numPointLights),x.push(b.numSpotLights),x.push(b.numSpotLightMaps),x.push(b.numHemiLights),x.push(b.numRectAreaLights),x.push(b.numSunLightShadows),x.push(b.numDirLightShadows),x.push(b.numPointLightShadows),x.push(b.numSpotLightShadows),x.push(b.numSpotLightShadowsWithMaps),x.push(b.numLightProbes),x.push(b.shadowMapType),x.push(b.toneMapping),x.push(b.numClippingPlanes),x.push(b.numClipIntersection),x.push(b.depthPacking)}function m(x,b){a.disableAll(),b.instancing&&a.enable(0),b.instancingColor&&a.enable(1),b.instancingMorph&&a.enable(2),b.matcap&&a.enable(3),b.envMap&&a.enable(4),b.normalMapObjectSpace&&a.enable(5),b.normalMapTangentSpace&&a.enable(6),b.clearcoat&&a.enable(7),b.iridescence&&a.enable(8),b.alphaTest&&a.enable(9),b.vertexColors&&a.enable(10),b.vertexAlphas&&a.enable(11),b.vertexUv1s&&a.enable(12),b.vertexUv2s&&a.enable(13),b.vertexUv3s&&a.enable(14),b.vertexTangents&&a.enable(15),b.anisotropy&&a.enable(16),b.alphaHash&&a.enable(17),b.batching&&a.enable(18),b.dispersion&&a.enable(19),b.retroreflection&&a.enable(24),b.batchingColor&&a.enable(20),b.gradientMap&&a.enable(21),b.packedNormalMap&&a.enable(22),b.vertexNormals&&a.enable(23),x.push(a.mask),a.disableAll(),b.fog&&a.enable(0),b.useFog&&a.enable(1),b.flatShading&&a.enable(2),b.logarithmicDepthBuffer&&a.enable(3),b.reversedDepthBuffer&&a.enable(4),b.skinning&&a.enable(5),b.morphTargets&&a.enable(6),b.morphNormals&&a.enable(7),b.morphColors&&a.enable(8),b.premultipliedAlpha&&a.enable(9),b.shadowMapEnabled&&a.enable(10),b.doubleSided&&a.enable(11),b.flipSided&&a.enable(12),b.useDepthPacking&&a.enable(13),b.dithering&&a.enable(14),b.transmission&&a.enable(15),b.sheen&&a.enable(16),b.opaque&&a.enable(17),b.pointsUvs&&a.enable(18),b.decodeVideoTexture&&a.enable(19),b.decodeVideoTextureEmissive&&a.enable(20),b.alphaToCoverage&&a.enable(21),b.numLightProbeGrids>0&&a.enable(22),b.hasPositionAttribute&&a.enable(23),x.push(a.mask)}function M(x){const b=g[x.type];let P;if(b){const D=Qi[b];P=ow.clone(D.uniforms)}else P=x.uniforms;return P}function y(x,b){let P=h.get(b);return P!==void 0?++P.usedTimes:(P=new VA(t,b,x,r),c.push(P),h.set(b,P)),P}function T(x){if(--x.usedTimes===0){const b=c.indexOf(x);c[b]=c[c.length-1],c.pop(),h.delete(x.cacheKey),x.destroy()}}function E(x){o.remove(x)}function C(){o.dispose()}return{getParameters:S,getProgramCacheKey:_,getUniforms:M,acquireProgram:y,releaseProgram:T,releaseShaderCache:E,programs:c,dispose:C}}function qA(){let t=new WeakMap;function e(a){return t.has(a)}function n(a){let o=t.get(a);return o===void 0&&(o={},t.set(a,o)),o}function i(a){t.delete(a)}function r(a,o,l){t.get(a)[o]=l}function s(){t=new WeakMap}return{has:e,get:n,remove:i,update:r,dispose:s}}function YA(t,e){return t.groupOrder!==e.groupOrder?t.groupOrder-e.groupOrder:t.renderOrder!==e.renderOrder?t.renderOrder-e.renderOrder:t.material.id!==e.material.id?t.material.id-e.material.id:t.materialVariant!==e.materialVariant?t.materialVariant-e.materialVariant:t.z!==e.z?t.z-e.z:t.id-e.id}function Tg(t,e){return t.groupOrder!==e.groupOrder?t.groupOrder-e.groupOrder:t.renderOrder!==e.renderOrder?t.renderOrder-e.renderOrder:t.z!==e.z?e.z-t.z:t.id-e.id}function bg(){const t=[];let e=0;const n=[],i=[],r=[];function s(){e=0,n.length=0,i.length=0,r.length=0}function a(f){let g=0;return f.isInstancedMesh&&(g+=2),f.isSkinnedMesh&&(g+=1),g}function o(f,g,v,S,_,d){let m=t[e];return m===void 0?(m={id:f.id,object:f,geometry:g,material:v,materialVariant:a(f),groupOrder:S,renderOrder:f.renderOrder,z:_,group:d},t[e]=m):(m.id=f.id,m.object=f,m.geometry=g,m.material=v,m.materialVariant=a(f),m.groupOrder=S,m.renderOrder=f.renderOrder,m.z=_,m.group=d),e++,m}function l(f,g,v,S,_,d,m){m.reversedDepth===!0&&(_=-_);const M=o(f,g,v,S,_,d);v.transmission>0?i.push(M):v.transparent===!0?r.push(M):n.push(M)}function c(f,g,v,S,_,d){const m=o(f,g,v,S,_,d);v.transmission>0?i.unshift(m):v.transparent===!0?r.unshift(m):n.unshift(m)}function h(f,g){n.length>1&&n.sort(f||YA),i.length>1&&i.sort(g||Tg),r.length>1&&r.sort(g||Tg)}function p(){for(let f=e,g=t.length;f<g;f++){const v=t[f];if(v.id===null)break;v.id=null,v.object=null,v.geometry=null,v.material=null,v.group=null}}return{opaque:n,transmissive:i,transparent:r,init:s,push:l,unshift:c,finish:p,sort:h}}function KA(){let t=new WeakMap;function e(i,r){const s=t.get(i);let a;return s===void 0?(a=new bg,t.set(i,[a])):r>=s.length?(a=new bg,s.push(a)):a=s[r],a}function n(){t=new WeakMap}return{get:e,dispose:n}}function ZA(){const t={};return{get:function(e){if(t[e.id]!==void 0)return t[e.id];let n;switch(e.type){case"SunLight":case"DirectionalLight":n={direction:new I,color:new ct};break;case"SpotLight":n={position:new I,direction:new I,color:new ct,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":n={position:new I,color:new ct,distance:0,decay:0};break;case"HemisphereLight":n={direction:new I,skyColor:new ct,groundColor:new ct};break;case"RectAreaLight":n={color:new ct,position:new I,halfWidth:new I,halfHeight:new I};break}return t[e.id]=n,n}}}function QA(){const t={};return{get:function(e){if(t[e.id]!==void 0)return t[e.id];let n;switch(e.type){case"SunLight":case"DirectionalLight":n={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new We};break;case"SpotLight":n={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new We};break;case"PointLight":n={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new We,shadowCameraNear:1,shadowCameraFar:1e3};break}return t[e.id]=n,n}}}let JA=0;function eC(t,e){return(e.castShadow?2:0)-(t.castShadow?2:0)+(e.map?1:0)-(t.map?1:0)}function tC(t){const e=new ZA,n=QA(),i={version:0,hash:{sunLength:-1,directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numSunShadows:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],sun:[],sunShadow:[],sunShadowMap:[],sunShadowMatrix:[],sunShadowCascade:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let c=0;c<9;c++)i.probe.push(new I);const r=new I,s=new kt,a=new kt;function o(c){let h=0,p=0,f=0;for(let O=0;O<9;O++)i.probe[O].set(0,0,0);let g=0,v=0,S=0,_=0,d=0,m=0,M=0,y=0,T=0,E=0,C=0,x=0,b=0,P=0;c.sort(eC);for(let O=0,F=c.length;O<F;O++){const U=c[O],W=U.color,N=U.intensity,z=U.distance;let k=null;if(U.shadow&&U.shadow.map&&(U.shadow.map.texture.format===Bs?k=U.shadow.map.texture:k=U.shadow.map.depthTexture||U.shadow.map.texture),U.isAmbientLight)h+=W.r*N,p+=W.g*N,f+=W.b*N;else if(U.isLightProbe){for(let j=0;j<9;j++)i.probe[j].addScaledVector(U.sh.coefficients[j],N);P++}else if(U.isSunLight){const j=e.get(U);if(j.color.copy(U.color).multiplyScalar(U.intensity),U.castShadow){const L=U.shadow,$=n.get(U);$.shadowIntensity=L.intensity,$.shadowBias=L.bias,$.shadowNormalBias=L.normalBias,$.shadowRadius=L.radius,$.shadowMapSize.copy(L.mapSize).multiply(L.getFrameExtents()),i.sunShadow[v]=$,i.sunShadowMap[v]=k;const de=L.getViewportCount();for(let we=0;we<de;we++)i.sunShadowMatrix[S+we]=L.getMatrix(we),i.sunShadowCascade[S+we]=L._cascadeData[we];S+=de,v++}i.sun[g]=j,g++}else if(U.isDirectionalLight){const j=e.get(U);if(j.color.copy(U.color).multiplyScalar(U.intensity),U.castShadow){const L=U.shadow,$=n.get(U);$.shadowIntensity=L.intensity,$.shadowBias=L.bias,$.shadowNormalBias=L.normalBias,$.shadowRadius=L.radius,$.shadowMapSize=L.mapSize,i.directionalShadow[_]=$,i.directionalShadowMap[_]=k,i.directionalShadowMatrix[_]=U.shadow.matrix,T++}i.directional[_]=j,_++}else if(U.isSpotLight){const j=e.get(U);j.position.setFromMatrixPosition(U.matrixWorld),j.color.copy(W).multiplyScalar(N),j.distance=z,j.coneCos=Math.cos(U.angle),j.penumbraCos=Math.cos(U.angle*(1-U.penumbra)),j.decay=U.decay,i.spot[m]=j;const L=U.shadow;if(U.map&&(i.spotLightMap[x]=U.map,x++,L.updateMatrices(U),U.castShadow&&b++),i.spotLightMatrix[m]=L.matrix,U.castShadow){const $=n.get(U);$.shadowIntensity=L.intensity,$.shadowBias=L.bias,$.shadowNormalBias=L.normalBias,$.shadowRadius=L.radius,$.shadowMapSize=L.mapSize,i.spotShadow[m]=$,i.spotShadowMap[m]=k,C++}m++}else if(U.isRectAreaLight){const j=e.get(U);j.color.copy(W).multiplyScalar(N),j.halfWidth.set(U.width*.5,0,0),j.halfHeight.set(0,U.height*.5,0),i.rectArea[M]=j,M++}else if(U.isPointLight){const j=e.get(U);if(j.color.copy(U.color).multiplyScalar(U.intensity),j.distance=U.distance,j.decay=U.decay,U.castShadow){const L=U.shadow,$=n.get(U);$.shadowIntensity=L.intensity,$.shadowBias=L.bias,$.shadowNormalBias=L.normalBias,$.shadowRadius=L.radius,$.shadowMapSize=L.mapSize,$.shadowCameraNear=L.camera.near,$.shadowCameraFar=L.camera.far,i.pointShadow[d]=$,i.pointShadowMap[d]=k,i.pointShadowMatrix[d]=U.shadow.matrix,E++}i.point[d]=j,d++}else if(U.isHemisphereLight){const j=e.get(U);j.skyColor.copy(U.color).multiplyScalar(N),j.groundColor.copy(U.groundColor).multiplyScalar(N),i.hemi[y]=j,y++}}M>0&&(t.has("OES_texture_float_linear")===!0?(i.rectAreaLTC1=Ee.LTC_FLOAT_1,i.rectAreaLTC2=Ee.LTC_FLOAT_2):(i.rectAreaLTC1=Ee.LTC_HALF_1,i.rectAreaLTC2=Ee.LTC_HALF_2)),i.ambient[0]=h,i.ambient[1]=p,i.ambient[2]=f;const D=i.hash;(D.sunLength!==g||D.directionalLength!==_||D.pointLength!==d||D.spotLength!==m||D.rectAreaLength!==M||D.hemiLength!==y||D.numSunShadows!==v||D.numDirectionalShadows!==T||D.numPointShadows!==E||D.numSpotShadows!==C||D.numSpotMaps!==x||D.numLightProbes!==P)&&(i.sun.length=g,i.directional.length=_,i.spot.length=m,i.rectArea.length=M,i.point.length=d,i.hemi.length=y,i.sunShadow.length=v,i.sunShadowMap.length=v,i.sunShadowMatrix.length=S,i.sunShadowCascade.length=S,i.directionalShadow.length=T,i.directionalShadowMap.length=T,i.directionalShadowMatrix.length=T,i.pointShadow.length=E,i.pointShadowMap.length=E,i.pointShadowMatrix.length=E,i.spotShadow.length=C,i.spotShadowMap.length=C,i.spotLightMatrix.length=C+x-b,i.spotLightMap.length=x,i.numSpotLightShadowsWithMaps=b,i.numLightProbes=P,D.sunLength=g,D.directionalLength=_,D.pointLength=d,D.spotLength=m,D.rectAreaLength=M,D.hemiLength=y,D.numSunShadows=v,D.numDirectionalShadows=T,D.numPointShadows=E,D.numSpotShadows=C,D.numSpotMaps=x,D.numLightProbes=P,i.version=JA++)}function l(c,h){let p=0,f=0,g=0,v=0,S=0,_=0;const d=h.matrixWorldInverse;for(let m=0,M=c.length;m<M;m++){const y=c[m];if(y.isSunLight){const T=i.sun[p];T.direction.setFromMatrixPosition(y.matrixWorld),T.direction.transformDirection(d),p++}else if(y.isDirectionalLight){const T=i.directional[f];T.direction.setFromMatrixPosition(y.matrixWorld),r.setFromMatrixPosition(y.target.matrixWorld),T.direction.sub(r),T.direction.transformDirection(d),f++}else if(y.isSpotLight){const T=i.spot[v];T.position.setFromMatrixPosition(y.matrixWorld),T.position.applyMatrix4(d),T.direction.setFromMatrixPosition(y.matrixWorld),r.setFromMatrixPosition(y.target.matrixWorld),T.direction.sub(r),T.direction.transformDirection(d),v++}else if(y.isRectAreaLight){const T=i.rectArea[S];T.position.setFromMatrixPosition(y.matrixWorld),T.position.applyMatrix4(d),a.identity(),s.copy(y.matrixWorld),s.premultiply(d),a.extractRotation(s),T.halfWidth.set(y.width*.5,0,0),T.halfHeight.set(0,y.height*.5,0),T.halfWidth.applyMatrix4(a),T.halfHeight.applyMatrix4(a),S++}else if(y.isPointLight){const T=i.point[g];T.position.setFromMatrixPosition(y.matrixWorld),T.position.applyMatrix4(d),g++}else if(y.isHemisphereLight){const T=i.hemi[_];T.direction.setFromMatrixPosition(y.matrixWorld),T.direction.transformDirection(d),_++}}}return{setup:o,setupView:l,state:i}}function Ag(t){const e=new tC(t),n=[],i=[],r=[];function s(f){p.camera=f,n.length=0,i.length=0,r.length=0}function a(f){n.push(f)}function o(f){i.push(f)}function l(f){r.push(f)}function c(){e.setup(n)}function h(f){e.setupView(n,f)}const p={lightsArray:n,shadowsArray:i,lightProbeGridArray:r,camera:null,lights:e,transmissionRenderTarget:{},textureUnits:0};return{init:s,state:p,setupLights:c,setupLightsView:h,pushLight:a,pushShadow:o,pushLightProbeGrid:l}}function nC(t){let e=new WeakMap;function n(r,s=0){const a=e.get(r);let o;return a===void 0?(o=new Ag(t),e.set(r,[o])):s>=a.length?(o=new Ag(t),a.push(o)):o=a[s],o}function i(){e=new WeakMap}return{get:n,dispose:i}}const iC=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,rC=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ).rg;
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ).r;
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( max( 0.0, squared_mean - mean * mean ) );
	gl_FragColor = vec4( mean, std_dev, 0.0, 1.0 );
}`,sC=[new I(1,0,0),new I(-1,0,0),new I(0,1,0),new I(0,-1,0),new I(0,0,1),new I(0,0,-1)],aC=[new I(0,-1,0),new I(0,-1,0),new I(0,0,1),new I(0,0,-1),new I(0,-1,0),new I(0,-1,0)],Cg=new kt,vo=new I,Vd=new I;function oC(t,e,n){let i=new Hp;const r=new We,s=new We,a=new Gt,o=new dw,l=new fw,c={},h=n.maxTextureSize,p={[Os]:Yn,[Yn]:Os,[jn]:jn},f=new cr({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new We},radius:{value:4}},vertexShader:iC,fragmentShader:rC}),g=f.clone();g.defines.HORIZONTAL_PASS=1;const v=new Rn;v.setAttribute("position",new vi(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));const S=new Be(v,f),_=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=Uo;let d=this.type;this.render=function(E,C,x){if(_.enabled===!1||_.autoUpdate===!1&&_.needsUpdate===!1||E.length===0)return;this.type===YM&&(Ve("WebGLShadowMap: PCFSoftShadowMap has been removed. Using PCFShadowMap instead."),this.type=Uo);const b=t.getRenderTarget(),P=t.getActiveCubeFace(),D=t.getActiveMipmapLevel(),O=t.state;O.setBlending(br),O.buffers.depth.getReversed()===!0?O.buffers.color.setClear(0,0,0,0):O.buffers.color.setClear(1,1,1,1),O.buffers.depth.setTest(!0),O.setScissorTest(!1);const F=d!==this.type;F&&C.traverse(function(U){U.material&&(Array.isArray(U.material)?U.material.forEach(W=>W.needsUpdate=!0):U.material.needsUpdate=!0)});for(let U=0,W=E.length;U<W;U++){const N=E[U],z=N.shadow;if(z===void 0){Ve("WebGLShadowMap:",N,"has no shadow.");continue}if(z.autoUpdate===!1&&z.needsUpdate===!1)continue;r.copy(z.mapSize);const k=z.getFrameExtents();r.multiply(k),s.copy(z.mapSize),(r.x>h||r.y>h)&&(r.x>h&&(s.x=Math.floor(h/k.x),r.x=s.x*k.x,z.mapSize.x=s.x),r.y>h&&(s.y=Math.floor(h/k.y),r.y=s.y*k.y,z.mapSize.y=s.y));const j=t.state.buffers.depth.getReversed();if(z.camera._reversedDepth=j,z.map===null||F===!0){if(z.map!==null&&(z.map.depthTexture!==null&&(z.map.depthTexture.dispose(),z.map.depthTexture=null),z.map.dispose()),this.type===Eo){if(N.isPointLight){Ve("WebGLShadowMap: VSM shadow maps are not supported for PointLights. Use PCF or BasicShadowMap instead.");continue}z.map=new ki(r.x,r.y,{format:Bs,type:lr,minFilter:bn,magFilter:bn,generateMipmaps:!1}),z.map.texture.name=N.name+".shadowMap",z.map.depthTexture=new sl(r.x,r.y,nr),z.map.depthTexture.name=N.name+".shadowMapDepth",z.map.depthTexture.format=Lr,z.map.depthTexture.compareFunction=null,z.map.depthTexture.minFilter=gn,z.map.depthTexture.magFilter=gn}else N.isPointLight?(z.map=new Ox(r.x),z.map.depthTexture=new rw(r.x,or)):(z.map=new ki(r.x,r.y),z.map.depthTexture=new sl(r.x,r.y,or)),z.map.depthTexture.name=N.name+".shadowMap",z.map.depthTexture.format=Lr,this.type===Uo?(z.map.depthTexture.compareFunction=j?Op:Fp,z.map.depthTexture.minFilter=bn,z.map.depthTexture.magFilter=bn):(z.map.depthTexture.compareFunction=null,z.map.depthTexture.minFilter=gn,z.map.depthTexture.magFilter=gn);z.camera.updateProjectionMatrix()}z.map.isWebGLCubeRenderTarget!==!0&&(z.map.width!==r.x||z.map.height!==r.y)&&z.map.setSize(r.x,r.y);const L=z.map.isWebGLCubeRenderTarget?6:z.getViewportCount();N.isPointLight!==!0&&z.updateMatrices(N,x);for(let $=0;$<L;$++){const de=z.getCamera($);if(N.isPointLight){const we=z.camera,Ke=z.matrix,$e=N.distance||we.far;$e!==we.far&&(we.far=$e,we.updateProjectionMatrix()),vo.setFromMatrixPosition(N.matrixWorld),we.position.copy(vo),Vd.copy(we.position),Vd.add(sC[$]),we.up.copy(aC[$]),we.lookAt(Vd),we.updateMatrixWorld(),Ke.makeTranslation(-vo.x,-vo.y,-vo.z),Cg.multiplyMatrices(we.projectionMatrix,we.matrixWorldInverse),z._frustum.setFromProjectionMatrix(Cg,we.coordinateSystem,we.reversedDepth)}if(z.map.isWebGLCubeRenderTarget)t.setRenderTarget(z.map,$),t.clear();else{$===0&&(t.setRenderTarget(z.map),t.clear());const we=z.getViewport($);a.set(s.x*we.x,s.y*we.y,s.x*we.z,s.y*we.w),O.viewport(a)}i=z.getFrustum($),y(C,x,de,N,this.type)}z.isPointLightShadow!==!0&&this.type===Eo&&m(z,x),z.needsUpdate=!1}d=this.type,_.needsUpdate=!1,t.setRenderTarget(b,P,D)};function m(E,C){const x=e.update(S);f.defines.VSM_SAMPLES!==E.blurSamples&&(f.defines.VSM_SAMPLES=E.blurSamples,g.defines.VSM_SAMPLES=E.blurSamples,f.needsUpdate=!0,g.needsUpdate=!0),E.mapPass===null?E.mapPass=new ki(r.x,r.y,{format:Bs,type:lr}):(E.mapPass.width!==E.map.width||E.mapPass.height!==E.map.height)&&E.mapPass.setSize(E.map.width,E.map.height),f.uniforms.shadow_pass.value=E.map.depthTexture,f.uniforms.resolution.value.set(E.map.width,E.map.height),f.uniforms.radius.value=E.radius,t.setRenderTarget(E.mapPass),t.clear(),t.renderBufferDirect(C,null,x,f,S,null),g.uniforms.shadow_pass.value=E.mapPass.texture,g.uniforms.resolution.value.set(E.map.width,E.map.height),g.uniforms.radius.value=E.radius,t.setRenderTarget(E.map),t.clear(),t.renderBufferDirect(C,null,x,g,S,null)}function M(E,C,x,b){let P=null;const D=x.isPointLight===!0?E.customDistanceMaterial:E.customDepthMaterial;if(D!==void 0)P=D;else if(P=x.isPointLight===!0?l:o,t.localClippingEnabled&&C.clipShadows===!0&&Array.isArray(C.clippingPlanes)&&C.clippingPlanes.length!==0||C.displacementMap&&C.displacementScale!==0||C.alphaMap&&C.alphaTest>0||C.map&&C.alphaTest>0||C.alphaToCoverage===!0){const O=P.uuid,F=C.uuid;let U=c[O];U===void 0&&(U={},c[O]=U);let W=U[F];W===void 0&&(W=P.clone(),U[F]=W,C.addEventListener("dispose",T)),P=W}if(P.visible=C.visible,P.wireframe=C.wireframe,b===Eo?P.side=C.shadowSide!==null?C.shadowSide:C.side:P.side=C.shadowSide!==null?C.shadowSide:p[C.side],P.alphaMap=C.alphaMap,P.alphaTest=C.alphaToCoverage===!0?.5:C.alphaTest,P.map=C.map,P.clipShadows=C.clipShadows,P.clippingPlanes=C.clippingPlanes,P.clipIntersection=C.clipIntersection,P.displacementMap=C.displacementMap,P.displacementScale=C.displacementScale,P.displacementBias=C.displacementBias,P.wireframeLinewidth=C.wireframeLinewidth,P.linewidth=C.linewidth,x.isPointLight===!0&&P.isMeshDistanceMaterial===!0){const O=t.properties.get(P);O.light=x}return P}function y(E,C,x,b,P){if(E.visible===!1)return;if(E.layers.test(C.layers)&&(E.isMesh||E.isLine||E.isPoints)&&(E.castShadow||E.receiveShadow&&P===Eo)&&(!E.frustumCulled||E.intersectsFrustum(i))){E.modelViewMatrix.multiplyMatrices(x.matrixWorldInverse,E.matrixWorld);const F=e.update(E),U=E.material;if(Array.isArray(U)){const W=F.groups;for(let N=0,z=W.length;N<z;N++){const k=W[N],j=U[k.materialIndex];if(j&&j.visible){const L=M(E,j,b,P);E.onBeforeShadow(t,E,C,x,F,L,k),t.renderBufferDirect(x,null,F,L,E,k),E.onAfterShadow(t,E,C,x,F,L,k)}}}else if(U.visible){const W=M(E,U,b,P);E.onBeforeShadow(t,E,C,x,F,W,null),t.renderBufferDirect(x,null,F,W,E,null),E.onAfterShadow(t,E,C,x,F,W,null)}}const O=E.children;for(let F=0,U=O.length;F<U;F++)y(O[F],C,x,b,P)}function T(E){E.target.removeEventListener("dispose",T);for(const x in c){const b=c[x],P=E.target.uuid;P in b&&(b[P].dispose(),delete b[P])}}}function lC(t,e){function n(){let H=!1;const ve=new Gt;let te=null;const ge=new Gt(0,0,0,0);return{setMask:function(Se){te!==Se&&!H&&(t.colorMask(Se,Se,Se,Se),te=Se)},setLocked:function(Se){H=Se},setClear:function(Se,ae,ye,Ie,pt){pt===!0&&(Se*=Ie,ae*=Ie,ye*=Ie),ve.set(Se,ae,ye,Ie),ge.equals(ve)===!1&&(t.clearColor(Se,ae,ye,Ie),ge.copy(ve))},reset:function(){H=!1,te=null,ge.set(-1,0,0,0)}}}function i(){let H=!1,ve=!1,te=null,ge=null,Se=null;return{setReversed:function(ae){if(ve!==ae){const ye=e.get("EXT_clip_control");ae?ye.clipControlEXT(ye.LOWER_LEFT_EXT,ye.ZERO_TO_ONE_EXT):ye.clipControlEXT(ye.LOWER_LEFT_EXT,ye.NEGATIVE_ONE_TO_ONE_EXT),ve=ae;const Ie=Se;Se=null,this.setClear(Ie)}},getReversed:function(){return ve},setTest:function(ae){ae?ee(t.DEPTH_TEST):Ne(t.DEPTH_TEST)},setMask:function(ae){te!==ae&&!H&&(t.depthMask(ae),te=ae)},setFunc:function(ae){if(ve&&(ae=PE[ae]),ge!==ae){switch(ae){case Bf:t.depthFunc(t.NEVER);break;case zf:t.depthFunc(t.ALWAYS);break;case Hf:t.depthFunc(t.LESS);break;case tl:t.depthFunc(t.LEQUAL);break;case Vf:t.depthFunc(t.EQUAL);break;case Gf:t.depthFunc(t.GEQUAL);break;case jf:t.depthFunc(t.GREATER);break;case Wf:t.depthFunc(t.NOTEQUAL);break;default:t.depthFunc(t.LEQUAL)}ge=ae}},setLocked:function(ae){H=ae},setClear:function(ae){Se!==ae&&(Se=ae,ve&&(ae=1-ae),t.clearDepth(ae))},reset:function(){H=!1,te=null,ge=null,Se=null,ve=!1}}}function r(){let H=!1,ve=null,te=null,ge=null,Se=null,ae=null,ye=null,Ie=null,pt=null;return{setTest:function(nt){H||(nt?ee(t.STENCIL_TEST):Ne(t.STENCIL_TEST))},setMask:function(nt){ve!==nt&&!H&&(t.stencilMask(nt),ve=nt)},setFunc:function(nt,Pn,On){(te!==nt||ge!==Pn||Se!==On)&&(t.stencilFunc(nt,Pn,On),te=nt,ge=Pn,Se=On)},setOp:function(nt,Pn,On){(ae!==nt||ye!==Pn||Ie!==On)&&(t.stencilOp(nt,Pn,On),ae=nt,ye=Pn,Ie=On)},setLocked:function(nt){H=nt},setClear:function(nt){pt!==nt&&(t.clearStencil(nt),pt=nt)},reset:function(){H=!1,ve=null,te=null,ge=null,Se=null,ae=null,ye=null,Ie=null,pt=null}}}const s=new n,a=new i,o=new r,l=new WeakMap,c=new WeakMap;let h={},p={},f={},g=new WeakMap,v=[],S=null,_=!1,d=null,m=null,M=null,y=null,T=null,E=null,C=null,x=new ct(0,0,0),b=0,P=!1,D=null,O=null,F=null,U=null,W=null;const N=t.getParameter(t.MAX_COMBINED_TEXTURE_IMAGE_UNITS);let z=!1,k=0;const j=t.getParameter(t.VERSION);j.indexOf("WebGL")!==-1?(k=parseFloat(/^WebGL (\d)/.exec(j)[1]),z=k>=1):j.indexOf("OpenGL ES")!==-1&&(k=parseFloat(/^OpenGL ES (\d)/.exec(j)[1]),z=k>=2);let L=null,$={};const de=t.getParameter(t.SCISSOR_BOX),we=t.getParameter(t.VIEWPORT),Ke=new Gt().fromArray(de),$e=new Gt().fromArray(we);function Ze(H,ve,te,ge){const Se=new Uint8Array(4),ae=t.createTexture();t.bindTexture(H,ae),t.texParameteri(H,t.TEXTURE_MIN_FILTER,t.NEAREST),t.texParameteri(H,t.TEXTURE_MAG_FILTER,t.NEAREST);for(let ye=0;ye<te;ye++)H===t.TEXTURE_3D||H===t.TEXTURE_2D_ARRAY?t.texImage3D(ve,0,t.RGBA,1,1,ge,0,t.RGBA,t.UNSIGNED_BYTE,Se):t.texImage2D(ve+ye,0,t.RGBA,1,1,0,t.RGBA,t.UNSIGNED_BYTE,Se);return ae}const Q={};Q[t.TEXTURE_2D]=Ze(t.TEXTURE_2D,t.TEXTURE_2D,1),Q[t.TEXTURE_CUBE_MAP]=Ze(t.TEXTURE_CUBE_MAP,t.TEXTURE_CUBE_MAP_POSITIVE_X,6),Q[t.TEXTURE_2D_ARRAY]=Ze(t.TEXTURE_2D_ARRAY,t.TEXTURE_2D_ARRAY,1,1),Q[t.TEXTURE_3D]=Ze(t.TEXTURE_3D,t.TEXTURE_3D,1,1),s.setClear(0,0,0,1),a.setClear(1),o.setClear(0),ee(t.DEPTH_TEST),a.setFunc(tl),rt(!1),Pt(E0),ee(t.CULL_FACE),ot(br);function ee(H){h[H]!==!0&&(t.enable(H),h[H]=!0)}function Ne(H){h[H]!==!1&&(t.disable(H),h[H]=!1)}function je(H,ve){return f[H]!==ve?(t.bindFramebuffer(H,ve),f[H]=ve,H===t.DRAW_FRAMEBUFFER&&(f[t.FRAMEBUFFER]=ve),H===t.FRAMEBUFFER&&(f[t.DRAW_FRAMEBUFFER]=ve),!0):!1}function Re(H,ve){let te=v,ge=!1;if(H){te=g.get(ve),te===void 0&&(te=[],g.set(ve,te));const Se=H.textures;if(te.length!==Se.length||te[0]!==t.COLOR_ATTACHMENT0){for(let ae=0,ye=Se.length;ae<ye;ae++)te[ae]=t.COLOR_ATTACHMENT0+ae;te.length=Se.length,ge=!0}}else te[0]!==t.BACK&&(te[0]=t.BACK,ge=!0);ge&&t.drawBuffers(te)}function Qe(H){return S!==H?(t.useProgram(H),S=H,!0):!1}const ze={[la]:t.FUNC_ADD,[ZM]:t.FUNC_SUBTRACT,[QM]:t.FUNC_REVERSE_SUBTRACT};ze[JM]=t.MIN,ze[eE]=t.MAX;const et={[tE]:t.ZERO,[nE]:t.ONE,[iE]:t.SRC_COLOR,[rx]:t.SRC_ALPHA,[cE]:t.SRC_ALPHA_SATURATE,[oE]:t.DST_COLOR,[sE]:t.DST_ALPHA,[rE]:t.ONE_MINUS_SRC_COLOR,[sx]:t.ONE_MINUS_SRC_ALPHA,[lE]:t.ONE_MINUS_DST_COLOR,[aE]:t.ONE_MINUS_DST_ALPHA,[uE]:t.CONSTANT_COLOR,[dE]:t.ONE_MINUS_CONSTANT_COLOR,[fE]:t.CONSTANT_ALPHA,[hE]:t.ONE_MINUS_CONSTANT_ALPHA};function ot(H,ve,te,ge,Se,ae,ye,Ie,pt,nt){if(H===br){_===!0&&(Ne(t.BLEND),_=!1);return}if(_===!1&&(ee(t.BLEND),_=!0),H!==KM){if(H!==d||nt!==P){if((m!==la||T!==la)&&(t.blendEquation(t.FUNC_ADD),m=la,T=la),nt)switch(H){case Fo:t.blendFuncSeparate(t.ONE,t.ONE_MINUS_SRC_ALPHA,t.ONE,t.ONE_MINUS_SRC_ALPHA);break;case w0:t.blendFunc(t.ONE,t.ONE);break;case T0:t.blendFuncSeparate(t.ZERO,t.ONE_MINUS_SRC_COLOR,t.ZERO,t.ONE);break;case b0:t.blendFuncSeparate(t.DST_COLOR,t.ONE_MINUS_SRC_ALPHA,t.ZERO,t.ONE);break;default:gt("WebGLState: Invalid blending: ",H);break}else switch(H){case Fo:t.blendFuncSeparate(t.SRC_ALPHA,t.ONE_MINUS_SRC_ALPHA,t.ONE,t.ONE_MINUS_SRC_ALPHA);break;case w0:t.blendFuncSeparate(t.SRC_ALPHA,t.ONE,t.ONE,t.ONE);break;case T0:gt("WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true");break;case b0:gt("WebGLState: MultiplyBlending requires material.premultipliedAlpha = true");break;default:gt("WebGLState: Invalid blending: ",H);break}M=null,y=null,E=null,C=null,x.set(0,0,0),b=0,d=H,P=nt}return}Se=Se||ve,ae=ae||te,ye=ye||ge,(ve!==m||Se!==T)&&(t.blendEquationSeparate(ze[ve],ze[Se]),m=ve,T=Se),(te!==M||ge!==y||ae!==E||ye!==C)&&(t.blendFuncSeparate(et[te],et[ge],et[ae],et[ye]),M=te,y=ge,E=ae,C=ye),(Ie.equals(x)===!1||pt!==b)&&(t.blendColor(Ie.r,Ie.g,Ie.b,pt),x.copy(Ie),b=pt),d=H,P=!1}function yt(H,ve){H.side===jn?Ne(t.CULL_FACE):ee(t.CULL_FACE);let te=H.side===Yn;ve&&(te=!te),rt(te),H.blending===Fo&&H.transparent===!1?ot(br):ot(H.blending,H.blendEquation,H.blendSrc,H.blendDst,H.blendEquationAlpha,H.blendSrcAlpha,H.blendDstAlpha,H.blendColor,H.blendAlpha,H.premultipliedAlpha),a.setFunc(H.depthFunc),a.setTest(H.depthTest),a.setMask(H.depthWrite),s.setMask(H.colorWrite);const ge=H.stencilWrite;o.setTest(ge),ge&&(o.setMask(H.stencilWriteMask),o.setFunc(H.stencilFunc,H.stencilRef,H.stencilFuncMask),o.setOp(H.stencilFail,H.stencilZFail,H.stencilZPass)),pn(H.polygonOffset,H.polygonOffsetFactor,H.polygonOffsetUnits),H.alphaToCoverage===!0?ee(t.SAMPLE_ALPHA_TO_COVERAGE):Ne(t.SAMPLE_ALPHA_TO_COVERAGE)}function rt(H){D!==H&&(H?t.frontFace(t.CW):t.frontFace(t.CCW),D=H)}function Pt(H){H!==$M?(ee(t.CULL_FACE),H!==O&&(H===E0?t.cullFace(t.BACK):H===qM?t.cullFace(t.FRONT):t.cullFace(t.FRONT_AND_BACK))):Ne(t.CULL_FACE),O=H}function Bt(H){H!==F&&(z&&t.lineWidth(H),F=H)}function pn(H,ve,te){H?(ee(t.POLYGON_OFFSET_FILL),(U!==ve||W!==te)&&(U=ve,W=te,a.getReversed()&&(ve=-ve),t.polygonOffset(ve,te))):Ne(t.POLYGON_OFFSET_FILL)}function Ct(H){H?ee(t.SCISSOR_TEST):Ne(t.SCISSOR_TEST)}function zt(H){H===void 0&&(H=t.TEXTURE0+N-1),L!==H&&(t.activeTexture(H),L=H)}function V(H,ve,te){te===void 0&&(L===null?te=t.TEXTURE0+N-1:te=L);let ge=$[te];ge===void 0&&(ge={type:void 0,texture:void 0},$[te]=ge),(ge.type!==H||ge.texture!==ve)&&(L!==te&&(t.activeTexture(te),L=te),t.bindTexture(H,ve||Q[H]),ge.type=H,ge.texture=ve)}function Yt(){const H=$[L];H!==void 0&&H.type!==void 0&&(t.bindTexture(H.type,null),H.type=void 0,H.texture=void 0)}function ht(){try{t.compressedTexImage2D(...arguments)}catch(H){gt("WebGLState:",H)}}function R(){try{t.compressedTexImage3D(...arguments)}catch(H){gt("WebGLState:",H)}}function w(){try{t.texSubImage2D(...arguments)}catch(H){gt("WebGLState:",H)}}function X(){try{t.texSubImage3D(...arguments)}catch(H){gt("WebGLState:",H)}}function K(){try{t.compressedTexSubImage2D(...arguments)}catch(H){gt("WebGLState:",H)}}function ie(){try{t.compressedTexSubImage3D(...arguments)}catch(H){gt("WebGLState:",H)}}function fe(){try{t.texStorage2D(...arguments)}catch(H){gt("WebGLState:",H)}}function _e(){try{t.texStorage3D(...arguments)}catch(H){gt("WebGLState:",H)}}function re(){try{t.texImage2D(...arguments)}catch(H){gt("WebGLState:",H)}}function oe(){try{t.texImage3D(...arguments)}catch(H){gt("WebGLState:",H)}}function he(H){return p[H]!==void 0?p[H]:t.getParameter(H)}function Fe(H,ve){p[H]!==ve&&(t.pixelStorei(H,ve),p[H]=ve)}function xe(H){Ke.equals(H)===!1&&(t.scissor(H.x,H.y,H.z,H.w),Ke.copy(H))}function me(H){$e.equals(H)===!1&&(t.viewport(H.x,H.y,H.z,H.w),$e.copy(H))}function Oe(H,ve){let te=c.get(ve);te===void 0&&(te=new WeakMap,c.set(ve,te));let ge=te.get(H);ge===void 0&&(ge=t.getUniformBlockIndex(ve,H.name),te.set(H,ge))}function ke(H,ve){const ge=c.get(ve).get(H);l.get(ve)!==ge&&(t.uniformBlockBinding(ve,ge,H.__bindingPointIndex),l.set(ve,ge))}function qe(){t.disable(t.BLEND),t.disable(t.CULL_FACE),t.disable(t.DEPTH_TEST),t.disable(t.POLYGON_OFFSET_FILL),t.disable(t.SCISSOR_TEST),t.disable(t.STENCIL_TEST),t.disable(t.SAMPLE_ALPHA_TO_COVERAGE),t.blendEquation(t.FUNC_ADD),t.blendFunc(t.ONE,t.ZERO),t.blendFuncSeparate(t.ONE,t.ZERO,t.ONE,t.ZERO),t.blendColor(0,0,0,0),t.colorMask(!0,!0,!0,!0),t.clearColor(0,0,0,0),t.depthMask(!0),t.depthFunc(t.LESS),a.setReversed(!1),t.clearDepth(1),t.stencilMask(4294967295),t.stencilFunc(t.ALWAYS,0,4294967295),t.stencilOp(t.KEEP,t.KEEP,t.KEEP),t.clearStencil(0),t.cullFace(t.BACK),t.frontFace(t.CCW),t.polygonOffset(0,0),t.activeTexture(t.TEXTURE0),t.bindFramebuffer(t.FRAMEBUFFER,null),t.bindFramebuffer(t.DRAW_FRAMEBUFFER,null),t.bindFramebuffer(t.READ_FRAMEBUFFER,null),t.useProgram(null),t.lineWidth(1),t.scissor(0,0,t.canvas.width,t.canvas.height),t.viewport(0,0,t.canvas.width,t.canvas.height),t.pixelStorei(t.PACK_ALIGNMENT,4),t.pixelStorei(t.UNPACK_ALIGNMENT,4),t.pixelStorei(t.UNPACK_FLIP_Y_WEBGL,!1),t.pixelStorei(t.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),t.pixelStorei(t.UNPACK_COLORSPACE_CONVERSION_WEBGL,t.BROWSER_DEFAULT_WEBGL),t.pixelStorei(t.PACK_ROW_LENGTH,0),t.pixelStorei(t.PACK_SKIP_PIXELS,0),t.pixelStorei(t.PACK_SKIP_ROWS,0),t.pixelStorei(t.UNPACK_ROW_LENGTH,0),t.pixelStorei(t.UNPACK_IMAGE_HEIGHT,0),t.pixelStorei(t.UNPACK_SKIP_PIXELS,0),t.pixelStorei(t.UNPACK_SKIP_ROWS,0),t.pixelStorei(t.UNPACK_SKIP_IMAGES,0),h={},p={},L=null,$={},f={},g=new WeakMap,v=[],S=null,_=!1,d=null,m=null,M=null,y=null,T=null,E=null,C=null,x=new ct(0,0,0),b=0,P=!1,D=null,O=null,F=null,U=null,W=null,Ke.set(0,0,t.canvas.width,t.canvas.height),$e.set(0,0,t.canvas.width,t.canvas.height),s.reset(),a.reset(),o.reset()}return{buffers:{color:s,depth:a,stencil:o},enable:ee,disable:Ne,bindFramebuffer:je,drawBuffers:Re,useProgram:Qe,setBlending:ot,setMaterial:yt,setFlipSided:rt,setCullFace:Pt,setLineWidth:Bt,setPolygonOffset:pn,setScissorTest:Ct,activeTexture:zt,bindTexture:V,unbindTexture:Yt,compressedTexImage2D:ht,compressedTexImage3D:R,texImage2D:re,texImage3D:oe,pixelStorei:Fe,getParameter:he,updateUBOMapping:Oe,uniformBlockBinding:ke,texStorage2D:fe,texStorage3D:_e,texSubImage2D:w,texSubImage3D:X,compressedTexSubImage2D:K,compressedTexSubImage3D:ie,scissor:xe,viewport:me,reset:qe}}function cC(t,e,n,i,r,s,a){const o=e.has("WEBGL_multisampled_render_to_texture")?e.get("WEBGL_multisampled_render_to_texture"):null,l=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),c=new We,h=new WeakMap,p=new Set;let f;const g=new WeakMap;let v=!1;try{v=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function S(R,w){return v?new OffscreenCanvas(R,w):tu("canvas")}function _(R,w,X){let K=1;const ie=ht(R);if((ie.width>X||ie.height>X)&&(K=X/Math.max(ie.width,ie.height)),K<1)if(typeof HTMLImageElement<"u"&&R instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&R instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&R instanceof ImageBitmap||typeof VideoFrame<"u"&&R instanceof VideoFrame){const fe=Math.floor(K*ie.width),_e=Math.floor(K*ie.height);f===void 0&&(f=S(fe,_e));const re=w?S(fe,_e):f;return re.width=fe,re.height=_e,re.getContext("2d").drawImage(R,0,0,fe,_e),Ve("WebGLRenderer: Texture has been resized from ("+ie.width+"x"+ie.height+") to ("+fe+"x"+_e+")."),re}else return"data"in R&&Ve("WebGLRenderer: Image in DataTexture is too big ("+ie.width+"x"+ie.height+")."),R;return R}function d(R){return R.generateMipmaps}function m(R){t.generateMipmap(R)}function M(R){return R.isWebGLCubeRenderTarget?t.TEXTURE_CUBE_MAP:R.isWebGL3DRenderTarget?t.TEXTURE_3D:R.isWebGLArrayRenderTarget||R.isCompressedArrayTexture?t.TEXTURE_2D_ARRAY:t.TEXTURE_2D}function y(R,w,X,K,ie,fe=!1){if(R!==null){if(t[R]!==void 0)return t[R];Ve("WebGLRenderer: Attempt to use non-existing WebGL internal format '"+R+"'")}let _e;K&&(_e=e.get("EXT_texture_norm16"),_e||Ve("WebGLRenderer: Unable to use normalized textures without EXT_texture_norm16 extension"));let re=w;if(w===t.RED&&(X===t.FLOAT&&(re=t.R32F),X===t.HALF_FLOAT&&(re=t.R16F),X===t.UNSIGNED_BYTE&&(re=t.R8),X===t.UNSIGNED_SHORT&&_e&&(re=_e.R16_EXT),X===t.SHORT&&_e&&(re=_e.R16_SNORM_EXT)),w===t.RED_INTEGER&&(X===t.UNSIGNED_BYTE&&(re=t.R8UI),X===t.UNSIGNED_SHORT&&(re=t.R16UI),X===t.UNSIGNED_INT&&(re=t.R32UI),X===t.BYTE&&(re=t.R8I),X===t.SHORT&&(re=t.R16I),X===t.INT&&(re=t.R32I)),w===t.RG&&(X===t.FLOAT&&(re=t.RG32F),X===t.HALF_FLOAT&&(re=t.RG16F),X===t.UNSIGNED_BYTE&&(re=t.RG8),X===t.UNSIGNED_SHORT&&_e&&(re=_e.RG16_EXT),X===t.SHORT&&_e&&(re=_e.RG16_SNORM_EXT)),w===t.RG_INTEGER&&(X===t.UNSIGNED_BYTE&&(re=t.RG8UI),X===t.UNSIGNED_SHORT&&(re=t.RG16UI),X===t.UNSIGNED_INT&&(re=t.RG32UI),X===t.BYTE&&(re=t.RG8I),X===t.SHORT&&(re=t.RG16I),X===t.INT&&(re=t.RG32I)),w===t.RGB_INTEGER&&(X===t.UNSIGNED_BYTE&&(re=t.RGB8UI),X===t.UNSIGNED_SHORT&&(re=t.RGB16UI),X===t.UNSIGNED_INT&&(re=t.RGB32UI),X===t.BYTE&&(re=t.RGB8I),X===t.SHORT&&(re=t.RGB16I),X===t.INT&&(re=t.RGB32I)),w===t.RGBA_INTEGER&&(X===t.UNSIGNED_BYTE&&(re=t.RGBA8UI),X===t.UNSIGNED_SHORT&&(re=t.RGBA16UI),X===t.UNSIGNED_INT&&(re=t.RGBA32UI),X===t.BYTE&&(re=t.RGBA8I),X===t.SHORT&&(re=t.RGBA16I),X===t.INT&&(re=t.RGBA32I)),w===t.RGB&&(X===t.UNSIGNED_SHORT&&_e&&(re=_e.RGB16_EXT),X===t.SHORT&&_e&&(re=_e.RGB16_SNORM_EXT),X===t.UNSIGNED_INT_5_9_9_9_REV&&(re=t.RGB9_E5),X===t.UNSIGNED_INT_10F_11F_11F_REV&&(re=t.R11F_G11F_B10F)),w===t.RGBA){const oe=fe?eu:ft.getTransfer(ie);X===t.FLOAT&&(re=t.RGBA32F),X===t.HALF_FLOAT&&(re=t.RGBA16F),X===t.UNSIGNED_BYTE&&(re=oe===Tt?t.SRGB8_ALPHA8:t.RGBA8),X===t.UNSIGNED_SHORT&&_e&&(re=_e.RGBA16_EXT),X===t.SHORT&&_e&&(re=_e.RGBA16_SNORM_EXT),X===t.UNSIGNED_SHORT_4_4_4_4&&(re=t.RGBA4),X===t.UNSIGNED_SHORT_5_5_5_1&&(re=t.RGB5_A1)}return(re===t.R16F||re===t.R32F||re===t.RG16F||re===t.RG32F||re===t.RGBA16F||re===t.RGBA32F)&&e.get("EXT_color_buffer_float"),re}function T(R,w){let X;return R?w===null||w===or||w===il?X=t.DEPTH24_STENCIL8:w===nr?X=t.DEPTH32F_STENCIL8:w===nl&&(X=t.DEPTH24_STENCIL8,Ve("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):w===null||w===or||w===il?X=t.DEPTH_COMPONENT24:w===nr?X=t.DEPTH_COMPONENT32F:w===nl&&(X=t.DEPTH_COMPONENT16),X}function E(R,w){return d(R)===!0||R.isFramebufferTexture&&R.minFilter!==gn&&R.minFilter!==bn?Math.log2(Math.max(w.width,w.height))+1:R.mipmaps!==void 0&&R.mipmaps.length>0?R.mipmaps.length:R.isCompressedTexture&&Array.isArray(R.image)?w.mipmaps.length:1}function C(R){const w=R.target;w.removeEventListener("dispose",C),b(w),w.isVideoTexture&&h.delete(w),w.isHTMLTexture&&p.delete(w)}function x(R){const w=R.target;w.removeEventListener("dispose",x),D(w)}function b(R){const w=i.get(R);if(w.__webglInit===void 0)return;const X=R.source,K=g.get(X);if(K){const ie=K[w.__cacheKey];ie.usedTimes--,ie.usedTimes===0&&P(R),Object.keys(K).length===0&&g.delete(X)}i.remove(R)}function P(R){const w=i.get(R);t.deleteTexture(w.__webglTexture);const X=R.source,K=g.get(X);delete K[w.__cacheKey],a.memory.textures--}function D(R){const w=i.get(R);if(R.depthTexture&&(R.depthTexture.dispose(),i.remove(R.depthTexture)),R.isWebGLCubeRenderTarget)for(let K=0;K<6;K++){if(Array.isArray(w.__webglFramebuffer[K]))for(let ie=0;ie<w.__webglFramebuffer[K].length;ie++)t.deleteFramebuffer(w.__webglFramebuffer[K][ie]);else t.deleteFramebuffer(w.__webglFramebuffer[K]);w.__webglDepthbuffer&&t.deleteRenderbuffer(w.__webglDepthbuffer[K])}else{if(Array.isArray(w.__webglFramebuffer))for(let K=0;K<w.__webglFramebuffer.length;K++)t.deleteFramebuffer(w.__webglFramebuffer[K]);else t.deleteFramebuffer(w.__webglFramebuffer);if(w.__webglDepthbuffer&&t.deleteRenderbuffer(w.__webglDepthbuffer),w.__webglMultisampledFramebuffer&&t.deleteFramebuffer(w.__webglMultisampledFramebuffer),w.__webglColorRenderbuffer)for(let K=0;K<w.__webglColorRenderbuffer.length;K++)w.__webglColorRenderbuffer[K]&&t.deleteRenderbuffer(w.__webglColorRenderbuffer[K]);w.__webglDepthRenderbuffer&&t.deleteRenderbuffer(w.__webglDepthRenderbuffer)}const X=R.textures;for(let K=0,ie=X.length;K<ie;K++){const fe=i.get(X[K]);fe.__webglTexture&&(t.deleteTexture(fe.__webglTexture),a.memory.textures--),i.remove(X[K])}i.remove(R)}let O=0;function F(){O=0}function U(){return O}function W(R){O=R}function N(){const R=O;return R>=r.maxTextures&&Ve("WebGLTextures: Trying to use "+(R+1)+" texture units while this GPU supports only "+r.maxTextures),O+=1,R}function z(R){const w=[];return w.push(R.wrapS),w.push(R.wrapT),w.push(R.wrapR||0),w.push(R.magFilter),w.push(R.minFilter),w.push(R.anisotropy),w.push(R.internalFormat),w.push(R.format),w.push(R.type),w.push(R.generateMipmaps),w.push(R.premultiplyAlpha),w.push(R.flipY),w.push(R.unpackAlignment),w.push(R.colorSpace),w.join()}function k(R,w){const X=i.get(R);if(R.isVideoTexture&&V(R),R.isRenderTargetTexture===!1&&R.isExternalTexture!==!0&&R.version>0&&X.__version!==R.version){const K=R.image;if(K===null)Ve("WebGLRenderer: Texture marked for update but no image data found.");else if(K.complete===!1)Ve("WebGLRenderer: Texture marked for update but image is incomplete");else{Ne(X,R,w);return}}else R.isExternalTexture&&(X.__webglTexture=R.sourceTexture?R.sourceTexture:null);n.bindTexture(t.TEXTURE_2D,X.__webglTexture,t.TEXTURE0+w)}function j(R,w){const X=i.get(R);if(R.isRenderTargetTexture===!1&&R.version>0&&X.__version!==R.version){Ne(X,R,w);return}else R.isExternalTexture&&(X.__webglTexture=R.sourceTexture?R.sourceTexture:null);n.bindTexture(t.TEXTURE_2D_ARRAY,X.__webglTexture,t.TEXTURE0+w)}function L(R,w){const X=i.get(R);if(R.isRenderTargetTexture===!1&&R.version>0&&X.__version!==R.version){Ne(X,R,w);return}n.bindTexture(t.TEXTURE_3D,X.__webglTexture,t.TEXTURE0+w)}function $(R,w){const X=i.get(R);if(R.isCubeDepthTexture!==!0&&R.version>0&&X.__version!==R.version){je(X,R,w);return}n.bindTexture(t.TEXTURE_CUBE_MAP,X.__webglTexture,t.TEXTURE0+w)}const de={[Xf]:t.REPEAT,[wr]:t.CLAMP_TO_EDGE,[$f]:t.MIRRORED_REPEAT},we={[gn]:t.NEAREST,[gE]:t.NEAREST_MIPMAP_NEAREST,[Dl]:t.NEAREST_MIPMAP_LINEAR,[bn]:t.LINEAR,[dd]:t.LINEAR_MIPMAP_NEAREST,[Cs]:t.LINEAR_MIPMAP_LINEAR},Ke={[yE]:t.NEVER,[TE]:t.ALWAYS,[SE]:t.LESS,[Fp]:t.LEQUAL,[ME]:t.EQUAL,[Op]:t.GEQUAL,[EE]:t.GREATER,[wE]:t.NOTEQUAL};function $e(R,w){if(w.type===nr&&e.has("OES_texture_float_linear")===!1&&(w.magFilter===bn||w.magFilter===dd||w.magFilter===Dl||w.magFilter===Cs||w.minFilter===bn||w.minFilter===dd||w.minFilter===Dl||w.minFilter===Cs)&&Ve("WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),t.texParameteri(R,t.TEXTURE_WRAP_S,de[w.wrapS]),t.texParameteri(R,t.TEXTURE_WRAP_T,de[w.wrapT]),(R===t.TEXTURE_3D||R===t.TEXTURE_2D_ARRAY)&&t.texParameteri(R,t.TEXTURE_WRAP_R,de[w.wrapR]),t.texParameteri(R,t.TEXTURE_MAG_FILTER,we[w.magFilter]),t.texParameteri(R,t.TEXTURE_MIN_FILTER,we[w.minFilter]),w.compareFunction&&(t.texParameteri(R,t.TEXTURE_COMPARE_MODE,t.COMPARE_REF_TO_TEXTURE),t.texParameteri(R,t.TEXTURE_COMPARE_FUNC,Ke[w.compareFunction])),e.has("EXT_texture_filter_anisotropic")===!0){if(w.magFilter===gn||w.minFilter!==Dl&&w.minFilter!==Cs||w.type===nr&&e.has("OES_texture_float_linear")===!1)return;if(w.anisotropy>1||i.get(w).__currentAnisotropy){const X=e.get("EXT_texture_filter_anisotropic");t.texParameterf(R,X.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(w.anisotropy,r.getMaxAnisotropy())),i.get(w).__currentAnisotropy=w.anisotropy}}}function Ze(R,w){let X=!1;R.__webglInit===void 0&&(R.__webglInit=!0,w.addEventListener("dispose",C));const K=w.source;let ie=g.get(K);ie===void 0&&(ie={},g.set(K,ie));const fe=z(w);if(fe!==R.__cacheKey){ie[fe]===void 0&&(ie[fe]={texture:t.createTexture(),usedTimes:0},a.memory.textures++,X=!0),ie[fe].usedTimes++;const _e=ie[R.__cacheKey];_e!==void 0&&(ie[R.__cacheKey].usedTimes--,_e.usedTimes===0&&P(w)),R.__cacheKey=fe,R.__webglTexture=ie[fe].texture}return X}function Q(R,w,X){return Math.floor(Math.floor(R/X)/w)}function ee(R,w,X,K){const fe=R.updateRanges;if(fe.length===0)n.texSubImage2D(t.TEXTURE_2D,0,0,0,w.width,w.height,X,K,w.data);else{fe.sort((Fe,xe)=>Fe.start-xe.start);let _e=0;for(let Fe=1;Fe<fe.length;Fe++){const xe=fe[_e],me=fe[Fe],Oe=xe.start+xe.count,ke=Q(me.start,w.width,4),qe=Q(xe.start,w.width,4);me.start<=Oe+1&&ke===qe&&Q(me.start+me.count-1,w.width,4)===ke?xe.count=Math.max(xe.count,me.start+me.count-xe.start):(++_e,fe[_e]=me)}fe.length=_e+1;const re=n.getParameter(t.UNPACK_ROW_LENGTH),oe=n.getParameter(t.UNPACK_SKIP_PIXELS),he=n.getParameter(t.UNPACK_SKIP_ROWS);n.pixelStorei(t.UNPACK_ROW_LENGTH,w.width);for(let Fe=0,xe=fe.length;Fe<xe;Fe++){const me=fe[Fe],Oe=Math.floor(me.start/4),ke=Math.ceil(me.count/4),qe=Oe%w.width,H=Math.floor(Oe/w.width),ve=ke,te=1;n.pixelStorei(t.UNPACK_SKIP_PIXELS,qe),n.pixelStorei(t.UNPACK_SKIP_ROWS,H),n.texSubImage2D(t.TEXTURE_2D,0,qe,H,ve,te,X,K,w.data)}R.clearUpdateRanges(),n.pixelStorei(t.UNPACK_ROW_LENGTH,re),n.pixelStorei(t.UNPACK_SKIP_PIXELS,oe),n.pixelStorei(t.UNPACK_SKIP_ROWS,he)}}function Ne(R,w,X){let K=t.TEXTURE_2D;(w.isDataArrayTexture||w.isCompressedArrayTexture)&&(K=t.TEXTURE_2D_ARRAY),w.isData3DTexture&&(K=t.TEXTURE_3D);const ie=Ze(R,w),fe=w.source;n.bindTexture(K,R.__webglTexture,t.TEXTURE0+X);const _e=i.get(fe);if(fe.version!==_e.__version||ie===!0){if(n.activeTexture(t.TEXTURE0+X),(typeof ImageBitmap<"u"&&w.image instanceof ImageBitmap)===!1){const te=ft.getPrimaries(ft.workingColorSpace),ge=w.colorSpace===Yr?null:ft.getPrimaries(w.colorSpace),Se=w.colorSpace===Yr||te===ge?t.NONE:t.BROWSER_DEFAULT_WEBGL;n.pixelStorei(t.UNPACK_FLIP_Y_WEBGL,w.flipY),n.pixelStorei(t.UNPACK_PREMULTIPLY_ALPHA_WEBGL,w.premultiplyAlpha),n.pixelStorei(t.UNPACK_COLORSPACE_CONVERSION_WEBGL,Se)}n.pixelStorei(t.UNPACK_ALIGNMENT,w.unpackAlignment);let oe=_(w.image,!1,r.maxTextureSize);oe=Yt(w,oe);const he=s.convert(w.format,w.colorSpace),Fe=s.convert(w.type);let xe=y(w.internalFormat,he,Fe,w.normalized,w.colorSpace,w.isVideoTexture);$e(K,w);let me;const Oe=w.mipmaps,ke=w.isVideoTexture!==!0,qe=_e.__version===void 0||ie===!0,H=fe.dataReady,ve=E(w,oe);if(w.isDepthTexture)xe=T(w.format===Rs,w.type),qe&&(ke?n.texStorage2D(t.TEXTURE_2D,1,xe,oe.width,oe.height):n.texImage2D(t.TEXTURE_2D,0,xe,oe.width,oe.height,0,he,Fe,null));else if(w.isDataTexture)if(Oe.length>0){ke&&qe&&n.texStorage2D(t.TEXTURE_2D,ve,xe,Oe[0].width,Oe[0].height);for(let te=0,ge=Oe.length;te<ge;te++)me=Oe[te],ke?H&&n.texSubImage2D(t.TEXTURE_2D,te,0,0,me.width,me.height,he,Fe,me.data):n.texImage2D(t.TEXTURE_2D,te,xe,me.width,me.height,0,he,Fe,me.data);w.generateMipmaps=!1}else ke?(qe&&n.texStorage2D(t.TEXTURE_2D,ve,xe,oe.width,oe.height),H&&ee(w,oe,he,Fe)):n.texImage2D(t.TEXTURE_2D,0,xe,oe.width,oe.height,0,he,Fe,oe.data);else if(w.isCompressedTexture)if(w.isCompressedArrayTexture){ke&&qe&&n.texStorage3D(t.TEXTURE_2D_ARRAY,ve,xe,Oe[0].width,Oe[0].height,oe.depth);for(let te=0,ge=Oe.length;te<ge;te++)if(me=Oe[te],w.format!==Ui)if(he!==null)if(ke){if(H)if(w.layerUpdates.size>0){const Se=ag(me.width,me.height,w.format,w.type);for(const ae of w.layerUpdates){const ye=me.data.subarray(ae*Se/me.data.BYTES_PER_ELEMENT,(ae+1)*Se/me.data.BYTES_PER_ELEMENT);n.compressedTexSubImage3D(t.TEXTURE_2D_ARRAY,te,0,0,ae,me.width,me.height,1,he,ye)}}else n.compressedTexSubImage3D(t.TEXTURE_2D_ARRAY,te,0,0,0,me.width,me.height,oe.depth,he,me.data)}else n.compressedTexImage3D(t.TEXTURE_2D_ARRAY,te,xe,me.width,me.height,oe.depth,0,me.data,0,0);else Ve("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else ke?H&&n.texSubImage3D(t.TEXTURE_2D_ARRAY,te,0,0,0,me.width,me.height,oe.depth,he,Fe,me.data):n.texImage3D(t.TEXTURE_2D_ARRAY,te,xe,me.width,me.height,oe.depth,0,he,Fe,me.data);w.layerUpdates.size>0&&w.clearLayerUpdates()}else{ke&&qe&&n.texStorage2D(t.TEXTURE_2D,ve,xe,Oe[0].width,Oe[0].height);for(let te=0,ge=Oe.length;te<ge;te++)me=Oe[te],w.format!==Ui?he!==null?ke?H&&n.compressedTexSubImage2D(t.TEXTURE_2D,te,0,0,me.width,me.height,he,me.data):n.compressedTexImage2D(t.TEXTURE_2D,te,xe,me.width,me.height,0,me.data):Ve("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):ke?H&&n.texSubImage2D(t.TEXTURE_2D,te,0,0,me.width,me.height,he,Fe,me.data):n.texImage2D(t.TEXTURE_2D,te,xe,me.width,me.height,0,he,Fe,me.data)}else if(w.isDataArrayTexture)if(ke){if(qe&&n.texStorage3D(t.TEXTURE_2D_ARRAY,ve,xe,oe.width,oe.height,oe.depth),H)if(w.layerUpdates.size>0){const te=ag(oe.width,oe.height,w.format,w.type);for(const ge of w.layerUpdates){const Se=oe.data.subarray(ge*te/oe.data.BYTES_PER_ELEMENT,(ge+1)*te/oe.data.BYTES_PER_ELEMENT);n.texSubImage3D(t.TEXTURE_2D_ARRAY,0,0,0,ge,oe.width,oe.height,1,he,Fe,Se)}w.clearLayerUpdates()}else n.texSubImage3D(t.TEXTURE_2D_ARRAY,0,0,0,0,oe.width,oe.height,oe.depth,he,Fe,oe.data)}else n.texImage3D(t.TEXTURE_2D_ARRAY,0,xe,oe.width,oe.height,oe.depth,0,he,Fe,oe.data);else if(w.isData3DTexture)ke?(qe&&n.texStorage3D(t.TEXTURE_3D,ve,xe,oe.width,oe.height,oe.depth),H&&n.texSubImage3D(t.TEXTURE_3D,0,0,0,0,oe.width,oe.height,oe.depth,he,Fe,oe.data)):n.texImage3D(t.TEXTURE_3D,0,xe,oe.width,oe.height,oe.depth,0,he,Fe,oe.data);else if(w.isFramebufferTexture){if(qe)if(ke)n.texStorage2D(t.TEXTURE_2D,ve,xe,oe.width,oe.height);else{let te=oe.width,ge=oe.height;for(let Se=0;Se<ve;Se++)n.texImage2D(t.TEXTURE_2D,Se,xe,te,ge,0,he,Fe,null),te>>=1,ge>>=1}}else if(w.isHTMLTexture){if("texElementImage2D"in t){const te=t.canvas;if(te.hasAttribute("layoutsubtree")||te.setAttribute("layoutsubtree","true"),oe.parentNode!==te){te.appendChild(oe),p.add(w),te.onpaint=ge=>{const Se=ge.changedElements;for(const ae of p)Se.includes(ae.image)&&(ae.needsUpdate=!0)},te.requestPaint();return}if(t.texElementImage2D.length===3)t.texElementImage2D(t.TEXTURE_2D,t.RGBA8,oe);else{const Se=t.RGBA,ae=t.RGBA,ye=t.UNSIGNED_BYTE;t.texElementImage2D(t.TEXTURE_2D,0,Se,ae,ye,oe)}t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MIN_FILTER,t.LINEAR),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_S,t.CLAMP_TO_EDGE),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_T,t.CLAMP_TO_EDGE)}}else if(Oe.length>0){if(ke&&qe){const te=ht(Oe[0]);n.texStorage2D(t.TEXTURE_2D,ve,xe,te.width,te.height)}for(let te=0,ge=Oe.length;te<ge;te++)me=Oe[te],ke?H&&n.texSubImage2D(t.TEXTURE_2D,te,0,0,he,Fe,me):n.texImage2D(t.TEXTURE_2D,te,xe,he,Fe,me);w.generateMipmaps=!1}else if(ke){if(qe){const te=ht(oe);n.texStorage2D(t.TEXTURE_2D,ve,xe,te.width,te.height)}H&&n.texSubImage2D(t.TEXTURE_2D,0,0,0,he,Fe,oe)}else n.texImage2D(t.TEXTURE_2D,0,xe,he,Fe,oe);d(w)&&m(K),_e.__version=fe.version,w.onUpdate&&w.onUpdate(w)}R.__version=w.version}function je(R,w,X){if(w.image.length!==6)return;const K=Ze(R,w),ie=w.source;n.bindTexture(t.TEXTURE_CUBE_MAP,R.__webglTexture,t.TEXTURE0+X);const fe=i.get(ie);if(ie.version!==fe.__version||K===!0){n.activeTexture(t.TEXTURE0+X);const _e=ft.getPrimaries(ft.workingColorSpace),re=w.colorSpace===Yr?null:ft.getPrimaries(w.colorSpace),oe=w.colorSpace===Yr||_e===re?t.NONE:t.BROWSER_DEFAULT_WEBGL;n.pixelStorei(t.UNPACK_FLIP_Y_WEBGL,w.flipY),n.pixelStorei(t.UNPACK_PREMULTIPLY_ALPHA_WEBGL,w.premultiplyAlpha),n.pixelStorei(t.UNPACK_ALIGNMENT,w.unpackAlignment),n.pixelStorei(t.UNPACK_COLORSPACE_CONVERSION_WEBGL,oe);const he=w.isCompressedTexture||w.image[0].isCompressedTexture,Fe=w.image[0]&&w.image[0].isDataTexture,xe=[];for(let ae=0;ae<6;ae++)!he&&!Fe?xe[ae]=_(w.image[ae],!0,r.maxCubemapSize):xe[ae]=Fe?w.image[ae].image:w.image[ae],xe[ae]=Yt(w,xe[ae]);const me=xe[0],Oe=s.convert(w.format,w.colorSpace),ke=s.convert(w.type),qe=y(w.internalFormat,Oe,ke,w.normalized,w.colorSpace),H=w.isVideoTexture!==!0,ve=fe.__version===void 0||K===!0,te=ie.dataReady;let ge=E(w,me);$e(t.TEXTURE_CUBE_MAP,w);let Se;if(he){H&&ve&&n.texStorage2D(t.TEXTURE_CUBE_MAP,ge,qe,me.width,me.height);for(let ae=0;ae<6;ae++){Se=xe[ae].mipmaps;for(let ye=0;ye<Se.length;ye++){const Ie=Se[ye];w.format!==Ui?Oe!==null?H?te&&n.compressedTexSubImage2D(t.TEXTURE_CUBE_MAP_POSITIVE_X+ae,ye,0,0,Ie.width,Ie.height,Oe,Ie.data):n.compressedTexImage2D(t.TEXTURE_CUBE_MAP_POSITIVE_X+ae,ye,qe,Ie.width,Ie.height,0,Ie.data):Ve("WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):H?te&&n.texSubImage2D(t.TEXTURE_CUBE_MAP_POSITIVE_X+ae,ye,0,0,Ie.width,Ie.height,Oe,ke,Ie.data):n.texImage2D(t.TEXTURE_CUBE_MAP_POSITIVE_X+ae,ye,qe,Ie.width,Ie.height,0,Oe,ke,Ie.data)}}}else{if(Se=w.mipmaps,H&&ve){Se.length>0&&ge++;const ae=ht(xe[0]);n.texStorage2D(t.TEXTURE_CUBE_MAP,ge,qe,ae.width,ae.height)}for(let ae=0;ae<6;ae++)if(Fe){H?te&&n.texSubImage2D(t.TEXTURE_CUBE_MAP_POSITIVE_X+ae,0,0,0,xe[ae].width,xe[ae].height,Oe,ke,xe[ae].data):n.texImage2D(t.TEXTURE_CUBE_MAP_POSITIVE_X+ae,0,qe,xe[ae].width,xe[ae].height,0,Oe,ke,xe[ae].data);for(let ye=0;ye<Se.length;ye++){const pt=Se[ye].image[ae].image;H?te&&n.texSubImage2D(t.TEXTURE_CUBE_MAP_POSITIVE_X+ae,ye+1,0,0,pt.width,pt.height,Oe,ke,pt.data):n.texImage2D(t.TEXTURE_CUBE_MAP_POSITIVE_X+ae,ye+1,qe,pt.width,pt.height,0,Oe,ke,pt.data)}}else{H?te&&n.texSubImage2D(t.TEXTURE_CUBE_MAP_POSITIVE_X+ae,0,0,0,Oe,ke,xe[ae]):n.texImage2D(t.TEXTURE_CUBE_MAP_POSITIVE_X+ae,0,qe,Oe,ke,xe[ae]);for(let ye=0;ye<Se.length;ye++){const Ie=Se[ye];H?te&&n.texSubImage2D(t.TEXTURE_CUBE_MAP_POSITIVE_X+ae,ye+1,0,0,Oe,ke,Ie.image[ae]):n.texImage2D(t.TEXTURE_CUBE_MAP_POSITIVE_X+ae,ye+1,qe,Oe,ke,Ie.image[ae])}}}d(w)&&m(t.TEXTURE_CUBE_MAP),fe.__version=ie.version,w.onUpdate&&w.onUpdate(w)}R.__version=w.version}function Re(R,w,X,K,ie,fe){const _e=s.convert(X.format,X.colorSpace),re=s.convert(X.type),oe=y(X.internalFormat,_e,re,X.normalized,X.colorSpace),he=i.get(w),Fe=i.get(X);if(Fe.__renderTarget=w,!he.__hasExternalTextures){const xe=Math.max(1,w.width>>fe),me=Math.max(1,w.height>>fe);ie===t.TEXTURE_3D||ie===t.TEXTURE_2D_ARRAY?n.texImage3D(ie,fe,oe,xe,me,w.depth,0,_e,re,null):n.texImage2D(ie,fe,oe,xe,me,0,_e,re,null)}n.bindFramebuffer(t.FRAMEBUFFER,R),zt(w)?o.framebufferTexture2DMultisampleEXT(t.FRAMEBUFFER,K,ie,Fe.__webglTexture,0,Ct(w)):(ie===t.TEXTURE_2D||ie>=t.TEXTURE_CUBE_MAP_POSITIVE_X&&ie<=t.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&t.framebufferTexture2D(t.FRAMEBUFFER,K,ie,Fe.__webglTexture,fe),n.bindFramebuffer(t.FRAMEBUFFER,null)}function Qe(R,w,X){if(t.bindRenderbuffer(t.RENDERBUFFER,R),w.depthBuffer){const K=w.depthTexture,ie=K&&K.isDepthTexture?K.type:null,fe=T(w.stencilBuffer,ie),_e=w.stencilBuffer?t.DEPTH_STENCIL_ATTACHMENT:t.DEPTH_ATTACHMENT;zt(w)?o.renderbufferStorageMultisampleEXT(t.RENDERBUFFER,Ct(w),fe,w.width,w.height):X?t.renderbufferStorageMultisample(t.RENDERBUFFER,Ct(w),fe,w.width,w.height):t.renderbufferStorage(t.RENDERBUFFER,fe,w.width,w.height),t.framebufferRenderbuffer(t.FRAMEBUFFER,_e,t.RENDERBUFFER,R)}else{const K=w.textures;for(let ie=0;ie<K.length;ie++){const fe=K[ie],_e=s.convert(fe.format,fe.colorSpace),re=s.convert(fe.type),oe=y(fe.internalFormat,_e,re,fe.normalized,fe.colorSpace);zt(w)?o.renderbufferStorageMultisampleEXT(t.RENDERBUFFER,Ct(w),oe,w.width,w.height):X?t.renderbufferStorageMultisample(t.RENDERBUFFER,Ct(w),oe,w.width,w.height):t.renderbufferStorage(t.RENDERBUFFER,oe,w.width,w.height)}}t.bindRenderbuffer(t.RENDERBUFFER,null)}function ze(R,w,X){const K=w.isWebGLCubeRenderTarget===!0;if(n.bindFramebuffer(t.FRAMEBUFFER,R),!(w.depthTexture&&w.depthTexture.isDepthTexture))throw new Error("THREE.WebGLTextures: renderTarget.depthTexture must be an instance of THREE.DepthTexture.");const ie=i.get(w.depthTexture);if(ie.__renderTarget=w,(!ie.__webglTexture||w.depthTexture.image.width!==w.width||w.depthTexture.image.height!==w.height)&&(w.depthTexture.image.width=w.width,w.depthTexture.image.height=w.height,w.depthTexture.needsUpdate=!0),K){if(ie.__webglInit===void 0&&(ie.__webglInit=!0,w.depthTexture.addEventListener("dispose",C)),ie.__webglTexture===void 0){ie.__webglTexture=t.createTexture(),n.bindTexture(t.TEXTURE_CUBE_MAP,ie.__webglTexture),$e(t.TEXTURE_CUBE_MAP,w.depthTexture);const he=s.convert(w.depthTexture.format),Fe=s.convert(w.depthTexture.type);let xe;w.depthTexture.format===Lr?xe=t.DEPTH_COMPONENT24:w.depthTexture.format===Rs&&(xe=t.DEPTH24_STENCIL8);for(let me=0;me<6;me++)t.texImage2D(t.TEXTURE_CUBE_MAP_POSITIVE_X+me,0,xe,w.width,w.height,0,he,Fe,null)}}else k(w.depthTexture,0);const fe=ie.__webglTexture,_e=Ct(w),re=K?t.TEXTURE_CUBE_MAP_POSITIVE_X+X:t.TEXTURE_2D,oe=w.depthTexture.format===Rs?t.DEPTH_STENCIL_ATTACHMENT:t.DEPTH_ATTACHMENT;if(w.depthTexture.format===Lr)zt(w)?o.framebufferTexture2DMultisampleEXT(t.FRAMEBUFFER,oe,re,fe,0,_e):t.framebufferTexture2D(t.FRAMEBUFFER,oe,re,fe,0);else if(w.depthTexture.format===Rs)zt(w)?o.framebufferTexture2DMultisampleEXT(t.FRAMEBUFFER,oe,re,fe,0,_e):t.framebufferTexture2D(t.FRAMEBUFFER,oe,re,fe,0);else throw new Error("THREE.WebGLTextures: Unknown depthTexture format.")}function et(R){const w=i.get(R),X=R.isWebGLCubeRenderTarget===!0;if(w.__boundDepthTexture!==R.depthTexture){const K=R.depthTexture;if(w.__depthDisposeCallback&&w.__depthDisposeCallback(),K){const ie=()=>{delete w.__boundDepthTexture,delete w.__depthDisposeCallback,K.removeEventListener("dispose",ie)};K.addEventListener("dispose",ie),w.__depthDisposeCallback=ie}w.__boundDepthTexture=K}if(R.depthTexture&&!w.__autoAllocateDepthBuffer)if(X)for(let K=0;K<6;K++)ze(w.__webglFramebuffer[K],R,K);else{const K=R.texture.mipmaps;K&&K.length>0?ze(w.__webglFramebuffer[0],R,0):ze(w.__webglFramebuffer,R,0)}else if(X){w.__webglDepthbuffer=[];for(let K=0;K<6;K++)if(n.bindFramebuffer(t.FRAMEBUFFER,w.__webglFramebuffer[K]),w.__webglDepthbuffer[K]===void 0)w.__webglDepthbuffer[K]=t.createRenderbuffer(),Qe(w.__webglDepthbuffer[K],R,!1);else{const ie=R.stencilBuffer?t.DEPTH_STENCIL_ATTACHMENT:t.DEPTH_ATTACHMENT,fe=w.__webglDepthbuffer[K];t.bindRenderbuffer(t.RENDERBUFFER,fe),t.framebufferRenderbuffer(t.FRAMEBUFFER,ie,t.RENDERBUFFER,fe)}}else{const K=R.texture.mipmaps;if(K&&K.length>0?n.bindFramebuffer(t.FRAMEBUFFER,w.__webglFramebuffer[0]):n.bindFramebuffer(t.FRAMEBUFFER,w.__webglFramebuffer),w.__webglDepthbuffer===void 0)w.__webglDepthbuffer=t.createRenderbuffer(),Qe(w.__webglDepthbuffer,R,!1);else{const ie=R.stencilBuffer?t.DEPTH_STENCIL_ATTACHMENT:t.DEPTH_ATTACHMENT,fe=w.__webglDepthbuffer;t.bindRenderbuffer(t.RENDERBUFFER,fe),t.framebufferRenderbuffer(t.FRAMEBUFFER,ie,t.RENDERBUFFER,fe)}}n.bindFramebuffer(t.FRAMEBUFFER,null)}function ot(R,w,X){const K=i.get(R);w!==void 0&&Re(K.__webglFramebuffer,R,R.texture,t.COLOR_ATTACHMENT0,t.TEXTURE_2D,0),X!==void 0&&et(R)}function yt(R){const w=R.texture,X=i.get(R),K=i.get(w);R.addEventListener("dispose",x);const ie=R.textures,fe=R.isWebGLCubeRenderTarget===!0,_e=ie.length>1;if(_e||(K.__webglTexture===void 0&&(K.__webglTexture=t.createTexture()),K.__version=w.version,a.memory.textures++),fe){X.__webglFramebuffer=[];for(let re=0;re<6;re++)if(w.mipmaps&&w.mipmaps.length>0){X.__webglFramebuffer[re]=[];for(let oe=0;oe<w.mipmaps.length;oe++)X.__webglFramebuffer[re][oe]=t.createFramebuffer()}else X.__webglFramebuffer[re]=t.createFramebuffer()}else{if(w.mipmaps&&w.mipmaps.length>0){X.__webglFramebuffer=[];for(let re=0;re<w.mipmaps.length;re++)X.__webglFramebuffer[re]=t.createFramebuffer()}else X.__webglFramebuffer=t.createFramebuffer();if(_e)for(let re=0,oe=ie.length;re<oe;re++){const he=i.get(ie[re]);he.__webglTexture===void 0&&(he.__webglTexture=t.createTexture(),a.memory.textures++)}if(R.samples>0&&zt(R)===!1){X.__webglMultisampledFramebuffer=t.createFramebuffer(),X.__webglColorRenderbuffer=[],n.bindFramebuffer(t.FRAMEBUFFER,X.__webglMultisampledFramebuffer);for(let re=0;re<ie.length;re++){const oe=ie[re];X.__webglColorRenderbuffer[re]=t.createRenderbuffer(),t.bindRenderbuffer(t.RENDERBUFFER,X.__webglColorRenderbuffer[re]);const he=s.convert(oe.format,oe.colorSpace),Fe=s.convert(oe.type),xe=y(oe.internalFormat,he,Fe,oe.normalized,oe.colorSpace,R.isXRRenderTarget===!0),me=Ct(R);t.renderbufferStorageMultisample(t.RENDERBUFFER,me,xe,R.width,R.height),t.framebufferRenderbuffer(t.FRAMEBUFFER,t.COLOR_ATTACHMENT0+re,t.RENDERBUFFER,X.__webglColorRenderbuffer[re])}t.bindRenderbuffer(t.RENDERBUFFER,null),R.depthBuffer&&(X.__webglDepthRenderbuffer=t.createRenderbuffer(),Qe(X.__webglDepthRenderbuffer,R,!0)),n.bindFramebuffer(t.FRAMEBUFFER,null)}}if(fe){n.bindTexture(t.TEXTURE_CUBE_MAP,K.__webglTexture),$e(t.TEXTURE_CUBE_MAP,w);for(let re=0;re<6;re++)if(w.mipmaps&&w.mipmaps.length>0)for(let oe=0;oe<w.mipmaps.length;oe++)Re(X.__webglFramebuffer[re][oe],R,w,t.COLOR_ATTACHMENT0,t.TEXTURE_CUBE_MAP_POSITIVE_X+re,oe);else Re(X.__webglFramebuffer[re],R,w,t.COLOR_ATTACHMENT0,t.TEXTURE_CUBE_MAP_POSITIVE_X+re,0);d(w)&&m(t.TEXTURE_CUBE_MAP),n.unbindTexture()}else if(_e){for(let re=0,oe=ie.length;re<oe;re++){const he=ie[re],Fe=i.get(he);let xe=t.TEXTURE_2D;(R.isWebGL3DRenderTarget||R.isWebGLArrayRenderTarget)&&(xe=R.isWebGL3DRenderTarget?t.TEXTURE_3D:t.TEXTURE_2D_ARRAY),n.bindTexture(xe,Fe.__webglTexture),$e(xe,he),Re(X.__webglFramebuffer,R,he,t.COLOR_ATTACHMENT0+re,xe,0),d(he)&&m(xe)}n.unbindTexture()}else{let re=t.TEXTURE_2D;if((R.isWebGL3DRenderTarget||R.isWebGLArrayRenderTarget)&&(re=R.isWebGL3DRenderTarget?t.TEXTURE_3D:t.TEXTURE_2D_ARRAY),n.bindTexture(re,K.__webglTexture),$e(re,w),w.mipmaps&&w.mipmaps.length>0)for(let oe=0;oe<w.mipmaps.length;oe++)Re(X.__webglFramebuffer[oe],R,w,t.COLOR_ATTACHMENT0,re,oe);else Re(X.__webglFramebuffer,R,w,t.COLOR_ATTACHMENT0,re,0);d(w)&&m(re),n.unbindTexture()}R.depthBuffer&&et(R)}function rt(R){const w=R.textures;for(let X=0,K=w.length;X<K;X++){const ie=w[X];if(d(ie)){const fe=M(R),_e=i.get(ie).__webglTexture;n.bindTexture(fe,_e),m(fe),n.unbindTexture()}}}const Pt=[],Bt=[];function pn(R){if(R.samples>0){if(zt(R)===!1){const w=R.textures,X=R.width,K=R.height;let ie=t.COLOR_BUFFER_BIT;const fe=R.stencilBuffer?t.DEPTH_STENCIL_ATTACHMENT:t.DEPTH_ATTACHMENT,_e=i.get(R),re=w.length>1;if(re)for(let he=0;he<w.length;he++)n.bindFramebuffer(t.FRAMEBUFFER,_e.__webglMultisampledFramebuffer),t.framebufferRenderbuffer(t.FRAMEBUFFER,t.COLOR_ATTACHMENT0+he,t.RENDERBUFFER,null),n.bindFramebuffer(t.FRAMEBUFFER,_e.__webglFramebuffer),t.framebufferTexture2D(t.DRAW_FRAMEBUFFER,t.COLOR_ATTACHMENT0+he,t.TEXTURE_2D,null,0);n.bindFramebuffer(t.READ_FRAMEBUFFER,_e.__webglMultisampledFramebuffer);const oe=R.texture.mipmaps;oe&&oe.length>0?n.bindFramebuffer(t.DRAW_FRAMEBUFFER,_e.__webglFramebuffer[0]):n.bindFramebuffer(t.DRAW_FRAMEBUFFER,_e.__webglFramebuffer);for(let he=0;he<w.length;he++){if(R.resolveDepthBuffer&&(R.depthBuffer&&(ie|=t.DEPTH_BUFFER_BIT),R.stencilBuffer&&R.resolveStencilBuffer&&(ie|=t.STENCIL_BUFFER_BIT)),re){t.framebufferRenderbuffer(t.READ_FRAMEBUFFER,t.COLOR_ATTACHMENT0,t.RENDERBUFFER,_e.__webglColorRenderbuffer[he]);const Fe=i.get(w[he]).__webglTexture;t.framebufferTexture2D(t.DRAW_FRAMEBUFFER,t.COLOR_ATTACHMENT0,t.TEXTURE_2D,Fe,0)}t.blitFramebuffer(0,0,X,K,0,0,X,K,ie,t.NEAREST),l===!0&&(Pt.length=0,Bt.length=0,Pt.push(t.COLOR_ATTACHMENT0+he),R.depthBuffer&&R.storeMultisampledDepthBuffer===!1&&(Pt.push(fe),Bt.push(fe),t.invalidateFramebuffer(t.DRAW_FRAMEBUFFER,Bt)),t.invalidateFramebuffer(t.READ_FRAMEBUFFER,Pt))}if(n.bindFramebuffer(t.READ_FRAMEBUFFER,null),n.bindFramebuffer(t.DRAW_FRAMEBUFFER,null),re)for(let he=0;he<w.length;he++){n.bindFramebuffer(t.FRAMEBUFFER,_e.__webglMultisampledFramebuffer),t.framebufferRenderbuffer(t.FRAMEBUFFER,t.COLOR_ATTACHMENT0+he,t.RENDERBUFFER,_e.__webglColorRenderbuffer[he]);const Fe=i.get(w[he]).__webglTexture;n.bindFramebuffer(t.FRAMEBUFFER,_e.__webglFramebuffer),t.framebufferTexture2D(t.DRAW_FRAMEBUFFER,t.COLOR_ATTACHMENT0+he,t.TEXTURE_2D,Fe,0)}n.bindFramebuffer(t.DRAW_FRAMEBUFFER,_e.__webglMultisampledFramebuffer)}else if(R.depthBuffer&&R.storeMultisampledDepthBuffer===!1&&l){const w=R.stencilBuffer?t.DEPTH_STENCIL_ATTACHMENT:t.DEPTH_ATTACHMENT;t.invalidateFramebuffer(t.DRAW_FRAMEBUFFER,[w])}}}function Ct(R){return Math.min(r.maxSamples,R.samples)}function zt(R){const w=i.get(R);return R.samples>0&&e.has("WEBGL_multisampled_render_to_texture")===!0&&w.__useRenderToTexture!==!1}function V(R){const w=a.render.frame;h.get(R)!==w&&(h.set(R,w),R.update())}function Yt(R,w){const X=R.colorSpace,K=R.format,ie=R.type;return R.isCompressedTexture===!0||R.isVideoTexture===!0||X!==Jc&&X!==Yr&&(ft.getTransfer(X)===Tt?(K!==Ui||ie!==ni)&&Ve("WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):gt("WebGLTextures: Unsupported texture color space:",X)),w}function ht(R){return typeof HTMLImageElement<"u"&&R instanceof HTMLImageElement?(c.width=R.naturalWidth||R.width,c.height=R.naturalHeight||R.height):typeof VideoFrame<"u"&&R instanceof VideoFrame?(c.width=R.displayWidth,c.height=R.displayHeight):(c.width=R.width,c.height=R.height),c}this.allocateTextureUnit=N,this.resetTextureUnits=F,this.getTextureUnits=U,this.setTextureUnits=W,this.setTexture2D=k,this.setTexture2DArray=j,this.setTexture3D=L,this.setTextureCube=$,this.rebindTextures=ot,this.setupRenderTarget=yt,this.updateRenderTargetMipmap=rt,this.updateMultisampleRenderTarget=pn,this.setupDepthRenderbuffer=et,this.setupFrameBufferTexture=Re,this.useMultisampledRTT=zt,this.isReversedDepthBuffer=function(){return n.buffers.depth.getReversed()}}function uC(t,e){function n(i,r=Yr){let s;const a=ft.getTransfer(r);if(i===ni)return t.UNSIGNED_BYTE;if(i===Np)return t.UNSIGNED_SHORT_4_4_4_4;if(i===Lp)return t.UNSIGNED_SHORT_5_5_5_1;if(i===_x)return t.UNSIGNED_INT_5_9_9_9_REV;if(i===vx)return t.UNSIGNED_INT_10F_11F_11F_REV;if(i===mx)return t.BYTE;if(i===gx)return t.SHORT;if(i===nl)return t.UNSIGNED_SHORT;if(i===Pp)return t.INT;if(i===or)return t.UNSIGNED_INT;if(i===nr)return t.FLOAT;if(i===lr)return t.HALF_FLOAT;if(i===xx)return t.ALPHA;if(i===yx)return t.RGB;if(i===Ui)return t.RGBA;if(i===Lr)return t.DEPTH_COMPONENT;if(i===Rs)return t.DEPTH_STENCIL;if(i===Sx)return t.RED;if(i===Dp)return t.RED_INTEGER;if(i===Bs)return t.RG;if(i===Ip)return t.RG_INTEGER;if(i===Up)return t.RGBA_INTEGER;if(i===yc||i===Sc||i===Mc||i===Ec)if(a===Tt)if(s=e.get("WEBGL_compressed_texture_s3tc_srgb"),s!==null){if(i===yc)return s.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(i===Sc)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(i===Mc)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(i===Ec)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(s=e.get("WEBGL_compressed_texture_s3tc"),s!==null){if(i===yc)return s.COMPRESSED_RGB_S3TC_DXT1_EXT;if(i===Sc)return s.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(i===Mc)return s.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(i===Ec)return s.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(i===qf||i===Yf||i===Kf||i===Zf)if(s=e.get("WEBGL_compressed_texture_pvrtc"),s!==null){if(i===qf)return s.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(i===Yf)return s.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(i===Kf)return s.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(i===Zf)return s.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(i===Qf||i===Jf||i===eh||i===th||i===nh||i===Zc||i===ih)if(s=e.get("WEBGL_compressed_texture_etc"),s!==null){if(i===Qf||i===Jf)return a===Tt?s.COMPRESSED_SRGB8_ETC2:s.COMPRESSED_RGB8_ETC2;if(i===eh)return a===Tt?s.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:s.COMPRESSED_RGBA8_ETC2_EAC;if(i===th)return s.COMPRESSED_R11_EAC;if(i===nh)return s.COMPRESSED_SIGNED_R11_EAC;if(i===Zc)return s.COMPRESSED_RG11_EAC;if(i===ih)return s.COMPRESSED_SIGNED_RG11_EAC}else return null;if(i===rh||i===sh||i===ah||i===oh||i===lh||i===ch||i===uh||i===dh||i===fh||i===hh||i===ph||i===mh||i===gh||i===_h)if(s=e.get("WEBGL_compressed_texture_astc"),s!==null){if(i===rh)return a===Tt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:s.COMPRESSED_RGBA_ASTC_4x4_KHR;if(i===sh)return a===Tt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:s.COMPRESSED_RGBA_ASTC_5x4_KHR;if(i===ah)return a===Tt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:s.COMPRESSED_RGBA_ASTC_5x5_KHR;if(i===oh)return a===Tt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:s.COMPRESSED_RGBA_ASTC_6x5_KHR;if(i===lh)return a===Tt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:s.COMPRESSED_RGBA_ASTC_6x6_KHR;if(i===ch)return a===Tt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:s.COMPRESSED_RGBA_ASTC_8x5_KHR;if(i===uh)return a===Tt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:s.COMPRESSED_RGBA_ASTC_8x6_KHR;if(i===dh)return a===Tt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:s.COMPRESSED_RGBA_ASTC_8x8_KHR;if(i===fh)return a===Tt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:s.COMPRESSED_RGBA_ASTC_10x5_KHR;if(i===hh)return a===Tt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:s.COMPRESSED_RGBA_ASTC_10x6_KHR;if(i===ph)return a===Tt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:s.COMPRESSED_RGBA_ASTC_10x8_KHR;if(i===mh)return a===Tt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:s.COMPRESSED_RGBA_ASTC_10x10_KHR;if(i===gh)return a===Tt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:s.COMPRESSED_RGBA_ASTC_12x10_KHR;if(i===_h)return a===Tt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:s.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(i===vh||i===xh||i===yh)if(s=e.get("EXT_texture_compression_bptc"),s!==null){if(i===vh)return a===Tt?s.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:s.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(i===xh)return s.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(i===yh)return s.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(i===Sh||i===Mh||i===Qc||i===Eh)if(s=e.get("EXT_texture_compression_rgtc"),s!==null){if(i===Sh)return s.COMPRESSED_RED_RGTC1_EXT;if(i===Mh)return s.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(i===Qc)return s.COMPRESSED_RED_GREEN_RGTC2_EXT;if(i===Eh)return s.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return i===il?t.UNSIGNED_INT_24_8:t[i]!==void 0?t[i]:null}return{convert:n}}const dC=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,fC=`
uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepth = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepth = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}`;class hC{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(e,n){if(this.texture===null){const i=new Px(e.texture);(e.depthNear!==n.depthNear||e.depthFar!==n.depthFar)&&(this.depthNear=e.depthNear,this.depthFar=e.depthFar),this.texture=i}}getMesh(e){if(this.texture!==null&&this.mesh===null){const n=e.cameras[0].viewport,i=new cr({vertexShader:dC,fragmentShader:fC,uniforms:{depthColor:{value:this.texture},depthWidth:{value:n.z},depthHeight:{value:n.w}}});this.mesh=new Be(new Va(20,20),i)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}}class pC extends ps{constructor(e,n){super();const i=this;let r=null,s=1,a=null,o="local-floor",l=1,c=null,h=null,p=null,f=null,g=null,v=null;const S=typeof XRWebGLBinding<"u",_=new hC,d={},m=n.getContextAttributes();let M=null,y=null;const T=[],E=[],C=new We;let x=null,b=null;const P=new Gn;P.viewport=new Gt;const D=new Gn;D.viewport=new Gt;const O=[P,D],F=new yw;let U=null,W=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(Q){let ee=T[Q];return ee===void 0&&(ee=new xd,T[Q]=ee),ee.getTargetRaySpace()},this.getControllerGrip=function(Q){let ee=T[Q];return ee===void 0&&(ee=new xd,T[Q]=ee),ee.getGripSpace()},this.getHand=function(Q){let ee=T[Q];return ee===void 0&&(ee=new xd,T[Q]=ee),ee.getHandSpace()};function N(Q){const ee=E.indexOf(Q.inputSource);if(ee===-1)return;const Ne=T[ee];Ne!==void 0&&(Ne.update(Q.inputSource,Q.frame,c||a),Ne.dispatchEvent({type:Q.type,data:Q.inputSource}))}function z(){r.removeEventListener("select",N),r.removeEventListener("selectstart",N),r.removeEventListener("selectend",N),r.removeEventListener("squeeze",N),r.removeEventListener("squeezestart",N),r.removeEventListener("squeezeend",N),r.removeEventListener("end",z),r.removeEventListener("inputsourceschange",k);for(let Q=0;Q<T.length;Q++){const ee=E[Q];ee!==null&&(E[Q]=null,T[Q].disconnect(ee))}U=null,W=null,_.reset();for(const Q in d)delete d[Q];if(e.setRenderTarget(M),g=null,f=null,p=null,r=null,y=null,Ze.stop(),i.isPresenting=!1,e.setPixelRatio(x),e.setSize(C.width,C.height,!1),b!==null){const Q=b.camera;Q.fov=b.fov,Q.zoom=b.zoom,Q.updateProjectionMatrix(),b=null}i.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(Q){s=Q,i.isPresenting===!0&&Ve("WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(Q){o=Q,i.isPresenting===!0&&Ve("WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return c||a},this.setReferenceSpace=function(Q){c=Q},this.getBaseLayer=function(){return f!==null?f:g},this.getBinding=function(){return p===null&&S&&(p=new XRWebGLBinding(r,n)),p},this.getFrame=function(){return v},this.getSession=function(){return r},this.setSession=async function(Q){if(r=Q,r!==null){if(M=e.getRenderTarget(),r.addEventListener("select",N),r.addEventListener("selectstart",N),r.addEventListener("selectend",N),r.addEventListener("squeeze",N),r.addEventListener("squeezestart",N),r.addEventListener("squeezeend",N),r.addEventListener("end",z),r.addEventListener("inputsourceschange",k),m.xrCompatible!==!0&&await n.makeXRCompatible(),x=e.getPixelRatio(),e.getSize(C),S&&"createProjectionLayer"in XRWebGLBinding.prototype){let Ne=null,je=null,Re=null;m.depth&&(Re=m.stencil?n.DEPTH24_STENCIL8:n.DEPTH_COMPONENT24,Ne=m.stencil?Rs:Lr,je=m.stencil?il:or);const Qe={colorFormat:n.RGBA8,depthFormat:Re,scaleFactor:s};p=this.getBinding(),f=p.createProjectionLayer(Qe),r.updateRenderState({layers:[f]}),e.setPixelRatio(1),e.setSize(f.textureWidth,f.textureHeight,!1),y=new ki(f.textureWidth,f.textureHeight,{format:Ui,type:ni,depthTexture:new sl(f.textureWidth,f.textureHeight,je,void 0,void 0,void 0,void 0,void 0,void 0,Ne),stencilBuffer:m.stencil,colorSpace:e.outputColorSpace,samples:m.antialias?4:0,resolveDepthBuffer:f.ignoreDepthValues===!1,resolveStencilBuffer:f.ignoreDepthValues===!1,storeMultisampledDepthBuffer:f.ignoreDepthValues===!1,storeMultisampledStencilBuffer:f.ignoreDepthValues===!1})}else{const Ne={antialias:m.antialias,alpha:!0,depth:m.depth,stencil:m.stencil,framebufferScaleFactor:s};g=new XRWebGLLayer(r,n,Ne),r.updateRenderState({baseLayer:g}),e.setPixelRatio(1),e.setSize(g.framebufferWidth,g.framebufferHeight,!1),y=new ki(g.framebufferWidth,g.framebufferHeight,{format:Ui,type:ni,colorSpace:e.outputColorSpace,stencilBuffer:m.stencil,resolveDepthBuffer:g.ignoreDepthValues===!1,resolveStencilBuffer:g.ignoreDepthValues===!1,storeMultisampledDepthBuffer:g.ignoreDepthValues===!1,storeMultisampledStencilBuffer:g.ignoreDepthValues===!1})}y.isXRRenderTarget=!0,this.setFoveation(l),c=null,a=await r.requestReferenceSpace(o),Ze.setContext(r),Ze.start(),i.isPresenting=!0,i.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(r!==null)return r.environmentBlendMode},this.getDepthTexture=function(){return _.getDepthTexture()};function k(Q){for(let ee=0;ee<Q.removed.length;ee++){const Ne=Q.removed[ee],je=E.indexOf(Ne);je>=0&&(E[je]=null,T[je].disconnect(Ne))}for(let ee=0;ee<Q.added.length;ee++){const Ne=Q.added[ee];let je=E.indexOf(Ne);if(je===-1){for(let Qe=0;Qe<T.length;Qe++)if(Qe>=E.length){E.push(Ne),je=Qe;break}else if(E[Qe]===null){E[Qe]=Ne,je=Qe;break}if(je===-1)break}const Re=T[je];Re&&Re.connect(Ne)}}const j=new I,L=new I;function $(Q,ee,Ne){j.setFromMatrixPosition(ee.matrixWorld),L.setFromMatrixPosition(Ne.matrixWorld);const je=j.distanceTo(L),Re=ee.projectionMatrix.elements,Qe=Ne.projectionMatrix.elements,ze=Re[14]/(Re[10]-1),et=Re[14]/(Re[10]+1),ot=(Re[9]+1)/Re[5],yt=(Re[9]-1)/Re[5],rt=(Re[8]-1)/Re[0],Pt=(Qe[8]+1)/Qe[0],Bt=ze*rt,pn=ze*Pt,Ct=je/(-rt+Pt),zt=Ct*-rt;if(ee.matrixWorld.decompose(Q.position,Q.quaternion,Q.scale),Q.translateX(zt),Q.translateZ(Ct),Q.matrixWorld.compose(Q.position,Q.quaternion,Q.scale),Q.matrixWorldInverse.copy(Q.matrixWorld).invert(),Re[10]===-1)Q.projectionMatrix.copy(ee.projectionMatrix),Q.projectionMatrixInverse.copy(ee.projectionMatrixInverse);else{const V=ze+Ct,Yt=et+Ct,ht=Bt-zt,R=pn+(je-zt),w=ot*et/Yt*V,X=yt*et/Yt*V;Q.projectionMatrix.makePerspective(ht,R,w,X,V,Yt),Q.projectionMatrixInverse.copy(Q.projectionMatrix).invert()}}function de(Q,ee){ee===null?Q.matrixWorld.copy(Q.matrix):Q.matrixWorld.multiplyMatrices(ee.matrixWorld,Q.matrix),Q.matrixWorldInverse.copy(Q.matrixWorld).invert()}this.updateCamera=function(Q){if(r===null)return;let ee=Q.near,Ne=Q.far;_.texture!==null&&(_.depthNear>0&&(ee=_.depthNear),_.depthFar>0&&(Ne=_.depthFar)),F.near=D.near=P.near=ee,F.far=D.far=P.far=Ne,(U!==F.near||W!==F.far)&&(r.updateRenderState({depthNear:F.near,depthFar:F.far}),U=F.near,W=F.far),F.layers.mask=Q.layers.mask|6,P.layers.mask=F.layers.mask&-5,D.layers.mask=F.layers.mask&-3;const je=Q.parent,Re=F.cameras;de(F,je);for(let Qe=0;Qe<Re.length;Qe++)de(Re[Qe],je);Re.length===2?$(F,P,D):F.projectionMatrix.copy(P.projectionMatrix),b===null&&Q.isPerspectiveCamera&&(b={camera:Q,fov:Q.fov,zoom:Q.zoom}),we(Q,F,je)};function we(Q,ee,Ne){Ne===null?Q.matrix.copy(ee.matrixWorld):(Q.matrix.copy(Ne.matrixWorld),Q.matrix.invert(),Q.matrix.multiply(ee.matrixWorld)),Q.matrix.decompose(Q.position,Q.quaternion,Q.scale),Q.updateMatrixWorld(!0),Q.projectionMatrix.copy(ee.projectionMatrix),Q.projectionMatrixInverse.copy(ee.projectionMatrixInverse),Q.isPerspectiveCamera&&(Q.fov=Th*2*Math.atan(1/Q.projectionMatrix.elements[5]),Q.zoom=1)}this.getCamera=function(){return F},this.getFoveation=function(){if(!(f===null&&g===null))return l},this.setFoveation=function(Q){l=Q,f!==null&&(f.fixedFoveation=Q),g!==null&&g.fixedFoveation!==void 0&&(g.fixedFoveation=Q)},this.hasDepthSensing=function(){return _.texture!==null},this.getDepthSensingMesh=function(){return _.getMesh(F)},this.getCameraTexture=function(Q){return d[Q]};let Ke=null;function $e(Q,ee){if(h=ee.getViewerPose(c||a),v=ee,h!==null){const Ne=h.views;g!==null&&(e.setRenderTargetFramebuffer(y,g.framebuffer),e.setRenderTarget(y));let je=!1;Ne.length!==F.cameras.length&&(F.cameras.length=0,je=!0);for(let et=0;et<Ne.length;et++){const ot=Ne[et];let yt=null;if(g!==null)yt=g.getViewport(ot);else{const Pt=p.getViewSubImage(f,ot);yt=Pt.viewport,et===0&&(e.setRenderTargetTextures(y,Pt.colorTexture,Pt.depthStencilTexture),e.setRenderTarget(y))}let rt=O[et];rt===void 0&&(rt=new Gn,rt.layers.enable(et),rt.viewport=new Gt,O[et]=rt),rt.matrix.fromArray(ot.transform.matrix),rt.matrix.decompose(rt.position,rt.quaternion,rt.scale),rt.projectionMatrix.fromArray(ot.projectionMatrix),rt.projectionMatrixInverse.copy(rt.projectionMatrix).invert(),rt.viewport.set(yt.x,yt.y,yt.width,yt.height),et===0&&(F.matrix.copy(rt.matrix),F.matrix.decompose(F.position,F.quaternion,F.scale)),je===!0&&F.cameras.push(rt)}const Re=r.enabledFeatures;if(Re&&Re.includes("depth-sensing")&&r.depthUsage=="gpu-optimized"&&S){p=i.getBinding();const et=p.getDepthInformation(Ne[0]);et&&et.isValid&&et.texture&&_.init(et,r.renderState)}if(Re&&Re.includes("camera-access")&&S){e.state.unbindTexture(),p=i.getBinding();for(let et=0;et<Ne.length;et++){const ot=Ne[et].camera;if(ot){let yt=d[ot];yt||(yt=new Px,d[ot]=yt);const rt=p.getCameraImage(ot);yt.sourceTexture=rt}}}}for(let Ne=0;Ne<T.length;Ne++){const je=E[Ne],Re=T[Ne];je!==null&&Re!==void 0&&Re.update(je,ee,c||a)}Ke&&Ke(Q,ee),ee.detectedPlanes&&i.dispatchEvent({type:"planesdetected",data:ee}),v=null}const Ze=new Ux;Ze.setAnimationLoop($e),this.setAnimationLoop=function(Q){Ke=Q},this.dispose=function(){}}}const mC=new kt,Vx=new Ye;Vx.set(-1,0,0,0,1,0,0,0,1);function gC(t,e){function n(_,d){_.matrixAutoUpdate===!0&&_.updateMatrix(),d.value.copy(_.matrix)}function i(_,d){d.color.getRGB(_.fogColor.value,Nx(t)),d.isFog?(_.fogNear.value=d.near,_.fogFar.value=d.far):d.isFogExp2&&(_.fogDensity.value=d.density)}function r(_,d,m,M,y){d.isNodeMaterial?d.uniformsNeedUpdate=!1:d.isMeshBasicMaterial?s(_,d):d.isMeshLambertMaterial?(s(_,d),d.envMap&&(_.envMapIntensity.value=d.envMapIntensity)):d.isMeshToonMaterial?(s(_,d),p(_,d)):d.isMeshPhongMaterial?(s(_,d),h(_,d),d.envMap&&(_.envMapIntensity.value=d.envMapIntensity)):d.isMeshStandardMaterial?(s(_,d),f(_,d),d.isMeshPhysicalMaterial&&g(_,d,y)):d.isMeshMatcapMaterial?(s(_,d),v(_,d)):d.isMeshDepthMaterial?s(_,d):d.isMeshDistanceMaterial?(s(_,d),S(_,d)):d.isMeshNormalMaterial?s(_,d):d.isLineBasicMaterial?(a(_,d),d.isLineDashedMaterial&&o(_,d)):d.isPointsMaterial?l(_,d,m,M):d.isSpriteMaterial?c(_,d):d.isShadowMaterial?(_.color.value.copy(d.color),_.opacity.value=d.opacity):d.isShaderMaterial&&(d.uniformsNeedUpdate=!1)}function s(_,d){_.opacity.value=d.opacity,d.color&&_.diffuse.value.copy(d.color),d.emissive&&_.emissive.value.copy(d.emissive).multiplyScalar(d.emissiveIntensity),d.map&&(_.map.value=d.map,n(d.map,_.mapTransform)),d.alphaMap&&(_.alphaMap.value=d.alphaMap,n(d.alphaMap,_.alphaMapTransform)),d.bumpMap&&(_.bumpMap.value=d.bumpMap,n(d.bumpMap,_.bumpMapTransform),_.bumpScale.value=d.bumpScale,d.side===Yn&&(_.bumpScale.value*=-1)),d.normalMap&&(_.normalMap.value=d.normalMap,n(d.normalMap,_.normalMapTransform),_.normalScale.value.copy(d.normalScale),d.side===Yn&&_.normalScale.value.negate()),d.displacementMap&&(_.displacementMap.value=d.displacementMap,n(d.displacementMap,_.displacementMapTransform),_.displacementScale.value=d.displacementScale,_.displacementBias.value=d.displacementBias),d.emissiveMap&&(_.emissiveMap.value=d.emissiveMap,n(d.emissiveMap,_.emissiveMapTransform)),d.specularMap&&(_.specularMap.value=d.specularMap,n(d.specularMap,_.specularMapTransform)),d.alphaTest>0&&(_.alphaTest.value=d.alphaTest);const m=e.get(d),M=m.envMap,y=m.envMapRotation;M&&(_.envMap.value=M,_.envMapRotation.value.setFromMatrix4(mC.makeRotationFromEuler(y)).transpose(),M.isCubeTexture&&M.isRenderTargetTexture===!1&&_.envMapRotation.value.premultiply(Vx),_.reflectivity.value=d.reflectivity,_.ior.value=d.ior,_.refractionRatio.value=d.refractionRatio),d.lightMap&&(_.lightMap.value=d.lightMap,_.lightMapIntensity.value=d.lightMapIntensity,n(d.lightMap,_.lightMapTransform)),d.aoMap&&(_.aoMap.value=d.aoMap,_.aoMapIntensity.value=d.aoMapIntensity,n(d.aoMap,_.aoMapTransform))}function a(_,d){_.diffuse.value.copy(d.color),_.opacity.value=d.opacity,d.map&&(_.map.value=d.map,n(d.map,_.mapTransform))}function o(_,d){_.dashSize.value=d.dashSize,_.totalSize.value=d.dashSize+d.gapSize,_.scale.value=d.scale}function l(_,d,m,M){_.diffuse.value.copy(d.color),_.opacity.value=d.opacity,_.size.value=d.size*m,_.scale.value=M*.5,d.map&&(_.map.value=d.map,n(d.map,_.uvTransform)),d.alphaMap&&(_.alphaMap.value=d.alphaMap,n(d.alphaMap,_.alphaMapTransform)),d.alphaTest>0&&(_.alphaTest.value=d.alphaTest)}function c(_,d){_.diffuse.value.copy(d.color),_.opacity.value=d.opacity,_.rotation.value=d.rotation,d.map&&(_.map.value=d.map,n(d.map,_.mapTransform)),d.alphaMap&&(_.alphaMap.value=d.alphaMap,n(d.alphaMap,_.alphaMapTransform)),d.alphaTest>0&&(_.alphaTest.value=d.alphaTest)}function h(_,d){_.specular.value.copy(d.specular),_.shininess.value=Math.max(d.shininess,1e-4)}function p(_,d){d.gradientMap&&(_.gradientMap.value=d.gradientMap)}function f(_,d){_.metalness.value=d.metalness,d.metalnessMap&&(_.metalnessMap.value=d.metalnessMap,n(d.metalnessMap,_.metalnessMapTransform)),_.roughness.value=d.roughness,d.roughnessMap&&(_.roughnessMap.value=d.roughnessMap,n(d.roughnessMap,_.roughnessMapTransform)),d.envMap&&(_.envMapIntensity.value=d.envMapIntensity)}function g(_,d,m){_.ior.value=d.ior,d.sheen>0&&(_.sheenColor.value.copy(d.sheenColor).multiplyScalar(d.sheen),_.sheenRoughness.value=d.sheenRoughness,d.sheenColorMap&&(_.sheenColorMap.value=d.sheenColorMap,n(d.sheenColorMap,_.sheenColorMapTransform)),d.sheenRoughnessMap&&(_.sheenRoughnessMap.value=d.sheenRoughnessMap,n(d.sheenRoughnessMap,_.sheenRoughnessMapTransform))),d.clearcoat>0&&(_.clearcoat.value=d.clearcoat,_.clearcoatRoughness.value=d.clearcoatRoughness,d.clearcoatMap&&(_.clearcoatMap.value=d.clearcoatMap,n(d.clearcoatMap,_.clearcoatMapTransform)),d.clearcoatRoughnessMap&&(_.clearcoatRoughnessMap.value=d.clearcoatRoughnessMap,n(d.clearcoatRoughnessMap,_.clearcoatRoughnessMapTransform)),d.clearcoatNormalMap&&(_.clearcoatNormalMap.value=d.clearcoatNormalMap,n(d.clearcoatNormalMap,_.clearcoatNormalMapTransform),_.clearcoatNormalScale.value.copy(d.clearcoatNormalScale),d.side===Yn&&_.clearcoatNormalScale.value.negate())),d.dispersion>0&&(_.dispersion.value=d.dispersion),d.retroreflectivity>0&&(_.retroreflectivity.value=d.retroreflectivity),d.iridescence>0&&(_.iridescence.value=d.iridescence,_.iridescenceIOR.value=d.iridescenceIOR,_.iridescenceThicknessMinimum.value=d.iridescenceThicknessRange[0],_.iridescenceThicknessMaximum.value=d.iridescenceThicknessRange[1],d.iridescenceMap&&(_.iridescenceMap.value=d.iridescenceMap,n(d.iridescenceMap,_.iridescenceMapTransform)),d.iridescenceThicknessMap&&(_.iridescenceThicknessMap.value=d.iridescenceThicknessMap,n(d.iridescenceThicknessMap,_.iridescenceThicknessMapTransform))),d.transmission>0&&(_.transmission.value=d.transmission,_.transmissionSamplerMap.value=m.texture,_.transmissionSamplerSize.value.set(m.width,m.height),d.transmissionMap&&(_.transmissionMap.value=d.transmissionMap,n(d.transmissionMap,_.transmissionMapTransform)),_.thickness.value=d.thickness,d.thicknessMap&&(_.thicknessMap.value=d.thicknessMap,n(d.thicknessMap,_.thicknessMapTransform)),_.attenuationDistance.value=d.attenuationDistance,_.attenuationColor.value.copy(d.attenuationColor)),d.anisotropy>0&&(_.anisotropyVector.value.set(d.anisotropy*Math.cos(d.anisotropyRotation),d.anisotropy*Math.sin(d.anisotropyRotation)),d.anisotropyMap&&(_.anisotropyMap.value=d.anisotropyMap,n(d.anisotropyMap,_.anisotropyMapTransform))),_.specularIntensity.value=d.specularIntensity,_.specularColor.value.copy(d.specularColor),d.specularColorMap&&(_.specularColorMap.value=d.specularColorMap,n(d.specularColorMap,_.specularColorMapTransform)),d.specularIntensityMap&&(_.specularIntensityMap.value=d.specularIntensityMap,n(d.specularIntensityMap,_.specularIntensityMapTransform))}function v(_,d){d.matcap&&(_.matcap.value=d.matcap)}function S(_,d){const m=e.get(d).light;_.referencePosition.value.setFromMatrixPosition(m.matrixWorld),_.nearDistance.value=m.shadow.camera.near,_.farDistance.value=m.shadow.camera.far}return{refreshFogUniforms:i,refreshMaterialUniforms:r}}function _C(t,e,n,i){let r={},s={},a=[];const o=t.getParameter(t.MAX_UNIFORM_BUFFER_BINDINGS);function l(y,T){const E=T.program;i.uniformBlockBinding(y,E)}function c(y,T){let E=r[y.id];E===void 0&&(_(y),E=h(y),r[y.id]=E,y.addEventListener("dispose",m));const C=T.program;i.updateUBOMapping(y,C);const x=e.render.frame;s[y.id]!==x&&(f(y),s[y.id]=x)}function h(y){const T=p();y.__bindingPointIndex=T;const E=t.createBuffer(),C=y.__size,x=y.usage;return t.bindBuffer(t.UNIFORM_BUFFER,E),t.bufferData(t.UNIFORM_BUFFER,C,x),t.bindBuffer(t.UNIFORM_BUFFER,null),t.bindBufferBase(t.UNIFORM_BUFFER,T,E),E}function p(){for(let y=0;y<o;y++)if(a.indexOf(y)===-1)return a.push(y),y;return gt("WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function f(y){const T=r[y.id],E=y.uniforms,C=y.__cache;t.bindBuffer(t.UNIFORM_BUFFER,T);for(let x=0,b=E.length;x<b;x++){const P=E[x];if(Array.isArray(P))for(let D=0,O=P.length;D<O;D++)g(P[D],x,D,C);else g(P,x,0,C)}t.bindBuffer(t.UNIFORM_BUFFER,null)}function g(y,T,E,C){if(S(y,T,E,C)===!0){const x=y.__offset,b=y.value;if(Array.isArray(b)){let P=0;for(let D=0;D<b.length;D++){const O=b[D],F=d(O);v(O,y.__data,P),typeof O!="number"&&typeof O!="boolean"&&!O.isMatrix3&&!ArrayBuffer.isView(O)&&(P+=F.storage/Float32Array.BYTES_PER_ELEMENT)}}else v(b,y.__data,0);t.bufferSubData(t.UNIFORM_BUFFER,x,y.__data)}}function v(y,T,E){typeof y=="number"||typeof y=="boolean"?T[0]=y:y.isMatrix3?(T[0]=y.elements[0],T[1]=y.elements[1],T[2]=y.elements[2],T[3]=0,T[4]=y.elements[3],T[5]=y.elements[4],T[6]=y.elements[5],T[7]=0,T[8]=y.elements[6],T[9]=y.elements[7],T[10]=y.elements[8],T[11]=0):ArrayBuffer.isView(y)?T.set(new y.constructor(y.buffer,y.byteOffset,T.length)):y.toArray(T,E)}function S(y,T,E,C){const x=y.value,b=T+"_"+E;if(C[b]===void 0)return typeof x=="number"||typeof x=="boolean"?C[b]=x:ArrayBuffer.isView(x)?C[b]=x.slice():C[b]=x.clone(),!0;{const P=C[b];if(typeof x=="number"||typeof x=="boolean"){if(P!==x)return C[b]=x,!0}else{if(ArrayBuffer.isView(x))return!0;if(P.equals(x)===!1)return P.copy(x),!0}}return!1}function _(y){const T=y.uniforms;let E=0;const C=16;for(let b=0,P=T.length;b<P;b++){const D=Array.isArray(T[b])?T[b]:[T[b]];for(let O=0,F=D.length;O<F;O++){const U=D[O],W=Array.isArray(U.value)?U.value:[U.value];for(let N=0,z=W.length;N<z;N++){const k=W[N],j=d(k),L=E%C,$=L%j.boundary,de=L+$;E+=$,de!==0&&C-de<j.storage&&(E+=C-de),U.__data=new Float32Array(j.storage/Float32Array.BYTES_PER_ELEMENT),U.__offset=E,E+=j.storage}}}const x=E%C;return x>0&&(E+=C-x),y.__size=E,y.__cache={},this}function d(y){const T={boundary:0,storage:0};return typeof y=="number"||typeof y=="boolean"?(T.boundary=4,T.storage=4):y.isVector2?(T.boundary=8,T.storage=8):y.isVector3||y.isColor?(T.boundary=16,T.storage=12):y.isVector4?(T.boundary=16,T.storage=16):y.isMatrix3?(T.boundary=48,T.storage=48):y.isMatrix4?(T.boundary=64,T.storage=64):y.isTexture?Ve("WebGLRenderer: Texture samplers can not be part of an uniforms group."):ArrayBuffer.isView(y)?(T.boundary=16,T.storage=y.byteLength):Ve("WebGLRenderer: Unsupported uniform value type.",y),T}function m(y){const T=y.target;T.removeEventListener("dispose",m);const E=a.indexOf(T.__bindingPointIndex);a.splice(E,1),t.deleteBuffer(r[T.id]),delete r[T.id],delete s[T.id]}function M(){for(const y in r)t.deleteBuffer(r[y]);a=[],r={},s={}}return{bind:l,update:c,dispose:M}}const vC=new Uint16Array([12469,15057,12620,14925,13266,14620,13807,14376,14323,13990,14545,13625,14713,13328,14840,12882,14931,12528,14996,12233,15039,11829,15066,11525,15080,11295,15085,10976,15082,10705,15073,10495,13880,14564,13898,14542,13977,14430,14158,14124,14393,13732,14556,13410,14702,12996,14814,12596,14891,12291,14937,11834,14957,11489,14958,11194,14943,10803,14921,10506,14893,10278,14858,9960,14484,14039,14487,14025,14499,13941,14524,13740,14574,13468,14654,13106,14743,12678,14818,12344,14867,11893,14889,11509,14893,11180,14881,10751,14852,10428,14812,10128,14765,9754,14712,9466,14764,13480,14764,13475,14766,13440,14766,13347,14769,13070,14786,12713,14816,12387,14844,11957,14860,11549,14868,11215,14855,10751,14825,10403,14782,10044,14729,9651,14666,9352,14599,9029,14967,12835,14966,12831,14963,12804,14954,12723,14936,12564,14917,12347,14900,11958,14886,11569,14878,11247,14859,10765,14828,10401,14784,10011,14727,9600,14660,9289,14586,8893,14508,8533,15111,12234,15110,12234,15104,12216,15092,12156,15067,12010,15028,11776,14981,11500,14942,11205,14902,10752,14861,10393,14812,9991,14752,9570,14682,9252,14603,8808,14519,8445,14431,8145,15209,11449,15208,11451,15202,11451,15190,11438,15163,11384,15117,11274,15055,10979,14994,10648,14932,10343,14871,9936,14803,9532,14729,9218,14645,8742,14556,8381,14461,8020,14365,7603,15273,10603,15272,10607,15267,10619,15256,10631,15231,10614,15182,10535,15118,10389,15042,10167,14963,9787,14883,9447,14800,9115,14710,8665,14615,8318,14514,7911,14411,7507,14279,7198,15314,9675,15313,9683,15309,9712,15298,9759,15277,9797,15229,9773,15166,9668,15084,9487,14995,9274,14898,8910,14800,8539,14697,8234,14590,7790,14479,7409,14367,7067,14178,6621,15337,8619,15337,8631,15333,8677,15325,8769,15305,8871,15264,8940,15202,8909,15119,8775,15022,8565,14916,8328,14804,8009,14688,7614,14569,7287,14448,6888,14321,6483,14088,6171,15350,7402,15350,7419,15347,7480,15340,7613,15322,7804,15287,7973,15229,8057,15148,8012,15046,7846,14933,7611,14810,7357,14682,7069,14552,6656,14421,6316,14251,5948,14007,5528,15356,5942,15356,5977,15353,6119,15348,6294,15332,6551,15302,6824,15249,7044,15171,7122,15070,7050,14949,6861,14818,6611,14679,6349,14538,6067,14398,5651,14189,5311,13935,4958,15359,4123,15359,4153,15356,4296,15353,4646,15338,5160,15311,5508,15263,5829,15188,6042,15088,6094,14966,6001,14826,5796,14678,5543,14527,5287,14377,4985,14133,4586,13869,4257,15360,1563,15360,1642,15358,2076,15354,2636,15341,3350,15317,4019,15273,4429,15203,4732,15105,4911,14981,4932,14836,4818,14679,4621,14517,4386,14359,4156,14083,3795,13808,3437,15360,122,15360,137,15358,285,15355,636,15344,1274,15322,2177,15281,2765,15215,3223,15120,3451,14995,3569,14846,3567,14681,3466,14511,3305,14344,3121,14037,2800,13753,2467,15360,0,15360,1,15359,21,15355,89,15346,253,15325,479,15287,796,15225,1148,15133,1492,15008,1749,14856,1882,14685,1886,14506,1783,14324,1608,13996,1398,13702,1183]);let Ki=null;function xC(){return Ki===null&&(Ki=new JE(vC,16,16,Bs,lr),Ki.name="DFG_LUT",Ki.minFilter=bn,Ki.magFilter=bn,Ki.wrapS=wr,Ki.wrapT=wr,Ki.generateMipmaps=!1,Ki.needsUpdate=!0),Ki}class Gx{constructor(e={}){const{canvas:n=CE(),context:i=null,depth:r=!0,stencil:s=!1,alpha:a=!1,antialias:o=!1,premultipliedAlpha:l=!0,preserveDrawingBuffer:c=!1,powerPreference:h="default",failIfMajorPerformanceCaveat:p=!1,reversedDepthBuffer:f=!1,outputBufferType:g=ni}=e;this.isWebGLRenderer=!0;let v;if(i!==null){if(typeof WebGLRenderingContext<"u"&&i instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");v=i.getContextAttributes().alpha}else v=a;const S=g,_=new Set([Up,Ip,Dp]),d=new Set([ni,or,nl,il,Np,Lp]),m=new Uint32Array(4),M=new Int32Array(4),y=new I;let T=null,E=null;const C=[],x=[];let b=null;this.domElement=n,this.debug={checkShaderErrors:!0,diagnostics:{keywords:!1},onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=ar,this.toneMappingExposure=1,this.transmissionResolutionScale=1;const P=this;let D=!1,O=null,F=null,U=null,W=null;this._outputColorSpace=ei;let N=0,z=0,k=null,j=-1,L=null;const $=new Gt,de=new Gt;let we=null;const Ke=new ct(0);let $e=0,Ze=n.width,Q=n.height,ee=1,Ne=null,je=null;const Re=new Gt(0,0,Ze,Q),Qe=new Gt(0,0,Ze,Q);let ze=!1;const et=new Hp;let ot=!1,yt=!1;const rt=new kt,Pt=new I,Bt=new Gt,pn={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0};let Ct=!1;function zt(){return k===null?ee:1}let V=i;function Yt(A,B){return n.getContext(A,B)}let ht,R,w,X,K,ie,fe,_e,re,oe,he,Fe,xe,me,Oe,ke,qe,H,ve,te,ge,Se,ae;try{const A={alpha:!0,depth:r,stencil:s,antialias:o,premultipliedAlpha:l,preserveDrawingBuffer:c,powerPreference:h,failIfMajorPerformanceCaveat:p};if("setAttribute"in n&&n.setAttribute("data-engine",`three.js r${Rp}`),n.addEventListener("webglcontextlost",pt,!1),n.addEventListener("webglcontextrestored",nt,!1),n.addEventListener("webglcontextcreationerror",Pn,!1),V===null){const B="webgl2";if(V=Yt(B,A),V===null)throw Yt(B)?new Error("THREE.WebGLRenderer: Error creating WebGL context with your selected attributes."):new Error("THREE.WebGLRenderer: Error creating WebGL context.")}ye()}catch(A){throw n.removeEventListener("webglcontextlost",pt,!1),n.removeEventListener("webglcontextrestored",nt,!1),n.removeEventListener("webglcontextcreationerror",Pn,!1),gt("WebGLRenderer: "+A.message),A}function ye(){ht=new xb(V),ht.init(),ge=new uC(V,ht),R=new cb(V,ht,e,ge),w=new lC(V,ht),R.reversedDepthBuffer&&f&&w.buffers.depth.setReversed(!0),F=V.createFramebuffer(),U=V.createFramebuffer(),W=V.createFramebuffer(),X=new Mb(V),K=new qA,ie=new cC(V,ht,w,K,R,ge,X),fe=new vb(P),_e=new ww(V),Se=new ob(V,_e),re=new yb(V,_e,X,Se),oe=new wb(V,re,_e,Se,X),H=new Eb(V,R,ie),Oe=new ub(K),he=new $A(P,fe,ht,R,Se,Oe),Fe=new gC(P,K),xe=new KA,me=new nC(ht),qe=new ab(P,fe,w,oe,v,l),ke=new oC(P,oe,R),ae=new _C(V,X,R,w),ve=new lb(V,ht,X),te=new Sb(V,ht,X),X.programs=he.programs,P.capabilities=R,P.extensions=ht,P.properties=K,P.renderLists=xe,P.shadowMap=ke,P.state=w,P.info=X}S!==ni&&(b=new bb(S,n.width,n.height,o,r,s));const Ie=new pC(P,V);this.xr=Ie,this.getContext=function(){return V},this.getContextAttributes=function(){return V.getContextAttributes()},this.forceContextLoss=function(){const A=ht.get("WEBGL_lose_context");A&&A.loseContext()},this.forceContextRestore=function(){const A=ht.get("WEBGL_lose_context");A&&A.restoreContext()},this.getPixelRatio=function(){return ee},this.setPixelRatio=function(A){A!==void 0&&(ee=A,this.setSize(Ze,Q,!1))},this.getSize=function(A){return A.set(Ze,Q)},this.setSize=function(A,B,Z=!0){if(Ie.isPresenting){Ve("WebGLRenderer: Can't change size while VR device is presenting.");return}Ze=A,Q=B,n.width=Math.floor(A*ee),n.height=Math.floor(B*ee),Z===!0&&(n.style.width=A+"px",n.style.height=B+"px"),b!==null&&b.setSize(n.width,n.height),this.setViewport(0,0,A,B)},this.getDrawingBufferSize=function(A){return A.set(Ze*ee,Q*ee).floor()},this.setDrawingBufferSize=function(A,B,Z){Ze=A,Q=B,ee=Z,n.width=Math.floor(A*Z),n.height=Math.floor(B*Z),this.setViewport(0,0,A,B)},this.setEffects=function(A){if(S===ni){gt("WebGLRenderer: setEffects() requires outputBufferType set to HalfFloatType or FloatType.");return}if(A){for(let B=0;B<A.length;B++)if(A[B].isOutputPass===!0){Ve("WebGLRenderer: OutputPass is not needed in setEffects(). Tone mapping and color space conversion are applied automatically.");break}}b.setEffects(A||[])},this.getCurrentViewport=function(A){return A.copy($)},this.getViewport=function(A){return A.copy(Re)},this.setViewport=function(A,B,Z,Y){A.isVector4?Re.set(A.x,A.y,A.z,A.w):Re.set(A,B,Z,Y),w.viewport($.copy(Re).multiplyScalar(ee).round())},this.getScissor=function(A){return A.copy(Qe)},this.setScissor=function(A,B,Z,Y){A.isVector4?Qe.set(A.x,A.y,A.z,A.w):Qe.set(A,B,Z,Y),w.scissor(de.copy(Qe).multiplyScalar(ee).round())},this.getScissorTest=function(){return ze},this.setScissorTest=function(A){w.setScissorTest(ze=A)},this.setOpaqueSort=function(A){Ne=A},this.setTransparentSort=function(A){je=A},this.getClearColor=function(A){return A.copy(qe.getClearColor())},this.setClearColor=function(){qe.setClearColor(...arguments)},this.getClearAlpha=function(){return qe.getClearAlpha()},this.setClearAlpha=function(){qe.setClearAlpha(...arguments)},this.clear=function(A=!0,B=!0,Z=!0){let Y=0;if(A){let q=!1;if(k!==null){const Me=k.texture.format;q=_.has(Me)}if(q){const Me=k.texture.type,Te=d.has(Me),pe=qe.getClearColor(),Le=qe.getClearAlpha(),Ue=pe.r,Je=pe.g,Xe=pe.b;Te?(m[0]=Ue,m[1]=Je,m[2]=Xe,m[3]=Le,V.clearBufferuiv(V.COLOR,0,m)):(M[0]=Ue,M[1]=Je,M[2]=Xe,M[3]=Le,V.clearBufferiv(V.COLOR,0,M))}else Y|=V.COLOR_BUFFER_BIT}B&&(Y|=V.DEPTH_BUFFER_BIT,this.state.buffers.depth.setMask(!0)),Z&&(Y|=V.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),Y!==0&&V.clear(Y)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.setNodesHandler=function(A){A.setRenderer(this),O=A},this.dispose=function(){n.removeEventListener("webglcontextlost",pt,!1),n.removeEventListener("webglcontextrestored",nt,!1),n.removeEventListener("webglcontextcreationerror",Pn,!1),qe.dispose(),xe.dispose(),me.dispose(),K.dispose(),fe.dispose(),oe.dispose(),Se.dispose(),ae.dispose(),he.dispose(),Ie.dispose(),Ie.removeEventListener("sessionstart",ms),Ie.removeEventListener("sessionend",Hi),Vi.stop()};function pt(A){A.preventDefault(),R0("WebGLRenderer: Context Lost."),D=!0}function nt(){R0("WebGLRenderer: Context Restored."),D=!1;const A=X.autoReset,B=ke.enabled,Z=ke.autoUpdate,Y=ke.needsUpdate,q=ke.type;ye(),X.autoReset=A,ke.enabled=B,ke.autoUpdate=Z,ke.needsUpdate=Y,ke.type=q}function Pn(A){gt("WebGLRenderer: A WebGL context could not be created. Reason: ",A.statusMessage)}function On(A){const B=A.target;B.removeEventListener("dispose",On),Ur(B)}function Ur(A){Si(A),K.remove(A)}function Si(A){const B=K.get(A).programs;B!==void 0&&(B.forEach(function(Z){he.releaseProgram(Z)}),A.isShaderMaterial&&he.releaseShaderCache(A))}this.renderBufferDirect=function(A,B,Z,Y,q,Me){B===null&&(B=pn);const Te=q.isMesh&&q.matrixWorld.determinantAffine()<0,pe=js(A,B,Z,Y,q);w.setMaterial(Y,Te);let Le=Z.index,Ue=1;if(Y.wireframe===!0){if(Le=re.getWireframeAttribute(Z),Le===void 0)return;Ue=2}const Je=Z.drawRange,Xe=Z.attributes.position;let Pe=Je.start*Ue,vt=(Je.start+Je.count)*Ue;Me!==null&&(Pe=Math.max(Pe,Me.start*Ue),vt=Math.min(vt,(Me.start+Me.count)*Ue)),Le!==null?(Pe=Math.max(Pe,0),vt=Math.min(vt,Le.count)):Xe!=null&&(Pe=Math.max(Pe,0),vt=Math.min(vt,Xe.count));const $t=vt-Pe;if($t<0||$t===1/0)return;Se.setup(q,Y,pe,Z,Le);let Rt,Et=ve;if(Le!==null&&(Rt=_e.get(Le),Et=te,Et.setIndex(Rt)),q.isMesh)Y.wireframe===!0?(w.setLineWidth(Y.wireframeLinewidth*zt()),Et.setMode(V.LINES)):Et.setMode(V.TRIANGLES);else if(q.isLine){let Kt=Y.linewidth;Kt===void 0&&(Kt=1),w.setLineWidth(Kt*zt()),q.isLineSegments?Et.setMode(V.LINES):q.isLineLoop?Et.setMode(V.LINE_LOOP):Et.setMode(V.LINE_STRIP)}else q.isPoints?Et.setMode(V.POINTS):q.isSprite&&Et.setMode(V.TRIANGLES);if(q.isBatchedMesh)if(ht.get("WEBGL_multi_draw"))Et.renderMultiDraw(q._multiDrawStarts,q._multiDrawCounts,q._multiDrawCount);else{const Kt=q._multiDrawStarts,Ae=q._multiDrawCounts,Lt=q._multiDrawCount,dt=Le?_e.get(Le).bytesPerElement:1,kn=K.get(Y).currentProgram.getUniforms();for(let Kn=0;Kn<Lt;Kn++)kn.setValue(V,"_gl_DrawID",Kn),Et.render(Kt[Kn]/dt,Ae[Kn])}else if(q.isInstancedMesh)Et.renderInstances(Pe,$t,q.count);else if(Z.isInstancedBufferGeometry){const Kt=Z._maxInstanceCount!==void 0?Z._maxInstanceCount:1/0,Ae=Math.min(Z.instanceCount,Kt);Et.renderInstances(Pe,$t,Ae)}else Et.render(Pe,$t)};function Ka(A,B,Z,Y){O!==null&&A.isNodeMaterial&&O.setObject(Y,A),ot===!0&&Oe.setState(A,Z,!1),A.transparent===!0&&A.side===jn&&A.forceSinglePass===!1?(A.side=Yn,A.needsUpdate=!0,Gs(A,B,Y),A.side=Os,A.needsUpdate=!0,Gs(A,B,Y),A.side=jn):Gs(A,B,Y)}this.compile=function(A,B,Z=null){Z===null&&(Z=A),O!==null&&O.renderStart(A,B,Z),E=me.get(Z),E.init(B),x.push(E),Z.traverseVisible(function(q){q.isLight&&q.layers.test(B.layers)&&(E.pushLight(q),q.castShadow&&E.pushShadow(q))}),A!==Z&&A.traverseVisible(function(q){q.isLight&&q.layers.test(B.layers)&&(E.pushLight(q),q.castShadow&&E.pushShadow(q))}),E.setupLights(),O!==null&&O.updateLights(E.state.lightsArray),yt=this.localClippingEnabled,ot=Oe.init(this.clippingPlanes,yt),ot===!0&&Oe.setGlobalState(this.clippingPlanes,B),O!==null&&ke.render(E.state.shadowsArray,Z,B);const Y=new Set;return A.traverse(function(q){if(!(q.isMesh||q.isPoints||q.isLine||q.isSprite))return;const Me=q.material;if(Me)if(Array.isArray(Me))for(let Te=0;Te<Me.length;Te++){const pe=Me[Te];Ka(pe,Z,B,q),Y.add(pe)}else Ka(Me,Z,B,q),Y.add(Me)}),E=x.pop(),O!==null&&O.renderEnd(),Y},this.compileAsync=function(A,B,Z=null){const Y=this.compile(A,B,Z);return new Promise(q=>{function Me(){if(Y.forEach(function(Te){const Le=K.get(Te).currentProgram;(Le===void 0||Le.isReady())&&Y.delete(Te)}),Y.size===0){q(A);return}setTimeout(Me,10)}ht.get("KHR_parallel_shader_compile")!==null?Me():setTimeout(Me,10)})};let ur=null;function zi(A){ur&&ur(A)}function ms(){Vi.stop()}function Hi(){Vi.start()}const Vi=new Ux;Vi.setAnimationLoop(zi),typeof self<"u"&&Vi.setContext(self),this.setAnimationLoop=function(A){ur=A,Ie.setAnimationLoop(A),A===null?Vi.stop():Vi.start()},Ie.addEventListener("sessionstart",ms),Ie.addEventListener("sessionend",Hi),this.render=function(A,B){if(B!==void 0&&B.isCamera!==!0){gt("WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(D===!0)return;O!==null&&O.renderStart(A,B);const Z=Ie.enabled===!0&&Ie.isPresenting===!0,Y=b!==null&&(k===null||Z)&&b.begin(P,k);if(A.matrixWorldAutoUpdate===!0&&A.updateMatrixWorld(),B.parent===null&&B.matrixWorldAutoUpdate===!0&&B.updateMatrixWorld(),Ie.enabled===!0&&Ie.isPresenting===!0&&(b===null||b.isCompositing()===!1)&&(Ie.cameraAutoUpdate===!0&&Ie.updateCamera(B),B=Ie.getCamera()),A.isScene===!0&&A.onBeforeRender(P,A,B,k),E=me.get(A,x.length),E.init(B),E.state.textureUnits=ie.getTextureUnits(),x.push(E),rt.multiplyMatrices(B.projectionMatrix,B.matrixWorldInverse),et.setFromProjectionMatrix(rt,ir,B.reversedDepth),yt=this.localClippingEnabled,ot=Oe.init(this.clippingPlanes,yt),T=xe.get(A,C.length),T.init(),C.push(T),Ie.enabled===!0&&Ie.isPresenting===!0){const Te=P.xr.getDepthSensingMesh();Te!==null&&gs(Te,B,-1/0,P.sortObjects)}gs(A,B,0,P.sortObjects),T.finish(),O!==null&&O.updateLights(E.state.lightsArray),P.sortObjects===!0&&T.sort(Ne,je),Ct=Ie.enabled===!1||Ie.isPresenting===!1||Ie.hasDepthSensing()===!1,Ct&&qe.addToRenderList(T,A),this.info.render.frame++,this.info.autoReset===!0&&this.info.reset(),ot===!0&&Oe.beginShadows();const q=E.state.shadowsArray;if(ke.render(q,A,B),ot===!0&&Oe.endShadows(),(Y&&b.hasRenderPass())===!1){const Te=T.opaque,pe=T.transmissive;if(E.setupLights(),B.isArrayCamera){const Le=B.cameras;if(pe.length>0)for(let Ue=0,Je=Le.length;Ue<Je;Ue++){const Xe=Le[Ue];Qa(Te,pe,A,Xe)}Ct&&qe.render(A);for(let Ue=0,Je=Le.length;Ue<Je;Ue++){const Xe=Le[Ue];Za(T,A,Xe,Xe.viewport)}}else pe.length>0&&Qa(Te,pe,A,B),Ct&&qe.render(A),Za(T,A,B)}k!==null&&z===0&&(ie.updateMultisampleRenderTarget(k),ie.updateRenderTargetMipmap(k)),Y&&b.end(P),A.isScene===!0&&A.onAfterRender(P,A,B),Se.resetDefaultState(),j=-1,L=null,x.pop(),x.length>0?(E=x[x.length-1],ie.setTextureUnits(E.state.textureUnits),ot===!0&&Oe.setGlobalState(P.clippingPlanes,E.state.camera)):E=null,C.pop(),C.length>0?T=C[C.length-1]:T=null,O!==null&&O.renderEnd()};function gs(A,B,Z,Y){if(A.visible===!1)return;if(A.layers.test(B.layers)){if(A.isGroup)Z=A.renderOrder;else if(A.isLOD)A.autoUpdate===!0&&A.update(B);else if(A.isLightProbeGrid)E.pushLightProbeGrid(A);else if(A.isLight)E.pushLight(A),A.castShadow&&E.pushShadow(A);else if(A.isSprite){if(!A.frustumCulled||A.intersectsFrustum(et)){Y&&Bt.setFromMatrixPosition(A.matrixWorld).applyMatrix4(rt);const Te=oe.update(A),pe=A.material;pe.visible&&T.push(A,Te,pe,Z,Bt.z,null,B)}}else if((A.isMesh||A.isLine||A.isPoints)&&(!A.frustumCulled||A.intersectsFrustum(et))){const Te=oe.update(A),pe=A.material;if(Y&&(A.boundingSphere!==void 0?(A.boundingSphere===null&&A.computeBoundingSphere(),Bt.copy(A.boundingSphere.center)):(Te.boundingSphere===null&&Te.computeBoundingSphere(),Bt.copy(Te.boundingSphere.center)),Bt.applyMatrix4(A.matrixWorld).applyMatrix4(rt)),Array.isArray(pe)){const Le=Te.groups;for(let Ue=0,Je=Le.length;Ue<Je;Ue++){const Xe=Le[Ue],Pe=pe[Xe.materialIndex];Pe&&Pe.visible&&T.push(A,Te,Pe,Z,Bt.z,Xe,B)}}else pe.visible&&T.push(A,Te,pe,Z,Bt.z,null,B)}}const Me=A.children;for(let Te=0,pe=Me.length;Te<pe;Te++)gs(Me[Te],B,Z,Y)}function Za(A,B,Z,Y){const{opaque:q,transmissive:Me,transparent:Te}=A;E.setupLightsView(Z),ot===!0&&Oe.setGlobalState(P.clippingPlanes,Z),Y&&w.viewport($.copy(Y)),q.length>0&&Fr(q,B,Z),Me.length>0&&Fr(Me,B,Z),Te.length>0&&Fr(Te,B,Z),w.buffers.depth.setTest(!0),w.buffers.depth.setMask(!0),w.buffers.color.setMask(!0),w.setPolygonOffset(!1)}function Qa(A,B,Z,Y){if((Z.isScene===!0?Z.overrideMaterial:null)!==null)return;if(E.state.transmissionRenderTarget[Y.id]===void 0){const Pe=ht.has("EXT_color_buffer_half_float")||ht.has("EXT_color_buffer_float");E.state.transmissionRenderTarget[Y.id]=new ki(1,1,{generateMipmaps:!0,type:Pe?lr:ni,minFilter:Cs,samples:Math.max(4,R.samples),stencilBuffer:s,resolveDepthBuffer:!1,resolveStencilBuffer:!1,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,colorSpace:ft.workingColorSpace})}const Me=E.state.transmissionRenderTarget[Y.id],Te=Y.viewport||$;Me.setSize(Te.z*P.transmissionResolutionScale,Te.w*P.transmissionResolutionScale);const pe=P.getRenderTarget(),Le=P.getActiveCubeFace(),Ue=P.getActiveMipmapLevel();P.setRenderTarget(Me),P.getClearColor(Ke),$e=P.getClearAlpha(),$e<1&&P.setClearColor(16777215,.5),P.clear(),Ct&&qe.render(Z);const Je=P.toneMapping;P.toneMapping=ar;const Xe=Y.viewport;if(Y.viewport!==void 0&&(Y.viewport=void 0),E.setupLightsView(Y),ot===!0&&Oe.setGlobalState(P.clippingPlanes,Y),Fr(A,Z,Y),ie.updateMultisampleRenderTarget(Me),ie.updateRenderTargetMipmap(Me),ht.has("WEBGL_multisampled_render_to_texture")===!1){let Pe=!1;for(let vt=0,$t=B.length;vt<$t;vt++){const Rt=B[vt],{object:Et,geometry:Kt,material:Ae,group:Lt}=Rt;if(Ae.side===jn&&Et.layers.test(Y.layers)){const dt=Ae.side;Ae.side=Yn,Ae.needsUpdate=!0,Vs(Et,Z,Y,Kt,Ae,Lt),Ae.side=dt,Ae.needsUpdate=!0,Pe=!0}}Pe===!0&&(ie.updateMultisampleRenderTarget(Me),ie.updateRenderTargetMipmap(Me))}P.setRenderTarget(pe,Le,Ue),P.setClearColor(Ke,$e),Xe!==void 0&&(Y.viewport=Xe),P.toneMapping=Je}function Fr(A,B,Z){const Y=B.isScene===!0?B.overrideMaterial:null;for(let q=0,Me=A.length;q<Me;q++){const Te=A[q],{object:pe,geometry:Le,group:Ue}=Te;let Je=Te.material;Je.allowOverride===!0&&Y!==null&&(Je=Y),pe.layers.test(Z.layers)&&Vs(pe,B,Z,Le,Je,Ue)}}function Vs(A,B,Z,Y,q,Me){O!==null&&q.isNodeMaterial&&O.setObject(A,q),A.onBeforeRender(P,B,Z,Y,q,Me),A.modelViewMatrix.multiplyMatrices(Z.matrixWorldInverse,A.matrixWorld),A.normalMatrix.getNormalMatrix(A.modelViewMatrix),q.onBeforeRender(P,B,Z,Y,A,Me),q.transparent===!0&&q.side===jn&&q.forceSinglePass===!1?(q.side=Yn,q.needsUpdate=!0,P.renderBufferDirect(Z,B,Y,q,A,Me),q.side=Os,q.needsUpdate=!0,P.renderBufferDirect(Z,B,Y,q,A,Me),q.side=jn):P.renderBufferDirect(Z,B,Y,q,A,Me),A.onAfterRender(P,B,Z,Y,q,Me)}function Gs(A,B,Z){B.isScene!==!0&&(B=pn);const Y=K.get(A),q=E.state.lights,Me=E.state.shadowsArray,Te=q.state.version,pe=he.getParameters(A,q.state,Me,B,Z,E.state.lightProbeGridArray),Le=he.getProgramCacheKey(pe);let Ue=Y.programs;Y.environment=A.isMeshStandardMaterial||A.isMeshLambertMaterial||A.isMeshPhongMaterial?B.environment:null,Y.fog=B.fog;const Je=A.isMeshStandardMaterial||A.isMeshLambertMaterial&&!A.envMap||A.isMeshPhongMaterial&&!A.envMap;Y.envMap=fe.get(A.envMap||Y.environment,Je),Y.envMapRotation=Y.environment!==null&&A.envMap===null?B.environmentRotation:A.envMapRotation,Ue===void 0&&(A.addEventListener("dispose",On),Ue=new Map,Y.programs=Ue);let Xe=Ue.get(Le);if(Xe!==void 0){if(Y.currentProgram===Xe&&Y.lightsStateVersion===Te)return dr(A,pe),Xe}else pe.uniforms=he.getUniforms(A),O!==null&&A.isNodeMaterial&&O.build(A,Z,pe),A.onBeforeCompile(pe,P),Xe=he.acquireProgram(pe,Le),Ue.set(Le,Xe),Y.uniforms=pe.uniforms;const Pe=Y.uniforms;return(!A.isShaderMaterial&&!A.isRawShaderMaterial||A.clipping===!0)&&(Pe.clippingPlanes=Oe.uniform),dr(A,pe),Y.needsLights=Du(A),Y.lightsStateVersion=Te,Y.needsLights&&(Pe.ambientLightColor.value=q.state.ambient,Pe.lightProbe.value=q.state.probe,Pe.sunLights.value=q.state.sun,Pe.sunLightShadows.value=q.state.sunShadow,Pe.directionalLights.value=q.state.directional,Pe.directionalLightShadows.value=q.state.directionalShadow,Pe.spotLights.value=q.state.spot,Pe.spotLightShadows.value=q.state.spotShadow,Pe.rectAreaLights.value=q.state.rectArea,Pe.ltc_1.value=q.state.rectAreaLTC1,Pe.ltc_2.value=q.state.rectAreaLTC2,Pe.pointLights.value=q.state.point,Pe.pointLightShadows.value=q.state.pointShadow,Pe.hemisphereLights.value=q.state.hemi,Pe.sunShadowMatrix.value=q.state.sunShadowMatrix,Pe.sunShadowCascade.value=q.state.sunShadowCascade,Pe.directionalShadowMatrix.value=q.state.directionalShadowMatrix,Pe.spotLightMatrix.value=q.state.spotLightMatrix,Pe.spotLightMap.value=q.state.spotLightMap,Pe.pointShadowMatrix.value=q.state.pointShadowMatrix),Y.lightProbeGrid=E.state.lightProbeGridArray.length>0,Y.currentProgram=Xe,Y.uniformsList=null,Xe}function Ja(A){if(A.uniformsList===null){const B=A.currentProgram.getUniforms();A.uniformsList=wc.seqWithValue(B.seq,A.uniforms)}return A.uniformsList}function dr(A,B){const Z=K.get(A);Z.outputColorSpace=B.outputColorSpace,Z.batching=B.batching,Z.batchingColor=B.batchingColor,Z.instancing=B.instancing,Z.instancingColor=B.instancingColor,Z.instancingMorph=B.instancingMorph,Z.skinning=B.skinning,Z.morphTargets=B.morphTargets,Z.morphNormals=B.morphNormals,Z.morphColors=B.morphColors,Z.morphTargetsCount=B.morphTargetsCount,Z.numClippingPlanes=B.numClippingPlanes,Z.numIntersection=B.numClipIntersection,Z.vertexAlphas=B.vertexAlphas,Z.vertexTangents=B.vertexTangents,Z.toneMapping=B.toneMapping}function Nu(A,B){if(A.length===0)return null;if(A.length===1)return A[0].texture!==null?A[0]:null;y.setFromMatrixPosition(B.matrixWorld);for(let Z=0,Y=A.length;Z<Y;Z++){const q=A[Z];if(q.texture!==null&&q.boundingBox.containsPoint(y))return q}return null}function js(A,B,Z,Y,q){B.isScene!==!0&&(B=pn),ie.resetTextureUnits();const Me=B.fog,Te=Y.isMeshStandardMaterial||Y.isMeshLambertMaterial||Y.isMeshPhongMaterial?B.environment:null,pe=k===null?P.outputColorSpace:k.isXRRenderTarget===!0?k.texture.colorSpace:ft.workingColorSpace,Le=Y.isMeshStandardMaterial||Y.isMeshLambertMaterial&&!Y.envMap||Y.isMeshPhongMaterial&&!Y.envMap,Ue=fe.get(Y.envMap||Te,Le),Je=Y.vertexColors===!0&&!!Z.attributes.color&&Z.attributes.color.itemSize===4,Xe=!!Z.attributes.tangent&&(!!Y.normalMap||Y.anisotropy>0),Pe=!!Z.morphAttributes.position,vt=!!Z.morphAttributes.normal,$t=!!Z.morphAttributes.color;let Rt=ar;Y.toneMapped&&(k===null||k.isXRRenderTarget===!0)&&(Rt=P.toneMapping);const Et=Z.morphAttributes.position||Z.morphAttributes.normal||Z.morphAttributes.color,Kt=Et!==void 0?Et.length:0,Ae=K.get(Y),Lt=E.state.lights;if(ot===!0&&(yt===!0||A!==L)){const st=A===L&&Y.id===j;Oe.setState(Y,A,st)}let dt=!1;Y.version===Ae.__version?(Ae.needsLights&&Ae.lightsStateVersion!==Lt.state.version||Ae.outputColorSpace!==pe||q.isBatchedMesh&&Ae.batching===!1||!q.isBatchedMesh&&Ae.batching===!0||q.isBatchedMesh&&Ae.batchingColor===!0&&q._colorsTexture===null||q.isBatchedMesh&&Ae.batchingColor===!1&&q._colorsTexture!==null||q.isInstancedMesh&&Ae.instancing===!1||!q.isInstancedMesh&&Ae.instancing===!0||q.isSkinnedMesh&&Ae.skinning===!1||!q.isSkinnedMesh&&Ae.skinning===!0||q.isInstancedMesh&&Ae.instancingColor===!0&&q.instanceColor===null||q.isInstancedMesh&&Ae.instancingColor===!1&&q.instanceColor!==null||q.isInstancedMesh&&Ae.instancingMorph===!0&&q.morphTexture===null||q.isInstancedMesh&&Ae.instancingMorph===!1&&q.morphTexture!==null||Ae.envMap!==Ue||Y.fog===!0&&Ae.fog!==Me||Ae.numClippingPlanes!==void 0&&(Ae.numClippingPlanes!==Oe.numPlanes||Ae.numIntersection!==Oe.numIntersection)||Ae.vertexAlphas!==Je||Ae.vertexTangents!==Xe||Ae.morphTargets!==Pe||Ae.morphNormals!==vt||Ae.morphColors!==$t||Ae.toneMapping!==Rt||Ae.morphTargetsCount!==Kt||!!Ae.lightProbeGrid!=E.state.lightProbeGridArray.length>0)&&(dt=!0):(dt=!0,Ae.__version=Y.version);let kn=Ae.currentProgram;dt===!0&&(kn=Gs(Y,B,q),O&&Y.isNodeMaterial&&O.onUpdateProgram(Y,kn,Ae));let Kn=!1,Gi=!1,Or=!1;const xt=kn.getUniforms(),St=Ae.uniforms;if(w.useProgram(kn.program)&&(Kn=!0,Gi=!0,Or=!0),Y.id!==j&&(j=Y.id,Gi=!0),Ae.needsLights){const st=Nu(E.state.lightProbeGridArray,q);Ae.lightProbeGrid!==st&&(Ae.lightProbeGrid=st,Gi=!0)}if(Kn||L!==A){w.buffers.depth.getReversed()&&A.reversedDepth!==!0&&(A._reversedDepth=!0,A.updateProjectionMatrix()),xt.setValue(V,"projectionMatrix",A.projectionMatrix),xt.setValue(V,"viewMatrix",A.matrixWorldInverse);const ji=xt.map.cameraPosition;ji!==void 0&&ji.setValue(V,Pt.setFromMatrixPosition(A.matrixWorld)),R.logarithmicDepthBuffer&&xt.setValue(V,"logDepthBufFC",2/(Math.log(A.far+1)/Math.LN2)),(Y.isMeshPhongMaterial||Y.isMeshToonMaterial||Y.isMeshLambertMaterial||Y.isMeshBasicMaterial||Y.isMeshStandardMaterial||Y.isShaderMaterial)&&xt.setValue(V,"isOrthographic",A.isOrthographicCamera===!0),L!==A&&(L=A,Gi=!0,Or=!0)}if(Ae.needsLights&&(Lt.state.sunShadowMap.length>0&&xt.setValue(V,"sunShadowMap",Lt.state.sunShadowMap,ie),Lt.state.directionalShadowMap.length>0&&xt.setValue(V,"directionalShadowMap",Lt.state.directionalShadowMap,ie),Lt.state.spotShadowMap.length>0&&xt.setValue(V,"spotShadowMap",Lt.state.spotShadowMap,ie),Lt.state.pointShadowMap.length>0&&xt.setValue(V,"pointShadowMap",Lt.state.pointShadowMap,ie)),q.isSkinnedMesh){xt.setOptional(V,q,"bindMatrix"),xt.setOptional(V,q,"bindMatrixInverse");const st=q.skeleton;st&&(st.boneTexture===null&&st.computeBoneTexture(),xt.setValue(V,"boneTexture",st.boneTexture,ie))}q.isBatchedMesh&&(xt.setOptional(V,q,"batchingTexture"),xt.setValue(V,"batchingTexture",q._matricesTexture,ie),xt.setOptional(V,q,"batchingIdTexture"),xt.setValue(V,"batchingIdTexture",q._indirectTexture,ie),xt.setOptional(V,q,"batchingColorTexture"),q._colorsTexture!==null&&xt.setValue(V,"batchingColorTexture",q._colorsTexture,ie));const ci=Z.morphAttributes;if((ci.position!==void 0||ci.normal!==void 0||ci.color!==void 0)&&H.update(q,Z,kn),(Gi||Ae.receiveShadow!==q.receiveShadow)&&(Ae.receiveShadow=q.receiveShadow,xt.setValue(V,"receiveShadow",q.receiveShadow)),(Y.isMeshStandardMaterial||Y.isMeshLambertMaterial||Y.isMeshPhongMaterial)&&Y.envMap===null&&B.environment!==null&&(St.envMapIntensity.value=B.environmentIntensity),St.dfgLUT!==void 0&&(St.dfgLUT.value=xC()),Gi){if(xt.setValue(V,"toneMappingExposure",P.toneMappingExposure),Ae.needsLights&&Lu(St,Or),Me&&Y.fog===!0&&Fe.refreshFogUniforms(St,Me),Fe.refreshMaterialUniforms(St,Y,ee,Q,E.state.transmissionRenderTarget[A.id]),Ae.needsLights&&Ae.lightProbeGrid){const st=Ae.lightProbeGrid;St.probesSH.value=st.texture,St.probesMin.value.copy(st.boundingBox.min),St.probesMax.value.copy(st.boundingBox.max),St.probesResolution.value.copy(st.resolution)}wc.upload(V,Ja(Ae),St,ie)}if(Y.isShaderMaterial&&Y.uniformsNeedUpdate===!0&&(wc.upload(V,Ja(Ae),St,ie),Y.uniformsNeedUpdate=!1),Y.isSpriteMaterial&&xt.setValue(V,"center",q.center),xt.setValue(V,"modelViewMatrix",q.modelViewMatrix),xt.setValue(V,"normalMatrix",q.normalMatrix),xt.setValue(V,"modelMatrix",q.matrixWorld),Y.uniformsGroups!==void 0){const st=Y.uniformsGroups;for(let ji=0,Wi=st.length;ji<Wi;ji++){const _s=st[ji];ae.update(_s,kn),ae.bind(_s,kn)}}return kn}function Lu(A,B){A.ambientLightColor.needsUpdate=B,A.lightProbe.needsUpdate=B,A.sunLights.needsUpdate=B,A.sunLightShadows.needsUpdate=B,A.directionalLights.needsUpdate=B,A.directionalLightShadows.needsUpdate=B,A.pointLights.needsUpdate=B,A.pointLightShadows.needsUpdate=B,A.spotLights.needsUpdate=B,A.spotLightShadows.needsUpdate=B,A.rectAreaLights.needsUpdate=B,A.hemisphereLights.needsUpdate=B}function Du(A){return A.isMeshLambertMaterial||A.isMeshToonMaterial||A.isMeshPhongMaterial||A.isMeshStandardMaterial||A.isShadowMaterial||A.isShaderMaterial&&A.lights===!0}this.getActiveCubeFace=function(){return N},this.getActiveMipmapLevel=function(){return z},this.getRenderTarget=function(){return k},this.setRenderTargetTextures=function(A,B,Z){const Y=K.get(A);Y.__autoAllocateDepthBuffer=A.resolveDepthBuffer===!1,Y.__autoAllocateDepthBuffer===!1&&(Y.__useRenderToTexture=!1),K.get(A.texture).__webglTexture=B,K.get(A.depthTexture).__webglTexture=Y.__autoAllocateDepthBuffer?void 0:Z,Y.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(A,B){const Z=K.get(A);Z.__webglFramebuffer=B,Z.__useDefaultFramebuffer=B===void 0},this.setRenderTarget=function(A,B=0,Z=0){k=A,N=B,z=Z;let Y=null,q=!1,Me=!1;if(A){const pe=K.get(A);if(pe.__useDefaultFramebuffer!==void 0){w.bindFramebuffer(V.FRAMEBUFFER,pe.__webglFramebuffer),$.copy(A.viewport),de.copy(A.scissor),we=A.scissorTest,w.viewport($),w.scissor(de),w.setScissorTest(we),j=-1;return}else if(pe.__webglFramebuffer===void 0)ie.setupRenderTarget(A);else if(pe.__hasExternalTextures)ie.rebindTextures(A,K.get(A.texture).__webglTexture,K.get(A.depthTexture).__webglTexture);else if(A.depthBuffer){const Je=A.depthTexture;if(pe.__boundDepthTexture!==Je){if(Je!==null&&K.has(Je)&&(A.width!==Je.image.width||A.height!==Je.image.height))throw new Error("THREE.WebGLRenderer: Attached DepthTexture is initialized to the incorrect size.");ie.setupDepthRenderbuffer(A)}}const Le=A.texture;(Le.isData3DTexture||Le.isDataArrayTexture||Le.isCompressedArrayTexture)&&(Me=!0);const Ue=K.get(A).__webglFramebuffer;A.isWebGLCubeRenderTarget?(Array.isArray(Ue[B])?Y=Ue[B][Z]:Y=Ue[B],q=!0):A.samples>0&&ie.useMultisampledRTT(A)===!1?Y=K.get(A).__webglMultisampledFramebuffer:Array.isArray(Ue)?Y=Ue[Z]:Y=Ue,$.copy(A.viewport),de.copy(A.scissor),we=A.scissorTest}else $.copy(Re).multiplyScalar(ee).floor(),de.copy(Qe).multiplyScalar(ee).floor(),we=ze;if(Z!==0&&(Y=F),w.bindFramebuffer(V.FRAMEBUFFER,Y)&&w.drawBuffers(A,Y),w.viewport($),w.scissor(de),w.setScissorTest(we),q){const pe=K.get(A.texture);V.framebufferTexture2D(V.FRAMEBUFFER,V.COLOR_ATTACHMENT0,V.TEXTURE_CUBE_MAP_POSITIVE_X+B,pe.__webglTexture,Z)}else if(Me){const pe=B;for(let Le=0;Le<A.textures.length;Le++){const Ue=K.get(A.textures[Le]);V.framebufferTextureLayer(V.FRAMEBUFFER,V.COLOR_ATTACHMENT0+Le,Ue.__webglTexture,Z,pe)}}else if(A!==null&&Z!==0){const pe=K.get(A.texture);V.framebufferTexture2D(V.FRAMEBUFFER,V.COLOR_ATTACHMENT0,V.TEXTURE_2D,pe.__webglTexture,Z)}j=-1};function eo(A){const B=K.get(A);return(B.__readFormat!==A.format||B.__readType!==A.type)&&(B.__readFormat=A.format,B.__readType=A.type,B.__formatReadable=R.textureFormatReadable(A.format),B.__typeReadable=R.textureTypeReadable(A.type)),B}this.readRenderTargetPixels=function(A,B,Z,Y,q,Me,Te,pe=0){if(!(A&&A.isWebGLRenderTarget)){gt("WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let Le=K.get(A).__webglFramebuffer;if(A.isWebGLCubeRenderTarget&&Te!==void 0&&(Le=Le[Te]),Le){w.bindFramebuffer(V.FRAMEBUFFER,Le);try{const Ue=A.textures[pe],Je=Ue.format,Xe=Ue.type;A.textures.length>1&&V.readBuffer(V.COLOR_ATTACHMENT0+pe);const Pe=eo(Ue);if(Pe.__formatReadable===!1){gt("WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(Pe.__typeReadable===!1){gt("WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}B>=0&&B<=A.width-Y&&Z>=0&&Z<=A.height-q&&V.readPixels(B,Z,Y,q,ge.convert(Je),ge.convert(Xe),Me)}finally{const Ue=k!==null?K.get(k).__webglFramebuffer:null;w.bindFramebuffer(V.FRAMEBUFFER,Ue)}}},this.readRenderTargetPixelsAsync=async function(A,B,Z,Y,q,Me,Te,pe=0){if(!(A&&A.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let Le=K.get(A).__webglFramebuffer;if(A.isWebGLCubeRenderTarget&&Te!==void 0&&(Le=Le[Te]),Le)if(B>=0&&B<=A.width-Y&&Z>=0&&Z<=A.height-q){w.bindFramebuffer(V.FRAMEBUFFER,Le);const Ue=A.textures[pe],Je=Ue.format,Xe=Ue.type;A.textures.length>1&&V.readBuffer(V.COLOR_ATTACHMENT0+pe);const Pe=eo(Ue);if(Pe.__formatReadable===!1)throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(Pe.__typeReadable===!1)throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");const vt=V.createBuffer();V.bindBuffer(V.PIXEL_PACK_BUFFER,vt),V.bufferData(V.PIXEL_PACK_BUFFER,Me.byteLength,V.STREAM_READ),V.readPixels(B,Z,Y,q,ge.convert(Je),ge.convert(Xe),0),V.bindBuffer(V.PIXEL_PACK_BUFFER,null);const $t=k!==null?K.get(k).__webglFramebuffer:null;w.bindFramebuffer(V.FRAMEBUFFER,$t);const Rt=V.fenceSync(V.SYNC_GPU_COMMANDS_COMPLETE,0);return V.flush(),await RE(V,Rt,4),V.bindBuffer(V.PIXEL_PACK_BUFFER,vt),V.getBufferSubData(V.PIXEL_PACK_BUFFER,0,Me),V.bindBuffer(V.PIXEL_PACK_BUFFER,null),V.deleteBuffer(vt),V.deleteSync(Rt),Me}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")},this.copyFramebufferToTexture=function(A,B=null,Z=0){const Y=Math.pow(2,-Z),q=Math.floor(A.image.width*Y),Me=Math.floor(A.image.height*Y),Te=B!==null?B.x:0,pe=B!==null?B.y:0;ie.setTexture2D(A,0),V.copyTexSubImage2D(V.TEXTURE_2D,Z,0,0,Te,pe,q,Me),w.unbindTexture()},this.copyTextureToTexture=function(A,B,Z=null,Y=null,q=0,Me=0){let Te,pe,Le,Ue,Je,Xe,Pe,vt,$t;const Rt=A.isCompressedTexture?A.mipmaps[Me]:A.image;if(Z!==null)Te=Z.max.x-Z.min.x,pe=Z.max.y-Z.min.y,Le=Z.isBox3?Z.max.z-Z.min.z:1,Ue=Z.min.x,Je=Z.min.y,Xe=Z.isBox3?Z.min.z:0;else{const St=Math.pow(2,-q);Te=Math.floor(Rt.width*St),pe=Math.floor(Rt.height*St),A.isDataArrayTexture?Le=Rt.depth:A.isData3DTexture?Le=Math.floor(Rt.depth*St):Le=1,Ue=0,Je=0,Xe=0}Y!==null?(Pe=Y.x,vt=Y.y,$t=Y.z):(Pe=0,vt=0,$t=0);const Et=ge.convert(B.format),Kt=ge.convert(B.type);let Ae;B.isData3DTexture?(ie.setTexture3D(B,0),Ae=V.TEXTURE_3D):B.isDataArrayTexture||B.isCompressedArrayTexture?(ie.setTexture2DArray(B,0),Ae=V.TEXTURE_2D_ARRAY):(ie.setTexture2D(B,0),Ae=V.TEXTURE_2D),w.activeTexture(V.TEXTURE0),w.pixelStorei(V.UNPACK_FLIP_Y_WEBGL,B.flipY),w.pixelStorei(V.UNPACK_PREMULTIPLY_ALPHA_WEBGL,B.premultiplyAlpha),w.pixelStorei(V.UNPACK_ALIGNMENT,B.unpackAlignment);const Lt=w.getParameter(V.UNPACK_ROW_LENGTH),dt=w.getParameter(V.UNPACK_IMAGE_HEIGHT),kn=w.getParameter(V.UNPACK_SKIP_PIXELS),Kn=w.getParameter(V.UNPACK_SKIP_ROWS),Gi=w.getParameter(V.UNPACK_SKIP_IMAGES);w.pixelStorei(V.UNPACK_ROW_LENGTH,Rt.width),w.pixelStorei(V.UNPACK_IMAGE_HEIGHT,Rt.height),w.pixelStorei(V.UNPACK_SKIP_PIXELS,Ue),w.pixelStorei(V.UNPACK_SKIP_ROWS,Je),w.pixelStorei(V.UNPACK_SKIP_IMAGES,Xe);const Or=A.isDataArrayTexture||A.isData3DTexture,xt=B.isDataArrayTexture||B.isData3DTexture;if(A.isDepthTexture){const St=K.get(A),ci=K.get(B),st=K.get(St.__renderTarget),ji=K.get(ci.__renderTarget);w.bindFramebuffer(V.READ_FRAMEBUFFER,st.__webglFramebuffer),w.bindFramebuffer(V.DRAW_FRAMEBUFFER,ji.__webglFramebuffer);for(let Wi=0;Wi<Le;Wi++)Or&&(V.framebufferTextureLayer(V.READ_FRAMEBUFFER,V.COLOR_ATTACHMENT0,K.get(A).__webglTexture,q,Xe+Wi),V.framebufferTextureLayer(V.DRAW_FRAMEBUFFER,V.COLOR_ATTACHMENT0,K.get(B).__webglTexture,Me,$t+Wi)),V.blitFramebuffer(Ue,Je,Te,pe,Pe,vt,Te,pe,V.DEPTH_BUFFER_BIT,V.NEAREST);w.bindFramebuffer(V.READ_FRAMEBUFFER,null),w.bindFramebuffer(V.DRAW_FRAMEBUFFER,null)}else if(q!==0||A.isRenderTargetTexture||K.has(A)){const St=K.get(A),ci=K.get(B);w.bindFramebuffer(V.READ_FRAMEBUFFER,U),w.bindFramebuffer(V.DRAW_FRAMEBUFFER,W);for(let st=0;st<Le;st++)Or?V.framebufferTextureLayer(V.READ_FRAMEBUFFER,V.COLOR_ATTACHMENT0,St.__webglTexture,q,Xe+st):V.framebufferTexture2D(V.READ_FRAMEBUFFER,V.COLOR_ATTACHMENT0,V.TEXTURE_2D,St.__webglTexture,q),xt?V.framebufferTextureLayer(V.DRAW_FRAMEBUFFER,V.COLOR_ATTACHMENT0,ci.__webglTexture,Me,$t+st):V.framebufferTexture2D(V.DRAW_FRAMEBUFFER,V.COLOR_ATTACHMENT0,V.TEXTURE_2D,ci.__webglTexture,Me),q!==0?V.blitFramebuffer(Ue,Je,Te,pe,Pe,vt,Te,pe,V.COLOR_BUFFER_BIT,V.NEAREST):xt?V.copyTexSubImage3D(Ae,Me,Pe,vt,$t+st,Ue,Je,Te,pe):V.copyTexSubImage2D(Ae,Me,Pe,vt,Ue,Je,Te,pe);w.bindFramebuffer(V.READ_FRAMEBUFFER,null),w.bindFramebuffer(V.DRAW_FRAMEBUFFER,null)}else xt?A.isDataTexture||A.isData3DTexture?V.texSubImage3D(Ae,Me,Pe,vt,$t,Te,pe,Le,Et,Kt,Rt.data):B.isCompressedArrayTexture?V.compressedTexSubImage3D(Ae,Me,Pe,vt,$t,Te,pe,Le,Et,Rt.data):V.texSubImage3D(Ae,Me,Pe,vt,$t,Te,pe,Le,Et,Kt,Rt):A.isDataTexture?V.texSubImage2D(V.TEXTURE_2D,Me,Pe,vt,Te,pe,Et,Kt,Rt.data):A.isCompressedTexture?V.compressedTexSubImage2D(V.TEXTURE_2D,Me,Pe,vt,Rt.width,Rt.height,Et,Rt.data):V.texSubImage2D(V.TEXTURE_2D,Me,Pe,vt,Te,pe,Et,Kt,Rt);w.pixelStorei(V.UNPACK_ROW_LENGTH,Lt),w.pixelStorei(V.UNPACK_IMAGE_HEIGHT,dt),w.pixelStorei(V.UNPACK_SKIP_PIXELS,kn),w.pixelStorei(V.UNPACK_SKIP_ROWS,Kn),w.pixelStorei(V.UNPACK_SKIP_IMAGES,Gi),Me===0&&B.generateMipmaps&&V.generateMipmap(Ae),w.unbindTexture()},this.initRenderTarget=function(A){K.get(A).__webglFramebuffer===void 0&&ie.setupRenderTarget(A)},this.initTexture=function(A){A.isCubeTexture?ie.setTextureCube(A,0):A.isData3DTexture?ie.setTexture3D(A,0):A.isDataArrayTexture||A.isCompressedArrayTexture?ie.setTexture2DArray(A,0):ie.setTexture2D(A,0),w.unbindTexture()},this.resetState=function(){N=0,z=0,k=null,w.reset(),Se.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return ir}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(e){this._outputColorSpace=e;const n=this.getContext();n.drawingBufferColorSpace=ft._getDrawingBufferColorSpace(e),n.unpackColorSpace=ft._getUnpackColorSpace()}}const Rg={type:"change"},$p={type:"start"},jx={type:"end"},ac=new bu,Pg=new Sr,yC=Math.cos(70*LE.DEG2RAD),en=new I,Hn=2*Math.PI,bt={NONE:-1,ROTATE:0,DOLLY:1,PAN:2,TOUCH_ROTATE:3,TOUCH_PAN:4,TOUCH_DOLLY_PAN:5,TOUCH_DOLLY_ROTATE:6},Gd=1e-6;class Wx extends Mw{constructor(e,n=null){super(e,n),this.state=bt.NONE,this.target=new I,this.cursor=new I,this.minDistance=0,this.maxDistance=1/0,this.minZoom=0,this.maxZoom=1/0,this.minTargetRadius=0,this.maxTargetRadius=1/0,this.minPolarAngle=0,this.maxPolarAngle=Math.PI,this.minAzimuthAngle=-1/0,this.maxAzimuthAngle=1/0,this.enableDamping=!1,this.dampingFactor=.05,this.enableZoom=!0,this.zoomSpeed=1,this.enableRotate=!0,this.rotateSpeed=1,this.keyRotateSpeed=1,this.enablePan=!0,this.panSpeed=1,this.screenSpacePanning=!0,this.keyPanSpeed=7,this.zoomToCursor=!1,this.autoRotate=!1,this.autoRotateSpeed=2,this.keys={LEFT:"ArrowLeft",UP:"ArrowUp",RIGHT:"ArrowRight",BOTTOM:"ArrowDown"},this.mouseButtons={LEFT:Pa.ROTATE,MIDDLE:Pa.DOLLY,RIGHT:Pa.PAN},this.touches={ONE:Sa.ROTATE,TWO:Sa.DOLLY_PAN},this.target0=this.target.clone(),this.position0=this.object.position.clone(),this.zoom0=this.object.zoom,this._cursorStyle="auto",this._domElementKeyEvents=null,this._lastPosition=new I,this._lastQuaternion=new cs,this._lastTargetPosition=new I,this._quat=new cs().setFromUnitVectors(e.up,new I(0,1,0)),this._quatInverse=this._quat.clone().invert(),this._spherical=new rg,this._sphericalDelta=new rg,this._scale=1,this._panOffset=new I,this._rotateStart=new We,this._rotateEnd=new We,this._rotateDelta=new We,this._panStart=new We,this._panEnd=new We,this._panDelta=new We,this._dollyStart=new We,this._dollyEnd=new We,this._dollyDelta=new We,this._dollyDirection=new I,this._mouse=new We,this._performCursorZoom=!1,this._pointers=[],this._pointerPositions={},this._controlActive=!1,this._onPointerMove=MC.bind(this),this._onPointerDown=SC.bind(this),this._onPointerUp=EC.bind(this),this._onContextMenu=PC.bind(this),this._onMouseWheel=bC.bind(this),this._onKeyDown=AC.bind(this),this._onTouchStart=CC.bind(this),this._onTouchMove=RC.bind(this),this._onMouseDown=wC.bind(this),this._onMouseMove=TC.bind(this),this._interceptControlDown=NC.bind(this),this._interceptControlUp=LC.bind(this),this.domElement!==null&&this.connect(this.domElement),this.update()}set cursorStyle(e){this._cursorStyle=e,e==="grab"?this.domElement.style.cursor="grab":this.domElement.style.cursor="auto"}get cursorStyle(){return this._cursorStyle}connect(e){super.connect(e),this.domElement.addEventListener("pointerdown",this._onPointerDown),this.domElement.addEventListener("pointercancel",this._onPointerUp),this.domElement.addEventListener("contextmenu",this._onContextMenu),this.domElement.addEventListener("wheel",this._onMouseWheel,{passive:!1}),this.domElement.getRootNode().addEventListener("keydown",this._interceptControlDown,{passive:!0,capture:!0}),this.domElement.style.touchAction="none"}disconnect(){this.state=bt.NONE,this.domElement.removeEventListener("pointerdown",this._onPointerDown),this.domElement.ownerDocument.removeEventListener("pointermove",this._onPointerMove),this.domElement.ownerDocument.removeEventListener("pointerup",this._onPointerUp),this.domElement.removeEventListener("pointercancel",this._onPointerUp),this.domElement.removeEventListener("wheel",this._onMouseWheel),this.domElement.removeEventListener("contextmenu",this._onContextMenu),this.stopListenToKeyEvents();const e=this.domElement.getRootNode();e.removeEventListener("keydown",this._interceptControlDown,{capture:!0}),e.removeEventListener("keyup",this._interceptControlUp,{capture:!0}),this._controlActive=!1,this._pointers.length=0,this._pointerPositions={},this.domElement.style.touchAction="",this.domElement.style.cursor="auto"}dispose(){this.disconnect()}getPolarAngle(){return this._spherical.phi}getAzimuthalAngle(){return this._spherical.theta}getDistance(){return this.object.position.distanceTo(this.target)}listenToKeyEvents(e){e.addEventListener("keydown",this._onKeyDown),this._domElementKeyEvents=e}stopListenToKeyEvents(){this._domElementKeyEvents!==null&&(this._domElementKeyEvents.removeEventListener("keydown",this._onKeyDown),this._domElementKeyEvents=null)}saveState(){this.target0.copy(this.target),this.position0.copy(this.object.position),this.zoom0=this.object.zoom}reset(){this.target.copy(this.target0),this.object.position.copy(this.position0),this.object.zoom=this.zoom0,this.object.updateProjectionMatrix(),this.dispatchEvent(Rg),this.update(),this.state=bt.NONE}pan(e,n){this._pan(e,n),this.update()}dollyIn(e){this._dollyIn(e),this.update()}dollyOut(e){this._dollyOut(e),this.update()}rotateLeft(e){this._rotateLeft(e),this.update()}rotateUp(e){this._rotateUp(e),this.update()}update(e=null){const n=this.object.position;en.copy(n).sub(this.target),en.applyQuaternion(this._quat),this._spherical.setFromVector3(en),this.autoRotate&&this.state===bt.NONE&&this._rotateLeft(this._getAutoRotationAngle(e)),this.enableDamping?(this._spherical.theta+=this._sphericalDelta.theta*this.dampingFactor,this._spherical.phi+=this._sphericalDelta.phi*this.dampingFactor):(this._spherical.theta+=this._sphericalDelta.theta,this._spherical.phi+=this._sphericalDelta.phi);let i=this.minAzimuthAngle,r=this.maxAzimuthAngle;isFinite(i)&&isFinite(r)&&(i<-Math.PI?i+=Hn:i>Math.PI&&(i-=Hn),r<-Math.PI?r+=Hn:r>Math.PI&&(r-=Hn),i<=r?this._spherical.theta=Math.max(i,Math.min(r,this._spherical.theta)):this._spherical.theta=this._spherical.theta>(i+r)/2?Math.max(i,this._spherical.theta):Math.min(r,this._spherical.theta)),this._spherical.phi=Math.max(this.minPolarAngle,Math.min(this.maxPolarAngle,this._spherical.phi)),this._spherical.makeSafe(),this.enableDamping===!0?this.target.addScaledVector(this._panOffset,this.dampingFactor):this.target.add(this._panOffset),this.target.sub(this.cursor),this.target.clampLength(this.minTargetRadius,this.maxTargetRadius),this.target.add(this.cursor);let s=!1;if(this.zoomToCursor&&this._performCursorZoom||this.object.isOrthographicCamera)this._spherical.radius=this._clampDistance(this._spherical.radius);else{const a=this._spherical.radius;this._spherical.radius=this._clampDistance(this._spherical.radius*this._scale),s=a!=this._spherical.radius}if(en.setFromSpherical(this._spherical),en.applyQuaternion(this._quatInverse),n.copy(this.target).add(en),this.object.lookAt(this.target),this.enableDamping===!0?(this._sphericalDelta.theta*=1-this.dampingFactor,this._sphericalDelta.phi*=1-this.dampingFactor,this._panOffset.multiplyScalar(1-this.dampingFactor)):(this._sphericalDelta.set(0,0,0),this._panOffset.set(0,0,0)),this.zoomToCursor&&this._performCursorZoom){let a=null;if(this.object.isPerspectiveCamera){const o=en.length();a=this._clampDistance(o*this._scale);const l=o-a;this.object.position.addScaledVector(this._dollyDirection,l),this.object.updateMatrixWorld(),s=!!l}else if(this.object.isOrthographicCamera){const o=new I(this._mouse.x,this._mouse.y,0);o.unproject(this.object);const l=this.object.zoom;this.object.zoom=Math.max(this.minZoom,Math.min(this.maxZoom,this.object.zoom/this._scale)),this.object.updateProjectionMatrix(),s=l!==this.object.zoom;const c=new I(this._mouse.x,this._mouse.y,0);c.unproject(this.object),this.object.position.sub(c).add(o),this.object.updateMatrixWorld(),a=en.length()}else console.warn("WARNING: OrbitControls.js encountered an unknown camera type - zoom to cursor disabled."),this.zoomToCursor=!1;a!==null&&(this.screenSpacePanning?this.target.set(0,0,-1).transformDirection(this.object.matrix).multiplyScalar(a).add(this.object.position):(ac.origin.copy(this.object.position),ac.direction.set(0,0,-1).transformDirection(this.object.matrix),Math.abs(this.object.up.dot(ac.direction))<yC?this.object.lookAt(this.target):(Pg.setFromNormalAndCoplanarPoint(this.object.up,this.target),ac.intersectPlane(Pg,this.target))))}else if(this.object.isOrthographicCamera){const a=this.object.zoom;this.object.zoom=Math.max(this.minZoom,Math.min(this.maxZoom,this.object.zoom/this._scale)),a!==this.object.zoom&&(this.object.updateProjectionMatrix(),s=!0)}return this._scale=1,this._performCursorZoom=!1,s||this._lastPosition.distanceToSquared(this.object.position)>Gd||8*(1-this._lastQuaternion.dot(this.object.quaternion))>Gd||this._lastTargetPosition.distanceToSquared(this.target)>Gd?(this.dispatchEvent(Rg),this._lastPosition.copy(this.object.position),this._lastQuaternion.copy(this.object.quaternion),this._lastTargetPosition.copy(this.target),!0):!1}_getAutoRotationAngle(e){return e!==null?Hn/60*this.autoRotateSpeed*e:Hn/60/60*this.autoRotateSpeed}_getZoomScale(e){const n=Math.abs(e*.01);return Math.pow(.95,this.zoomSpeed*n)}_rotateLeft(e){this._sphericalDelta.theta-=e}_rotateUp(e){this._sphericalDelta.phi-=e}_panLeft(e,n){en.setFromMatrixColumn(n,0),en.multiplyScalar(-e),this._panOffset.add(en)}_panUp(e,n){this.screenSpacePanning===!0?en.setFromMatrixColumn(n,1):(en.setFromMatrixColumn(n,0),en.crossVectors(this.object.up,en)),en.multiplyScalar(e),this._panOffset.add(en)}_pan(e,n){const i=this.domElement;if(this.object.isPerspectiveCamera){const r=this.object.position;en.copy(r).sub(this.target);let s=en.length();s*=Math.tan(this.object.fov/2*Math.PI/180),this._panLeft(2*e*s/i.clientHeight,this.object.matrix),this._panUp(2*n*s/i.clientHeight,this.object.matrix)}else this.object.isOrthographicCamera?(this._panLeft(e*(this.object.right-this.object.left)/this.object.zoom/i.clientWidth,this.object.matrix),this._panUp(n*(this.object.top-this.object.bottom)/this.object.zoom/i.clientHeight,this.object.matrix)):(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - pan disabled."),this.enablePan=!1)}_dollyOut(e){this.object.isPerspectiveCamera||this.object.isOrthographicCamera?this._scale/=e:(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),this.enableZoom=!1)}_dollyIn(e){this.object.isPerspectiveCamera||this.object.isOrthographicCamera?this._scale*=e:(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),this.enableZoom=!1)}_updateZoomParameters(e,n){if(!this.zoomToCursor)return;this._performCursorZoom=!0;const i=this.domElement.getBoundingClientRect(),r=e-i.left,s=n-i.top,a=i.width,o=i.height;this._mouse.x=r/a*2-1,this._mouse.y=-(s/o)*2+1,this._dollyDirection.set(this._mouse.x,this._mouse.y,1).unproject(this.object).sub(this.object.position).normalize()}_clampDistance(e){return Math.max(this.minDistance,Math.min(this.maxDistance,e))}_handleMouseDownRotate(e){this._rotateStart.set(e.clientX,e.clientY)}_handleMouseDownDolly(e){this._updateZoomParameters(e.clientX,e.clientX),this._dollyStart.set(e.clientX,e.clientY)}_handleMouseDownPan(e){this._panStart.set(e.clientX,e.clientY)}_handleMouseMoveRotate(e){this._rotateEnd.set(e.clientX,e.clientY),this._rotateDelta.subVectors(this._rotateEnd,this._rotateStart).multiplyScalar(this.rotateSpeed);const n=this.domElement;this._rotateLeft(Hn*this._rotateDelta.x/n.clientHeight),this._rotateUp(Hn*this._rotateDelta.y/n.clientHeight),this._rotateStart.copy(this._rotateEnd),this.update()}_handleMouseMoveDolly(e){this._dollyEnd.set(e.clientX,e.clientY),this._dollyDelta.subVectors(this._dollyEnd,this._dollyStart),this._dollyDelta.y>0?this._dollyOut(this._getZoomScale(this._dollyDelta.y)):this._dollyDelta.y<0&&this._dollyIn(this._getZoomScale(this._dollyDelta.y)),this._dollyStart.copy(this._dollyEnd),this.update()}_handleMouseMovePan(e){this._panEnd.set(e.clientX,e.clientY),this._panDelta.subVectors(this._panEnd,this._panStart).multiplyScalar(this.panSpeed),this._pan(this._panDelta.x,this._panDelta.y),this._panStart.copy(this._panEnd),this.update()}_handleMouseWheel(e){this._updateZoomParameters(e.clientX,e.clientY),e.deltaY<0?this._dollyIn(this._getZoomScale(e.deltaY)):e.deltaY>0&&this._dollyOut(this._getZoomScale(e.deltaY)),this.update()}_handleKeyDown(e){let n=!1;switch(e.code){case this.keys.UP:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateUp(Hn*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(0,this.keyPanSpeed),n=!0;break;case this.keys.BOTTOM:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateUp(-Hn*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(0,-this.keyPanSpeed),n=!0;break;case this.keys.LEFT:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateLeft(Hn*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(this.keyPanSpeed,0),n=!0;break;case this.keys.RIGHT:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateLeft(-Hn*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(-this.keyPanSpeed,0),n=!0;break}n&&(e.preventDefault(),this.update())}_handleTouchStartRotate(e){if(this._pointers.length===1)this._rotateStart.set(e.pageX,e.pageY);else{const n=this._getSecondPointerPosition(e),i=.5*(e.pageX+n.x),r=.5*(e.pageY+n.y);this._rotateStart.set(i,r)}}_handleTouchStartPan(e){if(this._pointers.length===1)this._panStart.set(e.pageX,e.pageY);else{const n=this._getSecondPointerPosition(e),i=.5*(e.pageX+n.x),r=.5*(e.pageY+n.y);this._panStart.set(i,r)}}_handleTouchStartDolly(e){const n=this._getSecondPointerPosition(e),i=e.pageX-n.x,r=e.pageY-n.y,s=Math.sqrt(i*i+r*r);this._dollyStart.set(0,s)}_handleTouchStartDollyPan(e){this.enableZoom&&this._handleTouchStartDolly(e),this.enablePan&&this._handleTouchStartPan(e)}_handleTouchStartDollyRotate(e){this.enableZoom&&this._handleTouchStartDolly(e),this.enableRotate&&this._handleTouchStartRotate(e)}_handleTouchMoveRotate(e){if(this._pointers.length==1)this._rotateEnd.set(e.pageX,e.pageY);else{const i=this._getSecondPointerPosition(e),r=.5*(e.pageX+i.x),s=.5*(e.pageY+i.y);this._rotateEnd.set(r,s)}this._rotateDelta.subVectors(this._rotateEnd,this._rotateStart).multiplyScalar(this.rotateSpeed);const n=this.domElement;this._rotateLeft(Hn*this._rotateDelta.x/n.clientHeight),this._rotateUp(Hn*this._rotateDelta.y/n.clientHeight),this._rotateStart.copy(this._rotateEnd)}_handleTouchMovePan(e){if(this._pointers.length===1)this._panEnd.set(e.pageX,e.pageY);else{const n=this._getSecondPointerPosition(e),i=.5*(e.pageX+n.x),r=.5*(e.pageY+n.y);this._panEnd.set(i,r)}this._panDelta.subVectors(this._panEnd,this._panStart).multiplyScalar(this.panSpeed),this._pan(this._panDelta.x,this._panDelta.y),this._panStart.copy(this._panEnd)}_handleTouchMoveDolly(e){const n=this._getSecondPointerPosition(e),i=e.pageX-n.x,r=e.pageY-n.y,s=Math.sqrt(i*i+r*r);this._dollyEnd.set(0,s),this._dollyDelta.set(0,Math.pow(this._dollyEnd.y/this._dollyStart.y,this.zoomSpeed)),this._dollyOut(this._dollyDelta.y),this._dollyStart.copy(this._dollyEnd);const a=(e.pageX+n.x)*.5,o=(e.pageY+n.y)*.5;this._updateZoomParameters(a,o)}_handleTouchMoveDollyPan(e){this.enableZoom&&this._handleTouchMoveDolly(e),this.enablePan&&this._handleTouchMovePan(e)}_handleTouchMoveDollyRotate(e){this.enableZoom&&this._handleTouchMoveDolly(e),this.enableRotate&&this._handleTouchMoveRotate(e)}_addPointer(e){this._pointers.push(e.pointerId)}_removePointer(e){delete this._pointerPositions[e.pointerId];for(let n=0;n<this._pointers.length;n++)if(this._pointers[n]==e.pointerId){this._pointers.splice(n,1);return}}_isTrackingPointer(e){for(let n=0;n<this._pointers.length;n++)if(this._pointers[n]==e.pointerId)return!0;return!1}_trackPointer(e){let n=this._pointerPositions[e.pointerId];n===void 0&&(n=new We,this._pointerPositions[e.pointerId]=n),n.set(e.pageX,e.pageY)}_getSecondPointerPosition(e){const n=e.pointerId===this._pointers[0]?this._pointers[1]:this._pointers[0];return this._pointerPositions[n]}_customWheelEvent(e){const n=e.deltaMode,i={clientX:e.clientX,clientY:e.clientY,deltaY:e.deltaY};switch(n){case 1:i.deltaY*=16;break;case 2:i.deltaY*=100;break}return e.ctrlKey&&!this._controlActive&&(i.deltaY*=10),i}}function SC(t){this.enabled!==!1&&(this._pointers.length===0&&(this.domElement.setPointerCapture(t.pointerId),this.domElement.ownerDocument.addEventListener("pointermove",this._onPointerMove),this.domElement.ownerDocument.addEventListener("pointerup",this._onPointerUp)),!this._isTrackingPointer(t)&&(this._addPointer(t),t.pointerType==="touch"?this._onTouchStart(t):this._onMouseDown(t),this._cursorStyle==="grab"&&(this.domElement.style.cursor="grabbing")))}function MC(t){this.enabled!==!1&&(t.pointerType==="touch"?this._onTouchMove(t):this._onMouseMove(t))}function EC(t){switch(this._removePointer(t),this._pointers.length){case 0:this.domElement.releasePointerCapture(t.pointerId),this.domElement.ownerDocument.removeEventListener("pointermove",this._onPointerMove),this.domElement.ownerDocument.removeEventListener("pointerup",this._onPointerUp),this.dispatchEvent(jx),this.state=bt.NONE,this._cursorStyle==="grab"&&(this.domElement.style.cursor="grab");break;case 1:const e=this._pointers[0],n=this._pointerPositions[e];this._onTouchStart({pointerId:e,pageX:n.x,pageY:n.y});break}}function wC(t){let e;switch(t.button){case 0:e=this.mouseButtons.LEFT;break;case 1:e=this.mouseButtons.MIDDLE;break;case 2:e=this.mouseButtons.RIGHT;break;default:e=-1}switch(e){case Pa.DOLLY:if(this.enableZoom===!1)return;this._handleMouseDownDolly(t),this.state=bt.DOLLY;break;case Pa.ROTATE:if(t.ctrlKey||t.metaKey||t.shiftKey){if(this.enablePan===!1)return;this._handleMouseDownPan(t),this.state=bt.PAN}else{if(this.enableRotate===!1)return;this._handleMouseDownRotate(t),this.state=bt.ROTATE}break;case Pa.PAN:if(t.ctrlKey||t.metaKey||t.shiftKey){if(this.enableRotate===!1)return;this._handleMouseDownRotate(t),this.state=bt.ROTATE}else{if(this.enablePan===!1)return;this._handleMouseDownPan(t),this.state=bt.PAN}break;default:this.state=bt.NONE}this.state!==bt.NONE&&this.dispatchEvent($p)}function TC(t){switch(this.state){case bt.ROTATE:if(this.enableRotate===!1)return;this._handleMouseMoveRotate(t);break;case bt.DOLLY:if(this.enableZoom===!1)return;this._handleMouseMoveDolly(t);break;case bt.PAN:if(this.enablePan===!1)return;this._handleMouseMovePan(t);break}}function bC(t){this.enabled===!1||this.enableZoom===!1||this.state!==bt.NONE||(t.preventDefault(),this.dispatchEvent($p),this._handleMouseWheel(this._customWheelEvent(t)),this.dispatchEvent(jx))}function AC(t){this.enabled!==!1&&this._handleKeyDown(t)}function CC(t){switch(this._trackPointer(t),this._pointers.length){case 1:switch(this.touches.ONE){case Sa.ROTATE:if(this.enableRotate===!1)return;this._handleTouchStartRotate(t),this.state=bt.TOUCH_ROTATE;break;case Sa.PAN:if(this.enablePan===!1)return;this._handleTouchStartPan(t),this.state=bt.TOUCH_PAN;break;default:this.state=bt.NONE}break;case 2:switch(this.touches.TWO){case Sa.DOLLY_PAN:if(this.enableZoom===!1&&this.enablePan===!1)return;this._handleTouchStartDollyPan(t),this.state=bt.TOUCH_DOLLY_PAN;break;case Sa.DOLLY_ROTATE:if(this.enableZoom===!1&&this.enableRotate===!1)return;this._handleTouchStartDollyRotate(t),this.state=bt.TOUCH_DOLLY_ROTATE;break;default:this.state=bt.NONE}break;default:this.state=bt.NONE}this.state!==bt.NONE&&this.dispatchEvent($p)}function RC(t){switch(this._trackPointer(t),this.state){case bt.TOUCH_ROTATE:if(this.enableRotate===!1)return;this._handleTouchMoveRotate(t),this.update();break;case bt.TOUCH_PAN:if(this.enablePan===!1)return;this._handleTouchMovePan(t),this.update();break;case bt.TOUCH_DOLLY_PAN:if(this.enableZoom===!1&&this.enablePan===!1)return;this._handleTouchMoveDollyPan(t),this.update();break;case bt.TOUCH_DOLLY_ROTATE:if(this.enableZoom===!1&&this.enableRotate===!1)return;this._handleTouchMoveDollyRotate(t),this.update();break;default:this.state=bt.NONE}}function PC(t){this.enabled!==!1&&t.preventDefault()}function NC(t){t.key==="Control"&&(this._controlActive=!0,this.domElement.getRootNode().addEventListener("keyup",this._interceptControlUp,{passive:!0,capture:!0}))}function LC(t){t.key==="Control"&&(this._controlActive=!1,this.domElement.getRootNode().removeEventListener("keyup",this._interceptControlUp,{passive:!0,capture:!0}))}function DC(){const t=new wn;t.name="Equator300",t.scale.setScalar(.0018);const n=(d,m=.48,M=.3)=>new it({color:d,roughness:m,metalness:M}),i=n(3356477),r=n(4474959),s=n(1842722),a=n(15886866,.42,.1),o=n(2829875,.34,.55),l=n(10134187,.28,.9),c=n(7238780,.55,.35),h=n(13777466,.25,.2),p=n(13357783,.32,.72),f=(d,m,M,y,T,E)=>{const C=new Be(m,M);return C.position.set(y,T,E),C.castShadow=!0,C.receiveShadow=!0,d.add(C),C},g=(d,m,M,y=24)=>new It(d,m,M,y),v=(d,m)=>{const M=d*Math.PI/180;return[Math.sin(M)*m,Math.cos(M)*m]},S=(d,m,M,y,T)=>{const E=M.clone().sub(m),C=f(d,g(y,y,E.length(),12),T,0,0,0);C.position.copy(m).addScaledVector(E,.5),C.quaternion.setFromUnitVectors(new I(0,1,0),E.normalize())};f(t,g(329,350,78,6),i,0,57,0).rotation.y=-Math.PI/6,f(t,g(225,250,44,6),r,0,118,0).rotation.y=-Math.PI/6,f(t,g(150,150,19,40),c,0,149.5,0);for(let d=0;d<6;d+=1){const[m,M]=v(30+d*60,300);f(t,g(18,22,18),a,m,12,M),f(t,g(24,24,6),s,m,3,M)}for(const d of[60,180,300]){const[m,M]=v(d,320),y=Math.cos(d*Math.PI/180),T=-Math.sin(d*Math.PI/180);for(const b of[-46,46]){const P=m+y*b,D=M+T*b;f(t,g(17,17,660,16),o,P,373,D),S(t,new I(P,678,D),new I(0,464,0),10,l)}const[E,C]=v(d,330),x=f(t,g(75,75,62,36),s,E,716,C);x.rotation.x=Math.PI/2,f(t,g(24,24,68,24),l,E,716,C).rotation.x=Math.PI/2,f(t,g(34,34,66),r,E,772,C)}f(t,g(205,205,74,48),i,0,777,0);for(const d of[60,180,300]){const[m,M]=v(d,294);f(t,g(105,105,74,32),i,m,777,M),f(t,g(72,72,72,24),i,m*.55,777,M*.55),f(t,g(58,66,34),s,m*.62,826,M*.62)}f(t,new Ft(250,145,175),i,0,886,0),f(t,new Ft(120,56,27),a,0,845,101),f(t,g(28,28,215),l,0,570,0),f(t,g(32,20,48),r,0,396,0),f(t,g(4,4,118,12),l,0,310,0),f(t,new Gp(6,18,12),h,0,246,0);const _=f(t,g(37,37,30,24),p,0,176,0);return _.visible=!1,{root:t,workpiece:_}}const Xx="/assets/trak-tc820-machine-transparent-D7PwEI2F.png",Ng=/^(?:[-*•]|\d+[.)])\s+/;function $x(t){return String(t??"").replace(/\r\n?/g,`
`).split(`
`).map(e=>e.trim())}const IC=/^(?:文档|来源|页码|内容类型|标题|分数|source|title|page|content[_ -]?type|score)\s*[:：]/i,UC=/^\s*\[[^\]]+\]\s*本地OCR识别结果(?:（[^）]*）|\([^)]*\))?\s*[:：]?\s*/i,FC=/\b(?:device_id|timestamp|temperature|vibration|rpm|alarm_code|alarm_level|health_score)\s*=/i,OC=/^检索到\s*\d+\s*条(?:相关)?知识证据\s*[：:]/,qx=/```(?:json)?\s*([\s\S]*?)```/gi;function Yx(t){const e=String(t??"");for(const n of e.matchAll(qx))try{const i=JSON.parse(n[1].trim());if(i&&typeof i=="object"&&!Array.isArray(i))return i}catch{}return null}function kC(t){const e=String(t??"").trim();return/^\[fake-model\]\s*query\s*:/i.test(e)||/^query\s*:[^\n]+\n\s*evidence\s*:/i.test(e)}function Lg(t){var n,i,r,s,a,o;return[(n=t==null?void 0:t.knowledge)==null?void 0:n.answer,OC.test(String(((i=t==null?void 0:t.knowledge)==null?void 0:i.summary)||"").trim())?"":(r=t==null?void 0:t.knowledge)==null?void 0:r.summary,(s=t==null?void 0:t.diagnosis)==null?void 0:s.summary,(a=t==null?void 0:t.diagnosis)==null?void 0:a.fault,(o=t==null?void 0:t.route_result)==null?void 0:o.reason].map(nn).find(Boolean)||""}function nn(t){const e=VC(t);return!e||kC(e)?"":$x(e.replace(qx,"")).map(n=>n.replace(UC,"").trim()).filter(n=>n&&!IC.test(n)&&!/^\[[^\]]+\s*\|[^\]]+\]\s*$/i.test(n)).join(`
`).trim()}function BC(t){const e=nn(t);return!e||/^\[(?:table|cad_drawing)\b/i.test(e)||/^(?:文档|页码|内容类型|本地OCR识别结果|表格行\d+)\s*[:：]/i.test(e)||/表格行\d+\s*[:：]/i.test(e)?"":FC.test(e)?e.split(/\b(?:device_id|timestamp|temperature|vibration|rpm|alarm_code|alarm_level|health_score)\s*=/i)[0].replace(/[：:]\s*$/,"").trim():e}function zC(t){const e=$x(t),n=[];let i=[],r=[];const s=()=>{i.length&&(n.push({type:"paragraph",text:i.join(" ")}),i=[])},a=()=>{r.length&&(n.push({type:"list",items:[...r]}),r=[])};for(const o of e){if(!o){s(),a();continue}const l=o.match(/^(?:---\s+)?(#{1,6})\s+(.+)$/);if(l){s(),a(),n.push({type:"heading",level:l[1].length,text:l[2].trim()});continue}if(/^(?:---|___|\*\*\*)+$/.test(o)){s(),a(),n.push({type:"rule"});continue}if(Ng.test(o)){s(),r.push(o.replace(Ng,"").trim());continue}a(),i.push(o)}return s(),a(),n}function HC(t){return String(t??"").split(/(\*\*[^*]+\*\*|__[^_]+__|`[^`]+`)/g).filter(Boolean).map(e=>/^\*\*[^*]+\*\*$/.test(e)||/^__[^_]+__$/.test(e)?{type:"strong",text:e.slice(2,-2)}:/^`[^`]+`$/.test(e)?{type:"code",text:e.slice(1,-1)}:{type:"text",text:e})}function VC(t){return typeof t=="string"?t.trim():!t||typeof t!="object"?"":String(t.content??t.body??t.text??t.answer??t.summary??t.conclusion??t.diagnosis??t.fault??t.feedback??t.result??"").trim()}function mt(t){return String(t??"").trim()}const Kx={"TRAK-TC820LTYSI-001":"TRAK TC820LTYsi 车削中心","LNS-QL-SERVO-80-S2-001":"LNS QL Servo 80 S2 棒料送料机","ELITE-CS612-ROBOT-001":"ELITE ROBOTS CS612 六轴协作机器人","RENISHAW-EQUATOR300-001":"Renishaw Equator 300 比对仪"};function GC(t={},e={}){var n;return mt(t.device_id||t.machine_id||e.device_id||((n=e.sample)==null?void 0:n.device_id))}function Zx(t,e={}){var s;const n=mt(t),r=(Array.isArray((s=e==null?void 0:e.snapshot)==null?void 0:s.devices)?e.snapshot.devices:Array.isArray(e==null?void 0:e.devices)?e.devices:[]).find(a=>mt((a==null?void 0:a.device_id)||(a==null?void 0:a.id))===n);return mt((e==null?void 0:e.device_name)||(e==null?void 0:e.machine_name)||(r==null?void 0:r.name)||(r==null?void 0:r.display_name)||Kx[n]||n||"设备")}function jC(t={},e={}){const n=t.diagnosis_context&&typeof t.diagnosis_context=="object"?t.diagnosis_context:{},i=e.sample&&typeof e.sample=="object"?e.sample:{},r=[e.fault,e.summary,n.fault,n.summary,n.diagnosis,t.alarm_label,i.alarm_label,t.alarm_code||i.alarm_code?`报警 ${t.alarm_code||i.alarm_code}`:""].map(mt).find(s=>s&&!/[{}]/.test(s));return r?r.replace(/^设备维修[:：]\s*/i,""):""}function Qx(t){const e=t&&typeof t=="object"?t.content??t.body??t.text??t.title??t.name??t.description??"":t,n=nn(mt(e).replace(/\bLOTO\s*断电挂牌\b/gi,"断电挂牌").replace(/\s*\bLOTO\b\s*/gi,"").replace(/\brunning\b/gi,"运行").replace(/\bidle\b/gi,"待机"));return!n||/^\[(?:table|cad_drawing)\b/i.test(n)||/^(?:文档|页码|内容类型|本地OCR识别结果|表格行\d+)\s*[:：]/i.test(n)||/表格行\d+\s*[:：]/i.test(n)?"":n}function WC(t){const e=mt(t),n=e.toLowerCase(),i=["本地ocr识别结果","内容类型:","evidence.","steps.action","steps.safety","positioningerror","encoderlost","报警字典"];return e.length<=120&&!i.some(r=>n.includes(r))}function aa(t,{executableOnly:e=!1}={}){return(Array.isArray(t)?t:mt(t).split(/[；;\n。]+/u)).map(Qx).filter(Boolean).filter(i=>!e||WC(i)).filter((i,r,s)=>s.indexOf(i)===r)}function XC(t){return Array.isArray(t)?t.map(e=>{if(e&&typeof e=="object")return e;const n=Qx(e);return n?{type:"note",content:n}:null}).filter(Boolean):[]}function $C(t){const e=t&&typeof t=="object"?t:{fault:t},n=[e.summary,e.fault,e.diagnosis].map(Yx).find(Boolean)||{},i=nn(n.summary||e.summary||e.fault||e.diagnosis),r=nn(n.diagnosis||e.cause||e.diagnosis);return{...e,fault:i,summary:i,cause:r,diagnosis:r,recommendation:nn(n.recommendation||e.recommendation),nextAction:nn(e.next_action||n.next_action),severity:nn(e.severity||n.severity)}}function qC({order:t={},plan:e={},diagnosis:n={}}={}){var l,c,h;const i=e&&typeof e=="object"&&(e.plan_id||(l=e.repair_steps)!=null&&l.length||(c=e.tools)!=null&&c.length||(h=e.required_tools)!=null&&h.length)?e:null,r=t.maintenance_plan_snapshot&&typeof t.maintenance_plan_snapshot=="object"?t.maintenance_plan_snapshot:t.maintenance_plan&&typeof t.maintenance_plan=="object"?t.maintenance_plan:{},s=i||r,a=i?"maintenance-plan":Object.keys(r).length?"legacy-workorder-snapshot":"unavailable",o=s.diagnosis&&typeof s.diagnosis=="object"?s.diagnosis:t.diagnosis_snapshot&&typeof t.diagnosis_snapshot=="object"?t.diagnosis_snapshot:n;return{planId:mt(s.plan_id),diagnosis:$C(o),steps:aa(s.repair_steps||s.steps,{executableOnly:!0}),tools:aa(s.tools||s.required_tools),parts:aa(s.parts||s.required_parts),safety:aa(s.safety||s.safety_requirements),preChecks:aa(s.pre_checks,{executableOnly:!0}),postChecks:aa(s.post_checks,{executableOnly:!0}),evidence:XC(s.evidence||s.memory_evidence),riskLevel:mt(s.risk_level||s.riskLevel),estimatedTime:mt(s.estimated_time||s.estimatedTime||s.estimated_duration),source:a}}function Ru(t={},e={},n={}){var h;const i=nn(t.title),r=mt(e.part_name)&&!["待确认故障部件","待补充"].includes(mt(e.part_name))?mt(e.part_name):"设备",s=GC(t,n),a=Zx(s,n),o=!!(mt((n==null?void 0:n.device_name)||(n==null?void 0:n.machine_name))||Array.isArray((h=n==null?void 0:n.snapshot)==null?void 0:h.devices)&&n.snapshot.devices.some(p=>mt((p==null?void 0:p.device_id)||(p==null?void 0:p.id))===s&&mt((p==null?void 0:p.name)||(p==null?void 0:p.display_name)))||Kx[s]),l=jC(t,n),c=!i||i.length>80||/[\n#{}]/.test(i)||/^(?:分析过程|基于|我已|让我|事件分析|诊断分析|设备维修[:：])/i.test(i)||i===`${r}维修`||i==="设备维修工单"||i==="主轴电机组件维修";return s&&o&&c?`${a} · ${l||`${r}维修`}`:i&&i.length<=80&&!/[\n#{}]/.test(i)&&!/^(?:分析过程|基于|我已|让我|事件分析|诊断分析|设备维修[:：])/i.test(i)?i:`${r}维修`}function YC({feedback:t=""}={}){return{action:"mark_repair_completed",repair_feedback:{feedback:mt(t)}}}function KC({order:t={},target:e={},plan:n={},diagnosis:i={},context:r={}}={}){var o,l;const s=t.diagnosis_context&&typeof t.diagnosis_context=="object"?t.diagnosis_context:{};return{title:Ru(t,e,{...r,fault:i.fault||i.summary})||"设备维修工单",workorderId:mt(t.workorder_id),deviceId:mt(t.device_id),assignee:mt(t.assignee_name||t.assignee)||"待派工",status:mt(t.status)||"open",accepted:!!t.accepted_by,verificationPhase:mt((o=t.repair_verification)==null?void 0:o.phase),machineControl:t.machine_control&&typeof t.machine_control=="object"?t.machine_control:null,recoverySample:r.recoverySample&&typeof r.recoverySample=="object"?r.recoverySample:{},partName:mt(e.part_name)||"待确认故障部件",partNo:mt(e.part_no)||"待补充",system:mt(e.system)||"待确认",location:mt(e.location)||"待现场确认",faultSymptom:mt(e.symptom)||mt(e.description)||mt(i.fault)||mt(s.diagnosis)||mt(t.title)||"设备异常",autoDispatched:["","agent","auto","monitor"].includes(mt(t.source).toLowerCase())||!!(s.summary||(l=t.drawing_context)!=null&&l.model_url)}}function qp(t,e){var n,i,r;return e||((n=t==null?void 0:t.latest_result)==null?void 0:n.current_sample)||((r=(i=t==null?void 0:t.devices)==null?void 0:i.find(s=>s.device_id===(t==null?void 0:t.device_id)))==null?void 0:r.current_sample)||{}}function Jx(t,e){const n=qp(t,e);return String((n==null?void 0:n.device_id)||(t==null?void 0:t.device_id)||"").trim()}function Yp(t,e){var r,s;const n=Jx(t,e),i=(r=t==null?void 0:t.diagnosis)==null?void 0:r.latest_by_device;return(n&&i&&typeof i[n]=="object"?i[n]:null)||((s=t==null?void 0:t.diagnosis)==null?void 0:s.latest)||{}}function ZC(t,e){var r,s;const n=Jx(t,e),i=(r=t==null?void 0:t.diagnosis)==null?void 0:r.pipeline_by_device;return(n&&i&&typeof i[n]=="object"?i[n]:null)||((s=t==null?void 0:t.diagnosis)==null?void 0:s.pipeline)||{}}function Kp(t,e,n=(i=>(i=t==null?void 0:t.diagnosis)==null?void 0:i.latest)()||{}){const r=qp(t,e),s=String((r==null?void 0:r.alarm_code)||"").trim(),a=String((n==null?void 0:n.alarm_code)||"").trim();if(!s)return!0;if(!a||s!==a)return!1;const o=String((r==null?void 0:r.device_id)||(t==null?void 0:t.device_id)||"").trim(),l=String((n==null?void 0:n.device_id)||"").trim();return!o||!l||o===l}function QC(t,e){const n=(t==null?void 0:t.diagnosis)||{},i=Yp(t,e),r=qp(t,e),s=String((r==null?void 0:r.alarm_code)||"").trim(),a=Kp(t,e,i),o=a?i:{},l=Array.isArray(o.evidence)?o.evidence.map(BC).filter(Boolean):[],c=[o.summary,o.diagnosis,o.fault].map(Yx).find(Boolean)||{},h=nn(c.summary||o.summary||o.fault||o.diagnosis),p=nn(c.diagnosis||o.cause||o.diagnosis),f=nn(c.recommendation||o.recommendation),g=nn(o.next_action||c.next_action);return{deviceId:String((r==null?void 0:r.device_id)||(t==null?void 0:t.device_id)||o.device_id||""),status:a?String(o.status||n.status||"waiting"):"waiting",summary:a?h||"等待诊断结果":s?`正在等待报警 ${s} 的诊断结果`:"等待诊断结果",cause:p,confidence:o.confidence==null?null:Number(o.confidence),evidence:l,recommendation:f,nextAction:g,isCurrent:a,currentAlarm:s}}function Ea(t){if(typeof t=="string")return t.trim();if(!t||typeof t!="object")return"";for(const e of["summary","conclusion","diagnosis","fault","feedback","result","content"])if(typeof t[e]=="string"&&t[e].trim())return t[e].trim();return""}function Dg(t,e=[]){if(Array.isArray(t))return t.map(Ea).filter(Boolean);if(!t||typeof t!="object")return[];for(const n of e)if(Array.isArray(t[n]))return t[n].map(Ea).filter(Boolean);return[]}function JC(t){const e=t&&typeof t=="object"?t:{},n=[],i=e.diagnosis||e.diagnosis_result||{},r=Ea(i);r&&n.push({title:"诊断结论",body:r});const s=e.maintenance_plan||e.maintenance||{},a=Dg(s,["repair_steps","steps","checks"]);a.length&&n.push({title:"维修步骤",items:a});const o=Ea(s);!a.length&&o&&n.push({title:"维修方案",body:o});const l=e.workorder||e.work_order||{},c=Ea(l);c&&n.push({title:"工单安排",body:c});const h=e.repair_feedback||e.repair_verification||e.repair_result||{},p=Ea(h);p&&n.push({title:"维修反馈",body:p});const f=e.quality||e.quality_result||{},g=[];return typeof f.passed=="boolean"&&g.push(f.passed?"已通过":"未通过"),g.push(...Dg(f,["findings","defects"])),g.length&&n.push({title:"质量结果",body:g.join("；")}),n}const eR=new Set(["alarm","fault","warning"]);function Ig(t={}){const e=String((t==null?void 0:t.alarm_code)||(t==null?void 0:t.error_code)||"").trim();if(e)return e;const n=Array.isArray(t==null?void 0:t.alarm_codes)?t.alarm_codes:[];return String(n.find(i=>String(i||"").trim())||"").trim()}function tR(t={},e={}){var l,c;const n=String((t==null?void 0:t.device_id)||(e==null?void 0:e.device_id)||"").trim(),i=((e==null?void 0:e.devices)||[]).find(h=>String((h==null?void 0:h.device_id)||"").trim()===n)||{},s=[t,(l=e==null?void 0:e.latest_result)==null?void 0:l.current_sample,i,i==null?void 0:i.current_sample,(c=i==null?void 0:i.latest_result)==null?void 0:c.current_sample].find(h=>{const p=String((h==null?void 0:h.status)||"").trim().toLowerCase();return eR.has(p)&&Ig(h)}),a=Ig(s),o=String((s==null?void 0:s.device_id)||n).trim();return!o||!a?{required_capabilities:["document_search"],alarm_active:!1}:{required_capabilities:["document_search"],alarm_active:!0,device_id:o,alarm_code:a,alarm_label:String((s==null?void 0:s.alarm_label)||(s==null?void 0:s.alarm_description)||"").trim(),alarm_status:String((s==null?void 0:s.status)||"").trim().toLowerCase()}}const ey=new Set(["tool_called","tool_completed","tool_started","tool_guard","tool_error"]);function jd(t){const e=Array.isArray(t)?t:(t==null?void 0:t.trace)||(t==null?void 0:t.items)||(t==null?void 0:t.events)||(t==null?void 0:t.records)||[];return Array.isArray(e)?e.filter(n=>n&&typeof n=="object"):[]}function nR(t){const e=Array.isArray(t)?t:(t==null?void 0:t.runs)||(t==null?void 0:t.items)||[];return Array.isArray(e)?e.filter(n=>n&&typeof n=="object"):[]}function Ug(t){const e=[t==null?void 0:t.type,t==null?void 0:t.event,t==null?void 0:t.name,t==null?void 0:t.node,t==null?void 0:t.agent,t==null?void 0:t.tool,t==null?void 0:t.tool_name,t==null?void 0:t.step].map(n=>String(n||"").toLowerCase()).join(" ");return/quality|inspect_quality|quality_check|part_quality|质检/.test(e)}function iR(t){const e=[t==null?void 0:t.type,t==null?void 0:t.event,t==null?void 0:t.name,t==null?void 0:t.node,t==null?void 0:t.agent,t==null?void 0:t.tool,t==null?void 0:t.tool_name,t==null?void 0:t.step].map(n=>String(n||"").toLowerCase()).join(" ");return/rag|knowledge|search_knowledge|knowledge_search|vector_search|document_search|retrieval|检索|知识问答/.test(e)}function rR(t,e){if(!t||!e)return!1;const n=Array.isArray(t.trace_ids)?t.trace_ids:[t.trace_id],i=Array.isArray(t.task_ids)?t.task_ids:[t.task_id],r=Array.isArray(t.event_ids)?t.event_ids:[t.event_id],s=n.filter(Boolean).includes(e.trace_id)||i.filter(Boolean).includes(e.task_id),a=r.filter(Boolean).includes(e.event_id);return!s&&!a&&(n.some(Boolean)||i.some(Boolean)||r.some(Boolean))?!1:t.run_type==="quality"?Ug(e):t.run_type==="rag"?iR(e):t.run_type==="fault"?!Ug(e):!0}function tr(t){if(t==null||t==="")return"暂无记录";if(typeof t=="string")return t;try{return JSON.stringify(t,null,2)}catch{return String(t)}}function sR(t){const e=String((t==null?void 0:t.event)||""),n=String((t==null?void 0:t.type)||"");return e==="tool_guard"?t.allowed===!1?"工具调用被拦截":"工具权限校验":e==="tool_error"||t!=null&&t.error?"执行异常":ey.has(e)||n==="tool"?e==="tool_started"?"工具开始":"工具调用":e.includes("started")||e.endsWith("_start")?"开始执行":e.includes("completed")||e.endsWith("_end")||e==="step_completed"?"执行完成":e.includes("error")||e.includes("failed")||e.includes("timeout")?"执行异常":n==="agent"?"Agent执行":n==="runtime"?"运行时状态":n==="audit"?"审计记录":"运行记录"}function aR(t){const e=String((t==null?void 0:t.event)||"").toLowerCase();return t!=null&&t.error||e.includes("error")||e.includes("failed")||e.includes("timeout")||(t==null?void 0:t.allowed)===!1?"异常":e.includes("started")||e.endsWith("_start")?"执行中":e.includes("completed")||e.endsWith("_end")||e==="tool_called"||e==="step_completed"?"已完成":"已记录"}function Zp(t){const e=Number(t==null?void 0:t.execution_time),n=Number((t==null?void 0:t.elapsed_ms)??(t==null?void 0:t.latency_ms));return Number.isFinite(n)&&n>0?`${Math.round(n)} ms`:Number.isFinite(e)&&e>0?`${Math.round(e*1e3)} ms`:(t==null?void 0:t.latency)!==void 0&&(t==null?void 0:t.latency)!==null&&t.latency!==""?`${t.latency} ms`:"--"}function ty(t){return{label:sR(t),operation:String((t==null?void 0:t.tool_name)||(t==null?void 0:t.tool)||(t==null?void 0:t.name)||(t==null?void 0:t.event)||"运行步骤"),status:aR(t),server:String((t==null?void 0:t.mcp_server)||(t==null?void 0:t.server)||""),duration:Zp(t)}}function Dn(t,e){for(const n of e)if((t==null?void 0:t[n])!==void 0&&(t==null?void 0:t[n])!==null&&t[n]!=="")return t[n];return null}function oR(t){const e=ty(t),n={类型:(t==null?void 0:t.type)||"未知",事件:(t==null?void 0:t.event)||"未知",操作:e.operation,Agent:(t==null?void 0:t.agent)||"",节点:(t==null?void 0:t.node)||(t==null?void 0:t.step)||"",状态:e.status,时间:(t==null?void 0:t.timestamp)||"",耗时:e.duration,错误:(t==null?void 0:t.error)||""},i=Dn(t,["arguments","input","tool_input","tool_arguments","request"]),r=Dn(t,["context","runtime_context","execution_context","state","trace_context"]),s=Dn(t,["output","result","return_body","response","body","data","state_change"]);return[{key:"operation",title:"执行操作",value:tr(n)},{key:"tool",title:"工具调用与输入",value:tr(i)},{key:"context",title:"输入上下文",value:tr(r)},{key:"return",title:"返回体",value:tr(s)},{key:"raw",title:"完整事件",value:tr(t)}]}function lR(t,e=0){return String((t==null?void 0:t.trace_id)||(t==null?void 0:t.task_id)||(t==null?void 0:t.agent_run_id)||`event-${e}`)}const cR=new Set(["agent_started","agent_completed","agent_error","agent_timeout","agent_failed"]);function To(t){const e=String((t==null?void 0:t.event)||"").toLowerCase();return(t==null?void 0:t.type)==="agent"||cR.has(e)}function ny(t){const e=String((t==null?void 0:t.event)||"").toLowerCase();return(t==null?void 0:t.type)==="runtime"||e==="observation_added"||e==="evidence_added"?!1:(t==null?void 0:t.type)==="tool"||ey.has(e)||!!(t!=null&&t.tool_name||t!=null&&t.tool)}function Di(t){const e=Dn(t,["context","runtime_context","execution_context","trace_context"]);return e&&typeof e=="object"&&!Array.isArray(e)?e:{}}function iy(t){var e;return String((t==null?void 0:t.agent_run_id)||((e=Di(t))==null?void 0:e.agent_run_id)||"")}function Ph(t){var e;return String((t==null?void 0:t.agent)||(t==null?void 0:t.name)||((e=Di(t))==null?void 0:e.agent)||"")}function ry(t){const e=Date.parse(String((t==null?void 0:t.timestamp)||""));return Number.isFinite(e)?e:null}function sy(t){return t.reduce((e,n)=>({...e,...Di(n)}),{})}function ay(t){const e=String((t==null?void 0:t.event)||"").toLowerCase();return!!(t!=null&&t.error)||e.includes("error")||e.includes("failed")||e.includes("timeout")||(t==null?void 0:t.allowed)===!1}function uR(t){const e=String((t==null?void 0:t.event)||"").toLowerCase();return e==="agent_completed"||e==="tool_called"||e==="tool_completed"||e==="step_completed"||e.endsWith("_completed")||e.endsWith("_end")}function dR(t){const e=t.filter(To);return e.some(ay)?"异常":e.some(n=>String((n==null?void 0:n.event)||"").toLowerCase()==="agent_completed")?"已完成":e.some(n=>String((n==null?void 0:n.event)||"").toLowerCase()==="agent_started")?"执行中":"已记录"}function fR(t,e){var l,c,h;const n=iy(t);if(n)return e.find(p=>p.agent_run_id===n)||null;const i=String((t==null?void 0:t.trace_id)||((l=Di(t))==null?void 0:l.trace_id)||""),r=String((t==null?void 0:t.task_id)||((c=Di(t))==null?void 0:c.task_id)||""),s=Ph(t),a=e.filter(p=>{const f=i&&p.trace_id&&i===p.trace_id,g=r&&p.task_id&&r===p.task_id;return s&&p.agent&&s===p.agent&&(f||g)});if(a.length<=1)return a[0]||null;const o=ry(t);return((h=a.map(p=>({group:p,distance:o===null||p.started_ms===null?Number.MAX_SAFE_INTEGER:Math.abs(o-p.started_ms)})).sort((p,f)=>p.distance-f.distance)[0])==null?void 0:h.group)||a[0]}function hR(t){const e=new Map;return t.filter(ny).forEach((n,i)=>{const r=Dn(n,["arguments","input","tool_input","tool_arguments","request"]);let s;try{s=JSON.stringify(r??"")}catch{s=String(r??"")}const a=String((n==null?void 0:n.tool_call_id)||(n==null?void 0:n.call_id)||`${(n==null?void 0:n.tool_name)||(n==null?void 0:n.tool)||(n==null?void 0:n.name)||"tool"}|${s}`),o=e.get(a)||{records:[],first_index:i};o.records.push(n),e.set(a,o)}),[...e.values()].map((n,i)=>{var l;const r=n.records,s=r[0]||{},a=r[r.length-1]||s,o=[...r].reverse().find(c=>Dn(c,["output","result","return_body","response","body","data"]));return{call_no:i+1,tool_name:String(s.tool_name||s.tool||s.name||"工具调用"),mcp_server:String(s.mcp_server||s.server||""),status:ay(r)?"异常":r.some(uR)?"已完成":"执行中",started_at:s.timestamp||"",ended_at:a.timestamp||"",duration:Zp(a),input:Dn(r.find(c=>Dn(c,["arguments","input","tool_input","tool_arguments","request"])),["arguments","input","tool_input","tool_arguments","request"]),output:Dn(o,["output","result","return_body","response","body","data"]),context:sy(r),error:((l=r.find(c=>c==null?void 0:c.error))==null?void 0:l.error)||"",event_count:r.length,records:r}})}function pR(t=[]){const e=Array.isArray(t)?t.filter(s=>s&&typeof s=="object"):[],n=new Map;e.forEach((s,a)=>{var g,v,S,_,d;if(!To(s))return;const o=Ph(s)||"未知 Agent",l=iy(s),c=`${(s==null?void 0:s.trace_id)||((g=Di(s))==null?void 0:g.trace_id)||"trace"}|${(s==null?void 0:s.task_id)||((v=Di(s))==null?void 0:v.task_id)||"task"}|${o}|${(s==null?void 0:s.attempt)||((S=Di(s))==null?void 0:S.attempt)||1}`,h=l||c,p=n.get(h)||{key:h,agent_run_id:l||c,agent:o,trace_id:String((s==null?void 0:s.trace_id)||((_=Di(s))==null?void 0:_.trace_id)||""),task_id:String((s==null?void 0:s.task_id)||((d=Di(s))==null?void 0:d.task_id)||""),started_ms:null,records:[],first_index:a};p.records.push(s);const f=ry(s);p.started_ms===null&&f!==null&&(p.started_ms=f),n.set(h,p)});const i=[...n.values()];e.forEach(s=>{if(To(s)||!ny(s))return;const a=fR(s,i);a&&a.records.push(s)});const r=new Map;return i.sort((s,a)=>s.first_index-a.first_index).map(s=>{var S,_,d;const a=s.records,o=a.find(m=>String((m==null?void 0:m.event)||"").toLowerCase()==="agent_started")||a[0],l=[...a].reverse().find(m=>["agent_completed","agent_error","agent_timeout","agent_failed"].includes(String((m==null?void 0:m.event)||"").toLowerCase()))||a[a.length-1],c=s.agent||Ph(o)||"未知 Agent",h=(r.get(c)||0)+1;r.set(c,h);const p=a.find(m=>To(m)&&Dn(m,["input","request","payload","state"]))||a.find(m=>Dn(m,["input","request","arguments","payload","state"])),f=[...a].reverse().find(m=>To(m)&&Dn(m,["output","result","return_body","response","body","data","state_change"]))||[...a].reverse().find(m=>Dn(m,["output","result","return_body","response","body","data","state_change"])),g=(o==null?void 0:o.timestamp)||((S=a[0])==null?void 0:S.timestamp)||"",v=(l==null?void 0:l.timestamp)||"";return{id:s.agent_run_id,invocation_no:h,agent:c,agent_run_id:s.agent_run_id,trace_id:s.trace_id||String((o==null?void 0:o.trace_id)||""),task_id:s.task_id||String((o==null?void 0:o.task_id)||""),step:String((o==null?void 0:o.step)||(o==null?void 0:o.node)||((_=Di(o))==null?void 0:_.step)||""),status:dR(a),started_at:g,ended_at:v,duration:Zp(l),input:Dn(p,["input","request","arguments","payload","state"]),context:sy(a),output:Dn(f,["output","result","return_body","response","body","data","state_change"]),error:((d=a.find(m=>m==null?void 0:m.error))==null?void 0:d.error)||"",tool_calls:hR(a),event_count:a.length,records:a}})}const Nh="industry-agent.rag-session.v1",Lh="industry-agent.rag-session.fallback.v1";function Fg(t){var r,s,a,o;if(!t||t.pending||t.agentError)return!1;const e=t.answer&&typeof t.answer=="object"?t.answer:{};if([(r=e.knowledge)==null?void 0:r.answer,(s=e.diagnosis)==null?void 0:s.summary,(a=e.report)==null?void 0:a.summary].some(l=>String(l||"").trim()))return!1;const i=String(((o=e.knowledge)==null?void 0:o.summary)||"").trim();return/^检索到\s*\d+\s*条(?:相关)?知识证据\s*[：:]/.test(i)||/^未检索到与[“"].+[”"]直接相关的可追踪知识证据/.test(i)}function Og(t,e){try{const n=t==null?void 0:t.getItem(e);if(!n)return null;const i=JSON.parse(n);return Array.isArray(i)?i.filter(r=>r&&!r.pending&&r.question).slice(-20):null}catch{return null}}function kg(t){let e=null,n=null;try{e=(t==null?void 0:t.sessionStorage)||null}catch{e=null}try{n=(t==null?void 0:t.localStorage)||null}catch{n=null}return{primary:e,fallback:n}}function mR(t){if(!t||typeof t!="object")return null;const e={};t.route&&(e.route=t.route),t.route_result&&typeof t.route_result=="object"&&(e.route_result={intent:t.route_result.intent,reason:t.route_result.reason});for(const n of["knowledge","diagnosis","report"]){const i=t[n];!i||typeof i!="object"||(n==="knowledge"&&(e.knowledge={answer:i.answer,summary:i.summary}),n==="diagnosis"&&(e.diagnosis={summary:i.summary,fault:i.fault,diagnosis:i.diagnosis}),n==="report"&&(e.report={title:i.title,summary:i.summary}))}return e}function gR(t){return(Array.isArray(t)?t:[]).filter(e=>e&&!e.pending&&e.question).slice(-20).map(e=>({id:String(e.id||`${Date.now()}-${Math.random()}`),question:String(e.question),answer:mR(e.answer),agentError:String(e.agentError||""),pending:!1}))}function _R(t,e=null){const n=Og(t,Nh);return n!==null?n:Og(e,Lh)||[]}function vR(t,e,n=null){const i=gR(e);if(!i.length){try{t==null||t.removeItem(Nh)}catch{}try{n==null||n.removeItem(Lh)}catch{}return}const r=JSON.stringify(i);try{t==null||t.setItem(Nh,r)}catch{}try{n==null||n.setItem(Lh,r)}catch{}}const xR=new Set(["emergency_stop","e_stop","stopped"]);function oy(t={}){var n;const e=String((t==null?void 0:t.status)||(t==null?void 0:t.control_state)||"").toLowerCase();return xR.has(e)&&((n=t==null?void 0:t.fault_evidence)==null?void 0:n.evidence_status)==="unavailable"}function yR(t={}){if(oy(t))return"待复核";if((t==null?void 0:t.health_score)===null||(t==null?void 0:t.health_score)===void 0)return"--";const e=Number(t.health_score);return Number.isFinite(e)?`${e.toFixed(0)}/100`:String(t.health_score)}function SR(t={}){var n;return oy(t)?`${String(t.control_reason||((n=t.fault_evidence)==null?void 0:n.control_reason)||"安全联锁已触发").trim()}；停机前未采集到具体报警码或异常指标，健康度不可用`:""}const MR=[{label:"生产运营",items:[{id:"cad",label:"生产建模",icon:"cad"},{id:"monitor",label:"监控中心",icon:"monitor"},{id:"diagnosis",label:"智能诊断",icon:"diagnosis"},{id:"maintenance",label:"维修方案",icon:"maintenance"},{id:"workorder",label:"工单系统",icon:"workorder"},{id:"quality",label:"质检系统",icon:"quality"}]},{label:"知识资产",items:[{id:"rag",label:"知识问答",icon:"knowledge"},{id:"logs",label:"日志系统",icon:"logs"},{id:"report",label:"报告中心",icon:"report"}]}];function ER({name:t}){const e={cad:u.jsx(u.Fragment,{children:u.jsx("path",{d:"M12 2 3 7v10l9 5 9-5V7l-9-5ZM3 7l9 5 9-5M12 12v10"})}),monitor:u.jsxs(u.Fragment,{children:[u.jsx("rect",{x:"3",y:"4",width:"18",height:"14",rx:"2"}),u.jsx("path",{d:"M7 13l3-3 2 2 4-4 2 2M8 21h8m-4-3v3"})]}),diagnosis:u.jsxs(u.Fragment,{children:[u.jsx("path",{d:"M12 3a6 6 0 0 0-3.7 10.7L7 18h10l-1.3-4.3A6 6 0 0 0 12 3Z"}),u.jsx("path",{d:"M9 21h6M10 18h4"})]}),workorder:u.jsxs(u.Fragment,{children:[u.jsx("rect",{x:"5",y:"4",width:"14",height:"17",rx:"2"}),u.jsx("path",{d:"M9 4.5V3h6v1.5M9 10h6M9 14h6M9 18h4"})]}),quality:u.jsxs(u.Fragment,{children:[u.jsx("path",{d:"M12 2 4 5v6c0 5 3.4 8.5 8 11 4.6-2.5 8-6 8-11V5l-8-3Z"}),u.jsx("path",{d:"m8.5 12 2.5 2.5 4.5-5"})]}),maintenance:u.jsxs(u.Fragment,{children:[u.jsx("rect",{x:"4",y:"3",width:"16",height:"18",rx:"2"}),u.jsx("path",{d:"M8 7h8M8 11h8M8 15h5M8 18h3"})]}),knowledge:u.jsx(u.Fragment,{children:u.jsx("path",{d:"M12 6c-2.5-2-5.5-2.3-9-1v14c3.5-1.3 6.5-1 9 1 2.5-2 5.5-2.3 9-1V5c-3.5-1.3-6.5-1-9 1ZM12 6v14"})}),logs:u.jsxs(u.Fragment,{children:[u.jsx("rect",{x:"5",y:"3",width:"14",height:"18",rx:"2"}),u.jsx("path",{d:"M8.5 8h7M8.5 12h7M8.5 16h4M8 8h.01M8 12h.01M8 16h.01"})]}),report:u.jsxs(u.Fragment,{children:[u.jsx("rect",{x:"5",y:"3",width:"14",height:"18",rx:"2"}),u.jsx("path",{d:"M9 8h6M9 12h6M9 16h4"})]})};return u.jsx("svg",{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.7",strokeLinecap:"round",strokeLinejoin:"round","aria-hidden":"true",children:e[t]})}function wR({activeView:t,onChange:e,hasError:n,connected:i}){return u.jsxs("aside",{className:"workbench-sidebar","aria-label":"工作台导航",children:[u.jsxs("div",{className:"workbench-brand",children:[u.jsx("span",{className:"workbench-brand-mark","aria-hidden":"true",children:"IA"}),u.jsxs("span",{children:[u.jsx("strong",{children:"IND-Agent"}),u.jsx("small",{children:"工业智能工作台"})]})]}),u.jsx("nav",{className:"workbench-nav","aria-label":"功能导航",children:MR.map(r=>u.jsxs("div",{className:"workbench-nav-group",children:[u.jsx("span",{className:"workbench-nav-caption",children:r.label}),r.items.map(s=>u.jsxs("button",{type:"button",className:`workbench-nav-item ${t===s.id?"is-active":""}`,"aria-current":t===s.id?"page":void 0,onClick:()=>e(s.id),children:[u.jsx(ER,{name:s.icon}),u.jsx("span",{children:s.label}),s.id==="monitor"&&u.jsx("i",{"aria-label":"实时",children:"LIVE"})]},s.id))]},r.label))}),u.jsxs("div",{className:"workbench-sidebar-status",role:"status",children:[u.jsx("span",{className:`workbench-status-dot ${n?"is-error":i?"":"is-pending"}`}),u.jsxs("span",{children:[u.jsx("strong",{children:n?"连接异常":i?"服务运行中":"连接中"}),u.jsx("small",{children:n?"请检查服务连接":i?"设备数据持续同步":"正在获取设备快照"})]})]})]})}class TR extends jp{constructor(e){super(e)}load(e,n,i,r){const s=this,a=new gw(this.manager);a.setPath(this.path),a.setResponseType("arraybuffer"),a.setRequestHeader(this.requestHeader),a.setWithCredentials(this.withCredentials),a.load(e,function(o){try{n(s.parse(o))}catch(l){r?r(l):console.error(l),s.manager.itemError(e)}},i,r)}parse(e){function n(c){const h=new DataView(c),p=32/8*3+32/8*3*3+16/8,f=h.getUint32(80,!0);if(80+32/8+f*p===h.byteLength)return!0;const v=[115,111,108,105,100];for(let S=0;S<5;S++)if(i(v,h,S))return!1;return!0}function i(c,h,p){for(let f=0,g=c.length;f<g;f++)if(c[f]!==h.getUint8(p+f))return!1;return!0}function r(c){const h=new DataView(c),p=h.getUint32(80,!0);let f,g,v,S=!1,_,d,m,M,y;for(let D=0;D<70;D++)h.getUint32(D,!1)==1129270351&&h.getUint8(D+4)==82&&h.getUint8(D+5)==61&&(S=!0,_=new Float32Array(p*3*3),d=h.getUint8(D+6)/255,m=h.getUint8(D+7)/255,M=h.getUint8(D+8)/255,y=h.getUint8(D+9)/255);const T=84,E=12*4+2,C=new Rn,x=new Float32Array(p*3*3),b=new Float32Array(p*3*3),P=new ct;for(let D=0;D<p;D++){const O=T+D*E,F=h.getFloat32(O,!0),U=h.getFloat32(O+4,!0),W=h.getFloat32(O+8,!0);if(S){const N=h.getUint16(O+48,!0);N&32768?(f=d,g=m,v=M):(f=(N&31)/31,g=(N>>5&31)/31,v=(N>>10&31)/31)}for(let N=1;N<=3;N++){const z=O+N*12,k=D*3*3+(N-1)*3;x[k]=h.getFloat32(z,!0),x[k+1]=h.getFloat32(z+4,!0),x[k+2]=h.getFloat32(z+8,!0),b[k]=F,b[k+1]=U,b[k+2]=W,S&&(P.setRGB(f,g,v,ei),_[k]=P.r,_[k+1]=P.g,_[k+2]=P.b)}}return C.setAttribute("position",new vi(x,3)),C.setAttribute("normal",new vi(b,3)),S&&(C.setAttribute("color",new vi(_,3)),C.hasColors=!0,C.alpha=y),C}function s(c){const h=new Rn,p=/solid([\s\S]*?)endsolid/g,f=/facet([\s\S]*?)endfacet/g,g=/solid\s(.+)/;let v=0;const S=/[\s]+([+-]?(?:\d*)(?:\.\d*)?(?:[eE][+-]?\d+)?)/.source,_=new RegExp("vertex"+S+S+S,"g"),d=new RegExp("normal"+S+S+S,"g"),m=[],M=[],y=[],T=new I;let E,C=0,x=0,b=0;for(;(E=p.exec(c))!==null;){x=b;const P=E[0],D=(E=g.exec(P))!==null?E[1]:"";for(y.push(D);(E=f.exec(P))!==null;){let U=0,W=0;const N=E[0];for(;(E=d.exec(N))!==null;)T.x=parseFloat(E[1]),T.y=parseFloat(E[2]),T.z=parseFloat(E[3]),W++;for(;(E=_.exec(N))!==null;)m.push(parseFloat(E[1]),parseFloat(E[2]),parseFloat(E[3])),M.push(T.x,T.y,T.z),U++,b++;W!==1&&console.error("THREE.STLLoader: Something isn't right with the normal of face number "+v),U!==3&&console.error("THREE.STLLoader: Something isn't right with the vertices of face number "+v),v++}const O=x,F=b-x;h.userData.groupNames=y,h.addGroup(O,F,C),C++}return h.setAttribute("position",new Wt(m,3)),h.setAttribute("normal",new Wt(M,3)),h}function a(c){return typeof c!="string"?new TextDecoder().decode(c):c}function o(c){if(typeof c=="string"){const h=new Uint8Array(c.length);for(let p=0;p<c.length;p++)h[p]=c.charCodeAt(p)&255;return h.buffer||h}else return c}const l=o(e);return n(l)?r(l):s(a(e))}}const bR={queued:"排队中",analyzing:"解析需求",modeling:"实体建模",validating:"校验与导出",ready:"模型已生成",confirmed:"设计已确认",needs_input:"待补充信息",failed:"建模失败",interrupted:"任务已中断"},Bg=t=>bR[t]||"未知状态",Wd=t=>["queued","analyzing","modeling","validating"].includes(t),AR=t=>{var e,n;return(t==null?void 0:t.status)==="ready"&&!!t.digest&&((e=t.geometry)==null?void 0:e.valid)===!0&&((n=t.geometry)==null?void 0:n.step_roundtrip_valid)===!0};function CR(t=()=>crypto.randomUUID()){let e="",n="";const i=r=>Array.isArray(r)?r.map(i):r&&typeof r=="object"?Object.fromEntries(Object.keys(r).sort().map(s=>[s,i(r[s])])):r;return{keyFor(r,s){const a=JSON.stringify(i({path:r,payload:s}));return a!==e&&(e=a,n=t()),n},reset(){e="",n=""}}}function Tc(t,e=!1){if(!/^\/api\/cad\/designs\/CAD-[A-F0-9]{20}\/artifacts\/(step|stl|svg|top|side|dxf|json|pdf)$/.test(t||""))throw new Error("无效的 CAD 文件地址");return t+(e?"?download=1":"")}function RR(t){return t?/[\/\\:\r\n\x00]/.test(t.name)||t.name.startsWith(".")?"图纸文件名不合法":/\.(step|stp|dxf|pdf|png|jpg|jpeg)$/i.test(t.name)?!t.size||t.size>8*1024*1024?"图纸必须非空且不超过 8 MB":"":"不支持的图纸格式":"请选择对应零件的图纸"}function PR(t){let e=null;if(t.parameters.trim()){try{e=JSON.parse(t.parameters)}catch{throw new Error("结构化参数必须是合法 JSON")}if(!e||typeof e!="object"||Array.isArray(e))throw new Error("结构化参数必须是 JSON 对象")}return{name:t.name.trim()||"自定义零件",prompt:t.prompt.trim(),material:t.material.trim(),technical_requirements:t.technicalRequirements.trim(),spec:e}}async function oa(t,{method:e="GET",body:n,signal:i,key:r}={}){const s=r&&n?{...n,command_id:r}:n;let a;try{a=await fetch(t,{method:e,signal:i,credentials:"same-origin",headers:{"Content-Type":"application/json",...r?{"Idempotency-Key":r}:{}},...s?{body:JSON.stringify(s)}:{}})}catch(l){throw i!=null&&i.aborted?l:new Error("CAD 请求未收到确认，结果暂不确定。保持参数不变再次提交，会复用原命令身份，不会重复建模。")}const o=await a.json().catch(()=>({}));if(!a.ok){const l=o.detail;throw new Error(typeof l=="string"?l:Array.isArray(l)?l.map(c=>{var h;return`${((h=c.loc)==null?void 0:h.slice(1).join("."))||"输入"}：${c.msg}`}).join("；"):`CAD 请求失败（${a.status}）`)}return o}function NR(t){return new Promise((e,n)=>{const i=new FileReader;i.onload=()=>e(String(i.result).split(",",2)[1]),i.onerror=()=>n(new Error("图纸读取失败")),i.readAsDataURL(t)})}function LR({artifact:t}){const e=se.useRef(null),[n,i]=se.useState("正在加载已生成的实体文件…");return se.useEffect(()=>{const r=e.current,s=new AbortController;let a,o,l,c,h,p;i("正在加载已生成的实体文件…");async function f(){try{const g=await fetch(Tc(t.url),{signal:s.signal,credentials:"same-origin"});if(!g.ok)throw new Error("实体文件加载失败");const v=await g.arrayBuffer();if(s.signal.aborted)return;o=new TR().parse(v),o.computeBoundingSphere(),o.center();const S=o.boundingSphere.radius;if(!Number.isFinite(S)||S<=0)throw new Error("实体预览文件无有效尺寸");a=new Gx({antialias:!0,alpha:!0}),a.setPixelRatio(Math.min(window.devicePixelRatio,2)),a.setClearColor(15857654,1),r.appendChild(a.domElement),a.domElement.setAttribute("aria-label","由 CAD 实体 STL 文件加载的三维零件");const _=new Tx;_.add(new Lx(16777215,4875102,2.4));const d=new bh(16777215,3);d.position.set(S*2,S*3,S*4),_.add(d),l=new it({color:2395008,roughness:.4,metalness:.35}),_.add(new Be(o,l));const m=new Gn(38,1,S/100,S*100);m.up.set(0,0,1),m.position.set(S*2.2,-S*3,S*2),c=new Wx(m,a.domElement),c.enableDamping=!0,p=new ResizeObserver(()=>{const y=r.clientWidth,T=r.clientHeight;y&&T&&(a.setSize(y,T),m.aspect=y/T,m.updateProjectionMatrix())}),p.observe(r);const M=()=>{c.update(),a.render(_,m),h=requestAnimationFrame(M)};M(),i("")}catch(g){s.signal.aborted||i(`${g.message}。可查看下方工程视图，或下载 STEP 文件。`)}}return f(),()=>{s.abort(),cancelAnimationFrame(h),p==null||p.disconnect(),c==null||c.dispose(),o==null||o.dispose(),l==null||l.dispose(),a==null||a.dispose(),a==null||a.domElement.remove()}},[t.url]),u.jsxs("div",{className:"cad-solid-preview",children:[u.jsx("div",{className:"cad-solid-canvas",ref:e}),n&&u.jsx("p",{role:"status",children:n})]})}const bc={name:"",prompt:"",material:"",technicalRequirements:"",parameters:"",dxfDepth:"",dxfUnits:""},DR={...bc,name:"带通孔销轴",material:"C45",prompt:"外径30mm、长50mm、中心通孔直径10mm的销轴",parameters:JSON.stringify({units:"mm",operations:[{type:"cylinder",diameter:30,length:50},{type:"cylinder",diameter:10,length:50,mode:"cut"}]},null,2)},IR={cad_input:"接收设计输入",cad_analyze:"CAD Agent 解析需求 / 图纸",cad_kernel:"CAD 内核实体建模与校验",cad_export:"导出工程文件",cad_modeling:"建模执行结果"};function UR(){var z,k,j;const[t,e]=se.useState(bc),[n,i]=se.useState(null),[r,s]=se.useState([]),[a,o]=se.useState(null),[l,c]=se.useState(null),[h,p]=se.useState(""),[f,g]=se.useState(!1),[v,S]=se.useState(""),_=se.useRef(CR()),d=se.useRef(null),[m,M]=se.useState(""),[y,T]=se.useState(!1),[E,C]=se.useState(!1),[x,b]=se.useState(!1),P=L=>$=>e(de=>({...de,[L]:$.target.value})),D=async L=>{const $=await oa("/api/cad/designs",{signal:L});s($.items||[])};se.useEffect(()=>{const L=new AbortController;return Promise.all([D(L.signal),oa("/api/cad/designs/status",{signal:L.signal}).then(c)]).catch($=>{L.signal.aborted||p($.message)}),()=>L.abort()},[]),se.useEffect(()=>{if(!a||!Wd(a.status))return;const L=new AbortController;let $;const de=async()=>{try{const we=await oa(`/api/cad/designs/${a.design_id}`,{signal:L.signal});o(we),Wd(we.status)?$=window.setTimeout(de,1e3):await D(L.signal)}catch(we){L.signal.aborted||p(we.message)}};return $=window.setTimeout(de,800),()=>{L.abort(),window.clearTimeout($)}},[a==null?void 0:a.design_id,a==null?void 0:a.status]);async function O(L){L.preventDefault(),p(""),g(!0);try{const $=PR(t);if(y&&!E)throw new Error("请先核对提取参数，并勾选尺寸及特征确认");if(!$.spec&&!$.prompt&&!n)throw new Error("请输入完整零件需求，或上传对应图纸");let de=v?`/api/cad/designs/${v}/revisions`:"/api/cad/designs";if(v&&($.replace_source_geometry=x,m&&/\.dxf$/i.test(m)&&!x)){if(!t.dxfDepth||!t.dxfUnits)throw new Error("请为继承的 DXF 轮廓填写深度和单位");$.dxf_depth=Number(t.dxfDepth),$.dxf_units=t.dxfUnits}if(n){const Ke=RR(n);if(Ke)throw new Error(Ke);if(v)throw new Error("上传图纸请创建独立任务；修改当前版本请填写完整结构化参数");if($.filename=n.name,$.content_base64=await NR(n),/\.dxf$/i.test(n.name)){if(!t.dxfDepth||!t.dxfUnits)throw new Error("二维 DXF 必须填写拉伸深度并选择图纸单位");$.dxf_depth=Number(t.dxfDepth),$.dxf_units=t.dxfUnits}de+="/import"}const we=await oa(de,{method:"POST",body:$,key:_.current.keyFor(de,$)});o(we),S(""),M(""),T(!1),await D()}catch($){p($.message)}finally{g(!1)}}async function F(L){p(""),g(!0);try{o(await oa(`/api/cad/designs/${L}`))}catch($){p($.message)}finally{g(!1)}}async function U(){p(""),g(!0);try{o(await oa(`/api/cad/designs/${a.design_id}/confirm`,{method:"POST",body:{digest:a.digest}})),await D()}catch(L){p(L.message)}finally{g(!1)}}function W(){var $;const L=a.request;S(a.design_id),i(null),d.current&&(d.current.value=""),M(L.filename||""),T(!!a.suggested_spec),C(!1),b(!1),e({...bc,name:a.name,prompt:L.prompt||"",material:a.material||"",technicalRequirements:a.technical_requirements||"",parameters:a.suggested_spec||a.resolved_spec?JSON.stringify(a.suggested_spec||a.resolved_spec,null,2):"",dxfDepth:L.dxf_depth==null?"":String(L.dxf_depth),dxfUnits:L.dxf_units||""}),($=document.getElementById("cad-design-form"))==null||$.scrollIntoView({behavior:"smooth"})}const N=(z=a==null?void 0:a.artifacts)==null?void 0:z.find(L=>L.format==="stl");return u.jsxs("section",{className:"production-cad",children:[u.jsxs("header",{children:[u.jsx("span",{className:"cad-eyebrow",children:"CAD Agent · 生产准备"}),u.jsx("h1",{children:"生产前零件建模"}),u.jsx("p",{children:"按需求或对应图纸生成真实三维实体，校验后查看、下载并确认设计版本。"})]}),u.jsxs("div",{className:"cad-boundary",children:[u.jsx("strong",{children:"当前范围：设计文件与加工准备。"})," 已接入实体建模；未接入刀路、机床后处理和机器生产下发。设计确认不等于允许机器启动。"]}),h&&u.jsx("div",{className:"cad-alert",role:"alert",children:h}),u.jsxs("section",{className:"cad-card",id:"cad-design-form",children:[u.jsx("h2",{children:v?"修改设计 · 创建新版本":"零件需求与图纸"}),u.jsx("p",{children:l?l.ready?`CAD 内核已就绪：${l.engine||"CadQuery"}`:"CAD 内核未就绪，请安装独立建模依赖后重试":"正在检查 CAD 内核…"}),v&&u.jsxs("p",{children:["父版本：",v,"。提交后新版本需要重新确认。",u.jsx("button",{type:"button",onClick:()=>S(""),children:"取消版本关联"})]}),u.jsxs("form",{onSubmit:O,children:[u.jsxs("label",{children:["零件名称",u.jsx("input",{maxLength:100,value:t.name,onChange:P("name"),placeholder:"例如：带通孔销轴"})]}),u.jsxs("label",{children:["零件需求",u.jsx("textarea",{maxLength:1e4,rows:4,value:t.prompt,onChange:P("prompt"),placeholder:"说明形状、单位、尺寸和所有孔槽。简单圆柱可直接填写：直径30mm、长度50mm的圆柱。复杂需求经过现有模型服务解析。"})]}),u.jsxs("label",{children:["材料",u.jsx("input",{maxLength:100,value:t.material,onChange:P("material"),placeholder:"填写实际选用材料，不自动推测"})]}),u.jsxs("label",{children:["技术要求",u.jsx("textarea",{maxLength:4e3,rows:3,value:t.technicalRequirements,onChange:P("technicalRequirements"),placeholder:"公差、表面粗糙度、热处理等；未填写时不声称加工要求完整"})]}),u.jsxs("label",{children:["上传对应图纸",u.jsx("input",{ref:d,type:"file",accept:".step,.stp,.dxf,.pdf,.png,.jpg,.jpeg",disabled:!!v,onChange:L=>{i(L.target.files[0]||null),p("")}})]}),u.jsx("p",{children:"STEP 导入真实实体；DXF 需要闭合轮廓、拉伸深度与单位；PDF/图片需要明确标注尺寸。每份不超过 8 MB。"}),n&&u.jsxs("p",{children:["已选择：",u.jsx("strong",{children:n.name}),u.jsx("button",{type:"button",onClick:()=>{i(null),d.current.value=""},children:"取消文件"})]}),m&&u.jsxs("p",{children:["新版本继承原图：",u.jsx("strong",{children:m}),"，不会丢弃原图或已有需求。"]}),/\.dxf$/i.test((n==null?void 0:n.name)||m)&&u.jsxs(u.Fragment,{children:[u.jsxs("label",{children:["DXF 拉伸深度",u.jsx("input",{type:"number",min:"0.001",max:"10000",step:"any",value:t.dxfDepth,onChange:P("dxfDepth")})]}),u.jsxs("label",{children:["DXF 单位",u.jsxs("select",{value:t.dxfUnits,onChange:P("dxfUnits"),children:[u.jsx("option",{value:"",children:"请选择"}),u.jsx("option",{value:"mm",children:"毫米"}),u.jsx("option",{value:"cm",children:"厘米"}),u.jsx("option",{value:"inch",children:"英寸"})]})]})]}),u.jsxs("details",{open:!!t.parameters,children:[u.jsx("summary",{children:"结构化参数（精确尺寸 / 复杂特征）"}),u.jsx("p",{children:"支持圆柱、方块、轮廓拉伸、旋转体、布尔加减、圆角和倒角。未知特征或缺少尺寸不会替换成默认模型。"}),u.jsxs("label",{children:["参数 JSON",u.jsx("textarea",{className:"cad-json",rows:10,value:t.parameters,onChange:P("parameters"),placeholder:'{"units":"mm","operations":[{"type":"cylinder","diameter":30,"length":50}]}'})]})]}),y&&u.jsxs("label",{className:"cad-check",children:[u.jsx("input",{type:"checkbox",checked:E,onChange:L=>C(L.target.checked)})," 我已核对并补全全部尺寸、单位和特征，按这些参数生成实体"]}),m&&/\.(step|stp|dxf)$/i.test(m)&&t.parameters&&u.jsxs("label",{className:"cad-check",children:[u.jsx("input",{type:"checkbox",checked:x,onChange:L=>b(L.target.checked)})," 使用完整参数替换原图几何（保留父任务资料，不与原实体叠加）"]}),u.jsxs("div",{className:"cad-actions",children:[u.jsx("button",{type:"submit",className:"cad-primary",disabled:f,children:f?"正在提交…":v?"生成新版本":"提交 CAD 建模"}),u.jsx("button",{type:"button",disabled:f,onClick:()=>{e(DR),i(null),S(""),M(""),T(!1),_.current.reset(),d.current&&(d.current.value="")},children:"填写带孔销轴示例"}),u.jsx("button",{type:"button",disabled:f,onClick:()=>{e(bc),i(null),S(""),M(""),T(!1),_.current.reset(),d.current&&(d.current.value="")},children:"新建任务"})]})]})]}),u.jsxs("section",{className:"cad-card",children:[u.jsxs("div",{className:"cad-card-heading",children:[u.jsx("h2",{children:"建模任务"}),u.jsx("button",{type:"button",onClick:()=>D().catch(L=>p(L.message)),children:"刷新任务"})]}),!r.length&&u.jsx("p",{children:"暂无建模任务。提交需求后，每个任务保留自己的输入、实体文件和执行明细。"}),u.jsx("div",{className:"cad-task-list",children:r.map(L=>u.jsxs("button",{type:"button",disabled:f,className:(a==null?void 0:a.design_id)===L.design_id?"is-selected":"",onClick:()=>F(L.design_id),children:[u.jsx("strong",{children:L.name}),u.jsx("span",{className:`cad-badge ${L.status}`,children:Bg(L.status)}),u.jsxs("small",{children:[L.design_id," · ",new Date(L.created_at).toLocaleString()]})]},L.design_id))})]}),a&&u.jsxs("section",{className:"cad-card cad-task-detail",children:[u.jsxs("div",{className:"cad-card-heading",children:[u.jsx("h2",{children:a.name}),u.jsx("span",{className:`cad-badge ${a.status}`,children:Bg(a.status)})]}),u.jsxs("p",{className:"cad-identifier",children:[a.design_id,a.parent_id&&` · 父版本 ${a.parent_id}`]}),u.jsx("p",{role:"status",children:a.message}),!!((k=a.missing_information)!=null&&k.length)&&u.jsxs("div",{className:"cad-alert",children:[u.jsx("strong",{children:"需要补充以下信息"}),u.jsx("ul",{children:a.missing_information.map((L,$)=>u.jsx("li",{children:L},$))})]}),a.suggested_spec&&u.jsxs("div",{className:"cad-alert",children:[u.jsx("strong",{children:"模型提取参数 · 尚未核实"}),u.jsx("p",{children:"以下只是待核对参数，尚未建立实体或开放下载。点击“补充需求”后核对全部尺寸，不完整的参数需要补齐。"}),u.jsx("pre",{children:JSON.stringify(a.suggested_spec,null,2)})]}),N&&u.jsxs(u.Fragment,{children:[u.jsx("h3",{children:"真实实体预览"}),u.jsx("p",{children:"拖动旋转、滚轮缩放。预览读取此任务生成的 STL；不是前端虚构模型。"}),u.jsx(LR,{artifact:N}),u.jsx("h3",{children:"实体校验"}),u.jsxs("dl",{className:"cad-properties",children:[u.jsxs("div",{children:[u.jsx("dt",{children:"单位"}),u.jsx("dd",{children:"mm"})]}),u.jsxs("div",{children:[u.jsx("dt",{children:"连续实体"}),u.jsxs("dd",{children:[a.geometry.solid_count," 个"]})]}),u.jsxs("div",{children:[u.jsx("dt",{children:"包络尺寸 X / Y / Z"}),u.jsxs("dd",{children:[a.geometry.bounds_mm.map(L=>Number(L.toFixed(4))).join(" / ")," mm"]})]}),u.jsxs("div",{children:[u.jsx("dt",{children:"实体体积"}),u.jsxs("dd",{children:[a.geometry.volume_mm3.toFixed(3)," mm³"]})]}),u.jsxs("div",{children:[u.jsx("dt",{children:"STEP 回读"}),u.jsx("dd",{children:a.geometry.step_roundtrip_valid?"通过":"未通过"})]})]}),u.jsx("h3",{children:"工程视图"}),u.jsx("div",{className:"cad-projections",children:a.artifacts.filter(L=>["svg","top","side"].includes(L.format)).map(L=>u.jsxs("figure",{children:[u.jsx("figcaption",{children:L.label}),u.jsx("img",{src:Tc(L.url),alt:L.label})]},L.artifact_id))}),u.jsx("h3",{children:"工程文件"}),u.jsx("p",{children:"PDF 为中文三视图及参数表；DXF 为实体中截面，不是已经完成尺寸标注的机床加工图。"}),u.jsx("div",{className:"cad-downloads",children:a.artifacts.map(L=>u.jsxs("div",{children:[u.jsx("strong",{children:L.label}),u.jsxs("small",{children:[(L.size/1024).toFixed(1)," KB"]}),["pdf","svg","top","side","json"].includes(L.format)&&u.jsx("a",{href:Tc(L.url),target:"_blank",rel:"noreferrer",children:"打开"}),u.jsx("a",{href:Tc(L.url,!0),download:L.filename,children:"下载"})]},L.artifact_id))}),!!((j=a.manufacturing_missing)!=null&&j.length)&&u.jsxs("div",{className:"cad-boundary",children:["加工准备尚缺：",a.manufacturing_missing.join("、"),"。当前仅完成几何建模，未进入机器生产。"]}),u.jsxs("div",{className:"cad-actions",children:[u.jsx("button",{className:"cad-primary",type:"button",disabled:f||!AR(a),onClick:U,children:a.status==="confirmed"?"此版本已确认":"确认当前设计版本"}),u.jsx("button",{type:"button",disabled:f,onClick:W,children:"修改参数并建立新版本"})]})]}),!N&&!Wd(a.status)&&u.jsx("button",{type:"button",disabled:f,onClick:W,children:"补充需求并建立新版本"}),u.jsx("h3",{children:"此任务的 CAD Agent 执行明细"}),u.jsx("p",{children:"每一步展示实际工具输入和返回；文件内容仅记录摘要，避免把整份图纸重复写入日志。"}),u.jsx("ol",{className:"cad-events",children:a.events.map((L,$)=>u.jsx("li",{children:u.jsxs("details",{children:[u.jsxs("summary",{children:[$+1,". ",IR[L.tool]||L.tool," · ",L.status==="failed"?"失败":"完成"]}),u.jsxs("p",{children:["Agent：",L.agent," · 工具：",L.tool," · ",new Date(L.timestamp).toLocaleString()]}),u.jsx("h4",{children:"输入 / 上下文"}),u.jsx("pre",{children:JSON.stringify(L.input,null,2)}),u.jsx("h4",{children:"返回体"}),u.jsx("pre",{children:JSON.stringify(L.output,null,2)}),L.error&&u.jsx("p",{role:"alert",children:L.error})]})},$))})]})]})}function FR(t,e,n,i){return{username:t.trim(),password:e,role:n,primary_device_id:n==="technician"?i:""}}async function Ji(t,e){const n=await fetch(`/api/team/${t}`,{credentials:"same-origin",method:e===void 0?"GET":"POST",headers:{"Content-Type":"application/json"},...e===void 0?{}:{body:JSON.stringify(e)}}),i=await n.json();if(!n.ok)throw new Error(typeof i.detail=="string"?i.detail:i.error||"账号服务请求失败");return i}function OR({actor:t,onActor:e,line:n,onLine:i}){const[r,s]=se.useState("login"),[a,o]=se.useState(""),[l,c]=se.useState(""),[h,p]=se.useState("technician"),[f,g]=se.useState(""),[v,S]=se.useState([]),[_,d]=se.useState(""),[m,M]=se.useState(!1);se.useEffect(()=>{let E=!0;Ji("me").then(b=>E&&e(b.user)).catch(()=>{}),Ji("devices").then(b=>E&&S(b.items||[])).catch(b=>E&&d(b.message));const C=()=>Ji("line").then(b=>E&&i(b)).catch(()=>E&&i({state:"unavailable"}));C();const x=setInterval(C,2e3);return()=>{E=!1,clearInterval(x)}},[]);async function y(E){E.preventDefault(),M(!0),d("");try{r==="register"&&await Ji("register",FR(a,l,h,f));const C=await Ji("login",{username:a,password:l});e(C.user),c("")}catch(C){d(C.message)}finally{M(!1)}}const T={unknown:"尚无控制记录",stopped:"整线已暂停",stopping:"正在暂停整线",starting:"复机验证中",running:"整线运行已复核",failed:"复机失败，已回停",rollback_failed:"复机失败，部分回停未确认",stop_failed:"部分设备停机未确认",unreconciled:"停机待对账，禁止复机",unavailable:"控制账本不可用"};return u.jsxs("details",{className:"team-access",children:[u.jsxs("summary",{children:["维修小组 · ",t?`${t.username}（${t.role==="supervisor"?"监督人":"维修人员"}）`:"注册 / 登录"," · ",T[n==null?void 0:n.state]||"未启用控制"]}),u.jsxs("div",{className:"team-access-body",children:[t?u.jsxs(u.Fragment,{children:[u.jsxs("p",{children:["主要负责设备：",t.primary_device_id||"监督全部派工与接单"]}),u.jsx("button",{type:"button",className:"button",onClick:async()=>{try{await Ji("logout",{}),e(null)}catch(E){d(E.message)}},children:"退出登录"})]}):u.jsxs("form",{onSubmit:y,children:[u.jsxs("label",{children:["用户名",u.jsx("input",{autoComplete:"username",required:!0,maxLength:64,value:a,onChange:E=>o(E.target.value)})]}),u.jsxs("label",{children:["密码",u.jsx("input",{type:"password",autoComplete:r==="login"?"current-password":"new-password",minLength:8,maxLength:256,required:!0,value:l,onChange:E=>c(E.target.value)})]}),r==="register"&&u.jsxs(u.Fragment,{children:[u.jsxs("label",{children:["身份",u.jsxs("select",{value:h,onChange:E=>p(E.target.value),children:[u.jsx("option",{value:"technician",children:"维修人员（共4名）"}),u.jsx("option",{value:"supervisor",children:"监督人（共1名，仅查看和催办）"})]})]}),h==="technician"&&u.jsxs("label",{children:["主要负责机器",u.jsxs("select",{required:!0,value:f,onChange:E=>g(E.target.value),children:[u.jsx("option",{value:"",children:"请选择当前工厂设备"}),v.map(E=>u.jsx("option",{value:E.device_id||E.id,children:E.name||E.display_name||E.device_id||E.id},E.device_id||E.id))]})]})]}),u.jsx("button",{className:"button primary",disabled:m,children:m?"提交中":r==="register"?"注册并登录":"登录"}),u.jsx("button",{className:"button",type:"button",onClick:()=>s(r==="login"?"register":"login"),children:r==="login"?"注册新账号":"已有账号"})]}),u.jsx("p",{children:"故障确认后暂停整线；所有故障工单完成且设备数据复核通过后，才会启动整线。监督人不控制设备。"}),(n==null?void 0:n.devices)&&u.jsx("ul",{children:Object.entries(n.devices).map(([E,C])=>u.jsxs("li",{children:[E,"：",C.state==="verified"?"已读回确认":"尚未确认","（",C.action==="start"?"启动":"停止","）"]},E))}),(n==null?void 0:n.reason)&&u.jsxs("p",{role:"status",children:["原因：",n.reason]}),(n==null?void 0:n.rollback)&&u.jsx("ul",{children:Object.entries(n.rollback).map(([E,C])=>u.jsxs("li",{children:["回停 ",E,"：",C.state==="verified"?"已读回确认停止":"停止未确认，请检查设备"]},E))}),_&&u.jsx("p",{className:"inline-error",role:"alert",children:_})]})]})}function kR({actor:t}){const[e,n]=se.useState([]),[i,r]=se.useState([]),[s,a]=se.useState(""),[o,l]=se.useState("");se.useEffect(()=>{let h=!0;const p=()=>Promise.all([Ji("workorders"),Ji("reminders")]).then(([g,v])=>{h&&(n(g.items),r(v.items),a(""))}).catch(g=>h&&a(g.message));p();const f=setInterval(p,5e3);return()=>{h=!1,clearInterval(f)}},[t.user_id]);async function c(h){l(h.workorder_id);try{await Ji("reminders",{workorder_id:h.workorder_id,text:"请及时确认接单、执行维修并反馈进展"}),a("催办已发送")}catch(p){a(p.message)}finally{l("")}}return u.jsxs("section",{className:"workorder-queue",children:[u.jsx("h2",{children:t.role==="supervisor"?"监督与催办":"我的催办消息"}),t.role==="supervisor"&&u.jsx("ul",{children:e.map(h=>u.jsxs("li",{children:[u.jsx("strong",{children:h.title}),u.jsxs("p",{children:[h.workorder_id," · ",h.device_id," · ",h.assignee_name||"待派工"," · ",h.status," · ",h.accepted_by?"已接单":"尚未确认接单"]}),u.jsx("button",{className:"button",disabled:o===h.workorder_id||!h.assignee||["completed","closed"].includes(h.status),onClick:()=>c(h),children:"站内催办"})]},h.workorder_id))}),i.length?u.jsx("ul",{children:i.map(h=>u.jsxs("li",{children:[h.workorder_id,"：",h.text," · ",h.read?"已读":"未读",t.role==="technician"&&!h.read&&u.jsx("button",{className:"button",onClick:async()=>{try{await Ji(`reminders/${h.reminder_id}/read`,{}),r(p=>p.map(f=>f.reminder_id===h.reminder_id?{...f,read:!0}:f))}catch(p){a(p.message)}},children:"我已收到"})]},h.reminder_id))}):u.jsx("p",{children:"暂无催办记录"}),s&&u.jsx("p",{role:"status",children:s})]})}const Qp=[{id:"TRAK-TC820LTYSI-001",name:"TRAK-TC820LTYSI-001",line:"A线 · 主加工单元",type:"数控车削中心",x:50,y:39,live:!0,image:Xx}],BR={"TRAK-TC820LTYSI-001":{name:"TRAK TC820LTYsi 车削中心",line:"A线 · 主加工单元",type:"数控车削中心",x:42,y:58,image:Xx},"LNS-QL-SERVO-80-S2-001":{name:"LNS QL Servo 80 S2 棒料送料机",line:"A线 · 上料单元",type:"棒料送料机",x:23,y:46},"ELITE-CS612-ROBOT-001":{name:"ELITE ROBOTS CS612 六轴协作机器人",line:"A线 · 下料协作单元",type:"六轴协作机器人",x:68,y:42}},zR={turning_center:"数控车削中心",bar_feeder:"棒料送料机",industrial_robot:"工业机器人",equator_gauge:"尺寸检测设备"},Da={turning_center:{area:"A01 主加工单元",flow:"棒料 → 车削 → 机械臂取件",focus:"主轴、液压、冷却与刀塔",metrics:[["spindle_rpm","主轴转速","主轴","rpm"],["spindle_load_percent","主轴负载","主轴","%"],["spindle_temperature_c","主轴温度","主轴","°C"],["spindle_vibration_mm_s","主轴振动","主轴","mm/s"],["hydraulic_pressure_psi","液压压力","液压","psi"],["coolant_pressure_psi","冷却压力","冷却","psi"],["lubrication_pressure_psi","润滑压力","润滑","psi"],["turret_servo_load_percent","刀塔负载","刀塔","%"]]},bar_feeder:{area:"A02 棒料上料单元",flow:"棒料检测 → 推料 → 车床联动",focus:"棒料、伺服、推料与安全门",metrics:[["bar_diameter_mm","棒料直径","棒料","mm"],["bar_length_mm","剩余长度","棒料","mm"],["pusher_position_mm","推料位置","送料","mm"],["feed_speed_m_min","送料速度","送料","m/min"],["pushing_torque_nm","推送扭矩","伺服","N·m"],["loading_cycle_seconds","上料周期","节拍","s"],["servo_battery_voltage_v","伺服电池","电气","V"],["dc_24v_supply_v","24V电源","电气","V"]]},industrial_robot:{area:"A03 下料协作单元",flow:"取件 → 送检 → 合格／待处理分流",focus:"关节、末端力、控制器与安全 IO",metrics:[["joint_comm_quality_percent","关节通讯","通讯","%"],["tool_speed_mm_s","TCP速度","运动","mm/s"],["tcp_force_n","TCP力","末端","N"],["joint_temperature_c","关节温度","关节","°C"],["robot_power_w","机器人功率","电气","W"],["robot_48v_power_v","48V母线","电气","V"],["controller_performance_pct","控制器负载","控制器","%"],["memory_free_mb","剩余内存","控制器","MB"]]},equator_gauge:{area:"A04 尺寸检测工位",flow:"机械臂送检 → 尺寸检测 → 分流",focus:"测头、控制器、环境与检测过程",metrics:[]}},zg=[{x:42,y:58},{x:23,y:46},{x:68,y:42},{x:78,y:62}],HR=[{id:"TRAK-TC820LTYSI-001",device_type:"turning_center",name:"TRAK TC820LTYsi 车削中心"},{id:"LNS-QL-SERVO-80-S2-001",device_type:"bar_feeder",name:"LNS QL Servo 80 S2 棒料送料机"},{id:"ELITE-CS612-ROBOT-001",device_type:"industrial_robot",name:"ELITE ROBOTS CS612 六轴协作机器人"},{id:"RENISHAW-EQUATOR300-001",device_type:"equator_gauge",name:"Renishaw Equator 300 比对仪"}],VR={critical:"关键规则",threshold:"阈值规则",duration:"持续规则",count:"计数规则",trend:"趋势规则",multi_metric:"多指标规则"},GR={normal:"正常",warning:"预警",alarm:"报警",fault:"故障",running:"运行中",stopped:"已停止",offline:"离线",unknown:"状态未知"},jR={normal:"正常",initial:"初级预警",intermediate:"中级报警",high:"高级故障"},Hg={metric:"指标异常",temperature:"温度异常",vibration:"振动异常",alarm:"设备报警",status:"设备状态",trend:"趋势异常",multi_metric:"多指标联合异常"},Pu={open:"待处理",in_progress:"处理中",completed:"已完成",closed:"已关闭"},Vg={700001:{component:"LUBRICATION-PUMP",part_no:"TN420050-B",cad_part_numbers:["TN420050-B","TN420390-A","TN420470","TR260061","TR443560"],part_name:"润滑泵",system:"自动润滑系统",location:"机床后侧润滑单元",description:"向主轴轴承、导轨和丝杠提供定量润滑。压力未达到时，应优先检查泵体、油路、过滤器和压力开关。",relation:"上接润滑油箱，下接分配器和主轴/导轨润滑回路",symptom:"润滑压力未达到设定值",check:"检查油位、泵出口压力、过滤器和压力开关",marker:{left:"20%",top:"68%"}},700002:{component:"MCP-PENDANT",part_no:"34431-1",cad_part_numbers:["34410-1_FIXED","34431-1","34431-2","34431-3","34431-4","34431-5","34432-1","34432-2","34432-3","34432-4","34432-5"],part_name:"机床控制面板",system:"机床操作系统",location:"机床前侧悬臂操作箱区域",description:"用于操作机床运行、进给和手轮控制。Feed hold 报警时，应检查控制面板、进给启动按钮和手轮输入。",relation:"连接 CNC 控制器、进给启动按钮、手轮和操作面板输入",symptom:"机床处于 Feed hold，轴运动被暂停",check:"检查进给启动按钮、悬臂面板、手轮和控制信号反馈",marker:{left:"68%",top:"28%"}},700010:{component:"HYDRAULIC-UNIT",part_no:"HY-TC820-002",part_name:"液压站",system:"液压系统",location:"机床后侧液压单元",description:"为卡盘、尾座和夹紧机构提供液压动力。压力不足会导致夹紧、松开或尾座动作异常。",relation:"连接液压泵、溢流阀、压力传感器和卡盘/尾座执行机构",symptom:"液压压力未达到设定值",check:"检查液压油位、泵站压力、溢流阀和泄漏点",marker:{left:"25%",top:"64%"}},700032:{component:"COOLING-PUMP",part_no:"CP-TC820-015",part_name:"冷却泵",system:"冷却系统",location:"机床后侧冷却单元",description:"将冷却液输送至刀具和主轴加工区域，用于带走切削热并维持加工温度。过载通常与泵体堵塞、叶轮卡滞、过滤器堵塞或电机异常有关。",relation:"连接冷却箱、过滤器、冷却管路和主轴冷却回路",symptom:"冷却泵电机过载，冷却流量可能下降",check:"检查泵体、入口过滤器、出口压力、电机电流和叶轮阻塞",marker:{left:"24%",top:"72%"}},700029:{component:"LUBRICATION-PUMP",part_no:"TN420050-B",cad_part_numbers:["TN420050-B","TN420390-A","TN420470","TR260061","TR443560"],part_name:"润滑泵",system:"自动润滑系统",location:"机床后侧润滑单元",description:"监测润滑油箱液位并向主轴、导轨和丝杠供油。液位低时应先确认油箱、泵体和液位开关。",relation:"连接润滑油箱、润滑泵、液位开关和分配器",symptom:"润滑油液位低",check:"检查油箱液位、加油口、液位开关和是否存在泄漏",marker:{left:"20%",top:"68%"}},700223:{component:"TEMP-PT100",part_no:"TS-PT100-008",part_name:"主轴温度传感器",system:"主轴温度监测",location:"主轴电机壳体测温孔",description:"采集主轴电机壳体温度并反馈给控制系统，用于过温保护和趋势监测。",relation:"安装于主轴电机壳体，信号接入 PLC 模拟量模块",symptom:"主轴温度超过报警阈值",check:"检查传感器安装、线缆、接插件和实际温度读数",marker:{left:"58%",top:"31%"}},700006:{component:"TURRET-ASSY",part_no:"TR-TC820-006",part_name:"刀塔组件",system:"刀塔系统",location:"主轴箱前侧刀塔区域",description:"完成刀具选择、旋转定位和夹紧。动作超时可能由伺服、夹紧开关、机械卡滞或润滑不足引起。",relation:"连接刀塔伺服、电磁阀、夹紧/松开检测开关和刀具座",symptom:"刀塔未在规定时间内完成旋转",check:"检查刀塔参考位置、伺服负载、夹紧开关和机械干涉",marker:{left:"61%",top:"52%"}},700509:{component:"TAILSTOCK-ASSY",part_no:"TS-TC820-009",part_name:"尾座夹紧机构",system:"尾座系统",location:"机床右侧尾座区域",description:"用于工件端部支撑和夹紧，夹紧压力不足时会影响加工稳定性和人身安全。",relation:"连接尾座液压缸、压力开关和夹紧执行机构",symptom:"尾座夹紧压力未达到设定值",check:"检查尾座压力、液压缸、夹紧开关和工件支撑状态",marker:{left:"78%",top:"52%"}},700240:{component:"TOOL-PROBE",part_no:"TP-TC820-010",part_name:"刀具测头",system:"刀具检测系统",location:"刀塔/加工区测量位置",description:"用于确认刀具位置和刀具状态，未到位时禁止进入相关加工流程。",relation:"连接测头本体、到位开关和控制系统输入",symptom:"刀具测头未处于规定位置",check:"检查测头机构、到位开关、线缆和机械干涉",marker:{left:"55%",top:"58%"}},700009:{component:"PART-CATCHER",part_no:"PC-TC820-011",part_name:"接料器",system:"下料系统",location:"主轴下方接料区域",description:"接收加工完成的零件并完成上下动作，位置异常时可能造成碰撞或下料失败。",relation:"连接升降执行机构、位置检测开关和下料托盘",symptom:"接料器上下动作异常",check:"检查位置开关、执行机构、导轨和是否存在工件干涉",marker:{left:"53%",top:"78%"}},700015:{component:"BARFEEDER",part_no:"BF-QL80S2-001",part_name:"棒料送料机",system:"上料系统",location:"机床左侧上料单元",description:"将棒料按设定长度稳定送入主轴，报警时应检查送料准备信号、伺服和推料机构。",relation:"连接棒料通道、推料伺服、送料控制器和车床接口",symptom:"送料机未就绪或送料报警",check:"检查棒料通道、推料位置、伺服状态和车床联锁信号",marker:{left:"12%",top:"48%"}}};function WR(t,e){var l,c,h;const n=((l=t==null?void 0:t.diagnosis_context)==null?void 0:l.current_sample)||((c=t==null?void 0:t.diagnosis_context)==null?void 0:c.sample)||{},i=[t==null?void 0:t.alarm_code,(h=t==null?void 0:t.diagnosis_context)==null?void 0:h.alarm_code,n==null?void 0:n.alarm_code,...Array.isArray(e==null?void 0:e.alarm_codes)?e.alarm_codes:[],e==null?void 0:e.alarm_code].map(p=>String(p||"").trim()).filter(Boolean),r=i.find(p=>Vg[p])||i[0]||"",s=Vg[r],a=t==null?void 0:t.repair_target;return!a||typeof a!="object"||["待确认故障部件","UNMAPPED-COMPONENT","待补充"].includes(String(a.part_name||a.component||a.part_no||""))?s?{...s,alarm_code:r}:{alarm_code:r,component:"UNMAPPED-COMPONENT",part_no:"待补充",part_name:"待确认故障部件",system:"待确认",location:"CAD 组件树中人工确认",description:"当前报警已经进入工单，但还没有与具体 CAD 部件建立映射。维修人员需要先在组件树中确认目标。",relation:"暂无装配关系数据",symptom:(t==null?void 0:t.title)||"设备异常",check:"查看报警定义、现场状态和 CAD 组件树",marker:{left:"50%",top:"50%"}}:{...a,alarm_code:a.alarm_code||r}}const XR=["主轴温度过高怎么检查？","报警 ALM-1001 的处理步骤是什么？","振动异常时应该优先排查哪些部件？"],$R={closed:"已关闭",open:"已打开",locked:"已锁定",unlocked:"未锁定",released:"已释放",pressed:"已按下",running:"运行中",stopped:"已停止",ready:"已就绪",clamped:"已夹紧",referenced:"已回零",inhibited:"已禁止",overtemperature:"温度过高",pressure_low:"压力不足",rotation_timeout:"旋转超时",clamp_pressure_low:"夹紧压力不足",not_in_position:"未到位",movement_error:"动作异常",alarm:"报警",overload:"过载",high_pressure_low:"高压不足",vibration_high:"振动过高",fault_injection:"故障注入状态",processing:"加工中",fault:"故障停机",emergency_stop:"急停状态",paused:"已暂停"},qR={idle:"待机",ready:"准备就绪",running:"运行中",processing:"加工中",paused:"已暂停",stopped:"已停止",completed:"加工完成",fault:"故障停机",fault_injection:"故障注入状态",emergency_stop:"急停状态",offline:"离线"};function YR(t){return(t==null?void 0:t.cycle_state_label)||Dr(qR,t==null?void 0:t.cycle_state)||"未知状态"}function KR(t){if(!t)return"无";const e=t.alarm_code||"",n=t.alarm_label||t.alarm_description||"";return e&&n?`${e} · ${n}`:n||e||"无"}async function sn(t,e={}){const n=await fetch(t,{cache:"no-store",headers:{"Content-Type":"application/json"},...e}),i=await n.json();if(!n.ok)throw new Error(i.error||`请求失败：${n.status}`);return i}function Dh(t){return t!=null&&t.workorder&&typeof t.workorder=="object"?{...t.workorder,dispatch_context:t.dispatch_context,candidates:t.candidates,machine_control:t.machine_control}:t}function ti(t){if(!t)return"--";const e=new Date(t);return Number.isNaN(e.getTime())?t:e.toLocaleTimeString("zh-CN",{hour12:!1})}function Dr(t,e){return t[e]||e||"--"}function Gg(t){return t==="fault"?"fault":t==="alarm"?"alarm":t==="warning"?"warning":"normal"}function ly(t){return t==="high"?"fault":t==="intermediate"?"alarm":t==="initial"?"warning":"normal"}function ZR(t){var a;const e=(a=t==null?void 0:t.devices)!=null&&a.length?t.devices:Qp,n=new Set(e.map(o=>String(o.device_id||o.id||""))),i=HR.filter(o=>!n.has(o.id)).map(o=>({...o,live:!1,data_unavailable:!0})),s=[...e,...i].map((o,l)=>{var v,S,_,d;const c=o.device_id||o.id,h=BR[c]||{},p=zg[l%zg.length],f=o.latest_result||((v=t==null?void 0:t.latest_results)==null?void 0:v[c])||(c===(t==null?void 0:t.device_id)?t==null?void 0:t.latest_result:null),g=(f==null?void 0:f.current_sample)||o.current_sample||null;return{id:c,name:o.name||h.name||c,line:h.line||o.line||"产线设备",deviceType:o.device_type||o.type||h.deviceType||"industrial_device",type:h.type||zR[o.device_type||o.type]||o.device_type||o.type||"工业设备",area:((S=Da[o.device_type||o.type])==null?void 0:S.area)||h.line||o.line||"产线设备",flow:((_=Da[o.device_type||o.type])==null?void 0:_.flow)||"实时采集 → 规则判定 → Agent诊断",focus:((d=Da[o.device_type||o.type])==null?void 0:d.focus)||"关键指标与告警状态",x:h.x??o.x??p.x,y:h.y??o.y??p.y,live:o.live!==!1&&!o.data_unavailable,image:h.image||o.image,result:f,sample:g}});return s.some(o=>o.id==="RENISHAW-EQUATOR300-001")||s.push({id:"RENISHAW-EQUATOR300-001",name:"Renishaw Equator 300",line:"A线 · 尺寸检测工位",area:"A04 尺寸检测工位",type:"尺寸检测设备",deviceType:"inspection",flow:"机械臂送检 → 检测 → 合格／待处理分流",focus:"仅展示三维模型，未接入测量数据",live:!1,result:null,sample:null,visualOnly:!0}),s}function cy(t){return t.kind==="multi_metric"?Hg.multi_metric:t.label||Hg[t.kind]||t.kind||"监测项"}function QR(){const[t,e]=se.useState(null),[n,i]=se.useState("");async function r(){try{e(await sn("/api/monitor/snapshot")),i("")}catch(o){i(o.message)}}se.useEffect(()=>{r();const o=window.setInterval(r,1e3);return()=>window.clearInterval(o)},[]);async function s(o){try{e(await sn("/api/monitor/control",{method:"POST",body:JSON.stringify({action:o})})),i("")}catch(l){i(l.message)}}async function a(){try{e(await sn("/api/monitor/reset",{method:"POST",body:"{}"})),i("")}catch(o){i(o.message)}}return{snapshot:t,error:n,control:s,resetStats:a}}function JR(t){const[e,n]=se.useState({});return se.useEffect(()=>{if(!t.length)return;const i=Date.now();n(r=>{const s={...r};return t.forEach(a=>{const o=a.sample;if(!o)return;const l=o.metrics||{},c=Da[a.deviceType],p=((c==null?void 0:c.metrics)||[]).slice(0,3).map(([f])=>f).map(f=>({key:f,value:l[f]})).filter(f=>f.value!==null&&f.value!==void 0);p.length&&(s[a.id]=[...s[a.id]||[],{timestamp:i,points:p}].slice(-30))}),s})},[t]),e}function e2(){const[t,e]=se.useState(null),[n,i]=se.useState({state:"unknown"}),[r,s]=se.useState(()=>{if(typeof window>"u")return"monitor";const b=new URLSearchParams(window.location.search).get("view");return["cad","monitor","diagnosis","maintenance","workorder","quality","rag","logs","report"].includes(b)?b:"monitor"}),[a,o]=se.useState(()=>{if(typeof window>"u")return[];const b=kg(window);return _R(b.primary,b.fallback)}),[l,c]=se.useState(""),[h,p]=se.useState(Qp[0].id),[f,g]=se.useState(!1),{snapshot:v,error:S,control:_,resetStats:d}=QR(),m=(v==null?void 0:v.runner)||{},M=se.useMemo(()=>ZR(v),[v]),y=JR(M),T=M.find(b=>b.id===h)||M[0],E=(T==null?void 0:T.result)||null,C=(E==null?void 0:E.current_sample)||(T==null?void 0:T.sample)||null;se.useEffect(()=>{if(typeof window<"u"){const b=kg(window);vR(b.primary,a,b.fallback)}},[a]),se.useEffect(()=>{if(typeof window>"u")return;const b=()=>{const P=new URLSearchParams(window.location.search).get("view");["cad","monitor","diagnosis","maintenance","workorder","quality","rag","logs","report"].includes(P||"")?s(P):P||s("monitor")};return window.addEventListener("popstate",b),()=>window.removeEventListener("popstate",b)},[]),se.useEffect(()=>{if(typeof window>"u")return;const b=new URLSearchParams(window.location.search);r==="monitor"?b.delete("view"):b.set("view",r);const P=b.toString(),D=`${window.location.pathname}${P?`?${P}`:""}${window.location.hash}`;D!==`${window.location.pathname}${window.location.search}${window.location.hash}`&&window.history.replaceState({view:r},"",D)},[r]);function x(b){c(b),window.setTimeout(()=>c(""),2400)}return se.useEffect(()=>{M.length&&!M.some(b=>b.id===h)&&p(M[0].id)},[M,h]),u.jsxs("div",{className:`platform-shell ${f?"big-screen":"workbench"}`,children:[!f&&u.jsx(wR,{activeView:r,onChange:s,hasError:!!(S||m.last_error),connected:!!v}),u.jsxs("main",{className:`app-shell ${!f&&r==="monitor"?"monitor-canvas-shell":f?"":"content-shell"}`,children:[!f&&u.jsx(OR,{actor:t,onActor:e,line:n,onLine:i}),f?u.jsx(t2,{snapshot:v,runner:m,onControl:_,onReset:d,bigScreen:f,onToggleBigScreen:()=>g(b=>!b)}):null,(r==="monitor"||f)&&u.jsx(n2,{machines:M,result:E,sample:C,dataSource:v==null?void 0:v.data_source,metricHistory:y,selectedMachineId:h,onSelectMachine:p}),!f&&r==="cad"&&u.jsx(UR,{}),!f&&r==="diagnosis"&&u.jsx(m2,{snapshot:v,sample:C}),!f&&r==="maintenance"&&u.jsx(v2,{snapshot:v,sample:C}),!f&&r==="workorder"&&(t?u.jsxs(u.Fragment,{children:[u.jsx(kR,{actor:t}),u.jsx(x2,{actor:t,snapshot:v,sample:C,onClosed:()=>{x("工单已关闭"),s("monitor")}},t.user_id)]}):u.jsxs("section",{className:"workorder-queue",children:[u.jsx("h2",{children:"请先登录维修小组账号"}),u.jsx("p",{children:"展开上方“注册 / 登录”。维修人员查看本人工单，监督人查看全部并催办。"})]})),!f&&r==="rag"&&u.jsx(T2,{snapshot:v,sample:C,messages:a,setMessages:o}),!f&&r==="logs"&&u.jsx(g2,{snapshot:v}),!f&&r==="quality"&&u.jsx(b2,{snapshot:v,sample:C}),!f&&r==="report"&&u.jsx(_2,{snapshot:v}),l&&u.jsx("div",{className:"toast-message",role:"status",children:l}),(S||m.last_error)&&u.jsx("footer",{className:"error-bar",children:S||m.last_error})]})]})}function t2({snapshot:t,runner:e,onControl:n,onReset:i,bigScreen:r,onToggleBigScreen:s}){var l,c;const a=((l=t==null?void 0:t.device_ids)==null?void 0:l.length)||((c=t==null?void 0:t.devices)==null?void 0:c.length)||(t!=null&&t.device_id?1:0),o=`数据源：${(t==null?void 0:t.data_source)||"设备数据源"} · 接入 ${a||"--"} 台设备 · 在线监测`;return u.jsxs("header",{className:"topbar",children:[u.jsxs("div",{children:[u.jsx("span",{className:"eyebrow",children:"工业运营中台"}),u.jsx("h1",{children:"智能制造统一工作台"}),u.jsx("p",{className:"subline",children:o})]}),u.jsxs("div",{className:"toolbar",children:[u.jsxs("label",{className:"switch-control",title:"开启或暂停自动监测",children:[u.jsx("input",{type:"checkbox",checked:!!e.enabled,onChange:h=>n(h.target.checked?"on":"off")}),u.jsx("span",{className:"switch-track",children:u.jsx("span",{className:"switch-thumb"})}),u.jsx("span",{children:e.enabled?"监测开启":"监测暂停"})]}),u.jsx("button",{className:"button",type:"button",onClick:i,children:"归零统计"}),u.jsx("button",{className:"button primary",type:"button",onClick:s,children:r?"退出大屏":"进入大屏"})]})]})}function n2({machines:t,result:e,sample:n,dataSource:i,metricHistory:r,selectedMachineId:s,onSelectMachine:a}){const o=t.find(p=>p.id===s)||t[0]||Qp[0],[l,c]=se.useState(!1),h=p=>{a(p),c(!0)};return u.jsxs("section",{className:"workspace-view active monitor-map-only","aria-label":"车间流水线",children:[u.jsx(i2,{machines:t,selectedMachineId:o.id,result:e,onSelectMachine:h}),l&&u.jsx(l2,{machine:o,result:e,sample:n,dataSource:i,history:r[o.id]||[],onClose:()=>c(!1)})]})}function i2({machines:t,selectedMachineId:e,result:n,onSelectMachine:i}){const[r,s]=se.useState("iso"),a=t.find(l=>l.id===e)||t[0],o=Qr(a,(a==null?void 0:a.result)||n);return u.jsxs("section",{className:"panel workshop-panel",children:[u.jsxs("div",{className:"factory-map","aria-label":"车间设备分布图",children:[u.jsx(s2,{machines:t,selectedMachineId:e,status:o,viewMode:r,onSelect:l=>i(l||(a==null?void 0:a.id))}),u.jsxs("div",{className:"scene-overlay",children:[u.jsxs("div",{children:[u.jsx("span",{className:"eyebrow",children:"车间总览"}),u.jsx("h2",{children:"流水线三维视图"}),u.jsx("p",{className:"scene-click-hint",children:"点击设备模型查看运行数据"})]}),u.jsxs("div",{className:"map-legend","aria-label":"状态图例",children:[u.jsxs("span",{children:[u.jsx("i",{className:"legend-dot normal"}),"正常"]}),u.jsxs("span",{children:[u.jsx("i",{className:"legend-dot warning"}),"预警"]}),u.jsxs("span",{children:[u.jsx("i",{className:"legend-dot fault"}),"故障"]})]}),u.jsx("div",{className:"scene-view-toggle","aria-label":"视角切换",children:[["iso","等轴"],["top","俯视"],["line","产线"]].map(([l,c])=>u.jsx("button",{type:"button",className:r===l?"active":"",onClick:()=>s(l),children:c},l))})]})]}),u.jsx(r2,{machines:t,onSelectMachine:i})]})}function r2({machines:t=[],onSelectMachine:e}){const n=t.filter(r=>r.live),i=n.filter(r=>["fault","alarm","warning"].includes(Qr(r,r.result)));return u.jsxs("section",{className:"device-alert-board","aria-label":"设备状态与预警",children:[u.jsxs("div",{className:"device-alert-heading",children:[u.jsxs("div",{children:[u.jsx("span",{className:"eyebrow",children:"设备监测"}),u.jsx("h2",{children:"设备状态与预警"})]}),u.jsxs("span",{children:[n.length," 台设备 · ",i.length," 项预警"]})]}),u.jsx("div",{className:"device-alert-grid",children:t.map(r=>{var o;const s=Qr(r,r.result),a=((o=r.result)==null?void 0:o.current_sample)||r.sample;return u.jsxs("button",{className:`device-alert-card ${s}`,type:"button",onClick:()=>e(r.id),children:[u.jsxs("span",{className:"device-alert-card-top",children:[u.jsx("i",{className:`legend-dot ${s==="normal"?"normal":s==="idle"?"idle":s}`}),u.jsx("strong",{children:r.name}),u.jsx("em",{children:au(s)})]}),u.jsx("span",{className:"device-alert-reason",children:dy(r)}),u.jsx("small",{children:r.live&&(a!=null&&a.timestamp)?`最近采样 ${ti(a.timestamp)}`:"暂无实时采样"})]},r.id)})})]})}function Qr(t,e){return t!=null&&t.live?(e==null?void 0:e.status)==="fault"?"fault":(e==null?void 0:e.status)==="alarm"?"alarm":(e==null?void 0:e.status)==="warning"?"warning":"normal":"idle"}function au(t){return t==="fault"?"故障":t==="alarm"?"报警":t==="warning"?"预警":t==="idle"?"未接入":"正常"}const Mt=Object.freeze({robot:[5.8,-.15],pickup:[4.7,1.12],inspection:[7.6,1],qualified:[7.65,-1.3],rework:[6.65,-2.1],robotReach:2.22});function s2({machines:t=[],selectedMachineId:e,status:n,viewMode:i,onSelect:r}){const s=se.useRef(null),a=se.useRef(r),o=se.useRef(t),l=se.useRef(e),c=se.useRef(null),h=se.useRef(null),p=se.useRef(null),[f,g]=se.useState(null),v=se.useMemo(()=>t.map(_=>`${_.id}:${_.live?1:0}:${Qr(_,_.result)}`).join("|"),[t]),S=i||"iso";return se.useEffect(()=>{a.current=r},[r]),se.useEffect(()=>{o.current=t},[t]),se.useEffect(()=>{var _;l.current=e,(_=c.current)==null||_.call(c,e)},[e]),se.useEffect(()=>{const _=s.current;if(!_)return;const d=new Tx;d.fog=new zp(15988468,14,52);const m=new Gn(39,_.clientWidth/_.clientHeight,.1,100),M=_.clientWidth<600;M&&(m.fov=55,m.updateProjectionMatrix()),m.position.set(M?13:10.4,M?12:5.7,M?40:13.7),m.lookAt(1.3,.75,0);const y=new Gx({antialias:!0,alpha:!0,preserveDrawingBuffer:!0});y.setPixelRatio(Math.min(window.devicePixelRatio,M?1.25:1.5)),y.setSize(_.clientWidth,_.clientHeight),y.shadowMap.enabled=!0,y.shadowMap.type=Uo,_.appendChild(y.domElement);const T=new Wx(m,y.domElement);T.target.set(1.3,.75,0),T.enableDamping=!0,T.dampingFactor=.08,T.minDistance=6.2,T.maxDistance=M?55:22,T.minPolarAngle=Math.PI*.16,T.maxPolarAngle=Math.PI*.49,T.enablePan=!0,T.panSpeed=.55,T.rotateSpeed=.55,T.zoomSpeed=.72,(G=>{G==="top"?(m.position.set(1.3,M?33:18,.1),T.target.set(1.3,0,-.2),T.enableRotate=!1):G==="line"?(m.position.set(M?7:3.8,M?10:4.5,M?40:17),T.target.set(1.3,.55,.2),T.enableRotate=!0):(m.position.set(M?13:10.4,M?12:5.7,M?40:13.7),T.target.set(1.3,.75,0),T.enableRotate=!0),m.lookAt(T.target),T.update()})(S);const C=new Map(o.current.map(G=>[G.id,G])),x=G=>o.current.find(ne=>ne.id===G),b=G=>{const ne=x(G);return Qr(ne,ne==null?void 0:ne.result)},P=G=>{var ne;return Qr(C.get(G),(ne=C.get(G))==null?void 0:ne.result)},D=G=>jg(P(G)),O=[],F=[],U=G=>G===l.current,W=G=>{F.forEach(({machineId:ne,ring:le})=>{const J=b(ne),Ce=["fault","alarm","warning"].includes(J),ue=J==="fault"?14760757:J==="alarm"?13793810:J==="warning"?14721577:1354354;le.visible=Ce||ne===G,le.material.color.setHex(Ce?ue:1354354),le.material.emissive.setHex(Ce?ue:1354354)}),O.forEach(({machineId:ne,material:le,selectedValue:J,defaultValue:Ce,property:ue})=>{le[ue]=ne===G?J:Ce})};c.current=W;const N=G=>G==="fault"||G==="alarm"||G==="warning",z=G=>{if(G==="EQUATOR300-VISUAL"){const J=x("RENISHAW-EQUATOR300-001"),Ce=Qr(J,J==null?void 0:J.result);return{id:G,name:"Renishaw Equator 300",type:"模拟工厂质检工位 · 动画仅示意",status:Ce,statusLabel:J?au(Ce):"无设备数据"}}const ne=x(G);if(!ne)return null;const le=b(G);return{id:G,name:ne.name||G,type:ne.type||"设备",status:le,statusLabel:au(le)}},k=jg(n),j=new it({color:14278110,roughness:.63,metalness:.03}),L=new it({color:14147295,roughness:.8,metalness:.04,side:jn}),$=new it({color:14262811,roughness:.58,metalness:.04}),de=new it({color:4214871,roughness:.6,metalness:.18}),we=new it({color:6847360,roughness:.4,metalness:.5}),Ke=new it({color:6582647,roughness:.72,metalness:.08}),$e=new it({color:2831160,roughness:.75,metalness:.05}),Ze=new it({color:13226451,roughness:.43,metalness:.25}),Q=new it({color:8754073,roughness:.46,metalness:.32}),ee=new it({color:2238253,roughness:.7,metalness:.2,transparent:!0,opacity:.86}),Ne=new it({color:12172994,roughness:.55,metalness:.12,transparent:!0,opacity:.68}),je=new it({color:7444124,roughness:.12,metalness:.04,transparent:!0,opacity:.35,side:jn,depthWrite:!1}),Re=new it({color:k,roughness:.42,metalness:.12,emissive:k,emissiveIntensity:.08}),Qe=new it({color:9805989,roughness:.52,metalness:.28}),ze=new it({color:4805722,roughness:.36,metalness:.45}),et=new it({color:12026410,roughness:.42,metalness:.22,emissive:3810048,emissiveIntensity:.05}),ot=new it({color:13357783,roughness:.32,metalness:.72}),yt=new it({color:4345945,roughness:.28,metalness:.78}),rt=new it({color:12831177,roughness:.3,metalness:.82}),Pt=new Cx({color:2503224,transparent:!0,opacity:.42}),Bt=new nu({color:16777215,transparent:!0,opacity:.001,depthWrite:!1}),pn=new Sw,Ct=new We,zt=[],V=[],Yt=(G,ne,le)=>(G.userData.machineId=ne,G.traverse(J=>{J.userData.machineId=ne}),le&&zt.push(le),G),ht=new Be(new Va(80,80),j);ht.rotation.x=-Math.PI/2,ht.position.y=-.36,ht.receiveShadow=!1,d.add(ht);const R=(G,ne,le,J=[0,0,0])=>{const Ce=new Be(new Ft(...G),le);return Ce.position.set(...ne),Ce.rotation.set(...J),Ce.castShadow=!le.transparent&&G[1]>.05,Ce.receiveShadow=le!==L&&!le.transparent,d.add(Ce),Ce};R([26,2.6,.08],[0,.92,-7.2],L),R([.08,2.25,12.5],[-12.3,.78,-.6],L),R([.08,2.25,12.5],[12.3,.78,-.6],L),R([24,.08,.12],[0,2.32,-6.95],$e),R([.12,.08,12],[-11.5,2.16,-.8],$e),R([.12,.08,12],[11.5,2.16,-.8],$e);const w=new it({color:7370869,roughness:.78}),X=(G,ne,le)=>{R([G[0]+.035,.017,G[2]+.035],[ne[0],-.332,ne[2]],w),R([G[0],.019,G[2]],[ne[0],-.313,ne[2]],le)};X([6.8,0,.075],[0,0,2],$),X([6.8,0,.075],[0,0,-1.95],$),X([.075,0,3.95],[-3.4,0,.02],$),X([.075,0,3.95],[3.4,0,.02],$);const K=new it({color:16053485,roughness:.7});X([17,0,.045],[0,0,2.52],K),X([17,0,.045],[0,0,3.92],K);const ie=(G,ne,le=[0,0,0],J=new I(0,0,1))=>{R(G,ne,de,le),R([G[0],.035,.08],[ne[0]-J.x*G[2]/2,ne[1]+.06,ne[2]-J.z*G[2]/2],we,le),R([G[0],.035,.08],[ne[0]+J.x*G[2]/2,ne[1]+.06,ne[2]+J.z*G[2]/2],we,le)},fe=[],_e=[],re=new I(0,1,0),oe=(G,ne,le=.52,J=6)=>{const Ce=new I(G[0],-.08,G[1]),ue=new I(ne[0],-.08,ne[1]),be=new I().subVectors(ue,Ce),Ge=be.length(),He=new I().addVectors(Ce,ue).multiplyScalar(.5),xn=Math.atan2(be.x,be.z),at=[0,xn-Math.PI/2,0],ui=be.clone().normalize(),kr=new I(-ui.z,0,ui.x);ie([Ge,.13,le],[He.x,He.y,He.z],at,kr);const wt=Math.max(3,Math.round(Ge/.27));for(let Ht=0;Ht<=wt;Ht+=1){const ln=Ht/wt,Xi=Ce.clone().lerp(ue,ln),cn=new Be(new It(.045,.045,le+.1,16),ze);cn.position.set(Xi.x,.03,Xi.z),cn.quaternion.setFromUnitVectors(re,kr),d.add(cn),fe.push(cn)}for(let Ht=0;Ht<J;Ht+=1){const ln=new Be(new Ft(.08,.035,le+.06),ze);ln.userData.offset=Ht/J,ln.quaternion.setFromAxisAngle(re,xn-Math.PI/2),ln.castShadow=!0,d.add(ln),_e.push({mesh:ln,start:Ce,end:ue})}};oe([-5.68,2.45],[-5.68,.72],.55,0),oe([2.45,1.12],[4.85,1.12],.55,0),R([1.45,.42,.75],[-6.15,-.08,-6.15],Ke),R([1.55,.13,.85],[-6.15,.22,-6.15],$e),R([1.35,.38,.72],[6.05,-.08,-6.15],Ke),R([1.45,.12,.82],[6.05,.18,-6.15],$e);const he=new it({color:5859696,roughness:.46,metalness:.55}),Fe=new it({color:10207172,roughness:.18,transparent:!0,opacity:.24,depthWrite:!1,side:jn});for(const G of[-3.25,-1.65,-.05,1.55,3.15])R([.065,1.22,.065],[G,.31,-2.25],he),R([.16,.035,.16],[G,-.32,-2.25],he);for(let G=0;G<3;G+=1){const ne=-2.45+G*1.6;R([1.49,1.06,.018],[ne,.32,-2.25],Fe),R([1.54,.04,.06],[ne,.89,-2.25],he),R([1.54,.04,.06],[ne,-.25,-2.25],he)}R([1.49,1.06,.018],[2.35,.32,-2.25],Fe),R([1.52,.045,.07],[2.35,.89,-2.25],he),R([1.52,.045,.07],[2.35,-.25,-2.25],he),R([.05,1.14,.07],[1.59,.32,-2.25],he),R([.05,1.14,.07],[3.11,.32,-2.25],he);for(const G of[.02,.66])R([.09,.11,.12],[1.59,G,-2.17],ze);R([.035,.25,.09],[2.96,.28,-2.14],ze),R([6.48,.045,.07],[-.05,.94,-2.25],he);for(const G of[-8.9,8.9]){R([.85,1.65,.62],[G,.5,-6.35],Q),R([.62,.35,.025],[G,.95,-6.35+.33],ee),R([.08,.2,.05],[G+.32,.45,-6.35+.34],ze);for(let le=0;le<5;le+=1)R([.48,.014,.015],[G,.15+le*.055,-6.35+.33],ze);for(const le of[-.3,.3])R([.1,.08,.1],[G+le,-.32,-6.35],ze)}for(let G=0;G<10;G+=1){const ne=G%2===0?-10.8:10.8,le=-5.7+Math.floor(G/2)*2.8,J=new Be(new It(.06,.06,2.6,12),Ke);J.position.set(ne,.92,le),J.castShadow=!0,d.add(J)}const xe=(G,ne,le=1.45)=>{const J=new Be(new su(le,.035,8,64),new it({color:1354354,emissive:1354354,emissiveIntensity:.35,transparent:!0,opacity:.9,side:jn,depthWrite:!1}));return J.rotation.x=-Math.PI/2,J.position.set(ne[0],-.28,ne[2]),J.visible=!1,d.add(J),F.push({machineId:G,ring:J}),J},me=(G,ne)=>{const le=new tg(16721189,0,4.8);return le.position.set(ne[0],1.05,ne[2]),d.add(le),V.push({id:G,glow:le}),le},Oe=[],ke=(G,ne,le,J)=>{R([.08,.28,.08],[ne,le-.16,J],ze);const Ce=[12071990,15116073,3577727].map((ue,be)=>{const Ge=new it({color:ue,roughness:.3,emissive:ue,emissiveIntensity:.06}),He=new Be(new It(.083,.083,.09,20),Ge);return He.position.set(ne,le+be*.095,J),d.add(He),Ge});Oe.push({id:G,lamps:Ce})},qe=()=>{const G="LNS-QL-SERVO-80-S2-001",ne=D(G),le=new it({color:ne,roughness:.4,metalness:.12,emissive:ne,emissiveIntensity:U(G)?.16:.05});O.push({machineId:G,material:le,property:"emissiveIntensity",selectedValue:.16,defaultValue:.05});const J=new it({color:15133164,roughness:.56,metalness:.08}),Ce=new it({color:13620696,roughness:.5,metalness:.12}),ue=new it({color:10402240,roughness:.2,metalness:.04,transparent:!0,opacity:.42,side:jn}),be=new wn,Ge=[];be.position.set(-4.15,.12,.13),be.rotation.y=0,be.scale.set(.86,.86,.86),d.add(be),xe(G,[be.position.x,be.position.y,be.position.z],1.5),me(G,[be.position.x,be.position.y,be.position.z]),ke(G,-3.9,1.7,.1);const He=(wt,Ht,ln,Xi=[0,0,0])=>{const cn=new Be(new Ft(...wt),ln);return cn.position.set(...Ht),cn.rotation.set(...Xi),cn.castShadow=!0,cn.receiveShadow=!0,be.add(cn),cn},xn=(wt,Ht,ln,Xi,cn=[0,0,0],$i=24)=>{const Mi=new Be(new It(wt,wt,Ht,$i),Xi);return Mi.position.set(...ln),Mi.rotation.set(...cn),Mi.castShadow=!0,Mi.receiveShadow=!0,be.add(Mi),Mi},at=(wt,Ht,ln,Xi)=>{const cn=new I(...wt),$i=new I(...Ht),Mi=new I().subVectors($i,cn),ml=Mi.length(),fr=new Be(new It(ln,ln,ml,16),Xi);return fr.position.copy(cn.add($i).multiplyScalar(.5)),fr.quaternion.setFromUnitVectors(new I(0,1,0),Mi.normalize()),fr.castShadow=!0,fr.receiveShadow=!0,be.add(fr),fr};He([4.3,.08,1.08],[0,.06,0],ze),He([4.05,.08,.1],[0,.18,-.48],ee),He([4.05,.08,.1],[0,.18,.48],ee),He([.18,.16,.24],[-1.92,.13,-.48],ee),He([.18,.16,.24],[-1.92,.13,.48],ee),He([.18,.16,.24],[1.92,.13,-.48],ee),He([.18,.16,.24],[1.92,.13,.48],ee),He([1.05,.78,.82],[-.35,.55,.03],Ce),He([.86,.52,.06],[-.35,.58,.46],J),He([.5,.08,.08],[-.35,.9,.5],le),He([.42,.18,.04],[-.35,.46,.5],ee),at([-1.45,.16,-.42],[-.82,.88,-.2],.035,ze),at([1.45,.16,-.42],[.82,.88,-.2],.035,ze),at([-1.45,.16,.42],[-.82,.88,.2],.035,ze),at([1.45,.16,.42],[.82,.88,.2],.035,ze),He([4.1,.24,.72],[0,1.02,0],J),He([4.28,.14,.84],[0,1.2,0],Ce),He([.34,.74,.84],[-2,.9,0],Ce),He([.34,.66,.84],[2,.86,0],Ce),He([3.75,.08,.64],[0,1.37,-.18],J,[-.18,0,0]),He([1.05,.055,.34],[-.82,1.45,-.36],ue,[-.18,0,0]),He([1.05,.055,.34],[.82,1.45,-.36],ue,[-.18,0,0]),He([4.08,.08,.12],[0,1.31,.46],ee);for(const wt of[-1.5,-.5,.5,1.5])He([.025,.18,.012],[wt,1.08,.435],ze);for(const wt of[-1.55,1.55])He([.18,.62,.55],[wt,-.28,0],Ce),He([.38,.07,.65],[wt,-.61,0],ze);for(let wt=0;wt<8;wt+=1)He([.016,.14,.012],[-.58+wt*.065,.55,.502],ze);He([.42,.18,.012],[.35,.6,.504],ee),He([.22,.045,.014],[.35,.6,.514],le),He([3.85,.09,.24],[.18,.88,.43],de),xn(.09,4.25,[.18,.94,.55],de,[0,0,Math.PI/2],32),xn(.045,4,[.08,1.03,.43],et,[0,0,Math.PI/2],24);const ui=He([.18,.16,.28],[-1.72,1.03,.55],le);He([1.05,.09,.18],[1.28,1.02,.58],le),He([.42,.18,.24],[2.1,.96,.55],ee),He([3.35,.055,.06],[0,.78,-.35],ze),He([3.35,.055,.06],[0,.78,.35],ze);for(let wt=0;wt<8;wt+=1){const Ht=new Be(new It(.055,.055,.78,18),ze);Ht.position.set(-1.45+wt*.42,.82,0),Ht.rotation.x=Math.PI/2,Ht.castShadow=!0,be.add(Ht),Ge.push(Ht)}for(let wt=0;wt<4;wt+=1){const Ht=wt<2?-1.82:1.82,ln=wt%2===0?-.55:.55;xn(.09,.08,[Ht,.04,ln],ee,[Math.PI/2,0,0],20)}const kr=new Be(new Ft(4.7,1.6,1.3),Bt);return kr.position.set(0,.78,.02),be.add(kr),Yt(be,G,kr),{feederGroup:be,feederRollers:Ge,pusher:ui}},H=()=>{const G="ELITE-CS612-ROBOT-001",ne=D(G),le=new it({color:ne,roughness:.38,metalness:.16,emissive:ne,emissiveIntensity:U(G)?.18:.06});O.push({machineId:G,material:le,property:"emissiveIntensity",selectedValue:.18,defaultValue:.06});const J=new it({color:15856629,roughness:.34,metalness:.08}),Ce=new it({color:13620440,roughness:.24,metalness:.62}),ue=new it({color:1518440,roughness:.28,metalness:.2}),be=new it({color:2764597,roughness:.42,metalness:.4}),Ge=new wn;Ge.position.set(Mt.robot[0],-.25,Mt.robot[1]),d.add(Ge),xe(G,[Ge.position.x,Ge.position.y,Ge.position.z],.85),me(G,[Ge.position.x,Ge.position.y,Ge.position.z]),ke(G,Mt.robot[0],1.42,Mt.robot[1]);const He=(Bn,Ei,wi,Ti,di=[0,0,0],vy=40)=>{const Ws=new Be(new It(Bn,Bn,Ei,vy),Ti);return Ws.position.set(...wi),Ws.rotation.set(...di),Ws.castShadow=!0,Ws.receiveShadow=!0,Ge.add(Ws),Ws},xn=(Bn,Ei,wi,Ti=[0,0,0])=>{const di=new Be(new Ft(...Bn),wi);return di.position.set(...Ei),di.rotation.set(...Ti),di.castShadow=!0,di.receiveShadow=!0,Ge.add(di),di},at=(Bn,Ei)=>{const wi=new wn,Ti=new Be(new It(Bn,Bn,.26,32),Ei);Ti.rotation.x=Math.PI/2,Ti.castShadow=!0,wi.add(Ti);const di=new Be(new It(Bn*.79,Bn*.79,.028,32),ue);return di.rotation.x=Math.PI/2,di.position.z=.145,wi.add(di),wi.castShadow=!0,Ge.add(wi),wi},ui=(Bn,Ei,wi)=>{const Ti=new Be(new It(Bn,Bn*.94,Ei,24),wi);return Ti.castShadow=!0,Ge.add(Ti),Ti};He(.45,.08,[0,.05,0],be),He(.31,.32,[0,.27,0],J),He(.32,.045,[0,.46,0],ue),xn([.22,.1,.1],[.28,.12,0],be);const kr=at(.26,J),wt=at(.23,J),Ht=at(.17,J),ln=ui(.145,1.14,Ce),Xi=ui(.12,1.14,Ce),cn=ui(.175,.05,ue),$i=new wn;Ge.add($i);const Mi=new Be(new It(.13,.13,.08,24),be);$i.add(Mi);const ml=new Be(new Ft(.28,.1,.2),be);ml.position.y=-.1,$i.add(ml);const fr=Bn=>{const Ei=new Be(new Ft(.055,.26,.05),Ce);return Ei.position.set(0,-.25,Bn),$i.add(Ei),Ei},gy=fr(.13),_y=fr(-.13),Uu=new Be(new It(.035,.035,.28,12),be);Uu.rotation.z=Math.PI/2,Uu.position.set(.29,.14,0),Ge.add(Uu);const Fu=new Be(new Ft(2.9,2.2,2.2),Bt);return Fu.position.set(.72,1,0),Ge.add(Fu),Yt(Ge,G,Fu),{robotGroup:Ge,shoulderJoint:kr,elbowJoint:wt,wristJoint:Ht,upperLink:ln,foreLink:Xi,wristBand:cn,toolCarrier:$i,fingerA:gy,fingerB:_y}},ve=qe(),te=H(),ge=DC();ge.root.position.set(Mt.inspection[0],-.3,Mt.inspection[1]),d.add(ge.root),xe("RENISHAW-EQUATOR300-001",[Mt.inspection[0],-.3,Mt.inspection[1]],.95),me("RENISHAW-EQUATOR300-001",[Mt.inspection[0],-.3,Mt.inspection[1]]);const Se=new Be(new Ft(1.6,1.76,1.6),Bt);Se.position.set(Mt.inspection[0],.56,Mt.inspection[1]),d.add(Se),Yt(ge.root,"EQUATOR300-VISUAL",Se),Se.userData.machineId="EQUATOR300-VISUAL",ke("RENISHAW-EQUATOR300-001",Mt.inspection[0],1.57,Mt.inspection[1]);const ae=new wn;ae.position.set(.05,-.1,-.08),ae.rotation.y=0,ae.scale.set(.82,.82,.82),d.add(ae);const ye=(G,ne,le,J,Ce=[0,0,0])=>{const ue=new Be(new Ft(...ne),J);ue.name=G,ue.position.set(...le),ue.rotation.set(...Ce),ue.castShadow=!0,ue.receiveShadow=!0,ae.add(ue);const be=new nw(new sw(ue.geometry),Pt);return be.position.copy(ue.position),be.rotation.copy(ue.rotation),be.scale.copy(ue.scale),ae.add(be),ue};ye("machine-base",[4.65,.52,1.68],[0,.28,0],ee),ye("left-headstock-cabinet",[1.08,1.88,1.66],[-1.78,1.4,0],ee),ye("transparent-main-shell",[3.35,1.78,1.58],[-.15,1.4,0],Ze),ye("rear-column",[.45,1.95,1.58],[-2.2,1.44,0],Q);const Ie=new wn;Ie.position.set(-1.62,1.42,.89),ae.add(Ie);const pt=(G,ne,le)=>{const J=new Be(new Ft(...G),le);return J.position.set(...ne),Ie.add(J),J};pt([1.68,1.18,.025],[.9,0,0],je),pt([1.8,.075,.08],[.9,.64,0],Q),pt([1.8,.075,.08],[.9,-.64,0],Q),pt([.075,1.3,.08],[.04,0,0],Q),pt([.075,1.3,.08],[1.76,0,0],Q),pt([.075,.32,.075],[1.65,-.06,.09],ze),ye("right-slanted-cover",[.86,1.56,1.5],[1.32,1.38,.04],Ze,[0,0,-.18]),ye("control-panel",[.45,1.22,.18],[1.98,1.5,.78],ee,[0,0,-.24]),ye("top-service-rail",[3.12,.16,1.34],[-.24,2.28,0],ee),ye("status-strip",[1.82,.06,.08],[-.42,2.39,.7],Re),ye("chip-conveyor-neck",[1.12,.28,.34],[2.38,1,.22],ee,[0,0,.4]),ye("chip-bin",[.7,.58,.7],[3,.76,.22],Ze),ye("front-service-panel",[2.68,.5,.08],[-.36,.58,.86],Ne);for(let G=0;G<9;G+=1)ye("cabinet-vent",[.23,.018,.014],[1.34,1.9-G*.06,.83],ze);for(let G=0;G<6;G+=1)ye("panel-key",[.035,.035,.018],[1.94+G%2*.09,1.95-Math.floor(G/2)*.1,.89],Ne);ye("panel-screen",[.27,.24,.025],[1.97,1.66,.9],je),ye("nameplate",[.46,.12,.02],[-1.8,1.9,.85],ze),ye("left-foot",[.25,.5,.22],[-1.85,-.02,.56],ee),ye("right-foot",[.25,.5,.22],[1.55,-.02,.56],ee),ye("inner-bed",[2.45,.18,.46],[-.35,1.02,.4],Qe),ye("linear-guide-left",[2.35,.055,.055],[-.32,1.16,.22],ze),ye("linear-guide-right",[2.35,.055,.055],[-.32,1.16,.58],ze),ye("tailstock-shadow",[.42,.44,.5],[.9,1.26,.38],Qe);const nt=new wn;nt.name="spindleChuck",nt.position.set(-1.12,1.36,.78),ae.add(nt);const Pn=new Be(new It(.29,.29,.22,48),ze);Pn.rotation.z=Math.PI/2,Pn.castShadow=!0,nt.add(Pn);const On=new Be(new It(.22,.22,.04,48),Re);On.position.x=.13,On.rotation.z=Math.PI/2,nt.add(On);for(let G=0;G<3;G+=1){const ne=G*(Math.PI*2/3),le=new Be(new Ft(.16,.06,.24),yt);le.position.set(.17,Math.cos(ne)*.16,Math.sin(ne)*.16),le.rotation.x=ne,le.castShadow=!0,nt.add(le)}const Ur=new Be(new It(.13,.13,.88,48),ot);Ur.name="machiningWorkpiece",Ur.position.x=.48,Ur.rotation.z=Math.PI/2,Ur.castShadow=!0,nt.add(Ur);const Si=new wn;Si.name="toolSlide",Si.position.set(.32,1.27,.55),ae.add(Si);const Ka=new Be(new Ft(.56,.34,.42),Qe);Ka.castShadow=!0,Si.add(Ka);const ur=new Be(new It(.22,.22,.25,8),ze);ur.rotation.x=Math.PI/2,ur.position.set(-.05,.08,.24),ur.castShadow=!0,Si.add(ur);const zi=new Be(new Vp(.06,.34,4),yt);zi.name="cutterTip",zi.position.set(-.33,.08,.24),zi.rotation.z=Math.PI/2,zi.rotation.y=Math.PI/4,zi.castShadow=!0,Si.add(zi);const ms=new tg(16760922,.9,1.3);ms.name="cuttingGlow",ms.position.set(-.45,.08,.24),Si.add(ms);const Hi=new wn;Hi.name="loadingArm",Hi.position.set(-2.02,1.62,.62),ae.add(Hi);const Vi=new Be(new Ft(.08,.72,.08),ze);Vi.castShadow=!0,Hi.add(Vi);const gs=new Be(new Ft(.08,.08,.38),yt);gs.position.set(.18,-.33,.12),Hi.add(gs);const Za=gs.clone();Za.position.z=-.12,Hi.add(Za),ke("TRAK-TC820LTYSI-001",-1.35,2.05,-.08),R([1.2,.12,.17],[-1.93,.98,.56],ze),R([1.1,.055,.27],[2.37,.31,1.02],Qe,[0,0,-.16]),R([.09,.14,.28],[2.82,.28,1.02],ze);const Qa=G=>{const ne=new wn;ne.userData.offset=G,ne.name="rawBarStock";const le=new Be(new It(.11,.11,.66,32),et);le.rotation.z=Math.PI/2,le.castShadow=!0,ne.add(le);const J=new Be(new It(.115,.115,.025,32),ee);return J.position.x=-.35,J.rotation.z=Math.PI/2,ne.add(J),d.add(ne),ne},Fr=(G=0,ne=ot)=>{const le=new wn;le.userData.offset=G,le.name="screwPart";const J=new Be(new It(.045,.045,.42,32),ne);J.rotation.z=Math.PI/2,J.castShadow=!0,le.add(J);const Ce=new Be(new It(.09,.09,.08,32),ne);Ce.position.x=-.23,Ce.rotation.z=Math.PI/2,Ce.castShadow=!0,le.add(Ce);const ue=new Be(new Ft(.018,.13,.018),ee);return ue.position.x=-.275,ue.castShadow=!0,le.add(ue),d.add(le),le},Vs=G=>{const ne=Fr(G);ne.name="finishedParts";const le=new Be(new It(.022,.022,.44,24),ee);return le.rotation.z=Math.PI/2,le.scale.set(1,1,1),ne.add(le),ne},Gs=[Qa(0),Qa(.48)],Ja=[Vs(.05),Vs(.34),Vs(.68)],dr=Fr(0,ot);te!=null&&te.toolCarrier&&(te.toolCarrier.add(dr),dr.position.set(0,-.35,0),dr.rotation.set(0,0,0),dr.scale.setScalar(.78),dr.visible=!1);const Nu=new it({color:5663096,roughness:.6,metalness:.22}),js=new I(Mt.qualified[0],-.16,Mt.qualified[1]),Lu=new I(Mt.rework[0],-.16,Mt.rework[1]),Du=new it({color:10121808,roughness:.68,metalness:.08}),eo=(G,ne,le)=>{const{x:J,y:Ce,z:ue}=G;R([1.05,.12,.82],[J,Ce,ue],ne);for(const at of[-1,1]){R([.08,.47,.82],[J+at*.52,Ce+.25,ue],ne),R([.16,.065,.28],[J+at*.56,Ce+.51,ue],ze);for(const ui of[-.22,.22])R([.025,.4,.08],[J+at*.565,Ce+.25,ue+ui],ze)}for(const at of[-1,1]){R([1.05,.47,.08],[J,Ce+.25,ue+at*.41],ne);for(const ui of[-.35,.35])R([.045,.4,.025],[J+ui,Ce+.25,ue+at*.455],ze)}R([1.15,.065,.07],[J,Ce+.51,ue+.41],ze);const be=document.createElement("canvas");be.width=256,be.height=96;const Ge=be.getContext("2d");Ge.fillStyle="#e4e8e7",Ge.fillRect(0,0,be.width,be.height),Ge.fillStyle="#26343b",Ge.font="bold 46px sans-serif",Ge.textAlign="center",Ge.fillText(le,128,66);const He=new iw(be),xn=new Be(new Va(.5,.18),new it({map:He,roughness:.75}));xn.position.set(J,Ce+.26,ue+.457),d.add(xn)};eo(js,Nu,"合格品"),eo(Lu,Du,"待处理");const A=Array.from({length:9},(G,ne)=>{const le=Fr(ne/9,ot);return le.position.set(js.x-.28+ne%3*.22,js.y+.16+Math.floor(ne/3)*.035,js.z-.2+Math.floor(ne/3)*.18),le.rotation.set(0,0,0),le.scale.setScalar(.72),le}),B=Array.from({length:18},(G,ne)=>{const le=ne<3,J=le?new nu({color:16759395}):rt,Ce=new Be(new su(le?.01:.033,le?.004:.008,4,10,Math.PI*1.3),J);return Ce.userData.offset=ne/18,Ce.castShadow=!0,ae.add(Ce),Ce});xe("TRAK-TC820LTYSI-001",[ae.position.x,ae.position.y,ae.position.z],2.05),me("TRAK-TC820LTYSI-001",[ae.position.x,ae.position.y,ae.position.z]);const Z=new Be(new Ft(5.1,2.8,2.3),Bt);Z.position.set(.08,1.15,.05),ae.add(Z),Yt(ae,"TRAK-TC820LTYSI-001",Z);const Y=new Lx(16777215,12109257,1.4);d.add(Y);const q=new bh(16777215,2.3);q.position.set(3,5,4),q.castShadow=!0,d.add(q);const Me=new bh(k,.9);Me.position.set(-3,2.5,-2),d.add(Me);const Te=new I(0,1.35,.48),pe=(G,ne)=>new I(G[0]-Mt.robot[0],ne,G[1]-Mt.robot[1]),Le=pe(Mt.pickup,1.12),Ue=pe(Mt.pickup,.7),Je=new I(.1,1.42,1.12),Xe=pe(Mt.inspection,1.13),Pe=pe(Mt.inspection,.58),vt=pe(Mt.qualified,1.25),$t=pe(Mt.qualified,.95),Rt=pe(Mt.rework,1.25),Et=pe(Mt.rework,.95),Kt=Ja[0],Ae=new I,Lt=new I,dt=new I,kn=new I,Kn=G=>{const ne=[];let le=0;for(let J=0;J<G.length-1;J+=1){const Ce=G[J],ue=G[J+1],be=Ce.distanceTo(ue);ne.push({from:Ce,to:ue,length:be}),le+=be}return{segments:ne,total:le}},Gi=Kn([new I(-5.68,.08,2.45),new I(-5.68,.08,.72)]),Or=Kn([new I(2.45,.08,1.12),new I(4.7,.08,1.12)]),xt=(G,ne,le)=>{let J=Math.max(0,Math.min(1,ne))*G.total;for(const ue of G.segments){if(J<=ue.length)return le.copy(ue.from).lerp(ue.to,ue.length?J/ue.length:0);J-=ue.length}const Ce=G.segments[G.segments.length-1];return le.copy(Ce.to)},St=(G,ne,le)=>Ae.copy(G).lerp(ne,le),ci=(G,ne,le,J)=>(Lt.copy(G).lerp(ne,J),dt.copy(ne).lerp(le,J),Ae.copy(Lt).lerp(dt,J)),st=G=>G*G*(3-2*G),ji=new I(Mt.pickup[0],.08,Mt.pickup[1]),Wi=new I(0,1,0),_s=new I(0,.7,0),hy=new I(0,1,0),hl=new I,to=new I,pl=new I,am=(G,ne,le,J)=>{G.position.copy(ne).add(le).multiplyScalar(.5),G.quaternion.setFromUnitVectors(hy,kn.copy(le).sub(ne).normalize()),G.scale.y=ne.distanceTo(le)/J},py=G=>{const ne=Math.min(2.26,Math.max(.01,to.copy(G).sub(_s).length()));to.normalize(),pl.copy(Wi).addScaledVector(to,-Wi.dot(to)).normalize(),pl.lengthSq()<.001&&pl.set(0,0,1);const le=Math.sqrt(Math.max(0,1.14*1.14-ne*ne/4));hl.copy(_s).addScaledVector(to,ne/2).addScaledVector(pl,le),te.shoulderJoint.position.copy(_s),te.elbowJoint.position.copy(hl),te.wristJoint.position.copy(G),am(te.upperLink,_s,hl,1.14),am(te.foreLink,hl,G,1.14),te.wristBand.position.copy(G).addScaledVector(Wi,-.12),te.toolCarrier.position.copy(G)};let om=0;const lm=()=>{om=window.requestAnimationFrame(lm);const G=performance.now()*.001,ne=(Math.sin(G*1.05)+1)/2,le=G*.18%1,J=G%12/12,Ce=J<.38;if(nt.rotation.x=Ce?G*8.6:0,Ur.rotation.x=0,Si.position.x=Ce?.22+Math.sin(G*.92)*.22:.48,Si.position.z=Ce?.48+Math.sin(G*1.45)*.08:.55,ur.rotation.z=Ce?G*.65:0,ms.intensity=Ce?.15+ne*.2:0,zi.material.emissive.setHex(5923421),zi.material.emissiveIntensity=Ce?.08:0,Ie.position.x=-1.62+(Ce?0:1.12),Hi.rotation.z=Math.sin(G*1.2)*.18,fe.forEach(ue=>{ue.rotateY(-.16)}),_e.forEach(ue=>{const be=(le+ue.mesh.userData.offset)%1;Lt.copy(ue.start).lerp(ue.end,be),ue.mesh.position.set(Lt.x,.02,Lt.z)}),ve&&(ve.feederRollers.forEach(ue=>{ue.rotateY(-.18)}),ve.pusher.position.x=-1.72+G*.32%1*3.18),te){const ue=Math.floor(G/12)%2===1,be=ue?Rt:vt,Ge=ue?Et:$t,He=J>=.25&&J<.56||J>=.83&&J<.96,xn=J>=.22&&J<.6||J>=.78&&J<.97;let at=Te;J<.1?at=Te:J<.2?at=St(Te,Le,st((J-.1)/.1)):J<.25?at=St(Le,Ue,st((J-.2)/.05)):J<.28?at=Ue:J<.38?at=St(Ue,Le,st((J-.28)/.1)):J<.5?at=ci(Le,Je,Xe,st((J-.38)/.12)):J<.56?at=St(Xe,Pe,st((J-.5)/.06)):J<.6?at=Pe:J<.66?at=St(Pe,Xe,st((J-.6)/.06)):J<.72?at=Xe:J<.78?at=St(Xe,Pe,st((J-.72)/.06)):J<.83?at=Pe:J<.87?at=St(Pe,Xe,st((J-.83)/.04)):J<.93?at=ci(Xe,Te,be,st((J-.87)/.06)):J<.96?at=St(be,Ge,st((J-.93)/.03)):J<.975?at=Ge:at=ci(Ge,be,Te,st((J-.975)/.025)),py(at),te.fingerA.position.z=xn?.07:.14,te.fingerB.position.z=xn?-.07:-.14,dr.visible=He}Gs.forEach(ue=>{const be=(G*.2+ue.userData.offset)%1,Ge=be>.78?.78+(be-.78)*.18:be;xt(Gi,Ge,Lt),ue.position.copy(Lt),ue.rotation.x=G*2.5}),Kt&&(J<.25?(Kt.visible=!0,Kt.position.copy(ji)):Kt.visible=!1),ge.workpiece.visible=J>=.56&&J<.83,Ja.slice(1).forEach(ue=>{const be=(G*.17+ue.userData.offset)%1,Ge=be>.86?.86+(be-.86)*.18:be;xt(Or,Ge,Lt),ue.position.copy(Lt),ue.rotation.x=G*2.6,ue.rotation.y=Math.sin(G*1.6+ue.userData.offset)*.08}),A.forEach((ue,be)=>{ue.visible=be<3+Math.floor(G/12)%7}),B.forEach(ue=>{const be=(G*1.4+ue.userData.offset)%1;ue.position.set(-.18+be*.7,1.35-be*.45+Math.sin(be*Math.PI*4)*.035,.8+be*.28),ue.rotation.set(G*4+be,G*2.3,be*6),ue.visible=Ce}),V.forEach(ue=>{const be=N(b(ue.id)),Ge=.35+Math.abs(Math.sin(G*4.6))*.65;ue.glow.intensity=be?2.2+Ge*2.4:0}),Oe.forEach(({id:ue,lamps:be})=>{const Ge=b(ue),He=Ge==="idle"?-1:Ge==="fault"||Ge==="alarm"?0:Ge==="warning"?1:2;be.forEach((xn,at)=>{xn.emissiveIntensity=at===He?He===0?.8+Math.abs(Math.sin(G*5))*1.3:.9:.04})}),T.update(),y.render(d,m)};W(l.current),lm();const my=()=>{!_.clientWidth||!_.clientHeight||(m.aspect=_.clientWidth/_.clientHeight,m.updateProjectionMatrix(),y.setSize(_.clientWidth,_.clientHeight))},cm=new ResizeObserver(my);cm.observe(_);const Iu=()=>{h.current&&(window.clearTimeout(h.current),h.current=null),p.current=null,g(null)},um=G=>{var J,Ce,ue;const ne=y.domElement.getBoundingClientRect();return Ct.x=(G.clientX-ne.left)/ne.width*2-1,Ct.y=-((G.clientY-ne.top)/ne.height)*2+1,pn.setFromCamera(Ct,m),((ue=(Ce=(J=pn.intersectObjects(zt,!1)[0])==null?void 0:J.object)==null?void 0:Ce.userData)==null?void 0:ue.machineId)||null},dm=G=>{const ne=um(G);if(!ne){Iu();return}const le={x:Math.min(Math.max(G.offsetX+14,14),Math.max(_.clientWidth-250,14)),y:Math.min(Math.max(G.offsetY+14,14),Math.max(_.clientHeight-112,14))};if(p.current===ne){g(J=>J&&{...J,...le});return}h.current&&window.clearTimeout(h.current),p.current=ne,g(null),h.current=window.setTimeout(()=>{const J=z(ne);!J||p.current!==ne||g({...J,...le})},2e3)},fm=()=>Iu(),hm=G=>{const ne=um(G)||p.current;ne==="EQUATOR300-VISUAL"?x("RENISHAW-EQUATOR300-001")&&a.current("RENISHAW-EQUATOR300-001"):ne&&a.current(ne)};return y.domElement.addEventListener("pointermove",dm),y.domElement.addEventListener("pointerleave",fm),y.domElement.addEventListener("click",hm),()=>{c.current=null,window.cancelAnimationFrame(om),cm.disconnect(),Iu(),y.domElement.removeEventListener("pointermove",dm),y.domElement.removeEventListener("pointerleave",fm),y.domElement.removeEventListener("click",hm),y.domElement.parentNode===_&&_.removeChild(y.domElement),d.traverse(G=>{G.geometry&&G.geometry.dispose(),G.material&&(Array.isArray(G.material)?G.material.forEach(ne=>ne.dispose()):(G.material.map&&G.material.map.dispose(),G.material.dispose()))}),T.dispose(),y.dispose(),y.forceContextLoss()}},[v,S]),u.jsx("div",{ref:s,className:"machine-3d-canvas","aria-hidden":"true",children:f?u.jsxs("div",{className:`scene-hover-label ${f.status}`,style:{left:f.x,top:f.y},children:[u.jsx("strong",{children:f.name}),u.jsx("span",{children:f.type}),u.jsx("em",{children:f.statusLabel})]}):null})}function jg(t){return t==="fault"?12007218:t==="alarm"||t==="warning"?11954688:t==="idle"?8227987:556917}function a2({machine:t,history:e}){var s,a;const n=(((s=Da[t==null?void 0:t.deviceType])==null?void 0:s.metrics)||[]).slice(0,3),i=((a=e[e.length-1])==null?void 0:a.points)||[],r=n.map(([o,l,,c],h)=>{const p=e.map(f=>{var g;return(g=f.points.find(v=>v.key===o))==null?void 0:g.value}).filter(f=>f!==void 0);return{key:o,name:l,unit:c,values:p,color:["#087f75","#235a8f","#b66a00"][h]}}).filter(o=>o.values.length);return u.jsxs("section",{className:"panel trend-panel",children:[u.jsxs("div",{className:"panel-heading",children:[u.jsxs("div",{children:[u.jsx("span",{className:"eyebrow",children:"实时趋势"}),u.jsx("h2",{children:"关键指标最近 30 秒"})]}),u.jsx("span",{className:"muted",children:e.length?`${e.length} 个采样点`:"等待采样"})]}),u.jsxs("div",{className:"trend-grid",children:[r.map(o=>u.jsx(o2,{item:o},o.key)),!r.length&&u.jsx("div",{className:"empty-state",children:"等待实时采样后生成趋势曲线"})]}),u.jsx("div",{className:"trend-latest",children:i.map(o=>{const l=n.find(([c])=>c===o.key);return u.jsxs("span",{children:[(l==null?void 0:l[1])||o.key,"：",Jp(o.value)," ",(l==null?void 0:l[3])||""]},o.key)})})]})}function o2({item:t}){const i=Math.min(...t.values),s=Math.max(...t.values)-i||1,a=t.values.map((l,c)=>{const h=t.values.length===1?220:c/(t.values.length-1)*220,p=72-(Number(l)-i)/s*60-6;return`${h.toFixed(1)},${p.toFixed(1)}`}).join(" "),o=t.values[t.values.length-1];return u.jsxs("div",{className:"mini-trend",children:[u.jsxs("div",{children:[u.jsx("span",{children:t.name}),u.jsxs("strong",{children:[Jp(o)," ",t.unit]})]}),u.jsx("svg",{viewBox:"0 0 220 72",role:"img","aria-label":`${t.name}趋势`,children:u.jsx("polyline",{points:a,fill:"none",stroke:t.color,strokeWidth:"3",strokeLinecap:"round",strokeLinejoin:"round"})})]})}function l2({machine:t,result:e,sample:n,dataSource:i,history:r,onClose:s}){const a=Qr(t,e);return se.useEffect(()=>{const o=l=>{l.key==="Escape"&&s()};return window.addEventListener("keydown",o),()=>window.removeEventListener("keydown",o)},[s]),u.jsx("div",{className:"drawer-backdrop",role:"presentation",onClick:s,children:u.jsxs("aside",{className:"machine-drawer",role:"dialog","aria-modal":"true","aria-label":`${t.name}设备详情`,onClick:o=>o.stopPropagation(),children:[u.jsxs("div",{className:"drawer-heading",children:[u.jsxs("div",{children:[u.jsx("span",{className:"eyebrow",children:t.area||t.line}),u.jsx("h2",{children:t.name}),u.jsxs("p",{children:[t.type," · ",t.id]}),t.live&&u.jsxs("p",{children:["数据源：",i||"监控服务",String(i||"").includes("模拟")?"（非实体测量）":""]})]}),u.jsx("button",{className:"button",type:"button",onClick:s,"aria-label":"关闭设备详情",children:"关闭"})]}),u.jsxs("div",{className:"drawer-status",children:[u.jsxs("div",{children:[u.jsx("span",{children:"状态"}),u.jsx("strong",{className:a,children:au(a)})]}),u.jsxs("div",{children:[u.jsx("span",{children:"健康度"}),u.jsx("strong",{children:t.live?yR(n):"--"})]}),u.jsxs("div",{children:[u.jsx("span",{children:"当前报警"}),u.jsx("strong",{children:t.live?KR(n):"--"})]})]}),u.jsxs("div",{className:"drawer-section",children:[u.jsx("span",{className:"eyebrow",children:"工位与数据"}),u.jsx("p",{children:t.flow||"设备工艺信息暂未提供"}),t.live&&n&&u.jsxs("p",{children:["最近采样：",ti(n.timestamp)," · 运行阶段：",YR(n)]})]}),t.live?n?u.jsxs(u.Fragment,{children:[u.jsx(c2,{result:e,sample:n,machine:t}),u.jsx(h2,{result:e,sample:n}),u.jsx(a2,{machine:t,history:r})]}):u.jsxs("div",{className:"drawer-no-data",children:[u.jsx("strong",{children:"等待设备采样"}),u.jsx("p",{children:"接入正常后，实时指标与监测判定会显示在这里。"})]}):u.jsxs("div",{className:"drawer-no-data",children:[u.jsx("strong",{children:"该工位尚未接入实时采集"}),u.jsx("p",{children:"三维模型可查看；健康度、测量值和报警状态暂不提供。"})]})]})})}function c2({result:t,sample:e,machine:n}){var o,l;const[i,r]=se.useState(!1),s=se.useMemo(()=>u2(t,e,n),[t,e,n]),a=i?s:s.slice(0,12);return u.jsxs("section",{className:"panel metrics-panel",children:[u.jsxs("div",{className:"panel-heading",children:[u.jsxs("div",{children:[u.jsx("span",{className:"eyebrow",children:"实时快照"}),u.jsx("h2",{children:"实时指标"})]}),u.jsxs("div",{className:"panel-actions",children:[u.jsx("span",{className:"muted",children:e?`最近采样 ${ti(e.timestamp)}`:"等待采样"}),s.length>12&&u.jsx("button",{className:"link-button",type:"button",onClick:()=>r(c=>!c),children:i?"收起重点":`显示全部 ${s.length} 项`})]})]}),u.jsx("div",{className:"metrics-grid",children:a.map(c=>u.jsx(d2,{item:c,result:t},c.key))}),(n==null?void 0:n.deviceType)==="turning_center"&&(e==null?void 0:e.vibration)==null&&((o=e==null?void 0:e.metrics)==null?void 0:o.spindle_vibration_mm_s)==null&&((l=e==null?void 0:e.metrics)==null?void 0:l.spindle_vibration_rms)==null&&u.jsx("div",{className:"notice",children:"当前车削中心数据源没有提供振动字段，振动不会被其他指标替代；其他设备指标仍会继续监测。"}),u.jsxs("div",{className:"subsection-heading",children:[u.jsx("span",{className:"eyebrow",children:"设备联锁与执行部件"}),u.jsx("strong",{children:"整机状态"})]}),u.jsx(f2,{sample:e})]})}function u2(t,e,n){const i=(e==null?void 0:e.metrics)||{},r=(e==null?void 0:e.metric_details)||{},s=Da[n==null?void 0:n.deviceType],a=new Set,o=((s==null?void 0:s.metrics)||[]).filter(([p])=>i[p]!==null&&i[p]!==void 0||r[p]).map(([p,f,g,v])=>{const S=r[p]||{};return a.add(p),{key:p,name:S.label||f,group:S.group||g,value:i[p],unit:S.unit||v,normalRange:S.normal_range}}),l=Object.entries(r).filter(([p])=>!a.has(p)).map(([p,f])=>(a.add(p),{key:p,name:f.label||p,group:f.group||"整机",value:i[p],unit:f.unit||"",normalRange:f.normal_range})),c=Object.entries(i).filter(([p])=>!a.has(p)).map(([p,f])=>({key:p,name:p,group:"实时数据",value:f,unit:""})),h=[...o,...l,...c];return h.length?h:[{key:"temperature",name:"温度",group:"主轴",value:e==null?void 0:e.temperature,unit:"°C"},{key:"vibration",name:"振动",group:"主轴",value:e==null?void 0:e.vibration,unit:"mm/s"},{key:"rpm",name:"转速",group:"主轴",value:e==null?void 0:e.rpm,unit:"rpm"}]}function Jp(t){if(t==null)return"未提供";const e=Number(t);return Number.isFinite(e)?Math.abs(e)>=100?e.toFixed(0):Number.isInteger(e)?String(e):e.toFixed(1):String(t)}function d2({item:t,result:e}){var a;const n=(a=e==null?void 0:e.observations)==null?void 0:a.find(o=>o.key===`metric:${t.key}`||o.key===t.key||t.key==="spindle_temperature_c"&&o.key==="temperature"||t.key==="spindle_vibration_rms"&&o.key==="vibration"),i=ly(n==null?void 0:n.alert_level),r=Jp(t.value),s=t.normalRange?`正常 ${t.normalRange[0]} - ${t.normalRange[1]}`:"";return u.jsxs("div",{className:`metric ${i}`,children:[u.jsx("span",{className:"metric-group",children:t.group}),u.jsx("span",{className:"metric-name",children:t.name}),u.jsx("strong",{className:"metric-value",children:r}),u.jsxs("span",{className:"metric-unit",children:[t.unit," ",s]})]})}function f2({sample:t}){const e=Object.values((t==null?void 0:t.equipment_states)||{});return e.length?u.jsx("div",{className:"equipment-grid",children:e.map((n,i)=>u.jsxs("div",{className:`equipment-state ${n.is_normal?"normal":"fault"}`,children:[u.jsx("span",{children:n.label||"设备状态"}),u.jsx("strong",{children:Dr($R,n.value)})]},`${n.label||"state"}-${i}`))}):u.jsx("div",{className:"equipment-grid",children:u.jsx("div",{className:"empty-state",children:"当前接口没有提供离散设备状态"})})}function h2({result:t,sample:e}){const n=(t==null?void 0:t.status)||"normal",i=(t==null?void 0:t.observations)||[];return u.jsxs("section",{className:"panel decision-panel",children:[u.jsxs("div",{className:"panel-heading",children:[u.jsxs("div",{children:[u.jsx("span",{className:"eyebrow",children:"监测判定"}),u.jsx("h2",{children:"规则引擎"})]}),u.jsx("span",{className:`severity-pill ${Gg(n)}`,children:Dr(GR,n)})]}),u.jsxs("div",{className:`decision-reason ${Gg(n)}`,children:[u.jsx("span",{children:"故障 / 预警原因"}),u.jsx("strong",{children:dy({result:t,sample:e})})]}),u.jsx(p2,{observations:i}),u.jsxs("div",{className:"threshold-note",children:[u.jsx("span",{children:"触发条件"}),u.jsx("strong",{children:"关键故障立即触发；普通指标阈值+5秒；间歇故障5分钟内3次；趋势/联合异常"})]})]})}function p2({observations:t}){return t.length?u.jsx("div",{className:"observation-list",children:t.map((e,n)=>{const i=ly(e.alert_level);return u.jsxs("div",{className:"observation",children:[u.jsx("span",{className:`observation-dot ${i}`}),u.jsxs("div",{children:[u.jsxs("div",{className:"observation-title",children:[Dr(VR,e.rule_type)," · ",cy(e),"：",e.value]}),u.jsxs("div",{className:"observation-meta",children:[e.message," · 阈值 ",e.threshold??"-"," ",e.unit||""]})]}),u.jsx("span",{className:"observation-level",children:Dr(jR,e.alert_level)})]},`${e.key||e.kind}-${n}`)})}):u.jsx("div",{className:"observation-list",children:u.jsx("div",{className:"empty-state",children:"当前没有检测到异常"})})}function uy({snapshot:t}){var e;return((e=t==null?void 0:t.diagnosis)==null?void 0:e.pipeline)||{}}function m2({snapshot:t,sample:e}){const n=QC(t,e),i=uy({snapshot:t}),r=i.runtime_result||{},s=n.status==="completed"?"已完成":n.status==="waiting"?"等待诊断":n.status,a=n.confidence==null?"--":`${Math.round(n.confidence*100)}%`,o=(e==null?void 0:e.alarm_label)||(e==null?void 0:e.alarm_code)||"当前无活动报警";return u.jsxs("section",{className:"workspace-view active module-board diagnosis-workspace","aria-label":"智能诊断",children:[u.jsx(Ya,{eyebrow:"Runtime Diagnosis",title:"智能诊断",text:"基于实时事件、知识证据和工程数据生成可追溯的诊断结论。"}),u.jsxs("div",{className:"module-grid",children:[u.jsx(Ii,{label:"诊断状态",value:s,text:n.deviceId||"等待设备"}),u.jsx(Ii,{label:"置信度",value:a,text:"Evaluator 评估结果"}),u.jsx(Ii,{label:"当前报警",value:o,text:r.stop_reason||i.stop_reason||"持续监测中"})]}),u.jsxs("div",{className:"answer-grid diagnosis-content-grid",children:[u.jsxs("section",{className:"panel module-panel",children:[u.jsx("div",{className:"panel-heading",children:u.jsxs("div",{children:[u.jsx("span",{className:"eyebrow",children:"诊断结论"}),u.jsx("h2",{children:"当前判断"})]})}),u.jsx(ri,{value:n.summary,className:"diagnosis-summary"}),n.cause&&u.jsxs("div",{className:"diagnosis-recommendation",children:[u.jsx("span",{className:"section-kicker",children:"根因判断"}),u.jsx(ri,{value:n.cause})]}),n.recommendation&&u.jsxs("div",{className:"diagnosis-recommendation",children:[u.jsx("span",{className:"section-kicker",children:"处置建议"}),u.jsx(ri,{value:n.recommendation})]}),n.nextAction&&u.jsxs("div",{className:"diagnosis-recommendation",children:[u.jsx("span",{className:"section-kicker",children:"下一步"}),u.jsx(ri,{value:n.nextAction})]})]}),u.jsxs("section",{className:"panel module-panel",children:[u.jsxs("div",{className:"panel-heading",children:[u.jsxs("div",{children:[u.jsx("span",{className:"eyebrow",children:"Evidence"}),u.jsx("h2",{children:"诊断依据"})]}),u.jsxs("span",{className:"step-count",children:[n.evidence.length," 条"]})]}),n.evidence.length?u.jsx(em,{steps:n.evidence}):u.jsx("div",{className:"empty-state",children:"等待 Runtime 收集证据"})]})]})]})}function dy(t){const e=t==null?void 0:t.result,n=(e==null?void 0:e.current_sample)||(t==null?void 0:t.sample),i=Array.isArray(e==null?void 0:e.observations)?e.observations:[],r=SR(n);return r||(i.length?i.slice(0,3).map(s=>`${s.label||cy(s)}：${s.message||"检测值异常"}`).join("；"):n!=null&&n.alarm_code?`${n.alarm_label||"设备报警"}（报警 ${n.alarm_code}）`:(e==null?void 0:e.status)==="fault"?"设备当前状态不可运行":(t==null?void 0:t.live)===!1||!(t!=null&&t.live)&&!n&&!e?"未接入实时采集，无法判断故障原因":"当前未检测到异常")}function Ih(t,e,n){var o,l,c,h,p;const i=String((e==null?void 0:e.device_id)||(n==null?void 0:n.device_id)||"").trim(),r=String((e==null?void 0:e.alarm_code)||((l=(o=n==null?void 0:n.latest_result)==null?void 0:o.current_sample)==null?void 0:l.alarm_code)||((h=(c=n==null?void 0:n.diagnosis)==null?void 0:c.latest)==null?void 0:h.alarm_code)||"").trim(),s=t.find(f=>String(f.device_id||"")===i&&r&&String(f.alarm_code||"")===r),a=t.find(f=>String(f.device_id||"")===i);return r?(s==null?void 0:s.workorder_id)||"":(a==null?void 0:a.workorder_id)||((p=t[0])==null?void 0:p.workorder_id)||""}function g2({snapshot:t}){const[e,n]=se.useState([]),[i,r]=se.useState([]),[s,a]=se.useState([]),[o,l]=se.useState("all"),[c,h]=se.useState(""),[p,f]=se.useState(""),[g,v]=se.useState(!1),[S,_]=se.useState(!1),[d,m]=se.useState(""),M=se.useRef(t);se.useEffect(()=>{M.current=t},[t]);async function y(){var N,z,k;v(!0);try{const j=await sn("/api/runs?limit=5000"),L=nR(j);n(L),h(de=>{var we;return de&&L.some(Ke=>Ke.run_id===de)?de:((we=L[0])==null?void 0:we.run_id)||""});const $=await sn("/api/trace?limit=5000&summary=true");r(jd($)),m("")}catch(j){const L=jd((k=(z=(N=M.current)==null?void 0:N.diagnosis)==null?void 0:z.pipeline)==null?void 0:k.trace);n([]),r(L),a(L),m(j.message||"日志服务暂不可用")}finally{v(!1)}}async function T(N,z=null){const k=Array.isArray(z==null?void 0:z.trace_ids)&&z.trace_ids.length?z.trace_ids:[N];if(k.some(j=>j&&!String(j).startsWith("event-"))){_(!0);try{const j=await Promise.all(k.filter(L=>L&&!String(L).startsWith("event-")).map(L=>sn(`/api/trace?trace_id=${encodeURIComponent(L)}&limit=5000`)));a(j.flatMap(L=>jd(L))),m("")}catch(j){m(j.message||"完整日志读取失败")}finally{_(!1)}}}se.useEffect(()=>{y();const N=window.setInterval(y,5e3);return()=>window.clearInterval(N)},[]);const E=e.find(N=>N.run_id===c)||null,C=(Array.isArray(E==null?void 0:E.trace_ids)?E.trace_ids.join("|"):E==null?void 0:E.trace_id)||"",x=(E==null?void 0:E.event_count)||0;se.useEffect(()=>{const N=(E==null?void 0:E.trace_id)||"";f(N),N&&T(N,E)},[c,C,x]);const b=s.filter(N=>E&&!rR(E,N)?!1:o==="all"?!0:o==="error"?!!N.error||/error|failed|timeout/i.test(String(N.event||"")):String(N.type||"").toLowerCase()===o).slice().reverse(),P=e.length,D=e.filter(N=>N.run_type==="quality").length,O=s.filter(N=>N.type==="tool"||N.tool_name||N.tool).length,F=s.filter(N=>!!N.error||/error|failed|timeout/i.test(String(N.event||""))).length,U=se.useMemo(()=>pR(s),[s]),W=N=>({completed:"已完成",running:"进行中",error:"异常",pending:"待执行"})[N]||N||"待执行";return u.jsxs("section",{className:"workspace-view active module-board logs-workspace","aria-label":"日志系统",children:[u.jsx(Ya,{eyebrow:"Runtime Logs",title:"日志系统",text:"一次完整故障闭环只形成一条运行记录：监控 → 诊断 → 维修方案 → 工单派发 → 报告中心 → 经验总结；质检始终独立成单。",action:u.jsx("button",{className:"button",type:"button",onClick:y,disabled:g,children:g?"刷新中…":"刷新运行记录"})}),d&&u.jsxs("div",{className:"workspace-notice logs-notice",role:"status",children:["日志接口暂不可用，当前显示快照中的最近记录：",d]}),u.jsxs("div",{className:"module-grid logs-stat-grid",children:[u.jsx(Ii,{label:"事件总数",value:s.length,text:"Trace Recorder 保留记录"}),u.jsx(Ii,{label:"运行记录",value:P,text:"故障闭环、RAG 问答与质检"}),u.jsx(Ii,{label:"独立质检",value:D,text:"不会并入故障闭环"}),u.jsx(Ii,{label:"工具调用",value:O,text:"含输入参数与返回体"}),u.jsx(Ii,{label:"异常事件",value:F,text:F?"需要进一步检查":"当前没有错误记录"})]}),u.jsxs("section",{className:"panel module-panel logs-panel logs-runs-panel","aria-label":"运行记录",children:[u.jsxs("div",{className:"panel-heading logs-panel-heading",children:[u.jsxs("div",{children:[u.jsx("span",{className:"eyebrow",children:"Lifecycle Runs"}),u.jsx("h2",{children:"运行记录"})]}),u.jsx("span",{className:"logs-run-hint",children:"故障从监控开始，到报告与经验总结结束"})]}),e.length?u.jsx("div",{className:"logs-runs-list",children:e.map(N=>u.jsxs("button",{type:"button",className:`logs-run-card ${c===N.run_id?"is-selected":""}`,onClick:()=>h(N.run_id),children:[u.jsxs("div",{className:"logs-run-card-head",children:[u.jsx("strong",{children:N.label||(N.run_type==="quality"?"质检运行":"运行记录")}),u.jsx("span",{className:`logs-run-status logs-run-${N.status}`,children:W(N.status)})]}),u.jsxs("div",{className:"logs-run-card-title",children:[N.device_id?Zx(N.device_id,{snapshot:t}):"未绑定设备",N.alarm_code?` · 报警 ${N.alarm_code}`:""]}),u.jsxs("div",{className:"logs-run-card-meta",children:[u.jsx("span",{children:N.started_at?ti(N.started_at):"--"}),u.jsxs("span",{children:[N.event_count||0," 个事件"]}),u.jsxs("span",{children:[N.error_count||0," 个异常"]})]}),u.jsx("div",{className:"logs-run-phases",children:(N.phases||[]).map(z=>u.jsxs("span",{className:`logs-phase logs-phase-${z.status}`,children:[u.jsx("i",{}),z.label," · ",W(z.status)]},z.id))}),u.jsx("div",{className:"logs-run-id",children:N.run_id})]},N.run_id))}):u.jsx("div",{className:"empty-state logs-empty",children:"暂无运行记录；监控确认故障或执行质检后，这里会生成生命周期记录。"})]}),u.jsxs("section",{className:"panel module-panel logs-panel","aria-label":"执行日志",children:[u.jsxs("div",{className:"panel-heading logs-panel-heading",children:[u.jsxs("div",{children:[u.jsx("span",{className:"eyebrow",children:"Execution Timeline"}),u.jsx("h2",{children:"执行明细"})]}),u.jsxs("div",{className:"logs-filter","aria-label":"日志筛选",children:[u.jsxs("select",{className:"select-input logs-trace-select",value:c,onChange:N=>h(N.target.value),"aria-label":"按运行记录筛选",children:[u.jsx("option",{value:"",children:"选择运行记录"}),e.map(N=>u.jsxs("option",{value:N.run_id,children:[N.label||"运行记录"," · ",N.run_id]},N.run_id))]}),[["all","全部"],["agent","Agent"],["tool","工具"],["runtime","运行时"],["error","异常"]].map(([N,z])=>u.jsx("button",{type:"button",className:`logs-filter-button ${o===N?"is-active":""}`,onClick:()=>l(N),children:z},N))]})]}),!S&&u.jsxs("section",{className:"agent-invocations","aria-label":"Agent调用明细",children:[u.jsxs("div",{className:"agent-invocations-heading",children:[u.jsxs("div",{children:[u.jsx("span",{className:"eyebrow",children:"Agent Invocation I/O"}),u.jsx("h3",{children:"Agent 调用明细"})]}),u.jsx("span",{className:"logs-run-hint",children:"每次调用独立编号，完整展示输入 → 上下文 → 工具 → 输出"})]}),U.length?u.jsx("div",{className:"agent-invocation-list",children:U.map(N=>u.jsxs("article",{className:`agent-invocation-card agent-invocation-${N.status==="异常"?"error":N.status==="执行中"?"running":"done"}`,children:[u.jsxs("div",{className:"agent-invocation-head",children:[u.jsxs("div",{children:[u.jsxs("span",{className:"agent-invocation-kicker",children:["第 ",N.invocation_no," 次 Agent 调用"]}),u.jsx("h4",{children:N.agent})]}),u.jsx("span",{className:"log-event-status",children:N.status})]}),u.jsxs("div",{className:"agent-invocation-meta",children:[u.jsxs("span",{children:["agent_run_id：",N.agent_run_id]}),u.jsxs("span",{children:["Trace：",N.trace_id||"--"]}),u.jsxs("span",{children:["Task：",N.task_id||"--"]}),u.jsxs("span",{children:["开始：",N.started_at?ti(N.started_at):"--"]}),u.jsxs("span",{children:["结束：",N.ended_at?ti(N.ended_at):"--"]}),u.jsxs("span",{children:["耗时：",N.duration]}),u.jsxs("span",{children:["事件：",N.event_count]})]}),N.error&&u.jsxs("div",{className:"log-event-error agent-invocation-error-text",children:["错误：",N.error]}),u.jsxs("div",{className:"agent-io-stack",children:[u.jsxs("section",{className:"agent-io-block",children:[u.jsx("h5",{children:"输入（Input）"}),u.jsx("pre",{className:"log-json",children:tr(N.input)})]}),u.jsxs("section",{className:"agent-io-block",children:[u.jsx("h5",{children:"上下文（Context）"}),u.jsx("pre",{className:"log-json",children:tr(N.context)})]}),u.jsxs("section",{className:"agent-io-block agent-tool-chain",children:[u.jsxs("h5",{children:["工具调用链（Tool Calls） · ",N.tool_calls.length," 次"]}),N.tool_calls.length?u.jsx("div",{className:"agent-tool-list",children:N.tool_calls.map(z=>u.jsxs("section",{className:"agent-tool-call",children:[u.jsxs("div",{className:"agent-tool-head",children:[u.jsxs("strong",{children:["#",z.call_no," ",z.tool_name]}),u.jsxs("span",{children:[z.status,z.mcp_server?` · MCP ${z.mcp_server}`:""," · ",z.duration]})]}),u.jsxs("div",{className:"agent-tool-meta",children:[u.jsxs("span",{children:["开始：",z.started_at?ti(z.started_at):"--"]}),u.jsxs("span",{children:["结束：",z.ended_at?ti(z.ended_at):"--"]}),u.jsxs("span",{children:["事件：",z.event_count]})]}),u.jsxs("div",{className:"agent-tool-io",children:[u.jsxs("div",{children:[u.jsx("h6",{children:"工具输入"}),u.jsx("pre",{className:"log-json",children:tr(z.input)})]}),u.jsxs("div",{children:[u.jsx("h6",{children:"工具输出"}),u.jsx("pre",{className:"log-json",children:tr(z.output)})]})]}),z.error&&u.jsxs("div",{className:"log-event-error",children:["错误：",z.error]})]},`${N.id}-${z.call_no}-${z.tool_name}`))}):u.jsx("div",{className:"agent-io-empty",children:"本次 Agent 没有记录工具调用。"})]}),u.jsxs("section",{className:"agent-io-block",children:[u.jsx("h5",{children:"输出（Output）"}),u.jsx("pre",{className:"log-json",children:tr(N.output)})]})]})]},N.id))}):u.jsx("div",{className:"empty-state logs-empty",children:"当前运行记录没有 Agent 生命周期事件；请刷新或先执行一次监控→诊断→维修方案→工单闭环。"})]}),u.jsxs("div",{className:"logs-subsection-heading",children:[u.jsx("span",{className:"eyebrow",children:"Raw Events"}),u.jsx("h3",{children:"底层事件明细"}),u.jsx("span",{children:"保留每条原始记录，便于核对调用顺序与返回体"})]}),S?u.jsx("div",{className:"empty-state logs-empty",children:"正在加载所选执行链路的完整返回体…"}):b.length?u.jsx("div",{className:"logs-list",children:b.map((N,z)=>{const k=ty(N),j=lR(N,z);return u.jsxs("article",{className:`log-event log-event-${k.status==="异常"?"error":k.status==="执行中"?"running":"done"}`,children:[u.jsxs("div",{className:"log-event-head",children:[u.jsxs("div",{className:"log-event-title",children:[u.jsx("span",{className:"log-event-index",children:b.length-z}),u.jsxs("div",{children:[u.jsx("strong",{children:k.label}),u.jsx("h3",{children:k.operation})]})]}),u.jsx("span",{className:"log-event-status",children:k.status})]}),u.jsxs("div",{className:"log-event-meta",children:[u.jsx("span",{children:N.timestamp?ti(N.timestamp):"--"}),u.jsxs("span",{children:["类型：",N.type||"--"]}),u.jsxs("span",{children:["事件：",N.event||"--"]}),u.jsxs("span",{children:["Trace：",N.trace_id||"--"]}),u.jsxs("span",{children:["Task：",N.task_id||"--"]}),k.server&&u.jsxs("span",{children:["MCP：",k.server]}),k.duration!=="--"&&u.jsxs("span",{children:["耗时：",k.duration]})]}),N.error&&u.jsxs("div",{className:"log-event-error",children:["错误：",N.error]}),u.jsx("div",{className:"log-event-details",children:oR(N).map(L=>u.jsxs("details",{className:"log-detail",open:L.key==="operation",children:[u.jsx("summary",{children:L.title}),u.jsx("pre",{className:"log-json",children:L.value})]},L.key))})]},`${j}-${z}`)})}):u.jsx("div",{className:"empty-state logs-empty",children:"暂无执行日志；触发一次诊断、知识检索或工单操作后，这里会显示完整执行链路。"})]})]})}function _2({snapshot:t}){var x;const e=uy({snapshot:t}),[n,i]=se.useState([]),[r,s]=se.useState(""),[a,o]=se.useState(""),[l,c]=se.useState(!1),[h,p]=se.useState(!1),[f,g]=se.useState(!1);async function v(){c(!0);try{const b=await sn("/api/reports");i(b.items||[]),s(P=>{var D,O;return P||((O=(D=b.items)==null?void 0:D[0])==null?void 0:O.report_id)||""}),o("")}catch(b){o(b.message)}finally{c(!1)}}se.useEffect(()=>{let b=!1;v();const P=window.setInterval(()=>{b||v()},5e3);return()=>{b=!0,window.clearInterval(P)}},[]),se.useEffect(()=>{g(!1)},[r]);const S=n.map(b=>b!=null&&b.report&&typeof b.report=="object"?b.report:b).filter(Boolean),d=S.find(b=>b.report_id===r)||S[0]||e.report||{},m=d.sections||{},M=JC(m),y=!!(d.report_id||d.title||d.summary||Object.keys(m).length),T=d.report_id?`/api/reports/${encodeURIComponent(d.report_id)}/pdf`:"";async function E(){if(d.report_id){p(!0);try{await sn(`/api/reports/${encodeURIComponent(d.report_id)}/pdf`,{method:"POST",body:JSON.stringify({})}),g(!0),o("")}catch(b){o(`PDF 生成失败：${b.message}`)}finally{p(!1)}}}async function C(b){var P;if(!(!b||!window.confirm(`确定删除报告 ${b} 吗？删除后不可恢复。`)))try{await sn(`/api/reports/${encodeURIComponent(b)}`,{method:"DELETE"});const D=S.filter(O=>O.report_id!==b);i(D),s(((P=D[0])==null?void 0:P.report_id)||""),g(!1),o("")}catch(D){o(D.message)}}return u.jsxs("section",{className:"workspace-view active module-board report-workspace","aria-label":"报告中心",children:[u.jsx(Ya,{eyebrow:"Report Agent",title:"报告中心",text:"汇总诊断、维修方案、工单和质检结果，形成可追溯运维报告。",action:u.jsx("button",{className:"button",type:"button",onClick:v,disabled:l,children:l?"刷新中…":"刷新报告"})}),a&&u.jsxs("div",{className:"inline-error",role:"status",children:["报告服务暂不可用：",a]}),u.jsxs("section",{className:"panel module-panel report-list-panel","aria-label":"已持久化报告列表",children:[u.jsx("div",{className:"panel-heading",children:u.jsxs("div",{children:[u.jsxs("span",{className:"eyebrow",children:["持久化记录 · ",S.length," 份"]}),u.jsx("h2",{children:"报告列表"})]})}),S.length?u.jsx("div",{className:"report-list",children:S.map(b=>u.jsxs("div",{className:`report-list-item ${b.report_id===d.report_id?"is-selected":""}`,children:[u.jsxs("button",{type:"button",className:"report-list-select",onClick:()=>s(b.report_id),children:[u.jsx("strong",{children:b.title||"运维报告"}),u.jsxs("span",{children:[b.report_id," · ",ti(b.created_at||b.updated_at)]})]}),u.jsx("button",{type:"button",className:"button danger-button",onClick:()=>C(b.report_id),children:"删除"})]},b.report_id))}):u.jsx("div",{className:"empty-state",children:"暂无持久化报告"})]}),y?u.jsxs(u.Fragment,{children:[u.jsxs("div",{className:"module-grid",children:[u.jsx(Ii,{label:"报告编号",value:d.report_id||"--",text:d.report_type||"运维报告"}),u.jsx(Ii,{label:"生成时间",value:d.created_at||d.updated_at?ti(d.created_at||d.updated_at):"--",text:`${n.length||1} 份已持久化报告`}),u.jsx(Ii,{label:"质量状态",value:((x=m.quality)==null?void 0:x.passed)==null?"待确认":m.quality.passed?"通过":"未通过",text:"质量协同结果"})]}),u.jsxs("section",{className:"panel module-panel report-panel",children:[u.jsxs("div",{className:"panel-heading",children:[u.jsxs("div",{children:[u.jsx("span",{className:"eyebrow",children:"报告摘要"}),u.jsx("h2",{children:d.title||"运维报告"})]}),u.jsxs("div",{className:"report-file-actions",children:[u.jsx("button",{className:"button",type:"button",onClick:E,disabled:!d.report_id||h,children:h?"生成中…":"生成 PDF"}),f&&u.jsxs(u.Fragment,{children:[u.jsx("a",{className:"button",href:T,target:"_blank",rel:"noreferrer",children:"打开 PDF"}),u.jsx("a",{className:"button",href:`${T}?download=1`,download:`report-${d.report_id}.pdf`,children:"下载 PDF"})]})]})]}),u.jsx(ri,{value:nn(d.summary)||"暂无摘要",className:"answer-summary"}),M.length>0&&u.jsx(R2,{sections:M})]})]}):u.jsx(fy,{eyebrow:"报告队列",title:"暂无可查看的报告",text:"完成异常诊断、维修与质检闭环后，报告会自动汇总在这里。"})]})}function v2({snapshot:t,sample:e}){var E;const[n,i]=se.useState([]),[r,s]=se.useState(""),[a,o]=se.useState(""),l=Yp(t,e),c=Kp(t,e,l),h=c?l:{},p=c?ZC(t,e):{},f=(p==null?void 0:p.maintenance_plan)||{},g=String((e==null?void 0:e.alarm_code)||(h==null?void 0:h.alarm_code)||"").trim(),v=String((e==null?void 0:e.device_id)||(t==null?void 0:t.device_id)||"").trim(),S=!!(e!=null&&e.alarm_code)&&["alarm","fault","warning"].includes(String((e==null?void 0:e.status)||"").toLowerCase()),_=!!(g||Object.keys(h).length),d=n.find(C=>C.workorder_id===r)||(_?void 0:n[0]),m=!!d&&String(d.device_id||"")===v&&(!g||String(d.alarm_code||"")===g)&&Object.keys(h).length>0,M=!d&&Object.keys(h).length>0&&!!(f.plan_id||(E=f.repair_steps)!=null&&E.length),y=qC({order:d||{},plan:m||M?f:{},diagnosis:m||M?h:{}});se.useEffect(()=>{let C=!1;return sn("/api/workorders").then(x=>{if(C)return;const b=(x.items||[]).map(Dh);i(b),s(P=>P||Ih(b,e,t)),o("")}).catch(x=>{C||o(x.message)}),()=>{C=!0}},[]);function T(){const C=new URLSearchParams(window.location.search);C.set("view","workorder"),window.history.pushState({view:"workorder"},"",`${window.location.pathname}?${C.toString()}`),window.dispatchEvent(new PopStateEvent("popstate"))}return u.jsxs("section",{className:"workspace-view active maintenance-workspace","aria-label":"维修方案",children:[u.jsx(Ya,{eyebrow:"Maintenance Agent",title:"维修方案",text:"独立承载故障分析、维修步骤、工具、备件与 Evidence；工单只负责执行反馈。",action:u.jsx("button",{className:"button primary",type:"button",onClick:T,children:"进入工单执行"})}),a&&u.jsxs("div",{className:"inline-error",role:"status",children:["维修方案服务暂不可用：",a]}),u.jsxs("section",{className:"workorder-queue maintenance-plan-queue","aria-label":"方案关联工单",children:[u.jsxs("div",{className:"workorder-queue-heading",children:[u.jsxs("div",{children:[u.jsx("span",{className:"eyebrow",children:"方案关联"}),u.jsx("h2",{children:"选择工单查看维修方案"})]}),u.jsxs("span",{children:[n.length," 条记录"]})]}),n.length?u.jsx("div",{className:"workorder-queue-list",children:n.map(C=>u.jsxs("button",{type:"button",className:`workorder-queue-item ${(d==null?void 0:d.workorder_id)===C.workorder_id?"is-selected":""}`,onClick:()=>s(C.workorder_id),children:[u.jsxs("span",{children:[u.jsx("strong",{children:Ru(C,C.repair_target,{snapshot:t})}),u.jsxs("small",{children:[C.workorder_id," · ",C.device_id]})]}),u.jsx("em",{children:Dr(Pu,C.status)})]},C.workorder_id))}):u.jsx(fy,{eyebrow:"维修方案",title:"暂无关联工单",text:"完成诊断并生成工单后，维修方案会在这里显示。"})]}),_&&!d&&u.jsxs("div",{className:"workspace-notice",role:"status",children:[S?`当前报警 ${g}`:`最新诊断报警 ${g}`," 尚未关联工单；下方显示的是诊断阶段生成的维修方案，请先完成工单派发。"]}),(d||M)&&u.jsx(S2,{plan:y,hasCurrentDiagnosis:m||M})]})}function x2({snapshot:t,sample:e,onClosed:n,actor:i}){var P,D,O;const[r,s]=se.useState([]),[a,o]=se.useState(""),[l,c]=se.useState("维修一组"),[h,p]=se.useState(""),[f,g]=se.useState(!1),v=Yp(t,e),S=Kp(t,e,v)?v:{},_=e||((P=t==null?void 0:t.latest_result)==null?void 0:P.current_sample)||((O=(D=t==null?void 0:t.devices)==null?void 0:D.find(F=>F.device_id===(t==null?void 0:t.device_id)))==null?void 0:O.current_sample)||{},d=String((_==null?void 0:_.alarm_code)||"").trim(),m=String((_==null?void 0:_.status)||"").toLowerCase(),M=!!d&&["alarm","fault","warning"].includes(m),y=d||String((S==null?void 0:S.alarm_code)||"").trim(),T=!!y,E=r.find(F=>F.workorder_id===a)||(T?void 0:r[0]);async function C(){try{const U=((await sn("/api/workorders")).items||[]).map(Dh);return s(W=>U.map(N=>{var z;return{...N,machine_control:((z=W.find(k=>k.workorder_id===N.workorder_id))==null?void 0:z.machine_control)||N.machine_control}})),o(W=>U.some(N=>N.workorder_id===W)?W:Ih(U,e,t)),p(""),U}catch(F){return p(F.message),[]}}se.useEffect(()=>{C(),window.scrollTo({top:0,left:0,behavior:"auto"});const F=window.setInterval(C,5e3);return()=>window.clearInterval(F)},[]);async function x(F,U={}){if(E){g(!0);try{const W=F==="closed"?"close":F==="completed"?"mark_repair_completed":"update",N=await sn(`/api/workorders/${E.workorder_id}/action`,{method:"POST",body:JSON.stringify({action:W,status:F,assignee:l,...U})}),z=Dh(N);N.machine_control&&(z.machine_control=N.machine_control),s(k=>k.map(j=>j.workorder_id===z.workorder_id?z:j)),p(""),F==="closed"&&(n==null||n())}catch(W){p(W.message)}finally{g(!1)}}}async function b(F){if(!(!(F!=null&&F.workorder_id)||!window.confirm(`确定删除工单 ${F.workorder_id} 吗？删除后不可恢复。`))){g(!0);try{await sn(`/api/workorders/${encodeURIComponent(F.workorder_id)}`,{method:"DELETE"});const U=r.filter(W=>W.workorder_id!==F.workorder_id);s(U),o(Ih(U,e,t)),p("")}catch(U){p(U.message)}finally{g(!1)}}}return u.jsxs("section",{className:"workspace-view active workorder-page","aria-label":"工单系统",children:[!M&&u.jsxs("div",{className:"module-hero",children:[u.jsx("span",{className:"eyebrow",children:"维修执行"}),u.jsx("h1",{children:"工单系统"}),u.jsx("p",{children:"跟进维修任务、执行反馈与验收。"})]}),u.jsxs("section",{className:"workorder-queue","aria-label":"工单队列",children:[u.jsxs("div",{className:"workorder-queue-heading",children:[u.jsxs("div",{children:[u.jsx("span",{className:"eyebrow",children:"工单队列"}),u.jsx("h2",{children:"维修任务"})]}),u.jsxs("span",{children:[r.length," 条记录"]})]}),r.length?u.jsx("div",{className:"workorder-queue-list",children:r.map(F=>u.jsxs("button",{type:"button",className:`workorder-queue-item ${(E==null?void 0:E.workorder_id)===F.workorder_id?"is-selected":""}`,onClick:()=>o(F.workorder_id),children:[u.jsxs("span",{children:[u.jsx("strong",{children:Ru(F,F.repair_target,{snapshot:t})}),u.jsxs("small",{children:[F.workorder_id," · ",F.device_id]})]}),u.jsx("em",{className:F.status==="closed"||F.status==="completed"?"is-done":"",children:Dr(Pu,F.status)})]},F.workorder_id))}):u.jsx("div",{className:"workorder-queue-empty",children:"暂无工单；监控发现异常后会自动生成，或从当前故障创建工单。"})]}),T&&!E&&u.jsxs("div",{className:"workspace-notice",role:"status",children:[M?`当前报警 ${y}`:`最新诊断报警 ${y}`," 尚未关联工单；列表中的记录为历史工单，请先完成工单派发。"]}),u.jsx(y2,{order:E||null,sample:e,snapshot:t,diagnosis:S,busy:f,error:h,onUpdate:x,onDelete:b,readOnly:(i==null?void 0:i.role)!=="technician"})]})}function y2({order:t,sample:e,snapshot:n,diagnosis:i={},busy:r,error:s,onUpdate:a,onDelete:o,readOnly:l=!1}){var y,T;if(se.useEffect(()=>{window.scrollTo({top:0,left:0,behavior:"auto"})},[t==null?void 0:t.workorder_id]),!t)return u.jsx("section",{className:"workorder-empty-shell",children:u.jsxs("div",{className:"workorder-empty-content",children:[u.jsx("span",{className:"workorder-empty-icon","aria-hidden":"true",children:"□"}),u.jsx("span",{className:"eyebrow",children:"工单队列"}),u.jsx("h2",{children:"当前没有待处理工单"}),u.jsx("p",{children:"虚拟工厂触发故障后，维修工单会自动派发并显示在这里。"}),s&&u.jsx("div",{className:"inline-error",role:"alert",children:s})]})});const c=String((i==null?void 0:i.device_id)||"")===String(t.device_id||""),h=String((i==null?void 0:i.alarm_code)||"")===String(t.alarm_code||""),p=c&&h,f=t.diagnosis_context&&typeof t.diagnosis_context=="object"?t.diagnosis_context:{},g=p?i:f,v=String((e==null?void 0:e.device_id)||"")===String(t.device_id||"")&&String((e==null?void 0:e.alarm_code)||"")===String(t.alarm_code||"")?e:{},S=Array.isArray(n==null?void 0:n.devices)?n.devices.find(E=>String((E==null?void 0:E.device_id)||"")===String(t.device_id||"")):null,_=((T=(y=n==null?void 0:n.latest_results)==null?void 0:y[t.device_id])==null?void 0:T.current_sample)||(S==null?void 0:S.current_sample)||(String((e==null?void 0:e.device_id)||"")===String(t.device_id||"")?e:{}),d=WR(t,v),m=KC({order:t,target:d,diagnosis:g,context:{snapshot:n,sample:v,recoverySample:_}}),M=Dr(Pu,t.status);return u.jsxs("section",{className:"workorder-detail-page",children:[u.jsxs("header",{className:"workorder-titlebar",children:[u.jsxs("div",{children:[u.jsx("span",{className:"eyebrow",children:"维修工单详情"}),u.jsx("h1",{children:Ru(t,d,{snapshot:n,sample:v,fault:g.fault||g.summary})}),u.jsxs("p",{children:[t.workorder_id," · ",t.device_id," · ",t.assignee||"未分配"," · ",ti(t.updated_at)]})]}),u.jsxs("div",{className:"workorder-titlebar-actions",children:[u.jsx("span",{className:`workorder-status-badge ${t.status==="closed"||t.status==="completed"?"done":"pending"}`,children:M}),u.jsx("button",{className:"button danger-button",type:"button",disabled:r||l||!["open","rejected","timeout"].includes(t.status),onClick:()=>o==null?void 0:o(t),children:"删除工单"})]})]}),u.jsx("div",{className:"workorder-bigscreen-grid cad-only",children:u.jsx(w2,{order:t,target:d})}),u.jsx(E2,{sheet:m,busy:r,error:s,onUpdate:a,readOnly:l})]})}function S2({plan:t,hasCurrentDiagnosis:e}){const n=t.diagnosis||{},i=(t.evidence||[]).map(s=>typeof s=="string"?s:s.title||s.content||s.evidence_text||s.source||s.document_id||s.component_id||"维修证据").filter(Boolean),r=t.source==="maintenance-plan"?"独立维修方案":t.source==="legacy-workorder-snapshot"?"历史工单方案快照":"未关联维修方案";return u.jsxs("section",{className:"maintenance-plan-panel","aria-label":"维修方案",children:[u.jsxs("div",{className:"maintenance-plan-heading",children:[u.jsxs("div",{children:[u.jsx("span",{className:"eyebrow",children:"Maintenance Plan"}),u.jsx("h2",{children:"维修方案"}),u.jsx("p",{children:"由 Diagnosis Agent → Maintenance Agent 生成，工单仅引用并负责执行。"})]}),u.jsxs("div",{className:"maintenance-plan-meta",children:[u.jsx("span",{children:r}),t.planId&&u.jsx("strong",{children:t.planId})]})]}),t.source==="unavailable"?u.jsx("div",{className:"maintenance-plan-empty",children:"当前工单没有可读取的维修方案。故障定位仍保留在下方工单详情中，不会用工单字段伪造维修方案。"}):u.jsxs(u.Fragment,{children:[u.jsxs("div",{className:"maintenance-plan-diagnosis",children:[u.jsxs("div",{children:[u.jsx("span",{children:"故障分析"}),u.jsx("strong",{children:n.fault||n.summary||"待确认"}),u.jsx("p",{children:n.cause||n.diagnosis||"暂无原因分析"})]}),u.jsxs("div",{children:[u.jsx("span",{children:"建议与风险"}),u.jsx("strong",{children:n.recommendation||"按方案步骤执行并复测"}),u.jsxs("p",{children:[n.severity||t.riskLevel||"风险等级待确认",t.estimatedTime?` · 预计 ${t.estimatedTime}`:"",e?" · 当前诊断":" · 工单记录"]})]})]}),u.jsxs("div",{className:"maintenance-plan-grid",children:[u.jsx(oc,{title:"维修步骤",items:t.steps,ordered:!0}),u.jsx(oc,{title:"工具与备件",items:[...t.tools.map(s=>`工具：${s}`),...t.parts.map(s=>`备件：${s}`)]}),u.jsx(oc,{title:"安全与检查",items:[...t.safety,...t.preChecks,...t.postChecks]}),u.jsx(oc,{title:"Evidence 维修证据",items:i})]})]})]})}function oc({title:t,items:e=[],ordered:n=!1}){const i=e.filter(Boolean);return u.jsxs("section",{className:"maintenance-plan-section",children:[u.jsxs("div",{className:"maintenance-plan-section-head",children:[u.jsx("h3",{children:t}),u.jsxs("span",{children:[i.length," 项"]})]}),i.length?n?u.jsx("ol",{children:i.map((r,s)=>u.jsx("li",{children:u.jsx(ri,{value:r})},`${r}-${s}`))}):u.jsx("ul",{children:i.map((r,s)=>u.jsx("li",{children:u.jsx(ri,{value:r})},`${r}-${s}`))}):u.jsx("p",{className:"maintenance-plan-muted",children:"暂无记录"})]})}function M2(t={},e={}){var i;const n=[t.device_id,(i=t.drawing_context)==null?void 0:i.drawing_url,e.component,e.part_name].filter(Boolean).join(" ").toLowerCase();return n.includes("qls80")||n.includes("ql-servo")||n.includes("lns")?"/drawings/QLS80S2.html":n.includes("equator")||n.includes("renishaw")?"/drawings/Equator300.html":n.includes("tc820")||n.includes("trak")||n.includes("lubrication-pump")||n.includes("cooling-pump")?"/drawings/TC820si.html":""}function E2({sheet:t,busy:e,error:n,onUpdate:i,readOnly:r=!1}){const[s,a]=se.useState(""),[o,l]=se.useState(!1);se.useEffect(()=>{l(!1)},[t.workorderId]);const c=["completed","closed"].includes(t.status);return["in_progress","completed","closed"].includes(t.status),u.jsxs("section",{className:"maintenance-sheet","aria-label":"自动派发维修工单",children:[u.jsxs("div",{className:"sheet-heading",children:[u.jsxs("div",{children:[u.jsx("span",{className:"eyebrow",children:"自动派发工单"}),u.jsx("h2",{children:"维修工单"}),u.jsx("p",{className:"sheet-subtitle",children:"故障确认后由系统自动派出，维修人员按维修方案执行并提交反馈。"})]}),u.jsx("span",{className:c?"sheet-status done":"sheet-status",children:Dr(Pu,t.status)})]}),u.jsxs("div",{className:"basic-grid",children:[u.jsxs("div",{children:[u.jsx("span",{children:"工单编号"}),u.jsx("strong",{children:t.workorderId||"--"})]}),u.jsxs("div",{children:[u.jsx("span",{children:"设备"}),u.jsx("strong",{children:t.deviceId||"--"})]}),u.jsxs("div",{children:[u.jsx("span",{children:"处理班组"}),u.jsx("strong",{children:t.assignee})]}),u.jsxs("div",{children:[u.jsx("span",{children:"派发方式"}),u.jsx("strong",{children:t.autoDispatched?"系统自动派发":"系统工单"})]})]}),u.jsxs("div",{className:"sheet-execution-grid",children:[u.jsxs("section",{className:"sheet-section fault-summary-card",children:[u.jsx("span",{className:"section-kicker",children:"故障信息"}),u.jsx("h3",{children:t.title}),u.jsxs("div",{className:"fault-meta-list",children:[u.jsxs("span",{children:["故障部件：",t.partName]}),u.jsxs("span",{children:["料号：",t.partNo]}),u.jsxs("span",{children:["所属系统：",t.system]}),u.jsxs("span",{children:["位置：",t.location]})]}),u.jsx(ri,{value:`故障表现：${t.faultSymptom}`,className:"fault-symptom"})]}),u.jsxs("section",{className:"sheet-section feedback-card",children:[u.jsx("div",{className:"sheet-subhead",children:u.jsxs("div",{children:[u.jsx("span",{className:"section-kicker",children:"WorkOrder 执行反馈"}),u.jsx("h3",{children:"完成后提交结果"})]})}),u.jsx("label",{htmlFor:"repair-feedback",children:"处理说明"}),u.jsx("textarea",{id:"repair-feedback",value:s,onChange:h=>a(h.target.value),placeholder:"填写处理结果、复测数据或未解决原因",disabled:r||t.status==="closed"}),n&&u.jsx("div",{className:"inline-error",children:n}),t.machineControl&&u.jsx("div",{className:`machine-control-result ${t.machineControl.state==="running"?"is-ok":"is-error"}`,role:"status",children:t.machineControl.state==="running"?"整线设备启动后已逐台读回，运行复核通过。":`整线尚未恢复运行：${t.machineControl.reason||t.machineControl.error||t.machineControl.state}`}),u.jsxs("label",{className:"maintenance-confirmation",children:[u.jsx("input",{type:"checkbox",checked:o,onChange:h=>l(h.target.checked),disabled:e||r||t.status==="closed"}),u.jsx("span",{children:"我确认已完成维修并依据当前设备恢复数据复测，允许申请恢复运行"})]}),u.jsxs("div",{className:"sheet-actions",children:[u.jsx("button",{className:"button",type:"button",disabled:e||r||c||t.accepted,onClick:()=>i("in_progress"),children:e?"处理中":t.accepted?"已确认接单":"确认接单"}),u.jsx("button",{className:"button primary",type:"button",disabled:e||r||t.status==="closed"||c&&t.verificationPhase==="poststart"||!s.trim()||!o,onClick:()=>i("completed",YC({feedback:s,operator:t.assignee,deviceId:t.deviceId,recoverySample:t.recoverySample,maintenanceConfirmedBy:t.assignee})),children:c?"再次确认并申请复机":"确认维修完成并申请复机"}),t.status==="completed"&&t.verificationPhase==="poststart"&&u.jsx("button",{className:"button",disabled:e||r,onClick:()=>i("closed"),children:"关闭工单并生成总结"})]})]})]})]})}function w2({order:t,target:e}){const[n,i]=se.useState(null),[r,s]=se.useState(""),a=se.useRef(null),o=e.component||e.part_no||e.part_name||"",l=M2(t,e);se.useEffect(()=>{let h=!1;if(i(null),s(""),!!o)return sn(`/api/cad/resolve?component=${encodeURIComponent(o)}&part_no=${encodeURIComponent(e.part_no||"")}&device_id=${encodeURIComponent((t==null?void 0:t.device_id)||"")}`).then(p=>{h||i(p)}).catch(p=>{h||s(p.message)}),()=>{h=!0}},[o,e.part_no,t==null?void 0:t.device_id]);function c(){var h,p;(p=(h=a.current)==null?void 0:h.requestFullscreen)==null||p.call(h)}return u.jsxs("section",{className:"repair-visual-panel","aria-label":"3D 故障定位",children:[u.jsxs("div",{className:"repair-visual-head",children:[u.jsxs("div",{children:[u.jsx("span",{className:"eyebrow",children:"3D 故障定位"}),u.jsx("h2",{children:e.part_name}),u.jsxs("p",{children:[e.location," · 工单目标：",o]})]}),u.jsx("div",{className:"repair-visual-actions",children:u.jsx("button",{className:"button ghost-button",type:"button",onClick:c,children:"全屏"})})]}),u.jsx("div",{className:"repair-visual-body",children:u.jsxs("div",{className:"repair-cad-scene",ref:a,"aria-label":"CAD 结构定位视图",children:[l?u.jsx("iframe",{className:"repair-drawing-frame",title:`${e.part_name||(t==null?void 0:t.device_id)||"设备"} 工单图纸`,src:l}):u.jsxs("div",{className:"cad-scene-status is-error",children:[u.jsx("strong",{children:"未匹配到工单图纸"}),u.jsxs("span",{children:["当前设备：",(t==null?void 0:t.device_id)||"未知"]}),u.jsx("small",{children:"没有可确认的机器图纸，不显示虚构模型。"})]}),r&&u.jsxs("div",{className:"cad-scene-status is-error repair-cad-notice",children:[u.jsx("strong",{children:"CAD 部件关系暂不可用"}),u.jsx("span",{children:r}),u.jsx("small",{children:"工单图纸仍保留；部件定位请以图纸和现场核验为准。"})]}),(n==null?void 0:n.part)&&u.jsxs("div",{className:"cad-scene-status repair-cad-notice",children:[u.jsxs("strong",{children:["已匹配：",n.part.name," · ",n.part.part_no]}),u.jsx("span",{children:n.part.position}),u.jsxs("small",{children:["CAD 来源：",n.source,"。图纸为本工单对应机器的真实离线查看器。"]})]})]})})]})}function T2({snapshot:t,sample:e,messages:n,setMessages:i}){const[r,s]=se.useState(""),[a,o]=se.useState(null),[l,c]=se.useState(""),[h,p]=se.useState(!1),f=se.useRef(null),g=se.useRef(new Set);async function v(){try{o(await sn("/api/rag/status")),c("")}catch(m){c(m.message)}}se.useEffect(()=>{v()},[]),se.useEffect(()=>{const m=f.current;m&&(m.scrollTop=m.scrollHeight)},[n]);function S(){return n.filter(m=>!m.pending).slice(-6).flatMap(m=>{var y,T;const M=Lg(m.answer)||nn((T=(y=m.answer)==null?void 0:y.report)==null?void 0:T.summary)||"";return[{role:"user",content:m.question},...M?[{role:"assistant",content:M}]:[]]}).slice(-12)}async function _(m=r,M=""){const y=m.trim();if(!y||h)return;const T=M||`${Date.now()}-${Math.random().toString(36).slice(2,8)}`;i(x=>M?x.map(b=>b.id===M?{...b,question:y,pending:!0,answer:null,agentError:""}:b):[...x,{id:T,question:y,pending:!0}]),s(""),p(!0);let E=null,C="";try{E=await sn("/api/agent/question/summary",{method:"POST",body:JSON.stringify({user_text:y,context:{...tR(e,t),conversation_history:S()}})})}catch(x){C=String((x==null?void 0:x.message)||x)}i(x=>x.map(b=>b.id===T?{...b,pending:!1,answer:E,agentError:C}:b)),p(!1)}se.useEffect(()=>{if(h)return;const m=n.find(M=>Fg(M)&&!g.current.has(M.id));m&&(g.current.add(m.id),_(m.question,m.id))},[n,h]);function d(m){m.key==="Enter"&&!m.shiftKey&&!m.nativeEvent.isComposing&&(m.preventDefault(),_())}return u.jsxs("section",{className:"workspace-view active module-board rag-workspace rag-chat","aria-label":"RAG知识问答",children:[u.jsx(Ya,{eyebrow:"RAG 知识中枢",title:"维修知识问答",text:"围绕设备故障、报警码与 SOP 连续提问；回答只展示模型生成的正文。"}),u.jsxs("div",{className:"rag-chat-shell",children:[u.jsxs("div",{className:"rag-chat-toolbar",children:[u.jsxs("div",{children:[u.jsx("span",{className:"rag-chat-status-dot"}),u.jsx("strong",{children:"知识助手"}),u.jsxs("span",{children:["· ",(a==null?void 0:a.backend)||"检索服务待确认"]})]}),u.jsxs("div",{children:[u.jsxs("span",{children:["知识记录 ",(a==null?void 0:a.record_count)??"--"]}),u.jsxs("span",{children:["本次对话 ",n.filter(m=>!m.pending).length," 轮"]}),u.jsx("button",{className:"button",type:"button",onClick:()=>i([]),disabled:!n.length||h,children:"清空对话"}),u.jsx("button",{className:"button",type:"button",onClick:v,children:"刷新状态"})]})]}),l&&u.jsxs("div",{className:"rag-chat-status-error",role:"status",children:["知识库状态暂不可用：",l]}),u.jsx("div",{className:"rag-chat-messages",ref:f,role:"log","aria-label":"知识问答对话","aria-live":"polite",children:n.length===0?u.jsxs("div",{className:"rag-chat-welcome",children:[u.jsx("span",{className:"rag-chat-welcome-mark","aria-hidden":"true",children:"IA"}),u.jsx("h2",{children:"有什么设备问题需要排查？"}),u.jsx("p",{children:"可以询问报警含义、维修步骤或 SOP；回答只展示模型生成的正文。"})]}):n.map(m=>{var b,P,D,O,F;const M=((b=m.answer)==null?void 0:b.report)||{},y=((P=m.answer)==null?void 0:P.knowledge)||{},T=Lg(m.answer)||nn(M.summary),E=((D=m.answer)==null?void 0:D.route)==="report"||((F=(O=m.answer)==null?void 0:O.route_result)==null?void 0:F.intent)==="report",C=Fg(m),x=y.retrieval_scope==="device"?"当前报警机器优先":y.retrieval_scope==="all"?"全库检索":"检索范围待确认";return u.jsxs("div",{className:"rag-chat-turn",children:[u.jsxs("div",{className:"rag-chat-row is-user",children:[u.jsx("span",{className:"rag-chat-avatar",children:"你"}),u.jsx("div",{className:"rag-chat-bubble",children:m.question})]}),u.jsxs("div",{className:"rag-chat-row is-assistant",children:[u.jsx("span",{className:"rag-chat-avatar",children:"IA"}),u.jsx("div",{className:"rag-chat-bubble",children:m.pending?u.jsx("p",{className:"rag-chat-pending",children:"正在检索并整理回答…"}):u.jsxs(u.Fragment,{children:[E&&u.jsx("span",{className:"rag-chat-result-tag",children:"路由至报告流程 · 非知识回答"}),!m.agentError&&y.retrieval_scope&&u.jsxs("span",{className:`rag-chat-scope-tag ${y.retrieval_scope}`,children:[x,y.retrieval_fallback?" · 已扩大到全库":""]}),M.title&&u.jsx("h3",{children:M.title}),u.jsx(ri,{value:T||(m.agentError?"问答服务暂不可用，本次未生成回答。":C?"正在重新整理这条历史问题的中文答案…":"暂未找到直接相关知识，请补充设备编号、报警码或故障现象。")}),m.agentError&&u.jsx(ri,{value:`问答服务异常：${m.agentError}`,className:"rag-chat-error"})]})})]})]},m.id)})}),u.jsxs("div",{className:"rag-chat-composer",children:[u.jsx("div",{className:"rag-chat-suggestions",children:XR.map(m=>u.jsx("button",{className:"button",type:"button",disabled:h,onClick:()=>_(m),children:m},m))}),u.jsxs("form",{onSubmit:m=>{m.preventDefault(),_()},children:[u.jsx("textarea",{className:"qa-input",value:r,onChange:m=>s(m.target.value),onKeyDown:d,placeholder:"输入设备维修、SOP 或报警码问题…","aria-label":"维修知识问题"}),u.jsxs("div",{className:"rag-chat-composer-actions",children:[u.jsx("span",{children:"Enter 发送 · Shift+Enter 换行"}),u.jsx("button",{className:"button primary",type:"submit",disabled:h||!r.trim(),children:h?"回答中…":"发送问题"})]})]})]})]})]})}function b2({snapshot:t,sample:e}){const[n,i]=se.useState("PART-001"),[r,s]=se.useState(null),[a,o]=se.useState([]),[l,c]=se.useState(""),[h,p]=se.useState(!1),[f,g]=se.useState([]);async function v(){try{const _=await sn("/api/experience/search",{method:"POST",body:JSON.stringify({device_id:(e==null?void 0:e.device_id)||(t==null?void 0:t.device_id)||"",limit:8})});o(_.items||[]);const d=await sn(`/api/v1/quality/checks?target_id=${encodeURIComponent(n.trim())}`);g(d.items||[]),c("")}catch(_){c(_.message)}}se.useEffect(()=>{v()},[]);async function S(){if(n.trim()){p(!0);try{const _=await sn(`/api/quality/parts/${encodeURIComponent(n.trim())}`,{method:"POST",body:"{}"});s(_),g(d=>_.quality_check_id&&!d.some(m=>m.quality_check_id===_.quality_check_id)?[{quality_check_id:_.quality_check_id,target_id:n.trim(),result:_.status,score:_.score,created_at:_.checked_at},...d]:d),await v(),c("")}catch(_){c(_.message)}finally{p(!1)}}}return u.jsxs("section",{className:"workspace-view active module-board quality-workspace","aria-label":"质检系统",children:[u.jsx(Ya,{eyebrow:"QMS 质检系统",title:"生产零件质量检测",text:"对生产完成的零件执行尺寸、外观、材料、功能和工艺追溯检测。"}),u.jsxs("div",{className:"ops-grid quality-primary-grid",children:[u.jsxs("section",{className:"panel module-panel",children:[u.jsx("div",{className:"panel-heading",children:u.jsxs("div",{children:[u.jsx("span",{className:"eyebrow",children:"检测任务"}),u.jsx("h2",{children:"输入零件编号"})]})}),u.jsx("label",{className:"field-label",htmlFor:"quality-part-id",children:"生产零件编号"}),u.jsx("input",{id:"quality-part-id",className:"select-input",value:n,onChange:_=>i(_.target.value),placeholder:"例如 PART-001"}),u.jsx("div",{className:"action-row",children:u.jsx("button",{className:"button primary",type:"button",disabled:h||!n.trim(),onClick:S,children:h?"检测中":"执行质量检测"})}),l&&u.jsx("div",{className:"inline-error",children:l})]}),u.jsxs("section",{className:"panel module-panel",children:[u.jsxs("div",{className:"panel-heading",children:[u.jsxs("div",{children:[u.jsx("span",{className:"eyebrow",children:"最近结果"}),u.jsx("h2",{children:r?r.qualified?"零件合格":"零件不合格":"等待检测"})]}),r&&u.jsx("span",{className:`severity-pill ${r.qualified?"normal":"fault"}`,children:r.qualified?"合格":"不合格"})]}),r?u.jsx(A2,{quality:r}):u.jsx("div",{className:"empty-state",children:"输入生产零件编号后，系统会返回尺寸、外观、材料、功能和工艺检测结果。"})]})]}),u.jsxs("section",{className:"answer-grid quality-experience-grid",children:[u.jsxs("div",{className:"panel module-panel",children:[u.jsxs("div",{className:"panel-heading",children:[u.jsxs("div",{children:[u.jsxs("span",{className:"eyebrow",children:["经验库 · ",a.length," 条"]}),u.jsx("h2",{children:"相关维修经验"})]}),u.jsx("button",{className:"button",type:"button",onClick:v,children:"刷新经验"})]}),u.jsx(C2,{items:a})]}),u.jsxs("div",{className:"panel module-panel",children:[u.jsx("div",{className:"panel-heading",children:u.jsxs("div",{children:[u.jsxs("span",{className:"eyebrow",children:["真实记录 · ",f.length," 条"]}),u.jsx("h2",{children:"质检历史"})]})}),f.length?u.jsx("div",{className:"document-list",children:f.map(_=>u.jsxs("article",{children:[u.jsx("strong",{children:_.quality_check_id}),u.jsxs("span",{children:[_.target_id||n," · ",_.result||"待确认"," · ",ti(_.created_at)]})]},_.quality_check_id))}):u.jsx("div",{className:"empty-state",children:"完成检测后，质检记录会写入后端并显示在这里。"})]})]})]})}function Ya({eyebrow:t,title:e,text:n,action:i=null}){return u.jsxs("header",{className:"module-hero",children:[u.jsxs("div",{children:[u.jsx("span",{className:"eyebrow",children:t}),u.jsx("h1",{children:e}),u.jsx("p",{children:n})]}),i&&u.jsx("div",{className:"module-hero-action",children:i})]})}function fy({eyebrow:t,title:e,text:n}){return u.jsxs("div",{className:"workspace-empty",children:[u.jsx("span",{className:"workspace-empty-mark","aria-hidden":"true",children:"—"}),u.jsx("span",{className:"eyebrow",children:t}),u.jsx("h2",{children:e}),u.jsx("p",{children:n})]})}function Ii({label:t,value:e,text:n}){return u.jsxs("div",{className:"module-card",children:[u.jsx("span",{children:t}),u.jsx("strong",{children:e}),u.jsx("p",{children:n})]})}function em({steps:t=[]}){const e=t.map(nn).filter(Boolean);return e.length?u.jsx("ol",{className:"step-list",children:e.map((n,i)=>u.jsx("li",{children:u.jsx(ri,{value:n})},`${n}-${i}`))}):u.jsx("div",{className:"empty-state",children:"暂无维修步骤"})}function A2({quality:t}){const e=t.inspection_items||[],n=(t.defects||[]).map(i=>typeof i=="string"?i:(i==null?void 0:i.description)||(i==null?void 0:i.message)||(i==null?void 0:i.name)||"").filter(Boolean);return u.jsxs("div",{className:"quality-result",children:[u.jsx("div",{className:"check-grid",children:e.map(i=>u.jsxs("div",{className:i.passed?"normal":"fault",children:[u.jsx("span",{children:i.name}),u.jsx("strong",{children:i.passed?"通过":"未通过"})]},i.name))}),u.jsx(em,{steps:[...n,...t.findings||[]]})]})}function C2({items:t}){return t.length?u.jsx("div",{className:"document-list",children:t.map((e,n)=>u.jsxs("article",{children:[u.jsx("strong",{children:nn(e.title)||"维修经验"}),u.jsx(ri,{value:nn(e.content)||"暂无经验正文"})]},e.experience_id||n))}):u.jsx("div",{className:"empty-state",children:"暂无经验记录；闭环通过后会自动沉淀。"})}function ri({value:t,className:e=""}){const n=zC(t);if(!n.length)return null;const i=(r,s)=>HC(r).map((a,o)=>{const l=`${s}-${o}`;return a.type==="strong"?u.jsx("strong",{children:a.text},l):a.type==="code"?u.jsx("code",{children:a.text},l):u.jsx(Uy.Fragment,{children:a.text},l)});return u.jsx("div",{className:`formatted-text ${e}`.trim(),children:n.map((r,s)=>{if(r.type==="list")return u.jsx("ul",{children:r.items.map((a,o)=>u.jsx("li",{children:i(a,`list-${s}-${o}`)},`${a}-${o}`))},`list-${s}`);if(r.type==="heading"){const a=`h${Math.min(Math.max(r.level+1,3),6)}`;return u.jsx(a,{children:i(r.text,`heading-${s}`)},`heading-${s}`)}return r.type==="rule"?u.jsx("hr",{},`rule-${s}`):u.jsx("p",{children:i(r.text,`paragraph-${s}`)},`paragraph-${s}`)})})}function R2({sections:t}){return u.jsx("div",{className:"report-display-sections",children:t.map(e=>{var n;return u.jsxs("section",{className:"report-display-section",children:[u.jsx("h3",{children:e.title}),e.body&&u.jsx(ri,{value:e.body}),((n=e.items)==null?void 0:n.length)>0&&u.jsx(em,{steps:e.items})]},e.title)})})}ix(document.getElementById("root")).render(u.jsx(e2,{}));
