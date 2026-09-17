(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const l of document.querySelectorAll('link[rel="modulepreload"]'))s(l);new MutationObserver(l=>{for(const f of l)if(f.type==="childList")for(const h of f.addedNodes)h.tagName==="LINK"&&h.rel==="modulepreload"&&s(h)}).observe(document,{childList:!0,subtree:!0});function i(l){const f={};return l.integrity&&(f.integrity=l.integrity),l.referrerPolicy&&(f.referrerPolicy=l.referrerPolicy),l.crossOrigin==="use-credentials"?f.credentials="include":l.crossOrigin==="anonymous"?f.credentials="omit":f.credentials="same-origin",f}function s(l){if(l.ep)return;l.ep=!0;const f=i(l);fetch(l.href,f)}})();var Gd={exports:{}},Hl={};var Gv;function wE(){if(Gv)return Hl;Gv=1;var o=Symbol.for("react.transitional.element"),e=Symbol.for("react.fragment");function i(s,l,f){var h=null;if(f!==void 0&&(h=""+f),l.key!==void 0&&(h=""+l.key),"key"in l){f={};for(var d in l)d!=="key"&&(f[d]=l[d])}else f=l;return l=f.ref,{$$typeof:o,type:s,key:h,ref:l!==void 0?l:null,props:f}}return Hl.Fragment=e,Hl.jsx=i,Hl.jsxs=i,Hl}var Vv;function CE(){return Vv||(Vv=1,Gd.exports=wE()),Gd.exports}var b=CE(),Vd={exports:{}},Me={};var kv;function NE(){if(kv)return Me;kv=1;var o=Symbol.for("react.transitional.element"),e=Symbol.for("react.portal"),i=Symbol.for("react.fragment"),s=Symbol.for("react.strict_mode"),l=Symbol.for("react.profiler"),f=Symbol.for("react.consumer"),h=Symbol.for("react.context"),d=Symbol.for("react.forward_ref"),m=Symbol.for("react.suspense"),p=Symbol.for("react.memo"),S=Symbol.for("react.lazy"),v=Symbol.for("react.activity"),g=Symbol.for("react.view_transition"),M=Symbol.iterator;function R(B){return B===null||typeof B!="object"?null:(B=M&&B[M]||B["@@iterator"],typeof B=="function"?B:null)}var C={isMounted:function(){return!1},enqueueForceUpdate:function(){},enqueueReplaceState:function(){},enqueueSetState:function(){}},y=Object.assign,x={};function D(B,_t,Rt){this.props=B,this.context=_t,this.refs=x,this.updater=Rt||C}D.prototype.isReactComponent={},D.prototype.setState=function(B,_t){if(typeof B!="object"&&typeof B!="function"&&B!=null)throw Error("takes an object of state variables to update or a function which returns an object of state variables.");this.updater.enqueueSetState(this,B,_t,"setState")},D.prototype.forceUpdate=function(B){this.updater.enqueueForceUpdate(this,B,"forceUpdate")};function F(){}F.prototype=D.prototype;function N(B,_t,Rt){this.props=B,this.context=_t,this.refs=x,this.updater=Rt||C}var L=N.prototype=new F;L.constructor=N,y(L,D.prototype),L.isPureReactComponent=!0;var U=Array.isArray;function I(){}var T={H:null,A:null,T:null,S:null},O=Object.prototype.hasOwnProperty;function V(B,_t,Rt){var $=Rt.ref;return{$$typeof:o,type:B,key:_t,ref:$!==void 0?$:null,props:Rt}}function Z(B,_t){return V(B.type,_t,B.props)}function J(B){return typeof B=="object"&&B!==null&&B.$$typeof===o}function lt(B){var _t={"=":"=0",":":"=2"};return"$"+B.replace(/[=:]/g,function(Rt){return _t[Rt]})}var q=/\/+/g;function nt(B,_t){return typeof B=="object"&&B!==null&&B.key!=null?lt(""+B.key):_t.toString(36)}function j(B){switch(B.status){case"fulfilled":return B.value;case"rejected":throw B.reason;default:switch(typeof B.status=="string"?B.then(I,I):(B.status="pending",B.then(function(_t){B.status==="pending"&&(B.status="fulfilled",B.value=_t)},function(_t){B.status==="pending"&&(B.status="rejected",B.reason=_t)})),B.status){case"fulfilled":return B.value;case"rejected":throw B.reason}}throw B}function K(B,_t,Rt,$,pt){var Ct=typeof B;(Ct==="undefined"||Ct==="boolean")&&(B=null);var Yt=!1;if(B===null)Yt=!0;else switch(Ct){case"bigint":case"string":case"number":Yt=!0;break;case"object":switch(B.$$typeof){case o:case e:Yt=!0;break;case S:return Yt=B._init,K(Yt(B._payload),_t,Rt,$,pt)}}if(Yt)return pt=pt(B),Yt=$===""?"."+nt(B,0):$,U(pt)?(Rt="",Yt!=null&&(Rt=Yt.replace(q,"$&/")+"/"),K(pt,_t,Rt,"",function($e){return $e})):pt!=null&&(J(pt)&&(pt=Z(pt,Rt+(pt.key==null||B&&B.key===pt.key?"":(""+pt.key).replace(q,"$&/")+"/")+Yt)),_t.push(pt)),1;Yt=0;var Mt=$===""?".":$+":";if(U(B))for(var Ot=0;Ot<B.length;Ot++)$=B[Ot],Ct=Mt+nt($,Ot),Yt+=K($,_t,Rt,Ct,pt);else if(Ot=R(B),typeof Ot=="function")for(B=Ot.call(B),Ot=0;!($=B.next()).done;)$=$.value,Ct=Mt+nt($,Ot++),Yt+=K($,_t,Rt,Ct,pt);else if(Ct==="object"){if(typeof B.then=="function")return K(j(B),_t,Rt,$,pt);throw _t=String(B),Error("Objects are not valid as a React child (found: "+(_t==="[object Object]"?"object with keys {"+Object.keys(B).join(", ")+"}":_t)+"). If you meant to render a collection of children, use an array instead.")}return Yt}function dt(B,_t,Rt){if(B==null)return B;var $=[],pt=0;return K(B,$,"","",function(Ct){return _t.call(Rt,Ct,pt++)}),$}function ut(B){if(B._status===-1){var _t=B._result,Rt=_t();Rt.then(function($){(B._status===0||B._status===-1)&&(B._status=1,B._result=$,Rt.status===void 0&&(Rt.status="fulfilled",Rt.value=$))},function($){(B._status===0||B._status===-1)&&(B._status=2,B._result=$,Rt.status===void 0&&(Rt.status="rejected",Rt.reason=$))}),B._status===-1&&(B._status=0,B._result=Rt)}if(B._status===1)return B._result.default;throw B._result}var mt=typeof reportError=="function"?reportError:function(B){if(typeof window=="object"&&typeof window.ErrorEvent=="function"){var _t=new window.ErrorEvent("error",{bubbles:!0,cancelable:!0,message:typeof B=="object"&&B!==null&&typeof B.message=="string"?String(B.message):String(B),error:B});if(!window.dispatchEvent(_t))return}else if(typeof process=="object"&&typeof process.emit=="function"){process.emit("uncaughtException",B);return}console.error(B)};function gt(B){var _t=T.T,Rt={};Rt.types=_t!==null?_t.types:null,T.T=Rt;try{var $=B(),pt=T.S;pt!==null&&pt(Rt,$),typeof $=="object"&&$!==null&&typeof $.then=="function"&&$.then(I,mt)}catch(Ct){mt(Ct)}finally{_t!==null&&Rt.types!==null&&(_t.types=Rt.types),T.T=_t}}function ie(B){var _t=T.T;if(_t!==null){var Rt=_t.types;Rt===null?_t.types=[B]:Rt.indexOf(B)===-1&&Rt.push(B)}else gt(ie.bind(null,B))}var ae={map:dt,forEach:function(B,_t,Rt){dt(B,function(){_t.apply(this,arguments)},Rt)},count:function(B){var _t=0;return dt(B,function(){_t++}),_t},toArray:function(B){return dt(B,function(_t){return _t})||[]},only:function(B){if(!J(B))throw Error("React.Children.only expected to receive a single React element child.");return B}};return Me.Activity=v,Me.Children=ae,Me.Component=D,Me.Fragment=i,Me.Profiler=l,Me.PureComponent=N,Me.StrictMode=s,Me.Suspense=m,Me.ViewTransition=g,Me.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE=T,Me.__COMPILER_RUNTIME={__proto__:null,c:function(B){return T.H.useMemoCache(B)}},Me.addTransitionType=ie,Me.cache=function(B){return function(){return B.apply(null,arguments)}},Me.cacheSignal=function(){return null},Me.cloneElement=function(B,_t,Rt){if(B==null)throw Error("The argument must be a React element, but you passed "+B+".");var $=y({},B.props),pt=B.key;if(_t!=null)for(Ct in _t.key!==void 0&&(pt=""+_t.key),_t)!O.call(_t,Ct)||Ct==="key"||Ct==="__self"||Ct==="__source"||Ct==="ref"&&_t.ref===void 0||($[Ct]=_t[Ct]);var Ct=arguments.length-2;if(Ct===1)$.children=Rt;else if(1<Ct){for(var Yt=Array(Ct),Mt=0;Mt<Ct;Mt++)Yt[Mt]=arguments[Mt+2];$.children=Yt}return V(B.type,pt,$)},Me.createContext=function(B){return B={$$typeof:h,_currentValue:B,_currentValue2:B,_threadCount:0,Provider:null,Consumer:null},B.Provider=B,B.Consumer={$$typeof:f,_context:B},B},Me.createElement=function(B,_t,Rt){var $,pt={},Ct=null;if(_t!=null)for($ in _t.key!==void 0&&(Ct=""+_t.key),_t)O.call(_t,$)&&$!=="key"&&$!=="__self"&&$!=="__source"&&(pt[$]=_t[$]);var Yt=arguments.length-2;if(Yt===1)pt.children=Rt;else if(1<Yt){for(var Mt=Array(Yt),Ot=0;Ot<Yt;Ot++)Mt[Ot]=arguments[Ot+2];pt.children=Mt}if(B&&B.defaultProps)for($ in Yt=B.defaultProps,Yt)pt[$]===void 0&&(pt[$]=Yt[$]);return V(B,Ct,pt)},Me.createRef=function(){return{current:null}},Me.forwardRef=function(B){return{$$typeof:d,render:B}},Me.isValidElement=J,Me.lazy=function(B){return{$$typeof:S,_payload:{_status:-1,_result:B},_init:ut}},Me.memo=function(B,_t){return{$$typeof:p,type:B,compare:_t===void 0?null:_t}},Me.startTransition=gt,Me.unstable_useCacheRefresh=function(){return T.H.useCacheRefresh()},Me.use=function(B){return T.H.use(B)},Me.useActionState=function(B,_t,Rt){return T.H.useActionState(B,_t,Rt)},Me.useCallback=function(B,_t){return T.H.useCallback(B,_t)},Me.useContext=function(B){return T.H.useContext(B)},Me.useDebugValue=function(){},Me.useDeferredValue=function(B,_t){return T.H.useDeferredValue(B,_t)},Me.useEffect=function(B,_t){return T.H.useEffect(B,_t)},Me.useEffectEvent=function(B){return T.H.useEffectEvent(B)},Me.useId=function(){return T.H.useId()},Me.useImperativeHandle=function(B,_t,Rt){return T.H.useImperativeHandle(B,_t,Rt)},Me.useInsertionEffect=function(B,_t){return T.H.useInsertionEffect(B,_t)},Me.useLayoutEffect=function(B,_t){return T.H.useLayoutEffect(B,_t)},Me.useMemo=function(B,_t){return T.H.useMemo(B,_t)},Me.useOptimistic=function(B,_t){return T.H.useOptimistic(B,_t)},Me.useReducer=function(B,_t,Rt){return T.H.useReducer(B,_t,Rt)},Me.useRef=function(B){return T.H.useRef(B)},Me.useState=function(B){return T.H.useState(B)},Me.useSyncExternalStore=function(B,_t,Rt){return T.H.useSyncExternalStore(B,_t,Rt)},Me.useTransition=function(){return T.H.useTransition()},Me.version="19.3.0",Me}var Xv;function Sm(){return Xv||(Xv=1,Vd.exports=NE()),Vd.exports}var Oe=Sm(),kd={exports:{}},Gl={},Xd={exports:{}},Wd={};var Wv;function DE(){return Wv||(Wv=1,(function(o){function e(j,K){var dt=j.length;j.push(K);t:for(;0<dt;){var ut=dt-1>>>1,mt=j[ut];if(0<l(mt,K))j[ut]=K,j[dt]=mt,dt=ut;else break t}}function i(j){return j.length===0?null:j[0]}function s(j){if(j.length===0)return null;var K=j[0],dt=j.pop();if(dt!==K){j[0]=dt;t:for(var ut=0,mt=j.length,gt=mt>>>1;ut<gt;){var ie=2*(ut+1)-1,ae=j[ie],B=ie+1,_t=j[B];if(0>l(ae,dt))B<mt&&0>l(_t,ae)?(j[ut]=_t,j[B]=dt,ut=B):(j[ut]=ae,j[ie]=dt,ut=ie);else if(B<mt&&0>l(_t,dt))j[ut]=_t,j[B]=dt,ut=B;else break t}}return K}function l(j,K){var dt=j.sortIndex-K.sortIndex;return dt!==0?dt:j.id-K.id}if(o.unstable_now=void 0,typeof performance=="object"&&typeof performance.now=="function"){var f=performance;o.unstable_now=function(){return f.now()}}else{var h=Date,d=h.now();o.unstable_now=function(){return h.now()-d}}var m=[],p=[],S=1,v=null,g=3,M=!1,R=!1,C=!1,y=!1,x=typeof setTimeout=="function"?setTimeout:null,D=typeof clearTimeout=="function"?clearTimeout:null,F=typeof setImmediate<"u"?setImmediate:null;function N(j){for(var K=i(p);K!==null;){if(K.callback===null)s(p);else if(K.startTime<=j)s(p),K.sortIndex=K.expirationTime,e(m,K);else break;K=i(p)}}function L(j){if(C=!1,N(j),!R)if(i(m)!==null)R=!0,U||(U=!0,J());else{var K=i(p);K!==null&&nt(L,K.startTime-j)}}var U=!1,I=-1,T=5,O=-1;function V(){return y?!0:!(o.unstable_now()-O<T)}function Z(){if(y=!1,U){var j=o.unstable_now();O=j;var K=!0;try{t:{R=!1,C&&(C=!1,D(I),I=-1),M=!0;var dt=g;try{e:{for(N(j),v=i(m);v!==null&&!(v.expirationTime>j&&V());){var ut=v.callback;if(typeof ut=="function"){v.callback=null,g=v.priorityLevel;var mt=ut(v.expirationTime<=j);if(j=o.unstable_now(),typeof mt=="function"){v.callback=mt,N(j),K=!0;break e}v===i(m)&&s(m),N(j)}else s(m);v=i(m)}if(v!==null)K=!0;else{var gt=i(p);gt!==null&&nt(L,gt.startTime-j),K=!1}}break t}finally{v=null,g=dt,M=!1}K=void 0}}finally{K?J():U=!1}}}var J;if(typeof F=="function")J=function(){F(Z)};else if(typeof MessageChannel<"u"){var lt=new MessageChannel,q=lt.port2;lt.port1.onmessage=Z,J=function(){q.postMessage(null)}}else J=function(){x(Z,0)};function nt(j,K){I=x(function(){j(o.unstable_now())},K)}o.unstable_IdlePriority=5,o.unstable_ImmediatePriority=1,o.unstable_LowPriority=4,o.unstable_NormalPriority=3,o.unstable_Profiling=null,o.unstable_UserBlockingPriority=2,o.unstable_cancelCallback=function(j){j.callback=null},o.unstable_forceFrameRate=function(j){0>j||125<j?console.error("forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported"):T=0<j?Math.floor(1e3/j):5},o.unstable_getCurrentPriorityLevel=function(){return g},o.unstable_next=function(j){switch(g){case 1:case 2:case 3:var K=3;break;default:K=g}var dt=g;g=K;try{return j()}finally{g=dt}},o.unstable_requestPaint=function(){y=!0},o.unstable_runWithPriority=function(j,K){switch(j){case 1:case 2:case 3:case 4:case 5:break;default:j=3}var dt=g;g=j;try{return K()}finally{g=dt}},o.unstable_scheduleCallback=function(j,K,dt){var ut=o.unstable_now();switch(typeof dt=="object"&&dt!==null?(dt=dt.delay,dt=typeof dt=="number"&&0<dt?ut+dt:ut):dt=ut,j){case 1:var mt=-1;break;case 2:mt=250;break;case 5:mt=1073741823;break;case 4:mt=1e4;break;default:mt=5e3}return mt=dt+mt,j={id:S++,callback:K,priorityLevel:j,startTime:dt,expirationTime:mt,sortIndex:-1},dt>ut?(j.sortIndex=dt,e(p,j),i(m)===null&&j===i(p)&&(C?(D(I),I=-1):C=!0,nt(L,dt-ut))):(j.sortIndex=mt,e(m,j),R||M||(R=!0,U||(U=!0,J()))),j},o.unstable_shouldYield=V,o.unstable_wrapCallback=function(j){var K=g;return function(){var dt=g;g=K;try{return j.apply(this,arguments)}finally{g=dt}}}})(Wd)),Wd}var Yv;function UE(){return Yv||(Yv=1,Xd.exports=DE()),Xd.exports}var Yd={exports:{}},ei={};var qv;function LE(){if(qv)return ei;qv=1;var o=Sm();function e(S){var v="https://react.dev/errors/"+S;if(1<arguments.length){v+="?args[]="+encodeURIComponent(arguments[1]);for(var g=2;g<arguments.length;g++)v+="&args[]="+encodeURIComponent(arguments[g])}return"Minified React error #"+S+"; visit "+v+" for the full message or use the non-minified dev environment for full errors and additional helpful warnings."}function i(){}var s={d:{f:i,r:function(){throw Error(e(522))},D:i,C:i,L:i,m:i,X:i,S:i,M:i},p:0,findDOMNode:null},l=Symbol.for("react.portal"),f=Symbol.for("react.recoverable"),h=Symbol.for("react.optimistic_key");function d(S,v,g){var M=3<arguments.length&&arguments[3]!==void 0?arguments[3]:null;return{$$typeof:l,key:M==null?null:M===h?h:""+M,children:S,containerInfo:v,implementation:g}}var m=o.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;function p(S,v){if(S==="font")return"";if(typeof v=="string")return v==="use-credentials"?v:""}return ei.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE=s,ei.browser=function(S){return{$$typeof:f,_reason:S}},ei.createPortal=function(S,v){var g=2<arguments.length&&arguments[2]!==void 0?arguments[2]:null;if(!v||v.nodeType!==1&&v.nodeType!==9&&v.nodeType!==11)throw Error(e(299));return d(S,v,null,g)},ei.flushSync=function(S){var v=m.T,g=s.p;try{if(m.T=null,s.p=2,S)return S()}finally{m.T=v,s.p=g,s.d.f()}},ei.preconnect=function(S,v){typeof S=="string"&&(v?(v=v.crossOrigin,v=typeof v=="string"?v==="use-credentials"?v:"":void 0):v=null,s.d.C(S,v))},ei.prefetchDNS=function(S){typeof S=="string"&&s.d.D(S)},ei.preinit=function(S,v){if(typeof S=="string"&&v&&typeof v.as=="string"){var g=v.as,M=p(g,v.crossOrigin),R=typeof v.integrity=="string"?v.integrity:void 0,C=typeof v.fetchPriority=="string"?v.fetchPriority:void 0;g==="style"?s.d.S(S,typeof v.precedence=="string"?v.precedence:void 0,{crossOrigin:M,integrity:R,fetchPriority:C}):g==="script"&&s.d.X(S,{crossOrigin:M,integrity:R,fetchPriority:C,nonce:typeof v.nonce=="string"?v.nonce:void 0})}},ei.preinitModule=function(S,v){if(typeof S=="string")if(typeof v=="object"&&v!==null){if(v.as==null||v.as==="script"){var g=p(v.as,v.crossOrigin);s.d.M(S,{crossOrigin:g,integrity:typeof v.integrity=="string"?v.integrity:void 0,nonce:typeof v.nonce=="string"?v.nonce:void 0,fetchPriority:typeof v.fetchPriority=="string"?v.fetchPriority:void 0})}}else v==null&&s.d.M(S)},ei.preload=function(S,v){if(typeof S=="string"&&typeof v=="object"&&v!==null&&typeof v.as=="string"){var g=v.as,M=p(g,v.crossOrigin);s.d.L(S,g,{crossOrigin:M,integrity:typeof v.integrity=="string"?v.integrity:void 0,nonce:typeof v.nonce=="string"?v.nonce:void 0,type:typeof v.type=="string"?v.type:void 0,fetchPriority:typeof v.fetchPriority=="string"?v.fetchPriority:void 0,referrerPolicy:typeof v.referrerPolicy=="string"?v.referrerPolicy:void 0,imageSrcSet:typeof v.imageSrcSet=="string"?v.imageSrcSet:void 0,imageSizes:typeof v.imageSizes=="string"?v.imageSizes:void 0,media:typeof v.media=="string"?v.media:void 0})}},ei.preloadModule=function(S,v){if(typeof S=="string")if(v){var g=p(v.as,v.crossOrigin);s.d.m(S,{as:typeof v.as=="string"&&v.as!=="script"?v.as:void 0,crossOrigin:g,integrity:typeof v.integrity=="string"?v.integrity:void 0,nonce:typeof v.nonce=="string"?v.nonce:void 0,fetchPriority:typeof v.fetchPriority=="string"?v.fetchPriority:void 0})}else s.d.m(S)},ei.requestFormReset=function(S){s.d.r(S)},ei.unstable_batchedUpdates=function(S,v){return S(v)},ei.useFormState=function(S,v,g){return m.H.useFormState(S,v,g)},ei.useFormStatus=function(){return m.H.useHostTransitionStatus()},ei.version="19.3.0",ei}var jv;function OE(){if(jv)return Yd.exports;jv=1;function o(){if(!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__>"u"||typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE!="function"))try{__REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(o)}catch(e){console.error(e)}}return o(),Yd.exports=LE(),Yd.exports}var Zv;function PE(){if(Zv)return Gl;Zv=1;var o=UE(),e=Sm(),i=OE();function s(t){var n="https://react.dev/errors/"+t;if(1<arguments.length){n+="?args[]="+encodeURIComponent(arguments[1]);for(var a=2;a<arguments.length;a++)n+="&args[]="+encodeURIComponent(arguments[a])}return"Minified React error #"+t+"; visit "+n+" for the full message or use the non-minified dev environment for full errors and additional helpful warnings."}function l(t){return!(!t||t.nodeType!==1&&t.nodeType!==9&&t.nodeType!==11)}function f(t){for(var n=t,a=n;a&&!a.alternate;)n=a,(n.flags&4098)!==0&&(t=n.return),a=n.return;for(;n.return;)n=n.return;return n.tag===3?t:null}function h(t){if(t.tag===13){var n=t.memoizedState;if(n===null&&(t=t.alternate,t!==null&&(n=t.memoizedState)),n!==null)return n.dehydrated}return null}function d(t){if(t.tag===31){var n=t.memoizedState;if(n===null&&(t=t.alternate,t!==null&&(n=t.memoizedState)),n!==null)return n.dehydrated}return null}function m(t){if(f(t)!==t)throw Error(s(188))}function p(t){var n=t.alternate;if(!n){if(n=f(t),n===null)throw Error(s(188));return n!==t?null:t}for(var a=t,r=n;;){var c=a.return;if(c===null)break;var u=c.alternate;if(u===null){if(r=c.return,r!==null){a=r;continue}break}if(c.child===u.child){for(u=c.child;u;){if(u===a)return m(c),t;if(u===r)return m(c),n;u=u.sibling}throw Error(s(188))}if(a.return!==r.return)a=c,r=u;else{for(var _=!1,w=c.child;w;){if(w===a){_=!0,a=c,r=u;break}if(w===r){_=!0,r=c,a=u;break}w=w.sibling}if(!_){for(w=u.child;w;){if(w===a){_=!0,a=u,r=c;break}if(w===r){_=!0,r=u,a=c;break}w=w.sibling}if(!_)throw Error(s(189))}}if(a.alternate!==r)throw Error(s(190))}if(a.tag!==3)throw Error(s(188));return a.stateNode.current===a?t:n}function S(t){var n=t.tag;if(n===5||n===26||n===27||n===6)return t;for(t=t.child;t!==null;){if(n=S(t),n!==null)return n;t=t.sibling}return null}function v(t,n,a,r,c,u){for(;t!==null;){if((t.tag===5||t.tag===27||t.tag===6)&&a(t,r,c,u)||(t.tag!==22||t.memoizedState===null)&&(n||t.tag!==5&&t.tag!==27)&&v(t.child,n,a,r,c,u))return!0;t=t.sibling}return!1}function g(t){for(t=t.return;t!==null;){if(t.tag===3||t.tag===5||t.tag===27)return t;t=t.return}return null}function M(t){var n=!1;for(t=t.return;t!==null&&(t.tag===4&&(n=!0),!(t.tag===3||t.tag===5||t.tag===27));)t=t.return;return n}function R(t){var n=[null,null],a=g(t);return a===null||C(n,t,a.child,{foundSelf:!1}),n}function C(t,n,a,r){for(;a!==null;){if(a===n)r.foundSelf=!0;else if(a.tag===5||a.tag===27||a.tag===6){if(r.foundSelf)return t[1]=a,!0;t[0]=a}else if((a.tag!==22||a.memoizedState===null)&&C(t,n,a.child,r))return!0;a=a.sibling}return!1}function y(t){switch(t.tag){case 5:case 27:case 6:return t.stateNode;case 3:return t.stateNode.containerInfo;default:throw Error(s(559))}}var x=null,D=null;function F(t,n,a){return t===a?!0:t===n?(x=t,!0):!1}function N(t,n,a){return t===a?(D=t,!1):t===n?(D!==null&&(x=t),!0):!1}function L(t){if(t===null)return null;do t=t===null?null:t.return;while(t&&t.tag!==5&&t.tag!==27&&t.tag!==3);return t||null}function U(t,n,a){for(var r=0,c=t;c;c=a(c))r++;c=0;for(var u=n;u;u=a(u))c++;for(;0<r-c;)t=a(t),r--;for(;0<c-r;)n=a(n),c--;for(;r--;){if(t===n||n!==null&&t===n.alternate)return t;t=a(t),n=a(n)}return null}var I=Object.assign,T=Symbol.for("react.element"),O=Symbol.for("react.transitional.element"),V=Symbol.for("react.portal"),Z=Symbol.for("react.fragment"),J=Symbol.for("react.strict_mode"),lt=Symbol.for("react.profiler"),q=Symbol.for("react.consumer"),nt=Symbol.for("react.context"),j=Symbol.for("react.forward_ref"),K=Symbol.for("react.suspense"),dt=Symbol.for("react.suspense_list"),ut=Symbol.for("react.memo"),mt=Symbol.for("react.lazy"),gt=Symbol.for("react.activity"),ie=Symbol.for("react.legacy_hidden"),ae=Symbol.for("react.memo_cache_sentinel"),B=Symbol.for("react.view_transition"),_t=Symbol.for("react.recoverable"),Rt=Symbol.iterator;function $(t){return t===null||typeof t!="object"?null:(t=Rt&&t[Rt]||t["@@iterator"],typeof t=="function"?t:null)}var pt=Symbol.for("react.client.reference");function Ct(t){if(t==null)return null;if(typeof t=="function")return t.$$typeof===pt?null:t.displayName||t.name||null;if(typeof t=="string")return t;switch(t){case Z:return"Fragment";case lt:return"Profiler";case J:return"StrictMode";case K:return"Suspense";case dt:return"SuspenseList";case gt:return"Activity";case B:return"ViewTransition"}if(typeof t=="object")switch(t.$$typeof){case V:return"Portal";case nt:return t.displayName||"Context";case q:return(t._context.displayName||"Context")+".Consumer";case j:var n=t.render;return t=t.displayName,t||(t=n.displayName||n.name||"",t=t!==""?"ForwardRef("+t+")":"ForwardRef"),t;case ut:return n=t.displayName||null,n!==null?n:Ct(t.type)||"Memo";case mt:n=t._payload,t=t._init;try{return Ct(t(n))}catch{}}return null}var Yt=Array.isArray,Mt=e.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE,Ot=i.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE,$e={pending:!1,data:null,method:null,action:null},Ee=[],Ae=-1;function Ne(t){return{current:t}}function ce(t){0>Ae||(t.current=Ee[Ae],Ee[Ae]=null,Ae--)}function fe(t,n){Ae++,Ee[Ae]=t.current,t.current=n}var Jt=Ne(null),Mn=Ne(null),je=Ne(null),fn=Ne(null);function Y(t,n){switch(fe(je,n),fe(Mn,t),fe(Jt,null),n.nodeType){case 9:case 11:t=(t=n.documentElement)&&(t=t.namespaceURI)?K_(t):0;break;default:if(t=n.tagName,n=n.namespaceURI)n=K_(n),t=Q_(n,t);else switch(t){case"svg":t=1;break;case"math":t=2;break;default:t=0}}ce(Jt),fe(Jt,t)}function pn(){ce(Jt),ce(Mn),ce(je)}function Ve(t){var n=t.memoizedState;n!==null&&(Ro._currentValue=n.memoizedState,fe(fn,t)),n=Jt.current;var a=Q_(n,t.type);n!==a&&(fe(Mn,t),fe(Jt,a))}function P(t){Mn.current===t&&(ce(Jt),ce(Mn)),fn.current===t&&(ce(fn),Ro._currentValue=$e)}var E,it;function rt(t){if(E===void 0)try{throw Error()}catch(a){var n=a.stack.trim().match(/\n( *(at )?)/);E=n&&n[1]||"",it=-1<a.stack.indexOf(`
    at`)?" (<anonymous>)":-1<a.stack.indexOf("@")?"@unknown:0:0":""}return`
`+E+t+it}var vt=!1;function Lt(t,n){if(!t||vt)return"";vt=!0;var a=Error.prepareStackTrace;Error.prepareStackTrace=void 0;try{var r={DetermineComponentFrameRoot:function(){try{if(n){var Tt=function(){throw Error()};if(Object.defineProperty(Tt.prototype,"props",{set:function(){throw Error()}}),typeof Reflect=="object"&&Reflect.construct){try{Reflect.construct(Tt,[])}catch(Xt){var Q=Xt}Reflect.construct(t,[],Tt)}else{try{Tt.call()}catch(Xt){Q=Xt}Tt=!1;try{var ct=Object.getOwnPropertyDescriptor(t.prototype,"props");Object.defineProperty(t.prototype,"props",{configurable:!0,set:function(){throw Error()}}),Tt=!0,new t}finally{Tt&&(ct!==void 0?Object.defineProperty(t.prototype,"props",ct):delete t.prototype.props)}}}else{try{throw Error()}catch(Xt){Q=Xt}(Tt=t())&&typeof Tt.catch=="function"&&Tt.catch(function(){})}}catch(Xt){if(Xt&&Q&&typeof Xt.stack=="string")return[Xt.stack,Q.stack]}return[null,null]}};r.DetermineComponentFrameRoot.displayName="DetermineComponentFrameRoot";var c=Object.getOwnPropertyDescriptor(r.DetermineComponentFrameRoot,"name");c&&c.configurable&&Object.defineProperty(r.DetermineComponentFrameRoot,"name",{value:"DetermineComponentFrameRoot"});var u=r.DetermineComponentFrameRoot(),_=u[0],w=u[1];if(_&&w){var z=_.split(`
`),et=w.split(`
`);for(c=r=0;r<z.length&&!z[r].includes("DetermineComponentFrameRoot");)r++;for(;c<et.length&&!et[c].includes("DetermineComponentFrameRoot");)c++;if(r===z.length||c===et.length)for(r=z.length-1,c=et.length-1;1<=r&&0<=c&&z[r]!==et[c];)c--;for(;1<=r&&0<=c;r--,c--)if(z[r]!==et[c]){if(r!==1||c!==1)do if(r--,c--,0>c||z[r]!==et[c]){var ht=`
`+z[r].replace(" at new "," at ");return t.displayName&&ht.includes("<anonymous>")&&(ht=ht.replace("<anonymous>",t.displayName)),ht}while(1<=r&&0<=c);break}}}finally{vt=!1,Error.prepareStackTrace=a}return(a=t?t.displayName||t.name:"")?rt(a):""}function Ft(t,n){switch(t.tag){case 26:case 27:case 5:return rt(t.type);case 16:return rt("Lazy");case 13:return t.child!==n&&n!==null?rt("Suspense Fallback"):rt("Suspense");case 19:return rt("SuspenseList");case 0:case 15:return Lt(t.type,!1);case 11:return Lt(t.type.render,!1);case 1:return Lt(t.type,!0);case 31:return rt("Activity");case 30:return rt("ViewTransition");default:return""}}function St(t){try{var n="",a=null;do n+=Ft(t,a),a=t,t=t.return;while(t);return n}catch(r){return`
Error generating stack: `+r.message+`
`+r.stack}}var Et=Object.prototype.hasOwnProperty,Ut=o.unstable_scheduleCallback,Gt=o.unstable_cancelCallback,Dt=o.unstable_shouldYield,zt=o.unstable_requestPaint,qt=o.unstable_now,le=o.unstable_getCurrentPriorityLevel,me=o.unstable_ImmediatePriority,W=o.unstable_UserBlockingPriority,Pt=o.unstable_NormalPriority,yt=o.unstable_LowPriority,Bt=o.unstable_IdlePriority,Wt=o.log,At=o.unstable_setDisableYieldValue,se=null,Ht=null;function Pe(t){if(typeof Wt=="function"&&At(t),Ht&&typeof Ht.setStrictMode=="function")try{Ht.setStrictMode(se,t)}catch{}}var _e=Math.clz32?Math.clz32:cr,ii=Math.log,di=Math.LN2;function cr(t){return t>>>=0,t===0?32:31-(ii(t)/di|0)|0}var Na=256,ts=262144,_a=4194304;function ai(t){var n=t&42;if(n!==0)return n;switch(t&-t){case 1:return 1;case 2:return 2;case 4:return 4;case 8:return 8;case 16:return 16;case 32:return 32;case 64:return 64;case 128:return 128;case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:return t&-t;case 262144:case 524288:case 1048576:case 2097152:return t&3932160;case 4194304:case 8388608:case 16777216:case 33554432:return t&62914560;case 67108864:return 67108864;case 134217728:return 134217728;case 268435456:return 268435456;case 536870912:return 536870912;case 1073741824:return 0;default:return t}}function Bi(t,n,a){var r=t.pendingLanes;if(r===0)return 0;var c=0,u=t.suspendedLanes,_=t.pingedLanes;t=t.warmLanes;var w=r&134217727;return w!==0?(r=w&~u,r!==0?c=ai(r):(_&=w,_!==0?c=ai(_):a||(a=w&~t,a!==0&&(c=ai(a))))):(w=r&~u,w!==0?c=ai(w):_!==0?c=ai(_):a||(a=r&~t,a!==0&&(c=ai(a)))),c===0?0:n!==0&&n!==c&&(n&u)===0&&(u=c&-c,a=n&-n,u>=a||u===32&&(a&4194048)!==0)?n:c}function Ie(t,n){return(t.pendingLanes&~(t.suspendedLanes&~t.pingedLanes)&n)===0}function ea(t,n){(n&8)!==0&&(n|=n&32);var a=t.entangledLanes;if(a!==0)for(t=t.entanglements,a&=n;0<a;){var r=31-_e(a),c=1<<r;n|=t[r],a&=~c}return n}function ur(t,n){switch(t){case 1:case 2:case 4:case 8:case 64:return n+250;case 16:case 32:case 128:case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:return n+5e3;case 4194304:case 8388608:case 16777216:case 33554432:return-1;case 67108864:case 134217728:case 268435456:case 536870912:case 1073741824:return-1;default:return-1}}function es(){var t=_a;return _a<<=1,(_a&62914560)===0&&(_a=4194304),t}function As(t){for(var n=[],a=0;31>a;a++)n.push(t);return n}function Ai(t,n){t.pendingLanes|=n,n!==268435456&&(t.suspendedLanes=0,t.pingedLanes=0,t.warmLanes=0)}function fr(t,n,a,r,c,u){var _=t.pendingLanes;t.pendingLanes=a,t.suspendedLanes=0,t.pingedLanes=0,t.warmLanes=0,t.expiredLanes&=a,t.entangledLanes&=a,t.errorRecoveryDisabledLanes&=a,t.shellSuspendCounter=0;var w=t.entanglements,z=t.expirationTimes,et=t.hiddenUpdates;for(a=_&~a;0<a;){var ht=31-_e(a),Tt=1<<ht;w[ht]=0,z[ht]=-1;var Q=et[ht];if(Q!==null)for(et[ht]=null,ht=0;ht<Q.length;ht++){var ct=Q[ht];ct!==null&&(ct.lane&=-536870913)}a&=~Tt}r!==0&&na(t,r,0),u!==0&&c===0&&t.tag!==0&&(t.suspendedLanes|=u&~(_&~n))}function na(t,n,a){t.pendingLanes|=n,t.suspendedLanes&=~n;var r=31-_e(n);t.entangledLanes|=n,t.entanglements[r]=t.entanglements[r]|1073741824|a&261930}function Da(t,n){var a=t.entangledLanes|=n;for(t=t.entanglements;a;){var r=31-_e(a),c=1<<r;c&n|t[r]&n&&(t[r]|=n),a&=~c}}function ns(t,n){var a=n&-n;return a=(a&42)!==0?1:hr(a),(a&(t.suspendedLanes|n))!==0?0:a}function hr(t){switch(t){case 2:t=1;break;case 8:t=4;break;case 32:t=16;break;case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:case 4194304:case 8388608:case 16777216:case 33554432:t=128;break;case 268435456:t=134217728;break;default:t=0}return t}function Ua(t){return t&=-t,2<t?8<t?(t&134217727)!==0?32:268435456:8:2}function Rs(){var t=Ot.p;return t!==0?t:(t=window.event,t===void 0?32:Ov(t.type))}function La(t,n){var a=Ot.p;try{return Ot.p=t,n()}finally{Ot.p=a}}var pi=Math.random().toString(36).slice(2),A="__reactFiber$"+pi,H="__reactProps$"+pi,ft="__reactContainer$"+pi,st="__reactEvents$"+pi,ot="__reactListeners$"+pi,jt="__reactHandles$"+pi,$t="__reactResources$"+pi,It="__reactMarker$"+pi,ee="__reactLoad$"+pi;function te(t){delete t[A],delete t[H],delete t[ot],delete t[jt]}function de(t){var n;if(n=t[A])return n;for(var a=t.parentNode;a;){if(n=a[ft]||a[A]){if(a=n.alternate,n.child!==null||a!==null&&a.child!==null)for(t=pv(t);t!==null;){if(a=t[A])return a;t=pv(t)}return n}t=a,a=t.parentNode}return null}function ve(t){if(t=t[A]||t[ft]){var n=t.tag;if(n===5||n===6||n===13||n===31||n===26||n===27||n===3)return t}return null}function Qt(t){var n=t.tag;if(n===5||n===26||n===27||n===6)return t.stateNode;throw Error(s(33))}function Ue(t){var n=t[$t];return n||(n=t[$t]={hoistableStyles:new Map,hoistableScripts:new Map}),n}function be(t){t[It]=!0}function Ze(t){t[ee]=void 0}var Ye=new Set,Tn={};function Zt(t,n){_n(t,n),_n(t+"Capture",n)}function _n(t,n){for(Tn[t]=n,t=0;t<n.length;t++)Ye.add(n[t])}var ze=RegExp("^[:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD][:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD\\-.0-9\\u00B7\\u0300-\\u036F\\u203F-\\u2040]*$"),Zn={},si={};function Ri(t){return Et.call(si,t)?!0:Et.call(Zn,t)?!1:ze.test(t)?si[t]=!0:(Zn[t]=!0,!1)}var Ce=!1;function Ke(){var t=Ce;return Ce=!1,t}function sn(t,n,a){if(Ri(n))if(a===null)t.removeAttribute(n);else{switch(typeof a){case"undefined":case"function":case"symbol":t.removeAttribute(n);return;case"boolean":var r=n.toLowerCase().slice(0,5);if(r!=="data-"&&r!=="aria-"){t.removeAttribute(n);return}}t.setAttribute(n,a)}}function ri(t,n,a){if(a===null)t.removeAttribute(n);else{switch(typeof a){case"undefined":case"function":case"symbol":case"boolean":t.removeAttribute(n);return}t.setAttribute(n,a)}}function X(t,n,a,r){if(r===null)t.removeAttribute(a);else{switch(typeof r){case"undefined":case"function":case"symbol":case"boolean":t.removeAttribute(a);return}t.setAttributeNS(n,a,r)}}function xt(t){switch(typeof t){case"bigint":case"boolean":case"number":case"string":case"undefined":return t;case"object":return t;default:return""}}function Nt(t){var n=t.type;return(t=t.nodeName)&&t.toLowerCase()==="input"&&(n==="checkbox"||n==="radio")}function wt(t,n,a){var r=Object.getOwnPropertyDescriptor(t.constructor.prototype,n);if(!t.hasOwnProperty(n)&&typeof r<"u"&&typeof r.get=="function"&&typeof r.set=="function"){var c=r.get,u=r.set;return Object.defineProperty(t,n,{configurable:!0,get:function(){return c.call(this)},set:function(_){a=""+_,u.call(this,_)}}),Object.defineProperty(t,n,{enumerable:r.enumerable}),{getValue:function(){return a},setValue:function(_){a=""+_},stopTracking:function(){t._valueTracker=null,delete t[n]}}}}function oe(t){if(!t._valueTracker){var n=Nt(t)?"checked":"value";t._valueTracker=wt(t,n,""+t[n])}}function Vt(t){if(!t)return!1;var n=t._valueTracker;if(!n)return!0;var a=n.getValue(),r="";return t&&(r=Nt(t)?t.checked?"true":"false":t.value),t=r,t!==a?(n.setValue(t),!0):!1}var kt=/[\n"\\]/g;function ge(t){return t.replace(kt,function(n){return"\\"+n.charCodeAt(0).toString(16)+" "})}function Se(t,n,a,r,c,u,_,w){t.name="",_!=null&&typeof _!="function"&&typeof _!="symbol"&&typeof _!="boolean"?t.type=_:t.removeAttribute("type"),n!=null?_==="number"?(n===0&&t.value===""||t.value!=n)&&(t.value=""+xt(n)):t.value!==""+xt(n)&&(t.value=""+xt(n)):_!=="submit"&&_!=="reset"||t.removeAttribute("value"),n!=null?_==="number"&&t.value==n?oi(t,xt(t.value)):oi(t,xt(n)):a!=null?oi(t,xt(a)):r!=null&&t.removeAttribute("value"),c==null&&u!=null&&(t.defaultChecked=!!u),c!=null&&(t.checked=c&&typeof c!="function"&&typeof c!="symbol"),w!=null&&typeof w!="function"&&typeof w!="symbol"&&typeof w!="boolean"?t.name=""+xt(w):t.removeAttribute("name")}function mi(t,n,a,r,c,u,_,w){if(u!=null&&typeof u!="function"&&typeof u!="symbol"&&typeof u!="boolean"&&(t.type=u),n!=null||a!=null){if(!(u!=="submit"&&u!=="reset"||n!=null)){oe(t);return}a=a!=null?""+xt(a):"",n=n!=null?""+xt(n):a,w||n===t.value||(t.value=n),t.defaultValue=n}r=r??c,r=typeof r!="function"&&typeof r!="symbol"&&!!r,t.checked=w?t.checked:!!r,t.defaultChecked=!!r,_!=null&&typeof _!="function"&&typeof _!="symbol"&&typeof _!="boolean"&&(t.name=_),oe(t)}function oi(t,n){t.defaultValue!==""+n&&(t.defaultValue=""+n)}function Fi(t,n,a,r){if(t=t.options,n){n={};for(var c=0;c<a.length;c++)n["$"+a[c]]=!0;for(a=0;a<t.length;a++)c=n.hasOwnProperty("$"+t[a].value),t[a].selected!==c&&(t[a].selected=c),c&&r&&(t[a].defaultSelected=!0)}else{for(a=""+xt(a),n=null,c=0;c<t.length;c++){if(t[c].value===a){t[c].selected=!0,r&&(t[c].defaultSelected=!0);return}n!==null||t[c].disabled||(n=t[c])}n!==null&&(n.selected=!0)}}function va(t,n,a){if(n!=null&&(n=""+xt(n),n!==t.value&&(t.value=n),a==null)){t.defaultValue!==n&&(t.defaultValue=n);return}t.defaultValue=a!=null?""+xt(a):""}function tn(t,n,a,r){if(n==null){if(r!=null){if(a!=null)throw Error(s(92));if(Yt(r)){if(1<r.length)throw Error(s(93));r=r[0]}a=r}a==null&&(a=""),n=a}a=xt(n),t.defaultValue=a,r=t.textContent,r===a&&r!==""&&r!==null&&(t.value=r),oe(t)}function nn(t,n){if(n){var a=t.firstChild;if(a&&a===t.lastChild&&a.nodeType===3){a.nodeValue=n;return}}t.textContent=n}var Un=new Set("animationIterationCount aspectRatio borderImageOutset borderImageSlice borderImageWidth boxFlex boxFlexGroup boxOrdinalGroup columnCount columns flex flexGrow flexPositive flexShrink flexNegative flexOrder gridArea gridRow gridRowEnd gridRowSpan gridRowStart gridColumn gridColumnEnd gridColumnSpan gridColumnStart fontWeight lineClamp lineHeight opacity order orphans scale tabSize widows zIndex zoom fillOpacity floodOpacity stopOpacity strokeDasharray strokeDashoffset strokeMiterlimit strokeOpacity strokeWidth MozAnimationIterationCount MozBoxFlex MozBoxFlexGroup MozLineClamp msAnimationIterationCount msFlex msZoom msFlexGrow msFlexNegative msFlexOrder msFlexPositive msFlexShrink msGridColumn msGridColumnSpan msGridRow msGridRowSpan WebkitAnimationIterationCount WebkitBoxFlex WebKitBoxFlexGroup WebkitBoxOrdinalGroup WebkitColumnCount WebkitColumns WebkitFlex WebkitFlexGrow WebkitFlexPositive WebkitFlexShrink WebkitLineClamp".split(" "));function Hi(t,n,a){var r=n.indexOf("--")===0;a==null||typeof a=="boolean"||a===""?r?t.setProperty(n,""):n==="float"?t.cssFloat="":t[n]="":r?t.setProperty(n,a):typeof a!="number"||a===0||Un.has(n)?n==="float"?t.cssFloat=a:t[n]=(""+a).trim():t[n]=a+"px"}function vn(t,n,a){if(n!=null&&typeof n!="object")throw Error(s(62));if(t=t.style,a!=null){for(var r in a)!a.hasOwnProperty(r)||n!=null&&n.hasOwnProperty(r)||(r.indexOf("--")===0?t.setProperty(r,""):r==="float"?t.cssFloat="":t[r]="",Ce=!0);for(var c in n)r=n[c],n.hasOwnProperty(c)&&a[c]!==r&&(Hi(t,c,r),Ce=!0)}else for(var u in n)n.hasOwnProperty(u)&&Hi(t,u,n[u])}function Oa(t){if(t.indexOf("-")===-1)return!1;switch(t){case"annotation-xml":case"color-profile":case"font-face":case"font-face-src":case"font-face-uri":case"font-face-format":case"font-face-name":case"missing-glyph":return!1;default:return!0}}var wi=new Map([["acceptCharset","accept-charset"],["htmlFor","for"],["httpEquiv","http-equiv"],["crossOrigin","crossorigin"],["accentHeight","accent-height"],["alignmentBaseline","alignment-baseline"],["arabicForm","arabic-form"],["baselineShift","baseline-shift"],["capHeight","cap-height"],["clipPath","clip-path"],["clipRule","clip-rule"],["colorInterpolation","color-interpolation"],["colorInterpolationFilters","color-interpolation-filters"],["colorProfile","color-profile"],["colorRendering","color-rendering"],["dominantBaseline","dominant-baseline"],["enableBackground","enable-background"],["fillOpacity","fill-opacity"],["fillRule","fill-rule"],["floodColor","flood-color"],["floodOpacity","flood-opacity"],["fontFamily","font-family"],["fontSize","font-size"],["fontSizeAdjust","font-size-adjust"],["fontStretch","font-stretch"],["fontStyle","font-style"],["fontVariant","font-variant"],["fontWeight","font-weight"],["glyphName","glyph-name"],["glyphOrientationHorizontal","glyph-orientation-horizontal"],["glyphOrientationVertical","glyph-orientation-vertical"],["horizAdvX","horiz-adv-x"],["horizOriginX","horiz-origin-x"],["imageRendering","image-rendering"],["letterSpacing","letter-spacing"],["lightingColor","lighting-color"],["markerEnd","marker-end"],["markerMid","marker-mid"],["markerStart","marker-start"],["maskType","mask-type"],["overlinePosition","overline-position"],["overlineThickness","overline-thickness"],["paintOrder","paint-order"],["panose-1","panose-1"],["pointerEvents","pointer-events"],["renderingIntent","rendering-intent"],["shapeRendering","shape-rendering"],["stopColor","stop-color"],["stopOpacity","stop-opacity"],["strikethroughPosition","strikethrough-position"],["strikethroughThickness","strikethrough-thickness"],["strokeDasharray","stroke-dasharray"],["strokeDashoffset","stroke-dashoffset"],["strokeLinecap","stroke-linecap"],["strokeLinejoin","stroke-linejoin"],["strokeMiterlimit","stroke-miterlimit"],["strokeOpacity","stroke-opacity"],["strokeWidth","stroke-width"],["textAnchor","text-anchor"],["textDecoration","text-decoration"],["textRendering","text-rendering"],["transformOrigin","transform-origin"],["underlinePosition","underline-position"],["underlineThickness","underline-thickness"],["unicodeBidi","unicode-bidi"],["unicodeRange","unicode-range"],["unitsPerEm","units-per-em"],["vAlphabetic","v-alphabetic"],["vHanging","v-hanging"],["vIdeographic","v-ideographic"],["vMathematical","v-mathematical"],["vectorEffect","vector-effect"],["vertAdvY","vert-adv-y"],["vertOriginX","vert-origin-x"],["vertOriginY","vert-origin-y"],["wordSpacing","word-spacing"],["writingMode","writing-mode"],["xmlnsXlink","xmlns:xlink"],["xHeight","x-height"]]),qr=/^[\u0000-\u001F ]*j[\r\n\t]*a[\r\n\t]*v[\r\n\t]*a[\r\n\t]*s[\r\n\t]*c[\r\n\t]*r[\r\n\t]*i[\r\n\t]*p[\r\n\t]*t[\r\n\t]*:/i;function Gi(t){return qr.test(""+t)?"javascript:throw new Error('React has blocked a javascript: URL as a security precaution.')":t}function ia(){}var dr=null;function pr(t){return t=t.target||t.srcElement||window,t.correspondingUseElement&&(t=t.correspondingUseElement),t.nodeType===3?t.parentNode:t}var wn=null,Vn=null;function Ci(t){var n=ve(t);if(n&&(t=n.stateNode)){var a=t[H]||null;t:switch(t=n.stateNode,n.type){case"input":if(Se(t,a.value,a.defaultValue,a.defaultValue,a.checked,a.defaultChecked,a.type,a.name),n=a.name,a.type==="radio"&&n!=null){for(a=t;a.parentNode;)a=a.parentNode;for(a=a.querySelectorAll('input[name="'+ge(""+n)+'"][type="radio"]'),n=0;n<a.length;n++){var r=a[n];if(r!==t&&r.form===t.form){var c=r[H]||null;if(!c)throw Error(s(90));Se(r,c.value,c.defaultValue,c.defaultValue,c.checked,c.defaultChecked,c.type,c.name)}}for(n=0;n<a.length;n++)r=a[n],r.form===t.form&&Vt(r)}break t;case"textarea":va(t,a.value,a.defaultValue);break t;case"select":n=a.value,n!=null&&Fi(t,!!a.multiple,n,!1)}}}var gi=!1;function _i(t,n,a){if(gi)return t(n,a);gi=!0;try{var r=t(n);return r}finally{if(gi=!1,(wn!==null||Vn!==null)&&(fu(),wn&&(n=wn,t=Vn,Vn=wn=null,Ci(n),t)))for(n=0;n<t.length;n++)Ci(t[n])}}function mr(t,n){var a=t.stateNode;if(a===null)return null;var r=a[H]||null;if(r===null)return null;a=r[n];t:switch(n){case"onClick":case"onClickCapture":case"onDoubleClick":case"onDoubleClickCapture":case"onMouseDown":case"onMouseDownCapture":case"onMouseMove":case"onMouseMoveCapture":case"onMouseUp":case"onMouseUpCapture":case"onMouseEnter":(r=!r.disabled)||(t=t.type,r=!(t==="button"||t==="input"||t==="select"||t==="textarea")),t=!r;break t;default:t=!1}if(t)return null;if(a&&typeof a!="function")throw Error(s(231,n,typeof a));return a}var li=!(typeof window>"u"||typeof window.document>"u"||typeof window.document.createElement>"u"),bf=!1;if(li)try{var $o={};Object.defineProperty($o,"passive",{get:function(){bf=!0}}),window.addEventListener("test",$o,$o),window.removeEventListener("test",$o,$o)}catch{bf=!1}var ws=null,Tf=null,hc=null;function Ym(){if(hc)return hc;var t,n=Tf,a=n.length,r,c="value"in ws?ws.value:ws.textContent,u=c.length;for(t=0;t<a&&n[t]===c[t];t++);var _=a-t;for(r=1;r<=_&&n[a-r]===c[u-r];r++);return hc=c.slice(t,1<r?1-r:void 0)}function dc(t){var n=t.keyCode;return"charCode"in t?(t=t.charCode,t===0&&n===13&&(t=13)):t=n,t===10&&(t=13),32<=t||t===13?t:0}function pc(){return!0}function qm(){return!1}function vi(t){function n(a,r,c,u,_){this._reactName=a,this._targetInst=c,this.type=r,this.nativeEvent=u,this.target=_,this.currentTarget=null;for(var w in t)t.hasOwnProperty(w)&&(a=t[w],this[w]=a?a(u):u[w]);return this.isDefaultPrevented=(u.defaultPrevented!=null?u.defaultPrevented:u.returnValue===!1)?pc:qm,this.isPropagationStopped=qm,this}return I(n.prototype,{preventDefault:function(){this.defaultPrevented=!0;var a=this.nativeEvent;a&&(a.preventDefault?a.preventDefault():typeof a.returnValue!="unknown"&&(a.returnValue=!1),this.isDefaultPrevented=pc)},stopPropagation:function(){var a=this.nativeEvent;a&&(a.stopPropagation?a.stopPropagation():typeof a.cancelBubble!="unknown"&&(a.cancelBubble=!0),this.isPropagationStopped=pc)},persist:function(){},isPersistent:pc}),n}var Cs={eventPhase:0,bubbles:0,cancelable:0,timeStamp:function(t){return t.timeStamp||Date.now()},defaultPrevented:0,isTrusted:0},mc=vi(Cs),tl=I({},Cs,{view:0,detail:0}),$S=vi(tl),Af,Rf,el,gc=I({},tl,{screenX:0,screenY:0,clientX:0,clientY:0,pageX:0,pageY:0,ctrlKey:0,shiftKey:0,altKey:0,metaKey:0,getModifierState:Cf,button:0,buttons:0,relatedTarget:function(t){return t.relatedTarget===void 0?t.fromElement===t.srcElement?t.toElement:t.fromElement:t.relatedTarget},movementX:function(t){return"movementX"in t?t.movementX:(t!==el&&(el&&t.type==="mousemove"?(Af=t.screenX-el.screenX,Rf=t.screenY-el.screenY):Rf=Af=0,el=t),Af)},movementY:function(t){return"movementY"in t?t.movementY:Rf}}),jm=vi(gc),ty=I({},gc,{dataTransfer:0}),ey=vi(ty),ny=I({},tl,{relatedTarget:0}),wf=vi(ny),iy=I({},Cs,{animationName:0,elapsedTime:0,pseudoElement:0}),ay=vi(iy),sy=I({},Cs,{clipboardData:function(t){return"clipboardData"in t?t.clipboardData:window.clipboardData}}),ry=vi(sy),oy=I({},Cs,{data:0}),Zm=vi(oy),ly={Esc:"Escape",Spacebar:" ",Left:"ArrowLeft",Up:"ArrowUp",Right:"ArrowRight",Down:"ArrowDown",Del:"Delete",Win:"OS",Menu:"ContextMenu",Apps:"ContextMenu",Scroll:"ScrollLock",MozPrintableKey:"Unidentified"},cy={8:"Backspace",9:"Tab",12:"Clear",13:"Enter",16:"Shift",17:"Control",18:"Alt",19:"Pause",20:"CapsLock",27:"Escape",32:" ",33:"PageUp",34:"PageDown",35:"End",36:"Home",37:"ArrowLeft",38:"ArrowUp",39:"ArrowRight",40:"ArrowDown",45:"Insert",46:"Delete",112:"F1",113:"F2",114:"F3",115:"F4",116:"F5",117:"F6",118:"F7",119:"F8",120:"F9",121:"F10",122:"F11",123:"F12",144:"NumLock",145:"ScrollLock",224:"Meta"},uy={Alt:"altKey",Control:"ctrlKey",Meta:"metaKey",Shift:"shiftKey"};function fy(t){var n=this.nativeEvent;return n.getModifierState?n.getModifierState(t):(t=uy[t])?!!n[t]:!1}function Cf(){return fy}var hy=I({},tl,{key:function(t){if(t.key){var n=ly[t.key]||t.key;if(n!=="Unidentified")return n}return t.type==="keypress"?(t=dc(t),t===13?"Enter":String.fromCharCode(t)):t.type==="keydown"||t.type==="keyup"?cy[t.keyCode]||"Unidentified":""},code:0,location:0,ctrlKey:0,shiftKey:0,altKey:0,metaKey:0,repeat:0,locale:0,getModifierState:Cf,charCode:function(t){return t.type==="keypress"?dc(t):0},keyCode:function(t){return t.type==="keydown"||t.type==="keyup"?t.keyCode:0},which:function(t){return t.type==="keypress"?dc(t):t.type==="keydown"||t.type==="keyup"?t.keyCode:0}}),dy=vi(hy),py=I({},gc,{pointerId:0,width:0,height:0,pressure:0,tangentialPressure:0,tiltX:0,tiltY:0,twist:0,pointerType:0,isPrimary:0}),Km=vi(py),my=I({},Cs,{submitter:0}),gy=vi(my),_y=I({},tl,{touches:0,targetTouches:0,changedTouches:0,altKey:0,metaKey:0,ctrlKey:0,shiftKey:0,getModifierState:Cf}),vy=vi(_y),xy=I({},Cs,{propertyName:0,elapsedTime:0,pseudoElement:0}),Sy=vi(xy),yy=I({},gc,{deltaX:function(t){return"deltaX"in t?t.deltaX:"wheelDeltaX"in t?-t.wheelDeltaX:0},deltaY:function(t){return"deltaY"in t?t.deltaY:"wheelDeltaY"in t?-t.wheelDeltaY:"wheelDelta"in t?-t.wheelDelta:0},deltaZ:0,deltaMode:0}),My=vi(yy),Ey=I({},Cs,{newState:0,oldState:0,source:0}),by=vi(Ey),Ty=[9,13,27,32],Nf=li&&"CompositionEvent"in window,nl=null;li&&"documentMode"in document&&(nl=document.documentMode);var Ay=li&&"TextEvent"in window&&!nl,Qm=li&&(!Nf||nl&&8<nl&&11>=nl),Jm=" ",$m=!1;function t0(t,n){switch(t){case"keyup":return Ty.indexOf(n.keyCode)!==-1;case"keydown":return n.keyCode!==229;case"keypress":case"mousedown":case"focusout":return!0;default:return!1}}function e0(t){return t=t.detail,typeof t=="object"&&"data"in t?t.data:null}var jr=!1;function Ry(t,n){switch(t){case"compositionend":return e0(n);case"keypress":return n.which!==32?null:($m=!0,Jm);case"textInput":return t=n.data,t===Jm&&$m?null:t;default:return null}}function wy(t,n){if(jr)return t==="compositionend"||!Nf&&t0(t,n)?(t=Ym(),hc=Tf=ws=null,jr=!1,t):null;switch(t){case"paste":return null;case"keypress":if(!(n.ctrlKey||n.altKey||n.metaKey)||n.ctrlKey&&n.altKey){if(n.char&&1<n.char.length)return n.char;if(n.which)return String.fromCharCode(n.which)}return null;case"compositionend":return Qm&&n.locale!=="ko"?null:n.data;default:return null}}var Cy={color:!0,date:!0,datetime:!0,"datetime-local":!0,email:!0,month:!0,number:!0,password:!0,range:!0,search:!0,tel:!0,text:!0,time:!0,url:!0,week:!0};function n0(t){var n=t&&t.nodeName&&t.nodeName.toLowerCase();return n==="input"?!!Cy[t.type]:n==="textarea"}function i0(t,n,a,r){wn?Vn?Vn.push(r):Vn=[r]:wn=r,n=_u(n,"onChange"),0<n.length&&(a=new mc("onChange","change",null,a,r),t.push({event:a,listeners:n}))}var il=null,al=null;function Ny(t){X_(t,0)}function _c(t){var n=Qt(t);if(Vt(n))return t}function a0(t,n){if(t==="change")return n}var s0=!1;if(li){var Df;if(li){var Uf="oninput"in document;if(!Uf){var r0=document.createElement("div");r0.setAttribute("oninput","return;"),Uf=typeof r0.oninput=="function"}Df=Uf}else Df=!1;s0=Df&&(!document.documentMode||9<document.documentMode)}function o0(){il&&(il.detachEvent("onpropertychange",l0),al=il=null)}function l0(t){if(t.propertyName==="value"&&_c(al)){var n=[];i0(n,al,t,pr(t)),_i(Ny,n)}}function Dy(t,n,a){t==="focusin"?(o0(),il=n,al=a,il.attachEvent("onpropertychange",l0)):t==="focusout"&&o0()}function Uy(t){if(t==="selectionchange"||t==="keyup"||t==="keydown")return _c(al)}function Ly(t,n){if(t==="click")return _c(n)}function Oy(t,n){if(t==="input"||t==="change")return _c(n)}function Py(t,n){return t===n&&(t!==0||1/t===1/n)||t!==t&&n!==n}var Vi=typeof Object.is=="function"?Object.is:Py;function sl(t,n){if(Vi(t,n))return!0;if(typeof t!="object"||t===null||typeof n!="object"||n===null)return!1;var a=Object.keys(t),r=Object.keys(n);if(a.length!==r.length)return!1;for(r=0;r<a.length;r++){var c=a[r];if(!Et.call(n,c)||!Vi(t[c],n[c]))return!1}return!0}function Lf(t){if(t=t||(typeof document<"u"?document:void 0),typeof t>"u")return null;try{return t.activeElement||t.body}catch{return t.body}}function c0(t){for(;t&&t.firstChild;)t=t.firstChild;return t}function u0(t,n){var a=c0(t);t=0;for(var r;a;){if(a.nodeType===3){if(r=t+a.textContent.length,t<=n&&r>=n)return{node:a,offset:n-t};t=r}t:{for(;a;){if(a.nextSibling){a=a.nextSibling;break t}a=a.parentNode}a=void 0}a=c0(a)}}function f0(t,n){return t&&n?t===n?!0:t&&t.nodeType===3?!1:n&&n.nodeType===3?f0(t,n.parentNode):"contains"in t?t.contains(n):t.compareDocumentPosition?!!(t.compareDocumentPosition(n)&16):!1:!1}function h0(t){t=t!=null&&t.ownerDocument!=null&&t.ownerDocument.defaultView!=null?t.ownerDocument.defaultView:window;for(var n=Lf(t.document);n instanceof t.HTMLIFrameElement;){try{var a=typeof n.contentWindow.location.href=="string"}catch{a=!1}if(a)t=n.contentWindow;else break;n=Lf(t.document)}return n}function Of(t){var n=t&&t.nodeName&&t.nodeName.toLowerCase();return n&&(n==="input"&&(t.type==="text"||t.type==="search"||t.type==="tel"||t.type==="url"||t.type==="password")||n==="textarea"||t.contentEditable==="true")}var Iy=li&&"documentMode"in document&&11>=document.documentMode,Zr=null,Pf=null,rl=null,If=!1;function d0(t,n,a){var r=a.window===a?a.document:a.nodeType===9?a:a.ownerDocument;If||Zr==null||Zr!==Lf(r)||(r=Zr,"selectionStart"in r&&Of(r)?r={start:r.selectionStart,end:r.selectionEnd}:(r=(r.ownerDocument&&r.ownerDocument.defaultView||window).getSelection(),r={anchorNode:r.anchorNode,anchorOffset:r.anchorOffset,focusNode:r.focusNode,focusOffset:r.focusOffset}),rl&&sl(rl,r)||(rl=r,r=_u(Pf,"onSelect"),0<r.length&&(n=new mc("onSelect","select",null,n,a),t.push({event:n,listeners:r}),n.target=Zr)))}function gr(t,n){var a={};return a[t.toLowerCase()]=n.toLowerCase(),a["Webkit"+t]="webkit"+n,a["Moz"+t]="moz"+n,a}var Kr={animationend:gr("Animation","AnimationEnd"),animationiteration:gr("Animation","AnimationIteration"),animationstart:gr("Animation","AnimationStart"),transitionrun:gr("Transition","TransitionRun"),transitionstart:gr("Transition","TransitionStart"),transitioncancel:gr("Transition","TransitionCancel"),transitionend:gr("Transition","TransitionEnd")},zf={},p0={};li&&(p0=document.createElement("div").style,"AnimationEvent"in window||(delete Kr.animationend.animation,delete Kr.animationiteration.animation,delete Kr.animationstart.animation),"TransitionEvent"in window||delete Kr.transitionend.transition);function _r(t){if(zf[t])return zf[t];if(!Kr[t])return t;var n=Kr[t],a;for(a in n)if(n.hasOwnProperty(a)&&a in p0)return zf[t]=n[a];return t}var m0=_r("animationend"),g0=_r("animationiteration"),_0=_r("animationstart"),zy=_r("transitionrun"),By=_r("transitionstart"),Fy=_r("transitioncancel"),v0=_r("transitionend"),x0=new Map,Bf="abort auxClick beforeToggle cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error fullscreenChange fullscreenError gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel".split(" ");Bf.push("scrollEnd");function xa(t,n){x0.set(t,n),Zt(n,[t])}var Hy=0;function is(t,n){if(t.name!=null&&t.name!=="auto")return t.name;if(n.autoName!==null)return n.autoName;t=Ea.identifierPrefix;var a=Hy++;return t="_"+t+"t_"+a.toString(32)+"_",n.autoName=t}function S0(t){if(t==null||typeof t=="string")return t;var n=null,a=_o;if(a!==null)for(var r=0;r<a.length;r++){var c=t[a[r]];if(c!=null){if(c==="none")return"none";n=n==null?c:n+(" "+c)}}return n??t.default}function as(t,n){return t=S0(t),n=S0(n),n==null?t==="auto"?null:t:n==="auto"?null:n}var vc=typeof reportError=="function"?reportError:function(t){if(typeof window=="object"&&typeof window.ErrorEvent=="function"){var n=new window.ErrorEvent("error",{bubbles:!0,cancelable:!0,message:typeof t=="object"&&t!==null&&typeof t.message=="string"?String(t.message):String(t),error:t});if(!window.dispatchEvent(n))return}else if(typeof process=="object"&&typeof process.emit=="function"){process.emit("uncaughtException",t);return}console.error(t)},aa=[],Qr=0,Ff=0;function xc(){for(var t=Qr,n=Ff=Qr=0;n<t;){var a=aa[n];aa[n++]=null;var r=aa[n];aa[n++]=null;var c=aa[n];aa[n++]=null;var u=aa[n];if(aa[n++]=null,r!==null&&c!==null){var _=r.pending;_===null?c.next=c:(c.next=_.next,_.next=c),r.pending=c}u!==0&&y0(a,c,u)}}function Sc(t,n,a,r){aa[Qr++]=t,aa[Qr++]=n,aa[Qr++]=a,aa[Qr++]=r,Ff|=r,t.lanes|=r,t=t.alternate,t!==null&&(t.lanes|=r)}function Hf(t,n,a,r){return Sc(t,n,a,r),yc(t)}function vr(t,n){return Sc(t,null,null,n),yc(t)}function y0(t,n,a){t.lanes|=a;var r=t.alternate;r!==null&&(r.lanes|=a);for(var c=!1,u=t.return;u!==null;)u.childLanes|=a,r=u.alternate,r!==null&&(r.childLanes|=a),u.tag===22&&(t=u.stateNode,t===null||t._visibility&1||(c=!0)),t=u,u=u.return;return t.tag===3?(u=t.stateNode,c&&n!==null&&(c=31-_e(a),t=u.hiddenUpdates,r=t[c],r===null?t[c]=[n]:r.push(n),n.lane=a|536870912),u):null}function yc(t){if(50<wl)throw wl=0,uu=null,Error(s(185));for(var n=t.return;n!==null;)t=n,n=t.return;return t.tag===3?t.stateNode:null}var Jr={};function Gy(t,n,a,r){this.tag=t,this.key=a,this.sibling=this.child=this.return=this.stateNode=this.type=this.elementType=null,this.index=0,this.refCleanup=this.ref=null,this.pendingProps=n,this.dependencies=this.memoizedState=this.updateQueue=this.memoizedProps=null,this.mode=r,this.subtreeFlags=this.flags=0,this.deletions=null,this.childLanes=this.lanes=0,this.alternate=null}function Ni(t,n,a,r){return new Gy(t,n,a,r)}function Gf(t){return t=t.prototype,!(!t||!t.isReactComponent)}function ss(t,n){var a=t.alternate;return a===null?(a=Ni(t.tag,n,t.key,t.mode),a.elementType=t.elementType,a.type=t.type,a.stateNode=t.stateNode,a.alternate=t,t.alternate=a):(a.pendingProps=n,a.type=t.type,a.flags=0,a.subtreeFlags=0,a.deletions=null),a.flags=t.flags&1206910976,a.childLanes=t.childLanes,a.lanes=t.lanes,a.child=t.child,a.memoizedProps=t.memoizedProps,a.memoizedState=t.memoizedState,a.updateQueue=t.updateQueue,n=t.dependencies,a.dependencies=n===null?null:{lanes:n.lanes,firstContext:n.firstContext},a.sibling=t.sibling,a.index=t.index,a.ref=t.ref,a.refCleanup=t.refCleanup,a}function M0(t,n){t.flags&=1206910978;var a=t.alternate;return a===null?(t.childLanes=0,t.lanes=n,t.child=null,t.subtreeFlags=0,t.memoizedProps=null,t.memoizedState=null,t.updateQueue=null,t.dependencies=null,t.stateNode=null):(t.childLanes=a.childLanes,t.lanes=a.lanes,t.child=a.child,t.subtreeFlags=0,t.deletions=null,t.memoizedProps=a.memoizedProps,t.memoizedState=a.memoizedState,t.updateQueue=a.updateQueue,t.type=a.type,n=a.dependencies,t.dependencies=n===null?null:{lanes:n.lanes,firstContext:n.firstContext}),t}function Mc(t,n,a,r,c,u){var _=0;if(r=t,typeof r=="function")Gf(r)&&(_=1);else if(typeof r=="string")_=mE(t,a,Jt.current)?26:t==="html"||t==="head"||t==="body"?27:5;else t:switch(r){case gt:return t=Ni(31,a,n,c),t.elementType=gt,t.lanes=u,t;case Z:return xr(a.children,c,u,n);case J:_=8,c|=24;break;case lt:return t=Ni(12,a,n,c|2),t.elementType=lt,t.lanes=u,t;case K:return t=Ni(13,a,n,c),t.elementType=K,t.lanes=u,t;case dt:return t=Ni(19,a,n,c),t.elementType=dt,t.lanes=u,t;case ie:case B:return t=c|32,t=Ni(30,a,n,t),t.elementType=B,t.lanes=u,t.stateNode={autoName:null,paired:null,clones:null,ref:null},t;default:if(typeof r=="object"&&r!==null)switch(r.$$typeof){case nt:_=10;break t;case q:_=9;break t;case j:_=11;break t;case ut:_=14;break t;case mt:_=16,r=null;break t}_=29,a=Error(s(130,t===null?"null":typeof t,"")),r=null}return n=Ni(_,a,n,c),n.elementType=t,n.type=r,n.lanes=u,n}function xr(t,n,a,r){return t=Ni(7,t,r,n),t.lanes=a,t}function Vf(t,n,a){return t=Ni(6,t,null,n),t.lanes=a,t}function E0(t){var n=Ni(18,null,null,0);return n.stateNode=t,n}function kf(t,n,a){return n=Ni(4,t.children!==null?t.children:[],t.key,n),n.lanes=a,n.stateNode={containerInfo:t.containerInfo,pendingChildren:null,implementation:t.implementation},n}var b0=new WeakMap;function sa(t,n){if(typeof t=="object"&&t!==null){var a=b0.get(t);return a!==void 0?a:(n={value:t,source:n,stack:St(n)},b0.set(t,n),n)}return{value:t,source:n,stack:St(n)}}var $r=[],to=0,Ec=null,ol=0,ra=[],oa=0,Ns=null,Pa=1,Ia="";function rs(t,n){$r[to++]=ol,$r[to++]=Ec,Ec=t,ol=n}function T0(t,n,a){ra[oa++]=Pa,ra[oa++]=Ia,ra[oa++]=Ns,Ns=t;var r=Pa;t=Ia;var c=32-_e(r)-1;r&=~(1<<c),a+=1;var u=32-_e(n)+c;if(30<u){var _=c-c%5;u=(r&(1<<_)-1).toString(32),r>>=_,c-=_,Pa=1<<32-_e(n)+c|a<<c|r,Ia=u+t}else Pa=1<<u|a<<c|r,Ia=t}function bc(t){t.return!==null&&(rs(t,1),T0(t,1,0))}function Xf(t){for(;t===Ec;)Ec=$r[--to],$r[to]=null,ol=$r[--to],$r[to]=null;for(;t===Ns;)Ns=ra[--oa],ra[oa]=null,Ia=ra[--oa],ra[oa]=null,Pa=ra[--oa],ra[oa]=null}function A0(t,n){ra[oa++]=Pa,ra[oa++]=Ia,ra[oa++]=Ns,Pa=n.id,Ia=n.overflow,Ns=t}var kn=null,mn=null,Le=!1,Ds=null,la=!1,Wf=Error(s(519));function Us(t){var n=Error(s(418,1<arguments.length&&arguments[1]!==void 0&&arguments[1]?"text":"HTML",""));throw ll(sa(n,t)),Wf}function R0(t){var n=t.stateNode,a=t.type,r=t.memoizedProps;switch(n[A]=t,n[H]=r,a){case"dialog":He("cancel",n),He("close",n);break;case"iframe":case"object":case"embed":He("load",n);break;case"video":case"audio":for(a=0;a<Nl.length;a++)He(Nl[a],n);break;case"source":He("error",n);break;case"img":case"image":case"link":He("error",n),He("load",n);break;case"details":He("toggle",n);break;case"input":He("invalid",n),mi(n,r.value,r.defaultValue,r.checked,r.defaultChecked,r.type,r.name,!0);break;case"select":He("invalid",n);break;case"textarea":He("invalid",n),tn(n,r.value,r.defaultValue,r.children)}a=r.children,typeof a!="string"&&typeof a!="number"&&typeof a!="bigint"||n.textContent===""+a||r.suppressHydrationWarning===!0||j_(n.textContent,a)?(r.popover!=null&&(He("beforetoggle",n),He("toggle",n)),r.onScroll!=null&&He("scroll",n),r.onScrollEnd!=null&&He("scrollend",n),r.onClick!=null&&(n.onclick=ia),n=!0):n=!1,n||Us(t,!0)}function Tc(t){for(kn=t.return;kn;)switch(kn.tag){case 5:case 31:case 13:la=!1;return;case 27:case 3:la=!0;return;default:kn=kn.return}}function eo(t){if(t!==kn)return!1;if(!Le)return Tc(t),Le=!0,!1;var n=t.tag,a;if((a=n!==3&&n!==27)&&((a=n===5)&&(a=t.type,a=!(a!=="form"&&a!=="button")||yd(t.type,t.memoizedProps)),a=!a),a&&mn&&Us(t),Tc(t),n===13){if(t=t.memoizedState,t=t!==null?t.dehydrated:null,!t)throw Error(s(317));mn=dv(t)}else if(n===31){if(t=t.memoizedState,t=t!==null?t.dehydrated:null,!t)throw Error(s(317));mn=dv(t)}else n===27?(n=mn,js(t.type)?(t=Nd,Nd=null,mn=t):mn=n):mn=kn?ua(t.stateNode.nextSibling):null;return!0}function Sr(){mn=kn=null,Le=!1}function Yf(){var t=Ds;return t!==null&&(Li===null?Li=t:Li.push.apply(Li,t),Ds=null),t}function ll(t){Ds===null?Ds=[t]:Ds.push(t)}var qf=Ne(null),yr=null,os=null;function Ls(t,n,a){fe(qf,n._currentValue),n._currentValue=a}function ls(t){t._currentValue=qf.current,ce(qf)}function Ac(t,n,a){for(;t!==null;){var r=t.alternate;if((t.childLanes&n)!==n?(t.childLanes|=n,r!==null&&(r.childLanes|=n)):r!==null&&(r.childLanes&n)!==n&&(r.childLanes|=n),t===a)break;t=t.return}}function jf(t,n,a,r){var c=t.child;for(c!==null&&(c.return=t);c!==null;){var u=c.dependencies;if(u!==null){var _=c.child;u=u.firstContext;t:for(;u!==null;){var w=u;u=c;for(var z=0;z<n.length;z++)if(w.context===n[z]){u.lanes|=a,w=u.alternate,w!==null&&(w.lanes|=a),Ac(u.return,a,t),r||(_=null);break t}u=w.next}}else if(c.tag===18){if(_=c.return,_===null)throw Error(s(341));_.lanes|=a,u=_.alternate,u!==null&&(u.lanes|=a),Ac(_,a,t),_=null}else c.tag===13&&c.memoizedState!==null&&c.memoizedState.dehydrated===null?(c.lanes|=a,_=c.alternate,_!==null&&(_.lanes|=a),Ac(c.return,a,t),_=c.child,_=_!==null?_.sibling:null):_=c.child;if(_!==null)_.return=c;else for(_=c;_!==null;){if(_===t){_=null;break}if(c=_.sibling,c!==null){c.return=_.return,_=c;break}_=_.return}c=_}}function Mr(t,n,a,r){t=null;for(var c=n,u=!1;c!==null;){if(!u){if((c.flags&524288)!==0)u=!0;else if((c.flags&262144)!==0)break}if(c.tag===10){var _=c.alternate;if(_===null)throw Error(s(387));if(_=_.memoizedProps,_!==null){var w=c.type;Vi(c.pendingProps.value,_.value)||(t!==null?t.push(w):t=[w])}}else if(c===fn.current){if(_=c.alternate,_===null)throw Error(s(387));_.memoizedState.memoizedState!==c.memoizedState.memoizedState&&(t!==null?t.push(Ro):t=[Ro])}c=c.return}return t!==null&&jf(n,t,a,r),n.flags|=262144,t!==null}function Rc(t){for(t=t.firstContext;t!==null;){if(!Vi(t.context._currentValue,t.memoizedValue))return!0;t=t.next}return!1}function Er(t){yr=t,os=null,t=t.dependencies,t!==null&&(t.firstContext=null)}function Kn(t){return w0(yr,t)}function wc(t,n){return yr===null&&Er(t),w0(t,n)}function w0(t,n){var a=n._currentValue;if(n={context:n,memoizedValue:a,next:null},os===null){if(t===null)throw Error(s(308));os=n,t.dependencies={lanes:0,firstContext:n},t.flags|=524288}else os=os.next=n;return a}var Vy=typeof AbortController<"u"?AbortController:function(){var t=[],n=this.signal={aborted:!1,addEventListener:function(a,r){t.push(r)}};this.abort=function(){n.aborted=!0,t.forEach(function(a){return a()})}},ky=o.unstable_scheduleCallback,Xy=o.unstable_NormalPriority,Ln={$$typeof:nt,Consumer:null,Provider:null,_currentValue:null,_currentValue2:null,_threadCount:0};function Zf(){return{controller:new Vy,data:new Map,refCount:0}}function cl(t){t.refCount--,t.refCount===0&&ky(Xy,function(){t.controller.abort()})}function C0(t,n){if((t.pendingLanes&4194048)!==0){var a=t.transitionTypes;for(a===null&&(a=t.transitionTypes=[]),t=0;t<n.length;t++){var r=n[t];a.indexOf(r)===-1&&a.push(r)}}}var ul=null;function Wy(t){var n=t.transitionTypes;return t.transitionTypes=null,n}var fl=null,Kf=0,br=0,no=null;function Yy(t,n){if(fl===null){var a=fl=[];Kf=0,br=hd(),no={status:"pending",value:void 0,then:function(r){a.push(r)}}}return Kf++,n.then(N0,N0),n}function N0(){if(--Kf===0&&(ul=null,fl!==null)){no!==null&&(no.status="fulfilled");var t=fl;fl=null,br=0,no=null;for(var n=0;n<t.length;n++)(0,t[n])()}}function qy(t,n){var a=[],r={status:"pending",value:null,reason:null,then:function(c){a.push(c)}};return t.then(function(){r.status="fulfilled",r.value=n;for(var c=0;c<a.length;c++)(0,a[c])(n)},function(c){for(r.status="rejected",r.reason=c,c=0;c<a.length;c++)(0,a[c])(void 0)}),r}var D0=Mt.S;Mt.S=function(t,n){if(E_=qt(),typeof n=="object"&&n!==null&&typeof n.then=="function"&&Yy(t,n),ul!==null)for(var a=yo;a!==null;)C0(a,ul),a=a.next;if(a=t.types,a!==null){for(var r=yo;r!==null;)C0(r,a),r=r.next;if(br!==0){r=ul,r===null&&(r=ul=[]);for(var c=0;c<a.length;c++){var u=a[c];r.indexOf(u)===-1&&r.push(u)}}}D0!==null&&D0(t,n)};var Tr=Ne(null);function Qf(){var t=Tr.current;return t!==null?t:dn.pooledCache}function Cc(t,n){n===null?fe(Tr,Tr.current):fe(Tr,n.pool)}function U0(){var t=Qf();return t===null?null:{parent:Ln._currentValue,pool:t}}var io=Error(s(460)),Jf=Error(s(474)),Nc=Error(s(542)),Dc={then:function(){}};function L0(t){return t=t.status,t==="fulfilled"||t==="rejected"}function O0(t,n,a){switch(a=t[a],a===void 0?t.push(n):a!==n&&(n.then(ia,ia),n=a),n.status){case"fulfilled":return n.value;case"rejected":throw t=n.reason,I0(t),t===void 0&&!("reason"in n)?Error(s(600)):t;default:if(typeof n.status=="string")n.then(ia,ia);else{if(t=dn,t!==null&&100<t.shellSuspendCounter)throw Error(s(482));t=n,t.status="pending",t.then(function(r){if(n.status==="pending"){var c=n;c.status="fulfilled",c.value=r}},function(r){if(n.status==="pending"){var c=n;c.status="rejected",c.reason=r}})}switch(n.status){case"fulfilled":return n.value;case"rejected":throw t=n.reason,I0(t),t}throw Rr=n,io}}function Ar(t){try{var n=t._init;return n(t._payload)}catch(a){throw a!==null&&typeof a=="object"&&typeof a.then=="function"?(Rr=a,io):a}}var Rr=null;function P0(){if(Rr===null)throw Error(s(459));var t=Rr;return Rr=null,t}function I0(t){if(t===io||t===Nc)throw Error(s(483))}var ao=null,hl=0;function Uc(t){var n=hl;return hl+=1,ao===null&&(ao=[]),O0(ao,t,n)}function Os(t,n){n=n.props.ref,t.ref=n!==void 0?n:null}function Lc(t,n){throw n.$$typeof===T?Error(s(525)):(t=Object.prototype.toString.call(n),Error(s(31,t==="[object Object]"?"object with keys {"+Object.keys(n).join(", ")+"}":t)))}function z0(t){function n(tt,G){if(t){var at=tt.deletions;at===null?(tt.deletions=[G],tt.flags|=16):at.push(G)}}function a(tt,G){if(!t)return null;for(;G!==null;)n(tt,G),G=G.sibling;return null}function r(tt){for(var G=new Map;tt!==null;)tt.key===null?G.set(tt.index,tt):G.set(tt.key,tt),tt=tt.sibling;return G}function c(tt,G){return tt=ss(tt,G),tt.index=0,tt.sibling=null,tt}function u(tt,G,at){return tt.index=at,t?(at=tt.alternate,at!==null?(at=at.index,at<G?(tt.flags|=2,G):at):(tt.flags|=134217730,G)):(tt.flags|=1048576,G)}function _(tt){return t&&tt.alternate===null&&(tt.flags|=134217730),tt}function w(tt,G,at,bt){return G===null||G.tag!==6?(G=Vf(at,tt.mode,bt),G.return=tt,G):(G=c(G,at),G.return=tt,G)}function z(tt,G,at,bt){var ne=at.type;return ne===Z?(tt=ht(tt,G,at.props.children,bt,at.key),Os(tt,at),tt):G!==null&&(G.elementType===ne||typeof ne=="object"&&ne!==null&&ne.$$typeof===mt&&Ar(ne)===G.type)?(G=c(G,at.props),Os(G,at),G.return=tt,G):(G=Mc(at.type,at.key,at.props,null,tt.mode,bt),Os(G,at),G.return=tt,G)}function et(tt,G,at,bt){return G===null||G.tag!==4||G.stateNode.containerInfo!==at.containerInfo||G.stateNode.implementation!==at.implementation?(G=kf(at,tt.mode,bt),G.return=tt,G):(G=c(G,at.children||[]),G.return=tt,G)}function ht(tt,G,at,bt,ne){return G===null||G.tag!==7?(G=xr(at,tt.mode,bt,ne),G.return=tt,G):(G=c(G,at),G.return=tt,G)}function Tt(tt,G,at){if(typeof G=="string"&&G!==""||typeof G=="number"||typeof G=="bigint")return G=Vf(""+G,tt.mode,at),G.return=tt,G;if(typeof G=="object"&&G!==null){switch(G.$$typeof){case O:return at=Mc(G.type,G.key,G.props,null,tt.mode,at),Os(at,G),at.return=tt,at;case V:return G=kf(G,tt.mode,at),G.return=tt,G;case mt:return G=Ar(G),Tt(tt,G,at)}if(Yt(G)||$(G))return G=xr(G,tt.mode,at,null),G.return=tt,G;if(typeof G.then=="function")return Tt(tt,Uc(G),at);if(G.$$typeof===nt)return Tt(tt,wc(tt,G),at);Lc(tt,G)}return null}function Q(tt,G,at,bt){var ne=G!==null?G.key:null;if(typeof at=="string"&&at!==""||typeof at=="number"||typeof at=="bigint")return ne!==null?null:w(tt,G,""+at,bt);if(typeof at=="object"&&at!==null){switch(at.$$typeof){case O:return at.key===ne?z(tt,G,at,bt):null;case V:return at.key===ne?et(tt,G,at,bt):null;case mt:return at=Ar(at),Q(tt,G,at,bt)}if(Yt(at)||$(at))return ne!==null?null:ht(tt,G,at,bt,null);if(typeof at.then=="function")return Q(tt,G,Uc(at),bt);if(at.$$typeof===nt)return Q(tt,G,wc(tt,at),bt);Lc(tt,at)}return null}function ct(tt,G,at,bt,ne){if(typeof bt=="string"&&bt!==""||typeof bt=="number"||typeof bt=="bigint")return tt=tt.get(at)||null,w(G,tt,""+bt,ne);if(typeof bt=="object"&&bt!==null){switch(bt.$$typeof){case O:return tt=tt.get(bt.key===null?at:bt.key)||null,z(G,tt,bt,ne);case V:return tt=tt.get(bt.key===null?at:bt.key)||null,et(G,tt,bt,ne);case mt:return bt=Ar(bt),ct(tt,G,at,bt,ne)}if(Yt(bt)||$(bt))return tt=tt.get(at)||null,ht(G,tt,bt,ne,null);if(typeof bt.then=="function")return ct(tt,G,at,Uc(bt),ne);if(bt.$$typeof===nt)return ct(tt,G,at,wc(G,bt),ne);Lc(G,bt)}return null}function Xt(tt,G,at,bt){for(var ne=null,Xe=null,ue=G,pe=G=0,In=null;ue!==null&&pe<at.length;pe++){ue.index>pe?(In=ue,ue=null):In=ue.sibling;var Qe=Q(tt,ue,at[pe],bt);if(Qe===null){ue===null&&(ue=In);break}t&&ue&&Qe.alternate===null&&n(tt,ue),G=u(Qe,G,pe),Xe===null?ne=Qe:Xe.sibling=Qe,Xe=Qe,ue=In}if(pe===at.length)return a(tt,ue),Le&&rs(tt,pe),ne;if(ue===null){for(;pe<at.length;pe++)ue=Tt(tt,at[pe],bt),ue!==null&&(G=u(ue,G,pe),Xe===null?ne=ue:Xe.sibling=ue,Xe=ue);return Le&&rs(tt,pe),ne}for(ue=r(ue);pe<at.length;pe++)In=ct(ue,tt,pe,at[pe],bt),In!==null&&(t&&(Qe=In.alternate,Qe!==null&&ue.delete(Qe.key===null?pe:Qe.key)),G=u(In,G,pe),Xe===null?ne=In:Xe.sibling=In,Xe=In);return t&&ue.forEach(function($s){return n(tt,$s)}),Le&&rs(tt,pe),ne}function re(tt,G,at,bt){if(at==null)throw Error(s(151));for(var ne=null,Xe=null,ue=G,pe=G=0,In=null,Qe=at.next();ue!==null&&!Qe.done;pe++,Qe=at.next()){ue.index>pe?(In=ue,ue=null):In=ue.sibling;var $s=Q(tt,ue,Qe.value,bt);if($s===null){ue===null&&(ue=In);break}t&&ue&&$s.alternate===null&&n(tt,ue),G=u($s,G,pe),Xe===null?ne=$s:Xe.sibling=$s,Xe=$s,ue=In}if(Qe.done)return a(tt,ue),Le&&rs(tt,pe),ne;if(ue===null){for(;!Qe.done;pe++,Qe=at.next())Qe=Tt(tt,Qe.value,bt),Qe!==null&&(G=u(Qe,G,pe),Xe===null?ne=Qe:Xe.sibling=Qe,Xe=Qe);return Le&&rs(tt,pe),ne}for(ue=r(ue);!Qe.done;pe++,Qe=at.next())Qe=ct(ue,tt,pe,Qe.value,bt),Qe!==null&&(t&&(In=Qe.alternate,In!==null&&ue.delete(In.key===null?pe:In.key)),G=u(Qe,G,pe),Xe===null?ne=Qe:Xe.sibling=Qe,Xe=Qe);return t&&ue.forEach(function(RE){return n(tt,RE)}),Le&&rs(tt,pe),ne}function we(tt,G,at,bt){if(typeof at=="object"&&at!==null&&at.type===Z&&at.key===null&&at.props.ref===void 0&&(at=at.props.children),typeof at=="object"&&at!==null){switch(at.$$typeof){case O:t:{for(var ne=at.key;G!==null;){if(G.key===ne){if(ne=at.type,ne===Z){if(G.tag===7){a(tt,G.sibling),bt=c(G,at.props.children),Os(bt,at),bt.return=tt,tt=bt;break t}}else if(G.elementType===ne||typeof ne=="object"&&ne!==null&&ne.$$typeof===mt&&Ar(ne)===G.type){a(tt,G.sibling),bt=c(G,at.props),Os(bt,at),bt.return=tt,tt=bt;break t}a(tt,G);break}else n(tt,G);G=G.sibling}at.type===Z?(bt=xr(at.props.children,tt.mode,bt,at.key),Os(bt,at),bt.return=tt,tt=bt):(bt=Mc(at.type,at.key,at.props,null,tt.mode,bt),Os(bt,at),bt.return=tt,tt=bt)}return _(tt);case V:t:{for(ne=at.key;G!==null;){if(G.key===ne)if(G.tag===4&&G.stateNode.containerInfo===at.containerInfo&&G.stateNode.implementation===at.implementation){a(tt,G.sibling),bt=c(G,at.children||[]),bt.return=tt,tt=bt;break t}else{a(tt,G);break}else n(tt,G);G=G.sibling}bt=kf(at,tt.mode,bt),bt.return=tt,tt=bt}return _(tt);case mt:return at=Ar(at),we(tt,G,at,bt)}if(Yt(at))return Xt(tt,G,at,bt);if($(at)){if(ne=$(at),typeof ne!="function")throw Error(s(150));return at=ne.call(at),re(tt,G,at,bt)}if(typeof at.then=="function")return we(tt,G,Uc(at),bt);if(at.$$typeof===nt)return we(tt,G,wc(tt,at),bt);Lc(tt,at)}return typeof at=="string"&&at!==""||typeof at=="number"||typeof at=="bigint"?(at=""+at,G!==null&&G.tag===6?(a(tt,G.sibling),bt=c(G,at),bt.return=tt,tt=bt):(a(tt,G),bt=Vf(at,tt.mode,bt),bt.return=tt,tt=bt),_(tt)):a(tt,G)}return function(tt,G,at,bt){try{hl=0;var ne=we(tt,G,at,bt);return ao=null,ne}catch(ue){if(ue===io||ue===Nc)throw ue;var Xe=Ni(29,ue,null,tt.mode);return Xe.lanes=bt,Xe.return=tt,Xe}}}var wr=z0(!0),B0=z0(!1),Ps=!1;function $f(t){t.updateQueue={baseState:t.memoizedState,firstBaseUpdate:null,lastBaseUpdate:null,shared:{pending:null,lanes:0,hiddenCallbacks:null},callbacks:null}}function th(t,n){t=t.updateQueue,n.updateQueue===t&&(n.updateQueue={baseState:t.baseState,firstBaseUpdate:t.firstBaseUpdate,lastBaseUpdate:t.lastBaseUpdate,shared:t.shared,callbacks:null})}function Is(t){return{lane:t,tag:0,payload:null,callback:null,next:null}}function zs(t,n,a){var r=t.updateQueue;if(r===null)return null;if(r=r.shared,(en&2)!==0){var c=r.pending;return c===null?n.next=n:(n.next=c.next,c.next=n),r.pending=n,n=yc(t),y0(t,null,a),n}return Sc(t,r,n,a),yc(t)}function dl(t,n,a){if(n=n.updateQueue,n!==null&&(n=n.shared,(a&4194048)!==0)){var r=n.lanes;r&=t.pendingLanes,a|=r,n.lanes=a,Da(t,a)}}function eh(t,n){var a=t.updateQueue,r=t.alternate;if(r!==null&&(r=r.updateQueue,a===r)){var c=null,u=null;if(a=a.firstBaseUpdate,a!==null){do{var _={lane:a.lane,tag:a.tag,payload:a.payload,callback:null,next:null};u===null?c=u=_:u=u.next=_,a=a.next}while(a!==null);u===null?c=u=n:u=u.next=n}else c=u=n;a={baseState:r.baseState,firstBaseUpdate:c,lastBaseUpdate:u,shared:r.shared,callbacks:r.callbacks},t.updateQueue=a;return}t=a.lastBaseUpdate,t===null?a.firstBaseUpdate=n:t.next=n,a.lastBaseUpdate=n}var nh=!1;function pl(){if(nh){var t=no;if(t!==null)throw t}}function ml(t,n,a,r){nh=!1;var c=t.updateQueue;Ps=!1;var u=c.firstBaseUpdate,_=c.lastBaseUpdate,w=c.shared.pending;if(w!==null){c.shared.pending=null;var z=w,et=z.next;z.next=null,_===null?u=et:_.next=et,_=z;var ht=t.alternate;ht!==null&&(ht=ht.updateQueue,w=ht.lastBaseUpdate,w!==_&&(w===null?ht.firstBaseUpdate=et:w.next=et,ht.lastBaseUpdate=z))}if(u!==null){var Tt=c.baseState;_=0,ht=et=z=null,w=u;do{var Q=w.lane&-536870913,ct=Q!==w.lane;if(ct?(ke&Q)===Q:(r&Q)===Q){Q!==0&&Q===br&&(nh=!0),ht!==null&&(ht=ht.next={lane:0,tag:w.tag,payload:w.payload,callback:null,next:null});t:{var Xt=t,re=w;Q=n;var we=a;switch(re.tag){case 1:if(Xt=re.payload,typeof Xt=="function"){Tt=Xt.call(we,Tt,Q);break t}Tt=Xt;break t;case 3:Xt.flags=Xt.flags&-65537|128;case 0:if(Xt=re.payload,Q=typeof Xt=="function"?Xt.call(we,Tt,Q):Xt,Q==null)break t;Tt=I({},Tt,Q);break t;case 2:Ps=!0}}Q=w.callback,Q!==null&&(t.flags|=64,ct&&(t.flags|=8192),ct=c.callbacks,ct===null?c.callbacks=[Q]:ct.push(Q))}else ct={lane:Q,tag:w.tag,payload:w.payload,callback:w.callback,next:null},ht===null?(et=ht=ct,z=Tt):ht=ht.next=ct,_|=Q;if(w=w.next,w===null){if(w=c.shared.pending,w===null)break;ct=w,w=ct.next,ct.next=null,c.lastBaseUpdate=ct,c.shared.pending=null}}while(!0);ht===null&&(z=Tt),c.baseState=z,c.firstBaseUpdate=et,c.lastBaseUpdate=ht,u===null&&(c.shared.lanes=0),Xs|=_,t.lanes=_,t.memoizedState=Tt}}function F0(t,n){if(typeof t!="function")throw Error(s(191,t));t.call(n)}function H0(t,n){var a=t.callbacks;if(a!==null)for(t.callbacks=null,t=0;t<a.length;t++)F0(a[t],n)}var Bs=Ne(null),Oc=Ne(0);function G0(t,n){t=ds,fe(Oc,t),fe(Bs,n),ds=t|n.baseLanes}function ih(){fe(Oc,ds),fe(Bs,Bs.current)}function ah(){ds=Oc.current,ce(Bs),ce(Oc)}var Qn=Ne(null),ci=null;function Fs(t){var n=t.alternate;fe(Jn,Jn.current&1),fe(Qn,t),ci===null&&(n===null||Bs.current!==null||n.memoizedState!==null)&&(ci=t)}function sh(t){fe(Jn,Jn.current),fe(Qn,t),ci===null&&(ci=t)}function V0(t){t.tag===22?(fe(Jn,Jn.current),fe(Qn,t),ci===null&&(ci=t)):Hs()}function Hs(){fe(Jn,Jn.current),fe(Qn,Qn.current)}function ki(t){ce(Qn),ci===t&&(ci=null),ce(Jn)}var Jn=Ne(0);function gl(t,n){fe(Qn,Qn.current),fe(Jn,n)}function rh(t){ce(Jn),ce(Qn),ci===t&&(ci=null)}function Pc(t){for(var n=t;n!==null;){if(n.tag===13){var a=n.memoizedState;if(a!==null&&(a=a.dehydrated,a===null||wd(a)||Cd(a)))return n}else if(n.tag===19&&n.memoizedProps.revealOrder!=="independent"){if((n.flags&128)!==0)return n}else if(n.child!==null){n.child.return=n,n=n.child;continue}if(n===t)break;for(;n.sibling===null;){if(n.return===null||n.return===t)return null;n=n.return}n.sibling.return=n.return,n=n.sibling}return null}var cs=0,Re=null,hn=null,On=null,Ic=!1,so=!1,Cr=!1,zc=0,_l=0,ro=null,jy=0;function An(){throw Error(s(321))}function oh(t,n){if(n===null)return!1;for(var a=0;a<n.length&&a<t.length;a++)if(!Vi(t[a],n[a]))return!1;return!0}function lh(t,n,a,r,c,u){return cs=u,Re=n,n.memoizedState=null,n.updateQueue=null,n.lanes=0,Mt.H=t===null||t.memoizedState===null?Tg:Ag,Cr=!1,u=a(r,c),Cr=!1,so&&(u=X0(n,a,r,c)),k0(t),u}function k0(t){Mt.H=Xc;var n=hn!==null&&hn.next!==null;if(cs=0,On=hn=Re=null,Ic=!1,_l=0,ro=null,n)throw Error(s(300));t===null||Pn||(t=t.dependencies,t!==null&&Rc(t)&&(Pn=!0))}function X0(t,n,a,r){Re=t;var c=0;do{if(so&&(ro=null),_l=0,so=!1,25<=c)throw Error(s(301));if(c+=1,On=hn=null,t.updateQueue!=null){var u=t.updateQueue;u.lastEffect=null,u.events=null,u.stores=null,u.memoCache!=null&&(u.memoCache.index=0)}Mt.H=nM,u=n(a,r)}while(so);return u}function Zy(){var t=Mt.H,n=t.useState()[0];return n=typeof n.then=="function"?vl(n):n,t=t.useState()[0],(hn!==null?hn.memoizedState:null)!==t&&(Re.flags|=1024),n}function ch(){var t=zc!==0;return zc=0,t}function uh(t,n,a){n.updateQueue=t.updateQueue,n.flags&=-2053,t.lanes&=~a}function fh(t){if(Ic){for(t=t.memoizedState;t!==null;){var n=t.queue;n!==null&&(n.pending=null),t=t.next}Ic=!1}cs=0,On=hn=Re=null,so=!1,_l=zc=0,ro=null}function xi(){var t={memoizedState:null,baseState:null,baseQueue:null,queue:null,next:null};return On===null?Re.memoizedState=On=t:On=On.next=t,On}function Cn(){if(hn===null){var t=Re.alternate;t=t!==null?t.memoizedState:null}else t=hn.next;var n=On===null?Re.memoizedState:On.next;if(n!==null)On=n,hn=t;else{if(t===null)throw Re.alternate===null?Error(s(467)):Error(s(310));hn=t,t={memoizedState:hn.memoizedState,baseState:hn.baseState,baseQueue:hn.baseQueue,queue:hn.queue,next:null},On===null?Re.memoizedState=On=t:On=On.next=t}return On}function Bc(){return{lastEffect:null,events:null,stores:null,memoCache:null}}function vl(t){var n=_l;return _l+=1,ro===null&&(ro=[]),t=O0(ro,t,n),n=Re,(On===null?n.memoizedState:On.next)===null&&(n=n.alternate,Mt.H=n===null||n.memoizedState===null?Tg:Ag),t}function Fc(t){if(t!==null&&typeof t=="object"){if(typeof t.then=="function")return vl(t);if(t.$$typeof===_t)return;if(t.$$typeof===nt)return Kn(t)}throw Error(s(438,String(t)))}function hh(t){var n=null,a=Re.updateQueue;if(a!==null&&(n=a.memoCache),n==null){var r=Re.alternate;r!==null&&(r=r.updateQueue,r!==null&&(r=r.memoCache,r!=null&&(n={data:r.data.map(function(c){return c.slice()}),index:0})))}if(n==null&&(n={data:[],index:0}),a===null&&(a=Bc(),Re.updateQueue=a),a.memoCache=n,a=n.data[n.index],a===void 0)for(a=n.data[n.index]=Array(t),r=0;r<t;r++)a[r]=ae;return n.index++,a}function us(t,n){return typeof n=="function"?n(t):n}function Hc(t){var n=Cn();return dh(n,hn,t)}function dh(t,n,a){var r=t.queue;if(r===null)throw Error(s(311));r.lastRenderedReducer=a;var c=t.baseQueue,u=r.pending;if(u!==null){if(c!==null){var _=c.next;c.next=u.next,u.next=_}n.baseQueue=c=u,r.pending=null}if(u=t.baseState,c===null)t.memoizedState=u;else{n=c.next;var w=_=null,z=null,et=n,ht=!1;do{var Tt=et.lane&-536870913;if(Tt!==et.lane?(ke&Tt)===Tt:(cs&Tt)===Tt){var Q=et.revertLane;if(Q===0)z!==null&&(z=z.next={lane:0,revertLane:0,gesture:null,action:et.action,hasEagerState:et.hasEagerState,eagerState:et.eagerState,next:null}),Tt===br&&(ht=!0);else if((cs&Q)===Q){et=et.next,Q===br&&(ht=!0);continue}else Tt={lane:0,revertLane:et.revertLane,gesture:null,action:et.action,hasEagerState:et.hasEagerState,eagerState:et.eagerState,next:null},z===null?(w=z=Tt,_=u):z=z.next=Tt,Re.lanes|=Q,Xs|=Q;Tt=et.action,Cr&&a(u,Tt),u=et.hasEagerState?et.eagerState:a(u,Tt)}else Q={lane:Tt,revertLane:et.revertLane,gesture:et.gesture,action:et.action,hasEagerState:et.hasEagerState,eagerState:et.eagerState,next:null},z===null?(w=z=Q,_=u):z=z.next=Q,Re.lanes|=Tt,Xs|=Tt;et=et.next}while(et!==null&&et!==n);if(z===null?_=u:z.next=w,!Vi(u,t.memoizedState)&&(Pn=!0,ht&&(a=no,a!==null)))throw a;t.memoizedState=u,t.baseState=_,t.baseQueue=z,r.lastRenderedState=u}return c===null&&(r.lanes=0),[t.memoizedState,r.dispatch]}function ph(t){var n=Cn(),a=n.queue;if(a===null)throw Error(s(311));a.lastRenderedReducer=t;var r=a.dispatch,c=a.pending,u=n.memoizedState;if(c!==null){a.pending=null;var _=c=c.next;do u=t(u,_.action),_=_.next;while(_!==c);Vi(u,n.memoizedState)||(Pn=!0),n.memoizedState=u,n.baseQueue===null&&(n.baseState=u),a.lastRenderedState=u}return[u,r]}function W0(t,n,a){var r=Re,c=Cn(),u=Le;if(u){if(a===void 0)throw Error(s(407));a=a()}else a=n();var _=!Vi((hn||c).memoizedState,a);if(_&&(c.memoizedState=a,Pn=!0),c=c.queue,_h(j0.bind(null,r,c,t),[t]),t=c.getSnapshot!==n||_||On!==null&&(On.memoizedState.tag&1)!==0,oo(t?9:8,{destroy:void 0},q0.bind(null,r,c,a,n),null),t){if(r.flags|=2048,dn===null)throw Error(s(349));u||(cs&127)!==0||Y0(r,n,a)}return a}function Y0(t,n,a){t.flags|=16384,t={getSnapshot:n,value:a},n=Re.updateQueue,n===null?(n=Bc(),Re.updateQueue=n,n.stores=[t]):(a=n.stores,a===null?n.stores=[t]:a.push(t))}function q0(t,n,a,r){n.value=a,n.getSnapshot=r,Z0(n)&&K0(t)}function j0(t,n,a){return a(function(){Z0(n)&&K0(t)})}function Z0(t){var n=t.getSnapshot;t=t.value;try{var a=n();return!Vi(t,a)}catch{return!0}}function K0(t){var n=vr(t,2);n!==null&&Oi(n,t,2)}function mh(t){var n=xi();if(typeof t=="function"){var a=t;if(t=a(),Cr){Pe(!0);try{a()}finally{Pe(!1)}}}return n.memoizedState=n.baseState=t,n.queue={pending:null,lanes:0,dispatch:null,lastRenderedReducer:us,lastRenderedState:t},n}function Q0(t,n,a,r){return t.baseState=a,dh(t,hn,typeof r=="function"?r:us)}function Ky(t,n,a,r,c){if(kc(t))throw Error(s(485));if(t=n.action,t!==null){var u={payload:c,action:t,next:null,isTransition:!0,status:"pending",value:null,reason:null,listeners:[],then:function(_){u.listeners.push(_)}};Mt.T!==null?a(!0):u.isTransition=!1,r(u),a=n.pending,a===null?(u.next=n.pending=u,J0(n,u)):(u.next=a.next,n.pending=a.next=u)}}function J0(t,n){var a=n.action,r=n.payload,c=t.state;if(n.isTransition){var u=Mt.T,_={};_.types=u!==null?u.types:null,Mt.T=_;try{var w=a(c,r),z=Mt.S;z!==null&&z(_,w),$0(t,n,w)}catch(et){gh(t,n,et)}finally{u!==null&&_.types!==null&&(u.types=_.types),Mt.T=u}}else try{u=a(c,r),$0(t,n,u)}catch(et){gh(t,n,et)}}function $0(t,n,a){a!==null&&typeof a=="object"&&typeof a.then=="function"?a.then(function(r){tg(t,n,r)},function(r){return gh(t,n,r)}):tg(t,n,a)}function tg(t,n,a){n.status="fulfilled",n.value=a,eg(n),t.state=a,n=t.pending,n!==null&&(a=n.next,a===n?t.pending=null:(a=a.next,n.next=a,J0(t,a)))}function gh(t,n,a){var r=t.pending;if(t.pending=null,r!==null){r=r.next;do n.status="rejected",n.reason=a,eg(n),n=n.next;while(n!==r)}t.action=null}function eg(t){t=t.listeners;for(var n=0;n<t.length;n++)(0,t[n])()}function ng(t,n){return n}function ig(t,n){if(Le){var a=dn.formState;if(a!==null){t:{var r=Re;if(Le){if(mn){e:{for(var c=mn,u=la;c.nodeType!==8;){if(!u){c=null;break e}if(c=ua(c.nextSibling),c===null){c=null;break e}}u=c.data,c=u==="F!"||u==="F"?c:null}if(c){mn=ua(c.nextSibling),r=c.data==="F!";break t}}Us(r)}r=!1}r&&(n=a[0])}}return a=xi(),a.memoizedState=a.baseState=n,r={pending:null,lanes:0,dispatch:null,lastRenderedReducer:ng,lastRenderedState:n},a.queue=r,a=Mg.bind(null,Re,r),r.dispatch=a,r=mh(!1),u=Mh.bind(null,Re,!1,r.queue),r=xi(),c={state:n,dispatch:null,action:t,pending:null},r.queue=c,a=Ky.bind(null,Re,c,u,a),c.dispatch=a,r.memoizedState=t,[n,a,!1]}function ag(t){var n=Cn();return sg(n,hn,t)}function sg(t,n,a){if(n=dh(t,n,ng)[0],t=Hc(us)[0],typeof n=="object"&&n!==null&&typeof n.then=="function")try{var r=vl(n)}catch(_){throw _===io?Nc:_}else r=n;n=Cn();var c=n.queue,u=c.dispatch;return a!==n.memoizedState&&(Re.flags|=2048,oo(9,{destroy:void 0},Qy.bind(null,c,a),null)),[r,u,t]}function Qy(t,n){t.action=n}function rg(t){var n=Cn(),a=hn;if(a!==null)return sg(n,a,t);Cn(),n=n.memoizedState,a=Cn();var r=a.queue.dispatch;return a.memoizedState=t,[n,r,!1]}function oo(t,n,a,r){return t={tag:t,create:a,deps:r,inst:n,next:null},n=Re.updateQueue,n===null&&(n=Bc(),Re.updateQueue=n),a=n.lastEffect,a===null?n.lastEffect=t.next=t:(r=a.next,a.next=t,t.next=r,n.lastEffect=t),t}function og(){return Cn().memoizedState}function Gc(t,n,a,r){var c=xi();Re.flags|=t,c.memoizedState=oo(1|n,{destroy:void 0},a,r===void 0?null:r)}function Vc(t,n,a,r){var c=Cn();r=r===void 0?null:r;var u=c.memoizedState.inst;hn!==null&&r!==null&&oh(r,hn.memoizedState.deps)?c.memoizedState=oo(n,u,a,r):(Re.flags|=t,c.memoizedState=oo(1|n,u,a,r))}function lg(t,n){Gc(8390656,8,t,n)}function _h(t,n){Vc(2048,8,t,n)}function Jy(t){Re.flags|=4;var n=Re.updateQueue;if(n===null)n=Bc(),Re.updateQueue=n,n.events=[t];else{var a=n.events;a===null?n.events=[t]:a.push(t)}}function cg(t){var n=Cn().memoizedState;return Jy({ref:n,nextImpl:t}),function(){if((en&2)!==0)throw Error(s(440));return n.impl.apply(void 0,arguments)}}function ug(t,n){return Vc(4,2,t,n)}function fg(t,n){return Vc(4,4,t,n)}function hg(t,n){if(typeof n=="function"){t=t();var a=n(t);return function(){typeof a=="function"?a():n(null)}}if(n!=null)return t=t(),n.current=t,function(){n.current=null}}function dg(t,n,a){a=a!=null?a.concat([t]):null,Vc(4,4,hg.bind(null,n,t),a)}function vh(){}function pg(t,n){var a=Cn();n=n===void 0?null:n;var r=a.memoizedState;return n!==null&&oh(n,r[1])?r[0]:(a.memoizedState=[t,n],t)}function mg(t,n){var a=Cn();n=n===void 0?null:n;var r=a.memoizedState;if(n!==null&&oh(n,r[1]))return r[0];if(r=t(),Cr){Pe(!0);try{t()}finally{Pe(!1)}}return a.memoizedState=[r,n],r}function xh(t,n,a){return a===void 0||(cs&1073741824)!==0&&(ke&261930)===0?t.memoizedState=n:(t.memoizedState=a,t=T_(),Re.lanes|=t,Xs|=t,a)}function gg(t,n,a,r){return Vi(a,n)?a:Bs.current!==null?(t=xh(t,a,r),Vi(t,n)||(Pn=!0),t):(cs&106)===0||(cs&1073741824)!==0&&(ke&261930)===0?(Pn=!0,t.memoizedState=a):(t=T_(),Re.lanes|=t,Xs|=t,n)}function _g(t,n,a,r,c){var u=Ot.p;Ot.p=u!==0&&8>u?u:8;var _=Mt.T,w={};w.types=_!==null?_.types:null,Mt.T=w,Mh(t,!1,n,a);try{var z=c(),et=Mt.S;if(et!==null&&et(w,z),z!==null&&typeof z=="object"&&typeof z.then=="function"){var ht=qy(z,r);xl(t,n,ht,qi(t))}else xl(t,n,r,qi(t))}catch(Tt){xl(t,n,{then:function(){},status:"rejected",reason:Tt},qi())}finally{Ot.p=u,_!==null&&w.types!==null&&(_.types=w.types),Mt.T=_}}function $y(){}function Sh(t,n,a,r){if(t.tag!==5)throw Error(s(476));var c=vg(t).queue;_g(t,c,n,$e,a===null?$y:function(){return xg(t),a(r)})}function vg(t){var n=t.memoizedState;if(n!==null)return n;n={memoizedState:$e,baseState:$e,baseQueue:null,queue:{pending:null,lanes:0,dispatch:null,lastRenderedReducer:us,lastRenderedState:$e},next:null};var a={};return n.next={memoizedState:a,baseState:a,baseQueue:null,queue:{pending:null,lanes:0,dispatch:null,lastRenderedReducer:us,lastRenderedState:a},next:null},t.memoizedState=n,t=t.alternate,t!==null&&(t.memoizedState=n),n}function xg(t){var n=vg(t);n.next===null&&(n=t.alternate.memoizedState),xl(t,n.next.queue,{},qi())}function yh(){return Kn(Ro)}function Sg(){return Cn().memoizedState}function yg(){return Cn().memoizedState}function tM(t){for(var n=t.return;n!==null;){switch(n.tag){case 24:case 3:var a=qi();t=Is(a);var r=zs(n,t,a);r!==null&&(Oi(r,n,a),dl(r,n,a)),n={cache:Zf()},t.payload=n;return}n=n.return}}function eM(t,n,a){var r=qi();a={lane:r,revertLane:0,gesture:null,action:a,hasEagerState:!1,eagerState:null,next:null},kc(t)?Eg(n,a):(a=Hf(t,n,a,r),a!==null&&(Oi(a,t,r),bg(a,n,r)))}function Mg(t,n,a){var r=qi();xl(t,n,a,r)}function xl(t,n,a,r){var c={lane:r,revertLane:0,gesture:null,action:a,hasEagerState:!1,eagerState:null,next:null};if(kc(t))Eg(n,c);else{var u=t.alternate;if(t.lanes===0&&(u===null||u.lanes===0)&&(u=n.lastRenderedReducer,u!==null))try{var _=n.lastRenderedState,w=u(_,a);if(c.hasEagerState=!0,c.eagerState=w,Vi(w,_))return Sc(t,n,c,0),dn===null&&xc(),!1}catch{}if(a=Hf(t,n,c,r),a!==null)return Oi(a,t,r),bg(a,n,r),!0}return!1}function Mh(t,n,a,r){if(r={lane:2,revertLane:hd(),gesture:null,action:r,hasEagerState:!1,eagerState:null,next:null},kc(t)){if(n)throw Error(s(479))}else n=Hf(t,a,r,2),n!==null&&Oi(n,t,2)}function kc(t){var n=t.alternate;return t===Re||n!==null&&n===Re}function Eg(t,n){so=Ic=!0;var a=t.pending;a===null?n.next=n:(n.next=a.next,a.next=n),t.pending=n}function bg(t,n,a){if((a&4194048)!==0){var r=n.lanes;r&=t.pendingLanes,a|=r,n.lanes=a,Da(t,a)}}var Xc={readContext:Kn,use:Fc,useCallback:An,useContext:An,useEffect:An,useImperativeHandle:An,useLayoutEffect:An,useInsertionEffect:An,useMemo:An,useReducer:An,useRef:An,useState:An,useDebugValue:An,useDeferredValue:An,useTransition:An,useSyncExternalStore:An,useId:An,useHostTransitionStatus:An,useFormState:An,useActionState:An,useOptimistic:An,useMemoCache:An,useCacheRefresh:An,useEffectEvent:An},Tg={readContext:Kn,use:Fc,useCallback:function(t,n){return xi().memoizedState=[t,n===void 0?null:n],t},useContext:Kn,useEffect:lg,useImperativeHandle:function(t,n,a){a=a!=null?a.concat([t]):null,Gc(4194308,4,hg.bind(null,n,t),a)},useLayoutEffect:function(t,n){return Gc(4194308,4,t,n)},useInsertionEffect:function(t,n){Gc(4,2,t,n)},useMemo:function(t,n){var a=xi();n=n===void 0?null:n;var r=t();if(Cr){Pe(!0);try{t()}finally{Pe(!1)}}return a.memoizedState=[r,n],r},useReducer:function(t,n,a){var r=xi();if(a!==void 0){var c=a(n);if(Cr){Pe(!0);try{a(n)}finally{Pe(!1)}}}else c=n;return r.memoizedState=r.baseState=c,t={pending:null,lanes:0,dispatch:null,lastRenderedReducer:t,lastRenderedState:c},r.queue=t,t=t.dispatch=eM.bind(null,Re,t),[r.memoizedState,t]},useRef:function(t){var n=xi();return t={current:t},n.memoizedState=t},useState:function(t){t=mh(t);var n=t.queue,a=Mg.bind(null,Re,n);return n.dispatch=a,[t.memoizedState,a]},useDebugValue:vh,useDeferredValue:function(t,n){var a=xi();return xh(a,t,n)},useTransition:function(){var t=mh(!1);return t=_g.bind(null,Re,t.queue,!0,!1),xi().memoizedState=t,[!1,t]},useSyncExternalStore:function(t,n,a){var r=Re,c=xi();if(Le){if(a===void 0)throw Error(s(407));a=a()}else{if(a=n(),dn===null)throw Error(s(349));(ke&127)!==0||Y0(r,n,a)}c.memoizedState=a;var u={value:a,getSnapshot:n};return c.queue=u,lg(j0.bind(null,r,u,t),[t]),r.flags|=2048,oo(9,{destroy:void 0},q0.bind(null,r,u,a,n),null),a},useId:function(){var t=xi(),n=dn.identifierPrefix;if(Le){var a=Ia,r=Pa;a=(r&~(1<<32-_e(r)-1)).toString(32)+a,n="_"+n+"R_"+a,a=zc++,0<a&&(n+="H"+a.toString(32)),n+="_"}else a=jy++,n="_"+n+"r_"+a.toString(32)+"_";return t.memoizedState=n},useHostTransitionStatus:yh,useFormState:ig,useActionState:ig,useOptimistic:function(t){var n=xi();n.memoizedState=n.baseState=t;var a={pending:null,lanes:0,dispatch:null,lastRenderedReducer:null,lastRenderedState:null};return n.queue=a,n=Mh.bind(null,Re,!0,a),a.dispatch=n,[t,n]},useMemoCache:hh,useCacheRefresh:function(){return xi().memoizedState=tM.bind(null,Re)},useEffectEvent:function(t){var n=xi(),a={impl:t};return n.memoizedState=a,function(){if((en&2)!==0)throw Error(s(440));return a.impl.apply(void 0,arguments)}}},Ag={readContext:Kn,use:Fc,useCallback:pg,useContext:Kn,useEffect:_h,useImperativeHandle:dg,useInsertionEffect:ug,useLayoutEffect:fg,useMemo:mg,useReducer:Hc,useRef:og,useState:function(){return Hc(us)},useDebugValue:vh,useDeferredValue:function(t,n){var a=Cn();return gg(a,hn.memoizedState,t,n)},useTransition:function(){var t=Hc(us)[0],n=Cn().memoizedState;return[typeof t=="boolean"?t:vl(t),n]},useSyncExternalStore:W0,useId:Sg,useHostTransitionStatus:yh,useFormState:ag,useActionState:ag,useOptimistic:function(t,n){var a=Cn();return Q0(a,hn,t,n)},useMemoCache:hh,useCacheRefresh:yg,useEffectEvent:cg},nM={readContext:Kn,use:Fc,useCallback:pg,useContext:Kn,useEffect:_h,useImperativeHandle:dg,useInsertionEffect:ug,useLayoutEffect:fg,useMemo:mg,useReducer:ph,useRef:og,useState:function(){return ph(us)},useDebugValue:vh,useDeferredValue:function(t,n){var a=Cn();return hn===null?xh(a,t,n):gg(a,hn.memoizedState,t,n)},useTransition:function(){var t=ph(us)[0],n=Cn().memoizedState;return[typeof t=="boolean"?t:vl(t),n]},useSyncExternalStore:W0,useId:Sg,useHostTransitionStatus:yh,useFormState:rg,useActionState:rg,useOptimistic:function(t,n){var a=Cn();return hn!==null?Q0(a,hn,t,n):(a.baseState=t,[t,a.queue.dispatch])},useMemoCache:hh,useCacheRefresh:yg,useEffectEvent:cg};function Eh(t,n,a,r){n=t.memoizedState,a=a(r,n),a=a==null?n:I({},n,a),t.memoizedState=a,t.lanes===0&&(t.updateQueue.baseState=a)}var bh={enqueueSetState:function(t,n,a){t=t._reactInternals;var r=qi(),c=Is(r);c.payload=n,a!=null&&(c.callback=a),n=zs(t,c,r),n!==null&&(Oi(n,t,r),dl(n,t,r))},enqueueReplaceState:function(t,n,a){t=t._reactInternals;var r=qi(),c=Is(r);c.tag=1,c.payload=n,a!=null&&(c.callback=a),n=zs(t,c,r),n!==null&&(Oi(n,t,r),dl(n,t,r))},enqueueForceUpdate:function(t,n){t=t._reactInternals;var a=qi(),r=Is(a);r.tag=2,n!=null&&(r.callback=n),n=zs(t,r,a),n!==null&&(Oi(n,t,a),dl(n,t,a))}};function Rg(t,n,a,r,c,u,_){return t=t.stateNode,typeof t.shouldComponentUpdate=="function"?t.shouldComponentUpdate(r,u,_):n.prototype&&n.prototype.isPureReactComponent?!sl(a,r)||!sl(c,u):!0}function wg(t,n,a,r){t=n.state,typeof n.componentWillReceiveProps=="function"&&n.componentWillReceiveProps(a,r),typeof n.UNSAFE_componentWillReceiveProps=="function"&&n.UNSAFE_componentWillReceiveProps(a,r),n.state!==t&&bh.enqueueReplaceState(n,n.state,null)}function Nr(t,n){var a=n;if("ref"in n){a={};for(var r in n)r!=="ref"&&(a[r]=n[r])}if(t=t.defaultProps){a===n&&(a=I({},a));for(var c in t)a[c]===void 0&&(a[c]=t[c])}return a}function Cg(t){vc(t)}function Ng(t){console.error(t)}function Dg(t){vc(t)}function Wc(t,n){try{var a=t.onUncaughtError;a(n.value,{componentStack:n.stack})}catch(r){setTimeout(function(){throw r})}}function Ug(t,n,a){try{var r=t.onCaughtError;r(a.value,{componentStack:a.stack,errorBoundary:n.tag===1?n.stateNode:null})}catch(c){setTimeout(function(){throw c})}}function Th(t,n,a){return a=Is(a),a.tag=3,a.payload={element:null},a.callback=function(){Wc(t,n)},a}function Lg(t){return t=Is(t),t.tag=3,t}function Og(t,n,a,r){var c=a.type.getDerivedStateFromError;if(typeof c=="function"){var u=r.value;t.payload=function(){return c(u)},t.callback=function(){Ug(n,a,r)}}var _=a.stateNode;_!==null&&typeof _.componentDidCatch=="function"&&(t.callback=function(){Ug(n,a,r),typeof c!="function"&&(Ws===null?Ws=new Set([this]):Ws.add(this));var w=r.stack;this.componentDidCatch(r.value,{componentStack:w!==null?w:""})})}function iM(t,n,a,r,c){if(a.flags|=32768,r!==null&&typeof r=="object"&&typeof r.then=="function"){if(n=a.alternate,n!==null&&Mr(n,a,c,!0),a=Qn.current,a!==null){switch(a.tag){case 31:case 13:case 19:return ci===null?hu():a.alternate===null&&Rn===0&&(Rn=3),a.flags&=-257,a.flags|=65536,a.lanes=c,r===Dc?a.flags|=16384:(n=a.updateQueue,n===null?a.updateQueue=new Set([r]):n.add(r),cd(t,r,c)),!1;case 22:return a.flags|=65536,r===Dc?a.flags|=16384:(n=a.updateQueue,n===null?(n={transitions:null,markerInstances:null,retryQueue:new Set([r])},a.updateQueue=n):(a=n.retryQueue,a===null?n.retryQueue=new Set([r]):a.add(r)),cd(t,r,c)),!1}throw Error(s(435,a.tag))}return cd(t,r,c),hu(),!1}if(Le)return n=Qn.current,n!==null?((n.flags&65536)===0&&(n.flags|=256),n.flags|=65536,n.lanes=c,r!==Wf&&(t=Error(s(422),{cause:r}),ll(sa(t,a)))):(r!==Wf&&(n=Error(s(423),{cause:r}),ll(sa(n,a))),t=t.current.alternate,t.flags|=65536,c&=-c,t.lanes|=c,r=sa(r,a),c=Th(t.stateNode,r,c),eh(t,c),Rn!==4&&(Rn=2)),!1;var u=Error(s(520),{cause:r});if(u=sa(u,a),Rl===null?Rl=[u]:Rl.push(u),Rn!==4&&(Rn=2),n===null)return!0;r=sa(r,a),a=n;do{switch(a.tag){case 3:return a.flags|=65536,t=c&-c,a.lanes|=t,t=Th(a.stateNode,r,t),eh(a,t),!1;case 1:if(n=a.type,u=a.stateNode,(a.flags&128)===0&&(typeof n.getDerivedStateFromError=="function"||u!==null&&typeof u.componentDidCatch=="function"&&(Ws===null||!Ws.has(u))))return a.flags|=65536,c&=-c,a.lanes|=c,c=Lg(c),Og(c,t,a,r),eh(a,c),!1;break;case 22:if(a.memoizedState!==null)return a.flags|=65536,!1}a=a.return}while(a!==null);return!1}var Ah=Error(s(461)),Pn=!1;function Bn(t,n,a,r){n.child=t===null?B0(n,null,a,r):wr(n,t.child,a,r)}function Pg(t,n,a,r,c){a=a.render;var u=n.ref;if("ref"in r){var _={};for(var w in r)w!=="ref"&&(_[w]=r[w])}else _=r;return Er(n),r=lh(t,n,a,_,u,c),w=ch(),t!==null&&!Pn?(uh(t,n,c),fs(t,n,c)):(Le&&w&&bc(n),n.flags|=1,Bn(t,n,r,c),n.child)}function Ig(t,n,a,r,c){if(t===null){var u=a.type;return typeof u=="function"&&!Gf(u)&&u.defaultProps===void 0&&a.compare===null?(n.tag=15,n.type=u,zg(t,n,u,r,c)):(t=Mc(a.type,null,r,n,n.mode,c),t.ref=n.ref,t.return=n,n.child=t)}if(u=t.child,!Oh(t,c)){var _=u.memoizedProps;if(a=a.compare,a=a!==null?a:sl,a(_,r)&&t.ref===n.ref)return fs(t,n,c)}return n.flags|=1,t=ss(u,r),t.ref=n.ref,t.return=n,n.child=t}function zg(t,n,a,r,c){if(t!==null){var u=t.memoizedProps;if(sl(u,r)&&t.ref===n.ref)if(Pn=!1,n.pendingProps=r=u,Oh(t,c))(t.flags&131072)!==0&&(Pn=!0);else return n.lanes=t.lanes,fs(t,n,c)}return Rh(t,n,a,r,c)}function Bg(t,n,a,r){var c=r.children,u=t!==null?t.memoizedState:null;if(t===null&&n.stateNode===null&&(n.stateNode={_visibility:1,_pendingMarkers:null,_retryCache:null,_transitions:null}),r.mode==="hidden"){if((n.flags&128)!==0){if(u=u!==null?u.baseLanes|a:a,t!==null){for(r=n.child=t.child,c=0;r!==null;)c=c|r.lanes|r.childLanes,r=r.sibling;r=c&~u}else r=0,n.child=null;return Fg(t,n,u,a,r)}if((a&536870912)!==0)n.memoizedState={baseLanes:0,cachePool:null},t!==null&&Cc(n,u!==null?u.cachePool:null),u!==null?G0(n,u):ih(),V0(n);else return r=n.lanes=536870912,Fg(t,n,u!==null?u.baseLanes|a:a,a,r)}else u!==null?(Cc(n,u.cachePool),G0(n,u),Hs(),n.memoizedState=null):(t!==null&&Cc(n,null),ih(),Hs());return Bn(t,n,c,a),n.child}function Sl(t,n){return t!==null&&t.tag===22||n.stateNode!==null||(n.stateNode={_visibility:1,_pendingMarkers:null,_retryCache:null,_transitions:null}),n.sibling}function Fg(t,n,a,r,c){var u=Qf();return u=u===null?null:{parent:Ln._currentValue,pool:u},n.memoizedState={baseLanes:a,cachePool:u},t!==null&&Cc(n,null),ih(),V0(n),t!==null&&Mr(t,n,r,!0),n.childLanes=c,null}function Yc(t,n){return n=qc({mode:n.mode,children:n.children},t.mode),n.ref=t.ref,t.child=n,n.return=t,n}function Hg(t,n,a){return wr(n,t.child,null,a),t=Yc(n,n.pendingProps),t.flags|=2,ki(n),n.memoizedState=null,t}function aM(t,n,a){var r=n.pendingProps,c=(n.flags&128)!==0;if(n.flags&=-129,t===null){if(Le){if(r.mode==="hidden")return t=Yc(n,r),n.lanes=536870912,t.memoizedState={baseLanes:0,cachePool:null},Sl(null,t);if(sh(n),(t=mn)?(t=hv(t,la),t=t!==null&&t.data==="&"?t:null,t!==null&&(n.memoizedState={dehydrated:t,treeContext:Ns!==null?{id:Pa,overflow:Ia}:null,retryLane:536870912,hydrationErrors:null},a=E0(t),a.return=n,n.child=a,kn=n,mn=null)):t=null,t===null)throw Us(n);return n.lanes=536870912,null}return Yc(n,r)}var u=t.memoizedState;if(u!==null){var _=u.dehydrated;if(sh(n),c)if(n.flags&256)n.flags&=-257,n=Hg(t,n,a);else if(n.memoizedState!==null)n.child=t.child,n.flags|=128,n=null;else throw Error(s(558));else if(Pn||Mr(t,n,a,!1),c=(a&t.childLanes)!==0,Pn||c){if(Bs.current===null){if(r=dn,r!==null&&(_=ns(r,a),_!==0&&_!==u.retryLane))throw u.retryLane=_,vr(t,_),Oi(r,t,_),Ah;hu()}n=Hg(t,n,a)}else t=u.treeContext,mn=ua(_.nextSibling),kn=n,Le=!0,Ds=null,la=!1,t!==null&&A0(n,t),n=Yc(n,r),n.flags|=134221824;return n}return t=ss(t.child,{mode:r.mode,children:r.children}),t.ref=n.ref,n.child=t,t.return=n,t}function lo(t,n){var a=n.ref;if(a===null)t!==null&&t.ref!==null&&(n.flags|=4194816);else{if(typeof a!="function"&&typeof a!="object")throw Error(s(284));(t===null||t.ref!==a)&&(n.flags|=4194816)}}function Rh(t,n,a,r,c){return Er(n),a=lh(t,n,a,r,void 0,c),r=ch(),t!==null&&!Pn?(uh(t,n,c),fs(t,n,c)):(Le&&r&&bc(n),n.flags|=1,Bn(t,n,a,c),n.child)}function Gg(t,n,a,r,c,u){return Er(n),n.updateQueue=null,a=X0(n,r,a,c),k0(t),r=ch(),t!==null&&!Pn?(uh(t,n,u),fs(t,n,u)):(Le&&r&&bc(n),n.flags|=1,Bn(t,n,a,u),n.child)}function Vg(t,n,a,r,c){if(Er(n),n.stateNode===null){var u=Jr,_=a.contextType;typeof _=="object"&&_!==null&&(u=Kn(_)),u=new a(r,u),n.memoizedState=u.state!==null&&u.state!==void 0?u.state:null,u.updater=bh,n.stateNode=u,u._reactInternals=n,u=n.stateNode,u.props=r,u.state=n.memoizedState,u.refs={},$f(n),_=a.contextType,u.context=typeof _=="object"&&_!==null?Kn(_):Jr,u.state=n.memoizedState,_=a.getDerivedStateFromProps,typeof _=="function"&&(Eh(n,a,_,r),u.state=n.memoizedState),typeof a.getDerivedStateFromProps=="function"||typeof u.getSnapshotBeforeUpdate=="function"||typeof u.UNSAFE_componentWillMount!="function"&&typeof u.componentWillMount!="function"||(_=u.state,typeof u.componentWillMount=="function"&&u.componentWillMount(),typeof u.UNSAFE_componentWillMount=="function"&&u.UNSAFE_componentWillMount(),_!==u.state&&bh.enqueueReplaceState(u,u.state,null),ml(n,r,u,c),pl(),u.state=n.memoizedState),typeof u.componentDidMount=="function"&&(n.flags|=4194308),r=!0}else if(t===null){u=n.stateNode;var w=n.memoizedProps,z=Nr(a,w);u.props=z;var et=u.context,ht=a.contextType;_=Jr,typeof ht=="object"&&ht!==null&&(_=Kn(ht));var Tt=a.getDerivedStateFromProps;ht=typeof Tt=="function"||typeof u.getSnapshotBeforeUpdate=="function",w=n.pendingProps!==w,ht||typeof u.UNSAFE_componentWillReceiveProps!="function"&&typeof u.componentWillReceiveProps!="function"||(w||et!==_)&&wg(n,u,r,_),Ps=!1;var Q=n.memoizedState;u.state=Q,ml(n,r,u,c),pl(),et=n.memoizedState,w||Q!==et||Ps?(typeof Tt=="function"&&(Eh(n,a,Tt,r),et=n.memoizedState),(z=Ps||Rg(n,a,z,r,Q,et,_))?(ht||typeof u.UNSAFE_componentWillMount!="function"&&typeof u.componentWillMount!="function"||(typeof u.componentWillMount=="function"&&u.componentWillMount(),typeof u.UNSAFE_componentWillMount=="function"&&u.UNSAFE_componentWillMount()),typeof u.componentDidMount=="function"&&(n.flags|=4194308)):(typeof u.componentDidMount=="function"&&(n.flags|=4194308),n.memoizedProps=r,n.memoizedState=et),u.props=r,u.state=et,u.context=_,r=z):(typeof u.componentDidMount=="function"&&(n.flags|=4194308),r=!1)}else{u=n.stateNode,th(t,n),_=n.memoizedProps,ht=Nr(a,_),u.props=ht,Tt=n.pendingProps,Q=u.context,et=a.contextType,z=Jr,typeof et=="object"&&et!==null&&(z=Kn(et)),w=a.getDerivedStateFromProps,(et=typeof w=="function"||typeof u.getSnapshotBeforeUpdate=="function")||typeof u.UNSAFE_componentWillReceiveProps!="function"&&typeof u.componentWillReceiveProps!="function"||(_!==Tt||Q!==z)&&wg(n,u,r,z),Ps=!1,Q=n.memoizedState,u.state=Q,ml(n,r,u,c),pl();var ct=n.memoizedState;_!==Tt||Q!==ct||Ps||t!==null&&t.dependencies!==null&&Rc(t.dependencies)?(typeof w=="function"&&(Eh(n,a,w,r),ct=n.memoizedState),(ht=Ps||Rg(n,a,ht,r,Q,ct,z)||t!==null&&t.dependencies!==null&&Rc(t.dependencies))?(et||typeof u.UNSAFE_componentWillUpdate!="function"&&typeof u.componentWillUpdate!="function"||(typeof u.componentWillUpdate=="function"&&u.componentWillUpdate(r,ct,z),typeof u.UNSAFE_componentWillUpdate=="function"&&u.UNSAFE_componentWillUpdate(r,ct,z)),typeof u.componentDidUpdate=="function"&&(n.flags|=4),typeof u.getSnapshotBeforeUpdate=="function"&&(n.flags|=1024)):(typeof u.componentDidUpdate!="function"||_===t.memoizedProps&&Q===t.memoizedState||(n.flags|=4),typeof u.getSnapshotBeforeUpdate!="function"||_===t.memoizedProps&&Q===t.memoizedState||(n.flags|=1024),n.memoizedProps=r,n.memoizedState=ct),u.props=r,u.state=ct,u.context=z,r=ht):(typeof u.componentDidUpdate!="function"||_===t.memoizedProps&&Q===t.memoizedState||(n.flags|=4),typeof u.getSnapshotBeforeUpdate!="function"||_===t.memoizedProps&&Q===t.memoizedState||(n.flags|=1024),r=!1)}return u=r,lo(t,n),r=(n.flags&128)!==0,u||r?(u=n.stateNode,a=r&&typeof a.getDerivedStateFromError!="function"?null:u.render(),n.flags|=1,t!==null&&r?(n.child=wr(n,t.child,null,c),n.child=wr(n,null,a,c)):Bn(t,n,a,c),n.memoizedState=u.state,t=n.child):t=fs(t,n,c),t}function kg(t,n,a,r){return Sr(),n.flags|=256,Bn(t,n,a,r),n.child}var wh={dehydrated:null,treeContext:null,retryLane:0,hydrationErrors:null};function Ch(t){return{baseLanes:t,cachePool:U0()}}function Nh(t,n,a){return t=t!==null?t.childLanes&~a:0,n&&(t|=Yi),t}function Xg(t,n,a){var r=n.pendingProps,c=!1,u=(n.flags&128)!==0,_;if((_=u)||(_=t!==null&&t.memoizedState===null?!1:(Jn.current&2)!==0),_&&(c=!0,n.flags&=-129),_=(n.flags&32)!==0,n.flags&=-33,t===null){if(Le){if(c?Fs(n):Hs(),(t=mn)?(t=hv(t,la),t=t!==null&&t.data!=="&"?t:null,t!==null&&(n.memoizedState={dehydrated:t,treeContext:Ns!==null?{id:Pa,overflow:Ia}:null,retryLane:536870912,hydrationErrors:null},a=E0(t),a.return=n,n.child=a,kn=n,mn=null)):t=null,t===null)throw Us(n);return Cd(t)?n.lanes=32:n.lanes=536870912,null}return u=r.children,r=r.fallback,c?(Hs(),c=n.mode,u=qc({mode:"hidden",children:u},c),r=xr(r,c,a,null),u.return=n,r.return=n,u.sibling=r,n.child=u,r=n.child,r.memoizedState=Ch(a),r.childLanes=Nh(t,_,a),n.memoizedState=wh,Sl(null,r)):(Fs(n),Dh(n,u))}var w=t.memoizedState;if(w!==null){var z=w.dehydrated;if(z!==null)return sM(t,n,u,_,r,z,w,a)}return c?(Hs(),c=r.fallback,u=n.mode,w=t.child,z=w.sibling,r=ss(w,{mode:"hidden",children:r.children}),r.subtreeFlags=w.subtreeFlags&1206910976,z!==null?c=ss(z,c):(c=xr(c,u,a,null),c.flags|=2),c.return=n,r.return=n,r.sibling=c,n.child=r,Sl(null,r),r=n.child,c=t.child.memoizedState,c===null?c=Ch(a):(u=c.cachePool,u!==null?(w=Ln._currentValue,u=u.parent!==w?{parent:w,pool:w}:u):u=U0(),c={baseLanes:c.baseLanes|a,cachePool:u}),r.memoizedState=c,r.childLanes=Nh(t,_,a),n.memoizedState=wh,Sl(t.child,r)):(Fs(n),a=t.child,t=a.sibling,a=ss(a,{mode:"visible",children:r.children}),a.return=n,a.sibling=null,t!==null&&(_=n.deletions,_===null?(n.deletions=[t],n.flags|=16):_.push(t)),n.child=a,n.memoizedState=null,a)}function Dh(t,n){return n=qc({mode:"visible",children:n},t.mode),n.return=t,t.child=n}function qc(t,n){return t=Ni(22,t,null,n),t.lanes=0,t}function jc(t,n,a){return wr(n,t.child,null,a),t=Dh(n,n.pendingProps.children),t.flags|=2,n.memoizedState=null,t}function sM(t,n,a,r,c,u,_,w){if(a)return n.flags&256?(Fs(n),n.flags&=-257,jc(t,n,w)):n.memoizedState!==null?(Hs(),n.child=t.child,n.flags|=128,null):(Hs(),u=c.fallback,_=n.mode,c=qc({mode:"visible",children:c.children},_),u=xr(u,_,w,null),u.flags|=2,c.return=n,u.return=n,c.sibling=u,n.child=c,wr(n,t.child,null,w),c=n.child,c.memoizedState=Ch(w),c.childLanes=Nh(t,r,w),n.memoizedState=wh,Sl(null,c));if(Fs(n),Cd(u)){if(r=u.nextSibling&&u.nextSibling.dataset,r)var z=r.dgst;return r=z,r!==""&&(c=Error(s(419)),c.stack="",c.digest=r,ll({value:c,source:null,stack:null})),jc(t,n,w)}if(Pn||Mr(t,n,w,!1),r=(w&t.childLanes)!==0,Pn||r){if(Bs.current!==null)return jc(t,n,w);if(r=dn,r!==null&&(c=ns(r,w),c!==0&&c!==_.retryLane))throw _.retryLane=c,vr(t,c),Oi(r,t,c),Ah;return wd(u)||hu(),jc(t,n,w)}return wd(u)?(n.flags|=192,n.child=t.child,null):(t=_.treeContext,mn=ua(u.nextSibling),kn=n,Le=!0,Ds=null,la=!1,t!==null&&A0(n,t),n=Dh(n,c.children),n.flags|=134221824,n)}function Wg(t,n,a){t.lanes|=n;var r=t.alternate;r!==null&&(r.lanes|=n),Ac(t.return,n,a)}function Yg(t){for(var n=null;t!==null;){var a=t.alternate;a!==null&&Pc(a)===null&&(n=t),t=t.sibling}return n}function Zc(t,n,a,r,c,u){var _=t.memoizedState;_===null?t.memoizedState={isBackwards:n,rendering:null,renderingStartTime:0,last:r,tail:a,tailMode:c,treeForkCount:u}:(_.isBackwards=n,_.rendering=null,_.renderingStartTime=0,_.last=r,_.tail=a,_.tailMode=c,_.treeForkCount=u)}function Uh(t){var n=t.child;for(t.child=null;n!==null;){var a=n.sibling;n.sibling=t.child,t.child=n,n=a}}function Lh(t,n,a){var r=n.pendingProps,c=r.revealOrder,u=r.tail;r=r.children;var _=Jn.current;if(n.flags&128)return gl(n,_),null;var w=(_&2)!==0;if(w?(_=_&1|2,n.flags|=128):_&=1,gl(n,_),c==="backwards"&&t!==null?(Uh(t),Bn(t,n,r,a),Uh(t)):Bn(t,n,r,a),r=Le?ol:0,!w&&t!==null&&(t.flags&128)!==0)t:for(t=n.child;t!==null;){if(t.tag===13)t.memoizedState!==null&&Wg(t,a,n);else if(t.tag===19)Wg(t,a,n);else if(t.child!==null){t.child.return=t,t=t.child;continue}if(t===n)break t;for(;t.sibling===null;){if(t.return===null||t.return===n)break t;t=t.return}t.sibling.return=t.return,t=t.sibling}switch(c){case"backwards":a=Yg(n.child),a===null?(c=n.child,n.child=null):(c=a.sibling,a.sibling=null,Uh(n)),Zc(n,!0,c,null,u,r);break;case"unstable_legacy-backwards":for(a=null,c=n.child,n.child=null;c!==null;){if(t=c.alternate,t!==null&&Pc(t)===null){n.child=c;break}t=c.sibling,c.sibling=a,a=c,c=t}Zc(n,!0,a,null,u,r);break;case"together":Zc(n,!1,null,null,void 0,r);break;case"independent":n.memoizedState=null;break;default:a=Yg(n.child),a===null?(c=n.child,n.child=null):(c=a.sibling,a.sibling=null),Zc(n,!1,c,a,u,r)}return n.child}function qg(t,n,a){var r=n.pendingProps;return Ls(n,n.type,r.value),Bn(t,n,r.children,a),n.child}function fs(t,n,a){if(t!==null&&(n.dependencies=t.dependencies),Xs|=n.lanes,(a&n.childLanes)===0)if(t!==null){if(Mr(t,n,a,!1),(a&n.childLanes)===0)return null}else return null;if(t!==null&&n.child!==t.child)throw Error(s(153));if(n.child!==null){for(t=n.child,a=ss(t,t.pendingProps),n.child=a,a.return=n;t.sibling!==null;)t=t.sibling,a=a.sibling=ss(t,t.pendingProps),a.return=n;a.sibling=null}return n.child}function Oh(t,n){return(t.lanes&n)!==0?!0:(t=t.dependencies,!!(t!==null&&Rc(t)))}function rM(t,n,a){switch(n.tag){case 3:Y(n,n.stateNode.containerInfo),Ls(n,Ln,t.memoizedState.cache),Sr();break;case 27:case 5:Ve(n);break;case 4:Y(n,n.stateNode.containerInfo);break;case 10:Ls(n,n.type,n.memoizedProps.value);break;case 31:if(n.memoizedState!==null)return n.flags|=128,sh(n),null;break;case 13:var r=n.memoizedState;if(r!==null){if(r.dehydrated!==null)return Fs(n),n.flags|=128,null;r=Mr(t,n,a,!1);var c=n.child.childLanes;return r||(a&c)!==0?Xg(t,n,a):(Fs(n),t=fs(t,n,a),t!==null?t.sibling:null)}Fs(n);break;case 19:if(n.flags&128)return Lh(t,n,a);if(c=(t.flags&128)!==0,r=(a&n.childLanes)!==0,r||(Mr(t,n,a,!1),r=(a&n.childLanes)!==0),c){if(r)return Lh(t,n,a);n.flags|=128}if(c=n.memoizedState,c!==null&&(c.rendering=null,c.tail=null,c.lastEffect=null),gl(n,Jn.current),r)break;return null;case 22:return n.lanes=0,Bg(t,n,a,n.pendingProps);case 24:Ls(n,Ln,t.memoizedState.cache)}return fs(t,n,a)}function jg(t,n,a){if(t!==null)if(t.memoizedProps!==n.pendingProps)Pn=!0;else{if(!Oh(t,a)&&(n.flags&128)===0)return Pn=!1,rM(t,n,a);Pn=(t.flags&131072)!==0}else Pn=!1,Le&&(n.flags&1048576)!==0&&T0(n,ol,n.index);switch(n.lanes=0,n.tag){case 16:t:{var r=n.pendingProps;if(t=Ar(n.elementType),n.type=t,typeof t=="function")Gf(t)?(r=Nr(t,r),n.tag=1,n=Vg(null,n,t,r,a)):(n.tag=0,n=Rh(null,n,t,r,a));else{if(t!=null){var c=t.$$typeof;if(c===j){n.tag=11,n=Pg(null,n,t,r,a);break t}else if(c===ut){n.tag=14,n=Ig(null,n,t,r,a);break t}else if(c===nt){n.tag=10,n.type=t,n=qg(null,n,a);break t}}throw n=Ct(t)||t,Error(s(306,n,""))}}return n;case 0:return Rh(t,n,n.type,n.pendingProps,a);case 1:return r=n.type,c=Nr(r,n.pendingProps),Vg(t,n,r,c,a);case 3:t:{if(Y(n,n.stateNode.containerInfo),t===null)throw Error(s(387));r=n.pendingProps;var u=n.memoizedState;c=u.element,th(t,n),ml(n,r,null,a);var _=n.memoizedState;if(r=_.cache,Ls(n,Ln,r),r!==u.cache&&jf(n,[Ln],a,!0),pl(),r=_.element,u.isDehydrated)if(u={element:r,isDehydrated:!1,cache:_.cache},n.updateQueue.baseState=u,n.memoizedState=u,n.flags&256){n=kg(t,n,r,a);break t}else if(r!==c){c=sa(Error(s(424)),n),ll(c),n=kg(t,n,r,a);break t}else for(t=n.stateNode.containerInfo,t.nodeType===9?t=t.body:t=t.nodeName==="HTML"?t.ownerDocument.body:t,mn=ua(t.firstChild),kn=n,Le=!0,Ds=null,la=!0,a=B0(n,null,r,a),n.child=a;a;)a.flags=a.flags&-3|134221824,a=a.sibling;else{if(Sr(),r===c){n=fs(t,n,a);break t}Bn(t,n,r,a)}n=n.child}return n;case 26:return lo(t,n),t===null?(a=xv(n.type,null,n.pendingProps,null))?n.memoizedState=a:Le||(n.stateNode=J_(n.type,n.pendingProps,je.current,n)):n.memoizedState=xv(n.type,t.memoizedProps,n.pendingProps,t.memoizedState),null;case 27:return Ve(n),t===null&&Le&&(r=n.stateNode=mv(n.type,n.pendingProps,je.current),kn=n,la=!0,c=mn,js(n.type)?(Nd=c,mn=ua(r.firstChild)):mn=c),Bn(t,n,n.pendingProps.children,a),lo(t,n),t===null&&(n.flags|=4194304),n.child;case 5:return t===null&&Le&&((c=r=mn)&&(r=tE(r,n.type,n.pendingProps,la),r!==null?(n.stateNode=r,kn=n,mn=ua(r.firstChild),la=!1,c=!0):c=!1),c||Us(n)),Ve(n),c=n.type,u=n.pendingProps,_=t!==null?t.memoizedProps:null,r=u.children,yd(c,u)?r=null:_!==null&&yd(c,_)&&(n.flags|=32),n.memoizedState!==null&&(c=lh(t,n,Zy,null,null,a),Ro._currentValue=c),lo(t,n),Bn(t,n,r,a),n.child;case 6:return t===null&&Le&&((t=a=mn)&&(a=eE(a,n.pendingProps,la),a!==null?(n.stateNode=a,kn=n,mn=null,t=!0):t=!1),t||Us(n)),null;case 13:return Xg(t,n,a);case 4:return Y(n,n.stateNode.containerInfo),r=n.pendingProps,t===null?n.child=wr(n,null,r,a):Bn(t,n,r,a),n.child;case 11:return Pg(t,n,n.type,n.pendingProps,a);case 7:return r=n.pendingProps,lo(t,n),Bn(t,n,r,a),n.child;case 8:return Bn(t,n,n.pendingProps.children,a),n.child;case 12:return Bn(t,n,n.pendingProps.children,a),n.child;case 10:return qg(t,n,a);case 9:return c=n.type._context,r=n.pendingProps.children,Er(n),c=Kn(c),r=r(c),n.flags|=1,Bn(t,n,r,a),n.child;case 14:return Ig(t,n,n.type,n.pendingProps,a);case 15:return zg(t,n,n.type,n.pendingProps,a);case 19:return Lh(t,n,a);case 31:return aM(t,n,a);case 22:return Bg(t,n,a,n.pendingProps);case 24:return Er(n),r=Kn(Ln),t===null?(c=Qf(),c===null&&(c=dn,u=Zf(),c.pooledCache=u,u.refCount++,u!==null&&(c.pooledCacheLanes|=a),c=u),n.memoizedState={parent:r,cache:c},$f(n),Ls(n,Ln,c)):((t.lanes&a)!==0&&(th(t,n),ml(n,null,null,a),pl()),c=t.memoizedState,u=n.memoizedState,c.parent!==r?(c={parent:r,cache:r},n.memoizedState=c,n.lanes===0&&(n.memoizedState=n.updateQueue.baseState=c),Ls(n,Ln,r)):(r=u.cache,Ls(n,Ln,r),r!==c.cache&&jf(n,[Ln],a,!0))),Bn(t,n,n.pendingProps.children,a),n.child;case 30:return n.stateNode===null&&(n.stateNode={autoName:null,paired:null,clones:null,ref:null}),r=n.pendingProps,r.name!=null&&r.name!=="auto"?n.flags|=t===null?18882560:18874368:Le&&bc(n),t!==null&&t.memoizedProps.name!==r.name?n.flags|=4194816:lo(t,n),Bn(t,n,r.children,a),n.child;case 29:throw n.pendingProps}throw Error(s(156,n.tag))}function hs(t){t.flags|=4}function Ph(t,n,a,r,c){var u;if((u=(t.mode&32)!==0)&&(u=a===null?Ev(n,r):Ev(n,r)&&(r.src!==a.src||r.srcSet!==a.srcSet)),u){if(t.flags|=16777216,(c&335544128)===c)if(t.stateNode.complete)t.flags|=8192;else if(C_())t.flags|=8192;else throw Rr=Dc,Jf}else t.flags&=-16777217}function Zg(t,n){if(n.type!=="stylesheet"||(n.state.loading&4)!==0)t.flags&=-16777217;else if(t.flags|=16777216,!bv(n))if(C_())t.flags|=8192;else throw Rr=Dc,Jf}function Kc(t,n){n!==null&&(t.flags|=4),t.flags&16384&&(n=t.tag!==22?es():536870912,t.lanes|=n,po|=n)}function yl(t,n){if(!Le)switch(t.tailMode){case"visible":break;case"collapsed":for(var a=t.tail,r=null;a!==null;)a.alternate!==null&&(r=a),a=a.sibling;r===null?n||t.tail===null?t.tail=null:t.tail.sibling=null:r.sibling=null;break;default:for(n=t.tail,a=null;n!==null;)n.alternate!==null&&(a=n),n=n.sibling;a===null?t.tail=null:a.sibling=null}}function gn(t){var n=t.alternate!==null&&t.alternate.child===t.child,a=0,r=0;if(n)for(var c=t.child;c!==null;)a|=c.lanes|c.childLanes,r|=c.subtreeFlags&1206910976,r|=c.flags&1206910976,c.return=t,c=c.sibling;else for(c=t.child;c!==null;)a|=c.lanes|c.childLanes,r|=c.subtreeFlags,r|=c.flags,c.return=t,c=c.sibling;return t.subtreeFlags|=r,t.childLanes=a,n}function oM(t,n,a){var r=n.pendingProps;switch(Xf(n),n.tag){case 16:case 15:case 0:case 11:case 7:case 8:case 12:case 9:case 14:return gn(n),null;case 1:return gn(n),null;case 3:return a=n.stateNode,r=null,t!==null&&(r=t.memoizedState.cache),n.memoizedState.cache!==r&&(n.flags|=2048),ls(Ln),pn(),a.pendingContext&&(a.context=a.pendingContext,a.pendingContext=null),(t===null||t.child===null)&&(eo(n)?hs(n):t===null||t.memoizedState.isDehydrated&&(n.flags&256)===0||(n.flags|=1024,Yf())),gn(n),null;case 26:var c=n.type,u=n.memoizedState;return t===null?(hs(n),u!==null?(gn(n),Zg(n,u)):(gn(n),Ph(n,c,null,r,a))):u?u!==t.memoizedState?(hs(n),gn(n),Zg(n,u)):(gn(n),n.flags&=-16777217):(t=t.memoizedProps,t!==r&&hs(n),gn(n),Ph(n,c,t,r,a)),null;case 27:if(P(n),a=je.current,c=n.type,t!==null&&n.stateNode!=null)t.memoizedProps!==r&&hs(n);else{if(!r){if(n.stateNode===null)throw Error(s(166));return gn(n),n.subtreeFlags&=-33554433,null}t=Jt.current,eo(n)?R0(n):(t=mv(c,r,a),n.stateNode=t,hs(n))}return gn(n),n.subtreeFlags&=-33554433,null;case 5:if(P(n),c=n.type,t!==null&&n.stateNode!=null)t.memoizedProps!==r&&hs(n);else{if(!r){if(n.stateNode===null)throw Error(s(166));return gn(n),n.subtreeFlags&=-33554433,null}if(u=Jt.current,eo(n))R0(n);else{var _=Ul(je.current);switch(u){case 1:u=_.createElementNS("http://www.w3.org/2000/svg",c);break;case 2:u=_.createElementNS("http://www.w3.org/1998/Math/MathML",c);break;default:switch(c){case"svg":u=_.createElementNS("http://www.w3.org/2000/svg",c);break;case"math":u=_.createElementNS("http://www.w3.org/1998/Math/MathML",c);break;case"script":u=_.createElement("div"),u.innerHTML="<script><\/script>",u=u.removeChild(u.firstChild);break;case"select":u=typeof r.is=="string"?_.createElement("select",{is:r.is}):_.createElement("select"),r.multiple?u.multiple=!0:r.size&&(u.size=r.size);break;default:u=typeof r.is=="string"?_.createElement(c,{is:r.is}):_.createElement(c)}}u[A]=n,u[H]=r;t:for(_=n.child;_!==null;){if(_.tag===5||_.tag===6)u.appendChild(_.stateNode);else if(_.tag!==4&&_.tag!==27&&_.child!==null){_.child.return=_,_=_.child;continue}if(_===n)break t;for(;_.sibling===null;){if(_.return===null||_.return===n)break t;_=_.return}_.sibling.return=_.return,_=_.sibling}n.stateNode=u;t:switch(ti(u,c,r),c){case"button":case"input":case"select":case"textarea":r=!!r.autoFocus;break t;case"img":r=!0;break t;default:r=!1}r&&hs(n)}}return gn(n),n.subtreeFlags&=-33554433,Ph(n,n.type,t===null?null:t.memoizedProps,n.pendingProps,a),null;case 6:if(t&&n.stateNode!=null)t.memoizedProps!==r&&hs(n);else{if(typeof r!="string"&&n.stateNode===null)throw Error(s(166));if(t=je.current,eo(n)){if(t=n.stateNode,a=n.memoizedProps,r=null,c=kn,c!==null)switch(c.tag){case 27:case 5:r=c.memoizedProps}t[A]=n,t=!!(t.nodeValue===a||r!==null&&r.suppressHydrationWarning===!0||j_(t.nodeValue,a)),t||Us(n,!0)}else t=Ul(t).createTextNode(r),t[A]=n,n.stateNode=t}return gn(n),null;case 31:if(a=n.memoizedState,t===null||t.memoizedState!==null){if(r=eo(n),a!==null){if(t===null){if(!r)throw Error(s(318));if(t=n.memoizedState,t=t!==null?t.dehydrated:null,!t)throw Error(s(557));t[A]=n}else Sr(),(n.flags&128)===0&&(n.memoizedState=null),n.flags|=4;gn(n),t=!1}else a=Yf(),t!==null&&t.memoizedState!==null&&(t.memoizedState.hydrationErrors=a),t=!0;if(!t)return n.flags&256?(ki(n),n):(ki(n),null);if((n.flags&128)!==0)throw Error(s(558))}return gn(n),null;case 13:if(r=n.memoizedState,t===null||t.memoizedState!==null&&t.memoizedState.dehydrated!==null){if(c=eo(n),r!==null&&r.dehydrated!==null){if(t===null){if(!c)throw Error(s(318));if(c=n.memoizedState,c=c!==null?c.dehydrated:null,!c)throw Error(s(317));c[A]=n}else Sr(),(n.flags&128)===0&&(n.memoizedState=null),n.flags|=4;gn(n),c=!1}else c=Yf(),t!==null&&t.memoizedState!==null&&(t.memoizedState.hydrationErrors=c),c=!0;if(!c)return n.flags&256?(ki(n),n):(ki(n),null)}return ki(n),(n.flags&128)!==0?(n.lanes=a,n):(a=r!==null,t=t!==null&&t.memoizedState!==null,a&&(r=n.child,c=null,r.alternate!==null&&r.alternate.memoizedState!==null&&r.alternate.memoizedState.cachePool!==null&&(c=r.alternate.memoizedState.cachePool.pool),u=null,r.memoizedState!==null&&r.memoizedState.cachePool!==null&&(u=r.memoizedState.cachePool.pool),u!==c&&(r.flags|=2048)),a!==t&&a&&(n.child.flags|=8192),Kc(n,n.updateQueue),gn(n),null);case 4:return pn(),t===null&&gd(n.stateNode.containerInfo),n.flags|=67108864,gn(n),null;case 10:return ls(n.type),gn(n),null;case 19:if(rh(n),r=n.memoizedState,r===null)return gn(n),null;if(c=(n.flags&128)!==0,u=r.rendering,u===null)if(c)yl(r,!1);else{if(Rn!==0||t!==null&&(t.flags&128)!==0)for(t=n.child;t!==null;){if(u=Pc(t),u!==null){for(n.flags|=128,yl(r,!1),t=u.updateQueue,n.updateQueue=t,Kc(n,t),n.subtreeFlags=0,t=a,a=n.child;a!==null;)M0(a,t),a=a.sibling;return gl(n,Jn.current&1|2),Le&&rs(n,r.treeForkCount),n.child}t=t.sibling}r.tail!==null&&qt()>lu&&(n.flags|=128,c=!0,yl(r,!1),n.lanes=4194304)}else{if(!c)if(t=Pc(u),t!==null){if(n.flags|=128,c=!0,t=t.updateQueue,n.updateQueue=t,Kc(n,t),yl(r,!0),r.tail===null&&r.tailMode!=="collapsed"&&r.tailMode!=="visible"&&!u.alternate&&!Le)return gn(n),null}else 2*qt()-r.renderingStartTime>lu&&a!==536870912&&(n.flags|=128,c=!0,yl(r,!1),n.lanes=4194304);r.isBackwards?(u.sibling=n.child,n.child=u):(t=r.last,t!==null?t.sibling=u:n.child=u,r.last=u)}if(r.tail!==null){t=r.tail;t:{for(a=t;a!==null;){if(a.alternate!==null){a=!1;break t}a=a.sibling}a=!0}return r.rendering=t,r.tail=t.sibling,r.renderingStartTime=qt(),t.sibling=null,u=Jn.current,u=c?u&1|2:u&1,r.tailMode==="visible"||r.tailMode==="collapsed"||!a||Le?gl(n,u):(a=u,fe(Qn,n),fe(Jn,a),ci===null&&(ci=n)),Le&&rs(n,r.treeForkCount),t}return gn(n),null;case 22:case 23:return ki(n),ah(),r=n.memoizedState!==null,t!==null?t.memoizedState!==null!==r&&(n.flags|=8192):r&&(n.flags|=8192),r?(a&536870912)!==0&&(n.flags&128)===0&&(gn(n),n.subtreeFlags&6&&(n.flags|=8192)):gn(n),a=n.updateQueue,a!==null&&Kc(n,a.retryQueue),a=null,t!==null&&t.memoizedState!==null&&t.memoizedState.cachePool!==null&&(a=t.memoizedState.cachePool.pool),r=null,n.memoizedState!==null&&n.memoizedState.cachePool!==null&&(r=n.memoizedState.cachePool.pool),r!==a&&(n.flags|=2048),t!==null&&ce(Tr),null;case 24:return a=null,t!==null&&(a=t.memoizedState.cache),n.memoizedState.cache!==a&&(n.flags|=2048),ls(Ln),gn(n),null;case 25:return null;case 30:return n.flags|=33554432,gn(n),null}throw Error(s(156,n.tag))}function lM(t,n){switch(Xf(n),n.tag){case 1:return t=n.flags,t&65536?(n.flags=t&-65537|128,n):null;case 3:return ls(Ln),pn(),t=n.flags,(t&65536)!==0&&(t&128)===0?(n.flags=t&-65537|128,n):null;case 26:case 27:case 5:return P(n),null;case 31:if(n.memoizedState!==null){if(ki(n),n.alternate===null)throw Error(s(340));Sr()}return t=n.flags,t&65536?(n.flags=t&-65537|128,n):null;case 13:if(ki(n),t=n.memoizedState,t!==null&&t.dehydrated!==null){if(n.alternate===null)throw Error(s(340));Sr()}return t=n.flags,t&65536?(n.flags=t&-65537|128,n):null;case 19:return rh(n),t=n.flags,t&65536?(n.flags=t&-65537|128,t=n.memoizedState,t!==null&&(t.rendering=null,t.tail=null),n.flags|=4,n):null;case 4:return pn(),null;case 10:return ls(n.type),null;case 22:case 23:return ki(n),ah(),t!==null&&ce(Tr),t=n.flags,t&65536?(n.flags=t&-65537|128,n):null;case 24:return ls(Ln),null;case 25:return null;default:return null}}function Kg(t,n){switch(Xf(n),n.tag){case 3:ls(Ln),pn();break;case 26:case 27:case 5:P(n);break;case 4:pn();break;case 31:n.memoizedState!==null&&ki(n);break;case 13:ki(n);break;case 19:rh(n);break;case 10:ls(n.type);break;case 22:case 23:ki(n),ah(),t!==null&&ce(Tr);break;case 24:ls(Ln)}}function Ml(t,n){try{var a=n.updateQueue,r=a!==null?a.lastEffect:null;if(r!==null){var c=r.next;a=c;do{if((a.tag&t)===t){r=void 0;var u=a.create,_=a.inst;r=u(),_.destroy=r}a=a.next}while(a!==c)}}catch(w){on(n,n.return,w)}}function Gs(t,n,a){try{var r=n.updateQueue,c=r!==null?r.lastEffect:null;if(c!==null){var u=c.next;r=u;do{if((r.tag&t)===t){var _=r.inst,w=_.destroy;if(w!==void 0){_.destroy=void 0,c=n;var z=a,et=w;try{et()}catch(ht){on(c,z,ht)}}}r=r.next}while(r!==u)}}catch(ht){on(n,n.return,ht)}}function Qg(t){var n=t.updateQueue;if(n!==null){var a=t.stateNode;try{H0(n,a)}catch(r){on(t,t.return,r)}}}function Jg(t,n,a){a.props=Nr(t.type,t.memoizedProps),a.state=t.memoizedState;try{a.componentWillUnmount()}catch(r){on(t,n,r)}}function za(t,n){try{var a=t.ref;if(a!==null){switch(t.tag){case 26:case 27:case 5:var r=t.stateNode;break;case 30:var c=t.stateNode,u=is(t.memoizedProps,c);(c.ref===null||c.ref.name!==u)&&(c.ref=sv(u)),r=c.ref;break;case 7:if(t.stateNode===null){var _=new ji(t);v(t.child,!1,JM,_,void 0,void 0),t.stateNode=_}r=t.stateNode;break;default:r=t.stateNode}typeof a=="function"?t.refCleanup=a(r):a.current=r}}catch(w){on(t,n,w)}}function $n(t,n){var a=t.ref,r=t.refCleanup;if(a!==null)if(typeof r=="function")try{r()}catch(c){on(t,n,c)}finally{t.refCleanup=null,t=t.alternate,t!=null&&(t.refCleanup=null)}else if(typeof a=="function")try{a(null)}catch(c){on(t,n,c)}else a.current=null}function Qc(t,n){if((t.tag===5||t.tag===27||t.tag===6)&&t.alternate===null&&n!==null)for(var a=0;a<n.length;a++)fv(t.stateNode,n[a])}function $g(t){for(var n=t.return;n!==null&&(zh(n)&&fv(t.stateNode,n.stateNode),!Ih(n));)n=n.return}function El(t){for(var n=t.return;n!==null&&(zh(n)&&$M(t.stateNode,n.stateNode),!Ih(n));)n=n.return}function Ih(t){return t.tag===5||t.tag===3||t.tag===27}function zh(t){return t&&t.tag===7&&t.stateNode!==null}function Bh(t){var n=t.type,a=t.memoizedProps,r=t.stateNode;try{t:switch(n){case"button":case"input":case"select":case"textarea":a.autoFocus&&r.focus();break t;case"img":a.src?r.src=a.src:a.srcSet&&(r.srcset=a.srcSet)}}catch(c){on(t,t.return,c)}}function Fh(t,n,a){try{var r=t.stateNode;OM(r,t.type,a,n),r[H]=n}catch(c){on(t,t.return,c)}}function t_(t){return t.tag===5||t.tag===3||t.tag===26||t.tag===27&&js(t.type)||t.tag===4}function Hh(t){t:for(;;){for(;t.sibling===null;){if(t.return===null||t_(t.return))return null;t=t.return}for(t.sibling.return=t.return,t=t.sibling;t.tag!==5&&t.tag!==6&&t.tag!==18;){if(t.tag===27&&js(t.type)||t.flags&2||t.child===null||t.tag===4)continue t;t.child.return=t,t=t.child}if(!(t.flags&2))return t.stateNode}}function Gh(t,n,a,r){var c=t.tag;if(c===5||c===6)c=t.stateNode,n?(a.nodeType===9?a.body:a.nodeName==="HTML"?a.ownerDocument.body:a).insertBefore(c,n):(n=a.nodeType===9?a.body:a.nodeName==="HTML"?a.ownerDocument.body:a,n.appendChild(c),a=a._reactRootContainer,a!=null||n.onclick!==null||(n.onclick=ia)),Qc(t,r),Ce=!0;else if(c!==4&&(c===27&&(Qc(t,r),r=null,js(t.type)&&(a=t.stateNode,n=null)),t=t.child,t!==null))for(Gh(t,n,a,r),t=t.sibling;t!==null;)Gh(t,n,a,r),t=t.sibling}function Jc(t,n,a,r){var c=t.tag;if(c===5||c===6)c=t.stateNode,n?a.insertBefore(c,n):a.appendChild(c),Qc(t,r),Ce=!0;else if(c!==4&&(c===27&&(Qc(t,r),r=null,js(t.type)&&(a=t.stateNode)),t=t.child,t!==null))for(Jc(t,n,a,r),t=t.sibling;t!==null;)Jc(t,n,a,r),t=t.sibling}function e_(t){var n=t.stateNode,a=t.memoizedProps;try{for(var r=t.type,c=n.attributes;c.length;)n.removeAttributeNode(c[0]);ti(n,r,a),n[A]=t,n[H]=a}catch(u){on(t,t.return,u)}}var $c=!1,Xi=null;function n_(t){(t.tag===30||(t.subtreeFlags&33554432)!==0)&&($c=!0)}var Ba=null;function i_(){var t=Ba;return Ba=null,t}var Di=0;function co(t,n,a,r,c){return Di=0,a_(t.child,n,a,r,c)}function a_(t,n,a,r,c){for(var u=!1;t!==null;){if(t.tag===5){var _=t.stateNode;if(r!==null){var w=bd(_);r.push(w),w.view&&(u=!0)}else u||bd(_).view&&(u=!0);$c=!0,iv(_,Di===0?n:n+"_"+Di,a),Di++}else(t.tag!==22||t.memoizedState===null)&&(t.tag===30&&c||a_(t.child,n,a,r,c)&&(u=!0));t=t.sibling}return u}function Fa(t,n){for(;t!==null;)t.tag===5?av(t.stateNode,t.memoizedProps):(t.tag!==22||t.memoizedState===null)&&(t.tag===30&&n||Fa(t.child,n)),t=t.sibling}function tu(t){if((t.subtreeFlags&18874368)!==0)for(t=t.child;t!==null;){if((t.tag!==22||t.memoizedState===null)&&(tu(t),t.tag===30&&(t.flags&18874368)!==0&&t.stateNode.paired)){var n=t.memoizedProps;if(n.name==null||n.name==="auto")throw Error(s(544));var a=n.name;n=as(n.default,n.share),n!=="none"&&(co(t,a,n,null,!1)||Fa(t.child,!1))}t=t.sibling}}function Vh(t,n){if(t.tag===30){var a=t.stateNode,r=t.memoizedProps,c=is(r,a),u=as(r.default,a.paired?r.share:r.enter);u!=="none"?co(t,c,u,null,!1)?(tu(t),a.paired||n||vo(t,r.onEnter)):Fa(t.child,!1):tu(t)}else if((t.subtreeFlags&33554432)!==0)for(t=t.child;t!==null;)Vh(t,n),t=t.sibling;else tu(t)}function kh(t){if(Xi!==null&&Xi.size!==0){var n=Xi;if((t.subtreeFlags&18874368)!==0)for(t=t.child;t!==null;){if(t.tag!==22||t.memoizedState===null){if(t.tag===30&&(t.flags&18874368)!==0){var a=t.memoizedProps,r=a.name;if(r!=null&&r!=="auto"){var c=n.get(r);if(c!==void 0){var u=as(a.default,a.share);if(u!=="none"&&(co(t,r,u,null,!1)?(u=t.stateNode,c.paired=u,u.paired=c,vo(t,a.onShare)):Fa(t.child,!1)),n.delete(r),n.size===0)break}}}kh(t)}t=t.sibling}}}function Xh(t){if(t.tag===30){var n=t.memoizedProps,a=is(n,t.stateNode),r=Xi!==null?Xi.get(a):void 0,c=as(n.default,r!==void 0?n.share:n.exit);c!=="none"&&(co(t,a,c,null,!1)?r!==void 0?(c=t.stateNode,r.paired=c,c.paired=r,Xi.delete(a),vo(t,n.onShare)):vo(t,n.onExit):Fa(t.child,!1)),Xi!==null&&kh(t)}else if((t.subtreeFlags&33554432)!==0)for(t=t.child;t!==null;)Xh(t),t=t.sibling;else Xi!==null&&kh(t)}function s_(t){for(t=t.child;t!==null;){if(t.tag===30){var n=t.memoizedProps,a=is(n,t.stateNode);n=as(n.default,n.update),t.flags&=-5,n!=="none"&&co(t,a,n,t.memoizedState=[],!1)}else(t.subtreeFlags&33554432)!==0&&s_(t);t=t.sibling}}function Wh(t){if((t.subtreeFlags&18874368)!==0)for(t=t.child;t!==null;){if(t.tag!==22||t.memoizedState===null){if(t.tag===30&&(t.flags&18874368)!==0){var n=t.stateNode;n.paired!==null&&(n.paired=null,Fa(t.child,!1))}Wh(t)}t=t.sibling}}function eu(t){if(t.tag===30)t.stateNode.paired=null,Fa(t.child,!1),Wh(t);else if((t.subtreeFlags&33554432)!==0)for(t=t.child;t!==null;)eu(t),t=t.sibling;else Wh(t)}function r_(t){for(t=t.child;t!==null;)t.tag===30?Fa(t.child,!1):(t.subtreeFlags&33554432)!==0&&r_(t),t=t.sibling}function Yh(t,n,a,r,c,u,_){for(var w=!1;n!==null;){if(n.tag===5){var z=n.stateNode;if(u!==null&&Di<u.length){var et=u[Di],ht=bd(z);(et.view||ht.view)&&(w=!0);var Tt;if(Tt=(t.flags&4)===0)if(ht.clip)Tt=!0;else{Tt=et.rect;var Q=ht.rect;Tt=Tt.y!==Q.y||Tt.x!==Q.x||Tt.height!==Q.height||Tt.width!==Q.width}Tt&&(t.flags|=4),ht.abs?ht=!et.abs:(et=et.rect,ht=ht.rect,ht=et.height!==ht.height||et.width!==ht.width),ht&&(t.flags|=32)}else t.flags|=32;(t.flags&4)!==0&&iv(z,Di===0?a:a+"_"+Di,c),w&&(t.flags&4)!==0||(Ba===null&&(Ba=[]),Ba.push(z,Di===0?r:r+"_"+Di,n.memoizedProps)),Di++}else(n.tag!==22||n.memoizedState===null)&&(n.tag===30&&_?t.flags|=n.flags&32:Yh(t,n.child,a,r,c,u,_)&&(w=!0));n=n.sibling}return w}function o_(t,n){for(t=t.child;t!==null;){if(t.tag===30){var a=t.memoizedProps,r=t.stateNode,c=is(a,r),u=as(a.default,a.update),_;_=t.memoizedState,t.memoizedState=null,r=t;var w=t.child;Di=0,c=Yh(r,w,c,c,u,_,!1),(t.flags&4)!==0&&c&&vo(t,a.onUpdate)}else(t.subtreeFlags&33554432)!==0&&o_(t);t=t.sibling}}var Xn=!1,an=!1,Ha=!1,qh=!1,l_=typeof WeakSet=="function"?WeakSet:Set,Wn=null,Ga=!1,bl=!1,nu=!1,jh=!1;function cM(t,n,a){if(t=t.containerInfo,xd=wo,t=h0(t),Of(t)){if("selectionStart"in t)var r={start:t.selectionStart,end:t.selectionEnd};else t:{r=(r=t.ownerDocument)&&r.defaultView||window;var c=r.getSelection&&r.getSelection();if(c&&c.rangeCount!==0){r=c.anchorNode;var u=c.anchorOffset,_=c.focusNode;c=c.focusOffset;try{r.nodeType,_.nodeType}catch{r=null;break t}var w=0,z=-1,et=-1,ht=0,Tt=0,Q=t,ct=null;e:for(;;){for(var Xt;Q!==r||u!==0&&Q.nodeType!==3||(z=w+u),Q!==_||c!==0&&Q.nodeType!==3||(et=w+c),Q.nodeType===3&&(w+=Q.nodeValue.length),(Xt=Q.firstChild)!==null;)ct=Q,Q=Xt;for(;;){if(Q===t)break e;if(ct===r&&++ht===u&&(z=w),ct===_&&++Tt===c&&(et=w),(Xt=Q.nextSibling)!==null)break;Q=ct,ct=Q.parentNode}Q=Xt}r=z===-1||et===-1?null:{start:z,end:et}}else r=null}r=r||{start:0,end:0}}else r=null;for(Sd={focusedElem:t,selectionRange:r},wo=!1,a=(a&335544064)===a,Wn=n,n=a?9270:1024;Wn!==null;){if(t=Wn,a&&(r=t.deletions,r!==null))for(u=0;u<r.length;u++)a&&Xh(r[u]);if(t.alternate===null&&(t.flags&2)!==0)a&&n_(t),iu(a);else{if(t.tag===22){if(r=t.alternate,t.memoizedState!==null){r!==null&&r.memoizedState===null&&a&&Xh(r),iu(a);continue}else if(r!==null&&r.memoizedState!==null){a&&n_(t),iu(a);continue}}r=t.child,(t.subtreeFlags&n)!==0&&r!==null?(r.return=t,Wn=r):(a&&s_(t),iu(a))}}Xi=null}function iu(t){for(;Wn!==null;){var n=Wn,a=t,r=n.alternate,c=n.flags;switch(n.tag){case 0:case 11:case 15:break;case 1:if((c&1024)!==0&&r!==null){a=void 0,c=r.memoizedProps,r=r.memoizedState;var u=n.stateNode;try{var _=Nr(n.type,c);a=u.getSnapshotBeforeUpdate(_,r),u.__reactInternalSnapshotBeforeUpdate=a}catch(w){on(n,n.return,w)}}break;case 3:if((c&1024)!==0){if(r=n.stateNode.containerInfo,a=r.nodeType,a===9)Rd(r);else if(a===1)switch(r.nodeName){case"HEAD":case"HTML":case"BODY":Rd(r);break;default:r.textContent=""}}break;case 5:case 26:case 27:case 6:case 4:case 17:break;case 30:a&&r!==null&&(a=is(r.memoizedProps,r.stateNode),c=n.memoizedProps,c=as(c.default,c.update),c!=="none"&&co(r,a,c,r.memoizedState=[],!0));break;default:if((c&1024)!==0)throw Error(s(163))}if(r=n.sibling,r!==null){r.return=n.return,Wn=r;break}Wn=n.return}}function c_(t,n,a){var r=a.flags;switch(a.tag){case 0:case 11:case 15:Va(t,a),r&4&&Ml(5,a);break;case 1:if(Va(t,a),r&4)if(t=a.stateNode,n===null)try{t.componentDidMount()}catch(_){on(a,a.return,_)}else{var c=Nr(a.type,n.memoizedProps);n=n.memoizedState;try{t.componentDidUpdate(c,n,t.__reactInternalSnapshotBeforeUpdate)}catch(_){on(a,a.return,_)}}r&64&&Qg(a),r&512&&za(a,a.return);break;case 3:if(Va(t,a),r&64&&(t=a.updateQueue,t!==null)){if(n=null,a.child!==null)switch(a.child.tag){case 27:case 5:n=a.child.stateNode;break;case 1:n=a.child.stateNode}try{H0(t,n)}catch(_){on(a,a.return,_)}}break;case 27:n===null&&r&4&&e_(a);case 26:case 5:Va(t,a),n===null&&r&4&&Bh(a),r&512&&za(a,a.return);break;case 12:Va(t,a);break;case 31:Va(t,a),r&4&&d_(t,a);break;case 13:Va(t,a),r&4&&p_(t,a),r&64&&(t=a.memoizedState,t!==null&&(t=t.dehydrated,t!==null&&(a=yM.bind(null,a),nE(t,a))));break;case 22:if(r=a.memoizedState!==null||Xn,!r){var u=n!==null&&n.memoizedState!==null||an;n=Xn,c=an,Xn=r,(an=u)&&!c?(r=2,(a.subtreeFlags&8772)!==0&&(r|=1),Ma(t,a,r)):Va(t,a),Xn=n,an=c}break;case 30:Va(t,a),r&512&&za(a,a.return);break;case 7:r&512&&za(a,a.return);default:Va(t,a)}}function Zh(t,n){for(t=t.child;t!==null;)u_(t,n),t=t.sibling}function u_(t,n){switch(t.tag){case 5:case 26:try{var a=t.stateNode;if(n){var r=a.style;typeof r.setProperty=="function"?r.setProperty("display","none","important"):r.display="none"}else{var c=t.stateNode,u=t.memoizedProps.style,_=u!=null&&u.hasOwnProperty("display")?u.display:null;c.style.display=_==null||typeof _=="boolean"?"":(""+_).trim()}}catch(z){on(t,t.return,z)}Kh(t,n);break;case 6:try{t.stateNode.nodeValue=n?"":t.memoizedProps,Ce=!0}catch(z){on(t,t.return,z)}break;case 18:try{var w=t.stateNode;n?nv(w,!0):nv(t.stateNode,!1)}catch(z){on(t,t.return,z)}break;case 22:case 23:t.memoizedState===null&&Zh(t,n);break;default:Zh(t,n)}}function Kh(t,n){if(t.subtreeFlags&67108864)for(t=t.child;t!==null;){t:{var a=t,r=n;switch(a.tag){case 4:u_(a,r);break t;case 22:a.memoizedState===null&&Kh(a,r);break t;default:Kh(a,r)}}t=t.sibling}}function f_(t){var n=t.alternate;n!==null&&(t.alternate=null,f_(n)),t.child=null,t.deletions=null,t.sibling=null,t.tag===5&&(n=t.stateNode,n!==null&&te(n)),t.stateNode=null,t.return=null,t.dependencies=null,t.memoizedProps=null,t.memoizedState=null,t.pendingProps=null,t.stateNode=null,t.updateQueue=null}var xn=null,Ui=!1;function Sa(t,n,a){for(a=a.child;a!==null;)h_(t,n,a),a=a.sibling}function h_(t,n,a){if(Ht&&typeof Ht.onCommitFiberUnmount=="function")try{Ht.onCommitFiberUnmount(se,a)}catch{}switch(a.tag){case 26:an||$n(a,n),Sa(t,n,a),a.memoizedState?a.memoizedState.count--:a.stateNode&&!an&&(a=a.stateNode,a.parentNode.removeChild(a));break;case 27:an||$n(a,n),El(a);var r=xn,c=Ui;js(a.type)&&(xn=a.stateNode,Ui=!1),Sa(t,n,a),gv(a.stateNode,a.type,a.memoizedProps),xn=r,Ui=c;break;case 5:an||$n(a,n),El(a);case 6:if(a.tag===6&&El(a),r=xn,c=Ui,xn=null,Sa(t,n,a),xn=r,Ui=c,xn!==null)if(Ui)try{(xn.nodeType===9?xn.body:xn.nodeName==="HTML"?xn.ownerDocument.body:xn).removeChild(a.stateNode),Ce=!0}catch(u){on(a,n,u)}else try{xn.removeChild(a.stateNode),Ce=!0}catch(u){on(a,n,u)}break;case 18:xn!==null&&(Ui?(t=xn,ev(t.nodeType===9?t.body:t.nodeName==="HTML"?t.ownerDocument.body:t,a.stateNode),Co(t)):ev(xn,a.stateNode));break;case 4:r=xn,c=Ui,xn=a.stateNode.containerInfo,Ui=!0,Sa(t,n,a),xn=r,Ui=c;break;case 0:case 11:case 14:case 15:Gs(2,a,n),an||Gs(4,a,n),Sa(t,n,a);break;case 1:an||($n(a,n),r=a.stateNode,typeof r.componentWillUnmount=="function"&&Jg(a,n,r)),Sa(t,n,a);break;case 21:Sa(t,n,a);break;case 22:an=(r=an)||a.memoizedState!==null,Sa(t,n,a),an=r;break;case 30:$n(a,n),Sa(t,n,a);break;case 7:an||$n(a,n),Sa(t,n,a);break;default:Sa(t,n,a)}}function d_(t,n){if(n.memoizedState===null&&(t=n.alternate,t!==null&&(t=t.memoizedState,t!==null))){t=t.dehydrated;try{Co(t)}catch(a){on(n,n.return,a)}}}function p_(t,n){if(n.memoizedState===null&&(t=n.alternate,t!==null&&(t=t.memoizedState,t!==null&&(t=t.dehydrated,t!==null))))try{Co(t)}catch(a){on(n,n.return,a)}}function uM(t){switch(t.tag){case 31:case 13:case 19:var n=t.stateNode;return n===null&&(n=t.stateNode=new l_),n;case 22:return t=t.stateNode,n=t._retryCache,n===null&&(n=t._retryCache=new l_),n;default:throw Error(s(435,t.tag))}}function au(t,n){var a=uM(t);n.forEach(function(r){if(!a.has(r)){a.add(r);var c=MM.bind(null,t,r);r.then(c,c)}})}function Si(t,n,a){var r=n.deletions;if(r!==null)for(var c=0;c<r.length;c++){var u=r[c],_=t,w=n,z=w;t:for(;z!==null;){switch(z.tag){case 27:if(js(z.type)){xn=z.stateNode,Ui=!1;break t}break;case 5:xn=z.stateNode,Ui=!1;break t;case 3:case 4:xn=z.stateNode.containerInfo,Ui=!0;break t}z=z.return}if(xn===null)throw Error(s(160));h_(_,w,u),xn=null,Ui=!1,_=u.alternate,_!==null&&(_.return=null),u.return=null}if(n.subtreeFlags&13886)for(n=n.child;n!==null;)m_(n,t,a),n=n.sibling}var ya=null;function m_(t,n,a){var r=t.alternate,c=t.flags;switch(t.tag){case 0:case 11:case 14:case 15:if(c&4&&(r=t.updateQueue,r=r!==null?r.events:null,r!==null))for(var u=0;u<r.length;u++){var _=r[u];_.ref.impl=_.nextImpl}Si(n,t,a),yi(t),c&4&&(Gs(3,t,t.return),Ml(3,t),Gs(5,t,t.return));break;case 1:Si(n,t,a),yi(t),c&512&&(an||r===null||$n(r,r.return)),c&64&&Xn&&(t=t.updateQueue,t!==null&&(n=t.callbacks,n!==null&&(a=t.shared.hiddenCallbacks,t.shared.hiddenCallbacks=a===null?n:a.concat(n))));break;case 26:if(u=ya,Si(n,t,a),yi(t),c&512&&(an||r===null||$n(r,r.return)),c&4)if(c=r!==null?r.memoizedState:null,a=t.memoizedState,r===null)if(a===null)if(t.stateNode===null)if(Xn)t.stateNode=J_(t.type,t.memoizedProps,n.containerInfo,t);else{t:{n=t.type,a=t.memoizedProps,c=u.ownerDocument||u;e:switch(n){case"title":r=c.getElementsByTagName("title")[0],(!r||r[It]||r[A]||r.namespaceURI==="http://www.w3.org/2000/svg"||r.hasAttribute("itemprop"))&&(r=c.createElement(n),c.head.insertBefore(r,c.querySelector("head > title"))),ti(r,n,a),r[A]=t,be(r),n=r;break t;case"link":if(u=Mv("link","href",c).get(n+(a.href||""))){for(_=0;_<u.length;_++)if(r=u[_],r.getAttribute("href")===(a.href==null||a.href===""?null:a.href)&&r.getAttribute("rel")===(a.rel==null?null:a.rel)&&r.getAttribute("title")===(a.title==null?null:a.title)&&r.getAttribute("crossorigin")===(a.crossOrigin==null?null:a.crossOrigin)){u.splice(_,1);break e}}r=c.createElement(n),ti(r,n,a),c.head.appendChild(r);break;case"meta":if(u=Mv("meta","content",c).get(n+(a.content||""))){for(_=0;_<u.length;_++)if(r=u[_],r.getAttribute("content")===(a.content==null?null:""+a.content)&&r.getAttribute("name")===(a.name==null?null:a.name)&&r.getAttribute("property")===(a.property==null?null:a.property)&&r.getAttribute("http-equiv")===(a.httpEquiv==null?null:a.httpEquiv)&&r.getAttribute("charset")===(a.charSet==null?null:a.charSet)){u.splice(_,1);break e}}r=c.createElement(n),ti(r,n,a),c.head.appendChild(r);break;default:throw Error(s(468,n))}r[A]=t,be(r),n=r}t.stateNode=n}else Xn||Od(u,t.type,t.stateNode);else t.stateNode=yv(u,a,t.memoizedProps);else c!==a?(c===null?(n=r.stateNode,n===null||an||n.parentNode.removeChild(n)):c.count--,a===null?Xn||Od(u,t.type,t.stateNode):yv(u,a,t.memoizedProps)):a===null&&t.stateNode!==null&&Fh(t,t.memoizedProps,r.memoizedProps);break;case 27:Si(n,t,a),yi(t),c&512&&(an||r===null||$n(r,r.return)),r!==null&&c&4&&Fh(t,t.memoizedProps,r.memoizedProps);break;case 5:if(u=Ha,Ha=!1,Si(n,t,a),Ha=u,yi(t),c&512&&(an||r===null||$n(r,r.return)),t.flags&32){n=t.stateNode;try{nn(n,""),Ce=!0}catch(ht){on(t,t.return,ht)}}c&4&&t.stateNode!=null&&(n=t.memoizedProps,Fh(t,n,r!==null?r.memoizedProps:n)),c&1024&&(qh=!0);break;case 6:if(Si(n,t,a),yi(t),c&4){if(t.stateNode===null)throw Error(s(162));n=t.memoizedProps,a=t.stateNode;try{a.nodeValue=n,Ce=!0}catch(ht){on(t,t.return,ht)}}break;case 3:if(Ce=!1,xu=null,u=ya,ya=Ll(n.containerInfo),Si(n,t,a),ya=u,yi(t),c&4&&r!==null&&r.memoizedState.isDehydrated)try{Co(n.containerInfo)}catch(ht){on(t,t.return,ht)}qh&&(qh=!1,g_(t)),Ce=!1;break;case 4:c=Ha,Ha=Xn,r=Ke(),u=ya,ya=Ll(t.stateNode.containerInfo),Si(n,t,a),yi(t),ya=u,Ce&&bl&&(nu=!0),Ce=r,Ha=c;break;case 12:Si(n,t,a),yi(t);break;case 31:Si(n,t,a),yi(t),c&4&&(n=t.updateQueue,n!==null&&(t.updateQueue=null,au(t,n)));break;case 13:Si(n,t,a),yi(t),t.child.flags&8192&&t.memoizedState!==null!=(r!==null&&r.memoizedState!==null)&&(ou=qt()),c&4&&(n=t.updateQueue,n!==null&&(t.updateQueue=null,au(t,n)));break;case 22:u=t.memoizedState!==null,_=r!==null&&r.memoizedState!==null;var w=Xn,z=an,et=Ha;Xn=w||u,Ha=et||u,an=z||_,Si(n,t,a),an=z,Ha=et,Xn=w,yi(t),c&8192&&(n=t.stateNode,n._visibility=u?n._visibility&-2:n._visibility|1,!u||r===null||_||Xn||an||(n=_||an,a=Xn,r=an,Xn=u||Xn,an=n,Vs(t,2),Xn=a,an=r),!u&&Ha||Zh(t,u)),c&4&&(n=t.updateQueue,n!==null&&(a=n.retryQueue,a!==null&&(n.retryQueue=null,au(t,a))));break;case 19:Si(n,t,a),yi(t),c&4&&(n=t.updateQueue,n!==null&&(t.updateQueue=null,au(t,n)));break;case 30:c&512&&(an||r===null||$n(r,r.return)),c=Ke(),u=bl,_=(a&335544064)===a,w=t.memoizedProps,bl=_&&as(w.default,w.update)!=="none",Si(n,t,a),yi(t),_&&r!==null&&Ce&&(t.flags|=4),bl=u,Ce=c;break;case 21:break;case 7:c&512&&(an||r===null||$n(r,r.return)),r&&r.stateNode!==null&&(r.stateNode._fragmentFiber=t);default:Si(n,t,a),yi(t)}}function yi(t){var n=t.flags;if(n&2){try{for(var a,r=t.return;r!==null;){if(t_(r)){a=r;break}r=r.return}r=null;for(var c=t.return;c!==null;){if(zh(c)){var u=c.stateNode;r===null?r=[u]:r.push(u)}if(Ih(c))break;c=c.return}var _=r;if(a==null)throw Error(s(160));switch(a.tag){case 27:var w=a.stateNode,z=Hh(t);Jc(t,z,w,_);break;case 5:var et=a.stateNode;a.flags&32&&(nn(et,""),a.flags&=-33);var ht=Hh(t);Jc(t,ht,et,_);break;case 3:case 4:var Tt=a.stateNode.containerInfo,Q=Hh(t);Gh(t,Q,Tt,_);break;default:throw Error(s(161))}}catch(ct){on(t,t.return,ct)}t.flags&=-3}n&4096&&(t.flags&=-4097)}function g_(t){if(t.subtreeFlags&1024)for(t=t.child;t!==null;){var n=t;g_(n),n.tag===5&&n.flags&1024&&(n=n.stateNode,wo=!0,n.reset(),wo=!1),t=t.sibling}}function uo(t,n){if(n.subtreeFlags&9270)for(n=n.child;n!==null;)__(n,t),n=n.sibling;else o_(n)}function __(t,n){var a=t.alternate;if(a===null)Vh(t,!1);else switch(t.tag){case 3:if(jh=Ga=!1,i_(),uo(n,t),!Ga&&!nu){if(t=Ba,t!==null)for(var r=0;r<t.length;r+=3){a=t[r];var c=t[r+1];av(a,t[r+2]),a=a.ownerDocument.documentElement,a!==null&&a.animate({opacity:[0,0],pointerEvents:["none","none"]},{duration:0,fill:"forwards",pseudoElement:"::view-transition-group("+c+")"})}t=n.containerInfo,t=t.nodeType===9?t.documentElement:t.ownerDocument.documentElement,t!==null&&t.style.viewTransitionName===""&&(t.style.viewTransitionName="none",t.animate({opacity:[0,0],pointerEvents:["none","none"]},{duration:0,fill:"forwards",pseudoElement:"::view-transition-group(root)"}),t.animate({width:[0,0],height:[0,0]},{duration:0,fill:"forwards",pseudoElement:"::view-transition"})),jh=!0}Ba=null;break;case 5:uo(n,t);break;case 4:r=Ga,Ga=!1,uo(n,t),Ga&&(nu=!0),Ga=r;break;case 22:t.memoizedState===null&&(a.memoizedState!==null?Vh(t,!1):uo(n,t));break;case 30:r=Ga,c=i_(),Ga=!1,uo(n,t),Ga&&(t.flags|=4);var u=t.memoizedProps,_=t.stateNode;n=is(u,_),_=is(a.memoizedProps,_);var w=as(u.default,u.update);w==="none"?n=!1:(u=a.memoizedState,a.memoizedState=null,a=t.child,Di=0,n=Yh(t,a,n,_,w,u,!0),Di!==(u===null?0:u.length)&&(t.flags|=32)),(t.flags&4)!==0&&n?(vo(t,t.memoizedProps.onUpdate),Ba=c):c!==null&&(c.push.apply(c,Ba),Ba=c),Ga=(t.flags&32)!==0?!0:r;break;default:uo(n,t)}}function Va(t,n){if(n.subtreeFlags&8772)for(n=n.child;n!==null;)c_(t,n.alternate,n),n=n.sibling}function Vs(t,n){for(t=t.child;t!==null;){var a=t,r=n;switch(a.tag){case 0:case 11:case 14:case 15:Gs(4,a,a.return),Vs(a,r);break;case 1:$n(a,a.return);var c=a.stateNode;typeof c.componentWillUnmount=="function"&&Jg(a,a.return,c),Vs(a,r);break;case 27:(r&2)!==0&&gv(a.stateNode,a.type,a.memoizedProps);case 5:$n(a,a.return),a.tag!==5&&a.tag!==27||El(a),Vs(a,r);break;case 6:El(a);break;case 26:$n(a,a.return),c=a.stateNode,a.memoizedState!==null||c===null||an||c.parentNode.removeChild(c),Vs(a,r);break;case 22:a.memoizedState===null&&Vs(a,r);break;case 30:$n(a,a.return),Vs(a,r);break;case 7:$n(a,a.return);default:Vs(a,r)}t=t.sibling}}function Ma(t,n,a){for(a=(n.subtreeFlags&8772)!==0?a:a&-2,n=n.child;n!==null;){var r=n.alternate,c=t,u=n,_=u.flags,w=(a&1)!==0;switch(u.tag){case 0:case 11:case 15:Ma(c,u,a),Ml(4,u);break;case 1:if(Ma(c,u,a),r=u,c=r.stateNode,typeof c.componentDidMount=="function")try{c.componentDidMount()}catch(ht){on(r,r.return,ht)}if(r=u,c=r.updateQueue,c!==null){var z=r.stateNode;try{var et=c.shared.hiddenCallbacks;if(et!==null)for(c.shared.hiddenCallbacks=null,c=0;c<et.length;c++)F0(et[c],z)}catch(ht){on(r,r.return,ht)}}w&&_&64&&Qg(u),za(u,u.return);break;case 27:(a&2)!==0&&e_(u);case 5:u.tag!==5&&u.tag!==27||$g(u),Ma(c,u,a),w&&r===null&&_&4&&Bh(u),za(u,u.return);break;case 6:$g(u);break;case 26:z=u.stateNode,u.memoizedState!==null||z===null||Xn||Od(Ll(z.ownerDocument),u.type,z),Ma(c,u,a),w&&r===null&&_&4&&Bh(u),za(u,u.return);break;case 12:Ma(c,u,a);break;case 31:Ma(c,u,a),w&&_&4&&d_(c,u);break;case 13:Ma(c,u,a),w&&_&4&&p_(c,u);break;case 22:u.memoizedState===null&&Ma(c,u,a),za(u,u.return);break;case 30:Ma(c,u,a),za(u,u.return);break;case 7:za(u,u.return);default:Ma(c,u,a)}n=n.sibling}}function Qh(t,n){var a=null;t!==null&&t.memoizedState!==null&&t.memoizedState.cachePool!==null&&(a=t.memoizedState.cachePool.pool),t=null,n.memoizedState!==null&&n.memoizedState.cachePool!==null&&(t=n.memoizedState.cachePool.pool),t!==a&&(t!=null&&t.refCount++,a!=null&&cl(a))}function Jh(t,n){t=null,n.alternate!==null&&(t=n.alternate.memoizedState.cache),n=n.memoizedState.cache,n!==t&&(n.refCount++,t!=null&&cl(t))}function ca(t,n,a,r){var c=(a&335544064)===a;if(n.subtreeFlags&(c?10262:10256))for(n=n.child;n!==null;)v_(t,n,a,r),n=n.sibling;else c&&r_(n)}function v_(t,n,a,r){var c=(a&335544064)===a;c&&n.alternate===null&&n.return!==null&&n.return.alternate!==null&&eu(n);var u=n.flags;switch(n.tag){case 0:case 11:case 15:ca(t,n,a,r),u&2048&&Ml(9,n);break;case 1:ca(t,n,a,r);break;case 3:ca(t,n,a,r),c&&jh&&(t=t.containerInfo,t=t.nodeType===9?t.body:t.nodeName==="HTML"?t.ownerDocument.body:t,t.style.viewTransitionName==="root"&&(t.style.viewTransitionName=""),t=t.ownerDocument.documentElement,t!==null&&t.style.viewTransitionName==="none"&&(t.style.viewTransitionName="")),u&2048&&(u=null,n.alternate!==null&&(u=n.alternate.memoizedState.cache),n=n.memoizedState.cache,n!==u&&(n.refCount++,u!=null&&cl(u)));break;case 12:if(u&2048){ca(t,n,a,r),u=n.stateNode;try{var _=n.memoizedProps,w=_.id,z=_.onPostCommit;typeof z=="function"&&z(w,n.alternate===null?"mount":"update",u.passiveEffectDuration,-0)}catch(et){on(n,n.return,et)}}else ca(t,n,a,r);break;case 31:ca(t,n,a,r);break;case 13:ca(t,n,a,r);break;case 23:break;case 22:_=n.stateNode,w=n.alternate,n.memoizedState!==null?(c&&w!==null&&w.memoizedState===null&&eu(w),_._visibility&2?ca(t,n,a,r):Tl(t,n)):(c&&w!==null&&w.memoizedState!==null&&eu(n),_._visibility&2?ca(t,n,a,r):(_._visibility|=2,fo(t,n,a,r,(n.subtreeFlags&10256)!==0||!1))),u&2048&&Qh(w,n);break;case 24:ca(t,n,a,r),u&2048&&Jh(n.alternate,n);break;case 30:c&&(u=n.alternate,u!==null&&(Fa(u.child,!0),Fa(n.child,!0))),ca(t,n,a,r);break;default:ca(t,n,a,r)}}function fo(t,n,a,r,c){for(c=c&&((n.subtreeFlags&10256)!==0||!1),n=n.child;n!==null;){var u=t,_=n,w=a,z=r,et=_.flags;switch(_.tag){case 0:case 11:case 15:fo(u,_,w,z,c),Ml(8,_);break;case 23:break;case 22:var ht=_.stateNode;_.memoizedState!==null?ht._visibility&2?fo(u,_,w,z,c):Tl(u,_):(ht._visibility|=2,fo(u,_,w,z,c)),c&&et&2048&&Qh(_.alternate,_);break;case 24:fo(u,_,w,z,c),c&&et&2048&&Jh(_.alternate,_);break;default:fo(u,_,w,z,c)}n=n.sibling}}function Tl(t,n){if(n.subtreeFlags&10256)for(n=n.child;n!==null;){var a=t,r=n,c=r.flags;switch(r.tag){case 22:Tl(a,r),c&2048&&Qh(r.alternate,r);break;case 24:Tl(a,r),c&2048&&Jh(r.alternate,r);break;default:Tl(a,r)}n=n.sibling}}var Dr=8192;function Ur(t,n,a){if(t.subtreeFlags&Dr)for(t=t.child;t!==null;)x_(t,n,a),t=t.sibling}function x_(t,n,a){switch(t.tag){case 26:Ur(t,n,a),t.flags&Dr&&(t.memoizedState!==null?gE(a,ya,t.memoizedState,t.memoizedProps):(t=t.stateNode,(n&335544128)===n&&Av(a,t)));break;case 5:Ur(t,n,a),t.flags&Dr&&(t=t.stateNode,(n&335544128)===n&&Av(a,t));break;case 3:case 4:var r=ya;ya=Ll(t.stateNode.containerInfo),Ur(t,n,a),ya=r;break;case 22:t.memoizedState===null&&(r=t.alternate,r!==null&&r.memoizedState!==null?(r=Dr,Dr=16777216,Ur(t,n,a),Dr=r):Ur(t,n,a));break;case 30:if((t.flags&Dr)!==0&&(r=t.memoizedProps.name,r!=null&&r!=="auto")){var c=t.stateNode;c.paired=null,Xi===null&&(Xi=new Map),Xi.set(r,c)}Ur(t,n,a);break;default:Ur(t,n,a)}}function S_(t){var n=t.alternate;if(n!==null&&(t=n.child,t!==null)){n.child=null;do n=t.sibling,t.sibling=null,t=n;while(t!==null)}}function Al(t){var n=t.deletions;if((t.flags&16)!==0){if(n!==null)for(var a=0;a<n.length;a++){var r=n[a];Wn=r,M_(r,t)}S_(t)}if(t.subtreeFlags&10256)for(t=t.child;t!==null;)y_(t),t=t.sibling}function y_(t){switch(t.tag){case 0:case 11:case 15:Al(t),t.flags&2048&&Gs(9,t,t.return);break;case 3:Al(t);break;case 12:Al(t);break;case 22:var n=t.stateNode;t.memoizedState!==null&&n._visibility&2&&(t.return===null||t.return.tag!==13)?(n._visibility&=-3,su(t)):Al(t);break;default:Al(t)}}function su(t){var n=t.deletions;if((t.flags&16)!==0){if(n!==null)for(var a=0;a<n.length;a++){var r=n[a];Wn=r,M_(r,t)}S_(t)}for(t=t.child;t!==null;){switch(n=t,n.tag){case 0:case 11:case 15:Gs(8,n,n.return),su(n);break;case 22:a=n.stateNode,a._visibility&2&&(a._visibility&=-3,su(n));break;default:su(n)}t=t.sibling}}function M_(t,n){for(;Wn!==null;){var a=Wn;switch(a.tag){case 0:case 11:case 15:Gs(8,a,n);break;case 23:case 22:if(a.memoizedState!==null&&a.memoizedState.cachePool!==null){var r=a.memoizedState.cachePool.pool;r!=null&&r.refCount++}break;case 24:cl(a.memoizedState.cache)}if(r=a.child,r!==null)r.return=a,Wn=r;else t:for(a=t;Wn!==null;){r=Wn;var c=r.sibling,u=r.return;if(f_(r),r===a){Wn=null;break t}if(c!==null){c.return=u,Wn=c;break t}Wn=u}}}var fM={getCacheForType:function(t){var n=Kn(Ln),a=n.data.get(t);return a===void 0&&(a=t(),n.data.set(t,a)),a},cacheSignal:function(){return Kn(Ln).controller.signal}},hM=typeof WeakMap=="function"?WeakMap:Map,en=0,dn=null,Fe=null,ke=0,rn=0,Wi=null,ks=!1,ho=!1,$h=!1,ds=0,Rn=0,Xs=0,Lr=0,ru=0,Yi=0,po=0,Rl=null,Li=null,td=!1,ou=0,E_=0,lu=1/0,cu=null,Ws=null,En=0,Ea=null,Or=null,ka=0,ed=0,nd=null,b_=null,mo=null,go=null,_o=null,wl=0,uu=null;function qi(){return(en&2)!==0&&ke!==0?ke&-ke:Mt.T!==null?hd():Rs()}function T_(){if(Yi===0)if((ke&536870912)===0||Le){var t=ts;ts<<=1,(ts&3932160)===0&&(ts=262144),Yi=t}else Yi=536870912;return t=Qn.current,t!==null&&(t.flags|=32),Yi}function vo(t,n){if(n!=null){var a=t.stateNode,r=a.ref;r===null&&(r=a.ref=sv(is(t.memoizedProps,a))),go===null&&(go=[]),go.push(n.bind(null,r))}}function Oi(t,n,a){(t===dn&&(rn===2||rn===9)||t.cancelPendingCommit!==null)&&(xo(t,0),Ys(t,ke,Yi,!1)),Ai(t,a),((en&2)===0||t!==dn)&&(t===dn&&((en&2)===0&&(Lr|=a),Rn===4&&Ys(t,ke,Yi,!1)),Xa(t))}function A_(t,n,a){if((en&6)!==0)throw Error(s(327));var r=!a&&(n&127)===0&&(n&t.expiredLanes)===0||Ie(t,n),c=r?mM(t,n):ad(t,n,!0),u=r;do{if(c===0){ho&&!r&&Ys(t,n,0,!1);break}else{if(a=t.current.alternate,u&&!dM(a)){c=ad(t,n,!1),u=!1;continue}if(c===2){if(u=n,t.errorRecoveryDisabledLanes&u)var _=0;else _=t.pendingLanes&-536870913,_=_!==0?_:_&536870912?536870912:0;if(_!==0){n=_;t:{var w=t;c=Rl;var z=w.current.memoizedState.isDehydrated;if(z&&(xo(w,_).flags|=256),_=ad(w,_,!1),_!==2&&_!==6){if($h&&!z){w.errorRecoveryDisabledLanes|=u,Lr|=u,c=4;break t}u=Li,Li=c,u!==null&&(Li===null?Li=u:Li.push.apply(Li,u))}c=_}if(u=!1,c!==2)continue}}if(c===1){xo(t,0),Ys(t,n,0,!0);break}t:{switch(r=t,u=c,u){case 0:case 1:throw Error(s(345));case 4:if((n&4194048)!==n&&(n&62914560)!==n)break;case 6:Ys(r,n,Yi,!ks);break t;case 2:Li=null;break;case 3:case 5:break;default:throw Error(s(329))}if((n&62914560)===n&&(c=ou+300-qt(),10<c)){if(Ys(r,n,Yi,!ks),Bi(r,0,!0)!==0)break t;ka=n,r.timeoutHandle=Ed(R_.bind(null,r,a,Li,cu,td,n,Yi,Lr,po,ks,u,"Throttled",-0,0),c);break t}R_(r,a,Li,cu,td,n,Yi,Lr,po,ks,u,null,-0,0)}}break}while(!0);Xa(t)}function R_(t,n,a,r,c,u,_,w,z,et,ht,Tt,Q,ct){t.timeoutHandle=-1;var Xt=n.subtreeFlags,re=(u&335544064)===u;if(Tt=null,(re||Xt&8192||(Xt&16785408)===16785408)&&(Tt={stylesheets:null,count:0,imgCount:0,imgBytes:0,suspenseyImages:[],waitingForImages:!0,waitingForViewTransition:!1,unsuspend:ia},Xi=null,x_(n,u,Tt),re&&(Xt=Tt,re=t.containerInfo,re=(re.nodeType===9?re:re.ownerDocument).__reactViewTransition,re!=null&&(Xt.count++,Xt.waitingForViewTransition=!0,Xt=Il.bind(Xt),re.finished.then(Xt,Xt))),Xt=(u&62914560)===u?ou-qt():(u&4194048)===u?E_-qt():0,Xt=_E(Tt,Xt),Xt!==null)){ka=u,t.cancelPendingCommit=Xt(P_.bind(null,t,n,u,a,r,c,_,w,z,et,ht,Tt,null,Q,ct)),Ys(t,u,_,!et);return}P_(t,n,u,a,r,c,_,w,z,et,ht,Tt)}function dM(t){for(var n=t;;){var a=n.tag;if((a===0||a===11||a===15)&&n.flags&16384&&(a=n.updateQueue,a!==null&&(a=a.stores,a!==null)))for(var r=0;r<a.length;r++){var c=a[r],u=c.getSnapshot;c=c.value;try{if(!Vi(u(),c))return!1}catch{return!1}}if(a=n.child,n.subtreeFlags&16384&&a!==null)a.return=n,n=a;else{if(n===t)break;for(;n.sibling===null;){if(n.return===null||n.return===t)return!0;n=n.return}n.sibling.return=n.return,n=n.sibling}}return!0}function Ys(t,n,a,r){n=ea(t,n),n&=~ru,n&=~Lr,t.suspendedLanes|=n,t.pingedLanes&=~n,r&&(t.warmLanes|=n),r=t.expirationTimes;for(var c=n;0<c;){var u=31-_e(c),_=1<<u;r[u]=-1,c&=~_}a!==0&&na(t,a,n)}function fu(){return(en&6)===0?(Cl(0),!1):!0}function id(){if(Fe!==null){if(rn===0)var t=Fe.return;else t=Fe,os=yr=null,fh(t),ao=null,hl=0,t=Fe;for(;t!==null;)Kg(t.alternate,t),t=t.return;Fe=null}}function xo(t,n){var a=t.timeoutHandle;return a!==-1&&(t.timeoutHandle=-1,zM(a)),a=t.cancelPendingCommit,a!==null&&(t.cancelPendingCommit=null,a()),ka=0,id(),dn=t,Fe=a=ss(t.current,null),ke=n,rn=0,Wi=null,ks=!1,ho=Ie(t,n),$h=!1,po=Yi=ru=Lr=Xs=Rn=0,Li=Rl=null,td=!1,ds=ea(t,n),xc(),a}function w_(t,n){Re=null,Mt.H=Xc,n===io||n===Nc?(n=P0(),rn=3):n===Jf?(n=P0(),rn=4):rn=n===Ah?8:n!==null&&typeof n=="object"&&typeof n.then=="function"?6:1,Wi=n,Fe===null&&(Rn=1,Wc(t,sa(n,t.current)))}function C_(){var t=Qn.current;return t===null?!0:(ke&4194048)===ke?ci===null:(ke&62914560)===ke||(ke&536870912)!==0?t===ci:!1}function N_(){var t=Mt.H;return Mt.H=Xc,t===null?Xc:t}function D_(){var t=Mt.A;return Mt.A=fM,t}function hu(){Rn=4,ks||(ke&4194048)!==ke&&Qn.current!==null||(ho=!0),(Xs&134217727)===0&&(Lr&134217727)===0||dn===null||Ys(dn,ke,Yi,!1)}function ad(t,n,a){var r=en;en|=2;var c=N_(),u=D_();(dn!==t||ke!==n)&&(cu=null,xo(t,n)),n=!1;var _=Rn;t:do try{if(rn!==0&&Fe!==null){var w=Fe,z=Wi;switch(rn){case 8:id(),_=6;break t;case 3:case 2:case 9:case 6:Qn.current===null&&(n=!0);var et=rn;if(rn=0,Wi=null,So(t,w,z,et),a&&ho){_=0;break t}break;default:et=rn,rn=0,Wi=null,So(t,w,z,et)}}pM(),_=Rn;break}catch(ht){w_(t,ht)}while(!0);return n&&t.shellSuspendCounter++,os=yr=null,en=r,Mt.H=c,Mt.A=u,Fe===null&&(dn=null,ke=0,xc()),_}function pM(){for(;Fe!==null;)U_(Fe)}function mM(t,n){var a=en;en|=2;var r=N_(),c=D_();dn!==t||ke!==n?(cu=null,lu=qt()+500,xo(t,n)):ho=Ie(t,n);t:do try{if(rn!==0&&Fe!==null){n=Fe;var u=Wi;e:switch(rn){case 1:rn=0,Wi=null,So(t,n,u,1);break;case 2:case 9:if(L0(u)){rn=0,Wi=null,L_(n);break}n=function(){rn!==2&&rn!==9||dn!==t||(rn=7),Xa(t)},u.then(n,n);break t;case 3:rn=7;break t;case 4:rn=5;break t;case 7:L0(u)?(rn=0,Wi=null,L_(n)):(rn=0,Wi=null,So(t,n,u,7));break;case 5:var _=null;switch(Fe.tag){case 26:_=Fe.memoizedState;case 5:case 27:var w=Fe;if(_?bv(_):w.stateNode.complete){rn=0,Wi=null;var z=w.sibling;if(z!==null)Fe=z;else{var et=w.return;et!==null?(Fe=et,du(et)):Fe=null}break e}}rn=0,Wi=null,So(t,n,u,5);break;case 6:rn=0,Wi=null,So(t,n,u,6);break;case 8:id(),Rn=6;break t;default:throw Error(s(462))}}gM();break}catch(ht){w_(t,ht)}while(!0);return os=yr=null,Mt.H=r,Mt.A=c,en=a,Fe!==null?0:(dn=null,ke=0,xc(),Rn)}function gM(){for(;Fe!==null&&!Dt();)U_(Fe)}function U_(t){var n=jg(t.alternate,t,ds);t.memoizedProps=t.pendingProps,n===null?du(t):Fe=n}function L_(t){var n=t,a=n.alternate;switch(n.tag){case 15:case 0:n=Gg(a,n,n.pendingProps,n.type,void 0,ke);break;case 11:n=Gg(a,n,n.pendingProps,n.type.render,n.ref,ke);break;case 5:fh(n);var r=n;r===kn&&(Le?(Tc(r),r.tag===5&&r.stateNode!=null&&(mn=r.stateNode)):(Tc(r),Le=!0));default:Kg(a,n),n=Fe=M0(n,ds),n=jg(a,n,ds)}t.memoizedProps=t.pendingProps,n===null?du(t):Fe=n}function So(t,n,a,r){os=yr=null,fh(n),ao=null,hl=0;var c=n.return;try{if(iM(t,c,n,a,ke)){Rn=1,Wc(t,sa(a,t.current)),Fe=null;return}}catch(u){if(c!==null)throw Fe=c,u;Rn=1,Wc(t,sa(a,t.current)),Fe=null;return}n.flags&32768?(Le||r===1?t=!0:ho||(ke&536870912)!==0?t=!1:(ks=t=!0,(r===2||r===9||r===3||r===6)&&(r=Qn.current,r!==null&&r.tag===13&&(r.flags|=16384))),O_(n,t)):du(n)}function du(t){var n=t;do{if((n.flags&32768)!==0){O_(n,ks);return}t=n.return;var a=oM(n.alternate,n,ds);if(a!==null){Fe=a;return}if(n=n.sibling,n!==null){Fe=n;return}Fe=n=t}while(n!==null);Rn===0&&(Rn=5)}function O_(t,n){do{var a=lM(t.alternate,t);if(a!==null){a.flags&=32767,Fe=a;return}if(a=t.return,a!==null&&(a.flags|=32768,a.subtreeFlags=0,a.deletions=null),!n&&(t=t.sibling,t!==null)){Fe=t;return}Fe=t=a}while(t!==null);Rn=6,Fe=null}function P_(t,n,a,r,c,u,_,w,z,et,ht,Tt){t.cancelPendingCommit=null;do pu();while(En!==0);if((en&6)!==0)throw Error(s(327));if(n!==null){if(n===t.current)throw Error(s(177));t===dn&&(Fe=dn=null,ke=0),Or=n,Ea=t,ka=a,nd=c,b_=r,_M(t,n,a,_,w,z,Tt)}}function _M(t,n,a,r,c,u,_){var w=n.lanes|n.childLanes;if(ed=w,w|=Ff,fr(t,a,w,r,c,u),go=null,(a&335544064)===a?(_o=Wy(t),r=10262):(_o=null,r=10256),(n.subtreeFlags&r)!==0||(n.flags&r)!==0?(t.callbackNode=null,t.callbackPriority=0,EM(Pt,function(){return ld(),null})):(t.callbackNode=null,t.callbackPriority=0),$c=!1,r=(n.flags&13878)!==0,(n.subtreeFlags&13878)!==0||r){r=Mt.T,Mt.T=null,c=Ot.p,Ot.p=2,u=en,en|=4;try{cM(t,n,a)}finally{en=u,Ot.p=c,Mt.T=r}}En=1,$c?mo=kM(_,t.containerInfo,_o,sd,rd,xM,od,ld,vM):(sd(),rd(),od())}function vM(t){if(En!==0){var n=Ea.onRecoverableError;n(t,{componentStack:null})}}function xM(){En===3&&(En=0,__(Or,Ea),En=4)}function sd(){if(En===1){En=0;var t=Ea,n=Or,a=ka,r=(n.flags&13878)!==0;if((n.subtreeFlags&13878)!==0||r){r=Mt.T,Mt.T=null;var c=Ot.p;Ot.p=2;var u=en;en|=4;try{bl=nu=!1,m_(n,t,a),a=Sd;var _=h0(t.containerInfo),w=a.focusedElem,z=a.selectionRange;if(_!==w&&w&&w.ownerDocument&&f0(w.ownerDocument.documentElement,w)){if(z!==null&&Of(w)){var et=z.start,ht=z.end;if(ht===void 0&&(ht=et),"selectionStart"in w)w.selectionStart=et,w.selectionEnd=Math.min(ht,w.value.length);else{var Tt=w.ownerDocument||document,Q=Tt&&Tt.defaultView||window;if(Q.getSelection){var ct=Q.getSelection(),Xt=w.textContent.length,re=Math.min(z.start,Xt),we=z.end===void 0?re:Math.min(z.end,Xt);!ct.extend&&re>we&&(_=we,we=re,re=_);var tt=u0(w,re),G=u0(w,we);if(tt&&G&&(ct.rangeCount!==1||ct.anchorNode!==tt.node||ct.anchorOffset!==tt.offset||ct.focusNode!==G.node||ct.focusOffset!==G.offset)){var at=Tt.createRange();at.setStart(tt.node,tt.offset),ct.removeAllRanges(),re>we?(ct.addRange(at),ct.extend(G.node,G.offset)):(at.setEnd(G.node,G.offset),ct.addRange(at))}}}}for(Tt=[],ct=w;ct=ct.parentNode;)ct.nodeType===1&&Tt.push({element:ct,left:ct.scrollLeft,top:ct.scrollTop});for(typeof w.focus=="function"&&w.focus(),w=0;w<Tt.length;w++){var bt=Tt[w];bt.element.scrollLeft=bt.left,bt.element.scrollTop=bt.top}}wo=!!xd,Sd=xd=null}finally{en=u,Ot.p=c,Mt.T=r}}t.current=n,En=2}}function rd(){if(En===2){En=0;var t=Ea,n=Or,a=(n.flags&8772)!==0;if((n.subtreeFlags&8772)!==0||a){a=Mt.T,Mt.T=null;var r=Ot.p;Ot.p=2;var c=en;en|=4;try{c_(t,n.alternate,n)}finally{en=c,Ot.p=r,Mt.T=a}}En=3}}function od(){if(En===4||En===3){En=0;var t=mo;mo=null,zt();var n=Ea,a=Or,r=ka,c=b_,u=(r&335544064)===r?10262:10256;if((a.subtreeFlags&u)!==0||(a.flags&u)!==0?En=5:(En=0,Or=Ea=null,I_(n,n.pendingLanes)),u=n.pendingLanes,u===0&&(Ws=null),Ua(r),a=a.stateNode,Ht&&typeof Ht.onCommitFiberRoot=="function")try{Ht.onCommitFiberRoot(se,a,void 0,(a.current.flags&128)===128)}catch{}if(c!==null){a=Mt.T,u=Ot.p,Ot.p=2,Mt.T=null;try{for(var _=n.onRecoverableError,w=0;w<c.length;w++){var z=c[w];_(z.value,{componentStack:z.stack})}}finally{Mt.T=a,Ot.p=u}}if(c=go,_=_o,_o=null,c!==null&&(go=null,_===null&&(_=[]),t!==null))for(z=0;z<c.length;z++)a=(0,c[z])(_),a!==void 0&&t.finished.finally(a);(ka&3)!==0&&pu(),Xa(n),u=n.pendingLanes,(r&261930)!==0&&(u&42)!==0?n===uu?wl++:(wl=0,uu=n):(wl=0,uu=null),Cl(0)}}function I_(t,n){(t.pooledCacheLanes&=n)===0&&(n=t.pooledCache,n!=null&&(t.pooledCache=null,cl(n)))}function pu(){return mo!==null&&(mo.skipTransition(),mo=null),sd(),rd(),od(),ld()}function ld(){if(En!==5)return!1;var t=Ea,n=ed;ed=0;var a=Ua(ka),r=Mt.T,c=Ot.p;try{Ot.p=32>a?32:a,Mt.T=null,a=nd,nd=null;var u=Ea,_=ka;if(En=0,Or=Ea=null,ka=0,(en&6)!==0)throw Error(s(331));var w=en;if(en|=4,y_(u.current),v_(u,u.current,_,a),en=w,Cl(0,!1),Ht&&typeof Ht.onPostCommitFiberRoot=="function")try{Ht.onPostCommitFiberRoot(se,u)}catch{}return!0}finally{Ot.p=c,Mt.T=r,I_(t,n)}}function z_(t,n,a){n=sa(a,n),n=Th(t.stateNode,n,2),t=zs(t,n,2),t!==null&&(Ai(t,2),Xa(t))}function on(t,n,a){if(t.tag===3)z_(t,t,a);else for(;n!==null;){if(n.tag===3){z_(n,t,a);break}else if(n.tag===1){var r=n.stateNode;if(typeof n.type.getDerivedStateFromError=="function"||typeof r.componentDidCatch=="function"&&(Ws===null||!Ws.has(r))){t=sa(a,t),a=Lg(2),r=zs(n,a,2),r!==null&&(Og(a,r,n,t),Ai(r,2),Xa(r));break}}n=n.return}}function cd(t,n,a){var r=t.pingCache;if(r===null){r=t.pingCache=new hM;var c=new Set;r.set(n,c)}else c=r.get(n),c===void 0&&(c=new Set,r.set(n,c));c.has(a)||($h=!0,c.add(a),t=SM.bind(null,t,n,a),n.then(t,t))}function SM(t,n,a){var r=t.pingCache;r!==null&&r.delete(n),t.pingedLanes|=t.suspendedLanes&a,t.warmLanes&=~a,dn===t&&(ke&a)===a&&((Rn===4||Rn===3&&(ke&62914560)===ke&&300>qt()-ou)&&(en&2)===0?xo(t,0):ru|=a,po===ke&&(po=0)),Xa(t)}function B_(t,n){n===0&&(n=es()),t=vr(t,n),t!==null&&(Ai(t,n),Xa(t))}function yM(t){var n=t.memoizedState,a=0;n!==null&&(a=n.retryLane),B_(t,a)}function MM(t,n){var a=0;switch(t.tag){case 31:case 13:var r=t.stateNode,c=t.memoizedState;c!==null&&(a=c.retryLane);break;case 19:r=t.stateNode;break;case 22:r=t.stateNode._retryCache;break;default:throw Error(s(314))}r!==null&&r.delete(n),B_(t,a)}function EM(t,n){return Ut(t,n)}var yo=null,Mo=null,ud=!1,mu=!1,fd=!1,qs=0;function Xa(t){t!==Mo&&t.next===null&&(Mo===null?yo=Mo=t:Mo=Mo.next=t),mu=!0,ud||(ud=!0,TM())}function Cl(t,n){if(!fd&&mu){fd=!0;do for(var a=!1,r=yo;r!==null;){if(t!==0){var c=r.pendingLanes;if(c===0)var u=0;else{var _=r.suspendedLanes,w=r.pingedLanes;u=(1<<31-_e(42|t)+1)-1,u&=c&~(_&~w),u=u&201326741?u&201326741|1:u?u|2:0}u!==0&&(a=!0,V_(r,u))}else u=ke,u=Bi(r,r===dn?u:0,r.cancelPendingCommit!==null||r.timeoutHandle!==-1),(u&3)===0||Ie(r,u)||(a=!0,V_(r,u));r=r.next}while(a);fd=!1}}function bM(){F_()}function F_(){mu=ud=!1;var t=0;qs!==0&&IM()&&(t=qs);for(var n=qt(),a=null,r=yo;r!==null;){var c=r.next,u=H_(r,n);u===0?(r.next=null,a===null?yo=c:a.next=c,c===null&&(Mo=a)):(a=r,(t!==0||(u&3)!==0)&&(mu=!0)),r=c}En!==0&&En!==5||Cl(t),qs!==0&&(qs=0)}function H_(t,n){for(var a=t.suspendedLanes,r=t.pingedLanes,c=t.expirationTimes,u=t.pendingLanes&-62914561;0<u;){var _=31-_e(u),w=1<<_,z=c[_];z===-1?((w&a)===0||(w&r)!==0)&&(c[_]=ur(w,n)):z<=n&&(t.expiredLanes|=w),u&=~w}if(n=dn,a=ke,a=Bi(t,t===n?a:0,t.cancelPendingCommit!==null||t.timeoutHandle!==-1),r=t.callbackNode,a===0||t===n&&(rn===2||rn===9)||t.cancelPendingCommit!==null)return r!==null&&r!==null&&Gt(r),t.callbackNode=null,t.callbackPriority=0;if((a&3)===0||Ie(t,a)){if(n=a&-a,n===t.callbackPriority)return n;switch(r!==null&&Gt(r),Ua(a)){case 2:case 8:a=W;break;case 32:a=Pt;break;case 268435456:a=Bt;break;default:a=Pt}return r=G_.bind(null,t),a=Ut(a,r),t.callbackPriority=n,t.callbackNode=a,n}return r!==null&&r!==null&&Gt(r),t.callbackPriority=2,t.callbackNode=null,2}function G_(t,n){if(En!==0&&En!==5)return t.callbackNode=null,t.callbackPriority=0,null;var a=t.callbackNode;if(pu()&&t.callbackNode!==a)return null;var r=ke;return r=Bi(t,t===dn?r:0,t.cancelPendingCommit!==null||t.timeoutHandle!==-1),r===0?null:(A_(t,r,n),H_(t,qt()),t.callbackNode!=null&&t.callbackNode===a?G_.bind(null,t):null)}function V_(t,n){if(pu())return null;A_(t,n,!0)}function TM(){BM(function(){(en&6)!==0?Ut(me,bM):F_()})}function hd(){if(qs===0){var t=br;t===0&&(t=Na,Na<<=1,(Na&261888)===0&&(Na=256)),qs=t}return qs}function k_(t){return t==null||typeof t=="symbol"||typeof t=="boolean"?null:typeof t=="function"?t:Gi(t)}function AM(t,n,a,r,c){if(n==="submit"&&a&&a.stateNode===c){var u=k_((c[H]||null).action),_=r.submitter;_&&(n=(n=_[H]||null)?k_(n.formAction):_.getAttribute("formAction"),n!==null&&(u=n,_=null));var w=new mc("action","action",null,r,c);t.push({event:w,listeners:[{instance:null,listener:function(){if(r.defaultPrevented){if(qs!==0){var z=new FormData(c,_);Sh(a,{pending:!0,data:z,method:c.method,action:u},null,z)}}else typeof u=="function"&&(w.preventDefault(),z=new FormData(c,_),Sh(a,{pending:!0,data:z,method:c.method,action:u},u,z))},currentTarget:c}]})}}for(var dd=0;dd<Bf.length;dd++){var pd=Bf[dd],RM=pd.toLowerCase(),wM=pd[0].toUpperCase()+pd.slice(1);xa(RM,"on"+wM)}xa(m0,"onAnimationEnd"),xa(g0,"onAnimationIteration"),xa(_0,"onAnimationStart"),xa("dblclick","onDoubleClick"),xa("focusin","onFocus"),xa("focusout","onBlur"),xa(zy,"onTransitionRun"),xa(By,"onTransitionStart"),xa(Fy,"onTransitionCancel"),xa(v0,"onTransitionEnd"),_n("onMouseEnter",["mouseout","mouseover"]),_n("onMouseLeave",["mouseout","mouseover"]),_n("onPointerEnter",["pointerout","pointerover"]),_n("onPointerLeave",["pointerout","pointerover"]),Zt("onChange","change click focusin focusout input keydown keyup selectionchange".split(" ")),Zt("onSelect","focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange".split(" ")),Zt("onBeforeInput",["compositionend","keypress","textInput","paste"]),Zt("onCompositionEnd","compositionend focusout keydown keypress keyup mousedown".split(" ")),Zt("onCompositionStart","compositionstart focusout keydown keypress keyup mousedown".split(" ")),Zt("onCompositionUpdate","compositionupdate focusout keydown keypress keyup mousedown".split(" "));var Nl="abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting".split(" "),CM=new Set("beforetoggle cancel close invalid load scroll scrollend toggle".split(" ").concat(Nl));function X_(t,n){n=(n&4)!==0;for(var a=0;a<t.length;a++){var r=t[a],c=r.event;r=r.listeners;t:{var u=void 0;if(n)for(var _=r.length-1;0<=_;_--){var w=r[_],z=w.instance,et=w.currentTarget;if(w=w.listener,z!==u&&c.isPropagationStopped())break t;u=w,c.currentTarget=et;try{u(c)}catch(ht){vc(ht)}c.currentTarget=null,u=z}else for(_=0;_<r.length;_++){if(w=r[_],z=w.instance,et=w.currentTarget,w=w.listener,z!==u&&c.isPropagationStopped())break t;u=w,c.currentTarget=et;try{u(c)}catch(ht){vc(ht)}c.currentTarget=null,u=z}}}}function He(t,n){var a=n[st];a===void 0&&(a=n[st]=new Set);var r=t+"__bubble";a.has(r)||(W_(n,t,2,!1),a.add(r))}function md(t,n,a){var r=0;n&&(r|=4),W_(a,t,r,n)}var gu="_reactListening"+Math.random().toString(36).slice(2);function gd(t){if(!t[gu]){t[gu]=!0,Ye.forEach(function(a){a!=="selectionchange"&&(CM.has(a)||md(a,!1,t),md(a,!0,t))});var n=t.nodeType===9?t:t.ownerDocument;n===null||n[gu]||(n[gu]=!0,md("selectionchange",!1,n))}}function W_(t,n,a,r){switch(Ov(n)){case 2:var c=yE;break;case 8:c=ME;break;default:c=Id}a=c.bind(null,n,a,t),c=void 0,!bf||n!=="touchstart"&&n!=="touchmove"&&n!=="wheel"||(c=!0),r?c!==void 0?t.addEventListener(n,a,{capture:!0,passive:c}):t.addEventListener(n,a,!0):c!==void 0?t.addEventListener(n,a,{passive:c}):t.addEventListener(n,a,!1)}function _d(t,n,a,r,c){var u=r;if((n&1)===0&&(n&2)===0&&r!==null)t:for(;;){if(r===null)return;var _=r.tag;if(_===3||_===4){var w=r.stateNode.containerInfo;if(w===c)break;if(_===4)for(_=r.return;_!==null;){var z=_.tag;if((z===3||z===4)&&_.stateNode.containerInfo===c)return;_=_.return}for(;w!==null;){if(_=de(w),_===null)return;if(z=_.tag,z===5||z===6||z===26||z===27){r=u=_;continue t}w=w.parentNode}}r=r.return}_i(function(){var et=u,ht=pr(a),Tt=[];t:{var Q=x0.get(t);if(Q!==void 0){var ct=mc,Xt=t;switch(t){case"keypress":if(dc(a)===0)break t;case"keydown":case"keyup":ct=dy;break;case"focusin":Xt="focus",ct=wf;break;case"focusout":Xt="blur",ct=wf;break;case"beforeblur":case"afterblur":ct=wf;break;case"click":if(a.button===2)break t;case"auxclick":case"dblclick":case"mousedown":case"mousemove":case"mouseup":case"mouseout":case"mouseover":case"contextmenu":ct=jm;break;case"drag":case"dragend":case"dragenter":case"dragexit":case"dragleave":case"dragover":case"dragstart":case"drop":ct=ey;break;case"touchcancel":case"touchend":case"touchmove":case"touchstart":ct=vy;break;case m0:case g0:case _0:ct=ay;break;case v0:ct=Sy;break;case"scroll":case"scrollend":ct=$S;break;case"wheel":ct=My;break;case"copy":case"cut":case"paste":ct=ry;break;case"gotpointercapture":case"lostpointercapture":case"pointercancel":case"pointerdown":case"pointermove":case"pointerout":case"pointerover":case"pointerup":ct=Km;break;case"submit":ct=gy;break;case"toggle":case"beforetoggle":ct=by}var re=(n&4)!==0,we=!re&&(t==="scroll"||t==="scrollend"),tt=re?Q!==null?Q+"Capture":null:Q;re=[];for(var G=et,at;G!==null;){var bt=G;if(at=bt.stateNode,bt=bt.tag,bt!==5&&bt!==26&&bt!==27||at===null||tt===null||(bt=mr(G,tt),bt!=null&&re.push(Dl(G,bt,at))),we)break;G=G.return}0<re.length&&(Q=new ct(Q,Xt,null,a,ht),Tt.push({event:Q,listeners:re}))}}if((n&7)===0){t:{if(ct=t==="mouseover"||t==="pointerover",Q=t==="mouseout"||t==="pointerout",ct&&a!==dr&&(Xt=a.relatedTarget||a.fromElement)&&(de(Xt)||Xt[ft]))break t;(Q||ct)&&(Xt=ht.window===ht?ht:(ct=ht.ownerDocument)?ct.defaultView||ct.parentWindow:window,Q?(ct=a.relatedTarget||a.toElement,Q=et,ct=ct?de(ct):null,ct!==null&&(we=f(ct),re=ct.tag,ct!==we||re!==5&&re!==27&&re!==6)&&(ct=null)):(Q=null,ct=et),Q!==ct&&(re=jm,bt="onMouseLeave",tt="onMouseEnter",G="mouse",(t==="pointerout"||t==="pointerover")&&(re=Km,bt="onPointerLeave",tt="onPointerEnter",G="pointer"),we=Q==null?Xt:Qt(Q),at=ct==null?Xt:Qt(ct),Xt=new re(bt,G+"leave",Q,a,ht),Xt.target=we,Xt.relatedTarget=at,bt=null,de(ht)===et&&(re=new re(tt,G+"enter",ct,a,ht),re.target=at,re.relatedTarget=we,bt=re),we=bt,re=Q&&ct?U(Q,ct,NM):null,Q!==null&&Y_(Tt,Xt,Q,re,!1),ct!==null&&we!==null&&Y_(Tt,we,ct,re,!0)))}t:{if(Q=et?Qt(et):window,ct=Q.nodeName&&Q.nodeName.toLowerCase(),ct==="select"||ct==="input"&&Q.type==="file")var ne=a0;else if(n0(Q))if(s0)ne=Oy;else{ne=Uy;var Xe=Dy}else ct=Q.nodeName,!ct||ct.toLowerCase()!=="input"||Q.type!=="checkbox"&&Q.type!=="radio"?et&&Oa(et.elementType)&&(ne=a0):ne=Ly;if(ne&&(ne=ne(t,et))){i0(Tt,ne,a,ht);break t}Xe&&Xe(t,Q,et)}switch(Xe=et?Qt(et):window,t){case"focusin":(n0(Xe)||Xe.contentEditable==="true")&&(Zr=Xe,Pf=et,rl=null);break;case"focusout":rl=Pf=Zr=null;break;case"mousedown":If=!0;break;case"contextmenu":case"mouseup":case"dragend":If=!1,d0(Tt,a,ht);break;case"selectionchange":if(Iy)break;case"keydown":case"keyup":d0(Tt,a,ht)}var ue;if(Nf)t:{switch(t){case"compositionstart":var pe="onCompositionStart";break t;case"compositionend":pe="onCompositionEnd";break t;case"compositionupdate":pe="onCompositionUpdate";break t}pe=void 0}else jr?t0(t,a)&&(pe="onCompositionEnd"):t==="keydown"&&a.keyCode===229&&(pe="onCompositionStart");pe&&(Qm&&a.locale!=="ko"&&(jr||pe!=="onCompositionStart"?pe==="onCompositionEnd"&&jr&&(ue=Ym()):(ws=ht,Tf="value"in ws?ws.value:ws.textContent,jr=!0)),Xe=_u(et,pe),0<Xe.length&&(pe=new Zm(pe,t,null,a,ht),Tt.push({event:pe,listeners:Xe}),ue?pe.data=ue:(ue=e0(a),ue!==null&&(pe.data=ue)))),(ue=Ay?Ry(t,a):wy(t,a))&&(pe=_u(et,"onBeforeInput"),0<pe.length&&(Xe=new Zm("onBeforeInput","beforeinput",null,a,ht),Tt.push({event:Xe,listeners:pe}),Xe.data=ue)),AM(Tt,t,et,a,ht)}X_(Tt,n)})}function Dl(t,n,a){return{instance:t,listener:n,currentTarget:a}}function _u(t,n){for(var a=n+"Capture",r=[];t!==null;){var c=t,u=c.stateNode;if(c=c.tag,c!==5&&c!==26&&c!==27||u===null||(c=mr(t,a),c!=null&&r.unshift(Dl(t,c,u)),c=mr(t,n),c!=null&&r.push(Dl(t,c,u))),t.tag===3)return r;t=t.return}return[]}function NM(t){if(t===null)return null;do t=t.return;while(t&&t.tag!==5&&t.tag!==27);return t||null}function Y_(t,n,a,r,c){for(var u=n._reactName,_=[];a!==null&&a!==r;){var w=a,z=w.alternate,et=w.stateNode;if(w=w.tag,z!==null&&z===r)break;w!==5&&w!==26&&w!==27||et===null||(z=et,c?(et=mr(a,u),et!=null&&_.unshift(Dl(a,et,z))):c||(et=mr(a,u),et!=null&&_.push(Dl(a,et,z)))),a=a.return}_.length!==0&&t.push({event:n,listeners:_})}var DM=/\r\n?/g,UM=/\u0000|\uFFFD/g;function q_(t){return(typeof t=="string"?t:""+t).replace(DM,`
`).replace(UM,"")}function j_(t,n){return n=q_(n),q_(t)===n}function ln(t,n,a,r,c,u){switch(a){case"children":if(typeof r=="string")n==="body"||n==="textarea"&&r===""||nn(t,r);else if(typeof r=="number"||typeof r=="bigint")n!=="body"&&nn(t,""+r);else return;break;case"className":ri(t,"class",r);break;case"tabIndex":ri(t,"tabindex",r);break;case"dir":case"role":case"viewBox":case"width":case"height":ri(t,a,r);break;case"style":vn(t,r,u);return;case"data":if(n!=="object"){ri(t,"data",r);break}case"src":case"href":if(r===""&&(n!=="a"||a!=="href")){t.removeAttribute(a);break}if(r==null||typeof r=="function"||typeof r=="symbol"||typeof r=="boolean"){t.removeAttribute(a);break}r=Gi(r),t.setAttribute(a,r);break;case"action":case"formAction":if(typeof r=="function"){t.setAttribute(a,"javascript:throw new Error('A React form was unexpectedly submitted. If you called form.submit() manually, consider using form.requestSubmit() instead. If you\\'re trying to use event.stopPropagation() in a submit event handler, consider also calling event.preventDefault().')");break}else typeof u=="function"&&(a==="formAction"?(n!=="input"&&ln(t,n,"name",c.name,c,null),ln(t,n,"formEncType",c.formEncType,c,null),ln(t,n,"formMethod",c.formMethod,c,null),ln(t,n,"formTarget",c.formTarget,c,null)):(ln(t,n,"encType",c.encType,c,null),ln(t,n,"method",c.method,c,null),ln(t,n,"target",c.target,c,null)));if(r==null||typeof r=="symbol"||typeof r=="boolean"){t.removeAttribute(a);break}r=Gi(r),t.setAttribute(a,r);break;case"onClick":r!=null&&(t.onclick=ia);return;case"onScroll":r!=null&&He("scroll",t);return;case"onScrollEnd":r!=null&&He("scrollend",t);return;case"dangerouslySetInnerHTML":if(r!=null){if(typeof r!="object"||!("__html"in r))throw Error(s(61));if(a=r.__html,a!=null){if(c.children!=null)throw Error(s(60));u?.__html!==a&&(t.innerHTML=a)}}break;case"multiple":t.multiple=r&&typeof r!="function"&&typeof r!="symbol";break;case"muted":t.muted=r&&typeof r!="function"&&typeof r!="symbol";break;case"suppressContentEditableWarning":case"suppressHydrationWarning":case"defaultValue":case"defaultChecked":case"innerHTML":case"ref":break;case"autoFocus":break;case"xlinkHref":if(r==null||typeof r=="function"||typeof r=="boolean"||typeof r=="symbol"){t.removeAttribute("xlink:href");break}a=Gi(r),t.setAttributeNS("http://www.w3.org/1999/xlink","xlink:href",a);break;case"contentEditable":case"spellCheck":case"draggable":case"value":case"autoReverse":case"externalResourcesRequired":case"focusable":case"preserveAlpha":r!=null&&typeof r!="function"&&typeof r!="symbol"?t.setAttribute(a,r):t.removeAttribute(a);break;case"inert":case"allowFullScreen":case"async":case"autoPlay":case"controls":case"credentialless":case"default":case"defer":case"disabled":case"disablePictureInPicture":case"disableRemotePlayback":case"formNoValidate":case"hidden":case"loop":case"noModule":case"noValidate":case"open":case"playsInline":case"readOnly":case"required":case"reversed":case"scoped":case"seamless":case"itemScope":r&&typeof r!="function"&&typeof r!="symbol"?t.setAttribute(a,""):t.removeAttribute(a);break;case"capture":case"download":r===!0?t.setAttribute(a,""):r!==!1&&r!=null&&typeof r!="function"&&typeof r!="symbol"?t.setAttribute(a,r):t.removeAttribute(a);break;case"cols":case"rows":case"size":case"span":r!=null&&typeof r!="function"&&typeof r!="symbol"&&!isNaN(r)&&1<=r?t.setAttribute(a,r):t.removeAttribute(a);break;case"rowSpan":case"start":r==null||typeof r=="function"||typeof r=="symbol"||isNaN(r)?t.removeAttribute(a):t.setAttribute(a,r);break;case"popover":He("beforetoggle",t),He("toggle",t),sn(t,"popover",r);break;case"xlinkActuate":X(t,"http://www.w3.org/1999/xlink","xlink:actuate",r);break;case"xlinkArcrole":X(t,"http://www.w3.org/1999/xlink","xlink:arcrole",r);break;case"xlinkRole":X(t,"http://www.w3.org/1999/xlink","xlink:role",r);break;case"xlinkShow":X(t,"http://www.w3.org/1999/xlink","xlink:show",r);break;case"xlinkTitle":X(t,"http://www.w3.org/1999/xlink","xlink:title",r);break;case"xlinkType":X(t,"http://www.w3.org/1999/xlink","xlink:type",r);break;case"xmlBase":X(t,"http://www.w3.org/XML/1998/namespace","xml:base",r);break;case"xmlLang":X(t,"http://www.w3.org/XML/1998/namespace","xml:lang",r);break;case"xmlSpace":X(t,"http://www.w3.org/XML/1998/namespace","xml:space",r);break;case"is":sn(t,"is",r);break;case"innerText":case"textContent":return;default:if(!(2<a.length)||a[0]!=="o"&&a[0]!=="O"||a[1]!=="n"&&a[1]!=="N")a=wi.get(a)||a,sn(t,a,r);else return}Ce=!0}function vd(t,n,a,r,c,u){switch(a){case"style":vn(t,r,u);return;case"dangerouslySetInnerHTML":if(r!=null){if(typeof r!="object"||!("__html"in r))throw Error(s(61));if(a=r.__html,a!=null){if(c.children!=null)throw Error(s(60));u?.__html!==a&&(t.innerHTML=a)}}break;case"children":if(typeof r=="string")nn(t,r);else if(typeof r=="number"||typeof r=="bigint")nn(t,""+r);else return;break;case"onScroll":r!=null&&He("scroll",t);return;case"onScrollEnd":r!=null&&He("scrollend",t);return;case"onClick":r!=null&&(t.onclick=ia);return;case"suppressContentEditableWarning":case"suppressHydrationWarning":case"innerHTML":case"ref":return;case"innerText":case"textContent":return;default:if(!Tn.hasOwnProperty(a))t:{if(a[0]==="o"&&a[1]==="n"&&(c=a.endsWith("Capture"),u=a.slice(2,c?a.length-7:void 0),n=t[H]||null,n=n!=null?n[a]:null,typeof n=="function"&&t.removeEventListener(u,n,c),typeof r=="function")){typeof n!="function"&&n!==null&&(a in t?t[a]=null:t.hasAttribute(a)&&t.removeAttribute(a)),t.addEventListener(u,r,c);break t}Ce=!0,a in t?t[a]=r:r===!0?t.setAttribute(a,""):sn(t,a,r)}return}Ce=!0}function ti(t,n,a){switch(n){case"div":case"span":case"svg":case"path":case"a":case"g":case"p":case"li":break;case"img":He("error",t),He("load",t);var r=!1,c=!1,u;for(u in a)if(a.hasOwnProperty(u)){var _=a[u];if(_!=null)switch(u){case"src":r=!0;break;case"srcSet":c=!0;break;case"children":case"dangerouslySetInnerHTML":throw Error(s(137,n));default:ln(t,n,u,_,a,null)}}c&&ln(t,n,"srcSet",a.srcSet,a,null),r&&ln(t,n,"src",a.src,a,null);return;case"input":He("invalid",t);var w=u=_=c=null,z=null,et=null;for(r in a)if(a.hasOwnProperty(r)){var ht=a[r];if(ht!=null)switch(r){case"name":c=ht;break;case"type":_=ht;break;case"checked":z=ht;break;case"defaultChecked":et=ht;break;case"value":u=ht;break;case"defaultValue":w=ht;break;case"children":case"dangerouslySetInnerHTML":if(ht!=null)throw Error(s(137,n));break;default:ln(t,n,r,ht,a,null)}}mi(t,u,w,z,et,_,c,!1);return;case"select":He("invalid",t),r=_=u=null;for(c in a)if(a.hasOwnProperty(c)&&(w=a[c],w!=null))switch(c){case"value":u=w;break;case"defaultValue":_=w;break;case"multiple":r=w;default:ln(t,n,c,w,a,null)}n=u,a=_,t.multiple=!!r,n!=null?Fi(t,!!r,n,!1):a!=null&&Fi(t,!!r,a,!0);return;case"textarea":He("invalid",t),u=c=r=null;for(_ in a)if(a.hasOwnProperty(_)&&(w=a[_],w!=null))switch(_){case"value":r=w;break;case"defaultValue":c=w;break;case"children":u=w;break;case"dangerouslySetInnerHTML":if(w!=null)throw Error(s(91));break;default:ln(t,n,_,w,a,null)}tn(t,r,c,u);return;case"option":for(z in a)a.hasOwnProperty(z)&&(r=a[z],r!=null)&&(z==="selected"?t.selected=r&&typeof r!="function"&&typeof r!="symbol":ln(t,n,z,r,a,null));return;case"dialog":He("beforetoggle",t),He("toggle",t),He("cancel",t),He("close",t);break;case"iframe":case"object":He("load",t);break;case"video":case"audio":for(r=0;r<Nl.length;r++)He(Nl[r],t);break;case"image":He("error",t),He("load",t);break;case"details":He("toggle",t);break;case"embed":case"source":case"link":He("error",t),He("load",t);case"area":case"base":case"br":case"col":case"hr":case"keygen":case"meta":case"param":case"track":case"wbr":case"menuitem":for(et in a)if(a.hasOwnProperty(et)&&(r=a[et],r!=null))switch(et){case"children":case"dangerouslySetInnerHTML":throw Error(s(137,n));default:ln(t,n,et,r,a,null)}return;default:if(Oa(n)){for(ht in a)a.hasOwnProperty(ht)&&(r=a[ht],r!==void 0&&vd(t,n,ht,r,a,void 0));return}}for(w in a)a.hasOwnProperty(w)&&(r=a[w],r!=null&&ln(t,n,w,r,a,null))}var LM={};function OM(t,n,a,r){switch(n){case"div":case"span":case"svg":case"path":case"a":case"g":case"p":case"li":break;case"input":var c=null,u=null,_=null,w=null,z=null,et=null,ht=null;for(ct in a){var Tt=a[ct];if(a.hasOwnProperty(ct)&&Tt!=null)switch(ct){case"checked":break;case"value":break;case"defaultValue":z=Tt;default:r.hasOwnProperty(ct)||ln(t,n,ct,null,r,Tt)}}for(var Q in r){var ct=r[Q];if(Tt=a[Q],r.hasOwnProperty(Q)&&(ct!=null||Tt!=null))switch(Q){case"type":ct!==Tt&&(Ce=!0),u=ct;break;case"name":ct!==Tt&&(Ce=!0),c=ct;break;case"checked":ct!==Tt&&(Ce=!0),et=ct;break;case"defaultChecked":ct!==Tt&&(Ce=!0),ht=ct;break;case"value":ct!==Tt&&(Ce=!0),_=ct;break;case"defaultValue":ct!==Tt&&(Ce=!0),w=ct;break;case"children":case"dangerouslySetInnerHTML":if(ct!=null)throw Error(s(137,n));break;default:ct!==Tt&&ln(t,n,Q,ct,r,Tt)}}Se(t,_,w,z,et,ht,u,c);return;case"select":ct=_=w=Q=null;for(u in a)if(z=a[u],a.hasOwnProperty(u)&&z!=null)switch(u){case"value":break;case"multiple":ct=z;default:r.hasOwnProperty(u)||ln(t,n,u,null,r,z)}for(c in r)if(u=r[c],z=a[c],r.hasOwnProperty(c)&&(u!=null||z!=null))switch(c){case"value":u!==z&&(Ce=!0),Q=u;break;case"defaultValue":u!==z&&(Ce=!0),w=u;break;case"multiple":u!==z&&(Ce=!0),_=u;default:u!==z&&ln(t,n,c,u,r,z)}n=w,a=_,r=ct,Q!=null?Fi(t,!!a,Q,!1):!!r!=!!a&&(n!=null?Fi(t,!!a,n,!0):Fi(t,!!a,a?[]:"",!1));return;case"textarea":ct=Q=null;for(w in a)if(c=a[w],a.hasOwnProperty(w)&&c!=null&&!r.hasOwnProperty(w))switch(w){case"value":break;case"children":break;default:ln(t,n,w,null,r,c)}for(_ in r)if(c=r[_],u=a[_],r.hasOwnProperty(_)&&(c!=null||u!=null))switch(_){case"value":c!==u&&(Ce=!0),Q=c;break;case"defaultValue":c!==u&&(Ce=!0),ct=c;break;case"children":break;case"dangerouslySetInnerHTML":if(c!=null)throw Error(s(91));break;default:c!==u&&ln(t,n,_,c,r,u)}va(t,Q,ct);return;case"option":for(var Xt in a)Q=a[Xt],a.hasOwnProperty(Xt)&&Q!=null&&!r.hasOwnProperty(Xt)&&(Xt==="selected"?t.selected=!1:ln(t,n,Xt,null,r,Q));for(z in r)Q=r[z],ct=a[z],r.hasOwnProperty(z)&&Q!==ct&&(Q!=null||ct!=null)&&(z==="selected"?(Q!==ct&&(Ce=!0),t.selected=Q&&typeof Q!="function"&&typeof Q!="symbol"):ln(t,n,z,Q,r,ct));return;case"img":case"link":case"area":case"base":case"br":case"col":case"embed":case"hr":case"keygen":case"meta":case"param":case"source":case"track":case"wbr":case"menuitem":for(var re in a)Q=a[re],a.hasOwnProperty(re)&&Q!=null&&!r.hasOwnProperty(re)&&ln(t,n,re,null,r,Q);for(et in r)if(Q=r[et],ct=a[et],r.hasOwnProperty(et)&&Q!==ct&&(Q!=null||ct!=null))switch(et){case"children":case"dangerouslySetInnerHTML":if(Q!=null)throw Error(s(137,n));break;default:ln(t,n,et,Q,r,ct)}return;default:if(Oa(n)){for(var we in a)Q=a[we],a.hasOwnProperty(we)&&Q!==void 0&&!r.hasOwnProperty(we)&&vd(t,n,we,void 0,r,Q);for(ht in r)Q=r[ht],ct=a[ht],!r.hasOwnProperty(ht)||Q===ct||Q===void 0&&ct===void 0||vd(t,n,ht,Q,r,ct);return}}for(var tt in a)Q=a[tt],a.hasOwnProperty(tt)&&Q!=null&&!r.hasOwnProperty(tt)&&ln(t,n,tt,null,r,Q);for(Tt in r)Q=r[Tt],ct=a[Tt],!r.hasOwnProperty(Tt)||Q===ct||Q==null&&ct==null||ln(t,n,Tt,Q,r,ct)}function Z_(t){switch(t){case"css":case"script":case"font":case"img":case"image":case"input":case"link":return!0;default:return!1}}function PM(){if(typeof performance.getEntriesByType=="function"){for(var t=0,n=0,a=performance.getEntriesByType("resource"),r=0;r<a.length;r++){var c=a[r],u=c.transferSize,_=c.initiatorType,w=c.duration;if(u&&w&&Z_(_)){for(_=0,w=c.responseEnd,r+=1;r<a.length;r++){var z=a[r],et=z.startTime;if(et>w)break;var ht=z.transferSize,Tt=z.initiatorType;ht&&Z_(Tt)&&(z=z.responseEnd,_+=ht*(z<w?1:(w-et)/(z-et)))}if(--r,n+=8*(u+_)/(c.duration/1e3),t++,10<t)break}}if(0<t)return n/t/1e6}return navigator.connection&&(t=navigator.connection.downlink,typeof t=="number")?t:5}var xd=null,Sd=null;function Ul(t){return t.nodeType===9?t:t.ownerDocument}function K_(t){switch(t){case"http://www.w3.org/2000/svg":return 1;case"http://www.w3.org/1998/Math/MathML":return 2;default:return 0}}function Q_(t,n){if(t===0)switch(n){case"svg":return 1;case"math":return 2;default:return 0}return t===1&&n==="foreignObject"?0:t}function J_(t,n,a,r){return a=Ul(a).createElement(t),a[A]=r,a[H]=n,ti(a,t,n),be(a),a}function yd(t,n){return t==="textarea"||t==="noscript"||typeof n.children=="string"||typeof n.children=="number"||typeof n.children=="bigint"||typeof n.dangerouslySetInnerHTML=="object"&&n.dangerouslySetInnerHTML!==null&&n.dangerouslySetInnerHTML.__html!=null}var Md=null;function IM(){var t=window.event;return t&&t.type==="popstate"?t===Md?!1:(Md=t,!0):(Md=null,!1)}var Ed=typeof setTimeout=="function"?setTimeout:void 0,zM=typeof clearTimeout=="function"?clearTimeout:void 0,$_=typeof Promise=="function"?Promise:void 0,tv=typeof requestAnimationFrame=="function"?requestAnimationFrame:Ed,BM=typeof queueMicrotask=="function"?queueMicrotask:typeof $_<"u"?function(t){return $_.resolve(null).then(t).catch(FM)}:Ed;function FM(t){setTimeout(function(){throw t})}function js(t){return t==="head"}function ev(t,n){var a=n,r=0;do{var c=a.nextSibling;if(t.removeChild(a),c&&c.nodeType===8)if(a=c.data,a==="/$"||a==="/&"){if(r===0){t.removeChild(c),Co(n);return}r--}else if(a==="$"||a==="$?"||a==="$~"||a==="$!"||a==="&")r++;else if(a==="html")Dd(t.ownerDocument.documentElement);else if(a==="head"){a=t.ownerDocument.head,Dd(a);for(var u=a.firstChild;u;){var _=u.nextSibling,w=u.nodeName;u[It]||w==="SCRIPT"||w==="STYLE"||w==="LINK"&&u.rel.toLowerCase()==="stylesheet"||a.removeChild(u),u=_}}else a==="body"&&Dd(t.ownerDocument.body);a=c}while(a);Co(n)}function nv(t,n){var a=t;t=0;do{var r=a.nextSibling;if(a.nodeType===1?n?(a._stashedDisplay=a.style.display,a.style.display="none"):(a.style.display=a._stashedDisplay||"",a.getAttribute("style")===""&&a.removeAttribute("style")):a.nodeType===3&&(n?(a._stashedText=a.nodeValue,a.nodeValue=""):a.nodeValue=a._stashedText||""),r&&r.nodeType===8)if(a=r.data,a==="/$"){if(t===0)break;t--}else a!=="$"&&a!=="$?"&&a!=="$~"&&a!=="$!"||t++;a=r}while(a)}function iv(t,n,a){if(n=CSS.escape(n)!==n?"r-"+btoa(n).replace(/=/g,""):n,t.style.viewTransitionName=n,a!=null&&(t.style.viewTransitionClass=a),a=getComputedStyle(t),a.display==="inline"){if(n=t.getClientRects(),n.length===1)var r=1;else for(var c=r=0;c<n.length;c++){var u=n[c];0<u.width&&0<u.height&&r++}r===1&&(t=t.style,t.display=n.length===1?"inline-block":"block",t.marginTop="-"+a.paddingTop,t.marginBottom="-"+a.paddingBottom)}}function av(t,n){t=t.style,n=n.style;var a=n!=null?n.hasOwnProperty("viewTransitionName")?n.viewTransitionName:n.hasOwnProperty("view-transition-name")?n["view-transition-name"]:null:null;t.viewTransitionName=a==null||typeof a=="boolean"?"":(""+a).trim(),a=n!=null?n.hasOwnProperty("viewTransitionClass")?n.viewTransitionClass:n.hasOwnProperty("view-transition-class")?n["view-transition-class"]:null:null,t.viewTransitionClass=a==null||typeof a=="boolean"?"":(""+a).trim(),t.display==="inline-block"&&(n==null?t.display=t.margin="":(a=n.display,t.display=a==null||typeof a=="boolean"?"":a,a=n.margin,a!=null?t.margin=a:(a=n.hasOwnProperty("marginTop")?n.marginTop:n["margin-top"],t.marginTop=a==null||typeof a=="boolean"?"":a,n=n.hasOwnProperty("marginBottom")?n.marginBottom:n["margin-bottom"],t.marginBottom=n==null||typeof n=="boolean"?"":n)))}function HM(t,n,a){return a=a.ownerDocument.defaultView,{rect:t,abs:n.position==="absolute"||n.position==="fixed",clip:n.clipPath!=="none"||n.overflow!=="visible"||n.filter!=="none"||n.mask!=="none"||n.mask!=="none"||n.borderRadius!=="0px",view:0<=t.bottom&&0<=t.right&&t.top<=a.innerHeight&&t.left<=a.innerWidth}}function bd(t){var n=t.getBoundingClientRect(),a=getComputedStyle(t);return HM(n,a,t)}function GM(t){return t.documentElement.clientHeight}function VM(t){this.addEventListener("load",t),this.addEventListener("error",t)}function kM(t,n,a,r,c,u,_,w,z){var et=n.nodeType===9?n:n.ownerDocument;try{var ht=et.startViewTransition({update:function(){var Q=et.defaultView,ct=Q.navigation&&Q.navigation.transition,Xt=et.fonts.status;r();var re=[];if(Xt==="loaded"&&(GM(et),et.fonts.status==="loading"&&re.push(et.fonts.ready)),Xt=re.length,t!==null)for(var we=t.suspenseyImages,tt=0,G=0;G<we.length;G++){var at=we[G];if(!at.complete){var bt=at.getBoundingClientRect();if(0<bt.bottom&&0<bt.right&&bt.top<Q.innerHeight&&bt.left<Q.innerWidth){if(tt+=Tv(at),tt>Su){re.length=Xt;break}at=new Promise(VM.bind(at)),re.push(at)}}}if(0<re.length)return Q=Promise.race([Promise.all(re),new Promise(function(ne){return setTimeout(ne,500)})]).then(c,c),(ct?Promise.allSettled([ct.finished,Q]):Q).then(u,u);if(c(),ct)return ct.finished.then(u,u);u()},types:a});et.__reactViewTransition=ht;var Tt=[];return ht.ready.then(function(){for(var Q=et.documentElement.getAnimations({subtree:!0}),ct=0;ct<Q.length;ct++){var Xt=Q[ct],re=Xt.effect,we=re.pseudoElement;if(we!=null&&we.startsWith("::view-transition")){Tt.push(Xt),Xt=re.getKeyframes();for(var tt=we=void 0,G=!0,at=0;at<Xt.length;at++){var bt=Xt[at],ne=bt.width;if(we===void 0)we=ne;else if(we!==ne){G=!1;break}if(ne=bt.height,tt===void 0)tt=ne;else if(tt!==ne){G=!1;break}delete bt.width,delete bt.height,bt.transform==="none"&&delete bt.transform}G&&we!==void 0&&tt!==void 0&&(re.setKeyframes(Xt),G=getComputedStyle(re.target,re.pseudoElement),G.width!==we||G.height!==tt)&&(G=Xt[0],G.width=we,G.height=tt,G=Xt[Xt.length-1],G.width=we,G.height=tt,re.setKeyframes(Xt))}}_()},function(Q){et.__reactViewTransition===ht&&(et.__reactViewTransition=null);try{typeof Q=="object"&&Q!==null&&Q.name==="InvalidStateError"&&(Q.message==="View transition was skipped because document visibility state is hidden."||Q.message==="Skipping view transition because document visibility state has become hidden."||Q.message==="Skipping view transition because viewport size changed."||Q.message==="Transition was aborted because of invalid state")&&(Q=null),Q!==null&&z(Q)}finally{r(),c(),_()}}),ht.finished.finally(function(){for(var Q=0;Q<Tt.length;Q++)Tt[Q].cancel();et.__reactViewTransition===ht&&(et.__reactViewTransition=null),w()}),ht}catch{return r(),c(),_(),null}}function Pr(t,n){this._scope=document.documentElement,this._selector="::view-transition-"+t+"("+n+")"}Pr.prototype.animate=function(t,n){return n=typeof n=="number"?{duration:n}:I({},n),n.pseudoElement=this._selector,this._scope.animate(t,n)},Pr.prototype.getAnimations=function(){for(var t=this._scope,n=this._selector,a=t.getAnimations({subtree:!0}),r=[],c=0;c<a.length;c++){var u=a[c].effect;u!==null&&u.target===t&&u.pseudoElement===n&&r.push(a[c])}return r},Pr.prototype.getComputedStyle=function(){return getComputedStyle(this._scope,this._selector)};function sv(t){return{name:t,group:new Pr("group",t),imagePair:new Pr("image-pair",t),old:new Pr("old",t),new:new Pr("new",t)}}function ji(t){this._fragmentFiber=t,this._observers=this._eventListeners=null}ji.prototype.addEventListener=function(t,n,a){var r=null,c=null;if(!(a!=null&&typeof a!="boolean"&&(r=a.signal||null,r!==null&&r.aborted))){this._eventListeners===null&&(this._eventListeners=[]);var u=this._eventListeners;if(ov(u,t,n,a)===-1){var _=this,w=n;a!=null&&typeof a!="boolean"&&a.once===!0&&(w=function(z){_.removeEventListener(t,n,a),typeof n=="function"?n.call(this,z):n.handleEvent(z)}),r!==null&&(c=_.removeEventListener.bind(_,t,n,a),r.addEventListener("abort",c,{once:!0}),c=r.removeEventListener.bind(r,"abort",c)),r=Eo(a),u.push({type:t,listener:n,optionsOrUseCapture:a,attachedListener:w,cleanup:c}),v(this._fragmentFiber.child,!1,XM,t,w,r)}this._eventListeners=u}};function XM(t,n,a,r){return y(t).addEventListener(n,a,r),!1}ji.prototype.removeEventListener=function(t,n,a){var r=this._eventListeners;if(r!==null&&(n=ov(r,t,n,a),n!==-1)){var c=r[n];a=c.attachedListener;var u=c.cleanup;c=Eo(c.optionsOrUseCapture),v(this._fragmentFiber.child,!1,WM,t,a,c),r.splice(n,1),u!==null&&u()}};function WM(t,n,a,r){return y(t).removeEventListener(n,a,r),!1}function Eo(t){return t!=null&&typeof t!="boolean"&&(t.once===!0||t.signal instanceof AbortSignal)?{capture:t.capture,passive:t.passive}:t}function rv(t){return t==null?"c=0":typeof t=="boolean"?"c="+(t?"1":"0"):"c="+(t.capture?"1":"0")}function ov(t,n,a,r){if(t.length===0)return-1;r=rv(r);for(var c=0;c<t.length;c++){var u=t[c];if(u.type===n&&u.listener===a&&rv(u.optionsOrUseCapture)===r)return c}return-1}ji.prototype.dispatchEvent=function(t){var n=g(this._fragmentFiber);if(n===null)return!0;n=y(n);var a=this._eventListeners;if(a!==null&&0<a.length||!t.bubbles){var r=n.nodeType===9?n.createComment(""):document.createTextNode("");if(a)for(var c=0;c<a.length;c++){var u=a[c];r.addEventListener(u.type,u.attachedListener,Eo(u.optionsOrUseCapture))}if(n.appendChild(r),t=r.dispatchEvent(t),a)for(c=0;c<a.length;c++)u=a[c],r.removeEventListener(u.type,u.attachedListener,Eo(u.optionsOrUseCapture));return n.removeChild(r),t}return n.dispatchEvent(t)},ji.prototype.focus=function(t){v(this._fragmentFiber.child,!0,lv,t,void 0,void 0)};function lv(t,n){return t.tag===6?!1:(t=y(t),iE(t,n))}ji.prototype.focusLast=function(t){var n=[];v(this._fragmentFiber.child,!0,Td,n,void 0,void 0);for(var a=n.length-1;0<=a&&!lv(n[a],t);a--);};function Td(t,n){return n.push(t),!1}ji.prototype.blur=function(){var t=g(this._fragmentFiber);t!==null&&(t=y(t),t=Ul(t).activeElement,t!==null&&v(this._fragmentFiber.child,!1,YM,t,void 0,void 0))};function YM(t,n){return t.tag===6?!1:(t=y(t),t===n||t.contains(n)?(n.blur(),!0):!1)}ji.prototype.observeUsing=function(t){this._observers===null&&(this._observers=new Set),this._observers.add(t),v(this._fragmentFiber.child,!1,qM,t,void 0,void 0)};function qM(t,n){return t.tag===6||(t=y(t),n.observe(t)),!1}ji.prototype.unobserveUsing=function(t){var n=this._observers;if(n!==null&&n.has(t)){n.delete(t),v(this._fragmentFiber.child,!1,jM,t,void 0,void 0);for(var a=n=0;a<ba.length;a++){var r=ba[a];r.fragmentInstance===this&&r.observer===t?t.unobserve(r.instance):ba[n++]=r}ba.length=n}};function jM(t,n){return t.tag===6||(t=y(t),n.unobserve(t)),!1}var ba=[],Ad=!1;function ZM(t,n,a){ba.push({fragmentInstance:t,observer:n,instance:a}),Ad||(Ad=!0,aE(function(){Ad=!1;var r=ba;ba=[];for(var c=0;c<r.length;c++){var u=r[c];u.observer.unobserve(u.instance)}}))}ji.prototype.getClientRects=function(){var t=[];return v(this._fragmentFiber.child,!1,KM,t,void 0,void 0),t};function KM(t,n){if(t.tag===6){t=t.stateNode;var a=t.ownerDocument.createRange();a.selectNodeContents(t),n.push.apply(n,a.getClientRects())}else t=y(t),n.push.apply(n,t.getClientRects());return!1}ji.prototype.getRootNode=function(t){var n=g(this._fragmentFiber);return n===null?this:y(n).getRootNode(t)},ji.prototype.compareDocumentPosition=function(t){var n=g(this._fragmentFiber);if(n===null)return Node.DOCUMENT_POSITION_DISCONNECTED;var a=[];v(this._fragmentFiber.child,!1,Td,a,void 0,void 0);var r=y(n);if(a.length===0){if(a=r,M(this._fragmentFiber)){t:{for(n=this._fragmentFiber.return;n!==null;){if(n.tag===4){n=n.stateNode.containerInfo;break t}if(n.tag===3||n.tag===5||n.tag===27)break;n=n.return}n=null}n!=null&&(a=n)}n=this._fragmentFiber;var c=r=a.compareDocumentPosition(t);return a===t?c=Node.DOCUMENT_POSITION_CONTAINS:r&Node.DOCUMENT_POSITION_CONTAINED_BY&&(a=R(n)[1],a===null?c=Node.DOCUMENT_POSITION_PRECEDING:(t=y(a).compareDocumentPosition(t),c=t===0||t&Node.DOCUMENT_POSITION_FOLLOWING?Node.DOCUMENT_POSITION_FOLLOWING:Node.DOCUMENT_POSITION_PRECEDING)),c|=Node.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC}n=y(a[0]),c=y(a[a.length-1]);var u=M(this._fragmentFiber)?n.parentElement:r;if(u==null)return Node.DOCUMENT_POSITION_DISCONNECTED;r=u.compareDocumentPosition(n)&Node.DOCUMENT_POSITION_CONTAINED_BY,u=u.compareDocumentPosition(c)&Node.DOCUMENT_POSITION_CONTAINED_BY;var _=n.compareDocumentPosition(t),w=c.compareDocumentPosition(t),z=_&Node.DOCUMENT_POSITION_CONTAINED_BY||w&Node.DOCUMENT_POSITION_CONTAINED_BY;return w=r&&u&&_&Node.DOCUMENT_POSITION_FOLLOWING&&w&Node.DOCUMENT_POSITION_PRECEDING,n=r&&n===t||u&&c===t||z||w?Node.DOCUMENT_POSITION_CONTAINED_BY:!r&&n===t||!u&&c===t?Node.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC:_,n&Node.DOCUMENT_POSITION_DISCONNECTED||n&Node.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC||QM(n,this._fragmentFiber,a[0],a[a.length-1],t)?n:Node.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC};function QM(t,n,a,r,c){var u=de(c);if(t&Node.DOCUMENT_POSITION_CONTAINED_BY){if(a=!!u)t:{for(;u!==null;){if(u.tag===7&&(u===n||u.alternate===n)){a=!0;break t}u=u.return}a=!1}return a}if(t&Node.DOCUMENT_POSITION_CONTAINS){if(u===null)return u=c.ownerDocument,c===u||c===u.documentElement||c===u.body;t:{for(u=n,n=g(n);u!==null;){if(!(u.tag!==5&&u.tag!==3&&u.tag!==27||u!==n&&u.alternate!==n)){u=!0;break t}u=u.return}u=!1}return u}return t&Node.DOCUMENT_POSITION_PRECEDING?((n=!!u)&&!(n=u===a)&&(n=U(a,u,L),n===null?n=!1:(v(n,!0,F,u,a),u=x,x=null,n=u!==null)),n):t&Node.DOCUMENT_POSITION_FOLLOWING?((n=!!u)&&!(n=u===r)&&(n=U(r,u,L),n===null?n=!1:(v(n,!0,N,u,r),u=x,D=x=null,n=u!==null)),n):!1}function cv(t,n){var a=t.ownerDocument.createRange();a.selectNodeContents(t),t=a.getBoundingClientRect(),window.scrollTo(window.scrollX+t.left,n?window.scrollY+t.top:window.scrollY+t.bottom-window.innerHeight)}ji.prototype.scrollIntoView=function(t){if(typeof t=="object")throw Error(s(566));var n=[];v(this._fragmentFiber.child,!1,Td,n,void 0,void 0);var a=t!==!1;if(n.length===0){var r=R(this._fragmentFiber);if(r=a?r[1]||r[0]||g(this._fragmentFiber):r[0]||r[1],r===null)return;if(r.tag===6){t=y(r),cv(t,a);return}if(r=y(r),r.nodeType!==9){if(r.nodeType===11){a="host"in r?r.host:null,a!==null&&a.scrollIntoView(t);return}r.scrollIntoView(t)}}for(r=a?n.length-1:0;r!==(a?-1:n.length);){var c=n[r];c.tag===6?(c=y(c),cv(c,a)):y(c).scrollIntoView(t),r+=a?-1:1}};function JM(t,n){return t=y(t),uv(t,n),!1}function uv(t,n){t.reactFragments==null&&(t.reactFragments=new Set),t.reactFragments.add(n)}function fv(t,n){var a=n._eventListeners;if(a!==null)for(var r=0;r<a.length;r++){var c=a[r];t.addEventListener(c.type,c.attachedListener,Eo(c.optionsOrUseCapture))}t.nodeType!==3&&(a=n._observers,a!==null&&a.forEach(function(u){for(var _=0,w=0;w<ba.length;w++){var z=ba[w];(z.fragmentInstance!==n||z.observer!==u||z.instance!==t)&&(ba[_++]=z)}ba.length=_,u.observe(t)}),uv(t,n))}function $M(t,n){var a=n._eventListeners;if(a!==null)for(var r=0;r<a.length;r++){var c=a[r];t.removeEventListener(c.type,c.attachedListener,Eo(c.optionsOrUseCapture))}t.nodeType!==3&&(a=n._observers,a!==null&&a.forEach(function(u){typeof u.rootMargin=="string"?ZM(n,u,t):u.unobserve(t)}),t.reactFragments!=null&&t.reactFragments.delete(n))}function Rd(t){var n=t.firstChild;for(n&&n.nodeType===10&&(n=n.nextSibling);n;){var a=n;switch(n=n.nextSibling,a.nodeName){case"HTML":case"HEAD":case"BODY":Rd(a),te(a);continue;case"SCRIPT":case"STYLE":continue;case"LINK":if(a.rel.toLowerCase()==="stylesheet")continue}t.removeChild(a)}}function tE(t,n,a,r){for(;t.nodeType===1;){var c=a;if(t.nodeName.toLowerCase()!==n.toLowerCase()){if(!r&&(t.nodeName!=="INPUT"||t.type!=="hidden"))break}else if(r){if(!t[It])switch(n){case"meta":if(!t.hasAttribute("itemprop"))break;return t;case"link":if(u=t.getAttribute("rel"),u==="stylesheet"&&t.hasAttribute("data-precedence"))break;if(u!==c.rel||t.getAttribute("href")!==(c.href==null||c.href===""?null:c.href)||t.getAttribute("crossorigin")!==(c.crossOrigin==null?null:c.crossOrigin)||t.getAttribute("title")!==(c.title==null?null:c.title))break;return t;case"style":if(t.hasAttribute("data-precedence"))break;return t;case"script":if(u=t.getAttribute("src"),(u!==(c.src==null?null:c.src)||t.getAttribute("type")!==(c.type==null?null:c.type)||t.getAttribute("crossorigin")!==(c.crossOrigin==null?null:c.crossOrigin))&&u&&t.hasAttribute("async")&&!t.hasAttribute("itemprop"))break;return t;default:return t}}else if(n==="input"&&t.type==="hidden"){var u=c.name==null?null:""+c.name;if(c.type==="hidden"&&t.getAttribute("name")===u)return t}else return t;if(t=ua(t.nextSibling),t===null)break}return null}function eE(t,n,a){if(n==="")return null;for(;t.nodeType!==3;)if((t.nodeType!==1||t.nodeName!=="INPUT"||t.type!=="hidden")&&!a||(t=ua(t.nextSibling),t===null))return null;return t}function hv(t,n){for(;t.nodeType!==8;)if((t.nodeType!==1||t.nodeName!=="INPUT"||t.type!=="hidden")&&!n||(t=ua(t.nextSibling),t===null))return null;return t}function wd(t){return t.data==="$?"||t.data==="$~"}function Cd(t){return t.data==="$!"||t.data==="$?"&&t.ownerDocument.readyState!=="loading"}function nE(t,n){var a=t.ownerDocument;if(t.data==="$~")t._reactRetry=n;else if(t.data!=="$?"||a.readyState!=="loading")n();else{var r=function(){n(),a.removeEventListener("DOMContentLoaded",r)};a.addEventListener("DOMContentLoaded",r),t._reactRetry=r}}function ua(t){for(;t!=null;t=t.nextSibling){var n=t.nodeType;if(n===1||n===3)break;if(n===8){if(n=t.data,n==="$"||n==="$!"||n==="$?"||n==="$~"||n==="&"||n==="F!"||n==="F")break;if(n==="/$"||n==="/&")return null}}return t}var Nd=null;function dv(t){t=t.nextSibling;for(var n=0;t;){if(t.nodeType===8){var a=t.data;if(a==="/$"||a==="/&"){if(n===0)return ua(t.nextSibling);n--}else a!=="$"&&a!=="$!"&&a!=="$?"&&a!=="$~"&&a!=="&"||n++}t=t.nextSibling}return null}function pv(t){t=t.previousSibling;for(var n=0;t;){if(t.nodeType===8){var a=t.data;if(a==="$"||a==="$!"||a==="$?"||a==="$~"||a==="&"){if(n===0)return t;n--}else a!=="/$"&&a!=="/&"||n++}t=t.previousSibling}return null}function iE(t,n){function a(){r=!0}if(t.ownerDocument.activeElement===t)return!0;var r=!1;try{t.ownerDocument.addEventListener("focus",a,!0),(t.focus||HTMLElement.prototype.focus).call(t,n)}finally{t.ownerDocument.removeEventListener("focus",a,!0)}return r}function aE(t){tv(function(){tv(function(n){return t(n)})})}function mv(t,n,a){switch(n=Ul(a),t){case"html":if(t=n.documentElement,!t)throw Error(s(452));return t;case"head":if(t=n.head,!t)throw Error(s(453));return t;case"body":if(t=n.body,!t)throw Error(s(454));return t;default:throw Error(s(451))}}function gv(t,n,a){for(var r in a){var c=a[r];a.hasOwnProperty(r)&&c!=null&&ln(t,n,r,null,LM,c)}a.dangerouslySetInnerHTML!=null&&(t.textContent=""),t.onclick===ia&&(t.onclick=null),te(t)}function Dd(t){for(var n=t.attributes;n.length;)t.removeAttributeNode(n[0]);te(t)}var fa=new Map,_v=new Set;function Ll(t){if(typeof t.getRootNode=="function"){var n=t.getRootNode();if(n.nodeType===9||n.nodeType===11)return n}return t.nodeType===9?t:t.ownerDocument}var ps=Ot.d;Ot.d={f:sE,r:rE,D:oE,C:lE,L:cE,m:uE,X:hE,S:fE,M:dE};function sE(){var t=ps.f(),n=fu();return t||n}function rE(t){var n=ve(t);n!==null&&n.tag===5&&n.type==="form"?xg(n):ps.r(t)}var bo=typeof document>"u"?null:document;function vv(t,n,a){var r=bo;if(r&&typeof n=="string"&&n){var c=ge(n);c='link[rel="'+t+'"][href="'+c+'"]',typeof a=="string"&&(c+='[crossorigin="'+a+'"]'),_v.has(c)||(_v.add(c),t={rel:t,crossOrigin:a,href:n},r.querySelector(c)===null&&(n=r.createElement("link"),ti(n,"link",t),be(n),r.head.appendChild(n)))}}function oE(t){ps.D(t),vv("dns-prefetch",t,null)}function lE(t,n){ps.C(t,n),vv("preconnect",t,n)}function cE(t,n,a){ps.L(t,n,a);var r=bo;if(r&&t&&n){var c='link[rel="preload"][as="'+ge(n)+'"]';n==="image"&&a&&a.imageSrcSet?(c+='[imagesrcset="'+ge(a.imageSrcSet)+'"]',typeof a.imageSizes=="string"&&(c+='[imagesizes="'+ge(a.imageSizes)+'"]')):c+='[href="'+ge(t)+'"]';var u=c;switch(n){case"style":u=To(t);break;case"script":u=Ao(t)}if(!(fa.has(u)||(t=I({rel:"preload",href:n==="image"&&a&&a.imageSrcSet?void 0:t,as:n},a),fa.set(u,t),r.querySelector(c)!==null||n==="style"&&r.querySelector(Ol(u))||n==="script"&&r.querySelector(Pl(u))))){var _=r.createElement("link");ti(_,"link",t),n==="style"&&(_[ee]=!0,_.onload=_.onerror=function(){Ze(_)}),be(_),r.head.appendChild(_)}}}function uE(t,n){ps.m(t,n);var a=bo;if(a&&t){var r=n&&typeof n.as=="string"?n.as:"script",c='link[rel="modulepreload"][as="'+ge(r)+'"][href="'+ge(t)+'"]',u=c;switch(r){case"audioworklet":case"paintworklet":case"serviceworker":case"sharedworker":case"worker":case"script":u=Ao(t)}if(!fa.has(u)&&(t=I({rel:"modulepreload",href:t},n),fa.set(u,t),a.querySelector(c)===null)){switch(r){case"audioworklet":case"paintworklet":case"serviceworker":case"sharedworker":case"worker":case"script":if(a.querySelector(Pl(u)))return}r=a.createElement("link"),ti(r,"link",t),be(r),a.head.appendChild(r)}}}function fE(t,n,a){ps.S(t,n,a);var r=bo;if(r&&t){var c=Ue(r).hoistableStyles,u=To(t);n=n||"default";var _=c.get(u);if(!_){var w={loading:0,preload:null};if(_=r.querySelector(Ol(u)))w.loading=5;else{t=I({rel:"stylesheet",href:t,"data-precedence":n},a),(a=fa.get(u))&&Ud(t,a);var z=_=r.createElement("link");be(z),ti(z,"link",t),z._p=new Promise(function(et,ht){z.onload=et,z.onerror=ht}),z.addEventListener("load",function(){w.loading|=1}),z.addEventListener("error",function(){w.loading|=2}),w.loading|=4,vu(_,n,r)}_={type:"stylesheet",instance:_,count:1,state:w},c.set(u,_)}}}function hE(t,n){ps.X(t,n);var a=bo;if(a&&t){var r=Ue(a).hoistableScripts,c=Ao(t),u=r.get(c);u||(u=a.querySelector(Pl(c)),u||(t=I({src:t,async:!0},n),(n=fa.get(c))&&Ld(t,n),u=a.createElement("script"),be(u),ti(u,"link",t),a.head.appendChild(u)),u={type:"script",instance:u,count:1,state:null},r.set(c,u))}}function dE(t,n){ps.M(t,n);var a=bo;if(a&&t){var r=Ue(a).hoistableScripts,c=Ao(t),u=r.get(c);u||(u=a.querySelector(Pl(c)),u||(t=I({src:t,async:!0,type:"module"},n),(n=fa.get(c))&&Ld(t,n),u=a.createElement("script"),be(u),ti(u,"link",t),a.head.appendChild(u)),u={type:"script",instance:u,count:1,state:null},r.set(c,u))}}function xv(t,n,a,r){var c=(c=je.current)?Ll(c):null;if(!c)throw Error(s(446));switch(t){case"meta":case"title":return null;case"style":return typeof a.precedence=="string"&&typeof a.href=="string"?(a=To(a.href),n=Ue(c).hoistableStyles,r=n.get(a),r||(r={type:"style",instance:null,count:0,state:null},n.set(a,r)),r):{type:"void",instance:null,count:0,state:null};case"link":if(a.rel==="stylesheet"&&typeof a.href=="string"&&typeof a.precedence=="string"){t=To(a.href);var u=Ue(c).hoistableStyles,_=u.get(t);if(_||(c=c.ownerDocument||c,_={type:"stylesheet",instance:null,count:0,state:{loading:0,preload:null}},u.set(t,_),(u=c.querySelector(Ol(t)))?u._p||(_.instance=u,_.state.loading=5):(u=fa.get(t),u||(u={rel:"preload",as:"style",href:a.href,crossOrigin:a.crossOrigin,integrity:a.integrity,media:a.media,hrefLang:a.hrefLang,referrerPolicy:a.referrerPolicy},fa.set(t,u)),pE(c,t,u,_.state))),n&&r===null)throw Error(s(528,""));return _}if(n&&r!==null)throw Error(s(529,""));return null;case"script":return n=a.async,a=a.src,typeof a=="string"&&n&&typeof n!="function"&&typeof n!="symbol"?(a=Ao(a),n=Ue(c).hoistableScripts,r=n.get(a),r||(r={type:"script",instance:null,count:0,state:null},n.set(a,r)),r):{type:"void",instance:null,count:0,state:null};default:throw Error(s(444,t))}}function To(t){return'href="'+ge(t)+'"'}function Ol(t){return'link[rel="stylesheet"]['+t+"]"}function Sv(t){return I({},t,{"data-precedence":t.precedence,precedence:null})}function pE(t,n,a,r){if(n=t.querySelector('link[rel="preload"][as="style"]['+n+"]")){if(n[ee]!==!0){r.loading=1;return}}else n=t.createElement("link"),n[ee]=!0,n.onload=n.onerror=Ze.bind(null,n),ti(n,"link",a),be(n),t.head.appendChild(n);r.preload=n,n.addEventListener("load",function(){return r.loading|=1}),n.addEventListener("error",function(){return r.loading|=2})}function Ao(t){return'[src="'+ge(t)+'"]'}function Pl(t){return"script[async]"+t}function yv(t,n,a){if(n.count++,n.instance===null)switch(n.type){case"style":var r=t.querySelector('style[data-href~="'+ge(a.href)+'"]');if(r)return n.instance=r,be(r),r;var c=I({},a,{"data-href":a.href,"data-precedence":a.precedence,href:null,precedence:null});return r=(t.ownerDocument||t).createElement("style"),be(r),ti(r,"style",c),vu(r,a.precedence,t),n.instance=r;case"stylesheet":c=To(a.href);var u=t.querySelector(Ol(c));if(u)return n.state.loading|=4,n.instance=u,be(u),u;r=Sv(a),(c=fa.get(c))&&Ud(r,c),u=(t.ownerDocument||t).createElement("link"),be(u);var _=u;return _._p=new Promise(function(w,z){_.onload=w,_.onerror=z}),ti(u,"link",r),n.state.loading|=4,vu(u,a.precedence,t),n.instance=u;case"script":return u=Ao(a.src),(c=t.querySelector(Pl(u)))?(n.instance=c,be(c),c):(r=a,(c=fa.get(u))&&(r=I({},a),Ld(r,c)),t=t.ownerDocument||t,c=t.createElement("script"),be(c),ti(c,"link",r),t.head.appendChild(c),n.instance=c);case"void":return null;default:throw Error(s(443,n.type))}else n.type==="stylesheet"&&(n.state.loading&4)===0&&(r=n.instance,n.state.loading|=4,vu(r,a.precedence,t));return n.instance}function vu(t,n,a){for(var r=a.querySelectorAll('link[rel="stylesheet"][data-precedence],style[data-precedence]'),c=r.length?r[r.length-1]:null,u=c,_=0;_<r.length;_++){var w=r[_];if(w.dataset.precedence===n)u=w;else if(u!==c)break}u?u.parentNode.insertBefore(t,u.nextSibling):(n=a.nodeType===9?a.head:a,n.insertBefore(t,n.firstChild))}function Ud(t,n){t.crossOrigin==null&&(t.crossOrigin=n.crossOrigin),t.referrerPolicy==null&&(t.referrerPolicy=n.referrerPolicy),t.title==null&&(t.title=n.title)}function Ld(t,n){t.crossOrigin==null&&(t.crossOrigin=n.crossOrigin),t.referrerPolicy==null&&(t.referrerPolicy=n.referrerPolicy),t.integrity==null&&(t.integrity=n.integrity)}var xu=null;function Mv(t,n,a){if(xu===null){var r=new Map,c=xu=new Map;c.set(a,r)}else c=xu,r=c.get(a),r||(r=new Map,c.set(a,r));if(r.has(t))return r;for(r.set(t,null),a=a.getElementsByTagName(t),c=0;c<a.length;c++){var u=a[c];if(!(u[It]||u[A]||t==="link"&&u.getAttribute("rel")==="stylesheet")&&u.namespaceURI!=="http://www.w3.org/2000/svg"){var _=u.getAttribute(n)||"";_=t+_;var w=r.get(_);w?w.push(u):r.set(_,[u])}}return r}function Od(t,n,a){t=t.ownerDocument||t,t.head.insertBefore(a,n==="title"?t.querySelector("head > title"):null)}function mE(t,n,a){if(a===1||n.itemProp!=null)return!1;switch(t){case"meta":case"title":return!0;case"style":if(typeof n.precedence!="string"||typeof n.href!="string"||n.href==="")break;return!0;case"link":if(typeof n.rel!="string"||typeof n.href!="string"||n.href===""||n.onLoad||n.onError)break;return n.rel==="stylesheet"?(t=n.disabled,typeof n.precedence=="string"&&t==null):!0;case"script":if(n.async&&typeof n.async!="function"&&typeof n.async!="symbol"&&!n.onLoad&&!n.onError&&n.src&&typeof n.src=="string")return!0}return!1}function Ev(t,n){return t==="img"&&n.src!=null&&n.src!==""&&n.onLoad==null&&n.loading!=="lazy"}function bv(t){return!(t.type==="stylesheet"&&(t.state.loading&3)===0)}function Tv(t){return(t.width||100)*(t.height||100)*(typeof devicePixelRatio=="number"?devicePixelRatio:1)*.25}function Av(t,n){typeof n.decode=="function"&&(t.imgCount++,n.complete||(t.imgBytes+=Tv(n),t.suspenseyImages.push(n)),t=vE.bind(t),n.decode().then(t,t))}function gE(t,n,a,r){if(a.type==="stylesheet"&&(typeof r.media!="string"||matchMedia(r.media).matches!==!1)&&(a.state.loading&4)===0){if(a.instance===null){var c=To(r.href),u=n.querySelector(Ol(c));if(u){n=u._p,n!==null&&typeof n=="object"&&typeof n.then=="function"&&(t.count++,t=Il.bind(t),n.then(t,t)),a.state.loading|=4,a.instance=u,be(u);return}u=n.ownerDocument||n,r=Sv(r),(c=fa.get(c))&&Ud(r,c),u=u.createElement("link"),be(u);var _=u;_._p=new Promise(function(w,z){_.onload=w,_.onerror=z}),ti(u,"link",r),a.instance=u}t.stylesheets===null&&(t.stylesheets=new Map),t.stylesheets.set(a,n),(n=a.state.preload)&&(a.state.loading&3)===0&&(t.count++,a=Il.bind(t),n.addEventListener("load",a),n.addEventListener("error",a))}}var Su=0;function _E(t,n){return t.stylesheets&&t.count===0&&Mu(t,t.stylesheets),0<t.count||0<t.imgCount?function(a){var r=setTimeout(function(){if(t.stylesheets&&Mu(t,t.stylesheets),t.unsuspend){var u=t.unsuspend;t.unsuspend=null,u()}},6e4+n);0<t.imgBytes&&Su===0&&(Su=62500*PM());var c=setTimeout(function(){if(t.waitingForImages=!1,t.count===0&&(t.stylesheets&&Mu(t,t.stylesheets),t.unsuspend)){var u=t.unsuspend;t.unsuspend=null,u()}},(t.imgBytes>Su?50:800)+n);return t.unsuspend=a,function(){t.unsuspend=null,clearTimeout(r),clearTimeout(c)}}:null}function Rv(t){if(t.count===0&&(t.imgCount===0||!t.waitingForImages)){if(t.stylesheets)Mu(t,t.stylesheets);else if(t.unsuspend){var n=t.unsuspend;t.unsuspend=null,n()}}}function Il(){this.count--,Rv(this)}function vE(){this.imgCount--,Rv(this)}var yu=null;function Mu(t,n){t.stylesheets=null,t.unsuspend!==null&&(t.count++,yu=new Map,n.forEach(xE,t),yu=null,Il.call(t))}function xE(t,n){if(!(n.state.loading&4)){var a=yu.get(t);if(a)var r=a.get(null);else{a=new Map,yu.set(t,a);for(var c=t.querySelectorAll("link[data-precedence],style[data-precedence]"),u=0;u<c.length;u++){var _=c[u];(_.nodeName==="LINK"||_.getAttribute("media")!=="not all")&&(a.set(_.dataset.precedence,_),r=_)}r&&a.set(null,r)}c=n.instance,_=c.getAttribute("data-precedence"),u=a.get(_)||r,u===r&&a.set(null,c),a.set(_,c),this.count++,r=Il.bind(this),c.addEventListener("load",r),c.addEventListener("error",r),u?u.parentNode.insertBefore(c,u.nextSibling):(t=t.nodeType===9?t.head:t,t.insertBefore(c,t.firstChild)),n.state.loading|=4}}var Ro={$$typeof:nt,Provider:null,Consumer:null,_currentValue:$e,_currentValue2:$e,_threadCount:0};function SE(t,n,a,r,c,u,_,w,z){this.tag=1,this.containerInfo=t,this.pingCache=this.current=this.pendingChildren=null,this.timeoutHandle=-1,this.callbackNode=this.next=this.pendingContext=this.context=this.cancelPendingCommit=null,this.callbackPriority=0,this.expirationTimes=As(-1),this.entangledLanes=this.shellSuspendCounter=this.errorRecoveryDisabledLanes=this.expiredLanes=this.warmLanes=this.pingedLanes=this.suspendedLanes=this.pendingLanes=0,this.entanglements=As(0),this.hiddenUpdates=As(null),this.identifierPrefix=r,this.onUncaughtError=c,this.onCaughtError=u,this.onRecoverableError=_,this.pooledCache=null,this.pooledCacheLanes=0,this.formState=z,this.transitionTypes=null,this.incompleteTransitions=new Map}function wv(t,n,a,r,c,u,_,w,z,et,ht,Tt){return t=new SE(t,n,a,_,z,et,ht,Tt,w),n=1,u===!0&&(n|=24),u=Ni(3,null,null,n),t.current=u,u.stateNode=t,n=Zf(),n.refCount++,t.pooledCache=n,n.refCount++,u.memoizedState={element:r,isDehydrated:a,cache:n},$f(u),t}function Cv(t){return t?(t=Jr,t):Jr}function Nv(t,n,a,r,c,u){c=Cv(c),r.context===null?r.context=c:r.pendingContext=c,r=Is(n),r.payload={element:a},u=u===void 0?null:u,u!==null&&(r.callback=u),a=zs(t,r,n),a!==null&&(Oi(a,t,n),dl(a,t,n))}function Dv(t,n){if(t=t.memoizedState,t!==null&&t.dehydrated!==null){var a=t.retryLane;t.retryLane=a!==0&&a<n?a:n}}function Pd(t,n){Dv(t,n),(t=t.alternate)&&Dv(t,n)}function Uv(t){if(t.tag===13||t.tag===31){var n=vr(t,67108864);n!==null&&Oi(n,t,67108864),Pd(t,67108864)}}function Lv(t){if(t.tag===13||t.tag===31){var n=qi();n=hr(n);var a=vr(t,n);a!==null&&Oi(a,t,n),Pd(t,n)}}var wo=!0;function yE(t,n,a,r){var c=Mt.T;Mt.T=null;var u=Ot.p;try{Ot.p=2,Id(t,n,a,r)}finally{Ot.p=u,Mt.T=c}}function ME(t,n,a,r){var c=Mt.T;Mt.T=null;var u=Ot.p;try{Ot.p=8,Id(t,n,a,r)}finally{Ot.p=u,Mt.T=c}}function Id(t,n,a,r){if(wo){var c=zd(r);if(c===null)_d(t,n,r,Eu,a),Pv(t,r);else if(bE(c,t,n,a,r))r.stopPropagation();else if(Pv(t,r),n&4&&-1<EE.indexOf(t)){for(;c!==null;){var u=ve(c);if(u!==null)switch(u.tag){case 3:if(u=u.stateNode,u.current.memoizedState.isDehydrated){var _=ai(u.pendingLanes);if(_!==0){var w=u;for(w.pendingLanes|=2,w.entangledLanes|=2;_;){var z=1<<31-_e(_);w.entanglements[1]|=z,_&=~z}Xa(u),(en&6)===0&&(lu=qt()+500,Cl(0))}}break;case 31:case 13:w=vr(u,2),w!==null&&Oi(w,u,2),fu(),Pd(u,2)}if(u=zd(r),u===null&&_d(t,n,r,Eu,a),u===c)break;c=u}c!==null&&r.stopPropagation()}else _d(t,n,r,null,a)}}function zd(t){return t=pr(t),Bd(t)}var Eu=null;function Bd(t){if(Eu=null,t=de(t),t!==null){var n=f(t);if(n===null)t=null;else{var a=n.tag;if(a===13){if(t=h(n),t!==null)return t;t=null}else if(a===31){if(t=d(n),t!==null)return t;t=null}else if(a===3){if(n.stateNode.current.memoizedState.isDehydrated)return n.tag===3?n.stateNode.containerInfo:null;t=null}else n!==t&&(t=null)}}return Eu=t,null}function Ov(t){switch(t){case"beforetoggle":case"cancel":case"click":case"close":case"contextmenu":case"copy":case"cut":case"auxclick":case"dblclick":case"dragend":case"dragstart":case"drop":case"focusin":case"focusout":case"input":case"invalid":case"keydown":case"keypress":case"keyup":case"mousedown":case"mouseup":case"paste":case"pause":case"play":case"pointercancel":case"pointerdown":case"pointerup":case"ratechange":case"reset":case"seeked":case"submit":case"toggle":case"touchcancel":case"touchend":case"touchstart":case"volumechange":case"change":case"selectionchange":case"textInput":case"compositionstart":case"compositionend":case"compositionupdate":case"beforeblur":case"afterblur":case"beforeinput":case"blur":case"fullscreenchange":case"fullscreenerror":case"focus":case"hashchange":case"popstate":case"select":case"selectstart":return 2;case"drag":case"dragenter":case"dragexit":case"dragleave":case"dragover":case"mousemove":case"mouseout":case"mouseover":case"pointermove":case"pointerout":case"pointerover":case"resize":case"scroll":case"touchmove":case"wheel":case"mouseenter":case"mouseleave":case"pointerenter":case"pointerleave":return 8;case"message":switch(le()){case me:return 2;case W:return 8;case Pt:case yt:return 32;case Bt:return 268435456;default:return 32}default:return 32}}var Fd=!1,Zs=null,Ks=null,Qs=null,zl=new Map,Bl=new Map,Js=[],EE="mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset".split(" ");function Pv(t,n){switch(t){case"focusin":case"focusout":Zs=null;break;case"dragenter":case"dragleave":Ks=null;break;case"mouseover":case"mouseout":Qs=null;break;case"pointerover":case"pointerout":zl.delete(n.pointerId);break;case"gotpointercapture":case"lostpointercapture":Bl.delete(n.pointerId)}}function Fl(t,n,a,r,c,u){return t===null||t.nativeEvent!==u?(t={blockedOn:n,domEventName:a,eventSystemFlags:r,nativeEvent:u,targetContainers:[c]},n!==null&&(n=ve(n),n!==null&&Uv(n)),t):(t.eventSystemFlags|=r,n=t.targetContainers,c!==null&&n.indexOf(c)===-1&&n.push(c),t)}function bE(t,n,a,r,c){switch(n){case"focusin":return Zs=Fl(Zs,t,n,a,r,c),!0;case"dragenter":return Ks=Fl(Ks,t,n,a,r,c),!0;case"mouseover":return Qs=Fl(Qs,t,n,a,r,c),!0;case"pointerover":var u=c.pointerId;return zl.set(u,Fl(zl.get(u)||null,t,n,a,r,c)),!0;case"gotpointercapture":return u=c.pointerId,Bl.set(u,Fl(Bl.get(u)||null,t,n,a,r,c)),!0}return!1}function Iv(t){var n=de(t.target);if(n!==null){var a=f(n);if(a!==null){if(n=a.tag,n===13){if(n=h(a),n!==null){t.blockedOn=n,La(t.priority,function(){Lv(a)});return}}else if(n===31){if(n=d(a),n!==null){t.blockedOn=n,La(t.priority,function(){Lv(a)});return}}else if(n===3&&a.stateNode.current.memoizedState.isDehydrated){t.blockedOn=a.tag===3?a.stateNode.containerInfo:null;return}}}t.blockedOn=null}function bu(t){if(t.blockedOn!==null)return!1;for(var n=t.targetContainers;0<n.length;){var a=zd(t.nativeEvent);if(a===null){a=t.nativeEvent;var r=new a.constructor(a.type,a);dr=r,a.target.dispatchEvent(r),dr=null}else return n=ve(a),n!==null&&Uv(n),t.blockedOn=a,!1;n.shift()}return!0}function zv(t,n,a){bu(t)&&a.delete(n)}function TE(){Fd=!1,Zs!==null&&bu(Zs)&&(Zs=null),Ks!==null&&bu(Ks)&&(Ks=null),Qs!==null&&bu(Qs)&&(Qs=null),zl.forEach(zv),Bl.forEach(zv)}function Tu(t,n){t.blockedOn===n&&(t.blockedOn=null,Fd||(Fd=!0,o.unstable_scheduleCallback(o.unstable_NormalPriority,TE)))}var Au=null;function Bv(t){Au!==t&&(Au=t,o.unstable_scheduleCallback(o.unstable_NormalPriority,function(){Au===t&&(Au=null);for(var n=0;n<t.length;n+=3){var a=t[n],r=t[n+1],c=t[n+2];if(typeof r!="function"){if(Bd(r||a)===null)continue;break}var u=ve(a);u!==null&&(t.splice(n,3),n-=3,Sh(u,{pending:!0,data:c,method:a.method,action:r},r,c))}}))}function Co(t){function n(z){return Tu(z,t)}Zs!==null&&Tu(Zs,t),Ks!==null&&Tu(Ks,t),Qs!==null&&Tu(Qs,t),zl.forEach(n),Bl.forEach(n);for(var a=0;a<Js.length;a++){var r=Js[a];r.blockedOn===t&&(r.blockedOn=null)}for(;0<Js.length&&(a=Js[0],a.blockedOn===null);)Iv(a),a.blockedOn===null&&Js.shift();if(a=(t.ownerDocument||t).$$reactFormReplay,a!=null)for(r=0;r<a.length;r+=3){var c=a[r],u=a[r+1],_=c[H]||null;if(typeof u=="function")_||Bv(a);else if(_){var w=null;if(u&&u.hasAttribute("formAction")){if(c=u,_=u[H]||null)w=_.formAction;else if(Bd(c)!==null)continue}else w=_.action;typeof w=="function"?a[r+1]=w:(a.splice(r,3),r-=3),Bv(a)}}}function Fv(){function t(u){u.canIntercept&&u.info==="react-transition"&&u.intercept({handler:function(){return new Promise(function(_){return c=_})},focusReset:"manual",scroll:"manual"})}function n(){c!==null&&(c(),c=null),r||setTimeout(a,20)}function a(){if(!r&&!navigation.transition){var u=navigation.currentEntry;u&&u.url!=null&&navigation.navigate(u.url,{state:u.getState(),info:"react-transition",history:"replace"})}}if(typeof navigation=="object"){var r=!1,c=null;return navigation.addEventListener("navigate",t),navigation.addEventListener("navigatesuccess",n),navigation.addEventListener("navigateerror",n),setTimeout(a,100),function(){r=!0,navigation.removeEventListener("navigate",t),navigation.removeEventListener("navigatesuccess",n),navigation.removeEventListener("navigateerror",n),c!==null&&(c(),c=null)}}}function Hd(t){this._internalRoot=t}Ru.prototype.render=Hd.prototype.render=function(t){var n=this._internalRoot;if(n===null)throw Error(s(409));var a=n.current,r=qi();Nv(a,r,t,n,null,null)},Ru.prototype.unmount=Hd.prototype.unmount=function(){var t=this._internalRoot;if(t!==null){this._internalRoot=null;var n=t.containerInfo;Nv(t.current,2,null,t,null,null),fu(),n[ft]=null}};function Ru(t){this._internalRoot=t}Ru.prototype.unstable_scheduleHydration=function(t){if(t){var n=Rs();t={blockedOn:null,target:t,priority:n};for(var a=0;a<Js.length&&n!==0&&n<Js[a].priority;a++);Js.splice(a,0,t),a===0&&Iv(t)}};var Hv=e.version;if(Hv!=="19.3.0")throw Error(s(527,Hv,"19.3.0"));Ot.findDOMNode=function(t){var n=t._reactInternals;if(n===void 0)throw typeof t.render=="function"?Error(s(188)):(t=Object.keys(t).join(","),Error(s(268,t)));return t=p(n),t=t!==null?S(t):null,t=t===null?null:t.stateNode,t};var AE={bundleType:0,version:"19.3.0",rendererPackageName:"react-dom",currentDispatcherRef:Mt,reconcilerVersion:"19.3.0"};if(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__<"u"){var wu=__REACT_DEVTOOLS_GLOBAL_HOOK__;if(!wu.isDisabled&&wu.supportsFiber)try{se=wu.inject(AE),Ht=wu}catch{}}return Gl.createRoot=function(t,n){if(!l(t))throw Error(s(299));var a=!1,r="",c=Cg,u=Ng,_=Dg;return n!=null&&(n.unstable_strictMode===!0&&(a=!0),n.identifierPrefix!==void 0&&(r=n.identifierPrefix),n.onUncaughtError!==void 0&&(c=n.onUncaughtError),n.onCaughtError!==void 0&&(u=n.onCaughtError),n.onRecoverableError!==void 0&&(_=n.onRecoverableError)),n=wv(t,1,!1,null,null,a,r,null,c,u,_,Fv),t[ft]=n.current,gd(t),new Hd(n)},Gl.hydrateRoot=function(t,n,a){if(!l(t))throw Error(s(299));var r=!1,c="",u=Cg,_=Ng,w=Dg,z=null;return a!=null&&(a.unstable_strictMode===!0&&(r=!0),a.identifierPrefix!==void 0&&(c=a.identifierPrefix),a.onUncaughtError!==void 0&&(u=a.onUncaughtError),a.onCaughtError!==void 0&&(_=a.onCaughtError),a.onRecoverableError!==void 0&&(w=a.onRecoverableError),a.formState!==void 0&&(z=a.formState)),n=wv(t,1,!0,n,a??null,r,c,z,u,_,w,Fv),n.context=Cv(null),a=n.current,r=qi(),r=hr(r),c=Is(r),c.callback=null,zs(a,c,r),a=r,n.current.lanes=a,Ai(n,a),Xa(n),t[ft]=n.current,gd(t),new Ru(n)},Gl.version="19.3.0",Gl}var Kv;function IE(){if(Kv)return kd.exports;Kv=1;function o(){if(!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__>"u"||typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE!="function"))try{__REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(o)}catch(e){console.error(e)}}return o(),kd.exports=PE(),kd.exports}var zE=IE();const ym="186",Yo={ROTATE:0,DOLLY:1,PAN:2},Xo={ROTATE:0,PAN:1,DOLLY_PAN:2,DOLLY_ROTATE:3},BE=0,Qv=1,FE=2,Jl=1,HE=2,Kl=3,kr=0,zi=1,bi=2,Ms=0,$l=1,Jv=2,$v=3,tx=4,GE=5,ko=100,VE=101,kE=102,XE=103,WE=104,YE=200,qE=201,jE=202,ZE=203,lS=204,cS=205,KE=206,QE=207,JE=208,$E=209,tb=210,eb=211,nb=212,ib=213,ab=214,wp=0,Cp=1,Np=2,nc=3,Dp=4,Up=5,Lp=6,Op=7,uS=0,sb=1,rb=2,Ka=0,fS=1,hS=2,dS=3,pS=4,mS=5,gS=6,_S=7,vS=300,Xr=301,Zo=302,qd=303,jd=304,vf=306,Pp=1e3,ys=1001,Ip=1002,ni=1003,ob=1004,Cu=1005,hi=1006,Zd=1007,Gr=1008,Ji=1009,xS=1010,SS=1011,ic=1012,Mm=1013,Qa=1014,ja=1015,Ja=1016,Em=1017,bm=1018,ac=1020,yS=35902,MS=35899,ES=1021,bS=1022,wa=1023,Ts=1026,Vr=1027,TS=1028,Tm=1029,Wr=1030,Am=1031,Rm=1033,af=33776,sf=33777,rf=33778,of=33779,zp=35840,Bp=35841,Fp=35842,Hp=35843,Gp=36196,Vp=37492,kp=37496,Xp=37488,Wp=37489,cf=37490,Yp=37491,qp=37808,jp=37809,Zp=37810,Kp=37811,Qp=37812,Jp=37813,$p=37814,tm=37815,em=37816,nm=37817,im=37818,am=37819,sm=37820,rm=37821,om=36492,lm=36494,cm=36495,um=36283,fm=36284,uf=36285,hm=36286,lb=3200,dm=0,cb=1,sr="",da="srgb",ff="srgb-linear",hf="linear",cn="srgb",Kd=7680,ub=519,fb=512,hb=513,db=514,wm=515,pb=516,mb=517,Cm=518,gb=519,_b=35044,ex="300 es",Za=2e3,sc=2001;function vb(o){for(let e=o.length-1;e>=0;--e)if(o[e]>=65535)return!0;return!1}function df(o){return document.createElementNS("http://www.w3.org/1999/xhtml",o)}function xb(){const o=df("canvas");return o.style.display="block",o}const nx={};function ix(...o){const e="THREE."+o.shift();console.log(e,...o)}function AS(o){const e=o[0];if(typeof e=="string"&&e.startsWith("TSL:")){const i=o[1];i&&i.isStackTrace?o[0]+=" "+i.getLocation():o[1]='Stack trace not available. Enable "THREE.Node.captureStackTrace" to capture stack traces.'}return o}function xe(...o){o=AS(o);const e="THREE."+o.shift();{const i=o[0];i&&i.isStackTrace?console.warn(i.getError(e)):console.warn(e,...o)}}function Je(...o){o=AS(o);const e="THREE."+o.shift();{const i=o[0];i&&i.isStackTrace?console.error(i.getError(e)):console.error(e,...o)}}function qo(...o){const e=o.join(" ");e in nx||(nx[e]=!0,xe(...o))}function Sb(o,e,i){return new Promise(function(s,l){function f(){switch(o.clientWaitSync(e,o.SYNC_FLUSH_COMMANDS_BIT,0)){case o.WAIT_FAILED:l();break;case o.TIMEOUT_EXPIRED:setTimeout(f,i);break;default:s()}}setTimeout(f,i)})}const yb={[wp]:Cp,[Np]:Lp,[Dp]:Op,[nc]:Up,[Cp]:wp,[Lp]:Np,[Op]:Dp,[Up]:nc};class lr{addEventListener(e,i){this._listeners===void 0&&(this._listeners={});const s=this._listeners;s[e]===void 0&&(s[e]=[]),s[e].indexOf(i)===-1&&s[e].push(i)}hasEventListener(e,i){const s=this._listeners;return s===void 0?!1:s[e]!==void 0&&s[e].indexOf(i)!==-1}removeEventListener(e,i){const s=this._listeners;if(s===void 0)return;const l=s[e];if(l!==void 0){const f=l.indexOf(i);f!==-1&&l.splice(f,1)}}dispatchEvent(e){const i=this._listeners;if(i===void 0)return;const s=i[e.type];if(s!==void 0){e.target=this;const l=s.slice(0);for(let f=0,h=l.length;f<h;f++)l[f].call(this,e);e.target=null}}}const ui=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"],tc=Math.PI/180,pm=180/Math.PI;function lc(){const o=Math.random()*4294967295|0,e=Math.random()*4294967295|0,i=Math.random()*4294967295|0,s=Math.random()*4294967295|0;return(ui[o&255]+ui[o>>8&255]+ui[o>>16&255]+ui[o>>24&255]+"-"+ui[e&255]+ui[e>>8&255]+"-"+ui[e>>16&15|64]+ui[e>>24&255]+"-"+ui[i&63|128]+ui[i>>8&255]+"-"+ui[i>>16&255]+ui[i>>24&255]+ui[s&255]+ui[s>>8&255]+ui[s>>16&255]+ui[s>>24&255]).toLowerCase()}function Ge(o,e,i){return Math.max(e,Math.min(i,o))}function Mb(o,e){return(o%e+e)%e}function Qd(o,e,i){return(1-i)*o+i*e}function Vl(o,e){switch(e.constructor){case Float32Array:return o;case Uint32Array:return o/4294967295;case Uint16Array:return o/65535;case Uint8Array:case Uint8ClampedArray:return o/255;case Int32Array:return Math.max(o/2147483647,-1);case Int16Array:return Math.max(o/32767,-1);case Int8Array:return Math.max(o/127,-1);default:throw new Error("THREE.MathUtils: Invalid component type.")}}function Pi(o,e){switch(e.constructor){case Float32Array:return o;case Uint32Array:return Math.round(o*4294967295);case Uint16Array:return Math.round(o*65535);case Uint8Array:case Uint8ClampedArray:return Math.round(o*255);case Int32Array:return Math.round(o*2147483647);case Int16Array:return Math.round(o*32767);case Int8Array:return Math.round(o*127);default:throw new Error("THREE.MathUtils: Invalid component type.")}}const Eb={DEG2RAD:tc},Gm=class Gm{constructor(e=0,i=0){this.x=e,this.y=i}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,i){return this.x=e,this.y=i,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,i){switch(e){case 0:this.x=i;break;case 1:this.y=i;break;default:throw new Error("THREE.Vector2: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw new Error("THREE.Vector2: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,i){return this.x=e.x+i.x,this.y=e.y+i.y,this}addScaledVector(e,i){return this.x+=e.x*i,this.y+=e.y*i,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,i){return this.x=e.x-i.x,this.y=e.y-i.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){const i=this.x,s=this.y,l=e.elements;return this.x=l[0]*i+l[3]*s+l[6],this.y=l[1]*i+l[4]*s+l[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,i){return this.x=Ge(this.x,e.x,i.x),this.y=Ge(this.y,e.y,i.y),this}clampScalar(e,i){return this.x=Ge(this.x,e,i),this.y=Ge(this.y,e,i),this}clampLength(e,i){const s=this.length();return this.divideScalar(s||1).multiplyScalar(Ge(s,e,i))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(e){const i=Math.sqrt(this.lengthSq()*e.lengthSq());if(i===0)return Math.PI/2;const s=this.dot(e)/i;return Math.acos(Ge(s,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){const i=this.x-e.x,s=this.y-e.y;return i*i+s*s}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,i){return this.x+=(e.x-this.x)*i,this.y+=(e.y-this.y)*i,this}lerpVectors(e,i,s){return this.x=e.x+(i.x-e.x)*s,this.y=e.y+(i.y-e.y)*s,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,i=0){return this.x=e[i],this.y=e[i+1],this}toArray(e=[],i=0){return e[i]=this.x,e[i+1]=this.y,e}fromBufferAttribute(e,i){return this.x=e.getX(i),this.y=e.getY(i),this}rotateAround(e,i){const s=Math.cos(i),l=Math.sin(i),f=this.x-e.x,h=this.y-e.y;return this.x=f*s-h*l+e.x,this.y=f*l+h*s+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}};Gm.prototype.isVector2=!0;let ye=Gm;class rr{constructor(e=0,i=0,s=0,l=1){this.isQuaternion=!0,this._x=e,this._y=i,this._z=s,this._w=l}static slerpFlat(e,i,s,l,f,h,d){let m=s[l+0],p=s[l+1],S=s[l+2],v=s[l+3],g=f[h+0],M=f[h+1],R=f[h+2],C=f[h+3];if(v!==C||m!==g||p!==M||S!==R){let y=m*g+p*M+S*R+v*C;y<0&&(g=-g,M=-M,R=-R,C=-C,y=-y);let x=1-d;if(y<.9995){const D=Math.acos(y),F=Math.sin(D);x=Math.sin(x*D)/F,d=Math.sin(d*D)/F,m=m*x+g*d,p=p*x+M*d,S=S*x+R*d,v=v*x+C*d}else{m=m*x+g*d,p=p*x+M*d,S=S*x+R*d,v=v*x+C*d;const D=1/Math.sqrt(m*m+p*p+S*S+v*v);m*=D,p*=D,S*=D,v*=D}}e[i]=m,e[i+1]=p,e[i+2]=S,e[i+3]=v}static multiplyQuaternionsFlat(e,i,s,l,f,h){const d=s[l],m=s[l+1],p=s[l+2],S=s[l+3],v=f[h],g=f[h+1],M=f[h+2],R=f[h+3];return e[i]=d*R+S*v+m*M-p*g,e[i+1]=m*R+S*g+p*v-d*M,e[i+2]=p*R+S*M+d*g-m*v,e[i+3]=S*R-d*v-m*g-p*M,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,i,s,l){return this._x=e,this._y=i,this._z=s,this._w=l,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,i=!0){const s=e._x,l=e._y,f=e._z,h=e._order,d=Math.cos,m=Math.sin,p=d(s/2),S=d(l/2),v=d(f/2),g=m(s/2),M=m(l/2),R=m(f/2);switch(h){case"XYZ":this._x=g*S*v+p*M*R,this._y=p*M*v-g*S*R,this._z=p*S*R+g*M*v,this._w=p*S*v-g*M*R;break;case"YXZ":this._x=g*S*v+p*M*R,this._y=p*M*v-g*S*R,this._z=p*S*R-g*M*v,this._w=p*S*v+g*M*R;break;case"ZXY":this._x=g*S*v-p*M*R,this._y=p*M*v+g*S*R,this._z=p*S*R+g*M*v,this._w=p*S*v-g*M*R;break;case"ZYX":this._x=g*S*v-p*M*R,this._y=p*M*v+g*S*R,this._z=p*S*R-g*M*v,this._w=p*S*v+g*M*R;break;case"YZX":this._x=g*S*v+p*M*R,this._y=p*M*v+g*S*R,this._z=p*S*R-g*M*v,this._w=p*S*v-g*M*R;break;case"XZY":this._x=g*S*v-p*M*R,this._y=p*M*v-g*S*R,this._z=p*S*R+g*M*v,this._w=p*S*v+g*M*R;break;default:xe("Quaternion: .setFromEuler() encountered an unknown order: "+h)}return i===!0&&this._onChangeCallback(),this}setFromAxisAngle(e,i){const s=i/2,l=Math.sin(s);return this._x=e.x*l,this._y=e.y*l,this._z=e.z*l,this._w=Math.cos(s),this._onChangeCallback(),this}setFromRotationMatrix(e){const i=e.elements,s=i[0],l=i[4],f=i[8],h=i[1],d=i[5],m=i[9],p=i[2],S=i[6],v=i[10],g=s+d+v;if(g>0){const M=.5/Math.sqrt(g+1);this._w=.25/M,this._x=(S-m)*M,this._y=(f-p)*M,this._z=(h-l)*M}else if(s>d&&s>v){const M=2*Math.sqrt(1+s-d-v);this._w=(S-m)/M,this._x=.25*M,this._y=(l+h)/M,this._z=(f+p)/M}else if(d>v){const M=2*Math.sqrt(1+d-s-v);this._w=(f-p)/M,this._x=(l+h)/M,this._y=.25*M,this._z=(m+S)/M}else{const M=2*Math.sqrt(1+v-s-d);this._w=(h-l)/M,this._x=(f+p)/M,this._y=(m+S)/M,this._z=.25*M}return this._onChangeCallback(),this}setFromUnitVectors(e,i){let s=e.dot(i)+1;return s<1e-8?(s=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=s):(this._x=0,this._y=-e.z,this._z=e.y,this._w=s)):(this._x=e.y*i.z-e.z*i.y,this._y=e.z*i.x-e.x*i.z,this._z=e.x*i.y-e.y*i.x,this._w=s),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(Ge(this.dot(e),-1,1)))}rotateTowards(e,i){const s=this.angleTo(e);if(s===0)return this;const l=Math.min(1,i/s);return this.slerp(e,l),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x=this._x*e,this._y=this._y*e,this._z=this._z*e,this._w=this._w*e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,i){const s=e._x,l=e._y,f=e._z,h=e._w,d=i._x,m=i._y,p=i._z,S=i._w;return this._x=s*S+h*d+l*p-f*m,this._y=l*S+h*m+f*d-s*p,this._z=f*S+h*p+s*m-l*d,this._w=h*S-s*d-l*m-f*p,this._onChangeCallback(),this}slerp(e,i){let s=e._x,l=e._y,f=e._z,h=e._w,d=this.dot(e);d<0&&(s=-s,l=-l,f=-f,h=-h,d=-d);let m=1-i;if(d<.9995){const p=Math.acos(d),S=Math.sin(p);m=Math.sin(m*p)/S,i=Math.sin(i*p)/S,this._x=this._x*m+s*i,this._y=this._y*m+l*i,this._z=this._z*m+f*i,this._w=this._w*m+h*i,this._onChangeCallback()}else this._x=this._x*m+s*i,this._y=this._y*m+l*i,this._z=this._z*m+f*i,this._w=this._w*m+h*i,this.normalize();return this}slerpQuaternions(e,i,s){return this.copy(e).slerp(i,s)}random(){const e=2*Math.PI*Math.random(),i=2*Math.PI*Math.random(),s=Math.random(),l=Math.sqrt(1-s),f=Math.sqrt(s);return this.set(l*Math.sin(e),l*Math.cos(e),f*Math.sin(i),f*Math.cos(i))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,i=0){return this._x=e[i],this._y=e[i+1],this._z=e[i+2],this._w=e[i+3],this._onChangeCallback(),this}toArray(e=[],i=0){return e[i]=this._x,e[i+1]=this._y,e[i+2]=this._z,e[i+3]=this._w,e}fromBufferAttribute(e,i){return this._x=e.getX(i),this._y=e.getY(i),this._z=e.getZ(i),this._w=e.getW(i),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}}const Vm=class Vm{constructor(e=0,i=0,s=0){this.x=e,this.y=i,this.z=s}set(e,i,s){return s===void 0&&(s=this.z),this.x=e,this.y=i,this.z=s,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,i){switch(e){case 0:this.x=i;break;case 1:this.y=i;break;case 2:this.z=i;break;default:throw new Error("THREE.Vector3: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("THREE.Vector3: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,i){return this.x=e.x+i.x,this.y=e.y+i.y,this.z=e.z+i.z,this}addScaledVector(e,i){return this.x+=e.x*i,this.y+=e.y*i,this.z+=e.z*i,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,i){return this.x=e.x-i.x,this.y=e.y-i.y,this.z=e.z-i.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,i){return this.x=e.x*i.x,this.y=e.y*i.y,this.z=e.z*i.z,this}applyEuler(e){return this.applyQuaternion(ax.setFromEuler(e))}applyAxisAngle(e,i){return this.applyQuaternion(ax.setFromAxisAngle(e,i))}applyMatrix3(e){const i=this.x,s=this.y,l=this.z,f=e.elements;return this.x=f[0]*i+f[3]*s+f[6]*l,this.y=f[1]*i+f[4]*s+f[7]*l,this.z=f[2]*i+f[5]*s+f[8]*l,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){const i=this.x,s=this.y,l=this.z,f=e.elements,h=1/(f[3]*i+f[7]*s+f[11]*l+f[15]);return this.x=(f[0]*i+f[4]*s+f[8]*l+f[12])*h,this.y=(f[1]*i+f[5]*s+f[9]*l+f[13])*h,this.z=(f[2]*i+f[6]*s+f[10]*l+f[14])*h,this}applyQuaternion(e){const i=this.x,s=this.y,l=this.z,f=e.x,h=e.y,d=e.z,m=e.w,p=2*(h*l-d*s),S=2*(d*i-f*l),v=2*(f*s-h*i);return this.x=i+m*p+h*v-d*S,this.y=s+m*S+d*p-f*v,this.z=l+m*v+f*S-h*p,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){const i=this.x,s=this.y,l=this.z,f=e.elements;return this.x=f[0]*i+f[4]*s+f[8]*l,this.y=f[1]*i+f[5]*s+f[9]*l,this.z=f[2]*i+f[6]*s+f[10]*l,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,i){return this.x=Ge(this.x,e.x,i.x),this.y=Ge(this.y,e.y,i.y),this.z=Ge(this.z,e.z,i.z),this}clampScalar(e,i){return this.x=Ge(this.x,e,i),this.y=Ge(this.y,e,i),this.z=Ge(this.z,e,i),this}clampLength(e,i){const s=this.length();return this.divideScalar(s||1).multiplyScalar(Ge(s,e,i))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,i){return this.x+=(e.x-this.x)*i,this.y+=(e.y-this.y)*i,this.z+=(e.z-this.z)*i,this}lerpVectors(e,i,s){return this.x=e.x+(i.x-e.x)*s,this.y=e.y+(i.y-e.y)*s,this.z=e.z+(i.z-e.z)*s,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,i){const s=e.x,l=e.y,f=e.z,h=i.x,d=i.y,m=i.z;return this.x=l*m-f*d,this.y=f*h-s*m,this.z=s*d-l*h,this}projectOnVector(e){const i=e.lengthSq();if(i===0)return this.set(0,0,0);const s=e.dot(this)/i;return this.copy(e).multiplyScalar(s)}projectOnPlane(e){return Jd.copy(this).projectOnVector(e),this.sub(Jd)}reflect(e){return this.sub(Jd.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){const i=Math.sqrt(this.lengthSq()*e.lengthSq());if(i===0)return Math.PI/2;const s=this.dot(e)/i;return Math.acos(Ge(s,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){const i=this.x-e.x,s=this.y-e.y,l=this.z-e.z;return i*i+s*s+l*l}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,i,s){const l=Math.sin(i)*e;return this.x=l*Math.sin(s),this.y=Math.cos(i)*e,this.z=l*Math.cos(s),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,i,s){return this.x=e*Math.sin(i),this.y=s,this.z=e*Math.cos(i),this}setFromMatrixPosition(e){const i=e.elements;return this.x=i[12],this.y=i[13],this.z=i[14],this}setFromMatrixScale(e){const i=this.setFromMatrixColumn(e,0).length(),s=this.setFromMatrixColumn(e,1).length(),l=this.setFromMatrixColumn(e,2).length();return this.x=i,this.y=s,this.z=l,this}setFromMatrixColumn(e,i){return this.fromArray(e.elements,i*4)}setFromMatrix3Column(e,i){return this.fromArray(e.elements,i*3)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}setFromColor(e){return this.x=e.r,this.y=e.g,this.z=e.b,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,i=0){return this.x=e[i],this.y=e[i+1],this.z=e[i+2],this}toArray(e=[],i=0){return e[i]=this.x,e[i+1]=this.y,e[i+2]=this.z,e}fromBufferAttribute(e,i){return this.x=e.getX(i),this.y=e.getY(i),this.z=e.getZ(i),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){const e=Math.random()*Math.PI*2,i=Math.random()*2-1,s=Math.sqrt(1-i*i);return this.x=s*Math.cos(e),this.y=i,this.z=s*Math.sin(e),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}};Vm.prototype.isVector3=!0;let k=Vm;const Jd=new k,ax=new rr,km=class km{constructor(e,i,s,l,f,h,d,m,p){this.elements=[1,0,0,0,1,0,0,0,1],e!==void 0&&this.set(e,i,s,l,f,h,d,m,p)}set(e,i,s,l,f,h,d,m,p){const S=this.elements;return S[0]=e,S[1]=l,S[2]=d,S[3]=i,S[4]=f,S[5]=m,S[6]=s,S[7]=h,S[8]=p,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){const i=this.elements,s=e.elements;return i[0]=s[0],i[1]=s[1],i[2]=s[2],i[3]=s[3],i[4]=s[4],i[5]=s[5],i[6]=s[6],i[7]=s[7],i[8]=s[8],this}extractBasis(e,i,s){return e.setFromMatrix3Column(this,0),i.setFromMatrix3Column(this,1),s.setFromMatrix3Column(this,2),this}setFromMatrix4(e){const i=e.elements;return this.set(i[0],i[4],i[8],i[1],i[5],i[9],i[2],i[6],i[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,i){const s=e.elements,l=i.elements,f=this.elements,h=s[0],d=s[3],m=s[6],p=s[1],S=s[4],v=s[7],g=s[2],M=s[5],R=s[8],C=l[0],y=l[3],x=l[6],D=l[1],F=l[4],N=l[7],L=l[2],U=l[5],I=l[8];return f[0]=h*C+d*D+m*L,f[3]=h*y+d*F+m*U,f[6]=h*x+d*N+m*I,f[1]=p*C+S*D+v*L,f[4]=p*y+S*F+v*U,f[7]=p*x+S*N+v*I,f[2]=g*C+M*D+R*L,f[5]=g*y+M*F+R*U,f[8]=g*x+M*N+R*I,this}multiplyScalar(e){const i=this.elements;return i[0]*=e,i[3]*=e,i[6]*=e,i[1]*=e,i[4]*=e,i[7]*=e,i[2]*=e,i[5]*=e,i[8]*=e,this}determinant(){const e=this.elements,i=e[0],s=e[1],l=e[2],f=e[3],h=e[4],d=e[5],m=e[6],p=e[7],S=e[8];return i*h*S-i*d*p-s*f*S+s*d*m+l*f*p-l*h*m}invert(){const e=this.elements,i=e[0],s=e[1],l=e[2],f=e[3],h=e[4],d=e[5],m=e[6],p=e[7],S=e[8],v=S*h-d*p,g=d*m-S*f,M=p*f-h*m,R=i*v+s*g+l*M;if(R===0)return this.set(0,0,0,0,0,0,0,0,0);const C=1/R;return e[0]=v*C,e[1]=(l*p-S*s)*C,e[2]=(d*s-l*h)*C,e[3]=g*C,e[4]=(S*i-l*m)*C,e[5]=(l*f-d*i)*C,e[6]=M*C,e[7]=(s*m-p*i)*C,e[8]=(h*i-s*f)*C,this}transpose(){let e;const i=this.elements;return e=i[1],i[1]=i[3],i[3]=e,e=i[2],i[2]=i[6],i[6]=e,e=i[5],i[5]=i[7],i[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){const i=this.elements;return e[0]=i[0],e[1]=i[3],e[2]=i[6],e[3]=i[1],e[4]=i[4],e[5]=i[7],e[6]=i[2],e[7]=i[5],e[8]=i[8],this}setUvTransform(e,i,s,l,f,h,d){const m=Math.cos(f),p=Math.sin(f);return this.set(s*m,s*p,-s*(m*h+p*d)+h+e,-l*p,l*m,-l*(-p*h+m*d)+d+i,0,0,1),this}scale(e,i){return qo("Matrix3: .scale() is deprecated. Use .makeScale() instead."),this.premultiply($d.makeScale(e,i)),this}rotate(e){return qo("Matrix3: .rotate() is deprecated. Use .makeRotation() instead."),this.premultiply($d.makeRotation(-e)),this}translate(e,i){return qo("Matrix3: .translate() is deprecated. Use .makeTranslation() instead."),this.premultiply($d.makeTranslation(e,i)),this}makeTranslation(e,i){return e.isVector2?this.set(1,0,e.x,0,1,e.y,0,0,1):this.set(1,0,e,0,1,i,0,0,1),this}makeRotation(e){const i=Math.cos(e),s=Math.sin(e);return this.set(i,-s,0,s,i,0,0,0,1),this}makeScale(e,i){return this.set(e,0,0,0,i,0,0,0,1),this}equals(e){const i=this.elements,s=e.elements;for(let l=0;l<9;l++)if(i[l]!==s[l])return!1;return!0}fromArray(e,i=0){for(let s=0;s<9;s++)this.elements[s]=e[s+i];return this}toArray(e=[],i=0){const s=this.elements;return e[i]=s[0],e[i+1]=s[1],e[i+2]=s[2],e[i+3]=s[3],e[i+4]=s[4],e[i+5]=s[5],e[i+6]=s[6],e[i+7]=s[7],e[i+8]=s[8],e}clone(){return new this.constructor().fromArray(this.elements)}};km.prototype.isMatrix3=!0;let Te=km;const $d=new Te,sx=new Te().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),rx=new Te().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function bb(){const o={enabled:!0,workingColorSpace:ff,spaces:{},convert:function(l,f,h){return this.enabled===!1||f===h||!f||!h||(this.spaces[f].transfer===cn&&(l.r=Es(l.r),l.g=Es(l.g),l.b=Es(l.b)),this.spaces[f].primaries!==this.spaces[h].primaries&&(l.applyMatrix3(this.spaces[f].toXYZ),l.applyMatrix3(this.spaces[h].fromXYZ)),this.spaces[h].transfer===cn&&(l.r=jo(l.r),l.g=jo(l.g),l.b=jo(l.b))),l},workingToColorSpace:function(l,f){return this.convert(l,this.workingColorSpace,f)},colorSpaceToWorking:function(l,f){return this.convert(l,f,this.workingColorSpace)},getPrimaries:function(l){return this.spaces[l].primaries},getTransfer:function(l){return l===sr?hf:this.spaces[l].transfer},getToneMappingMode:function(l){return this.spaces[l].outputColorSpaceConfig.toneMappingMode||"standard"},getLuminanceCoefficients:function(l,f=this.workingColorSpace){return l.fromArray(this.spaces[f].luminanceCoefficients)},define:function(l){Object.assign(this.spaces,l)},_getMatrix:function(l,f,h){return l.copy(this.spaces[f].toXYZ).multiply(this.spaces[h].fromXYZ)},_getDrawingBufferColorSpace:function(l){return this.spaces[l].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(l=this.workingColorSpace){return this.spaces[l].workingColorSpaceConfig.unpackColorSpace},fromWorkingColorSpace:function(l,f){return qo("ColorManagement: .fromWorkingColorSpace() has been renamed to .workingToColorSpace()."),o.workingToColorSpace(l,f)},toWorkingColorSpace:function(l,f){return qo("ColorManagement: .toWorkingColorSpace() has been renamed to .colorSpaceToWorking()."),o.colorSpaceToWorking(l,f)}},e=[.64,.33,.3,.6,.15,.06],i=[.2126,.7152,.0722],s=[.3127,.329];return o.define({[ff]:{primaries:e,whitePoint:s,transfer:hf,toXYZ:sx,fromXYZ:rx,luminanceCoefficients:i,workingColorSpaceConfig:{unpackColorSpace:da},outputColorSpaceConfig:{drawingBufferColorSpace:da}},[da]:{primaries:e,whitePoint:s,transfer:cn,toXYZ:sx,fromXYZ:rx,luminanceCoefficients:i,outputColorSpaceConfig:{drawingBufferColorSpace:da}}}),o}const qe=bb();function Es(o){return o<.04045?o*.0773993808:Math.pow(o*.9478672986+.0521327014,2.4)}function jo(o){return o<.0031308?o*12.92:1.055*Math.pow(o,.41666)-.055}let No;class Tb{static getDataURL(e,i="image/png"){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>"u")return e.src;let s;if(e instanceof HTMLCanvasElement)s=e;else{No===void 0&&(No=df("canvas")),No.width=e.width,No.height=e.height;const l=No.getContext("2d");e instanceof ImageData?l.putImageData(e,0,0):l.drawImage(e,0,0,e.width,e.height),s=No}return s.toDataURL(i)}static sRGBToLinear(e){if(typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&e instanceof ImageBitmap){const i=df("canvas");i.width=e.width,i.height=e.height;const s=i.getContext("2d");s.drawImage(e,0,0,e.width,e.height);const l=s.getImageData(0,0,e.width,e.height),f=l.data;for(let h=0;h<f.length;h++)f[h]=Es(f[h]/255)*255;return s.putImageData(l,0,0),i}else if(e.data){const i=e.data.slice(0);for(let s=0;s<i.length;s++)i instanceof Uint8Array||i instanceof Uint8ClampedArray?i[s]=Math.floor(Es(i[s]/255)*255):i[s]=Es(i[s]);return{data:i,width:e.width,height:e.height}}else return xe("ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),e}}let Ab=0;class Nm{constructor(e=null){this.isTextureSource=!0,Object.defineProperty(this,"id",{value:Ab++}),this.uuid=lc(),this.data=e,this.dataReady=!0,this.version=0}getSize(e){const i=this.data;return typeof HTMLVideoElement<"u"&&i instanceof HTMLVideoElement?e.set(i.videoWidth,i.videoHeight,0):typeof VideoFrame<"u"&&i instanceof VideoFrame?e.set(i.displayWidth,i.displayHeight,0):i!==null?e.set(i.width,i.height,i.depth||0):e.set(0,0,0),e}set needsUpdate(e){e===!0&&this.version++}toJSON(e){const i=e===void 0||typeof e=="string";if(!i&&e.images[this.uuid]!==void 0)return e.images[this.uuid];const s={uuid:this.uuid,url:""},l=this.data;if(l!==null){let f;if(Array.isArray(l)){f=[];for(let h=0,d=l.length;h<d;h++)l[h].isDataTexture?f.push(tp(l[h].image)):f.push(tp(l[h]))}else f=tp(l);s.url=f}return i||(e.images[this.uuid]=s),s}}function tp(o){return typeof HTMLImageElement<"u"&&o instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&o instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&o instanceof ImageBitmap?Tb.getDataURL(o):o.data?{data:Array.from(o.data),width:o.width,height:o.height,type:o.data.constructor.name}:(xe("Texture: Unable to serialize Texture."),{})}let Rb=0;const ep=new k;class Ti extends lr{constructor(e=Ti.DEFAULT_IMAGE,i=Ti.DEFAULT_MAPPING,s=ys,l=ys,f=hi,h=Gr,d=wa,m=Ji,p=Ti.DEFAULT_ANISOTROPY,S=sr){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:Rb++}),this.uuid=lc(),this.name="",this.source=new Nm(e),this.mipmaps=[],this.mapping=i,this.channel=0,this.wrapS=s,this.wrapT=l,this.magFilter=f,this.minFilter=h,this.anisotropy=p,this.format=d,this.internalFormat=null,this.type=m,this.offset=new ye(0,0),this.repeat=new ye(1,1),this.center=new ye(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new Te,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=S,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.isArrayTexture=!!(e&&e.depth&&e.depth>1),this.pmremVersion=0,this.normalized=!1}get width(){return this.source.getSize(ep).x}get height(){return this.source.getSize(ep).y}get depth(){return this.source.getSize(ep).z}get image(){return this.source.data}set image(e){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}addUpdateRange(e,i){this.updateRanges.push({start:e,count:i})}clearUpdateRanges(){this.updateRanges.length=0}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.channel=e.channel,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.normalized=e.normalized,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.colorSpace=e.colorSpace,this.renderTarget=e.renderTarget,this.isRenderTargetTexture=e.isRenderTargetTexture,this.isArrayTexture=e.isArrayTexture,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}setValues(e){for(const i in e){const s=e[i];if(s===void 0){xe(`Texture.setValues(): parameter '${i}' has value of undefined.`);continue}const l=this[i];if(l===void 0){xe(`Texture.setValues(): property '${i}' does not exist.`);continue}l&&s&&l.isVector2&&s.isVector2||l&&s&&l.isVector3&&s.isVector3||l&&s&&l.isMatrix3&&s.isMatrix3?l.copy(s):this[i]=s}}toJSON(e){const i=e===void 0||typeof e=="string";if(!i&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];const s={metadata:{version:4.7,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,normalized:this.normalized,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(s.userData=this.userData),i||(e.textures[this.uuid]=s),s}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(e){if(this.mapping!==vS)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case Pp:e.x=e.x-Math.floor(e.x);break;case ys:e.x=e.x<0?0:1;break;case Ip:Math.abs(Math.floor(e.x)%2)===1?e.x=Math.ceil(e.x)-e.x:e.x=e.x-Math.floor(e.x);break}if(e.y<0||e.y>1)switch(this.wrapT){case Pp:e.y=e.y-Math.floor(e.y);break;case ys:e.y=e.y<0?0:1;break;case Ip:Math.abs(Math.floor(e.y)%2)===1?e.y=Math.ceil(e.y)-e.y:e.y=e.y-Math.floor(e.y);break}return this.flipY&&(e.y=1-e.y),e}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(e){e===!0&&this.pmremVersion++}}Ti.DEFAULT_IMAGE=null;Ti.DEFAULT_MAPPING=vS;Ti.DEFAULT_ANISOTROPY=1;const Xm=class Xm{constructor(e=0,i=0,s=0,l=1){this.x=e,this.y=i,this.z=s,this.w=l}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,i,s,l){return this.x=e,this.y=i,this.z=s,this.w=l,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,i){switch(e){case 0:this.x=i;break;case 1:this.y=i;break;case 2:this.z=i;break;case 3:this.w=i;break;default:throw new Error("THREE.Vector4: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("THREE.Vector4: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w!==void 0?e.w:1,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,i){return this.x=e.x+i.x,this.y=e.y+i.y,this.z=e.z+i.z,this.w=e.w+i.w,this}addScaledVector(e,i){return this.x+=e.x*i,this.y+=e.y*i,this.z+=e.z*i,this.w+=e.w*i,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,i){return this.x=e.x-i.x,this.y=e.y-i.y,this.z=e.z-i.z,this.w=e.w-i.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){const i=this.x,s=this.y,l=this.z,f=this.w,h=e.elements;return this.x=h[0]*i+h[4]*s+h[8]*l+h[12]*f,this.y=h[1]*i+h[5]*s+h[9]*l+h[13]*f,this.z=h[2]*i+h[6]*s+h[10]*l+h[14]*f,this.w=h[3]*i+h[7]*s+h[11]*l+h[15]*f,this}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this.w/=e.w,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);const i=Math.sqrt(1-e.w*e.w);return i<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/i,this.y=e.y/i,this.z=e.z/i),this}setAxisAngleFromRotationMatrix(e){let i,s,l,f;const m=e.elements,p=m[0],S=m[4],v=m[8],g=m[1],M=m[5],R=m[9],C=m[2],y=m[6],x=m[10];if(Math.abs(S-g)<.01&&Math.abs(v-C)<.01&&Math.abs(R-y)<.01){if(Math.abs(S+g)<.1&&Math.abs(v+C)<.1&&Math.abs(R+y)<.1&&Math.abs(p+M+x-3)<.1)return this.set(1,0,0,0),this;i=Math.PI;const F=(p+1)/2,N=(M+1)/2,L=(x+1)/2,U=(S+g)/4,I=(v+C)/4,T=(R+y)/4;return F>N&&F>L?F<.01?(s=0,l=.707106781,f=.707106781):(s=Math.sqrt(F),l=U/s,f=I/s):N>L?N<.01?(s=.707106781,l=0,f=.707106781):(l=Math.sqrt(N),s=U/l,f=T/l):L<.01?(s=.707106781,l=.707106781,f=0):(f=Math.sqrt(L),s=I/f,l=T/f),this.set(s,l,f,i),this}let D=Math.sqrt((y-R)*(y-R)+(v-C)*(v-C)+(g-S)*(g-S));return Math.abs(D)<.001&&(D=1),this.x=(y-R)/D,this.y=(v-C)/D,this.z=(g-S)/D,this.w=Math.acos((p+M+x-1)/2),this}setFromMatrixPosition(e){const i=e.elements;return this.x=i[12],this.y=i[13],this.z=i[14],this.w=i[15],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,i){return this.x=Ge(this.x,e.x,i.x),this.y=Ge(this.y,e.y,i.y),this.z=Ge(this.z,e.z,i.z),this.w=Ge(this.w,e.w,i.w),this}clampScalar(e,i){return this.x=Ge(this.x,e,i),this.y=Ge(this.y,e,i),this.z=Ge(this.z,e,i),this.w=Ge(this.w,e,i),this}clampLength(e,i){const s=this.length();return this.divideScalar(s||1).multiplyScalar(Ge(s,e,i))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,i){return this.x+=(e.x-this.x)*i,this.y+=(e.y-this.y)*i,this.z+=(e.z-this.z)*i,this.w+=(e.w-this.w)*i,this}lerpVectors(e,i,s){return this.x=e.x+(i.x-e.x)*s,this.y=e.y+(i.y-e.y)*s,this.z=e.z+(i.z-e.z)*s,this.w=e.w+(i.w-e.w)*s,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,i=0){return this.x=e[i],this.y=e[i+1],this.z=e[i+2],this.w=e[i+3],this}toArray(e=[],i=0){return e[i]=this.x,e[i+1]=this.y,e[i+2]=this.z,e[i+3]=this.w,e}fromBufferAttribute(e,i){return this.x=e.getX(i),this.y=e.getY(i),this.z=e.getZ(i),this.w=e.getW(i),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}};Xm.prototype.isVector4=!0;let bn=Xm;class wb extends lr{constructor(e=1,i=1,s={}){super(),s=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:hi,depthBuffer:!0,stencilBuffer:!1,resolveColorBuffer:!0,resolveDepthBuffer:!0,resolveStencilBuffer:!0,storeMultisampledColorBuffer:!0,storeMultisampledDepthBuffer:!0,storeMultisampledStencilBuffer:!0,depthTexture:null,samples:0,count:1,depth:1,multiview:!1,useArrayDepthTexture:!1},s),this.isRenderTarget=!0,this.width=e,this.height=i,this.depth=s.depth,this.scissor=new bn(0,0,e,i),this.scissorTest=!1,this.viewport=new bn(0,0,e,i),this.textures=[];const l={width:e,height:i,depth:s.depth},f=new Ti(l),h=s.count;for(let d=0;d<h;d++)this.textures[d]=f.clone(),this.textures[d].isRenderTargetTexture=!0,this.textures[d].renderTarget=this;this._setTextureOptions(s),this.depthBuffer=s.depthBuffer,this.stencilBuffer=s.stencilBuffer,this.resolveColorBuffer=s.resolveColorBuffer,this.resolveDepthBuffer=s.resolveDepthBuffer,this.resolveStencilBuffer=s.resolveStencilBuffer,this.storeMultisampledColorBuffer=s.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=s.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=s.storeMultisampledStencilBuffer,this._depthTexture=null,this.depthTexture=s.depthTexture,this.samples=s.samples,this.multiview=s.multiview,this.useArrayDepthTexture=s.useArrayDepthTexture}_setTextureOptions(e={}){const i={minFilter:hi,generateMipmaps:!1,flipY:!1,internalFormat:null};e.mapping!==void 0&&(i.mapping=e.mapping),e.wrapS!==void 0&&(i.wrapS=e.wrapS),e.wrapT!==void 0&&(i.wrapT=e.wrapT),e.wrapR!==void 0&&(i.wrapR=e.wrapR),e.magFilter!==void 0&&(i.magFilter=e.magFilter),e.minFilter!==void 0&&(i.minFilter=e.minFilter),e.format!==void 0&&(i.format=e.format),e.type!==void 0&&(i.type=e.type),e.anisotropy!==void 0&&(i.anisotropy=e.anisotropy),e.colorSpace!==void 0&&(i.colorSpace=e.colorSpace),e.flipY!==void 0&&(i.flipY=e.flipY),e.generateMipmaps!==void 0&&(i.generateMipmaps=e.generateMipmaps),e.internalFormat!==void 0&&(i.internalFormat=e.internalFormat);for(let s=0;s<this.textures.length;s++)this.textures[s].setValues(i)}get texture(){return this.textures[0]}set texture(e){this.textures[0]=e}set depthTexture(e){this._depthTexture!==null&&this._depthTexture.renderTarget===this&&(this._depthTexture.renderTarget=null),e!==null&&e.renderTarget===null&&(e.renderTarget=this),this._depthTexture=e}get depthTexture(){return this._depthTexture}setSize(e,i,s=1){if(this.width!==e||this.height!==i||this.depth!==s){this.width=e,this.height=i,this.depth=s;for(let l=0,f=this.textures.length;l<f;l++)this.textures[l].image.width=e,this.textures[l].image.height=i,this.textures[l].image.depth=s,this.textures[l].isData3DTexture!==!0&&(this.textures[l].isArrayTexture=this.textures[l].image.depth>1);this.dispose()}this.viewport.set(0,0,e,i),this.scissor.set(0,0,e,i)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.scissor.copy(e.scissor),this.scissorTest=e.scissorTest,this.viewport.copy(e.viewport),this.textures.length=0;for(let i=0,s=e.textures.length;i<s;i++){this.textures[i]=e.textures[i].clone(),this.textures[i].isRenderTargetTexture=!0,this.textures[i].renderTarget=this;const l=Object.assign({},e.textures[i].image);this.textures[i].source=new Nm(l)}if(this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,this.resolveColorBuffer=e.resolveColorBuffer,this.resolveDepthBuffer=e.resolveDepthBuffer,this.resolveStencilBuffer=e.resolveStencilBuffer,this.storeMultisampledColorBuffer=e.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=e.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=e.storeMultisampledStencilBuffer,e.depthTexture!==null)if(e.depthTexture.renderTarget===e){const i=e.depthTexture.clone();i.renderTarget=null,this.depthTexture=i}else this.depthTexture=e.depthTexture;return this.samples=e.samples,this.multiview=e.multiview,this.useArrayDepthTexture=e.useArrayDepthTexture,this}dispose(){this.dispatchEvent({type:"dispose"})}}class Ca extends wb{constructor(e=1,i=1,s={}){super(e,i,s),this.isWebGLRenderTarget=!0}}class RS extends Ti{constructor(e=null,i=1,s=1,l=1){super(null),this.isDataArrayTexture=!0,this.image={data:e,width:i,height:s,depth:l},this.magFilter=ni,this.minFilter=ni,this.wrapR=ys,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}copy(e){return super.copy(e),this.wrapR=e.wrapR,this}addLayerUpdate(e){this.layerUpdates.add(e)}clearLayerUpdates(){this.layerUpdates.clear()}}class Cb extends Ti{constructor(e=null,i=1,s=1,l=1){super(null),this.isData3DTexture=!0,this.image={data:e,width:i,height:s,depth:l},this.magFilter=ni,this.minFilter=ni,this.wrapR=ys,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}copy(e){return super.copy(e),this.wrapR=e.wrapR,this}}const _f=class _f{constructor(e,i,s,l,f,h,d,m,p,S,v,g,M,R,C,y){this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],e!==void 0&&this.set(e,i,s,l,f,h,d,m,p,S,v,g,M,R,C,y)}set(e,i,s,l,f,h,d,m,p,S,v,g,M,R,C,y){const x=this.elements;return x[0]=e,x[4]=i,x[8]=s,x[12]=l,x[1]=f,x[5]=h,x[9]=d,x[13]=m,x[2]=p,x[6]=S,x[10]=v,x[14]=g,x[3]=M,x[7]=R,x[11]=C,x[15]=y,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new _f().fromArray(this.elements)}copy(e){const i=this.elements,s=e.elements;return i[0]=s[0],i[1]=s[1],i[2]=s[2],i[3]=s[3],i[4]=s[4],i[5]=s[5],i[6]=s[6],i[7]=s[7],i[8]=s[8],i[9]=s[9],i[10]=s[10],i[11]=s[11],i[12]=s[12],i[13]=s[13],i[14]=s[14],i[15]=s[15],this}copyPosition(e){const i=this.elements,s=e.elements;return i[12]=s[12],i[13]=s[13],i[14]=s[14],this}setFromMatrix3(e){const i=e.elements;return this.set(i[0],i[3],i[6],0,i[1],i[4],i[7],0,i[2],i[5],i[8],0,0,0,0,1),this}extractBasis(e,i,s){return this.determinantAffine()===0?(e.set(1,0,0),i.set(0,1,0),s.set(0,0,1),this):(e.setFromMatrixColumn(this,0),i.setFromMatrixColumn(this,1),s.setFromMatrixColumn(this,2),this)}makeBasis(e,i,s){return this.set(e.x,i.x,s.x,0,e.y,i.y,s.y,0,e.z,i.z,s.z,0,0,0,0,1),this}extractRotation(e){if(e.determinantAffine()===0)return this.identity();const i=this.elements,s=e.elements,l=1/Do.setFromMatrixColumn(e,0).length(),f=1/Do.setFromMatrixColumn(e,1).length(),h=1/Do.setFromMatrixColumn(e,2).length();return i[0]=s[0]*l,i[1]=s[1]*l,i[2]=s[2]*l,i[3]=0,i[4]=s[4]*f,i[5]=s[5]*f,i[6]=s[6]*f,i[7]=0,i[8]=s[8]*h,i[9]=s[9]*h,i[10]=s[10]*h,i[11]=0,i[12]=0,i[13]=0,i[14]=0,i[15]=1,this}makeRotationFromEuler(e){const i=this.elements,s=e.x,l=e.y,f=e.z,h=Math.cos(s),d=Math.sin(s),m=Math.cos(l),p=Math.sin(l),S=Math.cos(f),v=Math.sin(f);if(e.order==="XYZ"){const g=h*S,M=h*v,R=d*S,C=d*v;i[0]=m*S,i[4]=-m*v,i[8]=p,i[1]=M+R*p,i[5]=g-C*p,i[9]=-d*m,i[2]=C-g*p,i[6]=R+M*p,i[10]=h*m}else if(e.order==="YXZ"){const g=m*S,M=m*v,R=p*S,C=p*v;i[0]=g+C*d,i[4]=R*d-M,i[8]=h*p,i[1]=h*v,i[5]=h*S,i[9]=-d,i[2]=M*d-R,i[6]=C+g*d,i[10]=h*m}else if(e.order==="ZXY"){const g=m*S,M=m*v,R=p*S,C=p*v;i[0]=g-C*d,i[4]=-h*v,i[8]=R+M*d,i[1]=M+R*d,i[5]=h*S,i[9]=C-g*d,i[2]=-h*p,i[6]=d,i[10]=h*m}else if(e.order==="ZYX"){const g=h*S,M=h*v,R=d*S,C=d*v;i[0]=m*S,i[4]=R*p-M,i[8]=g*p+C,i[1]=m*v,i[5]=C*p+g,i[9]=M*p-R,i[2]=-p,i[6]=d*m,i[10]=h*m}else if(e.order==="YZX"){const g=h*m,M=h*p,R=d*m,C=d*p;i[0]=m*S,i[4]=C-g*v,i[8]=R*v+M,i[1]=v,i[5]=h*S,i[9]=-d*S,i[2]=-p*S,i[6]=M*v+R,i[10]=g-C*v}else if(e.order==="XZY"){const g=h*m,M=h*p,R=d*m,C=d*p;i[0]=m*S,i[4]=-v,i[8]=p*S,i[1]=g*v+C,i[5]=h*S,i[9]=M*v-R,i[2]=R*v-M,i[6]=d*S,i[10]=C*v+g}return i[3]=0,i[7]=0,i[11]=0,i[12]=0,i[13]=0,i[14]=0,i[15]=1,this}makeRotationFromQuaternion(e){return this.compose(Nb,e,Db)}lookAt(e,i,s){const l=this.elements;return Zi.subVectors(e,i),Zi.lengthSq()===0&&(Zi.z=1),Zi.normalize(),tr.crossVectors(s,Zi),tr.lengthSq()===0&&(Math.abs(s.z)===1?Zi.x+=1e-4:Zi.z+=1e-4,Zi.normalize(),tr.crossVectors(s,Zi)),tr.normalize(),Nu.crossVectors(Zi,tr),l[0]=tr.x,l[4]=Nu.x,l[8]=Zi.x,l[1]=tr.y,l[5]=Nu.y,l[9]=Zi.y,l[2]=tr.z,l[6]=Nu.z,l[10]=Zi.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,i){const s=e.elements,l=i.elements,f=this.elements,h=s[0],d=s[4],m=s[8],p=s[12],S=s[1],v=s[5],g=s[9],M=s[13],R=s[2],C=s[6],y=s[10],x=s[14],D=s[3],F=s[7],N=s[11],L=s[15],U=l[0],I=l[4],T=l[8],O=l[12],V=l[1],Z=l[5],J=l[9],lt=l[13],q=l[2],nt=l[6],j=l[10],K=l[14],dt=l[3],ut=l[7],mt=l[11],gt=l[15];return f[0]=h*U+d*V+m*q+p*dt,f[4]=h*I+d*Z+m*nt+p*ut,f[8]=h*T+d*J+m*j+p*mt,f[12]=h*O+d*lt+m*K+p*gt,f[1]=S*U+v*V+g*q+M*dt,f[5]=S*I+v*Z+g*nt+M*ut,f[9]=S*T+v*J+g*j+M*mt,f[13]=S*O+v*lt+g*K+M*gt,f[2]=R*U+C*V+y*q+x*dt,f[6]=R*I+C*Z+y*nt+x*ut,f[10]=R*T+C*J+y*j+x*mt,f[14]=R*O+C*lt+y*K+x*gt,f[3]=D*U+F*V+N*q+L*dt,f[7]=D*I+F*Z+N*nt+L*ut,f[11]=D*T+F*J+N*j+L*mt,f[15]=D*O+F*lt+N*K+L*gt,this}multiplyScalar(e){const i=this.elements;return i[0]*=e,i[4]*=e,i[8]*=e,i[12]*=e,i[1]*=e,i[5]*=e,i[9]*=e,i[13]*=e,i[2]*=e,i[6]*=e,i[10]*=e,i[14]*=e,i[3]*=e,i[7]*=e,i[11]*=e,i[15]*=e,this}determinant(){const e=this.elements,i=e[0],s=e[4],l=e[8],f=e[12],h=e[1],d=e[5],m=e[9],p=e[13],S=e[2],v=e[6],g=e[10],M=e[14],R=e[3],C=e[7],y=e[11],x=e[15],D=m*M-p*g,F=d*M-p*v,N=d*g-m*v,L=h*M-p*S,U=h*g-m*S,I=h*v-d*S;return i*(C*D-y*F+x*N)-s*(R*D-y*L+x*U)+l*(R*F-C*L+x*I)-f*(R*N-C*U+y*I)}determinantAffine(){const e=this.elements,i=e[0],s=e[4],l=e[8],f=e[1],h=e[5],d=e[9],m=e[2],p=e[6],S=e[10];return i*(h*S-d*p)-s*(f*S-d*m)+l*(f*p-h*m)}transpose(){const e=this.elements;let i;return i=e[1],e[1]=e[4],e[4]=i,i=e[2],e[2]=e[8],e[8]=i,i=e[6],e[6]=e[9],e[9]=i,i=e[3],e[3]=e[12],e[12]=i,i=e[7],e[7]=e[13],e[13]=i,i=e[11],e[11]=e[14],e[14]=i,this}setPosition(e,i,s){const l=this.elements;return e.isVector3?(l[12]=e.x,l[13]=e.y,l[14]=e.z):(l[12]=e,l[13]=i,l[14]=s),this}invert(){const e=this.elements,i=e[0],s=e[1],l=e[2],f=e[3],h=e[4],d=e[5],m=e[6],p=e[7],S=e[8],v=e[9],g=e[10],M=e[11],R=e[12],C=e[13],y=e[14],x=e[15],D=i*d-s*h,F=i*m-l*h,N=i*p-f*h,L=s*m-l*d,U=s*p-f*d,I=l*p-f*m,T=S*C-v*R,O=S*y-g*R,V=S*x-M*R,Z=v*y-g*C,J=v*x-M*C,lt=g*x-M*y,q=D*lt-F*J+N*Z+L*V-U*O+I*T;if(q===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);const nt=1/q;return e[0]=(d*lt-m*J+p*Z)*nt,e[1]=(l*J-s*lt-f*Z)*nt,e[2]=(C*I-y*U+x*L)*nt,e[3]=(g*U-v*I-M*L)*nt,e[4]=(m*V-h*lt-p*O)*nt,e[5]=(i*lt-l*V+f*O)*nt,e[6]=(y*N-R*I-x*F)*nt,e[7]=(S*I-g*N+M*F)*nt,e[8]=(h*J-d*V+p*T)*nt,e[9]=(s*V-i*J-f*T)*nt,e[10]=(R*U-C*N+x*D)*nt,e[11]=(v*N-S*U-M*D)*nt,e[12]=(d*O-h*Z-m*T)*nt,e[13]=(i*Z-s*O+l*T)*nt,e[14]=(C*F-R*L-y*D)*nt,e[15]=(S*L-v*F+g*D)*nt,this}scale(e){const i=this.elements,s=e.x,l=e.y,f=e.z;return i[0]*=s,i[4]*=l,i[8]*=f,i[1]*=s,i[5]*=l,i[9]*=f,i[2]*=s,i[6]*=l,i[10]*=f,i[3]*=s,i[7]*=l,i[11]*=f,this}getMaxScaleOnAxis(){const e=this.elements,i=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],s=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],l=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(i,s,l))}makeTranslation(e,i,s){return e.isVector3?this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1):this.set(1,0,0,e,0,1,0,i,0,0,1,s,0,0,0,1),this}makeRotationX(e){const i=Math.cos(e),s=Math.sin(e);return this.set(1,0,0,0,0,i,-s,0,0,s,i,0,0,0,0,1),this}makeRotationY(e){const i=Math.cos(e),s=Math.sin(e);return this.set(i,0,s,0,0,1,0,0,-s,0,i,0,0,0,0,1),this}makeRotationZ(e){const i=Math.cos(e),s=Math.sin(e);return this.set(i,-s,0,0,s,i,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,i){const s=Math.cos(i),l=Math.sin(i),f=1-s,h=e.x,d=e.y,m=e.z,p=f*h,S=f*d;return this.set(p*h+s,p*d-l*m,p*m+l*d,0,p*d+l*m,S*d+s,S*m-l*h,0,p*m-l*d,S*m+l*h,f*m*m+s,0,0,0,0,1),this}makeScale(e,i,s){return this.set(e,0,0,0,0,i,0,0,0,0,s,0,0,0,0,1),this}makeShear(e,i,s,l,f,h){return this.set(1,s,f,0,e,1,h,0,i,l,1,0,0,0,0,1),this}compose(e,i,s){const l=this.elements,f=i._x,h=i._y,d=i._z,m=i._w,p=f+f,S=h+h,v=d+d,g=f*p,M=f*S,R=f*v,C=h*S,y=h*v,x=d*v,D=m*p,F=m*S,N=m*v,L=s.x,U=s.y,I=s.z;return l[0]=(1-(C+x))*L,l[1]=(M+N)*L,l[2]=(R-F)*L,l[3]=0,l[4]=(M-N)*U,l[5]=(1-(g+x))*U,l[6]=(y+D)*U,l[7]=0,l[8]=(R+F)*I,l[9]=(y-D)*I,l[10]=(1-(g+C))*I,l[11]=0,l[12]=e.x,l[13]=e.y,l[14]=e.z,l[15]=1,this}decompose(e,i,s){const l=this.elements;e.x=l[12],e.y=l[13],e.z=l[14];const f=this.determinantAffine();if(f===0)return s.set(1,1,1),i.identity(),this;let h=Do.set(l[0],l[1],l[2]).length();const d=Do.set(l[4],l[5],l[6]).length(),m=Do.set(l[8],l[9],l[10]).length();f<0&&(h=-h),Ta.copy(this);const p=1/h,S=1/d,v=1/m;return Ta.elements[0]*=p,Ta.elements[1]*=p,Ta.elements[2]*=p,Ta.elements[4]*=S,Ta.elements[5]*=S,Ta.elements[6]*=S,Ta.elements[8]*=v,Ta.elements[9]*=v,Ta.elements[10]*=v,i.setFromRotationMatrix(Ta),s.x=h,s.y=d,s.z=m,this}makePerspective(e,i,s,l,f,h,d=Za,m=!1){const p=this.elements,S=2*f/(i-e),v=2*f/(s-l),g=(i+e)/(i-e),M=(s+l)/(s-l);let R,C;if(m)R=f/(h-f),C=h*f/(h-f);else if(d===Za)R=-(h+f)/(h-f),C=-2*h*f/(h-f);else if(d===sc)R=-h/(h-f),C=-h*f/(h-f);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+d);return p[0]=S,p[4]=0,p[8]=g,p[12]=0,p[1]=0,p[5]=v,p[9]=M,p[13]=0,p[2]=0,p[6]=0,p[10]=R,p[14]=C,p[3]=0,p[7]=0,p[11]=-1,p[15]=0,this}makeOrthographic(e,i,s,l,f,h,d=Za,m=!1){const p=this.elements,S=2/(i-e),v=2/(s-l),g=-(i+e)/(i-e),M=-(s+l)/(s-l);let R,C;if(m)R=1/(h-f),C=h/(h-f);else if(d===Za)R=-2/(h-f),C=-(h+f)/(h-f);else if(d===sc)R=-1/(h-f),C=-f/(h-f);else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+d);return p[0]=S,p[4]=0,p[8]=0,p[12]=g,p[1]=0,p[5]=v,p[9]=0,p[13]=M,p[2]=0,p[6]=0,p[10]=R,p[14]=C,p[3]=0,p[7]=0,p[11]=0,p[15]=1,this}equals(e){const i=this.elements,s=e.elements;for(let l=0;l<16;l++)if(i[l]!==s[l])return!1;return!0}fromArray(e,i=0){for(let s=0;s<16;s++)this.elements[s]=e[s+i];return this}toArray(e=[],i=0){const s=this.elements;return e[i]=s[0],e[i+1]=s[1],e[i+2]=s[2],e[i+3]=s[3],e[i+4]=s[4],e[i+5]=s[5],e[i+6]=s[6],e[i+7]=s[7],e[i+8]=s[8],e[i+9]=s[9],e[i+10]=s[10],e[i+11]=s[11],e[i+12]=s[12],e[i+13]=s[13],e[i+14]=s[14],e[i+15]=s[15],e}};_f.prototype.isMatrix4=!0;let yn=_f;const Do=new k,Ta=new yn,Nb=new k(0,0,0),Db=new k(1,1,1),tr=new k,Nu=new k,Zi=new k,ox=new yn,lx=new rr;class or{constructor(e=0,i=0,s=0,l=or.DEFAULT_ORDER){this.isEuler=!0,this._x=e,this._y=i,this._z=s,this._order=l}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,i,s,l=this._order){return this._x=e,this._y=i,this._z=s,this._order=l,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,i=this._order,s=!0){const l=e.elements,f=l[0],h=l[4],d=l[8],m=l[1],p=l[5],S=l[9],v=l[2],g=l[6],M=l[10];switch(i){case"XYZ":this._y=Math.asin(Ge(d,-1,1)),Math.abs(d)<.9999999?(this._x=Math.atan2(-S,M),this._z=Math.atan2(-h,f)):(this._x=Math.atan2(g,p),this._z=0);break;case"YXZ":this._x=Math.asin(-Ge(S,-1,1)),Math.abs(S)<.9999999?(this._y=Math.atan2(d,M),this._z=Math.atan2(m,p)):(this._y=Math.atan2(-v,f),this._z=0);break;case"ZXY":this._x=Math.asin(Ge(g,-1,1)),Math.abs(g)<.9999999?(this._y=Math.atan2(-v,M),this._z=Math.atan2(-h,p)):(this._y=0,this._z=Math.atan2(m,f));break;case"ZYX":this._y=Math.asin(-Ge(v,-1,1)),Math.abs(v)<.9999999?(this._x=Math.atan2(g,M),this._z=Math.atan2(m,f)):(this._x=0,this._z=Math.atan2(-h,p));break;case"YZX":this._z=Math.asin(Ge(m,-1,1)),Math.abs(m)<.9999999?(this._x=Math.atan2(-S,p),this._y=Math.atan2(-v,f)):(this._x=0,this._y=Math.atan2(d,M));break;case"XZY":this._z=Math.asin(-Ge(h,-1,1)),Math.abs(h)<.9999999?(this._x=Math.atan2(g,p),this._y=Math.atan2(d,f)):(this._x=Math.atan2(-S,M),this._y=0);break;default:xe("Euler: .setFromRotationMatrix() encountered an unknown order: "+i)}return this._order=i,s===!0&&this._onChangeCallback(),this}setFromQuaternion(e,i,s){return ox.makeRotationFromQuaternion(e),this.setFromRotationMatrix(ox,i,s)}setFromVector3(e,i=this._order){return this.set(e.x,e.y,e.z,i)}reorder(e){return lx.setFromEuler(this),this.setFromQuaternion(lx,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],i=0){return e[i]=this._x,e[i+1]=this._y,e[i+2]=this._z,e[i+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}}or.DEFAULT_ORDER="XYZ";class Dm{constructor(){this.mask=1}set(e){this.mask=(1<<e|0)>>>0}enable(e){this.mask|=1<<e|0}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e|0}disable(e){this.mask&=~(1<<e|0)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!==0}isEnabled(e){return(this.mask&(1<<e|0))!==0}}let Ub=0;const cx=new k,Uo=new rr,ms=new yn,Du=new k,kl=new k,Lb=new k,Ob=new rr,ux=new k(1,0,0),fx=new k(0,1,0),hx=new k(0,0,1),dx={type:"added"},Pb={type:"removed"},Lo={type:"childadded",child:null},np={type:"childremoved",child:null};class qn extends lr{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:Ub++}),this.uuid=lc(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=qn.DEFAULT_UP.clone();const e=new k,i=new or,s=new rr,l=new k(1,1,1);function f(){s.setFromEuler(i,!1)}function h(){i.setFromQuaternion(s,void 0,!1)}i._onChange(f),s._onChange(h),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:e},rotation:{configurable:!0,enumerable:!0,value:i},quaternion:{configurable:!0,enumerable:!0,value:s},scale:{configurable:!0,enumerable:!0,value:l},modelViewMatrix:{value:new yn},normalMatrix:{value:new Te}}),this.matrix=new yn,this.matrixWorld=new yn,this.matrixAutoUpdate=qn.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=qn.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new Dm,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.static=!1,this.userData={},this.pivot=null}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,i){this.quaternion.setFromAxisAngle(e,i)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,i){return Uo.setFromAxisAngle(e,i),this.quaternion.multiply(Uo),this}rotateOnWorldAxis(e,i){return Uo.setFromAxisAngle(e,i),this.quaternion.premultiply(Uo),this}rotateX(e){return this.rotateOnAxis(ux,e)}rotateY(e){return this.rotateOnAxis(fx,e)}rotateZ(e){return this.rotateOnAxis(hx,e)}translateOnAxis(e,i){return cx.copy(e).applyQuaternion(this.quaternion),this.position.add(cx.multiplyScalar(i)),this}translateX(e){return this.translateOnAxis(ux,e)}translateY(e){return this.translateOnAxis(fx,e)}translateZ(e){return this.translateOnAxis(hx,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(ms.copy(this.matrixWorld).invert())}lookAt(e,i,s){e.isVector3?Du.copy(e):Du.set(e,i,s);const l=this.parent;this.updateWorldMatrix(!0,!1),kl.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?ms.lookAt(kl,Du,this.up):ms.lookAt(Du,kl,this.up),this.quaternion.setFromRotationMatrix(ms),l&&(ms.extractRotation(l.matrixWorld),Uo.setFromRotationMatrix(ms),this.quaternion.premultiply(Uo.invert()))}add(e){if(arguments.length>1){for(let i=0;i<arguments.length;i++)this.add(arguments[i]);return this}return e===this?(Je("Object3D.add: object can't be added as a child of itself.",e),this):(e&&e.isObject3D?(e.removeFromParent(),e.parent=this,this.children.push(e),e.dispatchEvent(dx),Lo.child=e,this.dispatchEvent(Lo),Lo.child=null):Je("Object3D.add: object not an instance of THREE.Object3D.",e),this)}remove(e){if(arguments.length>1){for(let s=0;s<arguments.length;s++)this.remove(arguments[s]);return this}const i=this.children.indexOf(e);return i!==-1&&(e.parent=null,this.children.splice(i,1),e.dispatchEvent(Pb),np.child=e,this.dispatchEvent(np),np.child=null),this}removeFromParent(){const e=this.parent;return e!==null&&e.remove(this),this}clear(){return this.remove(...this.children)}attach(e){return this.updateWorldMatrix(!0,!1),ms.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),ms.multiply(e.parent.matrixWorld)),e.applyMatrix4(ms),e.removeFromParent(),e.parent=this,this.children.push(e),e.updateWorldMatrix(!1,!0),e.dispatchEvent(dx),Lo.child=e,this.dispatchEvent(Lo),Lo.child=null,this}getObjectById(e){return this.getObjectByProperty("id",e)}getObjectByName(e){return this.getObjectByProperty("name",e)}getObjectByProperty(e,i){if(this[e]===i)return this;for(let s=0,l=this.children.length;s<l;s++){const h=this.children[s].getObjectByProperty(e,i);if(h!==void 0)return h}}getObjectsByProperty(e,i,s=[]){this[e]===i&&s.push(this);const l=this.children;for(let f=0,h=l.length;f<h;f++)l[f].getObjectsByProperty(e,i,s);return s}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(kl,e,Lb),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(kl,Ob,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);const i=this.matrixWorld.elements;return e.set(i[8],i[9],i[10]).normalize()}raycast(){}intersectsFrustum(){}traverse(e){e(this);const i=this.children;for(let s=0,l=i.length;s<l;s++)i[s].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);const i=this.children;for(let s=0,l=i.length;s<l;s++)i[s].traverseVisible(e)}traverseAncestors(e){const i=this.parent;i!==null&&(e(i),i.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale);const e=this.pivot;if(e!==null){const i=e.x,s=e.y,l=e.z,f=this.matrix.elements;f[12]+=i-f[0]*i-f[4]*s-f[8]*l,f[13]+=s-f[1]*i-f[5]*s-f[9]*l,f[14]+=l-f[2]*i-f[6]*s-f[10]*l}this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,e=!0);const i=this.children;for(let s=0,l=i.length;s<l;s++)i[s].updateMatrixWorld(e)}updateWorldMatrix(e,i,s=!1){const l=this.parent;if(e===!0&&l!==null&&l.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||s)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,s=!0),i===!0){const f=this.children;for(let h=0,d=f.length;h<d;h++)f[h].updateWorldMatrix(!1,!0,s)}}toJSON(e){const i=e===void 0||typeof e=="string",s={};i&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},s.metadata={version:4.7,type:"Object",generator:"Object3D.toJSON"});const l={};l.uuid=this.uuid,l.type=this.type,l.name=this.name,l.castShadow=this.castShadow,l.receiveShadow=this.receiveShadow,l.visible=this.visible,l.frustumCulled=this.frustumCulled,l.renderOrder=this.renderOrder,l.static=this.static,l.matrixAutoUpdate=this.matrixAutoUpdate,Object.keys(this.userData).length>0&&(l.userData=this.userData),l.layers=this.layers.mask,l.matrix=this.matrix.toArray(),l.up=this.up.toArray(),this.pivot!==null&&(l.pivot=this.pivot.toArray()),this.morphTargetDictionary!==void 0&&(l.morphTargetDictionary=Object.assign({},this.morphTargetDictionary)),this.morphTargetInfluences!==void 0&&(l.morphTargetInfluences=this.morphTargetInfluences.slice()),this.isInstancedMesh&&(l.type="InstancedMesh",l.count=this.count,l.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(l.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(l.type="BatchedMesh",l.perObjectFrustumCulled=this.perObjectFrustumCulled,l.sortObjects=this.sortObjects,l.drawRanges=this._drawRanges,l.reservedRanges=this._reservedRanges,l.geometryInfo=this._geometryInfo.map(d=>({...d,boundingBox:d.boundingBox?d.boundingBox.toJSON():void 0,boundingSphere:d.boundingSphere?d.boundingSphere.toJSON():void 0})),l.instanceInfo=this._instanceInfo.map(d=>({...d})),l.availableInstanceIds=this._availableInstanceIds.slice(),l.availableGeometryIds=this._availableGeometryIds.slice(),l.nextIndexStart=this._nextIndexStart,l.nextVertexStart=this._nextVertexStart,l.geometryCount=this._geometryCount,l.maxInstanceCount=this._maxInstanceCount,l.maxVertexCount=this._maxVertexCount,l.maxIndexCount=this._maxIndexCount,l.geometryInitialized=this._geometryInitialized,l.matricesTexture=this._matricesTexture.toJSON(e),l.indirectTexture=this._indirectTexture.toJSON(e),this._colorsTexture!==null&&(l.colorsTexture=this._colorsTexture.toJSON(e)),this.boundingSphere!==null&&(l.boundingSphere=this.boundingSphere.toJSON()),this.boundingBox!==null&&(l.boundingBox=this.boundingBox.toJSON()));function f(d,m){return d[m.uuid]===void 0&&(d[m.uuid]=m.toJSON(e)),m.uuid}if(this.isScene)this.background&&(this.background.isColor?l.background=this.background.toJSON():this.background.isTexture&&(l.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(l.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){l.geometry=f(e.geometries,this.geometry);const d=this.geometry.parameters;if(d!==void 0&&d.shapes!==void 0){const m=d.shapes;if(Array.isArray(m))for(let p=0,S=m.length;p<S;p++){const v=m[p];f(e.shapes,v)}else f(e.shapes,m)}}if(this.isSkinnedMesh&&(l.bindMode=this.bindMode,l.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(f(e.skeletons,this.skeleton),l.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){const d=[];for(let m=0,p=this.material.length;m<p;m++)d.push(f(e.materials,this.material[m]));l.material=d}else l.material=f(e.materials,this.material);if(this.children.length>0){l.children=[];for(let d=0;d<this.children.length;d++)l.children.push(this.children[d].toJSON(e).object)}if(this.animations.length>0){l.animations=[];for(let d=0;d<this.animations.length;d++){const m=this.animations[d];l.animations.push(f(e.animations,m))}}if(i){const d=h(e.geometries),m=h(e.materials),p=h(e.textures),S=h(e.images),v=h(e.shapes),g=h(e.skeletons),M=h(e.animations),R=h(e.nodes);d.length>0&&(s.geometries=d),m.length>0&&(s.materials=m),p.length>0&&(s.textures=p),S.length>0&&(s.images=S),v.length>0&&(s.shapes=v),g.length>0&&(s.skeletons=g),M.length>0&&(s.animations=M),R.length>0&&(s.nodes=R)}return s.object=l,s;function h(d){const m=[];for(const p in d){const S=d[p];delete S.metadata,m.push(S)}return m}}clone(e){return new this.constructor().copy(this,e)}copy(e,i=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.pivot=e.pivot!==null?e.pivot.clone():null,this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.static=e.static,this.animations=e.animations.slice(),this.userData=JSON.parse(JSON.stringify(e.userData)),i===!0)for(let s=0;s<e.children.length;s++){const l=e.children[s];this.add(l.clone())}return this}dispose(){this.dispatchEvent({type:"dispose"})}}qn.DEFAULT_UP=new k(0,1,0);qn.DEFAULT_MATRIX_AUTO_UPDATE=!0;qn.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;class Ei extends qn{constructor(){super(),this.isGroup=!0,this.type="Group"}}const Ib={type:"move"};class ip{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new Ei,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new Ei,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new k,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new k),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new Ei,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new k,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new k,this._grip.eventsEnabled=!1),this._grip}dispatchEvent(e){return this._targetRay!==null&&this._targetRay.dispatchEvent(e),this._grip!==null&&this._grip.dispatchEvent(e),this._hand!==null&&this._hand.dispatchEvent(e),this}connect(e){if(e&&e.hand){const i=this._hand;if(i)for(const s of e.hand.values())this._getHandJoint(i,s)}return this.dispatchEvent({type:"connected",data:e}),this}disconnect(e){return this.dispatchEvent({type:"disconnected",data:e}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(e,i,s){let l=null,f=null,h=null;const d=this._targetRay,m=this._grip,p=this._hand;if(e&&i.session.visibilityState!=="visible-blurred"){if(p&&e.hand){h=!0;for(const C of e.hand.values()){const y=i.getJointPose(C,s),x=this._getHandJoint(p,C);y!==null&&(x.matrix.fromArray(y.transform.matrix),x.matrix.decompose(x.position,x.rotation,x.scale),x.matrixWorldNeedsUpdate=!0,x.jointRadius=y.radius),x.visible=y!==null}const S=p.joints["index-finger-tip"],v=p.joints["thumb-tip"],g=S.position.distanceTo(v.position),M=.02,R=.005;p.inputState.pinching&&g>M+R?(p.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:e.handedness,target:this})):!p.inputState.pinching&&g<=M-R&&(p.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:e.handedness,target:this}))}else m!==null&&e.gripSpace&&(f=i.getPose(e.gripSpace,s),f!==null&&(m.matrix.fromArray(f.transform.matrix),m.matrix.decompose(m.position,m.rotation,m.scale),m.matrixWorldNeedsUpdate=!0,f.linearVelocity?(m.hasLinearVelocity=!0,m.linearVelocity.copy(f.linearVelocity)):m.hasLinearVelocity=!1,f.angularVelocity?(m.hasAngularVelocity=!0,m.angularVelocity.copy(f.angularVelocity)):m.hasAngularVelocity=!1,m.eventsEnabled&&m.dispatchEvent({type:"gripUpdated",data:e,target:this})));d!==null&&(l=i.getPose(e.targetRaySpace,s),l===null&&f!==null&&(l=f),l!==null&&(d.matrix.fromArray(l.transform.matrix),d.matrix.decompose(d.position,d.rotation,d.scale),d.matrixWorldNeedsUpdate=!0,l.linearVelocity?(d.hasLinearVelocity=!0,d.linearVelocity.copy(l.linearVelocity)):d.hasLinearVelocity=!1,l.angularVelocity?(d.hasAngularVelocity=!0,d.angularVelocity.copy(l.angularVelocity)):d.hasAngularVelocity=!1,this.dispatchEvent(Ib)))}return d!==null&&(d.visible=l!==null),m!==null&&(m.visible=f!==null),p!==null&&(p.visible=h!==null),this}_getHandJoint(e,i){if(e.joints[i.jointName]===void 0){const s=new Ei;s.matrixAutoUpdate=!1,s.visible=!1,e.joints[i.jointName]=s,e.add(s)}return e.joints[i.jointName]}}const wS={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},er={h:0,s:0,l:0},Uu={h:0,s:0,l:0};function ap(o,e,i){return i<0&&(i+=1),i>1&&(i-=1),i<1/6?o+(e-o)*6*i:i<1/2?e:i<2/3?o+(e-o)*6*(2/3-i):o}class We{constructor(e,i,s){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(e,i,s)}set(e,i,s){if(i===void 0&&s===void 0){const l=e;l&&l.isColor?this.copy(l):typeof l=="number"?this.setHex(l):typeof l=="string"&&this.setStyle(l)}else this.setRGB(e,i,s);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,i=da){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(e&255)/255,qe.colorSpaceToWorking(this,i),this}setRGB(e,i,s,l=qe.workingColorSpace){return this.r=e,this.g=i,this.b=s,qe.colorSpaceToWorking(this,l),this}setHSL(e,i,s,l=qe.workingColorSpace){if(e=Mb(e,1),i=Ge(i,0,1),s=Ge(s,0,1),i===0)this.r=this.g=this.b=s;else{const f=s<=.5?s*(1+i):s+i-s*i,h=2*s-f;this.r=ap(h,f,e+1/3),this.g=ap(h,f,e),this.b=ap(h,f,e-1/3)}return qe.colorSpaceToWorking(this,l),this}setStyle(e,i=da){function s(f){f!==void 0&&parseFloat(f)<1&&xe("Color: Alpha component of "+e+" will be ignored.")}let l;if(l=/^(\w+)\(([^\)]*)\)/.exec(e)){let f;const h=l[1],d=l[2];switch(h){case"rgb":case"rgba":if(f=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(d))return s(f[4]),this.setRGB(Math.min(255,parseInt(f[1],10))/255,Math.min(255,parseInt(f[2],10))/255,Math.min(255,parseInt(f[3],10))/255,i);if(f=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(d))return s(f[4]),this.setRGB(Math.min(100,parseInt(f[1],10))/100,Math.min(100,parseInt(f[2],10))/100,Math.min(100,parseInt(f[3],10))/100,i);break;case"hsl":case"hsla":if(f=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(d))return s(f[4]),this.setHSL(parseFloat(f[1])/360,parseFloat(f[2])/100,parseFloat(f[3])/100,i);break;default:xe("Color: Unknown color model "+e)}}else if(l=/^\#([A-Fa-f\d]+)$/.exec(e)){const f=l[1],h=f.length;if(h===3)return this.setRGB(parseInt(f.charAt(0),16)/15,parseInt(f.charAt(1),16)/15,parseInt(f.charAt(2),16)/15,i);if(h===6)return this.setHex(parseInt(f,16),i);xe("Color: Invalid hex color "+e)}else if(e&&e.length>0)return this.setColorName(e,i);return this}setColorName(e,i=da){const s=wS[e.toLowerCase()];return s!==void 0?this.setHex(s,i):xe("Color: Unknown color "+e),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=Es(e.r),this.g=Es(e.g),this.b=Es(e.b),this}copyLinearToSRGB(e){return this.r=jo(e.r),this.g=jo(e.g),this.b=jo(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=da){return qe.workingToColorSpace(fi.copy(this),e),Math.round(Ge(fi.r*255,0,255))*65536+Math.round(Ge(fi.g*255,0,255))*256+Math.round(Ge(fi.b*255,0,255))}getHexString(e=da){return("000000"+this.getHex(e).toString(16)).slice(-6)}getHSL(e,i=qe.workingColorSpace){qe.workingToColorSpace(fi.copy(this),i);const s=fi.r,l=fi.g,f=fi.b,h=Math.max(s,l,f),d=Math.min(s,l,f);let m,p;const S=(d+h)/2;if(d===h)m=0,p=0;else{const v=h-d;switch(p=S<=.5?v/(h+d):v/(2-h-d),h){case s:m=(l-f)/v+(l<f?6:0);break;case l:m=(f-s)/v+2;break;case f:m=(s-l)/v+4;break}m/=6}return e.h=m,e.s=p,e.l=S,e}getRGB(e,i=qe.workingColorSpace){return qe.workingToColorSpace(fi.copy(this),i),e.r=fi.r,e.g=fi.g,e.b=fi.b,e}getStyle(e=da){qe.workingToColorSpace(fi.copy(this),e);const i=fi.r,s=fi.g,l=fi.b;return e!==da?`color(${e} ${i.toFixed(3)} ${s.toFixed(3)} ${l.toFixed(3)})`:`rgb(${Math.round(i*255)},${Math.round(s*255)},${Math.round(l*255)})`}offsetHSL(e,i,s){return this.getHSL(er),this.setHSL(er.h+e,er.s+i,er.l+s)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,i){return this.r=e.r+i.r,this.g=e.g+i.g,this.b=e.b+i.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,i){return this.r+=(e.r-this.r)*i,this.g+=(e.g-this.g)*i,this.b+=(e.b-this.b)*i,this}lerpColors(e,i,s){return this.r=e.r+(i.r-e.r)*s,this.g=e.g+(i.g-e.g)*s,this.b=e.b+(i.b-e.b)*s,this}lerpHSL(e,i){this.getHSL(er),e.getHSL(Uu);const s=Qd(er.h,Uu.h,i),l=Qd(er.s,Uu.s,i),f=Qd(er.l,Uu.l,i);return this.setHSL(s,l,f),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){const i=this.r,s=this.g,l=this.b,f=e.elements;return this.r=f[0]*i+f[3]*s+f[6]*l,this.g=f[1]*i+f[4]*s+f[7]*l,this.b=f[2]*i+f[5]*s+f[8]*l,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,i=0){return this.r=e[i],this.g=e[i+1],this.b=e[i+2],this}toArray(e=[],i=0){return e[i]=this.r,e[i+1]=this.g,e[i+2]=this.b,e}fromBufferAttribute(e,i){return this.r=e.getX(i),this.g=e.getY(i),this.b=e.getZ(i),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}}const fi=new We;We.NAMES=wS;class Um{constructor(e,i=1,s=1e3){this.isFog=!0,this.name="",this.color=new We(e),this.near=i,this.far=s}clone(){return new Um(this.color,this.near,this.far)}toJSON(){return{type:"Fog",name:this.name,color:this.color.getHex(),near:this.near,far:this.far}}}class zb extends qn{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new or,this.environmentIntensity=1,this.environmentRotation=new or,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(e,i){return super.copy(e,i),e.background!==null&&(this.background=e.background.clone()),e.environment!==null&&(this.environment=e.environment.clone()),e.fog!==null&&(this.fog=e.fog.clone()),this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,this.backgroundRotation.copy(e.backgroundRotation),this.environmentIntensity=e.environmentIntensity,this.environmentRotation.copy(e.environmentRotation),e.overrideMaterial!==null&&(this.overrideMaterial=e.overrideMaterial.clone()),this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){const i=super.toJSON(e);return this.fog!==null&&(i.object.fog=this.fog.toJSON()),i.object.backgroundBlurriness=this.backgroundBlurriness,i.object.backgroundIntensity=this.backgroundIntensity,i.object.backgroundRotation=this.backgroundRotation.toArray(),i.object.environmentIntensity=this.environmentIntensity,i.object.environmentRotation=this.environmentRotation.toArray(),i}}const Aa=new k,gs=new k,sp=new k,_s=new k,Oo=new k,Po=new k,px=new k,rp=new k,op=new k,lp=new k,cp=new bn,up=new bn,fp=new bn;class pa{constructor(e=new k,i=new k,s=new k){this.a=e,this.b=i,this.c=s}static getNormal(e,i,s,l){l.subVectors(s,i),Aa.subVectors(e,i),l.cross(Aa);const f=l.lengthSq();return f>0?l.multiplyScalar(1/Math.sqrt(f)):l.set(0,0,0)}static getBarycoord(e,i,s,l,f){Aa.subVectors(l,i),gs.subVectors(s,i),sp.subVectors(e,i);const h=Aa.dot(Aa),d=Aa.dot(gs),m=Aa.dot(sp),p=gs.dot(gs),S=gs.dot(sp),v=h*p-d*d;if(v===0)return f.set(0,0,0),null;const g=1/v,M=(p*m-d*S)*g,R=(h*S-d*m)*g;return f.set(1-M-R,R,M)}static containsPoint(e,i,s,l){return this.getBarycoord(e,i,s,l,_s)===null?!1:_s.x>=0&&_s.y>=0&&_s.x+_s.y<=1}static getInterpolation(e,i,s,l,f,h,d,m){return this.getBarycoord(e,i,s,l,_s)===null?(m.x=0,m.y=0,"z"in m&&(m.z=0),"w"in m&&(m.w=0),null):(m.setScalar(0),m.addScaledVector(f,_s.x),m.addScaledVector(h,_s.y),m.addScaledVector(d,_s.z),m)}static getInterpolatedAttribute(e,i,s,l,f,h){return cp.setScalar(0),up.setScalar(0),fp.setScalar(0),cp.fromBufferAttribute(e,i),up.fromBufferAttribute(e,s),fp.fromBufferAttribute(e,l),h.setScalar(0),h.addScaledVector(cp,f.x),h.addScaledVector(up,f.y),h.addScaledVector(fp,f.z),h}static isFrontFacing(e,i,s,l){return Aa.subVectors(s,i),gs.subVectors(e,i),Aa.cross(gs).dot(l)<0}set(e,i,s){return this.a.copy(e),this.b.copy(i),this.c.copy(s),this}setFromPointsAndIndices(e,i,s,l){return this.a.copy(e[i]),this.b.copy(e[s]),this.c.copy(e[l]),this}setFromAttributeAndIndices(e,i,s,l){return this.a.fromBufferAttribute(e,i),this.b.fromBufferAttribute(e,s),this.c.fromBufferAttribute(e,l),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return Aa.subVectors(this.c,this.b),gs.subVectors(this.a,this.b),Aa.cross(gs).length()*.5}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(e){return pa.getNormal(this.a,this.b,this.c,e)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(e,i){return pa.getBarycoord(e,this.a,this.b,this.c,i)}getInterpolation(e,i,s,l,f){return pa.getInterpolation(e,this.a,this.b,this.c,i,s,l,f)}containsPoint(e){return pa.containsPoint(e,this.a,this.b,this.c)}isFrontFacing(e){return pa.isFrontFacing(this.a,this.b,this.c,e)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,i){const s=this.a,l=this.b,f=this.c;let h,d;Oo.subVectors(l,s),Po.subVectors(f,s),rp.subVectors(e,s);const m=Oo.dot(rp),p=Po.dot(rp);if(m<=0&&p<=0)return i.copy(s);op.subVectors(e,l);const S=Oo.dot(op),v=Po.dot(op);if(S>=0&&v<=S)return i.copy(l);const g=m*v-S*p;if(g<=0&&m>=0&&S<=0)return h=m/(m-S),i.copy(s).addScaledVector(Oo,h);lp.subVectors(e,f);const M=Oo.dot(lp),R=Po.dot(lp);if(R>=0&&M<=R)return i.copy(f);const C=M*p-m*R;if(C<=0&&p>=0&&R<=0)return d=p/(p-R),i.copy(s).addScaledVector(Po,d);const y=S*R-M*v;if(y<=0&&v-S>=0&&M-R>=0)return px.subVectors(f,l),d=(v-S)/(v-S+(M-R)),i.copy(l).addScaledVector(px,d);const x=1/(y+C+g);return h=C*x,d=g*x,i.copy(s).addScaledVector(Oo,h).addScaledVector(Po,d)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}}class cc{constructor(e=new k(1/0,1/0,1/0),i=new k(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=i}set(e,i){return this.min.copy(e),this.max.copy(i),this}setFromArray(e){this.makeEmpty();for(let i=0,s=e.length;i<s;i+=3)this.expandByPoint(Ra.fromArray(e,i));return this}setFromBufferAttribute(e){this.makeEmpty();for(let i=0,s=e.count;i<s;i++)this.expandByPoint(Ra.fromBufferAttribute(e,i));return this}setFromPoints(e){this.makeEmpty();for(let i=0,s=e.length;i<s;i++)this.expandByPoint(e[i]);return this}setFromCenterAndSize(e,i){const s=Ra.copy(i).multiplyScalar(.5);return this.min.copy(e).sub(s),this.max.copy(e).add(s),this}setFromObject(e,i=!1){return this.makeEmpty(),this.expandByObject(e,i)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,i=!1){e.updateWorldMatrix(!1,!1);const s=e.geometry;if(s!==void 0){const f=s.getAttribute("position");if(i===!0&&f!==void 0&&e.isInstancedMesh!==!0)for(let h=0,d=f.count;h<d;h++)e.isMesh===!0?e.getVertexPosition(h,Ra):Ra.fromBufferAttribute(f,h),Ra.applyMatrix4(e.matrixWorld),this.expandByPoint(Ra);else e.boundingBox!==void 0?(e.boundingBox===null&&e.computeBoundingBox(),Lu.copy(e.boundingBox)):(s.boundingBox===null&&s.computeBoundingBox(),Lu.copy(s.boundingBox)),Lu.applyMatrix4(e.matrixWorld),this.union(Lu)}const l=e.children;for(let f=0,h=l.length;f<h;f++)this.expandByObject(l[f],i);return this}containsPoint(e){return e.x>=this.min.x&&e.x<=this.max.x&&e.y>=this.min.y&&e.y<=this.max.y&&e.z>=this.min.z&&e.z<=this.max.z}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,i){return i.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return e.max.x>=this.min.x&&e.min.x<=this.max.x&&e.max.y>=this.min.y&&e.min.y<=this.max.y&&e.max.z>=this.min.z&&e.min.z<=this.max.z}intersectsSphere(e){return this.clampPoint(e.center,Ra),Ra.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let i,s;return e.normal.x>0?(i=e.normal.x*this.min.x,s=e.normal.x*this.max.x):(i=e.normal.x*this.max.x,s=e.normal.x*this.min.x),e.normal.y>0?(i+=e.normal.y*this.min.y,s+=e.normal.y*this.max.y):(i+=e.normal.y*this.max.y,s+=e.normal.y*this.min.y),e.normal.z>0?(i+=e.normal.z*this.min.z,s+=e.normal.z*this.max.z):(i+=e.normal.z*this.max.z,s+=e.normal.z*this.min.z),i<=-e.constant&&s>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(Xl),Ou.subVectors(this.max,Xl),Io.subVectors(e.a,Xl),zo.subVectors(e.b,Xl),Bo.subVectors(e.c,Xl),nr.subVectors(zo,Io),ir.subVectors(Bo,zo),Ir.subVectors(Io,Bo);let i=[0,-nr.z,nr.y,0,-ir.z,ir.y,0,-Ir.z,Ir.y,nr.z,0,-nr.x,ir.z,0,-ir.x,Ir.z,0,-Ir.x,-nr.y,nr.x,0,-ir.y,ir.x,0,-Ir.y,Ir.x,0];return!hp(i,Io,zo,Bo,Ou)||(i=[1,0,0,0,1,0,0,0,1],!hp(i,Io,zo,Bo,Ou))?!1:(Pu.crossVectors(nr,ir),i=[Pu.x,Pu.y,Pu.z],hp(i,Io,zo,Bo,Ou))}clampPoint(e,i){return i.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,Ra).distanceTo(e)}getBoundingSphere(e){return this.isEmpty()?e.makeEmpty():(this.getCenter(e.center),e.radius=this.getSize(Ra).length()*.5),e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()?this:(vs[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),vs[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),vs[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),vs[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),vs[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),vs[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),vs[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),vs[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(vs),this)}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(e){return this.min.fromArray(e.min),this.max.fromArray(e.max),this}}const vs=[new k,new k,new k,new k,new k,new k,new k,new k],Ra=new k,Lu=new cc,Io=new k,zo=new k,Bo=new k,nr=new k,ir=new k,Ir=new k,Xl=new k,Ou=new k,Pu=new k,zr=new k;function hp(o,e,i,s,l){for(let f=0,h=o.length-3;f<=h;f+=3){zr.fromArray(o,f);const d=l.x*Math.abs(zr.x)+l.y*Math.abs(zr.y)+l.z*Math.abs(zr.z),m=e.dot(zr),p=i.dot(zr),S=s.dot(zr);if(Math.max(-Math.max(m,p,S),Math.min(m,p,S))>d)return!1}return!0}const zn=new k,Iu=new ye;let Bb=0;class bs extends lr{constructor(e,i,s=!1){if(super(),Array.isArray(e))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:Bb++}),this.name="",this.array=e,this.itemSize=i,this.count=e!==void 0?e.length/i:0,this.normalized=s,this.usage=_b,this.updateRanges=[],this.gpuType=ja,this.version=0}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,i){this.updateRanges.push({start:e,count:i})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this.gpuType=e.gpuType,this}copyAt(e,i,s){e*=this.itemSize,s*=i.itemSize;for(let l=0,f=this.itemSize;l<f;l++)this.array[e+l]=i.array[s+l];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let i=0,s=this.count;i<s;i++)Iu.fromBufferAttribute(this,i),Iu.applyMatrix3(e),this.setXY(i,Iu.x,Iu.y);else if(this.itemSize===3)for(let i=0,s=this.count;i<s;i++)zn.fromBufferAttribute(this,i),zn.applyMatrix3(e),this.setXYZ(i,zn.x,zn.y,zn.z);return this}applyMatrix4(e){for(let i=0,s=this.count;i<s;i++)zn.fromBufferAttribute(this,i),zn.applyMatrix4(e),this.setXYZ(i,zn.x,zn.y,zn.z);return this}applyNormalMatrix(e){for(let i=0,s=this.count;i<s;i++)zn.fromBufferAttribute(this,i),zn.applyNormalMatrix(e),this.setXYZ(i,zn.x,zn.y,zn.z);return this}transformDirection(e){for(let i=0,s=this.count;i<s;i++)zn.fromBufferAttribute(this,i),zn.transformDirection(e),this.setXYZ(i,zn.x,zn.y,zn.z);return this}set(e,i=0){return this.array.set(e,i),this}getComponent(e,i){let s=this.array[e*this.itemSize+i];return this.normalized&&(s=Vl(s,this.array)),s}setComponent(e,i,s){return this.normalized&&(s=Pi(s,this.array)),this.array[e*this.itemSize+i]=s,this}getX(e){let i=this.array[e*this.itemSize];return this.normalized&&(i=Vl(i,this.array)),i}setX(e,i){return this.normalized&&(i=Pi(i,this.array)),this.array[e*this.itemSize]=i,this}getY(e){let i=this.array[e*this.itemSize+1];return this.normalized&&(i=Vl(i,this.array)),i}setY(e,i){return this.normalized&&(i=Pi(i,this.array)),this.array[e*this.itemSize+1]=i,this}getZ(e){let i=this.array[e*this.itemSize+2];return this.normalized&&(i=Vl(i,this.array)),i}setZ(e,i){return this.normalized&&(i=Pi(i,this.array)),this.array[e*this.itemSize+2]=i,this}getW(e){let i=this.array[e*this.itemSize+3];return this.normalized&&(i=Vl(i,this.array)),i}setW(e,i){return this.normalized&&(i=Pi(i,this.array)),this.array[e*this.itemSize+3]=i,this}setXY(e,i,s){return e*=this.itemSize,this.normalized&&(i=Pi(i,this.array),s=Pi(s,this.array)),this.array[e+0]=i,this.array[e+1]=s,this}setXYZ(e,i,s,l){return e*=this.itemSize,this.normalized&&(i=Pi(i,this.array),s=Pi(s,this.array),l=Pi(l,this.array)),this.array[e+0]=i,this.array[e+1]=s,this.array[e+2]=l,this}setXYZW(e,i,s,l,f){return e*=this.itemSize,this.normalized&&(i=Pi(i,this.array),s=Pi(s,this.array),l=Pi(l,this.array),f=Pi(f,this.array)),this.array[e+0]=i,this.array[e+1]=s,this.array[e+2]=l,this.array[e+3]=f,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){const e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return e.name=this.name,e.usage=this.usage,e.gpuType=this.gpuType,e}dispose(){this.dispatchEvent({type:"dispose"})}}class CS extends bs{constructor(e,i,s){super(new Uint16Array(e),i,s)}}class NS extends bs{constructor(e,i,s){super(new Uint32Array(e),i,s)}}class jn extends bs{constructor(e,i,s){super(new Float32Array(e),i,s)}}const Fb=new cc,Wl=new k,dp=new k;class xf{constructor(e=new k,i=-1){this.isSphere=!0,this.center=e,this.radius=i}set(e,i){return this.center.copy(e),this.radius=i,this}setFromPoints(e,i){const s=this.center;i!==void 0?s.copy(i):Fb.setFromPoints(e).getCenter(s);let l=0;for(let f=0,h=e.length;f<h;f++)l=Math.max(l,s.distanceToSquared(e[f]));return this.radius=Math.sqrt(l),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){const i=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=i*i}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,i){const s=this.center.distanceToSquared(e);return i.copy(e),s>this.radius*this.radius&&(i.sub(this.center).normalize(),i.multiplyScalar(this.radius).add(this.center)),i}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius=this.radius*e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;Wl.subVectors(e,this.center);const i=Wl.lengthSq();if(i>this.radius*this.radius){const s=Math.sqrt(i),l=(s-this.radius)*.5;this.center.addScaledVector(Wl,l/s),this.radius+=l}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(dp.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(Wl.copy(e.center).add(dp)),this.expandByPoint(Wl.copy(e.center).sub(dp))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return{radius:this.radius,center:this.center.toArray()}}fromJSON(e){return this.radius=e.radius,this.center.fromArray(e.center),this}}let Hb=0;const ha=new yn,pp=new qn,Fo=new k,Ki=new cc,Yl=new cc,Yn=new k;class ta extends lr{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:Hb++}),this.uuid=lc(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.indirectOffset=0,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={},this._transformed=!1}getIndex(){return this.index}setIndex(e){return Array.isArray(e)?this.index=new(vb(e)?NS:CS)(e,1):this.index=e,this}setIndirect(e,i=0){return this.indirect=e,this.indirectOffset=i,this}getIndirect(){return this.indirect}getAttribute(e){return this.attributes[e]}setAttribute(e,i){return this.attributes[e]=i,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,i,s=0){this.groups.push({start:e,count:i,materialIndex:s})}clearGroups(){this.groups=[]}setDrawRange(e,i){this.drawRange.start=e,this.drawRange.count=i}applyMatrix4(e){const i=this.attributes.position;i!==void 0&&(i.applyMatrix4(e),i.needsUpdate=!0);const s=this.attributes.normal;if(s!==void 0){const f=new Te().getNormalMatrix(e);s.applyNormalMatrix(f),s.needsUpdate=!0}const l=this.attributes.tangent;return l!==void 0&&(l.transformDirection(e),l.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this._transformed=!0,this}applyQuaternion(e){return ha.makeRotationFromQuaternion(e),this.applyMatrix4(ha),this}rotateX(e){return ha.makeRotationX(e),this.applyMatrix4(ha),this}rotateY(e){return ha.makeRotationY(e),this.applyMatrix4(ha),this}rotateZ(e){return ha.makeRotationZ(e),this.applyMatrix4(ha),this}translate(e,i,s){return ha.makeTranslation(e,i,s),this.applyMatrix4(ha),this}scale(e,i,s){return ha.makeScale(e,i,s),this.applyMatrix4(ha),this}lookAt(e){return pp.lookAt(e),pp.updateMatrix(),this.applyMatrix4(pp.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(Fo).negate(),this.translate(Fo.x,Fo.y,Fo.z),this}setFromPoints(e){const i=this.getAttribute("position");if(i===void 0){const s=[];for(let l=0,f=e.length;l<f;l++){const h=e[l];s.push(h.x,h.y,h.z||0)}this.setAttribute("position",new jn(s,3))}else{const s=Math.min(e.length,i.count);for(let l=0;l<s;l++){const f=e[l];i.setXYZ(l,f.x,f.y,f.z||0)}e.length>i.count&&xe("BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),i.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new cc);const e=this.attributes.position,i=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){Je("BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new k(-1/0,-1/0,-1/0),new k(1/0,1/0,1/0));return}if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),i)for(let s=0,l=i.length;s<l;s++){const f=i[s];Ki.setFromBufferAttribute(f),this.morphTargetsRelative?(Yn.addVectors(this.boundingBox.min,Ki.min),this.boundingBox.expandByPoint(Yn),Yn.addVectors(this.boundingBox.max,Ki.max),this.boundingBox.expandByPoint(Yn)):(this.boundingBox.expandByPoint(Ki.min),this.boundingBox.expandByPoint(Ki.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&Je('BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new xf);const e=this.attributes.position,i=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){Je("BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new k,1/0);return}if(e){const s=this.boundingSphere.center;if(Ki.setFromBufferAttribute(e),i)for(let f=0,h=i.length;f<h;f++){const d=i[f];Yl.setFromBufferAttribute(d),this.morphTargetsRelative?(Yn.addVectors(Ki.min,Yl.min),Ki.expandByPoint(Yn),Yn.addVectors(Ki.max,Yl.max),Ki.expandByPoint(Yn)):(Ki.expandByPoint(Yl.min),Ki.expandByPoint(Yl.max))}Ki.getCenter(s);let l=0;for(let f=0,h=e.count;f<h;f++)Yn.fromBufferAttribute(e,f),l=Math.max(l,s.distanceToSquared(Yn));if(i)for(let f=0,h=i.length;f<h;f++){const d=i[f],m=this.morphTargetsRelative;for(let p=0,S=d.count;p<S;p++)Yn.fromBufferAttribute(d,p),m&&(Fo.fromBufferAttribute(e,p),Yn.add(Fo)),l=Math.max(l,s.distanceToSquared(Yn))}this.boundingSphere.radius=Math.sqrt(l),isNaN(this.boundingSphere.radius)&&Je('BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){const e=this.index,i=this.attributes;if(e===null||i.position===void 0||i.normal===void 0||i.uv===void 0){Je("BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}const s=i.position,l=i.normal,f=i.uv;let h=this.getAttribute("tangent");(h===void 0||h.count!==s.count)&&(h=new bs(new Float32Array(4*s.count),4),this.setAttribute("tangent",h));const d=[],m=[];for(let T=0;T<s.count;T++)d[T]=new k,m[T]=new k;const p=new k,S=new k,v=new k,g=new ye,M=new ye,R=new ye,C=new k,y=new k;function x(T,O,V){p.fromBufferAttribute(s,T),S.fromBufferAttribute(s,O),v.fromBufferAttribute(s,V),g.fromBufferAttribute(f,T),M.fromBufferAttribute(f,O),R.fromBufferAttribute(f,V),S.sub(p),v.sub(p),M.sub(g),R.sub(g);const Z=1/(M.x*R.y-R.x*M.y);isFinite(Z)&&(C.copy(S).multiplyScalar(R.y).addScaledVector(v,-M.y).multiplyScalar(Z),y.copy(v).multiplyScalar(M.x).addScaledVector(S,-R.x).multiplyScalar(Z),d[T].add(C),d[O].add(C),d[V].add(C),m[T].add(y),m[O].add(y),m[V].add(y))}let D=this.groups;D.length===0&&(D=[{start:0,count:e.count}]);for(let T=0,O=D.length;T<O;++T){const V=D[T],Z=V.start,J=V.count;for(let lt=Z,q=Z+J;lt<q;lt+=3)x(e.getX(lt+0),e.getX(lt+1),e.getX(lt+2))}const F=new k,N=new k,L=new k,U=new k;function I(T){L.fromBufferAttribute(l,T),U.copy(L);const O=d[T];F.copy(O),F.sub(L.multiplyScalar(L.dot(O))).normalize(),N.crossVectors(U,O);const Z=N.dot(m[T])<0?-1:1;h.setXYZW(T,F.x,F.y,F.z,Z)}for(let T=0,O=D.length;T<O;++T){const V=D[T],Z=V.start,J=V.count;for(let lt=Z,q=Z+J;lt<q;lt+=3)I(e.getX(lt+0)),I(e.getX(lt+1)),I(e.getX(lt+2))}this._transformed=!0}computeVertexNormals(){const e=this.index,i=this.getAttribute("position");if(i!==void 0){let s=this.getAttribute("normal");if(s===void 0||s.count!==i.count)s=new bs(new Float32Array(i.count*3),3),this.setAttribute("normal",s);else for(let g=0,M=s.count;g<M;g++)s.setXYZ(g,0,0,0);const l=new k,f=new k,h=new k,d=new k,m=new k,p=new k,S=new k,v=new k;if(e)for(let g=0,M=e.count;g<M;g+=3){const R=e.getX(g+0),C=e.getX(g+1),y=e.getX(g+2);l.fromBufferAttribute(i,R),f.fromBufferAttribute(i,C),h.fromBufferAttribute(i,y),S.subVectors(h,f),v.subVectors(l,f),S.cross(v),d.fromBufferAttribute(s,R),m.fromBufferAttribute(s,C),p.fromBufferAttribute(s,y),d.add(S),m.add(S),p.add(S),s.setXYZ(R,d.x,d.y,d.z),s.setXYZ(C,m.x,m.y,m.z),s.setXYZ(y,p.x,p.y,p.z)}else for(let g=0,M=i.count;g<M;g+=3)l.fromBufferAttribute(i,g+0),f.fromBufferAttribute(i,g+1),h.fromBufferAttribute(i,g+2),S.subVectors(h,f),v.subVectors(l,f),S.cross(v),s.setXYZ(g+0,S.x,S.y,S.z),s.setXYZ(g+1,S.x,S.y,S.z),s.setXYZ(g+2,S.x,S.y,S.z);this.normalizeNormals(),s.needsUpdate=!0}}normalizeNormals(){const e=this.attributes.normal;for(let i=0,s=e.count;i<s;i++)Yn.fromBufferAttribute(e,i),Yn.normalize(),e.setXYZ(i,Yn.x,Yn.y,Yn.z)}toNonIndexed(){function e(d,m){const p=d.array,S=d.itemSize,v=d.normalized,g=new p.constructor(m.length*S);let M=0,R=0;for(let C=0,y=m.length;C<y;C++){d.isInterleavedBufferAttribute?M=m[C]*d.data.stride+d.offset:M=m[C]*S;for(let x=0;x<S;x++)g[R++]=p[M++]}return new bs(g,S,v)}if(this.index===null)return xe("BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;const i=new ta,s=this.index.array,l=this.attributes;for(const d in l){const m=l[d],p=e(m,s);i.setAttribute(d,p)}const f=this.morphAttributes;for(const d in f){const m=[],p=f[d];for(let S=0,v=p.length;S<v;S++){const g=p[S],M=e(g,s);m.push(M)}i.morphAttributes[d]=m}i.morphTargetsRelative=this.morphTargetsRelative;const h=this.groups;for(let d=0,m=h.length;d<m;d++){const p=h[d];i.addGroup(p.start,p.count,p.materialIndex)}return i}toJSON(){const e={metadata:{version:4.7,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(e.uuid=this.uuid,e.type=this.parameters!==void 0&&this._transformed===!0?"BufferGeometry":this.type,e.name=this.name,Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0&&this._transformed!==!0){const m=this.parameters;for(const p in m)m[p]!==void 0&&(e[p]=m[p]);return e}e.data={attributes:{}};const i=this.index;i!==null&&(e.data.index={type:i.array.constructor.name,array:Array.prototype.slice.call(i.array)});const s=this.attributes;for(const m in s){const p=s[m];e.data.attributes[m]=p.toJSON(e.data)}const l={};let f=!1;for(const m in this.morphAttributes){const p=this.morphAttributes[m],S=[];for(let v=0,g=p.length;v<g;v++){const M=p[v];S.push(M.toJSON(e.data))}S.length>0&&(l[m]=S,f=!0)}f&&(e.data.morphAttributes=l,e.data.morphTargetsRelative=this.morphTargetsRelative);const h=this.groups;h.length>0&&(e.data.groups=JSON.parse(JSON.stringify(h)));const d=this.boundingSphere;return d!==null&&(e.data.boundingSphere=d.toJSON()),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;const i={};this.name=e.name;const s=e.index;s!==null&&this.setIndex(s.clone());const l=e.attributes;for(const p in l){const S=l[p];this.setAttribute(p,S.clone(i))}const f=e.morphAttributes;for(const p in f){const S=[],v=f[p];for(let g=0,M=v.length;g<M;g++)S.push(v[g].clone(i));this.morphAttributes[p]=S}this.morphTargetsRelative=e.morphTargetsRelative;const h=e.groups;for(let p=0,S=h.length;p<S;p++){const v=h[p];this.addGroup(v.start,v.count,v.materialIndex)}const d=e.boundingBox;d!==null&&(this.boundingBox=d.clone());const m=e.boundingSphere;return m!==null&&(this.boundingSphere=m.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,this._transformed=e._transformed,this}dispose(){this.dispatchEvent({type:"dispose"})}}const mp=new k,Gb=new k,Vb=new Te;class Ss{constructor(e=new k(1,0,0),i=0){this.isPlane=!0,this.normal=e,this.constant=i}set(e,i){return this.normal.copy(e),this.constant=i,this}setComponents(e,i,s,l){return this.normal.set(e,i,s),this.constant=l,this}setFromNormalAndCoplanarPoint(e,i){return this.normal.copy(e),this.constant=-i.dot(this.normal),this}setFromCoplanarPoints(e,i,s){const l=mp.subVectors(s,i).cross(Gb.subVectors(e,i)).normalize();return this.setFromNormalAndCoplanarPoint(l,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){const e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,i){return i.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,i,s=!0){const l=e.delta(mp),f=this.normal.dot(l);if(f===0)return this.distanceToPoint(e.start)===0?i.copy(e.start):null;const h=-(e.start.dot(this.normal)+this.constant)/f;return s===!0&&(h<0||h>1)?null:i.copy(e.start).addScaledVector(l,h)}intersectsLine(e){const i=this.distanceToPoint(e.start),s=this.distanceToPoint(e.end);return i<0&&s>0||s<0&&i>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,i){const s=i||Vb.getNormalMatrix(e),l=this.coplanarPoint(mp).applyMatrix4(e),f=this.normal.applyMatrix3(s).normalize();return this.constant=-l.dot(f),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}toJSON(){return{normal:this.normal.toArray(),constant:this.constant}}fromJSON(e){return this.normal.fromArray(e.normal),this.constant=e.constant,this}}let kb=0;class Qo extends lr{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:kb++}),this.uuid=lc(),this.name="",this.type="Material",this.blending=$l,this.side=kr,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=lS,this.blendDst=cS,this.blendEquation=ko,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new We(0,0,0),this.blendAlpha=0,this.depthFunc=nc,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=ub,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=Kd,this.stencilZFail=Kd,this.stencilZPass=Kd,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(const i in e){const s=e[i];if(s===void 0){xe(`Material: parameter '${i}' has value of undefined.`);continue}const l=this[i];if(l===void 0){xe(`Material: '${i}' is not a property of THREE.${this.type}.`);continue}l&&l.isColor?l.set(s):l&&l.isVector2&&s&&s.isVector2||l&&l.isEuler&&s&&s.isEuler||l&&l.isVector3&&s&&s.isVector3?l.copy(s):this[i]=s}}toJSON(e){const i=e===void 0||typeof e=="string";i&&(e={textures:{},images:{}});const s={metadata:{version:4.7,type:"Material",generator:"Material.toJSON"}};s.uuid=this.uuid,s.type=this.type,s.blending=this.blending,s.side=this.side,s.shadowSide=this.shadowSide,s.vertexColors=this.vertexColors,s.opacity=this.opacity,s.transparent=this.transparent,s.blendSrc=this.blendSrc,s.blendDst=this.blendDst,s.blendEquation=this.blendEquation,s.blendSrcAlpha=this.blendSrcAlpha,s.blendDstAlpha=this.blendDstAlpha,s.blendEquationAlpha=this.blendEquationAlpha,s.blendColor=this.blendColor.getHex(),s.blendAlpha=this.blendAlpha,s.depthFunc=this.depthFunc,s.depthTest=this.depthTest,s.depthWrite=this.depthWrite,s.colorWrite=this.colorWrite,s.clipIntersection=this.clipIntersection,s.clipShadows=this.clipShadows,s.stencilWriteMask=this.stencilWriteMask,s.stencilFunc=this.stencilFunc,s.stencilRef=this.stencilRef,s.stencilFuncMask=this.stencilFuncMask,s.stencilFail=this.stencilFail,s.stencilZFail=this.stencilZFail,s.stencilZPass=this.stencilZPass,s.stencilWrite=this.stencilWrite,s.polygonOffset=this.polygonOffset,s.polygonOffsetFactor=this.polygonOffsetFactor,s.polygonOffsetUnits=this.polygonOffsetUnits,s.dithering=this.dithering,s.alphaTest=this.alphaTest,s.alphaHash=this.alphaHash,s.alphaToCoverage=this.alphaToCoverage,s.premultipliedAlpha=this.premultipliedAlpha,s.forceSinglePass=this.forceSinglePass,s.allowOverride=this.allowOverride,s.visible=this.visible,s.toneMapped=this.toneMapped,s.name=this.name,this.color&&this.color.isColor&&(s.color=this.color.getHex()),this.roughness!==void 0&&(s.roughness=this.roughness),this.metalness!==void 0&&(s.metalness=this.metalness),this.sheen!==void 0&&(s.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(s.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(s.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(s.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&(s.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(s.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(s.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(s.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(s.shininess=this.shininess),this.clearcoat!==void 0&&(s.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(s.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(s.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(s.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(s.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,s.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.sheenColorMap&&this.sheenColorMap.isTexture&&(s.sheenColorMap=this.sheenColorMap.toJSON(e).uuid),this.sheenRoughnessMap&&this.sheenRoughnessMap.isTexture&&(s.sheenRoughnessMap=this.sheenRoughnessMap.toJSON(e).uuid),this.dispersion!==void 0&&(s.dispersion=this.dispersion),this.retroreflectivity!==void 0&&(s.retroreflectivity=this.retroreflectivity),this.iridescence!==void 0&&(s.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(s.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(s.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(s.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(s.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.anisotropy!==void 0&&(s.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(s.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(s.anisotropyMap=this.anisotropyMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(s.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(s.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(s.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(s.lightMap=this.lightMap.toJSON(e).uuid,s.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(s.aoMap=this.aoMap.toJSON(e).uuid,s.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(s.bumpMap=this.bumpMap.toJSON(e).uuid,s.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(s.normalMap=this.normalMap.toJSON(e).uuid,s.normalMapType=this.normalMapType,s.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(s.displacementMap=this.displacementMap.toJSON(e).uuid,s.displacementScale=this.displacementScale,s.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(s.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(s.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(s.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(s.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(s.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(s.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(s.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(s.combine=this.combine)),this.envMapRotation!==void 0&&(s.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(s.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(s.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(s.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(s.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(s.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(s.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(s.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(s.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&(s.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(s.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(s.size=this.size),this.sizeAttenuation!==void 0&&(s.sizeAttenuation=this.sizeAttenuation),Array.isArray(this.clippingPlanes)&&this.clippingPlanes.length>0&&(s.clippingPlanes=this.clippingPlanes.map(f=>f.toJSON())),this.rotation!==void 0&&(s.rotation=this.rotation),this.depthPacking!==void 0&&(s.depthPacking=this.depthPacking),this.linewidth!==void 0&&(s.linewidth=this.linewidth),this.linecap!==void 0&&(s.linecap=this.linecap),this.linejoin!==void 0&&(s.linejoin=this.linejoin),this.dashSize!==void 0&&(s.dashSize=this.dashSize),this.gapSize!==void 0&&(s.gapSize=this.gapSize),this.scale!==void 0&&(s.scale=this.scale),this.wireframe!==void 0&&(s.wireframe=this.wireframe),this.wireframeLinewidth!==void 0&&(s.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!==void 0&&(s.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!==void 0&&(s.wireframeLinejoin=this.wireframeLinejoin),this.flatShading!==void 0&&(s.flatShading=this.flatShading),this.fog!==void 0&&(s.fog=this.fog),Object.keys(this.userData).length>0&&(s.userData=this.userData);function l(f){const h=[];for(const d in f){const m=f[d];delete m.metadata,h.push(m)}return h}if(i){const f=l(e.textures),h=l(e.images);f.length>0&&(s.textures=f),h.length>0&&(s.images=h)}return s}fromJSON(e,i){if(e.uuid!==void 0&&(this.uuid=e.uuid),e.name!==void 0&&(this.name=e.name),e.color!==void 0&&this.color!==void 0&&this.color.setHex(e.color),e.roughness!==void 0&&(this.roughness=e.roughness),e.metalness!==void 0&&(this.metalness=e.metalness),e.sheen!==void 0&&(this.sheen=e.sheen),e.sheenColor!==void 0&&(this.sheenColor=new We().setHex(e.sheenColor)),e.sheenRoughness!==void 0&&(this.sheenRoughness=e.sheenRoughness),e.emissive!==void 0&&this.emissive!==void 0&&this.emissive.setHex(e.emissive),e.specular!==void 0&&this.specular!==void 0&&this.specular.setHex(e.specular),e.specularIntensity!==void 0&&(this.specularIntensity=e.specularIntensity),e.specularColor!==void 0&&this.specularColor!==void 0&&this.specularColor.setHex(e.specularColor),e.shininess!==void 0&&(this.shininess=e.shininess),e.clearcoat!==void 0&&(this.clearcoat=e.clearcoat),e.clearcoatRoughness!==void 0&&(this.clearcoatRoughness=e.clearcoatRoughness),e.dispersion!==void 0&&(this.dispersion=e.dispersion),e.retroreflectivity!==void 0&&(this.retroreflectivity=e.retroreflectivity),e.iridescence!==void 0&&(this.iridescence=e.iridescence),e.iridescenceIOR!==void 0&&(this.iridescenceIOR=e.iridescenceIOR),e.iridescenceThicknessRange!==void 0&&(this.iridescenceThicknessRange=e.iridescenceThicknessRange),e.transmission!==void 0&&(this.transmission=e.transmission),e.thickness!==void 0&&(this.thickness=e.thickness),e.attenuationDistance!==void 0&&(this.attenuationDistance=e.attenuationDistance),e.attenuationColor!==void 0&&this.attenuationColor!==void 0&&this.attenuationColor.setHex(e.attenuationColor),e.anisotropy!==void 0&&(this.anisotropy=e.anisotropy),e.anisotropyRotation!==void 0&&(this.anisotropyRotation=e.anisotropyRotation),e.fog!==void 0&&(this.fog=e.fog),e.flatShading!==void 0&&(this.flatShading=e.flatShading),e.blending!==void 0&&(this.blending=e.blending),e.combine!==void 0&&(this.combine=e.combine),e.side!==void 0&&(this.side=e.side),e.shadowSide!==void 0&&(this.shadowSide=e.shadowSide),e.opacity!==void 0&&(this.opacity=e.opacity),e.transparent!==void 0&&(this.transparent=e.transparent),e.alphaTest!==void 0&&(this.alphaTest=e.alphaTest),e.alphaHash!==void 0&&(this.alphaHash=e.alphaHash),e.depthFunc!==void 0&&(this.depthFunc=e.depthFunc),e.depthTest!==void 0&&(this.depthTest=e.depthTest),e.depthWrite!==void 0&&(this.depthWrite=e.depthWrite),e.colorWrite!==void 0&&(this.colorWrite=e.colorWrite),e.clippingPlanes!==void 0&&(this.clippingPlanes=e.clippingPlanes.map(s=>new Ss().fromJSON(s))),e.clipIntersection!==void 0&&(this.clipIntersection=e.clipIntersection),e.clipShadows!==void 0&&(this.clipShadows=e.clipShadows),e.depthPacking!==void 0&&(this.depthPacking=e.depthPacking),e.blendSrc!==void 0&&(this.blendSrc=e.blendSrc),e.blendDst!==void 0&&(this.blendDst=e.blendDst),e.blendEquation!==void 0&&(this.blendEquation=e.blendEquation),e.blendSrcAlpha!==void 0&&(this.blendSrcAlpha=e.blendSrcAlpha),e.blendDstAlpha!==void 0&&(this.blendDstAlpha=e.blendDstAlpha),e.blendEquationAlpha!==void 0&&(this.blendEquationAlpha=e.blendEquationAlpha),e.blendColor!==void 0&&this.blendColor!==void 0&&this.blendColor.setHex(e.blendColor),e.blendAlpha!==void 0&&(this.blendAlpha=e.blendAlpha),e.stencilWriteMask!==void 0&&(this.stencilWriteMask=e.stencilWriteMask),e.stencilFunc!==void 0&&(this.stencilFunc=e.stencilFunc),e.stencilRef!==void 0&&(this.stencilRef=e.stencilRef),e.stencilFuncMask!==void 0&&(this.stencilFuncMask=e.stencilFuncMask),e.stencilFail!==void 0&&(this.stencilFail=e.stencilFail),e.stencilZFail!==void 0&&(this.stencilZFail=e.stencilZFail),e.stencilZPass!==void 0&&(this.stencilZPass=e.stencilZPass),e.stencilWrite!==void 0&&(this.stencilWrite=e.stencilWrite),e.wireframe!==void 0&&(this.wireframe=e.wireframe),e.wireframeLinewidth!==void 0&&(this.wireframeLinewidth=e.wireframeLinewidth),e.wireframeLinecap!==void 0&&(this.wireframeLinecap=e.wireframeLinecap),e.wireframeLinejoin!==void 0&&(this.wireframeLinejoin=e.wireframeLinejoin),e.rotation!==void 0&&(this.rotation=e.rotation),e.linewidth!==void 0&&(this.linewidth=e.linewidth),e.linecap!==void 0&&(this.linecap=e.linecap),e.linejoin!==void 0&&(this.linejoin=e.linejoin),e.dashSize!==void 0&&(this.dashSize=e.dashSize),e.gapSize!==void 0&&(this.gapSize=e.gapSize),e.scale!==void 0&&(this.scale=e.scale),e.polygonOffset!==void 0&&(this.polygonOffset=e.polygonOffset),e.polygonOffsetFactor!==void 0&&(this.polygonOffsetFactor=e.polygonOffsetFactor),e.polygonOffsetUnits!==void 0&&(this.polygonOffsetUnits=e.polygonOffsetUnits),e.dithering!==void 0&&(this.dithering=e.dithering),e.alphaToCoverage!==void 0&&(this.alphaToCoverage=e.alphaToCoverage),e.premultipliedAlpha!==void 0&&(this.premultipliedAlpha=e.premultipliedAlpha),e.forceSinglePass!==void 0&&(this.forceSinglePass=e.forceSinglePass),e.allowOverride!==void 0&&(this.allowOverride=e.allowOverride),e.visible!==void 0&&(this.visible=e.visible),e.toneMapped!==void 0&&(this.toneMapped=e.toneMapped),e.userData!==void 0&&(this.userData=e.userData),e.vertexColors!==void 0&&(typeof e.vertexColors=="number"?this.vertexColors=e.vertexColors>0:this.vertexColors=e.vertexColors),e.size!==void 0&&(this.size=e.size),e.sizeAttenuation!==void 0&&(this.sizeAttenuation=e.sizeAttenuation),e.map!==void 0&&(this.map=i[e.map]||null),e.matcap!==void 0&&(this.matcap=i[e.matcap]||null),e.alphaMap!==void 0&&(this.alphaMap=i[e.alphaMap]||null),e.bumpMap!==void 0&&(this.bumpMap=i[e.bumpMap]||null),e.bumpScale!==void 0&&(this.bumpScale=e.bumpScale),e.normalMap!==void 0&&(this.normalMap=i[e.normalMap]||null),e.normalMapType!==void 0&&(this.normalMapType=e.normalMapType),e.normalScale!==void 0){let s=e.normalScale;Array.isArray(s)===!1&&(s=[s,s]),this.normalScale=new ye().fromArray(s)}return e.displacementMap!==void 0&&(this.displacementMap=i[e.displacementMap]||null),e.displacementScale!==void 0&&(this.displacementScale=e.displacementScale),e.displacementBias!==void 0&&(this.displacementBias=e.displacementBias),e.roughnessMap!==void 0&&(this.roughnessMap=i[e.roughnessMap]||null),e.metalnessMap!==void 0&&(this.metalnessMap=i[e.metalnessMap]||null),e.emissiveMap!==void 0&&(this.emissiveMap=i[e.emissiveMap]||null),e.emissiveIntensity!==void 0&&(this.emissiveIntensity=e.emissiveIntensity),e.specularMap!==void 0&&(this.specularMap=i[e.specularMap]||null),e.specularIntensityMap!==void 0&&(this.specularIntensityMap=i[e.specularIntensityMap]||null),e.specularColorMap!==void 0&&(this.specularColorMap=i[e.specularColorMap]||null),e.envMap!==void 0&&(this.envMap=i[e.envMap]||null),e.envMapRotation!==void 0&&this.envMapRotation.fromArray(e.envMapRotation),e.envMapIntensity!==void 0&&(this.envMapIntensity=e.envMapIntensity),e.reflectivity!==void 0&&(this.reflectivity=e.reflectivity),e.refractionRatio!==void 0&&(this.refractionRatio=e.refractionRatio),e.lightMap!==void 0&&(this.lightMap=i[e.lightMap]||null),e.lightMapIntensity!==void 0&&(this.lightMapIntensity=e.lightMapIntensity),e.aoMap!==void 0&&(this.aoMap=i[e.aoMap]||null),e.aoMapIntensity!==void 0&&(this.aoMapIntensity=e.aoMapIntensity),e.gradientMap!==void 0&&(this.gradientMap=i[e.gradientMap]||null),e.clearcoatMap!==void 0&&(this.clearcoatMap=i[e.clearcoatMap]||null),e.clearcoatRoughnessMap!==void 0&&(this.clearcoatRoughnessMap=i[e.clearcoatRoughnessMap]||null),e.clearcoatNormalMap!==void 0&&(this.clearcoatNormalMap=i[e.clearcoatNormalMap]||null),e.clearcoatNormalScale!==void 0&&(this.clearcoatNormalScale=new ye().fromArray(e.clearcoatNormalScale)),e.iridescenceMap!==void 0&&(this.iridescenceMap=i[e.iridescenceMap]||null),e.iridescenceThicknessMap!==void 0&&(this.iridescenceThicknessMap=i[e.iridescenceThicknessMap]||null),e.transmissionMap!==void 0&&(this.transmissionMap=i[e.transmissionMap]||null),e.thicknessMap!==void 0&&(this.thicknessMap=i[e.thicknessMap]||null),e.anisotropyMap!==void 0&&(this.anisotropyMap=i[e.anisotropyMap]||null),e.sheenColorMap!==void 0&&(this.sheenColorMap=i[e.sheenColorMap]||null),e.sheenRoughnessMap!==void 0&&(this.sheenRoughnessMap=i[e.sheenRoughnessMap]||null),this}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.blendColor.copy(e.blendColor),this.blendAlpha=e.blendAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;const i=e.clippingPlanes;let s=null;if(i!==null){const l=i.length;s=new Array(l);for(let f=0;f!==l;++f)s[f]=i[f].clone()}return this.clippingPlanes=s,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaHash=e.alphaHash,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.allowOverride=e.allowOverride,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(e){e===!0&&this.version++}}const xs=new k,gp=new k,zu=new k,Bu=new k;class Sf{constructor(e=new k,i=new k(0,0,-1)){this.origin=e,this.direction=i}set(e,i){return this.origin.copy(e),this.direction.copy(i),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,i){return i.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,xs)),this}closestPointToPoint(e,i){i.subVectors(e,this.origin);const s=i.dot(this.direction);return s<0?i.copy(this.origin):i.copy(this.origin).addScaledVector(this.direction,s)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){const i=xs.subVectors(e,this.origin).dot(this.direction);return i<0?this.origin.distanceToSquared(e):(xs.copy(this.origin).addScaledVector(this.direction,i),xs.distanceToSquared(e))}distanceSqToSegment(e,i,s,l){gp.copy(e).add(i).multiplyScalar(.5),zu.copy(i).sub(e).normalize(),Bu.copy(this.origin).sub(gp);const f=e.distanceTo(i)*.5,h=-this.direction.dot(zu),d=Bu.dot(this.direction),m=-Bu.dot(zu),p=Bu.lengthSq(),S=Math.abs(1-h*h);let v,g,M,R;if(S>0)if(v=h*m-d,g=h*d-m,R=f*S,v>=0)if(g>=-R)if(g<=R){const C=1/S;v*=C,g*=C,M=v*(v+h*g+2*d)+g*(h*v+g+2*m)+p}else g=f,v=Math.max(0,-(h*g+d)),M=-v*v+g*(g+2*m)+p;else g=-f,v=Math.max(0,-(h*g+d)),M=-v*v+g*(g+2*m)+p;else g<=-R?(v=Math.max(0,-(-h*f+d)),g=v>0?-f:Math.min(Math.max(-f,-m),f),M=-v*v+g*(g+2*m)+p):g<=R?(v=0,g=Math.min(Math.max(-f,-m),f),M=g*(g+2*m)+p):(v=Math.max(0,-(h*f+d)),g=v>0?f:Math.min(Math.max(-f,-m),f),M=-v*v+g*(g+2*m)+p);else g=h>0?-f:f,v=Math.max(0,-(h*g+d)),M=-v*v+g*(g+2*m)+p;return s&&s.copy(this.origin).addScaledVector(this.direction,v),l&&l.copy(gp).addScaledVector(zu,g),M}intersectSphere(e,i){if(e.radius<0)return null;xs.subVectors(e.center,this.origin);const s=xs.dot(this.direction),l=xs.dot(xs)-s*s,f=e.radius*e.radius;if(l>f)return null;const h=Math.sqrt(f-l),d=s-h,m=s+h;return m<0?null:d<0?this.at(m,i):this.at(d,i)}intersectsSphere(e){return e.radius<0?!1:this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){const i=e.normal.dot(this.direction);if(i===0)return e.distanceToPoint(this.origin)===0?0:null;const s=-(this.origin.dot(e.normal)+e.constant)/i;return s>=0?s:null}intersectPlane(e,i){const s=this.distanceToPlane(e);return s===null?null:this.at(s,i)}intersectsPlane(e){const i=e.distanceToPoint(this.origin);return i===0||e.normal.dot(this.direction)*i<0}intersectBox(e,i){let s,l,f,h,d,m;const p=1/this.direction.x,S=1/this.direction.y,v=1/this.direction.z,g=this.origin;return p>=0?(s=(e.min.x-g.x)*p,l=(e.max.x-g.x)*p):(s=(e.max.x-g.x)*p,l=(e.min.x-g.x)*p),S>=0?(f=(e.min.y-g.y)*S,h=(e.max.y-g.y)*S):(f=(e.max.y-g.y)*S,h=(e.min.y-g.y)*S),s>h||f>l||((f>s||isNaN(s))&&(s=f),(h<l||isNaN(l))&&(l=h),v>=0?(d=(e.min.z-g.z)*v,m=(e.max.z-g.z)*v):(d=(e.max.z-g.z)*v,m=(e.min.z-g.z)*v),s>m||d>l)||((d>s||s!==s)&&(s=d),(m<l||l!==l)&&(l=m),l<0)?null:this.at(s>=0?s:l,i)}intersectsBox(e){return this.intersectBox(e,xs)!==null}intersectTriangle(e,i,s,l,f){const h=this.origin,d=this.direction,m=d.x,p=d.y,S=d.z,v=e.x-h.x,g=e.y-h.y,M=e.z-h.z,R=i.x-h.x,C=i.y-h.y,y=i.z-h.z,x=s.x-h.x,D=s.y-h.y,F=s.z-h.z,N=Math.abs(m),L=Math.abs(p),U=Math.abs(S);let I,T,O,V,Z,J,lt,q,nt,j,K,dt;if(N>=L&&N>=U?(O=m,J=v,nt=R,dt=x,m>=0?(I=p,T=S,V=g,Z=M,lt=C,q=y,j=D,K=F):(I=S,T=p,V=M,Z=g,lt=y,q=C,j=F,K=D)):L>=U?(O=p,J=g,nt=C,dt=D,p>=0?(I=S,T=m,V=M,Z=v,lt=y,q=R,j=F,K=x):(I=m,T=S,V=v,Z=M,lt=R,q=y,j=x,K=F)):(O=S,J=M,nt=y,dt=F,S>=0?(I=m,T=p,V=v,Z=g,lt=R,q=C,j=x,K=D):(I=p,T=m,V=g,Z=v,lt=C,q=R,j=D,K=x)),O===0)return null;const ut=I/O,mt=T/O,gt=1/O,ie=V-ut*J,ae=Z-mt*J,B=lt-ut*nt,_t=q-mt*nt,Rt=j-ut*dt,$=K-mt*dt,pt=Rt*_t-$*B,Ct=ie*$-ae*Rt,Yt=B*ae-_t*ie;if(l){if(pt<0||Ct<0||Yt<0)return null}else if((pt<0||Ct<0||Yt<0)&&(pt>0||Ct>0||Yt>0))return null;const Mt=pt+Ct+Yt;if(Mt===0)return null;const Ot=gt*(pt*J+Ct*nt+Yt*dt);return(Mt>0?Ot<0:Ot>0)?null:this.at(Ot/Mt,f)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}}class pf extends Qo{constructor(e){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new We(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new or,this.combine=uS,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}}const mx=new yn,Br=new Sf,Fu=new xf,gx=new k,Hu=new k,Gu=new k,Vu=new k,_p=new k,ku=new k,_x=new k,Xu=new k;class he extends qn{constructor(e=new ta,i=new pf){super(),this.isMesh=!0,this.type="Mesh",this.geometry=e,this.material=i,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.count=1,this.updateMorphTargets()}copy(e,i){return super.copy(e,i),e.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=e.morphTargetInfluences.slice()),e.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary)),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}updateMorphTargets(){const i=this.geometry.morphAttributes,s=Object.keys(i);if(s.length>0){const l=i[s[0]];if(l!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let f=0,h=l.length;f<h;f++){const d=l[f].name||String(f);this.morphTargetInfluences.push(0),this.morphTargetDictionary[d]=f}}}}getVertexPosition(e,i){const s=this.geometry,l=s.attributes.position,f=s.morphAttributes.position,h=s.morphTargetsRelative;i.fromBufferAttribute(l,e);const d=this.morphTargetInfluences;if(f&&d){ku.set(0,0,0);for(let m=0,p=f.length;m<p;m++){const S=d[m],v=f[m];S!==0&&(_p.fromBufferAttribute(v,e),h?ku.addScaledVector(_p,S):ku.addScaledVector(_p.sub(i),S))}i.add(ku)}return i}intersectsFrustum(e){return e.intersectsObject(this)}raycast(e,i){const s=this.geometry,l=this.material,f=this.matrixWorld;l!==void 0&&(s.boundingSphere===null&&s.computeBoundingSphere(),Fu.copy(s.boundingSphere),Fu.applyMatrix4(f),Br.copy(e.ray).recast(e.near),!(Fu.containsPoint(Br.origin)===!1&&(Br.intersectSphere(Fu,gx)===null||Br.origin.distanceToSquared(gx)>(e.far-e.near)**2))&&(mx.copy(f).invert(),Br.copy(e.ray).applyMatrix4(mx),!(s.boundingBox!==null&&Br.intersectsBox(s.boundingBox)===!1)&&this._computeIntersections(e,i,Br)))}_computeIntersections(e,i,s){let l;const f=this.geometry,h=this.material,d=f.index,m=f.attributes.position,p=f.attributes.uv,S=f.attributes.uv1,v=f.attributes.normal,g=f.groups,M=f.drawRange;if(d!==null)if(Array.isArray(h))for(let R=0,C=g.length;R<C;R++){const y=g[R],x=h[y.materialIndex],D=Math.max(y.start,M.start),F=Math.min(d.count,Math.min(y.start+y.count,M.start+M.count));for(let N=D,L=F;N<L;N+=3){const U=d.getX(N),I=d.getX(N+1),T=d.getX(N+2);l=Wu(this,x,e,s,p,S,v,U,I,T),l&&(l.faceIndex=Math.floor(N/3),l.face.materialIndex=y.materialIndex,i.push(l))}}else{const R=Math.max(0,M.start),C=Math.min(d.count,M.start+M.count);for(let y=R,x=C;y<x;y+=3){const D=d.getX(y),F=d.getX(y+1),N=d.getX(y+2);l=Wu(this,h,e,s,p,S,v,D,F,N),l&&(l.faceIndex=Math.floor(y/3),i.push(l))}}else if(m!==void 0)if(Array.isArray(h))for(let R=0,C=g.length;R<C;R++){const y=g[R],x=h[y.materialIndex],D=Math.max(y.start,M.start),F=Math.min(m.count,Math.min(y.start+y.count,M.start+M.count));for(let N=D,L=F;N<L;N+=3){const U=N,I=N+1,T=N+2;l=Wu(this,x,e,s,p,S,v,U,I,T),l&&(l.faceIndex=Math.floor(N/3),l.face.materialIndex=y.materialIndex,i.push(l))}}else{const R=Math.max(0,M.start),C=Math.min(m.count,M.start+M.count);for(let y=R,x=C;y<x;y+=3){const D=y,F=y+1,N=y+2;l=Wu(this,h,e,s,p,S,v,D,F,N),l&&(l.faceIndex=Math.floor(y/3),i.push(l))}}}}function Xb(o,e,i,s,l,f,h,d){let m;if(e.side===zi?m=s.intersectTriangle(h,f,l,!0,d):m=s.intersectTriangle(l,f,h,e.side===kr,d),m===null)return null;Xu.copy(d),Xu.applyMatrix4(o.matrixWorld);const p=i.ray.origin.distanceTo(Xu);return p<i.near||p>i.far?null:{distance:p,point:Xu.clone(),object:o}}function Wu(o,e,i,s,l,f,h,d,m,p){o.getVertexPosition(d,Hu),o.getVertexPosition(m,Gu),o.getVertexPosition(p,Vu);const S=Xb(o,e,i,s,Hu,Gu,Vu,_x);if(S){const v=new k;pa.getBarycoord(_x,Hu,Gu,Vu,v),l&&(S.uv=pa.getInterpolatedAttribute(l,d,m,p,v,new ye)),f&&(S.uv1=pa.getInterpolatedAttribute(f,d,m,p,v,new ye)),h&&(S.normal=pa.getInterpolatedAttribute(h,d,m,p,v,new k),S.normal.dot(s.direction)>0&&S.normal.multiplyScalar(-1));const g={a:d,b:m,c:p,normal:new k,materialIndex:0};pa.getNormal(Hu,Gu,Vu,g.normal),S.face=g,S.barycoord=v}return S}class Wb extends Ti{constructor(e=null,i=1,s=1,l,f,h,d,m,p=ni,S=ni,v,g){super(null,h,d,m,p,S,l,f,v,g),this.isDataTexture=!0,this.image={data:e,width:i,height:s},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}const Fr=new xf,Yb=new ye(.5,.5),Yu=new k;class Lm{constructor(e=new Ss,i=new Ss,s=new Ss,l=new Ss,f=new Ss,h=new Ss){this.planes=[e,i,s,l,f,h]}set(e,i,s,l,f,h){const d=this.planes;return d[0].copy(e),d[1].copy(i),d[2].copy(s),d[3].copy(l),d[4].copy(f),d[5].copy(h),this}copy(e){const i=this.planes;for(let s=0;s<6;s++)i[s].copy(e.planes[s]);return this}setFromProjectionMatrix(e,i=Za,s=!1){const l=this.planes,f=e.elements,h=f[0],d=f[1],m=f[2],p=f[3],S=f[4],v=f[5],g=f[6],M=f[7],R=f[8],C=f[9],y=f[10],x=f[11],D=f[12],F=f[13],N=f[14],L=f[15];if(l[0].setComponents(p-h,M-S,x-R,L-D).normalize(),l[1].setComponents(p+h,M+S,x+R,L+D).normalize(),l[2].setComponents(p+d,M+v,x+C,L+F).normalize(),l[3].setComponents(p-d,M-v,x-C,L-F).normalize(),s)l[4].setComponents(m,g,y,N).normalize(),l[5].setComponents(p-m,M-g,x-y,L-N).normalize();else if(l[4].setComponents(p-m,M-g,x-y,L-N).normalize(),i===Za)l[5].setComponents(p+m,M+g,x+y,L+N).normalize();else if(i===sc)l[5].setComponents(m,g,y,N).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+i);return this}intersectsObject(e){if(e.boundingSphere!==void 0)e.boundingSphere===null&&e.computeBoundingSphere(),Fr.copy(e.boundingSphere).applyMatrix4(e.matrixWorld);else{const i=e.geometry;i.boundingSphere===null&&i.computeBoundingSphere(),Fr.copy(i.boundingSphere).applyMatrix4(e.matrixWorld)}return this.intersectsSphere(Fr)}intersectsSprite(e){Fr.center.set(0,0,0);const i=Yb.distanceTo(e.center);return Fr.radius=.7071067811865476+i,Fr.applyMatrix4(e.matrixWorld),this.intersectsSphere(Fr)}intersectsSphere(e){const i=this.planes,s=e.center,l=-e.radius;for(let f=0;f<6;f++)if(i[f].distanceToPoint(s)<l)return!1;return!0}intersectsBox(e){const i=this.planes;for(let s=0;s<6;s++){const l=i[s];if(Yu.x=l.normal.x>0?e.max.x:e.min.x,Yu.y=l.normal.y>0?e.max.y:e.min.y,Yu.z=l.normal.z>0?e.max.z:e.min.z,l.distanceToPoint(Yu)<0)return!1}return!0}containsPoint(e){const i=this.planes;for(let s=0;s<6;s++)if(i[s].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}}class DS extends Qo{constructor(e){super(),this.isLineBasicMaterial=!0,this.type="LineBasicMaterial",this.color=new We(16777215),this.map=null,this.linewidth=1,this.linecap="round",this.linejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.linewidth=e.linewidth,this.linecap=e.linecap,this.linejoin=e.linejoin,this.fog=e.fog,this}}const mf=new k,gf=new k,vx=new yn,ql=new Sf,qu=new xf,vp=new k,xx=new k;class qb extends qn{constructor(e=new ta,i=new DS){super(),this.isLine=!0,this.type="Line",this.geometry=e,this.material=i,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(e,i){return super.copy(e,i),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}computeLineDistances(){const e=this.geometry;if(e.index===null){const i=e.attributes.position,s=[0];for(let l=1,f=i.count;l<f;l++)mf.fromBufferAttribute(i,l-1),gf.fromBufferAttribute(i,l),s[l]=s[l-1],s[l]+=mf.distanceTo(gf);e.setAttribute("lineDistance",new jn(s,1))}else xe("Line.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}intersectsFrustum(e){return e.intersectsObject(this)}raycast(e,i){const s=this.geometry,l=this.matrixWorld,f=e.params.Line.threshold,h=s.drawRange;if(s.boundingSphere===null&&s.computeBoundingSphere(),qu.copy(s.boundingSphere),qu.applyMatrix4(l),qu.radius+=f,e.ray.intersectsSphere(qu)===!1)return;vx.copy(l).invert(),ql.copy(e.ray).applyMatrix4(vx);const d=f/((this.scale.x+this.scale.y+this.scale.z)/3),m=d*d,p=this.isLineSegments?2:1,S=s.index,g=s.attributes.position;if(S!==null){const M=Math.max(0,h.start),R=Math.min(S.count,h.start+h.count);for(let C=M,y=R-1;C<y;C+=p){const x=S.getX(C),D=S.getX(C+1),F=ju(this,e,ql,m,x,D,C);F&&i.push(F)}if(this.isLineLoop){const C=S.getX(R-1),y=S.getX(M),x=ju(this,e,ql,m,C,y,R-1);x&&i.push(x)}}else{const M=Math.max(0,h.start),R=Math.min(g.count,h.start+h.count);for(let C=M,y=R-1;C<y;C+=p){const x=ju(this,e,ql,m,C,C+1,C);x&&i.push(x)}if(this.isLineLoop){const C=ju(this,e,ql,m,R-1,M,R-1);C&&i.push(C)}}}updateMorphTargets(){const i=this.geometry.morphAttributes,s=Object.keys(i);if(s.length>0){const l=i[s[0]];if(l!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let f=0,h=l.length;f<h;f++){const d=l[f].name||String(f);this.morphTargetInfluences.push(0),this.morphTargetDictionary[d]=f}}}}}function ju(o,e,i,s,l,f,h){const d=o.geometry.attributes.position;if(mf.fromBufferAttribute(d,l),gf.fromBufferAttribute(d,f),i.distanceSqToSegment(mf,gf,vp,xx)>s)return;vp.applyMatrix4(o.matrixWorld);const p=e.ray.origin.distanceTo(vp);if(!(p<e.near||p>e.far))return{distance:p,point:xx.clone().applyMatrix4(o.matrixWorld),index:h,face:null,faceIndex:null,barycoord:null,object:o}}const Sx=new k,yx=new k;class jb extends qb{constructor(e,i){super(e,i),this.isLineSegments=!0,this.type="LineSegments"}computeLineDistances(){const e=this.geometry;if(e.index===null){const i=e.attributes.position,s=[];for(let l=0,f=i.count;l<f;l+=2)Sx.fromBufferAttribute(i,l),yx.fromBufferAttribute(i,l+1),s[l]=l===0?0:s[l-1],s[l+1]=s[l]+Sx.distanceTo(yx);e.setAttribute("lineDistance",new jn(s,1))}else xe("LineSegments.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}}class US extends Ti{constructor(e=[],i=Xr,s,l,f,h,d,m,p,S){super(e,i,s,l,f,h,d,m,p,S),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}}class rc extends Ti{constructor(e,i,s=Qa,l,f,h,d=ni,m=ni,p,S=Ts,v=1){if(S!==Ts&&S!==Vr)throw new Error("THREE.DepthTexture: format must be either THREE.DepthFormat or THREE.DepthStencilFormat");const g={width:e,height:i,depth:v};super(g,l,f,h,d,m,S,s,p),this.isDepthTexture=!0,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(e){return super.copy(e),this.source=new Nm(Object.assign({},e.image)),this.compareFunction=e.compareFunction,this}toJSON(e){const i=super.toJSON(e);return i.compareFunction=this.compareFunction,i}}class Zb extends rc{constructor(e,i=Qa,s=Xr,l,f,h=ni,d=ni,m,p=Ts){const S={width:e,height:e,depth:1},v=[S,S,S,S,S,S];super(e,e,i,s,l,f,h,d,m,p),this.image=v,this.isCubeDepthTexture=!0,this.isCubeTexture=!0}get images(){return this.image}set images(e){this.image=e}}class LS extends Ti{constructor(e=null){super(),this.sourceTexture=e,this.isExternalTexture=!0}copy(e){return super.copy(e),this.sourceTexture=e.sourceTexture,this}}class Nn extends ta{constructor(e=1,i=1,s=1,l=1,f=1,h=1){super(),this.type="BoxGeometry",this.parameters={width:e,height:i,depth:s,widthSegments:l,heightSegments:f,depthSegments:h};const d=this;l=Math.floor(l),f=Math.floor(f),h=Math.floor(h);const m=[],p=[],S=[],v=[];let g=0,M=0;R("z","y","x",-1,-1,s,i,e,h,f,0),R("z","y","x",1,-1,s,i,-e,h,f,1),R("x","z","y",1,1,e,s,i,l,h,2),R("x","z","y",1,-1,e,s,-i,l,h,3),R("x","y","z",1,-1,e,i,s,l,f,4),R("x","y","z",-1,-1,e,i,-s,l,f,5),this.setIndex(m),this.setAttribute("position",new jn(p,3)),this.setAttribute("normal",new jn(S,3)),this.setAttribute("uv",new jn(v,2));function R(C,y,x,D,F,N,L,U,I,T,O){const V=N/I,Z=L/T,J=N/2,lt=L/2,q=U/2,nt=I+1,j=T+1;let K=0,dt=0;const ut=new k;for(let mt=0;mt<j;mt++){const gt=mt*Z-lt;for(let ie=0;ie<nt;ie++){const ae=ie*V-J;ut[C]=ae*D,ut[y]=gt*F,ut[x]=q,p.push(ut.x,ut.y,ut.z),ut[C]=0,ut[y]=0,ut[x]=U>0?1:-1,S.push(ut.x,ut.y,ut.z),v.push(ie/I),v.push(1-mt/T),K+=1}}for(let mt=0;mt<T;mt++)for(let gt=0;gt<I;gt++){const ie=g+gt+nt*mt,ae=g+gt+nt*(mt+1),B=g+(gt+1)+nt*(mt+1),_t=g+(gt+1)+nt*mt;m.push(ie,ae,_t),m.push(ae,B,_t),dt+=6}d.addGroup(M,dt,O),M+=dt,g+=K}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new Nn(e.width,e.height,e.depth,e.widthSegments,e.heightSegments,e.depthSegments)}}class Sn extends ta{constructor(e=1,i=1,s=1,l=32,f=1,h=!1,d=0,m=Math.PI*2){super(),this.type="CylinderGeometry",this.parameters={radiusTop:e,radiusBottom:i,height:s,radialSegments:l,heightSegments:f,openEnded:h,thetaStart:d,thetaLength:m};const p=this;l=Math.floor(l),f=Math.floor(f);const S=[],v=[],g=[],M=[];let R=0;const C=[],y=s/2;let x=0;D(),h===!1&&(e>0&&F(!0),i>0&&F(!1)),this.setIndex(S),this.setAttribute("position",new jn(v,3)),this.setAttribute("normal",new jn(g,3)),this.setAttribute("uv",new jn(M,2));function D(){const N=new k,L=new k;let U=0;const I=(i-e)/s;for(let T=0;T<=f;T++){const O=[],V=T/f,Z=V*(i-e)+e;for(let J=0;J<=l;J++){const lt=J/l,q=lt*m+d,nt=Math.sin(q),j=Math.cos(q);L.x=Z*nt,L.y=-V*s+y,L.z=Z*j,v.push(L.x,L.y,L.z),N.set(nt,I,j).normalize(),g.push(N.x,N.y,N.z),M.push(lt,1-V),O.push(R++)}C.push(O)}for(let T=0;T<l;T++)for(let O=0;O<f;O++){const V=C[O][T],Z=C[O+1][T],J=C[O+1][T+1],lt=C[O][T+1];(e>0||O!==0)&&(S.push(V,Z,lt),U+=3),(i>0||O!==f-1)&&(S.push(Z,J,lt),U+=3)}p.addGroup(x,U,0),x+=U}function F(N){const L=R,U=new ye,I=new k;let T=0;const O=N===!0?e:i,V=N===!0?1:-1;for(let J=1;J<=l;J++)v.push(0,y*V,0),g.push(0,V,0),M.push(.5,.5),R++;const Z=R;for(let J=0;J<=l;J++){const q=J/l*m+d,nt=Math.cos(q),j=Math.sin(q);I.x=O*j,I.y=y*V,I.z=O*nt,v.push(I.x,I.y,I.z),g.push(0,V,0),U.x=nt*.5+.5,U.y=j*.5*V+.5,M.push(U.x,U.y),R++}for(let J=0;J<l;J++){const lt=L+J,q=Z+J;N===!0?S.push(q,q+1,lt):S.push(q+1,q,lt),T+=3}p.addGroup(x,T,N===!0?1:2),x+=T}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new Sn(e.radiusTop,e.radiusBottom,e.height,e.radialSegments,e.heightSegments,e.openEnded,e.thetaStart,e.thetaLength)}}class Om extends Sn{constructor(e=1,i=1,s=32,l=1,f=!1,h=0,d=Math.PI*2){super(0,e,i,s,l,f,h,d),this.type="ConeGeometry",this.parameters={radius:e,height:i,radialSegments:s,heightSegments:l,openEnded:f,thetaStart:h,thetaLength:d}}static fromJSON(e){return new Om(e.radius,e.height,e.radialSegments,e.heightSegments,e.openEnded,e.thetaStart,e.thetaLength)}}const Zu=new k,Ku=new k,xp=new k,Qu=new pa;class Kb extends ta{constructor(e=null,i=1){if(super(),this.type="EdgesGeometry",this.parameters={geometry:e,thresholdAngle:i},e!==null){const l=Math.pow(10,4),f=Math.cos(tc*i),h=e.getIndex(),d=e.getAttribute("position"),m=h?h.count:d.count,p=[0,0,0],S=["a","b","c"],v=new Array(3),g={},M=[];for(let R=0;R<m;R+=3){h?(p[0]=h.getX(R),p[1]=h.getX(R+1),p[2]=h.getX(R+2)):(p[0]=R,p[1]=R+1,p[2]=R+2);const{a:C,b:y,c:x}=Qu;if(C.fromBufferAttribute(d,p[0]),y.fromBufferAttribute(d,p[1]),x.fromBufferAttribute(d,p[2]),Qu.getNormal(xp),v[0]=`${Math.round(C.x*l)},${Math.round(C.y*l)},${Math.round(C.z*l)}`,v[1]=`${Math.round(y.x*l)},${Math.round(y.y*l)},${Math.round(y.z*l)}`,v[2]=`${Math.round(x.x*l)},${Math.round(x.y*l)},${Math.round(x.z*l)}`,!(v[0]===v[1]||v[1]===v[2]||v[2]===v[0]))for(let D=0;D<3;D++){const F=(D+1)%3,N=v[D],L=v[F],U=Qu[S[D]],I=Qu[S[F]],T=`${N}_${L}`,O=`${L}_${N}`;O in g&&g[O]?(xp.dot(g[O].normal)<=f&&(M.push(U.x,U.y,U.z),M.push(I.x,I.y,I.z)),g[O]=null):T in g||(g[T]={index0:p[D],index1:p[F],normal:xp.clone()})}}for(const R in g)if(g[R]){const{index0:C,index1:y}=g[R];Zu.fromBufferAttribute(d,C),Ku.fromBufferAttribute(d,y),M.push(Zu.x,Zu.y,Zu.z),M.push(Ku.x,Ku.y,Ku.z)}this.setAttribute("position",new jn(M,3))}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}}class uc extends ta{constructor(e=1,i=1,s=1,l=1){super(),this.type="PlaneGeometry",this.parameters={width:e,height:i,widthSegments:s,heightSegments:l};const f=e/2,h=i/2,d=Math.floor(s),m=Math.floor(l),p=d+1,S=m+1,v=e/d,g=i/m,M=[],R=[],C=[],y=[];for(let x=0;x<S;x++){const D=x*g-h;for(let F=0;F<p;F++){const N=F*v-f;R.push(N,-D,0),C.push(0,0,1),y.push(F/d),y.push(1-x/m)}}for(let x=0;x<m;x++)for(let D=0;D<d;D++){const F=D+p*x,N=D+p*(x+1),L=D+1+p*(x+1),U=D+1+p*x;M.push(F,N,U),M.push(N,L,U)}this.setIndex(M),this.setAttribute("position",new jn(R,3)),this.setAttribute("normal",new jn(C,3)),this.setAttribute("uv",new jn(y,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new uc(e.width,e.height,e.widthSegments,e.heightSegments)}}class ec extends ta{constructor(e=1,i=.4,s=12,l=48,f=Math.PI*2,h=0,d=Math.PI*2){super(),this.type="TorusGeometry",this.parameters={radius:e,tube:i,radialSegments:s,tubularSegments:l,arc:f,thetaStart:h,thetaLength:d},s=Math.floor(s),l=Math.floor(l);const m=[],p=[],S=[],v=[],g=new k,M=new k,R=new k;for(let C=0;C<=s;C++){const y=h+C/s*d;for(let x=0;x<=l;x++){const D=x/l*f;M.x=(e+i*Math.cos(y))*Math.cos(D),M.y=(e+i*Math.cos(y))*Math.sin(D),M.z=i*Math.sin(y),p.push(M.x,M.y,M.z),g.x=e*Math.cos(D),g.y=e*Math.sin(D),R.subVectors(M,g).normalize(),S.push(R.x,R.y,R.z),v.push(x/l),v.push(C/s)}}for(let C=1;C<=s;C++)for(let y=1;y<=l;y++){const x=(l+1)*C+y-1,D=(l+1)*(C-1)+y-1,F=(l+1)*(C-1)+y,N=(l+1)*C+y;m.push(x,D,N),m.push(D,F,N)}this.setIndex(m),this.setAttribute("position",new jn(p,3)),this.setAttribute("normal",new jn(S,3)),this.setAttribute("uv",new jn(v,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new ec(e.radius,e.tube,e.radialSegments,e.tubularSegments,e.arc,e.thetaStart,e.thetaLength)}}function Ko(o){const e={};for(const i in o){e[i]={};for(const s in o[i]){const l=o[i][s];if(Mx(l))l.isRenderTargetTexture?(xe("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),e[i][s]=null):e[i][s]=l.clone();else if(Array.isArray(l))if(Mx(l[0])){const f=[];for(let h=0,d=l.length;h<d;h++)f[h]=l[h].clone();e[i][s]=f}else e[i][s]=l.slice();else e[i][s]=l}}return e}function Mi(o){const e={};for(let i=0;i<o.length;i++){const s=Ko(o[i]);for(const l in s)e[l]=s[l]}return e}function Mx(o){return o&&(o.isColor||o.isMatrix3||o.isMatrix4||o.isVector2||o.isVector3||o.isVector4||o.isTexture||o.isQuaternion)}function Qb(o){const e=[];for(let i=0;i<o.length;i++)e.push(o[i].clone());return e}function OS(o){const e=o.getRenderTarget();return e===null?o.outputColorSpace:e.isXRRenderTarget===!0?e.texture.colorSpace:qe.workingColorSpace}const Jb={clone:Ko,merge:Mi};var $b=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,tT=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`;class $a extends Qo{constructor(e){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=$b,this.fragmentShader=tT,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0&&this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=Ko(e.uniforms),this.uniformsGroups=Qb(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this.defaultAttributeValues=Object.assign({},e.defaultAttributeValues),this.index0AttributeName=e.index0AttributeName,this.uniformsNeedUpdate=e.uniformsNeedUpdate,this}toJSON(e){const i=super.toJSON(e);i.glslVersion=this.glslVersion,i.uniforms={};for(const l in this.uniforms){const h=this.uniforms[l].value;h&&h.isTexture?i.uniforms[l]={type:"t",value:h.toJSON(e).uuid}:h&&h.isColor?i.uniforms[l]={type:"c",value:h.getHex()}:h&&h.isVector2?i.uniforms[l]={type:"v2",value:h.toArray()}:h&&h.isVector3?i.uniforms[l]={type:"v3",value:h.toArray()}:h&&h.isVector4?i.uniforms[l]={type:"v4",value:h.toArray()}:h&&h.isMatrix3?i.uniforms[l]={type:"m3",value:h.toArray()}:h&&h.isMatrix4?i.uniforms[l]={type:"m4",value:h.toArray()}:i.uniforms[l]={value:h}}Object.keys(this.defines).length>0&&(i.defines=this.defines),i.vertexShader=this.vertexShader,i.fragmentShader=this.fragmentShader,i.lights=this.lights,i.clipping=this.clipping;const s={};for(const l in this.extensions)this.extensions[l]===!0&&(s[l]=!0);return Object.keys(s).length>0&&(i.extensions=s),i}fromJSON(e,i){if(super.fromJSON(e,i),e.uniforms!==void 0)for(const s in e.uniforms){const l=e.uniforms[s];switch(this.uniforms[s]={},l.type){case"t":this.uniforms[s].value=i[l.value]||null;break;case"c":this.uniforms[s].value=new We().setHex(l.value);break;case"v2":this.uniforms[s].value=new ye().fromArray(l.value);break;case"v3":this.uniforms[s].value=new k().fromArray(l.value);break;case"v4":this.uniforms[s].value=new bn().fromArray(l.value);break;case"m3":this.uniforms[s].value=new Te().fromArray(l.value);break;case"m4":this.uniforms[s].value=new yn().fromArray(l.value);break;default:this.uniforms[s].value=l.value}}if(e.defines!==void 0&&(this.defines=e.defines),e.vertexShader!==void 0&&(this.vertexShader=e.vertexShader),e.fragmentShader!==void 0&&(this.fragmentShader=e.fragmentShader),e.glslVersion!==void 0&&(this.glslVersion=e.glslVersion),e.extensions!==void 0)for(const s in e.extensions)this.extensions[s]=e.extensions[s];return e.lights!==void 0&&(this.lights=e.lights),e.clipping!==void 0&&(this.clipping=e.clipping),this}}class eT extends $a{constructor(e){super(e),this.isRawShaderMaterial=!0,this.type="RawShaderMaterial"}}class Be extends Qo{constructor(e){super(),this.isMeshStandardMaterial=!0,this.type="MeshStandardMaterial",this.defines={STANDARD:""},this.color=new We(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new We(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=dm,this.normalScale=new ye(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new or,this.envMapIntensity=1,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.defines={STANDARD:""},this.color.copy(e.color),this.roughness=e.roughness,this.metalness=e.metalness,this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.roughnessMap=e.roughnessMap,this.metalnessMap=e.metalnessMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.envMapIntensity=e.envMapIntensity,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.flatShading=e.flatShading,this.fog=e.fog,this}}class nT extends Qo{constructor(e){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=lb,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(e)}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}}class iT extends Qo{constructor(e){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e)}copy(e){return super.copy(e),this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}}class Pm extends qn{constructor(e,i=1){super(),this.isLight=!0,this.type="Light",this.color=new We(e),this.intensity=i}copy(e,i){return super.copy(e,i),this.color.copy(e.color),this.intensity=e.intensity,this}toJSON(e){const i=super.toJSON(e);return i.object.color=this.color.getHex(),i.object.intensity=this.intensity,i}}class aT extends Pm{constructor(e,i,s){super(e,s),this.isHemisphereLight=!0,this.type="HemisphereLight",this.position.copy(qn.DEFAULT_UP),this.updateMatrix(),this.groundColor=new We(i)}copy(e,i){return super.copy(e,i),this.groundColor.copy(e.groundColor),this}toJSON(e){const i=super.toJSON(e);return i.object.groundColor=this.groundColor.getHex(),i}}const Sp=new yn,Ex=new k,bx=new k;class PS{constructor(e){this.camera=e,this.intensity=1,this.bias=0,this.biasNode=null,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new ye(512,512),this.mapType=Ji,this.map=null,this.mapPass=null,this.matrix=new yn,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new Lm,this._frameExtents=new ye(1,1),this._viewportCount=1,this._viewports=[new bn(0,0,1,1)]}getViewportCount(){return this._viewportCount}getCamera(){return this.camera}getFrustum(){return this._frustum}updateMatrices(e){const i=this.camera;Ex.setFromMatrixPosition(e.matrixWorld),i.position.copy(Ex),bx.setFromMatrixPosition(e.target.matrixWorld),i.lookAt(bx),i.updateMatrixWorld(),this._updateMatrix(i,this.matrix,this._frustum)}_updateMatrix(e,i,s,l){Sp.multiplyMatrices(e.projectionMatrix,e.matrixWorldInverse),s.setFromProjectionMatrix(Sp,e.coordinateSystem,e.reversedDepth);const f=this._frameExtents,h=l?l.z/f.x:1,d=l?l.w/f.y:1,m=l?l.x/f.x:0,p=l?l.y/f.y:0;e.coordinateSystem===sc||e.reversedDepth?i.set(.5*h,0,0,.5*h+m,0,.5*d,0,.5*d+p,0,0,1,0,0,0,0,1):i.set(.5*h,0,0,.5*h+m,0,.5*d,0,.5*d+p,0,0,.5,.5,0,0,0,1),i.multiply(Sp)}getViewport(e){return this._viewports[e]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(e){return this.camera=e.camera.clone(),this.intensity=e.intensity,this.bias=e.bias,this.radius=e.radius,this.autoUpdate=e.autoUpdate,this.needsUpdate=e.needsUpdate,this.normalBias=e.normalBias,this.blurSamples=e.blurSamples,this.mapSize.copy(e.mapSize),this.biasNode=e.biasNode,this}clone(){return new this.constructor().copy(this)}toJSON(){const e={};return e.intensity=this.intensity,e.bias=this.bias,e.normalBias=this.normalBias,e.radius=this.radius,e.blurSamples=this.blurSamples,e.mapSize=this.mapSize.toArray(),e.camera=this.camera.toJSON(!1).object,delete e.camera.matrix,e}}const Ju=new k,$u=new rr,Wa=new k;class IS extends qn{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new yn,this.projectionMatrix=new yn,this.projectionMatrixInverse=new yn,this.coordinateSystem=Za,this._reversedDepth=!1}get reversedDepth(){return this._reversedDepth}copy(e,i){return super.copy(e,i),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this.coordinateSystem=e.coordinateSystem,this}getWorldDirection(e){return super.getWorldDirection(e).negate()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorld.decompose(Ju,$u,Wa),Wa.x===1&&Wa.y===1&&Wa.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(Ju,$u,Wa.set(1,1,1)).invert()}updateWorldMatrix(e,i,s=!1){super.updateWorldMatrix(e,i,s),this.matrixWorld.decompose(Ju,$u,Wa),Wa.x===1&&Wa.y===1&&Wa.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(Ju,$u,Wa.set(1,1,1)).invert()}clone(){return new this.constructor().copy(this)}}const ar=new k,Tx=new ye,Ax=new ye;class Qi extends IS{constructor(e=50,i=1,s=.1,l=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=e,this.zoom=1,this.near=s,this.far=l,this.focus=10,this.aspect=i,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,i){return super.copy(e,i),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){const i=.5*this.getFilmHeight()/e;this.fov=pm*2*Math.atan(i),this.updateProjectionMatrix()}getFocalLength(){const e=Math.tan(tc*.5*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return pm*2*Math.atan(Math.tan(tc*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(e,i,s){ar.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),i.set(ar.x,ar.y).multiplyScalar(-e/ar.z),ar.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),s.set(ar.x,ar.y).multiplyScalar(-e/ar.z)}getViewSize(e,i){return this.getViewBounds(e,Tx,Ax),i.subVectors(Ax,Tx)}setViewOffset(e,i,s,l,f,h){this.aspect=e/i,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=i,this.view.offsetX=s,this.view.offsetY=l,this.view.width=f,this.view.height=h,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const e=this.near;let i=e*Math.tan(tc*.5*this.fov)/this.zoom,s=2*i,l=this.aspect*s,f=-.5*l;const h=this.view;if(this.view!==null&&this.view.enabled){const m=h.fullWidth,p=h.fullHeight;f+=h.offsetX*l/m,i-=h.offsetY*s/p,l*=h.width/m,s*=h.height/p}const d=this.filmOffset;d!==0&&(f+=e*d/this.getFilmWidth()),this.projectionMatrix.makePerspective(f,f+l,i,i-s,e,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){const i=super.toJSON(e);return i.object.fov=this.fov,i.object.zoom=this.zoom,i.object.near=this.near,i.object.far=this.far,i.object.focus=this.focus,i.object.aspect=this.aspect,this.view!==null&&(i.object.view=Object.assign({},this.view)),i.object.filmGauge=this.filmGauge,i.object.filmOffset=this.filmOffset,i}}class sT extends PS{constructor(){super(new Qi(90,1,.5,500)),this.isPointLightShadow=!0}}class Rx extends Pm{constructor(e,i,s=0,l=2){super(e,i),this.isPointLight=!0,this.type="PointLight",this.distance=s,this.decay=l,this.shadow=new sT}get power(){return this.intensity*4*Math.PI}set power(e){this.intensity=e/(4*Math.PI)}dispose(){super.dispose(),this.shadow.dispose()}copy(e,i){return super.copy(e,i),this.distance=e.distance,this.decay=e.decay,this.shadow=e.shadow.clone(),this}toJSON(e){const i=super.toJSON(e);return i.object.distance=this.distance,i.object.decay=this.decay,i.object.shadow=this.shadow.toJSON(),i}}class Im extends IS{constructor(e=-1,i=1,s=1,l=-1,f=.1,h=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=e,this.right=i,this.top=s,this.bottom=l,this.near=f,this.far=h,this.updateProjectionMatrix()}copy(e,i){return super.copy(e,i),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,i,s,l,f,h){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=i,this.view.offsetX=s,this.view.offsetY=l,this.view.width=f,this.view.height=h,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const e=(this.right-this.left)/(2*this.zoom),i=(this.top-this.bottom)/(2*this.zoom),s=(this.right+this.left)/2,l=(this.top+this.bottom)/2;let f=s-e,h=s+e,d=l+i,m=l-i;if(this.view!==null&&this.view.enabled){const p=(this.right-this.left)/this.view.fullWidth/this.zoom,S=(this.top-this.bottom)/this.view.fullHeight/this.zoom;f+=p*this.view.offsetX,h=f+p*this.view.width,d-=S*this.view.offsetY,m=d-S*this.view.height}this.projectionMatrix.makeOrthographic(f,h,d,m,this.near,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){const i=super.toJSON(e);return i.object.zoom=this.zoom,i.object.left=this.left,i.object.right=this.right,i.object.top=this.top,i.object.bottom=this.bottom,i.object.near=this.near,i.object.far=this.far,this.view!==null&&(i.object.view=Object.assign({},this.view)),i}}class rT extends PS{constructor(){super(new Im(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}}class wx extends Pm{constructor(e,i){super(e,i),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(qn.DEFAULT_UP),this.updateMatrix(),this.target=new qn,this.shadow=new rT}dispose(){super.dispose(),this.shadow.dispose()}copy(e){return super.copy(e),this.target=e.target.clone(),this.shadow=e.shadow.clone(),this}toJSON(e){const i=super.toJSON(e);return i.object.shadow=this.shadow.toJSON(),i.object.target=this.target.uuid,i}}const Ho=-90,Go=1;class oT extends qn{constructor(e,i,s){super(),this.type="CubeCamera",this.renderTarget=s,this.coordinateSystem=null,this.activeMipmapLevel=0;const l=new Qi(Ho,Go,e,i);l.layers=this.layers,this.add(l);const f=new Qi(Ho,Go,e,i);f.layers=this.layers,this.add(f);const h=new Qi(Ho,Go,e,i);h.layers=this.layers,this.add(h);const d=new Qi(Ho,Go,e,i);d.layers=this.layers,this.add(d);const m=new Qi(Ho,Go,e,i);m.layers=this.layers,this.add(m);const p=new Qi(Ho,Go,e,i);p.layers=this.layers,this.add(p)}updateCoordinateSystem(){const e=this.coordinateSystem,i=this.children.concat(),[s,l,f,h,d,m]=i;for(const p of i)this.remove(p);if(e===Za)s.up.set(0,1,0),s.lookAt(1,0,0),l.up.set(0,1,0),l.lookAt(-1,0,0),f.up.set(0,0,-1),f.lookAt(0,1,0),h.up.set(0,0,1),h.lookAt(0,-1,0),d.up.set(0,1,0),d.lookAt(0,0,1),m.up.set(0,1,0),m.lookAt(0,0,-1);else if(e===sc)s.up.set(0,-1,0),s.lookAt(-1,0,0),l.up.set(0,-1,0),l.lookAt(1,0,0),f.up.set(0,0,1),f.lookAt(0,1,0),h.up.set(0,0,-1),h.lookAt(0,-1,0),d.up.set(0,-1,0),d.lookAt(0,0,1),m.up.set(0,-1,0),m.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+e);for(const p of i)this.add(p),p.updateMatrixWorld()}update(e,i){this.parent===null&&this.updateMatrixWorld();const{renderTarget:s,activeMipmapLevel:l}=this;this.coordinateSystem!==e.coordinateSystem&&(this.coordinateSystem=e.coordinateSystem,this.updateCoordinateSystem());const[f,h,d,m,p,S]=this.children,v=e.getRenderTarget(),g=e.getActiveCubeFace(),M=e.getActiveMipmapLevel(),R=e.xr.enabled;e.xr.enabled=!1;const C=s.texture.generateMipmaps;s.texture.generateMipmaps=!1;let y=!1;e.isWebGLRenderer===!0?y=e.state.buffers.depth.getReversed():y=e.reversedDepthBuffer,e.setRenderTarget(s,0,l),y&&e.autoClear===!1&&e.clearDepth(),e.render(i,f),e.setRenderTarget(s,1,l),y&&e.autoClear===!1&&e.clearDepth(),e.render(i,h),e.setRenderTarget(s,2,l),y&&e.autoClear===!1&&e.clearDepth(),e.render(i,d),e.setRenderTarget(s,3,l),y&&e.autoClear===!1&&e.clearDepth(),e.render(i,m),e.setRenderTarget(s,4,l),y&&e.autoClear===!1&&e.clearDepth(),e.render(i,p),s.texture.generateMipmaps=C,e.setRenderTarget(s,5,l),y&&e.autoClear===!1&&e.clearDepth(),e.render(i,S),e.setRenderTarget(v,g,M),e.xr.enabled=R,s.texture.needsPMREMUpdate=!0}}class lT extends Qi{constructor(e=[]){super(),this.isArrayCamera=!0,this.isMultiViewCamera=!1,this.cameras=e}}const Cx=new yn;class cT{constructor(e,i,s=0,l=1/0){this.ray=new Sf(e,i),this.near=s,this.far=l,this.camera=null,this.layers=new Dm,this.params={Mesh:{},Line:{threshold:1},LOD:{},Points:{threshold:1},Sprite:{}}}set(e,i){this.ray.set(e,i)}setFromCamera(e,i){i.isPerspectiveCamera?(this.ray.origin.setFromMatrixPosition(i.matrixWorld),this.ray.direction.set(e.x,e.y,.5).unproject(i).sub(this.ray.origin).normalize(),this.camera=i):i.isOrthographicCamera?(this.ray.origin.set(e.x,e.y,i.projectionMatrix.elements[14]).unproject(i),this.ray.direction.set(0,0,-1).transformDirection(i.matrixWorld),this.camera=i):Je("Raycaster: Unsupported camera type: "+i.type)}setFromXRController(e){return Cx.identity().extractRotation(e.matrixWorld),this.ray.origin.setFromMatrixPosition(e.matrixWorld),this.ray.direction.set(0,0,-1).applyMatrix4(Cx),this}intersectObject(e,i=!0,s=[]){return mm(e,this,s,i),s.sort(Nx),s}intersectObjects(e,i=!0,s=[]){for(let l=0,f=e.length;l<f;l++)mm(e[l],this,s,i);return s.sort(Nx),s}}function Nx(o,e){return o.distance-e.distance}function mm(o,e,i,s){let l=!0;if(o.layers.test(e.layers)&&o.raycast(e,i)===!1&&(l=!1),l===!0&&s===!0){const f=o.children;for(let h=0,d=f.length;h<d;h++)mm(f[h],e,i,!0)}}class Dx{constructor(e=1,i=0,s=0){this.radius=e,this.phi=i,this.theta=s}set(e,i,s){return this.radius=e,this.phi=i,this.theta=s,this}copy(e){return this.radius=e.radius,this.phi=e.phi,this.theta=e.theta,this}makeSafe(){return this.phi=Ge(this.phi,1e-6,Math.PI-1e-6),this}setFromVector3(e){return this.setFromCartesianCoords(e.x,e.y,e.z)}setFromCartesianCoords(e,i,s){return this.radius=Math.sqrt(e*e+i*i+s*s),this.radius===0?(this.theta=0,this.phi=0):(this.theta=Math.atan2(e,s),this.phi=Math.acos(Ge(i/this.radius,-1,1))),this}clone(){return new this.constructor().copy(this)}}const Wm=class Wm{constructor(e,i,s,l){this.elements=[1,0,0,1],e!==void 0&&this.set(e,i,s,l)}identity(){return this.set(1,0,0,1),this}fromArray(e,i=0){for(let s=0;s<4;s++)this.elements[s]=e[s+i];return this}set(e,i,s,l){const f=this.elements;return f[0]=e,f[2]=i,f[1]=s,f[3]=l,this}};Wm.prototype.isMatrix2=!0;let Ux=Wm;class uT extends lr{constructor(e,i=null){super(),this.object=e,this.domElement=i,this.enabled=!0,this.state=-1,this.keys={},this.mouseButtons={LEFT:null,MIDDLE:null,RIGHT:null},this.touches={ONE:null,TWO:null}}connect(e){this.domElement!==null&&this.disconnect(),this.domElement=e}disconnect(){}dispose(){}update(){}}function Lx(o,e,i,s){const l=fT(s);switch(i){case ES:return o*e;case TS:return o*e/l.components*l.byteLength;case Tm:return o*e/l.components*l.byteLength;case Wr:return o*e*2/l.components*l.byteLength;case Am:return o*e*2/l.components*l.byteLength;case bS:return o*e*3/l.components*l.byteLength;case wa:return o*e*4/l.components*l.byteLength;case Rm:return o*e*4/l.components*l.byteLength;case af:case sf:return Math.floor((o+3)/4)*Math.floor((e+3)/4)*8;case rf:case of:return Math.floor((o+3)/4)*Math.floor((e+3)/4)*16;case Bp:case Hp:return Math.max(o,16)*Math.max(e,8)/4;case zp:case Fp:return Math.max(o,8)*Math.max(e,8)/2;case Gp:case Vp:case Xp:case Wp:return Math.floor((o+3)/4)*Math.floor((e+3)/4)*8;case kp:case cf:case Yp:return Math.floor((o+3)/4)*Math.floor((e+3)/4)*16;case qp:return Math.floor((o+3)/4)*Math.floor((e+3)/4)*16;case jp:return Math.floor((o+4)/5)*Math.floor((e+3)/4)*16;case Zp:return Math.floor((o+4)/5)*Math.floor((e+4)/5)*16;case Kp:return Math.floor((o+5)/6)*Math.floor((e+4)/5)*16;case Qp:return Math.floor((o+5)/6)*Math.floor((e+5)/6)*16;case Jp:return Math.floor((o+7)/8)*Math.floor((e+4)/5)*16;case $p:return Math.floor((o+7)/8)*Math.floor((e+5)/6)*16;case tm:return Math.floor((o+7)/8)*Math.floor((e+7)/8)*16;case em:return Math.floor((o+9)/10)*Math.floor((e+4)/5)*16;case nm:return Math.floor((o+9)/10)*Math.floor((e+5)/6)*16;case im:return Math.floor((o+9)/10)*Math.floor((e+7)/8)*16;case am:return Math.floor((o+9)/10)*Math.floor((e+9)/10)*16;case sm:return Math.floor((o+11)/12)*Math.floor((e+9)/10)*16;case rm:return Math.floor((o+11)/12)*Math.floor((e+11)/12)*16;case om:case lm:case cm:return Math.ceil(o/4)*Math.ceil(e/4)*16;case um:case fm:return Math.ceil(o/4)*Math.ceil(e/4)*8;case uf:case hm:return Math.ceil(o/4)*Math.ceil(e/4)*16}throw new Error(`Unable to determine texture byte length for ${i} format.`)}function fT(o){switch(o){case Ji:case xS:return{byteLength:1,components:1};case ic:case SS:case Ja:return{byteLength:2,components:1};case Em:case bm:return{byteLength:2,components:4};case Qa:case Mm:case ja:return{byteLength:4,components:1};case yS:case MS:return{byteLength:4,components:3}}throw new Error(`THREE.TextureUtils: Unknown texture type ${o}.`)}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:ym}}));typeof window<"u"&&(window.__THREE__?xe("WARNING: Multiple instances of Three.js being imported."):window.__THREE__=ym);function zS(){let o=null,e=!1,i=null,s=null;function l(f,h){s=o.requestAnimationFrame(l),i(f,h)}return{start:function(){e!==!0&&i!==null&&o!==null&&(s=o.requestAnimationFrame(l),e=!0)},stop:function(){o!==null&&o.cancelAnimationFrame(s),e=!1},setAnimationLoop:function(f){i=f},setContext:function(f){o=f}}}function hT(o){const e=new WeakMap;function i(d,m){const p=d.array,S=d.usage,v=p.byteLength,g=o.createBuffer();o.bindBuffer(m,g),o.bufferData(m,p,S),d.onUploadCallback();let M;if(p instanceof Float32Array)M=o.FLOAT;else if(typeof Float16Array<"u"&&p instanceof Float16Array)M=o.HALF_FLOAT;else if(p instanceof Uint16Array)d.isFloat16BufferAttribute?M=o.HALF_FLOAT:M=o.UNSIGNED_SHORT;else if(p instanceof Int16Array)M=o.SHORT;else if(p instanceof Uint32Array)M=o.UNSIGNED_INT;else if(p instanceof Int32Array)M=o.INT;else if(p instanceof Int8Array)M=o.BYTE;else if(p instanceof Uint8Array)M=o.UNSIGNED_BYTE;else if(p instanceof Uint8ClampedArray)M=o.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+p);return{buffer:g,type:M,bytesPerElement:p.BYTES_PER_ELEMENT,version:d.version,size:v}}function s(d,m,p){const S=m.array,v=m.updateRanges;if(o.bindBuffer(p,d),v.length===0)o.bufferSubData(p,0,S);else{v.sort((M,R)=>M.start-R.start);let g=0;for(let M=1;M<v.length;M++){const R=v[g],C=v[M];C.start<=R.start+R.count+1?R.count=Math.max(R.count,C.start+C.count-R.start):(++g,v[g]=C)}v.length=g+1;for(let M=0,R=v.length;M<R;M++){const C=v[M];o.bufferSubData(p,C.start*S.BYTES_PER_ELEMENT,S,C.start,C.count)}m.clearUpdateRanges()}m.onUploadCallback()}function l(d){return d.isInterleavedBufferAttribute&&(d=d.data),e.get(d)}function f(d){d.isInterleavedBufferAttribute&&(d=d.data);const m=e.get(d);m&&(o.deleteBuffer(m.buffer),e.delete(d))}function h(d,m){if(d.isInterleavedBufferAttribute&&(d=d.data),d.isGLBufferAttribute){const S=e.get(d);(!S||S.version<d.version)&&e.set(d,{buffer:d.buffer,type:d.type,bytesPerElement:d.elementSize,version:d.version});return}const p=e.get(d);if(p===void 0)e.set(d,i(d,m));else if(p.version<d.version){if(p.size!==d.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");s(p.buffer,d,m),p.version=d.version}}return{get:l,remove:f,update:h}}var dT=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,pT=`#ifdef USE_ALPHAHASH
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
#endif`,mT=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,gT=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,_T=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,vT=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,xT=`#ifdef USE_AOMAP
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
#endif`,ST=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,yT=`#ifdef USE_BATCHING
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
#endif`,MT=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,ET=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,bT=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,TT=`float G_BlinnPhong_Implicit( ) {
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
} // validated`,AT=`#ifdef USE_IRIDESCENCE
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
#endif`,RT=`#ifdef USE_BUMPMAP
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
#endif`,wT=`#if NUM_CLIPPING_PLANES > 0
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
#endif`,CT=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,NT=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,DT=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,UT=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#endif`,LT=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#endif`,OT=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec4 vColor;
#endif`,PT=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
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
#endif`,IT=`#define PI 3.141592653589793
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
} // validated`,zT=`#ifdef ENVMAP_TYPE_CUBE_UV
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
#endif`,BT=`vec3 transformedNormal = objectNormal;
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
#endif`,FT=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,HT=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,GT=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,VT=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,kT="gl_FragColor = linearToOutputTexel( gl_FragColor );",XT=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,WT=`#ifdef USE_ENVMAP
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
#endif`,YT=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
#endif`,qT=`#ifdef USE_ENVMAP
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
#endif`,jT=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,ZT=`#ifdef USE_ENVMAP
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
#endif`,KT=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,QT=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,JT=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,$T=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,t1=`#ifdef USE_GRADIENTMAP
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
}`,e1=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,n1=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,i1=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,a1=`uniform bool receiveShadow;
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
#include <lightprobes_pars_fragment>`,s1=`#ifdef USE_ENVMAP
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
#endif`,r1=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,o1=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,l1=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,c1=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,u1=`PhysicalMaterial material;
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
#endif`,f1=`uniform sampler2D dfgLUT;
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
}`,h1=`
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
#endif`,d1=`#if defined( RE_IndirectDiffuse )
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
#endif`,p1=`#if defined( RE_IndirectDiffuse )
	#if defined( LAMBERT ) || defined( PHONG )
		irradiance += iblIrradiance;
	#endif
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,m1=`#ifdef USE_LIGHT_PROBES_GRID
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
#endif`,g1=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,_1=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,v1=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,x1=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,S1=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,y1=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,M1=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
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
#endif`,E1=`#if defined( USE_POINTS_UV )
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
#endif`,b1=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,T1=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,A1=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,R1=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,w1=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,C1=`#ifdef USE_MORPHTARGETS
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
#endif`,N1=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,D1=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
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
vec3 nonPerturbedNormal = normal;`,U1=`#ifdef USE_NORMALMAP_OBJECTSPACE
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
#endif`,L1=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,O1=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,P1=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
		#ifdef FLIP_SIDED
			vBitangent = - vBitangent;
		#endif
	#endif
#endif`,I1=`#ifdef USE_NORMALMAP
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
#endif`,z1=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,B1=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,F1=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,H1=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,G1=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,V1=`vec3 packNormalToRGB( const in vec3 normal ) {
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
}`,k1=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,X1=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,W1=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,Y1=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,q1=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,j1=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,Z1=`#if NUM_SPOT_LIGHT_COORDS > 0
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
#endif`,K1=`#if NUM_SPOT_LIGHT_COORDS > 0
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
#endif`,Q1=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_SUN_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
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
#endif`,J1=`float getShadowMask() {
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
}`,$1=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,tA=`#ifdef USE_SKINNING
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
#endif`,eA=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,nA=`#ifdef USE_SKINNING
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
#endif`,iA=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,aA=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,sA=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,rA=`#ifndef saturate
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
vec3 CustomToneMapping( vec3 color ) { return color; }`,oA=`#ifdef USE_TRANSMISSION
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
#endif`,lA=`#ifdef USE_TRANSMISSION
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
#endif`,cA=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,uA=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,fA=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,hA=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`;const dA=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,pA=`uniform sampler2D t2D;
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
}`,mA=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,gA=`#ifdef ENVMAP_TYPE_CUBE
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
}`,_A=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,vA=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,xA=`#include <common>
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
}`,SA=`#if DEPTH_PACKING == 3200
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
}`,yA=`#define DISTANCE
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
}`,MA=`#define DISTANCE
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
}`,EA=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,bA=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,TA=`uniform float scale;
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
}`,AA=`uniform vec3 diffuse;
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
}`,RA=`#include <common>
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
}`,wA=`uniform vec3 diffuse;
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
}`,CA=`#define LAMBERT
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
}`,NA=`#define LAMBERT
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
}`,DA=`#define MATCAP
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
}`,UA=`#define MATCAP
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
}`,LA=`#define NORMAL
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
}`,OA=`#define NORMAL
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
}`,PA=`#define PHONG
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
}`,IA=`#define PHONG
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
}`,zA=`#define STANDARD
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
}`,BA=`#define STANDARD
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
}`,FA=`#define TOON
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
}`,HA=`#define TOON
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
}`,GA=`uniform float size;
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
}`,VA=`uniform vec3 diffuse;
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
}`,kA=`#include <common>
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
}`,XA=`uniform vec3 color;
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
}`,WA=`uniform float rotation;
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
}`,YA=`uniform vec3 diffuse;
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
}`,De={alphahash_fragment:dT,alphahash_pars_fragment:pT,alphamap_fragment:mT,alphamap_pars_fragment:gT,alphatest_fragment:_T,alphatest_pars_fragment:vT,aomap_fragment:xT,aomap_pars_fragment:ST,batching_pars_vertex:yT,batching_vertex:MT,begin_vertex:ET,beginnormal_vertex:bT,bsdfs:TT,iridescence_fragment:AT,bumpmap_pars_fragment:RT,clipping_planes_fragment:wT,clipping_planes_pars_fragment:CT,clipping_planes_pars_vertex:NT,clipping_planes_vertex:DT,color_fragment:UT,color_pars_fragment:LT,color_pars_vertex:OT,color_vertex:PT,common:IT,cube_uv_reflection_fragment:zT,defaultnormal_vertex:BT,displacementmap_pars_vertex:FT,displacementmap_vertex:HT,emissivemap_fragment:GT,emissivemap_pars_fragment:VT,colorspace_fragment:kT,colorspace_pars_fragment:XT,envmap_fragment:WT,envmap_common_pars_fragment:YT,envmap_pars_fragment:qT,envmap_pars_vertex:jT,envmap_physical_pars_fragment:s1,envmap_vertex:ZT,fog_vertex:KT,fog_pars_vertex:QT,fog_fragment:JT,fog_pars_fragment:$T,gradientmap_pars_fragment:t1,lightmap_pars_fragment:e1,lights_lambert_fragment:n1,lights_lambert_pars_fragment:i1,lights_pars_begin:a1,lights_toon_fragment:r1,lights_toon_pars_fragment:o1,lights_phong_fragment:l1,lights_phong_pars_fragment:c1,lights_physical_fragment:u1,lights_physical_pars_fragment:f1,lights_fragment_begin:h1,lights_fragment_maps:d1,lights_fragment_end:p1,lightprobes_pars_fragment:m1,logdepthbuf_fragment:g1,logdepthbuf_pars_fragment:_1,logdepthbuf_pars_vertex:v1,logdepthbuf_vertex:x1,map_fragment:S1,map_pars_fragment:y1,map_particle_fragment:M1,map_particle_pars_fragment:E1,metalnessmap_fragment:b1,metalnessmap_pars_fragment:T1,morphinstance_vertex:A1,morphcolor_vertex:R1,morphnormal_vertex:w1,morphtarget_pars_vertex:C1,morphtarget_vertex:N1,normal_fragment_begin:D1,normal_fragment_maps:U1,normal_pars_fragment:L1,normal_pars_vertex:O1,normal_vertex:P1,normalmap_pars_fragment:I1,clearcoat_normal_fragment_begin:z1,clearcoat_normal_fragment_maps:B1,clearcoat_pars_fragment:F1,iridescence_pars_fragment:H1,opaque_fragment:G1,packing:V1,premultiplied_alpha_fragment:k1,project_vertex:X1,dithering_fragment:W1,dithering_pars_fragment:Y1,roughnessmap_fragment:q1,roughnessmap_pars_fragment:j1,shadowmap_pars_fragment:Z1,shadowmap_pars_vertex:K1,shadowmap_vertex:Q1,shadowmask_pars_fragment:J1,skinbase_vertex:$1,skinning_pars_vertex:tA,skinning_vertex:eA,skinnormal_vertex:nA,specularmap_fragment:iA,specularmap_pars_fragment:aA,tonemapping_fragment:sA,tonemapping_pars_fragment:rA,transmission_fragment:oA,transmission_pars_fragment:lA,uv_pars_fragment:cA,uv_pars_vertex:uA,uv_vertex:fA,worldpos_vertex:hA,background_vert:dA,background_frag:pA,backgroundCube_vert:mA,backgroundCube_frag:gA,cube_vert:_A,cube_frag:vA,depth_vert:xA,depth_frag:SA,distance_vert:yA,distance_frag:MA,equirect_vert:EA,equirect_frag:bA,linedashed_vert:TA,linedashed_frag:AA,meshbasic_vert:RA,meshbasic_frag:wA,meshlambert_vert:CA,meshlambert_frag:NA,meshmatcap_vert:DA,meshmatcap_frag:UA,meshnormal_vert:LA,meshnormal_frag:OA,meshphong_vert:PA,meshphong_frag:IA,meshphysical_vert:zA,meshphysical_frag:BA,meshtoon_vert:FA,meshtoon_frag:HA,points_vert:GA,points_frag:VA,shadow_vert:kA,shadow_frag:XA,sprite_vert:WA,sprite_frag:YA},Kt={common:{diffuse:{value:new We(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new Te},alphaMap:{value:null},alphaMapTransform:{value:new Te},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new Te}},envmap:{envMap:{value:null},envMapRotation:{value:new Te},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98},dfgLUT:{value:null}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new Te}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new Te}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new Te},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new Te},normalScale:{value:new ye(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new Te},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new Te}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new Te}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new Te}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new We(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},sunLights:{value:[],properties:{direction:{},color:{}}},sunLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},sunShadowMatrix:{value:[]},sunShadowCascade:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null},probesSH:{value:null},probesMin:{value:new k},probesMax:{value:new k},probesResolution:{value:new k}},points:{diffuse:{value:new We(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new Te},alphaTest:{value:0},uvTransform:{value:new Te}},sprite:{diffuse:{value:new We(16777215)},opacity:{value:1},center:{value:new ye(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new Te},alphaMap:{value:null},alphaMapTransform:{value:new Te},alphaTest:{value:0}}},qa={basic:{uniforms:Mi([Kt.common,Kt.specularmap,Kt.envmap,Kt.aomap,Kt.lightmap,Kt.fog]),vertexShader:De.meshbasic_vert,fragmentShader:De.meshbasic_frag},lambert:{uniforms:Mi([Kt.common,Kt.specularmap,Kt.envmap,Kt.aomap,Kt.lightmap,Kt.emissivemap,Kt.bumpmap,Kt.normalmap,Kt.displacementmap,Kt.fog,Kt.lights,{emissive:{value:new We(0)},envMapIntensity:{value:1}}]),vertexShader:De.meshlambert_vert,fragmentShader:De.meshlambert_frag},phong:{uniforms:Mi([Kt.common,Kt.specularmap,Kt.envmap,Kt.aomap,Kt.lightmap,Kt.emissivemap,Kt.bumpmap,Kt.normalmap,Kt.displacementmap,Kt.fog,Kt.lights,{emissive:{value:new We(0)},specular:{value:new We(1118481)},shininess:{value:30},envMapIntensity:{value:1}}]),vertexShader:De.meshphong_vert,fragmentShader:De.meshphong_frag},standard:{uniforms:Mi([Kt.common,Kt.envmap,Kt.aomap,Kt.lightmap,Kt.emissivemap,Kt.bumpmap,Kt.normalmap,Kt.displacementmap,Kt.roughnessmap,Kt.metalnessmap,Kt.fog,Kt.lights,{emissive:{value:new We(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:De.meshphysical_vert,fragmentShader:De.meshphysical_frag},toon:{uniforms:Mi([Kt.common,Kt.aomap,Kt.lightmap,Kt.emissivemap,Kt.bumpmap,Kt.normalmap,Kt.displacementmap,Kt.gradientmap,Kt.fog,Kt.lights,{emissive:{value:new We(0)}}]),vertexShader:De.meshtoon_vert,fragmentShader:De.meshtoon_frag},matcap:{uniforms:Mi([Kt.common,Kt.bumpmap,Kt.normalmap,Kt.displacementmap,Kt.fog,{matcap:{value:null}}]),vertexShader:De.meshmatcap_vert,fragmentShader:De.meshmatcap_frag},points:{uniforms:Mi([Kt.points,Kt.fog]),vertexShader:De.points_vert,fragmentShader:De.points_frag},dashed:{uniforms:Mi([Kt.common,Kt.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:De.linedashed_vert,fragmentShader:De.linedashed_frag},depth:{uniforms:Mi([Kt.common,Kt.displacementmap]),vertexShader:De.depth_vert,fragmentShader:De.depth_frag},normal:{uniforms:Mi([Kt.common,Kt.bumpmap,Kt.normalmap,Kt.displacementmap,{opacity:{value:1}}]),vertexShader:De.meshnormal_vert,fragmentShader:De.meshnormal_frag},sprite:{uniforms:Mi([Kt.sprite,Kt.fog]),vertexShader:De.sprite_vert,fragmentShader:De.sprite_frag},background:{uniforms:{uvTransform:{value:new Te},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:De.background_vert,fragmentShader:De.background_frag},backgroundCube:{uniforms:{envMap:{value:null},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new Te}},vertexShader:De.backgroundCube_vert,fragmentShader:De.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:De.cube_vert,fragmentShader:De.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:De.equirect_vert,fragmentShader:De.equirect_frag},distance:{uniforms:Mi([Kt.common,Kt.displacementmap,{referencePosition:{value:new k},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:De.distance_vert,fragmentShader:De.distance_frag},shadow:{uniforms:Mi([Kt.lights,Kt.fog,{color:{value:new We(0)},opacity:{value:1}}]),vertexShader:De.shadow_vert,fragmentShader:De.shadow_frag}};qa.physical={uniforms:Mi([qa.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new Te},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new Te},clearcoatNormalScale:{value:new ye(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new Te},dispersion:{value:0},retroreflectivity:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new Te},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new Te},sheen:{value:0},sheenColor:{value:new We(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new Te},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new Te},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new Te},transmissionSamplerSize:{value:new ye},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new Te},attenuationDistance:{value:0},attenuationColor:{value:new We(0)},specularColor:{value:new We(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new Te},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new Te},anisotropyVector:{value:new ye},anisotropyMap:{value:null},anisotropyMapTransform:{value:new Te}}]),vertexShader:De.meshphysical_vert,fragmentShader:De.meshphysical_frag};const tf={r:0,b:0,g:0},qA=new yn,BS=new Te;BS.set(-1,0,0,0,1,0,0,0,1);function jA(o,e,i,s,l,f){const h=new We(0);let d=l===!0?0:1,m,p,S=null,v=0,g=null;function M(D){let F=D.isScene===!0?D.background:null;if(F&&F.isTexture){const N=D.backgroundBlurriness>0;F=e.get(F,N)}return F}function R(D){let F=!1;const N=M(D);N===null?y(h,d):N&&N.isColor&&(y(N,1),F=!0);const L=o.xr.getEnvironmentBlendMode();L==="additive"?i.buffers.color.setClear(0,0,0,1,f):L==="alpha-blend"&&i.buffers.color.setClear(0,0,0,0,f),(o.autoClear||F)&&(i.buffers.depth.setTest(!0),i.buffers.depth.setMask(!0),i.buffers.color.setMask(!0),o.clear(o.autoClearColor,o.autoClearDepth,o.autoClearStencil))}function C(D,F){const N=M(F);N&&(N.isCubeTexture||N.mapping===vf)?(p===void 0&&(p=new he(new Nn(1,1,1),new $a({name:"BackgroundCubeMaterial",uniforms:Ko(qa.backgroundCube.uniforms),vertexShader:qa.backgroundCube.vertexShader,fragmentShader:qa.backgroundCube.fragmentShader,side:zi,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),p.geometry.deleteAttribute("normal"),p.geometry.deleteAttribute("uv"),p.onBeforeRender=function(L,U,I){this.matrixWorld.copyPosition(I.matrixWorld)},Object.defineProperty(p.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),s.update(p)),p.material.uniforms.envMap.value=N,p.material.uniforms.backgroundBlurriness.value=F.backgroundBlurriness,p.material.uniforms.backgroundIntensity.value=F.backgroundIntensity,p.material.uniforms.backgroundRotation.value.setFromMatrix4(qA.makeRotationFromEuler(F.backgroundRotation)).transpose(),N.isCubeTexture&&N.isRenderTargetTexture===!1&&p.material.uniforms.backgroundRotation.value.premultiply(BS),p.material.toneMapped=qe.getTransfer(N.colorSpace)!==cn,(S!==N||v!==N.version||g!==o.toneMapping)&&(p.material.needsUpdate=!0,S=N,v=N.version,g=o.toneMapping),p.layers.enableAll(),D.unshift(p,p.geometry,p.material,0,0,null)):N&&N.isTexture&&(m===void 0&&(m=new he(new uc(2,2),new $a({name:"BackgroundMaterial",uniforms:Ko(qa.background.uniforms),vertexShader:qa.background.vertexShader,fragmentShader:qa.background.fragmentShader,side:kr,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),m.geometry.deleteAttribute("normal"),Object.defineProperty(m.material,"map",{get:function(){return this.uniforms.t2D.value}}),s.update(m)),m.material.uniforms.t2D.value=N,m.material.uniforms.backgroundIntensity.value=F.backgroundIntensity,m.material.toneMapped=qe.getTransfer(N.colorSpace)!==cn,N.matrixAutoUpdate===!0&&N.updateMatrix(),m.material.uniforms.uvTransform.value.copy(N.matrix),(S!==N||v!==N.version||g!==o.toneMapping)&&(m.material.needsUpdate=!0,S=N,v=N.version,g=o.toneMapping),m.layers.enableAll(),D.unshift(m,m.geometry,m.material,0,0,null))}function y(D,F){D.getRGB(tf,OS(o)),i.buffers.color.setClear(tf.r,tf.g,tf.b,F,f)}function x(){p!==void 0&&(p.geometry.dispose(),p.material.dispose(),p=void 0),m!==void 0&&(m.geometry.dispose(),m.material.dispose(),m=void 0)}return{getClearColor:function(){return h},setClearColor:function(D,F=1){h.set(D),d=F,y(h,d)},getClearAlpha:function(){return d},setClearAlpha:function(D){d=D,y(h,d)},render:R,addToRenderList:C,dispose:x}}function ZA(o,e){const i=o.getParameter(o.MAX_VERTEX_ATTRIBS),s={},l=g(null);let f=l,h=!1;function d(Z,J,lt,q,nt){let j=!1;const K=v(Z,q,lt,J);f!==K&&(f=K,p(f.object)),j=M(Z,q,lt,nt),j&&R(Z,q,lt,nt),nt!==null&&e.update(nt,o.ELEMENT_ARRAY_BUFFER),(j||h)&&(h=!1,N(Z,J,lt,q),nt!==null&&o.bindBuffer(o.ELEMENT_ARRAY_BUFFER,e.get(nt).buffer))}function m(){return o.createVertexArray()}function p(Z){return o.bindVertexArray(Z)}function S(Z){return o.deleteVertexArray(Z)}function v(Z,J,lt,q){const nt=q.wireframe===!0;let j=s[J.id];j===void 0&&(j={},s[J.id]=j);const K=Z.isInstancedMesh===!0?Z.id:0;let dt=j[K];dt===void 0&&(dt={},j[K]=dt);let ut=dt[lt.id];ut===void 0&&(ut={},dt[lt.id]=ut);let mt=ut[nt];return mt===void 0&&(mt=g(m()),ut[nt]=mt),mt}function g(Z){const J=[],lt=[],q=[];for(let nt=0;nt<i;nt++)J[nt]=0,lt[nt]=0,q[nt]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:J,enabledAttributes:lt,attributeDivisors:q,object:Z,attributes:{},index:null}}function M(Z,J,lt,q){const nt=f.attributes,j=J.attributes;let K=0;const dt=lt.getAttributes();for(const ut in dt)if(dt[ut].location>=0){const gt=nt[ut];let ie=j[ut];if(ie===void 0&&(ut==="instanceMatrix"&&Z.instanceMatrix&&(ie=Z.instanceMatrix),ut==="instanceColor"&&Z.instanceColor&&(ie=Z.instanceColor)),gt===void 0||gt.attribute!==ie||ie&&gt.data!==ie.data)return!0;K++}return f.attributesNum!==K||f.index!==q}function R(Z,J,lt,q){const nt={},j=J.attributes;let K=0;const dt=lt.getAttributes();for(const ut in dt)if(dt[ut].location>=0){let gt=j[ut];gt===void 0&&(ut==="instanceMatrix"&&Z.instanceMatrix&&(gt=Z.instanceMatrix),ut==="instanceColor"&&Z.instanceColor&&(gt=Z.instanceColor));const ie={};ie.attribute=gt,gt&&gt.data&&(ie.data=gt.data),nt[ut]=ie,K++}f.attributes=nt,f.attributesNum=K,f.index=q}function C(){const Z=f.newAttributes;for(let J=0,lt=Z.length;J<lt;J++)Z[J]=0}function y(Z){x(Z,0)}function x(Z,J){const lt=f.newAttributes,q=f.enabledAttributes,nt=f.attributeDivisors;lt[Z]=1,q[Z]===0&&(o.enableVertexAttribArray(Z),q[Z]=1),nt[Z]!==J&&(o.vertexAttribDivisor(Z,J),nt[Z]=J)}function D(){const Z=f.newAttributes,J=f.enabledAttributes;for(let lt=0,q=J.length;lt<q;lt++)J[lt]!==Z[lt]&&(o.disableVertexAttribArray(lt),J[lt]=0)}function F(Z,J,lt,q,nt,j,K){K===!0?o.vertexAttribIPointer(Z,J,lt,nt,j):o.vertexAttribPointer(Z,J,lt,q,nt,j)}function N(Z,J,lt,q){C();const nt=q.attributes,j=lt.getAttributes(),K=J.defaultAttributeValues;for(const dt in j){const ut=j[dt];if(ut.location>=0){let mt=nt[dt];if(mt===void 0&&(dt==="instanceMatrix"&&Z.instanceMatrix&&(mt=Z.instanceMatrix),dt==="instanceColor"&&Z.instanceColor&&(mt=Z.instanceColor)),mt!==void 0){const gt=mt.normalized,ie=mt.itemSize,ae=e.get(mt);if(ae===void 0)continue;const B=ae.buffer,_t=ae.type,Rt=ae.bytesPerElement,$=_t===o.INT||_t===o.UNSIGNED_INT||mt.gpuType===Mm;if(mt.isInterleavedBufferAttribute){const pt=mt.data,Ct=pt.stride,Yt=mt.offset;if(pt.isInstancedInterleavedBuffer){for(let Mt=0;Mt<ut.locationSize;Mt++)x(ut.location+Mt,pt.meshPerAttribute);Z.isInstancedMesh!==!0&&q._maxInstanceCount===void 0&&(q._maxInstanceCount=pt.meshPerAttribute*pt.count)}else for(let Mt=0;Mt<ut.locationSize;Mt++)y(ut.location+Mt);o.bindBuffer(o.ARRAY_BUFFER,B);for(let Mt=0;Mt<ut.locationSize;Mt++)F(ut.location+Mt,ie/ut.locationSize,_t,gt,Ct*Rt,(Yt+ie/ut.locationSize*Mt)*Rt,$)}else{if(mt.isInstancedBufferAttribute){for(let pt=0;pt<ut.locationSize;pt++)x(ut.location+pt,mt.meshPerAttribute);Z.isInstancedMesh!==!0&&q._maxInstanceCount===void 0&&(q._maxInstanceCount=mt.meshPerAttribute*mt.count)}else for(let pt=0;pt<ut.locationSize;pt++)y(ut.location+pt);o.bindBuffer(o.ARRAY_BUFFER,B);for(let pt=0;pt<ut.locationSize;pt++)F(ut.location+pt,ie/ut.locationSize,_t,gt,ie*Rt,ie/ut.locationSize*pt*Rt,$)}}else if(K!==void 0){const gt=K[dt];if(gt!==void 0)switch(gt.length){case 2:o.vertexAttrib2fv(ut.location,gt);break;case 3:o.vertexAttrib3fv(ut.location,gt);break;case 4:o.vertexAttrib4fv(ut.location,gt);break;default:o.vertexAttrib1fv(ut.location,gt)}}}}D()}function L(){O();for(const Z in s){const J=s[Z];for(const lt in J){const q=J[lt];for(const nt in q){const j=q[nt];for(const K in j)S(j[K].object),delete j[K];delete q[nt]}}delete s[Z]}}function U(Z){if(s[Z.id]===void 0)return;const J=s[Z.id];for(const lt in J){const q=J[lt];for(const nt in q){const j=q[nt];for(const K in j)S(j[K].object),delete j[K];delete q[nt]}}delete s[Z.id]}function I(Z){for(const J in s){const lt=s[J];for(const q in lt){const nt=lt[q];if(nt[Z.id]===void 0)continue;const j=nt[Z.id];for(const K in j)S(j[K].object),delete j[K];delete nt[Z.id]}}}function T(Z){for(const J in s){const lt=s[J],q=Z.isInstancedMesh===!0?Z.id:0,nt=lt[q];if(nt!==void 0){for(const j in nt){const K=nt[j];for(const dt in K)S(K[dt].object),delete K[dt];delete nt[j]}delete lt[q],Object.keys(lt).length===0&&delete s[J]}}}function O(){V(),h=!0,f!==l&&(f=l,p(f.object))}function V(){l.geometry=null,l.program=null,l.wireframe=!1}return{setup:d,reset:O,resetDefaultState:V,dispose:L,releaseStatesOfGeometry:U,releaseStatesOfObject:T,releaseStatesOfProgram:I,initAttributes:C,enableAttribute:y,disableUnusedAttributes:D}}function KA(o,e,i){let s;function l(m){s=m}function f(m,p){o.drawArrays(s,m,p),i.update(p,s,1)}function h(m,p,S){S!==0&&(o.drawArraysInstanced(s,m,p,S),i.update(p,s,S))}function d(m,p,S){if(S===0)return;e.get("WEBGL_multi_draw").multiDrawArraysWEBGL(s,m,0,p,0,S);let g=0;for(let M=0;M<S;M++)g+=p[M];i.update(g,s,1)}this.setMode=l,this.render=f,this.renderInstances=h,this.renderMultiDraw=d}function QA(o,e,i,s){let l;function f(){if(l!==void 0)return l;if(e.has("EXT_texture_filter_anisotropic")===!0){const I=e.get("EXT_texture_filter_anisotropic");l=o.getParameter(I.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else l=0;return l}function h(I){return!(I!==wa&&s.convert(I)!==o.getParameter(o.IMPLEMENTATION_COLOR_READ_FORMAT))}function d(I){const T=I===Ja&&(e.has("EXT_color_buffer_half_float")||e.has("EXT_color_buffer_float"));return!(I!==Ji&&I!==ja&&!T&&s.convert(I)!==o.getParameter(o.IMPLEMENTATION_COLOR_READ_TYPE))}function m(I){if(I==="highp"){if(o.getShaderPrecisionFormat(o.VERTEX_SHADER,o.HIGH_FLOAT).precision>0&&o.getShaderPrecisionFormat(o.FRAGMENT_SHADER,o.HIGH_FLOAT).precision>0)return"highp";I="mediump"}return I==="mediump"&&o.getShaderPrecisionFormat(o.VERTEX_SHADER,o.MEDIUM_FLOAT).precision>0&&o.getShaderPrecisionFormat(o.FRAGMENT_SHADER,o.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let p=i.precision!==void 0?i.precision:"highp";const S=m(p);S!==p&&(xe("WebGLRenderer:",p,"not supported, using",S,"instead."),p=S);const v=i.logarithmicDepthBuffer===!0,g=i.reversedDepthBuffer===!0&&e.has("EXT_clip_control");i.reversedDepthBuffer===!0&&g===!1&&xe("WebGLRenderer: Unable to use reversed depth buffer due to missing EXT_clip_control extension. Fallback to default depth buffer.");const M=o.getParameter(o.MAX_TEXTURE_IMAGE_UNITS),R=o.getParameter(o.MAX_VERTEX_TEXTURE_IMAGE_UNITS),C=o.getParameter(o.MAX_TEXTURE_SIZE),y=o.getParameter(o.MAX_CUBE_MAP_TEXTURE_SIZE),x=o.getParameter(o.MAX_VERTEX_ATTRIBS),D=o.getParameter(o.MAX_VERTEX_UNIFORM_VECTORS),F=o.getParameter(o.MAX_VARYING_VECTORS),N=o.getParameter(o.MAX_FRAGMENT_UNIFORM_VECTORS),L=o.getParameter(o.MAX_SAMPLES),U=o.getParameter(o.SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:f,getMaxPrecision:m,textureFormatReadable:h,textureTypeReadable:d,precision:p,logarithmicDepthBuffer:v,reversedDepthBuffer:g,maxTextures:M,maxVertexTextures:R,maxTextureSize:C,maxCubemapSize:y,maxAttributes:x,maxVertexUniforms:D,maxVaryings:F,maxFragmentUniforms:N,maxSamples:L,samples:U}}function JA(o){const e=this;let i=null,s=0,l=!1,f=!1;const h=new Ss,d=new Te,m={value:null,needsUpdate:!1};this.uniform=m,this.numPlanes=0,this.numIntersection=0,this.init=function(v,g){const M=v.length!==0||g||s!==0||l;return l=g,s=v.length,M},this.beginShadows=function(){f=!0,S(null)},this.endShadows=function(){f=!1},this.setGlobalState=function(v,g){i=S(v,g,0)},this.setState=function(v,g,M){const R=v.clippingPlanes,C=v.clipIntersection,y=v.clipShadows,x=o.get(v);if(!l||R===null||R.length===0||f&&!y)f?S(null):p();else{const D=f?0:s,F=D*4;let N=x.clippingState||null;m.value=N,N=S(R,g,F,M);for(let L=0;L!==F;++L)N[L]=i[L];x.clippingState=N,this.numIntersection=C?this.numPlanes:0,this.numPlanes+=D}};function p(){m.value!==i&&(m.value=i,m.needsUpdate=s>0),e.numPlanes=s,e.numIntersection=0}function S(v,g,M,R){const C=v!==null?v.length:0;let y=null;if(C!==0){if(y=m.value,R!==!0||y===null){const x=M+C*4,D=g.matrixWorldInverse;d.getNormalMatrix(D),(y===null||y.length<x)&&(y=new Float32Array(x));for(let F=0,N=M;F!==C;++F,N+=4)h.copy(v[F]).applyMatrix4(D,d),h.normal.toArray(y,N),y[N+3]=h.constant}m.value=y,m.needsUpdate=!0}return e.numPlanes=C,e.numIntersection=0,y}}const Wo=4,$A=6,t2=20,e2=256,jl=new Im,Ox=new We;let yp=null,Mp=0,Ep=0,bp=!1;const n2=new k,Hr=new k;class Px{constructor(e){this._renderer=e,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._sizeLods=[],this._lodMeshes=[],this._backgroundBox=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._blurMaterial=null,this._ggxMaterial=null}fromScene(e,i=0,s=.1,l=100,f={}){const{size:h=256,position:d=n2}=f;yp=this._renderer.getRenderTarget(),Mp=this._renderer.getActiveCubeFace(),Ep=this._renderer.getActiveMipmapLevel(),bp=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(h);const m=this._allocateTargets();return m.depthBuffer=!0,this._sceneToCubeUV(e,s,l,m,d),i>0&&this._blur(m,0,0,i),this._applyPMREM(m),this._cleanup(m),m}fromEquirectangular(e,i=null){return this._fromTexture(e,i)}fromCubemap(e,i=null){return this._fromTexture(e,i)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=Bx(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=zx(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose(),this._backgroundBox!==null&&(this._backgroundBox.geometry.dispose(),this._backgroundBox.material.dispose())}_setSize(e){this._lodMax=Math.floor(Math.log2(e)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._ggxMaterial!==null&&this._ggxMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let e=0;e<this._lodMeshes.length;e++)this._lodMeshes[e].geometry.dispose()}_cleanup(e){this._renderer.setRenderTarget(yp,Mp,Ep),this._renderer.xr.enabled=bp,e.scissorTest=!1,Vo(e,0,0,e.width,e.height)}_fromTexture(e,i){e.mapping===Xr||e.mapping===Zo?this._setSize(e.image.length===0?16:e.image[0].width||e.image[0].image.width):this._setSize(e.image.width/4),yp=this._renderer.getRenderTarget(),Mp=this._renderer.getActiveCubeFace(),Ep=this._renderer.getActiveMipmapLevel(),bp=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;const s=i||this._allocateTargets();return this._textureToCubeUV(e,s),this._applyPMREM(s),this._cleanup(s),s}_allocateTargets(){const e=3*Math.max(this._cubeSize,112),i=4*this._cubeSize,s={magFilter:hi,minFilter:hi,generateMipmaps:!1,type:Ja,format:wa,colorSpace:ff,depthBuffer:!1},l=Ix(e,i,s);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==e||this._pingPongRenderTarget.height!==i){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=Ix(e,i,s);const{_lodMax:f}=this;({lodMeshes:this._lodMeshes,sizeLods:this._sizeLods}=i2(f)),this._blurMaterial=s2(f,e,i),this._ggxMaterial=a2(f,e,i)}return l}_compileMaterial(e){const i=new he(new ta,e);this._renderer.compile(i,jl)}_sceneToCubeUV(e,i,s,l,f){const m=new Qi(90,1,i,s),p=[1,-1,1,1,1,1],S=[1,1,1,-1,-1,-1],v=this._renderer,g=v.autoClear,M=v.toneMapping;v.getClearColor(Ox),v.toneMapping=Ka,v.autoClear=!1,v.state.buffers.depth.getReversed()&&(v.setRenderTarget(l),v.clearDepth(),v.setRenderTarget(null)),this._backgroundBox===null&&(this._backgroundBox=new he(new Nn,new pf({name:"PMREM.Background",side:zi,depthWrite:!1,depthTest:!1})));const C=this._backgroundBox,y=C.material;let x=!1;const D=e.background;D?D.isColor&&(y.color.copy(D),e.background=null,x=!0):(y.color.copy(Ox),x=!0);for(let F=0;F<6;F++){const N=F%3;N===0?(m.up.set(0,p[F],0),m.position.set(f.x,f.y,f.z),m.lookAt(f.x+S[F],f.y,f.z)):N===1?(m.up.set(0,0,p[F]),m.position.set(f.x,f.y,f.z),m.lookAt(f.x,f.y+S[F],f.z)):(m.up.set(0,p[F],0),m.position.set(f.x,f.y,f.z),m.lookAt(f.x,f.y,f.z+S[F]));const L=this._cubeSize;Vo(l,N*L,F>2?L:0,L,L),v.setRenderTarget(l),x&&v.render(C,m),v.render(e,m)}v.toneMapping=M,v.autoClear=g,e.background=D}_textureToCubeUV(e,i){const s=this._renderer,l=e.mapping===Xr||e.mapping===Zo;l?(this._cubemapMaterial===null&&(this._cubemapMaterial=Bx()),this._cubemapMaterial.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=zx());const f=l?this._cubemapMaterial:this._equirectMaterial,h=this._lodMeshes[0];h.material=f;const d=f.uniforms;d.envMap.value=e;const m=this._cubeSize;Vo(i,0,0,3*m,2*m),s.setRenderTarget(i),s.render(h,jl)}_applyPMREM(e){const i=this._renderer,s=i.autoClear;i.autoClear=!1;const l=this._lodMeshes.length;for(let f=1;f<l;f++)this._applyGGXFilter(e,f-1,f);i.autoClear=s}_applyGGXFilter(e,i,s){const l=this._renderer,f=this._pingPongRenderTarget,h=this._ggxMaterial,d=this._lodMeshes[s];d.material=h;const m=h.uniforms,p=s/(this._lodMeshes.length-1),S=i/(this._lodMeshes.length-1),v=Math.sqrt(p*p-S*S),g=p*1.25,M=v*g,{_lodMax:R}=this,C=this._sizeLods[s],y=3*C*(s>R-Wo?s-R+Wo:0),x=4*(this._cubeSize-C);m.envMap.value=e.texture,m.roughness.value=M,m.mipInt.value=R-i,Vo(f,y,x,3*C,2*C),l.setRenderTarget(f),l.render(d,jl),m.envMap.value=f.texture,m.roughness.value=0,m.mipInt.value=R-s,Vo(e,y,x,3*C,2*C),l.setRenderTarget(e),l.render(d,jl)}_blur(e,i,s,l){const f=this._pingPongRenderTarget,h=Math.min(l,Math.PI)/Math.SQRT2;this._blurPass(e,f,i,s,h),this._blurPass(f,e,s,s,h)}_blurPass(e,i,s,l,f){const h=this._renderer,d=this._blurMaterial,m=this._lodMeshes[l];m.material=d;const p=d.uniforms;p.envMap.value=e.texture,p.sigma.value=f,p.mipInt.value=this._lodMax-s;const S=this._sizeLods[l],v=3*S*(l>this._lodMax-Wo?l-this._lodMax+Wo:0),g=4*(this._cubeSize-S);Vo(i,v,g,3*S,2*S),h.setRenderTarget(i),h.render(m,jl)}}function i2(o){const e=[],i=[];let s=o;const l=o-Wo+1+$A;for(let f=0;f<l;f++){const h=Math.pow(2,s);e.push(h);const d=1/(h-2),m=-d,p=1+d,S=[m,m,p,m,p,p,m,m,p,p,m,p],v=6,g=6,M=3,R=new Float32Array(M*g*v),C=new Float32Array(M*g*v);for(let x=0;x<v;x++){const D=x%3*2/3-1,F=x>2?0:-1,N=[D,F,0,D+2/3,F,0,D+2/3,F+1,0,D,F,0,D+2/3,F+1,0,D,F+1,0];R.set(N,M*g*x);for(let L=0;L<g;L++){const U=S[L*2]*2-1,I=S[L*2+1]*2-1;x===0?Hr.set(1,I,U):x===1?Hr.set(-U,1,-I):x===2?Hr.set(-U,I,1):x===3?Hr.set(-1,I,-U):x===4?Hr.set(-U,-1,I):Hr.set(U,I,-1),Hr.toArray(C,(x*g+L)*M)}}const y=new ta;y.setAttribute("position",new bs(R,M)),y.setAttribute("outputDirection",new bs(C,M)),i.push(new he(y,null)),s>Wo&&s--}return{lodMeshes:i,sizeLods:e}}function Ix(o,e,i){const s=new Ca(o,e,i);return s.texture.mapping=vf,s.texture.name="PMREM.cubeUv",s.scissorTest=!0,s}function Vo(o,e,i,s,l){o.viewport.set(e,i,s,l),o.scissor.set(e,i,s,l)}function a2(o,e,i){return new $a({name:"PMREMGGXConvolution",defines:{GGX_SAMPLES:e2,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/i,CUBEUV_MAX_MIP:`${o}.0`},uniforms:{envMap:{value:null},roughness:{value:0},mipInt:{value:0}},vertexShader:yf(),fragmentShader:`

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
		`,blending:Ms,depthTest:!1,depthWrite:!1})}function s2(o,e,i){return new $a({name:"SphericalGaussianBlur",defines:{SAMPLES:t2,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/i,CUBEUV_MAX_MIP:`${o}.0`},uniforms:{envMap:{value:null},sigma:{value:0},mipInt:{value:0}},vertexShader:yf(),fragmentShader:`

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
		`,blending:Ms,depthTest:!1,depthWrite:!1})}function zx(){return new $a({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:yf(),fragmentShader:`

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
		`,blending:Ms,depthTest:!1,depthWrite:!1})}function Bx(){return new $a({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:yf(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:Ms,depthTest:!1,depthWrite:!1})}function yf(){return`

		precision mediump float;
		precision mediump int;

		attribute vec3 outputDirection;

		varying vec3 vOutputDirection;

		void main() {

			vOutputDirection = outputDirection;
			gl_Position = vec4( position, 1.0 );

		}
	`}class FS extends Ca{constructor(e=1,i={}){super(e,e,i),this.isWebGLCubeRenderTarget=!0;const s={width:e,height:e,depth:1},l=[s,s,s,s,s,s];this.texture=new US(l),this._setTextureOptions(i),this.texture.isRenderTargetTexture=!0}fromEquirectangularTexture(e,i){this.texture.type=i.type,this.texture.colorSpace=i.colorSpace,this.texture.generateMipmaps=i.generateMipmaps,this.texture.minFilter=i.minFilter,this.texture.magFilter=i.magFilter;const s={uniforms:{tEquirect:{value:null}},vertexShader:`

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
			`},l=new Nn(5,5,5),f=new $a({name:"CubemapFromEquirect",uniforms:Ko(s.uniforms),vertexShader:s.vertexShader,fragmentShader:s.fragmentShader,side:zi,blending:Ms});f.uniforms.tEquirect.value=i;const h=new he(l,f),d=i.minFilter;return i.minFilter===Gr&&(i.minFilter=hi),new oT(1,10,this).update(e,h),i.minFilter=d,h.geometry.dispose(),h.material.dispose(),this}clear(e,i=!0,s=!0,l=!0){const f=e.getRenderTarget();for(let h=0;h<6;h++)e.setRenderTarget(this,h),e.clear(i,s,l);e.setRenderTarget(f)}}function r2(o){let e=new WeakMap,i=new WeakMap,s=null;function l(g,M=!1){return g==null?null:M?h(g):f(g)}function f(g){if(g&&g.isTexture){const M=g.mapping;if(M===qd||M===jd)if(e.has(g)){const R=e.get(g).texture;return d(R,g.mapping)}else{const R=g.image;if(R&&R.height>0){const C=new FS(R.height);return C.fromEquirectangularTexture(o,g),e.set(g,C),g.addEventListener("dispose",p),d(C.texture,g.mapping)}else return null}}return g}function h(g){if(g&&g.isTexture){const M=g.mapping,R=M===qd||M===jd,C=M===Xr||M===Zo;if(R||C){let y=i.get(g);const x=y!==void 0?y.texture.pmremVersion:0;if(g.isRenderTargetTexture&&g.pmremVersion!==x)return s===null&&(s=new Px(o)),y=R?s.fromEquirectangular(g,y):s.fromCubemap(g,y),y.texture.pmremVersion=g.pmremVersion,i.set(g,y),y.texture;if(y!==void 0)return y.texture;{const D=g.image;return R&&D&&D.height>0||C&&D&&m(D)?(s===null&&(s=new Px(o)),y=R?s.fromEquirectangular(g):s.fromCubemap(g),y.texture.pmremVersion=g.pmremVersion,i.set(g,y),g.addEventListener("dispose",S),y.texture):null}}}return g}function d(g,M){return M===qd?g.mapping=Xr:M===jd&&(g.mapping=Zo),g}function m(g){let M=0;const R=6;for(let C=0;C<R;C++)g[C]!==void 0&&M++;return M===R}function p(g){const M=g.target;M.removeEventListener("dispose",p);const R=e.get(M);R!==void 0&&(e.delete(M),R.dispose())}function S(g){const M=g.target;M.removeEventListener("dispose",S);const R=i.get(M);R!==void 0&&(i.delete(M),R.dispose())}function v(){e=new WeakMap,i=new WeakMap,s!==null&&(s.dispose(),s=null)}return{get:l,dispose:v}}function o2(o){const e={};function i(s){if(e[s]!==void 0)return e[s];const l=o.getExtension(s);return e[s]=l,l}return{has:function(s){return i(s)!==null},init:function(){i("EXT_color_buffer_float"),i("WEBGL_clip_cull_distance"),i("OES_texture_float_linear"),i("EXT_color_buffer_half_float"),i("WEBGL_multisampled_render_to_texture"),i("WEBGL_render_shared_exponent")},get:function(s){const l=i(s);return l===null&&qo("WebGLRenderer: "+s+" extension not supported."),l}}}function l2(o,e,i,s){const l={},f=new WeakMap;function h(v){const g=v.target;g.index!==null&&e.remove(g.index);for(const R in g.attributes)e.remove(g.attributes[R]);g.removeEventListener("dispose",h),delete l[g.id];const M=f.get(g);M&&(e.remove(M),f.delete(g)),s.releaseStatesOfGeometry(g),g.isInstancedBufferGeometry===!0&&delete g._maxInstanceCount,i.memory.geometries--}function d(v,g){return l[g.id]===!0||(g.addEventListener("dispose",h),l[g.id]=!0,i.memory.geometries++),g}function m(v){const g=v.attributes;for(const M in g)e.update(g[M],o.ARRAY_BUFFER)}function p(v){const g=[],M=v.index,R=v.attributes.position;let C=0;if(R===void 0)return;if(M!==null){const D=M.array;C=M.version;for(let F=0,N=D.length;F<N;F+=3){const L=D[F+0],U=D[F+1],I=D[F+2];g.push(L,U,U,I,I,L)}}else{const D=R.array;C=R.version;for(let F=0,N=D.length/3-1;F<N;F+=3){const L=F+0,U=F+1,I=F+2;g.push(L,U,U,I,I,L)}}const y=new(R.count>=65535?NS:CS)(g,1);y.version=C;const x=f.get(v);x&&e.remove(x),f.set(v,y)}function S(v){const g=f.get(v);if(g){const M=v.index;M!==null&&g.version<M.version&&p(v)}else p(v);return f.get(v)}return{get:d,update:m,getWireframeAttribute:S}}function c2(o,e,i){let s;function l(v){s=v}let f,h;function d(v){f=v.type,h=v.bytesPerElement}function m(v,g){o.drawElements(s,g,f,v*h),i.update(g,s,1)}function p(v,g,M){M!==0&&(o.drawElementsInstanced(s,g,f,v*h,M),i.update(g,s,M))}function S(v,g,M){if(M===0)return;e.get("WEBGL_multi_draw").multiDrawElementsWEBGL(s,g,0,f,v,0,M);let C=0;for(let y=0;y<M;y++)C+=g[y];i.update(C,s,1)}this.setMode=l,this.setIndex=d,this.render=m,this.renderInstances=p,this.renderMultiDraw=S}function u2(o){const e={geometries:0,textures:0},i={frame:0,calls:0,triangles:0,points:0,lines:0};function s(f,h,d){switch(i.calls++,h){case o.TRIANGLES:i.triangles+=d*(f/3);break;case o.LINES:i.lines+=d*(f/2);break;case o.LINE_STRIP:i.lines+=d*(f-1);break;case o.LINE_LOOP:i.lines+=d*f;break;case o.POINTS:i.points+=d*f;break;default:Je("WebGLInfo: Unknown draw mode:",h);break}}function l(){i.calls=0,i.triangles=0,i.points=0,i.lines=0}return{memory:e,render:i,programs:null,autoReset:!0,reset:l,update:s}}function f2(o,e,i){const s=new WeakMap,l=new bn;function f(h,d,m){const p=h.morphTargetInfluences,S=d.morphAttributes.position||d.morphAttributes.normal||d.morphAttributes.color,v=S!==void 0?S.length:0;let g=s.get(d);if(g===void 0||g.count!==v){let V=function(){T.dispose(),s.delete(d),d.removeEventListener("dispose",V)};var M=V;g!==void 0&&g.texture.dispose();const R=d.morphAttributes.position!==void 0,C=d.morphAttributes.normal!==void 0,y=d.morphAttributes.color!==void 0,x=d.morphAttributes.position||[],D=d.morphAttributes.normal||[],F=d.morphAttributes.color||[];let N=0;R===!0&&(N=1),C===!0&&(N=2),y===!0&&(N=3);let L=d.attributes.position.count*N,U=1;L>e.maxTextureSize&&(U=Math.ceil(L/e.maxTextureSize),L=e.maxTextureSize);const I=new Float32Array(L*U*4*v),T=new RS(I,L,U,v);T.type=ja,T.needsUpdate=!0;const O=N*4;for(let Z=0;Z<v;Z++){const J=x[Z],lt=D[Z],q=F[Z],nt=L*U*4*Z;for(let j=0;j<J.count;j++){const K=j*O;R===!0&&(l.fromBufferAttribute(J,j),I[nt+K+0]=l.x,I[nt+K+1]=l.y,I[nt+K+2]=l.z,I[nt+K+3]=0),C===!0&&(l.fromBufferAttribute(lt,j),I[nt+K+4]=l.x,I[nt+K+5]=l.y,I[nt+K+6]=l.z,I[nt+K+7]=0),y===!0&&(l.fromBufferAttribute(q,j),I[nt+K+8]=l.x,I[nt+K+9]=l.y,I[nt+K+10]=l.z,I[nt+K+11]=q.itemSize===4?l.w:1)}}g={count:v,texture:T,size:new ye(L,U)},s.set(d,g),d.addEventListener("dispose",V)}if(h.isInstancedMesh===!0&&h.morphTexture!==null)m.getUniforms().setValue(o,"morphTexture",h.morphTexture,i);else{let R=0;for(let y=0;y<p.length;y++)R+=p[y];const C=d.morphTargetsRelative?1:1-R;m.getUniforms().setValue(o,"morphTargetBaseInfluence",C),m.getUniforms().setValue(o,"morphTargetInfluences",p)}m.getUniforms().setValue(o,"morphTargetsTexture",g.texture,i),m.getUniforms().setValue(o,"morphTargetsTextureSize",g.size)}return{update:f}}function h2(o,e,i,s,l){let f=new WeakMap;function h(p){const S=l.render.frame,v=p.geometry,g=e.get(p,v);if(f.get(g)!==S&&(e.update(g),f.set(g,S)),p.isInstancedMesh&&(p.hasEventListener("dispose",m)===!1&&p.addEventListener("dispose",m),f.get(p)!==S&&(i.update(p.instanceMatrix,o.ARRAY_BUFFER),p.instanceColor!==null&&i.update(p.instanceColor,o.ARRAY_BUFFER),f.set(p,S))),p.isSkinnedMesh){const M=p.skeleton;f.get(M)!==S&&(M.update(),f.set(M,S))}return g}function d(){f=new WeakMap}function m(p){const S=p.target;S.removeEventListener("dispose",m),s.releaseStatesOfObject(S),i.remove(S.instanceMatrix),S.instanceColor!==null&&i.remove(S.instanceColor)}return{update:h,dispose:d}}const d2={[fS]:"LINEAR_TONE_MAPPING",[hS]:"REINHARD_TONE_MAPPING",[dS]:"CINEON_TONE_MAPPING",[pS]:"ACES_FILMIC_TONE_MAPPING",[gS]:"AGX_TONE_MAPPING",[_S]:"NEUTRAL_TONE_MAPPING",[mS]:"CUSTOM_TONE_MAPPING"};function p2(o,e,i,s,l,f){const h=new Ca(e,i,{type:o,depthBuffer:l,stencilBuffer:f,samples:s?4:0,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,resolveDepthBuffer:!1,resolveStencilBuffer:!1});let d=null,m=null;const p=new ta;p.setAttribute("position",new jn([-1,3,0,-1,-1,0,3,-1,0],3)),p.setAttribute("uv",new jn([0,2,0,0,2,0],2));const S=new eT({uniforms:{tDiffuse:{value:null}},vertexShader:`
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
			}`,depthTest:!1,depthWrite:!1}),v=new he(p,S),g=new Im(-1,1,1,-1,0,1);let M=null,R=null,C=!1,y,x=null,D=[],F=!1;this.setSize=function(N,L){h.setSize(N,L),d!==null&&d.setSize(N,L),m!==null&&m.setSize(N,L);for(let U=0;U<D.length;U++){const I=D[U];I.setSize&&I.setSize(N,L)}},this.setEffects=function(N){D=N,F=D.length>0&&D[0].isRenderPass===!0;const L=h.width,U=h.height;D.length>0&&d===null&&(d=new Ca(L,U,{type:Ja,depthBuffer:!1,stencilBuffer:!1}),m=new Ca(L,U,{type:Ja,depthBuffer:!1,stencilBuffer:!1}));for(let I=0;I<D.length;I++){const T=D[I];T.setSize&&T.setSize(L,U)}},this.begin=function(N,L){if(C||N.toneMapping===Ka&&D.length===0)return!1;if(x=L,L!==null){const U=L.width,I=L.height;(h.width!==U||h.height!==I)&&this.setSize(U,I)}return F===!1&&N.setRenderTarget(h),y=N.toneMapping,N.toneMapping=Ka,!0},this.hasRenderPass=function(){return F},this.end=function(N,L){N.toneMapping=y,C=!0;let U=h,I=d;for(let T=0;T<D.length;T++){const O=D[T];O.enabled!==!1&&(O.render(N,I,U,L),O.needsSwap!==!1&&(U=I,I=I===d?m:d))}if(M!==N.outputColorSpace||R!==N.toneMapping){M=N.outputColorSpace,R=N.toneMapping,S.defines={},qe.getTransfer(M)===cn&&(S.defines.SRGB_TRANSFER="");const T=d2[R];T&&(S.defines[T]=""),S.needsUpdate=!0}S.uniforms.tDiffuse.value=U.texture,N.setRenderTarget(x),N.render(v,g),x=null,C=!1},this.isCompositing=function(){return C},this.dispose=function(){h.dispose(),d!==null&&d.dispose(),m!==null&&m.dispose(),p.dispose(),S.dispose()}}const HS=new Ti,gm=new rc(1,1),GS=new RS,VS=new Cb,kS=new US,Fx=[],Hx=[],Gx=new Float32Array(16),Vx=new Float32Array(9),kx=new Float32Array(4);function Jo(o,e,i){const s=o[0];if(s<=0||s>0)return o;const l=e*i;let f=Fx[l];if(f===void 0&&(f=new Float32Array(l),Fx[l]=f),e!==0){s.toArray(f,0);for(let h=1,d=0;h!==e;++h)d+=i,o[h].toArray(f,d)}return f}function Hn(o,e){if(o.length!==e.length)return!1;for(let i=0,s=o.length;i<s;i++)if(o[i]!==e[i])return!1;return!0}function Gn(o,e){for(let i=0,s=e.length;i<s;i++)o[i]=e[i]}function Mf(o,e){let i=Hx[e];i===void 0&&(i=new Int32Array(e),Hx[e]=i);for(let s=0;s!==e;++s)i[s]=o.allocateTextureUnit();return i}function m2(o,e){const i=this.cache;i[0]!==e&&(o.uniform1f(this.addr,e),i[0]=e)}function g2(o,e){const i=this.cache;if(e.x!==void 0)(i[0]!==e.x||i[1]!==e.y)&&(o.uniform2f(this.addr,e.x,e.y),i[0]=e.x,i[1]=e.y);else{if(Hn(i,e))return;o.uniform2fv(this.addr,e),Gn(i,e)}}function _2(o,e){const i=this.cache;if(e.x!==void 0)(i[0]!==e.x||i[1]!==e.y||i[2]!==e.z)&&(o.uniform3f(this.addr,e.x,e.y,e.z),i[0]=e.x,i[1]=e.y,i[2]=e.z);else if(e.r!==void 0)(i[0]!==e.r||i[1]!==e.g||i[2]!==e.b)&&(o.uniform3f(this.addr,e.r,e.g,e.b),i[0]=e.r,i[1]=e.g,i[2]=e.b);else{if(Hn(i,e))return;o.uniform3fv(this.addr,e),Gn(i,e)}}function v2(o,e){const i=this.cache;if(e.x!==void 0)(i[0]!==e.x||i[1]!==e.y||i[2]!==e.z||i[3]!==e.w)&&(o.uniform4f(this.addr,e.x,e.y,e.z,e.w),i[0]=e.x,i[1]=e.y,i[2]=e.z,i[3]=e.w);else{if(Hn(i,e))return;o.uniform4fv(this.addr,e),Gn(i,e)}}function x2(o,e){const i=this.cache,s=e.elements;if(s===void 0){if(Hn(i,e))return;o.uniformMatrix2fv(this.addr,!1,e),Gn(i,e)}else{if(Hn(i,s))return;kx.set(s),o.uniformMatrix2fv(this.addr,!1,kx),Gn(i,s)}}function S2(o,e){const i=this.cache,s=e.elements;if(s===void 0){if(Hn(i,e))return;o.uniformMatrix3fv(this.addr,!1,e),Gn(i,e)}else{if(Hn(i,s))return;Vx.set(s),o.uniformMatrix3fv(this.addr,!1,Vx),Gn(i,s)}}function y2(o,e){const i=this.cache,s=e.elements;if(s===void 0){if(Hn(i,e))return;o.uniformMatrix4fv(this.addr,!1,e),Gn(i,e)}else{if(Hn(i,s))return;Gx.set(s),o.uniformMatrix4fv(this.addr,!1,Gx),Gn(i,s)}}function M2(o,e){const i=this.cache;i[0]!==e&&(o.uniform1i(this.addr,e),i[0]=e)}function E2(o,e){const i=this.cache;if(e.x!==void 0)(i[0]!==e.x||i[1]!==e.y)&&(o.uniform2i(this.addr,e.x,e.y),i[0]=e.x,i[1]=e.y);else{if(Hn(i,e))return;o.uniform2iv(this.addr,e),Gn(i,e)}}function b2(o,e){const i=this.cache;if(e.x!==void 0)(i[0]!==e.x||i[1]!==e.y||i[2]!==e.z)&&(o.uniform3i(this.addr,e.x,e.y,e.z),i[0]=e.x,i[1]=e.y,i[2]=e.z);else{if(Hn(i,e))return;o.uniform3iv(this.addr,e),Gn(i,e)}}function T2(o,e){const i=this.cache;if(e.x!==void 0)(i[0]!==e.x||i[1]!==e.y||i[2]!==e.z||i[3]!==e.w)&&(o.uniform4i(this.addr,e.x,e.y,e.z,e.w),i[0]=e.x,i[1]=e.y,i[2]=e.z,i[3]=e.w);else{if(Hn(i,e))return;o.uniform4iv(this.addr,e),Gn(i,e)}}function A2(o,e){const i=this.cache;i[0]!==e&&(o.uniform1ui(this.addr,e),i[0]=e)}function R2(o,e){const i=this.cache;if(e.x!==void 0)(i[0]!==e.x||i[1]!==e.y)&&(o.uniform2ui(this.addr,e.x,e.y),i[0]=e.x,i[1]=e.y);else{if(Hn(i,e))return;o.uniform2uiv(this.addr,e),Gn(i,e)}}function w2(o,e){const i=this.cache;if(e.x!==void 0)(i[0]!==e.x||i[1]!==e.y||i[2]!==e.z)&&(o.uniform3ui(this.addr,e.x,e.y,e.z),i[0]=e.x,i[1]=e.y,i[2]=e.z);else{if(Hn(i,e))return;o.uniform3uiv(this.addr,e),Gn(i,e)}}function C2(o,e){const i=this.cache;if(e.x!==void 0)(i[0]!==e.x||i[1]!==e.y||i[2]!==e.z||i[3]!==e.w)&&(o.uniform4ui(this.addr,e.x,e.y,e.z,e.w),i[0]=e.x,i[1]=e.y,i[2]=e.z,i[3]=e.w);else{if(Hn(i,e))return;o.uniform4uiv(this.addr,e),Gn(i,e)}}function N2(o,e,i){const s=this.cache,l=i.allocateTextureUnit();s[0]!==l&&(o.uniform1i(this.addr,l),s[0]=l);let f;this.type===o.SAMPLER_2D_SHADOW?(gm.compareFunction=i.isReversedDepthBuffer()?Cm:wm,f=gm):f=HS,i.setTexture2D(e||f,l)}function D2(o,e,i){const s=this.cache,l=i.allocateTextureUnit();s[0]!==l&&(o.uniform1i(this.addr,l),s[0]=l),i.setTexture3D(e||VS,l)}function U2(o,e,i){const s=this.cache,l=i.allocateTextureUnit();s[0]!==l&&(o.uniform1i(this.addr,l),s[0]=l),i.setTextureCube(e||kS,l)}function L2(o,e,i){const s=this.cache,l=i.allocateTextureUnit();s[0]!==l&&(o.uniform1i(this.addr,l),s[0]=l),i.setTexture2DArray(e||GS,l)}function O2(o){switch(o){case 5126:return m2;case 35664:return g2;case 35665:return _2;case 35666:return v2;case 35674:return x2;case 35675:return S2;case 35676:return y2;case 5124:case 35670:return M2;case 35667:case 35671:return E2;case 35668:case 35672:return b2;case 35669:case 35673:return T2;case 5125:return A2;case 36294:return R2;case 36295:return w2;case 36296:return C2;case 35678:case 36198:case 36298:case 36306:case 35682:return N2;case 35679:case 36299:case 36307:return D2;case 35680:case 36300:case 36308:case 36293:return U2;case 36289:case 36303:case 36311:case 36292:return L2}}function P2(o,e){o.uniform1fv(this.addr,e)}function I2(o,e){const i=Jo(e,this.size,2);o.uniform2fv(this.addr,i)}function z2(o,e){const i=Jo(e,this.size,3);o.uniform3fv(this.addr,i)}function B2(o,e){const i=Jo(e,this.size,4);o.uniform4fv(this.addr,i)}function F2(o,e){const i=Jo(e,this.size,4);o.uniformMatrix2fv(this.addr,!1,i)}function H2(o,e){const i=Jo(e,this.size,9);o.uniformMatrix3fv(this.addr,!1,i)}function G2(o,e){const i=Jo(e,this.size,16);o.uniformMatrix4fv(this.addr,!1,i)}function V2(o,e){o.uniform1iv(this.addr,e)}function k2(o,e){o.uniform2iv(this.addr,e)}function X2(o,e){o.uniform3iv(this.addr,e)}function W2(o,e){o.uniform4iv(this.addr,e)}function Y2(o,e){o.uniform1uiv(this.addr,e)}function q2(o,e){o.uniform2uiv(this.addr,e)}function j2(o,e){o.uniform3uiv(this.addr,e)}function Z2(o,e){o.uniform4uiv(this.addr,e)}function K2(o,e,i){const s=this.cache,l=e.length,f=Mf(i,l);Hn(s,f)||(o.uniform1iv(this.addr,f),Gn(s,f));let h;this.type===o.SAMPLER_2D_SHADOW?h=gm:h=HS;for(let d=0;d!==l;++d)i.setTexture2D(e[d]||h,f[d])}function Q2(o,e,i){const s=this.cache,l=e.length,f=Mf(i,l);Hn(s,f)||(o.uniform1iv(this.addr,f),Gn(s,f));for(let h=0;h!==l;++h)i.setTexture3D(e[h]||VS,f[h])}function J2(o,e,i){const s=this.cache,l=e.length,f=Mf(i,l);Hn(s,f)||(o.uniform1iv(this.addr,f),Gn(s,f));for(let h=0;h!==l;++h)i.setTextureCube(e[h]||kS,f[h])}function $2(o,e,i){const s=this.cache,l=e.length,f=Mf(i,l);Hn(s,f)||(o.uniform1iv(this.addr,f),Gn(s,f));for(let h=0;h!==l;++h)i.setTexture2DArray(e[h]||GS,f[h])}function tR(o){switch(o){case 5126:return P2;case 35664:return I2;case 35665:return z2;case 35666:return B2;case 35674:return F2;case 35675:return H2;case 35676:return G2;case 5124:case 35670:return V2;case 35667:case 35671:return k2;case 35668:case 35672:return X2;case 35669:case 35673:return W2;case 5125:return Y2;case 36294:return q2;case 36295:return j2;case 36296:return Z2;case 35678:case 36198:case 36298:case 36306:case 35682:return K2;case 35679:case 36299:case 36307:return Q2;case 35680:case 36300:case 36308:case 36293:return J2;case 36289:case 36303:case 36311:case 36292:return $2}}class eR{constructor(e,i,s){this.id=e,this.addr=s,this.cache=[],this.type=i.type,this.setValue=O2(i.type)}}class nR{constructor(e,i,s){this.id=e,this.addr=s,this.cache=[],this.type=i.type,this.size=i.size,this.setValue=tR(i.type)}}class iR{constructor(e){this.id=e,this.seq=[],this.map={}}setValue(e,i,s){const l=this.seq;for(let f=0,h=l.length;f!==h;++f){const d=l[f];d.setValue(e,i[d.id],s)}}}const Tp=/(\w+)(\])?(\[|\.)?/g;function Xx(o,e){o.seq.push(e),o.map[e.id]=e}function aR(o,e,i){const s=o.name,l=s.length;for(Tp.lastIndex=0;;){const f=Tp.exec(s),h=Tp.lastIndex;let d=f[1];const m=f[2]==="]",p=f[3];if(m&&(d=d|0),p===void 0||p==="["&&h+2===l){Xx(i,p===void 0?new eR(d,o,e):new nR(d,o,e));break}else{let v=i.map[d];v===void 0&&(v=new iR(d),Xx(i,v)),i=v}}}class lf{constructor(e,i){this.seq=[],this.map={};const s=e.getProgramParameter(i,e.ACTIVE_UNIFORMS);for(let h=0;h<s;++h){const d=e.getActiveUniform(i,h),m=e.getUniformLocation(i,d.name);aR(d,m,this)}const l=[],f=[];for(const h of this.seq)h.type===e.SAMPLER_2D_SHADOW||h.type===e.SAMPLER_CUBE_SHADOW||h.type===e.SAMPLER_2D_ARRAY_SHADOW?l.push(h):f.push(h);l.length>0&&(this.seq=l.concat(f))}setValue(e,i,s,l){const f=this.map[i];f!==void 0&&f.setValue(e,s,l)}setOptional(e,i,s){const l=i[s];l!==void 0&&this.setValue(e,s,l)}static upload(e,i,s,l){for(let f=0,h=i.length;f!==h;++f){const d=i[f],m=s[d.id];m.needsUpdate!==!1&&d.setValue(e,m.value,l)}}static seqWithValue(e,i){const s=[];for(let l=0,f=e.length;l!==f;++l){const h=e[l];h.id in i&&s.push(h)}return s}}function Wx(o,e,i){const s=o.createShader(e);return o.shaderSource(s,i),o.compileShader(s),s}const sR=37297;let rR=0;function oR(o,e){const i=o.split(`
`),s=[],l=Math.max(e-6,0),f=Math.min(e+6,i.length);for(let h=l;h<f;h++){const d=h+1;s.push(`${d===e?">":" "} ${d}: ${i[h]}`)}return s.join(`
`)}const Yx=new Te;function lR(o){qe._getMatrix(Yx,qe.workingColorSpace,o);const e=`mat3( ${Yx.elements.map(i=>i.toFixed(4))} )`;switch(qe.getTransfer(o)){case hf:return[e,"LinearTransferOETF"];case cn:return[e,"sRGBTransferOETF"];default:return xe("WebGLProgram: Unsupported color space: ",o),[e,"LinearTransferOETF"]}}function qx(o,e,i){const s=o.getShaderParameter(e,o.COMPILE_STATUS),f=(o.getShaderInfoLog(e)||"").trim();if(s&&f==="")return"";const h=/ERROR: 0:(\d+)/.exec(f);if(h){const d=parseInt(h[1]);return i.toUpperCase()+`

`+f+`

`+oR(o.getShaderSource(e),d)}else return f}function cR(o,e){const i=lR(e);return[`vec4 ${o}( vec4 value ) {`,`	return ${i[1]}( vec4( value.rgb * ${i[0]}, value.a ) );`,"}"].join(`
`)}const uR={[fS]:"Linear",[hS]:"Reinhard",[dS]:"Cineon",[pS]:"ACESFilmic",[gS]:"AgX",[_S]:"Neutral",[mS]:"Custom"};function fR(o,e){const i=uR[e];return i===void 0?(xe("WebGLProgram: Unsupported toneMapping:",e),"vec3 "+o+"( vec3 color ) { return LinearToneMapping( color ); }"):"vec3 "+o+"( vec3 color ) { return "+i+"ToneMapping( color ); }"}const ef=new k;function hR(){qe.getLuminanceCoefficients(ef);const o=ef.x.toFixed(4),e=ef.y.toFixed(4),i=ef.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${o}, ${e}, ${i} );`,"	return dot( weights, rgb );","}"].join(`
`)}function dR(o){return[o.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",o.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(Ql).join(`
`)}function pR(o){const e=[];for(const i in o){const s=o[i];s!==!1&&e.push("#define "+i+" "+s)}return e.join(`
`)}function mR(o,e){const i={},s=o.getProgramParameter(e,o.ACTIVE_ATTRIBUTES);for(let l=0;l<s;l++){const f=o.getActiveAttrib(e,l),h=f.name;let d=1;f.type===o.FLOAT_MAT2&&(d=2),f.type===o.FLOAT_MAT3&&(d=3),f.type===o.FLOAT_MAT4&&(d=4),i[h]={type:f.type,location:o.getAttribLocation(e,h),locationSize:d}}return i}function Ql(o){return o!==""}function jx(o,e){const i=e.numSpotLightShadows+e.numSpotLightMaps-e.numSpotLightShadowsWithMaps;return o.replace(/NUM_SUN_LIGHTS/g,e.numSunLights).replace(/NUM_DIR_LIGHTS/g,e.numDirLights).replace(/NUM_SPOT_LIGHTS/g,e.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,e.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,i).replace(/NUM_RECT_AREA_LIGHTS/g,e.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,e.numPointLights).replace(/NUM_HEMI_LIGHTS/g,e.numHemiLights).replace(/NUM_SUN_LIGHT_SHADOWS/g,e.numSunLightShadows).replace(/NUM_DIR_LIGHT_SHADOWS/g,e.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,e.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,e.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,e.numPointLightShadows)}function Zx(o,e){return o.replace(/NUM_CLIPPING_PLANES/g,e.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,e.numClippingPlanes-e.numClipIntersection)}const gR=/^[ \t]*#include +<([\w\d./]+)>/gm;function _m(o){return o.replace(gR,vR)}const _R=new Map;function vR(o,e){let i=De[e];if(i===void 0){const s=_R.get(e);if(s!==void 0)i=De[s],xe('WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',e,s);else throw new Error("THREE.WebGLProgram: Can not resolve #include <"+e+">")}return _m(i)}const xR=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function Kx(o){return o.replace(xR,SR)}function SR(o,e,i,s){let l="";for(let f=parseInt(e);f<parseInt(i);f++)l+=s.replace(/\[\s*i\s*\]/g,"[ "+f+" ]").replace(/UNROLLED_LOOP_INDEX/g,f);return l}function Qx(o){let e=`precision ${o.precision} float;
	precision ${o.precision} int;
	precision ${o.precision} sampler2D;
	precision ${o.precision} samplerCube;
	precision ${o.precision} sampler3D;
	precision ${o.precision} sampler2DArray;
	precision ${o.precision} sampler2DShadow;
	precision ${o.precision} samplerCubeShadow;
	precision ${o.precision} sampler2DArrayShadow;
	precision ${o.precision} isampler2D;
	precision ${o.precision} isampler3D;
	precision ${o.precision} isamplerCube;
	precision ${o.precision} isampler2DArray;
	precision ${o.precision} usampler2D;
	precision ${o.precision} usampler3D;
	precision ${o.precision} usamplerCube;
	precision ${o.precision} usampler2DArray;
	`;return o.precision==="highp"?e+=`
#define HIGH_PRECISION`:o.precision==="mediump"?e+=`
#define MEDIUM_PRECISION`:o.precision==="lowp"&&(e+=`
#define LOW_PRECISION`),e}const yR={[Jl]:"SHADOWMAP_TYPE_PCF",[Kl]:"SHADOWMAP_TYPE_VSM"};function MR(o){return yR[o.shadowMapType]||"SHADOWMAP_TYPE_BASIC"}const ER={[Xr]:"ENVMAP_TYPE_CUBE",[Zo]:"ENVMAP_TYPE_CUBE",[vf]:"ENVMAP_TYPE_CUBE_UV"};function bR(o){return o.envMap===!1?"ENVMAP_TYPE_CUBE":ER[o.envMapMode]||"ENVMAP_TYPE_CUBE"}const TR={[Zo]:"ENVMAP_MODE_REFRACTION"};function AR(o){return o.envMap===!1?"ENVMAP_MODE_REFLECTION":TR[o.envMapMode]||"ENVMAP_MODE_REFLECTION"}const RR={[uS]:"ENVMAP_BLENDING_MULTIPLY",[sb]:"ENVMAP_BLENDING_MIX",[rb]:"ENVMAP_BLENDING_ADD"};function wR(o){return o.envMap===!1?"ENVMAP_BLENDING_NONE":RR[o.combine]||"ENVMAP_BLENDING_NONE"}function CR(o){const e=o.envMapCubeUVHeight;if(e===null)return null;const i=Math.log2(e)-2,s=1/e;return{texelWidth:1/(3*Math.max(Math.pow(2,i),112)),texelHeight:s,maxMip:i}}function NR(o,e,i,s){const l=o.getContext(),f=i.defines;let h=i.vertexShader,d=i.fragmentShader;const m=MR(i),p=bR(i),S=AR(i),v=wR(i),g=CR(i),M=dR(i),R=pR(f),C=l.createProgram();let y,x,D=i.glslVersion?"#version "+i.glslVersion+`
`:"";i.isRawShaderMaterial?(y=["#define SHADER_TYPE "+i.shaderType,"#define SHADER_NAME "+i.shaderName,R].filter(Ql).join(`
`),y.length>0&&(y+=`
`),x=["#define SHADER_TYPE "+i.shaderType,"#define SHADER_NAME "+i.shaderName,R].filter(Ql).join(`
`),x.length>0&&(x+=`
`)):(y=[Qx(i),"#define SHADER_TYPE "+i.shaderType,"#define SHADER_NAME "+i.shaderName,R,i.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",i.batching?"#define USE_BATCHING":"",i.batchingColor?"#define USE_BATCHING_COLOR":"",i.instancing?"#define USE_INSTANCING":"",i.instancingColor?"#define USE_INSTANCING_COLOR":"",i.instancingMorph?"#define USE_INSTANCING_MORPH":"",i.useFog&&i.fog?"#define USE_FOG":"",i.useFog&&i.fogExp2?"#define FOG_EXP2":"",i.map?"#define USE_MAP":"",i.envMap?"#define USE_ENVMAP":"",i.envMap?"#define "+S:"",i.lightMap?"#define USE_LIGHTMAP":"",i.aoMap?"#define USE_AOMAP":"",i.bumpMap?"#define USE_BUMPMAP":"",i.normalMap?"#define USE_NORMALMAP":"",i.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",i.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",i.displacementMap?"#define USE_DISPLACEMENTMAP":"",i.emissiveMap?"#define USE_EMISSIVEMAP":"",i.anisotropy?"#define USE_ANISOTROPY":"",i.anisotropyMap?"#define USE_ANISOTROPYMAP":"",i.clearcoatMap?"#define USE_CLEARCOATMAP":"",i.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",i.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",i.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",i.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",i.specularMap?"#define USE_SPECULARMAP":"",i.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",i.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",i.roughnessMap?"#define USE_ROUGHNESSMAP":"",i.metalnessMap?"#define USE_METALNESSMAP":"",i.alphaMap?"#define USE_ALPHAMAP":"",i.alphaHash?"#define USE_ALPHAHASH":"",i.transmission?"#define USE_TRANSMISSION":"",i.transmissionMap?"#define USE_TRANSMISSIONMAP":"",i.thicknessMap?"#define USE_THICKNESSMAP":"",i.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",i.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",i.mapUv?"#define MAP_UV "+i.mapUv:"",i.alphaMapUv?"#define ALPHAMAP_UV "+i.alphaMapUv:"",i.lightMapUv?"#define LIGHTMAP_UV "+i.lightMapUv:"",i.aoMapUv?"#define AOMAP_UV "+i.aoMapUv:"",i.emissiveMapUv?"#define EMISSIVEMAP_UV "+i.emissiveMapUv:"",i.bumpMapUv?"#define BUMPMAP_UV "+i.bumpMapUv:"",i.normalMapUv?"#define NORMALMAP_UV "+i.normalMapUv:"",i.displacementMapUv?"#define DISPLACEMENTMAP_UV "+i.displacementMapUv:"",i.metalnessMapUv?"#define METALNESSMAP_UV "+i.metalnessMapUv:"",i.roughnessMapUv?"#define ROUGHNESSMAP_UV "+i.roughnessMapUv:"",i.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+i.anisotropyMapUv:"",i.clearcoatMapUv?"#define CLEARCOATMAP_UV "+i.clearcoatMapUv:"",i.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+i.clearcoatNormalMapUv:"",i.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+i.clearcoatRoughnessMapUv:"",i.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+i.iridescenceMapUv:"",i.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+i.iridescenceThicknessMapUv:"",i.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+i.sheenColorMapUv:"",i.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+i.sheenRoughnessMapUv:"",i.specularMapUv?"#define SPECULARMAP_UV "+i.specularMapUv:"",i.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+i.specularColorMapUv:"",i.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+i.specularIntensityMapUv:"",i.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+i.transmissionMapUv:"",i.thicknessMapUv?"#define THICKNESSMAP_UV "+i.thicknessMapUv:"",i.vertexTangents&&i.flatShading===!1?"#define USE_TANGENT":"",i.vertexNormals?"#define HAS_NORMAL":"",i.vertexColors?"#define USE_COLOR":"",i.vertexAlphas?"#define USE_COLOR_ALPHA":"",i.vertexUv1s?"#define USE_UV1":"",i.vertexUv2s?"#define USE_UV2":"",i.vertexUv3s?"#define USE_UV3":"",i.pointsUvs?"#define USE_POINTS_UV":"",i.flatShading?"#define FLAT_SHADED":"",i.skinning?"#define USE_SKINNING":"",i.morphTargets?"#define USE_MORPHTARGETS":"",i.morphNormals&&i.flatShading===!1?"#define USE_MORPHNORMALS":"",i.morphColors?"#define USE_MORPHCOLORS":"",i.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+i.morphTextureStride:"",i.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+i.morphTargetsCount:"",i.doubleSided?"#define DOUBLE_SIDED":"",i.flipSided?"#define FLIP_SIDED":"",i.shadowMapEnabled?"#define USE_SHADOWMAP":"",i.shadowMapEnabled?"#define "+m:"",i.sizeAttenuation?"#define USE_SIZEATTENUATION":"",i.numLightProbes>0?"#define USE_LIGHT_PROBES":"",i.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",i.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(Ql).join(`
`),x=[Qx(i),"#define SHADER_TYPE "+i.shaderType,"#define SHADER_NAME "+i.shaderName,R,i.useFog&&i.fog?"#define USE_FOG":"",i.useFog&&i.fogExp2?"#define FOG_EXP2":"",i.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",i.map?"#define USE_MAP":"",i.matcap?"#define USE_MATCAP":"",i.envMap?"#define USE_ENVMAP":"",i.envMap?"#define "+p:"",i.envMap?"#define "+S:"",i.envMap?"#define "+v:"",g?"#define CUBEUV_TEXEL_WIDTH "+g.texelWidth:"",g?"#define CUBEUV_TEXEL_HEIGHT "+g.texelHeight:"",g?"#define CUBEUV_MAX_MIP "+g.maxMip+".0":"",i.lightMap?"#define USE_LIGHTMAP":"",i.aoMap?"#define USE_AOMAP":"",i.bumpMap?"#define USE_BUMPMAP":"",i.normalMap?"#define USE_NORMALMAP":"",i.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",i.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",i.packedNormalMap?"#define USE_PACKED_NORMALMAP":"",i.emissiveMap?"#define USE_EMISSIVEMAP":"",i.anisotropy?"#define USE_ANISOTROPY":"",i.anisotropyMap?"#define USE_ANISOTROPYMAP":"",i.clearcoat?"#define USE_CLEARCOAT":"",i.clearcoatMap?"#define USE_CLEARCOATMAP":"",i.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",i.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",i.dispersion?"#define USE_DISPERSION":"",i.retroreflection?"#define USE_RETROREFLECTION":"",i.iridescence?"#define USE_IRIDESCENCE":"",i.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",i.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",i.specularMap?"#define USE_SPECULARMAP":"",i.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",i.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",i.roughnessMap?"#define USE_ROUGHNESSMAP":"",i.metalnessMap?"#define USE_METALNESSMAP":"",i.alphaMap?"#define USE_ALPHAMAP":"",i.alphaTest?"#define USE_ALPHATEST":"",i.alphaHash?"#define USE_ALPHAHASH":"",i.sheen?"#define USE_SHEEN":"",i.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",i.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",i.transmission?"#define USE_TRANSMISSION":"",i.transmissionMap?"#define USE_TRANSMISSIONMAP":"",i.thicknessMap?"#define USE_THICKNESSMAP":"",i.vertexTangents&&i.flatShading===!1?"#define USE_TANGENT":"",i.vertexColors||i.instancingColor?"#define USE_COLOR":"",i.vertexAlphas||i.batchingColor?"#define USE_COLOR_ALPHA":"",i.vertexUv1s?"#define USE_UV1":"",i.vertexUv2s?"#define USE_UV2":"",i.vertexUv3s?"#define USE_UV3":"",i.pointsUvs?"#define USE_POINTS_UV":"",i.gradientMap?"#define USE_GRADIENTMAP":"",i.flatShading?"#define FLAT_SHADED":"",i.doubleSided?"#define DOUBLE_SIDED":"",i.flipSided?"#define FLIP_SIDED":"",i.shadowMapEnabled?"#define USE_SHADOWMAP":"",i.shadowMapEnabled?"#define "+m:"",i.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",i.numLightProbes>0?"#define USE_LIGHT_PROBES":"",i.numLightProbeGrids>0?"#define USE_LIGHT_PROBES_GRID":"",i.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",i.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",i.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",i.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",i.toneMapping!==Ka?"#define TONE_MAPPING":"",i.toneMapping!==Ka?De.tonemapping_pars_fragment:"",i.toneMapping!==Ka?fR("toneMapping",i.toneMapping):"",i.dithering?"#define DITHERING":"",i.opaque?"#define OPAQUE":"",De.colorspace_pars_fragment,cR("linearToOutputTexel",i.outputColorSpace),hR(),i.useDepthPacking?"#define DEPTH_PACKING "+i.depthPacking:"",`
`].filter(Ql).join(`
`)),h=_m(h),h=jx(h,i),h=Zx(h,i),d=_m(d),d=jx(d,i),d=Zx(d,i),h=Kx(h),d=Kx(d),i.isRawShaderMaterial!==!0&&(D=`#version 300 es
`,y=[M,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+y,x=["#define varying in",i.glslVersion===ex?"":"layout(location = 0) out highp vec4 pc_fragColor;",i.glslVersion===ex?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+x);const F=D+y+h,N=D+x+d,L=Wx(l,l.VERTEX_SHADER,F),U=Wx(l,l.FRAGMENT_SHADER,N);l.attachShader(C,L),l.attachShader(C,U),i.index0AttributeName!==void 0?l.bindAttribLocation(C,0,i.index0AttributeName):i.hasPositionAttribute===!0&&l.bindAttribLocation(C,0,"position"),l.linkProgram(C);function I(Z){if(o.debug.checkShaderErrors){const J=l.getProgramInfoLog(C)||"",lt=l.getShaderInfoLog(L)||"",q=l.getShaderInfoLog(U)||"",nt=J.trim(),j=lt.trim(),K=q.trim();let dt=!0,ut=!0;if(l.getProgramParameter(C,l.LINK_STATUS)===!1)if(dt=!1,typeof o.debug.onShaderError=="function")o.debug.onShaderError(l,C,L,U);else{const mt=qx(l,L,"vertex"),gt=qx(l,U,"fragment");Je("WebGLProgram: Shader Error "+l.getError()+" - VALIDATE_STATUS "+l.getProgramParameter(C,l.VALIDATE_STATUS)+`

Material Name: `+Z.name+`
Material Type: `+Z.type+`

Program Info Log: `+nt+`
`+mt+`
`+gt)}else nt!==""?xe("WebGLProgram: Program Info Log:",nt):(j===""||K==="")&&(ut=!1);ut&&(Z.diagnostics={runnable:dt,programLog:nt,vertexShader:{log:j,prefix:y},fragmentShader:{log:K,prefix:x}})}l.deleteShader(L),l.deleteShader(U),T=new lf(l,C),O=mR(l,C)}let T;this.getUniforms=function(){return T===void 0&&I(this),T};let O;this.getAttributes=function(){return O===void 0&&I(this),O};let V=i.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return V===!1&&(V=l.getProgramParameter(C,sR)),V},this.destroy=function(){s.releaseStatesOfProgram(this),l.deleteProgram(C),this.program=void 0},this.type=i.shaderType,this.name=i.shaderName,this.id=rR++,this.cacheKey=e,this.usedTimes=1,this.program=C,this.vertexShader=L,this.fragmentShader=U,this}let DR=0;class UR{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(e,i,s){const l=this._getShaderCacheForMaterial(e);return l.has(i)===!1&&(l.add(i),i.usedTimes++),l.has(s)===!1&&(l.add(s),s.usedTimes++),this}remove(e){const i=this.materialCache.get(e);for(const s of i)s.usedTimes--,s.usedTimes===0&&this.shaderCache.delete(s.code);return this.materialCache.delete(e),this}getVertexShaderStage(e){return this._getShaderStage(e.vertexShader)}getFragmentShaderStage(e){return this._getShaderStage(e.fragmentShader)}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(e){const i=this.materialCache;let s=i.get(e);return s===void 0&&(s=new Set,i.set(e,s)),s}_getShaderStage(e){const i=this.shaderCache;let s=i.get(e);return s===void 0&&(s=new LR(e),i.set(e,s)),s}}class LR{constructor(e){this.id=DR++,this.code=e,this.usedTimes=0}}function OR(o){return o===Wr||o===cf||o===uf}function PR(o,e,i,s,l,f){const h=new Dm,d=new UR,m=new Set,p=[],S=new Map,v=s.logarithmicDepthBuffer;let g=s.precision;const M={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distance",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function R(T){return m.add(T),T===0?"uv":`uv${T}`}function C(T,O,V,Z,J,lt){const q=Z.fog,nt=J.geometry,j=T.isMeshStandardMaterial||T.isMeshLambertMaterial||T.isMeshPhongMaterial?Z.environment:null,K=T.isMeshStandardMaterial||T.isMeshLambertMaterial&&!T.envMap||T.isMeshPhongMaterial&&!T.envMap,dt=e.get(T.envMap||j,K),ut=dt&&dt.mapping===vf?dt.image.height:null,mt=M[T.type];T.precision!==null&&(g=s.getMaxPrecision(T.precision),g!==T.precision&&xe("WebGLProgram.getParameters:",T.precision,"not supported, using",g,"instead."));const gt=nt.morphAttributes.position||nt.morphAttributes.normal||nt.morphAttributes.color,ie=gt!==void 0?gt.length:0;let ae=0;nt.morphAttributes.position!==void 0&&(ae=1),nt.morphAttributes.normal!==void 0&&(ae=2),nt.morphAttributes.color!==void 0&&(ae=3);let B,_t,Rt,$;if(mt){const Pe=qa[mt];B=Pe.vertexShader,_t=Pe.fragmentShader}else{B=T.vertexShader,_t=T.fragmentShader;const Pe=d.getVertexShaderStage(T),_e=d.getFragmentShaderStage(T);d.update(T,Pe,_e),Rt=Pe.id,$=_e.id}const pt=o.getRenderTarget(),Ct=o.state.buffers.depth.getReversed(),Yt=J.isInstancedMesh===!0,Mt=J.isBatchedMesh===!0,Ot=!!T.map,$e=!!T.matcap,Ee=!!dt,Ae=!!T.aoMap,Ne=!!T.lightMap,ce=!!T.bumpMap&&T.wireframe===!1,fe=!!T.normalMap,Jt=!!T.displacementMap,Mn=!!T.emissiveMap,je=!!T.metalnessMap,fn=!!T.roughnessMap,Y=T.anisotropy>0,pn=T.clearcoat>0,Ve=T.dispersion>0,P=T.retroreflectivity>0,E=T.iridescence>0,it=T.sheen>0,rt=T.transmission>0,vt=Y&&!!T.anisotropyMap,Lt=pn&&!!T.clearcoatMap,Ft=pn&&!!T.clearcoatNormalMap,St=pn&&!!T.clearcoatRoughnessMap,Et=E&&!!T.iridescenceMap,Ut=E&&!!T.iridescenceThicknessMap,Gt=it&&!!T.sheenColorMap,Dt=it&&!!T.sheenRoughnessMap,zt=!!T.specularMap,qt=!!T.specularColorMap,le=!!T.specularIntensityMap,me=rt&&!!T.transmissionMap,W=rt&&!!T.thicknessMap,Pt=!!T.gradientMap,yt=!!T.alphaMap,Bt=T.alphaTest>0,Wt=!!T.alphaHash,At=!!T.extensions;let se=Ka;T.toneMapped&&(pt===null||pt.isXRRenderTarget===!0)&&(se=o.toneMapping);const Ht={shaderID:mt,shaderType:T.type,shaderName:T.name,vertexShader:B,fragmentShader:_t,defines:T.defines,customVertexShaderID:Rt,customFragmentShaderID:$,isRawShaderMaterial:T.isRawShaderMaterial===!0,glslVersion:T.glslVersion,precision:g,batching:Mt,batchingColor:Mt&&J._colorsTexture!==null,instancing:Yt,instancingColor:Yt&&J.instanceColor!==null,instancingMorph:Yt&&J.morphTexture!==null,outputColorSpace:pt===null?o.outputColorSpace:pt.isXRRenderTarget===!0?pt.texture.colorSpace:qe.workingColorSpace,alphaToCoverage:!!T.alphaToCoverage,map:Ot,matcap:$e,envMap:Ee,envMapMode:Ee&&dt.mapping,envMapCubeUVHeight:ut,aoMap:Ae,lightMap:Ne,bumpMap:ce,normalMap:fe,displacementMap:Jt,emissiveMap:Mn,normalMapObjectSpace:fe&&T.normalMapType===cb,normalMapTangentSpace:fe&&T.normalMapType===dm,packedNormalMap:fe&&T.normalMapType===dm&&OR(T.normalMap.format),metalnessMap:je,roughnessMap:fn,anisotropy:Y,anisotropyMap:vt,clearcoat:pn,clearcoatMap:Lt,clearcoatNormalMap:Ft,clearcoatRoughnessMap:St,dispersion:Ve,retroreflection:P,iridescence:E,iridescenceMap:Et,iridescenceThicknessMap:Ut,sheen:it,sheenColorMap:Gt,sheenRoughnessMap:Dt,specularMap:zt,specularColorMap:qt,specularIntensityMap:le,transmission:rt,transmissionMap:me,thicknessMap:W,gradientMap:Pt,opaque:T.transparent===!1&&T.blending===$l&&T.alphaToCoverage===!1,alphaMap:yt,alphaTest:Bt,alphaHash:Wt,combine:T.combine,mapUv:Ot&&R(T.map.channel),aoMapUv:Ae&&R(T.aoMap.channel),lightMapUv:Ne&&R(T.lightMap.channel),bumpMapUv:ce&&R(T.bumpMap.channel),normalMapUv:fe&&R(T.normalMap.channel),displacementMapUv:Jt&&R(T.displacementMap.channel),emissiveMapUv:Mn&&R(T.emissiveMap.channel),metalnessMapUv:je&&R(T.metalnessMap.channel),roughnessMapUv:fn&&R(T.roughnessMap.channel),anisotropyMapUv:vt&&R(T.anisotropyMap.channel),clearcoatMapUv:Lt&&R(T.clearcoatMap.channel),clearcoatNormalMapUv:Ft&&R(T.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:St&&R(T.clearcoatRoughnessMap.channel),iridescenceMapUv:Et&&R(T.iridescenceMap.channel),iridescenceThicknessMapUv:Ut&&R(T.iridescenceThicknessMap.channel),sheenColorMapUv:Gt&&R(T.sheenColorMap.channel),sheenRoughnessMapUv:Dt&&R(T.sheenRoughnessMap.channel),specularMapUv:zt&&R(T.specularMap.channel),specularColorMapUv:qt&&R(T.specularColorMap.channel),specularIntensityMapUv:le&&R(T.specularIntensityMap.channel),transmissionMapUv:me&&R(T.transmissionMap.channel),thicknessMapUv:W&&R(T.thicknessMap.channel),alphaMapUv:yt&&R(T.alphaMap.channel),vertexTangents:!!nt.attributes.tangent&&(fe||Y),vertexNormals:!!nt.attributes.normal,vertexColors:T.vertexColors,vertexAlphas:T.vertexColors===!0&&!!nt.attributes.color&&nt.attributes.color.itemSize===4,pointsUvs:J.isPoints===!0&&!!nt.attributes.uv&&(Ot||yt),fog:!!q,useFog:T.fog===!0,fogExp2:!!q&&q.isFogExp2,flatShading:T.wireframe===!1&&(T.flatShading===!0||nt.attributes.normal===void 0&&fe===!1&&(T.isMeshLambertMaterial||T.isMeshPhongMaterial||T.isMeshStandardMaterial||T.isMeshPhysicalMaterial)),sizeAttenuation:T.sizeAttenuation===!0,logarithmicDepthBuffer:v,reversedDepthBuffer:Ct,skinning:J.isSkinnedMesh===!0,hasPositionAttribute:nt.attributes.position!==void 0,morphTargets:nt.morphAttributes.position!==void 0,morphNormals:nt.morphAttributes.normal!==void 0,morphColors:nt.morphAttributes.color!==void 0,morphTargetsCount:ie,morphTextureStride:ae,numSunLights:O.sun.length,numDirLights:O.directional.length,numPointLights:O.point.length,numSpotLights:O.spot.length,numSpotLightMaps:O.spotLightMap.length,numRectAreaLights:O.rectArea.length,numHemiLights:O.hemi.length,numSunLightShadows:O.sunShadowMap.length,numDirLightShadows:O.directionalShadowMap.length,numPointLightShadows:O.pointShadowMap.length,numSpotLightShadows:O.spotShadowMap.length,numSpotLightShadowsWithMaps:O.numSpotLightShadowsWithMaps,numLightProbes:O.numLightProbes,numLightProbeGrids:lt.length,numClippingPlanes:f.numPlanes,numClipIntersection:f.numIntersection,dithering:T.dithering,shadowMapEnabled:o.shadowMap.enabled&&V.length>0,shadowMapType:o.shadowMap.type,toneMapping:se,decodeVideoTexture:Ot&&T.map.isVideoTexture===!0&&qe.getTransfer(T.map.colorSpace)===cn,decodeVideoTextureEmissive:Mn&&T.emissiveMap.isVideoTexture===!0&&qe.getTransfer(T.emissiveMap.colorSpace)===cn,premultipliedAlpha:T.premultipliedAlpha,doubleSided:T.side===bi,flipSided:T.side===zi,useDepthPacking:T.depthPacking>=0,depthPacking:T.depthPacking||0,index0AttributeName:T.index0AttributeName,extensionClipCullDistance:At&&T.extensions.clipCullDistance===!0&&i.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(At&&T.extensions.multiDraw===!0||Mt)&&i.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:i.has("KHR_parallel_shader_compile"),customProgramCacheKey:T.customProgramCacheKey()};return Ht.vertexUv1s=m.has(1),Ht.vertexUv2s=m.has(2),Ht.vertexUv3s=m.has(3),m.clear(),Ht}function y(T){const O=[];if(T.shaderID?O.push(T.shaderID):(O.push(T.customVertexShaderID),O.push(T.customFragmentShaderID)),T.defines!==void 0)for(const V in T.defines)O.push(V),O.push(T.defines[V]);return T.isRawShaderMaterial===!1&&(x(O,T),D(O,T),O.push(o.outputColorSpace)),O.push(T.customProgramCacheKey),O.join()}function x(T,O){T.push(O.precision),T.push(O.outputColorSpace),T.push(O.envMapMode),T.push(O.envMapCubeUVHeight),T.push(O.mapUv),T.push(O.alphaMapUv),T.push(O.lightMapUv),T.push(O.aoMapUv),T.push(O.bumpMapUv),T.push(O.normalMapUv),T.push(O.displacementMapUv),T.push(O.emissiveMapUv),T.push(O.metalnessMapUv),T.push(O.roughnessMapUv),T.push(O.anisotropyMapUv),T.push(O.clearcoatMapUv),T.push(O.clearcoatNormalMapUv),T.push(O.clearcoatRoughnessMapUv),T.push(O.iridescenceMapUv),T.push(O.iridescenceThicknessMapUv),T.push(O.sheenColorMapUv),T.push(O.sheenRoughnessMapUv),T.push(O.specularMapUv),T.push(O.specularColorMapUv),T.push(O.specularIntensityMapUv),T.push(O.transmissionMapUv),T.push(O.thicknessMapUv),T.push(O.combine),T.push(O.fogExp2),T.push(O.sizeAttenuation),T.push(O.morphTargetsCount),T.push(O.morphAttributeCount),T.push(O.numSunLights),T.push(O.numDirLights),T.push(O.numPointLights),T.push(O.numSpotLights),T.push(O.numSpotLightMaps),T.push(O.numHemiLights),T.push(O.numRectAreaLights),T.push(O.numSunLightShadows),T.push(O.numDirLightShadows),T.push(O.numPointLightShadows),T.push(O.numSpotLightShadows),T.push(O.numSpotLightShadowsWithMaps),T.push(O.numLightProbes),T.push(O.shadowMapType),T.push(O.toneMapping),T.push(O.numClippingPlanes),T.push(O.numClipIntersection),T.push(O.depthPacking)}function D(T,O){h.disableAll(),O.instancing&&h.enable(0),O.instancingColor&&h.enable(1),O.instancingMorph&&h.enable(2),O.matcap&&h.enable(3),O.envMap&&h.enable(4),O.normalMapObjectSpace&&h.enable(5),O.normalMapTangentSpace&&h.enable(6),O.clearcoat&&h.enable(7),O.iridescence&&h.enable(8),O.alphaTest&&h.enable(9),O.vertexColors&&h.enable(10),O.vertexAlphas&&h.enable(11),O.vertexUv1s&&h.enable(12),O.vertexUv2s&&h.enable(13),O.vertexUv3s&&h.enable(14),O.vertexTangents&&h.enable(15),O.anisotropy&&h.enable(16),O.alphaHash&&h.enable(17),O.batching&&h.enable(18),O.dispersion&&h.enable(19),O.retroreflection&&h.enable(24),O.batchingColor&&h.enable(20),O.gradientMap&&h.enable(21),O.packedNormalMap&&h.enable(22),O.vertexNormals&&h.enable(23),T.push(h.mask),h.disableAll(),O.fog&&h.enable(0),O.useFog&&h.enable(1),O.flatShading&&h.enable(2),O.logarithmicDepthBuffer&&h.enable(3),O.reversedDepthBuffer&&h.enable(4),O.skinning&&h.enable(5),O.morphTargets&&h.enable(6),O.morphNormals&&h.enable(7),O.morphColors&&h.enable(8),O.premultipliedAlpha&&h.enable(9),O.shadowMapEnabled&&h.enable(10),O.doubleSided&&h.enable(11),O.flipSided&&h.enable(12),O.useDepthPacking&&h.enable(13),O.dithering&&h.enable(14),O.transmission&&h.enable(15),O.sheen&&h.enable(16),O.opaque&&h.enable(17),O.pointsUvs&&h.enable(18),O.decodeVideoTexture&&h.enable(19),O.decodeVideoTextureEmissive&&h.enable(20),O.alphaToCoverage&&h.enable(21),O.numLightProbeGrids>0&&h.enable(22),O.hasPositionAttribute&&h.enable(23),T.push(h.mask)}function F(T){const O=M[T.type];let V;if(O){const Z=qa[O];V=Jb.clone(Z.uniforms)}else V=T.uniforms;return V}function N(T,O){let V=S.get(O);return V!==void 0?++V.usedTimes:(V=new NR(o,O,T,l),p.push(V),S.set(O,V)),V}function L(T){if(--T.usedTimes===0){const O=p.indexOf(T);p[O]=p[p.length-1],p.pop(),S.delete(T.cacheKey),T.destroy()}}function U(T){d.remove(T)}function I(){d.dispose()}return{getParameters:C,getProgramCacheKey:y,getUniforms:F,acquireProgram:N,releaseProgram:L,releaseShaderCache:U,programs:p,dispose:I}}function IR(){let o=new WeakMap;function e(h){return o.has(h)}function i(h){let d=o.get(h);return d===void 0&&(d={},o.set(h,d)),d}function s(h){o.delete(h)}function l(h,d,m){o.get(h)[d]=m}function f(){o=new WeakMap}return{has:e,get:i,remove:s,update:l,dispose:f}}function zR(o,e){return o.groupOrder!==e.groupOrder?o.groupOrder-e.groupOrder:o.renderOrder!==e.renderOrder?o.renderOrder-e.renderOrder:o.material.id!==e.material.id?o.material.id-e.material.id:o.materialVariant!==e.materialVariant?o.materialVariant-e.materialVariant:o.z!==e.z?o.z-e.z:o.id-e.id}function Jx(o,e){return o.groupOrder!==e.groupOrder?o.groupOrder-e.groupOrder:o.renderOrder!==e.renderOrder?o.renderOrder-e.renderOrder:o.z!==e.z?e.z-o.z:o.id-e.id}function $x(){const o=[];let e=0;const i=[],s=[],l=[];function f(){e=0,i.length=0,s.length=0,l.length=0}function h(g){let M=0;return g.isInstancedMesh&&(M+=2),g.isSkinnedMesh&&(M+=1),M}function d(g,M,R,C,y,x){let D=o[e];return D===void 0?(D={id:g.id,object:g,geometry:M,material:R,materialVariant:h(g),groupOrder:C,renderOrder:g.renderOrder,z:y,group:x},o[e]=D):(D.id=g.id,D.object=g,D.geometry=M,D.material=R,D.materialVariant=h(g),D.groupOrder=C,D.renderOrder=g.renderOrder,D.z=y,D.group=x),e++,D}function m(g,M,R,C,y,x,D){D.reversedDepth===!0&&(y=-y);const F=d(g,M,R,C,y,x);R.transmission>0?s.push(F):R.transparent===!0?l.push(F):i.push(F)}function p(g,M,R,C,y,x){const D=d(g,M,R,C,y,x);R.transmission>0?s.unshift(D):R.transparent===!0?l.unshift(D):i.unshift(D)}function S(g,M){i.length>1&&i.sort(g||zR),s.length>1&&s.sort(M||Jx),l.length>1&&l.sort(M||Jx)}function v(){for(let g=e,M=o.length;g<M;g++){const R=o[g];if(R.id===null)break;R.id=null,R.object=null,R.geometry=null,R.material=null,R.group=null}}return{opaque:i,transmissive:s,transparent:l,init:f,push:m,unshift:p,finish:v,sort:S}}function BR(){let o=new WeakMap;function e(s,l){const f=o.get(s);let h;return f===void 0?(h=new $x,o.set(s,[h])):l>=f.length?(h=new $x,f.push(h)):h=f[l],h}function i(){o=new WeakMap}return{get:e,dispose:i}}function FR(){const o={};return{get:function(e){if(o[e.id]!==void 0)return o[e.id];let i;switch(e.type){case"SunLight":case"DirectionalLight":i={direction:new k,color:new We};break;case"SpotLight":i={position:new k,direction:new k,color:new We,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":i={position:new k,color:new We,distance:0,decay:0};break;case"HemisphereLight":i={direction:new k,skyColor:new We,groundColor:new We};break;case"RectAreaLight":i={color:new We,position:new k,halfWidth:new k,halfHeight:new k};break}return o[e.id]=i,i}}}function HR(){const o={};return{get:function(e){if(o[e.id]!==void 0)return o[e.id];let i;switch(e.type){case"SunLight":case"DirectionalLight":i={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new ye};break;case"SpotLight":i={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new ye};break;case"PointLight":i={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new ye,shadowCameraNear:1,shadowCameraFar:1e3};break}return o[e.id]=i,i}}}let GR=0;function VR(o,e){return(e.castShadow?2:0)-(o.castShadow?2:0)+(e.map?1:0)-(o.map?1:0)}function kR(o){const e=new FR,i=HR(),s={version:0,hash:{sunLength:-1,directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numSunShadows:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],sun:[],sunShadow:[],sunShadowMap:[],sunShadowMatrix:[],sunShadowCascade:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let p=0;p<9;p++)s.probe.push(new k);const l=new k,f=new yn,h=new yn;function d(p){let S=0,v=0,g=0;for(let J=0;J<9;J++)s.probe[J].set(0,0,0);let M=0,R=0,C=0,y=0,x=0,D=0,F=0,N=0,L=0,U=0,I=0,T=0,O=0,V=0;p.sort(VR);for(let J=0,lt=p.length;J<lt;J++){const q=p[J],nt=q.color,j=q.intensity,K=q.distance;let dt=null;if(q.shadow&&q.shadow.map&&(q.shadow.map.texture.format===Wr?dt=q.shadow.map.texture:dt=q.shadow.map.depthTexture||q.shadow.map.texture),q.isAmbientLight)S+=nt.r*j,v+=nt.g*j,g+=nt.b*j;else if(q.isLightProbe){for(let ut=0;ut<9;ut++)s.probe[ut].addScaledVector(q.sh.coefficients[ut],j);V++}else if(q.isSunLight){const ut=e.get(q);if(ut.color.copy(q.color).multiplyScalar(q.intensity),q.castShadow){const mt=q.shadow,gt=i.get(q);gt.shadowIntensity=mt.intensity,gt.shadowBias=mt.bias,gt.shadowNormalBias=mt.normalBias,gt.shadowRadius=mt.radius,gt.shadowMapSize.copy(mt.mapSize).multiply(mt.getFrameExtents()),s.sunShadow[R]=gt,s.sunShadowMap[R]=dt;const ie=mt.getViewportCount();for(let ae=0;ae<ie;ae++)s.sunShadowMatrix[C+ae]=mt.getMatrix(ae),s.sunShadowCascade[C+ae]=mt._cascadeData[ae];C+=ie,R++}s.sun[M]=ut,M++}else if(q.isDirectionalLight){const ut=e.get(q);if(ut.color.copy(q.color).multiplyScalar(q.intensity),q.castShadow){const mt=q.shadow,gt=i.get(q);gt.shadowIntensity=mt.intensity,gt.shadowBias=mt.bias,gt.shadowNormalBias=mt.normalBias,gt.shadowRadius=mt.radius,gt.shadowMapSize=mt.mapSize,s.directionalShadow[y]=gt,s.directionalShadowMap[y]=dt,s.directionalShadowMatrix[y]=q.shadow.matrix,L++}s.directional[y]=ut,y++}else if(q.isSpotLight){const ut=e.get(q);ut.position.setFromMatrixPosition(q.matrixWorld),ut.color.copy(nt).multiplyScalar(j),ut.distance=K,ut.coneCos=Math.cos(q.angle),ut.penumbraCos=Math.cos(q.angle*(1-q.penumbra)),ut.decay=q.decay,s.spot[D]=ut;const mt=q.shadow;if(q.map&&(s.spotLightMap[T]=q.map,T++,mt.updateMatrices(q),q.castShadow&&O++),s.spotLightMatrix[D]=mt.matrix,q.castShadow){const gt=i.get(q);gt.shadowIntensity=mt.intensity,gt.shadowBias=mt.bias,gt.shadowNormalBias=mt.normalBias,gt.shadowRadius=mt.radius,gt.shadowMapSize=mt.mapSize,s.spotShadow[D]=gt,s.spotShadowMap[D]=dt,I++}D++}else if(q.isRectAreaLight){const ut=e.get(q);ut.color.copy(nt).multiplyScalar(j),ut.halfWidth.set(q.width*.5,0,0),ut.halfHeight.set(0,q.height*.5,0),s.rectArea[F]=ut,F++}else if(q.isPointLight){const ut=e.get(q);if(ut.color.copy(q.color).multiplyScalar(q.intensity),ut.distance=q.distance,ut.decay=q.decay,q.castShadow){const mt=q.shadow,gt=i.get(q);gt.shadowIntensity=mt.intensity,gt.shadowBias=mt.bias,gt.shadowNormalBias=mt.normalBias,gt.shadowRadius=mt.radius,gt.shadowMapSize=mt.mapSize,gt.shadowCameraNear=mt.camera.near,gt.shadowCameraFar=mt.camera.far,s.pointShadow[x]=gt,s.pointShadowMap[x]=dt,s.pointShadowMatrix[x]=q.shadow.matrix,U++}s.point[x]=ut,x++}else if(q.isHemisphereLight){const ut=e.get(q);ut.skyColor.copy(q.color).multiplyScalar(j),ut.groundColor.copy(q.groundColor).multiplyScalar(j),s.hemi[N]=ut,N++}}F>0&&(o.has("OES_texture_float_linear")===!0?(s.rectAreaLTC1=Kt.LTC_FLOAT_1,s.rectAreaLTC2=Kt.LTC_FLOAT_2):(s.rectAreaLTC1=Kt.LTC_HALF_1,s.rectAreaLTC2=Kt.LTC_HALF_2)),s.ambient[0]=S,s.ambient[1]=v,s.ambient[2]=g;const Z=s.hash;(Z.sunLength!==M||Z.directionalLength!==y||Z.pointLength!==x||Z.spotLength!==D||Z.rectAreaLength!==F||Z.hemiLength!==N||Z.numSunShadows!==R||Z.numDirectionalShadows!==L||Z.numPointShadows!==U||Z.numSpotShadows!==I||Z.numSpotMaps!==T||Z.numLightProbes!==V)&&(s.sun.length=M,s.directional.length=y,s.spot.length=D,s.rectArea.length=F,s.point.length=x,s.hemi.length=N,s.sunShadow.length=R,s.sunShadowMap.length=R,s.sunShadowMatrix.length=C,s.sunShadowCascade.length=C,s.directionalShadow.length=L,s.directionalShadowMap.length=L,s.directionalShadowMatrix.length=L,s.pointShadow.length=U,s.pointShadowMap.length=U,s.pointShadowMatrix.length=U,s.spotShadow.length=I,s.spotShadowMap.length=I,s.spotLightMatrix.length=I+T-O,s.spotLightMap.length=T,s.numSpotLightShadowsWithMaps=O,s.numLightProbes=V,Z.sunLength=M,Z.directionalLength=y,Z.pointLength=x,Z.spotLength=D,Z.rectAreaLength=F,Z.hemiLength=N,Z.numSunShadows=R,Z.numDirectionalShadows=L,Z.numPointShadows=U,Z.numSpotShadows=I,Z.numSpotMaps=T,Z.numLightProbes=V,s.version=GR++)}function m(p,S){let v=0,g=0,M=0,R=0,C=0,y=0;const x=S.matrixWorldInverse;for(let D=0,F=p.length;D<F;D++){const N=p[D];if(N.isSunLight){const L=s.sun[v];L.direction.setFromMatrixPosition(N.matrixWorld),L.direction.transformDirection(x),v++}else if(N.isDirectionalLight){const L=s.directional[g];L.direction.setFromMatrixPosition(N.matrixWorld),l.setFromMatrixPosition(N.target.matrixWorld),L.direction.sub(l),L.direction.transformDirection(x),g++}else if(N.isSpotLight){const L=s.spot[R];L.position.setFromMatrixPosition(N.matrixWorld),L.position.applyMatrix4(x),L.direction.setFromMatrixPosition(N.matrixWorld),l.setFromMatrixPosition(N.target.matrixWorld),L.direction.sub(l),L.direction.transformDirection(x),R++}else if(N.isRectAreaLight){const L=s.rectArea[C];L.position.setFromMatrixPosition(N.matrixWorld),L.position.applyMatrix4(x),h.identity(),f.copy(N.matrixWorld),f.premultiply(x),h.extractRotation(f),L.halfWidth.set(N.width*.5,0,0),L.halfHeight.set(0,N.height*.5,0),L.halfWidth.applyMatrix4(h),L.halfHeight.applyMatrix4(h),C++}else if(N.isPointLight){const L=s.point[M];L.position.setFromMatrixPosition(N.matrixWorld),L.position.applyMatrix4(x),M++}else if(N.isHemisphereLight){const L=s.hemi[y];L.direction.setFromMatrixPosition(N.matrixWorld),L.direction.transformDirection(x),y++}}}return{setup:d,setupView:m,state:s}}function tS(o){const e=new kR(o),i=[],s=[],l=[];function f(g){v.camera=g,i.length=0,s.length=0,l.length=0}function h(g){i.push(g)}function d(g){s.push(g)}function m(g){l.push(g)}function p(){e.setup(i)}function S(g){e.setupView(i,g)}const v={lightsArray:i,shadowsArray:s,lightProbeGridArray:l,camera:null,lights:e,transmissionRenderTarget:{},textureUnits:0};return{init:f,state:v,setupLights:p,setupLightsView:S,pushLight:h,pushShadow:d,pushLightProbeGrid:m}}function XR(o){let e=new WeakMap;function i(l,f=0){const h=e.get(l);let d;return h===void 0?(d=new tS(o),e.set(l,[d])):f>=h.length?(d=new tS(o),h.push(d)):d=h[f],d}function s(){e=new WeakMap}return{get:i,dispose:s}}const WR=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,YR=`uniform sampler2D shadow_pass;
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
}`,qR=[new k(1,0,0),new k(-1,0,0),new k(0,1,0),new k(0,-1,0),new k(0,0,1),new k(0,0,-1)],jR=[new k(0,-1,0),new k(0,-1,0),new k(0,0,1),new k(0,0,-1),new k(0,-1,0),new k(0,-1,0)],eS=new yn,Zl=new k,Ap=new k;function ZR(o,e,i){let s=new Lm;const l=new ye,f=new ye,h=new bn,d=new nT,m=new iT,p={},S=i.maxTextureSize,v={[kr]:zi,[zi]:kr,[bi]:bi},g=new $a({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new ye},radius:{value:4}},vertexShader:WR,fragmentShader:YR}),M=g.clone();M.defines.HORIZONTAL_PASS=1;const R=new ta;R.setAttribute("position",new bs(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));const C=new he(R,g),y=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=Jl;let x=this.type;this.render=function(U,I,T){if(y.enabled===!1||y.autoUpdate===!1&&y.needsUpdate===!1||U.length===0)return;this.type===HE&&(xe("WebGLShadowMap: PCFSoftShadowMap has been removed. Using PCFShadowMap instead."),this.type=Jl);const O=o.getRenderTarget(),V=o.getActiveCubeFace(),Z=o.getActiveMipmapLevel(),J=o.state;J.setBlending(Ms),J.buffers.depth.getReversed()===!0?J.buffers.color.setClear(0,0,0,0):J.buffers.color.setClear(1,1,1,1),J.buffers.depth.setTest(!0),J.setScissorTest(!1);const lt=x!==this.type;lt&&I.traverse(function(q){q.material&&(Array.isArray(q.material)?q.material.forEach(nt=>nt.needsUpdate=!0):q.material.needsUpdate=!0)});for(let q=0,nt=U.length;q<nt;q++){const j=U[q],K=j.shadow;if(K===void 0){xe("WebGLShadowMap:",j,"has no shadow.");continue}if(K.autoUpdate===!1&&K.needsUpdate===!1)continue;l.copy(K.mapSize);const dt=K.getFrameExtents();l.multiply(dt),f.copy(K.mapSize),(l.x>S||l.y>S)&&(l.x>S&&(f.x=Math.floor(S/dt.x),l.x=f.x*dt.x,K.mapSize.x=f.x),l.y>S&&(f.y=Math.floor(S/dt.y),l.y=f.y*dt.y,K.mapSize.y=f.y));const ut=o.state.buffers.depth.getReversed();if(K.camera._reversedDepth=ut,K.map===null||lt===!0){if(K.map!==null&&(K.map.depthTexture!==null&&(K.map.depthTexture.dispose(),K.map.depthTexture=null),K.map.dispose()),this.type===Kl){if(j.isPointLight){xe("WebGLShadowMap: VSM shadow maps are not supported for PointLights. Use PCF or BasicShadowMap instead.");continue}K.map=new Ca(l.x,l.y,{format:Wr,type:Ja,minFilter:hi,magFilter:hi,generateMipmaps:!1}),K.map.texture.name=j.name+".shadowMap",K.map.depthTexture=new rc(l.x,l.y,ja),K.map.depthTexture.name=j.name+".shadowMapDepth",K.map.depthTexture.format=Ts,K.map.depthTexture.compareFunction=null,K.map.depthTexture.minFilter=ni,K.map.depthTexture.magFilter=ni}else j.isPointLight?(K.map=new FS(l.x),K.map.depthTexture=new Zb(l.x,Qa)):(K.map=new Ca(l.x,l.y),K.map.depthTexture=new rc(l.x,l.y,Qa)),K.map.depthTexture.name=j.name+".shadowMap",K.map.depthTexture.format=Ts,this.type===Jl?(K.map.depthTexture.compareFunction=ut?Cm:wm,K.map.depthTexture.minFilter=hi,K.map.depthTexture.magFilter=hi):(K.map.depthTexture.compareFunction=null,K.map.depthTexture.minFilter=ni,K.map.depthTexture.magFilter=ni);K.camera.updateProjectionMatrix()}K.map.isWebGLCubeRenderTarget!==!0&&(K.map.width!==l.x||K.map.height!==l.y)&&K.map.setSize(l.x,l.y);const mt=K.map.isWebGLCubeRenderTarget?6:K.getViewportCount();j.isPointLight!==!0&&K.updateMatrices(j,T);for(let gt=0;gt<mt;gt++){const ie=K.getCamera(gt);if(j.isPointLight){const ae=K.camera,B=K.matrix,_t=j.distance||ae.far;_t!==ae.far&&(ae.far=_t,ae.updateProjectionMatrix()),Zl.setFromMatrixPosition(j.matrixWorld),ae.position.copy(Zl),Ap.copy(ae.position),Ap.add(qR[gt]),ae.up.copy(jR[gt]),ae.lookAt(Ap),ae.updateMatrixWorld(),B.makeTranslation(-Zl.x,-Zl.y,-Zl.z),eS.multiplyMatrices(ae.projectionMatrix,ae.matrixWorldInverse),K._frustum.setFromProjectionMatrix(eS,ae.coordinateSystem,ae.reversedDepth)}if(K.map.isWebGLCubeRenderTarget)o.setRenderTarget(K.map,gt),o.clear();else{gt===0&&(o.setRenderTarget(K.map),o.clear());const ae=K.getViewport(gt);h.set(f.x*ae.x,f.y*ae.y,f.x*ae.z,f.y*ae.w),J.viewport(h)}s=K.getFrustum(gt),N(I,T,ie,j,this.type)}K.isPointLightShadow!==!0&&this.type===Kl&&D(K,T),K.needsUpdate=!1}x=this.type,y.needsUpdate=!1,o.setRenderTarget(O,V,Z)};function D(U,I){const T=e.update(C);g.defines.VSM_SAMPLES!==U.blurSamples&&(g.defines.VSM_SAMPLES=U.blurSamples,M.defines.VSM_SAMPLES=U.blurSamples,g.needsUpdate=!0,M.needsUpdate=!0),U.mapPass===null?U.mapPass=new Ca(l.x,l.y,{format:Wr,type:Ja}):(U.mapPass.width!==U.map.width||U.mapPass.height!==U.map.height)&&U.mapPass.setSize(U.map.width,U.map.height),g.uniforms.shadow_pass.value=U.map.depthTexture,g.uniforms.resolution.value.set(U.map.width,U.map.height),g.uniforms.radius.value=U.radius,o.setRenderTarget(U.mapPass),o.clear(),o.renderBufferDirect(I,null,T,g,C,null),M.uniforms.shadow_pass.value=U.mapPass.texture,M.uniforms.resolution.value.set(U.map.width,U.map.height),M.uniforms.radius.value=U.radius,o.setRenderTarget(U.map),o.clear(),o.renderBufferDirect(I,null,T,M,C,null)}function F(U,I,T,O){let V=null;const Z=T.isPointLight===!0?U.customDistanceMaterial:U.customDepthMaterial;if(Z!==void 0)V=Z;else if(V=T.isPointLight===!0?m:d,o.localClippingEnabled&&I.clipShadows===!0&&Array.isArray(I.clippingPlanes)&&I.clippingPlanes.length!==0||I.displacementMap&&I.displacementScale!==0||I.alphaMap&&I.alphaTest>0||I.map&&I.alphaTest>0||I.alphaToCoverage===!0){const J=V.uuid,lt=I.uuid;let q=p[J];q===void 0&&(q={},p[J]=q);let nt=q[lt];nt===void 0&&(nt=V.clone(),q[lt]=nt,I.addEventListener("dispose",L)),V=nt}if(V.visible=I.visible,V.wireframe=I.wireframe,O===Kl?V.side=I.shadowSide!==null?I.shadowSide:I.side:V.side=I.shadowSide!==null?I.shadowSide:v[I.side],V.alphaMap=I.alphaMap,V.alphaTest=I.alphaToCoverage===!0?.5:I.alphaTest,V.map=I.map,V.clipShadows=I.clipShadows,V.clippingPlanes=I.clippingPlanes,V.clipIntersection=I.clipIntersection,V.displacementMap=I.displacementMap,V.displacementScale=I.displacementScale,V.displacementBias=I.displacementBias,V.wireframeLinewidth=I.wireframeLinewidth,V.linewidth=I.linewidth,T.isPointLight===!0&&V.isMeshDistanceMaterial===!0){const J=o.properties.get(V);J.light=T}return V}function N(U,I,T,O,V){if(U.visible===!1)return;if(U.layers.test(I.layers)&&(U.isMesh||U.isLine||U.isPoints)&&(U.castShadow||U.receiveShadow&&V===Kl)&&(!U.frustumCulled||U.intersectsFrustum(s))){U.modelViewMatrix.multiplyMatrices(T.matrixWorldInverse,U.matrixWorld);const lt=e.update(U),q=U.material;if(Array.isArray(q)){const nt=lt.groups;for(let j=0,K=nt.length;j<K;j++){const dt=nt[j],ut=q[dt.materialIndex];if(ut&&ut.visible){const mt=F(U,ut,O,V);U.onBeforeShadow(o,U,I,T,lt,mt,dt),o.renderBufferDirect(T,null,lt,mt,U,dt),U.onAfterShadow(o,U,I,T,lt,mt,dt)}}}else if(q.visible){const nt=F(U,q,O,V);U.onBeforeShadow(o,U,I,T,lt,nt,null),o.renderBufferDirect(T,null,lt,nt,U,null),U.onAfterShadow(o,U,I,T,lt,nt,null)}}const J=U.children;for(let lt=0,q=J.length;lt<q;lt++)N(J[lt],I,T,O,V)}function L(U){U.target.removeEventListener("dispose",L);for(const T in p){const O=p[T],V=U.target.uuid;V in O&&(O[V].dispose(),delete O[V])}}}function KR(o,e){function i(){let W=!1;const Pt=new bn;let yt=null;const Bt=new bn(0,0,0,0);return{setMask:function(Wt){yt!==Wt&&!W&&(o.colorMask(Wt,Wt,Wt,Wt),yt=Wt)},setLocked:function(Wt){W=Wt},setClear:function(Wt,At,se,Ht,Pe){Pe===!0&&(Wt*=Ht,At*=Ht,se*=Ht),Pt.set(Wt,At,se,Ht),Bt.equals(Pt)===!1&&(o.clearColor(Wt,At,se,Ht),Bt.copy(Pt))},reset:function(){W=!1,yt=null,Bt.set(-1,0,0,0)}}}function s(){let W=!1,Pt=!1,yt=null,Bt=null,Wt=null;return{setReversed:function(At){if(Pt!==At){const se=e.get("EXT_clip_control");At?se.clipControlEXT(se.LOWER_LEFT_EXT,se.ZERO_TO_ONE_EXT):se.clipControlEXT(se.LOWER_LEFT_EXT,se.NEGATIVE_ONE_TO_ONE_EXT),Pt=At;const Ht=Wt;Wt=null,this.setClear(Ht)}},getReversed:function(){return Pt},setTest:function(At){At?pt(o.DEPTH_TEST):Ct(o.DEPTH_TEST)},setMask:function(At){yt!==At&&!W&&(o.depthMask(At),yt=At)},setFunc:function(At){if(Pt&&(At=yb[At]),Bt!==At){switch(At){case wp:o.depthFunc(o.NEVER);break;case Cp:o.depthFunc(o.ALWAYS);break;case Np:o.depthFunc(o.LESS);break;case nc:o.depthFunc(o.LEQUAL);break;case Dp:o.depthFunc(o.EQUAL);break;case Up:o.depthFunc(o.GEQUAL);break;case Lp:o.depthFunc(o.GREATER);break;case Op:o.depthFunc(o.NOTEQUAL);break;default:o.depthFunc(o.LEQUAL)}Bt=At}},setLocked:function(At){W=At},setClear:function(At){Wt!==At&&(Wt=At,Pt&&(At=1-At),o.clearDepth(At))},reset:function(){W=!1,yt=null,Bt=null,Wt=null,Pt=!1}}}function l(){let W=!1,Pt=null,yt=null,Bt=null,Wt=null,At=null,se=null,Ht=null,Pe=null;return{setTest:function(_e){W||(_e?pt(o.STENCIL_TEST):Ct(o.STENCIL_TEST))},setMask:function(_e){Pt!==_e&&!W&&(o.stencilMask(_e),Pt=_e)},setFunc:function(_e,ii,di){(yt!==_e||Bt!==ii||Wt!==di)&&(o.stencilFunc(_e,ii,di),yt=_e,Bt=ii,Wt=di)},setOp:function(_e,ii,di){(At!==_e||se!==ii||Ht!==di)&&(o.stencilOp(_e,ii,di),At=_e,se=ii,Ht=di)},setLocked:function(_e){W=_e},setClear:function(_e){Pe!==_e&&(o.clearStencil(_e),Pe=_e)},reset:function(){W=!1,Pt=null,yt=null,Bt=null,Wt=null,At=null,se=null,Ht=null,Pe=null}}}const f=new i,h=new s,d=new l,m=new WeakMap,p=new WeakMap;let S={},v={},g={},M=new WeakMap,R=[],C=null,y=!1,x=null,D=null,F=null,N=null,L=null,U=null,I=null,T=new We(0,0,0),O=0,V=!1,Z=null,J=null,lt=null,q=null,nt=null;const j=o.getParameter(o.MAX_COMBINED_TEXTURE_IMAGE_UNITS);let K=!1,dt=0;const ut=o.getParameter(o.VERSION);ut.indexOf("WebGL")!==-1?(dt=parseFloat(/^WebGL (\d)/.exec(ut)[1]),K=dt>=1):ut.indexOf("OpenGL ES")!==-1&&(dt=parseFloat(/^OpenGL ES (\d)/.exec(ut)[1]),K=dt>=2);let mt=null,gt={};const ie=o.getParameter(o.SCISSOR_BOX),ae=o.getParameter(o.VIEWPORT),B=new bn().fromArray(ie),_t=new bn().fromArray(ae);function Rt(W,Pt,yt,Bt){const Wt=new Uint8Array(4),At=o.createTexture();o.bindTexture(W,At),o.texParameteri(W,o.TEXTURE_MIN_FILTER,o.NEAREST),o.texParameteri(W,o.TEXTURE_MAG_FILTER,o.NEAREST);for(let se=0;se<yt;se++)W===o.TEXTURE_3D||W===o.TEXTURE_2D_ARRAY?o.texImage3D(Pt,0,o.RGBA,1,1,Bt,0,o.RGBA,o.UNSIGNED_BYTE,Wt):o.texImage2D(Pt+se,0,o.RGBA,1,1,0,o.RGBA,o.UNSIGNED_BYTE,Wt);return At}const $={};$[o.TEXTURE_2D]=Rt(o.TEXTURE_2D,o.TEXTURE_2D,1),$[o.TEXTURE_CUBE_MAP]=Rt(o.TEXTURE_CUBE_MAP,o.TEXTURE_CUBE_MAP_POSITIVE_X,6),$[o.TEXTURE_2D_ARRAY]=Rt(o.TEXTURE_2D_ARRAY,o.TEXTURE_2D_ARRAY,1,1),$[o.TEXTURE_3D]=Rt(o.TEXTURE_3D,o.TEXTURE_3D,1,1),f.setClear(0,0,0,1),h.setClear(1),d.setClear(0),pt(o.DEPTH_TEST),h.setFunc(nc),ce(!1),fe(Qv),pt(o.CULL_FACE),Ae(Ms);function pt(W){S[W]!==!0&&(o.enable(W),S[W]=!0)}function Ct(W){S[W]!==!1&&(o.disable(W),S[W]=!1)}function Yt(W,Pt){return g[W]!==Pt?(o.bindFramebuffer(W,Pt),g[W]=Pt,W===o.DRAW_FRAMEBUFFER&&(g[o.FRAMEBUFFER]=Pt),W===o.FRAMEBUFFER&&(g[o.DRAW_FRAMEBUFFER]=Pt),!0):!1}function Mt(W,Pt){let yt=R,Bt=!1;if(W){yt=M.get(Pt),yt===void 0&&(yt=[],M.set(Pt,yt));const Wt=W.textures;if(yt.length!==Wt.length||yt[0]!==o.COLOR_ATTACHMENT0){for(let At=0,se=Wt.length;At<se;At++)yt[At]=o.COLOR_ATTACHMENT0+At;yt.length=Wt.length,Bt=!0}}else yt[0]!==o.BACK&&(yt[0]=o.BACK,Bt=!0);Bt&&o.drawBuffers(yt)}function Ot(W){return C!==W?(o.useProgram(W),C=W,!0):!1}const $e={[ko]:o.FUNC_ADD,[VE]:o.FUNC_SUBTRACT,[kE]:o.FUNC_REVERSE_SUBTRACT};$e[XE]=o.MIN,$e[WE]=o.MAX;const Ee={[YE]:o.ZERO,[qE]:o.ONE,[jE]:o.SRC_COLOR,[lS]:o.SRC_ALPHA,[tb]:o.SRC_ALPHA_SATURATE,[JE]:o.DST_COLOR,[KE]:o.DST_ALPHA,[ZE]:o.ONE_MINUS_SRC_COLOR,[cS]:o.ONE_MINUS_SRC_ALPHA,[$E]:o.ONE_MINUS_DST_COLOR,[QE]:o.ONE_MINUS_DST_ALPHA,[eb]:o.CONSTANT_COLOR,[nb]:o.ONE_MINUS_CONSTANT_COLOR,[ib]:o.CONSTANT_ALPHA,[ab]:o.ONE_MINUS_CONSTANT_ALPHA};function Ae(W,Pt,yt,Bt,Wt,At,se,Ht,Pe,_e){if(W===Ms){y===!0&&(Ct(o.BLEND),y=!1);return}if(y===!1&&(pt(o.BLEND),y=!0),W!==GE){if(W!==x||_e!==V){if((D!==ko||L!==ko)&&(o.blendEquation(o.FUNC_ADD),D=ko,L=ko),_e)switch(W){case $l:o.blendFuncSeparate(o.ONE,o.ONE_MINUS_SRC_ALPHA,o.ONE,o.ONE_MINUS_SRC_ALPHA);break;case Jv:o.blendFunc(o.ONE,o.ONE);break;case $v:o.blendFuncSeparate(o.ZERO,o.ONE_MINUS_SRC_COLOR,o.ZERO,o.ONE);break;case tx:o.blendFuncSeparate(o.DST_COLOR,o.ONE_MINUS_SRC_ALPHA,o.ZERO,o.ONE);break;default:Je("WebGLState: Invalid blending: ",W);break}else switch(W){case $l:o.blendFuncSeparate(o.SRC_ALPHA,o.ONE_MINUS_SRC_ALPHA,o.ONE,o.ONE_MINUS_SRC_ALPHA);break;case Jv:o.blendFuncSeparate(o.SRC_ALPHA,o.ONE,o.ONE,o.ONE);break;case $v:Je("WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true");break;case tx:Je("WebGLState: MultiplyBlending requires material.premultipliedAlpha = true");break;default:Je("WebGLState: Invalid blending: ",W);break}F=null,N=null,U=null,I=null,T.set(0,0,0),O=0,x=W,V=_e}return}Wt=Wt||Pt,At=At||yt,se=se||Bt,(Pt!==D||Wt!==L)&&(o.blendEquationSeparate($e[Pt],$e[Wt]),D=Pt,L=Wt),(yt!==F||Bt!==N||At!==U||se!==I)&&(o.blendFuncSeparate(Ee[yt],Ee[Bt],Ee[At],Ee[se]),F=yt,N=Bt,U=At,I=se),(Ht.equals(T)===!1||Pe!==O)&&(o.blendColor(Ht.r,Ht.g,Ht.b,Pe),T.copy(Ht),O=Pe),x=W,V=!1}function Ne(W,Pt){W.side===bi?Ct(o.CULL_FACE):pt(o.CULL_FACE);let yt=W.side===zi;Pt&&(yt=!yt),ce(yt),W.blending===$l&&W.transparent===!1?Ae(Ms):Ae(W.blending,W.blendEquation,W.blendSrc,W.blendDst,W.blendEquationAlpha,W.blendSrcAlpha,W.blendDstAlpha,W.blendColor,W.blendAlpha,W.premultipliedAlpha),h.setFunc(W.depthFunc),h.setTest(W.depthTest),h.setMask(W.depthWrite),f.setMask(W.colorWrite);const Bt=W.stencilWrite;d.setTest(Bt),Bt&&(d.setMask(W.stencilWriteMask),d.setFunc(W.stencilFunc,W.stencilRef,W.stencilFuncMask),d.setOp(W.stencilFail,W.stencilZFail,W.stencilZPass)),Mn(W.polygonOffset,W.polygonOffsetFactor,W.polygonOffsetUnits),W.alphaToCoverage===!0?pt(o.SAMPLE_ALPHA_TO_COVERAGE):Ct(o.SAMPLE_ALPHA_TO_COVERAGE)}function ce(W){Z!==W&&(W?o.frontFace(o.CW):o.frontFace(o.CCW),Z=W)}function fe(W){W!==BE?(pt(o.CULL_FACE),W!==J&&(W===Qv?o.cullFace(o.BACK):W===FE?o.cullFace(o.FRONT):o.cullFace(o.FRONT_AND_BACK))):Ct(o.CULL_FACE),J=W}function Jt(W){W!==lt&&(K&&o.lineWidth(W),lt=W)}function Mn(W,Pt,yt){W?(pt(o.POLYGON_OFFSET_FILL),(q!==Pt||nt!==yt)&&(q=Pt,nt=yt,h.getReversed()&&(Pt=-Pt),o.polygonOffset(Pt,yt))):Ct(o.POLYGON_OFFSET_FILL)}function je(W){W?pt(o.SCISSOR_TEST):Ct(o.SCISSOR_TEST)}function fn(W){W===void 0&&(W=o.TEXTURE0+j-1),mt!==W&&(o.activeTexture(W),mt=W)}function Y(W,Pt,yt){yt===void 0&&(mt===null?yt=o.TEXTURE0+j-1:yt=mt);let Bt=gt[yt];Bt===void 0&&(Bt={type:void 0,texture:void 0},gt[yt]=Bt),(Bt.type!==W||Bt.texture!==Pt)&&(mt!==yt&&(o.activeTexture(yt),mt=yt),o.bindTexture(W,Pt||$[W]),Bt.type=W,Bt.texture=Pt)}function pn(){const W=gt[mt];W!==void 0&&W.type!==void 0&&(o.bindTexture(W.type,null),W.type=void 0,W.texture=void 0)}function Ve(){try{o.compressedTexImage2D(...arguments)}catch(W){Je("WebGLState:",W)}}function P(){try{o.compressedTexImage3D(...arguments)}catch(W){Je("WebGLState:",W)}}function E(){try{o.texSubImage2D(...arguments)}catch(W){Je("WebGLState:",W)}}function it(){try{o.texSubImage3D(...arguments)}catch(W){Je("WebGLState:",W)}}function rt(){try{o.compressedTexSubImage2D(...arguments)}catch(W){Je("WebGLState:",W)}}function vt(){try{o.compressedTexSubImage3D(...arguments)}catch(W){Je("WebGLState:",W)}}function Lt(){try{o.texStorage2D(...arguments)}catch(W){Je("WebGLState:",W)}}function Ft(){try{o.texStorage3D(...arguments)}catch(W){Je("WebGLState:",W)}}function St(){try{o.texImage2D(...arguments)}catch(W){Je("WebGLState:",W)}}function Et(){try{o.texImage3D(...arguments)}catch(W){Je("WebGLState:",W)}}function Ut(W){return v[W]!==void 0?v[W]:o.getParameter(W)}function Gt(W,Pt){v[W]!==Pt&&(o.pixelStorei(W,Pt),v[W]=Pt)}function Dt(W){B.equals(W)===!1&&(o.scissor(W.x,W.y,W.z,W.w),B.copy(W))}function zt(W){_t.equals(W)===!1&&(o.viewport(W.x,W.y,W.z,W.w),_t.copy(W))}function qt(W,Pt){let yt=p.get(Pt);yt===void 0&&(yt=new WeakMap,p.set(Pt,yt));let Bt=yt.get(W);Bt===void 0&&(Bt=o.getUniformBlockIndex(Pt,W.name),yt.set(W,Bt))}function le(W,Pt){const Bt=p.get(Pt).get(W);m.get(Pt)!==Bt&&(o.uniformBlockBinding(Pt,Bt,W.__bindingPointIndex),m.set(Pt,Bt))}function me(){o.disable(o.BLEND),o.disable(o.CULL_FACE),o.disable(o.DEPTH_TEST),o.disable(o.POLYGON_OFFSET_FILL),o.disable(o.SCISSOR_TEST),o.disable(o.STENCIL_TEST),o.disable(o.SAMPLE_ALPHA_TO_COVERAGE),o.blendEquation(o.FUNC_ADD),o.blendFunc(o.ONE,o.ZERO),o.blendFuncSeparate(o.ONE,o.ZERO,o.ONE,o.ZERO),o.blendColor(0,0,0,0),o.colorMask(!0,!0,!0,!0),o.clearColor(0,0,0,0),o.depthMask(!0),o.depthFunc(o.LESS),h.setReversed(!1),o.clearDepth(1),o.stencilMask(4294967295),o.stencilFunc(o.ALWAYS,0,4294967295),o.stencilOp(o.KEEP,o.KEEP,o.KEEP),o.clearStencil(0),o.cullFace(o.BACK),o.frontFace(o.CCW),o.polygonOffset(0,0),o.activeTexture(o.TEXTURE0),o.bindFramebuffer(o.FRAMEBUFFER,null),o.bindFramebuffer(o.DRAW_FRAMEBUFFER,null),o.bindFramebuffer(o.READ_FRAMEBUFFER,null),o.useProgram(null),o.lineWidth(1),o.scissor(0,0,o.canvas.width,o.canvas.height),o.viewport(0,0,o.canvas.width,o.canvas.height),o.pixelStorei(o.PACK_ALIGNMENT,4),o.pixelStorei(o.UNPACK_ALIGNMENT,4),o.pixelStorei(o.UNPACK_FLIP_Y_WEBGL,!1),o.pixelStorei(o.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),o.pixelStorei(o.UNPACK_COLORSPACE_CONVERSION_WEBGL,o.BROWSER_DEFAULT_WEBGL),o.pixelStorei(o.PACK_ROW_LENGTH,0),o.pixelStorei(o.PACK_SKIP_PIXELS,0),o.pixelStorei(o.PACK_SKIP_ROWS,0),o.pixelStorei(o.UNPACK_ROW_LENGTH,0),o.pixelStorei(o.UNPACK_IMAGE_HEIGHT,0),o.pixelStorei(o.UNPACK_SKIP_PIXELS,0),o.pixelStorei(o.UNPACK_SKIP_ROWS,0),o.pixelStorei(o.UNPACK_SKIP_IMAGES,0),S={},v={},mt=null,gt={},g={},M=new WeakMap,R=[],C=null,y=!1,x=null,D=null,F=null,N=null,L=null,U=null,I=null,T=new We(0,0,0),O=0,V=!1,Z=null,J=null,lt=null,q=null,nt=null,B.set(0,0,o.canvas.width,o.canvas.height),_t.set(0,0,o.canvas.width,o.canvas.height),f.reset(),h.reset(),d.reset()}return{buffers:{color:f,depth:h,stencil:d},enable:pt,disable:Ct,bindFramebuffer:Yt,drawBuffers:Mt,useProgram:Ot,setBlending:Ae,setMaterial:Ne,setFlipSided:ce,setCullFace:fe,setLineWidth:Jt,setPolygonOffset:Mn,setScissorTest:je,activeTexture:fn,bindTexture:Y,unbindTexture:pn,compressedTexImage2D:Ve,compressedTexImage3D:P,texImage2D:St,texImage3D:Et,pixelStorei:Gt,getParameter:Ut,updateUBOMapping:qt,uniformBlockBinding:le,texStorage2D:Lt,texStorage3D:Ft,texSubImage2D:E,texSubImage3D:it,compressedTexSubImage2D:rt,compressedTexSubImage3D:vt,scissor:Dt,viewport:zt,reset:me}}function QR(o,e,i,s,l,f,h){const d=e.has("WEBGL_multisampled_render_to_texture")?e.get("WEBGL_multisampled_render_to_texture"):null,m=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),p=new ye,S=new WeakMap,v=new Set;let g;const M=new WeakMap;let R=!1;try{R=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function C(P,E){return R?new OffscreenCanvas(P,E):df("canvas")}function y(P,E,it){let rt=1;const vt=Ve(P);if((vt.width>it||vt.height>it)&&(rt=it/Math.max(vt.width,vt.height)),rt<1)if(typeof HTMLImageElement<"u"&&P instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&P instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&P instanceof ImageBitmap||typeof VideoFrame<"u"&&P instanceof VideoFrame){const Lt=Math.floor(rt*vt.width),Ft=Math.floor(rt*vt.height);g===void 0&&(g=C(Lt,Ft));const St=E?C(Lt,Ft):g;return St.width=Lt,St.height=Ft,St.getContext("2d").drawImage(P,0,0,Lt,Ft),xe("WebGLRenderer: Texture has been resized from ("+vt.width+"x"+vt.height+") to ("+Lt+"x"+Ft+")."),St}else return"data"in P&&xe("WebGLRenderer: Image in DataTexture is too big ("+vt.width+"x"+vt.height+")."),P;return P}function x(P){return P.generateMipmaps}function D(P){o.generateMipmap(P)}function F(P){return P.isWebGLCubeRenderTarget?o.TEXTURE_CUBE_MAP:P.isWebGL3DRenderTarget?o.TEXTURE_3D:P.isWebGLArrayRenderTarget||P.isCompressedArrayTexture?o.TEXTURE_2D_ARRAY:o.TEXTURE_2D}function N(P,E,it,rt,vt,Lt=!1){if(P!==null){if(o[P]!==void 0)return o[P];xe("WebGLRenderer: Attempt to use non-existing WebGL internal format '"+P+"'")}let Ft;rt&&(Ft=e.get("EXT_texture_norm16"),Ft||xe("WebGLRenderer: Unable to use normalized textures without EXT_texture_norm16 extension"));let St=E;if(E===o.RED&&(it===o.FLOAT&&(St=o.R32F),it===o.HALF_FLOAT&&(St=o.R16F),it===o.UNSIGNED_BYTE&&(St=o.R8),it===o.UNSIGNED_SHORT&&Ft&&(St=Ft.R16_EXT),it===o.SHORT&&Ft&&(St=Ft.R16_SNORM_EXT)),E===o.RED_INTEGER&&(it===o.UNSIGNED_BYTE&&(St=o.R8UI),it===o.UNSIGNED_SHORT&&(St=o.R16UI),it===o.UNSIGNED_INT&&(St=o.R32UI),it===o.BYTE&&(St=o.R8I),it===o.SHORT&&(St=o.R16I),it===o.INT&&(St=o.R32I)),E===o.RG&&(it===o.FLOAT&&(St=o.RG32F),it===o.HALF_FLOAT&&(St=o.RG16F),it===o.UNSIGNED_BYTE&&(St=o.RG8),it===o.UNSIGNED_SHORT&&Ft&&(St=Ft.RG16_EXT),it===o.SHORT&&Ft&&(St=Ft.RG16_SNORM_EXT)),E===o.RG_INTEGER&&(it===o.UNSIGNED_BYTE&&(St=o.RG8UI),it===o.UNSIGNED_SHORT&&(St=o.RG16UI),it===o.UNSIGNED_INT&&(St=o.RG32UI),it===o.BYTE&&(St=o.RG8I),it===o.SHORT&&(St=o.RG16I),it===o.INT&&(St=o.RG32I)),E===o.RGB_INTEGER&&(it===o.UNSIGNED_BYTE&&(St=o.RGB8UI),it===o.UNSIGNED_SHORT&&(St=o.RGB16UI),it===o.UNSIGNED_INT&&(St=o.RGB32UI),it===o.BYTE&&(St=o.RGB8I),it===o.SHORT&&(St=o.RGB16I),it===o.INT&&(St=o.RGB32I)),E===o.RGBA_INTEGER&&(it===o.UNSIGNED_BYTE&&(St=o.RGBA8UI),it===o.UNSIGNED_SHORT&&(St=o.RGBA16UI),it===o.UNSIGNED_INT&&(St=o.RGBA32UI),it===o.BYTE&&(St=o.RGBA8I),it===o.SHORT&&(St=o.RGBA16I),it===o.INT&&(St=o.RGBA32I)),E===o.RGB&&(it===o.UNSIGNED_SHORT&&Ft&&(St=Ft.RGB16_EXT),it===o.SHORT&&Ft&&(St=Ft.RGB16_SNORM_EXT),it===o.UNSIGNED_INT_5_9_9_9_REV&&(St=o.RGB9_E5),it===o.UNSIGNED_INT_10F_11F_11F_REV&&(St=o.R11F_G11F_B10F)),E===o.RGBA){const Et=Lt?hf:qe.getTransfer(vt);it===o.FLOAT&&(St=o.RGBA32F),it===o.HALF_FLOAT&&(St=o.RGBA16F),it===o.UNSIGNED_BYTE&&(St=Et===cn?o.SRGB8_ALPHA8:o.RGBA8),it===o.UNSIGNED_SHORT&&Ft&&(St=Ft.RGBA16_EXT),it===o.SHORT&&Ft&&(St=Ft.RGBA16_SNORM_EXT),it===o.UNSIGNED_SHORT_4_4_4_4&&(St=o.RGBA4),it===o.UNSIGNED_SHORT_5_5_5_1&&(St=o.RGB5_A1)}return(St===o.R16F||St===o.R32F||St===o.RG16F||St===o.RG32F||St===o.RGBA16F||St===o.RGBA32F)&&e.get("EXT_color_buffer_float"),St}function L(P,E){let it;return P?E===null||E===Qa||E===ac?it=o.DEPTH24_STENCIL8:E===ja?it=o.DEPTH32F_STENCIL8:E===ic&&(it=o.DEPTH24_STENCIL8,xe("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):E===null||E===Qa||E===ac?it=o.DEPTH_COMPONENT24:E===ja?it=o.DEPTH_COMPONENT32F:E===ic&&(it=o.DEPTH_COMPONENT16),it}function U(P,E){return x(P)===!0||P.isFramebufferTexture&&P.minFilter!==ni&&P.minFilter!==hi?Math.log2(Math.max(E.width,E.height))+1:P.mipmaps!==void 0&&P.mipmaps.length>0?P.mipmaps.length:P.isCompressedTexture&&Array.isArray(P.image)?E.mipmaps.length:1}function I(P){const E=P.target;E.removeEventListener("dispose",I),O(E),E.isVideoTexture&&S.delete(E),E.isHTMLTexture&&v.delete(E)}function T(P){const E=P.target;E.removeEventListener("dispose",T),Z(E)}function O(P){const E=s.get(P);if(E.__webglInit===void 0)return;const it=P.source,rt=M.get(it);if(rt){const vt=rt[E.__cacheKey];vt.usedTimes--,vt.usedTimes===0&&V(P),Object.keys(rt).length===0&&M.delete(it)}s.remove(P)}function V(P){const E=s.get(P);o.deleteTexture(E.__webglTexture);const it=P.source,rt=M.get(it);delete rt[E.__cacheKey],h.memory.textures--}function Z(P){const E=s.get(P);if(P.depthTexture&&(P.depthTexture.dispose(),s.remove(P.depthTexture)),P.isWebGLCubeRenderTarget)for(let rt=0;rt<6;rt++){if(Array.isArray(E.__webglFramebuffer[rt]))for(let vt=0;vt<E.__webglFramebuffer[rt].length;vt++)o.deleteFramebuffer(E.__webglFramebuffer[rt][vt]);else o.deleteFramebuffer(E.__webglFramebuffer[rt]);E.__webglDepthbuffer&&o.deleteRenderbuffer(E.__webglDepthbuffer[rt])}else{if(Array.isArray(E.__webglFramebuffer))for(let rt=0;rt<E.__webglFramebuffer.length;rt++)o.deleteFramebuffer(E.__webglFramebuffer[rt]);else o.deleteFramebuffer(E.__webglFramebuffer);if(E.__webglDepthbuffer&&o.deleteRenderbuffer(E.__webglDepthbuffer),E.__webglMultisampledFramebuffer&&o.deleteFramebuffer(E.__webglMultisampledFramebuffer),E.__webglColorRenderbuffer)for(let rt=0;rt<E.__webglColorRenderbuffer.length;rt++)E.__webglColorRenderbuffer[rt]&&o.deleteRenderbuffer(E.__webglColorRenderbuffer[rt]);E.__webglDepthRenderbuffer&&o.deleteRenderbuffer(E.__webglDepthRenderbuffer)}const it=P.textures;for(let rt=0,vt=it.length;rt<vt;rt++){const Lt=s.get(it[rt]);Lt.__webglTexture&&(o.deleteTexture(Lt.__webglTexture),h.memory.textures--),s.remove(it[rt])}s.remove(P)}let J=0;function lt(){J=0}function q(){return J}function nt(P){J=P}function j(){const P=J;return P>=l.maxTextures&&xe("WebGLTextures: Trying to use "+(P+1)+" texture units while this GPU supports only "+l.maxTextures),J+=1,P}function K(P){const E=[];return E.push(P.wrapS),E.push(P.wrapT),E.push(P.wrapR||0),E.push(P.magFilter),E.push(P.minFilter),E.push(P.anisotropy),E.push(P.internalFormat),E.push(P.format),E.push(P.type),E.push(P.generateMipmaps),E.push(P.premultiplyAlpha),E.push(P.flipY),E.push(P.unpackAlignment),E.push(P.colorSpace),E.join()}function dt(P,E){const it=s.get(P);if(P.isVideoTexture&&Y(P),P.isRenderTargetTexture===!1&&P.isExternalTexture!==!0&&P.version>0&&it.__version!==P.version){const rt=P.image;if(rt===null)xe("WebGLRenderer: Texture marked for update but no image data found.");else if(rt.complete===!1)xe("WebGLRenderer: Texture marked for update but image is incomplete");else{Ct(it,P,E);return}}else P.isExternalTexture&&(it.__webglTexture=P.sourceTexture?P.sourceTexture:null);i.bindTexture(o.TEXTURE_2D,it.__webglTexture,o.TEXTURE0+E)}function ut(P,E){const it=s.get(P);if(P.isRenderTargetTexture===!1&&P.version>0&&it.__version!==P.version){Ct(it,P,E);return}else P.isExternalTexture&&(it.__webglTexture=P.sourceTexture?P.sourceTexture:null);i.bindTexture(o.TEXTURE_2D_ARRAY,it.__webglTexture,o.TEXTURE0+E)}function mt(P,E){const it=s.get(P);if(P.isRenderTargetTexture===!1&&P.version>0&&it.__version!==P.version){Ct(it,P,E);return}i.bindTexture(o.TEXTURE_3D,it.__webglTexture,o.TEXTURE0+E)}function gt(P,E){const it=s.get(P);if(P.isCubeDepthTexture!==!0&&P.version>0&&it.__version!==P.version){Yt(it,P,E);return}i.bindTexture(o.TEXTURE_CUBE_MAP,it.__webglTexture,o.TEXTURE0+E)}const ie={[Pp]:o.REPEAT,[ys]:o.CLAMP_TO_EDGE,[Ip]:o.MIRRORED_REPEAT},ae={[ni]:o.NEAREST,[ob]:o.NEAREST_MIPMAP_NEAREST,[Cu]:o.NEAREST_MIPMAP_LINEAR,[hi]:o.LINEAR,[Zd]:o.LINEAR_MIPMAP_NEAREST,[Gr]:o.LINEAR_MIPMAP_LINEAR},B={[fb]:o.NEVER,[gb]:o.ALWAYS,[hb]:o.LESS,[wm]:o.LEQUAL,[db]:o.EQUAL,[Cm]:o.GEQUAL,[pb]:o.GREATER,[mb]:o.NOTEQUAL};function _t(P,E){if(E.type===ja&&e.has("OES_texture_float_linear")===!1&&(E.magFilter===hi||E.magFilter===Zd||E.magFilter===Cu||E.magFilter===Gr||E.minFilter===hi||E.minFilter===Zd||E.minFilter===Cu||E.minFilter===Gr)&&xe("WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),o.texParameteri(P,o.TEXTURE_WRAP_S,ie[E.wrapS]),o.texParameteri(P,o.TEXTURE_WRAP_T,ie[E.wrapT]),(P===o.TEXTURE_3D||P===o.TEXTURE_2D_ARRAY)&&o.texParameteri(P,o.TEXTURE_WRAP_R,ie[E.wrapR]),o.texParameteri(P,o.TEXTURE_MAG_FILTER,ae[E.magFilter]),o.texParameteri(P,o.TEXTURE_MIN_FILTER,ae[E.minFilter]),E.compareFunction&&(o.texParameteri(P,o.TEXTURE_COMPARE_MODE,o.COMPARE_REF_TO_TEXTURE),o.texParameteri(P,o.TEXTURE_COMPARE_FUNC,B[E.compareFunction])),e.has("EXT_texture_filter_anisotropic")===!0){if(E.magFilter===ni||E.minFilter!==Cu&&E.minFilter!==Gr||E.type===ja&&e.has("OES_texture_float_linear")===!1)return;if(E.anisotropy>1||s.get(E).__currentAnisotropy){const it=e.get("EXT_texture_filter_anisotropic");o.texParameterf(P,it.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(E.anisotropy,l.getMaxAnisotropy())),s.get(E).__currentAnisotropy=E.anisotropy}}}function Rt(P,E){let it=!1;P.__webglInit===void 0&&(P.__webglInit=!0,E.addEventListener("dispose",I));const rt=E.source;let vt=M.get(rt);vt===void 0&&(vt={},M.set(rt,vt));const Lt=K(E);if(Lt!==P.__cacheKey){vt[Lt]===void 0&&(vt[Lt]={texture:o.createTexture(),usedTimes:0},h.memory.textures++,it=!0),vt[Lt].usedTimes++;const Ft=vt[P.__cacheKey];Ft!==void 0&&(vt[P.__cacheKey].usedTimes--,Ft.usedTimes===0&&V(E)),P.__cacheKey=Lt,P.__webglTexture=vt[Lt].texture}return it}function $(P,E,it){return Math.floor(Math.floor(P/it)/E)}function pt(P,E,it,rt){const Lt=P.updateRanges;if(Lt.length===0)i.texSubImage2D(o.TEXTURE_2D,0,0,0,E.width,E.height,it,rt,E.data);else{Lt.sort((Gt,Dt)=>Gt.start-Dt.start);let Ft=0;for(let Gt=1;Gt<Lt.length;Gt++){const Dt=Lt[Ft],zt=Lt[Gt],qt=Dt.start+Dt.count,le=$(zt.start,E.width,4),me=$(Dt.start,E.width,4);zt.start<=qt+1&&le===me&&$(zt.start+zt.count-1,E.width,4)===le?Dt.count=Math.max(Dt.count,zt.start+zt.count-Dt.start):(++Ft,Lt[Ft]=zt)}Lt.length=Ft+1;const St=i.getParameter(o.UNPACK_ROW_LENGTH),Et=i.getParameter(o.UNPACK_SKIP_PIXELS),Ut=i.getParameter(o.UNPACK_SKIP_ROWS);i.pixelStorei(o.UNPACK_ROW_LENGTH,E.width);for(let Gt=0,Dt=Lt.length;Gt<Dt;Gt++){const zt=Lt[Gt],qt=Math.floor(zt.start/4),le=Math.ceil(zt.count/4),me=qt%E.width,W=Math.floor(qt/E.width),Pt=le,yt=1;i.pixelStorei(o.UNPACK_SKIP_PIXELS,me),i.pixelStorei(o.UNPACK_SKIP_ROWS,W),i.texSubImage2D(o.TEXTURE_2D,0,me,W,Pt,yt,it,rt,E.data)}P.clearUpdateRanges(),i.pixelStorei(o.UNPACK_ROW_LENGTH,St),i.pixelStorei(o.UNPACK_SKIP_PIXELS,Et),i.pixelStorei(o.UNPACK_SKIP_ROWS,Ut)}}function Ct(P,E,it){let rt=o.TEXTURE_2D;(E.isDataArrayTexture||E.isCompressedArrayTexture)&&(rt=o.TEXTURE_2D_ARRAY),E.isData3DTexture&&(rt=o.TEXTURE_3D);const vt=Rt(P,E),Lt=E.source;i.bindTexture(rt,P.__webglTexture,o.TEXTURE0+it);const Ft=s.get(Lt);if(Lt.version!==Ft.__version||vt===!0){if(i.activeTexture(o.TEXTURE0+it),(typeof ImageBitmap<"u"&&E.image instanceof ImageBitmap)===!1){const yt=qe.getPrimaries(qe.workingColorSpace),Bt=E.colorSpace===sr?null:qe.getPrimaries(E.colorSpace),Wt=E.colorSpace===sr||yt===Bt?o.NONE:o.BROWSER_DEFAULT_WEBGL;i.pixelStorei(o.UNPACK_FLIP_Y_WEBGL,E.flipY),i.pixelStorei(o.UNPACK_PREMULTIPLY_ALPHA_WEBGL,E.premultiplyAlpha),i.pixelStorei(o.UNPACK_COLORSPACE_CONVERSION_WEBGL,Wt)}i.pixelStorei(o.UNPACK_ALIGNMENT,E.unpackAlignment);let Et=y(E.image,!1,l.maxTextureSize);Et=pn(E,Et);const Ut=f.convert(E.format,E.colorSpace),Gt=f.convert(E.type);let Dt=N(E.internalFormat,Ut,Gt,E.normalized,E.colorSpace,E.isVideoTexture);_t(rt,E);let zt;const qt=E.mipmaps,le=E.isVideoTexture!==!0,me=Ft.__version===void 0||vt===!0,W=Lt.dataReady,Pt=U(E,Et);if(E.isDepthTexture)Dt=L(E.format===Vr,E.type),me&&(le?i.texStorage2D(o.TEXTURE_2D,1,Dt,Et.width,Et.height):i.texImage2D(o.TEXTURE_2D,0,Dt,Et.width,Et.height,0,Ut,Gt,null));else if(E.isDataTexture)if(qt.length>0){le&&me&&i.texStorage2D(o.TEXTURE_2D,Pt,Dt,qt[0].width,qt[0].height);for(let yt=0,Bt=qt.length;yt<Bt;yt++)zt=qt[yt],le?W&&i.texSubImage2D(o.TEXTURE_2D,yt,0,0,zt.width,zt.height,Ut,Gt,zt.data):i.texImage2D(o.TEXTURE_2D,yt,Dt,zt.width,zt.height,0,Ut,Gt,zt.data);E.generateMipmaps=!1}else le?(me&&i.texStorage2D(o.TEXTURE_2D,Pt,Dt,Et.width,Et.height),W&&pt(E,Et,Ut,Gt)):i.texImage2D(o.TEXTURE_2D,0,Dt,Et.width,Et.height,0,Ut,Gt,Et.data);else if(E.isCompressedTexture)if(E.isCompressedArrayTexture){le&&me&&i.texStorage3D(o.TEXTURE_2D_ARRAY,Pt,Dt,qt[0].width,qt[0].height,Et.depth);for(let yt=0,Bt=qt.length;yt<Bt;yt++)if(zt=qt[yt],E.format!==wa)if(Ut!==null)if(le){if(W)if(E.layerUpdates.size>0){const Wt=Lx(zt.width,zt.height,E.format,E.type);for(const At of E.layerUpdates){const se=zt.data.subarray(At*Wt/zt.data.BYTES_PER_ELEMENT,(At+1)*Wt/zt.data.BYTES_PER_ELEMENT);i.compressedTexSubImage3D(o.TEXTURE_2D_ARRAY,yt,0,0,At,zt.width,zt.height,1,Ut,se)}}else i.compressedTexSubImage3D(o.TEXTURE_2D_ARRAY,yt,0,0,0,zt.width,zt.height,Et.depth,Ut,zt.data)}else i.compressedTexImage3D(o.TEXTURE_2D_ARRAY,yt,Dt,zt.width,zt.height,Et.depth,0,zt.data,0,0);else xe("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else le?W&&i.texSubImage3D(o.TEXTURE_2D_ARRAY,yt,0,0,0,zt.width,zt.height,Et.depth,Ut,Gt,zt.data):i.texImage3D(o.TEXTURE_2D_ARRAY,yt,Dt,zt.width,zt.height,Et.depth,0,Ut,Gt,zt.data);E.layerUpdates.size>0&&E.clearLayerUpdates()}else{le&&me&&i.texStorage2D(o.TEXTURE_2D,Pt,Dt,qt[0].width,qt[0].height);for(let yt=0,Bt=qt.length;yt<Bt;yt++)zt=qt[yt],E.format!==wa?Ut!==null?le?W&&i.compressedTexSubImage2D(o.TEXTURE_2D,yt,0,0,zt.width,zt.height,Ut,zt.data):i.compressedTexImage2D(o.TEXTURE_2D,yt,Dt,zt.width,zt.height,0,zt.data):xe("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):le?W&&i.texSubImage2D(o.TEXTURE_2D,yt,0,0,zt.width,zt.height,Ut,Gt,zt.data):i.texImage2D(o.TEXTURE_2D,yt,Dt,zt.width,zt.height,0,Ut,Gt,zt.data)}else if(E.isDataArrayTexture)if(le){if(me&&i.texStorage3D(o.TEXTURE_2D_ARRAY,Pt,Dt,Et.width,Et.height,Et.depth),W)if(E.layerUpdates.size>0){const yt=Lx(Et.width,Et.height,E.format,E.type);for(const Bt of E.layerUpdates){const Wt=Et.data.subarray(Bt*yt/Et.data.BYTES_PER_ELEMENT,(Bt+1)*yt/Et.data.BYTES_PER_ELEMENT);i.texSubImage3D(o.TEXTURE_2D_ARRAY,0,0,0,Bt,Et.width,Et.height,1,Ut,Gt,Wt)}E.clearLayerUpdates()}else i.texSubImage3D(o.TEXTURE_2D_ARRAY,0,0,0,0,Et.width,Et.height,Et.depth,Ut,Gt,Et.data)}else i.texImage3D(o.TEXTURE_2D_ARRAY,0,Dt,Et.width,Et.height,Et.depth,0,Ut,Gt,Et.data);else if(E.isData3DTexture)le?(me&&i.texStorage3D(o.TEXTURE_3D,Pt,Dt,Et.width,Et.height,Et.depth),W&&i.texSubImage3D(o.TEXTURE_3D,0,0,0,0,Et.width,Et.height,Et.depth,Ut,Gt,Et.data)):i.texImage3D(o.TEXTURE_3D,0,Dt,Et.width,Et.height,Et.depth,0,Ut,Gt,Et.data);else if(E.isFramebufferTexture){if(me)if(le)i.texStorage2D(o.TEXTURE_2D,Pt,Dt,Et.width,Et.height);else{let yt=Et.width,Bt=Et.height;for(let Wt=0;Wt<Pt;Wt++)i.texImage2D(o.TEXTURE_2D,Wt,Dt,yt,Bt,0,Ut,Gt,null),yt>>=1,Bt>>=1}}else if(E.isHTMLTexture){if("texElementImage2D"in o){const yt=o.canvas;if(yt.hasAttribute("layoutsubtree")||yt.setAttribute("layoutsubtree","true"),Et.parentNode!==yt){yt.appendChild(Et),v.add(E),yt.onpaint=Bt=>{const Wt=Bt.changedElements;for(const At of v)Wt.includes(At.image)&&(At.needsUpdate=!0)},yt.requestPaint();return}if(o.texElementImage2D.length===3)o.texElementImage2D(o.TEXTURE_2D,o.RGBA8,Et);else{const Wt=o.RGBA,At=o.RGBA,se=o.UNSIGNED_BYTE;o.texElementImage2D(o.TEXTURE_2D,0,Wt,At,se,Et)}o.texParameteri(o.TEXTURE_2D,o.TEXTURE_MIN_FILTER,o.LINEAR),o.texParameteri(o.TEXTURE_2D,o.TEXTURE_WRAP_S,o.CLAMP_TO_EDGE),o.texParameteri(o.TEXTURE_2D,o.TEXTURE_WRAP_T,o.CLAMP_TO_EDGE)}}else if(qt.length>0){if(le&&me){const yt=Ve(qt[0]);i.texStorage2D(o.TEXTURE_2D,Pt,Dt,yt.width,yt.height)}for(let yt=0,Bt=qt.length;yt<Bt;yt++)zt=qt[yt],le?W&&i.texSubImage2D(o.TEXTURE_2D,yt,0,0,Ut,Gt,zt):i.texImage2D(o.TEXTURE_2D,yt,Dt,Ut,Gt,zt);E.generateMipmaps=!1}else if(le){if(me){const yt=Ve(Et);i.texStorage2D(o.TEXTURE_2D,Pt,Dt,yt.width,yt.height)}W&&i.texSubImage2D(o.TEXTURE_2D,0,0,0,Ut,Gt,Et)}else i.texImage2D(o.TEXTURE_2D,0,Dt,Ut,Gt,Et);x(E)&&D(rt),Ft.__version=Lt.version,E.onUpdate&&E.onUpdate(E)}P.__version=E.version}function Yt(P,E,it){if(E.image.length!==6)return;const rt=Rt(P,E),vt=E.source;i.bindTexture(o.TEXTURE_CUBE_MAP,P.__webglTexture,o.TEXTURE0+it);const Lt=s.get(vt);if(vt.version!==Lt.__version||rt===!0){i.activeTexture(o.TEXTURE0+it);const Ft=qe.getPrimaries(qe.workingColorSpace),St=E.colorSpace===sr?null:qe.getPrimaries(E.colorSpace),Et=E.colorSpace===sr||Ft===St?o.NONE:o.BROWSER_DEFAULT_WEBGL;i.pixelStorei(o.UNPACK_FLIP_Y_WEBGL,E.flipY),i.pixelStorei(o.UNPACK_PREMULTIPLY_ALPHA_WEBGL,E.premultiplyAlpha),i.pixelStorei(o.UNPACK_ALIGNMENT,E.unpackAlignment),i.pixelStorei(o.UNPACK_COLORSPACE_CONVERSION_WEBGL,Et);const Ut=E.isCompressedTexture||E.image[0].isCompressedTexture,Gt=E.image[0]&&E.image[0].isDataTexture,Dt=[];for(let At=0;At<6;At++)!Ut&&!Gt?Dt[At]=y(E.image[At],!0,l.maxCubemapSize):Dt[At]=Gt?E.image[At].image:E.image[At],Dt[At]=pn(E,Dt[At]);const zt=Dt[0],qt=f.convert(E.format,E.colorSpace),le=f.convert(E.type),me=N(E.internalFormat,qt,le,E.normalized,E.colorSpace),W=E.isVideoTexture!==!0,Pt=Lt.__version===void 0||rt===!0,yt=vt.dataReady;let Bt=U(E,zt);_t(o.TEXTURE_CUBE_MAP,E);let Wt;if(Ut){W&&Pt&&i.texStorage2D(o.TEXTURE_CUBE_MAP,Bt,me,zt.width,zt.height);for(let At=0;At<6;At++){Wt=Dt[At].mipmaps;for(let se=0;se<Wt.length;se++){const Ht=Wt[se];E.format!==wa?qt!==null?W?yt&&i.compressedTexSubImage2D(o.TEXTURE_CUBE_MAP_POSITIVE_X+At,se,0,0,Ht.width,Ht.height,qt,Ht.data):i.compressedTexImage2D(o.TEXTURE_CUBE_MAP_POSITIVE_X+At,se,me,Ht.width,Ht.height,0,Ht.data):xe("WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):W?yt&&i.texSubImage2D(o.TEXTURE_CUBE_MAP_POSITIVE_X+At,se,0,0,Ht.width,Ht.height,qt,le,Ht.data):i.texImage2D(o.TEXTURE_CUBE_MAP_POSITIVE_X+At,se,me,Ht.width,Ht.height,0,qt,le,Ht.data)}}}else{if(Wt=E.mipmaps,W&&Pt){Wt.length>0&&Bt++;const At=Ve(Dt[0]);i.texStorage2D(o.TEXTURE_CUBE_MAP,Bt,me,At.width,At.height)}for(let At=0;At<6;At++)if(Gt){W?yt&&i.texSubImage2D(o.TEXTURE_CUBE_MAP_POSITIVE_X+At,0,0,0,Dt[At].width,Dt[At].height,qt,le,Dt[At].data):i.texImage2D(o.TEXTURE_CUBE_MAP_POSITIVE_X+At,0,me,Dt[At].width,Dt[At].height,0,qt,le,Dt[At].data);for(let se=0;se<Wt.length;se++){const Pe=Wt[se].image[At].image;W?yt&&i.texSubImage2D(o.TEXTURE_CUBE_MAP_POSITIVE_X+At,se+1,0,0,Pe.width,Pe.height,qt,le,Pe.data):i.texImage2D(o.TEXTURE_CUBE_MAP_POSITIVE_X+At,se+1,me,Pe.width,Pe.height,0,qt,le,Pe.data)}}else{W?yt&&i.texSubImage2D(o.TEXTURE_CUBE_MAP_POSITIVE_X+At,0,0,0,qt,le,Dt[At]):i.texImage2D(o.TEXTURE_CUBE_MAP_POSITIVE_X+At,0,me,qt,le,Dt[At]);for(let se=0;se<Wt.length;se++){const Ht=Wt[se];W?yt&&i.texSubImage2D(o.TEXTURE_CUBE_MAP_POSITIVE_X+At,se+1,0,0,qt,le,Ht.image[At]):i.texImage2D(o.TEXTURE_CUBE_MAP_POSITIVE_X+At,se+1,me,qt,le,Ht.image[At])}}}x(E)&&D(o.TEXTURE_CUBE_MAP),Lt.__version=vt.version,E.onUpdate&&E.onUpdate(E)}P.__version=E.version}function Mt(P,E,it,rt,vt,Lt){const Ft=f.convert(it.format,it.colorSpace),St=f.convert(it.type),Et=N(it.internalFormat,Ft,St,it.normalized,it.colorSpace),Ut=s.get(E),Gt=s.get(it);if(Gt.__renderTarget=E,!Ut.__hasExternalTextures){const Dt=Math.max(1,E.width>>Lt),zt=Math.max(1,E.height>>Lt);vt===o.TEXTURE_3D||vt===o.TEXTURE_2D_ARRAY?i.texImage3D(vt,Lt,Et,Dt,zt,E.depth,0,Ft,St,null):i.texImage2D(vt,Lt,Et,Dt,zt,0,Ft,St,null)}i.bindFramebuffer(o.FRAMEBUFFER,P),fn(E)?d.framebufferTexture2DMultisampleEXT(o.FRAMEBUFFER,rt,vt,Gt.__webglTexture,0,je(E)):(vt===o.TEXTURE_2D||vt>=o.TEXTURE_CUBE_MAP_POSITIVE_X&&vt<=o.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&o.framebufferTexture2D(o.FRAMEBUFFER,rt,vt,Gt.__webglTexture,Lt),i.bindFramebuffer(o.FRAMEBUFFER,null)}function Ot(P,E,it){if(o.bindRenderbuffer(o.RENDERBUFFER,P),E.depthBuffer){const rt=E.depthTexture,vt=rt&&rt.isDepthTexture?rt.type:null,Lt=L(E.stencilBuffer,vt),Ft=E.stencilBuffer?o.DEPTH_STENCIL_ATTACHMENT:o.DEPTH_ATTACHMENT;fn(E)?d.renderbufferStorageMultisampleEXT(o.RENDERBUFFER,je(E),Lt,E.width,E.height):it?o.renderbufferStorageMultisample(o.RENDERBUFFER,je(E),Lt,E.width,E.height):o.renderbufferStorage(o.RENDERBUFFER,Lt,E.width,E.height),o.framebufferRenderbuffer(o.FRAMEBUFFER,Ft,o.RENDERBUFFER,P)}else{const rt=E.textures;for(let vt=0;vt<rt.length;vt++){const Lt=rt[vt],Ft=f.convert(Lt.format,Lt.colorSpace),St=f.convert(Lt.type),Et=N(Lt.internalFormat,Ft,St,Lt.normalized,Lt.colorSpace);fn(E)?d.renderbufferStorageMultisampleEXT(o.RENDERBUFFER,je(E),Et,E.width,E.height):it?o.renderbufferStorageMultisample(o.RENDERBUFFER,je(E),Et,E.width,E.height):o.renderbufferStorage(o.RENDERBUFFER,Et,E.width,E.height)}}o.bindRenderbuffer(o.RENDERBUFFER,null)}function $e(P,E,it){const rt=E.isWebGLCubeRenderTarget===!0;if(i.bindFramebuffer(o.FRAMEBUFFER,P),!(E.depthTexture&&E.depthTexture.isDepthTexture))throw new Error("THREE.WebGLTextures: renderTarget.depthTexture must be an instance of THREE.DepthTexture.");const vt=s.get(E.depthTexture);if(vt.__renderTarget=E,(!vt.__webglTexture||E.depthTexture.image.width!==E.width||E.depthTexture.image.height!==E.height)&&(E.depthTexture.image.width=E.width,E.depthTexture.image.height=E.height,E.depthTexture.needsUpdate=!0),rt){if(vt.__webglInit===void 0&&(vt.__webglInit=!0,E.depthTexture.addEventListener("dispose",I)),vt.__webglTexture===void 0){vt.__webglTexture=o.createTexture(),i.bindTexture(o.TEXTURE_CUBE_MAP,vt.__webglTexture),_t(o.TEXTURE_CUBE_MAP,E.depthTexture);const Ut=f.convert(E.depthTexture.format),Gt=f.convert(E.depthTexture.type);let Dt;E.depthTexture.format===Ts?Dt=o.DEPTH_COMPONENT24:E.depthTexture.format===Vr&&(Dt=o.DEPTH24_STENCIL8);for(let zt=0;zt<6;zt++)o.texImage2D(o.TEXTURE_CUBE_MAP_POSITIVE_X+zt,0,Dt,E.width,E.height,0,Ut,Gt,null)}}else dt(E.depthTexture,0);const Lt=vt.__webglTexture,Ft=je(E),St=rt?o.TEXTURE_CUBE_MAP_POSITIVE_X+it:o.TEXTURE_2D,Et=E.depthTexture.format===Vr?o.DEPTH_STENCIL_ATTACHMENT:o.DEPTH_ATTACHMENT;if(E.depthTexture.format===Ts)fn(E)?d.framebufferTexture2DMultisampleEXT(o.FRAMEBUFFER,Et,St,Lt,0,Ft):o.framebufferTexture2D(o.FRAMEBUFFER,Et,St,Lt,0);else if(E.depthTexture.format===Vr)fn(E)?d.framebufferTexture2DMultisampleEXT(o.FRAMEBUFFER,Et,St,Lt,0,Ft):o.framebufferTexture2D(o.FRAMEBUFFER,Et,St,Lt,0);else throw new Error("THREE.WebGLTextures: Unknown depthTexture format.")}function Ee(P){const E=s.get(P),it=P.isWebGLCubeRenderTarget===!0;if(E.__boundDepthTexture!==P.depthTexture){const rt=P.depthTexture;if(E.__depthDisposeCallback&&E.__depthDisposeCallback(),rt){const vt=()=>{delete E.__boundDepthTexture,delete E.__depthDisposeCallback,rt.removeEventListener("dispose",vt)};rt.addEventListener("dispose",vt),E.__depthDisposeCallback=vt}E.__boundDepthTexture=rt}if(P.depthTexture&&!E.__autoAllocateDepthBuffer)if(it)for(let rt=0;rt<6;rt++)$e(E.__webglFramebuffer[rt],P,rt);else{const rt=P.texture.mipmaps;rt&&rt.length>0?$e(E.__webglFramebuffer[0],P,0):$e(E.__webglFramebuffer,P,0)}else if(it){E.__webglDepthbuffer=[];for(let rt=0;rt<6;rt++)if(i.bindFramebuffer(o.FRAMEBUFFER,E.__webglFramebuffer[rt]),E.__webglDepthbuffer[rt]===void 0)E.__webglDepthbuffer[rt]=o.createRenderbuffer(),Ot(E.__webglDepthbuffer[rt],P,!1);else{const vt=P.stencilBuffer?o.DEPTH_STENCIL_ATTACHMENT:o.DEPTH_ATTACHMENT,Lt=E.__webglDepthbuffer[rt];o.bindRenderbuffer(o.RENDERBUFFER,Lt),o.framebufferRenderbuffer(o.FRAMEBUFFER,vt,o.RENDERBUFFER,Lt)}}else{const rt=P.texture.mipmaps;if(rt&&rt.length>0?i.bindFramebuffer(o.FRAMEBUFFER,E.__webglFramebuffer[0]):i.bindFramebuffer(o.FRAMEBUFFER,E.__webglFramebuffer),E.__webglDepthbuffer===void 0)E.__webglDepthbuffer=o.createRenderbuffer(),Ot(E.__webglDepthbuffer,P,!1);else{const vt=P.stencilBuffer?o.DEPTH_STENCIL_ATTACHMENT:o.DEPTH_ATTACHMENT,Lt=E.__webglDepthbuffer;o.bindRenderbuffer(o.RENDERBUFFER,Lt),o.framebufferRenderbuffer(o.FRAMEBUFFER,vt,o.RENDERBUFFER,Lt)}}i.bindFramebuffer(o.FRAMEBUFFER,null)}function Ae(P,E,it){const rt=s.get(P);E!==void 0&&Mt(rt.__webglFramebuffer,P,P.texture,o.COLOR_ATTACHMENT0,o.TEXTURE_2D,0),it!==void 0&&Ee(P)}function Ne(P){const E=P.texture,it=s.get(P),rt=s.get(E);P.addEventListener("dispose",T);const vt=P.textures,Lt=P.isWebGLCubeRenderTarget===!0,Ft=vt.length>1;if(Ft||(rt.__webglTexture===void 0&&(rt.__webglTexture=o.createTexture()),rt.__version=E.version,h.memory.textures++),Lt){it.__webglFramebuffer=[];for(let St=0;St<6;St++)if(E.mipmaps&&E.mipmaps.length>0){it.__webglFramebuffer[St]=[];for(let Et=0;Et<E.mipmaps.length;Et++)it.__webglFramebuffer[St][Et]=o.createFramebuffer()}else it.__webglFramebuffer[St]=o.createFramebuffer()}else{if(E.mipmaps&&E.mipmaps.length>0){it.__webglFramebuffer=[];for(let St=0;St<E.mipmaps.length;St++)it.__webglFramebuffer[St]=o.createFramebuffer()}else it.__webglFramebuffer=o.createFramebuffer();if(Ft)for(let St=0,Et=vt.length;St<Et;St++){const Ut=s.get(vt[St]);Ut.__webglTexture===void 0&&(Ut.__webglTexture=o.createTexture(),h.memory.textures++)}if(P.samples>0&&fn(P)===!1){it.__webglMultisampledFramebuffer=o.createFramebuffer(),it.__webglColorRenderbuffer=[],i.bindFramebuffer(o.FRAMEBUFFER,it.__webglMultisampledFramebuffer);for(let St=0;St<vt.length;St++){const Et=vt[St];it.__webglColorRenderbuffer[St]=o.createRenderbuffer(),o.bindRenderbuffer(o.RENDERBUFFER,it.__webglColorRenderbuffer[St]);const Ut=f.convert(Et.format,Et.colorSpace),Gt=f.convert(Et.type),Dt=N(Et.internalFormat,Ut,Gt,Et.normalized,Et.colorSpace,P.isXRRenderTarget===!0),zt=je(P);o.renderbufferStorageMultisample(o.RENDERBUFFER,zt,Dt,P.width,P.height),o.framebufferRenderbuffer(o.FRAMEBUFFER,o.COLOR_ATTACHMENT0+St,o.RENDERBUFFER,it.__webglColorRenderbuffer[St])}o.bindRenderbuffer(o.RENDERBUFFER,null),P.depthBuffer&&(it.__webglDepthRenderbuffer=o.createRenderbuffer(),Ot(it.__webglDepthRenderbuffer,P,!0)),i.bindFramebuffer(o.FRAMEBUFFER,null)}}if(Lt){i.bindTexture(o.TEXTURE_CUBE_MAP,rt.__webglTexture),_t(o.TEXTURE_CUBE_MAP,E);for(let St=0;St<6;St++)if(E.mipmaps&&E.mipmaps.length>0)for(let Et=0;Et<E.mipmaps.length;Et++)Mt(it.__webglFramebuffer[St][Et],P,E,o.COLOR_ATTACHMENT0,o.TEXTURE_CUBE_MAP_POSITIVE_X+St,Et);else Mt(it.__webglFramebuffer[St],P,E,o.COLOR_ATTACHMENT0,o.TEXTURE_CUBE_MAP_POSITIVE_X+St,0);x(E)&&D(o.TEXTURE_CUBE_MAP),i.unbindTexture()}else if(Ft){for(let St=0,Et=vt.length;St<Et;St++){const Ut=vt[St],Gt=s.get(Ut);let Dt=o.TEXTURE_2D;(P.isWebGL3DRenderTarget||P.isWebGLArrayRenderTarget)&&(Dt=P.isWebGL3DRenderTarget?o.TEXTURE_3D:o.TEXTURE_2D_ARRAY),i.bindTexture(Dt,Gt.__webglTexture),_t(Dt,Ut),Mt(it.__webglFramebuffer,P,Ut,o.COLOR_ATTACHMENT0+St,Dt,0),x(Ut)&&D(Dt)}i.unbindTexture()}else{let St=o.TEXTURE_2D;if((P.isWebGL3DRenderTarget||P.isWebGLArrayRenderTarget)&&(St=P.isWebGL3DRenderTarget?o.TEXTURE_3D:o.TEXTURE_2D_ARRAY),i.bindTexture(St,rt.__webglTexture),_t(St,E),E.mipmaps&&E.mipmaps.length>0)for(let Et=0;Et<E.mipmaps.length;Et++)Mt(it.__webglFramebuffer[Et],P,E,o.COLOR_ATTACHMENT0,St,Et);else Mt(it.__webglFramebuffer,P,E,o.COLOR_ATTACHMENT0,St,0);x(E)&&D(St),i.unbindTexture()}P.depthBuffer&&Ee(P)}function ce(P){const E=P.textures;for(let it=0,rt=E.length;it<rt;it++){const vt=E[it];if(x(vt)){const Lt=F(P),Ft=s.get(vt).__webglTexture;i.bindTexture(Lt,Ft),D(Lt),i.unbindTexture()}}}const fe=[],Jt=[];function Mn(P){if(P.samples>0){if(fn(P)===!1){const E=P.textures,it=P.width,rt=P.height;let vt=o.COLOR_BUFFER_BIT;const Lt=P.stencilBuffer?o.DEPTH_STENCIL_ATTACHMENT:o.DEPTH_ATTACHMENT,Ft=s.get(P),St=E.length>1;if(St)for(let Ut=0;Ut<E.length;Ut++)i.bindFramebuffer(o.FRAMEBUFFER,Ft.__webglMultisampledFramebuffer),o.framebufferRenderbuffer(o.FRAMEBUFFER,o.COLOR_ATTACHMENT0+Ut,o.RENDERBUFFER,null),i.bindFramebuffer(o.FRAMEBUFFER,Ft.__webglFramebuffer),o.framebufferTexture2D(o.DRAW_FRAMEBUFFER,o.COLOR_ATTACHMENT0+Ut,o.TEXTURE_2D,null,0);i.bindFramebuffer(o.READ_FRAMEBUFFER,Ft.__webglMultisampledFramebuffer);const Et=P.texture.mipmaps;Et&&Et.length>0?i.bindFramebuffer(o.DRAW_FRAMEBUFFER,Ft.__webglFramebuffer[0]):i.bindFramebuffer(o.DRAW_FRAMEBUFFER,Ft.__webglFramebuffer);for(let Ut=0;Ut<E.length;Ut++){if(P.resolveDepthBuffer&&(P.depthBuffer&&(vt|=o.DEPTH_BUFFER_BIT),P.stencilBuffer&&P.resolveStencilBuffer&&(vt|=o.STENCIL_BUFFER_BIT)),St){o.framebufferRenderbuffer(o.READ_FRAMEBUFFER,o.COLOR_ATTACHMENT0,o.RENDERBUFFER,Ft.__webglColorRenderbuffer[Ut]);const Gt=s.get(E[Ut]).__webglTexture;o.framebufferTexture2D(o.DRAW_FRAMEBUFFER,o.COLOR_ATTACHMENT0,o.TEXTURE_2D,Gt,0)}o.blitFramebuffer(0,0,it,rt,0,0,it,rt,vt,o.NEAREST),m===!0&&(fe.length=0,Jt.length=0,fe.push(o.COLOR_ATTACHMENT0+Ut),P.depthBuffer&&P.storeMultisampledDepthBuffer===!1&&(fe.push(Lt),Jt.push(Lt),o.invalidateFramebuffer(o.DRAW_FRAMEBUFFER,Jt)),o.invalidateFramebuffer(o.READ_FRAMEBUFFER,fe))}if(i.bindFramebuffer(o.READ_FRAMEBUFFER,null),i.bindFramebuffer(o.DRAW_FRAMEBUFFER,null),St)for(let Ut=0;Ut<E.length;Ut++){i.bindFramebuffer(o.FRAMEBUFFER,Ft.__webglMultisampledFramebuffer),o.framebufferRenderbuffer(o.FRAMEBUFFER,o.COLOR_ATTACHMENT0+Ut,o.RENDERBUFFER,Ft.__webglColorRenderbuffer[Ut]);const Gt=s.get(E[Ut]).__webglTexture;i.bindFramebuffer(o.FRAMEBUFFER,Ft.__webglFramebuffer),o.framebufferTexture2D(o.DRAW_FRAMEBUFFER,o.COLOR_ATTACHMENT0+Ut,o.TEXTURE_2D,Gt,0)}i.bindFramebuffer(o.DRAW_FRAMEBUFFER,Ft.__webglMultisampledFramebuffer)}else if(P.depthBuffer&&P.storeMultisampledDepthBuffer===!1&&m){const E=P.stencilBuffer?o.DEPTH_STENCIL_ATTACHMENT:o.DEPTH_ATTACHMENT;o.invalidateFramebuffer(o.DRAW_FRAMEBUFFER,[E])}}}function je(P){return Math.min(l.maxSamples,P.samples)}function fn(P){const E=s.get(P);return P.samples>0&&e.has("WEBGL_multisampled_render_to_texture")===!0&&E.__useRenderToTexture!==!1}function Y(P){const E=h.render.frame;S.get(P)!==E&&(S.set(P,E),P.update())}function pn(P,E){const it=P.colorSpace,rt=P.format,vt=P.type;return P.isCompressedTexture===!0||P.isVideoTexture===!0||it!==ff&&it!==sr&&(qe.getTransfer(it)===cn?(rt!==wa||vt!==Ji)&&xe("WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):Je("WebGLTextures: Unsupported texture color space:",it)),E}function Ve(P){return typeof HTMLImageElement<"u"&&P instanceof HTMLImageElement?(p.width=P.naturalWidth||P.width,p.height=P.naturalHeight||P.height):typeof VideoFrame<"u"&&P instanceof VideoFrame?(p.width=P.displayWidth,p.height=P.displayHeight):(p.width=P.width,p.height=P.height),p}this.allocateTextureUnit=j,this.resetTextureUnits=lt,this.getTextureUnits=q,this.setTextureUnits=nt,this.setTexture2D=dt,this.setTexture2DArray=ut,this.setTexture3D=mt,this.setTextureCube=gt,this.rebindTextures=Ae,this.setupRenderTarget=Ne,this.updateRenderTargetMipmap=ce,this.updateMultisampleRenderTarget=Mn,this.setupDepthRenderbuffer=Ee,this.setupFrameBufferTexture=Mt,this.useMultisampledRTT=fn,this.isReversedDepthBuffer=function(){return i.buffers.depth.getReversed()}}function JR(o,e){function i(s,l=sr){let f;const h=qe.getTransfer(l);if(s===Ji)return o.UNSIGNED_BYTE;if(s===Em)return o.UNSIGNED_SHORT_4_4_4_4;if(s===bm)return o.UNSIGNED_SHORT_5_5_5_1;if(s===yS)return o.UNSIGNED_INT_5_9_9_9_REV;if(s===MS)return o.UNSIGNED_INT_10F_11F_11F_REV;if(s===xS)return o.BYTE;if(s===SS)return o.SHORT;if(s===ic)return o.UNSIGNED_SHORT;if(s===Mm)return o.INT;if(s===Qa)return o.UNSIGNED_INT;if(s===ja)return o.FLOAT;if(s===Ja)return o.HALF_FLOAT;if(s===ES)return o.ALPHA;if(s===bS)return o.RGB;if(s===wa)return o.RGBA;if(s===Ts)return o.DEPTH_COMPONENT;if(s===Vr)return o.DEPTH_STENCIL;if(s===TS)return o.RED;if(s===Tm)return o.RED_INTEGER;if(s===Wr)return o.RG;if(s===Am)return o.RG_INTEGER;if(s===Rm)return o.RGBA_INTEGER;if(s===af||s===sf||s===rf||s===of)if(h===cn)if(f=e.get("WEBGL_compressed_texture_s3tc_srgb"),f!==null){if(s===af)return f.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(s===sf)return f.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(s===rf)return f.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(s===of)return f.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(f=e.get("WEBGL_compressed_texture_s3tc"),f!==null){if(s===af)return f.COMPRESSED_RGB_S3TC_DXT1_EXT;if(s===sf)return f.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(s===rf)return f.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(s===of)return f.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(s===zp||s===Bp||s===Fp||s===Hp)if(f=e.get("WEBGL_compressed_texture_pvrtc"),f!==null){if(s===zp)return f.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(s===Bp)return f.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(s===Fp)return f.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(s===Hp)return f.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(s===Gp||s===Vp||s===kp||s===Xp||s===Wp||s===cf||s===Yp)if(f=e.get("WEBGL_compressed_texture_etc"),f!==null){if(s===Gp||s===Vp)return h===cn?f.COMPRESSED_SRGB8_ETC2:f.COMPRESSED_RGB8_ETC2;if(s===kp)return h===cn?f.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:f.COMPRESSED_RGBA8_ETC2_EAC;if(s===Xp)return f.COMPRESSED_R11_EAC;if(s===Wp)return f.COMPRESSED_SIGNED_R11_EAC;if(s===cf)return f.COMPRESSED_RG11_EAC;if(s===Yp)return f.COMPRESSED_SIGNED_RG11_EAC}else return null;if(s===qp||s===jp||s===Zp||s===Kp||s===Qp||s===Jp||s===$p||s===tm||s===em||s===nm||s===im||s===am||s===sm||s===rm)if(f=e.get("WEBGL_compressed_texture_astc"),f!==null){if(s===qp)return h===cn?f.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:f.COMPRESSED_RGBA_ASTC_4x4_KHR;if(s===jp)return h===cn?f.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:f.COMPRESSED_RGBA_ASTC_5x4_KHR;if(s===Zp)return h===cn?f.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:f.COMPRESSED_RGBA_ASTC_5x5_KHR;if(s===Kp)return h===cn?f.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:f.COMPRESSED_RGBA_ASTC_6x5_KHR;if(s===Qp)return h===cn?f.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:f.COMPRESSED_RGBA_ASTC_6x6_KHR;if(s===Jp)return h===cn?f.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:f.COMPRESSED_RGBA_ASTC_8x5_KHR;if(s===$p)return h===cn?f.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:f.COMPRESSED_RGBA_ASTC_8x6_KHR;if(s===tm)return h===cn?f.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:f.COMPRESSED_RGBA_ASTC_8x8_KHR;if(s===em)return h===cn?f.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:f.COMPRESSED_RGBA_ASTC_10x5_KHR;if(s===nm)return h===cn?f.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:f.COMPRESSED_RGBA_ASTC_10x6_KHR;if(s===im)return h===cn?f.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:f.COMPRESSED_RGBA_ASTC_10x8_KHR;if(s===am)return h===cn?f.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:f.COMPRESSED_RGBA_ASTC_10x10_KHR;if(s===sm)return h===cn?f.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:f.COMPRESSED_RGBA_ASTC_12x10_KHR;if(s===rm)return h===cn?f.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:f.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(s===om||s===lm||s===cm)if(f=e.get("EXT_texture_compression_bptc"),f!==null){if(s===om)return h===cn?f.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:f.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(s===lm)return f.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(s===cm)return f.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(s===um||s===fm||s===uf||s===hm)if(f=e.get("EXT_texture_compression_rgtc"),f!==null){if(s===um)return f.COMPRESSED_RED_RGTC1_EXT;if(s===fm)return f.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(s===uf)return f.COMPRESSED_RED_GREEN_RGTC2_EXT;if(s===hm)return f.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return s===ac?o.UNSIGNED_INT_24_8:o[s]!==void 0?o[s]:null}return{convert:i}}const $R=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,tw=`
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

}`;class ew{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(e,i){if(this.texture===null){const s=new LS(e.texture);(e.depthNear!==i.depthNear||e.depthFar!==i.depthFar)&&(this.depthNear=e.depthNear,this.depthFar=e.depthFar),this.texture=s}}getMesh(e){if(this.texture!==null&&this.mesh===null){const i=e.cameras[0].viewport,s=new $a({vertexShader:$R,fragmentShader:tw,uniforms:{depthColor:{value:this.texture},depthWidth:{value:i.z},depthHeight:{value:i.w}}});this.mesh=new he(new uc(20,20),s)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}}class nw extends lr{constructor(e,i){super();const s=this;let l=null,f=1,h=null,d="local-floor",m=1,p=null,S=null,v=null,g=null,M=null,R=null;const C=typeof XRWebGLBinding<"u",y=new ew,x={},D=i.getContextAttributes();let F=null,N=null;const L=[],U=[],I=new ye;let T=null,O=null;const V=new Qi;V.viewport=new bn;const Z=new Qi;Z.viewport=new bn;const J=[V,Z],lt=new lT;let q=null,nt=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function($){let pt=L[$];return pt===void 0&&(pt=new ip,L[$]=pt),pt.getTargetRaySpace()},this.getControllerGrip=function($){let pt=L[$];return pt===void 0&&(pt=new ip,L[$]=pt),pt.getGripSpace()},this.getHand=function($){let pt=L[$];return pt===void 0&&(pt=new ip,L[$]=pt),pt.getHandSpace()};function j($){const pt=U.indexOf($.inputSource);if(pt===-1)return;const Ct=L[pt];Ct!==void 0&&(Ct.update($.inputSource,$.frame,p||h),Ct.dispatchEvent({type:$.type,data:$.inputSource}))}function K(){l.removeEventListener("select",j),l.removeEventListener("selectstart",j),l.removeEventListener("selectend",j),l.removeEventListener("squeeze",j),l.removeEventListener("squeezestart",j),l.removeEventListener("squeezeend",j),l.removeEventListener("end",K),l.removeEventListener("inputsourceschange",dt);for(let $=0;$<L.length;$++){const pt=U[$];pt!==null&&(U[$]=null,L[$].disconnect(pt))}q=null,nt=null,y.reset();for(const $ in x)delete x[$];if(e.setRenderTarget(F),M=null,g=null,v=null,l=null,N=null,Rt.stop(),s.isPresenting=!1,e.setPixelRatio(T),e.setSize(I.width,I.height,!1),O!==null){const $=O.camera;$.fov=O.fov,$.zoom=O.zoom,$.updateProjectionMatrix(),O=null}s.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function($){f=$,s.isPresenting===!0&&xe("WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function($){d=$,s.isPresenting===!0&&xe("WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return p||h},this.setReferenceSpace=function($){p=$},this.getBaseLayer=function(){return g!==null?g:M},this.getBinding=function(){return v===null&&C&&(v=new XRWebGLBinding(l,i)),v},this.getFrame=function(){return R},this.getSession=function(){return l},this.setSession=async function($){if(l=$,l!==null){if(F=e.getRenderTarget(),l.addEventListener("select",j),l.addEventListener("selectstart",j),l.addEventListener("selectend",j),l.addEventListener("squeeze",j),l.addEventListener("squeezestart",j),l.addEventListener("squeezeend",j),l.addEventListener("end",K),l.addEventListener("inputsourceschange",dt),D.xrCompatible!==!0&&await i.makeXRCompatible(),T=e.getPixelRatio(),e.getSize(I),C&&"createProjectionLayer"in XRWebGLBinding.prototype){let Ct=null,Yt=null,Mt=null;D.depth&&(Mt=D.stencil?i.DEPTH24_STENCIL8:i.DEPTH_COMPONENT24,Ct=D.stencil?Vr:Ts,Yt=D.stencil?ac:Qa);const Ot={colorFormat:i.RGBA8,depthFormat:Mt,scaleFactor:f};v=this.getBinding(),g=v.createProjectionLayer(Ot),l.updateRenderState({layers:[g]}),e.setPixelRatio(1),e.setSize(g.textureWidth,g.textureHeight,!1),N=new Ca(g.textureWidth,g.textureHeight,{format:wa,type:Ji,depthTexture:new rc(g.textureWidth,g.textureHeight,Yt,void 0,void 0,void 0,void 0,void 0,void 0,Ct),stencilBuffer:D.stencil,colorSpace:e.outputColorSpace,samples:D.antialias?4:0,resolveDepthBuffer:g.ignoreDepthValues===!1,resolveStencilBuffer:g.ignoreDepthValues===!1,storeMultisampledDepthBuffer:g.ignoreDepthValues===!1,storeMultisampledStencilBuffer:g.ignoreDepthValues===!1})}else{const Ct={antialias:D.antialias,alpha:!0,depth:D.depth,stencil:D.stencil,framebufferScaleFactor:f};M=new XRWebGLLayer(l,i,Ct),l.updateRenderState({baseLayer:M}),e.setPixelRatio(1),e.setSize(M.framebufferWidth,M.framebufferHeight,!1),N=new Ca(M.framebufferWidth,M.framebufferHeight,{format:wa,type:Ji,colorSpace:e.outputColorSpace,stencilBuffer:D.stencil,resolveDepthBuffer:M.ignoreDepthValues===!1,resolveStencilBuffer:M.ignoreDepthValues===!1,storeMultisampledDepthBuffer:M.ignoreDepthValues===!1,storeMultisampledStencilBuffer:M.ignoreDepthValues===!1})}N.isXRRenderTarget=!0,this.setFoveation(m),p=null,h=await l.requestReferenceSpace(d),Rt.setContext(l),Rt.start(),s.isPresenting=!0,s.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(l!==null)return l.environmentBlendMode},this.getDepthTexture=function(){return y.getDepthTexture()};function dt($){for(let pt=0;pt<$.removed.length;pt++){const Ct=$.removed[pt],Yt=U.indexOf(Ct);Yt>=0&&(U[Yt]=null,L[Yt].disconnect(Ct))}for(let pt=0;pt<$.added.length;pt++){const Ct=$.added[pt];let Yt=U.indexOf(Ct);if(Yt===-1){for(let Ot=0;Ot<L.length;Ot++)if(Ot>=U.length){U.push(Ct),Yt=Ot;break}else if(U[Ot]===null){U[Ot]=Ct,Yt=Ot;break}if(Yt===-1)break}const Mt=L[Yt];Mt&&Mt.connect(Ct)}}const ut=new k,mt=new k;function gt($,pt,Ct){ut.setFromMatrixPosition(pt.matrixWorld),mt.setFromMatrixPosition(Ct.matrixWorld);const Yt=ut.distanceTo(mt),Mt=pt.projectionMatrix.elements,Ot=Ct.projectionMatrix.elements,$e=Mt[14]/(Mt[10]-1),Ee=Mt[14]/(Mt[10]+1),Ae=(Mt[9]+1)/Mt[5],Ne=(Mt[9]-1)/Mt[5],ce=(Mt[8]-1)/Mt[0],fe=(Ot[8]+1)/Ot[0],Jt=$e*ce,Mn=$e*fe,je=Yt/(-ce+fe),fn=je*-ce;if(pt.matrixWorld.decompose($.position,$.quaternion,$.scale),$.translateX(fn),$.translateZ(je),$.matrixWorld.compose($.position,$.quaternion,$.scale),$.matrixWorldInverse.copy($.matrixWorld).invert(),Mt[10]===-1)$.projectionMatrix.copy(pt.projectionMatrix),$.projectionMatrixInverse.copy(pt.projectionMatrixInverse);else{const Y=$e+je,pn=Ee+je,Ve=Jt-fn,P=Mn+(Yt-fn),E=Ae*Ee/pn*Y,it=Ne*Ee/pn*Y;$.projectionMatrix.makePerspective(Ve,P,E,it,Y,pn),$.projectionMatrixInverse.copy($.projectionMatrix).invert()}}function ie($,pt){pt===null?$.matrixWorld.copy($.matrix):$.matrixWorld.multiplyMatrices(pt.matrixWorld,$.matrix),$.matrixWorldInverse.copy($.matrixWorld).invert()}this.updateCamera=function($){if(l===null)return;let pt=$.near,Ct=$.far;y.texture!==null&&(y.depthNear>0&&(pt=y.depthNear),y.depthFar>0&&(Ct=y.depthFar)),lt.near=Z.near=V.near=pt,lt.far=Z.far=V.far=Ct,(q!==lt.near||nt!==lt.far)&&(l.updateRenderState({depthNear:lt.near,depthFar:lt.far}),q=lt.near,nt=lt.far),lt.layers.mask=$.layers.mask|6,V.layers.mask=lt.layers.mask&-5,Z.layers.mask=lt.layers.mask&-3;const Yt=$.parent,Mt=lt.cameras;ie(lt,Yt);for(let Ot=0;Ot<Mt.length;Ot++)ie(Mt[Ot],Yt);Mt.length===2?gt(lt,V,Z):lt.projectionMatrix.copy(V.projectionMatrix),O===null&&$.isPerspectiveCamera&&(O={camera:$,fov:$.fov,zoom:$.zoom}),ae($,lt,Yt)};function ae($,pt,Ct){Ct===null?$.matrix.copy(pt.matrixWorld):($.matrix.copy(Ct.matrixWorld),$.matrix.invert(),$.matrix.multiply(pt.matrixWorld)),$.matrix.decompose($.position,$.quaternion,$.scale),$.updateMatrixWorld(!0),$.projectionMatrix.copy(pt.projectionMatrix),$.projectionMatrixInverse.copy(pt.projectionMatrixInverse),$.isPerspectiveCamera&&($.fov=pm*2*Math.atan(1/$.projectionMatrix.elements[5]),$.zoom=1)}this.getCamera=function(){return lt},this.getFoveation=function(){if(!(g===null&&M===null))return m},this.setFoveation=function($){m=$,g!==null&&(g.fixedFoveation=$),M!==null&&M.fixedFoveation!==void 0&&(M.fixedFoveation=$)},this.hasDepthSensing=function(){return y.texture!==null},this.getDepthSensingMesh=function(){return y.getMesh(lt)},this.getCameraTexture=function($){return x[$]};let B=null;function _t($,pt){if(S=pt.getViewerPose(p||h),R=pt,S!==null){const Ct=S.views;M!==null&&(e.setRenderTargetFramebuffer(N,M.framebuffer),e.setRenderTarget(N));let Yt=!1;Ct.length!==lt.cameras.length&&(lt.cameras.length=0,Yt=!0);for(let Ee=0;Ee<Ct.length;Ee++){const Ae=Ct[Ee];let Ne=null;if(M!==null)Ne=M.getViewport(Ae);else{const fe=v.getViewSubImage(g,Ae);Ne=fe.viewport,Ee===0&&(e.setRenderTargetTextures(N,fe.colorTexture,fe.depthStencilTexture),e.setRenderTarget(N))}let ce=J[Ee];ce===void 0&&(ce=new Qi,ce.layers.enable(Ee),ce.viewport=new bn,J[Ee]=ce),ce.matrix.fromArray(Ae.transform.matrix),ce.matrix.decompose(ce.position,ce.quaternion,ce.scale),ce.projectionMatrix.fromArray(Ae.projectionMatrix),ce.projectionMatrixInverse.copy(ce.projectionMatrix).invert(),ce.viewport.set(Ne.x,Ne.y,Ne.width,Ne.height),Ee===0&&(lt.matrix.copy(ce.matrix),lt.matrix.decompose(lt.position,lt.quaternion,lt.scale)),Yt===!0&&lt.cameras.push(ce)}const Mt=l.enabledFeatures;if(Mt&&Mt.includes("depth-sensing")&&l.depthUsage=="gpu-optimized"&&C){v=s.getBinding();const Ee=v.getDepthInformation(Ct[0]);Ee&&Ee.isValid&&Ee.texture&&y.init(Ee,l.renderState)}if(Mt&&Mt.includes("camera-access")&&C){e.state.unbindTexture(),v=s.getBinding();for(let Ee=0;Ee<Ct.length;Ee++){const Ae=Ct[Ee].camera;if(Ae){let Ne=x[Ae];Ne||(Ne=new LS,x[Ae]=Ne);const ce=v.getCameraImage(Ae);Ne.sourceTexture=ce}}}}for(let Ct=0;Ct<L.length;Ct++){const Yt=U[Ct],Mt=L[Ct];Yt!==null&&Mt!==void 0&&Mt.update(Yt,pt,p||h)}B&&B($,pt),pt.detectedPlanes&&s.dispatchEvent({type:"planesdetected",data:pt}),R=null}const Rt=new zS;Rt.setAnimationLoop(_t),this.setAnimationLoop=function($){B=$},this.dispose=function(){}}}const iw=new yn,XS=new Te;XS.set(-1,0,0,0,1,0,0,0,1);function aw(o,e){function i(y,x){y.matrixAutoUpdate===!0&&y.updateMatrix(),x.value.copy(y.matrix)}function s(y,x){x.color.getRGB(y.fogColor.value,OS(o)),x.isFog?(y.fogNear.value=x.near,y.fogFar.value=x.far):x.isFogExp2&&(y.fogDensity.value=x.density)}function l(y,x,D,F,N){x.isNodeMaterial?x.uniformsNeedUpdate=!1:x.isMeshBasicMaterial?f(y,x):x.isMeshLambertMaterial?(f(y,x),x.envMap&&(y.envMapIntensity.value=x.envMapIntensity)):x.isMeshToonMaterial?(f(y,x),v(y,x)):x.isMeshPhongMaterial?(f(y,x),S(y,x),x.envMap&&(y.envMapIntensity.value=x.envMapIntensity)):x.isMeshStandardMaterial?(f(y,x),g(y,x),x.isMeshPhysicalMaterial&&M(y,x,N)):x.isMeshMatcapMaterial?(f(y,x),R(y,x)):x.isMeshDepthMaterial?f(y,x):x.isMeshDistanceMaterial?(f(y,x),C(y,x)):x.isMeshNormalMaterial?f(y,x):x.isLineBasicMaterial?(h(y,x),x.isLineDashedMaterial&&d(y,x)):x.isPointsMaterial?m(y,x,D,F):x.isSpriteMaterial?p(y,x):x.isShadowMaterial?(y.color.value.copy(x.color),y.opacity.value=x.opacity):x.isShaderMaterial&&(x.uniformsNeedUpdate=!1)}function f(y,x){y.opacity.value=x.opacity,x.color&&y.diffuse.value.copy(x.color),x.emissive&&y.emissive.value.copy(x.emissive).multiplyScalar(x.emissiveIntensity),x.map&&(y.map.value=x.map,i(x.map,y.mapTransform)),x.alphaMap&&(y.alphaMap.value=x.alphaMap,i(x.alphaMap,y.alphaMapTransform)),x.bumpMap&&(y.bumpMap.value=x.bumpMap,i(x.bumpMap,y.bumpMapTransform),y.bumpScale.value=x.bumpScale,x.side===zi&&(y.bumpScale.value*=-1)),x.normalMap&&(y.normalMap.value=x.normalMap,i(x.normalMap,y.normalMapTransform),y.normalScale.value.copy(x.normalScale),x.side===zi&&y.normalScale.value.negate()),x.displacementMap&&(y.displacementMap.value=x.displacementMap,i(x.displacementMap,y.displacementMapTransform),y.displacementScale.value=x.displacementScale,y.displacementBias.value=x.displacementBias),x.emissiveMap&&(y.emissiveMap.value=x.emissiveMap,i(x.emissiveMap,y.emissiveMapTransform)),x.specularMap&&(y.specularMap.value=x.specularMap,i(x.specularMap,y.specularMapTransform)),x.alphaTest>0&&(y.alphaTest.value=x.alphaTest);const D=e.get(x),F=D.envMap,N=D.envMapRotation;F&&(y.envMap.value=F,y.envMapRotation.value.setFromMatrix4(iw.makeRotationFromEuler(N)).transpose(),F.isCubeTexture&&F.isRenderTargetTexture===!1&&y.envMapRotation.value.premultiply(XS),y.reflectivity.value=x.reflectivity,y.ior.value=x.ior,y.refractionRatio.value=x.refractionRatio),x.lightMap&&(y.lightMap.value=x.lightMap,y.lightMapIntensity.value=x.lightMapIntensity,i(x.lightMap,y.lightMapTransform)),x.aoMap&&(y.aoMap.value=x.aoMap,y.aoMapIntensity.value=x.aoMapIntensity,i(x.aoMap,y.aoMapTransform))}function h(y,x){y.diffuse.value.copy(x.color),y.opacity.value=x.opacity,x.map&&(y.map.value=x.map,i(x.map,y.mapTransform))}function d(y,x){y.dashSize.value=x.dashSize,y.totalSize.value=x.dashSize+x.gapSize,y.scale.value=x.scale}function m(y,x,D,F){y.diffuse.value.copy(x.color),y.opacity.value=x.opacity,y.size.value=x.size*D,y.scale.value=F*.5,x.map&&(y.map.value=x.map,i(x.map,y.uvTransform)),x.alphaMap&&(y.alphaMap.value=x.alphaMap,i(x.alphaMap,y.alphaMapTransform)),x.alphaTest>0&&(y.alphaTest.value=x.alphaTest)}function p(y,x){y.diffuse.value.copy(x.color),y.opacity.value=x.opacity,y.rotation.value=x.rotation,x.map&&(y.map.value=x.map,i(x.map,y.mapTransform)),x.alphaMap&&(y.alphaMap.value=x.alphaMap,i(x.alphaMap,y.alphaMapTransform)),x.alphaTest>0&&(y.alphaTest.value=x.alphaTest)}function S(y,x){y.specular.value.copy(x.specular),y.shininess.value=Math.max(x.shininess,1e-4)}function v(y,x){x.gradientMap&&(y.gradientMap.value=x.gradientMap)}function g(y,x){y.metalness.value=x.metalness,x.metalnessMap&&(y.metalnessMap.value=x.metalnessMap,i(x.metalnessMap,y.metalnessMapTransform)),y.roughness.value=x.roughness,x.roughnessMap&&(y.roughnessMap.value=x.roughnessMap,i(x.roughnessMap,y.roughnessMapTransform)),x.envMap&&(y.envMapIntensity.value=x.envMapIntensity)}function M(y,x,D){y.ior.value=x.ior,x.sheen>0&&(y.sheenColor.value.copy(x.sheenColor).multiplyScalar(x.sheen),y.sheenRoughness.value=x.sheenRoughness,x.sheenColorMap&&(y.sheenColorMap.value=x.sheenColorMap,i(x.sheenColorMap,y.sheenColorMapTransform)),x.sheenRoughnessMap&&(y.sheenRoughnessMap.value=x.sheenRoughnessMap,i(x.sheenRoughnessMap,y.sheenRoughnessMapTransform))),x.clearcoat>0&&(y.clearcoat.value=x.clearcoat,y.clearcoatRoughness.value=x.clearcoatRoughness,x.clearcoatMap&&(y.clearcoatMap.value=x.clearcoatMap,i(x.clearcoatMap,y.clearcoatMapTransform)),x.clearcoatRoughnessMap&&(y.clearcoatRoughnessMap.value=x.clearcoatRoughnessMap,i(x.clearcoatRoughnessMap,y.clearcoatRoughnessMapTransform)),x.clearcoatNormalMap&&(y.clearcoatNormalMap.value=x.clearcoatNormalMap,i(x.clearcoatNormalMap,y.clearcoatNormalMapTransform),y.clearcoatNormalScale.value.copy(x.clearcoatNormalScale),x.side===zi&&y.clearcoatNormalScale.value.negate())),x.dispersion>0&&(y.dispersion.value=x.dispersion),x.retroreflectivity>0&&(y.retroreflectivity.value=x.retroreflectivity),x.iridescence>0&&(y.iridescence.value=x.iridescence,y.iridescenceIOR.value=x.iridescenceIOR,y.iridescenceThicknessMinimum.value=x.iridescenceThicknessRange[0],y.iridescenceThicknessMaximum.value=x.iridescenceThicknessRange[1],x.iridescenceMap&&(y.iridescenceMap.value=x.iridescenceMap,i(x.iridescenceMap,y.iridescenceMapTransform)),x.iridescenceThicknessMap&&(y.iridescenceThicknessMap.value=x.iridescenceThicknessMap,i(x.iridescenceThicknessMap,y.iridescenceThicknessMapTransform))),x.transmission>0&&(y.transmission.value=x.transmission,y.transmissionSamplerMap.value=D.texture,y.transmissionSamplerSize.value.set(D.width,D.height),x.transmissionMap&&(y.transmissionMap.value=x.transmissionMap,i(x.transmissionMap,y.transmissionMapTransform)),y.thickness.value=x.thickness,x.thicknessMap&&(y.thicknessMap.value=x.thicknessMap,i(x.thicknessMap,y.thicknessMapTransform)),y.attenuationDistance.value=x.attenuationDistance,y.attenuationColor.value.copy(x.attenuationColor)),x.anisotropy>0&&(y.anisotropyVector.value.set(x.anisotropy*Math.cos(x.anisotropyRotation),x.anisotropy*Math.sin(x.anisotropyRotation)),x.anisotropyMap&&(y.anisotropyMap.value=x.anisotropyMap,i(x.anisotropyMap,y.anisotropyMapTransform))),y.specularIntensity.value=x.specularIntensity,y.specularColor.value.copy(x.specularColor),x.specularColorMap&&(y.specularColorMap.value=x.specularColorMap,i(x.specularColorMap,y.specularColorMapTransform)),x.specularIntensityMap&&(y.specularIntensityMap.value=x.specularIntensityMap,i(x.specularIntensityMap,y.specularIntensityMapTransform))}function R(y,x){x.matcap&&(y.matcap.value=x.matcap)}function C(y,x){const D=e.get(x).light;y.referencePosition.value.setFromMatrixPosition(D.matrixWorld),y.nearDistance.value=D.shadow.camera.near,y.farDistance.value=D.shadow.camera.far}return{refreshFogUniforms:s,refreshMaterialUniforms:l}}function sw(o,e,i,s){let l={},f={},h=[];const d=o.getParameter(o.MAX_UNIFORM_BUFFER_BINDINGS);function m(N,L){const U=L.program;s.uniformBlockBinding(N,U)}function p(N,L){let U=l[N.id];U===void 0&&(y(N),U=S(N),l[N.id]=U,N.addEventListener("dispose",D));const I=L.program;s.updateUBOMapping(N,I);const T=e.render.frame;f[N.id]!==T&&(g(N),f[N.id]=T)}function S(N){const L=v();N.__bindingPointIndex=L;const U=o.createBuffer(),I=N.__size,T=N.usage;return o.bindBuffer(o.UNIFORM_BUFFER,U),o.bufferData(o.UNIFORM_BUFFER,I,T),o.bindBuffer(o.UNIFORM_BUFFER,null),o.bindBufferBase(o.UNIFORM_BUFFER,L,U),U}function v(){for(let N=0;N<d;N++)if(h.indexOf(N)===-1)return h.push(N),N;return Je("WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function g(N){const L=l[N.id],U=N.uniforms,I=N.__cache;o.bindBuffer(o.UNIFORM_BUFFER,L);for(let T=0,O=U.length;T<O;T++){const V=U[T];if(Array.isArray(V))for(let Z=0,J=V.length;Z<J;Z++)M(V[Z],T,Z,I);else M(V,T,0,I)}o.bindBuffer(o.UNIFORM_BUFFER,null)}function M(N,L,U,I){if(C(N,L,U,I)===!0){const T=N.__offset,O=N.value;if(Array.isArray(O)){let V=0;for(let Z=0;Z<O.length;Z++){const J=O[Z],lt=x(J);R(J,N.__data,V),typeof J!="number"&&typeof J!="boolean"&&!J.isMatrix3&&!ArrayBuffer.isView(J)&&(V+=lt.storage/Float32Array.BYTES_PER_ELEMENT)}}else R(O,N.__data,0);o.bufferSubData(o.UNIFORM_BUFFER,T,N.__data)}}function R(N,L,U){typeof N=="number"||typeof N=="boolean"?L[0]=N:N.isMatrix3?(L[0]=N.elements[0],L[1]=N.elements[1],L[2]=N.elements[2],L[3]=0,L[4]=N.elements[3],L[5]=N.elements[4],L[6]=N.elements[5],L[7]=0,L[8]=N.elements[6],L[9]=N.elements[7],L[10]=N.elements[8],L[11]=0):ArrayBuffer.isView(N)?L.set(new N.constructor(N.buffer,N.byteOffset,L.length)):N.toArray(L,U)}function C(N,L,U,I){const T=N.value,O=L+"_"+U;if(I[O]===void 0)return typeof T=="number"||typeof T=="boolean"?I[O]=T:ArrayBuffer.isView(T)?I[O]=T.slice():I[O]=T.clone(),!0;{const V=I[O];if(typeof T=="number"||typeof T=="boolean"){if(V!==T)return I[O]=T,!0}else{if(ArrayBuffer.isView(T))return!0;if(V.equals(T)===!1)return V.copy(T),!0}}return!1}function y(N){const L=N.uniforms;let U=0;const I=16;for(let O=0,V=L.length;O<V;O++){const Z=Array.isArray(L[O])?L[O]:[L[O]];for(let J=0,lt=Z.length;J<lt;J++){const q=Z[J],nt=Array.isArray(q.value)?q.value:[q.value];for(let j=0,K=nt.length;j<K;j++){const dt=nt[j],ut=x(dt),mt=U%I,gt=mt%ut.boundary,ie=mt+gt;U+=gt,ie!==0&&I-ie<ut.storage&&(U+=I-ie),q.__data=new Float32Array(ut.storage/Float32Array.BYTES_PER_ELEMENT),q.__offset=U,U+=ut.storage}}}const T=U%I;return T>0&&(U+=I-T),N.__size=U,N.__cache={},this}function x(N){const L={boundary:0,storage:0};return typeof N=="number"||typeof N=="boolean"?(L.boundary=4,L.storage=4):N.isVector2?(L.boundary=8,L.storage=8):N.isVector3||N.isColor?(L.boundary=16,L.storage=12):N.isVector4?(L.boundary=16,L.storage=16):N.isMatrix3?(L.boundary=48,L.storage=48):N.isMatrix4?(L.boundary=64,L.storage=64):N.isTexture?xe("WebGLRenderer: Texture samplers can not be part of an uniforms group."):ArrayBuffer.isView(N)?(L.boundary=16,L.storage=N.byteLength):xe("WebGLRenderer: Unsupported uniform value type.",N),L}function D(N){const L=N.target;L.removeEventListener("dispose",D);const U=h.indexOf(L.__bindingPointIndex);h.splice(U,1),o.deleteBuffer(l[L.id]),delete l[L.id],delete f[L.id]}function F(){for(const N in l)o.deleteBuffer(l[N]);h=[],l={},f={}}return{bind:m,update:p,dispose:F}}const rw=new Uint16Array([12469,15057,12620,14925,13266,14620,13807,14376,14323,13990,14545,13625,14713,13328,14840,12882,14931,12528,14996,12233,15039,11829,15066,11525,15080,11295,15085,10976,15082,10705,15073,10495,13880,14564,13898,14542,13977,14430,14158,14124,14393,13732,14556,13410,14702,12996,14814,12596,14891,12291,14937,11834,14957,11489,14958,11194,14943,10803,14921,10506,14893,10278,14858,9960,14484,14039,14487,14025,14499,13941,14524,13740,14574,13468,14654,13106,14743,12678,14818,12344,14867,11893,14889,11509,14893,11180,14881,10751,14852,10428,14812,10128,14765,9754,14712,9466,14764,13480,14764,13475,14766,13440,14766,13347,14769,13070,14786,12713,14816,12387,14844,11957,14860,11549,14868,11215,14855,10751,14825,10403,14782,10044,14729,9651,14666,9352,14599,9029,14967,12835,14966,12831,14963,12804,14954,12723,14936,12564,14917,12347,14900,11958,14886,11569,14878,11247,14859,10765,14828,10401,14784,10011,14727,9600,14660,9289,14586,8893,14508,8533,15111,12234,15110,12234,15104,12216,15092,12156,15067,12010,15028,11776,14981,11500,14942,11205,14902,10752,14861,10393,14812,9991,14752,9570,14682,9252,14603,8808,14519,8445,14431,8145,15209,11449,15208,11451,15202,11451,15190,11438,15163,11384,15117,11274,15055,10979,14994,10648,14932,10343,14871,9936,14803,9532,14729,9218,14645,8742,14556,8381,14461,8020,14365,7603,15273,10603,15272,10607,15267,10619,15256,10631,15231,10614,15182,10535,15118,10389,15042,10167,14963,9787,14883,9447,14800,9115,14710,8665,14615,8318,14514,7911,14411,7507,14279,7198,15314,9675,15313,9683,15309,9712,15298,9759,15277,9797,15229,9773,15166,9668,15084,9487,14995,9274,14898,8910,14800,8539,14697,8234,14590,7790,14479,7409,14367,7067,14178,6621,15337,8619,15337,8631,15333,8677,15325,8769,15305,8871,15264,8940,15202,8909,15119,8775,15022,8565,14916,8328,14804,8009,14688,7614,14569,7287,14448,6888,14321,6483,14088,6171,15350,7402,15350,7419,15347,7480,15340,7613,15322,7804,15287,7973,15229,8057,15148,8012,15046,7846,14933,7611,14810,7357,14682,7069,14552,6656,14421,6316,14251,5948,14007,5528,15356,5942,15356,5977,15353,6119,15348,6294,15332,6551,15302,6824,15249,7044,15171,7122,15070,7050,14949,6861,14818,6611,14679,6349,14538,6067,14398,5651,14189,5311,13935,4958,15359,4123,15359,4153,15356,4296,15353,4646,15338,5160,15311,5508,15263,5829,15188,6042,15088,6094,14966,6001,14826,5796,14678,5543,14527,5287,14377,4985,14133,4586,13869,4257,15360,1563,15360,1642,15358,2076,15354,2636,15341,3350,15317,4019,15273,4429,15203,4732,15105,4911,14981,4932,14836,4818,14679,4621,14517,4386,14359,4156,14083,3795,13808,3437,15360,122,15360,137,15358,285,15355,636,15344,1274,15322,2177,15281,2765,15215,3223,15120,3451,14995,3569,14846,3567,14681,3466,14511,3305,14344,3121,14037,2800,13753,2467,15360,0,15360,1,15359,21,15355,89,15346,253,15325,479,15287,796,15225,1148,15133,1492,15008,1749,14856,1882,14685,1886,14506,1783,14324,1608,13996,1398,13702,1183]);let Ya=null;function ow(){return Ya===null&&(Ya=new Wb(rw,16,16,Wr,Ja),Ya.name="DFG_LUT",Ya.minFilter=hi,Ya.magFilter=hi,Ya.wrapS=ys,Ya.wrapT=ys,Ya.generateMipmaps=!1,Ya.needsUpdate=!0),Ya}class lw{constructor(e={}){const{canvas:i=xb(),context:s=null,depth:l=!0,stencil:f=!1,alpha:h=!1,antialias:d=!1,premultipliedAlpha:m=!0,preserveDrawingBuffer:p=!1,powerPreference:S="default",failIfMajorPerformanceCaveat:v=!1,reversedDepthBuffer:g=!1,outputBufferType:M=Ji}=e;this.isWebGLRenderer=!0;let R;if(s!==null){if(typeof WebGLRenderingContext<"u"&&s instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");R=s.getContextAttributes().alpha}else R=h;const C=M,y=new Set([Rm,Am,Tm]),x=new Set([Ji,Qa,ic,ac,Em,bm]),D=new Uint32Array(4),F=new Int32Array(4),N=new k;let L=null,U=null;const I=[],T=[];let O=null;this.domElement=i,this.debug={checkShaderErrors:!0,diagnostics:{keywords:!1},onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=Ka,this.toneMappingExposure=1,this.transmissionResolutionScale=1;const V=this;let Z=!1,J=null,lt=null,q=null,nt=null;this._outputColorSpace=da;let j=0,K=0,dt=null,ut=-1,mt=null;const gt=new bn,ie=new bn;let ae=null;const B=new We(0);let _t=0,Rt=i.width,$=i.height,pt=1,Ct=null,Yt=null;const Mt=new bn(0,0,Rt,$),Ot=new bn(0,0,Rt,$);let $e=!1;const Ee=new Lm;let Ae=!1,Ne=!1;const ce=new yn,fe=new k,Jt=new bn,Mn={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0};let je=!1;function fn(){return dt===null?pt:1}let Y=s;function pn(A,H){return i.getContext(A,H)}let Ve,P,E,it,rt,vt,Lt,Ft,St,Et,Ut,Gt,Dt,zt,qt,le,me,W,Pt,yt,Bt,Wt,At;try{const A={alpha:!0,depth:l,stencil:f,antialias:d,premultipliedAlpha:m,preserveDrawingBuffer:p,powerPreference:S,failIfMajorPerformanceCaveat:v};if("setAttribute"in i&&i.setAttribute("data-engine",`three.js r${ym}`),i.addEventListener("webglcontextlost",Pe,!1),i.addEventListener("webglcontextrestored",_e,!1),i.addEventListener("webglcontextcreationerror",ii,!1),Y===null){const H="webgl2";if(Y=pn(H,A),Y===null)throw pn(H)?new Error("THREE.WebGLRenderer: Error creating WebGL context with your selected attributes."):new Error("THREE.WebGLRenderer: Error creating WebGL context.")}se()}catch(A){throw i.removeEventListener("webglcontextlost",Pe,!1),i.removeEventListener("webglcontextrestored",_e,!1),i.removeEventListener("webglcontextcreationerror",ii,!1),Je("WebGLRenderer: "+A.message),A}function se(){Ve=new o2(Y),Ve.init(),Bt=new JR(Y,Ve),P=new QA(Y,Ve,e,Bt),E=new KR(Y,Ve),P.reversedDepthBuffer&&g&&E.buffers.depth.setReversed(!0),lt=Y.createFramebuffer(),q=Y.createFramebuffer(),nt=Y.createFramebuffer(),it=new u2(Y),rt=new IR,vt=new QR(Y,Ve,E,rt,P,Bt,it),Lt=new r2(V),Ft=new hT(Y),Wt=new ZA(Y,Ft),St=new l2(Y,Ft,it,Wt),Et=new h2(Y,St,Ft,Wt,it),W=new f2(Y,P,vt),qt=new JA(rt),Ut=new PR(V,Lt,Ve,P,Wt,qt),Gt=new aw(V,rt),Dt=new BR,zt=new XR(Ve),me=new jA(V,Lt,E,Et,R,m),le=new ZR(V,Et,P),At=new sw(Y,it,P,E),Pt=new KA(Y,Ve,it),yt=new c2(Y,Ve,it),it.programs=Ut.programs,V.capabilities=P,V.extensions=Ve,V.properties=rt,V.renderLists=Dt,V.shadowMap=le,V.state=E,V.info=it}C!==Ji&&(O=new p2(C,i.width,i.height,d,l,f));const Ht=new nw(V,Y);this.xr=Ht,this.getContext=function(){return Y},this.getContextAttributes=function(){return Y.getContextAttributes()},this.forceContextLoss=function(){const A=Ve.get("WEBGL_lose_context");A&&A.loseContext()},this.forceContextRestore=function(){const A=Ve.get("WEBGL_lose_context");A&&A.restoreContext()},this.getPixelRatio=function(){return pt},this.setPixelRatio=function(A){A!==void 0&&(pt=A,this.setSize(Rt,$,!1))},this.getSize=function(A){return A.set(Rt,$)},this.setSize=function(A,H,ft=!0){if(Ht.isPresenting){xe("WebGLRenderer: Can't change size while VR device is presenting.");return}Rt=A,$=H,i.width=Math.floor(A*pt),i.height=Math.floor(H*pt),ft===!0&&(i.style.width=A+"px",i.style.height=H+"px"),O!==null&&O.setSize(i.width,i.height),this.setViewport(0,0,A,H)},this.getDrawingBufferSize=function(A){return A.set(Rt*pt,$*pt).floor()},this.setDrawingBufferSize=function(A,H,ft){Rt=A,$=H,pt=ft,i.width=Math.floor(A*ft),i.height=Math.floor(H*ft),this.setViewport(0,0,A,H)},this.setEffects=function(A){if(C===Ji){Je("WebGLRenderer: setEffects() requires outputBufferType set to HalfFloatType or FloatType.");return}if(A){for(let H=0;H<A.length;H++)if(A[H].isOutputPass===!0){xe("WebGLRenderer: OutputPass is not needed in setEffects(). Tone mapping and color space conversion are applied automatically.");break}}O.setEffects(A||[])},this.getCurrentViewport=function(A){return A.copy(gt)},this.getViewport=function(A){return A.copy(Mt)},this.setViewport=function(A,H,ft,st){A.isVector4?Mt.set(A.x,A.y,A.z,A.w):Mt.set(A,H,ft,st),E.viewport(gt.copy(Mt).multiplyScalar(pt).round())},this.getScissor=function(A){return A.copy(Ot)},this.setScissor=function(A,H,ft,st){A.isVector4?Ot.set(A.x,A.y,A.z,A.w):Ot.set(A,H,ft,st),E.scissor(ie.copy(Ot).multiplyScalar(pt).round())},this.getScissorTest=function(){return $e},this.setScissorTest=function(A){E.setScissorTest($e=A)},this.setOpaqueSort=function(A){Ct=A},this.setTransparentSort=function(A){Yt=A},this.getClearColor=function(A){return A.copy(me.getClearColor())},this.setClearColor=function(){me.setClearColor(...arguments)},this.getClearAlpha=function(){return me.getClearAlpha()},this.setClearAlpha=function(){me.setClearAlpha(...arguments)},this.clear=function(A=!0,H=!0,ft=!0){let st=0;if(A){let ot=!1;if(dt!==null){const jt=dt.texture.format;ot=y.has(jt)}if(ot){const jt=dt.texture.type,$t=x.has(jt),It=me.getClearColor(),ee=me.getClearAlpha(),te=It.r,de=It.g,ve=It.b;$t?(D[0]=te,D[1]=de,D[2]=ve,D[3]=ee,Y.clearBufferuiv(Y.COLOR,0,D)):(F[0]=te,F[1]=de,F[2]=ve,F[3]=ee,Y.clearBufferiv(Y.COLOR,0,F))}else st|=Y.COLOR_BUFFER_BIT}H&&(st|=Y.DEPTH_BUFFER_BIT,this.state.buffers.depth.setMask(!0)),ft&&(st|=Y.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),st!==0&&Y.clear(st)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.setNodesHandler=function(A){A.setRenderer(this),J=A},this.dispose=function(){i.removeEventListener("webglcontextlost",Pe,!1),i.removeEventListener("webglcontextrestored",_e,!1),i.removeEventListener("webglcontextcreationerror",ii,!1),me.dispose(),Dt.dispose(),zt.dispose(),rt.dispose(),Lt.dispose(),Et.dispose(),Wt.dispose(),At.dispose(),Ut.dispose(),Ht.dispose(),Ht.removeEventListener("sessionstart",Bi),Ht.removeEventListener("sessionend",Ie),ea.stop()};function Pe(A){A.preventDefault(),ix("WebGLRenderer: Context Lost."),Z=!0}function _e(){ix("WebGLRenderer: Context Restored."),Z=!1;const A=it.autoReset,H=le.enabled,ft=le.autoUpdate,st=le.needsUpdate,ot=le.type;se(),it.autoReset=A,le.enabled=H,le.autoUpdate=ft,le.needsUpdate=st,le.type=ot}function ii(A){Je("WebGLRenderer: A WebGL context could not be created. Reason: ",A.statusMessage)}function di(A){const H=A.target;H.removeEventListener("dispose",di),cr(H)}function cr(A){Na(A),rt.remove(A)}function Na(A){const H=rt.get(A).programs;H!==void 0&&(H.forEach(function(ft){Ut.releaseProgram(ft)}),A.isShaderMaterial&&Ut.releaseShaderCache(A))}this.renderBufferDirect=function(A,H,ft,st,ot,jt){H===null&&(H=Mn);const $t=ot.isMesh&&ot.matrixWorld.determinantAffine()<0,It=Ua(A,H,ft,st,ot);E.setMaterial(st,$t);let ee=ft.index,te=1;if(st.wireframe===!0){if(ee=St.getWireframeAttribute(ft),ee===void 0)return;te=2}const de=ft.drawRange,ve=ft.attributes.position;let Qt=de.start*te,Ue=(de.start+de.count)*te;jt!==null&&(Qt=Math.max(Qt,jt.start*te),Ue=Math.min(Ue,(jt.start+jt.count)*te)),ee!==null?(Qt=Math.max(Qt,0),Ue=Math.min(Ue,ee.count)):ve!=null&&(Qt=Math.max(Qt,0),Ue=Math.min(Ue,ve.count));const be=Ue-Qt;if(be<0||be===1/0)return;Wt.setup(ot,st,It,ft,ee);let Ze,Ye=Pt;if(ee!==null&&(Ze=Ft.get(ee),Ye=yt,Ye.setIndex(Ze)),ot.isMesh)st.wireframe===!0?(E.setLineWidth(st.wireframeLinewidth*fn()),Ye.setMode(Y.LINES)):Ye.setMode(Y.TRIANGLES);else if(ot.isLine){let Tn=st.linewidth;Tn===void 0&&(Tn=1),E.setLineWidth(Tn*fn()),ot.isLineSegments?Ye.setMode(Y.LINES):ot.isLineLoop?Ye.setMode(Y.LINE_LOOP):Ye.setMode(Y.LINE_STRIP)}else ot.isPoints?Ye.setMode(Y.POINTS):ot.isSprite&&Ye.setMode(Y.TRIANGLES);if(ot.isBatchedMesh)if(Ve.get("WEBGL_multi_draw"))Ye.renderMultiDraw(ot._multiDrawStarts,ot._multiDrawCounts,ot._multiDrawCount);else{const Tn=ot._multiDrawStarts,Zt=ot._multiDrawCounts,_n=ot._multiDrawCount,ze=ee?Ft.get(ee).bytesPerElement:1,Zn=rt.get(st).currentProgram.getUniforms();for(let si=0;si<_n;si++)Zn.setValue(Y,"_gl_DrawID",si),Ye.render(Tn[si]/ze,Zt[si])}else if(ot.isInstancedMesh)Ye.renderInstances(Qt,be,ot.count);else if(ft.isInstancedBufferGeometry){const Tn=ft._maxInstanceCount!==void 0?ft._maxInstanceCount:1/0,Zt=Math.min(ft.instanceCount,Tn);Ye.renderInstances(Qt,be,Zt)}else Ye.render(Qt,be)};function ts(A,H,ft,st){J!==null&&A.isNodeMaterial&&J.setObject(st,A),Ae===!0&&qt.setState(A,ft,!1),A.transparent===!0&&A.side===bi&&A.forceSinglePass===!1?(A.side=zi,A.needsUpdate=!0,na(A,H,st),A.side=kr,A.needsUpdate=!0,na(A,H,st),A.side=bi):na(A,H,st)}this.compile=function(A,H,ft=null){ft===null&&(ft=A),J!==null&&J.renderStart(A,H,ft),U=zt.get(ft),U.init(H),T.push(U),ft.traverseVisible(function(ot){ot.isLight&&ot.layers.test(H.layers)&&(U.pushLight(ot),ot.castShadow&&U.pushShadow(ot))}),A!==ft&&A.traverseVisible(function(ot){ot.isLight&&ot.layers.test(H.layers)&&(U.pushLight(ot),ot.castShadow&&U.pushShadow(ot))}),U.setupLights(),J!==null&&J.updateLights(U.state.lightsArray),Ne=this.localClippingEnabled,Ae=qt.init(this.clippingPlanes,Ne),Ae===!0&&qt.setGlobalState(this.clippingPlanes,H),J!==null&&le.render(U.state.shadowsArray,ft,H);const st=new Set;return A.traverse(function(ot){if(!(ot.isMesh||ot.isPoints||ot.isLine||ot.isSprite))return;const jt=ot.material;if(jt)if(Array.isArray(jt))for(let $t=0;$t<jt.length;$t++){const It=jt[$t];ts(It,ft,H,ot),st.add(It)}else ts(jt,ft,H,ot),st.add(jt)}),U=T.pop(),J!==null&&J.renderEnd(),st},this.compileAsync=function(A,H,ft=null){const st=this.compile(A,H,ft);return new Promise(ot=>{function jt(){if(st.forEach(function($t){const ee=rt.get($t).currentProgram;(ee===void 0||ee.isReady())&&st.delete($t)}),st.size===0){ot(A);return}setTimeout(jt,10)}Ve.get("KHR_parallel_shader_compile")!==null?jt():setTimeout(jt,10)})};let _a=null;function ai(A){_a&&_a(A)}function Bi(){ea.stop()}function Ie(){ea.start()}const ea=new zS;ea.setAnimationLoop(ai),typeof self<"u"&&ea.setContext(self),this.setAnimationLoop=function(A){_a=A,Ht.setAnimationLoop(A),A===null?ea.stop():ea.start()},Ht.addEventListener("sessionstart",Bi),Ht.addEventListener("sessionend",Ie),this.render=function(A,H){if(H!==void 0&&H.isCamera!==!0){Je("WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(Z===!0)return;J!==null&&J.renderStart(A,H);const ft=Ht.enabled===!0&&Ht.isPresenting===!0,st=O!==null&&(dt===null||ft)&&O.begin(V,dt);if(A.matrixWorldAutoUpdate===!0&&A.updateMatrixWorld(),H.parent===null&&H.matrixWorldAutoUpdate===!0&&H.updateMatrixWorld(),Ht.enabled===!0&&Ht.isPresenting===!0&&(O===null||O.isCompositing()===!1)&&(Ht.cameraAutoUpdate===!0&&Ht.updateCamera(H),H=Ht.getCamera()),A.isScene===!0&&A.onBeforeRender(V,A,H,dt),U=zt.get(A,T.length),U.init(H),U.state.textureUnits=vt.getTextureUnits(),T.push(U),ce.multiplyMatrices(H.projectionMatrix,H.matrixWorldInverse),Ee.setFromProjectionMatrix(ce,Za,H.reversedDepth),Ne=this.localClippingEnabled,Ae=qt.init(this.clippingPlanes,Ne),L=Dt.get(A,I.length),L.init(),I.push(L),Ht.enabled===!0&&Ht.isPresenting===!0){const $t=V.xr.getDepthSensingMesh();$t!==null&&ur($t,H,-1/0,V.sortObjects)}ur(A,H,0,V.sortObjects),L.finish(),J!==null&&J.updateLights(U.state.lightsArray),V.sortObjects===!0&&L.sort(Ct,Yt),je=Ht.enabled===!1||Ht.isPresenting===!1||Ht.hasDepthSensing()===!1,je&&me.addToRenderList(L,A),this.info.render.frame++,this.info.autoReset===!0&&this.info.reset(),Ae===!0&&qt.beginShadows();const ot=U.state.shadowsArray;if(le.render(ot,A,H),Ae===!0&&qt.endShadows(),(st&&O.hasRenderPass())===!1){const $t=L.opaque,It=L.transmissive;if(U.setupLights(),H.isArrayCamera){const ee=H.cameras;if(It.length>0)for(let te=0,de=ee.length;te<de;te++){const ve=ee[te];As($t,It,A,ve)}je&&me.render(A);for(let te=0,de=ee.length;te<de;te++){const ve=ee[te];es(L,A,ve,ve.viewport)}}else It.length>0&&As($t,It,A,H),je&&me.render(A),es(L,A,H)}dt!==null&&K===0&&(vt.updateMultisampleRenderTarget(dt),vt.updateRenderTargetMipmap(dt)),st&&O.end(V),A.isScene===!0&&A.onAfterRender(V,A,H),Wt.resetDefaultState(),ut=-1,mt=null,T.pop(),T.length>0?(U=T[T.length-1],vt.setTextureUnits(U.state.textureUnits),Ae===!0&&qt.setGlobalState(V.clippingPlanes,U.state.camera)):U=null,I.pop(),I.length>0?L=I[I.length-1]:L=null,J!==null&&J.renderEnd()};function ur(A,H,ft,st){if(A.visible===!1)return;if(A.layers.test(H.layers)){if(A.isGroup)ft=A.renderOrder;else if(A.isLOD)A.autoUpdate===!0&&A.update(H);else if(A.isLightProbeGrid)U.pushLightProbeGrid(A);else if(A.isLight)U.pushLight(A),A.castShadow&&U.pushShadow(A);else if(A.isSprite){if(!A.frustumCulled||A.intersectsFrustum(Ee)){st&&Jt.setFromMatrixPosition(A.matrixWorld).applyMatrix4(ce);const $t=Et.update(A),It=A.material;It.visible&&L.push(A,$t,It,ft,Jt.z,null,H)}}else if((A.isMesh||A.isLine||A.isPoints)&&(!A.frustumCulled||A.intersectsFrustum(Ee))){const $t=Et.update(A),It=A.material;if(st&&(A.boundingSphere!==void 0?(A.boundingSphere===null&&A.computeBoundingSphere(),Jt.copy(A.boundingSphere.center)):($t.boundingSphere===null&&$t.computeBoundingSphere(),Jt.copy($t.boundingSphere.center)),Jt.applyMatrix4(A.matrixWorld).applyMatrix4(ce)),Array.isArray(It)){const ee=$t.groups;for(let te=0,de=ee.length;te<de;te++){const ve=ee[te],Qt=It[ve.materialIndex];Qt&&Qt.visible&&L.push(A,$t,Qt,ft,Jt.z,ve,H)}}else It.visible&&L.push(A,$t,It,ft,Jt.z,null,H)}}const jt=A.children;for(let $t=0,It=jt.length;$t<It;$t++)ur(jt[$t],H,ft,st)}function es(A,H,ft,st){const{opaque:ot,transmissive:jt,transparent:$t}=A;U.setupLightsView(ft),Ae===!0&&qt.setGlobalState(V.clippingPlanes,ft),st&&E.viewport(gt.copy(st)),ot.length>0&&Ai(ot,H,ft),jt.length>0&&Ai(jt,H,ft),$t.length>0&&Ai($t,H,ft),E.buffers.depth.setTest(!0),E.buffers.depth.setMask(!0),E.buffers.color.setMask(!0),E.setPolygonOffset(!1)}function As(A,H,ft,st){if((ft.isScene===!0?ft.overrideMaterial:null)!==null)return;if(U.state.transmissionRenderTarget[st.id]===void 0){const Qt=Ve.has("EXT_color_buffer_half_float")||Ve.has("EXT_color_buffer_float");U.state.transmissionRenderTarget[st.id]=new Ca(1,1,{generateMipmaps:!0,type:Qt?Ja:Ji,minFilter:Gr,samples:Math.max(4,P.samples),stencilBuffer:f,resolveDepthBuffer:!1,resolveStencilBuffer:!1,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,colorSpace:qe.workingColorSpace})}const jt=U.state.transmissionRenderTarget[st.id],$t=st.viewport||gt;jt.setSize($t.z*V.transmissionResolutionScale,$t.w*V.transmissionResolutionScale);const It=V.getRenderTarget(),ee=V.getActiveCubeFace(),te=V.getActiveMipmapLevel();V.setRenderTarget(jt),V.getClearColor(B),_t=V.getClearAlpha(),_t<1&&V.setClearColor(16777215,.5),V.clear(),je&&me.render(ft);const de=V.toneMapping;V.toneMapping=Ka;const ve=st.viewport;if(st.viewport!==void 0&&(st.viewport=void 0),U.setupLightsView(st),Ae===!0&&qt.setGlobalState(V.clippingPlanes,st),Ai(A,ft,st),vt.updateMultisampleRenderTarget(jt),vt.updateRenderTargetMipmap(jt),Ve.has("WEBGL_multisampled_render_to_texture")===!1){let Qt=!1;for(let Ue=0,be=H.length;Ue<be;Ue++){const Ze=H[Ue],{object:Ye,geometry:Tn,material:Zt,group:_n}=Ze;if(Zt.side===bi&&Ye.layers.test(st.layers)){const ze=Zt.side;Zt.side=zi,Zt.needsUpdate=!0,fr(Ye,ft,st,Tn,Zt,_n),Zt.side=ze,Zt.needsUpdate=!0,Qt=!0}}Qt===!0&&(vt.updateMultisampleRenderTarget(jt),vt.updateRenderTargetMipmap(jt))}V.setRenderTarget(It,ee,te),V.setClearColor(B,_t),ve!==void 0&&(st.viewport=ve),V.toneMapping=de}function Ai(A,H,ft){const st=H.isScene===!0?H.overrideMaterial:null;for(let ot=0,jt=A.length;ot<jt;ot++){const $t=A[ot],{object:It,geometry:ee,group:te}=$t;let de=$t.material;de.allowOverride===!0&&st!==null&&(de=st),It.layers.test(ft.layers)&&fr(It,H,ft,ee,de,te)}}function fr(A,H,ft,st,ot,jt){J!==null&&ot.isNodeMaterial&&J.setObject(A,ot),A.onBeforeRender(V,H,ft,st,ot,jt),A.modelViewMatrix.multiplyMatrices(ft.matrixWorldInverse,A.matrixWorld),A.normalMatrix.getNormalMatrix(A.modelViewMatrix),ot.onBeforeRender(V,H,ft,st,A,jt),ot.transparent===!0&&ot.side===bi&&ot.forceSinglePass===!1?(ot.side=zi,ot.needsUpdate=!0,V.renderBufferDirect(ft,H,st,ot,A,jt),ot.side=kr,ot.needsUpdate=!0,V.renderBufferDirect(ft,H,st,ot,A,jt),ot.side=bi):V.renderBufferDirect(ft,H,st,ot,A,jt),A.onAfterRender(V,H,ft,st,ot,jt)}function na(A,H,ft){H.isScene!==!0&&(H=Mn);const st=rt.get(A),ot=U.state.lights,jt=U.state.shadowsArray,$t=ot.state.version,It=Ut.getParameters(A,ot.state,jt,H,ft,U.state.lightProbeGridArray),ee=Ut.getProgramCacheKey(It);let te=st.programs;st.environment=A.isMeshStandardMaterial||A.isMeshLambertMaterial||A.isMeshPhongMaterial?H.environment:null,st.fog=H.fog;const de=A.isMeshStandardMaterial||A.isMeshLambertMaterial&&!A.envMap||A.isMeshPhongMaterial&&!A.envMap;st.envMap=Lt.get(A.envMap||st.environment,de),st.envMapRotation=st.environment!==null&&A.envMap===null?H.environmentRotation:A.envMapRotation,te===void 0&&(A.addEventListener("dispose",di),te=new Map,st.programs=te);let ve=te.get(ee);if(ve!==void 0){if(st.currentProgram===ve&&st.lightsStateVersion===$t)return ns(A,It),ve}else It.uniforms=Ut.getUniforms(A),J!==null&&A.isNodeMaterial&&J.build(A,ft,It),A.onBeforeCompile(It,V),ve=Ut.acquireProgram(It,ee),te.set(ee,ve),st.uniforms=It.uniforms;const Qt=st.uniforms;return(!A.isShaderMaterial&&!A.isRawShaderMaterial||A.clipping===!0)&&(Qt.clippingPlanes=qt.uniform),ns(A,It),st.needsLights=La(A),st.lightsStateVersion=$t,st.needsLights&&(Qt.ambientLightColor.value=ot.state.ambient,Qt.lightProbe.value=ot.state.probe,Qt.sunLights.value=ot.state.sun,Qt.sunLightShadows.value=ot.state.sunShadow,Qt.directionalLights.value=ot.state.directional,Qt.directionalLightShadows.value=ot.state.directionalShadow,Qt.spotLights.value=ot.state.spot,Qt.spotLightShadows.value=ot.state.spotShadow,Qt.rectAreaLights.value=ot.state.rectArea,Qt.ltc_1.value=ot.state.rectAreaLTC1,Qt.ltc_2.value=ot.state.rectAreaLTC2,Qt.pointLights.value=ot.state.point,Qt.pointLightShadows.value=ot.state.pointShadow,Qt.hemisphereLights.value=ot.state.hemi,Qt.sunShadowMatrix.value=ot.state.sunShadowMatrix,Qt.sunShadowCascade.value=ot.state.sunShadowCascade,Qt.directionalShadowMatrix.value=ot.state.directionalShadowMatrix,Qt.spotLightMatrix.value=ot.state.spotLightMatrix,Qt.spotLightMap.value=ot.state.spotLightMap,Qt.pointShadowMatrix.value=ot.state.pointShadowMatrix),st.lightProbeGrid=U.state.lightProbeGridArray.length>0,st.currentProgram=ve,st.uniformsList=null,ve}function Da(A){if(A.uniformsList===null){const H=A.currentProgram.getUniforms();A.uniformsList=lf.seqWithValue(H.seq,A.uniforms)}return A.uniformsList}function ns(A,H){const ft=rt.get(A);ft.outputColorSpace=H.outputColorSpace,ft.batching=H.batching,ft.batchingColor=H.batchingColor,ft.instancing=H.instancing,ft.instancingColor=H.instancingColor,ft.instancingMorph=H.instancingMorph,ft.skinning=H.skinning,ft.morphTargets=H.morphTargets,ft.morphNormals=H.morphNormals,ft.morphColors=H.morphColors,ft.morphTargetsCount=H.morphTargetsCount,ft.numClippingPlanes=H.numClippingPlanes,ft.numIntersection=H.numClipIntersection,ft.vertexAlphas=H.vertexAlphas,ft.vertexTangents=H.vertexTangents,ft.toneMapping=H.toneMapping}function hr(A,H){if(A.length===0)return null;if(A.length===1)return A[0].texture!==null?A[0]:null;N.setFromMatrixPosition(H.matrixWorld);for(let ft=0,st=A.length;ft<st;ft++){const ot=A[ft];if(ot.texture!==null&&ot.boundingBox.containsPoint(N))return ot}return null}function Ua(A,H,ft,st,ot){H.isScene!==!0&&(H=Mn),vt.resetTextureUnits();const jt=H.fog,$t=st.isMeshStandardMaterial||st.isMeshLambertMaterial||st.isMeshPhongMaterial?H.environment:null,It=dt===null?V.outputColorSpace:dt.isXRRenderTarget===!0?dt.texture.colorSpace:qe.workingColorSpace,ee=st.isMeshStandardMaterial||st.isMeshLambertMaterial&&!st.envMap||st.isMeshPhongMaterial&&!st.envMap,te=Lt.get(st.envMap||$t,ee),de=st.vertexColors===!0&&!!ft.attributes.color&&ft.attributes.color.itemSize===4,ve=!!ft.attributes.tangent&&(!!st.normalMap||st.anisotropy>0),Qt=!!ft.morphAttributes.position,Ue=!!ft.morphAttributes.normal,be=!!ft.morphAttributes.color;let Ze=Ka;st.toneMapped&&(dt===null||dt.isXRRenderTarget===!0)&&(Ze=V.toneMapping);const Ye=ft.morphAttributes.position||ft.morphAttributes.normal||ft.morphAttributes.color,Tn=Ye!==void 0?Ye.length:0,Zt=rt.get(st),_n=U.state.lights;if(Ae===!0&&(Ne===!0||A!==mt)){const X=A===mt&&st.id===ut;qt.setState(st,A,X)}let ze=!1;st.version===Zt.__version?(Zt.needsLights&&Zt.lightsStateVersion!==_n.state.version||Zt.outputColorSpace!==It||ot.isBatchedMesh&&Zt.batching===!1||!ot.isBatchedMesh&&Zt.batching===!0||ot.isBatchedMesh&&Zt.batchingColor===!0&&ot._colorsTexture===null||ot.isBatchedMesh&&Zt.batchingColor===!1&&ot._colorsTexture!==null||ot.isInstancedMesh&&Zt.instancing===!1||!ot.isInstancedMesh&&Zt.instancing===!0||ot.isSkinnedMesh&&Zt.skinning===!1||!ot.isSkinnedMesh&&Zt.skinning===!0||ot.isInstancedMesh&&Zt.instancingColor===!0&&ot.instanceColor===null||ot.isInstancedMesh&&Zt.instancingColor===!1&&ot.instanceColor!==null||ot.isInstancedMesh&&Zt.instancingMorph===!0&&ot.morphTexture===null||ot.isInstancedMesh&&Zt.instancingMorph===!1&&ot.morphTexture!==null||Zt.envMap!==te||st.fog===!0&&Zt.fog!==jt||Zt.numClippingPlanes!==void 0&&(Zt.numClippingPlanes!==qt.numPlanes||Zt.numIntersection!==qt.numIntersection)||Zt.vertexAlphas!==de||Zt.vertexTangents!==ve||Zt.morphTargets!==Qt||Zt.morphNormals!==Ue||Zt.morphColors!==be||Zt.toneMapping!==Ze||Zt.morphTargetsCount!==Tn||!!Zt.lightProbeGrid!=U.state.lightProbeGridArray.length>0)&&(ze=!0):(ze=!0,Zt.__version=st.version);let Zn=Zt.currentProgram;ze===!0&&(Zn=na(st,H,ot),J&&st.isNodeMaterial&&J.onUpdateProgram(st,Zn,Zt));let si=!1,Ri=!1,Ce=!1;const Ke=Zn.getUniforms(),sn=Zt.uniforms;if(E.useProgram(Zn.program)&&(si=!0,Ri=!0,Ce=!0),st.id!==ut&&(ut=st.id,Ri=!0),Zt.needsLights){const X=hr(U.state.lightProbeGridArray,ot);Zt.lightProbeGrid!==X&&(Zt.lightProbeGrid=X,Ri=!0)}if(si||mt!==A){E.buffers.depth.getReversed()&&A.reversedDepth!==!0&&(A._reversedDepth=!0,A.updateProjectionMatrix()),Ke.setValue(Y,"projectionMatrix",A.projectionMatrix),Ke.setValue(Y,"viewMatrix",A.matrixWorldInverse);const xt=Ke.map.cameraPosition;xt!==void 0&&xt.setValue(Y,fe.setFromMatrixPosition(A.matrixWorld)),P.logarithmicDepthBuffer&&Ke.setValue(Y,"logDepthBufFC",2/(Math.log(A.far+1)/Math.LN2)),(st.isMeshPhongMaterial||st.isMeshToonMaterial||st.isMeshLambertMaterial||st.isMeshBasicMaterial||st.isMeshStandardMaterial||st.isShaderMaterial)&&Ke.setValue(Y,"isOrthographic",A.isOrthographicCamera===!0),mt!==A&&(mt=A,Ri=!0,Ce=!0)}if(Zt.needsLights&&(_n.state.sunShadowMap.length>0&&Ke.setValue(Y,"sunShadowMap",_n.state.sunShadowMap,vt),_n.state.directionalShadowMap.length>0&&Ke.setValue(Y,"directionalShadowMap",_n.state.directionalShadowMap,vt),_n.state.spotShadowMap.length>0&&Ke.setValue(Y,"spotShadowMap",_n.state.spotShadowMap,vt),_n.state.pointShadowMap.length>0&&Ke.setValue(Y,"pointShadowMap",_n.state.pointShadowMap,vt)),ot.isSkinnedMesh){Ke.setOptional(Y,ot,"bindMatrix"),Ke.setOptional(Y,ot,"bindMatrixInverse");const X=ot.skeleton;X&&(X.boneTexture===null&&X.computeBoneTexture(),Ke.setValue(Y,"boneTexture",X.boneTexture,vt))}ot.isBatchedMesh&&(Ke.setOptional(Y,ot,"batchingTexture"),Ke.setValue(Y,"batchingTexture",ot._matricesTexture,vt),Ke.setOptional(Y,ot,"batchingIdTexture"),Ke.setValue(Y,"batchingIdTexture",ot._indirectTexture,vt),Ke.setOptional(Y,ot,"batchingColorTexture"),ot._colorsTexture!==null&&Ke.setValue(Y,"batchingColorTexture",ot._colorsTexture,vt));const ri=ft.morphAttributes;if((ri.position!==void 0||ri.normal!==void 0||ri.color!==void 0)&&W.update(ot,ft,Zn),(Ri||Zt.receiveShadow!==ot.receiveShadow)&&(Zt.receiveShadow=ot.receiveShadow,Ke.setValue(Y,"receiveShadow",ot.receiveShadow)),(st.isMeshStandardMaterial||st.isMeshLambertMaterial||st.isMeshPhongMaterial)&&st.envMap===null&&H.environment!==null&&(sn.envMapIntensity.value=H.environmentIntensity),sn.dfgLUT!==void 0&&(sn.dfgLUT.value=ow()),Ri){if(Ke.setValue(Y,"toneMappingExposure",V.toneMappingExposure),Zt.needsLights&&Rs(sn,Ce),jt&&st.fog===!0&&Gt.refreshFogUniforms(sn,jt),Gt.refreshMaterialUniforms(sn,st,pt,$,U.state.transmissionRenderTarget[A.id]),Zt.needsLights&&Zt.lightProbeGrid){const X=Zt.lightProbeGrid;sn.probesSH.value=X.texture,sn.probesMin.value.copy(X.boundingBox.min),sn.probesMax.value.copy(X.boundingBox.max),sn.probesResolution.value.copy(X.resolution)}lf.upload(Y,Da(Zt),sn,vt)}if(st.isShaderMaterial&&st.uniformsNeedUpdate===!0&&(lf.upload(Y,Da(Zt),sn,vt),st.uniformsNeedUpdate=!1),st.isSpriteMaterial&&Ke.setValue(Y,"center",ot.center),Ke.setValue(Y,"modelViewMatrix",ot.modelViewMatrix),Ke.setValue(Y,"normalMatrix",ot.normalMatrix),Ke.setValue(Y,"modelMatrix",ot.matrixWorld),st.uniformsGroups!==void 0){const X=st.uniformsGroups;for(let xt=0,Nt=X.length;xt<Nt;xt++){const wt=X[xt];At.update(wt,Zn),At.bind(wt,Zn)}}return Zn}function Rs(A,H){A.ambientLightColor.needsUpdate=H,A.lightProbe.needsUpdate=H,A.sunLights.needsUpdate=H,A.sunLightShadows.needsUpdate=H,A.directionalLights.needsUpdate=H,A.directionalLightShadows.needsUpdate=H,A.pointLights.needsUpdate=H,A.pointLightShadows.needsUpdate=H,A.spotLights.needsUpdate=H,A.spotLightShadows.needsUpdate=H,A.rectAreaLights.needsUpdate=H,A.hemisphereLights.needsUpdate=H}function La(A){return A.isMeshLambertMaterial||A.isMeshToonMaterial||A.isMeshPhongMaterial||A.isMeshStandardMaterial||A.isShadowMaterial||A.isShaderMaterial&&A.lights===!0}this.getActiveCubeFace=function(){return j},this.getActiveMipmapLevel=function(){return K},this.getRenderTarget=function(){return dt},this.setRenderTargetTextures=function(A,H,ft){const st=rt.get(A);st.__autoAllocateDepthBuffer=A.resolveDepthBuffer===!1,st.__autoAllocateDepthBuffer===!1&&(st.__useRenderToTexture=!1),rt.get(A.texture).__webglTexture=H,rt.get(A.depthTexture).__webglTexture=st.__autoAllocateDepthBuffer?void 0:ft,st.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(A,H){const ft=rt.get(A);ft.__webglFramebuffer=H,ft.__useDefaultFramebuffer=H===void 0},this.setRenderTarget=function(A,H=0,ft=0){dt=A,j=H,K=ft;let st=null,ot=!1,jt=!1;if(A){const It=rt.get(A);if(It.__useDefaultFramebuffer!==void 0){E.bindFramebuffer(Y.FRAMEBUFFER,It.__webglFramebuffer),gt.copy(A.viewport),ie.copy(A.scissor),ae=A.scissorTest,E.viewport(gt),E.scissor(ie),E.setScissorTest(ae),ut=-1;return}else if(It.__webglFramebuffer===void 0)vt.setupRenderTarget(A);else if(It.__hasExternalTextures)vt.rebindTextures(A,rt.get(A.texture).__webglTexture,rt.get(A.depthTexture).__webglTexture);else if(A.depthBuffer){const de=A.depthTexture;if(It.__boundDepthTexture!==de){if(de!==null&&rt.has(de)&&(A.width!==de.image.width||A.height!==de.image.height))throw new Error("THREE.WebGLRenderer: Attached DepthTexture is initialized to the incorrect size.");vt.setupDepthRenderbuffer(A)}}const ee=A.texture;(ee.isData3DTexture||ee.isDataArrayTexture||ee.isCompressedArrayTexture)&&(jt=!0);const te=rt.get(A).__webglFramebuffer;A.isWebGLCubeRenderTarget?(Array.isArray(te[H])?st=te[H][ft]:st=te[H],ot=!0):A.samples>0&&vt.useMultisampledRTT(A)===!1?st=rt.get(A).__webglMultisampledFramebuffer:Array.isArray(te)?st=te[ft]:st=te,gt.copy(A.viewport),ie.copy(A.scissor),ae=A.scissorTest}else gt.copy(Mt).multiplyScalar(pt).floor(),ie.copy(Ot).multiplyScalar(pt).floor(),ae=$e;if(ft!==0&&(st=lt),E.bindFramebuffer(Y.FRAMEBUFFER,st)&&E.drawBuffers(A,st),E.viewport(gt),E.scissor(ie),E.setScissorTest(ae),ot){const It=rt.get(A.texture);Y.framebufferTexture2D(Y.FRAMEBUFFER,Y.COLOR_ATTACHMENT0,Y.TEXTURE_CUBE_MAP_POSITIVE_X+H,It.__webglTexture,ft)}else if(jt){const It=H;for(let ee=0;ee<A.textures.length;ee++){const te=rt.get(A.textures[ee]);Y.framebufferTextureLayer(Y.FRAMEBUFFER,Y.COLOR_ATTACHMENT0+ee,te.__webglTexture,ft,It)}}else if(A!==null&&ft!==0){const It=rt.get(A.texture);Y.framebufferTexture2D(Y.FRAMEBUFFER,Y.COLOR_ATTACHMENT0,Y.TEXTURE_2D,It.__webglTexture,ft)}ut=-1};function pi(A){const H=rt.get(A);return(H.__readFormat!==A.format||H.__readType!==A.type)&&(H.__readFormat=A.format,H.__readType=A.type,H.__formatReadable=P.textureFormatReadable(A.format),H.__typeReadable=P.textureTypeReadable(A.type)),H}this.readRenderTargetPixels=function(A,H,ft,st,ot,jt,$t,It=0){if(!(A&&A.isWebGLRenderTarget)){Je("WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let ee=rt.get(A).__webglFramebuffer;if(A.isWebGLCubeRenderTarget&&$t!==void 0&&(ee=ee[$t]),ee){E.bindFramebuffer(Y.FRAMEBUFFER,ee);try{const te=A.textures[It],de=te.format,ve=te.type;A.textures.length>1&&Y.readBuffer(Y.COLOR_ATTACHMENT0+It);const Qt=pi(te);if(Qt.__formatReadable===!1){Je("WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(Qt.__typeReadable===!1){Je("WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}H>=0&&H<=A.width-st&&ft>=0&&ft<=A.height-ot&&Y.readPixels(H,ft,st,ot,Bt.convert(de),Bt.convert(ve),jt)}finally{const te=dt!==null?rt.get(dt).__webglFramebuffer:null;E.bindFramebuffer(Y.FRAMEBUFFER,te)}}},this.readRenderTargetPixelsAsync=async function(A,H,ft,st,ot,jt,$t,It=0){if(!(A&&A.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let ee=rt.get(A).__webglFramebuffer;if(A.isWebGLCubeRenderTarget&&$t!==void 0&&(ee=ee[$t]),ee)if(H>=0&&H<=A.width-st&&ft>=0&&ft<=A.height-ot){E.bindFramebuffer(Y.FRAMEBUFFER,ee);const te=A.textures[It],de=te.format,ve=te.type;A.textures.length>1&&Y.readBuffer(Y.COLOR_ATTACHMENT0+It);const Qt=pi(te);if(Qt.__formatReadable===!1)throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(Qt.__typeReadable===!1)throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");const Ue=Y.createBuffer();Y.bindBuffer(Y.PIXEL_PACK_BUFFER,Ue),Y.bufferData(Y.PIXEL_PACK_BUFFER,jt.byteLength,Y.STREAM_READ),Y.readPixels(H,ft,st,ot,Bt.convert(de),Bt.convert(ve),0),Y.bindBuffer(Y.PIXEL_PACK_BUFFER,null);const be=dt!==null?rt.get(dt).__webglFramebuffer:null;E.bindFramebuffer(Y.FRAMEBUFFER,be);const Ze=Y.fenceSync(Y.SYNC_GPU_COMMANDS_COMPLETE,0);return Y.flush(),await Sb(Y,Ze,4),Y.bindBuffer(Y.PIXEL_PACK_BUFFER,Ue),Y.getBufferSubData(Y.PIXEL_PACK_BUFFER,0,jt),Y.bindBuffer(Y.PIXEL_PACK_BUFFER,null),Y.deleteBuffer(Ue),Y.deleteSync(Ze),jt}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")},this.copyFramebufferToTexture=function(A,H=null,ft=0){const st=Math.pow(2,-ft),ot=Math.floor(A.image.width*st),jt=Math.floor(A.image.height*st),$t=H!==null?H.x:0,It=H!==null?H.y:0;vt.setTexture2D(A,0),Y.copyTexSubImage2D(Y.TEXTURE_2D,ft,0,0,$t,It,ot,jt),E.unbindTexture()},this.copyTextureToTexture=function(A,H,ft=null,st=null,ot=0,jt=0){let $t,It,ee,te,de,ve,Qt,Ue,be;const Ze=A.isCompressedTexture?A.mipmaps[jt]:A.image;if(ft!==null)$t=ft.max.x-ft.min.x,It=ft.max.y-ft.min.y,ee=ft.isBox3?ft.max.z-ft.min.z:1,te=ft.min.x,de=ft.min.y,ve=ft.isBox3?ft.min.z:0;else{const sn=Math.pow(2,-ot);$t=Math.floor(Ze.width*sn),It=Math.floor(Ze.height*sn),A.isDataArrayTexture?ee=Ze.depth:A.isData3DTexture?ee=Math.floor(Ze.depth*sn):ee=1,te=0,de=0,ve=0}st!==null?(Qt=st.x,Ue=st.y,be=st.z):(Qt=0,Ue=0,be=0);const Ye=Bt.convert(H.format),Tn=Bt.convert(H.type);let Zt;H.isData3DTexture?(vt.setTexture3D(H,0),Zt=Y.TEXTURE_3D):H.isDataArrayTexture||H.isCompressedArrayTexture?(vt.setTexture2DArray(H,0),Zt=Y.TEXTURE_2D_ARRAY):(vt.setTexture2D(H,0),Zt=Y.TEXTURE_2D),E.activeTexture(Y.TEXTURE0),E.pixelStorei(Y.UNPACK_FLIP_Y_WEBGL,H.flipY),E.pixelStorei(Y.UNPACK_PREMULTIPLY_ALPHA_WEBGL,H.premultiplyAlpha),E.pixelStorei(Y.UNPACK_ALIGNMENT,H.unpackAlignment);const _n=E.getParameter(Y.UNPACK_ROW_LENGTH),ze=E.getParameter(Y.UNPACK_IMAGE_HEIGHT),Zn=E.getParameter(Y.UNPACK_SKIP_PIXELS),si=E.getParameter(Y.UNPACK_SKIP_ROWS),Ri=E.getParameter(Y.UNPACK_SKIP_IMAGES);E.pixelStorei(Y.UNPACK_ROW_LENGTH,Ze.width),E.pixelStorei(Y.UNPACK_IMAGE_HEIGHT,Ze.height),E.pixelStorei(Y.UNPACK_SKIP_PIXELS,te),E.pixelStorei(Y.UNPACK_SKIP_ROWS,de),E.pixelStorei(Y.UNPACK_SKIP_IMAGES,ve);const Ce=A.isDataArrayTexture||A.isData3DTexture,Ke=H.isDataArrayTexture||H.isData3DTexture;if(A.isDepthTexture){const sn=rt.get(A),ri=rt.get(H),X=rt.get(sn.__renderTarget),xt=rt.get(ri.__renderTarget);E.bindFramebuffer(Y.READ_FRAMEBUFFER,X.__webglFramebuffer),E.bindFramebuffer(Y.DRAW_FRAMEBUFFER,xt.__webglFramebuffer);for(let Nt=0;Nt<ee;Nt++)Ce&&(Y.framebufferTextureLayer(Y.READ_FRAMEBUFFER,Y.COLOR_ATTACHMENT0,rt.get(A).__webglTexture,ot,ve+Nt),Y.framebufferTextureLayer(Y.DRAW_FRAMEBUFFER,Y.COLOR_ATTACHMENT0,rt.get(H).__webglTexture,jt,be+Nt)),Y.blitFramebuffer(te,de,$t,It,Qt,Ue,$t,It,Y.DEPTH_BUFFER_BIT,Y.NEAREST);E.bindFramebuffer(Y.READ_FRAMEBUFFER,null),E.bindFramebuffer(Y.DRAW_FRAMEBUFFER,null)}else if(ot!==0||A.isRenderTargetTexture||rt.has(A)){const sn=rt.get(A),ri=rt.get(H);E.bindFramebuffer(Y.READ_FRAMEBUFFER,q),E.bindFramebuffer(Y.DRAW_FRAMEBUFFER,nt);for(let X=0;X<ee;X++)Ce?Y.framebufferTextureLayer(Y.READ_FRAMEBUFFER,Y.COLOR_ATTACHMENT0,sn.__webglTexture,ot,ve+X):Y.framebufferTexture2D(Y.READ_FRAMEBUFFER,Y.COLOR_ATTACHMENT0,Y.TEXTURE_2D,sn.__webglTexture,ot),Ke?Y.framebufferTextureLayer(Y.DRAW_FRAMEBUFFER,Y.COLOR_ATTACHMENT0,ri.__webglTexture,jt,be+X):Y.framebufferTexture2D(Y.DRAW_FRAMEBUFFER,Y.COLOR_ATTACHMENT0,Y.TEXTURE_2D,ri.__webglTexture,jt),ot!==0?Y.blitFramebuffer(te,de,$t,It,Qt,Ue,$t,It,Y.COLOR_BUFFER_BIT,Y.NEAREST):Ke?Y.copyTexSubImage3D(Zt,jt,Qt,Ue,be+X,te,de,$t,It):Y.copyTexSubImage2D(Zt,jt,Qt,Ue,te,de,$t,It);E.bindFramebuffer(Y.READ_FRAMEBUFFER,null),E.bindFramebuffer(Y.DRAW_FRAMEBUFFER,null)}else Ke?A.isDataTexture||A.isData3DTexture?Y.texSubImage3D(Zt,jt,Qt,Ue,be,$t,It,ee,Ye,Tn,Ze.data):H.isCompressedArrayTexture?Y.compressedTexSubImage3D(Zt,jt,Qt,Ue,be,$t,It,ee,Ye,Ze.data):Y.texSubImage3D(Zt,jt,Qt,Ue,be,$t,It,ee,Ye,Tn,Ze):A.isDataTexture?Y.texSubImage2D(Y.TEXTURE_2D,jt,Qt,Ue,$t,It,Ye,Tn,Ze.data):A.isCompressedTexture?Y.compressedTexSubImage2D(Y.TEXTURE_2D,jt,Qt,Ue,Ze.width,Ze.height,Ye,Ze.data):Y.texSubImage2D(Y.TEXTURE_2D,jt,Qt,Ue,$t,It,Ye,Tn,Ze);E.pixelStorei(Y.UNPACK_ROW_LENGTH,_n),E.pixelStorei(Y.UNPACK_IMAGE_HEIGHT,ze),E.pixelStorei(Y.UNPACK_SKIP_PIXELS,Zn),E.pixelStorei(Y.UNPACK_SKIP_ROWS,si),E.pixelStorei(Y.UNPACK_SKIP_IMAGES,Ri),jt===0&&H.generateMipmaps&&Y.generateMipmap(Zt),E.unbindTexture()},this.initRenderTarget=function(A){rt.get(A).__webglFramebuffer===void 0&&vt.setupRenderTarget(A)},this.initTexture=function(A){A.isCubeTexture?vt.setTextureCube(A,0):A.isData3DTexture?vt.setTexture3D(A,0):A.isDataArrayTexture||A.isCompressedArrayTexture?vt.setTexture2DArray(A,0):vt.setTexture2D(A,0),E.unbindTexture()},this.resetState=function(){j=0,K=0,dt=null,E.reset(),Wt.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return Za}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(e){this._outputColorSpace=e;const i=this.getContext();i.drawingBufferColorSpace=qe._getDrawingBufferColorSpace(e),i.unpackColorSpace=qe._getUnpackColorSpace()}}const nS={type:"change"},zm={type:"start"},WS={type:"end"},nf=new Sf,iS=new Ss,cw=Math.cos(70*Eb.DEG2RAD),Fn=new k,Ii=2*Math.PI,un={NONE:-1,ROTATE:0,DOLLY:1,PAN:2,TOUCH_ROTATE:3,TOUCH_PAN:4,TOUCH_DOLLY_PAN:5,TOUCH_DOLLY_ROTATE:6},Rp=1e-6;class uw extends uT{constructor(e,i=null){super(e,i),this.state=un.NONE,this.target=new k,this.cursor=new k,this.minDistance=0,this.maxDistance=1/0,this.minZoom=0,this.maxZoom=1/0,this.minTargetRadius=0,this.maxTargetRadius=1/0,this.minPolarAngle=0,this.maxPolarAngle=Math.PI,this.minAzimuthAngle=-1/0,this.maxAzimuthAngle=1/0,this.enableDamping=!1,this.dampingFactor=.05,this.enableZoom=!0,this.zoomSpeed=1,this.enableRotate=!0,this.rotateSpeed=1,this.keyRotateSpeed=1,this.enablePan=!0,this.panSpeed=1,this.screenSpacePanning=!0,this.keyPanSpeed=7,this.zoomToCursor=!1,this.autoRotate=!1,this.autoRotateSpeed=2,this.keys={LEFT:"ArrowLeft",UP:"ArrowUp",RIGHT:"ArrowRight",BOTTOM:"ArrowDown"},this.mouseButtons={LEFT:Yo.ROTATE,MIDDLE:Yo.DOLLY,RIGHT:Yo.PAN},this.touches={ONE:Xo.ROTATE,TWO:Xo.DOLLY_PAN},this.target0=this.target.clone(),this.position0=this.object.position.clone(),this.zoom0=this.object.zoom,this._cursorStyle="auto",this._domElementKeyEvents=null,this._lastPosition=new k,this._lastQuaternion=new rr,this._lastTargetPosition=new k,this._quat=new rr().setFromUnitVectors(e.up,new k(0,1,0)),this._quatInverse=this._quat.clone().invert(),this._spherical=new Dx,this._sphericalDelta=new Dx,this._scale=1,this._panOffset=new k,this._rotateStart=new ye,this._rotateEnd=new ye,this._rotateDelta=new ye,this._panStart=new ye,this._panEnd=new ye,this._panDelta=new ye,this._dollyStart=new ye,this._dollyEnd=new ye,this._dollyDelta=new ye,this._dollyDirection=new k,this._mouse=new ye,this._performCursorZoom=!1,this._pointers=[],this._pointerPositions={},this._controlActive=!1,this._onPointerMove=hw.bind(this),this._onPointerDown=fw.bind(this),this._onPointerUp=dw.bind(this),this._onContextMenu=Sw.bind(this),this._onMouseWheel=gw.bind(this),this._onKeyDown=_w.bind(this),this._onTouchStart=vw.bind(this),this._onTouchMove=xw.bind(this),this._onMouseDown=pw.bind(this),this._onMouseMove=mw.bind(this),this._interceptControlDown=yw.bind(this),this._interceptControlUp=Mw.bind(this),this.domElement!==null&&this.connect(this.domElement),this.update()}set cursorStyle(e){this._cursorStyle=e,e==="grab"?this.domElement.style.cursor="grab":this.domElement.style.cursor="auto"}get cursorStyle(){return this._cursorStyle}connect(e){super.connect(e),this.domElement.addEventListener("pointerdown",this._onPointerDown),this.domElement.addEventListener("pointercancel",this._onPointerUp),this.domElement.addEventListener("contextmenu",this._onContextMenu),this.domElement.addEventListener("wheel",this._onMouseWheel,{passive:!1}),this.domElement.getRootNode().addEventListener("keydown",this._interceptControlDown,{passive:!0,capture:!0}),this.domElement.style.touchAction="none"}disconnect(){this.state=un.NONE,this.domElement.removeEventListener("pointerdown",this._onPointerDown),this.domElement.ownerDocument.removeEventListener("pointermove",this._onPointerMove),this.domElement.ownerDocument.removeEventListener("pointerup",this._onPointerUp),this.domElement.removeEventListener("pointercancel",this._onPointerUp),this.domElement.removeEventListener("wheel",this._onMouseWheel),this.domElement.removeEventListener("contextmenu",this._onContextMenu),this.stopListenToKeyEvents();const e=this.domElement.getRootNode();e.removeEventListener("keydown",this._interceptControlDown,{capture:!0}),e.removeEventListener("keyup",this._interceptControlUp,{capture:!0}),this._controlActive=!1,this._pointers.length=0,this._pointerPositions={},this.domElement.style.touchAction="",this.domElement.style.cursor="auto"}dispose(){this.disconnect()}getPolarAngle(){return this._spherical.phi}getAzimuthalAngle(){return this._spherical.theta}getDistance(){return this.object.position.distanceTo(this.target)}listenToKeyEvents(e){e.addEventListener("keydown",this._onKeyDown),this._domElementKeyEvents=e}stopListenToKeyEvents(){this._domElementKeyEvents!==null&&(this._domElementKeyEvents.removeEventListener("keydown",this._onKeyDown),this._domElementKeyEvents=null)}saveState(){this.target0.copy(this.target),this.position0.copy(this.object.position),this.zoom0=this.object.zoom}reset(){this.target.copy(this.target0),this.object.position.copy(this.position0),this.object.zoom=this.zoom0,this.object.updateProjectionMatrix(),this.dispatchEvent(nS),this.update(),this.state=un.NONE}pan(e,i){this._pan(e,i),this.update()}dollyIn(e){this._dollyIn(e),this.update()}dollyOut(e){this._dollyOut(e),this.update()}rotateLeft(e){this._rotateLeft(e),this.update()}rotateUp(e){this._rotateUp(e),this.update()}update(e=null){const i=this.object.position;Fn.copy(i).sub(this.target),Fn.applyQuaternion(this._quat),this._spherical.setFromVector3(Fn),this.autoRotate&&this.state===un.NONE&&this._rotateLeft(this._getAutoRotationAngle(e)),this.enableDamping?(this._spherical.theta+=this._sphericalDelta.theta*this.dampingFactor,this._spherical.phi+=this._sphericalDelta.phi*this.dampingFactor):(this._spherical.theta+=this._sphericalDelta.theta,this._spherical.phi+=this._sphericalDelta.phi);let s=this.minAzimuthAngle,l=this.maxAzimuthAngle;isFinite(s)&&isFinite(l)&&(s<-Math.PI?s+=Ii:s>Math.PI&&(s-=Ii),l<-Math.PI?l+=Ii:l>Math.PI&&(l-=Ii),s<=l?this._spherical.theta=Math.max(s,Math.min(l,this._spherical.theta)):this._spherical.theta=this._spherical.theta>(s+l)/2?Math.max(s,this._spherical.theta):Math.min(l,this._spherical.theta)),this._spherical.phi=Math.max(this.minPolarAngle,Math.min(this.maxPolarAngle,this._spherical.phi)),this._spherical.makeSafe(),this.enableDamping===!0?this.target.addScaledVector(this._panOffset,this.dampingFactor):this.target.add(this._panOffset),this.target.sub(this.cursor),this.target.clampLength(this.minTargetRadius,this.maxTargetRadius),this.target.add(this.cursor);let f=!1;if(this.zoomToCursor&&this._performCursorZoom||this.object.isOrthographicCamera)this._spherical.radius=this._clampDistance(this._spherical.radius);else{const h=this._spherical.radius;this._spherical.radius=this._clampDistance(this._spherical.radius*this._scale),f=h!=this._spherical.radius}if(Fn.setFromSpherical(this._spherical),Fn.applyQuaternion(this._quatInverse),i.copy(this.target).add(Fn),this.object.lookAt(this.target),this.enableDamping===!0?(this._sphericalDelta.theta*=1-this.dampingFactor,this._sphericalDelta.phi*=1-this.dampingFactor,this._panOffset.multiplyScalar(1-this.dampingFactor)):(this._sphericalDelta.set(0,0,0),this._panOffset.set(0,0,0)),this.zoomToCursor&&this._performCursorZoom){let h=null;if(this.object.isPerspectiveCamera){const d=Fn.length();h=this._clampDistance(d*this._scale);const m=d-h;this.object.position.addScaledVector(this._dollyDirection,m),this.object.updateMatrixWorld(),f=!!m}else if(this.object.isOrthographicCamera){const d=new k(this._mouse.x,this._mouse.y,0);d.unproject(this.object);const m=this.object.zoom;this.object.zoom=Math.max(this.minZoom,Math.min(this.maxZoom,this.object.zoom/this._scale)),this.object.updateProjectionMatrix(),f=m!==this.object.zoom;const p=new k(this._mouse.x,this._mouse.y,0);p.unproject(this.object),this.object.position.sub(p).add(d),this.object.updateMatrixWorld(),h=Fn.length()}else console.warn("WARNING: OrbitControls.js encountered an unknown camera type - zoom to cursor disabled."),this.zoomToCursor=!1;h!==null&&(this.screenSpacePanning?this.target.set(0,0,-1).transformDirection(this.object.matrix).multiplyScalar(h).add(this.object.position):(nf.origin.copy(this.object.position),nf.direction.set(0,0,-1).transformDirection(this.object.matrix),Math.abs(this.object.up.dot(nf.direction))<cw?this.object.lookAt(this.target):(iS.setFromNormalAndCoplanarPoint(this.object.up,this.target),nf.intersectPlane(iS,this.target))))}else if(this.object.isOrthographicCamera){const h=this.object.zoom;this.object.zoom=Math.max(this.minZoom,Math.min(this.maxZoom,this.object.zoom/this._scale)),h!==this.object.zoom&&(this.object.updateProjectionMatrix(),f=!0)}return this._scale=1,this._performCursorZoom=!1,f||this._lastPosition.distanceToSquared(this.object.position)>Rp||8*(1-this._lastQuaternion.dot(this.object.quaternion))>Rp||this._lastTargetPosition.distanceToSquared(this.target)>Rp?(this.dispatchEvent(nS),this._lastPosition.copy(this.object.position),this._lastQuaternion.copy(this.object.quaternion),this._lastTargetPosition.copy(this.target),!0):!1}_getAutoRotationAngle(e){return e!==null?Ii/60*this.autoRotateSpeed*e:Ii/60/60*this.autoRotateSpeed}_getZoomScale(e){const i=Math.abs(e*.01);return Math.pow(.95,this.zoomSpeed*i)}_rotateLeft(e){this._sphericalDelta.theta-=e}_rotateUp(e){this._sphericalDelta.phi-=e}_panLeft(e,i){Fn.setFromMatrixColumn(i,0),Fn.multiplyScalar(-e),this._panOffset.add(Fn)}_panUp(e,i){this.screenSpacePanning===!0?Fn.setFromMatrixColumn(i,1):(Fn.setFromMatrixColumn(i,0),Fn.crossVectors(this.object.up,Fn)),Fn.multiplyScalar(e),this._panOffset.add(Fn)}_pan(e,i){const s=this.domElement;if(this.object.isPerspectiveCamera){const l=this.object.position;Fn.copy(l).sub(this.target);let f=Fn.length();f*=Math.tan(this.object.fov/2*Math.PI/180),this._panLeft(2*e*f/s.clientHeight,this.object.matrix),this._panUp(2*i*f/s.clientHeight,this.object.matrix)}else this.object.isOrthographicCamera?(this._panLeft(e*(this.object.right-this.object.left)/this.object.zoom/s.clientWidth,this.object.matrix),this._panUp(i*(this.object.top-this.object.bottom)/this.object.zoom/s.clientHeight,this.object.matrix)):(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - pan disabled."),this.enablePan=!1)}_dollyOut(e){this.object.isPerspectiveCamera||this.object.isOrthographicCamera?this._scale/=e:(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),this.enableZoom=!1)}_dollyIn(e){this.object.isPerspectiveCamera||this.object.isOrthographicCamera?this._scale*=e:(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),this.enableZoom=!1)}_updateZoomParameters(e,i){if(!this.zoomToCursor)return;this._performCursorZoom=!0;const s=this.domElement.getBoundingClientRect(),l=e-s.left,f=i-s.top,h=s.width,d=s.height;this._mouse.x=l/h*2-1,this._mouse.y=-(f/d)*2+1,this._dollyDirection.set(this._mouse.x,this._mouse.y,1).unproject(this.object).sub(this.object.position).normalize()}_clampDistance(e){return Math.max(this.minDistance,Math.min(this.maxDistance,e))}_handleMouseDownRotate(e){this._rotateStart.set(e.clientX,e.clientY)}_handleMouseDownDolly(e){this._updateZoomParameters(e.clientX,e.clientX),this._dollyStart.set(e.clientX,e.clientY)}_handleMouseDownPan(e){this._panStart.set(e.clientX,e.clientY)}_handleMouseMoveRotate(e){this._rotateEnd.set(e.clientX,e.clientY),this._rotateDelta.subVectors(this._rotateEnd,this._rotateStart).multiplyScalar(this.rotateSpeed);const i=this.domElement;this._rotateLeft(Ii*this._rotateDelta.x/i.clientHeight),this._rotateUp(Ii*this._rotateDelta.y/i.clientHeight),this._rotateStart.copy(this._rotateEnd),this.update()}_handleMouseMoveDolly(e){this._dollyEnd.set(e.clientX,e.clientY),this._dollyDelta.subVectors(this._dollyEnd,this._dollyStart),this._dollyDelta.y>0?this._dollyOut(this._getZoomScale(this._dollyDelta.y)):this._dollyDelta.y<0&&this._dollyIn(this._getZoomScale(this._dollyDelta.y)),this._dollyStart.copy(this._dollyEnd),this.update()}_handleMouseMovePan(e){this._panEnd.set(e.clientX,e.clientY),this._panDelta.subVectors(this._panEnd,this._panStart).multiplyScalar(this.panSpeed),this._pan(this._panDelta.x,this._panDelta.y),this._panStart.copy(this._panEnd),this.update()}_handleMouseWheel(e){this._updateZoomParameters(e.clientX,e.clientY),e.deltaY<0?this._dollyIn(this._getZoomScale(e.deltaY)):e.deltaY>0&&this._dollyOut(this._getZoomScale(e.deltaY)),this.update()}_handleKeyDown(e){let i=!1;switch(e.code){case this.keys.UP:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateUp(Ii*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(0,this.keyPanSpeed),i=!0;break;case this.keys.BOTTOM:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateUp(-Ii*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(0,-this.keyPanSpeed),i=!0;break;case this.keys.LEFT:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateLeft(Ii*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(this.keyPanSpeed,0),i=!0;break;case this.keys.RIGHT:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateLeft(-Ii*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(-this.keyPanSpeed,0),i=!0;break}i&&(e.preventDefault(),this.update())}_handleTouchStartRotate(e){if(this._pointers.length===1)this._rotateStart.set(e.pageX,e.pageY);else{const i=this._getSecondPointerPosition(e),s=.5*(e.pageX+i.x),l=.5*(e.pageY+i.y);this._rotateStart.set(s,l)}}_handleTouchStartPan(e){if(this._pointers.length===1)this._panStart.set(e.pageX,e.pageY);else{const i=this._getSecondPointerPosition(e),s=.5*(e.pageX+i.x),l=.5*(e.pageY+i.y);this._panStart.set(s,l)}}_handleTouchStartDolly(e){const i=this._getSecondPointerPosition(e),s=e.pageX-i.x,l=e.pageY-i.y,f=Math.sqrt(s*s+l*l);this._dollyStart.set(0,f)}_handleTouchStartDollyPan(e){this.enableZoom&&this._handleTouchStartDolly(e),this.enablePan&&this._handleTouchStartPan(e)}_handleTouchStartDollyRotate(e){this.enableZoom&&this._handleTouchStartDolly(e),this.enableRotate&&this._handleTouchStartRotate(e)}_handleTouchMoveRotate(e){if(this._pointers.length==1)this._rotateEnd.set(e.pageX,e.pageY);else{const s=this._getSecondPointerPosition(e),l=.5*(e.pageX+s.x),f=.5*(e.pageY+s.y);this._rotateEnd.set(l,f)}this._rotateDelta.subVectors(this._rotateEnd,this._rotateStart).multiplyScalar(this.rotateSpeed);const i=this.domElement;this._rotateLeft(Ii*this._rotateDelta.x/i.clientHeight),this._rotateUp(Ii*this._rotateDelta.y/i.clientHeight),this._rotateStart.copy(this._rotateEnd)}_handleTouchMovePan(e){if(this._pointers.length===1)this._panEnd.set(e.pageX,e.pageY);else{const i=this._getSecondPointerPosition(e),s=.5*(e.pageX+i.x),l=.5*(e.pageY+i.y);this._panEnd.set(s,l)}this._panDelta.subVectors(this._panEnd,this._panStart).multiplyScalar(this.panSpeed),this._pan(this._panDelta.x,this._panDelta.y),this._panStart.copy(this._panEnd)}_handleTouchMoveDolly(e){const i=this._getSecondPointerPosition(e),s=e.pageX-i.x,l=e.pageY-i.y,f=Math.sqrt(s*s+l*l);this._dollyEnd.set(0,f),this._dollyDelta.set(0,Math.pow(this._dollyEnd.y/this._dollyStart.y,this.zoomSpeed)),this._dollyOut(this._dollyDelta.y),this._dollyStart.copy(this._dollyEnd);const h=(e.pageX+i.x)*.5,d=(e.pageY+i.y)*.5;this._updateZoomParameters(h,d)}_handleTouchMoveDollyPan(e){this.enableZoom&&this._handleTouchMoveDolly(e),this.enablePan&&this._handleTouchMovePan(e)}_handleTouchMoveDollyRotate(e){this.enableZoom&&this._handleTouchMoveDolly(e),this.enableRotate&&this._handleTouchMoveRotate(e)}_addPointer(e){this._pointers.push(e.pointerId)}_removePointer(e){delete this._pointerPositions[e.pointerId];for(let i=0;i<this._pointers.length;i++)if(this._pointers[i]==e.pointerId){this._pointers.splice(i,1);return}}_isTrackingPointer(e){for(let i=0;i<this._pointers.length;i++)if(this._pointers[i]==e.pointerId)return!0;return!1}_trackPointer(e){let i=this._pointerPositions[e.pointerId];i===void 0&&(i=new ye,this._pointerPositions[e.pointerId]=i),i.set(e.pageX,e.pageY)}_getSecondPointerPosition(e){const i=e.pointerId===this._pointers[0]?this._pointers[1]:this._pointers[0];return this._pointerPositions[i]}_customWheelEvent(e){const i=e.deltaMode,s={clientX:e.clientX,clientY:e.clientY,deltaY:e.deltaY};switch(i){case 1:s.deltaY*=16;break;case 2:s.deltaY*=100;break}return e.ctrlKey&&!this._controlActive&&(s.deltaY*=10),s}}function fw(o){this.enabled!==!1&&(this._pointers.length===0&&(this.domElement.setPointerCapture(o.pointerId),this.domElement.ownerDocument.addEventListener("pointermove",this._onPointerMove),this.domElement.ownerDocument.addEventListener("pointerup",this._onPointerUp)),!this._isTrackingPointer(o)&&(this._addPointer(o),o.pointerType==="touch"?this._onTouchStart(o):this._onMouseDown(o),this._cursorStyle==="grab"&&(this.domElement.style.cursor="grabbing")))}function hw(o){this.enabled!==!1&&(o.pointerType==="touch"?this._onTouchMove(o):this._onMouseMove(o))}function dw(o){switch(this._removePointer(o),this._pointers.length){case 0:this.domElement.releasePointerCapture(o.pointerId),this.domElement.ownerDocument.removeEventListener("pointermove",this._onPointerMove),this.domElement.ownerDocument.removeEventListener("pointerup",this._onPointerUp),this.dispatchEvent(WS),this.state=un.NONE,this._cursorStyle==="grab"&&(this.domElement.style.cursor="grab");break;case 1:const e=this._pointers[0],i=this._pointerPositions[e];this._onTouchStart({pointerId:e,pageX:i.x,pageY:i.y});break}}function pw(o){let e;switch(o.button){case 0:e=this.mouseButtons.LEFT;break;case 1:e=this.mouseButtons.MIDDLE;break;case 2:e=this.mouseButtons.RIGHT;break;default:e=-1}switch(e){case Yo.DOLLY:if(this.enableZoom===!1)return;this._handleMouseDownDolly(o),this.state=un.DOLLY;break;case Yo.ROTATE:if(o.ctrlKey||o.metaKey||o.shiftKey){if(this.enablePan===!1)return;this._handleMouseDownPan(o),this.state=un.PAN}else{if(this.enableRotate===!1)return;this._handleMouseDownRotate(o),this.state=un.ROTATE}break;case Yo.PAN:if(o.ctrlKey||o.metaKey||o.shiftKey){if(this.enableRotate===!1)return;this._handleMouseDownRotate(o),this.state=un.ROTATE}else{if(this.enablePan===!1)return;this._handleMouseDownPan(o),this.state=un.PAN}break;default:this.state=un.NONE}this.state!==un.NONE&&this.dispatchEvent(zm)}function mw(o){switch(this.state){case un.ROTATE:if(this.enableRotate===!1)return;this._handleMouseMoveRotate(o);break;case un.DOLLY:if(this.enableZoom===!1)return;this._handleMouseMoveDolly(o);break;case un.PAN:if(this.enablePan===!1)return;this._handleMouseMovePan(o);break}}function gw(o){this.enabled===!1||this.enableZoom===!1||this.state!==un.NONE||(o.preventDefault(),this.dispatchEvent(zm),this._handleMouseWheel(this._customWheelEvent(o)),this.dispatchEvent(WS))}function _w(o){this.enabled!==!1&&this._handleKeyDown(o)}function vw(o){switch(this._trackPointer(o),this._pointers.length){case 1:switch(this.touches.ONE){case Xo.ROTATE:if(this.enableRotate===!1)return;this._handleTouchStartRotate(o),this.state=un.TOUCH_ROTATE;break;case Xo.PAN:if(this.enablePan===!1)return;this._handleTouchStartPan(o),this.state=un.TOUCH_PAN;break;default:this.state=un.NONE}break;case 2:switch(this.touches.TWO){case Xo.DOLLY_PAN:if(this.enableZoom===!1&&this.enablePan===!1)return;this._handleTouchStartDollyPan(o),this.state=un.TOUCH_DOLLY_PAN;break;case Xo.DOLLY_ROTATE:if(this.enableZoom===!1&&this.enableRotate===!1)return;this._handleTouchStartDollyRotate(o),this.state=un.TOUCH_DOLLY_ROTATE;break;default:this.state=un.NONE}break;default:this.state=un.NONE}this.state!==un.NONE&&this.dispatchEvent(zm)}function xw(o){switch(this._trackPointer(o),this.state){case un.TOUCH_ROTATE:if(this.enableRotate===!1)return;this._handleTouchMoveRotate(o),this.update();break;case un.TOUCH_PAN:if(this.enablePan===!1)return;this._handleTouchMovePan(o),this.update();break;case un.TOUCH_DOLLY_PAN:if(this.enableZoom===!1&&this.enablePan===!1)return;this._handleTouchMoveDollyPan(o),this.update();break;case un.TOUCH_DOLLY_ROTATE:if(this.enableZoom===!1&&this.enableRotate===!1)return;this._handleTouchMoveDollyRotate(o),this.update();break;default:this.state=un.NONE}}function Sw(o){this.enabled!==!1&&o.preventDefault()}function yw(o){o.key==="Control"&&(this._controlActive=!0,this.domElement.getRootNode().addEventListener("keyup",this._interceptControlUp,{passive:!0,capture:!0}))}function Mw(o){o.key==="Control"&&(this._controlActive=!1,this.domElement.getRootNode().removeEventListener("keyup",this._interceptControlUp,{passive:!0,capture:!0}))}const YS="/assets/trak-tc820-machine-transparent-D7PwEI2F.png",Ew=[{id:"monitor",label:"监控中心",icon:"⌁",badge:"实时"},{id:"diagnosis",label:"智能诊断",icon:"◇"},{id:"maintenance",label:"维修决策",icon:"▣"},{id:"workorder",label:"工单系统",icon:"□"},{id:"quality",label:"质检系统",icon:"✓"},{id:"report",label:"报告中心",icon:"≡"},{id:"rag",label:"RAG知识问答",icon:"?"},{id:"trace",label:"运行追踪",icon:"⋮"}],Bm=[{id:"TRAK-TC820LTYSI-001",name:"TRAK-TC820LTYSI-001",line:"A线 · 主加工单元",type:"数控车削中心",x:50,y:39,live:!0,image:YS}],bw={"TRAK-TC820LTYSI-001":{name:"TRAK TC820LTYsi 车削中心",line:"A线 · 主加工单元",type:"数控车削中心",x:42,y:58,image:YS},"LNS-QL-SERVO-80-S2-001":{name:"LNS QL Servo 80 S2 棒料送料机",line:"A线 · 上料单元",type:"棒料送料机",x:23,y:46},"ELITE-CS612-ROBOT-001":{name:"ELITE ROBOTS CS612 六轴协作机器人",line:"A线 · 下料协作单元",type:"六轴协作机器人",x:68,y:42}},Tw={turning_center:"数控车削中心",bar_feeder:"棒料送料机",industrial_robot:"工业机器人"},aS=[{x:42,y:58},{x:23,y:46},{x:68,y:42},{x:78,y:62}],qS={critical:"关键规则",threshold:"阈值规则",duration:"持续规则",count:"计数规则",trend:"趋势规则",multi_metric:"多指标规则"},jS={normal:"正常",warning:"预警",alarm:"报警",fault:"故障",running:"运行中",stopped:"已停止",offline:"离线"},Aw={normal:"正常",initial:"初级预警",intermediate:"中级报警",high:"高级故障"},sS={metric:"指标异常",temperature:"温度异常",vibration:"振动异常",alarm:"设备报警",status:"设备状态",trend:"趋势异常",multi_metric:"多指标联合异常"},vm={idle:"等待异常",running:"分析中",completed:"已完成",fallback:"备用诊断",failed:"执行失败"},Rw={get_alarm_definition:"报警定义库"},xm={open:"待处理",in_progress:"处理中",completed:"已完成",closed:"已关闭"},rS=["主轴温度过高怎么检查？","报警 ALM-1001 的处理步骤是什么？","振动异常时应该优先排查哪些部件？"],ww=["执行设备断电和挂牌上锁","检查冷却液液位、流量和冷却泵","空载运行并复测主轴温度"],Cw={closed:"已关闭",open:"已打开",locked:"已锁定",unlocked:"未锁定",released:"已释放",pressed:"已按下",running:"运行中",stopped:"已停止",ready:"已就绪",clamped:"已夹紧",referenced:"已回零",inhibited:"已禁止",overtemperature:"温度过高",pressure_low:"压力不足",rotation_timeout:"旋转超时",clamp_pressure_low:"夹紧压力不足",not_in_position:"未到位",movement_error:"动作异常",alarm:"报警",overload:"过载",high_pressure_low:"高压不足",vibration_high:"振动过高"};async function $i(o,e={}){const i=await fetch(o,{cache:"no-store",headers:{"Content-Type":"application/json"},...e}),s=await i.json();if(!i.ok)throw new Error(s.error||`请求失败：${i.status}`);return s}function fc(o){if(!o)return"--";const e=new Date(o);return Number.isNaN(e.getTime())?o:e.toLocaleTimeString("zh-CN",{hour12:!1})}function ga(o,e){return o[e]||e||"--"}function Nw(o){return o==="fault"?"fault":o==="alarm"?"alarm":o==="warning"?"warning":"normal"}function ZS(o){return o==="high"?"fault":o==="intermediate"?"alarm":o==="initial"?"warning":"normal"}function Dw(o){return(o?.devices?.length?o.devices:Bm).map((i,s)=>{const l=i.device_id||i.id,f=bw[l]||{},h=aS[s%aS.length],d=i.latest_result||o?.latest_results?.[l]||(l===o?.device_id?o?.latest_result:null),m=d?.current_sample||i.current_sample||null;return{id:l,name:i.name||f.name||l,line:f.line||i.line||"产线设备",type:f.type||Tw[i.device_type||i.type]||i.device_type||i.type||"工业设备",x:f.x??i.x??h.x,y:f.y??i.y??h.y,live:i.live!==!1,image:f.image||i.image,result:d,sample:m}})}function Uw(o){return o.kind==="multi_metric"?sS.multi_metric:o.label||sS[o.kind]||o.kind||"监测项"}function Lw(){const[o,e]=Oe.useState(null),[i,s]=Oe.useState("");async function l(){try{e(await $i("/api/monitor/snapshot")),s("")}catch(d){s(d.message)}}Oe.useEffect(()=>{l();const d=window.setInterval(l,1e3);return()=>window.clearInterval(d)},[]);async function f(d){try{e(await $i("/api/monitor/control",{method:"POST",body:JSON.stringify({action:d})})),s("")}catch(m){s(m.message)}}async function h(){try{e(await $i("/api/monitor/reset",{method:"POST",body:"{}"})),s("")}catch(d){s(d.message)}}return{snapshot:o,error:i,control:f,resetStats:h}}function Ow(){const[o,e]=Oe.useState("monitor"),[i,s]=Oe.useState(Bm[0].id),{snapshot:l,error:f,control:h,resetStats:d}=Lw(),m=l?.runner||{},p=Oe.useMemo(()=>Dw(l),[l]),v=(p.find(C=>C.id===i)||p[0])?.result||l?.latest_result,g=v?.current_sample,M=g?.health_score===null||g?.health_score===void 0?"--":`${Number(g.health_score).toFixed(0)} / 100`,R=f||m.last_error?"接口异常":"连接正常";return Oe.useEffect(()=>{p.length&&!p.some(C=>C.id===i)&&s(p[0].id)},[p,i]),b.jsxs("div",{className:"platform-shell",children:[b.jsx(Pw,{activeView:o,onChange:e,connectionText:R,hasError:!!(f||m.last_error)}),b.jsxs("main",{className:"app-shell",children:[b.jsx(Iw,{snapshot:l,runner:m,onControl:h,onReset:d}),o==="monitor"&&b.jsx(zw,{snapshot:l,machines:p,result:v,sample:g,runner:m,healthText:M,selectedMachineId:i,onSelectMachine:s}),o==="diagnosis"&&b.jsx(Qw,{snapshot:l}),o==="maintenance"&&b.jsx(Jw,{snapshot:l}),o==="workorder"&&b.jsx(e3,{snapshot:l,sample:g}),o==="rag"&&b.jsx(i3,{snapshot:l,sample:g}),o==="quality"&&b.jsx(a3,{snapshot:l,sample:g}),o==="report"&&b.jsx($w,{snapshot:l}),o==="trace"&&b.jsx(t3,{snapshot:l}),(f||m.last_error)&&b.jsx("footer",{className:"error-bar",children:f||m.last_error})]})]})}function Pw({activeView:o,onChange:e,connectionText:i,hasError:s}){return b.jsxs("aside",{className:"sidebar","aria-label":"平台导航",children:[b.jsxs("div",{className:"brand-block",children:[b.jsx("span",{className:"brand-mark",children:"IA"}),b.jsxs("div",{children:[b.jsx("strong",{children:"IND-Agent"}),b.jsx("span",{children:"工业智能平台"})]})]}),b.jsx("nav",{className:"side-nav",children:Ew.map(l=>b.jsxs("button",{className:`nav-item ${o===l.id?"active":""}`,type:"button",onClick:()=>e(l.id),children:[b.jsx("span",{className:"nav-icon",children:l.icon}),b.jsx("span",{children:l.label}),l.badge&&b.jsx("em",{children:l.badge})]},l.id))}),b.jsxs("div",{className:"sidebar-card",children:[b.jsx("span",{children:"平台状态"}),b.jsx("strong",{className:s?"bad":"",children:i}),b.jsx("p",{children:"监控服务、诊断智能体和知识工具将统一汇入平台工作台。"})]})]})}function Iw({snapshot:o,runner:e,onControl:i,onReset:s}){const l=o?.device_ids?.length||o?.devices?.length||(o?.device_id?1:0),f=`数据源：${o?.data_source||"设备数据源"} · 接入 ${l||"--"} 台设备 · 在线监测`;return b.jsxs("header",{className:"topbar",children:[b.jsxs("div",{children:[b.jsx("span",{className:"eyebrow",children:"工业运营中台"}),b.jsx("h1",{children:"智能制造统一工作台"}),b.jsx("p",{className:"subline",children:f})]}),b.jsxs("div",{className:"toolbar",children:[b.jsxs("label",{className:"switch-control",title:"开启或暂停自动监测",children:[b.jsx("input",{type:"checkbox",checked:!!e.enabled,onChange:h=>i(h.target.checked?"on":"off")}),b.jsx("span",{className:"switch-track",children:b.jsx("span",{className:"switch-thumb"})}),b.jsx("span",{children:e.enabled?"监测开启":"监测暂停"})]}),b.jsx("button",{className:"button",type:"button",onClick:s,children:"归零统计"})]})]})}function zw({snapshot:o,machines:e,result:i,sample:s,runner:l,healthText:f,selectedMachineId:h,onSelectMachine:d}){const m=e.find(S=>S.id===h)||e[0]||Bm[0],p=!!m.live;return b.jsxs("section",{className:"workspace-view active",children:[b.jsx(Bw,{machines:e,selectedMachineId:m.id,result:i,sample:s,healthText:f,onSelectMachine:d}),b.jsx(Hw,{machine:m,isLiveMachine:p,sample:s,result:i,healthText:f}),p?b.jsxs(b.Fragment,{children:[b.jsx(Gw,{snapshot:o,sample:s,runner:l,healthText:f}),b.jsxs("section",{className:"main-grid",children:[b.jsx(Vw,{result:i,sample:s}),b.jsx(Yw,{snapshot:o,result:i})]}),b.jsxs("section",{className:"lower-grid",children:[b.jsx(jw,{snapshot:o}),b.jsx(Zw,{snapshot:o})]})]}):b.jsxs("section",{className:"panel machine-empty-panel",children:[b.jsx("span",{className:"eyebrow",children:"设备详情"}),b.jsx("h2",{children:"该设备暂未接入实时采集"}),b.jsx("p",{children:"后续接入多设备监控接口后，这里会展示该机器的实时指标、规则判定和诊断结果。"})]})]})}function Bw({machines:o,selectedMachineId:e,result:i,sample:s,healthText:l,onSelectMachine:f}){const h=o.find(S=>S.id===e)||o[0],d=oc(h,h?.result||i),m=o.filter(S=>S.live).length,p=o.filter(S=>{const v=oc(S,S.result);return v!=="normal"&&v!=="idle"}).length;return b.jsxs("section",{className:"panel workshop-panel",children:[b.jsxs("div",{className:"factory-map","aria-label":"车间设备分布图",children:[b.jsx(Fw,{machines:o,selectedMachineId:e,status:d,onSelect:S=>f(S||h?.id)}),b.jsxs("div",{className:"scene-overlay",children:[b.jsxs("div",{children:[b.jsx("span",{className:"eyebrow",children:"车间总览"}),b.jsx("h2",{children:"车间设备状态总览"})]}),b.jsxs("div",{className:"map-legend","aria-label":"状态图例",children:[b.jsxs("span",{children:[b.jsx("i",{className:"legend-dot normal"}),"正常"]}),b.jsxs("span",{children:[b.jsx("i",{className:"legend-dot warning"}),"预警"]}),b.jsxs("span",{children:[b.jsx("i",{className:"legend-dot fault"}),"故障"]})]})]}),b.jsx("div",{className:"scene-control-hint",children:"内部加工动画 · 拖动旋转 · 滚轮缩放"})]}),b.jsxs("div",{className:"map-summary",children:[b.jsxs("div",{children:[b.jsx("span",{children:"接入设备"}),b.jsxs("strong",{children:[m," / ",o.length]})]}),b.jsxs("div",{children:[b.jsx("span",{children:"选中设备"}),b.jsx("strong",{children:h?.name||"--"})]}),b.jsxs("div",{children:[b.jsx("span",{children:"当前故障"}),b.jsx("strong",{children:p})]}),b.jsxs("div",{children:[b.jsx("span",{children:"毛坯入料"}),b.jsx("strong",{children:"棒料"})]}),b.jsxs("div",{children:[b.jsx("span",{children:"成品出料"}),b.jsx("strong",{children:"轴套件"})]})]})]})}function oc(o,e){return o?.live?e?.status==="fault"?"fault":e?.status==="alarm"?"alarm":e?.status==="warning"?"warning":"normal":"idle"}function KS(o){return o==="fault"?"故障":o==="alarm"?"报警":o==="warning"?"预警":o==="idle"?"未接入":"正常"}function Fw({machines:o=[],selectedMachineId:e,status:i,onSelect:s}){const l=Oe.useRef(null),f=Oe.useRef(s),h=Oe.useRef(o),d=Oe.useRef(null),m=Oe.useRef(null),[p,S]=Oe.useState(null),v=Oe.useMemo(()=>o.map(g=>`${g.id}:${g.live?1:0}`).join("|"),[o]);return Oe.useEffect(()=>{f.current=s},[s]),Oe.useEffect(()=>{h.current=o},[o]),Oe.useEffect(()=>{const g=l.current;if(!g)return;const M=new zb;M.fog=new Um(15988468,14,52);const R=new Qi(39,g.clientWidth/g.clientHeight,.1,100),C=g.clientWidth<600;C&&(R.fov=44,R.updateProjectionMatrix()),R.position.set(C?12:8.2,C?7:4.9,C?22:9.6),R.lookAt(.4,.75,0);const y=new lw({antialias:!0,alpha:!0,preserveDrawingBuffer:!0});y.setPixelRatio(Math.min(window.devicePixelRatio,2)),y.setSize(g.clientWidth,g.clientHeight),y.shadowMap.enabled=!0,y.shadowMap.type=Jl,g.appendChild(y.domElement);const x=new uw(R,y.domElement);x.target.set(.4,.75,0),x.enableDamping=!0,x.dampingFactor=.08,x.minDistance=6.2,x.maxDistance=C?30:15.5,x.minPolarAngle=Math.PI*.16,x.maxPolarAngle=Math.PI*.49,x.enablePan=!0,x.panSpeed=.55,x.rotateSpeed=.55,x.zoomSpeed=.72,x.update();const D=new Map(h.current.map(X=>[X.id,X])),F=X=>h.current.find(xt=>xt.id===X),N=X=>{const xt=F(X);return oc(xt,xt?.result)},L=X=>oc(D.get(X),D.get(X)?.result),U=X=>oS(L(X)),I=X=>X===e,T=X=>X==="fault"||X==="alarm"||X==="warning",O=X=>{const xt=F(X);if(!xt)return null;const Nt=N(X);return{id:X,name:xt.name||X,type:xt.type||"设备",status:Nt,statusLabel:KS(Nt)}},V=oS(i),Z=new Be({color:13357779,roughness:.42,metalness:.12}),J=new Be({color:12899280,roughness:.78,metalness:.01});new Be({color:14741998,roughness:.82,metalness:.02,transparent:!0,opacity:.58});const lt=new Be({color:14147295,roughness:.8,metalness:.04,side:bi}),q=new Be({color:14262811,roughness:.58,metalness:.04}),nt=new Be({color:4214871,roughness:.6,metalness:.18}),j=new Be({color:6847360,roughness:.4,metalness:.5}),K=new Be({color:6582647,roughness:.72,metalness:.08}),dt=new Be({color:2831160,roughness:.75,metalness:.05}),ut=new Be({color:13226451,roughness:.43,metalness:.25}),mt=new Be({color:8754073,roughness:.46,metalness:.32}),gt=new Be({color:2238253,roughness:.7,metalness:.2,transparent:!0,opacity:.86}),ie=new Be({color:12172994,roughness:.55,metalness:.12,transparent:!0,opacity:.68}),ae=new Be({color:7444124,roughness:.12,metalness:.04,transparent:!0,opacity:.35,side:bi,depthWrite:!1}),B=new Be({color:V,roughness:.42,metalness:.12,emissive:V,emissiveIntensity:.08}),_t=new Be({color:9805989,roughness:.52,metalness:.28}),Rt=new Be({color:4805722,roughness:.36,metalness:.45}),$=new Be({color:12026410,roughness:.42,metalness:.22,emissive:3810048,emissiveIntensity:.05}),pt=new Be({color:13357783,roughness:.32,metalness:.72}),Ct=new Be({color:4345945,roughness:.28,metalness:.78}),Yt=new Be({color:12831177,roughness:.3,metalness:.82}),Mt=new DS({color:2503224,transparent:!0,opacity:.42}),Ot=new pf({color:16777215,transparent:!0,opacity:.001,depthWrite:!1}),$e=new cT,Ee=new ye,Ae=[],Ne=[],ce=(X,xt,Nt)=>(X.userData.machineId=xt,X.traverse(wt=>{wt.userData.machineId=xt}),Nt&&Ae.push(Nt),X),fe=new he(new uc(26,16),Z);fe.rotation.x=-Math.PI/2,fe.position.y=-.36,fe.receiveShadow=!0,M.add(fe);const Jt=(X,xt,Nt,wt=[0,0,0])=>{const oe=new he(new Nn(...X),Nt);return oe.position.set(...xt),oe.rotation.set(...wt),oe.castShadow=!0,oe.receiveShadow=!0,M.add(oe),oe};Jt([26,2.6,.08],[0,.92,-7.2],lt),Jt([.08,2.25,12.5],[-12.3,.78,-.6],lt),Jt([.08,2.25,12.5],[12.3,.78,-.6],lt),Jt([26,2.25,.08],[0,.78,7.2],new Be({color:14936553,roughness:.8,transparent:!0,opacity:.18,depthWrite:!1})),Jt([24,.08,.12],[0,2.32,-6.95],dt),Jt([.12,.08,12],[-11.5,2.16,-.8],dt),Jt([.12,.08,12],[11.5,2.16,-.8],dt),Jt([20,.035,1.45],[0,-.31,3.25],J),Jt([1.5,.035,10.5],[-5.2,-.3,-.9],J),Jt([6.8,.012,.07],[0,-.32,2],q),Jt([6.8,.012,.07],[0,-.32,-1.95],q),Jt([.07,.012,3.95],[-3.4,-.32,.02],q),Jt([.07,.012,3.95],[3.4,-.32,.02],q);const Mn=new Be({color:15264747,roughness:.55});Jt([17,.012,.045],[0,-.31,2.52],Mn),Jt([17,.012,.045],[0,-.31,3.92],Mn);const je=(X,xt,Nt=[0,0,0],wt=new k(0,0,1))=>{Jt(X,xt,nt,Nt),Jt([X[0],.035,.08],[xt[0]-wt.x*X[2]/2,xt[1]+.06,xt[2]-wt.z*X[2]/2],j,Nt),Jt([X[0],.035,.08],[xt[0]+wt.x*X[2]/2,xt[1]+.06,xt[2]+wt.z*X[2]/2],j,Nt)},fn=[],Y=[],pn=new k(0,1,0),Ve=(X,xt,Nt=.52,wt=6)=>{const oe=new k(X[0],-.08,X[1]),Vt=new k(xt[0],-.08,xt[1]),kt=new k().subVectors(Vt,oe),ge=kt.length(),Se=new k().addVectors(oe,Vt).multiplyScalar(.5),mi=Math.atan2(kt.x,kt.z),oi=[0,mi-Math.PI/2,0],Fi=kt.clone().normalize(),va=new k(-Fi.z,0,Fi.x);je([ge,.13,Nt],[Se.x,Se.y,Se.z],oi,va);const tn=Math.max(3,Math.round(ge/.27));for(let nn=0;nn<=tn;nn+=1){const Un=nn/tn,Hi=oe.clone().lerp(Vt,Un),vn=new he(new Sn(.045,.045,Nt+.1,16),Rt);vn.position.set(Hi.x,.03,Hi.z),vn.quaternion.setFromUnitVectors(pn,va),M.add(vn),fn.push(vn)}for(let nn=0;nn<wt;nn+=1){const Un=new he(new Nn(.08,.035,Nt+.06),Rt);Un.userData.offset=nn/wt,Un.quaternion.setFromAxisAngle(pn,mi-Math.PI/2),Un.castShadow=!0,M.add(Un),Y.push({mesh:Un,start:oe,end:Vt})}};Ve([-5.68,2.45],[-5.68,.72],.55,0),Ve([2.45,1.12],[4.85,1.12],.55,0),Jt([1.45,.42,.75],[-6.15,-.08,-4.95],K),Jt([1.55,.13,.85],[-6.15,.22,-4.95],dt),Jt([1.35,.38,.72],[6.05,-.08,-4.8],K),Jt([1.45,.12,.82],[6.05,.18,-4.8],dt);const P=new Be({color:5859696,roughness:.46,metalness:.55}),E=new Be({color:10207172,roughness:.14,transparent:!0,opacity:.16,depthWrite:!1,side:bi});for(const X of[-3.25,-1.65,-.05,1.55,3.15])Jt([.055,1.18,.055],[X,.31,-2.25],P);for(let X=0;X<4;X+=1){const xt=-2.45+X*1.6;Jt([1.54,.98,.018],[xt,.32,-2.25],E),Jt([1.54,.035,.05],[xt,.87,-2.25],P),Jt([1.54,.035,.05],[xt,-.21,-2.25],P)}Jt([.07,1.04,.07],[1.75,.31,-2.19],q);for(const X of[-8.9,8.9]){Jt([.85,1.65,.62],[X,.5,-4.6],mt),Jt([.62,.35,.025],[X,.95,-4.27],gt);for(let xt=0;xt<5;xt+=1)Jt([.48,.014,.015],[X,.15+xt*.055,-4.27],Rt)}for(let X=0;X<10;X+=1){const xt=X%2===0?-10.8:10.8,Nt=-5.7+Math.floor(X/2)*2.8,wt=new he(new Sn(.06,.06,2.6,12),K);wt.position.set(xt,.92,Nt),wt.castShadow=!0,M.add(wt)}const it=(X,xt,Nt=1.45)=>{const wt=U(X),oe=new he(new ec(Nt,.024,6,56),new Be({color:wt,transparent:!0,opacity:I(X)?.72:.24,side:bi,depthWrite:!1}));return oe.rotation.x=-Math.PI/2,oe.position.set(xt[0],-.28,xt[2]),M.add(oe),oe},rt=(X,xt,Nt=1.45)=>{const wt=new he(new ec(Nt+.13,.035,6,56),new Be({color:14229279,transparent:!0,opacity:0,side:bi,depthWrite:!1}));wt.rotation.x=-Math.PI/2,wt.position.set(xt[0],-.27,xt[2]),wt.visible=!1,M.add(wt);const oe=new Rx(16723245,0,4.2);return oe.position.set(xt[0],1.35,xt[2]),M.add(oe),Ne.push({id:X,ring:wt,glow:oe}),{ring:wt,glow:oe}},vt=[],Lt=(X,xt,Nt,wt)=>{Jt([.08,.28,.08],[xt,Nt-.16,wt],Rt);const oe=[12071990,15116073,3577727].map((Vt,kt)=>{const ge=new Be({color:Vt,roughness:.3,emissive:Vt,emissiveIntensity:.06}),Se=new he(new Sn(.083,.083,.09,20),ge);return Se.position.set(xt,Nt+kt*.095,wt),M.add(Se),ge});vt.push({id:X,lamps:oe})},Ft=()=>{const X="LNS-QL-SERVO-80-S2-001",xt=U(X),Nt=new Be({color:xt,roughness:.4,metalness:.12,emissive:xt,emissiveIntensity:I(X)?.16:.05}),wt=new Be({color:15133164,roughness:.56,metalness:.08}),oe=new Be({color:13620696,roughness:.5,metalness:.12}),Vt=new Be({color:10402240,roughness:.2,metalness:.04,transparent:!0,opacity:.42,side:bi}),kt=new Ei,ge=[];kt.position.set(-4.15,.12,.13),kt.rotation.y=0,kt.scale.set(.86,.86,.86),M.add(kt),it(X,[kt.position.x,kt.position.y,kt.position.z],1.5),rt(X,[kt.position.x,kt.position.y,kt.position.z],1.5),Lt(X,-3.9,1.7,.1);const Se=(tn,nn,Un,Hi=[0,0,0])=>{const vn=new he(new Nn(...tn),Un);return vn.position.set(...nn),vn.rotation.set(...Hi),vn.castShadow=!0,vn.receiveShadow=!0,kt.add(vn),vn},mi=(tn,nn,Un,Hi,vn=[0,0,0],Oa=24)=>{const wi=new he(new Sn(tn,tn,nn,Oa),Hi);return wi.position.set(...Un),wi.rotation.set(...vn),wi.castShadow=!0,wi.receiveShadow=!0,kt.add(wi),wi},oi=(tn,nn,Un,Hi)=>{const vn=new k(...tn),Oa=new k(...nn),wi=new k().subVectors(Oa,vn),qr=wi.length(),Gi=new he(new Sn(Un,Un,qr,16),Hi);return Gi.position.copy(vn.add(Oa).multiplyScalar(.5)),Gi.quaternion.setFromUnitVectors(new k(0,1,0),wi.normalize()),Gi.castShadow=!0,Gi.receiveShadow=!0,kt.add(Gi),Gi};Se([4.3,.08,1.08],[0,.06,0],Rt),Se([4.05,.08,.1],[0,.18,-.48],gt),Se([4.05,.08,.1],[0,.18,.48],gt),Se([.18,.16,.24],[-1.92,.13,-.48],gt),Se([.18,.16,.24],[-1.92,.13,.48],gt),Se([.18,.16,.24],[1.92,.13,-.48],gt),Se([.18,.16,.24],[1.92,.13,.48],gt),Se([1.05,.78,.82],[-.35,.55,.03],oe),Se([.86,.52,.06],[-.35,.58,.46],wt),Se([.5,.08,.08],[-.35,.9,.5],Nt),Se([.42,.18,.04],[-.35,.46,.5],gt),oi([-1.45,.16,-.42],[-.82,.88,-.2],.035,Rt),oi([1.45,.16,-.42],[.82,.88,-.2],.035,Rt),oi([-1.45,.16,.42],[-.82,.88,.2],.035,Rt),oi([1.45,.16,.42],[.82,.88,.2],.035,Rt),Se([4.1,.24,.72],[0,1.02,0],wt),Se([4.28,.14,.84],[0,1.2,0],oe),Se([.34,.74,.84],[-2,.9,0],oe),Se([.34,.66,.84],[2,.86,0],oe),Se([3.75,.08,.64],[0,1.37,-.18],wt,[-.18,0,0]),Se([1.05,.055,.34],[-.82,1.45,-.36],Vt,[-.18,0,0]),Se([1.05,.055,.34],[.82,1.45,-.36],Vt,[-.18,0,0]),Se([4.08,.08,.12],[0,1.31,.46],gt);for(const tn of[-1.5,-.5,.5,1.5])Se([.025,.18,.012],[tn,1.08,.435],Rt);for(const tn of[-1.55,1.55])Se([.18,.62,.55],[tn,-.28,0],oe),Se([.38,.07,.65],[tn,-.61,0],Rt);for(let tn=0;tn<8;tn+=1)Se([.016,.14,.012],[-.58+tn*.065,.55,.502],Rt);Se([.42,.18,.012],[.35,.6,.504],gt),Se([.22,.045,.014],[.35,.6,.514],Nt),Se([3.85,.09,.24],[.18,.88,.43],nt),mi(.09,4.25,[.18,.94,.55],nt,[0,0,Math.PI/2],32),mi(.045,4,[.08,1.03,.43],$,[0,0,Math.PI/2],24);const Fi=Se([.18,.16,.28],[-1.72,1.03,.55],Nt);Se([1.05,.09,.18],[1.28,1.02,.58],Nt),Se([.42,.18,.24],[2.1,.96,.55],gt),Se([3.35,.055,.06],[0,.78,-.35],Rt),Se([3.35,.055,.06],[0,.78,.35],Rt);for(let tn=0;tn<8;tn+=1){const nn=new he(new Sn(.055,.055,.78,18),Rt);nn.position.set(-1.45+tn*.42,.82,0),nn.rotation.x=Math.PI/2,nn.castShadow=!0,kt.add(nn),ge.push(nn)}for(let tn=0;tn<4;tn+=1){const nn=tn<2?-1.82:1.82,Un=tn%2===0?-.55:.55;mi(.09,.08,[nn,.04,Un],gt,[Math.PI/2,0,0],20)}const va=new he(new Nn(4.7,1.6,1.3),Ot);return va.position.set(0,.78,.02),kt.add(va),ce(kt,X,va),{feederGroup:kt,feederRollers:ge,pusher:Fi}},St=()=>{const X="ELITE-CS612-ROBOT-001",xt=U(X);new Be({color:xt,roughness:.38,metalness:.16,emissive:xt,emissiveIntensity:I(X)?.18:.06});const Nt=new Be({color:15856629,roughness:.34,metalness:.08}),wt=new Be({color:13620440,roughness:.24,metalness:.62}),oe=new Be({color:1518440,roughness:.28,metalness:.2}),Vt=new Be({color:2764597,roughness:.42,metalness:.4}),kt=new Ei;kt.position.set(5.15,-.25,-.35),M.add(kt),it(X,[kt.position.x,kt.position.y,kt.position.z],1.28),rt(X,[kt.position.x,kt.position.y,kt.position.z],1.28),Lt(X,5.15,1.42,-.35);const ge=(wn,Vn,Ci,gi,_i=[0,0,0],mr=40)=>{const li=new he(new Sn(wn,wn,Vn,mr),gi);return li.position.set(...Ci),li.rotation.set(..._i),li.castShadow=!0,li.receiveShadow=!0,kt.add(li),li},Se=(wn,Vn,Ci,gi=[0,0,0])=>{const _i=new he(new Nn(...wn),Ci);return _i.position.set(...Vn),_i.rotation.set(...gi),_i.castShadow=!0,_i.receiveShadow=!0,kt.add(_i),_i},mi=(wn,Vn)=>{const Ci=new Ei,gi=new he(new Sn(wn,wn,.26,32),Vn);gi.rotation.x=Math.PI/2,gi.castShadow=!0,Ci.add(gi);const _i=new he(new Sn(wn*.79,wn*.79,.028,32),oe);return _i.rotation.x=Math.PI/2,_i.position.z=.145,Ci.add(_i),Ci.castShadow=!0,kt.add(Ci),Ci},oi=(wn,Vn,Ci)=>{const gi=new he(new Sn(wn,wn*.94,Vn,24),Ci);return gi.castShadow=!0,kt.add(gi),gi};ge(.45,.08,[0,.05,0],Vt),ge(.31,.32,[0,.27,0],Nt),ge(.32,.045,[0,.46,0],oe),Se([.22,.1,.1],[.28,.12,0],Vt);const Fi=mi(.26,Nt),va=mi(.23,Nt),tn=mi(.17,Nt),nn=oi(.145,1.14,wt),Un=oi(.12,1.14,wt),Hi=oi(.175,.05,oe),vn=new Ei;kt.add(vn);const Oa=new he(new Sn(.13,.13,.08,24),Vt);vn.add(Oa);const wi=new he(new Nn(.28,.1,.2),Vt);wi.position.y=-.1,vn.add(wi);const qr=wn=>{const Vn=new he(new Nn(.055,.26,.05),wt);return Vn.position.set(0,-.25,wn),vn.add(Vn),Vn},Gi=qr(.13),ia=qr(-.13),dr=new he(new Sn(.035,.035,.28,12),Vt);dr.rotation.z=Math.PI/2,dr.position.set(.29,.14,0),kt.add(dr);const pr=new he(new Nn(2.9,2.2,2.2),Ot);return pr.position.set(.72,1,0),kt.add(pr),ce(kt,X,pr),{robotGroup:kt,shoulderJoint:Fi,elbowJoint:va,wristJoint:tn,upperLink:nn,foreLink:Un,wristBand:Hi,toolCarrier:vn,fingerA:Gi,fingerB:ia}},Et=Ft(),Ut=St(),Gt=new Ei;Gt.position.set(.05,-.1,-.08),Gt.rotation.y=0,Gt.scale.set(.82,.82,.82),M.add(Gt);const Dt=(X,xt,Nt,wt,oe=[0,0,0])=>{const Vt=new he(new Nn(...xt),wt);Vt.name=X,Vt.position.set(...Nt),Vt.rotation.set(...oe),Vt.castShadow=!0,Vt.receiveShadow=!0,Gt.add(Vt);const kt=new jb(new Kb(Vt.geometry),Mt);return kt.position.copy(Vt.position),kt.rotation.copy(Vt.rotation),kt.scale.copy(Vt.scale),Gt.add(kt),Vt};Dt("machine-base",[4.65,.52,1.68],[0,.28,0],gt),Dt("left-headstock-cabinet",[1.08,1.88,1.66],[-1.78,1.4,0],gt),Dt("transparent-main-shell",[3.35,1.78,1.58],[-.15,1.4,0],ut),Dt("rear-column",[.45,1.95,1.58],[-2.2,1.44,0],mt);const zt=new Ei;zt.position.set(-1.62,1.42,.89),Gt.add(zt);const qt=(X,xt,Nt)=>{const wt=new he(new Nn(...X),Nt);return wt.position.set(...xt),zt.add(wt),wt};qt([1.68,1.18,.025],[.9,0,0],ae),qt([1.8,.075,.08],[.9,.64,0],mt),qt([1.8,.075,.08],[.9,-.64,0],mt),qt([.075,1.3,.08],[.04,0,0],mt),qt([.075,1.3,.08],[1.76,0,0],mt),qt([.075,.32,.075],[1.65,-.06,.09],Rt),Dt("right-slanted-cover",[.86,1.56,1.5],[1.32,1.38,.04],ut,[0,0,-.18]),Dt("control-panel",[.45,1.22,.18],[1.98,1.5,.78],gt,[0,0,-.24]),Dt("top-service-rail",[3.12,.16,1.34],[-.24,2.28,0],gt),Dt("status-strip",[1.82,.06,.08],[-.42,2.39,.7],B),Dt("chip-conveyor-neck",[1.12,.28,.34],[2.38,1,.22],gt,[0,0,.4]),Dt("chip-bin",[.7,.58,.7],[3,.76,.22],ut),Dt("front-service-panel",[2.68,.5,.08],[-.36,.58,.86],ie);for(let X=0;X<9;X+=1)Dt("cabinet-vent",[.23,.018,.014],[1.34,1.9-X*.06,.83],Rt);for(let X=0;X<6;X+=1)Dt("panel-key",[.035,.035,.018],[1.94+X%2*.09,1.95-Math.floor(X/2)*.1,.89],ie);Dt("panel-screen",[.27,.24,.025],[1.97,1.66,.9],ae),Dt("nameplate",[.46,.12,.02],[-1.8,1.9,.85],Rt),Dt("left-foot",[.25,.5,.22],[-1.85,-.02,.56],gt),Dt("right-foot",[.25,.5,.22],[1.55,-.02,.56],gt),Dt("inner-bed",[2.45,.18,.46],[-.35,1.02,.4],_t),Dt("linear-guide-left",[2.35,.055,.055],[-.32,1.16,.22],Rt),Dt("linear-guide-right",[2.35,.055,.055],[-.32,1.16,.58],Rt),Dt("tailstock-shadow",[.42,.44,.5],[.9,1.26,.38],_t);const le=new Ei;le.name="spindleChuck",le.position.set(-1.12,1.36,.78),Gt.add(le);const me=new he(new Sn(.29,.29,.22,48),Rt);me.rotation.z=Math.PI/2,me.castShadow=!0,le.add(me);const W=new he(new Sn(.22,.22,.04,48),B);W.position.x=.13,W.rotation.z=Math.PI/2,le.add(W);for(let X=0;X<3;X+=1){const xt=X*(Math.PI*2/3),Nt=new he(new Nn(.16,.06,.24),Ct);Nt.position.set(.17,Math.cos(xt)*.16,Math.sin(xt)*.16),Nt.rotation.x=xt,Nt.castShadow=!0,le.add(Nt)}const Pt=new he(new Sn(.13,.13,.88,48),pt);Pt.name="machiningWorkpiece",Pt.position.x=.48,Pt.rotation.z=Math.PI/2,Pt.castShadow=!0,le.add(Pt);const yt=new Ei;yt.name="toolSlide",yt.position.set(.32,1.27,.55),Gt.add(yt);const Bt=new he(new Nn(.56,.34,.42),_t);Bt.castShadow=!0,yt.add(Bt);const Wt=new he(new Sn(.22,.22,.25,8),Rt);Wt.rotation.x=Math.PI/2,Wt.position.set(-.05,.08,.24),Wt.castShadow=!0,yt.add(Wt);const At=new he(new Om(.06,.34,4),Ct);At.name="cutterTip",At.position.set(-.33,.08,.24),At.rotation.z=Math.PI/2,At.rotation.y=Math.PI/4,At.castShadow=!0,yt.add(At);const se=new Rx(16760922,.9,1.3);se.name="cuttingGlow",se.position.set(-.45,.08,.24),yt.add(se);const Ht=new Ei;Ht.name="loadingArm",Ht.position.set(-2.02,1.62,.62),Gt.add(Ht);const Pe=new he(new Nn(.08,.72,.08),Rt);Pe.castShadow=!0,Ht.add(Pe);const _e=new he(new Nn(.08,.08,.38),Ct);_e.position.set(.18,-.33,.12),Ht.add(_e);const ii=_e.clone();ii.position.z=-.12,Ht.add(ii),Lt("TRAK-TC820LTYSI-001",-1.35,2.05,-.08),Jt([1.2,.12,.17],[-1.93,.98,.56],Rt),Jt([1.1,.055,.27],[2.37,.31,1.02],_t,[0,0,-.16]),Jt([.09,.14,.28],[2.82,.28,1.02],Rt);const di=X=>{const xt=new Ei;xt.userData.offset=X,xt.name="rawBarStock";const Nt=new he(new Sn(.11,.11,.66,32),$);Nt.rotation.z=Math.PI/2,Nt.castShadow=!0,xt.add(Nt);const wt=new he(new Sn(.115,.115,.025,32),gt);return wt.position.x=-.35,wt.rotation.z=Math.PI/2,xt.add(wt),M.add(xt),xt},cr=(X=0,xt=pt)=>{const Nt=new Ei;Nt.userData.offset=X,Nt.name="screwPart";const wt=new he(new Sn(.045,.045,.42,32),xt);wt.rotation.z=Math.PI/2,wt.castShadow=!0,Nt.add(wt);const oe=new he(new Sn(.09,.09,.08,32),xt);oe.position.x=-.23,oe.rotation.z=Math.PI/2,oe.castShadow=!0,Nt.add(oe);const Vt=new he(new Nn(.018,.13,.018),gt);return Vt.position.x=-.275,Vt.castShadow=!0,Nt.add(Vt),M.add(Nt),Nt},Na=X=>{const xt=cr(X);xt.name="finishedParts";const Nt=new he(new Sn(.022,.022,.44,24),gt);return Nt.rotation.z=Math.PI/2,Nt.scale.set(1,1,1),xt.add(Nt),xt},ts=[di(0),di(.48)],_a=[Na(.05),Na(.34),Na(.68)],ai=cr(0,pt);Ut?.toolCarrier&&(Ut.toolCarrier.add(ai),ai.position.set(0,-.35,0),ai.rotation.set(0,0,0),ai.scale.setScalar(.78),ai.visible=!1);const Bi=new Be({color:5663096,roughness:.6,metalness:.22}),Ie=new k(5.9,-.16,.45);Jt([1.05,.12,.82],[Ie.x,Ie.y,Ie.z],Bi),Jt([1.05,.48,.08],[Ie.x,Ie.y+.24,Ie.z-.41],Bi),Jt([1.05,.48,.08],[Ie.x,Ie.y+.24,Ie.z+.41],Bi),Jt([.08,.48,.82],[Ie.x-.52,Ie.y+.24,Ie.z],Bi),Jt([.08,.48,.82],[Ie.x+.52,Ie.y+.24,Ie.z],Bi);for(const X of[Ie.x-.36,Ie.x,Ie.x+.36])Jt([.035,.42,.03],[X,Ie.y+.24,Ie.z+.44],Rt);for(const X of[-1,1])Jt([.1,.1,.25],[Ie.x+X*.55,Ie.y+.3,Ie.z],Rt);Jt([.3,.15,.014],[Ie.x,Ie.y+.25,Ie.z+.455],ie);const ea=Array.from({length:9},(X,xt)=>{const Nt=cr(xt/9,pt);return Nt.position.set(Ie.x-.28+xt%3*.22,Ie.y+.16+Math.floor(xt/3)*.035,Ie.z-.2+Math.floor(xt/3)*.18),Nt.rotation.set(0,0,0),Nt.scale.setScalar(.72),Nt}),ur=Array.from({length:18},(X,xt)=>{const Nt=xt<3,wt=Nt?new pf({color:16759395}):Yt,oe=new he(new ec(Nt?.01:.033,Nt?.004:.008,4,10,Math.PI*1.3),wt);return oe.userData.offset=xt/18,oe.castShadow=!0,Gt.add(oe),oe});it("TRAK-TC820LTYSI-001",[Gt.position.x,Gt.position.y,Gt.position.z],2.05),rt("TRAK-TC820LTYSI-001",[Gt.position.x,Gt.position.y,Gt.position.z],2.05);const es=new he(new Nn(5.1,2.8,2.3),Ot);es.position.set(.08,1.15,.05),Gt.add(es),ce(Gt,"TRAK-TC820LTYSI-001",es);const As=new aT(16777215,12109257,1.4);M.add(As);const Ai=new wx(16777215,2.3);Ai.position.set(3,5,4),Ai.castShadow=!0,M.add(Ai);const fr=new wx(V,.9);fr.position.set(-3,2.5,-2),M.add(fr);const na=new k(0,1.35,.48),Da=new k(-.45,1.12,1.47),ns=new k(-.45,.7,1.47),hr=new k(.1,1.42,1.12),Ua=new k(.75,1.14,.8),Rs=new k(.75,.8,.8),La=_a[0],pi=new k,A=new k,H=new k,ft=new k,st=X=>{const xt=[];let Nt=0;for(let wt=0;wt<X.length-1;wt+=1){const oe=X[wt],Vt=X[wt+1],kt=oe.distanceTo(Vt);xt.push({from:oe,to:Vt,length:kt}),Nt+=kt}return{segments:xt,total:Nt}},ot=st([new k(-5.68,.08,2.45),new k(-5.68,.08,.72)]),jt=st([new k(2.45,.08,1.12),new k(4.7,.08,1.12)]),$t=(X,xt,Nt)=>{let wt=Math.max(0,Math.min(1,xt))*X.total;for(const Vt of X.segments){if(wt<=Vt.length)return Nt.copy(Vt.from).lerp(Vt.to,Vt.length?wt/Vt.length:0);wt-=Vt.length}const oe=X.segments[X.segments.length-1];return Nt.copy(oe.to)},It=(X,xt,Nt)=>pi.copy(X).lerp(xt,Nt),ee=(X,xt,Nt,wt)=>(A.copy(X).lerp(xt,wt),H.copy(xt).lerp(Nt,wt),pi.copy(A).lerp(H,wt)),te=X=>X*X*(3-2*X),de=new k(4.7,.08,1.12),ve=new k(0,1,0),Qt=new k(0,.7,0),Ue=new k(0,1,0),be=new k,Ze=new k,Ye=new k,Tn=(X,xt,Nt,wt)=>{X.position.copy(xt).add(Nt).multiplyScalar(.5),X.quaternion.setFromUnitVectors(Ue,ft.copy(Nt).sub(xt).normalize()),X.scale.y=xt.distanceTo(Nt)/wt},Zt=X=>{const xt=Math.min(2.26,Math.max(.01,Ze.copy(X).sub(Qt).length()));Ze.normalize(),Ye.copy(ve).addScaledVector(Ze,-ve.dot(Ze)).normalize(),Ye.lengthSq()<.001&&Ye.set(0,0,1);const Nt=Math.sqrt(Math.max(0,1.14*1.14-xt*xt/4));be.copy(Qt).addScaledVector(Ze,xt/2).addScaledVector(Ye,Nt),Ut.shoulderJoint.position.copy(Qt),Ut.elbowJoint.position.copy(be),Ut.wristJoint.position.copy(X),Tn(Ut.upperLink,Qt,be,1.14),Tn(Ut.foreLink,be,X,1.14),Ut.wristBand.position.copy(X).addScaledVector(ve,-.12),Ut.toolCarrier.position.copy(X)};let _n=0;const ze=()=>{_n=window.requestAnimationFrame(ze);const X=performance.now()*.001,xt=(Math.sin(X*1.05)+1)/2,Nt=X*.18%1,wt=X%6/6,oe=wt<.62;if(le.rotation.x=oe?X*8.6:0,Pt.rotation.x=0,yt.position.x=oe?.22+Math.sin(X*.92)*.22:.48,yt.position.z=oe?.48+Math.sin(X*1.45)*.08:.55,Wt.rotation.z=oe?X*.65:0,se.intensity=oe?.15+xt*.2:0,At.material.emissive.setHex(5923421),At.material.emissiveIntensity=oe?.08:0,zt.position.x=-1.62+(oe?0:1.12),Ht.rotation.z=Math.sin(X*1.2)*.18,fn.forEach(Vt=>{Vt.rotateY(-.16)}),Y.forEach(Vt=>{const kt=(Nt+Vt.mesh.userData.offset)%1;A.copy(Vt.start).lerp(Vt.end,kt),Vt.mesh.position.set(A.x,.02,A.z)}),Et&&(Et.feederRollers.forEach(Vt=>{Vt.rotateY(-.18)}),Et.pusher.position.x=-1.72+X*.32%1*3.18),Ut){const Vt=wt>=.38&&wt<.82,kt=wt>=.34&&wt<.86;let ge=na;wt<.12?ge=na:wt<.24?ge=It(na,Da,te((wt-.12)/.12)):wt<.34?ge=It(Da,ns,te((wt-.24)/.1)):wt<.44?ge=ns:wt<.54?ge=It(ns,Da,te((wt-.44)/.1)):wt<.7?ge=ee(Da,hr,Ua,te((wt-.54)/.16)):wt<.8?ge=It(Ua,Rs,te((wt-.7)/.1)):wt<.88?ge=Rs:wt<.96?ge=It(Rs,Ua,te((wt-.88)/.08)):ge=It(Ua,na,te((wt-.96)/.04)),Zt(ge),Ut.fingerA.position.z=kt?.07:.14,Ut.fingerB.position.z=kt?-.07:-.14,ai.visible=Vt}ts.forEach(Vt=>{const kt=(X*.2+Vt.userData.offset)%1,ge=kt>.78?.78+(kt-.78)*.18:kt;$t(ot,ge,A),Vt.position.copy(A),Vt.rotation.x=X*2.5}),La&&(wt<.38?(La.visible=!0,La.position.copy(de)):(wt<.82,La.visible=!1)),_a.slice(1).forEach(Vt=>{const kt=(X*.17+Vt.userData.offset)%1,ge=kt>.86?.86+(kt-.86)*.18:kt;$t(jt,ge,A),Vt.position.copy(A),Vt.rotation.x=X*2.6,Vt.rotation.y=Math.sin(X*1.6+Vt.userData.offset)*.08}),ea.forEach((Vt,kt)=>{Vt.visible=kt<3+Math.floor(X/6)%7}),ur.forEach(Vt=>{const kt=(X*1.4+Vt.userData.offset)%1;Vt.position.set(-.18+kt*.7,1.35-kt*.45+Math.sin(kt*Math.PI*4)*.035,.8+kt*.28),Vt.rotation.set(X*4+kt,X*2.3,kt*6),Vt.visible=oe}),Ne.forEach(Vt=>{const kt=T(N(Vt.id)),ge=.35+Math.abs(Math.sin(X*4.6))*.65;Vt.ring.visible=kt,Vt.ring.material.opacity=kt?.18+ge*.44:0,Vt.ring.scale.setScalar(1+ge*.08),Vt.glow.intensity=kt?.8+ge*2.1:0}),vt.forEach(({id:Vt,lamps:kt})=>{const ge=N(Vt),Se=ge==="fault"||ge==="alarm"?0:ge==="warning"?1:2;kt.forEach((mi,oi)=>{mi.emissiveIntensity=oi===Se?Se===0?.8+Math.abs(Math.sin(X*5))*1.3:.9:.04})}),x.update(),y.render(M,R)};ze();const Zn=()=>{!g.clientWidth||!g.clientHeight||(R.aspect=g.clientWidth/g.clientHeight,R.updateProjectionMatrix(),y.setSize(g.clientWidth,g.clientHeight))},si=new ResizeObserver(Zn);si.observe(g);const Ri=()=>{d.current&&(window.clearTimeout(d.current),d.current=null),m.current=null,S(null)},Ce=X=>{const xt=y.domElement.getBoundingClientRect();return Ee.x=(X.clientX-xt.left)/xt.width*2-1,Ee.y=-((X.clientY-xt.top)/xt.height)*2+1,$e.setFromCamera(Ee,R),$e.intersectObjects(Ae,!1)[0]?.object?.userData?.machineId||null},Ke=X=>{const xt=Ce(X);if(!xt){Ri();return}const Nt={x:Math.min(Math.max(X.offsetX+14,14),Math.max(g.clientWidth-250,14)),y:Math.min(Math.max(X.offsetY+14,14),Math.max(g.clientHeight-112,14))};if(m.current===xt){S(wt=>wt&&{...wt,...Nt});return}d.current&&window.clearTimeout(d.current),m.current=xt,S(null),d.current=window.setTimeout(()=>{const wt=O(xt);!wt||m.current!==xt||S({...wt,...Nt})},2e3)},sn=()=>Ri(),ri=()=>f.current(m.current);return y.domElement.addEventListener("pointermove",Ke),y.domElement.addEventListener("pointerleave",sn),y.domElement.addEventListener("click",ri),()=>{window.cancelAnimationFrame(_n),si.disconnect(),Ri(),y.domElement.removeEventListener("pointermove",Ke),y.domElement.removeEventListener("pointerleave",sn),y.domElement.removeEventListener("click",ri),y.domElement.parentNode===g&&g.removeChild(y.domElement),M.traverse(X=>{X.geometry&&X.geometry.dispose(),X.material&&(Array.isArray(X.material)?X.material.forEach(xt=>xt.dispose()):X.material.dispose())}),x.dispose(),y.dispose(),y.forceContextLoss()}},[v]),b.jsx("div",{ref:l,className:"machine-3d-canvas","aria-hidden":"true",children:p?b.jsxs("div",{className:`scene-hover-label ${p.status}`,style:{left:p.x,top:p.y},children:[b.jsx("strong",{children:p.name}),b.jsx("span",{children:p.type}),b.jsx("em",{children:p.statusLabel})]}):null})}function oS(o){return o==="fault"?12007218:o==="alarm"||o==="warning"?11954688:o==="idle"?8227987:556917}function Hw({machine:o,isLiveMachine:e,sample:i,result:s,healthText:l}){const f=e?oc(o,s):"idle";return b.jsxs("section",{className:"machine-detail-header",children:[b.jsxs("div",{children:[b.jsx("span",{className:"eyebrow",children:"设备详情"}),b.jsxs("h2",{children:[o.name," · ",o.type]}),b.jsxs("p",{children:[o.line," · ",e&&i?.device_id||o.id]})]}),b.jsxs("div",{className:"machine-detail-stats",children:[b.jsxs("div",{children:[b.jsx("span",{children:"状态"}),b.jsx("strong",{className:f,children:KS(f)})]}),b.jsxs("div",{children:[b.jsx("span",{children:"告警"}),b.jsx("strong",{children:e?i?.alarm_code||"无":"--"})]}),b.jsxs("div",{children:[b.jsx("span",{children:"健康度"}),b.jsx("strong",{children:e?l:"--"})]})]})]})}function Gw({snapshot:o,sample:e,runner:i,healthText:s}){const l=[["监测状态",i.enabled?"开启":"暂停"],["设备状态",ga(jS,e?.status)],["当前告警",e?.alarm_code||"无"],["采样次数",o?.result_count??"--"],["告警事件次数",o?.alarm_event_count??"--"],["Agent诊断任务",o?.diagnosis_task_count??"--"],["采样周期",i.interval_seconds?`${i.interval_seconds} 秒/次`:"--"],["整机健康度",s]];return b.jsx("section",{className:"status-strip","aria-label":"运行状态",children:l.map(([f,h])=>b.jsxs("div",{className:"status-item",children:[b.jsx("span",{children:f}),b.jsx("strong",{children:h})]},f))})}function Vw({result:o,sample:e}){const i=Oe.useMemo(()=>kw(o,e),[o,e]);return b.jsxs("section",{className:"panel metrics-panel",children:[b.jsxs("div",{className:"panel-heading",children:[b.jsxs("div",{children:[b.jsx("span",{className:"eyebrow",children:"实时快照"}),b.jsx("h2",{children:"实时指标"})]}),b.jsx("span",{className:"muted",children:e?`最近采样 ${fc(e.timestamp)}`:"等待采样"})]}),b.jsx("div",{className:"metrics-grid",children:i.map(s=>b.jsx(Xw,{item:s,result:o},s.key))}),(e?.vibration===null||e?.vibration===void 0)&&b.jsx("div",{className:"notice",children:"当前设备数据源没有提供振动字段，振动不会被其他指标替代；其他设备指标仍会继续监测。"}),b.jsxs("div",{className:"subsection-heading",children:[b.jsx("span",{className:"eyebrow",children:"设备联锁与执行部件"}),b.jsx("strong",{children:"整机状态"})]}),b.jsx(Ww,{sample:e})]})}function kw(o,e){const i=e?.metrics||{},s=e?.metric_details||{},l=Object.entries(s).map(([f,h])=>({key:f,name:h.label||f,group:h.group||"整机",value:i[f],unit:h.unit||"",normalRange:h.normal_range}));return l.length?l:[{key:"temperature",name:"温度",group:"主轴",value:e?.temperature,unit:"C"},{key:"vibration",name:"振动",group:"主轴",value:e?.vibration,unit:"mm/s"},{key:"rpm",name:"转速",group:"主轴",value:e?.rpm,unit:"rpm"}]}function Xw({item:o,result:e}){const i=e?.observations?.find(h=>h.key===`metric:${o.key}`||h.key===o.key||o.key==="spindle_temperature_c"&&h.key==="temperature"||o.key==="spindle_vibration_rms"&&h.key==="vibration"),s=ZS(i?.alert_level),l=o.value===null||o.value===void 0?"未提供":`${Number(o.value).toFixed(1)}`,f=o.normalRange?`正常 ${o.normalRange[0]} - ${o.normalRange[1]}`:"";return b.jsxs("div",{className:`metric ${s}`,children:[b.jsx("span",{className:"metric-group",children:o.group}),b.jsx("span",{className:"metric-name",children:o.name}),b.jsx("strong",{className:"metric-value",children:l}),b.jsxs("span",{className:"metric-unit",children:[o.unit," ",f]})]})}function Ww({sample:o}){const e=Object.values(o?.equipment_states||{});return e.length?b.jsx("div",{className:"equipment-grid",children:e.map((i,s)=>b.jsxs("div",{className:`equipment-state ${i.is_normal?"normal":"fault"}`,children:[b.jsx("span",{children:i.label||"设备状态"}),b.jsx("strong",{children:ga(Cw,i.value)})]},`${i.label||"state"}-${s}`))}):b.jsx("div",{className:"equipment-grid",children:b.jsx("div",{className:"empty-state",children:"当前接口没有提供离散设备状态"})})}function Yw({result:o}){const e=o?.status||"normal";return b.jsxs("section",{className:"panel decision-panel",children:[b.jsxs("div",{className:"panel-heading",children:[b.jsxs("div",{children:[b.jsx("span",{className:"eyebrow",children:"监测判定"}),b.jsx("h2",{children:"规则引擎"})]}),b.jsx("span",{className:`severity-pill ${Nw(e)}`,children:ga(jS,e)})]}),b.jsx(qw,{observations:o?.observations||[]}),b.jsxs("div",{className:"threshold-note",children:[b.jsx("span",{children:"触发条件"}),b.jsx("strong",{children:"关键故障立即触发；普通指标阈值+5秒；间歇故障5分钟内3次；趋势/联合异常"})]})]})}function qw({observations:o}){return o.length?b.jsx("div",{className:"observation-list",children:o.map((e,i)=>{const s=ZS(e.alert_level);return b.jsxs("div",{className:"observation",children:[b.jsx("span",{className:`observation-dot ${s}`}),b.jsxs("div",{children:[b.jsxs("div",{className:"observation-title",children:[ga(qS,e.rule_type)," · ",Uw(e),"：",e.value]}),b.jsxs("div",{className:"observation-meta",children:[e.message," · 阈值 ",e.threshold??"-"," ",e.unit||""]})]}),b.jsx("span",{className:"observation-level",children:ga(Aw,e.alert_level)})]},`${e.key||e.kind}-${i}`)})}):b.jsx("div",{className:"observation-list",children:b.jsx("div",{className:"empty-state",children:"当前没有检测到异常"})})}function jw({snapshot:o}){const e=o?.trigger_history||[];return b.jsxs("section",{className:"panel trigger-panel",children:[b.jsxs("div",{className:"panel-heading",children:[b.jsxs("div",{children:[b.jsx("span",{className:"eyebrow",children:"诊断移交"}),b.jsx("h2",{children:"诊断触发记录"})]}),b.jsx("span",{className:"muted",children:"只记录监测器已确认的触发事件"})]}),b.jsxs("div",{className:"trigger-list",children:[!e.length&&b.jsx("div",{className:"empty-state",children:"暂无触发记录"}),e.map((i,s)=>b.jsxs("div",{className:"trigger-row",children:[b.jsx("span",{className:"trigger-time",children:fc(i.triggered_at)}),b.jsx("span",{className:"trigger-device",children:i.device_id}),b.jsx("span",{className:"trigger-rules",children:i.event_id||i.abnormal_event?.event_id||"--"}),b.jsxs("span",{className:"trigger-reason",children:[i.trigger_cause||"首次确认异常"," · ",i.task_id||"--"," · ",(i.rule_types||[]).map(l=>qS[l]||l).join("、")]})]},`${i.task_id||i.event_id||s}`))]})]})}function Zw({snapshot:o}){const e=o?.diagnosis?.latest||{},i=e.status||"idle",s=i==="failed"?"fault":i==="fallback"?"warning":"normal";return b.jsxs("section",{className:"panel diagnosis-panel",children:[b.jsxs("div",{className:"panel-heading",children:[b.jsxs("div",{children:[b.jsx("span",{className:"eyebrow",children:"智能诊断"}),b.jsx("h2",{children:"诊断结果"})]}),b.jsx("span",{className:`severity-pill ${s}`,children:ga(vm,i)})]}),b.jsx(Kw,{latest:e})]})}function Kw({latest:o}){if(!o||o.status==="idle")return b.jsx("div",{className:"diagnosis-result",children:b.jsx("div",{className:"empty-state",children:"满足触发条件后自动生成诊断结果"})});const e=o.confidence===null||o.confidence===void 0?"--":`${(Number(o.confidence)*100).toFixed(0)}%`,i=o.alarm_definition||{},s=(o.tool_calls||[]).map(f=>ga(Rw,f.name)).join("、")||"等待诊断依据",l=[["设备",o.device_id||"--"],["诊断任务",o.task_id||"--"],["异常事件",o.event_id||"--"],["事件轮次",`第 ${o.event_revision||1} 次`],["触发时间",fc(o.triggered_at)],["报警定义",i.name||"未查询到"],["置信度",e],["诊断依据",s]];return b.jsxs("div",{className:"diagnosis-result",children:[b.jsx("div",{className:"diagnosis-summary",children:o.summary||"正在生成诊断结果"}),b.jsx("div",{className:"diagnosis-grid",children:l.map(([f,h])=>b.jsxs("div",{children:[b.jsx("span",{children:f}),b.jsx("strong",{children:h})]},f))}),b.jsxs("div",{className:"diagnosis-detail",children:[b.jsx("span",{children:"诊断说明"}),b.jsx("p",{children:o.diagnosis||"暂无详细诊断"})]}),o.error&&b.jsx("div",{className:"diagnosis-error",children:o.error})]})}function Ef({snapshot:o}){return o?.diagnosis?.pipeline||{}}function Qw({snapshot:o}){const e=o?.diagnosis?.latest||{},s=Ef({snapshot:o}).knowledge||{},l=e.tool_calls||[];return b.jsxs("section",{className:"workspace-view active module-board","aria-label":"智能诊断中心",children:[b.jsx(Yr,{eyebrow:"Diagnosis Agent",title:"智能诊断中心",text:"查看异常事件、诊断结论、报警定义、历史证据和知识检索结果。"}),b.jsxs("div",{className:"module-grid",children:[b.jsx(Dn,{label:"诊断状态",value:ga(vm,e.status),text:e.diagnosis_run_id||"等待异常任务"}),b.jsx(Dn,{label:"置信度",value:e.confidence==null?"--":`${(Number(e.confidence)*100).toFixed(0)}%`,text:e.event_id||"暂无异常事件"}),b.jsx(Dn,{label:"知识证据",value:(s.documents||[]).length,text:s.source||"A2A / RAG"})]}),b.jsxs("div",{className:"ops-grid",children:[b.jsxs("section",{className:"panel module-panel",children:[b.jsxs("div",{className:"panel-heading",children:[b.jsxs("div",{children:[b.jsx("span",{className:"eyebrow",children:"最终诊断"}),b.jsx("h2",{children:e.summary||"等待异常事件"})]}),b.jsx("span",{className:`severity-pill ${e.status==="failed"?"fault":"normal"}`,children:ga(vm,e.status)})]}),b.jsxs("div",{className:"detail-grid",children:[b.jsx(ma,{label:"设备",value:e.device_id}),b.jsx(ma,{label:"异常事件",value:e.event_id}),b.jsx(ma,{label:"事件轮次",value:e.event_revision?`第 ${e.event_revision} 次`:"--"}),b.jsx(ma,{label:"触发原因",value:e.trigger_cause})]}),b.jsxs("div",{className:"diagnosis-detail",children:[b.jsx("span",{children:"诊断说明"}),b.jsx("p",{children:e.diagnosis||"暂无诊断说明"})]}),e.recommendation&&b.jsxs("div",{className:"diagnosis-detail",children:[b.jsx("span",{children:"下一步建议"}),b.jsx("p",{children:e.recommendation})]})]}),b.jsxs("section",{className:"panel module-panel",children:[b.jsx("div",{className:"panel-heading",children:b.jsxs("div",{children:[b.jsx("span",{className:"eyebrow",children:"工具证据"}),b.jsx("h2",{children:"Reason · Act · Observe"})]})}),b.jsx(Hm,{items:l.map(f=>({event:f.name,agent:"Diagnosis Agent",tool:f.name,arguments:f.arguments}))}),b.jsx(QS,{documents:s.documents||[]})]})]})]})}function Jw({snapshot:o}){const e=Ef({snapshot:o}),i=e.maintenance_plan||{},s=i.diagnosis||e.diagnosis||{};return b.jsxs("section",{className:"workspace-view active module-board","aria-label":"维修决策中心",children:[b.jsx(Yr,{eyebrow:"Maintenance Agent",title:"维修决策中心",text:"将诊断结果、RAG知识和CAD/BOM部件信息汇总为可执行维修方案。"}),b.jsxs("div",{className:"module-grid",children:[b.jsx(Dn,{label:"方案编号",value:i.plan_id||"--",text:s.fault||s.summary||"等待诊断"}),b.jsx(Dn,{label:"预计用时",value:i.estimated_time||"--",text:"Maintenance Agent 估算"}),b.jsx(Dn,{label:"关联部件",value:(i.cad_components||[]).length,text:"来自 CAD / BOM 查询"})]}),b.jsxs("div",{className:"ops-grid",children:[b.jsxs("section",{className:"panel module-panel",children:[b.jsx("div",{className:"panel-heading",children:b.jsxs("div",{children:[b.jsx("span",{className:"eyebrow",children:"维修步骤"}),b.jsx("h2",{children:"执行清单"})]})}),b.jsx(Fm,{steps:i.repair_steps||[]})]}),b.jsxs("section",{className:"panel module-panel",children:[b.jsx("div",{className:"panel-heading",children:b.jsxs("div",{children:[b.jsx("span",{className:"eyebrow",children:"安全与资源"}),b.jsx("h2",{children:"工器具、备件和安全要求"})]})}),b.jsxs("div",{className:"detail-grid",children:[b.jsx(ma,{label:"工器具",value:(i.tools||[]).join("、")}),b.jsx(ma,{label:"备件",value:(i.parts||[]).join("、")}),b.jsx(ma,{label:"安全要求",value:(i.safety||[]).join("；")}),b.jsx(ma,{label:"知识来源",value:(i.source_documents||[]).join("、")})]})]})]})]})}function $w({snapshot:o}){const i=Ef({snapshot:o}).report||{},s=i.sections||{};return b.jsxs("section",{className:"workspace-view active module-board","aria-label":"报告中心",children:[b.jsx(Yr,{eyebrow:"Report Agent",title:"报告中心",text:"汇总诊断、维修方案、工单和质检结果，形成可追溯运维报告。"}),b.jsxs("div",{className:"module-grid",children:[b.jsx(Dn,{label:"报告编号",value:i.report_id||"--",text:i.report_type||"maintenance"}),b.jsx(Dn,{label:"报告标题",value:i.title||"--",text:i.created_at?fc(i.created_at):"等待生成"}),b.jsx(Dn,{label:"质量状态",value:s.quality?.passed==null?"--":s.quality.passed?"通过":"未通过",text:"Quality Agent"})]}),b.jsxs("section",{className:"panel module-panel report-panel",children:[b.jsx("div",{className:"panel-heading",children:b.jsxs("div",{children:[b.jsx("span",{className:"eyebrow",children:"报告摘要"}),b.jsx("h2",{children:i.title||"暂无报告"})]})}),b.jsx("p",{className:"answer-summary",children:i.summary||"完成一次异常闭环后，将在此展示诊断报告、维修报告和质检报告内容。"}),b.jsx(JS,{value:s})]})]})}function t3({snapshot:o}){const e=Ef({snapshot:o}),i=e.trace||[];return b.jsxs("section",{className:"workspace-view active module-board","aria-label":"AI运行追踪",children:[b.jsx(Yr,{eyebrow:"Agent Runtime",title:"AI运行追踪",text:"观察 Router、Harness、Agent、Tool、MCP 和 Experience 的调用链。"}),b.jsxs("div",{className:"module-grid",children:[b.jsx(Dn,{label:"Trace记录",value:i.length,text:e.trace_id||"当前异常流程"}),b.jsx(Dn,{label:"Agent事件",value:i.filter(s=>s.agent).length,text:"生命周期记录"}),b.jsx(Dn,{label:"Tool事件",value:i.filter(s=>s.tool).length,text:"MCP工具调用记录"})]}),b.jsxs("section",{className:"panel module-panel",children:[b.jsx("div",{className:"panel-heading",children:b.jsxs("div",{children:[b.jsx("span",{className:"eyebrow",children:"调用链"}),b.jsx("h2",{children:"Trace Timeline"})]})}),b.jsx(Hm,{items:i})]})]})}function e3({snapshot:o,sample:e}){const[i,s]=Oe.useState([]),[l,f]=Oe.useState(""),[h,d]=Oe.useState("维修一组"),[m,p]=Oe.useState(""),[S,v]=Oe.useState(!1),g=o?.diagnosis?.latest||{},M=i.find(x=>x.workorder_id===l)||i[0];async function R(){try{const D=(await $i("/api/workorders")).items||[];s(D),!l&&D.length&&f(D[0].workorder_id),p("")}catch(x){p(x.message)}}Oe.useEffect(()=>{R()},[]);async function C(){v(!0);try{const x=g.summary||g.fault||`${e?.device_id||o?.device_id||"unknown"} 设备维修`,D=await $i("/api/workorders",{method:"POST",body:JSON.stringify({device_id:e?.device_id||o?.device_id||"unknown",title:x,steps:g.recommendation?[g.recommendation]:ww,assignee:h})});await R(),f(D.workorder_id),p("")}catch(x){p(x.message)}finally{v(!1)}}async function y(x){if(M){v(!0);try{const D=x==="closed"?"close":"update",F=await $i(`/api/workorders/${M.workorder_id}/action`,{method:"POST",body:JSON.stringify({action:D,status:x,assignee:h})});s(N=>N.map(L=>L.workorder_id===F.workorder_id?F:L)),p("")}catch(D){p(D.message)}finally{v(!1)}}}return b.jsxs("section",{className:"workspace-view active module-board","aria-label":"工单系统",children:[b.jsx(Yr,{eyebrow:"MES 工单系统",title:"维修工单闭环",text:"把诊断结果转成维修任务，跟踪处理人、步骤和状态，并为质检验收提供入口。"}),b.jsxs("div",{className:"module-grid",children:[b.jsx(Dn,{label:"当前工单",value:i.length,text:"Agent Service 内存工单池"}),b.jsx(Dn,{label:"选中状态",value:ga(xm,M?.status),text:M?.workorder_id||"暂无工单"}),b.jsx(Dn,{label:"关联设备",value:M?.device_id||e?.device_id||o?.device_id||"--",text:"来自实时监测上下文"})]}),b.jsxs("div",{className:"ops-grid",children:[b.jsxs("section",{className:"panel module-panel",children:[b.jsxs("div",{className:"panel-heading",children:[b.jsxs("div",{children:[b.jsx("span",{className:"eyebrow",children:"创建工单"}),b.jsx("h2",{children:"诊断转派"})]}),b.jsx("span",{className:"muted",children:g.summary||"可先创建演示工单"})]}),b.jsxs("div",{className:"form-row",children:[b.jsxs("label",{children:["处理人",b.jsx("input",{value:h,onChange:x=>d(x.target.value)})]}),b.jsx("button",{className:"button primary",type:"button",disabled:S,onClick:C,children:S?"处理中":"创建工单"})]}),m&&b.jsx("div",{className:"inline-error",children:m})]}),b.jsxs("section",{className:"panel module-panel",children:[b.jsxs("div",{className:"panel-heading",children:[b.jsxs("div",{children:[b.jsx("span",{className:"eyebrow",children:"工单列表"}),b.jsx("h2",{children:"任务队列"})]}),b.jsx("button",{className:"button",type:"button",onClick:R,children:"刷新"})]}),b.jsxs("div",{className:"order-list",children:[!i.length&&b.jsx("div",{className:"empty-state",children:"暂无工单，点击创建工单生成第一条任务"}),i.map(x=>b.jsxs("button",{type:"button",className:`order-row ${x.workorder_id===M?.workorder_id?"active":""}`,onClick:()=>f(x.workorder_id),children:[b.jsxs("span",{children:[b.jsx("strong",{children:x.title}),b.jsx("em",{children:x.workorder_id})]}),b.jsx("b",{children:ga(xm,x.status)})]},x.workorder_id))]})]})]}),b.jsx(n3,{order:M,busy:S,onUpdate:y})]})}function n3({order:o,busy:e,onUpdate:i}){return o?b.jsxs("section",{className:"panel module-panel detail-panel",children:[b.jsxs("div",{className:"panel-heading",children:[b.jsxs("div",{children:[b.jsx("span",{className:"eyebrow",children:"工单详情"}),b.jsx("h2",{children:o.title})]}),b.jsx("span",{className:`severity-pill ${o.status==="closed"||o.status==="completed"?"normal":"warning"}`,children:ga(xm,o.status)})]}),b.jsxs("div",{className:"detail-grid",children:[b.jsx(ma,{label:"工单编号",value:o.workorder_id}),b.jsx(ma,{label:"设备",value:o.device_id}),b.jsx(ma,{label:"处理人",value:o.assignee||"未分配"}),b.jsx(ma,{label:"更新时间",value:fc(o.updated_at)})]}),b.jsx(Fm,{steps:o.steps}),b.jsxs("div",{className:"action-row",children:[b.jsx("button",{className:"button",type:"button",disabled:e,onClick:()=>i("in_progress"),children:"标记处理中"}),b.jsx("button",{className:"button",type:"button",disabled:e,onClick:()=>i("completed"),children:"标记完成"}),b.jsx("button",{className:"button primary",type:"button",disabled:e,onClick:()=>i("closed"),children:"关闭工单"})]})]}):b.jsx("section",{className:"panel module-panel",children:b.jsx("div",{className:"empty-state",children:"暂无工单详情"})})}function i3({snapshot:o,sample:e}){const[i,s]=Oe.useState(rS[0]),[l,f]=Oe.useState(null),[h,d]=Oe.useState(null),[m,p]=Oe.useState(null),[S,v]=Oe.useState(""),[g,M]=Oe.useState(!1);async function R(){try{p(await $i("/api/rag/status"))}catch(D){v(D.message)}}Oe.useEffect(()=>{R()},[]);async function C(D=i){if(D.trim()){M(!0);try{const[F,N]=await Promise.all([$i("/api/agent/question",{method:"POST",body:JSON.stringify({user_text:D,context:{device_id:e?.device_id||o?.device_id||""}})}),$i(`/api/rag/search?query=${encodeURIComponent(D)}&limit=5`)]);f(F),d(N),v("")}catch(F){v(F.message)}finally{M(!1)}}}const y=h?.documents||l?.knowledge?.documents||[],x=l?.report||{};return b.jsxs("section",{className:"workspace-view active module-board","aria-label":"RAG知识问答",children:[b.jsx(Yr,{eyebrow:"RAG 知识中枢",title:"维修知识问答",text:"统一调用 Router、Knowledge 和 RAG 检索接口，展示答案摘要、命中文档与知识库状态。"}),b.jsxs("div",{className:"module-grid",children:[b.jsx(Dn,{label:"检索后端",value:m?.backend||"--",text:"支持本地 fallback 或远程 RAG"}),b.jsx(Dn,{label:"知识记录",value:m?.record_count??"--",text:"当前可检索记录数"}),b.jsx(Dn,{label:"命中文档",value:y.length,text:"本次问答引用结果"})]}),b.jsxs("section",{className:"qa-shell",children:[b.jsx("div",{className:"quick-row",children:rS.map(D=>b.jsx("button",{className:"button",type:"button",onClick:()=>{s(D),C(D)},children:D},D))}),b.jsx("textarea",{className:"qa-input",value:i,onChange:D=>s(D.target.value),placeholder:"输入设备维修、SOP、报警码问题"}),b.jsxs("div",{className:"action-row",children:[b.jsx("button",{className:"button primary",type:"button",disabled:g,onClick:()=>C(),children:g?"检索中":"提交问答"}),b.jsx("button",{className:"button",type:"button",onClick:R,children:"刷新知识库状态"})]}),S&&b.jsx("div",{className:"inline-error",children:S})]}),b.jsxs("section",{className:"answer-grid",children:[b.jsxs("div",{className:"panel module-panel",children:[b.jsx("div",{className:"panel-heading",children:b.jsxs("div",{children:[b.jsx("span",{className:"eyebrow",children:"Agent 回答"}),b.jsx("h2",{children:x.title||"等待提问"})]})}),b.jsx("p",{className:"answer-summary",children:x.summary||l?.diagnosis?.fault||l?.route_result?.reason||"输入问题后将展示 Router 与 Knowledge Agent 的回答。"}),l?.route_result&&b.jsx(JS,{value:l.route_result})]}),b.jsxs("div",{className:"panel module-panel",children:[b.jsxs("div",{className:"panel-heading",children:[b.jsxs("div",{children:[b.jsx("span",{className:"eyebrow",children:"引用文档"}),b.jsx("h2",{children:"RAG 命中"})]}),b.jsx("span",{className:"muted",children:h?.source||l?.knowledge?.source||"--"})]}),b.jsx(QS,{documents:y})]})]})]})}function a3({snapshot:o,sample:e}){const[i,s]=Oe.useState([]),[l,f]=Oe.useState(""),[h,d]=Oe.useState(null),[m,p]=Oe.useState([]),[S,v]=Oe.useState([]),[g,M]=Oe.useState(""),[R,C]=Oe.useState(!1),y=i.find(F=>F.workorder_id===l)||i[0];async function x(){try{const[F,N,L]=await Promise.all([$i("/api/workorders"),$i("/api/trace"),$i("/api/experience/search",{method:"POST",body:JSON.stringify({device_id:e?.device_id||o?.device_id||"",limit:8})})]),U=F.items||[];s(U),p(N.trace||[]),v(L.items||[]),!l&&U.length&&f(U[0].workorder_id),M("")}catch(F){M(F.message)}}Oe.useEffect(()=>{x()},[]);async function D(){if(y){C(!0);try{const F=await $i(`/api/workorders/${y.workorder_id}/quality`,{method:"POST",body:"{}"});d(F),await x(),M("")}catch(F){M(F.message)}finally{C(!1)}}}return b.jsxs("section",{className:"workspace-view active module-board","aria-label":"质检系统",children:[b.jsx(Yr,{eyebrow:"QMS 质检系统",title:"维修验收与经验沉淀",text:"对已处理工单执行恢复验证，查看 Agent Trace，并展示维修经验库检索结果。"}),b.jsxs("div",{className:"module-grid",children:[b.jsx(Dn,{label:"待验工单",value:i.length,text:"来自当前工单池"}),b.jsx(Dn,{label:"最近验收",value:h?h.passed?"通过":"未通过":"未执行",text:h?.workorder_id||"选择工单后执行"}),b.jsx(Dn,{label:"经验记录",value:S.length,text:"长期记忆/经验库结果"})]}),b.jsxs("div",{className:"ops-grid",children:[b.jsxs("section",{className:"panel module-panel",children:[b.jsxs("div",{className:"panel-heading",children:[b.jsxs("div",{children:[b.jsx("span",{className:"eyebrow",children:"验收对象"}),b.jsx("h2",{children:"选择工单"})]}),b.jsx("button",{className:"button",type:"button",onClick:x,children:"刷新"})]}),b.jsxs("select",{className:"select-input",value:y?.workorder_id||"",onChange:F=>f(F.target.value),children:[!i.length&&b.jsx("option",{value:"",children:"暂无工单"}),i.map(F=>b.jsxs("option",{value:F.workorder_id,children:[F.workorder_id," · ",F.title]},F.workorder_id))]}),b.jsx("div",{className:"action-row",children:b.jsx("button",{className:"button primary",type:"button",disabled:R||!y,onClick:D,children:R?"验收中":"执行质检"})}),g&&b.jsx("div",{className:"inline-error",children:g})]}),b.jsxs("section",{className:"panel module-panel",children:[b.jsx("div",{className:"panel-heading",children:b.jsxs("div",{children:[b.jsx("span",{className:"eyebrow",children:"质检结果"}),b.jsx("h2",{children:h?h.passed?"验收通过":"验收未通过":"等待验收"})]})}),h?b.jsx(s3,{quality:h}):b.jsx("div",{className:"empty-state",children:"工单完成或关闭后，质检结果会显示恢复状态、报警清除和 SOP 合规性。"})]})]}),b.jsxs("section",{className:"answer-grid",children:[b.jsxs("div",{className:"panel module-panel",children:[b.jsx("div",{className:"panel-heading",children:b.jsxs("div",{children:[b.jsx("span",{className:"eyebrow",children:"经验库"}),b.jsx("h2",{children:"维修经验"})]})}),b.jsx(r3,{items:S})]}),b.jsxs("div",{className:"panel module-panel",children:[b.jsx("div",{className:"panel-heading",children:b.jsxs("div",{children:[b.jsx("span",{className:"eyebrow",children:"Trace"}),b.jsx("h2",{children:"Agent 调用轨迹"})]})}),b.jsx(Hm,{items:m})]})]})]})}function Yr({eyebrow:o,title:e,text:i}){return b.jsxs("div",{className:"module-hero",children:[b.jsx("span",{className:"eyebrow",children:o}),b.jsx("h2",{children:e}),b.jsx("p",{children:i})]})}function Dn({label:o,value:e,text:i}){return b.jsxs("div",{className:"module-card",children:[b.jsx("span",{children:o}),b.jsx("strong",{children:e}),b.jsx("p",{children:i})]})}function ma({label:o,value:e}){return b.jsxs("div",{children:[b.jsx("span",{children:o}),b.jsx("strong",{children:e||"--"})]})}function Fm({steps:o=[]}){return o.length?b.jsx("ol",{className:"step-list",children:o.map((e,i)=>b.jsx("li",{children:e},`${e}-${i}`))}):b.jsx("div",{className:"empty-state",children:"暂无维修步骤"})}function QS({documents:o}){return o.length?b.jsx("div",{className:"document-list",children:o.map((e,i)=>b.jsxs("article",{children:[b.jsx("strong",{children:e.title||e.document_id}),b.jsx("p",{children:e.content}),b.jsxs("span",{children:[e.source||e.metadata?.collection||"知识库"," · 相关度 ",e.score??"--"]})]},e.document_id||i))}):b.jsx("div",{className:"empty-state",children:"暂无命中文档"})}function s3({quality:o}){const e=[["设备恢复",o.device_recovered],["报警清除",o.alarm_cleared],["SOP合规",o.sop_compliant]];return b.jsxs("div",{className:"quality-result",children:[b.jsx("div",{className:"check-grid",children:e.map(([i,s])=>b.jsxs("div",{className:s?"normal":"fault",children:[b.jsx("span",{children:i}),b.jsx("strong",{children:s?"通过":"未通过"})]},i))}),b.jsx(Fm,{steps:o.findings||[]})]})}function r3({items:o}){return o.length?b.jsx("div",{className:"document-list",children:o.map((e,i)=>b.jsxs("article",{children:[b.jsx("strong",{children:e.title}),b.jsx("p",{children:e.content}),b.jsxs("span",{children:[e.device_id||"--"," · ",e.source_workorder||"历史经验"]})]},e.experience_id||i))}):b.jsx("div",{className:"empty-state",children:"暂无经验记录；闭环通过后会自动沉淀。"})}function Hm({items:o}){return o.length?b.jsx("div",{className:"trace-list",children:o.slice(0,12).map((e,i)=>b.jsxs("div",{children:[b.jsx("strong",{children:e.event}),b.jsx("span",{children:e.agent||e.tool||e.mcp_server||"runtime"})]},`${e.event||"trace"}-${i}`))}):b.jsx("div",{className:"empty-state",children:"暂无调用轨迹"})}function JS({value:o}){return b.jsx("pre",{className:"json-block",children:JSON.stringify(o,null,2)})}zE.createRoot(document.getElementById("root")).render(b.jsx(Ow,{}));
