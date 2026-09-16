(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const l of document.querySelectorAll('link[rel="modulepreload"]'))s(l);new MutationObserver(l=>{for(const f of l)if(f.type==="childList")for(const h of f.addedNodes)h.tagName==="LINK"&&h.rel==="modulepreload"&&s(h)}).observe(document,{childList:!0,subtree:!0});function i(l){const f={};return l.integrity&&(f.integrity=l.integrity),l.referrerPolicy&&(f.referrerPolicy=l.referrerPolicy),l.crossOrigin==="use-credentials"?f.credentials="include":l.crossOrigin==="anonymous"?f.credentials="omit":f.credentials="same-origin",f}function s(l){if(l.ep)return;l.ep=!0;const f=i(l);fetch(l.href,f)}})();var Fd={exports:{}},Pl={};var Vv;function CE(){if(Vv)return Pl;Vv=1;var o=Symbol.for("react.transitional.element"),e=Symbol.for("react.fragment");function i(s,l,f){var h=null;if(f!==void 0&&(h=""+f),l.key!==void 0&&(h=""+l.key),"key"in l){f={};for(var d in l)d!=="key"&&(f[d]=l[d])}else f=l;return l=f.ref,{$$typeof:o,type:s,key:h,ref:l!==void 0?l:null,props:f}}return Pl.Fragment=e,Pl.jsx=i,Pl.jsxs=i,Pl}var kv;function NE(){return kv||(kv=1,Fd.exports=CE()),Fd.exports}var b=NE(),Hd={exports:{}},ye={};var Xv;function DE(){if(Xv)return ye;Xv=1;var o=Symbol.for("react.transitional.element"),e=Symbol.for("react.portal"),i=Symbol.for("react.fragment"),s=Symbol.for("react.strict_mode"),l=Symbol.for("react.profiler"),f=Symbol.for("react.consumer"),h=Symbol.for("react.context"),d=Symbol.for("react.forward_ref"),m=Symbol.for("react.suspense"),p=Symbol.for("react.memo"),x=Symbol.for("react.lazy"),v=Symbol.for("react.activity"),g=Symbol.for("react.view_transition"),M=Symbol.iterator;function A(B){return B===null||typeof B!="object"?null:(B=M&&B[M]||B["@@iterator"],typeof B=="function"?B:null)}var C={isMounted:function(){return!1},enqueueForceUpdate:function(){},enqueueReplaceState:function(){},enqueueSetState:function(){}},y=Object.assign,S={};function U(B,xt,Nt){this.props=B,this.context=xt,this.refs=S,this.updater=Nt||C}U.prototype.isReactComponent={},U.prototype.setState=function(B,xt){if(typeof B!="object"&&typeof B!="function"&&B!=null)throw Error("takes an object of state variables to update or a function which returns an object of state variables.");this.updater.enqueueSetState(this,B,xt,"setState")},U.prototype.forceUpdate=function(B){this.updater.enqueueForceUpdate(this,B,"forceUpdate")};function F(){}F.prototype=U.prototype;function N(B,xt,Nt){this.props=B,this.context=xt,this.refs=S,this.updater=Nt||C}var L=N.prototype=new F;L.constructor=N,y(L,U.prototype),L.isPureReactComponent=!0;var D=Array.isArray;function I(){}var T={H:null,A:null,T:null,S:null},O=Object.prototype.hasOwnProperty;function V(B,xt,Nt){var Q=Nt.ref;return{$$typeof:o,type:B,key:xt,ref:Q!==void 0?Q:null,props:Nt}}function Y(B,xt){return V(B.type,xt,B.props)}function J(B){return typeof B=="object"&&B!==null&&B.$$typeof===o}function rt(B){var xt={"=":"=0",":":"=2"};return"$"+B.replace(/[=:]/g,function(Nt){return xt[Nt]})}var j=/\/+/g;function et(B,xt){return typeof B=="object"&&B!==null&&B.key!=null?rt(""+B.key):xt.toString(36)}function q(B){switch(B.status){case"fulfilled":return B.value;case"rejected":throw B.reason;default:switch(typeof B.status=="string"?B.then(I,I):(B.status="pending",B.then(function(xt){B.status==="pending"&&(B.status="fulfilled",B.value=xt)},function(xt){B.status==="pending"&&(B.status="rejected",B.reason=xt)})),B.status){case"fulfilled":return B.value;case"rejected":throw B.reason}}throw B}function Z(B,xt,Nt,Q,dt){var Dt=typeof B;(Dt==="undefined"||Dt==="boolean")&&(B=null);var Wt=!1;if(B===null)Wt=!0;else switch(Dt){case"bigint":case"string":case"number":Wt=!0;break;case"object":switch(B.$$typeof){case o:case e:Wt=!0;break;case x:return Wt=B._init,Z(Wt(B._payload),xt,Nt,Q,dt)}}if(Wt)return dt=dt(B),Wt=Q===""?"."+et(B,0):Q,D(dt)?(Nt="",Wt!=null&&(Nt=Wt.replace(j,"$&/")+"/"),Z(dt,xt,Nt,"",function(Ze){return Ze})):dt!=null&&(J(dt)&&(dt=Y(dt,Nt+(dt.key==null||B&&B.key===dt.key?"":(""+dt.key).replace(j,"$&/")+"/")+Wt)),xt.push(dt)),1;Wt=0;var Mt=Q===""?".":Q+":";if(D(B))for(var It=0;It<B.length;It++)Q=B[It],Dt=Mt+et(Q,It),Wt+=Z(Q,xt,Nt,Dt,dt);else if(It=A(B),typeof It=="function")for(B=It.call(B),It=0;!(Q=B.next()).done;)Q=Q.value,Dt=Mt+et(Q,It++),Wt+=Z(Q,xt,Nt,Dt,dt);else if(Dt==="object"){if(typeof B.then=="function")return Z(q(B),xt,Nt,Q,dt);throw xt=String(B),Error("Objects are not valid as a React child (found: "+(xt==="[object Object]"?"object with keys {"+Object.keys(B).join(", ")+"}":xt)+"). If you meant to render a collection of children, use an array instead.")}return Wt}function ht(B,xt,Nt){if(B==null)return B;var Q=[],dt=0;return Z(B,Q,"","",function(Dt){return xt.call(Nt,Dt,dt++)}),Q}function ct(B){if(B._status===-1){var xt=B._result,Nt=xt();Nt.then(function(Q){(B._status===0||B._status===-1)&&(B._status=1,B._result=Q,Nt.status===void 0&&(Nt.status="fulfilled",Nt.value=Q))},function(Q){(B._status===0||B._status===-1)&&(B._status=2,B._result=Q,Nt.status===void 0&&(Nt.status="rejected",Nt.reason=Q))}),B._status===-1&&(B._status=0,B._result=Nt)}if(B._status===1)return B._result.default;throw B._result}var gt=typeof reportError=="function"?reportError:function(B){if(typeof window=="object"&&typeof window.ErrorEvent=="function"){var xt=new window.ErrorEvent("error",{bubbles:!0,cancelable:!0,message:typeof B=="object"&&B!==null&&typeof B.message=="string"?String(B.message):String(B),error:B});if(!window.dispatchEvent(xt))return}else if(typeof process=="object"&&typeof process.emit=="function"){process.emit("uncaughtException",B);return}console.error(B)};function vt(B){var xt=T.T,Nt={};Nt.types=xt!==null?xt.types:null,T.T=Nt;try{var Q=B(),dt=T.S;dt!==null&&dt(Nt,Q),typeof Q=="object"&&Q!==null&&typeof Q.then=="function"&&Q.then(I,gt)}catch(Dt){gt(Dt)}finally{xt!==null&&Nt.types!==null&&(xt.types=Nt.types),T.T=xt}}function ie(B){var xt=T.T;if(xt!==null){var Nt=xt.types;Nt===null?xt.types=[B]:Nt.indexOf(B)===-1&&Nt.push(B)}else vt(ie.bind(null,B))}var ne={map:ht,forEach:function(B,xt,Nt){ht(B,function(){xt.apply(this,arguments)},Nt)},count:function(B){var xt=0;return ht(B,function(){xt++}),xt},toArray:function(B){return ht(B,function(xt){return xt})||[]},only:function(B){if(!J(B))throw Error("React.Children.only expected to receive a single React element child.");return B}};return ye.Activity=v,ye.Children=ne,ye.Component=U,ye.Fragment=i,ye.Profiler=l,ye.PureComponent=N,ye.StrictMode=s,ye.Suspense=m,ye.ViewTransition=g,ye.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE=T,ye.__COMPILER_RUNTIME={__proto__:null,c:function(B){return T.H.useMemoCache(B)}},ye.addTransitionType=ie,ye.cache=function(B){return function(){return B.apply(null,arguments)}},ye.cacheSignal=function(){return null},ye.cloneElement=function(B,xt,Nt){if(B==null)throw Error("The argument must be a React element, but you passed "+B+".");var Q=y({},B.props),dt=B.key;if(xt!=null)for(Dt in xt.key!==void 0&&(dt=""+xt.key),xt)!O.call(xt,Dt)||Dt==="key"||Dt==="__self"||Dt==="__source"||Dt==="ref"&&xt.ref===void 0||(Q[Dt]=xt[Dt]);var Dt=arguments.length-2;if(Dt===1)Q.children=Nt;else if(1<Dt){for(var Wt=Array(Dt),Mt=0;Mt<Dt;Mt++)Wt[Mt]=arguments[Mt+2];Q.children=Wt}return V(B.type,dt,Q)},ye.createContext=function(B){return B={$$typeof:h,_currentValue:B,_currentValue2:B,_threadCount:0,Provider:null,Consumer:null},B.Provider=B,B.Consumer={$$typeof:f,_context:B},B},ye.createElement=function(B,xt,Nt){var Q,dt={},Dt=null;if(xt!=null)for(Q in xt.key!==void 0&&(Dt=""+xt.key),xt)O.call(xt,Q)&&Q!=="key"&&Q!=="__self"&&Q!=="__source"&&(dt[Q]=xt[Q]);var Wt=arguments.length-2;if(Wt===1)dt.children=Nt;else if(1<Wt){for(var Mt=Array(Wt),It=0;It<Wt;It++)Mt[It]=arguments[It+2];dt.children=Mt}if(B&&B.defaultProps)for(Q in Wt=B.defaultProps,Wt)dt[Q]===void 0&&(dt[Q]=Wt[Q]);return V(B,Dt,dt)},ye.createRef=function(){return{current:null}},ye.forwardRef=function(B){return{$$typeof:d,render:B}},ye.isValidElement=J,ye.lazy=function(B){return{$$typeof:x,_payload:{_status:-1,_result:B},_init:ct}},ye.memo=function(B,xt){return{$$typeof:p,type:B,compare:xt===void 0?null:xt}},ye.startTransition=vt,ye.unstable_useCacheRefresh=function(){return T.H.useCacheRefresh()},ye.use=function(B){return T.H.use(B)},ye.useActionState=function(B,xt,Nt){return T.H.useActionState(B,xt,Nt)},ye.useCallback=function(B,xt){return T.H.useCallback(B,xt)},ye.useContext=function(B){return T.H.useContext(B)},ye.useDebugValue=function(){},ye.useDeferredValue=function(B,xt){return T.H.useDeferredValue(B,xt)},ye.useEffect=function(B,xt){return T.H.useEffect(B,xt)},ye.useEffectEvent=function(B){return T.H.useEffectEvent(B)},ye.useId=function(){return T.H.useId()},ye.useImperativeHandle=function(B,xt,Nt){return T.H.useImperativeHandle(B,xt,Nt)},ye.useInsertionEffect=function(B,xt){return T.H.useInsertionEffect(B,xt)},ye.useLayoutEffect=function(B,xt){return T.H.useLayoutEffect(B,xt)},ye.useMemo=function(B,xt){return T.H.useMemo(B,xt)},ye.useOptimistic=function(B,xt){return T.H.useOptimistic(B,xt)},ye.useReducer=function(B,xt,Nt){return T.H.useReducer(B,xt,Nt)},ye.useRef=function(B){return T.H.useRef(B)},ye.useState=function(B){return T.H.useState(B)},ye.useSyncExternalStore=function(B,xt,Nt){return T.H.useSyncExternalStore(B,xt,Nt)},ye.useTransition=function(){return T.H.useTransition()},ye.version="19.3.0",ye}var Wv;function vm(){return Wv||(Wv=1,Hd.exports=DE()),Hd.exports}var Pe=vm(),Gd={exports:{}},Il={},Vd={exports:{}},kd={};var Yv;function UE(){return Yv||(Yv=1,(function(o){function e(q,Z){var ht=q.length;q.push(Z);t:for(;0<ht;){var ct=ht-1>>>1,gt=q[ct];if(0<l(gt,Z))q[ct]=Z,q[ht]=gt,ht=ct;else break t}}function i(q){return q.length===0?null:q[0]}function s(q){if(q.length===0)return null;var Z=q[0],ht=q.pop();if(ht!==Z){q[0]=ht;t:for(var ct=0,gt=q.length,vt=gt>>>1;ct<vt;){var ie=2*(ct+1)-1,ne=q[ie],B=ie+1,xt=q[B];if(0>l(ne,ht))B<gt&&0>l(xt,ne)?(q[ct]=xt,q[B]=ht,ct=B):(q[ct]=ne,q[ie]=ht,ct=ie);else if(B<gt&&0>l(xt,ht))q[ct]=xt,q[B]=ht,ct=B;else break t}}return Z}function l(q,Z){var ht=q.sortIndex-Z.sortIndex;return ht!==0?ht:q.id-Z.id}if(o.unstable_now=void 0,typeof performance=="object"&&typeof performance.now=="function"){var f=performance;o.unstable_now=function(){return f.now()}}else{var h=Date,d=h.now();o.unstable_now=function(){return h.now()-d}}var m=[],p=[],x=1,v=null,g=3,M=!1,A=!1,C=!1,y=!1,S=typeof setTimeout=="function"?setTimeout:null,U=typeof clearTimeout=="function"?clearTimeout:null,F=typeof setImmediate<"u"?setImmediate:null;function N(q){for(var Z=i(p);Z!==null;){if(Z.callback===null)s(p);else if(Z.startTime<=q)s(p),Z.sortIndex=Z.expirationTime,e(m,Z);else break;Z=i(p)}}function L(q){if(C=!1,N(q),!A)if(i(m)!==null)A=!0,D||(D=!0,J());else{var Z=i(p);Z!==null&&et(L,Z.startTime-q)}}var D=!1,I=-1,T=5,O=-1;function V(){return y?!0:!(o.unstable_now()-O<T)}function Y(){if(y=!1,D){var q=o.unstable_now();O=q;var Z=!0;try{t:{A=!1,C&&(C=!1,U(I),I=-1),M=!0;var ht=g;try{e:{for(N(q),v=i(m);v!==null&&!(v.expirationTime>q&&V());){var ct=v.callback;if(typeof ct=="function"){v.callback=null,g=v.priorityLevel;var gt=ct(v.expirationTime<=q);if(q=o.unstable_now(),typeof gt=="function"){v.callback=gt,N(q),Z=!0;break e}v===i(m)&&s(m),N(q)}else s(m);v=i(m)}if(v!==null)Z=!0;else{var vt=i(p);vt!==null&&et(L,vt.startTime-q),Z=!1}}break t}finally{v=null,g=ht,M=!1}Z=void 0}}finally{Z?J():D=!1}}}var J;if(typeof F=="function")J=function(){F(Y)};else if(typeof MessageChannel<"u"){var rt=new MessageChannel,j=rt.port2;rt.port1.onmessage=Y,J=function(){j.postMessage(null)}}else J=function(){S(Y,0)};function et(q,Z){I=S(function(){q(o.unstable_now())},Z)}o.unstable_IdlePriority=5,o.unstable_ImmediatePriority=1,o.unstable_LowPriority=4,o.unstable_NormalPriority=3,o.unstable_Profiling=null,o.unstable_UserBlockingPriority=2,o.unstable_cancelCallback=function(q){q.callback=null},o.unstable_forceFrameRate=function(q){0>q||125<q?console.error("forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported"):T=0<q?Math.floor(1e3/q):5},o.unstable_getCurrentPriorityLevel=function(){return g},o.unstable_next=function(q){switch(g){case 1:case 2:case 3:var Z=3;break;default:Z=g}var ht=g;g=Z;try{return q()}finally{g=ht}},o.unstable_requestPaint=function(){y=!0},o.unstable_runWithPriority=function(q,Z){switch(q){case 1:case 2:case 3:case 4:case 5:break;default:q=3}var ht=g;g=q;try{return Z()}finally{g=ht}},o.unstable_scheduleCallback=function(q,Z,ht){var ct=o.unstable_now();switch(typeof ht=="object"&&ht!==null?(ht=ht.delay,ht=typeof ht=="number"&&0<ht?ct+ht:ct):ht=ct,q){case 1:var gt=-1;break;case 2:gt=250;break;case 5:gt=1073741823;break;case 4:gt=1e4;break;default:gt=5e3}return gt=ht+gt,q={id:x++,callback:Z,priorityLevel:q,startTime:ht,expirationTime:gt,sortIndex:-1},ht>ct?(q.sortIndex=ht,e(p,q),i(m)===null&&q===i(p)&&(C?(U(I),I=-1):C=!0,et(L,ht-ct))):(q.sortIndex=gt,e(m,q),A||M||(A=!0,D||(D=!0,J()))),q},o.unstable_shouldYield=V,o.unstable_wrapCallback=function(q){var Z=g;return function(){var ht=g;g=Z;try{return q.apply(this,arguments)}finally{g=ht}}}})(kd)),kd}var qv;function LE(){return qv||(qv=1,Vd.exports=UE()),Vd.exports}var Xd={exports:{}},ti={};var jv;function OE(){if(jv)return ti;jv=1;var o=vm();function e(x){var v="https://react.dev/errors/"+x;if(1<arguments.length){v+="?args[]="+encodeURIComponent(arguments[1]);for(var g=2;g<arguments.length;g++)v+="&args[]="+encodeURIComponent(arguments[g])}return"Minified React error #"+x+"; visit "+v+" for the full message or use the non-minified dev environment for full errors and additional helpful warnings."}function i(){}var s={d:{f:i,r:function(){throw Error(e(522))},D:i,C:i,L:i,m:i,X:i,S:i,M:i},p:0,findDOMNode:null},l=Symbol.for("react.portal"),f=Symbol.for("react.recoverable"),h=Symbol.for("react.optimistic_key");function d(x,v,g){var M=3<arguments.length&&arguments[3]!==void 0?arguments[3]:null;return{$$typeof:l,key:M==null?null:M===h?h:""+M,children:x,containerInfo:v,implementation:g}}var m=o.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;function p(x,v){if(x==="font")return"";if(typeof v=="string")return v==="use-credentials"?v:""}return ti.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE=s,ti.browser=function(x){return{$$typeof:f,_reason:x}},ti.createPortal=function(x,v){var g=2<arguments.length&&arguments[2]!==void 0?arguments[2]:null;if(!v||v.nodeType!==1&&v.nodeType!==9&&v.nodeType!==11)throw Error(e(299));return d(x,v,null,g)},ti.flushSync=function(x){var v=m.T,g=s.p;try{if(m.T=null,s.p=2,x)return x()}finally{m.T=v,s.p=g,s.d.f()}},ti.preconnect=function(x,v){typeof x=="string"&&(v?(v=v.crossOrigin,v=typeof v=="string"?v==="use-credentials"?v:"":void 0):v=null,s.d.C(x,v))},ti.prefetchDNS=function(x){typeof x=="string"&&s.d.D(x)},ti.preinit=function(x,v){if(typeof x=="string"&&v&&typeof v.as=="string"){var g=v.as,M=p(g,v.crossOrigin),A=typeof v.integrity=="string"?v.integrity:void 0,C=typeof v.fetchPriority=="string"?v.fetchPriority:void 0;g==="style"?s.d.S(x,typeof v.precedence=="string"?v.precedence:void 0,{crossOrigin:M,integrity:A,fetchPriority:C}):g==="script"&&s.d.X(x,{crossOrigin:M,integrity:A,fetchPriority:C,nonce:typeof v.nonce=="string"?v.nonce:void 0})}},ti.preinitModule=function(x,v){if(typeof x=="string")if(typeof v=="object"&&v!==null){if(v.as==null||v.as==="script"){var g=p(v.as,v.crossOrigin);s.d.M(x,{crossOrigin:g,integrity:typeof v.integrity=="string"?v.integrity:void 0,nonce:typeof v.nonce=="string"?v.nonce:void 0,fetchPriority:typeof v.fetchPriority=="string"?v.fetchPriority:void 0})}}else v==null&&s.d.M(x)},ti.preload=function(x,v){if(typeof x=="string"&&typeof v=="object"&&v!==null&&typeof v.as=="string"){var g=v.as,M=p(g,v.crossOrigin);s.d.L(x,g,{crossOrigin:M,integrity:typeof v.integrity=="string"?v.integrity:void 0,nonce:typeof v.nonce=="string"?v.nonce:void 0,type:typeof v.type=="string"?v.type:void 0,fetchPriority:typeof v.fetchPriority=="string"?v.fetchPriority:void 0,referrerPolicy:typeof v.referrerPolicy=="string"?v.referrerPolicy:void 0,imageSrcSet:typeof v.imageSrcSet=="string"?v.imageSrcSet:void 0,imageSizes:typeof v.imageSizes=="string"?v.imageSizes:void 0,media:typeof v.media=="string"?v.media:void 0})}},ti.preloadModule=function(x,v){if(typeof x=="string")if(v){var g=p(v.as,v.crossOrigin);s.d.m(x,{as:typeof v.as=="string"&&v.as!=="script"?v.as:void 0,crossOrigin:g,integrity:typeof v.integrity=="string"?v.integrity:void 0,nonce:typeof v.nonce=="string"?v.nonce:void 0,fetchPriority:typeof v.fetchPriority=="string"?v.fetchPriority:void 0})}else s.d.m(x)},ti.requestFormReset=function(x){s.d.r(x)},ti.unstable_batchedUpdates=function(x,v){return x(v)},ti.useFormState=function(x,v,g){return m.H.useFormState(x,v,g)},ti.useFormStatus=function(){return m.H.useHostTransitionStatus()},ti.version="19.3.0",ti}var Zv;function PE(){if(Zv)return Xd.exports;Zv=1;function o(){if(!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__>"u"||typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE!="function"))try{__REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(o)}catch(e){console.error(e)}}return o(),Xd.exports=OE(),Xd.exports}var Kv;function IE(){if(Kv)return Il;Kv=1;var o=LE(),e=vm(),i=PE();function s(t){var n="https://react.dev/errors/"+t;if(1<arguments.length){n+="?args[]="+encodeURIComponent(arguments[1]);for(var a=2;a<arguments.length;a++)n+="&args[]="+encodeURIComponent(arguments[a])}return"Minified React error #"+t+"; visit "+n+" for the full message or use the non-minified dev environment for full errors and additional helpful warnings."}function l(t){return!(!t||t.nodeType!==1&&t.nodeType!==9&&t.nodeType!==11)}function f(t){for(var n=t,a=n;a&&!a.alternate;)n=a,(n.flags&4098)!==0&&(t=n.return),a=n.return;for(;n.return;)n=n.return;return n.tag===3?t:null}function h(t){if(t.tag===13){var n=t.memoizedState;if(n===null&&(t=t.alternate,t!==null&&(n=t.memoizedState)),n!==null)return n.dehydrated}return null}function d(t){if(t.tag===31){var n=t.memoizedState;if(n===null&&(t=t.alternate,t!==null&&(n=t.memoizedState)),n!==null)return n.dehydrated}return null}function m(t){if(f(t)!==t)throw Error(s(188))}function p(t){var n=t.alternate;if(!n){if(n=f(t),n===null)throw Error(s(188));return n!==t?null:t}for(var a=t,r=n;;){var c=a.return;if(c===null)break;var u=c.alternate;if(u===null){if(r=c.return,r!==null){a=r;continue}break}if(c.child===u.child){for(u=c.child;u;){if(u===a)return m(c),t;if(u===r)return m(c),n;u=u.sibling}throw Error(s(188))}if(a.return!==r.return)a=c,r=u;else{for(var _=!1,w=c.child;w;){if(w===a){_=!0,a=c,r=u;break}if(w===r){_=!0,r=c,a=u;break}w=w.sibling}if(!_){for(w=u.child;w;){if(w===a){_=!0,a=u,r=c;break}if(w===r){_=!0,r=u,a=c;break}w=w.sibling}if(!_)throw Error(s(189))}}if(a.alternate!==r)throw Error(s(190))}if(a.tag!==3)throw Error(s(188));return a.stateNode.current===a?t:n}function x(t){var n=t.tag;if(n===5||n===26||n===27||n===6)return t;for(t=t.child;t!==null;){if(n=x(t),n!==null)return n;t=t.sibling}return null}function v(t,n,a,r,c,u){for(;t!==null;){if((t.tag===5||t.tag===27||t.tag===6)&&a(t,r,c,u)||(t.tag!==22||t.memoizedState===null)&&(n||t.tag!==5&&t.tag!==27)&&v(t.child,n,a,r,c,u))return!0;t=t.sibling}return!1}function g(t){for(t=t.return;t!==null;){if(t.tag===3||t.tag===5||t.tag===27)return t;t=t.return}return null}function M(t){var n=!1;for(t=t.return;t!==null&&(t.tag===4&&(n=!0),!(t.tag===3||t.tag===5||t.tag===27));)t=t.return;return n}function A(t){var n=[null,null],a=g(t);return a===null||C(n,t,a.child,{foundSelf:!1}),n}function C(t,n,a,r){for(;a!==null;){if(a===n)r.foundSelf=!0;else if(a.tag===5||a.tag===27||a.tag===6){if(r.foundSelf)return t[1]=a,!0;t[0]=a}else if((a.tag!==22||a.memoizedState===null)&&C(t,n,a.child,r))return!0;a=a.sibling}return!1}function y(t){switch(t.tag){case 5:case 27:case 6:return t.stateNode;case 3:return t.stateNode.containerInfo;default:throw Error(s(559))}}var S=null,U=null;function F(t,n,a){return t===a?!0:t===n?(S=t,!0):!1}function N(t,n,a){return t===a?(U=t,!1):t===n?(U!==null&&(S=t),!0):!1}function L(t){if(t===null)return null;do t=t===null?null:t.return;while(t&&t.tag!==5&&t.tag!==27&&t.tag!==3);return t||null}function D(t,n,a){for(var r=0,c=t;c;c=a(c))r++;c=0;for(var u=n;u;u=a(u))c++;for(;0<r-c;)t=a(t),r--;for(;0<c-r;)n=a(n),c--;for(;r--;){if(t===n||n!==null&&t===n.alternate)return t;t=a(t),n=a(n)}return null}var I=Object.assign,T=Symbol.for("react.element"),O=Symbol.for("react.transitional.element"),V=Symbol.for("react.portal"),Y=Symbol.for("react.fragment"),J=Symbol.for("react.strict_mode"),rt=Symbol.for("react.profiler"),j=Symbol.for("react.consumer"),et=Symbol.for("react.context"),q=Symbol.for("react.forward_ref"),Z=Symbol.for("react.suspense"),ht=Symbol.for("react.suspense_list"),ct=Symbol.for("react.memo"),gt=Symbol.for("react.lazy"),vt=Symbol.for("react.activity"),ie=Symbol.for("react.legacy_hidden"),ne=Symbol.for("react.memo_cache_sentinel"),B=Symbol.for("react.view_transition"),xt=Symbol.for("react.recoverable"),Nt=Symbol.iterator;function Q(t){return t===null||typeof t!="object"?null:(t=Nt&&t[Nt]||t["@@iterator"],typeof t=="function"?t:null)}var dt=Symbol.for("react.client.reference");function Dt(t){if(t==null)return null;if(typeof t=="function")return t.$$typeof===dt?null:t.displayName||t.name||null;if(typeof t=="string")return t;switch(t){case Y:return"Fragment";case rt:return"Profiler";case J:return"StrictMode";case Z:return"Suspense";case ht:return"SuspenseList";case vt:return"Activity";case B:return"ViewTransition"}if(typeof t=="object")switch(t.$$typeof){case V:return"Portal";case et:return t.displayName||"Context";case j:return(t._context.displayName||"Context")+".Consumer";case q:var n=t.render;return t=t.displayName,t||(t=n.displayName||n.name||"",t=t!==""?"ForwardRef("+t+")":"ForwardRef"),t;case ct:return n=t.displayName||null,n!==null?n:Dt(t.type)||"Memo";case gt:n=t._payload,t=t._init;try{return Dt(t(n))}catch{}}return null}var Wt=Array.isArray,Mt=e.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE,It=i.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE,Ze={pending:!1,data:null,method:null,action:null},Ee=[],Te=-1;function Ce(t){return{current:t}}function ce(t){0>Te||(t.current=Ee[Te],Ee[Te]=null,Te--)}function fe(t,n){Te++,Ee[Te]=t.current,t.current=n}var Ke=Ce(null),ve=Ce(null),We=Ce(null),on=Ce(null);function W(t,n){switch(fe(We,n),fe(ve,t),fe(Ke,null),n.nodeType){case 9:case 11:t=(t=n.documentElement)&&(t=t.namespaceURI)?Q_(t):0;break;default:if(t=n.tagName,n=n.namespaceURI)n=Q_(n),t=J_(n,t);else switch(t){case"svg":t=1;break;case"math":t=2;break;default:t=0}}ce(Ke),fe(Ke,t)}function un(){ce(Ke),ce(ve),ce(We)}function Ue(t){var n=t.memoizedState;n!==null&&(So._currentValue=n.memoizedState,fe(on,t)),n=Ke.current;var a=J_(n,t.type);n!==a&&(fe(ve,t),fe(Ke,a))}function P(t){ve.current===t&&(ce(Ke),ce(ve)),on.current===t&&(ce(on),So._currentValue=Ze)}var E,nt;function ot(t){if(E===void 0)try{throw Error()}catch(a){var n=a.stack.trim().match(/\n( *(at )?)/);E=n&&n[1]||"",nt=-1<a.stack.indexOf(`
    at`)?" (<anonymous>)":-1<a.stack.indexOf("@")?"@unknown:0:0":""}return`
`+E+t+nt}var _t=!1;function At(t,n){if(!t||_t)return"";_t=!0;var a=Error.prepareStackTrace;Error.prepareStackTrace=void 0;try{var r={DetermineComponentFrameRoot:function(){try{if(n){var Tt=function(){throw Error()};if(Object.defineProperty(Tt.prototype,"props",{set:function(){throw Error()}}),typeof Reflect=="object"&&Reflect.construct){try{Reflect.construct(Tt,[])}catch(Xt){var K=Xt}Reflect.construct(t,[],Tt)}else{try{Tt.call()}catch(Xt){K=Xt}Tt=!1;try{var lt=Object.getOwnPropertyDescriptor(t.prototype,"props");Object.defineProperty(t.prototype,"props",{configurable:!0,set:function(){throw Error()}}),Tt=!0,new t}finally{Tt&&(lt!==void 0?Object.defineProperty(t.prototype,"props",lt):delete t.prototype.props)}}}else{try{throw Error()}catch(Xt){K=Xt}(Tt=t())&&typeof Tt.catch=="function"&&Tt.catch(function(){})}}catch(Xt){if(Xt&&K&&typeof Xt.stack=="string")return[Xt.stack,K.stack]}return[null,null]}};r.DetermineComponentFrameRoot.displayName="DetermineComponentFrameRoot";var c=Object.getOwnPropertyDescriptor(r.DetermineComponentFrameRoot,"name");c&&c.configurable&&Object.defineProperty(r.DetermineComponentFrameRoot,"name",{value:"DetermineComponentFrameRoot"});var u=r.DetermineComponentFrameRoot(),_=u[0],w=u[1];if(_&&w){var z=_.split(`
`),tt=w.split(`
`);for(c=r=0;r<z.length&&!z[r].includes("DetermineComponentFrameRoot");)r++;for(;c<tt.length&&!tt[c].includes("DetermineComponentFrameRoot");)c++;if(r===z.length||c===tt.length)for(r=z.length-1,c=tt.length-1;1<=r&&0<=c&&z[r]!==tt[c];)c--;for(;1<=r&&0<=c;r--,c--)if(z[r]!==tt[c]){if(r!==1||c!==1)do if(r--,c--,0>c||z[r]!==tt[c]){var ft=`
`+z[r].replace(" at new "," at ");return t.displayName&&ft.includes("<anonymous>")&&(ft=ft.replace("<anonymous>",t.displayName)),ft}while(1<=r&&0<=c);break}}}finally{_t=!1,Error.prepareStackTrace=a}return(a=t?t.displayName||t.name:"")?ot(a):""}function Ut(t,n){switch(t.tag){case 26:case 27:case 5:return ot(t.type);case 16:return ot("Lazy");case 13:return t.child!==n&&n!==null?ot("Suspense Fallback"):ot("Suspense");case 19:return ot("SuspenseList");case 0:case 15:return At(t.type,!1);case 11:return At(t.type.render,!1);case 1:return At(t.type,!0);case 31:return ot("Activity");case 30:return ot("ViewTransition");default:return""}}function pt(t){try{var n="",a=null;do n+=Ut(t,a),a=t,t=t.return;while(t);return n}catch(r){return`
Error generating stack: `+r.message+`
`+r.stack}}var St=Object.prototype.hasOwnProperty,Ft=o.unstable_scheduleCallback,ae=o.unstable_cancelCallback,Ht=o.unstable_shouldYield,zt=o.unstable_requestPaint,Kt=o.unstable_now,le=o.unstable_getCurrentPriorityLevel,he=o.unstable_ImmediatePriority,k=o.unstable_UserBlockingPriority,Ot=o.unstable_NormalPriority,Et=o.unstable_LowPriority,Gt=o.unstable_IdlePriority,jt=o.log,wt=o.unstable_setDisableYieldValue,se=null,Yt=null;function Le(t){if(typeof jt=="function"&&wt(t),Yt&&typeof Yt.setStrictMode=="function")try{Yt.setStrictMode(se,t)}catch{}}var xe=Math.clz32?Math.clz32:Xa,ni=Math.log,In=Math.LN2;function Xa(t){return t>>>=0,t===0?32:31-(ni(t)/In|0)|0}var dn=256,Wa=262144,xa=4194304;function Ti(t){var n=t&42;if(n!==0)return n;switch(t&-t){case 1:return 1;case 2:return 2;case 4:return 4;case 8:return 8;case 16:return 16;case 32:return 32;case 64:return 64;case 128:return 128;case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:return t&-t;case 262144:case 524288:case 1048576:case 2097152:return t&3932160;case 4194304:case 8388608:case 16777216:case 33554432:return t&62914560;case 67108864:return 67108864;case 134217728:return 134217728;case 268435456:return 268435456;case 536870912:return 536870912;case 1073741824:return 0;default:return t}}function Ya(t,n,a){var r=t.pendingLanes;if(r===0)return 0;var c=0,u=t.suspendedLanes,_=t.pingedLanes;t=t.warmLanes;var w=r&134217727;return w!==0?(r=w&~u,r!==0?c=Ti(r):(_&=w,_!==0?c=Ti(_):a||(a=w&~t,a!==0&&(c=Ti(a))))):(w=r&~u,w!==0?c=Ti(w):_!==0?c=Ti(_):a||(a=r&~t,a!==0&&(c=Ti(a)))),c===0?0:n!==0&&n!==c&&(n&u)===0&&(u=c&-c,a=n&-n,u>=a||u===32&&(a&4194048)!==0)?n:c}function Xi(t,n){return(t.pendingLanes&~(t.suspendedLanes&~t.pingedLanes)&n)===0}function Ai(t,n){(n&8)!==0&&(n|=n&32);var a=t.entangledLanes;if(a!==0)for(t=t.entanglements,a&=n;0<a;){var r=31-xe(a),c=1<<r;n|=t[r],a&=~c}return n}function Sa(t,n){switch(t){case 1:case 2:case 4:case 8:case 64:return n+250;case 16:case 32:case 128:case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:return n+5e3;case 4194304:case 8388608:case 16777216:case 33554432:return-1;case 67108864:case 134217728:case 268435456:case 536870912:case 1073741824:return-1;default:return-1}}function ya(){var t=xa;return xa<<=1,(xa&62914560)===0&&(xa=4194304),t}function Ri(t){for(var n=[],a=0;31>a;a++)n.push(t);return n}function Wi(t,n){t.pendingLanes|=n,n!==268435456&&(t.suspendedLanes=0,t.pingedLanes=0,t.warmLanes=0)}function Ma(t,n,a,r,c,u){var _=t.pendingLanes;t.pendingLanes=a,t.suspendedLanes=0,t.pingedLanes=0,t.warmLanes=0,t.expiredLanes&=a,t.entangledLanes&=a,t.errorRecoveryDisabledLanes&=a,t.shellSuspendCounter=0;var w=t.entanglements,z=t.expirationTimes,tt=t.hiddenUpdates;for(a=_&~a;0<a;){var ft=31-xe(a),Tt=1<<ft;w[ft]=0,z[ft]=-1;var K=tt[ft];if(K!==null)for(tt[ft]=null,ft=0;ft<K.length;ft++){var lt=K[ft];lt!==null&&(lt.lane&=-536870913)}a&=~Tt}r!==0&&Yi(t,r,0),u!==0&&c===0&&t.tag!==0&&(t.suspendedLanes|=u&~(_&~n))}function Yi(t,n,a){t.pendingLanes|=n,t.suspendedLanes&=~n;var r=31-xe(n);t.entangledLanes|=n,t.entanglements[r]=t.entanglements[r]|1073741824|a&261930}function ir(t,n){var a=t.entangledLanes|=n;for(t=t.entanglements;a;){var r=31-xe(a),c=1<<r;c&n|t[r]&n&&(t[r]|=n),a&=~c}}function xs(t,n){var a=n&-n;return a=(a&42)!==0?1:Ss(a),(a&(t.suspendedLanes|n))!==0?0:a}function Ss(t){switch(t){case 2:t=1;break;case 8:t=4;break;case 32:t=16;break;case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:case 4194304:case 8388608:case 16777216:case 33554432:t=128;break;case 268435456:t=134217728;break;default:t=0}return t}function pi(t){return t&=-t,2<t?8<t?(t&134217727)!==0?32:268435456:8:2}function ar(){var t=It.p;return t!==0?t:(t=window.event,t===void 0?32:Pv(t.type))}function mi(t,n){var a=It.p;try{return It.p=t,n()}finally{It.p=a}}var oi=Math.random().toString(36).slice(2),R="__reactFiber$"+oi,H="__reactProps$"+oi,ut="__reactContainer$"+oi,at="__reactEvents$"+oi,st="__reactListeners$"+oi,Vt="__reactHandles$"+oi,Qt="__reactResources$"+oi,Bt="__reactMarker$"+oi,$t="__reactLoad$"+oi;function ee(t){delete t[R],delete t[H],delete t[st],delete t[Vt]}function pe(t){var n;if(n=t[R])return n;for(var a=t.parentNode;a;){if(n=a[ut]||a[R]){if(a=n.alternate,n.child!==null||a!==null&&a.child!==null)for(t=mv(t);t!==null;){if(a=t[R])return a;t=mv(t)}return n}t=a,a=t.parentNode}return null}function Se(t){if(t=t[R]||t[ut]){var n=t.tag;if(n===5||n===6||n===13||n===31||n===26||n===27||n===3)return t}return null}function Jt(t){var n=t.tag;if(n===5||n===26||n===27||n===6)return t.stateNode;throw Error(s(33))}function Ne(t){var n=t[Qt];return n||(n=t[Qt]={hoistableStyles:new Map,hoistableScripts:new Map}),n}function we(t){t[Bt]=!0}function Qe(t){t[$t]=void 0}var Ye=new Set,bn={};function qt(t,n){pn(t,n),pn(t+"Capture",n)}function pn(t,n){for(bn[t]=n,t=0;t<n.length;t++)Ye.add(n[t])}var ze=RegExp("^[:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD][:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD\\-.0-9\\u00B7\\u0300-\\u036F\\u203F-\\u2040]*$"),mt={},Ct={};function Lt(t){return St.call(Ct,t)?!0:St.call(mt,t)?!1:ze.test(t)?Ct[t]=!0:(mt[t]=!0,!1)}var yt=!1;function Rt(){var t=yt;return yt=!1,t}function Pt(t,n,a){if(Lt(n))if(a===null)t.removeAttribute(n);else{switch(typeof a){case"undefined":case"function":case"symbol":t.removeAttribute(n);return;case"boolean":var r=n.toLowerCase().slice(0,5);if(r!=="data-"&&r!=="aria-"){t.removeAttribute(n);return}}t.setAttribute(n,a)}}function kt(t,n,a){if(a===null)t.removeAttribute(n);else{switch(typeof a){case"undefined":case"function":case"symbol":case"boolean":t.removeAttribute(n);return}t.setAttribute(n,a)}}function re(t,n,a,r){if(r===null)t.removeAttribute(a);else{switch(typeof r){case"undefined":case"function":case"symbol":case"boolean":t.removeAttribute(a);return}t.setAttributeNS(n,a,r)}}function de(t){switch(typeof t){case"bigint":case"boolean":case"number":case"string":case"undefined":return t;case"object":return t;default:return""}}function Vn(t){var n=t.type;return(t=t.nodeName)&&t.toLowerCase()==="input"&&(n==="checkbox"||n==="radio")}function wi(t,n,a){var r=Object.getOwnPropertyDescriptor(t.constructor.prototype,n);if(!t.hasOwnProperty(n)&&typeof r<"u"&&typeof r.get=="function"&&typeof r.set=="function"){var c=r.get,u=r.set;return Object.defineProperty(t,n,{configurable:!0,get:function(){return c.call(this)},set:function(_){a=""+_,u.call(this,_)}}),Object.defineProperty(t,n,{enumerable:r.enumerable}),{getValue:function(){return a},setValue:function(_){a=""+_},stopTracking:function(){t._valueTracker=null,delete t[n]}}}}function Ea(t){if(!t._valueTracker){var n=Vn(t)?"checked":"value";t._valueTracker=wi(t,n,""+t[n])}}function oa(t){if(!t)return!1;var n=t._valueTracker;if(!n)return!0;var a=n.getValue(),r="";return t&&(r=Vn(t)?t.checked?"true":"false":t.value),t=r,t!==a?(n.setValue(t),!0):!1}var xn=/[\n"\\]/g;function Ge(t){return t.replace(xn,function(n){return"\\"+n.charCodeAt(0).toString(16)+" "})}function Sn(t,n,a,r,c,u,_,w){t.name="",_!=null&&typeof _!="function"&&typeof _!="symbol"&&typeof _!="boolean"?t.type=_:t.removeAttribute("type"),n!=null?_==="number"?(n===0&&t.value===""||t.value!=n)&&(t.value=""+de(n)):t.value!==""+de(n)&&(t.value=""+de(n)):_!=="submit"&&_!=="reset"||t.removeAttribute("value"),n!=null?_==="number"&&t.value==n?yn(t,de(t.value)):yn(t,de(n)):a!=null?yn(t,de(a)):r!=null&&t.removeAttribute("value"),c==null&&u!=null&&(t.defaultChecked=!!u),c!=null&&(t.checked=c&&typeof c!="function"&&typeof c!="symbol"),w!=null&&typeof w!="function"&&typeof w!="symbol"&&typeof w!="boolean"?t.name=""+de(w):t.removeAttribute("name")}function Ci(t,n,a,r,c,u,_,w){if(u!=null&&typeof u!="function"&&typeof u!="symbol"&&typeof u!="boolean"&&(t.type=u),n!=null||a!=null){if(!(u!=="submit"&&u!=="reset"||n!=null)){Ea(t);return}a=a!=null?""+de(a):"",n=n!=null?""+de(n):a,w||n===t.value||(t.value=n),t.defaultValue=n}r=r??c,r=typeof r!="function"&&typeof r!="symbol"&&!!r,t.checked=w?t.checked:!!r,t.defaultChecked=!!r,_!=null&&typeof _!="function"&&typeof _!="symbol"&&typeof _!="boolean"&&(t.name=_),Ea(t)}function yn(t,n){t.defaultValue!==""+n&&(t.defaultValue=""+n)}function wn(t,n,a,r){if(t=t.options,n){n={};for(var c=0;c<a.length;c++)n["$"+a[c]]=!0;for(a=0;a<t.length;a++)c=n.hasOwnProperty("$"+t[a].value),t[a].selected!==c&&(t[a].selected=c),c&&r&&(t[a].defaultSelected=!0)}else{for(a=""+de(a),n=null,c=0;c<t.length;c++){if(t[c].value===a){t[c].selected=!0,r&&(t[c].defaultSelected=!0);return}n!==null||t[c].disabled||(n=t[c])}n!==null&&(n.selected=!0)}}function jn(t,n,a){if(n!=null&&(n=""+de(n),n!==t.value&&(t.value=n),a==null)){t.defaultValue!==n&&(t.defaultValue=n);return}t.defaultValue=a!=null?""+de(a):""}function qa(t,n,a,r){if(n==null){if(r!=null){if(a!=null)throw Error(s(92));if(Wt(r)){if(1<r.length)throw Error(s(93));r=r[0]}a=r}a==null&&(a=""),n=a}a=de(n),t.defaultValue=a,r=t.textContent,r===a&&r!==""&&r!==null&&(t.value=r),Ea(t)}function zn(t,n){if(n){var a=t.firstChild;if(a&&a===t.lastChild&&a.nodeType===3){a.nodeValue=n;return}}t.textContent=n}var Yo=new Set("animationIterationCount aspectRatio borderImageOutset borderImageSlice borderImageWidth boxFlex boxFlexGroup boxOrdinalGroup columnCount columns flex flexGrow flexPositive flexShrink flexNegative flexOrder gridArea gridRow gridRowEnd gridRowSpan gridRowStart gridColumn gridColumnEnd gridColumnSpan gridColumnStart fontWeight lineClamp lineHeight opacity order orphans scale tabSize widows zIndex zoom fillOpacity floodOpacity stopOpacity strokeDasharray strokeDashoffset strokeMiterlimit strokeOpacity strokeWidth MozAnimationIterationCount MozBoxFlex MozBoxFlexGroup MozLineClamp msAnimationIterationCount msFlex msZoom msFlexGrow msFlexNegative msFlexOrder msFlexPositive msFlexShrink msGridColumn msGridColumnSpan msGridRow msGridRowSpan WebkitAnimationIterationCount WebkitBoxFlex WebKitBoxFlexGroup WebkitBoxOrdinalGroup WebkitColumnCount WebkitColumns WebkitFlex WebkitFlexGrow WebkitFlexPositive WebkitFlexShrink WebkitLineClamp".split(" "));function zr(t,n,a){var r=n.indexOf("--")===0;a==null||typeof a=="boolean"||a===""?r?t.setProperty(n,""):n==="float"?t.cssFloat="":t[n]="":r?t.setProperty(n,a):typeof a!="number"||a===0||Yo.has(n)?n==="float"?t.cssFloat=a:t[n]=(""+a).trim():t[n]=a+"px"}function ja(t,n,a){if(n!=null&&typeof n!="object")throw Error(s(62));if(t=t.style,a!=null){for(var r in a)!a.hasOwnProperty(r)||n!=null&&n.hasOwnProperty(r)||(r.indexOf("--")===0?t.setProperty(r,""):r==="float"?t.cssFloat="":t[r]="",yt=!0);for(var c in n)r=n[c],n.hasOwnProperty(c)&&a[c]!==r&&(zr(t,c,r),yt=!0)}else for(var u in n)n.hasOwnProperty(u)&&zr(t,u,n[u])}function ys(t){if(t.indexOf("-")===-1)return!1;switch(t){case"annotation-xml":case"color-profile":case"font-face":case"font-face-src":case"font-face-uri":case"font-face-format":case"font-face-name":case"missing-glyph":return!1;default:return!0}}var sr=new Map([["acceptCharset","accept-charset"],["htmlFor","for"],["httpEquiv","http-equiv"],["crossOrigin","crossorigin"],["accentHeight","accent-height"],["alignmentBaseline","alignment-baseline"],["arabicForm","arabic-form"],["baselineShift","baseline-shift"],["capHeight","cap-height"],["clipPath","clip-path"],["clipRule","clip-rule"],["colorInterpolation","color-interpolation"],["colorInterpolationFilters","color-interpolation-filters"],["colorProfile","color-profile"],["colorRendering","color-rendering"],["dominantBaseline","dominant-baseline"],["enableBackground","enable-background"],["fillOpacity","fill-opacity"],["fillRule","fill-rule"],["floodColor","flood-color"],["floodOpacity","flood-opacity"],["fontFamily","font-family"],["fontSize","font-size"],["fontSizeAdjust","font-size-adjust"],["fontStretch","font-stretch"],["fontStyle","font-style"],["fontVariant","font-variant"],["fontWeight","font-weight"],["glyphName","glyph-name"],["glyphOrientationHorizontal","glyph-orientation-horizontal"],["glyphOrientationVertical","glyph-orientation-vertical"],["horizAdvX","horiz-adv-x"],["horizOriginX","horiz-origin-x"],["imageRendering","image-rendering"],["letterSpacing","letter-spacing"],["lightingColor","lighting-color"],["markerEnd","marker-end"],["markerMid","marker-mid"],["markerStart","marker-start"],["maskType","mask-type"],["overlinePosition","overline-position"],["overlineThickness","overline-thickness"],["paintOrder","paint-order"],["panose-1","panose-1"],["pointerEvents","pointer-events"],["renderingIntent","rendering-intent"],["shapeRendering","shape-rendering"],["stopColor","stop-color"],["stopOpacity","stop-opacity"],["strikethroughPosition","strikethrough-position"],["strikethroughThickness","strikethrough-thickness"],["strokeDasharray","stroke-dasharray"],["strokeDashoffset","stroke-dashoffset"],["strokeLinecap","stroke-linecap"],["strokeLinejoin","stroke-linejoin"],["strokeMiterlimit","stroke-miterlimit"],["strokeOpacity","stroke-opacity"],["strokeWidth","stroke-width"],["textAnchor","text-anchor"],["textDecoration","text-decoration"],["textRendering","text-rendering"],["transformOrigin","transform-origin"],["underlinePosition","underline-position"],["underlineThickness","underline-thickness"],["unicodeBidi","unicode-bidi"],["unicodeRange","unicode-range"],["unitsPerEm","units-per-em"],["vAlphabetic","v-alphabetic"],["vHanging","v-hanging"],["vIdeographic","v-ideographic"],["vMathematical","v-mathematical"],["vectorEffect","vector-effect"],["vertAdvY","vert-adv-y"],["vertOriginX","vert-origin-x"],["vertOriginY","vert-origin-y"],["wordSpacing","word-spacing"],["writingMode","writing-mode"],["xmlnsXlink","xmlns:xlink"],["xHeight","x-height"]]),xf=/^[\u0000-\u001F ]*j[\r\n\t]*a[\r\n\t]*v[\r\n\t]*a[\r\n\t]*s[\r\n\t]*c[\r\n\t]*r[\r\n\t]*i[\r\n\t]*p[\r\n\t]*t[\r\n\t]*:/i;function Br(t){return xf.test(""+t)?"javascript:throw new Error('React has blocked a javascript: URL as a security precaution.')":t}function qi(){}var ba=null;function Sf(t){return t=t.target||t.srcElement||window,t.correspondingUseElement&&(t=t.correspondingUseElement),t.nodeType===3?t.parentNode:t}var Fr=null,Hr=null;function Wm(t){var n=Se(t);if(n&&(t=n.stateNode)){var a=t[H]||null;t:switch(t=n.stateNode,n.type){case"input":if(Sn(t,a.value,a.defaultValue,a.defaultValue,a.checked,a.defaultChecked,a.type,a.name),n=a.name,a.type==="radio"&&n!=null){for(a=t;a.parentNode;)a=a.parentNode;for(a=a.querySelectorAll('input[name="'+Ge(""+n)+'"][type="radio"]'),n=0;n<a.length;n++){var r=a[n];if(r!==t&&r.form===t.form){var c=r[H]||null;if(!c)throw Error(s(90));Sn(r,c.value,c.defaultValue,c.defaultValue,c.checked,c.defaultChecked,c.type,c.name)}}for(n=0;n<a.length;n++)r=a[n],r.form===t.form&&oa(r)}break t;case"textarea":jn(t,a.value,a.defaultValue);break t;case"select":n=a.value,n!=null&&wn(t,!!a.multiple,n,!1)}}}var yf=!1;function Ym(t,n,a){if(yf)return t(n,a);yf=!0;try{var r=t(n);return r}finally{if(yf=!1,(Fr!==null||Hr!==null)&&(ru(),Fr&&(n=Fr,t=Hr,Hr=Fr=null,Wm(n),t)))for(n=0;n<t.length;n++)Wm(t[n])}}function qo(t,n){var a=t.stateNode;if(a===null)return null;var r=a[H]||null;if(r===null)return null;a=r[n];t:switch(n){case"onClick":case"onClickCapture":case"onDoubleClick":case"onDoubleClickCapture":case"onMouseDown":case"onMouseDownCapture":case"onMouseMove":case"onMouseMoveCapture":case"onMouseUp":case"onMouseUpCapture":case"onMouseEnter":(r=!r.disabled)||(t=t.type,r=!(t==="button"||t==="input"||t==="select"||t==="textarea")),t=!r;break t;default:t=!1}if(t)return null;if(a&&typeof a!="function")throw Error(s(231,n,typeof a));return a}var Za=!(typeof window>"u"||typeof window.document>"u"||typeof window.document.createElement>"u"),Mf=!1;if(Za)try{var jo={};Object.defineProperty(jo,"passive",{get:function(){Mf=!0}}),window.addEventListener("test",jo,jo),window.removeEventListener("test",jo,jo)}catch{Mf=!1}var Ms=null,Ef=null,oc=null;function qm(){if(oc)return oc;var t,n=Ef,a=n.length,r,c="value"in Ms?Ms.value:Ms.textContent,u=c.length;for(t=0;t<a&&n[t]===c[t];t++);var _=a-t;for(r=1;r<=_&&n[a-r]===c[u-r];r++);return oc=c.slice(t,1<r?1-r:void 0)}function lc(t){var n=t.keyCode;return"charCode"in t?(t=t.charCode,t===0&&n===13&&(t=13)):t=n,t===10&&(t=13),32<=t||t===13?t:0}function cc(){return!0}function jm(){return!1}function li(t){function n(a,r,c,u,_){this._reactName=a,this._targetInst=c,this.type=r,this.nativeEvent=u,this.target=_,this.currentTarget=null;for(var w in t)t.hasOwnProperty(w)&&(a=t[w],this[w]=a?a(u):u[w]);return this.isDefaultPrevented=(u.defaultPrevented!=null?u.defaultPrevented:u.returnValue===!1)?cc:jm,this.isPropagationStopped=jm,this}return I(n.prototype,{preventDefault:function(){this.defaultPrevented=!0;var a=this.nativeEvent;a&&(a.preventDefault?a.preventDefault():typeof a.returnValue!="unknown"&&(a.returnValue=!1),this.isDefaultPrevented=cc)},stopPropagation:function(){var a=this.nativeEvent;a&&(a.stopPropagation?a.stopPropagation():typeof a.cancelBubble!="unknown"&&(a.cancelBubble=!0),this.isPropagationStopped=cc)},persist:function(){},isPersistent:cc}),n}var Es={eventPhase:0,bubbles:0,cancelable:0,timeStamp:function(t){return t.timeStamp||Date.now()},defaultPrevented:0,isTrusted:0},uc=li(Es),Zo=I({},Es,{view:0,detail:0}),ty=li(Zo),bf,Tf,Ko,fc=I({},Zo,{screenX:0,screenY:0,clientX:0,clientY:0,pageX:0,pageY:0,ctrlKey:0,shiftKey:0,altKey:0,metaKey:0,getModifierState:Rf,button:0,buttons:0,relatedTarget:function(t){return t.relatedTarget===void 0?t.fromElement===t.srcElement?t.toElement:t.fromElement:t.relatedTarget},movementX:function(t){return"movementX"in t?t.movementX:(t!==Ko&&(Ko&&t.type==="mousemove"?(bf=t.screenX-Ko.screenX,Tf=t.screenY-Ko.screenY):Tf=bf=0,Ko=t),bf)},movementY:function(t){return"movementY"in t?t.movementY:Tf}}),Zm=li(fc),ey=I({},fc,{dataTransfer:0}),ny=li(ey),iy=I({},Zo,{relatedTarget:0}),Af=li(iy),ay=I({},Es,{animationName:0,elapsedTime:0,pseudoElement:0}),sy=li(ay),ry=I({},Es,{clipboardData:function(t){return"clipboardData"in t?t.clipboardData:window.clipboardData}}),oy=li(ry),ly=I({},Es,{data:0}),Km=li(ly),cy={Esc:"Escape",Spacebar:" ",Left:"ArrowLeft",Up:"ArrowUp",Right:"ArrowRight",Down:"ArrowDown",Del:"Delete",Win:"OS",Menu:"ContextMenu",Apps:"ContextMenu",Scroll:"ScrollLock",MozPrintableKey:"Unidentified"},uy={8:"Backspace",9:"Tab",12:"Clear",13:"Enter",16:"Shift",17:"Control",18:"Alt",19:"Pause",20:"CapsLock",27:"Escape",32:" ",33:"PageUp",34:"PageDown",35:"End",36:"Home",37:"ArrowLeft",38:"ArrowUp",39:"ArrowRight",40:"ArrowDown",45:"Insert",46:"Delete",112:"F1",113:"F2",114:"F3",115:"F4",116:"F5",117:"F6",118:"F7",119:"F8",120:"F9",121:"F10",122:"F11",123:"F12",144:"NumLock",145:"ScrollLock",224:"Meta"},fy={Alt:"altKey",Control:"ctrlKey",Meta:"metaKey",Shift:"shiftKey"};function hy(t){var n=this.nativeEvent;return n.getModifierState?n.getModifierState(t):(t=fy[t])?!!n[t]:!1}function Rf(){return hy}var dy=I({},Zo,{key:function(t){if(t.key){var n=cy[t.key]||t.key;if(n!=="Unidentified")return n}return t.type==="keypress"?(t=lc(t),t===13?"Enter":String.fromCharCode(t)):t.type==="keydown"||t.type==="keyup"?uy[t.keyCode]||"Unidentified":""},code:0,location:0,ctrlKey:0,shiftKey:0,altKey:0,metaKey:0,repeat:0,locale:0,getModifierState:Rf,charCode:function(t){return t.type==="keypress"?lc(t):0},keyCode:function(t){return t.type==="keydown"||t.type==="keyup"?t.keyCode:0},which:function(t){return t.type==="keypress"?lc(t):t.type==="keydown"||t.type==="keyup"?t.keyCode:0}}),py=li(dy),my=I({},fc,{pointerId:0,width:0,height:0,pressure:0,tangentialPressure:0,tiltX:0,tiltY:0,twist:0,pointerType:0,isPrimary:0}),Qm=li(my),gy=I({},Es,{submitter:0}),_y=li(gy),vy=I({},Zo,{touches:0,targetTouches:0,changedTouches:0,altKey:0,metaKey:0,ctrlKey:0,shiftKey:0,getModifierState:Rf}),xy=li(vy),Sy=I({},Es,{propertyName:0,elapsedTime:0,pseudoElement:0}),yy=li(Sy),My=I({},fc,{deltaX:function(t){return"deltaX"in t?t.deltaX:"wheelDeltaX"in t?-t.wheelDeltaX:0},deltaY:function(t){return"deltaY"in t?t.deltaY:"wheelDeltaY"in t?-t.wheelDeltaY:"wheelDelta"in t?-t.wheelDelta:0},deltaZ:0,deltaMode:0}),Ey=li(My),by=I({},Es,{newState:0,oldState:0,source:0}),Ty=li(by),Ay=[9,13,27,32],wf=Za&&"CompositionEvent"in window,Qo=null;Za&&"documentMode"in document&&(Qo=document.documentMode);var Ry=Za&&"TextEvent"in window&&!Qo,Jm=Za&&(!wf||Qo&&8<Qo&&11>=Qo),$m=" ",t0=!1;function e0(t,n){switch(t){case"keyup":return Ay.indexOf(n.keyCode)!==-1;case"keydown":return n.keyCode!==229;case"keypress":case"mousedown":case"focusout":return!0;default:return!1}}function n0(t){return t=t.detail,typeof t=="object"&&"data"in t?t.data:null}var Gr=!1;function wy(t,n){switch(t){case"compositionend":return n0(n);case"keypress":return n.which!==32?null:(t0=!0,$m);case"textInput":return t=n.data,t===$m&&t0?null:t;default:return null}}function Cy(t,n){if(Gr)return t==="compositionend"||!wf&&e0(t,n)?(t=qm(),oc=Ef=Ms=null,Gr=!1,t):null;switch(t){case"paste":return null;case"keypress":if(!(n.ctrlKey||n.altKey||n.metaKey)||n.ctrlKey&&n.altKey){if(n.char&&1<n.char.length)return n.char;if(n.which)return String.fromCharCode(n.which)}return null;case"compositionend":return Jm&&n.locale!=="ko"?null:n.data;default:return null}}var Ny={color:!0,date:!0,datetime:!0,"datetime-local":!0,email:!0,month:!0,number:!0,password:!0,range:!0,search:!0,tel:!0,text:!0,time:!0,url:!0,week:!0};function i0(t){var n=t&&t.nodeName&&t.nodeName.toLowerCase();return n==="input"?!!Ny[t.type]:n==="textarea"}function a0(t,n,a,r){Fr?Hr?Hr.push(r):Hr=[r]:Fr=r,n=hu(n,"onChange"),0<n.length&&(a=new uc("onChange","change",null,a,r),t.push({event:a,listeners:n}))}var Jo=null,$o=null;function Dy(t){W_(t,0)}function hc(t){var n=Jt(t);if(oa(n))return t}function s0(t,n){if(t==="change")return n}var r0=!1;if(Za){var Cf;if(Za){var Nf="oninput"in document;if(!Nf){var o0=document.createElement("div");o0.setAttribute("oninput","return;"),Nf=typeof o0.oninput=="function"}Cf=Nf}else Cf=!1;r0=Cf&&(!document.documentMode||9<document.documentMode)}function l0(){Jo&&(Jo.detachEvent("onpropertychange",c0),$o=Jo=null)}function c0(t){if(t.propertyName==="value"&&hc($o)){var n=[];a0(n,$o,t,Sf(t)),Ym(Dy,n)}}function Uy(t,n,a){t==="focusin"?(l0(),Jo=n,$o=a,Jo.attachEvent("onpropertychange",c0)):t==="focusout"&&l0()}function Ly(t){if(t==="selectionchange"||t==="keyup"||t==="keydown")return hc($o)}function Oy(t,n){if(t==="click")return hc(n)}function Py(t,n){if(t==="input"||t==="change")return hc(n)}function Iy(t,n){return t===n&&(t!==0||1/t===1/n)||t!==t&&n!==n}var Ni=typeof Object.is=="function"?Object.is:Iy;function tl(t,n){if(Ni(t,n))return!0;if(typeof t!="object"||t===null||typeof n!="object"||n===null)return!1;var a=Object.keys(t),r=Object.keys(n);if(a.length!==r.length)return!1;for(r=0;r<a.length;r++){var c=a[r];if(!St.call(n,c)||!Ni(t[c],n[c]))return!1}return!0}function Df(t){if(t=t||(typeof document<"u"?document:void 0),typeof t>"u")return null;try{return t.activeElement||t.body}catch{return t.body}}function u0(t){for(;t&&t.firstChild;)t=t.firstChild;return t}function f0(t,n){var a=u0(t);t=0;for(var r;a;){if(a.nodeType===3){if(r=t+a.textContent.length,t<=n&&r>=n)return{node:a,offset:n-t};t=r}t:{for(;a;){if(a.nextSibling){a=a.nextSibling;break t}a=a.parentNode}a=void 0}a=u0(a)}}function h0(t,n){return t&&n?t===n?!0:t&&t.nodeType===3?!1:n&&n.nodeType===3?h0(t,n.parentNode):"contains"in t?t.contains(n):t.compareDocumentPosition?!!(t.compareDocumentPosition(n)&16):!1:!1}function d0(t){t=t!=null&&t.ownerDocument!=null&&t.ownerDocument.defaultView!=null?t.ownerDocument.defaultView:window;for(var n=Df(t.document);n instanceof t.HTMLIFrameElement;){try{var a=typeof n.contentWindow.location.href=="string"}catch{a=!1}if(a)t=n.contentWindow;else break;n=Df(t.document)}return n}function Uf(t){var n=t&&t.nodeName&&t.nodeName.toLowerCase();return n&&(n==="input"&&(t.type==="text"||t.type==="search"||t.type==="tel"||t.type==="url"||t.type==="password")||n==="textarea"||t.contentEditable==="true")}var zy=Za&&"documentMode"in document&&11>=document.documentMode,Vr=null,Lf=null,el=null,Of=!1;function p0(t,n,a){var r=a.window===a?a.document:a.nodeType===9?a:a.ownerDocument;Of||Vr==null||Vr!==Df(r)||(r=Vr,"selectionStart"in r&&Uf(r)?r={start:r.selectionStart,end:r.selectionEnd}:(r=(r.ownerDocument&&r.ownerDocument.defaultView||window).getSelection(),r={anchorNode:r.anchorNode,anchorOffset:r.anchorOffset,focusNode:r.focusNode,focusOffset:r.focusOffset}),el&&tl(el,r)||(el=r,r=hu(Lf,"onSelect"),0<r.length&&(n=new uc("onSelect","select",null,n,a),t.push({event:n,listeners:r}),n.target=Vr)))}function rr(t,n){var a={};return a[t.toLowerCase()]=n.toLowerCase(),a["Webkit"+t]="webkit"+n,a["Moz"+t]="moz"+n,a}var kr={animationend:rr("Animation","AnimationEnd"),animationiteration:rr("Animation","AnimationIteration"),animationstart:rr("Animation","AnimationStart"),transitionrun:rr("Transition","TransitionRun"),transitionstart:rr("Transition","TransitionStart"),transitioncancel:rr("Transition","TransitionCancel"),transitionend:rr("Transition","TransitionEnd")},Pf={},m0={};Za&&(m0=document.createElement("div").style,"AnimationEvent"in window||(delete kr.animationend.animation,delete kr.animationiteration.animation,delete kr.animationstart.animation),"TransitionEvent"in window||delete kr.transitionend.transition);function or(t){if(Pf[t])return Pf[t];if(!kr[t])return t;var n=kr[t],a;for(a in n)if(n.hasOwnProperty(a)&&a in m0)return Pf[t]=n[a];return t}var g0=or("animationend"),_0=or("animationiteration"),v0=or("animationstart"),By=or("transitionrun"),Fy=or("transitionstart"),Hy=or("transitioncancel"),x0=or("transitionend"),S0=new Map,If="abort auxClick beforeToggle cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error fullscreenChange fullscreenError gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel".split(" ");If.push("scrollEnd");function la(t,n){S0.set(t,n),qt(n,[t])}var Gy=0;function Ka(t,n){if(t.name!=null&&t.name!=="auto")return t.name;if(n.autoName!==null)return n.autoName;t=ha.identifierPrefix;var a=Gy++;return t="_"+t+"t_"+a.toString(32)+"_",n.autoName=t}function y0(t){if(t==null||typeof t=="string")return t;var n=null,a=co;if(a!==null)for(var r=0;r<a.length;r++){var c=t[a[r]];if(c!=null){if(c==="none")return"none";n=n==null?c:n+(" "+c)}}return n??t.default}function Qa(t,n){return t=y0(t),n=y0(n),n==null?t==="auto"?null:t:n==="auto"?null:n}var dc=typeof reportError=="function"?reportError:function(t){if(typeof window=="object"&&typeof window.ErrorEvent=="function"){var n=new window.ErrorEvent("error",{bubbles:!0,cancelable:!0,message:typeof t=="object"&&t!==null&&typeof t.message=="string"?String(t.message):String(t),error:t});if(!window.dispatchEvent(n))return}else if(typeof process=="object"&&typeof process.emit=="function"){process.emit("uncaughtException",t);return}console.error(t)},ji=[],Xr=0,zf=0;function pc(){for(var t=Xr,n=zf=Xr=0;n<t;){var a=ji[n];ji[n++]=null;var r=ji[n];ji[n++]=null;var c=ji[n];ji[n++]=null;var u=ji[n];if(ji[n++]=null,r!==null&&c!==null){var _=r.pending;_===null?c.next=c:(c.next=_.next,_.next=c),r.pending=c}u!==0&&M0(a,c,u)}}function mc(t,n,a,r){ji[Xr++]=t,ji[Xr++]=n,ji[Xr++]=a,ji[Xr++]=r,zf|=r,t.lanes|=r,t=t.alternate,t!==null&&(t.lanes|=r)}function Bf(t,n,a,r){return mc(t,n,a,r),gc(t)}function lr(t,n){return mc(t,null,null,n),gc(t)}function M0(t,n,a){t.lanes|=a;var r=t.alternate;r!==null&&(r.lanes|=a);for(var c=!1,u=t.return;u!==null;)u.childLanes|=a,r=u.alternate,r!==null&&(r.childLanes|=a),u.tag===22&&(t=u.stateNode,t===null||t._visibility&1||(c=!0)),t=u,u=u.return;return t.tag===3?(u=t.stateNode,c&&n!==null&&(c=31-xe(a),t=u.hiddenUpdates,r=t[c],r===null?t[c]=[n]:r.push(n),n.lane=a|536870912),u):null}function gc(t){if(50<El)throw El=0,su=null,Error(s(185));for(var n=t.return;n!==null;)t=n,n=t.return;return t.tag===3?t.stateNode:null}var Wr={};function Vy(t,n,a,r){this.tag=t,this.key=a,this.sibling=this.child=this.return=this.stateNode=this.type=this.elementType=null,this.index=0,this.refCleanup=this.ref=null,this.pendingProps=n,this.dependencies=this.memoizedState=this.updateQueue=this.memoizedProps=null,this.mode=r,this.subtreeFlags=this.flags=0,this.deletions=null,this.childLanes=this.lanes=0,this.alternate=null}function gi(t,n,a,r){return new Vy(t,n,a,r)}function Ff(t){return t=t.prototype,!(!t||!t.isReactComponent)}function Ja(t,n){var a=t.alternate;return a===null?(a=gi(t.tag,n,t.key,t.mode),a.elementType=t.elementType,a.type=t.type,a.stateNode=t.stateNode,a.alternate=t,t.alternate=a):(a.pendingProps=n,a.type=t.type,a.flags=0,a.subtreeFlags=0,a.deletions=null),a.flags=t.flags&1206910976,a.childLanes=t.childLanes,a.lanes=t.lanes,a.child=t.child,a.memoizedProps=t.memoizedProps,a.memoizedState=t.memoizedState,a.updateQueue=t.updateQueue,n=t.dependencies,a.dependencies=n===null?null:{lanes:n.lanes,firstContext:n.firstContext},a.sibling=t.sibling,a.index=t.index,a.ref=t.ref,a.refCleanup=t.refCleanup,a}function E0(t,n){t.flags&=1206910978;var a=t.alternate;return a===null?(t.childLanes=0,t.lanes=n,t.child=null,t.subtreeFlags=0,t.memoizedProps=null,t.memoizedState=null,t.updateQueue=null,t.dependencies=null,t.stateNode=null):(t.childLanes=a.childLanes,t.lanes=a.lanes,t.child=a.child,t.subtreeFlags=0,t.deletions=null,t.memoizedProps=a.memoizedProps,t.memoizedState=a.memoizedState,t.updateQueue=a.updateQueue,t.type=a.type,n=a.dependencies,t.dependencies=n===null?null:{lanes:n.lanes,firstContext:n.firstContext}),t}function _c(t,n,a,r,c,u){var _=0;if(r=t,typeof r=="function")Ff(r)&&(_=1);else if(typeof r=="string")_=gE(t,a,Ke.current)?26:t==="html"||t==="head"||t==="body"?27:5;else t:switch(r){case vt:return t=gi(31,a,n,c),t.elementType=vt,t.lanes=u,t;case Y:return cr(a.children,c,u,n);case J:_=8,c|=24;break;case rt:return t=gi(12,a,n,c|2),t.elementType=rt,t.lanes=u,t;case Z:return t=gi(13,a,n,c),t.elementType=Z,t.lanes=u,t;case ht:return t=gi(19,a,n,c),t.elementType=ht,t.lanes=u,t;case ie:case B:return t=c|32,t=gi(30,a,n,t),t.elementType=B,t.lanes=u,t.stateNode={autoName:null,paired:null,clones:null,ref:null},t;default:if(typeof r=="object"&&r!==null)switch(r.$$typeof){case et:_=10;break t;case j:_=9;break t;case q:_=11;break t;case ct:_=14;break t;case gt:_=16,r=null;break t}_=29,a=Error(s(130,t===null?"null":typeof t,"")),r=null}return n=gi(_,a,n,c),n.elementType=t,n.type=r,n.lanes=u,n}function cr(t,n,a,r){return t=gi(7,t,r,n),t.lanes=a,t}function Hf(t,n,a){return t=gi(6,t,null,n),t.lanes=a,t}function b0(t){var n=gi(18,null,null,0);return n.stateNode=t,n}function Gf(t,n,a){return n=gi(4,t.children!==null?t.children:[],t.key,n),n.lanes=a,n.stateNode={containerInfo:t.containerInfo,pendingChildren:null,implementation:t.implementation},n}var T0=new WeakMap;function Zi(t,n){if(typeof t=="object"&&t!==null){var a=T0.get(t);return a!==void 0?a:(n={value:t,source:n,stack:pt(n)},T0.set(t,n),n)}return{value:t,source:n,stack:pt(n)}}var Yr=[],qr=0,vc=null,nl=0,Ki=[],Qi=0,bs=null,Ta=1,Aa="";function $a(t,n){Yr[qr++]=nl,Yr[qr++]=vc,vc=t,nl=n}function A0(t,n,a){Ki[Qi++]=Ta,Ki[Qi++]=Aa,Ki[Qi++]=bs,bs=t;var r=Ta;t=Aa;var c=32-xe(r)-1;r&=~(1<<c),a+=1;var u=32-xe(n)+c;if(30<u){var _=c-c%5;u=(r&(1<<_)-1).toString(32),r>>=_,c-=_,Ta=1<<32-xe(n)+c|a<<c|r,Aa=u+t}else Ta=1<<u|a<<c|r,Aa=t}function xc(t){t.return!==null&&($a(t,1),A0(t,1,0))}function Vf(t){for(;t===vc;)vc=Yr[--qr],Yr[qr]=null,nl=Yr[--qr],Yr[qr]=null;for(;t===bs;)bs=Ki[--Qi],Ki[Qi]=null,Aa=Ki[--Qi],Ki[Qi]=null,Ta=Ki[--Qi],Ki[Qi]=null}function R0(t,n){Ki[Qi++]=Ta,Ki[Qi++]=Aa,Ki[Qi++]=bs,Ta=n.id,Aa=n.overflow,bs=t}var kn=null,fn=null,Oe=!1,Ts=null,Ji=!1,kf=Error(s(519));function As(t){var n=Error(s(418,1<arguments.length&&arguments[1]!==void 0&&arguments[1]?"text":"HTML",""));throw il(Zi(n,t)),kf}function w0(t){var n=t.stateNode,a=t.type,r=t.memoizedProps;switch(n[R]=t,n[H]=r,a){case"dialog":Fe("cancel",n),Fe("close",n);break;case"iframe":case"object":case"embed":Fe("load",n);break;case"video":case"audio":for(a=0;a<Tl.length;a++)Fe(Tl[a],n);break;case"source":Fe("error",n);break;case"img":case"image":case"link":Fe("error",n),Fe("load",n);break;case"details":Fe("toggle",n);break;case"input":Fe("invalid",n),Ci(n,r.value,r.defaultValue,r.checked,r.defaultChecked,r.type,r.name,!0);break;case"select":Fe("invalid",n);break;case"textarea":Fe("invalid",n),qa(n,r.value,r.defaultValue,r.children)}a=r.children,typeof a!="string"&&typeof a!="number"&&typeof a!="bigint"||n.textContent===""+a||r.suppressHydrationWarning===!0||Z_(n.textContent,a)?(r.popover!=null&&(Fe("beforetoggle",n),Fe("toggle",n)),r.onScroll!=null&&Fe("scroll",n),r.onScrollEnd!=null&&Fe("scrollend",n),r.onClick!=null&&(n.onclick=qi),n=!0):n=!1,n||As(t,!0)}function Sc(t){for(kn=t.return;kn;)switch(kn.tag){case 5:case 31:case 13:Ji=!1;return;case 27:case 3:Ji=!0;return;default:kn=kn.return}}function jr(t){if(t!==kn)return!1;if(!Oe)return Sc(t),Oe=!0,!1;var n=t.tag,a;if((a=n!==3&&n!==27)&&((a=n===5)&&(a=t.type,a=!(a!=="form"&&a!=="button")||xd(t.type,t.memoizedProps)),a=!a),a&&fn&&As(t),Sc(t),n===13){if(t=t.memoizedState,t=t!==null?t.dehydrated:null,!t)throw Error(s(317));fn=pv(t)}else if(n===31){if(t=t.memoizedState,t=t!==null?t.dehydrated:null,!t)throw Error(s(317));fn=pv(t)}else n===27?(n=fn,Vs(t.type)?(t=wd,wd=null,fn=t):fn=n):fn=kn?ta(t.stateNode.nextSibling):null;return!0}function ur(){fn=kn=null,Oe=!1}function Xf(){var t=Ts;return t!==null&&(xi===null?xi=t:xi.push.apply(xi,t),Ts=null),t}function il(t){Ts===null?Ts=[t]:Ts.push(t)}var Wf=Ce(null),fr=null,ts=null;function Rs(t,n,a){fe(Wf,n._currentValue),n._currentValue=a}function es(t){t._currentValue=Wf.current,ce(Wf)}function yc(t,n,a){for(;t!==null;){var r=t.alternate;if((t.childLanes&n)!==n?(t.childLanes|=n,r!==null&&(r.childLanes|=n)):r!==null&&(r.childLanes&n)!==n&&(r.childLanes|=n),t===a)break;t=t.return}}function Yf(t,n,a,r){var c=t.child;for(c!==null&&(c.return=t);c!==null;){var u=c.dependencies;if(u!==null){var _=c.child;u=u.firstContext;t:for(;u!==null;){var w=u;u=c;for(var z=0;z<n.length;z++)if(w.context===n[z]){u.lanes|=a,w=u.alternate,w!==null&&(w.lanes|=a),yc(u.return,a,t),r||(_=null);break t}u=w.next}}else if(c.tag===18){if(_=c.return,_===null)throw Error(s(341));_.lanes|=a,u=_.alternate,u!==null&&(u.lanes|=a),yc(_,a,t),_=null}else c.tag===13&&c.memoizedState!==null&&c.memoizedState.dehydrated===null?(c.lanes|=a,_=c.alternate,_!==null&&(_.lanes|=a),yc(c.return,a,t),_=c.child,_=_!==null?_.sibling:null):_=c.child;if(_!==null)_.return=c;else for(_=c;_!==null;){if(_===t){_=null;break}if(c=_.sibling,c!==null){c.return=_.return,_=c;break}_=_.return}c=_}}function hr(t,n,a,r){t=null;for(var c=n,u=!1;c!==null;){if(!u){if((c.flags&524288)!==0)u=!0;else if((c.flags&262144)!==0)break}if(c.tag===10){var _=c.alternate;if(_===null)throw Error(s(387));if(_=_.memoizedProps,_!==null){var w=c.type;Ni(c.pendingProps.value,_.value)||(t!==null?t.push(w):t=[w])}}else if(c===on.current){if(_=c.alternate,_===null)throw Error(s(387));_.memoizedState.memoizedState!==c.memoizedState.memoizedState&&(t!==null?t.push(So):t=[So])}c=c.return}return t!==null&&Yf(n,t,a,r),n.flags|=262144,t!==null}function Mc(t){for(t=t.firstContext;t!==null;){if(!Ni(t.context._currentValue,t.memoizedValue))return!0;t=t.next}return!1}function dr(t){fr=t,ts=null,t=t.dependencies,t!==null&&(t.firstContext=null)}function Zn(t){return C0(fr,t)}function Ec(t,n){return fr===null&&dr(t),C0(t,n)}function C0(t,n){var a=n._currentValue;if(n={context:n,memoizedValue:a,next:null},ts===null){if(t===null)throw Error(s(308));ts=n,t.dependencies={lanes:0,firstContext:n},t.flags|=524288}else ts=ts.next=n;return a}var ky=typeof AbortController<"u"?AbortController:function(){var t=[],n=this.signal={aborted:!1,addEventListener:function(a,r){t.push(r)}};this.abort=function(){n.aborted=!0,t.forEach(function(a){return a()})}},Xy=o.unstable_scheduleCallback,Wy=o.unstable_NormalPriority,Cn={$$typeof:et,Consumer:null,Provider:null,_currentValue:null,_currentValue2:null,_threadCount:0};function qf(){return{controller:new ky,data:new Map,refCount:0}}function al(t){t.refCount--,t.refCount===0&&Xy(Wy,function(){t.controller.abort()})}function N0(t,n){if((t.pendingLanes&4194048)!==0){var a=t.transitionTypes;for(a===null&&(a=t.transitionTypes=[]),t=0;t<n.length;t++){var r=n[t];a.indexOf(r)===-1&&a.push(r)}}}var sl=null;function Yy(t){var n=t.transitionTypes;return t.transitionTypes=null,n}var rl=null,jf=0,pr=0,Zr=null;function qy(t,n){if(rl===null){var a=rl=[];jf=0,pr=ud(),Zr={status:"pending",value:void 0,then:function(r){a.push(r)}}}return jf++,n.then(D0,D0),n}function D0(){if(--jf===0&&(sl=null,rl!==null)){Zr!==null&&(Zr.status="fulfilled");var t=rl;rl=null,pr=0,Zr=null;for(var n=0;n<t.length;n++)(0,t[n])()}}function jy(t,n){var a=[],r={status:"pending",value:null,reason:null,then:function(c){a.push(c)}};return t.then(function(){r.status="fulfilled",r.value=n;for(var c=0;c<a.length;c++)(0,a[c])(n)},function(c){for(r.status="rejected",r.reason=c,c=0;c<a.length;c++)(0,a[c])(void 0)}),r}var U0=Mt.S;Mt.S=function(t,n){if(b_=Kt(),typeof n=="object"&&n!==null&&typeof n.then=="function"&&qy(t,n),sl!==null)for(var a=po;a!==null;)N0(a,sl),a=a.next;if(a=t.types,a!==null){for(var r=po;r!==null;)N0(r,a),r=r.next;if(pr!==0){r=sl,r===null&&(r=sl=[]);for(var c=0;c<a.length;c++){var u=a[c];r.indexOf(u)===-1&&r.push(u)}}}U0!==null&&U0(t,n)};var mr=Ce(null);function Zf(){var t=mr.current;return t!==null?t:cn.pooledCache}function bc(t,n){n===null?fe(mr,mr.current):fe(mr,n.pool)}function L0(){var t=Zf();return t===null?null:{parent:Cn._currentValue,pool:t}}var Kr=Error(s(460)),Kf=Error(s(474)),Tc=Error(s(542)),Ac={then:function(){}};function O0(t){return t=t.status,t==="fulfilled"||t==="rejected"}function P0(t,n,a){switch(a=t[a],a===void 0?t.push(n):a!==n&&(n.then(qi,qi),n=a),n.status){case"fulfilled":return n.value;case"rejected":throw t=n.reason,z0(t),t===void 0&&!("reason"in n)?Error(s(600)):t;default:if(typeof n.status=="string")n.then(qi,qi);else{if(t=cn,t!==null&&100<t.shellSuspendCounter)throw Error(s(482));t=n,t.status="pending",t.then(function(r){if(n.status==="pending"){var c=n;c.status="fulfilled",c.value=r}},function(r){if(n.status==="pending"){var c=n;c.status="rejected",c.reason=r}})}switch(n.status){case"fulfilled":return n.value;case"rejected":throw t=n.reason,z0(t),t}throw _r=n,Kr}}function gr(t){try{var n=t._init;return n(t._payload)}catch(a){throw a!==null&&typeof a=="object"&&typeof a.then=="function"?(_r=a,Kr):a}}var _r=null;function I0(){if(_r===null)throw Error(s(459));var t=_r;return _r=null,t}function z0(t){if(t===Kr||t===Tc)throw Error(s(483))}var Qr=null,ol=0;function Rc(t){var n=ol;return ol+=1,Qr===null&&(Qr=[]),P0(Qr,t,n)}function ws(t,n){n=n.props.ref,t.ref=n!==void 0?n:null}function wc(t,n){throw n.$$typeof===T?Error(s(525)):(t=Object.prototype.toString.call(n),Error(s(31,t==="[object Object]"?"object with keys {"+Object.keys(n).join(", ")+"}":t)))}function B0(t){function n($,G){if(t){var it=$.deletions;it===null?($.deletions=[G],$.flags|=16):it.push(G)}}function a($,G){if(!t)return null;for(;G!==null;)n($,G),G=G.sibling;return null}function r($){for(var G=new Map;$!==null;)$.key===null?G.set($.index,$):G.set($.key,$),$=$.sibling;return G}function c($,G){return $=Ja($,G),$.index=0,$.sibling=null,$}function u($,G,it){return $.index=it,t?(it=$.alternate,it!==null?(it=it.index,it<G?($.flags|=2,G):it):($.flags|=134217730,G)):($.flags|=1048576,G)}function _($){return t&&$.alternate===null&&($.flags|=134217730),$}function w($,G,it,bt){return G===null||G.tag!==6?(G=Hf(it,$.mode,bt),G.return=$,G):(G=c(G,it),G.return=$,G)}function z($,G,it,bt){var te=it.type;return te===Y?($=ft($,G,it.props.children,bt,it.key),ws($,it),$):G!==null&&(G.elementType===te||typeof te=="object"&&te!==null&&te.$$typeof===gt&&gr(te)===G.type)?(G=c(G,it.props),ws(G,it),G.return=$,G):(G=_c(it.type,it.key,it.props,null,$.mode,bt),ws(G,it),G.return=$,G)}function tt($,G,it,bt){return G===null||G.tag!==4||G.stateNode.containerInfo!==it.containerInfo||G.stateNode.implementation!==it.implementation?(G=Gf(it,$.mode,bt),G.return=$,G):(G=c(G,it.children||[]),G.return=$,G)}function ft($,G,it,bt,te){return G===null||G.tag!==7?(G=cr(it,$.mode,bt,te),G.return=$,G):(G=c(G,it),G.return=$,G)}function Tt($,G,it){if(typeof G=="string"&&G!==""||typeof G=="number"||typeof G=="bigint")return G=Hf(""+G,$.mode,it),G.return=$,G;if(typeof G=="object"&&G!==null){switch(G.$$typeof){case O:return it=_c(G.type,G.key,G.props,null,$.mode,it),ws(it,G),it.return=$,it;case V:return G=Gf(G,$.mode,it),G.return=$,G;case gt:return G=gr(G),Tt($,G,it)}if(Wt(G)||Q(G))return G=cr(G,$.mode,it,null),G.return=$,G;if(typeof G.then=="function")return Tt($,Rc(G),it);if(G.$$typeof===et)return Tt($,Ec($,G),it);wc($,G)}return null}function K($,G,it,bt){var te=G!==null?G.key:null;if(typeof it=="string"&&it!==""||typeof it=="number"||typeof it=="bigint")return te!==null?null:w($,G,""+it,bt);if(typeof it=="object"&&it!==null){switch(it.$$typeof){case O:return it.key===te?z($,G,it,bt):null;case V:return it.key===te?tt($,G,it,bt):null;case gt:return it=gr(it),K($,G,it,bt)}if(Wt(it)||Q(it))return te!==null?null:ft($,G,it,bt,null);if(typeof it.then=="function")return K($,G,Rc(it),bt);if(it.$$typeof===et)return K($,G,Ec($,it),bt);wc($,it)}return null}function lt($,G,it,bt,te){if(typeof bt=="string"&&bt!==""||typeof bt=="number"||typeof bt=="bigint")return $=$.get(it)||null,w(G,$,""+bt,te);if(typeof bt=="object"&&bt!==null){switch(bt.$$typeof){case O:return $=$.get(bt.key===null?it:bt.key)||null,z(G,$,bt,te);case V:return $=$.get(bt.key===null?it:bt.key)||null,tt(G,$,bt,te);case gt:return bt=gr(bt),lt($,G,it,bt,te)}if(Wt(bt)||Q(bt))return $=$.get(it)||null,ft(G,$,bt,te,null);if(typeof bt.then=="function")return lt($,G,it,Rc(bt),te);if(bt.$$typeof===et)return lt($,G,it,Ec(G,bt),te);wc(G,bt)}return null}function Xt($,G,it,bt){for(var te=null,ke=null,ue=G,me=G=0,Un=null;ue!==null&&me<it.length;me++){ue.index>me?(Un=ue,ue=null):Un=ue.sibling;var qe=K($,ue,it[me],bt);if(qe===null){ue===null&&(ue=Un);break}t&&ue&&qe.alternate===null&&n($,ue),G=u(qe,G,me),ke===null?te=qe:ke.sibling=qe,ke=qe,ue=Un}if(me===it.length)return a($,ue),Oe&&$a($,me),te;if(ue===null){for(;me<it.length;me++)ue=Tt($,it[me],bt),ue!==null&&(G=u(ue,G,me),ke===null?te=ue:ke.sibling=ue,ke=ue);return Oe&&$a($,me),te}for(ue=r(ue);me<it.length;me++)Un=lt(ue,$,me,it[me],bt),Un!==null&&(t&&(qe=Un.alternate,qe!==null&&ue.delete(qe.key===null?me:qe.key)),G=u(Un,G,me),ke===null?te=Un:ke.sibling=Un,ke=Un);return t&&ue.forEach(function(qs){return n($,qs)}),Oe&&$a($,me),te}function oe($,G,it,bt){if(it==null)throw Error(s(151));for(var te=null,ke=null,ue=G,me=G=0,Un=null,qe=it.next();ue!==null&&!qe.done;me++,qe=it.next()){ue.index>me?(Un=ue,ue=null):Un=ue.sibling;var qs=K($,ue,qe.value,bt);if(qs===null){ue===null&&(ue=Un);break}t&&ue&&qs.alternate===null&&n($,ue),G=u(qs,G,me),ke===null?te=qs:ke.sibling=qs,ke=qs,ue=Un}if(qe.done)return a($,ue),Oe&&$a($,me),te;if(ue===null){for(;!qe.done;me++,qe=it.next())qe=Tt($,qe.value,bt),qe!==null&&(G=u(qe,G,me),ke===null?te=qe:ke.sibling=qe,ke=qe);return Oe&&$a($,me),te}for(ue=r(ue);!qe.done;me++,qe=it.next())qe=lt(ue,$,me,qe.value,bt),qe!==null&&(t&&(Un=qe.alternate,Un!==null&&ue.delete(Un.key===null?me:Un.key)),G=u(qe,G,me),ke===null?te=qe:ke.sibling=qe,ke=qe);return t&&ue.forEach(function(wE){return n($,wE)}),Oe&&$a($,me),te}function Re($,G,it,bt){if(typeof it=="object"&&it!==null&&it.type===Y&&it.key===null&&it.props.ref===void 0&&(it=it.props.children),typeof it=="object"&&it!==null){switch(it.$$typeof){case O:t:{for(var te=it.key;G!==null;){if(G.key===te){if(te=it.type,te===Y){if(G.tag===7){a($,G.sibling),bt=c(G,it.props.children),ws(bt,it),bt.return=$,$=bt;break t}}else if(G.elementType===te||typeof te=="object"&&te!==null&&te.$$typeof===gt&&gr(te)===G.type){a($,G.sibling),bt=c(G,it.props),ws(bt,it),bt.return=$,$=bt;break t}a($,G);break}else n($,G);G=G.sibling}it.type===Y?(bt=cr(it.props.children,$.mode,bt,it.key),ws(bt,it),bt.return=$,$=bt):(bt=_c(it.type,it.key,it.props,null,$.mode,bt),ws(bt,it),bt.return=$,$=bt)}return _($);case V:t:{for(te=it.key;G!==null;){if(G.key===te)if(G.tag===4&&G.stateNode.containerInfo===it.containerInfo&&G.stateNode.implementation===it.implementation){a($,G.sibling),bt=c(G,it.children||[]),bt.return=$,$=bt;break t}else{a($,G);break}else n($,G);G=G.sibling}bt=Gf(it,$.mode,bt),bt.return=$,$=bt}return _($);case gt:return it=gr(it),Re($,G,it,bt)}if(Wt(it))return Xt($,G,it,bt);if(Q(it)){if(te=Q(it),typeof te!="function")throw Error(s(150));return it=te.call(it),oe($,G,it,bt)}if(typeof it.then=="function")return Re($,G,Rc(it),bt);if(it.$$typeof===et)return Re($,G,Ec($,it),bt);wc($,it)}return typeof it=="string"&&it!==""||typeof it=="number"||typeof it=="bigint"?(it=""+it,G!==null&&G.tag===6?(a($,G.sibling),bt=c(G,it),bt.return=$,$=bt):(a($,G),bt=Hf(it,$.mode,bt),bt.return=$,$=bt),_($)):a($,G)}return function($,G,it,bt){try{ol=0;var te=Re($,G,it,bt);return Qr=null,te}catch(ue){if(ue===Kr||ue===Tc)throw ue;var ke=gi(29,ue,null,$.mode);return ke.lanes=bt,ke.return=$,ke}}}var vr=B0(!0),F0=B0(!1),Cs=!1;function Qf(t){t.updateQueue={baseState:t.memoizedState,firstBaseUpdate:null,lastBaseUpdate:null,shared:{pending:null,lanes:0,hiddenCallbacks:null},callbacks:null}}function Jf(t,n){t=t.updateQueue,n.updateQueue===t&&(n.updateQueue={baseState:t.baseState,firstBaseUpdate:t.firstBaseUpdate,lastBaseUpdate:t.lastBaseUpdate,shared:t.shared,callbacks:null})}function Ns(t){return{lane:t,tag:0,payload:null,callback:null,next:null}}function Ds(t,n,a){var r=t.updateQueue;if(r===null)return null;if(r=r.shared,(Je&2)!==0){var c=r.pending;return c===null?n.next=n:(n.next=c.next,c.next=n),r.pending=n,n=gc(t),M0(t,null,a),n}return mc(t,r,n,a),gc(t)}function ll(t,n,a){if(n=n.updateQueue,n!==null&&(n=n.shared,(a&4194048)!==0)){var r=n.lanes;r&=t.pendingLanes,a|=r,n.lanes=a,ir(t,a)}}function $f(t,n){var a=t.updateQueue,r=t.alternate;if(r!==null&&(r=r.updateQueue,a===r)){var c=null,u=null;if(a=a.firstBaseUpdate,a!==null){do{var _={lane:a.lane,tag:a.tag,payload:a.payload,callback:null,next:null};u===null?c=u=_:u=u.next=_,a=a.next}while(a!==null);u===null?c=u=n:u=u.next=n}else c=u=n;a={baseState:r.baseState,firstBaseUpdate:c,lastBaseUpdate:u,shared:r.shared,callbacks:r.callbacks},t.updateQueue=a;return}t=a.lastBaseUpdate,t===null?a.firstBaseUpdate=n:t.next=n,a.lastBaseUpdate=n}var th=!1;function cl(){if(th){var t=Zr;if(t!==null)throw t}}function ul(t,n,a,r){th=!1;var c=t.updateQueue;Cs=!1;var u=c.firstBaseUpdate,_=c.lastBaseUpdate,w=c.shared.pending;if(w!==null){c.shared.pending=null;var z=w,tt=z.next;z.next=null,_===null?u=tt:_.next=tt,_=z;var ft=t.alternate;ft!==null&&(ft=ft.updateQueue,w=ft.lastBaseUpdate,w!==_&&(w===null?ft.firstBaseUpdate=tt:w.next=tt,ft.lastBaseUpdate=z))}if(u!==null){var Tt=c.baseState;_=0,ft=tt=z=null,w=u;do{var K=w.lane&-536870913,lt=K!==w.lane;if(lt?(Ve&K)===K:(r&K)===K){K!==0&&K===pr&&(th=!0),ft!==null&&(ft=ft.next={lane:0,tag:w.tag,payload:w.payload,callback:null,next:null});t:{var Xt=t,oe=w;K=n;var Re=a;switch(oe.tag){case 1:if(Xt=oe.payload,typeof Xt=="function"){Tt=Xt.call(Re,Tt,K);break t}Tt=Xt;break t;case 3:Xt.flags=Xt.flags&-65537|128;case 0:if(Xt=oe.payload,K=typeof Xt=="function"?Xt.call(Re,Tt,K):Xt,K==null)break t;Tt=I({},Tt,K);break t;case 2:Cs=!0}}K=w.callback,K!==null&&(t.flags|=64,lt&&(t.flags|=8192),lt=c.callbacks,lt===null?c.callbacks=[K]:lt.push(K))}else lt={lane:K,tag:w.tag,payload:w.payload,callback:w.callback,next:null},ft===null?(tt=ft=lt,z=Tt):ft=ft.next=lt,_|=K;if(w=w.next,w===null){if(w=c.shared.pending,w===null)break;lt=w,w=lt.next,lt.next=null,c.lastBaseUpdate=lt,c.shared.pending=null}}while(!0);ft===null&&(z=Tt),c.baseState=z,c.firstBaseUpdate=tt,c.lastBaseUpdate=ft,u===null&&(c.shared.lanes=0),Bs|=_,t.lanes=_,t.memoizedState=Tt}}function H0(t,n){if(typeof t!="function")throw Error(s(191,t));t.call(n)}function G0(t,n){var a=t.callbacks;if(a!==null)for(t.callbacks=null,t=0;t<a.length;t++)H0(a[t],n)}var Us=Ce(null),Cc=Ce(0);function V0(t,n){t=rs,fe(Cc,t),fe(Us,n),rs=t|n.baseLanes}function eh(){fe(Cc,rs),fe(Us,Us.current)}function nh(){rs=Cc.current,ce(Us),ce(Cc)}var Kn=Ce(null),ii=null;function Ls(t){var n=t.alternate;fe(Qn,Qn.current&1),fe(Kn,t),ii===null&&(n===null||Us.current!==null||n.memoizedState!==null)&&(ii=t)}function ih(t){fe(Qn,Qn.current),fe(Kn,t),ii===null&&(ii=t)}function k0(t){t.tag===22?(fe(Qn,Qn.current),fe(Kn,t),ii===null&&(ii=t)):Os()}function Os(){fe(Qn,Qn.current),fe(Kn,Kn.current)}function Di(t){ce(Kn),ii===t&&(ii=null),ce(Qn)}var Qn=Ce(0);function fl(t,n){fe(Kn,Kn.current),fe(Qn,n)}function ah(t){ce(Qn),ce(Kn),ii===t&&(ii=null)}function Nc(t){for(var n=t;n!==null;){if(n.tag===13){var a=n.memoizedState;if(a!==null&&(a=a.dehydrated,a===null||Ad(a)||Rd(a)))return n}else if(n.tag===19&&n.memoizedProps.revealOrder!=="independent"){if((n.flags&128)!==0)return n}else if(n.child!==null){n.child.return=n,n=n.child;continue}if(n===t)break;for(;n.sibling===null;){if(n.return===null||n.return===t)return null;n=n.return}n.sibling.return=n.return,n=n.sibling}return null}var ns=0,Ae=null,ln=null,Nn=null,Dc=!1,Jr=!1,xr=!1,Uc=0,hl=0,$r=null,Zy=0;function Mn(){throw Error(s(321))}function sh(t,n){if(n===null)return!1;for(var a=0;a<n.length&&a<t.length;a++)if(!Ni(t[a],n[a]))return!1;return!0}function rh(t,n,a,r,c,u){return ns=u,Ae=n,n.memoizedState=null,n.updateQueue=null,n.lanes=0,Mt.H=t===null||t.memoizedState===null?Ag:Rg,xr=!1,u=a(r,c),xr=!1,Jr&&(u=W0(n,a,r,c)),X0(t),u}function X0(t){Mt.H=Fc;var n=ln!==null&&ln.next!==null;if(ns=0,Nn=ln=Ae=null,Dc=!1,hl=0,$r=null,n)throw Error(s(300));t===null||Dn||(t=t.dependencies,t!==null&&Mc(t)&&(Dn=!0))}function W0(t,n,a,r){Ae=t;var c=0;do{if(Jr&&($r=null),hl=0,Jr=!1,25<=c)throw Error(s(301));if(c+=1,Nn=ln=null,t.updateQueue!=null){var u=t.updateQueue;u.lastEffect=null,u.events=null,u.stores=null,u.memoCache!=null&&(u.memoCache.index=0)}Mt.H=iM,u=n(a,r)}while(Jr);return u}function Ky(){var t=Mt.H,n=t.useState()[0];return n=typeof n.then=="function"?dl(n):n,t=t.useState()[0],(ln!==null?ln.memoizedState:null)!==t&&(Ae.flags|=1024),n}function oh(){var t=Uc!==0;return Uc=0,t}function lh(t,n,a){n.updateQueue=t.updateQueue,n.flags&=-2053,t.lanes&=~a}function ch(t){if(Dc){for(t=t.memoizedState;t!==null;){var n=t.queue;n!==null&&(n.pending=null),t=t.next}Dc=!1}ns=0,Nn=ln=Ae=null,Jr=!1,hl=Uc=0,$r=null}function ci(){var t={memoizedState:null,baseState:null,baseQueue:null,queue:null,next:null};return Nn===null?Ae.memoizedState=Nn=t:Nn=Nn.next=t,Nn}function Tn(){if(ln===null){var t=Ae.alternate;t=t!==null?t.memoizedState:null}else t=ln.next;var n=Nn===null?Ae.memoizedState:Nn.next;if(n!==null)Nn=n,ln=t;else{if(t===null)throw Ae.alternate===null?Error(s(467)):Error(s(310));ln=t,t={memoizedState:ln.memoizedState,baseState:ln.baseState,baseQueue:ln.baseQueue,queue:ln.queue,next:null},Nn===null?Ae.memoizedState=Nn=t:Nn=Nn.next=t}return Nn}function Lc(){return{lastEffect:null,events:null,stores:null,memoCache:null}}function dl(t){var n=hl;return hl+=1,$r===null&&($r=[]),t=P0($r,t,n),n=Ae,(Nn===null?n.memoizedState:Nn.next)===null&&(n=n.alternate,Mt.H=n===null||n.memoizedState===null?Ag:Rg),t}function Oc(t){if(t!==null&&typeof t=="object"){if(typeof t.then=="function")return dl(t);if(t.$$typeof===xt)return;if(t.$$typeof===et)return Zn(t)}throw Error(s(438,String(t)))}function uh(t){var n=null,a=Ae.updateQueue;if(a!==null&&(n=a.memoCache),n==null){var r=Ae.alternate;r!==null&&(r=r.updateQueue,r!==null&&(r=r.memoCache,r!=null&&(n={data:r.data.map(function(c){return c.slice()}),index:0})))}if(n==null&&(n={data:[],index:0}),a===null&&(a=Lc(),Ae.updateQueue=a),a.memoCache=n,a=n.data[n.index],a===void 0)for(a=n.data[n.index]=Array(t),r=0;r<t;r++)a[r]=ne;return n.index++,a}function is(t,n){return typeof n=="function"?n(t):n}function Pc(t){var n=Tn();return fh(n,ln,t)}function fh(t,n,a){var r=t.queue;if(r===null)throw Error(s(311));r.lastRenderedReducer=a;var c=t.baseQueue,u=r.pending;if(u!==null){if(c!==null){var _=c.next;c.next=u.next,u.next=_}n.baseQueue=c=u,r.pending=null}if(u=t.baseState,c===null)t.memoizedState=u;else{n=c.next;var w=_=null,z=null,tt=n,ft=!1;do{var Tt=tt.lane&-536870913;if(Tt!==tt.lane?(Ve&Tt)===Tt:(ns&Tt)===Tt){var K=tt.revertLane;if(K===0)z!==null&&(z=z.next={lane:0,revertLane:0,gesture:null,action:tt.action,hasEagerState:tt.hasEagerState,eagerState:tt.eagerState,next:null}),Tt===pr&&(ft=!0);else if((ns&K)===K){tt=tt.next,K===pr&&(ft=!0);continue}else Tt={lane:0,revertLane:tt.revertLane,gesture:null,action:tt.action,hasEagerState:tt.hasEagerState,eagerState:tt.eagerState,next:null},z===null?(w=z=Tt,_=u):z=z.next=Tt,Ae.lanes|=K,Bs|=K;Tt=tt.action,xr&&a(u,Tt),u=tt.hasEagerState?tt.eagerState:a(u,Tt)}else K={lane:Tt,revertLane:tt.revertLane,gesture:tt.gesture,action:tt.action,hasEagerState:tt.hasEagerState,eagerState:tt.eagerState,next:null},z===null?(w=z=K,_=u):z=z.next=K,Ae.lanes|=Tt,Bs|=Tt;tt=tt.next}while(tt!==null&&tt!==n);if(z===null?_=u:z.next=w,!Ni(u,t.memoizedState)&&(Dn=!0,ft&&(a=Zr,a!==null)))throw a;t.memoizedState=u,t.baseState=_,t.baseQueue=z,r.lastRenderedState=u}return c===null&&(r.lanes=0),[t.memoizedState,r.dispatch]}function hh(t){var n=Tn(),a=n.queue;if(a===null)throw Error(s(311));a.lastRenderedReducer=t;var r=a.dispatch,c=a.pending,u=n.memoizedState;if(c!==null){a.pending=null;var _=c=c.next;do u=t(u,_.action),_=_.next;while(_!==c);Ni(u,n.memoizedState)||(Dn=!0),n.memoizedState=u,n.baseQueue===null&&(n.baseState=u),a.lastRenderedState=u}return[u,r]}function Y0(t,n,a){var r=Ae,c=Tn(),u=Oe;if(u){if(a===void 0)throw Error(s(407));a=a()}else a=n();var _=!Ni((ln||c).memoizedState,a);if(_&&(c.memoizedState=a,Dn=!0),c=c.queue,mh(Z0.bind(null,r,c,t),[t]),t=c.getSnapshot!==n||_||Nn!==null&&(Nn.memoizedState.tag&1)!==0,to(t?9:8,{destroy:void 0},j0.bind(null,r,c,a,n),null),t){if(r.flags|=2048,cn===null)throw Error(s(349));u||(ns&127)!==0||q0(r,n,a)}return a}function q0(t,n,a){t.flags|=16384,t={getSnapshot:n,value:a},n=Ae.updateQueue,n===null?(n=Lc(),Ae.updateQueue=n,n.stores=[t]):(a=n.stores,a===null?n.stores=[t]:a.push(t))}function j0(t,n,a,r){n.value=a,n.getSnapshot=r,K0(n)&&Q0(t)}function Z0(t,n,a){return a(function(){K0(n)&&Q0(t)})}function K0(t){var n=t.getSnapshot;t=t.value;try{var a=n();return!Ni(t,a)}catch{return!0}}function Q0(t){var n=lr(t,2);n!==null&&Si(n,t,2)}function dh(t){var n=ci();if(typeof t=="function"){var a=t;if(t=a(),xr){Le(!0);try{a()}finally{Le(!1)}}}return n.memoizedState=n.baseState=t,n.queue={pending:null,lanes:0,dispatch:null,lastRenderedReducer:is,lastRenderedState:t},n}function J0(t,n,a,r){return t.baseState=a,fh(t,ln,typeof r=="function"?r:is)}function Qy(t,n,a,r,c){if(Bc(t))throw Error(s(485));if(t=n.action,t!==null){var u={payload:c,action:t,next:null,isTransition:!0,status:"pending",value:null,reason:null,listeners:[],then:function(_){u.listeners.push(_)}};Mt.T!==null?a(!0):u.isTransition=!1,r(u),a=n.pending,a===null?(u.next=n.pending=u,$0(n,u)):(u.next=a.next,n.pending=a.next=u)}}function $0(t,n){var a=n.action,r=n.payload,c=t.state;if(n.isTransition){var u=Mt.T,_={};_.types=u!==null?u.types:null,Mt.T=_;try{var w=a(c,r),z=Mt.S;z!==null&&z(_,w),tg(t,n,w)}catch(tt){ph(t,n,tt)}finally{u!==null&&_.types!==null&&(u.types=_.types),Mt.T=u}}else try{u=a(c,r),tg(t,n,u)}catch(tt){ph(t,n,tt)}}function tg(t,n,a){a!==null&&typeof a=="object"&&typeof a.then=="function"?a.then(function(r){eg(t,n,r)},function(r){return ph(t,n,r)}):eg(t,n,a)}function eg(t,n,a){n.status="fulfilled",n.value=a,ng(n),t.state=a,n=t.pending,n!==null&&(a=n.next,a===n?t.pending=null:(a=a.next,n.next=a,$0(t,a)))}function ph(t,n,a){var r=t.pending;if(t.pending=null,r!==null){r=r.next;do n.status="rejected",n.reason=a,ng(n),n=n.next;while(n!==r)}t.action=null}function ng(t){t=t.listeners;for(var n=0;n<t.length;n++)(0,t[n])()}function ig(t,n){return n}function ag(t,n){if(Oe){var a=cn.formState;if(a!==null){t:{var r=Ae;if(Oe){if(fn){e:{for(var c=fn,u=Ji;c.nodeType!==8;){if(!u){c=null;break e}if(c=ta(c.nextSibling),c===null){c=null;break e}}u=c.data,c=u==="F!"||u==="F"?c:null}if(c){fn=ta(c.nextSibling),r=c.data==="F!";break t}}As(r)}r=!1}r&&(n=a[0])}}return a=ci(),a.memoizedState=a.baseState=n,r={pending:null,lanes:0,dispatch:null,lastRenderedReducer:ig,lastRenderedState:n},a.queue=r,a=Eg.bind(null,Ae,r),r.dispatch=a,r=dh(!1),u=Sh.bind(null,Ae,!1,r.queue),r=ci(),c={state:n,dispatch:null,action:t,pending:null},r.queue=c,a=Qy.bind(null,Ae,c,u,a),c.dispatch=a,r.memoizedState=t,[n,a,!1]}function sg(t){var n=Tn();return rg(n,ln,t)}function rg(t,n,a){if(n=fh(t,n,ig)[0],t=Pc(is)[0],typeof n=="object"&&n!==null&&typeof n.then=="function")try{var r=dl(n)}catch(_){throw _===Kr?Tc:_}else r=n;n=Tn();var c=n.queue,u=c.dispatch;return a!==n.memoizedState&&(Ae.flags|=2048,to(9,{destroy:void 0},Jy.bind(null,c,a),null)),[r,u,t]}function Jy(t,n){t.action=n}function og(t){var n=Tn(),a=ln;if(a!==null)return rg(n,a,t);Tn(),n=n.memoizedState,a=Tn();var r=a.queue.dispatch;return a.memoizedState=t,[n,r,!1]}function to(t,n,a,r){return t={tag:t,create:a,deps:r,inst:n,next:null},n=Ae.updateQueue,n===null&&(n=Lc(),Ae.updateQueue=n),a=n.lastEffect,a===null?n.lastEffect=t.next=t:(r=a.next,a.next=t,t.next=r,n.lastEffect=t),t}function lg(){return Tn().memoizedState}function Ic(t,n,a,r){var c=ci();Ae.flags|=t,c.memoizedState=to(1|n,{destroy:void 0},a,r===void 0?null:r)}function zc(t,n,a,r){var c=Tn();r=r===void 0?null:r;var u=c.memoizedState.inst;ln!==null&&r!==null&&sh(r,ln.memoizedState.deps)?c.memoizedState=to(n,u,a,r):(Ae.flags|=t,c.memoizedState=to(1|n,u,a,r))}function cg(t,n){Ic(8390656,8,t,n)}function mh(t,n){zc(2048,8,t,n)}function $y(t){Ae.flags|=4;var n=Ae.updateQueue;if(n===null)n=Lc(),Ae.updateQueue=n,n.events=[t];else{var a=n.events;a===null?n.events=[t]:a.push(t)}}function ug(t){var n=Tn().memoizedState;return $y({ref:n,nextImpl:t}),function(){if((Je&2)!==0)throw Error(s(440));return n.impl.apply(void 0,arguments)}}function fg(t,n){return zc(4,2,t,n)}function hg(t,n){return zc(4,4,t,n)}function dg(t,n){if(typeof n=="function"){t=t();var a=n(t);return function(){typeof a=="function"?a():n(null)}}if(n!=null)return t=t(),n.current=t,function(){n.current=null}}function pg(t,n,a){a=a!=null?a.concat([t]):null,zc(4,4,dg.bind(null,n,t),a)}function gh(){}function mg(t,n){var a=Tn();n=n===void 0?null:n;var r=a.memoizedState;return n!==null&&sh(n,r[1])?r[0]:(a.memoizedState=[t,n],t)}function gg(t,n){var a=Tn();n=n===void 0?null:n;var r=a.memoizedState;if(n!==null&&sh(n,r[1]))return r[0];if(r=t(),xr){Le(!0);try{t()}finally{Le(!1)}}return a.memoizedState=[r,n],r}function _h(t,n,a){return a===void 0||(ns&1073741824)!==0&&(Ve&261930)===0?t.memoizedState=n:(t.memoizedState=a,t=A_(),Ae.lanes|=t,Bs|=t,a)}function _g(t,n,a,r){return Ni(a,n)?a:Us.current!==null?(t=_h(t,a,r),Ni(t,n)||(Dn=!0),t):(ns&106)===0||(ns&1073741824)!==0&&(Ve&261930)===0?(Dn=!0,t.memoizedState=a):(t=A_(),Ae.lanes|=t,Bs|=t,n)}function vg(t,n,a,r,c){var u=It.p;It.p=u!==0&&8>u?u:8;var _=Mt.T,w={};w.types=_!==null?_.types:null,Mt.T=w,Sh(t,!1,n,a);try{var z=c(),tt=Mt.S;if(tt!==null&&tt(w,z),z!==null&&typeof z=="object"&&typeof z.then=="function"){var ft=jy(z,r);pl(t,n,ft,Pi(t))}else pl(t,n,r,Pi(t))}catch(Tt){pl(t,n,{then:function(){},status:"rejected",reason:Tt},Pi())}finally{It.p=u,_!==null&&w.types!==null&&(_.types=w.types),Mt.T=_}}function tM(){}function vh(t,n,a,r){if(t.tag!==5)throw Error(s(476));var c=xg(t).queue;vg(t,c,n,Ze,a===null?tM:function(){return Sg(t),a(r)})}function xg(t){var n=t.memoizedState;if(n!==null)return n;n={memoizedState:Ze,baseState:Ze,baseQueue:null,queue:{pending:null,lanes:0,dispatch:null,lastRenderedReducer:is,lastRenderedState:Ze},next:null};var a={};return n.next={memoizedState:a,baseState:a,baseQueue:null,queue:{pending:null,lanes:0,dispatch:null,lastRenderedReducer:is,lastRenderedState:a},next:null},t.memoizedState=n,t=t.alternate,t!==null&&(t.memoizedState=n),n}function Sg(t){var n=xg(t);n.next===null&&(n=t.alternate.memoizedState),pl(t,n.next.queue,{},Pi())}function xh(){return Zn(So)}function yg(){return Tn().memoizedState}function Mg(){return Tn().memoizedState}function eM(t){for(var n=t.return;n!==null;){switch(n.tag){case 24:case 3:var a=Pi();t=Ns(a);var r=Ds(n,t,a);r!==null&&(Si(r,n,a),ll(r,n,a)),n={cache:qf()},t.payload=n;return}n=n.return}}function nM(t,n,a){var r=Pi();a={lane:r,revertLane:0,gesture:null,action:a,hasEagerState:!1,eagerState:null,next:null},Bc(t)?bg(n,a):(a=Bf(t,n,a,r),a!==null&&(Si(a,t,r),Tg(a,n,r)))}function Eg(t,n,a){var r=Pi();pl(t,n,a,r)}function pl(t,n,a,r){var c={lane:r,revertLane:0,gesture:null,action:a,hasEagerState:!1,eagerState:null,next:null};if(Bc(t))bg(n,c);else{var u=t.alternate;if(t.lanes===0&&(u===null||u.lanes===0)&&(u=n.lastRenderedReducer,u!==null))try{var _=n.lastRenderedState,w=u(_,a);if(c.hasEagerState=!0,c.eagerState=w,Ni(w,_))return mc(t,n,c,0),cn===null&&pc(),!1}catch{}if(a=Bf(t,n,c,r),a!==null)return Si(a,t,r),Tg(a,n,r),!0}return!1}function Sh(t,n,a,r){if(r={lane:2,revertLane:ud(),gesture:null,action:r,hasEagerState:!1,eagerState:null,next:null},Bc(t)){if(n)throw Error(s(479))}else n=Bf(t,a,r,2),n!==null&&Si(n,t,2)}function Bc(t){var n=t.alternate;return t===Ae||n!==null&&n===Ae}function bg(t,n){Jr=Dc=!0;var a=t.pending;a===null?n.next=n:(n.next=a.next,a.next=n),t.pending=n}function Tg(t,n,a){if((a&4194048)!==0){var r=n.lanes;r&=t.pendingLanes,a|=r,n.lanes=a,ir(t,a)}}var Fc={readContext:Zn,use:Oc,useCallback:Mn,useContext:Mn,useEffect:Mn,useImperativeHandle:Mn,useLayoutEffect:Mn,useInsertionEffect:Mn,useMemo:Mn,useReducer:Mn,useRef:Mn,useState:Mn,useDebugValue:Mn,useDeferredValue:Mn,useTransition:Mn,useSyncExternalStore:Mn,useId:Mn,useHostTransitionStatus:Mn,useFormState:Mn,useActionState:Mn,useOptimistic:Mn,useMemoCache:Mn,useCacheRefresh:Mn,useEffectEvent:Mn},Ag={readContext:Zn,use:Oc,useCallback:function(t,n){return ci().memoizedState=[t,n===void 0?null:n],t},useContext:Zn,useEffect:cg,useImperativeHandle:function(t,n,a){a=a!=null?a.concat([t]):null,Ic(4194308,4,dg.bind(null,n,t),a)},useLayoutEffect:function(t,n){return Ic(4194308,4,t,n)},useInsertionEffect:function(t,n){Ic(4,2,t,n)},useMemo:function(t,n){var a=ci();n=n===void 0?null:n;var r=t();if(xr){Le(!0);try{t()}finally{Le(!1)}}return a.memoizedState=[r,n],r},useReducer:function(t,n,a){var r=ci();if(a!==void 0){var c=a(n);if(xr){Le(!0);try{a(n)}finally{Le(!1)}}}else c=n;return r.memoizedState=r.baseState=c,t={pending:null,lanes:0,dispatch:null,lastRenderedReducer:t,lastRenderedState:c},r.queue=t,t=t.dispatch=nM.bind(null,Ae,t),[r.memoizedState,t]},useRef:function(t){var n=ci();return t={current:t},n.memoizedState=t},useState:function(t){t=dh(t);var n=t.queue,a=Eg.bind(null,Ae,n);return n.dispatch=a,[t.memoizedState,a]},useDebugValue:gh,useDeferredValue:function(t,n){var a=ci();return _h(a,t,n)},useTransition:function(){var t=dh(!1);return t=vg.bind(null,Ae,t.queue,!0,!1),ci().memoizedState=t,[!1,t]},useSyncExternalStore:function(t,n,a){var r=Ae,c=ci();if(Oe){if(a===void 0)throw Error(s(407));a=a()}else{if(a=n(),cn===null)throw Error(s(349));(Ve&127)!==0||q0(r,n,a)}c.memoizedState=a;var u={value:a,getSnapshot:n};return c.queue=u,cg(Z0.bind(null,r,u,t),[t]),r.flags|=2048,to(9,{destroy:void 0},j0.bind(null,r,u,a,n),null),a},useId:function(){var t=ci(),n=cn.identifierPrefix;if(Oe){var a=Aa,r=Ta;a=(r&~(1<<32-xe(r)-1)).toString(32)+a,n="_"+n+"R_"+a,a=Uc++,0<a&&(n+="H"+a.toString(32)),n+="_"}else a=Zy++,n="_"+n+"r_"+a.toString(32)+"_";return t.memoizedState=n},useHostTransitionStatus:xh,useFormState:ag,useActionState:ag,useOptimistic:function(t){var n=ci();n.memoizedState=n.baseState=t;var a={pending:null,lanes:0,dispatch:null,lastRenderedReducer:null,lastRenderedState:null};return n.queue=a,n=Sh.bind(null,Ae,!0,a),a.dispatch=n,[t,n]},useMemoCache:uh,useCacheRefresh:function(){return ci().memoizedState=eM.bind(null,Ae)},useEffectEvent:function(t){var n=ci(),a={impl:t};return n.memoizedState=a,function(){if((Je&2)!==0)throw Error(s(440));return a.impl.apply(void 0,arguments)}}},Rg={readContext:Zn,use:Oc,useCallback:mg,useContext:Zn,useEffect:mh,useImperativeHandle:pg,useInsertionEffect:fg,useLayoutEffect:hg,useMemo:gg,useReducer:Pc,useRef:lg,useState:function(){return Pc(is)},useDebugValue:gh,useDeferredValue:function(t,n){var a=Tn();return _g(a,ln.memoizedState,t,n)},useTransition:function(){var t=Pc(is)[0],n=Tn().memoizedState;return[typeof t=="boolean"?t:dl(t),n]},useSyncExternalStore:Y0,useId:yg,useHostTransitionStatus:xh,useFormState:sg,useActionState:sg,useOptimistic:function(t,n){var a=Tn();return J0(a,ln,t,n)},useMemoCache:uh,useCacheRefresh:Mg,useEffectEvent:ug},iM={readContext:Zn,use:Oc,useCallback:mg,useContext:Zn,useEffect:mh,useImperativeHandle:pg,useInsertionEffect:fg,useLayoutEffect:hg,useMemo:gg,useReducer:hh,useRef:lg,useState:function(){return hh(is)},useDebugValue:gh,useDeferredValue:function(t,n){var a=Tn();return ln===null?_h(a,t,n):_g(a,ln.memoizedState,t,n)},useTransition:function(){var t=hh(is)[0],n=Tn().memoizedState;return[typeof t=="boolean"?t:dl(t),n]},useSyncExternalStore:Y0,useId:yg,useHostTransitionStatus:xh,useFormState:og,useActionState:og,useOptimistic:function(t,n){var a=Tn();return ln!==null?J0(a,ln,t,n):(a.baseState=t,[t,a.queue.dispatch])},useMemoCache:uh,useCacheRefresh:Mg,useEffectEvent:ug};function yh(t,n,a,r){n=t.memoizedState,a=a(r,n),a=a==null?n:I({},n,a),t.memoizedState=a,t.lanes===0&&(t.updateQueue.baseState=a)}var Mh={enqueueSetState:function(t,n,a){t=t._reactInternals;var r=Pi(),c=Ns(r);c.payload=n,a!=null&&(c.callback=a),n=Ds(t,c,r),n!==null&&(Si(n,t,r),ll(n,t,r))},enqueueReplaceState:function(t,n,a){t=t._reactInternals;var r=Pi(),c=Ns(r);c.tag=1,c.payload=n,a!=null&&(c.callback=a),n=Ds(t,c,r),n!==null&&(Si(n,t,r),ll(n,t,r))},enqueueForceUpdate:function(t,n){t=t._reactInternals;var a=Pi(),r=Ns(a);r.tag=2,n!=null&&(r.callback=n),n=Ds(t,r,a),n!==null&&(Si(n,t,a),ll(n,t,a))}};function wg(t,n,a,r,c,u,_){return t=t.stateNode,typeof t.shouldComponentUpdate=="function"?t.shouldComponentUpdate(r,u,_):n.prototype&&n.prototype.isPureReactComponent?!tl(a,r)||!tl(c,u):!0}function Cg(t,n,a,r){t=n.state,typeof n.componentWillReceiveProps=="function"&&n.componentWillReceiveProps(a,r),typeof n.UNSAFE_componentWillReceiveProps=="function"&&n.UNSAFE_componentWillReceiveProps(a,r),n.state!==t&&Mh.enqueueReplaceState(n,n.state,null)}function Sr(t,n){var a=n;if("ref"in n){a={};for(var r in n)r!=="ref"&&(a[r]=n[r])}if(t=t.defaultProps){a===n&&(a=I({},a));for(var c in t)a[c]===void 0&&(a[c]=t[c])}return a}function Ng(t){dc(t)}function Dg(t){console.error(t)}function Ug(t){dc(t)}function Hc(t,n){try{var a=t.onUncaughtError;a(n.value,{componentStack:n.stack})}catch(r){setTimeout(function(){throw r})}}function Lg(t,n,a){try{var r=t.onCaughtError;r(a.value,{componentStack:a.stack,errorBoundary:n.tag===1?n.stateNode:null})}catch(c){setTimeout(function(){throw c})}}function Eh(t,n,a){return a=Ns(a),a.tag=3,a.payload={element:null},a.callback=function(){Hc(t,n)},a}function Og(t){return t=Ns(t),t.tag=3,t}function Pg(t,n,a,r){var c=a.type.getDerivedStateFromError;if(typeof c=="function"){var u=r.value;t.payload=function(){return c(u)},t.callback=function(){Lg(n,a,r)}}var _=a.stateNode;_!==null&&typeof _.componentDidCatch=="function"&&(t.callback=function(){Lg(n,a,r),typeof c!="function"&&(Fs===null?Fs=new Set([this]):Fs.add(this));var w=r.stack;this.componentDidCatch(r.value,{componentStack:w!==null?w:""})})}function aM(t,n,a,r,c){if(a.flags|=32768,r!==null&&typeof r=="object"&&typeof r.then=="function"){if(n=a.alternate,n!==null&&hr(n,a,c,!0),a=Kn.current,a!==null){switch(a.tag){case 31:case 13:case 19:return ii===null?ou():a.alternate===null&&En===0&&(En=3),a.flags&=-257,a.flags|=65536,a.lanes=c,r===Ac?a.flags|=16384:(n=a.updateQueue,n===null?a.updateQueue=new Set([r]):n.add(r),od(t,r,c)),!1;case 22:return a.flags|=65536,r===Ac?a.flags|=16384:(n=a.updateQueue,n===null?(n={transitions:null,markerInstances:null,retryQueue:new Set([r])},a.updateQueue=n):(a=n.retryQueue,a===null?n.retryQueue=new Set([r]):a.add(r)),od(t,r,c)),!1}throw Error(s(435,a.tag))}return od(t,r,c),ou(),!1}if(Oe)return n=Kn.current,n!==null?((n.flags&65536)===0&&(n.flags|=256),n.flags|=65536,n.lanes=c,r!==kf&&(t=Error(s(422),{cause:r}),il(Zi(t,a)))):(r!==kf&&(n=Error(s(423),{cause:r}),il(Zi(n,a))),t=t.current.alternate,t.flags|=65536,c&=-c,t.lanes|=c,r=Zi(r,a),c=Eh(t.stateNode,r,c),$f(t,c),En!==4&&(En=2)),!1;var u=Error(s(520),{cause:r});if(u=Zi(u,a),Ml===null?Ml=[u]:Ml.push(u),En!==4&&(En=2),n===null)return!0;r=Zi(r,a),a=n;do{switch(a.tag){case 3:return a.flags|=65536,t=c&-c,a.lanes|=t,t=Eh(a.stateNode,r,t),$f(a,t),!1;case 1:if(n=a.type,u=a.stateNode,(a.flags&128)===0&&(typeof n.getDerivedStateFromError=="function"||u!==null&&typeof u.componentDidCatch=="function"&&(Fs===null||!Fs.has(u))))return a.flags|=65536,c&=-c,a.lanes|=c,c=Og(c),Pg(c,t,a,r),$f(a,c),!1;break;case 22:if(a.memoizedState!==null)return a.flags|=65536,!1}a=a.return}while(a!==null);return!1}var bh=Error(s(461)),Dn=!1;function Bn(t,n,a,r){n.child=t===null?F0(n,null,a,r):vr(n,t.child,a,r)}function Ig(t,n,a,r,c){a=a.render;var u=n.ref;if("ref"in r){var _={};for(var w in r)w!=="ref"&&(_[w]=r[w])}else _=r;return dr(n),r=rh(t,n,a,_,u,c),w=oh(),t!==null&&!Dn?(lh(t,n,c),as(t,n,c)):(Oe&&w&&xc(n),n.flags|=1,Bn(t,n,r,c),n.child)}function zg(t,n,a,r,c){if(t===null){var u=a.type;return typeof u=="function"&&!Ff(u)&&u.defaultProps===void 0&&a.compare===null?(n.tag=15,n.type=u,Bg(t,n,u,r,c)):(t=_c(a.type,null,r,n,n.mode,c),t.ref=n.ref,t.return=n,n.child=t)}if(u=t.child,!Uh(t,c)){var _=u.memoizedProps;if(a=a.compare,a=a!==null?a:tl,a(_,r)&&t.ref===n.ref)return as(t,n,c)}return n.flags|=1,t=Ja(u,r),t.ref=n.ref,t.return=n,n.child=t}function Bg(t,n,a,r,c){if(t!==null){var u=t.memoizedProps;if(tl(u,r)&&t.ref===n.ref)if(Dn=!1,n.pendingProps=r=u,Uh(t,c))(t.flags&131072)!==0&&(Dn=!0);else return n.lanes=t.lanes,as(t,n,c)}return Th(t,n,a,r,c)}function Fg(t,n,a,r){var c=r.children,u=t!==null?t.memoizedState:null;if(t===null&&n.stateNode===null&&(n.stateNode={_visibility:1,_pendingMarkers:null,_retryCache:null,_transitions:null}),r.mode==="hidden"){if((n.flags&128)!==0){if(u=u!==null?u.baseLanes|a:a,t!==null){for(r=n.child=t.child,c=0;r!==null;)c=c|r.lanes|r.childLanes,r=r.sibling;r=c&~u}else r=0,n.child=null;return Hg(t,n,u,a,r)}if((a&536870912)!==0)n.memoizedState={baseLanes:0,cachePool:null},t!==null&&bc(n,u!==null?u.cachePool:null),u!==null?V0(n,u):eh(),k0(n);else return r=n.lanes=536870912,Hg(t,n,u!==null?u.baseLanes|a:a,a,r)}else u!==null?(bc(n,u.cachePool),V0(n,u),Os(),n.memoizedState=null):(t!==null&&bc(n,null),eh(),Os());return Bn(t,n,c,a),n.child}function ml(t,n){return t!==null&&t.tag===22||n.stateNode!==null||(n.stateNode={_visibility:1,_pendingMarkers:null,_retryCache:null,_transitions:null}),n.sibling}function Hg(t,n,a,r,c){var u=Zf();return u=u===null?null:{parent:Cn._currentValue,pool:u},n.memoizedState={baseLanes:a,cachePool:u},t!==null&&bc(n,null),eh(),k0(n),t!==null&&hr(t,n,r,!0),n.childLanes=c,null}function Gc(t,n){return n=Vc({mode:n.mode,children:n.children},t.mode),n.ref=t.ref,t.child=n,n.return=t,n}function Gg(t,n,a){return vr(n,t.child,null,a),t=Gc(n,n.pendingProps),t.flags|=2,Di(n),n.memoizedState=null,t}function sM(t,n,a){var r=n.pendingProps,c=(n.flags&128)!==0;if(n.flags&=-129,t===null){if(Oe){if(r.mode==="hidden")return t=Gc(n,r),n.lanes=536870912,t.memoizedState={baseLanes:0,cachePool:null},ml(null,t);if(ih(n),(t=fn)?(t=dv(t,Ji),t=t!==null&&t.data==="&"?t:null,t!==null&&(n.memoizedState={dehydrated:t,treeContext:bs!==null?{id:Ta,overflow:Aa}:null,retryLane:536870912,hydrationErrors:null},a=b0(t),a.return=n,n.child=a,kn=n,fn=null)):t=null,t===null)throw As(n);return n.lanes=536870912,null}return Gc(n,r)}var u=t.memoizedState;if(u!==null){var _=u.dehydrated;if(ih(n),c)if(n.flags&256)n.flags&=-257,n=Gg(t,n,a);else if(n.memoizedState!==null)n.child=t.child,n.flags|=128,n=null;else throw Error(s(558));else if(Dn||hr(t,n,a,!1),c=(a&t.childLanes)!==0,Dn||c){if(Us.current===null){if(r=cn,r!==null&&(_=xs(r,a),_!==0&&_!==u.retryLane))throw u.retryLane=_,lr(t,_),Si(r,t,_),bh;ou()}n=Gg(t,n,a)}else t=u.treeContext,fn=ta(_.nextSibling),kn=n,Oe=!0,Ts=null,Ji=!1,t!==null&&R0(n,t),n=Gc(n,r),n.flags|=134221824;return n}return t=Ja(t.child,{mode:r.mode,children:r.children}),t.ref=n.ref,n.child=t,t.return=n,t}function eo(t,n){var a=n.ref;if(a===null)t!==null&&t.ref!==null&&(n.flags|=4194816);else{if(typeof a!="function"&&typeof a!="object")throw Error(s(284));(t===null||t.ref!==a)&&(n.flags|=4194816)}}function Th(t,n,a,r,c){return dr(n),a=rh(t,n,a,r,void 0,c),r=oh(),t!==null&&!Dn?(lh(t,n,c),as(t,n,c)):(Oe&&r&&xc(n),n.flags|=1,Bn(t,n,a,c),n.child)}function Vg(t,n,a,r,c,u){return dr(n),n.updateQueue=null,a=W0(n,r,a,c),X0(t),r=oh(),t!==null&&!Dn?(lh(t,n,u),as(t,n,u)):(Oe&&r&&xc(n),n.flags|=1,Bn(t,n,a,u),n.child)}function kg(t,n,a,r,c){if(dr(n),n.stateNode===null){var u=Wr,_=a.contextType;typeof _=="object"&&_!==null&&(u=Zn(_)),u=new a(r,u),n.memoizedState=u.state!==null&&u.state!==void 0?u.state:null,u.updater=Mh,n.stateNode=u,u._reactInternals=n,u=n.stateNode,u.props=r,u.state=n.memoizedState,u.refs={},Qf(n),_=a.contextType,u.context=typeof _=="object"&&_!==null?Zn(_):Wr,u.state=n.memoizedState,_=a.getDerivedStateFromProps,typeof _=="function"&&(yh(n,a,_,r),u.state=n.memoizedState),typeof a.getDerivedStateFromProps=="function"||typeof u.getSnapshotBeforeUpdate=="function"||typeof u.UNSAFE_componentWillMount!="function"&&typeof u.componentWillMount!="function"||(_=u.state,typeof u.componentWillMount=="function"&&u.componentWillMount(),typeof u.UNSAFE_componentWillMount=="function"&&u.UNSAFE_componentWillMount(),_!==u.state&&Mh.enqueueReplaceState(u,u.state,null),ul(n,r,u,c),cl(),u.state=n.memoizedState),typeof u.componentDidMount=="function"&&(n.flags|=4194308),r=!0}else if(t===null){u=n.stateNode;var w=n.memoizedProps,z=Sr(a,w);u.props=z;var tt=u.context,ft=a.contextType;_=Wr,typeof ft=="object"&&ft!==null&&(_=Zn(ft));var Tt=a.getDerivedStateFromProps;ft=typeof Tt=="function"||typeof u.getSnapshotBeforeUpdate=="function",w=n.pendingProps!==w,ft||typeof u.UNSAFE_componentWillReceiveProps!="function"&&typeof u.componentWillReceiveProps!="function"||(w||tt!==_)&&Cg(n,u,r,_),Cs=!1;var K=n.memoizedState;u.state=K,ul(n,r,u,c),cl(),tt=n.memoizedState,w||K!==tt||Cs?(typeof Tt=="function"&&(yh(n,a,Tt,r),tt=n.memoizedState),(z=Cs||wg(n,a,z,r,K,tt,_))?(ft||typeof u.UNSAFE_componentWillMount!="function"&&typeof u.componentWillMount!="function"||(typeof u.componentWillMount=="function"&&u.componentWillMount(),typeof u.UNSAFE_componentWillMount=="function"&&u.UNSAFE_componentWillMount()),typeof u.componentDidMount=="function"&&(n.flags|=4194308)):(typeof u.componentDidMount=="function"&&(n.flags|=4194308),n.memoizedProps=r,n.memoizedState=tt),u.props=r,u.state=tt,u.context=_,r=z):(typeof u.componentDidMount=="function"&&(n.flags|=4194308),r=!1)}else{u=n.stateNode,Jf(t,n),_=n.memoizedProps,ft=Sr(a,_),u.props=ft,Tt=n.pendingProps,K=u.context,tt=a.contextType,z=Wr,typeof tt=="object"&&tt!==null&&(z=Zn(tt)),w=a.getDerivedStateFromProps,(tt=typeof w=="function"||typeof u.getSnapshotBeforeUpdate=="function")||typeof u.UNSAFE_componentWillReceiveProps!="function"&&typeof u.componentWillReceiveProps!="function"||(_!==Tt||K!==z)&&Cg(n,u,r,z),Cs=!1,K=n.memoizedState,u.state=K,ul(n,r,u,c),cl();var lt=n.memoizedState;_!==Tt||K!==lt||Cs||t!==null&&t.dependencies!==null&&Mc(t.dependencies)?(typeof w=="function"&&(yh(n,a,w,r),lt=n.memoizedState),(ft=Cs||wg(n,a,ft,r,K,lt,z)||t!==null&&t.dependencies!==null&&Mc(t.dependencies))?(tt||typeof u.UNSAFE_componentWillUpdate!="function"&&typeof u.componentWillUpdate!="function"||(typeof u.componentWillUpdate=="function"&&u.componentWillUpdate(r,lt,z),typeof u.UNSAFE_componentWillUpdate=="function"&&u.UNSAFE_componentWillUpdate(r,lt,z)),typeof u.componentDidUpdate=="function"&&(n.flags|=4),typeof u.getSnapshotBeforeUpdate=="function"&&(n.flags|=1024)):(typeof u.componentDidUpdate!="function"||_===t.memoizedProps&&K===t.memoizedState||(n.flags|=4),typeof u.getSnapshotBeforeUpdate!="function"||_===t.memoizedProps&&K===t.memoizedState||(n.flags|=1024),n.memoizedProps=r,n.memoizedState=lt),u.props=r,u.state=lt,u.context=z,r=ft):(typeof u.componentDidUpdate!="function"||_===t.memoizedProps&&K===t.memoizedState||(n.flags|=4),typeof u.getSnapshotBeforeUpdate!="function"||_===t.memoizedProps&&K===t.memoizedState||(n.flags|=1024),r=!1)}return u=r,eo(t,n),r=(n.flags&128)!==0,u||r?(u=n.stateNode,a=r&&typeof a.getDerivedStateFromError!="function"?null:u.render(),n.flags|=1,t!==null&&r?(n.child=vr(n,t.child,null,c),n.child=vr(n,null,a,c)):Bn(t,n,a,c),n.memoizedState=u.state,t=n.child):t=as(t,n,c),t}function Xg(t,n,a,r){return ur(),n.flags|=256,Bn(t,n,a,r),n.child}var Ah={dehydrated:null,treeContext:null,retryLane:0,hydrationErrors:null};function Rh(t){return{baseLanes:t,cachePool:L0()}}function wh(t,n,a){return t=t!==null?t.childLanes&~a:0,n&&(t|=Oi),t}function Wg(t,n,a){var r=n.pendingProps,c=!1,u=(n.flags&128)!==0,_;if((_=u)||(_=t!==null&&t.memoizedState===null?!1:(Qn.current&2)!==0),_&&(c=!0,n.flags&=-129),_=(n.flags&32)!==0,n.flags&=-33,t===null){if(Oe){if(c?Ls(n):Os(),(t=fn)?(t=dv(t,Ji),t=t!==null&&t.data!=="&"?t:null,t!==null&&(n.memoizedState={dehydrated:t,treeContext:bs!==null?{id:Ta,overflow:Aa}:null,retryLane:536870912,hydrationErrors:null},a=b0(t),a.return=n,n.child=a,kn=n,fn=null)):t=null,t===null)throw As(n);return Rd(t)?n.lanes=32:n.lanes=536870912,null}return u=r.children,r=r.fallback,c?(Os(),c=n.mode,u=Vc({mode:"hidden",children:u},c),r=cr(r,c,a,null),u.return=n,r.return=n,u.sibling=r,n.child=u,r=n.child,r.memoizedState=Rh(a),r.childLanes=wh(t,_,a),n.memoizedState=Ah,ml(null,r)):(Ls(n),Ch(n,u))}var w=t.memoizedState;if(w!==null){var z=w.dehydrated;if(z!==null)return rM(t,n,u,_,r,z,w,a)}return c?(Os(),c=r.fallback,u=n.mode,w=t.child,z=w.sibling,r=Ja(w,{mode:"hidden",children:r.children}),r.subtreeFlags=w.subtreeFlags&1206910976,z!==null?c=Ja(z,c):(c=cr(c,u,a,null),c.flags|=2),c.return=n,r.return=n,r.sibling=c,n.child=r,ml(null,r),r=n.child,c=t.child.memoizedState,c===null?c=Rh(a):(u=c.cachePool,u!==null?(w=Cn._currentValue,u=u.parent!==w?{parent:w,pool:w}:u):u=L0(),c={baseLanes:c.baseLanes|a,cachePool:u}),r.memoizedState=c,r.childLanes=wh(t,_,a),n.memoizedState=Ah,ml(t.child,r)):(Ls(n),a=t.child,t=a.sibling,a=Ja(a,{mode:"visible",children:r.children}),a.return=n,a.sibling=null,t!==null&&(_=n.deletions,_===null?(n.deletions=[t],n.flags|=16):_.push(t)),n.child=a,n.memoizedState=null,a)}function Ch(t,n){return n=Vc({mode:"visible",children:n},t.mode),n.return=t,t.child=n}function Vc(t,n){return t=gi(22,t,null,n),t.lanes=0,t}function kc(t,n,a){return vr(n,t.child,null,a),t=Ch(n,n.pendingProps.children),t.flags|=2,n.memoizedState=null,t}function rM(t,n,a,r,c,u,_,w){if(a)return n.flags&256?(Ls(n),n.flags&=-257,kc(t,n,w)):n.memoizedState!==null?(Os(),n.child=t.child,n.flags|=128,null):(Os(),u=c.fallback,_=n.mode,c=Vc({mode:"visible",children:c.children},_),u=cr(u,_,w,null),u.flags|=2,c.return=n,u.return=n,c.sibling=u,n.child=c,vr(n,t.child,null,w),c=n.child,c.memoizedState=Rh(w),c.childLanes=wh(t,r,w),n.memoizedState=Ah,ml(null,c));if(Ls(n),Rd(u)){if(r=u.nextSibling&&u.nextSibling.dataset,r)var z=r.dgst;return r=z,r!==""&&(c=Error(s(419)),c.stack="",c.digest=r,il({value:c,source:null,stack:null})),kc(t,n,w)}if(Dn||hr(t,n,w,!1),r=(w&t.childLanes)!==0,Dn||r){if(Us.current!==null)return kc(t,n,w);if(r=cn,r!==null&&(c=xs(r,w),c!==0&&c!==_.retryLane))throw _.retryLane=c,lr(t,c),Si(r,t,c),bh;return Ad(u)||ou(),kc(t,n,w)}return Ad(u)?(n.flags|=192,n.child=t.child,null):(t=_.treeContext,fn=ta(u.nextSibling),kn=n,Oe=!0,Ts=null,Ji=!1,t!==null&&R0(n,t),n=Ch(n,c.children),n.flags|=134221824,n)}function Yg(t,n,a){t.lanes|=n;var r=t.alternate;r!==null&&(r.lanes|=n),yc(t.return,n,a)}function qg(t){for(var n=null;t!==null;){var a=t.alternate;a!==null&&Nc(a)===null&&(n=t),t=t.sibling}return n}function Xc(t,n,a,r,c,u){var _=t.memoizedState;_===null?t.memoizedState={isBackwards:n,rendering:null,renderingStartTime:0,last:r,tail:a,tailMode:c,treeForkCount:u}:(_.isBackwards=n,_.rendering=null,_.renderingStartTime=0,_.last=r,_.tail=a,_.tailMode=c,_.treeForkCount=u)}function Nh(t){var n=t.child;for(t.child=null;n!==null;){var a=n.sibling;n.sibling=t.child,t.child=n,n=a}}function Dh(t,n,a){var r=n.pendingProps,c=r.revealOrder,u=r.tail;r=r.children;var _=Qn.current;if(n.flags&128)return fl(n,_),null;var w=(_&2)!==0;if(w?(_=_&1|2,n.flags|=128):_&=1,fl(n,_),c==="backwards"&&t!==null?(Nh(t),Bn(t,n,r,a),Nh(t)):Bn(t,n,r,a),r=Oe?nl:0,!w&&t!==null&&(t.flags&128)!==0)t:for(t=n.child;t!==null;){if(t.tag===13)t.memoizedState!==null&&Yg(t,a,n);else if(t.tag===19)Yg(t,a,n);else if(t.child!==null){t.child.return=t,t=t.child;continue}if(t===n)break t;for(;t.sibling===null;){if(t.return===null||t.return===n)break t;t=t.return}t.sibling.return=t.return,t=t.sibling}switch(c){case"backwards":a=qg(n.child),a===null?(c=n.child,n.child=null):(c=a.sibling,a.sibling=null,Nh(n)),Xc(n,!0,c,null,u,r);break;case"unstable_legacy-backwards":for(a=null,c=n.child,n.child=null;c!==null;){if(t=c.alternate,t!==null&&Nc(t)===null){n.child=c;break}t=c.sibling,c.sibling=a,a=c,c=t}Xc(n,!0,a,null,u,r);break;case"together":Xc(n,!1,null,null,void 0,r);break;case"independent":n.memoizedState=null;break;default:a=qg(n.child),a===null?(c=n.child,n.child=null):(c=a.sibling,a.sibling=null),Xc(n,!1,c,a,u,r)}return n.child}function jg(t,n,a){var r=n.pendingProps;return Rs(n,n.type,r.value),Bn(t,n,r.children,a),n.child}function as(t,n,a){if(t!==null&&(n.dependencies=t.dependencies),Bs|=n.lanes,(a&n.childLanes)===0)if(t!==null){if(hr(t,n,a,!1),(a&n.childLanes)===0)return null}else return null;if(t!==null&&n.child!==t.child)throw Error(s(153));if(n.child!==null){for(t=n.child,a=Ja(t,t.pendingProps),n.child=a,a.return=n;t.sibling!==null;)t=t.sibling,a=a.sibling=Ja(t,t.pendingProps),a.return=n;a.sibling=null}return n.child}function Uh(t,n){return(t.lanes&n)!==0?!0:(t=t.dependencies,!!(t!==null&&Mc(t)))}function oM(t,n,a){switch(n.tag){case 3:W(n,n.stateNode.containerInfo),Rs(n,Cn,t.memoizedState.cache),ur();break;case 27:case 5:Ue(n);break;case 4:W(n,n.stateNode.containerInfo);break;case 10:Rs(n,n.type,n.memoizedProps.value);break;case 31:if(n.memoizedState!==null)return n.flags|=128,ih(n),null;break;case 13:var r=n.memoizedState;if(r!==null){if(r.dehydrated!==null)return Ls(n),n.flags|=128,null;r=hr(t,n,a,!1);var c=n.child.childLanes;return r||(a&c)!==0?Wg(t,n,a):(Ls(n),t=as(t,n,a),t!==null?t.sibling:null)}Ls(n);break;case 19:if(n.flags&128)return Dh(t,n,a);if(c=(t.flags&128)!==0,r=(a&n.childLanes)!==0,r||(hr(t,n,a,!1),r=(a&n.childLanes)!==0),c){if(r)return Dh(t,n,a);n.flags|=128}if(c=n.memoizedState,c!==null&&(c.rendering=null,c.tail=null,c.lastEffect=null),fl(n,Qn.current),r)break;return null;case 22:return n.lanes=0,Fg(t,n,a,n.pendingProps);case 24:Rs(n,Cn,t.memoizedState.cache)}return as(t,n,a)}function Zg(t,n,a){if(t!==null)if(t.memoizedProps!==n.pendingProps)Dn=!0;else{if(!Uh(t,a)&&(n.flags&128)===0)return Dn=!1,oM(t,n,a);Dn=(t.flags&131072)!==0}else Dn=!1,Oe&&(n.flags&1048576)!==0&&A0(n,nl,n.index);switch(n.lanes=0,n.tag){case 16:t:{var r=n.pendingProps;if(t=gr(n.elementType),n.type=t,typeof t=="function")Ff(t)?(r=Sr(t,r),n.tag=1,n=kg(null,n,t,r,a)):(n.tag=0,n=Th(null,n,t,r,a));else{if(t!=null){var c=t.$$typeof;if(c===q){n.tag=11,n=Ig(null,n,t,r,a);break t}else if(c===ct){n.tag=14,n=zg(null,n,t,r,a);break t}else if(c===et){n.tag=10,n.type=t,n=jg(null,n,a);break t}}throw n=Dt(t)||t,Error(s(306,n,""))}}return n;case 0:return Th(t,n,n.type,n.pendingProps,a);case 1:return r=n.type,c=Sr(r,n.pendingProps),kg(t,n,r,c,a);case 3:t:{if(W(n,n.stateNode.containerInfo),t===null)throw Error(s(387));r=n.pendingProps;var u=n.memoizedState;c=u.element,Jf(t,n),ul(n,r,null,a);var _=n.memoizedState;if(r=_.cache,Rs(n,Cn,r),r!==u.cache&&Yf(n,[Cn],a,!0),cl(),r=_.element,u.isDehydrated)if(u={element:r,isDehydrated:!1,cache:_.cache},n.updateQueue.baseState=u,n.memoizedState=u,n.flags&256){n=Xg(t,n,r,a);break t}else if(r!==c){c=Zi(Error(s(424)),n),il(c),n=Xg(t,n,r,a);break t}else for(t=n.stateNode.containerInfo,t.nodeType===9?t=t.body:t=t.nodeName==="HTML"?t.ownerDocument.body:t,fn=ta(t.firstChild),kn=n,Oe=!0,Ts=null,Ji=!0,a=F0(n,null,r,a),n.child=a;a;)a.flags=a.flags&-3|134221824,a=a.sibling;else{if(ur(),r===c){n=as(t,n,a);break t}Bn(t,n,r,a)}n=n.child}return n;case 26:return eo(t,n),t===null?(a=Sv(n.type,null,n.pendingProps,null))?n.memoizedState=a:Oe||(n.stateNode=$_(n.type,n.pendingProps,We.current,n)):n.memoizedState=Sv(n.type,t.memoizedProps,n.pendingProps,t.memoizedState),null;case 27:return Ue(n),t===null&&Oe&&(r=n.stateNode=gv(n.type,n.pendingProps,We.current),kn=n,Ji=!0,c=fn,Vs(n.type)?(wd=c,fn=ta(r.firstChild)):fn=c),Bn(t,n,n.pendingProps.children,a),eo(t,n),t===null&&(n.flags|=4194304),n.child;case 5:return t===null&&Oe&&((c=r=fn)&&(r=eE(r,n.type,n.pendingProps,Ji),r!==null?(n.stateNode=r,kn=n,fn=ta(r.firstChild),Ji=!1,c=!0):c=!1),c||As(n)),Ue(n),c=n.type,u=n.pendingProps,_=t!==null?t.memoizedProps:null,r=u.children,xd(c,u)?r=null:_!==null&&xd(c,_)&&(n.flags|=32),n.memoizedState!==null&&(c=rh(t,n,Ky,null,null,a),So._currentValue=c),eo(t,n),Bn(t,n,r,a),n.child;case 6:return t===null&&Oe&&((t=a=fn)&&(a=nE(a,n.pendingProps,Ji),a!==null?(n.stateNode=a,kn=n,fn=null,t=!0):t=!1),t||As(n)),null;case 13:return Wg(t,n,a);case 4:return W(n,n.stateNode.containerInfo),r=n.pendingProps,t===null?n.child=vr(n,null,r,a):Bn(t,n,r,a),n.child;case 11:return Ig(t,n,n.type,n.pendingProps,a);case 7:return r=n.pendingProps,eo(t,n),Bn(t,n,r,a),n.child;case 8:return Bn(t,n,n.pendingProps.children,a),n.child;case 12:return Bn(t,n,n.pendingProps.children,a),n.child;case 10:return jg(t,n,a);case 9:return c=n.type._context,r=n.pendingProps.children,dr(n),c=Zn(c),r=r(c),n.flags|=1,Bn(t,n,r,a),n.child;case 14:return zg(t,n,n.type,n.pendingProps,a);case 15:return Bg(t,n,n.type,n.pendingProps,a);case 19:return Dh(t,n,a);case 31:return sM(t,n,a);case 22:return Fg(t,n,a,n.pendingProps);case 24:return dr(n),r=Zn(Cn),t===null?(c=Zf(),c===null&&(c=cn,u=qf(),c.pooledCache=u,u.refCount++,u!==null&&(c.pooledCacheLanes|=a),c=u),n.memoizedState={parent:r,cache:c},Qf(n),Rs(n,Cn,c)):((t.lanes&a)!==0&&(Jf(t,n),ul(n,null,null,a),cl()),c=t.memoizedState,u=n.memoizedState,c.parent!==r?(c={parent:r,cache:r},n.memoizedState=c,n.lanes===0&&(n.memoizedState=n.updateQueue.baseState=c),Rs(n,Cn,r)):(r=u.cache,Rs(n,Cn,r),r!==c.cache&&Yf(n,[Cn],a,!0))),Bn(t,n,n.pendingProps.children,a),n.child;case 30:return n.stateNode===null&&(n.stateNode={autoName:null,paired:null,clones:null,ref:null}),r=n.pendingProps,r.name!=null&&r.name!=="auto"?n.flags|=t===null?18882560:18874368:Oe&&xc(n),t!==null&&t.memoizedProps.name!==r.name?n.flags|=4194816:eo(t,n),Bn(t,n,r.children,a),n.child;case 29:throw n.pendingProps}throw Error(s(156,n.tag))}function ss(t){t.flags|=4}function Lh(t,n,a,r,c){var u;if((u=(t.mode&32)!==0)&&(u=a===null?bv(n,r):bv(n,r)&&(r.src!==a.src||r.srcSet!==a.srcSet)),u){if(t.flags|=16777216,(c&335544128)===c)if(t.stateNode.complete)t.flags|=8192;else if(N_())t.flags|=8192;else throw _r=Ac,Kf}else t.flags&=-16777217}function Kg(t,n){if(n.type!=="stylesheet"||(n.state.loading&4)!==0)t.flags&=-16777217;else if(t.flags|=16777216,!Tv(n))if(N_())t.flags|=8192;else throw _r=Ac,Kf}function Wc(t,n){n!==null&&(t.flags|=4),t.flags&16384&&(n=t.tag!==22?ya():536870912,t.lanes|=n,ro|=n)}function gl(t,n){if(!Oe)switch(t.tailMode){case"visible":break;case"collapsed":for(var a=t.tail,r=null;a!==null;)a.alternate!==null&&(r=a),a=a.sibling;r===null?n||t.tail===null?t.tail=null:t.tail.sibling=null:r.sibling=null;break;default:for(n=t.tail,a=null;n!==null;)n.alternate!==null&&(a=n),n=n.sibling;a===null?t.tail=null:a.sibling=null}}function hn(t){var n=t.alternate!==null&&t.alternate.child===t.child,a=0,r=0;if(n)for(var c=t.child;c!==null;)a|=c.lanes|c.childLanes,r|=c.subtreeFlags&1206910976,r|=c.flags&1206910976,c.return=t,c=c.sibling;else for(c=t.child;c!==null;)a|=c.lanes|c.childLanes,r|=c.subtreeFlags,r|=c.flags,c.return=t,c=c.sibling;return t.subtreeFlags|=r,t.childLanes=a,n}function lM(t,n,a){var r=n.pendingProps;switch(Vf(n),n.tag){case 16:case 15:case 0:case 11:case 7:case 8:case 12:case 9:case 14:return hn(n),null;case 1:return hn(n),null;case 3:return a=n.stateNode,r=null,t!==null&&(r=t.memoizedState.cache),n.memoizedState.cache!==r&&(n.flags|=2048),es(Cn),un(),a.pendingContext&&(a.context=a.pendingContext,a.pendingContext=null),(t===null||t.child===null)&&(jr(n)?ss(n):t===null||t.memoizedState.isDehydrated&&(n.flags&256)===0||(n.flags|=1024,Xf())),hn(n),null;case 26:var c=n.type,u=n.memoizedState;return t===null?(ss(n),u!==null?(hn(n),Kg(n,u)):(hn(n),Lh(n,c,null,r,a))):u?u!==t.memoizedState?(ss(n),hn(n),Kg(n,u)):(hn(n),n.flags&=-16777217):(t=t.memoizedProps,t!==r&&ss(n),hn(n),Lh(n,c,t,r,a)),null;case 27:if(P(n),a=We.current,c=n.type,t!==null&&n.stateNode!=null)t.memoizedProps!==r&&ss(n);else{if(!r){if(n.stateNode===null)throw Error(s(166));return hn(n),n.subtreeFlags&=-33554433,null}t=Ke.current,jr(n)?w0(n):(t=gv(c,r,a),n.stateNode=t,ss(n))}return hn(n),n.subtreeFlags&=-33554433,null;case 5:if(P(n),c=n.type,t!==null&&n.stateNode!=null)t.memoizedProps!==r&&ss(n);else{if(!r){if(n.stateNode===null)throw Error(s(166));return hn(n),n.subtreeFlags&=-33554433,null}if(u=Ke.current,jr(n))w0(n);else{var _=Rl(We.current);switch(u){case 1:u=_.createElementNS("http://www.w3.org/2000/svg",c);break;case 2:u=_.createElementNS("http://www.w3.org/1998/Math/MathML",c);break;default:switch(c){case"svg":u=_.createElementNS("http://www.w3.org/2000/svg",c);break;case"math":u=_.createElementNS("http://www.w3.org/1998/Math/MathML",c);break;case"script":u=_.createElement("div"),u.innerHTML="<script><\/script>",u=u.removeChild(u.firstChild);break;case"select":u=typeof r.is=="string"?_.createElement("select",{is:r.is}):_.createElement("select"),r.multiple?u.multiple=!0:r.size&&(u.size=r.size);break;default:u=typeof r.is=="string"?_.createElement(c,{is:r.is}):_.createElement(c)}}u[R]=n,u[H]=r;t:for(_=n.child;_!==null;){if(_.tag===5||_.tag===6)u.appendChild(_.stateNode);else if(_.tag!==4&&_.tag!==27&&_.child!==null){_.child.return=_,_=_.child;continue}if(_===n)break t;for(;_.sibling===null;){if(_.return===null||_.return===n)break t;_=_.return}_.sibling.return=_.return,_=_.sibling}n.stateNode=u;t:switch($n(u,c,r),c){case"button":case"input":case"select":case"textarea":r=!!r.autoFocus;break t;case"img":r=!0;break t;default:r=!1}r&&ss(n)}}return hn(n),n.subtreeFlags&=-33554433,Lh(n,n.type,t===null?null:t.memoizedProps,n.pendingProps,a),null;case 6:if(t&&n.stateNode!=null)t.memoizedProps!==r&&ss(n);else{if(typeof r!="string"&&n.stateNode===null)throw Error(s(166));if(t=We.current,jr(n)){if(t=n.stateNode,a=n.memoizedProps,r=null,c=kn,c!==null)switch(c.tag){case 27:case 5:r=c.memoizedProps}t[R]=n,t=!!(t.nodeValue===a||r!==null&&r.suppressHydrationWarning===!0||Z_(t.nodeValue,a)),t||As(n,!0)}else t=Rl(t).createTextNode(r),t[R]=n,n.stateNode=t}return hn(n),null;case 31:if(a=n.memoizedState,t===null||t.memoizedState!==null){if(r=jr(n),a!==null){if(t===null){if(!r)throw Error(s(318));if(t=n.memoizedState,t=t!==null?t.dehydrated:null,!t)throw Error(s(557));t[R]=n}else ur(),(n.flags&128)===0&&(n.memoizedState=null),n.flags|=4;hn(n),t=!1}else a=Xf(),t!==null&&t.memoizedState!==null&&(t.memoizedState.hydrationErrors=a),t=!0;if(!t)return n.flags&256?(Di(n),n):(Di(n),null);if((n.flags&128)!==0)throw Error(s(558))}return hn(n),null;case 13:if(r=n.memoizedState,t===null||t.memoizedState!==null&&t.memoizedState.dehydrated!==null){if(c=jr(n),r!==null&&r.dehydrated!==null){if(t===null){if(!c)throw Error(s(318));if(c=n.memoizedState,c=c!==null?c.dehydrated:null,!c)throw Error(s(317));c[R]=n}else ur(),(n.flags&128)===0&&(n.memoizedState=null),n.flags|=4;hn(n),c=!1}else c=Xf(),t!==null&&t.memoizedState!==null&&(t.memoizedState.hydrationErrors=c),c=!0;if(!c)return n.flags&256?(Di(n),n):(Di(n),null)}return Di(n),(n.flags&128)!==0?(n.lanes=a,n):(a=r!==null,t=t!==null&&t.memoizedState!==null,a&&(r=n.child,c=null,r.alternate!==null&&r.alternate.memoizedState!==null&&r.alternate.memoizedState.cachePool!==null&&(c=r.alternate.memoizedState.cachePool.pool),u=null,r.memoizedState!==null&&r.memoizedState.cachePool!==null&&(u=r.memoizedState.cachePool.pool),u!==c&&(r.flags|=2048)),a!==t&&a&&(n.child.flags|=8192),Wc(n,n.updateQueue),hn(n),null);case 4:return un(),t===null&&pd(n.stateNode.containerInfo),n.flags|=67108864,hn(n),null;case 10:return es(n.type),hn(n),null;case 19:if(ah(n),r=n.memoizedState,r===null)return hn(n),null;if(c=(n.flags&128)!==0,u=r.rendering,u===null)if(c)gl(r,!1);else{if(En!==0||t!==null&&(t.flags&128)!==0)for(t=n.child;t!==null;){if(u=Nc(t),u!==null){for(n.flags|=128,gl(r,!1),t=u.updateQueue,n.updateQueue=t,Wc(n,t),n.subtreeFlags=0,t=a,a=n.child;a!==null;)E0(a,t),a=a.sibling;return fl(n,Qn.current&1|2),Oe&&$a(n,r.treeForkCount),n.child}t=t.sibling}r.tail!==null&&Kt()>iu&&(n.flags|=128,c=!0,gl(r,!1),n.lanes=4194304)}else{if(!c)if(t=Nc(u),t!==null){if(n.flags|=128,c=!0,t=t.updateQueue,n.updateQueue=t,Wc(n,t),gl(r,!0),r.tail===null&&r.tailMode!=="collapsed"&&r.tailMode!=="visible"&&!u.alternate&&!Oe)return hn(n),null}else 2*Kt()-r.renderingStartTime>iu&&a!==536870912&&(n.flags|=128,c=!0,gl(r,!1),n.lanes=4194304);r.isBackwards?(u.sibling=n.child,n.child=u):(t=r.last,t!==null?t.sibling=u:n.child=u,r.last=u)}if(r.tail!==null){t=r.tail;t:{for(a=t;a!==null;){if(a.alternate!==null){a=!1;break t}a=a.sibling}a=!0}return r.rendering=t,r.tail=t.sibling,r.renderingStartTime=Kt(),t.sibling=null,u=Qn.current,u=c?u&1|2:u&1,r.tailMode==="visible"||r.tailMode==="collapsed"||!a||Oe?fl(n,u):(a=u,fe(Kn,n),fe(Qn,a),ii===null&&(ii=n)),Oe&&$a(n,r.treeForkCount),t}return hn(n),null;case 22:case 23:return Di(n),nh(),r=n.memoizedState!==null,t!==null?t.memoizedState!==null!==r&&(n.flags|=8192):r&&(n.flags|=8192),r?(a&536870912)!==0&&(n.flags&128)===0&&(hn(n),n.subtreeFlags&6&&(n.flags|=8192)):hn(n),a=n.updateQueue,a!==null&&Wc(n,a.retryQueue),a=null,t!==null&&t.memoizedState!==null&&t.memoizedState.cachePool!==null&&(a=t.memoizedState.cachePool.pool),r=null,n.memoizedState!==null&&n.memoizedState.cachePool!==null&&(r=n.memoizedState.cachePool.pool),r!==a&&(n.flags|=2048),t!==null&&ce(mr),null;case 24:return a=null,t!==null&&(a=t.memoizedState.cache),n.memoizedState.cache!==a&&(n.flags|=2048),es(Cn),hn(n),null;case 25:return null;case 30:return n.flags|=33554432,hn(n),null}throw Error(s(156,n.tag))}function cM(t,n){switch(Vf(n),n.tag){case 1:return t=n.flags,t&65536?(n.flags=t&-65537|128,n):null;case 3:return es(Cn),un(),t=n.flags,(t&65536)!==0&&(t&128)===0?(n.flags=t&-65537|128,n):null;case 26:case 27:case 5:return P(n),null;case 31:if(n.memoizedState!==null){if(Di(n),n.alternate===null)throw Error(s(340));ur()}return t=n.flags,t&65536?(n.flags=t&-65537|128,n):null;case 13:if(Di(n),t=n.memoizedState,t!==null&&t.dehydrated!==null){if(n.alternate===null)throw Error(s(340));ur()}return t=n.flags,t&65536?(n.flags=t&-65537|128,n):null;case 19:return ah(n),t=n.flags,t&65536?(n.flags=t&-65537|128,t=n.memoizedState,t!==null&&(t.rendering=null,t.tail=null),n.flags|=4,n):null;case 4:return un(),null;case 10:return es(n.type),null;case 22:case 23:return Di(n),nh(),t!==null&&ce(mr),t=n.flags,t&65536?(n.flags=t&-65537|128,n):null;case 24:return es(Cn),null;case 25:return null;default:return null}}function Qg(t,n){switch(Vf(n),n.tag){case 3:es(Cn),un();break;case 26:case 27:case 5:P(n);break;case 4:un();break;case 31:n.memoizedState!==null&&Di(n);break;case 13:Di(n);break;case 19:ah(n);break;case 10:es(n.type);break;case 22:case 23:Di(n),nh(),t!==null&&ce(mr);break;case 24:es(Cn)}}function _l(t,n){try{var a=n.updateQueue,r=a!==null?a.lastEffect:null;if(r!==null){var c=r.next;a=c;do{if((a.tag&t)===t){r=void 0;var u=a.create,_=a.inst;r=u(),_.destroy=r}a=a.next}while(a!==c)}}catch(w){nn(n,n.return,w)}}function Ps(t,n,a){try{var r=n.updateQueue,c=r!==null?r.lastEffect:null;if(c!==null){var u=c.next;r=u;do{if((r.tag&t)===t){var _=r.inst,w=_.destroy;if(w!==void 0){_.destroy=void 0,c=n;var z=a,tt=w;try{tt()}catch(ft){nn(c,z,ft)}}}r=r.next}while(r!==u)}}catch(ft){nn(n,n.return,ft)}}function Jg(t){var n=t.updateQueue;if(n!==null){var a=t.stateNode;try{G0(n,a)}catch(r){nn(t,t.return,r)}}}function $g(t,n,a){a.props=Sr(t.type,t.memoizedProps),a.state=t.memoizedState;try{a.componentWillUnmount()}catch(r){nn(t,n,r)}}function Ra(t,n){try{var a=t.ref;if(a!==null){switch(t.tag){case 26:case 27:case 5:var r=t.stateNode;break;case 30:var c=t.stateNode,u=Ka(t.memoizedProps,c);(c.ref===null||c.ref.name!==u)&&(c.ref=rv(u)),r=c.ref;break;case 7:if(t.stateNode===null){var _=new Ii(t);v(t.child,!1,$M,_,void 0,void 0),t.stateNode=_}r=t.stateNode;break;default:r=t.stateNode}typeof a=="function"?t.refCleanup=a(r):a.current=r}}catch(w){nn(t,n,w)}}function Jn(t,n){var a=t.ref,r=t.refCleanup;if(a!==null)if(typeof r=="function")try{r()}catch(c){nn(t,n,c)}finally{t.refCleanup=null,t=t.alternate,t!=null&&(t.refCleanup=null)}else if(typeof a=="function")try{a(null)}catch(c){nn(t,n,c)}else a.current=null}function Yc(t,n){if((t.tag===5||t.tag===27||t.tag===6)&&t.alternate===null&&n!==null)for(var a=0;a<n.length;a++)hv(t.stateNode,n[a])}function t_(t){for(var n=t.return;n!==null&&(Ph(n)&&hv(t.stateNode,n.stateNode),!Oh(n));)n=n.return}function vl(t){for(var n=t.return;n!==null&&(Ph(n)&&tE(t.stateNode,n.stateNode),!Oh(n));)n=n.return}function Oh(t){return t.tag===5||t.tag===3||t.tag===27}function Ph(t){return t&&t.tag===7&&t.stateNode!==null}function Ih(t){var n=t.type,a=t.memoizedProps,r=t.stateNode;try{t:switch(n){case"button":case"input":case"select":case"textarea":a.autoFocus&&r.focus();break t;case"img":a.src?r.src=a.src:a.srcSet&&(r.srcset=a.srcSet)}}catch(c){nn(t,t.return,c)}}function zh(t,n,a){try{var r=t.stateNode;PM(r,t.type,a,n),r[H]=n}catch(c){nn(t,t.return,c)}}function e_(t){return t.tag===5||t.tag===3||t.tag===26||t.tag===27&&Vs(t.type)||t.tag===4}function Bh(t){t:for(;;){for(;t.sibling===null;){if(t.return===null||e_(t.return))return null;t=t.return}for(t.sibling.return=t.return,t=t.sibling;t.tag!==5&&t.tag!==6&&t.tag!==18;){if(t.tag===27&&Vs(t.type)||t.flags&2||t.child===null||t.tag===4)continue t;t.child.return=t,t=t.child}if(!(t.flags&2))return t.stateNode}}function Fh(t,n,a,r){var c=t.tag;if(c===5||c===6)c=t.stateNode,n?(a.nodeType===9?a.body:a.nodeName==="HTML"?a.ownerDocument.body:a).insertBefore(c,n):(n=a.nodeType===9?a.body:a.nodeName==="HTML"?a.ownerDocument.body:a,n.appendChild(c),a=a._reactRootContainer,a!=null||n.onclick!==null||(n.onclick=qi)),Yc(t,r),yt=!0;else if(c!==4&&(c===27&&(Yc(t,r),r=null,Vs(t.type)&&(a=t.stateNode,n=null)),t=t.child,t!==null))for(Fh(t,n,a,r),t=t.sibling;t!==null;)Fh(t,n,a,r),t=t.sibling}function qc(t,n,a,r){var c=t.tag;if(c===5||c===6)c=t.stateNode,n?a.insertBefore(c,n):a.appendChild(c),Yc(t,r),yt=!0;else if(c!==4&&(c===27&&(Yc(t,r),r=null,Vs(t.type)&&(a=t.stateNode)),t=t.child,t!==null))for(qc(t,n,a,r),t=t.sibling;t!==null;)qc(t,n,a,r),t=t.sibling}function n_(t){var n=t.stateNode,a=t.memoizedProps;try{for(var r=t.type,c=n.attributes;c.length;)n.removeAttributeNode(c[0]);$n(n,r,a),n[R]=t,n[H]=a}catch(u){nn(t,t.return,u)}}var jc=!1,Ui=null;function i_(t){(t.tag===30||(t.subtreeFlags&33554432)!==0)&&(jc=!0)}var wa=null;function a_(){var t=wa;return wa=null,t}var _i=0;function no(t,n,a,r,c){return _i=0,s_(t.child,n,a,r,c)}function s_(t,n,a,r,c){for(var u=!1;t!==null;){if(t.tag===5){var _=t.stateNode;if(r!==null){var w=Md(_);r.push(w),w.view&&(u=!0)}else u||Md(_).view&&(u=!0);jc=!0,av(_,_i===0?n:n+"_"+_i,a),_i++}else(t.tag!==22||t.memoizedState===null)&&(t.tag===30&&c||s_(t.child,n,a,r,c)&&(u=!0));t=t.sibling}return u}function Ca(t,n){for(;t!==null;)t.tag===5?sv(t.stateNode,t.memoizedProps):(t.tag!==22||t.memoizedState===null)&&(t.tag===30&&n||Ca(t.child,n)),t=t.sibling}function Zc(t){if((t.subtreeFlags&18874368)!==0)for(t=t.child;t!==null;){if((t.tag!==22||t.memoizedState===null)&&(Zc(t),t.tag===30&&(t.flags&18874368)!==0&&t.stateNode.paired)){var n=t.memoizedProps;if(n.name==null||n.name==="auto")throw Error(s(544));var a=n.name;n=Qa(n.default,n.share),n!=="none"&&(no(t,a,n,null,!1)||Ca(t.child,!1))}t=t.sibling}}function Hh(t,n){if(t.tag===30){var a=t.stateNode,r=t.memoizedProps,c=Ka(r,a),u=Qa(r.default,a.paired?r.share:r.enter);u!=="none"?no(t,c,u,null,!1)?(Zc(t),a.paired||n||uo(t,r.onEnter)):Ca(t.child,!1):Zc(t)}else if((t.subtreeFlags&33554432)!==0)for(t=t.child;t!==null;)Hh(t,n),t=t.sibling;else Zc(t)}function Gh(t){if(Ui!==null&&Ui.size!==0){var n=Ui;if((t.subtreeFlags&18874368)!==0)for(t=t.child;t!==null;){if(t.tag!==22||t.memoizedState===null){if(t.tag===30&&(t.flags&18874368)!==0){var a=t.memoizedProps,r=a.name;if(r!=null&&r!=="auto"){var c=n.get(r);if(c!==void 0){var u=Qa(a.default,a.share);if(u!=="none"&&(no(t,r,u,null,!1)?(u=t.stateNode,c.paired=u,u.paired=c,uo(t,a.onShare)):Ca(t.child,!1)),n.delete(r),n.size===0)break}}}Gh(t)}t=t.sibling}}}function Vh(t){if(t.tag===30){var n=t.memoizedProps,a=Ka(n,t.stateNode),r=Ui!==null?Ui.get(a):void 0,c=Qa(n.default,r!==void 0?n.share:n.exit);c!=="none"&&(no(t,a,c,null,!1)?r!==void 0?(c=t.stateNode,r.paired=c,c.paired=r,Ui.delete(a),uo(t,n.onShare)):uo(t,n.onExit):Ca(t.child,!1)),Ui!==null&&Gh(t)}else if((t.subtreeFlags&33554432)!==0)for(t=t.child;t!==null;)Vh(t),t=t.sibling;else Ui!==null&&Gh(t)}function r_(t){for(t=t.child;t!==null;){if(t.tag===30){var n=t.memoizedProps,a=Ka(n,t.stateNode);n=Qa(n.default,n.update),t.flags&=-5,n!=="none"&&no(t,a,n,t.memoizedState=[],!1)}else(t.subtreeFlags&33554432)!==0&&r_(t);t=t.sibling}}function kh(t){if((t.subtreeFlags&18874368)!==0)for(t=t.child;t!==null;){if(t.tag!==22||t.memoizedState===null){if(t.tag===30&&(t.flags&18874368)!==0){var n=t.stateNode;n.paired!==null&&(n.paired=null,Ca(t.child,!1))}kh(t)}t=t.sibling}}function Kc(t){if(t.tag===30)t.stateNode.paired=null,Ca(t.child,!1),kh(t);else if((t.subtreeFlags&33554432)!==0)for(t=t.child;t!==null;)Kc(t),t=t.sibling;else kh(t)}function o_(t){for(t=t.child;t!==null;)t.tag===30?Ca(t.child,!1):(t.subtreeFlags&33554432)!==0&&o_(t),t=t.sibling}function Xh(t,n,a,r,c,u,_){for(var w=!1;n!==null;){if(n.tag===5){var z=n.stateNode;if(u!==null&&_i<u.length){var tt=u[_i],ft=Md(z);(tt.view||ft.view)&&(w=!0);var Tt;if(Tt=(t.flags&4)===0)if(ft.clip)Tt=!0;else{Tt=tt.rect;var K=ft.rect;Tt=Tt.y!==K.y||Tt.x!==K.x||Tt.height!==K.height||Tt.width!==K.width}Tt&&(t.flags|=4),ft.abs?ft=!tt.abs:(tt=tt.rect,ft=ft.rect,ft=tt.height!==ft.height||tt.width!==ft.width),ft&&(t.flags|=32)}else t.flags|=32;(t.flags&4)!==0&&av(z,_i===0?a:a+"_"+_i,c),w&&(t.flags&4)!==0||(wa===null&&(wa=[]),wa.push(z,_i===0?r:r+"_"+_i,n.memoizedProps)),_i++}else(n.tag!==22||n.memoizedState===null)&&(n.tag===30&&_?t.flags|=n.flags&32:Xh(t,n.child,a,r,c,u,_)&&(w=!0));n=n.sibling}return w}function l_(t,n){for(t=t.child;t!==null;){if(t.tag===30){var a=t.memoizedProps,r=t.stateNode,c=Ka(a,r),u=Qa(a.default,a.update),_;_=t.memoizedState,t.memoizedState=null,r=t;var w=t.child;_i=0,c=Xh(r,w,c,c,u,_,!1),(t.flags&4)!==0&&c&&uo(t,a.onUpdate)}else(t.subtreeFlags&33554432)!==0&&l_(t);t=t.sibling}}var Xn=!1,tn=!1,Na=!1,Wh=!1,c_=typeof WeakSet=="function"?WeakSet:Set,Wn=null,Da=!1,xl=!1,Qc=!1,Yh=!1;function uM(t,n,a){if(t=t.containerInfo,_d=yo,t=d0(t),Uf(t)){if("selectionStart"in t)var r={start:t.selectionStart,end:t.selectionEnd};else t:{r=(r=t.ownerDocument)&&r.defaultView||window;var c=r.getSelection&&r.getSelection();if(c&&c.rangeCount!==0){r=c.anchorNode;var u=c.anchorOffset,_=c.focusNode;c=c.focusOffset;try{r.nodeType,_.nodeType}catch{r=null;break t}var w=0,z=-1,tt=-1,ft=0,Tt=0,K=t,lt=null;e:for(;;){for(var Xt;K!==r||u!==0&&K.nodeType!==3||(z=w+u),K!==_||c!==0&&K.nodeType!==3||(tt=w+c),K.nodeType===3&&(w+=K.nodeValue.length),(Xt=K.firstChild)!==null;)lt=K,K=Xt;for(;;){if(K===t)break e;if(lt===r&&++ft===u&&(z=w),lt===_&&++Tt===c&&(tt=w),(Xt=K.nextSibling)!==null)break;K=lt,lt=K.parentNode}K=Xt}r=z===-1||tt===-1?null:{start:z,end:tt}}else r=null}r=r||{start:0,end:0}}else r=null;for(vd={focusedElem:t,selectionRange:r},yo=!1,a=(a&335544064)===a,Wn=n,n=a?9270:1024;Wn!==null;){if(t=Wn,a&&(r=t.deletions,r!==null))for(u=0;u<r.length;u++)a&&Vh(r[u]);if(t.alternate===null&&(t.flags&2)!==0)a&&i_(t),Jc(a);else{if(t.tag===22){if(r=t.alternate,t.memoizedState!==null){r!==null&&r.memoizedState===null&&a&&Vh(r),Jc(a);continue}else if(r!==null&&r.memoizedState!==null){a&&i_(t),Jc(a);continue}}r=t.child,(t.subtreeFlags&n)!==0&&r!==null?(r.return=t,Wn=r):(a&&r_(t),Jc(a))}}Ui=null}function Jc(t){for(;Wn!==null;){var n=Wn,a=t,r=n.alternate,c=n.flags;switch(n.tag){case 0:case 11:case 15:break;case 1:if((c&1024)!==0&&r!==null){a=void 0,c=r.memoizedProps,r=r.memoizedState;var u=n.stateNode;try{var _=Sr(n.type,c);a=u.getSnapshotBeforeUpdate(_,r),u.__reactInternalSnapshotBeforeUpdate=a}catch(w){nn(n,n.return,w)}}break;case 3:if((c&1024)!==0){if(r=n.stateNode.containerInfo,a=r.nodeType,a===9)Td(r);else if(a===1)switch(r.nodeName){case"HEAD":case"HTML":case"BODY":Td(r);break;default:r.textContent=""}}break;case 5:case 26:case 27:case 6:case 4:case 17:break;case 30:a&&r!==null&&(a=Ka(r.memoizedProps,r.stateNode),c=n.memoizedProps,c=Qa(c.default,c.update),c!=="none"&&no(r,a,c,r.memoizedState=[],!0));break;default:if((c&1024)!==0)throw Error(s(163))}if(r=n.sibling,r!==null){r.return=n.return,Wn=r;break}Wn=n.return}}function u_(t,n,a){var r=a.flags;switch(a.tag){case 0:case 11:case 15:Ua(t,a),r&4&&_l(5,a);break;case 1:if(Ua(t,a),r&4)if(t=a.stateNode,n===null)try{t.componentDidMount()}catch(_){nn(a,a.return,_)}else{var c=Sr(a.type,n.memoizedProps);n=n.memoizedState;try{t.componentDidUpdate(c,n,t.__reactInternalSnapshotBeforeUpdate)}catch(_){nn(a,a.return,_)}}r&64&&Jg(a),r&512&&Ra(a,a.return);break;case 3:if(Ua(t,a),r&64&&(t=a.updateQueue,t!==null)){if(n=null,a.child!==null)switch(a.child.tag){case 27:case 5:n=a.child.stateNode;break;case 1:n=a.child.stateNode}try{G0(t,n)}catch(_){nn(a,a.return,_)}}break;case 27:n===null&&r&4&&n_(a);case 26:case 5:Ua(t,a),n===null&&r&4&&Ih(a),r&512&&Ra(a,a.return);break;case 12:Ua(t,a);break;case 31:Ua(t,a),r&4&&p_(t,a);break;case 13:Ua(t,a),r&4&&m_(t,a),r&64&&(t=a.memoizedState,t!==null&&(t=t.dehydrated,t!==null&&(a=MM.bind(null,a),iE(t,a))));break;case 22:if(r=a.memoizedState!==null||Xn,!r){var u=n!==null&&n.memoizedState!==null||tn;n=Xn,c=tn,Xn=r,(tn=u)&&!c?(r=2,(a.subtreeFlags&8772)!==0&&(r|=1),fa(t,a,r)):Ua(t,a),Xn=n,tn=c}break;case 30:Ua(t,a),r&512&&Ra(a,a.return);break;case 7:r&512&&Ra(a,a.return);default:Ua(t,a)}}function qh(t,n){for(t=t.child;t!==null;)f_(t,n),t=t.sibling}function f_(t,n){switch(t.tag){case 5:case 26:try{var a=t.stateNode;if(n){var r=a.style;typeof r.setProperty=="function"?r.setProperty("display","none","important"):r.display="none"}else{var c=t.stateNode,u=t.memoizedProps.style,_=u!=null&&u.hasOwnProperty("display")?u.display:null;c.style.display=_==null||typeof _=="boolean"?"":(""+_).trim()}}catch(z){nn(t,t.return,z)}jh(t,n);break;case 6:try{t.stateNode.nodeValue=n?"":t.memoizedProps,yt=!0}catch(z){nn(t,t.return,z)}break;case 18:try{var w=t.stateNode;n?iv(w,!0):iv(t.stateNode,!1)}catch(z){nn(t,t.return,z)}break;case 22:case 23:t.memoizedState===null&&qh(t,n);break;default:qh(t,n)}}function jh(t,n){if(t.subtreeFlags&67108864)for(t=t.child;t!==null;){t:{var a=t,r=n;switch(a.tag){case 4:f_(a,r);break t;case 22:a.memoizedState===null&&jh(a,r);break t;default:jh(a,r)}}t=t.sibling}}function h_(t){var n=t.alternate;n!==null&&(t.alternate=null,h_(n)),t.child=null,t.deletions=null,t.sibling=null,t.tag===5&&(n=t.stateNode,n!==null&&ee(n)),t.stateNode=null,t.return=null,t.dependencies=null,t.memoizedProps=null,t.memoizedState=null,t.pendingProps=null,t.stateNode=null,t.updateQueue=null}var mn=null,vi=!1;function ca(t,n,a){for(a=a.child;a!==null;)d_(t,n,a),a=a.sibling}function d_(t,n,a){if(Yt&&typeof Yt.onCommitFiberUnmount=="function")try{Yt.onCommitFiberUnmount(se,a)}catch{}switch(a.tag){case 26:tn||Jn(a,n),ca(t,n,a),a.memoizedState?a.memoizedState.count--:a.stateNode&&!tn&&(a=a.stateNode,a.parentNode.removeChild(a));break;case 27:tn||Jn(a,n),vl(a);var r=mn,c=vi;Vs(a.type)&&(mn=a.stateNode,vi=!1),ca(t,n,a),_v(a.stateNode,a.type,a.memoizedProps),mn=r,vi=c;break;case 5:tn||Jn(a,n),vl(a);case 6:if(a.tag===6&&vl(a),r=mn,c=vi,mn=null,ca(t,n,a),mn=r,vi=c,mn!==null)if(vi)try{(mn.nodeType===9?mn.body:mn.nodeName==="HTML"?mn.ownerDocument.body:mn).removeChild(a.stateNode),yt=!0}catch(u){nn(a,n,u)}else try{mn.removeChild(a.stateNode),yt=!0}catch(u){nn(a,n,u)}break;case 18:mn!==null&&(vi?(t=mn,nv(t.nodeType===9?t.body:t.nodeName==="HTML"?t.ownerDocument.body:t,a.stateNode),Mo(t)):nv(mn,a.stateNode));break;case 4:r=mn,c=vi,mn=a.stateNode.containerInfo,vi=!0,ca(t,n,a),mn=r,vi=c;break;case 0:case 11:case 14:case 15:Ps(2,a,n),tn||Ps(4,a,n),ca(t,n,a);break;case 1:tn||(Jn(a,n),r=a.stateNode,typeof r.componentWillUnmount=="function"&&$g(a,n,r)),ca(t,n,a);break;case 21:ca(t,n,a);break;case 22:tn=(r=tn)||a.memoizedState!==null,ca(t,n,a),tn=r;break;case 30:Jn(a,n),ca(t,n,a);break;case 7:tn||Jn(a,n),ca(t,n,a);break;default:ca(t,n,a)}}function p_(t,n){if(n.memoizedState===null&&(t=n.alternate,t!==null&&(t=t.memoizedState,t!==null))){t=t.dehydrated;try{Mo(t)}catch(a){nn(n,n.return,a)}}}function m_(t,n){if(n.memoizedState===null&&(t=n.alternate,t!==null&&(t=t.memoizedState,t!==null&&(t=t.dehydrated,t!==null))))try{Mo(t)}catch(a){nn(n,n.return,a)}}function fM(t){switch(t.tag){case 31:case 13:case 19:var n=t.stateNode;return n===null&&(n=t.stateNode=new c_),n;case 22:return t=t.stateNode,n=t._retryCache,n===null&&(n=t._retryCache=new c_),n;default:throw Error(s(435,t.tag))}}function $c(t,n){var a=fM(t);n.forEach(function(r){if(!a.has(r)){a.add(r);var c=EM.bind(null,t,r);r.then(c,c)}})}function ui(t,n,a){var r=n.deletions;if(r!==null)for(var c=0;c<r.length;c++){var u=r[c],_=t,w=n,z=w;t:for(;z!==null;){switch(z.tag){case 27:if(Vs(z.type)){mn=z.stateNode,vi=!1;break t}break;case 5:mn=z.stateNode,vi=!1;break t;case 3:case 4:mn=z.stateNode.containerInfo,vi=!0;break t}z=z.return}if(mn===null)throw Error(s(160));d_(_,w,u),mn=null,vi=!1,_=u.alternate,_!==null&&(_.return=null),u.return=null}if(n.subtreeFlags&13886)for(n=n.child;n!==null;)g_(n,t,a),n=n.sibling}var ua=null;function g_(t,n,a){var r=t.alternate,c=t.flags;switch(t.tag){case 0:case 11:case 14:case 15:if(c&4&&(r=t.updateQueue,r=r!==null?r.events:null,r!==null))for(var u=0;u<r.length;u++){var _=r[u];_.ref.impl=_.nextImpl}ui(n,t,a),fi(t),c&4&&(Ps(3,t,t.return),_l(3,t),Ps(5,t,t.return));break;case 1:ui(n,t,a),fi(t),c&512&&(tn||r===null||Jn(r,r.return)),c&64&&Xn&&(t=t.updateQueue,t!==null&&(n=t.callbacks,n!==null&&(a=t.shared.hiddenCallbacks,t.shared.hiddenCallbacks=a===null?n:a.concat(n))));break;case 26:if(u=ua,ui(n,t,a),fi(t),c&512&&(tn||r===null||Jn(r,r.return)),c&4)if(c=r!==null?r.memoizedState:null,a=t.memoizedState,r===null)if(a===null)if(t.stateNode===null)if(Xn)t.stateNode=$_(t.type,t.memoizedProps,n.containerInfo,t);else{t:{n=t.type,a=t.memoizedProps,c=u.ownerDocument||u;e:switch(n){case"title":r=c.getElementsByTagName("title")[0],(!r||r[Bt]||r[R]||r.namespaceURI==="http://www.w3.org/2000/svg"||r.hasAttribute("itemprop"))&&(r=c.createElement(n),c.head.insertBefore(r,c.querySelector("head > title"))),$n(r,n,a),r[R]=t,we(r),n=r;break t;case"link":if(u=Ev("link","href",c).get(n+(a.href||""))){for(_=0;_<u.length;_++)if(r=u[_],r.getAttribute("href")===(a.href==null||a.href===""?null:a.href)&&r.getAttribute("rel")===(a.rel==null?null:a.rel)&&r.getAttribute("title")===(a.title==null?null:a.title)&&r.getAttribute("crossorigin")===(a.crossOrigin==null?null:a.crossOrigin)){u.splice(_,1);break e}}r=c.createElement(n),$n(r,n,a),c.head.appendChild(r);break;case"meta":if(u=Ev("meta","content",c).get(n+(a.content||""))){for(_=0;_<u.length;_++)if(r=u[_],r.getAttribute("content")===(a.content==null?null:""+a.content)&&r.getAttribute("name")===(a.name==null?null:a.name)&&r.getAttribute("property")===(a.property==null?null:a.property)&&r.getAttribute("http-equiv")===(a.httpEquiv==null?null:a.httpEquiv)&&r.getAttribute("charset")===(a.charSet==null?null:a.charSet)){u.splice(_,1);break e}}r=c.createElement(n),$n(r,n,a),c.head.appendChild(r);break;default:throw Error(s(468,n))}r[R]=t,we(r),n=r}t.stateNode=n}else Xn||Ud(u,t.type,t.stateNode);else t.stateNode=Mv(u,a,t.memoizedProps);else c!==a?(c===null?(n=r.stateNode,n===null||tn||n.parentNode.removeChild(n)):c.count--,a===null?Xn||Ud(u,t.type,t.stateNode):Mv(u,a,t.memoizedProps)):a===null&&t.stateNode!==null&&zh(t,t.memoizedProps,r.memoizedProps);break;case 27:ui(n,t,a),fi(t),c&512&&(tn||r===null||Jn(r,r.return)),r!==null&&c&4&&zh(t,t.memoizedProps,r.memoizedProps);break;case 5:if(u=Na,Na=!1,ui(n,t,a),Na=u,fi(t),c&512&&(tn||r===null||Jn(r,r.return)),t.flags&32){n=t.stateNode;try{zn(n,""),yt=!0}catch(ft){nn(t,t.return,ft)}}c&4&&t.stateNode!=null&&(n=t.memoizedProps,zh(t,n,r!==null?r.memoizedProps:n)),c&1024&&(Wh=!0);break;case 6:if(ui(n,t,a),fi(t),c&4){if(t.stateNode===null)throw Error(s(162));n=t.memoizedProps,a=t.stateNode;try{a.nodeValue=n,yt=!0}catch(ft){nn(t,t.return,ft)}}break;case 3:if(yt=!1,pu=null,u=ua,ua=wl(n.containerInfo),ui(n,t,a),ua=u,fi(t),c&4&&r!==null&&r.memoizedState.isDehydrated)try{Mo(n.containerInfo)}catch(ft){nn(t,t.return,ft)}Wh&&(Wh=!1,__(t)),yt=!1;break;case 4:c=Na,Na=Xn,r=Rt(),u=ua,ua=wl(t.stateNode.containerInfo),ui(n,t,a),fi(t),ua=u,yt&&xl&&(Qc=!0),yt=r,Na=c;break;case 12:ui(n,t,a),fi(t);break;case 31:ui(n,t,a),fi(t),c&4&&(n=t.updateQueue,n!==null&&(t.updateQueue=null,$c(t,n)));break;case 13:ui(n,t,a),fi(t),t.child.flags&8192&&t.memoizedState!==null!=(r!==null&&r.memoizedState!==null)&&(nu=Kt()),c&4&&(n=t.updateQueue,n!==null&&(t.updateQueue=null,$c(t,n)));break;case 22:u=t.memoizedState!==null,_=r!==null&&r.memoizedState!==null;var w=Xn,z=tn,tt=Na;Xn=w||u,Na=tt||u,tn=z||_,ui(n,t,a),tn=z,Na=tt,Xn=w,fi(t),c&8192&&(n=t.stateNode,n._visibility=u?n._visibility&-2:n._visibility|1,!u||r===null||_||Xn||tn||(n=_||tn,a=Xn,r=tn,Xn=u||Xn,tn=n,Is(t,2),Xn=a,tn=r),!u&&Na||qh(t,u)),c&4&&(n=t.updateQueue,n!==null&&(a=n.retryQueue,a!==null&&(n.retryQueue=null,$c(t,a))));break;case 19:ui(n,t,a),fi(t),c&4&&(n=t.updateQueue,n!==null&&(t.updateQueue=null,$c(t,n)));break;case 30:c&512&&(tn||r===null||Jn(r,r.return)),c=Rt(),u=xl,_=(a&335544064)===a,w=t.memoizedProps,xl=_&&Qa(w.default,w.update)!=="none",ui(n,t,a),fi(t),_&&r!==null&&yt&&(t.flags|=4),xl=u,yt=c;break;case 21:break;case 7:c&512&&(tn||r===null||Jn(r,r.return)),r&&r.stateNode!==null&&(r.stateNode._fragmentFiber=t);default:ui(n,t,a),fi(t)}}function fi(t){var n=t.flags;if(n&2){try{for(var a,r=t.return;r!==null;){if(e_(r)){a=r;break}r=r.return}r=null;for(var c=t.return;c!==null;){if(Ph(c)){var u=c.stateNode;r===null?r=[u]:r.push(u)}if(Oh(c))break;c=c.return}var _=r;if(a==null)throw Error(s(160));switch(a.tag){case 27:var w=a.stateNode,z=Bh(t);qc(t,z,w,_);break;case 5:var tt=a.stateNode;a.flags&32&&(zn(tt,""),a.flags&=-33);var ft=Bh(t);qc(t,ft,tt,_);break;case 3:case 4:var Tt=a.stateNode.containerInfo,K=Bh(t);Fh(t,K,Tt,_);break;default:throw Error(s(161))}}catch(lt){nn(t,t.return,lt)}t.flags&=-3}n&4096&&(t.flags&=-4097)}function __(t){if(t.subtreeFlags&1024)for(t=t.child;t!==null;){var n=t;__(n),n.tag===5&&n.flags&1024&&(n=n.stateNode,yo=!0,n.reset(),yo=!1),t=t.sibling}}function io(t,n){if(n.subtreeFlags&9270)for(n=n.child;n!==null;)v_(n,t),n=n.sibling;else l_(n)}function v_(t,n){var a=t.alternate;if(a===null)Hh(t,!1);else switch(t.tag){case 3:if(Yh=Da=!1,a_(),io(n,t),!Da&&!Qc){if(t=wa,t!==null)for(var r=0;r<t.length;r+=3){a=t[r];var c=t[r+1];sv(a,t[r+2]),a=a.ownerDocument.documentElement,a!==null&&a.animate({opacity:[0,0],pointerEvents:["none","none"]},{duration:0,fill:"forwards",pseudoElement:"::view-transition-group("+c+")"})}t=n.containerInfo,t=t.nodeType===9?t.documentElement:t.ownerDocument.documentElement,t!==null&&t.style.viewTransitionName===""&&(t.style.viewTransitionName="none",t.animate({opacity:[0,0],pointerEvents:["none","none"]},{duration:0,fill:"forwards",pseudoElement:"::view-transition-group(root)"}),t.animate({width:[0,0],height:[0,0]},{duration:0,fill:"forwards",pseudoElement:"::view-transition"})),Yh=!0}wa=null;break;case 5:io(n,t);break;case 4:r=Da,Da=!1,io(n,t),Da&&(Qc=!0),Da=r;break;case 22:t.memoizedState===null&&(a.memoizedState!==null?Hh(t,!1):io(n,t));break;case 30:r=Da,c=a_(),Da=!1,io(n,t),Da&&(t.flags|=4);var u=t.memoizedProps,_=t.stateNode;n=Ka(u,_),_=Ka(a.memoizedProps,_);var w=Qa(u.default,u.update);w==="none"?n=!1:(u=a.memoizedState,a.memoizedState=null,a=t.child,_i=0,n=Xh(t,a,n,_,w,u,!0),_i!==(u===null?0:u.length)&&(t.flags|=32)),(t.flags&4)!==0&&n?(uo(t,t.memoizedProps.onUpdate),wa=c):c!==null&&(c.push.apply(c,wa),wa=c),Da=(t.flags&32)!==0?!0:r;break;default:io(n,t)}}function Ua(t,n){if(n.subtreeFlags&8772)for(n=n.child;n!==null;)u_(t,n.alternate,n),n=n.sibling}function Is(t,n){for(t=t.child;t!==null;){var a=t,r=n;switch(a.tag){case 0:case 11:case 14:case 15:Ps(4,a,a.return),Is(a,r);break;case 1:Jn(a,a.return);var c=a.stateNode;typeof c.componentWillUnmount=="function"&&$g(a,a.return,c),Is(a,r);break;case 27:(r&2)!==0&&_v(a.stateNode,a.type,a.memoizedProps);case 5:Jn(a,a.return),a.tag!==5&&a.tag!==27||vl(a),Is(a,r);break;case 6:vl(a);break;case 26:Jn(a,a.return),c=a.stateNode,a.memoizedState!==null||c===null||tn||c.parentNode.removeChild(c),Is(a,r);break;case 22:a.memoizedState===null&&Is(a,r);break;case 30:Jn(a,a.return),Is(a,r);break;case 7:Jn(a,a.return);default:Is(a,r)}t=t.sibling}}function fa(t,n,a){for(a=(n.subtreeFlags&8772)!==0?a:a&-2,n=n.child;n!==null;){var r=n.alternate,c=t,u=n,_=u.flags,w=(a&1)!==0;switch(u.tag){case 0:case 11:case 15:fa(c,u,a),_l(4,u);break;case 1:if(fa(c,u,a),r=u,c=r.stateNode,typeof c.componentDidMount=="function")try{c.componentDidMount()}catch(ft){nn(r,r.return,ft)}if(r=u,c=r.updateQueue,c!==null){var z=r.stateNode;try{var tt=c.shared.hiddenCallbacks;if(tt!==null)for(c.shared.hiddenCallbacks=null,c=0;c<tt.length;c++)H0(tt[c],z)}catch(ft){nn(r,r.return,ft)}}w&&_&64&&Jg(u),Ra(u,u.return);break;case 27:(a&2)!==0&&n_(u);case 5:u.tag!==5&&u.tag!==27||t_(u),fa(c,u,a),w&&r===null&&_&4&&Ih(u),Ra(u,u.return);break;case 6:t_(u);break;case 26:z=u.stateNode,u.memoizedState!==null||z===null||Xn||Ud(wl(z.ownerDocument),u.type,z),fa(c,u,a),w&&r===null&&_&4&&Ih(u),Ra(u,u.return);break;case 12:fa(c,u,a);break;case 31:fa(c,u,a),w&&_&4&&p_(c,u);break;case 13:fa(c,u,a),w&&_&4&&m_(c,u);break;case 22:u.memoizedState===null&&fa(c,u,a),Ra(u,u.return);break;case 30:fa(c,u,a),Ra(u,u.return);break;case 7:Ra(u,u.return);default:fa(c,u,a)}n=n.sibling}}function Zh(t,n){var a=null;t!==null&&t.memoizedState!==null&&t.memoizedState.cachePool!==null&&(a=t.memoizedState.cachePool.pool),t=null,n.memoizedState!==null&&n.memoizedState.cachePool!==null&&(t=n.memoizedState.cachePool.pool),t!==a&&(t!=null&&t.refCount++,a!=null&&al(a))}function Kh(t,n){t=null,n.alternate!==null&&(t=n.alternate.memoizedState.cache),n=n.memoizedState.cache,n!==t&&(n.refCount++,t!=null&&al(t))}function $i(t,n,a,r){var c=(a&335544064)===a;if(n.subtreeFlags&(c?10262:10256))for(n=n.child;n!==null;)x_(t,n,a,r),n=n.sibling;else c&&o_(n)}function x_(t,n,a,r){var c=(a&335544064)===a;c&&n.alternate===null&&n.return!==null&&n.return.alternate!==null&&Kc(n);var u=n.flags;switch(n.tag){case 0:case 11:case 15:$i(t,n,a,r),u&2048&&_l(9,n);break;case 1:$i(t,n,a,r);break;case 3:$i(t,n,a,r),c&&Yh&&(t=t.containerInfo,t=t.nodeType===9?t.body:t.nodeName==="HTML"?t.ownerDocument.body:t,t.style.viewTransitionName==="root"&&(t.style.viewTransitionName=""),t=t.ownerDocument.documentElement,t!==null&&t.style.viewTransitionName==="none"&&(t.style.viewTransitionName="")),u&2048&&(u=null,n.alternate!==null&&(u=n.alternate.memoizedState.cache),n=n.memoizedState.cache,n!==u&&(n.refCount++,u!=null&&al(u)));break;case 12:if(u&2048){$i(t,n,a,r),u=n.stateNode;try{var _=n.memoizedProps,w=_.id,z=_.onPostCommit;typeof z=="function"&&z(w,n.alternate===null?"mount":"update",u.passiveEffectDuration,-0)}catch(tt){nn(n,n.return,tt)}}else $i(t,n,a,r);break;case 31:$i(t,n,a,r);break;case 13:$i(t,n,a,r);break;case 23:break;case 22:_=n.stateNode,w=n.alternate,n.memoizedState!==null?(c&&w!==null&&w.memoizedState===null&&Kc(w),_._visibility&2?$i(t,n,a,r):Sl(t,n)):(c&&w!==null&&w.memoizedState!==null&&Kc(n),_._visibility&2?$i(t,n,a,r):(_._visibility|=2,ao(t,n,a,r,(n.subtreeFlags&10256)!==0||!1))),u&2048&&Zh(w,n);break;case 24:$i(t,n,a,r),u&2048&&Kh(n.alternate,n);break;case 30:c&&(u=n.alternate,u!==null&&(Ca(u.child,!0),Ca(n.child,!0))),$i(t,n,a,r);break;default:$i(t,n,a,r)}}function ao(t,n,a,r,c){for(c=c&&((n.subtreeFlags&10256)!==0||!1),n=n.child;n!==null;){var u=t,_=n,w=a,z=r,tt=_.flags;switch(_.tag){case 0:case 11:case 15:ao(u,_,w,z,c),_l(8,_);break;case 23:break;case 22:var ft=_.stateNode;_.memoizedState!==null?ft._visibility&2?ao(u,_,w,z,c):Sl(u,_):(ft._visibility|=2,ao(u,_,w,z,c)),c&&tt&2048&&Zh(_.alternate,_);break;case 24:ao(u,_,w,z,c),c&&tt&2048&&Kh(_.alternate,_);break;default:ao(u,_,w,z,c)}n=n.sibling}}function Sl(t,n){if(n.subtreeFlags&10256)for(n=n.child;n!==null;){var a=t,r=n,c=r.flags;switch(r.tag){case 22:Sl(a,r),c&2048&&Zh(r.alternate,r);break;case 24:Sl(a,r),c&2048&&Kh(r.alternate,r);break;default:Sl(a,r)}n=n.sibling}}var yr=8192;function Mr(t,n,a){if(t.subtreeFlags&yr)for(t=t.child;t!==null;)S_(t,n,a),t=t.sibling}function S_(t,n,a){switch(t.tag){case 26:Mr(t,n,a),t.flags&yr&&(t.memoizedState!==null?_E(a,ua,t.memoizedState,t.memoizedProps):(t=t.stateNode,(n&335544128)===n&&Rv(a,t)));break;case 5:Mr(t,n,a),t.flags&yr&&(t=t.stateNode,(n&335544128)===n&&Rv(a,t));break;case 3:case 4:var r=ua;ua=wl(t.stateNode.containerInfo),Mr(t,n,a),ua=r;break;case 22:t.memoizedState===null&&(r=t.alternate,r!==null&&r.memoizedState!==null?(r=yr,yr=16777216,Mr(t,n,a),yr=r):Mr(t,n,a));break;case 30:if((t.flags&yr)!==0&&(r=t.memoizedProps.name,r!=null&&r!=="auto")){var c=t.stateNode;c.paired=null,Ui===null&&(Ui=new Map),Ui.set(r,c)}Mr(t,n,a);break;default:Mr(t,n,a)}}function y_(t){var n=t.alternate;if(n!==null&&(t=n.child,t!==null)){n.child=null;do n=t.sibling,t.sibling=null,t=n;while(t!==null)}}function yl(t){var n=t.deletions;if((t.flags&16)!==0){if(n!==null)for(var a=0;a<n.length;a++){var r=n[a];Wn=r,E_(r,t)}y_(t)}if(t.subtreeFlags&10256)for(t=t.child;t!==null;)M_(t),t=t.sibling}function M_(t){switch(t.tag){case 0:case 11:case 15:yl(t),t.flags&2048&&Ps(9,t,t.return);break;case 3:yl(t);break;case 12:yl(t);break;case 22:var n=t.stateNode;t.memoizedState!==null&&n._visibility&2&&(t.return===null||t.return.tag!==13)?(n._visibility&=-3,tu(t)):yl(t);break;default:yl(t)}}function tu(t){var n=t.deletions;if((t.flags&16)!==0){if(n!==null)for(var a=0;a<n.length;a++){var r=n[a];Wn=r,E_(r,t)}y_(t)}for(t=t.child;t!==null;){switch(n=t,n.tag){case 0:case 11:case 15:Ps(8,n,n.return),tu(n);break;case 22:a=n.stateNode,a._visibility&2&&(a._visibility&=-3,tu(n));break;default:tu(n)}t=t.sibling}}function E_(t,n){for(;Wn!==null;){var a=Wn;switch(a.tag){case 0:case 11:case 15:Ps(8,a,n);break;case 23:case 22:if(a.memoizedState!==null&&a.memoizedState.cachePool!==null){var r=a.memoizedState.cachePool.pool;r!=null&&r.refCount++}break;case 24:al(a.memoizedState.cache)}if(r=a.child,r!==null)r.return=a,Wn=r;else t:for(a=t;Wn!==null;){r=Wn;var c=r.sibling,u=r.return;if(h_(r),r===a){Wn=null;break t}if(c!==null){c.return=u,Wn=c;break t}Wn=u}}}var hM={getCacheForType:function(t){var n=Zn(Cn),a=n.data.get(t);return a===void 0&&(a=t(),n.data.set(t,a)),a},cacheSignal:function(){return Zn(Cn).controller.signal}},dM=typeof WeakMap=="function"?WeakMap:Map,Je=0,cn=null,Be=null,Ve=0,en=0,Li=null,zs=!1,so=!1,Qh=!1,rs=0,En=0,Bs=0,Er=0,eu=0,Oi=0,ro=0,Ml=null,xi=null,Jh=!1,nu=0,b_=0,iu=1/0,au=null,Fs=null,_n=0,ha=null,br=null,La=0,$h=0,td=null,T_=null,oo=null,lo=null,co=null,El=0,su=null;function Pi(){return(Je&2)!==0&&Ve!==0?Ve&-Ve:Mt.T!==null?ud():ar()}function A_(){if(Oi===0)if((Ve&536870912)===0||Oe){var t=Wa;Wa<<=1,(Wa&3932160)===0&&(Wa=262144),Oi=t}else Oi=536870912;return t=Kn.current,t!==null&&(t.flags|=32),Oi}function uo(t,n){if(n!=null){var a=t.stateNode,r=a.ref;r===null&&(r=a.ref=rv(Ka(t.memoizedProps,a))),lo===null&&(lo=[]),lo.push(n.bind(null,r))}}function Si(t,n,a){(t===cn&&(en===2||en===9)||t.cancelPendingCommit!==null)&&(fo(t,0),Hs(t,Ve,Oi,!1)),Wi(t,a),((Je&2)===0||t!==cn)&&(t===cn&&((Je&2)===0&&(Er|=a),En===4&&Hs(t,Ve,Oi,!1)),Oa(t))}function R_(t,n,a){if((Je&6)!==0)throw Error(s(327));var r=!a&&(n&127)===0&&(n&t.expiredLanes)===0||Xi(t,n),c=r?gM(t,n):nd(t,n,!0),u=r;do{if(c===0){so&&!r&&Hs(t,n,0,!1);break}else{if(a=t.current.alternate,u&&!pM(a)){c=nd(t,n,!1),u=!1;continue}if(c===2){if(u=n,t.errorRecoveryDisabledLanes&u)var _=0;else _=t.pendingLanes&-536870913,_=_!==0?_:_&536870912?536870912:0;if(_!==0){n=_;t:{var w=t;c=Ml;var z=w.current.memoizedState.isDehydrated;if(z&&(fo(w,_).flags|=256),_=nd(w,_,!1),_!==2&&_!==6){if(Qh&&!z){w.errorRecoveryDisabledLanes|=u,Er|=u,c=4;break t}u=xi,xi=c,u!==null&&(xi===null?xi=u:xi.push.apply(xi,u))}c=_}if(u=!1,c!==2)continue}}if(c===1){fo(t,0),Hs(t,n,0,!0);break}t:{switch(r=t,u=c,u){case 0:case 1:throw Error(s(345));case 4:if((n&4194048)!==n&&(n&62914560)!==n)break;case 6:Hs(r,n,Oi,!zs);break t;case 2:xi=null;break;case 3:case 5:break;default:throw Error(s(329))}if((n&62914560)===n&&(c=nu+300-Kt(),10<c)){if(Hs(r,n,Oi,!zs),Ya(r,0,!0)!==0)break t;La=n,r.timeoutHandle=yd(w_.bind(null,r,a,xi,au,Jh,n,Oi,Er,ro,zs,u,"Throttled",-0,0),c);break t}w_(r,a,xi,au,Jh,n,Oi,Er,ro,zs,u,null,-0,0)}}break}while(!0);Oa(t)}function w_(t,n,a,r,c,u,_,w,z,tt,ft,Tt,K,lt){t.timeoutHandle=-1;var Xt=n.subtreeFlags,oe=(u&335544064)===u;if(Tt=null,(oe||Xt&8192||(Xt&16785408)===16785408)&&(Tt={stylesheets:null,count:0,imgCount:0,imgBytes:0,suspenseyImages:[],waitingForImages:!0,waitingForViewTransition:!1,unsuspend:qi},Ui=null,S_(n,u,Tt),oe&&(Xt=Tt,oe=t.containerInfo,oe=(oe.nodeType===9?oe:oe.ownerDocument).__reactViewTransition,oe!=null&&(Xt.count++,Xt.waitingForViewTransition=!0,Xt=Dl.bind(Xt),oe.finished.then(Xt,Xt))),Xt=(u&62914560)===u?nu-Kt():(u&4194048)===u?b_-Kt():0,Xt=vE(Tt,Xt),Xt!==null)){La=u,t.cancelPendingCommit=Xt(I_.bind(null,t,n,u,a,r,c,_,w,z,tt,ft,Tt,null,K,lt)),Hs(t,u,_,!tt);return}I_(t,n,u,a,r,c,_,w,z,tt,ft,Tt)}function pM(t){for(var n=t;;){var a=n.tag;if((a===0||a===11||a===15)&&n.flags&16384&&(a=n.updateQueue,a!==null&&(a=a.stores,a!==null)))for(var r=0;r<a.length;r++){var c=a[r],u=c.getSnapshot;c=c.value;try{if(!Ni(u(),c))return!1}catch{return!1}}if(a=n.child,n.subtreeFlags&16384&&a!==null)a.return=n,n=a;else{if(n===t)break;for(;n.sibling===null;){if(n.return===null||n.return===t)return!0;n=n.return}n.sibling.return=n.return,n=n.sibling}}return!0}function Hs(t,n,a,r){n=Ai(t,n),n&=~eu,n&=~Er,t.suspendedLanes|=n,t.pingedLanes&=~n,r&&(t.warmLanes|=n),r=t.expirationTimes;for(var c=n;0<c;){var u=31-xe(c),_=1<<u;r[u]=-1,c&=~_}a!==0&&Yi(t,a,n)}function ru(){return(Je&6)===0?(bl(0),!1):!0}function ed(){if(Be!==null){if(en===0)var t=Be.return;else t=Be,ts=fr=null,ch(t),Qr=null,ol=0,t=Be;for(;t!==null;)Qg(t.alternate,t),t=t.return;Be=null}}function fo(t,n){var a=t.timeoutHandle;return a!==-1&&(t.timeoutHandle=-1,BM(a)),a=t.cancelPendingCommit,a!==null&&(t.cancelPendingCommit=null,a()),La=0,ed(),cn=t,Be=a=Ja(t.current,null),Ve=n,en=0,Li=null,zs=!1,so=Xi(t,n),Qh=!1,ro=Oi=eu=Er=Bs=En=0,xi=Ml=null,Jh=!1,rs=Ai(t,n),pc(),a}function C_(t,n){Ae=null,Mt.H=Fc,n===Kr||n===Tc?(n=I0(),en=3):n===Kf?(n=I0(),en=4):en=n===bh?8:n!==null&&typeof n=="object"&&typeof n.then=="function"?6:1,Li=n,Be===null&&(En=1,Hc(t,Zi(n,t.current)))}function N_(){var t=Kn.current;return t===null?!0:(Ve&4194048)===Ve?ii===null:(Ve&62914560)===Ve||(Ve&536870912)!==0?t===ii:!1}function D_(){var t=Mt.H;return Mt.H=Fc,t===null?Fc:t}function U_(){var t=Mt.A;return Mt.A=hM,t}function ou(){En=4,zs||(Ve&4194048)!==Ve&&Kn.current!==null||(so=!0),(Bs&134217727)===0&&(Er&134217727)===0||cn===null||Hs(cn,Ve,Oi,!1)}function nd(t,n,a){var r=Je;Je|=2;var c=D_(),u=U_();(cn!==t||Ve!==n)&&(au=null,fo(t,n)),n=!1;var _=En;t:do try{if(en!==0&&Be!==null){var w=Be,z=Li;switch(en){case 8:ed(),_=6;break t;case 3:case 2:case 9:case 6:Kn.current===null&&(n=!0);var tt=en;if(en=0,Li=null,ho(t,w,z,tt),a&&so){_=0;break t}break;default:tt=en,en=0,Li=null,ho(t,w,z,tt)}}mM(),_=En;break}catch(ft){C_(t,ft)}while(!0);return n&&t.shellSuspendCounter++,ts=fr=null,Je=r,Mt.H=c,Mt.A=u,Be===null&&(cn=null,Ve=0,pc()),_}function mM(){for(;Be!==null;)L_(Be)}function gM(t,n){var a=Je;Je|=2;var r=D_(),c=U_();cn!==t||Ve!==n?(au=null,iu=Kt()+500,fo(t,n)):so=Xi(t,n);t:do try{if(en!==0&&Be!==null){n=Be;var u=Li;e:switch(en){case 1:en=0,Li=null,ho(t,n,u,1);break;case 2:case 9:if(O0(u)){en=0,Li=null,O_(n);break}n=function(){en!==2&&en!==9||cn!==t||(en=7),Oa(t)},u.then(n,n);break t;case 3:en=7;break t;case 4:en=5;break t;case 7:O0(u)?(en=0,Li=null,O_(n)):(en=0,Li=null,ho(t,n,u,7));break;case 5:var _=null;switch(Be.tag){case 26:_=Be.memoizedState;case 5:case 27:var w=Be;if(_?Tv(_):w.stateNode.complete){en=0,Li=null;var z=w.sibling;if(z!==null)Be=z;else{var tt=w.return;tt!==null?(Be=tt,lu(tt)):Be=null}break e}}en=0,Li=null,ho(t,n,u,5);break;case 6:en=0,Li=null,ho(t,n,u,6);break;case 8:ed(),En=6;break t;default:throw Error(s(462))}}_M();break}catch(ft){C_(t,ft)}while(!0);return ts=fr=null,Mt.H=r,Mt.A=c,Je=a,Be!==null?0:(cn=null,Ve=0,pc(),En)}function _M(){for(;Be!==null&&!Ht();)L_(Be)}function L_(t){var n=Zg(t.alternate,t,rs);t.memoizedProps=t.pendingProps,n===null?lu(t):Be=n}function O_(t){var n=t,a=n.alternate;switch(n.tag){case 15:case 0:n=Vg(a,n,n.pendingProps,n.type,void 0,Ve);break;case 11:n=Vg(a,n,n.pendingProps,n.type.render,n.ref,Ve);break;case 5:ch(n);var r=n;r===kn&&(Oe?(Sc(r),r.tag===5&&r.stateNode!=null&&(fn=r.stateNode)):(Sc(r),Oe=!0));default:Qg(a,n),n=Be=E0(n,rs),n=Zg(a,n,rs)}t.memoizedProps=t.pendingProps,n===null?lu(t):Be=n}function ho(t,n,a,r){ts=fr=null,ch(n),Qr=null,ol=0;var c=n.return;try{if(aM(t,c,n,a,Ve)){En=1,Hc(t,Zi(a,t.current)),Be=null;return}}catch(u){if(c!==null)throw Be=c,u;En=1,Hc(t,Zi(a,t.current)),Be=null;return}n.flags&32768?(Oe||r===1?t=!0:so||(Ve&536870912)!==0?t=!1:(zs=t=!0,(r===2||r===9||r===3||r===6)&&(r=Kn.current,r!==null&&r.tag===13&&(r.flags|=16384))),P_(n,t)):lu(n)}function lu(t){var n=t;do{if((n.flags&32768)!==0){P_(n,zs);return}t=n.return;var a=lM(n.alternate,n,rs);if(a!==null){Be=a;return}if(n=n.sibling,n!==null){Be=n;return}Be=n=t}while(n!==null);En===0&&(En=5)}function P_(t,n){do{var a=cM(t.alternate,t);if(a!==null){a.flags&=32767,Be=a;return}if(a=t.return,a!==null&&(a.flags|=32768,a.subtreeFlags=0,a.deletions=null),!n&&(t=t.sibling,t!==null)){Be=t;return}Be=t=a}while(t!==null);En=6,Be=null}function I_(t,n,a,r,c,u,_,w,z,tt,ft,Tt){t.cancelPendingCommit=null;do cu();while(_n!==0);if((Je&6)!==0)throw Error(s(327));if(n!==null){if(n===t.current)throw Error(s(177));t===cn&&(Be=cn=null,Ve=0),br=n,ha=t,La=a,td=c,T_=r,vM(t,n,a,_,w,z,Tt)}}function vM(t,n,a,r,c,u,_){var w=n.lanes|n.childLanes;if($h=w,w|=zf,Ma(t,a,w,r,c,u),lo=null,(a&335544064)===a?(co=Yy(t),r=10262):(co=null,r=10256),(n.subtreeFlags&r)!==0||(n.flags&r)!==0?(t.callbackNode=null,t.callbackPriority=0,bM(Ot,function(){return rd(),null})):(t.callbackNode=null,t.callbackPriority=0),jc=!1,r=(n.flags&13878)!==0,(n.subtreeFlags&13878)!==0||r){r=Mt.T,Mt.T=null,c=It.p,It.p=2,u=Je,Je|=4;try{uM(t,n,a)}finally{Je=u,It.p=c,Mt.T=r}}_n=1,jc?oo=XM(_,t.containerInfo,co,id,ad,SM,sd,rd,xM):(id(),ad(),sd())}function xM(t){if(_n!==0){var n=ha.onRecoverableError;n(t,{componentStack:null})}}function SM(){_n===3&&(_n=0,v_(br,ha),_n=4)}function id(){if(_n===1){_n=0;var t=ha,n=br,a=La,r=(n.flags&13878)!==0;if((n.subtreeFlags&13878)!==0||r){r=Mt.T,Mt.T=null;var c=It.p;It.p=2;var u=Je;Je|=4;try{xl=Qc=!1,g_(n,t,a),a=vd;var _=d0(t.containerInfo),w=a.focusedElem,z=a.selectionRange;if(_!==w&&w&&w.ownerDocument&&h0(w.ownerDocument.documentElement,w)){if(z!==null&&Uf(w)){var tt=z.start,ft=z.end;if(ft===void 0&&(ft=tt),"selectionStart"in w)w.selectionStart=tt,w.selectionEnd=Math.min(ft,w.value.length);else{var Tt=w.ownerDocument||document,K=Tt&&Tt.defaultView||window;if(K.getSelection){var lt=K.getSelection(),Xt=w.textContent.length,oe=Math.min(z.start,Xt),Re=z.end===void 0?oe:Math.min(z.end,Xt);!lt.extend&&oe>Re&&(_=Re,Re=oe,oe=_);var $=f0(w,oe),G=f0(w,Re);if($&&G&&(lt.rangeCount!==1||lt.anchorNode!==$.node||lt.anchorOffset!==$.offset||lt.focusNode!==G.node||lt.focusOffset!==G.offset)){var it=Tt.createRange();it.setStart($.node,$.offset),lt.removeAllRanges(),oe>Re?(lt.addRange(it),lt.extend(G.node,G.offset)):(it.setEnd(G.node,G.offset),lt.addRange(it))}}}}for(Tt=[],lt=w;lt=lt.parentNode;)lt.nodeType===1&&Tt.push({element:lt,left:lt.scrollLeft,top:lt.scrollTop});for(typeof w.focus=="function"&&w.focus(),w=0;w<Tt.length;w++){var bt=Tt[w];bt.element.scrollLeft=bt.left,bt.element.scrollTop=bt.top}}yo=!!_d,vd=_d=null}finally{Je=u,It.p=c,Mt.T=r}}t.current=n,_n=2}}function ad(){if(_n===2){_n=0;var t=ha,n=br,a=(n.flags&8772)!==0;if((n.subtreeFlags&8772)!==0||a){a=Mt.T,Mt.T=null;var r=It.p;It.p=2;var c=Je;Je|=4;try{u_(t,n.alternate,n)}finally{Je=c,It.p=r,Mt.T=a}}_n=3}}function sd(){if(_n===4||_n===3){_n=0;var t=oo;oo=null,zt();var n=ha,a=br,r=La,c=T_,u=(r&335544064)===r?10262:10256;if((a.subtreeFlags&u)!==0||(a.flags&u)!==0?_n=5:(_n=0,br=ha=null,z_(n,n.pendingLanes)),u=n.pendingLanes,u===0&&(Fs=null),pi(r),a=a.stateNode,Yt&&typeof Yt.onCommitFiberRoot=="function")try{Yt.onCommitFiberRoot(se,a,void 0,(a.current.flags&128)===128)}catch{}if(c!==null){a=Mt.T,u=It.p,It.p=2,Mt.T=null;try{for(var _=n.onRecoverableError,w=0;w<c.length;w++){var z=c[w];_(z.value,{componentStack:z.stack})}}finally{Mt.T=a,It.p=u}}if(c=lo,_=co,co=null,c!==null&&(lo=null,_===null&&(_=[]),t!==null))for(z=0;z<c.length;z++)a=(0,c[z])(_),a!==void 0&&t.finished.finally(a);(La&3)!==0&&cu(),Oa(n),u=n.pendingLanes,(r&261930)!==0&&(u&42)!==0?n===su?El++:(El=0,su=n):(El=0,su=null),bl(0)}}function z_(t,n){(t.pooledCacheLanes&=n)===0&&(n=t.pooledCache,n!=null&&(t.pooledCache=null,al(n)))}function cu(){return oo!==null&&(oo.skipTransition(),oo=null),id(),ad(),sd(),rd()}function rd(){if(_n!==5)return!1;var t=ha,n=$h;$h=0;var a=pi(La),r=Mt.T,c=It.p;try{It.p=32>a?32:a,Mt.T=null,a=td,td=null;var u=ha,_=La;if(_n=0,br=ha=null,La=0,(Je&6)!==0)throw Error(s(331));var w=Je;if(Je|=4,M_(u.current),x_(u,u.current,_,a),Je=w,bl(0,!1),Yt&&typeof Yt.onPostCommitFiberRoot=="function")try{Yt.onPostCommitFiberRoot(se,u)}catch{}return!0}finally{It.p=c,Mt.T=r,z_(t,n)}}function B_(t,n,a){n=Zi(a,n),n=Eh(t.stateNode,n,2),t=Ds(t,n,2),t!==null&&(Wi(t,2),Oa(t))}function nn(t,n,a){if(t.tag===3)B_(t,t,a);else for(;n!==null;){if(n.tag===3){B_(n,t,a);break}else if(n.tag===1){var r=n.stateNode;if(typeof n.type.getDerivedStateFromError=="function"||typeof r.componentDidCatch=="function"&&(Fs===null||!Fs.has(r))){t=Zi(a,t),a=Og(2),r=Ds(n,a,2),r!==null&&(Pg(a,r,n,t),Wi(r,2),Oa(r));break}}n=n.return}}function od(t,n,a){var r=t.pingCache;if(r===null){r=t.pingCache=new dM;var c=new Set;r.set(n,c)}else c=r.get(n),c===void 0&&(c=new Set,r.set(n,c));c.has(a)||(Qh=!0,c.add(a),t=yM.bind(null,t,n,a),n.then(t,t))}function yM(t,n,a){var r=t.pingCache;r!==null&&r.delete(n),t.pingedLanes|=t.suspendedLanes&a,t.warmLanes&=~a,cn===t&&(Ve&a)===a&&((En===4||En===3&&(Ve&62914560)===Ve&&300>Kt()-nu)&&(Je&2)===0?fo(t,0):eu|=a,ro===Ve&&(ro=0)),Oa(t)}function F_(t,n){n===0&&(n=ya()),t=lr(t,n),t!==null&&(Wi(t,n),Oa(t))}function MM(t){var n=t.memoizedState,a=0;n!==null&&(a=n.retryLane),F_(t,a)}function EM(t,n){var a=0;switch(t.tag){case 31:case 13:var r=t.stateNode,c=t.memoizedState;c!==null&&(a=c.retryLane);break;case 19:r=t.stateNode;break;case 22:r=t.stateNode._retryCache;break;default:throw Error(s(314))}r!==null&&r.delete(n),F_(t,a)}function bM(t,n){return Ft(t,n)}var po=null,mo=null,ld=!1,uu=!1,cd=!1,Gs=0;function Oa(t){t!==mo&&t.next===null&&(mo===null?po=mo=t:mo=mo.next=t),uu=!0,ld||(ld=!0,AM())}function bl(t,n){if(!cd&&uu){cd=!0;do for(var a=!1,r=po;r!==null;){if(t!==0){var c=r.pendingLanes;if(c===0)var u=0;else{var _=r.suspendedLanes,w=r.pingedLanes;u=(1<<31-xe(42|t)+1)-1,u&=c&~(_&~w),u=u&201326741?u&201326741|1:u?u|2:0}u!==0&&(a=!0,k_(r,u))}else u=Ve,u=Ya(r,r===cn?u:0,r.cancelPendingCommit!==null||r.timeoutHandle!==-1),(u&3)===0||Xi(r,u)||(a=!0,k_(r,u));r=r.next}while(a);cd=!1}}function TM(){H_()}function H_(){uu=ld=!1;var t=0;Gs!==0&&zM()&&(t=Gs);for(var n=Kt(),a=null,r=po;r!==null;){var c=r.next,u=G_(r,n);u===0?(r.next=null,a===null?po=c:a.next=c,c===null&&(mo=a)):(a=r,(t!==0||(u&3)!==0)&&(uu=!0)),r=c}_n!==0&&_n!==5||bl(t),Gs!==0&&(Gs=0)}function G_(t,n){for(var a=t.suspendedLanes,r=t.pingedLanes,c=t.expirationTimes,u=t.pendingLanes&-62914561;0<u;){var _=31-xe(u),w=1<<_,z=c[_];z===-1?((w&a)===0||(w&r)!==0)&&(c[_]=Sa(w,n)):z<=n&&(t.expiredLanes|=w),u&=~w}if(n=cn,a=Ve,a=Ya(t,t===n?a:0,t.cancelPendingCommit!==null||t.timeoutHandle!==-1),r=t.callbackNode,a===0||t===n&&(en===2||en===9)||t.cancelPendingCommit!==null)return r!==null&&r!==null&&ae(r),t.callbackNode=null,t.callbackPriority=0;if((a&3)===0||Xi(t,a)){if(n=a&-a,n===t.callbackPriority)return n;switch(r!==null&&ae(r),pi(a)){case 2:case 8:a=k;break;case 32:a=Ot;break;case 268435456:a=Gt;break;default:a=Ot}return r=V_.bind(null,t),a=Ft(a,r),t.callbackPriority=n,t.callbackNode=a,n}return r!==null&&r!==null&&ae(r),t.callbackPriority=2,t.callbackNode=null,2}function V_(t,n){if(_n!==0&&_n!==5)return t.callbackNode=null,t.callbackPriority=0,null;var a=t.callbackNode;if(cu()&&t.callbackNode!==a)return null;var r=Ve;return r=Ya(t,t===cn?r:0,t.cancelPendingCommit!==null||t.timeoutHandle!==-1),r===0?null:(R_(t,r,n),G_(t,Kt()),t.callbackNode!=null&&t.callbackNode===a?V_.bind(null,t):null)}function k_(t,n){if(cu())return null;R_(t,n,!0)}function AM(){FM(function(){(Je&6)!==0?Ft(he,TM):H_()})}function ud(){if(Gs===0){var t=pr;t===0&&(t=dn,dn<<=1,(dn&261888)===0&&(dn=256)),Gs=t}return Gs}function X_(t){return t==null||typeof t=="symbol"||typeof t=="boolean"?null:typeof t=="function"?t:Br(t)}function RM(t,n,a,r,c){if(n==="submit"&&a&&a.stateNode===c){var u=X_((c[H]||null).action),_=r.submitter;_&&(n=(n=_[H]||null)?X_(n.formAction):_.getAttribute("formAction"),n!==null&&(u=n,_=null));var w=new uc("action","action",null,r,c);t.push({event:w,listeners:[{instance:null,listener:function(){if(r.defaultPrevented){if(Gs!==0){var z=new FormData(c,_);vh(a,{pending:!0,data:z,method:c.method,action:u},null,z)}}else typeof u=="function"&&(w.preventDefault(),z=new FormData(c,_),vh(a,{pending:!0,data:z,method:c.method,action:u},u,z))},currentTarget:c}]})}}for(var fd=0;fd<If.length;fd++){var hd=If[fd],wM=hd.toLowerCase(),CM=hd[0].toUpperCase()+hd.slice(1);la(wM,"on"+CM)}la(g0,"onAnimationEnd"),la(_0,"onAnimationIteration"),la(v0,"onAnimationStart"),la("dblclick","onDoubleClick"),la("focusin","onFocus"),la("focusout","onBlur"),la(By,"onTransitionRun"),la(Fy,"onTransitionStart"),la(Hy,"onTransitionCancel"),la(x0,"onTransitionEnd"),pn("onMouseEnter",["mouseout","mouseover"]),pn("onMouseLeave",["mouseout","mouseover"]),pn("onPointerEnter",["pointerout","pointerover"]),pn("onPointerLeave",["pointerout","pointerover"]),qt("onChange","change click focusin focusout input keydown keyup selectionchange".split(" ")),qt("onSelect","focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange".split(" ")),qt("onBeforeInput",["compositionend","keypress","textInput","paste"]),qt("onCompositionEnd","compositionend focusout keydown keypress keyup mousedown".split(" ")),qt("onCompositionStart","compositionstart focusout keydown keypress keyup mousedown".split(" ")),qt("onCompositionUpdate","compositionupdate focusout keydown keypress keyup mousedown".split(" "));var Tl="abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting".split(" "),NM=new Set("beforetoggle cancel close invalid load scroll scrollend toggle".split(" ").concat(Tl));function W_(t,n){n=(n&4)!==0;for(var a=0;a<t.length;a++){var r=t[a],c=r.event;r=r.listeners;t:{var u=void 0;if(n)for(var _=r.length-1;0<=_;_--){var w=r[_],z=w.instance,tt=w.currentTarget;if(w=w.listener,z!==u&&c.isPropagationStopped())break t;u=w,c.currentTarget=tt;try{u(c)}catch(ft){dc(ft)}c.currentTarget=null,u=z}else for(_=0;_<r.length;_++){if(w=r[_],z=w.instance,tt=w.currentTarget,w=w.listener,z!==u&&c.isPropagationStopped())break t;u=w,c.currentTarget=tt;try{u(c)}catch(ft){dc(ft)}c.currentTarget=null,u=z}}}}function Fe(t,n){var a=n[at];a===void 0&&(a=n[at]=new Set);var r=t+"__bubble";a.has(r)||(Y_(n,t,2,!1),a.add(r))}function dd(t,n,a){var r=0;n&&(r|=4),Y_(a,t,r,n)}var fu="_reactListening"+Math.random().toString(36).slice(2);function pd(t){if(!t[fu]){t[fu]=!0,Ye.forEach(function(a){a!=="selectionchange"&&(NM.has(a)||dd(a,!1,t),dd(a,!0,t))});var n=t.nodeType===9?t:t.ownerDocument;n===null||n[fu]||(n[fu]=!0,dd("selectionchange",!1,n))}}function Y_(t,n,a,r){switch(Pv(n)){case 2:var c=ME;break;case 8:c=EE;break;default:c=Od}a=c.bind(null,n,a,t),c=void 0,!Mf||n!=="touchstart"&&n!=="touchmove"&&n!=="wheel"||(c=!0),r?c!==void 0?t.addEventListener(n,a,{capture:!0,passive:c}):t.addEventListener(n,a,!0):c!==void 0?t.addEventListener(n,a,{passive:c}):t.addEventListener(n,a,!1)}function md(t,n,a,r,c){var u=r;if((n&1)===0&&(n&2)===0&&r!==null)t:for(;;){if(r===null)return;var _=r.tag;if(_===3||_===4){var w=r.stateNode.containerInfo;if(w===c)break;if(_===4)for(_=r.return;_!==null;){var z=_.tag;if((z===3||z===4)&&_.stateNode.containerInfo===c)return;_=_.return}for(;w!==null;){if(_=pe(w),_===null)return;if(z=_.tag,z===5||z===6||z===26||z===27){r=u=_;continue t}w=w.parentNode}}r=r.return}Ym(function(){var tt=u,ft=Sf(a),Tt=[];t:{var K=S0.get(t);if(K!==void 0){var lt=uc,Xt=t;switch(t){case"keypress":if(lc(a)===0)break t;case"keydown":case"keyup":lt=py;break;case"focusin":Xt="focus",lt=Af;break;case"focusout":Xt="blur",lt=Af;break;case"beforeblur":case"afterblur":lt=Af;break;case"click":if(a.button===2)break t;case"auxclick":case"dblclick":case"mousedown":case"mousemove":case"mouseup":case"mouseout":case"mouseover":case"contextmenu":lt=Zm;break;case"drag":case"dragend":case"dragenter":case"dragexit":case"dragleave":case"dragover":case"dragstart":case"drop":lt=ny;break;case"touchcancel":case"touchend":case"touchmove":case"touchstart":lt=xy;break;case g0:case _0:case v0:lt=sy;break;case x0:lt=yy;break;case"scroll":case"scrollend":lt=ty;break;case"wheel":lt=Ey;break;case"copy":case"cut":case"paste":lt=oy;break;case"gotpointercapture":case"lostpointercapture":case"pointercancel":case"pointerdown":case"pointermove":case"pointerout":case"pointerover":case"pointerup":lt=Qm;break;case"submit":lt=_y;break;case"toggle":case"beforetoggle":lt=Ty}var oe=(n&4)!==0,Re=!oe&&(t==="scroll"||t==="scrollend"),$=oe?K!==null?K+"Capture":null:K;oe=[];for(var G=tt,it;G!==null;){var bt=G;if(it=bt.stateNode,bt=bt.tag,bt!==5&&bt!==26&&bt!==27||it===null||$===null||(bt=qo(G,$),bt!=null&&oe.push(Al(G,bt,it))),Re)break;G=G.return}0<oe.length&&(K=new lt(K,Xt,null,a,ft),Tt.push({event:K,listeners:oe}))}}if((n&7)===0){t:{if(lt=t==="mouseover"||t==="pointerover",K=t==="mouseout"||t==="pointerout",lt&&a!==ba&&(Xt=a.relatedTarget||a.fromElement)&&(pe(Xt)||Xt[ut]))break t;(K||lt)&&(Xt=ft.window===ft?ft:(lt=ft.ownerDocument)?lt.defaultView||lt.parentWindow:window,K?(lt=a.relatedTarget||a.toElement,K=tt,lt=lt?pe(lt):null,lt!==null&&(Re=f(lt),oe=lt.tag,lt!==Re||oe!==5&&oe!==27&&oe!==6)&&(lt=null)):(K=null,lt=tt),K!==lt&&(oe=Zm,bt="onMouseLeave",$="onMouseEnter",G="mouse",(t==="pointerout"||t==="pointerover")&&(oe=Qm,bt="onPointerLeave",$="onPointerEnter",G="pointer"),Re=K==null?Xt:Jt(K),it=lt==null?Xt:Jt(lt),Xt=new oe(bt,G+"leave",K,a,ft),Xt.target=Re,Xt.relatedTarget=it,bt=null,pe(ft)===tt&&(oe=new oe($,G+"enter",lt,a,ft),oe.target=it,oe.relatedTarget=Re,bt=oe),Re=bt,oe=K&&lt?D(K,lt,DM):null,K!==null&&q_(Tt,Xt,K,oe,!1),lt!==null&&Re!==null&&q_(Tt,Re,lt,oe,!0)))}t:{if(K=tt?Jt(tt):window,lt=K.nodeName&&K.nodeName.toLowerCase(),lt==="select"||lt==="input"&&K.type==="file")var te=s0;else if(i0(K))if(r0)te=Py;else{te=Ly;var ke=Uy}else lt=K.nodeName,!lt||lt.toLowerCase()!=="input"||K.type!=="checkbox"&&K.type!=="radio"?tt&&ys(tt.elementType)&&(te=s0):te=Oy;if(te&&(te=te(t,tt))){a0(Tt,te,a,ft);break t}ke&&ke(t,K,tt)}switch(ke=tt?Jt(tt):window,t){case"focusin":(i0(ke)||ke.contentEditable==="true")&&(Vr=ke,Lf=tt,el=null);break;case"focusout":el=Lf=Vr=null;break;case"mousedown":Of=!0;break;case"contextmenu":case"mouseup":case"dragend":Of=!1,p0(Tt,a,ft);break;case"selectionchange":if(zy)break;case"keydown":case"keyup":p0(Tt,a,ft)}var ue;if(wf)t:{switch(t){case"compositionstart":var me="onCompositionStart";break t;case"compositionend":me="onCompositionEnd";break t;case"compositionupdate":me="onCompositionUpdate";break t}me=void 0}else Gr?e0(t,a)&&(me="onCompositionEnd"):t==="keydown"&&a.keyCode===229&&(me="onCompositionStart");me&&(Jm&&a.locale!=="ko"&&(Gr||me!=="onCompositionStart"?me==="onCompositionEnd"&&Gr&&(ue=qm()):(Ms=ft,Ef="value"in Ms?Ms.value:Ms.textContent,Gr=!0)),ke=hu(tt,me),0<ke.length&&(me=new Km(me,t,null,a,ft),Tt.push({event:me,listeners:ke}),ue?me.data=ue:(ue=n0(a),ue!==null&&(me.data=ue)))),(ue=Ry?wy(t,a):Cy(t,a))&&(me=hu(tt,"onBeforeInput"),0<me.length&&(ke=new Km("onBeforeInput","beforeinput",null,a,ft),Tt.push({event:ke,listeners:me}),ke.data=ue)),RM(Tt,t,tt,a,ft)}W_(Tt,n)})}function Al(t,n,a){return{instance:t,listener:n,currentTarget:a}}function hu(t,n){for(var a=n+"Capture",r=[];t!==null;){var c=t,u=c.stateNode;if(c=c.tag,c!==5&&c!==26&&c!==27||u===null||(c=qo(t,a),c!=null&&r.unshift(Al(t,c,u)),c=qo(t,n),c!=null&&r.push(Al(t,c,u))),t.tag===3)return r;t=t.return}return[]}function DM(t){if(t===null)return null;do t=t.return;while(t&&t.tag!==5&&t.tag!==27);return t||null}function q_(t,n,a,r,c){for(var u=n._reactName,_=[];a!==null&&a!==r;){var w=a,z=w.alternate,tt=w.stateNode;if(w=w.tag,z!==null&&z===r)break;w!==5&&w!==26&&w!==27||tt===null||(z=tt,c?(tt=qo(a,u),tt!=null&&_.unshift(Al(a,tt,z))):c||(tt=qo(a,u),tt!=null&&_.push(Al(a,tt,z)))),a=a.return}_.length!==0&&t.push({event:n,listeners:_})}var UM=/\r\n?/g,LM=/\u0000|\uFFFD/g;function j_(t){return(typeof t=="string"?t:""+t).replace(UM,`
`).replace(LM,"")}function Z_(t,n){return n=j_(n),j_(t)===n}function an(t,n,a,r,c,u){switch(a){case"children":if(typeof r=="string")n==="body"||n==="textarea"&&r===""||zn(t,r);else if(typeof r=="number"||typeof r=="bigint")n!=="body"&&zn(t,""+r);else return;break;case"className":kt(t,"class",r);break;case"tabIndex":kt(t,"tabindex",r);break;case"dir":case"role":case"viewBox":case"width":case"height":kt(t,a,r);break;case"style":ja(t,r,u);return;case"data":if(n!=="object"){kt(t,"data",r);break}case"src":case"href":if(r===""&&(n!=="a"||a!=="href")){t.removeAttribute(a);break}if(r==null||typeof r=="function"||typeof r=="symbol"||typeof r=="boolean"){t.removeAttribute(a);break}r=Br(r),t.setAttribute(a,r);break;case"action":case"formAction":if(typeof r=="function"){t.setAttribute(a,"javascript:throw new Error('A React form was unexpectedly submitted. If you called form.submit() manually, consider using form.requestSubmit() instead. If you\\'re trying to use event.stopPropagation() in a submit event handler, consider also calling event.preventDefault().')");break}else typeof u=="function"&&(a==="formAction"?(n!=="input"&&an(t,n,"name",c.name,c,null),an(t,n,"formEncType",c.formEncType,c,null),an(t,n,"formMethod",c.formMethod,c,null),an(t,n,"formTarget",c.formTarget,c,null)):(an(t,n,"encType",c.encType,c,null),an(t,n,"method",c.method,c,null),an(t,n,"target",c.target,c,null)));if(r==null||typeof r=="symbol"||typeof r=="boolean"){t.removeAttribute(a);break}r=Br(r),t.setAttribute(a,r);break;case"onClick":r!=null&&(t.onclick=qi);return;case"onScroll":r!=null&&Fe("scroll",t);return;case"onScrollEnd":r!=null&&Fe("scrollend",t);return;case"dangerouslySetInnerHTML":if(r!=null){if(typeof r!="object"||!("__html"in r))throw Error(s(61));if(a=r.__html,a!=null){if(c.children!=null)throw Error(s(60));u?.__html!==a&&(t.innerHTML=a)}}break;case"multiple":t.multiple=r&&typeof r!="function"&&typeof r!="symbol";break;case"muted":t.muted=r&&typeof r!="function"&&typeof r!="symbol";break;case"suppressContentEditableWarning":case"suppressHydrationWarning":case"defaultValue":case"defaultChecked":case"innerHTML":case"ref":break;case"autoFocus":break;case"xlinkHref":if(r==null||typeof r=="function"||typeof r=="boolean"||typeof r=="symbol"){t.removeAttribute("xlink:href");break}a=Br(r),t.setAttributeNS("http://www.w3.org/1999/xlink","xlink:href",a);break;case"contentEditable":case"spellCheck":case"draggable":case"value":case"autoReverse":case"externalResourcesRequired":case"focusable":case"preserveAlpha":r!=null&&typeof r!="function"&&typeof r!="symbol"?t.setAttribute(a,r):t.removeAttribute(a);break;case"inert":case"allowFullScreen":case"async":case"autoPlay":case"controls":case"credentialless":case"default":case"defer":case"disabled":case"disablePictureInPicture":case"disableRemotePlayback":case"formNoValidate":case"hidden":case"loop":case"noModule":case"noValidate":case"open":case"playsInline":case"readOnly":case"required":case"reversed":case"scoped":case"seamless":case"itemScope":r&&typeof r!="function"&&typeof r!="symbol"?t.setAttribute(a,""):t.removeAttribute(a);break;case"capture":case"download":r===!0?t.setAttribute(a,""):r!==!1&&r!=null&&typeof r!="function"&&typeof r!="symbol"?t.setAttribute(a,r):t.removeAttribute(a);break;case"cols":case"rows":case"size":case"span":r!=null&&typeof r!="function"&&typeof r!="symbol"&&!isNaN(r)&&1<=r?t.setAttribute(a,r):t.removeAttribute(a);break;case"rowSpan":case"start":r==null||typeof r=="function"||typeof r=="symbol"||isNaN(r)?t.removeAttribute(a):t.setAttribute(a,r);break;case"popover":Fe("beforetoggle",t),Fe("toggle",t),Pt(t,"popover",r);break;case"xlinkActuate":re(t,"http://www.w3.org/1999/xlink","xlink:actuate",r);break;case"xlinkArcrole":re(t,"http://www.w3.org/1999/xlink","xlink:arcrole",r);break;case"xlinkRole":re(t,"http://www.w3.org/1999/xlink","xlink:role",r);break;case"xlinkShow":re(t,"http://www.w3.org/1999/xlink","xlink:show",r);break;case"xlinkTitle":re(t,"http://www.w3.org/1999/xlink","xlink:title",r);break;case"xlinkType":re(t,"http://www.w3.org/1999/xlink","xlink:type",r);break;case"xmlBase":re(t,"http://www.w3.org/XML/1998/namespace","xml:base",r);break;case"xmlLang":re(t,"http://www.w3.org/XML/1998/namespace","xml:lang",r);break;case"xmlSpace":re(t,"http://www.w3.org/XML/1998/namespace","xml:space",r);break;case"is":Pt(t,"is",r);break;case"innerText":case"textContent":return;default:if(!(2<a.length)||a[0]!=="o"&&a[0]!=="O"||a[1]!=="n"&&a[1]!=="N")a=sr.get(a)||a,Pt(t,a,r);else return}yt=!0}function gd(t,n,a,r,c,u){switch(a){case"style":ja(t,r,u);return;case"dangerouslySetInnerHTML":if(r!=null){if(typeof r!="object"||!("__html"in r))throw Error(s(61));if(a=r.__html,a!=null){if(c.children!=null)throw Error(s(60));u?.__html!==a&&(t.innerHTML=a)}}break;case"children":if(typeof r=="string")zn(t,r);else if(typeof r=="number"||typeof r=="bigint")zn(t,""+r);else return;break;case"onScroll":r!=null&&Fe("scroll",t);return;case"onScrollEnd":r!=null&&Fe("scrollend",t);return;case"onClick":r!=null&&(t.onclick=qi);return;case"suppressContentEditableWarning":case"suppressHydrationWarning":case"innerHTML":case"ref":return;case"innerText":case"textContent":return;default:if(!bn.hasOwnProperty(a))t:{if(a[0]==="o"&&a[1]==="n"&&(c=a.endsWith("Capture"),u=a.slice(2,c?a.length-7:void 0),n=t[H]||null,n=n!=null?n[a]:null,typeof n=="function"&&t.removeEventListener(u,n,c),typeof r=="function")){typeof n!="function"&&n!==null&&(a in t?t[a]=null:t.hasAttribute(a)&&t.removeAttribute(a)),t.addEventListener(u,r,c);break t}yt=!0,a in t?t[a]=r:r===!0?t.setAttribute(a,""):Pt(t,a,r)}return}yt=!0}function $n(t,n,a){switch(n){case"div":case"span":case"svg":case"path":case"a":case"g":case"p":case"li":break;case"img":Fe("error",t),Fe("load",t);var r=!1,c=!1,u;for(u in a)if(a.hasOwnProperty(u)){var _=a[u];if(_!=null)switch(u){case"src":r=!0;break;case"srcSet":c=!0;break;case"children":case"dangerouslySetInnerHTML":throw Error(s(137,n));default:an(t,n,u,_,a,null)}}c&&an(t,n,"srcSet",a.srcSet,a,null),r&&an(t,n,"src",a.src,a,null);return;case"input":Fe("invalid",t);var w=u=_=c=null,z=null,tt=null;for(r in a)if(a.hasOwnProperty(r)){var ft=a[r];if(ft!=null)switch(r){case"name":c=ft;break;case"type":_=ft;break;case"checked":z=ft;break;case"defaultChecked":tt=ft;break;case"value":u=ft;break;case"defaultValue":w=ft;break;case"children":case"dangerouslySetInnerHTML":if(ft!=null)throw Error(s(137,n));break;default:an(t,n,r,ft,a,null)}}Ci(t,u,w,z,tt,_,c,!1);return;case"select":Fe("invalid",t),r=_=u=null;for(c in a)if(a.hasOwnProperty(c)&&(w=a[c],w!=null))switch(c){case"value":u=w;break;case"defaultValue":_=w;break;case"multiple":r=w;default:an(t,n,c,w,a,null)}n=u,a=_,t.multiple=!!r,n!=null?wn(t,!!r,n,!1):a!=null&&wn(t,!!r,a,!0);return;case"textarea":Fe("invalid",t),u=c=r=null;for(_ in a)if(a.hasOwnProperty(_)&&(w=a[_],w!=null))switch(_){case"value":r=w;break;case"defaultValue":c=w;break;case"children":u=w;break;case"dangerouslySetInnerHTML":if(w!=null)throw Error(s(91));break;default:an(t,n,_,w,a,null)}qa(t,r,c,u);return;case"option":for(z in a)a.hasOwnProperty(z)&&(r=a[z],r!=null)&&(z==="selected"?t.selected=r&&typeof r!="function"&&typeof r!="symbol":an(t,n,z,r,a,null));return;case"dialog":Fe("beforetoggle",t),Fe("toggle",t),Fe("cancel",t),Fe("close",t);break;case"iframe":case"object":Fe("load",t);break;case"video":case"audio":for(r=0;r<Tl.length;r++)Fe(Tl[r],t);break;case"image":Fe("error",t),Fe("load",t);break;case"details":Fe("toggle",t);break;case"embed":case"source":case"link":Fe("error",t),Fe("load",t);case"area":case"base":case"br":case"col":case"hr":case"keygen":case"meta":case"param":case"track":case"wbr":case"menuitem":for(tt in a)if(a.hasOwnProperty(tt)&&(r=a[tt],r!=null))switch(tt){case"children":case"dangerouslySetInnerHTML":throw Error(s(137,n));default:an(t,n,tt,r,a,null)}return;default:if(ys(n)){for(ft in a)a.hasOwnProperty(ft)&&(r=a[ft],r!==void 0&&gd(t,n,ft,r,a,void 0));return}}for(w in a)a.hasOwnProperty(w)&&(r=a[w],r!=null&&an(t,n,w,r,a,null))}var OM={};function PM(t,n,a,r){switch(n){case"div":case"span":case"svg":case"path":case"a":case"g":case"p":case"li":break;case"input":var c=null,u=null,_=null,w=null,z=null,tt=null,ft=null;for(lt in a){var Tt=a[lt];if(a.hasOwnProperty(lt)&&Tt!=null)switch(lt){case"checked":break;case"value":break;case"defaultValue":z=Tt;default:r.hasOwnProperty(lt)||an(t,n,lt,null,r,Tt)}}for(var K in r){var lt=r[K];if(Tt=a[K],r.hasOwnProperty(K)&&(lt!=null||Tt!=null))switch(K){case"type":lt!==Tt&&(yt=!0),u=lt;break;case"name":lt!==Tt&&(yt=!0),c=lt;break;case"checked":lt!==Tt&&(yt=!0),tt=lt;break;case"defaultChecked":lt!==Tt&&(yt=!0),ft=lt;break;case"value":lt!==Tt&&(yt=!0),_=lt;break;case"defaultValue":lt!==Tt&&(yt=!0),w=lt;break;case"children":case"dangerouslySetInnerHTML":if(lt!=null)throw Error(s(137,n));break;default:lt!==Tt&&an(t,n,K,lt,r,Tt)}}Sn(t,_,w,z,tt,ft,u,c);return;case"select":lt=_=w=K=null;for(u in a)if(z=a[u],a.hasOwnProperty(u)&&z!=null)switch(u){case"value":break;case"multiple":lt=z;default:r.hasOwnProperty(u)||an(t,n,u,null,r,z)}for(c in r)if(u=r[c],z=a[c],r.hasOwnProperty(c)&&(u!=null||z!=null))switch(c){case"value":u!==z&&(yt=!0),K=u;break;case"defaultValue":u!==z&&(yt=!0),w=u;break;case"multiple":u!==z&&(yt=!0),_=u;default:u!==z&&an(t,n,c,u,r,z)}n=w,a=_,r=lt,K!=null?wn(t,!!a,K,!1):!!r!=!!a&&(n!=null?wn(t,!!a,n,!0):wn(t,!!a,a?[]:"",!1));return;case"textarea":lt=K=null;for(w in a)if(c=a[w],a.hasOwnProperty(w)&&c!=null&&!r.hasOwnProperty(w))switch(w){case"value":break;case"children":break;default:an(t,n,w,null,r,c)}for(_ in r)if(c=r[_],u=a[_],r.hasOwnProperty(_)&&(c!=null||u!=null))switch(_){case"value":c!==u&&(yt=!0),K=c;break;case"defaultValue":c!==u&&(yt=!0),lt=c;break;case"children":break;case"dangerouslySetInnerHTML":if(c!=null)throw Error(s(91));break;default:c!==u&&an(t,n,_,c,r,u)}jn(t,K,lt);return;case"option":for(var Xt in a)K=a[Xt],a.hasOwnProperty(Xt)&&K!=null&&!r.hasOwnProperty(Xt)&&(Xt==="selected"?t.selected=!1:an(t,n,Xt,null,r,K));for(z in r)K=r[z],lt=a[z],r.hasOwnProperty(z)&&K!==lt&&(K!=null||lt!=null)&&(z==="selected"?(K!==lt&&(yt=!0),t.selected=K&&typeof K!="function"&&typeof K!="symbol"):an(t,n,z,K,r,lt));return;case"img":case"link":case"area":case"base":case"br":case"col":case"embed":case"hr":case"keygen":case"meta":case"param":case"source":case"track":case"wbr":case"menuitem":for(var oe in a)K=a[oe],a.hasOwnProperty(oe)&&K!=null&&!r.hasOwnProperty(oe)&&an(t,n,oe,null,r,K);for(tt in r)if(K=r[tt],lt=a[tt],r.hasOwnProperty(tt)&&K!==lt&&(K!=null||lt!=null))switch(tt){case"children":case"dangerouslySetInnerHTML":if(K!=null)throw Error(s(137,n));break;default:an(t,n,tt,K,r,lt)}return;default:if(ys(n)){for(var Re in a)K=a[Re],a.hasOwnProperty(Re)&&K!==void 0&&!r.hasOwnProperty(Re)&&gd(t,n,Re,void 0,r,K);for(ft in r)K=r[ft],lt=a[ft],!r.hasOwnProperty(ft)||K===lt||K===void 0&&lt===void 0||gd(t,n,ft,K,r,lt);return}}for(var $ in a)K=a[$],a.hasOwnProperty($)&&K!=null&&!r.hasOwnProperty($)&&an(t,n,$,null,r,K);for(Tt in r)K=r[Tt],lt=a[Tt],!r.hasOwnProperty(Tt)||K===lt||K==null&&lt==null||an(t,n,Tt,K,r,lt)}function K_(t){switch(t){case"css":case"script":case"font":case"img":case"image":case"input":case"link":return!0;default:return!1}}function IM(){if(typeof performance.getEntriesByType=="function"){for(var t=0,n=0,a=performance.getEntriesByType("resource"),r=0;r<a.length;r++){var c=a[r],u=c.transferSize,_=c.initiatorType,w=c.duration;if(u&&w&&K_(_)){for(_=0,w=c.responseEnd,r+=1;r<a.length;r++){var z=a[r],tt=z.startTime;if(tt>w)break;var ft=z.transferSize,Tt=z.initiatorType;ft&&K_(Tt)&&(z=z.responseEnd,_+=ft*(z<w?1:(w-tt)/(z-tt)))}if(--r,n+=8*(u+_)/(c.duration/1e3),t++,10<t)break}}if(0<t)return n/t/1e6}return navigator.connection&&(t=navigator.connection.downlink,typeof t=="number")?t:5}var _d=null,vd=null;function Rl(t){return t.nodeType===9?t:t.ownerDocument}function Q_(t){switch(t){case"http://www.w3.org/2000/svg":return 1;case"http://www.w3.org/1998/Math/MathML":return 2;default:return 0}}function J_(t,n){if(t===0)switch(n){case"svg":return 1;case"math":return 2;default:return 0}return t===1&&n==="foreignObject"?0:t}function $_(t,n,a,r){return a=Rl(a).createElement(t),a[R]=r,a[H]=n,$n(a,t,n),we(a),a}function xd(t,n){return t==="textarea"||t==="noscript"||typeof n.children=="string"||typeof n.children=="number"||typeof n.children=="bigint"||typeof n.dangerouslySetInnerHTML=="object"&&n.dangerouslySetInnerHTML!==null&&n.dangerouslySetInnerHTML.__html!=null}var Sd=null;function zM(){var t=window.event;return t&&t.type==="popstate"?t===Sd?!1:(Sd=t,!0):(Sd=null,!1)}var yd=typeof setTimeout=="function"?setTimeout:void 0,BM=typeof clearTimeout=="function"?clearTimeout:void 0,tv=typeof Promise=="function"?Promise:void 0,ev=typeof requestAnimationFrame=="function"?requestAnimationFrame:yd,FM=typeof queueMicrotask=="function"?queueMicrotask:typeof tv<"u"?function(t){return tv.resolve(null).then(t).catch(HM)}:yd;function HM(t){setTimeout(function(){throw t})}function Vs(t){return t==="head"}function nv(t,n){var a=n,r=0;do{var c=a.nextSibling;if(t.removeChild(a),c&&c.nodeType===8)if(a=c.data,a==="/$"||a==="/&"){if(r===0){t.removeChild(c),Mo(n);return}r--}else if(a==="$"||a==="$?"||a==="$~"||a==="$!"||a==="&")r++;else if(a==="html")Cd(t.ownerDocument.documentElement);else if(a==="head"){a=t.ownerDocument.head,Cd(a);for(var u=a.firstChild;u;){var _=u.nextSibling,w=u.nodeName;u[Bt]||w==="SCRIPT"||w==="STYLE"||w==="LINK"&&u.rel.toLowerCase()==="stylesheet"||a.removeChild(u),u=_}}else a==="body"&&Cd(t.ownerDocument.body);a=c}while(a);Mo(n)}function iv(t,n){var a=t;t=0;do{var r=a.nextSibling;if(a.nodeType===1?n?(a._stashedDisplay=a.style.display,a.style.display="none"):(a.style.display=a._stashedDisplay||"",a.getAttribute("style")===""&&a.removeAttribute("style")):a.nodeType===3&&(n?(a._stashedText=a.nodeValue,a.nodeValue=""):a.nodeValue=a._stashedText||""),r&&r.nodeType===8)if(a=r.data,a==="/$"){if(t===0)break;t--}else a!=="$"&&a!=="$?"&&a!=="$~"&&a!=="$!"||t++;a=r}while(a)}function av(t,n,a){if(n=CSS.escape(n)!==n?"r-"+btoa(n).replace(/=/g,""):n,t.style.viewTransitionName=n,a!=null&&(t.style.viewTransitionClass=a),a=getComputedStyle(t),a.display==="inline"){if(n=t.getClientRects(),n.length===1)var r=1;else for(var c=r=0;c<n.length;c++){var u=n[c];0<u.width&&0<u.height&&r++}r===1&&(t=t.style,t.display=n.length===1?"inline-block":"block",t.marginTop="-"+a.paddingTop,t.marginBottom="-"+a.paddingBottom)}}function sv(t,n){t=t.style,n=n.style;var a=n!=null?n.hasOwnProperty("viewTransitionName")?n.viewTransitionName:n.hasOwnProperty("view-transition-name")?n["view-transition-name"]:null:null;t.viewTransitionName=a==null||typeof a=="boolean"?"":(""+a).trim(),a=n!=null?n.hasOwnProperty("viewTransitionClass")?n.viewTransitionClass:n.hasOwnProperty("view-transition-class")?n["view-transition-class"]:null:null,t.viewTransitionClass=a==null||typeof a=="boolean"?"":(""+a).trim(),t.display==="inline-block"&&(n==null?t.display=t.margin="":(a=n.display,t.display=a==null||typeof a=="boolean"?"":a,a=n.margin,a!=null?t.margin=a:(a=n.hasOwnProperty("marginTop")?n.marginTop:n["margin-top"],t.marginTop=a==null||typeof a=="boolean"?"":a,n=n.hasOwnProperty("marginBottom")?n.marginBottom:n["margin-bottom"],t.marginBottom=n==null||typeof n=="boolean"?"":n)))}function GM(t,n,a){return a=a.ownerDocument.defaultView,{rect:t,abs:n.position==="absolute"||n.position==="fixed",clip:n.clipPath!=="none"||n.overflow!=="visible"||n.filter!=="none"||n.mask!=="none"||n.mask!=="none"||n.borderRadius!=="0px",view:0<=t.bottom&&0<=t.right&&t.top<=a.innerHeight&&t.left<=a.innerWidth}}function Md(t){var n=t.getBoundingClientRect(),a=getComputedStyle(t);return GM(n,a,t)}function VM(t){return t.documentElement.clientHeight}function kM(t){this.addEventListener("load",t),this.addEventListener("error",t)}function XM(t,n,a,r,c,u,_,w,z){var tt=n.nodeType===9?n:n.ownerDocument;try{var ft=tt.startViewTransition({update:function(){var K=tt.defaultView,lt=K.navigation&&K.navigation.transition,Xt=tt.fonts.status;r();var oe=[];if(Xt==="loaded"&&(VM(tt),tt.fonts.status==="loading"&&oe.push(tt.fonts.ready)),Xt=oe.length,t!==null)for(var Re=t.suspenseyImages,$=0,G=0;G<Re.length;G++){var it=Re[G];if(!it.complete){var bt=it.getBoundingClientRect();if(0<bt.bottom&&0<bt.right&&bt.top<K.innerHeight&&bt.left<K.innerWidth){if($+=Av(it),$>mu){oe.length=Xt;break}it=new Promise(kM.bind(it)),oe.push(it)}}}if(0<oe.length)return K=Promise.race([Promise.all(oe),new Promise(function(te){return setTimeout(te,500)})]).then(c,c),(lt?Promise.allSettled([lt.finished,K]):K).then(u,u);if(c(),lt)return lt.finished.then(u,u);u()},types:a});tt.__reactViewTransition=ft;var Tt=[];return ft.ready.then(function(){for(var K=tt.documentElement.getAnimations({subtree:!0}),lt=0;lt<K.length;lt++){var Xt=K[lt],oe=Xt.effect,Re=oe.pseudoElement;if(Re!=null&&Re.startsWith("::view-transition")){Tt.push(Xt),Xt=oe.getKeyframes();for(var $=Re=void 0,G=!0,it=0;it<Xt.length;it++){var bt=Xt[it],te=bt.width;if(Re===void 0)Re=te;else if(Re!==te){G=!1;break}if(te=bt.height,$===void 0)$=te;else if($!==te){G=!1;break}delete bt.width,delete bt.height,bt.transform==="none"&&delete bt.transform}G&&Re!==void 0&&$!==void 0&&(oe.setKeyframes(Xt),G=getComputedStyle(oe.target,oe.pseudoElement),G.width!==Re||G.height!==$)&&(G=Xt[0],G.width=Re,G.height=$,G=Xt[Xt.length-1],G.width=Re,G.height=$,oe.setKeyframes(Xt))}}_()},function(K){tt.__reactViewTransition===ft&&(tt.__reactViewTransition=null);try{typeof K=="object"&&K!==null&&K.name==="InvalidStateError"&&(K.message==="View transition was skipped because document visibility state is hidden."||K.message==="Skipping view transition because document visibility state has become hidden."||K.message==="Skipping view transition because viewport size changed."||K.message==="Transition was aborted because of invalid state")&&(K=null),K!==null&&z(K)}finally{r(),c(),_()}}),ft.finished.finally(function(){for(var K=0;K<Tt.length;K++)Tt[K].cancel();tt.__reactViewTransition===ft&&(tt.__reactViewTransition=null),w()}),ft}catch{return r(),c(),_(),null}}function Tr(t,n){this._scope=document.documentElement,this._selector="::view-transition-"+t+"("+n+")"}Tr.prototype.animate=function(t,n){return n=typeof n=="number"?{duration:n}:I({},n),n.pseudoElement=this._selector,this._scope.animate(t,n)},Tr.prototype.getAnimations=function(){for(var t=this._scope,n=this._selector,a=t.getAnimations({subtree:!0}),r=[],c=0;c<a.length;c++){var u=a[c].effect;u!==null&&u.target===t&&u.pseudoElement===n&&r.push(a[c])}return r},Tr.prototype.getComputedStyle=function(){return getComputedStyle(this._scope,this._selector)};function rv(t){return{name:t,group:new Tr("group",t),imagePair:new Tr("image-pair",t),old:new Tr("old",t),new:new Tr("new",t)}}function Ii(t){this._fragmentFiber=t,this._observers=this._eventListeners=null}Ii.prototype.addEventListener=function(t,n,a){var r=null,c=null;if(!(a!=null&&typeof a!="boolean"&&(r=a.signal||null,r!==null&&r.aborted))){this._eventListeners===null&&(this._eventListeners=[]);var u=this._eventListeners;if(lv(u,t,n,a)===-1){var _=this,w=n;a!=null&&typeof a!="boolean"&&a.once===!0&&(w=function(z){_.removeEventListener(t,n,a),typeof n=="function"?n.call(this,z):n.handleEvent(z)}),r!==null&&(c=_.removeEventListener.bind(_,t,n,a),r.addEventListener("abort",c,{once:!0}),c=r.removeEventListener.bind(r,"abort",c)),r=go(a),u.push({type:t,listener:n,optionsOrUseCapture:a,attachedListener:w,cleanup:c}),v(this._fragmentFiber.child,!1,WM,t,w,r)}this._eventListeners=u}};function WM(t,n,a,r){return y(t).addEventListener(n,a,r),!1}Ii.prototype.removeEventListener=function(t,n,a){var r=this._eventListeners;if(r!==null&&(n=lv(r,t,n,a),n!==-1)){var c=r[n];a=c.attachedListener;var u=c.cleanup;c=go(c.optionsOrUseCapture),v(this._fragmentFiber.child,!1,YM,t,a,c),r.splice(n,1),u!==null&&u()}};function YM(t,n,a,r){return y(t).removeEventListener(n,a,r),!1}function go(t){return t!=null&&typeof t!="boolean"&&(t.once===!0||t.signal instanceof AbortSignal)?{capture:t.capture,passive:t.passive}:t}function ov(t){return t==null?"c=0":typeof t=="boolean"?"c="+(t?"1":"0"):"c="+(t.capture?"1":"0")}function lv(t,n,a,r){if(t.length===0)return-1;r=ov(r);for(var c=0;c<t.length;c++){var u=t[c];if(u.type===n&&u.listener===a&&ov(u.optionsOrUseCapture)===r)return c}return-1}Ii.prototype.dispatchEvent=function(t){var n=g(this._fragmentFiber);if(n===null)return!0;n=y(n);var a=this._eventListeners;if(a!==null&&0<a.length||!t.bubbles){var r=n.nodeType===9?n.createComment(""):document.createTextNode("");if(a)for(var c=0;c<a.length;c++){var u=a[c];r.addEventListener(u.type,u.attachedListener,go(u.optionsOrUseCapture))}if(n.appendChild(r),t=r.dispatchEvent(t),a)for(c=0;c<a.length;c++)u=a[c],r.removeEventListener(u.type,u.attachedListener,go(u.optionsOrUseCapture));return n.removeChild(r),t}return n.dispatchEvent(t)},Ii.prototype.focus=function(t){v(this._fragmentFiber.child,!0,cv,t,void 0,void 0)};function cv(t,n){return t.tag===6?!1:(t=y(t),aE(t,n))}Ii.prototype.focusLast=function(t){var n=[];v(this._fragmentFiber.child,!0,Ed,n,void 0,void 0);for(var a=n.length-1;0<=a&&!cv(n[a],t);a--);};function Ed(t,n){return n.push(t),!1}Ii.prototype.blur=function(){var t=g(this._fragmentFiber);t!==null&&(t=y(t),t=Rl(t).activeElement,t!==null&&v(this._fragmentFiber.child,!1,qM,t,void 0,void 0))};function qM(t,n){return t.tag===6?!1:(t=y(t),t===n||t.contains(n)?(n.blur(),!0):!1)}Ii.prototype.observeUsing=function(t){this._observers===null&&(this._observers=new Set),this._observers.add(t),v(this._fragmentFiber.child,!1,jM,t,void 0,void 0)};function jM(t,n){return t.tag===6||(t=y(t),n.observe(t)),!1}Ii.prototype.unobserveUsing=function(t){var n=this._observers;if(n!==null&&n.has(t)){n.delete(t),v(this._fragmentFiber.child,!1,ZM,t,void 0,void 0);for(var a=n=0;a<da.length;a++){var r=da[a];r.fragmentInstance===this&&r.observer===t?t.unobserve(r.instance):da[n++]=r}da.length=n}};function ZM(t,n){return t.tag===6||(t=y(t),n.unobserve(t)),!1}var da=[],bd=!1;function KM(t,n,a){da.push({fragmentInstance:t,observer:n,instance:a}),bd||(bd=!0,sE(function(){bd=!1;var r=da;da=[];for(var c=0;c<r.length;c++){var u=r[c];u.observer.unobserve(u.instance)}}))}Ii.prototype.getClientRects=function(){var t=[];return v(this._fragmentFiber.child,!1,QM,t,void 0,void 0),t};function QM(t,n){if(t.tag===6){t=t.stateNode;var a=t.ownerDocument.createRange();a.selectNodeContents(t),n.push.apply(n,a.getClientRects())}else t=y(t),n.push.apply(n,t.getClientRects());return!1}Ii.prototype.getRootNode=function(t){var n=g(this._fragmentFiber);return n===null?this:y(n).getRootNode(t)},Ii.prototype.compareDocumentPosition=function(t){var n=g(this._fragmentFiber);if(n===null)return Node.DOCUMENT_POSITION_DISCONNECTED;var a=[];v(this._fragmentFiber.child,!1,Ed,a,void 0,void 0);var r=y(n);if(a.length===0){if(a=r,M(this._fragmentFiber)){t:{for(n=this._fragmentFiber.return;n!==null;){if(n.tag===4){n=n.stateNode.containerInfo;break t}if(n.tag===3||n.tag===5||n.tag===27)break;n=n.return}n=null}n!=null&&(a=n)}n=this._fragmentFiber;var c=r=a.compareDocumentPosition(t);return a===t?c=Node.DOCUMENT_POSITION_CONTAINS:r&Node.DOCUMENT_POSITION_CONTAINED_BY&&(a=A(n)[1],a===null?c=Node.DOCUMENT_POSITION_PRECEDING:(t=y(a).compareDocumentPosition(t),c=t===0||t&Node.DOCUMENT_POSITION_FOLLOWING?Node.DOCUMENT_POSITION_FOLLOWING:Node.DOCUMENT_POSITION_PRECEDING)),c|=Node.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC}n=y(a[0]),c=y(a[a.length-1]);var u=M(this._fragmentFiber)?n.parentElement:r;if(u==null)return Node.DOCUMENT_POSITION_DISCONNECTED;r=u.compareDocumentPosition(n)&Node.DOCUMENT_POSITION_CONTAINED_BY,u=u.compareDocumentPosition(c)&Node.DOCUMENT_POSITION_CONTAINED_BY;var _=n.compareDocumentPosition(t),w=c.compareDocumentPosition(t),z=_&Node.DOCUMENT_POSITION_CONTAINED_BY||w&Node.DOCUMENT_POSITION_CONTAINED_BY;return w=r&&u&&_&Node.DOCUMENT_POSITION_FOLLOWING&&w&Node.DOCUMENT_POSITION_PRECEDING,n=r&&n===t||u&&c===t||z||w?Node.DOCUMENT_POSITION_CONTAINED_BY:!r&&n===t||!u&&c===t?Node.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC:_,n&Node.DOCUMENT_POSITION_DISCONNECTED||n&Node.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC||JM(n,this._fragmentFiber,a[0],a[a.length-1],t)?n:Node.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC};function JM(t,n,a,r,c){var u=pe(c);if(t&Node.DOCUMENT_POSITION_CONTAINED_BY){if(a=!!u)t:{for(;u!==null;){if(u.tag===7&&(u===n||u.alternate===n)){a=!0;break t}u=u.return}a=!1}return a}if(t&Node.DOCUMENT_POSITION_CONTAINS){if(u===null)return u=c.ownerDocument,c===u||c===u.documentElement||c===u.body;t:{for(u=n,n=g(n);u!==null;){if(!(u.tag!==5&&u.tag!==3&&u.tag!==27||u!==n&&u.alternate!==n)){u=!0;break t}u=u.return}u=!1}return u}return t&Node.DOCUMENT_POSITION_PRECEDING?((n=!!u)&&!(n=u===a)&&(n=D(a,u,L),n===null?n=!1:(v(n,!0,F,u,a),u=S,S=null,n=u!==null)),n):t&Node.DOCUMENT_POSITION_FOLLOWING?((n=!!u)&&!(n=u===r)&&(n=D(r,u,L),n===null?n=!1:(v(n,!0,N,u,r),u=S,U=S=null,n=u!==null)),n):!1}function uv(t,n){var a=t.ownerDocument.createRange();a.selectNodeContents(t),t=a.getBoundingClientRect(),window.scrollTo(window.scrollX+t.left,n?window.scrollY+t.top:window.scrollY+t.bottom-window.innerHeight)}Ii.prototype.scrollIntoView=function(t){if(typeof t=="object")throw Error(s(566));var n=[];v(this._fragmentFiber.child,!1,Ed,n,void 0,void 0);var a=t!==!1;if(n.length===0){var r=A(this._fragmentFiber);if(r=a?r[1]||r[0]||g(this._fragmentFiber):r[0]||r[1],r===null)return;if(r.tag===6){t=y(r),uv(t,a);return}if(r=y(r),r.nodeType!==9){if(r.nodeType===11){a="host"in r?r.host:null,a!==null&&a.scrollIntoView(t);return}r.scrollIntoView(t)}}for(r=a?n.length-1:0;r!==(a?-1:n.length);){var c=n[r];c.tag===6?(c=y(c),uv(c,a)):y(c).scrollIntoView(t),r+=a?-1:1}};function $M(t,n){return t=y(t),fv(t,n),!1}function fv(t,n){t.reactFragments==null&&(t.reactFragments=new Set),t.reactFragments.add(n)}function hv(t,n){var a=n._eventListeners;if(a!==null)for(var r=0;r<a.length;r++){var c=a[r];t.addEventListener(c.type,c.attachedListener,go(c.optionsOrUseCapture))}t.nodeType!==3&&(a=n._observers,a!==null&&a.forEach(function(u){for(var _=0,w=0;w<da.length;w++){var z=da[w];(z.fragmentInstance!==n||z.observer!==u||z.instance!==t)&&(da[_++]=z)}da.length=_,u.observe(t)}),fv(t,n))}function tE(t,n){var a=n._eventListeners;if(a!==null)for(var r=0;r<a.length;r++){var c=a[r];t.removeEventListener(c.type,c.attachedListener,go(c.optionsOrUseCapture))}t.nodeType!==3&&(a=n._observers,a!==null&&a.forEach(function(u){typeof u.rootMargin=="string"?KM(n,u,t):u.unobserve(t)}),t.reactFragments!=null&&t.reactFragments.delete(n))}function Td(t){var n=t.firstChild;for(n&&n.nodeType===10&&(n=n.nextSibling);n;){var a=n;switch(n=n.nextSibling,a.nodeName){case"HTML":case"HEAD":case"BODY":Td(a),ee(a);continue;case"SCRIPT":case"STYLE":continue;case"LINK":if(a.rel.toLowerCase()==="stylesheet")continue}t.removeChild(a)}}function eE(t,n,a,r){for(;t.nodeType===1;){var c=a;if(t.nodeName.toLowerCase()!==n.toLowerCase()){if(!r&&(t.nodeName!=="INPUT"||t.type!=="hidden"))break}else if(r){if(!t[Bt])switch(n){case"meta":if(!t.hasAttribute("itemprop"))break;return t;case"link":if(u=t.getAttribute("rel"),u==="stylesheet"&&t.hasAttribute("data-precedence"))break;if(u!==c.rel||t.getAttribute("href")!==(c.href==null||c.href===""?null:c.href)||t.getAttribute("crossorigin")!==(c.crossOrigin==null?null:c.crossOrigin)||t.getAttribute("title")!==(c.title==null?null:c.title))break;return t;case"style":if(t.hasAttribute("data-precedence"))break;return t;case"script":if(u=t.getAttribute("src"),(u!==(c.src==null?null:c.src)||t.getAttribute("type")!==(c.type==null?null:c.type)||t.getAttribute("crossorigin")!==(c.crossOrigin==null?null:c.crossOrigin))&&u&&t.hasAttribute("async")&&!t.hasAttribute("itemprop"))break;return t;default:return t}}else if(n==="input"&&t.type==="hidden"){var u=c.name==null?null:""+c.name;if(c.type==="hidden"&&t.getAttribute("name")===u)return t}else return t;if(t=ta(t.nextSibling),t===null)break}return null}function nE(t,n,a){if(n==="")return null;for(;t.nodeType!==3;)if((t.nodeType!==1||t.nodeName!=="INPUT"||t.type!=="hidden")&&!a||(t=ta(t.nextSibling),t===null))return null;return t}function dv(t,n){for(;t.nodeType!==8;)if((t.nodeType!==1||t.nodeName!=="INPUT"||t.type!=="hidden")&&!n||(t=ta(t.nextSibling),t===null))return null;return t}function Ad(t){return t.data==="$?"||t.data==="$~"}function Rd(t){return t.data==="$!"||t.data==="$?"&&t.ownerDocument.readyState!=="loading"}function iE(t,n){var a=t.ownerDocument;if(t.data==="$~")t._reactRetry=n;else if(t.data!=="$?"||a.readyState!=="loading")n();else{var r=function(){n(),a.removeEventListener("DOMContentLoaded",r)};a.addEventListener("DOMContentLoaded",r),t._reactRetry=r}}function ta(t){for(;t!=null;t=t.nextSibling){var n=t.nodeType;if(n===1||n===3)break;if(n===8){if(n=t.data,n==="$"||n==="$!"||n==="$?"||n==="$~"||n==="&"||n==="F!"||n==="F")break;if(n==="/$"||n==="/&")return null}}return t}var wd=null;function pv(t){t=t.nextSibling;for(var n=0;t;){if(t.nodeType===8){var a=t.data;if(a==="/$"||a==="/&"){if(n===0)return ta(t.nextSibling);n--}else a!=="$"&&a!=="$!"&&a!=="$?"&&a!=="$~"&&a!=="&"||n++}t=t.nextSibling}return null}function mv(t){t=t.previousSibling;for(var n=0;t;){if(t.nodeType===8){var a=t.data;if(a==="$"||a==="$!"||a==="$?"||a==="$~"||a==="&"){if(n===0)return t;n--}else a!=="/$"&&a!=="/&"||n++}t=t.previousSibling}return null}function aE(t,n){function a(){r=!0}if(t.ownerDocument.activeElement===t)return!0;var r=!1;try{t.ownerDocument.addEventListener("focus",a,!0),(t.focus||HTMLElement.prototype.focus).call(t,n)}finally{t.ownerDocument.removeEventListener("focus",a,!0)}return r}function sE(t){ev(function(){ev(function(n){return t(n)})})}function gv(t,n,a){switch(n=Rl(a),t){case"html":if(t=n.documentElement,!t)throw Error(s(452));return t;case"head":if(t=n.head,!t)throw Error(s(453));return t;case"body":if(t=n.body,!t)throw Error(s(454));return t;default:throw Error(s(451))}}function _v(t,n,a){for(var r in a){var c=a[r];a.hasOwnProperty(r)&&c!=null&&an(t,n,r,null,OM,c)}a.dangerouslySetInnerHTML!=null&&(t.textContent=""),t.onclick===qi&&(t.onclick=null),ee(t)}function Cd(t){for(var n=t.attributes;n.length;)t.removeAttributeNode(n[0]);ee(t)}var ea=new Map,vv=new Set;function wl(t){if(typeof t.getRootNode=="function"){var n=t.getRootNode();if(n.nodeType===9||n.nodeType===11)return n}return t.nodeType===9?t:t.ownerDocument}var os=It.d;It.d={f:rE,r:oE,D:lE,C:cE,L:uE,m:fE,X:dE,S:hE,M:pE};function rE(){var t=os.f(),n=ru();return t||n}function oE(t){var n=Se(t);n!==null&&n.tag===5&&n.type==="form"?Sg(n):os.r(t)}var _o=typeof document>"u"?null:document;function xv(t,n,a){var r=_o;if(r&&typeof n=="string"&&n){var c=Ge(n);c='link[rel="'+t+'"][href="'+c+'"]',typeof a=="string"&&(c+='[crossorigin="'+a+'"]'),vv.has(c)||(vv.add(c),t={rel:t,crossOrigin:a,href:n},r.querySelector(c)===null&&(n=r.createElement("link"),$n(n,"link",t),we(n),r.head.appendChild(n)))}}function lE(t){os.D(t),xv("dns-prefetch",t,null)}function cE(t,n){os.C(t,n),xv("preconnect",t,n)}function uE(t,n,a){os.L(t,n,a);var r=_o;if(r&&t&&n){var c='link[rel="preload"][as="'+Ge(n)+'"]';n==="image"&&a&&a.imageSrcSet?(c+='[imagesrcset="'+Ge(a.imageSrcSet)+'"]',typeof a.imageSizes=="string"&&(c+='[imagesizes="'+Ge(a.imageSizes)+'"]')):c+='[href="'+Ge(t)+'"]';var u=c;switch(n){case"style":u=vo(t);break;case"script":u=xo(t)}if(!(ea.has(u)||(t=I({rel:"preload",href:n==="image"&&a&&a.imageSrcSet?void 0:t,as:n},a),ea.set(u,t),r.querySelector(c)!==null||n==="style"&&r.querySelector(Cl(u))||n==="script"&&r.querySelector(Nl(u))))){var _=r.createElement("link");$n(_,"link",t),n==="style"&&(_[$t]=!0,_.onload=_.onerror=function(){Qe(_)}),we(_),r.head.appendChild(_)}}}function fE(t,n){os.m(t,n);var a=_o;if(a&&t){var r=n&&typeof n.as=="string"?n.as:"script",c='link[rel="modulepreload"][as="'+Ge(r)+'"][href="'+Ge(t)+'"]',u=c;switch(r){case"audioworklet":case"paintworklet":case"serviceworker":case"sharedworker":case"worker":case"script":u=xo(t)}if(!ea.has(u)&&(t=I({rel:"modulepreload",href:t},n),ea.set(u,t),a.querySelector(c)===null)){switch(r){case"audioworklet":case"paintworklet":case"serviceworker":case"sharedworker":case"worker":case"script":if(a.querySelector(Nl(u)))return}r=a.createElement("link"),$n(r,"link",t),we(r),a.head.appendChild(r)}}}function hE(t,n,a){os.S(t,n,a);var r=_o;if(r&&t){var c=Ne(r).hoistableStyles,u=vo(t);n=n||"default";var _=c.get(u);if(!_){var w={loading:0,preload:null};if(_=r.querySelector(Cl(u)))w.loading=5;else{t=I({rel:"stylesheet",href:t,"data-precedence":n},a),(a=ea.get(u))&&Nd(t,a);var z=_=r.createElement("link");we(z),$n(z,"link",t),z._p=new Promise(function(tt,ft){z.onload=tt,z.onerror=ft}),z.addEventListener("load",function(){w.loading|=1}),z.addEventListener("error",function(){w.loading|=2}),w.loading|=4,du(_,n,r)}_={type:"stylesheet",instance:_,count:1,state:w},c.set(u,_)}}}function dE(t,n){os.X(t,n);var a=_o;if(a&&t){var r=Ne(a).hoistableScripts,c=xo(t),u=r.get(c);u||(u=a.querySelector(Nl(c)),u||(t=I({src:t,async:!0},n),(n=ea.get(c))&&Dd(t,n),u=a.createElement("script"),we(u),$n(u,"link",t),a.head.appendChild(u)),u={type:"script",instance:u,count:1,state:null},r.set(c,u))}}function pE(t,n){os.M(t,n);var a=_o;if(a&&t){var r=Ne(a).hoistableScripts,c=xo(t),u=r.get(c);u||(u=a.querySelector(Nl(c)),u||(t=I({src:t,async:!0,type:"module"},n),(n=ea.get(c))&&Dd(t,n),u=a.createElement("script"),we(u),$n(u,"link",t),a.head.appendChild(u)),u={type:"script",instance:u,count:1,state:null},r.set(c,u))}}function Sv(t,n,a,r){var c=(c=We.current)?wl(c):null;if(!c)throw Error(s(446));switch(t){case"meta":case"title":return null;case"style":return typeof a.precedence=="string"&&typeof a.href=="string"?(a=vo(a.href),n=Ne(c).hoistableStyles,r=n.get(a),r||(r={type:"style",instance:null,count:0,state:null},n.set(a,r)),r):{type:"void",instance:null,count:0,state:null};case"link":if(a.rel==="stylesheet"&&typeof a.href=="string"&&typeof a.precedence=="string"){t=vo(a.href);var u=Ne(c).hoistableStyles,_=u.get(t);if(_||(c=c.ownerDocument||c,_={type:"stylesheet",instance:null,count:0,state:{loading:0,preload:null}},u.set(t,_),(u=c.querySelector(Cl(t)))?u._p||(_.instance=u,_.state.loading=5):(u=ea.get(t),u||(u={rel:"preload",as:"style",href:a.href,crossOrigin:a.crossOrigin,integrity:a.integrity,media:a.media,hrefLang:a.hrefLang,referrerPolicy:a.referrerPolicy},ea.set(t,u)),mE(c,t,u,_.state))),n&&r===null)throw Error(s(528,""));return _}if(n&&r!==null)throw Error(s(529,""));return null;case"script":return n=a.async,a=a.src,typeof a=="string"&&n&&typeof n!="function"&&typeof n!="symbol"?(a=xo(a),n=Ne(c).hoistableScripts,r=n.get(a),r||(r={type:"script",instance:null,count:0,state:null},n.set(a,r)),r):{type:"void",instance:null,count:0,state:null};default:throw Error(s(444,t))}}function vo(t){return'href="'+Ge(t)+'"'}function Cl(t){return'link[rel="stylesheet"]['+t+"]"}function yv(t){return I({},t,{"data-precedence":t.precedence,precedence:null})}function mE(t,n,a,r){if(n=t.querySelector('link[rel="preload"][as="style"]['+n+"]")){if(n[$t]!==!0){r.loading=1;return}}else n=t.createElement("link"),n[$t]=!0,n.onload=n.onerror=Qe.bind(null,n),$n(n,"link",a),we(n),t.head.appendChild(n);r.preload=n,n.addEventListener("load",function(){return r.loading|=1}),n.addEventListener("error",function(){return r.loading|=2})}function xo(t){return'[src="'+Ge(t)+'"]'}function Nl(t){return"script[async]"+t}function Mv(t,n,a){if(n.count++,n.instance===null)switch(n.type){case"style":var r=t.querySelector('style[data-href~="'+Ge(a.href)+'"]');if(r)return n.instance=r,we(r),r;var c=I({},a,{"data-href":a.href,"data-precedence":a.precedence,href:null,precedence:null});return r=(t.ownerDocument||t).createElement("style"),we(r),$n(r,"style",c),du(r,a.precedence,t),n.instance=r;case"stylesheet":c=vo(a.href);var u=t.querySelector(Cl(c));if(u)return n.state.loading|=4,n.instance=u,we(u),u;r=yv(a),(c=ea.get(c))&&Nd(r,c),u=(t.ownerDocument||t).createElement("link"),we(u);var _=u;return _._p=new Promise(function(w,z){_.onload=w,_.onerror=z}),$n(u,"link",r),n.state.loading|=4,du(u,a.precedence,t),n.instance=u;case"script":return u=xo(a.src),(c=t.querySelector(Nl(u)))?(n.instance=c,we(c),c):(r=a,(c=ea.get(u))&&(r=I({},a),Dd(r,c)),t=t.ownerDocument||t,c=t.createElement("script"),we(c),$n(c,"link",r),t.head.appendChild(c),n.instance=c);case"void":return null;default:throw Error(s(443,n.type))}else n.type==="stylesheet"&&(n.state.loading&4)===0&&(r=n.instance,n.state.loading|=4,du(r,a.precedence,t));return n.instance}function du(t,n,a){for(var r=a.querySelectorAll('link[rel="stylesheet"][data-precedence],style[data-precedence]'),c=r.length?r[r.length-1]:null,u=c,_=0;_<r.length;_++){var w=r[_];if(w.dataset.precedence===n)u=w;else if(u!==c)break}u?u.parentNode.insertBefore(t,u.nextSibling):(n=a.nodeType===9?a.head:a,n.insertBefore(t,n.firstChild))}function Nd(t,n){t.crossOrigin==null&&(t.crossOrigin=n.crossOrigin),t.referrerPolicy==null&&(t.referrerPolicy=n.referrerPolicy),t.title==null&&(t.title=n.title)}function Dd(t,n){t.crossOrigin==null&&(t.crossOrigin=n.crossOrigin),t.referrerPolicy==null&&(t.referrerPolicy=n.referrerPolicy),t.integrity==null&&(t.integrity=n.integrity)}var pu=null;function Ev(t,n,a){if(pu===null){var r=new Map,c=pu=new Map;c.set(a,r)}else c=pu,r=c.get(a),r||(r=new Map,c.set(a,r));if(r.has(t))return r;for(r.set(t,null),a=a.getElementsByTagName(t),c=0;c<a.length;c++){var u=a[c];if(!(u[Bt]||u[R]||t==="link"&&u.getAttribute("rel")==="stylesheet")&&u.namespaceURI!=="http://www.w3.org/2000/svg"){var _=u.getAttribute(n)||"";_=t+_;var w=r.get(_);w?w.push(u):r.set(_,[u])}}return r}function Ud(t,n,a){t=t.ownerDocument||t,t.head.insertBefore(a,n==="title"?t.querySelector("head > title"):null)}function gE(t,n,a){if(a===1||n.itemProp!=null)return!1;switch(t){case"meta":case"title":return!0;case"style":if(typeof n.precedence!="string"||typeof n.href!="string"||n.href==="")break;return!0;case"link":if(typeof n.rel!="string"||typeof n.href!="string"||n.href===""||n.onLoad||n.onError)break;return n.rel==="stylesheet"?(t=n.disabled,typeof n.precedence=="string"&&t==null):!0;case"script":if(n.async&&typeof n.async!="function"&&typeof n.async!="symbol"&&!n.onLoad&&!n.onError&&n.src&&typeof n.src=="string")return!0}return!1}function bv(t,n){return t==="img"&&n.src!=null&&n.src!==""&&n.onLoad==null&&n.loading!=="lazy"}function Tv(t){return!(t.type==="stylesheet"&&(t.state.loading&3)===0)}function Av(t){return(t.width||100)*(t.height||100)*(typeof devicePixelRatio=="number"?devicePixelRatio:1)*.25}function Rv(t,n){typeof n.decode=="function"&&(t.imgCount++,n.complete||(t.imgBytes+=Av(n),t.suspenseyImages.push(n)),t=xE.bind(t),n.decode().then(t,t))}function _E(t,n,a,r){if(a.type==="stylesheet"&&(typeof r.media!="string"||matchMedia(r.media).matches!==!1)&&(a.state.loading&4)===0){if(a.instance===null){var c=vo(r.href),u=n.querySelector(Cl(c));if(u){n=u._p,n!==null&&typeof n=="object"&&typeof n.then=="function"&&(t.count++,t=Dl.bind(t),n.then(t,t)),a.state.loading|=4,a.instance=u,we(u);return}u=n.ownerDocument||n,r=yv(r),(c=ea.get(c))&&Nd(r,c),u=u.createElement("link"),we(u);var _=u;_._p=new Promise(function(w,z){_.onload=w,_.onerror=z}),$n(u,"link",r),a.instance=u}t.stylesheets===null&&(t.stylesheets=new Map),t.stylesheets.set(a,n),(n=a.state.preload)&&(a.state.loading&3)===0&&(t.count++,a=Dl.bind(t),n.addEventListener("load",a),n.addEventListener("error",a))}}var mu=0;function vE(t,n){return t.stylesheets&&t.count===0&&_u(t,t.stylesheets),0<t.count||0<t.imgCount?function(a){var r=setTimeout(function(){if(t.stylesheets&&_u(t,t.stylesheets),t.unsuspend){var u=t.unsuspend;t.unsuspend=null,u()}},6e4+n);0<t.imgBytes&&mu===0&&(mu=62500*IM());var c=setTimeout(function(){if(t.waitingForImages=!1,t.count===0&&(t.stylesheets&&_u(t,t.stylesheets),t.unsuspend)){var u=t.unsuspend;t.unsuspend=null,u()}},(t.imgBytes>mu?50:800)+n);return t.unsuspend=a,function(){t.unsuspend=null,clearTimeout(r),clearTimeout(c)}}:null}function wv(t){if(t.count===0&&(t.imgCount===0||!t.waitingForImages)){if(t.stylesheets)_u(t,t.stylesheets);else if(t.unsuspend){var n=t.unsuspend;t.unsuspend=null,n()}}}function Dl(){this.count--,wv(this)}function xE(){this.imgCount--,wv(this)}var gu=null;function _u(t,n){t.stylesheets=null,t.unsuspend!==null&&(t.count++,gu=new Map,n.forEach(SE,t),gu=null,Dl.call(t))}function SE(t,n){if(!(n.state.loading&4)){var a=gu.get(t);if(a)var r=a.get(null);else{a=new Map,gu.set(t,a);for(var c=t.querySelectorAll("link[data-precedence],style[data-precedence]"),u=0;u<c.length;u++){var _=c[u];(_.nodeName==="LINK"||_.getAttribute("media")!=="not all")&&(a.set(_.dataset.precedence,_),r=_)}r&&a.set(null,r)}c=n.instance,_=c.getAttribute("data-precedence"),u=a.get(_)||r,u===r&&a.set(null,c),a.set(_,c),this.count++,r=Dl.bind(this),c.addEventListener("load",r),c.addEventListener("error",r),u?u.parentNode.insertBefore(c,u.nextSibling):(t=t.nodeType===9?t.head:t,t.insertBefore(c,t.firstChild)),n.state.loading|=4}}var So={$$typeof:et,Provider:null,Consumer:null,_currentValue:Ze,_currentValue2:Ze,_threadCount:0};function yE(t,n,a,r,c,u,_,w,z){this.tag=1,this.containerInfo=t,this.pingCache=this.current=this.pendingChildren=null,this.timeoutHandle=-1,this.callbackNode=this.next=this.pendingContext=this.context=this.cancelPendingCommit=null,this.callbackPriority=0,this.expirationTimes=Ri(-1),this.entangledLanes=this.shellSuspendCounter=this.errorRecoveryDisabledLanes=this.expiredLanes=this.warmLanes=this.pingedLanes=this.suspendedLanes=this.pendingLanes=0,this.entanglements=Ri(0),this.hiddenUpdates=Ri(null),this.identifierPrefix=r,this.onUncaughtError=c,this.onCaughtError=u,this.onRecoverableError=_,this.pooledCache=null,this.pooledCacheLanes=0,this.formState=z,this.transitionTypes=null,this.incompleteTransitions=new Map}function Cv(t,n,a,r,c,u,_,w,z,tt,ft,Tt){return t=new yE(t,n,a,_,z,tt,ft,Tt,w),n=1,u===!0&&(n|=24),u=gi(3,null,null,n),t.current=u,u.stateNode=t,n=qf(),n.refCount++,t.pooledCache=n,n.refCount++,u.memoizedState={element:r,isDehydrated:a,cache:n},Qf(u),t}function Nv(t){return t?(t=Wr,t):Wr}function Dv(t,n,a,r,c,u){c=Nv(c),r.context===null?r.context=c:r.pendingContext=c,r=Ns(n),r.payload={element:a},u=u===void 0?null:u,u!==null&&(r.callback=u),a=Ds(t,r,n),a!==null&&(Si(a,t,n),ll(a,t,n))}function Uv(t,n){if(t=t.memoizedState,t!==null&&t.dehydrated!==null){var a=t.retryLane;t.retryLane=a!==0&&a<n?a:n}}function Ld(t,n){Uv(t,n),(t=t.alternate)&&Uv(t,n)}function Lv(t){if(t.tag===13||t.tag===31){var n=lr(t,67108864);n!==null&&Si(n,t,67108864),Ld(t,67108864)}}function Ov(t){if(t.tag===13||t.tag===31){var n=Pi();n=Ss(n);var a=lr(t,n);a!==null&&Si(a,t,n),Ld(t,n)}}var yo=!0;function ME(t,n,a,r){var c=Mt.T;Mt.T=null;var u=It.p;try{It.p=2,Od(t,n,a,r)}finally{It.p=u,Mt.T=c}}function EE(t,n,a,r){var c=Mt.T;Mt.T=null;var u=It.p;try{It.p=8,Od(t,n,a,r)}finally{It.p=u,Mt.T=c}}function Od(t,n,a,r){if(yo){var c=Pd(r);if(c===null)md(t,n,r,vu,a),Iv(t,r);else if(TE(c,t,n,a,r))r.stopPropagation();else if(Iv(t,r),n&4&&-1<bE.indexOf(t)){for(;c!==null;){var u=Se(c);if(u!==null)switch(u.tag){case 3:if(u=u.stateNode,u.current.memoizedState.isDehydrated){var _=Ti(u.pendingLanes);if(_!==0){var w=u;for(w.pendingLanes|=2,w.entangledLanes|=2;_;){var z=1<<31-xe(_);w.entanglements[1]|=z,_&=~z}Oa(u),(Je&6)===0&&(iu=Kt()+500,bl(0))}}break;case 31:case 13:w=lr(u,2),w!==null&&Si(w,u,2),ru(),Ld(u,2)}if(u=Pd(r),u===null&&md(t,n,r,vu,a),u===c)break;c=u}c!==null&&r.stopPropagation()}else md(t,n,r,null,a)}}function Pd(t){return t=Sf(t),Id(t)}var vu=null;function Id(t){if(vu=null,t=pe(t),t!==null){var n=f(t);if(n===null)t=null;else{var a=n.tag;if(a===13){if(t=h(n),t!==null)return t;t=null}else if(a===31){if(t=d(n),t!==null)return t;t=null}else if(a===3){if(n.stateNode.current.memoizedState.isDehydrated)return n.tag===3?n.stateNode.containerInfo:null;t=null}else n!==t&&(t=null)}}return vu=t,null}function Pv(t){switch(t){case"beforetoggle":case"cancel":case"click":case"close":case"contextmenu":case"copy":case"cut":case"auxclick":case"dblclick":case"dragend":case"dragstart":case"drop":case"focusin":case"focusout":case"input":case"invalid":case"keydown":case"keypress":case"keyup":case"mousedown":case"mouseup":case"paste":case"pause":case"play":case"pointercancel":case"pointerdown":case"pointerup":case"ratechange":case"reset":case"seeked":case"submit":case"toggle":case"touchcancel":case"touchend":case"touchstart":case"volumechange":case"change":case"selectionchange":case"textInput":case"compositionstart":case"compositionend":case"compositionupdate":case"beforeblur":case"afterblur":case"beforeinput":case"blur":case"fullscreenchange":case"fullscreenerror":case"focus":case"hashchange":case"popstate":case"select":case"selectstart":return 2;case"drag":case"dragenter":case"dragexit":case"dragleave":case"dragover":case"mousemove":case"mouseout":case"mouseover":case"pointermove":case"pointerout":case"pointerover":case"resize":case"scroll":case"touchmove":case"wheel":case"mouseenter":case"mouseleave":case"pointerenter":case"pointerleave":return 8;case"message":switch(le()){case he:return 2;case k:return 8;case Ot:case Et:return 32;case Gt:return 268435456;default:return 32}default:return 32}}var zd=!1,ks=null,Xs=null,Ws=null,Ul=new Map,Ll=new Map,Ys=[],bE="mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset".split(" ");function Iv(t,n){switch(t){case"focusin":case"focusout":ks=null;break;case"dragenter":case"dragleave":Xs=null;break;case"mouseover":case"mouseout":Ws=null;break;case"pointerover":case"pointerout":Ul.delete(n.pointerId);break;case"gotpointercapture":case"lostpointercapture":Ll.delete(n.pointerId)}}function Ol(t,n,a,r,c,u){return t===null||t.nativeEvent!==u?(t={blockedOn:n,domEventName:a,eventSystemFlags:r,nativeEvent:u,targetContainers:[c]},n!==null&&(n=Se(n),n!==null&&Lv(n)),t):(t.eventSystemFlags|=r,n=t.targetContainers,c!==null&&n.indexOf(c)===-1&&n.push(c),t)}function TE(t,n,a,r,c){switch(n){case"focusin":return ks=Ol(ks,t,n,a,r,c),!0;case"dragenter":return Xs=Ol(Xs,t,n,a,r,c),!0;case"mouseover":return Ws=Ol(Ws,t,n,a,r,c),!0;case"pointerover":var u=c.pointerId;return Ul.set(u,Ol(Ul.get(u)||null,t,n,a,r,c)),!0;case"gotpointercapture":return u=c.pointerId,Ll.set(u,Ol(Ll.get(u)||null,t,n,a,r,c)),!0}return!1}function zv(t){var n=pe(t.target);if(n!==null){var a=f(n);if(a!==null){if(n=a.tag,n===13){if(n=h(a),n!==null){t.blockedOn=n,mi(t.priority,function(){Ov(a)});return}}else if(n===31){if(n=d(a),n!==null){t.blockedOn=n,mi(t.priority,function(){Ov(a)});return}}else if(n===3&&a.stateNode.current.memoizedState.isDehydrated){t.blockedOn=a.tag===3?a.stateNode.containerInfo:null;return}}}t.blockedOn=null}function xu(t){if(t.blockedOn!==null)return!1;for(var n=t.targetContainers;0<n.length;){var a=Pd(t.nativeEvent);if(a===null){a=t.nativeEvent;var r=new a.constructor(a.type,a);ba=r,a.target.dispatchEvent(r),ba=null}else return n=Se(a),n!==null&&Lv(n),t.blockedOn=a,!1;n.shift()}return!0}function Bv(t,n,a){xu(t)&&a.delete(n)}function AE(){zd=!1,ks!==null&&xu(ks)&&(ks=null),Xs!==null&&xu(Xs)&&(Xs=null),Ws!==null&&xu(Ws)&&(Ws=null),Ul.forEach(Bv),Ll.forEach(Bv)}function Su(t,n){t.blockedOn===n&&(t.blockedOn=null,zd||(zd=!0,o.unstable_scheduleCallback(o.unstable_NormalPriority,AE)))}var yu=null;function Fv(t){yu!==t&&(yu=t,o.unstable_scheduleCallback(o.unstable_NormalPriority,function(){yu===t&&(yu=null);for(var n=0;n<t.length;n+=3){var a=t[n],r=t[n+1],c=t[n+2];if(typeof r!="function"){if(Id(r||a)===null)continue;break}var u=Se(a);u!==null&&(t.splice(n,3),n-=3,vh(u,{pending:!0,data:c,method:a.method,action:r},r,c))}}))}function Mo(t){function n(z){return Su(z,t)}ks!==null&&Su(ks,t),Xs!==null&&Su(Xs,t),Ws!==null&&Su(Ws,t),Ul.forEach(n),Ll.forEach(n);for(var a=0;a<Ys.length;a++){var r=Ys[a];r.blockedOn===t&&(r.blockedOn=null)}for(;0<Ys.length&&(a=Ys[0],a.blockedOn===null);)zv(a),a.blockedOn===null&&Ys.shift();if(a=(t.ownerDocument||t).$$reactFormReplay,a!=null)for(r=0;r<a.length;r+=3){var c=a[r],u=a[r+1],_=c[H]||null;if(typeof u=="function")_||Fv(a);else if(_){var w=null;if(u&&u.hasAttribute("formAction")){if(c=u,_=u[H]||null)w=_.formAction;else if(Id(c)!==null)continue}else w=_.action;typeof w=="function"?a[r+1]=w:(a.splice(r,3),r-=3),Fv(a)}}}function Hv(){function t(u){u.canIntercept&&u.info==="react-transition"&&u.intercept({handler:function(){return new Promise(function(_){return c=_})},focusReset:"manual",scroll:"manual"})}function n(){c!==null&&(c(),c=null),r||setTimeout(a,20)}function a(){if(!r&&!navigation.transition){var u=navigation.currentEntry;u&&u.url!=null&&navigation.navigate(u.url,{state:u.getState(),info:"react-transition",history:"replace"})}}if(typeof navigation=="object"){var r=!1,c=null;return navigation.addEventListener("navigate",t),navigation.addEventListener("navigatesuccess",n),navigation.addEventListener("navigateerror",n),setTimeout(a,100),function(){r=!0,navigation.removeEventListener("navigate",t),navigation.removeEventListener("navigatesuccess",n),navigation.removeEventListener("navigateerror",n),c!==null&&(c(),c=null)}}}function Bd(t){this._internalRoot=t}Mu.prototype.render=Bd.prototype.render=function(t){var n=this._internalRoot;if(n===null)throw Error(s(409));var a=n.current,r=Pi();Dv(a,r,t,n,null,null)},Mu.prototype.unmount=Bd.prototype.unmount=function(){var t=this._internalRoot;if(t!==null){this._internalRoot=null;var n=t.containerInfo;Dv(t.current,2,null,t,null,null),ru(),n[ut]=null}};function Mu(t){this._internalRoot=t}Mu.prototype.unstable_scheduleHydration=function(t){if(t){var n=ar();t={blockedOn:null,target:t,priority:n};for(var a=0;a<Ys.length&&n!==0&&n<Ys[a].priority;a++);Ys.splice(a,0,t),a===0&&zv(t)}};var Gv=e.version;if(Gv!=="19.3.0")throw Error(s(527,Gv,"19.3.0"));It.findDOMNode=function(t){var n=t._reactInternals;if(n===void 0)throw typeof t.render=="function"?Error(s(188)):(t=Object.keys(t).join(","),Error(s(268,t)));return t=p(n),t=t!==null?x(t):null,t=t===null?null:t.stateNode,t};var RE={bundleType:0,version:"19.3.0",rendererPackageName:"react-dom",currentDispatcherRef:Mt,reconcilerVersion:"19.3.0"};if(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__<"u"){var Eu=__REACT_DEVTOOLS_GLOBAL_HOOK__;if(!Eu.isDisabled&&Eu.supportsFiber)try{se=Eu.inject(RE),Yt=Eu}catch{}}return Il.createRoot=function(t,n){if(!l(t))throw Error(s(299));var a=!1,r="",c=Ng,u=Dg,_=Ug;return n!=null&&(n.unstable_strictMode===!0&&(a=!0),n.identifierPrefix!==void 0&&(r=n.identifierPrefix),n.onUncaughtError!==void 0&&(c=n.onUncaughtError),n.onCaughtError!==void 0&&(u=n.onCaughtError),n.onRecoverableError!==void 0&&(_=n.onRecoverableError)),n=Cv(t,1,!1,null,null,a,r,null,c,u,_,Hv),t[ut]=n.current,pd(t),new Bd(n)},Il.hydrateRoot=function(t,n,a){if(!l(t))throw Error(s(299));var r=!1,c="",u=Ng,_=Dg,w=Ug,z=null;return a!=null&&(a.unstable_strictMode===!0&&(r=!0),a.identifierPrefix!==void 0&&(c=a.identifierPrefix),a.onUncaughtError!==void 0&&(u=a.onUncaughtError),a.onCaughtError!==void 0&&(_=a.onCaughtError),a.onRecoverableError!==void 0&&(w=a.onRecoverableError),a.formState!==void 0&&(z=a.formState)),n=Cv(t,1,!0,n,a??null,r,c,z,u,_,w,Hv),n.context=Nv(null),a=n.current,r=Pi(),r=Ss(r),c=Ns(r),c.callback=null,Ds(a,c,r),a=r,n.current.lanes=a,Wi(n,a),Oa(n),t[ut]=n.current,pd(t),new Mu(n)},Il.version="19.3.0",Il}var Qv;function zE(){if(Qv)return Gd.exports;Qv=1;function o(){if(!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__>"u"||typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE!="function"))try{__REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(o)}catch(e){console.error(e)}}return o(),Gd.exports=IE(),Gd.exports}var BE=zE();const xm="186",Fo={ROTATE:0,DOLLY:1,PAN:2},zo={ROTATE:0,PAN:1,DOLLY_PAN:2,DOLLY_ROTATE:3},FE=0,Jv=1,HE=2,ql=1,GE=2,Wl=3,Lr=0,Ei=1,Gi=2,ms=0,jl=1,$v=2,tx=3,ex=4,VE=5,Io=100,kE=101,XE=102,WE=103,YE=104,qE=200,jE=201,ZE=202,KE=203,cS=204,uS=205,QE=206,JE=207,$E=208,tb=209,eb=210,nb=211,ib=212,ab=213,sb=214,Ap=0,Rp=1,wp=2,Ql=3,Cp=4,Np=5,Dp=6,Up=7,fS=0,rb=1,ob=2,Ha=0,hS=1,dS=2,pS=3,mS=4,gS=5,_S=6,vS=7,xS=300,Or=301,Vo=302,Wd=303,Yd=304,df=306,Lp=1e3,ps=1001,Op=1002,ei=1003,lb=1004,bu=1005,ri=1006,qd=1007,Dr=1008,Vi=1009,SS=1010,yS=1011,Jl=1012,Sm=1013,Ga=1014,Ba=1015,Va=1016,ym=1017,Mm=1018,$l=1020,MS=35902,ES=35899,bS=1021,TS=1022,_a=1023,vs=1026,Ur=1027,AS=1028,Em=1029,Pr=1030,bm=1031,Tm=1033,Ju=33776,$u=33777,tf=33778,ef=33779,Pp=35840,Ip=35841,zp=35842,Bp=35843,Fp=36196,Hp=37492,Gp=37496,Vp=37488,kp=37489,af=37490,Xp=37491,Wp=37808,Yp=37809,qp=37810,jp=37811,Zp=37812,Kp=37813,Qp=37814,Jp=37815,$p=37816,tm=37817,em=37818,nm=37819,im=37820,am=37821,sm=36492,rm=36494,om=36495,lm=36283,cm=36284,sf=36285,um=36286,cb=3200,fm=0,ub=1,$s="",ia="srgb",rf="srgb-linear",of="linear",sn="srgb",jd=7680,fb=519,hb=512,db=513,pb=514,Am=515,mb=516,gb=517,Rm=518,_b=519,vb=35044,nx="300 es",Fa=2e3,tc=2001;function xb(o){for(let e=o.length-1;e>=0;--e)if(o[e]>=65535)return!0;return!1}function lf(o){return document.createElementNS("http://www.w3.org/1999/xhtml",o)}function Sb(){const o=lf("canvas");return o.style.display="block",o}const ix={};function ax(...o){const e="THREE."+o.shift();console.log(e,...o)}function RS(o){const e=o[0];if(typeof e=="string"&&e.startsWith("TSL:")){const i=o[1];i&&i.isStackTrace?o[0]+=" "+i.getLocation():o[1]='Stack trace not available. Enable "THREE.Node.captureStackTrace" to capture stack traces.'}return o}function ge(...o){o=RS(o);const e="THREE."+o.shift();{const i=o[0];i&&i.isStackTrace?console.warn(i.getError(e)):console.warn(e,...o)}}function je(...o){o=RS(o);const e="THREE."+o.shift();{const i=o[0];i&&i.isStackTrace?console.error(i.getError(e)):console.error(e,...o)}}function Ho(...o){const e=o.join(" ");e in ix||(ix[e]=!0,ge(...o))}function yb(o,e,i){return new Promise(function(s,l){function f(){switch(o.clientWaitSync(e,o.SYNC_FLUSH_COMMANDS_BIT,0)){case o.WAIT_FAILED:l();break;case o.TIMEOUT_EXPIRED:setTimeout(f,i);break;default:s()}}setTimeout(f,i)})}const Mb={[Ap]:Rp,[wp]:Dp,[Cp]:Up,[Ql]:Np,[Rp]:Ap,[Dp]:wp,[Up]:Cp,[Np]:Ql};class nr{addEventListener(e,i){this._listeners===void 0&&(this._listeners={});const s=this._listeners;s[e]===void 0&&(s[e]=[]),s[e].indexOf(i)===-1&&s[e].push(i)}hasEventListener(e,i){const s=this._listeners;return s===void 0?!1:s[e]!==void 0&&s[e].indexOf(i)!==-1}removeEventListener(e,i){const s=this._listeners;if(s===void 0)return;const l=s[e];if(l!==void 0){const f=l.indexOf(i);f!==-1&&l.splice(f,1)}}dispatchEvent(e){const i=this._listeners;if(i===void 0)return;const s=i[e.type];if(s!==void 0){e.target=this;const l=s.slice(0);for(let f=0,h=l.length;f<h;f++)l[f].call(this,e);e.target=null}}}const ai=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"],Zl=Math.PI/180,hm=180/Math.PI;function ic(){const o=Math.random()*4294967295|0,e=Math.random()*4294967295|0,i=Math.random()*4294967295|0,s=Math.random()*4294967295|0;return(ai[o&255]+ai[o>>8&255]+ai[o>>16&255]+ai[o>>24&255]+"-"+ai[e&255]+ai[e>>8&255]+"-"+ai[e>>16&15|64]+ai[e>>24&255]+"-"+ai[i&63|128]+ai[i>>8&255]+"-"+ai[i>>16&255]+ai[i>>24&255]+ai[s&255]+ai[s>>8&255]+ai[s>>16&255]+ai[s>>24&255]).toLowerCase()}function He(o,e,i){return Math.max(e,Math.min(i,o))}function Eb(o,e){return(o%e+e)%e}function Zd(o,e,i){return(1-i)*o+i*e}function zl(o,e){switch(e.constructor){case Float32Array:return o;case Uint32Array:return o/4294967295;case Uint16Array:return o/65535;case Uint8Array:case Uint8ClampedArray:return o/255;case Int32Array:return Math.max(o/2147483647,-1);case Int16Array:return Math.max(o/32767,-1);case Int8Array:return Math.max(o/127,-1);default:throw new Error("THREE.MathUtils: Invalid component type.")}}function yi(o,e){switch(e.constructor){case Float32Array:return o;case Uint32Array:return Math.round(o*4294967295);case Uint16Array:return Math.round(o*65535);case Uint8Array:case Uint8ClampedArray:return Math.round(o*255);case Int32Array:return Math.round(o*2147483647);case Int16Array:return Math.round(o*32767);case Int8Array:return Math.round(o*127);default:throw new Error("THREE.MathUtils: Invalid component type.")}}const bb={DEG2RAD:Zl},Hm=class Hm{constructor(e=0,i=0){this.x=e,this.y=i}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,i){return this.x=e,this.y=i,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,i){switch(e){case 0:this.x=i;break;case 1:this.y=i;break;default:throw new Error("THREE.Vector2: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw new Error("THREE.Vector2: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,i){return this.x=e.x+i.x,this.y=e.y+i.y,this}addScaledVector(e,i){return this.x+=e.x*i,this.y+=e.y*i,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,i){return this.x=e.x-i.x,this.y=e.y-i.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){const i=this.x,s=this.y,l=e.elements;return this.x=l[0]*i+l[3]*s+l[6],this.y=l[1]*i+l[4]*s+l[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,i){return this.x=He(this.x,e.x,i.x),this.y=He(this.y,e.y,i.y),this}clampScalar(e,i){return this.x=He(this.x,e,i),this.y=He(this.y,e,i),this}clampLength(e,i){const s=this.length();return this.divideScalar(s||1).multiplyScalar(He(s,e,i))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(e){const i=Math.sqrt(this.lengthSq()*e.lengthSq());if(i===0)return Math.PI/2;const s=this.dot(e)/i;return Math.acos(He(s,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){const i=this.x-e.x,s=this.y-e.y;return i*i+s*s}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,i){return this.x+=(e.x-this.x)*i,this.y+=(e.y-this.y)*i,this}lerpVectors(e,i,s){return this.x=e.x+(i.x-e.x)*s,this.y=e.y+(i.y-e.y)*s,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,i=0){return this.x=e[i],this.y=e[i+1],this}toArray(e=[],i=0){return e[i]=this.x,e[i+1]=this.y,e}fromBufferAttribute(e,i){return this.x=e.getX(i),this.y=e.getY(i),this}rotateAround(e,i){const s=Math.cos(i),l=Math.sin(i),f=this.x-e.x,h=this.y-e.y;return this.x=f*s-h*l+e.x,this.y=f*l+h*s+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}};Hm.prototype.isVector2=!0;let _e=Hm;class tr{constructor(e=0,i=0,s=0,l=1){this.isQuaternion=!0,this._x=e,this._y=i,this._z=s,this._w=l}static slerpFlat(e,i,s,l,f,h,d){let m=s[l+0],p=s[l+1],x=s[l+2],v=s[l+3],g=f[h+0],M=f[h+1],A=f[h+2],C=f[h+3];if(v!==C||m!==g||p!==M||x!==A){let y=m*g+p*M+x*A+v*C;y<0&&(g=-g,M=-M,A=-A,C=-C,y=-y);let S=1-d;if(y<.9995){const U=Math.acos(y),F=Math.sin(U);S=Math.sin(S*U)/F,d=Math.sin(d*U)/F,m=m*S+g*d,p=p*S+M*d,x=x*S+A*d,v=v*S+C*d}else{m=m*S+g*d,p=p*S+M*d,x=x*S+A*d,v=v*S+C*d;const U=1/Math.sqrt(m*m+p*p+x*x+v*v);m*=U,p*=U,x*=U,v*=U}}e[i]=m,e[i+1]=p,e[i+2]=x,e[i+3]=v}static multiplyQuaternionsFlat(e,i,s,l,f,h){const d=s[l],m=s[l+1],p=s[l+2],x=s[l+3],v=f[h],g=f[h+1],M=f[h+2],A=f[h+3];return e[i]=d*A+x*v+m*M-p*g,e[i+1]=m*A+x*g+p*v-d*M,e[i+2]=p*A+x*M+d*g-m*v,e[i+3]=x*A-d*v-m*g-p*M,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,i,s,l){return this._x=e,this._y=i,this._z=s,this._w=l,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,i=!0){const s=e._x,l=e._y,f=e._z,h=e._order,d=Math.cos,m=Math.sin,p=d(s/2),x=d(l/2),v=d(f/2),g=m(s/2),M=m(l/2),A=m(f/2);switch(h){case"XYZ":this._x=g*x*v+p*M*A,this._y=p*M*v-g*x*A,this._z=p*x*A+g*M*v,this._w=p*x*v-g*M*A;break;case"YXZ":this._x=g*x*v+p*M*A,this._y=p*M*v-g*x*A,this._z=p*x*A-g*M*v,this._w=p*x*v+g*M*A;break;case"ZXY":this._x=g*x*v-p*M*A,this._y=p*M*v+g*x*A,this._z=p*x*A+g*M*v,this._w=p*x*v-g*M*A;break;case"ZYX":this._x=g*x*v-p*M*A,this._y=p*M*v+g*x*A,this._z=p*x*A-g*M*v,this._w=p*x*v+g*M*A;break;case"YZX":this._x=g*x*v+p*M*A,this._y=p*M*v+g*x*A,this._z=p*x*A-g*M*v,this._w=p*x*v-g*M*A;break;case"XZY":this._x=g*x*v-p*M*A,this._y=p*M*v-g*x*A,this._z=p*x*A+g*M*v,this._w=p*x*v+g*M*A;break;default:ge("Quaternion: .setFromEuler() encountered an unknown order: "+h)}return i===!0&&this._onChangeCallback(),this}setFromAxisAngle(e,i){const s=i/2,l=Math.sin(s);return this._x=e.x*l,this._y=e.y*l,this._z=e.z*l,this._w=Math.cos(s),this._onChangeCallback(),this}setFromRotationMatrix(e){const i=e.elements,s=i[0],l=i[4],f=i[8],h=i[1],d=i[5],m=i[9],p=i[2],x=i[6],v=i[10],g=s+d+v;if(g>0){const M=.5/Math.sqrt(g+1);this._w=.25/M,this._x=(x-m)*M,this._y=(f-p)*M,this._z=(h-l)*M}else if(s>d&&s>v){const M=2*Math.sqrt(1+s-d-v);this._w=(x-m)/M,this._x=.25*M,this._y=(l+h)/M,this._z=(f+p)/M}else if(d>v){const M=2*Math.sqrt(1+d-s-v);this._w=(f-p)/M,this._x=(l+h)/M,this._y=.25*M,this._z=(m+x)/M}else{const M=2*Math.sqrt(1+v-s-d);this._w=(h-l)/M,this._x=(f+p)/M,this._y=(m+x)/M,this._z=.25*M}return this._onChangeCallback(),this}setFromUnitVectors(e,i){let s=e.dot(i)+1;return s<1e-8?(s=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=s):(this._x=0,this._y=-e.z,this._z=e.y,this._w=s)):(this._x=e.y*i.z-e.z*i.y,this._y=e.z*i.x-e.x*i.z,this._z=e.x*i.y-e.y*i.x,this._w=s),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(He(this.dot(e),-1,1)))}rotateTowards(e,i){const s=this.angleTo(e);if(s===0)return this;const l=Math.min(1,i/s);return this.slerp(e,l),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x=this._x*e,this._y=this._y*e,this._z=this._z*e,this._w=this._w*e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,i){const s=e._x,l=e._y,f=e._z,h=e._w,d=i._x,m=i._y,p=i._z,x=i._w;return this._x=s*x+h*d+l*p-f*m,this._y=l*x+h*m+f*d-s*p,this._z=f*x+h*p+s*m-l*d,this._w=h*x-s*d-l*m-f*p,this._onChangeCallback(),this}slerp(e,i){let s=e._x,l=e._y,f=e._z,h=e._w,d=this.dot(e);d<0&&(s=-s,l=-l,f=-f,h=-h,d=-d);let m=1-i;if(d<.9995){const p=Math.acos(d),x=Math.sin(p);m=Math.sin(m*p)/x,i=Math.sin(i*p)/x,this._x=this._x*m+s*i,this._y=this._y*m+l*i,this._z=this._z*m+f*i,this._w=this._w*m+h*i,this._onChangeCallback()}else this._x=this._x*m+s*i,this._y=this._y*m+l*i,this._z=this._z*m+f*i,this._w=this._w*m+h*i,this.normalize();return this}slerpQuaternions(e,i,s){return this.copy(e).slerp(i,s)}random(){const e=2*Math.PI*Math.random(),i=2*Math.PI*Math.random(),s=Math.random(),l=Math.sqrt(1-s),f=Math.sqrt(s);return this.set(l*Math.sin(e),l*Math.cos(e),f*Math.sin(i),f*Math.cos(i))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,i=0){return this._x=e[i],this._y=e[i+1],this._z=e[i+2],this._w=e[i+3],this._onChangeCallback(),this}toArray(e=[],i=0){return e[i]=this._x,e[i+1]=this._y,e[i+2]=this._z,e[i+3]=this._w,e}fromBufferAttribute(e,i){return this._x=e.getX(i),this._y=e.getY(i),this._z=e.getZ(i),this._w=e.getW(i),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}}const Gm=class Gm{constructor(e=0,i=0,s=0){this.x=e,this.y=i,this.z=s}set(e,i,s){return s===void 0&&(s=this.z),this.x=e,this.y=i,this.z=s,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,i){switch(e){case 0:this.x=i;break;case 1:this.y=i;break;case 2:this.z=i;break;default:throw new Error("THREE.Vector3: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("THREE.Vector3: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,i){return this.x=e.x+i.x,this.y=e.y+i.y,this.z=e.z+i.z,this}addScaledVector(e,i){return this.x+=e.x*i,this.y+=e.y*i,this.z+=e.z*i,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,i){return this.x=e.x-i.x,this.y=e.y-i.y,this.z=e.z-i.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,i){return this.x=e.x*i.x,this.y=e.y*i.y,this.z=e.z*i.z,this}applyEuler(e){return this.applyQuaternion(sx.setFromEuler(e))}applyAxisAngle(e,i){return this.applyQuaternion(sx.setFromAxisAngle(e,i))}applyMatrix3(e){const i=this.x,s=this.y,l=this.z,f=e.elements;return this.x=f[0]*i+f[3]*s+f[6]*l,this.y=f[1]*i+f[4]*s+f[7]*l,this.z=f[2]*i+f[5]*s+f[8]*l,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){const i=this.x,s=this.y,l=this.z,f=e.elements,h=1/(f[3]*i+f[7]*s+f[11]*l+f[15]);return this.x=(f[0]*i+f[4]*s+f[8]*l+f[12])*h,this.y=(f[1]*i+f[5]*s+f[9]*l+f[13])*h,this.z=(f[2]*i+f[6]*s+f[10]*l+f[14])*h,this}applyQuaternion(e){const i=this.x,s=this.y,l=this.z,f=e.x,h=e.y,d=e.z,m=e.w,p=2*(h*l-d*s),x=2*(d*i-f*l),v=2*(f*s-h*i);return this.x=i+m*p+h*v-d*x,this.y=s+m*x+d*p-f*v,this.z=l+m*v+f*x-h*p,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){const i=this.x,s=this.y,l=this.z,f=e.elements;return this.x=f[0]*i+f[4]*s+f[8]*l,this.y=f[1]*i+f[5]*s+f[9]*l,this.z=f[2]*i+f[6]*s+f[10]*l,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,i){return this.x=He(this.x,e.x,i.x),this.y=He(this.y,e.y,i.y),this.z=He(this.z,e.z,i.z),this}clampScalar(e,i){return this.x=He(this.x,e,i),this.y=He(this.y,e,i),this.z=He(this.z,e,i),this}clampLength(e,i){const s=this.length();return this.divideScalar(s||1).multiplyScalar(He(s,e,i))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,i){return this.x+=(e.x-this.x)*i,this.y+=(e.y-this.y)*i,this.z+=(e.z-this.z)*i,this}lerpVectors(e,i,s){return this.x=e.x+(i.x-e.x)*s,this.y=e.y+(i.y-e.y)*s,this.z=e.z+(i.z-e.z)*s,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,i){const s=e.x,l=e.y,f=e.z,h=i.x,d=i.y,m=i.z;return this.x=l*m-f*d,this.y=f*h-s*m,this.z=s*d-l*h,this}projectOnVector(e){const i=e.lengthSq();if(i===0)return this.set(0,0,0);const s=e.dot(this)/i;return this.copy(e).multiplyScalar(s)}projectOnPlane(e){return Kd.copy(this).projectOnVector(e),this.sub(Kd)}reflect(e){return this.sub(Kd.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){const i=Math.sqrt(this.lengthSq()*e.lengthSq());if(i===0)return Math.PI/2;const s=this.dot(e)/i;return Math.acos(He(s,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){const i=this.x-e.x,s=this.y-e.y,l=this.z-e.z;return i*i+s*s+l*l}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,i,s){const l=Math.sin(i)*e;return this.x=l*Math.sin(s),this.y=Math.cos(i)*e,this.z=l*Math.cos(s),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,i,s){return this.x=e*Math.sin(i),this.y=s,this.z=e*Math.cos(i),this}setFromMatrixPosition(e){const i=e.elements;return this.x=i[12],this.y=i[13],this.z=i[14],this}setFromMatrixScale(e){const i=this.setFromMatrixColumn(e,0).length(),s=this.setFromMatrixColumn(e,1).length(),l=this.setFromMatrixColumn(e,2).length();return this.x=i,this.y=s,this.z=l,this}setFromMatrixColumn(e,i){return this.fromArray(e.elements,i*4)}setFromMatrix3Column(e,i){return this.fromArray(e.elements,i*3)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}setFromColor(e){return this.x=e.r,this.y=e.g,this.z=e.b,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,i=0){return this.x=e[i],this.y=e[i+1],this.z=e[i+2],this}toArray(e=[],i=0){return e[i]=this.x,e[i+1]=this.y,e[i+2]=this.z,e}fromBufferAttribute(e,i){return this.x=e.getX(i),this.y=e.getY(i),this.z=e.getZ(i),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){const e=Math.random()*Math.PI*2,i=Math.random()*2-1,s=Math.sqrt(1-i*i);return this.x=s*Math.cos(e),this.y=i,this.z=s*Math.sin(e),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}};Gm.prototype.isVector3=!0;let X=Gm;const Kd=new X,sx=new tr,Vm=class Vm{constructor(e,i,s,l,f,h,d,m,p){this.elements=[1,0,0,0,1,0,0,0,1],e!==void 0&&this.set(e,i,s,l,f,h,d,m,p)}set(e,i,s,l,f,h,d,m,p){const x=this.elements;return x[0]=e,x[1]=l,x[2]=d,x[3]=i,x[4]=f,x[5]=m,x[6]=s,x[7]=h,x[8]=p,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){const i=this.elements,s=e.elements;return i[0]=s[0],i[1]=s[1],i[2]=s[2],i[3]=s[3],i[4]=s[4],i[5]=s[5],i[6]=s[6],i[7]=s[7],i[8]=s[8],this}extractBasis(e,i,s){return e.setFromMatrix3Column(this,0),i.setFromMatrix3Column(this,1),s.setFromMatrix3Column(this,2),this}setFromMatrix4(e){const i=e.elements;return this.set(i[0],i[4],i[8],i[1],i[5],i[9],i[2],i[6],i[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,i){const s=e.elements,l=i.elements,f=this.elements,h=s[0],d=s[3],m=s[6],p=s[1],x=s[4],v=s[7],g=s[2],M=s[5],A=s[8],C=l[0],y=l[3],S=l[6],U=l[1],F=l[4],N=l[7],L=l[2],D=l[5],I=l[8];return f[0]=h*C+d*U+m*L,f[3]=h*y+d*F+m*D,f[6]=h*S+d*N+m*I,f[1]=p*C+x*U+v*L,f[4]=p*y+x*F+v*D,f[7]=p*S+x*N+v*I,f[2]=g*C+M*U+A*L,f[5]=g*y+M*F+A*D,f[8]=g*S+M*N+A*I,this}multiplyScalar(e){const i=this.elements;return i[0]*=e,i[3]*=e,i[6]*=e,i[1]*=e,i[4]*=e,i[7]*=e,i[2]*=e,i[5]*=e,i[8]*=e,this}determinant(){const e=this.elements,i=e[0],s=e[1],l=e[2],f=e[3],h=e[4],d=e[5],m=e[6],p=e[7],x=e[8];return i*h*x-i*d*p-s*f*x+s*d*m+l*f*p-l*h*m}invert(){const e=this.elements,i=e[0],s=e[1],l=e[2],f=e[3],h=e[4],d=e[5],m=e[6],p=e[7],x=e[8],v=x*h-d*p,g=d*m-x*f,M=p*f-h*m,A=i*v+s*g+l*M;if(A===0)return this.set(0,0,0,0,0,0,0,0,0);const C=1/A;return e[0]=v*C,e[1]=(l*p-x*s)*C,e[2]=(d*s-l*h)*C,e[3]=g*C,e[4]=(x*i-l*m)*C,e[5]=(l*f-d*i)*C,e[6]=M*C,e[7]=(s*m-p*i)*C,e[8]=(h*i-s*f)*C,this}transpose(){let e;const i=this.elements;return e=i[1],i[1]=i[3],i[3]=e,e=i[2],i[2]=i[6],i[6]=e,e=i[5],i[5]=i[7],i[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){const i=this.elements;return e[0]=i[0],e[1]=i[3],e[2]=i[6],e[3]=i[1],e[4]=i[4],e[5]=i[7],e[6]=i[2],e[7]=i[5],e[8]=i[8],this}setUvTransform(e,i,s,l,f,h,d){const m=Math.cos(f),p=Math.sin(f);return this.set(s*m,s*p,-s*(m*h+p*d)+h+e,-l*p,l*m,-l*(-p*h+m*d)+d+i,0,0,1),this}scale(e,i){return Ho("Matrix3: .scale() is deprecated. Use .makeScale() instead."),this.premultiply(Qd.makeScale(e,i)),this}rotate(e){return Ho("Matrix3: .rotate() is deprecated. Use .makeRotation() instead."),this.premultiply(Qd.makeRotation(-e)),this}translate(e,i){return Ho("Matrix3: .translate() is deprecated. Use .makeTranslation() instead."),this.premultiply(Qd.makeTranslation(e,i)),this}makeTranslation(e,i){return e.isVector2?this.set(1,0,e.x,0,1,e.y,0,0,1):this.set(1,0,e,0,1,i,0,0,1),this}makeRotation(e){const i=Math.cos(e),s=Math.sin(e);return this.set(i,-s,0,s,i,0,0,0,1),this}makeScale(e,i){return this.set(e,0,0,0,i,0,0,0,1),this}equals(e){const i=this.elements,s=e.elements;for(let l=0;l<9;l++)if(i[l]!==s[l])return!1;return!0}fromArray(e,i=0){for(let s=0;s<9;s++)this.elements[s]=e[s+i];return this}toArray(e=[],i=0){const s=this.elements;return e[i]=s[0],e[i+1]=s[1],e[i+2]=s[2],e[i+3]=s[3],e[i+4]=s[4],e[i+5]=s[5],e[i+6]=s[6],e[i+7]=s[7],e[i+8]=s[8],e}clone(){return new this.constructor().fromArray(this.elements)}};Vm.prototype.isMatrix3=!0;let be=Vm;const Qd=new be,rx=new be().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),ox=new be().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function Tb(){const o={enabled:!0,workingColorSpace:rf,spaces:{},convert:function(l,f,h){return this.enabled===!1||f===h||!f||!h||(this.spaces[f].transfer===sn&&(l.r=gs(l.r),l.g=gs(l.g),l.b=gs(l.b)),this.spaces[f].primaries!==this.spaces[h].primaries&&(l.applyMatrix3(this.spaces[f].toXYZ),l.applyMatrix3(this.spaces[h].fromXYZ)),this.spaces[h].transfer===sn&&(l.r=Go(l.r),l.g=Go(l.g),l.b=Go(l.b))),l},workingToColorSpace:function(l,f){return this.convert(l,this.workingColorSpace,f)},colorSpaceToWorking:function(l,f){return this.convert(l,f,this.workingColorSpace)},getPrimaries:function(l){return this.spaces[l].primaries},getTransfer:function(l){return l===$s?of:this.spaces[l].transfer},getToneMappingMode:function(l){return this.spaces[l].outputColorSpaceConfig.toneMappingMode||"standard"},getLuminanceCoefficients:function(l,f=this.workingColorSpace){return l.fromArray(this.spaces[f].luminanceCoefficients)},define:function(l){Object.assign(this.spaces,l)},_getMatrix:function(l,f,h){return l.copy(this.spaces[f].toXYZ).multiply(this.spaces[h].fromXYZ)},_getDrawingBufferColorSpace:function(l){return this.spaces[l].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(l=this.workingColorSpace){return this.spaces[l].workingColorSpaceConfig.unpackColorSpace},fromWorkingColorSpace:function(l,f){return Ho("ColorManagement: .fromWorkingColorSpace() has been renamed to .workingToColorSpace()."),o.workingToColorSpace(l,f)},toWorkingColorSpace:function(l,f){return Ho("ColorManagement: .toWorkingColorSpace() has been renamed to .colorSpaceToWorking()."),o.colorSpaceToWorking(l,f)}},e=[.64,.33,.3,.6,.15,.06],i=[.2126,.7152,.0722],s=[.3127,.329];return o.define({[rf]:{primaries:e,whitePoint:s,transfer:of,toXYZ:rx,fromXYZ:ox,luminanceCoefficients:i,workingColorSpaceConfig:{unpackColorSpace:ia},outputColorSpaceConfig:{drawingBufferColorSpace:ia}},[ia]:{primaries:e,whitePoint:s,transfer:sn,toXYZ:rx,fromXYZ:ox,luminanceCoefficients:i,outputColorSpaceConfig:{drawingBufferColorSpace:ia}}}),o}const Xe=Tb();function gs(o){return o<.04045?o*.0773993808:Math.pow(o*.9478672986+.0521327014,2.4)}function Go(o){return o<.0031308?o*12.92:1.055*Math.pow(o,.41666)-.055}let Eo;class Ab{static getDataURL(e,i="image/png"){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>"u")return e.src;let s;if(e instanceof HTMLCanvasElement)s=e;else{Eo===void 0&&(Eo=lf("canvas")),Eo.width=e.width,Eo.height=e.height;const l=Eo.getContext("2d");e instanceof ImageData?l.putImageData(e,0,0):l.drawImage(e,0,0,e.width,e.height),s=Eo}return s.toDataURL(i)}static sRGBToLinear(e){if(typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&e instanceof ImageBitmap){const i=lf("canvas");i.width=e.width,i.height=e.height;const s=i.getContext("2d");s.drawImage(e,0,0,e.width,e.height);const l=s.getImageData(0,0,e.width,e.height),f=l.data;for(let h=0;h<f.length;h++)f[h]=gs(f[h]/255)*255;return s.putImageData(l,0,0),i}else if(e.data){const i=e.data.slice(0);for(let s=0;s<i.length;s++)i instanceof Uint8Array||i instanceof Uint8ClampedArray?i[s]=Math.floor(gs(i[s]/255)*255):i[s]=gs(i[s]);return{data:i,width:e.width,height:e.height}}else return ge("ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),e}}let Rb=0;class wm{constructor(e=null){this.isTextureSource=!0,Object.defineProperty(this,"id",{value:Rb++}),this.uuid=ic(),this.data=e,this.dataReady=!0,this.version=0}getSize(e){const i=this.data;return typeof HTMLVideoElement<"u"&&i instanceof HTMLVideoElement?e.set(i.videoWidth,i.videoHeight,0):typeof VideoFrame<"u"&&i instanceof VideoFrame?e.set(i.displayWidth,i.displayHeight,0):i!==null?e.set(i.width,i.height,i.depth||0):e.set(0,0,0),e}set needsUpdate(e){e===!0&&this.version++}toJSON(e){const i=e===void 0||typeof e=="string";if(!i&&e.images[this.uuid]!==void 0)return e.images[this.uuid];const s={uuid:this.uuid,url:""},l=this.data;if(l!==null){let f;if(Array.isArray(l)){f=[];for(let h=0,d=l.length;h<d;h++)l[h].isDataTexture?f.push(Jd(l[h].image)):f.push(Jd(l[h]))}else f=Jd(l);s.url=f}return i||(e.images[this.uuid]=s),s}}function Jd(o){return typeof HTMLImageElement<"u"&&o instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&o instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&o instanceof ImageBitmap?Ab.getDataURL(o):o.data?{data:Array.from(o.data),width:o.width,height:o.height,type:o.data.constructor.name}:(ge("Texture: Unable to serialize Texture."),{})}let wb=0;const $d=new X;class di extends nr{constructor(e=di.DEFAULT_IMAGE,i=di.DEFAULT_MAPPING,s=ps,l=ps,f=ri,h=Dr,d=_a,m=Vi,p=di.DEFAULT_ANISOTROPY,x=$s){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:wb++}),this.uuid=ic(),this.name="",this.source=new wm(e),this.mipmaps=[],this.mapping=i,this.channel=0,this.wrapS=s,this.wrapT=l,this.magFilter=f,this.minFilter=h,this.anisotropy=p,this.format=d,this.internalFormat=null,this.type=m,this.offset=new _e(0,0),this.repeat=new _e(1,1),this.center=new _e(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new be,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=x,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.isArrayTexture=!!(e&&e.depth&&e.depth>1),this.pmremVersion=0,this.normalized=!1}get width(){return this.source.getSize($d).x}get height(){return this.source.getSize($d).y}get depth(){return this.source.getSize($d).z}get image(){return this.source.data}set image(e){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}addUpdateRange(e,i){this.updateRanges.push({start:e,count:i})}clearUpdateRanges(){this.updateRanges.length=0}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.channel=e.channel,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.normalized=e.normalized,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.colorSpace=e.colorSpace,this.renderTarget=e.renderTarget,this.isRenderTargetTexture=e.isRenderTargetTexture,this.isArrayTexture=e.isArrayTexture,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}setValues(e){for(const i in e){const s=e[i];if(s===void 0){ge(`Texture.setValues(): parameter '${i}' has value of undefined.`);continue}const l=this[i];if(l===void 0){ge(`Texture.setValues(): property '${i}' does not exist.`);continue}l&&s&&l.isVector2&&s.isVector2||l&&s&&l.isVector3&&s.isVector3||l&&s&&l.isMatrix3&&s.isMatrix3?l.copy(s):this[i]=s}}toJSON(e){const i=e===void 0||typeof e=="string";if(!i&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];const s={metadata:{version:4.7,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,normalized:this.normalized,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(s.userData=this.userData),i||(e.textures[this.uuid]=s),s}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(e){if(this.mapping!==xS)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case Lp:e.x=e.x-Math.floor(e.x);break;case ps:e.x=e.x<0?0:1;break;case Op:Math.abs(Math.floor(e.x)%2)===1?e.x=Math.ceil(e.x)-e.x:e.x=e.x-Math.floor(e.x);break}if(e.y<0||e.y>1)switch(this.wrapT){case Lp:e.y=e.y-Math.floor(e.y);break;case ps:e.y=e.y<0?0:1;break;case Op:Math.abs(Math.floor(e.y)%2)===1?e.y=Math.ceil(e.y)-e.y:e.y=e.y-Math.floor(e.y);break}return this.flipY&&(e.y=1-e.y),e}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(e){e===!0&&this.pmremVersion++}}di.DEFAULT_IMAGE=null;di.DEFAULT_MAPPING=xS;di.DEFAULT_ANISOTROPY=1;const km=class km{constructor(e=0,i=0,s=0,l=1){this.x=e,this.y=i,this.z=s,this.w=l}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,i,s,l){return this.x=e,this.y=i,this.z=s,this.w=l,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,i){switch(e){case 0:this.x=i;break;case 1:this.y=i;break;case 2:this.z=i;break;case 3:this.w=i;break;default:throw new Error("THREE.Vector4: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("THREE.Vector4: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w!==void 0?e.w:1,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,i){return this.x=e.x+i.x,this.y=e.y+i.y,this.z=e.z+i.z,this.w=e.w+i.w,this}addScaledVector(e,i){return this.x+=e.x*i,this.y+=e.y*i,this.z+=e.z*i,this.w+=e.w*i,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,i){return this.x=e.x-i.x,this.y=e.y-i.y,this.z=e.z-i.z,this.w=e.w-i.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){const i=this.x,s=this.y,l=this.z,f=this.w,h=e.elements;return this.x=h[0]*i+h[4]*s+h[8]*l+h[12]*f,this.y=h[1]*i+h[5]*s+h[9]*l+h[13]*f,this.z=h[2]*i+h[6]*s+h[10]*l+h[14]*f,this.w=h[3]*i+h[7]*s+h[11]*l+h[15]*f,this}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this.w/=e.w,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);const i=Math.sqrt(1-e.w*e.w);return i<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/i,this.y=e.y/i,this.z=e.z/i),this}setAxisAngleFromRotationMatrix(e){let i,s,l,f;const m=e.elements,p=m[0],x=m[4],v=m[8],g=m[1],M=m[5],A=m[9],C=m[2],y=m[6],S=m[10];if(Math.abs(x-g)<.01&&Math.abs(v-C)<.01&&Math.abs(A-y)<.01){if(Math.abs(x+g)<.1&&Math.abs(v+C)<.1&&Math.abs(A+y)<.1&&Math.abs(p+M+S-3)<.1)return this.set(1,0,0,0),this;i=Math.PI;const F=(p+1)/2,N=(M+1)/2,L=(S+1)/2,D=(x+g)/4,I=(v+C)/4,T=(A+y)/4;return F>N&&F>L?F<.01?(s=0,l=.707106781,f=.707106781):(s=Math.sqrt(F),l=D/s,f=I/s):N>L?N<.01?(s=.707106781,l=0,f=.707106781):(l=Math.sqrt(N),s=D/l,f=T/l):L<.01?(s=.707106781,l=.707106781,f=0):(f=Math.sqrt(L),s=I/f,l=T/f),this.set(s,l,f,i),this}let U=Math.sqrt((y-A)*(y-A)+(v-C)*(v-C)+(g-x)*(g-x));return Math.abs(U)<.001&&(U=1),this.x=(y-A)/U,this.y=(v-C)/U,this.z=(g-x)/U,this.w=Math.acos((p+M+S-1)/2),this}setFromMatrixPosition(e){const i=e.elements;return this.x=i[12],this.y=i[13],this.z=i[14],this.w=i[15],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,i){return this.x=He(this.x,e.x,i.x),this.y=He(this.y,e.y,i.y),this.z=He(this.z,e.z,i.z),this.w=He(this.w,e.w,i.w),this}clampScalar(e,i){return this.x=He(this.x,e,i),this.y=He(this.y,e,i),this.z=He(this.z,e,i),this.w=He(this.w,e,i),this}clampLength(e,i){const s=this.length();return this.divideScalar(s||1).multiplyScalar(He(s,e,i))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,i){return this.x+=(e.x-this.x)*i,this.y+=(e.y-this.y)*i,this.z+=(e.z-this.z)*i,this.w+=(e.w-this.w)*i,this}lerpVectors(e,i,s){return this.x=e.x+(i.x-e.x)*s,this.y=e.y+(i.y-e.y)*s,this.z=e.z+(i.z-e.z)*s,this.w=e.w+(i.w-e.w)*s,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,i=0){return this.x=e[i],this.y=e[i+1],this.z=e[i+2],this.w=e[i+3],this}toArray(e=[],i=0){return e[i]=this.x,e[i+1]=this.y,e[i+2]=this.z,e[i+3]=this.w,e}fromBufferAttribute(e,i){return this.x=e.getX(i),this.y=e.getY(i),this.z=e.getZ(i),this.w=e.getW(i),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}};km.prototype.isVector4=!0;let vn=km;class Cb extends nr{constructor(e=1,i=1,s={}){super(),s=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:ri,depthBuffer:!0,stencilBuffer:!1,resolveColorBuffer:!0,resolveDepthBuffer:!0,resolveStencilBuffer:!0,storeMultisampledColorBuffer:!0,storeMultisampledDepthBuffer:!0,storeMultisampledStencilBuffer:!0,depthTexture:null,samples:0,count:1,depth:1,multiview:!1,useArrayDepthTexture:!1},s),this.isRenderTarget=!0,this.width=e,this.height=i,this.depth=s.depth,this.scissor=new vn(0,0,e,i),this.scissorTest=!1,this.viewport=new vn(0,0,e,i),this.textures=[];const l={width:e,height:i,depth:s.depth},f=new di(l),h=s.count;for(let d=0;d<h;d++)this.textures[d]=f.clone(),this.textures[d].isRenderTargetTexture=!0,this.textures[d].renderTarget=this;this._setTextureOptions(s),this.depthBuffer=s.depthBuffer,this.stencilBuffer=s.stencilBuffer,this.resolveColorBuffer=s.resolveColorBuffer,this.resolveDepthBuffer=s.resolveDepthBuffer,this.resolveStencilBuffer=s.resolveStencilBuffer,this.storeMultisampledColorBuffer=s.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=s.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=s.storeMultisampledStencilBuffer,this._depthTexture=null,this.depthTexture=s.depthTexture,this.samples=s.samples,this.multiview=s.multiview,this.useArrayDepthTexture=s.useArrayDepthTexture}_setTextureOptions(e={}){const i={minFilter:ri,generateMipmaps:!1,flipY:!1,internalFormat:null};e.mapping!==void 0&&(i.mapping=e.mapping),e.wrapS!==void 0&&(i.wrapS=e.wrapS),e.wrapT!==void 0&&(i.wrapT=e.wrapT),e.wrapR!==void 0&&(i.wrapR=e.wrapR),e.magFilter!==void 0&&(i.magFilter=e.magFilter),e.minFilter!==void 0&&(i.minFilter=e.minFilter),e.format!==void 0&&(i.format=e.format),e.type!==void 0&&(i.type=e.type),e.anisotropy!==void 0&&(i.anisotropy=e.anisotropy),e.colorSpace!==void 0&&(i.colorSpace=e.colorSpace),e.flipY!==void 0&&(i.flipY=e.flipY),e.generateMipmaps!==void 0&&(i.generateMipmaps=e.generateMipmaps),e.internalFormat!==void 0&&(i.internalFormat=e.internalFormat);for(let s=0;s<this.textures.length;s++)this.textures[s].setValues(i)}get texture(){return this.textures[0]}set texture(e){this.textures[0]=e}set depthTexture(e){this._depthTexture!==null&&this._depthTexture.renderTarget===this&&(this._depthTexture.renderTarget=null),e!==null&&e.renderTarget===null&&(e.renderTarget=this),this._depthTexture=e}get depthTexture(){return this._depthTexture}setSize(e,i,s=1){if(this.width!==e||this.height!==i||this.depth!==s){this.width=e,this.height=i,this.depth=s;for(let l=0,f=this.textures.length;l<f;l++)this.textures[l].image.width=e,this.textures[l].image.height=i,this.textures[l].image.depth=s,this.textures[l].isData3DTexture!==!0&&(this.textures[l].isArrayTexture=this.textures[l].image.depth>1);this.dispose()}this.viewport.set(0,0,e,i),this.scissor.set(0,0,e,i)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.scissor.copy(e.scissor),this.scissorTest=e.scissorTest,this.viewport.copy(e.viewport),this.textures.length=0;for(let i=0,s=e.textures.length;i<s;i++){this.textures[i]=e.textures[i].clone(),this.textures[i].isRenderTargetTexture=!0,this.textures[i].renderTarget=this;const l=Object.assign({},e.textures[i].image);this.textures[i].source=new wm(l)}if(this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,this.resolveColorBuffer=e.resolveColorBuffer,this.resolveDepthBuffer=e.resolveDepthBuffer,this.resolveStencilBuffer=e.resolveStencilBuffer,this.storeMultisampledColorBuffer=e.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=e.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=e.storeMultisampledStencilBuffer,e.depthTexture!==null)if(e.depthTexture.renderTarget===e){const i=e.depthTexture.clone();i.renderTarget=null,this.depthTexture=i}else this.depthTexture=e.depthTexture;return this.samples=e.samples,this.multiview=e.multiview,this.useArrayDepthTexture=e.useArrayDepthTexture,this}dispose(){this.dispatchEvent({type:"dispose"})}}class va extends Cb{constructor(e=1,i=1,s={}){super(e,i,s),this.isWebGLRenderTarget=!0}}class wS extends di{constructor(e=null,i=1,s=1,l=1){super(null),this.isDataArrayTexture=!0,this.image={data:e,width:i,height:s,depth:l},this.magFilter=ei,this.minFilter=ei,this.wrapR=ps,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}copy(e){return super.copy(e),this.wrapR=e.wrapR,this}addLayerUpdate(e){this.layerUpdates.add(e)}clearLayerUpdates(){this.layerUpdates.clear()}}class Nb extends di{constructor(e=null,i=1,s=1,l=1){super(null),this.isData3DTexture=!0,this.image={data:e,width:i,height:s,depth:l},this.magFilter=ei,this.minFilter=ei,this.wrapR=ps,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}copy(e){return super.copy(e),this.wrapR=e.wrapR,this}}const hf=class hf{constructor(e,i,s,l,f,h,d,m,p,x,v,g,M,A,C,y){this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],e!==void 0&&this.set(e,i,s,l,f,h,d,m,p,x,v,g,M,A,C,y)}set(e,i,s,l,f,h,d,m,p,x,v,g,M,A,C,y){const S=this.elements;return S[0]=e,S[4]=i,S[8]=s,S[12]=l,S[1]=f,S[5]=h,S[9]=d,S[13]=m,S[2]=p,S[6]=x,S[10]=v,S[14]=g,S[3]=M,S[7]=A,S[11]=C,S[15]=y,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new hf().fromArray(this.elements)}copy(e){const i=this.elements,s=e.elements;return i[0]=s[0],i[1]=s[1],i[2]=s[2],i[3]=s[3],i[4]=s[4],i[5]=s[5],i[6]=s[6],i[7]=s[7],i[8]=s[8],i[9]=s[9],i[10]=s[10],i[11]=s[11],i[12]=s[12],i[13]=s[13],i[14]=s[14],i[15]=s[15],this}copyPosition(e){const i=this.elements,s=e.elements;return i[12]=s[12],i[13]=s[13],i[14]=s[14],this}setFromMatrix3(e){const i=e.elements;return this.set(i[0],i[3],i[6],0,i[1],i[4],i[7],0,i[2],i[5],i[8],0,0,0,0,1),this}extractBasis(e,i,s){return this.determinantAffine()===0?(e.set(1,0,0),i.set(0,1,0),s.set(0,0,1),this):(e.setFromMatrixColumn(this,0),i.setFromMatrixColumn(this,1),s.setFromMatrixColumn(this,2),this)}makeBasis(e,i,s){return this.set(e.x,i.x,s.x,0,e.y,i.y,s.y,0,e.z,i.z,s.z,0,0,0,0,1),this}extractRotation(e){if(e.determinantAffine()===0)return this.identity();const i=this.elements,s=e.elements,l=1/bo.setFromMatrixColumn(e,0).length(),f=1/bo.setFromMatrixColumn(e,1).length(),h=1/bo.setFromMatrixColumn(e,2).length();return i[0]=s[0]*l,i[1]=s[1]*l,i[2]=s[2]*l,i[3]=0,i[4]=s[4]*f,i[5]=s[5]*f,i[6]=s[6]*f,i[7]=0,i[8]=s[8]*h,i[9]=s[9]*h,i[10]=s[10]*h,i[11]=0,i[12]=0,i[13]=0,i[14]=0,i[15]=1,this}makeRotationFromEuler(e){const i=this.elements,s=e.x,l=e.y,f=e.z,h=Math.cos(s),d=Math.sin(s),m=Math.cos(l),p=Math.sin(l),x=Math.cos(f),v=Math.sin(f);if(e.order==="XYZ"){const g=h*x,M=h*v,A=d*x,C=d*v;i[0]=m*x,i[4]=-m*v,i[8]=p,i[1]=M+A*p,i[5]=g-C*p,i[9]=-d*m,i[2]=C-g*p,i[6]=A+M*p,i[10]=h*m}else if(e.order==="YXZ"){const g=m*x,M=m*v,A=p*x,C=p*v;i[0]=g+C*d,i[4]=A*d-M,i[8]=h*p,i[1]=h*v,i[5]=h*x,i[9]=-d,i[2]=M*d-A,i[6]=C+g*d,i[10]=h*m}else if(e.order==="ZXY"){const g=m*x,M=m*v,A=p*x,C=p*v;i[0]=g-C*d,i[4]=-h*v,i[8]=A+M*d,i[1]=M+A*d,i[5]=h*x,i[9]=C-g*d,i[2]=-h*p,i[6]=d,i[10]=h*m}else if(e.order==="ZYX"){const g=h*x,M=h*v,A=d*x,C=d*v;i[0]=m*x,i[4]=A*p-M,i[8]=g*p+C,i[1]=m*v,i[5]=C*p+g,i[9]=M*p-A,i[2]=-p,i[6]=d*m,i[10]=h*m}else if(e.order==="YZX"){const g=h*m,M=h*p,A=d*m,C=d*p;i[0]=m*x,i[4]=C-g*v,i[8]=A*v+M,i[1]=v,i[5]=h*x,i[9]=-d*x,i[2]=-p*x,i[6]=M*v+A,i[10]=g-C*v}else if(e.order==="XZY"){const g=h*m,M=h*p,A=d*m,C=d*p;i[0]=m*x,i[4]=-v,i[8]=p*x,i[1]=g*v+C,i[5]=h*x,i[9]=M*v-A,i[2]=A*v-M,i[6]=d*x,i[10]=C*v+g}return i[3]=0,i[7]=0,i[11]=0,i[12]=0,i[13]=0,i[14]=0,i[15]=1,this}makeRotationFromQuaternion(e){return this.compose(Db,e,Ub)}lookAt(e,i,s){const l=this.elements;return zi.subVectors(e,i),zi.lengthSq()===0&&(zi.z=1),zi.normalize(),js.crossVectors(s,zi),js.lengthSq()===0&&(Math.abs(s.z)===1?zi.x+=1e-4:zi.z+=1e-4,zi.normalize(),js.crossVectors(s,zi)),js.normalize(),Tu.crossVectors(zi,js),l[0]=js.x,l[4]=Tu.x,l[8]=zi.x,l[1]=js.y,l[5]=Tu.y,l[9]=zi.y,l[2]=js.z,l[6]=Tu.z,l[10]=zi.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,i){const s=e.elements,l=i.elements,f=this.elements,h=s[0],d=s[4],m=s[8],p=s[12],x=s[1],v=s[5],g=s[9],M=s[13],A=s[2],C=s[6],y=s[10],S=s[14],U=s[3],F=s[7],N=s[11],L=s[15],D=l[0],I=l[4],T=l[8],O=l[12],V=l[1],Y=l[5],J=l[9],rt=l[13],j=l[2],et=l[6],q=l[10],Z=l[14],ht=l[3],ct=l[7],gt=l[11],vt=l[15];return f[0]=h*D+d*V+m*j+p*ht,f[4]=h*I+d*Y+m*et+p*ct,f[8]=h*T+d*J+m*q+p*gt,f[12]=h*O+d*rt+m*Z+p*vt,f[1]=x*D+v*V+g*j+M*ht,f[5]=x*I+v*Y+g*et+M*ct,f[9]=x*T+v*J+g*q+M*gt,f[13]=x*O+v*rt+g*Z+M*vt,f[2]=A*D+C*V+y*j+S*ht,f[6]=A*I+C*Y+y*et+S*ct,f[10]=A*T+C*J+y*q+S*gt,f[14]=A*O+C*rt+y*Z+S*vt,f[3]=U*D+F*V+N*j+L*ht,f[7]=U*I+F*Y+N*et+L*ct,f[11]=U*T+F*J+N*q+L*gt,f[15]=U*O+F*rt+N*Z+L*vt,this}multiplyScalar(e){const i=this.elements;return i[0]*=e,i[4]*=e,i[8]*=e,i[12]*=e,i[1]*=e,i[5]*=e,i[9]*=e,i[13]*=e,i[2]*=e,i[6]*=e,i[10]*=e,i[14]*=e,i[3]*=e,i[7]*=e,i[11]*=e,i[15]*=e,this}determinant(){const e=this.elements,i=e[0],s=e[4],l=e[8],f=e[12],h=e[1],d=e[5],m=e[9],p=e[13],x=e[2],v=e[6],g=e[10],M=e[14],A=e[3],C=e[7],y=e[11],S=e[15],U=m*M-p*g,F=d*M-p*v,N=d*g-m*v,L=h*M-p*x,D=h*g-m*x,I=h*v-d*x;return i*(C*U-y*F+S*N)-s*(A*U-y*L+S*D)+l*(A*F-C*L+S*I)-f*(A*N-C*D+y*I)}determinantAffine(){const e=this.elements,i=e[0],s=e[4],l=e[8],f=e[1],h=e[5],d=e[9],m=e[2],p=e[6],x=e[10];return i*(h*x-d*p)-s*(f*x-d*m)+l*(f*p-h*m)}transpose(){const e=this.elements;let i;return i=e[1],e[1]=e[4],e[4]=i,i=e[2],e[2]=e[8],e[8]=i,i=e[6],e[6]=e[9],e[9]=i,i=e[3],e[3]=e[12],e[12]=i,i=e[7],e[7]=e[13],e[13]=i,i=e[11],e[11]=e[14],e[14]=i,this}setPosition(e,i,s){const l=this.elements;return e.isVector3?(l[12]=e.x,l[13]=e.y,l[14]=e.z):(l[12]=e,l[13]=i,l[14]=s),this}invert(){const e=this.elements,i=e[0],s=e[1],l=e[2],f=e[3],h=e[4],d=e[5],m=e[6],p=e[7],x=e[8],v=e[9],g=e[10],M=e[11],A=e[12],C=e[13],y=e[14],S=e[15],U=i*d-s*h,F=i*m-l*h,N=i*p-f*h,L=s*m-l*d,D=s*p-f*d,I=l*p-f*m,T=x*C-v*A,O=x*y-g*A,V=x*S-M*A,Y=v*y-g*C,J=v*S-M*C,rt=g*S-M*y,j=U*rt-F*J+N*Y+L*V-D*O+I*T;if(j===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);const et=1/j;return e[0]=(d*rt-m*J+p*Y)*et,e[1]=(l*J-s*rt-f*Y)*et,e[2]=(C*I-y*D+S*L)*et,e[3]=(g*D-v*I-M*L)*et,e[4]=(m*V-h*rt-p*O)*et,e[5]=(i*rt-l*V+f*O)*et,e[6]=(y*N-A*I-S*F)*et,e[7]=(x*I-g*N+M*F)*et,e[8]=(h*J-d*V+p*T)*et,e[9]=(s*V-i*J-f*T)*et,e[10]=(A*D-C*N+S*U)*et,e[11]=(v*N-x*D-M*U)*et,e[12]=(d*O-h*Y-m*T)*et,e[13]=(i*Y-s*O+l*T)*et,e[14]=(C*F-A*L-y*U)*et,e[15]=(x*L-v*F+g*U)*et,this}scale(e){const i=this.elements,s=e.x,l=e.y,f=e.z;return i[0]*=s,i[4]*=l,i[8]*=f,i[1]*=s,i[5]*=l,i[9]*=f,i[2]*=s,i[6]*=l,i[10]*=f,i[3]*=s,i[7]*=l,i[11]*=f,this}getMaxScaleOnAxis(){const e=this.elements,i=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],s=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],l=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(i,s,l))}makeTranslation(e,i,s){return e.isVector3?this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1):this.set(1,0,0,e,0,1,0,i,0,0,1,s,0,0,0,1),this}makeRotationX(e){const i=Math.cos(e),s=Math.sin(e);return this.set(1,0,0,0,0,i,-s,0,0,s,i,0,0,0,0,1),this}makeRotationY(e){const i=Math.cos(e),s=Math.sin(e);return this.set(i,0,s,0,0,1,0,0,-s,0,i,0,0,0,0,1),this}makeRotationZ(e){const i=Math.cos(e),s=Math.sin(e);return this.set(i,-s,0,0,s,i,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,i){const s=Math.cos(i),l=Math.sin(i),f=1-s,h=e.x,d=e.y,m=e.z,p=f*h,x=f*d;return this.set(p*h+s,p*d-l*m,p*m+l*d,0,p*d+l*m,x*d+s,x*m-l*h,0,p*m-l*d,x*m+l*h,f*m*m+s,0,0,0,0,1),this}makeScale(e,i,s){return this.set(e,0,0,0,0,i,0,0,0,0,s,0,0,0,0,1),this}makeShear(e,i,s,l,f,h){return this.set(1,s,f,0,e,1,h,0,i,l,1,0,0,0,0,1),this}compose(e,i,s){const l=this.elements,f=i._x,h=i._y,d=i._z,m=i._w,p=f+f,x=h+h,v=d+d,g=f*p,M=f*x,A=f*v,C=h*x,y=h*v,S=d*v,U=m*p,F=m*x,N=m*v,L=s.x,D=s.y,I=s.z;return l[0]=(1-(C+S))*L,l[1]=(M+N)*L,l[2]=(A-F)*L,l[3]=0,l[4]=(M-N)*D,l[5]=(1-(g+S))*D,l[6]=(y+U)*D,l[7]=0,l[8]=(A+F)*I,l[9]=(y-U)*I,l[10]=(1-(g+C))*I,l[11]=0,l[12]=e.x,l[13]=e.y,l[14]=e.z,l[15]=1,this}decompose(e,i,s){const l=this.elements;e.x=l[12],e.y=l[13],e.z=l[14];const f=this.determinantAffine();if(f===0)return s.set(1,1,1),i.identity(),this;let h=bo.set(l[0],l[1],l[2]).length();const d=bo.set(l[4],l[5],l[6]).length(),m=bo.set(l[8],l[9],l[10]).length();f<0&&(h=-h),pa.copy(this);const p=1/h,x=1/d,v=1/m;return pa.elements[0]*=p,pa.elements[1]*=p,pa.elements[2]*=p,pa.elements[4]*=x,pa.elements[5]*=x,pa.elements[6]*=x,pa.elements[8]*=v,pa.elements[9]*=v,pa.elements[10]*=v,i.setFromRotationMatrix(pa),s.x=h,s.y=d,s.z=m,this}makePerspective(e,i,s,l,f,h,d=Fa,m=!1){const p=this.elements,x=2*f/(i-e),v=2*f/(s-l),g=(i+e)/(i-e),M=(s+l)/(s-l);let A,C;if(m)A=f/(h-f),C=h*f/(h-f);else if(d===Fa)A=-(h+f)/(h-f),C=-2*h*f/(h-f);else if(d===tc)A=-h/(h-f),C=-h*f/(h-f);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+d);return p[0]=x,p[4]=0,p[8]=g,p[12]=0,p[1]=0,p[5]=v,p[9]=M,p[13]=0,p[2]=0,p[6]=0,p[10]=A,p[14]=C,p[3]=0,p[7]=0,p[11]=-1,p[15]=0,this}makeOrthographic(e,i,s,l,f,h,d=Fa,m=!1){const p=this.elements,x=2/(i-e),v=2/(s-l),g=-(i+e)/(i-e),M=-(s+l)/(s-l);let A,C;if(m)A=1/(h-f),C=h/(h-f);else if(d===Fa)A=-2/(h-f),C=-(h+f)/(h-f);else if(d===tc)A=-1/(h-f),C=-f/(h-f);else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+d);return p[0]=x,p[4]=0,p[8]=0,p[12]=g,p[1]=0,p[5]=v,p[9]=0,p[13]=M,p[2]=0,p[6]=0,p[10]=A,p[14]=C,p[3]=0,p[7]=0,p[11]=0,p[15]=1,this}equals(e){const i=this.elements,s=e.elements;for(let l=0;l<16;l++)if(i[l]!==s[l])return!1;return!0}fromArray(e,i=0){for(let s=0;s<16;s++)this.elements[s]=e[s+i];return this}toArray(e=[],i=0){const s=this.elements;return e[i]=s[0],e[i+1]=s[1],e[i+2]=s[2],e[i+3]=s[3],e[i+4]=s[4],e[i+5]=s[5],e[i+6]=s[6],e[i+7]=s[7],e[i+8]=s[8],e[i+9]=s[9],e[i+10]=s[10],e[i+11]=s[11],e[i+12]=s[12],e[i+13]=s[13],e[i+14]=s[14],e[i+15]=s[15],e}};hf.prototype.isMatrix4=!0;let gn=hf;const bo=new X,pa=new gn,Db=new X(0,0,0),Ub=new X(1,1,1),js=new X,Tu=new X,zi=new X,lx=new gn,cx=new tr;class er{constructor(e=0,i=0,s=0,l=er.DEFAULT_ORDER){this.isEuler=!0,this._x=e,this._y=i,this._z=s,this._order=l}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,i,s,l=this._order){return this._x=e,this._y=i,this._z=s,this._order=l,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,i=this._order,s=!0){const l=e.elements,f=l[0],h=l[4],d=l[8],m=l[1],p=l[5],x=l[9],v=l[2],g=l[6],M=l[10];switch(i){case"XYZ":this._y=Math.asin(He(d,-1,1)),Math.abs(d)<.9999999?(this._x=Math.atan2(-x,M),this._z=Math.atan2(-h,f)):(this._x=Math.atan2(g,p),this._z=0);break;case"YXZ":this._x=Math.asin(-He(x,-1,1)),Math.abs(x)<.9999999?(this._y=Math.atan2(d,M),this._z=Math.atan2(m,p)):(this._y=Math.atan2(-v,f),this._z=0);break;case"ZXY":this._x=Math.asin(He(g,-1,1)),Math.abs(g)<.9999999?(this._y=Math.atan2(-v,M),this._z=Math.atan2(-h,p)):(this._y=0,this._z=Math.atan2(m,f));break;case"ZYX":this._y=Math.asin(-He(v,-1,1)),Math.abs(v)<.9999999?(this._x=Math.atan2(g,M),this._z=Math.atan2(m,f)):(this._x=0,this._z=Math.atan2(-h,p));break;case"YZX":this._z=Math.asin(He(m,-1,1)),Math.abs(m)<.9999999?(this._x=Math.atan2(-x,p),this._y=Math.atan2(-v,f)):(this._x=0,this._y=Math.atan2(d,M));break;case"XZY":this._z=Math.asin(-He(h,-1,1)),Math.abs(h)<.9999999?(this._x=Math.atan2(g,p),this._y=Math.atan2(d,f)):(this._x=Math.atan2(-x,M),this._y=0);break;default:ge("Euler: .setFromRotationMatrix() encountered an unknown order: "+i)}return this._order=i,s===!0&&this._onChangeCallback(),this}setFromQuaternion(e,i,s){return lx.makeRotationFromQuaternion(e),this.setFromRotationMatrix(lx,i,s)}setFromVector3(e,i=this._order){return this.set(e.x,e.y,e.z,i)}reorder(e){return cx.setFromEuler(this),this.setFromQuaternion(cx,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],i=0){return e[i]=this._x,e[i+1]=this._y,e[i+2]=this._z,e[i+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}}er.DEFAULT_ORDER="XYZ";class Cm{constructor(){this.mask=1}set(e){this.mask=(1<<e|0)>>>0}enable(e){this.mask|=1<<e|0}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e|0}disable(e){this.mask&=~(1<<e|0)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!==0}isEnabled(e){return(this.mask&(1<<e|0))!==0}}let Lb=0;const ux=new X,To=new tr,ls=new gn,Au=new X,Bl=new X,Ob=new X,Pb=new tr,fx=new X(1,0,0),hx=new X(0,1,0),dx=new X(0,0,1),px={type:"added"},Ib={type:"removed"},Ao={type:"childadded",child:null},tp={type:"childremoved",child:null};class qn extends nr{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:Lb++}),this.uuid=ic(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=qn.DEFAULT_UP.clone();const e=new X,i=new er,s=new tr,l=new X(1,1,1);function f(){s.setFromEuler(i,!1)}function h(){i.setFromQuaternion(s,void 0,!1)}i._onChange(f),s._onChange(h),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:e},rotation:{configurable:!0,enumerable:!0,value:i},quaternion:{configurable:!0,enumerable:!0,value:s},scale:{configurable:!0,enumerable:!0,value:l},modelViewMatrix:{value:new gn},normalMatrix:{value:new be}}),this.matrix=new gn,this.matrixWorld=new gn,this.matrixAutoUpdate=qn.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=qn.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new Cm,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.static=!1,this.userData={},this.pivot=null}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,i){this.quaternion.setFromAxisAngle(e,i)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,i){return To.setFromAxisAngle(e,i),this.quaternion.multiply(To),this}rotateOnWorldAxis(e,i){return To.setFromAxisAngle(e,i),this.quaternion.premultiply(To),this}rotateX(e){return this.rotateOnAxis(fx,e)}rotateY(e){return this.rotateOnAxis(hx,e)}rotateZ(e){return this.rotateOnAxis(dx,e)}translateOnAxis(e,i){return ux.copy(e).applyQuaternion(this.quaternion),this.position.add(ux.multiplyScalar(i)),this}translateX(e){return this.translateOnAxis(fx,e)}translateY(e){return this.translateOnAxis(hx,e)}translateZ(e){return this.translateOnAxis(dx,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(ls.copy(this.matrixWorld).invert())}lookAt(e,i,s){e.isVector3?Au.copy(e):Au.set(e,i,s);const l=this.parent;this.updateWorldMatrix(!0,!1),Bl.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?ls.lookAt(Bl,Au,this.up):ls.lookAt(Au,Bl,this.up),this.quaternion.setFromRotationMatrix(ls),l&&(ls.extractRotation(l.matrixWorld),To.setFromRotationMatrix(ls),this.quaternion.premultiply(To.invert()))}add(e){if(arguments.length>1){for(let i=0;i<arguments.length;i++)this.add(arguments[i]);return this}return e===this?(je("Object3D.add: object can't be added as a child of itself.",e),this):(e&&e.isObject3D?(e.removeFromParent(),e.parent=this,this.children.push(e),e.dispatchEvent(px),Ao.child=e,this.dispatchEvent(Ao),Ao.child=null):je("Object3D.add: object not an instance of THREE.Object3D.",e),this)}remove(e){if(arguments.length>1){for(let s=0;s<arguments.length;s++)this.remove(arguments[s]);return this}const i=this.children.indexOf(e);return i!==-1&&(e.parent=null,this.children.splice(i,1),e.dispatchEvent(Ib),tp.child=e,this.dispatchEvent(tp),tp.child=null),this}removeFromParent(){const e=this.parent;return e!==null&&e.remove(this),this}clear(){return this.remove(...this.children)}attach(e){return this.updateWorldMatrix(!0,!1),ls.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),ls.multiply(e.parent.matrixWorld)),e.applyMatrix4(ls),e.removeFromParent(),e.parent=this,this.children.push(e),e.updateWorldMatrix(!1,!0),e.dispatchEvent(px),Ao.child=e,this.dispatchEvent(Ao),Ao.child=null,this}getObjectById(e){return this.getObjectByProperty("id",e)}getObjectByName(e){return this.getObjectByProperty("name",e)}getObjectByProperty(e,i){if(this[e]===i)return this;for(let s=0,l=this.children.length;s<l;s++){const h=this.children[s].getObjectByProperty(e,i);if(h!==void 0)return h}}getObjectsByProperty(e,i,s=[]){this[e]===i&&s.push(this);const l=this.children;for(let f=0,h=l.length;f<h;f++)l[f].getObjectsByProperty(e,i,s);return s}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Bl,e,Ob),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Bl,Pb,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);const i=this.matrixWorld.elements;return e.set(i[8],i[9],i[10]).normalize()}raycast(){}intersectsFrustum(){}traverse(e){e(this);const i=this.children;for(let s=0,l=i.length;s<l;s++)i[s].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);const i=this.children;for(let s=0,l=i.length;s<l;s++)i[s].traverseVisible(e)}traverseAncestors(e){const i=this.parent;i!==null&&(e(i),i.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale);const e=this.pivot;if(e!==null){const i=e.x,s=e.y,l=e.z,f=this.matrix.elements;f[12]+=i-f[0]*i-f[4]*s-f[8]*l,f[13]+=s-f[1]*i-f[5]*s-f[9]*l,f[14]+=l-f[2]*i-f[6]*s-f[10]*l}this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,e=!0);const i=this.children;for(let s=0,l=i.length;s<l;s++)i[s].updateMatrixWorld(e)}updateWorldMatrix(e,i,s=!1){const l=this.parent;if(e===!0&&l!==null&&l.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||s)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,s=!0),i===!0){const f=this.children;for(let h=0,d=f.length;h<d;h++)f[h].updateWorldMatrix(!1,!0,s)}}toJSON(e){const i=e===void 0||typeof e=="string",s={};i&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},s.metadata={version:4.7,type:"Object",generator:"Object3D.toJSON"});const l={};l.uuid=this.uuid,l.type=this.type,l.name=this.name,l.castShadow=this.castShadow,l.receiveShadow=this.receiveShadow,l.visible=this.visible,l.frustumCulled=this.frustumCulled,l.renderOrder=this.renderOrder,l.static=this.static,l.matrixAutoUpdate=this.matrixAutoUpdate,Object.keys(this.userData).length>0&&(l.userData=this.userData),l.layers=this.layers.mask,l.matrix=this.matrix.toArray(),l.up=this.up.toArray(),this.pivot!==null&&(l.pivot=this.pivot.toArray()),this.morphTargetDictionary!==void 0&&(l.morphTargetDictionary=Object.assign({},this.morphTargetDictionary)),this.morphTargetInfluences!==void 0&&(l.morphTargetInfluences=this.morphTargetInfluences.slice()),this.isInstancedMesh&&(l.type="InstancedMesh",l.count=this.count,l.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(l.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(l.type="BatchedMesh",l.perObjectFrustumCulled=this.perObjectFrustumCulled,l.sortObjects=this.sortObjects,l.drawRanges=this._drawRanges,l.reservedRanges=this._reservedRanges,l.geometryInfo=this._geometryInfo.map(d=>({...d,boundingBox:d.boundingBox?d.boundingBox.toJSON():void 0,boundingSphere:d.boundingSphere?d.boundingSphere.toJSON():void 0})),l.instanceInfo=this._instanceInfo.map(d=>({...d})),l.availableInstanceIds=this._availableInstanceIds.slice(),l.availableGeometryIds=this._availableGeometryIds.slice(),l.nextIndexStart=this._nextIndexStart,l.nextVertexStart=this._nextVertexStart,l.geometryCount=this._geometryCount,l.maxInstanceCount=this._maxInstanceCount,l.maxVertexCount=this._maxVertexCount,l.maxIndexCount=this._maxIndexCount,l.geometryInitialized=this._geometryInitialized,l.matricesTexture=this._matricesTexture.toJSON(e),l.indirectTexture=this._indirectTexture.toJSON(e),this._colorsTexture!==null&&(l.colorsTexture=this._colorsTexture.toJSON(e)),this.boundingSphere!==null&&(l.boundingSphere=this.boundingSphere.toJSON()),this.boundingBox!==null&&(l.boundingBox=this.boundingBox.toJSON()));function f(d,m){return d[m.uuid]===void 0&&(d[m.uuid]=m.toJSON(e)),m.uuid}if(this.isScene)this.background&&(this.background.isColor?l.background=this.background.toJSON():this.background.isTexture&&(l.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(l.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){l.geometry=f(e.geometries,this.geometry);const d=this.geometry.parameters;if(d!==void 0&&d.shapes!==void 0){const m=d.shapes;if(Array.isArray(m))for(let p=0,x=m.length;p<x;p++){const v=m[p];f(e.shapes,v)}else f(e.shapes,m)}}if(this.isSkinnedMesh&&(l.bindMode=this.bindMode,l.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(f(e.skeletons,this.skeleton),l.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){const d=[];for(let m=0,p=this.material.length;m<p;m++)d.push(f(e.materials,this.material[m]));l.material=d}else l.material=f(e.materials,this.material);if(this.children.length>0){l.children=[];for(let d=0;d<this.children.length;d++)l.children.push(this.children[d].toJSON(e).object)}if(this.animations.length>0){l.animations=[];for(let d=0;d<this.animations.length;d++){const m=this.animations[d];l.animations.push(f(e.animations,m))}}if(i){const d=h(e.geometries),m=h(e.materials),p=h(e.textures),x=h(e.images),v=h(e.shapes),g=h(e.skeletons),M=h(e.animations),A=h(e.nodes);d.length>0&&(s.geometries=d),m.length>0&&(s.materials=m),p.length>0&&(s.textures=p),x.length>0&&(s.images=x),v.length>0&&(s.shapes=v),g.length>0&&(s.skeletons=g),M.length>0&&(s.animations=M),A.length>0&&(s.nodes=A)}return s.object=l,s;function h(d){const m=[];for(const p in d){const x=d[p];delete x.metadata,m.push(x)}return m}}clone(e){return new this.constructor().copy(this,e)}copy(e,i=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.pivot=e.pivot!==null?e.pivot.clone():null,this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.static=e.static,this.animations=e.animations.slice(),this.userData=JSON.parse(JSON.stringify(e.userData)),i===!0)for(let s=0;s<e.children.length;s++){const l=e.children[s];this.add(l.clone())}return this}dispose(){this.dispatchEvent({type:"dispose"})}}qn.DEFAULT_UP=new X(0,1,0);qn.DEFAULT_MATRIX_AUTO_UPDATE=!0;qn.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;class Fi extends qn{constructor(){super(),this.isGroup=!0,this.type="Group"}}const zb={type:"move"};class ep{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new Fi,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new Fi,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new X,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new X),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new Fi,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new X,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new X,this._grip.eventsEnabled=!1),this._grip}dispatchEvent(e){return this._targetRay!==null&&this._targetRay.dispatchEvent(e),this._grip!==null&&this._grip.dispatchEvent(e),this._hand!==null&&this._hand.dispatchEvent(e),this}connect(e){if(e&&e.hand){const i=this._hand;if(i)for(const s of e.hand.values())this._getHandJoint(i,s)}return this.dispatchEvent({type:"connected",data:e}),this}disconnect(e){return this.dispatchEvent({type:"disconnected",data:e}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(e,i,s){let l=null,f=null,h=null;const d=this._targetRay,m=this._grip,p=this._hand;if(e&&i.session.visibilityState!=="visible-blurred"){if(p&&e.hand){h=!0;for(const C of e.hand.values()){const y=i.getJointPose(C,s),S=this._getHandJoint(p,C);y!==null&&(S.matrix.fromArray(y.transform.matrix),S.matrix.decompose(S.position,S.rotation,S.scale),S.matrixWorldNeedsUpdate=!0,S.jointRadius=y.radius),S.visible=y!==null}const x=p.joints["index-finger-tip"],v=p.joints["thumb-tip"],g=x.position.distanceTo(v.position),M=.02,A=.005;p.inputState.pinching&&g>M+A?(p.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:e.handedness,target:this})):!p.inputState.pinching&&g<=M-A&&(p.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:e.handedness,target:this}))}else m!==null&&e.gripSpace&&(f=i.getPose(e.gripSpace,s),f!==null&&(m.matrix.fromArray(f.transform.matrix),m.matrix.decompose(m.position,m.rotation,m.scale),m.matrixWorldNeedsUpdate=!0,f.linearVelocity?(m.hasLinearVelocity=!0,m.linearVelocity.copy(f.linearVelocity)):m.hasLinearVelocity=!1,f.angularVelocity?(m.hasAngularVelocity=!0,m.angularVelocity.copy(f.angularVelocity)):m.hasAngularVelocity=!1,m.eventsEnabled&&m.dispatchEvent({type:"gripUpdated",data:e,target:this})));d!==null&&(l=i.getPose(e.targetRaySpace,s),l===null&&f!==null&&(l=f),l!==null&&(d.matrix.fromArray(l.transform.matrix),d.matrix.decompose(d.position,d.rotation,d.scale),d.matrixWorldNeedsUpdate=!0,l.linearVelocity?(d.hasLinearVelocity=!0,d.linearVelocity.copy(l.linearVelocity)):d.hasLinearVelocity=!1,l.angularVelocity?(d.hasAngularVelocity=!0,d.angularVelocity.copy(l.angularVelocity)):d.hasAngularVelocity=!1,this.dispatchEvent(zb)))}return d!==null&&(d.visible=l!==null),m!==null&&(m.visible=f!==null),p!==null&&(p.visible=h!==null),this}_getHandJoint(e,i){if(e.joints[i.jointName]===void 0){const s=new Fi;s.matrixAutoUpdate=!1,s.visible=!1,e.joints[i.jointName]=s,e.add(s)}return e.joints[i.jointName]}}const CS={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},Zs={h:0,s:0,l:0},Ru={h:0,s:0,l:0};function np(o,e,i){return i<0&&(i+=1),i>1&&(i-=1),i<1/6?o+(e-o)*6*i:i<1/2?e:i<2/3?o+(e-o)*6*(2/3-i):o}class Ie{constructor(e,i,s){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(e,i,s)}set(e,i,s){if(i===void 0&&s===void 0){const l=e;l&&l.isColor?this.copy(l):typeof l=="number"?this.setHex(l):typeof l=="string"&&this.setStyle(l)}else this.setRGB(e,i,s);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,i=ia){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(e&255)/255,Xe.colorSpaceToWorking(this,i),this}setRGB(e,i,s,l=Xe.workingColorSpace){return this.r=e,this.g=i,this.b=s,Xe.colorSpaceToWorking(this,l),this}setHSL(e,i,s,l=Xe.workingColorSpace){if(e=Eb(e,1),i=He(i,0,1),s=He(s,0,1),i===0)this.r=this.g=this.b=s;else{const f=s<=.5?s*(1+i):s+i-s*i,h=2*s-f;this.r=np(h,f,e+1/3),this.g=np(h,f,e),this.b=np(h,f,e-1/3)}return Xe.colorSpaceToWorking(this,l),this}setStyle(e,i=ia){function s(f){f!==void 0&&parseFloat(f)<1&&ge("Color: Alpha component of "+e+" will be ignored.")}let l;if(l=/^(\w+)\(([^\)]*)\)/.exec(e)){let f;const h=l[1],d=l[2];switch(h){case"rgb":case"rgba":if(f=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(d))return s(f[4]),this.setRGB(Math.min(255,parseInt(f[1],10))/255,Math.min(255,parseInt(f[2],10))/255,Math.min(255,parseInt(f[3],10))/255,i);if(f=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(d))return s(f[4]),this.setRGB(Math.min(100,parseInt(f[1],10))/100,Math.min(100,parseInt(f[2],10))/100,Math.min(100,parseInt(f[3],10))/100,i);break;case"hsl":case"hsla":if(f=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(d))return s(f[4]),this.setHSL(parseFloat(f[1])/360,parseFloat(f[2])/100,parseFloat(f[3])/100,i);break;default:ge("Color: Unknown color model "+e)}}else if(l=/^\#([A-Fa-f\d]+)$/.exec(e)){const f=l[1],h=f.length;if(h===3)return this.setRGB(parseInt(f.charAt(0),16)/15,parseInt(f.charAt(1),16)/15,parseInt(f.charAt(2),16)/15,i);if(h===6)return this.setHex(parseInt(f,16),i);ge("Color: Invalid hex color "+e)}else if(e&&e.length>0)return this.setColorName(e,i);return this}setColorName(e,i=ia){const s=CS[e.toLowerCase()];return s!==void 0?this.setHex(s,i):ge("Color: Unknown color "+e),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=gs(e.r),this.g=gs(e.g),this.b=gs(e.b),this}copyLinearToSRGB(e){return this.r=Go(e.r),this.g=Go(e.g),this.b=Go(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=ia){return Xe.workingToColorSpace(si.copy(this),e),Math.round(He(si.r*255,0,255))*65536+Math.round(He(si.g*255,0,255))*256+Math.round(He(si.b*255,0,255))}getHexString(e=ia){return("000000"+this.getHex(e).toString(16)).slice(-6)}getHSL(e,i=Xe.workingColorSpace){Xe.workingToColorSpace(si.copy(this),i);const s=si.r,l=si.g,f=si.b,h=Math.max(s,l,f),d=Math.min(s,l,f);let m,p;const x=(d+h)/2;if(d===h)m=0,p=0;else{const v=h-d;switch(p=x<=.5?v/(h+d):v/(2-h-d),h){case s:m=(l-f)/v+(l<f?6:0);break;case l:m=(f-s)/v+2;break;case f:m=(s-l)/v+4;break}m/=6}return e.h=m,e.s=p,e.l=x,e}getRGB(e,i=Xe.workingColorSpace){return Xe.workingToColorSpace(si.copy(this),i),e.r=si.r,e.g=si.g,e.b=si.b,e}getStyle(e=ia){Xe.workingToColorSpace(si.copy(this),e);const i=si.r,s=si.g,l=si.b;return e!==ia?`color(${e} ${i.toFixed(3)} ${s.toFixed(3)} ${l.toFixed(3)})`:`rgb(${Math.round(i*255)},${Math.round(s*255)},${Math.round(l*255)})`}offsetHSL(e,i,s){return this.getHSL(Zs),this.setHSL(Zs.h+e,Zs.s+i,Zs.l+s)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,i){return this.r=e.r+i.r,this.g=e.g+i.g,this.b=e.b+i.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,i){return this.r+=(e.r-this.r)*i,this.g+=(e.g-this.g)*i,this.b+=(e.b-this.b)*i,this}lerpColors(e,i,s){return this.r=e.r+(i.r-e.r)*s,this.g=e.g+(i.g-e.g)*s,this.b=e.b+(i.b-e.b)*s,this}lerpHSL(e,i){this.getHSL(Zs),e.getHSL(Ru);const s=Zd(Zs.h,Ru.h,i),l=Zd(Zs.s,Ru.s,i),f=Zd(Zs.l,Ru.l,i);return this.setHSL(s,l,f),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){const i=this.r,s=this.g,l=this.b,f=e.elements;return this.r=f[0]*i+f[3]*s+f[6]*l,this.g=f[1]*i+f[4]*s+f[7]*l,this.b=f[2]*i+f[5]*s+f[8]*l,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,i=0){return this.r=e[i],this.g=e[i+1],this.b=e[i+2],this}toArray(e=[],i=0){return e[i]=this.r,e[i+1]=this.g,e[i+2]=this.b,e}fromBufferAttribute(e,i){return this.r=e.getX(i),this.g=e.getY(i),this.b=e.getZ(i),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}}const si=new Ie;Ie.NAMES=CS;class Nm{constructor(e,i=1,s=1e3){this.isFog=!0,this.name="",this.color=new Ie(e),this.near=i,this.far=s}clone(){return new Nm(this.color,this.near,this.far)}toJSON(){return{type:"Fog",name:this.name,color:this.color.getHex(),near:this.near,far:this.far}}}class Bb extends qn{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new er,this.environmentIntensity=1,this.environmentRotation=new er,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(e,i){return super.copy(e,i),e.background!==null&&(this.background=e.background.clone()),e.environment!==null&&(this.environment=e.environment.clone()),e.fog!==null&&(this.fog=e.fog.clone()),this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,this.backgroundRotation.copy(e.backgroundRotation),this.environmentIntensity=e.environmentIntensity,this.environmentRotation.copy(e.environmentRotation),e.overrideMaterial!==null&&(this.overrideMaterial=e.overrideMaterial.clone()),this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){const i=super.toJSON(e);return this.fog!==null&&(i.object.fog=this.fog.toJSON()),i.object.backgroundBlurriness=this.backgroundBlurriness,i.object.backgroundIntensity=this.backgroundIntensity,i.object.backgroundRotation=this.backgroundRotation.toArray(),i.object.environmentIntensity=this.environmentIntensity,i.object.environmentRotation=this.environmentRotation.toArray(),i}}const ma=new X,cs=new X,ip=new X,us=new X,Ro=new X,wo=new X,mx=new X,ap=new X,sp=new X,rp=new X,op=new vn,lp=new vn,cp=new vn;class aa{constructor(e=new X,i=new X,s=new X){this.a=e,this.b=i,this.c=s}static getNormal(e,i,s,l){l.subVectors(s,i),ma.subVectors(e,i),l.cross(ma);const f=l.lengthSq();return f>0?l.multiplyScalar(1/Math.sqrt(f)):l.set(0,0,0)}static getBarycoord(e,i,s,l,f){ma.subVectors(l,i),cs.subVectors(s,i),ip.subVectors(e,i);const h=ma.dot(ma),d=ma.dot(cs),m=ma.dot(ip),p=cs.dot(cs),x=cs.dot(ip),v=h*p-d*d;if(v===0)return f.set(0,0,0),null;const g=1/v,M=(p*m-d*x)*g,A=(h*x-d*m)*g;return f.set(1-M-A,A,M)}static containsPoint(e,i,s,l){return this.getBarycoord(e,i,s,l,us)===null?!1:us.x>=0&&us.y>=0&&us.x+us.y<=1}static getInterpolation(e,i,s,l,f,h,d,m){return this.getBarycoord(e,i,s,l,us)===null?(m.x=0,m.y=0,"z"in m&&(m.z=0),"w"in m&&(m.w=0),null):(m.setScalar(0),m.addScaledVector(f,us.x),m.addScaledVector(h,us.y),m.addScaledVector(d,us.z),m)}static getInterpolatedAttribute(e,i,s,l,f,h){return op.setScalar(0),lp.setScalar(0),cp.setScalar(0),op.fromBufferAttribute(e,i),lp.fromBufferAttribute(e,s),cp.fromBufferAttribute(e,l),h.setScalar(0),h.addScaledVector(op,f.x),h.addScaledVector(lp,f.y),h.addScaledVector(cp,f.z),h}static isFrontFacing(e,i,s,l){return ma.subVectors(s,i),cs.subVectors(e,i),ma.cross(cs).dot(l)<0}set(e,i,s){return this.a.copy(e),this.b.copy(i),this.c.copy(s),this}setFromPointsAndIndices(e,i,s,l){return this.a.copy(e[i]),this.b.copy(e[s]),this.c.copy(e[l]),this}setFromAttributeAndIndices(e,i,s,l){return this.a.fromBufferAttribute(e,i),this.b.fromBufferAttribute(e,s),this.c.fromBufferAttribute(e,l),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return ma.subVectors(this.c,this.b),cs.subVectors(this.a,this.b),ma.cross(cs).length()*.5}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(e){return aa.getNormal(this.a,this.b,this.c,e)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(e,i){return aa.getBarycoord(e,this.a,this.b,this.c,i)}getInterpolation(e,i,s,l,f){return aa.getInterpolation(e,this.a,this.b,this.c,i,s,l,f)}containsPoint(e){return aa.containsPoint(e,this.a,this.b,this.c)}isFrontFacing(e){return aa.isFrontFacing(this.a,this.b,this.c,e)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,i){const s=this.a,l=this.b,f=this.c;let h,d;Ro.subVectors(l,s),wo.subVectors(f,s),ap.subVectors(e,s);const m=Ro.dot(ap),p=wo.dot(ap);if(m<=0&&p<=0)return i.copy(s);sp.subVectors(e,l);const x=Ro.dot(sp),v=wo.dot(sp);if(x>=0&&v<=x)return i.copy(l);const g=m*v-x*p;if(g<=0&&m>=0&&x<=0)return h=m/(m-x),i.copy(s).addScaledVector(Ro,h);rp.subVectors(e,f);const M=Ro.dot(rp),A=wo.dot(rp);if(A>=0&&M<=A)return i.copy(f);const C=M*p-m*A;if(C<=0&&p>=0&&A<=0)return d=p/(p-A),i.copy(s).addScaledVector(wo,d);const y=x*A-M*v;if(y<=0&&v-x>=0&&M-A>=0)return mx.subVectors(f,l),d=(v-x)/(v-x+(M-A)),i.copy(l).addScaledVector(mx,d);const S=1/(y+C+g);return h=C*S,d=g*S,i.copy(s).addScaledVector(Ro,h).addScaledVector(wo,d)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}}class ac{constructor(e=new X(1/0,1/0,1/0),i=new X(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=i}set(e,i){return this.min.copy(e),this.max.copy(i),this}setFromArray(e){this.makeEmpty();for(let i=0,s=e.length;i<s;i+=3)this.expandByPoint(ga.fromArray(e,i));return this}setFromBufferAttribute(e){this.makeEmpty();for(let i=0,s=e.count;i<s;i++)this.expandByPoint(ga.fromBufferAttribute(e,i));return this}setFromPoints(e){this.makeEmpty();for(let i=0,s=e.length;i<s;i++)this.expandByPoint(e[i]);return this}setFromCenterAndSize(e,i){const s=ga.copy(i).multiplyScalar(.5);return this.min.copy(e).sub(s),this.max.copy(e).add(s),this}setFromObject(e,i=!1){return this.makeEmpty(),this.expandByObject(e,i)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,i=!1){e.updateWorldMatrix(!1,!1);const s=e.geometry;if(s!==void 0){const f=s.getAttribute("position");if(i===!0&&f!==void 0&&e.isInstancedMesh!==!0)for(let h=0,d=f.count;h<d;h++)e.isMesh===!0?e.getVertexPosition(h,ga):ga.fromBufferAttribute(f,h),ga.applyMatrix4(e.matrixWorld),this.expandByPoint(ga);else e.boundingBox!==void 0?(e.boundingBox===null&&e.computeBoundingBox(),wu.copy(e.boundingBox)):(s.boundingBox===null&&s.computeBoundingBox(),wu.copy(s.boundingBox)),wu.applyMatrix4(e.matrixWorld),this.union(wu)}const l=e.children;for(let f=0,h=l.length;f<h;f++)this.expandByObject(l[f],i);return this}containsPoint(e){return e.x>=this.min.x&&e.x<=this.max.x&&e.y>=this.min.y&&e.y<=this.max.y&&e.z>=this.min.z&&e.z<=this.max.z}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,i){return i.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return e.max.x>=this.min.x&&e.min.x<=this.max.x&&e.max.y>=this.min.y&&e.min.y<=this.max.y&&e.max.z>=this.min.z&&e.min.z<=this.max.z}intersectsSphere(e){return this.clampPoint(e.center,ga),ga.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let i,s;return e.normal.x>0?(i=e.normal.x*this.min.x,s=e.normal.x*this.max.x):(i=e.normal.x*this.max.x,s=e.normal.x*this.min.x),e.normal.y>0?(i+=e.normal.y*this.min.y,s+=e.normal.y*this.max.y):(i+=e.normal.y*this.max.y,s+=e.normal.y*this.min.y),e.normal.z>0?(i+=e.normal.z*this.min.z,s+=e.normal.z*this.max.z):(i+=e.normal.z*this.max.z,s+=e.normal.z*this.min.z),i<=-e.constant&&s>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(Fl),Cu.subVectors(this.max,Fl),Co.subVectors(e.a,Fl),No.subVectors(e.b,Fl),Do.subVectors(e.c,Fl),Ks.subVectors(No,Co),Qs.subVectors(Do,No),Ar.subVectors(Co,Do);let i=[0,-Ks.z,Ks.y,0,-Qs.z,Qs.y,0,-Ar.z,Ar.y,Ks.z,0,-Ks.x,Qs.z,0,-Qs.x,Ar.z,0,-Ar.x,-Ks.y,Ks.x,0,-Qs.y,Qs.x,0,-Ar.y,Ar.x,0];return!up(i,Co,No,Do,Cu)||(i=[1,0,0,0,1,0,0,0,1],!up(i,Co,No,Do,Cu))?!1:(Nu.crossVectors(Ks,Qs),i=[Nu.x,Nu.y,Nu.z],up(i,Co,No,Do,Cu))}clampPoint(e,i){return i.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,ga).distanceTo(e)}getBoundingSphere(e){return this.isEmpty()?e.makeEmpty():(this.getCenter(e.center),e.radius=this.getSize(ga).length()*.5),e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()?this:(fs[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),fs[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),fs[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),fs[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),fs[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),fs[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),fs[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),fs[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(fs),this)}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(e){return this.min.fromArray(e.min),this.max.fromArray(e.max),this}}const fs=[new X,new X,new X,new X,new X,new X,new X,new X],ga=new X,wu=new ac,Co=new X,No=new X,Do=new X,Ks=new X,Qs=new X,Ar=new X,Fl=new X,Cu=new X,Nu=new X,Rr=new X;function up(o,e,i,s,l){for(let f=0,h=o.length-3;f<=h;f+=3){Rr.fromArray(o,f);const d=l.x*Math.abs(Rr.x)+l.y*Math.abs(Rr.y)+l.z*Math.abs(Rr.z),m=e.dot(Rr),p=i.dot(Rr),x=s.dot(Rr);if(Math.max(-Math.max(m,p,x),Math.min(m,p,x))>d)return!1}return!0}const Ln=new X,Du=new _e;let Fb=0;class _s extends nr{constructor(e,i,s=!1){if(super(),Array.isArray(e))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:Fb++}),this.name="",this.array=e,this.itemSize=i,this.count=e!==void 0?e.length/i:0,this.normalized=s,this.usage=vb,this.updateRanges=[],this.gpuType=Ba,this.version=0}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,i){this.updateRanges.push({start:e,count:i})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this.gpuType=e.gpuType,this}copyAt(e,i,s){e*=this.itemSize,s*=i.itemSize;for(let l=0,f=this.itemSize;l<f;l++)this.array[e+l]=i.array[s+l];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let i=0,s=this.count;i<s;i++)Du.fromBufferAttribute(this,i),Du.applyMatrix3(e),this.setXY(i,Du.x,Du.y);else if(this.itemSize===3)for(let i=0,s=this.count;i<s;i++)Ln.fromBufferAttribute(this,i),Ln.applyMatrix3(e),this.setXYZ(i,Ln.x,Ln.y,Ln.z);return this}applyMatrix4(e){for(let i=0,s=this.count;i<s;i++)Ln.fromBufferAttribute(this,i),Ln.applyMatrix4(e),this.setXYZ(i,Ln.x,Ln.y,Ln.z);return this}applyNormalMatrix(e){for(let i=0,s=this.count;i<s;i++)Ln.fromBufferAttribute(this,i),Ln.applyNormalMatrix(e),this.setXYZ(i,Ln.x,Ln.y,Ln.z);return this}transformDirection(e){for(let i=0,s=this.count;i<s;i++)Ln.fromBufferAttribute(this,i),Ln.transformDirection(e),this.setXYZ(i,Ln.x,Ln.y,Ln.z);return this}set(e,i=0){return this.array.set(e,i),this}getComponent(e,i){let s=this.array[e*this.itemSize+i];return this.normalized&&(s=zl(s,this.array)),s}setComponent(e,i,s){return this.normalized&&(s=yi(s,this.array)),this.array[e*this.itemSize+i]=s,this}getX(e){let i=this.array[e*this.itemSize];return this.normalized&&(i=zl(i,this.array)),i}setX(e,i){return this.normalized&&(i=yi(i,this.array)),this.array[e*this.itemSize]=i,this}getY(e){let i=this.array[e*this.itemSize+1];return this.normalized&&(i=zl(i,this.array)),i}setY(e,i){return this.normalized&&(i=yi(i,this.array)),this.array[e*this.itemSize+1]=i,this}getZ(e){let i=this.array[e*this.itemSize+2];return this.normalized&&(i=zl(i,this.array)),i}setZ(e,i){return this.normalized&&(i=yi(i,this.array)),this.array[e*this.itemSize+2]=i,this}getW(e){let i=this.array[e*this.itemSize+3];return this.normalized&&(i=zl(i,this.array)),i}setW(e,i){return this.normalized&&(i=yi(i,this.array)),this.array[e*this.itemSize+3]=i,this}setXY(e,i,s){return e*=this.itemSize,this.normalized&&(i=yi(i,this.array),s=yi(s,this.array)),this.array[e+0]=i,this.array[e+1]=s,this}setXYZ(e,i,s,l){return e*=this.itemSize,this.normalized&&(i=yi(i,this.array),s=yi(s,this.array),l=yi(l,this.array)),this.array[e+0]=i,this.array[e+1]=s,this.array[e+2]=l,this}setXYZW(e,i,s,l,f){return e*=this.itemSize,this.normalized&&(i=yi(i,this.array),s=yi(s,this.array),l=yi(l,this.array),f=yi(f,this.array)),this.array[e+0]=i,this.array[e+1]=s,this.array[e+2]=l,this.array[e+3]=f,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){const e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return e.name=this.name,e.usage=this.usage,e.gpuType=this.gpuType,e}dispose(){this.dispatchEvent({type:"dispose"})}}class NS extends _s{constructor(e,i,s){super(new Uint16Array(e),i,s)}}class DS extends _s{constructor(e,i,s){super(new Uint32Array(e),i,s)}}class Pn extends _s{constructor(e,i,s){super(new Float32Array(e),i,s)}}const Hb=new ac,Hl=new X,fp=new X;class pf{constructor(e=new X,i=-1){this.isSphere=!0,this.center=e,this.radius=i}set(e,i){return this.center.copy(e),this.radius=i,this}setFromPoints(e,i){const s=this.center;i!==void 0?s.copy(i):Hb.setFromPoints(e).getCenter(s);let l=0;for(let f=0,h=e.length;f<h;f++)l=Math.max(l,s.distanceToSquared(e[f]));return this.radius=Math.sqrt(l),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){const i=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=i*i}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,i){const s=this.center.distanceToSquared(e);return i.copy(e),s>this.radius*this.radius&&(i.sub(this.center).normalize(),i.multiplyScalar(this.radius).add(this.center)),i}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius=this.radius*e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;Hl.subVectors(e,this.center);const i=Hl.lengthSq();if(i>this.radius*this.radius){const s=Math.sqrt(i),l=(s-this.radius)*.5;this.center.addScaledVector(Hl,l/s),this.radius+=l}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(fp.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(Hl.copy(e.center).add(fp)),this.expandByPoint(Hl.copy(e.center).sub(fp))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return{radius:this.radius,center:this.center.toArray()}}fromJSON(e){return this.radius=e.radius,this.center.fromArray(e.center),this}}let Gb=0;const na=new gn,hp=new qn,Uo=new X,Bi=new ac,Gl=new ac,Yn=new X;class bi extends nr{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:Gb++}),this.uuid=ic(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.indirectOffset=0,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={},this._transformed=!1}getIndex(){return this.index}setIndex(e){return Array.isArray(e)?this.index=new(xb(e)?DS:NS)(e,1):this.index=e,this}setIndirect(e,i=0){return this.indirect=e,this.indirectOffset=i,this}getIndirect(){return this.indirect}getAttribute(e){return this.attributes[e]}setAttribute(e,i){return this.attributes[e]=i,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,i,s=0){this.groups.push({start:e,count:i,materialIndex:s})}clearGroups(){this.groups=[]}setDrawRange(e,i){this.drawRange.start=e,this.drawRange.count=i}applyMatrix4(e){const i=this.attributes.position;i!==void 0&&(i.applyMatrix4(e),i.needsUpdate=!0);const s=this.attributes.normal;if(s!==void 0){const f=new be().getNormalMatrix(e);s.applyNormalMatrix(f),s.needsUpdate=!0}const l=this.attributes.tangent;return l!==void 0&&(l.transformDirection(e),l.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this._transformed=!0,this}applyQuaternion(e){return na.makeRotationFromQuaternion(e),this.applyMatrix4(na),this}rotateX(e){return na.makeRotationX(e),this.applyMatrix4(na),this}rotateY(e){return na.makeRotationY(e),this.applyMatrix4(na),this}rotateZ(e){return na.makeRotationZ(e),this.applyMatrix4(na),this}translate(e,i,s){return na.makeTranslation(e,i,s),this.applyMatrix4(na),this}scale(e,i,s){return na.makeScale(e,i,s),this.applyMatrix4(na),this}lookAt(e){return hp.lookAt(e),hp.updateMatrix(),this.applyMatrix4(hp.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(Uo).negate(),this.translate(Uo.x,Uo.y,Uo.z),this}setFromPoints(e){const i=this.getAttribute("position");if(i===void 0){const s=[];for(let l=0,f=e.length;l<f;l++){const h=e[l];s.push(h.x,h.y,h.z||0)}this.setAttribute("position",new Pn(s,3))}else{const s=Math.min(e.length,i.count);for(let l=0;l<s;l++){const f=e[l];i.setXYZ(l,f.x,f.y,f.z||0)}e.length>i.count&&ge("BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),i.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new ac);const e=this.attributes.position,i=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){je("BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new X(-1/0,-1/0,-1/0),new X(1/0,1/0,1/0));return}if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),i)for(let s=0,l=i.length;s<l;s++){const f=i[s];Bi.setFromBufferAttribute(f),this.morphTargetsRelative?(Yn.addVectors(this.boundingBox.min,Bi.min),this.boundingBox.expandByPoint(Yn),Yn.addVectors(this.boundingBox.max,Bi.max),this.boundingBox.expandByPoint(Yn)):(this.boundingBox.expandByPoint(Bi.min),this.boundingBox.expandByPoint(Bi.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&je('BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new pf);const e=this.attributes.position,i=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){je("BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new X,1/0);return}if(e){const s=this.boundingSphere.center;if(Bi.setFromBufferAttribute(e),i)for(let f=0,h=i.length;f<h;f++){const d=i[f];Gl.setFromBufferAttribute(d),this.morphTargetsRelative?(Yn.addVectors(Bi.min,Gl.min),Bi.expandByPoint(Yn),Yn.addVectors(Bi.max,Gl.max),Bi.expandByPoint(Yn)):(Bi.expandByPoint(Gl.min),Bi.expandByPoint(Gl.max))}Bi.getCenter(s);let l=0;for(let f=0,h=e.count;f<h;f++)Yn.fromBufferAttribute(e,f),l=Math.max(l,s.distanceToSquared(Yn));if(i)for(let f=0,h=i.length;f<h;f++){const d=i[f],m=this.morphTargetsRelative;for(let p=0,x=d.count;p<x;p++)Yn.fromBufferAttribute(d,p),m&&(Uo.fromBufferAttribute(e,p),Yn.add(Uo)),l=Math.max(l,s.distanceToSquared(Yn))}this.boundingSphere.radius=Math.sqrt(l),isNaN(this.boundingSphere.radius)&&je('BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){const e=this.index,i=this.attributes;if(e===null||i.position===void 0||i.normal===void 0||i.uv===void 0){je("BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}const s=i.position,l=i.normal,f=i.uv;let h=this.getAttribute("tangent");(h===void 0||h.count!==s.count)&&(h=new _s(new Float32Array(4*s.count),4),this.setAttribute("tangent",h));const d=[],m=[];for(let T=0;T<s.count;T++)d[T]=new X,m[T]=new X;const p=new X,x=new X,v=new X,g=new _e,M=new _e,A=new _e,C=new X,y=new X;function S(T,O,V){p.fromBufferAttribute(s,T),x.fromBufferAttribute(s,O),v.fromBufferAttribute(s,V),g.fromBufferAttribute(f,T),M.fromBufferAttribute(f,O),A.fromBufferAttribute(f,V),x.sub(p),v.sub(p),M.sub(g),A.sub(g);const Y=1/(M.x*A.y-A.x*M.y);isFinite(Y)&&(C.copy(x).multiplyScalar(A.y).addScaledVector(v,-M.y).multiplyScalar(Y),y.copy(v).multiplyScalar(M.x).addScaledVector(x,-A.x).multiplyScalar(Y),d[T].add(C),d[O].add(C),d[V].add(C),m[T].add(y),m[O].add(y),m[V].add(y))}let U=this.groups;U.length===0&&(U=[{start:0,count:e.count}]);for(let T=0,O=U.length;T<O;++T){const V=U[T],Y=V.start,J=V.count;for(let rt=Y,j=Y+J;rt<j;rt+=3)S(e.getX(rt+0),e.getX(rt+1),e.getX(rt+2))}const F=new X,N=new X,L=new X,D=new X;function I(T){L.fromBufferAttribute(l,T),D.copy(L);const O=d[T];F.copy(O),F.sub(L.multiplyScalar(L.dot(O))).normalize(),N.crossVectors(D,O);const Y=N.dot(m[T])<0?-1:1;h.setXYZW(T,F.x,F.y,F.z,Y)}for(let T=0,O=U.length;T<O;++T){const V=U[T],Y=V.start,J=V.count;for(let rt=Y,j=Y+J;rt<j;rt+=3)I(e.getX(rt+0)),I(e.getX(rt+1)),I(e.getX(rt+2))}this._transformed=!0}computeVertexNormals(){const e=this.index,i=this.getAttribute("position");if(i!==void 0){let s=this.getAttribute("normal");if(s===void 0||s.count!==i.count)s=new _s(new Float32Array(i.count*3),3),this.setAttribute("normal",s);else for(let g=0,M=s.count;g<M;g++)s.setXYZ(g,0,0,0);const l=new X,f=new X,h=new X,d=new X,m=new X,p=new X,x=new X,v=new X;if(e)for(let g=0,M=e.count;g<M;g+=3){const A=e.getX(g+0),C=e.getX(g+1),y=e.getX(g+2);l.fromBufferAttribute(i,A),f.fromBufferAttribute(i,C),h.fromBufferAttribute(i,y),x.subVectors(h,f),v.subVectors(l,f),x.cross(v),d.fromBufferAttribute(s,A),m.fromBufferAttribute(s,C),p.fromBufferAttribute(s,y),d.add(x),m.add(x),p.add(x),s.setXYZ(A,d.x,d.y,d.z),s.setXYZ(C,m.x,m.y,m.z),s.setXYZ(y,p.x,p.y,p.z)}else for(let g=0,M=i.count;g<M;g+=3)l.fromBufferAttribute(i,g+0),f.fromBufferAttribute(i,g+1),h.fromBufferAttribute(i,g+2),x.subVectors(h,f),v.subVectors(l,f),x.cross(v),s.setXYZ(g+0,x.x,x.y,x.z),s.setXYZ(g+1,x.x,x.y,x.z),s.setXYZ(g+2,x.x,x.y,x.z);this.normalizeNormals(),s.needsUpdate=!0}}normalizeNormals(){const e=this.attributes.normal;for(let i=0,s=e.count;i<s;i++)Yn.fromBufferAttribute(e,i),Yn.normalize(),e.setXYZ(i,Yn.x,Yn.y,Yn.z)}toNonIndexed(){function e(d,m){const p=d.array,x=d.itemSize,v=d.normalized,g=new p.constructor(m.length*x);let M=0,A=0;for(let C=0,y=m.length;C<y;C++){d.isInterleavedBufferAttribute?M=m[C]*d.data.stride+d.offset:M=m[C]*x;for(let S=0;S<x;S++)g[A++]=p[M++]}return new _s(g,x,v)}if(this.index===null)return ge("BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;const i=new bi,s=this.index.array,l=this.attributes;for(const d in l){const m=l[d],p=e(m,s);i.setAttribute(d,p)}const f=this.morphAttributes;for(const d in f){const m=[],p=f[d];for(let x=0,v=p.length;x<v;x++){const g=p[x],M=e(g,s);m.push(M)}i.morphAttributes[d]=m}i.morphTargetsRelative=this.morphTargetsRelative;const h=this.groups;for(let d=0,m=h.length;d<m;d++){const p=h[d];i.addGroup(p.start,p.count,p.materialIndex)}return i}toJSON(){const e={metadata:{version:4.7,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(e.uuid=this.uuid,e.type=this.parameters!==void 0&&this._transformed===!0?"BufferGeometry":this.type,e.name=this.name,Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0&&this._transformed!==!0){const m=this.parameters;for(const p in m)m[p]!==void 0&&(e[p]=m[p]);return e}e.data={attributes:{}};const i=this.index;i!==null&&(e.data.index={type:i.array.constructor.name,array:Array.prototype.slice.call(i.array)});const s=this.attributes;for(const m in s){const p=s[m];e.data.attributes[m]=p.toJSON(e.data)}const l={};let f=!1;for(const m in this.morphAttributes){const p=this.morphAttributes[m],x=[];for(let v=0,g=p.length;v<g;v++){const M=p[v];x.push(M.toJSON(e.data))}x.length>0&&(l[m]=x,f=!0)}f&&(e.data.morphAttributes=l,e.data.morphTargetsRelative=this.morphTargetsRelative);const h=this.groups;h.length>0&&(e.data.groups=JSON.parse(JSON.stringify(h)));const d=this.boundingSphere;return d!==null&&(e.data.boundingSphere=d.toJSON()),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;const i={};this.name=e.name;const s=e.index;s!==null&&this.setIndex(s.clone());const l=e.attributes;for(const p in l){const x=l[p];this.setAttribute(p,x.clone(i))}const f=e.morphAttributes;for(const p in f){const x=[],v=f[p];for(let g=0,M=v.length;g<M;g++)x.push(v[g].clone(i));this.morphAttributes[p]=x}this.morphTargetsRelative=e.morphTargetsRelative;const h=e.groups;for(let p=0,x=h.length;p<x;p++){const v=h[p];this.addGroup(v.start,v.count,v.materialIndex)}const d=e.boundingBox;d!==null&&(this.boundingBox=d.clone());const m=e.boundingSphere;return m!==null&&(this.boundingSphere=m.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,this._transformed=e._transformed,this}dispose(){this.dispatchEvent({type:"dispose"})}}const dp=new X,Vb=new X,kb=new be;class ds{constructor(e=new X(1,0,0),i=0){this.isPlane=!0,this.normal=e,this.constant=i}set(e,i){return this.normal.copy(e),this.constant=i,this}setComponents(e,i,s,l){return this.normal.set(e,i,s),this.constant=l,this}setFromNormalAndCoplanarPoint(e,i){return this.normal.copy(e),this.constant=-i.dot(this.normal),this}setFromCoplanarPoints(e,i,s){const l=dp.subVectors(s,i).cross(Vb.subVectors(e,i)).normalize();return this.setFromNormalAndCoplanarPoint(l,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){const e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,i){return i.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,i,s=!0){const l=e.delta(dp),f=this.normal.dot(l);if(f===0)return this.distanceToPoint(e.start)===0?i.copy(e.start):null;const h=-(e.start.dot(this.normal)+this.constant)/f;return s===!0&&(h<0||h>1)?null:i.copy(e.start).addScaledVector(l,h)}intersectsLine(e){const i=this.distanceToPoint(e.start),s=this.distanceToPoint(e.end);return i<0&&s>0||s<0&&i>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,i){const s=i||kb.getNormalMatrix(e),l=this.coplanarPoint(dp).applyMatrix4(e),f=this.normal.applyMatrix3(s).normalize();return this.constant=-l.dot(f),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}toJSON(){return{normal:this.normal.toArray(),constant:this.constant}}fromJSON(e){return this.normal.fromArray(e.normal),this.constant=e.constant,this}}let Xb=0;class Xo extends nr{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:Xb++}),this.uuid=ic(),this.name="",this.type="Material",this.blending=jl,this.side=Lr,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=cS,this.blendDst=uS,this.blendEquation=Io,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new Ie(0,0,0),this.blendAlpha=0,this.depthFunc=Ql,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=fb,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=jd,this.stencilZFail=jd,this.stencilZPass=jd,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(const i in e){const s=e[i];if(s===void 0){ge(`Material: parameter '${i}' has value of undefined.`);continue}const l=this[i];if(l===void 0){ge(`Material: '${i}' is not a property of THREE.${this.type}.`);continue}l&&l.isColor?l.set(s):l&&l.isVector2&&s&&s.isVector2||l&&l.isEuler&&s&&s.isEuler||l&&l.isVector3&&s&&s.isVector3?l.copy(s):this[i]=s}}toJSON(e){const i=e===void 0||typeof e=="string";i&&(e={textures:{},images:{}});const s={metadata:{version:4.7,type:"Material",generator:"Material.toJSON"}};s.uuid=this.uuid,s.type=this.type,s.blending=this.blending,s.side=this.side,s.shadowSide=this.shadowSide,s.vertexColors=this.vertexColors,s.opacity=this.opacity,s.transparent=this.transparent,s.blendSrc=this.blendSrc,s.blendDst=this.blendDst,s.blendEquation=this.blendEquation,s.blendSrcAlpha=this.blendSrcAlpha,s.blendDstAlpha=this.blendDstAlpha,s.blendEquationAlpha=this.blendEquationAlpha,s.blendColor=this.blendColor.getHex(),s.blendAlpha=this.blendAlpha,s.depthFunc=this.depthFunc,s.depthTest=this.depthTest,s.depthWrite=this.depthWrite,s.colorWrite=this.colorWrite,s.clipIntersection=this.clipIntersection,s.clipShadows=this.clipShadows,s.stencilWriteMask=this.stencilWriteMask,s.stencilFunc=this.stencilFunc,s.stencilRef=this.stencilRef,s.stencilFuncMask=this.stencilFuncMask,s.stencilFail=this.stencilFail,s.stencilZFail=this.stencilZFail,s.stencilZPass=this.stencilZPass,s.stencilWrite=this.stencilWrite,s.polygonOffset=this.polygonOffset,s.polygonOffsetFactor=this.polygonOffsetFactor,s.polygonOffsetUnits=this.polygonOffsetUnits,s.dithering=this.dithering,s.alphaTest=this.alphaTest,s.alphaHash=this.alphaHash,s.alphaToCoverage=this.alphaToCoverage,s.premultipliedAlpha=this.premultipliedAlpha,s.forceSinglePass=this.forceSinglePass,s.allowOverride=this.allowOverride,s.visible=this.visible,s.toneMapped=this.toneMapped,s.name=this.name,this.color&&this.color.isColor&&(s.color=this.color.getHex()),this.roughness!==void 0&&(s.roughness=this.roughness),this.metalness!==void 0&&(s.metalness=this.metalness),this.sheen!==void 0&&(s.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(s.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(s.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(s.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&(s.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(s.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(s.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(s.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(s.shininess=this.shininess),this.clearcoat!==void 0&&(s.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(s.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(s.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(s.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(s.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,s.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.sheenColorMap&&this.sheenColorMap.isTexture&&(s.sheenColorMap=this.sheenColorMap.toJSON(e).uuid),this.sheenRoughnessMap&&this.sheenRoughnessMap.isTexture&&(s.sheenRoughnessMap=this.sheenRoughnessMap.toJSON(e).uuid),this.dispersion!==void 0&&(s.dispersion=this.dispersion),this.retroreflectivity!==void 0&&(s.retroreflectivity=this.retroreflectivity),this.iridescence!==void 0&&(s.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(s.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(s.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(s.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(s.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.anisotropy!==void 0&&(s.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(s.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(s.anisotropyMap=this.anisotropyMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(s.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(s.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(s.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(s.lightMap=this.lightMap.toJSON(e).uuid,s.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(s.aoMap=this.aoMap.toJSON(e).uuid,s.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(s.bumpMap=this.bumpMap.toJSON(e).uuid,s.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(s.normalMap=this.normalMap.toJSON(e).uuid,s.normalMapType=this.normalMapType,s.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(s.displacementMap=this.displacementMap.toJSON(e).uuid,s.displacementScale=this.displacementScale,s.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(s.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(s.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(s.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(s.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(s.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(s.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(s.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(s.combine=this.combine)),this.envMapRotation!==void 0&&(s.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(s.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(s.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(s.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(s.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(s.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(s.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(s.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(s.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&(s.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(s.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(s.size=this.size),this.sizeAttenuation!==void 0&&(s.sizeAttenuation=this.sizeAttenuation),Array.isArray(this.clippingPlanes)&&this.clippingPlanes.length>0&&(s.clippingPlanes=this.clippingPlanes.map(f=>f.toJSON())),this.rotation!==void 0&&(s.rotation=this.rotation),this.depthPacking!==void 0&&(s.depthPacking=this.depthPacking),this.linewidth!==void 0&&(s.linewidth=this.linewidth),this.linecap!==void 0&&(s.linecap=this.linecap),this.linejoin!==void 0&&(s.linejoin=this.linejoin),this.dashSize!==void 0&&(s.dashSize=this.dashSize),this.gapSize!==void 0&&(s.gapSize=this.gapSize),this.scale!==void 0&&(s.scale=this.scale),this.wireframe!==void 0&&(s.wireframe=this.wireframe),this.wireframeLinewidth!==void 0&&(s.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!==void 0&&(s.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!==void 0&&(s.wireframeLinejoin=this.wireframeLinejoin),this.flatShading!==void 0&&(s.flatShading=this.flatShading),this.fog!==void 0&&(s.fog=this.fog),Object.keys(this.userData).length>0&&(s.userData=this.userData);function l(f){const h=[];for(const d in f){const m=f[d];delete m.metadata,h.push(m)}return h}if(i){const f=l(e.textures),h=l(e.images);f.length>0&&(s.textures=f),h.length>0&&(s.images=h)}return s}fromJSON(e,i){if(e.uuid!==void 0&&(this.uuid=e.uuid),e.name!==void 0&&(this.name=e.name),e.color!==void 0&&this.color!==void 0&&this.color.setHex(e.color),e.roughness!==void 0&&(this.roughness=e.roughness),e.metalness!==void 0&&(this.metalness=e.metalness),e.sheen!==void 0&&(this.sheen=e.sheen),e.sheenColor!==void 0&&(this.sheenColor=new Ie().setHex(e.sheenColor)),e.sheenRoughness!==void 0&&(this.sheenRoughness=e.sheenRoughness),e.emissive!==void 0&&this.emissive!==void 0&&this.emissive.setHex(e.emissive),e.specular!==void 0&&this.specular!==void 0&&this.specular.setHex(e.specular),e.specularIntensity!==void 0&&(this.specularIntensity=e.specularIntensity),e.specularColor!==void 0&&this.specularColor!==void 0&&this.specularColor.setHex(e.specularColor),e.shininess!==void 0&&(this.shininess=e.shininess),e.clearcoat!==void 0&&(this.clearcoat=e.clearcoat),e.clearcoatRoughness!==void 0&&(this.clearcoatRoughness=e.clearcoatRoughness),e.dispersion!==void 0&&(this.dispersion=e.dispersion),e.retroreflectivity!==void 0&&(this.retroreflectivity=e.retroreflectivity),e.iridescence!==void 0&&(this.iridescence=e.iridescence),e.iridescenceIOR!==void 0&&(this.iridescenceIOR=e.iridescenceIOR),e.iridescenceThicknessRange!==void 0&&(this.iridescenceThicknessRange=e.iridescenceThicknessRange),e.transmission!==void 0&&(this.transmission=e.transmission),e.thickness!==void 0&&(this.thickness=e.thickness),e.attenuationDistance!==void 0&&(this.attenuationDistance=e.attenuationDistance),e.attenuationColor!==void 0&&this.attenuationColor!==void 0&&this.attenuationColor.setHex(e.attenuationColor),e.anisotropy!==void 0&&(this.anisotropy=e.anisotropy),e.anisotropyRotation!==void 0&&(this.anisotropyRotation=e.anisotropyRotation),e.fog!==void 0&&(this.fog=e.fog),e.flatShading!==void 0&&(this.flatShading=e.flatShading),e.blending!==void 0&&(this.blending=e.blending),e.combine!==void 0&&(this.combine=e.combine),e.side!==void 0&&(this.side=e.side),e.shadowSide!==void 0&&(this.shadowSide=e.shadowSide),e.opacity!==void 0&&(this.opacity=e.opacity),e.transparent!==void 0&&(this.transparent=e.transparent),e.alphaTest!==void 0&&(this.alphaTest=e.alphaTest),e.alphaHash!==void 0&&(this.alphaHash=e.alphaHash),e.depthFunc!==void 0&&(this.depthFunc=e.depthFunc),e.depthTest!==void 0&&(this.depthTest=e.depthTest),e.depthWrite!==void 0&&(this.depthWrite=e.depthWrite),e.colorWrite!==void 0&&(this.colorWrite=e.colorWrite),e.clippingPlanes!==void 0&&(this.clippingPlanes=e.clippingPlanes.map(s=>new ds().fromJSON(s))),e.clipIntersection!==void 0&&(this.clipIntersection=e.clipIntersection),e.clipShadows!==void 0&&(this.clipShadows=e.clipShadows),e.depthPacking!==void 0&&(this.depthPacking=e.depthPacking),e.blendSrc!==void 0&&(this.blendSrc=e.blendSrc),e.blendDst!==void 0&&(this.blendDst=e.blendDst),e.blendEquation!==void 0&&(this.blendEquation=e.blendEquation),e.blendSrcAlpha!==void 0&&(this.blendSrcAlpha=e.blendSrcAlpha),e.blendDstAlpha!==void 0&&(this.blendDstAlpha=e.blendDstAlpha),e.blendEquationAlpha!==void 0&&(this.blendEquationAlpha=e.blendEquationAlpha),e.blendColor!==void 0&&this.blendColor!==void 0&&this.blendColor.setHex(e.blendColor),e.blendAlpha!==void 0&&(this.blendAlpha=e.blendAlpha),e.stencilWriteMask!==void 0&&(this.stencilWriteMask=e.stencilWriteMask),e.stencilFunc!==void 0&&(this.stencilFunc=e.stencilFunc),e.stencilRef!==void 0&&(this.stencilRef=e.stencilRef),e.stencilFuncMask!==void 0&&(this.stencilFuncMask=e.stencilFuncMask),e.stencilFail!==void 0&&(this.stencilFail=e.stencilFail),e.stencilZFail!==void 0&&(this.stencilZFail=e.stencilZFail),e.stencilZPass!==void 0&&(this.stencilZPass=e.stencilZPass),e.stencilWrite!==void 0&&(this.stencilWrite=e.stencilWrite),e.wireframe!==void 0&&(this.wireframe=e.wireframe),e.wireframeLinewidth!==void 0&&(this.wireframeLinewidth=e.wireframeLinewidth),e.wireframeLinecap!==void 0&&(this.wireframeLinecap=e.wireframeLinecap),e.wireframeLinejoin!==void 0&&(this.wireframeLinejoin=e.wireframeLinejoin),e.rotation!==void 0&&(this.rotation=e.rotation),e.linewidth!==void 0&&(this.linewidth=e.linewidth),e.linecap!==void 0&&(this.linecap=e.linecap),e.linejoin!==void 0&&(this.linejoin=e.linejoin),e.dashSize!==void 0&&(this.dashSize=e.dashSize),e.gapSize!==void 0&&(this.gapSize=e.gapSize),e.scale!==void 0&&(this.scale=e.scale),e.polygonOffset!==void 0&&(this.polygonOffset=e.polygonOffset),e.polygonOffsetFactor!==void 0&&(this.polygonOffsetFactor=e.polygonOffsetFactor),e.polygonOffsetUnits!==void 0&&(this.polygonOffsetUnits=e.polygonOffsetUnits),e.dithering!==void 0&&(this.dithering=e.dithering),e.alphaToCoverage!==void 0&&(this.alphaToCoverage=e.alphaToCoverage),e.premultipliedAlpha!==void 0&&(this.premultipliedAlpha=e.premultipliedAlpha),e.forceSinglePass!==void 0&&(this.forceSinglePass=e.forceSinglePass),e.allowOverride!==void 0&&(this.allowOverride=e.allowOverride),e.visible!==void 0&&(this.visible=e.visible),e.toneMapped!==void 0&&(this.toneMapped=e.toneMapped),e.userData!==void 0&&(this.userData=e.userData),e.vertexColors!==void 0&&(typeof e.vertexColors=="number"?this.vertexColors=e.vertexColors>0:this.vertexColors=e.vertexColors),e.size!==void 0&&(this.size=e.size),e.sizeAttenuation!==void 0&&(this.sizeAttenuation=e.sizeAttenuation),e.map!==void 0&&(this.map=i[e.map]||null),e.matcap!==void 0&&(this.matcap=i[e.matcap]||null),e.alphaMap!==void 0&&(this.alphaMap=i[e.alphaMap]||null),e.bumpMap!==void 0&&(this.bumpMap=i[e.bumpMap]||null),e.bumpScale!==void 0&&(this.bumpScale=e.bumpScale),e.normalMap!==void 0&&(this.normalMap=i[e.normalMap]||null),e.normalMapType!==void 0&&(this.normalMapType=e.normalMapType),e.normalScale!==void 0){let s=e.normalScale;Array.isArray(s)===!1&&(s=[s,s]),this.normalScale=new _e().fromArray(s)}return e.displacementMap!==void 0&&(this.displacementMap=i[e.displacementMap]||null),e.displacementScale!==void 0&&(this.displacementScale=e.displacementScale),e.displacementBias!==void 0&&(this.displacementBias=e.displacementBias),e.roughnessMap!==void 0&&(this.roughnessMap=i[e.roughnessMap]||null),e.metalnessMap!==void 0&&(this.metalnessMap=i[e.metalnessMap]||null),e.emissiveMap!==void 0&&(this.emissiveMap=i[e.emissiveMap]||null),e.emissiveIntensity!==void 0&&(this.emissiveIntensity=e.emissiveIntensity),e.specularMap!==void 0&&(this.specularMap=i[e.specularMap]||null),e.specularIntensityMap!==void 0&&(this.specularIntensityMap=i[e.specularIntensityMap]||null),e.specularColorMap!==void 0&&(this.specularColorMap=i[e.specularColorMap]||null),e.envMap!==void 0&&(this.envMap=i[e.envMap]||null),e.envMapRotation!==void 0&&this.envMapRotation.fromArray(e.envMapRotation),e.envMapIntensity!==void 0&&(this.envMapIntensity=e.envMapIntensity),e.reflectivity!==void 0&&(this.reflectivity=e.reflectivity),e.refractionRatio!==void 0&&(this.refractionRatio=e.refractionRatio),e.lightMap!==void 0&&(this.lightMap=i[e.lightMap]||null),e.lightMapIntensity!==void 0&&(this.lightMapIntensity=e.lightMapIntensity),e.aoMap!==void 0&&(this.aoMap=i[e.aoMap]||null),e.aoMapIntensity!==void 0&&(this.aoMapIntensity=e.aoMapIntensity),e.gradientMap!==void 0&&(this.gradientMap=i[e.gradientMap]||null),e.clearcoatMap!==void 0&&(this.clearcoatMap=i[e.clearcoatMap]||null),e.clearcoatRoughnessMap!==void 0&&(this.clearcoatRoughnessMap=i[e.clearcoatRoughnessMap]||null),e.clearcoatNormalMap!==void 0&&(this.clearcoatNormalMap=i[e.clearcoatNormalMap]||null),e.clearcoatNormalScale!==void 0&&(this.clearcoatNormalScale=new _e().fromArray(e.clearcoatNormalScale)),e.iridescenceMap!==void 0&&(this.iridescenceMap=i[e.iridescenceMap]||null),e.iridescenceThicknessMap!==void 0&&(this.iridescenceThicknessMap=i[e.iridescenceThicknessMap]||null),e.transmissionMap!==void 0&&(this.transmissionMap=i[e.transmissionMap]||null),e.thicknessMap!==void 0&&(this.thicknessMap=i[e.thicknessMap]||null),e.anisotropyMap!==void 0&&(this.anisotropyMap=i[e.anisotropyMap]||null),e.sheenColorMap!==void 0&&(this.sheenColorMap=i[e.sheenColorMap]||null),e.sheenRoughnessMap!==void 0&&(this.sheenRoughnessMap=i[e.sheenRoughnessMap]||null),this}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.blendColor.copy(e.blendColor),this.blendAlpha=e.blendAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;const i=e.clippingPlanes;let s=null;if(i!==null){const l=i.length;s=new Array(l);for(let f=0;f!==l;++f)s[f]=i[f].clone()}return this.clippingPlanes=s,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaHash=e.alphaHash,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.allowOverride=e.allowOverride,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(e){e===!0&&this.version++}}const hs=new X,pp=new X,Uu=new X,Lu=new X;class mf{constructor(e=new X,i=new X(0,0,-1)){this.origin=e,this.direction=i}set(e,i){return this.origin.copy(e),this.direction.copy(i),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,i){return i.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,hs)),this}closestPointToPoint(e,i){i.subVectors(e,this.origin);const s=i.dot(this.direction);return s<0?i.copy(this.origin):i.copy(this.origin).addScaledVector(this.direction,s)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){const i=hs.subVectors(e,this.origin).dot(this.direction);return i<0?this.origin.distanceToSquared(e):(hs.copy(this.origin).addScaledVector(this.direction,i),hs.distanceToSquared(e))}distanceSqToSegment(e,i,s,l){pp.copy(e).add(i).multiplyScalar(.5),Uu.copy(i).sub(e).normalize(),Lu.copy(this.origin).sub(pp);const f=e.distanceTo(i)*.5,h=-this.direction.dot(Uu),d=Lu.dot(this.direction),m=-Lu.dot(Uu),p=Lu.lengthSq(),x=Math.abs(1-h*h);let v,g,M,A;if(x>0)if(v=h*m-d,g=h*d-m,A=f*x,v>=0)if(g>=-A)if(g<=A){const C=1/x;v*=C,g*=C,M=v*(v+h*g+2*d)+g*(h*v+g+2*m)+p}else g=f,v=Math.max(0,-(h*g+d)),M=-v*v+g*(g+2*m)+p;else g=-f,v=Math.max(0,-(h*g+d)),M=-v*v+g*(g+2*m)+p;else g<=-A?(v=Math.max(0,-(-h*f+d)),g=v>0?-f:Math.min(Math.max(-f,-m),f),M=-v*v+g*(g+2*m)+p):g<=A?(v=0,g=Math.min(Math.max(-f,-m),f),M=g*(g+2*m)+p):(v=Math.max(0,-(h*f+d)),g=v>0?f:Math.min(Math.max(-f,-m),f),M=-v*v+g*(g+2*m)+p);else g=h>0?-f:f,v=Math.max(0,-(h*g+d)),M=-v*v+g*(g+2*m)+p;return s&&s.copy(this.origin).addScaledVector(this.direction,v),l&&l.copy(pp).addScaledVector(Uu,g),M}intersectSphere(e,i){if(e.radius<0)return null;hs.subVectors(e.center,this.origin);const s=hs.dot(this.direction),l=hs.dot(hs)-s*s,f=e.radius*e.radius;if(l>f)return null;const h=Math.sqrt(f-l),d=s-h,m=s+h;return m<0?null:d<0?this.at(m,i):this.at(d,i)}intersectsSphere(e){return e.radius<0?!1:this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){const i=e.normal.dot(this.direction);if(i===0)return e.distanceToPoint(this.origin)===0?0:null;const s=-(this.origin.dot(e.normal)+e.constant)/i;return s>=0?s:null}intersectPlane(e,i){const s=this.distanceToPlane(e);return s===null?null:this.at(s,i)}intersectsPlane(e){const i=e.distanceToPoint(this.origin);return i===0||e.normal.dot(this.direction)*i<0}intersectBox(e,i){let s,l,f,h,d,m;const p=1/this.direction.x,x=1/this.direction.y,v=1/this.direction.z,g=this.origin;return p>=0?(s=(e.min.x-g.x)*p,l=(e.max.x-g.x)*p):(s=(e.max.x-g.x)*p,l=(e.min.x-g.x)*p),x>=0?(f=(e.min.y-g.y)*x,h=(e.max.y-g.y)*x):(f=(e.max.y-g.y)*x,h=(e.min.y-g.y)*x),s>h||f>l||((f>s||isNaN(s))&&(s=f),(h<l||isNaN(l))&&(l=h),v>=0?(d=(e.min.z-g.z)*v,m=(e.max.z-g.z)*v):(d=(e.max.z-g.z)*v,m=(e.min.z-g.z)*v),s>m||d>l)||((d>s||s!==s)&&(s=d),(m<l||l!==l)&&(l=m),l<0)?null:this.at(s>=0?s:l,i)}intersectsBox(e){return this.intersectBox(e,hs)!==null}intersectTriangle(e,i,s,l,f){const h=this.origin,d=this.direction,m=d.x,p=d.y,x=d.z,v=e.x-h.x,g=e.y-h.y,M=e.z-h.z,A=i.x-h.x,C=i.y-h.y,y=i.z-h.z,S=s.x-h.x,U=s.y-h.y,F=s.z-h.z,N=Math.abs(m),L=Math.abs(p),D=Math.abs(x);let I,T,O,V,Y,J,rt,j,et,q,Z,ht;if(N>=L&&N>=D?(O=m,J=v,et=A,ht=S,m>=0?(I=p,T=x,V=g,Y=M,rt=C,j=y,q=U,Z=F):(I=x,T=p,V=M,Y=g,rt=y,j=C,q=F,Z=U)):L>=D?(O=p,J=g,et=C,ht=U,p>=0?(I=x,T=m,V=M,Y=v,rt=y,j=A,q=F,Z=S):(I=m,T=x,V=v,Y=M,rt=A,j=y,q=S,Z=F)):(O=x,J=M,et=y,ht=F,x>=0?(I=m,T=p,V=v,Y=g,rt=A,j=C,q=S,Z=U):(I=p,T=m,V=g,Y=v,rt=C,j=A,q=U,Z=S)),O===0)return null;const ct=I/O,gt=T/O,vt=1/O,ie=V-ct*J,ne=Y-gt*J,B=rt-ct*et,xt=j-gt*et,Nt=q-ct*ht,Q=Z-gt*ht,dt=Nt*xt-Q*B,Dt=ie*Q-ne*Nt,Wt=B*ne-xt*ie;if(l){if(dt<0||Dt<0||Wt<0)return null}else if((dt<0||Dt<0||Wt<0)&&(dt>0||Dt>0||Wt>0))return null;const Mt=dt+Dt+Wt;if(Mt===0)return null;const It=vt*(dt*J+Dt*et+Wt*ht);return(Mt>0?It<0:It>0)?null:this.at(It/Mt,f)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}}class Kl extends Xo{constructor(e){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new Ie(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new er,this.combine=fS,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}}const gx=new gn,wr=new mf,Ou=new pf,_x=new X,Pu=new X,Iu=new X,zu=new X,mp=new X,Bu=new X,vx=new X,Fu=new X;class Me extends qn{constructor(e=new bi,i=new Kl){super(),this.isMesh=!0,this.type="Mesh",this.geometry=e,this.material=i,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.count=1,this.updateMorphTargets()}copy(e,i){return super.copy(e,i),e.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=e.morphTargetInfluences.slice()),e.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary)),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}updateMorphTargets(){const i=this.geometry.morphAttributes,s=Object.keys(i);if(s.length>0){const l=i[s[0]];if(l!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let f=0,h=l.length;f<h;f++){const d=l[f].name||String(f);this.morphTargetInfluences.push(0),this.morphTargetDictionary[d]=f}}}}getVertexPosition(e,i){const s=this.geometry,l=s.attributes.position,f=s.morphAttributes.position,h=s.morphTargetsRelative;i.fromBufferAttribute(l,e);const d=this.morphTargetInfluences;if(f&&d){Bu.set(0,0,0);for(let m=0,p=f.length;m<p;m++){const x=d[m],v=f[m];x!==0&&(mp.fromBufferAttribute(v,e),h?Bu.addScaledVector(mp,x):Bu.addScaledVector(mp.sub(i),x))}i.add(Bu)}return i}intersectsFrustum(e){return e.intersectsObject(this)}raycast(e,i){const s=this.geometry,l=this.material,f=this.matrixWorld;l!==void 0&&(s.boundingSphere===null&&s.computeBoundingSphere(),Ou.copy(s.boundingSphere),Ou.applyMatrix4(f),wr.copy(e.ray).recast(e.near),!(Ou.containsPoint(wr.origin)===!1&&(wr.intersectSphere(Ou,_x)===null||wr.origin.distanceToSquared(_x)>(e.far-e.near)**2))&&(gx.copy(f).invert(),wr.copy(e.ray).applyMatrix4(gx),!(s.boundingBox!==null&&wr.intersectsBox(s.boundingBox)===!1)&&this._computeIntersections(e,i,wr)))}_computeIntersections(e,i,s){let l;const f=this.geometry,h=this.material,d=f.index,m=f.attributes.position,p=f.attributes.uv,x=f.attributes.uv1,v=f.attributes.normal,g=f.groups,M=f.drawRange;if(d!==null)if(Array.isArray(h))for(let A=0,C=g.length;A<C;A++){const y=g[A],S=h[y.materialIndex],U=Math.max(y.start,M.start),F=Math.min(d.count,Math.min(y.start+y.count,M.start+M.count));for(let N=U,L=F;N<L;N+=3){const D=d.getX(N),I=d.getX(N+1),T=d.getX(N+2);l=Hu(this,S,e,s,p,x,v,D,I,T),l&&(l.faceIndex=Math.floor(N/3),l.face.materialIndex=y.materialIndex,i.push(l))}}else{const A=Math.max(0,M.start),C=Math.min(d.count,M.start+M.count);for(let y=A,S=C;y<S;y+=3){const U=d.getX(y),F=d.getX(y+1),N=d.getX(y+2);l=Hu(this,h,e,s,p,x,v,U,F,N),l&&(l.faceIndex=Math.floor(y/3),i.push(l))}}else if(m!==void 0)if(Array.isArray(h))for(let A=0,C=g.length;A<C;A++){const y=g[A],S=h[y.materialIndex],U=Math.max(y.start,M.start),F=Math.min(m.count,Math.min(y.start+y.count,M.start+M.count));for(let N=U,L=F;N<L;N+=3){const D=N,I=N+1,T=N+2;l=Hu(this,S,e,s,p,x,v,D,I,T),l&&(l.faceIndex=Math.floor(N/3),l.face.materialIndex=y.materialIndex,i.push(l))}}else{const A=Math.max(0,M.start),C=Math.min(m.count,M.start+M.count);for(let y=A,S=C;y<S;y+=3){const U=y,F=y+1,N=y+2;l=Hu(this,h,e,s,p,x,v,U,F,N),l&&(l.faceIndex=Math.floor(y/3),i.push(l))}}}}function Wb(o,e,i,s,l,f,h,d){let m;if(e.side===Ei?m=s.intersectTriangle(h,f,l,!0,d):m=s.intersectTriangle(l,f,h,e.side===Lr,d),m===null)return null;Fu.copy(d),Fu.applyMatrix4(o.matrixWorld);const p=i.ray.origin.distanceTo(Fu);return p<i.near||p>i.far?null:{distance:p,point:Fu.clone(),object:o}}function Hu(o,e,i,s,l,f,h,d,m,p){o.getVertexPosition(d,Pu),o.getVertexPosition(m,Iu),o.getVertexPosition(p,zu);const x=Wb(o,e,i,s,Pu,Iu,zu,vx);if(x){const v=new X;aa.getBarycoord(vx,Pu,Iu,zu,v),l&&(x.uv=aa.getInterpolatedAttribute(l,d,m,p,v,new _e)),f&&(x.uv1=aa.getInterpolatedAttribute(f,d,m,p,v,new _e)),h&&(x.normal=aa.getInterpolatedAttribute(h,d,m,p,v,new X),x.normal.dot(s.direction)>0&&x.normal.multiplyScalar(-1));const g={a:d,b:m,c:p,normal:new X,materialIndex:0};aa.getNormal(Pu,Iu,zu,g.normal),x.face=g,x.barycoord=v}return x}class Yb extends di{constructor(e=null,i=1,s=1,l,f,h,d,m,p=ei,x=ei,v,g){super(null,h,d,m,p,x,l,f,v,g),this.isDataTexture=!0,this.image={data:e,width:i,height:s},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}const Cr=new pf,qb=new _e(.5,.5),Gu=new X;class Dm{constructor(e=new ds,i=new ds,s=new ds,l=new ds,f=new ds,h=new ds){this.planes=[e,i,s,l,f,h]}set(e,i,s,l,f,h){const d=this.planes;return d[0].copy(e),d[1].copy(i),d[2].copy(s),d[3].copy(l),d[4].copy(f),d[5].copy(h),this}copy(e){const i=this.planes;for(let s=0;s<6;s++)i[s].copy(e.planes[s]);return this}setFromProjectionMatrix(e,i=Fa,s=!1){const l=this.planes,f=e.elements,h=f[0],d=f[1],m=f[2],p=f[3],x=f[4],v=f[5],g=f[6],M=f[7],A=f[8],C=f[9],y=f[10],S=f[11],U=f[12],F=f[13],N=f[14],L=f[15];if(l[0].setComponents(p-h,M-x,S-A,L-U).normalize(),l[1].setComponents(p+h,M+x,S+A,L+U).normalize(),l[2].setComponents(p+d,M+v,S+C,L+F).normalize(),l[3].setComponents(p-d,M-v,S-C,L-F).normalize(),s)l[4].setComponents(m,g,y,N).normalize(),l[5].setComponents(p-m,M-g,S-y,L-N).normalize();else if(l[4].setComponents(p-m,M-g,S-y,L-N).normalize(),i===Fa)l[5].setComponents(p+m,M+g,S+y,L+N).normalize();else if(i===tc)l[5].setComponents(m,g,y,N).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+i);return this}intersectsObject(e){if(e.boundingSphere!==void 0)e.boundingSphere===null&&e.computeBoundingSphere(),Cr.copy(e.boundingSphere).applyMatrix4(e.matrixWorld);else{const i=e.geometry;i.boundingSphere===null&&i.computeBoundingSphere(),Cr.copy(i.boundingSphere).applyMatrix4(e.matrixWorld)}return this.intersectsSphere(Cr)}intersectsSprite(e){Cr.center.set(0,0,0);const i=qb.distanceTo(e.center);return Cr.radius=.7071067811865476+i,Cr.applyMatrix4(e.matrixWorld),this.intersectsSphere(Cr)}intersectsSphere(e){const i=this.planes,s=e.center,l=-e.radius;for(let f=0;f<6;f++)if(i[f].distanceToPoint(s)<l)return!1;return!0}intersectsBox(e){const i=this.planes;for(let s=0;s<6;s++){const l=i[s];if(Gu.x=l.normal.x>0?e.max.x:e.min.x,Gu.y=l.normal.y>0?e.max.y:e.min.y,Gu.z=l.normal.z>0?e.max.z:e.min.z,l.distanceToPoint(Gu)<0)return!1}return!0}containsPoint(e){const i=this.planes;for(let s=0;s<6;s++)if(i[s].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}}class Um extends Xo{constructor(e){super(),this.isLineBasicMaterial=!0,this.type="LineBasicMaterial",this.color=new Ie(16777215),this.map=null,this.linewidth=1,this.linecap="round",this.linejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.linewidth=e.linewidth,this.linecap=e.linecap,this.linejoin=e.linejoin,this.fog=e.fog,this}}const cf=new X,uf=new X,xx=new gn,Vl=new mf,Vu=new pf,gp=new X,Sx=new X;class jb extends qn{constructor(e=new bi,i=new Um){super(),this.isLine=!0,this.type="Line",this.geometry=e,this.material=i,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(e,i){return super.copy(e,i),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}computeLineDistances(){const e=this.geometry;if(e.index===null){const i=e.attributes.position,s=[0];for(let l=1,f=i.count;l<f;l++)cf.fromBufferAttribute(i,l-1),uf.fromBufferAttribute(i,l),s[l]=s[l-1],s[l]+=cf.distanceTo(uf);e.setAttribute("lineDistance",new Pn(s,1))}else ge("Line.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}intersectsFrustum(e){return e.intersectsObject(this)}raycast(e,i){const s=this.geometry,l=this.matrixWorld,f=e.params.Line.threshold,h=s.drawRange;if(s.boundingSphere===null&&s.computeBoundingSphere(),Vu.copy(s.boundingSphere),Vu.applyMatrix4(l),Vu.radius+=f,e.ray.intersectsSphere(Vu)===!1)return;xx.copy(l).invert(),Vl.copy(e.ray).applyMatrix4(xx);const d=f/((this.scale.x+this.scale.y+this.scale.z)/3),m=d*d,p=this.isLineSegments?2:1,x=s.index,g=s.attributes.position;if(x!==null){const M=Math.max(0,h.start),A=Math.min(x.count,h.start+h.count);for(let C=M,y=A-1;C<y;C+=p){const S=x.getX(C),U=x.getX(C+1),F=ku(this,e,Vl,m,S,U,C);F&&i.push(F)}if(this.isLineLoop){const C=x.getX(A-1),y=x.getX(M),S=ku(this,e,Vl,m,C,y,A-1);S&&i.push(S)}}else{const M=Math.max(0,h.start),A=Math.min(g.count,h.start+h.count);for(let C=M,y=A-1;C<y;C+=p){const S=ku(this,e,Vl,m,C,C+1,C);S&&i.push(S)}if(this.isLineLoop){const C=ku(this,e,Vl,m,A-1,M,A-1);C&&i.push(C)}}}updateMorphTargets(){const i=this.geometry.morphAttributes,s=Object.keys(i);if(s.length>0){const l=i[s[0]];if(l!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let f=0,h=l.length;f<h;f++){const d=l[f].name||String(f);this.morphTargetInfluences.push(0),this.morphTargetDictionary[d]=f}}}}}function ku(o,e,i,s,l,f,h){const d=o.geometry.attributes.position;if(cf.fromBufferAttribute(d,l),uf.fromBufferAttribute(d,f),i.distanceSqToSegment(cf,uf,gp,Sx)>s)return;gp.applyMatrix4(o.matrixWorld);const p=e.ray.origin.distanceTo(gp);if(!(p<e.near||p>e.far))return{distance:p,point:Sx.clone().applyMatrix4(o.matrixWorld),index:h,face:null,faceIndex:null,barycoord:null,object:o}}const yx=new X,Mx=new X;class US extends jb{constructor(e,i){super(e,i),this.isLineSegments=!0,this.type="LineSegments"}computeLineDistances(){const e=this.geometry;if(e.index===null){const i=e.attributes.position,s=[];for(let l=0,f=i.count;l<f;l+=2)yx.fromBufferAttribute(i,l),Mx.fromBufferAttribute(i,l+1),s[l]=l===0?0:s[l-1],s[l+1]=s[l]+yx.distanceTo(Mx);e.setAttribute("lineDistance",new Pn(s,1))}else ge("LineSegments.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}}class LS extends di{constructor(e=[],i=Or,s,l,f,h,d,m,p,x){super(e,i,s,l,f,h,d,m,p,x),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}}class ec extends di{constructor(e,i,s=Ga,l,f,h,d=ei,m=ei,p,x=vs,v=1){if(x!==vs&&x!==Ur)throw new Error("THREE.DepthTexture: format must be either THREE.DepthFormat or THREE.DepthStencilFormat");const g={width:e,height:i,depth:v};super(g,l,f,h,d,m,x,s,p),this.isDepthTexture=!0,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(e){return super.copy(e),this.source=new wm(Object.assign({},e.image)),this.compareFunction=e.compareFunction,this}toJSON(e){const i=super.toJSON(e);return i.compareFunction=this.compareFunction,i}}class Zb extends ec{constructor(e,i=Ga,s=Or,l,f,h=ei,d=ei,m,p=vs){const x={width:e,height:e,depth:1},v=[x,x,x,x,x,x];super(e,e,i,s,l,f,h,d,m,p),this.image=v,this.isCubeDepthTexture=!0,this.isCubeTexture=!0}get images(){return this.image}set images(e){this.image=e}}class OS extends di{constructor(e=null){super(),this.sourceTexture=e,this.isExternalTexture=!0}copy(e){return super.copy(e),this.sourceTexture=e.sourceTexture,this}}class On extends bi{constructor(e=1,i=1,s=1,l=1,f=1,h=1){super(),this.type="BoxGeometry",this.parameters={width:e,height:i,depth:s,widthSegments:l,heightSegments:f,depthSegments:h};const d=this;l=Math.floor(l),f=Math.floor(f),h=Math.floor(h);const m=[],p=[],x=[],v=[];let g=0,M=0;A("z","y","x",-1,-1,s,i,e,h,f,0),A("z","y","x",1,-1,s,i,-e,h,f,1),A("x","z","y",1,1,e,s,i,l,h,2),A("x","z","y",1,-1,e,s,-i,l,h,3),A("x","y","z",1,-1,e,i,s,l,f,4),A("x","y","z",-1,-1,e,i,-s,l,f,5),this.setIndex(m),this.setAttribute("position",new Pn(p,3)),this.setAttribute("normal",new Pn(x,3)),this.setAttribute("uv",new Pn(v,2));function A(C,y,S,U,F,N,L,D,I,T,O){const V=N/I,Y=L/T,J=N/2,rt=L/2,j=D/2,et=I+1,q=T+1;let Z=0,ht=0;const ct=new X;for(let gt=0;gt<q;gt++){const vt=gt*Y-rt;for(let ie=0;ie<et;ie++){const ne=ie*V-J;ct[C]=ne*U,ct[y]=vt*F,ct[S]=j,p.push(ct.x,ct.y,ct.z),ct[C]=0,ct[y]=0,ct[S]=D>0?1:-1,x.push(ct.x,ct.y,ct.z),v.push(ie/I),v.push(1-gt/T),Z+=1}}for(let gt=0;gt<T;gt++)for(let vt=0;vt<I;vt++){const ie=g+vt+et*gt,ne=g+vt+et*(gt+1),B=g+(vt+1)+et*(gt+1),xt=g+(vt+1)+et*gt;m.push(ie,ne,xt),m.push(ne,B,xt),ht+=6}d.addGroup(M,ht,O),M+=ht,g+=Z}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new On(e.width,e.height,e.depth,e.widthSegments,e.heightSegments,e.depthSegments)}}class An extends bi{constructor(e=1,i=1,s=1,l=32,f=1,h=!1,d=0,m=Math.PI*2){super(),this.type="CylinderGeometry",this.parameters={radiusTop:e,radiusBottom:i,height:s,radialSegments:l,heightSegments:f,openEnded:h,thetaStart:d,thetaLength:m};const p=this;l=Math.floor(l),f=Math.floor(f);const x=[],v=[],g=[],M=[];let A=0;const C=[],y=s/2;let S=0;U(),h===!1&&(e>0&&F(!0),i>0&&F(!1)),this.setIndex(x),this.setAttribute("position",new Pn(v,3)),this.setAttribute("normal",new Pn(g,3)),this.setAttribute("uv",new Pn(M,2));function U(){const N=new X,L=new X;let D=0;const I=(i-e)/s;for(let T=0;T<=f;T++){const O=[],V=T/f,Y=V*(i-e)+e;for(let J=0;J<=l;J++){const rt=J/l,j=rt*m+d,et=Math.sin(j),q=Math.cos(j);L.x=Y*et,L.y=-V*s+y,L.z=Y*q,v.push(L.x,L.y,L.z),N.set(et,I,q).normalize(),g.push(N.x,N.y,N.z),M.push(rt,1-V),O.push(A++)}C.push(O)}for(let T=0;T<l;T++)for(let O=0;O<f;O++){const V=C[O][T],Y=C[O+1][T],J=C[O+1][T+1],rt=C[O][T+1];(e>0||O!==0)&&(x.push(V,Y,rt),D+=3),(i>0||O!==f-1)&&(x.push(Y,J,rt),D+=3)}p.addGroup(S,D,0),S+=D}function F(N){const L=A,D=new _e,I=new X;let T=0;const O=N===!0?e:i,V=N===!0?1:-1;for(let J=1;J<=l;J++)v.push(0,y*V,0),g.push(0,V,0),M.push(.5,.5),A++;const Y=A;for(let J=0;J<=l;J++){const j=J/l*m+d,et=Math.cos(j),q=Math.sin(j);I.x=O*q,I.y=y*V,I.z=O*et,v.push(I.x,I.y,I.z),g.push(0,V,0),D.x=et*.5+.5,D.y=q*.5*V+.5,M.push(D.x,D.y),A++}for(let J=0;J<l;J++){const rt=L+J,j=Y+J;N===!0?x.push(j,j+1,rt):x.push(j+1,j,rt),T+=3}p.addGroup(S,T,N===!0?1:2),S+=T}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new An(e.radiusTop,e.radiusBottom,e.height,e.radialSegments,e.heightSegments,e.openEnded,e.thetaStart,e.thetaLength)}}class Lm extends An{constructor(e=1,i=1,s=32,l=1,f=!1,h=0,d=Math.PI*2){super(0,e,i,s,l,f,h,d),this.type="ConeGeometry",this.parameters={radius:e,height:i,radialSegments:s,heightSegments:l,openEnded:f,thetaStart:h,thetaLength:d}}static fromJSON(e){return new Lm(e.radius,e.height,e.radialSegments,e.heightSegments,e.openEnded,e.thetaStart,e.thetaLength)}}const Xu=new X,Wu=new X,_p=new X,Yu=new aa;class Kb extends bi{constructor(e=null,i=1){if(super(),this.type="EdgesGeometry",this.parameters={geometry:e,thresholdAngle:i},e!==null){const l=Math.pow(10,4),f=Math.cos(Zl*i),h=e.getIndex(),d=e.getAttribute("position"),m=h?h.count:d.count,p=[0,0,0],x=["a","b","c"],v=new Array(3),g={},M=[];for(let A=0;A<m;A+=3){h?(p[0]=h.getX(A),p[1]=h.getX(A+1),p[2]=h.getX(A+2)):(p[0]=A,p[1]=A+1,p[2]=A+2);const{a:C,b:y,c:S}=Yu;if(C.fromBufferAttribute(d,p[0]),y.fromBufferAttribute(d,p[1]),S.fromBufferAttribute(d,p[2]),Yu.getNormal(_p),v[0]=`${Math.round(C.x*l)},${Math.round(C.y*l)},${Math.round(C.z*l)}`,v[1]=`${Math.round(y.x*l)},${Math.round(y.y*l)},${Math.round(y.z*l)}`,v[2]=`${Math.round(S.x*l)},${Math.round(S.y*l)},${Math.round(S.z*l)}`,!(v[0]===v[1]||v[1]===v[2]||v[2]===v[0]))for(let U=0;U<3;U++){const F=(U+1)%3,N=v[U],L=v[F],D=Yu[x[U]],I=Yu[x[F]],T=`${N}_${L}`,O=`${L}_${N}`;O in g&&g[O]?(_p.dot(g[O].normal)<=f&&(M.push(D.x,D.y,D.z),M.push(I.x,I.y,I.z)),g[O]=null):T in g||(g[T]={index0:p[U],index1:p[F],normal:_p.clone()})}}for(const A in g)if(g[A]){const{index0:C,index1:y}=g[A];Xu.fromBufferAttribute(d,C),Wu.fromBufferAttribute(d,y),M.push(Xu.x,Xu.y,Xu.z),M.push(Wu.x,Wu.y,Wu.z)}this.setAttribute("position",new Pn(M,3))}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}}class sc extends bi{constructor(e=1,i=1,s=1,l=1){super(),this.type="PlaneGeometry",this.parameters={width:e,height:i,widthSegments:s,heightSegments:l};const f=e/2,h=i/2,d=Math.floor(s),m=Math.floor(l),p=d+1,x=m+1,v=e/d,g=i/m,M=[],A=[],C=[],y=[];for(let S=0;S<x;S++){const U=S*g-h;for(let F=0;F<p;F++){const N=F*v-f;A.push(N,-U,0),C.push(0,0,1),y.push(F/d),y.push(1-S/m)}}for(let S=0;S<m;S++)for(let U=0;U<d;U++){const F=U+p*S,N=U+p*(S+1),L=U+1+p*(S+1),D=U+1+p*S;M.push(F,N,D),M.push(N,L,D)}this.setIndex(M),this.setAttribute("position",new Pn(A,3)),this.setAttribute("normal",new Pn(C,3)),this.setAttribute("uv",new Pn(y,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new sc(e.width,e.height,e.widthSegments,e.heightSegments)}}class ff extends bi{constructor(e=.5,i=1,s=32,l=1,f=0,h=Math.PI*2){super(),this.type="RingGeometry",this.parameters={innerRadius:e,outerRadius:i,thetaSegments:s,phiSegments:l,thetaStart:f,thetaLength:h},s=Math.max(3,s),l=Math.max(1,l);const d=[],m=[],p=[],x=[];let v=e;const g=(i-e)/l,M=new X,A=new _e;for(let C=0;C<=l;C++){for(let y=0;y<=s;y++){const S=f+y/s*h;M.x=v*Math.cos(S),M.y=v*Math.sin(S),m.push(M.x,M.y,M.z),p.push(0,0,1),A.x=(M.x/i+1)/2,A.y=(M.y/i+1)/2,x.push(A.x,A.y)}v+=g}for(let C=0;C<l;C++){const y=C*(s+1);for(let S=0;S<s;S++){const U=S+y,F=U,N=U+s+1,L=U+s+2,D=U+1;d.push(F,N,D),d.push(N,L,D)}}this.setIndex(d),this.setAttribute("position",new Pn(m,3)),this.setAttribute("normal",new Pn(p,3)),this.setAttribute("uv",new Pn(x,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new ff(e.innerRadius,e.outerRadius,e.thetaSegments,e.phiSegments,e.thetaStart,e.thetaLength)}}function ko(o){const e={};for(const i in o){e[i]={};for(const s in o[i]){const l=o[i][s];if(Ex(l))l.isRenderTargetTexture?(ge("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),e[i][s]=null):e[i][s]=l.clone();else if(Array.isArray(l))if(Ex(l[0])){const f=[];for(let h=0,d=l.length;h<d;h++)f[h]=l[h].clone();e[i][s]=f}else e[i][s]=l.slice();else e[i][s]=l}}return e}function hi(o){const e={};for(let i=0;i<o.length;i++){const s=ko(o[i]);for(const l in s)e[l]=s[l]}return e}function Ex(o){return o&&(o.isColor||o.isMatrix3||o.isMatrix4||o.isVector2||o.isVector3||o.isVector4||o.isTexture||o.isQuaternion)}function Qb(o){const e=[];for(let i=0;i<o.length;i++)e.push(o[i].clone());return e}function PS(o){const e=o.getRenderTarget();return e===null?o.outputColorSpace:e.isXRRenderTarget===!0?e.texture.colorSpace:Xe.workingColorSpace}const Jb={clone:ko,merge:hi};var $b=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,tT=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`;class ka extends Xo{constructor(e){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=$b,this.fragmentShader=tT,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0&&this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=ko(e.uniforms),this.uniformsGroups=Qb(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this.defaultAttributeValues=Object.assign({},e.defaultAttributeValues),this.index0AttributeName=e.index0AttributeName,this.uniformsNeedUpdate=e.uniformsNeedUpdate,this}toJSON(e){const i=super.toJSON(e);i.glslVersion=this.glslVersion,i.uniforms={};for(const l in this.uniforms){const h=this.uniforms[l].value;h&&h.isTexture?i.uniforms[l]={type:"t",value:h.toJSON(e).uuid}:h&&h.isColor?i.uniforms[l]={type:"c",value:h.getHex()}:h&&h.isVector2?i.uniforms[l]={type:"v2",value:h.toArray()}:h&&h.isVector3?i.uniforms[l]={type:"v3",value:h.toArray()}:h&&h.isVector4?i.uniforms[l]={type:"v4",value:h.toArray()}:h&&h.isMatrix3?i.uniforms[l]={type:"m3",value:h.toArray()}:h&&h.isMatrix4?i.uniforms[l]={type:"m4",value:h.toArray()}:i.uniforms[l]={value:h}}Object.keys(this.defines).length>0&&(i.defines=this.defines),i.vertexShader=this.vertexShader,i.fragmentShader=this.fragmentShader,i.lights=this.lights,i.clipping=this.clipping;const s={};for(const l in this.extensions)this.extensions[l]===!0&&(s[l]=!0);return Object.keys(s).length>0&&(i.extensions=s),i}fromJSON(e,i){if(super.fromJSON(e,i),e.uniforms!==void 0)for(const s in e.uniforms){const l=e.uniforms[s];switch(this.uniforms[s]={},l.type){case"t":this.uniforms[s].value=i[l.value]||null;break;case"c":this.uniforms[s].value=new Ie().setHex(l.value);break;case"v2":this.uniforms[s].value=new _e().fromArray(l.value);break;case"v3":this.uniforms[s].value=new X().fromArray(l.value);break;case"v4":this.uniforms[s].value=new vn().fromArray(l.value);break;case"m3":this.uniforms[s].value=new be().fromArray(l.value);break;case"m4":this.uniforms[s].value=new gn().fromArray(l.value);break;default:this.uniforms[s].value=l.value}}if(e.defines!==void 0&&(this.defines=e.defines),e.vertexShader!==void 0&&(this.vertexShader=e.vertexShader),e.fragmentShader!==void 0&&(this.fragmentShader=e.fragmentShader),e.glslVersion!==void 0&&(this.glslVersion=e.glslVersion),e.extensions!==void 0)for(const s in e.extensions)this.extensions[s]=e.extensions[s];return e.lights!==void 0&&(this.lights=e.lights),e.clipping!==void 0&&(this.clipping=e.clipping),this}}class eT extends ka{constructor(e){super(e),this.isRawShaderMaterial=!0,this.type="RawShaderMaterial"}}class $e extends Xo{constructor(e){super(),this.isMeshStandardMaterial=!0,this.type="MeshStandardMaterial",this.defines={STANDARD:""},this.color=new Ie(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new Ie(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=fm,this.normalScale=new _e(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new er,this.envMapIntensity=1,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.defines={STANDARD:""},this.color.copy(e.color),this.roughness=e.roughness,this.metalness=e.metalness,this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.roughnessMap=e.roughnessMap,this.metalnessMap=e.metalnessMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.envMapIntensity=e.envMapIntensity,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.flatShading=e.flatShading,this.fog=e.fog,this}}class nT extends Xo{constructor(e){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=cb,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(e)}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}}class iT extends Xo{constructor(e){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e)}copy(e){return super.copy(e),this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}}class Om extends qn{constructor(e,i=1){super(),this.isLight=!0,this.type="Light",this.color=new Ie(e),this.intensity=i}copy(e,i){return super.copy(e,i),this.color.copy(e.color),this.intensity=e.intensity,this}toJSON(e){const i=super.toJSON(e);return i.object.color=this.color.getHex(),i.object.intensity=this.intensity,i}}class aT extends Om{constructor(e,i,s){super(e,s),this.isHemisphereLight=!0,this.type="HemisphereLight",this.position.copy(qn.DEFAULT_UP),this.updateMatrix(),this.groundColor=new Ie(i)}copy(e,i){return super.copy(e,i),this.groundColor.copy(e.groundColor),this}toJSON(e){const i=super.toJSON(e);return i.object.groundColor=this.groundColor.getHex(),i}}const vp=new gn,bx=new X,Tx=new X;class IS{constructor(e){this.camera=e,this.intensity=1,this.bias=0,this.biasNode=null,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new _e(512,512),this.mapType=Vi,this.map=null,this.mapPass=null,this.matrix=new gn,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new Dm,this._frameExtents=new _e(1,1),this._viewportCount=1,this._viewports=[new vn(0,0,1,1)]}getViewportCount(){return this._viewportCount}getCamera(){return this.camera}getFrustum(){return this._frustum}updateMatrices(e){const i=this.camera;bx.setFromMatrixPosition(e.matrixWorld),i.position.copy(bx),Tx.setFromMatrixPosition(e.target.matrixWorld),i.lookAt(Tx),i.updateMatrixWorld(),this._updateMatrix(i,this.matrix,this._frustum)}_updateMatrix(e,i,s,l){vp.multiplyMatrices(e.projectionMatrix,e.matrixWorldInverse),s.setFromProjectionMatrix(vp,e.coordinateSystem,e.reversedDepth);const f=this._frameExtents,h=l?l.z/f.x:1,d=l?l.w/f.y:1,m=l?l.x/f.x:0,p=l?l.y/f.y:0;e.coordinateSystem===tc||e.reversedDepth?i.set(.5*h,0,0,.5*h+m,0,.5*d,0,.5*d+p,0,0,1,0,0,0,0,1):i.set(.5*h,0,0,.5*h+m,0,.5*d,0,.5*d+p,0,0,.5,.5,0,0,0,1),i.multiply(vp)}getViewport(e){return this._viewports[e]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(e){return this.camera=e.camera.clone(),this.intensity=e.intensity,this.bias=e.bias,this.radius=e.radius,this.autoUpdate=e.autoUpdate,this.needsUpdate=e.needsUpdate,this.normalBias=e.normalBias,this.blurSamples=e.blurSamples,this.mapSize.copy(e.mapSize),this.biasNode=e.biasNode,this}clone(){return new this.constructor().copy(this)}toJSON(){const e={};return e.intensity=this.intensity,e.bias=this.bias,e.normalBias=this.normalBias,e.radius=this.radius,e.blurSamples=this.blurSamples,e.mapSize=this.mapSize.toArray(),e.camera=this.camera.toJSON(!1).object,delete e.camera.matrix,e}}const qu=new X,ju=new tr,Pa=new X;class zS extends qn{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new gn,this.projectionMatrix=new gn,this.projectionMatrixInverse=new gn,this.coordinateSystem=Fa,this._reversedDepth=!1}get reversedDepth(){return this._reversedDepth}copy(e,i){return super.copy(e,i),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this.coordinateSystem=e.coordinateSystem,this}getWorldDirection(e){return super.getWorldDirection(e).negate()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorld.decompose(qu,ju,Pa),Pa.x===1&&Pa.y===1&&Pa.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(qu,ju,Pa.set(1,1,1)).invert()}updateWorldMatrix(e,i,s=!1){super.updateWorldMatrix(e,i,s),this.matrixWorld.decompose(qu,ju,Pa),Pa.x===1&&Pa.y===1&&Pa.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(qu,ju,Pa.set(1,1,1)).invert()}clone(){return new this.constructor().copy(this)}}const Js=new X,Ax=new _e,Rx=new _e;class Hi extends zS{constructor(e=50,i=1,s=.1,l=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=e,this.zoom=1,this.near=s,this.far=l,this.focus=10,this.aspect=i,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,i){return super.copy(e,i),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){const i=.5*this.getFilmHeight()/e;this.fov=hm*2*Math.atan(i),this.updateProjectionMatrix()}getFocalLength(){const e=Math.tan(Zl*.5*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return hm*2*Math.atan(Math.tan(Zl*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(e,i,s){Js.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),i.set(Js.x,Js.y).multiplyScalar(-e/Js.z),Js.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),s.set(Js.x,Js.y).multiplyScalar(-e/Js.z)}getViewSize(e,i){return this.getViewBounds(e,Ax,Rx),i.subVectors(Rx,Ax)}setViewOffset(e,i,s,l,f,h){this.aspect=e/i,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=i,this.view.offsetX=s,this.view.offsetY=l,this.view.width=f,this.view.height=h,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const e=this.near;let i=e*Math.tan(Zl*.5*this.fov)/this.zoom,s=2*i,l=this.aspect*s,f=-.5*l;const h=this.view;if(this.view!==null&&this.view.enabled){const m=h.fullWidth,p=h.fullHeight;f+=h.offsetX*l/m,i-=h.offsetY*s/p,l*=h.width/m,s*=h.height/p}const d=this.filmOffset;d!==0&&(f+=e*d/this.getFilmWidth()),this.projectionMatrix.makePerspective(f,f+l,i,i-s,e,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){const i=super.toJSON(e);return i.object.fov=this.fov,i.object.zoom=this.zoom,i.object.near=this.near,i.object.far=this.far,i.object.focus=this.focus,i.object.aspect=this.aspect,this.view!==null&&(i.object.view=Object.assign({},this.view)),i.object.filmGauge=this.filmGauge,i.object.filmOffset=this.filmOffset,i}}class sT extends IS{constructor(){super(new Hi(90,1,.5,500)),this.isPointLightShadow=!0}}class wx extends Om{constructor(e,i,s=0,l=2){super(e,i),this.isPointLight=!0,this.type="PointLight",this.distance=s,this.decay=l,this.shadow=new sT}get power(){return this.intensity*4*Math.PI}set power(e){this.intensity=e/(4*Math.PI)}dispose(){super.dispose(),this.shadow.dispose()}copy(e,i){return super.copy(e,i),this.distance=e.distance,this.decay=e.decay,this.shadow=e.shadow.clone(),this}toJSON(e){const i=super.toJSON(e);return i.object.distance=this.distance,i.object.decay=this.decay,i.object.shadow=this.shadow.toJSON(),i}}class Pm extends zS{constructor(e=-1,i=1,s=1,l=-1,f=.1,h=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=e,this.right=i,this.top=s,this.bottom=l,this.near=f,this.far=h,this.updateProjectionMatrix()}copy(e,i){return super.copy(e,i),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,i,s,l,f,h){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=i,this.view.offsetX=s,this.view.offsetY=l,this.view.width=f,this.view.height=h,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const e=(this.right-this.left)/(2*this.zoom),i=(this.top-this.bottom)/(2*this.zoom),s=(this.right+this.left)/2,l=(this.top+this.bottom)/2;let f=s-e,h=s+e,d=l+i,m=l-i;if(this.view!==null&&this.view.enabled){const p=(this.right-this.left)/this.view.fullWidth/this.zoom,x=(this.top-this.bottom)/this.view.fullHeight/this.zoom;f+=p*this.view.offsetX,h=f+p*this.view.width,d-=x*this.view.offsetY,m=d-x*this.view.height}this.projectionMatrix.makeOrthographic(f,h,d,m,this.near,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){const i=super.toJSON(e);return i.object.zoom=this.zoom,i.object.left=this.left,i.object.right=this.right,i.object.top=this.top,i.object.bottom=this.bottom,i.object.near=this.near,i.object.far=this.far,this.view!==null&&(i.object.view=Object.assign({},this.view)),i}}class rT extends IS{constructor(){super(new Pm(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}}class Cx extends Om{constructor(e,i){super(e,i),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(qn.DEFAULT_UP),this.updateMatrix(),this.target=new qn,this.shadow=new rT}dispose(){super.dispose(),this.shadow.dispose()}copy(e){return super.copy(e),this.target=e.target.clone(),this.shadow=e.shadow.clone(),this}toJSON(e){const i=super.toJSON(e);return i.object.shadow=this.shadow.toJSON(),i.object.target=this.target.uuid,i}}const Lo=-90,Oo=1;class oT extends qn{constructor(e,i,s){super(),this.type="CubeCamera",this.renderTarget=s,this.coordinateSystem=null,this.activeMipmapLevel=0;const l=new Hi(Lo,Oo,e,i);l.layers=this.layers,this.add(l);const f=new Hi(Lo,Oo,e,i);f.layers=this.layers,this.add(f);const h=new Hi(Lo,Oo,e,i);h.layers=this.layers,this.add(h);const d=new Hi(Lo,Oo,e,i);d.layers=this.layers,this.add(d);const m=new Hi(Lo,Oo,e,i);m.layers=this.layers,this.add(m);const p=new Hi(Lo,Oo,e,i);p.layers=this.layers,this.add(p)}updateCoordinateSystem(){const e=this.coordinateSystem,i=this.children.concat(),[s,l,f,h,d,m]=i;for(const p of i)this.remove(p);if(e===Fa)s.up.set(0,1,0),s.lookAt(1,0,0),l.up.set(0,1,0),l.lookAt(-1,0,0),f.up.set(0,0,-1),f.lookAt(0,1,0),h.up.set(0,0,1),h.lookAt(0,-1,0),d.up.set(0,1,0),d.lookAt(0,0,1),m.up.set(0,1,0),m.lookAt(0,0,-1);else if(e===tc)s.up.set(0,-1,0),s.lookAt(-1,0,0),l.up.set(0,-1,0),l.lookAt(1,0,0),f.up.set(0,0,1),f.lookAt(0,1,0),h.up.set(0,0,-1),h.lookAt(0,-1,0),d.up.set(0,-1,0),d.lookAt(0,0,1),m.up.set(0,-1,0),m.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+e);for(const p of i)this.add(p),p.updateMatrixWorld()}update(e,i){this.parent===null&&this.updateMatrixWorld();const{renderTarget:s,activeMipmapLevel:l}=this;this.coordinateSystem!==e.coordinateSystem&&(this.coordinateSystem=e.coordinateSystem,this.updateCoordinateSystem());const[f,h,d,m,p,x]=this.children,v=e.getRenderTarget(),g=e.getActiveCubeFace(),M=e.getActiveMipmapLevel(),A=e.xr.enabled;e.xr.enabled=!1;const C=s.texture.generateMipmaps;s.texture.generateMipmaps=!1;let y=!1;e.isWebGLRenderer===!0?y=e.state.buffers.depth.getReversed():y=e.reversedDepthBuffer,e.setRenderTarget(s,0,l),y&&e.autoClear===!1&&e.clearDepth(),e.render(i,f),e.setRenderTarget(s,1,l),y&&e.autoClear===!1&&e.clearDepth(),e.render(i,h),e.setRenderTarget(s,2,l),y&&e.autoClear===!1&&e.clearDepth(),e.render(i,d),e.setRenderTarget(s,3,l),y&&e.autoClear===!1&&e.clearDepth(),e.render(i,m),e.setRenderTarget(s,4,l),y&&e.autoClear===!1&&e.clearDepth(),e.render(i,p),s.texture.generateMipmaps=C,e.setRenderTarget(s,5,l),y&&e.autoClear===!1&&e.clearDepth(),e.render(i,x),e.setRenderTarget(v,g,M),e.xr.enabled=A,s.texture.needsPMREMUpdate=!0}}class lT extends Hi{constructor(e=[]){super(),this.isArrayCamera=!0,this.isMultiViewCamera=!1,this.cameras=e}}const Nx=new gn;class cT{constructor(e,i,s=0,l=1/0){this.ray=new mf(e,i),this.near=s,this.far=l,this.camera=null,this.layers=new Cm,this.params={Mesh:{},Line:{threshold:1},LOD:{},Points:{threshold:1},Sprite:{}}}set(e,i){this.ray.set(e,i)}setFromCamera(e,i){i.isPerspectiveCamera?(this.ray.origin.setFromMatrixPosition(i.matrixWorld),this.ray.direction.set(e.x,e.y,.5).unproject(i).sub(this.ray.origin).normalize(),this.camera=i):i.isOrthographicCamera?(this.ray.origin.set(e.x,e.y,i.projectionMatrix.elements[14]).unproject(i),this.ray.direction.set(0,0,-1).transformDirection(i.matrixWorld),this.camera=i):je("Raycaster: Unsupported camera type: "+i.type)}setFromXRController(e){return Nx.identity().extractRotation(e.matrixWorld),this.ray.origin.setFromMatrixPosition(e.matrixWorld),this.ray.direction.set(0,0,-1).applyMatrix4(Nx),this}intersectObject(e,i=!0,s=[]){return dm(e,this,s,i),s.sort(Dx),s}intersectObjects(e,i=!0,s=[]){for(let l=0,f=e.length;l<f;l++)dm(e[l],this,s,i);return s.sort(Dx),s}}function Dx(o,e){return o.distance-e.distance}function dm(o,e,i,s){let l=!0;if(o.layers.test(e.layers)&&o.raycast(e,i)===!1&&(l=!1),l===!0&&s===!0){const f=o.children;for(let h=0,d=f.length;h<d;h++)dm(f[h],e,i,!0)}}class Ux{constructor(e=1,i=0,s=0){this.radius=e,this.phi=i,this.theta=s}set(e,i,s){return this.radius=e,this.phi=i,this.theta=s,this}copy(e){return this.radius=e.radius,this.phi=e.phi,this.theta=e.theta,this}makeSafe(){return this.phi=He(this.phi,1e-6,Math.PI-1e-6),this}setFromVector3(e){return this.setFromCartesianCoords(e.x,e.y,e.z)}setFromCartesianCoords(e,i,s){return this.radius=Math.sqrt(e*e+i*i+s*s),this.radius===0?(this.theta=0,this.phi=0):(this.theta=Math.atan2(e,s),this.phi=Math.acos(He(i/this.radius,-1,1))),this}clone(){return new this.constructor().copy(this)}}const Xm=class Xm{constructor(e,i,s,l){this.elements=[1,0,0,1],e!==void 0&&this.set(e,i,s,l)}identity(){return this.set(1,0,0,1),this}fromArray(e,i=0){for(let s=0;s<4;s++)this.elements[s]=e[s+i];return this}set(e,i,s,l){const f=this.elements;return f[0]=e,f[2]=i,f[1]=s,f[3]=l,this}};Xm.prototype.isMatrix2=!0;let Lx=Xm;class uT extends US{constructor(e=10,i=10,s=4473924,l=8947848){s=new Ie(s),l=new Ie(l);const f=i/2,h=e/i,d=e/2,m=[],p=[];for(let g=0,M=0,A=-d;g<=i;g++,A+=h){m.push(-d,0,A,d,0,A),m.push(A,0,-d,A,0,d);const C=g===f?s:l;C.toArray(p,M),M+=3,C.toArray(p,M),M+=3,C.toArray(p,M),M+=3,C.toArray(p,M),M+=3}const x=new bi;x.setAttribute("position",new Pn(m,3)),x.setAttribute("color",new Pn(p,3));const v=new Um({vertexColors:!0,toneMapped:!1});super(x,v),this.type="GridHelper"}dispose(){super.dispose(),this.geometry.dispose(),this.material.dispose()}}class fT extends nr{constructor(e,i=null){super(),this.object=e,this.domElement=i,this.enabled=!0,this.state=-1,this.keys={},this.mouseButtons={LEFT:null,MIDDLE:null,RIGHT:null},this.touches={ONE:null,TWO:null}}connect(e){this.domElement!==null&&this.disconnect(),this.domElement=e}disconnect(){}dispose(){}update(){}}function Ox(o,e,i,s){const l=hT(s);switch(i){case bS:return o*e;case AS:return o*e/l.components*l.byteLength;case Em:return o*e/l.components*l.byteLength;case Pr:return o*e*2/l.components*l.byteLength;case bm:return o*e*2/l.components*l.byteLength;case TS:return o*e*3/l.components*l.byteLength;case _a:return o*e*4/l.components*l.byteLength;case Tm:return o*e*4/l.components*l.byteLength;case Ju:case $u:return Math.floor((o+3)/4)*Math.floor((e+3)/4)*8;case tf:case ef:return Math.floor((o+3)/4)*Math.floor((e+3)/4)*16;case Ip:case Bp:return Math.max(o,16)*Math.max(e,8)/4;case Pp:case zp:return Math.max(o,8)*Math.max(e,8)/2;case Fp:case Hp:case Vp:case kp:return Math.floor((o+3)/4)*Math.floor((e+3)/4)*8;case Gp:case af:case Xp:return Math.floor((o+3)/4)*Math.floor((e+3)/4)*16;case Wp:return Math.floor((o+3)/4)*Math.floor((e+3)/4)*16;case Yp:return Math.floor((o+4)/5)*Math.floor((e+3)/4)*16;case qp:return Math.floor((o+4)/5)*Math.floor((e+4)/5)*16;case jp:return Math.floor((o+5)/6)*Math.floor((e+4)/5)*16;case Zp:return Math.floor((o+5)/6)*Math.floor((e+5)/6)*16;case Kp:return Math.floor((o+7)/8)*Math.floor((e+4)/5)*16;case Qp:return Math.floor((o+7)/8)*Math.floor((e+5)/6)*16;case Jp:return Math.floor((o+7)/8)*Math.floor((e+7)/8)*16;case $p:return Math.floor((o+9)/10)*Math.floor((e+4)/5)*16;case tm:return Math.floor((o+9)/10)*Math.floor((e+5)/6)*16;case em:return Math.floor((o+9)/10)*Math.floor((e+7)/8)*16;case nm:return Math.floor((o+9)/10)*Math.floor((e+9)/10)*16;case im:return Math.floor((o+11)/12)*Math.floor((e+9)/10)*16;case am:return Math.floor((o+11)/12)*Math.floor((e+11)/12)*16;case sm:case rm:case om:return Math.ceil(o/4)*Math.ceil(e/4)*16;case lm:case cm:return Math.ceil(o/4)*Math.ceil(e/4)*8;case sf:case um:return Math.ceil(o/4)*Math.ceil(e/4)*16}throw new Error(`Unable to determine texture byte length for ${i} format.`)}function hT(o){switch(o){case Vi:case SS:return{byteLength:1,components:1};case Jl:case yS:case Va:return{byteLength:2,components:1};case ym:case Mm:return{byteLength:2,components:4};case Ga:case Sm:case Ba:return{byteLength:4,components:1};case MS:case ES:return{byteLength:4,components:3}}throw new Error(`THREE.TextureUtils: Unknown texture type ${o}.`)}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:xm}}));typeof window<"u"&&(window.__THREE__?ge("WARNING: Multiple instances of Three.js being imported."):window.__THREE__=xm);function BS(){let o=null,e=!1,i=null,s=null;function l(f,h){s=o.requestAnimationFrame(l),i(f,h)}return{start:function(){e!==!0&&i!==null&&o!==null&&(s=o.requestAnimationFrame(l),e=!0)},stop:function(){o!==null&&o.cancelAnimationFrame(s),e=!1},setAnimationLoop:function(f){i=f},setContext:function(f){o=f}}}function dT(o){const e=new WeakMap;function i(d,m){const p=d.array,x=d.usage,v=p.byteLength,g=o.createBuffer();o.bindBuffer(m,g),o.bufferData(m,p,x),d.onUploadCallback();let M;if(p instanceof Float32Array)M=o.FLOAT;else if(typeof Float16Array<"u"&&p instanceof Float16Array)M=o.HALF_FLOAT;else if(p instanceof Uint16Array)d.isFloat16BufferAttribute?M=o.HALF_FLOAT:M=o.UNSIGNED_SHORT;else if(p instanceof Int16Array)M=o.SHORT;else if(p instanceof Uint32Array)M=o.UNSIGNED_INT;else if(p instanceof Int32Array)M=o.INT;else if(p instanceof Int8Array)M=o.BYTE;else if(p instanceof Uint8Array)M=o.UNSIGNED_BYTE;else if(p instanceof Uint8ClampedArray)M=o.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+p);return{buffer:g,type:M,bytesPerElement:p.BYTES_PER_ELEMENT,version:d.version,size:v}}function s(d,m,p){const x=m.array,v=m.updateRanges;if(o.bindBuffer(p,d),v.length===0)o.bufferSubData(p,0,x);else{v.sort((M,A)=>M.start-A.start);let g=0;for(let M=1;M<v.length;M++){const A=v[g],C=v[M];C.start<=A.start+A.count+1?A.count=Math.max(A.count,C.start+C.count-A.start):(++g,v[g]=C)}v.length=g+1;for(let M=0,A=v.length;M<A;M++){const C=v[M];o.bufferSubData(p,C.start*x.BYTES_PER_ELEMENT,x,C.start,C.count)}m.clearUpdateRanges()}m.onUploadCallback()}function l(d){return d.isInterleavedBufferAttribute&&(d=d.data),e.get(d)}function f(d){d.isInterleavedBufferAttribute&&(d=d.data);const m=e.get(d);m&&(o.deleteBuffer(m.buffer),e.delete(d))}function h(d,m){if(d.isInterleavedBufferAttribute&&(d=d.data),d.isGLBufferAttribute){const x=e.get(d);(!x||x.version<d.version)&&e.set(d,{buffer:d.buffer,type:d.type,bytesPerElement:d.elementSize,version:d.version});return}const p=e.get(d);if(p===void 0)e.set(d,i(d,m));else if(p.version<d.version){if(p.size!==d.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");s(p.buffer,d,m),p.version=d.version}}return{get:l,remove:f,update:h}}var pT=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,mT=`#ifdef USE_ALPHAHASH
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
#endif`,gT=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,_T=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,vT=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,xT=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,ST=`#ifdef USE_AOMAP
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
#endif`,yT=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,MT=`#ifdef USE_BATCHING
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
#endif`,ET=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,bT=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,TT=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,AT=`float G_BlinnPhong_Implicit( ) {
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
} // validated`,RT=`#ifdef USE_IRIDESCENCE
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
#endif`,wT=`#ifdef USE_BUMPMAP
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
#endif`,CT=`#if NUM_CLIPPING_PLANES > 0
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
#endif`,NT=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,DT=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,UT=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,LT=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#endif`,OT=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#endif`,PT=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec4 vColor;
#endif`,IT=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
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
#endif`,zT=`#define PI 3.141592653589793
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
} // validated`,BT=`#ifdef ENVMAP_TYPE_CUBE_UV
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
#endif`,FT=`vec3 transformedNormal = objectNormal;
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
#endif`,HT=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,GT=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,VT=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,kT=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,XT="gl_FragColor = linearToOutputTexel( gl_FragColor );",WT=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,YT=`#ifdef USE_ENVMAP
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
#endif`,qT=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
#endif`,jT=`#ifdef USE_ENVMAP
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
#endif`,ZT=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,KT=`#ifdef USE_ENVMAP
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
#endif`,QT=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,JT=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,$T=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,t1=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,e1=`#ifdef USE_GRADIENTMAP
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
}`,n1=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,i1=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,a1=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,s1=`uniform bool receiveShadow;
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
#include <lightprobes_pars_fragment>`,r1=`#ifdef USE_ENVMAP
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
#endif`,o1=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,l1=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,c1=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,u1=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,f1=`PhysicalMaterial material;
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
#endif`,h1=`uniform sampler2D dfgLUT;
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
}`,d1=`
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
#endif`,p1=`#if defined( RE_IndirectDiffuse )
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
#endif`,m1=`#if defined( RE_IndirectDiffuse )
	#if defined( LAMBERT ) || defined( PHONG )
		irradiance += iblIrradiance;
	#endif
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,g1=`#ifdef USE_LIGHT_PROBES_GRID
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
#endif`,_1=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,v1=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,x1=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,S1=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,y1=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,M1=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,E1=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
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
#endif`,b1=`#if defined( USE_POINTS_UV )
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
#endif`,T1=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,A1=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,R1=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,w1=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,C1=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,N1=`#ifdef USE_MORPHTARGETS
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
#endif`,D1=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,U1=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
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
vec3 nonPerturbedNormal = normal;`,L1=`#ifdef USE_NORMALMAP_OBJECTSPACE
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
#endif`,O1=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,P1=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,I1=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
		#ifdef FLIP_SIDED
			vBitangent = - vBitangent;
		#endif
	#endif
#endif`,z1=`#ifdef USE_NORMALMAP
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
#endif`,B1=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,F1=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,H1=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,G1=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,V1=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,k1=`vec3 packNormalToRGB( const in vec3 normal ) {
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
}`,X1=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,W1=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,Y1=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,q1=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,j1=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,Z1=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,K1=`#if NUM_SPOT_LIGHT_COORDS > 0
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
#endif`,Q1=`#if NUM_SPOT_LIGHT_COORDS > 0
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
#endif`,J1=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_SUN_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
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
#endif`,$1=`float getShadowMask() {
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
}`,tA=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,eA=`#ifdef USE_SKINNING
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
#endif`,nA=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,iA=`#ifdef USE_SKINNING
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
#endif`,aA=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,sA=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,rA=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,oA=`#ifndef saturate
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
vec3 CustomToneMapping( vec3 color ) { return color; }`,lA=`#ifdef USE_TRANSMISSION
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
#endif`,cA=`#ifdef USE_TRANSMISSION
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
#endif`,uA=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,fA=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,hA=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,dA=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`;const pA=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,mA=`uniform sampler2D t2D;
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
}`,gA=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,_A=`#ifdef ENVMAP_TYPE_CUBE
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
}`,vA=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,xA=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,SA=`#include <common>
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
}`,yA=`#if DEPTH_PACKING == 3200
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
}`,MA=`#define DISTANCE
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
}`,EA=`#define DISTANCE
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
}`,bA=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,TA=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,AA=`uniform float scale;
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
}`,RA=`uniform vec3 diffuse;
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
}`,wA=`#include <common>
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
}`,CA=`uniform vec3 diffuse;
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
}`,NA=`#define LAMBERT
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
}`,DA=`#define LAMBERT
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
}`,UA=`#define MATCAP
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
}`,LA=`#define MATCAP
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
}`,OA=`#define NORMAL
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
}`,PA=`#define NORMAL
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
}`,IA=`#define PHONG
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
}`,zA=`#define PHONG
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
}`,BA=`#define STANDARD
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
}`,FA=`#define STANDARD
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
}`,HA=`#define TOON
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
}`,GA=`#define TOON
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
}`,VA=`uniform float size;
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
}`,kA=`uniform vec3 diffuse;
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
}`,XA=`#include <common>
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
}`,WA=`uniform vec3 color;
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
}`,YA=`uniform float rotation;
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
}`,qA=`uniform vec3 diffuse;
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
}`,De={alphahash_fragment:pT,alphahash_pars_fragment:mT,alphamap_fragment:gT,alphamap_pars_fragment:_T,alphatest_fragment:vT,alphatest_pars_fragment:xT,aomap_fragment:ST,aomap_pars_fragment:yT,batching_pars_vertex:MT,batching_vertex:ET,begin_vertex:bT,beginnormal_vertex:TT,bsdfs:AT,iridescence_fragment:RT,bumpmap_pars_fragment:wT,clipping_planes_fragment:CT,clipping_planes_pars_fragment:NT,clipping_planes_pars_vertex:DT,clipping_planes_vertex:UT,color_fragment:LT,color_pars_fragment:OT,color_pars_vertex:PT,color_vertex:IT,common:zT,cube_uv_reflection_fragment:BT,defaultnormal_vertex:FT,displacementmap_pars_vertex:HT,displacementmap_vertex:GT,emissivemap_fragment:VT,emissivemap_pars_fragment:kT,colorspace_fragment:XT,colorspace_pars_fragment:WT,envmap_fragment:YT,envmap_common_pars_fragment:qT,envmap_pars_fragment:jT,envmap_pars_vertex:ZT,envmap_physical_pars_fragment:r1,envmap_vertex:KT,fog_vertex:QT,fog_pars_vertex:JT,fog_fragment:$T,fog_pars_fragment:t1,gradientmap_pars_fragment:e1,lightmap_pars_fragment:n1,lights_lambert_fragment:i1,lights_lambert_pars_fragment:a1,lights_pars_begin:s1,lights_toon_fragment:o1,lights_toon_pars_fragment:l1,lights_phong_fragment:c1,lights_phong_pars_fragment:u1,lights_physical_fragment:f1,lights_physical_pars_fragment:h1,lights_fragment_begin:d1,lights_fragment_maps:p1,lights_fragment_end:m1,lightprobes_pars_fragment:g1,logdepthbuf_fragment:_1,logdepthbuf_pars_fragment:v1,logdepthbuf_pars_vertex:x1,logdepthbuf_vertex:S1,map_fragment:y1,map_pars_fragment:M1,map_particle_fragment:E1,map_particle_pars_fragment:b1,metalnessmap_fragment:T1,metalnessmap_pars_fragment:A1,morphinstance_vertex:R1,morphcolor_vertex:w1,morphnormal_vertex:C1,morphtarget_pars_vertex:N1,morphtarget_vertex:D1,normal_fragment_begin:U1,normal_fragment_maps:L1,normal_pars_fragment:O1,normal_pars_vertex:P1,normal_vertex:I1,normalmap_pars_fragment:z1,clearcoat_normal_fragment_begin:B1,clearcoat_normal_fragment_maps:F1,clearcoat_pars_fragment:H1,iridescence_pars_fragment:G1,opaque_fragment:V1,packing:k1,premultiplied_alpha_fragment:X1,project_vertex:W1,dithering_fragment:Y1,dithering_pars_fragment:q1,roughnessmap_fragment:j1,roughnessmap_pars_fragment:Z1,shadowmap_pars_fragment:K1,shadowmap_pars_vertex:Q1,shadowmap_vertex:J1,shadowmask_pars_fragment:$1,skinbase_vertex:tA,skinning_pars_vertex:eA,skinning_vertex:nA,skinnormal_vertex:iA,specularmap_fragment:aA,specularmap_pars_fragment:sA,tonemapping_fragment:rA,tonemapping_pars_fragment:oA,transmission_fragment:lA,transmission_pars_fragment:cA,uv_pars_fragment:uA,uv_pars_vertex:fA,uv_vertex:hA,worldpos_vertex:dA,background_vert:pA,background_frag:mA,backgroundCube_vert:gA,backgroundCube_frag:_A,cube_vert:vA,cube_frag:xA,depth_vert:SA,depth_frag:yA,distance_vert:MA,distance_frag:EA,equirect_vert:bA,equirect_frag:TA,linedashed_vert:AA,linedashed_frag:RA,meshbasic_vert:wA,meshbasic_frag:CA,meshlambert_vert:NA,meshlambert_frag:DA,meshmatcap_vert:UA,meshmatcap_frag:LA,meshnormal_vert:OA,meshnormal_frag:PA,meshphong_vert:IA,meshphong_frag:zA,meshphysical_vert:BA,meshphysical_frag:FA,meshtoon_vert:HA,meshtoon_frag:GA,points_vert:VA,points_frag:kA,shadow_vert:XA,shadow_frag:WA,sprite_vert:YA,sprite_frag:qA},Zt={common:{diffuse:{value:new Ie(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new be},alphaMap:{value:null},alphaMapTransform:{value:new be},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new be}},envmap:{envMap:{value:null},envMapRotation:{value:new be},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98},dfgLUT:{value:null}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new be}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new be}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new be},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new be},normalScale:{value:new _e(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new be},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new be}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new be}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new be}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new Ie(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},sunLights:{value:[],properties:{direction:{},color:{}}},sunLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},sunShadowMatrix:{value:[]},sunShadowCascade:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null},probesSH:{value:null},probesMin:{value:new X},probesMax:{value:new X},probesResolution:{value:new X}},points:{diffuse:{value:new Ie(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new be},alphaTest:{value:0},uvTransform:{value:new be}},sprite:{diffuse:{value:new Ie(16777215)},opacity:{value:1},center:{value:new _e(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new be},alphaMap:{value:null},alphaMapTransform:{value:new be},alphaTest:{value:0}}},za={basic:{uniforms:hi([Zt.common,Zt.specularmap,Zt.envmap,Zt.aomap,Zt.lightmap,Zt.fog]),vertexShader:De.meshbasic_vert,fragmentShader:De.meshbasic_frag},lambert:{uniforms:hi([Zt.common,Zt.specularmap,Zt.envmap,Zt.aomap,Zt.lightmap,Zt.emissivemap,Zt.bumpmap,Zt.normalmap,Zt.displacementmap,Zt.fog,Zt.lights,{emissive:{value:new Ie(0)},envMapIntensity:{value:1}}]),vertexShader:De.meshlambert_vert,fragmentShader:De.meshlambert_frag},phong:{uniforms:hi([Zt.common,Zt.specularmap,Zt.envmap,Zt.aomap,Zt.lightmap,Zt.emissivemap,Zt.bumpmap,Zt.normalmap,Zt.displacementmap,Zt.fog,Zt.lights,{emissive:{value:new Ie(0)},specular:{value:new Ie(1118481)},shininess:{value:30},envMapIntensity:{value:1}}]),vertexShader:De.meshphong_vert,fragmentShader:De.meshphong_frag},standard:{uniforms:hi([Zt.common,Zt.envmap,Zt.aomap,Zt.lightmap,Zt.emissivemap,Zt.bumpmap,Zt.normalmap,Zt.displacementmap,Zt.roughnessmap,Zt.metalnessmap,Zt.fog,Zt.lights,{emissive:{value:new Ie(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:De.meshphysical_vert,fragmentShader:De.meshphysical_frag},toon:{uniforms:hi([Zt.common,Zt.aomap,Zt.lightmap,Zt.emissivemap,Zt.bumpmap,Zt.normalmap,Zt.displacementmap,Zt.gradientmap,Zt.fog,Zt.lights,{emissive:{value:new Ie(0)}}]),vertexShader:De.meshtoon_vert,fragmentShader:De.meshtoon_frag},matcap:{uniforms:hi([Zt.common,Zt.bumpmap,Zt.normalmap,Zt.displacementmap,Zt.fog,{matcap:{value:null}}]),vertexShader:De.meshmatcap_vert,fragmentShader:De.meshmatcap_frag},points:{uniforms:hi([Zt.points,Zt.fog]),vertexShader:De.points_vert,fragmentShader:De.points_frag},dashed:{uniforms:hi([Zt.common,Zt.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:De.linedashed_vert,fragmentShader:De.linedashed_frag},depth:{uniforms:hi([Zt.common,Zt.displacementmap]),vertexShader:De.depth_vert,fragmentShader:De.depth_frag},normal:{uniforms:hi([Zt.common,Zt.bumpmap,Zt.normalmap,Zt.displacementmap,{opacity:{value:1}}]),vertexShader:De.meshnormal_vert,fragmentShader:De.meshnormal_frag},sprite:{uniforms:hi([Zt.sprite,Zt.fog]),vertexShader:De.sprite_vert,fragmentShader:De.sprite_frag},background:{uniforms:{uvTransform:{value:new be},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:De.background_vert,fragmentShader:De.background_frag},backgroundCube:{uniforms:{envMap:{value:null},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new be}},vertexShader:De.backgroundCube_vert,fragmentShader:De.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:De.cube_vert,fragmentShader:De.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:De.equirect_vert,fragmentShader:De.equirect_frag},distance:{uniforms:hi([Zt.common,Zt.displacementmap,{referencePosition:{value:new X},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:De.distance_vert,fragmentShader:De.distance_frag},shadow:{uniforms:hi([Zt.lights,Zt.fog,{color:{value:new Ie(0)},opacity:{value:1}}]),vertexShader:De.shadow_vert,fragmentShader:De.shadow_frag}};za.physical={uniforms:hi([za.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new be},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new be},clearcoatNormalScale:{value:new _e(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new be},dispersion:{value:0},retroreflectivity:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new be},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new be},sheen:{value:0},sheenColor:{value:new Ie(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new be},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new be},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new be},transmissionSamplerSize:{value:new _e},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new be},attenuationDistance:{value:0},attenuationColor:{value:new Ie(0)},specularColor:{value:new Ie(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new be},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new be},anisotropyVector:{value:new _e},anisotropyMap:{value:null},anisotropyMapTransform:{value:new be}}]),vertexShader:De.meshphysical_vert,fragmentShader:De.meshphysical_frag};const Zu={r:0,b:0,g:0},jA=new gn,FS=new be;FS.set(-1,0,0,0,1,0,0,0,1);function ZA(o,e,i,s,l,f){const h=new Ie(0);let d=l===!0?0:1,m,p,x=null,v=0,g=null;function M(U){let F=U.isScene===!0?U.background:null;if(F&&F.isTexture){const N=U.backgroundBlurriness>0;F=e.get(F,N)}return F}function A(U){let F=!1;const N=M(U);N===null?y(h,d):N&&N.isColor&&(y(N,1),F=!0);const L=o.xr.getEnvironmentBlendMode();L==="additive"?i.buffers.color.setClear(0,0,0,1,f):L==="alpha-blend"&&i.buffers.color.setClear(0,0,0,0,f),(o.autoClear||F)&&(i.buffers.depth.setTest(!0),i.buffers.depth.setMask(!0),i.buffers.color.setMask(!0),o.clear(o.autoClearColor,o.autoClearDepth,o.autoClearStencil))}function C(U,F){const N=M(F);N&&(N.isCubeTexture||N.mapping===df)?(p===void 0&&(p=new Me(new On(1,1,1),new ka({name:"BackgroundCubeMaterial",uniforms:ko(za.backgroundCube.uniforms),vertexShader:za.backgroundCube.vertexShader,fragmentShader:za.backgroundCube.fragmentShader,side:Ei,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),p.geometry.deleteAttribute("normal"),p.geometry.deleteAttribute("uv"),p.onBeforeRender=function(L,D,I){this.matrixWorld.copyPosition(I.matrixWorld)},Object.defineProperty(p.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),s.update(p)),p.material.uniforms.envMap.value=N,p.material.uniforms.backgroundBlurriness.value=F.backgroundBlurriness,p.material.uniforms.backgroundIntensity.value=F.backgroundIntensity,p.material.uniforms.backgroundRotation.value.setFromMatrix4(jA.makeRotationFromEuler(F.backgroundRotation)).transpose(),N.isCubeTexture&&N.isRenderTargetTexture===!1&&p.material.uniforms.backgroundRotation.value.premultiply(FS),p.material.toneMapped=Xe.getTransfer(N.colorSpace)!==sn,(x!==N||v!==N.version||g!==o.toneMapping)&&(p.material.needsUpdate=!0,x=N,v=N.version,g=o.toneMapping),p.layers.enableAll(),U.unshift(p,p.geometry,p.material,0,0,null)):N&&N.isTexture&&(m===void 0&&(m=new Me(new sc(2,2),new ka({name:"BackgroundMaterial",uniforms:ko(za.background.uniforms),vertexShader:za.background.vertexShader,fragmentShader:za.background.fragmentShader,side:Lr,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),m.geometry.deleteAttribute("normal"),Object.defineProperty(m.material,"map",{get:function(){return this.uniforms.t2D.value}}),s.update(m)),m.material.uniforms.t2D.value=N,m.material.uniforms.backgroundIntensity.value=F.backgroundIntensity,m.material.toneMapped=Xe.getTransfer(N.colorSpace)!==sn,N.matrixAutoUpdate===!0&&N.updateMatrix(),m.material.uniforms.uvTransform.value.copy(N.matrix),(x!==N||v!==N.version||g!==o.toneMapping)&&(m.material.needsUpdate=!0,x=N,v=N.version,g=o.toneMapping),m.layers.enableAll(),U.unshift(m,m.geometry,m.material,0,0,null))}function y(U,F){U.getRGB(Zu,PS(o)),i.buffers.color.setClear(Zu.r,Zu.g,Zu.b,F,f)}function S(){p!==void 0&&(p.geometry.dispose(),p.material.dispose(),p=void 0),m!==void 0&&(m.geometry.dispose(),m.material.dispose(),m=void 0)}return{getClearColor:function(){return h},setClearColor:function(U,F=1){h.set(U),d=F,y(h,d)},getClearAlpha:function(){return d},setClearAlpha:function(U){d=U,y(h,d)},render:A,addToRenderList:C,dispose:S}}function KA(o,e){const i=o.getParameter(o.MAX_VERTEX_ATTRIBS),s={},l=g(null);let f=l,h=!1;function d(Y,J,rt,j,et){let q=!1;const Z=v(Y,j,rt,J);f!==Z&&(f=Z,p(f.object)),q=M(Y,j,rt,et),q&&A(Y,j,rt,et),et!==null&&e.update(et,o.ELEMENT_ARRAY_BUFFER),(q||h)&&(h=!1,N(Y,J,rt,j),et!==null&&o.bindBuffer(o.ELEMENT_ARRAY_BUFFER,e.get(et).buffer))}function m(){return o.createVertexArray()}function p(Y){return o.bindVertexArray(Y)}function x(Y){return o.deleteVertexArray(Y)}function v(Y,J,rt,j){const et=j.wireframe===!0;let q=s[J.id];q===void 0&&(q={},s[J.id]=q);const Z=Y.isInstancedMesh===!0?Y.id:0;let ht=q[Z];ht===void 0&&(ht={},q[Z]=ht);let ct=ht[rt.id];ct===void 0&&(ct={},ht[rt.id]=ct);let gt=ct[et];return gt===void 0&&(gt=g(m()),ct[et]=gt),gt}function g(Y){const J=[],rt=[],j=[];for(let et=0;et<i;et++)J[et]=0,rt[et]=0,j[et]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:J,enabledAttributes:rt,attributeDivisors:j,object:Y,attributes:{},index:null}}function M(Y,J,rt,j){const et=f.attributes,q=J.attributes;let Z=0;const ht=rt.getAttributes();for(const ct in ht)if(ht[ct].location>=0){const vt=et[ct];let ie=q[ct];if(ie===void 0&&(ct==="instanceMatrix"&&Y.instanceMatrix&&(ie=Y.instanceMatrix),ct==="instanceColor"&&Y.instanceColor&&(ie=Y.instanceColor)),vt===void 0||vt.attribute!==ie||ie&&vt.data!==ie.data)return!0;Z++}return f.attributesNum!==Z||f.index!==j}function A(Y,J,rt,j){const et={},q=J.attributes;let Z=0;const ht=rt.getAttributes();for(const ct in ht)if(ht[ct].location>=0){let vt=q[ct];vt===void 0&&(ct==="instanceMatrix"&&Y.instanceMatrix&&(vt=Y.instanceMatrix),ct==="instanceColor"&&Y.instanceColor&&(vt=Y.instanceColor));const ie={};ie.attribute=vt,vt&&vt.data&&(ie.data=vt.data),et[ct]=ie,Z++}f.attributes=et,f.attributesNum=Z,f.index=j}function C(){const Y=f.newAttributes;for(let J=0,rt=Y.length;J<rt;J++)Y[J]=0}function y(Y){S(Y,0)}function S(Y,J){const rt=f.newAttributes,j=f.enabledAttributes,et=f.attributeDivisors;rt[Y]=1,j[Y]===0&&(o.enableVertexAttribArray(Y),j[Y]=1),et[Y]!==J&&(o.vertexAttribDivisor(Y,J),et[Y]=J)}function U(){const Y=f.newAttributes,J=f.enabledAttributes;for(let rt=0,j=J.length;rt<j;rt++)J[rt]!==Y[rt]&&(o.disableVertexAttribArray(rt),J[rt]=0)}function F(Y,J,rt,j,et,q,Z){Z===!0?o.vertexAttribIPointer(Y,J,rt,et,q):o.vertexAttribPointer(Y,J,rt,j,et,q)}function N(Y,J,rt,j){C();const et=j.attributes,q=rt.getAttributes(),Z=J.defaultAttributeValues;for(const ht in q){const ct=q[ht];if(ct.location>=0){let gt=et[ht];if(gt===void 0&&(ht==="instanceMatrix"&&Y.instanceMatrix&&(gt=Y.instanceMatrix),ht==="instanceColor"&&Y.instanceColor&&(gt=Y.instanceColor)),gt!==void 0){const vt=gt.normalized,ie=gt.itemSize,ne=e.get(gt);if(ne===void 0)continue;const B=ne.buffer,xt=ne.type,Nt=ne.bytesPerElement,Q=xt===o.INT||xt===o.UNSIGNED_INT||gt.gpuType===Sm;if(gt.isInterleavedBufferAttribute){const dt=gt.data,Dt=dt.stride,Wt=gt.offset;if(dt.isInstancedInterleavedBuffer){for(let Mt=0;Mt<ct.locationSize;Mt++)S(ct.location+Mt,dt.meshPerAttribute);Y.isInstancedMesh!==!0&&j._maxInstanceCount===void 0&&(j._maxInstanceCount=dt.meshPerAttribute*dt.count)}else for(let Mt=0;Mt<ct.locationSize;Mt++)y(ct.location+Mt);o.bindBuffer(o.ARRAY_BUFFER,B);for(let Mt=0;Mt<ct.locationSize;Mt++)F(ct.location+Mt,ie/ct.locationSize,xt,vt,Dt*Nt,(Wt+ie/ct.locationSize*Mt)*Nt,Q)}else{if(gt.isInstancedBufferAttribute){for(let dt=0;dt<ct.locationSize;dt++)S(ct.location+dt,gt.meshPerAttribute);Y.isInstancedMesh!==!0&&j._maxInstanceCount===void 0&&(j._maxInstanceCount=gt.meshPerAttribute*gt.count)}else for(let dt=0;dt<ct.locationSize;dt++)y(ct.location+dt);o.bindBuffer(o.ARRAY_BUFFER,B);for(let dt=0;dt<ct.locationSize;dt++)F(ct.location+dt,ie/ct.locationSize,xt,vt,ie*Nt,ie/ct.locationSize*dt*Nt,Q)}}else if(Z!==void 0){const vt=Z[ht];if(vt!==void 0)switch(vt.length){case 2:o.vertexAttrib2fv(ct.location,vt);break;case 3:o.vertexAttrib3fv(ct.location,vt);break;case 4:o.vertexAttrib4fv(ct.location,vt);break;default:o.vertexAttrib1fv(ct.location,vt)}}}}U()}function L(){O();for(const Y in s){const J=s[Y];for(const rt in J){const j=J[rt];for(const et in j){const q=j[et];for(const Z in q)x(q[Z].object),delete q[Z];delete j[et]}}delete s[Y]}}function D(Y){if(s[Y.id]===void 0)return;const J=s[Y.id];for(const rt in J){const j=J[rt];for(const et in j){const q=j[et];for(const Z in q)x(q[Z].object),delete q[Z];delete j[et]}}delete s[Y.id]}function I(Y){for(const J in s){const rt=s[J];for(const j in rt){const et=rt[j];if(et[Y.id]===void 0)continue;const q=et[Y.id];for(const Z in q)x(q[Z].object),delete q[Z];delete et[Y.id]}}}function T(Y){for(const J in s){const rt=s[J],j=Y.isInstancedMesh===!0?Y.id:0,et=rt[j];if(et!==void 0){for(const q in et){const Z=et[q];for(const ht in Z)x(Z[ht].object),delete Z[ht];delete et[q]}delete rt[j],Object.keys(rt).length===0&&delete s[J]}}}function O(){V(),h=!0,f!==l&&(f=l,p(f.object))}function V(){l.geometry=null,l.program=null,l.wireframe=!1}return{setup:d,reset:O,resetDefaultState:V,dispose:L,releaseStatesOfGeometry:D,releaseStatesOfObject:T,releaseStatesOfProgram:I,initAttributes:C,enableAttribute:y,disableUnusedAttributes:U}}function QA(o,e,i){let s;function l(m){s=m}function f(m,p){o.drawArrays(s,m,p),i.update(p,s,1)}function h(m,p,x){x!==0&&(o.drawArraysInstanced(s,m,p,x),i.update(p,s,x))}function d(m,p,x){if(x===0)return;e.get("WEBGL_multi_draw").multiDrawArraysWEBGL(s,m,0,p,0,x);let g=0;for(let M=0;M<x;M++)g+=p[M];i.update(g,s,1)}this.setMode=l,this.render=f,this.renderInstances=h,this.renderMultiDraw=d}function JA(o,e,i,s){let l;function f(){if(l!==void 0)return l;if(e.has("EXT_texture_filter_anisotropic")===!0){const I=e.get("EXT_texture_filter_anisotropic");l=o.getParameter(I.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else l=0;return l}function h(I){return!(I!==_a&&s.convert(I)!==o.getParameter(o.IMPLEMENTATION_COLOR_READ_FORMAT))}function d(I){const T=I===Va&&(e.has("EXT_color_buffer_half_float")||e.has("EXT_color_buffer_float"));return!(I!==Vi&&I!==Ba&&!T&&s.convert(I)!==o.getParameter(o.IMPLEMENTATION_COLOR_READ_TYPE))}function m(I){if(I==="highp"){if(o.getShaderPrecisionFormat(o.VERTEX_SHADER,o.HIGH_FLOAT).precision>0&&o.getShaderPrecisionFormat(o.FRAGMENT_SHADER,o.HIGH_FLOAT).precision>0)return"highp";I="mediump"}return I==="mediump"&&o.getShaderPrecisionFormat(o.VERTEX_SHADER,o.MEDIUM_FLOAT).precision>0&&o.getShaderPrecisionFormat(o.FRAGMENT_SHADER,o.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let p=i.precision!==void 0?i.precision:"highp";const x=m(p);x!==p&&(ge("WebGLRenderer:",p,"not supported, using",x,"instead."),p=x);const v=i.logarithmicDepthBuffer===!0,g=i.reversedDepthBuffer===!0&&e.has("EXT_clip_control");i.reversedDepthBuffer===!0&&g===!1&&ge("WebGLRenderer: Unable to use reversed depth buffer due to missing EXT_clip_control extension. Fallback to default depth buffer.");const M=o.getParameter(o.MAX_TEXTURE_IMAGE_UNITS),A=o.getParameter(o.MAX_VERTEX_TEXTURE_IMAGE_UNITS),C=o.getParameter(o.MAX_TEXTURE_SIZE),y=o.getParameter(o.MAX_CUBE_MAP_TEXTURE_SIZE),S=o.getParameter(o.MAX_VERTEX_ATTRIBS),U=o.getParameter(o.MAX_VERTEX_UNIFORM_VECTORS),F=o.getParameter(o.MAX_VARYING_VECTORS),N=o.getParameter(o.MAX_FRAGMENT_UNIFORM_VECTORS),L=o.getParameter(o.MAX_SAMPLES),D=o.getParameter(o.SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:f,getMaxPrecision:m,textureFormatReadable:h,textureTypeReadable:d,precision:p,logarithmicDepthBuffer:v,reversedDepthBuffer:g,maxTextures:M,maxVertexTextures:A,maxTextureSize:C,maxCubemapSize:y,maxAttributes:S,maxVertexUniforms:U,maxVaryings:F,maxFragmentUniforms:N,maxSamples:L,samples:D}}function $A(o){const e=this;let i=null,s=0,l=!1,f=!1;const h=new ds,d=new be,m={value:null,needsUpdate:!1};this.uniform=m,this.numPlanes=0,this.numIntersection=0,this.init=function(v,g){const M=v.length!==0||g||s!==0||l;return l=g,s=v.length,M},this.beginShadows=function(){f=!0,x(null)},this.endShadows=function(){f=!1},this.setGlobalState=function(v,g){i=x(v,g,0)},this.setState=function(v,g,M){const A=v.clippingPlanes,C=v.clipIntersection,y=v.clipShadows,S=o.get(v);if(!l||A===null||A.length===0||f&&!y)f?x(null):p();else{const U=f?0:s,F=U*4;let N=S.clippingState||null;m.value=N,N=x(A,g,F,M);for(let L=0;L!==F;++L)N[L]=i[L];S.clippingState=N,this.numIntersection=C?this.numPlanes:0,this.numPlanes+=U}};function p(){m.value!==i&&(m.value=i,m.needsUpdate=s>0),e.numPlanes=s,e.numIntersection=0}function x(v,g,M,A){const C=v!==null?v.length:0;let y=null;if(C!==0){if(y=m.value,A!==!0||y===null){const S=M+C*4,U=g.matrixWorldInverse;d.getNormalMatrix(U),(y===null||y.length<S)&&(y=new Float32Array(S));for(let F=0,N=M;F!==C;++F,N+=4)h.copy(v[F]).applyMatrix4(U,d),h.normal.toArray(y,N),y[N+3]=h.constant}m.value=y,m.needsUpdate=!0}return e.numPlanes=C,e.numIntersection=0,y}}const Bo=4,tR=6,eR=20,nR=256,kl=new Pm,Px=new Ie;let xp=null,Sp=0,yp=0,Mp=!1;const iR=new X,Nr=new X;class Ix{constructor(e){this._renderer=e,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._sizeLods=[],this._lodMeshes=[],this._backgroundBox=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._blurMaterial=null,this._ggxMaterial=null}fromScene(e,i=0,s=.1,l=100,f={}){const{size:h=256,position:d=iR}=f;xp=this._renderer.getRenderTarget(),Sp=this._renderer.getActiveCubeFace(),yp=this._renderer.getActiveMipmapLevel(),Mp=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(h);const m=this._allocateTargets();return m.depthBuffer=!0,this._sceneToCubeUV(e,s,l,m,d),i>0&&this._blur(m,0,0,i),this._applyPMREM(m),this._cleanup(m),m}fromEquirectangular(e,i=null){return this._fromTexture(e,i)}fromCubemap(e,i=null){return this._fromTexture(e,i)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=Fx(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=Bx(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose(),this._backgroundBox!==null&&(this._backgroundBox.geometry.dispose(),this._backgroundBox.material.dispose())}_setSize(e){this._lodMax=Math.floor(Math.log2(e)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._ggxMaterial!==null&&this._ggxMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let e=0;e<this._lodMeshes.length;e++)this._lodMeshes[e].geometry.dispose()}_cleanup(e){this._renderer.setRenderTarget(xp,Sp,yp),this._renderer.xr.enabled=Mp,e.scissorTest=!1,Po(e,0,0,e.width,e.height)}_fromTexture(e,i){e.mapping===Or||e.mapping===Vo?this._setSize(e.image.length===0?16:e.image[0].width||e.image[0].image.width):this._setSize(e.image.width/4),xp=this._renderer.getRenderTarget(),Sp=this._renderer.getActiveCubeFace(),yp=this._renderer.getActiveMipmapLevel(),Mp=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;const s=i||this._allocateTargets();return this._textureToCubeUV(e,s),this._applyPMREM(s),this._cleanup(s),s}_allocateTargets(){const e=3*Math.max(this._cubeSize,112),i=4*this._cubeSize,s={magFilter:ri,minFilter:ri,generateMipmaps:!1,type:Va,format:_a,colorSpace:rf,depthBuffer:!1},l=zx(e,i,s);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==e||this._pingPongRenderTarget.height!==i){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=zx(e,i,s);const{_lodMax:f}=this;({lodMeshes:this._lodMeshes,sizeLods:this._sizeLods}=aR(f)),this._blurMaterial=rR(f,e,i),this._ggxMaterial=sR(f,e,i)}return l}_compileMaterial(e){const i=new Me(new bi,e);this._renderer.compile(i,kl)}_sceneToCubeUV(e,i,s,l,f){const m=new Hi(90,1,i,s),p=[1,-1,1,1,1,1],x=[1,1,1,-1,-1,-1],v=this._renderer,g=v.autoClear,M=v.toneMapping;v.getClearColor(Px),v.toneMapping=Ha,v.autoClear=!1,v.state.buffers.depth.getReversed()&&(v.setRenderTarget(l),v.clearDepth(),v.setRenderTarget(null)),this._backgroundBox===null&&(this._backgroundBox=new Me(new On,new Kl({name:"PMREM.Background",side:Ei,depthWrite:!1,depthTest:!1})));const C=this._backgroundBox,y=C.material;let S=!1;const U=e.background;U?U.isColor&&(y.color.copy(U),e.background=null,S=!0):(y.color.copy(Px),S=!0);for(let F=0;F<6;F++){const N=F%3;N===0?(m.up.set(0,p[F],0),m.position.set(f.x,f.y,f.z),m.lookAt(f.x+x[F],f.y,f.z)):N===1?(m.up.set(0,0,p[F]),m.position.set(f.x,f.y,f.z),m.lookAt(f.x,f.y+x[F],f.z)):(m.up.set(0,p[F],0),m.position.set(f.x,f.y,f.z),m.lookAt(f.x,f.y,f.z+x[F]));const L=this._cubeSize;Po(l,N*L,F>2?L:0,L,L),v.setRenderTarget(l),S&&v.render(C,m),v.render(e,m)}v.toneMapping=M,v.autoClear=g,e.background=U}_textureToCubeUV(e,i){const s=this._renderer,l=e.mapping===Or||e.mapping===Vo;l?(this._cubemapMaterial===null&&(this._cubemapMaterial=Fx()),this._cubemapMaterial.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=Bx());const f=l?this._cubemapMaterial:this._equirectMaterial,h=this._lodMeshes[0];h.material=f;const d=f.uniforms;d.envMap.value=e;const m=this._cubeSize;Po(i,0,0,3*m,2*m),s.setRenderTarget(i),s.render(h,kl)}_applyPMREM(e){const i=this._renderer,s=i.autoClear;i.autoClear=!1;const l=this._lodMeshes.length;for(let f=1;f<l;f++)this._applyGGXFilter(e,f-1,f);i.autoClear=s}_applyGGXFilter(e,i,s){const l=this._renderer,f=this._pingPongRenderTarget,h=this._ggxMaterial,d=this._lodMeshes[s];d.material=h;const m=h.uniforms,p=s/(this._lodMeshes.length-1),x=i/(this._lodMeshes.length-1),v=Math.sqrt(p*p-x*x),g=p*1.25,M=v*g,{_lodMax:A}=this,C=this._sizeLods[s],y=3*C*(s>A-Bo?s-A+Bo:0),S=4*(this._cubeSize-C);m.envMap.value=e.texture,m.roughness.value=M,m.mipInt.value=A-i,Po(f,y,S,3*C,2*C),l.setRenderTarget(f),l.render(d,kl),m.envMap.value=f.texture,m.roughness.value=0,m.mipInt.value=A-s,Po(e,y,S,3*C,2*C),l.setRenderTarget(e),l.render(d,kl)}_blur(e,i,s,l){const f=this._pingPongRenderTarget,h=Math.min(l,Math.PI)/Math.SQRT2;this._blurPass(e,f,i,s,h),this._blurPass(f,e,s,s,h)}_blurPass(e,i,s,l,f){const h=this._renderer,d=this._blurMaterial,m=this._lodMeshes[l];m.material=d;const p=d.uniforms;p.envMap.value=e.texture,p.sigma.value=f,p.mipInt.value=this._lodMax-s;const x=this._sizeLods[l],v=3*x*(l>this._lodMax-Bo?l-this._lodMax+Bo:0),g=4*(this._cubeSize-x);Po(i,v,g,3*x,2*x),h.setRenderTarget(i),h.render(m,kl)}}function aR(o){const e=[],i=[];let s=o;const l=o-Bo+1+tR;for(let f=0;f<l;f++){const h=Math.pow(2,s);e.push(h);const d=1/(h-2),m=-d,p=1+d,x=[m,m,p,m,p,p,m,m,p,p,m,p],v=6,g=6,M=3,A=new Float32Array(M*g*v),C=new Float32Array(M*g*v);for(let S=0;S<v;S++){const U=S%3*2/3-1,F=S>2?0:-1,N=[U,F,0,U+2/3,F,0,U+2/3,F+1,0,U,F,0,U+2/3,F+1,0,U,F+1,0];A.set(N,M*g*S);for(let L=0;L<g;L++){const D=x[L*2]*2-1,I=x[L*2+1]*2-1;S===0?Nr.set(1,I,D):S===1?Nr.set(-D,1,-I):S===2?Nr.set(-D,I,1):S===3?Nr.set(-1,I,-D):S===4?Nr.set(-D,-1,I):Nr.set(D,I,-1),Nr.toArray(C,(S*g+L)*M)}}const y=new bi;y.setAttribute("position",new _s(A,M)),y.setAttribute("outputDirection",new _s(C,M)),i.push(new Me(y,null)),s>Bo&&s--}return{lodMeshes:i,sizeLods:e}}function zx(o,e,i){const s=new va(o,e,i);return s.texture.mapping=df,s.texture.name="PMREM.cubeUv",s.scissorTest=!0,s}function Po(o,e,i,s,l){o.viewport.set(e,i,s,l),o.scissor.set(e,i,s,l)}function sR(o,e,i){return new ka({name:"PMREMGGXConvolution",defines:{GGX_SAMPLES:nR,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/i,CUBEUV_MAX_MIP:`${o}.0`},uniforms:{envMap:{value:null},roughness:{value:0},mipInt:{value:0}},vertexShader:gf(),fragmentShader:`

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
		`,blending:ms,depthTest:!1,depthWrite:!1})}function rR(o,e,i){return new ka({name:"SphericalGaussianBlur",defines:{SAMPLES:eR,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/i,CUBEUV_MAX_MIP:`${o}.0`},uniforms:{envMap:{value:null},sigma:{value:0},mipInt:{value:0}},vertexShader:gf(),fragmentShader:`

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
		`,blending:ms,depthTest:!1,depthWrite:!1})}function Bx(){return new ka({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:gf(),fragmentShader:`

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
		`,blending:ms,depthTest:!1,depthWrite:!1})}function Fx(){return new ka({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:gf(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:ms,depthTest:!1,depthWrite:!1})}function gf(){return`

		precision mediump float;
		precision mediump int;

		attribute vec3 outputDirection;

		varying vec3 vOutputDirection;

		void main() {

			vOutputDirection = outputDirection;
			gl_Position = vec4( position, 1.0 );

		}
	`}class HS extends va{constructor(e=1,i={}){super(e,e,i),this.isWebGLCubeRenderTarget=!0;const s={width:e,height:e,depth:1},l=[s,s,s,s,s,s];this.texture=new LS(l),this._setTextureOptions(i),this.texture.isRenderTargetTexture=!0}fromEquirectangularTexture(e,i){this.texture.type=i.type,this.texture.colorSpace=i.colorSpace,this.texture.generateMipmaps=i.generateMipmaps,this.texture.minFilter=i.minFilter,this.texture.magFilter=i.magFilter;const s={uniforms:{tEquirect:{value:null}},vertexShader:`

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
			`},l=new On(5,5,5),f=new ka({name:"CubemapFromEquirect",uniforms:ko(s.uniforms),vertexShader:s.vertexShader,fragmentShader:s.fragmentShader,side:Ei,blending:ms});f.uniforms.tEquirect.value=i;const h=new Me(l,f),d=i.minFilter;return i.minFilter===Dr&&(i.minFilter=ri),new oT(1,10,this).update(e,h),i.minFilter=d,h.geometry.dispose(),h.material.dispose(),this}clear(e,i=!0,s=!0,l=!0){const f=e.getRenderTarget();for(let h=0;h<6;h++)e.setRenderTarget(this,h),e.clear(i,s,l);e.setRenderTarget(f)}}function oR(o){let e=new WeakMap,i=new WeakMap,s=null;function l(g,M=!1){return g==null?null:M?h(g):f(g)}function f(g){if(g&&g.isTexture){const M=g.mapping;if(M===Wd||M===Yd)if(e.has(g)){const A=e.get(g).texture;return d(A,g.mapping)}else{const A=g.image;if(A&&A.height>0){const C=new HS(A.height);return C.fromEquirectangularTexture(o,g),e.set(g,C),g.addEventListener("dispose",p),d(C.texture,g.mapping)}else return null}}return g}function h(g){if(g&&g.isTexture){const M=g.mapping,A=M===Wd||M===Yd,C=M===Or||M===Vo;if(A||C){let y=i.get(g);const S=y!==void 0?y.texture.pmremVersion:0;if(g.isRenderTargetTexture&&g.pmremVersion!==S)return s===null&&(s=new Ix(o)),y=A?s.fromEquirectangular(g,y):s.fromCubemap(g,y),y.texture.pmremVersion=g.pmremVersion,i.set(g,y),y.texture;if(y!==void 0)return y.texture;{const U=g.image;return A&&U&&U.height>0||C&&U&&m(U)?(s===null&&(s=new Ix(o)),y=A?s.fromEquirectangular(g):s.fromCubemap(g),y.texture.pmremVersion=g.pmremVersion,i.set(g,y),g.addEventListener("dispose",x),y.texture):null}}}return g}function d(g,M){return M===Wd?g.mapping=Or:M===Yd&&(g.mapping=Vo),g}function m(g){let M=0;const A=6;for(let C=0;C<A;C++)g[C]!==void 0&&M++;return M===A}function p(g){const M=g.target;M.removeEventListener("dispose",p);const A=e.get(M);A!==void 0&&(e.delete(M),A.dispose())}function x(g){const M=g.target;M.removeEventListener("dispose",x);const A=i.get(M);A!==void 0&&(i.delete(M),A.dispose())}function v(){e=new WeakMap,i=new WeakMap,s!==null&&(s.dispose(),s=null)}return{get:l,dispose:v}}function lR(o){const e={};function i(s){if(e[s]!==void 0)return e[s];const l=o.getExtension(s);return e[s]=l,l}return{has:function(s){return i(s)!==null},init:function(){i("EXT_color_buffer_float"),i("WEBGL_clip_cull_distance"),i("OES_texture_float_linear"),i("EXT_color_buffer_half_float"),i("WEBGL_multisampled_render_to_texture"),i("WEBGL_render_shared_exponent")},get:function(s){const l=i(s);return l===null&&Ho("WebGLRenderer: "+s+" extension not supported."),l}}}function cR(o,e,i,s){const l={},f=new WeakMap;function h(v){const g=v.target;g.index!==null&&e.remove(g.index);for(const A in g.attributes)e.remove(g.attributes[A]);g.removeEventListener("dispose",h),delete l[g.id];const M=f.get(g);M&&(e.remove(M),f.delete(g)),s.releaseStatesOfGeometry(g),g.isInstancedBufferGeometry===!0&&delete g._maxInstanceCount,i.memory.geometries--}function d(v,g){return l[g.id]===!0||(g.addEventListener("dispose",h),l[g.id]=!0,i.memory.geometries++),g}function m(v){const g=v.attributes;for(const M in g)e.update(g[M],o.ARRAY_BUFFER)}function p(v){const g=[],M=v.index,A=v.attributes.position;let C=0;if(A===void 0)return;if(M!==null){const U=M.array;C=M.version;for(let F=0,N=U.length;F<N;F+=3){const L=U[F+0],D=U[F+1],I=U[F+2];g.push(L,D,D,I,I,L)}}else{const U=A.array;C=A.version;for(let F=0,N=U.length/3-1;F<N;F+=3){const L=F+0,D=F+1,I=F+2;g.push(L,D,D,I,I,L)}}const y=new(A.count>=65535?DS:NS)(g,1);y.version=C;const S=f.get(v);S&&e.remove(S),f.set(v,y)}function x(v){const g=f.get(v);if(g){const M=v.index;M!==null&&g.version<M.version&&p(v)}else p(v);return f.get(v)}return{get:d,update:m,getWireframeAttribute:x}}function uR(o,e,i){let s;function l(v){s=v}let f,h;function d(v){f=v.type,h=v.bytesPerElement}function m(v,g){o.drawElements(s,g,f,v*h),i.update(g,s,1)}function p(v,g,M){M!==0&&(o.drawElementsInstanced(s,g,f,v*h,M),i.update(g,s,M))}function x(v,g,M){if(M===0)return;e.get("WEBGL_multi_draw").multiDrawElementsWEBGL(s,g,0,f,v,0,M);let C=0;for(let y=0;y<M;y++)C+=g[y];i.update(C,s,1)}this.setMode=l,this.setIndex=d,this.render=m,this.renderInstances=p,this.renderMultiDraw=x}function fR(o){const e={geometries:0,textures:0},i={frame:0,calls:0,triangles:0,points:0,lines:0};function s(f,h,d){switch(i.calls++,h){case o.TRIANGLES:i.triangles+=d*(f/3);break;case o.LINES:i.lines+=d*(f/2);break;case o.LINE_STRIP:i.lines+=d*(f-1);break;case o.LINE_LOOP:i.lines+=d*f;break;case o.POINTS:i.points+=d*f;break;default:je("WebGLInfo: Unknown draw mode:",h);break}}function l(){i.calls=0,i.triangles=0,i.points=0,i.lines=0}return{memory:e,render:i,programs:null,autoReset:!0,reset:l,update:s}}function hR(o,e,i){const s=new WeakMap,l=new vn;function f(h,d,m){const p=h.morphTargetInfluences,x=d.morphAttributes.position||d.morphAttributes.normal||d.morphAttributes.color,v=x!==void 0?x.length:0;let g=s.get(d);if(g===void 0||g.count!==v){let V=function(){T.dispose(),s.delete(d),d.removeEventListener("dispose",V)};var M=V;g!==void 0&&g.texture.dispose();const A=d.morphAttributes.position!==void 0,C=d.morphAttributes.normal!==void 0,y=d.morphAttributes.color!==void 0,S=d.morphAttributes.position||[],U=d.morphAttributes.normal||[],F=d.morphAttributes.color||[];let N=0;A===!0&&(N=1),C===!0&&(N=2),y===!0&&(N=3);let L=d.attributes.position.count*N,D=1;L>e.maxTextureSize&&(D=Math.ceil(L/e.maxTextureSize),L=e.maxTextureSize);const I=new Float32Array(L*D*4*v),T=new wS(I,L,D,v);T.type=Ba,T.needsUpdate=!0;const O=N*4;for(let Y=0;Y<v;Y++){const J=S[Y],rt=U[Y],j=F[Y],et=L*D*4*Y;for(let q=0;q<J.count;q++){const Z=q*O;A===!0&&(l.fromBufferAttribute(J,q),I[et+Z+0]=l.x,I[et+Z+1]=l.y,I[et+Z+2]=l.z,I[et+Z+3]=0),C===!0&&(l.fromBufferAttribute(rt,q),I[et+Z+4]=l.x,I[et+Z+5]=l.y,I[et+Z+6]=l.z,I[et+Z+7]=0),y===!0&&(l.fromBufferAttribute(j,q),I[et+Z+8]=l.x,I[et+Z+9]=l.y,I[et+Z+10]=l.z,I[et+Z+11]=j.itemSize===4?l.w:1)}}g={count:v,texture:T,size:new _e(L,D)},s.set(d,g),d.addEventListener("dispose",V)}if(h.isInstancedMesh===!0&&h.morphTexture!==null)m.getUniforms().setValue(o,"morphTexture",h.morphTexture,i);else{let A=0;for(let y=0;y<p.length;y++)A+=p[y];const C=d.morphTargetsRelative?1:1-A;m.getUniforms().setValue(o,"morphTargetBaseInfluence",C),m.getUniforms().setValue(o,"morphTargetInfluences",p)}m.getUniforms().setValue(o,"morphTargetsTexture",g.texture,i),m.getUniforms().setValue(o,"morphTargetsTextureSize",g.size)}return{update:f}}function dR(o,e,i,s,l){let f=new WeakMap;function h(p){const x=l.render.frame,v=p.geometry,g=e.get(p,v);if(f.get(g)!==x&&(e.update(g),f.set(g,x)),p.isInstancedMesh&&(p.hasEventListener("dispose",m)===!1&&p.addEventListener("dispose",m),f.get(p)!==x&&(i.update(p.instanceMatrix,o.ARRAY_BUFFER),p.instanceColor!==null&&i.update(p.instanceColor,o.ARRAY_BUFFER),f.set(p,x))),p.isSkinnedMesh){const M=p.skeleton;f.get(M)!==x&&(M.update(),f.set(M,x))}return g}function d(){f=new WeakMap}function m(p){const x=p.target;x.removeEventListener("dispose",m),s.releaseStatesOfObject(x),i.remove(x.instanceMatrix),x.instanceColor!==null&&i.remove(x.instanceColor)}return{update:h,dispose:d}}const pR={[hS]:"LINEAR_TONE_MAPPING",[dS]:"REINHARD_TONE_MAPPING",[pS]:"CINEON_TONE_MAPPING",[mS]:"ACES_FILMIC_TONE_MAPPING",[_S]:"AGX_TONE_MAPPING",[vS]:"NEUTRAL_TONE_MAPPING",[gS]:"CUSTOM_TONE_MAPPING"};function mR(o,e,i,s,l,f){const h=new va(e,i,{type:o,depthBuffer:l,stencilBuffer:f,samples:s?4:0,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,resolveDepthBuffer:!1,resolveStencilBuffer:!1});let d=null,m=null;const p=new bi;p.setAttribute("position",new Pn([-1,3,0,-1,-1,0,3,-1,0],3)),p.setAttribute("uv",new Pn([0,2,0,0,2,0],2));const x=new eT({uniforms:{tDiffuse:{value:null}},vertexShader:`
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
			}`,depthTest:!1,depthWrite:!1}),v=new Me(p,x),g=new Pm(-1,1,1,-1,0,1);let M=null,A=null,C=!1,y,S=null,U=[],F=!1;this.setSize=function(N,L){h.setSize(N,L),d!==null&&d.setSize(N,L),m!==null&&m.setSize(N,L);for(let D=0;D<U.length;D++){const I=U[D];I.setSize&&I.setSize(N,L)}},this.setEffects=function(N){U=N,F=U.length>0&&U[0].isRenderPass===!0;const L=h.width,D=h.height;U.length>0&&d===null&&(d=new va(L,D,{type:Va,depthBuffer:!1,stencilBuffer:!1}),m=new va(L,D,{type:Va,depthBuffer:!1,stencilBuffer:!1}));for(let I=0;I<U.length;I++){const T=U[I];T.setSize&&T.setSize(L,D)}},this.begin=function(N,L){if(C||N.toneMapping===Ha&&U.length===0)return!1;if(S=L,L!==null){const D=L.width,I=L.height;(h.width!==D||h.height!==I)&&this.setSize(D,I)}return F===!1&&N.setRenderTarget(h),y=N.toneMapping,N.toneMapping=Ha,!0},this.hasRenderPass=function(){return F},this.end=function(N,L){N.toneMapping=y,C=!0;let D=h,I=d;for(let T=0;T<U.length;T++){const O=U[T];O.enabled!==!1&&(O.render(N,I,D,L),O.needsSwap!==!1&&(D=I,I=I===d?m:d))}if(M!==N.outputColorSpace||A!==N.toneMapping){M=N.outputColorSpace,A=N.toneMapping,x.defines={},Xe.getTransfer(M)===sn&&(x.defines.SRGB_TRANSFER="");const T=pR[A];T&&(x.defines[T]=""),x.needsUpdate=!0}x.uniforms.tDiffuse.value=D.texture,N.setRenderTarget(S),N.render(v,g),S=null,C=!1},this.isCompositing=function(){return C},this.dispose=function(){h.dispose(),d!==null&&d.dispose(),m!==null&&m.dispose(),p.dispose(),x.dispose()}}const GS=new di,pm=new ec(1,1),VS=new wS,kS=new Nb,XS=new LS,Hx=[],Gx=[],Vx=new Float32Array(16),kx=new Float32Array(9),Xx=new Float32Array(4);function Wo(o,e,i){const s=o[0];if(s<=0||s>0)return o;const l=e*i;let f=Hx[l];if(f===void 0&&(f=new Float32Array(l),Hx[l]=f),e!==0){s.toArray(f,0);for(let h=1,d=0;h!==e;++h)d+=i,o[h].toArray(f,d)}return f}function Hn(o,e){if(o.length!==e.length)return!1;for(let i=0,s=o.length;i<s;i++)if(o[i]!==e[i])return!1;return!0}function Gn(o,e){for(let i=0,s=e.length;i<s;i++)o[i]=e[i]}function _f(o,e){let i=Gx[e];i===void 0&&(i=new Int32Array(e),Gx[e]=i);for(let s=0;s!==e;++s)i[s]=o.allocateTextureUnit();return i}function gR(o,e){const i=this.cache;i[0]!==e&&(o.uniform1f(this.addr,e),i[0]=e)}function _R(o,e){const i=this.cache;if(e.x!==void 0)(i[0]!==e.x||i[1]!==e.y)&&(o.uniform2f(this.addr,e.x,e.y),i[0]=e.x,i[1]=e.y);else{if(Hn(i,e))return;o.uniform2fv(this.addr,e),Gn(i,e)}}function vR(o,e){const i=this.cache;if(e.x!==void 0)(i[0]!==e.x||i[1]!==e.y||i[2]!==e.z)&&(o.uniform3f(this.addr,e.x,e.y,e.z),i[0]=e.x,i[1]=e.y,i[2]=e.z);else if(e.r!==void 0)(i[0]!==e.r||i[1]!==e.g||i[2]!==e.b)&&(o.uniform3f(this.addr,e.r,e.g,e.b),i[0]=e.r,i[1]=e.g,i[2]=e.b);else{if(Hn(i,e))return;o.uniform3fv(this.addr,e),Gn(i,e)}}function xR(o,e){const i=this.cache;if(e.x!==void 0)(i[0]!==e.x||i[1]!==e.y||i[2]!==e.z||i[3]!==e.w)&&(o.uniform4f(this.addr,e.x,e.y,e.z,e.w),i[0]=e.x,i[1]=e.y,i[2]=e.z,i[3]=e.w);else{if(Hn(i,e))return;o.uniform4fv(this.addr,e),Gn(i,e)}}function SR(o,e){const i=this.cache,s=e.elements;if(s===void 0){if(Hn(i,e))return;o.uniformMatrix2fv(this.addr,!1,e),Gn(i,e)}else{if(Hn(i,s))return;Xx.set(s),o.uniformMatrix2fv(this.addr,!1,Xx),Gn(i,s)}}function yR(o,e){const i=this.cache,s=e.elements;if(s===void 0){if(Hn(i,e))return;o.uniformMatrix3fv(this.addr,!1,e),Gn(i,e)}else{if(Hn(i,s))return;kx.set(s),o.uniformMatrix3fv(this.addr,!1,kx),Gn(i,s)}}function MR(o,e){const i=this.cache,s=e.elements;if(s===void 0){if(Hn(i,e))return;o.uniformMatrix4fv(this.addr,!1,e),Gn(i,e)}else{if(Hn(i,s))return;Vx.set(s),o.uniformMatrix4fv(this.addr,!1,Vx),Gn(i,s)}}function ER(o,e){const i=this.cache;i[0]!==e&&(o.uniform1i(this.addr,e),i[0]=e)}function bR(o,e){const i=this.cache;if(e.x!==void 0)(i[0]!==e.x||i[1]!==e.y)&&(o.uniform2i(this.addr,e.x,e.y),i[0]=e.x,i[1]=e.y);else{if(Hn(i,e))return;o.uniform2iv(this.addr,e),Gn(i,e)}}function TR(o,e){const i=this.cache;if(e.x!==void 0)(i[0]!==e.x||i[1]!==e.y||i[2]!==e.z)&&(o.uniform3i(this.addr,e.x,e.y,e.z),i[0]=e.x,i[1]=e.y,i[2]=e.z);else{if(Hn(i,e))return;o.uniform3iv(this.addr,e),Gn(i,e)}}function AR(o,e){const i=this.cache;if(e.x!==void 0)(i[0]!==e.x||i[1]!==e.y||i[2]!==e.z||i[3]!==e.w)&&(o.uniform4i(this.addr,e.x,e.y,e.z,e.w),i[0]=e.x,i[1]=e.y,i[2]=e.z,i[3]=e.w);else{if(Hn(i,e))return;o.uniform4iv(this.addr,e),Gn(i,e)}}function RR(o,e){const i=this.cache;i[0]!==e&&(o.uniform1ui(this.addr,e),i[0]=e)}function wR(o,e){const i=this.cache;if(e.x!==void 0)(i[0]!==e.x||i[1]!==e.y)&&(o.uniform2ui(this.addr,e.x,e.y),i[0]=e.x,i[1]=e.y);else{if(Hn(i,e))return;o.uniform2uiv(this.addr,e),Gn(i,e)}}function CR(o,e){const i=this.cache;if(e.x!==void 0)(i[0]!==e.x||i[1]!==e.y||i[2]!==e.z)&&(o.uniform3ui(this.addr,e.x,e.y,e.z),i[0]=e.x,i[1]=e.y,i[2]=e.z);else{if(Hn(i,e))return;o.uniform3uiv(this.addr,e),Gn(i,e)}}function NR(o,e){const i=this.cache;if(e.x!==void 0)(i[0]!==e.x||i[1]!==e.y||i[2]!==e.z||i[3]!==e.w)&&(o.uniform4ui(this.addr,e.x,e.y,e.z,e.w),i[0]=e.x,i[1]=e.y,i[2]=e.z,i[3]=e.w);else{if(Hn(i,e))return;o.uniform4uiv(this.addr,e),Gn(i,e)}}function DR(o,e,i){const s=this.cache,l=i.allocateTextureUnit();s[0]!==l&&(o.uniform1i(this.addr,l),s[0]=l);let f;this.type===o.SAMPLER_2D_SHADOW?(pm.compareFunction=i.isReversedDepthBuffer()?Rm:Am,f=pm):f=GS,i.setTexture2D(e||f,l)}function UR(o,e,i){const s=this.cache,l=i.allocateTextureUnit();s[0]!==l&&(o.uniform1i(this.addr,l),s[0]=l),i.setTexture3D(e||kS,l)}function LR(o,e,i){const s=this.cache,l=i.allocateTextureUnit();s[0]!==l&&(o.uniform1i(this.addr,l),s[0]=l),i.setTextureCube(e||XS,l)}function OR(o,e,i){const s=this.cache,l=i.allocateTextureUnit();s[0]!==l&&(o.uniform1i(this.addr,l),s[0]=l),i.setTexture2DArray(e||VS,l)}function PR(o){switch(o){case 5126:return gR;case 35664:return _R;case 35665:return vR;case 35666:return xR;case 35674:return SR;case 35675:return yR;case 35676:return MR;case 5124:case 35670:return ER;case 35667:case 35671:return bR;case 35668:case 35672:return TR;case 35669:case 35673:return AR;case 5125:return RR;case 36294:return wR;case 36295:return CR;case 36296:return NR;case 35678:case 36198:case 36298:case 36306:case 35682:return DR;case 35679:case 36299:case 36307:return UR;case 35680:case 36300:case 36308:case 36293:return LR;case 36289:case 36303:case 36311:case 36292:return OR}}function IR(o,e){o.uniform1fv(this.addr,e)}function zR(o,e){const i=Wo(e,this.size,2);o.uniform2fv(this.addr,i)}function BR(o,e){const i=Wo(e,this.size,3);o.uniform3fv(this.addr,i)}function FR(o,e){const i=Wo(e,this.size,4);o.uniform4fv(this.addr,i)}function HR(o,e){const i=Wo(e,this.size,4);o.uniformMatrix2fv(this.addr,!1,i)}function GR(o,e){const i=Wo(e,this.size,9);o.uniformMatrix3fv(this.addr,!1,i)}function VR(o,e){const i=Wo(e,this.size,16);o.uniformMatrix4fv(this.addr,!1,i)}function kR(o,e){o.uniform1iv(this.addr,e)}function XR(o,e){o.uniform2iv(this.addr,e)}function WR(o,e){o.uniform3iv(this.addr,e)}function YR(o,e){o.uniform4iv(this.addr,e)}function qR(o,e){o.uniform1uiv(this.addr,e)}function jR(o,e){o.uniform2uiv(this.addr,e)}function ZR(o,e){o.uniform3uiv(this.addr,e)}function KR(o,e){o.uniform4uiv(this.addr,e)}function QR(o,e,i){const s=this.cache,l=e.length,f=_f(i,l);Hn(s,f)||(o.uniform1iv(this.addr,f),Gn(s,f));let h;this.type===o.SAMPLER_2D_SHADOW?h=pm:h=GS;for(let d=0;d!==l;++d)i.setTexture2D(e[d]||h,f[d])}function JR(o,e,i){const s=this.cache,l=e.length,f=_f(i,l);Hn(s,f)||(o.uniform1iv(this.addr,f),Gn(s,f));for(let h=0;h!==l;++h)i.setTexture3D(e[h]||kS,f[h])}function $R(o,e,i){const s=this.cache,l=e.length,f=_f(i,l);Hn(s,f)||(o.uniform1iv(this.addr,f),Gn(s,f));for(let h=0;h!==l;++h)i.setTextureCube(e[h]||XS,f[h])}function t2(o,e,i){const s=this.cache,l=e.length,f=_f(i,l);Hn(s,f)||(o.uniform1iv(this.addr,f),Gn(s,f));for(let h=0;h!==l;++h)i.setTexture2DArray(e[h]||VS,f[h])}function e2(o){switch(o){case 5126:return IR;case 35664:return zR;case 35665:return BR;case 35666:return FR;case 35674:return HR;case 35675:return GR;case 35676:return VR;case 5124:case 35670:return kR;case 35667:case 35671:return XR;case 35668:case 35672:return WR;case 35669:case 35673:return YR;case 5125:return qR;case 36294:return jR;case 36295:return ZR;case 36296:return KR;case 35678:case 36198:case 36298:case 36306:case 35682:return QR;case 35679:case 36299:case 36307:return JR;case 35680:case 36300:case 36308:case 36293:return $R;case 36289:case 36303:case 36311:case 36292:return t2}}class n2{constructor(e,i,s){this.id=e,this.addr=s,this.cache=[],this.type=i.type,this.setValue=PR(i.type)}}class i2{constructor(e,i,s){this.id=e,this.addr=s,this.cache=[],this.type=i.type,this.size=i.size,this.setValue=e2(i.type)}}class a2{constructor(e){this.id=e,this.seq=[],this.map={}}setValue(e,i,s){const l=this.seq;for(let f=0,h=l.length;f!==h;++f){const d=l[f];d.setValue(e,i[d.id],s)}}}const Ep=/(\w+)(\])?(\[|\.)?/g;function Wx(o,e){o.seq.push(e),o.map[e.id]=e}function s2(o,e,i){const s=o.name,l=s.length;for(Ep.lastIndex=0;;){const f=Ep.exec(s),h=Ep.lastIndex;let d=f[1];const m=f[2]==="]",p=f[3];if(m&&(d=d|0),p===void 0||p==="["&&h+2===l){Wx(i,p===void 0?new n2(d,o,e):new i2(d,o,e));break}else{let v=i.map[d];v===void 0&&(v=new a2(d),Wx(i,v)),i=v}}}class nf{constructor(e,i){this.seq=[],this.map={};const s=e.getProgramParameter(i,e.ACTIVE_UNIFORMS);for(let h=0;h<s;++h){const d=e.getActiveUniform(i,h),m=e.getUniformLocation(i,d.name);s2(d,m,this)}const l=[],f=[];for(const h of this.seq)h.type===e.SAMPLER_2D_SHADOW||h.type===e.SAMPLER_CUBE_SHADOW||h.type===e.SAMPLER_2D_ARRAY_SHADOW?l.push(h):f.push(h);l.length>0&&(this.seq=l.concat(f))}setValue(e,i,s,l){const f=this.map[i];f!==void 0&&f.setValue(e,s,l)}setOptional(e,i,s){const l=i[s];l!==void 0&&this.setValue(e,s,l)}static upload(e,i,s,l){for(let f=0,h=i.length;f!==h;++f){const d=i[f],m=s[d.id];m.needsUpdate!==!1&&d.setValue(e,m.value,l)}}static seqWithValue(e,i){const s=[];for(let l=0,f=e.length;l!==f;++l){const h=e[l];h.id in i&&s.push(h)}return s}}function Yx(o,e,i){const s=o.createShader(e);return o.shaderSource(s,i),o.compileShader(s),s}const r2=37297;let o2=0;function l2(o,e){const i=o.split(`
`),s=[],l=Math.max(e-6,0),f=Math.min(e+6,i.length);for(let h=l;h<f;h++){const d=h+1;s.push(`${d===e?">":" "} ${d}: ${i[h]}`)}return s.join(`
`)}const qx=new be;function c2(o){Xe._getMatrix(qx,Xe.workingColorSpace,o);const e=`mat3( ${qx.elements.map(i=>i.toFixed(4))} )`;switch(Xe.getTransfer(o)){case of:return[e,"LinearTransferOETF"];case sn:return[e,"sRGBTransferOETF"];default:return ge("WebGLProgram: Unsupported color space: ",o),[e,"LinearTransferOETF"]}}function jx(o,e,i){const s=o.getShaderParameter(e,o.COMPILE_STATUS),f=(o.getShaderInfoLog(e)||"").trim();if(s&&f==="")return"";const h=/ERROR: 0:(\d+)/.exec(f);if(h){const d=parseInt(h[1]);return i.toUpperCase()+`

`+f+`

`+l2(o.getShaderSource(e),d)}else return f}function u2(o,e){const i=c2(e);return[`vec4 ${o}( vec4 value ) {`,`	return ${i[1]}( vec4( value.rgb * ${i[0]}, value.a ) );`,"}"].join(`
`)}const f2={[hS]:"Linear",[dS]:"Reinhard",[pS]:"Cineon",[mS]:"ACESFilmic",[_S]:"AgX",[vS]:"Neutral",[gS]:"Custom"};function h2(o,e){const i=f2[e];return i===void 0?(ge("WebGLProgram: Unsupported toneMapping:",e),"vec3 "+o+"( vec3 color ) { return LinearToneMapping( color ); }"):"vec3 "+o+"( vec3 color ) { return "+i+"ToneMapping( color ); }"}const Ku=new X;function d2(){Xe.getLuminanceCoefficients(Ku);const o=Ku.x.toFixed(4),e=Ku.y.toFixed(4),i=Ku.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${o}, ${e}, ${i} );`,"	return dot( weights, rgb );","}"].join(`
`)}function p2(o){return[o.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",o.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(Yl).join(`
`)}function m2(o){const e=[];for(const i in o){const s=o[i];s!==!1&&e.push("#define "+i+" "+s)}return e.join(`
`)}function g2(o,e){const i={},s=o.getProgramParameter(e,o.ACTIVE_ATTRIBUTES);for(let l=0;l<s;l++){const f=o.getActiveAttrib(e,l),h=f.name;let d=1;f.type===o.FLOAT_MAT2&&(d=2),f.type===o.FLOAT_MAT3&&(d=3),f.type===o.FLOAT_MAT4&&(d=4),i[h]={type:f.type,location:o.getAttribLocation(e,h),locationSize:d}}return i}function Yl(o){return o!==""}function Zx(o,e){const i=e.numSpotLightShadows+e.numSpotLightMaps-e.numSpotLightShadowsWithMaps;return o.replace(/NUM_SUN_LIGHTS/g,e.numSunLights).replace(/NUM_DIR_LIGHTS/g,e.numDirLights).replace(/NUM_SPOT_LIGHTS/g,e.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,e.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,i).replace(/NUM_RECT_AREA_LIGHTS/g,e.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,e.numPointLights).replace(/NUM_HEMI_LIGHTS/g,e.numHemiLights).replace(/NUM_SUN_LIGHT_SHADOWS/g,e.numSunLightShadows).replace(/NUM_DIR_LIGHT_SHADOWS/g,e.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,e.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,e.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,e.numPointLightShadows)}function Kx(o,e){return o.replace(/NUM_CLIPPING_PLANES/g,e.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,e.numClippingPlanes-e.numClipIntersection)}const _2=/^[ \t]*#include +<([\w\d./]+)>/gm;function mm(o){return o.replace(_2,x2)}const v2=new Map;function x2(o,e){let i=De[e];if(i===void 0){const s=v2.get(e);if(s!==void 0)i=De[s],ge('WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',e,s);else throw new Error("THREE.WebGLProgram: Can not resolve #include <"+e+">")}return mm(i)}const S2=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function Qx(o){return o.replace(S2,y2)}function y2(o,e,i,s){let l="";for(let f=parseInt(e);f<parseInt(i);f++)l+=s.replace(/\[\s*i\s*\]/g,"[ "+f+" ]").replace(/UNROLLED_LOOP_INDEX/g,f);return l}function Jx(o){let e=`precision ${o.precision} float;
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
#define LOW_PRECISION`),e}const M2={[ql]:"SHADOWMAP_TYPE_PCF",[Wl]:"SHADOWMAP_TYPE_VSM"};function E2(o){return M2[o.shadowMapType]||"SHADOWMAP_TYPE_BASIC"}const b2={[Or]:"ENVMAP_TYPE_CUBE",[Vo]:"ENVMAP_TYPE_CUBE",[df]:"ENVMAP_TYPE_CUBE_UV"};function T2(o){return o.envMap===!1?"ENVMAP_TYPE_CUBE":b2[o.envMapMode]||"ENVMAP_TYPE_CUBE"}const A2={[Vo]:"ENVMAP_MODE_REFRACTION"};function R2(o){return o.envMap===!1?"ENVMAP_MODE_REFLECTION":A2[o.envMapMode]||"ENVMAP_MODE_REFLECTION"}const w2={[fS]:"ENVMAP_BLENDING_MULTIPLY",[rb]:"ENVMAP_BLENDING_MIX",[ob]:"ENVMAP_BLENDING_ADD"};function C2(o){return o.envMap===!1?"ENVMAP_BLENDING_NONE":w2[o.combine]||"ENVMAP_BLENDING_NONE"}function N2(o){const e=o.envMapCubeUVHeight;if(e===null)return null;const i=Math.log2(e)-2,s=1/e;return{texelWidth:1/(3*Math.max(Math.pow(2,i),112)),texelHeight:s,maxMip:i}}function D2(o,e,i,s){const l=o.getContext(),f=i.defines;let h=i.vertexShader,d=i.fragmentShader;const m=E2(i),p=T2(i),x=R2(i),v=C2(i),g=N2(i),M=p2(i),A=m2(f),C=l.createProgram();let y,S,U=i.glslVersion?"#version "+i.glslVersion+`
`:"";i.isRawShaderMaterial?(y=["#define SHADER_TYPE "+i.shaderType,"#define SHADER_NAME "+i.shaderName,A].filter(Yl).join(`
`),y.length>0&&(y+=`
`),S=["#define SHADER_TYPE "+i.shaderType,"#define SHADER_NAME "+i.shaderName,A].filter(Yl).join(`
`),S.length>0&&(S+=`
`)):(y=[Jx(i),"#define SHADER_TYPE "+i.shaderType,"#define SHADER_NAME "+i.shaderName,A,i.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",i.batching?"#define USE_BATCHING":"",i.batchingColor?"#define USE_BATCHING_COLOR":"",i.instancing?"#define USE_INSTANCING":"",i.instancingColor?"#define USE_INSTANCING_COLOR":"",i.instancingMorph?"#define USE_INSTANCING_MORPH":"",i.useFog&&i.fog?"#define USE_FOG":"",i.useFog&&i.fogExp2?"#define FOG_EXP2":"",i.map?"#define USE_MAP":"",i.envMap?"#define USE_ENVMAP":"",i.envMap?"#define "+x:"",i.lightMap?"#define USE_LIGHTMAP":"",i.aoMap?"#define USE_AOMAP":"",i.bumpMap?"#define USE_BUMPMAP":"",i.normalMap?"#define USE_NORMALMAP":"",i.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",i.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",i.displacementMap?"#define USE_DISPLACEMENTMAP":"",i.emissiveMap?"#define USE_EMISSIVEMAP":"",i.anisotropy?"#define USE_ANISOTROPY":"",i.anisotropyMap?"#define USE_ANISOTROPYMAP":"",i.clearcoatMap?"#define USE_CLEARCOATMAP":"",i.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",i.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",i.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",i.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",i.specularMap?"#define USE_SPECULARMAP":"",i.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",i.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",i.roughnessMap?"#define USE_ROUGHNESSMAP":"",i.metalnessMap?"#define USE_METALNESSMAP":"",i.alphaMap?"#define USE_ALPHAMAP":"",i.alphaHash?"#define USE_ALPHAHASH":"",i.transmission?"#define USE_TRANSMISSION":"",i.transmissionMap?"#define USE_TRANSMISSIONMAP":"",i.thicknessMap?"#define USE_THICKNESSMAP":"",i.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",i.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",i.mapUv?"#define MAP_UV "+i.mapUv:"",i.alphaMapUv?"#define ALPHAMAP_UV "+i.alphaMapUv:"",i.lightMapUv?"#define LIGHTMAP_UV "+i.lightMapUv:"",i.aoMapUv?"#define AOMAP_UV "+i.aoMapUv:"",i.emissiveMapUv?"#define EMISSIVEMAP_UV "+i.emissiveMapUv:"",i.bumpMapUv?"#define BUMPMAP_UV "+i.bumpMapUv:"",i.normalMapUv?"#define NORMALMAP_UV "+i.normalMapUv:"",i.displacementMapUv?"#define DISPLACEMENTMAP_UV "+i.displacementMapUv:"",i.metalnessMapUv?"#define METALNESSMAP_UV "+i.metalnessMapUv:"",i.roughnessMapUv?"#define ROUGHNESSMAP_UV "+i.roughnessMapUv:"",i.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+i.anisotropyMapUv:"",i.clearcoatMapUv?"#define CLEARCOATMAP_UV "+i.clearcoatMapUv:"",i.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+i.clearcoatNormalMapUv:"",i.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+i.clearcoatRoughnessMapUv:"",i.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+i.iridescenceMapUv:"",i.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+i.iridescenceThicknessMapUv:"",i.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+i.sheenColorMapUv:"",i.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+i.sheenRoughnessMapUv:"",i.specularMapUv?"#define SPECULARMAP_UV "+i.specularMapUv:"",i.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+i.specularColorMapUv:"",i.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+i.specularIntensityMapUv:"",i.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+i.transmissionMapUv:"",i.thicknessMapUv?"#define THICKNESSMAP_UV "+i.thicknessMapUv:"",i.vertexTangents&&i.flatShading===!1?"#define USE_TANGENT":"",i.vertexNormals?"#define HAS_NORMAL":"",i.vertexColors?"#define USE_COLOR":"",i.vertexAlphas?"#define USE_COLOR_ALPHA":"",i.vertexUv1s?"#define USE_UV1":"",i.vertexUv2s?"#define USE_UV2":"",i.vertexUv3s?"#define USE_UV3":"",i.pointsUvs?"#define USE_POINTS_UV":"",i.flatShading?"#define FLAT_SHADED":"",i.skinning?"#define USE_SKINNING":"",i.morphTargets?"#define USE_MORPHTARGETS":"",i.morphNormals&&i.flatShading===!1?"#define USE_MORPHNORMALS":"",i.morphColors?"#define USE_MORPHCOLORS":"",i.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+i.morphTextureStride:"",i.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+i.morphTargetsCount:"",i.doubleSided?"#define DOUBLE_SIDED":"",i.flipSided?"#define FLIP_SIDED":"",i.shadowMapEnabled?"#define USE_SHADOWMAP":"",i.shadowMapEnabled?"#define "+m:"",i.sizeAttenuation?"#define USE_SIZEATTENUATION":"",i.numLightProbes>0?"#define USE_LIGHT_PROBES":"",i.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",i.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(Yl).join(`
`),S=[Jx(i),"#define SHADER_TYPE "+i.shaderType,"#define SHADER_NAME "+i.shaderName,A,i.useFog&&i.fog?"#define USE_FOG":"",i.useFog&&i.fogExp2?"#define FOG_EXP2":"",i.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",i.map?"#define USE_MAP":"",i.matcap?"#define USE_MATCAP":"",i.envMap?"#define USE_ENVMAP":"",i.envMap?"#define "+p:"",i.envMap?"#define "+x:"",i.envMap?"#define "+v:"",g?"#define CUBEUV_TEXEL_WIDTH "+g.texelWidth:"",g?"#define CUBEUV_TEXEL_HEIGHT "+g.texelHeight:"",g?"#define CUBEUV_MAX_MIP "+g.maxMip+".0":"",i.lightMap?"#define USE_LIGHTMAP":"",i.aoMap?"#define USE_AOMAP":"",i.bumpMap?"#define USE_BUMPMAP":"",i.normalMap?"#define USE_NORMALMAP":"",i.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",i.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",i.packedNormalMap?"#define USE_PACKED_NORMALMAP":"",i.emissiveMap?"#define USE_EMISSIVEMAP":"",i.anisotropy?"#define USE_ANISOTROPY":"",i.anisotropyMap?"#define USE_ANISOTROPYMAP":"",i.clearcoat?"#define USE_CLEARCOAT":"",i.clearcoatMap?"#define USE_CLEARCOATMAP":"",i.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",i.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",i.dispersion?"#define USE_DISPERSION":"",i.retroreflection?"#define USE_RETROREFLECTION":"",i.iridescence?"#define USE_IRIDESCENCE":"",i.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",i.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",i.specularMap?"#define USE_SPECULARMAP":"",i.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",i.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",i.roughnessMap?"#define USE_ROUGHNESSMAP":"",i.metalnessMap?"#define USE_METALNESSMAP":"",i.alphaMap?"#define USE_ALPHAMAP":"",i.alphaTest?"#define USE_ALPHATEST":"",i.alphaHash?"#define USE_ALPHAHASH":"",i.sheen?"#define USE_SHEEN":"",i.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",i.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",i.transmission?"#define USE_TRANSMISSION":"",i.transmissionMap?"#define USE_TRANSMISSIONMAP":"",i.thicknessMap?"#define USE_THICKNESSMAP":"",i.vertexTangents&&i.flatShading===!1?"#define USE_TANGENT":"",i.vertexColors||i.instancingColor?"#define USE_COLOR":"",i.vertexAlphas||i.batchingColor?"#define USE_COLOR_ALPHA":"",i.vertexUv1s?"#define USE_UV1":"",i.vertexUv2s?"#define USE_UV2":"",i.vertexUv3s?"#define USE_UV3":"",i.pointsUvs?"#define USE_POINTS_UV":"",i.gradientMap?"#define USE_GRADIENTMAP":"",i.flatShading?"#define FLAT_SHADED":"",i.doubleSided?"#define DOUBLE_SIDED":"",i.flipSided?"#define FLIP_SIDED":"",i.shadowMapEnabled?"#define USE_SHADOWMAP":"",i.shadowMapEnabled?"#define "+m:"",i.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",i.numLightProbes>0?"#define USE_LIGHT_PROBES":"",i.numLightProbeGrids>0?"#define USE_LIGHT_PROBES_GRID":"",i.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",i.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",i.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",i.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",i.toneMapping!==Ha?"#define TONE_MAPPING":"",i.toneMapping!==Ha?De.tonemapping_pars_fragment:"",i.toneMapping!==Ha?h2("toneMapping",i.toneMapping):"",i.dithering?"#define DITHERING":"",i.opaque?"#define OPAQUE":"",De.colorspace_pars_fragment,u2("linearToOutputTexel",i.outputColorSpace),d2(),i.useDepthPacking?"#define DEPTH_PACKING "+i.depthPacking:"",`
`].filter(Yl).join(`
`)),h=mm(h),h=Zx(h,i),h=Kx(h,i),d=mm(d),d=Zx(d,i),d=Kx(d,i),h=Qx(h),d=Qx(d),i.isRawShaderMaterial!==!0&&(U=`#version 300 es
`,y=[M,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+y,S=["#define varying in",i.glslVersion===nx?"":"layout(location = 0) out highp vec4 pc_fragColor;",i.glslVersion===nx?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+S);const F=U+y+h,N=U+S+d,L=Yx(l,l.VERTEX_SHADER,F),D=Yx(l,l.FRAGMENT_SHADER,N);l.attachShader(C,L),l.attachShader(C,D),i.index0AttributeName!==void 0?l.bindAttribLocation(C,0,i.index0AttributeName):i.hasPositionAttribute===!0&&l.bindAttribLocation(C,0,"position"),l.linkProgram(C);function I(Y){if(o.debug.checkShaderErrors){const J=l.getProgramInfoLog(C)||"",rt=l.getShaderInfoLog(L)||"",j=l.getShaderInfoLog(D)||"",et=J.trim(),q=rt.trim(),Z=j.trim();let ht=!0,ct=!0;if(l.getProgramParameter(C,l.LINK_STATUS)===!1)if(ht=!1,typeof o.debug.onShaderError=="function")o.debug.onShaderError(l,C,L,D);else{const gt=jx(l,L,"vertex"),vt=jx(l,D,"fragment");je("WebGLProgram: Shader Error "+l.getError()+" - VALIDATE_STATUS "+l.getProgramParameter(C,l.VALIDATE_STATUS)+`

Material Name: `+Y.name+`
Material Type: `+Y.type+`

Program Info Log: `+et+`
`+gt+`
`+vt)}else et!==""?ge("WebGLProgram: Program Info Log:",et):(q===""||Z==="")&&(ct=!1);ct&&(Y.diagnostics={runnable:ht,programLog:et,vertexShader:{log:q,prefix:y},fragmentShader:{log:Z,prefix:S}})}l.deleteShader(L),l.deleteShader(D),T=new nf(l,C),O=g2(l,C)}let T;this.getUniforms=function(){return T===void 0&&I(this),T};let O;this.getAttributes=function(){return O===void 0&&I(this),O};let V=i.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return V===!1&&(V=l.getProgramParameter(C,r2)),V},this.destroy=function(){s.releaseStatesOfProgram(this),l.deleteProgram(C),this.program=void 0},this.type=i.shaderType,this.name=i.shaderName,this.id=o2++,this.cacheKey=e,this.usedTimes=1,this.program=C,this.vertexShader=L,this.fragmentShader=D,this}let U2=0;class L2{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(e,i,s){const l=this._getShaderCacheForMaterial(e);return l.has(i)===!1&&(l.add(i),i.usedTimes++),l.has(s)===!1&&(l.add(s),s.usedTimes++),this}remove(e){const i=this.materialCache.get(e);for(const s of i)s.usedTimes--,s.usedTimes===0&&this.shaderCache.delete(s.code);return this.materialCache.delete(e),this}getVertexShaderStage(e){return this._getShaderStage(e.vertexShader)}getFragmentShaderStage(e){return this._getShaderStage(e.fragmentShader)}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(e){const i=this.materialCache;let s=i.get(e);return s===void 0&&(s=new Set,i.set(e,s)),s}_getShaderStage(e){const i=this.shaderCache;let s=i.get(e);return s===void 0&&(s=new O2(e),i.set(e,s)),s}}class O2{constructor(e){this.id=U2++,this.code=e,this.usedTimes=0}}function P2(o){return o===Pr||o===af||o===sf}function I2(o,e,i,s,l,f){const h=new Cm,d=new L2,m=new Set,p=[],x=new Map,v=s.logarithmicDepthBuffer;let g=s.precision;const M={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distance",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function A(T){return m.add(T),T===0?"uv":`uv${T}`}function C(T,O,V,Y,J,rt){const j=Y.fog,et=J.geometry,q=T.isMeshStandardMaterial||T.isMeshLambertMaterial||T.isMeshPhongMaterial?Y.environment:null,Z=T.isMeshStandardMaterial||T.isMeshLambertMaterial&&!T.envMap||T.isMeshPhongMaterial&&!T.envMap,ht=e.get(T.envMap||q,Z),ct=ht&&ht.mapping===df?ht.image.height:null,gt=M[T.type];T.precision!==null&&(g=s.getMaxPrecision(T.precision),g!==T.precision&&ge("WebGLProgram.getParameters:",T.precision,"not supported, using",g,"instead."));const vt=et.morphAttributes.position||et.morphAttributes.normal||et.morphAttributes.color,ie=vt!==void 0?vt.length:0;let ne=0;et.morphAttributes.position!==void 0&&(ne=1),et.morphAttributes.normal!==void 0&&(ne=2),et.morphAttributes.color!==void 0&&(ne=3);let B,xt,Nt,Q;if(gt){const Le=za[gt];B=Le.vertexShader,xt=Le.fragmentShader}else{B=T.vertexShader,xt=T.fragmentShader;const Le=d.getVertexShaderStage(T),xe=d.getFragmentShaderStage(T);d.update(T,Le,xe),Nt=Le.id,Q=xe.id}const dt=o.getRenderTarget(),Dt=o.state.buffers.depth.getReversed(),Wt=J.isInstancedMesh===!0,Mt=J.isBatchedMesh===!0,It=!!T.map,Ze=!!T.matcap,Ee=!!ht,Te=!!T.aoMap,Ce=!!T.lightMap,ce=!!T.bumpMap&&T.wireframe===!1,fe=!!T.normalMap,Ke=!!T.displacementMap,ve=!!T.emissiveMap,We=!!T.metalnessMap,on=!!T.roughnessMap,W=T.anisotropy>0,un=T.clearcoat>0,Ue=T.dispersion>0,P=T.retroreflectivity>0,E=T.iridescence>0,nt=T.sheen>0,ot=T.transmission>0,_t=W&&!!T.anisotropyMap,At=un&&!!T.clearcoatMap,Ut=un&&!!T.clearcoatNormalMap,pt=un&&!!T.clearcoatRoughnessMap,St=E&&!!T.iridescenceMap,Ft=E&&!!T.iridescenceThicknessMap,ae=nt&&!!T.sheenColorMap,Ht=nt&&!!T.sheenRoughnessMap,zt=!!T.specularMap,Kt=!!T.specularColorMap,le=!!T.specularIntensityMap,he=ot&&!!T.transmissionMap,k=ot&&!!T.thicknessMap,Ot=!!T.gradientMap,Et=!!T.alphaMap,Gt=T.alphaTest>0,jt=!!T.alphaHash,wt=!!T.extensions;let se=Ha;T.toneMapped&&(dt===null||dt.isXRRenderTarget===!0)&&(se=o.toneMapping);const Yt={shaderID:gt,shaderType:T.type,shaderName:T.name,vertexShader:B,fragmentShader:xt,defines:T.defines,customVertexShaderID:Nt,customFragmentShaderID:Q,isRawShaderMaterial:T.isRawShaderMaterial===!0,glslVersion:T.glslVersion,precision:g,batching:Mt,batchingColor:Mt&&J._colorsTexture!==null,instancing:Wt,instancingColor:Wt&&J.instanceColor!==null,instancingMorph:Wt&&J.morphTexture!==null,outputColorSpace:dt===null?o.outputColorSpace:dt.isXRRenderTarget===!0?dt.texture.colorSpace:Xe.workingColorSpace,alphaToCoverage:!!T.alphaToCoverage,map:It,matcap:Ze,envMap:Ee,envMapMode:Ee&&ht.mapping,envMapCubeUVHeight:ct,aoMap:Te,lightMap:Ce,bumpMap:ce,normalMap:fe,displacementMap:Ke,emissiveMap:ve,normalMapObjectSpace:fe&&T.normalMapType===ub,normalMapTangentSpace:fe&&T.normalMapType===fm,packedNormalMap:fe&&T.normalMapType===fm&&P2(T.normalMap.format),metalnessMap:We,roughnessMap:on,anisotropy:W,anisotropyMap:_t,clearcoat:un,clearcoatMap:At,clearcoatNormalMap:Ut,clearcoatRoughnessMap:pt,dispersion:Ue,retroreflection:P,iridescence:E,iridescenceMap:St,iridescenceThicknessMap:Ft,sheen:nt,sheenColorMap:ae,sheenRoughnessMap:Ht,specularMap:zt,specularColorMap:Kt,specularIntensityMap:le,transmission:ot,transmissionMap:he,thicknessMap:k,gradientMap:Ot,opaque:T.transparent===!1&&T.blending===jl&&T.alphaToCoverage===!1,alphaMap:Et,alphaTest:Gt,alphaHash:jt,combine:T.combine,mapUv:It&&A(T.map.channel),aoMapUv:Te&&A(T.aoMap.channel),lightMapUv:Ce&&A(T.lightMap.channel),bumpMapUv:ce&&A(T.bumpMap.channel),normalMapUv:fe&&A(T.normalMap.channel),displacementMapUv:Ke&&A(T.displacementMap.channel),emissiveMapUv:ve&&A(T.emissiveMap.channel),metalnessMapUv:We&&A(T.metalnessMap.channel),roughnessMapUv:on&&A(T.roughnessMap.channel),anisotropyMapUv:_t&&A(T.anisotropyMap.channel),clearcoatMapUv:At&&A(T.clearcoatMap.channel),clearcoatNormalMapUv:Ut&&A(T.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:pt&&A(T.clearcoatRoughnessMap.channel),iridescenceMapUv:St&&A(T.iridescenceMap.channel),iridescenceThicknessMapUv:Ft&&A(T.iridescenceThicknessMap.channel),sheenColorMapUv:ae&&A(T.sheenColorMap.channel),sheenRoughnessMapUv:Ht&&A(T.sheenRoughnessMap.channel),specularMapUv:zt&&A(T.specularMap.channel),specularColorMapUv:Kt&&A(T.specularColorMap.channel),specularIntensityMapUv:le&&A(T.specularIntensityMap.channel),transmissionMapUv:he&&A(T.transmissionMap.channel),thicknessMapUv:k&&A(T.thicknessMap.channel),alphaMapUv:Et&&A(T.alphaMap.channel),vertexTangents:!!et.attributes.tangent&&(fe||W),vertexNormals:!!et.attributes.normal,vertexColors:T.vertexColors,vertexAlphas:T.vertexColors===!0&&!!et.attributes.color&&et.attributes.color.itemSize===4,pointsUvs:J.isPoints===!0&&!!et.attributes.uv&&(It||Et),fog:!!j,useFog:T.fog===!0,fogExp2:!!j&&j.isFogExp2,flatShading:T.wireframe===!1&&(T.flatShading===!0||et.attributes.normal===void 0&&fe===!1&&(T.isMeshLambertMaterial||T.isMeshPhongMaterial||T.isMeshStandardMaterial||T.isMeshPhysicalMaterial)),sizeAttenuation:T.sizeAttenuation===!0,logarithmicDepthBuffer:v,reversedDepthBuffer:Dt,skinning:J.isSkinnedMesh===!0,hasPositionAttribute:et.attributes.position!==void 0,morphTargets:et.morphAttributes.position!==void 0,morphNormals:et.morphAttributes.normal!==void 0,morphColors:et.morphAttributes.color!==void 0,morphTargetsCount:ie,morphTextureStride:ne,numSunLights:O.sun.length,numDirLights:O.directional.length,numPointLights:O.point.length,numSpotLights:O.spot.length,numSpotLightMaps:O.spotLightMap.length,numRectAreaLights:O.rectArea.length,numHemiLights:O.hemi.length,numSunLightShadows:O.sunShadowMap.length,numDirLightShadows:O.directionalShadowMap.length,numPointLightShadows:O.pointShadowMap.length,numSpotLightShadows:O.spotShadowMap.length,numSpotLightShadowsWithMaps:O.numSpotLightShadowsWithMaps,numLightProbes:O.numLightProbes,numLightProbeGrids:rt.length,numClippingPlanes:f.numPlanes,numClipIntersection:f.numIntersection,dithering:T.dithering,shadowMapEnabled:o.shadowMap.enabled&&V.length>0,shadowMapType:o.shadowMap.type,toneMapping:se,decodeVideoTexture:It&&T.map.isVideoTexture===!0&&Xe.getTransfer(T.map.colorSpace)===sn,decodeVideoTextureEmissive:ve&&T.emissiveMap.isVideoTexture===!0&&Xe.getTransfer(T.emissiveMap.colorSpace)===sn,premultipliedAlpha:T.premultipliedAlpha,doubleSided:T.side===Gi,flipSided:T.side===Ei,useDepthPacking:T.depthPacking>=0,depthPacking:T.depthPacking||0,index0AttributeName:T.index0AttributeName,extensionClipCullDistance:wt&&T.extensions.clipCullDistance===!0&&i.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(wt&&T.extensions.multiDraw===!0||Mt)&&i.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:i.has("KHR_parallel_shader_compile"),customProgramCacheKey:T.customProgramCacheKey()};return Yt.vertexUv1s=m.has(1),Yt.vertexUv2s=m.has(2),Yt.vertexUv3s=m.has(3),m.clear(),Yt}function y(T){const O=[];if(T.shaderID?O.push(T.shaderID):(O.push(T.customVertexShaderID),O.push(T.customFragmentShaderID)),T.defines!==void 0)for(const V in T.defines)O.push(V),O.push(T.defines[V]);return T.isRawShaderMaterial===!1&&(S(O,T),U(O,T),O.push(o.outputColorSpace)),O.push(T.customProgramCacheKey),O.join()}function S(T,O){T.push(O.precision),T.push(O.outputColorSpace),T.push(O.envMapMode),T.push(O.envMapCubeUVHeight),T.push(O.mapUv),T.push(O.alphaMapUv),T.push(O.lightMapUv),T.push(O.aoMapUv),T.push(O.bumpMapUv),T.push(O.normalMapUv),T.push(O.displacementMapUv),T.push(O.emissiveMapUv),T.push(O.metalnessMapUv),T.push(O.roughnessMapUv),T.push(O.anisotropyMapUv),T.push(O.clearcoatMapUv),T.push(O.clearcoatNormalMapUv),T.push(O.clearcoatRoughnessMapUv),T.push(O.iridescenceMapUv),T.push(O.iridescenceThicknessMapUv),T.push(O.sheenColorMapUv),T.push(O.sheenRoughnessMapUv),T.push(O.specularMapUv),T.push(O.specularColorMapUv),T.push(O.specularIntensityMapUv),T.push(O.transmissionMapUv),T.push(O.thicknessMapUv),T.push(O.combine),T.push(O.fogExp2),T.push(O.sizeAttenuation),T.push(O.morphTargetsCount),T.push(O.morphAttributeCount),T.push(O.numSunLights),T.push(O.numDirLights),T.push(O.numPointLights),T.push(O.numSpotLights),T.push(O.numSpotLightMaps),T.push(O.numHemiLights),T.push(O.numRectAreaLights),T.push(O.numSunLightShadows),T.push(O.numDirLightShadows),T.push(O.numPointLightShadows),T.push(O.numSpotLightShadows),T.push(O.numSpotLightShadowsWithMaps),T.push(O.numLightProbes),T.push(O.shadowMapType),T.push(O.toneMapping),T.push(O.numClippingPlanes),T.push(O.numClipIntersection),T.push(O.depthPacking)}function U(T,O){h.disableAll(),O.instancing&&h.enable(0),O.instancingColor&&h.enable(1),O.instancingMorph&&h.enable(2),O.matcap&&h.enable(3),O.envMap&&h.enable(4),O.normalMapObjectSpace&&h.enable(5),O.normalMapTangentSpace&&h.enable(6),O.clearcoat&&h.enable(7),O.iridescence&&h.enable(8),O.alphaTest&&h.enable(9),O.vertexColors&&h.enable(10),O.vertexAlphas&&h.enable(11),O.vertexUv1s&&h.enable(12),O.vertexUv2s&&h.enable(13),O.vertexUv3s&&h.enable(14),O.vertexTangents&&h.enable(15),O.anisotropy&&h.enable(16),O.alphaHash&&h.enable(17),O.batching&&h.enable(18),O.dispersion&&h.enable(19),O.retroreflection&&h.enable(24),O.batchingColor&&h.enable(20),O.gradientMap&&h.enable(21),O.packedNormalMap&&h.enable(22),O.vertexNormals&&h.enable(23),T.push(h.mask),h.disableAll(),O.fog&&h.enable(0),O.useFog&&h.enable(1),O.flatShading&&h.enable(2),O.logarithmicDepthBuffer&&h.enable(3),O.reversedDepthBuffer&&h.enable(4),O.skinning&&h.enable(5),O.morphTargets&&h.enable(6),O.morphNormals&&h.enable(7),O.morphColors&&h.enable(8),O.premultipliedAlpha&&h.enable(9),O.shadowMapEnabled&&h.enable(10),O.doubleSided&&h.enable(11),O.flipSided&&h.enable(12),O.useDepthPacking&&h.enable(13),O.dithering&&h.enable(14),O.transmission&&h.enable(15),O.sheen&&h.enable(16),O.opaque&&h.enable(17),O.pointsUvs&&h.enable(18),O.decodeVideoTexture&&h.enable(19),O.decodeVideoTextureEmissive&&h.enable(20),O.alphaToCoverage&&h.enable(21),O.numLightProbeGrids>0&&h.enable(22),O.hasPositionAttribute&&h.enable(23),T.push(h.mask)}function F(T){const O=M[T.type];let V;if(O){const Y=za[O];V=Jb.clone(Y.uniforms)}else V=T.uniforms;return V}function N(T,O){let V=x.get(O);return V!==void 0?++V.usedTimes:(V=new D2(o,O,T,l),p.push(V),x.set(O,V)),V}function L(T){if(--T.usedTimes===0){const O=p.indexOf(T);p[O]=p[p.length-1],p.pop(),x.delete(T.cacheKey),T.destroy()}}function D(T){d.remove(T)}function I(){d.dispose()}return{getParameters:C,getProgramCacheKey:y,getUniforms:F,acquireProgram:N,releaseProgram:L,releaseShaderCache:D,programs:p,dispose:I}}function z2(){let o=new WeakMap;function e(h){return o.has(h)}function i(h){let d=o.get(h);return d===void 0&&(d={},o.set(h,d)),d}function s(h){o.delete(h)}function l(h,d,m){o.get(h)[d]=m}function f(){o=new WeakMap}return{has:e,get:i,remove:s,update:l,dispose:f}}function B2(o,e){return o.groupOrder!==e.groupOrder?o.groupOrder-e.groupOrder:o.renderOrder!==e.renderOrder?o.renderOrder-e.renderOrder:o.material.id!==e.material.id?o.material.id-e.material.id:o.materialVariant!==e.materialVariant?o.materialVariant-e.materialVariant:o.z!==e.z?o.z-e.z:o.id-e.id}function $x(o,e){return o.groupOrder!==e.groupOrder?o.groupOrder-e.groupOrder:o.renderOrder!==e.renderOrder?o.renderOrder-e.renderOrder:o.z!==e.z?e.z-o.z:o.id-e.id}function tS(){const o=[];let e=0;const i=[],s=[],l=[];function f(){e=0,i.length=0,s.length=0,l.length=0}function h(g){let M=0;return g.isInstancedMesh&&(M+=2),g.isSkinnedMesh&&(M+=1),M}function d(g,M,A,C,y,S){let U=o[e];return U===void 0?(U={id:g.id,object:g,geometry:M,material:A,materialVariant:h(g),groupOrder:C,renderOrder:g.renderOrder,z:y,group:S},o[e]=U):(U.id=g.id,U.object=g,U.geometry=M,U.material=A,U.materialVariant=h(g),U.groupOrder=C,U.renderOrder=g.renderOrder,U.z=y,U.group=S),e++,U}function m(g,M,A,C,y,S,U){U.reversedDepth===!0&&(y=-y);const F=d(g,M,A,C,y,S);A.transmission>0?s.push(F):A.transparent===!0?l.push(F):i.push(F)}function p(g,M,A,C,y,S){const U=d(g,M,A,C,y,S);A.transmission>0?s.unshift(U):A.transparent===!0?l.unshift(U):i.unshift(U)}function x(g,M){i.length>1&&i.sort(g||B2),s.length>1&&s.sort(M||$x),l.length>1&&l.sort(M||$x)}function v(){for(let g=e,M=o.length;g<M;g++){const A=o[g];if(A.id===null)break;A.id=null,A.object=null,A.geometry=null,A.material=null,A.group=null}}return{opaque:i,transmissive:s,transparent:l,init:f,push:m,unshift:p,finish:v,sort:x}}function F2(){let o=new WeakMap;function e(s,l){const f=o.get(s);let h;return f===void 0?(h=new tS,o.set(s,[h])):l>=f.length?(h=new tS,f.push(h)):h=f[l],h}function i(){o=new WeakMap}return{get:e,dispose:i}}function H2(){const o={};return{get:function(e){if(o[e.id]!==void 0)return o[e.id];let i;switch(e.type){case"SunLight":case"DirectionalLight":i={direction:new X,color:new Ie};break;case"SpotLight":i={position:new X,direction:new X,color:new Ie,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":i={position:new X,color:new Ie,distance:0,decay:0};break;case"HemisphereLight":i={direction:new X,skyColor:new Ie,groundColor:new Ie};break;case"RectAreaLight":i={color:new Ie,position:new X,halfWidth:new X,halfHeight:new X};break}return o[e.id]=i,i}}}function G2(){const o={};return{get:function(e){if(o[e.id]!==void 0)return o[e.id];let i;switch(e.type){case"SunLight":case"DirectionalLight":i={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new _e};break;case"SpotLight":i={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new _e};break;case"PointLight":i={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new _e,shadowCameraNear:1,shadowCameraFar:1e3};break}return o[e.id]=i,i}}}let V2=0;function k2(o,e){return(e.castShadow?2:0)-(o.castShadow?2:0)+(e.map?1:0)-(o.map?1:0)}function X2(o){const e=new H2,i=G2(),s={version:0,hash:{sunLength:-1,directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numSunShadows:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],sun:[],sunShadow:[],sunShadowMap:[],sunShadowMatrix:[],sunShadowCascade:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let p=0;p<9;p++)s.probe.push(new X);const l=new X,f=new gn,h=new gn;function d(p){let x=0,v=0,g=0;for(let J=0;J<9;J++)s.probe[J].set(0,0,0);let M=0,A=0,C=0,y=0,S=0,U=0,F=0,N=0,L=0,D=0,I=0,T=0,O=0,V=0;p.sort(k2);for(let J=0,rt=p.length;J<rt;J++){const j=p[J],et=j.color,q=j.intensity,Z=j.distance;let ht=null;if(j.shadow&&j.shadow.map&&(j.shadow.map.texture.format===Pr?ht=j.shadow.map.texture:ht=j.shadow.map.depthTexture||j.shadow.map.texture),j.isAmbientLight)x+=et.r*q,v+=et.g*q,g+=et.b*q;else if(j.isLightProbe){for(let ct=0;ct<9;ct++)s.probe[ct].addScaledVector(j.sh.coefficients[ct],q);V++}else if(j.isSunLight){const ct=e.get(j);if(ct.color.copy(j.color).multiplyScalar(j.intensity),j.castShadow){const gt=j.shadow,vt=i.get(j);vt.shadowIntensity=gt.intensity,vt.shadowBias=gt.bias,vt.shadowNormalBias=gt.normalBias,vt.shadowRadius=gt.radius,vt.shadowMapSize.copy(gt.mapSize).multiply(gt.getFrameExtents()),s.sunShadow[A]=vt,s.sunShadowMap[A]=ht;const ie=gt.getViewportCount();for(let ne=0;ne<ie;ne++)s.sunShadowMatrix[C+ne]=gt.getMatrix(ne),s.sunShadowCascade[C+ne]=gt._cascadeData[ne];C+=ie,A++}s.sun[M]=ct,M++}else if(j.isDirectionalLight){const ct=e.get(j);if(ct.color.copy(j.color).multiplyScalar(j.intensity),j.castShadow){const gt=j.shadow,vt=i.get(j);vt.shadowIntensity=gt.intensity,vt.shadowBias=gt.bias,vt.shadowNormalBias=gt.normalBias,vt.shadowRadius=gt.radius,vt.shadowMapSize=gt.mapSize,s.directionalShadow[y]=vt,s.directionalShadowMap[y]=ht,s.directionalShadowMatrix[y]=j.shadow.matrix,L++}s.directional[y]=ct,y++}else if(j.isSpotLight){const ct=e.get(j);ct.position.setFromMatrixPosition(j.matrixWorld),ct.color.copy(et).multiplyScalar(q),ct.distance=Z,ct.coneCos=Math.cos(j.angle),ct.penumbraCos=Math.cos(j.angle*(1-j.penumbra)),ct.decay=j.decay,s.spot[U]=ct;const gt=j.shadow;if(j.map&&(s.spotLightMap[T]=j.map,T++,gt.updateMatrices(j),j.castShadow&&O++),s.spotLightMatrix[U]=gt.matrix,j.castShadow){const vt=i.get(j);vt.shadowIntensity=gt.intensity,vt.shadowBias=gt.bias,vt.shadowNormalBias=gt.normalBias,vt.shadowRadius=gt.radius,vt.shadowMapSize=gt.mapSize,s.spotShadow[U]=vt,s.spotShadowMap[U]=ht,I++}U++}else if(j.isRectAreaLight){const ct=e.get(j);ct.color.copy(et).multiplyScalar(q),ct.halfWidth.set(j.width*.5,0,0),ct.halfHeight.set(0,j.height*.5,0),s.rectArea[F]=ct,F++}else if(j.isPointLight){const ct=e.get(j);if(ct.color.copy(j.color).multiplyScalar(j.intensity),ct.distance=j.distance,ct.decay=j.decay,j.castShadow){const gt=j.shadow,vt=i.get(j);vt.shadowIntensity=gt.intensity,vt.shadowBias=gt.bias,vt.shadowNormalBias=gt.normalBias,vt.shadowRadius=gt.radius,vt.shadowMapSize=gt.mapSize,vt.shadowCameraNear=gt.camera.near,vt.shadowCameraFar=gt.camera.far,s.pointShadow[S]=vt,s.pointShadowMap[S]=ht,s.pointShadowMatrix[S]=j.shadow.matrix,D++}s.point[S]=ct,S++}else if(j.isHemisphereLight){const ct=e.get(j);ct.skyColor.copy(j.color).multiplyScalar(q),ct.groundColor.copy(j.groundColor).multiplyScalar(q),s.hemi[N]=ct,N++}}F>0&&(o.has("OES_texture_float_linear")===!0?(s.rectAreaLTC1=Zt.LTC_FLOAT_1,s.rectAreaLTC2=Zt.LTC_FLOAT_2):(s.rectAreaLTC1=Zt.LTC_HALF_1,s.rectAreaLTC2=Zt.LTC_HALF_2)),s.ambient[0]=x,s.ambient[1]=v,s.ambient[2]=g;const Y=s.hash;(Y.sunLength!==M||Y.directionalLength!==y||Y.pointLength!==S||Y.spotLength!==U||Y.rectAreaLength!==F||Y.hemiLength!==N||Y.numSunShadows!==A||Y.numDirectionalShadows!==L||Y.numPointShadows!==D||Y.numSpotShadows!==I||Y.numSpotMaps!==T||Y.numLightProbes!==V)&&(s.sun.length=M,s.directional.length=y,s.spot.length=U,s.rectArea.length=F,s.point.length=S,s.hemi.length=N,s.sunShadow.length=A,s.sunShadowMap.length=A,s.sunShadowMatrix.length=C,s.sunShadowCascade.length=C,s.directionalShadow.length=L,s.directionalShadowMap.length=L,s.directionalShadowMatrix.length=L,s.pointShadow.length=D,s.pointShadowMap.length=D,s.pointShadowMatrix.length=D,s.spotShadow.length=I,s.spotShadowMap.length=I,s.spotLightMatrix.length=I+T-O,s.spotLightMap.length=T,s.numSpotLightShadowsWithMaps=O,s.numLightProbes=V,Y.sunLength=M,Y.directionalLength=y,Y.pointLength=S,Y.spotLength=U,Y.rectAreaLength=F,Y.hemiLength=N,Y.numSunShadows=A,Y.numDirectionalShadows=L,Y.numPointShadows=D,Y.numSpotShadows=I,Y.numSpotMaps=T,Y.numLightProbes=V,s.version=V2++)}function m(p,x){let v=0,g=0,M=0,A=0,C=0,y=0;const S=x.matrixWorldInverse;for(let U=0,F=p.length;U<F;U++){const N=p[U];if(N.isSunLight){const L=s.sun[v];L.direction.setFromMatrixPosition(N.matrixWorld),L.direction.transformDirection(S),v++}else if(N.isDirectionalLight){const L=s.directional[g];L.direction.setFromMatrixPosition(N.matrixWorld),l.setFromMatrixPosition(N.target.matrixWorld),L.direction.sub(l),L.direction.transformDirection(S),g++}else if(N.isSpotLight){const L=s.spot[A];L.position.setFromMatrixPosition(N.matrixWorld),L.position.applyMatrix4(S),L.direction.setFromMatrixPosition(N.matrixWorld),l.setFromMatrixPosition(N.target.matrixWorld),L.direction.sub(l),L.direction.transformDirection(S),A++}else if(N.isRectAreaLight){const L=s.rectArea[C];L.position.setFromMatrixPosition(N.matrixWorld),L.position.applyMatrix4(S),h.identity(),f.copy(N.matrixWorld),f.premultiply(S),h.extractRotation(f),L.halfWidth.set(N.width*.5,0,0),L.halfHeight.set(0,N.height*.5,0),L.halfWidth.applyMatrix4(h),L.halfHeight.applyMatrix4(h),C++}else if(N.isPointLight){const L=s.point[M];L.position.setFromMatrixPosition(N.matrixWorld),L.position.applyMatrix4(S),M++}else if(N.isHemisphereLight){const L=s.hemi[y];L.direction.setFromMatrixPosition(N.matrixWorld),L.direction.transformDirection(S),y++}}}return{setup:d,setupView:m,state:s}}function eS(o){const e=new X2(o),i=[],s=[],l=[];function f(g){v.camera=g,i.length=0,s.length=0,l.length=0}function h(g){i.push(g)}function d(g){s.push(g)}function m(g){l.push(g)}function p(){e.setup(i)}function x(g){e.setupView(i,g)}const v={lightsArray:i,shadowsArray:s,lightProbeGridArray:l,camera:null,lights:e,transmissionRenderTarget:{},textureUnits:0};return{init:f,state:v,setupLights:p,setupLightsView:x,pushLight:h,pushShadow:d,pushLightProbeGrid:m}}function W2(o){let e=new WeakMap;function i(l,f=0){const h=e.get(l);let d;return h===void 0?(d=new eS(o),e.set(l,[d])):f>=h.length?(d=new eS(o),h.push(d)):d=h[f],d}function s(){e=new WeakMap}return{get:i,dispose:s}}const Y2=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,q2=`uniform sampler2D shadow_pass;
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
}`,j2=[new X(1,0,0),new X(-1,0,0),new X(0,1,0),new X(0,-1,0),new X(0,0,1),new X(0,0,-1)],Z2=[new X(0,-1,0),new X(0,-1,0),new X(0,0,1),new X(0,0,-1),new X(0,-1,0),new X(0,-1,0)],nS=new gn,Xl=new X,bp=new X;function K2(o,e,i){let s=new Dm;const l=new _e,f=new _e,h=new vn,d=new nT,m=new iT,p={},x=i.maxTextureSize,v={[Lr]:Ei,[Ei]:Lr,[Gi]:Gi},g=new ka({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new _e},radius:{value:4}},vertexShader:Y2,fragmentShader:q2}),M=g.clone();M.defines.HORIZONTAL_PASS=1;const A=new bi;A.setAttribute("position",new _s(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));const C=new Me(A,g),y=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=ql;let S=this.type;this.render=function(D,I,T){if(y.enabled===!1||y.autoUpdate===!1&&y.needsUpdate===!1||D.length===0)return;this.type===GE&&(ge("WebGLShadowMap: PCFSoftShadowMap has been removed. Using PCFShadowMap instead."),this.type=ql);const O=o.getRenderTarget(),V=o.getActiveCubeFace(),Y=o.getActiveMipmapLevel(),J=o.state;J.setBlending(ms),J.buffers.depth.getReversed()===!0?J.buffers.color.setClear(0,0,0,0):J.buffers.color.setClear(1,1,1,1),J.buffers.depth.setTest(!0),J.setScissorTest(!1);const rt=S!==this.type;rt&&I.traverse(function(j){j.material&&(Array.isArray(j.material)?j.material.forEach(et=>et.needsUpdate=!0):j.material.needsUpdate=!0)});for(let j=0,et=D.length;j<et;j++){const q=D[j],Z=q.shadow;if(Z===void 0){ge("WebGLShadowMap:",q,"has no shadow.");continue}if(Z.autoUpdate===!1&&Z.needsUpdate===!1)continue;l.copy(Z.mapSize);const ht=Z.getFrameExtents();l.multiply(ht),f.copy(Z.mapSize),(l.x>x||l.y>x)&&(l.x>x&&(f.x=Math.floor(x/ht.x),l.x=f.x*ht.x,Z.mapSize.x=f.x),l.y>x&&(f.y=Math.floor(x/ht.y),l.y=f.y*ht.y,Z.mapSize.y=f.y));const ct=o.state.buffers.depth.getReversed();if(Z.camera._reversedDepth=ct,Z.map===null||rt===!0){if(Z.map!==null&&(Z.map.depthTexture!==null&&(Z.map.depthTexture.dispose(),Z.map.depthTexture=null),Z.map.dispose()),this.type===Wl){if(q.isPointLight){ge("WebGLShadowMap: VSM shadow maps are not supported for PointLights. Use PCF or BasicShadowMap instead.");continue}Z.map=new va(l.x,l.y,{format:Pr,type:Va,minFilter:ri,magFilter:ri,generateMipmaps:!1}),Z.map.texture.name=q.name+".shadowMap",Z.map.depthTexture=new ec(l.x,l.y,Ba),Z.map.depthTexture.name=q.name+".shadowMapDepth",Z.map.depthTexture.format=vs,Z.map.depthTexture.compareFunction=null,Z.map.depthTexture.minFilter=ei,Z.map.depthTexture.magFilter=ei}else q.isPointLight?(Z.map=new HS(l.x),Z.map.depthTexture=new Zb(l.x,Ga)):(Z.map=new va(l.x,l.y),Z.map.depthTexture=new ec(l.x,l.y,Ga)),Z.map.depthTexture.name=q.name+".shadowMap",Z.map.depthTexture.format=vs,this.type===ql?(Z.map.depthTexture.compareFunction=ct?Rm:Am,Z.map.depthTexture.minFilter=ri,Z.map.depthTexture.magFilter=ri):(Z.map.depthTexture.compareFunction=null,Z.map.depthTexture.minFilter=ei,Z.map.depthTexture.magFilter=ei);Z.camera.updateProjectionMatrix()}Z.map.isWebGLCubeRenderTarget!==!0&&(Z.map.width!==l.x||Z.map.height!==l.y)&&Z.map.setSize(l.x,l.y);const gt=Z.map.isWebGLCubeRenderTarget?6:Z.getViewportCount();q.isPointLight!==!0&&Z.updateMatrices(q,T);for(let vt=0;vt<gt;vt++){const ie=Z.getCamera(vt);if(q.isPointLight){const ne=Z.camera,B=Z.matrix,xt=q.distance||ne.far;xt!==ne.far&&(ne.far=xt,ne.updateProjectionMatrix()),Xl.setFromMatrixPosition(q.matrixWorld),ne.position.copy(Xl),bp.copy(ne.position),bp.add(j2[vt]),ne.up.copy(Z2[vt]),ne.lookAt(bp),ne.updateMatrixWorld(),B.makeTranslation(-Xl.x,-Xl.y,-Xl.z),nS.multiplyMatrices(ne.projectionMatrix,ne.matrixWorldInverse),Z._frustum.setFromProjectionMatrix(nS,ne.coordinateSystem,ne.reversedDepth)}if(Z.map.isWebGLCubeRenderTarget)o.setRenderTarget(Z.map,vt),o.clear();else{vt===0&&(o.setRenderTarget(Z.map),o.clear());const ne=Z.getViewport(vt);h.set(f.x*ne.x,f.y*ne.y,f.x*ne.z,f.y*ne.w),J.viewport(h)}s=Z.getFrustum(vt),N(I,T,ie,q,this.type)}Z.isPointLightShadow!==!0&&this.type===Wl&&U(Z,T),Z.needsUpdate=!1}S=this.type,y.needsUpdate=!1,o.setRenderTarget(O,V,Y)};function U(D,I){const T=e.update(C);g.defines.VSM_SAMPLES!==D.blurSamples&&(g.defines.VSM_SAMPLES=D.blurSamples,M.defines.VSM_SAMPLES=D.blurSamples,g.needsUpdate=!0,M.needsUpdate=!0),D.mapPass===null?D.mapPass=new va(l.x,l.y,{format:Pr,type:Va}):(D.mapPass.width!==D.map.width||D.mapPass.height!==D.map.height)&&D.mapPass.setSize(D.map.width,D.map.height),g.uniforms.shadow_pass.value=D.map.depthTexture,g.uniforms.resolution.value.set(D.map.width,D.map.height),g.uniforms.radius.value=D.radius,o.setRenderTarget(D.mapPass),o.clear(),o.renderBufferDirect(I,null,T,g,C,null),M.uniforms.shadow_pass.value=D.mapPass.texture,M.uniforms.resolution.value.set(D.map.width,D.map.height),M.uniforms.radius.value=D.radius,o.setRenderTarget(D.map),o.clear(),o.renderBufferDirect(I,null,T,M,C,null)}function F(D,I,T,O){let V=null;const Y=T.isPointLight===!0?D.customDistanceMaterial:D.customDepthMaterial;if(Y!==void 0)V=Y;else if(V=T.isPointLight===!0?m:d,o.localClippingEnabled&&I.clipShadows===!0&&Array.isArray(I.clippingPlanes)&&I.clippingPlanes.length!==0||I.displacementMap&&I.displacementScale!==0||I.alphaMap&&I.alphaTest>0||I.map&&I.alphaTest>0||I.alphaToCoverage===!0){const J=V.uuid,rt=I.uuid;let j=p[J];j===void 0&&(j={},p[J]=j);let et=j[rt];et===void 0&&(et=V.clone(),j[rt]=et,I.addEventListener("dispose",L)),V=et}if(V.visible=I.visible,V.wireframe=I.wireframe,O===Wl?V.side=I.shadowSide!==null?I.shadowSide:I.side:V.side=I.shadowSide!==null?I.shadowSide:v[I.side],V.alphaMap=I.alphaMap,V.alphaTest=I.alphaToCoverage===!0?.5:I.alphaTest,V.map=I.map,V.clipShadows=I.clipShadows,V.clippingPlanes=I.clippingPlanes,V.clipIntersection=I.clipIntersection,V.displacementMap=I.displacementMap,V.displacementScale=I.displacementScale,V.displacementBias=I.displacementBias,V.wireframeLinewidth=I.wireframeLinewidth,V.linewidth=I.linewidth,T.isPointLight===!0&&V.isMeshDistanceMaterial===!0){const J=o.properties.get(V);J.light=T}return V}function N(D,I,T,O,V){if(D.visible===!1)return;if(D.layers.test(I.layers)&&(D.isMesh||D.isLine||D.isPoints)&&(D.castShadow||D.receiveShadow&&V===Wl)&&(!D.frustumCulled||D.intersectsFrustum(s))){D.modelViewMatrix.multiplyMatrices(T.matrixWorldInverse,D.matrixWorld);const rt=e.update(D),j=D.material;if(Array.isArray(j)){const et=rt.groups;for(let q=0,Z=et.length;q<Z;q++){const ht=et[q],ct=j[ht.materialIndex];if(ct&&ct.visible){const gt=F(D,ct,O,V);D.onBeforeShadow(o,D,I,T,rt,gt,ht),o.renderBufferDirect(T,null,rt,gt,D,ht),D.onAfterShadow(o,D,I,T,rt,gt,ht)}}}else if(j.visible){const et=F(D,j,O,V);D.onBeforeShadow(o,D,I,T,rt,et,null),o.renderBufferDirect(T,null,rt,et,D,null),D.onAfterShadow(o,D,I,T,rt,et,null)}}const J=D.children;for(let rt=0,j=J.length;rt<j;rt++)N(J[rt],I,T,O,V)}function L(D){D.target.removeEventListener("dispose",L);for(const T in p){const O=p[T],V=D.target.uuid;V in O&&(O[V].dispose(),delete O[V])}}}function Q2(o,e){function i(){let k=!1;const Ot=new vn;let Et=null;const Gt=new vn(0,0,0,0);return{setMask:function(jt){Et!==jt&&!k&&(o.colorMask(jt,jt,jt,jt),Et=jt)},setLocked:function(jt){k=jt},setClear:function(jt,wt,se,Yt,Le){Le===!0&&(jt*=Yt,wt*=Yt,se*=Yt),Ot.set(jt,wt,se,Yt),Gt.equals(Ot)===!1&&(o.clearColor(jt,wt,se,Yt),Gt.copy(Ot))},reset:function(){k=!1,Et=null,Gt.set(-1,0,0,0)}}}function s(){let k=!1,Ot=!1,Et=null,Gt=null,jt=null;return{setReversed:function(wt){if(Ot!==wt){const se=e.get("EXT_clip_control");wt?se.clipControlEXT(se.LOWER_LEFT_EXT,se.ZERO_TO_ONE_EXT):se.clipControlEXT(se.LOWER_LEFT_EXT,se.NEGATIVE_ONE_TO_ONE_EXT),Ot=wt;const Yt=jt;jt=null,this.setClear(Yt)}},getReversed:function(){return Ot},setTest:function(wt){wt?dt(o.DEPTH_TEST):Dt(o.DEPTH_TEST)},setMask:function(wt){Et!==wt&&!k&&(o.depthMask(wt),Et=wt)},setFunc:function(wt){if(Ot&&(wt=Mb[wt]),Gt!==wt){switch(wt){case Ap:o.depthFunc(o.NEVER);break;case Rp:o.depthFunc(o.ALWAYS);break;case wp:o.depthFunc(o.LESS);break;case Ql:o.depthFunc(o.LEQUAL);break;case Cp:o.depthFunc(o.EQUAL);break;case Np:o.depthFunc(o.GEQUAL);break;case Dp:o.depthFunc(o.GREATER);break;case Up:o.depthFunc(o.NOTEQUAL);break;default:o.depthFunc(o.LEQUAL)}Gt=wt}},setLocked:function(wt){k=wt},setClear:function(wt){jt!==wt&&(jt=wt,Ot&&(wt=1-wt),o.clearDepth(wt))},reset:function(){k=!1,Et=null,Gt=null,jt=null,Ot=!1}}}function l(){let k=!1,Ot=null,Et=null,Gt=null,jt=null,wt=null,se=null,Yt=null,Le=null;return{setTest:function(xe){k||(xe?dt(o.STENCIL_TEST):Dt(o.STENCIL_TEST))},setMask:function(xe){Ot!==xe&&!k&&(o.stencilMask(xe),Ot=xe)},setFunc:function(xe,ni,In){(Et!==xe||Gt!==ni||jt!==In)&&(o.stencilFunc(xe,ni,In),Et=xe,Gt=ni,jt=In)},setOp:function(xe,ni,In){(wt!==xe||se!==ni||Yt!==In)&&(o.stencilOp(xe,ni,In),wt=xe,se=ni,Yt=In)},setLocked:function(xe){k=xe},setClear:function(xe){Le!==xe&&(o.clearStencil(xe),Le=xe)},reset:function(){k=!1,Ot=null,Et=null,Gt=null,jt=null,wt=null,se=null,Yt=null,Le=null}}}const f=new i,h=new s,d=new l,m=new WeakMap,p=new WeakMap;let x={},v={},g={},M=new WeakMap,A=[],C=null,y=!1,S=null,U=null,F=null,N=null,L=null,D=null,I=null,T=new Ie(0,0,0),O=0,V=!1,Y=null,J=null,rt=null,j=null,et=null;const q=o.getParameter(o.MAX_COMBINED_TEXTURE_IMAGE_UNITS);let Z=!1,ht=0;const ct=o.getParameter(o.VERSION);ct.indexOf("WebGL")!==-1?(ht=parseFloat(/^WebGL (\d)/.exec(ct)[1]),Z=ht>=1):ct.indexOf("OpenGL ES")!==-1&&(ht=parseFloat(/^OpenGL ES (\d)/.exec(ct)[1]),Z=ht>=2);let gt=null,vt={};const ie=o.getParameter(o.SCISSOR_BOX),ne=o.getParameter(o.VIEWPORT),B=new vn().fromArray(ie),xt=new vn().fromArray(ne);function Nt(k,Ot,Et,Gt){const jt=new Uint8Array(4),wt=o.createTexture();o.bindTexture(k,wt),o.texParameteri(k,o.TEXTURE_MIN_FILTER,o.NEAREST),o.texParameteri(k,o.TEXTURE_MAG_FILTER,o.NEAREST);for(let se=0;se<Et;se++)k===o.TEXTURE_3D||k===o.TEXTURE_2D_ARRAY?o.texImage3D(Ot,0,o.RGBA,1,1,Gt,0,o.RGBA,o.UNSIGNED_BYTE,jt):o.texImage2D(Ot+se,0,o.RGBA,1,1,0,o.RGBA,o.UNSIGNED_BYTE,jt);return wt}const Q={};Q[o.TEXTURE_2D]=Nt(o.TEXTURE_2D,o.TEXTURE_2D,1),Q[o.TEXTURE_CUBE_MAP]=Nt(o.TEXTURE_CUBE_MAP,o.TEXTURE_CUBE_MAP_POSITIVE_X,6),Q[o.TEXTURE_2D_ARRAY]=Nt(o.TEXTURE_2D_ARRAY,o.TEXTURE_2D_ARRAY,1,1),Q[o.TEXTURE_3D]=Nt(o.TEXTURE_3D,o.TEXTURE_3D,1,1),f.setClear(0,0,0,1),h.setClear(1),d.setClear(0),dt(o.DEPTH_TEST),h.setFunc(Ql),ce(!1),fe(Jv),dt(o.CULL_FACE),Te(ms);function dt(k){x[k]!==!0&&(o.enable(k),x[k]=!0)}function Dt(k){x[k]!==!1&&(o.disable(k),x[k]=!1)}function Wt(k,Ot){return g[k]!==Ot?(o.bindFramebuffer(k,Ot),g[k]=Ot,k===o.DRAW_FRAMEBUFFER&&(g[o.FRAMEBUFFER]=Ot),k===o.FRAMEBUFFER&&(g[o.DRAW_FRAMEBUFFER]=Ot),!0):!1}function Mt(k,Ot){let Et=A,Gt=!1;if(k){Et=M.get(Ot),Et===void 0&&(Et=[],M.set(Ot,Et));const jt=k.textures;if(Et.length!==jt.length||Et[0]!==o.COLOR_ATTACHMENT0){for(let wt=0,se=jt.length;wt<se;wt++)Et[wt]=o.COLOR_ATTACHMENT0+wt;Et.length=jt.length,Gt=!0}}else Et[0]!==o.BACK&&(Et[0]=o.BACK,Gt=!0);Gt&&o.drawBuffers(Et)}function It(k){return C!==k?(o.useProgram(k),C=k,!0):!1}const Ze={[Io]:o.FUNC_ADD,[kE]:o.FUNC_SUBTRACT,[XE]:o.FUNC_REVERSE_SUBTRACT};Ze[WE]=o.MIN,Ze[YE]=o.MAX;const Ee={[qE]:o.ZERO,[jE]:o.ONE,[ZE]:o.SRC_COLOR,[cS]:o.SRC_ALPHA,[eb]:o.SRC_ALPHA_SATURATE,[$E]:o.DST_COLOR,[QE]:o.DST_ALPHA,[KE]:o.ONE_MINUS_SRC_COLOR,[uS]:o.ONE_MINUS_SRC_ALPHA,[tb]:o.ONE_MINUS_DST_COLOR,[JE]:o.ONE_MINUS_DST_ALPHA,[nb]:o.CONSTANT_COLOR,[ib]:o.ONE_MINUS_CONSTANT_COLOR,[ab]:o.CONSTANT_ALPHA,[sb]:o.ONE_MINUS_CONSTANT_ALPHA};function Te(k,Ot,Et,Gt,jt,wt,se,Yt,Le,xe){if(k===ms){y===!0&&(Dt(o.BLEND),y=!1);return}if(y===!1&&(dt(o.BLEND),y=!0),k!==VE){if(k!==S||xe!==V){if((U!==Io||L!==Io)&&(o.blendEquation(o.FUNC_ADD),U=Io,L=Io),xe)switch(k){case jl:o.blendFuncSeparate(o.ONE,o.ONE_MINUS_SRC_ALPHA,o.ONE,o.ONE_MINUS_SRC_ALPHA);break;case $v:o.blendFunc(o.ONE,o.ONE);break;case tx:o.blendFuncSeparate(o.ZERO,o.ONE_MINUS_SRC_COLOR,o.ZERO,o.ONE);break;case ex:o.blendFuncSeparate(o.DST_COLOR,o.ONE_MINUS_SRC_ALPHA,o.ZERO,o.ONE);break;default:je("WebGLState: Invalid blending: ",k);break}else switch(k){case jl:o.blendFuncSeparate(o.SRC_ALPHA,o.ONE_MINUS_SRC_ALPHA,o.ONE,o.ONE_MINUS_SRC_ALPHA);break;case $v:o.blendFuncSeparate(o.SRC_ALPHA,o.ONE,o.ONE,o.ONE);break;case tx:je("WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true");break;case ex:je("WebGLState: MultiplyBlending requires material.premultipliedAlpha = true");break;default:je("WebGLState: Invalid blending: ",k);break}F=null,N=null,D=null,I=null,T.set(0,0,0),O=0,S=k,V=xe}return}jt=jt||Ot,wt=wt||Et,se=se||Gt,(Ot!==U||jt!==L)&&(o.blendEquationSeparate(Ze[Ot],Ze[jt]),U=Ot,L=jt),(Et!==F||Gt!==N||wt!==D||se!==I)&&(o.blendFuncSeparate(Ee[Et],Ee[Gt],Ee[wt],Ee[se]),F=Et,N=Gt,D=wt,I=se),(Yt.equals(T)===!1||Le!==O)&&(o.blendColor(Yt.r,Yt.g,Yt.b,Le),T.copy(Yt),O=Le),S=k,V=!1}function Ce(k,Ot){k.side===Gi?Dt(o.CULL_FACE):dt(o.CULL_FACE);let Et=k.side===Ei;Ot&&(Et=!Et),ce(Et),k.blending===jl&&k.transparent===!1?Te(ms):Te(k.blending,k.blendEquation,k.blendSrc,k.blendDst,k.blendEquationAlpha,k.blendSrcAlpha,k.blendDstAlpha,k.blendColor,k.blendAlpha,k.premultipliedAlpha),h.setFunc(k.depthFunc),h.setTest(k.depthTest),h.setMask(k.depthWrite),f.setMask(k.colorWrite);const Gt=k.stencilWrite;d.setTest(Gt),Gt&&(d.setMask(k.stencilWriteMask),d.setFunc(k.stencilFunc,k.stencilRef,k.stencilFuncMask),d.setOp(k.stencilFail,k.stencilZFail,k.stencilZPass)),ve(k.polygonOffset,k.polygonOffsetFactor,k.polygonOffsetUnits),k.alphaToCoverage===!0?dt(o.SAMPLE_ALPHA_TO_COVERAGE):Dt(o.SAMPLE_ALPHA_TO_COVERAGE)}function ce(k){Y!==k&&(k?o.frontFace(o.CW):o.frontFace(o.CCW),Y=k)}function fe(k){k!==FE?(dt(o.CULL_FACE),k!==J&&(k===Jv?o.cullFace(o.BACK):k===HE?o.cullFace(o.FRONT):o.cullFace(o.FRONT_AND_BACK))):Dt(o.CULL_FACE),J=k}function Ke(k){k!==rt&&(Z&&o.lineWidth(k),rt=k)}function ve(k,Ot,Et){k?(dt(o.POLYGON_OFFSET_FILL),(j!==Ot||et!==Et)&&(j=Ot,et=Et,h.getReversed()&&(Ot=-Ot),o.polygonOffset(Ot,Et))):Dt(o.POLYGON_OFFSET_FILL)}function We(k){k?dt(o.SCISSOR_TEST):Dt(o.SCISSOR_TEST)}function on(k){k===void 0&&(k=o.TEXTURE0+q-1),gt!==k&&(o.activeTexture(k),gt=k)}function W(k,Ot,Et){Et===void 0&&(gt===null?Et=o.TEXTURE0+q-1:Et=gt);let Gt=vt[Et];Gt===void 0&&(Gt={type:void 0,texture:void 0},vt[Et]=Gt),(Gt.type!==k||Gt.texture!==Ot)&&(gt!==Et&&(o.activeTexture(Et),gt=Et),o.bindTexture(k,Ot||Q[k]),Gt.type=k,Gt.texture=Ot)}function un(){const k=vt[gt];k!==void 0&&k.type!==void 0&&(o.bindTexture(k.type,null),k.type=void 0,k.texture=void 0)}function Ue(){try{o.compressedTexImage2D(...arguments)}catch(k){je("WebGLState:",k)}}function P(){try{o.compressedTexImage3D(...arguments)}catch(k){je("WebGLState:",k)}}function E(){try{o.texSubImage2D(...arguments)}catch(k){je("WebGLState:",k)}}function nt(){try{o.texSubImage3D(...arguments)}catch(k){je("WebGLState:",k)}}function ot(){try{o.compressedTexSubImage2D(...arguments)}catch(k){je("WebGLState:",k)}}function _t(){try{o.compressedTexSubImage3D(...arguments)}catch(k){je("WebGLState:",k)}}function At(){try{o.texStorage2D(...arguments)}catch(k){je("WebGLState:",k)}}function Ut(){try{o.texStorage3D(...arguments)}catch(k){je("WebGLState:",k)}}function pt(){try{o.texImage2D(...arguments)}catch(k){je("WebGLState:",k)}}function St(){try{o.texImage3D(...arguments)}catch(k){je("WebGLState:",k)}}function Ft(k){return v[k]!==void 0?v[k]:o.getParameter(k)}function ae(k,Ot){v[k]!==Ot&&(o.pixelStorei(k,Ot),v[k]=Ot)}function Ht(k){B.equals(k)===!1&&(o.scissor(k.x,k.y,k.z,k.w),B.copy(k))}function zt(k){xt.equals(k)===!1&&(o.viewport(k.x,k.y,k.z,k.w),xt.copy(k))}function Kt(k,Ot){let Et=p.get(Ot);Et===void 0&&(Et=new WeakMap,p.set(Ot,Et));let Gt=Et.get(k);Gt===void 0&&(Gt=o.getUniformBlockIndex(Ot,k.name),Et.set(k,Gt))}function le(k,Ot){const Gt=p.get(Ot).get(k);m.get(Ot)!==Gt&&(o.uniformBlockBinding(Ot,Gt,k.__bindingPointIndex),m.set(Ot,Gt))}function he(){o.disable(o.BLEND),o.disable(o.CULL_FACE),o.disable(o.DEPTH_TEST),o.disable(o.POLYGON_OFFSET_FILL),o.disable(o.SCISSOR_TEST),o.disable(o.STENCIL_TEST),o.disable(o.SAMPLE_ALPHA_TO_COVERAGE),o.blendEquation(o.FUNC_ADD),o.blendFunc(o.ONE,o.ZERO),o.blendFuncSeparate(o.ONE,o.ZERO,o.ONE,o.ZERO),o.blendColor(0,0,0,0),o.colorMask(!0,!0,!0,!0),o.clearColor(0,0,0,0),o.depthMask(!0),o.depthFunc(o.LESS),h.setReversed(!1),o.clearDepth(1),o.stencilMask(4294967295),o.stencilFunc(o.ALWAYS,0,4294967295),o.stencilOp(o.KEEP,o.KEEP,o.KEEP),o.clearStencil(0),o.cullFace(o.BACK),o.frontFace(o.CCW),o.polygonOffset(0,0),o.activeTexture(o.TEXTURE0),o.bindFramebuffer(o.FRAMEBUFFER,null),o.bindFramebuffer(o.DRAW_FRAMEBUFFER,null),o.bindFramebuffer(o.READ_FRAMEBUFFER,null),o.useProgram(null),o.lineWidth(1),o.scissor(0,0,o.canvas.width,o.canvas.height),o.viewport(0,0,o.canvas.width,o.canvas.height),o.pixelStorei(o.PACK_ALIGNMENT,4),o.pixelStorei(o.UNPACK_ALIGNMENT,4),o.pixelStorei(o.UNPACK_FLIP_Y_WEBGL,!1),o.pixelStorei(o.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),o.pixelStorei(o.UNPACK_COLORSPACE_CONVERSION_WEBGL,o.BROWSER_DEFAULT_WEBGL),o.pixelStorei(o.PACK_ROW_LENGTH,0),o.pixelStorei(o.PACK_SKIP_PIXELS,0),o.pixelStorei(o.PACK_SKIP_ROWS,0),o.pixelStorei(o.UNPACK_ROW_LENGTH,0),o.pixelStorei(o.UNPACK_IMAGE_HEIGHT,0),o.pixelStorei(o.UNPACK_SKIP_PIXELS,0),o.pixelStorei(o.UNPACK_SKIP_ROWS,0),o.pixelStorei(o.UNPACK_SKIP_IMAGES,0),x={},v={},gt=null,vt={},g={},M=new WeakMap,A=[],C=null,y=!1,S=null,U=null,F=null,N=null,L=null,D=null,I=null,T=new Ie(0,0,0),O=0,V=!1,Y=null,J=null,rt=null,j=null,et=null,B.set(0,0,o.canvas.width,o.canvas.height),xt.set(0,0,o.canvas.width,o.canvas.height),f.reset(),h.reset(),d.reset()}return{buffers:{color:f,depth:h,stencil:d},enable:dt,disable:Dt,bindFramebuffer:Wt,drawBuffers:Mt,useProgram:It,setBlending:Te,setMaterial:Ce,setFlipSided:ce,setCullFace:fe,setLineWidth:Ke,setPolygonOffset:ve,setScissorTest:We,activeTexture:on,bindTexture:W,unbindTexture:un,compressedTexImage2D:Ue,compressedTexImage3D:P,texImage2D:pt,texImage3D:St,pixelStorei:ae,getParameter:Ft,updateUBOMapping:Kt,uniformBlockBinding:le,texStorage2D:At,texStorage3D:Ut,texSubImage2D:E,texSubImage3D:nt,compressedTexSubImage2D:ot,compressedTexSubImage3D:_t,scissor:Ht,viewport:zt,reset:he}}function J2(o,e,i,s,l,f,h){const d=e.has("WEBGL_multisampled_render_to_texture")?e.get("WEBGL_multisampled_render_to_texture"):null,m=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),p=new _e,x=new WeakMap,v=new Set;let g;const M=new WeakMap;let A=!1;try{A=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function C(P,E){return A?new OffscreenCanvas(P,E):lf("canvas")}function y(P,E,nt){let ot=1;const _t=Ue(P);if((_t.width>nt||_t.height>nt)&&(ot=nt/Math.max(_t.width,_t.height)),ot<1)if(typeof HTMLImageElement<"u"&&P instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&P instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&P instanceof ImageBitmap||typeof VideoFrame<"u"&&P instanceof VideoFrame){const At=Math.floor(ot*_t.width),Ut=Math.floor(ot*_t.height);g===void 0&&(g=C(At,Ut));const pt=E?C(At,Ut):g;return pt.width=At,pt.height=Ut,pt.getContext("2d").drawImage(P,0,0,At,Ut),ge("WebGLRenderer: Texture has been resized from ("+_t.width+"x"+_t.height+") to ("+At+"x"+Ut+")."),pt}else return"data"in P&&ge("WebGLRenderer: Image in DataTexture is too big ("+_t.width+"x"+_t.height+")."),P;return P}function S(P){return P.generateMipmaps}function U(P){o.generateMipmap(P)}function F(P){return P.isWebGLCubeRenderTarget?o.TEXTURE_CUBE_MAP:P.isWebGL3DRenderTarget?o.TEXTURE_3D:P.isWebGLArrayRenderTarget||P.isCompressedArrayTexture?o.TEXTURE_2D_ARRAY:o.TEXTURE_2D}function N(P,E,nt,ot,_t,At=!1){if(P!==null){if(o[P]!==void 0)return o[P];ge("WebGLRenderer: Attempt to use non-existing WebGL internal format '"+P+"'")}let Ut;ot&&(Ut=e.get("EXT_texture_norm16"),Ut||ge("WebGLRenderer: Unable to use normalized textures without EXT_texture_norm16 extension"));let pt=E;if(E===o.RED&&(nt===o.FLOAT&&(pt=o.R32F),nt===o.HALF_FLOAT&&(pt=o.R16F),nt===o.UNSIGNED_BYTE&&(pt=o.R8),nt===o.UNSIGNED_SHORT&&Ut&&(pt=Ut.R16_EXT),nt===o.SHORT&&Ut&&(pt=Ut.R16_SNORM_EXT)),E===o.RED_INTEGER&&(nt===o.UNSIGNED_BYTE&&(pt=o.R8UI),nt===o.UNSIGNED_SHORT&&(pt=o.R16UI),nt===o.UNSIGNED_INT&&(pt=o.R32UI),nt===o.BYTE&&(pt=o.R8I),nt===o.SHORT&&(pt=o.R16I),nt===o.INT&&(pt=o.R32I)),E===o.RG&&(nt===o.FLOAT&&(pt=o.RG32F),nt===o.HALF_FLOAT&&(pt=o.RG16F),nt===o.UNSIGNED_BYTE&&(pt=o.RG8),nt===o.UNSIGNED_SHORT&&Ut&&(pt=Ut.RG16_EXT),nt===o.SHORT&&Ut&&(pt=Ut.RG16_SNORM_EXT)),E===o.RG_INTEGER&&(nt===o.UNSIGNED_BYTE&&(pt=o.RG8UI),nt===o.UNSIGNED_SHORT&&(pt=o.RG16UI),nt===o.UNSIGNED_INT&&(pt=o.RG32UI),nt===o.BYTE&&(pt=o.RG8I),nt===o.SHORT&&(pt=o.RG16I),nt===o.INT&&(pt=o.RG32I)),E===o.RGB_INTEGER&&(nt===o.UNSIGNED_BYTE&&(pt=o.RGB8UI),nt===o.UNSIGNED_SHORT&&(pt=o.RGB16UI),nt===o.UNSIGNED_INT&&(pt=o.RGB32UI),nt===o.BYTE&&(pt=o.RGB8I),nt===o.SHORT&&(pt=o.RGB16I),nt===o.INT&&(pt=o.RGB32I)),E===o.RGBA_INTEGER&&(nt===o.UNSIGNED_BYTE&&(pt=o.RGBA8UI),nt===o.UNSIGNED_SHORT&&(pt=o.RGBA16UI),nt===o.UNSIGNED_INT&&(pt=o.RGBA32UI),nt===o.BYTE&&(pt=o.RGBA8I),nt===o.SHORT&&(pt=o.RGBA16I),nt===o.INT&&(pt=o.RGBA32I)),E===o.RGB&&(nt===o.UNSIGNED_SHORT&&Ut&&(pt=Ut.RGB16_EXT),nt===o.SHORT&&Ut&&(pt=Ut.RGB16_SNORM_EXT),nt===o.UNSIGNED_INT_5_9_9_9_REV&&(pt=o.RGB9_E5),nt===o.UNSIGNED_INT_10F_11F_11F_REV&&(pt=o.R11F_G11F_B10F)),E===o.RGBA){const St=At?of:Xe.getTransfer(_t);nt===o.FLOAT&&(pt=o.RGBA32F),nt===o.HALF_FLOAT&&(pt=o.RGBA16F),nt===o.UNSIGNED_BYTE&&(pt=St===sn?o.SRGB8_ALPHA8:o.RGBA8),nt===o.UNSIGNED_SHORT&&Ut&&(pt=Ut.RGBA16_EXT),nt===o.SHORT&&Ut&&(pt=Ut.RGBA16_SNORM_EXT),nt===o.UNSIGNED_SHORT_4_4_4_4&&(pt=o.RGBA4),nt===o.UNSIGNED_SHORT_5_5_5_1&&(pt=o.RGB5_A1)}return(pt===o.R16F||pt===o.R32F||pt===o.RG16F||pt===o.RG32F||pt===o.RGBA16F||pt===o.RGBA32F)&&e.get("EXT_color_buffer_float"),pt}function L(P,E){let nt;return P?E===null||E===Ga||E===$l?nt=o.DEPTH24_STENCIL8:E===Ba?nt=o.DEPTH32F_STENCIL8:E===Jl&&(nt=o.DEPTH24_STENCIL8,ge("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):E===null||E===Ga||E===$l?nt=o.DEPTH_COMPONENT24:E===Ba?nt=o.DEPTH_COMPONENT32F:E===Jl&&(nt=o.DEPTH_COMPONENT16),nt}function D(P,E){return S(P)===!0||P.isFramebufferTexture&&P.minFilter!==ei&&P.minFilter!==ri?Math.log2(Math.max(E.width,E.height))+1:P.mipmaps!==void 0&&P.mipmaps.length>0?P.mipmaps.length:P.isCompressedTexture&&Array.isArray(P.image)?E.mipmaps.length:1}function I(P){const E=P.target;E.removeEventListener("dispose",I),O(E),E.isVideoTexture&&x.delete(E),E.isHTMLTexture&&v.delete(E)}function T(P){const E=P.target;E.removeEventListener("dispose",T),Y(E)}function O(P){const E=s.get(P);if(E.__webglInit===void 0)return;const nt=P.source,ot=M.get(nt);if(ot){const _t=ot[E.__cacheKey];_t.usedTimes--,_t.usedTimes===0&&V(P),Object.keys(ot).length===0&&M.delete(nt)}s.remove(P)}function V(P){const E=s.get(P);o.deleteTexture(E.__webglTexture);const nt=P.source,ot=M.get(nt);delete ot[E.__cacheKey],h.memory.textures--}function Y(P){const E=s.get(P);if(P.depthTexture&&(P.depthTexture.dispose(),s.remove(P.depthTexture)),P.isWebGLCubeRenderTarget)for(let ot=0;ot<6;ot++){if(Array.isArray(E.__webglFramebuffer[ot]))for(let _t=0;_t<E.__webglFramebuffer[ot].length;_t++)o.deleteFramebuffer(E.__webglFramebuffer[ot][_t]);else o.deleteFramebuffer(E.__webglFramebuffer[ot]);E.__webglDepthbuffer&&o.deleteRenderbuffer(E.__webglDepthbuffer[ot])}else{if(Array.isArray(E.__webglFramebuffer))for(let ot=0;ot<E.__webglFramebuffer.length;ot++)o.deleteFramebuffer(E.__webglFramebuffer[ot]);else o.deleteFramebuffer(E.__webglFramebuffer);if(E.__webglDepthbuffer&&o.deleteRenderbuffer(E.__webglDepthbuffer),E.__webglMultisampledFramebuffer&&o.deleteFramebuffer(E.__webglMultisampledFramebuffer),E.__webglColorRenderbuffer)for(let ot=0;ot<E.__webglColorRenderbuffer.length;ot++)E.__webglColorRenderbuffer[ot]&&o.deleteRenderbuffer(E.__webglColorRenderbuffer[ot]);E.__webglDepthRenderbuffer&&o.deleteRenderbuffer(E.__webglDepthRenderbuffer)}const nt=P.textures;for(let ot=0,_t=nt.length;ot<_t;ot++){const At=s.get(nt[ot]);At.__webglTexture&&(o.deleteTexture(At.__webglTexture),h.memory.textures--),s.remove(nt[ot])}s.remove(P)}let J=0;function rt(){J=0}function j(){return J}function et(P){J=P}function q(){const P=J;return P>=l.maxTextures&&ge("WebGLTextures: Trying to use "+(P+1)+" texture units while this GPU supports only "+l.maxTextures),J+=1,P}function Z(P){const E=[];return E.push(P.wrapS),E.push(P.wrapT),E.push(P.wrapR||0),E.push(P.magFilter),E.push(P.minFilter),E.push(P.anisotropy),E.push(P.internalFormat),E.push(P.format),E.push(P.type),E.push(P.generateMipmaps),E.push(P.premultiplyAlpha),E.push(P.flipY),E.push(P.unpackAlignment),E.push(P.colorSpace),E.join()}function ht(P,E){const nt=s.get(P);if(P.isVideoTexture&&W(P),P.isRenderTargetTexture===!1&&P.isExternalTexture!==!0&&P.version>0&&nt.__version!==P.version){const ot=P.image;if(ot===null)ge("WebGLRenderer: Texture marked for update but no image data found.");else if(ot.complete===!1)ge("WebGLRenderer: Texture marked for update but image is incomplete");else{Dt(nt,P,E);return}}else P.isExternalTexture&&(nt.__webglTexture=P.sourceTexture?P.sourceTexture:null);i.bindTexture(o.TEXTURE_2D,nt.__webglTexture,o.TEXTURE0+E)}function ct(P,E){const nt=s.get(P);if(P.isRenderTargetTexture===!1&&P.version>0&&nt.__version!==P.version){Dt(nt,P,E);return}else P.isExternalTexture&&(nt.__webglTexture=P.sourceTexture?P.sourceTexture:null);i.bindTexture(o.TEXTURE_2D_ARRAY,nt.__webglTexture,o.TEXTURE0+E)}function gt(P,E){const nt=s.get(P);if(P.isRenderTargetTexture===!1&&P.version>0&&nt.__version!==P.version){Dt(nt,P,E);return}i.bindTexture(o.TEXTURE_3D,nt.__webglTexture,o.TEXTURE0+E)}function vt(P,E){const nt=s.get(P);if(P.isCubeDepthTexture!==!0&&P.version>0&&nt.__version!==P.version){Wt(nt,P,E);return}i.bindTexture(o.TEXTURE_CUBE_MAP,nt.__webglTexture,o.TEXTURE0+E)}const ie={[Lp]:o.REPEAT,[ps]:o.CLAMP_TO_EDGE,[Op]:o.MIRRORED_REPEAT},ne={[ei]:o.NEAREST,[lb]:o.NEAREST_MIPMAP_NEAREST,[bu]:o.NEAREST_MIPMAP_LINEAR,[ri]:o.LINEAR,[qd]:o.LINEAR_MIPMAP_NEAREST,[Dr]:o.LINEAR_MIPMAP_LINEAR},B={[hb]:o.NEVER,[_b]:o.ALWAYS,[db]:o.LESS,[Am]:o.LEQUAL,[pb]:o.EQUAL,[Rm]:o.GEQUAL,[mb]:o.GREATER,[gb]:o.NOTEQUAL};function xt(P,E){if(E.type===Ba&&e.has("OES_texture_float_linear")===!1&&(E.magFilter===ri||E.magFilter===qd||E.magFilter===bu||E.magFilter===Dr||E.minFilter===ri||E.minFilter===qd||E.minFilter===bu||E.minFilter===Dr)&&ge("WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),o.texParameteri(P,o.TEXTURE_WRAP_S,ie[E.wrapS]),o.texParameteri(P,o.TEXTURE_WRAP_T,ie[E.wrapT]),(P===o.TEXTURE_3D||P===o.TEXTURE_2D_ARRAY)&&o.texParameteri(P,o.TEXTURE_WRAP_R,ie[E.wrapR]),o.texParameteri(P,o.TEXTURE_MAG_FILTER,ne[E.magFilter]),o.texParameteri(P,o.TEXTURE_MIN_FILTER,ne[E.minFilter]),E.compareFunction&&(o.texParameteri(P,o.TEXTURE_COMPARE_MODE,o.COMPARE_REF_TO_TEXTURE),o.texParameteri(P,o.TEXTURE_COMPARE_FUNC,B[E.compareFunction])),e.has("EXT_texture_filter_anisotropic")===!0){if(E.magFilter===ei||E.minFilter!==bu&&E.minFilter!==Dr||E.type===Ba&&e.has("OES_texture_float_linear")===!1)return;if(E.anisotropy>1||s.get(E).__currentAnisotropy){const nt=e.get("EXT_texture_filter_anisotropic");o.texParameterf(P,nt.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(E.anisotropy,l.getMaxAnisotropy())),s.get(E).__currentAnisotropy=E.anisotropy}}}function Nt(P,E){let nt=!1;P.__webglInit===void 0&&(P.__webglInit=!0,E.addEventListener("dispose",I));const ot=E.source;let _t=M.get(ot);_t===void 0&&(_t={},M.set(ot,_t));const At=Z(E);if(At!==P.__cacheKey){_t[At]===void 0&&(_t[At]={texture:o.createTexture(),usedTimes:0},h.memory.textures++,nt=!0),_t[At].usedTimes++;const Ut=_t[P.__cacheKey];Ut!==void 0&&(_t[P.__cacheKey].usedTimes--,Ut.usedTimes===0&&V(E)),P.__cacheKey=At,P.__webglTexture=_t[At].texture}return nt}function Q(P,E,nt){return Math.floor(Math.floor(P/nt)/E)}function dt(P,E,nt,ot){const At=P.updateRanges;if(At.length===0)i.texSubImage2D(o.TEXTURE_2D,0,0,0,E.width,E.height,nt,ot,E.data);else{At.sort((ae,Ht)=>ae.start-Ht.start);let Ut=0;for(let ae=1;ae<At.length;ae++){const Ht=At[Ut],zt=At[ae],Kt=Ht.start+Ht.count,le=Q(zt.start,E.width,4),he=Q(Ht.start,E.width,4);zt.start<=Kt+1&&le===he&&Q(zt.start+zt.count-1,E.width,4)===le?Ht.count=Math.max(Ht.count,zt.start+zt.count-Ht.start):(++Ut,At[Ut]=zt)}At.length=Ut+1;const pt=i.getParameter(o.UNPACK_ROW_LENGTH),St=i.getParameter(o.UNPACK_SKIP_PIXELS),Ft=i.getParameter(o.UNPACK_SKIP_ROWS);i.pixelStorei(o.UNPACK_ROW_LENGTH,E.width);for(let ae=0,Ht=At.length;ae<Ht;ae++){const zt=At[ae],Kt=Math.floor(zt.start/4),le=Math.ceil(zt.count/4),he=Kt%E.width,k=Math.floor(Kt/E.width),Ot=le,Et=1;i.pixelStorei(o.UNPACK_SKIP_PIXELS,he),i.pixelStorei(o.UNPACK_SKIP_ROWS,k),i.texSubImage2D(o.TEXTURE_2D,0,he,k,Ot,Et,nt,ot,E.data)}P.clearUpdateRanges(),i.pixelStorei(o.UNPACK_ROW_LENGTH,pt),i.pixelStorei(o.UNPACK_SKIP_PIXELS,St),i.pixelStorei(o.UNPACK_SKIP_ROWS,Ft)}}function Dt(P,E,nt){let ot=o.TEXTURE_2D;(E.isDataArrayTexture||E.isCompressedArrayTexture)&&(ot=o.TEXTURE_2D_ARRAY),E.isData3DTexture&&(ot=o.TEXTURE_3D);const _t=Nt(P,E),At=E.source;i.bindTexture(ot,P.__webglTexture,o.TEXTURE0+nt);const Ut=s.get(At);if(At.version!==Ut.__version||_t===!0){if(i.activeTexture(o.TEXTURE0+nt),(typeof ImageBitmap<"u"&&E.image instanceof ImageBitmap)===!1){const Et=Xe.getPrimaries(Xe.workingColorSpace),Gt=E.colorSpace===$s?null:Xe.getPrimaries(E.colorSpace),jt=E.colorSpace===$s||Et===Gt?o.NONE:o.BROWSER_DEFAULT_WEBGL;i.pixelStorei(o.UNPACK_FLIP_Y_WEBGL,E.flipY),i.pixelStorei(o.UNPACK_PREMULTIPLY_ALPHA_WEBGL,E.premultiplyAlpha),i.pixelStorei(o.UNPACK_COLORSPACE_CONVERSION_WEBGL,jt)}i.pixelStorei(o.UNPACK_ALIGNMENT,E.unpackAlignment);let St=y(E.image,!1,l.maxTextureSize);St=un(E,St);const Ft=f.convert(E.format,E.colorSpace),ae=f.convert(E.type);let Ht=N(E.internalFormat,Ft,ae,E.normalized,E.colorSpace,E.isVideoTexture);xt(ot,E);let zt;const Kt=E.mipmaps,le=E.isVideoTexture!==!0,he=Ut.__version===void 0||_t===!0,k=At.dataReady,Ot=D(E,St);if(E.isDepthTexture)Ht=L(E.format===Ur,E.type),he&&(le?i.texStorage2D(o.TEXTURE_2D,1,Ht,St.width,St.height):i.texImage2D(o.TEXTURE_2D,0,Ht,St.width,St.height,0,Ft,ae,null));else if(E.isDataTexture)if(Kt.length>0){le&&he&&i.texStorage2D(o.TEXTURE_2D,Ot,Ht,Kt[0].width,Kt[0].height);for(let Et=0,Gt=Kt.length;Et<Gt;Et++)zt=Kt[Et],le?k&&i.texSubImage2D(o.TEXTURE_2D,Et,0,0,zt.width,zt.height,Ft,ae,zt.data):i.texImage2D(o.TEXTURE_2D,Et,Ht,zt.width,zt.height,0,Ft,ae,zt.data);E.generateMipmaps=!1}else le?(he&&i.texStorage2D(o.TEXTURE_2D,Ot,Ht,St.width,St.height),k&&dt(E,St,Ft,ae)):i.texImage2D(o.TEXTURE_2D,0,Ht,St.width,St.height,0,Ft,ae,St.data);else if(E.isCompressedTexture)if(E.isCompressedArrayTexture){le&&he&&i.texStorage3D(o.TEXTURE_2D_ARRAY,Ot,Ht,Kt[0].width,Kt[0].height,St.depth);for(let Et=0,Gt=Kt.length;Et<Gt;Et++)if(zt=Kt[Et],E.format!==_a)if(Ft!==null)if(le){if(k)if(E.layerUpdates.size>0){const jt=Ox(zt.width,zt.height,E.format,E.type);for(const wt of E.layerUpdates){const se=zt.data.subarray(wt*jt/zt.data.BYTES_PER_ELEMENT,(wt+1)*jt/zt.data.BYTES_PER_ELEMENT);i.compressedTexSubImage3D(o.TEXTURE_2D_ARRAY,Et,0,0,wt,zt.width,zt.height,1,Ft,se)}}else i.compressedTexSubImage3D(o.TEXTURE_2D_ARRAY,Et,0,0,0,zt.width,zt.height,St.depth,Ft,zt.data)}else i.compressedTexImage3D(o.TEXTURE_2D_ARRAY,Et,Ht,zt.width,zt.height,St.depth,0,zt.data,0,0);else ge("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else le?k&&i.texSubImage3D(o.TEXTURE_2D_ARRAY,Et,0,0,0,zt.width,zt.height,St.depth,Ft,ae,zt.data):i.texImage3D(o.TEXTURE_2D_ARRAY,Et,Ht,zt.width,zt.height,St.depth,0,Ft,ae,zt.data);E.layerUpdates.size>0&&E.clearLayerUpdates()}else{le&&he&&i.texStorage2D(o.TEXTURE_2D,Ot,Ht,Kt[0].width,Kt[0].height);for(let Et=0,Gt=Kt.length;Et<Gt;Et++)zt=Kt[Et],E.format!==_a?Ft!==null?le?k&&i.compressedTexSubImage2D(o.TEXTURE_2D,Et,0,0,zt.width,zt.height,Ft,zt.data):i.compressedTexImage2D(o.TEXTURE_2D,Et,Ht,zt.width,zt.height,0,zt.data):ge("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):le?k&&i.texSubImage2D(o.TEXTURE_2D,Et,0,0,zt.width,zt.height,Ft,ae,zt.data):i.texImage2D(o.TEXTURE_2D,Et,Ht,zt.width,zt.height,0,Ft,ae,zt.data)}else if(E.isDataArrayTexture)if(le){if(he&&i.texStorage3D(o.TEXTURE_2D_ARRAY,Ot,Ht,St.width,St.height,St.depth),k)if(E.layerUpdates.size>0){const Et=Ox(St.width,St.height,E.format,E.type);for(const Gt of E.layerUpdates){const jt=St.data.subarray(Gt*Et/St.data.BYTES_PER_ELEMENT,(Gt+1)*Et/St.data.BYTES_PER_ELEMENT);i.texSubImage3D(o.TEXTURE_2D_ARRAY,0,0,0,Gt,St.width,St.height,1,Ft,ae,jt)}E.clearLayerUpdates()}else i.texSubImage3D(o.TEXTURE_2D_ARRAY,0,0,0,0,St.width,St.height,St.depth,Ft,ae,St.data)}else i.texImage3D(o.TEXTURE_2D_ARRAY,0,Ht,St.width,St.height,St.depth,0,Ft,ae,St.data);else if(E.isData3DTexture)le?(he&&i.texStorage3D(o.TEXTURE_3D,Ot,Ht,St.width,St.height,St.depth),k&&i.texSubImage3D(o.TEXTURE_3D,0,0,0,0,St.width,St.height,St.depth,Ft,ae,St.data)):i.texImage3D(o.TEXTURE_3D,0,Ht,St.width,St.height,St.depth,0,Ft,ae,St.data);else if(E.isFramebufferTexture){if(he)if(le)i.texStorage2D(o.TEXTURE_2D,Ot,Ht,St.width,St.height);else{let Et=St.width,Gt=St.height;for(let jt=0;jt<Ot;jt++)i.texImage2D(o.TEXTURE_2D,jt,Ht,Et,Gt,0,Ft,ae,null),Et>>=1,Gt>>=1}}else if(E.isHTMLTexture){if("texElementImage2D"in o){const Et=o.canvas;if(Et.hasAttribute("layoutsubtree")||Et.setAttribute("layoutsubtree","true"),St.parentNode!==Et){Et.appendChild(St),v.add(E),Et.onpaint=Gt=>{const jt=Gt.changedElements;for(const wt of v)jt.includes(wt.image)&&(wt.needsUpdate=!0)},Et.requestPaint();return}if(o.texElementImage2D.length===3)o.texElementImage2D(o.TEXTURE_2D,o.RGBA8,St);else{const jt=o.RGBA,wt=o.RGBA,se=o.UNSIGNED_BYTE;o.texElementImage2D(o.TEXTURE_2D,0,jt,wt,se,St)}o.texParameteri(o.TEXTURE_2D,o.TEXTURE_MIN_FILTER,o.LINEAR),o.texParameteri(o.TEXTURE_2D,o.TEXTURE_WRAP_S,o.CLAMP_TO_EDGE),o.texParameteri(o.TEXTURE_2D,o.TEXTURE_WRAP_T,o.CLAMP_TO_EDGE)}}else if(Kt.length>0){if(le&&he){const Et=Ue(Kt[0]);i.texStorage2D(o.TEXTURE_2D,Ot,Ht,Et.width,Et.height)}for(let Et=0,Gt=Kt.length;Et<Gt;Et++)zt=Kt[Et],le?k&&i.texSubImage2D(o.TEXTURE_2D,Et,0,0,Ft,ae,zt):i.texImage2D(o.TEXTURE_2D,Et,Ht,Ft,ae,zt);E.generateMipmaps=!1}else if(le){if(he){const Et=Ue(St);i.texStorage2D(o.TEXTURE_2D,Ot,Ht,Et.width,Et.height)}k&&i.texSubImage2D(o.TEXTURE_2D,0,0,0,Ft,ae,St)}else i.texImage2D(o.TEXTURE_2D,0,Ht,Ft,ae,St);S(E)&&U(ot),Ut.__version=At.version,E.onUpdate&&E.onUpdate(E)}P.__version=E.version}function Wt(P,E,nt){if(E.image.length!==6)return;const ot=Nt(P,E),_t=E.source;i.bindTexture(o.TEXTURE_CUBE_MAP,P.__webglTexture,o.TEXTURE0+nt);const At=s.get(_t);if(_t.version!==At.__version||ot===!0){i.activeTexture(o.TEXTURE0+nt);const Ut=Xe.getPrimaries(Xe.workingColorSpace),pt=E.colorSpace===$s?null:Xe.getPrimaries(E.colorSpace),St=E.colorSpace===$s||Ut===pt?o.NONE:o.BROWSER_DEFAULT_WEBGL;i.pixelStorei(o.UNPACK_FLIP_Y_WEBGL,E.flipY),i.pixelStorei(o.UNPACK_PREMULTIPLY_ALPHA_WEBGL,E.premultiplyAlpha),i.pixelStorei(o.UNPACK_ALIGNMENT,E.unpackAlignment),i.pixelStorei(o.UNPACK_COLORSPACE_CONVERSION_WEBGL,St);const Ft=E.isCompressedTexture||E.image[0].isCompressedTexture,ae=E.image[0]&&E.image[0].isDataTexture,Ht=[];for(let wt=0;wt<6;wt++)!Ft&&!ae?Ht[wt]=y(E.image[wt],!0,l.maxCubemapSize):Ht[wt]=ae?E.image[wt].image:E.image[wt],Ht[wt]=un(E,Ht[wt]);const zt=Ht[0],Kt=f.convert(E.format,E.colorSpace),le=f.convert(E.type),he=N(E.internalFormat,Kt,le,E.normalized,E.colorSpace),k=E.isVideoTexture!==!0,Ot=At.__version===void 0||ot===!0,Et=_t.dataReady;let Gt=D(E,zt);xt(o.TEXTURE_CUBE_MAP,E);let jt;if(Ft){k&&Ot&&i.texStorage2D(o.TEXTURE_CUBE_MAP,Gt,he,zt.width,zt.height);for(let wt=0;wt<6;wt++){jt=Ht[wt].mipmaps;for(let se=0;se<jt.length;se++){const Yt=jt[se];E.format!==_a?Kt!==null?k?Et&&i.compressedTexSubImage2D(o.TEXTURE_CUBE_MAP_POSITIVE_X+wt,se,0,0,Yt.width,Yt.height,Kt,Yt.data):i.compressedTexImage2D(o.TEXTURE_CUBE_MAP_POSITIVE_X+wt,se,he,Yt.width,Yt.height,0,Yt.data):ge("WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):k?Et&&i.texSubImage2D(o.TEXTURE_CUBE_MAP_POSITIVE_X+wt,se,0,0,Yt.width,Yt.height,Kt,le,Yt.data):i.texImage2D(o.TEXTURE_CUBE_MAP_POSITIVE_X+wt,se,he,Yt.width,Yt.height,0,Kt,le,Yt.data)}}}else{if(jt=E.mipmaps,k&&Ot){jt.length>0&&Gt++;const wt=Ue(Ht[0]);i.texStorage2D(o.TEXTURE_CUBE_MAP,Gt,he,wt.width,wt.height)}for(let wt=0;wt<6;wt++)if(ae){k?Et&&i.texSubImage2D(o.TEXTURE_CUBE_MAP_POSITIVE_X+wt,0,0,0,Ht[wt].width,Ht[wt].height,Kt,le,Ht[wt].data):i.texImage2D(o.TEXTURE_CUBE_MAP_POSITIVE_X+wt,0,he,Ht[wt].width,Ht[wt].height,0,Kt,le,Ht[wt].data);for(let se=0;se<jt.length;se++){const Le=jt[se].image[wt].image;k?Et&&i.texSubImage2D(o.TEXTURE_CUBE_MAP_POSITIVE_X+wt,se+1,0,0,Le.width,Le.height,Kt,le,Le.data):i.texImage2D(o.TEXTURE_CUBE_MAP_POSITIVE_X+wt,se+1,he,Le.width,Le.height,0,Kt,le,Le.data)}}else{k?Et&&i.texSubImage2D(o.TEXTURE_CUBE_MAP_POSITIVE_X+wt,0,0,0,Kt,le,Ht[wt]):i.texImage2D(o.TEXTURE_CUBE_MAP_POSITIVE_X+wt,0,he,Kt,le,Ht[wt]);for(let se=0;se<jt.length;se++){const Yt=jt[se];k?Et&&i.texSubImage2D(o.TEXTURE_CUBE_MAP_POSITIVE_X+wt,se+1,0,0,Kt,le,Yt.image[wt]):i.texImage2D(o.TEXTURE_CUBE_MAP_POSITIVE_X+wt,se+1,he,Kt,le,Yt.image[wt])}}}S(E)&&U(o.TEXTURE_CUBE_MAP),At.__version=_t.version,E.onUpdate&&E.onUpdate(E)}P.__version=E.version}function Mt(P,E,nt,ot,_t,At){const Ut=f.convert(nt.format,nt.colorSpace),pt=f.convert(nt.type),St=N(nt.internalFormat,Ut,pt,nt.normalized,nt.colorSpace),Ft=s.get(E),ae=s.get(nt);if(ae.__renderTarget=E,!Ft.__hasExternalTextures){const Ht=Math.max(1,E.width>>At),zt=Math.max(1,E.height>>At);_t===o.TEXTURE_3D||_t===o.TEXTURE_2D_ARRAY?i.texImage3D(_t,At,St,Ht,zt,E.depth,0,Ut,pt,null):i.texImage2D(_t,At,St,Ht,zt,0,Ut,pt,null)}i.bindFramebuffer(o.FRAMEBUFFER,P),on(E)?d.framebufferTexture2DMultisampleEXT(o.FRAMEBUFFER,ot,_t,ae.__webglTexture,0,We(E)):(_t===o.TEXTURE_2D||_t>=o.TEXTURE_CUBE_MAP_POSITIVE_X&&_t<=o.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&o.framebufferTexture2D(o.FRAMEBUFFER,ot,_t,ae.__webglTexture,At),i.bindFramebuffer(o.FRAMEBUFFER,null)}function It(P,E,nt){if(o.bindRenderbuffer(o.RENDERBUFFER,P),E.depthBuffer){const ot=E.depthTexture,_t=ot&&ot.isDepthTexture?ot.type:null,At=L(E.stencilBuffer,_t),Ut=E.stencilBuffer?o.DEPTH_STENCIL_ATTACHMENT:o.DEPTH_ATTACHMENT;on(E)?d.renderbufferStorageMultisampleEXT(o.RENDERBUFFER,We(E),At,E.width,E.height):nt?o.renderbufferStorageMultisample(o.RENDERBUFFER,We(E),At,E.width,E.height):o.renderbufferStorage(o.RENDERBUFFER,At,E.width,E.height),o.framebufferRenderbuffer(o.FRAMEBUFFER,Ut,o.RENDERBUFFER,P)}else{const ot=E.textures;for(let _t=0;_t<ot.length;_t++){const At=ot[_t],Ut=f.convert(At.format,At.colorSpace),pt=f.convert(At.type),St=N(At.internalFormat,Ut,pt,At.normalized,At.colorSpace);on(E)?d.renderbufferStorageMultisampleEXT(o.RENDERBUFFER,We(E),St,E.width,E.height):nt?o.renderbufferStorageMultisample(o.RENDERBUFFER,We(E),St,E.width,E.height):o.renderbufferStorage(o.RENDERBUFFER,St,E.width,E.height)}}o.bindRenderbuffer(o.RENDERBUFFER,null)}function Ze(P,E,nt){const ot=E.isWebGLCubeRenderTarget===!0;if(i.bindFramebuffer(o.FRAMEBUFFER,P),!(E.depthTexture&&E.depthTexture.isDepthTexture))throw new Error("THREE.WebGLTextures: renderTarget.depthTexture must be an instance of THREE.DepthTexture.");const _t=s.get(E.depthTexture);if(_t.__renderTarget=E,(!_t.__webglTexture||E.depthTexture.image.width!==E.width||E.depthTexture.image.height!==E.height)&&(E.depthTexture.image.width=E.width,E.depthTexture.image.height=E.height,E.depthTexture.needsUpdate=!0),ot){if(_t.__webglInit===void 0&&(_t.__webglInit=!0,E.depthTexture.addEventListener("dispose",I)),_t.__webglTexture===void 0){_t.__webglTexture=o.createTexture(),i.bindTexture(o.TEXTURE_CUBE_MAP,_t.__webglTexture),xt(o.TEXTURE_CUBE_MAP,E.depthTexture);const Ft=f.convert(E.depthTexture.format),ae=f.convert(E.depthTexture.type);let Ht;E.depthTexture.format===vs?Ht=o.DEPTH_COMPONENT24:E.depthTexture.format===Ur&&(Ht=o.DEPTH24_STENCIL8);for(let zt=0;zt<6;zt++)o.texImage2D(o.TEXTURE_CUBE_MAP_POSITIVE_X+zt,0,Ht,E.width,E.height,0,Ft,ae,null)}}else ht(E.depthTexture,0);const At=_t.__webglTexture,Ut=We(E),pt=ot?o.TEXTURE_CUBE_MAP_POSITIVE_X+nt:o.TEXTURE_2D,St=E.depthTexture.format===Ur?o.DEPTH_STENCIL_ATTACHMENT:o.DEPTH_ATTACHMENT;if(E.depthTexture.format===vs)on(E)?d.framebufferTexture2DMultisampleEXT(o.FRAMEBUFFER,St,pt,At,0,Ut):o.framebufferTexture2D(o.FRAMEBUFFER,St,pt,At,0);else if(E.depthTexture.format===Ur)on(E)?d.framebufferTexture2DMultisampleEXT(o.FRAMEBUFFER,St,pt,At,0,Ut):o.framebufferTexture2D(o.FRAMEBUFFER,St,pt,At,0);else throw new Error("THREE.WebGLTextures: Unknown depthTexture format.")}function Ee(P){const E=s.get(P),nt=P.isWebGLCubeRenderTarget===!0;if(E.__boundDepthTexture!==P.depthTexture){const ot=P.depthTexture;if(E.__depthDisposeCallback&&E.__depthDisposeCallback(),ot){const _t=()=>{delete E.__boundDepthTexture,delete E.__depthDisposeCallback,ot.removeEventListener("dispose",_t)};ot.addEventListener("dispose",_t),E.__depthDisposeCallback=_t}E.__boundDepthTexture=ot}if(P.depthTexture&&!E.__autoAllocateDepthBuffer)if(nt)for(let ot=0;ot<6;ot++)Ze(E.__webglFramebuffer[ot],P,ot);else{const ot=P.texture.mipmaps;ot&&ot.length>0?Ze(E.__webglFramebuffer[0],P,0):Ze(E.__webglFramebuffer,P,0)}else if(nt){E.__webglDepthbuffer=[];for(let ot=0;ot<6;ot++)if(i.bindFramebuffer(o.FRAMEBUFFER,E.__webglFramebuffer[ot]),E.__webglDepthbuffer[ot]===void 0)E.__webglDepthbuffer[ot]=o.createRenderbuffer(),It(E.__webglDepthbuffer[ot],P,!1);else{const _t=P.stencilBuffer?o.DEPTH_STENCIL_ATTACHMENT:o.DEPTH_ATTACHMENT,At=E.__webglDepthbuffer[ot];o.bindRenderbuffer(o.RENDERBUFFER,At),o.framebufferRenderbuffer(o.FRAMEBUFFER,_t,o.RENDERBUFFER,At)}}else{const ot=P.texture.mipmaps;if(ot&&ot.length>0?i.bindFramebuffer(o.FRAMEBUFFER,E.__webglFramebuffer[0]):i.bindFramebuffer(o.FRAMEBUFFER,E.__webglFramebuffer),E.__webglDepthbuffer===void 0)E.__webglDepthbuffer=o.createRenderbuffer(),It(E.__webglDepthbuffer,P,!1);else{const _t=P.stencilBuffer?o.DEPTH_STENCIL_ATTACHMENT:o.DEPTH_ATTACHMENT,At=E.__webglDepthbuffer;o.bindRenderbuffer(o.RENDERBUFFER,At),o.framebufferRenderbuffer(o.FRAMEBUFFER,_t,o.RENDERBUFFER,At)}}i.bindFramebuffer(o.FRAMEBUFFER,null)}function Te(P,E,nt){const ot=s.get(P);E!==void 0&&Mt(ot.__webglFramebuffer,P,P.texture,o.COLOR_ATTACHMENT0,o.TEXTURE_2D,0),nt!==void 0&&Ee(P)}function Ce(P){const E=P.texture,nt=s.get(P),ot=s.get(E);P.addEventListener("dispose",T);const _t=P.textures,At=P.isWebGLCubeRenderTarget===!0,Ut=_t.length>1;if(Ut||(ot.__webglTexture===void 0&&(ot.__webglTexture=o.createTexture()),ot.__version=E.version,h.memory.textures++),At){nt.__webglFramebuffer=[];for(let pt=0;pt<6;pt++)if(E.mipmaps&&E.mipmaps.length>0){nt.__webglFramebuffer[pt]=[];for(let St=0;St<E.mipmaps.length;St++)nt.__webglFramebuffer[pt][St]=o.createFramebuffer()}else nt.__webglFramebuffer[pt]=o.createFramebuffer()}else{if(E.mipmaps&&E.mipmaps.length>0){nt.__webglFramebuffer=[];for(let pt=0;pt<E.mipmaps.length;pt++)nt.__webglFramebuffer[pt]=o.createFramebuffer()}else nt.__webglFramebuffer=o.createFramebuffer();if(Ut)for(let pt=0,St=_t.length;pt<St;pt++){const Ft=s.get(_t[pt]);Ft.__webglTexture===void 0&&(Ft.__webglTexture=o.createTexture(),h.memory.textures++)}if(P.samples>0&&on(P)===!1){nt.__webglMultisampledFramebuffer=o.createFramebuffer(),nt.__webglColorRenderbuffer=[],i.bindFramebuffer(o.FRAMEBUFFER,nt.__webglMultisampledFramebuffer);for(let pt=0;pt<_t.length;pt++){const St=_t[pt];nt.__webglColorRenderbuffer[pt]=o.createRenderbuffer(),o.bindRenderbuffer(o.RENDERBUFFER,nt.__webglColorRenderbuffer[pt]);const Ft=f.convert(St.format,St.colorSpace),ae=f.convert(St.type),Ht=N(St.internalFormat,Ft,ae,St.normalized,St.colorSpace,P.isXRRenderTarget===!0),zt=We(P);o.renderbufferStorageMultisample(o.RENDERBUFFER,zt,Ht,P.width,P.height),o.framebufferRenderbuffer(o.FRAMEBUFFER,o.COLOR_ATTACHMENT0+pt,o.RENDERBUFFER,nt.__webglColorRenderbuffer[pt])}o.bindRenderbuffer(o.RENDERBUFFER,null),P.depthBuffer&&(nt.__webglDepthRenderbuffer=o.createRenderbuffer(),It(nt.__webglDepthRenderbuffer,P,!0)),i.bindFramebuffer(o.FRAMEBUFFER,null)}}if(At){i.bindTexture(o.TEXTURE_CUBE_MAP,ot.__webglTexture),xt(o.TEXTURE_CUBE_MAP,E);for(let pt=0;pt<6;pt++)if(E.mipmaps&&E.mipmaps.length>0)for(let St=0;St<E.mipmaps.length;St++)Mt(nt.__webglFramebuffer[pt][St],P,E,o.COLOR_ATTACHMENT0,o.TEXTURE_CUBE_MAP_POSITIVE_X+pt,St);else Mt(nt.__webglFramebuffer[pt],P,E,o.COLOR_ATTACHMENT0,o.TEXTURE_CUBE_MAP_POSITIVE_X+pt,0);S(E)&&U(o.TEXTURE_CUBE_MAP),i.unbindTexture()}else if(Ut){for(let pt=0,St=_t.length;pt<St;pt++){const Ft=_t[pt],ae=s.get(Ft);let Ht=o.TEXTURE_2D;(P.isWebGL3DRenderTarget||P.isWebGLArrayRenderTarget)&&(Ht=P.isWebGL3DRenderTarget?o.TEXTURE_3D:o.TEXTURE_2D_ARRAY),i.bindTexture(Ht,ae.__webglTexture),xt(Ht,Ft),Mt(nt.__webglFramebuffer,P,Ft,o.COLOR_ATTACHMENT0+pt,Ht,0),S(Ft)&&U(Ht)}i.unbindTexture()}else{let pt=o.TEXTURE_2D;if((P.isWebGL3DRenderTarget||P.isWebGLArrayRenderTarget)&&(pt=P.isWebGL3DRenderTarget?o.TEXTURE_3D:o.TEXTURE_2D_ARRAY),i.bindTexture(pt,ot.__webglTexture),xt(pt,E),E.mipmaps&&E.mipmaps.length>0)for(let St=0;St<E.mipmaps.length;St++)Mt(nt.__webglFramebuffer[St],P,E,o.COLOR_ATTACHMENT0,pt,St);else Mt(nt.__webglFramebuffer,P,E,o.COLOR_ATTACHMENT0,pt,0);S(E)&&U(pt),i.unbindTexture()}P.depthBuffer&&Ee(P)}function ce(P){const E=P.textures;for(let nt=0,ot=E.length;nt<ot;nt++){const _t=E[nt];if(S(_t)){const At=F(P),Ut=s.get(_t).__webglTexture;i.bindTexture(At,Ut),U(At),i.unbindTexture()}}}const fe=[],Ke=[];function ve(P){if(P.samples>0){if(on(P)===!1){const E=P.textures,nt=P.width,ot=P.height;let _t=o.COLOR_BUFFER_BIT;const At=P.stencilBuffer?o.DEPTH_STENCIL_ATTACHMENT:o.DEPTH_ATTACHMENT,Ut=s.get(P),pt=E.length>1;if(pt)for(let Ft=0;Ft<E.length;Ft++)i.bindFramebuffer(o.FRAMEBUFFER,Ut.__webglMultisampledFramebuffer),o.framebufferRenderbuffer(o.FRAMEBUFFER,o.COLOR_ATTACHMENT0+Ft,o.RENDERBUFFER,null),i.bindFramebuffer(o.FRAMEBUFFER,Ut.__webglFramebuffer),o.framebufferTexture2D(o.DRAW_FRAMEBUFFER,o.COLOR_ATTACHMENT0+Ft,o.TEXTURE_2D,null,0);i.bindFramebuffer(o.READ_FRAMEBUFFER,Ut.__webglMultisampledFramebuffer);const St=P.texture.mipmaps;St&&St.length>0?i.bindFramebuffer(o.DRAW_FRAMEBUFFER,Ut.__webglFramebuffer[0]):i.bindFramebuffer(o.DRAW_FRAMEBUFFER,Ut.__webglFramebuffer);for(let Ft=0;Ft<E.length;Ft++){if(P.resolveDepthBuffer&&(P.depthBuffer&&(_t|=o.DEPTH_BUFFER_BIT),P.stencilBuffer&&P.resolveStencilBuffer&&(_t|=o.STENCIL_BUFFER_BIT)),pt){o.framebufferRenderbuffer(o.READ_FRAMEBUFFER,o.COLOR_ATTACHMENT0,o.RENDERBUFFER,Ut.__webglColorRenderbuffer[Ft]);const ae=s.get(E[Ft]).__webglTexture;o.framebufferTexture2D(o.DRAW_FRAMEBUFFER,o.COLOR_ATTACHMENT0,o.TEXTURE_2D,ae,0)}o.blitFramebuffer(0,0,nt,ot,0,0,nt,ot,_t,o.NEAREST),m===!0&&(fe.length=0,Ke.length=0,fe.push(o.COLOR_ATTACHMENT0+Ft),P.depthBuffer&&P.storeMultisampledDepthBuffer===!1&&(fe.push(At),Ke.push(At),o.invalidateFramebuffer(o.DRAW_FRAMEBUFFER,Ke)),o.invalidateFramebuffer(o.READ_FRAMEBUFFER,fe))}if(i.bindFramebuffer(o.READ_FRAMEBUFFER,null),i.bindFramebuffer(o.DRAW_FRAMEBUFFER,null),pt)for(let Ft=0;Ft<E.length;Ft++){i.bindFramebuffer(o.FRAMEBUFFER,Ut.__webglMultisampledFramebuffer),o.framebufferRenderbuffer(o.FRAMEBUFFER,o.COLOR_ATTACHMENT0+Ft,o.RENDERBUFFER,Ut.__webglColorRenderbuffer[Ft]);const ae=s.get(E[Ft]).__webglTexture;i.bindFramebuffer(o.FRAMEBUFFER,Ut.__webglFramebuffer),o.framebufferTexture2D(o.DRAW_FRAMEBUFFER,o.COLOR_ATTACHMENT0+Ft,o.TEXTURE_2D,ae,0)}i.bindFramebuffer(o.DRAW_FRAMEBUFFER,Ut.__webglMultisampledFramebuffer)}else if(P.depthBuffer&&P.storeMultisampledDepthBuffer===!1&&m){const E=P.stencilBuffer?o.DEPTH_STENCIL_ATTACHMENT:o.DEPTH_ATTACHMENT;o.invalidateFramebuffer(o.DRAW_FRAMEBUFFER,[E])}}}function We(P){return Math.min(l.maxSamples,P.samples)}function on(P){const E=s.get(P);return P.samples>0&&e.has("WEBGL_multisampled_render_to_texture")===!0&&E.__useRenderToTexture!==!1}function W(P){const E=h.render.frame;x.get(P)!==E&&(x.set(P,E),P.update())}function un(P,E){const nt=P.colorSpace,ot=P.format,_t=P.type;return P.isCompressedTexture===!0||P.isVideoTexture===!0||nt!==rf&&nt!==$s&&(Xe.getTransfer(nt)===sn?(ot!==_a||_t!==Vi)&&ge("WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):je("WebGLTextures: Unsupported texture color space:",nt)),E}function Ue(P){return typeof HTMLImageElement<"u"&&P instanceof HTMLImageElement?(p.width=P.naturalWidth||P.width,p.height=P.naturalHeight||P.height):typeof VideoFrame<"u"&&P instanceof VideoFrame?(p.width=P.displayWidth,p.height=P.displayHeight):(p.width=P.width,p.height=P.height),p}this.allocateTextureUnit=q,this.resetTextureUnits=rt,this.getTextureUnits=j,this.setTextureUnits=et,this.setTexture2D=ht,this.setTexture2DArray=ct,this.setTexture3D=gt,this.setTextureCube=vt,this.rebindTextures=Te,this.setupRenderTarget=Ce,this.updateRenderTargetMipmap=ce,this.updateMultisampleRenderTarget=ve,this.setupDepthRenderbuffer=Ee,this.setupFrameBufferTexture=Mt,this.useMultisampledRTT=on,this.isReversedDepthBuffer=function(){return i.buffers.depth.getReversed()}}function $2(o,e){function i(s,l=$s){let f;const h=Xe.getTransfer(l);if(s===Vi)return o.UNSIGNED_BYTE;if(s===ym)return o.UNSIGNED_SHORT_4_4_4_4;if(s===Mm)return o.UNSIGNED_SHORT_5_5_5_1;if(s===MS)return o.UNSIGNED_INT_5_9_9_9_REV;if(s===ES)return o.UNSIGNED_INT_10F_11F_11F_REV;if(s===SS)return o.BYTE;if(s===yS)return o.SHORT;if(s===Jl)return o.UNSIGNED_SHORT;if(s===Sm)return o.INT;if(s===Ga)return o.UNSIGNED_INT;if(s===Ba)return o.FLOAT;if(s===Va)return o.HALF_FLOAT;if(s===bS)return o.ALPHA;if(s===TS)return o.RGB;if(s===_a)return o.RGBA;if(s===vs)return o.DEPTH_COMPONENT;if(s===Ur)return o.DEPTH_STENCIL;if(s===AS)return o.RED;if(s===Em)return o.RED_INTEGER;if(s===Pr)return o.RG;if(s===bm)return o.RG_INTEGER;if(s===Tm)return o.RGBA_INTEGER;if(s===Ju||s===$u||s===tf||s===ef)if(h===sn)if(f=e.get("WEBGL_compressed_texture_s3tc_srgb"),f!==null){if(s===Ju)return f.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(s===$u)return f.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(s===tf)return f.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(s===ef)return f.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(f=e.get("WEBGL_compressed_texture_s3tc"),f!==null){if(s===Ju)return f.COMPRESSED_RGB_S3TC_DXT1_EXT;if(s===$u)return f.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(s===tf)return f.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(s===ef)return f.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(s===Pp||s===Ip||s===zp||s===Bp)if(f=e.get("WEBGL_compressed_texture_pvrtc"),f!==null){if(s===Pp)return f.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(s===Ip)return f.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(s===zp)return f.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(s===Bp)return f.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(s===Fp||s===Hp||s===Gp||s===Vp||s===kp||s===af||s===Xp)if(f=e.get("WEBGL_compressed_texture_etc"),f!==null){if(s===Fp||s===Hp)return h===sn?f.COMPRESSED_SRGB8_ETC2:f.COMPRESSED_RGB8_ETC2;if(s===Gp)return h===sn?f.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:f.COMPRESSED_RGBA8_ETC2_EAC;if(s===Vp)return f.COMPRESSED_R11_EAC;if(s===kp)return f.COMPRESSED_SIGNED_R11_EAC;if(s===af)return f.COMPRESSED_RG11_EAC;if(s===Xp)return f.COMPRESSED_SIGNED_RG11_EAC}else return null;if(s===Wp||s===Yp||s===qp||s===jp||s===Zp||s===Kp||s===Qp||s===Jp||s===$p||s===tm||s===em||s===nm||s===im||s===am)if(f=e.get("WEBGL_compressed_texture_astc"),f!==null){if(s===Wp)return h===sn?f.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:f.COMPRESSED_RGBA_ASTC_4x4_KHR;if(s===Yp)return h===sn?f.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:f.COMPRESSED_RGBA_ASTC_5x4_KHR;if(s===qp)return h===sn?f.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:f.COMPRESSED_RGBA_ASTC_5x5_KHR;if(s===jp)return h===sn?f.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:f.COMPRESSED_RGBA_ASTC_6x5_KHR;if(s===Zp)return h===sn?f.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:f.COMPRESSED_RGBA_ASTC_6x6_KHR;if(s===Kp)return h===sn?f.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:f.COMPRESSED_RGBA_ASTC_8x5_KHR;if(s===Qp)return h===sn?f.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:f.COMPRESSED_RGBA_ASTC_8x6_KHR;if(s===Jp)return h===sn?f.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:f.COMPRESSED_RGBA_ASTC_8x8_KHR;if(s===$p)return h===sn?f.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:f.COMPRESSED_RGBA_ASTC_10x5_KHR;if(s===tm)return h===sn?f.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:f.COMPRESSED_RGBA_ASTC_10x6_KHR;if(s===em)return h===sn?f.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:f.COMPRESSED_RGBA_ASTC_10x8_KHR;if(s===nm)return h===sn?f.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:f.COMPRESSED_RGBA_ASTC_10x10_KHR;if(s===im)return h===sn?f.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:f.COMPRESSED_RGBA_ASTC_12x10_KHR;if(s===am)return h===sn?f.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:f.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(s===sm||s===rm||s===om)if(f=e.get("EXT_texture_compression_bptc"),f!==null){if(s===sm)return h===sn?f.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:f.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(s===rm)return f.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(s===om)return f.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(s===lm||s===cm||s===sf||s===um)if(f=e.get("EXT_texture_compression_rgtc"),f!==null){if(s===lm)return f.COMPRESSED_RED_RGTC1_EXT;if(s===cm)return f.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(s===sf)return f.COMPRESSED_RED_GREEN_RGTC2_EXT;if(s===um)return f.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return s===$l?o.UNSIGNED_INT_24_8:o[s]!==void 0?o[s]:null}return{convert:i}}const tw=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,ew=`
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

}`;class nw{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(e,i){if(this.texture===null){const s=new OS(e.texture);(e.depthNear!==i.depthNear||e.depthFar!==i.depthFar)&&(this.depthNear=e.depthNear,this.depthFar=e.depthFar),this.texture=s}}getMesh(e){if(this.texture!==null&&this.mesh===null){const i=e.cameras[0].viewport,s=new ka({vertexShader:tw,fragmentShader:ew,uniforms:{depthColor:{value:this.texture},depthWidth:{value:i.z},depthHeight:{value:i.w}}});this.mesh=new Me(new sc(20,20),s)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}}class iw extends nr{constructor(e,i){super();const s=this;let l=null,f=1,h=null,d="local-floor",m=1,p=null,x=null,v=null,g=null,M=null,A=null;const C=typeof XRWebGLBinding<"u",y=new nw,S={},U=i.getContextAttributes();let F=null,N=null;const L=[],D=[],I=new _e;let T=null,O=null;const V=new Hi;V.viewport=new vn;const Y=new Hi;Y.viewport=new vn;const J=[V,Y],rt=new lT;let j=null,et=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(Q){let dt=L[Q];return dt===void 0&&(dt=new ep,L[Q]=dt),dt.getTargetRaySpace()},this.getControllerGrip=function(Q){let dt=L[Q];return dt===void 0&&(dt=new ep,L[Q]=dt),dt.getGripSpace()},this.getHand=function(Q){let dt=L[Q];return dt===void 0&&(dt=new ep,L[Q]=dt),dt.getHandSpace()};function q(Q){const dt=D.indexOf(Q.inputSource);if(dt===-1)return;const Dt=L[dt];Dt!==void 0&&(Dt.update(Q.inputSource,Q.frame,p||h),Dt.dispatchEvent({type:Q.type,data:Q.inputSource}))}function Z(){l.removeEventListener("select",q),l.removeEventListener("selectstart",q),l.removeEventListener("selectend",q),l.removeEventListener("squeeze",q),l.removeEventListener("squeezestart",q),l.removeEventListener("squeezeend",q),l.removeEventListener("end",Z),l.removeEventListener("inputsourceschange",ht);for(let Q=0;Q<L.length;Q++){const dt=D[Q];dt!==null&&(D[Q]=null,L[Q].disconnect(dt))}j=null,et=null,y.reset();for(const Q in S)delete S[Q];if(e.setRenderTarget(F),M=null,g=null,v=null,l=null,N=null,Nt.stop(),s.isPresenting=!1,e.setPixelRatio(T),e.setSize(I.width,I.height,!1),O!==null){const Q=O.camera;Q.fov=O.fov,Q.zoom=O.zoom,Q.updateProjectionMatrix(),O=null}s.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(Q){f=Q,s.isPresenting===!0&&ge("WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(Q){d=Q,s.isPresenting===!0&&ge("WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return p||h},this.setReferenceSpace=function(Q){p=Q},this.getBaseLayer=function(){return g!==null?g:M},this.getBinding=function(){return v===null&&C&&(v=new XRWebGLBinding(l,i)),v},this.getFrame=function(){return A},this.getSession=function(){return l},this.setSession=async function(Q){if(l=Q,l!==null){if(F=e.getRenderTarget(),l.addEventListener("select",q),l.addEventListener("selectstart",q),l.addEventListener("selectend",q),l.addEventListener("squeeze",q),l.addEventListener("squeezestart",q),l.addEventListener("squeezeend",q),l.addEventListener("end",Z),l.addEventListener("inputsourceschange",ht),U.xrCompatible!==!0&&await i.makeXRCompatible(),T=e.getPixelRatio(),e.getSize(I),C&&"createProjectionLayer"in XRWebGLBinding.prototype){let Dt=null,Wt=null,Mt=null;U.depth&&(Mt=U.stencil?i.DEPTH24_STENCIL8:i.DEPTH_COMPONENT24,Dt=U.stencil?Ur:vs,Wt=U.stencil?$l:Ga);const It={colorFormat:i.RGBA8,depthFormat:Mt,scaleFactor:f};v=this.getBinding(),g=v.createProjectionLayer(It),l.updateRenderState({layers:[g]}),e.setPixelRatio(1),e.setSize(g.textureWidth,g.textureHeight,!1),N=new va(g.textureWidth,g.textureHeight,{format:_a,type:Vi,depthTexture:new ec(g.textureWidth,g.textureHeight,Wt,void 0,void 0,void 0,void 0,void 0,void 0,Dt),stencilBuffer:U.stencil,colorSpace:e.outputColorSpace,samples:U.antialias?4:0,resolveDepthBuffer:g.ignoreDepthValues===!1,resolveStencilBuffer:g.ignoreDepthValues===!1,storeMultisampledDepthBuffer:g.ignoreDepthValues===!1,storeMultisampledStencilBuffer:g.ignoreDepthValues===!1})}else{const Dt={antialias:U.antialias,alpha:!0,depth:U.depth,stencil:U.stencil,framebufferScaleFactor:f};M=new XRWebGLLayer(l,i,Dt),l.updateRenderState({baseLayer:M}),e.setPixelRatio(1),e.setSize(M.framebufferWidth,M.framebufferHeight,!1),N=new va(M.framebufferWidth,M.framebufferHeight,{format:_a,type:Vi,colorSpace:e.outputColorSpace,stencilBuffer:U.stencil,resolveDepthBuffer:M.ignoreDepthValues===!1,resolveStencilBuffer:M.ignoreDepthValues===!1,storeMultisampledDepthBuffer:M.ignoreDepthValues===!1,storeMultisampledStencilBuffer:M.ignoreDepthValues===!1})}N.isXRRenderTarget=!0,this.setFoveation(m),p=null,h=await l.requestReferenceSpace(d),Nt.setContext(l),Nt.start(),s.isPresenting=!0,s.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(l!==null)return l.environmentBlendMode},this.getDepthTexture=function(){return y.getDepthTexture()};function ht(Q){for(let dt=0;dt<Q.removed.length;dt++){const Dt=Q.removed[dt],Wt=D.indexOf(Dt);Wt>=0&&(D[Wt]=null,L[Wt].disconnect(Dt))}for(let dt=0;dt<Q.added.length;dt++){const Dt=Q.added[dt];let Wt=D.indexOf(Dt);if(Wt===-1){for(let It=0;It<L.length;It++)if(It>=D.length){D.push(Dt),Wt=It;break}else if(D[It]===null){D[It]=Dt,Wt=It;break}if(Wt===-1)break}const Mt=L[Wt];Mt&&Mt.connect(Dt)}}const ct=new X,gt=new X;function vt(Q,dt,Dt){ct.setFromMatrixPosition(dt.matrixWorld),gt.setFromMatrixPosition(Dt.matrixWorld);const Wt=ct.distanceTo(gt),Mt=dt.projectionMatrix.elements,It=Dt.projectionMatrix.elements,Ze=Mt[14]/(Mt[10]-1),Ee=Mt[14]/(Mt[10]+1),Te=(Mt[9]+1)/Mt[5],Ce=(Mt[9]-1)/Mt[5],ce=(Mt[8]-1)/Mt[0],fe=(It[8]+1)/It[0],Ke=Ze*ce,ve=Ze*fe,We=Wt/(-ce+fe),on=We*-ce;if(dt.matrixWorld.decompose(Q.position,Q.quaternion,Q.scale),Q.translateX(on),Q.translateZ(We),Q.matrixWorld.compose(Q.position,Q.quaternion,Q.scale),Q.matrixWorldInverse.copy(Q.matrixWorld).invert(),Mt[10]===-1)Q.projectionMatrix.copy(dt.projectionMatrix),Q.projectionMatrixInverse.copy(dt.projectionMatrixInverse);else{const W=Ze+We,un=Ee+We,Ue=Ke-on,P=ve+(Wt-on),E=Te*Ee/un*W,nt=Ce*Ee/un*W;Q.projectionMatrix.makePerspective(Ue,P,E,nt,W,un),Q.projectionMatrixInverse.copy(Q.projectionMatrix).invert()}}function ie(Q,dt){dt===null?Q.matrixWorld.copy(Q.matrix):Q.matrixWorld.multiplyMatrices(dt.matrixWorld,Q.matrix),Q.matrixWorldInverse.copy(Q.matrixWorld).invert()}this.updateCamera=function(Q){if(l===null)return;let dt=Q.near,Dt=Q.far;y.texture!==null&&(y.depthNear>0&&(dt=y.depthNear),y.depthFar>0&&(Dt=y.depthFar)),rt.near=Y.near=V.near=dt,rt.far=Y.far=V.far=Dt,(j!==rt.near||et!==rt.far)&&(l.updateRenderState({depthNear:rt.near,depthFar:rt.far}),j=rt.near,et=rt.far),rt.layers.mask=Q.layers.mask|6,V.layers.mask=rt.layers.mask&-5,Y.layers.mask=rt.layers.mask&-3;const Wt=Q.parent,Mt=rt.cameras;ie(rt,Wt);for(let It=0;It<Mt.length;It++)ie(Mt[It],Wt);Mt.length===2?vt(rt,V,Y):rt.projectionMatrix.copy(V.projectionMatrix),O===null&&Q.isPerspectiveCamera&&(O={camera:Q,fov:Q.fov,zoom:Q.zoom}),ne(Q,rt,Wt)};function ne(Q,dt,Dt){Dt===null?Q.matrix.copy(dt.matrixWorld):(Q.matrix.copy(Dt.matrixWorld),Q.matrix.invert(),Q.matrix.multiply(dt.matrixWorld)),Q.matrix.decompose(Q.position,Q.quaternion,Q.scale),Q.updateMatrixWorld(!0),Q.projectionMatrix.copy(dt.projectionMatrix),Q.projectionMatrixInverse.copy(dt.projectionMatrixInverse),Q.isPerspectiveCamera&&(Q.fov=hm*2*Math.atan(1/Q.projectionMatrix.elements[5]),Q.zoom=1)}this.getCamera=function(){return rt},this.getFoveation=function(){if(!(g===null&&M===null))return m},this.setFoveation=function(Q){m=Q,g!==null&&(g.fixedFoveation=Q),M!==null&&M.fixedFoveation!==void 0&&(M.fixedFoveation=Q)},this.hasDepthSensing=function(){return y.texture!==null},this.getDepthSensingMesh=function(){return y.getMesh(rt)},this.getCameraTexture=function(Q){return S[Q]};let B=null;function xt(Q,dt){if(x=dt.getViewerPose(p||h),A=dt,x!==null){const Dt=x.views;M!==null&&(e.setRenderTargetFramebuffer(N,M.framebuffer),e.setRenderTarget(N));let Wt=!1;Dt.length!==rt.cameras.length&&(rt.cameras.length=0,Wt=!0);for(let Ee=0;Ee<Dt.length;Ee++){const Te=Dt[Ee];let Ce=null;if(M!==null)Ce=M.getViewport(Te);else{const fe=v.getViewSubImage(g,Te);Ce=fe.viewport,Ee===0&&(e.setRenderTargetTextures(N,fe.colorTexture,fe.depthStencilTexture),e.setRenderTarget(N))}let ce=J[Ee];ce===void 0&&(ce=new Hi,ce.layers.enable(Ee),ce.viewport=new vn,J[Ee]=ce),ce.matrix.fromArray(Te.transform.matrix),ce.matrix.decompose(ce.position,ce.quaternion,ce.scale),ce.projectionMatrix.fromArray(Te.projectionMatrix),ce.projectionMatrixInverse.copy(ce.projectionMatrix).invert(),ce.viewport.set(Ce.x,Ce.y,Ce.width,Ce.height),Ee===0&&(rt.matrix.copy(ce.matrix),rt.matrix.decompose(rt.position,rt.quaternion,rt.scale)),Wt===!0&&rt.cameras.push(ce)}const Mt=l.enabledFeatures;if(Mt&&Mt.includes("depth-sensing")&&l.depthUsage=="gpu-optimized"&&C){v=s.getBinding();const Ee=v.getDepthInformation(Dt[0]);Ee&&Ee.isValid&&Ee.texture&&y.init(Ee,l.renderState)}if(Mt&&Mt.includes("camera-access")&&C){e.state.unbindTexture(),v=s.getBinding();for(let Ee=0;Ee<Dt.length;Ee++){const Te=Dt[Ee].camera;if(Te){let Ce=S[Te];Ce||(Ce=new OS,S[Te]=Ce);const ce=v.getCameraImage(Te);Ce.sourceTexture=ce}}}}for(let Dt=0;Dt<L.length;Dt++){const Wt=D[Dt],Mt=L[Dt];Wt!==null&&Mt!==void 0&&Mt.update(Wt,dt,p||h)}B&&B(Q,dt),dt.detectedPlanes&&s.dispatchEvent({type:"planesdetected",data:dt}),A=null}const Nt=new BS;Nt.setAnimationLoop(xt),this.setAnimationLoop=function(Q){B=Q},this.dispose=function(){}}}const aw=new gn,WS=new be;WS.set(-1,0,0,0,1,0,0,0,1);function sw(o,e){function i(y,S){y.matrixAutoUpdate===!0&&y.updateMatrix(),S.value.copy(y.matrix)}function s(y,S){S.color.getRGB(y.fogColor.value,PS(o)),S.isFog?(y.fogNear.value=S.near,y.fogFar.value=S.far):S.isFogExp2&&(y.fogDensity.value=S.density)}function l(y,S,U,F,N){S.isNodeMaterial?S.uniformsNeedUpdate=!1:S.isMeshBasicMaterial?f(y,S):S.isMeshLambertMaterial?(f(y,S),S.envMap&&(y.envMapIntensity.value=S.envMapIntensity)):S.isMeshToonMaterial?(f(y,S),v(y,S)):S.isMeshPhongMaterial?(f(y,S),x(y,S),S.envMap&&(y.envMapIntensity.value=S.envMapIntensity)):S.isMeshStandardMaterial?(f(y,S),g(y,S),S.isMeshPhysicalMaterial&&M(y,S,N)):S.isMeshMatcapMaterial?(f(y,S),A(y,S)):S.isMeshDepthMaterial?f(y,S):S.isMeshDistanceMaterial?(f(y,S),C(y,S)):S.isMeshNormalMaterial?f(y,S):S.isLineBasicMaterial?(h(y,S),S.isLineDashedMaterial&&d(y,S)):S.isPointsMaterial?m(y,S,U,F):S.isSpriteMaterial?p(y,S):S.isShadowMaterial?(y.color.value.copy(S.color),y.opacity.value=S.opacity):S.isShaderMaterial&&(S.uniformsNeedUpdate=!1)}function f(y,S){y.opacity.value=S.opacity,S.color&&y.diffuse.value.copy(S.color),S.emissive&&y.emissive.value.copy(S.emissive).multiplyScalar(S.emissiveIntensity),S.map&&(y.map.value=S.map,i(S.map,y.mapTransform)),S.alphaMap&&(y.alphaMap.value=S.alphaMap,i(S.alphaMap,y.alphaMapTransform)),S.bumpMap&&(y.bumpMap.value=S.bumpMap,i(S.bumpMap,y.bumpMapTransform),y.bumpScale.value=S.bumpScale,S.side===Ei&&(y.bumpScale.value*=-1)),S.normalMap&&(y.normalMap.value=S.normalMap,i(S.normalMap,y.normalMapTransform),y.normalScale.value.copy(S.normalScale),S.side===Ei&&y.normalScale.value.negate()),S.displacementMap&&(y.displacementMap.value=S.displacementMap,i(S.displacementMap,y.displacementMapTransform),y.displacementScale.value=S.displacementScale,y.displacementBias.value=S.displacementBias),S.emissiveMap&&(y.emissiveMap.value=S.emissiveMap,i(S.emissiveMap,y.emissiveMapTransform)),S.specularMap&&(y.specularMap.value=S.specularMap,i(S.specularMap,y.specularMapTransform)),S.alphaTest>0&&(y.alphaTest.value=S.alphaTest);const U=e.get(S),F=U.envMap,N=U.envMapRotation;F&&(y.envMap.value=F,y.envMapRotation.value.setFromMatrix4(aw.makeRotationFromEuler(N)).transpose(),F.isCubeTexture&&F.isRenderTargetTexture===!1&&y.envMapRotation.value.premultiply(WS),y.reflectivity.value=S.reflectivity,y.ior.value=S.ior,y.refractionRatio.value=S.refractionRatio),S.lightMap&&(y.lightMap.value=S.lightMap,y.lightMapIntensity.value=S.lightMapIntensity,i(S.lightMap,y.lightMapTransform)),S.aoMap&&(y.aoMap.value=S.aoMap,y.aoMapIntensity.value=S.aoMapIntensity,i(S.aoMap,y.aoMapTransform))}function h(y,S){y.diffuse.value.copy(S.color),y.opacity.value=S.opacity,S.map&&(y.map.value=S.map,i(S.map,y.mapTransform))}function d(y,S){y.dashSize.value=S.dashSize,y.totalSize.value=S.dashSize+S.gapSize,y.scale.value=S.scale}function m(y,S,U,F){y.diffuse.value.copy(S.color),y.opacity.value=S.opacity,y.size.value=S.size*U,y.scale.value=F*.5,S.map&&(y.map.value=S.map,i(S.map,y.uvTransform)),S.alphaMap&&(y.alphaMap.value=S.alphaMap,i(S.alphaMap,y.alphaMapTransform)),S.alphaTest>0&&(y.alphaTest.value=S.alphaTest)}function p(y,S){y.diffuse.value.copy(S.color),y.opacity.value=S.opacity,y.rotation.value=S.rotation,S.map&&(y.map.value=S.map,i(S.map,y.mapTransform)),S.alphaMap&&(y.alphaMap.value=S.alphaMap,i(S.alphaMap,y.alphaMapTransform)),S.alphaTest>0&&(y.alphaTest.value=S.alphaTest)}function x(y,S){y.specular.value.copy(S.specular),y.shininess.value=Math.max(S.shininess,1e-4)}function v(y,S){S.gradientMap&&(y.gradientMap.value=S.gradientMap)}function g(y,S){y.metalness.value=S.metalness,S.metalnessMap&&(y.metalnessMap.value=S.metalnessMap,i(S.metalnessMap,y.metalnessMapTransform)),y.roughness.value=S.roughness,S.roughnessMap&&(y.roughnessMap.value=S.roughnessMap,i(S.roughnessMap,y.roughnessMapTransform)),S.envMap&&(y.envMapIntensity.value=S.envMapIntensity)}function M(y,S,U){y.ior.value=S.ior,S.sheen>0&&(y.sheenColor.value.copy(S.sheenColor).multiplyScalar(S.sheen),y.sheenRoughness.value=S.sheenRoughness,S.sheenColorMap&&(y.sheenColorMap.value=S.sheenColorMap,i(S.sheenColorMap,y.sheenColorMapTransform)),S.sheenRoughnessMap&&(y.sheenRoughnessMap.value=S.sheenRoughnessMap,i(S.sheenRoughnessMap,y.sheenRoughnessMapTransform))),S.clearcoat>0&&(y.clearcoat.value=S.clearcoat,y.clearcoatRoughness.value=S.clearcoatRoughness,S.clearcoatMap&&(y.clearcoatMap.value=S.clearcoatMap,i(S.clearcoatMap,y.clearcoatMapTransform)),S.clearcoatRoughnessMap&&(y.clearcoatRoughnessMap.value=S.clearcoatRoughnessMap,i(S.clearcoatRoughnessMap,y.clearcoatRoughnessMapTransform)),S.clearcoatNormalMap&&(y.clearcoatNormalMap.value=S.clearcoatNormalMap,i(S.clearcoatNormalMap,y.clearcoatNormalMapTransform),y.clearcoatNormalScale.value.copy(S.clearcoatNormalScale),S.side===Ei&&y.clearcoatNormalScale.value.negate())),S.dispersion>0&&(y.dispersion.value=S.dispersion),S.retroreflectivity>0&&(y.retroreflectivity.value=S.retroreflectivity),S.iridescence>0&&(y.iridescence.value=S.iridescence,y.iridescenceIOR.value=S.iridescenceIOR,y.iridescenceThicknessMinimum.value=S.iridescenceThicknessRange[0],y.iridescenceThicknessMaximum.value=S.iridescenceThicknessRange[1],S.iridescenceMap&&(y.iridescenceMap.value=S.iridescenceMap,i(S.iridescenceMap,y.iridescenceMapTransform)),S.iridescenceThicknessMap&&(y.iridescenceThicknessMap.value=S.iridescenceThicknessMap,i(S.iridescenceThicknessMap,y.iridescenceThicknessMapTransform))),S.transmission>0&&(y.transmission.value=S.transmission,y.transmissionSamplerMap.value=U.texture,y.transmissionSamplerSize.value.set(U.width,U.height),S.transmissionMap&&(y.transmissionMap.value=S.transmissionMap,i(S.transmissionMap,y.transmissionMapTransform)),y.thickness.value=S.thickness,S.thicknessMap&&(y.thicknessMap.value=S.thicknessMap,i(S.thicknessMap,y.thicknessMapTransform)),y.attenuationDistance.value=S.attenuationDistance,y.attenuationColor.value.copy(S.attenuationColor)),S.anisotropy>0&&(y.anisotropyVector.value.set(S.anisotropy*Math.cos(S.anisotropyRotation),S.anisotropy*Math.sin(S.anisotropyRotation)),S.anisotropyMap&&(y.anisotropyMap.value=S.anisotropyMap,i(S.anisotropyMap,y.anisotropyMapTransform))),y.specularIntensity.value=S.specularIntensity,y.specularColor.value.copy(S.specularColor),S.specularColorMap&&(y.specularColorMap.value=S.specularColorMap,i(S.specularColorMap,y.specularColorMapTransform)),S.specularIntensityMap&&(y.specularIntensityMap.value=S.specularIntensityMap,i(S.specularIntensityMap,y.specularIntensityMapTransform))}function A(y,S){S.matcap&&(y.matcap.value=S.matcap)}function C(y,S){const U=e.get(S).light;y.referencePosition.value.setFromMatrixPosition(U.matrixWorld),y.nearDistance.value=U.shadow.camera.near,y.farDistance.value=U.shadow.camera.far}return{refreshFogUniforms:s,refreshMaterialUniforms:l}}function rw(o,e,i,s){let l={},f={},h=[];const d=o.getParameter(o.MAX_UNIFORM_BUFFER_BINDINGS);function m(N,L){const D=L.program;s.uniformBlockBinding(N,D)}function p(N,L){let D=l[N.id];D===void 0&&(y(N),D=x(N),l[N.id]=D,N.addEventListener("dispose",U));const I=L.program;s.updateUBOMapping(N,I);const T=e.render.frame;f[N.id]!==T&&(g(N),f[N.id]=T)}function x(N){const L=v();N.__bindingPointIndex=L;const D=o.createBuffer(),I=N.__size,T=N.usage;return o.bindBuffer(o.UNIFORM_BUFFER,D),o.bufferData(o.UNIFORM_BUFFER,I,T),o.bindBuffer(o.UNIFORM_BUFFER,null),o.bindBufferBase(o.UNIFORM_BUFFER,L,D),D}function v(){for(let N=0;N<d;N++)if(h.indexOf(N)===-1)return h.push(N),N;return je("WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function g(N){const L=l[N.id],D=N.uniforms,I=N.__cache;o.bindBuffer(o.UNIFORM_BUFFER,L);for(let T=0,O=D.length;T<O;T++){const V=D[T];if(Array.isArray(V))for(let Y=0,J=V.length;Y<J;Y++)M(V[Y],T,Y,I);else M(V,T,0,I)}o.bindBuffer(o.UNIFORM_BUFFER,null)}function M(N,L,D,I){if(C(N,L,D,I)===!0){const T=N.__offset,O=N.value;if(Array.isArray(O)){let V=0;for(let Y=0;Y<O.length;Y++){const J=O[Y],rt=S(J);A(J,N.__data,V),typeof J!="number"&&typeof J!="boolean"&&!J.isMatrix3&&!ArrayBuffer.isView(J)&&(V+=rt.storage/Float32Array.BYTES_PER_ELEMENT)}}else A(O,N.__data,0);o.bufferSubData(o.UNIFORM_BUFFER,T,N.__data)}}function A(N,L,D){typeof N=="number"||typeof N=="boolean"?L[0]=N:N.isMatrix3?(L[0]=N.elements[0],L[1]=N.elements[1],L[2]=N.elements[2],L[3]=0,L[4]=N.elements[3],L[5]=N.elements[4],L[6]=N.elements[5],L[7]=0,L[8]=N.elements[6],L[9]=N.elements[7],L[10]=N.elements[8],L[11]=0):ArrayBuffer.isView(N)?L.set(new N.constructor(N.buffer,N.byteOffset,L.length)):N.toArray(L,D)}function C(N,L,D,I){const T=N.value,O=L+"_"+D;if(I[O]===void 0)return typeof T=="number"||typeof T=="boolean"?I[O]=T:ArrayBuffer.isView(T)?I[O]=T.slice():I[O]=T.clone(),!0;{const V=I[O];if(typeof T=="number"||typeof T=="boolean"){if(V!==T)return I[O]=T,!0}else{if(ArrayBuffer.isView(T))return!0;if(V.equals(T)===!1)return V.copy(T),!0}}return!1}function y(N){const L=N.uniforms;let D=0;const I=16;for(let O=0,V=L.length;O<V;O++){const Y=Array.isArray(L[O])?L[O]:[L[O]];for(let J=0,rt=Y.length;J<rt;J++){const j=Y[J],et=Array.isArray(j.value)?j.value:[j.value];for(let q=0,Z=et.length;q<Z;q++){const ht=et[q],ct=S(ht),gt=D%I,vt=gt%ct.boundary,ie=gt+vt;D+=vt,ie!==0&&I-ie<ct.storage&&(D+=I-ie),j.__data=new Float32Array(ct.storage/Float32Array.BYTES_PER_ELEMENT),j.__offset=D,D+=ct.storage}}}const T=D%I;return T>0&&(D+=I-T),N.__size=D,N.__cache={},this}function S(N){const L={boundary:0,storage:0};return typeof N=="number"||typeof N=="boolean"?(L.boundary=4,L.storage=4):N.isVector2?(L.boundary=8,L.storage=8):N.isVector3||N.isColor?(L.boundary=16,L.storage=12):N.isVector4?(L.boundary=16,L.storage=16):N.isMatrix3?(L.boundary=48,L.storage=48):N.isMatrix4?(L.boundary=64,L.storage=64):N.isTexture?ge("WebGLRenderer: Texture samplers can not be part of an uniforms group."):ArrayBuffer.isView(N)?(L.boundary=16,L.storage=N.byteLength):ge("WebGLRenderer: Unsupported uniform value type.",N),L}function U(N){const L=N.target;L.removeEventListener("dispose",U);const D=h.indexOf(L.__bindingPointIndex);h.splice(D,1),o.deleteBuffer(l[L.id]),delete l[L.id],delete f[L.id]}function F(){for(const N in l)o.deleteBuffer(l[N]);h=[],l={},f={}}return{bind:m,update:p,dispose:F}}const ow=new Uint16Array([12469,15057,12620,14925,13266,14620,13807,14376,14323,13990,14545,13625,14713,13328,14840,12882,14931,12528,14996,12233,15039,11829,15066,11525,15080,11295,15085,10976,15082,10705,15073,10495,13880,14564,13898,14542,13977,14430,14158,14124,14393,13732,14556,13410,14702,12996,14814,12596,14891,12291,14937,11834,14957,11489,14958,11194,14943,10803,14921,10506,14893,10278,14858,9960,14484,14039,14487,14025,14499,13941,14524,13740,14574,13468,14654,13106,14743,12678,14818,12344,14867,11893,14889,11509,14893,11180,14881,10751,14852,10428,14812,10128,14765,9754,14712,9466,14764,13480,14764,13475,14766,13440,14766,13347,14769,13070,14786,12713,14816,12387,14844,11957,14860,11549,14868,11215,14855,10751,14825,10403,14782,10044,14729,9651,14666,9352,14599,9029,14967,12835,14966,12831,14963,12804,14954,12723,14936,12564,14917,12347,14900,11958,14886,11569,14878,11247,14859,10765,14828,10401,14784,10011,14727,9600,14660,9289,14586,8893,14508,8533,15111,12234,15110,12234,15104,12216,15092,12156,15067,12010,15028,11776,14981,11500,14942,11205,14902,10752,14861,10393,14812,9991,14752,9570,14682,9252,14603,8808,14519,8445,14431,8145,15209,11449,15208,11451,15202,11451,15190,11438,15163,11384,15117,11274,15055,10979,14994,10648,14932,10343,14871,9936,14803,9532,14729,9218,14645,8742,14556,8381,14461,8020,14365,7603,15273,10603,15272,10607,15267,10619,15256,10631,15231,10614,15182,10535,15118,10389,15042,10167,14963,9787,14883,9447,14800,9115,14710,8665,14615,8318,14514,7911,14411,7507,14279,7198,15314,9675,15313,9683,15309,9712,15298,9759,15277,9797,15229,9773,15166,9668,15084,9487,14995,9274,14898,8910,14800,8539,14697,8234,14590,7790,14479,7409,14367,7067,14178,6621,15337,8619,15337,8631,15333,8677,15325,8769,15305,8871,15264,8940,15202,8909,15119,8775,15022,8565,14916,8328,14804,8009,14688,7614,14569,7287,14448,6888,14321,6483,14088,6171,15350,7402,15350,7419,15347,7480,15340,7613,15322,7804,15287,7973,15229,8057,15148,8012,15046,7846,14933,7611,14810,7357,14682,7069,14552,6656,14421,6316,14251,5948,14007,5528,15356,5942,15356,5977,15353,6119,15348,6294,15332,6551,15302,6824,15249,7044,15171,7122,15070,7050,14949,6861,14818,6611,14679,6349,14538,6067,14398,5651,14189,5311,13935,4958,15359,4123,15359,4153,15356,4296,15353,4646,15338,5160,15311,5508,15263,5829,15188,6042,15088,6094,14966,6001,14826,5796,14678,5543,14527,5287,14377,4985,14133,4586,13869,4257,15360,1563,15360,1642,15358,2076,15354,2636,15341,3350,15317,4019,15273,4429,15203,4732,15105,4911,14981,4932,14836,4818,14679,4621,14517,4386,14359,4156,14083,3795,13808,3437,15360,122,15360,137,15358,285,15355,636,15344,1274,15322,2177,15281,2765,15215,3223,15120,3451,14995,3569,14846,3567,14681,3466,14511,3305,14344,3121,14037,2800,13753,2467,15360,0,15360,1,15359,21,15355,89,15346,253,15325,479,15287,796,15225,1148,15133,1492,15008,1749,14856,1882,14685,1886,14506,1783,14324,1608,13996,1398,13702,1183]);let Ia=null;function lw(){return Ia===null&&(Ia=new Yb(ow,16,16,Pr,Va),Ia.name="DFG_LUT",Ia.minFilter=ri,Ia.magFilter=ri,Ia.wrapS=ps,Ia.wrapT=ps,Ia.generateMipmaps=!1,Ia.needsUpdate=!0),Ia}class cw{constructor(e={}){const{canvas:i=Sb(),context:s=null,depth:l=!0,stencil:f=!1,alpha:h=!1,antialias:d=!1,premultipliedAlpha:m=!0,preserveDrawingBuffer:p=!1,powerPreference:x="default",failIfMajorPerformanceCaveat:v=!1,reversedDepthBuffer:g=!1,outputBufferType:M=Vi}=e;this.isWebGLRenderer=!0;let A;if(s!==null){if(typeof WebGLRenderingContext<"u"&&s instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");A=s.getContextAttributes().alpha}else A=h;const C=M,y=new Set([Tm,bm,Em]),S=new Set([Vi,Ga,Jl,$l,ym,Mm]),U=new Uint32Array(4),F=new Int32Array(4),N=new X;let L=null,D=null;const I=[],T=[];let O=null;this.domElement=i,this.debug={checkShaderErrors:!0,diagnostics:{keywords:!1},onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=Ha,this.toneMappingExposure=1,this.transmissionResolutionScale=1;const V=this;let Y=!1,J=null,rt=null,j=null,et=null;this._outputColorSpace=ia;let q=0,Z=0,ht=null,ct=-1,gt=null;const vt=new vn,ie=new vn;let ne=null;const B=new Ie(0);let xt=0,Nt=i.width,Q=i.height,dt=1,Dt=null,Wt=null;const Mt=new vn(0,0,Nt,Q),It=new vn(0,0,Nt,Q);let Ze=!1;const Ee=new Dm;let Te=!1,Ce=!1;const ce=new gn,fe=new X,Ke=new vn,ve={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0};let We=!1;function on(){return ht===null?dt:1}let W=s;function un(R,H){return i.getContext(R,H)}let Ue,P,E,nt,ot,_t,At,Ut,pt,St,Ft,ae,Ht,zt,Kt,le,he,k,Ot,Et,Gt,jt,wt;try{const R={alpha:!0,depth:l,stencil:f,antialias:d,premultipliedAlpha:m,preserveDrawingBuffer:p,powerPreference:x,failIfMajorPerformanceCaveat:v};if("setAttribute"in i&&i.setAttribute("data-engine",`three.js r${xm}`),i.addEventListener("webglcontextlost",Le,!1),i.addEventListener("webglcontextrestored",xe,!1),i.addEventListener("webglcontextcreationerror",ni,!1),W===null){const H="webgl2";if(W=un(H,R),W===null)throw un(H)?new Error("THREE.WebGLRenderer: Error creating WebGL context with your selected attributes."):new Error("THREE.WebGLRenderer: Error creating WebGL context.")}se()}catch(R){throw i.removeEventListener("webglcontextlost",Le,!1),i.removeEventListener("webglcontextrestored",xe,!1),i.removeEventListener("webglcontextcreationerror",ni,!1),je("WebGLRenderer: "+R.message),R}function se(){Ue=new lR(W),Ue.init(),Gt=new $2(W,Ue),P=new JA(W,Ue,e,Gt),E=new Q2(W,Ue),P.reversedDepthBuffer&&g&&E.buffers.depth.setReversed(!0),rt=W.createFramebuffer(),j=W.createFramebuffer(),et=W.createFramebuffer(),nt=new fR(W),ot=new z2,_t=new J2(W,Ue,E,ot,P,Gt,nt),At=new oR(V),Ut=new dT(W),jt=new KA(W,Ut),pt=new cR(W,Ut,nt,jt),St=new dR(W,pt,Ut,jt,nt),k=new hR(W,P,_t),Kt=new $A(ot),Ft=new I2(V,At,Ue,P,jt,Kt),ae=new sw(V,ot),Ht=new F2,zt=new W2(Ue),he=new ZA(V,At,E,St,A,m),le=new K2(V,St,P),wt=new rw(W,nt,P,E),Ot=new QA(W,Ue,nt),Et=new uR(W,Ue,nt),nt.programs=Ft.programs,V.capabilities=P,V.extensions=Ue,V.properties=ot,V.renderLists=Ht,V.shadowMap=le,V.state=E,V.info=nt}C!==Vi&&(O=new mR(C,i.width,i.height,d,l,f));const Yt=new iw(V,W);this.xr=Yt,this.getContext=function(){return W},this.getContextAttributes=function(){return W.getContextAttributes()},this.forceContextLoss=function(){const R=Ue.get("WEBGL_lose_context");R&&R.loseContext()},this.forceContextRestore=function(){const R=Ue.get("WEBGL_lose_context");R&&R.restoreContext()},this.getPixelRatio=function(){return dt},this.setPixelRatio=function(R){R!==void 0&&(dt=R,this.setSize(Nt,Q,!1))},this.getSize=function(R){return R.set(Nt,Q)},this.setSize=function(R,H,ut=!0){if(Yt.isPresenting){ge("WebGLRenderer: Can't change size while VR device is presenting.");return}Nt=R,Q=H,i.width=Math.floor(R*dt),i.height=Math.floor(H*dt),ut===!0&&(i.style.width=R+"px",i.style.height=H+"px"),O!==null&&O.setSize(i.width,i.height),this.setViewport(0,0,R,H)},this.getDrawingBufferSize=function(R){return R.set(Nt*dt,Q*dt).floor()},this.setDrawingBufferSize=function(R,H,ut){Nt=R,Q=H,dt=ut,i.width=Math.floor(R*ut),i.height=Math.floor(H*ut),this.setViewport(0,0,R,H)},this.setEffects=function(R){if(C===Vi){je("WebGLRenderer: setEffects() requires outputBufferType set to HalfFloatType or FloatType.");return}if(R){for(let H=0;H<R.length;H++)if(R[H].isOutputPass===!0){ge("WebGLRenderer: OutputPass is not needed in setEffects(). Tone mapping and color space conversion are applied automatically.");break}}O.setEffects(R||[])},this.getCurrentViewport=function(R){return R.copy(vt)},this.getViewport=function(R){return R.copy(Mt)},this.setViewport=function(R,H,ut,at){R.isVector4?Mt.set(R.x,R.y,R.z,R.w):Mt.set(R,H,ut,at),E.viewport(vt.copy(Mt).multiplyScalar(dt).round())},this.getScissor=function(R){return R.copy(It)},this.setScissor=function(R,H,ut,at){R.isVector4?It.set(R.x,R.y,R.z,R.w):It.set(R,H,ut,at),E.scissor(ie.copy(It).multiplyScalar(dt).round())},this.getScissorTest=function(){return Ze},this.setScissorTest=function(R){E.setScissorTest(Ze=R)},this.setOpaqueSort=function(R){Dt=R},this.setTransparentSort=function(R){Wt=R},this.getClearColor=function(R){return R.copy(he.getClearColor())},this.setClearColor=function(){he.setClearColor(...arguments)},this.getClearAlpha=function(){return he.getClearAlpha()},this.setClearAlpha=function(){he.setClearAlpha(...arguments)},this.clear=function(R=!0,H=!0,ut=!0){let at=0;if(R){let st=!1;if(ht!==null){const Vt=ht.texture.format;st=y.has(Vt)}if(st){const Vt=ht.texture.type,Qt=S.has(Vt),Bt=he.getClearColor(),$t=he.getClearAlpha(),ee=Bt.r,pe=Bt.g,Se=Bt.b;Qt?(U[0]=ee,U[1]=pe,U[2]=Se,U[3]=$t,W.clearBufferuiv(W.COLOR,0,U)):(F[0]=ee,F[1]=pe,F[2]=Se,F[3]=$t,W.clearBufferiv(W.COLOR,0,F))}else at|=W.COLOR_BUFFER_BIT}H&&(at|=W.DEPTH_BUFFER_BIT,this.state.buffers.depth.setMask(!0)),ut&&(at|=W.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),at!==0&&W.clear(at)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.setNodesHandler=function(R){R.setRenderer(this),J=R},this.dispose=function(){i.removeEventListener("webglcontextlost",Le,!1),i.removeEventListener("webglcontextrestored",xe,!1),i.removeEventListener("webglcontextcreationerror",ni,!1),he.dispose(),Ht.dispose(),zt.dispose(),ot.dispose(),At.dispose(),St.dispose(),jt.dispose(),wt.dispose(),Ft.dispose(),Yt.dispose(),Yt.removeEventListener("sessionstart",Ya),Yt.removeEventListener("sessionend",Xi),Ai.stop()};function Le(R){R.preventDefault(),ax("WebGLRenderer: Context Lost."),Y=!0}function xe(){ax("WebGLRenderer: Context Restored."),Y=!1;const R=nt.autoReset,H=le.enabled,ut=le.autoUpdate,at=le.needsUpdate,st=le.type;se(),nt.autoReset=R,le.enabled=H,le.autoUpdate=ut,le.needsUpdate=at,le.type=st}function ni(R){je("WebGLRenderer: A WebGL context could not be created. Reason: ",R.statusMessage)}function In(R){const H=R.target;H.removeEventListener("dispose",In),Xa(H)}function Xa(R){dn(R),ot.remove(R)}function dn(R){const H=ot.get(R).programs;H!==void 0&&(H.forEach(function(ut){Ft.releaseProgram(ut)}),R.isShaderMaterial&&Ft.releaseShaderCache(R))}this.renderBufferDirect=function(R,H,ut,at,st,Vt){H===null&&(H=ve);const Qt=st.isMesh&&st.matrixWorld.determinantAffine()<0,Bt=pi(R,H,ut,at,st);E.setMaterial(at,Qt);let $t=ut.index,ee=1;if(at.wireframe===!0){if($t=pt.getWireframeAttribute(ut),$t===void 0)return;ee=2}const pe=ut.drawRange,Se=ut.attributes.position;let Jt=pe.start*ee,Ne=(pe.start+pe.count)*ee;Vt!==null&&(Jt=Math.max(Jt,Vt.start*ee),Ne=Math.min(Ne,(Vt.start+Vt.count)*ee)),$t!==null?(Jt=Math.max(Jt,0),Ne=Math.min(Ne,$t.count)):Se!=null&&(Jt=Math.max(Jt,0),Ne=Math.min(Ne,Se.count));const we=Ne-Jt;if(we<0||we===1/0)return;jt.setup(st,at,Bt,ut,$t);let Qe,Ye=Ot;if($t!==null&&(Qe=Ut.get($t),Ye=Et,Ye.setIndex(Qe)),st.isMesh)at.wireframe===!0?(E.setLineWidth(at.wireframeLinewidth*on()),Ye.setMode(W.LINES)):Ye.setMode(W.TRIANGLES);else if(st.isLine){let bn=at.linewidth;bn===void 0&&(bn=1),E.setLineWidth(bn*on()),st.isLineSegments?Ye.setMode(W.LINES):st.isLineLoop?Ye.setMode(W.LINE_LOOP):Ye.setMode(W.LINE_STRIP)}else st.isPoints?Ye.setMode(W.POINTS):st.isSprite&&Ye.setMode(W.TRIANGLES);if(st.isBatchedMesh)if(Ue.get("WEBGL_multi_draw"))Ye.renderMultiDraw(st._multiDrawStarts,st._multiDrawCounts,st._multiDrawCount);else{const bn=st._multiDrawStarts,qt=st._multiDrawCounts,pn=st._multiDrawCount,ze=$t?Ut.get($t).bytesPerElement:1,mt=ot.get(at).currentProgram.getUniforms();for(let Ct=0;Ct<pn;Ct++)mt.setValue(W,"_gl_DrawID",Ct),Ye.render(bn[Ct]/ze,qt[Ct])}else if(st.isInstancedMesh)Ye.renderInstances(Jt,we,st.count);else if(ut.isInstancedBufferGeometry){const bn=ut._maxInstanceCount!==void 0?ut._maxInstanceCount:1/0,qt=Math.min(ut.instanceCount,bn);Ye.renderInstances(Jt,we,qt)}else Ye.render(Jt,we)};function Wa(R,H,ut,at){J!==null&&R.isNodeMaterial&&J.setObject(at,R),Te===!0&&Kt.setState(R,ut,!1),R.transparent===!0&&R.side===Gi&&R.forceSinglePass===!1?(R.side=Ei,R.needsUpdate=!0,Yi(R,H,at),R.side=Lr,R.needsUpdate=!0,Yi(R,H,at),R.side=Gi):Yi(R,H,at)}this.compile=function(R,H,ut=null){ut===null&&(ut=R),J!==null&&J.renderStart(R,H,ut),D=zt.get(ut),D.init(H),T.push(D),ut.traverseVisible(function(st){st.isLight&&st.layers.test(H.layers)&&(D.pushLight(st),st.castShadow&&D.pushShadow(st))}),R!==ut&&R.traverseVisible(function(st){st.isLight&&st.layers.test(H.layers)&&(D.pushLight(st),st.castShadow&&D.pushShadow(st))}),D.setupLights(),J!==null&&J.updateLights(D.state.lightsArray),Ce=this.localClippingEnabled,Te=Kt.init(this.clippingPlanes,Ce),Te===!0&&Kt.setGlobalState(this.clippingPlanes,H),J!==null&&le.render(D.state.shadowsArray,ut,H);const at=new Set;return R.traverse(function(st){if(!(st.isMesh||st.isPoints||st.isLine||st.isSprite))return;const Vt=st.material;if(Vt)if(Array.isArray(Vt))for(let Qt=0;Qt<Vt.length;Qt++){const Bt=Vt[Qt];Wa(Bt,ut,H,st),at.add(Bt)}else Wa(Vt,ut,H,st),at.add(Vt)}),D=T.pop(),J!==null&&J.renderEnd(),at},this.compileAsync=function(R,H,ut=null){const at=this.compile(R,H,ut);return new Promise(st=>{function Vt(){if(at.forEach(function(Qt){const $t=ot.get(Qt).currentProgram;($t===void 0||$t.isReady())&&at.delete(Qt)}),at.size===0){st(R);return}setTimeout(Vt,10)}Ue.get("KHR_parallel_shader_compile")!==null?Vt():setTimeout(Vt,10)})};let xa=null;function Ti(R){xa&&xa(R)}function Ya(){Ai.stop()}function Xi(){Ai.start()}const Ai=new BS;Ai.setAnimationLoop(Ti),typeof self<"u"&&Ai.setContext(self),this.setAnimationLoop=function(R){xa=R,Yt.setAnimationLoop(R),R===null?Ai.stop():Ai.start()},Yt.addEventListener("sessionstart",Ya),Yt.addEventListener("sessionend",Xi),this.render=function(R,H){if(H!==void 0&&H.isCamera!==!0){je("WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(Y===!0)return;J!==null&&J.renderStart(R,H);const ut=Yt.enabled===!0&&Yt.isPresenting===!0,at=O!==null&&(ht===null||ut)&&O.begin(V,ht);if(R.matrixWorldAutoUpdate===!0&&R.updateMatrixWorld(),H.parent===null&&H.matrixWorldAutoUpdate===!0&&H.updateMatrixWorld(),Yt.enabled===!0&&Yt.isPresenting===!0&&(O===null||O.isCompositing()===!1)&&(Yt.cameraAutoUpdate===!0&&Yt.updateCamera(H),H=Yt.getCamera()),R.isScene===!0&&R.onBeforeRender(V,R,H,ht),D=zt.get(R,T.length),D.init(H),D.state.textureUnits=_t.getTextureUnits(),T.push(D),ce.multiplyMatrices(H.projectionMatrix,H.matrixWorldInverse),Ee.setFromProjectionMatrix(ce,Fa,H.reversedDepth),Ce=this.localClippingEnabled,Te=Kt.init(this.clippingPlanes,Ce),L=Ht.get(R,I.length),L.init(),I.push(L),Yt.enabled===!0&&Yt.isPresenting===!0){const Qt=V.xr.getDepthSensingMesh();Qt!==null&&Sa(Qt,H,-1/0,V.sortObjects)}Sa(R,H,0,V.sortObjects),L.finish(),J!==null&&J.updateLights(D.state.lightsArray),V.sortObjects===!0&&L.sort(Dt,Wt),We=Yt.enabled===!1||Yt.isPresenting===!1||Yt.hasDepthSensing()===!1,We&&he.addToRenderList(L,R),this.info.render.frame++,this.info.autoReset===!0&&this.info.reset(),Te===!0&&Kt.beginShadows();const st=D.state.shadowsArray;if(le.render(st,R,H),Te===!0&&Kt.endShadows(),(at&&O.hasRenderPass())===!1){const Qt=L.opaque,Bt=L.transmissive;if(D.setupLights(),H.isArrayCamera){const $t=H.cameras;if(Bt.length>0)for(let ee=0,pe=$t.length;ee<pe;ee++){const Se=$t[ee];Ri(Qt,Bt,R,Se)}We&&he.render(R);for(let ee=0,pe=$t.length;ee<pe;ee++){const Se=$t[ee];ya(L,R,Se,Se.viewport)}}else Bt.length>0&&Ri(Qt,Bt,R,H),We&&he.render(R),ya(L,R,H)}ht!==null&&Z===0&&(_t.updateMultisampleRenderTarget(ht),_t.updateRenderTargetMipmap(ht)),at&&O.end(V),R.isScene===!0&&R.onAfterRender(V,R,H),jt.resetDefaultState(),ct=-1,gt=null,T.pop(),T.length>0?(D=T[T.length-1],_t.setTextureUnits(D.state.textureUnits),Te===!0&&Kt.setGlobalState(V.clippingPlanes,D.state.camera)):D=null,I.pop(),I.length>0?L=I[I.length-1]:L=null,J!==null&&J.renderEnd()};function Sa(R,H,ut,at){if(R.visible===!1)return;if(R.layers.test(H.layers)){if(R.isGroup)ut=R.renderOrder;else if(R.isLOD)R.autoUpdate===!0&&R.update(H);else if(R.isLightProbeGrid)D.pushLightProbeGrid(R);else if(R.isLight)D.pushLight(R),R.castShadow&&D.pushShadow(R);else if(R.isSprite){if(!R.frustumCulled||R.intersectsFrustum(Ee)){at&&Ke.setFromMatrixPosition(R.matrixWorld).applyMatrix4(ce);const Qt=St.update(R),Bt=R.material;Bt.visible&&L.push(R,Qt,Bt,ut,Ke.z,null,H)}}else if((R.isMesh||R.isLine||R.isPoints)&&(!R.frustumCulled||R.intersectsFrustum(Ee))){const Qt=St.update(R),Bt=R.material;if(at&&(R.boundingSphere!==void 0?(R.boundingSphere===null&&R.computeBoundingSphere(),Ke.copy(R.boundingSphere.center)):(Qt.boundingSphere===null&&Qt.computeBoundingSphere(),Ke.copy(Qt.boundingSphere.center)),Ke.applyMatrix4(R.matrixWorld).applyMatrix4(ce)),Array.isArray(Bt)){const $t=Qt.groups;for(let ee=0,pe=$t.length;ee<pe;ee++){const Se=$t[ee],Jt=Bt[Se.materialIndex];Jt&&Jt.visible&&L.push(R,Qt,Jt,ut,Ke.z,Se,H)}}else Bt.visible&&L.push(R,Qt,Bt,ut,Ke.z,null,H)}}const Vt=R.children;for(let Qt=0,Bt=Vt.length;Qt<Bt;Qt++)Sa(Vt[Qt],H,ut,at)}function ya(R,H,ut,at){const{opaque:st,transmissive:Vt,transparent:Qt}=R;D.setupLightsView(ut),Te===!0&&Kt.setGlobalState(V.clippingPlanes,ut),at&&E.viewport(vt.copy(at)),st.length>0&&Wi(st,H,ut),Vt.length>0&&Wi(Vt,H,ut),Qt.length>0&&Wi(Qt,H,ut),E.buffers.depth.setTest(!0),E.buffers.depth.setMask(!0),E.buffers.color.setMask(!0),E.setPolygonOffset(!1)}function Ri(R,H,ut,at){if((ut.isScene===!0?ut.overrideMaterial:null)!==null)return;if(D.state.transmissionRenderTarget[at.id]===void 0){const Jt=Ue.has("EXT_color_buffer_half_float")||Ue.has("EXT_color_buffer_float");D.state.transmissionRenderTarget[at.id]=new va(1,1,{generateMipmaps:!0,type:Jt?Va:Vi,minFilter:Dr,samples:Math.max(4,P.samples),stencilBuffer:f,resolveDepthBuffer:!1,resolveStencilBuffer:!1,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,colorSpace:Xe.workingColorSpace})}const Vt=D.state.transmissionRenderTarget[at.id],Qt=at.viewport||vt;Vt.setSize(Qt.z*V.transmissionResolutionScale,Qt.w*V.transmissionResolutionScale);const Bt=V.getRenderTarget(),$t=V.getActiveCubeFace(),ee=V.getActiveMipmapLevel();V.setRenderTarget(Vt),V.getClearColor(B),xt=V.getClearAlpha(),xt<1&&V.setClearColor(16777215,.5),V.clear(),We&&he.render(ut);const pe=V.toneMapping;V.toneMapping=Ha;const Se=at.viewport;if(at.viewport!==void 0&&(at.viewport=void 0),D.setupLightsView(at),Te===!0&&Kt.setGlobalState(V.clippingPlanes,at),Wi(R,ut,at),_t.updateMultisampleRenderTarget(Vt),_t.updateRenderTargetMipmap(Vt),Ue.has("WEBGL_multisampled_render_to_texture")===!1){let Jt=!1;for(let Ne=0,we=H.length;Ne<we;Ne++){const Qe=H[Ne],{object:Ye,geometry:bn,material:qt,group:pn}=Qe;if(qt.side===Gi&&Ye.layers.test(at.layers)){const ze=qt.side;qt.side=Ei,qt.needsUpdate=!0,Ma(Ye,ut,at,bn,qt,pn),qt.side=ze,qt.needsUpdate=!0,Jt=!0}}Jt===!0&&(_t.updateMultisampleRenderTarget(Vt),_t.updateRenderTargetMipmap(Vt))}V.setRenderTarget(Bt,$t,ee),V.setClearColor(B,xt),Se!==void 0&&(at.viewport=Se),V.toneMapping=pe}function Wi(R,H,ut){const at=H.isScene===!0?H.overrideMaterial:null;for(let st=0,Vt=R.length;st<Vt;st++){const Qt=R[st],{object:Bt,geometry:$t,group:ee}=Qt;let pe=Qt.material;pe.allowOverride===!0&&at!==null&&(pe=at),Bt.layers.test(ut.layers)&&Ma(Bt,H,ut,$t,pe,ee)}}function Ma(R,H,ut,at,st,Vt){J!==null&&st.isNodeMaterial&&J.setObject(R,st),R.onBeforeRender(V,H,ut,at,st,Vt),R.modelViewMatrix.multiplyMatrices(ut.matrixWorldInverse,R.matrixWorld),R.normalMatrix.getNormalMatrix(R.modelViewMatrix),st.onBeforeRender(V,H,ut,at,R,Vt),st.transparent===!0&&st.side===Gi&&st.forceSinglePass===!1?(st.side=Ei,st.needsUpdate=!0,V.renderBufferDirect(ut,H,at,st,R,Vt),st.side=Lr,st.needsUpdate=!0,V.renderBufferDirect(ut,H,at,st,R,Vt),st.side=Gi):V.renderBufferDirect(ut,H,at,st,R,Vt),R.onAfterRender(V,H,ut,at,st,Vt)}function Yi(R,H,ut){H.isScene!==!0&&(H=ve);const at=ot.get(R),st=D.state.lights,Vt=D.state.shadowsArray,Qt=st.state.version,Bt=Ft.getParameters(R,st.state,Vt,H,ut,D.state.lightProbeGridArray),$t=Ft.getProgramCacheKey(Bt);let ee=at.programs;at.environment=R.isMeshStandardMaterial||R.isMeshLambertMaterial||R.isMeshPhongMaterial?H.environment:null,at.fog=H.fog;const pe=R.isMeshStandardMaterial||R.isMeshLambertMaterial&&!R.envMap||R.isMeshPhongMaterial&&!R.envMap;at.envMap=At.get(R.envMap||at.environment,pe),at.envMapRotation=at.environment!==null&&R.envMap===null?H.environmentRotation:R.envMapRotation,ee===void 0&&(R.addEventListener("dispose",In),ee=new Map,at.programs=ee);let Se=ee.get($t);if(Se!==void 0){if(at.currentProgram===Se&&at.lightsStateVersion===Qt)return xs(R,Bt),Se}else Bt.uniforms=Ft.getUniforms(R),J!==null&&R.isNodeMaterial&&J.build(R,ut,Bt),R.onBeforeCompile(Bt,V),Se=Ft.acquireProgram(Bt,$t),ee.set($t,Se),at.uniforms=Bt.uniforms;const Jt=at.uniforms;return(!R.isShaderMaterial&&!R.isRawShaderMaterial||R.clipping===!0)&&(Jt.clippingPlanes=Kt.uniform),xs(R,Bt),at.needsLights=mi(R),at.lightsStateVersion=Qt,at.needsLights&&(Jt.ambientLightColor.value=st.state.ambient,Jt.lightProbe.value=st.state.probe,Jt.sunLights.value=st.state.sun,Jt.sunLightShadows.value=st.state.sunShadow,Jt.directionalLights.value=st.state.directional,Jt.directionalLightShadows.value=st.state.directionalShadow,Jt.spotLights.value=st.state.spot,Jt.spotLightShadows.value=st.state.spotShadow,Jt.rectAreaLights.value=st.state.rectArea,Jt.ltc_1.value=st.state.rectAreaLTC1,Jt.ltc_2.value=st.state.rectAreaLTC2,Jt.pointLights.value=st.state.point,Jt.pointLightShadows.value=st.state.pointShadow,Jt.hemisphereLights.value=st.state.hemi,Jt.sunShadowMatrix.value=st.state.sunShadowMatrix,Jt.sunShadowCascade.value=st.state.sunShadowCascade,Jt.directionalShadowMatrix.value=st.state.directionalShadowMatrix,Jt.spotLightMatrix.value=st.state.spotLightMatrix,Jt.spotLightMap.value=st.state.spotLightMap,Jt.pointShadowMatrix.value=st.state.pointShadowMatrix),at.lightProbeGrid=D.state.lightProbeGridArray.length>0,at.currentProgram=Se,at.uniformsList=null,Se}function ir(R){if(R.uniformsList===null){const H=R.currentProgram.getUniforms();R.uniformsList=nf.seqWithValue(H.seq,R.uniforms)}return R.uniformsList}function xs(R,H){const ut=ot.get(R);ut.outputColorSpace=H.outputColorSpace,ut.batching=H.batching,ut.batchingColor=H.batchingColor,ut.instancing=H.instancing,ut.instancingColor=H.instancingColor,ut.instancingMorph=H.instancingMorph,ut.skinning=H.skinning,ut.morphTargets=H.morphTargets,ut.morphNormals=H.morphNormals,ut.morphColors=H.morphColors,ut.morphTargetsCount=H.morphTargetsCount,ut.numClippingPlanes=H.numClippingPlanes,ut.numIntersection=H.numClipIntersection,ut.vertexAlphas=H.vertexAlphas,ut.vertexTangents=H.vertexTangents,ut.toneMapping=H.toneMapping}function Ss(R,H){if(R.length===0)return null;if(R.length===1)return R[0].texture!==null?R[0]:null;N.setFromMatrixPosition(H.matrixWorld);for(let ut=0,at=R.length;ut<at;ut++){const st=R[ut];if(st.texture!==null&&st.boundingBox.containsPoint(N))return st}return null}function pi(R,H,ut,at,st){H.isScene!==!0&&(H=ve),_t.resetTextureUnits();const Vt=H.fog,Qt=at.isMeshStandardMaterial||at.isMeshLambertMaterial||at.isMeshPhongMaterial?H.environment:null,Bt=ht===null?V.outputColorSpace:ht.isXRRenderTarget===!0?ht.texture.colorSpace:Xe.workingColorSpace,$t=at.isMeshStandardMaterial||at.isMeshLambertMaterial&&!at.envMap||at.isMeshPhongMaterial&&!at.envMap,ee=At.get(at.envMap||Qt,$t),pe=at.vertexColors===!0&&!!ut.attributes.color&&ut.attributes.color.itemSize===4,Se=!!ut.attributes.tangent&&(!!at.normalMap||at.anisotropy>0),Jt=!!ut.morphAttributes.position,Ne=!!ut.morphAttributes.normal,we=!!ut.morphAttributes.color;let Qe=Ha;at.toneMapped&&(ht===null||ht.isXRRenderTarget===!0)&&(Qe=V.toneMapping);const Ye=ut.morphAttributes.position||ut.morphAttributes.normal||ut.morphAttributes.color,bn=Ye!==void 0?Ye.length:0,qt=ot.get(at),pn=D.state.lights;if(Te===!0&&(Ce===!0||R!==gt)){const re=R===gt&&at.id===ct;Kt.setState(at,R,re)}let ze=!1;at.version===qt.__version?(qt.needsLights&&qt.lightsStateVersion!==pn.state.version||qt.outputColorSpace!==Bt||st.isBatchedMesh&&qt.batching===!1||!st.isBatchedMesh&&qt.batching===!0||st.isBatchedMesh&&qt.batchingColor===!0&&st._colorsTexture===null||st.isBatchedMesh&&qt.batchingColor===!1&&st._colorsTexture!==null||st.isInstancedMesh&&qt.instancing===!1||!st.isInstancedMesh&&qt.instancing===!0||st.isSkinnedMesh&&qt.skinning===!1||!st.isSkinnedMesh&&qt.skinning===!0||st.isInstancedMesh&&qt.instancingColor===!0&&st.instanceColor===null||st.isInstancedMesh&&qt.instancingColor===!1&&st.instanceColor!==null||st.isInstancedMesh&&qt.instancingMorph===!0&&st.morphTexture===null||st.isInstancedMesh&&qt.instancingMorph===!1&&st.morphTexture!==null||qt.envMap!==ee||at.fog===!0&&qt.fog!==Vt||qt.numClippingPlanes!==void 0&&(qt.numClippingPlanes!==Kt.numPlanes||qt.numIntersection!==Kt.numIntersection)||qt.vertexAlphas!==pe||qt.vertexTangents!==Se||qt.morphTargets!==Jt||qt.morphNormals!==Ne||qt.morphColors!==we||qt.toneMapping!==Qe||qt.morphTargetsCount!==bn||!!qt.lightProbeGrid!=D.state.lightProbeGridArray.length>0)&&(ze=!0):(ze=!0,qt.__version=at.version);let mt=qt.currentProgram;ze===!0&&(mt=Yi(at,H,st),J&&at.isNodeMaterial&&J.onUpdateProgram(at,mt,qt));let Ct=!1,Lt=!1,yt=!1;const Rt=mt.getUniforms(),Pt=qt.uniforms;if(E.useProgram(mt.program)&&(Ct=!0,Lt=!0,yt=!0),at.id!==ct&&(ct=at.id,Lt=!0),qt.needsLights){const re=Ss(D.state.lightProbeGridArray,st);qt.lightProbeGrid!==re&&(qt.lightProbeGrid=re,Lt=!0)}if(Ct||gt!==R){E.buffers.depth.getReversed()&&R.reversedDepth!==!0&&(R._reversedDepth=!0,R.updateProjectionMatrix()),Rt.setValue(W,"projectionMatrix",R.projectionMatrix),Rt.setValue(W,"viewMatrix",R.matrixWorldInverse);const de=Rt.map.cameraPosition;de!==void 0&&de.setValue(W,fe.setFromMatrixPosition(R.matrixWorld)),P.logarithmicDepthBuffer&&Rt.setValue(W,"logDepthBufFC",2/(Math.log(R.far+1)/Math.LN2)),(at.isMeshPhongMaterial||at.isMeshToonMaterial||at.isMeshLambertMaterial||at.isMeshBasicMaterial||at.isMeshStandardMaterial||at.isShaderMaterial)&&Rt.setValue(W,"isOrthographic",R.isOrthographicCamera===!0),gt!==R&&(gt=R,Lt=!0,yt=!0)}if(qt.needsLights&&(pn.state.sunShadowMap.length>0&&Rt.setValue(W,"sunShadowMap",pn.state.sunShadowMap,_t),pn.state.directionalShadowMap.length>0&&Rt.setValue(W,"directionalShadowMap",pn.state.directionalShadowMap,_t),pn.state.spotShadowMap.length>0&&Rt.setValue(W,"spotShadowMap",pn.state.spotShadowMap,_t),pn.state.pointShadowMap.length>0&&Rt.setValue(W,"pointShadowMap",pn.state.pointShadowMap,_t)),st.isSkinnedMesh){Rt.setOptional(W,st,"bindMatrix"),Rt.setOptional(W,st,"bindMatrixInverse");const re=st.skeleton;re&&(re.boneTexture===null&&re.computeBoneTexture(),Rt.setValue(W,"boneTexture",re.boneTexture,_t))}st.isBatchedMesh&&(Rt.setOptional(W,st,"batchingTexture"),Rt.setValue(W,"batchingTexture",st._matricesTexture,_t),Rt.setOptional(W,st,"batchingIdTexture"),Rt.setValue(W,"batchingIdTexture",st._indirectTexture,_t),Rt.setOptional(W,st,"batchingColorTexture"),st._colorsTexture!==null&&Rt.setValue(W,"batchingColorTexture",st._colorsTexture,_t));const kt=ut.morphAttributes;if((kt.position!==void 0||kt.normal!==void 0||kt.color!==void 0)&&k.update(st,ut,mt),(Lt||qt.receiveShadow!==st.receiveShadow)&&(qt.receiveShadow=st.receiveShadow,Rt.setValue(W,"receiveShadow",st.receiveShadow)),(at.isMeshStandardMaterial||at.isMeshLambertMaterial||at.isMeshPhongMaterial)&&at.envMap===null&&H.environment!==null&&(Pt.envMapIntensity.value=H.environmentIntensity),Pt.dfgLUT!==void 0&&(Pt.dfgLUT.value=lw()),Lt){if(Rt.setValue(W,"toneMappingExposure",V.toneMappingExposure),qt.needsLights&&ar(Pt,yt),Vt&&at.fog===!0&&ae.refreshFogUniforms(Pt,Vt),ae.refreshMaterialUniforms(Pt,at,dt,Q,D.state.transmissionRenderTarget[R.id]),qt.needsLights&&qt.lightProbeGrid){const re=qt.lightProbeGrid;Pt.probesSH.value=re.texture,Pt.probesMin.value.copy(re.boundingBox.min),Pt.probesMax.value.copy(re.boundingBox.max),Pt.probesResolution.value.copy(re.resolution)}nf.upload(W,ir(qt),Pt,_t)}if(at.isShaderMaterial&&at.uniformsNeedUpdate===!0&&(nf.upload(W,ir(qt),Pt,_t),at.uniformsNeedUpdate=!1),at.isSpriteMaterial&&Rt.setValue(W,"center",st.center),Rt.setValue(W,"modelViewMatrix",st.modelViewMatrix),Rt.setValue(W,"normalMatrix",st.normalMatrix),Rt.setValue(W,"modelMatrix",st.matrixWorld),at.uniformsGroups!==void 0){const re=at.uniformsGroups;for(let de=0,Vn=re.length;de<Vn;de++){const wi=re[de];wt.update(wi,mt),wt.bind(wi,mt)}}return mt}function ar(R,H){R.ambientLightColor.needsUpdate=H,R.lightProbe.needsUpdate=H,R.sunLights.needsUpdate=H,R.sunLightShadows.needsUpdate=H,R.directionalLights.needsUpdate=H,R.directionalLightShadows.needsUpdate=H,R.pointLights.needsUpdate=H,R.pointLightShadows.needsUpdate=H,R.spotLights.needsUpdate=H,R.spotLightShadows.needsUpdate=H,R.rectAreaLights.needsUpdate=H,R.hemisphereLights.needsUpdate=H}function mi(R){return R.isMeshLambertMaterial||R.isMeshToonMaterial||R.isMeshPhongMaterial||R.isMeshStandardMaterial||R.isShadowMaterial||R.isShaderMaterial&&R.lights===!0}this.getActiveCubeFace=function(){return q},this.getActiveMipmapLevel=function(){return Z},this.getRenderTarget=function(){return ht},this.setRenderTargetTextures=function(R,H,ut){const at=ot.get(R);at.__autoAllocateDepthBuffer=R.resolveDepthBuffer===!1,at.__autoAllocateDepthBuffer===!1&&(at.__useRenderToTexture=!1),ot.get(R.texture).__webglTexture=H,ot.get(R.depthTexture).__webglTexture=at.__autoAllocateDepthBuffer?void 0:ut,at.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(R,H){const ut=ot.get(R);ut.__webglFramebuffer=H,ut.__useDefaultFramebuffer=H===void 0},this.setRenderTarget=function(R,H=0,ut=0){ht=R,q=H,Z=ut;let at=null,st=!1,Vt=!1;if(R){const Bt=ot.get(R);if(Bt.__useDefaultFramebuffer!==void 0){E.bindFramebuffer(W.FRAMEBUFFER,Bt.__webglFramebuffer),vt.copy(R.viewport),ie.copy(R.scissor),ne=R.scissorTest,E.viewport(vt),E.scissor(ie),E.setScissorTest(ne),ct=-1;return}else if(Bt.__webglFramebuffer===void 0)_t.setupRenderTarget(R);else if(Bt.__hasExternalTextures)_t.rebindTextures(R,ot.get(R.texture).__webglTexture,ot.get(R.depthTexture).__webglTexture);else if(R.depthBuffer){const pe=R.depthTexture;if(Bt.__boundDepthTexture!==pe){if(pe!==null&&ot.has(pe)&&(R.width!==pe.image.width||R.height!==pe.image.height))throw new Error("THREE.WebGLRenderer: Attached DepthTexture is initialized to the incorrect size.");_t.setupDepthRenderbuffer(R)}}const $t=R.texture;($t.isData3DTexture||$t.isDataArrayTexture||$t.isCompressedArrayTexture)&&(Vt=!0);const ee=ot.get(R).__webglFramebuffer;R.isWebGLCubeRenderTarget?(Array.isArray(ee[H])?at=ee[H][ut]:at=ee[H],st=!0):R.samples>0&&_t.useMultisampledRTT(R)===!1?at=ot.get(R).__webglMultisampledFramebuffer:Array.isArray(ee)?at=ee[ut]:at=ee,vt.copy(R.viewport),ie.copy(R.scissor),ne=R.scissorTest}else vt.copy(Mt).multiplyScalar(dt).floor(),ie.copy(It).multiplyScalar(dt).floor(),ne=Ze;if(ut!==0&&(at=rt),E.bindFramebuffer(W.FRAMEBUFFER,at)&&E.drawBuffers(R,at),E.viewport(vt),E.scissor(ie),E.setScissorTest(ne),st){const Bt=ot.get(R.texture);W.framebufferTexture2D(W.FRAMEBUFFER,W.COLOR_ATTACHMENT0,W.TEXTURE_CUBE_MAP_POSITIVE_X+H,Bt.__webglTexture,ut)}else if(Vt){const Bt=H;for(let $t=0;$t<R.textures.length;$t++){const ee=ot.get(R.textures[$t]);W.framebufferTextureLayer(W.FRAMEBUFFER,W.COLOR_ATTACHMENT0+$t,ee.__webglTexture,ut,Bt)}}else if(R!==null&&ut!==0){const Bt=ot.get(R.texture);W.framebufferTexture2D(W.FRAMEBUFFER,W.COLOR_ATTACHMENT0,W.TEXTURE_2D,Bt.__webglTexture,ut)}ct=-1};function oi(R){const H=ot.get(R);return(H.__readFormat!==R.format||H.__readType!==R.type)&&(H.__readFormat=R.format,H.__readType=R.type,H.__formatReadable=P.textureFormatReadable(R.format),H.__typeReadable=P.textureTypeReadable(R.type)),H}this.readRenderTargetPixels=function(R,H,ut,at,st,Vt,Qt,Bt=0){if(!(R&&R.isWebGLRenderTarget)){je("WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let $t=ot.get(R).__webglFramebuffer;if(R.isWebGLCubeRenderTarget&&Qt!==void 0&&($t=$t[Qt]),$t){E.bindFramebuffer(W.FRAMEBUFFER,$t);try{const ee=R.textures[Bt],pe=ee.format,Se=ee.type;R.textures.length>1&&W.readBuffer(W.COLOR_ATTACHMENT0+Bt);const Jt=oi(ee);if(Jt.__formatReadable===!1){je("WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(Jt.__typeReadable===!1){je("WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}H>=0&&H<=R.width-at&&ut>=0&&ut<=R.height-st&&W.readPixels(H,ut,at,st,Gt.convert(pe),Gt.convert(Se),Vt)}finally{const ee=ht!==null?ot.get(ht).__webglFramebuffer:null;E.bindFramebuffer(W.FRAMEBUFFER,ee)}}},this.readRenderTargetPixelsAsync=async function(R,H,ut,at,st,Vt,Qt,Bt=0){if(!(R&&R.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let $t=ot.get(R).__webglFramebuffer;if(R.isWebGLCubeRenderTarget&&Qt!==void 0&&($t=$t[Qt]),$t)if(H>=0&&H<=R.width-at&&ut>=0&&ut<=R.height-st){E.bindFramebuffer(W.FRAMEBUFFER,$t);const ee=R.textures[Bt],pe=ee.format,Se=ee.type;R.textures.length>1&&W.readBuffer(W.COLOR_ATTACHMENT0+Bt);const Jt=oi(ee);if(Jt.__formatReadable===!1)throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(Jt.__typeReadable===!1)throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");const Ne=W.createBuffer();W.bindBuffer(W.PIXEL_PACK_BUFFER,Ne),W.bufferData(W.PIXEL_PACK_BUFFER,Vt.byteLength,W.STREAM_READ),W.readPixels(H,ut,at,st,Gt.convert(pe),Gt.convert(Se),0),W.bindBuffer(W.PIXEL_PACK_BUFFER,null);const we=ht!==null?ot.get(ht).__webglFramebuffer:null;E.bindFramebuffer(W.FRAMEBUFFER,we);const Qe=W.fenceSync(W.SYNC_GPU_COMMANDS_COMPLETE,0);return W.flush(),await yb(W,Qe,4),W.bindBuffer(W.PIXEL_PACK_BUFFER,Ne),W.getBufferSubData(W.PIXEL_PACK_BUFFER,0,Vt),W.bindBuffer(W.PIXEL_PACK_BUFFER,null),W.deleteBuffer(Ne),W.deleteSync(Qe),Vt}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")},this.copyFramebufferToTexture=function(R,H=null,ut=0){const at=Math.pow(2,-ut),st=Math.floor(R.image.width*at),Vt=Math.floor(R.image.height*at),Qt=H!==null?H.x:0,Bt=H!==null?H.y:0;_t.setTexture2D(R,0),W.copyTexSubImage2D(W.TEXTURE_2D,ut,0,0,Qt,Bt,st,Vt),E.unbindTexture()},this.copyTextureToTexture=function(R,H,ut=null,at=null,st=0,Vt=0){let Qt,Bt,$t,ee,pe,Se,Jt,Ne,we;const Qe=R.isCompressedTexture?R.mipmaps[Vt]:R.image;if(ut!==null)Qt=ut.max.x-ut.min.x,Bt=ut.max.y-ut.min.y,$t=ut.isBox3?ut.max.z-ut.min.z:1,ee=ut.min.x,pe=ut.min.y,Se=ut.isBox3?ut.min.z:0;else{const Pt=Math.pow(2,-st);Qt=Math.floor(Qe.width*Pt),Bt=Math.floor(Qe.height*Pt),R.isDataArrayTexture?$t=Qe.depth:R.isData3DTexture?$t=Math.floor(Qe.depth*Pt):$t=1,ee=0,pe=0,Se=0}at!==null?(Jt=at.x,Ne=at.y,we=at.z):(Jt=0,Ne=0,we=0);const Ye=Gt.convert(H.format),bn=Gt.convert(H.type);let qt;H.isData3DTexture?(_t.setTexture3D(H,0),qt=W.TEXTURE_3D):H.isDataArrayTexture||H.isCompressedArrayTexture?(_t.setTexture2DArray(H,0),qt=W.TEXTURE_2D_ARRAY):(_t.setTexture2D(H,0),qt=W.TEXTURE_2D),E.activeTexture(W.TEXTURE0),E.pixelStorei(W.UNPACK_FLIP_Y_WEBGL,H.flipY),E.pixelStorei(W.UNPACK_PREMULTIPLY_ALPHA_WEBGL,H.premultiplyAlpha),E.pixelStorei(W.UNPACK_ALIGNMENT,H.unpackAlignment);const pn=E.getParameter(W.UNPACK_ROW_LENGTH),ze=E.getParameter(W.UNPACK_IMAGE_HEIGHT),mt=E.getParameter(W.UNPACK_SKIP_PIXELS),Ct=E.getParameter(W.UNPACK_SKIP_ROWS),Lt=E.getParameter(W.UNPACK_SKIP_IMAGES);E.pixelStorei(W.UNPACK_ROW_LENGTH,Qe.width),E.pixelStorei(W.UNPACK_IMAGE_HEIGHT,Qe.height),E.pixelStorei(W.UNPACK_SKIP_PIXELS,ee),E.pixelStorei(W.UNPACK_SKIP_ROWS,pe),E.pixelStorei(W.UNPACK_SKIP_IMAGES,Se);const yt=R.isDataArrayTexture||R.isData3DTexture,Rt=H.isDataArrayTexture||H.isData3DTexture;if(R.isDepthTexture){const Pt=ot.get(R),kt=ot.get(H),re=ot.get(Pt.__renderTarget),de=ot.get(kt.__renderTarget);E.bindFramebuffer(W.READ_FRAMEBUFFER,re.__webglFramebuffer),E.bindFramebuffer(W.DRAW_FRAMEBUFFER,de.__webglFramebuffer);for(let Vn=0;Vn<$t;Vn++)yt&&(W.framebufferTextureLayer(W.READ_FRAMEBUFFER,W.COLOR_ATTACHMENT0,ot.get(R).__webglTexture,st,Se+Vn),W.framebufferTextureLayer(W.DRAW_FRAMEBUFFER,W.COLOR_ATTACHMENT0,ot.get(H).__webglTexture,Vt,we+Vn)),W.blitFramebuffer(ee,pe,Qt,Bt,Jt,Ne,Qt,Bt,W.DEPTH_BUFFER_BIT,W.NEAREST);E.bindFramebuffer(W.READ_FRAMEBUFFER,null),E.bindFramebuffer(W.DRAW_FRAMEBUFFER,null)}else if(st!==0||R.isRenderTargetTexture||ot.has(R)){const Pt=ot.get(R),kt=ot.get(H);E.bindFramebuffer(W.READ_FRAMEBUFFER,j),E.bindFramebuffer(W.DRAW_FRAMEBUFFER,et);for(let re=0;re<$t;re++)yt?W.framebufferTextureLayer(W.READ_FRAMEBUFFER,W.COLOR_ATTACHMENT0,Pt.__webglTexture,st,Se+re):W.framebufferTexture2D(W.READ_FRAMEBUFFER,W.COLOR_ATTACHMENT0,W.TEXTURE_2D,Pt.__webglTexture,st),Rt?W.framebufferTextureLayer(W.DRAW_FRAMEBUFFER,W.COLOR_ATTACHMENT0,kt.__webglTexture,Vt,we+re):W.framebufferTexture2D(W.DRAW_FRAMEBUFFER,W.COLOR_ATTACHMENT0,W.TEXTURE_2D,kt.__webglTexture,Vt),st!==0?W.blitFramebuffer(ee,pe,Qt,Bt,Jt,Ne,Qt,Bt,W.COLOR_BUFFER_BIT,W.NEAREST):Rt?W.copyTexSubImage3D(qt,Vt,Jt,Ne,we+re,ee,pe,Qt,Bt):W.copyTexSubImage2D(qt,Vt,Jt,Ne,ee,pe,Qt,Bt);E.bindFramebuffer(W.READ_FRAMEBUFFER,null),E.bindFramebuffer(W.DRAW_FRAMEBUFFER,null)}else Rt?R.isDataTexture||R.isData3DTexture?W.texSubImage3D(qt,Vt,Jt,Ne,we,Qt,Bt,$t,Ye,bn,Qe.data):H.isCompressedArrayTexture?W.compressedTexSubImage3D(qt,Vt,Jt,Ne,we,Qt,Bt,$t,Ye,Qe.data):W.texSubImage3D(qt,Vt,Jt,Ne,we,Qt,Bt,$t,Ye,bn,Qe):R.isDataTexture?W.texSubImage2D(W.TEXTURE_2D,Vt,Jt,Ne,Qt,Bt,Ye,bn,Qe.data):R.isCompressedTexture?W.compressedTexSubImage2D(W.TEXTURE_2D,Vt,Jt,Ne,Qe.width,Qe.height,Ye,Qe.data):W.texSubImage2D(W.TEXTURE_2D,Vt,Jt,Ne,Qt,Bt,Ye,bn,Qe);E.pixelStorei(W.UNPACK_ROW_LENGTH,pn),E.pixelStorei(W.UNPACK_IMAGE_HEIGHT,ze),E.pixelStorei(W.UNPACK_SKIP_PIXELS,mt),E.pixelStorei(W.UNPACK_SKIP_ROWS,Ct),E.pixelStorei(W.UNPACK_SKIP_IMAGES,Lt),Vt===0&&H.generateMipmaps&&W.generateMipmap(qt),E.unbindTexture()},this.initRenderTarget=function(R){ot.get(R).__webglFramebuffer===void 0&&_t.setupRenderTarget(R)},this.initTexture=function(R){R.isCubeTexture?_t.setTextureCube(R,0):R.isData3DTexture?_t.setTexture3D(R,0):R.isDataArrayTexture||R.isCompressedArrayTexture?_t.setTexture2DArray(R,0):_t.setTexture2D(R,0),E.unbindTexture()},this.resetState=function(){q=0,Z=0,ht=null,E.reset(),jt.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return Fa}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(e){this._outputColorSpace=e;const i=this.getContext();i.drawingBufferColorSpace=Xe._getDrawingBufferColorSpace(e),i.unpackColorSpace=Xe._getUnpackColorSpace()}}const iS={type:"change"},Im={type:"start"},YS={type:"end"},Qu=new mf,aS=new ds,uw=Math.cos(70*bb.DEG2RAD),Fn=new X,Mi=2*Math.PI,rn={NONE:-1,ROTATE:0,DOLLY:1,PAN:2,TOUCH_ROTATE:3,TOUCH_PAN:4,TOUCH_DOLLY_PAN:5,TOUCH_DOLLY_ROTATE:6},Tp=1e-6;class fw extends fT{constructor(e,i=null){super(e,i),this.state=rn.NONE,this.target=new X,this.cursor=new X,this.minDistance=0,this.maxDistance=1/0,this.minZoom=0,this.maxZoom=1/0,this.minTargetRadius=0,this.maxTargetRadius=1/0,this.minPolarAngle=0,this.maxPolarAngle=Math.PI,this.minAzimuthAngle=-1/0,this.maxAzimuthAngle=1/0,this.enableDamping=!1,this.dampingFactor=.05,this.enableZoom=!0,this.zoomSpeed=1,this.enableRotate=!0,this.rotateSpeed=1,this.keyRotateSpeed=1,this.enablePan=!0,this.panSpeed=1,this.screenSpacePanning=!0,this.keyPanSpeed=7,this.zoomToCursor=!1,this.autoRotate=!1,this.autoRotateSpeed=2,this.keys={LEFT:"ArrowLeft",UP:"ArrowUp",RIGHT:"ArrowRight",BOTTOM:"ArrowDown"},this.mouseButtons={LEFT:Fo.ROTATE,MIDDLE:Fo.DOLLY,RIGHT:Fo.PAN},this.touches={ONE:zo.ROTATE,TWO:zo.DOLLY_PAN},this.target0=this.target.clone(),this.position0=this.object.position.clone(),this.zoom0=this.object.zoom,this._cursorStyle="auto",this._domElementKeyEvents=null,this._lastPosition=new X,this._lastQuaternion=new tr,this._lastTargetPosition=new X,this._quat=new tr().setFromUnitVectors(e.up,new X(0,1,0)),this._quatInverse=this._quat.clone().invert(),this._spherical=new Ux,this._sphericalDelta=new Ux,this._scale=1,this._panOffset=new X,this._rotateStart=new _e,this._rotateEnd=new _e,this._rotateDelta=new _e,this._panStart=new _e,this._panEnd=new _e,this._panDelta=new _e,this._dollyStart=new _e,this._dollyEnd=new _e,this._dollyDelta=new _e,this._dollyDirection=new X,this._mouse=new _e,this._performCursorZoom=!1,this._pointers=[],this._pointerPositions={},this._controlActive=!1,this._onPointerMove=dw.bind(this),this._onPointerDown=hw.bind(this),this._onPointerUp=pw.bind(this),this._onContextMenu=yw.bind(this),this._onMouseWheel=_w.bind(this),this._onKeyDown=vw.bind(this),this._onTouchStart=xw.bind(this),this._onTouchMove=Sw.bind(this),this._onMouseDown=mw.bind(this),this._onMouseMove=gw.bind(this),this._interceptControlDown=Mw.bind(this),this._interceptControlUp=Ew.bind(this),this.domElement!==null&&this.connect(this.domElement),this.update()}set cursorStyle(e){this._cursorStyle=e,e==="grab"?this.domElement.style.cursor="grab":this.domElement.style.cursor="auto"}get cursorStyle(){return this._cursorStyle}connect(e){super.connect(e),this.domElement.addEventListener("pointerdown",this._onPointerDown),this.domElement.addEventListener("pointercancel",this._onPointerUp),this.domElement.addEventListener("contextmenu",this._onContextMenu),this.domElement.addEventListener("wheel",this._onMouseWheel,{passive:!1}),this.domElement.getRootNode().addEventListener("keydown",this._interceptControlDown,{passive:!0,capture:!0}),this.domElement.style.touchAction="none"}disconnect(){this.state=rn.NONE,this.domElement.removeEventListener("pointerdown",this._onPointerDown),this.domElement.ownerDocument.removeEventListener("pointermove",this._onPointerMove),this.domElement.ownerDocument.removeEventListener("pointerup",this._onPointerUp),this.domElement.removeEventListener("pointercancel",this._onPointerUp),this.domElement.removeEventListener("wheel",this._onMouseWheel),this.domElement.removeEventListener("contextmenu",this._onContextMenu),this.stopListenToKeyEvents();const e=this.domElement.getRootNode();e.removeEventListener("keydown",this._interceptControlDown,{capture:!0}),e.removeEventListener("keyup",this._interceptControlUp,{capture:!0}),this._controlActive=!1,this._pointers.length=0,this._pointerPositions={},this.domElement.style.touchAction="",this.domElement.style.cursor="auto"}dispose(){this.disconnect()}getPolarAngle(){return this._spherical.phi}getAzimuthalAngle(){return this._spherical.theta}getDistance(){return this.object.position.distanceTo(this.target)}listenToKeyEvents(e){e.addEventListener("keydown",this._onKeyDown),this._domElementKeyEvents=e}stopListenToKeyEvents(){this._domElementKeyEvents!==null&&(this._domElementKeyEvents.removeEventListener("keydown",this._onKeyDown),this._domElementKeyEvents=null)}saveState(){this.target0.copy(this.target),this.position0.copy(this.object.position),this.zoom0=this.object.zoom}reset(){this.target.copy(this.target0),this.object.position.copy(this.position0),this.object.zoom=this.zoom0,this.object.updateProjectionMatrix(),this.dispatchEvent(iS),this.update(),this.state=rn.NONE}pan(e,i){this._pan(e,i),this.update()}dollyIn(e){this._dollyIn(e),this.update()}dollyOut(e){this._dollyOut(e),this.update()}rotateLeft(e){this._rotateLeft(e),this.update()}rotateUp(e){this._rotateUp(e),this.update()}update(e=null){const i=this.object.position;Fn.copy(i).sub(this.target),Fn.applyQuaternion(this._quat),this._spherical.setFromVector3(Fn),this.autoRotate&&this.state===rn.NONE&&this._rotateLeft(this._getAutoRotationAngle(e)),this.enableDamping?(this._spherical.theta+=this._sphericalDelta.theta*this.dampingFactor,this._spherical.phi+=this._sphericalDelta.phi*this.dampingFactor):(this._spherical.theta+=this._sphericalDelta.theta,this._spherical.phi+=this._sphericalDelta.phi);let s=this.minAzimuthAngle,l=this.maxAzimuthAngle;isFinite(s)&&isFinite(l)&&(s<-Math.PI?s+=Mi:s>Math.PI&&(s-=Mi),l<-Math.PI?l+=Mi:l>Math.PI&&(l-=Mi),s<=l?this._spherical.theta=Math.max(s,Math.min(l,this._spherical.theta)):this._spherical.theta=this._spherical.theta>(s+l)/2?Math.max(s,this._spherical.theta):Math.min(l,this._spherical.theta)),this._spherical.phi=Math.max(this.minPolarAngle,Math.min(this.maxPolarAngle,this._spherical.phi)),this._spherical.makeSafe(),this.enableDamping===!0?this.target.addScaledVector(this._panOffset,this.dampingFactor):this.target.add(this._panOffset),this.target.sub(this.cursor),this.target.clampLength(this.minTargetRadius,this.maxTargetRadius),this.target.add(this.cursor);let f=!1;if(this.zoomToCursor&&this._performCursorZoom||this.object.isOrthographicCamera)this._spherical.radius=this._clampDistance(this._spherical.radius);else{const h=this._spherical.radius;this._spherical.radius=this._clampDistance(this._spherical.radius*this._scale),f=h!=this._spherical.radius}if(Fn.setFromSpherical(this._spherical),Fn.applyQuaternion(this._quatInverse),i.copy(this.target).add(Fn),this.object.lookAt(this.target),this.enableDamping===!0?(this._sphericalDelta.theta*=1-this.dampingFactor,this._sphericalDelta.phi*=1-this.dampingFactor,this._panOffset.multiplyScalar(1-this.dampingFactor)):(this._sphericalDelta.set(0,0,0),this._panOffset.set(0,0,0)),this.zoomToCursor&&this._performCursorZoom){let h=null;if(this.object.isPerspectiveCamera){const d=Fn.length();h=this._clampDistance(d*this._scale);const m=d-h;this.object.position.addScaledVector(this._dollyDirection,m),this.object.updateMatrixWorld(),f=!!m}else if(this.object.isOrthographicCamera){const d=new X(this._mouse.x,this._mouse.y,0);d.unproject(this.object);const m=this.object.zoom;this.object.zoom=Math.max(this.minZoom,Math.min(this.maxZoom,this.object.zoom/this._scale)),this.object.updateProjectionMatrix(),f=m!==this.object.zoom;const p=new X(this._mouse.x,this._mouse.y,0);p.unproject(this.object),this.object.position.sub(p).add(d),this.object.updateMatrixWorld(),h=Fn.length()}else console.warn("WARNING: OrbitControls.js encountered an unknown camera type - zoom to cursor disabled."),this.zoomToCursor=!1;h!==null&&(this.screenSpacePanning?this.target.set(0,0,-1).transformDirection(this.object.matrix).multiplyScalar(h).add(this.object.position):(Qu.origin.copy(this.object.position),Qu.direction.set(0,0,-1).transformDirection(this.object.matrix),Math.abs(this.object.up.dot(Qu.direction))<uw?this.object.lookAt(this.target):(aS.setFromNormalAndCoplanarPoint(this.object.up,this.target),Qu.intersectPlane(aS,this.target))))}else if(this.object.isOrthographicCamera){const h=this.object.zoom;this.object.zoom=Math.max(this.minZoom,Math.min(this.maxZoom,this.object.zoom/this._scale)),h!==this.object.zoom&&(this.object.updateProjectionMatrix(),f=!0)}return this._scale=1,this._performCursorZoom=!1,f||this._lastPosition.distanceToSquared(this.object.position)>Tp||8*(1-this._lastQuaternion.dot(this.object.quaternion))>Tp||this._lastTargetPosition.distanceToSquared(this.target)>Tp?(this.dispatchEvent(iS),this._lastPosition.copy(this.object.position),this._lastQuaternion.copy(this.object.quaternion),this._lastTargetPosition.copy(this.target),!0):!1}_getAutoRotationAngle(e){return e!==null?Mi/60*this.autoRotateSpeed*e:Mi/60/60*this.autoRotateSpeed}_getZoomScale(e){const i=Math.abs(e*.01);return Math.pow(.95,this.zoomSpeed*i)}_rotateLeft(e){this._sphericalDelta.theta-=e}_rotateUp(e){this._sphericalDelta.phi-=e}_panLeft(e,i){Fn.setFromMatrixColumn(i,0),Fn.multiplyScalar(-e),this._panOffset.add(Fn)}_panUp(e,i){this.screenSpacePanning===!0?Fn.setFromMatrixColumn(i,1):(Fn.setFromMatrixColumn(i,0),Fn.crossVectors(this.object.up,Fn)),Fn.multiplyScalar(e),this._panOffset.add(Fn)}_pan(e,i){const s=this.domElement;if(this.object.isPerspectiveCamera){const l=this.object.position;Fn.copy(l).sub(this.target);let f=Fn.length();f*=Math.tan(this.object.fov/2*Math.PI/180),this._panLeft(2*e*f/s.clientHeight,this.object.matrix),this._panUp(2*i*f/s.clientHeight,this.object.matrix)}else this.object.isOrthographicCamera?(this._panLeft(e*(this.object.right-this.object.left)/this.object.zoom/s.clientWidth,this.object.matrix),this._panUp(i*(this.object.top-this.object.bottom)/this.object.zoom/s.clientHeight,this.object.matrix)):(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - pan disabled."),this.enablePan=!1)}_dollyOut(e){this.object.isPerspectiveCamera||this.object.isOrthographicCamera?this._scale/=e:(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),this.enableZoom=!1)}_dollyIn(e){this.object.isPerspectiveCamera||this.object.isOrthographicCamera?this._scale*=e:(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),this.enableZoom=!1)}_updateZoomParameters(e,i){if(!this.zoomToCursor)return;this._performCursorZoom=!0;const s=this.domElement.getBoundingClientRect(),l=e-s.left,f=i-s.top,h=s.width,d=s.height;this._mouse.x=l/h*2-1,this._mouse.y=-(f/d)*2+1,this._dollyDirection.set(this._mouse.x,this._mouse.y,1).unproject(this.object).sub(this.object.position).normalize()}_clampDistance(e){return Math.max(this.minDistance,Math.min(this.maxDistance,e))}_handleMouseDownRotate(e){this._rotateStart.set(e.clientX,e.clientY)}_handleMouseDownDolly(e){this._updateZoomParameters(e.clientX,e.clientX),this._dollyStart.set(e.clientX,e.clientY)}_handleMouseDownPan(e){this._panStart.set(e.clientX,e.clientY)}_handleMouseMoveRotate(e){this._rotateEnd.set(e.clientX,e.clientY),this._rotateDelta.subVectors(this._rotateEnd,this._rotateStart).multiplyScalar(this.rotateSpeed);const i=this.domElement;this._rotateLeft(Mi*this._rotateDelta.x/i.clientHeight),this._rotateUp(Mi*this._rotateDelta.y/i.clientHeight),this._rotateStart.copy(this._rotateEnd),this.update()}_handleMouseMoveDolly(e){this._dollyEnd.set(e.clientX,e.clientY),this._dollyDelta.subVectors(this._dollyEnd,this._dollyStart),this._dollyDelta.y>0?this._dollyOut(this._getZoomScale(this._dollyDelta.y)):this._dollyDelta.y<0&&this._dollyIn(this._getZoomScale(this._dollyDelta.y)),this._dollyStart.copy(this._dollyEnd),this.update()}_handleMouseMovePan(e){this._panEnd.set(e.clientX,e.clientY),this._panDelta.subVectors(this._panEnd,this._panStart).multiplyScalar(this.panSpeed),this._pan(this._panDelta.x,this._panDelta.y),this._panStart.copy(this._panEnd),this.update()}_handleMouseWheel(e){this._updateZoomParameters(e.clientX,e.clientY),e.deltaY<0?this._dollyIn(this._getZoomScale(e.deltaY)):e.deltaY>0&&this._dollyOut(this._getZoomScale(e.deltaY)),this.update()}_handleKeyDown(e){let i=!1;switch(e.code){case this.keys.UP:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateUp(Mi*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(0,this.keyPanSpeed),i=!0;break;case this.keys.BOTTOM:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateUp(-Mi*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(0,-this.keyPanSpeed),i=!0;break;case this.keys.LEFT:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateLeft(Mi*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(this.keyPanSpeed,0),i=!0;break;case this.keys.RIGHT:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateLeft(-Mi*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(-this.keyPanSpeed,0),i=!0;break}i&&(e.preventDefault(),this.update())}_handleTouchStartRotate(e){if(this._pointers.length===1)this._rotateStart.set(e.pageX,e.pageY);else{const i=this._getSecondPointerPosition(e),s=.5*(e.pageX+i.x),l=.5*(e.pageY+i.y);this._rotateStart.set(s,l)}}_handleTouchStartPan(e){if(this._pointers.length===1)this._panStart.set(e.pageX,e.pageY);else{const i=this._getSecondPointerPosition(e),s=.5*(e.pageX+i.x),l=.5*(e.pageY+i.y);this._panStart.set(s,l)}}_handleTouchStartDolly(e){const i=this._getSecondPointerPosition(e),s=e.pageX-i.x,l=e.pageY-i.y,f=Math.sqrt(s*s+l*l);this._dollyStart.set(0,f)}_handleTouchStartDollyPan(e){this.enableZoom&&this._handleTouchStartDolly(e),this.enablePan&&this._handleTouchStartPan(e)}_handleTouchStartDollyRotate(e){this.enableZoom&&this._handleTouchStartDolly(e),this.enableRotate&&this._handleTouchStartRotate(e)}_handleTouchMoveRotate(e){if(this._pointers.length==1)this._rotateEnd.set(e.pageX,e.pageY);else{const s=this._getSecondPointerPosition(e),l=.5*(e.pageX+s.x),f=.5*(e.pageY+s.y);this._rotateEnd.set(l,f)}this._rotateDelta.subVectors(this._rotateEnd,this._rotateStart).multiplyScalar(this.rotateSpeed);const i=this.domElement;this._rotateLeft(Mi*this._rotateDelta.x/i.clientHeight),this._rotateUp(Mi*this._rotateDelta.y/i.clientHeight),this._rotateStart.copy(this._rotateEnd)}_handleTouchMovePan(e){if(this._pointers.length===1)this._panEnd.set(e.pageX,e.pageY);else{const i=this._getSecondPointerPosition(e),s=.5*(e.pageX+i.x),l=.5*(e.pageY+i.y);this._panEnd.set(s,l)}this._panDelta.subVectors(this._panEnd,this._panStart).multiplyScalar(this.panSpeed),this._pan(this._panDelta.x,this._panDelta.y),this._panStart.copy(this._panEnd)}_handleTouchMoveDolly(e){const i=this._getSecondPointerPosition(e),s=e.pageX-i.x,l=e.pageY-i.y,f=Math.sqrt(s*s+l*l);this._dollyEnd.set(0,f),this._dollyDelta.set(0,Math.pow(this._dollyEnd.y/this._dollyStart.y,this.zoomSpeed)),this._dollyOut(this._dollyDelta.y),this._dollyStart.copy(this._dollyEnd);const h=(e.pageX+i.x)*.5,d=(e.pageY+i.y)*.5;this._updateZoomParameters(h,d)}_handleTouchMoveDollyPan(e){this.enableZoom&&this._handleTouchMoveDolly(e),this.enablePan&&this._handleTouchMovePan(e)}_handleTouchMoveDollyRotate(e){this.enableZoom&&this._handleTouchMoveDolly(e),this.enableRotate&&this._handleTouchMoveRotate(e)}_addPointer(e){this._pointers.push(e.pointerId)}_removePointer(e){delete this._pointerPositions[e.pointerId];for(let i=0;i<this._pointers.length;i++)if(this._pointers[i]==e.pointerId){this._pointers.splice(i,1);return}}_isTrackingPointer(e){for(let i=0;i<this._pointers.length;i++)if(this._pointers[i]==e.pointerId)return!0;return!1}_trackPointer(e){let i=this._pointerPositions[e.pointerId];i===void 0&&(i=new _e,this._pointerPositions[e.pointerId]=i),i.set(e.pageX,e.pageY)}_getSecondPointerPosition(e){const i=e.pointerId===this._pointers[0]?this._pointers[1]:this._pointers[0];return this._pointerPositions[i]}_customWheelEvent(e){const i=e.deltaMode,s={clientX:e.clientX,clientY:e.clientY,deltaY:e.deltaY};switch(i){case 1:s.deltaY*=16;break;case 2:s.deltaY*=100;break}return e.ctrlKey&&!this._controlActive&&(s.deltaY*=10),s}}function hw(o){this.enabled!==!1&&(this._pointers.length===0&&(this.domElement.setPointerCapture(o.pointerId),this.domElement.ownerDocument.addEventListener("pointermove",this._onPointerMove),this.domElement.ownerDocument.addEventListener("pointerup",this._onPointerUp)),!this._isTrackingPointer(o)&&(this._addPointer(o),o.pointerType==="touch"?this._onTouchStart(o):this._onMouseDown(o),this._cursorStyle==="grab"&&(this.domElement.style.cursor="grabbing")))}function dw(o){this.enabled!==!1&&(o.pointerType==="touch"?this._onTouchMove(o):this._onMouseMove(o))}function pw(o){switch(this._removePointer(o),this._pointers.length){case 0:this.domElement.releasePointerCapture(o.pointerId),this.domElement.ownerDocument.removeEventListener("pointermove",this._onPointerMove),this.domElement.ownerDocument.removeEventListener("pointerup",this._onPointerUp),this.dispatchEvent(YS),this.state=rn.NONE,this._cursorStyle==="grab"&&(this.domElement.style.cursor="grab");break;case 1:const e=this._pointers[0],i=this._pointerPositions[e];this._onTouchStart({pointerId:e,pageX:i.x,pageY:i.y});break}}function mw(o){let e;switch(o.button){case 0:e=this.mouseButtons.LEFT;break;case 1:e=this.mouseButtons.MIDDLE;break;case 2:e=this.mouseButtons.RIGHT;break;default:e=-1}switch(e){case Fo.DOLLY:if(this.enableZoom===!1)return;this._handleMouseDownDolly(o),this.state=rn.DOLLY;break;case Fo.ROTATE:if(o.ctrlKey||o.metaKey||o.shiftKey){if(this.enablePan===!1)return;this._handleMouseDownPan(o),this.state=rn.PAN}else{if(this.enableRotate===!1)return;this._handleMouseDownRotate(o),this.state=rn.ROTATE}break;case Fo.PAN:if(o.ctrlKey||o.metaKey||o.shiftKey){if(this.enableRotate===!1)return;this._handleMouseDownRotate(o),this.state=rn.ROTATE}else{if(this.enablePan===!1)return;this._handleMouseDownPan(o),this.state=rn.PAN}break;default:this.state=rn.NONE}this.state!==rn.NONE&&this.dispatchEvent(Im)}function gw(o){switch(this.state){case rn.ROTATE:if(this.enableRotate===!1)return;this._handleMouseMoveRotate(o);break;case rn.DOLLY:if(this.enableZoom===!1)return;this._handleMouseMoveDolly(o);break;case rn.PAN:if(this.enablePan===!1)return;this._handleMouseMovePan(o);break}}function _w(o){this.enabled===!1||this.enableZoom===!1||this.state!==rn.NONE||(o.preventDefault(),this.dispatchEvent(Im),this._handleMouseWheel(this._customWheelEvent(o)),this.dispatchEvent(YS))}function vw(o){this.enabled!==!1&&this._handleKeyDown(o)}function xw(o){switch(this._trackPointer(o),this._pointers.length){case 1:switch(this.touches.ONE){case zo.ROTATE:if(this.enableRotate===!1)return;this._handleTouchStartRotate(o),this.state=rn.TOUCH_ROTATE;break;case zo.PAN:if(this.enablePan===!1)return;this._handleTouchStartPan(o),this.state=rn.TOUCH_PAN;break;default:this.state=rn.NONE}break;case 2:switch(this.touches.TWO){case zo.DOLLY_PAN:if(this.enableZoom===!1&&this.enablePan===!1)return;this._handleTouchStartDollyPan(o),this.state=rn.TOUCH_DOLLY_PAN;break;case zo.DOLLY_ROTATE:if(this.enableZoom===!1&&this.enableRotate===!1)return;this._handleTouchStartDollyRotate(o),this.state=rn.TOUCH_DOLLY_ROTATE;break;default:this.state=rn.NONE}break;default:this.state=rn.NONE}this.state!==rn.NONE&&this.dispatchEvent(Im)}function Sw(o){switch(this._trackPointer(o),this.state){case rn.TOUCH_ROTATE:if(this.enableRotate===!1)return;this._handleTouchMoveRotate(o),this.update();break;case rn.TOUCH_PAN:if(this.enablePan===!1)return;this._handleTouchMovePan(o),this.update();break;case rn.TOUCH_DOLLY_PAN:if(this.enableZoom===!1&&this.enablePan===!1)return;this._handleTouchMoveDollyPan(o),this.update();break;case rn.TOUCH_DOLLY_ROTATE:if(this.enableZoom===!1&&this.enableRotate===!1)return;this._handleTouchMoveDollyRotate(o),this.update();break;default:this.state=rn.NONE}}function yw(o){this.enabled!==!1&&o.preventDefault()}function Mw(o){o.key==="Control"&&(this._controlActive=!0,this.domElement.getRootNode().addEventListener("keyup",this._interceptControlUp,{passive:!0,capture:!0}))}function Ew(o){o.key==="Control"&&(this._controlActive=!1,this.domElement.getRootNode().removeEventListener("keyup",this._interceptControlUp,{passive:!0,capture:!0}))}const qS="/assets/trak-tc820-machine-transparent-D7PwEI2F.png",bw=[{id:"monitor",label:"监控中心",icon:"⌁",badge:"实时"},{id:"diagnosis",label:"智能诊断",icon:"◇"},{id:"maintenance",label:"维修决策",icon:"▣"},{id:"workorder",label:"工单系统",icon:"□"},{id:"quality",label:"质检系统",icon:"✓"},{id:"report",label:"报告中心",icon:"≡"},{id:"rag",label:"RAG知识问答",icon:"?"},{id:"trace",label:"运行追踪",icon:"⋮"}],zm=[{id:"TRAK-TC820LTYSI-001",name:"TRAK-TC820LTYSI-001",line:"A线 · 主加工单元",type:"数控车削中心",x:50,y:39,live:!0,image:qS}],Tw={"TRAK-TC820LTYSI-001":{name:"TRAK TC820LTYsi 车削中心",line:"A线 · 主加工单元",type:"数控车削中心",x:42,y:58,image:qS},"LNS-QL-SERVO-80-S2-001":{name:"LNS QL Servo 80 S2 棒料送料机",line:"A线 · 上料单元",type:"棒料送料机",x:23,y:46},"ELITE-CS612-ROBOT-001":{name:"ELITE ROBOTS CS612 六轴协作机器人",line:"A线 · 下料协作单元",type:"六轴协作机器人",x:68,y:42}},Aw={turning_center:"数控车削中心",bar_feeder:"棒料送料机",industrial_robot:"工业机器人"},sS=[{x:42,y:58},{x:23,y:46},{x:68,y:42},{x:78,y:62}],jS={critical:"关键规则",threshold:"阈值规则",duration:"持续规则",count:"计数规则",trend:"趋势规则",multi_metric:"多指标规则"},ZS={normal:"正常",warning:"预警",alarm:"报警",fault:"故障",running:"运行中",stopped:"已停止",offline:"离线"},Rw={normal:"正常",initial:"初级预警",intermediate:"中级报警",high:"高级故障"},rS={metric:"指标异常",temperature:"温度异常",vibration:"振动异常",alarm:"设备报警",status:"设备状态",trend:"趋势异常",multi_metric:"多指标联合异常"},gm={idle:"等待异常",running:"分析中",completed:"已完成",fallback:"备用诊断",failed:"执行失败"},ww={get_alarm_definition:"报警定义库"},_m={open:"待处理",in_progress:"处理中",completed:"已完成",closed:"已关闭"},oS=["主轴温度过高怎么检查？","报警 ALM-1001 的处理步骤是什么？","振动异常时应该优先排查哪些部件？"],Cw=["执行设备断电和挂牌上锁","检查冷却液液位、流量和冷却泵","空载运行并复测主轴温度"],Nw={closed:"已关闭",open:"已打开",locked:"已锁定",unlocked:"未锁定",released:"已释放",pressed:"已按下",running:"运行中",stopped:"已停止",ready:"已就绪",clamped:"已夹紧",referenced:"已回零",inhibited:"已禁止",overtemperature:"温度过高",pressure_low:"压力不足",rotation_timeout:"旋转超时",clamp_pressure_low:"夹紧压力不足",not_in_position:"未到位",movement_error:"动作异常",alarm:"报警",overload:"过载",high_pressure_low:"高压不足",vibration_high:"振动过高"};async function ki(o,e={}){const i=await fetch(o,{cache:"no-store",headers:{"Content-Type":"application/json"},...e}),s=await i.json();if(!i.ok)throw new Error(s.error||`请求失败：${i.status}`);return s}function rc(o){if(!o)return"--";const e=new Date(o);return Number.isNaN(e.getTime())?o:e.toLocaleTimeString("zh-CN",{hour12:!1})}function ra(o,e){return o[e]||e||"--"}function Dw(o){return o==="fault"?"fault":o==="alarm"?"alarm":o==="warning"?"warning":"normal"}function KS(o){return o==="high"?"fault":o==="intermediate"?"alarm":o==="initial"?"warning":"normal"}function Uw(o){return(o?.devices?.length?o.devices:zm).map((i,s)=>{const l=i.device_id||i.id,f=Tw[l]||{},h=sS[s%sS.length],d=i.latest_result||o?.latest_results?.[l]||(l===o?.device_id?o?.latest_result:null),m=d?.current_sample||i.current_sample||null;return{id:l,name:i.name||f.name||l,line:f.line||i.line||"产线设备",type:f.type||Aw[i.device_type||i.type]||i.device_type||i.type||"工业设备",x:f.x??i.x??h.x,y:f.y??i.y??h.y,live:i.live!==!1,image:f.image||i.image,result:d,sample:m}})}function Lw(o){return o.kind==="multi_metric"?rS.multi_metric:o.label||rS[o.kind]||o.kind||"监测项"}function Ow(){const[o,e]=Pe.useState(null),[i,s]=Pe.useState("");async function l(){try{e(await ki("/api/monitor/snapshot")),s("")}catch(d){s(d.message)}}Pe.useEffect(()=>{l();const d=window.setInterval(l,1e3);return()=>window.clearInterval(d)},[]);async function f(d){try{e(await ki("/api/monitor/control",{method:"POST",body:JSON.stringify({action:d})})),s("")}catch(m){s(m.message)}}async function h(){try{e(await ki("/api/monitor/reset",{method:"POST",body:"{}"})),s("")}catch(d){s(d.message)}}return{snapshot:o,error:i,control:f,resetStats:h}}function Pw(){const[o,e]=Pe.useState("monitor"),[i,s]=Pe.useState(zm[0].id),{snapshot:l,error:f,control:h,resetStats:d}=Ow(),m=l?.runner||{},p=Pe.useMemo(()=>Uw(l),[l]),v=(p.find(C=>C.id===i)||p[0])?.result||l?.latest_result,g=v?.current_sample,M=g?.health_score===null||g?.health_score===void 0?"--":`${Number(g.health_score).toFixed(0)} / 100`,A=f||m.last_error?"接口异常":"连接正常";return Pe.useEffect(()=>{p.length&&!p.some(C=>C.id===i)&&s(p[0].id)},[p,i]),b.jsxs("div",{className:"platform-shell",children:[b.jsx(Iw,{activeView:o,onChange:e,connectionText:A,hasError:!!(f||m.last_error)}),b.jsxs("main",{className:"app-shell",children:[b.jsx(zw,{snapshot:l,runner:m,onControl:h,onReset:d}),o==="monitor"&&b.jsx(Bw,{snapshot:l,machines:p,result:v,sample:g,runner:m,healthText:M,selectedMachineId:i,onSelectMachine:s}),o==="diagnosis"&&b.jsx(Jw,{snapshot:l}),o==="maintenance"&&b.jsx($w,{snapshot:l}),o==="workorder"&&b.jsx(n3,{snapshot:l,sample:g}),o==="rag"&&b.jsx(a3,{snapshot:l,sample:g}),o==="quality"&&b.jsx(s3,{snapshot:l,sample:g}),o==="report"&&b.jsx(t3,{snapshot:l}),o==="trace"&&b.jsx(e3,{snapshot:l}),(f||m.last_error)&&b.jsx("footer",{className:"error-bar",children:f||m.last_error})]})]})}function Iw({activeView:o,onChange:e,connectionText:i,hasError:s}){return b.jsxs("aside",{className:"sidebar","aria-label":"平台导航",children:[b.jsxs("div",{className:"brand-block",children:[b.jsx("span",{className:"brand-mark",children:"IA"}),b.jsxs("div",{children:[b.jsx("strong",{children:"IND-Agent"}),b.jsx("span",{children:"工业智能平台"})]})]}),b.jsx("nav",{className:"side-nav",children:bw.map(l=>b.jsxs("button",{className:`nav-item ${o===l.id?"active":""}`,type:"button",onClick:()=>e(l.id),children:[b.jsx("span",{className:"nav-icon",children:l.icon}),b.jsx("span",{children:l.label}),l.badge&&b.jsx("em",{children:l.badge})]},l.id))}),b.jsxs("div",{className:"sidebar-card",children:[b.jsx("span",{children:"平台状态"}),b.jsx("strong",{className:s?"bad":"",children:i}),b.jsx("p",{children:"监控服务、诊断智能体和知识工具将统一汇入平台工作台。"})]})]})}function zw({snapshot:o,runner:e,onControl:i,onReset:s}){const l=o?.device_ids?.length||o?.devices?.length||(o?.device_id?1:0),f=`数据源：${o?.data_source||"设备数据源"} · 接入 ${l||"--"} 台设备 · 在线监测`;return b.jsxs("header",{className:"topbar",children:[b.jsxs("div",{children:[b.jsx("span",{className:"eyebrow",children:"工业运营中台"}),b.jsx("h1",{children:"智能制造统一工作台"}),b.jsx("p",{className:"subline",children:f})]}),b.jsxs("div",{className:"toolbar",children:[b.jsxs("label",{className:"switch-control",title:"开启或暂停自动监测",children:[b.jsx("input",{type:"checkbox",checked:!!e.enabled,onChange:h=>i(h.target.checked?"on":"off")}),b.jsx("span",{className:"switch-track",children:b.jsx("span",{className:"switch-thumb"})}),b.jsx("span",{children:e.enabled?"监测开启":"监测暂停"})]}),b.jsx("button",{className:"button",type:"button",onClick:s,children:"归零统计"})]})]})}function Bw({snapshot:o,machines:e,result:i,sample:s,runner:l,healthText:f,selectedMachineId:h,onSelectMachine:d}){const m=e.find(x=>x.id===h)||e[0]||zm[0],p=!!m.live;return b.jsxs("section",{className:"workspace-view active",children:[b.jsx(Fw,{machines:e,selectedMachineId:m.id,result:i,sample:s,healthText:f,onSelectMachine:d}),b.jsx(Gw,{machine:m,isLiveMachine:p,sample:s,result:i,healthText:f}),p?b.jsxs(b.Fragment,{children:[b.jsx(Vw,{snapshot:o,sample:s,runner:l,healthText:f}),b.jsxs("section",{className:"main-grid",children:[b.jsx(kw,{result:i,sample:s}),b.jsx(qw,{snapshot:o,result:i})]}),b.jsxs("section",{className:"lower-grid",children:[b.jsx(Zw,{snapshot:o}),b.jsx(Kw,{snapshot:o})]})]}):b.jsxs("section",{className:"panel machine-empty-panel",children:[b.jsx("span",{className:"eyebrow",children:"设备详情"}),b.jsx("h2",{children:"该设备暂未接入实时采集"}),b.jsx("p",{children:"后续接入多设备监控接口后，这里会展示该机器的实时指标、规则判定和诊断结果。"})]})]})}function Fw({machines:o,selectedMachineId:e,result:i,sample:s,healthText:l,onSelectMachine:f}){const h=o.find(x=>x.id===e)||o[0],d=nc(h,h?.result||i),m=o.filter(x=>x.live).length,p=o.filter(x=>{const v=nc(x,x.result);return v!=="normal"&&v!=="idle"}).length;return b.jsxs("section",{className:"panel workshop-panel",children:[b.jsxs("div",{className:"factory-map","aria-label":"车间设备分布图",children:[b.jsx(Hw,{machines:o,selectedMachineId:e,status:d,onSelect:x=>f(x||h?.id)}),b.jsxs("div",{className:"scene-overlay",children:[b.jsxs("div",{children:[b.jsx("span",{className:"eyebrow",children:"车间总览"}),b.jsx("h2",{children:"车间设备状态总览"})]}),b.jsxs("div",{className:"map-legend","aria-label":"状态图例",children:[b.jsxs("span",{children:[b.jsx("i",{className:"legend-dot normal"}),"正常"]}),b.jsxs("span",{children:[b.jsx("i",{className:"legend-dot warning"}),"预警"]}),b.jsxs("span",{children:[b.jsx("i",{className:"legend-dot fault"}),"故障"]})]})]}),b.jsx("div",{className:"scene-control-hint",children:"内部加工动画 · 拖动旋转 · 滚轮缩放"})]}),b.jsxs("div",{className:"map-summary",children:[b.jsxs("div",{children:[b.jsx("span",{children:"接入设备"}),b.jsxs("strong",{children:[m," / ",o.length]})]}),b.jsxs("div",{children:[b.jsx("span",{children:"选中设备"}),b.jsx("strong",{children:h?.name||"--"})]}),b.jsxs("div",{children:[b.jsx("span",{children:"当前故障"}),b.jsx("strong",{children:p})]}),b.jsxs("div",{children:[b.jsx("span",{children:"毛坯入料"}),b.jsx("strong",{children:"棒料"})]}),b.jsxs("div",{children:[b.jsx("span",{children:"成品出料"}),b.jsx("strong",{children:"轴套件"})]})]})]})}function nc(o,e){return o?.live?e?.status==="fault"?"fault":e?.status==="alarm"?"alarm":e?.status==="warning"?"warning":"normal":"idle"}function QS(o){return o==="fault"?"故障":o==="alarm"?"报警":o==="warning"?"预警":o==="idle"?"未接入":"正常"}function Hw({machines:o=[],selectedMachineId:e,status:i,onSelect:s}){const l=Pe.useRef(null),f=Pe.useRef(s),h=Pe.useRef(o),d=Pe.useRef(null),m=Pe.useRef(null),[p,x]=Pe.useState(null),v=Pe.useMemo(()=>o.map(g=>`${g.id}:${g.live?1:0}`).join("|"),[o]);return Pe.useEffect(()=>{f.current=s},[s]),Pe.useEffect(()=>{h.current=o},[o]),Pe.useEffect(()=>{const g=l.current;if(!g)return;const M=new Bb;M.fog=new Nm(15988468,14,32);const A=new Hi(36,g.clientWidth/g.clientHeight,.1,100);A.position.set(7.8,4.6,8.8),A.lookAt(0,.75,0);const C=new cw({antialias:!0,alpha:!0,preserveDrawingBuffer:!0});C.setPixelRatio(Math.min(window.devicePixelRatio,2)),C.setSize(g.clientWidth,g.clientHeight),C.shadowMap.enabled=!0,C.shadowMap.type=ql,g.appendChild(C.domElement);const y=new fw(A,C.domElement);y.target.set(0,.75,0),y.enableDamping=!0,y.dampingFactor=.08,y.minDistance=6.2,y.maxDistance=15.5,y.minPolarAngle=Math.PI*.16,y.maxPolarAngle=Math.PI*.49,y.enablePan=!0,y.panSpeed=.55,y.rotateSpeed=.55,y.zoomSpeed=.72,y.update();const S=new Map(h.current.map(mt=>[mt.id,mt])),U=mt=>h.current.find(Ct=>Ct.id===mt),F=mt=>{const Ct=U(mt);return nc(Ct,Ct?.result)},N=mt=>nc(S.get(mt),S.get(mt)?.result),L=mt=>lS(N(mt)),D=mt=>mt===e,I=mt=>mt==="fault"||mt==="alarm"||mt==="warning",T=mt=>{const Ct=U(mt);if(!Ct)return null;const Lt=F(mt);return{id:mt,name:Ct.name||mt,type:Ct.type||"设备",status:Lt,statusLabel:QS(Lt)}},O=lS(i),V=new $e({color:15002858,roughness:.84,metalness:.02}),Y=new $e({color:12899280,roughness:.78,metalness:.01}),J=new $e({color:14741998,roughness:.82,metalness:.02,transparent:!0,opacity:.58}),rt=new $e({color:14148063,roughness:.86,metalness:.02,transparent:!0,opacity:.72}),j=new $e({color:14262811,roughness:.58,metalness:.04}),et=new $e({color:4214871,roughness:.6,metalness:.18}),q=new $e({color:O,roughness:.42,metalness:.1,emissive:O,emissiveIntensity:.12,transparent:!0,opacity:.82}),Z=new $e({color:6582647,roughness:.72,metalness:.08}),ht=new $e({color:2831160,roughness:.75,metalness:.05}),ct=new $e({color:6910328,roughness:.62,metalness:.18,transparent:!0,opacity:.64}),gt=new $e({color:6910328,roughness:.62,metalness:.18}),vt=new $e({color:2238253,roughness:.7,metalness:.2,transparent:!0,opacity:.86}),ie=new $e({color:12172994,roughness:.55,metalness:.12,transparent:!0,opacity:.68}),ne=new $e({color:9417916,roughness:.2,metalness:.04,transparent:!0,opacity:.24,side:Gi}),B=new $e({color:O,roughness:.42,metalness:.12,emissive:O,emissiveIntensity:.08}),xt=new $e({color:9805989,roughness:.52,metalness:.28}),Nt=new $e({color:4805722,roughness:.36,metalness:.45}),Q=new $e({color:12026410,roughness:.42,metalness:.22,emissive:3810048,emissiveIntensity:.05}),dt=new $e({color:13357783,roughness:.32,metalness:.72}),Dt=new $e({color:4345945,roughness:.28,metalness:.78}),Wt=new $e({color:13673276,roughness:.5,metalness:.38,emissive:5912576,emissiveIntensity:.06}),Mt=new Um({color:2503224,transparent:!0,opacity:.42}),It=new Kl({color:16777215,transparent:!0,opacity:.001,depthWrite:!1}),Ze=new cT,Ee=new _e,Te=[],Ce=[],ce=(mt,Ct,Lt)=>(mt.userData.machineId=Ct,mt.traverse(yt=>{yt.userData.machineId=Ct}),Lt&&Te.push(Lt),mt),fe=new Me(new sc(26,16),V);fe.rotation.x=-Math.PI/2,fe.position.y=-.36,fe.receiveShadow=!0,M.add(fe);const Ke=new uT(26,26,10401974,13359575);Ke.position.y=-.34,M.add(Ke);const ve=(mt,Ct,Lt,yt=[0,0,0])=>{const Rt=new Me(new On(...mt),Lt);return Rt.position.set(...Ct),Rt.rotation.set(...yt),Rt.castShadow=!0,Rt.receiveShadow=!0,M.add(Rt),Rt};ve([26,2.6,.08],[0,.92,-7.2],rt),ve([.08,2.25,12.5],[-12.3,.78,-.6],rt),ve([.08,2.25,12.5],[12.3,.78,-.6],rt),ve([24,.08,.12],[0,2.32,-6.95],ht),ve([.12,.08,12],[-11.5,2.16,-.8],ht),ve([.12,.08,12],[11.5,2.16,-.8],ht),ve([20,.035,1.45],[0,-.31,3.25],Y),ve([1.5,.035,10.5],[-5.2,-.3,-.9],Y),ve([6.6,.045,3.8],[0,-.28,.05],J),ve([6.8,.03,.08],[0,-.235,2],j),ve([6.8,.03,.08],[0,-.235,-1.95],j),ve([.08,.03,3.95],[-3.4,-.235,.02],j),ve([.08,.03,3.95],[3.4,-.235,.02],j);const We=(mt,Ct,Lt=[0,0,0],yt=new X(0,0,1))=>{ve(mt,Ct,et,Lt),ve([mt[0],.035,.08],[Ct[0]-yt.x*mt[2]/2,Ct[1]+.06,Ct[2]-yt.z*mt[2]/2],q,Lt),ve([mt[0],.035,.08],[Ct[0]+yt.x*mt[2]/2,Ct[1]+.06,Ct[2]+yt.z*mt[2]/2],q,Lt)},on=[],W=[],un=new X(0,1,0),Ue=(mt,Ct,Lt=.52,yt=6)=>{const Rt=new X(mt[0],-.08,mt[1]),Pt=new X(Ct[0],-.08,Ct[1]),kt=new X().subVectors(Pt,Rt),re=kt.length(),de=new X().addVectors(Rt,Pt).multiplyScalar(.5),Vn=Math.atan2(kt.x,kt.z),wi=[0,Vn-Math.PI/2,0],Ea=kt.clone().normalize(),oa=new X(-Ea.z,0,Ea.x);We([re,.13,Lt],[de.x,de.y,de.z],wi,oa);const xn=Math.max(3,Math.round(re/.45));for(let Ge=0;Ge<=xn;Ge+=1){const Sn=Ge/xn,Ci=Rt.clone().lerp(Pt,Sn),yn=new Me(new An(.045,.045,Lt+.1,16),Nt);yn.position.set(Ci.x,.03,Ci.z),yn.quaternion.setFromUnitVectors(un,oa),M.add(yn),on.push(yn)}for(let Ge=0;Ge<yt;Ge+=1){const Sn=new Me(new On(.08,.035,Lt+.06),Nt);Sn.userData.offset=Ge/yt,Sn.quaternion.setFromAxisAngle(un,Vn-Math.PI/2),Sn.castShadow=!0,M.add(Sn),W.push({mesh:Sn,start:Rt,end:Pt})}};Ue([-5.45,-.25],[-5.45,1.05],.46,4),Ue([-5.45,1.05],[-2.35,1.05],.52,7),Ue([-2.35,1.05],[2.2,1.05],.46,8),Ue([2.2,1.05],[4.95,1.05],.52,7),Ue([4.95,1.05],[4.95,.45],.46,4),ve([1.45,.42,.75],[-6.15,-.08,-4.95],Z),ve([1.55,.13,.85],[-6.15,.22,-4.95],ht),ve([1.35,.38,.72],[6.05,-.08,-4.8],Z),ve([1.45,.12,.82],[6.05,.18,-4.8],ht);for(let mt=0;mt<10;mt+=1){const Ct=mt%2===0?-10.8:10.8,Lt=-5.7+Math.floor(mt/2)*2.8,yt=new Me(new An(.06,.06,2.6,12),Z);yt.position.set(Ct,.92,Lt),yt.castShadow=!0,M.add(yt)}const P=(mt,Ct,Lt=1.45)=>{const yt=L(mt),Rt=new Me(new ff(Lt,Lt+.07,64),new Kl({color:yt,transparent:!0,opacity:D(mt)?.72:.24,side:Gi,depthWrite:!1}));return Rt.rotation.x=-Math.PI/2,Rt.position.set(Ct[0],-.245,Ct[2]),M.add(Rt),Rt},E=(mt,Ct,Lt=1.45)=>{const yt=new Me(new ff(Lt+.1,Lt+.24,72),new Kl({color:14229279,transparent:!0,opacity:0,side:Gi,depthWrite:!1}));yt.rotation.x=-Math.PI/2,yt.position.set(Ct[0],-.22,Ct[2]),yt.visible=!1,M.add(yt);const Rt=new wx(16723245,0,4.2);return Rt.position.set(Ct[0],1.35,Ct[2]),M.add(Rt),Ce.push({id:mt,ring:yt,glow:Rt}),{ring:yt,glow:Rt}},nt=()=>{const mt="LNS-QL-SERVO-80-S2-001",Ct=L(mt),Lt=new $e({color:Ct,roughness:.4,metalness:.12,emissive:Ct,emissiveIntensity:D(mt)?.16:.05}),yt=new $e({color:15133164,roughness:.56,metalness:.08}),Rt=new $e({color:13620696,roughness:.5,metalness:.12}),Pt=new $e({color:10402240,roughness:.2,metalness:.04,transparent:!0,opacity:.42,side:Gi}),kt=new Fi,re=[];kt.position.set(-5.45,-.28,-.8),kt.rotation.y=.1,kt.scale.set(.86,.86,.86),M.add(kt),P(mt,[kt.position.x,kt.position.y,kt.position.z],1.5),E(mt,[kt.position.x,kt.position.y,kt.position.z],1.5);const de=(xn,Ge,Sn,Ci=[0,0,0])=>{const yn=new Me(new On(...xn),Sn);return yn.position.set(...Ge),yn.rotation.set(...Ci),yn.castShadow=!0,yn.receiveShadow=!0,kt.add(yn),yn},Vn=(xn,Ge,Sn,Ci,yn=[0,0,0],wn=24)=>{const jn=new Me(new An(xn,xn,Ge,wn),Ci);return jn.position.set(...Sn),jn.rotation.set(...yn),jn.castShadow=!0,jn.receiveShadow=!0,kt.add(jn),jn},wi=(xn,Ge,Sn,Ci)=>{const yn=new X(...xn),wn=new X(...Ge),jn=new X().subVectors(wn,yn),qa=jn.length(),zn=new Me(new An(Sn,Sn,qa,16),Ci);return zn.position.copy(yn.add(wn).multiplyScalar(.5)),zn.quaternion.setFromUnitVectors(new X(0,1,0),jn.normalize()),zn.castShadow=!0,zn.receiveShadow=!0,kt.add(zn),zn};de([4.3,.08,1.08],[0,.06,0],Nt),de([4.05,.08,.1],[0,.18,-.48],vt),de([4.05,.08,.1],[0,.18,.48],vt),de([.18,.16,.24],[-1.92,.13,-.48],vt),de([.18,.16,.24],[-1.92,.13,.48],vt),de([.18,.16,.24],[1.92,.13,-.48],vt),de([.18,.16,.24],[1.92,.13,.48],vt),de([1.05,.78,.82],[-.35,.55,.03],Rt),de([.86,.52,.06],[-.35,.58,.46],yt),de([.5,.08,.08],[-.35,.9,.5],Lt),de([.42,.18,.04],[-.35,.46,.5],vt),wi([-1.45,.16,-.42],[-.82,.88,-.2],.035,Nt),wi([1.45,.16,-.42],[.82,.88,-.2],.035,Nt),wi([-1.45,.16,.42],[-.82,.88,.2],.035,Nt),wi([1.45,.16,.42],[.82,.88,.2],.035,Nt),de([4.1,.24,.72],[0,1.02,0],yt),de([4.28,.14,.84],[0,1.2,0],Rt),de([.34,.74,.84],[-2,.9,0],Rt),de([.34,.66,.84],[2,.86,0],Rt),de([3.75,.08,.64],[0,1.37,-.18],yt,[-.18,0,0]),de([1.05,.055,.34],[-.82,1.45,-.36],Pt,[-.18,0,0]),de([1.05,.055,.34],[.82,1.45,-.36],Pt,[-.18,0,0]),de([4.08,.08,.12],[0,1.31,.46],vt),de([3.85,.09,.24],[.18,.88,.43],et),Vn(.09,4.25,[.18,.94,.55],et,[0,0,Math.PI/2],32),Vn(.045,4,[.08,1.03,.43],Q,[0,0,Math.PI/2],24);const Ea=de([.18,.16,.28],[-1.72,1.03,.55],Lt);de([1.05,.09,.18],[1.28,1.02,.58],Lt),de([.42,.18,.24],[2.1,.96,.55],vt),de([3.35,.055,.06],[0,.78,-.35],Nt),de([3.35,.055,.06],[0,.78,.35],Nt);for(let xn=0;xn<8;xn+=1){const Ge=new Me(new An(.055,.055,.78,18),Nt);Ge.position.set(-1.45+xn*.42,.82,0),Ge.rotation.x=Math.PI/2,Ge.castShadow=!0,kt.add(Ge),re.push(Ge)}for(let xn=0;xn<4;xn+=1){const Ge=xn<2?-1.82:1.82,Sn=xn%2===0?-.55:.55;Vn(.09,.08,[Ge,.04,Sn],vt,[Math.PI/2,0,0],20)}const oa=new Me(new On(4.7,1.6,1.3),It);return oa.position.set(0,.78,.02),kt.add(oa),ce(kt,mt,oa),{feederGroup:kt,feederRollers:re,pusher:Ea}},ot=()=>{const mt="ELITE-CS612-ROBOT-001",Ct=L(mt);new $e({color:Ct,roughness:.38,metalness:.16,emissive:Ct,emissiveIntensity:D(mt)?.18:.06});const Lt=new $e({color:15856629,roughness:.34,metalness:.08}),yt=new $e({color:13620440,roughness:.24,metalness:.62}),Rt=new $e({color:1518440,roughness:.28,metalness:.2}),Pt=new $e({color:2764597,roughness:.42,metalness:.4}),kt=new Fi;kt.position.set(5.05,-.22,.2),kt.rotation.y=-1.05,kt.scale.set(.95,.95,.95),M.add(kt),P(mt,[kt.position.x,kt.position.y,kt.position.z],1.28),E(mt,[kt.position.x,kt.position.y,kt.position.z],1.28);const re=(ja,ys,sr,xf,Br=[0,0,0],qi=40)=>{const ba=new Me(new An(ja,ja,ys,qi),xf);return ba.position.set(...sr),ba.rotation.set(...Br),ba.castShadow=!0,ba.receiveShadow=!0,kt.add(ba),ba},de=re(.58,.1,[0,.12,0],Pt,[0,0,Math.PI/2],54);de.scale.z=.55,re(.34,.26,[0,.28,0],Lt,[0,0,Math.PI/2],48),re(.28,.05,[0,.44,0],Rt,[0,0,Math.PI/2],48);const Vn=re(.3,.42,[0,.62,0],Lt,[Math.PI/2,0,0],48);re(.31,.045,[0,.62,.24],Rt,[Math.PI/2,0,0],48);const wi=re(.14,1.18,[.28,1.1,0],yt,[0,0,-.42],48),Ea=re(.145,.06,[.03,.69,0],Rt,[0,0,-.42],48),oa=re(.145,.06,[.55,1.5,0],Rt,[0,0,-.42],48),xn=re(.28,.42,[.63,1.58,0],Lt,[Math.PI/2,0,0],48);re(.29,.045,[.63,1.58,.24],Rt,[Math.PI/2,0,0],48);const Ge=re(.12,1.22,[1.05,1.43,0],yt,[0,0,1.22],48),Sn=re(.125,.055,[.77,1.55,0],Rt,[0,0,1.22],48),Ci=re(.125,.055,[1.34,1.3,0],Rt,[0,0,1.22],48),yn=re(.22,.36,[1.48,1.22,0],Lt,[Math.PI/2,0,0],48);re(.19,.06,[1.7,1.18,0],Rt,[Math.PI/2,0,0],48),re(.17,.24,[1.82,1.14,0],Lt,[Math.PI/2,0,Math.PI/2],48),re(.16,.045,[1.96,1.1,0],Rt,[Math.PI/2,0,Math.PI/2],48);const wn=new Fi;wn.position.set(1.78,1.03,0),kt.add(wn);const jn=new Me(new An(.15,.15,.07,40),Lt);jn.rotation.z=Math.PI/2,jn.position.set(.08,0,0),jn.castShadow=!0,wn.add(jn);for(let ja=0;ja<6;ja+=1){const ys=ja*Math.PI/3,sr=new Me(new An(.012,.012,.018,12),Pt);sr.rotation.z=Math.PI/2,sr.position.set(.125,Math.cos(ys)*.095,Math.sin(ys)*.095),wn.add(sr)}const qa=new Me(new On(.36,.065,.1),Dt);qa.position.set(.27,-.02,0),qa.castShadow=!0,wn.add(qa);const zn=new Me(new On(.055,.1,.32),Dt);zn.position.set(.44,-.08,.15),zn.castShadow=!0,wn.add(zn);const Yo=zn.clone();Yo.position.z=-.15,wn.add(Yo);const zr=new Me(new On(2.25,1.95,1.65),It);return zr.position.set(.72,1,0),kt.add(zr),ce(kt,mt,zr),{robotGroup:kt,jointA:Vn,jointB:xn,upperArm:wi,upperBandA:Ea,upperBandB:oa,foreArm:Ge,foreBandA:Sn,foreBandB:Ci,wrist:yn,toolCarrier:wn,gripper:qa,fingerA:zn,fingerB:Yo}},_t=nt(),At=ot(),Ut=new Fi;Ut.position.set(.05,-.1,-.08),Ut.rotation.y=-.28,Ut.scale.set(.82,.82,.82),M.add(Ut);const pt=(mt,Ct,Lt,yt,Rt=[0,0,0])=>{const Pt=new Me(new On(...Ct),yt);Pt.name=mt,Pt.position.set(...Lt),Pt.rotation.set(...Rt),Pt.castShadow=!0,Pt.receiveShadow=!0,Ut.add(Pt);const kt=new US(new Kb(Pt.geometry),Mt);return kt.position.copy(Pt.position),kt.rotation.copy(Pt.rotation),kt.scale.copy(Pt.scale),Ut.add(kt),Pt};pt("machine-base",[4.65,.52,1.68],[0,.28,0],vt),pt("left-headstock-cabinet",[1.08,1.88,1.66],[-1.78,1.4,0],vt),pt("transparent-main-shell",[3.35,1.78,1.58],[-.15,1.4,0],ct),pt("rear-column",[.45,1.95,1.58],[-2.2,1.44,0],gt),pt("front-glass-door",[1.78,1.22,.06],[-.72,1.42,.84],ne),pt("right-slanted-cover",[.86,1.56,1.5],[1.32,1.38,.04],ct,[0,0,-.18]),pt("control-panel",[.45,1.22,.18],[1.98,1.5,.78],vt,[0,0,-.24]),pt("top-service-rail",[3.12,.16,1.34],[-.24,2.28,0],vt),pt("status-strip",[1.82,.06,.08],[-.42,2.39,.7],B),pt("chip-conveyor-neck",[1.12,.28,.34],[2.38,1,.22],vt,[0,0,.4]),pt("chip-bin",[.7,.58,.7],[3,.76,.22],ct),pt("front-service-panel",[2.68,.5,.08],[-.36,.58,.86],ie),pt("left-foot",[.25,.5,.22],[-1.85,-.02,.56],vt),pt("right-foot",[.25,.5,.22],[1.55,-.02,.56],vt),pt("inner-bed",[2.45,.18,.46],[-.35,1.02,.4],xt),pt("linear-guide-left",[2.35,.055,.055],[-.32,1.16,.22],Nt),pt("linear-guide-right",[2.35,.055,.055],[-.32,1.16,.58],Nt),pt("tailstock-shadow",[.42,.44,.5],[.9,1.26,.38],xt);const St=new Fi;St.name="spindleChuck",St.position.set(-1.12,1.36,.78),Ut.add(St);const Ft=new Me(new An(.29,.29,.22,48),Nt);Ft.rotation.z=Math.PI/2,Ft.castShadow=!0,St.add(Ft);const ae=new Me(new An(.22,.22,.04,48),B);ae.position.x=.13,ae.rotation.z=Math.PI/2,St.add(ae);for(let mt=0;mt<3;mt+=1){const Ct=mt*(Math.PI*2/3),Lt=new Me(new On(.16,.06,.24),Dt);Lt.position.set(.17,Math.cos(Ct)*.16,Math.sin(Ct)*.16),Lt.rotation.x=Ct,Lt.castShadow=!0,St.add(Lt)}const Ht=new Me(new An(.13,.13,.88,48),dt);Ht.name="machiningWorkpiece",Ht.position.x=.48,Ht.rotation.z=Math.PI/2,Ht.castShadow=!0,St.add(Ht);const zt=new Fi;zt.name="toolSlide",zt.position.set(.32,1.27,.55),Ut.add(zt);const Kt=new Me(new On(.56,.34,.42),xt);Kt.castShadow=!0,zt.add(Kt);const le=new Me(new An(.22,.22,.25,8),Nt);le.rotation.x=Math.PI/2,le.position.set(-.05,.08,.24),le.castShadow=!0,zt.add(le);const he=new Me(new Lm(.06,.34,4),Dt);he.name="cutterTip",he.position.set(-.33,.08,.24),he.rotation.z=Math.PI/2,he.rotation.y=Math.PI/4,he.castShadow=!0,zt.add(he);const k=new wx(16760922,.9,1.3);k.name="cuttingGlow",k.position.set(-.45,.08,.24),zt.add(k);const Ot=new Fi;Ot.name="loadingArm",Ot.position.set(-2.02,1.62,.62),Ut.add(Ot);const Et=new Me(new On(.08,.72,.08),Nt);Et.castShadow=!0,Ot.add(Et);const Gt=new Me(new On(.08,.08,.38),Dt);Gt.position.set(.18,-.33,.12),Ot.add(Gt);const jt=Gt.clone();jt.position.z=-.12,Ot.add(jt);const wt=new Me(new An(.08,.08,.25,24),B);wt.position.set(-1.72,2.68,0),wt.castShadow=!0,Ut.add(wt);const se=mt=>{const Ct=new Fi;Ct.userData.offset=mt,Ct.name="rawBarStock";const Lt=new Me(new An(.11,.11,.66,32),Q);Lt.rotation.z=Math.PI/2,Lt.castShadow=!0,Ct.add(Lt);const yt=new Me(new An(.115,.115,.025,32),vt);return yt.position.x=-.35,yt.rotation.z=Math.PI/2,Ct.add(yt),M.add(Ct),Ct},Yt=(mt=0,Ct=dt)=>{const Lt=new Fi;Lt.userData.offset=mt,Lt.name="screwPart";const yt=new Me(new An(.045,.045,.42,32),Ct);yt.rotation.z=Math.PI/2,yt.castShadow=!0,Lt.add(yt);const Rt=new Me(new An(.09,.09,.08,32),Ct);Rt.position.x=-.23,Rt.rotation.z=Math.PI/2,Rt.castShadow=!0,Lt.add(Rt);const Pt=new Me(new On(.018,.13,.018),vt);return Pt.position.x=-.275,Pt.castShadow=!0,Lt.add(Pt),M.add(Lt),Lt},Le=mt=>{const Ct=Yt(mt);Ct.name="finishedParts";const Lt=new Me(new An(.022,.022,.44,24),vt);return Lt.rotation.z=Math.PI/2,Lt.scale.set(1,1,1),Ct.add(Lt),Ct},xe=[se(0),se(.48)],ni=[Le(.05),Le(.34),Le(.68)],In=Yt(0,dt);At?.toolCarrier&&(At.toolCarrier.add(In),In.position.set(.22,-.1,0),In.rotation.set(0,0,Math.PI/2),In.scale.setScalar(.78),In.visible=!1);const Xa=new $e({color:12089910,roughness:.72,metalness:.03}),dn=new X(5.9,-.16,.45);ve([1.05,.12,.82],[dn.x,dn.y,dn.z],Xa),ve([1.05,.48,.08],[dn.x,dn.y+.24,dn.z-.41],Xa),ve([1.05,.48,.08],[dn.x,dn.y+.24,dn.z+.41],Xa),ve([.08,.48,.82],[dn.x-.52,dn.y+.24,dn.z],Xa),ve([.08,.48,.82],[dn.x+.52,dn.y+.24,dn.z],Xa);const Wa=Array.from({length:9},(mt,Ct)=>{const Lt=Yt(Ct/9,dt);return Lt.position.set(dn.x-.28+Ct%3*.22,dn.y+.16+Math.floor(Ct/3)*.035,dn.z-.2+Math.floor(Ct/3)*.18),Lt.rotation.set(.2+Ct*.16,0,Ct*.35),Lt.scale.setScalar(.72),Lt}),xa=Array.from({length:18},(mt,Ct)=>{const Lt=new Me(new On(.055,.018,.018),Wt);return Lt.userData.offset=Ct/18,Lt.castShadow=!0,Ut.add(Lt),Lt});P("TRAK-TC820LTYSI-001",[Ut.position.x,Ut.position.y,Ut.position.z],2.05),E("TRAK-TC820LTYSI-001",[Ut.position.x,Ut.position.y,Ut.position.z],2.05);const Ti=new Me(new On(5.1,2.8,2.3),It);Ti.position.set(.08,1.15,.05),Ut.add(Ti),ce(Ut,"TRAK-TC820LTYSI-001",Ti);const Ya=new aT(16777215,12109257,1.4);M.add(Ya);const Xi=new Cx(16777215,2.3);Xi.position.set(3,5,4),Xi.castShadow=!0,M.add(Xi);const Ai=new Cx(O,.9);Ai.position.set(-3,2.5,-2),M.add(Ai);const Sa=new X(.56,1.16,.1),ya=new X(.574,1.16,.397),Ri=new X(.574,.82,.397),Wi=new X(.62,1.22,.05),Ma=new X(.543,1.14,-.495),Yi=new X(.543,.92,-.495),ir=new X(.22,-.1,0),xs=new X(0,1,0),Ss=-1.05,pi=ni[0],ar=new X,mi=new X,oi=new X,R=new X,H=mt=>{const Ct=[];let Lt=0;for(let yt=0;yt<mt.length-1;yt+=1){const Rt=mt[yt],Pt=mt[yt+1],kt=Rt.distanceTo(Pt);Ct.push({from:Rt,to:Pt,length:kt}),Lt+=kt}return{segments:Ct,total:Lt}},ut=H([new X(-5.45,.08,-.25),new X(-5.45,.08,1.05),new X(-2.35,.08,1.05)]),at=H([new X(2.2,.08,1.05),new X(4.95,.08,1.05)]),st=(mt,Ct,Lt)=>{let yt=Math.max(0,Math.min(1,Ct))*mt.total;for(const Pt of mt.segments){if(yt<=Pt.length)return Lt.copy(Pt.from).lerp(Pt.to,Pt.length?yt/Pt.length:0);yt-=Pt.length}const Rt=mt.segments[mt.segments.length-1];return Lt.copy(Rt.to)},Vt=(mt,Ct,Lt)=>ar.copy(mt).lerp(Ct,Lt),Qt=(mt,Ct,Lt,yt)=>(mi.copy(mt).lerp(Ct,yt),oi.copy(Ct).lerp(Lt,yt),ar.copy(mi).lerp(oi,yt)),Bt=mt=>mt*mt*(3-2*mt),$t=mt=>Math.min(Math.max((mt.x-Ri.x)/(Ma.x-Ri.x),0),1),ee=(mt,Ct)=>{const Lt=-.15+Ct*.38,yt=Ss+(Ct-.5)*.28;return R.copy(ir).applyAxisAngle(xs,Lt).add(mt).multiplyScalar(.95).applyAxisAngle(xs,yt).add(At.robotGroup.position)},pe=ee(Ri,0).clone(),Se=ee(Yi,1).clone();let Jt=0;const Ne=()=>{Jt=window.requestAnimationFrame(Ne);const mt=performance.now()*.001,Ct=(Math.sin(mt*1.05)+1)/2,Lt=mt*.18%1,yt=mt%6/6;if(St.rotation.x=mt*8.6,Ht.rotation.x=mt*14,zt.position.x=.22+Math.sin(mt*.92)*.22,zt.position.z=.48+Math.sin(mt*1.45)*.08,le.rotation.z=mt*.65,k.intensity=.45+Math.abs(Math.sin(mt*5.4))*.85,he.material.emissive=new Ie(16747818),he.material.emissiveIntensity=.08+Ct*.18,Ot.rotation.z=Math.sin(mt*1.2)*.18,on.forEach(Rt=>{Rt.rotation.y-=.16}),W.forEach(Rt=>{const Pt=(Lt+Rt.mesh.userData.offset)%1;mi.copy(Rt.start).lerp(Rt.end,Pt),Rt.mesh.position.set(mi.x,.02,mi.z)}),_t&&(_t.feederRollers.forEach(Rt=>{Rt.rotation.y-=.18}),_t.pusher.position.x=-1.72+mt*.32%1*3.18),At){const Rt=yt>=.38&&yt<.82,Pt=yt>=.34&&yt<.86;let kt=Sa;yt<.12?kt=Sa:yt<.24?kt=Vt(Sa,ya,Bt((yt-.12)/.12)):yt<.34?kt=Vt(ya,Ri,Bt((yt-.24)/.1)):yt<.44?kt=Ri:yt<.54?kt=Vt(Ri,ya,Bt((yt-.44)/.1)):yt<.7?kt=Qt(ya,Wi,Ma,Bt((yt-.54)/.16)):yt<.8?kt=Vt(Ma,Yi,Bt((yt-.7)/.1)):yt<.88?kt=Yi:yt<.96?kt=Vt(Yi,Ma,Bt((yt-.88)/.08)):kt=Vt(Ma,Sa,Bt((yt-.96)/.04)),At.toolCarrier.position.copy(kt);const re=$t(At.toolCarrier.position);At.robotGroup.rotation.y=Ss+(re-.5)*.28,At.jointA.rotation.y=-.72+re*1.25,At.upperArm.rotation.z=-.42+Math.sin(yt*Math.PI)*.08,At.upperBandA.rotation.z=At.upperArm.rotation.z,At.upperBandB.rotation.z=At.upperArm.rotation.z,At.jointB.rotation.y=re*.55,At.jointB.rotation.z=-.36+Math.sin(yt*Math.PI)*.7,At.foreArm.rotation.z=1.22-Math.sin(yt*Math.PI)*.12,At.foreBandA.rotation.z=At.foreArm.rotation.z,At.foreBandB.rotation.z=At.foreArm.rotation.z,At.wrist.rotation.x=-.18+Math.sin(yt*Math.PI*2)*.18,At.toolCarrier.rotation.y=-.15+re*.38,At.gripper.rotation.y=0,At.fingerA.position.z=Pt?.085:.18,At.fingerB.position.z=Pt?-.085:-.18,In.visible=Rt}xe.forEach(Rt=>{const Pt=(mt*.2+Rt.userData.offset)%1,kt=Pt>.78?.78+(Pt-.78)*.18:Pt;st(ut,kt,mi),Rt.position.copy(mi),Rt.rotation.x=mt*2.5}),pi&&(yt<.38?(pi.visible=!0,pi.position.copy(pe)):yt<.82?pi.visible=!1:(pi.visible=!0,pi.position.copy(Se)),pi.rotation.x=mt*2.6,pi.rotation.y=.08),ni.slice(1).forEach(Rt=>{const Pt=(mt*.17+Rt.userData.offset)%1,kt=Pt>.86?.86+(Pt-.86)*.18:Pt;st(at,kt,mi),Rt.position.copy(mi),Rt.rotation.x=mt*2.6,Rt.rotation.y=Math.sin(mt*1.6+Rt.userData.offset)*.08}),Wa.forEach((Rt,Pt)=>{Rt.rotation.y+=.002+Pt*2e-4}),xa.forEach(Rt=>{const Pt=(mt*1.4+Rt.userData.offset)%1;Rt.position.set(-.18+Pt*.7,1.35-Pt*.45+Math.sin(Pt*Math.PI*4)*.035,.8+Pt*.28),Rt.rotation.set(mt*4+Pt,mt*2.3,Pt*6),Rt.material.opacity=1-Pt*.7}),Ce.forEach(Rt=>{const Pt=I(F(Rt.id)),kt=.35+Math.abs(Math.sin(mt*4.6))*.65;Rt.ring.visible=Pt,Rt.ring.material.opacity=Pt?.18+kt*.44:0,Rt.ring.scale.setScalar(1+kt*.08),Rt.glow.intensity=Pt?.8+kt*2.1:0}),y.update(),C.render(M,A)};Ne();const we=()=>{!g.clientWidth||!g.clientHeight||(A.aspect=g.clientWidth/g.clientHeight,A.updateProjectionMatrix(),C.setSize(g.clientWidth,g.clientHeight))},Qe=new ResizeObserver(we);Qe.observe(g);const Ye=()=>{d.current&&(window.clearTimeout(d.current),d.current=null),m.current=null,x(null)},bn=mt=>{const Ct=C.domElement.getBoundingClientRect();return Ee.x=(mt.clientX-Ct.left)/Ct.width*2-1,Ee.y=-((mt.clientY-Ct.top)/Ct.height)*2+1,Ze.setFromCamera(Ee,A),Ze.intersectObjects(Te,!1)[0]?.object?.userData?.machineId||null},qt=mt=>{const Ct=bn(mt);if(!Ct){Ye();return}const Lt={x:Math.min(Math.max(mt.offsetX+14,14),Math.max(g.clientWidth-250,14)),y:Math.min(Math.max(mt.offsetY+14,14),Math.max(g.clientHeight-112,14))};if(m.current===Ct){x(yt=>yt&&{...yt,...Lt});return}d.current&&window.clearTimeout(d.current),m.current=Ct,x(null),d.current=window.setTimeout(()=>{const yt=T(Ct);!yt||m.current!==Ct||x({...yt,...Lt})},2e3)},pn=()=>Ye(),ze=()=>f.current(m.current);return C.domElement.addEventListener("pointermove",qt),C.domElement.addEventListener("pointerleave",pn),C.domElement.addEventListener("click",ze),()=>{window.cancelAnimationFrame(Jt),Qe.disconnect(),Ye(),C.domElement.removeEventListener("pointermove",qt),C.domElement.removeEventListener("pointerleave",pn),C.domElement.removeEventListener("click",ze),C.domElement.parentNode===g&&g.removeChild(C.domElement),M.traverse(mt=>{mt.geometry&&mt.geometry.dispose(),mt.material&&(Array.isArray(mt.material)?mt.material.forEach(Ct=>Ct.dispose()):mt.material.dispose())}),y.dispose(),C.dispose(),C.forceContextLoss()}},[v]),b.jsx("div",{ref:l,className:"machine-3d-canvas","aria-hidden":"true",children:p?b.jsxs("div",{className:`scene-hover-label ${p.status}`,style:{left:p.x,top:p.y},children:[b.jsx("strong",{children:p.name}),b.jsx("span",{children:p.type}),b.jsx("em",{children:p.statusLabel})]}):null})}function lS(o){return o==="fault"?12007218:o==="alarm"||o==="warning"?11954688:o==="idle"?8227987:556917}function Gw({machine:o,isLiveMachine:e,sample:i,result:s,healthText:l}){const f=e?nc(o,s):"idle";return b.jsxs("section",{className:"machine-detail-header",children:[b.jsxs("div",{children:[b.jsx("span",{className:"eyebrow",children:"设备详情"}),b.jsxs("h2",{children:[o.name," · ",o.type]}),b.jsxs("p",{children:[o.line," · ",e&&i?.device_id||o.id]})]}),b.jsxs("div",{className:"machine-detail-stats",children:[b.jsxs("div",{children:[b.jsx("span",{children:"状态"}),b.jsx("strong",{className:f,children:QS(f)})]}),b.jsxs("div",{children:[b.jsx("span",{children:"告警"}),b.jsx("strong",{children:e?i?.alarm_code||"无":"--"})]}),b.jsxs("div",{children:[b.jsx("span",{children:"健康度"}),b.jsx("strong",{children:e?l:"--"})]})]})]})}function Vw({snapshot:o,sample:e,runner:i,healthText:s}){const l=[["监测状态",i.enabled?"开启":"暂停"],["设备状态",ra(ZS,e?.status)],["当前告警",e?.alarm_code||"无"],["采样次数",o?.result_count??"--"],["告警事件次数",o?.alarm_event_count??"--"],["Agent诊断任务",o?.diagnosis_task_count??"--"],["采样周期",i.interval_seconds?`${i.interval_seconds} 秒/次`:"--"],["整机健康度",s]];return b.jsx("section",{className:"status-strip","aria-label":"运行状态",children:l.map(([f,h])=>b.jsxs("div",{className:"status-item",children:[b.jsx("span",{children:f}),b.jsx("strong",{children:h})]},f))})}function kw({result:o,sample:e}){const i=Pe.useMemo(()=>Xw(o,e),[o,e]);return b.jsxs("section",{className:"panel metrics-panel",children:[b.jsxs("div",{className:"panel-heading",children:[b.jsxs("div",{children:[b.jsx("span",{className:"eyebrow",children:"实时快照"}),b.jsx("h2",{children:"实时指标"})]}),b.jsx("span",{className:"muted",children:e?`最近采样 ${rc(e.timestamp)}`:"等待采样"})]}),b.jsx("div",{className:"metrics-grid",children:i.map(s=>b.jsx(Ww,{item:s,result:o},s.key))}),(e?.vibration===null||e?.vibration===void 0)&&b.jsx("div",{className:"notice",children:"当前设备数据源没有提供振动字段，振动不会被其他指标替代；其他设备指标仍会继续监测。"}),b.jsxs("div",{className:"subsection-heading",children:[b.jsx("span",{className:"eyebrow",children:"设备联锁与执行部件"}),b.jsx("strong",{children:"整机状态"})]}),b.jsx(Yw,{sample:e})]})}function Xw(o,e){const i=e?.metrics||{},s=e?.metric_details||{},l=Object.entries(s).map(([f,h])=>({key:f,name:h.label||f,group:h.group||"整机",value:i[f],unit:h.unit||"",normalRange:h.normal_range}));return l.length?l:[{key:"temperature",name:"温度",group:"主轴",value:e?.temperature,unit:"C"},{key:"vibration",name:"振动",group:"主轴",value:e?.vibration,unit:"mm/s"},{key:"rpm",name:"转速",group:"主轴",value:e?.rpm,unit:"rpm"}]}function Ww({item:o,result:e}){const i=e?.observations?.find(h=>h.key===`metric:${o.key}`||h.key===o.key||o.key==="spindle_temperature_c"&&h.key==="temperature"||o.key==="spindle_vibration_rms"&&h.key==="vibration"),s=KS(i?.alert_level),l=o.value===null||o.value===void 0?"未提供":`${Number(o.value).toFixed(1)}`,f=o.normalRange?`正常 ${o.normalRange[0]} - ${o.normalRange[1]}`:"";return b.jsxs("div",{className:`metric ${s}`,children:[b.jsx("span",{className:"metric-group",children:o.group}),b.jsx("span",{className:"metric-name",children:o.name}),b.jsx("strong",{className:"metric-value",children:l}),b.jsxs("span",{className:"metric-unit",children:[o.unit," ",f]})]})}function Yw({sample:o}){const e=Object.values(o?.equipment_states||{});return e.length?b.jsx("div",{className:"equipment-grid",children:e.map((i,s)=>b.jsxs("div",{className:`equipment-state ${i.is_normal?"normal":"fault"}`,children:[b.jsx("span",{children:i.label||"设备状态"}),b.jsx("strong",{children:ra(Nw,i.value)})]},`${i.label||"state"}-${s}`))}):b.jsx("div",{className:"equipment-grid",children:b.jsx("div",{className:"empty-state",children:"当前接口没有提供离散设备状态"})})}function qw({result:o}){const e=o?.status||"normal";return b.jsxs("section",{className:"panel decision-panel",children:[b.jsxs("div",{className:"panel-heading",children:[b.jsxs("div",{children:[b.jsx("span",{className:"eyebrow",children:"监测判定"}),b.jsx("h2",{children:"规则引擎"})]}),b.jsx("span",{className:`severity-pill ${Dw(e)}`,children:ra(ZS,e)})]}),b.jsx(jw,{observations:o?.observations||[]}),b.jsxs("div",{className:"threshold-note",children:[b.jsx("span",{children:"触发条件"}),b.jsx("strong",{children:"关键故障立即触发；普通指标阈值+5秒；间歇故障5分钟内3次；趋势/联合异常"})]})]})}function jw({observations:o}){return o.length?b.jsx("div",{className:"observation-list",children:o.map((e,i)=>{const s=KS(e.alert_level);return b.jsxs("div",{className:"observation",children:[b.jsx("span",{className:`observation-dot ${s}`}),b.jsxs("div",{children:[b.jsxs("div",{className:"observation-title",children:[ra(jS,e.rule_type)," · ",Lw(e),"：",e.value]}),b.jsxs("div",{className:"observation-meta",children:[e.message," · 阈值 ",e.threshold??"-"," ",e.unit||""]})]}),b.jsx("span",{className:"observation-level",children:ra(Rw,e.alert_level)})]},`${e.key||e.kind}-${i}`)})}):b.jsx("div",{className:"observation-list",children:b.jsx("div",{className:"empty-state",children:"当前没有检测到异常"})})}function Zw({snapshot:o}){const e=o?.trigger_history||[];return b.jsxs("section",{className:"panel trigger-panel",children:[b.jsxs("div",{className:"panel-heading",children:[b.jsxs("div",{children:[b.jsx("span",{className:"eyebrow",children:"诊断移交"}),b.jsx("h2",{children:"诊断触发记录"})]}),b.jsx("span",{className:"muted",children:"只记录监测器已确认的触发事件"})]}),b.jsxs("div",{className:"trigger-list",children:[!e.length&&b.jsx("div",{className:"empty-state",children:"暂无触发记录"}),e.map((i,s)=>b.jsxs("div",{className:"trigger-row",children:[b.jsx("span",{className:"trigger-time",children:rc(i.triggered_at)}),b.jsx("span",{className:"trigger-device",children:i.device_id}),b.jsx("span",{className:"trigger-rules",children:i.event_id||i.abnormal_event?.event_id||"--"}),b.jsxs("span",{className:"trigger-reason",children:[i.trigger_cause||"首次确认异常"," · ",i.task_id||"--"," · ",(i.rule_types||[]).map(l=>jS[l]||l).join("、")]})]},`${i.task_id||i.event_id||s}`))]})]})}function Kw({snapshot:o}){const e=o?.diagnosis?.latest||{},i=e.status||"idle",s=i==="failed"?"fault":i==="fallback"?"warning":"normal";return b.jsxs("section",{className:"panel diagnosis-panel",children:[b.jsxs("div",{className:"panel-heading",children:[b.jsxs("div",{children:[b.jsx("span",{className:"eyebrow",children:"智能诊断"}),b.jsx("h2",{children:"诊断结果"})]}),b.jsx("span",{className:`severity-pill ${s}`,children:ra(gm,i)})]}),b.jsx(Qw,{latest:e})]})}function Qw({latest:o}){if(!o||o.status==="idle")return b.jsx("div",{className:"diagnosis-result",children:b.jsx("div",{className:"empty-state",children:"满足触发条件后自动生成诊断结果"})});const e=o.confidence===null||o.confidence===void 0?"--":`${(Number(o.confidence)*100).toFixed(0)}%`,i=o.alarm_definition||{},s=(o.tool_calls||[]).map(f=>ra(ww,f.name)).join("、")||"等待诊断依据",l=[["设备",o.device_id||"--"],["诊断任务",o.task_id||"--"],["异常事件",o.event_id||"--"],["事件轮次",`第 ${o.event_revision||1} 次`],["触发时间",rc(o.triggered_at)],["报警定义",i.name||"未查询到"],["置信度",e],["诊断依据",s]];return b.jsxs("div",{className:"diagnosis-result",children:[b.jsx("div",{className:"diagnosis-summary",children:o.summary||"正在生成诊断结果"}),b.jsx("div",{className:"diagnosis-grid",children:l.map(([f,h])=>b.jsxs("div",{children:[b.jsx("span",{children:f}),b.jsx("strong",{children:h})]},f))}),b.jsxs("div",{className:"diagnosis-detail",children:[b.jsx("span",{children:"诊断说明"}),b.jsx("p",{children:o.diagnosis||"暂无详细诊断"})]}),o.error&&b.jsx("div",{className:"diagnosis-error",children:o.error})]})}function vf({snapshot:o}){return o?.diagnosis?.pipeline||{}}function Jw({snapshot:o}){const e=o?.diagnosis?.latest||{},s=vf({snapshot:o}).knowledge||{},l=e.tool_calls||[];return b.jsxs("section",{className:"workspace-view active module-board","aria-label":"智能诊断中心",children:[b.jsx(Ir,{eyebrow:"Diagnosis Agent",title:"智能诊断中心",text:"查看异常事件、诊断结论、报警定义、历史证据和知识检索结果。"}),b.jsxs("div",{className:"module-grid",children:[b.jsx(Rn,{label:"诊断状态",value:ra(gm,e.status),text:e.diagnosis_run_id||"等待异常任务"}),b.jsx(Rn,{label:"置信度",value:e.confidence==null?"--":`${(Number(e.confidence)*100).toFixed(0)}%`,text:e.event_id||"暂无异常事件"}),b.jsx(Rn,{label:"知识证据",value:(s.documents||[]).length,text:s.source||"A2A / RAG"})]}),b.jsxs("div",{className:"ops-grid",children:[b.jsxs("section",{className:"panel module-panel",children:[b.jsxs("div",{className:"panel-heading",children:[b.jsxs("div",{children:[b.jsx("span",{className:"eyebrow",children:"最终诊断"}),b.jsx("h2",{children:e.summary||"等待异常事件"})]}),b.jsx("span",{className:`severity-pill ${e.status==="failed"?"fault":"normal"}`,children:ra(gm,e.status)})]}),b.jsxs("div",{className:"detail-grid",children:[b.jsx(sa,{label:"设备",value:e.device_id}),b.jsx(sa,{label:"异常事件",value:e.event_id}),b.jsx(sa,{label:"事件轮次",value:e.event_revision?`第 ${e.event_revision} 次`:"--"}),b.jsx(sa,{label:"触发原因",value:e.trigger_cause})]}),b.jsxs("div",{className:"diagnosis-detail",children:[b.jsx("span",{children:"诊断说明"}),b.jsx("p",{children:e.diagnosis||"暂无诊断说明"})]}),e.recommendation&&b.jsxs("div",{className:"diagnosis-detail",children:[b.jsx("span",{children:"下一步建议"}),b.jsx("p",{children:e.recommendation})]})]}),b.jsxs("section",{className:"panel module-panel",children:[b.jsx("div",{className:"panel-heading",children:b.jsxs("div",{children:[b.jsx("span",{className:"eyebrow",children:"工具证据"}),b.jsx("h2",{children:"Reason · Act · Observe"})]})}),b.jsx(Fm,{items:l.map(f=>({event:f.name,agent:"Diagnosis Agent",tool:f.name,arguments:f.arguments}))}),b.jsx(JS,{documents:s.documents||[]})]})]})]})}function $w({snapshot:o}){const e=vf({snapshot:o}),i=e.maintenance_plan||{},s=i.diagnosis||e.diagnosis||{};return b.jsxs("section",{className:"workspace-view active module-board","aria-label":"维修决策中心",children:[b.jsx(Ir,{eyebrow:"Maintenance Agent",title:"维修决策中心",text:"将诊断结果、RAG知识和CAD/BOM部件信息汇总为可执行维修方案。"}),b.jsxs("div",{className:"module-grid",children:[b.jsx(Rn,{label:"方案编号",value:i.plan_id||"--",text:s.fault||s.summary||"等待诊断"}),b.jsx(Rn,{label:"预计用时",value:i.estimated_time||"--",text:"Maintenance Agent 估算"}),b.jsx(Rn,{label:"关联部件",value:(i.cad_components||[]).length,text:"来自 CAD / BOM 查询"})]}),b.jsxs("div",{className:"ops-grid",children:[b.jsxs("section",{className:"panel module-panel",children:[b.jsx("div",{className:"panel-heading",children:b.jsxs("div",{children:[b.jsx("span",{className:"eyebrow",children:"维修步骤"}),b.jsx("h2",{children:"执行清单"})]})}),b.jsx(Bm,{steps:i.repair_steps||[]})]}),b.jsxs("section",{className:"panel module-panel",children:[b.jsx("div",{className:"panel-heading",children:b.jsxs("div",{children:[b.jsx("span",{className:"eyebrow",children:"安全与资源"}),b.jsx("h2",{children:"工器具、备件和安全要求"})]})}),b.jsxs("div",{className:"detail-grid",children:[b.jsx(sa,{label:"工器具",value:(i.tools||[]).join("、")}),b.jsx(sa,{label:"备件",value:(i.parts||[]).join("、")}),b.jsx(sa,{label:"安全要求",value:(i.safety||[]).join("；")}),b.jsx(sa,{label:"知识来源",value:(i.source_documents||[]).join("、")})]})]})]})]})}function t3({snapshot:o}){const i=vf({snapshot:o}).report||{},s=i.sections||{};return b.jsxs("section",{className:"workspace-view active module-board","aria-label":"报告中心",children:[b.jsx(Ir,{eyebrow:"Report Agent",title:"报告中心",text:"汇总诊断、维修方案、工单和质检结果，形成可追溯运维报告。"}),b.jsxs("div",{className:"module-grid",children:[b.jsx(Rn,{label:"报告编号",value:i.report_id||"--",text:i.report_type||"maintenance"}),b.jsx(Rn,{label:"报告标题",value:i.title||"--",text:i.created_at?rc(i.created_at):"等待生成"}),b.jsx(Rn,{label:"质量状态",value:s.quality?.passed==null?"--":s.quality.passed?"通过":"未通过",text:"Quality Agent"})]}),b.jsxs("section",{className:"panel module-panel report-panel",children:[b.jsx("div",{className:"panel-heading",children:b.jsxs("div",{children:[b.jsx("span",{className:"eyebrow",children:"报告摘要"}),b.jsx("h2",{children:i.title||"暂无报告"})]})}),b.jsx("p",{className:"answer-summary",children:i.summary||"完成一次异常闭环后，将在此展示诊断报告、维修报告和质检报告内容。"}),b.jsx($S,{value:s})]})]})}function e3({snapshot:o}){const e=vf({snapshot:o}),i=e.trace||[];return b.jsxs("section",{className:"workspace-view active module-board","aria-label":"AI运行追踪",children:[b.jsx(Ir,{eyebrow:"Agent Runtime",title:"AI运行追踪",text:"观察 Router、Harness、Agent、Tool、MCP 和 Experience 的调用链。"}),b.jsxs("div",{className:"module-grid",children:[b.jsx(Rn,{label:"Trace记录",value:i.length,text:e.trace_id||"当前异常流程"}),b.jsx(Rn,{label:"Agent事件",value:i.filter(s=>s.agent).length,text:"生命周期记录"}),b.jsx(Rn,{label:"Tool事件",value:i.filter(s=>s.tool).length,text:"MCP工具调用记录"})]}),b.jsxs("section",{className:"panel module-panel",children:[b.jsx("div",{className:"panel-heading",children:b.jsxs("div",{children:[b.jsx("span",{className:"eyebrow",children:"调用链"}),b.jsx("h2",{children:"Trace Timeline"})]})}),b.jsx(Fm,{items:i})]})]})}function n3({snapshot:o,sample:e}){const[i,s]=Pe.useState([]),[l,f]=Pe.useState(""),[h,d]=Pe.useState("维修一组"),[m,p]=Pe.useState(""),[x,v]=Pe.useState(!1),g=o?.diagnosis?.latest||{},M=i.find(S=>S.workorder_id===l)||i[0];async function A(){try{const U=(await ki("/api/workorders")).items||[];s(U),!l&&U.length&&f(U[0].workorder_id),p("")}catch(S){p(S.message)}}Pe.useEffect(()=>{A()},[]);async function C(){v(!0);try{const S=g.summary||g.fault||`${e?.device_id||o?.device_id||"unknown"} 设备维修`,U=await ki("/api/workorders",{method:"POST",body:JSON.stringify({device_id:e?.device_id||o?.device_id||"unknown",title:S,steps:g.recommendation?[g.recommendation]:Cw,assignee:h})});await A(),f(U.workorder_id),p("")}catch(S){p(S.message)}finally{v(!1)}}async function y(S){if(M){v(!0);try{const U=S==="closed"?"close":"update",F=await ki(`/api/workorders/${M.workorder_id}/action`,{method:"POST",body:JSON.stringify({action:U,status:S,assignee:h})});s(N=>N.map(L=>L.workorder_id===F.workorder_id?F:L)),p("")}catch(U){p(U.message)}finally{v(!1)}}}return b.jsxs("section",{className:"workspace-view active module-board","aria-label":"工单系统",children:[b.jsx(Ir,{eyebrow:"MES 工单系统",title:"维修工单闭环",text:"把诊断结果转成维修任务，跟踪处理人、步骤和状态，并为质检验收提供入口。"}),b.jsxs("div",{className:"module-grid",children:[b.jsx(Rn,{label:"当前工单",value:i.length,text:"Agent Service 内存工单池"}),b.jsx(Rn,{label:"选中状态",value:ra(_m,M?.status),text:M?.workorder_id||"暂无工单"}),b.jsx(Rn,{label:"关联设备",value:M?.device_id||e?.device_id||o?.device_id||"--",text:"来自实时监测上下文"})]}),b.jsxs("div",{className:"ops-grid",children:[b.jsxs("section",{className:"panel module-panel",children:[b.jsxs("div",{className:"panel-heading",children:[b.jsxs("div",{children:[b.jsx("span",{className:"eyebrow",children:"创建工单"}),b.jsx("h2",{children:"诊断转派"})]}),b.jsx("span",{className:"muted",children:g.summary||"可先创建演示工单"})]}),b.jsxs("div",{className:"form-row",children:[b.jsxs("label",{children:["处理人",b.jsx("input",{value:h,onChange:S=>d(S.target.value)})]}),b.jsx("button",{className:"button primary",type:"button",disabled:x,onClick:C,children:x?"处理中":"创建工单"})]}),m&&b.jsx("div",{className:"inline-error",children:m})]}),b.jsxs("section",{className:"panel module-panel",children:[b.jsxs("div",{className:"panel-heading",children:[b.jsxs("div",{children:[b.jsx("span",{className:"eyebrow",children:"工单列表"}),b.jsx("h2",{children:"任务队列"})]}),b.jsx("button",{className:"button",type:"button",onClick:A,children:"刷新"})]}),b.jsxs("div",{className:"order-list",children:[!i.length&&b.jsx("div",{className:"empty-state",children:"暂无工单，点击创建工单生成第一条任务"}),i.map(S=>b.jsxs("button",{type:"button",className:`order-row ${S.workorder_id===M?.workorder_id?"active":""}`,onClick:()=>f(S.workorder_id),children:[b.jsxs("span",{children:[b.jsx("strong",{children:S.title}),b.jsx("em",{children:S.workorder_id})]}),b.jsx("b",{children:ra(_m,S.status)})]},S.workorder_id))]})]})]}),b.jsx(i3,{order:M,busy:x,onUpdate:y})]})}function i3({order:o,busy:e,onUpdate:i}){return o?b.jsxs("section",{className:"panel module-panel detail-panel",children:[b.jsxs("div",{className:"panel-heading",children:[b.jsxs("div",{children:[b.jsx("span",{className:"eyebrow",children:"工单详情"}),b.jsx("h2",{children:o.title})]}),b.jsx("span",{className:`severity-pill ${o.status==="closed"||o.status==="completed"?"normal":"warning"}`,children:ra(_m,o.status)})]}),b.jsxs("div",{className:"detail-grid",children:[b.jsx(sa,{label:"工单编号",value:o.workorder_id}),b.jsx(sa,{label:"设备",value:o.device_id}),b.jsx(sa,{label:"处理人",value:o.assignee||"未分配"}),b.jsx(sa,{label:"更新时间",value:rc(o.updated_at)})]}),b.jsx(Bm,{steps:o.steps}),b.jsxs("div",{className:"action-row",children:[b.jsx("button",{className:"button",type:"button",disabled:e,onClick:()=>i("in_progress"),children:"标记处理中"}),b.jsx("button",{className:"button",type:"button",disabled:e,onClick:()=>i("completed"),children:"标记完成"}),b.jsx("button",{className:"button primary",type:"button",disabled:e,onClick:()=>i("closed"),children:"关闭工单"})]})]}):b.jsx("section",{className:"panel module-panel",children:b.jsx("div",{className:"empty-state",children:"暂无工单详情"})})}function a3({snapshot:o,sample:e}){const[i,s]=Pe.useState(oS[0]),[l,f]=Pe.useState(null),[h,d]=Pe.useState(null),[m,p]=Pe.useState(null),[x,v]=Pe.useState(""),[g,M]=Pe.useState(!1);async function A(){try{p(await ki("/api/rag/status"))}catch(U){v(U.message)}}Pe.useEffect(()=>{A()},[]);async function C(U=i){if(U.trim()){M(!0);try{const[F,N]=await Promise.all([ki("/api/agent/question",{method:"POST",body:JSON.stringify({user_text:U,context:{device_id:e?.device_id||o?.device_id||""}})}),ki(`/api/rag/search?query=${encodeURIComponent(U)}&limit=5`)]);f(F),d(N),v("")}catch(F){v(F.message)}finally{M(!1)}}}const y=h?.documents||l?.knowledge?.documents||[],S=l?.report||{};return b.jsxs("section",{className:"workspace-view active module-board","aria-label":"RAG知识问答",children:[b.jsx(Ir,{eyebrow:"RAG 知识中枢",title:"维修知识问答",text:"统一调用 Router、Knowledge 和 RAG 检索接口，展示答案摘要、命中文档与知识库状态。"}),b.jsxs("div",{className:"module-grid",children:[b.jsx(Rn,{label:"检索后端",value:m?.backend||"--",text:"支持本地 fallback 或远程 RAG"}),b.jsx(Rn,{label:"知识记录",value:m?.record_count??"--",text:"当前可检索记录数"}),b.jsx(Rn,{label:"命中文档",value:y.length,text:"本次问答引用结果"})]}),b.jsxs("section",{className:"qa-shell",children:[b.jsx("div",{className:"quick-row",children:oS.map(U=>b.jsx("button",{className:"button",type:"button",onClick:()=>{s(U),C(U)},children:U},U))}),b.jsx("textarea",{className:"qa-input",value:i,onChange:U=>s(U.target.value),placeholder:"输入设备维修、SOP、报警码问题"}),b.jsxs("div",{className:"action-row",children:[b.jsx("button",{className:"button primary",type:"button",disabled:g,onClick:()=>C(),children:g?"检索中":"提交问答"}),b.jsx("button",{className:"button",type:"button",onClick:A,children:"刷新知识库状态"})]}),x&&b.jsx("div",{className:"inline-error",children:x})]}),b.jsxs("section",{className:"answer-grid",children:[b.jsxs("div",{className:"panel module-panel",children:[b.jsx("div",{className:"panel-heading",children:b.jsxs("div",{children:[b.jsx("span",{className:"eyebrow",children:"Agent 回答"}),b.jsx("h2",{children:S.title||"等待提问"})]})}),b.jsx("p",{className:"answer-summary",children:S.summary||l?.diagnosis?.fault||l?.route_result?.reason||"输入问题后将展示 Router 与 Knowledge Agent 的回答。"}),l?.route_result&&b.jsx($S,{value:l.route_result})]}),b.jsxs("div",{className:"panel module-panel",children:[b.jsxs("div",{className:"panel-heading",children:[b.jsxs("div",{children:[b.jsx("span",{className:"eyebrow",children:"引用文档"}),b.jsx("h2",{children:"RAG 命中"})]}),b.jsx("span",{className:"muted",children:h?.source||l?.knowledge?.source||"--"})]}),b.jsx(JS,{documents:y})]})]})]})}function s3({snapshot:o,sample:e}){const[i,s]=Pe.useState([]),[l,f]=Pe.useState(""),[h,d]=Pe.useState(null),[m,p]=Pe.useState([]),[x,v]=Pe.useState([]),[g,M]=Pe.useState(""),[A,C]=Pe.useState(!1),y=i.find(F=>F.workorder_id===l)||i[0];async function S(){try{const[F,N,L]=await Promise.all([ki("/api/workorders"),ki("/api/trace"),ki("/api/experience/search",{method:"POST",body:JSON.stringify({device_id:e?.device_id||o?.device_id||"",limit:8})})]),D=F.items||[];s(D),p(N.trace||[]),v(L.items||[]),!l&&D.length&&f(D[0].workorder_id),M("")}catch(F){M(F.message)}}Pe.useEffect(()=>{S()},[]);async function U(){if(y){C(!0);try{const F=await ki(`/api/workorders/${y.workorder_id}/quality`,{method:"POST",body:"{}"});d(F),await S(),M("")}catch(F){M(F.message)}finally{C(!1)}}}return b.jsxs("section",{className:"workspace-view active module-board","aria-label":"质检系统",children:[b.jsx(Ir,{eyebrow:"QMS 质检系统",title:"维修验收与经验沉淀",text:"对已处理工单执行恢复验证，查看 Agent Trace，并展示维修经验库检索结果。"}),b.jsxs("div",{className:"module-grid",children:[b.jsx(Rn,{label:"待验工单",value:i.length,text:"来自当前工单池"}),b.jsx(Rn,{label:"最近验收",value:h?h.passed?"通过":"未通过":"未执行",text:h?.workorder_id||"选择工单后执行"}),b.jsx(Rn,{label:"经验记录",value:x.length,text:"长期记忆/经验库结果"})]}),b.jsxs("div",{className:"ops-grid",children:[b.jsxs("section",{className:"panel module-panel",children:[b.jsxs("div",{className:"panel-heading",children:[b.jsxs("div",{children:[b.jsx("span",{className:"eyebrow",children:"验收对象"}),b.jsx("h2",{children:"选择工单"})]}),b.jsx("button",{className:"button",type:"button",onClick:S,children:"刷新"})]}),b.jsxs("select",{className:"select-input",value:y?.workorder_id||"",onChange:F=>f(F.target.value),children:[!i.length&&b.jsx("option",{value:"",children:"暂无工单"}),i.map(F=>b.jsxs("option",{value:F.workorder_id,children:[F.workorder_id," · ",F.title]},F.workorder_id))]}),b.jsx("div",{className:"action-row",children:b.jsx("button",{className:"button primary",type:"button",disabled:A||!y,onClick:U,children:A?"验收中":"执行质检"})}),g&&b.jsx("div",{className:"inline-error",children:g})]}),b.jsxs("section",{className:"panel module-panel",children:[b.jsx("div",{className:"panel-heading",children:b.jsxs("div",{children:[b.jsx("span",{className:"eyebrow",children:"质检结果"}),b.jsx("h2",{children:h?h.passed?"验收通过":"验收未通过":"等待验收"})]})}),h?b.jsx(r3,{quality:h}):b.jsx("div",{className:"empty-state",children:"工单完成或关闭后，质检结果会显示恢复状态、报警清除和 SOP 合规性。"})]})]}),b.jsxs("section",{className:"answer-grid",children:[b.jsxs("div",{className:"panel module-panel",children:[b.jsx("div",{className:"panel-heading",children:b.jsxs("div",{children:[b.jsx("span",{className:"eyebrow",children:"经验库"}),b.jsx("h2",{children:"维修经验"})]})}),b.jsx(o3,{items:x})]}),b.jsxs("div",{className:"panel module-panel",children:[b.jsx("div",{className:"panel-heading",children:b.jsxs("div",{children:[b.jsx("span",{className:"eyebrow",children:"Trace"}),b.jsx("h2",{children:"Agent 调用轨迹"})]})}),b.jsx(Fm,{items:m})]})]})]})}function Ir({eyebrow:o,title:e,text:i}){return b.jsxs("div",{className:"module-hero",children:[b.jsx("span",{className:"eyebrow",children:o}),b.jsx("h2",{children:e}),b.jsx("p",{children:i})]})}function Rn({label:o,value:e,text:i}){return b.jsxs("div",{className:"module-card",children:[b.jsx("span",{children:o}),b.jsx("strong",{children:e}),b.jsx("p",{children:i})]})}function sa({label:o,value:e}){return b.jsxs("div",{children:[b.jsx("span",{children:o}),b.jsx("strong",{children:e||"--"})]})}function Bm({steps:o=[]}){return o.length?b.jsx("ol",{className:"step-list",children:o.map((e,i)=>b.jsx("li",{children:e},`${e}-${i}`))}):b.jsx("div",{className:"empty-state",children:"暂无维修步骤"})}function JS({documents:o}){return o.length?b.jsx("div",{className:"document-list",children:o.map((e,i)=>b.jsxs("article",{children:[b.jsx("strong",{children:e.title||e.document_id}),b.jsx("p",{children:e.content}),b.jsxs("span",{children:[e.source||e.metadata?.collection||"知识库"," · 相关度 ",e.score??"--"]})]},e.document_id||i))}):b.jsx("div",{className:"empty-state",children:"暂无命中文档"})}function r3({quality:o}){const e=[["设备恢复",o.device_recovered],["报警清除",o.alarm_cleared],["SOP合规",o.sop_compliant]];return b.jsxs("div",{className:"quality-result",children:[b.jsx("div",{className:"check-grid",children:e.map(([i,s])=>b.jsxs("div",{className:s?"normal":"fault",children:[b.jsx("span",{children:i}),b.jsx("strong",{children:s?"通过":"未通过"})]},i))}),b.jsx(Bm,{steps:o.findings||[]})]})}function o3({items:o}){return o.length?b.jsx("div",{className:"document-list",children:o.map((e,i)=>b.jsxs("article",{children:[b.jsx("strong",{children:e.title}),b.jsx("p",{children:e.content}),b.jsxs("span",{children:[e.device_id||"--"," · ",e.source_workorder||"历史经验"]})]},e.experience_id||i))}):b.jsx("div",{className:"empty-state",children:"暂无经验记录；闭环通过后会自动沉淀。"})}function Fm({items:o}){return o.length?b.jsx("div",{className:"trace-list",children:o.slice(0,12).map((e,i)=>b.jsxs("div",{children:[b.jsx("strong",{children:e.event}),b.jsx("span",{children:e.agent||e.tool||e.mcp_server||"runtime"})]},`${e.event||"trace"}-${i}`))}):b.jsx("div",{className:"empty-state",children:"暂无调用轨迹"})}function $S({value:o}){return b.jsx("pre",{className:"json-block",children:JSON.stringify(o,null,2)})}BE.createRoot(document.getElementById("root")).render(b.jsx(Pw,{}));
