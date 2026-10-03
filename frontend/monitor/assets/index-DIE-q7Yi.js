(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const r of document.querySelectorAll('link[rel="modulepreload"]'))i(r);new MutationObserver(r=>{for(const s of r)if(s.type==="childList")for(const a of s.addedNodes)a.tagName==="LINK"&&a.rel==="modulepreload"&&i(a)}).observe(document,{childList:!0,subtree:!0});function n(r){const s={};return r.integrity&&(s.integrity=r.integrity),r.referrerPolicy&&(s.referrerPolicy=r.referrerPolicy),r.crossOrigin==="use-credentials"?s.credentials="include":r.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function i(r){if(r.ep)return;r.ep=!0;const s=n(r);fetch(r.href,s)}})();function ay(t){return t&&t.__esModule&&Object.prototype.hasOwnProperty.call(t,"default")?t.default:t}var Fg={exports:{}},ru={},Og={exports:{}},ct={};/**
 * @license React
 * react.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var rl=Symbol.for("react.element"),oy=Symbol.for("react.portal"),ly=Symbol.for("react.fragment"),cy=Symbol.for("react.strict_mode"),uy=Symbol.for("react.profiler"),dy=Symbol.for("react.provider"),fy=Symbol.for("react.context"),hy=Symbol.for("react.forward_ref"),py=Symbol.for("react.suspense"),my=Symbol.for("react.memo"),gy=Symbol.for("react.lazy"),om=Symbol.iterator;function _y(t){return t===null||typeof t!="object"?null:(t=om&&t[om]||t["@@iterator"],typeof t=="function"?t:null)}var kg={isMounted:function(){return!1},enqueueForceUpdate:function(){},enqueueReplaceState:function(){},enqueueSetState:function(){}},Bg=Object.assign,zg={};function Va(t,e,n){this.props=t,this.context=e,this.refs=zg,this.updater=n||kg}Va.prototype.isReactComponent={};Va.prototype.setState=function(t,e){if(typeof t!="object"&&typeof t!="function"&&t!=null)throw Error("setState(...): takes an object of state variables to update or a function which returns an object of state variables.");this.updater.enqueueSetState(this,t,e,"setState")};Va.prototype.forceUpdate=function(t){this.updater.enqueueForceUpdate(this,t,"forceUpdate")};function Hg(){}Hg.prototype=Va.prototype;function Ch(t,e,n){this.props=t,this.context=e,this.refs=zg,this.updater=n||kg}var Ph=Ch.prototype=new Hg;Ph.constructor=Ch;Bg(Ph,Va.prototype);Ph.isPureReactComponent=!0;var lm=Array.isArray,Vg=Object.prototype.hasOwnProperty,Nh={current:null},Gg={key:!0,ref:!0,__self:!0,__source:!0};function Wg(t,e,n){var i,r={},s=null,a=null;if(e!=null)for(i in e.ref!==void 0&&(a=e.ref),e.key!==void 0&&(s=""+e.key),e)Vg.call(e,i)&&!Gg.hasOwnProperty(i)&&(r[i]=e[i]);var o=arguments.length-2;if(o===1)r.children=n;else if(1<o){for(var l=Array(o),c=0;c<o;c++)l[c]=arguments[c+2];r.children=l}if(t&&t.defaultProps)for(i in o=t.defaultProps,o)r[i]===void 0&&(r[i]=o[i]);return{$$typeof:rl,type:t,key:s,ref:a,props:r,_owner:Nh.current}}function vy(t,e){return{$$typeof:rl,type:t.type,key:e,ref:t.ref,props:t.props,_owner:t._owner}}function Lh(t){return typeof t=="object"&&t!==null&&t.$$typeof===rl}function xy(t){var e={"=":"=0",":":"=2"};return"$"+t.replace(/[=:]/g,function(n){return e[n]})}var cm=/\/+/g;function Du(t,e){return typeof t=="object"&&t!==null&&t.key!=null?xy(""+t.key):e.toString(36)}function ac(t,e,n,i,r){var s=typeof t;(s==="undefined"||s==="boolean")&&(t=null);var a=!1;if(t===null)a=!0;else switch(s){case"string":case"number":a=!0;break;case"object":switch(t.$$typeof){case rl:case oy:a=!0}}if(a)return a=t,r=r(a),t=i===""?"."+Du(a,0):i,lm(r)?(n="",t!=null&&(n=t.replace(cm,"$&/")+"/"),ac(r,e,n,"",function(c){return c})):r!=null&&(Lh(r)&&(r=vy(r,n+(!r.key||a&&a.key===r.key?"":(""+r.key).replace(cm,"$&/")+"/")+t)),e.push(r)),1;if(a=0,i=i===""?".":i+":",lm(t))for(var o=0;o<t.length;o++){s=t[o];var l=i+Du(s,o);a+=ac(s,e,n,l,r)}else if(l=_y(t),typeof l=="function")for(t=l.call(t),o=0;!(s=t.next()).done;)s=s.value,l=i+Du(s,o++),a+=ac(s,e,n,l,r);else if(s==="object")throw e=String(t),Error("Objects are not valid as a React child (found: "+(e==="[object Object]"?"object with keys {"+Object.keys(t).join(", ")+"}":e)+"). If you meant to render a collection of children, use an array instead.");return a}function pl(t,e,n){if(t==null)return t;var i=[],r=0;return ac(t,i,"","",function(s){return e.call(n,s,r++)}),i}function yy(t){if(t._status===-1){var e=t._result;e=e(),e.then(function(n){(t._status===0||t._status===-1)&&(t._status=1,t._result=n)},function(n){(t._status===0||t._status===-1)&&(t._status=2,t._result=n)}),t._status===-1&&(t._status=0,t._result=e)}if(t._status===1)return t._result.default;throw t._result}var In={current:null},oc={transition:null},Sy={ReactCurrentDispatcher:In,ReactCurrentBatchConfig:oc,ReactCurrentOwner:Nh};function jg(){throw Error("act(...) is not supported in production builds of React.")}ct.Children={map:pl,forEach:function(t,e,n){pl(t,function(){e.apply(this,arguments)},n)},count:function(t){var e=0;return pl(t,function(){e++}),e},toArray:function(t){return pl(t,function(e){return e})||[]},only:function(t){if(!Lh(t))throw Error("React.Children.only expected to receive a single React element child.");return t}};ct.Component=Va;ct.Fragment=ly;ct.Profiler=uy;ct.PureComponent=Ch;ct.StrictMode=cy;ct.Suspense=py;ct.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED=Sy;ct.act=jg;ct.cloneElement=function(t,e,n){if(t==null)throw Error("React.cloneElement(...): The argument must be a React element, but you passed "+t+".");var i=Bg({},t.props),r=t.key,s=t.ref,a=t._owner;if(e!=null){if(e.ref!==void 0&&(s=e.ref,a=Nh.current),e.key!==void 0&&(r=""+e.key),t.type&&t.type.defaultProps)var o=t.type.defaultProps;for(l in e)Vg.call(e,l)&&!Gg.hasOwnProperty(l)&&(i[l]=e[l]===void 0&&o!==void 0?o[l]:e[l])}var l=arguments.length-2;if(l===1)i.children=n;else if(1<l){o=Array(l);for(var c=0;c<l;c++)o[c]=arguments[c+2];i.children=o}return{$$typeof:rl,type:t.type,key:r,ref:s,props:i,_owner:a}};ct.createContext=function(t){return t={$$typeof:fy,_currentValue:t,_currentValue2:t,_threadCount:0,Provider:null,Consumer:null,_defaultValue:null,_globalName:null},t.Provider={$$typeof:dy,_context:t},t.Consumer=t};ct.createElement=Wg;ct.createFactory=function(t){var e=Wg.bind(null,t);return e.type=t,e};ct.createRef=function(){return{current:null}};ct.forwardRef=function(t){return{$$typeof:hy,render:t}};ct.isValidElement=Lh;ct.lazy=function(t){return{$$typeof:gy,_payload:{_status:-1,_result:t},_init:yy}};ct.memo=function(t,e){return{$$typeof:my,type:t,compare:e===void 0?null:e}};ct.startTransition=function(t){var e=oc.transition;oc.transition={};try{t()}finally{oc.transition=e}};ct.unstable_act=jg;ct.useCallback=function(t,e){return In.current.useCallback(t,e)};ct.useContext=function(t){return In.current.useContext(t)};ct.useDebugValue=function(){};ct.useDeferredValue=function(t){return In.current.useDeferredValue(t)};ct.useEffect=function(t,e){return In.current.useEffect(t,e)};ct.useId=function(){return In.current.useId()};ct.useImperativeHandle=function(t,e,n){return In.current.useImperativeHandle(t,e,n)};ct.useInsertionEffect=function(t,e){return In.current.useInsertionEffect(t,e)};ct.useLayoutEffect=function(t,e){return In.current.useLayoutEffect(t,e)};ct.useMemo=function(t,e){return In.current.useMemo(t,e)};ct.useReducer=function(t,e,n){return In.current.useReducer(t,e,n)};ct.useRef=function(t){return In.current.useRef(t)};ct.useState=function(t){return In.current.useState(t)};ct.useSyncExternalStore=function(t,e,n){return In.current.useSyncExternalStore(t,e,n)};ct.useTransition=function(){return In.current.useTransition()};ct.version="18.3.1";Og.exports=ct;var le=Og.exports;const My=ay(le);/**
 * @license React
 * react-jsx-runtime.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var Ey=le,wy=Symbol.for("react.element"),Ty=Symbol.for("react.fragment"),Ay=Object.prototype.hasOwnProperty,by=Ey.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner,Ry={key:!0,ref:!0,__self:!0,__source:!0};function Xg(t,e,n){var i,r={},s=null,a=null;n!==void 0&&(s=""+n),e.key!==void 0&&(s=""+e.key),e.ref!==void 0&&(a=e.ref);for(i in e)Ay.call(e,i)&&!Ry.hasOwnProperty(i)&&(r[i]=e[i]);if(t&&t.defaultProps)for(i in e=t.defaultProps,e)r[i]===void 0&&(r[i]=e[i]);return{$$typeof:wy,type:t,key:s,ref:a,props:r,_owner:by.current}}ru.Fragment=Ty;ru.jsx=Xg;ru.jsxs=Xg;Fg.exports=ru;var d=Fg.exports,$g={exports:{}},ai={},qg={exports:{}},Yg={};/**
 * @license React
 * scheduler.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */(function(t){function e(V,G){var X=V.length;V.push(G);e:for(;0<X;){var ne=X-1>>>1,ve=V[ne];if(0<r(ve,G))V[ne]=G,V[X]=ve,X=ne;else break e}}function n(V){return V.length===0?null:V[0]}function i(V){if(V.length===0)return null;var G=V[0],X=V.pop();if(X!==G){V[0]=X;e:for(var ne=0,ve=V.length,Pe=ve>>>1;ne<Pe;){var Je=2*(ne+1)-1,$e=V[Je],Ke=Je+1,Z=V[Ke];if(0>r($e,X))Ke<ve&&0>r(Z,$e)?(V[ne]=Z,V[Ke]=X,ne=Ke):(V[ne]=$e,V[Je]=X,ne=Je);else if(Ke<ve&&0>r(Z,X))V[ne]=Z,V[Ke]=X,ne=Ke;else break e}}return G}function r(V,G){var X=V.sortIndex-G.sortIndex;return X!==0?X:V.id-G.id}if(typeof performance=="object"&&typeof performance.now=="function"){var s=performance;t.unstable_now=function(){return s.now()}}else{var a=Date,o=a.now();t.unstable_now=function(){return a.now()-o}}var l=[],c=[],h=1,p=null,f=3,g=!1,v=!1,E=!1,_=typeof setTimeout=="function"?setTimeout:null,u=typeof clearTimeout=="function"?clearTimeout:null,m=typeof setImmediate<"u"?setImmediate:null;typeof navigator<"u"&&navigator.scheduling!==void 0&&navigator.scheduling.isInputPending!==void 0&&navigator.scheduling.isInputPending.bind(navigator.scheduling);function M(V){for(var G=n(c);G!==null;){if(G.callback===null)i(c);else if(G.startTime<=V)i(c),G.sortIndex=G.expirationTime,e(l,G);else break;G=n(c)}}function y(V){if(E=!1,M(V),!v)if(n(l)!==null)v=!0,N(T);else{var G=n(c);G!==null&&H(y,G.startTime-V)}}function T(V,G){v=!1,E&&(E=!1,u(x),x=-1),g=!0;var X=f;try{for(M(G),p=n(l);p!==null&&(!(p.expirationTime>G)||V&&!L());){var ne=p.callback;if(typeof ne=="function"){p.callback=null,f=p.priorityLevel;var ve=ne(p.expirationTime<=G);G=t.unstable_now(),typeof ve=="function"?p.callback=ve:p===n(l)&&i(l),M(G)}else i(l);p=n(l)}if(p!==null)var Pe=!0;else{var Je=n(c);Je!==null&&H(y,Je.startTime-G),Pe=!1}return Pe}finally{p=null,f=X,g=!1}}var w=!1,R=null,x=-1,A=5,P=-1;function L(){return!(t.unstable_now()-P<A)}function B(){if(R!==null){var V=t.unstable_now();P=V;var G=!0;try{G=R(!0,V)}finally{G?F():(w=!1,R=null)}}else w=!1}var F;if(typeof m=="function")F=function(){m(B)};else if(typeof MessageChannel<"u"){var I=new MessageChannel,j=I.port2;I.port1.onmessage=B,F=function(){j.postMessage(null)}}else F=function(){_(B,0)};function N(V){R=V,w||(w=!0,F())}function H(V,G){x=_(function(){V(t.unstable_now())},G)}t.unstable_IdlePriority=5,t.unstable_ImmediatePriority=1,t.unstable_LowPriority=4,t.unstable_NormalPriority=3,t.unstable_Profiling=null,t.unstable_UserBlockingPriority=2,t.unstable_cancelCallback=function(V){V.callback=null},t.unstable_continueExecution=function(){v||g||(v=!0,N(T))},t.unstable_forceFrameRate=function(V){0>V||125<V?console.error("forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported"):A=0<V?Math.floor(1e3/V):5},t.unstable_getCurrentPriorityLevel=function(){return f},t.unstable_getFirstCallbackNode=function(){return n(l)},t.unstable_next=function(V){switch(f){case 1:case 2:case 3:var G=3;break;default:G=f}var X=f;f=G;try{return V()}finally{f=X}},t.unstable_pauseExecution=function(){},t.unstable_requestPaint=function(){},t.unstable_runWithPriority=function(V,G){switch(V){case 1:case 2:case 3:case 4:case 5:break;default:V=3}var X=f;f=V;try{return G()}finally{f=X}},t.unstable_scheduleCallback=function(V,G,X){var ne=t.unstable_now();switch(typeof X=="object"&&X!==null?(X=X.delay,X=typeof X=="number"&&0<X?ne+X:ne):X=ne,V){case 1:var ve=-1;break;case 2:ve=250;break;case 5:ve=1073741823;break;case 4:ve=1e4;break;default:ve=5e3}return ve=X+ve,V={id:h++,callback:G,priorityLevel:V,startTime:X,expirationTime:ve,sortIndex:-1},X>ne?(V.sortIndex=X,e(c,V),n(l)===null&&V===n(c)&&(E?(u(x),x=-1):E=!0,H(y,X-ne))):(V.sortIndex=ve,e(l,V),v||g||(v=!0,N(T))),V},t.unstable_shouldYield=L,t.unstable_wrapCallback=function(V){var G=f;return function(){var X=f;f=G;try{return V.apply(this,arguments)}finally{f=X}}}})(Yg);qg.exports=Yg;var Cy=qg.exports;/**
 * @license React
 * react-dom.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var Py=le,si=Cy;function ce(t){for(var e="https://reactjs.org/docs/error-decoder.html?invariant="+t,n=1;n<arguments.length;n++)e+="&args[]="+encodeURIComponent(arguments[n]);return"Minified React error #"+t+"; visit "+e+" for the full message or use the non-minified dev environment for full errors and additional helpful warnings."}var Kg=new Set,Fo={};function Bs(t,e){La(t,e),La(t+"Capture",e)}function La(t,e){for(Fo[t]=e,t=0;t<e.length;t++)Kg.add(e[t])}var br=!(typeof window>"u"||typeof window.document>"u"||typeof window.document.createElement>"u"),Hd=Object.prototype.hasOwnProperty,Ny=/^[:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD][:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\-.0-9\u00B7\u0300-\u036F\u203F-\u2040]*$/,um={},dm={};function Ly(t){return Hd.call(dm,t)?!0:Hd.call(um,t)?!1:Ny.test(t)?dm[t]=!0:(um[t]=!0,!1)}function Dy(t,e,n,i){if(n!==null&&n.type===0)return!1;switch(typeof e){case"function":case"symbol":return!0;case"boolean":return i?!1:n!==null?!n.acceptsBooleans:(t=t.toLowerCase().slice(0,5),t!=="data-"&&t!=="aria-");default:return!1}}function Iy(t,e,n,i){if(e===null||typeof e>"u"||Dy(t,e,n,i))return!0;if(i)return!1;if(n!==null)switch(n.type){case 3:return!e;case 4:return e===!1;case 5:return isNaN(e);case 6:return isNaN(e)||1>e}return!1}function Un(t,e,n,i,r,s,a){this.acceptsBooleans=e===2||e===3||e===4,this.attributeName=i,this.attributeNamespace=r,this.mustUseProperty=n,this.propertyName=t,this.type=e,this.sanitizeURL=s,this.removeEmptyString=a}var vn={};"children dangerouslySetInnerHTML defaultValue defaultChecked innerHTML suppressContentEditableWarning suppressHydrationWarning style".split(" ").forEach(function(t){vn[t]=new Un(t,0,!1,t,null,!1,!1)});[["acceptCharset","accept-charset"],["className","class"],["htmlFor","for"],["httpEquiv","http-equiv"]].forEach(function(t){var e=t[0];vn[e]=new Un(e,1,!1,t[1],null,!1,!1)});["contentEditable","draggable","spellCheck","value"].forEach(function(t){vn[t]=new Un(t,2,!1,t.toLowerCase(),null,!1,!1)});["autoReverse","externalResourcesRequired","focusable","preserveAlpha"].forEach(function(t){vn[t]=new Un(t,2,!1,t,null,!1,!1)});"allowFullScreen async autoFocus autoPlay controls default defer disabled disablePictureInPicture disableRemotePlayback formNoValidate hidden loop noModule noValidate open playsInline readOnly required reversed scoped seamless itemScope".split(" ").forEach(function(t){vn[t]=new Un(t,3,!1,t.toLowerCase(),null,!1,!1)});["checked","multiple","muted","selected"].forEach(function(t){vn[t]=new Un(t,3,!0,t,null,!1,!1)});["capture","download"].forEach(function(t){vn[t]=new Un(t,4,!1,t,null,!1,!1)});["cols","rows","size","span"].forEach(function(t){vn[t]=new Un(t,6,!1,t,null,!1,!1)});["rowSpan","start"].forEach(function(t){vn[t]=new Un(t,5,!1,t.toLowerCase(),null,!1,!1)});var Dh=/[\-:]([a-z])/g;function Ih(t){return t[1].toUpperCase()}"accent-height alignment-baseline arabic-form baseline-shift cap-height clip-path clip-rule color-interpolation color-interpolation-filters color-profile color-rendering dominant-baseline enable-background fill-opacity fill-rule flood-color flood-opacity font-family font-size font-size-adjust font-stretch font-style font-variant font-weight glyph-name glyph-orientation-horizontal glyph-orientation-vertical horiz-adv-x horiz-origin-x image-rendering letter-spacing lighting-color marker-end marker-mid marker-start overline-position overline-thickness paint-order panose-1 pointer-events rendering-intent shape-rendering stop-color stop-opacity strikethrough-position strikethrough-thickness stroke-dasharray stroke-dashoffset stroke-linecap stroke-linejoin stroke-miterlimit stroke-opacity stroke-width text-anchor text-decoration text-rendering underline-position underline-thickness unicode-bidi unicode-range units-per-em v-alphabetic v-hanging v-ideographic v-mathematical vector-effect vert-adv-y vert-origin-x vert-origin-y word-spacing writing-mode xmlns:xlink x-height".split(" ").forEach(function(t){var e=t.replace(Dh,Ih);vn[e]=new Un(e,1,!1,t,null,!1,!1)});"xlink:actuate xlink:arcrole xlink:role xlink:show xlink:title xlink:type".split(" ").forEach(function(t){var e=t.replace(Dh,Ih);vn[e]=new Un(e,1,!1,t,"http://www.w3.org/1999/xlink",!1,!1)});["xml:base","xml:lang","xml:space"].forEach(function(t){var e=t.replace(Dh,Ih);vn[e]=new Un(e,1,!1,t,"http://www.w3.org/XML/1998/namespace",!1,!1)});["tabIndex","crossOrigin"].forEach(function(t){vn[t]=new Un(t,1,!1,t.toLowerCase(),null,!1,!1)});vn.xlinkHref=new Un("xlinkHref",1,!1,"xlink:href","http://www.w3.org/1999/xlink",!0,!1);["src","href","action","formAction"].forEach(function(t){vn[t]=new Un(t,1,!1,t.toLowerCase(),null,!0,!0)});function Uh(t,e,n,i){var r=vn.hasOwnProperty(e)?vn[e]:null;(r!==null?r.type!==0:i||!(2<e.length)||e[0]!=="o"&&e[0]!=="O"||e[1]!=="n"&&e[1]!=="N")&&(Iy(e,n,r,i)&&(n=null),i||r===null?Ly(e)&&(n===null?t.removeAttribute(e):t.setAttribute(e,""+n)):r.mustUseProperty?t[r.propertyName]=n===null?r.type===3?!1:"":n:(e=r.attributeName,i=r.attributeNamespace,n===null?t.removeAttribute(e):(r=r.type,n=r===3||r===4&&n===!0?"":""+n,i?t.setAttributeNS(i,e,n):t.setAttribute(e,n))))}var Dr=Py.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED,ml=Symbol.for("react.element"),oa=Symbol.for("react.portal"),la=Symbol.for("react.fragment"),Fh=Symbol.for("react.strict_mode"),Vd=Symbol.for("react.profiler"),Zg=Symbol.for("react.provider"),Qg=Symbol.for("react.context"),Oh=Symbol.for("react.forward_ref"),Gd=Symbol.for("react.suspense"),Wd=Symbol.for("react.suspense_list"),kh=Symbol.for("react.memo"),Wr=Symbol.for("react.lazy"),Jg=Symbol.for("react.offscreen"),fm=Symbol.iterator;function eo(t){return t===null||typeof t!="object"?null:(t=fm&&t[fm]||t["@@iterator"],typeof t=="function"?t:null)}var jt=Object.assign,Iu;function _o(t){if(Iu===void 0)try{throw Error()}catch(n){var e=n.stack.trim().match(/\n( *(at )?)/);Iu=e&&e[1]||""}return`
`+Iu+t}var Uu=!1;function Fu(t,e){if(!t||Uu)return"";Uu=!0;var n=Error.prepareStackTrace;Error.prepareStackTrace=void 0;try{if(e)if(e=function(){throw Error()},Object.defineProperty(e.prototype,"props",{set:function(){throw Error()}}),typeof Reflect=="object"&&Reflect.construct){try{Reflect.construct(e,[])}catch(c){var i=c}Reflect.construct(t,[],e)}else{try{e.call()}catch(c){i=c}t.call(e.prototype)}else{try{throw Error()}catch(c){i=c}t()}}catch(c){if(c&&i&&typeof c.stack=="string"){for(var r=c.stack.split(`
`),s=i.stack.split(`
`),a=r.length-1,o=s.length-1;1<=a&&0<=o&&r[a]!==s[o];)o--;for(;1<=a&&0<=o;a--,o--)if(r[a]!==s[o]){if(a!==1||o!==1)do if(a--,o--,0>o||r[a]!==s[o]){var l=`
`+r[a].replace(" at new "," at ");return t.displayName&&l.includes("<anonymous>")&&(l=l.replace("<anonymous>",t.displayName)),l}while(1<=a&&0<=o);break}}}finally{Uu=!1,Error.prepareStackTrace=n}return(t=t?t.displayName||t.name:"")?_o(t):""}function Uy(t){switch(t.tag){case 5:return _o(t.type);case 16:return _o("Lazy");case 13:return _o("Suspense");case 19:return _o("SuspenseList");case 0:case 2:case 15:return t=Fu(t.type,!1),t;case 11:return t=Fu(t.type.render,!1),t;case 1:return t=Fu(t.type,!0),t;default:return""}}function jd(t){if(t==null)return null;if(typeof t=="function")return t.displayName||t.name||null;if(typeof t=="string")return t;switch(t){case la:return"Fragment";case oa:return"Portal";case Vd:return"Profiler";case Fh:return"StrictMode";case Gd:return"Suspense";case Wd:return"SuspenseList"}if(typeof t=="object")switch(t.$$typeof){case Qg:return(t.displayName||"Context")+".Consumer";case Zg:return(t._context.displayName||"Context")+".Provider";case Oh:var e=t.render;return t=t.displayName,t||(t=e.displayName||e.name||"",t=t!==""?"ForwardRef("+t+")":"ForwardRef"),t;case kh:return e=t.displayName||null,e!==null?e:jd(t.type)||"Memo";case Wr:e=t._payload,t=t._init;try{return jd(t(e))}catch{}}return null}function Fy(t){var e=t.type;switch(t.tag){case 24:return"Cache";case 9:return(e.displayName||"Context")+".Consumer";case 10:return(e._context.displayName||"Context")+".Provider";case 18:return"DehydratedFragment";case 11:return t=e.render,t=t.displayName||t.name||"",e.displayName||(t!==""?"ForwardRef("+t+")":"ForwardRef");case 7:return"Fragment";case 5:return e;case 4:return"Portal";case 3:return"Root";case 6:return"Text";case 16:return jd(e);case 8:return e===Fh?"StrictMode":"Mode";case 22:return"Offscreen";case 12:return"Profiler";case 21:return"Scope";case 13:return"Suspense";case 19:return"SuspenseList";case 25:return"TracingMarker";case 1:case 0:case 17:case 2:case 14:case 15:if(typeof e=="function")return e.displayName||e.name||null;if(typeof e=="string")return e}return null}function as(t){switch(typeof t){case"boolean":case"number":case"string":case"undefined":return t;case"object":return t;default:return""}}function e_(t){var e=t.type;return(t=t.nodeName)&&t.toLowerCase()==="input"&&(e==="checkbox"||e==="radio")}function Oy(t){var e=e_(t)?"checked":"value",n=Object.getOwnPropertyDescriptor(t.constructor.prototype,e),i=""+t[e];if(!t.hasOwnProperty(e)&&typeof n<"u"&&typeof n.get=="function"&&typeof n.set=="function"){var r=n.get,s=n.set;return Object.defineProperty(t,e,{configurable:!0,get:function(){return r.call(this)},set:function(a){i=""+a,s.call(this,a)}}),Object.defineProperty(t,e,{enumerable:n.enumerable}),{getValue:function(){return i},setValue:function(a){i=""+a},stopTracking:function(){t._valueTracker=null,delete t[e]}}}}function gl(t){t._valueTracker||(t._valueTracker=Oy(t))}function t_(t){if(!t)return!1;var e=t._valueTracker;if(!e)return!0;var n=e.getValue(),i="";return t&&(i=e_(t)?t.checked?"true":"false":t.value),t=i,t!==n?(e.setValue(t),!0):!1}function Ec(t){if(t=t||(typeof document<"u"?document:void 0),typeof t>"u")return null;try{return t.activeElement||t.body}catch{return t.body}}function Xd(t,e){var n=e.checked;return jt({},e,{defaultChecked:void 0,defaultValue:void 0,value:void 0,checked:n??t._wrapperState.initialChecked})}function hm(t,e){var n=e.defaultValue==null?"":e.defaultValue,i=e.checked!=null?e.checked:e.defaultChecked;n=as(e.value!=null?e.value:n),t._wrapperState={initialChecked:i,initialValue:n,controlled:e.type==="checkbox"||e.type==="radio"?e.checked!=null:e.value!=null}}function n_(t,e){e=e.checked,e!=null&&Uh(t,"checked",e,!1)}function $d(t,e){n_(t,e);var n=as(e.value),i=e.type;if(n!=null)i==="number"?(n===0&&t.value===""||t.value!=n)&&(t.value=""+n):t.value!==""+n&&(t.value=""+n);else if(i==="submit"||i==="reset"){t.removeAttribute("value");return}e.hasOwnProperty("value")?qd(t,e.type,n):e.hasOwnProperty("defaultValue")&&qd(t,e.type,as(e.defaultValue)),e.checked==null&&e.defaultChecked!=null&&(t.defaultChecked=!!e.defaultChecked)}function pm(t,e,n){if(e.hasOwnProperty("value")||e.hasOwnProperty("defaultValue")){var i=e.type;if(!(i!=="submit"&&i!=="reset"||e.value!==void 0&&e.value!==null))return;e=""+t._wrapperState.initialValue,n||e===t.value||(t.value=e),t.defaultValue=e}n=t.name,n!==""&&(t.name=""),t.defaultChecked=!!t._wrapperState.initialChecked,n!==""&&(t.name=n)}function qd(t,e,n){(e!=="number"||Ec(t.ownerDocument)!==t)&&(n==null?t.defaultValue=""+t._wrapperState.initialValue:t.defaultValue!==""+n&&(t.defaultValue=""+n))}var vo=Array.isArray;function Ma(t,e,n,i){if(t=t.options,e){e={};for(var r=0;r<n.length;r++)e["$"+n[r]]=!0;for(n=0;n<t.length;n++)r=e.hasOwnProperty("$"+t[n].value),t[n].selected!==r&&(t[n].selected=r),r&&i&&(t[n].defaultSelected=!0)}else{for(n=""+as(n),e=null,r=0;r<t.length;r++){if(t[r].value===n){t[r].selected=!0,i&&(t[r].defaultSelected=!0);return}e!==null||t[r].disabled||(e=t[r])}e!==null&&(e.selected=!0)}}function Yd(t,e){if(e.dangerouslySetInnerHTML!=null)throw Error(ce(91));return jt({},e,{value:void 0,defaultValue:void 0,children:""+t._wrapperState.initialValue})}function mm(t,e){var n=e.value;if(n==null){if(n=e.children,e=e.defaultValue,n!=null){if(e!=null)throw Error(ce(92));if(vo(n)){if(1<n.length)throw Error(ce(93));n=n[0]}e=n}e==null&&(e=""),n=e}t._wrapperState={initialValue:as(n)}}function i_(t,e){var n=as(e.value),i=as(e.defaultValue);n!=null&&(n=""+n,n!==t.value&&(t.value=n),e.defaultValue==null&&t.defaultValue!==n&&(t.defaultValue=n)),i!=null&&(t.defaultValue=""+i)}function gm(t){var e=t.textContent;e===t._wrapperState.initialValue&&e!==""&&e!==null&&(t.value=e)}function r_(t){switch(t){case"svg":return"http://www.w3.org/2000/svg";case"math":return"http://www.w3.org/1998/Math/MathML";default:return"http://www.w3.org/1999/xhtml"}}function Kd(t,e){return t==null||t==="http://www.w3.org/1999/xhtml"?r_(e):t==="http://www.w3.org/2000/svg"&&e==="foreignObject"?"http://www.w3.org/1999/xhtml":t}var _l,s_=function(t){return typeof MSApp<"u"&&MSApp.execUnsafeLocalFunction?function(e,n,i,r){MSApp.execUnsafeLocalFunction(function(){return t(e,n,i,r)})}:t}(function(t,e){if(t.namespaceURI!=="http://www.w3.org/2000/svg"||"innerHTML"in t)t.innerHTML=e;else{for(_l=_l||document.createElement("div"),_l.innerHTML="<svg>"+e.valueOf().toString()+"</svg>",e=_l.firstChild;t.firstChild;)t.removeChild(t.firstChild);for(;e.firstChild;)t.appendChild(e.firstChild)}});function Oo(t,e){if(e){var n=t.firstChild;if(n&&n===t.lastChild&&n.nodeType===3){n.nodeValue=e;return}}t.textContent=e}var wo={animationIterationCount:!0,aspectRatio:!0,borderImageOutset:!0,borderImageSlice:!0,borderImageWidth:!0,boxFlex:!0,boxFlexGroup:!0,boxOrdinalGroup:!0,columnCount:!0,columns:!0,flex:!0,flexGrow:!0,flexPositive:!0,flexShrink:!0,flexNegative:!0,flexOrder:!0,gridArea:!0,gridRow:!0,gridRowEnd:!0,gridRowSpan:!0,gridRowStart:!0,gridColumn:!0,gridColumnEnd:!0,gridColumnSpan:!0,gridColumnStart:!0,fontWeight:!0,lineClamp:!0,lineHeight:!0,opacity:!0,order:!0,orphans:!0,tabSize:!0,widows:!0,zIndex:!0,zoom:!0,fillOpacity:!0,floodOpacity:!0,stopOpacity:!0,strokeDasharray:!0,strokeDashoffset:!0,strokeMiterlimit:!0,strokeOpacity:!0,strokeWidth:!0},ky=["Webkit","ms","Moz","O"];Object.keys(wo).forEach(function(t){ky.forEach(function(e){e=e+t.charAt(0).toUpperCase()+t.substring(1),wo[e]=wo[t]})});function a_(t,e,n){return e==null||typeof e=="boolean"||e===""?"":n||typeof e!="number"||e===0||wo.hasOwnProperty(t)&&wo[t]?(""+e).trim():e+"px"}function o_(t,e){t=t.style;for(var n in e)if(e.hasOwnProperty(n)){var i=n.indexOf("--")===0,r=a_(n,e[n],i);n==="float"&&(n="cssFloat"),i?t.setProperty(n,r):t[n]=r}}var By=jt({menuitem:!0},{area:!0,base:!0,br:!0,col:!0,embed:!0,hr:!0,img:!0,input:!0,keygen:!0,link:!0,meta:!0,param:!0,source:!0,track:!0,wbr:!0});function Zd(t,e){if(e){if(By[t]&&(e.children!=null||e.dangerouslySetInnerHTML!=null))throw Error(ce(137,t));if(e.dangerouslySetInnerHTML!=null){if(e.children!=null)throw Error(ce(60));if(typeof e.dangerouslySetInnerHTML!="object"||!("__html"in e.dangerouslySetInnerHTML))throw Error(ce(61))}if(e.style!=null&&typeof e.style!="object")throw Error(ce(62))}}function Qd(t,e){if(t.indexOf("-")===-1)return typeof e.is=="string";switch(t){case"annotation-xml":case"color-profile":case"font-face":case"font-face-src":case"font-face-uri":case"font-face-format":case"font-face-name":case"missing-glyph":return!1;default:return!0}}var Jd=null;function Bh(t){return t=t.target||t.srcElement||window,t.correspondingUseElement&&(t=t.correspondingUseElement),t.nodeType===3?t.parentNode:t}var ef=null,Ea=null,wa=null;function _m(t){if(t=ol(t)){if(typeof ef!="function")throw Error(ce(280));var e=t.stateNode;e&&(e=cu(e),ef(t.stateNode,t.type,e))}}function l_(t){Ea?wa?wa.push(t):wa=[t]:Ea=t}function c_(){if(Ea){var t=Ea,e=wa;if(wa=Ea=null,_m(t),e)for(t=0;t<e.length;t++)_m(e[t])}}function u_(t,e){return t(e)}function d_(){}var Ou=!1;function f_(t,e,n){if(Ou)return t(e,n);Ou=!0;try{return u_(t,e,n)}finally{Ou=!1,(Ea!==null||wa!==null)&&(d_(),c_())}}function ko(t,e){var n=t.stateNode;if(n===null)return null;var i=cu(n);if(i===null)return null;n=i[e];e:switch(e){case"onClick":case"onClickCapture":case"onDoubleClick":case"onDoubleClickCapture":case"onMouseDown":case"onMouseDownCapture":case"onMouseMove":case"onMouseMoveCapture":case"onMouseUp":case"onMouseUpCapture":case"onMouseEnter":(i=!i.disabled)||(t=t.type,i=!(t==="button"||t==="input"||t==="select"||t==="textarea")),t=!i;break e;default:t=!1}if(t)return null;if(n&&typeof n!="function")throw Error(ce(231,e,typeof n));return n}var tf=!1;if(br)try{var to={};Object.defineProperty(to,"passive",{get:function(){tf=!0}}),window.addEventListener("test",to,to),window.removeEventListener("test",to,to)}catch{tf=!1}function zy(t,e,n,i,r,s,a,o,l){var c=Array.prototype.slice.call(arguments,3);try{e.apply(n,c)}catch(h){this.onError(h)}}var To=!1,wc=null,Tc=!1,nf=null,Hy={onError:function(t){To=!0,wc=t}};function Vy(t,e,n,i,r,s,a,o,l){To=!1,wc=null,zy.apply(Hy,arguments)}function Gy(t,e,n,i,r,s,a,o,l){if(Vy.apply(this,arguments),To){if(To){var c=wc;To=!1,wc=null}else throw Error(ce(198));Tc||(Tc=!0,nf=c)}}function zs(t){var e=t,n=t;if(t.alternate)for(;e.return;)e=e.return;else{t=e;do e=t,e.flags&4098&&(n=e.return),t=e.return;while(t)}return e.tag===3?n:null}function h_(t){if(t.tag===13){var e=t.memoizedState;if(e===null&&(t=t.alternate,t!==null&&(e=t.memoizedState)),e!==null)return e.dehydrated}return null}function vm(t){if(zs(t)!==t)throw Error(ce(188))}function Wy(t){var e=t.alternate;if(!e){if(e=zs(t),e===null)throw Error(ce(188));return e!==t?null:t}for(var n=t,i=e;;){var r=n.return;if(r===null)break;var s=r.alternate;if(s===null){if(i=r.return,i!==null){n=i;continue}break}if(r.child===s.child){for(s=r.child;s;){if(s===n)return vm(r),t;if(s===i)return vm(r),e;s=s.sibling}throw Error(ce(188))}if(n.return!==i.return)n=r,i=s;else{for(var a=!1,o=r.child;o;){if(o===n){a=!0,n=r,i=s;break}if(o===i){a=!0,i=r,n=s;break}o=o.sibling}if(!a){for(o=s.child;o;){if(o===n){a=!0,n=s,i=r;break}if(o===i){a=!0,i=s,n=r;break}o=o.sibling}if(!a)throw Error(ce(189))}}if(n.alternate!==i)throw Error(ce(190))}if(n.tag!==3)throw Error(ce(188));return n.stateNode.current===n?t:e}function p_(t){return t=Wy(t),t!==null?m_(t):null}function m_(t){if(t.tag===5||t.tag===6)return t;for(t=t.child;t!==null;){var e=m_(t);if(e!==null)return e;t=t.sibling}return null}var g_=si.unstable_scheduleCallback,xm=si.unstable_cancelCallback,jy=si.unstable_shouldYield,Xy=si.unstable_requestPaint,Kt=si.unstable_now,$y=si.unstable_getCurrentPriorityLevel,zh=si.unstable_ImmediatePriority,__=si.unstable_UserBlockingPriority,Ac=si.unstable_NormalPriority,qy=si.unstable_LowPriority,v_=si.unstable_IdlePriority,su=null,ir=null;function Yy(t){if(ir&&typeof ir.onCommitFiberRoot=="function")try{ir.onCommitFiberRoot(su,t,void 0,(t.current.flags&128)===128)}catch{}}var Ui=Math.clz32?Math.clz32:Qy,Ky=Math.log,Zy=Math.LN2;function Qy(t){return t>>>=0,t===0?32:31-(Ky(t)/Zy|0)|0}var vl=64,xl=4194304;function xo(t){switch(t&-t){case 1:return 1;case 2:return 2;case 4:return 4;case 8:return 8;case 16:return 16;case 32:return 32;case 64:case 128:case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:return t&4194240;case 4194304:case 8388608:case 16777216:case 33554432:case 67108864:return t&130023424;case 134217728:return 134217728;case 268435456:return 268435456;case 536870912:return 536870912;case 1073741824:return 1073741824;default:return t}}function bc(t,e){var n=t.pendingLanes;if(n===0)return 0;var i=0,r=t.suspendedLanes,s=t.pingedLanes,a=n&268435455;if(a!==0){var o=a&~r;o!==0?i=xo(o):(s&=a,s!==0&&(i=xo(s)))}else a=n&~r,a!==0?i=xo(a):s!==0&&(i=xo(s));if(i===0)return 0;if(e!==0&&e!==i&&!(e&r)&&(r=i&-i,s=e&-e,r>=s||r===16&&(s&4194240)!==0))return e;if(i&4&&(i|=n&16),e=t.entangledLanes,e!==0)for(t=t.entanglements,e&=i;0<e;)n=31-Ui(e),r=1<<n,i|=t[n],e&=~r;return i}function Jy(t,e){switch(t){case 1:case 2:case 4:return e+250;case 8:case 16:case 32:case 64:case 128:case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:return e+5e3;case 4194304:case 8388608:case 16777216:case 33554432:case 67108864:return-1;case 134217728:case 268435456:case 536870912:case 1073741824:return-1;default:return-1}}function eS(t,e){for(var n=t.suspendedLanes,i=t.pingedLanes,r=t.expirationTimes,s=t.pendingLanes;0<s;){var a=31-Ui(s),o=1<<a,l=r[a];l===-1?(!(o&n)||o&i)&&(r[a]=Jy(o,e)):l<=e&&(t.expiredLanes|=o),s&=~o}}function rf(t){return t=t.pendingLanes&-1073741825,t!==0?t:t&1073741824?1073741824:0}function x_(){var t=vl;return vl<<=1,!(vl&4194240)&&(vl=64),t}function ku(t){for(var e=[],n=0;31>n;n++)e.push(t);return e}function sl(t,e,n){t.pendingLanes|=e,e!==536870912&&(t.suspendedLanes=0,t.pingedLanes=0),t=t.eventTimes,e=31-Ui(e),t[e]=n}function tS(t,e){var n=t.pendingLanes&~e;t.pendingLanes=e,t.suspendedLanes=0,t.pingedLanes=0,t.expiredLanes&=e,t.mutableReadLanes&=e,t.entangledLanes&=e,e=t.entanglements;var i=t.eventTimes;for(t=t.expirationTimes;0<n;){var r=31-Ui(n),s=1<<r;e[r]=0,i[r]=-1,t[r]=-1,n&=~s}}function Hh(t,e){var n=t.entangledLanes|=e;for(t=t.entanglements;n;){var i=31-Ui(n),r=1<<i;r&e|t[i]&e&&(t[i]|=e),n&=~r}}var bt=0;function y_(t){return t&=-t,1<t?4<t?t&268435455?16:536870912:4:1}var S_,Vh,M_,E_,w_,sf=!1,yl=[],Qr=null,Jr=null,es=null,Bo=new Map,zo=new Map,Xr=[],nS="mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset submit".split(" ");function ym(t,e){switch(t){case"focusin":case"focusout":Qr=null;break;case"dragenter":case"dragleave":Jr=null;break;case"mouseover":case"mouseout":es=null;break;case"pointerover":case"pointerout":Bo.delete(e.pointerId);break;case"gotpointercapture":case"lostpointercapture":zo.delete(e.pointerId)}}function no(t,e,n,i,r,s){return t===null||t.nativeEvent!==s?(t={blockedOn:e,domEventName:n,eventSystemFlags:i,nativeEvent:s,targetContainers:[r]},e!==null&&(e=ol(e),e!==null&&Vh(e)),t):(t.eventSystemFlags|=i,e=t.targetContainers,r!==null&&e.indexOf(r)===-1&&e.push(r),t)}function iS(t,e,n,i,r){switch(e){case"focusin":return Qr=no(Qr,t,e,n,i,r),!0;case"dragenter":return Jr=no(Jr,t,e,n,i,r),!0;case"mouseover":return es=no(es,t,e,n,i,r),!0;case"pointerover":var s=r.pointerId;return Bo.set(s,no(Bo.get(s)||null,t,e,n,i,r)),!0;case"gotpointercapture":return s=r.pointerId,zo.set(s,no(zo.get(s)||null,t,e,n,i,r)),!0}return!1}function T_(t){var e=ws(t.target);if(e!==null){var n=zs(e);if(n!==null){if(e=n.tag,e===13){if(e=h_(n),e!==null){t.blockedOn=e,w_(t.priority,function(){M_(n)});return}}else if(e===3&&n.stateNode.current.memoizedState.isDehydrated){t.blockedOn=n.tag===3?n.stateNode.containerInfo:null;return}}}t.blockedOn=null}function lc(t){if(t.blockedOn!==null)return!1;for(var e=t.targetContainers;0<e.length;){var n=af(t.domEventName,t.eventSystemFlags,e[0],t.nativeEvent);if(n===null){n=t.nativeEvent;var i=new n.constructor(n.type,n);Jd=i,n.target.dispatchEvent(i),Jd=null}else return e=ol(n),e!==null&&Vh(e),t.blockedOn=n,!1;e.shift()}return!0}function Sm(t,e,n){lc(t)&&n.delete(e)}function rS(){sf=!1,Qr!==null&&lc(Qr)&&(Qr=null),Jr!==null&&lc(Jr)&&(Jr=null),es!==null&&lc(es)&&(es=null),Bo.forEach(Sm),zo.forEach(Sm)}function io(t,e){t.blockedOn===e&&(t.blockedOn=null,sf||(sf=!0,si.unstable_scheduleCallback(si.unstable_NormalPriority,rS)))}function Ho(t){function e(r){return io(r,t)}if(0<yl.length){io(yl[0],t);for(var n=1;n<yl.length;n++){var i=yl[n];i.blockedOn===t&&(i.blockedOn=null)}}for(Qr!==null&&io(Qr,t),Jr!==null&&io(Jr,t),es!==null&&io(es,t),Bo.forEach(e),zo.forEach(e),n=0;n<Xr.length;n++)i=Xr[n],i.blockedOn===t&&(i.blockedOn=null);for(;0<Xr.length&&(n=Xr[0],n.blockedOn===null);)T_(n),n.blockedOn===null&&Xr.shift()}var Ta=Dr.ReactCurrentBatchConfig,Rc=!0;function sS(t,e,n,i){var r=bt,s=Ta.transition;Ta.transition=null;try{bt=1,Gh(t,e,n,i)}finally{bt=r,Ta.transition=s}}function aS(t,e,n,i){var r=bt,s=Ta.transition;Ta.transition=null;try{bt=4,Gh(t,e,n,i)}finally{bt=r,Ta.transition=s}}function Gh(t,e,n,i){if(Rc){var r=af(t,e,n,i);if(r===null)qu(t,e,i,Cc,n),ym(t,i);else if(iS(r,t,e,n,i))i.stopPropagation();else if(ym(t,i),e&4&&-1<nS.indexOf(t)){for(;r!==null;){var s=ol(r);if(s!==null&&S_(s),s=af(t,e,n,i),s===null&&qu(t,e,i,Cc,n),s===r)break;r=s}r!==null&&i.stopPropagation()}else qu(t,e,i,null,n)}}var Cc=null;function af(t,e,n,i){if(Cc=null,t=Bh(i),t=ws(t),t!==null)if(e=zs(t),e===null)t=null;else if(n=e.tag,n===13){if(t=h_(e),t!==null)return t;t=null}else if(n===3){if(e.stateNode.current.memoizedState.isDehydrated)return e.tag===3?e.stateNode.containerInfo:null;t=null}else e!==t&&(t=null);return Cc=t,null}function A_(t){switch(t){case"cancel":case"click":case"close":case"contextmenu":case"copy":case"cut":case"auxclick":case"dblclick":case"dragend":case"dragstart":case"drop":case"focusin":case"focusout":case"input":case"invalid":case"keydown":case"keypress":case"keyup":case"mousedown":case"mouseup":case"paste":case"pause":case"play":case"pointercancel":case"pointerdown":case"pointerup":case"ratechange":case"reset":case"resize":case"seeked":case"submit":case"touchcancel":case"touchend":case"touchstart":case"volumechange":case"change":case"selectionchange":case"textInput":case"compositionstart":case"compositionend":case"compositionupdate":case"beforeblur":case"afterblur":case"beforeinput":case"blur":case"fullscreenchange":case"focus":case"hashchange":case"popstate":case"select":case"selectstart":return 1;case"drag":case"dragenter":case"dragexit":case"dragleave":case"dragover":case"mousemove":case"mouseout":case"mouseover":case"pointermove":case"pointerout":case"pointerover":case"scroll":case"toggle":case"touchmove":case"wheel":case"mouseenter":case"mouseleave":case"pointerenter":case"pointerleave":return 4;case"message":switch($y()){case zh:return 1;case __:return 4;case Ac:case qy:return 16;case v_:return 536870912;default:return 16}default:return 16}}var Yr=null,Wh=null,cc=null;function b_(){if(cc)return cc;var t,e=Wh,n=e.length,i,r="value"in Yr?Yr.value:Yr.textContent,s=r.length;for(t=0;t<n&&e[t]===r[t];t++);var a=n-t;for(i=1;i<=a&&e[n-i]===r[s-i];i++);return cc=r.slice(t,1<i?1-i:void 0)}function uc(t){var e=t.keyCode;return"charCode"in t?(t=t.charCode,t===0&&e===13&&(t=13)):t=e,t===10&&(t=13),32<=t||t===13?t:0}function Sl(){return!0}function Mm(){return!1}function oi(t){function e(n,i,r,s,a){this._reactName=n,this._targetInst=r,this.type=i,this.nativeEvent=s,this.target=a,this.currentTarget=null;for(var o in t)t.hasOwnProperty(o)&&(n=t[o],this[o]=n?n(s):s[o]);return this.isDefaultPrevented=(s.defaultPrevented!=null?s.defaultPrevented:s.returnValue===!1)?Sl:Mm,this.isPropagationStopped=Mm,this}return jt(e.prototype,{preventDefault:function(){this.defaultPrevented=!0;var n=this.nativeEvent;n&&(n.preventDefault?n.preventDefault():typeof n.returnValue!="unknown"&&(n.returnValue=!1),this.isDefaultPrevented=Sl)},stopPropagation:function(){var n=this.nativeEvent;n&&(n.stopPropagation?n.stopPropagation():typeof n.cancelBubble!="unknown"&&(n.cancelBubble=!0),this.isPropagationStopped=Sl)},persist:function(){},isPersistent:Sl}),e}var Ga={eventPhase:0,bubbles:0,cancelable:0,timeStamp:function(t){return t.timeStamp||Date.now()},defaultPrevented:0,isTrusted:0},jh=oi(Ga),al=jt({},Ga,{view:0,detail:0}),oS=oi(al),Bu,zu,ro,au=jt({},al,{screenX:0,screenY:0,clientX:0,clientY:0,pageX:0,pageY:0,ctrlKey:0,shiftKey:0,altKey:0,metaKey:0,getModifierState:Xh,button:0,buttons:0,relatedTarget:function(t){return t.relatedTarget===void 0?t.fromElement===t.srcElement?t.toElement:t.fromElement:t.relatedTarget},movementX:function(t){return"movementX"in t?t.movementX:(t!==ro&&(ro&&t.type==="mousemove"?(Bu=t.screenX-ro.screenX,zu=t.screenY-ro.screenY):zu=Bu=0,ro=t),Bu)},movementY:function(t){return"movementY"in t?t.movementY:zu}}),Em=oi(au),lS=jt({},au,{dataTransfer:0}),cS=oi(lS),uS=jt({},al,{relatedTarget:0}),Hu=oi(uS),dS=jt({},Ga,{animationName:0,elapsedTime:0,pseudoElement:0}),fS=oi(dS),hS=jt({},Ga,{clipboardData:function(t){return"clipboardData"in t?t.clipboardData:window.clipboardData}}),pS=oi(hS),mS=jt({},Ga,{data:0}),wm=oi(mS),gS={Esc:"Escape",Spacebar:" ",Left:"ArrowLeft",Up:"ArrowUp",Right:"ArrowRight",Down:"ArrowDown",Del:"Delete",Win:"OS",Menu:"ContextMenu",Apps:"ContextMenu",Scroll:"ScrollLock",MozPrintableKey:"Unidentified"},_S={8:"Backspace",9:"Tab",12:"Clear",13:"Enter",16:"Shift",17:"Control",18:"Alt",19:"Pause",20:"CapsLock",27:"Escape",32:" ",33:"PageUp",34:"PageDown",35:"End",36:"Home",37:"ArrowLeft",38:"ArrowUp",39:"ArrowRight",40:"ArrowDown",45:"Insert",46:"Delete",112:"F1",113:"F2",114:"F3",115:"F4",116:"F5",117:"F6",118:"F7",119:"F8",120:"F9",121:"F10",122:"F11",123:"F12",144:"NumLock",145:"ScrollLock",224:"Meta"},vS={Alt:"altKey",Control:"ctrlKey",Meta:"metaKey",Shift:"shiftKey"};function xS(t){var e=this.nativeEvent;return e.getModifierState?e.getModifierState(t):(t=vS[t])?!!e[t]:!1}function Xh(){return xS}var yS=jt({},al,{key:function(t){if(t.key){var e=gS[t.key]||t.key;if(e!=="Unidentified")return e}return t.type==="keypress"?(t=uc(t),t===13?"Enter":String.fromCharCode(t)):t.type==="keydown"||t.type==="keyup"?_S[t.keyCode]||"Unidentified":""},code:0,location:0,ctrlKey:0,shiftKey:0,altKey:0,metaKey:0,repeat:0,locale:0,getModifierState:Xh,charCode:function(t){return t.type==="keypress"?uc(t):0},keyCode:function(t){return t.type==="keydown"||t.type==="keyup"?t.keyCode:0},which:function(t){return t.type==="keypress"?uc(t):t.type==="keydown"||t.type==="keyup"?t.keyCode:0}}),SS=oi(yS),MS=jt({},au,{pointerId:0,width:0,height:0,pressure:0,tangentialPressure:0,tiltX:0,tiltY:0,twist:0,pointerType:0,isPrimary:0}),Tm=oi(MS),ES=jt({},al,{touches:0,targetTouches:0,changedTouches:0,altKey:0,metaKey:0,ctrlKey:0,shiftKey:0,getModifierState:Xh}),wS=oi(ES),TS=jt({},Ga,{propertyName:0,elapsedTime:0,pseudoElement:0}),AS=oi(TS),bS=jt({},au,{deltaX:function(t){return"deltaX"in t?t.deltaX:"wheelDeltaX"in t?-t.wheelDeltaX:0},deltaY:function(t){return"deltaY"in t?t.deltaY:"wheelDeltaY"in t?-t.wheelDeltaY:"wheelDelta"in t?-t.wheelDelta:0},deltaZ:0,deltaMode:0}),RS=oi(bS),CS=[9,13,27,32],$h=br&&"CompositionEvent"in window,Ao=null;br&&"documentMode"in document&&(Ao=document.documentMode);var PS=br&&"TextEvent"in window&&!Ao,R_=br&&(!$h||Ao&&8<Ao&&11>=Ao),Am=" ",bm=!1;function C_(t,e){switch(t){case"keyup":return CS.indexOf(e.keyCode)!==-1;case"keydown":return e.keyCode!==229;case"keypress":case"mousedown":case"focusout":return!0;default:return!1}}function P_(t){return t=t.detail,typeof t=="object"&&"data"in t?t.data:null}var ca=!1;function NS(t,e){switch(t){case"compositionend":return P_(e);case"keypress":return e.which!==32?null:(bm=!0,Am);case"textInput":return t=e.data,t===Am&&bm?null:t;default:return null}}function LS(t,e){if(ca)return t==="compositionend"||!$h&&C_(t,e)?(t=b_(),cc=Wh=Yr=null,ca=!1,t):null;switch(t){case"paste":return null;case"keypress":if(!(e.ctrlKey||e.altKey||e.metaKey)||e.ctrlKey&&e.altKey){if(e.char&&1<e.char.length)return e.char;if(e.which)return String.fromCharCode(e.which)}return null;case"compositionend":return R_&&e.locale!=="ko"?null:e.data;default:return null}}var DS={color:!0,date:!0,datetime:!0,"datetime-local":!0,email:!0,month:!0,number:!0,password:!0,range:!0,search:!0,tel:!0,text:!0,time:!0,url:!0,week:!0};function Rm(t){var e=t&&t.nodeName&&t.nodeName.toLowerCase();return e==="input"?!!DS[t.type]:e==="textarea"}function N_(t,e,n,i){l_(i),e=Pc(e,"onChange"),0<e.length&&(n=new jh("onChange","change",null,n,i),t.push({event:n,listeners:e}))}var bo=null,Vo=null;function IS(t){V_(t,0)}function ou(t){var e=fa(t);if(t_(e))return t}function US(t,e){if(t==="change")return e}var L_=!1;if(br){var Vu;if(br){var Gu="oninput"in document;if(!Gu){var Cm=document.createElement("div");Cm.setAttribute("oninput","return;"),Gu=typeof Cm.oninput=="function"}Vu=Gu}else Vu=!1;L_=Vu&&(!document.documentMode||9<document.documentMode)}function Pm(){bo&&(bo.detachEvent("onpropertychange",D_),Vo=bo=null)}function D_(t){if(t.propertyName==="value"&&ou(Vo)){var e=[];N_(e,Vo,t,Bh(t)),f_(IS,e)}}function FS(t,e,n){t==="focusin"?(Pm(),bo=e,Vo=n,bo.attachEvent("onpropertychange",D_)):t==="focusout"&&Pm()}function OS(t){if(t==="selectionchange"||t==="keyup"||t==="keydown")return ou(Vo)}function kS(t,e){if(t==="click")return ou(e)}function BS(t,e){if(t==="input"||t==="change")return ou(e)}function zS(t,e){return t===e&&(t!==0||1/t===1/e)||t!==t&&e!==e}var ki=typeof Object.is=="function"?Object.is:zS;function Go(t,e){if(ki(t,e))return!0;if(typeof t!="object"||t===null||typeof e!="object"||e===null)return!1;var n=Object.keys(t),i=Object.keys(e);if(n.length!==i.length)return!1;for(i=0;i<n.length;i++){var r=n[i];if(!Hd.call(e,r)||!ki(t[r],e[r]))return!1}return!0}function Nm(t){for(;t&&t.firstChild;)t=t.firstChild;return t}function Lm(t,e){var n=Nm(t);t=0;for(var i;n;){if(n.nodeType===3){if(i=t+n.textContent.length,t<=e&&i>=e)return{node:n,offset:e-t};t=i}e:{for(;n;){if(n.nextSibling){n=n.nextSibling;break e}n=n.parentNode}n=void 0}n=Nm(n)}}function I_(t,e){return t&&e?t===e?!0:t&&t.nodeType===3?!1:e&&e.nodeType===3?I_(t,e.parentNode):"contains"in t?t.contains(e):t.compareDocumentPosition?!!(t.compareDocumentPosition(e)&16):!1:!1}function U_(){for(var t=window,e=Ec();e instanceof t.HTMLIFrameElement;){try{var n=typeof e.contentWindow.location.href=="string"}catch{n=!1}if(n)t=e.contentWindow;else break;e=Ec(t.document)}return e}function qh(t){var e=t&&t.nodeName&&t.nodeName.toLowerCase();return e&&(e==="input"&&(t.type==="text"||t.type==="search"||t.type==="tel"||t.type==="url"||t.type==="password")||e==="textarea"||t.contentEditable==="true")}function HS(t){var e=U_(),n=t.focusedElem,i=t.selectionRange;if(e!==n&&n&&n.ownerDocument&&I_(n.ownerDocument.documentElement,n)){if(i!==null&&qh(n)){if(e=i.start,t=i.end,t===void 0&&(t=e),"selectionStart"in n)n.selectionStart=e,n.selectionEnd=Math.min(t,n.value.length);else if(t=(e=n.ownerDocument||document)&&e.defaultView||window,t.getSelection){t=t.getSelection();var r=n.textContent.length,s=Math.min(i.start,r);i=i.end===void 0?s:Math.min(i.end,r),!t.extend&&s>i&&(r=i,i=s,s=r),r=Lm(n,s);var a=Lm(n,i);r&&a&&(t.rangeCount!==1||t.anchorNode!==r.node||t.anchorOffset!==r.offset||t.focusNode!==a.node||t.focusOffset!==a.offset)&&(e=e.createRange(),e.setStart(r.node,r.offset),t.removeAllRanges(),s>i?(t.addRange(e),t.extend(a.node,a.offset)):(e.setEnd(a.node,a.offset),t.addRange(e)))}}for(e=[],t=n;t=t.parentNode;)t.nodeType===1&&e.push({element:t,left:t.scrollLeft,top:t.scrollTop});for(typeof n.focus=="function"&&n.focus(),n=0;n<e.length;n++)t=e[n],t.element.scrollLeft=t.left,t.element.scrollTop=t.top}}var VS=br&&"documentMode"in document&&11>=document.documentMode,ua=null,of=null,Ro=null,lf=!1;function Dm(t,e,n){var i=n.window===n?n.document:n.nodeType===9?n:n.ownerDocument;lf||ua==null||ua!==Ec(i)||(i=ua,"selectionStart"in i&&qh(i)?i={start:i.selectionStart,end:i.selectionEnd}:(i=(i.ownerDocument&&i.ownerDocument.defaultView||window).getSelection(),i={anchorNode:i.anchorNode,anchorOffset:i.anchorOffset,focusNode:i.focusNode,focusOffset:i.focusOffset}),Ro&&Go(Ro,i)||(Ro=i,i=Pc(of,"onSelect"),0<i.length&&(e=new jh("onSelect","select",null,e,n),t.push({event:e,listeners:i}),e.target=ua)))}function Ml(t,e){var n={};return n[t.toLowerCase()]=e.toLowerCase(),n["Webkit"+t]="webkit"+e,n["Moz"+t]="moz"+e,n}var da={animationend:Ml("Animation","AnimationEnd"),animationiteration:Ml("Animation","AnimationIteration"),animationstart:Ml("Animation","AnimationStart"),transitionend:Ml("Transition","TransitionEnd")},Wu={},F_={};br&&(F_=document.createElement("div").style,"AnimationEvent"in window||(delete da.animationend.animation,delete da.animationiteration.animation,delete da.animationstart.animation),"TransitionEvent"in window||delete da.transitionend.transition);function lu(t){if(Wu[t])return Wu[t];if(!da[t])return t;var e=da[t],n;for(n in e)if(e.hasOwnProperty(n)&&n in F_)return Wu[t]=e[n];return t}var O_=lu("animationend"),k_=lu("animationiteration"),B_=lu("animationstart"),z_=lu("transitionend"),H_=new Map,Im="abort auxClick cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel".split(" ");function us(t,e){H_.set(t,e),Bs(e,[t])}for(var ju=0;ju<Im.length;ju++){var Xu=Im[ju],GS=Xu.toLowerCase(),WS=Xu[0].toUpperCase()+Xu.slice(1);us(GS,"on"+WS)}us(O_,"onAnimationEnd");us(k_,"onAnimationIteration");us(B_,"onAnimationStart");us("dblclick","onDoubleClick");us("focusin","onFocus");us("focusout","onBlur");us(z_,"onTransitionEnd");La("onMouseEnter",["mouseout","mouseover"]);La("onMouseLeave",["mouseout","mouseover"]);La("onPointerEnter",["pointerout","pointerover"]);La("onPointerLeave",["pointerout","pointerover"]);Bs("onChange","change click focusin focusout input keydown keyup selectionchange".split(" "));Bs("onSelect","focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange".split(" "));Bs("onBeforeInput",["compositionend","keypress","textInput","paste"]);Bs("onCompositionEnd","compositionend focusout keydown keypress keyup mousedown".split(" "));Bs("onCompositionStart","compositionstart focusout keydown keypress keyup mousedown".split(" "));Bs("onCompositionUpdate","compositionupdate focusout keydown keypress keyup mousedown".split(" "));var yo="abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting".split(" "),jS=new Set("cancel close invalid load scroll toggle".split(" ").concat(yo));function Um(t,e,n){var i=t.type||"unknown-event";t.currentTarget=n,Gy(i,e,void 0,t),t.currentTarget=null}function V_(t,e){e=(e&4)!==0;for(var n=0;n<t.length;n++){var i=t[n],r=i.event;i=i.listeners;e:{var s=void 0;if(e)for(var a=i.length-1;0<=a;a--){var o=i[a],l=o.instance,c=o.currentTarget;if(o=o.listener,l!==s&&r.isPropagationStopped())break e;Um(r,o,c),s=l}else for(a=0;a<i.length;a++){if(o=i[a],l=o.instance,c=o.currentTarget,o=o.listener,l!==s&&r.isPropagationStopped())break e;Um(r,o,c),s=l}}}if(Tc)throw t=nf,Tc=!1,nf=null,t}function Dt(t,e){var n=e[hf];n===void 0&&(n=e[hf]=new Set);var i=t+"__bubble";n.has(i)||(G_(e,t,2,!1),n.add(i))}function $u(t,e,n){var i=0;e&&(i|=4),G_(n,t,i,e)}var El="_reactListening"+Math.random().toString(36).slice(2);function Wo(t){if(!t[El]){t[El]=!0,Kg.forEach(function(n){n!=="selectionchange"&&(jS.has(n)||$u(n,!1,t),$u(n,!0,t))});var e=t.nodeType===9?t:t.ownerDocument;e===null||e[El]||(e[El]=!0,$u("selectionchange",!1,e))}}function G_(t,e,n,i){switch(A_(e)){case 1:var r=sS;break;case 4:r=aS;break;default:r=Gh}n=r.bind(null,e,n,t),r=void 0,!tf||e!=="touchstart"&&e!=="touchmove"&&e!=="wheel"||(r=!0),i?r!==void 0?t.addEventListener(e,n,{capture:!0,passive:r}):t.addEventListener(e,n,!0):r!==void 0?t.addEventListener(e,n,{passive:r}):t.addEventListener(e,n,!1)}function qu(t,e,n,i,r){var s=i;if(!(e&1)&&!(e&2)&&i!==null)e:for(;;){if(i===null)return;var a=i.tag;if(a===3||a===4){var o=i.stateNode.containerInfo;if(o===r||o.nodeType===8&&o.parentNode===r)break;if(a===4)for(a=i.return;a!==null;){var l=a.tag;if((l===3||l===4)&&(l=a.stateNode.containerInfo,l===r||l.nodeType===8&&l.parentNode===r))return;a=a.return}for(;o!==null;){if(a=ws(o),a===null)return;if(l=a.tag,l===5||l===6){i=s=a;continue e}o=o.parentNode}}i=i.return}f_(function(){var c=s,h=Bh(n),p=[];e:{var f=H_.get(t);if(f!==void 0){var g=jh,v=t;switch(t){case"keypress":if(uc(n)===0)break e;case"keydown":case"keyup":g=SS;break;case"focusin":v="focus",g=Hu;break;case"focusout":v="blur",g=Hu;break;case"beforeblur":case"afterblur":g=Hu;break;case"click":if(n.button===2)break e;case"auxclick":case"dblclick":case"mousedown":case"mousemove":case"mouseup":case"mouseout":case"mouseover":case"contextmenu":g=Em;break;case"drag":case"dragend":case"dragenter":case"dragexit":case"dragleave":case"dragover":case"dragstart":case"drop":g=cS;break;case"touchcancel":case"touchend":case"touchmove":case"touchstart":g=wS;break;case O_:case k_:case B_:g=fS;break;case z_:g=AS;break;case"scroll":g=oS;break;case"wheel":g=RS;break;case"copy":case"cut":case"paste":g=pS;break;case"gotpointercapture":case"lostpointercapture":case"pointercancel":case"pointerdown":case"pointermove":case"pointerout":case"pointerover":case"pointerup":g=Tm}var E=(e&4)!==0,_=!E&&t==="scroll",u=E?f!==null?f+"Capture":null:f;E=[];for(var m=c,M;m!==null;){M=m;var y=M.stateNode;if(M.tag===5&&y!==null&&(M=y,u!==null&&(y=ko(m,u),y!=null&&E.push(jo(m,y,M)))),_)break;m=m.return}0<E.length&&(f=new g(f,v,null,n,h),p.push({event:f,listeners:E}))}}if(!(e&7)){e:{if(f=t==="mouseover"||t==="pointerover",g=t==="mouseout"||t==="pointerout",f&&n!==Jd&&(v=n.relatedTarget||n.fromElement)&&(ws(v)||v[Rr]))break e;if((g||f)&&(f=h.window===h?h:(f=h.ownerDocument)?f.defaultView||f.parentWindow:window,g?(v=n.relatedTarget||n.toElement,g=c,v=v?ws(v):null,v!==null&&(_=zs(v),v!==_||v.tag!==5&&v.tag!==6)&&(v=null)):(g=null,v=c),g!==v)){if(E=Em,y="onMouseLeave",u="onMouseEnter",m="mouse",(t==="pointerout"||t==="pointerover")&&(E=Tm,y="onPointerLeave",u="onPointerEnter",m="pointer"),_=g==null?f:fa(g),M=v==null?f:fa(v),f=new E(y,m+"leave",g,n,h),f.target=_,f.relatedTarget=M,y=null,ws(h)===c&&(E=new E(u,m+"enter",v,n,h),E.target=M,E.relatedTarget=_,y=E),_=y,g&&v)t:{for(E=g,u=v,m=0,M=E;M;M=js(M))m++;for(M=0,y=u;y;y=js(y))M++;for(;0<m-M;)E=js(E),m--;for(;0<M-m;)u=js(u),M--;for(;m--;){if(E===u||u!==null&&E===u.alternate)break t;E=js(E),u=js(u)}E=null}else E=null;g!==null&&Fm(p,f,g,E,!1),v!==null&&_!==null&&Fm(p,_,v,E,!0)}}e:{if(f=c?fa(c):window,g=f.nodeName&&f.nodeName.toLowerCase(),g==="select"||g==="input"&&f.type==="file")var T=US;else if(Rm(f))if(L_)T=BS;else{T=OS;var w=FS}else(g=f.nodeName)&&g.toLowerCase()==="input"&&(f.type==="checkbox"||f.type==="radio")&&(T=kS);if(T&&(T=T(t,c))){N_(p,T,n,h);break e}w&&w(t,f,c),t==="focusout"&&(w=f._wrapperState)&&w.controlled&&f.type==="number"&&qd(f,"number",f.value)}switch(w=c?fa(c):window,t){case"focusin":(Rm(w)||w.contentEditable==="true")&&(ua=w,of=c,Ro=null);break;case"focusout":Ro=of=ua=null;break;case"mousedown":lf=!0;break;case"contextmenu":case"mouseup":case"dragend":lf=!1,Dm(p,n,h);break;case"selectionchange":if(VS)break;case"keydown":case"keyup":Dm(p,n,h)}var R;if($h)e:{switch(t){case"compositionstart":var x="onCompositionStart";break e;case"compositionend":x="onCompositionEnd";break e;case"compositionupdate":x="onCompositionUpdate";break e}x=void 0}else ca?C_(t,n)&&(x="onCompositionEnd"):t==="keydown"&&n.keyCode===229&&(x="onCompositionStart");x&&(R_&&n.locale!=="ko"&&(ca||x!=="onCompositionStart"?x==="onCompositionEnd"&&ca&&(R=b_()):(Yr=h,Wh="value"in Yr?Yr.value:Yr.textContent,ca=!0)),w=Pc(c,x),0<w.length&&(x=new wm(x,t,null,n,h),p.push({event:x,listeners:w}),R?x.data=R:(R=P_(n),R!==null&&(x.data=R)))),(R=PS?NS(t,n):LS(t,n))&&(c=Pc(c,"onBeforeInput"),0<c.length&&(h=new wm("onBeforeInput","beforeinput",null,n,h),p.push({event:h,listeners:c}),h.data=R))}V_(p,e)})}function jo(t,e,n){return{instance:t,listener:e,currentTarget:n}}function Pc(t,e){for(var n=e+"Capture",i=[];t!==null;){var r=t,s=r.stateNode;r.tag===5&&s!==null&&(r=s,s=ko(t,n),s!=null&&i.unshift(jo(t,s,r)),s=ko(t,e),s!=null&&i.push(jo(t,s,r))),t=t.return}return i}function js(t){if(t===null)return null;do t=t.return;while(t&&t.tag!==5);return t||null}function Fm(t,e,n,i,r){for(var s=e._reactName,a=[];n!==null&&n!==i;){var o=n,l=o.alternate,c=o.stateNode;if(l!==null&&l===i)break;o.tag===5&&c!==null&&(o=c,r?(l=ko(n,s),l!=null&&a.unshift(jo(n,l,o))):r||(l=ko(n,s),l!=null&&a.push(jo(n,l,o)))),n=n.return}a.length!==0&&t.push({event:e,listeners:a})}var XS=/\r\n?/g,$S=/\u0000|\uFFFD/g;function Om(t){return(typeof t=="string"?t:""+t).replace(XS,`
`).replace($S,"")}function wl(t,e,n){if(e=Om(e),Om(t)!==e&&n)throw Error(ce(425))}function Nc(){}var cf=null,uf=null;function df(t,e){return t==="textarea"||t==="noscript"||typeof e.children=="string"||typeof e.children=="number"||typeof e.dangerouslySetInnerHTML=="object"&&e.dangerouslySetInnerHTML!==null&&e.dangerouslySetInnerHTML.__html!=null}var ff=typeof setTimeout=="function"?setTimeout:void 0,qS=typeof clearTimeout=="function"?clearTimeout:void 0,km=typeof Promise=="function"?Promise:void 0,YS=typeof queueMicrotask=="function"?queueMicrotask:typeof km<"u"?function(t){return km.resolve(null).then(t).catch(KS)}:ff;function KS(t){setTimeout(function(){throw t})}function Yu(t,e){var n=e,i=0;do{var r=n.nextSibling;if(t.removeChild(n),r&&r.nodeType===8)if(n=r.data,n==="/$"){if(i===0){t.removeChild(r),Ho(e);return}i--}else n!=="$"&&n!=="$?"&&n!=="$!"||i++;n=r}while(n);Ho(e)}function ts(t){for(;t!=null;t=t.nextSibling){var e=t.nodeType;if(e===1||e===3)break;if(e===8){if(e=t.data,e==="$"||e==="$!"||e==="$?")break;if(e==="/$")return null}}return t}function Bm(t){t=t.previousSibling;for(var e=0;t;){if(t.nodeType===8){var n=t.data;if(n==="$"||n==="$!"||n==="$?"){if(e===0)return t;e--}else n==="/$"&&e++}t=t.previousSibling}return null}var Wa=Math.random().toString(36).slice(2),Ji="__reactFiber$"+Wa,Xo="__reactProps$"+Wa,Rr="__reactContainer$"+Wa,hf="__reactEvents$"+Wa,ZS="__reactListeners$"+Wa,QS="__reactHandles$"+Wa;function ws(t){var e=t[Ji];if(e)return e;for(var n=t.parentNode;n;){if(e=n[Rr]||n[Ji]){if(n=e.alternate,e.child!==null||n!==null&&n.child!==null)for(t=Bm(t);t!==null;){if(n=t[Ji])return n;t=Bm(t)}return e}t=n,n=t.parentNode}return null}function ol(t){return t=t[Ji]||t[Rr],!t||t.tag!==5&&t.tag!==6&&t.tag!==13&&t.tag!==3?null:t}function fa(t){if(t.tag===5||t.tag===6)return t.stateNode;throw Error(ce(33))}function cu(t){return t[Xo]||null}var pf=[],ha=-1;function ds(t){return{current:t}}function Ut(t){0>ha||(t.current=pf[ha],pf[ha]=null,ha--)}function Nt(t,e){ha++,pf[ha]=t.current,t.current=e}var os={},Rn=ds(os),Wn=ds(!1),Ns=os;function Da(t,e){var n=t.type.contextTypes;if(!n)return os;var i=t.stateNode;if(i&&i.__reactInternalMemoizedUnmaskedChildContext===e)return i.__reactInternalMemoizedMaskedChildContext;var r={},s;for(s in n)r[s]=e[s];return i&&(t=t.stateNode,t.__reactInternalMemoizedUnmaskedChildContext=e,t.__reactInternalMemoizedMaskedChildContext=r),r}function jn(t){return t=t.childContextTypes,t!=null}function Lc(){Ut(Wn),Ut(Rn)}function zm(t,e,n){if(Rn.current!==os)throw Error(ce(168));Nt(Rn,e),Nt(Wn,n)}function W_(t,e,n){var i=t.stateNode;if(e=e.childContextTypes,typeof i.getChildContext!="function")return n;i=i.getChildContext();for(var r in i)if(!(r in e))throw Error(ce(108,Fy(t)||"Unknown",r));return jt({},n,i)}function Dc(t){return t=(t=t.stateNode)&&t.__reactInternalMemoizedMergedChildContext||os,Ns=Rn.current,Nt(Rn,t),Nt(Wn,Wn.current),!0}function Hm(t,e,n){var i=t.stateNode;if(!i)throw Error(ce(169));n?(t=W_(t,e,Ns),i.__reactInternalMemoizedMergedChildContext=t,Ut(Wn),Ut(Rn),Nt(Rn,t)):Ut(Wn),Nt(Wn,n)}var vr=null,uu=!1,Ku=!1;function j_(t){vr===null?vr=[t]:vr.push(t)}function JS(t){uu=!0,j_(t)}function fs(){if(!Ku&&vr!==null){Ku=!0;var t=0,e=bt;try{var n=vr;for(bt=1;t<n.length;t++){var i=n[t];do i=i(!0);while(i!==null)}vr=null,uu=!1}catch(r){throw vr!==null&&(vr=vr.slice(t+1)),g_(zh,fs),r}finally{bt=e,Ku=!1}}return null}var pa=[],ma=0,Ic=null,Uc=0,hi=[],pi=0,Ls=null,yr=1,Sr="";function Ms(t,e){pa[ma++]=Uc,pa[ma++]=Ic,Ic=t,Uc=e}function X_(t,e,n){hi[pi++]=yr,hi[pi++]=Sr,hi[pi++]=Ls,Ls=t;var i=yr;t=Sr;var r=32-Ui(i)-1;i&=~(1<<r),n+=1;var s=32-Ui(e)+r;if(30<s){var a=r-r%5;s=(i&(1<<a)-1).toString(32),i>>=a,r-=a,yr=1<<32-Ui(e)+r|n<<r|i,Sr=s+t}else yr=1<<s|n<<r|i,Sr=t}function Yh(t){t.return!==null&&(Ms(t,1),X_(t,1,0))}function Kh(t){for(;t===Ic;)Ic=pa[--ma],pa[ma]=null,Uc=pa[--ma],pa[ma]=null;for(;t===Ls;)Ls=hi[--pi],hi[pi]=null,Sr=hi[--pi],hi[pi]=null,yr=hi[--pi],hi[pi]=null}var ri=null,ni=null,Ot=!1,Ni=null;function $_(t,e){var n=gi(5,null,null,0);n.elementType="DELETED",n.stateNode=e,n.return=t,e=t.deletions,e===null?(t.deletions=[n],t.flags|=16):e.push(n)}function Vm(t,e){switch(t.tag){case 5:var n=t.type;return e=e.nodeType!==1||n.toLowerCase()!==e.nodeName.toLowerCase()?null:e,e!==null?(t.stateNode=e,ri=t,ni=ts(e.firstChild),!0):!1;case 6:return e=t.pendingProps===""||e.nodeType!==3?null:e,e!==null?(t.stateNode=e,ri=t,ni=null,!0):!1;case 13:return e=e.nodeType!==8?null:e,e!==null?(n=Ls!==null?{id:yr,overflow:Sr}:null,t.memoizedState={dehydrated:e,treeContext:n,retryLane:1073741824},n=gi(18,null,null,0),n.stateNode=e,n.return=t,t.child=n,ri=t,ni=null,!0):!1;default:return!1}}function mf(t){return(t.mode&1)!==0&&(t.flags&128)===0}function gf(t){if(Ot){var e=ni;if(e){var n=e;if(!Vm(t,e)){if(mf(t))throw Error(ce(418));e=ts(n.nextSibling);var i=ri;e&&Vm(t,e)?$_(i,n):(t.flags=t.flags&-4097|2,Ot=!1,ri=t)}}else{if(mf(t))throw Error(ce(418));t.flags=t.flags&-4097|2,Ot=!1,ri=t}}}function Gm(t){for(t=t.return;t!==null&&t.tag!==5&&t.tag!==3&&t.tag!==13;)t=t.return;ri=t}function Tl(t){if(t!==ri)return!1;if(!Ot)return Gm(t),Ot=!0,!1;var e;if((e=t.tag!==3)&&!(e=t.tag!==5)&&(e=t.type,e=e!=="head"&&e!=="body"&&!df(t.type,t.memoizedProps)),e&&(e=ni)){if(mf(t))throw q_(),Error(ce(418));for(;e;)$_(t,e),e=ts(e.nextSibling)}if(Gm(t),t.tag===13){if(t=t.memoizedState,t=t!==null?t.dehydrated:null,!t)throw Error(ce(317));e:{for(t=t.nextSibling,e=0;t;){if(t.nodeType===8){var n=t.data;if(n==="/$"){if(e===0){ni=ts(t.nextSibling);break e}e--}else n!=="$"&&n!=="$!"&&n!=="$?"||e++}t=t.nextSibling}ni=null}}else ni=ri?ts(t.stateNode.nextSibling):null;return!0}function q_(){for(var t=ni;t;)t=ts(t.nextSibling)}function Ia(){ni=ri=null,Ot=!1}function Zh(t){Ni===null?Ni=[t]:Ni.push(t)}var eM=Dr.ReactCurrentBatchConfig;function so(t,e,n){if(t=n.ref,t!==null&&typeof t!="function"&&typeof t!="object"){if(n._owner){if(n=n._owner,n){if(n.tag!==1)throw Error(ce(309));var i=n.stateNode}if(!i)throw Error(ce(147,t));var r=i,s=""+t;return e!==null&&e.ref!==null&&typeof e.ref=="function"&&e.ref._stringRef===s?e.ref:(e=function(a){var o=r.refs;a===null?delete o[s]:o[s]=a},e._stringRef=s,e)}if(typeof t!="string")throw Error(ce(284));if(!n._owner)throw Error(ce(290,t))}return t}function Al(t,e){throw t=Object.prototype.toString.call(e),Error(ce(31,t==="[object Object]"?"object with keys {"+Object.keys(e).join(", ")+"}":t))}function Wm(t){var e=t._init;return e(t._payload)}function Y_(t){function e(u,m){if(t){var M=u.deletions;M===null?(u.deletions=[m],u.flags|=16):M.push(m)}}function n(u,m){if(!t)return null;for(;m!==null;)e(u,m),m=m.sibling;return null}function i(u,m){for(u=new Map;m!==null;)m.key!==null?u.set(m.key,m):u.set(m.index,m),m=m.sibling;return u}function r(u,m){return u=ss(u,m),u.index=0,u.sibling=null,u}function s(u,m,M){return u.index=M,t?(M=u.alternate,M!==null?(M=M.index,M<m?(u.flags|=2,m):M):(u.flags|=2,m)):(u.flags|=1048576,m)}function a(u){return t&&u.alternate===null&&(u.flags|=2),u}function o(u,m,M,y){return m===null||m.tag!==6?(m=id(M,u.mode,y),m.return=u,m):(m=r(m,M),m.return=u,m)}function l(u,m,M,y){var T=M.type;return T===la?h(u,m,M.props.children,y,M.key):m!==null&&(m.elementType===T||typeof T=="object"&&T!==null&&T.$$typeof===Wr&&Wm(T)===m.type)?(y=r(m,M.props),y.ref=so(u,m,M),y.return=u,y):(y=_c(M.type,M.key,M.props,null,u.mode,y),y.ref=so(u,m,M),y.return=u,y)}function c(u,m,M,y){return m===null||m.tag!==4||m.stateNode.containerInfo!==M.containerInfo||m.stateNode.implementation!==M.implementation?(m=rd(M,u.mode,y),m.return=u,m):(m=r(m,M.children||[]),m.return=u,m)}function h(u,m,M,y,T){return m===null||m.tag!==7?(m=Ps(M,u.mode,y,T),m.return=u,m):(m=r(m,M),m.return=u,m)}function p(u,m,M){if(typeof m=="string"&&m!==""||typeof m=="number")return m=id(""+m,u.mode,M),m.return=u,m;if(typeof m=="object"&&m!==null){switch(m.$$typeof){case ml:return M=_c(m.type,m.key,m.props,null,u.mode,M),M.ref=so(u,null,m),M.return=u,M;case oa:return m=rd(m,u.mode,M),m.return=u,m;case Wr:var y=m._init;return p(u,y(m._payload),M)}if(vo(m)||eo(m))return m=Ps(m,u.mode,M,null),m.return=u,m;Al(u,m)}return null}function f(u,m,M,y){var T=m!==null?m.key:null;if(typeof M=="string"&&M!==""||typeof M=="number")return T!==null?null:o(u,m,""+M,y);if(typeof M=="object"&&M!==null){switch(M.$$typeof){case ml:return M.key===T?l(u,m,M,y):null;case oa:return M.key===T?c(u,m,M,y):null;case Wr:return T=M._init,f(u,m,T(M._payload),y)}if(vo(M)||eo(M))return T!==null?null:h(u,m,M,y,null);Al(u,M)}return null}function g(u,m,M,y,T){if(typeof y=="string"&&y!==""||typeof y=="number")return u=u.get(M)||null,o(m,u,""+y,T);if(typeof y=="object"&&y!==null){switch(y.$$typeof){case ml:return u=u.get(y.key===null?M:y.key)||null,l(m,u,y,T);case oa:return u=u.get(y.key===null?M:y.key)||null,c(m,u,y,T);case Wr:var w=y._init;return g(u,m,M,w(y._payload),T)}if(vo(y)||eo(y))return u=u.get(M)||null,h(m,u,y,T,null);Al(m,y)}return null}function v(u,m,M,y){for(var T=null,w=null,R=m,x=m=0,A=null;R!==null&&x<M.length;x++){R.index>x?(A=R,R=null):A=R.sibling;var P=f(u,R,M[x],y);if(P===null){R===null&&(R=A);break}t&&R&&P.alternate===null&&e(u,R),m=s(P,m,x),w===null?T=P:w.sibling=P,w=P,R=A}if(x===M.length)return n(u,R),Ot&&Ms(u,x),T;if(R===null){for(;x<M.length;x++)R=p(u,M[x],y),R!==null&&(m=s(R,m,x),w===null?T=R:w.sibling=R,w=R);return Ot&&Ms(u,x),T}for(R=i(u,R);x<M.length;x++)A=g(R,u,x,M[x],y),A!==null&&(t&&A.alternate!==null&&R.delete(A.key===null?x:A.key),m=s(A,m,x),w===null?T=A:w.sibling=A,w=A);return t&&R.forEach(function(L){return e(u,L)}),Ot&&Ms(u,x),T}function E(u,m,M,y){var T=eo(M);if(typeof T!="function")throw Error(ce(150));if(M=T.call(M),M==null)throw Error(ce(151));for(var w=T=null,R=m,x=m=0,A=null,P=M.next();R!==null&&!P.done;x++,P=M.next()){R.index>x?(A=R,R=null):A=R.sibling;var L=f(u,R,P.value,y);if(L===null){R===null&&(R=A);break}t&&R&&L.alternate===null&&e(u,R),m=s(L,m,x),w===null?T=L:w.sibling=L,w=L,R=A}if(P.done)return n(u,R),Ot&&Ms(u,x),T;if(R===null){for(;!P.done;x++,P=M.next())P=p(u,P.value,y),P!==null&&(m=s(P,m,x),w===null?T=P:w.sibling=P,w=P);return Ot&&Ms(u,x),T}for(R=i(u,R);!P.done;x++,P=M.next())P=g(R,u,x,P.value,y),P!==null&&(t&&P.alternate!==null&&R.delete(P.key===null?x:P.key),m=s(P,m,x),w===null?T=P:w.sibling=P,w=P);return t&&R.forEach(function(B){return e(u,B)}),Ot&&Ms(u,x),T}function _(u,m,M,y){if(typeof M=="object"&&M!==null&&M.type===la&&M.key===null&&(M=M.props.children),typeof M=="object"&&M!==null){switch(M.$$typeof){case ml:e:{for(var T=M.key,w=m;w!==null;){if(w.key===T){if(T=M.type,T===la){if(w.tag===7){n(u,w.sibling),m=r(w,M.props.children),m.return=u,u=m;break e}}else if(w.elementType===T||typeof T=="object"&&T!==null&&T.$$typeof===Wr&&Wm(T)===w.type){n(u,w.sibling),m=r(w,M.props),m.ref=so(u,w,M),m.return=u,u=m;break e}n(u,w);break}else e(u,w);w=w.sibling}M.type===la?(m=Ps(M.props.children,u.mode,y,M.key),m.return=u,u=m):(y=_c(M.type,M.key,M.props,null,u.mode,y),y.ref=so(u,m,M),y.return=u,u=y)}return a(u);case oa:e:{for(w=M.key;m!==null;){if(m.key===w)if(m.tag===4&&m.stateNode.containerInfo===M.containerInfo&&m.stateNode.implementation===M.implementation){n(u,m.sibling),m=r(m,M.children||[]),m.return=u,u=m;break e}else{n(u,m);break}else e(u,m);m=m.sibling}m=rd(M,u.mode,y),m.return=u,u=m}return a(u);case Wr:return w=M._init,_(u,m,w(M._payload),y)}if(vo(M))return v(u,m,M,y);if(eo(M))return E(u,m,M,y);Al(u,M)}return typeof M=="string"&&M!==""||typeof M=="number"?(M=""+M,m!==null&&m.tag===6?(n(u,m.sibling),m=r(m,M),m.return=u,u=m):(n(u,m),m=id(M,u.mode,y),m.return=u,u=m),a(u)):n(u,m)}return _}var Ua=Y_(!0),K_=Y_(!1),Fc=ds(null),Oc=null,ga=null,Qh=null;function Jh(){Qh=ga=Oc=null}function ep(t){var e=Fc.current;Ut(Fc),t._currentValue=e}function _f(t,e,n){for(;t!==null;){var i=t.alternate;if((t.childLanes&e)!==e?(t.childLanes|=e,i!==null&&(i.childLanes|=e)):i!==null&&(i.childLanes&e)!==e&&(i.childLanes|=e),t===n)break;t=t.return}}function Aa(t,e){Oc=t,Qh=ga=null,t=t.dependencies,t!==null&&t.firstContext!==null&&(t.lanes&e&&(Gn=!0),t.firstContext=null)}function vi(t){var e=t._currentValue;if(Qh!==t)if(t={context:t,memoizedValue:e,next:null},ga===null){if(Oc===null)throw Error(ce(308));ga=t,Oc.dependencies={lanes:0,firstContext:t}}else ga=ga.next=t;return e}var Ts=null;function tp(t){Ts===null?Ts=[t]:Ts.push(t)}function Z_(t,e,n,i){var r=e.interleaved;return r===null?(n.next=n,tp(e)):(n.next=r.next,r.next=n),e.interleaved=n,Cr(t,i)}function Cr(t,e){t.lanes|=e;var n=t.alternate;for(n!==null&&(n.lanes|=e),n=t,t=t.return;t!==null;)t.childLanes|=e,n=t.alternate,n!==null&&(n.childLanes|=e),n=t,t=t.return;return n.tag===3?n.stateNode:null}var jr=!1;function np(t){t.updateQueue={baseState:t.memoizedState,firstBaseUpdate:null,lastBaseUpdate:null,shared:{pending:null,interleaved:null,lanes:0},effects:null}}function Q_(t,e){t=t.updateQueue,e.updateQueue===t&&(e.updateQueue={baseState:t.baseState,firstBaseUpdate:t.firstBaseUpdate,lastBaseUpdate:t.lastBaseUpdate,shared:t.shared,effects:t.effects})}function Er(t,e){return{eventTime:t,lane:e,tag:0,payload:null,callback:null,next:null}}function ns(t,e,n){var i=t.updateQueue;if(i===null)return null;if(i=i.shared,_t&2){var r=i.pending;return r===null?e.next=e:(e.next=r.next,r.next=e),i.pending=e,Cr(t,n)}return r=i.interleaved,r===null?(e.next=e,tp(i)):(e.next=r.next,r.next=e),i.interleaved=e,Cr(t,n)}function dc(t,e,n){if(e=e.updateQueue,e!==null&&(e=e.shared,(n&4194240)!==0)){var i=e.lanes;i&=t.pendingLanes,n|=i,e.lanes=n,Hh(t,n)}}function jm(t,e){var n=t.updateQueue,i=t.alternate;if(i!==null&&(i=i.updateQueue,n===i)){var r=null,s=null;if(n=n.firstBaseUpdate,n!==null){do{var a={eventTime:n.eventTime,lane:n.lane,tag:n.tag,payload:n.payload,callback:n.callback,next:null};s===null?r=s=a:s=s.next=a,n=n.next}while(n!==null);s===null?r=s=e:s=s.next=e}else r=s=e;n={baseState:i.baseState,firstBaseUpdate:r,lastBaseUpdate:s,shared:i.shared,effects:i.effects},t.updateQueue=n;return}t=n.lastBaseUpdate,t===null?n.firstBaseUpdate=e:t.next=e,n.lastBaseUpdate=e}function kc(t,e,n,i){var r=t.updateQueue;jr=!1;var s=r.firstBaseUpdate,a=r.lastBaseUpdate,o=r.shared.pending;if(o!==null){r.shared.pending=null;var l=o,c=l.next;l.next=null,a===null?s=c:a.next=c,a=l;var h=t.alternate;h!==null&&(h=h.updateQueue,o=h.lastBaseUpdate,o!==a&&(o===null?h.firstBaseUpdate=c:o.next=c,h.lastBaseUpdate=l))}if(s!==null){var p=r.baseState;a=0,h=c=l=null,o=s;do{var f=o.lane,g=o.eventTime;if((i&f)===f){h!==null&&(h=h.next={eventTime:g,lane:0,tag:o.tag,payload:o.payload,callback:o.callback,next:null});e:{var v=t,E=o;switch(f=e,g=n,E.tag){case 1:if(v=E.payload,typeof v=="function"){p=v.call(g,p,f);break e}p=v;break e;case 3:v.flags=v.flags&-65537|128;case 0:if(v=E.payload,f=typeof v=="function"?v.call(g,p,f):v,f==null)break e;p=jt({},p,f);break e;case 2:jr=!0}}o.callback!==null&&o.lane!==0&&(t.flags|=64,f=r.effects,f===null?r.effects=[o]:f.push(o))}else g={eventTime:g,lane:f,tag:o.tag,payload:o.payload,callback:o.callback,next:null},h===null?(c=h=g,l=p):h=h.next=g,a|=f;if(o=o.next,o===null){if(o=r.shared.pending,o===null)break;f=o,o=f.next,f.next=null,r.lastBaseUpdate=f,r.shared.pending=null}}while(!0);if(h===null&&(l=p),r.baseState=l,r.firstBaseUpdate=c,r.lastBaseUpdate=h,e=r.shared.interleaved,e!==null){r=e;do a|=r.lane,r=r.next;while(r!==e)}else s===null&&(r.shared.lanes=0);Is|=a,t.lanes=a,t.memoizedState=p}}function Xm(t,e,n){if(t=e.effects,e.effects=null,t!==null)for(e=0;e<t.length;e++){var i=t[e],r=i.callback;if(r!==null){if(i.callback=null,i=n,typeof r!="function")throw Error(ce(191,r));r.call(i)}}}var ll={},rr=ds(ll),$o=ds(ll),qo=ds(ll);function As(t){if(t===ll)throw Error(ce(174));return t}function ip(t,e){switch(Nt(qo,e),Nt($o,t),Nt(rr,ll),t=e.nodeType,t){case 9:case 11:e=(e=e.documentElement)?e.namespaceURI:Kd(null,"");break;default:t=t===8?e.parentNode:e,e=t.namespaceURI||null,t=t.tagName,e=Kd(e,t)}Ut(rr),Nt(rr,e)}function Fa(){Ut(rr),Ut($o),Ut(qo)}function J_(t){As(qo.current);var e=As(rr.current),n=Kd(e,t.type);e!==n&&(Nt($o,t),Nt(rr,n))}function rp(t){$o.current===t&&(Ut(rr),Ut($o))}var Vt=ds(0);function Bc(t){for(var e=t;e!==null;){if(e.tag===13){var n=e.memoizedState;if(n!==null&&(n=n.dehydrated,n===null||n.data==="$?"||n.data==="$!"))return e}else if(e.tag===19&&e.memoizedProps.revealOrder!==void 0){if(e.flags&128)return e}else if(e.child!==null){e.child.return=e,e=e.child;continue}if(e===t)break;for(;e.sibling===null;){if(e.return===null||e.return===t)return null;e=e.return}e.sibling.return=e.return,e=e.sibling}return null}var Zu=[];function sp(){for(var t=0;t<Zu.length;t++)Zu[t]._workInProgressVersionPrimary=null;Zu.length=0}var fc=Dr.ReactCurrentDispatcher,Qu=Dr.ReactCurrentBatchConfig,Ds=0,Wt=null,tn=null,dn=null,zc=!1,Co=!1,Yo=0,tM=0;function yn(){throw Error(ce(321))}function ap(t,e){if(e===null)return!1;for(var n=0;n<e.length&&n<t.length;n++)if(!ki(t[n],e[n]))return!1;return!0}function op(t,e,n,i,r,s){if(Ds=s,Wt=e,e.memoizedState=null,e.updateQueue=null,e.lanes=0,fc.current=t===null||t.memoizedState===null?sM:aM,t=n(i,r),Co){s=0;do{if(Co=!1,Yo=0,25<=s)throw Error(ce(301));s+=1,dn=tn=null,e.updateQueue=null,fc.current=oM,t=n(i,r)}while(Co)}if(fc.current=Hc,e=tn!==null&&tn.next!==null,Ds=0,dn=tn=Wt=null,zc=!1,e)throw Error(ce(300));return t}function lp(){var t=Yo!==0;return Yo=0,t}function Ki(){var t={memoizedState:null,baseState:null,baseQueue:null,queue:null,next:null};return dn===null?Wt.memoizedState=dn=t:dn=dn.next=t,dn}function xi(){if(tn===null){var t=Wt.alternate;t=t!==null?t.memoizedState:null}else t=tn.next;var e=dn===null?Wt.memoizedState:dn.next;if(e!==null)dn=e,tn=t;else{if(t===null)throw Error(ce(310));tn=t,t={memoizedState:tn.memoizedState,baseState:tn.baseState,baseQueue:tn.baseQueue,queue:tn.queue,next:null},dn===null?Wt.memoizedState=dn=t:dn=dn.next=t}return dn}function Ko(t,e){return typeof e=="function"?e(t):e}function Ju(t){var e=xi(),n=e.queue;if(n===null)throw Error(ce(311));n.lastRenderedReducer=t;var i=tn,r=i.baseQueue,s=n.pending;if(s!==null){if(r!==null){var a=r.next;r.next=s.next,s.next=a}i.baseQueue=r=s,n.pending=null}if(r!==null){s=r.next,i=i.baseState;var o=a=null,l=null,c=s;do{var h=c.lane;if((Ds&h)===h)l!==null&&(l=l.next={lane:0,action:c.action,hasEagerState:c.hasEagerState,eagerState:c.eagerState,next:null}),i=c.hasEagerState?c.eagerState:t(i,c.action);else{var p={lane:h,action:c.action,hasEagerState:c.hasEagerState,eagerState:c.eagerState,next:null};l===null?(o=l=p,a=i):l=l.next=p,Wt.lanes|=h,Is|=h}c=c.next}while(c!==null&&c!==s);l===null?a=i:l.next=o,ki(i,e.memoizedState)||(Gn=!0),e.memoizedState=i,e.baseState=a,e.baseQueue=l,n.lastRenderedState=i}if(t=n.interleaved,t!==null){r=t;do s=r.lane,Wt.lanes|=s,Is|=s,r=r.next;while(r!==t)}else r===null&&(n.lanes=0);return[e.memoizedState,n.dispatch]}function ed(t){var e=xi(),n=e.queue;if(n===null)throw Error(ce(311));n.lastRenderedReducer=t;var i=n.dispatch,r=n.pending,s=e.memoizedState;if(r!==null){n.pending=null;var a=r=r.next;do s=t(s,a.action),a=a.next;while(a!==r);ki(s,e.memoizedState)||(Gn=!0),e.memoizedState=s,e.baseQueue===null&&(e.baseState=s),n.lastRenderedState=s}return[s,i]}function ev(){}function tv(t,e){var n=Wt,i=xi(),r=e(),s=!ki(i.memoizedState,r);if(s&&(i.memoizedState=r,Gn=!0),i=i.queue,cp(rv.bind(null,n,i,t),[t]),i.getSnapshot!==e||s||dn!==null&&dn.memoizedState.tag&1){if(n.flags|=2048,Zo(9,iv.bind(null,n,i,r,e),void 0,null),fn===null)throw Error(ce(349));Ds&30||nv(n,e,r)}return r}function nv(t,e,n){t.flags|=16384,t={getSnapshot:e,value:n},e=Wt.updateQueue,e===null?(e={lastEffect:null,stores:null},Wt.updateQueue=e,e.stores=[t]):(n=e.stores,n===null?e.stores=[t]:n.push(t))}function iv(t,e,n,i){e.value=n,e.getSnapshot=i,sv(e)&&av(t)}function rv(t,e,n){return n(function(){sv(e)&&av(t)})}function sv(t){var e=t.getSnapshot;t=t.value;try{var n=e();return!ki(t,n)}catch{return!0}}function av(t){var e=Cr(t,1);e!==null&&Fi(e,t,1,-1)}function $m(t){var e=Ki();return typeof t=="function"&&(t=t()),e.memoizedState=e.baseState=t,t={pending:null,interleaved:null,lanes:0,dispatch:null,lastRenderedReducer:Ko,lastRenderedState:t},e.queue=t,t=t.dispatch=rM.bind(null,Wt,t),[e.memoizedState,t]}function Zo(t,e,n,i){return t={tag:t,create:e,destroy:n,deps:i,next:null},e=Wt.updateQueue,e===null?(e={lastEffect:null,stores:null},Wt.updateQueue=e,e.lastEffect=t.next=t):(n=e.lastEffect,n===null?e.lastEffect=t.next=t:(i=n.next,n.next=t,t.next=i,e.lastEffect=t)),t}function ov(){return xi().memoizedState}function hc(t,e,n,i){var r=Ki();Wt.flags|=t,r.memoizedState=Zo(1|e,n,void 0,i===void 0?null:i)}function du(t,e,n,i){var r=xi();i=i===void 0?null:i;var s=void 0;if(tn!==null){var a=tn.memoizedState;if(s=a.destroy,i!==null&&ap(i,a.deps)){r.memoizedState=Zo(e,n,s,i);return}}Wt.flags|=t,r.memoizedState=Zo(1|e,n,s,i)}function qm(t,e){return hc(8390656,8,t,e)}function cp(t,e){return du(2048,8,t,e)}function lv(t,e){return du(4,2,t,e)}function cv(t,e){return du(4,4,t,e)}function uv(t,e){if(typeof e=="function")return t=t(),e(t),function(){e(null)};if(e!=null)return t=t(),e.current=t,function(){e.current=null}}function dv(t,e,n){return n=n!=null?n.concat([t]):null,du(4,4,uv.bind(null,e,t),n)}function up(){}function fv(t,e){var n=xi();e=e===void 0?null:e;var i=n.memoizedState;return i!==null&&e!==null&&ap(e,i[1])?i[0]:(n.memoizedState=[t,e],t)}function hv(t,e){var n=xi();e=e===void 0?null:e;var i=n.memoizedState;return i!==null&&e!==null&&ap(e,i[1])?i[0]:(t=t(),n.memoizedState=[t,e],t)}function pv(t,e,n){return Ds&21?(ki(n,e)||(n=x_(),Wt.lanes|=n,Is|=n,t.baseState=!0),e):(t.baseState&&(t.baseState=!1,Gn=!0),t.memoizedState=n)}function nM(t,e){var n=bt;bt=n!==0&&4>n?n:4,t(!0);var i=Qu.transition;Qu.transition={};try{t(!1),e()}finally{bt=n,Qu.transition=i}}function mv(){return xi().memoizedState}function iM(t,e,n){var i=rs(t);if(n={lane:i,action:n,hasEagerState:!1,eagerState:null,next:null},gv(t))_v(e,n);else if(n=Z_(t,e,n,i),n!==null){var r=Dn();Fi(n,t,i,r),vv(n,e,i)}}function rM(t,e,n){var i=rs(t),r={lane:i,action:n,hasEagerState:!1,eagerState:null,next:null};if(gv(t))_v(e,r);else{var s=t.alternate;if(t.lanes===0&&(s===null||s.lanes===0)&&(s=e.lastRenderedReducer,s!==null))try{var a=e.lastRenderedState,o=s(a,n);if(r.hasEagerState=!0,r.eagerState=o,ki(o,a)){var l=e.interleaved;l===null?(r.next=r,tp(e)):(r.next=l.next,l.next=r),e.interleaved=r;return}}catch{}finally{}n=Z_(t,e,r,i),n!==null&&(r=Dn(),Fi(n,t,i,r),vv(n,e,i))}}function gv(t){var e=t.alternate;return t===Wt||e!==null&&e===Wt}function _v(t,e){Co=zc=!0;var n=t.pending;n===null?e.next=e:(e.next=n.next,n.next=e),t.pending=e}function vv(t,e,n){if(n&4194240){var i=e.lanes;i&=t.pendingLanes,n|=i,e.lanes=n,Hh(t,n)}}var Hc={readContext:vi,useCallback:yn,useContext:yn,useEffect:yn,useImperativeHandle:yn,useInsertionEffect:yn,useLayoutEffect:yn,useMemo:yn,useReducer:yn,useRef:yn,useState:yn,useDebugValue:yn,useDeferredValue:yn,useTransition:yn,useMutableSource:yn,useSyncExternalStore:yn,useId:yn,unstable_isNewReconciler:!1},sM={readContext:vi,useCallback:function(t,e){return Ki().memoizedState=[t,e===void 0?null:e],t},useContext:vi,useEffect:qm,useImperativeHandle:function(t,e,n){return n=n!=null?n.concat([t]):null,hc(4194308,4,uv.bind(null,e,t),n)},useLayoutEffect:function(t,e){return hc(4194308,4,t,e)},useInsertionEffect:function(t,e){return hc(4,2,t,e)},useMemo:function(t,e){var n=Ki();return e=e===void 0?null:e,t=t(),n.memoizedState=[t,e],t},useReducer:function(t,e,n){var i=Ki();return e=n!==void 0?n(e):e,i.memoizedState=i.baseState=e,t={pending:null,interleaved:null,lanes:0,dispatch:null,lastRenderedReducer:t,lastRenderedState:e},i.queue=t,t=t.dispatch=iM.bind(null,Wt,t),[i.memoizedState,t]},useRef:function(t){var e=Ki();return t={current:t},e.memoizedState=t},useState:$m,useDebugValue:up,useDeferredValue:function(t){return Ki().memoizedState=t},useTransition:function(){var t=$m(!1),e=t[0];return t=nM.bind(null,t[1]),Ki().memoizedState=t,[e,t]},useMutableSource:function(){},useSyncExternalStore:function(t,e,n){var i=Wt,r=Ki();if(Ot){if(n===void 0)throw Error(ce(407));n=n()}else{if(n=e(),fn===null)throw Error(ce(349));Ds&30||nv(i,e,n)}r.memoizedState=n;var s={value:n,getSnapshot:e};return r.queue=s,qm(rv.bind(null,i,s,t),[t]),i.flags|=2048,Zo(9,iv.bind(null,i,s,n,e),void 0,null),n},useId:function(){var t=Ki(),e=fn.identifierPrefix;if(Ot){var n=Sr,i=yr;n=(i&~(1<<32-Ui(i)-1)).toString(32)+n,e=":"+e+"R"+n,n=Yo++,0<n&&(e+="H"+n.toString(32)),e+=":"}else n=tM++,e=":"+e+"r"+n.toString(32)+":";return t.memoizedState=e},unstable_isNewReconciler:!1},aM={readContext:vi,useCallback:fv,useContext:vi,useEffect:cp,useImperativeHandle:dv,useInsertionEffect:lv,useLayoutEffect:cv,useMemo:hv,useReducer:Ju,useRef:ov,useState:function(){return Ju(Ko)},useDebugValue:up,useDeferredValue:function(t){var e=xi();return pv(e,tn.memoizedState,t)},useTransition:function(){var t=Ju(Ko)[0],e=xi().memoizedState;return[t,e]},useMutableSource:ev,useSyncExternalStore:tv,useId:mv,unstable_isNewReconciler:!1},oM={readContext:vi,useCallback:fv,useContext:vi,useEffect:cp,useImperativeHandle:dv,useInsertionEffect:lv,useLayoutEffect:cv,useMemo:hv,useReducer:ed,useRef:ov,useState:function(){return ed(Ko)},useDebugValue:up,useDeferredValue:function(t){var e=xi();return tn===null?e.memoizedState=t:pv(e,tn.memoizedState,t)},useTransition:function(){var t=ed(Ko)[0],e=xi().memoizedState;return[t,e]},useMutableSource:ev,useSyncExternalStore:tv,useId:mv,unstable_isNewReconciler:!1};function Ci(t,e){if(t&&t.defaultProps){e=jt({},e),t=t.defaultProps;for(var n in t)e[n]===void 0&&(e[n]=t[n]);return e}return e}function vf(t,e,n,i){e=t.memoizedState,n=n(i,e),n=n==null?e:jt({},e,n),t.memoizedState=n,t.lanes===0&&(t.updateQueue.baseState=n)}var fu={isMounted:function(t){return(t=t._reactInternals)?zs(t)===t:!1},enqueueSetState:function(t,e,n){t=t._reactInternals;var i=Dn(),r=rs(t),s=Er(i,r);s.payload=e,n!=null&&(s.callback=n),e=ns(t,s,r),e!==null&&(Fi(e,t,r,i),dc(e,t,r))},enqueueReplaceState:function(t,e,n){t=t._reactInternals;var i=Dn(),r=rs(t),s=Er(i,r);s.tag=1,s.payload=e,n!=null&&(s.callback=n),e=ns(t,s,r),e!==null&&(Fi(e,t,r,i),dc(e,t,r))},enqueueForceUpdate:function(t,e){t=t._reactInternals;var n=Dn(),i=rs(t),r=Er(n,i);r.tag=2,e!=null&&(r.callback=e),e=ns(t,r,i),e!==null&&(Fi(e,t,i,n),dc(e,t,i))}};function Ym(t,e,n,i,r,s,a){return t=t.stateNode,typeof t.shouldComponentUpdate=="function"?t.shouldComponentUpdate(i,s,a):e.prototype&&e.prototype.isPureReactComponent?!Go(n,i)||!Go(r,s):!0}function xv(t,e,n){var i=!1,r=os,s=e.contextType;return typeof s=="object"&&s!==null?s=vi(s):(r=jn(e)?Ns:Rn.current,i=e.contextTypes,s=(i=i!=null)?Da(t,r):os),e=new e(n,s),t.memoizedState=e.state!==null&&e.state!==void 0?e.state:null,e.updater=fu,t.stateNode=e,e._reactInternals=t,i&&(t=t.stateNode,t.__reactInternalMemoizedUnmaskedChildContext=r,t.__reactInternalMemoizedMaskedChildContext=s),e}function Km(t,e,n,i){t=e.state,typeof e.componentWillReceiveProps=="function"&&e.componentWillReceiveProps(n,i),typeof e.UNSAFE_componentWillReceiveProps=="function"&&e.UNSAFE_componentWillReceiveProps(n,i),e.state!==t&&fu.enqueueReplaceState(e,e.state,null)}function xf(t,e,n,i){var r=t.stateNode;r.props=n,r.state=t.memoizedState,r.refs={},np(t);var s=e.contextType;typeof s=="object"&&s!==null?r.context=vi(s):(s=jn(e)?Ns:Rn.current,r.context=Da(t,s)),r.state=t.memoizedState,s=e.getDerivedStateFromProps,typeof s=="function"&&(vf(t,e,s,n),r.state=t.memoizedState),typeof e.getDerivedStateFromProps=="function"||typeof r.getSnapshotBeforeUpdate=="function"||typeof r.UNSAFE_componentWillMount!="function"&&typeof r.componentWillMount!="function"||(e=r.state,typeof r.componentWillMount=="function"&&r.componentWillMount(),typeof r.UNSAFE_componentWillMount=="function"&&r.UNSAFE_componentWillMount(),e!==r.state&&fu.enqueueReplaceState(r,r.state,null),kc(t,n,r,i),r.state=t.memoizedState),typeof r.componentDidMount=="function"&&(t.flags|=4194308)}function Oa(t,e){try{var n="",i=e;do n+=Uy(i),i=i.return;while(i);var r=n}catch(s){r=`
Error generating stack: `+s.message+`
`+s.stack}return{value:t,source:e,stack:r,digest:null}}function td(t,e,n){return{value:t,source:null,stack:n??null,digest:e??null}}function yf(t,e){try{console.error(e.value)}catch(n){setTimeout(function(){throw n})}}var lM=typeof WeakMap=="function"?WeakMap:Map;function yv(t,e,n){n=Er(-1,n),n.tag=3,n.payload={element:null};var i=e.value;return n.callback=function(){Gc||(Gc=!0,Pf=i),yf(t,e)},n}function Sv(t,e,n){n=Er(-1,n),n.tag=3;var i=t.type.getDerivedStateFromError;if(typeof i=="function"){var r=e.value;n.payload=function(){return i(r)},n.callback=function(){yf(t,e)}}var s=t.stateNode;return s!==null&&typeof s.componentDidCatch=="function"&&(n.callback=function(){yf(t,e),typeof i!="function"&&(is===null?is=new Set([this]):is.add(this));var a=e.stack;this.componentDidCatch(e.value,{componentStack:a!==null?a:""})}),n}function Zm(t,e,n){var i=t.pingCache;if(i===null){i=t.pingCache=new lM;var r=new Set;i.set(e,r)}else r=i.get(e),r===void 0&&(r=new Set,i.set(e,r));r.has(n)||(r.add(n),t=MM.bind(null,t,e,n),e.then(t,t))}function Qm(t){do{var e;if((e=t.tag===13)&&(e=t.memoizedState,e=e!==null?e.dehydrated!==null:!0),e)return t;t=t.return}while(t!==null);return null}function Jm(t,e,n,i,r){return t.mode&1?(t.flags|=65536,t.lanes=r,t):(t===e?t.flags|=65536:(t.flags|=128,n.flags|=131072,n.flags&=-52805,n.tag===1&&(n.alternate===null?n.tag=17:(e=Er(-1,1),e.tag=2,ns(n,e,1))),n.lanes|=1),t)}var cM=Dr.ReactCurrentOwner,Gn=!1;function Nn(t,e,n,i){e.child=t===null?K_(e,null,n,i):Ua(e,t.child,n,i)}function e0(t,e,n,i,r){n=n.render;var s=e.ref;return Aa(e,r),i=op(t,e,n,i,s,r),n=lp(),t!==null&&!Gn?(e.updateQueue=t.updateQueue,e.flags&=-2053,t.lanes&=~r,Pr(t,e,r)):(Ot&&n&&Yh(e),e.flags|=1,Nn(t,e,i,r),e.child)}function t0(t,e,n,i,r){if(t===null){var s=n.type;return typeof s=="function"&&!vp(s)&&s.defaultProps===void 0&&n.compare===null&&n.defaultProps===void 0?(e.tag=15,e.type=s,Mv(t,e,s,i,r)):(t=_c(n.type,null,i,e,e.mode,r),t.ref=e.ref,t.return=e,e.child=t)}if(s=t.child,!(t.lanes&r)){var a=s.memoizedProps;if(n=n.compare,n=n!==null?n:Go,n(a,i)&&t.ref===e.ref)return Pr(t,e,r)}return e.flags|=1,t=ss(s,i),t.ref=e.ref,t.return=e,e.child=t}function Mv(t,e,n,i,r){if(t!==null){var s=t.memoizedProps;if(Go(s,i)&&t.ref===e.ref)if(Gn=!1,e.pendingProps=i=s,(t.lanes&r)!==0)t.flags&131072&&(Gn=!0);else return e.lanes=t.lanes,Pr(t,e,r)}return Sf(t,e,n,i,r)}function Ev(t,e,n){var i=e.pendingProps,r=i.children,s=t!==null?t.memoizedState:null;if(i.mode==="hidden")if(!(e.mode&1))e.memoizedState={baseLanes:0,cachePool:null,transitions:null},Nt(va,Qn),Qn|=n;else{if(!(n&1073741824))return t=s!==null?s.baseLanes|n:n,e.lanes=e.childLanes=1073741824,e.memoizedState={baseLanes:t,cachePool:null,transitions:null},e.updateQueue=null,Nt(va,Qn),Qn|=t,null;e.memoizedState={baseLanes:0,cachePool:null,transitions:null},i=s!==null?s.baseLanes:n,Nt(va,Qn),Qn|=i}else s!==null?(i=s.baseLanes|n,e.memoizedState=null):i=n,Nt(va,Qn),Qn|=i;return Nn(t,e,r,n),e.child}function wv(t,e){var n=e.ref;(t===null&&n!==null||t!==null&&t.ref!==n)&&(e.flags|=512,e.flags|=2097152)}function Sf(t,e,n,i,r){var s=jn(n)?Ns:Rn.current;return s=Da(e,s),Aa(e,r),n=op(t,e,n,i,s,r),i=lp(),t!==null&&!Gn?(e.updateQueue=t.updateQueue,e.flags&=-2053,t.lanes&=~r,Pr(t,e,r)):(Ot&&i&&Yh(e),e.flags|=1,Nn(t,e,n,r),e.child)}function n0(t,e,n,i,r){if(jn(n)){var s=!0;Dc(e)}else s=!1;if(Aa(e,r),e.stateNode===null)pc(t,e),xv(e,n,i),xf(e,n,i,r),i=!0;else if(t===null){var a=e.stateNode,o=e.memoizedProps;a.props=o;var l=a.context,c=n.contextType;typeof c=="object"&&c!==null?c=vi(c):(c=jn(n)?Ns:Rn.current,c=Da(e,c));var h=n.getDerivedStateFromProps,p=typeof h=="function"||typeof a.getSnapshotBeforeUpdate=="function";p||typeof a.UNSAFE_componentWillReceiveProps!="function"&&typeof a.componentWillReceiveProps!="function"||(o!==i||l!==c)&&Km(e,a,i,c),jr=!1;var f=e.memoizedState;a.state=f,kc(e,i,a,r),l=e.memoizedState,o!==i||f!==l||Wn.current||jr?(typeof h=="function"&&(vf(e,n,h,i),l=e.memoizedState),(o=jr||Ym(e,n,o,i,f,l,c))?(p||typeof a.UNSAFE_componentWillMount!="function"&&typeof a.componentWillMount!="function"||(typeof a.componentWillMount=="function"&&a.componentWillMount(),typeof a.UNSAFE_componentWillMount=="function"&&a.UNSAFE_componentWillMount()),typeof a.componentDidMount=="function"&&(e.flags|=4194308)):(typeof a.componentDidMount=="function"&&(e.flags|=4194308),e.memoizedProps=i,e.memoizedState=l),a.props=i,a.state=l,a.context=c,i=o):(typeof a.componentDidMount=="function"&&(e.flags|=4194308),i=!1)}else{a=e.stateNode,Q_(t,e),o=e.memoizedProps,c=e.type===e.elementType?o:Ci(e.type,o),a.props=c,p=e.pendingProps,f=a.context,l=n.contextType,typeof l=="object"&&l!==null?l=vi(l):(l=jn(n)?Ns:Rn.current,l=Da(e,l));var g=n.getDerivedStateFromProps;(h=typeof g=="function"||typeof a.getSnapshotBeforeUpdate=="function")||typeof a.UNSAFE_componentWillReceiveProps!="function"&&typeof a.componentWillReceiveProps!="function"||(o!==p||f!==l)&&Km(e,a,i,l),jr=!1,f=e.memoizedState,a.state=f,kc(e,i,a,r);var v=e.memoizedState;o!==p||f!==v||Wn.current||jr?(typeof g=="function"&&(vf(e,n,g,i),v=e.memoizedState),(c=jr||Ym(e,n,c,i,f,v,l)||!1)?(h||typeof a.UNSAFE_componentWillUpdate!="function"&&typeof a.componentWillUpdate!="function"||(typeof a.componentWillUpdate=="function"&&a.componentWillUpdate(i,v,l),typeof a.UNSAFE_componentWillUpdate=="function"&&a.UNSAFE_componentWillUpdate(i,v,l)),typeof a.componentDidUpdate=="function"&&(e.flags|=4),typeof a.getSnapshotBeforeUpdate=="function"&&(e.flags|=1024)):(typeof a.componentDidUpdate!="function"||o===t.memoizedProps&&f===t.memoizedState||(e.flags|=4),typeof a.getSnapshotBeforeUpdate!="function"||o===t.memoizedProps&&f===t.memoizedState||(e.flags|=1024),e.memoizedProps=i,e.memoizedState=v),a.props=i,a.state=v,a.context=l,i=c):(typeof a.componentDidUpdate!="function"||o===t.memoizedProps&&f===t.memoizedState||(e.flags|=4),typeof a.getSnapshotBeforeUpdate!="function"||o===t.memoizedProps&&f===t.memoizedState||(e.flags|=1024),i=!1)}return Mf(t,e,n,i,s,r)}function Mf(t,e,n,i,r,s){wv(t,e);var a=(e.flags&128)!==0;if(!i&&!a)return r&&Hm(e,n,!1),Pr(t,e,s);i=e.stateNode,cM.current=e;var o=a&&typeof n.getDerivedStateFromError!="function"?null:i.render();return e.flags|=1,t!==null&&a?(e.child=Ua(e,t.child,null,s),e.child=Ua(e,null,o,s)):Nn(t,e,o,s),e.memoizedState=i.state,r&&Hm(e,n,!0),e.child}function Tv(t){var e=t.stateNode;e.pendingContext?zm(t,e.pendingContext,e.pendingContext!==e.context):e.context&&zm(t,e.context,!1),ip(t,e.containerInfo)}function i0(t,e,n,i,r){return Ia(),Zh(r),e.flags|=256,Nn(t,e,n,i),e.child}var Ef={dehydrated:null,treeContext:null,retryLane:0};function wf(t){return{baseLanes:t,cachePool:null,transitions:null}}function Av(t,e,n){var i=e.pendingProps,r=Vt.current,s=!1,a=(e.flags&128)!==0,o;if((o=a)||(o=t!==null&&t.memoizedState===null?!1:(r&2)!==0),o?(s=!0,e.flags&=-129):(t===null||t.memoizedState!==null)&&(r|=1),Nt(Vt,r&1),t===null)return gf(e),t=e.memoizedState,t!==null&&(t=t.dehydrated,t!==null)?(e.mode&1?t.data==="$!"?e.lanes=8:e.lanes=1073741824:e.lanes=1,null):(a=i.children,t=i.fallback,s?(i=e.mode,s=e.child,a={mode:"hidden",children:a},!(i&1)&&s!==null?(s.childLanes=0,s.pendingProps=a):s=mu(a,i,0,null),t=Ps(t,i,n,null),s.return=e,t.return=e,s.sibling=t,e.child=s,e.child.memoizedState=wf(n),e.memoizedState=Ef,t):dp(e,a));if(r=t.memoizedState,r!==null&&(o=r.dehydrated,o!==null))return uM(t,e,a,i,o,r,n);if(s){s=i.fallback,a=e.mode,r=t.child,o=r.sibling;var l={mode:"hidden",children:i.children};return!(a&1)&&e.child!==r?(i=e.child,i.childLanes=0,i.pendingProps=l,e.deletions=null):(i=ss(r,l),i.subtreeFlags=r.subtreeFlags&14680064),o!==null?s=ss(o,s):(s=Ps(s,a,n,null),s.flags|=2),s.return=e,i.return=e,i.sibling=s,e.child=i,i=s,s=e.child,a=t.child.memoizedState,a=a===null?wf(n):{baseLanes:a.baseLanes|n,cachePool:null,transitions:a.transitions},s.memoizedState=a,s.childLanes=t.childLanes&~n,e.memoizedState=Ef,i}return s=t.child,t=s.sibling,i=ss(s,{mode:"visible",children:i.children}),!(e.mode&1)&&(i.lanes=n),i.return=e,i.sibling=null,t!==null&&(n=e.deletions,n===null?(e.deletions=[t],e.flags|=16):n.push(t)),e.child=i,e.memoizedState=null,i}function dp(t,e){return e=mu({mode:"visible",children:e},t.mode,0,null),e.return=t,t.child=e}function bl(t,e,n,i){return i!==null&&Zh(i),Ua(e,t.child,null,n),t=dp(e,e.pendingProps.children),t.flags|=2,e.memoizedState=null,t}function uM(t,e,n,i,r,s,a){if(n)return e.flags&256?(e.flags&=-257,i=td(Error(ce(422))),bl(t,e,a,i)):e.memoizedState!==null?(e.child=t.child,e.flags|=128,null):(s=i.fallback,r=e.mode,i=mu({mode:"visible",children:i.children},r,0,null),s=Ps(s,r,a,null),s.flags|=2,i.return=e,s.return=e,i.sibling=s,e.child=i,e.mode&1&&Ua(e,t.child,null,a),e.child.memoizedState=wf(a),e.memoizedState=Ef,s);if(!(e.mode&1))return bl(t,e,a,null);if(r.data==="$!"){if(i=r.nextSibling&&r.nextSibling.dataset,i)var o=i.dgst;return i=o,s=Error(ce(419)),i=td(s,i,void 0),bl(t,e,a,i)}if(o=(a&t.childLanes)!==0,Gn||o){if(i=fn,i!==null){switch(a&-a){case 4:r=2;break;case 16:r=8;break;case 64:case 128:case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:case 4194304:case 8388608:case 16777216:case 33554432:case 67108864:r=32;break;case 536870912:r=268435456;break;default:r=0}r=r&(i.suspendedLanes|a)?0:r,r!==0&&r!==s.retryLane&&(s.retryLane=r,Cr(t,r),Fi(i,t,r,-1))}return _p(),i=td(Error(ce(421))),bl(t,e,a,i)}return r.data==="$?"?(e.flags|=128,e.child=t.child,e=EM.bind(null,t),r._reactRetry=e,null):(t=s.treeContext,ni=ts(r.nextSibling),ri=e,Ot=!0,Ni=null,t!==null&&(hi[pi++]=yr,hi[pi++]=Sr,hi[pi++]=Ls,yr=t.id,Sr=t.overflow,Ls=e),e=dp(e,i.children),e.flags|=4096,e)}function r0(t,e,n){t.lanes|=e;var i=t.alternate;i!==null&&(i.lanes|=e),_f(t.return,e,n)}function nd(t,e,n,i,r){var s=t.memoizedState;s===null?t.memoizedState={isBackwards:e,rendering:null,renderingStartTime:0,last:i,tail:n,tailMode:r}:(s.isBackwards=e,s.rendering=null,s.renderingStartTime=0,s.last=i,s.tail=n,s.tailMode=r)}function bv(t,e,n){var i=e.pendingProps,r=i.revealOrder,s=i.tail;if(Nn(t,e,i.children,n),i=Vt.current,i&2)i=i&1|2,e.flags|=128;else{if(t!==null&&t.flags&128)e:for(t=e.child;t!==null;){if(t.tag===13)t.memoizedState!==null&&r0(t,n,e);else if(t.tag===19)r0(t,n,e);else if(t.child!==null){t.child.return=t,t=t.child;continue}if(t===e)break e;for(;t.sibling===null;){if(t.return===null||t.return===e)break e;t=t.return}t.sibling.return=t.return,t=t.sibling}i&=1}if(Nt(Vt,i),!(e.mode&1))e.memoizedState=null;else switch(r){case"forwards":for(n=e.child,r=null;n!==null;)t=n.alternate,t!==null&&Bc(t)===null&&(r=n),n=n.sibling;n=r,n===null?(r=e.child,e.child=null):(r=n.sibling,n.sibling=null),nd(e,!1,r,n,s);break;case"backwards":for(n=null,r=e.child,e.child=null;r!==null;){if(t=r.alternate,t!==null&&Bc(t)===null){e.child=r;break}t=r.sibling,r.sibling=n,n=r,r=t}nd(e,!0,n,null,s);break;case"together":nd(e,!1,null,null,void 0);break;default:e.memoizedState=null}return e.child}function pc(t,e){!(e.mode&1)&&t!==null&&(t.alternate=null,e.alternate=null,e.flags|=2)}function Pr(t,e,n){if(t!==null&&(e.dependencies=t.dependencies),Is|=e.lanes,!(n&e.childLanes))return null;if(t!==null&&e.child!==t.child)throw Error(ce(153));if(e.child!==null){for(t=e.child,n=ss(t,t.pendingProps),e.child=n,n.return=e;t.sibling!==null;)t=t.sibling,n=n.sibling=ss(t,t.pendingProps),n.return=e;n.sibling=null}return e.child}function dM(t,e,n){switch(e.tag){case 3:Tv(e),Ia();break;case 5:J_(e);break;case 1:jn(e.type)&&Dc(e);break;case 4:ip(e,e.stateNode.containerInfo);break;case 10:var i=e.type._context,r=e.memoizedProps.value;Nt(Fc,i._currentValue),i._currentValue=r;break;case 13:if(i=e.memoizedState,i!==null)return i.dehydrated!==null?(Nt(Vt,Vt.current&1),e.flags|=128,null):n&e.child.childLanes?Av(t,e,n):(Nt(Vt,Vt.current&1),t=Pr(t,e,n),t!==null?t.sibling:null);Nt(Vt,Vt.current&1);break;case 19:if(i=(n&e.childLanes)!==0,t.flags&128){if(i)return bv(t,e,n);e.flags|=128}if(r=e.memoizedState,r!==null&&(r.rendering=null,r.tail=null,r.lastEffect=null),Nt(Vt,Vt.current),i)break;return null;case 22:case 23:return e.lanes=0,Ev(t,e,n)}return Pr(t,e,n)}var Rv,Tf,Cv,Pv;Rv=function(t,e){for(var n=e.child;n!==null;){if(n.tag===5||n.tag===6)t.appendChild(n.stateNode);else if(n.tag!==4&&n.child!==null){n.child.return=n,n=n.child;continue}if(n===e)break;for(;n.sibling===null;){if(n.return===null||n.return===e)return;n=n.return}n.sibling.return=n.return,n=n.sibling}};Tf=function(){};Cv=function(t,e,n,i){var r=t.memoizedProps;if(r!==i){t=e.stateNode,As(rr.current);var s=null;switch(n){case"input":r=Xd(t,r),i=Xd(t,i),s=[];break;case"select":r=jt({},r,{value:void 0}),i=jt({},i,{value:void 0}),s=[];break;case"textarea":r=Yd(t,r),i=Yd(t,i),s=[];break;default:typeof r.onClick!="function"&&typeof i.onClick=="function"&&(t.onclick=Nc)}Zd(n,i);var a;n=null;for(c in r)if(!i.hasOwnProperty(c)&&r.hasOwnProperty(c)&&r[c]!=null)if(c==="style"){var o=r[c];for(a in o)o.hasOwnProperty(a)&&(n||(n={}),n[a]="")}else c!=="dangerouslySetInnerHTML"&&c!=="children"&&c!=="suppressContentEditableWarning"&&c!=="suppressHydrationWarning"&&c!=="autoFocus"&&(Fo.hasOwnProperty(c)?s||(s=[]):(s=s||[]).push(c,null));for(c in i){var l=i[c];if(o=r!=null?r[c]:void 0,i.hasOwnProperty(c)&&l!==o&&(l!=null||o!=null))if(c==="style")if(o){for(a in o)!o.hasOwnProperty(a)||l&&l.hasOwnProperty(a)||(n||(n={}),n[a]="");for(a in l)l.hasOwnProperty(a)&&o[a]!==l[a]&&(n||(n={}),n[a]=l[a])}else n||(s||(s=[]),s.push(c,n)),n=l;else c==="dangerouslySetInnerHTML"?(l=l?l.__html:void 0,o=o?o.__html:void 0,l!=null&&o!==l&&(s=s||[]).push(c,l)):c==="children"?typeof l!="string"&&typeof l!="number"||(s=s||[]).push(c,""+l):c!=="suppressContentEditableWarning"&&c!=="suppressHydrationWarning"&&(Fo.hasOwnProperty(c)?(l!=null&&c==="onScroll"&&Dt("scroll",t),s||o===l||(s=[])):(s=s||[]).push(c,l))}n&&(s=s||[]).push("style",n);var c=s;(e.updateQueue=c)&&(e.flags|=4)}};Pv=function(t,e,n,i){n!==i&&(e.flags|=4)};function ao(t,e){if(!Ot)switch(t.tailMode){case"hidden":e=t.tail;for(var n=null;e!==null;)e.alternate!==null&&(n=e),e=e.sibling;n===null?t.tail=null:n.sibling=null;break;case"collapsed":n=t.tail;for(var i=null;n!==null;)n.alternate!==null&&(i=n),n=n.sibling;i===null?e||t.tail===null?t.tail=null:t.tail.sibling=null:i.sibling=null}}function Sn(t){var e=t.alternate!==null&&t.alternate.child===t.child,n=0,i=0;if(e)for(var r=t.child;r!==null;)n|=r.lanes|r.childLanes,i|=r.subtreeFlags&14680064,i|=r.flags&14680064,r.return=t,r=r.sibling;else for(r=t.child;r!==null;)n|=r.lanes|r.childLanes,i|=r.subtreeFlags,i|=r.flags,r.return=t,r=r.sibling;return t.subtreeFlags|=i,t.childLanes=n,e}function fM(t,e,n){var i=e.pendingProps;switch(Kh(e),e.tag){case 2:case 16:case 15:case 0:case 11:case 7:case 8:case 12:case 9:case 14:return Sn(e),null;case 1:return jn(e.type)&&Lc(),Sn(e),null;case 3:return i=e.stateNode,Fa(),Ut(Wn),Ut(Rn),sp(),i.pendingContext&&(i.context=i.pendingContext,i.pendingContext=null),(t===null||t.child===null)&&(Tl(e)?e.flags|=4:t===null||t.memoizedState.isDehydrated&&!(e.flags&256)||(e.flags|=1024,Ni!==null&&(Df(Ni),Ni=null))),Tf(t,e),Sn(e),null;case 5:rp(e);var r=As(qo.current);if(n=e.type,t!==null&&e.stateNode!=null)Cv(t,e,n,i,r),t.ref!==e.ref&&(e.flags|=512,e.flags|=2097152);else{if(!i){if(e.stateNode===null)throw Error(ce(166));return Sn(e),null}if(t=As(rr.current),Tl(e)){i=e.stateNode,n=e.type;var s=e.memoizedProps;switch(i[Ji]=e,i[Xo]=s,t=(e.mode&1)!==0,n){case"dialog":Dt("cancel",i),Dt("close",i);break;case"iframe":case"object":case"embed":Dt("load",i);break;case"video":case"audio":for(r=0;r<yo.length;r++)Dt(yo[r],i);break;case"source":Dt("error",i);break;case"img":case"image":case"link":Dt("error",i),Dt("load",i);break;case"details":Dt("toggle",i);break;case"input":hm(i,s),Dt("invalid",i);break;case"select":i._wrapperState={wasMultiple:!!s.multiple},Dt("invalid",i);break;case"textarea":mm(i,s),Dt("invalid",i)}Zd(n,s),r=null;for(var a in s)if(s.hasOwnProperty(a)){var o=s[a];a==="children"?typeof o=="string"?i.textContent!==o&&(s.suppressHydrationWarning!==!0&&wl(i.textContent,o,t),r=["children",o]):typeof o=="number"&&i.textContent!==""+o&&(s.suppressHydrationWarning!==!0&&wl(i.textContent,o,t),r=["children",""+o]):Fo.hasOwnProperty(a)&&o!=null&&a==="onScroll"&&Dt("scroll",i)}switch(n){case"input":gl(i),pm(i,s,!0);break;case"textarea":gl(i),gm(i);break;case"select":case"option":break;default:typeof s.onClick=="function"&&(i.onclick=Nc)}i=r,e.updateQueue=i,i!==null&&(e.flags|=4)}else{a=r.nodeType===9?r:r.ownerDocument,t==="http://www.w3.org/1999/xhtml"&&(t=r_(n)),t==="http://www.w3.org/1999/xhtml"?n==="script"?(t=a.createElement("div"),t.innerHTML="<script><\/script>",t=t.removeChild(t.firstChild)):typeof i.is=="string"?t=a.createElement(n,{is:i.is}):(t=a.createElement(n),n==="select"&&(a=t,i.multiple?a.multiple=!0:i.size&&(a.size=i.size))):t=a.createElementNS(t,n),t[Ji]=e,t[Xo]=i,Rv(t,e,!1,!1),e.stateNode=t;e:{switch(a=Qd(n,i),n){case"dialog":Dt("cancel",t),Dt("close",t),r=i;break;case"iframe":case"object":case"embed":Dt("load",t),r=i;break;case"video":case"audio":for(r=0;r<yo.length;r++)Dt(yo[r],t);r=i;break;case"source":Dt("error",t),r=i;break;case"img":case"image":case"link":Dt("error",t),Dt("load",t),r=i;break;case"details":Dt("toggle",t),r=i;break;case"input":hm(t,i),r=Xd(t,i),Dt("invalid",t);break;case"option":r=i;break;case"select":t._wrapperState={wasMultiple:!!i.multiple},r=jt({},i,{value:void 0}),Dt("invalid",t);break;case"textarea":mm(t,i),r=Yd(t,i),Dt("invalid",t);break;default:r=i}Zd(n,r),o=r;for(s in o)if(o.hasOwnProperty(s)){var l=o[s];s==="style"?o_(t,l):s==="dangerouslySetInnerHTML"?(l=l?l.__html:void 0,l!=null&&s_(t,l)):s==="children"?typeof l=="string"?(n!=="textarea"||l!=="")&&Oo(t,l):typeof l=="number"&&Oo(t,""+l):s!=="suppressContentEditableWarning"&&s!=="suppressHydrationWarning"&&s!=="autoFocus"&&(Fo.hasOwnProperty(s)?l!=null&&s==="onScroll"&&Dt("scroll",t):l!=null&&Uh(t,s,l,a))}switch(n){case"input":gl(t),pm(t,i,!1);break;case"textarea":gl(t),gm(t);break;case"option":i.value!=null&&t.setAttribute("value",""+as(i.value));break;case"select":t.multiple=!!i.multiple,s=i.value,s!=null?Ma(t,!!i.multiple,s,!1):i.defaultValue!=null&&Ma(t,!!i.multiple,i.defaultValue,!0);break;default:typeof r.onClick=="function"&&(t.onclick=Nc)}switch(n){case"button":case"input":case"select":case"textarea":i=!!i.autoFocus;break e;case"img":i=!0;break e;default:i=!1}}i&&(e.flags|=4)}e.ref!==null&&(e.flags|=512,e.flags|=2097152)}return Sn(e),null;case 6:if(t&&e.stateNode!=null)Pv(t,e,t.memoizedProps,i);else{if(typeof i!="string"&&e.stateNode===null)throw Error(ce(166));if(n=As(qo.current),As(rr.current),Tl(e)){if(i=e.stateNode,n=e.memoizedProps,i[Ji]=e,(s=i.nodeValue!==n)&&(t=ri,t!==null))switch(t.tag){case 3:wl(i.nodeValue,n,(t.mode&1)!==0);break;case 5:t.memoizedProps.suppressHydrationWarning!==!0&&wl(i.nodeValue,n,(t.mode&1)!==0)}s&&(e.flags|=4)}else i=(n.nodeType===9?n:n.ownerDocument).createTextNode(i),i[Ji]=e,e.stateNode=i}return Sn(e),null;case 13:if(Ut(Vt),i=e.memoizedState,t===null||t.memoizedState!==null&&t.memoizedState.dehydrated!==null){if(Ot&&ni!==null&&e.mode&1&&!(e.flags&128))q_(),Ia(),e.flags|=98560,s=!1;else if(s=Tl(e),i!==null&&i.dehydrated!==null){if(t===null){if(!s)throw Error(ce(318));if(s=e.memoizedState,s=s!==null?s.dehydrated:null,!s)throw Error(ce(317));s[Ji]=e}else Ia(),!(e.flags&128)&&(e.memoizedState=null),e.flags|=4;Sn(e),s=!1}else Ni!==null&&(Df(Ni),Ni=null),s=!0;if(!s)return e.flags&65536?e:null}return e.flags&128?(e.lanes=n,e):(i=i!==null,i!==(t!==null&&t.memoizedState!==null)&&i&&(e.child.flags|=8192,e.mode&1&&(t===null||Vt.current&1?rn===0&&(rn=3):_p())),e.updateQueue!==null&&(e.flags|=4),Sn(e),null);case 4:return Fa(),Tf(t,e),t===null&&Wo(e.stateNode.containerInfo),Sn(e),null;case 10:return ep(e.type._context),Sn(e),null;case 17:return jn(e.type)&&Lc(),Sn(e),null;case 19:if(Ut(Vt),s=e.memoizedState,s===null)return Sn(e),null;if(i=(e.flags&128)!==0,a=s.rendering,a===null)if(i)ao(s,!1);else{if(rn!==0||t!==null&&t.flags&128)for(t=e.child;t!==null;){if(a=Bc(t),a!==null){for(e.flags|=128,ao(s,!1),i=a.updateQueue,i!==null&&(e.updateQueue=i,e.flags|=4),e.subtreeFlags=0,i=n,n=e.child;n!==null;)s=n,t=i,s.flags&=14680066,a=s.alternate,a===null?(s.childLanes=0,s.lanes=t,s.child=null,s.subtreeFlags=0,s.memoizedProps=null,s.memoizedState=null,s.updateQueue=null,s.dependencies=null,s.stateNode=null):(s.childLanes=a.childLanes,s.lanes=a.lanes,s.child=a.child,s.subtreeFlags=0,s.deletions=null,s.memoizedProps=a.memoizedProps,s.memoizedState=a.memoizedState,s.updateQueue=a.updateQueue,s.type=a.type,t=a.dependencies,s.dependencies=t===null?null:{lanes:t.lanes,firstContext:t.firstContext}),n=n.sibling;return Nt(Vt,Vt.current&1|2),e.child}t=t.sibling}s.tail!==null&&Kt()>ka&&(e.flags|=128,i=!0,ao(s,!1),e.lanes=4194304)}else{if(!i)if(t=Bc(a),t!==null){if(e.flags|=128,i=!0,n=t.updateQueue,n!==null&&(e.updateQueue=n,e.flags|=4),ao(s,!0),s.tail===null&&s.tailMode==="hidden"&&!a.alternate&&!Ot)return Sn(e),null}else 2*Kt()-s.renderingStartTime>ka&&n!==1073741824&&(e.flags|=128,i=!0,ao(s,!1),e.lanes=4194304);s.isBackwards?(a.sibling=e.child,e.child=a):(n=s.last,n!==null?n.sibling=a:e.child=a,s.last=a)}return s.tail!==null?(e=s.tail,s.rendering=e,s.tail=e.sibling,s.renderingStartTime=Kt(),e.sibling=null,n=Vt.current,Nt(Vt,i?n&1|2:n&1),e):(Sn(e),null);case 22:case 23:return gp(),i=e.memoizedState!==null,t!==null&&t.memoizedState!==null!==i&&(e.flags|=8192),i&&e.mode&1?Qn&1073741824&&(Sn(e),e.subtreeFlags&6&&(e.flags|=8192)):Sn(e),null;case 24:return null;case 25:return null}throw Error(ce(156,e.tag))}function hM(t,e){switch(Kh(e),e.tag){case 1:return jn(e.type)&&Lc(),t=e.flags,t&65536?(e.flags=t&-65537|128,e):null;case 3:return Fa(),Ut(Wn),Ut(Rn),sp(),t=e.flags,t&65536&&!(t&128)?(e.flags=t&-65537|128,e):null;case 5:return rp(e),null;case 13:if(Ut(Vt),t=e.memoizedState,t!==null&&t.dehydrated!==null){if(e.alternate===null)throw Error(ce(340));Ia()}return t=e.flags,t&65536?(e.flags=t&-65537|128,e):null;case 19:return Ut(Vt),null;case 4:return Fa(),null;case 10:return ep(e.type._context),null;case 22:case 23:return gp(),null;case 24:return null;default:return null}}var Rl=!1,Tn=!1,pM=typeof WeakSet=="function"?WeakSet:Set,De=null;function _a(t,e){var n=t.ref;if(n!==null)if(typeof n=="function")try{n(null)}catch(i){$t(t,e,i)}else n.current=null}function Af(t,e,n){try{n()}catch(i){$t(t,e,i)}}var s0=!1;function mM(t,e){if(cf=Rc,t=U_(),qh(t)){if("selectionStart"in t)var n={start:t.selectionStart,end:t.selectionEnd};else e:{n=(n=t.ownerDocument)&&n.defaultView||window;var i=n.getSelection&&n.getSelection();if(i&&i.rangeCount!==0){n=i.anchorNode;var r=i.anchorOffset,s=i.focusNode;i=i.focusOffset;try{n.nodeType,s.nodeType}catch{n=null;break e}var a=0,o=-1,l=-1,c=0,h=0,p=t,f=null;t:for(;;){for(var g;p!==n||r!==0&&p.nodeType!==3||(o=a+r),p!==s||i!==0&&p.nodeType!==3||(l=a+i),p.nodeType===3&&(a+=p.nodeValue.length),(g=p.firstChild)!==null;)f=p,p=g;for(;;){if(p===t)break t;if(f===n&&++c===r&&(o=a),f===s&&++h===i&&(l=a),(g=p.nextSibling)!==null)break;p=f,f=p.parentNode}p=g}n=o===-1||l===-1?null:{start:o,end:l}}else n=null}n=n||{start:0,end:0}}else n=null;for(uf={focusedElem:t,selectionRange:n},Rc=!1,De=e;De!==null;)if(e=De,t=e.child,(e.subtreeFlags&1028)!==0&&t!==null)t.return=e,De=t;else for(;De!==null;){e=De;try{var v=e.alternate;if(e.flags&1024)switch(e.tag){case 0:case 11:case 15:break;case 1:if(v!==null){var E=v.memoizedProps,_=v.memoizedState,u=e.stateNode,m=u.getSnapshotBeforeUpdate(e.elementType===e.type?E:Ci(e.type,E),_);u.__reactInternalSnapshotBeforeUpdate=m}break;case 3:var M=e.stateNode.containerInfo;M.nodeType===1?M.textContent="":M.nodeType===9&&M.documentElement&&M.removeChild(M.documentElement);break;case 5:case 6:case 4:case 17:break;default:throw Error(ce(163))}}catch(y){$t(e,e.return,y)}if(t=e.sibling,t!==null){t.return=e.return,De=t;break}De=e.return}return v=s0,s0=!1,v}function Po(t,e,n){var i=e.updateQueue;if(i=i!==null?i.lastEffect:null,i!==null){var r=i=i.next;do{if((r.tag&t)===t){var s=r.destroy;r.destroy=void 0,s!==void 0&&Af(e,n,s)}r=r.next}while(r!==i)}}function hu(t,e){if(e=e.updateQueue,e=e!==null?e.lastEffect:null,e!==null){var n=e=e.next;do{if((n.tag&t)===t){var i=n.create;n.destroy=i()}n=n.next}while(n!==e)}}function bf(t){var e=t.ref;if(e!==null){var n=t.stateNode;switch(t.tag){case 5:t=n;break;default:t=n}typeof e=="function"?e(t):e.current=t}}function Nv(t){var e=t.alternate;e!==null&&(t.alternate=null,Nv(e)),t.child=null,t.deletions=null,t.sibling=null,t.tag===5&&(e=t.stateNode,e!==null&&(delete e[Ji],delete e[Xo],delete e[hf],delete e[ZS],delete e[QS])),t.stateNode=null,t.return=null,t.dependencies=null,t.memoizedProps=null,t.memoizedState=null,t.pendingProps=null,t.stateNode=null,t.updateQueue=null}function Lv(t){return t.tag===5||t.tag===3||t.tag===4}function a0(t){e:for(;;){for(;t.sibling===null;){if(t.return===null||Lv(t.return))return null;t=t.return}for(t.sibling.return=t.return,t=t.sibling;t.tag!==5&&t.tag!==6&&t.tag!==18;){if(t.flags&2||t.child===null||t.tag===4)continue e;t.child.return=t,t=t.child}if(!(t.flags&2))return t.stateNode}}function Rf(t,e,n){var i=t.tag;if(i===5||i===6)t=t.stateNode,e?n.nodeType===8?n.parentNode.insertBefore(t,e):n.insertBefore(t,e):(n.nodeType===8?(e=n.parentNode,e.insertBefore(t,n)):(e=n,e.appendChild(t)),n=n._reactRootContainer,n!=null||e.onclick!==null||(e.onclick=Nc));else if(i!==4&&(t=t.child,t!==null))for(Rf(t,e,n),t=t.sibling;t!==null;)Rf(t,e,n),t=t.sibling}function Cf(t,e,n){var i=t.tag;if(i===5||i===6)t=t.stateNode,e?n.insertBefore(t,e):n.appendChild(t);else if(i!==4&&(t=t.child,t!==null))for(Cf(t,e,n),t=t.sibling;t!==null;)Cf(t,e,n),t=t.sibling}var mn=null,Pi=!1;function kr(t,e,n){for(n=n.child;n!==null;)Dv(t,e,n),n=n.sibling}function Dv(t,e,n){if(ir&&typeof ir.onCommitFiberUnmount=="function")try{ir.onCommitFiberUnmount(su,n)}catch{}switch(n.tag){case 5:Tn||_a(n,e);case 6:var i=mn,r=Pi;mn=null,kr(t,e,n),mn=i,Pi=r,mn!==null&&(Pi?(t=mn,n=n.stateNode,t.nodeType===8?t.parentNode.removeChild(n):t.removeChild(n)):mn.removeChild(n.stateNode));break;case 18:mn!==null&&(Pi?(t=mn,n=n.stateNode,t.nodeType===8?Yu(t.parentNode,n):t.nodeType===1&&Yu(t,n),Ho(t)):Yu(mn,n.stateNode));break;case 4:i=mn,r=Pi,mn=n.stateNode.containerInfo,Pi=!0,kr(t,e,n),mn=i,Pi=r;break;case 0:case 11:case 14:case 15:if(!Tn&&(i=n.updateQueue,i!==null&&(i=i.lastEffect,i!==null))){r=i=i.next;do{var s=r,a=s.destroy;s=s.tag,a!==void 0&&(s&2||s&4)&&Af(n,e,a),r=r.next}while(r!==i)}kr(t,e,n);break;case 1:if(!Tn&&(_a(n,e),i=n.stateNode,typeof i.componentWillUnmount=="function"))try{i.props=n.memoizedProps,i.state=n.memoizedState,i.componentWillUnmount()}catch(o){$t(n,e,o)}kr(t,e,n);break;case 21:kr(t,e,n);break;case 22:n.mode&1?(Tn=(i=Tn)||n.memoizedState!==null,kr(t,e,n),Tn=i):kr(t,e,n);break;default:kr(t,e,n)}}function o0(t){var e=t.updateQueue;if(e!==null){t.updateQueue=null;var n=t.stateNode;n===null&&(n=t.stateNode=new pM),e.forEach(function(i){var r=wM.bind(null,t,i);n.has(i)||(n.add(i),i.then(r,r))})}}function Ti(t,e){var n=e.deletions;if(n!==null)for(var i=0;i<n.length;i++){var r=n[i];try{var s=t,a=e,o=a;e:for(;o!==null;){switch(o.tag){case 5:mn=o.stateNode,Pi=!1;break e;case 3:mn=o.stateNode.containerInfo,Pi=!0;break e;case 4:mn=o.stateNode.containerInfo,Pi=!0;break e}o=o.return}if(mn===null)throw Error(ce(160));Dv(s,a,r),mn=null,Pi=!1;var l=r.alternate;l!==null&&(l.return=null),r.return=null}catch(c){$t(r,e,c)}}if(e.subtreeFlags&12854)for(e=e.child;e!==null;)Iv(e,t),e=e.sibling}function Iv(t,e){var n=t.alternate,i=t.flags;switch(t.tag){case 0:case 11:case 14:case 15:if(Ti(e,t),$i(t),i&4){try{Po(3,t,t.return),hu(3,t)}catch(E){$t(t,t.return,E)}try{Po(5,t,t.return)}catch(E){$t(t,t.return,E)}}break;case 1:Ti(e,t),$i(t),i&512&&n!==null&&_a(n,n.return);break;case 5:if(Ti(e,t),$i(t),i&512&&n!==null&&_a(n,n.return),t.flags&32){var r=t.stateNode;try{Oo(r,"")}catch(E){$t(t,t.return,E)}}if(i&4&&(r=t.stateNode,r!=null)){var s=t.memoizedProps,a=n!==null?n.memoizedProps:s,o=t.type,l=t.updateQueue;if(t.updateQueue=null,l!==null)try{o==="input"&&s.type==="radio"&&s.name!=null&&n_(r,s),Qd(o,a);var c=Qd(o,s);for(a=0;a<l.length;a+=2){var h=l[a],p=l[a+1];h==="style"?o_(r,p):h==="dangerouslySetInnerHTML"?s_(r,p):h==="children"?Oo(r,p):Uh(r,h,p,c)}switch(o){case"input":$d(r,s);break;case"textarea":i_(r,s);break;case"select":var f=r._wrapperState.wasMultiple;r._wrapperState.wasMultiple=!!s.multiple;var g=s.value;g!=null?Ma(r,!!s.multiple,g,!1):f!==!!s.multiple&&(s.defaultValue!=null?Ma(r,!!s.multiple,s.defaultValue,!0):Ma(r,!!s.multiple,s.multiple?[]:"",!1))}r[Xo]=s}catch(E){$t(t,t.return,E)}}break;case 6:if(Ti(e,t),$i(t),i&4){if(t.stateNode===null)throw Error(ce(162));r=t.stateNode,s=t.memoizedProps;try{r.nodeValue=s}catch(E){$t(t,t.return,E)}}break;case 3:if(Ti(e,t),$i(t),i&4&&n!==null&&n.memoizedState.isDehydrated)try{Ho(e.containerInfo)}catch(E){$t(t,t.return,E)}break;case 4:Ti(e,t),$i(t);break;case 13:Ti(e,t),$i(t),r=t.child,r.flags&8192&&(s=r.memoizedState!==null,r.stateNode.isHidden=s,!s||r.alternate!==null&&r.alternate.memoizedState!==null||(pp=Kt())),i&4&&o0(t);break;case 22:if(h=n!==null&&n.memoizedState!==null,t.mode&1?(Tn=(c=Tn)||h,Ti(e,t),Tn=c):Ti(e,t),$i(t),i&8192){if(c=t.memoizedState!==null,(t.stateNode.isHidden=c)&&!h&&t.mode&1)for(De=t,h=t.child;h!==null;){for(p=De=h;De!==null;){switch(f=De,g=f.child,f.tag){case 0:case 11:case 14:case 15:Po(4,f,f.return);break;case 1:_a(f,f.return);var v=f.stateNode;if(typeof v.componentWillUnmount=="function"){i=f,n=f.return;try{e=i,v.props=e.memoizedProps,v.state=e.memoizedState,v.componentWillUnmount()}catch(E){$t(i,n,E)}}break;case 5:_a(f,f.return);break;case 22:if(f.memoizedState!==null){c0(p);continue}}g!==null?(g.return=f,De=g):c0(p)}h=h.sibling}e:for(h=null,p=t;;){if(p.tag===5){if(h===null){h=p;try{r=p.stateNode,c?(s=r.style,typeof s.setProperty=="function"?s.setProperty("display","none","important"):s.display="none"):(o=p.stateNode,l=p.memoizedProps.style,a=l!=null&&l.hasOwnProperty("display")?l.display:null,o.style.display=a_("display",a))}catch(E){$t(t,t.return,E)}}}else if(p.tag===6){if(h===null)try{p.stateNode.nodeValue=c?"":p.memoizedProps}catch(E){$t(t,t.return,E)}}else if((p.tag!==22&&p.tag!==23||p.memoizedState===null||p===t)&&p.child!==null){p.child.return=p,p=p.child;continue}if(p===t)break e;for(;p.sibling===null;){if(p.return===null||p.return===t)break e;h===p&&(h=null),p=p.return}h===p&&(h=null),p.sibling.return=p.return,p=p.sibling}}break;case 19:Ti(e,t),$i(t),i&4&&o0(t);break;case 21:break;default:Ti(e,t),$i(t)}}function $i(t){var e=t.flags;if(e&2){try{e:{for(var n=t.return;n!==null;){if(Lv(n)){var i=n;break e}n=n.return}throw Error(ce(160))}switch(i.tag){case 5:var r=i.stateNode;i.flags&32&&(Oo(r,""),i.flags&=-33);var s=a0(t);Cf(t,s,r);break;case 3:case 4:var a=i.stateNode.containerInfo,o=a0(t);Rf(t,o,a);break;default:throw Error(ce(161))}}catch(l){$t(t,t.return,l)}t.flags&=-3}e&4096&&(t.flags&=-4097)}function gM(t,e,n){De=t,Uv(t)}function Uv(t,e,n){for(var i=(t.mode&1)!==0;De!==null;){var r=De,s=r.child;if(r.tag===22&&i){var a=r.memoizedState!==null||Rl;if(!a){var o=r.alternate,l=o!==null&&o.memoizedState!==null||Tn;o=Rl;var c=Tn;if(Rl=a,(Tn=l)&&!c)for(De=r;De!==null;)a=De,l=a.child,a.tag===22&&a.memoizedState!==null?u0(r):l!==null?(l.return=a,De=l):u0(r);for(;s!==null;)De=s,Uv(s),s=s.sibling;De=r,Rl=o,Tn=c}l0(t)}else r.subtreeFlags&8772&&s!==null?(s.return=r,De=s):l0(t)}}function l0(t){for(;De!==null;){var e=De;if(e.flags&8772){var n=e.alternate;try{if(e.flags&8772)switch(e.tag){case 0:case 11:case 15:Tn||hu(5,e);break;case 1:var i=e.stateNode;if(e.flags&4&&!Tn)if(n===null)i.componentDidMount();else{var r=e.elementType===e.type?n.memoizedProps:Ci(e.type,n.memoizedProps);i.componentDidUpdate(r,n.memoizedState,i.__reactInternalSnapshotBeforeUpdate)}var s=e.updateQueue;s!==null&&Xm(e,s,i);break;case 3:var a=e.updateQueue;if(a!==null){if(n=null,e.child!==null)switch(e.child.tag){case 5:n=e.child.stateNode;break;case 1:n=e.child.stateNode}Xm(e,a,n)}break;case 5:var o=e.stateNode;if(n===null&&e.flags&4){n=o;var l=e.memoizedProps;switch(e.type){case"button":case"input":case"select":case"textarea":l.autoFocus&&n.focus();break;case"img":l.src&&(n.src=l.src)}}break;case 6:break;case 4:break;case 12:break;case 13:if(e.memoizedState===null){var c=e.alternate;if(c!==null){var h=c.memoizedState;if(h!==null){var p=h.dehydrated;p!==null&&Ho(p)}}}break;case 19:case 17:case 21:case 22:case 23:case 25:break;default:throw Error(ce(163))}Tn||e.flags&512&&bf(e)}catch(f){$t(e,e.return,f)}}if(e===t){De=null;break}if(n=e.sibling,n!==null){n.return=e.return,De=n;break}De=e.return}}function c0(t){for(;De!==null;){var e=De;if(e===t){De=null;break}var n=e.sibling;if(n!==null){n.return=e.return,De=n;break}De=e.return}}function u0(t){for(;De!==null;){var e=De;try{switch(e.tag){case 0:case 11:case 15:var n=e.return;try{hu(4,e)}catch(l){$t(e,n,l)}break;case 1:var i=e.stateNode;if(typeof i.componentDidMount=="function"){var r=e.return;try{i.componentDidMount()}catch(l){$t(e,r,l)}}var s=e.return;try{bf(e)}catch(l){$t(e,s,l)}break;case 5:var a=e.return;try{bf(e)}catch(l){$t(e,a,l)}}}catch(l){$t(e,e.return,l)}if(e===t){De=null;break}var o=e.sibling;if(o!==null){o.return=e.return,De=o;break}De=e.return}}var _M=Math.ceil,Vc=Dr.ReactCurrentDispatcher,fp=Dr.ReactCurrentOwner,_i=Dr.ReactCurrentBatchConfig,_t=0,fn=null,Jt=null,_n=0,Qn=0,va=ds(0),rn=0,Qo=null,Is=0,pu=0,hp=0,No=null,Hn=null,pp=0,ka=1/0,_r=null,Gc=!1,Pf=null,is=null,Cl=!1,Kr=null,Wc=0,Lo=0,Nf=null,mc=-1,gc=0;function Dn(){return _t&6?Kt():mc!==-1?mc:mc=Kt()}function rs(t){return t.mode&1?_t&2&&_n!==0?_n&-_n:eM.transition!==null?(gc===0&&(gc=x_()),gc):(t=bt,t!==0||(t=window.event,t=t===void 0?16:A_(t.type)),t):1}function Fi(t,e,n,i){if(50<Lo)throw Lo=0,Nf=null,Error(ce(185));sl(t,n,i),(!(_t&2)||t!==fn)&&(t===fn&&(!(_t&2)&&(pu|=n),rn===4&&$r(t,_n)),Xn(t,i),n===1&&_t===0&&!(e.mode&1)&&(ka=Kt()+500,uu&&fs()))}function Xn(t,e){var n=t.callbackNode;eS(t,e);var i=bc(t,t===fn?_n:0);if(i===0)n!==null&&xm(n),t.callbackNode=null,t.callbackPriority=0;else if(e=i&-i,t.callbackPriority!==e){if(n!=null&&xm(n),e===1)t.tag===0?JS(d0.bind(null,t)):j_(d0.bind(null,t)),YS(function(){!(_t&6)&&fs()}),n=null;else{switch(y_(i)){case 1:n=zh;break;case 4:n=__;break;case 16:n=Ac;break;case 536870912:n=v_;break;default:n=Ac}n=Gv(n,Fv.bind(null,t))}t.callbackPriority=e,t.callbackNode=n}}function Fv(t,e){if(mc=-1,gc=0,_t&6)throw Error(ce(327));var n=t.callbackNode;if(ba()&&t.callbackNode!==n)return null;var i=bc(t,t===fn?_n:0);if(i===0)return null;if(i&30||i&t.expiredLanes||e)e=jc(t,i);else{e=i;var r=_t;_t|=2;var s=kv();(fn!==t||_n!==e)&&(_r=null,ka=Kt()+500,Cs(t,e));do try{yM();break}catch(o){Ov(t,o)}while(!0);Jh(),Vc.current=s,_t=r,Jt!==null?e=0:(fn=null,_n=0,e=rn)}if(e!==0){if(e===2&&(r=rf(t),r!==0&&(i=r,e=Lf(t,r))),e===1)throw n=Qo,Cs(t,0),$r(t,i),Xn(t,Kt()),n;if(e===6)$r(t,i);else{if(r=t.current.alternate,!(i&30)&&!vM(r)&&(e=jc(t,i),e===2&&(s=rf(t),s!==0&&(i=s,e=Lf(t,s))),e===1))throw n=Qo,Cs(t,0),$r(t,i),Xn(t,Kt()),n;switch(t.finishedWork=r,t.finishedLanes=i,e){case 0:case 1:throw Error(ce(345));case 2:Es(t,Hn,_r);break;case 3:if($r(t,i),(i&130023424)===i&&(e=pp+500-Kt(),10<e)){if(bc(t,0)!==0)break;if(r=t.suspendedLanes,(r&i)!==i){Dn(),t.pingedLanes|=t.suspendedLanes&r;break}t.timeoutHandle=ff(Es.bind(null,t,Hn,_r),e);break}Es(t,Hn,_r);break;case 4:if($r(t,i),(i&4194240)===i)break;for(e=t.eventTimes,r=-1;0<i;){var a=31-Ui(i);s=1<<a,a=e[a],a>r&&(r=a),i&=~s}if(i=r,i=Kt()-i,i=(120>i?120:480>i?480:1080>i?1080:1920>i?1920:3e3>i?3e3:4320>i?4320:1960*_M(i/1960))-i,10<i){t.timeoutHandle=ff(Es.bind(null,t,Hn,_r),i);break}Es(t,Hn,_r);break;case 5:Es(t,Hn,_r);break;default:throw Error(ce(329))}}}return Xn(t,Kt()),t.callbackNode===n?Fv.bind(null,t):null}function Lf(t,e){var n=No;return t.current.memoizedState.isDehydrated&&(Cs(t,e).flags|=256),t=jc(t,e),t!==2&&(e=Hn,Hn=n,e!==null&&Df(e)),t}function Df(t){Hn===null?Hn=t:Hn.push.apply(Hn,t)}function vM(t){for(var e=t;;){if(e.flags&16384){var n=e.updateQueue;if(n!==null&&(n=n.stores,n!==null))for(var i=0;i<n.length;i++){var r=n[i],s=r.getSnapshot;r=r.value;try{if(!ki(s(),r))return!1}catch{return!1}}}if(n=e.child,e.subtreeFlags&16384&&n!==null)n.return=e,e=n;else{if(e===t)break;for(;e.sibling===null;){if(e.return===null||e.return===t)return!0;e=e.return}e.sibling.return=e.return,e=e.sibling}}return!0}function $r(t,e){for(e&=~hp,e&=~pu,t.suspendedLanes|=e,t.pingedLanes&=~e,t=t.expirationTimes;0<e;){var n=31-Ui(e),i=1<<n;t[n]=-1,e&=~i}}function d0(t){if(_t&6)throw Error(ce(327));ba();var e=bc(t,0);if(!(e&1))return Xn(t,Kt()),null;var n=jc(t,e);if(t.tag!==0&&n===2){var i=rf(t);i!==0&&(e=i,n=Lf(t,i))}if(n===1)throw n=Qo,Cs(t,0),$r(t,e),Xn(t,Kt()),n;if(n===6)throw Error(ce(345));return t.finishedWork=t.current.alternate,t.finishedLanes=e,Es(t,Hn,_r),Xn(t,Kt()),null}function mp(t,e){var n=_t;_t|=1;try{return t(e)}finally{_t=n,_t===0&&(ka=Kt()+500,uu&&fs())}}function Us(t){Kr!==null&&Kr.tag===0&&!(_t&6)&&ba();var e=_t;_t|=1;var n=_i.transition,i=bt;try{if(_i.transition=null,bt=1,t)return t()}finally{bt=i,_i.transition=n,_t=e,!(_t&6)&&fs()}}function gp(){Qn=va.current,Ut(va)}function Cs(t,e){t.finishedWork=null,t.finishedLanes=0;var n=t.timeoutHandle;if(n!==-1&&(t.timeoutHandle=-1,qS(n)),Jt!==null)for(n=Jt.return;n!==null;){var i=n;switch(Kh(i),i.tag){case 1:i=i.type.childContextTypes,i!=null&&Lc();break;case 3:Fa(),Ut(Wn),Ut(Rn),sp();break;case 5:rp(i);break;case 4:Fa();break;case 13:Ut(Vt);break;case 19:Ut(Vt);break;case 10:ep(i.type._context);break;case 22:case 23:gp()}n=n.return}if(fn=t,Jt=t=ss(t.current,null),_n=Qn=e,rn=0,Qo=null,hp=pu=Is=0,Hn=No=null,Ts!==null){for(e=0;e<Ts.length;e++)if(n=Ts[e],i=n.interleaved,i!==null){n.interleaved=null;var r=i.next,s=n.pending;if(s!==null){var a=s.next;s.next=r,i.next=a}n.pending=i}Ts=null}return t}function Ov(t,e){do{var n=Jt;try{if(Jh(),fc.current=Hc,zc){for(var i=Wt.memoizedState;i!==null;){var r=i.queue;r!==null&&(r.pending=null),i=i.next}zc=!1}if(Ds=0,dn=tn=Wt=null,Co=!1,Yo=0,fp.current=null,n===null||n.return===null){rn=1,Qo=e,Jt=null;break}e:{var s=t,a=n.return,o=n,l=e;if(e=_n,o.flags|=32768,l!==null&&typeof l=="object"&&typeof l.then=="function"){var c=l,h=o,p=h.tag;if(!(h.mode&1)&&(p===0||p===11||p===15)){var f=h.alternate;f?(h.updateQueue=f.updateQueue,h.memoizedState=f.memoizedState,h.lanes=f.lanes):(h.updateQueue=null,h.memoizedState=null)}var g=Qm(a);if(g!==null){g.flags&=-257,Jm(g,a,o,s,e),g.mode&1&&Zm(s,c,e),e=g,l=c;var v=e.updateQueue;if(v===null){var E=new Set;E.add(l),e.updateQueue=E}else v.add(l);break e}else{if(!(e&1)){Zm(s,c,e),_p();break e}l=Error(ce(426))}}else if(Ot&&o.mode&1){var _=Qm(a);if(_!==null){!(_.flags&65536)&&(_.flags|=256),Jm(_,a,o,s,e),Zh(Oa(l,o));break e}}s=l=Oa(l,o),rn!==4&&(rn=2),No===null?No=[s]:No.push(s),s=a;do{switch(s.tag){case 3:s.flags|=65536,e&=-e,s.lanes|=e;var u=yv(s,l,e);jm(s,u);break e;case 1:o=l;var m=s.type,M=s.stateNode;if(!(s.flags&128)&&(typeof m.getDerivedStateFromError=="function"||M!==null&&typeof M.componentDidCatch=="function"&&(is===null||!is.has(M)))){s.flags|=65536,e&=-e,s.lanes|=e;var y=Sv(s,o,e);jm(s,y);break e}}s=s.return}while(s!==null)}zv(n)}catch(T){e=T,Jt===n&&n!==null&&(Jt=n=n.return);continue}break}while(!0)}function kv(){var t=Vc.current;return Vc.current=Hc,t===null?Hc:t}function _p(){(rn===0||rn===3||rn===2)&&(rn=4),fn===null||!(Is&268435455)&&!(pu&268435455)||$r(fn,_n)}function jc(t,e){var n=_t;_t|=2;var i=kv();(fn!==t||_n!==e)&&(_r=null,Cs(t,e));do try{xM();break}catch(r){Ov(t,r)}while(!0);if(Jh(),_t=n,Vc.current=i,Jt!==null)throw Error(ce(261));return fn=null,_n=0,rn}function xM(){for(;Jt!==null;)Bv(Jt)}function yM(){for(;Jt!==null&&!jy();)Bv(Jt)}function Bv(t){var e=Vv(t.alternate,t,Qn);t.memoizedProps=t.pendingProps,e===null?zv(t):Jt=e,fp.current=null}function zv(t){var e=t;do{var n=e.alternate;if(t=e.return,e.flags&32768){if(n=hM(n,e),n!==null){n.flags&=32767,Jt=n;return}if(t!==null)t.flags|=32768,t.subtreeFlags=0,t.deletions=null;else{rn=6,Jt=null;return}}else if(n=fM(n,e,Qn),n!==null){Jt=n;return}if(e=e.sibling,e!==null){Jt=e;return}Jt=e=t}while(e!==null);rn===0&&(rn=5)}function Es(t,e,n){var i=bt,r=_i.transition;try{_i.transition=null,bt=1,SM(t,e,n,i)}finally{_i.transition=r,bt=i}return null}function SM(t,e,n,i){do ba();while(Kr!==null);if(_t&6)throw Error(ce(327));n=t.finishedWork;var r=t.finishedLanes;if(n===null)return null;if(t.finishedWork=null,t.finishedLanes=0,n===t.current)throw Error(ce(177));t.callbackNode=null,t.callbackPriority=0;var s=n.lanes|n.childLanes;if(tS(t,s),t===fn&&(Jt=fn=null,_n=0),!(n.subtreeFlags&2064)&&!(n.flags&2064)||Cl||(Cl=!0,Gv(Ac,function(){return ba(),null})),s=(n.flags&15990)!==0,n.subtreeFlags&15990||s){s=_i.transition,_i.transition=null;var a=bt;bt=1;var o=_t;_t|=4,fp.current=null,mM(t,n),Iv(n,t),HS(uf),Rc=!!cf,uf=cf=null,t.current=n,gM(n),Xy(),_t=o,bt=a,_i.transition=s}else t.current=n;if(Cl&&(Cl=!1,Kr=t,Wc=r),s=t.pendingLanes,s===0&&(is=null),Yy(n.stateNode),Xn(t,Kt()),e!==null)for(i=t.onRecoverableError,n=0;n<e.length;n++)r=e[n],i(r.value,{componentStack:r.stack,digest:r.digest});if(Gc)throw Gc=!1,t=Pf,Pf=null,t;return Wc&1&&t.tag!==0&&ba(),s=t.pendingLanes,s&1?t===Nf?Lo++:(Lo=0,Nf=t):Lo=0,fs(),null}function ba(){if(Kr!==null){var t=y_(Wc),e=_i.transition,n=bt;try{if(_i.transition=null,bt=16>t?16:t,Kr===null)var i=!1;else{if(t=Kr,Kr=null,Wc=0,_t&6)throw Error(ce(331));var r=_t;for(_t|=4,De=t.current;De!==null;){var s=De,a=s.child;if(De.flags&16){var o=s.deletions;if(o!==null){for(var l=0;l<o.length;l++){var c=o[l];for(De=c;De!==null;){var h=De;switch(h.tag){case 0:case 11:case 15:Po(8,h,s)}var p=h.child;if(p!==null)p.return=h,De=p;else for(;De!==null;){h=De;var f=h.sibling,g=h.return;if(Nv(h),h===c){De=null;break}if(f!==null){f.return=g,De=f;break}De=g}}}var v=s.alternate;if(v!==null){var E=v.child;if(E!==null){v.child=null;do{var _=E.sibling;E.sibling=null,E=_}while(E!==null)}}De=s}}if(s.subtreeFlags&2064&&a!==null)a.return=s,De=a;else e:for(;De!==null;){if(s=De,s.flags&2048)switch(s.tag){case 0:case 11:case 15:Po(9,s,s.return)}var u=s.sibling;if(u!==null){u.return=s.return,De=u;break e}De=s.return}}var m=t.current;for(De=m;De!==null;){a=De;var M=a.child;if(a.subtreeFlags&2064&&M!==null)M.return=a,De=M;else e:for(a=m;De!==null;){if(o=De,o.flags&2048)try{switch(o.tag){case 0:case 11:case 15:hu(9,o)}}catch(T){$t(o,o.return,T)}if(o===a){De=null;break e}var y=o.sibling;if(y!==null){y.return=o.return,De=y;break e}De=o.return}}if(_t=r,fs(),ir&&typeof ir.onPostCommitFiberRoot=="function")try{ir.onPostCommitFiberRoot(su,t)}catch{}i=!0}return i}finally{bt=n,_i.transition=e}}return!1}function f0(t,e,n){e=Oa(n,e),e=yv(t,e,1),t=ns(t,e,1),e=Dn(),t!==null&&(sl(t,1,e),Xn(t,e))}function $t(t,e,n){if(t.tag===3)f0(t,t,n);else for(;e!==null;){if(e.tag===3){f0(e,t,n);break}else if(e.tag===1){var i=e.stateNode;if(typeof e.type.getDerivedStateFromError=="function"||typeof i.componentDidCatch=="function"&&(is===null||!is.has(i))){t=Oa(n,t),t=Sv(e,t,1),e=ns(e,t,1),t=Dn(),e!==null&&(sl(e,1,t),Xn(e,t));break}}e=e.return}}function MM(t,e,n){var i=t.pingCache;i!==null&&i.delete(e),e=Dn(),t.pingedLanes|=t.suspendedLanes&n,fn===t&&(_n&n)===n&&(rn===4||rn===3&&(_n&130023424)===_n&&500>Kt()-pp?Cs(t,0):hp|=n),Xn(t,e)}function Hv(t,e){e===0&&(t.mode&1?(e=xl,xl<<=1,!(xl&130023424)&&(xl=4194304)):e=1);var n=Dn();t=Cr(t,e),t!==null&&(sl(t,e,n),Xn(t,n))}function EM(t){var e=t.memoizedState,n=0;e!==null&&(n=e.retryLane),Hv(t,n)}function wM(t,e){var n=0;switch(t.tag){case 13:var i=t.stateNode,r=t.memoizedState;r!==null&&(n=r.retryLane);break;case 19:i=t.stateNode;break;default:throw Error(ce(314))}i!==null&&i.delete(e),Hv(t,n)}var Vv;Vv=function(t,e,n){if(t!==null)if(t.memoizedProps!==e.pendingProps||Wn.current)Gn=!0;else{if(!(t.lanes&n)&&!(e.flags&128))return Gn=!1,dM(t,e,n);Gn=!!(t.flags&131072)}else Gn=!1,Ot&&e.flags&1048576&&X_(e,Uc,e.index);switch(e.lanes=0,e.tag){case 2:var i=e.type;pc(t,e),t=e.pendingProps;var r=Da(e,Rn.current);Aa(e,n),r=op(null,e,i,t,r,n);var s=lp();return e.flags|=1,typeof r=="object"&&r!==null&&typeof r.render=="function"&&r.$$typeof===void 0?(e.tag=1,e.memoizedState=null,e.updateQueue=null,jn(i)?(s=!0,Dc(e)):s=!1,e.memoizedState=r.state!==null&&r.state!==void 0?r.state:null,np(e),r.updater=fu,e.stateNode=r,r._reactInternals=e,xf(e,i,t,n),e=Mf(null,e,i,!0,s,n)):(e.tag=0,Ot&&s&&Yh(e),Nn(null,e,r,n),e=e.child),e;case 16:i=e.elementType;e:{switch(pc(t,e),t=e.pendingProps,r=i._init,i=r(i._payload),e.type=i,r=e.tag=AM(i),t=Ci(i,t),r){case 0:e=Sf(null,e,i,t,n);break e;case 1:e=n0(null,e,i,t,n);break e;case 11:e=e0(null,e,i,t,n);break e;case 14:e=t0(null,e,i,Ci(i.type,t),n);break e}throw Error(ce(306,i,""))}return e;case 0:return i=e.type,r=e.pendingProps,r=e.elementType===i?r:Ci(i,r),Sf(t,e,i,r,n);case 1:return i=e.type,r=e.pendingProps,r=e.elementType===i?r:Ci(i,r),n0(t,e,i,r,n);case 3:e:{if(Tv(e),t===null)throw Error(ce(387));i=e.pendingProps,s=e.memoizedState,r=s.element,Q_(t,e),kc(e,i,null,n);var a=e.memoizedState;if(i=a.element,s.isDehydrated)if(s={element:i,isDehydrated:!1,cache:a.cache,pendingSuspenseBoundaries:a.pendingSuspenseBoundaries,transitions:a.transitions},e.updateQueue.baseState=s,e.memoizedState=s,e.flags&256){r=Oa(Error(ce(423)),e),e=i0(t,e,i,n,r);break e}else if(i!==r){r=Oa(Error(ce(424)),e),e=i0(t,e,i,n,r);break e}else for(ni=ts(e.stateNode.containerInfo.firstChild),ri=e,Ot=!0,Ni=null,n=K_(e,null,i,n),e.child=n;n;)n.flags=n.flags&-3|4096,n=n.sibling;else{if(Ia(),i===r){e=Pr(t,e,n);break e}Nn(t,e,i,n)}e=e.child}return e;case 5:return J_(e),t===null&&gf(e),i=e.type,r=e.pendingProps,s=t!==null?t.memoizedProps:null,a=r.children,df(i,r)?a=null:s!==null&&df(i,s)&&(e.flags|=32),wv(t,e),Nn(t,e,a,n),e.child;case 6:return t===null&&gf(e),null;case 13:return Av(t,e,n);case 4:return ip(e,e.stateNode.containerInfo),i=e.pendingProps,t===null?e.child=Ua(e,null,i,n):Nn(t,e,i,n),e.child;case 11:return i=e.type,r=e.pendingProps,r=e.elementType===i?r:Ci(i,r),e0(t,e,i,r,n);case 7:return Nn(t,e,e.pendingProps,n),e.child;case 8:return Nn(t,e,e.pendingProps.children,n),e.child;case 12:return Nn(t,e,e.pendingProps.children,n),e.child;case 10:e:{if(i=e.type._context,r=e.pendingProps,s=e.memoizedProps,a=r.value,Nt(Fc,i._currentValue),i._currentValue=a,s!==null)if(ki(s.value,a)){if(s.children===r.children&&!Wn.current){e=Pr(t,e,n);break e}}else for(s=e.child,s!==null&&(s.return=e);s!==null;){var o=s.dependencies;if(o!==null){a=s.child;for(var l=o.firstContext;l!==null;){if(l.context===i){if(s.tag===1){l=Er(-1,n&-n),l.tag=2;var c=s.updateQueue;if(c!==null){c=c.shared;var h=c.pending;h===null?l.next=l:(l.next=h.next,h.next=l),c.pending=l}}s.lanes|=n,l=s.alternate,l!==null&&(l.lanes|=n),_f(s.return,n,e),o.lanes|=n;break}l=l.next}}else if(s.tag===10)a=s.type===e.type?null:s.child;else if(s.tag===18){if(a=s.return,a===null)throw Error(ce(341));a.lanes|=n,o=a.alternate,o!==null&&(o.lanes|=n),_f(a,n,e),a=s.sibling}else a=s.child;if(a!==null)a.return=s;else for(a=s;a!==null;){if(a===e){a=null;break}if(s=a.sibling,s!==null){s.return=a.return,a=s;break}a=a.return}s=a}Nn(t,e,r.children,n),e=e.child}return e;case 9:return r=e.type,i=e.pendingProps.children,Aa(e,n),r=vi(r),i=i(r),e.flags|=1,Nn(t,e,i,n),e.child;case 14:return i=e.type,r=Ci(i,e.pendingProps),r=Ci(i.type,r),t0(t,e,i,r,n);case 15:return Mv(t,e,e.type,e.pendingProps,n);case 17:return i=e.type,r=e.pendingProps,r=e.elementType===i?r:Ci(i,r),pc(t,e),e.tag=1,jn(i)?(t=!0,Dc(e)):t=!1,Aa(e,n),xv(e,i,r),xf(e,i,r,n),Mf(null,e,i,!0,t,n);case 19:return bv(t,e,n);case 22:return Ev(t,e,n)}throw Error(ce(156,e.tag))};function Gv(t,e){return g_(t,e)}function TM(t,e,n,i){this.tag=t,this.key=n,this.sibling=this.child=this.return=this.stateNode=this.type=this.elementType=null,this.index=0,this.ref=null,this.pendingProps=e,this.dependencies=this.memoizedState=this.updateQueue=this.memoizedProps=null,this.mode=i,this.subtreeFlags=this.flags=0,this.deletions=null,this.childLanes=this.lanes=0,this.alternate=null}function gi(t,e,n,i){return new TM(t,e,n,i)}function vp(t){return t=t.prototype,!(!t||!t.isReactComponent)}function AM(t){if(typeof t=="function")return vp(t)?1:0;if(t!=null){if(t=t.$$typeof,t===Oh)return 11;if(t===kh)return 14}return 2}function ss(t,e){var n=t.alternate;return n===null?(n=gi(t.tag,e,t.key,t.mode),n.elementType=t.elementType,n.type=t.type,n.stateNode=t.stateNode,n.alternate=t,t.alternate=n):(n.pendingProps=e,n.type=t.type,n.flags=0,n.subtreeFlags=0,n.deletions=null),n.flags=t.flags&14680064,n.childLanes=t.childLanes,n.lanes=t.lanes,n.child=t.child,n.memoizedProps=t.memoizedProps,n.memoizedState=t.memoizedState,n.updateQueue=t.updateQueue,e=t.dependencies,n.dependencies=e===null?null:{lanes:e.lanes,firstContext:e.firstContext},n.sibling=t.sibling,n.index=t.index,n.ref=t.ref,n}function _c(t,e,n,i,r,s){var a=2;if(i=t,typeof t=="function")vp(t)&&(a=1);else if(typeof t=="string")a=5;else e:switch(t){case la:return Ps(n.children,r,s,e);case Fh:a=8,r|=8;break;case Vd:return t=gi(12,n,e,r|2),t.elementType=Vd,t.lanes=s,t;case Gd:return t=gi(13,n,e,r),t.elementType=Gd,t.lanes=s,t;case Wd:return t=gi(19,n,e,r),t.elementType=Wd,t.lanes=s,t;case Jg:return mu(n,r,s,e);default:if(typeof t=="object"&&t!==null)switch(t.$$typeof){case Zg:a=10;break e;case Qg:a=9;break e;case Oh:a=11;break e;case kh:a=14;break e;case Wr:a=16,i=null;break e}throw Error(ce(130,t==null?t:typeof t,""))}return e=gi(a,n,e,r),e.elementType=t,e.type=i,e.lanes=s,e}function Ps(t,e,n,i){return t=gi(7,t,i,e),t.lanes=n,t}function mu(t,e,n,i){return t=gi(22,t,i,e),t.elementType=Jg,t.lanes=n,t.stateNode={isHidden:!1},t}function id(t,e,n){return t=gi(6,t,null,e),t.lanes=n,t}function rd(t,e,n){return e=gi(4,t.children!==null?t.children:[],t.key,e),e.lanes=n,e.stateNode={containerInfo:t.containerInfo,pendingChildren:null,implementation:t.implementation},e}function bM(t,e,n,i,r){this.tag=e,this.containerInfo=t,this.finishedWork=this.pingCache=this.current=this.pendingChildren=null,this.timeoutHandle=-1,this.callbackNode=this.pendingContext=this.context=null,this.callbackPriority=0,this.eventTimes=ku(0),this.expirationTimes=ku(-1),this.entangledLanes=this.finishedLanes=this.mutableReadLanes=this.expiredLanes=this.pingedLanes=this.suspendedLanes=this.pendingLanes=0,this.entanglements=ku(0),this.identifierPrefix=i,this.onRecoverableError=r,this.mutableSourceEagerHydrationData=null}function xp(t,e,n,i,r,s,a,o,l){return t=new bM(t,e,n,o,l),e===1?(e=1,s===!0&&(e|=8)):e=0,s=gi(3,null,null,e),t.current=s,s.stateNode=t,s.memoizedState={element:i,isDehydrated:n,cache:null,transitions:null,pendingSuspenseBoundaries:null},np(s),t}function RM(t,e,n){var i=3<arguments.length&&arguments[3]!==void 0?arguments[3]:null;return{$$typeof:oa,key:i==null?null:""+i,children:t,containerInfo:e,implementation:n}}function Wv(t){if(!t)return os;t=t._reactInternals;e:{if(zs(t)!==t||t.tag!==1)throw Error(ce(170));var e=t;do{switch(e.tag){case 3:e=e.stateNode.context;break e;case 1:if(jn(e.type)){e=e.stateNode.__reactInternalMemoizedMergedChildContext;break e}}e=e.return}while(e!==null);throw Error(ce(171))}if(t.tag===1){var n=t.type;if(jn(n))return W_(t,n,e)}return e}function jv(t,e,n,i,r,s,a,o,l){return t=xp(n,i,!0,t,r,s,a,o,l),t.context=Wv(null),n=t.current,i=Dn(),r=rs(n),s=Er(i,r),s.callback=e??null,ns(n,s,r),t.current.lanes=r,sl(t,r,i),Xn(t,i),t}function gu(t,e,n,i){var r=e.current,s=Dn(),a=rs(r);return n=Wv(n),e.context===null?e.context=n:e.pendingContext=n,e=Er(s,a),e.payload={element:t},i=i===void 0?null:i,i!==null&&(e.callback=i),t=ns(r,e,a),t!==null&&(Fi(t,r,a,s),dc(t,r,a)),a}function Xc(t){if(t=t.current,!t.child)return null;switch(t.child.tag){case 5:return t.child.stateNode;default:return t.child.stateNode}}function h0(t,e){if(t=t.memoizedState,t!==null&&t.dehydrated!==null){var n=t.retryLane;t.retryLane=n!==0&&n<e?n:e}}function yp(t,e){h0(t,e),(t=t.alternate)&&h0(t,e)}function CM(){return null}var Xv=typeof reportError=="function"?reportError:function(t){console.error(t)};function Sp(t){this._internalRoot=t}_u.prototype.render=Sp.prototype.render=function(t){var e=this._internalRoot;if(e===null)throw Error(ce(409));gu(t,e,null,null)};_u.prototype.unmount=Sp.prototype.unmount=function(){var t=this._internalRoot;if(t!==null){this._internalRoot=null;var e=t.containerInfo;Us(function(){gu(null,t,null,null)}),e[Rr]=null}};function _u(t){this._internalRoot=t}_u.prototype.unstable_scheduleHydration=function(t){if(t){var e=E_();t={blockedOn:null,target:t,priority:e};for(var n=0;n<Xr.length&&e!==0&&e<Xr[n].priority;n++);Xr.splice(n,0,t),n===0&&T_(t)}};function Mp(t){return!(!t||t.nodeType!==1&&t.nodeType!==9&&t.nodeType!==11)}function vu(t){return!(!t||t.nodeType!==1&&t.nodeType!==9&&t.nodeType!==11&&(t.nodeType!==8||t.nodeValue!==" react-mount-point-unstable "))}function p0(){}function PM(t,e,n,i,r){if(r){if(typeof i=="function"){var s=i;i=function(){var c=Xc(a);s.call(c)}}var a=jv(e,i,t,0,null,!1,!1,"",p0);return t._reactRootContainer=a,t[Rr]=a.current,Wo(t.nodeType===8?t.parentNode:t),Us(),a}for(;r=t.lastChild;)t.removeChild(r);if(typeof i=="function"){var o=i;i=function(){var c=Xc(l);o.call(c)}}var l=xp(t,0,!1,null,null,!1,!1,"",p0);return t._reactRootContainer=l,t[Rr]=l.current,Wo(t.nodeType===8?t.parentNode:t),Us(function(){gu(e,l,n,i)}),l}function xu(t,e,n,i,r){var s=n._reactRootContainer;if(s){var a=s;if(typeof r=="function"){var o=r;r=function(){var l=Xc(a);o.call(l)}}gu(e,a,t,r)}else a=PM(n,e,t,r,i);return Xc(a)}S_=function(t){switch(t.tag){case 3:var e=t.stateNode;if(e.current.memoizedState.isDehydrated){var n=xo(e.pendingLanes);n!==0&&(Hh(e,n|1),Xn(e,Kt()),!(_t&6)&&(ka=Kt()+500,fs()))}break;case 13:Us(function(){var i=Cr(t,1);if(i!==null){var r=Dn();Fi(i,t,1,r)}}),yp(t,1)}};Vh=function(t){if(t.tag===13){var e=Cr(t,134217728);if(e!==null){var n=Dn();Fi(e,t,134217728,n)}yp(t,134217728)}};M_=function(t){if(t.tag===13){var e=rs(t),n=Cr(t,e);if(n!==null){var i=Dn();Fi(n,t,e,i)}yp(t,e)}};E_=function(){return bt};w_=function(t,e){var n=bt;try{return bt=t,e()}finally{bt=n}};ef=function(t,e,n){switch(e){case"input":if($d(t,n),e=n.name,n.type==="radio"&&e!=null){for(n=t;n.parentNode;)n=n.parentNode;for(n=n.querySelectorAll("input[name="+JSON.stringify(""+e)+'][type="radio"]'),e=0;e<n.length;e++){var i=n[e];if(i!==t&&i.form===t.form){var r=cu(i);if(!r)throw Error(ce(90));t_(i),$d(i,r)}}}break;case"textarea":i_(t,n);break;case"select":e=n.value,e!=null&&Ma(t,!!n.multiple,e,!1)}};u_=mp;d_=Us;var NM={usingClientEntryPoint:!1,Events:[ol,fa,cu,l_,c_,mp]},oo={findFiberByHostInstance:ws,bundleType:0,version:"18.3.1",rendererPackageName:"react-dom"},LM={bundleType:oo.bundleType,version:oo.version,rendererPackageName:oo.rendererPackageName,rendererConfig:oo.rendererConfig,overrideHookState:null,overrideHookStateDeletePath:null,overrideHookStateRenamePath:null,overrideProps:null,overridePropsDeletePath:null,overridePropsRenamePath:null,setErrorHandler:null,setSuspenseHandler:null,scheduleUpdate:null,currentDispatcherRef:Dr.ReactCurrentDispatcher,findHostInstanceByFiber:function(t){return t=p_(t),t===null?null:t.stateNode},findFiberByHostInstance:oo.findFiberByHostInstance||CM,findHostInstancesForRefresh:null,scheduleRefresh:null,scheduleRoot:null,setRefreshHandler:null,getCurrentFiber:null,reconcilerVersion:"18.3.1-next-f1338f8080-20240426"};if(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__<"u"){var Pl=__REACT_DEVTOOLS_GLOBAL_HOOK__;if(!Pl.isDisabled&&Pl.supportsFiber)try{su=Pl.inject(LM),ir=Pl}catch{}}ai.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED=NM;ai.createPortal=function(t,e){var n=2<arguments.length&&arguments[2]!==void 0?arguments[2]:null;if(!Mp(e))throw Error(ce(200));return RM(t,e,null,n)};ai.createRoot=function(t,e){if(!Mp(t))throw Error(ce(299));var n=!1,i="",r=Xv;return e!=null&&(e.unstable_strictMode===!0&&(n=!0),e.identifierPrefix!==void 0&&(i=e.identifierPrefix),e.onRecoverableError!==void 0&&(r=e.onRecoverableError)),e=xp(t,1,!1,null,null,n,!1,i,r),t[Rr]=e.current,Wo(t.nodeType===8?t.parentNode:t),new Sp(e)};ai.findDOMNode=function(t){if(t==null)return null;if(t.nodeType===1)return t;var e=t._reactInternals;if(e===void 0)throw typeof t.render=="function"?Error(ce(188)):(t=Object.keys(t).join(","),Error(ce(268,t)));return t=p_(e),t=t===null?null:t.stateNode,t};ai.flushSync=function(t){return Us(t)};ai.hydrate=function(t,e,n){if(!vu(e))throw Error(ce(200));return xu(null,t,e,!0,n)};ai.hydrateRoot=function(t,e,n){if(!Mp(t))throw Error(ce(405));var i=n!=null&&n.hydratedSources||null,r=!1,s="",a=Xv;if(n!=null&&(n.unstable_strictMode===!0&&(r=!0),n.identifierPrefix!==void 0&&(s=n.identifierPrefix),n.onRecoverableError!==void 0&&(a=n.onRecoverableError)),e=jv(e,null,t,1,n??null,r,!1,s,a),t[Rr]=e.current,Wo(t),i)for(t=0;t<i.length;t++)n=i[t],r=n._getVersion,r=r(n._source),e.mutableSourceEagerHydrationData==null?e.mutableSourceEagerHydrationData=[n,r]:e.mutableSourceEagerHydrationData.push(n,r);return new _u(e)};ai.render=function(t,e,n){if(!vu(e))throw Error(ce(200));return xu(null,t,e,!1,n)};ai.unmountComponentAtNode=function(t){if(!vu(t))throw Error(ce(40));return t._reactRootContainer?(Us(function(){xu(null,null,t,!1,function(){t._reactRootContainer=null,t[Rr]=null})}),!0):!1};ai.unstable_batchedUpdates=mp;ai.unstable_renderSubtreeIntoContainer=function(t,e,n,i){if(!vu(n))throw Error(ce(200));if(t==null||t._reactInternals===void 0)throw Error(ce(38));return xu(t,e,n,!1,i)};ai.version="18.3.1-next-f1338f8080-20240426";function $v(){if(!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__>"u"||typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE!="function"))try{__REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE($v)}catch(t){console.error(t)}}$v(),$g.exports=ai;var DM=$g.exports,qv,m0=DM;qv=m0.createRoot,m0.hydrateRoot;/**
 * @license
 * Copyright 2010-2026 Three.js Authors
 * SPDX-License-Identifier: MIT
 */const Ep="186",Ra={ROTATE:0,DOLLY:1,PAN:2},xa={ROTATE:0,PAN:1,DOLLY_PAN:2,DOLLY_ROTATE:3},IM=0,g0=1,UM=2,Do=1,FM=2,So=3,Fs=0,$n=1,Vn=2,wr=0,Io=1,_0=2,v0=3,x0=4,OM=5,aa=100,kM=101,BM=102,zM=103,HM=104,VM=200,GM=201,WM=202,jM=203,Yv=204,Kv=205,XM=206,$M=207,qM=208,YM=209,KM=210,ZM=211,QM=212,JM=213,eE=214,If=0,Uf=1,Ff=2,Jo=3,Of=4,kf=5,Bf=6,zf=7,Zv=0,tE=1,nE=2,sr=0,Qv=1,Jv=2,ex=3,tx=4,nx=5,ix=6,rx=7,sx=300,Os=301,Ba=302,sd=303,ad=304,yu=306,Hf=1e3,Mr=1001,Vf=1002,gn=1003,iE=1004,Nl=1005,An=1006,od=1007,bs=1008,ti=1009,ax=1010,ox=1011,el=1012,wp=1013,ar=1014,tr=1015,or=1016,Tp=1017,Ap=1018,tl=1020,lx=35902,cx=35899,ux=1021,dx=1022,Ii=1023,Nr=1026,Rs=1027,fx=1028,bp=1029,ks=1030,Rp=1031,Cp=1033,vc=33776,xc=33777,yc=33778,Sc=33779,Gf=35840,Wf=35841,jf=35842,Xf=35843,$f=36196,qf=37492,Yf=37496,Kf=37488,Zf=37489,$c=37490,Qf=37491,Jf=37808,eh=37809,th=37810,nh=37811,ih=37812,rh=37813,sh=37814,ah=37815,oh=37816,lh=37817,ch=37818,uh=37819,dh=37820,fh=37821,hh=36492,ph=36494,mh=36495,gh=36283,_h=36284,qc=36285,vh=36286,rE=3200,xh=0,sE=1,qr="",fi="srgb",Yc="srgb-linear",Kc="linear",Tt="srgb",ld=7680,aE=519,oE=512,lE=513,cE=514,Pp=515,uE=516,dE=517,Np=518,fE=519,hE=35044,y0="300 es",nr=2e3,nl=2001;function pE(t){for(let e=t.length-1;e>=0;--e)if(t[e]>=65535)return!0;return!1}function Zc(t){return document.createElementNS("http://www.w3.org/1999/xhtml",t)}function mE(){const t=Zc("canvas");return t.style.display="block",t}const S0={};function M0(...t){const e="THREE."+t.shift();console.log(e,...t)}function hx(t){const e=t[0];if(typeof e=="string"&&e.startsWith("TSL:")){const n=t[1];n&&n.isStackTrace?t[0]+=" "+n.getLocation():t[1]='Stack trace not available. Enable "THREE.Node.captureStackTrace" to capture stack traces.'}return t}function Ge(...t){t=hx(t);const e="THREE."+t.shift();{const n=t[0];n&&n.isStackTrace?console.warn(n.getError(e)):console.warn(e,...t)}}function gt(...t){t=hx(t);const e="THREE."+t.shift();{const n=t[0];n&&n.isStackTrace?console.error(n.getError(e)):console.error(e,...t)}}function Ca(...t){const e=t.join(" ");e in S0||(S0[e]=!0,Ge(...t))}function gE(t,e,n){return new Promise(function(i,r){function s(){switch(t.clientWaitSync(e,t.SYNC_FLUSH_COMMANDS_BIT,0)){case t.WAIT_FAILED:r();break;case t.TIMEOUT_EXPIRED:setTimeout(s,n);break;default:i()}}setTimeout(s,n)})}const _E={[If]:Uf,[Ff]:Bf,[Of]:zf,[Jo]:kf,[Uf]:If,[Bf]:Ff,[zf]:Of,[kf]:Jo};class hs{addEventListener(e,n){this._listeners===void 0&&(this._listeners={});const i=this._listeners;i[e]===void 0&&(i[e]=[]),i[e].indexOf(n)===-1&&i[e].push(n)}hasEventListener(e,n){const i=this._listeners;return i===void 0?!1:i[e]!==void 0&&i[e].indexOf(n)!==-1}removeEventListener(e,n){const i=this._listeners;if(i===void 0)return;const r=i[e];if(r!==void 0){const s=r.indexOf(n);s!==-1&&r.splice(s,1)}}dispatchEvent(e){const n=this._listeners;if(n===void 0)return;const i=n[e.type];if(i!==void 0){e.target=this;const r=i.slice(0);for(let s=0,a=r.length;s<a;s++)r[s].call(this,e);e.target=null}}}const Mn=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"],Uo=Math.PI/180,yh=180/Math.PI;function cl(){const t=Math.random()*4294967295|0,e=Math.random()*4294967295|0,n=Math.random()*4294967295|0,i=Math.random()*4294967295|0;return(Mn[t&255]+Mn[t>>8&255]+Mn[t>>16&255]+Mn[t>>24&255]+"-"+Mn[e&255]+Mn[e>>8&255]+"-"+Mn[e>>16&15|64]+Mn[e>>24&255]+"-"+Mn[n&63|128]+Mn[n>>8&255]+"-"+Mn[n>>16&255]+Mn[n>>24&255]+Mn[i&255]+Mn[i>>8&255]+Mn[i>>16&255]+Mn[i>>24&255]).toLowerCase()}function lt(t,e,n){return Math.max(e,Math.min(n,t))}function vE(t,e){return(t%e+e)%e}function cd(t,e,n){return(1-n)*t+n*e}function lo(t,e){switch(e.constructor){case Float32Array:return t;case Uint32Array:return t/4294967295;case Uint16Array:return t/65535;case Uint8Array:case Uint8ClampedArray:return t/255;case Int32Array:return Math.max(t/2147483647,-1);case Int16Array:return Math.max(t/32767,-1);case Int8Array:return Math.max(t/127,-1);default:throw new Error("THREE.MathUtils: Invalid component type.")}}function Bn(t,e){switch(e.constructor){case Float32Array:return t;case Uint32Array:return Math.round(t*4294967295);case Uint16Array:return Math.round(t*65535);case Uint8Array:case Uint8ClampedArray:return Math.round(t*255);case Int32Array:return Math.round(t*2147483647);case Int16Array:return Math.round(t*32767);case Int8Array:return Math.round(t*127);default:throw new Error("THREE.MathUtils: Invalid component type.")}}const xE={DEG2RAD:Uo},qp=class qp{constructor(e=0,n=0){this.x=e,this.y=n}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,n){return this.x=e,this.y=n,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,n){switch(e){case 0:this.x=n;break;case 1:this.y=n;break;default:throw new Error("THREE.Vector2: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw new Error("THREE.Vector2: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,n){return this.x=e.x+n.x,this.y=e.y+n.y,this}addScaledVector(e,n){return this.x+=e.x*n,this.y+=e.y*n,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,n){return this.x=e.x-n.x,this.y=e.y-n.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){const n=this.x,i=this.y,r=e.elements;return this.x=r[0]*n+r[3]*i+r[6],this.y=r[1]*n+r[4]*i+r[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,n){return this.x=lt(this.x,e.x,n.x),this.y=lt(this.y,e.y,n.y),this}clampScalar(e,n){return this.x=lt(this.x,e,n),this.y=lt(this.y,e,n),this}clampLength(e,n){const i=this.length();return this.divideScalar(i||1).multiplyScalar(lt(i,e,n))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(e){const n=Math.sqrt(this.lengthSq()*e.lengthSq());if(n===0)return Math.PI/2;const i=this.dot(e)/n;return Math.acos(lt(i,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){const n=this.x-e.x,i=this.y-e.y;return n*n+i*i}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,n){return this.x+=(e.x-this.x)*n,this.y+=(e.y-this.y)*n,this}lerpVectors(e,n,i){return this.x=e.x+(n.x-e.x)*i,this.y=e.y+(n.y-e.y)*i,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,n=0){return this.x=e[n],this.y=e[n+1],this}toArray(e=[],n=0){return e[n]=this.x,e[n+1]=this.y,e}fromBufferAttribute(e,n){return this.x=e.getX(n),this.y=e.getY(n),this}rotateAround(e,n){const i=Math.cos(n),r=Math.sin(n),s=this.x-e.x,a=this.y-e.y;return this.x=s*i-a*r+e.x,this.y=s*r+a*i+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}};qp.prototype.isVector2=!0;let je=qp;class ls{constructor(e=0,n=0,i=0,r=1){this.isQuaternion=!0,this._x=e,this._y=n,this._z=i,this._w=r}static slerpFlat(e,n,i,r,s,a,o){let l=i[r+0],c=i[r+1],h=i[r+2],p=i[r+3],f=s[a+0],g=s[a+1],v=s[a+2],E=s[a+3];if(p!==E||l!==f||c!==g||h!==v){let _=l*f+c*g+h*v+p*E;_<0&&(f=-f,g=-g,v=-v,E=-E,_=-_);let u=1-o;if(_<.9995){const m=Math.acos(_),M=Math.sin(m);u=Math.sin(u*m)/M,o=Math.sin(o*m)/M,l=l*u+f*o,c=c*u+g*o,h=h*u+v*o,p=p*u+E*o}else{l=l*u+f*o,c=c*u+g*o,h=h*u+v*o,p=p*u+E*o;const m=1/Math.sqrt(l*l+c*c+h*h+p*p);l*=m,c*=m,h*=m,p*=m}}e[n]=l,e[n+1]=c,e[n+2]=h,e[n+3]=p}static multiplyQuaternionsFlat(e,n,i,r,s,a){const o=i[r],l=i[r+1],c=i[r+2],h=i[r+3],p=s[a],f=s[a+1],g=s[a+2],v=s[a+3];return e[n]=o*v+h*p+l*g-c*f,e[n+1]=l*v+h*f+c*p-o*g,e[n+2]=c*v+h*g+o*f-l*p,e[n+3]=h*v-o*p-l*f-c*g,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,n,i,r){return this._x=e,this._y=n,this._z=i,this._w=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,n=!0){const i=e._x,r=e._y,s=e._z,a=e._order,o=Math.cos,l=Math.sin,c=o(i/2),h=o(r/2),p=o(s/2),f=l(i/2),g=l(r/2),v=l(s/2);switch(a){case"XYZ":this._x=f*h*p+c*g*v,this._y=c*g*p-f*h*v,this._z=c*h*v+f*g*p,this._w=c*h*p-f*g*v;break;case"YXZ":this._x=f*h*p+c*g*v,this._y=c*g*p-f*h*v,this._z=c*h*v-f*g*p,this._w=c*h*p+f*g*v;break;case"ZXY":this._x=f*h*p-c*g*v,this._y=c*g*p+f*h*v,this._z=c*h*v+f*g*p,this._w=c*h*p-f*g*v;break;case"ZYX":this._x=f*h*p-c*g*v,this._y=c*g*p+f*h*v,this._z=c*h*v-f*g*p,this._w=c*h*p+f*g*v;break;case"YZX":this._x=f*h*p+c*g*v,this._y=c*g*p+f*h*v,this._z=c*h*v-f*g*p,this._w=c*h*p-f*g*v;break;case"XZY":this._x=f*h*p-c*g*v,this._y=c*g*p-f*h*v,this._z=c*h*v+f*g*p,this._w=c*h*p+f*g*v;break;default:Ge("Quaternion: .setFromEuler() encountered an unknown order: "+a)}return n===!0&&this._onChangeCallback(),this}setFromAxisAngle(e,n){const i=n/2,r=Math.sin(i);return this._x=e.x*r,this._y=e.y*r,this._z=e.z*r,this._w=Math.cos(i),this._onChangeCallback(),this}setFromRotationMatrix(e){const n=e.elements,i=n[0],r=n[4],s=n[8],a=n[1],o=n[5],l=n[9],c=n[2],h=n[6],p=n[10],f=i+o+p;if(f>0){const g=.5/Math.sqrt(f+1);this._w=.25/g,this._x=(h-l)*g,this._y=(s-c)*g,this._z=(a-r)*g}else if(i>o&&i>p){const g=2*Math.sqrt(1+i-o-p);this._w=(h-l)/g,this._x=.25*g,this._y=(r+a)/g,this._z=(s+c)/g}else if(o>p){const g=2*Math.sqrt(1+o-i-p);this._w=(s-c)/g,this._x=(r+a)/g,this._y=.25*g,this._z=(l+h)/g}else{const g=2*Math.sqrt(1+p-i-o);this._w=(a-r)/g,this._x=(s+c)/g,this._y=(l+h)/g,this._z=.25*g}return this._onChangeCallback(),this}setFromUnitVectors(e,n){let i=e.dot(n)+1;return i<1e-8?(i=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=i):(this._x=0,this._y=-e.z,this._z=e.y,this._w=i)):(this._x=e.y*n.z-e.z*n.y,this._y=e.z*n.x-e.x*n.z,this._z=e.x*n.y-e.y*n.x,this._w=i),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(lt(this.dot(e),-1,1)))}rotateTowards(e,n){const i=this.angleTo(e);if(i===0)return this;const r=Math.min(1,n/i);return this.slerp(e,r),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x=this._x*e,this._y=this._y*e,this._z=this._z*e,this._w=this._w*e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,n){const i=e._x,r=e._y,s=e._z,a=e._w,o=n._x,l=n._y,c=n._z,h=n._w;return this._x=i*h+a*o+r*c-s*l,this._y=r*h+a*l+s*o-i*c,this._z=s*h+a*c+i*l-r*o,this._w=a*h-i*o-r*l-s*c,this._onChangeCallback(),this}slerp(e,n){let i=e._x,r=e._y,s=e._z,a=e._w,o=this.dot(e);o<0&&(i=-i,r=-r,s=-s,a=-a,o=-o);let l=1-n;if(o<.9995){const c=Math.acos(o),h=Math.sin(c);l=Math.sin(l*c)/h,n=Math.sin(n*c)/h,this._x=this._x*l+i*n,this._y=this._y*l+r*n,this._z=this._z*l+s*n,this._w=this._w*l+a*n,this._onChangeCallback()}else this._x=this._x*l+i*n,this._y=this._y*l+r*n,this._z=this._z*l+s*n,this._w=this._w*l+a*n,this.normalize();return this}slerpQuaternions(e,n,i){return this.copy(e).slerp(n,i)}random(){const e=2*Math.PI*Math.random(),n=2*Math.PI*Math.random(),i=Math.random(),r=Math.sqrt(1-i),s=Math.sqrt(i);return this.set(r*Math.sin(e),r*Math.cos(e),s*Math.sin(n),s*Math.cos(n))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,n=0){return this._x=e[n],this._y=e[n+1],this._z=e[n+2],this._w=e[n+3],this._onChangeCallback(),this}toArray(e=[],n=0){return e[n]=this._x,e[n+1]=this._y,e[n+2]=this._z,e[n+3]=this._w,e}fromBufferAttribute(e,n){return this._x=e.getX(n),this._y=e.getY(n),this._z=e.getZ(n),this._w=e.getW(n),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}}const Yp=class Yp{constructor(e=0,n=0,i=0){this.x=e,this.y=n,this.z=i}set(e,n,i){return i===void 0&&(i=this.z),this.x=e,this.y=n,this.z=i,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,n){switch(e){case 0:this.x=n;break;case 1:this.y=n;break;case 2:this.z=n;break;default:throw new Error("THREE.Vector3: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("THREE.Vector3: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,n){return this.x=e.x+n.x,this.y=e.y+n.y,this.z=e.z+n.z,this}addScaledVector(e,n){return this.x+=e.x*n,this.y+=e.y*n,this.z+=e.z*n,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,n){return this.x=e.x-n.x,this.y=e.y-n.y,this.z=e.z-n.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,n){return this.x=e.x*n.x,this.y=e.y*n.y,this.z=e.z*n.z,this}applyEuler(e){return this.applyQuaternion(E0.setFromEuler(e))}applyAxisAngle(e,n){return this.applyQuaternion(E0.setFromAxisAngle(e,n))}applyMatrix3(e){const n=this.x,i=this.y,r=this.z,s=e.elements;return this.x=s[0]*n+s[3]*i+s[6]*r,this.y=s[1]*n+s[4]*i+s[7]*r,this.z=s[2]*n+s[5]*i+s[8]*r,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){const n=this.x,i=this.y,r=this.z,s=e.elements,a=1/(s[3]*n+s[7]*i+s[11]*r+s[15]);return this.x=(s[0]*n+s[4]*i+s[8]*r+s[12])*a,this.y=(s[1]*n+s[5]*i+s[9]*r+s[13])*a,this.z=(s[2]*n+s[6]*i+s[10]*r+s[14])*a,this}applyQuaternion(e){const n=this.x,i=this.y,r=this.z,s=e.x,a=e.y,o=e.z,l=e.w,c=2*(a*r-o*i),h=2*(o*n-s*r),p=2*(s*i-a*n);return this.x=n+l*c+a*p-o*h,this.y=i+l*h+o*c-s*p,this.z=r+l*p+s*h-a*c,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){const n=this.x,i=this.y,r=this.z,s=e.elements;return this.x=s[0]*n+s[4]*i+s[8]*r,this.y=s[1]*n+s[5]*i+s[9]*r,this.z=s[2]*n+s[6]*i+s[10]*r,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,n){return this.x=lt(this.x,e.x,n.x),this.y=lt(this.y,e.y,n.y),this.z=lt(this.z,e.z,n.z),this}clampScalar(e,n){return this.x=lt(this.x,e,n),this.y=lt(this.y,e,n),this.z=lt(this.z,e,n),this}clampLength(e,n){const i=this.length();return this.divideScalar(i||1).multiplyScalar(lt(i,e,n))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,n){return this.x+=(e.x-this.x)*n,this.y+=(e.y-this.y)*n,this.z+=(e.z-this.z)*n,this}lerpVectors(e,n,i){return this.x=e.x+(n.x-e.x)*i,this.y=e.y+(n.y-e.y)*i,this.z=e.z+(n.z-e.z)*i,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,n){const i=e.x,r=e.y,s=e.z,a=n.x,o=n.y,l=n.z;return this.x=r*l-s*o,this.y=s*a-i*l,this.z=i*o-r*a,this}projectOnVector(e){const n=e.lengthSq();if(n===0)return this.set(0,0,0);const i=e.dot(this)/n;return this.copy(e).multiplyScalar(i)}projectOnPlane(e){return ud.copy(this).projectOnVector(e),this.sub(ud)}reflect(e){return this.sub(ud.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){const n=Math.sqrt(this.lengthSq()*e.lengthSq());if(n===0)return Math.PI/2;const i=this.dot(e)/n;return Math.acos(lt(i,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){const n=this.x-e.x,i=this.y-e.y,r=this.z-e.z;return n*n+i*i+r*r}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,n,i){const r=Math.sin(n)*e;return this.x=r*Math.sin(i),this.y=Math.cos(n)*e,this.z=r*Math.cos(i),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,n,i){return this.x=e*Math.sin(n),this.y=i,this.z=e*Math.cos(n),this}setFromMatrixPosition(e){const n=e.elements;return this.x=n[12],this.y=n[13],this.z=n[14],this}setFromMatrixScale(e){const n=this.setFromMatrixColumn(e,0).length(),i=this.setFromMatrixColumn(e,1).length(),r=this.setFromMatrixColumn(e,2).length();return this.x=n,this.y=i,this.z=r,this}setFromMatrixColumn(e,n){return this.fromArray(e.elements,n*4)}setFromMatrix3Column(e,n){return this.fromArray(e.elements,n*3)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}setFromColor(e){return this.x=e.r,this.y=e.g,this.z=e.b,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,n=0){return this.x=e[n],this.y=e[n+1],this.z=e[n+2],this}toArray(e=[],n=0){return e[n]=this.x,e[n+1]=this.y,e[n+2]=this.z,e}fromBufferAttribute(e,n){return this.x=e.getX(n),this.y=e.getY(n),this.z=e.getZ(n),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){const e=Math.random()*Math.PI*2,n=Math.random()*2-1,i=Math.sqrt(1-n*n);return this.x=i*Math.cos(e),this.y=n,this.z=i*Math.sin(e),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}};Yp.prototype.isVector3=!0;let D=Yp;const ud=new D,E0=new ls,Kp=class Kp{constructor(e,n,i,r,s,a,o,l,c){this.elements=[1,0,0,0,1,0,0,0,1],e!==void 0&&this.set(e,n,i,r,s,a,o,l,c)}set(e,n,i,r,s,a,o,l,c){const h=this.elements;return h[0]=e,h[1]=r,h[2]=o,h[3]=n,h[4]=s,h[5]=l,h[6]=i,h[7]=a,h[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){const n=this.elements,i=e.elements;return n[0]=i[0],n[1]=i[1],n[2]=i[2],n[3]=i[3],n[4]=i[4],n[5]=i[5],n[6]=i[6],n[7]=i[7],n[8]=i[8],this}extractBasis(e,n,i){return e.setFromMatrix3Column(this,0),n.setFromMatrix3Column(this,1),i.setFromMatrix3Column(this,2),this}setFromMatrix4(e){const n=e.elements;return this.set(n[0],n[4],n[8],n[1],n[5],n[9],n[2],n[6],n[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,n){const i=e.elements,r=n.elements,s=this.elements,a=i[0],o=i[3],l=i[6],c=i[1],h=i[4],p=i[7],f=i[2],g=i[5],v=i[8],E=r[0],_=r[3],u=r[6],m=r[1],M=r[4],y=r[7],T=r[2],w=r[5],R=r[8];return s[0]=a*E+o*m+l*T,s[3]=a*_+o*M+l*w,s[6]=a*u+o*y+l*R,s[1]=c*E+h*m+p*T,s[4]=c*_+h*M+p*w,s[7]=c*u+h*y+p*R,s[2]=f*E+g*m+v*T,s[5]=f*_+g*M+v*w,s[8]=f*u+g*y+v*R,this}multiplyScalar(e){const n=this.elements;return n[0]*=e,n[3]*=e,n[6]*=e,n[1]*=e,n[4]*=e,n[7]*=e,n[2]*=e,n[5]*=e,n[8]*=e,this}determinant(){const e=this.elements,n=e[0],i=e[1],r=e[2],s=e[3],a=e[4],o=e[5],l=e[6],c=e[7],h=e[8];return n*a*h-n*o*c-i*s*h+i*o*l+r*s*c-r*a*l}invert(){const e=this.elements,n=e[0],i=e[1],r=e[2],s=e[3],a=e[4],o=e[5],l=e[6],c=e[7],h=e[8],p=h*a-o*c,f=o*l-h*s,g=c*s-a*l,v=n*p+i*f+r*g;if(v===0)return this.set(0,0,0,0,0,0,0,0,0);const E=1/v;return e[0]=p*E,e[1]=(r*c-h*i)*E,e[2]=(o*i-r*a)*E,e[3]=f*E,e[4]=(h*n-r*l)*E,e[5]=(r*s-o*n)*E,e[6]=g*E,e[7]=(i*l-c*n)*E,e[8]=(a*n-i*s)*E,this}transpose(){let e;const n=this.elements;return e=n[1],n[1]=n[3],n[3]=e,e=n[2],n[2]=n[6],n[6]=e,e=n[5],n[5]=n[7],n[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){const n=this.elements;return e[0]=n[0],e[1]=n[3],e[2]=n[6],e[3]=n[1],e[4]=n[4],e[5]=n[7],e[6]=n[2],e[7]=n[5],e[8]=n[8],this}setUvTransform(e,n,i,r,s,a,o){const l=Math.cos(s),c=Math.sin(s);return this.set(i*l,i*c,-i*(l*a+c*o)+a+e,-r*c,r*l,-r*(-c*a+l*o)+o+n,0,0,1),this}scale(e,n){return Ca("Matrix3: .scale() is deprecated. Use .makeScale() instead."),this.premultiply(dd.makeScale(e,n)),this}rotate(e){return Ca("Matrix3: .rotate() is deprecated. Use .makeRotation() instead."),this.premultiply(dd.makeRotation(-e)),this}translate(e,n){return Ca("Matrix3: .translate() is deprecated. Use .makeTranslation() instead."),this.premultiply(dd.makeTranslation(e,n)),this}makeTranslation(e,n){return e.isVector2?this.set(1,0,e.x,0,1,e.y,0,0,1):this.set(1,0,e,0,1,n,0,0,1),this}makeRotation(e){const n=Math.cos(e),i=Math.sin(e);return this.set(n,-i,0,i,n,0,0,0,1),this}makeScale(e,n){return this.set(e,0,0,0,n,0,0,0,1),this}equals(e){const n=this.elements,i=e.elements;for(let r=0;r<9;r++)if(n[r]!==i[r])return!1;return!0}fromArray(e,n=0){for(let i=0;i<9;i++)this.elements[i]=e[i+n];return this}toArray(e=[],n=0){const i=this.elements;return e[n]=i[0],e[n+1]=i[1],e[n+2]=i[2],e[n+3]=i[3],e[n+4]=i[4],e[n+5]=i[5],e[n+6]=i[6],e[n+7]=i[7],e[n+8]=i[8],e}clone(){return new this.constructor().fromArray(this.elements)}};Kp.prototype.isMatrix3=!0;let Ye=Kp;const dd=new Ye,w0=new Ye().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),T0=new Ye().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function yE(){const t={enabled:!0,workingColorSpace:Yc,spaces:{},convert:function(r,s,a){return this.enabled===!1||s===a||!s||!a||(this.spaces[s].transfer===Tt&&(r.r=Tr(r.r),r.g=Tr(r.g),r.b=Tr(r.b)),this.spaces[s].primaries!==this.spaces[a].primaries&&(r.applyMatrix3(this.spaces[s].toXYZ),r.applyMatrix3(this.spaces[a].fromXYZ)),this.spaces[a].transfer===Tt&&(r.r=Pa(r.r),r.g=Pa(r.g),r.b=Pa(r.b))),r},workingToColorSpace:function(r,s){return this.convert(r,this.workingColorSpace,s)},colorSpaceToWorking:function(r,s){return this.convert(r,s,this.workingColorSpace)},getPrimaries:function(r){return this.spaces[r].primaries},getTransfer:function(r){return r===qr?Kc:this.spaces[r].transfer},getToneMappingMode:function(r){return this.spaces[r].outputColorSpaceConfig.toneMappingMode||"standard"},getLuminanceCoefficients:function(r,s=this.workingColorSpace){return r.fromArray(this.spaces[s].luminanceCoefficients)},define:function(r){Object.assign(this.spaces,r)},_getMatrix:function(r,s,a){return r.copy(this.spaces[s].toXYZ).multiply(this.spaces[a].fromXYZ)},_getDrawingBufferColorSpace:function(r){return this.spaces[r].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(r=this.workingColorSpace){return this.spaces[r].workingColorSpaceConfig.unpackColorSpace},fromWorkingColorSpace:function(r,s){return Ca("ColorManagement: .fromWorkingColorSpace() has been renamed to .workingToColorSpace()."),t.workingToColorSpace(r,s)},toWorkingColorSpace:function(r,s){return Ca("ColorManagement: .toWorkingColorSpace() has been renamed to .colorSpaceToWorking()."),t.colorSpaceToWorking(r,s)}},e=[.64,.33,.3,.6,.15,.06],n=[.2126,.7152,.0722],i=[.3127,.329];return t.define({[Yc]:{primaries:e,whitePoint:i,transfer:Kc,toXYZ:w0,fromXYZ:T0,luminanceCoefficients:n,workingColorSpaceConfig:{unpackColorSpace:fi},outputColorSpaceConfig:{drawingBufferColorSpace:fi}},[fi]:{primaries:e,whitePoint:i,transfer:Tt,toXYZ:w0,fromXYZ:T0,luminanceCoefficients:n,outputColorSpaceConfig:{drawingBufferColorSpace:fi}}}),t}const ft=yE();function Tr(t){return t<.04045?t*.0773993808:Math.pow(t*.9478672986+.0521327014,2.4)}function Pa(t){return t<.0031308?t*12.92:1.055*Math.pow(t,.41666)-.055}let Xs;class SE{static getDataURL(e,n="image/png"){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>"u")return e.src;let i;if(e instanceof HTMLCanvasElement)i=e;else{Xs===void 0&&(Xs=Zc("canvas")),Xs.width=e.width,Xs.height=e.height;const r=Xs.getContext("2d");e instanceof ImageData?r.putImageData(e,0,0):r.drawImage(e,0,0,e.width,e.height),i=Xs}return i.toDataURL(n)}static sRGBToLinear(e){if(typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&e instanceof ImageBitmap){const n=Zc("canvas");n.width=e.width,n.height=e.height;const i=n.getContext("2d");i.drawImage(e,0,0,e.width,e.height);const r=i.getImageData(0,0,e.width,e.height),s=r.data;for(let a=0;a<s.length;a++)s[a]=Tr(s[a]/255)*255;return i.putImageData(r,0,0),n}else if(e.data){const n=e.data.slice(0);for(let i=0;i<n.length;i++)n instanceof Uint8Array||n instanceof Uint8ClampedArray?n[i]=Math.floor(Tr(n[i]/255)*255):n[i]=Tr(n[i]);return{data:n,width:e.width,height:e.height}}else return Ge("ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),e}}let ME=0;class Lp{constructor(e=null){this.isTextureSource=!0,Object.defineProperty(this,"id",{value:ME++}),this.uuid=cl(),this.data=e,this.dataReady=!0,this.version=0}getSize(e){const n=this.data;return typeof HTMLVideoElement<"u"&&n instanceof HTMLVideoElement?e.set(n.videoWidth,n.videoHeight,0):typeof VideoFrame<"u"&&n instanceof VideoFrame?e.set(n.displayWidth,n.displayHeight,0):n!==null?e.set(n.width,n.height,n.depth||0):e.set(0,0,0),e}set needsUpdate(e){e===!0&&this.version++}toJSON(e){const n=e===void 0||typeof e=="string";if(!n&&e.images[this.uuid]!==void 0)return e.images[this.uuid];const i={uuid:this.uuid,url:""},r=this.data;if(r!==null){let s;if(Array.isArray(r)){s=[];for(let a=0,o=r.length;a<o;a++)r[a].isDataTexture?s.push(fd(r[a].image)):s.push(fd(r[a]))}else s=fd(r);i.url=s}return n||(e.images[this.uuid]=i),i}}function fd(t){return typeof HTMLImageElement<"u"&&t instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&t instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&t instanceof ImageBitmap?SE.getDataURL(t):t.data?{data:Array.from(t.data),width:t.width,height:t.height,type:t.data.constructor.name}:(Ge("Texture: Unable to serialize Texture."),{})}let EE=0;const hd=new D;class bn extends hs{constructor(e=bn.DEFAULT_IMAGE,n=bn.DEFAULT_MAPPING,i=Mr,r=Mr,s=An,a=bs,o=Ii,l=ti,c=bn.DEFAULT_ANISOTROPY,h=qr){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:EE++}),this.uuid=cl(),this.name="",this.source=new Lp(e),this.mipmaps=[],this.mapping=n,this.channel=0,this.wrapS=i,this.wrapT=r,this.magFilter=s,this.minFilter=a,this.anisotropy=c,this.format=o,this.internalFormat=null,this.type=l,this.offset=new je(0,0),this.repeat=new je(1,1),this.center=new je(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new Ye,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=h,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.isArrayTexture=!!(e&&e.depth&&e.depth>1),this.pmremVersion=0,this.normalized=!1}get width(){return this.source.getSize(hd).x}get height(){return this.source.getSize(hd).y}get depth(){return this.source.getSize(hd).z}get image(){return this.source.data}set image(e){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}addUpdateRange(e,n){this.updateRanges.push({start:e,count:n})}clearUpdateRanges(){this.updateRanges.length=0}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.channel=e.channel,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.normalized=e.normalized,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.colorSpace=e.colorSpace,this.renderTarget=e.renderTarget,this.isRenderTargetTexture=e.isRenderTargetTexture,this.isArrayTexture=e.isArrayTexture,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}setValues(e){for(const n in e){const i=e[n];if(i===void 0){Ge(`Texture.setValues(): parameter '${n}' has value of undefined.`);continue}const r=this[n];if(r===void 0){Ge(`Texture.setValues(): property '${n}' does not exist.`);continue}r&&i&&r.isVector2&&i.isVector2||r&&i&&r.isVector3&&i.isVector3||r&&i&&r.isMatrix3&&i.isMatrix3?r.copy(i):this[n]=i}}toJSON(e){const n=e===void 0||typeof e=="string";if(!n&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];const i={metadata:{version:4.7,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,normalized:this.normalized,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(i.userData=this.userData),n||(e.textures[this.uuid]=i),i}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(e){if(this.mapping!==sx)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case Hf:e.x=e.x-Math.floor(e.x);break;case Mr:e.x=e.x<0?0:1;break;case Vf:Math.abs(Math.floor(e.x)%2)===1?e.x=Math.ceil(e.x)-e.x:e.x=e.x-Math.floor(e.x);break}if(e.y<0||e.y>1)switch(this.wrapT){case Hf:e.y=e.y-Math.floor(e.y);break;case Mr:e.y=e.y<0?0:1;break;case Vf:Math.abs(Math.floor(e.y)%2)===1?e.y=Math.ceil(e.y)-e.y:e.y=e.y-Math.floor(e.y);break}return this.flipY&&(e.y=1-e.y),e}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(e){e===!0&&this.pmremVersion++}}bn.DEFAULT_IMAGE=null;bn.DEFAULT_MAPPING=sx;bn.DEFAULT_ANISOTROPY=1;const Zp=class Zp{constructor(e=0,n=0,i=0,r=1){this.x=e,this.y=n,this.z=i,this.w=r}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,n,i,r){return this.x=e,this.y=n,this.z=i,this.w=r,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,n){switch(e){case 0:this.x=n;break;case 1:this.y=n;break;case 2:this.z=n;break;case 3:this.w=n;break;default:throw new Error("THREE.Vector4: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("THREE.Vector4: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w!==void 0?e.w:1,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,n){return this.x=e.x+n.x,this.y=e.y+n.y,this.z=e.z+n.z,this.w=e.w+n.w,this}addScaledVector(e,n){return this.x+=e.x*n,this.y+=e.y*n,this.z+=e.z*n,this.w+=e.w*n,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,n){return this.x=e.x-n.x,this.y=e.y-n.y,this.z=e.z-n.z,this.w=e.w-n.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){const n=this.x,i=this.y,r=this.z,s=this.w,a=e.elements;return this.x=a[0]*n+a[4]*i+a[8]*r+a[12]*s,this.y=a[1]*n+a[5]*i+a[9]*r+a[13]*s,this.z=a[2]*n+a[6]*i+a[10]*r+a[14]*s,this.w=a[3]*n+a[7]*i+a[11]*r+a[15]*s,this}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this.w/=e.w,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);const n=Math.sqrt(1-e.w*e.w);return n<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/n,this.y=e.y/n,this.z=e.z/n),this}setAxisAngleFromRotationMatrix(e){let n,i,r,s;const l=e.elements,c=l[0],h=l[4],p=l[8],f=l[1],g=l[5],v=l[9],E=l[2],_=l[6],u=l[10];if(Math.abs(h-f)<.01&&Math.abs(p-E)<.01&&Math.abs(v-_)<.01){if(Math.abs(h+f)<.1&&Math.abs(p+E)<.1&&Math.abs(v+_)<.1&&Math.abs(c+g+u-3)<.1)return this.set(1,0,0,0),this;n=Math.PI;const M=(c+1)/2,y=(g+1)/2,T=(u+1)/2,w=(h+f)/4,R=(p+E)/4,x=(v+_)/4;return M>y&&M>T?M<.01?(i=0,r=.707106781,s=.707106781):(i=Math.sqrt(M),r=w/i,s=R/i):y>T?y<.01?(i=.707106781,r=0,s=.707106781):(r=Math.sqrt(y),i=w/r,s=x/r):T<.01?(i=.707106781,r=.707106781,s=0):(s=Math.sqrt(T),i=R/s,r=x/s),this.set(i,r,s,n),this}let m=Math.sqrt((_-v)*(_-v)+(p-E)*(p-E)+(f-h)*(f-h));return Math.abs(m)<.001&&(m=1),this.x=(_-v)/m,this.y=(p-E)/m,this.z=(f-h)/m,this.w=Math.acos((c+g+u-1)/2),this}setFromMatrixPosition(e){const n=e.elements;return this.x=n[12],this.y=n[13],this.z=n[14],this.w=n[15],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,n){return this.x=lt(this.x,e.x,n.x),this.y=lt(this.y,e.y,n.y),this.z=lt(this.z,e.z,n.z),this.w=lt(this.w,e.w,n.w),this}clampScalar(e,n){return this.x=lt(this.x,e,n),this.y=lt(this.y,e,n),this.z=lt(this.z,e,n),this.w=lt(this.w,e,n),this}clampLength(e,n){const i=this.length();return this.divideScalar(i||1).multiplyScalar(lt(i,e,n))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,n){return this.x+=(e.x-this.x)*n,this.y+=(e.y-this.y)*n,this.z+=(e.z-this.z)*n,this.w+=(e.w-this.w)*n,this}lerpVectors(e,n,i){return this.x=e.x+(n.x-e.x)*i,this.y=e.y+(n.y-e.y)*i,this.z=e.z+(n.z-e.z)*i,this.w=e.w+(n.w-e.w)*i,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,n=0){return this.x=e[n],this.y=e[n+1],this.z=e[n+2],this.w=e[n+3],this}toArray(e=[],n=0){return e[n]=this.x,e[n+1]=this.y,e[n+2]=this.z,e[n+3]=this.w,e}fromBufferAttribute(e,n){return this.x=e.getX(n),this.y=e.getY(n),this.z=e.getZ(n),this.w=e.getW(n),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}};Zp.prototype.isVector4=!0;let Gt=Zp;class wE extends hs{constructor(e=1,n=1,i={}){super(),i=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:An,depthBuffer:!0,stencilBuffer:!1,resolveColorBuffer:!0,resolveDepthBuffer:!0,resolveStencilBuffer:!0,storeMultisampledColorBuffer:!0,storeMultisampledDepthBuffer:!0,storeMultisampledStencilBuffer:!0,depthTexture:null,samples:0,count:1,depth:1,multiview:!1,useArrayDepthTexture:!1},i),this.isRenderTarget=!0,this.width=e,this.height=n,this.depth=i.depth,this.scissor=new Gt(0,0,e,n),this.scissorTest=!1,this.viewport=new Gt(0,0,e,n),this.textures=[];const r={width:e,height:n,depth:i.depth},s=new bn(r),a=i.count;for(let o=0;o<a;o++)this.textures[o]=s.clone(),this.textures[o].isRenderTargetTexture=!0,this.textures[o].renderTarget=this;this._setTextureOptions(i),this.depthBuffer=i.depthBuffer,this.stencilBuffer=i.stencilBuffer,this.resolveColorBuffer=i.resolveColorBuffer,this.resolveDepthBuffer=i.resolveDepthBuffer,this.resolveStencilBuffer=i.resolveStencilBuffer,this.storeMultisampledColorBuffer=i.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=i.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=i.storeMultisampledStencilBuffer,this._depthTexture=null,this.depthTexture=i.depthTexture,this.samples=i.samples,this.multiview=i.multiview,this.useArrayDepthTexture=i.useArrayDepthTexture}_setTextureOptions(e={}){const n={minFilter:An,generateMipmaps:!1,flipY:!1,internalFormat:null};e.mapping!==void 0&&(n.mapping=e.mapping),e.wrapS!==void 0&&(n.wrapS=e.wrapS),e.wrapT!==void 0&&(n.wrapT=e.wrapT),e.wrapR!==void 0&&(n.wrapR=e.wrapR),e.magFilter!==void 0&&(n.magFilter=e.magFilter),e.minFilter!==void 0&&(n.minFilter=e.minFilter),e.format!==void 0&&(n.format=e.format),e.type!==void 0&&(n.type=e.type),e.anisotropy!==void 0&&(n.anisotropy=e.anisotropy),e.colorSpace!==void 0&&(n.colorSpace=e.colorSpace),e.flipY!==void 0&&(n.flipY=e.flipY),e.generateMipmaps!==void 0&&(n.generateMipmaps=e.generateMipmaps),e.internalFormat!==void 0&&(n.internalFormat=e.internalFormat);for(let i=0;i<this.textures.length;i++)this.textures[i].setValues(n)}get texture(){return this.textures[0]}set texture(e){this.textures[0]=e}set depthTexture(e){this._depthTexture!==null&&this._depthTexture.renderTarget===this&&(this._depthTexture.renderTarget=null),e!==null&&e.renderTarget===null&&(e.renderTarget=this),this._depthTexture=e}get depthTexture(){return this._depthTexture}setSize(e,n,i=1){if(this.width!==e||this.height!==n||this.depth!==i){this.width=e,this.height=n,this.depth=i;for(let r=0,s=this.textures.length;r<s;r++)this.textures[r].image.width=e,this.textures[r].image.height=n,this.textures[r].image.depth=i,this.textures[r].isData3DTexture!==!0&&(this.textures[r].isArrayTexture=this.textures[r].image.depth>1);this.dispose()}this.viewport.set(0,0,e,n),this.scissor.set(0,0,e,n)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.scissor.copy(e.scissor),this.scissorTest=e.scissorTest,this.viewport.copy(e.viewport),this.textures.length=0;for(let n=0,i=e.textures.length;n<i;n++){this.textures[n]=e.textures[n].clone(),this.textures[n].isRenderTargetTexture=!0,this.textures[n].renderTarget=this;const r=Object.assign({},e.textures[n].image);this.textures[n].source=new Lp(r)}if(this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,this.resolveColorBuffer=e.resolveColorBuffer,this.resolveDepthBuffer=e.resolveDepthBuffer,this.resolveStencilBuffer=e.resolveStencilBuffer,this.storeMultisampledColorBuffer=e.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=e.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=e.storeMultisampledStencilBuffer,e.depthTexture!==null)if(e.depthTexture.renderTarget===e){const n=e.depthTexture.clone();n.renderTarget=null,this.depthTexture=n}else this.depthTexture=e.depthTexture;return this.samples=e.samples,this.multiview=e.multiview,this.useArrayDepthTexture=e.useArrayDepthTexture,this}dispose(){this.dispatchEvent({type:"dispose"})}}class Oi extends wE{constructor(e=1,n=1,i={}){super(e,n,i),this.isWebGLRenderTarget=!0}}class px extends bn{constructor(e=null,n=1,i=1,r=1){super(null),this.isDataArrayTexture=!0,this.image={data:e,width:n,height:i,depth:r},this.magFilter=gn,this.minFilter=gn,this.wrapR=Mr,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}copy(e){return super.copy(e),this.wrapR=e.wrapR,this}addLayerUpdate(e){this.layerUpdates.add(e)}clearLayerUpdates(){this.layerUpdates.clear()}}class TE extends bn{constructor(e=null,n=1,i=1,r=1){super(null),this.isData3DTexture=!0,this.image={data:e,width:n,height:i,depth:r},this.magFilter=gn,this.minFilter=gn,this.wrapR=Mr,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}copy(e){return super.copy(e),this.wrapR=e.wrapR,this}}const iu=class iu{constructor(e,n,i,r,s,a,o,l,c,h,p,f,g,v,E,_){this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],e!==void 0&&this.set(e,n,i,r,s,a,o,l,c,h,p,f,g,v,E,_)}set(e,n,i,r,s,a,o,l,c,h,p,f,g,v,E,_){const u=this.elements;return u[0]=e,u[4]=n,u[8]=i,u[12]=r,u[1]=s,u[5]=a,u[9]=o,u[13]=l,u[2]=c,u[6]=h,u[10]=p,u[14]=f,u[3]=g,u[7]=v,u[11]=E,u[15]=_,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new iu().fromArray(this.elements)}copy(e){const n=this.elements,i=e.elements;return n[0]=i[0],n[1]=i[1],n[2]=i[2],n[3]=i[3],n[4]=i[4],n[5]=i[5],n[6]=i[6],n[7]=i[7],n[8]=i[8],n[9]=i[9],n[10]=i[10],n[11]=i[11],n[12]=i[12],n[13]=i[13],n[14]=i[14],n[15]=i[15],this}copyPosition(e){const n=this.elements,i=e.elements;return n[12]=i[12],n[13]=i[13],n[14]=i[14],this}setFromMatrix3(e){const n=e.elements;return this.set(n[0],n[3],n[6],0,n[1],n[4],n[7],0,n[2],n[5],n[8],0,0,0,0,1),this}extractBasis(e,n,i){return this.determinantAffine()===0?(e.set(1,0,0),n.set(0,1,0),i.set(0,0,1),this):(e.setFromMatrixColumn(this,0),n.setFromMatrixColumn(this,1),i.setFromMatrixColumn(this,2),this)}makeBasis(e,n,i){return this.set(e.x,n.x,i.x,0,e.y,n.y,i.y,0,e.z,n.z,i.z,0,0,0,0,1),this}extractRotation(e){if(e.determinantAffine()===0)return this.identity();const n=this.elements,i=e.elements,r=1/$s.setFromMatrixColumn(e,0).length(),s=1/$s.setFromMatrixColumn(e,1).length(),a=1/$s.setFromMatrixColumn(e,2).length();return n[0]=i[0]*r,n[1]=i[1]*r,n[2]=i[2]*r,n[3]=0,n[4]=i[4]*s,n[5]=i[5]*s,n[6]=i[6]*s,n[7]=0,n[8]=i[8]*a,n[9]=i[9]*a,n[10]=i[10]*a,n[11]=0,n[12]=0,n[13]=0,n[14]=0,n[15]=1,this}makeRotationFromEuler(e){const n=this.elements,i=e.x,r=e.y,s=e.z,a=Math.cos(i),o=Math.sin(i),l=Math.cos(r),c=Math.sin(r),h=Math.cos(s),p=Math.sin(s);if(e.order==="XYZ"){const f=a*h,g=a*p,v=o*h,E=o*p;n[0]=l*h,n[4]=-l*p,n[8]=c,n[1]=g+v*c,n[5]=f-E*c,n[9]=-o*l,n[2]=E-f*c,n[6]=v+g*c,n[10]=a*l}else if(e.order==="YXZ"){const f=l*h,g=l*p,v=c*h,E=c*p;n[0]=f+E*o,n[4]=v*o-g,n[8]=a*c,n[1]=a*p,n[5]=a*h,n[9]=-o,n[2]=g*o-v,n[6]=E+f*o,n[10]=a*l}else if(e.order==="ZXY"){const f=l*h,g=l*p,v=c*h,E=c*p;n[0]=f-E*o,n[4]=-a*p,n[8]=v+g*o,n[1]=g+v*o,n[5]=a*h,n[9]=E-f*o,n[2]=-a*c,n[6]=o,n[10]=a*l}else if(e.order==="ZYX"){const f=a*h,g=a*p,v=o*h,E=o*p;n[0]=l*h,n[4]=v*c-g,n[8]=f*c+E,n[1]=l*p,n[5]=E*c+f,n[9]=g*c-v,n[2]=-c,n[6]=o*l,n[10]=a*l}else if(e.order==="YZX"){const f=a*l,g=a*c,v=o*l,E=o*c;n[0]=l*h,n[4]=E-f*p,n[8]=v*p+g,n[1]=p,n[5]=a*h,n[9]=-o*h,n[2]=-c*h,n[6]=g*p+v,n[10]=f-E*p}else if(e.order==="XZY"){const f=a*l,g=a*c,v=o*l,E=o*c;n[0]=l*h,n[4]=-p,n[8]=c*h,n[1]=f*p+E,n[5]=a*h,n[9]=g*p-v,n[2]=v*p-g,n[6]=o*h,n[10]=E*p+f}return n[3]=0,n[7]=0,n[11]=0,n[12]=0,n[13]=0,n[14]=0,n[15]=1,this}makeRotationFromQuaternion(e){return this.compose(AE,e,bE)}lookAt(e,n,i){const r=this.elements;return Kn.subVectors(e,n),Kn.lengthSq()===0&&(Kn.z=1),Kn.normalize(),Br.crossVectors(i,Kn),Br.lengthSq()===0&&(Math.abs(i.z)===1?Kn.x+=1e-4:Kn.z+=1e-4,Kn.normalize(),Br.crossVectors(i,Kn)),Br.normalize(),Ll.crossVectors(Kn,Br),r[0]=Br.x,r[4]=Ll.x,r[8]=Kn.x,r[1]=Br.y,r[5]=Ll.y,r[9]=Kn.y,r[2]=Br.z,r[6]=Ll.z,r[10]=Kn.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,n){const i=e.elements,r=n.elements,s=this.elements,a=i[0],o=i[4],l=i[8],c=i[12],h=i[1],p=i[5],f=i[9],g=i[13],v=i[2],E=i[6],_=i[10],u=i[14],m=i[3],M=i[7],y=i[11],T=i[15],w=r[0],R=r[4],x=r[8],A=r[12],P=r[1],L=r[5],B=r[9],F=r[13],I=r[2],j=r[6],N=r[10],H=r[14],V=r[3],G=r[7],X=r[11],ne=r[15];return s[0]=a*w+o*P+l*I+c*V,s[4]=a*R+o*L+l*j+c*G,s[8]=a*x+o*B+l*N+c*X,s[12]=a*A+o*F+l*H+c*ne,s[1]=h*w+p*P+f*I+g*V,s[5]=h*R+p*L+f*j+g*G,s[9]=h*x+p*B+f*N+g*X,s[13]=h*A+p*F+f*H+g*ne,s[2]=v*w+E*P+_*I+u*V,s[6]=v*R+E*L+_*j+u*G,s[10]=v*x+E*B+_*N+u*X,s[14]=v*A+E*F+_*H+u*ne,s[3]=m*w+M*P+y*I+T*V,s[7]=m*R+M*L+y*j+T*G,s[11]=m*x+M*B+y*N+T*X,s[15]=m*A+M*F+y*H+T*ne,this}multiplyScalar(e){const n=this.elements;return n[0]*=e,n[4]*=e,n[8]*=e,n[12]*=e,n[1]*=e,n[5]*=e,n[9]*=e,n[13]*=e,n[2]*=e,n[6]*=e,n[10]*=e,n[14]*=e,n[3]*=e,n[7]*=e,n[11]*=e,n[15]*=e,this}determinant(){const e=this.elements,n=e[0],i=e[4],r=e[8],s=e[12],a=e[1],o=e[5],l=e[9],c=e[13],h=e[2],p=e[6],f=e[10],g=e[14],v=e[3],E=e[7],_=e[11],u=e[15],m=l*g-c*f,M=o*g-c*p,y=o*f-l*p,T=a*g-c*h,w=a*f-l*h,R=a*p-o*h;return n*(E*m-_*M+u*y)-i*(v*m-_*T+u*w)+r*(v*M-E*T+u*R)-s*(v*y-E*w+_*R)}determinantAffine(){const e=this.elements,n=e[0],i=e[4],r=e[8],s=e[1],a=e[5],o=e[9],l=e[2],c=e[6],h=e[10];return n*(a*h-o*c)-i*(s*h-o*l)+r*(s*c-a*l)}transpose(){const e=this.elements;let n;return n=e[1],e[1]=e[4],e[4]=n,n=e[2],e[2]=e[8],e[8]=n,n=e[6],e[6]=e[9],e[9]=n,n=e[3],e[3]=e[12],e[12]=n,n=e[7],e[7]=e[13],e[13]=n,n=e[11],e[11]=e[14],e[14]=n,this}setPosition(e,n,i){const r=this.elements;return e.isVector3?(r[12]=e.x,r[13]=e.y,r[14]=e.z):(r[12]=e,r[13]=n,r[14]=i),this}invert(){const e=this.elements,n=e[0],i=e[1],r=e[2],s=e[3],a=e[4],o=e[5],l=e[6],c=e[7],h=e[8],p=e[9],f=e[10],g=e[11],v=e[12],E=e[13],_=e[14],u=e[15],m=n*o-i*a,M=n*l-r*a,y=n*c-s*a,T=i*l-r*o,w=i*c-s*o,R=r*c-s*l,x=h*E-p*v,A=h*_-f*v,P=h*u-g*v,L=p*_-f*E,B=p*u-g*E,F=f*u-g*_,I=m*F-M*B+y*L+T*P-w*A+R*x;if(I===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);const j=1/I;return e[0]=(o*F-l*B+c*L)*j,e[1]=(r*B-i*F-s*L)*j,e[2]=(E*R-_*w+u*T)*j,e[3]=(f*w-p*R-g*T)*j,e[4]=(l*P-a*F-c*A)*j,e[5]=(n*F-r*P+s*A)*j,e[6]=(_*y-v*R-u*M)*j,e[7]=(h*R-f*y+g*M)*j,e[8]=(a*B-o*P+c*x)*j,e[9]=(i*P-n*B-s*x)*j,e[10]=(v*w-E*y+u*m)*j,e[11]=(p*y-h*w-g*m)*j,e[12]=(o*A-a*L-l*x)*j,e[13]=(n*L-i*A+r*x)*j,e[14]=(E*M-v*T-_*m)*j,e[15]=(h*T-p*M+f*m)*j,this}scale(e){const n=this.elements,i=e.x,r=e.y,s=e.z;return n[0]*=i,n[4]*=r,n[8]*=s,n[1]*=i,n[5]*=r,n[9]*=s,n[2]*=i,n[6]*=r,n[10]*=s,n[3]*=i,n[7]*=r,n[11]*=s,this}getMaxScaleOnAxis(){const e=this.elements,n=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],i=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],r=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(n,i,r))}makeTranslation(e,n,i){return e.isVector3?this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1):this.set(1,0,0,e,0,1,0,n,0,0,1,i,0,0,0,1),this}makeRotationX(e){const n=Math.cos(e),i=Math.sin(e);return this.set(1,0,0,0,0,n,-i,0,0,i,n,0,0,0,0,1),this}makeRotationY(e){const n=Math.cos(e),i=Math.sin(e);return this.set(n,0,i,0,0,1,0,0,-i,0,n,0,0,0,0,1),this}makeRotationZ(e){const n=Math.cos(e),i=Math.sin(e);return this.set(n,-i,0,0,i,n,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,n){const i=Math.cos(n),r=Math.sin(n),s=1-i,a=e.x,o=e.y,l=e.z,c=s*a,h=s*o;return this.set(c*a+i,c*o-r*l,c*l+r*o,0,c*o+r*l,h*o+i,h*l-r*a,0,c*l-r*o,h*l+r*a,s*l*l+i,0,0,0,0,1),this}makeScale(e,n,i){return this.set(e,0,0,0,0,n,0,0,0,0,i,0,0,0,0,1),this}makeShear(e,n,i,r,s,a){return this.set(1,i,s,0,e,1,a,0,n,r,1,0,0,0,0,1),this}compose(e,n,i){const r=this.elements,s=n._x,a=n._y,o=n._z,l=n._w,c=s+s,h=a+a,p=o+o,f=s*c,g=s*h,v=s*p,E=a*h,_=a*p,u=o*p,m=l*c,M=l*h,y=l*p,T=i.x,w=i.y,R=i.z;return r[0]=(1-(E+u))*T,r[1]=(g+y)*T,r[2]=(v-M)*T,r[3]=0,r[4]=(g-y)*w,r[5]=(1-(f+u))*w,r[6]=(_+m)*w,r[7]=0,r[8]=(v+M)*R,r[9]=(_-m)*R,r[10]=(1-(f+E))*R,r[11]=0,r[12]=e.x,r[13]=e.y,r[14]=e.z,r[15]=1,this}decompose(e,n,i){const r=this.elements;e.x=r[12],e.y=r[13],e.z=r[14];const s=this.determinantAffine();if(s===0)return i.set(1,1,1),n.identity(),this;let a=$s.set(r[0],r[1],r[2]).length();const o=$s.set(r[4],r[5],r[6]).length(),l=$s.set(r[8],r[9],r[10]).length();s<0&&(a=-a),Ai.copy(this);const c=1/a,h=1/o,p=1/l;return Ai.elements[0]*=c,Ai.elements[1]*=c,Ai.elements[2]*=c,Ai.elements[4]*=h,Ai.elements[5]*=h,Ai.elements[6]*=h,Ai.elements[8]*=p,Ai.elements[9]*=p,Ai.elements[10]*=p,n.setFromRotationMatrix(Ai),i.x=a,i.y=o,i.z=l,this}makePerspective(e,n,i,r,s,a,o=nr,l=!1){const c=this.elements,h=2*s/(n-e),p=2*s/(i-r),f=(n+e)/(n-e),g=(i+r)/(i-r);let v,E;if(l)v=s/(a-s),E=a*s/(a-s);else if(o===nr)v=-(a+s)/(a-s),E=-2*a*s/(a-s);else if(o===nl)v=-a/(a-s),E=-a*s/(a-s);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+o);return c[0]=h,c[4]=0,c[8]=f,c[12]=0,c[1]=0,c[5]=p,c[9]=g,c[13]=0,c[2]=0,c[6]=0,c[10]=v,c[14]=E,c[3]=0,c[7]=0,c[11]=-1,c[15]=0,this}makeOrthographic(e,n,i,r,s,a,o=nr,l=!1){const c=this.elements,h=2/(n-e),p=2/(i-r),f=-(n+e)/(n-e),g=-(i+r)/(i-r);let v,E;if(l)v=1/(a-s),E=a/(a-s);else if(o===nr)v=-2/(a-s),E=-(a+s)/(a-s);else if(o===nl)v=-1/(a-s),E=-s/(a-s);else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+o);return c[0]=h,c[4]=0,c[8]=0,c[12]=f,c[1]=0,c[5]=p,c[9]=0,c[13]=g,c[2]=0,c[6]=0,c[10]=v,c[14]=E,c[3]=0,c[7]=0,c[11]=0,c[15]=1,this}equals(e){const n=this.elements,i=e.elements;for(let r=0;r<16;r++)if(n[r]!==i[r])return!1;return!0}fromArray(e,n=0){for(let i=0;i<16;i++)this.elements[i]=e[i+n];return this}toArray(e=[],n=0){const i=this.elements;return e[n]=i[0],e[n+1]=i[1],e[n+2]=i[2],e[n+3]=i[3],e[n+4]=i[4],e[n+5]=i[5],e[n+6]=i[6],e[n+7]=i[7],e[n+8]=i[8],e[n+9]=i[9],e[n+10]=i[10],e[n+11]=i[11],e[n+12]=i[12],e[n+13]=i[13],e[n+14]=i[14],e[n+15]=i[15],e}};iu.prototype.isMatrix4=!0;let kt=iu;const $s=new D,Ai=new kt,AE=new D(0,0,0),bE=new D(1,1,1),Br=new D,Ll=new D,Kn=new D,A0=new kt,b0=new ls;class cs{constructor(e=0,n=0,i=0,r=cs.DEFAULT_ORDER){this.isEuler=!0,this._x=e,this._y=n,this._z=i,this._order=r}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,n,i,r=this._order){return this._x=e,this._y=n,this._z=i,this._order=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,n=this._order,i=!0){const r=e.elements,s=r[0],a=r[4],o=r[8],l=r[1],c=r[5],h=r[9],p=r[2],f=r[6],g=r[10];switch(n){case"XYZ":this._y=Math.asin(lt(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(-h,g),this._z=Math.atan2(-a,s)):(this._x=Math.atan2(f,c),this._z=0);break;case"YXZ":this._x=Math.asin(-lt(h,-1,1)),Math.abs(h)<.9999999?(this._y=Math.atan2(o,g),this._z=Math.atan2(l,c)):(this._y=Math.atan2(-p,s),this._z=0);break;case"ZXY":this._x=Math.asin(lt(f,-1,1)),Math.abs(f)<.9999999?(this._y=Math.atan2(-p,g),this._z=Math.atan2(-a,c)):(this._y=0,this._z=Math.atan2(l,s));break;case"ZYX":this._y=Math.asin(-lt(p,-1,1)),Math.abs(p)<.9999999?(this._x=Math.atan2(f,g),this._z=Math.atan2(l,s)):(this._x=0,this._z=Math.atan2(-a,c));break;case"YZX":this._z=Math.asin(lt(l,-1,1)),Math.abs(l)<.9999999?(this._x=Math.atan2(-h,c),this._y=Math.atan2(-p,s)):(this._x=0,this._y=Math.atan2(o,g));break;case"XZY":this._z=Math.asin(-lt(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(f,c),this._y=Math.atan2(o,s)):(this._x=Math.atan2(-h,g),this._y=0);break;default:Ge("Euler: .setFromRotationMatrix() encountered an unknown order: "+n)}return this._order=n,i===!0&&this._onChangeCallback(),this}setFromQuaternion(e,n,i){return A0.makeRotationFromQuaternion(e),this.setFromRotationMatrix(A0,n,i)}setFromVector3(e,n=this._order){return this.set(e.x,e.y,e.z,n)}reorder(e){return b0.setFromEuler(this),this.setFromQuaternion(b0,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],n=0){return e[n]=this._x,e[n+1]=this._y,e[n+2]=this._z,e[n+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}}cs.DEFAULT_ORDER="XYZ";class Dp{constructor(){this.mask=1}set(e){this.mask=(1<<e|0)>>>0}enable(e){this.mask|=1<<e|0}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e|0}disable(e){this.mask&=~(1<<e|0)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!==0}isEnabled(e){return(this.mask&(1<<e|0))!==0}}let RE=0;const R0=new D,qs=new ls,fr=new kt,Dl=new D,co=new D,CE=new D,PE=new ls,C0=new D(1,0,0),P0=new D(0,1,0),N0=new D(0,0,1),L0={type:"added"},NE={type:"removed"},Ys={type:"childadded",child:null},pd={type:"childremoved",child:null};class hn extends hs{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:RE++}),this.uuid=cl(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=hn.DEFAULT_UP.clone();const e=new D,n=new cs,i=new ls,r=new D(1,1,1);function s(){i.setFromEuler(n,!1)}function a(){n.setFromQuaternion(i,void 0,!1)}n._onChange(s),i._onChange(a),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:e},rotation:{configurable:!0,enumerable:!0,value:n},quaternion:{configurable:!0,enumerable:!0,value:i},scale:{configurable:!0,enumerable:!0,value:r},modelViewMatrix:{value:new kt},normalMatrix:{value:new Ye}}),this.matrix=new kt,this.matrixWorld=new kt,this.matrixAutoUpdate=hn.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=hn.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new Dp,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.static=!1,this.userData={},this.pivot=null}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,n){this.quaternion.setFromAxisAngle(e,n)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,n){return qs.setFromAxisAngle(e,n),this.quaternion.multiply(qs),this}rotateOnWorldAxis(e,n){return qs.setFromAxisAngle(e,n),this.quaternion.premultiply(qs),this}rotateX(e){return this.rotateOnAxis(C0,e)}rotateY(e){return this.rotateOnAxis(P0,e)}rotateZ(e){return this.rotateOnAxis(N0,e)}translateOnAxis(e,n){return R0.copy(e).applyQuaternion(this.quaternion),this.position.add(R0.multiplyScalar(n)),this}translateX(e){return this.translateOnAxis(C0,e)}translateY(e){return this.translateOnAxis(P0,e)}translateZ(e){return this.translateOnAxis(N0,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(fr.copy(this.matrixWorld).invert())}lookAt(e,n,i){e.isVector3?Dl.copy(e):Dl.set(e,n,i);const r=this.parent;this.updateWorldMatrix(!0,!1),co.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?fr.lookAt(co,Dl,this.up):fr.lookAt(Dl,co,this.up),this.quaternion.setFromRotationMatrix(fr),r&&(fr.extractRotation(r.matrixWorld),qs.setFromRotationMatrix(fr),this.quaternion.premultiply(qs.invert()))}add(e){if(arguments.length>1){for(let n=0;n<arguments.length;n++)this.add(arguments[n]);return this}return e===this?(gt("Object3D.add: object can't be added as a child of itself.",e),this):(e&&e.isObject3D?(e.removeFromParent(),e.parent=this,this.children.push(e),e.dispatchEvent(L0),Ys.child=e,this.dispatchEvent(Ys),Ys.child=null):gt("Object3D.add: object not an instance of THREE.Object3D.",e),this)}remove(e){if(arguments.length>1){for(let i=0;i<arguments.length;i++)this.remove(arguments[i]);return this}const n=this.children.indexOf(e);return n!==-1&&(e.parent=null,this.children.splice(n,1),e.dispatchEvent(NE),pd.child=e,this.dispatchEvent(pd),pd.child=null),this}removeFromParent(){const e=this.parent;return e!==null&&e.remove(this),this}clear(){return this.remove(...this.children)}attach(e){return this.updateWorldMatrix(!0,!1),fr.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),fr.multiply(e.parent.matrixWorld)),e.applyMatrix4(fr),e.removeFromParent(),e.parent=this,this.children.push(e),e.updateWorldMatrix(!1,!0),e.dispatchEvent(L0),Ys.child=e,this.dispatchEvent(Ys),Ys.child=null,this}getObjectById(e){return this.getObjectByProperty("id",e)}getObjectByName(e){return this.getObjectByProperty("name",e)}getObjectByProperty(e,n){if(this[e]===n)return this;for(let i=0,r=this.children.length;i<r;i++){const a=this.children[i].getObjectByProperty(e,n);if(a!==void 0)return a}}getObjectsByProperty(e,n,i=[]){this[e]===n&&i.push(this);const r=this.children;for(let s=0,a=r.length;s<a;s++)r[s].getObjectsByProperty(e,n,i);return i}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(co,e,CE),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(co,PE,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);const n=this.matrixWorld.elements;return e.set(n[8],n[9],n[10]).normalize()}raycast(){}intersectsFrustum(){}traverse(e){e(this);const n=this.children;for(let i=0,r=n.length;i<r;i++)n[i].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);const n=this.children;for(let i=0,r=n.length;i<r;i++)n[i].traverseVisible(e)}traverseAncestors(e){const n=this.parent;n!==null&&(e(n),n.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale);const e=this.pivot;if(e!==null){const n=e.x,i=e.y,r=e.z,s=this.matrix.elements;s[12]+=n-s[0]*n-s[4]*i-s[8]*r,s[13]+=i-s[1]*n-s[5]*i-s[9]*r,s[14]+=r-s[2]*n-s[6]*i-s[10]*r}this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,e=!0);const n=this.children;for(let i=0,r=n.length;i<r;i++)n[i].updateMatrixWorld(e)}updateWorldMatrix(e,n,i=!1){const r=this.parent;if(e===!0&&r!==null&&r.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||i)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,i=!0),n===!0){const s=this.children;for(let a=0,o=s.length;a<o;a++)s[a].updateWorldMatrix(!1,!0,i)}}toJSON(e){const n=e===void 0||typeof e=="string",i={};n&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},i.metadata={version:4.7,type:"Object",generator:"Object3D.toJSON"});const r={};r.uuid=this.uuid,r.type=this.type,r.name=this.name,r.castShadow=this.castShadow,r.receiveShadow=this.receiveShadow,r.visible=this.visible,r.frustumCulled=this.frustumCulled,r.renderOrder=this.renderOrder,r.static=this.static,r.matrixAutoUpdate=this.matrixAutoUpdate,Object.keys(this.userData).length>0&&(r.userData=this.userData),r.layers=this.layers.mask,r.matrix=this.matrix.toArray(),r.up=this.up.toArray(),this.pivot!==null&&(r.pivot=this.pivot.toArray()),this.morphTargetDictionary!==void 0&&(r.morphTargetDictionary=Object.assign({},this.morphTargetDictionary)),this.morphTargetInfluences!==void 0&&(r.morphTargetInfluences=this.morphTargetInfluences.slice()),this.isInstancedMesh&&(r.type="InstancedMesh",r.count=this.count,r.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(r.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(r.type="BatchedMesh",r.perObjectFrustumCulled=this.perObjectFrustumCulled,r.sortObjects=this.sortObjects,r.drawRanges=this._drawRanges,r.reservedRanges=this._reservedRanges,r.geometryInfo=this._geometryInfo.map(o=>({...o,boundingBox:o.boundingBox?o.boundingBox.toJSON():void 0,boundingSphere:o.boundingSphere?o.boundingSphere.toJSON():void 0})),r.instanceInfo=this._instanceInfo.map(o=>({...o})),r.availableInstanceIds=this._availableInstanceIds.slice(),r.availableGeometryIds=this._availableGeometryIds.slice(),r.nextIndexStart=this._nextIndexStart,r.nextVertexStart=this._nextVertexStart,r.geometryCount=this._geometryCount,r.maxInstanceCount=this._maxInstanceCount,r.maxVertexCount=this._maxVertexCount,r.maxIndexCount=this._maxIndexCount,r.geometryInitialized=this._geometryInitialized,r.matricesTexture=this._matricesTexture.toJSON(e),r.indirectTexture=this._indirectTexture.toJSON(e),this._colorsTexture!==null&&(r.colorsTexture=this._colorsTexture.toJSON(e)),this.boundingSphere!==null&&(r.boundingSphere=this.boundingSphere.toJSON()),this.boundingBox!==null&&(r.boundingBox=this.boundingBox.toJSON()));function s(o,l){return o[l.uuid]===void 0&&(o[l.uuid]=l.toJSON(e)),l.uuid}if(this.isScene)this.background&&(this.background.isColor?r.background=this.background.toJSON():this.background.isTexture&&(r.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(r.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){r.geometry=s(e.geometries,this.geometry);const o=this.geometry.parameters;if(o!==void 0&&o.shapes!==void 0){const l=o.shapes;if(Array.isArray(l))for(let c=0,h=l.length;c<h;c++){const p=l[c];s(e.shapes,p)}else s(e.shapes,l)}}if(this.isSkinnedMesh&&(r.bindMode=this.bindMode,r.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(s(e.skeletons,this.skeleton),r.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){const o=[];for(let l=0,c=this.material.length;l<c;l++)o.push(s(e.materials,this.material[l]));r.material=o}else r.material=s(e.materials,this.material);if(this.children.length>0){r.children=[];for(let o=0;o<this.children.length;o++)r.children.push(this.children[o].toJSON(e).object)}if(this.animations.length>0){r.animations=[];for(let o=0;o<this.animations.length;o++){const l=this.animations[o];r.animations.push(s(e.animations,l))}}if(n){const o=a(e.geometries),l=a(e.materials),c=a(e.textures),h=a(e.images),p=a(e.shapes),f=a(e.skeletons),g=a(e.animations),v=a(e.nodes);o.length>0&&(i.geometries=o),l.length>0&&(i.materials=l),c.length>0&&(i.textures=c),h.length>0&&(i.images=h),p.length>0&&(i.shapes=p),f.length>0&&(i.skeletons=f),g.length>0&&(i.animations=g),v.length>0&&(i.nodes=v)}return i.object=r,i;function a(o){const l=[];for(const c in o){const h=o[c];delete h.metadata,l.push(h)}return l}}clone(e){return new this.constructor().copy(this,e)}copy(e,n=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.pivot=e.pivot!==null?e.pivot.clone():null,this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.static=e.static,this.animations=e.animations.slice(),this.userData=JSON.parse(JSON.stringify(e.userData)),n===!0)for(let i=0;i<e.children.length;i++){const r=e.children[i];this.add(r.clone())}return this}dispose(){this.dispatchEvent({type:"dispose"})}}hn.DEFAULT_UP=new D(0,1,0);hn.DEFAULT_MATRIX_AUTO_UPDATE=!0;hn.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;class wn extends hn{constructor(){super(),this.isGroup=!0,this.type="Group"}}const LE={type:"move"};class md{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new wn,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new wn,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new D,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new D),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new wn,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new D,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new D,this._grip.eventsEnabled=!1),this._grip}dispatchEvent(e){return this._targetRay!==null&&this._targetRay.dispatchEvent(e),this._grip!==null&&this._grip.dispatchEvent(e),this._hand!==null&&this._hand.dispatchEvent(e),this}connect(e){if(e&&e.hand){const n=this._hand;if(n)for(const i of e.hand.values())this._getHandJoint(n,i)}return this.dispatchEvent({type:"connected",data:e}),this}disconnect(e){return this.dispatchEvent({type:"disconnected",data:e}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(e,n,i){let r=null,s=null,a=null;const o=this._targetRay,l=this._grip,c=this._hand;if(e&&n.session.visibilityState!=="visible-blurred"){if(c&&e.hand){a=!0;for(const E of e.hand.values()){const _=n.getJointPose(E,i),u=this._getHandJoint(c,E);_!==null&&(u.matrix.fromArray(_.transform.matrix),u.matrix.decompose(u.position,u.rotation,u.scale),u.matrixWorldNeedsUpdate=!0,u.jointRadius=_.radius),u.visible=_!==null}const h=c.joints["index-finger-tip"],p=c.joints["thumb-tip"],f=h.position.distanceTo(p.position),g=.02,v=.005;c.inputState.pinching&&f>g+v?(c.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:e.handedness,target:this})):!c.inputState.pinching&&f<=g-v&&(c.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:e.handedness,target:this}))}else l!==null&&e.gripSpace&&(s=n.getPose(e.gripSpace,i),s!==null&&(l.matrix.fromArray(s.transform.matrix),l.matrix.decompose(l.position,l.rotation,l.scale),l.matrixWorldNeedsUpdate=!0,s.linearVelocity?(l.hasLinearVelocity=!0,l.linearVelocity.copy(s.linearVelocity)):l.hasLinearVelocity=!1,s.angularVelocity?(l.hasAngularVelocity=!0,l.angularVelocity.copy(s.angularVelocity)):l.hasAngularVelocity=!1,l.eventsEnabled&&l.dispatchEvent({type:"gripUpdated",data:e,target:this})));o!==null&&(r=n.getPose(e.targetRaySpace,i),r===null&&s!==null&&(r=s),r!==null&&(o.matrix.fromArray(r.transform.matrix),o.matrix.decompose(o.position,o.rotation,o.scale),o.matrixWorldNeedsUpdate=!0,r.linearVelocity?(o.hasLinearVelocity=!0,o.linearVelocity.copy(r.linearVelocity)):o.hasLinearVelocity=!1,r.angularVelocity?(o.hasAngularVelocity=!0,o.angularVelocity.copy(r.angularVelocity)):o.hasAngularVelocity=!1,this.dispatchEvent(LE)))}return o!==null&&(o.visible=r!==null),l!==null&&(l.visible=s!==null),c!==null&&(c.visible=a!==null),this}_getHandJoint(e,n){if(e.joints[n.jointName]===void 0){const i=new wn;i.matrixAutoUpdate=!1,i.visible=!1,e.joints[n.jointName]=i,e.add(i)}return e.joints[n.jointName]}}const mx={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},zr={h:0,s:0,l:0},Il={h:0,s:0,l:0};function gd(t,e,n){return n<0&&(n+=1),n>1&&(n-=1),n<1/6?t+(e-t)*6*n:n<1/2?e:n<2/3?t+(e-t)*6*(2/3-n):t}class dt{constructor(e,n,i){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(e,n,i)}set(e,n,i){if(n===void 0&&i===void 0){const r=e;r&&r.isColor?this.copy(r):typeof r=="number"?this.setHex(r):typeof r=="string"&&this.setStyle(r)}else this.setRGB(e,n,i);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,n=fi){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(e&255)/255,ft.colorSpaceToWorking(this,n),this}setRGB(e,n,i,r=ft.workingColorSpace){return this.r=e,this.g=n,this.b=i,ft.colorSpaceToWorking(this,r),this}setHSL(e,n,i,r=ft.workingColorSpace){if(e=vE(e,1),n=lt(n,0,1),i=lt(i,0,1),n===0)this.r=this.g=this.b=i;else{const s=i<=.5?i*(1+n):i+n-i*n,a=2*i-s;this.r=gd(a,s,e+1/3),this.g=gd(a,s,e),this.b=gd(a,s,e-1/3)}return ft.colorSpaceToWorking(this,r),this}setStyle(e,n=fi){function i(s){s!==void 0&&parseFloat(s)<1&&Ge("Color: Alpha component of "+e+" will be ignored.")}let r;if(r=/^(\w+)\(([^\)]*)\)/.exec(e)){let s;const a=r[1],o=r[2];switch(a){case"rgb":case"rgba":if(s=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return i(s[4]),this.setRGB(Math.min(255,parseInt(s[1],10))/255,Math.min(255,parseInt(s[2],10))/255,Math.min(255,parseInt(s[3],10))/255,n);if(s=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return i(s[4]),this.setRGB(Math.min(100,parseInt(s[1],10))/100,Math.min(100,parseInt(s[2],10))/100,Math.min(100,parseInt(s[3],10))/100,n);break;case"hsl":case"hsla":if(s=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return i(s[4]),this.setHSL(parseFloat(s[1])/360,parseFloat(s[2])/100,parseFloat(s[3])/100,n);break;default:Ge("Color: Unknown color model "+e)}}else if(r=/^\#([A-Fa-f\d]+)$/.exec(e)){const s=r[1],a=s.length;if(a===3)return this.setRGB(parseInt(s.charAt(0),16)/15,parseInt(s.charAt(1),16)/15,parseInt(s.charAt(2),16)/15,n);if(a===6)return this.setHex(parseInt(s,16),n);Ge("Color: Invalid hex color "+e)}else if(e&&e.length>0)return this.setColorName(e,n);return this}setColorName(e,n=fi){const i=mx[e.toLowerCase()];return i!==void 0?this.setHex(i,n):Ge("Color: Unknown color "+e),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=Tr(e.r),this.g=Tr(e.g),this.b=Tr(e.b),this}copyLinearToSRGB(e){return this.r=Pa(e.r),this.g=Pa(e.g),this.b=Pa(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=fi){return ft.workingToColorSpace(En.copy(this),e),Math.round(lt(En.r*255,0,255))*65536+Math.round(lt(En.g*255,0,255))*256+Math.round(lt(En.b*255,0,255))}getHexString(e=fi){return("000000"+this.getHex(e).toString(16)).slice(-6)}getHSL(e,n=ft.workingColorSpace){ft.workingToColorSpace(En.copy(this),n);const i=En.r,r=En.g,s=En.b,a=Math.max(i,r,s),o=Math.min(i,r,s);let l,c;const h=(o+a)/2;if(o===a)l=0,c=0;else{const p=a-o;switch(c=h<=.5?p/(a+o):p/(2-a-o),a){case i:l=(r-s)/p+(r<s?6:0);break;case r:l=(s-i)/p+2;break;case s:l=(i-r)/p+4;break}l/=6}return e.h=l,e.s=c,e.l=h,e}getRGB(e,n=ft.workingColorSpace){return ft.workingToColorSpace(En.copy(this),n),e.r=En.r,e.g=En.g,e.b=En.b,e}getStyle(e=fi){ft.workingToColorSpace(En.copy(this),e);const n=En.r,i=En.g,r=En.b;return e!==fi?`color(${e} ${n.toFixed(3)} ${i.toFixed(3)} ${r.toFixed(3)})`:`rgb(${Math.round(n*255)},${Math.round(i*255)},${Math.round(r*255)})`}offsetHSL(e,n,i){return this.getHSL(zr),this.setHSL(zr.h+e,zr.s+n,zr.l+i)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,n){return this.r=e.r+n.r,this.g=e.g+n.g,this.b=e.b+n.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,n){return this.r+=(e.r-this.r)*n,this.g+=(e.g-this.g)*n,this.b+=(e.b-this.b)*n,this}lerpColors(e,n,i){return this.r=e.r+(n.r-e.r)*i,this.g=e.g+(n.g-e.g)*i,this.b=e.b+(n.b-e.b)*i,this}lerpHSL(e,n){this.getHSL(zr),e.getHSL(Il);const i=cd(zr.h,Il.h,n),r=cd(zr.s,Il.s,n),s=cd(zr.l,Il.l,n);return this.setHSL(i,r,s),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){const n=this.r,i=this.g,r=this.b,s=e.elements;return this.r=s[0]*n+s[3]*i+s[6]*r,this.g=s[1]*n+s[4]*i+s[7]*r,this.b=s[2]*n+s[5]*i+s[8]*r,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,n=0){return this.r=e[n],this.g=e[n+1],this.b=e[n+2],this}toArray(e=[],n=0){return e[n]=this.r,e[n+1]=this.g,e[n+2]=this.b,e}fromBufferAttribute(e,n){return this.r=e.getX(n),this.g=e.getY(n),this.b=e.getZ(n),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}}const En=new dt;dt.NAMES=mx;class Ip{constructor(e,n=1,i=1e3){this.isFog=!0,this.name="",this.color=new dt(e),this.near=n,this.far=i}clone(){return new Ip(this.color,this.near,this.far)}toJSON(){return{type:"Fog",name:this.name,color:this.color.getHex(),near:this.near,far:this.far}}}class DE extends hn{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new cs,this.environmentIntensity=1,this.environmentRotation=new cs,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(e,n){return super.copy(e,n),e.background!==null&&(this.background=e.background.clone()),e.environment!==null&&(this.environment=e.environment.clone()),e.fog!==null&&(this.fog=e.fog.clone()),this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,this.backgroundRotation.copy(e.backgroundRotation),this.environmentIntensity=e.environmentIntensity,this.environmentRotation.copy(e.environmentRotation),e.overrideMaterial!==null&&(this.overrideMaterial=e.overrideMaterial.clone()),this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){const n=super.toJSON(e);return this.fog!==null&&(n.object.fog=this.fog.toJSON()),n.object.backgroundBlurriness=this.backgroundBlurriness,n.object.backgroundIntensity=this.backgroundIntensity,n.object.backgroundRotation=this.backgroundRotation.toArray(),n.object.environmentIntensity=this.environmentIntensity,n.object.environmentRotation=this.environmentRotation.toArray(),n}}const bi=new D,hr=new D,_d=new D,pr=new D,Ks=new D,Zs=new D,D0=new D,vd=new D,xd=new D,yd=new D,Sd=new Gt,Md=new Gt,Ed=new Gt;class mi{constructor(e=new D,n=new D,i=new D){this.a=e,this.b=n,this.c=i}static getNormal(e,n,i,r){r.subVectors(i,n),bi.subVectors(e,n),r.cross(bi);const s=r.lengthSq();return s>0?r.multiplyScalar(1/Math.sqrt(s)):r.set(0,0,0)}static getBarycoord(e,n,i,r,s){bi.subVectors(r,n),hr.subVectors(i,n),_d.subVectors(e,n);const a=bi.dot(bi),o=bi.dot(hr),l=bi.dot(_d),c=hr.dot(hr),h=hr.dot(_d),p=a*c-o*o;if(p===0)return s.set(0,0,0),null;const f=1/p,g=(c*l-o*h)*f,v=(a*h-o*l)*f;return s.set(1-g-v,v,g)}static containsPoint(e,n,i,r){return this.getBarycoord(e,n,i,r,pr)===null?!1:pr.x>=0&&pr.y>=0&&pr.x+pr.y<=1}static getInterpolation(e,n,i,r,s,a,o,l){return this.getBarycoord(e,n,i,r,pr)===null?(l.x=0,l.y=0,"z"in l&&(l.z=0),"w"in l&&(l.w=0),null):(l.setScalar(0),l.addScaledVector(s,pr.x),l.addScaledVector(a,pr.y),l.addScaledVector(o,pr.z),l)}static getInterpolatedAttribute(e,n,i,r,s,a){return Sd.setScalar(0),Md.setScalar(0),Ed.setScalar(0),Sd.fromBufferAttribute(e,n),Md.fromBufferAttribute(e,i),Ed.fromBufferAttribute(e,r),a.setScalar(0),a.addScaledVector(Sd,s.x),a.addScaledVector(Md,s.y),a.addScaledVector(Ed,s.z),a}static isFrontFacing(e,n,i,r){return bi.subVectors(i,n),hr.subVectors(e,n),bi.cross(hr).dot(r)<0}set(e,n,i){return this.a.copy(e),this.b.copy(n),this.c.copy(i),this}setFromPointsAndIndices(e,n,i,r){return this.a.copy(e[n]),this.b.copy(e[i]),this.c.copy(e[r]),this}setFromAttributeAndIndices(e,n,i,r){return this.a.fromBufferAttribute(e,n),this.b.fromBufferAttribute(e,i),this.c.fromBufferAttribute(e,r),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return bi.subVectors(this.c,this.b),hr.subVectors(this.a,this.b),bi.cross(hr).length()*.5}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(e){return mi.getNormal(this.a,this.b,this.c,e)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(e,n){return mi.getBarycoord(e,this.a,this.b,this.c,n)}getInterpolation(e,n,i,r,s){return mi.getInterpolation(e,this.a,this.b,this.c,n,i,r,s)}containsPoint(e){return mi.containsPoint(e,this.a,this.b,this.c)}isFrontFacing(e){return mi.isFrontFacing(this.a,this.b,this.c,e)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,n){const i=this.a,r=this.b,s=this.c;let a,o;Ks.subVectors(r,i),Zs.subVectors(s,i),vd.subVectors(e,i);const l=Ks.dot(vd),c=Zs.dot(vd);if(l<=0&&c<=0)return n.copy(i);xd.subVectors(e,r);const h=Ks.dot(xd),p=Zs.dot(xd);if(h>=0&&p<=h)return n.copy(r);const f=l*p-h*c;if(f<=0&&l>=0&&h<=0)return a=l/(l-h),n.copy(i).addScaledVector(Ks,a);yd.subVectors(e,s);const g=Ks.dot(yd),v=Zs.dot(yd);if(v>=0&&g<=v)return n.copy(s);const E=g*c-l*v;if(E<=0&&c>=0&&v<=0)return o=c/(c-v),n.copy(i).addScaledVector(Zs,o);const _=h*v-g*p;if(_<=0&&p-h>=0&&g-v>=0)return D0.subVectors(s,r),o=(p-h)/(p-h+(g-v)),n.copy(r).addScaledVector(D0,o);const u=1/(_+E+f);return a=E*u,o=f*u,n.copy(i).addScaledVector(Ks,a).addScaledVector(Zs,o)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}}class ul{constructor(e=new D(1/0,1/0,1/0),n=new D(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=n}set(e,n){return this.min.copy(e),this.max.copy(n),this}setFromArray(e){this.makeEmpty();for(let n=0,i=e.length;n<i;n+=3)this.expandByPoint(Ri.fromArray(e,n));return this}setFromBufferAttribute(e){this.makeEmpty();for(let n=0,i=e.count;n<i;n++)this.expandByPoint(Ri.fromBufferAttribute(e,n));return this}setFromPoints(e){this.makeEmpty();for(let n=0,i=e.length;n<i;n++)this.expandByPoint(e[n]);return this}setFromCenterAndSize(e,n){const i=Ri.copy(n).multiplyScalar(.5);return this.min.copy(e).sub(i),this.max.copy(e).add(i),this}setFromObject(e,n=!1){return this.makeEmpty(),this.expandByObject(e,n)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,n=!1){e.updateWorldMatrix(!1,!1);const i=e.geometry;if(i!==void 0){const s=i.getAttribute("position");if(n===!0&&s!==void 0&&e.isInstancedMesh!==!0)for(let a=0,o=s.count;a<o;a++)e.isMesh===!0?e.getVertexPosition(a,Ri):Ri.fromBufferAttribute(s,a),Ri.applyMatrix4(e.matrixWorld),this.expandByPoint(Ri);else e.boundingBox!==void 0?(e.boundingBox===null&&e.computeBoundingBox(),Ul.copy(e.boundingBox)):(i.boundingBox===null&&i.computeBoundingBox(),Ul.copy(i.boundingBox)),Ul.applyMatrix4(e.matrixWorld),this.union(Ul)}const r=e.children;for(let s=0,a=r.length;s<a;s++)this.expandByObject(r[s],n);return this}containsPoint(e){return e.x>=this.min.x&&e.x<=this.max.x&&e.y>=this.min.y&&e.y<=this.max.y&&e.z>=this.min.z&&e.z<=this.max.z}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,n){return n.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return e.max.x>=this.min.x&&e.min.x<=this.max.x&&e.max.y>=this.min.y&&e.min.y<=this.max.y&&e.max.z>=this.min.z&&e.min.z<=this.max.z}intersectsSphere(e){return this.clampPoint(e.center,Ri),Ri.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let n,i;return e.normal.x>0?(n=e.normal.x*this.min.x,i=e.normal.x*this.max.x):(n=e.normal.x*this.max.x,i=e.normal.x*this.min.x),e.normal.y>0?(n+=e.normal.y*this.min.y,i+=e.normal.y*this.max.y):(n+=e.normal.y*this.max.y,i+=e.normal.y*this.min.y),e.normal.z>0?(n+=e.normal.z*this.min.z,i+=e.normal.z*this.max.z):(n+=e.normal.z*this.max.z,i+=e.normal.z*this.min.z),n<=-e.constant&&i>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(uo),Fl.subVectors(this.max,uo),Qs.subVectors(e.a,uo),Js.subVectors(e.b,uo),ea.subVectors(e.c,uo),Hr.subVectors(Js,Qs),Vr.subVectors(ea,Js),_s.subVectors(Qs,ea);let n=[0,-Hr.z,Hr.y,0,-Vr.z,Vr.y,0,-_s.z,_s.y,Hr.z,0,-Hr.x,Vr.z,0,-Vr.x,_s.z,0,-_s.x,-Hr.y,Hr.x,0,-Vr.y,Vr.x,0,-_s.y,_s.x,0];return!wd(n,Qs,Js,ea,Fl)||(n=[1,0,0,0,1,0,0,0,1],!wd(n,Qs,Js,ea,Fl))?!1:(Ol.crossVectors(Hr,Vr),n=[Ol.x,Ol.y,Ol.z],wd(n,Qs,Js,ea,Fl))}clampPoint(e,n){return n.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,Ri).distanceTo(e)}getBoundingSphere(e){return this.isEmpty()?e.makeEmpty():(this.getCenter(e.center),e.radius=this.getSize(Ri).length()*.5),e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()?this:(mr[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),mr[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),mr[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),mr[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),mr[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),mr[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),mr[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),mr[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(mr),this)}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(e){return this.min.fromArray(e.min),this.max.fromArray(e.max),this}}const mr=[new D,new D,new D,new D,new D,new D,new D,new D],Ri=new D,Ul=new ul,Qs=new D,Js=new D,ea=new D,Hr=new D,Vr=new D,_s=new D,uo=new D,Fl=new D,Ol=new D,vs=new D;function wd(t,e,n,i,r){for(let s=0,a=t.length-3;s<=a;s+=3){vs.fromArray(t,s);const o=r.x*Math.abs(vs.x)+r.y*Math.abs(vs.y)+r.z*Math.abs(vs.z),l=e.dot(vs),c=n.dot(vs),h=i.dot(vs);if(Math.max(-Math.max(l,c,h),Math.min(l,c,h))>o)return!1}return!0}const Qt=new D,kl=new je;let IE=0;class Ar extends hs{constructor(e,n,i=!1){if(super(),Array.isArray(e))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:IE++}),this.name="",this.array=e,this.itemSize=n,this.count=e!==void 0?e.length/n:0,this.normalized=i,this.usage=hE,this.updateRanges=[],this.gpuType=tr,this.version=0}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,n){this.updateRanges.push({start:e,count:n})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this.gpuType=e.gpuType,this}copyAt(e,n,i){e*=this.itemSize,i*=n.itemSize;for(let r=0,s=this.itemSize;r<s;r++)this.array[e+r]=n.array[i+r];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let n=0,i=this.count;n<i;n++)kl.fromBufferAttribute(this,n),kl.applyMatrix3(e),this.setXY(n,kl.x,kl.y);else if(this.itemSize===3)for(let n=0,i=this.count;n<i;n++)Qt.fromBufferAttribute(this,n),Qt.applyMatrix3(e),this.setXYZ(n,Qt.x,Qt.y,Qt.z);return this}applyMatrix4(e){for(let n=0,i=this.count;n<i;n++)Qt.fromBufferAttribute(this,n),Qt.applyMatrix4(e),this.setXYZ(n,Qt.x,Qt.y,Qt.z);return this}applyNormalMatrix(e){for(let n=0,i=this.count;n<i;n++)Qt.fromBufferAttribute(this,n),Qt.applyNormalMatrix(e),this.setXYZ(n,Qt.x,Qt.y,Qt.z);return this}transformDirection(e){for(let n=0,i=this.count;n<i;n++)Qt.fromBufferAttribute(this,n),Qt.transformDirection(e),this.setXYZ(n,Qt.x,Qt.y,Qt.z);return this}set(e,n=0){return this.array.set(e,n),this}getComponent(e,n){let i=this.array[e*this.itemSize+n];return this.normalized&&(i=lo(i,this.array)),i}setComponent(e,n,i){return this.normalized&&(i=Bn(i,this.array)),this.array[e*this.itemSize+n]=i,this}getX(e){let n=this.array[e*this.itemSize];return this.normalized&&(n=lo(n,this.array)),n}setX(e,n){return this.normalized&&(n=Bn(n,this.array)),this.array[e*this.itemSize]=n,this}getY(e){let n=this.array[e*this.itemSize+1];return this.normalized&&(n=lo(n,this.array)),n}setY(e,n){return this.normalized&&(n=Bn(n,this.array)),this.array[e*this.itemSize+1]=n,this}getZ(e){let n=this.array[e*this.itemSize+2];return this.normalized&&(n=lo(n,this.array)),n}setZ(e,n){return this.normalized&&(n=Bn(n,this.array)),this.array[e*this.itemSize+2]=n,this}getW(e){let n=this.array[e*this.itemSize+3];return this.normalized&&(n=lo(n,this.array)),n}setW(e,n){return this.normalized&&(n=Bn(n,this.array)),this.array[e*this.itemSize+3]=n,this}setXY(e,n,i){return e*=this.itemSize,this.normalized&&(n=Bn(n,this.array),i=Bn(i,this.array)),this.array[e+0]=n,this.array[e+1]=i,this}setXYZ(e,n,i,r){return e*=this.itemSize,this.normalized&&(n=Bn(n,this.array),i=Bn(i,this.array),r=Bn(r,this.array)),this.array[e+0]=n,this.array[e+1]=i,this.array[e+2]=r,this}setXYZW(e,n,i,r,s){return e*=this.itemSize,this.normalized&&(n=Bn(n,this.array),i=Bn(i,this.array),r=Bn(r,this.array),s=Bn(s,this.array)),this.array[e+0]=n,this.array[e+1]=i,this.array[e+2]=r,this.array[e+3]=s,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){const e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return e.name=this.name,e.usage=this.usage,e.gpuType=this.gpuType,e}dispose(){this.dispatchEvent({type:"dispose"})}}class gx extends Ar{constructor(e,n,i){super(new Uint16Array(e),n,i)}}class _x extends Ar{constructor(e,n,i){super(new Uint32Array(e),n,i)}}class Zt extends Ar{constructor(e,n,i){super(new Float32Array(e),n,i)}}const UE=new ul,fo=new D,Td=new D;class Su{constructor(e=new D,n=-1){this.isSphere=!0,this.center=e,this.radius=n}set(e,n){return this.center.copy(e),this.radius=n,this}setFromPoints(e,n){const i=this.center;n!==void 0?i.copy(n):UE.setFromPoints(e).getCenter(i);let r=0;for(let s=0,a=e.length;s<a;s++)r=Math.max(r,i.distanceToSquared(e[s]));return this.radius=Math.sqrt(r),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){const n=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=n*n}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,n){const i=this.center.distanceToSquared(e);return n.copy(e),i>this.radius*this.radius&&(n.sub(this.center).normalize(),n.multiplyScalar(this.radius).add(this.center)),n}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius=this.radius*e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;fo.subVectors(e,this.center);const n=fo.lengthSq();if(n>this.radius*this.radius){const i=Math.sqrt(n),r=(i-this.radius)*.5;this.center.addScaledVector(fo,r/i),this.radius+=r}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(Td.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(fo.copy(e.center).add(Td)),this.expandByPoint(fo.copy(e.center).sub(Td))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return{radius:this.radius,center:this.center.toArray()}}fromJSON(e){return this.radius=e.radius,this.center.fromArray(e.center),this}}let FE=0;const di=new kt,Ad=new hn,ta=new D,Zn=new ul,ho=new ul,un=new D;class qn extends hs{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:FE++}),this.uuid=cl(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.indirectOffset=0,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={},this._transformed=!1}getIndex(){return this.index}setIndex(e){return Array.isArray(e)?this.index=new(pE(e)?_x:gx)(e,1):this.index=e,this}setIndirect(e,n=0){return this.indirect=e,this.indirectOffset=n,this}getIndirect(){return this.indirect}getAttribute(e){return this.attributes[e]}setAttribute(e,n){return this.attributes[e]=n,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,n,i=0){this.groups.push({start:e,count:n,materialIndex:i})}clearGroups(){this.groups=[]}setDrawRange(e,n){this.drawRange.start=e,this.drawRange.count=n}applyMatrix4(e){const n=this.attributes.position;n!==void 0&&(n.applyMatrix4(e),n.needsUpdate=!0);const i=this.attributes.normal;if(i!==void 0){const s=new Ye().getNormalMatrix(e);i.applyNormalMatrix(s),i.needsUpdate=!0}const r=this.attributes.tangent;return r!==void 0&&(r.transformDirection(e),r.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this._transformed=!0,this}applyQuaternion(e){return di.makeRotationFromQuaternion(e),this.applyMatrix4(di),this}rotateX(e){return di.makeRotationX(e),this.applyMatrix4(di),this}rotateY(e){return di.makeRotationY(e),this.applyMatrix4(di),this}rotateZ(e){return di.makeRotationZ(e),this.applyMatrix4(di),this}translate(e,n,i){return di.makeTranslation(e,n,i),this.applyMatrix4(di),this}scale(e,n,i){return di.makeScale(e,n,i),this.applyMatrix4(di),this}lookAt(e){return Ad.lookAt(e),Ad.updateMatrix(),this.applyMatrix4(Ad.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(ta).negate(),this.translate(ta.x,ta.y,ta.z),this}setFromPoints(e){const n=this.getAttribute("position");if(n===void 0){const i=[];for(let r=0,s=e.length;r<s;r++){const a=e[r];i.push(a.x,a.y,a.z||0)}this.setAttribute("position",new Zt(i,3))}else{const i=Math.min(e.length,n.count);for(let r=0;r<i;r++){const s=e[r];n.setXYZ(r,s.x,s.y,s.z||0)}e.length>n.count&&Ge("BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),n.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new ul);const e=this.attributes.position,n=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){gt("BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new D(-1/0,-1/0,-1/0),new D(1/0,1/0,1/0));return}if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),n)for(let i=0,r=n.length;i<r;i++){const s=n[i];Zn.setFromBufferAttribute(s),this.morphTargetsRelative?(un.addVectors(this.boundingBox.min,Zn.min),this.boundingBox.expandByPoint(un),un.addVectors(this.boundingBox.max,Zn.max),this.boundingBox.expandByPoint(un)):(this.boundingBox.expandByPoint(Zn.min),this.boundingBox.expandByPoint(Zn.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&gt('BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new Su);const e=this.attributes.position,n=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){gt("BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new D,1/0);return}if(e){const i=this.boundingSphere.center;if(Zn.setFromBufferAttribute(e),n)for(let s=0,a=n.length;s<a;s++){const o=n[s];ho.setFromBufferAttribute(o),this.morphTargetsRelative?(un.addVectors(Zn.min,ho.min),Zn.expandByPoint(un),un.addVectors(Zn.max,ho.max),Zn.expandByPoint(un)):(Zn.expandByPoint(ho.min),Zn.expandByPoint(ho.max))}Zn.getCenter(i);let r=0;for(let s=0,a=e.count;s<a;s++)un.fromBufferAttribute(e,s),r=Math.max(r,i.distanceToSquared(un));if(n)for(let s=0,a=n.length;s<a;s++){const o=n[s],l=this.morphTargetsRelative;for(let c=0,h=o.count;c<h;c++)un.fromBufferAttribute(o,c),l&&(ta.fromBufferAttribute(e,c),un.add(ta)),r=Math.max(r,i.distanceToSquared(un))}this.boundingSphere.radius=Math.sqrt(r),isNaN(this.boundingSphere.radius)&&gt('BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){const e=this.index,n=this.attributes;if(e===null||n.position===void 0||n.normal===void 0||n.uv===void 0){gt("BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}const i=n.position,r=n.normal,s=n.uv;let a=this.getAttribute("tangent");(a===void 0||a.count!==i.count)&&(a=new Ar(new Float32Array(4*i.count),4),this.setAttribute("tangent",a));const o=[],l=[];for(let x=0;x<i.count;x++)o[x]=new D,l[x]=new D;const c=new D,h=new D,p=new D,f=new je,g=new je,v=new je,E=new D,_=new D;function u(x,A,P){c.fromBufferAttribute(i,x),h.fromBufferAttribute(i,A),p.fromBufferAttribute(i,P),f.fromBufferAttribute(s,x),g.fromBufferAttribute(s,A),v.fromBufferAttribute(s,P),h.sub(c),p.sub(c),g.sub(f),v.sub(f);const L=1/(g.x*v.y-v.x*g.y);isFinite(L)&&(E.copy(h).multiplyScalar(v.y).addScaledVector(p,-g.y).multiplyScalar(L),_.copy(p).multiplyScalar(g.x).addScaledVector(h,-v.x).multiplyScalar(L),o[x].add(E),o[A].add(E),o[P].add(E),l[x].add(_),l[A].add(_),l[P].add(_))}let m=this.groups;m.length===0&&(m=[{start:0,count:e.count}]);for(let x=0,A=m.length;x<A;++x){const P=m[x],L=P.start,B=P.count;for(let F=L,I=L+B;F<I;F+=3)u(e.getX(F+0),e.getX(F+1),e.getX(F+2))}const M=new D,y=new D,T=new D,w=new D;function R(x){T.fromBufferAttribute(r,x),w.copy(T);const A=o[x];M.copy(A),M.sub(T.multiplyScalar(T.dot(A))).normalize(),y.crossVectors(w,A);const L=y.dot(l[x])<0?-1:1;a.setXYZW(x,M.x,M.y,M.z,L)}for(let x=0,A=m.length;x<A;++x){const P=m[x],L=P.start,B=P.count;for(let F=L,I=L+B;F<I;F+=3)R(e.getX(F+0)),R(e.getX(F+1)),R(e.getX(F+2))}this._transformed=!0}computeVertexNormals(){const e=this.index,n=this.getAttribute("position");if(n!==void 0){let i=this.getAttribute("normal");if(i===void 0||i.count!==n.count)i=new Ar(new Float32Array(n.count*3),3),this.setAttribute("normal",i);else for(let f=0,g=i.count;f<g;f++)i.setXYZ(f,0,0,0);const r=new D,s=new D,a=new D,o=new D,l=new D,c=new D,h=new D,p=new D;if(e)for(let f=0,g=e.count;f<g;f+=3){const v=e.getX(f+0),E=e.getX(f+1),_=e.getX(f+2);r.fromBufferAttribute(n,v),s.fromBufferAttribute(n,E),a.fromBufferAttribute(n,_),h.subVectors(a,s),p.subVectors(r,s),h.cross(p),o.fromBufferAttribute(i,v),l.fromBufferAttribute(i,E),c.fromBufferAttribute(i,_),o.add(h),l.add(h),c.add(h),i.setXYZ(v,o.x,o.y,o.z),i.setXYZ(E,l.x,l.y,l.z),i.setXYZ(_,c.x,c.y,c.z)}else for(let f=0,g=n.count;f<g;f+=3)r.fromBufferAttribute(n,f+0),s.fromBufferAttribute(n,f+1),a.fromBufferAttribute(n,f+2),h.subVectors(a,s),p.subVectors(r,s),h.cross(p),i.setXYZ(f+0,h.x,h.y,h.z),i.setXYZ(f+1,h.x,h.y,h.z),i.setXYZ(f+2,h.x,h.y,h.z);this.normalizeNormals(),i.needsUpdate=!0}}normalizeNormals(){const e=this.attributes.normal;for(let n=0,i=e.count;n<i;n++)un.fromBufferAttribute(e,n),un.normalize(),e.setXYZ(n,un.x,un.y,un.z)}toNonIndexed(){function e(o,l){const c=o.array,h=o.itemSize,p=o.normalized,f=new c.constructor(l.length*h);let g=0,v=0;for(let E=0,_=l.length;E<_;E++){o.isInterleavedBufferAttribute?g=l[E]*o.data.stride+o.offset:g=l[E]*h;for(let u=0;u<h;u++)f[v++]=c[g++]}return new Ar(f,h,p)}if(this.index===null)return Ge("BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;const n=new qn,i=this.index.array,r=this.attributes;for(const o in r){const l=r[o],c=e(l,i);n.setAttribute(o,c)}const s=this.morphAttributes;for(const o in s){const l=[],c=s[o];for(let h=0,p=c.length;h<p;h++){const f=c[h],g=e(f,i);l.push(g)}n.morphAttributes[o]=l}n.morphTargetsRelative=this.morphTargetsRelative;const a=this.groups;for(let o=0,l=a.length;o<l;o++){const c=a[o];n.addGroup(c.start,c.count,c.materialIndex)}return n}toJSON(){const e={metadata:{version:4.7,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(e.uuid=this.uuid,e.type=this.parameters!==void 0&&this._transformed===!0?"BufferGeometry":this.type,e.name=this.name,Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0&&this._transformed!==!0){const l=this.parameters;for(const c in l)l[c]!==void 0&&(e[c]=l[c]);return e}e.data={attributes:{}};const n=this.index;n!==null&&(e.data.index={type:n.array.constructor.name,array:Array.prototype.slice.call(n.array)});const i=this.attributes;for(const l in i){const c=i[l];e.data.attributes[l]=c.toJSON(e.data)}const r={};let s=!1;for(const l in this.morphAttributes){const c=this.morphAttributes[l],h=[];for(let p=0,f=c.length;p<f;p++){const g=c[p];h.push(g.toJSON(e.data))}h.length>0&&(r[l]=h,s=!0)}s&&(e.data.morphAttributes=r,e.data.morphTargetsRelative=this.morphTargetsRelative);const a=this.groups;a.length>0&&(e.data.groups=JSON.parse(JSON.stringify(a)));const o=this.boundingSphere;return o!==null&&(e.data.boundingSphere=o.toJSON()),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;const n={};this.name=e.name;const i=e.index;i!==null&&this.setIndex(i.clone());const r=e.attributes;for(const c in r){const h=r[c];this.setAttribute(c,h.clone(n))}const s=e.morphAttributes;for(const c in s){const h=[],p=s[c];for(let f=0,g=p.length;f<g;f++)h.push(p[f].clone(n));this.morphAttributes[c]=h}this.morphTargetsRelative=e.morphTargetsRelative;const a=e.groups;for(let c=0,h=a.length;c<h;c++){const p=a[c];this.addGroup(p.start,p.count,p.materialIndex)}const o=e.boundingBox;o!==null&&(this.boundingBox=o.clone());const l=e.boundingSphere;return l!==null&&(this.boundingSphere=l.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,this._transformed=e._transformed,this}dispose(){this.dispatchEvent({type:"dispose"})}}const bd=new D,OE=new D,kE=new Ye;class xr{constructor(e=new D(1,0,0),n=0){this.isPlane=!0,this.normal=e,this.constant=n}set(e,n){return this.normal.copy(e),this.constant=n,this}setComponents(e,n,i,r){return this.normal.set(e,n,i),this.constant=r,this}setFromNormalAndCoplanarPoint(e,n){return this.normal.copy(e),this.constant=-n.dot(this.normal),this}setFromCoplanarPoints(e,n,i){const r=bd.subVectors(i,n).cross(OE.subVectors(e,n)).normalize();return this.setFromNormalAndCoplanarPoint(r,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){const e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,n){return n.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,n,i=!0){const r=e.delta(bd),s=this.normal.dot(r);if(s===0)return this.distanceToPoint(e.start)===0?n.copy(e.start):null;const a=-(e.start.dot(this.normal)+this.constant)/s;return i===!0&&(a<0||a>1)?null:n.copy(e.start).addScaledVector(r,a)}intersectsLine(e){const n=this.distanceToPoint(e.start),i=this.distanceToPoint(e.end);return n<0&&i>0||i<0&&n>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,n){const i=n||kE.getNormalMatrix(e),r=this.coplanarPoint(bd).applyMatrix4(e),s=this.normal.applyMatrix3(i).normalize();return this.constant=-r.dot(s),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}toJSON(){return{normal:this.normal.toArray(),constant:this.constant}}fromJSON(e){return this.normal.fromArray(e.normal),this.constant=e.constant,this}}let BE=0;class ja extends hs{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:BE++}),this.uuid=cl(),this.name="",this.type="Material",this.blending=Io,this.side=Fs,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=Yv,this.blendDst=Kv,this.blendEquation=aa,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new dt(0,0,0),this.blendAlpha=0,this.depthFunc=Jo,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=aE,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=ld,this.stencilZFail=ld,this.stencilZPass=ld,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(const n in e){const i=e[n];if(i===void 0){Ge(`Material: parameter '${n}' has value of undefined.`);continue}const r=this[n];if(r===void 0){Ge(`Material: '${n}' is not a property of THREE.${this.type}.`);continue}r&&r.isColor?r.set(i):r&&r.isVector2&&i&&i.isVector2||r&&r.isEuler&&i&&i.isEuler||r&&r.isVector3&&i&&i.isVector3?r.copy(i):this[n]=i}}toJSON(e){const n=e===void 0||typeof e=="string";n&&(e={textures:{},images:{}});const i={metadata:{version:4.7,type:"Material",generator:"Material.toJSON"}};i.uuid=this.uuid,i.type=this.type,i.blending=this.blending,i.side=this.side,i.shadowSide=this.shadowSide,i.vertexColors=this.vertexColors,i.opacity=this.opacity,i.transparent=this.transparent,i.blendSrc=this.blendSrc,i.blendDst=this.blendDst,i.blendEquation=this.blendEquation,i.blendSrcAlpha=this.blendSrcAlpha,i.blendDstAlpha=this.blendDstAlpha,i.blendEquationAlpha=this.blendEquationAlpha,i.blendColor=this.blendColor.getHex(),i.blendAlpha=this.blendAlpha,i.depthFunc=this.depthFunc,i.depthTest=this.depthTest,i.depthWrite=this.depthWrite,i.colorWrite=this.colorWrite,i.clipIntersection=this.clipIntersection,i.clipShadows=this.clipShadows,i.stencilWriteMask=this.stencilWriteMask,i.stencilFunc=this.stencilFunc,i.stencilRef=this.stencilRef,i.stencilFuncMask=this.stencilFuncMask,i.stencilFail=this.stencilFail,i.stencilZFail=this.stencilZFail,i.stencilZPass=this.stencilZPass,i.stencilWrite=this.stencilWrite,i.polygonOffset=this.polygonOffset,i.polygonOffsetFactor=this.polygonOffsetFactor,i.polygonOffsetUnits=this.polygonOffsetUnits,i.dithering=this.dithering,i.alphaTest=this.alphaTest,i.alphaHash=this.alphaHash,i.alphaToCoverage=this.alphaToCoverage,i.premultipliedAlpha=this.premultipliedAlpha,i.forceSinglePass=this.forceSinglePass,i.allowOverride=this.allowOverride,i.visible=this.visible,i.toneMapped=this.toneMapped,i.name=this.name,this.color&&this.color.isColor&&(i.color=this.color.getHex()),this.roughness!==void 0&&(i.roughness=this.roughness),this.metalness!==void 0&&(i.metalness=this.metalness),this.sheen!==void 0&&(i.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(i.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(i.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(i.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&(i.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(i.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(i.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(i.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(i.shininess=this.shininess),this.clearcoat!==void 0&&(i.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(i.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(i.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(i.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(i.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,i.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.sheenColorMap&&this.sheenColorMap.isTexture&&(i.sheenColorMap=this.sheenColorMap.toJSON(e).uuid),this.sheenRoughnessMap&&this.sheenRoughnessMap.isTexture&&(i.sheenRoughnessMap=this.sheenRoughnessMap.toJSON(e).uuid),this.dispersion!==void 0&&(i.dispersion=this.dispersion),this.retroreflectivity!==void 0&&(i.retroreflectivity=this.retroreflectivity),this.iridescence!==void 0&&(i.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(i.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(i.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(i.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(i.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.anisotropy!==void 0&&(i.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(i.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(i.anisotropyMap=this.anisotropyMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(i.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(i.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(i.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(i.lightMap=this.lightMap.toJSON(e).uuid,i.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(i.aoMap=this.aoMap.toJSON(e).uuid,i.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(i.bumpMap=this.bumpMap.toJSON(e).uuid,i.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(i.normalMap=this.normalMap.toJSON(e).uuid,i.normalMapType=this.normalMapType,i.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(i.displacementMap=this.displacementMap.toJSON(e).uuid,i.displacementScale=this.displacementScale,i.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(i.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(i.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(i.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(i.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(i.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(i.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(i.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(i.combine=this.combine)),this.envMapRotation!==void 0&&(i.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(i.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(i.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(i.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(i.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(i.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(i.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(i.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(i.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&(i.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(i.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(i.size=this.size),this.sizeAttenuation!==void 0&&(i.sizeAttenuation=this.sizeAttenuation),Array.isArray(this.clippingPlanes)&&this.clippingPlanes.length>0&&(i.clippingPlanes=this.clippingPlanes.map(s=>s.toJSON())),this.rotation!==void 0&&(i.rotation=this.rotation),this.depthPacking!==void 0&&(i.depthPacking=this.depthPacking),this.linewidth!==void 0&&(i.linewidth=this.linewidth),this.linecap!==void 0&&(i.linecap=this.linecap),this.linejoin!==void 0&&(i.linejoin=this.linejoin),this.dashSize!==void 0&&(i.dashSize=this.dashSize),this.gapSize!==void 0&&(i.gapSize=this.gapSize),this.scale!==void 0&&(i.scale=this.scale),this.wireframe!==void 0&&(i.wireframe=this.wireframe),this.wireframeLinewidth!==void 0&&(i.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!==void 0&&(i.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!==void 0&&(i.wireframeLinejoin=this.wireframeLinejoin),this.flatShading!==void 0&&(i.flatShading=this.flatShading),this.fog!==void 0&&(i.fog=this.fog),Object.keys(this.userData).length>0&&(i.userData=this.userData);function r(s){const a=[];for(const o in s){const l=s[o];delete l.metadata,a.push(l)}return a}if(n){const s=r(e.textures),a=r(e.images);s.length>0&&(i.textures=s),a.length>0&&(i.images=a)}return i}fromJSON(e,n){if(e.uuid!==void 0&&(this.uuid=e.uuid),e.name!==void 0&&(this.name=e.name),e.color!==void 0&&this.color!==void 0&&this.color.setHex(e.color),e.roughness!==void 0&&(this.roughness=e.roughness),e.metalness!==void 0&&(this.metalness=e.metalness),e.sheen!==void 0&&(this.sheen=e.sheen),e.sheenColor!==void 0&&(this.sheenColor=new dt().setHex(e.sheenColor)),e.sheenRoughness!==void 0&&(this.sheenRoughness=e.sheenRoughness),e.emissive!==void 0&&this.emissive!==void 0&&this.emissive.setHex(e.emissive),e.specular!==void 0&&this.specular!==void 0&&this.specular.setHex(e.specular),e.specularIntensity!==void 0&&(this.specularIntensity=e.specularIntensity),e.specularColor!==void 0&&this.specularColor!==void 0&&this.specularColor.setHex(e.specularColor),e.shininess!==void 0&&(this.shininess=e.shininess),e.clearcoat!==void 0&&(this.clearcoat=e.clearcoat),e.clearcoatRoughness!==void 0&&(this.clearcoatRoughness=e.clearcoatRoughness),e.dispersion!==void 0&&(this.dispersion=e.dispersion),e.retroreflectivity!==void 0&&(this.retroreflectivity=e.retroreflectivity),e.iridescence!==void 0&&(this.iridescence=e.iridescence),e.iridescenceIOR!==void 0&&(this.iridescenceIOR=e.iridescenceIOR),e.iridescenceThicknessRange!==void 0&&(this.iridescenceThicknessRange=e.iridescenceThicknessRange),e.transmission!==void 0&&(this.transmission=e.transmission),e.thickness!==void 0&&(this.thickness=e.thickness),e.attenuationDistance!==void 0&&(this.attenuationDistance=e.attenuationDistance),e.attenuationColor!==void 0&&this.attenuationColor!==void 0&&this.attenuationColor.setHex(e.attenuationColor),e.anisotropy!==void 0&&(this.anisotropy=e.anisotropy),e.anisotropyRotation!==void 0&&(this.anisotropyRotation=e.anisotropyRotation),e.fog!==void 0&&(this.fog=e.fog),e.flatShading!==void 0&&(this.flatShading=e.flatShading),e.blending!==void 0&&(this.blending=e.blending),e.combine!==void 0&&(this.combine=e.combine),e.side!==void 0&&(this.side=e.side),e.shadowSide!==void 0&&(this.shadowSide=e.shadowSide),e.opacity!==void 0&&(this.opacity=e.opacity),e.transparent!==void 0&&(this.transparent=e.transparent),e.alphaTest!==void 0&&(this.alphaTest=e.alphaTest),e.alphaHash!==void 0&&(this.alphaHash=e.alphaHash),e.depthFunc!==void 0&&(this.depthFunc=e.depthFunc),e.depthTest!==void 0&&(this.depthTest=e.depthTest),e.depthWrite!==void 0&&(this.depthWrite=e.depthWrite),e.colorWrite!==void 0&&(this.colorWrite=e.colorWrite),e.clippingPlanes!==void 0&&(this.clippingPlanes=e.clippingPlanes.map(i=>new xr().fromJSON(i))),e.clipIntersection!==void 0&&(this.clipIntersection=e.clipIntersection),e.clipShadows!==void 0&&(this.clipShadows=e.clipShadows),e.depthPacking!==void 0&&(this.depthPacking=e.depthPacking),e.blendSrc!==void 0&&(this.blendSrc=e.blendSrc),e.blendDst!==void 0&&(this.blendDst=e.blendDst),e.blendEquation!==void 0&&(this.blendEquation=e.blendEquation),e.blendSrcAlpha!==void 0&&(this.blendSrcAlpha=e.blendSrcAlpha),e.blendDstAlpha!==void 0&&(this.blendDstAlpha=e.blendDstAlpha),e.blendEquationAlpha!==void 0&&(this.blendEquationAlpha=e.blendEquationAlpha),e.blendColor!==void 0&&this.blendColor!==void 0&&this.blendColor.setHex(e.blendColor),e.blendAlpha!==void 0&&(this.blendAlpha=e.blendAlpha),e.stencilWriteMask!==void 0&&(this.stencilWriteMask=e.stencilWriteMask),e.stencilFunc!==void 0&&(this.stencilFunc=e.stencilFunc),e.stencilRef!==void 0&&(this.stencilRef=e.stencilRef),e.stencilFuncMask!==void 0&&(this.stencilFuncMask=e.stencilFuncMask),e.stencilFail!==void 0&&(this.stencilFail=e.stencilFail),e.stencilZFail!==void 0&&(this.stencilZFail=e.stencilZFail),e.stencilZPass!==void 0&&(this.stencilZPass=e.stencilZPass),e.stencilWrite!==void 0&&(this.stencilWrite=e.stencilWrite),e.wireframe!==void 0&&(this.wireframe=e.wireframe),e.wireframeLinewidth!==void 0&&(this.wireframeLinewidth=e.wireframeLinewidth),e.wireframeLinecap!==void 0&&(this.wireframeLinecap=e.wireframeLinecap),e.wireframeLinejoin!==void 0&&(this.wireframeLinejoin=e.wireframeLinejoin),e.rotation!==void 0&&(this.rotation=e.rotation),e.linewidth!==void 0&&(this.linewidth=e.linewidth),e.linecap!==void 0&&(this.linecap=e.linecap),e.linejoin!==void 0&&(this.linejoin=e.linejoin),e.dashSize!==void 0&&(this.dashSize=e.dashSize),e.gapSize!==void 0&&(this.gapSize=e.gapSize),e.scale!==void 0&&(this.scale=e.scale),e.polygonOffset!==void 0&&(this.polygonOffset=e.polygonOffset),e.polygonOffsetFactor!==void 0&&(this.polygonOffsetFactor=e.polygonOffsetFactor),e.polygonOffsetUnits!==void 0&&(this.polygonOffsetUnits=e.polygonOffsetUnits),e.dithering!==void 0&&(this.dithering=e.dithering),e.alphaToCoverage!==void 0&&(this.alphaToCoverage=e.alphaToCoverage),e.premultipliedAlpha!==void 0&&(this.premultipliedAlpha=e.premultipliedAlpha),e.forceSinglePass!==void 0&&(this.forceSinglePass=e.forceSinglePass),e.allowOverride!==void 0&&(this.allowOverride=e.allowOverride),e.visible!==void 0&&(this.visible=e.visible),e.toneMapped!==void 0&&(this.toneMapped=e.toneMapped),e.userData!==void 0&&(this.userData=e.userData),e.vertexColors!==void 0&&(typeof e.vertexColors=="number"?this.vertexColors=e.vertexColors>0:this.vertexColors=e.vertexColors),e.size!==void 0&&(this.size=e.size),e.sizeAttenuation!==void 0&&(this.sizeAttenuation=e.sizeAttenuation),e.map!==void 0&&(this.map=n[e.map]||null),e.matcap!==void 0&&(this.matcap=n[e.matcap]||null),e.alphaMap!==void 0&&(this.alphaMap=n[e.alphaMap]||null),e.bumpMap!==void 0&&(this.bumpMap=n[e.bumpMap]||null),e.bumpScale!==void 0&&(this.bumpScale=e.bumpScale),e.normalMap!==void 0&&(this.normalMap=n[e.normalMap]||null),e.normalMapType!==void 0&&(this.normalMapType=e.normalMapType),e.normalScale!==void 0){let i=e.normalScale;Array.isArray(i)===!1&&(i=[i,i]),this.normalScale=new je().fromArray(i)}return e.displacementMap!==void 0&&(this.displacementMap=n[e.displacementMap]||null),e.displacementScale!==void 0&&(this.displacementScale=e.displacementScale),e.displacementBias!==void 0&&(this.displacementBias=e.displacementBias),e.roughnessMap!==void 0&&(this.roughnessMap=n[e.roughnessMap]||null),e.metalnessMap!==void 0&&(this.metalnessMap=n[e.metalnessMap]||null),e.emissiveMap!==void 0&&(this.emissiveMap=n[e.emissiveMap]||null),e.emissiveIntensity!==void 0&&(this.emissiveIntensity=e.emissiveIntensity),e.specularMap!==void 0&&(this.specularMap=n[e.specularMap]||null),e.specularIntensityMap!==void 0&&(this.specularIntensityMap=n[e.specularIntensityMap]||null),e.specularColorMap!==void 0&&(this.specularColorMap=n[e.specularColorMap]||null),e.envMap!==void 0&&(this.envMap=n[e.envMap]||null),e.envMapRotation!==void 0&&this.envMapRotation.fromArray(e.envMapRotation),e.envMapIntensity!==void 0&&(this.envMapIntensity=e.envMapIntensity),e.reflectivity!==void 0&&(this.reflectivity=e.reflectivity),e.refractionRatio!==void 0&&(this.refractionRatio=e.refractionRatio),e.lightMap!==void 0&&(this.lightMap=n[e.lightMap]||null),e.lightMapIntensity!==void 0&&(this.lightMapIntensity=e.lightMapIntensity),e.aoMap!==void 0&&(this.aoMap=n[e.aoMap]||null),e.aoMapIntensity!==void 0&&(this.aoMapIntensity=e.aoMapIntensity),e.gradientMap!==void 0&&(this.gradientMap=n[e.gradientMap]||null),e.clearcoatMap!==void 0&&(this.clearcoatMap=n[e.clearcoatMap]||null),e.clearcoatRoughnessMap!==void 0&&(this.clearcoatRoughnessMap=n[e.clearcoatRoughnessMap]||null),e.clearcoatNormalMap!==void 0&&(this.clearcoatNormalMap=n[e.clearcoatNormalMap]||null),e.clearcoatNormalScale!==void 0&&(this.clearcoatNormalScale=new je().fromArray(e.clearcoatNormalScale)),e.iridescenceMap!==void 0&&(this.iridescenceMap=n[e.iridescenceMap]||null),e.iridescenceThicknessMap!==void 0&&(this.iridescenceThicknessMap=n[e.iridescenceThicknessMap]||null),e.transmissionMap!==void 0&&(this.transmissionMap=n[e.transmissionMap]||null),e.thicknessMap!==void 0&&(this.thicknessMap=n[e.thicknessMap]||null),e.anisotropyMap!==void 0&&(this.anisotropyMap=n[e.anisotropyMap]||null),e.sheenColorMap!==void 0&&(this.sheenColorMap=n[e.sheenColorMap]||null),e.sheenRoughnessMap!==void 0&&(this.sheenRoughnessMap=n[e.sheenRoughnessMap]||null),this}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.blendColor.copy(e.blendColor),this.blendAlpha=e.blendAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;const n=e.clippingPlanes;let i=null;if(n!==null){const r=n.length;i=new Array(r);for(let s=0;s!==r;++s)i[s]=n[s].clone()}return this.clippingPlanes=i,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaHash=e.alphaHash,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.allowOverride=e.allowOverride,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(e){e===!0&&this.version++}}const gr=new D,Rd=new D,Bl=new D,zl=new D;class Mu{constructor(e=new D,n=new D(0,0,-1)){this.origin=e,this.direction=n}set(e,n){return this.origin.copy(e),this.direction.copy(n),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,n){return n.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,gr)),this}closestPointToPoint(e,n){n.subVectors(e,this.origin);const i=n.dot(this.direction);return i<0?n.copy(this.origin):n.copy(this.origin).addScaledVector(this.direction,i)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){const n=gr.subVectors(e,this.origin).dot(this.direction);return n<0?this.origin.distanceToSquared(e):(gr.copy(this.origin).addScaledVector(this.direction,n),gr.distanceToSquared(e))}distanceSqToSegment(e,n,i,r){Rd.copy(e).add(n).multiplyScalar(.5),Bl.copy(n).sub(e).normalize(),zl.copy(this.origin).sub(Rd);const s=e.distanceTo(n)*.5,a=-this.direction.dot(Bl),o=zl.dot(this.direction),l=-zl.dot(Bl),c=zl.lengthSq(),h=Math.abs(1-a*a);let p,f,g,v;if(h>0)if(p=a*l-o,f=a*o-l,v=s*h,p>=0)if(f>=-v)if(f<=v){const E=1/h;p*=E,f*=E,g=p*(p+a*f+2*o)+f*(a*p+f+2*l)+c}else f=s,p=Math.max(0,-(a*f+o)),g=-p*p+f*(f+2*l)+c;else f=-s,p=Math.max(0,-(a*f+o)),g=-p*p+f*(f+2*l)+c;else f<=-v?(p=Math.max(0,-(-a*s+o)),f=p>0?-s:Math.min(Math.max(-s,-l),s),g=-p*p+f*(f+2*l)+c):f<=v?(p=0,f=Math.min(Math.max(-s,-l),s),g=f*(f+2*l)+c):(p=Math.max(0,-(a*s+o)),f=p>0?s:Math.min(Math.max(-s,-l),s),g=-p*p+f*(f+2*l)+c);else f=a>0?-s:s,p=Math.max(0,-(a*f+o)),g=-p*p+f*(f+2*l)+c;return i&&i.copy(this.origin).addScaledVector(this.direction,p),r&&r.copy(Rd).addScaledVector(Bl,f),g}intersectSphere(e,n){if(e.radius<0)return null;gr.subVectors(e.center,this.origin);const i=gr.dot(this.direction),r=gr.dot(gr)-i*i,s=e.radius*e.radius;if(r>s)return null;const a=Math.sqrt(s-r),o=i-a,l=i+a;return l<0?null:o<0?this.at(l,n):this.at(o,n)}intersectsSphere(e){return e.radius<0?!1:this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){const n=e.normal.dot(this.direction);if(n===0)return e.distanceToPoint(this.origin)===0?0:null;const i=-(this.origin.dot(e.normal)+e.constant)/n;return i>=0?i:null}intersectPlane(e,n){const i=this.distanceToPlane(e);return i===null?null:this.at(i,n)}intersectsPlane(e){const n=e.distanceToPoint(this.origin);return n===0||e.normal.dot(this.direction)*n<0}intersectBox(e,n){let i,r,s,a,o,l;const c=1/this.direction.x,h=1/this.direction.y,p=1/this.direction.z,f=this.origin;return c>=0?(i=(e.min.x-f.x)*c,r=(e.max.x-f.x)*c):(i=(e.max.x-f.x)*c,r=(e.min.x-f.x)*c),h>=0?(s=(e.min.y-f.y)*h,a=(e.max.y-f.y)*h):(s=(e.max.y-f.y)*h,a=(e.min.y-f.y)*h),i>a||s>r||((s>i||isNaN(i))&&(i=s),(a<r||isNaN(r))&&(r=a),p>=0?(o=(e.min.z-f.z)*p,l=(e.max.z-f.z)*p):(o=(e.max.z-f.z)*p,l=(e.min.z-f.z)*p),i>l||o>r)||((o>i||i!==i)&&(i=o),(l<r||r!==r)&&(r=l),r<0)?null:this.at(i>=0?i:r,n)}intersectsBox(e){return this.intersectBox(e,gr)!==null}intersectTriangle(e,n,i,r,s){const a=this.origin,o=this.direction,l=o.x,c=o.y,h=o.z,p=e.x-a.x,f=e.y-a.y,g=e.z-a.z,v=n.x-a.x,E=n.y-a.y,_=n.z-a.z,u=i.x-a.x,m=i.y-a.y,M=i.z-a.z,y=Math.abs(l),T=Math.abs(c),w=Math.abs(h);let R,x,A,P,L,B,F,I,j,N,H,V;if(y>=T&&y>=w?(A=l,B=p,j=v,V=u,l>=0?(R=c,x=h,P=f,L=g,F=E,I=_,N=m,H=M):(R=h,x=c,P=g,L=f,F=_,I=E,N=M,H=m)):T>=w?(A=c,B=f,j=E,V=m,c>=0?(R=h,x=l,P=g,L=p,F=_,I=v,N=M,H=u):(R=l,x=h,P=p,L=g,F=v,I=_,N=u,H=M)):(A=h,B=g,j=_,V=M,h>=0?(R=l,x=c,P=p,L=f,F=v,I=E,N=u,H=m):(R=c,x=l,P=f,L=p,F=E,I=v,N=m,H=u)),A===0)return null;const G=R/A,X=x/A,ne=1/A,ve=P-G*B,Pe=L-X*B,Je=F-G*j,$e=I-X*j,Ke=N-G*V,Z=H-X*V,J=Ke*$e-Z*Je,Ne=ve*Z-Pe*Ke,We=Je*Pe-$e*ve;if(r){if(J<0||Ne<0||We<0)return null}else if((J<0||Ne<0||We<0)&&(J>0||Ne>0||We>0))return null;const Re=J+Ne+We;if(Re===0)return null;const Ze=ne*(J*B+Ne*j+We*V);return(Re>0?Ze<0:Ze>0)?null:this.at(Ze/Re,s)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}}class Qc extends ja{constructor(e){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new dt(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new cs,this.combine=Zv,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}}const I0=new kt,xs=new Mu,Hl=new Su,U0=new D,Vl=new D,Gl=new D,Wl=new D,Cd=new D,jl=new D,F0=new D,Xl=new D;class ze extends hn{constructor(e=new qn,n=new Qc){super(),this.isMesh=!0,this.type="Mesh",this.geometry=e,this.material=n,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.count=1,this.updateMorphTargets()}copy(e,n){return super.copy(e,n),e.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=e.morphTargetInfluences.slice()),e.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary)),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}updateMorphTargets(){const n=this.geometry.morphAttributes,i=Object.keys(n);if(i.length>0){const r=n[i[0]];if(r!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let s=0,a=r.length;s<a;s++){const o=r[s].name||String(s);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=s}}}}getVertexPosition(e,n){const i=this.geometry,r=i.attributes.position,s=i.morphAttributes.position,a=i.morphTargetsRelative;n.fromBufferAttribute(r,e);const o=this.morphTargetInfluences;if(s&&o){jl.set(0,0,0);for(let l=0,c=s.length;l<c;l++){const h=o[l],p=s[l];h!==0&&(Cd.fromBufferAttribute(p,e),a?jl.addScaledVector(Cd,h):jl.addScaledVector(Cd.sub(n),h))}n.add(jl)}return n}intersectsFrustum(e){return e.intersectsObject(this)}raycast(e,n){const i=this.geometry,r=this.material,s=this.matrixWorld;r!==void 0&&(i.boundingSphere===null&&i.computeBoundingSphere(),Hl.copy(i.boundingSphere),Hl.applyMatrix4(s),xs.copy(e.ray).recast(e.near),!(Hl.containsPoint(xs.origin)===!1&&(xs.intersectSphere(Hl,U0)===null||xs.origin.distanceToSquared(U0)>(e.far-e.near)**2))&&(I0.copy(s).invert(),xs.copy(e.ray).applyMatrix4(I0),!(i.boundingBox!==null&&xs.intersectsBox(i.boundingBox)===!1)&&this._computeIntersections(e,n,xs)))}_computeIntersections(e,n,i){let r;const s=this.geometry,a=this.material,o=s.index,l=s.attributes.position,c=s.attributes.uv,h=s.attributes.uv1,p=s.attributes.normal,f=s.groups,g=s.drawRange;if(o!==null)if(Array.isArray(a))for(let v=0,E=f.length;v<E;v++){const _=f[v],u=a[_.materialIndex],m=Math.max(_.start,g.start),M=Math.min(o.count,Math.min(_.start+_.count,g.start+g.count));for(let y=m,T=M;y<T;y+=3){const w=o.getX(y),R=o.getX(y+1),x=o.getX(y+2);r=$l(this,u,e,i,c,h,p,w,R,x),r&&(r.faceIndex=Math.floor(y/3),r.face.materialIndex=_.materialIndex,n.push(r))}}else{const v=Math.max(0,g.start),E=Math.min(o.count,g.start+g.count);for(let _=v,u=E;_<u;_+=3){const m=o.getX(_),M=o.getX(_+1),y=o.getX(_+2);r=$l(this,a,e,i,c,h,p,m,M,y),r&&(r.faceIndex=Math.floor(_/3),n.push(r))}}else if(l!==void 0)if(Array.isArray(a))for(let v=0,E=f.length;v<E;v++){const _=f[v],u=a[_.materialIndex],m=Math.max(_.start,g.start),M=Math.min(l.count,Math.min(_.start+_.count,g.start+g.count));for(let y=m,T=M;y<T;y+=3){const w=y,R=y+1,x=y+2;r=$l(this,u,e,i,c,h,p,w,R,x),r&&(r.faceIndex=Math.floor(y/3),r.face.materialIndex=_.materialIndex,n.push(r))}}else{const v=Math.max(0,g.start),E=Math.min(l.count,g.start+g.count);for(let _=v,u=E;_<u;_+=3){const m=_,M=_+1,y=_+2;r=$l(this,a,e,i,c,h,p,m,M,y),r&&(r.faceIndex=Math.floor(_/3),n.push(r))}}}}function zE(t,e,n,i,r,s,a,o){let l;if(e.side===$n?l=i.intersectTriangle(a,s,r,!0,o):l=i.intersectTriangle(r,s,a,e.side===Fs,o),l===null)return null;Xl.copy(o),Xl.applyMatrix4(t.matrixWorld);const c=n.ray.origin.distanceTo(Xl);return c<n.near||c>n.far?null:{distance:c,point:Xl.clone(),object:t}}function $l(t,e,n,i,r,s,a,o,l,c){t.getVertexPosition(o,Vl),t.getVertexPosition(l,Gl),t.getVertexPosition(c,Wl);const h=zE(t,e,n,i,Vl,Gl,Wl,F0);if(h){const p=new D;mi.getBarycoord(F0,Vl,Gl,Wl,p),r&&(h.uv=mi.getInterpolatedAttribute(r,o,l,c,p,new je)),s&&(h.uv1=mi.getInterpolatedAttribute(s,o,l,c,p,new je)),a&&(h.normal=mi.getInterpolatedAttribute(a,o,l,c,p,new D),h.normal.dot(i.direction)>0&&h.normal.multiplyScalar(-1));const f={a:o,b:l,c,normal:new D,materialIndex:0};mi.getNormal(Vl,Gl,Wl,f.normal),h.face=f,h.barycoord=p}return h}class HE extends bn{constructor(e=null,n=1,i=1,r,s,a,o,l,c=gn,h=gn,p,f){super(null,a,o,l,c,h,r,s,p,f),this.isDataTexture=!0,this.image={data:e,width:n,height:i},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}const ys=new Su,VE=new je(.5,.5),ql=new D;class Up{constructor(e=new xr,n=new xr,i=new xr,r=new xr,s=new xr,a=new xr){this.planes=[e,n,i,r,s,a]}set(e,n,i,r,s,a){const o=this.planes;return o[0].copy(e),o[1].copy(n),o[2].copy(i),o[3].copy(r),o[4].copy(s),o[5].copy(a),this}copy(e){const n=this.planes;for(let i=0;i<6;i++)n[i].copy(e.planes[i]);return this}setFromProjectionMatrix(e,n=nr,i=!1){const r=this.planes,s=e.elements,a=s[0],o=s[1],l=s[2],c=s[3],h=s[4],p=s[5],f=s[6],g=s[7],v=s[8],E=s[9],_=s[10],u=s[11],m=s[12],M=s[13],y=s[14],T=s[15];if(r[0].setComponents(c-a,g-h,u-v,T-m).normalize(),r[1].setComponents(c+a,g+h,u+v,T+m).normalize(),r[2].setComponents(c+o,g+p,u+E,T+M).normalize(),r[3].setComponents(c-o,g-p,u-E,T-M).normalize(),i)r[4].setComponents(l,f,_,y).normalize(),r[5].setComponents(c-l,g-f,u-_,T-y).normalize();else if(r[4].setComponents(c-l,g-f,u-_,T-y).normalize(),n===nr)r[5].setComponents(c+l,g+f,u+_,T+y).normalize();else if(n===nl)r[5].setComponents(l,f,_,y).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+n);return this}intersectsObject(e){if(e.boundingSphere!==void 0)e.boundingSphere===null&&e.computeBoundingSphere(),ys.copy(e.boundingSphere).applyMatrix4(e.matrixWorld);else{const n=e.geometry;n.boundingSphere===null&&n.computeBoundingSphere(),ys.copy(n.boundingSphere).applyMatrix4(e.matrixWorld)}return this.intersectsSphere(ys)}intersectsSprite(e){ys.center.set(0,0,0);const n=VE.distanceTo(e.center);return ys.radius=.7071067811865476+n,ys.applyMatrix4(e.matrixWorld),this.intersectsSphere(ys)}intersectsSphere(e){const n=this.planes,i=e.center,r=-e.radius;for(let s=0;s<6;s++)if(n[s].distanceToPoint(i)<r)return!1;return!0}intersectsBox(e){const n=this.planes;for(let i=0;i<6;i++){const r=n[i];if(ql.x=r.normal.x>0?e.max.x:e.min.x,ql.y=r.normal.y>0?e.max.y:e.min.y,ql.z=r.normal.z>0?e.max.z:e.min.z,r.distanceToPoint(ql)<0)return!1}return!0}containsPoint(e){const n=this.planes;for(let i=0;i<6;i++)if(n[i].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}}class vx extends ja{constructor(e){super(),this.isLineBasicMaterial=!0,this.type="LineBasicMaterial",this.color=new dt(16777215),this.map=null,this.linewidth=1,this.linecap="round",this.linejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.linewidth=e.linewidth,this.linecap=e.linecap,this.linejoin=e.linejoin,this.fog=e.fog,this}}const Jc=new D,eu=new D,O0=new kt,po=new Mu,Yl=new Su,Pd=new D,k0=new D;class GE extends hn{constructor(e=new qn,n=new vx){super(),this.isLine=!0,this.type="Line",this.geometry=e,this.material=n,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(e,n){return super.copy(e,n),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}computeLineDistances(){const e=this.geometry;if(e.index===null){const n=e.attributes.position,i=[0];for(let r=1,s=n.count;r<s;r++)Jc.fromBufferAttribute(n,r-1),eu.fromBufferAttribute(n,r),i[r]=i[r-1],i[r]+=Jc.distanceTo(eu);e.setAttribute("lineDistance",new Zt(i,1))}else Ge("Line.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}intersectsFrustum(e){return e.intersectsObject(this)}raycast(e,n){const i=this.geometry,r=this.matrixWorld,s=e.params.Line.threshold,a=i.drawRange;if(i.boundingSphere===null&&i.computeBoundingSphere(),Yl.copy(i.boundingSphere),Yl.applyMatrix4(r),Yl.radius+=s,e.ray.intersectsSphere(Yl)===!1)return;O0.copy(r).invert(),po.copy(e.ray).applyMatrix4(O0);const o=s/((this.scale.x+this.scale.y+this.scale.z)/3),l=o*o,c=this.isLineSegments?2:1,h=i.index,f=i.attributes.position;if(h!==null){const g=Math.max(0,a.start),v=Math.min(h.count,a.start+a.count);for(let E=g,_=v-1;E<_;E+=c){const u=h.getX(E),m=h.getX(E+1),M=Kl(this,e,po,l,u,m,E);M&&n.push(M)}if(this.isLineLoop){const E=h.getX(v-1),_=h.getX(g),u=Kl(this,e,po,l,E,_,v-1);u&&n.push(u)}}else{const g=Math.max(0,a.start),v=Math.min(f.count,a.start+a.count);for(let E=g,_=v-1;E<_;E+=c){const u=Kl(this,e,po,l,E,E+1,E);u&&n.push(u)}if(this.isLineLoop){const E=Kl(this,e,po,l,v-1,g,v-1);E&&n.push(E)}}}updateMorphTargets(){const n=this.geometry.morphAttributes,i=Object.keys(n);if(i.length>0){const r=n[i[0]];if(r!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let s=0,a=r.length;s<a;s++){const o=r[s].name||String(s);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=s}}}}}function Kl(t,e,n,i,r,s,a){const o=t.geometry.attributes.position;if(Jc.fromBufferAttribute(o,r),eu.fromBufferAttribute(o,s),n.distanceSqToSegment(Jc,eu,Pd,k0)>i)return;Pd.applyMatrix4(t.matrixWorld);const c=e.ray.origin.distanceTo(Pd);if(!(c<e.near||c>e.far))return{distance:c,point:k0.clone().applyMatrix4(t.matrixWorld),index:a,face:null,faceIndex:null,barycoord:null,object:t}}const B0=new D,z0=new D;class WE extends GE{constructor(e,n){super(e,n),this.isLineSegments=!0,this.type="LineSegments"}computeLineDistances(){const e=this.geometry;if(e.index===null){const n=e.attributes.position,i=[];for(let r=0,s=n.count;r<s;r+=2)B0.fromBufferAttribute(n,r),z0.fromBufferAttribute(n,r+1),i[r]=r===0?0:i[r-1],i[r+1]=i[r]+B0.distanceTo(z0);e.setAttribute("lineDistance",new Zt(i,1))}else Ge("LineSegments.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}}class xx extends bn{constructor(e=[],n=Os,i,r,s,a,o,l,c,h){super(e,n,i,r,s,a,o,l,c,h),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}}class jE extends bn{constructor(e,n,i,r,s,a,o,l,c){super(e,n,i,r,s,a,o,l,c),this.isCanvasTexture=!0,this.needsUpdate=!0}}class il extends bn{constructor(e,n,i=ar,r,s,a,o=gn,l=gn,c,h=Nr,p=1){if(h!==Nr&&h!==Rs)throw new Error("THREE.DepthTexture: format must be either THREE.DepthFormat or THREE.DepthStencilFormat");const f={width:e,height:n,depth:p};super(f,r,s,a,o,l,h,i,c),this.isDepthTexture=!0,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(e){return super.copy(e),this.source=new Lp(Object.assign({},e.image)),this.compareFunction=e.compareFunction,this}toJSON(e){const n=super.toJSON(e);return n.compareFunction=this.compareFunction,n}}class XE extends il{constructor(e,n=ar,i=Os,r,s,a=gn,o=gn,l,c=Nr){const h={width:e,height:e,depth:1},p=[h,h,h,h,h,h];super(e,e,n,i,r,s,a,o,l,c),this.image=p,this.isCubeDepthTexture=!0,this.isCubeTexture=!0}get images(){return this.image}set images(e){this.image=e}}class yx extends bn{constructor(e=null){super(),this.sourceTexture=e,this.isExternalTexture=!0}copy(e){return super.copy(e),this.sourceTexture=e.sourceTexture,this}}class Ft extends qn{constructor(e=1,n=1,i=1,r=1,s=1,a=1){super(),this.type="BoxGeometry",this.parameters={width:e,height:n,depth:i,widthSegments:r,heightSegments:s,depthSegments:a};const o=this;r=Math.floor(r),s=Math.floor(s),a=Math.floor(a);const l=[],c=[],h=[],p=[];let f=0,g=0;v("z","y","x",-1,-1,i,n,e,a,s,0),v("z","y","x",1,-1,i,n,-e,a,s,1),v("x","z","y",1,1,e,i,n,r,a,2),v("x","z","y",1,-1,e,i,-n,r,a,3),v("x","y","z",1,-1,e,n,i,r,s,4),v("x","y","z",-1,-1,e,n,-i,r,s,5),this.setIndex(l),this.setAttribute("position",new Zt(c,3)),this.setAttribute("normal",new Zt(h,3)),this.setAttribute("uv",new Zt(p,2));function v(E,_,u,m,M,y,T,w,R,x,A){const P=y/R,L=T/x,B=y/2,F=T/2,I=w/2,j=R+1,N=x+1;let H=0,V=0;const G=new D;for(let X=0;X<N;X++){const ne=X*L-F;for(let ve=0;ve<j;ve++){const Pe=ve*P-B;G[E]=Pe*m,G[_]=ne*M,G[u]=I,c.push(G.x,G.y,G.z),G[E]=0,G[_]=0,G[u]=w>0?1:-1,h.push(G.x,G.y,G.z),p.push(ve/R),p.push(1-X/x),H+=1}}for(let X=0;X<x;X++)for(let ne=0;ne<R;ne++){const ve=f+ne+j*X,Pe=f+ne+j*(X+1),Je=f+(ne+1)+j*(X+1),$e=f+(ne+1)+j*X;l.push(ve,Pe,$e),l.push(Pe,Je,$e),V+=6}o.addGroup(g,V,A),g+=V,f+=H}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new Ft(e.width,e.height,e.depth,e.widthSegments,e.heightSegments,e.depthSegments)}}class It extends qn{constructor(e=1,n=1,i=1,r=32,s=1,a=!1,o=0,l=Math.PI*2){super(),this.type="CylinderGeometry",this.parameters={radiusTop:e,radiusBottom:n,height:i,radialSegments:r,heightSegments:s,openEnded:a,thetaStart:o,thetaLength:l};const c=this;r=Math.floor(r),s=Math.floor(s);const h=[],p=[],f=[],g=[];let v=0;const E=[],_=i/2;let u=0;m(),a===!1&&(e>0&&M(!0),n>0&&M(!1)),this.setIndex(h),this.setAttribute("position",new Zt(p,3)),this.setAttribute("normal",new Zt(f,3)),this.setAttribute("uv",new Zt(g,2));function m(){const y=new D,T=new D;let w=0;const R=(n-e)/i;for(let x=0;x<=s;x++){const A=[],P=x/s,L=P*(n-e)+e;for(let B=0;B<=r;B++){const F=B/r,I=F*l+o,j=Math.sin(I),N=Math.cos(I);T.x=L*j,T.y=-P*i+_,T.z=L*N,p.push(T.x,T.y,T.z),y.set(j,R,N).normalize(),f.push(y.x,y.y,y.z),g.push(F,1-P),A.push(v++)}E.push(A)}for(let x=0;x<r;x++)for(let A=0;A<s;A++){const P=E[A][x],L=E[A+1][x],B=E[A+1][x+1],F=E[A][x+1];(e>0||A!==0)&&(h.push(P,L,F),w+=3),(n>0||A!==s-1)&&(h.push(L,B,F),w+=3)}c.addGroup(u,w,0),u+=w}function M(y){const T=v,w=new je,R=new D;let x=0;const A=y===!0?e:n,P=y===!0?1:-1;for(let B=1;B<=r;B++)p.push(0,_*P,0),f.push(0,P,0),g.push(.5,.5),v++;const L=v;for(let B=0;B<=r;B++){const I=B/r*l+o,j=Math.cos(I),N=Math.sin(I);R.x=A*N,R.y=_*P,R.z=A*j,p.push(R.x,R.y,R.z),f.push(0,P,0),w.x=j*.5+.5,w.y=N*.5*P+.5,g.push(w.x,w.y),v++}for(let B=0;B<r;B++){const F=T+B,I=L+B;y===!0?h.push(I,I+1,F):h.push(I+1,I,F),x+=3}c.addGroup(u,x,y===!0?1:2),u+=x}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new It(e.radiusTop,e.radiusBottom,e.height,e.radialSegments,e.heightSegments,e.openEnded,e.thetaStart,e.thetaLength)}}class Fp extends It{constructor(e=1,n=1,i=32,r=1,s=!1,a=0,o=Math.PI*2){super(0,e,n,i,r,s,a,o),this.type="ConeGeometry",this.parameters={radius:e,height:n,radialSegments:i,heightSegments:r,openEnded:s,thetaStart:a,thetaLength:o}}static fromJSON(e){return new Fp(e.radius,e.height,e.radialSegments,e.heightSegments,e.openEnded,e.thetaStart,e.thetaLength)}}const Zl=new D,Ql=new D,Nd=new D,Jl=new mi;class $E extends qn{constructor(e=null,n=1){if(super(),this.type="EdgesGeometry",this.parameters={geometry:e,thresholdAngle:n},e!==null){const r=Math.pow(10,4),s=Math.cos(Uo*n),a=e.getIndex(),o=e.getAttribute("position"),l=a?a.count:o.count,c=[0,0,0],h=["a","b","c"],p=new Array(3),f={},g=[];for(let v=0;v<l;v+=3){a?(c[0]=a.getX(v),c[1]=a.getX(v+1),c[2]=a.getX(v+2)):(c[0]=v,c[1]=v+1,c[2]=v+2);const{a:E,b:_,c:u}=Jl;if(E.fromBufferAttribute(o,c[0]),_.fromBufferAttribute(o,c[1]),u.fromBufferAttribute(o,c[2]),Jl.getNormal(Nd),p[0]=`${Math.round(E.x*r)},${Math.round(E.y*r)},${Math.round(E.z*r)}`,p[1]=`${Math.round(_.x*r)},${Math.round(_.y*r)},${Math.round(_.z*r)}`,p[2]=`${Math.round(u.x*r)},${Math.round(u.y*r)},${Math.round(u.z*r)}`,!(p[0]===p[1]||p[1]===p[2]||p[2]===p[0]))for(let m=0;m<3;m++){const M=(m+1)%3,y=p[m],T=p[M],w=Jl[h[m]],R=Jl[h[M]],x=`${y}_${T}`,A=`${T}_${y}`;A in f&&f[A]?(Nd.dot(f[A].normal)<=s&&(g.push(w.x,w.y,w.z),g.push(R.x,R.y,R.z)),f[A]=null):x in f||(f[x]={index0:c[m],index1:c[M],normal:Nd.clone()})}}for(const v in f)if(f[v]){const{index0:E,index1:_}=f[v];Zl.fromBufferAttribute(o,E),Ql.fromBufferAttribute(o,_),g.push(Zl.x,Zl.y,Zl.z),g.push(Ql.x,Ql.y,Ql.z)}this.setAttribute("position",new Zt(g,3))}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}}class za extends qn{constructor(e=1,n=1,i=1,r=1){super(),this.type="PlaneGeometry",this.parameters={width:e,height:n,widthSegments:i,heightSegments:r};const s=e/2,a=n/2,o=Math.floor(i),l=Math.floor(r),c=o+1,h=l+1,p=e/o,f=n/l,g=[],v=[],E=[],_=[];for(let u=0;u<h;u++){const m=u*f-a;for(let M=0;M<c;M++){const y=M*p-s;v.push(y,-m,0),E.push(0,0,1),_.push(M/o),_.push(1-u/l)}}for(let u=0;u<l;u++)for(let m=0;m<o;m++){const M=m+c*u,y=m+c*(u+1),T=m+1+c*(u+1),w=m+1+c*u;g.push(M,y,w),g.push(y,T,w)}this.setIndex(g),this.setAttribute("position",new Zt(v,3)),this.setAttribute("normal",new Zt(E,3)),this.setAttribute("uv",new Zt(_,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new za(e.width,e.height,e.widthSegments,e.heightSegments)}}class Op extends qn{constructor(e=1,n=32,i=16,r=0,s=Math.PI*2,a=0,o=Math.PI){super(),this.type="SphereGeometry",this.parameters={radius:e,widthSegments:n,heightSegments:i,phiStart:r,phiLength:s,thetaStart:a,thetaLength:o},n=Math.max(3,Math.floor(n)),i=Math.max(2,Math.floor(i));const l=Math.min(a+o,Math.PI);let c=0;const h=[],p=new D,f=new D,g=[],v=[],E=[],_=[];for(let u=0;u<=i;u++){const m=[],M=u/i,y=a+M*o,T=e*Math.cos(y),w=Math.sqrt(e*e-T*T);let R=0;u===0&&a===0?R=.5/n:u===i&&l===Math.PI&&(R=-.5/n);for(let x=0;x<=n;x++){const A=x/n,P=r+A*s;p.x=-w*Math.cos(P),p.y=T,p.z=w*Math.sin(P),v.push(p.x,p.y,p.z),f.copy(p).normalize(),E.push(f.x,f.y,f.z),_.push(A+R,1-M),m.push(c++)}h.push(m)}for(let u=0;u<i;u++)for(let m=0;m<n;m++){const M=h[u][m+1],y=h[u][m],T=h[u+1][m],w=h[u+1][m+1];(u!==0||a>0)&&g.push(M,y,w),(u!==i-1||l<Math.PI)&&g.push(y,T,w)}this.setIndex(g),this.setAttribute("position",new Zt(v,3)),this.setAttribute("normal",new Zt(E,3)),this.setAttribute("uv",new Zt(_,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new Op(e.radius,e.widthSegments,e.heightSegments,e.phiStart,e.phiLength,e.thetaStart,e.thetaLength)}}class tu extends qn{constructor(e=1,n=.4,i=12,r=48,s=Math.PI*2,a=0,o=Math.PI*2){super(),this.type="TorusGeometry",this.parameters={radius:e,tube:n,radialSegments:i,tubularSegments:r,arc:s,thetaStart:a,thetaLength:o},i=Math.floor(i),r=Math.floor(r);const l=[],c=[],h=[],p=[],f=new D,g=new D,v=new D;for(let E=0;E<=i;E++){const _=a+E/i*o;for(let u=0;u<=r;u++){const m=u/r*s;g.x=(e+n*Math.cos(_))*Math.cos(m),g.y=(e+n*Math.cos(_))*Math.sin(m),g.z=n*Math.sin(_),c.push(g.x,g.y,g.z),f.x=e*Math.cos(m),f.y=e*Math.sin(m),v.subVectors(g,f).normalize(),h.push(v.x,v.y,v.z),p.push(u/r),p.push(E/i)}}for(let E=1;E<=i;E++)for(let _=1;_<=r;_++){const u=(r+1)*E+_-1,m=(r+1)*(E-1)+_-1,M=(r+1)*(E-1)+_,y=(r+1)*E+_;l.push(u,m,y),l.push(m,M,y)}this.setIndex(l),this.setAttribute("position",new Zt(c,3)),this.setAttribute("normal",new Zt(h,3)),this.setAttribute("uv",new Zt(p,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new tu(e.radius,e.tube,e.radialSegments,e.tubularSegments,e.arc,e.thetaStart,e.thetaLength)}}function Ha(t){const e={};for(const n in t){e[n]={};for(const i in t[n]){const r=t[n][i];if(H0(r))r.isRenderTargetTexture?(Ge("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),e[n][i]=null):e[n][i]=r.clone();else if(Array.isArray(r))if(H0(r[0])){const s=[];for(let a=0,o=r.length;a<o;a++)s[a]=r[a].clone();e[n][i]=s}else e[n][i]=r.slice();else e[n][i]=r}}return e}function Pn(t){const e={};for(let n=0;n<t.length;n++){const i=Ha(t[n]);for(const r in i)e[r]=i[r]}return e}function H0(t){return t&&(t.isColor||t.isMatrix3||t.isMatrix4||t.isVector2||t.isVector3||t.isVector4||t.isTexture||t.isQuaternion)}function qE(t){const e=[];for(let n=0;n<t.length;n++)e.push(t[n].clone());return e}function Sx(t){const e=t.getRenderTarget();return e===null?t.outputColorSpace:e.isXRRenderTarget===!0?e.texture.colorSpace:ft.workingColorSpace}const YE={clone:Ha,merge:Pn};var KE=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,ZE=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`;class lr extends ja{constructor(e){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=KE,this.fragmentShader=ZE,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0&&this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=Ha(e.uniforms),this.uniformsGroups=qE(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this.defaultAttributeValues=Object.assign({},e.defaultAttributeValues),this.index0AttributeName=e.index0AttributeName,this.uniformsNeedUpdate=e.uniformsNeedUpdate,this}toJSON(e){const n=super.toJSON(e);n.glslVersion=this.glslVersion,n.uniforms={};for(const r in this.uniforms){const a=this.uniforms[r].value;a&&a.isTexture?n.uniforms[r]={type:"t",value:a.toJSON(e).uuid}:a&&a.isColor?n.uniforms[r]={type:"c",value:a.getHex()}:a&&a.isVector2?n.uniforms[r]={type:"v2",value:a.toArray()}:a&&a.isVector3?n.uniforms[r]={type:"v3",value:a.toArray()}:a&&a.isVector4?n.uniforms[r]={type:"v4",value:a.toArray()}:a&&a.isMatrix3?n.uniforms[r]={type:"m3",value:a.toArray()}:a&&a.isMatrix4?n.uniforms[r]={type:"m4",value:a.toArray()}:n.uniforms[r]={value:a}}Object.keys(this.defines).length>0&&(n.defines=this.defines),n.vertexShader=this.vertexShader,n.fragmentShader=this.fragmentShader,n.lights=this.lights,n.clipping=this.clipping;const i={};for(const r in this.extensions)this.extensions[r]===!0&&(i[r]=!0);return Object.keys(i).length>0&&(n.extensions=i),n}fromJSON(e,n){if(super.fromJSON(e,n),e.uniforms!==void 0)for(const i in e.uniforms){const r=e.uniforms[i];switch(this.uniforms[i]={},r.type){case"t":this.uniforms[i].value=n[r.value]||null;break;case"c":this.uniforms[i].value=new dt().setHex(r.value);break;case"v2":this.uniforms[i].value=new je().fromArray(r.value);break;case"v3":this.uniforms[i].value=new D().fromArray(r.value);break;case"v4":this.uniforms[i].value=new Gt().fromArray(r.value);break;case"m3":this.uniforms[i].value=new Ye().fromArray(r.value);break;case"m4":this.uniforms[i].value=new kt().fromArray(r.value);break;default:this.uniforms[i].value=r.value}}if(e.defines!==void 0&&(this.defines=e.defines),e.vertexShader!==void 0&&(this.vertexShader=e.vertexShader),e.fragmentShader!==void 0&&(this.fragmentShader=e.fragmentShader),e.glslVersion!==void 0&&(this.glslVersion=e.glslVersion),e.extensions!==void 0)for(const i in e.extensions)this.extensions[i]=e.extensions[i];return e.lights!==void 0&&(this.lights=e.lights),e.clipping!==void 0&&(this.clipping=e.clipping),this}}class QE extends lr{constructor(e){super(e),this.isRawShaderMaterial=!0,this.type="RawShaderMaterial"}}class at extends ja{constructor(e){super(),this.isMeshStandardMaterial=!0,this.type="MeshStandardMaterial",this.defines={STANDARD:""},this.color=new dt(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new dt(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=xh,this.normalScale=new je(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new cs,this.envMapIntensity=1,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.defines={STANDARD:""},this.color.copy(e.color),this.roughness=e.roughness,this.metalness=e.metalness,this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.roughnessMap=e.roughnessMap,this.metalnessMap=e.metalnessMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.envMapIntensity=e.envMapIntensity,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.flatShading=e.flatShading,this.fog=e.fog,this}}class JE extends ja{constructor(e){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=rE,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(e)}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}}class e1 extends ja{constructor(e){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e)}copy(e){return super.copy(e),this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}}class kp extends hn{constructor(e,n=1){super(),this.isLight=!0,this.type="Light",this.color=new dt(e),this.intensity=n}copy(e,n){return super.copy(e,n),this.color.copy(e.color),this.intensity=e.intensity,this}toJSON(e){const n=super.toJSON(e);return n.object.color=this.color.getHex(),n.object.intensity=this.intensity,n}}class t1 extends kp{constructor(e,n,i){super(e,i),this.isHemisphereLight=!0,this.type="HemisphereLight",this.position.copy(hn.DEFAULT_UP),this.updateMatrix(),this.groundColor=new dt(n)}copy(e,n){return super.copy(e,n),this.groundColor.copy(e.groundColor),this}toJSON(e){const n=super.toJSON(e);return n.object.groundColor=this.groundColor.getHex(),n}}const Ld=new kt,V0=new D,G0=new D;class Mx{constructor(e){this.camera=e,this.intensity=1,this.bias=0,this.biasNode=null,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new je(512,512),this.mapType=ti,this.map=null,this.mapPass=null,this.matrix=new kt,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new Up,this._frameExtents=new je(1,1),this._viewportCount=1,this._viewports=[new Gt(0,0,1,1)]}getViewportCount(){return this._viewportCount}getCamera(){return this.camera}getFrustum(){return this._frustum}updateMatrices(e){const n=this.camera;V0.setFromMatrixPosition(e.matrixWorld),n.position.copy(V0),G0.setFromMatrixPosition(e.target.matrixWorld),n.lookAt(G0),n.updateMatrixWorld(),this._updateMatrix(n,this.matrix,this._frustum)}_updateMatrix(e,n,i,r){Ld.multiplyMatrices(e.projectionMatrix,e.matrixWorldInverse),i.setFromProjectionMatrix(Ld,e.coordinateSystem,e.reversedDepth);const s=this._frameExtents,a=r?r.z/s.x:1,o=r?r.w/s.y:1,l=r?r.x/s.x:0,c=r?r.y/s.y:0;e.coordinateSystem===nl||e.reversedDepth?n.set(.5*a,0,0,.5*a+l,0,.5*o,0,.5*o+c,0,0,1,0,0,0,0,1):n.set(.5*a,0,0,.5*a+l,0,.5*o,0,.5*o+c,0,0,.5,.5,0,0,0,1),n.multiply(Ld)}getViewport(e){return this._viewports[e]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(e){return this.camera=e.camera.clone(),this.intensity=e.intensity,this.bias=e.bias,this.radius=e.radius,this.autoUpdate=e.autoUpdate,this.needsUpdate=e.needsUpdate,this.normalBias=e.normalBias,this.blurSamples=e.blurSamples,this.mapSize.copy(e.mapSize),this.biasNode=e.biasNode,this}clone(){return new this.constructor().copy(this)}toJSON(){const e={};return e.intensity=this.intensity,e.bias=this.bias,e.normalBias=this.normalBias,e.radius=this.radius,e.blurSamples=this.blurSamples,e.mapSize=this.mapSize.toArray(),e.camera=this.camera.toJSON(!1).object,delete e.camera.matrix,e}}const ec=new D,tc=new ls,qi=new D;class Ex extends hn{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new kt,this.projectionMatrix=new kt,this.projectionMatrixInverse=new kt,this.coordinateSystem=nr,this._reversedDepth=!1}get reversedDepth(){return this._reversedDepth}copy(e,n){return super.copy(e,n),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this.coordinateSystem=e.coordinateSystem,this}getWorldDirection(e){return super.getWorldDirection(e).negate()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorld.decompose(ec,tc,qi),qi.x===1&&qi.y===1&&qi.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(ec,tc,qi.set(1,1,1)).invert()}updateWorldMatrix(e,n,i=!1){super.updateWorldMatrix(e,n,i),this.matrixWorld.decompose(ec,tc,qi),qi.x===1&&qi.y===1&&qi.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(ec,tc,qi.set(1,1,1)).invert()}clone(){return new this.constructor().copy(this)}}const Gr=new D,W0=new je,j0=new je;class Jn extends Ex{constructor(e=50,n=1,i=.1,r=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=e,this.zoom=1,this.near=i,this.far=r,this.focus=10,this.aspect=n,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,n){return super.copy(e,n),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){const n=.5*this.getFilmHeight()/e;this.fov=yh*2*Math.atan(n),this.updateProjectionMatrix()}getFocalLength(){const e=Math.tan(Uo*.5*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return yh*2*Math.atan(Math.tan(Uo*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(e,n,i){Gr.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),n.set(Gr.x,Gr.y).multiplyScalar(-e/Gr.z),Gr.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),i.set(Gr.x,Gr.y).multiplyScalar(-e/Gr.z)}getViewSize(e,n){return this.getViewBounds(e,W0,j0),n.subVectors(j0,W0)}setViewOffset(e,n,i,r,s,a){this.aspect=e/n,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=n,this.view.offsetX=i,this.view.offsetY=r,this.view.width=s,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const e=this.near;let n=e*Math.tan(Uo*.5*this.fov)/this.zoom,i=2*n,r=this.aspect*i,s=-.5*r;const a=this.view;if(this.view!==null&&this.view.enabled){const l=a.fullWidth,c=a.fullHeight;s+=a.offsetX*r/l,n-=a.offsetY*i/c,r*=a.width/l,i*=a.height/c}const o=this.filmOffset;o!==0&&(s+=e*o/this.getFilmWidth()),this.projectionMatrix.makePerspective(s,s+r,n,n-i,e,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){const n=super.toJSON(e);return n.object.fov=this.fov,n.object.zoom=this.zoom,n.object.near=this.near,n.object.far=this.far,n.object.focus=this.focus,n.object.aspect=this.aspect,this.view!==null&&(n.object.view=Object.assign({},this.view)),n.object.filmGauge=this.filmGauge,n.object.filmOffset=this.filmOffset,n}}class n1 extends Mx{constructor(){super(new Jn(90,1,.5,500)),this.isPointLightShadow=!0}}class X0 extends kp{constructor(e,n,i=0,r=2){super(e,n),this.isPointLight=!0,this.type="PointLight",this.distance=i,this.decay=r,this.shadow=new n1}get power(){return this.intensity*4*Math.PI}set power(e){this.intensity=e/(4*Math.PI)}dispose(){super.dispose(),this.shadow.dispose()}copy(e,n){return super.copy(e,n),this.distance=e.distance,this.decay=e.decay,this.shadow=e.shadow.clone(),this}toJSON(e){const n=super.toJSON(e);return n.object.distance=this.distance,n.object.decay=this.decay,n.object.shadow=this.shadow.toJSON(),n}}class Bp extends Ex{constructor(e=-1,n=1,i=1,r=-1,s=.1,a=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=e,this.right=n,this.top=i,this.bottom=r,this.near=s,this.far=a,this.updateProjectionMatrix()}copy(e,n){return super.copy(e,n),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,n,i,r,s,a){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=n,this.view.offsetX=i,this.view.offsetY=r,this.view.width=s,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const e=(this.right-this.left)/(2*this.zoom),n=(this.top-this.bottom)/(2*this.zoom),i=(this.right+this.left)/2,r=(this.top+this.bottom)/2;let s=i-e,a=i+e,o=r+n,l=r-n;if(this.view!==null&&this.view.enabled){const c=(this.right-this.left)/this.view.fullWidth/this.zoom,h=(this.top-this.bottom)/this.view.fullHeight/this.zoom;s+=c*this.view.offsetX,a=s+c*this.view.width,o-=h*this.view.offsetY,l=o-h*this.view.height}this.projectionMatrix.makeOrthographic(s,a,o,l,this.near,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){const n=super.toJSON(e);return n.object.zoom=this.zoom,n.object.left=this.left,n.object.right=this.right,n.object.top=this.top,n.object.bottom=this.bottom,n.object.near=this.near,n.object.far=this.far,this.view!==null&&(n.object.view=Object.assign({},this.view)),n}}class i1 extends Mx{constructor(){super(new Bp(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}}class $0 extends kp{constructor(e,n){super(e,n),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(hn.DEFAULT_UP),this.updateMatrix(),this.target=new hn,this.shadow=new i1}dispose(){super.dispose(),this.shadow.dispose()}copy(e){return super.copy(e),this.target=e.target.clone(),this.shadow=e.shadow.clone(),this}toJSON(e){const n=super.toJSON(e);return n.object.shadow=this.shadow.toJSON(),n.object.target=this.target.uuid,n}}const na=-90,ia=1;class r1 extends hn{constructor(e,n,i){super(),this.type="CubeCamera",this.renderTarget=i,this.coordinateSystem=null,this.activeMipmapLevel=0;const r=new Jn(na,ia,e,n);r.layers=this.layers,this.add(r);const s=new Jn(na,ia,e,n);s.layers=this.layers,this.add(s);const a=new Jn(na,ia,e,n);a.layers=this.layers,this.add(a);const o=new Jn(na,ia,e,n);o.layers=this.layers,this.add(o);const l=new Jn(na,ia,e,n);l.layers=this.layers,this.add(l);const c=new Jn(na,ia,e,n);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){const e=this.coordinateSystem,n=this.children.concat(),[i,r,s,a,o,l]=n;for(const c of n)this.remove(c);if(e===nr)i.up.set(0,1,0),i.lookAt(1,0,0),r.up.set(0,1,0),r.lookAt(-1,0,0),s.up.set(0,0,-1),s.lookAt(0,1,0),a.up.set(0,0,1),a.lookAt(0,-1,0),o.up.set(0,1,0),o.lookAt(0,0,1),l.up.set(0,1,0),l.lookAt(0,0,-1);else if(e===nl)i.up.set(0,-1,0),i.lookAt(-1,0,0),r.up.set(0,-1,0),r.lookAt(1,0,0),s.up.set(0,0,1),s.lookAt(0,1,0),a.up.set(0,0,-1),a.lookAt(0,-1,0),o.up.set(0,-1,0),o.lookAt(0,0,1),l.up.set(0,-1,0),l.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+e);for(const c of n)this.add(c),c.updateMatrixWorld()}update(e,n){this.parent===null&&this.updateMatrixWorld();const{renderTarget:i,activeMipmapLevel:r}=this;this.coordinateSystem!==e.coordinateSystem&&(this.coordinateSystem=e.coordinateSystem,this.updateCoordinateSystem());const[s,a,o,l,c,h]=this.children,p=e.getRenderTarget(),f=e.getActiveCubeFace(),g=e.getActiveMipmapLevel(),v=e.xr.enabled;e.xr.enabled=!1;const E=i.texture.generateMipmaps;i.texture.generateMipmaps=!1;let _=!1;e.isWebGLRenderer===!0?_=e.state.buffers.depth.getReversed():_=e.reversedDepthBuffer,e.setRenderTarget(i,0,r),_&&e.autoClear===!1&&e.clearDepth(),e.render(n,s),e.setRenderTarget(i,1,r),_&&e.autoClear===!1&&e.clearDepth(),e.render(n,a),e.setRenderTarget(i,2,r),_&&e.autoClear===!1&&e.clearDepth(),e.render(n,o),e.setRenderTarget(i,3,r),_&&e.autoClear===!1&&e.clearDepth(),e.render(n,l),e.setRenderTarget(i,4,r),_&&e.autoClear===!1&&e.clearDepth(),e.render(n,c),i.texture.generateMipmaps=E,e.setRenderTarget(i,5,r),_&&e.autoClear===!1&&e.clearDepth(),e.render(n,h),e.setRenderTarget(p,f,g),e.xr.enabled=v,i.texture.needsPMREMUpdate=!0}}class s1 extends Jn{constructor(e=[]){super(),this.isArrayCamera=!0,this.isMultiViewCamera=!1,this.cameras=e}}const q0=new kt;class a1{constructor(e,n,i=0,r=1/0){this.ray=new Mu(e,n),this.near=i,this.far=r,this.camera=null,this.layers=new Dp,this.params={Mesh:{},Line:{threshold:1},LOD:{},Points:{threshold:1},Sprite:{}}}set(e,n){this.ray.set(e,n)}setFromCamera(e,n){n.isPerspectiveCamera?(this.ray.origin.setFromMatrixPosition(n.matrixWorld),this.ray.direction.set(e.x,e.y,.5).unproject(n).sub(this.ray.origin).normalize(),this.camera=n):n.isOrthographicCamera?(this.ray.origin.set(e.x,e.y,n.projectionMatrix.elements[14]).unproject(n),this.ray.direction.set(0,0,-1).transformDirection(n.matrixWorld),this.camera=n):gt("Raycaster: Unsupported camera type: "+n.type)}setFromXRController(e){return q0.identity().extractRotation(e.matrixWorld),this.ray.origin.setFromMatrixPosition(e.matrixWorld),this.ray.direction.set(0,0,-1).applyMatrix4(q0),this}intersectObject(e,n=!0,i=[]){return Sh(e,this,i,n),i.sort(Y0),i}intersectObjects(e,n=!0,i=[]){for(let r=0,s=e.length;r<s;r++)Sh(e[r],this,i,n);return i.sort(Y0),i}}function Y0(t,e){return t.distance-e.distance}function Sh(t,e,n,i){let r=!0;if(t.layers.test(e.layers)&&t.raycast(e,n)===!1&&(r=!1),r===!0&&i===!0){const s=t.children;for(let a=0,o=s.length;a<o;a++)Sh(s[a],e,n,!0)}}class K0{constructor(e=1,n=0,i=0){this.radius=e,this.phi=n,this.theta=i}set(e,n,i){return this.radius=e,this.phi=n,this.theta=i,this}copy(e){return this.radius=e.radius,this.phi=e.phi,this.theta=e.theta,this}makeSafe(){return this.phi=lt(this.phi,1e-6,Math.PI-1e-6),this}setFromVector3(e){return this.setFromCartesianCoords(e.x,e.y,e.z)}setFromCartesianCoords(e,n,i){return this.radius=Math.sqrt(e*e+n*n+i*i),this.radius===0?(this.theta=0,this.phi=0):(this.theta=Math.atan2(e,i),this.phi=Math.acos(lt(n/this.radius,-1,1))),this}clone(){return new this.constructor().copy(this)}}const Qp=class Qp{constructor(e,n,i,r){this.elements=[1,0,0,1],e!==void 0&&this.set(e,n,i,r)}identity(){return this.set(1,0,0,1),this}fromArray(e,n=0){for(let i=0;i<4;i++)this.elements[i]=e[i+n];return this}set(e,n,i,r){const s=this.elements;return s[0]=e,s[2]=n,s[1]=i,s[3]=r,this}};Qp.prototype.isMatrix2=!0;let Z0=Qp;class o1 extends hs{constructor(e,n=null){super(),this.object=e,this.domElement=n,this.enabled=!0,this.state=-1,this.keys={},this.mouseButtons={LEFT:null,MIDDLE:null,RIGHT:null},this.touches={ONE:null,TWO:null}}connect(e){this.domElement!==null&&this.disconnect(),this.domElement=e}disconnect(){}dispose(){}update(){}}function Q0(t,e,n,i){const r=l1(i);switch(n){case ux:return t*e;case fx:return t*e/r.components*r.byteLength;case bp:return t*e/r.components*r.byteLength;case ks:return t*e*2/r.components*r.byteLength;case Rp:return t*e*2/r.components*r.byteLength;case dx:return t*e*3/r.components*r.byteLength;case Ii:return t*e*4/r.components*r.byteLength;case Cp:return t*e*4/r.components*r.byteLength;case vc:case xc:return Math.floor((t+3)/4)*Math.floor((e+3)/4)*8;case yc:case Sc:return Math.floor((t+3)/4)*Math.floor((e+3)/4)*16;case Wf:case Xf:return Math.max(t,16)*Math.max(e,8)/4;case Gf:case jf:return Math.max(t,8)*Math.max(e,8)/2;case $f:case qf:case Kf:case Zf:return Math.floor((t+3)/4)*Math.floor((e+3)/4)*8;case Yf:case $c:case Qf:return Math.floor((t+3)/4)*Math.floor((e+3)/4)*16;case Jf:return Math.floor((t+3)/4)*Math.floor((e+3)/4)*16;case eh:return Math.floor((t+4)/5)*Math.floor((e+3)/4)*16;case th:return Math.floor((t+4)/5)*Math.floor((e+4)/5)*16;case nh:return Math.floor((t+5)/6)*Math.floor((e+4)/5)*16;case ih:return Math.floor((t+5)/6)*Math.floor((e+5)/6)*16;case rh:return Math.floor((t+7)/8)*Math.floor((e+4)/5)*16;case sh:return Math.floor((t+7)/8)*Math.floor((e+5)/6)*16;case ah:return Math.floor((t+7)/8)*Math.floor((e+7)/8)*16;case oh:return Math.floor((t+9)/10)*Math.floor((e+4)/5)*16;case lh:return Math.floor((t+9)/10)*Math.floor((e+5)/6)*16;case ch:return Math.floor((t+9)/10)*Math.floor((e+7)/8)*16;case uh:return Math.floor((t+9)/10)*Math.floor((e+9)/10)*16;case dh:return Math.floor((t+11)/12)*Math.floor((e+9)/10)*16;case fh:return Math.floor((t+11)/12)*Math.floor((e+11)/12)*16;case hh:case ph:case mh:return Math.ceil(t/4)*Math.ceil(e/4)*16;case gh:case _h:return Math.ceil(t/4)*Math.ceil(e/4)*8;case qc:case vh:return Math.ceil(t/4)*Math.ceil(e/4)*16}throw new Error(`Unable to determine texture byte length for ${n} format.`)}function l1(t){switch(t){case ti:case ax:return{byteLength:1,components:1};case el:case ox:case or:return{byteLength:2,components:1};case Tp:case Ap:return{byteLength:2,components:4};case ar:case wp:case tr:return{byteLength:4,components:1};case lx:case cx:return{byteLength:4,components:3}}throw new Error(`THREE.TextureUtils: Unknown texture type ${t}.`)}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:Ep}}));typeof window<"u"&&(window.__THREE__?Ge("WARNING: Multiple instances of Three.js being imported."):window.__THREE__=Ep);/**
 * @license
 * Copyright 2010-2026 Three.js Authors
 * SPDX-License-Identifier: MIT
 */function wx(){let t=null,e=!1,n=null,i=null;function r(s,a){i=t.requestAnimationFrame(r),n(s,a)}return{start:function(){e!==!0&&n!==null&&t!==null&&(i=t.requestAnimationFrame(r),e=!0)},stop:function(){t!==null&&t.cancelAnimationFrame(i),e=!1},setAnimationLoop:function(s){n=s},setContext:function(s){t=s}}}function c1(t){const e=new WeakMap;function n(o,l){const c=o.array,h=o.usage,p=c.byteLength,f=t.createBuffer();t.bindBuffer(l,f),t.bufferData(l,c,h),o.onUploadCallback();let g;if(c instanceof Float32Array)g=t.FLOAT;else if(typeof Float16Array<"u"&&c instanceof Float16Array)g=t.HALF_FLOAT;else if(c instanceof Uint16Array)o.isFloat16BufferAttribute?g=t.HALF_FLOAT:g=t.UNSIGNED_SHORT;else if(c instanceof Int16Array)g=t.SHORT;else if(c instanceof Uint32Array)g=t.UNSIGNED_INT;else if(c instanceof Int32Array)g=t.INT;else if(c instanceof Int8Array)g=t.BYTE;else if(c instanceof Uint8Array)g=t.UNSIGNED_BYTE;else if(c instanceof Uint8ClampedArray)g=t.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+c);return{buffer:f,type:g,bytesPerElement:c.BYTES_PER_ELEMENT,version:o.version,size:p}}function i(o,l,c){const h=l.array,p=l.updateRanges;if(t.bindBuffer(c,o),p.length===0)t.bufferSubData(c,0,h);else{p.sort((g,v)=>g.start-v.start);let f=0;for(let g=1;g<p.length;g++){const v=p[f],E=p[g];E.start<=v.start+v.count+1?v.count=Math.max(v.count,E.start+E.count-v.start):(++f,p[f]=E)}p.length=f+1;for(let g=0,v=p.length;g<v;g++){const E=p[g];t.bufferSubData(c,E.start*h.BYTES_PER_ELEMENT,h,E.start,E.count)}l.clearUpdateRanges()}l.onUploadCallback()}function r(o){return o.isInterleavedBufferAttribute&&(o=o.data),e.get(o)}function s(o){o.isInterleavedBufferAttribute&&(o=o.data);const l=e.get(o);l&&(t.deleteBuffer(l.buffer),e.delete(o))}function a(o,l){if(o.isInterleavedBufferAttribute&&(o=o.data),o.isGLBufferAttribute){const h=e.get(o);(!h||h.version<o.version)&&e.set(o,{buffer:o.buffer,type:o.type,bytesPerElement:o.elementSize,version:o.version});return}const c=e.get(o);if(c===void 0)e.set(o,n(o,l));else if(c.version<o.version){if(c.size!==o.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");i(c.buffer,o,l),c.version=o.version}}return{get:r,remove:s,update:a}}var u1=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,d1=`#ifdef USE_ALPHAHASH
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
#endif`,f1=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,h1=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,p1=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,m1=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,g1=`#ifdef USE_AOMAP
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
#endif`,_1=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,v1=`#ifdef USE_BATCHING
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
#endif`,x1=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,y1=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,S1=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,M1=`float G_BlinnPhong_Implicit( ) {
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
} // validated`,E1=`#ifdef USE_IRIDESCENCE
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
#endif`,w1=`#ifdef USE_BUMPMAP
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
#endif`,T1=`#if NUM_CLIPPING_PLANES > 0
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
#endif`,A1=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,b1=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,R1=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,C1=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#endif`,P1=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#endif`,N1=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec4 vColor;
#endif`,L1=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
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
#endif`,D1=`#define PI 3.141592653589793
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
} // validated`,I1=`#ifdef ENVMAP_TYPE_CUBE_UV
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
#endif`,U1=`vec3 transformedNormal = objectNormal;
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
#endif`,F1=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,O1=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,k1=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,B1=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,z1="gl_FragColor = linearToOutputTexel( gl_FragColor );",H1=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,V1=`#ifdef USE_ENVMAP
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
#endif`,G1=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
#endif`,W1=`#ifdef USE_ENVMAP
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
#endif`,j1=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,X1=`#ifdef USE_ENVMAP
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
#endif`,$1=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,q1=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,Y1=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,K1=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,Z1=`#ifdef USE_GRADIENTMAP
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
}`,Q1=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,J1=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,ew=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,tw=`uniform bool receiveShadow;
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
#include <lightprobes_pars_fragment>`,nw=`#ifdef USE_ENVMAP
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
#endif`,iw=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,rw=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,sw=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,aw=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,ow=`PhysicalMaterial material;
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
#endif`,lw=`uniform sampler2D dfgLUT;
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
}`,cw=`
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
#endif`,uw=`#if defined( RE_IndirectDiffuse )
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
#endif`,dw=`#if defined( RE_IndirectDiffuse )
	#if defined( LAMBERT ) || defined( PHONG )
		irradiance += iblIrradiance;
	#endif
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,fw=`#ifdef USE_LIGHT_PROBES_GRID
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
#endif`,hw=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,pw=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,mw=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,gw=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,_w=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,vw=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,xw=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
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
#endif`,yw=`#if defined( USE_POINTS_UV )
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
#endif`,Sw=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,Mw=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,Ew=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,ww=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,Tw=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,Aw=`#ifdef USE_MORPHTARGETS
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
#endif`,bw=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,Rw=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
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
vec3 nonPerturbedNormal = normal;`,Cw=`#ifdef USE_NORMALMAP_OBJECTSPACE
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
#endif`,Pw=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Nw=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Lw=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
		#ifdef FLIP_SIDED
			vBitangent = - vBitangent;
		#endif
	#endif
#endif`,Dw=`#ifdef USE_NORMALMAP
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
#endif`,Iw=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,Uw=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,Fw=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,Ow=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,kw=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,Bw=`vec3 packNormalToRGB( const in vec3 normal ) {
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
}`,zw=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,Hw=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,Vw=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,Gw=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,Ww=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,jw=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,Xw=`#if NUM_SPOT_LIGHT_COORDS > 0
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
#endif`,$w=`#if NUM_SPOT_LIGHT_COORDS > 0
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
#endif`,qw=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_SUN_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
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
#endif`,Yw=`float getShadowMask() {
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
}`,Kw=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,Zw=`#ifdef USE_SKINNING
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
#endif`,Qw=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,Jw=`#ifdef USE_SKINNING
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
#endif`,eT=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,tT=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,nT=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,iT=`#ifndef saturate
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
vec3 CustomToneMapping( vec3 color ) { return color; }`,rT=`#ifdef USE_TRANSMISSION
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
#endif`,sT=`#ifdef USE_TRANSMISSION
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
#endif`,aT=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,oT=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,lT=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,cT=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`;const uT=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,dT=`uniform sampler2D t2D;
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
}`,fT=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,hT=`#ifdef ENVMAP_TYPE_CUBE
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
}`,pT=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,mT=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,gT=`#include <common>
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
}`,_T=`#if DEPTH_PACKING == 3200
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
}`,vT=`#define DISTANCE
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
}`,xT=`#define DISTANCE
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
}`,yT=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,ST=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,MT=`uniform float scale;
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
}`,ET=`uniform vec3 diffuse;
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
}`,wT=`#include <common>
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
}`,TT=`uniform vec3 diffuse;
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
}`,AT=`#define LAMBERT
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
}`,bT=`#define LAMBERT
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
}`,RT=`#define MATCAP
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
}`,CT=`#define MATCAP
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
}`,PT=`#define NORMAL
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
}`,NT=`#define NORMAL
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
}`,LT=`#define PHONG
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
}`,DT=`#define PHONG
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
}`,IT=`#define STANDARD
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
}`,UT=`#define STANDARD
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
}`,FT=`#define TOON
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
}`,OT=`#define TOON
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
}`,kT=`uniform float size;
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
}`,BT=`uniform vec3 diffuse;
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
}`,zT=`#include <common>
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
}`,HT=`uniform vec3 color;
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
}`,VT=`uniform float rotation;
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
}`,GT=`uniform vec3 diffuse;
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
}`,tt={alphahash_fragment:u1,alphahash_pars_fragment:d1,alphamap_fragment:f1,alphamap_pars_fragment:h1,alphatest_fragment:p1,alphatest_pars_fragment:m1,aomap_fragment:g1,aomap_pars_fragment:_1,batching_pars_vertex:v1,batching_vertex:x1,begin_vertex:y1,beginnormal_vertex:S1,bsdfs:M1,iridescence_fragment:E1,bumpmap_pars_fragment:w1,clipping_planes_fragment:T1,clipping_planes_pars_fragment:A1,clipping_planes_pars_vertex:b1,clipping_planes_vertex:R1,color_fragment:C1,color_pars_fragment:P1,color_pars_vertex:N1,color_vertex:L1,common:D1,cube_uv_reflection_fragment:I1,defaultnormal_vertex:U1,displacementmap_pars_vertex:F1,displacementmap_vertex:O1,emissivemap_fragment:k1,emissivemap_pars_fragment:B1,colorspace_fragment:z1,colorspace_pars_fragment:H1,envmap_fragment:V1,envmap_common_pars_fragment:G1,envmap_pars_fragment:W1,envmap_pars_vertex:j1,envmap_physical_pars_fragment:nw,envmap_vertex:X1,fog_vertex:$1,fog_pars_vertex:q1,fog_fragment:Y1,fog_pars_fragment:K1,gradientmap_pars_fragment:Z1,lightmap_pars_fragment:Q1,lights_lambert_fragment:J1,lights_lambert_pars_fragment:ew,lights_pars_begin:tw,lights_toon_fragment:iw,lights_toon_pars_fragment:rw,lights_phong_fragment:sw,lights_phong_pars_fragment:aw,lights_physical_fragment:ow,lights_physical_pars_fragment:lw,lights_fragment_begin:cw,lights_fragment_maps:uw,lights_fragment_end:dw,lightprobes_pars_fragment:fw,logdepthbuf_fragment:hw,logdepthbuf_pars_fragment:pw,logdepthbuf_pars_vertex:mw,logdepthbuf_vertex:gw,map_fragment:_w,map_pars_fragment:vw,map_particle_fragment:xw,map_particle_pars_fragment:yw,metalnessmap_fragment:Sw,metalnessmap_pars_fragment:Mw,morphinstance_vertex:Ew,morphcolor_vertex:ww,morphnormal_vertex:Tw,morphtarget_pars_vertex:Aw,morphtarget_vertex:bw,normal_fragment_begin:Rw,normal_fragment_maps:Cw,normal_pars_fragment:Pw,normal_pars_vertex:Nw,normal_vertex:Lw,normalmap_pars_fragment:Dw,clearcoat_normal_fragment_begin:Iw,clearcoat_normal_fragment_maps:Uw,clearcoat_pars_fragment:Fw,iridescence_pars_fragment:Ow,opaque_fragment:kw,packing:Bw,premultiplied_alpha_fragment:zw,project_vertex:Hw,dithering_fragment:Vw,dithering_pars_fragment:Gw,roughnessmap_fragment:Ww,roughnessmap_pars_fragment:jw,shadowmap_pars_fragment:Xw,shadowmap_pars_vertex:$w,shadowmap_vertex:qw,shadowmask_pars_fragment:Yw,skinbase_vertex:Kw,skinning_pars_vertex:Zw,skinning_vertex:Qw,skinnormal_vertex:Jw,specularmap_fragment:eT,specularmap_pars_fragment:tT,tonemapping_fragment:nT,tonemapping_pars_fragment:iT,transmission_fragment:rT,transmission_pars_fragment:sT,uv_pars_fragment:aT,uv_pars_vertex:oT,uv_vertex:lT,worldpos_vertex:cT,background_vert:uT,background_frag:dT,backgroundCube_vert:fT,backgroundCube_frag:hT,cube_vert:pT,cube_frag:mT,depth_vert:gT,depth_frag:_T,distance_vert:vT,distance_frag:xT,equirect_vert:yT,equirect_frag:ST,linedashed_vert:MT,linedashed_frag:ET,meshbasic_vert:wT,meshbasic_frag:TT,meshlambert_vert:AT,meshlambert_frag:bT,meshmatcap_vert:RT,meshmatcap_frag:CT,meshnormal_vert:PT,meshnormal_frag:NT,meshphong_vert:LT,meshphong_frag:DT,meshphysical_vert:IT,meshphysical_frag:UT,meshtoon_vert:FT,meshtoon_frag:OT,points_vert:kT,points_frag:BT,shadow_vert:zT,shadow_frag:HT,sprite_vert:VT,sprite_frag:GT},Ee={common:{diffuse:{value:new dt(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new Ye},alphaMap:{value:null},alphaMapTransform:{value:new Ye},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new Ye}},envmap:{envMap:{value:null},envMapRotation:{value:new Ye},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98},dfgLUT:{value:null}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new Ye}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new Ye}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new Ye},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new Ye},normalScale:{value:new je(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new Ye},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new Ye}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new Ye}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new Ye}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new dt(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},sunLights:{value:[],properties:{direction:{},color:{}}},sunLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},sunShadowMatrix:{value:[]},sunShadowCascade:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null},probesSH:{value:null},probesMin:{value:new D},probesMax:{value:new D},probesResolution:{value:new D}},points:{diffuse:{value:new dt(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new Ye},alphaTest:{value:0},uvTransform:{value:new Ye}},sprite:{diffuse:{value:new dt(16777215)},opacity:{value:1},center:{value:new je(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new Ye},alphaMap:{value:null},alphaMapTransform:{value:new Ye},alphaTest:{value:0}}},Zi={basic:{uniforms:Pn([Ee.common,Ee.specularmap,Ee.envmap,Ee.aomap,Ee.lightmap,Ee.fog]),vertexShader:tt.meshbasic_vert,fragmentShader:tt.meshbasic_frag},lambert:{uniforms:Pn([Ee.common,Ee.specularmap,Ee.envmap,Ee.aomap,Ee.lightmap,Ee.emissivemap,Ee.bumpmap,Ee.normalmap,Ee.displacementmap,Ee.fog,Ee.lights,{emissive:{value:new dt(0)},envMapIntensity:{value:1}}]),vertexShader:tt.meshlambert_vert,fragmentShader:tt.meshlambert_frag},phong:{uniforms:Pn([Ee.common,Ee.specularmap,Ee.envmap,Ee.aomap,Ee.lightmap,Ee.emissivemap,Ee.bumpmap,Ee.normalmap,Ee.displacementmap,Ee.fog,Ee.lights,{emissive:{value:new dt(0)},specular:{value:new dt(1118481)},shininess:{value:30},envMapIntensity:{value:1}}]),vertexShader:tt.meshphong_vert,fragmentShader:tt.meshphong_frag},standard:{uniforms:Pn([Ee.common,Ee.envmap,Ee.aomap,Ee.lightmap,Ee.emissivemap,Ee.bumpmap,Ee.normalmap,Ee.displacementmap,Ee.roughnessmap,Ee.metalnessmap,Ee.fog,Ee.lights,{emissive:{value:new dt(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:tt.meshphysical_vert,fragmentShader:tt.meshphysical_frag},toon:{uniforms:Pn([Ee.common,Ee.aomap,Ee.lightmap,Ee.emissivemap,Ee.bumpmap,Ee.normalmap,Ee.displacementmap,Ee.gradientmap,Ee.fog,Ee.lights,{emissive:{value:new dt(0)}}]),vertexShader:tt.meshtoon_vert,fragmentShader:tt.meshtoon_frag},matcap:{uniforms:Pn([Ee.common,Ee.bumpmap,Ee.normalmap,Ee.displacementmap,Ee.fog,{matcap:{value:null}}]),vertexShader:tt.meshmatcap_vert,fragmentShader:tt.meshmatcap_frag},points:{uniforms:Pn([Ee.points,Ee.fog]),vertexShader:tt.points_vert,fragmentShader:tt.points_frag},dashed:{uniforms:Pn([Ee.common,Ee.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:tt.linedashed_vert,fragmentShader:tt.linedashed_frag},depth:{uniforms:Pn([Ee.common,Ee.displacementmap]),vertexShader:tt.depth_vert,fragmentShader:tt.depth_frag},normal:{uniforms:Pn([Ee.common,Ee.bumpmap,Ee.normalmap,Ee.displacementmap,{opacity:{value:1}}]),vertexShader:tt.meshnormal_vert,fragmentShader:tt.meshnormal_frag},sprite:{uniforms:Pn([Ee.sprite,Ee.fog]),vertexShader:tt.sprite_vert,fragmentShader:tt.sprite_frag},background:{uniforms:{uvTransform:{value:new Ye},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:tt.background_vert,fragmentShader:tt.background_frag},backgroundCube:{uniforms:{envMap:{value:null},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new Ye}},vertexShader:tt.backgroundCube_vert,fragmentShader:tt.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:tt.cube_vert,fragmentShader:tt.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:tt.equirect_vert,fragmentShader:tt.equirect_frag},distance:{uniforms:Pn([Ee.common,Ee.displacementmap,{referencePosition:{value:new D},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:tt.distance_vert,fragmentShader:tt.distance_frag},shadow:{uniforms:Pn([Ee.lights,Ee.fog,{color:{value:new dt(0)},opacity:{value:1}}]),vertexShader:tt.shadow_vert,fragmentShader:tt.shadow_frag}};Zi.physical={uniforms:Pn([Zi.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new Ye},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new Ye},clearcoatNormalScale:{value:new je(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new Ye},dispersion:{value:0},retroreflectivity:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new Ye},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new Ye},sheen:{value:0},sheenColor:{value:new dt(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new Ye},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new Ye},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new Ye},transmissionSamplerSize:{value:new je},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new Ye},attenuationDistance:{value:0},attenuationColor:{value:new dt(0)},specularColor:{value:new dt(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new Ye},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new Ye},anisotropyVector:{value:new je},anisotropyMap:{value:null},anisotropyMapTransform:{value:new Ye}}]),vertexShader:tt.meshphysical_vert,fragmentShader:tt.meshphysical_frag};const nc={r:0,b:0,g:0},WT=new kt,Tx=new Ye;Tx.set(-1,0,0,0,1,0,0,0,1);function jT(t,e,n,i,r,s){const a=new dt(0);let o=r===!0?0:1,l,c,h=null,p=0,f=null;function g(m){let M=m.isScene===!0?m.background:null;if(M&&M.isTexture){const y=m.backgroundBlurriness>0;M=e.get(M,y)}return M}function v(m){let M=!1;const y=g(m);y===null?_(a,o):y&&y.isColor&&(_(y,1),M=!0);const T=t.xr.getEnvironmentBlendMode();T==="additive"?n.buffers.color.setClear(0,0,0,1,s):T==="alpha-blend"&&n.buffers.color.setClear(0,0,0,0,s),(t.autoClear||M)&&(n.buffers.depth.setTest(!0),n.buffers.depth.setMask(!0),n.buffers.color.setMask(!0),t.clear(t.autoClearColor,t.autoClearDepth,t.autoClearStencil))}function E(m,M){const y=g(M);y&&(y.isCubeTexture||y.mapping===yu)?(c===void 0&&(c=new ze(new Ft(1,1,1),new lr({name:"BackgroundCubeMaterial",uniforms:Ha(Zi.backgroundCube.uniforms),vertexShader:Zi.backgroundCube.vertexShader,fragmentShader:Zi.backgroundCube.fragmentShader,side:$n,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),c.geometry.deleteAttribute("normal"),c.geometry.deleteAttribute("uv"),c.onBeforeRender=function(T,w,R){this.matrixWorld.copyPosition(R.matrixWorld)},Object.defineProperty(c.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),i.update(c)),c.material.uniforms.envMap.value=y,c.material.uniforms.backgroundBlurriness.value=M.backgroundBlurriness,c.material.uniforms.backgroundIntensity.value=M.backgroundIntensity,c.material.uniforms.backgroundRotation.value.setFromMatrix4(WT.makeRotationFromEuler(M.backgroundRotation)).transpose(),y.isCubeTexture&&y.isRenderTargetTexture===!1&&c.material.uniforms.backgroundRotation.value.premultiply(Tx),c.material.toneMapped=ft.getTransfer(y.colorSpace)!==Tt,(h!==y||p!==y.version||f!==t.toneMapping)&&(c.material.needsUpdate=!0,h=y,p=y.version,f=t.toneMapping),c.layers.enableAll(),m.unshift(c,c.geometry,c.material,0,0,null)):y&&y.isTexture&&(l===void 0&&(l=new ze(new za(2,2),new lr({name:"BackgroundMaterial",uniforms:Ha(Zi.background.uniforms),vertexShader:Zi.background.vertexShader,fragmentShader:Zi.background.fragmentShader,side:Fs,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),l.geometry.deleteAttribute("normal"),Object.defineProperty(l.material,"map",{get:function(){return this.uniforms.t2D.value}}),i.update(l)),l.material.uniforms.t2D.value=y,l.material.uniforms.backgroundIntensity.value=M.backgroundIntensity,l.material.toneMapped=ft.getTransfer(y.colorSpace)!==Tt,y.matrixAutoUpdate===!0&&y.updateMatrix(),l.material.uniforms.uvTransform.value.copy(y.matrix),(h!==y||p!==y.version||f!==t.toneMapping)&&(l.material.needsUpdate=!0,h=y,p=y.version,f=t.toneMapping),l.layers.enableAll(),m.unshift(l,l.geometry,l.material,0,0,null))}function _(m,M){m.getRGB(nc,Sx(t)),n.buffers.color.setClear(nc.r,nc.g,nc.b,M,s)}function u(){c!==void 0&&(c.geometry.dispose(),c.material.dispose(),c=void 0),l!==void 0&&(l.geometry.dispose(),l.material.dispose(),l=void 0)}return{getClearColor:function(){return a},setClearColor:function(m,M=1){a.set(m),o=M,_(a,o)},getClearAlpha:function(){return o},setClearAlpha:function(m){o=m,_(a,o)},render:v,addToRenderList:E,dispose:u}}function XT(t,e){const n=t.getParameter(t.MAX_VERTEX_ATTRIBS),i={},r=f(null);let s=r,a=!1;function o(L,B,F,I,j){let N=!1;const H=p(L,I,F,B);s!==H&&(s=H,c(s.object)),N=g(L,I,F,j),N&&v(L,I,F,j),j!==null&&e.update(j,t.ELEMENT_ARRAY_BUFFER),(N||a)&&(a=!1,y(L,B,F,I),j!==null&&t.bindBuffer(t.ELEMENT_ARRAY_BUFFER,e.get(j).buffer))}function l(){return t.createVertexArray()}function c(L){return t.bindVertexArray(L)}function h(L){return t.deleteVertexArray(L)}function p(L,B,F,I){const j=I.wireframe===!0;let N=i[B.id];N===void 0&&(N={},i[B.id]=N);const H=L.isInstancedMesh===!0?L.id:0;let V=N[H];V===void 0&&(V={},N[H]=V);let G=V[F.id];G===void 0&&(G={},V[F.id]=G);let X=G[j];return X===void 0&&(X=f(l()),G[j]=X),X}function f(L){const B=[],F=[],I=[];for(let j=0;j<n;j++)B[j]=0,F[j]=0,I[j]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:B,enabledAttributes:F,attributeDivisors:I,object:L,attributes:{},index:null}}function g(L,B,F,I){const j=s.attributes,N=B.attributes;let H=0;const V=F.getAttributes();for(const G in V)if(V[G].location>=0){const ne=j[G];let ve=N[G];if(ve===void 0&&(G==="instanceMatrix"&&L.instanceMatrix&&(ve=L.instanceMatrix),G==="instanceColor"&&L.instanceColor&&(ve=L.instanceColor)),ne===void 0||ne.attribute!==ve||ve&&ne.data!==ve.data)return!0;H++}return s.attributesNum!==H||s.index!==I}function v(L,B,F,I){const j={},N=B.attributes;let H=0;const V=F.getAttributes();for(const G in V)if(V[G].location>=0){let ne=N[G];ne===void 0&&(G==="instanceMatrix"&&L.instanceMatrix&&(ne=L.instanceMatrix),G==="instanceColor"&&L.instanceColor&&(ne=L.instanceColor));const ve={};ve.attribute=ne,ne&&ne.data&&(ve.data=ne.data),j[G]=ve,H++}s.attributes=j,s.attributesNum=H,s.index=I}function E(){const L=s.newAttributes;for(let B=0,F=L.length;B<F;B++)L[B]=0}function _(L){u(L,0)}function u(L,B){const F=s.newAttributes,I=s.enabledAttributes,j=s.attributeDivisors;F[L]=1,I[L]===0&&(t.enableVertexAttribArray(L),I[L]=1),j[L]!==B&&(t.vertexAttribDivisor(L,B),j[L]=B)}function m(){const L=s.newAttributes,B=s.enabledAttributes;for(let F=0,I=B.length;F<I;F++)B[F]!==L[F]&&(t.disableVertexAttribArray(F),B[F]=0)}function M(L,B,F,I,j,N,H){H===!0?t.vertexAttribIPointer(L,B,F,j,N):t.vertexAttribPointer(L,B,F,I,j,N)}function y(L,B,F,I){E();const j=I.attributes,N=F.getAttributes(),H=B.defaultAttributeValues;for(const V in N){const G=N[V];if(G.location>=0){let X=j[V];if(X===void 0&&(V==="instanceMatrix"&&L.instanceMatrix&&(X=L.instanceMatrix),V==="instanceColor"&&L.instanceColor&&(X=L.instanceColor)),X!==void 0){const ne=X.normalized,ve=X.itemSize,Pe=e.get(X);if(Pe===void 0)continue;const Je=Pe.buffer,$e=Pe.type,Ke=Pe.bytesPerElement,Z=$e===t.INT||$e===t.UNSIGNED_INT||X.gpuType===wp;if(X.isInterleavedBufferAttribute){const J=X.data,Ne=J.stride,We=X.offset;if(J.isInstancedInterleavedBuffer){for(let Re=0;Re<G.locationSize;Re++)u(G.location+Re,J.meshPerAttribute);L.isInstancedMesh!==!0&&I._maxInstanceCount===void 0&&(I._maxInstanceCount=J.meshPerAttribute*J.count)}else for(let Re=0;Re<G.locationSize;Re++)_(G.location+Re);t.bindBuffer(t.ARRAY_BUFFER,Je);for(let Re=0;Re<G.locationSize;Re++)M(G.location+Re,ve/G.locationSize,$e,ne,Ne*Ke,(We+ve/G.locationSize*Re)*Ke,Z)}else{if(X.isInstancedBufferAttribute){for(let J=0;J<G.locationSize;J++)u(G.location+J,X.meshPerAttribute);L.isInstancedMesh!==!0&&I._maxInstanceCount===void 0&&(I._maxInstanceCount=X.meshPerAttribute*X.count)}else for(let J=0;J<G.locationSize;J++)_(G.location+J);t.bindBuffer(t.ARRAY_BUFFER,Je);for(let J=0;J<G.locationSize;J++)M(G.location+J,ve/G.locationSize,$e,ne,ve*Ke,ve/G.locationSize*J*Ke,Z)}}else if(H!==void 0){const ne=H[V];if(ne!==void 0)switch(ne.length){case 2:t.vertexAttrib2fv(G.location,ne);break;case 3:t.vertexAttrib3fv(G.location,ne);break;case 4:t.vertexAttrib4fv(G.location,ne);break;default:t.vertexAttrib1fv(G.location,ne)}}}}m()}function T(){A();for(const L in i){const B=i[L];for(const F in B){const I=B[F];for(const j in I){const N=I[j];for(const H in N)h(N[H].object),delete N[H];delete I[j]}}delete i[L]}}function w(L){if(i[L.id]===void 0)return;const B=i[L.id];for(const F in B){const I=B[F];for(const j in I){const N=I[j];for(const H in N)h(N[H].object),delete N[H];delete I[j]}}delete i[L.id]}function R(L){for(const B in i){const F=i[B];for(const I in F){const j=F[I];if(j[L.id]===void 0)continue;const N=j[L.id];for(const H in N)h(N[H].object),delete N[H];delete j[L.id]}}}function x(L){for(const B in i){const F=i[B],I=L.isInstancedMesh===!0?L.id:0,j=F[I];if(j!==void 0){for(const N in j){const H=j[N];for(const V in H)h(H[V].object),delete H[V];delete j[N]}delete F[I],Object.keys(F).length===0&&delete i[B]}}}function A(){P(),a=!0,s!==r&&(s=r,c(s.object))}function P(){r.geometry=null,r.program=null,r.wireframe=!1}return{setup:o,reset:A,resetDefaultState:P,dispose:T,releaseStatesOfGeometry:w,releaseStatesOfObject:x,releaseStatesOfProgram:R,initAttributes:E,enableAttribute:_,disableUnusedAttributes:m}}function $T(t,e,n){let i;function r(l){i=l}function s(l,c){t.drawArrays(i,l,c),n.update(c,i,1)}function a(l,c,h){h!==0&&(t.drawArraysInstanced(i,l,c,h),n.update(c,i,h))}function o(l,c,h){if(h===0)return;e.get("WEBGL_multi_draw").multiDrawArraysWEBGL(i,l,0,c,0,h);let f=0;for(let g=0;g<h;g++)f+=c[g];n.update(f,i,1)}this.setMode=r,this.render=s,this.renderInstances=a,this.renderMultiDraw=o}function qT(t,e,n,i){let r;function s(){if(r!==void 0)return r;if(e.has("EXT_texture_filter_anisotropic")===!0){const R=e.get("EXT_texture_filter_anisotropic");r=t.getParameter(R.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else r=0;return r}function a(R){return!(R!==Ii&&i.convert(R)!==t.getParameter(t.IMPLEMENTATION_COLOR_READ_FORMAT))}function o(R){const x=R===or&&(e.has("EXT_color_buffer_half_float")||e.has("EXT_color_buffer_float"));return!(R!==ti&&R!==tr&&!x&&i.convert(R)!==t.getParameter(t.IMPLEMENTATION_COLOR_READ_TYPE))}function l(R){if(R==="highp"){if(t.getShaderPrecisionFormat(t.VERTEX_SHADER,t.HIGH_FLOAT).precision>0&&t.getShaderPrecisionFormat(t.FRAGMENT_SHADER,t.HIGH_FLOAT).precision>0)return"highp";R="mediump"}return R==="mediump"&&t.getShaderPrecisionFormat(t.VERTEX_SHADER,t.MEDIUM_FLOAT).precision>0&&t.getShaderPrecisionFormat(t.FRAGMENT_SHADER,t.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let c=n.precision!==void 0?n.precision:"highp";const h=l(c);h!==c&&(Ge("WebGLRenderer:",c,"not supported, using",h,"instead."),c=h);const p=n.logarithmicDepthBuffer===!0,f=n.reversedDepthBuffer===!0&&e.has("EXT_clip_control");n.reversedDepthBuffer===!0&&f===!1&&Ge("WebGLRenderer: Unable to use reversed depth buffer due to missing EXT_clip_control extension. Fallback to default depth buffer.");const g=t.getParameter(t.MAX_TEXTURE_IMAGE_UNITS),v=t.getParameter(t.MAX_VERTEX_TEXTURE_IMAGE_UNITS),E=t.getParameter(t.MAX_TEXTURE_SIZE),_=t.getParameter(t.MAX_CUBE_MAP_TEXTURE_SIZE),u=t.getParameter(t.MAX_VERTEX_ATTRIBS),m=t.getParameter(t.MAX_VERTEX_UNIFORM_VECTORS),M=t.getParameter(t.MAX_VARYING_VECTORS),y=t.getParameter(t.MAX_FRAGMENT_UNIFORM_VECTORS),T=t.getParameter(t.MAX_SAMPLES),w=t.getParameter(t.SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:s,getMaxPrecision:l,textureFormatReadable:a,textureTypeReadable:o,precision:c,logarithmicDepthBuffer:p,reversedDepthBuffer:f,maxTextures:g,maxVertexTextures:v,maxTextureSize:E,maxCubemapSize:_,maxAttributes:u,maxVertexUniforms:m,maxVaryings:M,maxFragmentUniforms:y,maxSamples:T,samples:w}}function YT(t){const e=this;let n=null,i=0,r=!1,s=!1;const a=new xr,o=new Ye,l={value:null,needsUpdate:!1};this.uniform=l,this.numPlanes=0,this.numIntersection=0,this.init=function(p,f){const g=p.length!==0||f||i!==0||r;return r=f,i=p.length,g},this.beginShadows=function(){s=!0,h(null)},this.endShadows=function(){s=!1},this.setGlobalState=function(p,f){n=h(p,f,0)},this.setState=function(p,f,g){const v=p.clippingPlanes,E=p.clipIntersection,_=p.clipShadows,u=t.get(p);if(!r||v===null||v.length===0||s&&!_)s?h(null):c();else{const m=s?0:i,M=m*4;let y=u.clippingState||null;l.value=y,y=h(v,f,M,g);for(let T=0;T!==M;++T)y[T]=n[T];u.clippingState=y,this.numIntersection=E?this.numPlanes:0,this.numPlanes+=m}};function c(){l.value!==n&&(l.value=n,l.needsUpdate=i>0),e.numPlanes=i,e.numIntersection=0}function h(p,f,g,v){const E=p!==null?p.length:0;let _=null;if(E!==0){if(_=l.value,v!==!0||_===null){const u=g+E*4,m=f.matrixWorldInverse;o.getNormalMatrix(m),(_===null||_.length<u)&&(_=new Float32Array(u));for(let M=0,y=g;M!==E;++M,y+=4)a.copy(p[M]).applyMatrix4(m,o),a.normal.toArray(_,y),_[y+3]=a.constant}l.value=_,l.needsUpdate=!0}return e.numPlanes=E,e.numIntersection=0,_}}const ya=4,KT=6,ZT=20,QT=256,mo=new Bp,J0=new dt;let Dd=null,Id=0,Ud=0,Fd=!1;const JT=new D,Ss=new D;class eg{constructor(e){this._renderer=e,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._sizeLods=[],this._lodMeshes=[],this._backgroundBox=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._blurMaterial=null,this._ggxMaterial=null}fromScene(e,n=0,i=.1,r=100,s={}){const{size:a=256,position:o=JT}=s;Dd=this._renderer.getRenderTarget(),Id=this._renderer.getActiveCubeFace(),Ud=this._renderer.getActiveMipmapLevel(),Fd=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(a);const l=this._allocateTargets();return l.depthBuffer=!0,this._sceneToCubeUV(e,i,r,l,o),n>0&&this._blur(l,0,0,n),this._applyPMREM(l),this._cleanup(l),l}fromEquirectangular(e,n=null){return this._fromTexture(e,n)}fromCubemap(e,n=null){return this._fromTexture(e,n)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=ig(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=ng(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose(),this._backgroundBox!==null&&(this._backgroundBox.geometry.dispose(),this._backgroundBox.material.dispose())}_setSize(e){this._lodMax=Math.floor(Math.log2(e)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._ggxMaterial!==null&&this._ggxMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let e=0;e<this._lodMeshes.length;e++)this._lodMeshes[e].geometry.dispose()}_cleanup(e){this._renderer.setRenderTarget(Dd,Id,Ud),this._renderer.xr.enabled=Fd,e.scissorTest=!1,ra(e,0,0,e.width,e.height)}_fromTexture(e,n){e.mapping===Os||e.mapping===Ba?this._setSize(e.image.length===0?16:e.image[0].width||e.image[0].image.width):this._setSize(e.image.width/4),Dd=this._renderer.getRenderTarget(),Id=this._renderer.getActiveCubeFace(),Ud=this._renderer.getActiveMipmapLevel(),Fd=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;const i=n||this._allocateTargets();return this._textureToCubeUV(e,i),this._applyPMREM(i),this._cleanup(i),i}_allocateTargets(){const e=3*Math.max(this._cubeSize,112),n=4*this._cubeSize,i={magFilter:An,minFilter:An,generateMipmaps:!1,type:or,format:Ii,colorSpace:Yc,depthBuffer:!1},r=tg(e,n,i);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==e||this._pingPongRenderTarget.height!==n){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=tg(e,n,i);const{_lodMax:s}=this;({lodMeshes:this._lodMeshes,sizeLods:this._sizeLods}=eA(s)),this._blurMaterial=nA(s,e,n),this._ggxMaterial=tA(s,e,n)}return r}_compileMaterial(e){const n=new ze(new qn,e);this._renderer.compile(n,mo)}_sceneToCubeUV(e,n,i,r,s){const l=new Jn(90,1,n,i),c=[1,-1,1,1,1,1],h=[1,1,1,-1,-1,-1],p=this._renderer,f=p.autoClear,g=p.toneMapping;p.getClearColor(J0),p.toneMapping=sr,p.autoClear=!1,p.state.buffers.depth.getReversed()&&(p.setRenderTarget(r),p.clearDepth(),p.setRenderTarget(null)),this._backgroundBox===null&&(this._backgroundBox=new ze(new Ft,new Qc({name:"PMREM.Background",side:$n,depthWrite:!1,depthTest:!1})));const E=this._backgroundBox,_=E.material;let u=!1;const m=e.background;m?m.isColor&&(_.color.copy(m),e.background=null,u=!0):(_.color.copy(J0),u=!0);for(let M=0;M<6;M++){const y=M%3;y===0?(l.up.set(0,c[M],0),l.position.set(s.x,s.y,s.z),l.lookAt(s.x+h[M],s.y,s.z)):y===1?(l.up.set(0,0,c[M]),l.position.set(s.x,s.y,s.z),l.lookAt(s.x,s.y+h[M],s.z)):(l.up.set(0,c[M],0),l.position.set(s.x,s.y,s.z),l.lookAt(s.x,s.y,s.z+h[M]));const T=this._cubeSize;ra(r,y*T,M>2?T:0,T,T),p.setRenderTarget(r),u&&p.render(E,l),p.render(e,l)}p.toneMapping=g,p.autoClear=f,e.background=m}_textureToCubeUV(e,n){const i=this._renderer,r=e.mapping===Os||e.mapping===Ba;r?(this._cubemapMaterial===null&&(this._cubemapMaterial=ig()),this._cubemapMaterial.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=ng());const s=r?this._cubemapMaterial:this._equirectMaterial,a=this._lodMeshes[0];a.material=s;const o=s.uniforms;o.envMap.value=e;const l=this._cubeSize;ra(n,0,0,3*l,2*l),i.setRenderTarget(n),i.render(a,mo)}_applyPMREM(e){const n=this._renderer,i=n.autoClear;n.autoClear=!1;const r=this._lodMeshes.length;for(let s=1;s<r;s++)this._applyGGXFilter(e,s-1,s);n.autoClear=i}_applyGGXFilter(e,n,i){const r=this._renderer,s=this._pingPongRenderTarget,a=this._ggxMaterial,o=this._lodMeshes[i];o.material=a;const l=a.uniforms,c=i/(this._lodMeshes.length-1),h=n/(this._lodMeshes.length-1),p=Math.sqrt(c*c-h*h),f=c*1.25,g=p*f,{_lodMax:v}=this,E=this._sizeLods[i],_=3*E*(i>v-ya?i-v+ya:0),u=4*(this._cubeSize-E);l.envMap.value=e.texture,l.roughness.value=g,l.mipInt.value=v-n,ra(s,_,u,3*E,2*E),r.setRenderTarget(s),r.render(o,mo),l.envMap.value=s.texture,l.roughness.value=0,l.mipInt.value=v-i,ra(e,_,u,3*E,2*E),r.setRenderTarget(e),r.render(o,mo)}_blur(e,n,i,r){const s=this._pingPongRenderTarget,a=Math.min(r,Math.PI)/Math.SQRT2;this._blurPass(e,s,n,i,a),this._blurPass(s,e,i,i,a)}_blurPass(e,n,i,r,s){const a=this._renderer,o=this._blurMaterial,l=this._lodMeshes[r];l.material=o;const c=o.uniforms;c.envMap.value=e.texture,c.sigma.value=s,c.mipInt.value=this._lodMax-i;const h=this._sizeLods[r],p=3*h*(r>this._lodMax-ya?r-this._lodMax+ya:0),f=4*(this._cubeSize-h);ra(n,p,f,3*h,2*h),a.setRenderTarget(n),a.render(l,mo)}}function eA(t){const e=[],n=[];let i=t;const r=t-ya+1+KT;for(let s=0;s<r;s++){const a=Math.pow(2,i);e.push(a);const o=1/(a-2),l=-o,c=1+o,h=[l,l,c,l,c,c,l,l,c,c,l,c],p=6,f=6,g=3,v=new Float32Array(g*f*p),E=new Float32Array(g*f*p);for(let u=0;u<p;u++){const m=u%3*2/3-1,M=u>2?0:-1,y=[m,M,0,m+2/3,M,0,m+2/3,M+1,0,m,M,0,m+2/3,M+1,0,m,M+1,0];v.set(y,g*f*u);for(let T=0;T<f;T++){const w=h[T*2]*2-1,R=h[T*2+1]*2-1;u===0?Ss.set(1,R,w):u===1?Ss.set(-w,1,-R):u===2?Ss.set(-w,R,1):u===3?Ss.set(-1,R,-w):u===4?Ss.set(-w,-1,R):Ss.set(w,R,-1),Ss.toArray(E,(u*f+T)*g)}}const _=new qn;_.setAttribute("position",new Ar(v,g)),_.setAttribute("outputDirection",new Ar(E,g)),n.push(new ze(_,null)),i>ya&&i--}return{lodMeshes:n,sizeLods:e}}function tg(t,e,n){const i=new Oi(t,e,n);return i.texture.mapping=yu,i.texture.name="PMREM.cubeUv",i.scissorTest=!0,i}function ra(t,e,n,i,r){t.viewport.set(e,n,i,r),t.scissor.set(e,n,i,r)}function tA(t,e,n){return new lr({name:"PMREMGGXConvolution",defines:{GGX_SAMPLES:QT,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/n,CUBEUV_MAX_MIP:`${t}.0`},uniforms:{envMap:{value:null},roughness:{value:0},mipInt:{value:0}},vertexShader:Eu(),fragmentShader:`

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
		`,blending:wr,depthTest:!1,depthWrite:!1})}function nA(t,e,n){return new lr({name:"SphericalGaussianBlur",defines:{SAMPLES:ZT,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/n,CUBEUV_MAX_MIP:`${t}.0`},uniforms:{envMap:{value:null},sigma:{value:0},mipInt:{value:0}},vertexShader:Eu(),fragmentShader:`

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
		`,blending:wr,depthTest:!1,depthWrite:!1})}function ng(){return new lr({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:Eu(),fragmentShader:`

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
		`,blending:wr,depthTest:!1,depthWrite:!1})}function ig(){return new lr({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:Eu(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:wr,depthTest:!1,depthWrite:!1})}function Eu(){return`

		precision mediump float;
		precision mediump int;

		attribute vec3 outputDirection;

		varying vec3 vOutputDirection;

		void main() {

			vOutputDirection = outputDirection;
			gl_Position = vec4( position, 1.0 );

		}
	`}class Ax extends Oi{constructor(e=1,n={}){super(e,e,n),this.isWebGLCubeRenderTarget=!0;const i={width:e,height:e,depth:1},r=[i,i,i,i,i,i];this.texture=new xx(r),this._setTextureOptions(n),this.texture.isRenderTargetTexture=!0}fromEquirectangularTexture(e,n){this.texture.type=n.type,this.texture.colorSpace=n.colorSpace,this.texture.generateMipmaps=n.generateMipmaps,this.texture.minFilter=n.minFilter,this.texture.magFilter=n.magFilter;const i={uniforms:{tEquirect:{value:null}},vertexShader:`

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
			`},r=new Ft(5,5,5),s=new lr({name:"CubemapFromEquirect",uniforms:Ha(i.uniforms),vertexShader:i.vertexShader,fragmentShader:i.fragmentShader,side:$n,blending:wr});s.uniforms.tEquirect.value=n;const a=new ze(r,s),o=n.minFilter;return n.minFilter===bs&&(n.minFilter=An),new r1(1,10,this).update(e,a),n.minFilter=o,a.geometry.dispose(),a.material.dispose(),this}clear(e,n=!0,i=!0,r=!0){const s=e.getRenderTarget();for(let a=0;a<6;a++)e.setRenderTarget(this,a),e.clear(n,i,r);e.setRenderTarget(s)}}function iA(t){let e=new WeakMap,n=new WeakMap,i=null;function r(f,g=!1){return f==null?null:g?a(f):s(f)}function s(f){if(f&&f.isTexture){const g=f.mapping;if(g===sd||g===ad)if(e.has(f)){const v=e.get(f).texture;return o(v,f.mapping)}else{const v=f.image;if(v&&v.height>0){const E=new Ax(v.height);return E.fromEquirectangularTexture(t,f),e.set(f,E),f.addEventListener("dispose",c),o(E.texture,f.mapping)}else return null}}return f}function a(f){if(f&&f.isTexture){const g=f.mapping,v=g===sd||g===ad,E=g===Os||g===Ba;if(v||E){let _=n.get(f);const u=_!==void 0?_.texture.pmremVersion:0;if(f.isRenderTargetTexture&&f.pmremVersion!==u)return i===null&&(i=new eg(t)),_=v?i.fromEquirectangular(f,_):i.fromCubemap(f,_),_.texture.pmremVersion=f.pmremVersion,n.set(f,_),_.texture;if(_!==void 0)return _.texture;{const m=f.image;return v&&m&&m.height>0||E&&m&&l(m)?(i===null&&(i=new eg(t)),_=v?i.fromEquirectangular(f):i.fromCubemap(f),_.texture.pmremVersion=f.pmremVersion,n.set(f,_),f.addEventListener("dispose",h),_.texture):null}}}return f}function o(f,g){return g===sd?f.mapping=Os:g===ad&&(f.mapping=Ba),f}function l(f){let g=0;const v=6;for(let E=0;E<v;E++)f[E]!==void 0&&g++;return g===v}function c(f){const g=f.target;g.removeEventListener("dispose",c);const v=e.get(g);v!==void 0&&(e.delete(g),v.dispose())}function h(f){const g=f.target;g.removeEventListener("dispose",h);const v=n.get(g);v!==void 0&&(n.delete(g),v.dispose())}function p(){e=new WeakMap,n=new WeakMap,i!==null&&(i.dispose(),i=null)}return{get:r,dispose:p}}function rA(t){const e={};function n(i){if(e[i]!==void 0)return e[i];const r=t.getExtension(i);return e[i]=r,r}return{has:function(i){return n(i)!==null},init:function(){n("EXT_color_buffer_float"),n("WEBGL_clip_cull_distance"),n("OES_texture_float_linear"),n("EXT_color_buffer_half_float"),n("WEBGL_multisampled_render_to_texture"),n("WEBGL_render_shared_exponent")},get:function(i){const r=n(i);return r===null&&Ca("WebGLRenderer: "+i+" extension not supported."),r}}}function sA(t,e,n,i){const r={},s=new WeakMap;function a(p){const f=p.target;f.index!==null&&e.remove(f.index);for(const v in f.attributes)e.remove(f.attributes[v]);f.removeEventListener("dispose",a),delete r[f.id];const g=s.get(f);g&&(e.remove(g),s.delete(f)),i.releaseStatesOfGeometry(f),f.isInstancedBufferGeometry===!0&&delete f._maxInstanceCount,n.memory.geometries--}function o(p,f){return r[f.id]===!0||(f.addEventListener("dispose",a),r[f.id]=!0,n.memory.geometries++),f}function l(p){const f=p.attributes;for(const g in f)e.update(f[g],t.ARRAY_BUFFER)}function c(p){const f=[],g=p.index,v=p.attributes.position;let E=0;if(v===void 0)return;if(g!==null){const m=g.array;E=g.version;for(let M=0,y=m.length;M<y;M+=3){const T=m[M+0],w=m[M+1],R=m[M+2];f.push(T,w,w,R,R,T)}}else{const m=v.array;E=v.version;for(let M=0,y=m.length/3-1;M<y;M+=3){const T=M+0,w=M+1,R=M+2;f.push(T,w,w,R,R,T)}}const _=new(v.count>=65535?_x:gx)(f,1);_.version=E;const u=s.get(p);u&&e.remove(u),s.set(p,_)}function h(p){const f=s.get(p);if(f){const g=p.index;g!==null&&f.version<g.version&&c(p)}else c(p);return s.get(p)}return{get:o,update:l,getWireframeAttribute:h}}function aA(t,e,n){let i;function r(p){i=p}let s,a;function o(p){s=p.type,a=p.bytesPerElement}function l(p,f){t.drawElements(i,f,s,p*a),n.update(f,i,1)}function c(p,f,g){g!==0&&(t.drawElementsInstanced(i,f,s,p*a,g),n.update(f,i,g))}function h(p,f,g){if(g===0)return;e.get("WEBGL_multi_draw").multiDrawElementsWEBGL(i,f,0,s,p,0,g);let E=0;for(let _=0;_<g;_++)E+=f[_];n.update(E,i,1)}this.setMode=r,this.setIndex=o,this.render=l,this.renderInstances=c,this.renderMultiDraw=h}function oA(t){const e={geometries:0,textures:0},n={frame:0,calls:0,triangles:0,points:0,lines:0};function i(s,a,o){switch(n.calls++,a){case t.TRIANGLES:n.triangles+=o*(s/3);break;case t.LINES:n.lines+=o*(s/2);break;case t.LINE_STRIP:n.lines+=o*(s-1);break;case t.LINE_LOOP:n.lines+=o*s;break;case t.POINTS:n.points+=o*s;break;default:gt("WebGLInfo: Unknown draw mode:",a);break}}function r(){n.calls=0,n.triangles=0,n.points=0,n.lines=0}return{memory:e,render:n,programs:null,autoReset:!0,reset:r,update:i}}function lA(t,e,n){const i=new WeakMap,r=new Gt;function s(a,o,l){const c=a.morphTargetInfluences,h=o.morphAttributes.position||o.morphAttributes.normal||o.morphAttributes.color,p=h!==void 0?h.length:0;let f=i.get(o);if(f===void 0||f.count!==p){let P=function(){x.dispose(),i.delete(o),o.removeEventListener("dispose",P)};var g=P;f!==void 0&&f.texture.dispose();const v=o.morphAttributes.position!==void 0,E=o.morphAttributes.normal!==void 0,_=o.morphAttributes.color!==void 0,u=o.morphAttributes.position||[],m=o.morphAttributes.normal||[],M=o.morphAttributes.color||[];let y=0;v===!0&&(y=1),E===!0&&(y=2),_===!0&&(y=3);let T=o.attributes.position.count*y,w=1;T>e.maxTextureSize&&(w=Math.ceil(T/e.maxTextureSize),T=e.maxTextureSize);const R=new Float32Array(T*w*4*p),x=new px(R,T,w,p);x.type=tr,x.needsUpdate=!0;const A=y*4;for(let L=0;L<p;L++){const B=u[L],F=m[L],I=M[L],j=T*w*4*L;for(let N=0;N<B.count;N++){const H=N*A;v===!0&&(r.fromBufferAttribute(B,N),R[j+H+0]=r.x,R[j+H+1]=r.y,R[j+H+2]=r.z,R[j+H+3]=0),E===!0&&(r.fromBufferAttribute(F,N),R[j+H+4]=r.x,R[j+H+5]=r.y,R[j+H+6]=r.z,R[j+H+7]=0),_===!0&&(r.fromBufferAttribute(I,N),R[j+H+8]=r.x,R[j+H+9]=r.y,R[j+H+10]=r.z,R[j+H+11]=I.itemSize===4?r.w:1)}}f={count:p,texture:x,size:new je(T,w)},i.set(o,f),o.addEventListener("dispose",P)}if(a.isInstancedMesh===!0&&a.morphTexture!==null)l.getUniforms().setValue(t,"morphTexture",a.morphTexture,n);else{let v=0;for(let _=0;_<c.length;_++)v+=c[_];const E=o.morphTargetsRelative?1:1-v;l.getUniforms().setValue(t,"morphTargetBaseInfluence",E),l.getUniforms().setValue(t,"morphTargetInfluences",c)}l.getUniforms().setValue(t,"morphTargetsTexture",f.texture,n),l.getUniforms().setValue(t,"morphTargetsTextureSize",f.size)}return{update:s}}function cA(t,e,n,i,r){let s=new WeakMap;function a(c){const h=r.render.frame,p=c.geometry,f=e.get(c,p);if(s.get(f)!==h&&(e.update(f),s.set(f,h)),c.isInstancedMesh&&(c.hasEventListener("dispose",l)===!1&&c.addEventListener("dispose",l),s.get(c)!==h&&(n.update(c.instanceMatrix,t.ARRAY_BUFFER),c.instanceColor!==null&&n.update(c.instanceColor,t.ARRAY_BUFFER),s.set(c,h))),c.isSkinnedMesh){const g=c.skeleton;s.get(g)!==h&&(g.update(),s.set(g,h))}return f}function o(){s=new WeakMap}function l(c){const h=c.target;h.removeEventListener("dispose",l),i.releaseStatesOfObject(h),n.remove(h.instanceMatrix),h.instanceColor!==null&&n.remove(h.instanceColor)}return{update:a,dispose:o}}const uA={[Qv]:"LINEAR_TONE_MAPPING",[Jv]:"REINHARD_TONE_MAPPING",[ex]:"CINEON_TONE_MAPPING",[tx]:"ACES_FILMIC_TONE_MAPPING",[ix]:"AGX_TONE_MAPPING",[rx]:"NEUTRAL_TONE_MAPPING",[nx]:"CUSTOM_TONE_MAPPING"};function dA(t,e,n,i,r,s){const a=new Oi(e,n,{type:t,depthBuffer:r,stencilBuffer:s,samples:i?4:0,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,resolveDepthBuffer:!1,resolveStencilBuffer:!1});let o=null,l=null;const c=new qn;c.setAttribute("position",new Zt([-1,3,0,-1,-1,0,3,-1,0],3)),c.setAttribute("uv",new Zt([0,2,0,0,2,0],2));const h=new QE({uniforms:{tDiffuse:{value:null}},vertexShader:`
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
			}`,depthTest:!1,depthWrite:!1}),p=new ze(c,h),f=new Bp(-1,1,1,-1,0,1);let g=null,v=null,E=!1,_,u=null,m=[],M=!1;this.setSize=function(y,T){a.setSize(y,T),o!==null&&o.setSize(y,T),l!==null&&l.setSize(y,T);for(let w=0;w<m.length;w++){const R=m[w];R.setSize&&R.setSize(y,T)}},this.setEffects=function(y){m=y,M=m.length>0&&m[0].isRenderPass===!0;const T=a.width,w=a.height;m.length>0&&o===null&&(o=new Oi(T,w,{type:or,depthBuffer:!1,stencilBuffer:!1}),l=new Oi(T,w,{type:or,depthBuffer:!1,stencilBuffer:!1}));for(let R=0;R<m.length;R++){const x=m[R];x.setSize&&x.setSize(T,w)}},this.begin=function(y,T){if(E||y.toneMapping===sr&&m.length===0)return!1;if(u=T,T!==null){const w=T.width,R=T.height;(a.width!==w||a.height!==R)&&this.setSize(w,R)}return M===!1&&y.setRenderTarget(a),_=y.toneMapping,y.toneMapping=sr,!0},this.hasRenderPass=function(){return M},this.end=function(y,T){y.toneMapping=_,E=!0;let w=a,R=o;for(let x=0;x<m.length;x++){const A=m[x];A.enabled!==!1&&(A.render(y,R,w,T),A.needsSwap!==!1&&(w=R,R=R===o?l:o))}if(g!==y.outputColorSpace||v!==y.toneMapping){g=y.outputColorSpace,v=y.toneMapping,h.defines={},ft.getTransfer(g)===Tt&&(h.defines.SRGB_TRANSFER="");const x=uA[v];x&&(h.defines[x]=""),h.needsUpdate=!0}h.uniforms.tDiffuse.value=w.texture,y.setRenderTarget(u),y.render(p,f),u=null,E=!1},this.isCompositing=function(){return E},this.dispose=function(){a.dispose(),o!==null&&o.dispose(),l!==null&&l.dispose(),c.dispose(),h.dispose()}}const bx=new bn,Mh=new il(1,1),Rx=new px,Cx=new TE,Px=new xx,rg=[],sg=[],ag=new Float32Array(16),og=new Float32Array(9),lg=new Float32Array(4);function Xa(t,e,n){const i=t[0];if(i<=0||i>0)return t;const r=e*n;let s=rg[r];if(s===void 0&&(s=new Float32Array(r),rg[r]=s),e!==0){i.toArray(s,0);for(let a=1,o=0;a!==e;++a)o+=n,t[a].toArray(s,o)}return s}function an(t,e){if(t.length!==e.length)return!1;for(let n=0,i=t.length;n<i;n++)if(t[n]!==e[n])return!1;return!0}function on(t,e){for(let n=0,i=e.length;n<i;n++)t[n]=e[n]}function wu(t,e){let n=sg[e];n===void 0&&(n=new Int32Array(e),sg[e]=n);for(let i=0;i!==e;++i)n[i]=t.allocateTextureUnit();return n}function fA(t,e){const n=this.cache;n[0]!==e&&(t.uniform1f(this.addr,e),n[0]=e)}function hA(t,e){const n=this.cache;if(e.x!==void 0)(n[0]!==e.x||n[1]!==e.y)&&(t.uniform2f(this.addr,e.x,e.y),n[0]=e.x,n[1]=e.y);else{if(an(n,e))return;t.uniform2fv(this.addr,e),on(n,e)}}function pA(t,e){const n=this.cache;if(e.x!==void 0)(n[0]!==e.x||n[1]!==e.y||n[2]!==e.z)&&(t.uniform3f(this.addr,e.x,e.y,e.z),n[0]=e.x,n[1]=e.y,n[2]=e.z);else if(e.r!==void 0)(n[0]!==e.r||n[1]!==e.g||n[2]!==e.b)&&(t.uniform3f(this.addr,e.r,e.g,e.b),n[0]=e.r,n[1]=e.g,n[2]=e.b);else{if(an(n,e))return;t.uniform3fv(this.addr,e),on(n,e)}}function mA(t,e){const n=this.cache;if(e.x!==void 0)(n[0]!==e.x||n[1]!==e.y||n[2]!==e.z||n[3]!==e.w)&&(t.uniform4f(this.addr,e.x,e.y,e.z,e.w),n[0]=e.x,n[1]=e.y,n[2]=e.z,n[3]=e.w);else{if(an(n,e))return;t.uniform4fv(this.addr,e),on(n,e)}}function gA(t,e){const n=this.cache,i=e.elements;if(i===void 0){if(an(n,e))return;t.uniformMatrix2fv(this.addr,!1,e),on(n,e)}else{if(an(n,i))return;lg.set(i),t.uniformMatrix2fv(this.addr,!1,lg),on(n,i)}}function _A(t,e){const n=this.cache,i=e.elements;if(i===void 0){if(an(n,e))return;t.uniformMatrix3fv(this.addr,!1,e),on(n,e)}else{if(an(n,i))return;og.set(i),t.uniformMatrix3fv(this.addr,!1,og),on(n,i)}}function vA(t,e){const n=this.cache,i=e.elements;if(i===void 0){if(an(n,e))return;t.uniformMatrix4fv(this.addr,!1,e),on(n,e)}else{if(an(n,i))return;ag.set(i),t.uniformMatrix4fv(this.addr,!1,ag),on(n,i)}}function xA(t,e){const n=this.cache;n[0]!==e&&(t.uniform1i(this.addr,e),n[0]=e)}function yA(t,e){const n=this.cache;if(e.x!==void 0)(n[0]!==e.x||n[1]!==e.y)&&(t.uniform2i(this.addr,e.x,e.y),n[0]=e.x,n[1]=e.y);else{if(an(n,e))return;t.uniform2iv(this.addr,e),on(n,e)}}function SA(t,e){const n=this.cache;if(e.x!==void 0)(n[0]!==e.x||n[1]!==e.y||n[2]!==e.z)&&(t.uniform3i(this.addr,e.x,e.y,e.z),n[0]=e.x,n[1]=e.y,n[2]=e.z);else{if(an(n,e))return;t.uniform3iv(this.addr,e),on(n,e)}}function MA(t,e){const n=this.cache;if(e.x!==void 0)(n[0]!==e.x||n[1]!==e.y||n[2]!==e.z||n[3]!==e.w)&&(t.uniform4i(this.addr,e.x,e.y,e.z,e.w),n[0]=e.x,n[1]=e.y,n[2]=e.z,n[3]=e.w);else{if(an(n,e))return;t.uniform4iv(this.addr,e),on(n,e)}}function EA(t,e){const n=this.cache;n[0]!==e&&(t.uniform1ui(this.addr,e),n[0]=e)}function wA(t,e){const n=this.cache;if(e.x!==void 0)(n[0]!==e.x||n[1]!==e.y)&&(t.uniform2ui(this.addr,e.x,e.y),n[0]=e.x,n[1]=e.y);else{if(an(n,e))return;t.uniform2uiv(this.addr,e),on(n,e)}}function TA(t,e){const n=this.cache;if(e.x!==void 0)(n[0]!==e.x||n[1]!==e.y||n[2]!==e.z)&&(t.uniform3ui(this.addr,e.x,e.y,e.z),n[0]=e.x,n[1]=e.y,n[2]=e.z);else{if(an(n,e))return;t.uniform3uiv(this.addr,e),on(n,e)}}function AA(t,e){const n=this.cache;if(e.x!==void 0)(n[0]!==e.x||n[1]!==e.y||n[2]!==e.z||n[3]!==e.w)&&(t.uniform4ui(this.addr,e.x,e.y,e.z,e.w),n[0]=e.x,n[1]=e.y,n[2]=e.z,n[3]=e.w);else{if(an(n,e))return;t.uniform4uiv(this.addr,e),on(n,e)}}function bA(t,e,n){const i=this.cache,r=n.allocateTextureUnit();i[0]!==r&&(t.uniform1i(this.addr,r),i[0]=r);let s;this.type===t.SAMPLER_2D_SHADOW?(Mh.compareFunction=n.isReversedDepthBuffer()?Np:Pp,s=Mh):s=bx,n.setTexture2D(e||s,r)}function RA(t,e,n){const i=this.cache,r=n.allocateTextureUnit();i[0]!==r&&(t.uniform1i(this.addr,r),i[0]=r),n.setTexture3D(e||Cx,r)}function CA(t,e,n){const i=this.cache,r=n.allocateTextureUnit();i[0]!==r&&(t.uniform1i(this.addr,r),i[0]=r),n.setTextureCube(e||Px,r)}function PA(t,e,n){const i=this.cache,r=n.allocateTextureUnit();i[0]!==r&&(t.uniform1i(this.addr,r),i[0]=r),n.setTexture2DArray(e||Rx,r)}function NA(t){switch(t){case 5126:return fA;case 35664:return hA;case 35665:return pA;case 35666:return mA;case 35674:return gA;case 35675:return _A;case 35676:return vA;case 5124:case 35670:return xA;case 35667:case 35671:return yA;case 35668:case 35672:return SA;case 35669:case 35673:return MA;case 5125:return EA;case 36294:return wA;case 36295:return TA;case 36296:return AA;case 35678:case 36198:case 36298:case 36306:case 35682:return bA;case 35679:case 36299:case 36307:return RA;case 35680:case 36300:case 36308:case 36293:return CA;case 36289:case 36303:case 36311:case 36292:return PA}}function LA(t,e){t.uniform1fv(this.addr,e)}function DA(t,e){const n=Xa(e,this.size,2);t.uniform2fv(this.addr,n)}function IA(t,e){const n=Xa(e,this.size,3);t.uniform3fv(this.addr,n)}function UA(t,e){const n=Xa(e,this.size,4);t.uniform4fv(this.addr,n)}function FA(t,e){const n=Xa(e,this.size,4);t.uniformMatrix2fv(this.addr,!1,n)}function OA(t,e){const n=Xa(e,this.size,9);t.uniformMatrix3fv(this.addr,!1,n)}function kA(t,e){const n=Xa(e,this.size,16);t.uniformMatrix4fv(this.addr,!1,n)}function BA(t,e){t.uniform1iv(this.addr,e)}function zA(t,e){t.uniform2iv(this.addr,e)}function HA(t,e){t.uniform3iv(this.addr,e)}function VA(t,e){t.uniform4iv(this.addr,e)}function GA(t,e){t.uniform1uiv(this.addr,e)}function WA(t,e){t.uniform2uiv(this.addr,e)}function jA(t,e){t.uniform3uiv(this.addr,e)}function XA(t,e){t.uniform4uiv(this.addr,e)}function $A(t,e,n){const i=this.cache,r=e.length,s=wu(n,r);an(i,s)||(t.uniform1iv(this.addr,s),on(i,s));let a;this.type===t.SAMPLER_2D_SHADOW?a=Mh:a=bx;for(let o=0;o!==r;++o)n.setTexture2D(e[o]||a,s[o])}function qA(t,e,n){const i=this.cache,r=e.length,s=wu(n,r);an(i,s)||(t.uniform1iv(this.addr,s),on(i,s));for(let a=0;a!==r;++a)n.setTexture3D(e[a]||Cx,s[a])}function YA(t,e,n){const i=this.cache,r=e.length,s=wu(n,r);an(i,s)||(t.uniform1iv(this.addr,s),on(i,s));for(let a=0;a!==r;++a)n.setTextureCube(e[a]||Px,s[a])}function KA(t,e,n){const i=this.cache,r=e.length,s=wu(n,r);an(i,s)||(t.uniform1iv(this.addr,s),on(i,s));for(let a=0;a!==r;++a)n.setTexture2DArray(e[a]||Rx,s[a])}function ZA(t){switch(t){case 5126:return LA;case 35664:return DA;case 35665:return IA;case 35666:return UA;case 35674:return FA;case 35675:return OA;case 35676:return kA;case 5124:case 35670:return BA;case 35667:case 35671:return zA;case 35668:case 35672:return HA;case 35669:case 35673:return VA;case 5125:return GA;case 36294:return WA;case 36295:return jA;case 36296:return XA;case 35678:case 36198:case 36298:case 36306:case 35682:return $A;case 35679:case 36299:case 36307:return qA;case 35680:case 36300:case 36308:case 36293:return YA;case 36289:case 36303:case 36311:case 36292:return KA}}class QA{constructor(e,n,i){this.id=e,this.addr=i,this.cache=[],this.type=n.type,this.setValue=NA(n.type)}}class JA{constructor(e,n,i){this.id=e,this.addr=i,this.cache=[],this.type=n.type,this.size=n.size,this.setValue=ZA(n.type)}}class eb{constructor(e){this.id=e,this.seq=[],this.map={}}setValue(e,n,i){const r=this.seq;for(let s=0,a=r.length;s!==a;++s){const o=r[s];o.setValue(e,n[o.id],i)}}}const Od=/(\w+)(\])?(\[|\.)?/g;function cg(t,e){t.seq.push(e),t.map[e.id]=e}function tb(t,e,n){const i=t.name,r=i.length;for(Od.lastIndex=0;;){const s=Od.exec(i),a=Od.lastIndex;let o=s[1];const l=s[2]==="]",c=s[3];if(l&&(o=o|0),c===void 0||c==="["&&a+2===r){cg(n,c===void 0?new QA(o,t,e):new JA(o,t,e));break}else{let p=n.map[o];p===void 0&&(p=new eb(o),cg(n,p)),n=p}}}class Mc{constructor(e,n){this.seq=[],this.map={};const i=e.getProgramParameter(n,e.ACTIVE_UNIFORMS);for(let a=0;a<i;++a){const o=e.getActiveUniform(n,a),l=e.getUniformLocation(n,o.name);tb(o,l,this)}const r=[],s=[];for(const a of this.seq)a.type===e.SAMPLER_2D_SHADOW||a.type===e.SAMPLER_CUBE_SHADOW||a.type===e.SAMPLER_2D_ARRAY_SHADOW?r.push(a):s.push(a);r.length>0&&(this.seq=r.concat(s))}setValue(e,n,i,r){const s=this.map[n];s!==void 0&&s.setValue(e,i,r)}setOptional(e,n,i){const r=n[i];r!==void 0&&this.setValue(e,i,r)}static upload(e,n,i,r){for(let s=0,a=n.length;s!==a;++s){const o=n[s],l=i[o.id];l.needsUpdate!==!1&&o.setValue(e,l.value,r)}}static seqWithValue(e,n){const i=[];for(let r=0,s=e.length;r!==s;++r){const a=e[r];a.id in n&&i.push(a)}return i}}function ug(t,e,n){const i=t.createShader(e);return t.shaderSource(i,n),t.compileShader(i),i}const nb=37297;let ib=0;function rb(t,e){const n=t.split(`
`),i=[],r=Math.max(e-6,0),s=Math.min(e+6,n.length);for(let a=r;a<s;a++){const o=a+1;i.push(`${o===e?">":" "} ${o}: ${n[a]}`)}return i.join(`
`)}const dg=new Ye;function sb(t){ft._getMatrix(dg,ft.workingColorSpace,t);const e=`mat3( ${dg.elements.map(n=>n.toFixed(4))} )`;switch(ft.getTransfer(t)){case Kc:return[e,"LinearTransferOETF"];case Tt:return[e,"sRGBTransferOETF"];default:return Ge("WebGLProgram: Unsupported color space: ",t),[e,"LinearTransferOETF"]}}function fg(t,e,n){const i=t.getShaderParameter(e,t.COMPILE_STATUS),s=(t.getShaderInfoLog(e)||"").trim();if(i&&s==="")return"";const a=/ERROR: 0:(\d+)/.exec(s);if(a){const o=parseInt(a[1]);return n.toUpperCase()+`

`+s+`

`+rb(t.getShaderSource(e),o)}else return s}function ab(t,e){const n=sb(e);return[`vec4 ${t}( vec4 value ) {`,`	return ${n[1]}( vec4( value.rgb * ${n[0]}, value.a ) );`,"}"].join(`
`)}const ob={[Qv]:"Linear",[Jv]:"Reinhard",[ex]:"Cineon",[tx]:"ACESFilmic",[ix]:"AgX",[rx]:"Neutral",[nx]:"Custom"};function lb(t,e){const n=ob[e];return n===void 0?(Ge("WebGLProgram: Unsupported toneMapping:",e),"vec3 "+t+"( vec3 color ) { return LinearToneMapping( color ); }"):"vec3 "+t+"( vec3 color ) { return "+n+"ToneMapping( color ); }"}const ic=new D;function cb(){ft.getLuminanceCoefficients(ic);const t=ic.x.toFixed(4),e=ic.y.toFixed(4),n=ic.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${t}, ${e}, ${n} );`,"	return dot( weights, rgb );","}"].join(`
`)}function ub(t){return[t.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",t.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(Mo).join(`
`)}function db(t){const e=[];for(const n in t){const i=t[n];i!==!1&&e.push("#define "+n+" "+i)}return e.join(`
`)}function fb(t,e){const n={},i=t.getProgramParameter(e,t.ACTIVE_ATTRIBUTES);for(let r=0;r<i;r++){const s=t.getActiveAttrib(e,r),a=s.name;let o=1;s.type===t.FLOAT_MAT2&&(o=2),s.type===t.FLOAT_MAT3&&(o=3),s.type===t.FLOAT_MAT4&&(o=4),n[a]={type:s.type,location:t.getAttribLocation(e,a),locationSize:o}}return n}function Mo(t){return t!==""}function hg(t,e){const n=e.numSpotLightShadows+e.numSpotLightMaps-e.numSpotLightShadowsWithMaps;return t.replace(/NUM_SUN_LIGHTS/g,e.numSunLights).replace(/NUM_DIR_LIGHTS/g,e.numDirLights).replace(/NUM_SPOT_LIGHTS/g,e.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,e.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,n).replace(/NUM_RECT_AREA_LIGHTS/g,e.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,e.numPointLights).replace(/NUM_HEMI_LIGHTS/g,e.numHemiLights).replace(/NUM_SUN_LIGHT_SHADOWS/g,e.numSunLightShadows).replace(/NUM_DIR_LIGHT_SHADOWS/g,e.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,e.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,e.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,e.numPointLightShadows)}function pg(t,e){return t.replace(/NUM_CLIPPING_PLANES/g,e.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,e.numClippingPlanes-e.numClipIntersection)}const hb=/^[ \t]*#include +<([\w\d./]+)>/gm;function Eh(t){return t.replace(hb,mb)}const pb=new Map;function mb(t,e){let n=tt[e];if(n===void 0){const i=pb.get(e);if(i!==void 0)n=tt[i],Ge('WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',e,i);else throw new Error("THREE.WebGLProgram: Can not resolve #include <"+e+">")}return Eh(n)}const gb=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function mg(t){return t.replace(gb,_b)}function _b(t,e,n,i){let r="";for(let s=parseInt(e);s<parseInt(n);s++)r+=i.replace(/\[\s*i\s*\]/g,"[ "+s+" ]").replace(/UNROLLED_LOOP_INDEX/g,s);return r}function gg(t){let e=`precision ${t.precision} float;
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
#define LOW_PRECISION`),e}const vb={[Do]:"SHADOWMAP_TYPE_PCF",[So]:"SHADOWMAP_TYPE_VSM"};function xb(t){return vb[t.shadowMapType]||"SHADOWMAP_TYPE_BASIC"}const yb={[Os]:"ENVMAP_TYPE_CUBE",[Ba]:"ENVMAP_TYPE_CUBE",[yu]:"ENVMAP_TYPE_CUBE_UV"};function Sb(t){return t.envMap===!1?"ENVMAP_TYPE_CUBE":yb[t.envMapMode]||"ENVMAP_TYPE_CUBE"}const Mb={[Ba]:"ENVMAP_MODE_REFRACTION"};function Eb(t){return t.envMap===!1?"ENVMAP_MODE_REFLECTION":Mb[t.envMapMode]||"ENVMAP_MODE_REFLECTION"}const wb={[Zv]:"ENVMAP_BLENDING_MULTIPLY",[tE]:"ENVMAP_BLENDING_MIX",[nE]:"ENVMAP_BLENDING_ADD"};function Tb(t){return t.envMap===!1?"ENVMAP_BLENDING_NONE":wb[t.combine]||"ENVMAP_BLENDING_NONE"}function Ab(t){const e=t.envMapCubeUVHeight;if(e===null)return null;const n=Math.log2(e)-2,i=1/e;return{texelWidth:1/(3*Math.max(Math.pow(2,n),7*16)),texelHeight:i,maxMip:n}}function bb(t,e,n,i){const r=t.getContext(),s=n.defines;let a=n.vertexShader,o=n.fragmentShader;const l=xb(n),c=Sb(n),h=Eb(n),p=Tb(n),f=Ab(n),g=ub(n),v=db(s),E=r.createProgram();let _,u,m=n.glslVersion?"#version "+n.glslVersion+`
`:"";n.isRawShaderMaterial?(_=["#define SHADER_TYPE "+n.shaderType,"#define SHADER_NAME "+n.shaderName,v].filter(Mo).join(`
`),_.length>0&&(_+=`
`),u=["#define SHADER_TYPE "+n.shaderType,"#define SHADER_NAME "+n.shaderName,v].filter(Mo).join(`
`),u.length>0&&(u+=`
`)):(_=[gg(n),"#define SHADER_TYPE "+n.shaderType,"#define SHADER_NAME "+n.shaderName,v,n.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",n.batching?"#define USE_BATCHING":"",n.batchingColor?"#define USE_BATCHING_COLOR":"",n.instancing?"#define USE_INSTANCING":"",n.instancingColor?"#define USE_INSTANCING_COLOR":"",n.instancingMorph?"#define USE_INSTANCING_MORPH":"",n.useFog&&n.fog?"#define USE_FOG":"",n.useFog&&n.fogExp2?"#define FOG_EXP2":"",n.map?"#define USE_MAP":"",n.envMap?"#define USE_ENVMAP":"",n.envMap?"#define "+h:"",n.lightMap?"#define USE_LIGHTMAP":"",n.aoMap?"#define USE_AOMAP":"",n.bumpMap?"#define USE_BUMPMAP":"",n.normalMap?"#define USE_NORMALMAP":"",n.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",n.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",n.displacementMap?"#define USE_DISPLACEMENTMAP":"",n.emissiveMap?"#define USE_EMISSIVEMAP":"",n.anisotropy?"#define USE_ANISOTROPY":"",n.anisotropyMap?"#define USE_ANISOTROPYMAP":"",n.clearcoatMap?"#define USE_CLEARCOATMAP":"",n.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",n.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",n.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",n.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",n.specularMap?"#define USE_SPECULARMAP":"",n.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",n.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",n.roughnessMap?"#define USE_ROUGHNESSMAP":"",n.metalnessMap?"#define USE_METALNESSMAP":"",n.alphaMap?"#define USE_ALPHAMAP":"",n.alphaHash?"#define USE_ALPHAHASH":"",n.transmission?"#define USE_TRANSMISSION":"",n.transmissionMap?"#define USE_TRANSMISSIONMAP":"",n.thicknessMap?"#define USE_THICKNESSMAP":"",n.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",n.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",n.mapUv?"#define MAP_UV "+n.mapUv:"",n.alphaMapUv?"#define ALPHAMAP_UV "+n.alphaMapUv:"",n.lightMapUv?"#define LIGHTMAP_UV "+n.lightMapUv:"",n.aoMapUv?"#define AOMAP_UV "+n.aoMapUv:"",n.emissiveMapUv?"#define EMISSIVEMAP_UV "+n.emissiveMapUv:"",n.bumpMapUv?"#define BUMPMAP_UV "+n.bumpMapUv:"",n.normalMapUv?"#define NORMALMAP_UV "+n.normalMapUv:"",n.displacementMapUv?"#define DISPLACEMENTMAP_UV "+n.displacementMapUv:"",n.metalnessMapUv?"#define METALNESSMAP_UV "+n.metalnessMapUv:"",n.roughnessMapUv?"#define ROUGHNESSMAP_UV "+n.roughnessMapUv:"",n.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+n.anisotropyMapUv:"",n.clearcoatMapUv?"#define CLEARCOATMAP_UV "+n.clearcoatMapUv:"",n.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+n.clearcoatNormalMapUv:"",n.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+n.clearcoatRoughnessMapUv:"",n.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+n.iridescenceMapUv:"",n.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+n.iridescenceThicknessMapUv:"",n.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+n.sheenColorMapUv:"",n.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+n.sheenRoughnessMapUv:"",n.specularMapUv?"#define SPECULARMAP_UV "+n.specularMapUv:"",n.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+n.specularColorMapUv:"",n.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+n.specularIntensityMapUv:"",n.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+n.transmissionMapUv:"",n.thicknessMapUv?"#define THICKNESSMAP_UV "+n.thicknessMapUv:"",n.vertexTangents&&n.flatShading===!1?"#define USE_TANGENT":"",n.vertexNormals?"#define HAS_NORMAL":"",n.vertexColors?"#define USE_COLOR":"",n.vertexAlphas?"#define USE_COLOR_ALPHA":"",n.vertexUv1s?"#define USE_UV1":"",n.vertexUv2s?"#define USE_UV2":"",n.vertexUv3s?"#define USE_UV3":"",n.pointsUvs?"#define USE_POINTS_UV":"",n.flatShading?"#define FLAT_SHADED":"",n.skinning?"#define USE_SKINNING":"",n.morphTargets?"#define USE_MORPHTARGETS":"",n.morphNormals&&n.flatShading===!1?"#define USE_MORPHNORMALS":"",n.morphColors?"#define USE_MORPHCOLORS":"",n.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+n.morphTextureStride:"",n.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+n.morphTargetsCount:"",n.doubleSided?"#define DOUBLE_SIDED":"",n.flipSided?"#define FLIP_SIDED":"",n.shadowMapEnabled?"#define USE_SHADOWMAP":"",n.shadowMapEnabled?"#define "+l:"",n.sizeAttenuation?"#define USE_SIZEATTENUATION":"",n.numLightProbes>0?"#define USE_LIGHT_PROBES":"",n.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",n.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(Mo).join(`
`),u=[gg(n),"#define SHADER_TYPE "+n.shaderType,"#define SHADER_NAME "+n.shaderName,v,n.useFog&&n.fog?"#define USE_FOG":"",n.useFog&&n.fogExp2?"#define FOG_EXP2":"",n.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",n.map?"#define USE_MAP":"",n.matcap?"#define USE_MATCAP":"",n.envMap?"#define USE_ENVMAP":"",n.envMap?"#define "+c:"",n.envMap?"#define "+h:"",n.envMap?"#define "+p:"",f?"#define CUBEUV_TEXEL_WIDTH "+f.texelWidth:"",f?"#define CUBEUV_TEXEL_HEIGHT "+f.texelHeight:"",f?"#define CUBEUV_MAX_MIP "+f.maxMip+".0":"",n.lightMap?"#define USE_LIGHTMAP":"",n.aoMap?"#define USE_AOMAP":"",n.bumpMap?"#define USE_BUMPMAP":"",n.normalMap?"#define USE_NORMALMAP":"",n.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",n.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",n.packedNormalMap?"#define USE_PACKED_NORMALMAP":"",n.emissiveMap?"#define USE_EMISSIVEMAP":"",n.anisotropy?"#define USE_ANISOTROPY":"",n.anisotropyMap?"#define USE_ANISOTROPYMAP":"",n.clearcoat?"#define USE_CLEARCOAT":"",n.clearcoatMap?"#define USE_CLEARCOATMAP":"",n.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",n.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",n.dispersion?"#define USE_DISPERSION":"",n.retroreflection?"#define USE_RETROREFLECTION":"",n.iridescence?"#define USE_IRIDESCENCE":"",n.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",n.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",n.specularMap?"#define USE_SPECULARMAP":"",n.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",n.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",n.roughnessMap?"#define USE_ROUGHNESSMAP":"",n.metalnessMap?"#define USE_METALNESSMAP":"",n.alphaMap?"#define USE_ALPHAMAP":"",n.alphaTest?"#define USE_ALPHATEST":"",n.alphaHash?"#define USE_ALPHAHASH":"",n.sheen?"#define USE_SHEEN":"",n.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",n.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",n.transmission?"#define USE_TRANSMISSION":"",n.transmissionMap?"#define USE_TRANSMISSIONMAP":"",n.thicknessMap?"#define USE_THICKNESSMAP":"",n.vertexTangents&&n.flatShading===!1?"#define USE_TANGENT":"",n.vertexColors||n.instancingColor?"#define USE_COLOR":"",n.vertexAlphas||n.batchingColor?"#define USE_COLOR_ALPHA":"",n.vertexUv1s?"#define USE_UV1":"",n.vertexUv2s?"#define USE_UV2":"",n.vertexUv3s?"#define USE_UV3":"",n.pointsUvs?"#define USE_POINTS_UV":"",n.gradientMap?"#define USE_GRADIENTMAP":"",n.flatShading?"#define FLAT_SHADED":"",n.doubleSided?"#define DOUBLE_SIDED":"",n.flipSided?"#define FLIP_SIDED":"",n.shadowMapEnabled?"#define USE_SHADOWMAP":"",n.shadowMapEnabled?"#define "+l:"",n.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",n.numLightProbes>0?"#define USE_LIGHT_PROBES":"",n.numLightProbeGrids>0?"#define USE_LIGHT_PROBES_GRID":"",n.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",n.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",n.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",n.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",n.toneMapping!==sr?"#define TONE_MAPPING":"",n.toneMapping!==sr?tt.tonemapping_pars_fragment:"",n.toneMapping!==sr?lb("toneMapping",n.toneMapping):"",n.dithering?"#define DITHERING":"",n.opaque?"#define OPAQUE":"",tt.colorspace_pars_fragment,ab("linearToOutputTexel",n.outputColorSpace),cb(),n.useDepthPacking?"#define DEPTH_PACKING "+n.depthPacking:"",`
`].filter(Mo).join(`
`)),a=Eh(a),a=hg(a,n),a=pg(a,n),o=Eh(o),o=hg(o,n),o=pg(o,n),a=mg(a),o=mg(o),n.isRawShaderMaterial!==!0&&(m=`#version 300 es
`,_=[g,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+_,u=["#define varying in",n.glslVersion===y0?"":"layout(location = 0) out highp vec4 pc_fragColor;",n.glslVersion===y0?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+u);const M=m+_+a,y=m+u+o,T=ug(r,r.VERTEX_SHADER,M),w=ug(r,r.FRAGMENT_SHADER,y);r.attachShader(E,T),r.attachShader(E,w),n.index0AttributeName!==void 0?r.bindAttribLocation(E,0,n.index0AttributeName):n.hasPositionAttribute===!0&&r.bindAttribLocation(E,0,"position"),r.linkProgram(E);function R(L){if(t.debug.checkShaderErrors){const B=r.getProgramInfoLog(E)||"",F=r.getShaderInfoLog(T)||"",I=r.getShaderInfoLog(w)||"",j=B.trim(),N=F.trim(),H=I.trim();let V=!0,G=!0;if(r.getProgramParameter(E,r.LINK_STATUS)===!1)if(V=!1,typeof t.debug.onShaderError=="function")t.debug.onShaderError(r,E,T,w);else{const X=fg(r,T,"vertex"),ne=fg(r,w,"fragment");gt("WebGLProgram: Shader Error "+r.getError()+" - VALIDATE_STATUS "+r.getProgramParameter(E,r.VALIDATE_STATUS)+`

Material Name: `+L.name+`
Material Type: `+L.type+`

Program Info Log: `+j+`
`+X+`
`+ne)}else j!==""?Ge("WebGLProgram: Program Info Log:",j):(N===""||H==="")&&(G=!1);G&&(L.diagnostics={runnable:V,programLog:j,vertexShader:{log:N,prefix:_},fragmentShader:{log:H,prefix:u}})}r.deleteShader(T),r.deleteShader(w),x=new Mc(r,E),A=fb(r,E)}let x;this.getUniforms=function(){return x===void 0&&R(this),x};let A;this.getAttributes=function(){return A===void 0&&R(this),A};let P=n.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return P===!1&&(P=r.getProgramParameter(E,nb)),P},this.destroy=function(){i.releaseStatesOfProgram(this),r.deleteProgram(E),this.program=void 0},this.type=n.shaderType,this.name=n.shaderName,this.id=ib++,this.cacheKey=e,this.usedTimes=1,this.program=E,this.vertexShader=T,this.fragmentShader=w,this}let Rb=0;class Cb{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(e,n,i){const r=this._getShaderCacheForMaterial(e);return r.has(n)===!1&&(r.add(n),n.usedTimes++),r.has(i)===!1&&(r.add(i),i.usedTimes++),this}remove(e){const n=this.materialCache.get(e);for(const i of n)i.usedTimes--,i.usedTimes===0&&this.shaderCache.delete(i.code);return this.materialCache.delete(e),this}getVertexShaderStage(e){return this._getShaderStage(e.vertexShader)}getFragmentShaderStage(e){return this._getShaderStage(e.fragmentShader)}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(e){const n=this.materialCache;let i=n.get(e);return i===void 0&&(i=new Set,n.set(e,i)),i}_getShaderStage(e){const n=this.shaderCache;let i=n.get(e);return i===void 0&&(i=new Pb(e),n.set(e,i)),i}}class Pb{constructor(e){this.id=Rb++,this.code=e,this.usedTimes=0}}function Nb(t){return t===ks||t===$c||t===qc}function Lb(t,e,n,i,r,s){const a=new Dp,o=new Cb,l=new Set,c=[],h=new Map,p=i.logarithmicDepthBuffer;let f=i.precision;const g={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distance",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function v(x){return l.add(x),x===0?"uv":`uv${x}`}function E(x,A,P,L,B,F){const I=L.fog,j=B.geometry,N=x.isMeshStandardMaterial||x.isMeshLambertMaterial||x.isMeshPhongMaterial?L.environment:null,H=x.isMeshStandardMaterial||x.isMeshLambertMaterial&&!x.envMap||x.isMeshPhongMaterial&&!x.envMap,V=e.get(x.envMap||N,H),G=V&&V.mapping===yu?V.image.height:null,X=g[x.type];x.precision!==null&&(f=i.getMaxPrecision(x.precision),f!==x.precision&&Ge("WebGLProgram.getParameters:",x.precision,"not supported, using",f,"instead."));const ne=j.morphAttributes.position||j.morphAttributes.normal||j.morphAttributes.color,ve=ne!==void 0?ne.length:0;let Pe=0;j.morphAttributes.position!==void 0&&(Pe=1),j.morphAttributes.normal!==void 0&&(Pe=2),j.morphAttributes.color!==void 0&&(Pe=3);let Je,$e,Ke,Z;if(X){const pt=Zi[X];Je=pt.vertexShader,$e=pt.fragmentShader}else{Je=x.vertexShader,$e=x.fragmentShader;const pt=o.getVertexShaderStage(x),nt=o.getFragmentShaderStage(x);o.update(x,pt,nt),Ke=pt.id,Z=nt.id}const J=t.getRenderTarget(),Ne=t.state.buffers.depth.getReversed(),We=B.isInstancedMesh===!0,Re=B.isBatchedMesh===!0,Ze=!!x.map,Be=!!x.matcap,et=!!V,ot=!!x.aoMap,yt=!!x.lightMap,it=!!x.bumpMap&&x.wireframe===!1,Pt=!!x.normalMap,Bt=!!x.displacementMap,pn=!!x.emissiveMap,Rt=!!x.metalnessMap,zt=!!x.roughnessMap,k=x.anisotropy>0,qt=x.clearcoat>0,ht=x.dispersion>0,C=x.retroreflectivity>0,S=x.iridescence>0,W=x.sheen>0,Y=x.transmission>0,ie=k&&!!x.anisotropyMap,de=qt&&!!x.clearcoatMap,ge=qt&&!!x.clearcoatNormalMap,re=qt&&!!x.clearcoatRoughnessMap,ae=S&&!!x.iridescenceMap,fe=S&&!!x.iridescenceThicknessMap,Fe=W&&!!x.sheenColorMap,xe=W&&!!x.sheenRoughnessMap,pe=!!x.specularMap,Oe=!!x.specularColorMap,ke=!!x.specularIntensityMap,qe=Y&&!!x.transmissionMap,O=Y&&!!x.thicknessMap,_e=!!x.gradientMap,ee=!!x.alphaMap,me=x.alphaTest>0,Se=!!x.alphaHash,se=!!x.extensions;let ye=sr;x.toneMapped&&(J===null||J.isXRRenderTarget===!0)&&(ye=t.toneMapping);const Ie={shaderID:X,shaderType:x.type,shaderName:x.name,vertexShader:Je,fragmentShader:$e,defines:x.defines,customVertexShaderID:Ke,customFragmentShaderID:Z,isRawShaderMaterial:x.isRawShaderMaterial===!0,glslVersion:x.glslVersion,precision:f,batching:Re,batchingColor:Re&&B._colorsTexture!==null,instancing:We,instancingColor:We&&B.instanceColor!==null,instancingMorph:We&&B.morphTexture!==null,outputColorSpace:J===null?t.outputColorSpace:J.isXRRenderTarget===!0?J.texture.colorSpace:ft.workingColorSpace,alphaToCoverage:!!x.alphaToCoverage,map:Ze,matcap:Be,envMap:et,envMapMode:et&&V.mapping,envMapCubeUVHeight:G,aoMap:ot,lightMap:yt,bumpMap:it,normalMap:Pt,displacementMap:Bt,emissiveMap:pn,normalMapObjectSpace:Pt&&x.normalMapType===sE,normalMapTangentSpace:Pt&&x.normalMapType===xh,packedNormalMap:Pt&&x.normalMapType===xh&&Nb(x.normalMap.format),metalnessMap:Rt,roughnessMap:zt,anisotropy:k,anisotropyMap:ie,clearcoat:qt,clearcoatMap:de,clearcoatNormalMap:ge,clearcoatRoughnessMap:re,dispersion:ht,retroreflection:C,iridescence:S,iridescenceMap:ae,iridescenceThicknessMap:fe,sheen:W,sheenColorMap:Fe,sheenRoughnessMap:xe,specularMap:pe,specularColorMap:Oe,specularIntensityMap:ke,transmission:Y,transmissionMap:qe,thicknessMap:O,gradientMap:_e,opaque:x.transparent===!1&&x.blending===Io&&x.alphaToCoverage===!1,alphaMap:ee,alphaTest:me,alphaHash:Se,combine:x.combine,mapUv:Ze&&v(x.map.channel),aoMapUv:ot&&v(x.aoMap.channel),lightMapUv:yt&&v(x.lightMap.channel),bumpMapUv:it&&v(x.bumpMap.channel),normalMapUv:Pt&&v(x.normalMap.channel),displacementMapUv:Bt&&v(x.displacementMap.channel),emissiveMapUv:pn&&v(x.emissiveMap.channel),metalnessMapUv:Rt&&v(x.metalnessMap.channel),roughnessMapUv:zt&&v(x.roughnessMap.channel),anisotropyMapUv:ie&&v(x.anisotropyMap.channel),clearcoatMapUv:de&&v(x.clearcoatMap.channel),clearcoatNormalMapUv:ge&&v(x.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:re&&v(x.clearcoatRoughnessMap.channel),iridescenceMapUv:ae&&v(x.iridescenceMap.channel),iridescenceThicknessMapUv:fe&&v(x.iridescenceThicknessMap.channel),sheenColorMapUv:Fe&&v(x.sheenColorMap.channel),sheenRoughnessMapUv:xe&&v(x.sheenRoughnessMap.channel),specularMapUv:pe&&v(x.specularMap.channel),specularColorMapUv:Oe&&v(x.specularColorMap.channel),specularIntensityMapUv:ke&&v(x.specularIntensityMap.channel),transmissionMapUv:qe&&v(x.transmissionMap.channel),thicknessMapUv:O&&v(x.thicknessMap.channel),alphaMapUv:ee&&v(x.alphaMap.channel),vertexTangents:!!j.attributes.tangent&&(Pt||k),vertexNormals:!!j.attributes.normal,vertexColors:x.vertexColors,vertexAlphas:x.vertexColors===!0&&!!j.attributes.color&&j.attributes.color.itemSize===4,pointsUvs:B.isPoints===!0&&!!j.attributes.uv&&(Ze||ee),fog:!!I,useFog:x.fog===!0,fogExp2:!!I&&I.isFogExp2,flatShading:x.wireframe===!1&&(x.flatShading===!0||j.attributes.normal===void 0&&Pt===!1&&(x.isMeshLambertMaterial||x.isMeshPhongMaterial||x.isMeshStandardMaterial||x.isMeshPhysicalMaterial)),sizeAttenuation:x.sizeAttenuation===!0,logarithmicDepthBuffer:p,reversedDepthBuffer:Ne,skinning:B.isSkinnedMesh===!0,hasPositionAttribute:j.attributes.position!==void 0,morphTargets:j.morphAttributes.position!==void 0,morphNormals:j.morphAttributes.normal!==void 0,morphColors:j.morphAttributes.color!==void 0,morphTargetsCount:ve,morphTextureStride:Pe,numSunLights:A.sun.length,numDirLights:A.directional.length,numPointLights:A.point.length,numSpotLights:A.spot.length,numSpotLightMaps:A.spotLightMap.length,numRectAreaLights:A.rectArea.length,numHemiLights:A.hemi.length,numSunLightShadows:A.sunShadowMap.length,numDirLightShadows:A.directionalShadowMap.length,numPointLightShadows:A.pointShadowMap.length,numSpotLightShadows:A.spotShadowMap.length,numSpotLightShadowsWithMaps:A.numSpotLightShadowsWithMaps,numLightProbes:A.numLightProbes,numLightProbeGrids:F.length,numClippingPlanes:s.numPlanes,numClipIntersection:s.numIntersection,dithering:x.dithering,shadowMapEnabled:t.shadowMap.enabled&&P.length>0,shadowMapType:t.shadowMap.type,toneMapping:ye,decodeVideoTexture:Ze&&x.map.isVideoTexture===!0&&ft.getTransfer(x.map.colorSpace)===Tt,decodeVideoTextureEmissive:pn&&x.emissiveMap.isVideoTexture===!0&&ft.getTransfer(x.emissiveMap.colorSpace)===Tt,premultipliedAlpha:x.premultipliedAlpha,doubleSided:x.side===Vn,flipSided:x.side===$n,useDepthPacking:x.depthPacking>=0,depthPacking:x.depthPacking||0,index0AttributeName:x.index0AttributeName,extensionClipCullDistance:se&&x.extensions.clipCullDistance===!0&&n.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(se&&x.extensions.multiDraw===!0||Re)&&n.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:n.has("KHR_parallel_shader_compile"),customProgramCacheKey:x.customProgramCacheKey()};return Ie.vertexUv1s=l.has(1),Ie.vertexUv2s=l.has(2),Ie.vertexUv3s=l.has(3),l.clear(),Ie}function _(x){const A=[];if(x.shaderID?A.push(x.shaderID):(A.push(x.customVertexShaderID),A.push(x.customFragmentShaderID)),x.defines!==void 0)for(const P in x.defines)A.push(P),A.push(x.defines[P]);return x.isRawShaderMaterial===!1&&(u(A,x),m(A,x),A.push(t.outputColorSpace)),A.push(x.customProgramCacheKey),A.join()}function u(x,A){x.push(A.precision),x.push(A.outputColorSpace),x.push(A.envMapMode),x.push(A.envMapCubeUVHeight),x.push(A.mapUv),x.push(A.alphaMapUv),x.push(A.lightMapUv),x.push(A.aoMapUv),x.push(A.bumpMapUv),x.push(A.normalMapUv),x.push(A.displacementMapUv),x.push(A.emissiveMapUv),x.push(A.metalnessMapUv),x.push(A.roughnessMapUv),x.push(A.anisotropyMapUv),x.push(A.clearcoatMapUv),x.push(A.clearcoatNormalMapUv),x.push(A.clearcoatRoughnessMapUv),x.push(A.iridescenceMapUv),x.push(A.iridescenceThicknessMapUv),x.push(A.sheenColorMapUv),x.push(A.sheenRoughnessMapUv),x.push(A.specularMapUv),x.push(A.specularColorMapUv),x.push(A.specularIntensityMapUv),x.push(A.transmissionMapUv),x.push(A.thicknessMapUv),x.push(A.combine),x.push(A.fogExp2),x.push(A.sizeAttenuation),x.push(A.morphTargetsCount),x.push(A.morphAttributeCount),x.push(A.numSunLights),x.push(A.numDirLights),x.push(A.numPointLights),x.push(A.numSpotLights),x.push(A.numSpotLightMaps),x.push(A.numHemiLights),x.push(A.numRectAreaLights),x.push(A.numSunLightShadows),x.push(A.numDirLightShadows),x.push(A.numPointLightShadows),x.push(A.numSpotLightShadows),x.push(A.numSpotLightShadowsWithMaps),x.push(A.numLightProbes),x.push(A.shadowMapType),x.push(A.toneMapping),x.push(A.numClippingPlanes),x.push(A.numClipIntersection),x.push(A.depthPacking)}function m(x,A){a.disableAll(),A.instancing&&a.enable(0),A.instancingColor&&a.enable(1),A.instancingMorph&&a.enable(2),A.matcap&&a.enable(3),A.envMap&&a.enable(4),A.normalMapObjectSpace&&a.enable(5),A.normalMapTangentSpace&&a.enable(6),A.clearcoat&&a.enable(7),A.iridescence&&a.enable(8),A.alphaTest&&a.enable(9),A.vertexColors&&a.enable(10),A.vertexAlphas&&a.enable(11),A.vertexUv1s&&a.enable(12),A.vertexUv2s&&a.enable(13),A.vertexUv3s&&a.enable(14),A.vertexTangents&&a.enable(15),A.anisotropy&&a.enable(16),A.alphaHash&&a.enable(17),A.batching&&a.enable(18),A.dispersion&&a.enable(19),A.retroreflection&&a.enable(24),A.batchingColor&&a.enable(20),A.gradientMap&&a.enable(21),A.packedNormalMap&&a.enable(22),A.vertexNormals&&a.enable(23),x.push(a.mask),a.disableAll(),A.fog&&a.enable(0),A.useFog&&a.enable(1),A.flatShading&&a.enable(2),A.logarithmicDepthBuffer&&a.enable(3),A.reversedDepthBuffer&&a.enable(4),A.skinning&&a.enable(5),A.morphTargets&&a.enable(6),A.morphNormals&&a.enable(7),A.morphColors&&a.enable(8),A.premultipliedAlpha&&a.enable(9),A.shadowMapEnabled&&a.enable(10),A.doubleSided&&a.enable(11),A.flipSided&&a.enable(12),A.useDepthPacking&&a.enable(13),A.dithering&&a.enable(14),A.transmission&&a.enable(15),A.sheen&&a.enable(16),A.opaque&&a.enable(17),A.pointsUvs&&a.enable(18),A.decodeVideoTexture&&a.enable(19),A.decodeVideoTextureEmissive&&a.enable(20),A.alphaToCoverage&&a.enable(21),A.numLightProbeGrids>0&&a.enable(22),A.hasPositionAttribute&&a.enable(23),x.push(a.mask)}function M(x){const A=g[x.type];let P;if(A){const L=Zi[A];P=YE.clone(L.uniforms)}else P=x.uniforms;return P}function y(x,A){let P=h.get(A);return P!==void 0?++P.usedTimes:(P=new bb(t,A,x,r),c.push(P),h.set(A,P)),P}function T(x){if(--x.usedTimes===0){const A=c.indexOf(x);c[A]=c[c.length-1],c.pop(),h.delete(x.cacheKey),x.destroy()}}function w(x){o.remove(x)}function R(){o.dispose()}return{getParameters:E,getProgramCacheKey:_,getUniforms:M,acquireProgram:y,releaseProgram:T,releaseShaderCache:w,programs:c,dispose:R}}function Db(){let t=new WeakMap;function e(a){return t.has(a)}function n(a){let o=t.get(a);return o===void 0&&(o={},t.set(a,o)),o}function i(a){t.delete(a)}function r(a,o,l){t.get(a)[o]=l}function s(){t=new WeakMap}return{has:e,get:n,remove:i,update:r,dispose:s}}function Ib(t,e){return t.groupOrder!==e.groupOrder?t.groupOrder-e.groupOrder:t.renderOrder!==e.renderOrder?t.renderOrder-e.renderOrder:t.material.id!==e.material.id?t.material.id-e.material.id:t.materialVariant!==e.materialVariant?t.materialVariant-e.materialVariant:t.z!==e.z?t.z-e.z:t.id-e.id}function _g(t,e){return t.groupOrder!==e.groupOrder?t.groupOrder-e.groupOrder:t.renderOrder!==e.renderOrder?t.renderOrder-e.renderOrder:t.z!==e.z?e.z-t.z:t.id-e.id}function vg(){const t=[];let e=0;const n=[],i=[],r=[];function s(){e=0,n.length=0,i.length=0,r.length=0}function a(f){let g=0;return f.isInstancedMesh&&(g+=2),f.isSkinnedMesh&&(g+=1),g}function o(f,g,v,E,_,u){let m=t[e];return m===void 0?(m={id:f.id,object:f,geometry:g,material:v,materialVariant:a(f),groupOrder:E,renderOrder:f.renderOrder,z:_,group:u},t[e]=m):(m.id=f.id,m.object=f,m.geometry=g,m.material=v,m.materialVariant=a(f),m.groupOrder=E,m.renderOrder=f.renderOrder,m.z=_,m.group=u),e++,m}function l(f,g,v,E,_,u,m){m.reversedDepth===!0&&(_=-_);const M=o(f,g,v,E,_,u);v.transmission>0?i.push(M):v.transparent===!0?r.push(M):n.push(M)}function c(f,g,v,E,_,u){const m=o(f,g,v,E,_,u);v.transmission>0?i.unshift(m):v.transparent===!0?r.unshift(m):n.unshift(m)}function h(f,g){n.length>1&&n.sort(f||Ib),i.length>1&&i.sort(g||_g),r.length>1&&r.sort(g||_g)}function p(){for(let f=e,g=t.length;f<g;f++){const v=t[f];if(v.id===null)break;v.id=null,v.object=null,v.geometry=null,v.material=null,v.group=null}}return{opaque:n,transmissive:i,transparent:r,init:s,push:l,unshift:c,finish:p,sort:h}}function Ub(){let t=new WeakMap;function e(i,r){const s=t.get(i);let a;return s===void 0?(a=new vg,t.set(i,[a])):r>=s.length?(a=new vg,s.push(a)):a=s[r],a}function n(){t=new WeakMap}return{get:e,dispose:n}}function Fb(){const t={};return{get:function(e){if(t[e.id]!==void 0)return t[e.id];let n;switch(e.type){case"SunLight":case"DirectionalLight":n={direction:new D,color:new dt};break;case"SpotLight":n={position:new D,direction:new D,color:new dt,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":n={position:new D,color:new dt,distance:0,decay:0};break;case"HemisphereLight":n={direction:new D,skyColor:new dt,groundColor:new dt};break;case"RectAreaLight":n={color:new dt,position:new D,halfWidth:new D,halfHeight:new D};break}return t[e.id]=n,n}}}function Ob(){const t={};return{get:function(e){if(t[e.id]!==void 0)return t[e.id];let n;switch(e.type){case"SunLight":case"DirectionalLight":n={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new je};break;case"SpotLight":n={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new je};break;case"PointLight":n={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new je,shadowCameraNear:1,shadowCameraFar:1e3};break}return t[e.id]=n,n}}}let kb=0;function Bb(t,e){return(e.castShadow?2:0)-(t.castShadow?2:0)+(e.map?1:0)-(t.map?1:0)}function zb(t){const e=new Fb,n=Ob(),i={version:0,hash:{sunLength:-1,directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numSunShadows:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],sun:[],sunShadow:[],sunShadowMap:[],sunShadowMatrix:[],sunShadowCascade:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let c=0;c<9;c++)i.probe.push(new D);const r=new D,s=new kt,a=new kt;function o(c){let h=0,p=0,f=0;for(let B=0;B<9;B++)i.probe[B].set(0,0,0);let g=0,v=0,E=0,_=0,u=0,m=0,M=0,y=0,T=0,w=0,R=0,x=0,A=0,P=0;c.sort(Bb);for(let B=0,F=c.length;B<F;B++){const I=c[B],j=I.color,N=I.intensity,H=I.distance;let V=null;if(I.shadow&&I.shadow.map&&(I.shadow.map.texture.format===ks?V=I.shadow.map.texture:V=I.shadow.map.depthTexture||I.shadow.map.texture),I.isAmbientLight)h+=j.r*N,p+=j.g*N,f+=j.b*N;else if(I.isLightProbe){for(let G=0;G<9;G++)i.probe[G].addScaledVector(I.sh.coefficients[G],N);P++}else if(I.isSunLight){const G=e.get(I);if(G.color.copy(I.color).multiplyScalar(I.intensity),I.castShadow){const X=I.shadow,ne=n.get(I);ne.shadowIntensity=X.intensity,ne.shadowBias=X.bias,ne.shadowNormalBias=X.normalBias,ne.shadowRadius=X.radius,ne.shadowMapSize.copy(X.mapSize).multiply(X.getFrameExtents()),i.sunShadow[v]=ne,i.sunShadowMap[v]=V;const ve=X.getViewportCount();for(let Pe=0;Pe<ve;Pe++)i.sunShadowMatrix[E+Pe]=X.getMatrix(Pe),i.sunShadowCascade[E+Pe]=X._cascadeData[Pe];E+=ve,v++}i.sun[g]=G,g++}else if(I.isDirectionalLight){const G=e.get(I);if(G.color.copy(I.color).multiplyScalar(I.intensity),I.castShadow){const X=I.shadow,ne=n.get(I);ne.shadowIntensity=X.intensity,ne.shadowBias=X.bias,ne.shadowNormalBias=X.normalBias,ne.shadowRadius=X.radius,ne.shadowMapSize=X.mapSize,i.directionalShadow[_]=ne,i.directionalShadowMap[_]=V,i.directionalShadowMatrix[_]=I.shadow.matrix,T++}i.directional[_]=G,_++}else if(I.isSpotLight){const G=e.get(I);G.position.setFromMatrixPosition(I.matrixWorld),G.color.copy(j).multiplyScalar(N),G.distance=H,G.coneCos=Math.cos(I.angle),G.penumbraCos=Math.cos(I.angle*(1-I.penumbra)),G.decay=I.decay,i.spot[m]=G;const X=I.shadow;if(I.map&&(i.spotLightMap[x]=I.map,x++,X.updateMatrices(I),I.castShadow&&A++),i.spotLightMatrix[m]=X.matrix,I.castShadow){const ne=n.get(I);ne.shadowIntensity=X.intensity,ne.shadowBias=X.bias,ne.shadowNormalBias=X.normalBias,ne.shadowRadius=X.radius,ne.shadowMapSize=X.mapSize,i.spotShadow[m]=ne,i.spotShadowMap[m]=V,R++}m++}else if(I.isRectAreaLight){const G=e.get(I);G.color.copy(j).multiplyScalar(N),G.halfWidth.set(I.width*.5,0,0),G.halfHeight.set(0,I.height*.5,0),i.rectArea[M]=G,M++}else if(I.isPointLight){const G=e.get(I);if(G.color.copy(I.color).multiplyScalar(I.intensity),G.distance=I.distance,G.decay=I.decay,I.castShadow){const X=I.shadow,ne=n.get(I);ne.shadowIntensity=X.intensity,ne.shadowBias=X.bias,ne.shadowNormalBias=X.normalBias,ne.shadowRadius=X.radius,ne.shadowMapSize=X.mapSize,ne.shadowCameraNear=X.camera.near,ne.shadowCameraFar=X.camera.far,i.pointShadow[u]=ne,i.pointShadowMap[u]=V,i.pointShadowMatrix[u]=I.shadow.matrix,w++}i.point[u]=G,u++}else if(I.isHemisphereLight){const G=e.get(I);G.skyColor.copy(I.color).multiplyScalar(N),G.groundColor.copy(I.groundColor).multiplyScalar(N),i.hemi[y]=G,y++}}M>0&&(t.has("OES_texture_float_linear")===!0?(i.rectAreaLTC1=Ee.LTC_FLOAT_1,i.rectAreaLTC2=Ee.LTC_FLOAT_2):(i.rectAreaLTC1=Ee.LTC_HALF_1,i.rectAreaLTC2=Ee.LTC_HALF_2)),i.ambient[0]=h,i.ambient[1]=p,i.ambient[2]=f;const L=i.hash;(L.sunLength!==g||L.directionalLength!==_||L.pointLength!==u||L.spotLength!==m||L.rectAreaLength!==M||L.hemiLength!==y||L.numSunShadows!==v||L.numDirectionalShadows!==T||L.numPointShadows!==w||L.numSpotShadows!==R||L.numSpotMaps!==x||L.numLightProbes!==P)&&(i.sun.length=g,i.directional.length=_,i.spot.length=m,i.rectArea.length=M,i.point.length=u,i.hemi.length=y,i.sunShadow.length=v,i.sunShadowMap.length=v,i.sunShadowMatrix.length=E,i.sunShadowCascade.length=E,i.directionalShadow.length=T,i.directionalShadowMap.length=T,i.directionalShadowMatrix.length=T,i.pointShadow.length=w,i.pointShadowMap.length=w,i.pointShadowMatrix.length=w,i.spotShadow.length=R,i.spotShadowMap.length=R,i.spotLightMatrix.length=R+x-A,i.spotLightMap.length=x,i.numSpotLightShadowsWithMaps=A,i.numLightProbes=P,L.sunLength=g,L.directionalLength=_,L.pointLength=u,L.spotLength=m,L.rectAreaLength=M,L.hemiLength=y,L.numSunShadows=v,L.numDirectionalShadows=T,L.numPointShadows=w,L.numSpotShadows=R,L.numSpotMaps=x,L.numLightProbes=P,i.version=kb++)}function l(c,h){let p=0,f=0,g=0,v=0,E=0,_=0;const u=h.matrixWorldInverse;for(let m=0,M=c.length;m<M;m++){const y=c[m];if(y.isSunLight){const T=i.sun[p];T.direction.setFromMatrixPosition(y.matrixWorld),T.direction.transformDirection(u),p++}else if(y.isDirectionalLight){const T=i.directional[f];T.direction.setFromMatrixPosition(y.matrixWorld),r.setFromMatrixPosition(y.target.matrixWorld),T.direction.sub(r),T.direction.transformDirection(u),f++}else if(y.isSpotLight){const T=i.spot[v];T.position.setFromMatrixPosition(y.matrixWorld),T.position.applyMatrix4(u),T.direction.setFromMatrixPosition(y.matrixWorld),r.setFromMatrixPosition(y.target.matrixWorld),T.direction.sub(r),T.direction.transformDirection(u),v++}else if(y.isRectAreaLight){const T=i.rectArea[E];T.position.setFromMatrixPosition(y.matrixWorld),T.position.applyMatrix4(u),a.identity(),s.copy(y.matrixWorld),s.premultiply(u),a.extractRotation(s),T.halfWidth.set(y.width*.5,0,0),T.halfHeight.set(0,y.height*.5,0),T.halfWidth.applyMatrix4(a),T.halfHeight.applyMatrix4(a),E++}else if(y.isPointLight){const T=i.point[g];T.position.setFromMatrixPosition(y.matrixWorld),T.position.applyMatrix4(u),g++}else if(y.isHemisphereLight){const T=i.hemi[_];T.direction.setFromMatrixPosition(y.matrixWorld),T.direction.transformDirection(u),_++}}}return{setup:o,setupView:l,state:i}}function xg(t){const e=new zb(t),n=[],i=[],r=[];function s(f){p.camera=f,n.length=0,i.length=0,r.length=0}function a(f){n.push(f)}function o(f){i.push(f)}function l(f){r.push(f)}function c(){e.setup(n)}function h(f){e.setupView(n,f)}const p={lightsArray:n,shadowsArray:i,lightProbeGridArray:r,camera:null,lights:e,transmissionRenderTarget:{},textureUnits:0};return{init:s,state:p,setupLights:c,setupLightsView:h,pushLight:a,pushShadow:o,pushLightProbeGrid:l}}function Hb(t){let e=new WeakMap;function n(r,s=0){const a=e.get(r);let o;return a===void 0?(o=new xg(t),e.set(r,[o])):s>=a.length?(o=new xg(t),a.push(o)):o=a[s],o}function i(){e=new WeakMap}return{get:n,dispose:i}}const Vb=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,Gb=`uniform sampler2D shadow_pass;
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
}`,Wb=[new D(1,0,0),new D(-1,0,0),new D(0,1,0),new D(0,-1,0),new D(0,0,1),new D(0,0,-1)],jb=[new D(0,-1,0),new D(0,-1,0),new D(0,0,1),new D(0,0,-1),new D(0,-1,0),new D(0,-1,0)],yg=new kt,go=new D,kd=new D;function Xb(t,e,n){let i=new Up;const r=new je,s=new je,a=new Gt,o=new JE,l=new e1,c={},h=n.maxTextureSize,p={[Fs]:$n,[$n]:Fs,[Vn]:Vn},f=new lr({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new je},radius:{value:4}},vertexShader:Vb,fragmentShader:Gb}),g=f.clone();g.defines.HORIZONTAL_PASS=1;const v=new qn;v.setAttribute("position",new Ar(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));const E=new ze(v,f),_=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=Do;let u=this.type;this.render=function(w,R,x){if(_.enabled===!1||_.autoUpdate===!1&&_.needsUpdate===!1||w.length===0)return;this.type===FM&&(Ge("WebGLShadowMap: PCFSoftShadowMap has been removed. Using PCFShadowMap instead."),this.type=Do);const A=t.getRenderTarget(),P=t.getActiveCubeFace(),L=t.getActiveMipmapLevel(),B=t.state;B.setBlending(wr),B.buffers.depth.getReversed()===!0?B.buffers.color.setClear(0,0,0,0):B.buffers.color.setClear(1,1,1,1),B.buffers.depth.setTest(!0),B.setScissorTest(!1);const F=u!==this.type;F&&R.traverse(function(I){I.material&&(Array.isArray(I.material)?I.material.forEach(j=>j.needsUpdate=!0):I.material.needsUpdate=!0)});for(let I=0,j=w.length;I<j;I++){const N=w[I],H=N.shadow;if(H===void 0){Ge("WebGLShadowMap:",N,"has no shadow.");continue}if(H.autoUpdate===!1&&H.needsUpdate===!1)continue;r.copy(H.mapSize);const V=H.getFrameExtents();r.multiply(V),s.copy(H.mapSize),(r.x>h||r.y>h)&&(r.x>h&&(s.x=Math.floor(h/V.x),r.x=s.x*V.x,H.mapSize.x=s.x),r.y>h&&(s.y=Math.floor(h/V.y),r.y=s.y*V.y,H.mapSize.y=s.y));const G=t.state.buffers.depth.getReversed();if(H.camera._reversedDepth=G,H.map===null||F===!0){if(H.map!==null&&(H.map.depthTexture!==null&&(H.map.depthTexture.dispose(),H.map.depthTexture=null),H.map.dispose()),this.type===So){if(N.isPointLight){Ge("WebGLShadowMap: VSM shadow maps are not supported for PointLights. Use PCF or BasicShadowMap instead.");continue}H.map=new Oi(r.x,r.y,{format:ks,type:or,minFilter:An,magFilter:An,generateMipmaps:!1}),H.map.texture.name=N.name+".shadowMap",H.map.depthTexture=new il(r.x,r.y,tr),H.map.depthTexture.name=N.name+".shadowMapDepth",H.map.depthTexture.format=Nr,H.map.depthTexture.compareFunction=null,H.map.depthTexture.minFilter=gn,H.map.depthTexture.magFilter=gn}else N.isPointLight?(H.map=new Ax(r.x),H.map.depthTexture=new XE(r.x,ar)):(H.map=new Oi(r.x,r.y),H.map.depthTexture=new il(r.x,r.y,ar)),H.map.depthTexture.name=N.name+".shadowMap",H.map.depthTexture.format=Nr,this.type===Do?(H.map.depthTexture.compareFunction=G?Np:Pp,H.map.depthTexture.minFilter=An,H.map.depthTexture.magFilter=An):(H.map.depthTexture.compareFunction=null,H.map.depthTexture.minFilter=gn,H.map.depthTexture.magFilter=gn);H.camera.updateProjectionMatrix()}H.map.isWebGLCubeRenderTarget!==!0&&(H.map.width!==r.x||H.map.height!==r.y)&&H.map.setSize(r.x,r.y);const X=H.map.isWebGLCubeRenderTarget?6:H.getViewportCount();N.isPointLight!==!0&&H.updateMatrices(N,x);for(let ne=0;ne<X;ne++){const ve=H.getCamera(ne);if(N.isPointLight){const Pe=H.camera,Je=H.matrix,$e=N.distance||Pe.far;$e!==Pe.far&&(Pe.far=$e,Pe.updateProjectionMatrix()),go.setFromMatrixPosition(N.matrixWorld),Pe.position.copy(go),kd.copy(Pe.position),kd.add(Wb[ne]),Pe.up.copy(jb[ne]),Pe.lookAt(kd),Pe.updateMatrixWorld(),Je.makeTranslation(-go.x,-go.y,-go.z),yg.multiplyMatrices(Pe.projectionMatrix,Pe.matrixWorldInverse),H._frustum.setFromProjectionMatrix(yg,Pe.coordinateSystem,Pe.reversedDepth)}if(H.map.isWebGLCubeRenderTarget)t.setRenderTarget(H.map,ne),t.clear();else{ne===0&&(t.setRenderTarget(H.map),t.clear());const Pe=H.getViewport(ne);a.set(s.x*Pe.x,s.y*Pe.y,s.x*Pe.z,s.y*Pe.w),B.viewport(a)}i=H.getFrustum(ne),y(R,x,ve,N,this.type)}H.isPointLightShadow!==!0&&this.type===So&&m(H,x),H.needsUpdate=!1}u=this.type,_.needsUpdate=!1,t.setRenderTarget(A,P,L)};function m(w,R){const x=e.update(E);f.defines.VSM_SAMPLES!==w.blurSamples&&(f.defines.VSM_SAMPLES=w.blurSamples,g.defines.VSM_SAMPLES=w.blurSamples,f.needsUpdate=!0,g.needsUpdate=!0),w.mapPass===null?w.mapPass=new Oi(r.x,r.y,{format:ks,type:or}):(w.mapPass.width!==w.map.width||w.mapPass.height!==w.map.height)&&w.mapPass.setSize(w.map.width,w.map.height),f.uniforms.shadow_pass.value=w.map.depthTexture,f.uniforms.resolution.value.set(w.map.width,w.map.height),f.uniforms.radius.value=w.radius,t.setRenderTarget(w.mapPass),t.clear(),t.renderBufferDirect(R,null,x,f,E,null),g.uniforms.shadow_pass.value=w.mapPass.texture,g.uniforms.resolution.value.set(w.map.width,w.map.height),g.uniforms.radius.value=w.radius,t.setRenderTarget(w.map),t.clear(),t.renderBufferDirect(R,null,x,g,E,null)}function M(w,R,x,A){let P=null;const L=x.isPointLight===!0?w.customDistanceMaterial:w.customDepthMaterial;if(L!==void 0)P=L;else if(P=x.isPointLight===!0?l:o,t.localClippingEnabled&&R.clipShadows===!0&&Array.isArray(R.clippingPlanes)&&R.clippingPlanes.length!==0||R.displacementMap&&R.displacementScale!==0||R.alphaMap&&R.alphaTest>0||R.map&&R.alphaTest>0||R.alphaToCoverage===!0){const B=P.uuid,F=R.uuid;let I=c[B];I===void 0&&(I={},c[B]=I);let j=I[F];j===void 0&&(j=P.clone(),I[F]=j,R.addEventListener("dispose",T)),P=j}if(P.visible=R.visible,P.wireframe=R.wireframe,A===So?P.side=R.shadowSide!==null?R.shadowSide:R.side:P.side=R.shadowSide!==null?R.shadowSide:p[R.side],P.alphaMap=R.alphaMap,P.alphaTest=R.alphaToCoverage===!0?.5:R.alphaTest,P.map=R.map,P.clipShadows=R.clipShadows,P.clippingPlanes=R.clippingPlanes,P.clipIntersection=R.clipIntersection,P.displacementMap=R.displacementMap,P.displacementScale=R.displacementScale,P.displacementBias=R.displacementBias,P.wireframeLinewidth=R.wireframeLinewidth,P.linewidth=R.linewidth,x.isPointLight===!0&&P.isMeshDistanceMaterial===!0){const B=t.properties.get(P);B.light=x}return P}function y(w,R,x,A,P){if(w.visible===!1)return;if(w.layers.test(R.layers)&&(w.isMesh||w.isLine||w.isPoints)&&(w.castShadow||w.receiveShadow&&P===So)&&(!w.frustumCulled||w.intersectsFrustum(i))){w.modelViewMatrix.multiplyMatrices(x.matrixWorldInverse,w.matrixWorld);const F=e.update(w),I=w.material;if(Array.isArray(I)){const j=F.groups;for(let N=0,H=j.length;N<H;N++){const V=j[N],G=I[V.materialIndex];if(G&&G.visible){const X=M(w,G,A,P);w.onBeforeShadow(t,w,R,x,F,X,V),t.renderBufferDirect(x,null,F,X,w,V),w.onAfterShadow(t,w,R,x,F,X,V)}}}else if(I.visible){const j=M(w,I,A,P);w.onBeforeShadow(t,w,R,x,F,j,null),t.renderBufferDirect(x,null,F,j,w,null),w.onAfterShadow(t,w,R,x,F,j,null)}}const B=w.children;for(let F=0,I=B.length;F<I;F++)y(B[F],R,x,A,P)}function T(w){w.target.removeEventListener("dispose",T);for(const x in c){const A=c[x],P=w.target.uuid;P in A&&(A[P].dispose(),delete A[P])}}}function $b(t,e){function n(){let O=!1;const _e=new Gt;let ee=null;const me=new Gt(0,0,0,0);return{setMask:function(Se){ee!==Se&&!O&&(t.colorMask(Se,Se,Se,Se),ee=Se)},setLocked:function(Se){O=Se},setClear:function(Se,se,ye,Ie,pt){pt===!0&&(Se*=Ie,se*=Ie,ye*=Ie),_e.set(Se,se,ye,Ie),me.equals(_e)===!1&&(t.clearColor(Se,se,ye,Ie),me.copy(_e))},reset:function(){O=!1,ee=null,me.set(-1,0,0,0)}}}function i(){let O=!1,_e=!1,ee=null,me=null,Se=null;return{setReversed:function(se){if(_e!==se){const ye=e.get("EXT_clip_control");se?ye.clipControlEXT(ye.LOWER_LEFT_EXT,ye.ZERO_TO_ONE_EXT):ye.clipControlEXT(ye.LOWER_LEFT_EXT,ye.NEGATIVE_ONE_TO_ONE_EXT),_e=se;const Ie=Se;Se=null,this.setClear(Ie)}},getReversed:function(){return _e},setTest:function(se){se?J(t.DEPTH_TEST):Ne(t.DEPTH_TEST)},setMask:function(se){ee!==se&&!O&&(t.depthMask(se),ee=se)},setFunc:function(se){if(_e&&(se=_E[se]),me!==se){switch(se){case If:t.depthFunc(t.NEVER);break;case Uf:t.depthFunc(t.ALWAYS);break;case Ff:t.depthFunc(t.LESS);break;case Jo:t.depthFunc(t.LEQUAL);break;case Of:t.depthFunc(t.EQUAL);break;case kf:t.depthFunc(t.GEQUAL);break;case Bf:t.depthFunc(t.GREATER);break;case zf:t.depthFunc(t.NOTEQUAL);break;default:t.depthFunc(t.LEQUAL)}me=se}},setLocked:function(se){O=se},setClear:function(se){Se!==se&&(Se=se,_e&&(se=1-se),t.clearDepth(se))},reset:function(){O=!1,ee=null,me=null,Se=null,_e=!1}}}function r(){let O=!1,_e=null,ee=null,me=null,Se=null,se=null,ye=null,Ie=null,pt=null;return{setTest:function(nt){O||(nt?J(t.STENCIL_TEST):Ne(t.STENCIL_TEST))},setMask:function(nt){_e!==nt&&!O&&(t.stencilMask(nt),_e=nt)},setFunc:function(nt,Cn,Fn){(ee!==nt||me!==Cn||Se!==Fn)&&(t.stencilFunc(nt,Cn,Fn),ee=nt,me=Cn,Se=Fn)},setOp:function(nt,Cn,Fn){(se!==nt||ye!==Cn||Ie!==Fn)&&(t.stencilOp(nt,Cn,Fn),se=nt,ye=Cn,Ie=Fn)},setLocked:function(nt){O=nt},setClear:function(nt){pt!==nt&&(t.clearStencil(nt),pt=nt)},reset:function(){O=!1,_e=null,ee=null,me=null,Se=null,se=null,ye=null,Ie=null,pt=null}}}const s=new n,a=new i,o=new r,l=new WeakMap,c=new WeakMap;let h={},p={},f={},g=new WeakMap,v=[],E=null,_=!1,u=null,m=null,M=null,y=null,T=null,w=null,R=null,x=new dt(0,0,0),A=0,P=!1,L=null,B=null,F=null,I=null,j=null;const N=t.getParameter(t.MAX_COMBINED_TEXTURE_IMAGE_UNITS);let H=!1,V=0;const G=t.getParameter(t.VERSION);G.indexOf("WebGL")!==-1?(V=parseFloat(/^WebGL (\d)/.exec(G)[1]),H=V>=1):G.indexOf("OpenGL ES")!==-1&&(V=parseFloat(/^OpenGL ES (\d)/.exec(G)[1]),H=V>=2);let X=null,ne={};const ve=t.getParameter(t.SCISSOR_BOX),Pe=t.getParameter(t.VIEWPORT),Je=new Gt().fromArray(ve),$e=new Gt().fromArray(Pe);function Ke(O,_e,ee,me){const Se=new Uint8Array(4),se=t.createTexture();t.bindTexture(O,se),t.texParameteri(O,t.TEXTURE_MIN_FILTER,t.NEAREST),t.texParameteri(O,t.TEXTURE_MAG_FILTER,t.NEAREST);for(let ye=0;ye<ee;ye++)O===t.TEXTURE_3D||O===t.TEXTURE_2D_ARRAY?t.texImage3D(_e,0,t.RGBA,1,1,me,0,t.RGBA,t.UNSIGNED_BYTE,Se):t.texImage2D(_e+ye,0,t.RGBA,1,1,0,t.RGBA,t.UNSIGNED_BYTE,Se);return se}const Z={};Z[t.TEXTURE_2D]=Ke(t.TEXTURE_2D,t.TEXTURE_2D,1),Z[t.TEXTURE_CUBE_MAP]=Ke(t.TEXTURE_CUBE_MAP,t.TEXTURE_CUBE_MAP_POSITIVE_X,6),Z[t.TEXTURE_2D_ARRAY]=Ke(t.TEXTURE_2D_ARRAY,t.TEXTURE_2D_ARRAY,1,1),Z[t.TEXTURE_3D]=Ke(t.TEXTURE_3D,t.TEXTURE_3D,1,1),s.setClear(0,0,0,1),a.setClear(1),o.setClear(0),J(t.DEPTH_TEST),a.setFunc(Jo),it(!1),Pt(g0),J(t.CULL_FACE),ot(wr);function J(O){h[O]!==!0&&(t.enable(O),h[O]=!0)}function Ne(O){h[O]!==!1&&(t.disable(O),h[O]=!1)}function We(O,_e){return f[O]!==_e?(t.bindFramebuffer(O,_e),f[O]=_e,O===t.DRAW_FRAMEBUFFER&&(f[t.FRAMEBUFFER]=_e),O===t.FRAMEBUFFER&&(f[t.DRAW_FRAMEBUFFER]=_e),!0):!1}function Re(O,_e){let ee=v,me=!1;if(O){ee=g.get(_e),ee===void 0&&(ee=[],g.set(_e,ee));const Se=O.textures;if(ee.length!==Se.length||ee[0]!==t.COLOR_ATTACHMENT0){for(let se=0,ye=Se.length;se<ye;se++)ee[se]=t.COLOR_ATTACHMENT0+se;ee.length=Se.length,me=!0}}else ee[0]!==t.BACK&&(ee[0]=t.BACK,me=!0);me&&t.drawBuffers(ee)}function Ze(O){return E!==O?(t.useProgram(O),E=O,!0):!1}const Be={[aa]:t.FUNC_ADD,[kM]:t.FUNC_SUBTRACT,[BM]:t.FUNC_REVERSE_SUBTRACT};Be[zM]=t.MIN,Be[HM]=t.MAX;const et={[VM]:t.ZERO,[GM]:t.ONE,[WM]:t.SRC_COLOR,[Yv]:t.SRC_ALPHA,[KM]:t.SRC_ALPHA_SATURATE,[qM]:t.DST_COLOR,[XM]:t.DST_ALPHA,[jM]:t.ONE_MINUS_SRC_COLOR,[Kv]:t.ONE_MINUS_SRC_ALPHA,[YM]:t.ONE_MINUS_DST_COLOR,[$M]:t.ONE_MINUS_DST_ALPHA,[ZM]:t.CONSTANT_COLOR,[QM]:t.ONE_MINUS_CONSTANT_COLOR,[JM]:t.CONSTANT_ALPHA,[eE]:t.ONE_MINUS_CONSTANT_ALPHA};function ot(O,_e,ee,me,Se,se,ye,Ie,pt,nt){if(O===wr){_===!0&&(Ne(t.BLEND),_=!1);return}if(_===!1&&(J(t.BLEND),_=!0),O!==OM){if(O!==u||nt!==P){if((m!==aa||T!==aa)&&(t.blendEquation(t.FUNC_ADD),m=aa,T=aa),nt)switch(O){case Io:t.blendFuncSeparate(t.ONE,t.ONE_MINUS_SRC_ALPHA,t.ONE,t.ONE_MINUS_SRC_ALPHA);break;case _0:t.blendFunc(t.ONE,t.ONE);break;case v0:t.blendFuncSeparate(t.ZERO,t.ONE_MINUS_SRC_COLOR,t.ZERO,t.ONE);break;case x0:t.blendFuncSeparate(t.DST_COLOR,t.ONE_MINUS_SRC_ALPHA,t.ZERO,t.ONE);break;default:gt("WebGLState: Invalid blending: ",O);break}else switch(O){case Io:t.blendFuncSeparate(t.SRC_ALPHA,t.ONE_MINUS_SRC_ALPHA,t.ONE,t.ONE_MINUS_SRC_ALPHA);break;case _0:t.blendFuncSeparate(t.SRC_ALPHA,t.ONE,t.ONE,t.ONE);break;case v0:gt("WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true");break;case x0:gt("WebGLState: MultiplyBlending requires material.premultipliedAlpha = true");break;default:gt("WebGLState: Invalid blending: ",O);break}M=null,y=null,w=null,R=null,x.set(0,0,0),A=0,u=O,P=nt}return}Se=Se||_e,se=se||ee,ye=ye||me,(_e!==m||Se!==T)&&(t.blendEquationSeparate(Be[_e],Be[Se]),m=_e,T=Se),(ee!==M||me!==y||se!==w||ye!==R)&&(t.blendFuncSeparate(et[ee],et[me],et[se],et[ye]),M=ee,y=me,w=se,R=ye),(Ie.equals(x)===!1||pt!==A)&&(t.blendColor(Ie.r,Ie.g,Ie.b,pt),x.copy(Ie),A=pt),u=O,P=!1}function yt(O,_e){O.side===Vn?Ne(t.CULL_FACE):J(t.CULL_FACE);let ee=O.side===$n;_e&&(ee=!ee),it(ee),O.blending===Io&&O.transparent===!1?ot(wr):ot(O.blending,O.blendEquation,O.blendSrc,O.blendDst,O.blendEquationAlpha,O.blendSrcAlpha,O.blendDstAlpha,O.blendColor,O.blendAlpha,O.premultipliedAlpha),a.setFunc(O.depthFunc),a.setTest(O.depthTest),a.setMask(O.depthWrite),s.setMask(O.colorWrite);const me=O.stencilWrite;o.setTest(me),me&&(o.setMask(O.stencilWriteMask),o.setFunc(O.stencilFunc,O.stencilRef,O.stencilFuncMask),o.setOp(O.stencilFail,O.stencilZFail,O.stencilZPass)),pn(O.polygonOffset,O.polygonOffsetFactor,O.polygonOffsetUnits),O.alphaToCoverage===!0?J(t.SAMPLE_ALPHA_TO_COVERAGE):Ne(t.SAMPLE_ALPHA_TO_COVERAGE)}function it(O){L!==O&&(O?t.frontFace(t.CW):t.frontFace(t.CCW),L=O)}function Pt(O){O!==IM?(J(t.CULL_FACE),O!==B&&(O===g0?t.cullFace(t.BACK):O===UM?t.cullFace(t.FRONT):t.cullFace(t.FRONT_AND_BACK))):Ne(t.CULL_FACE),B=O}function Bt(O){O!==F&&(H&&t.lineWidth(O),F=O)}function pn(O,_e,ee){O?(J(t.POLYGON_OFFSET_FILL),(I!==_e||j!==ee)&&(I=_e,j=ee,a.getReversed()&&(_e=-_e),t.polygonOffset(_e,ee))):Ne(t.POLYGON_OFFSET_FILL)}function Rt(O){O?J(t.SCISSOR_TEST):Ne(t.SCISSOR_TEST)}function zt(O){O===void 0&&(O=t.TEXTURE0+N-1),X!==O&&(t.activeTexture(O),X=O)}function k(O,_e,ee){ee===void 0&&(X===null?ee=t.TEXTURE0+N-1:ee=X);let me=ne[ee];me===void 0&&(me={type:void 0,texture:void 0},ne[ee]=me),(me.type!==O||me.texture!==_e)&&(X!==ee&&(t.activeTexture(ee),X=ee),t.bindTexture(O,_e||Z[O]),me.type=O,me.texture=_e)}function qt(){const O=ne[X];O!==void 0&&O.type!==void 0&&(t.bindTexture(O.type,null),O.type=void 0,O.texture=void 0)}function ht(){try{t.compressedTexImage2D(...arguments)}catch(O){gt("WebGLState:",O)}}function C(){try{t.compressedTexImage3D(...arguments)}catch(O){gt("WebGLState:",O)}}function S(){try{t.texSubImage2D(...arguments)}catch(O){gt("WebGLState:",O)}}function W(){try{t.texSubImage3D(...arguments)}catch(O){gt("WebGLState:",O)}}function Y(){try{t.compressedTexSubImage2D(...arguments)}catch(O){gt("WebGLState:",O)}}function ie(){try{t.compressedTexSubImage3D(...arguments)}catch(O){gt("WebGLState:",O)}}function de(){try{t.texStorage2D(...arguments)}catch(O){gt("WebGLState:",O)}}function ge(){try{t.texStorage3D(...arguments)}catch(O){gt("WebGLState:",O)}}function re(){try{t.texImage2D(...arguments)}catch(O){gt("WebGLState:",O)}}function ae(){try{t.texImage3D(...arguments)}catch(O){gt("WebGLState:",O)}}function fe(O){return p[O]!==void 0?p[O]:t.getParameter(O)}function Fe(O,_e){p[O]!==_e&&(t.pixelStorei(O,_e),p[O]=_e)}function xe(O){Je.equals(O)===!1&&(t.scissor(O.x,O.y,O.z,O.w),Je.copy(O))}function pe(O){$e.equals(O)===!1&&(t.viewport(O.x,O.y,O.z,O.w),$e.copy(O))}function Oe(O,_e){let ee=c.get(_e);ee===void 0&&(ee=new WeakMap,c.set(_e,ee));let me=ee.get(O);me===void 0&&(me=t.getUniformBlockIndex(_e,O.name),ee.set(O,me))}function ke(O,_e){const me=c.get(_e).get(O);l.get(_e)!==me&&(t.uniformBlockBinding(_e,me,O.__bindingPointIndex),l.set(_e,me))}function qe(){t.disable(t.BLEND),t.disable(t.CULL_FACE),t.disable(t.DEPTH_TEST),t.disable(t.POLYGON_OFFSET_FILL),t.disable(t.SCISSOR_TEST),t.disable(t.STENCIL_TEST),t.disable(t.SAMPLE_ALPHA_TO_COVERAGE),t.blendEquation(t.FUNC_ADD),t.blendFunc(t.ONE,t.ZERO),t.blendFuncSeparate(t.ONE,t.ZERO,t.ONE,t.ZERO),t.blendColor(0,0,0,0),t.colorMask(!0,!0,!0,!0),t.clearColor(0,0,0,0),t.depthMask(!0),t.depthFunc(t.LESS),a.setReversed(!1),t.clearDepth(1),t.stencilMask(4294967295),t.stencilFunc(t.ALWAYS,0,4294967295),t.stencilOp(t.KEEP,t.KEEP,t.KEEP),t.clearStencil(0),t.cullFace(t.BACK),t.frontFace(t.CCW),t.polygonOffset(0,0),t.activeTexture(t.TEXTURE0),t.bindFramebuffer(t.FRAMEBUFFER,null),t.bindFramebuffer(t.DRAW_FRAMEBUFFER,null),t.bindFramebuffer(t.READ_FRAMEBUFFER,null),t.useProgram(null),t.lineWidth(1),t.scissor(0,0,t.canvas.width,t.canvas.height),t.viewport(0,0,t.canvas.width,t.canvas.height),t.pixelStorei(t.PACK_ALIGNMENT,4),t.pixelStorei(t.UNPACK_ALIGNMENT,4),t.pixelStorei(t.UNPACK_FLIP_Y_WEBGL,!1),t.pixelStorei(t.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),t.pixelStorei(t.UNPACK_COLORSPACE_CONVERSION_WEBGL,t.BROWSER_DEFAULT_WEBGL),t.pixelStorei(t.PACK_ROW_LENGTH,0),t.pixelStorei(t.PACK_SKIP_PIXELS,0),t.pixelStorei(t.PACK_SKIP_ROWS,0),t.pixelStorei(t.UNPACK_ROW_LENGTH,0),t.pixelStorei(t.UNPACK_IMAGE_HEIGHT,0),t.pixelStorei(t.UNPACK_SKIP_PIXELS,0),t.pixelStorei(t.UNPACK_SKIP_ROWS,0),t.pixelStorei(t.UNPACK_SKIP_IMAGES,0),h={},p={},X=null,ne={},f={},g=new WeakMap,v=[],E=null,_=!1,u=null,m=null,M=null,y=null,T=null,w=null,R=null,x=new dt(0,0,0),A=0,P=!1,L=null,B=null,F=null,I=null,j=null,Je.set(0,0,t.canvas.width,t.canvas.height),$e.set(0,0,t.canvas.width,t.canvas.height),s.reset(),a.reset(),o.reset()}return{buffers:{color:s,depth:a,stencil:o},enable:J,disable:Ne,bindFramebuffer:We,drawBuffers:Re,useProgram:Ze,setBlending:ot,setMaterial:yt,setFlipSided:it,setCullFace:Pt,setLineWidth:Bt,setPolygonOffset:pn,setScissorTest:Rt,activeTexture:zt,bindTexture:k,unbindTexture:qt,compressedTexImage2D:ht,compressedTexImage3D:C,texImage2D:re,texImage3D:ae,pixelStorei:Fe,getParameter:fe,updateUBOMapping:Oe,uniformBlockBinding:ke,texStorage2D:de,texStorage3D:ge,texSubImage2D:S,texSubImage3D:W,compressedTexSubImage2D:Y,compressedTexSubImage3D:ie,scissor:xe,viewport:pe,reset:qe}}function qb(t,e,n,i,r,s,a){const o=e.has("WEBGL_multisampled_render_to_texture")?e.get("WEBGL_multisampled_render_to_texture"):null,l=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),c=new je,h=new WeakMap,p=new Set;let f;const g=new WeakMap;let v=!1;try{v=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function E(C,S){return v?new OffscreenCanvas(C,S):Zc("canvas")}function _(C,S,W){let Y=1;const ie=ht(C);if((ie.width>W||ie.height>W)&&(Y=W/Math.max(ie.width,ie.height)),Y<1)if(typeof HTMLImageElement<"u"&&C instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&C instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&C instanceof ImageBitmap||typeof VideoFrame<"u"&&C instanceof VideoFrame){const de=Math.floor(Y*ie.width),ge=Math.floor(Y*ie.height);f===void 0&&(f=E(de,ge));const re=S?E(de,ge):f;return re.width=de,re.height=ge,re.getContext("2d").drawImage(C,0,0,de,ge),Ge("WebGLRenderer: Texture has been resized from ("+ie.width+"x"+ie.height+") to ("+de+"x"+ge+")."),re}else return"data"in C&&Ge("WebGLRenderer: Image in DataTexture is too big ("+ie.width+"x"+ie.height+")."),C;return C}function u(C){return C.generateMipmaps}function m(C){t.generateMipmap(C)}function M(C){return C.isWebGLCubeRenderTarget?t.TEXTURE_CUBE_MAP:C.isWebGL3DRenderTarget?t.TEXTURE_3D:C.isWebGLArrayRenderTarget||C.isCompressedArrayTexture?t.TEXTURE_2D_ARRAY:t.TEXTURE_2D}function y(C,S,W,Y,ie,de=!1){if(C!==null){if(t[C]!==void 0)return t[C];Ge("WebGLRenderer: Attempt to use non-existing WebGL internal format '"+C+"'")}let ge;Y&&(ge=e.get("EXT_texture_norm16"),ge||Ge("WebGLRenderer: Unable to use normalized textures without EXT_texture_norm16 extension"));let re=S;if(S===t.RED&&(W===t.FLOAT&&(re=t.R32F),W===t.HALF_FLOAT&&(re=t.R16F),W===t.UNSIGNED_BYTE&&(re=t.R8),W===t.UNSIGNED_SHORT&&ge&&(re=ge.R16_EXT),W===t.SHORT&&ge&&(re=ge.R16_SNORM_EXT)),S===t.RED_INTEGER&&(W===t.UNSIGNED_BYTE&&(re=t.R8UI),W===t.UNSIGNED_SHORT&&(re=t.R16UI),W===t.UNSIGNED_INT&&(re=t.R32UI),W===t.BYTE&&(re=t.R8I),W===t.SHORT&&(re=t.R16I),W===t.INT&&(re=t.R32I)),S===t.RG&&(W===t.FLOAT&&(re=t.RG32F),W===t.HALF_FLOAT&&(re=t.RG16F),W===t.UNSIGNED_BYTE&&(re=t.RG8),W===t.UNSIGNED_SHORT&&ge&&(re=ge.RG16_EXT),W===t.SHORT&&ge&&(re=ge.RG16_SNORM_EXT)),S===t.RG_INTEGER&&(W===t.UNSIGNED_BYTE&&(re=t.RG8UI),W===t.UNSIGNED_SHORT&&(re=t.RG16UI),W===t.UNSIGNED_INT&&(re=t.RG32UI),W===t.BYTE&&(re=t.RG8I),W===t.SHORT&&(re=t.RG16I),W===t.INT&&(re=t.RG32I)),S===t.RGB_INTEGER&&(W===t.UNSIGNED_BYTE&&(re=t.RGB8UI),W===t.UNSIGNED_SHORT&&(re=t.RGB16UI),W===t.UNSIGNED_INT&&(re=t.RGB32UI),W===t.BYTE&&(re=t.RGB8I),W===t.SHORT&&(re=t.RGB16I),W===t.INT&&(re=t.RGB32I)),S===t.RGBA_INTEGER&&(W===t.UNSIGNED_BYTE&&(re=t.RGBA8UI),W===t.UNSIGNED_SHORT&&(re=t.RGBA16UI),W===t.UNSIGNED_INT&&(re=t.RGBA32UI),W===t.BYTE&&(re=t.RGBA8I),W===t.SHORT&&(re=t.RGBA16I),W===t.INT&&(re=t.RGBA32I)),S===t.RGB&&(W===t.UNSIGNED_SHORT&&ge&&(re=ge.RGB16_EXT),W===t.SHORT&&ge&&(re=ge.RGB16_SNORM_EXT),W===t.UNSIGNED_INT_5_9_9_9_REV&&(re=t.RGB9_E5),W===t.UNSIGNED_INT_10F_11F_11F_REV&&(re=t.R11F_G11F_B10F)),S===t.RGBA){const ae=de?Kc:ft.getTransfer(ie);W===t.FLOAT&&(re=t.RGBA32F),W===t.HALF_FLOAT&&(re=t.RGBA16F),W===t.UNSIGNED_BYTE&&(re=ae===Tt?t.SRGB8_ALPHA8:t.RGBA8),W===t.UNSIGNED_SHORT&&ge&&(re=ge.RGBA16_EXT),W===t.SHORT&&ge&&(re=ge.RGBA16_SNORM_EXT),W===t.UNSIGNED_SHORT_4_4_4_4&&(re=t.RGBA4),W===t.UNSIGNED_SHORT_5_5_5_1&&(re=t.RGB5_A1)}return(re===t.R16F||re===t.R32F||re===t.RG16F||re===t.RG32F||re===t.RGBA16F||re===t.RGBA32F)&&e.get("EXT_color_buffer_float"),re}function T(C,S){let W;return C?S===null||S===ar||S===tl?W=t.DEPTH24_STENCIL8:S===tr?W=t.DEPTH32F_STENCIL8:S===el&&(W=t.DEPTH24_STENCIL8,Ge("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):S===null||S===ar||S===tl?W=t.DEPTH_COMPONENT24:S===tr?W=t.DEPTH_COMPONENT32F:S===el&&(W=t.DEPTH_COMPONENT16),W}function w(C,S){return u(C)===!0||C.isFramebufferTexture&&C.minFilter!==gn&&C.minFilter!==An?Math.log2(Math.max(S.width,S.height))+1:C.mipmaps!==void 0&&C.mipmaps.length>0?C.mipmaps.length:C.isCompressedTexture&&Array.isArray(C.image)?S.mipmaps.length:1}function R(C){const S=C.target;S.removeEventListener("dispose",R),A(S),S.isVideoTexture&&h.delete(S),S.isHTMLTexture&&p.delete(S)}function x(C){const S=C.target;S.removeEventListener("dispose",x),L(S)}function A(C){const S=i.get(C);if(S.__webglInit===void 0)return;const W=C.source,Y=g.get(W);if(Y){const ie=Y[S.__cacheKey];ie.usedTimes--,ie.usedTimes===0&&P(C),Object.keys(Y).length===0&&g.delete(W)}i.remove(C)}function P(C){const S=i.get(C);t.deleteTexture(S.__webglTexture);const W=C.source,Y=g.get(W);delete Y[S.__cacheKey],a.memory.textures--}function L(C){const S=i.get(C);if(C.depthTexture&&(C.depthTexture.dispose(),i.remove(C.depthTexture)),C.isWebGLCubeRenderTarget)for(let Y=0;Y<6;Y++){if(Array.isArray(S.__webglFramebuffer[Y]))for(let ie=0;ie<S.__webglFramebuffer[Y].length;ie++)t.deleteFramebuffer(S.__webglFramebuffer[Y][ie]);else t.deleteFramebuffer(S.__webglFramebuffer[Y]);S.__webglDepthbuffer&&t.deleteRenderbuffer(S.__webglDepthbuffer[Y])}else{if(Array.isArray(S.__webglFramebuffer))for(let Y=0;Y<S.__webglFramebuffer.length;Y++)t.deleteFramebuffer(S.__webglFramebuffer[Y]);else t.deleteFramebuffer(S.__webglFramebuffer);if(S.__webglDepthbuffer&&t.deleteRenderbuffer(S.__webglDepthbuffer),S.__webglMultisampledFramebuffer&&t.deleteFramebuffer(S.__webglMultisampledFramebuffer),S.__webglColorRenderbuffer)for(let Y=0;Y<S.__webglColorRenderbuffer.length;Y++)S.__webglColorRenderbuffer[Y]&&t.deleteRenderbuffer(S.__webglColorRenderbuffer[Y]);S.__webglDepthRenderbuffer&&t.deleteRenderbuffer(S.__webglDepthRenderbuffer)}const W=C.textures;for(let Y=0,ie=W.length;Y<ie;Y++){const de=i.get(W[Y]);de.__webglTexture&&(t.deleteTexture(de.__webglTexture),a.memory.textures--),i.remove(W[Y])}i.remove(C)}let B=0;function F(){B=0}function I(){return B}function j(C){B=C}function N(){const C=B;return C>=r.maxTextures&&Ge("WebGLTextures: Trying to use "+(C+1)+" texture units while this GPU supports only "+r.maxTextures),B+=1,C}function H(C){const S=[];return S.push(C.wrapS),S.push(C.wrapT),S.push(C.wrapR||0),S.push(C.magFilter),S.push(C.minFilter),S.push(C.anisotropy),S.push(C.internalFormat),S.push(C.format),S.push(C.type),S.push(C.generateMipmaps),S.push(C.premultiplyAlpha),S.push(C.flipY),S.push(C.unpackAlignment),S.push(C.colorSpace),S.join()}function V(C,S){const W=i.get(C);if(C.isVideoTexture&&k(C),C.isRenderTargetTexture===!1&&C.isExternalTexture!==!0&&C.version>0&&W.__version!==C.version){const Y=C.image;if(Y===null)Ge("WebGLRenderer: Texture marked for update but no image data found.");else if(Y.complete===!1)Ge("WebGLRenderer: Texture marked for update but image is incomplete");else{Ne(W,C,S);return}}else C.isExternalTexture&&(W.__webglTexture=C.sourceTexture?C.sourceTexture:null);n.bindTexture(t.TEXTURE_2D,W.__webglTexture,t.TEXTURE0+S)}function G(C,S){const W=i.get(C);if(C.isRenderTargetTexture===!1&&C.version>0&&W.__version!==C.version){Ne(W,C,S);return}else C.isExternalTexture&&(W.__webglTexture=C.sourceTexture?C.sourceTexture:null);n.bindTexture(t.TEXTURE_2D_ARRAY,W.__webglTexture,t.TEXTURE0+S)}function X(C,S){const W=i.get(C);if(C.isRenderTargetTexture===!1&&C.version>0&&W.__version!==C.version){Ne(W,C,S);return}n.bindTexture(t.TEXTURE_3D,W.__webglTexture,t.TEXTURE0+S)}function ne(C,S){const W=i.get(C);if(C.isCubeDepthTexture!==!0&&C.version>0&&W.__version!==C.version){We(W,C,S);return}n.bindTexture(t.TEXTURE_CUBE_MAP,W.__webglTexture,t.TEXTURE0+S)}const ve={[Hf]:t.REPEAT,[Mr]:t.CLAMP_TO_EDGE,[Vf]:t.MIRRORED_REPEAT},Pe={[gn]:t.NEAREST,[iE]:t.NEAREST_MIPMAP_NEAREST,[Nl]:t.NEAREST_MIPMAP_LINEAR,[An]:t.LINEAR,[od]:t.LINEAR_MIPMAP_NEAREST,[bs]:t.LINEAR_MIPMAP_LINEAR},Je={[oE]:t.NEVER,[fE]:t.ALWAYS,[lE]:t.LESS,[Pp]:t.LEQUAL,[cE]:t.EQUAL,[Np]:t.GEQUAL,[uE]:t.GREATER,[dE]:t.NOTEQUAL};function $e(C,S){if(S.type===tr&&e.has("OES_texture_float_linear")===!1&&(S.magFilter===An||S.magFilter===od||S.magFilter===Nl||S.magFilter===bs||S.minFilter===An||S.minFilter===od||S.minFilter===Nl||S.minFilter===bs)&&Ge("WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),t.texParameteri(C,t.TEXTURE_WRAP_S,ve[S.wrapS]),t.texParameteri(C,t.TEXTURE_WRAP_T,ve[S.wrapT]),(C===t.TEXTURE_3D||C===t.TEXTURE_2D_ARRAY)&&t.texParameteri(C,t.TEXTURE_WRAP_R,ve[S.wrapR]),t.texParameteri(C,t.TEXTURE_MAG_FILTER,Pe[S.magFilter]),t.texParameteri(C,t.TEXTURE_MIN_FILTER,Pe[S.minFilter]),S.compareFunction&&(t.texParameteri(C,t.TEXTURE_COMPARE_MODE,t.COMPARE_REF_TO_TEXTURE),t.texParameteri(C,t.TEXTURE_COMPARE_FUNC,Je[S.compareFunction])),e.has("EXT_texture_filter_anisotropic")===!0){if(S.magFilter===gn||S.minFilter!==Nl&&S.minFilter!==bs||S.type===tr&&e.has("OES_texture_float_linear")===!1)return;if(S.anisotropy>1||i.get(S).__currentAnisotropy){const W=e.get("EXT_texture_filter_anisotropic");t.texParameterf(C,W.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(S.anisotropy,r.getMaxAnisotropy())),i.get(S).__currentAnisotropy=S.anisotropy}}}function Ke(C,S){let W=!1;C.__webglInit===void 0&&(C.__webglInit=!0,S.addEventListener("dispose",R));const Y=S.source;let ie=g.get(Y);ie===void 0&&(ie={},g.set(Y,ie));const de=H(S);if(de!==C.__cacheKey){ie[de]===void 0&&(ie[de]={texture:t.createTexture(),usedTimes:0},a.memory.textures++,W=!0),ie[de].usedTimes++;const ge=ie[C.__cacheKey];ge!==void 0&&(ie[C.__cacheKey].usedTimes--,ge.usedTimes===0&&P(S)),C.__cacheKey=de,C.__webglTexture=ie[de].texture}return W}function Z(C,S,W){return Math.floor(Math.floor(C/W)/S)}function J(C,S,W,Y){const de=C.updateRanges;if(de.length===0)n.texSubImage2D(t.TEXTURE_2D,0,0,0,S.width,S.height,W,Y,S.data);else{de.sort((Fe,xe)=>Fe.start-xe.start);let ge=0;for(let Fe=1;Fe<de.length;Fe++){const xe=de[ge],pe=de[Fe],Oe=xe.start+xe.count,ke=Z(pe.start,S.width,4),qe=Z(xe.start,S.width,4);pe.start<=Oe+1&&ke===qe&&Z(pe.start+pe.count-1,S.width,4)===ke?xe.count=Math.max(xe.count,pe.start+pe.count-xe.start):(++ge,de[ge]=pe)}de.length=ge+1;const re=n.getParameter(t.UNPACK_ROW_LENGTH),ae=n.getParameter(t.UNPACK_SKIP_PIXELS),fe=n.getParameter(t.UNPACK_SKIP_ROWS);n.pixelStorei(t.UNPACK_ROW_LENGTH,S.width);for(let Fe=0,xe=de.length;Fe<xe;Fe++){const pe=de[Fe],Oe=Math.floor(pe.start/4),ke=Math.ceil(pe.count/4),qe=Oe%S.width,O=Math.floor(Oe/S.width),_e=ke,ee=1;n.pixelStorei(t.UNPACK_SKIP_PIXELS,qe),n.pixelStorei(t.UNPACK_SKIP_ROWS,O),n.texSubImage2D(t.TEXTURE_2D,0,qe,O,_e,ee,W,Y,S.data)}C.clearUpdateRanges(),n.pixelStorei(t.UNPACK_ROW_LENGTH,re),n.pixelStorei(t.UNPACK_SKIP_PIXELS,ae),n.pixelStorei(t.UNPACK_SKIP_ROWS,fe)}}function Ne(C,S,W){let Y=t.TEXTURE_2D;(S.isDataArrayTexture||S.isCompressedArrayTexture)&&(Y=t.TEXTURE_2D_ARRAY),S.isData3DTexture&&(Y=t.TEXTURE_3D);const ie=Ke(C,S),de=S.source;n.bindTexture(Y,C.__webglTexture,t.TEXTURE0+W);const ge=i.get(de);if(de.version!==ge.__version||ie===!0){if(n.activeTexture(t.TEXTURE0+W),(typeof ImageBitmap<"u"&&S.image instanceof ImageBitmap)===!1){const ee=ft.getPrimaries(ft.workingColorSpace),me=S.colorSpace===qr?null:ft.getPrimaries(S.colorSpace),Se=S.colorSpace===qr||ee===me?t.NONE:t.BROWSER_DEFAULT_WEBGL;n.pixelStorei(t.UNPACK_FLIP_Y_WEBGL,S.flipY),n.pixelStorei(t.UNPACK_PREMULTIPLY_ALPHA_WEBGL,S.premultiplyAlpha),n.pixelStorei(t.UNPACK_COLORSPACE_CONVERSION_WEBGL,Se)}n.pixelStorei(t.UNPACK_ALIGNMENT,S.unpackAlignment);let ae=_(S.image,!1,r.maxTextureSize);ae=qt(S,ae);const fe=s.convert(S.format,S.colorSpace),Fe=s.convert(S.type);let xe=y(S.internalFormat,fe,Fe,S.normalized,S.colorSpace,S.isVideoTexture);$e(Y,S);let pe;const Oe=S.mipmaps,ke=S.isVideoTexture!==!0,qe=ge.__version===void 0||ie===!0,O=de.dataReady,_e=w(S,ae);if(S.isDepthTexture)xe=T(S.format===Rs,S.type),qe&&(ke?n.texStorage2D(t.TEXTURE_2D,1,xe,ae.width,ae.height):n.texImage2D(t.TEXTURE_2D,0,xe,ae.width,ae.height,0,fe,Fe,null));else if(S.isDataTexture)if(Oe.length>0){ke&&qe&&n.texStorage2D(t.TEXTURE_2D,_e,xe,Oe[0].width,Oe[0].height);for(let ee=0,me=Oe.length;ee<me;ee++)pe=Oe[ee],ke?O&&n.texSubImage2D(t.TEXTURE_2D,ee,0,0,pe.width,pe.height,fe,Fe,pe.data):n.texImage2D(t.TEXTURE_2D,ee,xe,pe.width,pe.height,0,fe,Fe,pe.data);S.generateMipmaps=!1}else ke?(qe&&n.texStorage2D(t.TEXTURE_2D,_e,xe,ae.width,ae.height),O&&J(S,ae,fe,Fe)):n.texImage2D(t.TEXTURE_2D,0,xe,ae.width,ae.height,0,fe,Fe,ae.data);else if(S.isCompressedTexture)if(S.isCompressedArrayTexture){ke&&qe&&n.texStorage3D(t.TEXTURE_2D_ARRAY,_e,xe,Oe[0].width,Oe[0].height,ae.depth);for(let ee=0,me=Oe.length;ee<me;ee++)if(pe=Oe[ee],S.format!==Ii)if(fe!==null)if(ke){if(O)if(S.layerUpdates.size>0){const Se=Q0(pe.width,pe.height,S.format,S.type);for(const se of S.layerUpdates){const ye=pe.data.subarray(se*Se/pe.data.BYTES_PER_ELEMENT,(se+1)*Se/pe.data.BYTES_PER_ELEMENT);n.compressedTexSubImage3D(t.TEXTURE_2D_ARRAY,ee,0,0,se,pe.width,pe.height,1,fe,ye)}}else n.compressedTexSubImage3D(t.TEXTURE_2D_ARRAY,ee,0,0,0,pe.width,pe.height,ae.depth,fe,pe.data)}else n.compressedTexImage3D(t.TEXTURE_2D_ARRAY,ee,xe,pe.width,pe.height,ae.depth,0,pe.data,0,0);else Ge("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else ke?O&&n.texSubImage3D(t.TEXTURE_2D_ARRAY,ee,0,0,0,pe.width,pe.height,ae.depth,fe,Fe,pe.data):n.texImage3D(t.TEXTURE_2D_ARRAY,ee,xe,pe.width,pe.height,ae.depth,0,fe,Fe,pe.data);S.layerUpdates.size>0&&S.clearLayerUpdates()}else{ke&&qe&&n.texStorage2D(t.TEXTURE_2D,_e,xe,Oe[0].width,Oe[0].height);for(let ee=0,me=Oe.length;ee<me;ee++)pe=Oe[ee],S.format!==Ii?fe!==null?ke?O&&n.compressedTexSubImage2D(t.TEXTURE_2D,ee,0,0,pe.width,pe.height,fe,pe.data):n.compressedTexImage2D(t.TEXTURE_2D,ee,xe,pe.width,pe.height,0,pe.data):Ge("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):ke?O&&n.texSubImage2D(t.TEXTURE_2D,ee,0,0,pe.width,pe.height,fe,Fe,pe.data):n.texImage2D(t.TEXTURE_2D,ee,xe,pe.width,pe.height,0,fe,Fe,pe.data)}else if(S.isDataArrayTexture)if(ke){if(qe&&n.texStorage3D(t.TEXTURE_2D_ARRAY,_e,xe,ae.width,ae.height,ae.depth),O)if(S.layerUpdates.size>0){const ee=Q0(ae.width,ae.height,S.format,S.type);for(const me of S.layerUpdates){const Se=ae.data.subarray(me*ee/ae.data.BYTES_PER_ELEMENT,(me+1)*ee/ae.data.BYTES_PER_ELEMENT);n.texSubImage3D(t.TEXTURE_2D_ARRAY,0,0,0,me,ae.width,ae.height,1,fe,Fe,Se)}S.clearLayerUpdates()}else n.texSubImage3D(t.TEXTURE_2D_ARRAY,0,0,0,0,ae.width,ae.height,ae.depth,fe,Fe,ae.data)}else n.texImage3D(t.TEXTURE_2D_ARRAY,0,xe,ae.width,ae.height,ae.depth,0,fe,Fe,ae.data);else if(S.isData3DTexture)ke?(qe&&n.texStorage3D(t.TEXTURE_3D,_e,xe,ae.width,ae.height,ae.depth),O&&n.texSubImage3D(t.TEXTURE_3D,0,0,0,0,ae.width,ae.height,ae.depth,fe,Fe,ae.data)):n.texImage3D(t.TEXTURE_3D,0,xe,ae.width,ae.height,ae.depth,0,fe,Fe,ae.data);else if(S.isFramebufferTexture){if(qe)if(ke)n.texStorage2D(t.TEXTURE_2D,_e,xe,ae.width,ae.height);else{let ee=ae.width,me=ae.height;for(let Se=0;Se<_e;Se++)n.texImage2D(t.TEXTURE_2D,Se,xe,ee,me,0,fe,Fe,null),ee>>=1,me>>=1}}else if(S.isHTMLTexture){if("texElementImage2D"in t){const ee=t.canvas;if(ee.hasAttribute("layoutsubtree")||ee.setAttribute("layoutsubtree","true"),ae.parentNode!==ee){ee.appendChild(ae),p.add(S),ee.onpaint=me=>{const Se=me.changedElements;for(const se of p)Se.includes(se.image)&&(se.needsUpdate=!0)},ee.requestPaint();return}if(t.texElementImage2D.length===3)t.texElementImage2D(t.TEXTURE_2D,t.RGBA8,ae);else{const Se=t.RGBA,se=t.RGBA,ye=t.UNSIGNED_BYTE;t.texElementImage2D(t.TEXTURE_2D,0,Se,se,ye,ae)}t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MIN_FILTER,t.LINEAR),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_S,t.CLAMP_TO_EDGE),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_T,t.CLAMP_TO_EDGE)}}else if(Oe.length>0){if(ke&&qe){const ee=ht(Oe[0]);n.texStorage2D(t.TEXTURE_2D,_e,xe,ee.width,ee.height)}for(let ee=0,me=Oe.length;ee<me;ee++)pe=Oe[ee],ke?O&&n.texSubImage2D(t.TEXTURE_2D,ee,0,0,fe,Fe,pe):n.texImage2D(t.TEXTURE_2D,ee,xe,fe,Fe,pe);S.generateMipmaps=!1}else if(ke){if(qe){const ee=ht(ae);n.texStorage2D(t.TEXTURE_2D,_e,xe,ee.width,ee.height)}O&&n.texSubImage2D(t.TEXTURE_2D,0,0,0,fe,Fe,ae)}else n.texImage2D(t.TEXTURE_2D,0,xe,fe,Fe,ae);u(S)&&m(Y),ge.__version=de.version,S.onUpdate&&S.onUpdate(S)}C.__version=S.version}function We(C,S,W){if(S.image.length!==6)return;const Y=Ke(C,S),ie=S.source;n.bindTexture(t.TEXTURE_CUBE_MAP,C.__webglTexture,t.TEXTURE0+W);const de=i.get(ie);if(ie.version!==de.__version||Y===!0){n.activeTexture(t.TEXTURE0+W);const ge=ft.getPrimaries(ft.workingColorSpace),re=S.colorSpace===qr?null:ft.getPrimaries(S.colorSpace),ae=S.colorSpace===qr||ge===re?t.NONE:t.BROWSER_DEFAULT_WEBGL;n.pixelStorei(t.UNPACK_FLIP_Y_WEBGL,S.flipY),n.pixelStorei(t.UNPACK_PREMULTIPLY_ALPHA_WEBGL,S.premultiplyAlpha),n.pixelStorei(t.UNPACK_ALIGNMENT,S.unpackAlignment),n.pixelStorei(t.UNPACK_COLORSPACE_CONVERSION_WEBGL,ae);const fe=S.isCompressedTexture||S.image[0].isCompressedTexture,Fe=S.image[0]&&S.image[0].isDataTexture,xe=[];for(let se=0;se<6;se++)!fe&&!Fe?xe[se]=_(S.image[se],!0,r.maxCubemapSize):xe[se]=Fe?S.image[se].image:S.image[se],xe[se]=qt(S,xe[se]);const pe=xe[0],Oe=s.convert(S.format,S.colorSpace),ke=s.convert(S.type),qe=y(S.internalFormat,Oe,ke,S.normalized,S.colorSpace),O=S.isVideoTexture!==!0,_e=de.__version===void 0||Y===!0,ee=ie.dataReady;let me=w(S,pe);$e(t.TEXTURE_CUBE_MAP,S);let Se;if(fe){O&&_e&&n.texStorage2D(t.TEXTURE_CUBE_MAP,me,qe,pe.width,pe.height);for(let se=0;se<6;se++){Se=xe[se].mipmaps;for(let ye=0;ye<Se.length;ye++){const Ie=Se[ye];S.format!==Ii?Oe!==null?O?ee&&n.compressedTexSubImage2D(t.TEXTURE_CUBE_MAP_POSITIVE_X+se,ye,0,0,Ie.width,Ie.height,Oe,Ie.data):n.compressedTexImage2D(t.TEXTURE_CUBE_MAP_POSITIVE_X+se,ye,qe,Ie.width,Ie.height,0,Ie.data):Ge("WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):O?ee&&n.texSubImage2D(t.TEXTURE_CUBE_MAP_POSITIVE_X+se,ye,0,0,Ie.width,Ie.height,Oe,ke,Ie.data):n.texImage2D(t.TEXTURE_CUBE_MAP_POSITIVE_X+se,ye,qe,Ie.width,Ie.height,0,Oe,ke,Ie.data)}}}else{if(Se=S.mipmaps,O&&_e){Se.length>0&&me++;const se=ht(xe[0]);n.texStorage2D(t.TEXTURE_CUBE_MAP,me,qe,se.width,se.height)}for(let se=0;se<6;se++)if(Fe){O?ee&&n.texSubImage2D(t.TEXTURE_CUBE_MAP_POSITIVE_X+se,0,0,0,xe[se].width,xe[se].height,Oe,ke,xe[se].data):n.texImage2D(t.TEXTURE_CUBE_MAP_POSITIVE_X+se,0,qe,xe[se].width,xe[se].height,0,Oe,ke,xe[se].data);for(let ye=0;ye<Se.length;ye++){const pt=Se[ye].image[se].image;O?ee&&n.texSubImage2D(t.TEXTURE_CUBE_MAP_POSITIVE_X+se,ye+1,0,0,pt.width,pt.height,Oe,ke,pt.data):n.texImage2D(t.TEXTURE_CUBE_MAP_POSITIVE_X+se,ye+1,qe,pt.width,pt.height,0,Oe,ke,pt.data)}}else{O?ee&&n.texSubImage2D(t.TEXTURE_CUBE_MAP_POSITIVE_X+se,0,0,0,Oe,ke,xe[se]):n.texImage2D(t.TEXTURE_CUBE_MAP_POSITIVE_X+se,0,qe,Oe,ke,xe[se]);for(let ye=0;ye<Se.length;ye++){const Ie=Se[ye];O?ee&&n.texSubImage2D(t.TEXTURE_CUBE_MAP_POSITIVE_X+se,ye+1,0,0,Oe,ke,Ie.image[se]):n.texImage2D(t.TEXTURE_CUBE_MAP_POSITIVE_X+se,ye+1,qe,Oe,ke,Ie.image[se])}}}u(S)&&m(t.TEXTURE_CUBE_MAP),de.__version=ie.version,S.onUpdate&&S.onUpdate(S)}C.__version=S.version}function Re(C,S,W,Y,ie,de){const ge=s.convert(W.format,W.colorSpace),re=s.convert(W.type),ae=y(W.internalFormat,ge,re,W.normalized,W.colorSpace),fe=i.get(S),Fe=i.get(W);if(Fe.__renderTarget=S,!fe.__hasExternalTextures){const xe=Math.max(1,S.width>>de),pe=Math.max(1,S.height>>de);ie===t.TEXTURE_3D||ie===t.TEXTURE_2D_ARRAY?n.texImage3D(ie,de,ae,xe,pe,S.depth,0,ge,re,null):n.texImage2D(ie,de,ae,xe,pe,0,ge,re,null)}n.bindFramebuffer(t.FRAMEBUFFER,C),zt(S)?o.framebufferTexture2DMultisampleEXT(t.FRAMEBUFFER,Y,ie,Fe.__webglTexture,0,Rt(S)):(ie===t.TEXTURE_2D||ie>=t.TEXTURE_CUBE_MAP_POSITIVE_X&&ie<=t.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&t.framebufferTexture2D(t.FRAMEBUFFER,Y,ie,Fe.__webglTexture,de),n.bindFramebuffer(t.FRAMEBUFFER,null)}function Ze(C,S,W){if(t.bindRenderbuffer(t.RENDERBUFFER,C),S.depthBuffer){const Y=S.depthTexture,ie=Y&&Y.isDepthTexture?Y.type:null,de=T(S.stencilBuffer,ie),ge=S.stencilBuffer?t.DEPTH_STENCIL_ATTACHMENT:t.DEPTH_ATTACHMENT;zt(S)?o.renderbufferStorageMultisampleEXT(t.RENDERBUFFER,Rt(S),de,S.width,S.height):W?t.renderbufferStorageMultisample(t.RENDERBUFFER,Rt(S),de,S.width,S.height):t.renderbufferStorage(t.RENDERBUFFER,de,S.width,S.height),t.framebufferRenderbuffer(t.FRAMEBUFFER,ge,t.RENDERBUFFER,C)}else{const Y=S.textures;for(let ie=0;ie<Y.length;ie++){const de=Y[ie],ge=s.convert(de.format,de.colorSpace),re=s.convert(de.type),ae=y(de.internalFormat,ge,re,de.normalized,de.colorSpace);zt(S)?o.renderbufferStorageMultisampleEXT(t.RENDERBUFFER,Rt(S),ae,S.width,S.height):W?t.renderbufferStorageMultisample(t.RENDERBUFFER,Rt(S),ae,S.width,S.height):t.renderbufferStorage(t.RENDERBUFFER,ae,S.width,S.height)}}t.bindRenderbuffer(t.RENDERBUFFER,null)}function Be(C,S,W){const Y=S.isWebGLCubeRenderTarget===!0;if(n.bindFramebuffer(t.FRAMEBUFFER,C),!(S.depthTexture&&S.depthTexture.isDepthTexture))throw new Error("THREE.WebGLTextures: renderTarget.depthTexture must be an instance of THREE.DepthTexture.");const ie=i.get(S.depthTexture);if(ie.__renderTarget=S,(!ie.__webglTexture||S.depthTexture.image.width!==S.width||S.depthTexture.image.height!==S.height)&&(S.depthTexture.image.width=S.width,S.depthTexture.image.height=S.height,S.depthTexture.needsUpdate=!0),Y){if(ie.__webglInit===void 0&&(ie.__webglInit=!0,S.depthTexture.addEventListener("dispose",R)),ie.__webglTexture===void 0){ie.__webglTexture=t.createTexture(),n.bindTexture(t.TEXTURE_CUBE_MAP,ie.__webglTexture),$e(t.TEXTURE_CUBE_MAP,S.depthTexture);const fe=s.convert(S.depthTexture.format),Fe=s.convert(S.depthTexture.type);let xe;S.depthTexture.format===Nr?xe=t.DEPTH_COMPONENT24:S.depthTexture.format===Rs&&(xe=t.DEPTH24_STENCIL8);for(let pe=0;pe<6;pe++)t.texImage2D(t.TEXTURE_CUBE_MAP_POSITIVE_X+pe,0,xe,S.width,S.height,0,fe,Fe,null)}}else V(S.depthTexture,0);const de=ie.__webglTexture,ge=Rt(S),re=Y?t.TEXTURE_CUBE_MAP_POSITIVE_X+W:t.TEXTURE_2D,ae=S.depthTexture.format===Rs?t.DEPTH_STENCIL_ATTACHMENT:t.DEPTH_ATTACHMENT;if(S.depthTexture.format===Nr)zt(S)?o.framebufferTexture2DMultisampleEXT(t.FRAMEBUFFER,ae,re,de,0,ge):t.framebufferTexture2D(t.FRAMEBUFFER,ae,re,de,0);else if(S.depthTexture.format===Rs)zt(S)?o.framebufferTexture2DMultisampleEXT(t.FRAMEBUFFER,ae,re,de,0,ge):t.framebufferTexture2D(t.FRAMEBUFFER,ae,re,de,0);else throw new Error("THREE.WebGLTextures: Unknown depthTexture format.")}function et(C){const S=i.get(C),W=C.isWebGLCubeRenderTarget===!0;if(S.__boundDepthTexture!==C.depthTexture){const Y=C.depthTexture;if(S.__depthDisposeCallback&&S.__depthDisposeCallback(),Y){const ie=()=>{delete S.__boundDepthTexture,delete S.__depthDisposeCallback,Y.removeEventListener("dispose",ie)};Y.addEventListener("dispose",ie),S.__depthDisposeCallback=ie}S.__boundDepthTexture=Y}if(C.depthTexture&&!S.__autoAllocateDepthBuffer)if(W)for(let Y=0;Y<6;Y++)Be(S.__webglFramebuffer[Y],C,Y);else{const Y=C.texture.mipmaps;Y&&Y.length>0?Be(S.__webglFramebuffer[0],C,0):Be(S.__webglFramebuffer,C,0)}else if(W){S.__webglDepthbuffer=[];for(let Y=0;Y<6;Y++)if(n.bindFramebuffer(t.FRAMEBUFFER,S.__webglFramebuffer[Y]),S.__webglDepthbuffer[Y]===void 0)S.__webglDepthbuffer[Y]=t.createRenderbuffer(),Ze(S.__webglDepthbuffer[Y],C,!1);else{const ie=C.stencilBuffer?t.DEPTH_STENCIL_ATTACHMENT:t.DEPTH_ATTACHMENT,de=S.__webglDepthbuffer[Y];t.bindRenderbuffer(t.RENDERBUFFER,de),t.framebufferRenderbuffer(t.FRAMEBUFFER,ie,t.RENDERBUFFER,de)}}else{const Y=C.texture.mipmaps;if(Y&&Y.length>0?n.bindFramebuffer(t.FRAMEBUFFER,S.__webglFramebuffer[0]):n.bindFramebuffer(t.FRAMEBUFFER,S.__webglFramebuffer),S.__webglDepthbuffer===void 0)S.__webglDepthbuffer=t.createRenderbuffer(),Ze(S.__webglDepthbuffer,C,!1);else{const ie=C.stencilBuffer?t.DEPTH_STENCIL_ATTACHMENT:t.DEPTH_ATTACHMENT,de=S.__webglDepthbuffer;t.bindRenderbuffer(t.RENDERBUFFER,de),t.framebufferRenderbuffer(t.FRAMEBUFFER,ie,t.RENDERBUFFER,de)}}n.bindFramebuffer(t.FRAMEBUFFER,null)}function ot(C,S,W){const Y=i.get(C);S!==void 0&&Re(Y.__webglFramebuffer,C,C.texture,t.COLOR_ATTACHMENT0,t.TEXTURE_2D,0),W!==void 0&&et(C)}function yt(C){const S=C.texture,W=i.get(C),Y=i.get(S);C.addEventListener("dispose",x);const ie=C.textures,de=C.isWebGLCubeRenderTarget===!0,ge=ie.length>1;if(ge||(Y.__webglTexture===void 0&&(Y.__webglTexture=t.createTexture()),Y.__version=S.version,a.memory.textures++),de){W.__webglFramebuffer=[];for(let re=0;re<6;re++)if(S.mipmaps&&S.mipmaps.length>0){W.__webglFramebuffer[re]=[];for(let ae=0;ae<S.mipmaps.length;ae++)W.__webglFramebuffer[re][ae]=t.createFramebuffer()}else W.__webglFramebuffer[re]=t.createFramebuffer()}else{if(S.mipmaps&&S.mipmaps.length>0){W.__webglFramebuffer=[];for(let re=0;re<S.mipmaps.length;re++)W.__webglFramebuffer[re]=t.createFramebuffer()}else W.__webglFramebuffer=t.createFramebuffer();if(ge)for(let re=0,ae=ie.length;re<ae;re++){const fe=i.get(ie[re]);fe.__webglTexture===void 0&&(fe.__webglTexture=t.createTexture(),a.memory.textures++)}if(C.samples>0&&zt(C)===!1){W.__webglMultisampledFramebuffer=t.createFramebuffer(),W.__webglColorRenderbuffer=[],n.bindFramebuffer(t.FRAMEBUFFER,W.__webglMultisampledFramebuffer);for(let re=0;re<ie.length;re++){const ae=ie[re];W.__webglColorRenderbuffer[re]=t.createRenderbuffer(),t.bindRenderbuffer(t.RENDERBUFFER,W.__webglColorRenderbuffer[re]);const fe=s.convert(ae.format,ae.colorSpace),Fe=s.convert(ae.type),xe=y(ae.internalFormat,fe,Fe,ae.normalized,ae.colorSpace,C.isXRRenderTarget===!0),pe=Rt(C);t.renderbufferStorageMultisample(t.RENDERBUFFER,pe,xe,C.width,C.height),t.framebufferRenderbuffer(t.FRAMEBUFFER,t.COLOR_ATTACHMENT0+re,t.RENDERBUFFER,W.__webglColorRenderbuffer[re])}t.bindRenderbuffer(t.RENDERBUFFER,null),C.depthBuffer&&(W.__webglDepthRenderbuffer=t.createRenderbuffer(),Ze(W.__webglDepthRenderbuffer,C,!0)),n.bindFramebuffer(t.FRAMEBUFFER,null)}}if(de){n.bindTexture(t.TEXTURE_CUBE_MAP,Y.__webglTexture),$e(t.TEXTURE_CUBE_MAP,S);for(let re=0;re<6;re++)if(S.mipmaps&&S.mipmaps.length>0)for(let ae=0;ae<S.mipmaps.length;ae++)Re(W.__webglFramebuffer[re][ae],C,S,t.COLOR_ATTACHMENT0,t.TEXTURE_CUBE_MAP_POSITIVE_X+re,ae);else Re(W.__webglFramebuffer[re],C,S,t.COLOR_ATTACHMENT0,t.TEXTURE_CUBE_MAP_POSITIVE_X+re,0);u(S)&&m(t.TEXTURE_CUBE_MAP),n.unbindTexture()}else if(ge){for(let re=0,ae=ie.length;re<ae;re++){const fe=ie[re],Fe=i.get(fe);let xe=t.TEXTURE_2D;(C.isWebGL3DRenderTarget||C.isWebGLArrayRenderTarget)&&(xe=C.isWebGL3DRenderTarget?t.TEXTURE_3D:t.TEXTURE_2D_ARRAY),n.bindTexture(xe,Fe.__webglTexture),$e(xe,fe),Re(W.__webglFramebuffer,C,fe,t.COLOR_ATTACHMENT0+re,xe,0),u(fe)&&m(xe)}n.unbindTexture()}else{let re=t.TEXTURE_2D;if((C.isWebGL3DRenderTarget||C.isWebGLArrayRenderTarget)&&(re=C.isWebGL3DRenderTarget?t.TEXTURE_3D:t.TEXTURE_2D_ARRAY),n.bindTexture(re,Y.__webglTexture),$e(re,S),S.mipmaps&&S.mipmaps.length>0)for(let ae=0;ae<S.mipmaps.length;ae++)Re(W.__webglFramebuffer[ae],C,S,t.COLOR_ATTACHMENT0,re,ae);else Re(W.__webglFramebuffer,C,S,t.COLOR_ATTACHMENT0,re,0);u(S)&&m(re),n.unbindTexture()}C.depthBuffer&&et(C)}function it(C){const S=C.textures;for(let W=0,Y=S.length;W<Y;W++){const ie=S[W];if(u(ie)){const de=M(C),ge=i.get(ie).__webglTexture;n.bindTexture(de,ge),m(de),n.unbindTexture()}}}const Pt=[],Bt=[];function pn(C){if(C.samples>0){if(zt(C)===!1){const S=C.textures,W=C.width,Y=C.height;let ie=t.COLOR_BUFFER_BIT;const de=C.stencilBuffer?t.DEPTH_STENCIL_ATTACHMENT:t.DEPTH_ATTACHMENT,ge=i.get(C),re=S.length>1;if(re)for(let fe=0;fe<S.length;fe++)n.bindFramebuffer(t.FRAMEBUFFER,ge.__webglMultisampledFramebuffer),t.framebufferRenderbuffer(t.FRAMEBUFFER,t.COLOR_ATTACHMENT0+fe,t.RENDERBUFFER,null),n.bindFramebuffer(t.FRAMEBUFFER,ge.__webglFramebuffer),t.framebufferTexture2D(t.DRAW_FRAMEBUFFER,t.COLOR_ATTACHMENT0+fe,t.TEXTURE_2D,null,0);n.bindFramebuffer(t.READ_FRAMEBUFFER,ge.__webglMultisampledFramebuffer);const ae=C.texture.mipmaps;ae&&ae.length>0?n.bindFramebuffer(t.DRAW_FRAMEBUFFER,ge.__webglFramebuffer[0]):n.bindFramebuffer(t.DRAW_FRAMEBUFFER,ge.__webglFramebuffer);for(let fe=0;fe<S.length;fe++){if(C.resolveDepthBuffer&&(C.depthBuffer&&(ie|=t.DEPTH_BUFFER_BIT),C.stencilBuffer&&C.resolveStencilBuffer&&(ie|=t.STENCIL_BUFFER_BIT)),re){t.framebufferRenderbuffer(t.READ_FRAMEBUFFER,t.COLOR_ATTACHMENT0,t.RENDERBUFFER,ge.__webglColorRenderbuffer[fe]);const Fe=i.get(S[fe]).__webglTexture;t.framebufferTexture2D(t.DRAW_FRAMEBUFFER,t.COLOR_ATTACHMENT0,t.TEXTURE_2D,Fe,0)}t.blitFramebuffer(0,0,W,Y,0,0,W,Y,ie,t.NEAREST),l===!0&&(Pt.length=0,Bt.length=0,Pt.push(t.COLOR_ATTACHMENT0+fe),C.depthBuffer&&C.storeMultisampledDepthBuffer===!1&&(Pt.push(de),Bt.push(de),t.invalidateFramebuffer(t.DRAW_FRAMEBUFFER,Bt)),t.invalidateFramebuffer(t.READ_FRAMEBUFFER,Pt))}if(n.bindFramebuffer(t.READ_FRAMEBUFFER,null),n.bindFramebuffer(t.DRAW_FRAMEBUFFER,null),re)for(let fe=0;fe<S.length;fe++){n.bindFramebuffer(t.FRAMEBUFFER,ge.__webglMultisampledFramebuffer),t.framebufferRenderbuffer(t.FRAMEBUFFER,t.COLOR_ATTACHMENT0+fe,t.RENDERBUFFER,ge.__webglColorRenderbuffer[fe]);const Fe=i.get(S[fe]).__webglTexture;n.bindFramebuffer(t.FRAMEBUFFER,ge.__webglFramebuffer),t.framebufferTexture2D(t.DRAW_FRAMEBUFFER,t.COLOR_ATTACHMENT0+fe,t.TEXTURE_2D,Fe,0)}n.bindFramebuffer(t.DRAW_FRAMEBUFFER,ge.__webglMultisampledFramebuffer)}else if(C.depthBuffer&&C.storeMultisampledDepthBuffer===!1&&l){const S=C.stencilBuffer?t.DEPTH_STENCIL_ATTACHMENT:t.DEPTH_ATTACHMENT;t.invalidateFramebuffer(t.DRAW_FRAMEBUFFER,[S])}}}function Rt(C){return Math.min(r.maxSamples,C.samples)}function zt(C){const S=i.get(C);return C.samples>0&&e.has("WEBGL_multisampled_render_to_texture")===!0&&S.__useRenderToTexture!==!1}function k(C){const S=a.render.frame;h.get(C)!==S&&(h.set(C,S),C.update())}function qt(C,S){const W=C.colorSpace,Y=C.format,ie=C.type;return C.isCompressedTexture===!0||C.isVideoTexture===!0||W!==Yc&&W!==qr&&(ft.getTransfer(W)===Tt?(Y!==Ii||ie!==ti)&&Ge("WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):gt("WebGLTextures: Unsupported texture color space:",W)),S}function ht(C){return typeof HTMLImageElement<"u"&&C instanceof HTMLImageElement?(c.width=C.naturalWidth||C.width,c.height=C.naturalHeight||C.height):typeof VideoFrame<"u"&&C instanceof VideoFrame?(c.width=C.displayWidth,c.height=C.displayHeight):(c.width=C.width,c.height=C.height),c}this.allocateTextureUnit=N,this.resetTextureUnits=F,this.getTextureUnits=I,this.setTextureUnits=j,this.setTexture2D=V,this.setTexture2DArray=G,this.setTexture3D=X,this.setTextureCube=ne,this.rebindTextures=ot,this.setupRenderTarget=yt,this.updateRenderTargetMipmap=it,this.updateMultisampleRenderTarget=pn,this.setupDepthRenderbuffer=et,this.setupFrameBufferTexture=Re,this.useMultisampledRTT=zt,this.isReversedDepthBuffer=function(){return n.buffers.depth.getReversed()}}function Yb(t,e){function n(i,r=qr){let s;const a=ft.getTransfer(r);if(i===ti)return t.UNSIGNED_BYTE;if(i===Tp)return t.UNSIGNED_SHORT_4_4_4_4;if(i===Ap)return t.UNSIGNED_SHORT_5_5_5_1;if(i===lx)return t.UNSIGNED_INT_5_9_9_9_REV;if(i===cx)return t.UNSIGNED_INT_10F_11F_11F_REV;if(i===ax)return t.BYTE;if(i===ox)return t.SHORT;if(i===el)return t.UNSIGNED_SHORT;if(i===wp)return t.INT;if(i===ar)return t.UNSIGNED_INT;if(i===tr)return t.FLOAT;if(i===or)return t.HALF_FLOAT;if(i===ux)return t.ALPHA;if(i===dx)return t.RGB;if(i===Ii)return t.RGBA;if(i===Nr)return t.DEPTH_COMPONENT;if(i===Rs)return t.DEPTH_STENCIL;if(i===fx)return t.RED;if(i===bp)return t.RED_INTEGER;if(i===ks)return t.RG;if(i===Rp)return t.RG_INTEGER;if(i===Cp)return t.RGBA_INTEGER;if(i===vc||i===xc||i===yc||i===Sc)if(a===Tt)if(s=e.get("WEBGL_compressed_texture_s3tc_srgb"),s!==null){if(i===vc)return s.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(i===xc)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(i===yc)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(i===Sc)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(s=e.get("WEBGL_compressed_texture_s3tc"),s!==null){if(i===vc)return s.COMPRESSED_RGB_S3TC_DXT1_EXT;if(i===xc)return s.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(i===yc)return s.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(i===Sc)return s.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(i===Gf||i===Wf||i===jf||i===Xf)if(s=e.get("WEBGL_compressed_texture_pvrtc"),s!==null){if(i===Gf)return s.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(i===Wf)return s.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(i===jf)return s.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(i===Xf)return s.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(i===$f||i===qf||i===Yf||i===Kf||i===Zf||i===$c||i===Qf)if(s=e.get("WEBGL_compressed_texture_etc"),s!==null){if(i===$f||i===qf)return a===Tt?s.COMPRESSED_SRGB8_ETC2:s.COMPRESSED_RGB8_ETC2;if(i===Yf)return a===Tt?s.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:s.COMPRESSED_RGBA8_ETC2_EAC;if(i===Kf)return s.COMPRESSED_R11_EAC;if(i===Zf)return s.COMPRESSED_SIGNED_R11_EAC;if(i===$c)return s.COMPRESSED_RG11_EAC;if(i===Qf)return s.COMPRESSED_SIGNED_RG11_EAC}else return null;if(i===Jf||i===eh||i===th||i===nh||i===ih||i===rh||i===sh||i===ah||i===oh||i===lh||i===ch||i===uh||i===dh||i===fh)if(s=e.get("WEBGL_compressed_texture_astc"),s!==null){if(i===Jf)return a===Tt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:s.COMPRESSED_RGBA_ASTC_4x4_KHR;if(i===eh)return a===Tt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:s.COMPRESSED_RGBA_ASTC_5x4_KHR;if(i===th)return a===Tt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:s.COMPRESSED_RGBA_ASTC_5x5_KHR;if(i===nh)return a===Tt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:s.COMPRESSED_RGBA_ASTC_6x5_KHR;if(i===ih)return a===Tt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:s.COMPRESSED_RGBA_ASTC_6x6_KHR;if(i===rh)return a===Tt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:s.COMPRESSED_RGBA_ASTC_8x5_KHR;if(i===sh)return a===Tt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:s.COMPRESSED_RGBA_ASTC_8x6_KHR;if(i===ah)return a===Tt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:s.COMPRESSED_RGBA_ASTC_8x8_KHR;if(i===oh)return a===Tt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:s.COMPRESSED_RGBA_ASTC_10x5_KHR;if(i===lh)return a===Tt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:s.COMPRESSED_RGBA_ASTC_10x6_KHR;if(i===ch)return a===Tt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:s.COMPRESSED_RGBA_ASTC_10x8_KHR;if(i===uh)return a===Tt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:s.COMPRESSED_RGBA_ASTC_10x10_KHR;if(i===dh)return a===Tt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:s.COMPRESSED_RGBA_ASTC_12x10_KHR;if(i===fh)return a===Tt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:s.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(i===hh||i===ph||i===mh)if(s=e.get("EXT_texture_compression_bptc"),s!==null){if(i===hh)return a===Tt?s.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:s.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(i===ph)return s.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(i===mh)return s.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(i===gh||i===_h||i===qc||i===vh)if(s=e.get("EXT_texture_compression_rgtc"),s!==null){if(i===gh)return s.COMPRESSED_RED_RGTC1_EXT;if(i===_h)return s.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(i===qc)return s.COMPRESSED_RED_GREEN_RGTC2_EXT;if(i===vh)return s.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return i===tl?t.UNSIGNED_INT_24_8:t[i]!==void 0?t[i]:null}return{convert:n}}const Kb=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,Zb=`
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

}`;class Qb{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(e,n){if(this.texture===null){const i=new yx(e.texture);(e.depthNear!==n.depthNear||e.depthFar!==n.depthFar)&&(this.depthNear=e.depthNear,this.depthFar=e.depthFar),this.texture=i}}getMesh(e){if(this.texture!==null&&this.mesh===null){const n=e.cameras[0].viewport,i=new lr({vertexShader:Kb,fragmentShader:Zb,uniforms:{depthColor:{value:this.texture},depthWidth:{value:n.z},depthHeight:{value:n.w}}});this.mesh=new ze(new za(20,20),i)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}}class Jb extends hs{constructor(e,n){super();const i=this;let r=null,s=1,a=null,o="local-floor",l=1,c=null,h=null,p=null,f=null,g=null,v=null;const E=typeof XRWebGLBinding<"u",_=new Qb,u={},m=n.getContextAttributes();let M=null,y=null;const T=[],w=[],R=new je;let x=null,A=null;const P=new Jn;P.viewport=new Gt;const L=new Jn;L.viewport=new Gt;const B=[P,L],F=new s1;let I=null,j=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(Z){let J=T[Z];return J===void 0&&(J=new md,T[Z]=J),J.getTargetRaySpace()},this.getControllerGrip=function(Z){let J=T[Z];return J===void 0&&(J=new md,T[Z]=J),J.getGripSpace()},this.getHand=function(Z){let J=T[Z];return J===void 0&&(J=new md,T[Z]=J),J.getHandSpace()};function N(Z){const J=w.indexOf(Z.inputSource);if(J===-1)return;const Ne=T[J];Ne!==void 0&&(Ne.update(Z.inputSource,Z.frame,c||a),Ne.dispatchEvent({type:Z.type,data:Z.inputSource}))}function H(){r.removeEventListener("select",N),r.removeEventListener("selectstart",N),r.removeEventListener("selectend",N),r.removeEventListener("squeeze",N),r.removeEventListener("squeezestart",N),r.removeEventListener("squeezeend",N),r.removeEventListener("end",H),r.removeEventListener("inputsourceschange",V);for(let Z=0;Z<T.length;Z++){const J=w[Z];J!==null&&(w[Z]=null,T[Z].disconnect(J))}I=null,j=null,_.reset();for(const Z in u)delete u[Z];if(e.setRenderTarget(M),g=null,f=null,p=null,r=null,y=null,Ke.stop(),i.isPresenting=!1,e.setPixelRatio(x),e.setSize(R.width,R.height,!1),A!==null){const Z=A.camera;Z.fov=A.fov,Z.zoom=A.zoom,Z.updateProjectionMatrix(),A=null}i.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(Z){s=Z,i.isPresenting===!0&&Ge("WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(Z){o=Z,i.isPresenting===!0&&Ge("WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return c||a},this.setReferenceSpace=function(Z){c=Z},this.getBaseLayer=function(){return f!==null?f:g},this.getBinding=function(){return p===null&&E&&(p=new XRWebGLBinding(r,n)),p},this.getFrame=function(){return v},this.getSession=function(){return r},this.setSession=async function(Z){if(r=Z,r!==null){if(M=e.getRenderTarget(),r.addEventListener("select",N),r.addEventListener("selectstart",N),r.addEventListener("selectend",N),r.addEventListener("squeeze",N),r.addEventListener("squeezestart",N),r.addEventListener("squeezeend",N),r.addEventListener("end",H),r.addEventListener("inputsourceschange",V),m.xrCompatible!==!0&&await n.makeXRCompatible(),x=e.getPixelRatio(),e.getSize(R),E&&"createProjectionLayer"in XRWebGLBinding.prototype){let Ne=null,We=null,Re=null;m.depth&&(Re=m.stencil?n.DEPTH24_STENCIL8:n.DEPTH_COMPONENT24,Ne=m.stencil?Rs:Nr,We=m.stencil?tl:ar);const Ze={colorFormat:n.RGBA8,depthFormat:Re,scaleFactor:s};p=this.getBinding(),f=p.createProjectionLayer(Ze),r.updateRenderState({layers:[f]}),e.setPixelRatio(1),e.setSize(f.textureWidth,f.textureHeight,!1),y=new Oi(f.textureWidth,f.textureHeight,{format:Ii,type:ti,depthTexture:new il(f.textureWidth,f.textureHeight,We,void 0,void 0,void 0,void 0,void 0,void 0,Ne),stencilBuffer:m.stencil,colorSpace:e.outputColorSpace,samples:m.antialias?4:0,resolveDepthBuffer:f.ignoreDepthValues===!1,resolveStencilBuffer:f.ignoreDepthValues===!1,storeMultisampledDepthBuffer:f.ignoreDepthValues===!1,storeMultisampledStencilBuffer:f.ignoreDepthValues===!1})}else{const Ne={antialias:m.antialias,alpha:!0,depth:m.depth,stencil:m.stencil,framebufferScaleFactor:s};g=new XRWebGLLayer(r,n,Ne),r.updateRenderState({baseLayer:g}),e.setPixelRatio(1),e.setSize(g.framebufferWidth,g.framebufferHeight,!1),y=new Oi(g.framebufferWidth,g.framebufferHeight,{format:Ii,type:ti,colorSpace:e.outputColorSpace,stencilBuffer:m.stencil,resolveDepthBuffer:g.ignoreDepthValues===!1,resolveStencilBuffer:g.ignoreDepthValues===!1,storeMultisampledDepthBuffer:g.ignoreDepthValues===!1,storeMultisampledStencilBuffer:g.ignoreDepthValues===!1})}y.isXRRenderTarget=!0,this.setFoveation(l),c=null,a=await r.requestReferenceSpace(o),Ke.setContext(r),Ke.start(),i.isPresenting=!0,i.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(r!==null)return r.environmentBlendMode},this.getDepthTexture=function(){return _.getDepthTexture()};function V(Z){for(let J=0;J<Z.removed.length;J++){const Ne=Z.removed[J],We=w.indexOf(Ne);We>=0&&(w[We]=null,T[We].disconnect(Ne))}for(let J=0;J<Z.added.length;J++){const Ne=Z.added[J];let We=w.indexOf(Ne);if(We===-1){for(let Ze=0;Ze<T.length;Ze++)if(Ze>=w.length){w.push(Ne),We=Ze;break}else if(w[Ze]===null){w[Ze]=Ne,We=Ze;break}if(We===-1)break}const Re=T[We];Re&&Re.connect(Ne)}}const G=new D,X=new D;function ne(Z,J,Ne){G.setFromMatrixPosition(J.matrixWorld),X.setFromMatrixPosition(Ne.matrixWorld);const We=G.distanceTo(X),Re=J.projectionMatrix.elements,Ze=Ne.projectionMatrix.elements,Be=Re[14]/(Re[10]-1),et=Re[14]/(Re[10]+1),ot=(Re[9]+1)/Re[5],yt=(Re[9]-1)/Re[5],it=(Re[8]-1)/Re[0],Pt=(Ze[8]+1)/Ze[0],Bt=Be*it,pn=Be*Pt,Rt=We/(-it+Pt),zt=Rt*-it;if(J.matrixWorld.decompose(Z.position,Z.quaternion,Z.scale),Z.translateX(zt),Z.translateZ(Rt),Z.matrixWorld.compose(Z.position,Z.quaternion,Z.scale),Z.matrixWorldInverse.copy(Z.matrixWorld).invert(),Re[10]===-1)Z.projectionMatrix.copy(J.projectionMatrix),Z.projectionMatrixInverse.copy(J.projectionMatrixInverse);else{const k=Be+Rt,qt=et+Rt,ht=Bt-zt,C=pn+(We-zt),S=ot*et/qt*k,W=yt*et/qt*k;Z.projectionMatrix.makePerspective(ht,C,S,W,k,qt),Z.projectionMatrixInverse.copy(Z.projectionMatrix).invert()}}function ve(Z,J){J===null?Z.matrixWorld.copy(Z.matrix):Z.matrixWorld.multiplyMatrices(J.matrixWorld,Z.matrix),Z.matrixWorldInverse.copy(Z.matrixWorld).invert()}this.updateCamera=function(Z){if(r===null)return;let J=Z.near,Ne=Z.far;_.texture!==null&&(_.depthNear>0&&(J=_.depthNear),_.depthFar>0&&(Ne=_.depthFar)),F.near=L.near=P.near=J,F.far=L.far=P.far=Ne,(I!==F.near||j!==F.far)&&(r.updateRenderState({depthNear:F.near,depthFar:F.far}),I=F.near,j=F.far),F.layers.mask=Z.layers.mask|6,P.layers.mask=F.layers.mask&-5,L.layers.mask=F.layers.mask&-3;const We=Z.parent,Re=F.cameras;ve(F,We);for(let Ze=0;Ze<Re.length;Ze++)ve(Re[Ze],We);Re.length===2?ne(F,P,L):F.projectionMatrix.copy(P.projectionMatrix),A===null&&Z.isPerspectiveCamera&&(A={camera:Z,fov:Z.fov,zoom:Z.zoom}),Pe(Z,F,We)};function Pe(Z,J,Ne){Ne===null?Z.matrix.copy(J.matrixWorld):(Z.matrix.copy(Ne.matrixWorld),Z.matrix.invert(),Z.matrix.multiply(J.matrixWorld)),Z.matrix.decompose(Z.position,Z.quaternion,Z.scale),Z.updateMatrixWorld(!0),Z.projectionMatrix.copy(J.projectionMatrix),Z.projectionMatrixInverse.copy(J.projectionMatrixInverse),Z.isPerspectiveCamera&&(Z.fov=yh*2*Math.atan(1/Z.projectionMatrix.elements[5]),Z.zoom=1)}this.getCamera=function(){return F},this.getFoveation=function(){if(!(f===null&&g===null))return l},this.setFoveation=function(Z){l=Z,f!==null&&(f.fixedFoveation=Z),g!==null&&g.fixedFoveation!==void 0&&(g.fixedFoveation=Z)},this.hasDepthSensing=function(){return _.texture!==null},this.getDepthSensingMesh=function(){return _.getMesh(F)},this.getCameraTexture=function(Z){return u[Z]};let Je=null;function $e(Z,J){if(h=J.getViewerPose(c||a),v=J,h!==null){const Ne=h.views;g!==null&&(e.setRenderTargetFramebuffer(y,g.framebuffer),e.setRenderTarget(y));let We=!1;Ne.length!==F.cameras.length&&(F.cameras.length=0,We=!0);for(let et=0;et<Ne.length;et++){const ot=Ne[et];let yt=null;if(g!==null)yt=g.getViewport(ot);else{const Pt=p.getViewSubImage(f,ot);yt=Pt.viewport,et===0&&(e.setRenderTargetTextures(y,Pt.colorTexture,Pt.depthStencilTexture),e.setRenderTarget(y))}let it=B[et];it===void 0&&(it=new Jn,it.layers.enable(et),it.viewport=new Gt,B[et]=it),it.matrix.fromArray(ot.transform.matrix),it.matrix.decompose(it.position,it.quaternion,it.scale),it.projectionMatrix.fromArray(ot.projectionMatrix),it.projectionMatrixInverse.copy(it.projectionMatrix).invert(),it.viewport.set(yt.x,yt.y,yt.width,yt.height),et===0&&(F.matrix.copy(it.matrix),F.matrix.decompose(F.position,F.quaternion,F.scale)),We===!0&&F.cameras.push(it)}const Re=r.enabledFeatures;if(Re&&Re.includes("depth-sensing")&&r.depthUsage=="gpu-optimized"&&E){p=i.getBinding();const et=p.getDepthInformation(Ne[0]);et&&et.isValid&&et.texture&&_.init(et,r.renderState)}if(Re&&Re.includes("camera-access")&&E){e.state.unbindTexture(),p=i.getBinding();for(let et=0;et<Ne.length;et++){const ot=Ne[et].camera;if(ot){let yt=u[ot];yt||(yt=new yx,u[ot]=yt);const it=p.getCameraImage(ot);yt.sourceTexture=it}}}}for(let Ne=0;Ne<T.length;Ne++){const We=w[Ne],Re=T[Ne];We!==null&&Re!==void 0&&Re.update(We,J,c||a)}Je&&Je(Z,J),J.detectedPlanes&&i.dispatchEvent({type:"planesdetected",data:J}),v=null}const Ke=new wx;Ke.setAnimationLoop($e),this.setAnimationLoop=function(Z){Je=Z},this.dispose=function(){}}}const eR=new kt,Nx=new Ye;Nx.set(-1,0,0,0,1,0,0,0,1);function tR(t,e){function n(_,u){_.matrixAutoUpdate===!0&&_.updateMatrix(),u.value.copy(_.matrix)}function i(_,u){u.color.getRGB(_.fogColor.value,Sx(t)),u.isFog?(_.fogNear.value=u.near,_.fogFar.value=u.far):u.isFogExp2&&(_.fogDensity.value=u.density)}function r(_,u,m,M,y){u.isNodeMaterial?u.uniformsNeedUpdate=!1:u.isMeshBasicMaterial?s(_,u):u.isMeshLambertMaterial?(s(_,u),u.envMap&&(_.envMapIntensity.value=u.envMapIntensity)):u.isMeshToonMaterial?(s(_,u),p(_,u)):u.isMeshPhongMaterial?(s(_,u),h(_,u),u.envMap&&(_.envMapIntensity.value=u.envMapIntensity)):u.isMeshStandardMaterial?(s(_,u),f(_,u),u.isMeshPhysicalMaterial&&g(_,u,y)):u.isMeshMatcapMaterial?(s(_,u),v(_,u)):u.isMeshDepthMaterial?s(_,u):u.isMeshDistanceMaterial?(s(_,u),E(_,u)):u.isMeshNormalMaterial?s(_,u):u.isLineBasicMaterial?(a(_,u),u.isLineDashedMaterial&&o(_,u)):u.isPointsMaterial?l(_,u,m,M):u.isSpriteMaterial?c(_,u):u.isShadowMaterial?(_.color.value.copy(u.color),_.opacity.value=u.opacity):u.isShaderMaterial&&(u.uniformsNeedUpdate=!1)}function s(_,u){_.opacity.value=u.opacity,u.color&&_.diffuse.value.copy(u.color),u.emissive&&_.emissive.value.copy(u.emissive).multiplyScalar(u.emissiveIntensity),u.map&&(_.map.value=u.map,n(u.map,_.mapTransform)),u.alphaMap&&(_.alphaMap.value=u.alphaMap,n(u.alphaMap,_.alphaMapTransform)),u.bumpMap&&(_.bumpMap.value=u.bumpMap,n(u.bumpMap,_.bumpMapTransform),_.bumpScale.value=u.bumpScale,u.side===$n&&(_.bumpScale.value*=-1)),u.normalMap&&(_.normalMap.value=u.normalMap,n(u.normalMap,_.normalMapTransform),_.normalScale.value.copy(u.normalScale),u.side===$n&&_.normalScale.value.negate()),u.displacementMap&&(_.displacementMap.value=u.displacementMap,n(u.displacementMap,_.displacementMapTransform),_.displacementScale.value=u.displacementScale,_.displacementBias.value=u.displacementBias),u.emissiveMap&&(_.emissiveMap.value=u.emissiveMap,n(u.emissiveMap,_.emissiveMapTransform)),u.specularMap&&(_.specularMap.value=u.specularMap,n(u.specularMap,_.specularMapTransform)),u.alphaTest>0&&(_.alphaTest.value=u.alphaTest);const m=e.get(u),M=m.envMap,y=m.envMapRotation;M&&(_.envMap.value=M,_.envMapRotation.value.setFromMatrix4(eR.makeRotationFromEuler(y)).transpose(),M.isCubeTexture&&M.isRenderTargetTexture===!1&&_.envMapRotation.value.premultiply(Nx),_.reflectivity.value=u.reflectivity,_.ior.value=u.ior,_.refractionRatio.value=u.refractionRatio),u.lightMap&&(_.lightMap.value=u.lightMap,_.lightMapIntensity.value=u.lightMapIntensity,n(u.lightMap,_.lightMapTransform)),u.aoMap&&(_.aoMap.value=u.aoMap,_.aoMapIntensity.value=u.aoMapIntensity,n(u.aoMap,_.aoMapTransform))}function a(_,u){_.diffuse.value.copy(u.color),_.opacity.value=u.opacity,u.map&&(_.map.value=u.map,n(u.map,_.mapTransform))}function o(_,u){_.dashSize.value=u.dashSize,_.totalSize.value=u.dashSize+u.gapSize,_.scale.value=u.scale}function l(_,u,m,M){_.diffuse.value.copy(u.color),_.opacity.value=u.opacity,_.size.value=u.size*m,_.scale.value=M*.5,u.map&&(_.map.value=u.map,n(u.map,_.uvTransform)),u.alphaMap&&(_.alphaMap.value=u.alphaMap,n(u.alphaMap,_.alphaMapTransform)),u.alphaTest>0&&(_.alphaTest.value=u.alphaTest)}function c(_,u){_.diffuse.value.copy(u.color),_.opacity.value=u.opacity,_.rotation.value=u.rotation,u.map&&(_.map.value=u.map,n(u.map,_.mapTransform)),u.alphaMap&&(_.alphaMap.value=u.alphaMap,n(u.alphaMap,_.alphaMapTransform)),u.alphaTest>0&&(_.alphaTest.value=u.alphaTest)}function h(_,u){_.specular.value.copy(u.specular),_.shininess.value=Math.max(u.shininess,1e-4)}function p(_,u){u.gradientMap&&(_.gradientMap.value=u.gradientMap)}function f(_,u){_.metalness.value=u.metalness,u.metalnessMap&&(_.metalnessMap.value=u.metalnessMap,n(u.metalnessMap,_.metalnessMapTransform)),_.roughness.value=u.roughness,u.roughnessMap&&(_.roughnessMap.value=u.roughnessMap,n(u.roughnessMap,_.roughnessMapTransform)),u.envMap&&(_.envMapIntensity.value=u.envMapIntensity)}function g(_,u,m){_.ior.value=u.ior,u.sheen>0&&(_.sheenColor.value.copy(u.sheenColor).multiplyScalar(u.sheen),_.sheenRoughness.value=u.sheenRoughness,u.sheenColorMap&&(_.sheenColorMap.value=u.sheenColorMap,n(u.sheenColorMap,_.sheenColorMapTransform)),u.sheenRoughnessMap&&(_.sheenRoughnessMap.value=u.sheenRoughnessMap,n(u.sheenRoughnessMap,_.sheenRoughnessMapTransform))),u.clearcoat>0&&(_.clearcoat.value=u.clearcoat,_.clearcoatRoughness.value=u.clearcoatRoughness,u.clearcoatMap&&(_.clearcoatMap.value=u.clearcoatMap,n(u.clearcoatMap,_.clearcoatMapTransform)),u.clearcoatRoughnessMap&&(_.clearcoatRoughnessMap.value=u.clearcoatRoughnessMap,n(u.clearcoatRoughnessMap,_.clearcoatRoughnessMapTransform)),u.clearcoatNormalMap&&(_.clearcoatNormalMap.value=u.clearcoatNormalMap,n(u.clearcoatNormalMap,_.clearcoatNormalMapTransform),_.clearcoatNormalScale.value.copy(u.clearcoatNormalScale),u.side===$n&&_.clearcoatNormalScale.value.negate())),u.dispersion>0&&(_.dispersion.value=u.dispersion),u.retroreflectivity>0&&(_.retroreflectivity.value=u.retroreflectivity),u.iridescence>0&&(_.iridescence.value=u.iridescence,_.iridescenceIOR.value=u.iridescenceIOR,_.iridescenceThicknessMinimum.value=u.iridescenceThicknessRange[0],_.iridescenceThicknessMaximum.value=u.iridescenceThicknessRange[1],u.iridescenceMap&&(_.iridescenceMap.value=u.iridescenceMap,n(u.iridescenceMap,_.iridescenceMapTransform)),u.iridescenceThicknessMap&&(_.iridescenceThicknessMap.value=u.iridescenceThicknessMap,n(u.iridescenceThicknessMap,_.iridescenceThicknessMapTransform))),u.transmission>0&&(_.transmission.value=u.transmission,_.transmissionSamplerMap.value=m.texture,_.transmissionSamplerSize.value.set(m.width,m.height),u.transmissionMap&&(_.transmissionMap.value=u.transmissionMap,n(u.transmissionMap,_.transmissionMapTransform)),_.thickness.value=u.thickness,u.thicknessMap&&(_.thicknessMap.value=u.thicknessMap,n(u.thicknessMap,_.thicknessMapTransform)),_.attenuationDistance.value=u.attenuationDistance,_.attenuationColor.value.copy(u.attenuationColor)),u.anisotropy>0&&(_.anisotropyVector.value.set(u.anisotropy*Math.cos(u.anisotropyRotation),u.anisotropy*Math.sin(u.anisotropyRotation)),u.anisotropyMap&&(_.anisotropyMap.value=u.anisotropyMap,n(u.anisotropyMap,_.anisotropyMapTransform))),_.specularIntensity.value=u.specularIntensity,_.specularColor.value.copy(u.specularColor),u.specularColorMap&&(_.specularColorMap.value=u.specularColorMap,n(u.specularColorMap,_.specularColorMapTransform)),u.specularIntensityMap&&(_.specularIntensityMap.value=u.specularIntensityMap,n(u.specularIntensityMap,_.specularIntensityMapTransform))}function v(_,u){u.matcap&&(_.matcap.value=u.matcap)}function E(_,u){const m=e.get(u).light;_.referencePosition.value.setFromMatrixPosition(m.matrixWorld),_.nearDistance.value=m.shadow.camera.near,_.farDistance.value=m.shadow.camera.far}return{refreshFogUniforms:i,refreshMaterialUniforms:r}}function nR(t,e,n,i){let r={},s={},a=[];const o=t.getParameter(t.MAX_UNIFORM_BUFFER_BINDINGS);function l(y,T){const w=T.program;i.uniformBlockBinding(y,w)}function c(y,T){let w=r[y.id];w===void 0&&(_(y),w=h(y),r[y.id]=w,y.addEventListener("dispose",m));const R=T.program;i.updateUBOMapping(y,R);const x=e.render.frame;s[y.id]!==x&&(f(y),s[y.id]=x)}function h(y){const T=p();y.__bindingPointIndex=T;const w=t.createBuffer(),R=y.__size,x=y.usage;return t.bindBuffer(t.UNIFORM_BUFFER,w),t.bufferData(t.UNIFORM_BUFFER,R,x),t.bindBuffer(t.UNIFORM_BUFFER,null),t.bindBufferBase(t.UNIFORM_BUFFER,T,w),w}function p(){for(let y=0;y<o;y++)if(a.indexOf(y)===-1)return a.push(y),y;return gt("WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function f(y){const T=r[y.id],w=y.uniforms,R=y.__cache;t.bindBuffer(t.UNIFORM_BUFFER,T);for(let x=0,A=w.length;x<A;x++){const P=w[x];if(Array.isArray(P))for(let L=0,B=P.length;L<B;L++)g(P[L],x,L,R);else g(P,x,0,R)}t.bindBuffer(t.UNIFORM_BUFFER,null)}function g(y,T,w,R){if(E(y,T,w,R)===!0){const x=y.__offset,A=y.value;if(Array.isArray(A)){let P=0;for(let L=0;L<A.length;L++){const B=A[L],F=u(B);v(B,y.__data,P),typeof B!="number"&&typeof B!="boolean"&&!B.isMatrix3&&!ArrayBuffer.isView(B)&&(P+=F.storage/Float32Array.BYTES_PER_ELEMENT)}}else v(A,y.__data,0);t.bufferSubData(t.UNIFORM_BUFFER,x,y.__data)}}function v(y,T,w){typeof y=="number"||typeof y=="boolean"?T[0]=y:y.isMatrix3?(T[0]=y.elements[0],T[1]=y.elements[1],T[2]=y.elements[2],T[3]=0,T[4]=y.elements[3],T[5]=y.elements[4],T[6]=y.elements[5],T[7]=0,T[8]=y.elements[6],T[9]=y.elements[7],T[10]=y.elements[8],T[11]=0):ArrayBuffer.isView(y)?T.set(new y.constructor(y.buffer,y.byteOffset,T.length)):y.toArray(T,w)}function E(y,T,w,R){const x=y.value,A=T+"_"+w;if(R[A]===void 0)return typeof x=="number"||typeof x=="boolean"?R[A]=x:ArrayBuffer.isView(x)?R[A]=x.slice():R[A]=x.clone(),!0;{const P=R[A];if(typeof x=="number"||typeof x=="boolean"){if(P!==x)return R[A]=x,!0}else{if(ArrayBuffer.isView(x))return!0;if(P.equals(x)===!1)return P.copy(x),!0}}return!1}function _(y){const T=y.uniforms;let w=0;const R=16;for(let A=0,P=T.length;A<P;A++){const L=Array.isArray(T[A])?T[A]:[T[A]];for(let B=0,F=L.length;B<F;B++){const I=L[B],j=Array.isArray(I.value)?I.value:[I.value];for(let N=0,H=j.length;N<H;N++){const V=j[N],G=u(V),X=w%R,ne=X%G.boundary,ve=X+ne;w+=ne,ve!==0&&R-ve<G.storage&&(w+=R-ve),I.__data=new Float32Array(G.storage/Float32Array.BYTES_PER_ELEMENT),I.__offset=w,w+=G.storage}}}const x=w%R;return x>0&&(w+=R-x),y.__size=w,y.__cache={},this}function u(y){const T={boundary:0,storage:0};return typeof y=="number"||typeof y=="boolean"?(T.boundary=4,T.storage=4):y.isVector2?(T.boundary=8,T.storage=8):y.isVector3||y.isColor?(T.boundary=16,T.storage=12):y.isVector4?(T.boundary=16,T.storage=16):y.isMatrix3?(T.boundary=48,T.storage=48):y.isMatrix4?(T.boundary=64,T.storage=64):y.isTexture?Ge("WebGLRenderer: Texture samplers can not be part of an uniforms group."):ArrayBuffer.isView(y)?(T.boundary=16,T.storage=y.byteLength):Ge("WebGLRenderer: Unsupported uniform value type.",y),T}function m(y){const T=y.target;T.removeEventListener("dispose",m);const w=a.indexOf(T.__bindingPointIndex);a.splice(w,1),t.deleteBuffer(r[T.id]),delete r[T.id],delete s[T.id]}function M(){for(const y in r)t.deleteBuffer(r[y]);a=[],r={},s={}}return{bind:l,update:c,dispose:M}}const iR=new Uint16Array([12469,15057,12620,14925,13266,14620,13807,14376,14323,13990,14545,13625,14713,13328,14840,12882,14931,12528,14996,12233,15039,11829,15066,11525,15080,11295,15085,10976,15082,10705,15073,10495,13880,14564,13898,14542,13977,14430,14158,14124,14393,13732,14556,13410,14702,12996,14814,12596,14891,12291,14937,11834,14957,11489,14958,11194,14943,10803,14921,10506,14893,10278,14858,9960,14484,14039,14487,14025,14499,13941,14524,13740,14574,13468,14654,13106,14743,12678,14818,12344,14867,11893,14889,11509,14893,11180,14881,10751,14852,10428,14812,10128,14765,9754,14712,9466,14764,13480,14764,13475,14766,13440,14766,13347,14769,13070,14786,12713,14816,12387,14844,11957,14860,11549,14868,11215,14855,10751,14825,10403,14782,10044,14729,9651,14666,9352,14599,9029,14967,12835,14966,12831,14963,12804,14954,12723,14936,12564,14917,12347,14900,11958,14886,11569,14878,11247,14859,10765,14828,10401,14784,10011,14727,9600,14660,9289,14586,8893,14508,8533,15111,12234,15110,12234,15104,12216,15092,12156,15067,12010,15028,11776,14981,11500,14942,11205,14902,10752,14861,10393,14812,9991,14752,9570,14682,9252,14603,8808,14519,8445,14431,8145,15209,11449,15208,11451,15202,11451,15190,11438,15163,11384,15117,11274,15055,10979,14994,10648,14932,10343,14871,9936,14803,9532,14729,9218,14645,8742,14556,8381,14461,8020,14365,7603,15273,10603,15272,10607,15267,10619,15256,10631,15231,10614,15182,10535,15118,10389,15042,10167,14963,9787,14883,9447,14800,9115,14710,8665,14615,8318,14514,7911,14411,7507,14279,7198,15314,9675,15313,9683,15309,9712,15298,9759,15277,9797,15229,9773,15166,9668,15084,9487,14995,9274,14898,8910,14800,8539,14697,8234,14590,7790,14479,7409,14367,7067,14178,6621,15337,8619,15337,8631,15333,8677,15325,8769,15305,8871,15264,8940,15202,8909,15119,8775,15022,8565,14916,8328,14804,8009,14688,7614,14569,7287,14448,6888,14321,6483,14088,6171,15350,7402,15350,7419,15347,7480,15340,7613,15322,7804,15287,7973,15229,8057,15148,8012,15046,7846,14933,7611,14810,7357,14682,7069,14552,6656,14421,6316,14251,5948,14007,5528,15356,5942,15356,5977,15353,6119,15348,6294,15332,6551,15302,6824,15249,7044,15171,7122,15070,7050,14949,6861,14818,6611,14679,6349,14538,6067,14398,5651,14189,5311,13935,4958,15359,4123,15359,4153,15356,4296,15353,4646,15338,5160,15311,5508,15263,5829,15188,6042,15088,6094,14966,6001,14826,5796,14678,5543,14527,5287,14377,4985,14133,4586,13869,4257,15360,1563,15360,1642,15358,2076,15354,2636,15341,3350,15317,4019,15273,4429,15203,4732,15105,4911,14981,4932,14836,4818,14679,4621,14517,4386,14359,4156,14083,3795,13808,3437,15360,122,15360,137,15358,285,15355,636,15344,1274,15322,2177,15281,2765,15215,3223,15120,3451,14995,3569,14846,3567,14681,3466,14511,3305,14344,3121,14037,2800,13753,2467,15360,0,15360,1,15359,21,15355,89,15346,253,15325,479,15287,796,15225,1148,15133,1492,15008,1749,14856,1882,14685,1886,14506,1783,14324,1608,13996,1398,13702,1183]);let Yi=null;function rR(){return Yi===null&&(Yi=new HE(iR,16,16,ks,or),Yi.name="DFG_LUT",Yi.minFilter=An,Yi.magFilter=An,Yi.wrapS=Mr,Yi.wrapT=Mr,Yi.generateMipmaps=!1,Yi.needsUpdate=!0),Yi}class sR{constructor(e={}){const{canvas:n=mE(),context:i=null,depth:r=!0,stencil:s=!1,alpha:a=!1,antialias:o=!1,premultipliedAlpha:l=!0,preserveDrawingBuffer:c=!1,powerPreference:h="default",failIfMajorPerformanceCaveat:p=!1,reversedDepthBuffer:f=!1,outputBufferType:g=ti}=e;this.isWebGLRenderer=!0;let v;if(i!==null){if(typeof WebGLRenderingContext<"u"&&i instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");v=i.getContextAttributes().alpha}else v=a;const E=g,_=new Set([Cp,Rp,bp]),u=new Set([ti,ar,el,tl,Tp,Ap]),m=new Uint32Array(4),M=new Int32Array(4),y=new D;let T=null,w=null;const R=[],x=[];let A=null;this.domElement=n,this.debug={checkShaderErrors:!0,diagnostics:{keywords:!1},onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=sr,this.toneMappingExposure=1,this.transmissionResolutionScale=1;const P=this;let L=!1,B=null,F=null,I=null,j=null;this._outputColorSpace=fi;let N=0,H=0,V=null,G=-1,X=null;const ne=new Gt,ve=new Gt;let Pe=null;const Je=new dt(0);let $e=0,Ke=n.width,Z=n.height,J=1,Ne=null,We=null;const Re=new Gt(0,0,Ke,Z),Ze=new Gt(0,0,Ke,Z);let Be=!1;const et=new Up;let ot=!1,yt=!1;const it=new kt,Pt=new D,Bt=new Gt,pn={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0};let Rt=!1;function zt(){return V===null?J:1}let k=i;function qt(b,U){return n.getContext(b,U)}let ht,C,S,W,Y,ie,de,ge,re,ae,fe,Fe,xe,pe,Oe,ke,qe,O,_e,ee,me,Se,se;try{const b={alpha:!0,depth:r,stencil:s,antialias:o,premultipliedAlpha:l,preserveDrawingBuffer:c,powerPreference:h,failIfMajorPerformanceCaveat:p};if("setAttribute"in n&&n.setAttribute("data-engine",`three.js r${Ep}`),n.addEventListener("webglcontextlost",pt,!1),n.addEventListener("webglcontextrestored",nt,!1),n.addEventListener("webglcontextcreationerror",Cn,!1),k===null){const U="webgl2";if(k=qt(U,b),k===null)throw qt(U)?new Error("THREE.WebGLRenderer: Error creating WebGL context with your selected attributes."):new Error("THREE.WebGLRenderer: Error creating WebGL context.")}ye()}catch(b){throw n.removeEventListener("webglcontextlost",pt,!1),n.removeEventListener("webglcontextrestored",nt,!1),n.removeEventListener("webglcontextcreationerror",Cn,!1),gt("WebGLRenderer: "+b.message),b}function ye(){ht=new rA(k),ht.init(),me=new Yb(k,ht),C=new qT(k,ht,e,me),S=new $b(k,ht),C.reversedDepthBuffer&&f&&S.buffers.depth.setReversed(!0),F=k.createFramebuffer(),I=k.createFramebuffer(),j=k.createFramebuffer(),W=new oA(k),Y=new Db,ie=new qb(k,ht,S,Y,C,me,W),de=new iA(P),ge=new c1(k),Se=new XT(k,ge),re=new sA(k,ge,W,Se),ae=new cA(k,re,ge,Se,W),O=new lA(k,C,ie),Oe=new YT(Y),fe=new Lb(P,de,ht,C,Se,Oe),Fe=new tR(P,Y),xe=new Ub,pe=new Hb(ht),qe=new jT(P,de,S,ae,v,l),ke=new Xb(P,ae,C),se=new nR(k,W,C,S),_e=new $T(k,ht,W),ee=new aA(k,ht,W),W.programs=fe.programs,P.capabilities=C,P.extensions=ht,P.properties=Y,P.renderLists=xe,P.shadowMap=ke,P.state=S,P.info=W}E!==ti&&(A=new dA(E,n.width,n.height,o,r,s));const Ie=new Jb(P,k);this.xr=Ie,this.getContext=function(){return k},this.getContextAttributes=function(){return k.getContextAttributes()},this.forceContextLoss=function(){const b=ht.get("WEBGL_lose_context");b&&b.loseContext()},this.forceContextRestore=function(){const b=ht.get("WEBGL_lose_context");b&&b.restoreContext()},this.getPixelRatio=function(){return J},this.setPixelRatio=function(b){b!==void 0&&(J=b,this.setSize(Ke,Z,!1))},this.getSize=function(b){return b.set(Ke,Z)},this.setSize=function(b,U,K=!0){if(Ie.isPresenting){Ge("WebGLRenderer: Can't change size while VR device is presenting.");return}Ke=b,Z=U,n.width=Math.floor(b*J),n.height=Math.floor(U*J),K===!0&&(n.style.width=b+"px",n.style.height=U+"px"),A!==null&&A.setSize(n.width,n.height),this.setViewport(0,0,b,U)},this.getDrawingBufferSize=function(b){return b.set(Ke*J,Z*J).floor()},this.setDrawingBufferSize=function(b,U,K){Ke=b,Z=U,J=K,n.width=Math.floor(b*K),n.height=Math.floor(U*K),this.setViewport(0,0,b,U)},this.setEffects=function(b){if(E===ti){gt("WebGLRenderer: setEffects() requires outputBufferType set to HalfFloatType or FloatType.");return}if(b){for(let U=0;U<b.length;U++)if(b[U].isOutputPass===!0){Ge("WebGLRenderer: OutputPass is not needed in setEffects(). Tone mapping and color space conversion are applied automatically.");break}}A.setEffects(b||[])},this.getCurrentViewport=function(b){return b.copy(ne)},this.getViewport=function(b){return b.copy(Re)},this.setViewport=function(b,U,K,q){b.isVector4?Re.set(b.x,b.y,b.z,b.w):Re.set(b,U,K,q),S.viewport(ne.copy(Re).multiplyScalar(J).round())},this.getScissor=function(b){return b.copy(Ze)},this.setScissor=function(b,U,K,q){b.isVector4?Ze.set(b.x,b.y,b.z,b.w):Ze.set(b,U,K,q),S.scissor(ve.copy(Ze).multiplyScalar(J).round())},this.getScissorTest=function(){return Be},this.setScissorTest=function(b){S.setScissorTest(Be=b)},this.setOpaqueSort=function(b){Ne=b},this.setTransparentSort=function(b){We=b},this.getClearColor=function(b){return b.copy(qe.getClearColor())},this.setClearColor=function(){qe.setClearColor(...arguments)},this.getClearAlpha=function(){return qe.getClearAlpha()},this.setClearAlpha=function(){qe.setClearAlpha(...arguments)},this.clear=function(b=!0,U=!0,K=!0){let q=0;if(b){let $=!1;if(V!==null){const Me=V.texture.format;$=_.has(Me)}if($){const Me=V.texture.type,we=u.has(Me),he=qe.getClearColor(),Le=qe.getClearAlpha(),Ue=he.r,Qe=he.g,Xe=he.b;we?(m[0]=Ue,m[1]=Qe,m[2]=Xe,m[3]=Le,k.clearBufferuiv(k.COLOR,0,m)):(M[0]=Ue,M[1]=Qe,M[2]=Xe,M[3]=Le,k.clearBufferiv(k.COLOR,0,M))}else q|=k.COLOR_BUFFER_BIT}U&&(q|=k.DEPTH_BUFFER_BIT,this.state.buffers.depth.setMask(!0)),K&&(q|=k.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),q!==0&&k.clear(q)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.setNodesHandler=function(b){b.setRenderer(this),B=b},this.dispose=function(){n.removeEventListener("webglcontextlost",pt,!1),n.removeEventListener("webglcontextrestored",nt,!1),n.removeEventListener("webglcontextcreationerror",Cn,!1),qe.dispose(),xe.dispose(),pe.dispose(),Y.dispose(),de.dispose(),ae.dispose(),Se.dispose(),se.dispose(),fe.dispose(),Ie.dispose(),Ie.removeEventListener("sessionstart",ps),Ie.removeEventListener("sessionend",zi),Hi.stop()};function pt(b){b.preventDefault(),M0("WebGLRenderer: Context Lost."),L=!0}function nt(){M0("WebGLRenderer: Context Restored."),L=!1;const b=W.autoReset,U=ke.enabled,K=ke.autoUpdate,q=ke.needsUpdate,$=ke.type;ye(),W.autoReset=b,ke.enabled=U,ke.autoUpdate=K,ke.needsUpdate=q,ke.type=$}function Cn(b){gt("WebGLRenderer: A WebGL context could not be created. Reason: ",b.statusMessage)}function Fn(b){const U=b.target;U.removeEventListener("dispose",Fn),Ir(U)}function Ir(b){yi(b),Y.remove(b)}function yi(b){const U=Y.get(b).programs;U!==void 0&&(U.forEach(function(K){fe.releaseProgram(K)}),b.isShaderMaterial&&fe.releaseShaderCache(b))}this.renderBufferDirect=function(b,U,K,q,$,Me){U===null&&(U=pn);const we=$.isMesh&&$.matrixWorld.determinantAffine()<0,he=Gs(b,U,K,q,$);S.setMaterial(q,we);let Le=K.index,Ue=1;if(q.wireframe===!0){if(Le=re.getWireframeAttribute(K),Le===void 0)return;Ue=2}const Qe=K.drawRange,Xe=K.attributes.position;let Ce=Qe.start*Ue,vt=(Qe.start+Qe.count)*Ue;Me!==null&&(Ce=Math.max(Ce,Me.start*Ue),vt=Math.min(vt,(Me.start+Me.count)*Ue)),Le!==null?(Ce=Math.max(Ce,0),vt=Math.min(vt,Le.count)):Xe!=null&&(Ce=Math.max(Ce,0),vt=Math.min(vt,Xe.count));const Xt=vt-Ce;if(Xt<0||Xt===1/0)return;Se.setup($,q,he,K,Le);let Ct,Et=_e;if(Le!==null&&(Ct=ge.get(Le),Et=ee,Et.setIndex(Ct)),$.isMesh)q.wireframe===!0?(S.setLineWidth(q.wireframeLinewidth*zt()),Et.setMode(k.LINES)):Et.setMode(k.TRIANGLES);else if($.isLine){let Yt=q.linewidth;Yt===void 0&&(Yt=1),S.setLineWidth(Yt*zt()),$.isLineSegments?Et.setMode(k.LINES):$.isLineLoop?Et.setMode(k.LINE_LOOP):Et.setMode(k.LINE_STRIP)}else $.isPoints?Et.setMode(k.POINTS):$.isSprite&&Et.setMode(k.TRIANGLES);if($.isBatchedMesh)if(ht.get("WEBGL_multi_draw"))Et.renderMultiDraw($._multiDrawStarts,$._multiDrawCounts,$._multiDrawCount);else{const Yt=$._multiDrawStarts,Ae=$._multiDrawCounts,Lt=$._multiDrawCount,ut=Le?ge.get(Le).bytesPerElement:1,On=Y.get(q).currentProgram.getUniforms();for(let Yn=0;Yn<Lt;Yn++)On.setValue(k,"_gl_DrawID",Yn),Et.render(Yt[Yn]/ut,Ae[Yn])}else if($.isInstancedMesh)Et.renderInstances(Ce,Xt,$.count);else if(K.isInstancedBufferGeometry){const Yt=K._maxInstanceCount!==void 0?K._maxInstanceCount:1/0,Ae=Math.min(K.instanceCount,Yt);Et.renderInstances(Ce,Xt,Ae)}else Et.render(Ce,Xt)};function qa(b,U,K,q){B!==null&&b.isNodeMaterial&&B.setObject(q,b),ot===!0&&Oe.setState(b,K,!1),b.transparent===!0&&b.side===Vn&&b.forceSinglePass===!1?(b.side=$n,b.needsUpdate=!0,Vs(b,U,q),b.side=Fs,b.needsUpdate=!0,Vs(b,U,q),b.side=Vn):Vs(b,U,q)}this.compile=function(b,U,K=null){K===null&&(K=b),B!==null&&B.renderStart(b,U,K),w=pe.get(K),w.init(U),x.push(w),K.traverseVisible(function($){$.isLight&&$.layers.test(U.layers)&&(w.pushLight($),$.castShadow&&w.pushShadow($))}),b!==K&&b.traverseVisible(function($){$.isLight&&$.layers.test(U.layers)&&(w.pushLight($),$.castShadow&&w.pushShadow($))}),w.setupLights(),B!==null&&B.updateLights(w.state.lightsArray),yt=this.localClippingEnabled,ot=Oe.init(this.clippingPlanes,yt),ot===!0&&Oe.setGlobalState(this.clippingPlanes,U),B!==null&&ke.render(w.state.shadowsArray,K,U);const q=new Set;return b.traverse(function($){if(!($.isMesh||$.isPoints||$.isLine||$.isSprite))return;const Me=$.material;if(Me)if(Array.isArray(Me))for(let we=0;we<Me.length;we++){const he=Me[we];qa(he,K,U,$),q.add(he)}else qa(Me,K,U,$),q.add(Me)}),w=x.pop(),B!==null&&B.renderEnd(),q},this.compileAsync=function(b,U,K=null){const q=this.compile(b,U,K);return new Promise($=>{function Me(){if(q.forEach(function(we){const Le=Y.get(we).currentProgram;(Le===void 0||Le.isReady())&&q.delete(we)}),q.size===0){$(b);return}setTimeout(Me,10)}ht.get("KHR_parallel_shader_compile")!==null?Me():setTimeout(Me,10)})};let cr=null;function Bi(b){cr&&cr(b)}function ps(){Hi.stop()}function zi(){Hi.start()}const Hi=new wx;Hi.setAnimationLoop(Bi),typeof self<"u"&&Hi.setContext(self),this.setAnimationLoop=function(b){cr=b,Ie.setAnimationLoop(b),b===null?Hi.stop():Hi.start()},Ie.addEventListener("sessionstart",ps),Ie.addEventListener("sessionend",zi),this.render=function(b,U){if(U!==void 0&&U.isCamera!==!0){gt("WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(L===!0)return;B!==null&&B.renderStart(b,U);const K=Ie.enabled===!0&&Ie.isPresenting===!0,q=A!==null&&(V===null||K)&&A.begin(P,V);if(b.matrixWorldAutoUpdate===!0&&b.updateMatrixWorld(),U.parent===null&&U.matrixWorldAutoUpdate===!0&&U.updateMatrixWorld(),Ie.enabled===!0&&Ie.isPresenting===!0&&(A===null||A.isCompositing()===!1)&&(Ie.cameraAutoUpdate===!0&&Ie.updateCamera(U),U=Ie.getCamera()),b.isScene===!0&&b.onBeforeRender(P,b,U,V),w=pe.get(b,x.length),w.init(U),w.state.textureUnits=ie.getTextureUnits(),x.push(w),it.multiplyMatrices(U.projectionMatrix,U.matrixWorldInverse),et.setFromProjectionMatrix(it,nr,U.reversedDepth),yt=this.localClippingEnabled,ot=Oe.init(this.clippingPlanes,yt),T=xe.get(b,R.length),T.init(),R.push(T),Ie.enabled===!0&&Ie.isPresenting===!0){const we=P.xr.getDepthSensingMesh();we!==null&&ms(we,U,-1/0,P.sortObjects)}ms(b,U,0,P.sortObjects),T.finish(),B!==null&&B.updateLights(w.state.lightsArray),P.sortObjects===!0&&T.sort(Ne,We),Rt=Ie.enabled===!1||Ie.isPresenting===!1||Ie.hasDepthSensing()===!1,Rt&&qe.addToRenderList(T,b),this.info.render.frame++,this.info.autoReset===!0&&this.info.reset(),ot===!0&&Oe.beginShadows();const $=w.state.shadowsArray;if(ke.render($,b,U),ot===!0&&Oe.endShadows(),(q&&A.hasRenderPass())===!1){const we=T.opaque,he=T.transmissive;if(w.setupLights(),U.isArrayCamera){const Le=U.cameras;if(he.length>0)for(let Ue=0,Qe=Le.length;Ue<Qe;Ue++){const Xe=Le[Ue];Ka(we,he,b,Xe)}Rt&&qe.render(b);for(let Ue=0,Qe=Le.length;Ue<Qe;Ue++){const Xe=Le[Ue];Ya(T,b,Xe,Xe.viewport)}}else he.length>0&&Ka(we,he,b,U),Rt&&qe.render(b),Ya(T,b,U)}V!==null&&H===0&&(ie.updateMultisampleRenderTarget(V),ie.updateRenderTargetMipmap(V)),q&&A.end(P),b.isScene===!0&&b.onAfterRender(P,b,U),Se.resetDefaultState(),G=-1,X=null,x.pop(),x.length>0?(w=x[x.length-1],ie.setTextureUnits(w.state.textureUnits),ot===!0&&Oe.setGlobalState(P.clippingPlanes,w.state.camera)):w=null,R.pop(),R.length>0?T=R[R.length-1]:T=null,B!==null&&B.renderEnd()};function ms(b,U,K,q){if(b.visible===!1)return;if(b.layers.test(U.layers)){if(b.isGroup)K=b.renderOrder;else if(b.isLOD)b.autoUpdate===!0&&b.update(U);else if(b.isLightProbeGrid)w.pushLightProbeGrid(b);else if(b.isLight)w.pushLight(b),b.castShadow&&w.pushShadow(b);else if(b.isSprite){if(!b.frustumCulled||b.intersectsFrustum(et)){q&&Bt.setFromMatrixPosition(b.matrixWorld).applyMatrix4(it);const we=ae.update(b),he=b.material;he.visible&&T.push(b,we,he,K,Bt.z,null,U)}}else if((b.isMesh||b.isLine||b.isPoints)&&(!b.frustumCulled||b.intersectsFrustum(et))){const we=ae.update(b),he=b.material;if(q&&(b.boundingSphere!==void 0?(b.boundingSphere===null&&b.computeBoundingSphere(),Bt.copy(b.boundingSphere.center)):(we.boundingSphere===null&&we.computeBoundingSphere(),Bt.copy(we.boundingSphere.center)),Bt.applyMatrix4(b.matrixWorld).applyMatrix4(it)),Array.isArray(he)){const Le=we.groups;for(let Ue=0,Qe=Le.length;Ue<Qe;Ue++){const Xe=Le[Ue],Ce=he[Xe.materialIndex];Ce&&Ce.visible&&T.push(b,we,Ce,K,Bt.z,Xe,U)}}else he.visible&&T.push(b,we,he,K,Bt.z,null,U)}}const Me=b.children;for(let we=0,he=Me.length;we<he;we++)ms(Me[we],U,K,q)}function Ya(b,U,K,q){const{opaque:$,transmissive:Me,transparent:we}=b;w.setupLightsView(K),ot===!0&&Oe.setGlobalState(P.clippingPlanes,K),q&&S.viewport(ne.copy(q)),$.length>0&&Ur($,U,K),Me.length>0&&Ur(Me,U,K),we.length>0&&Ur(we,U,K),S.buffers.depth.setTest(!0),S.buffers.depth.setMask(!0),S.buffers.color.setMask(!0),S.setPolygonOffset(!1)}function Ka(b,U,K,q){if((K.isScene===!0?K.overrideMaterial:null)!==null)return;if(w.state.transmissionRenderTarget[q.id]===void 0){const Ce=ht.has("EXT_color_buffer_half_float")||ht.has("EXT_color_buffer_float");w.state.transmissionRenderTarget[q.id]=new Oi(1,1,{generateMipmaps:!0,type:Ce?or:ti,minFilter:bs,samples:Math.max(4,C.samples),stencilBuffer:s,resolveDepthBuffer:!1,resolveStencilBuffer:!1,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,colorSpace:ft.workingColorSpace})}const Me=w.state.transmissionRenderTarget[q.id],we=q.viewport||ne;Me.setSize(we.z*P.transmissionResolutionScale,we.w*P.transmissionResolutionScale);const he=P.getRenderTarget(),Le=P.getActiveCubeFace(),Ue=P.getActiveMipmapLevel();P.setRenderTarget(Me),P.getClearColor(Je),$e=P.getClearAlpha(),$e<1&&P.setClearColor(16777215,.5),P.clear(),Rt&&qe.render(K);const Qe=P.toneMapping;P.toneMapping=sr;const Xe=q.viewport;if(q.viewport!==void 0&&(q.viewport=void 0),w.setupLightsView(q),ot===!0&&Oe.setGlobalState(P.clippingPlanes,q),Ur(b,K,q),ie.updateMultisampleRenderTarget(Me),ie.updateRenderTargetMipmap(Me),ht.has("WEBGL_multisampled_render_to_texture")===!1){let Ce=!1;for(let vt=0,Xt=U.length;vt<Xt;vt++){const Ct=U[vt],{object:Et,geometry:Yt,material:Ae,group:Lt}=Ct;if(Ae.side===Vn&&Et.layers.test(q.layers)){const ut=Ae.side;Ae.side=$n,Ae.needsUpdate=!0,Hs(Et,K,q,Yt,Ae,Lt),Ae.side=ut,Ae.needsUpdate=!0,Ce=!0}}Ce===!0&&(ie.updateMultisampleRenderTarget(Me),ie.updateRenderTargetMipmap(Me))}P.setRenderTarget(he,Le,Ue),P.setClearColor(Je,$e),Xe!==void 0&&(q.viewport=Xe),P.toneMapping=Qe}function Ur(b,U,K){const q=U.isScene===!0?U.overrideMaterial:null;for(let $=0,Me=b.length;$<Me;$++){const we=b[$],{object:he,geometry:Le,group:Ue}=we;let Qe=we.material;Qe.allowOverride===!0&&q!==null&&(Qe=q),he.layers.test(K.layers)&&Hs(he,U,K,Le,Qe,Ue)}}function Hs(b,U,K,q,$,Me){B!==null&&$.isNodeMaterial&&B.setObject(b,$),b.onBeforeRender(P,U,K,q,$,Me),b.modelViewMatrix.multiplyMatrices(K.matrixWorldInverse,b.matrixWorld),b.normalMatrix.getNormalMatrix(b.modelViewMatrix),$.onBeforeRender(P,U,K,q,b,Me),$.transparent===!0&&$.side===Vn&&$.forceSinglePass===!1?($.side=$n,$.needsUpdate=!0,P.renderBufferDirect(K,U,q,$,b,Me),$.side=Fs,$.needsUpdate=!0,P.renderBufferDirect(K,U,q,$,b,Me),$.side=Vn):P.renderBufferDirect(K,U,q,$,b,Me),b.onAfterRender(P,U,K,q,$,Me)}function Vs(b,U,K){U.isScene!==!0&&(U=pn);const q=Y.get(b),$=w.state.lights,Me=w.state.shadowsArray,we=$.state.version,he=fe.getParameters(b,$.state,Me,U,K,w.state.lightProbeGridArray),Le=fe.getProgramCacheKey(he);let Ue=q.programs;q.environment=b.isMeshStandardMaterial||b.isMeshLambertMaterial||b.isMeshPhongMaterial?U.environment:null,q.fog=U.fog;const Qe=b.isMeshStandardMaterial||b.isMeshLambertMaterial&&!b.envMap||b.isMeshPhongMaterial&&!b.envMap;q.envMap=de.get(b.envMap||q.environment,Qe),q.envMapRotation=q.environment!==null&&b.envMap===null?U.environmentRotation:b.envMapRotation,Ue===void 0&&(b.addEventListener("dispose",Fn),Ue=new Map,q.programs=Ue);let Xe=Ue.get(Le);if(Xe!==void 0){if(q.currentProgram===Xe&&q.lightsStateVersion===we)return ur(b,he),Xe}else he.uniforms=fe.getUniforms(b),B!==null&&b.isNodeMaterial&&B.build(b,K,he),b.onBeforeCompile(he,P),Xe=fe.acquireProgram(he,Le),Ue.set(Le,Xe),q.uniforms=he.uniforms;const Ce=q.uniforms;return(!b.isShaderMaterial&&!b.isRawShaderMaterial||b.clipping===!0)&&(Ce.clippingPlanes=Oe.uniform),ur(b,he),q.needsLights=Cu(b),q.lightsStateVersion=we,q.needsLights&&(Ce.ambientLightColor.value=$.state.ambient,Ce.lightProbe.value=$.state.probe,Ce.sunLights.value=$.state.sun,Ce.sunLightShadows.value=$.state.sunShadow,Ce.directionalLights.value=$.state.directional,Ce.directionalLightShadows.value=$.state.directionalShadow,Ce.spotLights.value=$.state.spot,Ce.spotLightShadows.value=$.state.spotShadow,Ce.rectAreaLights.value=$.state.rectArea,Ce.ltc_1.value=$.state.rectAreaLTC1,Ce.ltc_2.value=$.state.rectAreaLTC2,Ce.pointLights.value=$.state.point,Ce.pointLightShadows.value=$.state.pointShadow,Ce.hemisphereLights.value=$.state.hemi,Ce.sunShadowMatrix.value=$.state.sunShadowMatrix,Ce.sunShadowCascade.value=$.state.sunShadowCascade,Ce.directionalShadowMatrix.value=$.state.directionalShadowMatrix,Ce.spotLightMatrix.value=$.state.spotLightMatrix,Ce.spotLightMap.value=$.state.spotLightMap,Ce.pointShadowMatrix.value=$.state.pointShadowMatrix),q.lightProbeGrid=w.state.lightProbeGridArray.length>0,q.currentProgram=Xe,q.uniformsList=null,Xe}function Za(b){if(b.uniformsList===null){const U=b.currentProgram.getUniforms();b.uniformsList=Mc.seqWithValue(U.seq,b.uniforms)}return b.uniformsList}function ur(b,U){const K=Y.get(b);K.outputColorSpace=U.outputColorSpace,K.batching=U.batching,K.batchingColor=U.batchingColor,K.instancing=U.instancing,K.instancingColor=U.instancingColor,K.instancingMorph=U.instancingMorph,K.skinning=U.skinning,K.morphTargets=U.morphTargets,K.morphNormals=U.morphNormals,K.morphColors=U.morphColors,K.morphTargetsCount=U.morphTargetsCount,K.numClippingPlanes=U.numClippingPlanes,K.numIntersection=U.numClipIntersection,K.vertexAlphas=U.vertexAlphas,K.vertexTangents=U.vertexTangents,K.toneMapping=U.toneMapping}function bu(b,U){if(b.length===0)return null;if(b.length===1)return b[0].texture!==null?b[0]:null;y.setFromMatrixPosition(U.matrixWorld);for(let K=0,q=b.length;K<q;K++){const $=b[K];if($.texture!==null&&$.boundingBox.containsPoint(y))return $}return null}function Gs(b,U,K,q,$){U.isScene!==!0&&(U=pn),ie.resetTextureUnits();const Me=U.fog,we=q.isMeshStandardMaterial||q.isMeshLambertMaterial||q.isMeshPhongMaterial?U.environment:null,he=V===null?P.outputColorSpace:V.isXRRenderTarget===!0?V.texture.colorSpace:ft.workingColorSpace,Le=q.isMeshStandardMaterial||q.isMeshLambertMaterial&&!q.envMap||q.isMeshPhongMaterial&&!q.envMap,Ue=de.get(q.envMap||we,Le),Qe=q.vertexColors===!0&&!!K.attributes.color&&K.attributes.color.itemSize===4,Xe=!!K.attributes.tangent&&(!!q.normalMap||q.anisotropy>0),Ce=!!K.morphAttributes.position,vt=!!K.morphAttributes.normal,Xt=!!K.morphAttributes.color;let Ct=sr;q.toneMapped&&(V===null||V.isXRRenderTarget===!0)&&(Ct=P.toneMapping);const Et=K.morphAttributes.position||K.morphAttributes.normal||K.morphAttributes.color,Yt=Et!==void 0?Et.length:0,Ae=Y.get(q),Lt=w.state.lights;if(ot===!0&&(yt===!0||b!==X)){const rt=b===X&&q.id===G;Oe.setState(q,b,rt)}let ut=!1;q.version===Ae.__version?(Ae.needsLights&&Ae.lightsStateVersion!==Lt.state.version||Ae.outputColorSpace!==he||$.isBatchedMesh&&Ae.batching===!1||!$.isBatchedMesh&&Ae.batching===!0||$.isBatchedMesh&&Ae.batchingColor===!0&&$._colorsTexture===null||$.isBatchedMesh&&Ae.batchingColor===!1&&$._colorsTexture!==null||$.isInstancedMesh&&Ae.instancing===!1||!$.isInstancedMesh&&Ae.instancing===!0||$.isSkinnedMesh&&Ae.skinning===!1||!$.isSkinnedMesh&&Ae.skinning===!0||$.isInstancedMesh&&Ae.instancingColor===!0&&$.instanceColor===null||$.isInstancedMesh&&Ae.instancingColor===!1&&$.instanceColor!==null||$.isInstancedMesh&&Ae.instancingMorph===!0&&$.morphTexture===null||$.isInstancedMesh&&Ae.instancingMorph===!1&&$.morphTexture!==null||Ae.envMap!==Ue||q.fog===!0&&Ae.fog!==Me||Ae.numClippingPlanes!==void 0&&(Ae.numClippingPlanes!==Oe.numPlanes||Ae.numIntersection!==Oe.numIntersection)||Ae.vertexAlphas!==Qe||Ae.vertexTangents!==Xe||Ae.morphTargets!==Ce||Ae.morphNormals!==vt||Ae.morphColors!==Xt||Ae.toneMapping!==Ct||Ae.morphTargetsCount!==Yt||!!Ae.lightProbeGrid!=w.state.lightProbeGridArray.length>0)&&(ut=!0):(ut=!0,Ae.__version=q.version);let On=Ae.currentProgram;ut===!0&&(On=Vs(q,U,$),B&&q.isNodeMaterial&&B.onUpdateProgram(q,On,Ae));let Yn=!1,Vi=!1,Fr=!1;const xt=On.getUniforms(),St=Ae.uniforms;if(S.useProgram(On.program)&&(Yn=!0,Vi=!0,Fr=!0),q.id!==G&&(G=q.id,Vi=!0),Ae.needsLights){const rt=bu(w.state.lightProbeGridArray,$);Ae.lightProbeGrid!==rt&&(Ae.lightProbeGrid=rt,Vi=!0)}if(Yn||X!==b){S.buffers.depth.getReversed()&&b.reversedDepth!==!0&&(b._reversedDepth=!0,b.updateProjectionMatrix()),xt.setValue(k,"projectionMatrix",b.projectionMatrix),xt.setValue(k,"viewMatrix",b.matrixWorldInverse);const Gi=xt.map.cameraPosition;Gi!==void 0&&Gi.setValue(k,Pt.setFromMatrixPosition(b.matrixWorld)),C.logarithmicDepthBuffer&&xt.setValue(k,"logDepthBufFC",2/(Math.log(b.far+1)/Math.LN2)),(q.isMeshPhongMaterial||q.isMeshToonMaterial||q.isMeshLambertMaterial||q.isMeshBasicMaterial||q.isMeshStandardMaterial||q.isShaderMaterial)&&xt.setValue(k,"isOrthographic",b.isOrthographicCamera===!0),X!==b&&(X=b,Vi=!0,Fr=!0)}if(Ae.needsLights&&(Lt.state.sunShadowMap.length>0&&xt.setValue(k,"sunShadowMap",Lt.state.sunShadowMap,ie),Lt.state.directionalShadowMap.length>0&&xt.setValue(k,"directionalShadowMap",Lt.state.directionalShadowMap,ie),Lt.state.spotShadowMap.length>0&&xt.setValue(k,"spotShadowMap",Lt.state.spotShadowMap,ie),Lt.state.pointShadowMap.length>0&&xt.setValue(k,"pointShadowMap",Lt.state.pointShadowMap,ie)),$.isSkinnedMesh){xt.setOptional(k,$,"bindMatrix"),xt.setOptional(k,$,"bindMatrixInverse");const rt=$.skeleton;rt&&(rt.boneTexture===null&&rt.computeBoneTexture(),xt.setValue(k,"boneTexture",rt.boneTexture,ie))}$.isBatchedMesh&&(xt.setOptional(k,$,"batchingTexture"),xt.setValue(k,"batchingTexture",$._matricesTexture,ie),xt.setOptional(k,$,"batchingIdTexture"),xt.setValue(k,"batchingIdTexture",$._indirectTexture,ie),xt.setOptional(k,$,"batchingColorTexture"),$._colorsTexture!==null&&xt.setValue(k,"batchingColorTexture",$._colorsTexture,ie));const li=K.morphAttributes;if((li.position!==void 0||li.normal!==void 0||li.color!==void 0)&&O.update($,K,On),(Vi||Ae.receiveShadow!==$.receiveShadow)&&(Ae.receiveShadow=$.receiveShadow,xt.setValue(k,"receiveShadow",$.receiveShadow)),(q.isMeshStandardMaterial||q.isMeshLambertMaterial||q.isMeshPhongMaterial)&&q.envMap===null&&U.environment!==null&&(St.envMapIntensity.value=U.environmentIntensity),St.dfgLUT!==void 0&&(St.dfgLUT.value=rR()),Vi){if(xt.setValue(k,"toneMappingExposure",P.toneMappingExposure),Ae.needsLights&&Ru(St,Fr),Me&&q.fog===!0&&Fe.refreshFogUniforms(St,Me),Fe.refreshMaterialUniforms(St,q,J,Z,w.state.transmissionRenderTarget[b.id]),Ae.needsLights&&Ae.lightProbeGrid){const rt=Ae.lightProbeGrid;St.probesSH.value=rt.texture,St.probesMin.value.copy(rt.boundingBox.min),St.probesMax.value.copy(rt.boundingBox.max),St.probesResolution.value.copy(rt.resolution)}Mc.upload(k,Za(Ae),St,ie)}if(q.isShaderMaterial&&q.uniformsNeedUpdate===!0&&(Mc.upload(k,Za(Ae),St,ie),q.uniformsNeedUpdate=!1),q.isSpriteMaterial&&xt.setValue(k,"center",$.center),xt.setValue(k,"modelViewMatrix",$.modelViewMatrix),xt.setValue(k,"normalMatrix",$.normalMatrix),xt.setValue(k,"modelMatrix",$.matrixWorld),q.uniformsGroups!==void 0){const rt=q.uniformsGroups;for(let Gi=0,Wi=rt.length;Gi<Wi;Gi++){const gs=rt[Gi];se.update(gs,On),se.bind(gs,On)}}return On}function Ru(b,U){b.ambientLightColor.needsUpdate=U,b.lightProbe.needsUpdate=U,b.sunLights.needsUpdate=U,b.sunLightShadows.needsUpdate=U,b.directionalLights.needsUpdate=U,b.directionalLightShadows.needsUpdate=U,b.pointLights.needsUpdate=U,b.pointLightShadows.needsUpdate=U,b.spotLights.needsUpdate=U,b.spotLightShadows.needsUpdate=U,b.rectAreaLights.needsUpdate=U,b.hemisphereLights.needsUpdate=U}function Cu(b){return b.isMeshLambertMaterial||b.isMeshToonMaterial||b.isMeshPhongMaterial||b.isMeshStandardMaterial||b.isShadowMaterial||b.isShaderMaterial&&b.lights===!0}this.getActiveCubeFace=function(){return N},this.getActiveMipmapLevel=function(){return H},this.getRenderTarget=function(){return V},this.setRenderTargetTextures=function(b,U,K){const q=Y.get(b);q.__autoAllocateDepthBuffer=b.resolveDepthBuffer===!1,q.__autoAllocateDepthBuffer===!1&&(q.__useRenderToTexture=!1),Y.get(b.texture).__webglTexture=U,Y.get(b.depthTexture).__webglTexture=q.__autoAllocateDepthBuffer?void 0:K,q.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(b,U){const K=Y.get(b);K.__webglFramebuffer=U,K.__useDefaultFramebuffer=U===void 0},this.setRenderTarget=function(b,U=0,K=0){V=b,N=U,H=K;let q=null,$=!1,Me=!1;if(b){const he=Y.get(b);if(he.__useDefaultFramebuffer!==void 0){S.bindFramebuffer(k.FRAMEBUFFER,he.__webglFramebuffer),ne.copy(b.viewport),ve.copy(b.scissor),Pe=b.scissorTest,S.viewport(ne),S.scissor(ve),S.setScissorTest(Pe),G=-1;return}else if(he.__webglFramebuffer===void 0)ie.setupRenderTarget(b);else if(he.__hasExternalTextures)ie.rebindTextures(b,Y.get(b.texture).__webglTexture,Y.get(b.depthTexture).__webglTexture);else if(b.depthBuffer){const Qe=b.depthTexture;if(he.__boundDepthTexture!==Qe){if(Qe!==null&&Y.has(Qe)&&(b.width!==Qe.image.width||b.height!==Qe.image.height))throw new Error("THREE.WebGLRenderer: Attached DepthTexture is initialized to the incorrect size.");ie.setupDepthRenderbuffer(b)}}const Le=b.texture;(Le.isData3DTexture||Le.isDataArrayTexture||Le.isCompressedArrayTexture)&&(Me=!0);const Ue=Y.get(b).__webglFramebuffer;b.isWebGLCubeRenderTarget?(Array.isArray(Ue[U])?q=Ue[U][K]:q=Ue[U],$=!0):b.samples>0&&ie.useMultisampledRTT(b)===!1?q=Y.get(b).__webglMultisampledFramebuffer:Array.isArray(Ue)?q=Ue[K]:q=Ue,ne.copy(b.viewport),ve.copy(b.scissor),Pe=b.scissorTest}else ne.copy(Re).multiplyScalar(J).floor(),ve.copy(Ze).multiplyScalar(J).floor(),Pe=Be;if(K!==0&&(q=F),S.bindFramebuffer(k.FRAMEBUFFER,q)&&S.drawBuffers(b,q),S.viewport(ne),S.scissor(ve),S.setScissorTest(Pe),$){const he=Y.get(b.texture);k.framebufferTexture2D(k.FRAMEBUFFER,k.COLOR_ATTACHMENT0,k.TEXTURE_CUBE_MAP_POSITIVE_X+U,he.__webglTexture,K)}else if(Me){const he=U;for(let Le=0;Le<b.textures.length;Le++){const Ue=Y.get(b.textures[Le]);k.framebufferTextureLayer(k.FRAMEBUFFER,k.COLOR_ATTACHMENT0+Le,Ue.__webglTexture,K,he)}}else if(b!==null&&K!==0){const he=Y.get(b.texture);k.framebufferTexture2D(k.FRAMEBUFFER,k.COLOR_ATTACHMENT0,k.TEXTURE_2D,he.__webglTexture,K)}G=-1};function Qa(b){const U=Y.get(b);return(U.__readFormat!==b.format||U.__readType!==b.type)&&(U.__readFormat=b.format,U.__readType=b.type,U.__formatReadable=C.textureFormatReadable(b.format),U.__typeReadable=C.textureTypeReadable(b.type)),U}this.readRenderTargetPixels=function(b,U,K,q,$,Me,we,he=0){if(!(b&&b.isWebGLRenderTarget)){gt("WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let Le=Y.get(b).__webglFramebuffer;if(b.isWebGLCubeRenderTarget&&we!==void 0&&(Le=Le[we]),Le){S.bindFramebuffer(k.FRAMEBUFFER,Le);try{const Ue=b.textures[he],Qe=Ue.format,Xe=Ue.type;b.textures.length>1&&k.readBuffer(k.COLOR_ATTACHMENT0+he);const Ce=Qa(Ue);if(Ce.__formatReadable===!1){gt("WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(Ce.__typeReadable===!1){gt("WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}U>=0&&U<=b.width-q&&K>=0&&K<=b.height-$&&k.readPixels(U,K,q,$,me.convert(Qe),me.convert(Xe),Me)}finally{const Ue=V!==null?Y.get(V).__webglFramebuffer:null;S.bindFramebuffer(k.FRAMEBUFFER,Ue)}}},this.readRenderTargetPixelsAsync=async function(b,U,K,q,$,Me,we,he=0){if(!(b&&b.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let Le=Y.get(b).__webglFramebuffer;if(b.isWebGLCubeRenderTarget&&we!==void 0&&(Le=Le[we]),Le)if(U>=0&&U<=b.width-q&&K>=0&&K<=b.height-$){S.bindFramebuffer(k.FRAMEBUFFER,Le);const Ue=b.textures[he],Qe=Ue.format,Xe=Ue.type;b.textures.length>1&&k.readBuffer(k.COLOR_ATTACHMENT0+he);const Ce=Qa(Ue);if(Ce.__formatReadable===!1)throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(Ce.__typeReadable===!1)throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");const vt=k.createBuffer();k.bindBuffer(k.PIXEL_PACK_BUFFER,vt),k.bufferData(k.PIXEL_PACK_BUFFER,Me.byteLength,k.STREAM_READ),k.readPixels(U,K,q,$,me.convert(Qe),me.convert(Xe),0),k.bindBuffer(k.PIXEL_PACK_BUFFER,null);const Xt=V!==null?Y.get(V).__webglFramebuffer:null;S.bindFramebuffer(k.FRAMEBUFFER,Xt);const Ct=k.fenceSync(k.SYNC_GPU_COMMANDS_COMPLETE,0);return k.flush(),await gE(k,Ct,4),k.bindBuffer(k.PIXEL_PACK_BUFFER,vt),k.getBufferSubData(k.PIXEL_PACK_BUFFER,0,Me),k.bindBuffer(k.PIXEL_PACK_BUFFER,null),k.deleteBuffer(vt),k.deleteSync(Ct),Me}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")},this.copyFramebufferToTexture=function(b,U=null,K=0){const q=Math.pow(2,-K),$=Math.floor(b.image.width*q),Me=Math.floor(b.image.height*q),we=U!==null?U.x:0,he=U!==null?U.y:0;ie.setTexture2D(b,0),k.copyTexSubImage2D(k.TEXTURE_2D,K,0,0,we,he,$,Me),S.unbindTexture()},this.copyTextureToTexture=function(b,U,K=null,q=null,$=0,Me=0){let we,he,Le,Ue,Qe,Xe,Ce,vt,Xt;const Ct=b.isCompressedTexture?b.mipmaps[Me]:b.image;if(K!==null)we=K.max.x-K.min.x,he=K.max.y-K.min.y,Le=K.isBox3?K.max.z-K.min.z:1,Ue=K.min.x,Qe=K.min.y,Xe=K.isBox3?K.min.z:0;else{const St=Math.pow(2,-$);we=Math.floor(Ct.width*St),he=Math.floor(Ct.height*St),b.isDataArrayTexture?Le=Ct.depth:b.isData3DTexture?Le=Math.floor(Ct.depth*St):Le=1,Ue=0,Qe=0,Xe=0}q!==null?(Ce=q.x,vt=q.y,Xt=q.z):(Ce=0,vt=0,Xt=0);const Et=me.convert(U.format),Yt=me.convert(U.type);let Ae;U.isData3DTexture?(ie.setTexture3D(U,0),Ae=k.TEXTURE_3D):U.isDataArrayTexture||U.isCompressedArrayTexture?(ie.setTexture2DArray(U,0),Ae=k.TEXTURE_2D_ARRAY):(ie.setTexture2D(U,0),Ae=k.TEXTURE_2D),S.activeTexture(k.TEXTURE0),S.pixelStorei(k.UNPACK_FLIP_Y_WEBGL,U.flipY),S.pixelStorei(k.UNPACK_PREMULTIPLY_ALPHA_WEBGL,U.premultiplyAlpha),S.pixelStorei(k.UNPACK_ALIGNMENT,U.unpackAlignment);const Lt=S.getParameter(k.UNPACK_ROW_LENGTH),ut=S.getParameter(k.UNPACK_IMAGE_HEIGHT),On=S.getParameter(k.UNPACK_SKIP_PIXELS),Yn=S.getParameter(k.UNPACK_SKIP_ROWS),Vi=S.getParameter(k.UNPACK_SKIP_IMAGES);S.pixelStorei(k.UNPACK_ROW_LENGTH,Ct.width),S.pixelStorei(k.UNPACK_IMAGE_HEIGHT,Ct.height),S.pixelStorei(k.UNPACK_SKIP_PIXELS,Ue),S.pixelStorei(k.UNPACK_SKIP_ROWS,Qe),S.pixelStorei(k.UNPACK_SKIP_IMAGES,Xe);const Fr=b.isDataArrayTexture||b.isData3DTexture,xt=U.isDataArrayTexture||U.isData3DTexture;if(b.isDepthTexture){const St=Y.get(b),li=Y.get(U),rt=Y.get(St.__renderTarget),Gi=Y.get(li.__renderTarget);S.bindFramebuffer(k.READ_FRAMEBUFFER,rt.__webglFramebuffer),S.bindFramebuffer(k.DRAW_FRAMEBUFFER,Gi.__webglFramebuffer);for(let Wi=0;Wi<Le;Wi++)Fr&&(k.framebufferTextureLayer(k.READ_FRAMEBUFFER,k.COLOR_ATTACHMENT0,Y.get(b).__webglTexture,$,Xe+Wi),k.framebufferTextureLayer(k.DRAW_FRAMEBUFFER,k.COLOR_ATTACHMENT0,Y.get(U).__webglTexture,Me,Xt+Wi)),k.blitFramebuffer(Ue,Qe,we,he,Ce,vt,we,he,k.DEPTH_BUFFER_BIT,k.NEAREST);S.bindFramebuffer(k.READ_FRAMEBUFFER,null),S.bindFramebuffer(k.DRAW_FRAMEBUFFER,null)}else if($!==0||b.isRenderTargetTexture||Y.has(b)){const St=Y.get(b),li=Y.get(U);S.bindFramebuffer(k.READ_FRAMEBUFFER,I),S.bindFramebuffer(k.DRAW_FRAMEBUFFER,j);for(let rt=0;rt<Le;rt++)Fr?k.framebufferTextureLayer(k.READ_FRAMEBUFFER,k.COLOR_ATTACHMENT0,St.__webglTexture,$,Xe+rt):k.framebufferTexture2D(k.READ_FRAMEBUFFER,k.COLOR_ATTACHMENT0,k.TEXTURE_2D,St.__webglTexture,$),xt?k.framebufferTextureLayer(k.DRAW_FRAMEBUFFER,k.COLOR_ATTACHMENT0,li.__webglTexture,Me,Xt+rt):k.framebufferTexture2D(k.DRAW_FRAMEBUFFER,k.COLOR_ATTACHMENT0,k.TEXTURE_2D,li.__webglTexture,Me),$!==0?k.blitFramebuffer(Ue,Qe,we,he,Ce,vt,we,he,k.COLOR_BUFFER_BIT,k.NEAREST):xt?k.copyTexSubImage3D(Ae,Me,Ce,vt,Xt+rt,Ue,Qe,we,he):k.copyTexSubImage2D(Ae,Me,Ce,vt,Ue,Qe,we,he);S.bindFramebuffer(k.READ_FRAMEBUFFER,null),S.bindFramebuffer(k.DRAW_FRAMEBUFFER,null)}else xt?b.isDataTexture||b.isData3DTexture?k.texSubImage3D(Ae,Me,Ce,vt,Xt,we,he,Le,Et,Yt,Ct.data):U.isCompressedArrayTexture?k.compressedTexSubImage3D(Ae,Me,Ce,vt,Xt,we,he,Le,Et,Ct.data):k.texSubImage3D(Ae,Me,Ce,vt,Xt,we,he,Le,Et,Yt,Ct):b.isDataTexture?k.texSubImage2D(k.TEXTURE_2D,Me,Ce,vt,we,he,Et,Yt,Ct.data):b.isCompressedTexture?k.compressedTexSubImage2D(k.TEXTURE_2D,Me,Ce,vt,Ct.width,Ct.height,Et,Ct.data):k.texSubImage2D(k.TEXTURE_2D,Me,Ce,vt,we,he,Et,Yt,Ct);S.pixelStorei(k.UNPACK_ROW_LENGTH,Lt),S.pixelStorei(k.UNPACK_IMAGE_HEIGHT,ut),S.pixelStorei(k.UNPACK_SKIP_PIXELS,On),S.pixelStorei(k.UNPACK_SKIP_ROWS,Yn),S.pixelStorei(k.UNPACK_SKIP_IMAGES,Vi),Me===0&&U.generateMipmaps&&k.generateMipmap(Ae),S.unbindTexture()},this.initRenderTarget=function(b){Y.get(b).__webglFramebuffer===void 0&&ie.setupRenderTarget(b)},this.initTexture=function(b){b.isCubeTexture?ie.setTextureCube(b,0):b.isData3DTexture?ie.setTexture3D(b,0):b.isDataArrayTexture||b.isCompressedArrayTexture?ie.setTexture2DArray(b,0):ie.setTexture2D(b,0),S.unbindTexture()},this.resetState=function(){N=0,H=0,V=null,S.reset(),Se.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return nr}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(e){this._outputColorSpace=e;const n=this.getContext();n.drawingBufferColorSpace=ft._getDrawingBufferColorSpace(e),n.unpackColorSpace=ft._getUnpackColorSpace()}}const Sg={type:"change"},zp={type:"start"},Lx={type:"end"},rc=new Mu,Mg=new xr,aR=Math.cos(70*xE.DEG2RAD),en=new D,zn=2*Math.PI,At={NONE:-1,ROTATE:0,DOLLY:1,PAN:2,TOUCH_ROTATE:3,TOUCH_PAN:4,TOUCH_DOLLY_PAN:5,TOUCH_DOLLY_ROTATE:6},Bd=1e-6;class oR extends o1{constructor(e,n=null){super(e,n),this.state=At.NONE,this.target=new D,this.cursor=new D,this.minDistance=0,this.maxDistance=1/0,this.minZoom=0,this.maxZoom=1/0,this.minTargetRadius=0,this.maxTargetRadius=1/0,this.minPolarAngle=0,this.maxPolarAngle=Math.PI,this.minAzimuthAngle=-1/0,this.maxAzimuthAngle=1/0,this.enableDamping=!1,this.dampingFactor=.05,this.enableZoom=!0,this.zoomSpeed=1,this.enableRotate=!0,this.rotateSpeed=1,this.keyRotateSpeed=1,this.enablePan=!0,this.panSpeed=1,this.screenSpacePanning=!0,this.keyPanSpeed=7,this.zoomToCursor=!1,this.autoRotate=!1,this.autoRotateSpeed=2,this.keys={LEFT:"ArrowLeft",UP:"ArrowUp",RIGHT:"ArrowRight",BOTTOM:"ArrowDown"},this.mouseButtons={LEFT:Ra.ROTATE,MIDDLE:Ra.DOLLY,RIGHT:Ra.PAN},this.touches={ONE:xa.ROTATE,TWO:xa.DOLLY_PAN},this.target0=this.target.clone(),this.position0=this.object.position.clone(),this.zoom0=this.object.zoom,this._cursorStyle="auto",this._domElementKeyEvents=null,this._lastPosition=new D,this._lastQuaternion=new ls,this._lastTargetPosition=new D,this._quat=new ls().setFromUnitVectors(e.up,new D(0,1,0)),this._quatInverse=this._quat.clone().invert(),this._spherical=new K0,this._sphericalDelta=new K0,this._scale=1,this._panOffset=new D,this._rotateStart=new je,this._rotateEnd=new je,this._rotateDelta=new je,this._panStart=new je,this._panEnd=new je,this._panDelta=new je,this._dollyStart=new je,this._dollyEnd=new je,this._dollyDelta=new je,this._dollyDirection=new D,this._mouse=new je,this._performCursorZoom=!1,this._pointers=[],this._pointerPositions={},this._controlActive=!1,this._onPointerMove=cR.bind(this),this._onPointerDown=lR.bind(this),this._onPointerUp=uR.bind(this),this._onContextMenu=_R.bind(this),this._onMouseWheel=hR.bind(this),this._onKeyDown=pR.bind(this),this._onTouchStart=mR.bind(this),this._onTouchMove=gR.bind(this),this._onMouseDown=dR.bind(this),this._onMouseMove=fR.bind(this),this._interceptControlDown=vR.bind(this),this._interceptControlUp=xR.bind(this),this.domElement!==null&&this.connect(this.domElement),this.update()}set cursorStyle(e){this._cursorStyle=e,e==="grab"?this.domElement.style.cursor="grab":this.domElement.style.cursor="auto"}get cursorStyle(){return this._cursorStyle}connect(e){super.connect(e),this.domElement.addEventListener("pointerdown",this._onPointerDown),this.domElement.addEventListener("pointercancel",this._onPointerUp),this.domElement.addEventListener("contextmenu",this._onContextMenu),this.domElement.addEventListener("wheel",this._onMouseWheel,{passive:!1}),this.domElement.getRootNode().addEventListener("keydown",this._interceptControlDown,{passive:!0,capture:!0}),this.domElement.style.touchAction="none"}disconnect(){this.state=At.NONE,this.domElement.removeEventListener("pointerdown",this._onPointerDown),this.domElement.ownerDocument.removeEventListener("pointermove",this._onPointerMove),this.domElement.ownerDocument.removeEventListener("pointerup",this._onPointerUp),this.domElement.removeEventListener("pointercancel",this._onPointerUp),this.domElement.removeEventListener("wheel",this._onMouseWheel),this.domElement.removeEventListener("contextmenu",this._onContextMenu),this.stopListenToKeyEvents();const e=this.domElement.getRootNode();e.removeEventListener("keydown",this._interceptControlDown,{capture:!0}),e.removeEventListener("keyup",this._interceptControlUp,{capture:!0}),this._controlActive=!1,this._pointers.length=0,this._pointerPositions={},this.domElement.style.touchAction="",this.domElement.style.cursor="auto"}dispose(){this.disconnect()}getPolarAngle(){return this._spherical.phi}getAzimuthalAngle(){return this._spherical.theta}getDistance(){return this.object.position.distanceTo(this.target)}listenToKeyEvents(e){e.addEventListener("keydown",this._onKeyDown),this._domElementKeyEvents=e}stopListenToKeyEvents(){this._domElementKeyEvents!==null&&(this._domElementKeyEvents.removeEventListener("keydown",this._onKeyDown),this._domElementKeyEvents=null)}saveState(){this.target0.copy(this.target),this.position0.copy(this.object.position),this.zoom0=this.object.zoom}reset(){this.target.copy(this.target0),this.object.position.copy(this.position0),this.object.zoom=this.zoom0,this.object.updateProjectionMatrix(),this.dispatchEvent(Sg),this.update(),this.state=At.NONE}pan(e,n){this._pan(e,n),this.update()}dollyIn(e){this._dollyIn(e),this.update()}dollyOut(e){this._dollyOut(e),this.update()}rotateLeft(e){this._rotateLeft(e),this.update()}rotateUp(e){this._rotateUp(e),this.update()}update(e=null){const n=this.object.position;en.copy(n).sub(this.target),en.applyQuaternion(this._quat),this._spherical.setFromVector3(en),this.autoRotate&&this.state===At.NONE&&this._rotateLeft(this._getAutoRotationAngle(e)),this.enableDamping?(this._spherical.theta+=this._sphericalDelta.theta*this.dampingFactor,this._spherical.phi+=this._sphericalDelta.phi*this.dampingFactor):(this._spherical.theta+=this._sphericalDelta.theta,this._spherical.phi+=this._sphericalDelta.phi);let i=this.minAzimuthAngle,r=this.maxAzimuthAngle;isFinite(i)&&isFinite(r)&&(i<-Math.PI?i+=zn:i>Math.PI&&(i-=zn),r<-Math.PI?r+=zn:r>Math.PI&&(r-=zn),i<=r?this._spherical.theta=Math.max(i,Math.min(r,this._spherical.theta)):this._spherical.theta=this._spherical.theta>(i+r)/2?Math.max(i,this._spherical.theta):Math.min(r,this._spherical.theta)),this._spherical.phi=Math.max(this.minPolarAngle,Math.min(this.maxPolarAngle,this._spherical.phi)),this._spherical.makeSafe(),this.enableDamping===!0?this.target.addScaledVector(this._panOffset,this.dampingFactor):this.target.add(this._panOffset),this.target.sub(this.cursor),this.target.clampLength(this.minTargetRadius,this.maxTargetRadius),this.target.add(this.cursor);let s=!1;if(this.zoomToCursor&&this._performCursorZoom||this.object.isOrthographicCamera)this._spherical.radius=this._clampDistance(this._spherical.radius);else{const a=this._spherical.radius;this._spherical.radius=this._clampDistance(this._spherical.radius*this._scale),s=a!=this._spherical.radius}if(en.setFromSpherical(this._spherical),en.applyQuaternion(this._quatInverse),n.copy(this.target).add(en),this.object.lookAt(this.target),this.enableDamping===!0?(this._sphericalDelta.theta*=1-this.dampingFactor,this._sphericalDelta.phi*=1-this.dampingFactor,this._panOffset.multiplyScalar(1-this.dampingFactor)):(this._sphericalDelta.set(0,0,0),this._panOffset.set(0,0,0)),this.zoomToCursor&&this._performCursorZoom){let a=null;if(this.object.isPerspectiveCamera){const o=en.length();a=this._clampDistance(o*this._scale);const l=o-a;this.object.position.addScaledVector(this._dollyDirection,l),this.object.updateMatrixWorld(),s=!!l}else if(this.object.isOrthographicCamera){const o=new D(this._mouse.x,this._mouse.y,0);o.unproject(this.object);const l=this.object.zoom;this.object.zoom=Math.max(this.minZoom,Math.min(this.maxZoom,this.object.zoom/this._scale)),this.object.updateProjectionMatrix(),s=l!==this.object.zoom;const c=new D(this._mouse.x,this._mouse.y,0);c.unproject(this.object),this.object.position.sub(c).add(o),this.object.updateMatrixWorld(),a=en.length()}else console.warn("WARNING: OrbitControls.js encountered an unknown camera type - zoom to cursor disabled."),this.zoomToCursor=!1;a!==null&&(this.screenSpacePanning?this.target.set(0,0,-1).transformDirection(this.object.matrix).multiplyScalar(a).add(this.object.position):(rc.origin.copy(this.object.position),rc.direction.set(0,0,-1).transformDirection(this.object.matrix),Math.abs(this.object.up.dot(rc.direction))<aR?this.object.lookAt(this.target):(Mg.setFromNormalAndCoplanarPoint(this.object.up,this.target),rc.intersectPlane(Mg,this.target))))}else if(this.object.isOrthographicCamera){const a=this.object.zoom;this.object.zoom=Math.max(this.minZoom,Math.min(this.maxZoom,this.object.zoom/this._scale)),a!==this.object.zoom&&(this.object.updateProjectionMatrix(),s=!0)}return this._scale=1,this._performCursorZoom=!1,s||this._lastPosition.distanceToSquared(this.object.position)>Bd||8*(1-this._lastQuaternion.dot(this.object.quaternion))>Bd||this._lastTargetPosition.distanceToSquared(this.target)>Bd?(this.dispatchEvent(Sg),this._lastPosition.copy(this.object.position),this._lastQuaternion.copy(this.object.quaternion),this._lastTargetPosition.copy(this.target),!0):!1}_getAutoRotationAngle(e){return e!==null?zn/60*this.autoRotateSpeed*e:zn/60/60*this.autoRotateSpeed}_getZoomScale(e){const n=Math.abs(e*.01);return Math.pow(.95,this.zoomSpeed*n)}_rotateLeft(e){this._sphericalDelta.theta-=e}_rotateUp(e){this._sphericalDelta.phi-=e}_panLeft(e,n){en.setFromMatrixColumn(n,0),en.multiplyScalar(-e),this._panOffset.add(en)}_panUp(e,n){this.screenSpacePanning===!0?en.setFromMatrixColumn(n,1):(en.setFromMatrixColumn(n,0),en.crossVectors(this.object.up,en)),en.multiplyScalar(e),this._panOffset.add(en)}_pan(e,n){const i=this.domElement;if(this.object.isPerspectiveCamera){const r=this.object.position;en.copy(r).sub(this.target);let s=en.length();s*=Math.tan(this.object.fov/2*Math.PI/180),this._panLeft(2*e*s/i.clientHeight,this.object.matrix),this._panUp(2*n*s/i.clientHeight,this.object.matrix)}else this.object.isOrthographicCamera?(this._panLeft(e*(this.object.right-this.object.left)/this.object.zoom/i.clientWidth,this.object.matrix),this._panUp(n*(this.object.top-this.object.bottom)/this.object.zoom/i.clientHeight,this.object.matrix)):(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - pan disabled."),this.enablePan=!1)}_dollyOut(e){this.object.isPerspectiveCamera||this.object.isOrthographicCamera?this._scale/=e:(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),this.enableZoom=!1)}_dollyIn(e){this.object.isPerspectiveCamera||this.object.isOrthographicCamera?this._scale*=e:(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),this.enableZoom=!1)}_updateZoomParameters(e,n){if(!this.zoomToCursor)return;this._performCursorZoom=!0;const i=this.domElement.getBoundingClientRect(),r=e-i.left,s=n-i.top,a=i.width,o=i.height;this._mouse.x=r/a*2-1,this._mouse.y=-(s/o)*2+1,this._dollyDirection.set(this._mouse.x,this._mouse.y,1).unproject(this.object).sub(this.object.position).normalize()}_clampDistance(e){return Math.max(this.minDistance,Math.min(this.maxDistance,e))}_handleMouseDownRotate(e){this._rotateStart.set(e.clientX,e.clientY)}_handleMouseDownDolly(e){this._updateZoomParameters(e.clientX,e.clientX),this._dollyStart.set(e.clientX,e.clientY)}_handleMouseDownPan(e){this._panStart.set(e.clientX,e.clientY)}_handleMouseMoveRotate(e){this._rotateEnd.set(e.clientX,e.clientY),this._rotateDelta.subVectors(this._rotateEnd,this._rotateStart).multiplyScalar(this.rotateSpeed);const n=this.domElement;this._rotateLeft(zn*this._rotateDelta.x/n.clientHeight),this._rotateUp(zn*this._rotateDelta.y/n.clientHeight),this._rotateStart.copy(this._rotateEnd),this.update()}_handleMouseMoveDolly(e){this._dollyEnd.set(e.clientX,e.clientY),this._dollyDelta.subVectors(this._dollyEnd,this._dollyStart),this._dollyDelta.y>0?this._dollyOut(this._getZoomScale(this._dollyDelta.y)):this._dollyDelta.y<0&&this._dollyIn(this._getZoomScale(this._dollyDelta.y)),this._dollyStart.copy(this._dollyEnd),this.update()}_handleMouseMovePan(e){this._panEnd.set(e.clientX,e.clientY),this._panDelta.subVectors(this._panEnd,this._panStart).multiplyScalar(this.panSpeed),this._pan(this._panDelta.x,this._panDelta.y),this._panStart.copy(this._panEnd),this.update()}_handleMouseWheel(e){this._updateZoomParameters(e.clientX,e.clientY),e.deltaY<0?this._dollyIn(this._getZoomScale(e.deltaY)):e.deltaY>0&&this._dollyOut(this._getZoomScale(e.deltaY)),this.update()}_handleKeyDown(e){let n=!1;switch(e.code){case this.keys.UP:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateUp(zn*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(0,this.keyPanSpeed),n=!0;break;case this.keys.BOTTOM:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateUp(-zn*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(0,-this.keyPanSpeed),n=!0;break;case this.keys.LEFT:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateLeft(zn*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(this.keyPanSpeed,0),n=!0;break;case this.keys.RIGHT:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateLeft(-zn*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(-this.keyPanSpeed,0),n=!0;break}n&&(e.preventDefault(),this.update())}_handleTouchStartRotate(e){if(this._pointers.length===1)this._rotateStart.set(e.pageX,e.pageY);else{const n=this._getSecondPointerPosition(e),i=.5*(e.pageX+n.x),r=.5*(e.pageY+n.y);this._rotateStart.set(i,r)}}_handleTouchStartPan(e){if(this._pointers.length===1)this._panStart.set(e.pageX,e.pageY);else{const n=this._getSecondPointerPosition(e),i=.5*(e.pageX+n.x),r=.5*(e.pageY+n.y);this._panStart.set(i,r)}}_handleTouchStartDolly(e){const n=this._getSecondPointerPosition(e),i=e.pageX-n.x,r=e.pageY-n.y,s=Math.sqrt(i*i+r*r);this._dollyStart.set(0,s)}_handleTouchStartDollyPan(e){this.enableZoom&&this._handleTouchStartDolly(e),this.enablePan&&this._handleTouchStartPan(e)}_handleTouchStartDollyRotate(e){this.enableZoom&&this._handleTouchStartDolly(e),this.enableRotate&&this._handleTouchStartRotate(e)}_handleTouchMoveRotate(e){if(this._pointers.length==1)this._rotateEnd.set(e.pageX,e.pageY);else{const i=this._getSecondPointerPosition(e),r=.5*(e.pageX+i.x),s=.5*(e.pageY+i.y);this._rotateEnd.set(r,s)}this._rotateDelta.subVectors(this._rotateEnd,this._rotateStart).multiplyScalar(this.rotateSpeed);const n=this.domElement;this._rotateLeft(zn*this._rotateDelta.x/n.clientHeight),this._rotateUp(zn*this._rotateDelta.y/n.clientHeight),this._rotateStart.copy(this._rotateEnd)}_handleTouchMovePan(e){if(this._pointers.length===1)this._panEnd.set(e.pageX,e.pageY);else{const n=this._getSecondPointerPosition(e),i=.5*(e.pageX+n.x),r=.5*(e.pageY+n.y);this._panEnd.set(i,r)}this._panDelta.subVectors(this._panEnd,this._panStart).multiplyScalar(this.panSpeed),this._pan(this._panDelta.x,this._panDelta.y),this._panStart.copy(this._panEnd)}_handleTouchMoveDolly(e){const n=this._getSecondPointerPosition(e),i=e.pageX-n.x,r=e.pageY-n.y,s=Math.sqrt(i*i+r*r);this._dollyEnd.set(0,s),this._dollyDelta.set(0,Math.pow(this._dollyEnd.y/this._dollyStart.y,this.zoomSpeed)),this._dollyOut(this._dollyDelta.y),this._dollyStart.copy(this._dollyEnd);const a=(e.pageX+n.x)*.5,o=(e.pageY+n.y)*.5;this._updateZoomParameters(a,o)}_handleTouchMoveDollyPan(e){this.enableZoom&&this._handleTouchMoveDolly(e),this.enablePan&&this._handleTouchMovePan(e)}_handleTouchMoveDollyRotate(e){this.enableZoom&&this._handleTouchMoveDolly(e),this.enableRotate&&this._handleTouchMoveRotate(e)}_addPointer(e){this._pointers.push(e.pointerId)}_removePointer(e){delete this._pointerPositions[e.pointerId];for(let n=0;n<this._pointers.length;n++)if(this._pointers[n]==e.pointerId){this._pointers.splice(n,1);return}}_isTrackingPointer(e){for(let n=0;n<this._pointers.length;n++)if(this._pointers[n]==e.pointerId)return!0;return!1}_trackPointer(e){let n=this._pointerPositions[e.pointerId];n===void 0&&(n=new je,this._pointerPositions[e.pointerId]=n),n.set(e.pageX,e.pageY)}_getSecondPointerPosition(e){const n=e.pointerId===this._pointers[0]?this._pointers[1]:this._pointers[0];return this._pointerPositions[n]}_customWheelEvent(e){const n=e.deltaMode,i={clientX:e.clientX,clientY:e.clientY,deltaY:e.deltaY};switch(n){case 1:i.deltaY*=16;break;case 2:i.deltaY*=100;break}return e.ctrlKey&&!this._controlActive&&(i.deltaY*=10),i}}function lR(t){this.enabled!==!1&&(this._pointers.length===0&&(this.domElement.setPointerCapture(t.pointerId),this.domElement.ownerDocument.addEventListener("pointermove",this._onPointerMove),this.domElement.ownerDocument.addEventListener("pointerup",this._onPointerUp)),!this._isTrackingPointer(t)&&(this._addPointer(t),t.pointerType==="touch"?this._onTouchStart(t):this._onMouseDown(t),this._cursorStyle==="grab"&&(this.domElement.style.cursor="grabbing")))}function cR(t){this.enabled!==!1&&(t.pointerType==="touch"?this._onTouchMove(t):this._onMouseMove(t))}function uR(t){switch(this._removePointer(t),this._pointers.length){case 0:this.domElement.releasePointerCapture(t.pointerId),this.domElement.ownerDocument.removeEventListener("pointermove",this._onPointerMove),this.domElement.ownerDocument.removeEventListener("pointerup",this._onPointerUp),this.dispatchEvent(Lx),this.state=At.NONE,this._cursorStyle==="grab"&&(this.domElement.style.cursor="grab");break;case 1:const e=this._pointers[0],n=this._pointerPositions[e];this._onTouchStart({pointerId:e,pageX:n.x,pageY:n.y});break}}function dR(t){let e;switch(t.button){case 0:e=this.mouseButtons.LEFT;break;case 1:e=this.mouseButtons.MIDDLE;break;case 2:e=this.mouseButtons.RIGHT;break;default:e=-1}switch(e){case Ra.DOLLY:if(this.enableZoom===!1)return;this._handleMouseDownDolly(t),this.state=At.DOLLY;break;case Ra.ROTATE:if(t.ctrlKey||t.metaKey||t.shiftKey){if(this.enablePan===!1)return;this._handleMouseDownPan(t),this.state=At.PAN}else{if(this.enableRotate===!1)return;this._handleMouseDownRotate(t),this.state=At.ROTATE}break;case Ra.PAN:if(t.ctrlKey||t.metaKey||t.shiftKey){if(this.enableRotate===!1)return;this._handleMouseDownRotate(t),this.state=At.ROTATE}else{if(this.enablePan===!1)return;this._handleMouseDownPan(t),this.state=At.PAN}break;default:this.state=At.NONE}this.state!==At.NONE&&this.dispatchEvent(zp)}function fR(t){switch(this.state){case At.ROTATE:if(this.enableRotate===!1)return;this._handleMouseMoveRotate(t);break;case At.DOLLY:if(this.enableZoom===!1)return;this._handleMouseMoveDolly(t);break;case At.PAN:if(this.enablePan===!1)return;this._handleMouseMovePan(t);break}}function hR(t){this.enabled===!1||this.enableZoom===!1||this.state!==At.NONE||(t.preventDefault(),this.dispatchEvent(zp),this._handleMouseWheel(this._customWheelEvent(t)),this.dispatchEvent(Lx))}function pR(t){this.enabled!==!1&&this._handleKeyDown(t)}function mR(t){switch(this._trackPointer(t),this._pointers.length){case 1:switch(this.touches.ONE){case xa.ROTATE:if(this.enableRotate===!1)return;this._handleTouchStartRotate(t),this.state=At.TOUCH_ROTATE;break;case xa.PAN:if(this.enablePan===!1)return;this._handleTouchStartPan(t),this.state=At.TOUCH_PAN;break;default:this.state=At.NONE}break;case 2:switch(this.touches.TWO){case xa.DOLLY_PAN:if(this.enableZoom===!1&&this.enablePan===!1)return;this._handleTouchStartDollyPan(t),this.state=At.TOUCH_DOLLY_PAN;break;case xa.DOLLY_ROTATE:if(this.enableZoom===!1&&this.enableRotate===!1)return;this._handleTouchStartDollyRotate(t),this.state=At.TOUCH_DOLLY_ROTATE;break;default:this.state=At.NONE}break;default:this.state=At.NONE}this.state!==At.NONE&&this.dispatchEvent(zp)}function gR(t){switch(this._trackPointer(t),this.state){case At.TOUCH_ROTATE:if(this.enableRotate===!1)return;this._handleTouchMoveRotate(t),this.update();break;case At.TOUCH_PAN:if(this.enablePan===!1)return;this._handleTouchMovePan(t),this.update();break;case At.TOUCH_DOLLY_PAN:if(this.enableZoom===!1&&this.enablePan===!1)return;this._handleTouchMoveDollyPan(t),this.update();break;case At.TOUCH_DOLLY_ROTATE:if(this.enableZoom===!1&&this.enableRotate===!1)return;this._handleTouchMoveDollyRotate(t),this.update();break;default:this.state=At.NONE}}function _R(t){this.enabled!==!1&&t.preventDefault()}function vR(t){t.key==="Control"&&(this._controlActive=!0,this.domElement.getRootNode().addEventListener("keyup",this._interceptControlUp,{passive:!0,capture:!0}))}function xR(t){t.key==="Control"&&(this._controlActive=!1,this.domElement.getRootNode().removeEventListener("keyup",this._interceptControlUp,{passive:!0,capture:!0}))}function yR(){const t=new wn;t.name="Equator300",t.scale.setScalar(.0018);const n=(u,m=.48,M=.3)=>new at({color:u,roughness:m,metalness:M}),i=n(3356477),r=n(4474959),s=n(1842722),a=n(15886866,.42,.1),o=n(2829875,.34,.55),l=n(10134187,.28,.9),c=n(7238780,.55,.35),h=n(13777466,.25,.2),p=n(13357783,.32,.72),f=(u,m,M,y,T,w)=>{const R=new ze(m,M);return R.position.set(y,T,w),R.castShadow=!0,R.receiveShadow=!0,u.add(R),R},g=(u,m,M,y=24)=>new It(u,m,M,y),v=(u,m)=>{const M=u*Math.PI/180;return[Math.sin(M)*m,Math.cos(M)*m]},E=(u,m,M,y,T)=>{const w=M.clone().sub(m),R=f(u,g(y,y,w.length(),12),T,0,0,0);R.position.copy(m).addScaledVector(w,.5),R.quaternion.setFromUnitVectors(new D(0,1,0),w.normalize())};f(t,g(329,350,78,6),i,0,57,0).rotation.y=-Math.PI/6,f(t,g(225,250,44,6),r,0,118,0).rotation.y=-Math.PI/6,f(t,g(150,150,19,40),c,0,149.5,0);for(let u=0;u<6;u+=1){const[m,M]=v(30+u*60,300);f(t,g(18,22,18),a,m,12,M),f(t,g(24,24,6),s,m,3,M)}for(const u of[60,180,300]){const[m,M]=v(u,320),y=Math.cos(u*Math.PI/180),T=-Math.sin(u*Math.PI/180);for(const A of[-46,46]){const P=m+y*A,L=M+T*A;f(t,g(17,17,660,16),o,P,373,L),E(t,new D(P,678,L),new D(0,464,0),10,l)}const[w,R]=v(u,330),x=f(t,g(75,75,62,36),s,w,716,R);x.rotation.x=Math.PI/2,f(t,g(24,24,68,24),l,w,716,R).rotation.x=Math.PI/2,f(t,g(34,34,66),r,w,772,R)}f(t,g(205,205,74,48),i,0,777,0);for(const u of[60,180,300]){const[m,M]=v(u,294);f(t,g(105,105,74,32),i,m,777,M),f(t,g(72,72,72,24),i,m*.55,777,M*.55),f(t,g(58,66,34),s,m*.62,826,M*.62)}f(t,new Ft(250,145,175),i,0,886,0),f(t,new Ft(120,56,27),a,0,845,101),f(t,g(28,28,215),l,0,570,0),f(t,g(32,20,48),r,0,396,0),f(t,g(4,4,118,12),l,0,310,0),f(t,new Op(6,18,12),h,0,246,0);const _=f(t,g(37,37,30,24),p,0,176,0);return _.visible=!1,{root:t,workpiece:_}}const Dx="/assets/trak-tc820-machine-transparent-D7PwEI2F.png",Eg=/^(?:[-*•]|\d+[.)])\s+/;function Ix(t){return String(t??"").replace(/\r\n?/g,`
`).split(`
`).map(e=>e.trim())}const SR=/^(?:文档|来源|页码|内容类型|标题|分数|source|title|page|content[_ -]?type|score)\s*[:：]/i,MR=/^\s*\[[^\]]+\]\s*本地OCR识别结果(?:（[^）]*）|\([^)]*\))?\s*[:：]?\s*/i,ER=/\b(?:device_id|timestamp|temperature|vibration|rpm|alarm_code|alarm_level|health_score)\s*=/i,wR=/^检索到\s*\d+\s*条(?:相关)?知识证据\s*[：:]/,Ux=/```(?:json)?\s*([\s\S]*?)```/gi;function Fx(t){const e=String(t??"");for(const n of e.matchAll(Ux))try{const i=JSON.parse(n[1].trim());if(i&&typeof i=="object"&&!Array.isArray(i))return i}catch{}return null}function TR(t){const e=String(t??"").trim();return/^\[fake-model\]\s*query\s*:/i.test(e)||/^query\s*:[^\n]+\n\s*evidence\s*:/i.test(e)}function wg(t){var n,i,r,s,a,o;return[(n=t==null?void 0:t.knowledge)==null?void 0:n.answer,wR.test(String(((i=t==null?void 0:t.knowledge)==null?void 0:i.summary)||"").trim())?"":(r=t==null?void 0:t.knowledge)==null?void 0:r.summary,(s=t==null?void 0:t.diagnosis)==null?void 0:s.summary,(a=t==null?void 0:t.diagnosis)==null?void 0:a.fault,(o=t==null?void 0:t.route_result)==null?void 0:o.reason].map(nn).find(Boolean)||""}function nn(t){const e=CR(t);return!e||TR(e)?"":Ix(e.replace(Ux,"")).map(n=>n.replace(MR,"").trim()).filter(n=>n&&!SR.test(n)&&!/^\[[^\]]+\s*\|[^\]]+\]\s*$/i.test(n)).join(`
`).trim()}function AR(t){const e=nn(t);return!e||/^\[(?:table|cad_drawing)\b/i.test(e)||/^(?:文档|页码|内容类型|本地OCR识别结果|表格行\d+)\s*[:：]/i.test(e)||/表格行\d+\s*[:：]/i.test(e)?"":ER.test(e)?e.split(/\b(?:device_id|timestamp|temperature|vibration|rpm|alarm_code|alarm_level|health_score)\s*=/i)[0].replace(/[：:]\s*$/,"").trim():e}function bR(t){const e=Ix(t),n=[];let i=[],r=[];const s=()=>{i.length&&(n.push({type:"paragraph",text:i.join(" ")}),i=[])},a=()=>{r.length&&(n.push({type:"list",items:[...r]}),r=[])};for(const o of e){if(!o){s(),a();continue}const l=o.match(/^(?:---\s+)?(#{1,6})\s+(.+)$/);if(l){s(),a(),n.push({type:"heading",level:l[1].length,text:l[2].trim()});continue}if(/^(?:---|___|\*\*\*)+$/.test(o)){s(),a(),n.push({type:"rule"});continue}if(Eg.test(o)){s(),r.push(o.replace(Eg,"").trim());continue}a(),i.push(o)}return s(),a(),n}function RR(t){return String(t??"").split(/(\*\*[^*]+\*\*|__[^_]+__|`[^`]+`)/g).filter(Boolean).map(e=>/^\*\*[^*]+\*\*$/.test(e)||/^__[^_]+__$/.test(e)?{type:"strong",text:e.slice(2,-2)}:/^`[^`]+`$/.test(e)?{type:"code",text:e.slice(1,-1)}:{type:"text",text:e})}function CR(t){return typeof t=="string"?t.trim():!t||typeof t!="object"?"":String(t.content??t.body??t.text??t.answer??t.summary??t.conclusion??t.diagnosis??t.fault??t.feedback??t.result??"").trim()}function mt(t){return String(t??"").trim()}const Ox={"TRAK-TC820LTYSI-001":"TRAK TC820LTYsi 车削中心","LNS-QL-SERVO-80-S2-001":"LNS QL Servo 80 S2 棒料送料机","ELITE-CS612-ROBOT-001":"ELITE ROBOTS CS612 六轴协作机器人","RENISHAW-EQUATOR300-001":"Renishaw Equator 300 比对仪"};function PR(t={},e={}){var n;return mt(t.device_id||t.machine_id||e.device_id||((n=e.sample)==null?void 0:n.device_id))}function kx(t,e={}){var s;const n=mt(t),r=(Array.isArray((s=e==null?void 0:e.snapshot)==null?void 0:s.devices)?e.snapshot.devices:Array.isArray(e==null?void 0:e.devices)?e.devices:[]).find(a=>mt((a==null?void 0:a.device_id)||(a==null?void 0:a.id))===n);return mt((e==null?void 0:e.device_name)||(e==null?void 0:e.machine_name)||(r==null?void 0:r.name)||(r==null?void 0:r.display_name)||Ox[n]||n||"设备")}function NR(t={},e={}){const n=t.diagnosis_context&&typeof t.diagnosis_context=="object"?t.diagnosis_context:{},i=e.sample&&typeof e.sample=="object"?e.sample:{},r=[e.fault,e.summary,n.fault,n.summary,n.diagnosis,t.alarm_label,i.alarm_label,t.alarm_code||i.alarm_code?`报警 ${t.alarm_code||i.alarm_code}`:""].map(mt).find(s=>s&&!/[{}]/.test(s));return r?r.replace(/^设备维修[:：]\s*/i,""):""}function Bx(t){const e=t&&typeof t=="object"?t.content??t.body??t.text??t.title??t.name??t.description??"":t,n=nn(mt(e).replace(/\bLOTO\s*断电挂牌\b/gi,"断电挂牌").replace(/\s*\bLOTO\b\s*/gi,"").replace(/\brunning\b/gi,"运行").replace(/\bidle\b/gi,"待机"));return!n||/^\[(?:table|cad_drawing)\b/i.test(n)||/^(?:文档|页码|内容类型|本地OCR识别结果|表格行\d+)\s*[:：]/i.test(n)||/表格行\d+\s*[:：]/i.test(n)?"":n}function LR(t){const e=mt(t),n=e.toLowerCase(),i=["本地ocr识别结果","内容类型:","evidence.","steps.action","steps.safety","positioningerror","encoderlost","报警字典"];return e.length<=120&&!i.some(r=>n.includes(r))}function sa(t,{executableOnly:e=!1}={}){return(Array.isArray(t)?t:mt(t).split(/[；;\n。]+/u)).map(Bx).filter(Boolean).filter(i=>!e||LR(i)).filter((i,r,s)=>s.indexOf(i)===r)}function DR(t){return Array.isArray(t)?t.map(e=>{if(e&&typeof e=="object")return e;const n=Bx(e);return n?{type:"note",content:n}:null}).filter(Boolean):[]}function IR(t){const e=t&&typeof t=="object"?t:{fault:t},n=[e.summary,e.fault,e.diagnosis].map(Fx).find(Boolean)||{},i=nn(n.summary||e.summary||e.fault||e.diagnosis),r=nn(n.diagnosis||e.cause||e.diagnosis);return{...e,fault:i,summary:i,cause:r,diagnosis:r,recommendation:nn(n.recommendation||e.recommendation),nextAction:nn(e.next_action||n.next_action),severity:nn(e.severity||n.severity)}}function UR({order:t={},plan:e={},diagnosis:n={}}={}){var l,c,h;const i=e&&typeof e=="object"&&(e.plan_id||(l=e.repair_steps)!=null&&l.length||(c=e.tools)!=null&&c.length||(h=e.required_tools)!=null&&h.length)?e:null,r=t.maintenance_plan_snapshot&&typeof t.maintenance_plan_snapshot=="object"?t.maintenance_plan_snapshot:t.maintenance_plan&&typeof t.maintenance_plan=="object"?t.maintenance_plan:{},s=i||r,a=i?"maintenance-plan":Object.keys(r).length?"legacy-workorder-snapshot":"unavailable",o=s.diagnosis&&typeof s.diagnosis=="object"?s.diagnosis:t.diagnosis_snapshot&&typeof t.diagnosis_snapshot=="object"?t.diagnosis_snapshot:n;return{planId:mt(s.plan_id),diagnosis:IR(o),steps:sa(s.repair_steps||s.steps,{executableOnly:!0}),tools:sa(s.tools||s.required_tools),parts:sa(s.parts||s.required_parts),safety:sa(s.safety||s.safety_requirements),preChecks:sa(s.pre_checks,{executableOnly:!0}),postChecks:sa(s.post_checks,{executableOnly:!0}),evidence:DR(s.evidence||s.memory_evidence),riskLevel:mt(s.risk_level||s.riskLevel),estimatedTime:mt(s.estimated_time||s.estimatedTime||s.estimated_duration),source:a}}function Tu(t={},e={},n={}){var h;const i=nn(t.title),r=mt(e.part_name)&&!["待确认故障部件","待补充"].includes(mt(e.part_name))?mt(e.part_name):"设备",s=PR(t,n),a=kx(s,n),o=!!(mt((n==null?void 0:n.device_name)||(n==null?void 0:n.machine_name))||Array.isArray((h=n==null?void 0:n.snapshot)==null?void 0:h.devices)&&n.snapshot.devices.some(p=>mt((p==null?void 0:p.device_id)||(p==null?void 0:p.id))===s&&mt((p==null?void 0:p.name)||(p==null?void 0:p.display_name)))||Ox[s]),l=NR(t,n),c=!i||i.length>80||/[\n#{}]/.test(i)||/^(?:分析过程|基于|我已|让我|事件分析|诊断分析|设备维修[:：])/i.test(i)||i===`${r}维修`||i==="设备维修工单"||i==="主轴电机组件维修";return s&&o&&c?`${a} · ${l||`${r}维修`}`:i&&i.length<=80&&!/[\n#{}]/.test(i)&&!/^(?:分析过程|基于|我已|让我|事件分析|诊断分析|设备维修[:：])/i.test(i)?i:`${r}维修`}function FR({feedback:t=""}={}){return{action:"mark_repair_completed",repair_feedback:{feedback:mt(t)}}}function OR({order:t={},target:e={},plan:n={},diagnosis:i={},context:r={}}={}){var o,l;const s=t.diagnosis_context&&typeof t.diagnosis_context=="object"?t.diagnosis_context:{};return{title:Tu(t,e,{...r,fault:i.fault||i.summary})||"设备维修工单",workorderId:mt(t.workorder_id),deviceId:mt(t.device_id),assignee:mt(t.assignee_name||t.assignee)||"待派工",status:mt(t.status)||"open",accepted:!!t.accepted_by,verificationPhase:mt((o=t.repair_verification)==null?void 0:o.phase),machineControl:t.machine_control&&typeof t.machine_control=="object"?t.machine_control:null,recoverySample:r.recoverySample&&typeof r.recoverySample=="object"?r.recoverySample:{},partName:mt(e.part_name)||"待确认故障部件",partNo:mt(e.part_no)||"待补充",system:mt(e.system)||"待确认",location:mt(e.location)||"待现场确认",faultSymptom:mt(e.symptom)||mt(e.description)||mt(i.fault)||mt(s.diagnosis)||mt(t.title)||"设备异常",autoDispatched:["","agent","auto","monitor"].includes(mt(t.source).toLowerCase())||!!(s.summary||(l=t.drawing_context)!=null&&l.model_url)}}function Hp(t,e){var n,i,r;return e||((n=t==null?void 0:t.latest_result)==null?void 0:n.current_sample)||((r=(i=t==null?void 0:t.devices)==null?void 0:i.find(s=>s.device_id===(t==null?void 0:t.device_id)))==null?void 0:r.current_sample)||{}}function zx(t,e){const n=Hp(t,e);return String((n==null?void 0:n.device_id)||(t==null?void 0:t.device_id)||"").trim()}function Vp(t,e){var r,s;const n=zx(t,e),i=(r=t==null?void 0:t.diagnosis)==null?void 0:r.latest_by_device;return(n&&i&&typeof i[n]=="object"?i[n]:null)||((s=t==null?void 0:t.diagnosis)==null?void 0:s.latest)||{}}function kR(t,e){var r,s;const n=zx(t,e),i=(r=t==null?void 0:t.diagnosis)==null?void 0:r.pipeline_by_device;return(n&&i&&typeof i[n]=="object"?i[n]:null)||((s=t==null?void 0:t.diagnosis)==null?void 0:s.pipeline)||{}}function Gp(t,e,n=(i=>(i=t==null?void 0:t.diagnosis)==null?void 0:i.latest)()||{}){const r=Hp(t,e),s=String((r==null?void 0:r.alarm_code)||"").trim(),a=String((n==null?void 0:n.alarm_code)||"").trim();if(!s)return!0;if(!a||s!==a)return!1;const o=String((r==null?void 0:r.device_id)||(t==null?void 0:t.device_id)||"").trim(),l=String((n==null?void 0:n.device_id)||"").trim();return!o||!l||o===l}function BR(t,e){const n=(t==null?void 0:t.diagnosis)||{},i=Vp(t,e),r=Hp(t,e),s=String((r==null?void 0:r.alarm_code)||"").trim(),a=Gp(t,e,i),o=a?i:{},l=Array.isArray(o.evidence)?o.evidence.map(AR).filter(Boolean):[],c=[o.summary,o.diagnosis,o.fault].map(Fx).find(Boolean)||{},h=nn(c.summary||o.summary||o.fault||o.diagnosis),p=nn(c.diagnosis||o.cause||o.diagnosis),f=nn(c.recommendation||o.recommendation),g=nn(o.next_action||c.next_action);return{deviceId:String((r==null?void 0:r.device_id)||(t==null?void 0:t.device_id)||o.device_id||""),status:a?String(o.status||n.status||"waiting"):"waiting",summary:a?h||"等待诊断结果":s?`正在等待报警 ${s} 的诊断结果`:"等待诊断结果",cause:p,confidence:o.confidence==null?null:Number(o.confidence),evidence:l,recommendation:f,nextAction:g,isCurrent:a,currentAlarm:s}}function Sa(t){if(typeof t=="string")return t.trim();if(!t||typeof t!="object")return"";for(const e of["summary","conclusion","diagnosis","fault","feedback","result","content"])if(typeof t[e]=="string"&&t[e].trim())return t[e].trim();return""}function Tg(t,e=[]){if(Array.isArray(t))return t.map(Sa).filter(Boolean);if(!t||typeof t!="object")return[];for(const n of e)if(Array.isArray(t[n]))return t[n].map(Sa).filter(Boolean);return[]}function zR(t){const e=t&&typeof t=="object"?t:{},n=[],i=e.diagnosis||e.diagnosis_result||{},r=Sa(i);r&&n.push({title:"诊断结论",body:r});const s=e.maintenance_plan||e.maintenance||{},a=Tg(s,["repair_steps","steps","checks"]);a.length&&n.push({title:"维修步骤",items:a});const o=Sa(s);!a.length&&o&&n.push({title:"维修方案",body:o});const l=e.workorder||e.work_order||{},c=Sa(l);c&&n.push({title:"工单安排",body:c});const h=e.repair_feedback||e.repair_verification||e.repair_result||{},p=Sa(h);p&&n.push({title:"维修反馈",body:p});const f=e.quality||e.quality_result||{},g=[];return typeof f.passed=="boolean"&&g.push(f.passed?"已通过":"未通过"),g.push(...Tg(f,["findings","defects"])),g.length&&n.push({title:"质量结果",body:g.join("；")}),n}const HR=new Set(["alarm","fault","warning"]);function Ag(t={}){const e=String((t==null?void 0:t.alarm_code)||(t==null?void 0:t.error_code)||"").trim();if(e)return e;const n=Array.isArray(t==null?void 0:t.alarm_codes)?t.alarm_codes:[];return String(n.find(i=>String(i||"").trim())||"").trim()}function VR(t={},e={}){var l,c;const n=String((t==null?void 0:t.device_id)||(e==null?void 0:e.device_id)||"").trim(),i=((e==null?void 0:e.devices)||[]).find(h=>String((h==null?void 0:h.device_id)||"").trim()===n)||{},s=[t,(l=e==null?void 0:e.latest_result)==null?void 0:l.current_sample,i,i==null?void 0:i.current_sample,(c=i==null?void 0:i.latest_result)==null?void 0:c.current_sample].find(h=>{const p=String((h==null?void 0:h.status)||"").trim().toLowerCase();return HR.has(p)&&Ag(h)}),a=Ag(s),o=String((s==null?void 0:s.device_id)||n).trim();return!o||!a?{required_capabilities:["document_search"],alarm_active:!1}:{required_capabilities:["document_search"],alarm_active:!0,device_id:o,alarm_code:a,alarm_label:String((s==null?void 0:s.alarm_label)||(s==null?void 0:s.alarm_description)||"").trim(),alarm_status:String((s==null?void 0:s.status)||"").trim().toLowerCase()}}const Hx=new Set(["tool_called","tool_completed","tool_started","tool_guard","tool_error"]);function zd(t){const e=Array.isArray(t)?t:(t==null?void 0:t.trace)||(t==null?void 0:t.items)||(t==null?void 0:t.events)||(t==null?void 0:t.records)||[];return Array.isArray(e)?e.filter(n=>n&&typeof n=="object"):[]}function GR(t){const e=Array.isArray(t)?t:(t==null?void 0:t.runs)||(t==null?void 0:t.items)||[];return Array.isArray(e)?e.filter(n=>n&&typeof n=="object"):[]}function bg(t){const e=[t==null?void 0:t.type,t==null?void 0:t.event,t==null?void 0:t.name,t==null?void 0:t.node,t==null?void 0:t.agent,t==null?void 0:t.tool,t==null?void 0:t.tool_name,t==null?void 0:t.step].map(n=>String(n||"").toLowerCase()).join(" ");return/quality|inspect_quality|quality_check|part_quality|质检/.test(e)}function WR(t){const e=[t==null?void 0:t.type,t==null?void 0:t.event,t==null?void 0:t.name,t==null?void 0:t.node,t==null?void 0:t.agent,t==null?void 0:t.tool,t==null?void 0:t.tool_name,t==null?void 0:t.step].map(n=>String(n||"").toLowerCase()).join(" ");return/rag|knowledge|search_knowledge|knowledge_search|vector_search|document_search|retrieval|检索|知识问答/.test(e)}function jR(t,e){if(!t||!e)return!1;const n=Array.isArray(t.trace_ids)?t.trace_ids:[t.trace_id],i=Array.isArray(t.task_ids)?t.task_ids:[t.task_id],r=Array.isArray(t.event_ids)?t.event_ids:[t.event_id],s=n.filter(Boolean).includes(e.trace_id)||i.filter(Boolean).includes(e.task_id),a=r.filter(Boolean).includes(e.event_id);return!s&&!a&&(n.some(Boolean)||i.some(Boolean)||r.some(Boolean))?!1:t.run_type==="quality"?bg(e):t.run_type==="rag"?WR(e):t.run_type==="fault"?!bg(e):!0}function er(t){if(t==null||t==="")return"暂无记录";if(typeof t=="string")return t;try{return JSON.stringify(t,null,2)}catch{return String(t)}}function XR(t){const e=String((t==null?void 0:t.event)||""),n=String((t==null?void 0:t.type)||"");return e==="tool_guard"?t.allowed===!1?"工具调用被拦截":"工具权限校验":e==="tool_error"||t!=null&&t.error?"执行异常":Hx.has(e)||n==="tool"?e==="tool_started"?"工具开始":"工具调用":e.includes("started")||e.endsWith("_start")?"开始执行":e.includes("completed")||e.endsWith("_end")||e==="step_completed"?"执行完成":e.includes("error")||e.includes("failed")||e.includes("timeout")?"执行异常":n==="agent"?"Agent执行":n==="runtime"?"运行时状态":n==="audit"?"审计记录":"运行记录"}function $R(t){const e=String((t==null?void 0:t.event)||"").toLowerCase();return t!=null&&t.error||e.includes("error")||e.includes("failed")||e.includes("timeout")||(t==null?void 0:t.allowed)===!1?"异常":e.includes("started")||e.endsWith("_start")?"执行中":e.includes("completed")||e.endsWith("_end")||e==="tool_called"||e==="step_completed"?"已完成":"已记录"}function Wp(t){const e=Number(t==null?void 0:t.execution_time),n=Number((t==null?void 0:t.elapsed_ms)??(t==null?void 0:t.latency_ms));return Number.isFinite(n)&&n>0?`${Math.round(n)} ms`:Number.isFinite(e)&&e>0?`${Math.round(e*1e3)} ms`:(t==null?void 0:t.latency)!==void 0&&(t==null?void 0:t.latency)!==null&&t.latency!==""?`${t.latency} ms`:"--"}function Vx(t){return{label:XR(t),operation:String((t==null?void 0:t.tool_name)||(t==null?void 0:t.tool)||(t==null?void 0:t.name)||(t==null?void 0:t.event)||"运行步骤"),status:$R(t),server:String((t==null?void 0:t.mcp_server)||(t==null?void 0:t.server)||""),duration:Wp(t)}}function Ln(t,e){for(const n of e)if((t==null?void 0:t[n])!==void 0&&(t==null?void 0:t[n])!==null&&t[n]!=="")return t[n];return null}function qR(t){const e=Vx(t),n={类型:(t==null?void 0:t.type)||"未知",事件:(t==null?void 0:t.event)||"未知",操作:e.operation,Agent:(t==null?void 0:t.agent)||"",节点:(t==null?void 0:t.node)||(t==null?void 0:t.step)||"",状态:e.status,时间:(t==null?void 0:t.timestamp)||"",耗时:e.duration,错误:(t==null?void 0:t.error)||""},i=Ln(t,["arguments","input","tool_input","tool_arguments","request"]),r=Ln(t,["context","runtime_context","execution_context","state","trace_context"]),s=Ln(t,["output","result","return_body","response","body","data","state_change"]);return[{key:"operation",title:"执行操作",value:er(n)},{key:"tool",title:"工具调用与输入",value:er(i)},{key:"context",title:"输入上下文",value:er(r)},{key:"return",title:"返回体",value:er(s)},{key:"raw",title:"完整事件",value:er(t)}]}function YR(t,e=0){return String((t==null?void 0:t.trace_id)||(t==null?void 0:t.task_id)||(t==null?void 0:t.agent_run_id)||`event-${e}`)}const KR=new Set(["agent_started","agent_completed","agent_error","agent_timeout","agent_failed"]);function Eo(t){const e=String((t==null?void 0:t.event)||"").toLowerCase();return(t==null?void 0:t.type)==="agent"||KR.has(e)}function Gx(t){const e=String((t==null?void 0:t.event)||"").toLowerCase();return(t==null?void 0:t.type)==="runtime"||e==="observation_added"||e==="evidence_added"?!1:(t==null?void 0:t.type)==="tool"||Hx.has(e)||!!(t!=null&&t.tool_name||t!=null&&t.tool)}function Li(t){const e=Ln(t,["context","runtime_context","execution_context","trace_context"]);return e&&typeof e=="object"&&!Array.isArray(e)?e:{}}function Wx(t){var e;return String((t==null?void 0:t.agent_run_id)||((e=Li(t))==null?void 0:e.agent_run_id)||"")}function wh(t){var e;return String((t==null?void 0:t.agent)||(t==null?void 0:t.name)||((e=Li(t))==null?void 0:e.agent)||"")}function jx(t){const e=Date.parse(String((t==null?void 0:t.timestamp)||""));return Number.isFinite(e)?e:null}function Xx(t){return t.reduce((e,n)=>({...e,...Li(n)}),{})}function $x(t){const e=String((t==null?void 0:t.event)||"").toLowerCase();return!!(t!=null&&t.error)||e.includes("error")||e.includes("failed")||e.includes("timeout")||(t==null?void 0:t.allowed)===!1}function ZR(t){const e=String((t==null?void 0:t.event)||"").toLowerCase();return e==="agent_completed"||e==="tool_called"||e==="tool_completed"||e==="step_completed"||e.endsWith("_completed")||e.endsWith("_end")}function QR(t){const e=t.filter(Eo);return e.some($x)?"异常":e.some(n=>String((n==null?void 0:n.event)||"").toLowerCase()==="agent_completed")?"已完成":e.some(n=>String((n==null?void 0:n.event)||"").toLowerCase()==="agent_started")?"执行中":"已记录"}function JR(t,e){var l,c,h;const n=Wx(t);if(n)return e.find(p=>p.agent_run_id===n)||null;const i=String((t==null?void 0:t.trace_id)||((l=Li(t))==null?void 0:l.trace_id)||""),r=String((t==null?void 0:t.task_id)||((c=Li(t))==null?void 0:c.task_id)||""),s=wh(t),a=e.filter(p=>{const f=i&&p.trace_id&&i===p.trace_id,g=r&&p.task_id&&r===p.task_id;return s&&p.agent&&s===p.agent&&(f||g)});if(a.length<=1)return a[0]||null;const o=jx(t);return((h=a.map(p=>({group:p,distance:o===null||p.started_ms===null?Number.MAX_SAFE_INTEGER:Math.abs(o-p.started_ms)})).sort((p,f)=>p.distance-f.distance)[0])==null?void 0:h.group)||a[0]}function eC(t){const e=new Map;return t.filter(Gx).forEach((n,i)=>{const r=Ln(n,["arguments","input","tool_input","tool_arguments","request"]);let s;try{s=JSON.stringify(r??"")}catch{s=String(r??"")}const a=String((n==null?void 0:n.tool_call_id)||(n==null?void 0:n.call_id)||`${(n==null?void 0:n.tool_name)||(n==null?void 0:n.tool)||(n==null?void 0:n.name)||"tool"}|${s}`),o=e.get(a)||{records:[],first_index:i};o.records.push(n),e.set(a,o)}),[...e.values()].map((n,i)=>{var l;const r=n.records,s=r[0]||{},a=r[r.length-1]||s,o=[...r].reverse().find(c=>Ln(c,["output","result","return_body","response","body","data"]));return{call_no:i+1,tool_name:String(s.tool_name||s.tool||s.name||"工具调用"),mcp_server:String(s.mcp_server||s.server||""),status:$x(r)?"异常":r.some(ZR)?"已完成":"执行中",started_at:s.timestamp||"",ended_at:a.timestamp||"",duration:Wp(a),input:Ln(r.find(c=>Ln(c,["arguments","input","tool_input","tool_arguments","request"])),["arguments","input","tool_input","tool_arguments","request"]),output:Ln(o,["output","result","return_body","response","body","data"]),context:Xx(r),error:((l=r.find(c=>c==null?void 0:c.error))==null?void 0:l.error)||"",event_count:r.length,records:r}})}function tC(t=[]){const e=Array.isArray(t)?t.filter(s=>s&&typeof s=="object"):[],n=new Map;e.forEach((s,a)=>{var g,v,E,_,u;if(!Eo(s))return;const o=wh(s)||"未知 Agent",l=Wx(s),c=`${(s==null?void 0:s.trace_id)||((g=Li(s))==null?void 0:g.trace_id)||"trace"}|${(s==null?void 0:s.task_id)||((v=Li(s))==null?void 0:v.task_id)||"task"}|${o}|${(s==null?void 0:s.attempt)||((E=Li(s))==null?void 0:E.attempt)||1}`,h=l||c,p=n.get(h)||{key:h,agent_run_id:l||c,agent:o,trace_id:String((s==null?void 0:s.trace_id)||((_=Li(s))==null?void 0:_.trace_id)||""),task_id:String((s==null?void 0:s.task_id)||((u=Li(s))==null?void 0:u.task_id)||""),started_ms:null,records:[],first_index:a};p.records.push(s);const f=jx(s);p.started_ms===null&&f!==null&&(p.started_ms=f),n.set(h,p)});const i=[...n.values()];e.forEach(s=>{if(Eo(s)||!Gx(s))return;const a=JR(s,i);a&&a.records.push(s)});const r=new Map;return i.sort((s,a)=>s.first_index-a.first_index).map(s=>{var E,_,u;const a=s.records,o=a.find(m=>String((m==null?void 0:m.event)||"").toLowerCase()==="agent_started")||a[0],l=[...a].reverse().find(m=>["agent_completed","agent_error","agent_timeout","agent_failed"].includes(String((m==null?void 0:m.event)||"").toLowerCase()))||a[a.length-1],c=s.agent||wh(o)||"未知 Agent",h=(r.get(c)||0)+1;r.set(c,h);const p=a.find(m=>Eo(m)&&Ln(m,["input","request","payload","state"]))||a.find(m=>Ln(m,["input","request","arguments","payload","state"])),f=[...a].reverse().find(m=>Eo(m)&&Ln(m,["output","result","return_body","response","body","data","state_change"]))||[...a].reverse().find(m=>Ln(m,["output","result","return_body","response","body","data","state_change"])),g=(o==null?void 0:o.timestamp)||((E=a[0])==null?void 0:E.timestamp)||"",v=(l==null?void 0:l.timestamp)||"";return{id:s.agent_run_id,invocation_no:h,agent:c,agent_run_id:s.agent_run_id,trace_id:s.trace_id||String((o==null?void 0:o.trace_id)||""),task_id:s.task_id||String((o==null?void 0:o.task_id)||""),step:String((o==null?void 0:o.step)||(o==null?void 0:o.node)||((_=Li(o))==null?void 0:_.step)||""),status:QR(a),started_at:g,ended_at:v,duration:Wp(l),input:Ln(p,["input","request","arguments","payload","state"]),context:Xx(a),output:Ln(f,["output","result","return_body","response","body","data","state_change"]),error:((u=a.find(m=>m==null?void 0:m.error))==null?void 0:u.error)||"",tool_calls:eC(a),event_count:a.length,records:a}})}const Th="industry-agent.rag-session.v1",Ah="industry-agent.rag-session.fallback.v1";function Rg(t){var r,s,a,o;if(!t||t.pending||t.agentError)return!1;const e=t.answer&&typeof t.answer=="object"?t.answer:{};if([(r=e.knowledge)==null?void 0:r.answer,(s=e.diagnosis)==null?void 0:s.summary,(a=e.report)==null?void 0:a.summary].some(l=>String(l||"").trim()))return!1;const i=String(((o=e.knowledge)==null?void 0:o.summary)||"").trim();return/^检索到\s*\d+\s*条(?:相关)?知识证据\s*[：:]/.test(i)||/^未检索到与[“"].+[”"]直接相关的可追踪知识证据/.test(i)}function Cg(t,e){try{const n=t==null?void 0:t.getItem(e);if(!n)return null;const i=JSON.parse(n);return Array.isArray(i)?i.filter(r=>r&&!r.pending&&r.question).slice(-20):null}catch{return null}}function Pg(t){let e=null,n=null;try{e=(t==null?void 0:t.sessionStorage)||null}catch{e=null}try{n=(t==null?void 0:t.localStorage)||null}catch{n=null}return{primary:e,fallback:n}}function nC(t){if(!t||typeof t!="object")return null;const e={};t.route&&(e.route=t.route),t.route_result&&typeof t.route_result=="object"&&(e.route_result={intent:t.route_result.intent,reason:t.route_result.reason});for(const n of["knowledge","diagnosis","report"]){const i=t[n];!i||typeof i!="object"||(n==="knowledge"&&(e.knowledge={answer:i.answer,summary:i.summary}),n==="diagnosis"&&(e.diagnosis={summary:i.summary,fault:i.fault,diagnosis:i.diagnosis}),n==="report"&&(e.report={title:i.title,summary:i.summary}))}return e}function iC(t){return(Array.isArray(t)?t:[]).filter(e=>e&&!e.pending&&e.question).slice(-20).map(e=>({id:String(e.id||`${Date.now()}-${Math.random()}`),question:String(e.question),answer:nC(e.answer),agentError:String(e.agentError||""),pending:!1}))}function rC(t,e=null){const n=Cg(t,Th);return n!==null?n:Cg(e,Ah)||[]}function sC(t,e,n=null){const i=iC(e);if(!i.length){try{t==null||t.removeItem(Th)}catch{}try{n==null||n.removeItem(Ah)}catch{}return}const r=JSON.stringify(i);try{t==null||t.setItem(Th,r)}catch{}try{n==null||n.setItem(Ah,r)}catch{}}const aC=new Set(["emergency_stop","e_stop","stopped"]);function qx(t={}){var n;const e=String((t==null?void 0:t.status)||(t==null?void 0:t.control_state)||"").toLowerCase();return aC.has(e)&&((n=t==null?void 0:t.fault_evidence)==null?void 0:n.evidence_status)==="unavailable"}function oC(t={}){if(qx(t))return"待复核";if((t==null?void 0:t.health_score)===null||(t==null?void 0:t.health_score)===void 0)return"--";const e=Number(t.health_score);return Number.isFinite(e)?`${e.toFixed(0)}/100`:String(t.health_score)}function lC(t={}){var n;return qx(t)?`${String(t.control_reason||((n=t.fault_evidence)==null?void 0:n.control_reason)||"安全联锁已触发").trim()}；停机前未采集到具体报警码或异常指标，健康度不可用`:""}const cC=[{label:"生产运营",items:[{id:"monitor",label:"监控中心",icon:"monitor"},{id:"diagnosis",label:"智能诊断",icon:"diagnosis"},{id:"maintenance",label:"维修方案",icon:"maintenance"},{id:"workorder",label:"工单系统",icon:"workorder"},{id:"quality",label:"质检系统",icon:"quality"}]},{label:"知识资产",items:[{id:"rag",label:"知识问答",icon:"knowledge"},{id:"logs",label:"日志系统",icon:"logs"},{id:"report",label:"报告中心",icon:"report"}]}];function uC({name:t}){const e={monitor:d.jsxs(d.Fragment,{children:[d.jsx("rect",{x:"3",y:"4",width:"18",height:"14",rx:"2"}),d.jsx("path",{d:"M7 13l3-3 2 2 4-4 2 2M8 21h8m-4-3v3"})]}),diagnosis:d.jsxs(d.Fragment,{children:[d.jsx("path",{d:"M12 3a6 6 0 0 0-3.7 10.7L7 18h10l-1.3-4.3A6 6 0 0 0 12 3Z"}),d.jsx("path",{d:"M9 21h6M10 18h4"})]}),workorder:d.jsxs(d.Fragment,{children:[d.jsx("rect",{x:"5",y:"4",width:"14",height:"17",rx:"2"}),d.jsx("path",{d:"M9 4.5V3h6v1.5M9 10h6M9 14h6M9 18h4"})]}),quality:d.jsxs(d.Fragment,{children:[d.jsx("path",{d:"M12 2 4 5v6c0 5 3.4 8.5 8 11 4.6-2.5 8-6 8-11V5l-8-3Z"}),d.jsx("path",{d:"m8.5 12 2.5 2.5 4.5-5"})]}),maintenance:d.jsxs(d.Fragment,{children:[d.jsx("rect",{x:"4",y:"3",width:"16",height:"18",rx:"2"}),d.jsx("path",{d:"M8 7h8M8 11h8M8 15h5M8 18h3"})]}),knowledge:d.jsx(d.Fragment,{children:d.jsx("path",{d:"M12 6c-2.5-2-5.5-2.3-9-1v14c3.5-1.3 6.5-1 9 1 2.5-2 5.5-2.3 9-1V5c-3.5-1.3-6.5-1-9 1ZM12 6v14"})}),logs:d.jsxs(d.Fragment,{children:[d.jsx("rect",{x:"5",y:"3",width:"14",height:"18",rx:"2"}),d.jsx("path",{d:"M8.5 8h7M8.5 12h7M8.5 16h4M8 8h.01M8 12h.01M8 16h.01"})]}),report:d.jsxs(d.Fragment,{children:[d.jsx("rect",{x:"5",y:"3",width:"14",height:"18",rx:"2"}),d.jsx("path",{d:"M9 8h6M9 12h6M9 16h4"})]})};return d.jsx("svg",{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.7",strokeLinecap:"round",strokeLinejoin:"round","aria-hidden":"true",children:e[t]})}function dC({activeView:t,onChange:e,hasError:n,connected:i}){return d.jsxs("aside",{className:"workbench-sidebar","aria-label":"工作台导航",children:[d.jsxs("div",{className:"workbench-brand",children:[d.jsx("span",{className:"workbench-brand-mark","aria-hidden":"true",children:"IA"}),d.jsxs("span",{children:[d.jsx("strong",{children:"IND-Agent"}),d.jsx("small",{children:"工业智能工作台"})]})]}),d.jsx("nav",{className:"workbench-nav","aria-label":"功能导航",children:cC.map(r=>d.jsxs("div",{className:"workbench-nav-group",children:[d.jsx("span",{className:"workbench-nav-caption",children:r.label}),r.items.map(s=>d.jsxs("button",{type:"button",className:`workbench-nav-item ${t===s.id?"is-active":""}`,"aria-current":t===s.id?"page":void 0,onClick:()=>e(s.id),children:[d.jsx(uC,{name:s.icon}),d.jsx("span",{children:s.label}),s.id==="monitor"&&d.jsx("i",{"aria-label":"实时",children:"LIVE"})]},s.id))]},r.label))}),d.jsxs("div",{className:"workbench-sidebar-status",role:"status",children:[d.jsx("span",{className:`workbench-status-dot ${n?"is-error":i?"":"is-pending"}`}),d.jsxs("span",{children:[d.jsx("strong",{children:n?"连接异常":i?"服务运行中":"连接中"}),d.jsx("small",{children:n?"请检查服务连接":i?"设备数据持续同步":"正在获取设备快照"})]})]})]})}function fC(t,e,n,i){return{username:t.trim(),password:e,role:n,primary_device_id:n==="technician"?i:""}}async function Qi(t,e){const n=await fetch(`/api/team/${t}`,{credentials:"same-origin",method:e===void 0?"GET":"POST",headers:{"Content-Type":"application/json"},...e===void 0?{}:{body:JSON.stringify(e)}}),i=await n.json();if(!n.ok)throw new Error(typeof i.detail=="string"?i.detail:i.error||"账号服务请求失败");return i}function hC({actor:t,onActor:e,line:n,onLine:i}){const[r,s]=le.useState("login"),[a,o]=le.useState(""),[l,c]=le.useState(""),[h,p]=le.useState("technician"),[f,g]=le.useState(""),[v,E]=le.useState([]),[_,u]=le.useState(""),[m,M]=le.useState(!1);le.useEffect(()=>{let w=!0;Qi("me").then(A=>w&&e(A.user)).catch(()=>{}),Qi("devices").then(A=>w&&E(A.items||[])).catch(A=>w&&u(A.message));const R=()=>Qi("line").then(A=>w&&i(A)).catch(()=>w&&i({state:"unavailable"}));R();const x=setInterval(R,2e3);return()=>{w=!1,clearInterval(x)}},[]);async function y(w){w.preventDefault(),M(!0),u("");try{r==="register"&&await Qi("register",fC(a,l,h,f));const R=await Qi("login",{username:a,password:l});e(R.user),c("")}catch(R){u(R.message)}finally{M(!1)}}const T={unknown:"尚无控制记录",stopped:"整线已暂停",stopping:"正在暂停整线",starting:"复机验证中",running:"整线运行已复核",failed:"复机失败，已回停",rollback_failed:"复机失败，部分回停未确认",stop_failed:"部分设备停机未确认",unreconciled:"停机待对账，禁止复机",unavailable:"控制账本不可用"};return d.jsxs("details",{className:"team-access",children:[d.jsxs("summary",{children:["维修小组 · ",t?`${t.username}（${t.role==="supervisor"?"监督人":"维修人员"}）`:"注册 / 登录"," · ",T[n==null?void 0:n.state]||"未启用控制"]}),d.jsxs("div",{className:"team-access-body",children:[t?d.jsxs(d.Fragment,{children:[d.jsxs("p",{children:["主要负责设备：",t.primary_device_id||"监督全部派工与接单"]}),d.jsx("button",{type:"button",className:"button",onClick:async()=>{try{await Qi("logout",{}),e(null)}catch(w){u(w.message)}},children:"退出登录"})]}):d.jsxs("form",{onSubmit:y,children:[d.jsxs("label",{children:["用户名",d.jsx("input",{autoComplete:"username",required:!0,maxLength:64,value:a,onChange:w=>o(w.target.value)})]}),d.jsxs("label",{children:["密码",d.jsx("input",{type:"password",autoComplete:r==="login"?"current-password":"new-password",minLength:8,maxLength:256,required:!0,value:l,onChange:w=>c(w.target.value)})]}),r==="register"&&d.jsxs(d.Fragment,{children:[d.jsxs("label",{children:["身份",d.jsxs("select",{value:h,onChange:w=>p(w.target.value),children:[d.jsx("option",{value:"technician",children:"维修人员（共4名）"}),d.jsx("option",{value:"supervisor",children:"监督人（共1名，仅查看和催办）"})]})]}),h==="technician"&&d.jsxs("label",{children:["主要负责机器",d.jsxs("select",{required:!0,value:f,onChange:w=>g(w.target.value),children:[d.jsx("option",{value:"",children:"请选择当前工厂设备"}),v.map(w=>d.jsx("option",{value:w.device_id||w.id,children:w.name||w.display_name||w.device_id||w.id},w.device_id||w.id))]})]})]}),d.jsx("button",{className:"button primary",disabled:m,children:m?"提交中":r==="register"?"注册并登录":"登录"}),d.jsx("button",{className:"button",type:"button",onClick:()=>s(r==="login"?"register":"login"),children:r==="login"?"注册新账号":"已有账号"})]}),d.jsx("p",{children:"故障确认后暂停整线；所有故障工单完成且设备数据复核通过后，才会启动整线。监督人不控制设备。"}),(n==null?void 0:n.devices)&&d.jsx("ul",{children:Object.entries(n.devices).map(([w,R])=>d.jsxs("li",{children:[w,"：",R.state==="verified"?"已读回确认":"尚未确认","（",R.action==="start"?"启动":"停止","）"]},w))}),(n==null?void 0:n.reason)&&d.jsxs("p",{role:"status",children:["原因：",n.reason]}),(n==null?void 0:n.rollback)&&d.jsx("ul",{children:Object.entries(n.rollback).map(([w,R])=>d.jsxs("li",{children:["回停 ",w,"：",R.state==="verified"?"已读回确认停止":"停止未确认，请检查设备"]},w))}),_&&d.jsx("p",{className:"inline-error",role:"alert",children:_})]})]})}function pC({actor:t}){const[e,n]=le.useState([]),[i,r]=le.useState([]),[s,a]=le.useState(""),[o,l]=le.useState("");le.useEffect(()=>{let h=!0;const p=()=>Promise.all([Qi("workorders"),Qi("reminders")]).then(([g,v])=>{h&&(n(g.items),r(v.items),a(""))}).catch(g=>h&&a(g.message));p();const f=setInterval(p,5e3);return()=>{h=!1,clearInterval(f)}},[t.user_id]);async function c(h){l(h.workorder_id);try{await Qi("reminders",{workorder_id:h.workorder_id,text:"请及时确认接单、执行维修并反馈进展"}),a("催办已发送")}catch(p){a(p.message)}finally{l("")}}return d.jsxs("section",{className:"workorder-queue",children:[d.jsx("h2",{children:t.role==="supervisor"?"监督与催办":"我的催办消息"}),t.role==="supervisor"&&d.jsx("ul",{children:e.map(h=>d.jsxs("li",{children:[d.jsx("strong",{children:h.title}),d.jsxs("p",{children:[h.workorder_id," · ",h.device_id," · ",h.assignee_name||"待派工"," · ",h.status," · ",h.accepted_by?"已接单":"尚未确认接单"]}),d.jsx("button",{className:"button",disabled:o===h.workorder_id||!h.assignee||["completed","closed"].includes(h.status),onClick:()=>c(h),children:"站内催办"})]},h.workorder_id))}),i.length?d.jsx("ul",{children:i.map(h=>d.jsxs("li",{children:[h.workorder_id,"：",h.text," · ",h.read?"已读":"未读",t.role==="technician"&&!h.read&&d.jsx("button",{className:"button",onClick:async()=>{try{await Qi(`reminders/${h.reminder_id}/read`,{}),r(p=>p.map(f=>f.reminder_id===h.reminder_id?{...f,read:!0}:f))}catch(p){a(p.message)}},children:"我已收到"})]},h.reminder_id))}):d.jsx("p",{children:"暂无催办记录"}),s&&d.jsx("p",{role:"status",children:s})]})}const jp=[{id:"TRAK-TC820LTYSI-001",name:"TRAK-TC820LTYSI-001",line:"A线 · 主加工单元",type:"数控车削中心",x:50,y:39,live:!0,image:Dx}],mC={"TRAK-TC820LTYSI-001":{name:"TRAK TC820LTYsi 车削中心",line:"A线 · 主加工单元",type:"数控车削中心",x:42,y:58,image:Dx},"LNS-QL-SERVO-80-S2-001":{name:"LNS QL Servo 80 S2 棒料送料机",line:"A线 · 上料单元",type:"棒料送料机",x:23,y:46},"ELITE-CS612-ROBOT-001":{name:"ELITE ROBOTS CS612 六轴协作机器人",line:"A线 · 下料协作单元",type:"六轴协作机器人",x:68,y:42}},gC={turning_center:"数控车削中心",bar_feeder:"棒料送料机",industrial_robot:"工业机器人",equator_gauge:"尺寸检测设备"},Na={turning_center:{area:"A01 主加工单元",flow:"棒料 → 车削 → 机械臂取件",focus:"主轴、液压、冷却与刀塔",metrics:[["spindle_rpm","主轴转速","主轴","rpm"],["spindle_load_percent","主轴负载","主轴","%"],["spindle_temperature_c","主轴温度","主轴","°C"],["spindle_vibration_mm_s","主轴振动","主轴","mm/s"],["hydraulic_pressure_psi","液压压力","液压","psi"],["coolant_pressure_psi","冷却压力","冷却","psi"],["lubrication_pressure_psi","润滑压力","润滑","psi"],["turret_servo_load_percent","刀塔负载","刀塔","%"]]},bar_feeder:{area:"A02 棒料上料单元",flow:"棒料检测 → 推料 → 车床联动",focus:"棒料、伺服、推料与安全门",metrics:[["bar_diameter_mm","棒料直径","棒料","mm"],["bar_length_mm","剩余长度","棒料","mm"],["pusher_position_mm","推料位置","送料","mm"],["feed_speed_m_min","送料速度","送料","m/min"],["pushing_torque_nm","推送扭矩","伺服","N·m"],["loading_cycle_seconds","上料周期","节拍","s"],["servo_battery_voltage_v","伺服电池","电气","V"],["dc_24v_supply_v","24V电源","电气","V"]]},industrial_robot:{area:"A03 下料协作单元",flow:"取件 → 送检 → 合格／待处理分流",focus:"关节、末端力、控制器与安全 IO",metrics:[["joint_comm_quality_percent","关节通讯","通讯","%"],["tool_speed_mm_s","TCP速度","运动","mm/s"],["tcp_force_n","TCP力","末端","N"],["joint_temperature_c","关节温度","关节","°C"],["robot_power_w","机器人功率","电气","W"],["robot_48v_power_v","48V母线","电气","V"],["controller_performance_pct","控制器负载","控制器","%"],["memory_free_mb","剩余内存","控制器","MB"]]},equator_gauge:{area:"A04 尺寸检测工位",flow:"机械臂送检 → 尺寸检测 → 分流",focus:"测头、控制器、环境与检测过程",metrics:[]}},Ng=[{x:42,y:58},{x:23,y:46},{x:68,y:42},{x:78,y:62}],_C=[{id:"TRAK-TC820LTYSI-001",device_type:"turning_center",name:"TRAK TC820LTYsi 车削中心"},{id:"LNS-QL-SERVO-80-S2-001",device_type:"bar_feeder",name:"LNS QL Servo 80 S2 棒料送料机"},{id:"ELITE-CS612-ROBOT-001",device_type:"industrial_robot",name:"ELITE ROBOTS CS612 六轴协作机器人"},{id:"RENISHAW-EQUATOR300-001",device_type:"equator_gauge",name:"Renishaw Equator 300 比对仪"}],vC={critical:"关键规则",threshold:"阈值规则",duration:"持续规则",count:"计数规则",trend:"趋势规则",multi_metric:"多指标规则"},xC={normal:"正常",warning:"预警",alarm:"报警",fault:"故障",running:"运行中",stopped:"已停止",offline:"离线",unknown:"状态未知"},yC={normal:"正常",initial:"初级预警",intermediate:"中级报警",high:"高级故障"},Lg={metric:"指标异常",temperature:"温度异常",vibration:"振动异常",alarm:"设备报警",status:"设备状态",trend:"趋势异常",multi_metric:"多指标联合异常"},Au={open:"待处理",in_progress:"处理中",completed:"已完成",closed:"已关闭"},Dg={700001:{component:"LUBRICATION-PUMP",part_no:"TN420050-B",cad_part_numbers:["TN420050-B","TN420390-A","TN420470","TR260061","TR443560"],part_name:"润滑泵",system:"自动润滑系统",location:"机床后侧润滑单元",description:"向主轴轴承、导轨和丝杠提供定量润滑。压力未达到时，应优先检查泵体、油路、过滤器和压力开关。",relation:"上接润滑油箱，下接分配器和主轴/导轨润滑回路",symptom:"润滑压力未达到设定值",check:"检查油位、泵出口压力、过滤器和压力开关",marker:{left:"20%",top:"68%"}},700002:{component:"MCP-PENDANT",part_no:"34431-1",cad_part_numbers:["34410-1_FIXED","34431-1","34431-2","34431-3","34431-4","34431-5","34432-1","34432-2","34432-3","34432-4","34432-5"],part_name:"机床控制面板",system:"机床操作系统",location:"机床前侧悬臂操作箱区域",description:"用于操作机床运行、进给和手轮控制。Feed hold 报警时，应检查控制面板、进给启动按钮和手轮输入。",relation:"连接 CNC 控制器、进给启动按钮、手轮和操作面板输入",symptom:"机床处于 Feed hold，轴运动被暂停",check:"检查进给启动按钮、悬臂面板、手轮和控制信号反馈",marker:{left:"68%",top:"28%"}},700010:{component:"HYDRAULIC-UNIT",part_no:"HY-TC820-002",part_name:"液压站",system:"液压系统",location:"机床后侧液压单元",description:"为卡盘、尾座和夹紧机构提供液压动力。压力不足会导致夹紧、松开或尾座动作异常。",relation:"连接液压泵、溢流阀、压力传感器和卡盘/尾座执行机构",symptom:"液压压力未达到设定值",check:"检查液压油位、泵站压力、溢流阀和泄漏点",marker:{left:"25%",top:"64%"}},700032:{component:"COOLING-PUMP",part_no:"CP-TC820-015",part_name:"冷却泵",system:"冷却系统",location:"机床后侧冷却单元",description:"将冷却液输送至刀具和主轴加工区域，用于带走切削热并维持加工温度。过载通常与泵体堵塞、叶轮卡滞、过滤器堵塞或电机异常有关。",relation:"连接冷却箱、过滤器、冷却管路和主轴冷却回路",symptom:"冷却泵电机过载，冷却流量可能下降",check:"检查泵体、入口过滤器、出口压力、电机电流和叶轮阻塞",marker:{left:"24%",top:"72%"}},700029:{component:"LUBRICATION-PUMP",part_no:"TN420050-B",cad_part_numbers:["TN420050-B","TN420390-A","TN420470","TR260061","TR443560"],part_name:"润滑泵",system:"自动润滑系统",location:"机床后侧润滑单元",description:"监测润滑油箱液位并向主轴、导轨和丝杠供油。液位低时应先确认油箱、泵体和液位开关。",relation:"连接润滑油箱、润滑泵、液位开关和分配器",symptom:"润滑油液位低",check:"检查油箱液位、加油口、液位开关和是否存在泄漏",marker:{left:"20%",top:"68%"}},700223:{component:"TEMP-PT100",part_no:"TS-PT100-008",part_name:"主轴温度传感器",system:"主轴温度监测",location:"主轴电机壳体测温孔",description:"采集主轴电机壳体温度并反馈给控制系统，用于过温保护和趋势监测。",relation:"安装于主轴电机壳体，信号接入 PLC 模拟量模块",symptom:"主轴温度超过报警阈值",check:"检查传感器安装、线缆、接插件和实际温度读数",marker:{left:"58%",top:"31%"}},700006:{component:"TURRET-ASSY",part_no:"TR-TC820-006",part_name:"刀塔组件",system:"刀塔系统",location:"主轴箱前侧刀塔区域",description:"完成刀具选择、旋转定位和夹紧。动作超时可能由伺服、夹紧开关、机械卡滞或润滑不足引起。",relation:"连接刀塔伺服、电磁阀、夹紧/松开检测开关和刀具座",symptom:"刀塔未在规定时间内完成旋转",check:"检查刀塔参考位置、伺服负载、夹紧开关和机械干涉",marker:{left:"61%",top:"52%"}},700509:{component:"TAILSTOCK-ASSY",part_no:"TS-TC820-009",part_name:"尾座夹紧机构",system:"尾座系统",location:"机床右侧尾座区域",description:"用于工件端部支撑和夹紧，夹紧压力不足时会影响加工稳定性和人身安全。",relation:"连接尾座液压缸、压力开关和夹紧执行机构",symptom:"尾座夹紧压力未达到设定值",check:"检查尾座压力、液压缸、夹紧开关和工件支撑状态",marker:{left:"78%",top:"52%"}},700240:{component:"TOOL-PROBE",part_no:"TP-TC820-010",part_name:"刀具测头",system:"刀具检测系统",location:"刀塔/加工区测量位置",description:"用于确认刀具位置和刀具状态，未到位时禁止进入相关加工流程。",relation:"连接测头本体、到位开关和控制系统输入",symptom:"刀具测头未处于规定位置",check:"检查测头机构、到位开关、线缆和机械干涉",marker:{left:"55%",top:"58%"}},700009:{component:"PART-CATCHER",part_no:"PC-TC820-011",part_name:"接料器",system:"下料系统",location:"主轴下方接料区域",description:"接收加工完成的零件并完成上下动作，位置异常时可能造成碰撞或下料失败。",relation:"连接升降执行机构、位置检测开关和下料托盘",symptom:"接料器上下动作异常",check:"检查位置开关、执行机构、导轨和是否存在工件干涉",marker:{left:"53%",top:"78%"}},700015:{component:"BARFEEDER",part_no:"BF-QL80S2-001",part_name:"棒料送料机",system:"上料系统",location:"机床左侧上料单元",description:"将棒料按设定长度稳定送入主轴，报警时应检查送料准备信号、伺服和推料机构。",relation:"连接棒料通道、推料伺服、送料控制器和车床接口",symptom:"送料机未就绪或送料报警",check:"检查棒料通道、推料位置、伺服状态和车床联锁信号",marker:{left:"12%",top:"48%"}}};function SC(t,e){var l,c,h;const n=((l=t==null?void 0:t.diagnosis_context)==null?void 0:l.current_sample)||((c=t==null?void 0:t.diagnosis_context)==null?void 0:c.sample)||{},i=[t==null?void 0:t.alarm_code,(h=t==null?void 0:t.diagnosis_context)==null?void 0:h.alarm_code,n==null?void 0:n.alarm_code,...Array.isArray(e==null?void 0:e.alarm_codes)?e.alarm_codes:[],e==null?void 0:e.alarm_code].map(p=>String(p||"").trim()).filter(Boolean),r=i.find(p=>Dg[p])||i[0]||"",s=Dg[r],a=t==null?void 0:t.repair_target;return!a||typeof a!="object"||["待确认故障部件","UNMAPPED-COMPONENT","待补充"].includes(String(a.part_name||a.component||a.part_no||""))?s?{...s,alarm_code:r}:{alarm_code:r,component:"UNMAPPED-COMPONENT",part_no:"待补充",part_name:"待确认故障部件",system:"待确认",location:"CAD 组件树中人工确认",description:"当前报警已经进入工单，但还没有与具体 CAD 部件建立映射。维修人员需要先在组件树中确认目标。",relation:"暂无装配关系数据",symptom:(t==null?void 0:t.title)||"设备异常",check:"查看报警定义、现场状态和 CAD 组件树",marker:{left:"50%",top:"50%"}}:{...a,alarm_code:a.alarm_code||r}}const MC=["主轴温度过高怎么检查？","报警 ALM-1001 的处理步骤是什么？","振动异常时应该优先排查哪些部件？"],EC={closed:"已关闭",open:"已打开",locked:"已锁定",unlocked:"未锁定",released:"已释放",pressed:"已按下",running:"运行中",stopped:"已停止",ready:"已就绪",clamped:"已夹紧",referenced:"已回零",inhibited:"已禁止",overtemperature:"温度过高",pressure_low:"压力不足",rotation_timeout:"旋转超时",clamp_pressure_low:"夹紧压力不足",not_in_position:"未到位",movement_error:"动作异常",alarm:"报警",overload:"过载",high_pressure_low:"高压不足",vibration_high:"振动过高",fault_injection:"故障注入状态",processing:"加工中",fault:"故障停机",emergency_stop:"急停状态",paused:"已暂停"},wC={idle:"待机",ready:"准备就绪",running:"运行中",processing:"加工中",paused:"已暂停",stopped:"已停止",completed:"加工完成",fault:"故障停机",fault_injection:"故障注入状态",emergency_stop:"急停状态",offline:"离线"};function TC(t){return(t==null?void 0:t.cycle_state_label)||Lr(wC,t==null?void 0:t.cycle_state)||"未知状态"}function AC(t){if(!t)return"无";const e=t.alarm_code||"",n=t.alarm_label||t.alarm_description||"";return e&&n?`${e} · ${n}`:n||e||"无"}async function sn(t,e={}){const n=await fetch(t,{cache:"no-store",headers:{"Content-Type":"application/json"},...e}),i=await n.json();if(!n.ok)throw new Error(i.error||`请求失败：${n.status}`);return i}function bh(t){return t!=null&&t.workorder&&typeof t.workorder=="object"?{...t.workorder,dispatch_context:t.dispatch_context,candidates:t.candidates,machine_control:t.machine_control}:t}function ei(t){if(!t)return"--";const e=new Date(t);return Number.isNaN(e.getTime())?t:e.toLocaleTimeString("zh-CN",{hour12:!1})}function Lr(t,e){return t[e]||e||"--"}function Ig(t){return t==="fault"?"fault":t==="alarm"?"alarm":t==="warning"?"warning":"normal"}function Yx(t){return t==="high"?"fault":t==="intermediate"?"alarm":t==="initial"?"warning":"normal"}function bC(t){var a;const e=(a=t==null?void 0:t.devices)!=null&&a.length?t.devices:jp,n=new Set(e.map(o=>String(o.device_id||o.id||""))),i=_C.filter(o=>!n.has(o.id)).map(o=>({...o,live:!1,data_unavailable:!0})),s=[...e,...i].map((o,l)=>{var v,E,_,u;const c=o.device_id||o.id,h=mC[c]||{},p=Ng[l%Ng.length],f=o.latest_result||((v=t==null?void 0:t.latest_results)==null?void 0:v[c])||(c===(t==null?void 0:t.device_id)?t==null?void 0:t.latest_result:null),g=(f==null?void 0:f.current_sample)||o.current_sample||null;return{id:c,name:o.name||h.name||c,line:h.line||o.line||"产线设备",deviceType:o.device_type||o.type||h.deviceType||"industrial_device",type:h.type||gC[o.device_type||o.type]||o.device_type||o.type||"工业设备",area:((E=Na[o.device_type||o.type])==null?void 0:E.area)||h.line||o.line||"产线设备",flow:((_=Na[o.device_type||o.type])==null?void 0:_.flow)||"实时采集 → 规则判定 → Agent诊断",focus:((u=Na[o.device_type||o.type])==null?void 0:u.focus)||"关键指标与告警状态",x:h.x??o.x??p.x,y:h.y??o.y??p.y,live:o.live!==!1&&!o.data_unavailable,image:h.image||o.image,result:f,sample:g}});return s.some(o=>o.id==="RENISHAW-EQUATOR300-001")||s.push({id:"RENISHAW-EQUATOR300-001",name:"Renishaw Equator 300",line:"A线 · 尺寸检测工位",area:"A04 尺寸检测工位",type:"尺寸检测设备",deviceType:"inspection",flow:"机械臂送检 → 检测 → 合格／待处理分流",focus:"仅展示三维模型，未接入测量数据",live:!1,result:null,sample:null,visualOnly:!0}),s}function Kx(t){return t.kind==="multi_metric"?Lg.multi_metric:t.label||Lg[t.kind]||t.kind||"监测项"}function RC(){const[t,e]=le.useState(null),[n,i]=le.useState("");async function r(){try{e(await sn("/api/monitor/snapshot")),i("")}catch(o){i(o.message)}}le.useEffect(()=>{r();const o=window.setInterval(r,1e3);return()=>window.clearInterval(o)},[]);async function s(o){try{e(await sn("/api/monitor/control",{method:"POST",body:JSON.stringify({action:o})})),i("")}catch(l){i(l.message)}}async function a(){try{e(await sn("/api/monitor/reset",{method:"POST",body:"{}"})),i("")}catch(o){i(o.message)}}return{snapshot:t,error:n,control:s,resetStats:a}}function CC(t){const[e,n]=le.useState({});return le.useEffect(()=>{if(!t.length)return;const i=Date.now();n(r=>{const s={...r};return t.forEach(a=>{const o=a.sample;if(!o)return;const l=o.metrics||{},c=Na[a.deviceType],p=((c==null?void 0:c.metrics)||[]).slice(0,3).map(([f])=>f).map(f=>({key:f,value:l[f]})).filter(f=>f.value!==null&&f.value!==void 0);p.length&&(s[a.id]=[...s[a.id]||[],{timestamp:i,points:p}].slice(-30))}),s})},[t]),e}function PC(){const[t,e]=le.useState(null),[n,i]=le.useState({state:"unknown"}),[r,s]=le.useState(()=>{if(typeof window>"u")return"monitor";const A=new URLSearchParams(window.location.search).get("view");return["monitor","diagnosis","maintenance","workorder","quality","rag","logs","report"].includes(A)?A:"monitor"}),[a,o]=le.useState(()=>{if(typeof window>"u")return[];const A=Pg(window);return rC(A.primary,A.fallback)}),[l,c]=le.useState(""),[h,p]=le.useState(jp[0].id),[f,g]=le.useState(!1),{snapshot:v,error:E,control:_,resetStats:u}=RC(),m=(v==null?void 0:v.runner)||{},M=le.useMemo(()=>bC(v),[v]),y=CC(M),T=M.find(A=>A.id===h)||M[0],w=(T==null?void 0:T.result)||null,R=(w==null?void 0:w.current_sample)||(T==null?void 0:T.sample)||null;le.useEffect(()=>{if(typeof window<"u"){const A=Pg(window);sC(A.primary,a,A.fallback)}},[a]),le.useEffect(()=>{if(typeof window>"u")return;const A=()=>{const P=new URLSearchParams(window.location.search).get("view");["monitor","diagnosis","maintenance","workorder","quality","rag","logs","report"].includes(P||"")?s(P):P||s("monitor")};return window.addEventListener("popstate",A),()=>window.removeEventListener("popstate",A)},[]),le.useEffect(()=>{if(typeof window>"u")return;const A=new URLSearchParams(window.location.search);r==="monitor"?A.delete("view"):A.set("view",r);const P=A.toString(),L=`${window.location.pathname}${P?`?${P}`:""}${window.location.hash}`;L!==`${window.location.pathname}${window.location.search}${window.location.hash}`&&window.history.replaceState({view:r},"",L)},[r]);function x(A){c(A),window.setTimeout(()=>c(""),2400)}return le.useEffect(()=>{M.length&&!M.some(A=>A.id===h)&&p(M[0].id)},[M,h]),d.jsxs("div",{className:`platform-shell ${f?"big-screen":"workbench"}`,children:[!f&&d.jsx(dC,{activeView:r,onChange:s,hasError:!!(E||m.last_error),connected:!!v}),d.jsxs("main",{className:`app-shell ${!f&&r==="monitor"?"monitor-canvas-shell":f?"":"content-shell"}`,children:[!f&&d.jsx(hC,{actor:t,onActor:e,line:n,onLine:i}),f?d.jsx(NC,{snapshot:v,runner:m,onControl:_,onReset:u,bigScreen:f,onToggleBigScreen:()=>g(A=>!A)}):null,(r==="monitor"||f)&&d.jsx(LC,{machines:M,result:w,sample:R,dataSource:v==null?void 0:v.data_source,metricHistory:y,selectedMachineId:h,onSelectMachine:p}),!f&&r==="diagnosis"&&d.jsx(jC,{snapshot:v,sample:R}),!f&&r==="maintenance"&&d.jsx(qC,{snapshot:v,sample:R}),!f&&r==="workorder"&&(t?d.jsxs(d.Fragment,{children:[d.jsx(pC,{actor:t}),d.jsx(YC,{actor:t,snapshot:v,sample:R,onClosed:()=>{x("工单已关闭"),s("monitor")}},t.user_id)]}):d.jsxs("section",{className:"workorder-queue",children:[d.jsx("h2",{children:"请先登录维修小组账号"}),d.jsx("p",{children:"展开上方“注册 / 登录”。维修人员查看本人工单，监督人查看全部并催办。"})]})),!f&&r==="rag"&&d.jsx(t2,{snapshot:v,sample:R,messages:a,setMessages:o}),!f&&r==="logs"&&d.jsx(XC,{snapshot:v}),!f&&r==="quality"&&d.jsx(n2,{snapshot:v,sample:R}),!f&&r==="report"&&d.jsx($C,{snapshot:v}),l&&d.jsx("div",{className:"toast-message",role:"status",children:l}),(E||m.last_error)&&d.jsx("footer",{className:"error-bar",children:E||m.last_error})]})]})}function NC({snapshot:t,runner:e,onControl:n,onReset:i,bigScreen:r,onToggleBigScreen:s}){var l,c;const a=((l=t==null?void 0:t.device_ids)==null?void 0:l.length)||((c=t==null?void 0:t.devices)==null?void 0:c.length)||(t!=null&&t.device_id?1:0),o=`数据源：${(t==null?void 0:t.data_source)||"设备数据源"} · 接入 ${a||"--"} 台设备 · 在线监测`;return d.jsxs("header",{className:"topbar",children:[d.jsxs("div",{children:[d.jsx("span",{className:"eyebrow",children:"工业运营中台"}),d.jsx("h1",{children:"智能制造统一工作台"}),d.jsx("p",{className:"subline",children:o})]}),d.jsxs("div",{className:"toolbar",children:[d.jsxs("label",{className:"switch-control",title:"开启或暂停自动监测",children:[d.jsx("input",{type:"checkbox",checked:!!e.enabled,onChange:h=>n(h.target.checked?"on":"off")}),d.jsx("span",{className:"switch-track",children:d.jsx("span",{className:"switch-thumb"})}),d.jsx("span",{children:e.enabled?"监测开启":"监测暂停"})]}),d.jsx("button",{className:"button",type:"button",onClick:i,children:"归零统计"}),d.jsx("button",{className:"button primary",type:"button",onClick:s,children:r?"退出大屏":"进入大屏"})]})]})}function LC({machines:t,result:e,sample:n,dataSource:i,metricHistory:r,selectedMachineId:s,onSelectMachine:a}){const o=t.find(p=>p.id===s)||t[0]||jp[0],[l,c]=le.useState(!1),h=p=>{a(p),c(!0)};return d.jsxs("section",{className:"workspace-view active monitor-map-only","aria-label":"车间流水线",children:[d.jsx(DC,{machines:t,selectedMachineId:o.id,result:e,onSelectMachine:h}),l&&d.jsx(kC,{machine:o,result:e,sample:n,dataSource:i,history:r[o.id]||[],onClose:()=>c(!1)})]})}function DC({machines:t,selectedMachineId:e,result:n,onSelectMachine:i}){const[r,s]=le.useState("iso"),a=t.find(l=>l.id===e)||t[0],o=Zr(a,(a==null?void 0:a.result)||n);return d.jsxs("section",{className:"panel workshop-panel",children:[d.jsxs("div",{className:"factory-map","aria-label":"车间设备分布图",children:[d.jsx(UC,{machines:t,selectedMachineId:e,status:o,viewMode:r,onSelect:l=>i(l||(a==null?void 0:a.id))}),d.jsxs("div",{className:"scene-overlay",children:[d.jsxs("div",{children:[d.jsx("span",{className:"eyebrow",children:"车间总览"}),d.jsx("h2",{children:"流水线三维视图"}),d.jsx("p",{className:"scene-click-hint",children:"点击设备模型查看运行数据"})]}),d.jsxs("div",{className:"map-legend","aria-label":"状态图例",children:[d.jsxs("span",{children:[d.jsx("i",{className:"legend-dot normal"}),"正常"]}),d.jsxs("span",{children:[d.jsx("i",{className:"legend-dot warning"}),"预警"]}),d.jsxs("span",{children:[d.jsx("i",{className:"legend-dot fault"}),"故障"]})]}),d.jsx("div",{className:"scene-view-toggle","aria-label":"视角切换",children:[["iso","等轴"],["top","俯视"],["line","产线"]].map(([l,c])=>d.jsx("button",{type:"button",className:r===l?"active":"",onClick:()=>s(l),children:c},l))})]})]}),d.jsx(IC,{machines:t,onSelectMachine:i})]})}function IC({machines:t=[],onSelectMachine:e}){const n=t.filter(r=>r.live),i=n.filter(r=>["fault","alarm","warning"].includes(Zr(r,r.result)));return d.jsxs("section",{className:"device-alert-board","aria-label":"设备状态与预警",children:[d.jsxs("div",{className:"device-alert-heading",children:[d.jsxs("div",{children:[d.jsx("span",{className:"eyebrow",children:"设备监测"}),d.jsx("h2",{children:"设备状态与预警"})]}),d.jsxs("span",{children:[n.length," 台设备 · ",i.length," 项预警"]})]}),d.jsx("div",{className:"device-alert-grid",children:t.map(r=>{var o;const s=Zr(r,r.result),a=((o=r.result)==null?void 0:o.current_sample)||r.sample;return d.jsxs("button",{className:`device-alert-card ${s}`,type:"button",onClick:()=>e(r.id),children:[d.jsxs("span",{className:"device-alert-card-top",children:[d.jsx("i",{className:`legend-dot ${s==="normal"?"normal":s==="idle"?"idle":s}`}),d.jsx("strong",{children:r.name}),d.jsx("em",{children:nu(s)})]}),d.jsx("span",{className:"device-alert-reason",children:Qx(r)}),d.jsx("small",{children:r.live&&(a!=null&&a.timestamp)?`最近采样 ${ei(a.timestamp)}`:"暂无实时采样"})]},r.id)})})]})}function Zr(t,e){return t!=null&&t.live?(e==null?void 0:e.status)==="fault"?"fault":(e==null?void 0:e.status)==="alarm"?"alarm":(e==null?void 0:e.status)==="warning"?"warning":"normal":"idle"}function nu(t){return t==="fault"?"故障":t==="alarm"?"报警":t==="warning"?"预警":t==="idle"?"未接入":"正常"}const Mt=Object.freeze({robot:[5.8,-.15],pickup:[4.7,1.12],inspection:[7.6,1],qualified:[7.65,-1.3],rework:[6.65,-2.1],robotReach:2.22});function UC({machines:t=[],selectedMachineId:e,status:n,viewMode:i,onSelect:r}){const s=le.useRef(null),a=le.useRef(r),o=le.useRef(t),l=le.useRef(e),c=le.useRef(null),h=le.useRef(null),p=le.useRef(null),[f,g]=le.useState(null),v=le.useMemo(()=>t.map(_=>`${_.id}:${_.live?1:0}:${Zr(_,_.result)}`).join("|"),[t]),E=i||"iso";return le.useEffect(()=>{a.current=r},[r]),le.useEffect(()=>{o.current=t},[t]),le.useEffect(()=>{var _;l.current=e,(_=c.current)==null||_.call(c,e)},[e]),le.useEffect(()=>{const _=s.current;if(!_)return;const u=new DE;u.fog=new Ip(15988468,14,52);const m=new Jn(39,_.clientWidth/_.clientHeight,.1,100),M=_.clientWidth<600;M&&(m.fov=55,m.updateProjectionMatrix()),m.position.set(M?13:10.4,M?12:5.7,M?40:13.7),m.lookAt(1.3,.75,0);const y=new sR({antialias:!0,alpha:!0,preserveDrawingBuffer:!0});y.setPixelRatio(Math.min(window.devicePixelRatio,M?1.25:1.5)),y.setSize(_.clientWidth,_.clientHeight),y.shadowMap.enabled=!0,y.shadowMap.type=Do,_.appendChild(y.domElement);const T=new oR(m,y.domElement);T.target.set(1.3,.75,0),T.enableDamping=!0,T.dampingFactor=.08,T.minDistance=6.2,T.maxDistance=M?55:22,T.minPolarAngle=Math.PI*.16,T.maxPolarAngle=Math.PI*.49,T.enablePan=!0,T.panSpeed=.55,T.rotateSpeed=.55,T.zoomSpeed=.72,(z=>{z==="top"?(m.position.set(1.3,M?33:18,.1),T.target.set(1.3,0,-.2),T.enableRotate=!1):z==="line"?(m.position.set(M?7:3.8,M?10:4.5,M?40:17),T.target.set(1.3,.55,.2),T.enableRotate=!0):(m.position.set(M?13:10.4,M?12:5.7,M?40:13.7),T.target.set(1.3,.75,0),T.enableRotate=!0),m.lookAt(T.target),T.update()})(E);const R=new Map(o.current.map(z=>[z.id,z])),x=z=>o.current.find(te=>te.id===z),A=z=>{const te=x(z);return Zr(te,te==null?void 0:te.result)},P=z=>{var te;return Zr(R.get(z),(te=R.get(z))==null?void 0:te.result)},L=z=>Ug(P(z)),B=[],F=[],I=z=>z===l.current,j=z=>{F.forEach(({machineId:te,ring:oe})=>{const Q=A(te),be=["fault","alarm","warning"].includes(Q),ue=Q==="fault"?14760757:Q==="alarm"?13793810:Q==="warning"?14721577:1354354;oe.visible=be||te===z,oe.material.color.setHex(be?ue:1354354),oe.material.emissive.setHex(be?ue:1354354)}),B.forEach(({machineId:te,material:oe,selectedValue:Q,defaultValue:be,property:ue})=>{oe[ue]=te===z?Q:be})};c.current=j;const N=z=>z==="fault"||z==="alarm"||z==="warning",H=z=>{if(z==="EQUATOR300-VISUAL"){const Q=x("RENISHAW-EQUATOR300-001"),be=Zr(Q,Q==null?void 0:Q.result);return{id:z,name:"Renishaw Equator 300",type:"模拟工厂质检工位 · 动画仅示意",status:be,statusLabel:Q?nu(be):"无设备数据"}}const te=x(z);if(!te)return null;const oe=A(z);return{id:z,name:te.name||z,type:te.type||"设备",status:oe,statusLabel:nu(oe)}},V=Ug(n),G=new at({color:14278110,roughness:.63,metalness:.03}),X=new at({color:14147295,roughness:.8,metalness:.04,side:Vn}),ne=new at({color:14262811,roughness:.58,metalness:.04}),ve=new at({color:4214871,roughness:.6,metalness:.18}),Pe=new at({color:6847360,roughness:.4,metalness:.5}),Je=new at({color:6582647,roughness:.72,metalness:.08}),$e=new at({color:2831160,roughness:.75,metalness:.05}),Ke=new at({color:13226451,roughness:.43,metalness:.25}),Z=new at({color:8754073,roughness:.46,metalness:.32}),J=new at({color:2238253,roughness:.7,metalness:.2,transparent:!0,opacity:.86}),Ne=new at({color:12172994,roughness:.55,metalness:.12,transparent:!0,opacity:.68}),We=new at({color:7444124,roughness:.12,metalness:.04,transparent:!0,opacity:.35,side:Vn,depthWrite:!1}),Re=new at({color:V,roughness:.42,metalness:.12,emissive:V,emissiveIntensity:.08}),Ze=new at({color:9805989,roughness:.52,metalness:.28}),Be=new at({color:4805722,roughness:.36,metalness:.45}),et=new at({color:12026410,roughness:.42,metalness:.22,emissive:3810048,emissiveIntensity:.05}),ot=new at({color:13357783,roughness:.32,metalness:.72}),yt=new at({color:4345945,roughness:.28,metalness:.78}),it=new at({color:12831177,roughness:.3,metalness:.82}),Pt=new vx({color:2503224,transparent:!0,opacity:.42}),Bt=new Qc({color:16777215,transparent:!0,opacity:.001,depthWrite:!1}),pn=new a1,Rt=new je,zt=[],k=[],qt=(z,te,oe)=>(z.userData.machineId=te,z.traverse(Q=>{Q.userData.machineId=te}),oe&&zt.push(oe),z),ht=new ze(new za(80,80),G);ht.rotation.x=-Math.PI/2,ht.position.y=-.36,ht.receiveShadow=!1,u.add(ht);const C=(z,te,oe,Q=[0,0,0])=>{const be=new ze(new Ft(...z),oe);return be.position.set(...te),be.rotation.set(...Q),be.castShadow=!oe.transparent&&z[1]>.05,be.receiveShadow=oe!==X&&!oe.transparent,u.add(be),be};C([26,2.6,.08],[0,.92,-7.2],X),C([.08,2.25,12.5],[-12.3,.78,-.6],X),C([.08,2.25,12.5],[12.3,.78,-.6],X),C([24,.08,.12],[0,2.32,-6.95],$e),C([.12,.08,12],[-11.5,2.16,-.8],$e),C([.12,.08,12],[11.5,2.16,-.8],$e);const S=new at({color:7370869,roughness:.78}),W=(z,te,oe)=>{C([z[0]+.035,.017,z[2]+.035],[te[0],-.332,te[2]],S),C([z[0],.019,z[2]],[te[0],-.313,te[2]],oe)};W([6.8,0,.075],[0,0,2],ne),W([6.8,0,.075],[0,0,-1.95],ne),W([.075,0,3.95],[-3.4,0,.02],ne),W([.075,0,3.95],[3.4,0,.02],ne);const Y=new at({color:16053485,roughness:.7});W([17,0,.045],[0,0,2.52],Y),W([17,0,.045],[0,0,3.92],Y);const ie=(z,te,oe=[0,0,0],Q=new D(0,0,1))=>{C(z,te,ve,oe),C([z[0],.035,.08],[te[0]-Q.x*z[2]/2,te[1]+.06,te[2]-Q.z*z[2]/2],Pe,oe),C([z[0],.035,.08],[te[0]+Q.x*z[2]/2,te[1]+.06,te[2]+Q.z*z[2]/2],Pe,oe)},de=[],ge=[],re=new D(0,1,0),ae=(z,te,oe=.52,Q=6)=>{const be=new D(z[0],-.08,z[1]),ue=new D(te[0],-.08,te[1]),Te=new D().subVectors(ue,be),Ve=Te.length(),He=new D().addVectors(be,ue).multiplyScalar(.5),xn=Math.atan2(Te.x,Te.z),st=[0,xn-Math.PI/2,0],ci=Te.clone().normalize(),Or=new D(-ci.z,0,ci.x);ie([Ve,.13,oe],[He.x,He.y,He.z],st,Or);const wt=Math.max(3,Math.round(Ve/.27));for(let Ht=0;Ht<=wt;Ht+=1){const ln=Ht/wt,ji=be.clone().lerp(ue,ln),cn=new ze(new It(.045,.045,oe+.1,16),Be);cn.position.set(ji.x,.03,ji.z),cn.quaternion.setFromUnitVectors(re,Or),u.add(cn),de.push(cn)}for(let Ht=0;Ht<Q;Ht+=1){const ln=new ze(new Ft(.08,.035,oe+.06),Be);ln.userData.offset=Ht/Q,ln.quaternion.setFromAxisAngle(re,xn-Math.PI/2),ln.castShadow=!0,u.add(ln),ge.push({mesh:ln,start:be,end:ue})}};ae([-5.68,2.45],[-5.68,.72],.55,0),ae([2.45,1.12],[4.85,1.12],.55,0),C([1.45,.42,.75],[-6.15,-.08,-6.15],Je),C([1.55,.13,.85],[-6.15,.22,-6.15],$e),C([1.35,.38,.72],[6.05,-.08,-6.15],Je),C([1.45,.12,.82],[6.05,.18,-6.15],$e);const fe=new at({color:5859696,roughness:.46,metalness:.55}),Fe=new at({color:10207172,roughness:.18,transparent:!0,opacity:.24,depthWrite:!1,side:Vn});for(const z of[-3.25,-1.65,-.05,1.55,3.15])C([.065,1.22,.065],[z,.31,-2.25],fe),C([.16,.035,.16],[z,-.32,-2.25],fe);for(let z=0;z<3;z+=1){const te=-2.45+z*1.6;C([1.49,1.06,.018],[te,.32,-2.25],Fe),C([1.54,.04,.06],[te,.89,-2.25],fe),C([1.54,.04,.06],[te,-.25,-2.25],fe)}C([1.49,1.06,.018],[2.35,.32,-2.25],Fe),C([1.52,.045,.07],[2.35,.89,-2.25],fe),C([1.52,.045,.07],[2.35,-.25,-2.25],fe),C([.05,1.14,.07],[1.59,.32,-2.25],fe),C([.05,1.14,.07],[3.11,.32,-2.25],fe);for(const z of[.02,.66])C([.09,.11,.12],[1.59,z,-2.17],Be);C([.035,.25,.09],[2.96,.28,-2.14],Be),C([6.48,.045,.07],[-.05,.94,-2.25],fe);for(const z of[-8.9,8.9]){C([.85,1.65,.62],[z,.5,-6.35],Z),C([.62,.35,.025],[z,.95,-6.35+.33],J),C([.08,.2,.05],[z+.32,.45,-6.35+.34],Be);for(let oe=0;oe<5;oe+=1)C([.48,.014,.015],[z,.15+oe*.055,-6.35+.33],Be);for(const oe of[-.3,.3])C([.1,.08,.1],[z+oe,-.32,-6.35],Be)}for(let z=0;z<10;z+=1){const te=z%2===0?-10.8:10.8,oe=-5.7+Math.floor(z/2)*2.8,Q=new ze(new It(.06,.06,2.6,12),Je);Q.position.set(te,.92,oe),Q.castShadow=!0,u.add(Q)}const xe=(z,te,oe=1.45)=>{const Q=new ze(new tu(oe,.035,8,64),new at({color:1354354,emissive:1354354,emissiveIntensity:.35,transparent:!0,opacity:.9,side:Vn,depthWrite:!1}));return Q.rotation.x=-Math.PI/2,Q.position.set(te[0],-.28,te[2]),Q.visible=!1,u.add(Q),F.push({machineId:z,ring:Q}),Q},pe=(z,te)=>{const oe=new X0(16721189,0,4.8);return oe.position.set(te[0],1.05,te[2]),u.add(oe),k.push({id:z,glow:oe}),oe},Oe=[],ke=(z,te,oe,Q)=>{C([.08,.28,.08],[te,oe-.16,Q],Be);const be=[12071990,15116073,3577727].map((ue,Te)=>{const Ve=new at({color:ue,roughness:.3,emissive:ue,emissiveIntensity:.06}),He=new ze(new It(.083,.083,.09,20),Ve);return He.position.set(te,oe+Te*.095,Q),u.add(He),Ve});Oe.push({id:z,lamps:be})},qe=()=>{const z="LNS-QL-SERVO-80-S2-001",te=L(z),oe=new at({color:te,roughness:.4,metalness:.12,emissive:te,emissiveIntensity:I(z)?.16:.05});B.push({machineId:z,material:oe,property:"emissiveIntensity",selectedValue:.16,defaultValue:.05});const Q=new at({color:15133164,roughness:.56,metalness:.08}),be=new at({color:13620696,roughness:.5,metalness:.12}),ue=new at({color:10402240,roughness:.2,metalness:.04,transparent:!0,opacity:.42,side:Vn}),Te=new wn,Ve=[];Te.position.set(-4.15,.12,.13),Te.rotation.y=0,Te.scale.set(.86,.86,.86),u.add(Te),xe(z,[Te.position.x,Te.position.y,Te.position.z],1.5),pe(z,[Te.position.x,Te.position.y,Te.position.z]),ke(z,-3.9,1.7,.1);const He=(wt,Ht,ln,ji=[0,0,0])=>{const cn=new ze(new Ft(...wt),ln);return cn.position.set(...Ht),cn.rotation.set(...ji),cn.castShadow=!0,cn.receiveShadow=!0,Te.add(cn),cn},xn=(wt,Ht,ln,ji,cn=[0,0,0],Xi=24)=>{const Si=new ze(new It(wt,wt,Ht,Xi),ji);return Si.position.set(...ln),Si.rotation.set(...cn),Si.castShadow=!0,Si.receiveShadow=!0,Te.add(Si),Si},st=(wt,Ht,ln,ji)=>{const cn=new D(...wt),Xi=new D(...Ht),Si=new D().subVectors(Xi,cn),hl=Si.length(),dr=new ze(new It(ln,ln,hl,16),ji);return dr.position.copy(cn.add(Xi).multiplyScalar(.5)),dr.quaternion.setFromUnitVectors(new D(0,1,0),Si.normalize()),dr.castShadow=!0,dr.receiveShadow=!0,Te.add(dr),dr};He([4.3,.08,1.08],[0,.06,0],Be),He([4.05,.08,.1],[0,.18,-.48],J),He([4.05,.08,.1],[0,.18,.48],J),He([.18,.16,.24],[-1.92,.13,-.48],J),He([.18,.16,.24],[-1.92,.13,.48],J),He([.18,.16,.24],[1.92,.13,-.48],J),He([.18,.16,.24],[1.92,.13,.48],J),He([1.05,.78,.82],[-.35,.55,.03],be),He([.86,.52,.06],[-.35,.58,.46],Q),He([.5,.08,.08],[-.35,.9,.5],oe),He([.42,.18,.04],[-.35,.46,.5],J),st([-1.45,.16,-.42],[-.82,.88,-.2],.035,Be),st([1.45,.16,-.42],[.82,.88,-.2],.035,Be),st([-1.45,.16,.42],[-.82,.88,.2],.035,Be),st([1.45,.16,.42],[.82,.88,.2],.035,Be),He([4.1,.24,.72],[0,1.02,0],Q),He([4.28,.14,.84],[0,1.2,0],be),He([.34,.74,.84],[-2,.9,0],be),He([.34,.66,.84],[2,.86,0],be),He([3.75,.08,.64],[0,1.37,-.18],Q,[-.18,0,0]),He([1.05,.055,.34],[-.82,1.45,-.36],ue,[-.18,0,0]),He([1.05,.055,.34],[.82,1.45,-.36],ue,[-.18,0,0]),He([4.08,.08,.12],[0,1.31,.46],J);for(const wt of[-1.5,-.5,.5,1.5])He([.025,.18,.012],[wt,1.08,.435],Be);for(const wt of[-1.55,1.55])He([.18,.62,.55],[wt,-.28,0],be),He([.38,.07,.65],[wt,-.61,0],Be);for(let wt=0;wt<8;wt+=1)He([.016,.14,.012],[-.58+wt*.065,.55,.502],Be);He([.42,.18,.012],[.35,.6,.504],J),He([.22,.045,.014],[.35,.6,.514],oe),He([3.85,.09,.24],[.18,.88,.43],ve),xn(.09,4.25,[.18,.94,.55],ve,[0,0,Math.PI/2],32),xn(.045,4,[.08,1.03,.43],et,[0,0,Math.PI/2],24);const ci=He([.18,.16,.28],[-1.72,1.03,.55],oe);He([1.05,.09,.18],[1.28,1.02,.58],oe),He([.42,.18,.24],[2.1,.96,.55],J),He([3.35,.055,.06],[0,.78,-.35],Be),He([3.35,.055,.06],[0,.78,.35],Be);for(let wt=0;wt<8;wt+=1){const Ht=new ze(new It(.055,.055,.78,18),Be);Ht.position.set(-1.45+wt*.42,.82,0),Ht.rotation.x=Math.PI/2,Ht.castShadow=!0,Te.add(Ht),Ve.push(Ht)}for(let wt=0;wt<4;wt+=1){const Ht=wt<2?-1.82:1.82,ln=wt%2===0?-.55:.55;xn(.09,.08,[Ht,.04,ln],J,[Math.PI/2,0,0],20)}const Or=new ze(new Ft(4.7,1.6,1.3),Bt);return Or.position.set(0,.78,.02),Te.add(Or),qt(Te,z,Or),{feederGroup:Te,feederRollers:Ve,pusher:ci}},O=()=>{const z="ELITE-CS612-ROBOT-001",te=L(z),oe=new at({color:te,roughness:.38,metalness:.16,emissive:te,emissiveIntensity:I(z)?.18:.06});B.push({machineId:z,material:oe,property:"emissiveIntensity",selectedValue:.18,defaultValue:.06});const Q=new at({color:15856629,roughness:.34,metalness:.08}),be=new at({color:13620440,roughness:.24,metalness:.62}),ue=new at({color:1518440,roughness:.28,metalness:.2}),Te=new at({color:2764597,roughness:.42,metalness:.4}),Ve=new wn;Ve.position.set(Mt.robot[0],-.25,Mt.robot[1]),u.add(Ve),xe(z,[Ve.position.x,Ve.position.y,Ve.position.z],.85),pe(z,[Ve.position.x,Ve.position.y,Ve.position.z]),ke(z,Mt.robot[0],1.42,Mt.robot[1]);const He=(kn,Mi,Ei,wi,ui=[0,0,0],sy=40)=>{const Ws=new ze(new It(kn,kn,Mi,sy),wi);return Ws.position.set(...Ei),Ws.rotation.set(...ui),Ws.castShadow=!0,Ws.receiveShadow=!0,Ve.add(Ws),Ws},xn=(kn,Mi,Ei,wi=[0,0,0])=>{const ui=new ze(new Ft(...kn),Ei);return ui.position.set(...Mi),ui.rotation.set(...wi),ui.castShadow=!0,ui.receiveShadow=!0,Ve.add(ui),ui},st=(kn,Mi)=>{const Ei=new wn,wi=new ze(new It(kn,kn,.26,32),Mi);wi.rotation.x=Math.PI/2,wi.castShadow=!0,Ei.add(wi);const ui=new ze(new It(kn*.79,kn*.79,.028,32),ue);return ui.rotation.x=Math.PI/2,ui.position.z=.145,Ei.add(ui),Ei.castShadow=!0,Ve.add(Ei),Ei},ci=(kn,Mi,Ei)=>{const wi=new ze(new It(kn,kn*.94,Mi,24),Ei);return wi.castShadow=!0,Ve.add(wi),wi};He(.45,.08,[0,.05,0],Te),He(.31,.32,[0,.27,0],Q),He(.32,.045,[0,.46,0],ue),xn([.22,.1,.1],[.28,.12,0],Te);const Or=st(.26,Q),wt=st(.23,Q),Ht=st(.17,Q),ln=ci(.145,1.14,be),ji=ci(.12,1.14,be),cn=ci(.175,.05,ue),Xi=new wn;Ve.add(Xi);const Si=new ze(new It(.13,.13,.08,24),Te);Xi.add(Si);const hl=new ze(new Ft(.28,.1,.2),Te);hl.position.y=-.1,Xi.add(hl);const dr=kn=>{const Mi=new ze(new Ft(.055,.26,.05),be);return Mi.position.set(0,-.25,kn),Xi.add(Mi),Mi},iy=dr(.13),ry=dr(-.13),Nu=new ze(new It(.035,.035,.28,12),Te);Nu.rotation.z=Math.PI/2,Nu.position.set(.29,.14,0),Ve.add(Nu);const Lu=new ze(new Ft(2.9,2.2,2.2),Bt);return Lu.position.set(.72,1,0),Ve.add(Lu),qt(Ve,z,Lu),{robotGroup:Ve,shoulderJoint:Or,elbowJoint:wt,wristJoint:Ht,upperLink:ln,foreLink:ji,wristBand:cn,toolCarrier:Xi,fingerA:iy,fingerB:ry}},_e=qe(),ee=O(),me=yR();me.root.position.set(Mt.inspection[0],-.3,Mt.inspection[1]),u.add(me.root),xe("RENISHAW-EQUATOR300-001",[Mt.inspection[0],-.3,Mt.inspection[1]],.95),pe("RENISHAW-EQUATOR300-001",[Mt.inspection[0],-.3,Mt.inspection[1]]);const Se=new ze(new Ft(1.6,1.76,1.6),Bt);Se.position.set(Mt.inspection[0],.56,Mt.inspection[1]),u.add(Se),qt(me.root,"EQUATOR300-VISUAL",Se),Se.userData.machineId="EQUATOR300-VISUAL",ke("RENISHAW-EQUATOR300-001",Mt.inspection[0],1.57,Mt.inspection[1]);const se=new wn;se.position.set(.05,-.1,-.08),se.rotation.y=0,se.scale.set(.82,.82,.82),u.add(se);const ye=(z,te,oe,Q,be=[0,0,0])=>{const ue=new ze(new Ft(...te),Q);ue.name=z,ue.position.set(...oe),ue.rotation.set(...be),ue.castShadow=!0,ue.receiveShadow=!0,se.add(ue);const Te=new WE(new $E(ue.geometry),Pt);return Te.position.copy(ue.position),Te.rotation.copy(ue.rotation),Te.scale.copy(ue.scale),se.add(Te),ue};ye("machine-base",[4.65,.52,1.68],[0,.28,0],J),ye("left-headstock-cabinet",[1.08,1.88,1.66],[-1.78,1.4,0],J),ye("transparent-main-shell",[3.35,1.78,1.58],[-.15,1.4,0],Ke),ye("rear-column",[.45,1.95,1.58],[-2.2,1.44,0],Z);const Ie=new wn;Ie.position.set(-1.62,1.42,.89),se.add(Ie);const pt=(z,te,oe)=>{const Q=new ze(new Ft(...z),oe);return Q.position.set(...te),Ie.add(Q),Q};pt([1.68,1.18,.025],[.9,0,0],We),pt([1.8,.075,.08],[.9,.64,0],Z),pt([1.8,.075,.08],[.9,-.64,0],Z),pt([.075,1.3,.08],[.04,0,0],Z),pt([.075,1.3,.08],[1.76,0,0],Z),pt([.075,.32,.075],[1.65,-.06,.09],Be),ye("right-slanted-cover",[.86,1.56,1.5],[1.32,1.38,.04],Ke,[0,0,-.18]),ye("control-panel",[.45,1.22,.18],[1.98,1.5,.78],J,[0,0,-.24]),ye("top-service-rail",[3.12,.16,1.34],[-.24,2.28,0],J),ye("status-strip",[1.82,.06,.08],[-.42,2.39,.7],Re),ye("chip-conveyor-neck",[1.12,.28,.34],[2.38,1,.22],J,[0,0,.4]),ye("chip-bin",[.7,.58,.7],[3,.76,.22],Ke),ye("front-service-panel",[2.68,.5,.08],[-.36,.58,.86],Ne);for(let z=0;z<9;z+=1)ye("cabinet-vent",[.23,.018,.014],[1.34,1.9-z*.06,.83],Be);for(let z=0;z<6;z+=1)ye("panel-key",[.035,.035,.018],[1.94+z%2*.09,1.95-Math.floor(z/2)*.1,.89],Ne);ye("panel-screen",[.27,.24,.025],[1.97,1.66,.9],We),ye("nameplate",[.46,.12,.02],[-1.8,1.9,.85],Be),ye("left-foot",[.25,.5,.22],[-1.85,-.02,.56],J),ye("right-foot",[.25,.5,.22],[1.55,-.02,.56],J),ye("inner-bed",[2.45,.18,.46],[-.35,1.02,.4],Ze),ye("linear-guide-left",[2.35,.055,.055],[-.32,1.16,.22],Be),ye("linear-guide-right",[2.35,.055,.055],[-.32,1.16,.58],Be),ye("tailstock-shadow",[.42,.44,.5],[.9,1.26,.38],Ze);const nt=new wn;nt.name="spindleChuck",nt.position.set(-1.12,1.36,.78),se.add(nt);const Cn=new ze(new It(.29,.29,.22,48),Be);Cn.rotation.z=Math.PI/2,Cn.castShadow=!0,nt.add(Cn);const Fn=new ze(new It(.22,.22,.04,48),Re);Fn.position.x=.13,Fn.rotation.z=Math.PI/2,nt.add(Fn);for(let z=0;z<3;z+=1){const te=z*(Math.PI*2/3),oe=new ze(new Ft(.16,.06,.24),yt);oe.position.set(.17,Math.cos(te)*.16,Math.sin(te)*.16),oe.rotation.x=te,oe.castShadow=!0,nt.add(oe)}const Ir=new ze(new It(.13,.13,.88,48),ot);Ir.name="machiningWorkpiece",Ir.position.x=.48,Ir.rotation.z=Math.PI/2,Ir.castShadow=!0,nt.add(Ir);const yi=new wn;yi.name="toolSlide",yi.position.set(.32,1.27,.55),se.add(yi);const qa=new ze(new Ft(.56,.34,.42),Ze);qa.castShadow=!0,yi.add(qa);const cr=new ze(new It(.22,.22,.25,8),Be);cr.rotation.x=Math.PI/2,cr.position.set(-.05,.08,.24),cr.castShadow=!0,yi.add(cr);const Bi=new ze(new Fp(.06,.34,4),yt);Bi.name="cutterTip",Bi.position.set(-.33,.08,.24),Bi.rotation.z=Math.PI/2,Bi.rotation.y=Math.PI/4,Bi.castShadow=!0,yi.add(Bi);const ps=new X0(16760922,.9,1.3);ps.name="cuttingGlow",ps.position.set(-.45,.08,.24),yi.add(ps);const zi=new wn;zi.name="loadingArm",zi.position.set(-2.02,1.62,.62),se.add(zi);const Hi=new ze(new Ft(.08,.72,.08),Be);Hi.castShadow=!0,zi.add(Hi);const ms=new ze(new Ft(.08,.08,.38),yt);ms.position.set(.18,-.33,.12),zi.add(ms);const Ya=ms.clone();Ya.position.z=-.12,zi.add(Ya),ke("TRAK-TC820LTYSI-001",-1.35,2.05,-.08),C([1.2,.12,.17],[-1.93,.98,.56],Be),C([1.1,.055,.27],[2.37,.31,1.02],Ze,[0,0,-.16]),C([.09,.14,.28],[2.82,.28,1.02],Be);const Ka=z=>{const te=new wn;te.userData.offset=z,te.name="rawBarStock";const oe=new ze(new It(.11,.11,.66,32),et);oe.rotation.z=Math.PI/2,oe.castShadow=!0,te.add(oe);const Q=new ze(new It(.115,.115,.025,32),J);return Q.position.x=-.35,Q.rotation.z=Math.PI/2,te.add(Q),u.add(te),te},Ur=(z=0,te=ot)=>{const oe=new wn;oe.userData.offset=z,oe.name="screwPart";const Q=new ze(new It(.045,.045,.42,32),te);Q.rotation.z=Math.PI/2,Q.castShadow=!0,oe.add(Q);const be=new ze(new It(.09,.09,.08,32),te);be.position.x=-.23,be.rotation.z=Math.PI/2,be.castShadow=!0,oe.add(be);const ue=new ze(new Ft(.018,.13,.018),J);return ue.position.x=-.275,ue.castShadow=!0,oe.add(ue),u.add(oe),oe},Hs=z=>{const te=Ur(z);te.name="finishedParts";const oe=new ze(new It(.022,.022,.44,24),J);return oe.rotation.z=Math.PI/2,oe.scale.set(1,1,1),te.add(oe),te},Vs=[Ka(0),Ka(.48)],Za=[Hs(.05),Hs(.34),Hs(.68)],ur=Ur(0,ot);ee!=null&&ee.toolCarrier&&(ee.toolCarrier.add(ur),ur.position.set(0,-.35,0),ur.rotation.set(0,0,0),ur.scale.setScalar(.78),ur.visible=!1);const bu=new at({color:5663096,roughness:.6,metalness:.22}),Gs=new D(Mt.qualified[0],-.16,Mt.qualified[1]),Ru=new D(Mt.rework[0],-.16,Mt.rework[1]),Cu=new at({color:10121808,roughness:.68,metalness:.08}),Qa=(z,te,oe)=>{const{x:Q,y:be,z:ue}=z;C([1.05,.12,.82],[Q,be,ue],te);for(const st of[-1,1]){C([.08,.47,.82],[Q+st*.52,be+.25,ue],te),C([.16,.065,.28],[Q+st*.56,be+.51,ue],Be);for(const ci of[-.22,.22])C([.025,.4,.08],[Q+st*.565,be+.25,ue+ci],Be)}for(const st of[-1,1]){C([1.05,.47,.08],[Q,be+.25,ue+st*.41],te);for(const ci of[-.35,.35])C([.045,.4,.025],[Q+ci,be+.25,ue+st*.455],Be)}C([1.15,.065,.07],[Q,be+.51,ue+.41],Be);const Te=document.createElement("canvas");Te.width=256,Te.height=96;const Ve=Te.getContext("2d");Ve.fillStyle="#e4e8e7",Ve.fillRect(0,0,Te.width,Te.height),Ve.fillStyle="#26343b",Ve.font="bold 46px sans-serif",Ve.textAlign="center",Ve.fillText(oe,128,66);const He=new jE(Te),xn=new ze(new za(.5,.18),new at({map:He,roughness:.75}));xn.position.set(Q,be+.26,ue+.457),u.add(xn)};Qa(Gs,bu,"合格品"),Qa(Ru,Cu,"待处理");const b=Array.from({length:9},(z,te)=>{const oe=Ur(te/9,ot);return oe.position.set(Gs.x-.28+te%3*.22,Gs.y+.16+Math.floor(te/3)*.035,Gs.z-.2+Math.floor(te/3)*.18),oe.rotation.set(0,0,0),oe.scale.setScalar(.72),oe}),U=Array.from({length:18},(z,te)=>{const oe=te<3,Q=oe?new Qc({color:16759395}):it,be=new ze(new tu(oe?.01:.033,oe?.004:.008,4,10,Math.PI*1.3),Q);return be.userData.offset=te/18,be.castShadow=!0,se.add(be),be});xe("TRAK-TC820LTYSI-001",[se.position.x,se.position.y,se.position.z],2.05),pe("TRAK-TC820LTYSI-001",[se.position.x,se.position.y,se.position.z]);const K=new ze(new Ft(5.1,2.8,2.3),Bt);K.position.set(.08,1.15,.05),se.add(K),qt(se,"TRAK-TC820LTYSI-001",K);const q=new t1(16777215,12109257,1.4);u.add(q);const $=new $0(16777215,2.3);$.position.set(3,5,4),$.castShadow=!0,u.add($);const Me=new $0(V,.9);Me.position.set(-3,2.5,-2),u.add(Me);const we=new D(0,1.35,.48),he=(z,te)=>new D(z[0]-Mt.robot[0],te,z[1]-Mt.robot[1]),Le=he(Mt.pickup,1.12),Ue=he(Mt.pickup,.7),Qe=new D(.1,1.42,1.12),Xe=he(Mt.inspection,1.13),Ce=he(Mt.inspection,.58),vt=he(Mt.qualified,1.25),Xt=he(Mt.qualified,.95),Ct=he(Mt.rework,1.25),Et=he(Mt.rework,.95),Yt=Za[0],Ae=new D,Lt=new D,ut=new D,On=new D,Yn=z=>{const te=[];let oe=0;for(let Q=0;Q<z.length-1;Q+=1){const be=z[Q],ue=z[Q+1],Te=be.distanceTo(ue);te.push({from:be,to:ue,length:Te}),oe+=Te}return{segments:te,total:oe}},Vi=Yn([new D(-5.68,.08,2.45),new D(-5.68,.08,.72)]),Fr=Yn([new D(2.45,.08,1.12),new D(4.7,.08,1.12)]),xt=(z,te,oe)=>{let Q=Math.max(0,Math.min(1,te))*z.total;for(const ue of z.segments){if(Q<=ue.length)return oe.copy(ue.from).lerp(ue.to,ue.length?Q/ue.length:0);Q-=ue.length}const be=z.segments[z.segments.length-1];return oe.copy(be.to)},St=(z,te,oe)=>Ae.copy(z).lerp(te,oe),li=(z,te,oe,Q)=>(Lt.copy(z).lerp(te,Q),ut.copy(te).lerp(oe,Q),Ae.copy(Lt).lerp(ut,Q)),rt=z=>z*z*(3-2*z),Gi=new D(Mt.pickup[0],.08,Mt.pickup[1]),Wi=new D(0,1,0),gs=new D(0,.7,0),ey=new D(0,1,0),dl=new D,Ja=new D,fl=new D,Jp=(z,te,oe,Q)=>{z.position.copy(te).add(oe).multiplyScalar(.5),z.quaternion.setFromUnitVectors(ey,On.copy(oe).sub(te).normalize()),z.scale.y=te.distanceTo(oe)/Q},ty=z=>{const te=Math.min(2.26,Math.max(.01,Ja.copy(z).sub(gs).length()));Ja.normalize(),fl.copy(Wi).addScaledVector(Ja,-Wi.dot(Ja)).normalize(),fl.lengthSq()<.001&&fl.set(0,0,1);const oe=Math.sqrt(Math.max(0,1.14*1.14-te*te/4));dl.copy(gs).addScaledVector(Ja,te/2).addScaledVector(fl,oe),ee.shoulderJoint.position.copy(gs),ee.elbowJoint.position.copy(dl),ee.wristJoint.position.copy(z),Jp(ee.upperLink,gs,dl,1.14),Jp(ee.foreLink,dl,z,1.14),ee.wristBand.position.copy(z).addScaledVector(Wi,-.12),ee.toolCarrier.position.copy(z)};let em=0;const tm=()=>{em=window.requestAnimationFrame(tm);const z=performance.now()*.001,te=(Math.sin(z*1.05)+1)/2,oe=z*.18%1,Q=z%12/12,be=Q<.38;if(nt.rotation.x=be?z*8.6:0,Ir.rotation.x=0,yi.position.x=be?.22+Math.sin(z*.92)*.22:.48,yi.position.z=be?.48+Math.sin(z*1.45)*.08:.55,cr.rotation.z=be?z*.65:0,ps.intensity=be?.15+te*.2:0,Bi.material.emissive.setHex(5923421),Bi.material.emissiveIntensity=be?.08:0,Ie.position.x=-1.62+(be?0:1.12),zi.rotation.z=Math.sin(z*1.2)*.18,de.forEach(ue=>{ue.rotateY(-.16)}),ge.forEach(ue=>{const Te=(oe+ue.mesh.userData.offset)%1;Lt.copy(ue.start).lerp(ue.end,Te),ue.mesh.position.set(Lt.x,.02,Lt.z)}),_e&&(_e.feederRollers.forEach(ue=>{ue.rotateY(-.18)}),_e.pusher.position.x=-1.72+z*.32%1*3.18),ee){const ue=Math.floor(z/12)%2===1,Te=ue?Ct:vt,Ve=ue?Et:Xt,He=Q>=.25&&Q<.56||Q>=.83&&Q<.96,xn=Q>=.22&&Q<.6||Q>=.78&&Q<.97;let st=we;Q<.1?st=we:Q<.2?st=St(we,Le,rt((Q-.1)/.1)):Q<.25?st=St(Le,Ue,rt((Q-.2)/.05)):Q<.28?st=Ue:Q<.38?st=St(Ue,Le,rt((Q-.28)/.1)):Q<.5?st=li(Le,Qe,Xe,rt((Q-.38)/.12)):Q<.56?st=St(Xe,Ce,rt((Q-.5)/.06)):Q<.6?st=Ce:Q<.66?st=St(Ce,Xe,rt((Q-.6)/.06)):Q<.72?st=Xe:Q<.78?st=St(Xe,Ce,rt((Q-.72)/.06)):Q<.83?st=Ce:Q<.87?st=St(Ce,Xe,rt((Q-.83)/.04)):Q<.93?st=li(Xe,we,Te,rt((Q-.87)/.06)):Q<.96?st=St(Te,Ve,rt((Q-.93)/.03)):Q<.975?st=Ve:st=li(Ve,Te,we,rt((Q-.975)/.025)),ty(st),ee.fingerA.position.z=xn?.07:.14,ee.fingerB.position.z=xn?-.07:-.14,ur.visible=He}Vs.forEach(ue=>{const Te=(z*.2+ue.userData.offset)%1,Ve=Te>.78?.78+(Te-.78)*.18:Te;xt(Vi,Ve,Lt),ue.position.copy(Lt),ue.rotation.x=z*2.5}),Yt&&(Q<.25?(Yt.visible=!0,Yt.position.copy(Gi)):Yt.visible=!1),me.workpiece.visible=Q>=.56&&Q<.83,Za.slice(1).forEach(ue=>{const Te=(z*.17+ue.userData.offset)%1,Ve=Te>.86?.86+(Te-.86)*.18:Te;xt(Fr,Ve,Lt),ue.position.copy(Lt),ue.rotation.x=z*2.6,ue.rotation.y=Math.sin(z*1.6+ue.userData.offset)*.08}),b.forEach((ue,Te)=>{ue.visible=Te<3+Math.floor(z/12)%7}),U.forEach(ue=>{const Te=(z*1.4+ue.userData.offset)%1;ue.position.set(-.18+Te*.7,1.35-Te*.45+Math.sin(Te*Math.PI*4)*.035,.8+Te*.28),ue.rotation.set(z*4+Te,z*2.3,Te*6),ue.visible=be}),k.forEach(ue=>{const Te=N(A(ue.id)),Ve=.35+Math.abs(Math.sin(z*4.6))*.65;ue.glow.intensity=Te?2.2+Ve*2.4:0}),Oe.forEach(({id:ue,lamps:Te})=>{const Ve=A(ue),He=Ve==="idle"?-1:Ve==="fault"||Ve==="alarm"?0:Ve==="warning"?1:2;Te.forEach((xn,st)=>{xn.emissiveIntensity=st===He?He===0?.8+Math.abs(Math.sin(z*5))*1.3:.9:.04})}),T.update(),y.render(u,m)};j(l.current),tm();const ny=()=>{!_.clientWidth||!_.clientHeight||(m.aspect=_.clientWidth/_.clientHeight,m.updateProjectionMatrix(),y.setSize(_.clientWidth,_.clientHeight))},nm=new ResizeObserver(ny);nm.observe(_);const Pu=()=>{h.current&&(window.clearTimeout(h.current),h.current=null),p.current=null,g(null)},im=z=>{var Q,be,ue;const te=y.domElement.getBoundingClientRect();return Rt.x=(z.clientX-te.left)/te.width*2-1,Rt.y=-((z.clientY-te.top)/te.height)*2+1,pn.setFromCamera(Rt,m),((ue=(be=(Q=pn.intersectObjects(zt,!1)[0])==null?void 0:Q.object)==null?void 0:be.userData)==null?void 0:ue.machineId)||null},rm=z=>{const te=im(z);if(!te){Pu();return}const oe={x:Math.min(Math.max(z.offsetX+14,14),Math.max(_.clientWidth-250,14)),y:Math.min(Math.max(z.offsetY+14,14),Math.max(_.clientHeight-112,14))};if(p.current===te){g(Q=>Q&&{...Q,...oe});return}h.current&&window.clearTimeout(h.current),p.current=te,g(null),h.current=window.setTimeout(()=>{const Q=H(te);!Q||p.current!==te||g({...Q,...oe})},2e3)},sm=()=>Pu(),am=z=>{const te=im(z)||p.current;te==="EQUATOR300-VISUAL"?x("RENISHAW-EQUATOR300-001")&&a.current("RENISHAW-EQUATOR300-001"):te&&a.current(te)};return y.domElement.addEventListener("pointermove",rm),y.domElement.addEventListener("pointerleave",sm),y.domElement.addEventListener("click",am),()=>{c.current=null,window.cancelAnimationFrame(em),nm.disconnect(),Pu(),y.domElement.removeEventListener("pointermove",rm),y.domElement.removeEventListener("pointerleave",sm),y.domElement.removeEventListener("click",am),y.domElement.parentNode===_&&_.removeChild(y.domElement),u.traverse(z=>{z.geometry&&z.geometry.dispose(),z.material&&(Array.isArray(z.material)?z.material.forEach(te=>te.dispose()):(z.material.map&&z.material.map.dispose(),z.material.dispose()))}),T.dispose(),y.dispose(),y.forceContextLoss()}},[v,E]),d.jsx("div",{ref:s,className:"machine-3d-canvas","aria-hidden":"true",children:f?d.jsxs("div",{className:`scene-hover-label ${f.status}`,style:{left:f.x,top:f.y},children:[d.jsx("strong",{children:f.name}),d.jsx("span",{children:f.type}),d.jsx("em",{children:f.statusLabel})]}):null})}function Ug(t){return t==="fault"?12007218:t==="alarm"||t==="warning"?11954688:t==="idle"?8227987:556917}function FC({machine:t,history:e}){var s,a;const n=(((s=Na[t==null?void 0:t.deviceType])==null?void 0:s.metrics)||[]).slice(0,3),i=((a=e[e.length-1])==null?void 0:a.points)||[],r=n.map(([o,l,,c],h)=>{const p=e.map(f=>{var g;return(g=f.points.find(v=>v.key===o))==null?void 0:g.value}).filter(f=>f!==void 0);return{key:o,name:l,unit:c,values:p,color:["#087f75","#235a8f","#b66a00"][h]}}).filter(o=>o.values.length);return d.jsxs("section",{className:"panel trend-panel",children:[d.jsxs("div",{className:"panel-heading",children:[d.jsxs("div",{children:[d.jsx("span",{className:"eyebrow",children:"实时趋势"}),d.jsx("h2",{children:"关键指标最近 30 秒"})]}),d.jsx("span",{className:"muted",children:e.length?`${e.length} 个采样点`:"等待采样"})]}),d.jsxs("div",{className:"trend-grid",children:[r.map(o=>d.jsx(OC,{item:o},o.key)),!r.length&&d.jsx("div",{className:"empty-state",children:"等待实时采样后生成趋势曲线"})]}),d.jsx("div",{className:"trend-latest",children:i.map(o=>{const l=n.find(([c])=>c===o.key);return d.jsxs("span",{children:[(l==null?void 0:l[1])||o.key,"：",Xp(o.value)," ",(l==null?void 0:l[3])||""]},o.key)})})]})}function OC({item:t}){const i=Math.min(...t.values),s=Math.max(...t.values)-i||1,a=t.values.map((l,c)=>{const h=t.values.length===1?220:c/(t.values.length-1)*220,p=72-(Number(l)-i)/s*60-6;return`${h.toFixed(1)},${p.toFixed(1)}`}).join(" "),o=t.values[t.values.length-1];return d.jsxs("div",{className:"mini-trend",children:[d.jsxs("div",{children:[d.jsx("span",{children:t.name}),d.jsxs("strong",{children:[Xp(o)," ",t.unit]})]}),d.jsx("svg",{viewBox:"0 0 220 72",role:"img","aria-label":`${t.name}趋势`,children:d.jsx("polyline",{points:a,fill:"none",stroke:t.color,strokeWidth:"3",strokeLinecap:"round",strokeLinejoin:"round"})})]})}function kC({machine:t,result:e,sample:n,dataSource:i,history:r,onClose:s}){const a=Zr(t,e);return le.useEffect(()=>{const o=l=>{l.key==="Escape"&&s()};return window.addEventListener("keydown",o),()=>window.removeEventListener("keydown",o)},[s]),d.jsx("div",{className:"drawer-backdrop",role:"presentation",onClick:s,children:d.jsxs("aside",{className:"machine-drawer",role:"dialog","aria-modal":"true","aria-label":`${t.name}设备详情`,onClick:o=>o.stopPropagation(),children:[d.jsxs("div",{className:"drawer-heading",children:[d.jsxs("div",{children:[d.jsx("span",{className:"eyebrow",children:t.area||t.line}),d.jsx("h2",{children:t.name}),d.jsxs("p",{children:[t.type," · ",t.id]}),t.live&&d.jsxs("p",{children:["数据源：",i||"监控服务",String(i||"").includes("模拟")?"（非实体测量）":""]})]}),d.jsx("button",{className:"button",type:"button",onClick:s,"aria-label":"关闭设备详情",children:"关闭"})]}),d.jsxs("div",{className:"drawer-status",children:[d.jsxs("div",{children:[d.jsx("span",{children:"状态"}),d.jsx("strong",{className:a,children:nu(a)})]}),d.jsxs("div",{children:[d.jsx("span",{children:"健康度"}),d.jsx("strong",{children:t.live?oC(n):"--"})]}),d.jsxs("div",{children:[d.jsx("span",{children:"当前报警"}),d.jsx("strong",{children:t.live?AC(n):"--"})]})]}),d.jsxs("div",{className:"drawer-section",children:[d.jsx("span",{className:"eyebrow",children:"工位与数据"}),d.jsx("p",{children:t.flow||"设备工艺信息暂未提供"}),t.live&&n&&d.jsxs("p",{children:["最近采样：",ei(n.timestamp)," · 运行阶段：",TC(n)]})]}),t.live?n?d.jsxs(d.Fragment,{children:[d.jsx(BC,{result:e,sample:n,machine:t}),d.jsx(GC,{result:e,sample:n}),d.jsx(FC,{machine:t,history:r})]}):d.jsxs("div",{className:"drawer-no-data",children:[d.jsx("strong",{children:"等待设备采样"}),d.jsx("p",{children:"接入正常后，实时指标与监测判定会显示在这里。"})]}):d.jsxs("div",{className:"drawer-no-data",children:[d.jsx("strong",{children:"该工位尚未接入实时采集"}),d.jsx("p",{children:"三维模型可查看；健康度、测量值和报警状态暂不提供。"})]})]})})}function BC({result:t,sample:e,machine:n}){var o,l;const[i,r]=le.useState(!1),s=le.useMemo(()=>zC(t,e,n),[t,e,n]),a=i?s:s.slice(0,12);return d.jsxs("section",{className:"panel metrics-panel",children:[d.jsxs("div",{className:"panel-heading",children:[d.jsxs("div",{children:[d.jsx("span",{className:"eyebrow",children:"实时快照"}),d.jsx("h2",{children:"实时指标"})]}),d.jsxs("div",{className:"panel-actions",children:[d.jsx("span",{className:"muted",children:e?`最近采样 ${ei(e.timestamp)}`:"等待采样"}),s.length>12&&d.jsx("button",{className:"link-button",type:"button",onClick:()=>r(c=>!c),children:i?"收起重点":`显示全部 ${s.length} 项`})]})]}),d.jsx("div",{className:"metrics-grid",children:a.map(c=>d.jsx(HC,{item:c,result:t},c.key))}),(n==null?void 0:n.deviceType)==="turning_center"&&(e==null?void 0:e.vibration)==null&&((o=e==null?void 0:e.metrics)==null?void 0:o.spindle_vibration_mm_s)==null&&((l=e==null?void 0:e.metrics)==null?void 0:l.spindle_vibration_rms)==null&&d.jsx("div",{className:"notice",children:"当前车削中心数据源没有提供振动字段，振动不会被其他指标替代；其他设备指标仍会继续监测。"}),d.jsxs("div",{className:"subsection-heading",children:[d.jsx("span",{className:"eyebrow",children:"设备联锁与执行部件"}),d.jsx("strong",{children:"整机状态"})]}),d.jsx(VC,{sample:e})]})}function zC(t,e,n){const i=(e==null?void 0:e.metrics)||{},r=(e==null?void 0:e.metric_details)||{},s=Na[n==null?void 0:n.deviceType],a=new Set,o=((s==null?void 0:s.metrics)||[]).filter(([p])=>i[p]!==null&&i[p]!==void 0||r[p]).map(([p,f,g,v])=>{const E=r[p]||{};return a.add(p),{key:p,name:E.label||f,group:E.group||g,value:i[p],unit:E.unit||v,normalRange:E.normal_range}}),l=Object.entries(r).filter(([p])=>!a.has(p)).map(([p,f])=>(a.add(p),{key:p,name:f.label||p,group:f.group||"整机",value:i[p],unit:f.unit||"",normalRange:f.normal_range})),c=Object.entries(i).filter(([p])=>!a.has(p)).map(([p,f])=>({key:p,name:p,group:"实时数据",value:f,unit:""})),h=[...o,...l,...c];return h.length?h:[{key:"temperature",name:"温度",group:"主轴",value:e==null?void 0:e.temperature,unit:"°C"},{key:"vibration",name:"振动",group:"主轴",value:e==null?void 0:e.vibration,unit:"mm/s"},{key:"rpm",name:"转速",group:"主轴",value:e==null?void 0:e.rpm,unit:"rpm"}]}function Xp(t){if(t==null)return"未提供";const e=Number(t);return Number.isFinite(e)?Math.abs(e)>=100?e.toFixed(0):Number.isInteger(e)?String(e):e.toFixed(1):String(t)}function HC({item:t,result:e}){var a;const n=(a=e==null?void 0:e.observations)==null?void 0:a.find(o=>o.key===`metric:${t.key}`||o.key===t.key||t.key==="spindle_temperature_c"&&o.key==="temperature"||t.key==="spindle_vibration_rms"&&o.key==="vibration"),i=Yx(n==null?void 0:n.alert_level),r=Xp(t.value),s=t.normalRange?`正常 ${t.normalRange[0]} - ${t.normalRange[1]}`:"";return d.jsxs("div",{className:`metric ${i}`,children:[d.jsx("span",{className:"metric-group",children:t.group}),d.jsx("span",{className:"metric-name",children:t.name}),d.jsx("strong",{className:"metric-value",children:r}),d.jsxs("span",{className:"metric-unit",children:[t.unit," ",s]})]})}function VC({sample:t}){const e=Object.values((t==null?void 0:t.equipment_states)||{});return e.length?d.jsx("div",{className:"equipment-grid",children:e.map((n,i)=>d.jsxs("div",{className:`equipment-state ${n.is_normal?"normal":"fault"}`,children:[d.jsx("span",{children:n.label||"设备状态"}),d.jsx("strong",{children:Lr(EC,n.value)})]},`${n.label||"state"}-${i}`))}):d.jsx("div",{className:"equipment-grid",children:d.jsx("div",{className:"empty-state",children:"当前接口没有提供离散设备状态"})})}function GC({result:t,sample:e}){const n=(t==null?void 0:t.status)||"normal",i=(t==null?void 0:t.observations)||[];return d.jsxs("section",{className:"panel decision-panel",children:[d.jsxs("div",{className:"panel-heading",children:[d.jsxs("div",{children:[d.jsx("span",{className:"eyebrow",children:"监测判定"}),d.jsx("h2",{children:"规则引擎"})]}),d.jsx("span",{className:`severity-pill ${Ig(n)}`,children:Lr(xC,n)})]}),d.jsxs("div",{className:`decision-reason ${Ig(n)}`,children:[d.jsx("span",{children:"故障 / 预警原因"}),d.jsx("strong",{children:Qx({result:t,sample:e})})]}),d.jsx(WC,{observations:i}),d.jsxs("div",{className:"threshold-note",children:[d.jsx("span",{children:"触发条件"}),d.jsx("strong",{children:"关键故障立即触发；普通指标阈值+5秒；间歇故障5分钟内3次；趋势/联合异常"})]})]})}function WC({observations:t}){return t.length?d.jsx("div",{className:"observation-list",children:t.map((e,n)=>{const i=Yx(e.alert_level);return d.jsxs("div",{className:"observation",children:[d.jsx("span",{className:`observation-dot ${i}`}),d.jsxs("div",{children:[d.jsxs("div",{className:"observation-title",children:[Lr(vC,e.rule_type)," · ",Kx(e),"：",e.value]}),d.jsxs("div",{className:"observation-meta",children:[e.message," · 阈值 ",e.threshold??"-"," ",e.unit||""]})]}),d.jsx("span",{className:"observation-level",children:Lr(yC,e.alert_level)})]},`${e.key||e.kind}-${n}`)})}):d.jsx("div",{className:"observation-list",children:d.jsx("div",{className:"empty-state",children:"当前没有检测到异常"})})}function Zx({snapshot:t}){var e;return((e=t==null?void 0:t.diagnosis)==null?void 0:e.pipeline)||{}}function jC({snapshot:t,sample:e}){const n=BR(t,e),i=Zx({snapshot:t}),r=i.runtime_result||{},s=n.status==="completed"?"已完成":n.status==="waiting"?"等待诊断":n.status,a=n.confidence==null?"--":`${Math.round(n.confidence*100)}%`,o=(e==null?void 0:e.alarm_label)||(e==null?void 0:e.alarm_code)||"当前无活动报警";return d.jsxs("section",{className:"workspace-view active module-board diagnosis-workspace","aria-label":"智能诊断",children:[d.jsx($a,{eyebrow:"Runtime Diagnosis",title:"智能诊断",text:"基于实时事件、知识证据和工程数据生成可追溯的诊断结论。"}),d.jsxs("div",{className:"module-grid",children:[d.jsx(Di,{label:"诊断状态",value:s,text:n.deviceId||"等待设备"}),d.jsx(Di,{label:"置信度",value:a,text:"Evaluator 评估结果"}),d.jsx(Di,{label:"当前报警",value:o,text:r.stop_reason||i.stop_reason||"持续监测中"})]}),d.jsxs("div",{className:"answer-grid diagnosis-content-grid",children:[d.jsxs("section",{className:"panel module-panel",children:[d.jsx("div",{className:"panel-heading",children:d.jsxs("div",{children:[d.jsx("span",{className:"eyebrow",children:"诊断结论"}),d.jsx("h2",{children:"当前判断"})]})}),d.jsx(ii,{value:n.summary,className:"diagnosis-summary"}),n.cause&&d.jsxs("div",{className:"diagnosis-recommendation",children:[d.jsx("span",{className:"section-kicker",children:"根因判断"}),d.jsx(ii,{value:n.cause})]}),n.recommendation&&d.jsxs("div",{className:"diagnosis-recommendation",children:[d.jsx("span",{className:"section-kicker",children:"处置建议"}),d.jsx(ii,{value:n.recommendation})]}),n.nextAction&&d.jsxs("div",{className:"diagnosis-recommendation",children:[d.jsx("span",{className:"section-kicker",children:"下一步"}),d.jsx(ii,{value:n.nextAction})]})]}),d.jsxs("section",{className:"panel module-panel",children:[d.jsxs("div",{className:"panel-heading",children:[d.jsxs("div",{children:[d.jsx("span",{className:"eyebrow",children:"Evidence"}),d.jsx("h2",{children:"诊断依据"})]}),d.jsxs("span",{className:"step-count",children:[n.evidence.length," 条"]})]}),n.evidence.length?d.jsx($p,{steps:n.evidence}):d.jsx("div",{className:"empty-state",children:"等待 Runtime 收集证据"})]})]})]})}function Qx(t){const e=t==null?void 0:t.result,n=(e==null?void 0:e.current_sample)||(t==null?void 0:t.sample),i=Array.isArray(e==null?void 0:e.observations)?e.observations:[],r=lC(n);return r||(i.length?i.slice(0,3).map(s=>`${s.label||Kx(s)}：${s.message||"检测值异常"}`).join("；"):n!=null&&n.alarm_code?`${n.alarm_label||"设备报警"}（报警 ${n.alarm_code}）`:(e==null?void 0:e.status)==="fault"?"设备当前状态不可运行":(t==null?void 0:t.live)===!1||!(t!=null&&t.live)&&!n&&!e?"未接入实时采集，无法判断故障原因":"当前未检测到异常")}function Rh(t,e,n){var o,l,c,h,p;const i=String((e==null?void 0:e.device_id)||(n==null?void 0:n.device_id)||"").trim(),r=String((e==null?void 0:e.alarm_code)||((l=(o=n==null?void 0:n.latest_result)==null?void 0:o.current_sample)==null?void 0:l.alarm_code)||((h=(c=n==null?void 0:n.diagnosis)==null?void 0:c.latest)==null?void 0:h.alarm_code)||"").trim(),s=t.find(f=>String(f.device_id||"")===i&&r&&String(f.alarm_code||"")===r),a=t.find(f=>String(f.device_id||"")===i);return r?(s==null?void 0:s.workorder_id)||"":(a==null?void 0:a.workorder_id)||((p=t[0])==null?void 0:p.workorder_id)||""}function XC({snapshot:t}){const[e,n]=le.useState([]),[i,r]=le.useState([]),[s,a]=le.useState([]),[o,l]=le.useState("all"),[c,h]=le.useState(""),[p,f]=le.useState(""),[g,v]=le.useState(!1),[E,_]=le.useState(!1),[u,m]=le.useState(""),M=le.useRef(t);le.useEffect(()=>{M.current=t},[t]);async function y(){var N,H,V;v(!0);try{const G=await sn("/api/runs?limit=5000"),X=GR(G);n(X),h(ve=>{var Pe;return ve&&X.some(Je=>Je.run_id===ve)?ve:((Pe=X[0])==null?void 0:Pe.run_id)||""});const ne=await sn("/api/trace?limit=5000&summary=true");r(zd(ne)),m("")}catch(G){const X=zd((V=(H=(N=M.current)==null?void 0:N.diagnosis)==null?void 0:H.pipeline)==null?void 0:V.trace);n([]),r(X),a(X),m(G.message||"日志服务暂不可用")}finally{v(!1)}}async function T(N,H=null){const V=Array.isArray(H==null?void 0:H.trace_ids)&&H.trace_ids.length?H.trace_ids:[N];if(V.some(G=>G&&!String(G).startsWith("event-"))){_(!0);try{const G=await Promise.all(V.filter(X=>X&&!String(X).startsWith("event-")).map(X=>sn(`/api/trace?trace_id=${encodeURIComponent(X)}&limit=5000`)));a(G.flatMap(X=>zd(X))),m("")}catch(G){m(G.message||"完整日志读取失败")}finally{_(!1)}}}le.useEffect(()=>{y();const N=window.setInterval(y,5e3);return()=>window.clearInterval(N)},[]);const w=e.find(N=>N.run_id===c)||null,R=(Array.isArray(w==null?void 0:w.trace_ids)?w.trace_ids.join("|"):w==null?void 0:w.trace_id)||"",x=(w==null?void 0:w.event_count)||0;le.useEffect(()=>{const N=(w==null?void 0:w.trace_id)||"";f(N),N&&T(N,w)},[c,R,x]);const A=s.filter(N=>w&&!jR(w,N)?!1:o==="all"?!0:o==="error"?!!N.error||/error|failed|timeout/i.test(String(N.event||"")):String(N.type||"").toLowerCase()===o).slice().reverse(),P=e.length,L=e.filter(N=>N.run_type==="quality").length,B=s.filter(N=>N.type==="tool"||N.tool_name||N.tool).length,F=s.filter(N=>!!N.error||/error|failed|timeout/i.test(String(N.event||""))).length,I=le.useMemo(()=>tC(s),[s]),j=N=>({completed:"已完成",running:"进行中",error:"异常",pending:"待执行"})[N]||N||"待执行";return d.jsxs("section",{className:"workspace-view active module-board logs-workspace","aria-label":"日志系统",children:[d.jsx($a,{eyebrow:"Runtime Logs",title:"日志系统",text:"一次完整故障闭环只形成一条运行记录：监控 → 诊断 → 维修方案 → 工单派发 → 报告中心 → 经验总结；质检始终独立成单。",action:d.jsx("button",{className:"button",type:"button",onClick:y,disabled:g,children:g?"刷新中…":"刷新运行记录"})}),u&&d.jsxs("div",{className:"workspace-notice logs-notice",role:"status",children:["日志接口暂不可用，当前显示快照中的最近记录：",u]}),d.jsxs("div",{className:"module-grid logs-stat-grid",children:[d.jsx(Di,{label:"事件总数",value:s.length,text:"Trace Recorder 保留记录"}),d.jsx(Di,{label:"运行记录",value:P,text:"故障闭环、RAG 问答与质检"}),d.jsx(Di,{label:"独立质检",value:L,text:"不会并入故障闭环"}),d.jsx(Di,{label:"工具调用",value:B,text:"含输入参数与返回体"}),d.jsx(Di,{label:"异常事件",value:F,text:F?"需要进一步检查":"当前没有错误记录"})]}),d.jsxs("section",{className:"panel module-panel logs-panel logs-runs-panel","aria-label":"运行记录",children:[d.jsxs("div",{className:"panel-heading logs-panel-heading",children:[d.jsxs("div",{children:[d.jsx("span",{className:"eyebrow",children:"Lifecycle Runs"}),d.jsx("h2",{children:"运行记录"})]}),d.jsx("span",{className:"logs-run-hint",children:"故障从监控开始，到报告与经验总结结束"})]}),e.length?d.jsx("div",{className:"logs-runs-list",children:e.map(N=>d.jsxs("button",{type:"button",className:`logs-run-card ${c===N.run_id?"is-selected":""}`,onClick:()=>h(N.run_id),children:[d.jsxs("div",{className:"logs-run-card-head",children:[d.jsx("strong",{children:N.label||(N.run_type==="quality"?"质检运行":"运行记录")}),d.jsx("span",{className:`logs-run-status logs-run-${N.status}`,children:j(N.status)})]}),d.jsxs("div",{className:"logs-run-card-title",children:[N.device_id?kx(N.device_id,{snapshot:t}):"未绑定设备",N.alarm_code?` · 报警 ${N.alarm_code}`:""]}),d.jsxs("div",{className:"logs-run-card-meta",children:[d.jsx("span",{children:N.started_at?ei(N.started_at):"--"}),d.jsxs("span",{children:[N.event_count||0," 个事件"]}),d.jsxs("span",{children:[N.error_count||0," 个异常"]})]}),d.jsx("div",{className:"logs-run-phases",children:(N.phases||[]).map(H=>d.jsxs("span",{className:`logs-phase logs-phase-${H.status}`,children:[d.jsx("i",{}),H.label," · ",j(H.status)]},H.id))}),d.jsx("div",{className:"logs-run-id",children:N.run_id})]},N.run_id))}):d.jsx("div",{className:"empty-state logs-empty",children:"暂无运行记录；监控确认故障或执行质检后，这里会生成生命周期记录。"})]}),d.jsxs("section",{className:"panel module-panel logs-panel","aria-label":"执行日志",children:[d.jsxs("div",{className:"panel-heading logs-panel-heading",children:[d.jsxs("div",{children:[d.jsx("span",{className:"eyebrow",children:"Execution Timeline"}),d.jsx("h2",{children:"执行明细"})]}),d.jsxs("div",{className:"logs-filter","aria-label":"日志筛选",children:[d.jsxs("select",{className:"select-input logs-trace-select",value:c,onChange:N=>h(N.target.value),"aria-label":"按运行记录筛选",children:[d.jsx("option",{value:"",children:"选择运行记录"}),e.map(N=>d.jsxs("option",{value:N.run_id,children:[N.label||"运行记录"," · ",N.run_id]},N.run_id))]}),[["all","全部"],["agent","Agent"],["tool","工具"],["runtime","运行时"],["error","异常"]].map(([N,H])=>d.jsx("button",{type:"button",className:`logs-filter-button ${o===N?"is-active":""}`,onClick:()=>l(N),children:H},N))]})]}),!E&&d.jsxs("section",{className:"agent-invocations","aria-label":"Agent调用明细",children:[d.jsxs("div",{className:"agent-invocations-heading",children:[d.jsxs("div",{children:[d.jsx("span",{className:"eyebrow",children:"Agent Invocation I/O"}),d.jsx("h3",{children:"Agent 调用明细"})]}),d.jsx("span",{className:"logs-run-hint",children:"每次调用独立编号，完整展示输入 → 上下文 → 工具 → 输出"})]}),I.length?d.jsx("div",{className:"agent-invocation-list",children:I.map(N=>d.jsxs("article",{className:`agent-invocation-card agent-invocation-${N.status==="异常"?"error":N.status==="执行中"?"running":"done"}`,children:[d.jsxs("div",{className:"agent-invocation-head",children:[d.jsxs("div",{children:[d.jsxs("span",{className:"agent-invocation-kicker",children:["第 ",N.invocation_no," 次 Agent 调用"]}),d.jsx("h4",{children:N.agent})]}),d.jsx("span",{className:"log-event-status",children:N.status})]}),d.jsxs("div",{className:"agent-invocation-meta",children:[d.jsxs("span",{children:["agent_run_id：",N.agent_run_id]}),d.jsxs("span",{children:["Trace：",N.trace_id||"--"]}),d.jsxs("span",{children:["Task：",N.task_id||"--"]}),d.jsxs("span",{children:["开始：",N.started_at?ei(N.started_at):"--"]}),d.jsxs("span",{children:["结束：",N.ended_at?ei(N.ended_at):"--"]}),d.jsxs("span",{children:["耗时：",N.duration]}),d.jsxs("span",{children:["事件：",N.event_count]})]}),N.error&&d.jsxs("div",{className:"log-event-error agent-invocation-error-text",children:["错误：",N.error]}),d.jsxs("div",{className:"agent-io-stack",children:[d.jsxs("section",{className:"agent-io-block",children:[d.jsx("h5",{children:"输入（Input）"}),d.jsx("pre",{className:"log-json",children:er(N.input)})]}),d.jsxs("section",{className:"agent-io-block",children:[d.jsx("h5",{children:"上下文（Context）"}),d.jsx("pre",{className:"log-json",children:er(N.context)})]}),d.jsxs("section",{className:"agent-io-block agent-tool-chain",children:[d.jsxs("h5",{children:["工具调用链（Tool Calls） · ",N.tool_calls.length," 次"]}),N.tool_calls.length?d.jsx("div",{className:"agent-tool-list",children:N.tool_calls.map(H=>d.jsxs("section",{className:"agent-tool-call",children:[d.jsxs("div",{className:"agent-tool-head",children:[d.jsxs("strong",{children:["#",H.call_no," ",H.tool_name]}),d.jsxs("span",{children:[H.status,H.mcp_server?` · MCP ${H.mcp_server}`:""," · ",H.duration]})]}),d.jsxs("div",{className:"agent-tool-meta",children:[d.jsxs("span",{children:["开始：",H.started_at?ei(H.started_at):"--"]}),d.jsxs("span",{children:["结束：",H.ended_at?ei(H.ended_at):"--"]}),d.jsxs("span",{children:["事件：",H.event_count]})]}),d.jsxs("div",{className:"agent-tool-io",children:[d.jsxs("div",{children:[d.jsx("h6",{children:"工具输入"}),d.jsx("pre",{className:"log-json",children:er(H.input)})]}),d.jsxs("div",{children:[d.jsx("h6",{children:"工具输出"}),d.jsx("pre",{className:"log-json",children:er(H.output)})]})]}),H.error&&d.jsxs("div",{className:"log-event-error",children:["错误：",H.error]})]},`${N.id}-${H.call_no}-${H.tool_name}`))}):d.jsx("div",{className:"agent-io-empty",children:"本次 Agent 没有记录工具调用。"})]}),d.jsxs("section",{className:"agent-io-block",children:[d.jsx("h5",{children:"输出（Output）"}),d.jsx("pre",{className:"log-json",children:er(N.output)})]})]})]},N.id))}):d.jsx("div",{className:"empty-state logs-empty",children:"当前运行记录没有 Agent 生命周期事件；请刷新或先执行一次监控→诊断→维修方案→工单闭环。"})]}),d.jsxs("div",{className:"logs-subsection-heading",children:[d.jsx("span",{className:"eyebrow",children:"Raw Events"}),d.jsx("h3",{children:"底层事件明细"}),d.jsx("span",{children:"保留每条原始记录，便于核对调用顺序与返回体"})]}),E?d.jsx("div",{className:"empty-state logs-empty",children:"正在加载所选执行链路的完整返回体…"}):A.length?d.jsx("div",{className:"logs-list",children:A.map((N,H)=>{const V=Vx(N),G=YR(N,H);return d.jsxs("article",{className:`log-event log-event-${V.status==="异常"?"error":V.status==="执行中"?"running":"done"}`,children:[d.jsxs("div",{className:"log-event-head",children:[d.jsxs("div",{className:"log-event-title",children:[d.jsx("span",{className:"log-event-index",children:A.length-H}),d.jsxs("div",{children:[d.jsx("strong",{children:V.label}),d.jsx("h3",{children:V.operation})]})]}),d.jsx("span",{className:"log-event-status",children:V.status})]}),d.jsxs("div",{className:"log-event-meta",children:[d.jsx("span",{children:N.timestamp?ei(N.timestamp):"--"}),d.jsxs("span",{children:["类型：",N.type||"--"]}),d.jsxs("span",{children:["事件：",N.event||"--"]}),d.jsxs("span",{children:["Trace：",N.trace_id||"--"]}),d.jsxs("span",{children:["Task：",N.task_id||"--"]}),V.server&&d.jsxs("span",{children:["MCP：",V.server]}),V.duration!=="--"&&d.jsxs("span",{children:["耗时：",V.duration]})]}),N.error&&d.jsxs("div",{className:"log-event-error",children:["错误：",N.error]}),d.jsx("div",{className:"log-event-details",children:qR(N).map(X=>d.jsxs("details",{className:"log-detail",open:X.key==="operation",children:[d.jsx("summary",{children:X.title}),d.jsx("pre",{className:"log-json",children:X.value})]},X.key))})]},`${G}-${H}`)})}):d.jsx("div",{className:"empty-state logs-empty",children:"暂无执行日志；触发一次诊断、知识检索或工单操作后，这里会显示完整执行链路。"})]})]})}function $C({snapshot:t}){var x;const e=Zx({snapshot:t}),[n,i]=le.useState([]),[r,s]=le.useState(""),[a,o]=le.useState(""),[l,c]=le.useState(!1),[h,p]=le.useState(!1),[f,g]=le.useState(!1);async function v(){c(!0);try{const A=await sn("/api/reports");i(A.items||[]),s(P=>{var L,B;return P||((B=(L=A.items)==null?void 0:L[0])==null?void 0:B.report_id)||""}),o("")}catch(A){o(A.message)}finally{c(!1)}}le.useEffect(()=>{let A=!1;v();const P=window.setInterval(()=>{A||v()},5e3);return()=>{A=!0,window.clearInterval(P)}},[]),le.useEffect(()=>{g(!1)},[r]);const E=n.map(A=>A!=null&&A.report&&typeof A.report=="object"?A.report:A).filter(Boolean),u=E.find(A=>A.report_id===r)||E[0]||e.report||{},m=u.sections||{},M=zR(m),y=!!(u.report_id||u.title||u.summary||Object.keys(m).length),T=u.report_id?`/api/reports/${encodeURIComponent(u.report_id)}/pdf`:"";async function w(){if(u.report_id){p(!0);try{await sn(`/api/reports/${encodeURIComponent(u.report_id)}/pdf`,{method:"POST",body:JSON.stringify({})}),g(!0),o("")}catch(A){o(`PDF 生成失败：${A.message}`)}finally{p(!1)}}}async function R(A){var P;if(!(!A||!window.confirm(`确定删除报告 ${A} 吗？删除后不可恢复。`)))try{await sn(`/api/reports/${encodeURIComponent(A)}`,{method:"DELETE"});const L=E.filter(B=>B.report_id!==A);i(L),s(((P=L[0])==null?void 0:P.report_id)||""),g(!1),o("")}catch(L){o(L.message)}}return d.jsxs("section",{className:"workspace-view active module-board report-workspace","aria-label":"报告中心",children:[d.jsx($a,{eyebrow:"Report Agent",title:"报告中心",text:"汇总诊断、维修方案、工单和质检结果，形成可追溯运维报告。",action:d.jsx("button",{className:"button",type:"button",onClick:v,disabled:l,children:l?"刷新中…":"刷新报告"})}),a&&d.jsxs("div",{className:"inline-error",role:"status",children:["报告服务暂不可用：",a]}),d.jsxs("section",{className:"panel module-panel report-list-panel","aria-label":"已持久化报告列表",children:[d.jsx("div",{className:"panel-heading",children:d.jsxs("div",{children:[d.jsxs("span",{className:"eyebrow",children:["持久化记录 · ",E.length," 份"]}),d.jsx("h2",{children:"报告列表"})]})}),E.length?d.jsx("div",{className:"report-list",children:E.map(A=>d.jsxs("div",{className:`report-list-item ${A.report_id===u.report_id?"is-selected":""}`,children:[d.jsxs("button",{type:"button",className:"report-list-select",onClick:()=>s(A.report_id),children:[d.jsx("strong",{children:A.title||"运维报告"}),d.jsxs("span",{children:[A.report_id," · ",ei(A.created_at||A.updated_at)]})]}),d.jsx("button",{type:"button",className:"button danger-button",onClick:()=>R(A.report_id),children:"删除"})]},A.report_id))}):d.jsx("div",{className:"empty-state",children:"暂无持久化报告"})]}),y?d.jsxs(d.Fragment,{children:[d.jsxs("div",{className:"module-grid",children:[d.jsx(Di,{label:"报告编号",value:u.report_id||"--",text:u.report_type||"运维报告"}),d.jsx(Di,{label:"生成时间",value:u.created_at||u.updated_at?ei(u.created_at||u.updated_at):"--",text:`${n.length||1} 份已持久化报告`}),d.jsx(Di,{label:"质量状态",value:((x=m.quality)==null?void 0:x.passed)==null?"待确认":m.quality.passed?"通过":"未通过",text:"质量协同结果"})]}),d.jsxs("section",{className:"panel module-panel report-panel",children:[d.jsxs("div",{className:"panel-heading",children:[d.jsxs("div",{children:[d.jsx("span",{className:"eyebrow",children:"报告摘要"}),d.jsx("h2",{children:u.title||"运维报告"})]}),d.jsxs("div",{className:"report-file-actions",children:[d.jsx("button",{className:"button",type:"button",onClick:w,disabled:!u.report_id||h,children:h?"生成中…":"生成 PDF"}),f&&d.jsxs(d.Fragment,{children:[d.jsx("a",{className:"button",href:T,target:"_blank",rel:"noreferrer",children:"打开 PDF"}),d.jsx("a",{className:"button",href:`${T}?download=1`,download:`report-${u.report_id}.pdf`,children:"下载 PDF"})]})]})]}),d.jsx(ii,{value:nn(u.summary)||"暂无摘要",className:"answer-summary"}),M.length>0&&d.jsx(s2,{sections:M})]})]}):d.jsx(Jx,{eyebrow:"报告队列",title:"暂无可查看的报告",text:"完成异常诊断、维修与质检闭环后，报告会自动汇总在这里。"})]})}function qC({snapshot:t,sample:e}){var w;const[n,i]=le.useState([]),[r,s]=le.useState(""),[a,o]=le.useState(""),l=Vp(t,e),c=Gp(t,e,l),h=c?l:{},p=c?kR(t,e):{},f=(p==null?void 0:p.maintenance_plan)||{},g=String((e==null?void 0:e.alarm_code)||(h==null?void 0:h.alarm_code)||"").trim(),v=String((e==null?void 0:e.device_id)||(t==null?void 0:t.device_id)||"").trim(),E=!!(e!=null&&e.alarm_code)&&["alarm","fault","warning"].includes(String((e==null?void 0:e.status)||"").toLowerCase()),_=!!(g||Object.keys(h).length),u=n.find(R=>R.workorder_id===r)||(_?void 0:n[0]),m=!!u&&String(u.device_id||"")===v&&(!g||String(u.alarm_code||"")===g)&&Object.keys(h).length>0,M=!u&&Object.keys(h).length>0&&!!(f.plan_id||(w=f.repair_steps)!=null&&w.length),y=UR({order:u||{},plan:m||M?f:{},diagnosis:m||M?h:{}});le.useEffect(()=>{let R=!1;return sn("/api/workorders").then(x=>{if(R)return;const A=(x.items||[]).map(bh);i(A),s(P=>P||Rh(A,e,t)),o("")}).catch(x=>{R||o(x.message)}),()=>{R=!0}},[]);function T(){const R=new URLSearchParams(window.location.search);R.set("view","workorder"),window.history.pushState({view:"workorder"},"",`${window.location.pathname}?${R.toString()}`),window.dispatchEvent(new PopStateEvent("popstate"))}return d.jsxs("section",{className:"workspace-view active maintenance-workspace","aria-label":"维修方案",children:[d.jsx($a,{eyebrow:"Maintenance Agent",title:"维修方案",text:"独立承载故障分析、维修步骤、工具、备件与 Evidence；工单只负责执行反馈。",action:d.jsx("button",{className:"button primary",type:"button",onClick:T,children:"进入工单执行"})}),a&&d.jsxs("div",{className:"inline-error",role:"status",children:["维修方案服务暂不可用：",a]}),d.jsxs("section",{className:"workorder-queue maintenance-plan-queue","aria-label":"方案关联工单",children:[d.jsxs("div",{className:"workorder-queue-heading",children:[d.jsxs("div",{children:[d.jsx("span",{className:"eyebrow",children:"方案关联"}),d.jsx("h2",{children:"选择工单查看维修方案"})]}),d.jsxs("span",{children:[n.length," 条记录"]})]}),n.length?d.jsx("div",{className:"workorder-queue-list",children:n.map(R=>d.jsxs("button",{type:"button",className:`workorder-queue-item ${(u==null?void 0:u.workorder_id)===R.workorder_id?"is-selected":""}`,onClick:()=>s(R.workorder_id),children:[d.jsxs("span",{children:[d.jsx("strong",{children:Tu(R,R.repair_target,{snapshot:t})}),d.jsxs("small",{children:[R.workorder_id," · ",R.device_id]})]}),d.jsx("em",{children:Lr(Au,R.status)})]},R.workorder_id))}):d.jsx(Jx,{eyebrow:"维修方案",title:"暂无关联工单",text:"完成诊断并生成工单后，维修方案会在这里显示。"})]}),_&&!u&&d.jsxs("div",{className:"workspace-notice",role:"status",children:[E?`当前报警 ${g}`:`最新诊断报警 ${g}`," 尚未关联工单；下方显示的是诊断阶段生成的维修方案，请先完成工单派发。"]}),(u||M)&&d.jsx(ZC,{plan:y,hasCurrentDiagnosis:m||M})]})}function YC({snapshot:t,sample:e,onClosed:n,actor:i}){var P,L,B;const[r,s]=le.useState([]),[a,o]=le.useState(""),[l,c]=le.useState("维修一组"),[h,p]=le.useState(""),[f,g]=le.useState(!1),v=Vp(t,e),E=Gp(t,e,v)?v:{},_=e||((P=t==null?void 0:t.latest_result)==null?void 0:P.current_sample)||((B=(L=t==null?void 0:t.devices)==null?void 0:L.find(F=>F.device_id===(t==null?void 0:t.device_id)))==null?void 0:B.current_sample)||{},u=String((_==null?void 0:_.alarm_code)||"").trim(),m=String((_==null?void 0:_.status)||"").toLowerCase(),M=!!u&&["alarm","fault","warning"].includes(m),y=u||String((E==null?void 0:E.alarm_code)||"").trim(),T=!!y,w=r.find(F=>F.workorder_id===a)||(T?void 0:r[0]);async function R(){try{const I=((await sn("/api/workorders")).items||[]).map(bh);return s(j=>I.map(N=>{var H;return{...N,machine_control:((H=j.find(V=>V.workorder_id===N.workorder_id))==null?void 0:H.machine_control)||N.machine_control}})),o(j=>I.some(N=>N.workorder_id===j)?j:Rh(I,e,t)),p(""),I}catch(F){return p(F.message),[]}}le.useEffect(()=>{R(),window.scrollTo({top:0,left:0,behavior:"auto"});const F=window.setInterval(R,5e3);return()=>window.clearInterval(F)},[]);async function x(F,I={}){if(w){g(!0);try{const j=F==="closed"?"close":F==="completed"?"mark_repair_completed":"update",N=await sn(`/api/workorders/${w.workorder_id}/action`,{method:"POST",body:JSON.stringify({action:j,status:F,assignee:l,...I})}),H=bh(N);N.machine_control&&(H.machine_control=N.machine_control),s(V=>V.map(G=>G.workorder_id===H.workorder_id?H:G)),p(""),F==="closed"&&(n==null||n())}catch(j){p(j.message)}finally{g(!1)}}}async function A(F){if(!(!(F!=null&&F.workorder_id)||!window.confirm(`确定删除工单 ${F.workorder_id} 吗？删除后不可恢复。`))){g(!0);try{await sn(`/api/workorders/${encodeURIComponent(F.workorder_id)}`,{method:"DELETE"});const I=r.filter(j=>j.workorder_id!==F.workorder_id);s(I),o(Rh(I,e,t)),p("")}catch(I){p(I.message)}finally{g(!1)}}}return d.jsxs("section",{className:"workspace-view active workorder-page","aria-label":"工单系统",children:[!M&&d.jsxs("div",{className:"module-hero",children:[d.jsx("span",{className:"eyebrow",children:"维修执行"}),d.jsx("h1",{children:"工单系统"}),d.jsx("p",{children:"跟进维修任务、执行反馈与验收。"})]}),d.jsxs("section",{className:"workorder-queue","aria-label":"工单队列",children:[d.jsxs("div",{className:"workorder-queue-heading",children:[d.jsxs("div",{children:[d.jsx("span",{className:"eyebrow",children:"工单队列"}),d.jsx("h2",{children:"维修任务"})]}),d.jsxs("span",{children:[r.length," 条记录"]})]}),r.length?d.jsx("div",{className:"workorder-queue-list",children:r.map(F=>d.jsxs("button",{type:"button",className:`workorder-queue-item ${(w==null?void 0:w.workorder_id)===F.workorder_id?"is-selected":""}`,onClick:()=>o(F.workorder_id),children:[d.jsxs("span",{children:[d.jsx("strong",{children:Tu(F,F.repair_target,{snapshot:t})}),d.jsxs("small",{children:[F.workorder_id," · ",F.device_id]})]}),d.jsx("em",{className:F.status==="closed"||F.status==="completed"?"is-done":"",children:Lr(Au,F.status)})]},F.workorder_id))}):d.jsx("div",{className:"workorder-queue-empty",children:"暂无工单；监控发现异常后会自动生成，或从当前故障创建工单。"})]}),T&&!w&&d.jsxs("div",{className:"workspace-notice",role:"status",children:[M?`当前报警 ${y}`:`最新诊断报警 ${y}`," 尚未关联工单；列表中的记录为历史工单，请先完成工单派发。"]}),d.jsx(KC,{order:w||null,sample:e,snapshot:t,diagnosis:E,busy:f,error:h,onUpdate:x,onDelete:A,readOnly:(i==null?void 0:i.role)!=="technician"})]})}function KC({order:t,sample:e,snapshot:n,diagnosis:i={},busy:r,error:s,onUpdate:a,onDelete:o,readOnly:l=!1}){var y,T;if(le.useEffect(()=>{window.scrollTo({top:0,left:0,behavior:"auto"})},[t==null?void 0:t.workorder_id]),!t)return d.jsx("section",{className:"workorder-empty-shell",children:d.jsxs("div",{className:"workorder-empty-content",children:[d.jsx("span",{className:"workorder-empty-icon","aria-hidden":"true",children:"□"}),d.jsx("span",{className:"eyebrow",children:"工单队列"}),d.jsx("h2",{children:"当前没有待处理工单"}),d.jsx("p",{children:"虚拟工厂触发故障后，维修工单会自动派发并显示在这里。"}),s&&d.jsx("div",{className:"inline-error",role:"alert",children:s})]})});const c=String((i==null?void 0:i.device_id)||"")===String(t.device_id||""),h=String((i==null?void 0:i.alarm_code)||"")===String(t.alarm_code||""),p=c&&h,f=t.diagnosis_context&&typeof t.diagnosis_context=="object"?t.diagnosis_context:{},g=p?i:f,v=String((e==null?void 0:e.device_id)||"")===String(t.device_id||"")&&String((e==null?void 0:e.alarm_code)||"")===String(t.alarm_code||"")?e:{},E=Array.isArray(n==null?void 0:n.devices)?n.devices.find(w=>String((w==null?void 0:w.device_id)||"")===String(t.device_id||"")):null,_=((T=(y=n==null?void 0:n.latest_results)==null?void 0:y[t.device_id])==null?void 0:T.current_sample)||(E==null?void 0:E.current_sample)||(String((e==null?void 0:e.device_id)||"")===String(t.device_id||"")?e:{}),u=SC(t,v),m=OR({order:t,target:u,diagnosis:g,context:{snapshot:n,sample:v,recoverySample:_}}),M=Lr(Au,t.status);return d.jsxs("section",{className:"workorder-detail-page",children:[d.jsxs("header",{className:"workorder-titlebar",children:[d.jsxs("div",{children:[d.jsx("span",{className:"eyebrow",children:"维修工单详情"}),d.jsx("h1",{children:Tu(t,u,{snapshot:n,sample:v,fault:g.fault||g.summary})}),d.jsxs("p",{children:[t.workorder_id," · ",t.device_id," · ",t.assignee||"未分配"," · ",ei(t.updated_at)]})]}),d.jsxs("div",{className:"workorder-titlebar-actions",children:[d.jsx("span",{className:`workorder-status-badge ${t.status==="closed"||t.status==="completed"?"done":"pending"}`,children:M}),d.jsx("button",{className:"button danger-button",type:"button",disabled:r||l||!["open","rejected","timeout"].includes(t.status),onClick:()=>o==null?void 0:o(t),children:"删除工单"})]})]}),d.jsx("div",{className:"workorder-bigscreen-grid cad-only",children:d.jsx(e2,{order:t,target:u})}),d.jsx(JC,{sheet:m,busy:r,error:s,onUpdate:a,readOnly:l})]})}function ZC({plan:t,hasCurrentDiagnosis:e}){const n=t.diagnosis||{},i=(t.evidence||[]).map(s=>typeof s=="string"?s:s.title||s.content||s.evidence_text||s.source||s.document_id||s.component_id||"维修证据").filter(Boolean),r=t.source==="maintenance-plan"?"独立维修方案":t.source==="legacy-workorder-snapshot"?"历史工单方案快照":"未关联维修方案";return d.jsxs("section",{className:"maintenance-plan-panel","aria-label":"维修方案",children:[d.jsxs("div",{className:"maintenance-plan-heading",children:[d.jsxs("div",{children:[d.jsx("span",{className:"eyebrow",children:"Maintenance Plan"}),d.jsx("h2",{children:"维修方案"}),d.jsx("p",{children:"由 Diagnosis Agent → Maintenance Agent 生成，工单仅引用并负责执行。"})]}),d.jsxs("div",{className:"maintenance-plan-meta",children:[d.jsx("span",{children:r}),t.planId&&d.jsx("strong",{children:t.planId})]})]}),t.source==="unavailable"?d.jsx("div",{className:"maintenance-plan-empty",children:"当前工单没有可读取的维修方案。故障定位仍保留在下方工单详情中，不会用工单字段伪造维修方案。"}):d.jsxs(d.Fragment,{children:[d.jsxs("div",{className:"maintenance-plan-diagnosis",children:[d.jsxs("div",{children:[d.jsx("span",{children:"故障分析"}),d.jsx("strong",{children:n.fault||n.summary||"待确认"}),d.jsx("p",{children:n.cause||n.diagnosis||"暂无原因分析"})]}),d.jsxs("div",{children:[d.jsx("span",{children:"建议与风险"}),d.jsx("strong",{children:n.recommendation||"按方案步骤执行并复测"}),d.jsxs("p",{children:[n.severity||t.riskLevel||"风险等级待确认",t.estimatedTime?` · 预计 ${t.estimatedTime}`:"",e?" · 当前诊断":" · 工单记录"]})]})]}),d.jsxs("div",{className:"maintenance-plan-grid",children:[d.jsx(sc,{title:"维修步骤",items:t.steps,ordered:!0}),d.jsx(sc,{title:"工具与备件",items:[...t.tools.map(s=>`工具：${s}`),...t.parts.map(s=>`备件：${s}`)]}),d.jsx(sc,{title:"安全与检查",items:[...t.safety,...t.preChecks,...t.postChecks]}),d.jsx(sc,{title:"Evidence 维修证据",items:i})]})]})]})}function sc({title:t,items:e=[],ordered:n=!1}){const i=e.filter(Boolean);return d.jsxs("section",{className:"maintenance-plan-section",children:[d.jsxs("div",{className:"maintenance-plan-section-head",children:[d.jsx("h3",{children:t}),d.jsxs("span",{children:[i.length," 项"]})]}),i.length?n?d.jsx("ol",{children:i.map((r,s)=>d.jsx("li",{children:d.jsx(ii,{value:r})},`${r}-${s}`))}):d.jsx("ul",{children:i.map((r,s)=>d.jsx("li",{children:d.jsx(ii,{value:r})},`${r}-${s}`))}):d.jsx("p",{className:"maintenance-plan-muted",children:"暂无记录"})]})}function QC(t={},e={}){var i;const n=[t.device_id,(i=t.drawing_context)==null?void 0:i.drawing_url,e.component,e.part_name].filter(Boolean).join(" ").toLowerCase();return n.includes("qls80")||n.includes("ql-servo")||n.includes("lns")?"/drawings/QLS80S2.html":n.includes("equator")||n.includes("renishaw")?"/drawings/Equator300.html":n.includes("tc820")||n.includes("trak")||n.includes("lubrication-pump")||n.includes("cooling-pump")?"/drawings/TC820si.html":""}function JC({sheet:t,busy:e,error:n,onUpdate:i,readOnly:r=!1}){const[s,a]=le.useState(""),[o,l]=le.useState(!1);le.useEffect(()=>{l(!1)},[t.workorderId]);const c=["completed","closed"].includes(t.status);return["in_progress","completed","closed"].includes(t.status),d.jsxs("section",{className:"maintenance-sheet","aria-label":"自动派发维修工单",children:[d.jsxs("div",{className:"sheet-heading",children:[d.jsxs("div",{children:[d.jsx("span",{className:"eyebrow",children:"自动派发工单"}),d.jsx("h2",{children:"维修工单"}),d.jsx("p",{className:"sheet-subtitle",children:"故障确认后由系统自动派出，维修人员按维修方案执行并提交反馈。"})]}),d.jsx("span",{className:c?"sheet-status done":"sheet-status",children:Lr(Au,t.status)})]}),d.jsxs("div",{className:"basic-grid",children:[d.jsxs("div",{children:[d.jsx("span",{children:"工单编号"}),d.jsx("strong",{children:t.workorderId||"--"})]}),d.jsxs("div",{children:[d.jsx("span",{children:"设备"}),d.jsx("strong",{children:t.deviceId||"--"})]}),d.jsxs("div",{children:[d.jsx("span",{children:"处理班组"}),d.jsx("strong",{children:t.assignee})]}),d.jsxs("div",{children:[d.jsx("span",{children:"派发方式"}),d.jsx("strong",{children:t.autoDispatched?"系统自动派发":"系统工单"})]})]}),d.jsxs("div",{className:"sheet-execution-grid",children:[d.jsxs("section",{className:"sheet-section fault-summary-card",children:[d.jsx("span",{className:"section-kicker",children:"故障信息"}),d.jsx("h3",{children:t.title}),d.jsxs("div",{className:"fault-meta-list",children:[d.jsxs("span",{children:["故障部件：",t.partName]}),d.jsxs("span",{children:["料号：",t.partNo]}),d.jsxs("span",{children:["所属系统：",t.system]}),d.jsxs("span",{children:["位置：",t.location]})]}),d.jsx(ii,{value:`故障表现：${t.faultSymptom}`,className:"fault-symptom"})]}),d.jsxs("section",{className:"sheet-section feedback-card",children:[d.jsx("div",{className:"sheet-subhead",children:d.jsxs("div",{children:[d.jsx("span",{className:"section-kicker",children:"WorkOrder 执行反馈"}),d.jsx("h3",{children:"完成后提交结果"})]})}),d.jsx("label",{htmlFor:"repair-feedback",children:"处理说明"}),d.jsx("textarea",{id:"repair-feedback",value:s,onChange:h=>a(h.target.value),placeholder:"填写处理结果、复测数据或未解决原因",disabled:r||t.status==="closed"}),n&&d.jsx("div",{className:"inline-error",children:n}),t.machineControl&&d.jsx("div",{className:`machine-control-result ${t.machineControl.state==="running"?"is-ok":"is-error"}`,role:"status",children:t.machineControl.state==="running"?"整线设备启动后已逐台读回，运行复核通过。":`整线尚未恢复运行：${t.machineControl.reason||t.machineControl.error||t.machineControl.state}`}),d.jsxs("label",{className:"maintenance-confirmation",children:[d.jsx("input",{type:"checkbox",checked:o,onChange:h=>l(h.target.checked),disabled:e||r||t.status==="closed"}),d.jsx("span",{children:"我确认已完成维修并依据当前设备恢复数据复测，允许申请恢复运行"})]}),d.jsxs("div",{className:"sheet-actions",children:[d.jsx("button",{className:"button",type:"button",disabled:e||r||c||t.accepted,onClick:()=>i("in_progress"),children:e?"处理中":t.accepted?"已确认接单":"确认接单"}),d.jsx("button",{className:"button primary",type:"button",disabled:e||r||t.status==="closed"||c&&t.verificationPhase==="poststart"||!s.trim()||!o,onClick:()=>i("completed",FR({feedback:s,operator:t.assignee,deviceId:t.deviceId,recoverySample:t.recoverySample,maintenanceConfirmedBy:t.assignee})),children:c?"再次确认并申请复机":"确认维修完成并申请复机"}),t.status==="completed"&&t.verificationPhase==="poststart"&&d.jsx("button",{className:"button",disabled:e||r,onClick:()=>i("closed"),children:"关闭工单并生成总结"})]})]})]})]})}function e2({order:t,target:e}){const[n,i]=le.useState(null),[r,s]=le.useState(""),a=le.useRef(null),o=e.component||e.part_no||e.part_name||"",l=QC(t,e);le.useEffect(()=>{let h=!1;if(i(null),s(""),!!o)return sn(`/api/cad/resolve?component=${encodeURIComponent(o)}&part_no=${encodeURIComponent(e.part_no||"")}&device_id=${encodeURIComponent((t==null?void 0:t.device_id)||"")}`).then(p=>{h||i(p)}).catch(p=>{h||s(p.message)}),()=>{h=!0}},[o,e.part_no,t==null?void 0:t.device_id]);function c(){var h,p;(p=(h=a.current)==null?void 0:h.requestFullscreen)==null||p.call(h)}return d.jsxs("section",{className:"repair-visual-panel","aria-label":"3D 故障定位",children:[d.jsxs("div",{className:"repair-visual-head",children:[d.jsxs("div",{children:[d.jsx("span",{className:"eyebrow",children:"3D 故障定位"}),d.jsx("h2",{children:e.part_name}),d.jsxs("p",{children:[e.location," · 工单目标：",o]})]}),d.jsx("div",{className:"repair-visual-actions",children:d.jsx("button",{className:"button ghost-button",type:"button",onClick:c,children:"全屏"})})]}),d.jsx("div",{className:"repair-visual-body",children:d.jsxs("div",{className:"repair-cad-scene",ref:a,"aria-label":"CAD 结构定位视图",children:[l?d.jsx("iframe",{className:"repair-drawing-frame",title:`${e.part_name||(t==null?void 0:t.device_id)||"设备"} 工单图纸`,src:l}):d.jsxs("div",{className:"cad-scene-status is-error",children:[d.jsx("strong",{children:"未匹配到工单图纸"}),d.jsxs("span",{children:["当前设备：",(t==null?void 0:t.device_id)||"未知"]}),d.jsx("small",{children:"没有可确认的机器图纸，不显示虚构模型。"})]}),r&&d.jsxs("div",{className:"cad-scene-status is-error repair-cad-notice",children:[d.jsx("strong",{children:"CAD 部件关系暂不可用"}),d.jsx("span",{children:r}),d.jsx("small",{children:"工单图纸仍保留；部件定位请以图纸和现场核验为准。"})]}),(n==null?void 0:n.part)&&d.jsxs("div",{className:"cad-scene-status repair-cad-notice",children:[d.jsxs("strong",{children:["已匹配：",n.part.name," · ",n.part.part_no]}),d.jsx("span",{children:n.part.position}),d.jsxs("small",{children:["CAD 来源：",n.source,"。图纸为本工单对应机器的真实离线查看器。"]})]})]})})]})}function t2({snapshot:t,sample:e,messages:n,setMessages:i}){const[r,s]=le.useState(""),[a,o]=le.useState(null),[l,c]=le.useState(""),[h,p]=le.useState(!1),f=le.useRef(null),g=le.useRef(new Set);async function v(){try{o(await sn("/api/rag/status")),c("")}catch(m){c(m.message)}}le.useEffect(()=>{v()},[]),le.useEffect(()=>{const m=f.current;m&&(m.scrollTop=m.scrollHeight)},[n]);function E(){return n.filter(m=>!m.pending).slice(-6).flatMap(m=>{var y,T;const M=wg(m.answer)||nn((T=(y=m.answer)==null?void 0:y.report)==null?void 0:T.summary)||"";return[{role:"user",content:m.question},...M?[{role:"assistant",content:M}]:[]]}).slice(-12)}async function _(m=r,M=""){const y=m.trim();if(!y||h)return;const T=M||`${Date.now()}-${Math.random().toString(36).slice(2,8)}`;i(x=>M?x.map(A=>A.id===M?{...A,question:y,pending:!0,answer:null,agentError:""}:A):[...x,{id:T,question:y,pending:!0}]),s(""),p(!0);let w=null,R="";try{w=await sn("/api/agent/question/summary",{method:"POST",body:JSON.stringify({user_text:y,context:{...VR(e,t),conversation_history:E()}})})}catch(x){R=String((x==null?void 0:x.message)||x)}i(x=>x.map(A=>A.id===T?{...A,pending:!1,answer:w,agentError:R}:A)),p(!1)}le.useEffect(()=>{if(h)return;const m=n.find(M=>Rg(M)&&!g.current.has(M.id));m&&(g.current.add(m.id),_(m.question,m.id))},[n,h]);function u(m){m.key==="Enter"&&!m.shiftKey&&!m.nativeEvent.isComposing&&(m.preventDefault(),_())}return d.jsxs("section",{className:"workspace-view active module-board rag-workspace rag-chat","aria-label":"RAG知识问答",children:[d.jsx($a,{eyebrow:"RAG 知识中枢",title:"维修知识问答",text:"围绕设备故障、报警码与 SOP 连续提问；回答只展示模型生成的正文。"}),d.jsxs("div",{className:"rag-chat-shell",children:[d.jsxs("div",{className:"rag-chat-toolbar",children:[d.jsxs("div",{children:[d.jsx("span",{className:"rag-chat-status-dot"}),d.jsx("strong",{children:"知识助手"}),d.jsxs("span",{children:["· ",(a==null?void 0:a.backend)||"检索服务待确认"]})]}),d.jsxs("div",{children:[d.jsxs("span",{children:["知识记录 ",(a==null?void 0:a.record_count)??"--"]}),d.jsxs("span",{children:["本次对话 ",n.filter(m=>!m.pending).length," 轮"]}),d.jsx("button",{className:"button",type:"button",onClick:()=>i([]),disabled:!n.length||h,children:"清空对话"}),d.jsx("button",{className:"button",type:"button",onClick:v,children:"刷新状态"})]})]}),l&&d.jsxs("div",{className:"rag-chat-status-error",role:"status",children:["知识库状态暂不可用：",l]}),d.jsx("div",{className:"rag-chat-messages",ref:f,role:"log","aria-label":"知识问答对话","aria-live":"polite",children:n.length===0?d.jsxs("div",{className:"rag-chat-welcome",children:[d.jsx("span",{className:"rag-chat-welcome-mark","aria-hidden":"true",children:"IA"}),d.jsx("h2",{children:"有什么设备问题需要排查？"}),d.jsx("p",{children:"可以询问报警含义、维修步骤或 SOP；回答只展示模型生成的正文。"})]}):n.map(m=>{var A,P,L,B,F;const M=((A=m.answer)==null?void 0:A.report)||{},y=((P=m.answer)==null?void 0:P.knowledge)||{},T=wg(m.answer)||nn(M.summary),w=((L=m.answer)==null?void 0:L.route)==="report"||((F=(B=m.answer)==null?void 0:B.route_result)==null?void 0:F.intent)==="report",R=Rg(m),x=y.retrieval_scope==="device"?"当前报警机器优先":y.retrieval_scope==="all"?"全库检索":"检索范围待确认";return d.jsxs("div",{className:"rag-chat-turn",children:[d.jsxs("div",{className:"rag-chat-row is-user",children:[d.jsx("span",{className:"rag-chat-avatar",children:"你"}),d.jsx("div",{className:"rag-chat-bubble",children:m.question})]}),d.jsxs("div",{className:"rag-chat-row is-assistant",children:[d.jsx("span",{className:"rag-chat-avatar",children:"IA"}),d.jsx("div",{className:"rag-chat-bubble",children:m.pending?d.jsx("p",{className:"rag-chat-pending",children:"正在检索并整理回答…"}):d.jsxs(d.Fragment,{children:[w&&d.jsx("span",{className:"rag-chat-result-tag",children:"路由至报告流程 · 非知识回答"}),!m.agentError&&y.retrieval_scope&&d.jsxs("span",{className:`rag-chat-scope-tag ${y.retrieval_scope}`,children:[x,y.retrieval_fallback?" · 已扩大到全库":""]}),M.title&&d.jsx("h3",{children:M.title}),d.jsx(ii,{value:T||(m.agentError?"问答服务暂不可用，本次未生成回答。":R?"正在重新整理这条历史问题的中文答案…":"暂未找到直接相关知识，请补充设备编号、报警码或故障现象。")}),m.agentError&&d.jsx(ii,{value:`问答服务异常：${m.agentError}`,className:"rag-chat-error"})]})})]})]},m.id)})}),d.jsxs("div",{className:"rag-chat-composer",children:[d.jsx("div",{className:"rag-chat-suggestions",children:MC.map(m=>d.jsx("button",{className:"button",type:"button",disabled:h,onClick:()=>_(m),children:m},m))}),d.jsxs("form",{onSubmit:m=>{m.preventDefault(),_()},children:[d.jsx("textarea",{className:"qa-input",value:r,onChange:m=>s(m.target.value),onKeyDown:u,placeholder:"输入设备维修、SOP 或报警码问题…","aria-label":"维修知识问题"}),d.jsxs("div",{className:"rag-chat-composer-actions",children:[d.jsx("span",{children:"Enter 发送 · Shift+Enter 换行"}),d.jsx("button",{className:"button primary",type:"submit",disabled:h||!r.trim(),children:h?"回答中…":"发送问题"})]})]})]})]})]})}function n2({snapshot:t,sample:e}){const[n,i]=le.useState("PART-001"),[r,s]=le.useState(null),[a,o]=le.useState([]),[l,c]=le.useState(""),[h,p]=le.useState(!1),[f,g]=le.useState([]);async function v(){try{const _=await sn("/api/experience/search",{method:"POST",body:JSON.stringify({device_id:(e==null?void 0:e.device_id)||(t==null?void 0:t.device_id)||"",limit:8})});o(_.items||[]);const u=await sn(`/api/v1/quality/checks?target_id=${encodeURIComponent(n.trim())}`);g(u.items||[]),c("")}catch(_){c(_.message)}}le.useEffect(()=>{v()},[]);async function E(){if(n.trim()){p(!0);try{const _=await sn(`/api/quality/parts/${encodeURIComponent(n.trim())}`,{method:"POST",body:"{}"});s(_),g(u=>_.quality_check_id&&!u.some(m=>m.quality_check_id===_.quality_check_id)?[{quality_check_id:_.quality_check_id,target_id:n.trim(),result:_.status,score:_.score,created_at:_.checked_at},...u]:u),await v(),c("")}catch(_){c(_.message)}finally{p(!1)}}}return d.jsxs("section",{className:"workspace-view active module-board quality-workspace","aria-label":"质检系统",children:[d.jsx($a,{eyebrow:"QMS 质检系统",title:"生产零件质量检测",text:"对生产完成的零件执行尺寸、外观、材料、功能和工艺追溯检测。"}),d.jsxs("div",{className:"ops-grid quality-primary-grid",children:[d.jsxs("section",{className:"panel module-panel",children:[d.jsx("div",{className:"panel-heading",children:d.jsxs("div",{children:[d.jsx("span",{className:"eyebrow",children:"检测任务"}),d.jsx("h2",{children:"输入零件编号"})]})}),d.jsx("label",{className:"field-label",htmlFor:"quality-part-id",children:"生产零件编号"}),d.jsx("input",{id:"quality-part-id",className:"select-input",value:n,onChange:_=>i(_.target.value),placeholder:"例如 PART-001"}),d.jsx("div",{className:"action-row",children:d.jsx("button",{className:"button primary",type:"button",disabled:h||!n.trim(),onClick:E,children:h?"检测中":"执行质量检测"})}),l&&d.jsx("div",{className:"inline-error",children:l})]}),d.jsxs("section",{className:"panel module-panel",children:[d.jsxs("div",{className:"panel-heading",children:[d.jsxs("div",{children:[d.jsx("span",{className:"eyebrow",children:"最近结果"}),d.jsx("h2",{children:r?r.qualified?"零件合格":"零件不合格":"等待检测"})]}),r&&d.jsx("span",{className:`severity-pill ${r.qualified?"normal":"fault"}`,children:r.qualified?"合格":"不合格"})]}),r?d.jsx(i2,{quality:r}):d.jsx("div",{className:"empty-state",children:"输入生产零件编号后，系统会返回尺寸、外观、材料、功能和工艺检测结果。"})]})]}),d.jsxs("section",{className:"answer-grid quality-experience-grid",children:[d.jsxs("div",{className:"panel module-panel",children:[d.jsxs("div",{className:"panel-heading",children:[d.jsxs("div",{children:[d.jsxs("span",{className:"eyebrow",children:["经验库 · ",a.length," 条"]}),d.jsx("h2",{children:"相关维修经验"})]}),d.jsx("button",{className:"button",type:"button",onClick:v,children:"刷新经验"})]}),d.jsx(r2,{items:a})]}),d.jsxs("div",{className:"panel module-panel",children:[d.jsx("div",{className:"panel-heading",children:d.jsxs("div",{children:[d.jsxs("span",{className:"eyebrow",children:["真实记录 · ",f.length," 条"]}),d.jsx("h2",{children:"质检历史"})]})}),f.length?d.jsx("div",{className:"document-list",children:f.map(_=>d.jsxs("article",{children:[d.jsx("strong",{children:_.quality_check_id}),d.jsxs("span",{children:[_.target_id||n," · ",_.result||"待确认"," · ",ei(_.created_at)]})]},_.quality_check_id))}):d.jsx("div",{className:"empty-state",children:"完成检测后，质检记录会写入后端并显示在这里。"})]})]})]})}function $a({eyebrow:t,title:e,text:n,action:i=null}){return d.jsxs("header",{className:"module-hero",children:[d.jsxs("div",{children:[d.jsx("span",{className:"eyebrow",children:t}),d.jsx("h1",{children:e}),d.jsx("p",{children:n})]}),i&&d.jsx("div",{className:"module-hero-action",children:i})]})}function Jx({eyebrow:t,title:e,text:n}){return d.jsxs("div",{className:"workspace-empty",children:[d.jsx("span",{className:"workspace-empty-mark","aria-hidden":"true",children:"—"}),d.jsx("span",{className:"eyebrow",children:t}),d.jsx("h2",{children:e}),d.jsx("p",{children:n})]})}function Di({label:t,value:e,text:n}){return d.jsxs("div",{className:"module-card",children:[d.jsx("span",{children:t}),d.jsx("strong",{children:e}),d.jsx("p",{children:n})]})}function $p({steps:t=[]}){const e=t.map(nn).filter(Boolean);return e.length?d.jsx("ol",{className:"step-list",children:e.map((n,i)=>d.jsx("li",{children:d.jsx(ii,{value:n})},`${n}-${i}`))}):d.jsx("div",{className:"empty-state",children:"暂无维修步骤"})}function i2({quality:t}){const e=t.inspection_items||[],n=(t.defects||[]).map(i=>typeof i=="string"?i:(i==null?void 0:i.description)||(i==null?void 0:i.message)||(i==null?void 0:i.name)||"").filter(Boolean);return d.jsxs("div",{className:"quality-result",children:[d.jsx("div",{className:"check-grid",children:e.map(i=>d.jsxs("div",{className:i.passed?"normal":"fault",children:[d.jsx("span",{children:i.name}),d.jsx("strong",{children:i.passed?"通过":"未通过"})]},i.name))}),d.jsx($p,{steps:[...n,...t.findings||[]]})]})}function r2({items:t}){return t.length?d.jsx("div",{className:"document-list",children:t.map((e,n)=>d.jsxs("article",{children:[d.jsx("strong",{children:nn(e.title)||"维修经验"}),d.jsx(ii,{value:nn(e.content)||"暂无经验正文"})]},e.experience_id||n))}):d.jsx("div",{className:"empty-state",children:"暂无经验记录；闭环通过后会自动沉淀。"})}function ii({value:t,className:e=""}){const n=bR(t);if(!n.length)return null;const i=(r,s)=>RR(r).map((a,o)=>{const l=`${s}-${o}`;return a.type==="strong"?d.jsx("strong",{children:a.text},l):a.type==="code"?d.jsx("code",{children:a.text},l):d.jsx(My.Fragment,{children:a.text},l)});return d.jsx("div",{className:`formatted-text ${e}`.trim(),children:n.map((r,s)=>{if(r.type==="list")return d.jsx("ul",{children:r.items.map((a,o)=>d.jsx("li",{children:i(a,`list-${s}-${o}`)},`${a}-${o}`))},`list-${s}`);if(r.type==="heading"){const a=`h${Math.min(Math.max(r.level+1,3),6)}`;return d.jsx(a,{children:i(r.text,`heading-${s}`)},`heading-${s}`)}return r.type==="rule"?d.jsx("hr",{},`rule-${s}`):d.jsx("p",{children:i(r.text,`paragraph-${s}`)},`paragraph-${s}`)})})}function s2({sections:t}){return d.jsx("div",{className:"report-display-sections",children:t.map(e=>{var n;return d.jsxs("section",{className:"report-display-section",children:[d.jsx("h3",{children:e.title}),e.body&&d.jsx(ii,{value:e.body}),((n=e.items)==null?void 0:n.length)>0&&d.jsx($p,{steps:e.items})]},e.title)})})}qv(document.getElementById("root")).render(d.jsx(PC,{}));
