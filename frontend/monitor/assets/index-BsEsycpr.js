(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const l of document.querySelectorAll('link[rel="modulepreload"]'))s(l);new MutationObserver(l=>{for(const f of l)if(f.type==="childList")for(const h of f.addedNodes)h.tagName==="LINK"&&h.rel==="modulepreload"&&s(h)}).observe(document,{childList:!0,subtree:!0});function i(l){const f={};return l.integrity&&(f.integrity=l.integrity),l.referrerPolicy&&(f.referrerPolicy=l.referrerPolicy),l.crossOrigin==="use-credentials"?f.credentials="include":l.crossOrigin==="anonymous"?f.credentials="omit":f.credentials="same-origin",f}function s(l){if(l.ep)return;l.ep=!0;const f=i(l);fetch(l.href,f)}})();var Ad={exports:{}},gl={};var zv;function EE(){if(zv)return gl;zv=1;var o=Symbol.for("react.transitional.element"),e=Symbol.for("react.fragment");function i(s,l,f){var h=null;if(f!==void 0&&(h=""+f),l.key!==void 0&&(h=""+l.key),"key"in l){f={};for(var d in l)d!=="key"&&(f[d]=l[d])}else f=l;return l=f.ref,{$$typeof:o,type:s,key:h,ref:l!==void 0?l:null,props:f}}return gl.Fragment=e,gl.jsx=i,gl.jsxs=i,gl}var Bv;function bE(){return Bv||(Bv=1,Ad.exports=EE()),Ad.exports}var b=bE(),Rd={exports:{}},ce={};var Fv;function TE(){if(Fv)return ce;Fv=1;var o=Symbol.for("react.transitional.element"),e=Symbol.for("react.portal"),i=Symbol.for("react.fragment"),s=Symbol.for("react.strict_mode"),l=Symbol.for("react.profiler"),f=Symbol.for("react.consumer"),h=Symbol.for("react.context"),d=Symbol.for("react.forward_ref"),m=Symbol.for("react.suspense"),p=Symbol.for("react.memo"),S=Symbol.for("react.lazy"),_=Symbol.for("react.activity"),v=Symbol.for("react.view_transition"),M=Symbol.iterator;function A(B){return B===null||typeof B!="object"?null:(B=M&&B[M]||B["@@iterator"],typeof B=="function"?B:null)}var N={isMounted:function(){return!1},enqueueForceUpdate:function(){},enqueueReplaceState:function(){},enqueueSetState:function(){}},y=Object.assign,x={};function U(B,_t,Dt){this.props=B,this.context=_t,this.refs=x,this.updater=Dt||N}U.prototype.isReactComponent={},U.prototype.setState=function(B,_t){if(typeof B!="object"&&typeof B!="function"&&B!=null)throw Error("takes an object of state variables to update or a function which returns an object of state variables.");this.updater.enqueueSetState(this,B,_t,"setState")},U.prototype.forceUpdate=function(B){this.updater.enqueueForceUpdate(this,B,"forceUpdate")};function F(){}F.prototype=U.prototype;function C(B,_t,Dt){this.props=B,this.context=_t,this.refs=x,this.updater=Dt||N}var D=C.prototype=new F;D.constructor=C,y(D,U.prototype),D.isPureReactComponent=!0;var L=Array.isArray;function I(){}var T={H:null,A:null,T:null,S:null},O=Object.prototype.hasOwnProperty;function G(B,_t,Dt){var Z=Dt.ref;return{$$typeof:o,type:B,key:_t,ref:Z!==void 0?Z:null,props:Dt}}function k(B,_t){return G(B.type,_t,B.props)}function Q(B){return typeof B=="object"&&B!==null&&B.$$typeof===o}function st(B){var _t={"=":"=0",":":"=2"};return"$"+B.replace(/[=:]/g,function(Dt){return _t[Dt]})}var Y=/\/+/g;function tt(B,_t){return typeof B=="object"&&B!==null&&B.key!=null?st(""+B.key):_t.toString(36)}function q(B){switch(B.status){case"fulfilled":return B.value;case"rejected":throw B.reason;default:switch(typeof B.status=="string"?B.then(I,I):(B.status="pending",B.then(function(_t){B.status==="pending"&&(B.status="fulfilled",B.value=_t)},function(_t){B.status==="pending"&&(B.status="rejected",B.reason=_t)})),B.status){case"fulfilled":return B.value;case"rejected":throw B.reason}}throw B}function j(B,_t,Dt,Z,ft){var Ct=typeof B;(Ct==="undefined"||Ct==="boolean")&&(B=null);var Pt=!1;if(B===null)Pt=!0;else switch(Ct){case"bigint":case"string":case"number":Pt=!0;break;case"object":switch(B.$$typeof){case o:case e:Pt=!0;break;case S:return Pt=B._init,j(Pt(B._payload),_t,Dt,Z,ft)}}if(Pt)return ft=ft(B),Pt=Z===""?"."+tt(B,0):Z,L(ft)?(Dt="",Pt!=null&&(Dt=Pt.replace(Y,"$&/")+"/"),j(ft,_t,Dt,"",function(be){return be})):ft!=null&&(Q(ft)&&(ft=k(ft,Dt+(ft.key==null||B&&B.key===ft.key?"":(""+ft.key).replace(Y,"$&/")+"/")+Pt)),_t.push(ft)),1;Pt=0;var vt=Z===""?".":Z+":";if(L(B))for(var Ut=0;Ut<B.length;Ut++)Z=B[Ut],Ct=vt+tt(Z,Ut),Pt+=j(Z,_t,Dt,Ct,ft);else if(Ut=A(B),typeof Ut=="function")for(B=Ut.call(B),Ut=0;!(Z=B.next()).done;)Z=Z.value,Ct=vt+tt(Z,Ut++),Pt+=j(Z,_t,Dt,Ct,ft);else if(Ct==="object"){if(typeof B.then=="function")return j(q(B),_t,Dt,Z,ft);throw _t=String(B),Error("Objects are not valid as a React child (found: "+(_t==="[object Object]"?"object with keys {"+Object.keys(B).join(", ")+"}":_t)+"). If you meant to render a collection of children, use an array instead.")}return Pt}function dt(B,_t,Dt){if(B==null)return B;var Z=[],ft=0;return j(B,Z,"","",function(Ct){return _t.call(Dt,Ct,ft++)}),Z}function ut(B){if(B._status===-1){var _t=B._result,Dt=_t();Dt.then(function(Z){(B._status===0||B._status===-1)&&(B._status=1,B._result=Z,Dt.status===void 0&&(Dt.status="fulfilled",Dt.value=Z))},function(Z){(B._status===0||B._status===-1)&&(B._status=2,B._result=Z,Dt.status===void 0&&(Dt.status="rejected",Dt.reason=Z))}),B._status===-1&&(B._status=0,B._result=Dt)}if(B._status===1)return B._result.default;throw B._result}var rt=typeof reportError=="function"?reportError:function(B){if(typeof window=="object"&&typeof window.ErrorEvent=="function"){var _t=new window.ErrorEvent("error",{bubbles:!0,cancelable:!0,message:typeof B=="object"&&B!==null&&typeof B.message=="string"?String(B.message):String(B),error:B});if(!window.dispatchEvent(_t))return}else if(typeof process=="object"&&typeof process.emit=="function"){process.emit("uncaughtException",B);return}console.error(B)};function Tt(B){var _t=T.T,Dt={};Dt.types=_t!==null?_t.types:null,T.T=Dt;try{var Z=B(),ft=T.S;ft!==null&&ft(Dt,Z),typeof Z=="object"&&Z!==null&&typeof Z.then=="function"&&Z.then(I,rt)}catch(Ct){rt(Ct)}finally{_t!==null&&Dt.types!==null&&(_t.types=Dt.types),T.T=_t}}function Gt(B){var _t=T.T;if(_t!==null){var Dt=_t.types;Dt===null?_t.types=[B]:Dt.indexOf(B)===-1&&Dt.push(B)}else Tt(Gt.bind(null,B))}var Ot={map:dt,forEach:function(B,_t,Dt){dt(B,function(){_t.apply(this,arguments)},Dt)},count:function(B){var _t=0;return dt(B,function(){_t++}),_t},toArray:function(B){return dt(B,function(_t){return _t})||[]},only:function(B){if(!Q(B))throw Error("React.Children.only expected to receive a single React element child.");return B}};return ce.Activity=_,ce.Children=Ot,ce.Component=U,ce.Fragment=i,ce.Profiler=l,ce.PureComponent=C,ce.StrictMode=s,ce.Suspense=m,ce.ViewTransition=v,ce.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE=T,ce.__COMPILER_RUNTIME={__proto__:null,c:function(B){return T.H.useMemoCache(B)}},ce.addTransitionType=Gt,ce.cache=function(B){return function(){return B.apply(null,arguments)}},ce.cacheSignal=function(){return null},ce.cloneElement=function(B,_t,Dt){if(B==null)throw Error("The argument must be a React element, but you passed "+B+".");var Z=y({},B.props),ft=B.key;if(_t!=null)for(Ct in _t.key!==void 0&&(ft=""+_t.key),_t)!O.call(_t,Ct)||Ct==="key"||Ct==="__self"||Ct==="__source"||Ct==="ref"&&_t.ref===void 0||(Z[Ct]=_t[Ct]);var Ct=arguments.length-2;if(Ct===1)Z.children=Dt;else if(1<Ct){for(var Pt=Array(Ct),vt=0;vt<Ct;vt++)Pt[vt]=arguments[vt+2];Z.children=Pt}return G(B.type,ft,Z)},ce.createContext=function(B){return B={$$typeof:h,_currentValue:B,_currentValue2:B,_threadCount:0,Provider:null,Consumer:null},B.Provider=B,B.Consumer={$$typeof:f,_context:B},B},ce.createElement=function(B,_t,Dt){var Z,ft={},Ct=null;if(_t!=null)for(Z in _t.key!==void 0&&(Ct=""+_t.key),_t)O.call(_t,Z)&&Z!=="key"&&Z!=="__self"&&Z!=="__source"&&(ft[Z]=_t[Z]);var Pt=arguments.length-2;if(Pt===1)ft.children=Dt;else if(1<Pt){for(var vt=Array(Pt),Ut=0;Ut<Pt;Ut++)vt[Ut]=arguments[Ut+2];ft.children=vt}if(B&&B.defaultProps)for(Z in Pt=B.defaultProps,Pt)ft[Z]===void 0&&(ft[Z]=Pt[Z]);return G(B,Ct,ft)},ce.createRef=function(){return{current:null}},ce.forwardRef=function(B){return{$$typeof:d,render:B}},ce.isValidElement=Q,ce.lazy=function(B){return{$$typeof:S,_payload:{_status:-1,_result:B},_init:ut}},ce.memo=function(B,_t){return{$$typeof:p,type:B,compare:_t===void 0?null:_t}},ce.startTransition=Tt,ce.unstable_useCacheRefresh=function(){return T.H.useCacheRefresh()},ce.use=function(B){return T.H.use(B)},ce.useActionState=function(B,_t,Dt){return T.H.useActionState(B,_t,Dt)},ce.useCallback=function(B,_t){return T.H.useCallback(B,_t)},ce.useContext=function(B){return T.H.useContext(B)},ce.useDebugValue=function(){},ce.useDeferredValue=function(B,_t){return T.H.useDeferredValue(B,_t)},ce.useEffect=function(B,_t){return T.H.useEffect(B,_t)},ce.useEffectEvent=function(B){return T.H.useEffectEvent(B)},ce.useId=function(){return T.H.useId()},ce.useImperativeHandle=function(B,_t,Dt){return T.H.useImperativeHandle(B,_t,Dt)},ce.useInsertionEffect=function(B,_t){return T.H.useInsertionEffect(B,_t)},ce.useLayoutEffect=function(B,_t){return T.H.useLayoutEffect(B,_t)},ce.useMemo=function(B,_t){return T.H.useMemo(B,_t)},ce.useOptimistic=function(B,_t){return T.H.useOptimistic(B,_t)},ce.useReducer=function(B,_t,Dt){return T.H.useReducer(B,_t,Dt)},ce.useRef=function(B){return T.H.useRef(B)},ce.useState=function(B){return T.H.useState(B)},ce.useSyncExternalStore=function(B,_t,Dt){return T.H.useSyncExternalStore(B,_t,Dt)},ce.useTransition=function(){return T.H.useTransition()},ce.version="19.3.0",ce}var Hv;function sm(){return Hv||(Hv=1,Rd.exports=TE()),Rd.exports}var Ve=sm(),wd={exports:{}},_l={},Cd={exports:{}},Nd={};var Gv;function AE(){return Gv||(Gv=1,(function(o){function e(q,j){var dt=q.length;q.push(j);t:for(;0<dt;){var ut=dt-1>>>1,rt=q[ut];if(0<l(rt,j))q[ut]=j,q[dt]=rt,dt=ut;else break t}}function i(q){return q.length===0?null:q[0]}function s(q){if(q.length===0)return null;var j=q[0],dt=q.pop();if(dt!==j){q[0]=dt;t:for(var ut=0,rt=q.length,Tt=rt>>>1;ut<Tt;){var Gt=2*(ut+1)-1,Ot=q[Gt],B=Gt+1,_t=q[B];if(0>l(Ot,dt))B<rt&&0>l(_t,Ot)?(q[ut]=_t,q[B]=dt,ut=B):(q[ut]=Ot,q[Gt]=dt,ut=Gt);else if(B<rt&&0>l(_t,dt))q[ut]=_t,q[B]=dt,ut=B;else break t}}return j}function l(q,j){var dt=q.sortIndex-j.sortIndex;return dt!==0?dt:q.id-j.id}if(o.unstable_now=void 0,typeof performance=="object"&&typeof performance.now=="function"){var f=performance;o.unstable_now=function(){return f.now()}}else{var h=Date,d=h.now();o.unstable_now=function(){return h.now()-d}}var m=[],p=[],S=1,_=null,v=3,M=!1,A=!1,N=!1,y=!1,x=typeof setTimeout=="function"?setTimeout:null,U=typeof clearTimeout=="function"?clearTimeout:null,F=typeof setImmediate<"u"?setImmediate:null;function C(q){for(var j=i(p);j!==null;){if(j.callback===null)s(p);else if(j.startTime<=q)s(p),j.sortIndex=j.expirationTime,e(m,j);else break;j=i(p)}}function D(q){if(N=!1,C(q),!A)if(i(m)!==null)A=!0,L||(L=!0,Q());else{var j=i(p);j!==null&&tt(D,j.startTime-q)}}var L=!1,I=-1,T=5,O=-1;function G(){return y?!0:!(o.unstable_now()-O<T)}function k(){if(y=!1,L){var q=o.unstable_now();O=q;var j=!0;try{t:{A=!1,N&&(N=!1,U(I),I=-1),M=!0;var dt=v;try{e:{for(C(q),_=i(m);_!==null&&!(_.expirationTime>q&&G());){var ut=_.callback;if(typeof ut=="function"){_.callback=null,v=_.priorityLevel;var rt=ut(_.expirationTime<=q);if(q=o.unstable_now(),typeof rt=="function"){_.callback=rt,C(q),j=!0;break e}_===i(m)&&s(m),C(q)}else s(m);_=i(m)}if(_!==null)j=!0;else{var Tt=i(p);Tt!==null&&tt(D,Tt.startTime-q),j=!1}}break t}finally{_=null,v=dt,M=!1}j=void 0}}finally{j?Q():L=!1}}}var Q;if(typeof F=="function")Q=function(){F(k)};else if(typeof MessageChannel<"u"){var st=new MessageChannel,Y=st.port2;st.port1.onmessage=k,Q=function(){Y.postMessage(null)}}else Q=function(){x(k,0)};function tt(q,j){I=x(function(){q(o.unstable_now())},j)}o.unstable_IdlePriority=5,o.unstable_ImmediatePriority=1,o.unstable_LowPriority=4,o.unstable_NormalPriority=3,o.unstable_Profiling=null,o.unstable_UserBlockingPriority=2,o.unstable_cancelCallback=function(q){q.callback=null},o.unstable_forceFrameRate=function(q){0>q||125<q?console.error("forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported"):T=0<q?Math.floor(1e3/q):5},o.unstable_getCurrentPriorityLevel=function(){return v},o.unstable_next=function(q){switch(v){case 1:case 2:case 3:var j=3;break;default:j=v}var dt=v;v=j;try{return q()}finally{v=dt}},o.unstable_requestPaint=function(){y=!0},o.unstable_runWithPriority=function(q,j){switch(q){case 1:case 2:case 3:case 4:case 5:break;default:q=3}var dt=v;v=q;try{return j()}finally{v=dt}},o.unstable_scheduleCallback=function(q,j,dt){var ut=o.unstable_now();switch(typeof dt=="object"&&dt!==null?(dt=dt.delay,dt=typeof dt=="number"&&0<dt?ut+dt:ut):dt=ut,q){case 1:var rt=-1;break;case 2:rt=250;break;case 5:rt=1073741823;break;case 4:rt=1e4;break;default:rt=5e3}return rt=dt+rt,q={id:S++,callback:j,priorityLevel:q,startTime:dt,expirationTime:rt,sortIndex:-1},dt>ut?(q.sortIndex=dt,e(p,q),i(m)===null&&q===i(p)&&(N?(U(I),I=-1):N=!0,tt(D,dt-ut))):(q.sortIndex=rt,e(m,q),A||M||(A=!0,L||(L=!0,Q()))),q},o.unstable_shouldYield=G,o.unstable_wrapCallback=function(q){var j=v;return function(){var dt=v;v=j;try{return q.apply(this,arguments)}finally{v=dt}}}})(Nd)),Nd}var Vv;function RE(){return Vv||(Vv=1,Cd.exports=AE()),Cd.exports}var Dd={exports:{}},Bn={};var kv;function wE(){if(kv)return Bn;kv=1;var o=sm();function e(S){var _="https://react.dev/errors/"+S;if(1<arguments.length){_+="?args[]="+encodeURIComponent(arguments[1]);for(var v=2;v<arguments.length;v++)_+="&args[]="+encodeURIComponent(arguments[v])}return"Minified React error #"+S+"; visit "+_+" for the full message or use the non-minified dev environment for full errors and additional helpful warnings."}function i(){}var s={d:{f:i,r:function(){throw Error(e(522))},D:i,C:i,L:i,m:i,X:i,S:i,M:i},p:0,findDOMNode:null},l=Symbol.for("react.portal"),f=Symbol.for("react.recoverable"),h=Symbol.for("react.optimistic_key");function d(S,_,v){var M=3<arguments.length&&arguments[3]!==void 0?arguments[3]:null;return{$$typeof:l,key:M==null?null:M===h?h:""+M,children:S,containerInfo:_,implementation:v}}var m=o.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;function p(S,_){if(S==="font")return"";if(typeof _=="string")return _==="use-credentials"?_:""}return Bn.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE=s,Bn.browser=function(S){return{$$typeof:f,_reason:S}},Bn.createPortal=function(S,_){var v=2<arguments.length&&arguments[2]!==void 0?arguments[2]:null;if(!_||_.nodeType!==1&&_.nodeType!==9&&_.nodeType!==11)throw Error(e(299));return d(S,_,null,v)},Bn.flushSync=function(S){var _=m.T,v=s.p;try{if(m.T=null,s.p=2,S)return S()}finally{m.T=_,s.p=v,s.d.f()}},Bn.preconnect=function(S,_){typeof S=="string"&&(_?(_=_.crossOrigin,_=typeof _=="string"?_==="use-credentials"?_:"":void 0):_=null,s.d.C(S,_))},Bn.prefetchDNS=function(S){typeof S=="string"&&s.d.D(S)},Bn.preinit=function(S,_){if(typeof S=="string"&&_&&typeof _.as=="string"){var v=_.as,M=p(v,_.crossOrigin),A=typeof _.integrity=="string"?_.integrity:void 0,N=typeof _.fetchPriority=="string"?_.fetchPriority:void 0;v==="style"?s.d.S(S,typeof _.precedence=="string"?_.precedence:void 0,{crossOrigin:M,integrity:A,fetchPriority:N}):v==="script"&&s.d.X(S,{crossOrigin:M,integrity:A,fetchPriority:N,nonce:typeof _.nonce=="string"?_.nonce:void 0})}},Bn.preinitModule=function(S,_){if(typeof S=="string")if(typeof _=="object"&&_!==null){if(_.as==null||_.as==="script"){var v=p(_.as,_.crossOrigin);s.d.M(S,{crossOrigin:v,integrity:typeof _.integrity=="string"?_.integrity:void 0,nonce:typeof _.nonce=="string"?_.nonce:void 0,fetchPriority:typeof _.fetchPriority=="string"?_.fetchPriority:void 0})}}else _==null&&s.d.M(S)},Bn.preload=function(S,_){if(typeof S=="string"&&typeof _=="object"&&_!==null&&typeof _.as=="string"){var v=_.as,M=p(v,_.crossOrigin);s.d.L(S,v,{crossOrigin:M,integrity:typeof _.integrity=="string"?_.integrity:void 0,nonce:typeof _.nonce=="string"?_.nonce:void 0,type:typeof _.type=="string"?_.type:void 0,fetchPriority:typeof _.fetchPriority=="string"?_.fetchPriority:void 0,referrerPolicy:typeof _.referrerPolicy=="string"?_.referrerPolicy:void 0,imageSrcSet:typeof _.imageSrcSet=="string"?_.imageSrcSet:void 0,imageSizes:typeof _.imageSizes=="string"?_.imageSizes:void 0,media:typeof _.media=="string"?_.media:void 0})}},Bn.preloadModule=function(S,_){if(typeof S=="string")if(_){var v=p(_.as,_.crossOrigin);s.d.m(S,{as:typeof _.as=="string"&&_.as!=="script"?_.as:void 0,crossOrigin:v,integrity:typeof _.integrity=="string"?_.integrity:void 0,nonce:typeof _.nonce=="string"?_.nonce:void 0,fetchPriority:typeof _.fetchPriority=="string"?_.fetchPriority:void 0})}else s.d.m(S)},Bn.requestFormReset=function(S){s.d.r(S)},Bn.unstable_batchedUpdates=function(S,_){return S(_)},Bn.useFormState=function(S,_,v){return m.H.useFormState(S,_,v)},Bn.useFormStatus=function(){return m.H.useHostTransitionStatus()},Bn.version="19.3.0",Bn}var Xv;function CE(){if(Xv)return Dd.exports;Xv=1;function o(){if(!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__>"u"||typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE!="function"))try{__REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(o)}catch(e){console.error(e)}}return o(),Dd.exports=wE(),Dd.exports}var Wv;function NE(){if(Wv)return _l;Wv=1;var o=RE(),e=sm(),i=CE();function s(t){var n="https://react.dev/errors/"+t;if(1<arguments.length){n+="?args[]="+encodeURIComponent(arguments[1]);for(var a=2;a<arguments.length;a++)n+="&args[]="+encodeURIComponent(arguments[a])}return"Minified React error #"+t+"; visit "+n+" for the full message or use the non-minified dev environment for full errors and additional helpful warnings."}function l(t){return!(!t||t.nodeType!==1&&t.nodeType!==9&&t.nodeType!==11)}function f(t){for(var n=t,a=n;a&&!a.alternate;)n=a,(n.flags&4098)!==0&&(t=n.return),a=n.return;for(;n.return;)n=n.return;return n.tag===3?t:null}function h(t){if(t.tag===13){var n=t.memoizedState;if(n===null&&(t=t.alternate,t!==null&&(n=t.memoizedState)),n!==null)return n.dehydrated}return null}function d(t){if(t.tag===31){var n=t.memoizedState;if(n===null&&(t=t.alternate,t!==null&&(n=t.memoizedState)),n!==null)return n.dehydrated}return null}function m(t){if(f(t)!==t)throw Error(s(188))}function p(t){var n=t.alternate;if(!n){if(n=f(t),n===null)throw Error(s(188));return n!==t?null:t}for(var a=t,r=n;;){var c=a.return;if(c===null)break;var u=c.alternate;if(u===null){if(r=c.return,r!==null){a=r;continue}break}if(c.child===u.child){for(u=c.child;u;){if(u===a)return m(c),t;if(u===r)return m(c),n;u=u.sibling}throw Error(s(188))}if(a.return!==r.return)a=c,r=u;else{for(var g=!1,w=c.child;w;){if(w===a){g=!0,a=c,r=u;break}if(w===r){g=!0,r=c,a=u;break}w=w.sibling}if(!g){for(w=u.child;w;){if(w===a){g=!0,a=u,r=c;break}if(w===r){g=!0,r=u,a=c;break}w=w.sibling}if(!g)throw Error(s(189))}}if(a.alternate!==r)throw Error(s(190))}if(a.tag!==3)throw Error(s(188));return a.stateNode.current===a?t:n}function S(t){var n=t.tag;if(n===5||n===26||n===27||n===6)return t;for(t=t.child;t!==null;){if(n=S(t),n!==null)return n;t=t.sibling}return null}function _(t,n,a,r,c,u){for(;t!==null;){if((t.tag===5||t.tag===27||t.tag===6)&&a(t,r,c,u)||(t.tag!==22||t.memoizedState===null)&&(n||t.tag!==5&&t.tag!==27)&&_(t.child,n,a,r,c,u))return!0;t=t.sibling}return!1}function v(t){for(t=t.return;t!==null;){if(t.tag===3||t.tag===5||t.tag===27)return t;t=t.return}return null}function M(t){var n=!1;for(t=t.return;t!==null&&(t.tag===4&&(n=!0),!(t.tag===3||t.tag===5||t.tag===27));)t=t.return;return n}function A(t){var n=[null,null],a=v(t);return a===null||N(n,t,a.child,{foundSelf:!1}),n}function N(t,n,a,r){for(;a!==null;){if(a===n)r.foundSelf=!0;else if(a.tag===5||a.tag===27||a.tag===6){if(r.foundSelf)return t[1]=a,!0;t[0]=a}else if((a.tag!==22||a.memoizedState===null)&&N(t,n,a.child,r))return!0;a=a.sibling}return!1}function y(t){switch(t.tag){case 5:case 27:case 6:return t.stateNode;case 3:return t.stateNode.containerInfo;default:throw Error(s(559))}}var x=null,U=null;function F(t,n,a){return t===a?!0:t===n?(x=t,!0):!1}function C(t,n,a){return t===a?(U=t,!1):t===n?(U!==null&&(x=t),!0):!1}function D(t){if(t===null)return null;do t=t===null?null:t.return;while(t&&t.tag!==5&&t.tag!==27&&t.tag!==3);return t||null}function L(t,n,a){for(var r=0,c=t;c;c=a(c))r++;c=0;for(var u=n;u;u=a(u))c++;for(;0<r-c;)t=a(t),r--;for(;0<c-r;)n=a(n),c--;for(;r--;){if(t===n||n!==null&&t===n.alternate)return t;t=a(t),n=a(n)}return null}var I=Object.assign,T=Symbol.for("react.element"),O=Symbol.for("react.transitional.element"),G=Symbol.for("react.portal"),k=Symbol.for("react.fragment"),Q=Symbol.for("react.strict_mode"),st=Symbol.for("react.profiler"),Y=Symbol.for("react.consumer"),tt=Symbol.for("react.context"),q=Symbol.for("react.forward_ref"),j=Symbol.for("react.suspense"),dt=Symbol.for("react.suspense_list"),ut=Symbol.for("react.memo"),rt=Symbol.for("react.lazy"),Tt=Symbol.for("react.activity"),Gt=Symbol.for("react.legacy_hidden"),Ot=Symbol.for("react.memo_cache_sentinel"),B=Symbol.for("react.view_transition"),_t=Symbol.for("react.recoverable"),Dt=Symbol.iterator;function Z(t){return t===null||typeof t!="object"?null:(t=Dt&&t[Dt]||t["@@iterator"],typeof t=="function"?t:null)}var ft=Symbol.for("react.client.reference");function Ct(t){if(t==null)return null;if(typeof t=="function")return t.$$typeof===ft?null:t.displayName||t.name||null;if(typeof t=="string")return t;switch(t){case k:return"Fragment";case st:return"Profiler";case Q:return"StrictMode";case j:return"Suspense";case dt:return"SuspenseList";case Tt:return"Activity";case B:return"ViewTransition"}if(typeof t=="object")switch(t.$$typeof){case G:return"Portal";case tt:return t.displayName||"Context";case Y:return(t._context.displayName||"Context")+".Consumer";case q:var n=t.render;return t=t.displayName,t||(t=n.displayName||n.name||"",t=t!==""?"ForwardRef("+t+")":"ForwardRef"),t;case ut:return n=t.displayName||null,n!==null?n:Ct(t.type)||"Memo";case rt:n=t._payload,t=t._init;try{return Ct(t(n))}catch{}}return null}var Pt=Array.isArray,vt=e.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE,Ut=i.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE,be={pending:!1,data:null,method:null,action:null},ue=[],pe=-1;function _e(t){return{current:t}}function ee(t){0>pe||(t.current=ue[pe],ue[pe]=null,pe--)}function ne(t,n){pe++,ue[pe]=t.current,t.current=n}var Be=_e(null),rn=_e(null),Pe=_e(null),$e=_e(null);function X(t,n){switch(ne(Pe,n),ne(rn,t),ne(Be,null),n.nodeType){case 9:case 11:t=(t=n.documentElement)&&(t=t.namespaceURI)?q_(t):0;break;default:if(t=n.tagName,n=n.namespaceURI)n=q_(n),t=Y_(n,t);else switch(t){case"svg":t=1;break;case"math":t=2;break;default:t=0}}ee(Be),ne(Be,t)}function Ke(){ee(Be),ee(rn),ee(Pe)}function Ee(t){var n=t.memoizedState;n!==null&&(jr._currentValue=n.memoizedState,ne($e,t)),n=Be.current;var a=Y_(n,t.type);n!==a&&(ne(rn,t),ne(Be,a))}function P(t){rn.current===t&&(ee(Be),ee(rn)),$e.current===t&&(ee($e),jr._currentValue=be)}var E,et;function at(t){if(E===void 0)try{throw Error()}catch(a){var n=a.stack.trim().match(/\n( *(at )?)/);E=n&&n[1]||"",et=-1<a.stack.indexOf(`
    at`)?" (<anonymous>)":-1<a.stack.indexOf("@")?"@unknown:0:0":""}return`
`+E+t+et}var gt=!1;function Nt(t,n){if(!t||gt)return"";gt=!0;var a=Error.prepareStackTrace;Error.prepareStackTrace=void 0;try{var r={DetermineComponentFrameRoot:function(){try{if(n){var Et=function(){throw Error()};if(Object.defineProperty(Et.prototype,"props",{set:function(){throw Error()}}),typeof Reflect=="object"&&Reflect.construct){try{Reflect.construct(Et,[])}catch(Ht){var K=Ht}Reflect.construct(t,[],Et)}else{try{Et.call()}catch(Ht){K=Ht}Et=!1;try{var ct=Object.getOwnPropertyDescriptor(t.prototype,"props");Object.defineProperty(t.prototype,"props",{configurable:!0,set:function(){throw Error()}}),Et=!0,new t}finally{Et&&(ct!==void 0?Object.defineProperty(t.prototype,"props",ct):delete t.prototype.props)}}}else{try{throw Error()}catch(Ht){K=Ht}(Et=t())&&typeof Et.catch=="function"&&Et.catch(function(){})}}catch(Ht){if(Ht&&K&&typeof Ht.stack=="string")return[Ht.stack,K.stack]}return[null,null]}};r.DetermineComponentFrameRoot.displayName="DetermineComponentFrameRoot";var c=Object.getOwnPropertyDescriptor(r.DetermineComponentFrameRoot,"name");c&&c.configurable&&Object.defineProperty(r.DetermineComponentFrameRoot,"name",{value:"DetermineComponentFrameRoot"});var u=r.DetermineComponentFrameRoot(),g=u[0],w=u[1];if(g&&w){var z=g.split(`
`),$=w.split(`
`);for(c=r=0;r<z.length&&!z[r].includes("DetermineComponentFrameRoot");)r++;for(;c<$.length&&!$[c].includes("DetermineComponentFrameRoot");)c++;if(r===z.length||c===$.length)for(r=z.length-1,c=$.length-1;1<=r&&0<=c&&z[r]!==$[c];)c--;for(;1<=r&&0<=c;r--,c--)if(z[r]!==$[c]){if(r!==1||c!==1)do if(r--,c--,0>c||z[r]!==$[c]){var ht=`
`+z[r].replace(" at new "," at ");return t.displayName&&ht.includes("<anonymous>")&&(ht=ht.replace("<anonymous>",t.displayName)),ht}while(1<=r&&0<=c);break}}}finally{gt=!1,Error.prepareStackTrace=a}return(a=t?t.displayName||t.name:"")?at(a):""}function It(t,n){switch(t.tag){case 26:case 27:case 5:return at(t.type);case 16:return at("Lazy");case 13:return t.child!==n&&n!==null?at("Suspense Fallback"):at("Suspense");case 19:return at("SuspenseList");case 0:case 15:return Nt(t.type,!1);case 11:return Nt(t.type.render,!1);case 1:return Nt(t.type,!0);case 31:return at("Activity");case 30:return at("ViewTransition");default:return""}}function xt(t){try{var n="",a=null;do n+=It(t,a),a=t,t=t.return;while(t);return n}catch(r){return`
Error generating stack: `+r.message+`
`+r.stack}}var St=Object.prototype.hasOwnProperty,mt=o.unstable_scheduleCallback,wt=o.unstable_cancelCallback,yt=o.unstable_shouldYield,At=o.unstable_requestPaint,Lt=o.unstable_now,Qt=o.unstable_getCurrentPriorityLevel,ae=o.unstable_ImmediatePriority,W=o.unstable_UserBlockingPriority,zt=o.unstable_NormalPriority,bt=o.unstable_LowPriority,Bt=o.unstable_IdlePriority,qt=o.log,Rt=o.unstable_setDisableYieldValue,te=null,Wt=null;function Ue(t){if(typeof qt=="function"&&Rt(t),Wt&&typeof Wt.setStrictMode=="function")try{Wt.setStrictMode(te,t)}catch{}}var fe=Math.clz32?Math.clz32:tf,oi=Math.log,Ei=Math.LN2;function tf(t){return t>>>=0,t===0?32:31-(oi(t)/Ei|0)|0}var ur=256,Ns=262144,Ya=4194304;function ya(t){var n=t&42;if(n!==0)return n;switch(t&-t){case 1:return 1;case 2:return 2;case 4:return 4;case 8:return 8;case 16:return 16;case 32:return 32;case 64:return 64;case 128:return 128;case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:return t&-t;case 262144:case 524288:case 1048576:case 2097152:return t&3932160;case 4194304:case 8388608:case 16777216:case 33554432:return t&62914560;case 67108864:return 67108864;case 134217728:return 134217728;case 268435456:return 268435456;case 536870912:return 536870912;case 1073741824:return 0;default:return t}}function Ds(t,n,a){var r=t.pendingLanes;if(r===0)return 0;var c=0,u=t.suspendedLanes,g=t.pingedLanes;t=t.warmLanes;var w=r&134217727;return w!==0?(r=w&~u,r!==0?c=ya(r):(g&=w,g!==0?c=ya(g):a||(a=w&~t,a!==0&&(c=ya(a))))):(w=r&~u,w!==0?c=ya(w):g!==0?c=ya(g):a||(a=r&~t,a!==0&&(c=ya(a)))),c===0?0:n!==0&&n!==c&&(n&u)===0&&(u=c&-c,a=n&-n,u>=a||u===32&&(a&4194048)!==0)?n:c}function ja(t,n){return(t.pendingLanes&~(t.suspendedLanes&~t.pingedLanes)&n)===0}function Qi(t,n){(n&8)!==0&&(n|=n&32);var a=t.entangledLanes;if(a!==0)for(t=t.entanglements,a&=n;0<a;){var r=31-fe(a),c=1<<r;n|=t[r],a&=~c}return n}function Mo(t,n){switch(t){case 1:case 2:case 4:case 8:case 64:return n+250;case 16:case 32:case 128:case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:return n+5e3;case 4194304:case 8388608:case 16777216:case 33554432:return-1;case 67108864:case 134217728:case 268435456:case 536870912:case 1073741824:return-1;default:return-1}}function Eo(){var t=Ya;return Ya<<=1,(Ya&62914560)===0&&(Ya=4194304),t}function fr(t){for(var n=[],a=0;31>a;a++)n.push(t);return n}function Ji(t,n){t.pendingLanes|=n,n!==268435456&&(t.suspendedLanes=0,t.pingedLanes=0,t.warmLanes=0)}function Fl(t,n,a,r,c,u){var g=t.pendingLanes;t.pendingLanes=a,t.suspendedLanes=0,t.pingedLanes=0,t.warmLanes=0,t.expiredLanes&=a,t.entangledLanes&=a,t.errorRecoveryDisabledLanes&=a,t.shellSuspendCounter=0;var w=t.entanglements,z=t.expirationTimes,$=t.hiddenUpdates;for(a=g&~a;0<a;){var ht=31-fe(a),Et=1<<ht;w[ht]=0,z[ht]=-1;var K=$[ht];if(K!==null)for($[ht]=null,ht=0;ht<K.length;ht++){var ct=K[ht];ct!==null&&(ct.lane&=-536870913)}a&=~Et}r!==0&&Us(t,r,0),u!==0&&c===0&&t.tag!==0&&(t.suspendedLanes|=u&~(g&~n))}function Us(t,n,a){t.pendingLanes|=n,t.suspendedLanes&=~n;var r=31-fe(n);t.entangledLanes|=n,t.entanglements[r]=t.entanglements[r]|1073741824|a&261930}function bo(t,n){var a=t.entangledLanes|=n;for(t=t.entanglements;a;){var r=31-fe(a),c=1<<r;c&n|t[r]&n&&(t[r]|=n),a&=~c}}function To(t,n){var a=n&-n;return a=(a&42)!==0?1:Ao(a),(a&(t.suspendedLanes|n))!==0?0:a}function Ao(t){switch(t){case 2:t=1;break;case 8:t=4;break;case 32:t=16;break;case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:case 4194304:case 8388608:case 16777216:case 33554432:t=128;break;case 268435456:t=134217728;break;default:t=0}return t}function Ro(t){return t&=-t,2<t?8<t?(t&134217727)!==0?32:268435456:8:2}function Hl(){var t=Ut.p;return t!==0?t:(t=window.event,t===void 0?32:Nv(t.type))}function Gl(t,n){var a=Ut.p;try{return Ut.p=t,n()}finally{Ut.p=a}}var bi=Math.random().toString(36).slice(2),R="__reactFiber$"+bi,H="__reactProps$"+bi,pt="__reactContainer$"+bi,ot="__reactEvents$"+bi,lt="__reactListeners$"+bi,Vt="__reactHandles$"+bi,Yt="__reactResources$"+bi,Ft="__reactMarker$"+bi,Kt="__reactLoad$"+bi;function Jt(t){delete t[R],delete t[H],delete t[lt],delete t[Vt]}function re(t){var n;if(n=t[R])return n;for(var a=t.parentNode;a;){if(n=a[pt]||a[R]){if(a=n.alternate,n.child!==null||a!==null&&a.child!==null)for(t=uv(t);t!==null;){if(a=t[R])return a;t=uv(t)}return n}t=a,a=t.parentNode}return null}function he(t){if(t=t[R]||t[pt]){var n=t.tag;if(n===5||n===6||n===13||n===31||n===26||n===27||n===3)return t}return null}function jt(t){var n=t.tag;if(n===5||n===26||n===27||n===6)return t.stateNode;throw Error(s(33))}function Te(t){var n=t[Yt];return n||(n=t[Yt]={hoistableStyles:new Map,hoistableScripts:new Map}),n}function xe(t){t[Ft]=!0}function Qe(t){t[Kt]=void 0}var ke=new Set,En={};function kt(t,n){fn(t,n),fn(t+"Capture",n)}function fn(t,n){for(En[t]=n,t=0;t<n.length;t++)ke.add(n[t])}var Le=RegExp("^[:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD][:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD\\-.0-9\\u00B7\\u0300-\\u036F\\u203F-\\u2040]*$"),Xn={},li={};function $i(t){return St.call(li,t)?!0:St.call(Xn,t)?!1:Le.test(t)?li[t]=!0:(Xn[t]=!0,!1)}var Se=!1;function He(){var t=Se;return Se=!1,t}function en(t,n,a){if($i(n))if(a===null)t.removeAttribute(n);else{switch(typeof a){case"undefined":case"function":case"symbol":t.removeAttribute(n);return;case"boolean":var r=n.toLowerCase().slice(0,5);if(r!=="data-"&&r!=="aria-"){t.removeAttribute(n);return}}t.setAttribute(n,a)}}function ci(t,n,a){if(a===null)t.removeAttribute(n);else{switch(typeof a){case"undefined":case"function":case"symbol":case"boolean":t.removeAttribute(n);return}t.setAttribute(n,a)}}function Ce(t,n,a,r){if(r===null)t.removeAttribute(a);else{switch(typeof r){case"undefined":case"function":case"symbol":case"boolean":t.removeAttribute(a);return}t.setAttributeNS(n,a,r)}}function hn(t){switch(typeof t){case"bigint":case"boolean":case"number":case"string":case"undefined":return t;case"object":return t;default:return""}}function Ma(t){var n=t.type;return(t=t.nodeName)&&t.toLowerCase()==="input"&&(n==="checkbox"||n==="radio")}function Vl(t,n,a){var r=Object.getOwnPropertyDescriptor(t.constructor.prototype,n);if(!t.hasOwnProperty(n)&&typeof r<"u"&&typeof r.get=="function"&&typeof r.set=="function"){var c=r.get,u=r.set;return Object.defineProperty(t,n,{configurable:!0,get:function(){return c.call(this)},set:function(g){a=""+g,u.call(this,g)}}),Object.defineProperty(t,n,{enumerable:r.enumerable}),{getValue:function(){return a},setValue:function(g){a=""+g},stopTracking:function(){t._valueTracker=null,delete t[n]}}}}function ef(t){if(!t._valueTracker){var n=Ma(t)?"checked":"value";t._valueTracker=Vl(t,n,""+t[n])}}function Om(t){if(!t)return!1;var n=t._valueTracker;if(!n)return!0;var a=n.getValue(),r="";return t&&(r=Ma(t)?t.checked?"true":"false":t.value),t=r,t!==a?(n.setValue(t),!0):!1}var XS=/[\n"\\]/g;function Ti(t){return t.replace(XS,function(n){return"\\"+n.charCodeAt(0).toString(16)+" "})}function nf(t,n,a,r,c,u,g,w){t.name="",g!=null&&typeof g!="function"&&typeof g!="symbol"&&typeof g!="boolean"?t.type=g:t.removeAttribute("type"),n!=null?g==="number"?(n===0&&t.value===""||t.value!=n)&&(t.value=""+hn(n)):t.value!==""+hn(n)&&(t.value=""+hn(n)):g!=="submit"&&g!=="reset"||t.removeAttribute("value"),n!=null?g==="number"&&t.value==n?af(t,hn(t.value)):af(t,hn(n)):a!=null?af(t,hn(a)):r!=null&&t.removeAttribute("value"),c==null&&u!=null&&(t.defaultChecked=!!u),c!=null&&(t.checked=c&&typeof c!="function"&&typeof c!="symbol"),w!=null&&typeof w!="function"&&typeof w!="symbol"&&typeof w!="boolean"?t.name=""+hn(w):t.removeAttribute("name")}function Pm(t,n,a,r,c,u,g,w){if(u!=null&&typeof u!="function"&&typeof u!="symbol"&&typeof u!="boolean"&&(t.type=u),n!=null||a!=null){if(!(u!=="submit"&&u!=="reset"||n!=null)){ef(t);return}a=a!=null?""+hn(a):"",n=n!=null?""+hn(n):a,w||n===t.value||(t.value=n),t.defaultValue=n}r=r??c,r=typeof r!="function"&&typeof r!="symbol"&&!!r,t.checked=w?t.checked:!!r,t.defaultChecked=!!r,g!=null&&typeof g!="function"&&typeof g!="symbol"&&typeof g!="boolean"&&(t.name=g),ef(t)}function af(t,n){t.defaultValue!==""+n&&(t.defaultValue=""+n)}function hr(t,n,a,r){if(t=t.options,n){n={};for(var c=0;c<a.length;c++)n["$"+a[c]]=!0;for(a=0;a<t.length;a++)c=n.hasOwnProperty("$"+t[a].value),t[a].selected!==c&&(t[a].selected=c),c&&r&&(t[a].defaultSelected=!0)}else{for(a=""+hn(a),n=null,c=0;c<t.length;c++){if(t[c].value===a){t[c].selected=!0,r&&(t[c].defaultSelected=!0);return}n!==null||t[c].disabled||(n=t[c])}n!==null&&(n.selected=!0)}}function Im(t,n,a){if(n!=null&&(n=""+hn(n),n!==t.value&&(t.value=n),a==null)){t.defaultValue!==n&&(t.defaultValue=n);return}t.defaultValue=a!=null?""+hn(a):""}function zm(t,n,a,r){if(n==null){if(r!=null){if(a!=null)throw Error(s(92));if(Pt(r)){if(1<r.length)throw Error(s(93));r=r[0]}a=r}a==null&&(a=""),n=a}a=hn(n),t.defaultValue=a,r=t.textContent,r===a&&r!==""&&r!==null&&(t.value=r),ef(t)}function dr(t,n){if(n){var a=t.firstChild;if(a&&a===t.lastChild&&a.nodeType===3){a.nodeValue=n;return}}t.textContent=n}var WS=new Set("animationIterationCount aspectRatio borderImageOutset borderImageSlice borderImageWidth boxFlex boxFlexGroup boxOrdinalGroup columnCount columns flex flexGrow flexPositive flexShrink flexNegative flexOrder gridArea gridRow gridRowEnd gridRowSpan gridRowStart gridColumn gridColumnEnd gridColumnSpan gridColumnStart fontWeight lineClamp lineHeight opacity order orphans scale tabSize widows zIndex zoom fillOpacity floodOpacity stopOpacity strokeDasharray strokeDashoffset strokeMiterlimit strokeOpacity strokeWidth MozAnimationIterationCount MozBoxFlex MozBoxFlexGroup MozLineClamp msAnimationIterationCount msFlex msZoom msFlexGrow msFlexNegative msFlexOrder msFlexPositive msFlexShrink msGridColumn msGridColumnSpan msGridRow msGridRowSpan WebkitAnimationIterationCount WebkitBoxFlex WebKitBoxFlexGroup WebkitBoxOrdinalGroup WebkitColumnCount WebkitColumns WebkitFlex WebkitFlexGrow WebkitFlexPositive WebkitFlexShrink WebkitLineClamp".split(" "));function Bm(t,n,a){var r=n.indexOf("--")===0;a==null||typeof a=="boolean"||a===""?r?t.setProperty(n,""):n==="float"?t.cssFloat="":t[n]="":r?t.setProperty(n,a):typeof a!="number"||a===0||WS.has(n)?n==="float"?t.cssFloat=a:t[n]=(""+a).trim():t[n]=a+"px"}function Fm(t,n,a){if(n!=null&&typeof n!="object")throw Error(s(62));if(t=t.style,a!=null){for(var r in a)!a.hasOwnProperty(r)||n!=null&&n.hasOwnProperty(r)||(r.indexOf("--")===0?t.setProperty(r,""):r==="float"?t.cssFloat="":t[r]="",Se=!0);for(var c in n)r=n[c],n.hasOwnProperty(c)&&a[c]!==r&&(Bm(t,c,r),Se=!0)}else for(var u in n)n.hasOwnProperty(u)&&Bm(t,u,n[u])}function sf(t){if(t.indexOf("-")===-1)return!1;switch(t){case"annotation-xml":case"color-profile":case"font-face":case"font-face-src":case"font-face-uri":case"font-face-format":case"font-face-name":case"missing-glyph":return!1;default:return!0}}var qS=new Map([["acceptCharset","accept-charset"],["htmlFor","for"],["httpEquiv","http-equiv"],["crossOrigin","crossorigin"],["accentHeight","accent-height"],["alignmentBaseline","alignment-baseline"],["arabicForm","arabic-form"],["baselineShift","baseline-shift"],["capHeight","cap-height"],["clipPath","clip-path"],["clipRule","clip-rule"],["colorInterpolation","color-interpolation"],["colorInterpolationFilters","color-interpolation-filters"],["colorProfile","color-profile"],["colorRendering","color-rendering"],["dominantBaseline","dominant-baseline"],["enableBackground","enable-background"],["fillOpacity","fill-opacity"],["fillRule","fill-rule"],["floodColor","flood-color"],["floodOpacity","flood-opacity"],["fontFamily","font-family"],["fontSize","font-size"],["fontSizeAdjust","font-size-adjust"],["fontStretch","font-stretch"],["fontStyle","font-style"],["fontVariant","font-variant"],["fontWeight","font-weight"],["glyphName","glyph-name"],["glyphOrientationHorizontal","glyph-orientation-horizontal"],["glyphOrientationVertical","glyph-orientation-vertical"],["horizAdvX","horiz-adv-x"],["horizOriginX","horiz-origin-x"],["imageRendering","image-rendering"],["letterSpacing","letter-spacing"],["lightingColor","lighting-color"],["markerEnd","marker-end"],["markerMid","marker-mid"],["markerStart","marker-start"],["maskType","mask-type"],["overlinePosition","overline-position"],["overlineThickness","overline-thickness"],["paintOrder","paint-order"],["panose-1","panose-1"],["pointerEvents","pointer-events"],["renderingIntent","rendering-intent"],["shapeRendering","shape-rendering"],["stopColor","stop-color"],["stopOpacity","stop-opacity"],["strikethroughPosition","strikethrough-position"],["strikethroughThickness","strikethrough-thickness"],["strokeDasharray","stroke-dasharray"],["strokeDashoffset","stroke-dashoffset"],["strokeLinecap","stroke-linecap"],["strokeLinejoin","stroke-linejoin"],["strokeMiterlimit","stroke-miterlimit"],["strokeOpacity","stroke-opacity"],["strokeWidth","stroke-width"],["textAnchor","text-anchor"],["textDecoration","text-decoration"],["textRendering","text-rendering"],["transformOrigin","transform-origin"],["underlinePosition","underline-position"],["underlineThickness","underline-thickness"],["unicodeBidi","unicode-bidi"],["unicodeRange","unicode-range"],["unitsPerEm","units-per-em"],["vAlphabetic","v-alphabetic"],["vHanging","v-hanging"],["vIdeographic","v-ideographic"],["vMathematical","v-mathematical"],["vectorEffect","vector-effect"],["vertAdvY","vert-adv-y"],["vertOriginX","vert-origin-x"],["vertOriginY","vert-origin-y"],["wordSpacing","word-spacing"],["writingMode","writing-mode"],["xmlnsXlink","xmlns:xlink"],["xHeight","x-height"]]),YS=/^[\u0000-\u001F ]*j[\r\n\t]*a[\r\n\t]*v[\r\n\t]*a[\r\n\t]*s[\r\n\t]*c[\r\n\t]*r[\r\n\t]*i[\r\n\t]*p[\r\n\t]*t[\r\n\t]*:/i;function kl(t){return YS.test(""+t)?"javascript:throw new Error('React has blocked a javascript: URL as a security precaution.')":t}function ta(){}var rf=null;function of(t){return t=t.target||t.srcElement||window,t.correspondingUseElement&&(t=t.correspondingUseElement),t.nodeType===3?t.parentNode:t}var pr=null,mr=null;function Hm(t){var n=he(t);if(n&&(t=n.stateNode)){var a=t[H]||null;t:switch(t=n.stateNode,n.type){case"input":if(nf(t,a.value,a.defaultValue,a.defaultValue,a.checked,a.defaultChecked,a.type,a.name),n=a.name,a.type==="radio"&&n!=null){for(a=t;a.parentNode;)a=a.parentNode;for(a=a.querySelectorAll('input[name="'+Ti(""+n)+'"][type="radio"]'),n=0;n<a.length;n++){var r=a[n];if(r!==t&&r.form===t.form){var c=r[H]||null;if(!c)throw Error(s(90));nf(r,c.value,c.defaultValue,c.defaultValue,c.checked,c.defaultChecked,c.type,c.name)}}for(n=0;n<a.length;n++)r=a[n],r.form===t.form&&Om(r)}break t;case"textarea":Im(t,a.value,a.defaultValue);break t;case"select":n=a.value,n!=null&&hr(t,!!a.multiple,n,!1)}}}var lf=!1;function Gm(t,n,a){if(lf)return t(n,a);lf=!0;try{var r=t(n);return r}finally{if(lf=!1,(pr!==null||mr!==null)&&(kc(),pr&&(n=pr,t=mr,mr=pr=null,Hm(n),t)))for(n=0;n<t.length;n++)Hm(t[n])}}function wo(t,n){var a=t.stateNode;if(a===null)return null;var r=a[H]||null;if(r===null)return null;a=r[n];t:switch(n){case"onClick":case"onClickCapture":case"onDoubleClick":case"onDoubleClickCapture":case"onMouseDown":case"onMouseDownCapture":case"onMouseMove":case"onMouseMoveCapture":case"onMouseUp":case"onMouseUpCapture":case"onMouseEnter":(r=!r.disabled)||(t=t.type,r=!(t==="button"||t==="input"||t==="select"||t==="textarea")),t=!r;break t;default:t=!1}if(t)return null;if(a&&typeof a!="function")throw Error(s(231,n,typeof a));return a}var Ea=!(typeof window>"u"||typeof window.document>"u"||typeof window.document.createElement>"u"),cf=!1;if(Ea)try{var Co={};Object.defineProperty(Co,"passive",{get:function(){cf=!0}}),window.addEventListener("test",Co,Co),window.removeEventListener("test",Co,Co)}catch{cf=!1}var Za=null,uf=null,Xl=null;function Vm(){if(Xl)return Xl;var t,n=uf,a=n.length,r,c="value"in Za?Za.value:Za.textContent,u=c.length;for(t=0;t<a&&n[t]===c[t];t++);var g=a-t;for(r=1;r<=g&&n[a-r]===c[u-r];r++);return Xl=c.slice(t,1<r?1-r:void 0)}function Wl(t){var n=t.keyCode;return"charCode"in t?(t=t.charCode,t===0&&n===13&&(t=13)):t=n,t===10&&(t=13),32<=t||t===13?t:0}function ql(){return!0}function km(){return!1}function Wn(t){function n(a,r,c,u,g){this._reactName=a,this._targetInst=c,this.type=r,this.nativeEvent=u,this.target=g,this.currentTarget=null;for(var w in t)t.hasOwnProperty(w)&&(a=t[w],this[w]=a?a(u):u[w]);return this.isDefaultPrevented=(u.defaultPrevented!=null?u.defaultPrevented:u.returnValue===!1)?ql:km,this.isPropagationStopped=km,this}return I(n.prototype,{preventDefault:function(){this.defaultPrevented=!0;var a=this.nativeEvent;a&&(a.preventDefault?a.preventDefault():typeof a.returnValue!="unknown"&&(a.returnValue=!1),this.isDefaultPrevented=ql)},stopPropagation:function(){var a=this.nativeEvent;a&&(a.stopPropagation?a.stopPropagation():typeof a.cancelBubble!="unknown"&&(a.cancelBubble=!0),this.isPropagationStopped=ql)},persist:function(){},isPersistent:ql}),n}var Ka={eventPhase:0,bubbles:0,cancelable:0,timeStamp:function(t){return t.timeStamp||Date.now()},defaultPrevented:0,isTrusted:0},Yl=Wn(Ka),No=I({},Ka,{view:0,detail:0}),jS=Wn(No),ff,hf,Do,jl=I({},No,{screenX:0,screenY:0,clientX:0,clientY:0,pageX:0,pageY:0,ctrlKey:0,shiftKey:0,altKey:0,metaKey:0,getModifierState:pf,button:0,buttons:0,relatedTarget:function(t){return t.relatedTarget===void 0?t.fromElement===t.srcElement?t.toElement:t.fromElement:t.relatedTarget},movementX:function(t){return"movementX"in t?t.movementX:(t!==Do&&(Do&&t.type==="mousemove"?(ff=t.screenX-Do.screenX,hf=t.screenY-Do.screenY):hf=ff=0,Do=t),ff)},movementY:function(t){return"movementY"in t?t.movementY:hf}}),Xm=Wn(jl),ZS=I({},jl,{dataTransfer:0}),KS=Wn(ZS),QS=I({},No,{relatedTarget:0}),df=Wn(QS),JS=I({},Ka,{animationName:0,elapsedTime:0,pseudoElement:0}),$S=Wn(JS),ty=I({},Ka,{clipboardData:function(t){return"clipboardData"in t?t.clipboardData:window.clipboardData}}),ey=Wn(ty),ny=I({},Ka,{data:0}),Wm=Wn(ny),iy={Esc:"Escape",Spacebar:" ",Left:"ArrowLeft",Up:"ArrowUp",Right:"ArrowRight",Down:"ArrowDown",Del:"Delete",Win:"OS",Menu:"ContextMenu",Apps:"ContextMenu",Scroll:"ScrollLock",MozPrintableKey:"Unidentified"},ay={8:"Backspace",9:"Tab",12:"Clear",13:"Enter",16:"Shift",17:"Control",18:"Alt",19:"Pause",20:"CapsLock",27:"Escape",32:" ",33:"PageUp",34:"PageDown",35:"End",36:"Home",37:"ArrowLeft",38:"ArrowUp",39:"ArrowRight",40:"ArrowDown",45:"Insert",46:"Delete",112:"F1",113:"F2",114:"F3",115:"F4",116:"F5",117:"F6",118:"F7",119:"F8",120:"F9",121:"F10",122:"F11",123:"F12",144:"NumLock",145:"ScrollLock",224:"Meta"},sy={Alt:"altKey",Control:"ctrlKey",Meta:"metaKey",Shift:"shiftKey"};function ry(t){var n=this.nativeEvent;return n.getModifierState?n.getModifierState(t):(t=sy[t])?!!n[t]:!1}function pf(){return ry}var oy=I({},No,{key:function(t){if(t.key){var n=iy[t.key]||t.key;if(n!=="Unidentified")return n}return t.type==="keypress"?(t=Wl(t),t===13?"Enter":String.fromCharCode(t)):t.type==="keydown"||t.type==="keyup"?ay[t.keyCode]||"Unidentified":""},code:0,location:0,ctrlKey:0,shiftKey:0,altKey:0,metaKey:0,repeat:0,locale:0,getModifierState:pf,charCode:function(t){return t.type==="keypress"?Wl(t):0},keyCode:function(t){return t.type==="keydown"||t.type==="keyup"?t.keyCode:0},which:function(t){return t.type==="keypress"?Wl(t):t.type==="keydown"||t.type==="keyup"?t.keyCode:0}}),ly=Wn(oy),cy=I({},jl,{pointerId:0,width:0,height:0,pressure:0,tangentialPressure:0,tiltX:0,tiltY:0,twist:0,pointerType:0,isPrimary:0}),qm=Wn(cy),uy=I({},Ka,{submitter:0}),fy=Wn(uy),hy=I({},No,{touches:0,targetTouches:0,changedTouches:0,altKey:0,metaKey:0,ctrlKey:0,shiftKey:0,getModifierState:pf}),dy=Wn(hy),py=I({},Ka,{propertyName:0,elapsedTime:0,pseudoElement:0}),my=Wn(py),gy=I({},jl,{deltaX:function(t){return"deltaX"in t?t.deltaX:"wheelDeltaX"in t?-t.wheelDeltaX:0},deltaY:function(t){return"deltaY"in t?t.deltaY:"wheelDeltaY"in t?-t.wheelDeltaY:"wheelDelta"in t?-t.wheelDelta:0},deltaZ:0,deltaMode:0}),_y=Wn(gy),vy=I({},Ka,{newState:0,oldState:0,source:0}),xy=Wn(vy),Sy=[9,13,27,32],mf=Ea&&"CompositionEvent"in window,Uo=null;Ea&&"documentMode"in document&&(Uo=document.documentMode);var yy=Ea&&"TextEvent"in window&&!Uo,Ym=Ea&&(!mf||Uo&&8<Uo&&11>=Uo),jm=" ",Zm=!1;function Km(t,n){switch(t){case"keyup":return Sy.indexOf(n.keyCode)!==-1;case"keydown":return n.keyCode!==229;case"keypress":case"mousedown":case"focusout":return!0;default:return!1}}function Qm(t){return t=t.detail,typeof t=="object"&&"data"in t?t.data:null}var gr=!1;function My(t,n){switch(t){case"compositionend":return Qm(n);case"keypress":return n.which!==32?null:(Zm=!0,jm);case"textInput":return t=n.data,t===jm&&Zm?null:t;default:return null}}function Ey(t,n){if(gr)return t==="compositionend"||!mf&&Km(t,n)?(t=Vm(),Xl=uf=Za=null,gr=!1,t):null;switch(t){case"paste":return null;case"keypress":if(!(n.ctrlKey||n.altKey||n.metaKey)||n.ctrlKey&&n.altKey){if(n.char&&1<n.char.length)return n.char;if(n.which)return String.fromCharCode(n.which)}return null;case"compositionend":return Ym&&n.locale!=="ko"?null:n.data;default:return null}}var by={color:!0,date:!0,datetime:!0,"datetime-local":!0,email:!0,month:!0,number:!0,password:!0,range:!0,search:!0,tel:!0,text:!0,time:!0,url:!0,week:!0};function Jm(t){var n=t&&t.nodeName&&t.nodeName.toLowerCase();return n==="input"?!!by[t.type]:n==="textarea"}function $m(t,n,a,r){pr?mr?mr.push(r):mr=[r]:pr=r,n=Zc(n,"onChange"),0<n.length&&(a=new Yl("onChange","change",null,a,r),t.push({event:a,listeners:n}))}var Lo=null,Oo=null;function Ty(t){H_(t,0)}function Zl(t){var n=jt(t);if(Om(n))return t}function t0(t,n){if(t==="change")return n}var e0=!1;if(Ea){var gf;if(Ea){var _f="oninput"in document;if(!_f){var n0=document.createElement("div");n0.setAttribute("oninput","return;"),_f=typeof n0.oninput=="function"}gf=_f}else gf=!1;e0=gf&&(!document.documentMode||9<document.documentMode)}function i0(){Lo&&(Lo.detachEvent("onpropertychange",a0),Oo=Lo=null)}function a0(t){if(t.propertyName==="value"&&Zl(Oo)){var n=[];$m(n,Oo,t,of(t)),Gm(Ty,n)}}function Ay(t,n,a){t==="focusin"?(i0(),Lo=n,Oo=a,Lo.attachEvent("onpropertychange",a0)):t==="focusout"&&i0()}function Ry(t){if(t==="selectionchange"||t==="keyup"||t==="keydown")return Zl(Oo)}function wy(t,n){if(t==="click")return Zl(n)}function Cy(t,n){if(t==="input"||t==="change")return Zl(n)}function Ny(t,n){return t===n&&(t!==0||1/t===1/n)||t!==t&&n!==n}var ui=typeof Object.is=="function"?Object.is:Ny;function Po(t,n){if(ui(t,n))return!0;if(typeof t!="object"||t===null||typeof n!="object"||n===null)return!1;var a=Object.keys(t),r=Object.keys(n);if(a.length!==r.length)return!1;for(r=0;r<a.length;r++){var c=a[r];if(!St.call(n,c)||!ui(t[c],n[c]))return!1}return!0}function vf(t){if(t=t||(typeof document<"u"?document:void 0),typeof t>"u")return null;try{return t.activeElement||t.body}catch{return t.body}}function s0(t){for(;t&&t.firstChild;)t=t.firstChild;return t}function r0(t,n){var a=s0(t);t=0;for(var r;a;){if(a.nodeType===3){if(r=t+a.textContent.length,t<=n&&r>=n)return{node:a,offset:n-t};t=r}t:{for(;a;){if(a.nextSibling){a=a.nextSibling;break t}a=a.parentNode}a=void 0}a=s0(a)}}function o0(t,n){return t&&n?t===n?!0:t&&t.nodeType===3?!1:n&&n.nodeType===3?o0(t,n.parentNode):"contains"in t?t.contains(n):t.compareDocumentPosition?!!(t.compareDocumentPosition(n)&16):!1:!1}function l0(t){t=t!=null&&t.ownerDocument!=null&&t.ownerDocument.defaultView!=null?t.ownerDocument.defaultView:window;for(var n=vf(t.document);n instanceof t.HTMLIFrameElement;){try{var a=typeof n.contentWindow.location.href=="string"}catch{a=!1}if(a)t=n.contentWindow;else break;n=vf(t.document)}return n}function xf(t){var n=t&&t.nodeName&&t.nodeName.toLowerCase();return n&&(n==="input"&&(t.type==="text"||t.type==="search"||t.type==="tel"||t.type==="url"||t.type==="password")||n==="textarea"||t.contentEditable==="true")}var Dy=Ea&&"documentMode"in document&&11>=document.documentMode,_r=null,Sf=null,Io=null,yf=!1;function c0(t,n,a){var r=a.window===a?a.document:a.nodeType===9?a:a.ownerDocument;yf||_r==null||_r!==vf(r)||(r=_r,"selectionStart"in r&&xf(r)?r={start:r.selectionStart,end:r.selectionEnd}:(r=(r.ownerDocument&&r.ownerDocument.defaultView||window).getSelection(),r={anchorNode:r.anchorNode,anchorOffset:r.anchorOffset,focusNode:r.focusNode,focusOffset:r.focusOffset}),Io&&Po(Io,r)||(Io=r,r=Zc(Sf,"onSelect"),0<r.length&&(n=new Yl("onSelect","select",null,n,a),t.push({event:n,listeners:r}),n.target=_r)))}function Ls(t,n){var a={};return a[t.toLowerCase()]=n.toLowerCase(),a["Webkit"+t]="webkit"+n,a["Moz"+t]="moz"+n,a}var vr={animationend:Ls("Animation","AnimationEnd"),animationiteration:Ls("Animation","AnimationIteration"),animationstart:Ls("Animation","AnimationStart"),transitionrun:Ls("Transition","TransitionRun"),transitionstart:Ls("Transition","TransitionStart"),transitioncancel:Ls("Transition","TransitionCancel"),transitionend:Ls("Transition","TransitionEnd")},Mf={},u0={};Ea&&(u0=document.createElement("div").style,"AnimationEvent"in window||(delete vr.animationend.animation,delete vr.animationiteration.animation,delete vr.animationstart.animation),"TransitionEvent"in window||delete vr.transitionend.transition);function Os(t){if(Mf[t])return Mf[t];if(!vr[t])return t;var n=vr[t],a;for(a in n)if(n.hasOwnProperty(a)&&a in u0)return Mf[t]=n[a];return t}var f0=Os("animationend"),h0=Os("animationiteration"),d0=Os("animationstart"),Uy=Os("transitionrun"),Ly=Os("transitionstart"),Oy=Os("transitioncancel"),p0=Os("transitionend"),m0=new Map,Ef="abort auxClick beforeToggle cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error fullscreenChange fullscreenError gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel".split(" ");Ef.push("scrollEnd");function Hi(t,n){m0.set(t,n),kt(n,[t])}var Py=0;function ba(t,n){if(t.name!=null&&t.name!=="auto")return t.name;if(n.autoName!==null)return n.autoName;t=Xi.identifierPrefix;var a=Py++;return t="_"+t+"t_"+a.toString(32)+"_",n.autoName=t}function g0(t){if(t==null||typeof t=="string")return t;var n=null,a=Br;if(a!==null)for(var r=0;r<a.length;r++){var c=t[a[r]];if(c!=null){if(c==="none")return"none";n=n==null?c:n+(" "+c)}}return n??t.default}function Ta(t,n){return t=g0(t),n=g0(n),n==null?t==="auto"?null:t:n==="auto"?null:n}var Kl=typeof reportError=="function"?reportError:function(t){if(typeof window=="object"&&typeof window.ErrorEvent=="function"){var n=new window.ErrorEvent("error",{bubbles:!0,cancelable:!0,message:typeof t=="object"&&t!==null&&typeof t.message=="string"?String(t.message):String(t),error:t});if(!window.dispatchEvent(n))return}else if(typeof process=="object"&&typeof process.emit=="function"){process.emit("uncaughtException",t);return}console.error(t)},Ai=[],xr=0,bf=0;function Ql(){for(var t=xr,n=bf=xr=0;n<t;){var a=Ai[n];Ai[n++]=null;var r=Ai[n];Ai[n++]=null;var c=Ai[n];Ai[n++]=null;var u=Ai[n];if(Ai[n++]=null,r!==null&&c!==null){var g=r.pending;g===null?c.next=c:(c.next=g.next,g.next=c),r.pending=c}u!==0&&_0(a,c,u)}}function Jl(t,n,a,r){Ai[xr++]=t,Ai[xr++]=n,Ai[xr++]=a,Ai[xr++]=r,bf|=r,t.lanes|=r,t=t.alternate,t!==null&&(t.lanes|=r)}function Tf(t,n,a,r){return Jl(t,n,a,r),$l(t)}function Ps(t,n){return Jl(t,null,null,n),$l(t)}function _0(t,n,a){t.lanes|=a;var r=t.alternate;r!==null&&(r.lanes|=a);for(var c=!1,u=t.return;u!==null;)u.childLanes|=a,r=u.alternate,r!==null&&(r.childLanes|=a),u.tag===22&&(t=u.stateNode,t===null||t._visibility&1||(c=!0)),t=u,u=u.return;return t.tag===3?(u=t.stateNode,c&&n!==null&&(c=31-fe(a),t=u.hiddenUpdates,r=t[c],r===null?t[c]=[n]:r.push(n),n.lane=a|536870912),u):null}function $l(t){if(50<al)throw al=0,Vc=null,Error(s(185));for(var n=t.return;n!==null;)t=n,n=t.return;return t.tag===3?t.stateNode:null}var Sr={};function Iy(t,n,a,r){this.tag=t,this.key=a,this.sibling=this.child=this.return=this.stateNode=this.type=this.elementType=null,this.index=0,this.refCleanup=this.ref=null,this.pendingProps=n,this.dependencies=this.memoizedState=this.updateQueue=this.memoizedProps=null,this.mode=r,this.subtreeFlags=this.flags=0,this.deletions=null,this.childLanes=this.lanes=0,this.alternate=null}function $n(t,n,a,r){return new Iy(t,n,a,r)}function Af(t){return t=t.prototype,!(!t||!t.isReactComponent)}function Aa(t,n){var a=t.alternate;return a===null?(a=$n(t.tag,n,t.key,t.mode),a.elementType=t.elementType,a.type=t.type,a.stateNode=t.stateNode,a.alternate=t,t.alternate=a):(a.pendingProps=n,a.type=t.type,a.flags=0,a.subtreeFlags=0,a.deletions=null),a.flags=t.flags&1206910976,a.childLanes=t.childLanes,a.lanes=t.lanes,a.child=t.child,a.memoizedProps=t.memoizedProps,a.memoizedState=t.memoizedState,a.updateQueue=t.updateQueue,n=t.dependencies,a.dependencies=n===null?null:{lanes:n.lanes,firstContext:n.firstContext},a.sibling=t.sibling,a.index=t.index,a.ref=t.ref,a.refCleanup=t.refCleanup,a}function v0(t,n){t.flags&=1206910978;var a=t.alternate;return a===null?(t.childLanes=0,t.lanes=n,t.child=null,t.subtreeFlags=0,t.memoizedProps=null,t.memoizedState=null,t.updateQueue=null,t.dependencies=null,t.stateNode=null):(t.childLanes=a.childLanes,t.lanes=a.lanes,t.child=a.child,t.subtreeFlags=0,t.deletions=null,t.memoizedProps=a.memoizedProps,t.memoizedState=a.memoizedState,t.updateQueue=a.updateQueue,t.type=a.type,n=a.dependencies,t.dependencies=n===null?null:{lanes:n.lanes,firstContext:n.firstContext}),t}function tc(t,n,a,r,c,u){var g=0;if(r=t,typeof r=="function")Af(r)&&(g=1);else if(typeof r=="string")g=uE(t,a,Be.current)?26:t==="html"||t==="head"||t==="body"?27:5;else t:switch(r){case Tt:return t=$n(31,a,n,c),t.elementType=Tt,t.lanes=u,t;case k:return Is(a.children,c,u,n);case Q:g=8,c|=24;break;case st:return t=$n(12,a,n,c|2),t.elementType=st,t.lanes=u,t;case j:return t=$n(13,a,n,c),t.elementType=j,t.lanes=u,t;case dt:return t=$n(19,a,n,c),t.elementType=dt,t.lanes=u,t;case Gt:case B:return t=c|32,t=$n(30,a,n,t),t.elementType=B,t.lanes=u,t.stateNode={autoName:null,paired:null,clones:null,ref:null},t;default:if(typeof r=="object"&&r!==null)switch(r.$$typeof){case tt:g=10;break t;case Y:g=9;break t;case q:g=11;break t;case ut:g=14;break t;case rt:g=16,r=null;break t}g=29,a=Error(s(130,t===null?"null":typeof t,"")),r=null}return n=$n(g,a,n,c),n.elementType=t,n.type=r,n.lanes=u,n}function Is(t,n,a,r){return t=$n(7,t,r,n),t.lanes=a,t}function Rf(t,n,a){return t=$n(6,t,null,n),t.lanes=a,t}function x0(t){var n=$n(18,null,null,0);return n.stateNode=t,n}function wf(t,n,a){return n=$n(4,t.children!==null?t.children:[],t.key,n),n.lanes=a,n.stateNode={containerInfo:t.containerInfo,pendingChildren:null,implementation:t.implementation},n}var S0=new WeakMap;function Ri(t,n){if(typeof t=="object"&&t!==null){var a=S0.get(t);return a!==void 0?a:(n={value:t,source:n,stack:xt(n)},S0.set(t,n),n)}return{value:t,source:n,stack:xt(n)}}var yr=[],Mr=0,ec=null,zo=0,wi=[],Ci=0,Qa=null,ea=1,na="";function Ra(t,n){yr[Mr++]=zo,yr[Mr++]=ec,ec=t,zo=n}function y0(t,n,a){wi[Ci++]=ea,wi[Ci++]=na,wi[Ci++]=Qa,Qa=t;var r=ea;t=na;var c=32-fe(r)-1;r&=~(1<<c),a+=1;var u=32-fe(n)+c;if(30<u){var g=c-c%5;u=(r&(1<<g)-1).toString(32),r>>=g,c-=g,ea=1<<32-fe(n)+c|a<<c|r,na=u+t}else ea=1<<u|a<<c|r,na=t}function nc(t){t.return!==null&&(Ra(t,1),y0(t,1,0))}function Cf(t){for(;t===ec;)ec=yr[--Mr],yr[Mr]=null,zo=yr[--Mr],yr[Mr]=null;for(;t===Qa;)Qa=wi[--Ci],wi[Ci]=null,na=wi[--Ci],wi[Ci]=null,ea=wi[--Ci],wi[Ci]=null}function M0(t,n){wi[Ci++]=ea,wi[Ci++]=na,wi[Ci++]=Qa,ea=n.id,na=n.overflow,Qa=t}var wn=null,nn=null,ye=!1,Ja=null,Ni=!1,Nf=Error(s(519));function $a(t){var n=Error(s(418,1<arguments.length&&arguments[1]!==void 0&&arguments[1]?"text":"HTML",""));throw Bo(Ri(n,t)),Nf}function E0(t){var n=t.stateNode,a=t.type,r=t.memoizedProps;switch(n[R]=t,n[H]=r,a){case"dialog":Re("cancel",n),Re("close",n);break;case"iframe":case"object":case"embed":Re("load",n);break;case"video":case"audio":for(a=0;a<rl.length;a++)Re(rl[a],n);break;case"source":Re("error",n);break;case"img":case"image":case"link":Re("error",n),Re("load",n);break;case"details":Re("toggle",n);break;case"input":Re("invalid",n),Pm(n,r.value,r.defaultValue,r.checked,r.defaultChecked,r.type,r.name,!0);break;case"select":Re("invalid",n);break;case"textarea":Re("invalid",n),zm(n,r.value,r.defaultValue,r.children)}a=r.children,typeof a!="string"&&typeof a!="number"&&typeof a!="bigint"||n.textContent===""+a||r.suppressHydrationWarning===!0||X_(n.textContent,a)?(r.popover!=null&&(Re("beforetoggle",n),Re("toggle",n)),r.onScroll!=null&&Re("scroll",n),r.onScrollEnd!=null&&Re("scrollend",n),r.onClick!=null&&(n.onclick=ta),n=!0):n=!1,n||$a(t,!0)}function ic(t){for(wn=t.return;wn;)switch(wn.tag){case 5:case 31:case 13:Ni=!1;return;case 27:case 3:Ni=!0;return;default:wn=wn.return}}function Er(t){if(t!==wn)return!1;if(!ye)return ic(t),ye=!0,!1;var n=t.tag,a;if((a=n!==3&&n!==27)&&((a=n===5)&&(a=t.type,a=!(a!=="form"&&a!=="button")||rd(t.type,t.memoizedProps)),a=!a),a&&nn&&$a(t),ic(t),n===13){if(t=t.memoizedState,t=t!==null?t.dehydrated:null,!t)throw Error(s(317));nn=cv(t)}else if(n===31){if(t=t.memoizedState,t=t!==null?t.dehydrated:null,!t)throw Error(s(317));nn=cv(t)}else n===27?(n=nn,ms(t.type)?(t=md,md=null,nn=t):nn=n):nn=wn?Ui(t.stateNode.nextSibling):null;return!0}function zs(){nn=wn=null,ye=!1}function Df(){var t=Ja;return t!==null&&(ni===null?ni=t:ni.push.apply(ni,t),Ja=null),t}function Bo(t){Ja===null?Ja=[t]:Ja.push(t)}var Uf=_e(null),Bs=null,wa=null;function ts(t,n,a){ne(Uf,n._currentValue),n._currentValue=a}function Ca(t){t._currentValue=Uf.current,ee(Uf)}function ac(t,n,a){for(;t!==null;){var r=t.alternate;if((t.childLanes&n)!==n?(t.childLanes|=n,r!==null&&(r.childLanes|=n)):r!==null&&(r.childLanes&n)!==n&&(r.childLanes|=n),t===a)break;t=t.return}}function Lf(t,n,a,r){var c=t.child;for(c!==null&&(c.return=t);c!==null;){var u=c.dependencies;if(u!==null){var g=c.child;u=u.firstContext;t:for(;u!==null;){var w=u;u=c;for(var z=0;z<n.length;z++)if(w.context===n[z]){u.lanes|=a,w=u.alternate,w!==null&&(w.lanes|=a),ac(u.return,a,t),r||(g=null);break t}u=w.next}}else if(c.tag===18){if(g=c.return,g===null)throw Error(s(341));g.lanes|=a,u=g.alternate,u!==null&&(u.lanes|=a),ac(g,a,t),g=null}else c.tag===13&&c.memoizedState!==null&&c.memoizedState.dehydrated===null?(c.lanes|=a,g=c.alternate,g!==null&&(g.lanes|=a),ac(c.return,a,t),g=c.child,g=g!==null?g.sibling:null):g=c.child;if(g!==null)g.return=c;else for(g=c;g!==null;){if(g===t){g=null;break}if(c=g.sibling,c!==null){c.return=g.return,g=c;break}g=g.return}c=g}}function Fs(t,n,a,r){t=null;for(var c=n,u=!1;c!==null;){if(!u){if((c.flags&524288)!==0)u=!0;else if((c.flags&262144)!==0)break}if(c.tag===10){var g=c.alternate;if(g===null)throw Error(s(387));if(g=g.memoizedProps,g!==null){var w=c.type;ui(c.pendingProps.value,g.value)||(t!==null?t.push(w):t=[w])}}else if(c===$e.current){if(g=c.alternate,g===null)throw Error(s(387));g.memoizedState.memoizedState!==c.memoizedState.memoizedState&&(t!==null?t.push(jr):t=[jr])}c=c.return}return t!==null&&Lf(n,t,a,r),n.flags|=262144,t!==null}function sc(t){for(t=t.firstContext;t!==null;){if(!ui(t.context._currentValue,t.memoizedValue))return!0;t=t.next}return!1}function Hs(t){Bs=t,wa=null,t=t.dependencies,t!==null&&(t.firstContext=null)}function Ln(t){return b0(Bs,t)}function rc(t,n){return Bs===null&&Hs(t),b0(t,n)}function b0(t,n){var a=n._currentValue;if(n={context:n,memoizedValue:a,next:null},wa===null){if(t===null)throw Error(s(308));wa=n,t.dependencies={lanes:0,firstContext:n},t.flags|=524288}else wa=wa.next=n;return a}var zy=typeof AbortController<"u"?AbortController:function(){var t=[],n=this.signal={aborted:!1,addEventListener:function(a,r){t.push(r)}};this.abort=function(){n.aborted=!0,t.forEach(function(a){return a()})}},By=o.unstable_scheduleCallback,Fy=o.unstable_NormalPriority,vn={$$typeof:tt,Consumer:null,Provider:null,_currentValue:null,_currentValue2:null,_threadCount:0};function Of(){return{controller:new zy,data:new Map,refCount:0}}function Fo(t){t.refCount--,t.refCount===0&&By(Fy,function(){t.controller.abort()})}function T0(t,n){if((t.pendingLanes&4194048)!==0){var a=t.transitionTypes;for(a===null&&(a=t.transitionTypes=[]),t=0;t<n.length;t++){var r=n[t];a.indexOf(r)===-1&&a.push(r)}}}var Ho=null;function Hy(t){var n=t.transitionTypes;return t.transitionTypes=null,n}var Go=null,Pf=0,Gs=0,br=null;function Gy(t,n){if(Go===null){var a=Go=[];Pf=0,Gs=Qh(),br={status:"pending",value:void 0,then:function(r){a.push(r)}}}return Pf++,n.then(A0,A0),n}function A0(){if(--Pf===0&&(Ho=null,Go!==null)){br!==null&&(br.status="fulfilled");var t=Go;Go=null,Gs=0,br=null;for(var n=0;n<t.length;n++)(0,t[n])()}}function Vy(t,n){var a=[],r={status:"pending",value:null,reason:null,then:function(c){a.push(c)}};return t.then(function(){r.status="fulfilled",r.value=n;for(var c=0;c<a.length;c++)(0,a[c])(n)},function(c){for(r.status="rejected",r.reason=c,c=0;c<a.length;c++)(0,a[c])(void 0)}),r}var R0=vt.S;vt.S=function(t,n){if(x_=Lt(),typeof n=="object"&&n!==null&&typeof n.then=="function"&&Gy(t,n),Ho!==null)for(var a=Vr;a!==null;)T0(a,Ho),a=a.next;if(a=t.types,a!==null){for(var r=Vr;r!==null;)T0(r,a),r=r.next;if(Gs!==0){r=Ho,r===null&&(r=Ho=[]);for(var c=0;c<a.length;c++){var u=a[c];r.indexOf(u)===-1&&r.push(u)}}}R0!==null&&R0(t,n)};var Vs=_e(null);function If(){var t=Vs.current;return t!==null?t:tn.pooledCache}function oc(t,n){n===null?ne(Vs,Vs.current):ne(Vs,n.pool)}function w0(){var t=If();return t===null?null:{parent:vn._currentValue,pool:t}}var Tr=Error(s(460)),zf=Error(s(474)),lc=Error(s(542)),cc={then:function(){}};function C0(t){return t=t.status,t==="fulfilled"||t==="rejected"}function N0(t,n,a){switch(a=t[a],a===void 0?t.push(n):a!==n&&(n.then(ta,ta),n=a),n.status){case"fulfilled":return n.value;case"rejected":throw t=n.reason,U0(t),t===void 0&&!("reason"in n)?Error(s(600)):t;default:if(typeof n.status=="string")n.then(ta,ta);else{if(t=tn,t!==null&&100<t.shellSuspendCounter)throw Error(s(482));t=n,t.status="pending",t.then(function(r){if(n.status==="pending"){var c=n;c.status="fulfilled",c.value=r}},function(r){if(n.status==="pending"){var c=n;c.status="rejected",c.reason=r}})}switch(n.status){case"fulfilled":return n.value;case"rejected":throw t=n.reason,U0(t),t}throw Xs=n,Tr}}function ks(t){try{var n=t._init;return n(t._payload)}catch(a){throw a!==null&&typeof a=="object"&&typeof a.then=="function"?(Xs=a,Tr):a}}var Xs=null;function D0(){if(Xs===null)throw Error(s(459));var t=Xs;return Xs=null,t}function U0(t){if(t===Tr||t===lc)throw Error(s(483))}var Ar=null,Vo=0;function uc(t){var n=Vo;return Vo+=1,Ar===null&&(Ar=[]),N0(Ar,t,n)}function es(t,n){n=n.props.ref,t.ref=n!==void 0?n:null}function fc(t,n){throw n.$$typeof===T?Error(s(525)):(t=Object.prototype.toString.call(n),Error(s(31,t==="[object Object]"?"object with keys {"+Object.keys(n).join(", ")+"}":t)))}function L0(t){function n(J,V){if(t){var it=J.deletions;it===null?(J.deletions=[V],J.flags|=16):it.push(V)}}function a(J,V){if(!t)return null;for(;V!==null;)n(J,V),V=V.sibling;return null}function r(J){for(var V=new Map;J!==null;)J.key===null?V.set(J.index,J):V.set(J.key,J),J=J.sibling;return V}function c(J,V){return J=Aa(J,V),J.index=0,J.sibling=null,J}function u(J,V,it){return J.index=it,t?(it=J.alternate,it!==null?(it=it.index,it<V?(J.flags|=2,V):it):(J.flags|=134217730,V)):(J.flags|=1048576,V)}function g(J){return t&&J.alternate===null&&(J.flags|=134217730),J}function w(J,V,it,Mt){return V===null||V.tag!==6?(V=Rf(it,J.mode,Mt),V.return=J,V):(V=c(V,it),V.return=J,V)}function z(J,V,it,Mt){var Zt=it.type;return Zt===k?(J=ht(J,V,it.props.children,Mt,it.key),es(J,it),J):V!==null&&(V.elementType===Zt||typeof Zt=="object"&&Zt!==null&&Zt.$$typeof===rt&&ks(Zt)===V.type)?(V=c(V,it.props),es(V,it),V.return=J,V):(V=tc(it.type,it.key,it.props,null,J.mode,Mt),es(V,it),V.return=J,V)}function $(J,V,it,Mt){return V===null||V.tag!==4||V.stateNode.containerInfo!==it.containerInfo||V.stateNode.implementation!==it.implementation?(V=wf(it,J.mode,Mt),V.return=J,V):(V=c(V,it.children||[]),V.return=J,V)}function ht(J,V,it,Mt,Zt){return V===null||V.tag!==7?(V=Is(it,J.mode,Mt,Zt),V.return=J,V):(V=c(V,it),V.return=J,V)}function Et(J,V,it){if(typeof V=="string"&&V!==""||typeof V=="number"||typeof V=="bigint")return V=Rf(""+V,J.mode,it),V.return=J,V;if(typeof V=="object"&&V!==null){switch(V.$$typeof){case O:return it=tc(V.type,V.key,V.props,null,J.mode,it),es(it,V),it.return=J,it;case G:return V=wf(V,J.mode,it),V.return=J,V;case rt:return V=ks(V),Et(J,V,it)}if(Pt(V)||Z(V))return V=Is(V,J.mode,it,null),V.return=J,V;if(typeof V.then=="function")return Et(J,uc(V),it);if(V.$$typeof===tt)return Et(J,rc(J,V),it);fc(J,V)}return null}function K(J,V,it,Mt){var Zt=V!==null?V.key:null;if(typeof it=="string"&&it!==""||typeof it=="number"||typeof it=="bigint")return Zt!==null?null:w(J,V,""+it,Mt);if(typeof it=="object"&&it!==null){switch(it.$$typeof){case O:return it.key===Zt?z(J,V,it,Mt):null;case G:return it.key===Zt?$(J,V,it,Mt):null;case rt:return it=ks(it),K(J,V,it,Mt)}if(Pt(it)||Z(it))return Zt!==null?null:ht(J,V,it,Mt,null);if(typeof it.then=="function")return K(J,V,uc(it),Mt);if(it.$$typeof===tt)return K(J,V,rc(J,it),Mt);fc(J,it)}return null}function ct(J,V,it,Mt,Zt){if(typeof Mt=="string"&&Mt!==""||typeof Mt=="number"||typeof Mt=="bigint")return J=J.get(it)||null,w(V,J,""+Mt,Zt);if(typeof Mt=="object"&&Mt!==null){switch(Mt.$$typeof){case O:return J=J.get(Mt.key===null?it:Mt.key)||null,z(V,J,Mt,Zt);case G:return J=J.get(Mt.key===null?it:Mt.key)||null,$(V,J,Mt,Zt);case rt:return Mt=ks(Mt),ct(J,V,it,Mt,Zt)}if(Pt(Mt)||Z(Mt))return J=J.get(it)||null,ht(V,J,Mt,Zt,null);if(typeof Mt.then=="function")return ct(J,V,it,uc(Mt),Zt);if(Mt.$$typeof===tt)return ct(J,V,it,rc(V,Mt),Zt);fc(V,Mt)}return null}function Ht(J,V,it,Mt){for(var Zt=null,De=null,ie=V,se=V=0,yn=null;ie!==null&&se<it.length;se++){ie.index>se?(yn=ie,ie=null):yn=ie.sibling;var Ie=K(J,ie,it[se],Mt);if(Ie===null){ie===null&&(ie=yn);break}t&&ie&&Ie.alternate===null&&n(J,ie),V=u(Ie,V,se),De===null?Zt=Ie:De.sibling=Ie,De=Ie,ie=yn}if(se===it.length)return a(J,ie),ye&&Ra(J,se),Zt;if(ie===null){for(;se<it.length;se++)ie=Et(J,it[se],Mt),ie!==null&&(V=u(ie,V,se),De===null?Zt=ie:De.sibling=ie,De=ie);return ye&&Ra(J,se),Zt}for(ie=r(ie);se<it.length;se++)yn=ct(ie,J,se,it[se],Mt),yn!==null&&(t&&(Ie=yn.alternate,Ie!==null&&ie.delete(Ie.key===null?se:Ie.key)),V=u(yn,V,se),De===null?Zt=yn:De.sibling=yn,De=yn);return t&&ie.forEach(function(Ss){return n(J,Ss)}),ye&&Ra(J,se),Zt}function $t(J,V,it,Mt){if(it==null)throw Error(s(151));for(var Zt=null,De=null,ie=V,se=V=0,yn=null,Ie=it.next();ie!==null&&!Ie.done;se++,Ie=it.next()){ie.index>se?(yn=ie,ie=null):yn=ie.sibling;var Ss=K(J,ie,Ie.value,Mt);if(Ss===null){ie===null&&(ie=yn);break}t&&ie&&Ss.alternate===null&&n(J,ie),V=u(Ss,V,se),De===null?Zt=Ss:De.sibling=Ss,De=Ss,ie=yn}if(Ie.done)return a(J,ie),ye&&Ra(J,se),Zt;if(ie===null){for(;!Ie.done;se++,Ie=it.next())Ie=Et(J,Ie.value,Mt),Ie!==null&&(V=u(Ie,V,se),De===null?Zt=Ie:De.sibling=Ie,De=Ie);return ye&&Ra(J,se),Zt}for(ie=r(ie);!Ie.done;se++,Ie=it.next())Ie=ct(ie,J,se,Ie.value,Mt),Ie!==null&&(t&&(yn=Ie.alternate,yn!==null&&ie.delete(yn.key===null?se:yn.key)),V=u(Ie,V,se),De===null?Zt=Ie:De.sibling=Ie,De=Ie);return t&&ie.forEach(function(ME){return n(J,ME)}),ye&&Ra(J,se),Zt}function ge(J,V,it,Mt){if(typeof it=="object"&&it!==null&&it.type===k&&it.key===null&&it.props.ref===void 0&&(it=it.props.children),typeof it=="object"&&it!==null){switch(it.$$typeof){case O:t:{for(var Zt=it.key;V!==null;){if(V.key===Zt){if(Zt=it.type,Zt===k){if(V.tag===7){a(J,V.sibling),Mt=c(V,it.props.children),es(Mt,it),Mt.return=J,J=Mt;break t}}else if(V.elementType===Zt||typeof Zt=="object"&&Zt!==null&&Zt.$$typeof===rt&&ks(Zt)===V.type){a(J,V.sibling),Mt=c(V,it.props),es(Mt,it),Mt.return=J,J=Mt;break t}a(J,V);break}else n(J,V);V=V.sibling}it.type===k?(Mt=Is(it.props.children,J.mode,Mt,it.key),es(Mt,it),Mt.return=J,J=Mt):(Mt=tc(it.type,it.key,it.props,null,J.mode,Mt),es(Mt,it),Mt.return=J,J=Mt)}return g(J);case G:t:{for(Zt=it.key;V!==null;){if(V.key===Zt)if(V.tag===4&&V.stateNode.containerInfo===it.containerInfo&&V.stateNode.implementation===it.implementation){a(J,V.sibling),Mt=c(V,it.children||[]),Mt.return=J,J=Mt;break t}else{a(J,V);break}else n(J,V);V=V.sibling}Mt=wf(it,J.mode,Mt),Mt.return=J,J=Mt}return g(J);case rt:return it=ks(it),ge(J,V,it,Mt)}if(Pt(it))return Ht(J,V,it,Mt);if(Z(it)){if(Zt=Z(it),typeof Zt!="function")throw Error(s(150));return it=Zt.call(it),$t(J,V,it,Mt)}if(typeof it.then=="function")return ge(J,V,uc(it),Mt);if(it.$$typeof===tt)return ge(J,V,rc(J,it),Mt);fc(J,it)}return typeof it=="string"&&it!==""||typeof it=="number"||typeof it=="bigint"?(it=""+it,V!==null&&V.tag===6?(a(J,V.sibling),Mt=c(V,it),Mt.return=J,J=Mt):(a(J,V),Mt=Rf(it,J.mode,Mt),Mt.return=J,J=Mt),g(J)):a(J,V)}return function(J,V,it,Mt){try{Vo=0;var Zt=ge(J,V,it,Mt);return Ar=null,Zt}catch(ie){if(ie===Tr||ie===lc)throw ie;var De=$n(29,ie,null,J.mode);return De.lanes=Mt,De.return=J,De}}}var Ws=L0(!0),O0=L0(!1),ns=!1;function Bf(t){t.updateQueue={baseState:t.memoizedState,firstBaseUpdate:null,lastBaseUpdate:null,shared:{pending:null,lanes:0,hiddenCallbacks:null},callbacks:null}}function Ff(t,n){t=t.updateQueue,n.updateQueue===t&&(n.updateQueue={baseState:t.baseState,firstBaseUpdate:t.firstBaseUpdate,lastBaseUpdate:t.lastBaseUpdate,shared:t.shared,callbacks:null})}function is(t){return{lane:t,tag:0,payload:null,callback:null,next:null}}function as(t,n,a){var r=t.updateQueue;if(r===null)return null;if(r=r.shared,(Ge&2)!==0){var c=r.pending;return c===null?n.next=n:(n.next=c.next,c.next=n),r.pending=n,n=$l(t),_0(t,null,a),n}return Jl(t,r,n,a),$l(t)}function ko(t,n,a){if(n=n.updateQueue,n!==null&&(n=n.shared,(a&4194048)!==0)){var r=n.lanes;r&=t.pendingLanes,a|=r,n.lanes=a,bo(t,a)}}function Hf(t,n){var a=t.updateQueue,r=t.alternate;if(r!==null&&(r=r.updateQueue,a===r)){var c=null,u=null;if(a=a.firstBaseUpdate,a!==null){do{var g={lane:a.lane,tag:a.tag,payload:a.payload,callback:null,next:null};u===null?c=u=g:u=u.next=g,a=a.next}while(a!==null);u===null?c=u=n:u=u.next=n}else c=u=n;a={baseState:r.baseState,firstBaseUpdate:c,lastBaseUpdate:u,shared:r.shared,callbacks:r.callbacks},t.updateQueue=a;return}t=a.lastBaseUpdate,t===null?a.firstBaseUpdate=n:t.next=n,a.lastBaseUpdate=n}var Gf=!1;function Xo(){if(Gf){var t=br;if(t!==null)throw t}}function Wo(t,n,a,r){Gf=!1;var c=t.updateQueue;ns=!1;var u=c.firstBaseUpdate,g=c.lastBaseUpdate,w=c.shared.pending;if(w!==null){c.shared.pending=null;var z=w,$=z.next;z.next=null,g===null?u=$:g.next=$,g=z;var ht=t.alternate;ht!==null&&(ht=ht.updateQueue,w=ht.lastBaseUpdate,w!==g&&(w===null?ht.firstBaseUpdate=$:w.next=$,ht.lastBaseUpdate=z))}if(u!==null){var Et=c.baseState;g=0,ht=$=z=null,w=u;do{var K=w.lane&-536870913,ct=K!==w.lane;if(ct?(Ne&K)===K:(r&K)===K){K!==0&&K===Gs&&(Gf=!0),ht!==null&&(ht=ht.next={lane:0,tag:w.tag,payload:w.payload,callback:null,next:null});t:{var Ht=t,$t=w;K=n;var ge=a;switch($t.tag){case 1:if(Ht=$t.payload,typeof Ht=="function"){Et=Ht.call(ge,Et,K);break t}Et=Ht;break t;case 3:Ht.flags=Ht.flags&-65537|128;case 0:if(Ht=$t.payload,K=typeof Ht=="function"?Ht.call(ge,Et,K):Ht,K==null)break t;Et=I({},Et,K);break t;case 2:ns=!0}}K=w.callback,K!==null&&(t.flags|=64,ct&&(t.flags|=8192),ct=c.callbacks,ct===null?c.callbacks=[K]:ct.push(K))}else ct={lane:K,tag:w.tag,payload:w.payload,callback:w.callback,next:null},ht===null?($=ht=ct,z=Et):ht=ht.next=ct,g|=K;if(w=w.next,w===null){if(w=c.shared.pending,w===null)break;ct=w,w=ct.next,ct.next=null,c.lastBaseUpdate=ct,c.shared.pending=null}}while(!0);ht===null&&(z=Et),c.baseState=z,c.firstBaseUpdate=$,c.lastBaseUpdate=ht,u===null&&(c.shared.lanes=0),fs|=g,t.lanes=g,t.memoizedState=Et}}function P0(t,n){if(typeof t!="function")throw Error(s(191,t));t.call(n)}function I0(t,n){var a=t.callbacks;if(a!==null)for(t.callbacks=null,t=0;t<a.length;t++)P0(a[t],n)}var ss=_e(null),hc=_e(0);function z0(t,n){t=Oa,ne(hc,t),ne(ss,n),Oa=t|n.baseLanes}function Vf(){ne(hc,Oa),ne(ss,ss.current)}function kf(){Oa=hc.current,ee(ss),ee(hc)}var On=_e(null),Hn=null;function rs(t){var n=t.alternate;ne(Pn,Pn.current&1),ne(On,t),Hn===null&&(n===null||ss.current!==null||n.memoizedState!==null)&&(Hn=t)}function Xf(t){ne(Pn,Pn.current),ne(On,t),Hn===null&&(Hn=t)}function B0(t){t.tag===22?(ne(Pn,Pn.current),ne(On,t),Hn===null&&(Hn=t)):os()}function os(){ne(Pn,Pn.current),ne(On,On.current)}function fi(t){ee(On),Hn===t&&(Hn=null),ee(Pn)}var Pn=_e(0);function qo(t,n){ne(On,On.current),ne(Pn,n)}function Wf(t){ee(Pn),ee(On),Hn===t&&(Hn=null)}function dc(t){for(var n=t;n!==null;){if(n.tag===13){var a=n.memoizedState;if(a!==null&&(a=a.dehydrated,a===null||dd(a)||pd(a)))return n}else if(n.tag===19&&n.memoizedProps.revealOrder!=="independent"){if((n.flags&128)!==0)return n}else if(n.child!==null){n.child.return=n,n=n.child;continue}if(n===t)break;for(;n.sibling===null;){if(n.return===null||n.return===t)return null;n=n.return}n.sibling.return=n.return,n=n.sibling}return null}var Na=0,me=null,Je=null,xn=null,pc=!1,Rr=!1,qs=!1,mc=0,Yo=0,wr=null,ky=0;function dn(){throw Error(s(321))}function qf(t,n){if(n===null)return!1;for(var a=0;a<n.length&&a<t.length;a++)if(!ui(t[a],n[a]))return!1;return!0}function Yf(t,n,a,r,c,u){return Na=u,me=n,n.memoizedState=null,n.updateQueue=null,n.lanes=0,vt.H=t===null||t.memoizedState===null?yg:Mg,qs=!1,u=a(r,c),qs=!1,Rr&&(u=H0(n,a,r,c)),F0(t),u}function F0(t){vt.H=Mc;var n=Je!==null&&Je.next!==null;if(Na=0,xn=Je=me=null,pc=!1,Yo=0,wr=null,n)throw Error(s(300));t===null||Sn||(t=t.dependencies,t!==null&&sc(t)&&(Sn=!0))}function H0(t,n,a,r){me=t;var c=0;do{if(Rr&&(wr=null),Yo=0,Rr=!1,25<=c)throw Error(s(301));if(c+=1,xn=Je=null,t.updateQueue!=null){var u=t.updateQueue;u.lastEffect=null,u.events=null,u.stores=null,u.memoCache!=null&&(u.memoCache.index=0)}vt.H=Qy,u=n(a,r)}while(Rr);return u}function Xy(){var t=vt.H,n=t.useState()[0];return n=typeof n.then=="function"?jo(n):n,t=t.useState()[0],(Je!==null?Je.memoizedState:null)!==t&&(me.flags|=1024),n}function jf(){var t=mc!==0;return mc=0,t}function Zf(t,n,a){n.updateQueue=t.updateQueue,n.flags&=-2053,t.lanes&=~a}function Kf(t){if(pc){for(t=t.memoizedState;t!==null;){var n=t.queue;n!==null&&(n.pending=null),t=t.next}pc=!1}Na=0,xn=Je=me=null,Rr=!1,Yo=mc=0,wr=null}function qn(){var t={memoizedState:null,baseState:null,baseQueue:null,queue:null,next:null};return xn===null?me.memoizedState=xn=t:xn=xn.next=t,xn}function gn(){if(Je===null){var t=me.alternate;t=t!==null?t.memoizedState:null}else t=Je.next;var n=xn===null?me.memoizedState:xn.next;if(n!==null)xn=n,Je=t;else{if(t===null)throw me.alternate===null?Error(s(467)):Error(s(310));Je=t,t={memoizedState:Je.memoizedState,baseState:Je.baseState,baseQueue:Je.baseQueue,queue:Je.queue,next:null},xn===null?me.memoizedState=xn=t:xn=xn.next=t}return xn}function gc(){return{lastEffect:null,events:null,stores:null,memoCache:null}}function jo(t){var n=Yo;return Yo+=1,wr===null&&(wr=[]),t=N0(wr,t,n),n=me,(xn===null?n.memoizedState:xn.next)===null&&(n=n.alternate,vt.H=n===null||n.memoizedState===null?yg:Mg),t}function _c(t){if(t!==null&&typeof t=="object"){if(typeof t.then=="function")return jo(t);if(t.$$typeof===_t)return;if(t.$$typeof===tt)return Ln(t)}throw Error(s(438,String(t)))}function Qf(t){var n=null,a=me.updateQueue;if(a!==null&&(n=a.memoCache),n==null){var r=me.alternate;r!==null&&(r=r.updateQueue,r!==null&&(r=r.memoCache,r!=null&&(n={data:r.data.map(function(c){return c.slice()}),index:0})))}if(n==null&&(n={data:[],index:0}),a===null&&(a=gc(),me.updateQueue=a),a.memoCache=n,a=n.data[n.index],a===void 0)for(a=n.data[n.index]=Array(t),r=0;r<t;r++)a[r]=Ot;return n.index++,a}function Da(t,n){return typeof n=="function"?n(t):n}function vc(t){var n=gn();return Jf(n,Je,t)}function Jf(t,n,a){var r=t.queue;if(r===null)throw Error(s(311));r.lastRenderedReducer=a;var c=t.baseQueue,u=r.pending;if(u!==null){if(c!==null){var g=c.next;c.next=u.next,u.next=g}n.baseQueue=c=u,r.pending=null}if(u=t.baseState,c===null)t.memoizedState=u;else{n=c.next;var w=g=null,z=null,$=n,ht=!1;do{var Et=$.lane&-536870913;if(Et!==$.lane?(Ne&Et)===Et:(Na&Et)===Et){var K=$.revertLane;if(K===0)z!==null&&(z=z.next={lane:0,revertLane:0,gesture:null,action:$.action,hasEagerState:$.hasEagerState,eagerState:$.eagerState,next:null}),Et===Gs&&(ht=!0);else if((Na&K)===K){$=$.next,K===Gs&&(ht=!0);continue}else Et={lane:0,revertLane:$.revertLane,gesture:null,action:$.action,hasEagerState:$.hasEagerState,eagerState:$.eagerState,next:null},z===null?(w=z=Et,g=u):z=z.next=Et,me.lanes|=K,fs|=K;Et=$.action,qs&&a(u,Et),u=$.hasEagerState?$.eagerState:a(u,Et)}else K={lane:Et,revertLane:$.revertLane,gesture:$.gesture,action:$.action,hasEagerState:$.hasEagerState,eagerState:$.eagerState,next:null},z===null?(w=z=K,g=u):z=z.next=K,me.lanes|=Et,fs|=Et;$=$.next}while($!==null&&$!==n);if(z===null?g=u:z.next=w,!ui(u,t.memoizedState)&&(Sn=!0,ht&&(a=br,a!==null)))throw a;t.memoizedState=u,t.baseState=g,t.baseQueue=z,r.lastRenderedState=u}return c===null&&(r.lanes=0),[t.memoizedState,r.dispatch]}function $f(t){var n=gn(),a=n.queue;if(a===null)throw Error(s(311));a.lastRenderedReducer=t;var r=a.dispatch,c=a.pending,u=n.memoizedState;if(c!==null){a.pending=null;var g=c=c.next;do u=t(u,g.action),g=g.next;while(g!==c);ui(u,n.memoizedState)||(Sn=!0),n.memoizedState=u,n.baseQueue===null&&(n.baseState=u),a.lastRenderedState=u}return[u,r]}function G0(t,n,a){var r=me,c=gn(),u=ye;if(u){if(a===void 0)throw Error(s(407));a=a()}else a=n();var g=!ui((Je||c).memoizedState,a);if(g&&(c.memoizedState=a,Sn=!0),c=c.queue,nh(X0.bind(null,r,c,t),[t]),t=c.getSnapshot!==n||g||xn!==null&&(xn.memoizedState.tag&1)!==0,Cr(t?9:8,{destroy:void 0},k0.bind(null,r,c,a,n),null),t){if(r.flags|=2048,tn===null)throw Error(s(349));u||(Na&127)!==0||V0(r,n,a)}return a}function V0(t,n,a){t.flags|=16384,t={getSnapshot:n,value:a},n=me.updateQueue,n===null?(n=gc(),me.updateQueue=n,n.stores=[t]):(a=n.stores,a===null?n.stores=[t]:a.push(t))}function k0(t,n,a,r){n.value=a,n.getSnapshot=r,W0(n)&&q0(t)}function X0(t,n,a){return a(function(){W0(n)&&q0(t)})}function W0(t){var n=t.getSnapshot;t=t.value;try{var a=n();return!ui(t,a)}catch{return!0}}function q0(t){var n=Ps(t,2);n!==null&&ii(n,t,2)}function th(t){var n=qn();if(typeof t=="function"){var a=t;if(t=a(),qs){Ue(!0);try{a()}finally{Ue(!1)}}}return n.memoizedState=n.baseState=t,n.queue={pending:null,lanes:0,dispatch:null,lastRenderedReducer:Da,lastRenderedState:t},n}function Y0(t,n,a,r){return t.baseState=a,Jf(t,Je,typeof r=="function"?r:Da)}function Wy(t,n,a,r,c){if(yc(t))throw Error(s(485));if(t=n.action,t!==null){var u={payload:c,action:t,next:null,isTransition:!0,status:"pending",value:null,reason:null,listeners:[],then:function(g){u.listeners.push(g)}};vt.T!==null?a(!0):u.isTransition=!1,r(u),a=n.pending,a===null?(u.next=n.pending=u,j0(n,u)):(u.next=a.next,n.pending=a.next=u)}}function j0(t,n){var a=n.action,r=n.payload,c=t.state;if(n.isTransition){var u=vt.T,g={};g.types=u!==null?u.types:null,vt.T=g;try{var w=a(c,r),z=vt.S;z!==null&&z(g,w),Z0(t,n,w)}catch($){eh(t,n,$)}finally{u!==null&&g.types!==null&&(u.types=g.types),vt.T=u}}else try{u=a(c,r),Z0(t,n,u)}catch($){eh(t,n,$)}}function Z0(t,n,a){a!==null&&typeof a=="object"&&typeof a.then=="function"?a.then(function(r){K0(t,n,r)},function(r){return eh(t,n,r)}):K0(t,n,a)}function K0(t,n,a){n.status="fulfilled",n.value=a,Q0(n),t.state=a,n=t.pending,n!==null&&(a=n.next,a===n?t.pending=null:(a=a.next,n.next=a,j0(t,a)))}function eh(t,n,a){var r=t.pending;if(t.pending=null,r!==null){r=r.next;do n.status="rejected",n.reason=a,Q0(n),n=n.next;while(n!==r)}t.action=null}function Q0(t){t=t.listeners;for(var n=0;n<t.length;n++)(0,t[n])()}function J0(t,n){return n}function $0(t,n){if(ye){var a=tn.formState;if(a!==null){t:{var r=me;if(ye){if(nn){e:{for(var c=nn,u=Ni;c.nodeType!==8;){if(!u){c=null;break e}if(c=Ui(c.nextSibling),c===null){c=null;break e}}u=c.data,c=u==="F!"||u==="F"?c:null}if(c){nn=Ui(c.nextSibling),r=c.data==="F!";break t}}$a(r)}r=!1}r&&(n=a[0])}}return a=qn(),a.memoizedState=a.baseState=n,r={pending:null,lanes:0,dispatch:null,lastRenderedReducer:J0,lastRenderedState:n},a.queue=r,a=vg.bind(null,me,r),r.dispatch=a,r=th(!1),u=oh.bind(null,me,!1,r.queue),r=qn(),c={state:n,dispatch:null,action:t,pending:null},r.queue=c,a=Wy.bind(null,me,c,u,a),c.dispatch=a,r.memoizedState=t,[n,a,!1]}function tg(t){var n=gn();return eg(n,Je,t)}function eg(t,n,a){if(n=Jf(t,n,J0)[0],t=vc(Da)[0],typeof n=="object"&&n!==null&&typeof n.then=="function")try{var r=jo(n)}catch(g){throw g===Tr?lc:g}else r=n;n=gn();var c=n.queue,u=c.dispatch;return a!==n.memoizedState&&(me.flags|=2048,Cr(9,{destroy:void 0},qy.bind(null,c,a),null)),[r,u,t]}function qy(t,n){t.action=n}function ng(t){var n=gn(),a=Je;if(a!==null)return eg(n,a,t);gn(),n=n.memoizedState,a=gn();var r=a.queue.dispatch;return a.memoizedState=t,[n,r,!1]}function Cr(t,n,a,r){return t={tag:t,create:a,deps:r,inst:n,next:null},n=me.updateQueue,n===null&&(n=gc(),me.updateQueue=n),a=n.lastEffect,a===null?n.lastEffect=t.next=t:(r=a.next,a.next=t,t.next=r,n.lastEffect=t),t}function ig(){return gn().memoizedState}function xc(t,n,a,r){var c=qn();me.flags|=t,c.memoizedState=Cr(1|n,{destroy:void 0},a,r===void 0?null:r)}function Sc(t,n,a,r){var c=gn();r=r===void 0?null:r;var u=c.memoizedState.inst;Je!==null&&r!==null&&qf(r,Je.memoizedState.deps)?c.memoizedState=Cr(n,u,a,r):(me.flags|=t,c.memoizedState=Cr(1|n,u,a,r))}function ag(t,n){xc(8390656,8,t,n)}function nh(t,n){Sc(2048,8,t,n)}function Yy(t){me.flags|=4;var n=me.updateQueue;if(n===null)n=gc(),me.updateQueue=n,n.events=[t];else{var a=n.events;a===null?n.events=[t]:a.push(t)}}function sg(t){var n=gn().memoizedState;return Yy({ref:n,nextImpl:t}),function(){if((Ge&2)!==0)throw Error(s(440));return n.impl.apply(void 0,arguments)}}function rg(t,n){return Sc(4,2,t,n)}function og(t,n){return Sc(4,4,t,n)}function lg(t,n){if(typeof n=="function"){t=t();var a=n(t);return function(){typeof a=="function"?a():n(null)}}if(n!=null)return t=t(),n.current=t,function(){n.current=null}}function cg(t,n,a){a=a!=null?a.concat([t]):null,Sc(4,4,lg.bind(null,n,t),a)}function ih(){}function ug(t,n){var a=gn();n=n===void 0?null:n;var r=a.memoizedState;return n!==null&&qf(n,r[1])?r[0]:(a.memoizedState=[t,n],t)}function fg(t,n){var a=gn();n=n===void 0?null:n;var r=a.memoizedState;if(n!==null&&qf(n,r[1]))return r[0];if(r=t(),qs){Ue(!0);try{t()}finally{Ue(!1)}}return a.memoizedState=[r,n],r}function ah(t,n,a){return a===void 0||(Na&1073741824)!==0&&(Ne&261930)===0?t.memoizedState=n:(t.memoizedState=a,t=y_(),me.lanes|=t,fs|=t,a)}function hg(t,n,a,r){return ui(a,n)?a:ss.current!==null?(t=ah(t,a,r),ui(t,n)||(Sn=!0),t):(Na&106)===0||(Na&1073741824)!==0&&(Ne&261930)===0?(Sn=!0,t.memoizedState=a):(t=y_(),me.lanes|=t,fs|=t,n)}function dg(t,n,a,r,c){var u=Ut.p;Ut.p=u!==0&&8>u?u:8;var g=vt.T,w={};w.types=g!==null?g.types:null,vt.T=w,oh(t,!1,n,a);try{var z=c(),$=vt.S;if($!==null&&$(w,z),z!==null&&typeof z=="object"&&typeof z.then=="function"){var ht=Vy(z,r);Zo(t,n,ht,mi(t))}else Zo(t,n,r,mi(t))}catch(Et){Zo(t,n,{then:function(){},status:"rejected",reason:Et},mi())}finally{Ut.p=u,g!==null&&w.types!==null&&(g.types=w.types),vt.T=g}}function jy(){}function sh(t,n,a,r){if(t.tag!==5)throw Error(s(476));var c=pg(t).queue;dg(t,c,n,be,a===null?jy:function(){return mg(t),a(r)})}function pg(t){var n=t.memoizedState;if(n!==null)return n;n={memoizedState:be,baseState:be,baseQueue:null,queue:{pending:null,lanes:0,dispatch:null,lastRenderedReducer:Da,lastRenderedState:be},next:null};var a={};return n.next={memoizedState:a,baseState:a,baseQueue:null,queue:{pending:null,lanes:0,dispatch:null,lastRenderedReducer:Da,lastRenderedState:a},next:null},t.memoizedState=n,t=t.alternate,t!==null&&(t.memoizedState=n),n}function mg(t){var n=pg(t);n.next===null&&(n=t.alternate.memoizedState),Zo(t,n.next.queue,{},mi())}function rh(){return Ln(jr)}function gg(){return gn().memoizedState}function _g(){return gn().memoizedState}function Zy(t){for(var n=t.return;n!==null;){switch(n.tag){case 24:case 3:var a=mi();t=is(a);var r=as(n,t,a);r!==null&&(ii(r,n,a),ko(r,n,a)),n={cache:Of()},t.payload=n;return}n=n.return}}function Ky(t,n,a){var r=mi();a={lane:r,revertLane:0,gesture:null,action:a,hasEagerState:!1,eagerState:null,next:null},yc(t)?xg(n,a):(a=Tf(t,n,a,r),a!==null&&(ii(a,t,r),Sg(a,n,r)))}function vg(t,n,a){var r=mi();Zo(t,n,a,r)}function Zo(t,n,a,r){var c={lane:r,revertLane:0,gesture:null,action:a,hasEagerState:!1,eagerState:null,next:null};if(yc(t))xg(n,c);else{var u=t.alternate;if(t.lanes===0&&(u===null||u.lanes===0)&&(u=n.lastRenderedReducer,u!==null))try{var g=n.lastRenderedState,w=u(g,a);if(c.hasEagerState=!0,c.eagerState=w,ui(w,g))return Jl(t,n,c,0),tn===null&&Ql(),!1}catch{}if(a=Tf(t,n,c,r),a!==null)return ii(a,t,r),Sg(a,n,r),!0}return!1}function oh(t,n,a,r){if(r={lane:2,revertLane:Qh(),gesture:null,action:r,hasEagerState:!1,eagerState:null,next:null},yc(t)){if(n)throw Error(s(479))}else n=Tf(t,a,r,2),n!==null&&ii(n,t,2)}function yc(t){var n=t.alternate;return t===me||n!==null&&n===me}function xg(t,n){Rr=pc=!0;var a=t.pending;a===null?n.next=n:(n.next=a.next,a.next=n),t.pending=n}function Sg(t,n,a){if((a&4194048)!==0){var r=n.lanes;r&=t.pendingLanes,a|=r,n.lanes=a,bo(t,a)}}var Mc={readContext:Ln,use:_c,useCallback:dn,useContext:dn,useEffect:dn,useImperativeHandle:dn,useLayoutEffect:dn,useInsertionEffect:dn,useMemo:dn,useReducer:dn,useRef:dn,useState:dn,useDebugValue:dn,useDeferredValue:dn,useTransition:dn,useSyncExternalStore:dn,useId:dn,useHostTransitionStatus:dn,useFormState:dn,useActionState:dn,useOptimistic:dn,useMemoCache:dn,useCacheRefresh:dn,useEffectEvent:dn},yg={readContext:Ln,use:_c,useCallback:function(t,n){return qn().memoizedState=[t,n===void 0?null:n],t},useContext:Ln,useEffect:ag,useImperativeHandle:function(t,n,a){a=a!=null?a.concat([t]):null,xc(4194308,4,lg.bind(null,n,t),a)},useLayoutEffect:function(t,n){return xc(4194308,4,t,n)},useInsertionEffect:function(t,n){xc(4,2,t,n)},useMemo:function(t,n){var a=qn();n=n===void 0?null:n;var r=t();if(qs){Ue(!0);try{t()}finally{Ue(!1)}}return a.memoizedState=[r,n],r},useReducer:function(t,n,a){var r=qn();if(a!==void 0){var c=a(n);if(qs){Ue(!0);try{a(n)}finally{Ue(!1)}}}else c=n;return r.memoizedState=r.baseState=c,t={pending:null,lanes:0,dispatch:null,lastRenderedReducer:t,lastRenderedState:c},r.queue=t,t=t.dispatch=Ky.bind(null,me,t),[r.memoizedState,t]},useRef:function(t){var n=qn();return t={current:t},n.memoizedState=t},useState:function(t){t=th(t);var n=t.queue,a=vg.bind(null,me,n);return n.dispatch=a,[t.memoizedState,a]},useDebugValue:ih,useDeferredValue:function(t,n){var a=qn();return ah(a,t,n)},useTransition:function(){var t=th(!1);return t=dg.bind(null,me,t.queue,!0,!1),qn().memoizedState=t,[!1,t]},useSyncExternalStore:function(t,n,a){var r=me,c=qn();if(ye){if(a===void 0)throw Error(s(407));a=a()}else{if(a=n(),tn===null)throw Error(s(349));(Ne&127)!==0||V0(r,n,a)}c.memoizedState=a;var u={value:a,getSnapshot:n};return c.queue=u,ag(X0.bind(null,r,u,t),[t]),r.flags|=2048,Cr(9,{destroy:void 0},k0.bind(null,r,u,a,n),null),a},useId:function(){var t=qn(),n=tn.identifierPrefix;if(ye){var a=na,r=ea;a=(r&~(1<<32-fe(r)-1)).toString(32)+a,n="_"+n+"R_"+a,a=mc++,0<a&&(n+="H"+a.toString(32)),n+="_"}else a=ky++,n="_"+n+"r_"+a.toString(32)+"_";return t.memoizedState=n},useHostTransitionStatus:rh,useFormState:$0,useActionState:$0,useOptimistic:function(t){var n=qn();n.memoizedState=n.baseState=t;var a={pending:null,lanes:0,dispatch:null,lastRenderedReducer:null,lastRenderedState:null};return n.queue=a,n=oh.bind(null,me,!0,a),a.dispatch=n,[t,n]},useMemoCache:Qf,useCacheRefresh:function(){return qn().memoizedState=Zy.bind(null,me)},useEffectEvent:function(t){var n=qn(),a={impl:t};return n.memoizedState=a,function(){if((Ge&2)!==0)throw Error(s(440));return a.impl.apply(void 0,arguments)}}},Mg={readContext:Ln,use:_c,useCallback:ug,useContext:Ln,useEffect:nh,useImperativeHandle:cg,useInsertionEffect:rg,useLayoutEffect:og,useMemo:fg,useReducer:vc,useRef:ig,useState:function(){return vc(Da)},useDebugValue:ih,useDeferredValue:function(t,n){var a=gn();return hg(a,Je.memoizedState,t,n)},useTransition:function(){var t=vc(Da)[0],n=gn().memoizedState;return[typeof t=="boolean"?t:jo(t),n]},useSyncExternalStore:G0,useId:gg,useHostTransitionStatus:rh,useFormState:tg,useActionState:tg,useOptimistic:function(t,n){var a=gn();return Y0(a,Je,t,n)},useMemoCache:Qf,useCacheRefresh:_g,useEffectEvent:sg},Qy={readContext:Ln,use:_c,useCallback:ug,useContext:Ln,useEffect:nh,useImperativeHandle:cg,useInsertionEffect:rg,useLayoutEffect:og,useMemo:fg,useReducer:$f,useRef:ig,useState:function(){return $f(Da)},useDebugValue:ih,useDeferredValue:function(t,n){var a=gn();return Je===null?ah(a,t,n):hg(a,Je.memoizedState,t,n)},useTransition:function(){var t=$f(Da)[0],n=gn().memoizedState;return[typeof t=="boolean"?t:jo(t),n]},useSyncExternalStore:G0,useId:gg,useHostTransitionStatus:rh,useFormState:ng,useActionState:ng,useOptimistic:function(t,n){var a=gn();return Je!==null?Y0(a,Je,t,n):(a.baseState=t,[t,a.queue.dispatch])},useMemoCache:Qf,useCacheRefresh:_g,useEffectEvent:sg};function lh(t,n,a,r){n=t.memoizedState,a=a(r,n),a=a==null?n:I({},n,a),t.memoizedState=a,t.lanes===0&&(t.updateQueue.baseState=a)}var ch={enqueueSetState:function(t,n,a){t=t._reactInternals;var r=mi(),c=is(r);c.payload=n,a!=null&&(c.callback=a),n=as(t,c,r),n!==null&&(ii(n,t,r),ko(n,t,r))},enqueueReplaceState:function(t,n,a){t=t._reactInternals;var r=mi(),c=is(r);c.tag=1,c.payload=n,a!=null&&(c.callback=a),n=as(t,c,r),n!==null&&(ii(n,t,r),ko(n,t,r))},enqueueForceUpdate:function(t,n){t=t._reactInternals;var a=mi(),r=is(a);r.tag=2,n!=null&&(r.callback=n),n=as(t,r,a),n!==null&&(ii(n,t,a),ko(n,t,a))}};function Eg(t,n,a,r,c,u,g){return t=t.stateNode,typeof t.shouldComponentUpdate=="function"?t.shouldComponentUpdate(r,u,g):n.prototype&&n.prototype.isPureReactComponent?!Po(a,r)||!Po(c,u):!0}function bg(t,n,a,r){t=n.state,typeof n.componentWillReceiveProps=="function"&&n.componentWillReceiveProps(a,r),typeof n.UNSAFE_componentWillReceiveProps=="function"&&n.UNSAFE_componentWillReceiveProps(a,r),n.state!==t&&ch.enqueueReplaceState(n,n.state,null)}function Ys(t,n){var a=n;if("ref"in n){a={};for(var r in n)r!=="ref"&&(a[r]=n[r])}if(t=t.defaultProps){a===n&&(a=I({},a));for(var c in t)a[c]===void 0&&(a[c]=t[c])}return a}function Tg(t){Kl(t)}function Ag(t){console.error(t)}function Rg(t){Kl(t)}function Ec(t,n){try{var a=t.onUncaughtError;a(n.value,{componentStack:n.stack})}catch(r){setTimeout(function(){throw r})}}function wg(t,n,a){try{var r=t.onCaughtError;r(a.value,{componentStack:a.stack,errorBoundary:n.tag===1?n.stateNode:null})}catch(c){setTimeout(function(){throw c})}}function uh(t,n,a){return a=is(a),a.tag=3,a.payload={element:null},a.callback=function(){Ec(t,n)},a}function Cg(t){return t=is(t),t.tag=3,t}function Ng(t,n,a,r){var c=a.type.getDerivedStateFromError;if(typeof c=="function"){var u=r.value;t.payload=function(){return c(u)},t.callback=function(){wg(n,a,r)}}var g=a.stateNode;g!==null&&typeof g.componentDidCatch=="function"&&(t.callback=function(){wg(n,a,r),typeof c!="function"&&(hs===null?hs=new Set([this]):hs.add(this));var w=r.stack;this.componentDidCatch(r.value,{componentStack:w!==null?w:""})})}function Jy(t,n,a,r,c){if(a.flags|=32768,r!==null&&typeof r=="object"&&typeof r.then=="function"){if(n=a.alternate,n!==null&&Fs(n,a,c,!0),a=On.current,a!==null){switch(a.tag){case 31:case 13:case 19:return Hn===null?Xc():a.alternate===null&&pn===0&&(pn=3),a.flags&=-257,a.flags|=65536,a.lanes=c,r===cc?a.flags|=16384:(n=a.updateQueue,n===null?a.updateQueue=new Set([r]):n.add(r),jh(t,r,c)),!1;case 22:return a.flags|=65536,r===cc?a.flags|=16384:(n=a.updateQueue,n===null?(n={transitions:null,markerInstances:null,retryQueue:new Set([r])},a.updateQueue=n):(a=n.retryQueue,a===null?n.retryQueue=new Set([r]):a.add(r)),jh(t,r,c)),!1}throw Error(s(435,a.tag))}return jh(t,r,c),Xc(),!1}if(ye)return n=On.current,n!==null?((n.flags&65536)===0&&(n.flags|=256),n.flags|=65536,n.lanes=c,r!==Nf&&(t=Error(s(422),{cause:r}),Bo(Ri(t,a)))):(r!==Nf&&(n=Error(s(423),{cause:r}),Bo(Ri(n,a))),t=t.current.alternate,t.flags|=65536,c&=-c,t.lanes|=c,r=Ri(r,a),c=uh(t.stateNode,r,c),Hf(t,c),pn!==4&&(pn=2)),!1;var u=Error(s(520),{cause:r});if(u=Ri(u,a),il===null?il=[u]:il.push(u),pn!==4&&(pn=2),n===null)return!0;r=Ri(r,a),a=n;do{switch(a.tag){case 3:return a.flags|=65536,t=c&-c,a.lanes|=t,t=uh(a.stateNode,r,t),Hf(a,t),!1;case 1:if(n=a.type,u=a.stateNode,(a.flags&128)===0&&(typeof n.getDerivedStateFromError=="function"||u!==null&&typeof u.componentDidCatch=="function"&&(hs===null||!hs.has(u))))return a.flags|=65536,c&=-c,a.lanes|=c,c=Cg(c),Ng(c,t,a,r),Hf(a,c),!1;break;case 22:if(a.memoizedState!==null)return a.flags|=65536,!1}a=a.return}while(a!==null);return!1}var fh=Error(s(461)),Sn=!1;function bn(t,n,a,r){n.child=t===null?O0(n,null,a,r):Ws(n,t.child,a,r)}function Dg(t,n,a,r,c){a=a.render;var u=n.ref;if("ref"in r){var g={};for(var w in r)w!=="ref"&&(g[w]=r[w])}else g=r;return Hs(n),r=Yf(t,n,a,g,u,c),w=jf(),t!==null&&!Sn?(Zf(t,n,c),Ua(t,n,c)):(ye&&w&&nc(n),n.flags|=1,bn(t,n,r,c),n.child)}function Ug(t,n,a,r,c){if(t===null){var u=a.type;return typeof u=="function"&&!Af(u)&&u.defaultProps===void 0&&a.compare===null?(n.tag=15,n.type=u,Lg(t,n,u,r,c)):(t=tc(a.type,null,r,n,n.mode,c),t.ref=n.ref,t.return=n,n.child=t)}if(u=t.child,!xh(t,c)){var g=u.memoizedProps;if(a=a.compare,a=a!==null?a:Po,a(g,r)&&t.ref===n.ref)return Ua(t,n,c)}return n.flags|=1,t=Aa(u,r),t.ref=n.ref,t.return=n,n.child=t}function Lg(t,n,a,r,c){if(t!==null){var u=t.memoizedProps;if(Po(u,r)&&t.ref===n.ref)if(Sn=!1,n.pendingProps=r=u,xh(t,c))(t.flags&131072)!==0&&(Sn=!0);else return n.lanes=t.lanes,Ua(t,n,c)}return hh(t,n,a,r,c)}function Og(t,n,a,r){var c=r.children,u=t!==null?t.memoizedState:null;if(t===null&&n.stateNode===null&&(n.stateNode={_visibility:1,_pendingMarkers:null,_retryCache:null,_transitions:null}),r.mode==="hidden"){if((n.flags&128)!==0){if(u=u!==null?u.baseLanes|a:a,t!==null){for(r=n.child=t.child,c=0;r!==null;)c=c|r.lanes|r.childLanes,r=r.sibling;r=c&~u}else r=0,n.child=null;return Pg(t,n,u,a,r)}if((a&536870912)!==0)n.memoizedState={baseLanes:0,cachePool:null},t!==null&&oc(n,u!==null?u.cachePool:null),u!==null?z0(n,u):Vf(),B0(n);else return r=n.lanes=536870912,Pg(t,n,u!==null?u.baseLanes|a:a,a,r)}else u!==null?(oc(n,u.cachePool),z0(n,u),os(),n.memoizedState=null):(t!==null&&oc(n,null),Vf(),os());return bn(t,n,c,a),n.child}function Ko(t,n){return t!==null&&t.tag===22||n.stateNode!==null||(n.stateNode={_visibility:1,_pendingMarkers:null,_retryCache:null,_transitions:null}),n.sibling}function Pg(t,n,a,r,c){var u=If();return u=u===null?null:{parent:vn._currentValue,pool:u},n.memoizedState={baseLanes:a,cachePool:u},t!==null&&oc(n,null),Vf(),B0(n),t!==null&&Fs(t,n,r,!0),n.childLanes=c,null}function bc(t,n){return n=Tc({mode:n.mode,children:n.children},t.mode),n.ref=t.ref,t.child=n,n.return=t,n}function Ig(t,n,a){return Ws(n,t.child,null,a),t=bc(n,n.pendingProps),t.flags|=2,fi(n),n.memoizedState=null,t}function $y(t,n,a){var r=n.pendingProps,c=(n.flags&128)!==0;if(n.flags&=-129,t===null){if(ye){if(r.mode==="hidden")return t=bc(n,r),n.lanes=536870912,t.memoizedState={baseLanes:0,cachePool:null},Ko(null,t);if(Xf(n),(t=nn)?(t=lv(t,Ni),t=t!==null&&t.data==="&"?t:null,t!==null&&(n.memoizedState={dehydrated:t,treeContext:Qa!==null?{id:ea,overflow:na}:null,retryLane:536870912,hydrationErrors:null},a=x0(t),a.return=n,n.child=a,wn=n,nn=null)):t=null,t===null)throw $a(n);return n.lanes=536870912,null}return bc(n,r)}var u=t.memoizedState;if(u!==null){var g=u.dehydrated;if(Xf(n),c)if(n.flags&256)n.flags&=-257,n=Ig(t,n,a);else if(n.memoizedState!==null)n.child=t.child,n.flags|=128,n=null;else throw Error(s(558));else if(Sn||Fs(t,n,a,!1),c=(a&t.childLanes)!==0,Sn||c){if(ss.current===null){if(r=tn,r!==null&&(g=To(r,a),g!==0&&g!==u.retryLane))throw u.retryLane=g,Ps(t,g),ii(r,t,g),fh;Xc()}n=Ig(t,n,a)}else t=u.treeContext,nn=Ui(g.nextSibling),wn=n,ye=!0,Ja=null,Ni=!1,t!==null&&M0(n,t),n=bc(n,r),n.flags|=134221824;return n}return t=Aa(t.child,{mode:r.mode,children:r.children}),t.ref=n.ref,n.child=t,t.return=n,t}function Nr(t,n){var a=n.ref;if(a===null)t!==null&&t.ref!==null&&(n.flags|=4194816);else{if(typeof a!="function"&&typeof a!="object")throw Error(s(284));(t===null||t.ref!==a)&&(n.flags|=4194816)}}function hh(t,n,a,r,c){return Hs(n),a=Yf(t,n,a,r,void 0,c),r=jf(),t!==null&&!Sn?(Zf(t,n,c),Ua(t,n,c)):(ye&&r&&nc(n),n.flags|=1,bn(t,n,a,c),n.child)}function zg(t,n,a,r,c,u){return Hs(n),n.updateQueue=null,a=H0(n,r,a,c),F0(t),r=jf(),t!==null&&!Sn?(Zf(t,n,u),Ua(t,n,u)):(ye&&r&&nc(n),n.flags|=1,bn(t,n,a,u),n.child)}function Bg(t,n,a,r,c){if(Hs(n),n.stateNode===null){var u=Sr,g=a.contextType;typeof g=="object"&&g!==null&&(u=Ln(g)),u=new a(r,u),n.memoizedState=u.state!==null&&u.state!==void 0?u.state:null,u.updater=ch,n.stateNode=u,u._reactInternals=n,u=n.stateNode,u.props=r,u.state=n.memoizedState,u.refs={},Bf(n),g=a.contextType,u.context=typeof g=="object"&&g!==null?Ln(g):Sr,u.state=n.memoizedState,g=a.getDerivedStateFromProps,typeof g=="function"&&(lh(n,a,g,r),u.state=n.memoizedState),typeof a.getDerivedStateFromProps=="function"||typeof u.getSnapshotBeforeUpdate=="function"||typeof u.UNSAFE_componentWillMount!="function"&&typeof u.componentWillMount!="function"||(g=u.state,typeof u.componentWillMount=="function"&&u.componentWillMount(),typeof u.UNSAFE_componentWillMount=="function"&&u.UNSAFE_componentWillMount(),g!==u.state&&ch.enqueueReplaceState(u,u.state,null),Wo(n,r,u,c),Xo(),u.state=n.memoizedState),typeof u.componentDidMount=="function"&&(n.flags|=4194308),r=!0}else if(t===null){u=n.stateNode;var w=n.memoizedProps,z=Ys(a,w);u.props=z;var $=u.context,ht=a.contextType;g=Sr,typeof ht=="object"&&ht!==null&&(g=Ln(ht));var Et=a.getDerivedStateFromProps;ht=typeof Et=="function"||typeof u.getSnapshotBeforeUpdate=="function",w=n.pendingProps!==w,ht||typeof u.UNSAFE_componentWillReceiveProps!="function"&&typeof u.componentWillReceiveProps!="function"||(w||$!==g)&&bg(n,u,r,g),ns=!1;var K=n.memoizedState;u.state=K,Wo(n,r,u,c),Xo(),$=n.memoizedState,w||K!==$||ns?(typeof Et=="function"&&(lh(n,a,Et,r),$=n.memoizedState),(z=ns||Eg(n,a,z,r,K,$,g))?(ht||typeof u.UNSAFE_componentWillMount!="function"&&typeof u.componentWillMount!="function"||(typeof u.componentWillMount=="function"&&u.componentWillMount(),typeof u.UNSAFE_componentWillMount=="function"&&u.UNSAFE_componentWillMount()),typeof u.componentDidMount=="function"&&(n.flags|=4194308)):(typeof u.componentDidMount=="function"&&(n.flags|=4194308),n.memoizedProps=r,n.memoizedState=$),u.props=r,u.state=$,u.context=g,r=z):(typeof u.componentDidMount=="function"&&(n.flags|=4194308),r=!1)}else{u=n.stateNode,Ff(t,n),g=n.memoizedProps,ht=Ys(a,g),u.props=ht,Et=n.pendingProps,K=u.context,$=a.contextType,z=Sr,typeof $=="object"&&$!==null&&(z=Ln($)),w=a.getDerivedStateFromProps,($=typeof w=="function"||typeof u.getSnapshotBeforeUpdate=="function")||typeof u.UNSAFE_componentWillReceiveProps!="function"&&typeof u.componentWillReceiveProps!="function"||(g!==Et||K!==z)&&bg(n,u,r,z),ns=!1,K=n.memoizedState,u.state=K,Wo(n,r,u,c),Xo();var ct=n.memoizedState;g!==Et||K!==ct||ns||t!==null&&t.dependencies!==null&&sc(t.dependencies)?(typeof w=="function"&&(lh(n,a,w,r),ct=n.memoizedState),(ht=ns||Eg(n,a,ht,r,K,ct,z)||t!==null&&t.dependencies!==null&&sc(t.dependencies))?($||typeof u.UNSAFE_componentWillUpdate!="function"&&typeof u.componentWillUpdate!="function"||(typeof u.componentWillUpdate=="function"&&u.componentWillUpdate(r,ct,z),typeof u.UNSAFE_componentWillUpdate=="function"&&u.UNSAFE_componentWillUpdate(r,ct,z)),typeof u.componentDidUpdate=="function"&&(n.flags|=4),typeof u.getSnapshotBeforeUpdate=="function"&&(n.flags|=1024)):(typeof u.componentDidUpdate!="function"||g===t.memoizedProps&&K===t.memoizedState||(n.flags|=4),typeof u.getSnapshotBeforeUpdate!="function"||g===t.memoizedProps&&K===t.memoizedState||(n.flags|=1024),n.memoizedProps=r,n.memoizedState=ct),u.props=r,u.state=ct,u.context=z,r=ht):(typeof u.componentDidUpdate!="function"||g===t.memoizedProps&&K===t.memoizedState||(n.flags|=4),typeof u.getSnapshotBeforeUpdate!="function"||g===t.memoizedProps&&K===t.memoizedState||(n.flags|=1024),r=!1)}return u=r,Nr(t,n),r=(n.flags&128)!==0,u||r?(u=n.stateNode,a=r&&typeof a.getDerivedStateFromError!="function"?null:u.render(),n.flags|=1,t!==null&&r?(n.child=Ws(n,t.child,null,c),n.child=Ws(n,null,a,c)):bn(t,n,a,c),n.memoizedState=u.state,t=n.child):t=Ua(t,n,c),t}function Fg(t,n,a,r){return zs(),n.flags|=256,bn(t,n,a,r),n.child}var dh={dehydrated:null,treeContext:null,retryLane:0,hydrationErrors:null};function ph(t){return{baseLanes:t,cachePool:w0()}}function mh(t,n,a){return t=t!==null?t.childLanes&~a:0,n&&(t|=pi),t}function Hg(t,n,a){var r=n.pendingProps,c=!1,u=(n.flags&128)!==0,g;if((g=u)||(g=t!==null&&t.memoizedState===null?!1:(Pn.current&2)!==0),g&&(c=!0,n.flags&=-129),g=(n.flags&32)!==0,n.flags&=-33,t===null){if(ye){if(c?rs(n):os(),(t=nn)?(t=lv(t,Ni),t=t!==null&&t.data!=="&"?t:null,t!==null&&(n.memoizedState={dehydrated:t,treeContext:Qa!==null?{id:ea,overflow:na}:null,retryLane:536870912,hydrationErrors:null},a=x0(t),a.return=n,n.child=a,wn=n,nn=null)):t=null,t===null)throw $a(n);return pd(t)?n.lanes=32:n.lanes=536870912,null}return u=r.children,r=r.fallback,c?(os(),c=n.mode,u=Tc({mode:"hidden",children:u},c),r=Is(r,c,a,null),u.return=n,r.return=n,u.sibling=r,n.child=u,r=n.child,r.memoizedState=ph(a),r.childLanes=mh(t,g,a),n.memoizedState=dh,Ko(null,r)):(rs(n),gh(n,u))}var w=t.memoizedState;if(w!==null){var z=w.dehydrated;if(z!==null)return tM(t,n,u,g,r,z,w,a)}return c?(os(),c=r.fallback,u=n.mode,w=t.child,z=w.sibling,r=Aa(w,{mode:"hidden",children:r.children}),r.subtreeFlags=w.subtreeFlags&1206910976,z!==null?c=Aa(z,c):(c=Is(c,u,a,null),c.flags|=2),c.return=n,r.return=n,r.sibling=c,n.child=r,Ko(null,r),r=n.child,c=t.child.memoizedState,c===null?c=ph(a):(u=c.cachePool,u!==null?(w=vn._currentValue,u=u.parent!==w?{parent:w,pool:w}:u):u=w0(),c={baseLanes:c.baseLanes|a,cachePool:u}),r.memoizedState=c,r.childLanes=mh(t,g,a),n.memoizedState=dh,Ko(t.child,r)):(rs(n),a=t.child,t=a.sibling,a=Aa(a,{mode:"visible",children:r.children}),a.return=n,a.sibling=null,t!==null&&(g=n.deletions,g===null?(n.deletions=[t],n.flags|=16):g.push(t)),n.child=a,n.memoizedState=null,a)}function gh(t,n){return n=Tc({mode:"visible",children:n},t.mode),n.return=t,t.child=n}function Tc(t,n){return t=$n(22,t,null,n),t.lanes=0,t}function Ac(t,n,a){return Ws(n,t.child,null,a),t=gh(n,n.pendingProps.children),t.flags|=2,n.memoizedState=null,t}function tM(t,n,a,r,c,u,g,w){if(a)return n.flags&256?(rs(n),n.flags&=-257,Ac(t,n,w)):n.memoizedState!==null?(os(),n.child=t.child,n.flags|=128,null):(os(),u=c.fallback,g=n.mode,c=Tc({mode:"visible",children:c.children},g),u=Is(u,g,w,null),u.flags|=2,c.return=n,u.return=n,c.sibling=u,n.child=c,Ws(n,t.child,null,w),c=n.child,c.memoizedState=ph(w),c.childLanes=mh(t,r,w),n.memoizedState=dh,Ko(null,c));if(rs(n),pd(u)){if(r=u.nextSibling&&u.nextSibling.dataset,r)var z=r.dgst;return r=z,r!==""&&(c=Error(s(419)),c.stack="",c.digest=r,Bo({value:c,source:null,stack:null})),Ac(t,n,w)}if(Sn||Fs(t,n,w,!1),r=(w&t.childLanes)!==0,Sn||r){if(ss.current!==null)return Ac(t,n,w);if(r=tn,r!==null&&(c=To(r,w),c!==0&&c!==g.retryLane))throw g.retryLane=c,Ps(t,c),ii(r,t,c),fh;return dd(u)||Xc(),Ac(t,n,w)}return dd(u)?(n.flags|=192,n.child=t.child,null):(t=g.treeContext,nn=Ui(u.nextSibling),wn=n,ye=!0,Ja=null,Ni=!1,t!==null&&M0(n,t),n=gh(n,c.children),n.flags|=134221824,n)}function Gg(t,n,a){t.lanes|=n;var r=t.alternate;r!==null&&(r.lanes|=n),ac(t.return,n,a)}function Vg(t){for(var n=null;t!==null;){var a=t.alternate;a!==null&&dc(a)===null&&(n=t),t=t.sibling}return n}function Rc(t,n,a,r,c,u){var g=t.memoizedState;g===null?t.memoizedState={isBackwards:n,rendering:null,renderingStartTime:0,last:r,tail:a,tailMode:c,treeForkCount:u}:(g.isBackwards=n,g.rendering=null,g.renderingStartTime=0,g.last=r,g.tail=a,g.tailMode=c,g.treeForkCount=u)}function _h(t){var n=t.child;for(t.child=null;n!==null;){var a=n.sibling;n.sibling=t.child,t.child=n,n=a}}function vh(t,n,a){var r=n.pendingProps,c=r.revealOrder,u=r.tail;r=r.children;var g=Pn.current;if(n.flags&128)return qo(n,g),null;var w=(g&2)!==0;if(w?(g=g&1|2,n.flags|=128):g&=1,qo(n,g),c==="backwards"&&t!==null?(_h(t),bn(t,n,r,a),_h(t)):bn(t,n,r,a),r=ye?zo:0,!w&&t!==null&&(t.flags&128)!==0)t:for(t=n.child;t!==null;){if(t.tag===13)t.memoizedState!==null&&Gg(t,a,n);else if(t.tag===19)Gg(t,a,n);else if(t.child!==null){t.child.return=t,t=t.child;continue}if(t===n)break t;for(;t.sibling===null;){if(t.return===null||t.return===n)break t;t=t.return}t.sibling.return=t.return,t=t.sibling}switch(c){case"backwards":a=Vg(n.child),a===null?(c=n.child,n.child=null):(c=a.sibling,a.sibling=null,_h(n)),Rc(n,!0,c,null,u,r);break;case"unstable_legacy-backwards":for(a=null,c=n.child,n.child=null;c!==null;){if(t=c.alternate,t!==null&&dc(t)===null){n.child=c;break}t=c.sibling,c.sibling=a,a=c,c=t}Rc(n,!0,a,null,u,r);break;case"together":Rc(n,!1,null,null,void 0,r);break;case"independent":n.memoizedState=null;break;default:a=Vg(n.child),a===null?(c=n.child,n.child=null):(c=a.sibling,a.sibling=null),Rc(n,!1,c,a,u,r)}return n.child}function kg(t,n,a){var r=n.pendingProps;return ts(n,n.type,r.value),bn(t,n,r.children,a),n.child}function Ua(t,n,a){if(t!==null&&(n.dependencies=t.dependencies),fs|=n.lanes,(a&n.childLanes)===0)if(t!==null){if(Fs(t,n,a,!1),(a&n.childLanes)===0)return null}else return null;if(t!==null&&n.child!==t.child)throw Error(s(153));if(n.child!==null){for(t=n.child,a=Aa(t,t.pendingProps),n.child=a,a.return=n;t.sibling!==null;)t=t.sibling,a=a.sibling=Aa(t,t.pendingProps),a.return=n;a.sibling=null}return n.child}function xh(t,n){return(t.lanes&n)!==0?!0:(t=t.dependencies,!!(t!==null&&sc(t)))}function eM(t,n,a){switch(n.tag){case 3:X(n,n.stateNode.containerInfo),ts(n,vn,t.memoizedState.cache),zs();break;case 27:case 5:Ee(n);break;case 4:X(n,n.stateNode.containerInfo);break;case 10:ts(n,n.type,n.memoizedProps.value);break;case 31:if(n.memoizedState!==null)return n.flags|=128,Xf(n),null;break;case 13:var r=n.memoizedState;if(r!==null){if(r.dehydrated!==null)return rs(n),n.flags|=128,null;r=Fs(t,n,a,!1);var c=n.child.childLanes;return r||(a&c)!==0?Hg(t,n,a):(rs(n),t=Ua(t,n,a),t!==null?t.sibling:null)}rs(n);break;case 19:if(n.flags&128)return vh(t,n,a);if(c=(t.flags&128)!==0,r=(a&n.childLanes)!==0,r||(Fs(t,n,a,!1),r=(a&n.childLanes)!==0),c){if(r)return vh(t,n,a);n.flags|=128}if(c=n.memoizedState,c!==null&&(c.rendering=null,c.tail=null,c.lastEffect=null),qo(n,Pn.current),r)break;return null;case 22:return n.lanes=0,Og(t,n,a,n.pendingProps);case 24:ts(n,vn,t.memoizedState.cache)}return Ua(t,n,a)}function Xg(t,n,a){if(t!==null)if(t.memoizedProps!==n.pendingProps)Sn=!0;else{if(!xh(t,a)&&(n.flags&128)===0)return Sn=!1,eM(t,n,a);Sn=(t.flags&131072)!==0}else Sn=!1,ye&&(n.flags&1048576)!==0&&y0(n,zo,n.index);switch(n.lanes=0,n.tag){case 16:t:{var r=n.pendingProps;if(t=ks(n.elementType),n.type=t,typeof t=="function")Af(t)?(r=Ys(t,r),n.tag=1,n=Bg(null,n,t,r,a)):(n.tag=0,n=hh(null,n,t,r,a));else{if(t!=null){var c=t.$$typeof;if(c===q){n.tag=11,n=Dg(null,n,t,r,a);break t}else if(c===ut){n.tag=14,n=Ug(null,n,t,r,a);break t}else if(c===tt){n.tag=10,n.type=t,n=kg(null,n,a);break t}}throw n=Ct(t)||t,Error(s(306,n,""))}}return n;case 0:return hh(t,n,n.type,n.pendingProps,a);case 1:return r=n.type,c=Ys(r,n.pendingProps),Bg(t,n,r,c,a);case 3:t:{if(X(n,n.stateNode.containerInfo),t===null)throw Error(s(387));r=n.pendingProps;var u=n.memoizedState;c=u.element,Ff(t,n),Wo(n,r,null,a);var g=n.memoizedState;if(r=g.cache,ts(n,vn,r),r!==u.cache&&Lf(n,[vn],a,!0),Xo(),r=g.element,u.isDehydrated)if(u={element:r,isDehydrated:!1,cache:g.cache},n.updateQueue.baseState=u,n.memoizedState=u,n.flags&256){n=Fg(t,n,r,a);break t}else if(r!==c){c=Ri(Error(s(424)),n),Bo(c),n=Fg(t,n,r,a);break t}else for(t=n.stateNode.containerInfo,t.nodeType===9?t=t.body:t=t.nodeName==="HTML"?t.ownerDocument.body:t,nn=Ui(t.firstChild),wn=n,ye=!0,Ja=null,Ni=!0,a=O0(n,null,r,a),n.child=a;a;)a.flags=a.flags&-3|134221824,a=a.sibling;else{if(zs(),r===c){n=Ua(t,n,a);break t}bn(t,n,r,a)}n=n.child}return n;case 26:return Nr(t,n),t===null?(a=mv(n.type,null,n.pendingProps,null))?n.memoizedState=a:ye||(n.stateNode=j_(n.type,n.pendingProps,Pe.current,n)):n.memoizedState=mv(n.type,t.memoizedProps,n.pendingProps,t.memoizedState),null;case 27:return Ee(n),t===null&&ye&&(r=n.stateNode=fv(n.type,n.pendingProps,Pe.current),wn=n,Ni=!0,c=nn,ms(n.type)?(md=c,nn=Ui(r.firstChild)):nn=c),bn(t,n,n.pendingProps.children,a),Nr(t,n),t===null&&(n.flags|=4194304),n.child;case 5:return t===null&&ye&&((c=r=nn)&&(r=ZM(r,n.type,n.pendingProps,Ni),r!==null?(n.stateNode=r,wn=n,nn=Ui(r.firstChild),Ni=!1,c=!0):c=!1),c||$a(n)),Ee(n),c=n.type,u=n.pendingProps,g=t!==null?t.memoizedProps:null,r=u.children,rd(c,u)?r=null:g!==null&&rd(c,g)&&(n.flags|=32),n.memoizedState!==null&&(c=Yf(t,n,Xy,null,null,a),jr._currentValue=c),Nr(t,n),bn(t,n,r,a),n.child;case 6:return t===null&&ye&&((t=a=nn)&&(a=KM(a,n.pendingProps,Ni),a!==null?(n.stateNode=a,wn=n,nn=null,t=!0):t=!1),t||$a(n)),null;case 13:return Hg(t,n,a);case 4:return X(n,n.stateNode.containerInfo),r=n.pendingProps,t===null?n.child=Ws(n,null,r,a):bn(t,n,r,a),n.child;case 11:return Dg(t,n,n.type,n.pendingProps,a);case 7:return r=n.pendingProps,Nr(t,n),bn(t,n,r,a),n.child;case 8:return bn(t,n,n.pendingProps.children,a),n.child;case 12:return bn(t,n,n.pendingProps.children,a),n.child;case 10:return kg(t,n,a);case 9:return c=n.type._context,r=n.pendingProps.children,Hs(n),c=Ln(c),r=r(c),n.flags|=1,bn(t,n,r,a),n.child;case 14:return Ug(t,n,n.type,n.pendingProps,a);case 15:return Lg(t,n,n.type,n.pendingProps,a);case 19:return vh(t,n,a);case 31:return $y(t,n,a);case 22:return Og(t,n,a,n.pendingProps);case 24:return Hs(n),r=Ln(vn),t===null?(c=If(),c===null&&(c=tn,u=Of(),c.pooledCache=u,u.refCount++,u!==null&&(c.pooledCacheLanes|=a),c=u),n.memoizedState={parent:r,cache:c},Bf(n),ts(n,vn,c)):((t.lanes&a)!==0&&(Ff(t,n),Wo(n,null,null,a),Xo()),c=t.memoizedState,u=n.memoizedState,c.parent!==r?(c={parent:r,cache:r},n.memoizedState=c,n.lanes===0&&(n.memoizedState=n.updateQueue.baseState=c),ts(n,vn,r)):(r=u.cache,ts(n,vn,r),r!==c.cache&&Lf(n,[vn],a,!0))),bn(t,n,n.pendingProps.children,a),n.child;case 30:return n.stateNode===null&&(n.stateNode={autoName:null,paired:null,clones:null,ref:null}),r=n.pendingProps,r.name!=null&&r.name!=="auto"?n.flags|=t===null?18882560:18874368:ye&&nc(n),t!==null&&t.memoizedProps.name!==r.name?n.flags|=4194816:Nr(t,n),bn(t,n,r.children,a),n.child;case 29:throw n.pendingProps}throw Error(s(156,n.tag))}function La(t){t.flags|=4}function Sh(t,n,a,r,c){var u;if((u=(t.mode&32)!==0)&&(u=a===null?xv(n,r):xv(n,r)&&(r.src!==a.src||r.srcSet!==a.srcSet)),u){if(t.flags|=16777216,(c&335544128)===c)if(t.stateNode.complete)t.flags|=8192;else if(T_())t.flags|=8192;else throw Xs=cc,zf}else t.flags&=-16777217}function Wg(t,n){if(n.type!=="stylesheet"||(n.state.loading&4)!==0)t.flags&=-16777217;else if(t.flags|=16777216,!Sv(n))if(T_())t.flags|=8192;else throw Xs=cc,zf}function wc(t,n){n!==null&&(t.flags|=4),t.flags&16384&&(n=t.tag!==22?Eo():536870912,t.lanes|=n,Pr|=n)}function Qo(t,n){if(!ye)switch(t.tailMode){case"visible":break;case"collapsed":for(var a=t.tail,r=null;a!==null;)a.alternate!==null&&(r=a),a=a.sibling;r===null?n||t.tail===null?t.tail=null:t.tail.sibling=null:r.sibling=null;break;default:for(n=t.tail,a=null;n!==null;)n.alternate!==null&&(a=n),n=n.sibling;a===null?t.tail=null:a.sibling=null}}function an(t){var n=t.alternate!==null&&t.alternate.child===t.child,a=0,r=0;if(n)for(var c=t.child;c!==null;)a|=c.lanes|c.childLanes,r|=c.subtreeFlags&1206910976,r|=c.flags&1206910976,c.return=t,c=c.sibling;else for(c=t.child;c!==null;)a|=c.lanes|c.childLanes,r|=c.subtreeFlags,r|=c.flags,c.return=t,c=c.sibling;return t.subtreeFlags|=r,t.childLanes=a,n}function nM(t,n,a){var r=n.pendingProps;switch(Cf(n),n.tag){case 16:case 15:case 0:case 11:case 7:case 8:case 12:case 9:case 14:return an(n),null;case 1:return an(n),null;case 3:return a=n.stateNode,r=null,t!==null&&(r=t.memoizedState.cache),n.memoizedState.cache!==r&&(n.flags|=2048),Ca(vn),Ke(),a.pendingContext&&(a.context=a.pendingContext,a.pendingContext=null),(t===null||t.child===null)&&(Er(n)?La(n):t===null||t.memoizedState.isDehydrated&&(n.flags&256)===0||(n.flags|=1024,Df())),an(n),null;case 26:var c=n.type,u=n.memoizedState;return t===null?(La(n),u!==null?(an(n),Wg(n,u)):(an(n),Sh(n,c,null,r,a))):u?u!==t.memoizedState?(La(n),an(n),Wg(n,u)):(an(n),n.flags&=-16777217):(t=t.memoizedProps,t!==r&&La(n),an(n),Sh(n,c,t,r,a)),null;case 27:if(P(n),a=Pe.current,c=n.type,t!==null&&n.stateNode!=null)t.memoizedProps!==r&&La(n);else{if(!r){if(n.stateNode===null)throw Error(s(166));return an(n),n.subtreeFlags&=-33554433,null}t=Be.current,Er(n)?E0(n):(t=fv(c,r,a),n.stateNode=t,La(n))}return an(n),n.subtreeFlags&=-33554433,null;case 5:if(P(n),c=n.type,t!==null&&n.stateNode!=null)t.memoizedProps!==r&&La(n);else{if(!r){if(n.stateNode===null)throw Error(s(166));return an(n),n.subtreeFlags&=-33554433,null}if(u=Be.current,Er(n))E0(n);else{var g=ll(Pe.current);switch(u){case 1:u=g.createElementNS("http://www.w3.org/2000/svg",c);break;case 2:u=g.createElementNS("http://www.w3.org/1998/Math/MathML",c);break;default:switch(c){case"svg":u=g.createElementNS("http://www.w3.org/2000/svg",c);break;case"math":u=g.createElementNS("http://www.w3.org/1998/Math/MathML",c);break;case"script":u=g.createElement("div"),u.innerHTML="<script><\/script>",u=u.removeChild(u.firstChild);break;case"select":u=typeof r.is=="string"?g.createElement("select",{is:r.is}):g.createElement("select"),r.multiple?u.multiple=!0:r.size&&(u.size=r.size);break;default:u=typeof r.is=="string"?g.createElement(c,{is:r.is}):g.createElement(c)}}u[R]=n,u[H]=r;t:for(g=n.child;g!==null;){if(g.tag===5||g.tag===6)u.appendChild(g.stateNode);else if(g.tag!==4&&g.tag!==27&&g.child!==null){g.child.return=g,g=g.child;continue}if(g===n)break t;for(;g.sibling===null;){if(g.return===null||g.return===n)break t;g=g.return}g.sibling.return=g.return,g=g.sibling}n.stateNode=u;t:switch(zn(u,c,r),c){case"button":case"input":case"select":case"textarea":r=!!r.autoFocus;break t;case"img":r=!0;break t;default:r=!1}r&&La(n)}}return an(n),n.subtreeFlags&=-33554433,Sh(n,n.type,t===null?null:t.memoizedProps,n.pendingProps,a),null;case 6:if(t&&n.stateNode!=null)t.memoizedProps!==r&&La(n);else{if(typeof r!="string"&&n.stateNode===null)throw Error(s(166));if(t=Pe.current,Er(n)){if(t=n.stateNode,a=n.memoizedProps,r=null,c=wn,c!==null)switch(c.tag){case 27:case 5:r=c.memoizedProps}t[R]=n,t=!!(t.nodeValue===a||r!==null&&r.suppressHydrationWarning===!0||X_(t.nodeValue,a)),t||$a(n,!0)}else t=ll(t).createTextNode(r),t[R]=n,n.stateNode=t}return an(n),null;case 31:if(a=n.memoizedState,t===null||t.memoizedState!==null){if(r=Er(n),a!==null){if(t===null){if(!r)throw Error(s(318));if(t=n.memoizedState,t=t!==null?t.dehydrated:null,!t)throw Error(s(557));t[R]=n}else zs(),(n.flags&128)===0&&(n.memoizedState=null),n.flags|=4;an(n),t=!1}else a=Df(),t!==null&&t.memoizedState!==null&&(t.memoizedState.hydrationErrors=a),t=!0;if(!t)return n.flags&256?(fi(n),n):(fi(n),null);if((n.flags&128)!==0)throw Error(s(558))}return an(n),null;case 13:if(r=n.memoizedState,t===null||t.memoizedState!==null&&t.memoizedState.dehydrated!==null){if(c=Er(n),r!==null&&r.dehydrated!==null){if(t===null){if(!c)throw Error(s(318));if(c=n.memoizedState,c=c!==null?c.dehydrated:null,!c)throw Error(s(317));c[R]=n}else zs(),(n.flags&128)===0&&(n.memoizedState=null),n.flags|=4;an(n),c=!1}else c=Df(),t!==null&&t.memoizedState!==null&&(t.memoizedState.hydrationErrors=c),c=!0;if(!c)return n.flags&256?(fi(n),n):(fi(n),null)}return fi(n),(n.flags&128)!==0?(n.lanes=a,n):(a=r!==null,t=t!==null&&t.memoizedState!==null,a&&(r=n.child,c=null,r.alternate!==null&&r.alternate.memoizedState!==null&&r.alternate.memoizedState.cachePool!==null&&(c=r.alternate.memoizedState.cachePool.pool),u=null,r.memoizedState!==null&&r.memoizedState.cachePool!==null&&(u=r.memoizedState.cachePool.pool),u!==c&&(r.flags|=2048)),a!==t&&a&&(n.child.flags|=8192),wc(n,n.updateQueue),an(n),null);case 4:return Ke(),t===null&&ed(n.stateNode.containerInfo),n.flags|=67108864,an(n),null;case 10:return Ca(n.type),an(n),null;case 19:if(Wf(n),r=n.memoizedState,r===null)return an(n),null;if(c=(n.flags&128)!==0,u=r.rendering,u===null)if(c)Qo(r,!1);else{if(pn!==0||t!==null&&(t.flags&128)!==0)for(t=n.child;t!==null;){if(u=dc(t),u!==null){for(n.flags|=128,Qo(r,!1),t=u.updateQueue,n.updateQueue=t,wc(n,t),n.subtreeFlags=0,t=a,a=n.child;a!==null;)v0(a,t),a=a.sibling;return qo(n,Pn.current&1|2),ye&&Ra(n,r.treeForkCount),n.child}t=t.sibling}r.tail!==null&&Lt()>Hc&&(n.flags|=128,c=!0,Qo(r,!1),n.lanes=4194304)}else{if(!c)if(t=dc(u),t!==null){if(n.flags|=128,c=!0,t=t.updateQueue,n.updateQueue=t,wc(n,t),Qo(r,!0),r.tail===null&&r.tailMode!=="collapsed"&&r.tailMode!=="visible"&&!u.alternate&&!ye)return an(n),null}else 2*Lt()-r.renderingStartTime>Hc&&a!==536870912&&(n.flags|=128,c=!0,Qo(r,!1),n.lanes=4194304);r.isBackwards?(u.sibling=n.child,n.child=u):(t=r.last,t!==null?t.sibling=u:n.child=u,r.last=u)}if(r.tail!==null){t=r.tail;t:{for(a=t;a!==null;){if(a.alternate!==null){a=!1;break t}a=a.sibling}a=!0}return r.rendering=t,r.tail=t.sibling,r.renderingStartTime=Lt(),t.sibling=null,u=Pn.current,u=c?u&1|2:u&1,r.tailMode==="visible"||r.tailMode==="collapsed"||!a||ye?qo(n,u):(a=u,ne(On,n),ne(Pn,a),Hn===null&&(Hn=n)),ye&&Ra(n,r.treeForkCount),t}return an(n),null;case 22:case 23:return fi(n),kf(),r=n.memoizedState!==null,t!==null?t.memoizedState!==null!==r&&(n.flags|=8192):r&&(n.flags|=8192),r?(a&536870912)!==0&&(n.flags&128)===0&&(an(n),n.subtreeFlags&6&&(n.flags|=8192)):an(n),a=n.updateQueue,a!==null&&wc(n,a.retryQueue),a=null,t!==null&&t.memoizedState!==null&&t.memoizedState.cachePool!==null&&(a=t.memoizedState.cachePool.pool),r=null,n.memoizedState!==null&&n.memoizedState.cachePool!==null&&(r=n.memoizedState.cachePool.pool),r!==a&&(n.flags|=2048),t!==null&&ee(Vs),null;case 24:return a=null,t!==null&&(a=t.memoizedState.cache),n.memoizedState.cache!==a&&(n.flags|=2048),Ca(vn),an(n),null;case 25:return null;case 30:return n.flags|=33554432,an(n),null}throw Error(s(156,n.tag))}function iM(t,n){switch(Cf(n),n.tag){case 1:return t=n.flags,t&65536?(n.flags=t&-65537|128,n):null;case 3:return Ca(vn),Ke(),t=n.flags,(t&65536)!==0&&(t&128)===0?(n.flags=t&-65537|128,n):null;case 26:case 27:case 5:return P(n),null;case 31:if(n.memoizedState!==null){if(fi(n),n.alternate===null)throw Error(s(340));zs()}return t=n.flags,t&65536?(n.flags=t&-65537|128,n):null;case 13:if(fi(n),t=n.memoizedState,t!==null&&t.dehydrated!==null){if(n.alternate===null)throw Error(s(340));zs()}return t=n.flags,t&65536?(n.flags=t&-65537|128,n):null;case 19:return Wf(n),t=n.flags,t&65536?(n.flags=t&-65537|128,t=n.memoizedState,t!==null&&(t.rendering=null,t.tail=null),n.flags|=4,n):null;case 4:return Ke(),null;case 10:return Ca(n.type),null;case 22:case 23:return fi(n),kf(),t!==null&&ee(Vs),t=n.flags,t&65536?(n.flags=t&-65537|128,n):null;case 24:return Ca(vn),null;case 25:return null;default:return null}}function qg(t,n){switch(Cf(n),n.tag){case 3:Ca(vn),Ke();break;case 26:case 27:case 5:P(n);break;case 4:Ke();break;case 31:n.memoizedState!==null&&fi(n);break;case 13:fi(n);break;case 19:Wf(n);break;case 10:Ca(n.type);break;case 22:case 23:fi(n),kf(),t!==null&&ee(Vs);break;case 24:Ca(vn)}}function Jo(t,n){try{var a=n.updateQueue,r=a!==null?a.lastEffect:null;if(r!==null){var c=r.next;a=c;do{if((a.tag&t)===t){r=void 0;var u=a.create,g=a.inst;r=u(),g.destroy=r}a=a.next}while(a!==c)}}catch(w){qe(n,n.return,w)}}function ls(t,n,a){try{var r=n.updateQueue,c=r!==null?r.lastEffect:null;if(c!==null){var u=c.next;r=u;do{if((r.tag&t)===t){var g=r.inst,w=g.destroy;if(w!==void 0){g.destroy=void 0,c=n;var z=a,$=w;try{$()}catch(ht){qe(c,z,ht)}}}r=r.next}while(r!==u)}}catch(ht){qe(n,n.return,ht)}}function Yg(t){var n=t.updateQueue;if(n!==null){var a=t.stateNode;try{I0(n,a)}catch(r){qe(t,t.return,r)}}}function jg(t,n,a){a.props=Ys(t.type,t.memoizedProps),a.state=t.memoizedState;try{a.componentWillUnmount()}catch(r){qe(t,n,r)}}function ia(t,n){try{var a=t.ref;if(a!==null){switch(t.tag){case 26:case 27:case 5:var r=t.stateNode;break;case 30:var c=t.stateNode,u=ba(t.memoizedProps,c);(c.ref===null||c.ref.name!==u)&&(c.ref=ev(u)),r=c.ref;break;case 7:if(t.stateNode===null){var g=new gi(t);_(t.child,!1,YM,g,void 0,void 0),t.stateNode=g}r=t.stateNode;break;default:r=t.stateNode}typeof a=="function"?t.refCleanup=a(r):a.current=r}}catch(w){qe(t,n,w)}}function In(t,n){var a=t.ref,r=t.refCleanup;if(a!==null)if(typeof r=="function")try{r()}catch(c){qe(t,n,c)}finally{t.refCleanup=null,t=t.alternate,t!=null&&(t.refCleanup=null)}else if(typeof a=="function")try{a(null)}catch(c){qe(t,n,c)}else a.current=null}function Cc(t,n){if((t.tag===5||t.tag===27||t.tag===6)&&t.alternate===null&&n!==null)for(var a=0;a<n.length;a++)ov(t.stateNode,n[a])}function Zg(t){for(var n=t.return;n!==null&&(Mh(n)&&ov(t.stateNode,n.stateNode),!yh(n));)n=n.return}function $o(t){for(var n=t.return;n!==null&&(Mh(n)&&jM(t.stateNode,n.stateNode),!yh(n));)n=n.return}function yh(t){return t.tag===5||t.tag===3||t.tag===27}function Mh(t){return t&&t.tag===7&&t.stateNode!==null}function Eh(t){var n=t.type,a=t.memoizedProps,r=t.stateNode;try{t:switch(n){case"button":case"input":case"select":case"textarea":a.autoFocus&&r.focus();break t;case"img":a.src?r.src=a.src:a.srcSet&&(r.srcset=a.srcSet)}}catch(c){qe(t,t.return,c)}}function bh(t,n,a){try{var r=t.stateNode;CM(r,t.type,a,n),r[H]=n}catch(c){qe(t,t.return,c)}}function Kg(t){return t.tag===5||t.tag===3||t.tag===26||t.tag===27&&ms(t.type)||t.tag===4}function Th(t){t:for(;;){for(;t.sibling===null;){if(t.return===null||Kg(t.return))return null;t=t.return}for(t.sibling.return=t.return,t=t.sibling;t.tag!==5&&t.tag!==6&&t.tag!==18;){if(t.tag===27&&ms(t.type)||t.flags&2||t.child===null||t.tag===4)continue t;t.child.return=t,t=t.child}if(!(t.flags&2))return t.stateNode}}function Ah(t,n,a,r){var c=t.tag;if(c===5||c===6)c=t.stateNode,n?(a.nodeType===9?a.body:a.nodeName==="HTML"?a.ownerDocument.body:a).insertBefore(c,n):(n=a.nodeType===9?a.body:a.nodeName==="HTML"?a.ownerDocument.body:a,n.appendChild(c),a=a._reactRootContainer,a!=null||n.onclick!==null||(n.onclick=ta)),Cc(t,r),Se=!0;else if(c!==4&&(c===27&&(Cc(t,r),r=null,ms(t.type)&&(a=t.stateNode,n=null)),t=t.child,t!==null))for(Ah(t,n,a,r),t=t.sibling;t!==null;)Ah(t,n,a,r),t=t.sibling}function Nc(t,n,a,r){var c=t.tag;if(c===5||c===6)c=t.stateNode,n?a.insertBefore(c,n):a.appendChild(c),Cc(t,r),Se=!0;else if(c!==4&&(c===27&&(Cc(t,r),r=null,ms(t.type)&&(a=t.stateNode)),t=t.child,t!==null))for(Nc(t,n,a,r),t=t.sibling;t!==null;)Nc(t,n,a,r),t=t.sibling}function Qg(t){var n=t.stateNode,a=t.memoizedProps;try{for(var r=t.type,c=n.attributes;c.length;)n.removeAttributeNode(c[0]);zn(n,r,a),n[R]=t,n[H]=a}catch(u){qe(t,t.return,u)}}var Dc=!1,hi=null;function Jg(t){(t.tag===30||(t.subtreeFlags&33554432)!==0)&&(Dc=!0)}var aa=null;function $g(){var t=aa;return aa=null,t}var ti=0;function Dr(t,n,a,r,c){return ti=0,t_(t.child,n,a,r,c)}function t_(t,n,a,r,c){for(var u=!1;t!==null;){if(t.tag===5){var g=t.stateNode;if(r!==null){var w=cd(g);r.push(w),w.view&&(u=!0)}else u||cd(g).view&&(u=!0);Dc=!0,$_(g,ti===0?n:n+"_"+ti,a),ti++}else(t.tag!==22||t.memoizedState===null)&&(t.tag===30&&c||t_(t.child,n,a,r,c)&&(u=!0));t=t.sibling}return u}function sa(t,n){for(;t!==null;)t.tag===5?tv(t.stateNode,t.memoizedProps):(t.tag!==22||t.memoizedState===null)&&(t.tag===30&&n||sa(t.child,n)),t=t.sibling}function Uc(t){if((t.subtreeFlags&18874368)!==0)for(t=t.child;t!==null;){if((t.tag!==22||t.memoizedState===null)&&(Uc(t),t.tag===30&&(t.flags&18874368)!==0&&t.stateNode.paired)){var n=t.memoizedProps;if(n.name==null||n.name==="auto")throw Error(s(544));var a=n.name;n=Ta(n.default,n.share),n!=="none"&&(Dr(t,a,n,null,!1)||sa(t.child,!1))}t=t.sibling}}function Rh(t,n){if(t.tag===30){var a=t.stateNode,r=t.memoizedProps,c=ba(r,a),u=Ta(r.default,a.paired?r.share:r.enter);u!=="none"?Dr(t,c,u,null,!1)?(Uc(t),a.paired||n||Fr(t,r.onEnter)):sa(t.child,!1):Uc(t)}else if((t.subtreeFlags&33554432)!==0)for(t=t.child;t!==null;)Rh(t,n),t=t.sibling;else Uc(t)}function wh(t){if(hi!==null&&hi.size!==0){var n=hi;if((t.subtreeFlags&18874368)!==0)for(t=t.child;t!==null;){if(t.tag!==22||t.memoizedState===null){if(t.tag===30&&(t.flags&18874368)!==0){var a=t.memoizedProps,r=a.name;if(r!=null&&r!=="auto"){var c=n.get(r);if(c!==void 0){var u=Ta(a.default,a.share);if(u!=="none"&&(Dr(t,r,u,null,!1)?(u=t.stateNode,c.paired=u,u.paired=c,Fr(t,a.onShare)):sa(t.child,!1)),n.delete(r),n.size===0)break}}}wh(t)}t=t.sibling}}}function Ch(t){if(t.tag===30){var n=t.memoizedProps,a=ba(n,t.stateNode),r=hi!==null?hi.get(a):void 0,c=Ta(n.default,r!==void 0?n.share:n.exit);c!=="none"&&(Dr(t,a,c,null,!1)?r!==void 0?(c=t.stateNode,r.paired=c,c.paired=r,hi.delete(a),Fr(t,n.onShare)):Fr(t,n.onExit):sa(t.child,!1)),hi!==null&&wh(t)}else if((t.subtreeFlags&33554432)!==0)for(t=t.child;t!==null;)Ch(t),t=t.sibling;else hi!==null&&wh(t)}function e_(t){for(t=t.child;t!==null;){if(t.tag===30){var n=t.memoizedProps,a=ba(n,t.stateNode);n=Ta(n.default,n.update),t.flags&=-5,n!=="none"&&Dr(t,a,n,t.memoizedState=[],!1)}else(t.subtreeFlags&33554432)!==0&&e_(t);t=t.sibling}}function Nh(t){if((t.subtreeFlags&18874368)!==0)for(t=t.child;t!==null;){if(t.tag!==22||t.memoizedState===null){if(t.tag===30&&(t.flags&18874368)!==0){var n=t.stateNode;n.paired!==null&&(n.paired=null,sa(t.child,!1))}Nh(t)}t=t.sibling}}function Lc(t){if(t.tag===30)t.stateNode.paired=null,sa(t.child,!1),Nh(t);else if((t.subtreeFlags&33554432)!==0)for(t=t.child;t!==null;)Lc(t),t=t.sibling;else Nh(t)}function n_(t){for(t=t.child;t!==null;)t.tag===30?sa(t.child,!1):(t.subtreeFlags&33554432)!==0&&n_(t),t=t.sibling}function Dh(t,n,a,r,c,u,g){for(var w=!1;n!==null;){if(n.tag===5){var z=n.stateNode;if(u!==null&&ti<u.length){var $=u[ti],ht=cd(z);($.view||ht.view)&&(w=!0);var Et;if(Et=(t.flags&4)===0)if(ht.clip)Et=!0;else{Et=$.rect;var K=ht.rect;Et=Et.y!==K.y||Et.x!==K.x||Et.height!==K.height||Et.width!==K.width}Et&&(t.flags|=4),ht.abs?ht=!$.abs:($=$.rect,ht=ht.rect,ht=$.height!==ht.height||$.width!==ht.width),ht&&(t.flags|=32)}else t.flags|=32;(t.flags&4)!==0&&$_(z,ti===0?a:a+"_"+ti,c),w&&(t.flags&4)!==0||(aa===null&&(aa=[]),aa.push(z,ti===0?r:r+"_"+ti,n.memoizedProps)),ti++}else(n.tag!==22||n.memoizedState===null)&&(n.tag===30&&g?t.flags|=n.flags&32:Dh(t,n.child,a,r,c,u,g)&&(w=!0));n=n.sibling}return w}function i_(t,n){for(t=t.child;t!==null;){if(t.tag===30){var a=t.memoizedProps,r=t.stateNode,c=ba(a,r),u=Ta(a.default,a.update),g;g=t.memoizedState,t.memoizedState=null,r=t;var w=t.child;ti=0,c=Dh(r,w,c,c,u,g,!1),(t.flags&4)!==0&&c&&Fr(t,a.onUpdate)}else(t.subtreeFlags&33554432)!==0&&i_(t);t=t.sibling}}var Cn=!1,Xe=!1,ra=!1,Uh=!1,a_=typeof WeakSet=="function"?WeakSet:Set,Nn=null,oa=!1,tl=!1,Oc=!1,Lh=!1;function aM(t,n,a){if(t=t.containerInfo,ad=Zr,t=l0(t),xf(t)){if("selectionStart"in t)var r={start:t.selectionStart,end:t.selectionEnd};else t:{r=(r=t.ownerDocument)&&r.defaultView||window;var c=r.getSelection&&r.getSelection();if(c&&c.rangeCount!==0){r=c.anchorNode;var u=c.anchorOffset,g=c.focusNode;c=c.focusOffset;try{r.nodeType,g.nodeType}catch{r=null;break t}var w=0,z=-1,$=-1,ht=0,Et=0,K=t,ct=null;e:for(;;){for(var Ht;K!==r||u!==0&&K.nodeType!==3||(z=w+u),K!==g||c!==0&&K.nodeType!==3||($=w+c),K.nodeType===3&&(w+=K.nodeValue.length),(Ht=K.firstChild)!==null;)ct=K,K=Ht;for(;;){if(K===t)break e;if(ct===r&&++ht===u&&(z=w),ct===g&&++Et===c&&($=w),(Ht=K.nextSibling)!==null)break;K=ct,ct=K.parentNode}K=Ht}r=z===-1||$===-1?null:{start:z,end:$}}else r=null}r=r||{start:0,end:0}}else r=null;for(sd={focusedElem:t,selectionRange:r},Zr=!1,a=(a&335544064)===a,Nn=n,n=a?9270:1024;Nn!==null;){if(t=Nn,a&&(r=t.deletions,r!==null))for(u=0;u<r.length;u++)a&&Ch(r[u]);if(t.alternate===null&&(t.flags&2)!==0)a&&Jg(t),Pc(a);else{if(t.tag===22){if(r=t.alternate,t.memoizedState!==null){r!==null&&r.memoizedState===null&&a&&Ch(r),Pc(a);continue}else if(r!==null&&r.memoizedState!==null){a&&Jg(t),Pc(a);continue}}r=t.child,(t.subtreeFlags&n)!==0&&r!==null?(r.return=t,Nn=r):(a&&e_(t),Pc(a))}}hi=null}function Pc(t){for(;Nn!==null;){var n=Nn,a=t,r=n.alternate,c=n.flags;switch(n.tag){case 0:case 11:case 15:break;case 1:if((c&1024)!==0&&r!==null){a=void 0,c=r.memoizedProps,r=r.memoizedState;var u=n.stateNode;try{var g=Ys(n.type,c);a=u.getSnapshotBeforeUpdate(g,r),u.__reactInternalSnapshotBeforeUpdate=a}catch(w){qe(n,n.return,w)}}break;case 3:if((c&1024)!==0){if(r=n.stateNode.containerInfo,a=r.nodeType,a===9)hd(r);else if(a===1)switch(r.nodeName){case"HEAD":case"HTML":case"BODY":hd(r);break;default:r.textContent=""}}break;case 5:case 26:case 27:case 6:case 4:case 17:break;case 30:a&&r!==null&&(a=ba(r.memoizedProps,r.stateNode),c=n.memoizedProps,c=Ta(c.default,c.update),c!=="none"&&Dr(r,a,c,r.memoizedState=[],!0));break;default:if((c&1024)!==0)throw Error(s(163))}if(r=n.sibling,r!==null){r.return=n.return,Nn=r;break}Nn=n.return}}function s_(t,n,a){var r=a.flags;switch(a.tag){case 0:case 11:case 15:la(t,a),r&4&&Jo(5,a);break;case 1:if(la(t,a),r&4)if(t=a.stateNode,n===null)try{t.componentDidMount()}catch(g){qe(a,a.return,g)}else{var c=Ys(a.type,n.memoizedProps);n=n.memoizedState;try{t.componentDidUpdate(c,n,t.__reactInternalSnapshotBeforeUpdate)}catch(g){qe(a,a.return,g)}}r&64&&Yg(a),r&512&&ia(a,a.return);break;case 3:if(la(t,a),r&64&&(t=a.updateQueue,t!==null)){if(n=null,a.child!==null)switch(a.child.tag){case 27:case 5:n=a.child.stateNode;break;case 1:n=a.child.stateNode}try{I0(t,n)}catch(g){qe(a,a.return,g)}}break;case 27:n===null&&r&4&&Qg(a);case 26:case 5:la(t,a),n===null&&r&4&&Eh(a),r&512&&ia(a,a.return);break;case 12:la(t,a);break;case 31:la(t,a),r&4&&c_(t,a);break;case 13:la(t,a),r&4&&u_(t,a),r&64&&(t=a.memoizedState,t!==null&&(t=t.dehydrated,t!==null&&(a=gM.bind(null,a),QM(t,a))));break;case 22:if(r=a.memoizedState!==null||Cn,!r){var u=n!==null&&n.memoizedState!==null||Xe;n=Cn,c=Xe,Cn=r,(Xe=u)&&!c?(r=2,(a.subtreeFlags&8772)!==0&&(r|=1),ki(t,a,r)):la(t,a),Cn=n,Xe=c}break;case 30:la(t,a),r&512&&ia(a,a.return);break;case 7:r&512&&ia(a,a.return);default:la(t,a)}}function Oh(t,n){for(t=t.child;t!==null;)r_(t,n),t=t.sibling}function r_(t,n){switch(t.tag){case 5:case 26:try{var a=t.stateNode;if(n){var r=a.style;typeof r.setProperty=="function"?r.setProperty("display","none","important"):r.display="none"}else{var c=t.stateNode,u=t.memoizedProps.style,g=u!=null&&u.hasOwnProperty("display")?u.display:null;c.style.display=g==null||typeof g=="boolean"?"":(""+g).trim()}}catch(z){qe(t,t.return,z)}Ph(t,n);break;case 6:try{t.stateNode.nodeValue=n?"":t.memoizedProps,Se=!0}catch(z){qe(t,t.return,z)}break;case 18:try{var w=t.stateNode;n?J_(w,!0):J_(t.stateNode,!1)}catch(z){qe(t,t.return,z)}break;case 22:case 23:t.memoizedState===null&&Oh(t,n);break;default:Oh(t,n)}}function Ph(t,n){if(t.subtreeFlags&67108864)for(t=t.child;t!==null;){t:{var a=t,r=n;switch(a.tag){case 4:r_(a,r);break t;case 22:a.memoizedState===null&&Ph(a,r);break t;default:Ph(a,r)}}t=t.sibling}}function o_(t){var n=t.alternate;n!==null&&(t.alternate=null,o_(n)),t.child=null,t.deletions=null,t.sibling=null,t.tag===5&&(n=t.stateNode,n!==null&&Jt(n)),t.stateNode=null,t.return=null,t.dependencies=null,t.memoizedProps=null,t.memoizedState=null,t.pendingProps=null,t.stateNode=null,t.updateQueue=null}var sn=null,ei=!1;function Gi(t,n,a){for(a=a.child;a!==null;)l_(t,n,a),a=a.sibling}function l_(t,n,a){if(Wt&&typeof Wt.onCommitFiberUnmount=="function")try{Wt.onCommitFiberUnmount(te,a)}catch{}switch(a.tag){case 26:Xe||In(a,n),Gi(t,n,a),a.memoizedState?a.memoizedState.count--:a.stateNode&&!Xe&&(a=a.stateNode,a.parentNode.removeChild(a));break;case 27:Xe||In(a,n),$o(a);var r=sn,c=ei;ms(a.type)&&(sn=a.stateNode,ei=!1),Gi(t,n,a),hv(a.stateNode,a.type,a.memoizedProps),sn=r,ei=c;break;case 5:Xe||In(a,n),$o(a);case 6:if(a.tag===6&&$o(a),r=sn,c=ei,sn=null,Gi(t,n,a),sn=r,ei=c,sn!==null)if(ei)try{(sn.nodeType===9?sn.body:sn.nodeName==="HTML"?sn.ownerDocument.body:sn).removeChild(a.stateNode),Se=!0}catch(u){qe(a,n,u)}else try{sn.removeChild(a.stateNode),Se=!0}catch(u){qe(a,n,u)}break;case 18:sn!==null&&(ei?(t=sn,Q_(t.nodeType===9?t.body:t.nodeName==="HTML"?t.ownerDocument.body:t,a.stateNode),Kr(t)):Q_(sn,a.stateNode));break;case 4:r=sn,c=ei,sn=a.stateNode.containerInfo,ei=!0,Gi(t,n,a),sn=r,ei=c;break;case 0:case 11:case 14:case 15:ls(2,a,n),Xe||ls(4,a,n),Gi(t,n,a);break;case 1:Xe||(In(a,n),r=a.stateNode,typeof r.componentWillUnmount=="function"&&jg(a,n,r)),Gi(t,n,a);break;case 21:Gi(t,n,a);break;case 22:Xe=(r=Xe)||a.memoizedState!==null,Gi(t,n,a),Xe=r;break;case 30:In(a,n),Gi(t,n,a);break;case 7:Xe||In(a,n),Gi(t,n,a);break;default:Gi(t,n,a)}}function c_(t,n){if(n.memoizedState===null&&(t=n.alternate,t!==null&&(t=t.memoizedState,t!==null))){t=t.dehydrated;try{Kr(t)}catch(a){qe(n,n.return,a)}}}function u_(t,n){if(n.memoizedState===null&&(t=n.alternate,t!==null&&(t=t.memoizedState,t!==null&&(t=t.dehydrated,t!==null))))try{Kr(t)}catch(a){qe(n,n.return,a)}}function sM(t){switch(t.tag){case 31:case 13:case 19:var n=t.stateNode;return n===null&&(n=t.stateNode=new a_),n;case 22:return t=t.stateNode,n=t._retryCache,n===null&&(n=t._retryCache=new a_),n;default:throw Error(s(435,t.tag))}}function Ic(t,n){var a=sM(t);n.forEach(function(r){if(!a.has(r)){a.add(r);var c=_M.bind(null,t,r);r.then(c,c)}})}function Yn(t,n,a){var r=n.deletions;if(r!==null)for(var c=0;c<r.length;c++){var u=r[c],g=t,w=n,z=w;t:for(;z!==null;){switch(z.tag){case 27:if(ms(z.type)){sn=z.stateNode,ei=!1;break t}break;case 5:sn=z.stateNode,ei=!1;break t;case 3:case 4:sn=z.stateNode.containerInfo,ei=!0;break t}z=z.return}if(sn===null)throw Error(s(160));l_(g,w,u),sn=null,ei=!1,g=u.alternate,g!==null&&(g.return=null),u.return=null}if(n.subtreeFlags&13886)for(n=n.child;n!==null;)f_(n,t,a),n=n.sibling}var Vi=null;function f_(t,n,a){var r=t.alternate,c=t.flags;switch(t.tag){case 0:case 11:case 14:case 15:if(c&4&&(r=t.updateQueue,r=r!==null?r.events:null,r!==null))for(var u=0;u<r.length;u++){var g=r[u];g.ref.impl=g.nextImpl}Yn(n,t,a),jn(t),c&4&&(ls(3,t,t.return),Jo(3,t),ls(5,t,t.return));break;case 1:Yn(n,t,a),jn(t),c&512&&(Xe||r===null||In(r,r.return)),c&64&&Cn&&(t=t.updateQueue,t!==null&&(n=t.callbacks,n!==null&&(a=t.shared.hiddenCallbacks,t.shared.hiddenCallbacks=a===null?n:a.concat(n))));break;case 26:if(u=Vi,Yn(n,t,a),jn(t),c&512&&(Xe||r===null||In(r,r.return)),c&4)if(c=r!==null?r.memoizedState:null,a=t.memoizedState,r===null)if(a===null)if(t.stateNode===null)if(Cn)t.stateNode=j_(t.type,t.memoizedProps,n.containerInfo,t);else{t:{n=t.type,a=t.memoizedProps,c=u.ownerDocument||u;e:switch(n){case"title":r=c.getElementsByTagName("title")[0],(!r||r[Ft]||r[R]||r.namespaceURI==="http://www.w3.org/2000/svg"||r.hasAttribute("itemprop"))&&(r=c.createElement(n),c.head.insertBefore(r,c.querySelector("head > title"))),zn(r,n,a),r[R]=t,xe(r),n=r;break t;case"link":if(u=vv("link","href",c).get(n+(a.href||""))){for(g=0;g<u.length;g++)if(r=u[g],r.getAttribute("href")===(a.href==null||a.href===""?null:a.href)&&r.getAttribute("rel")===(a.rel==null?null:a.rel)&&r.getAttribute("title")===(a.title==null?null:a.title)&&r.getAttribute("crossorigin")===(a.crossOrigin==null?null:a.crossOrigin)){u.splice(g,1);break e}}r=c.createElement(n),zn(r,n,a),c.head.appendChild(r);break;case"meta":if(u=vv("meta","content",c).get(n+(a.content||""))){for(g=0;g<u.length;g++)if(r=u[g],r.getAttribute("content")===(a.content==null?null:""+a.content)&&r.getAttribute("name")===(a.name==null?null:a.name)&&r.getAttribute("property")===(a.property==null?null:a.property)&&r.getAttribute("http-equiv")===(a.httpEquiv==null?null:a.httpEquiv)&&r.getAttribute("charset")===(a.charSet==null?null:a.charSet)){u.splice(g,1);break e}}r=c.createElement(n),zn(r,n,a),c.head.appendChild(r);break;default:throw Error(s(468,n))}r[R]=t,xe(r),n=r}t.stateNode=n}else Cn||xd(u,t.type,t.stateNode);else t.stateNode=_v(u,a,t.memoizedProps);else c!==a?(c===null?(n=r.stateNode,n===null||Xe||n.parentNode.removeChild(n)):c.count--,a===null?Cn||xd(u,t.type,t.stateNode):_v(u,a,t.memoizedProps)):a===null&&t.stateNode!==null&&bh(t,t.memoizedProps,r.memoizedProps);break;case 27:Yn(n,t,a),jn(t),c&512&&(Xe||r===null||In(r,r.return)),r!==null&&c&4&&bh(t,t.memoizedProps,r.memoizedProps);break;case 5:if(u=ra,ra=!1,Yn(n,t,a),ra=u,jn(t),c&512&&(Xe||r===null||In(r,r.return)),t.flags&32){n=t.stateNode;try{dr(n,""),Se=!0}catch(ht){qe(t,t.return,ht)}}c&4&&t.stateNode!=null&&(n=t.memoizedProps,bh(t,n,r!==null?r.memoizedProps:n)),c&1024&&(Uh=!0);break;case 6:if(Yn(n,t,a),jn(t),c&4){if(t.stateNode===null)throw Error(s(162));n=t.memoizedProps,a=t.stateNode;try{a.nodeValue=n,Se=!0}catch(ht){qe(t,t.return,ht)}}break;case 3:if(Se=!1,Qc=null,u=Vi,Vi=cl(n.containerInfo),Yn(n,t,a),Vi=u,jn(t),c&4&&r!==null&&r.memoizedState.isDehydrated)try{Kr(n.containerInfo)}catch(ht){qe(t,t.return,ht)}Uh&&(Uh=!1,h_(t)),Se=!1;break;case 4:c=ra,ra=Cn,r=He(),u=Vi,Vi=cl(t.stateNode.containerInfo),Yn(n,t,a),jn(t),Vi=u,Se&&tl&&(Oc=!0),Se=r,ra=c;break;case 12:Yn(n,t,a),jn(t);break;case 31:Yn(n,t,a),jn(t),c&4&&(n=t.updateQueue,n!==null&&(t.updateQueue=null,Ic(t,n)));break;case 13:Yn(n,t,a),jn(t),t.child.flags&8192&&t.memoizedState!==null!=(r!==null&&r.memoizedState!==null)&&(Fc=Lt()),c&4&&(n=t.updateQueue,n!==null&&(t.updateQueue=null,Ic(t,n)));break;case 22:u=t.memoizedState!==null,g=r!==null&&r.memoizedState!==null;var w=Cn,z=Xe,$=ra;Cn=w||u,ra=$||u,Xe=z||g,Yn(n,t,a),Xe=z,ra=$,Cn=w,jn(t),c&8192&&(n=t.stateNode,n._visibility=u?n._visibility&-2:n._visibility|1,!u||r===null||g||Cn||Xe||(n=g||Xe,a=Cn,r=Xe,Cn=u||Cn,Xe=n,cs(t,2),Cn=a,Xe=r),!u&&ra||Oh(t,u)),c&4&&(n=t.updateQueue,n!==null&&(a=n.retryQueue,a!==null&&(n.retryQueue=null,Ic(t,a))));break;case 19:Yn(n,t,a),jn(t),c&4&&(n=t.updateQueue,n!==null&&(t.updateQueue=null,Ic(t,n)));break;case 30:c&512&&(Xe||r===null||In(r,r.return)),c=He(),u=tl,g=(a&335544064)===a,w=t.memoizedProps,tl=g&&Ta(w.default,w.update)!=="none",Yn(n,t,a),jn(t),g&&r!==null&&Se&&(t.flags|=4),tl=u,Se=c;break;case 21:break;case 7:c&512&&(Xe||r===null||In(r,r.return)),r&&r.stateNode!==null&&(r.stateNode._fragmentFiber=t);default:Yn(n,t,a),jn(t)}}function jn(t){var n=t.flags;if(n&2){try{for(var a,r=t.return;r!==null;){if(Kg(r)){a=r;break}r=r.return}r=null;for(var c=t.return;c!==null;){if(Mh(c)){var u=c.stateNode;r===null?r=[u]:r.push(u)}if(yh(c))break;c=c.return}var g=r;if(a==null)throw Error(s(160));switch(a.tag){case 27:var w=a.stateNode,z=Th(t);Nc(t,z,w,g);break;case 5:var $=a.stateNode;a.flags&32&&(dr($,""),a.flags&=-33);var ht=Th(t);Nc(t,ht,$,g);break;case 3:case 4:var Et=a.stateNode.containerInfo,K=Th(t);Ah(t,K,Et,g);break;default:throw Error(s(161))}}catch(ct){qe(t,t.return,ct)}t.flags&=-3}n&4096&&(t.flags&=-4097)}function h_(t){if(t.subtreeFlags&1024)for(t=t.child;t!==null;){var n=t;h_(n),n.tag===5&&n.flags&1024&&(n=n.stateNode,Zr=!0,n.reset(),Zr=!1),t=t.sibling}}function Ur(t,n){if(n.subtreeFlags&9270)for(n=n.child;n!==null;)d_(n,t),n=n.sibling;else i_(n)}function d_(t,n){var a=t.alternate;if(a===null)Rh(t,!1);else switch(t.tag){case 3:if(Lh=oa=!1,$g(),Ur(n,t),!oa&&!Oc){if(t=aa,t!==null)for(var r=0;r<t.length;r+=3){a=t[r];var c=t[r+1];tv(a,t[r+2]),a=a.ownerDocument.documentElement,a!==null&&a.animate({opacity:[0,0],pointerEvents:["none","none"]},{duration:0,fill:"forwards",pseudoElement:"::view-transition-group("+c+")"})}t=n.containerInfo,t=t.nodeType===9?t.documentElement:t.ownerDocument.documentElement,t!==null&&t.style.viewTransitionName===""&&(t.style.viewTransitionName="none",t.animate({opacity:[0,0],pointerEvents:["none","none"]},{duration:0,fill:"forwards",pseudoElement:"::view-transition-group(root)"}),t.animate({width:[0,0],height:[0,0]},{duration:0,fill:"forwards",pseudoElement:"::view-transition"})),Lh=!0}aa=null;break;case 5:Ur(n,t);break;case 4:r=oa,oa=!1,Ur(n,t),oa&&(Oc=!0),oa=r;break;case 22:t.memoizedState===null&&(a.memoizedState!==null?Rh(t,!1):Ur(n,t));break;case 30:r=oa,c=$g(),oa=!1,Ur(n,t),oa&&(t.flags|=4);var u=t.memoizedProps,g=t.stateNode;n=ba(u,g),g=ba(a.memoizedProps,g);var w=Ta(u.default,u.update);w==="none"?n=!1:(u=a.memoizedState,a.memoizedState=null,a=t.child,ti=0,n=Dh(t,a,n,g,w,u,!0),ti!==(u===null?0:u.length)&&(t.flags|=32)),(t.flags&4)!==0&&n?(Fr(t,t.memoizedProps.onUpdate),aa=c):c!==null&&(c.push.apply(c,aa),aa=c),oa=(t.flags&32)!==0?!0:r;break;default:Ur(n,t)}}function la(t,n){if(n.subtreeFlags&8772)for(n=n.child;n!==null;)s_(t,n.alternate,n),n=n.sibling}function cs(t,n){for(t=t.child;t!==null;){var a=t,r=n;switch(a.tag){case 0:case 11:case 14:case 15:ls(4,a,a.return),cs(a,r);break;case 1:In(a,a.return);var c=a.stateNode;typeof c.componentWillUnmount=="function"&&jg(a,a.return,c),cs(a,r);break;case 27:(r&2)!==0&&hv(a.stateNode,a.type,a.memoizedProps);case 5:In(a,a.return),a.tag!==5&&a.tag!==27||$o(a),cs(a,r);break;case 6:$o(a);break;case 26:In(a,a.return),c=a.stateNode,a.memoizedState!==null||c===null||Xe||c.parentNode.removeChild(c),cs(a,r);break;case 22:a.memoizedState===null&&cs(a,r);break;case 30:In(a,a.return),cs(a,r);break;case 7:In(a,a.return);default:cs(a,r)}t=t.sibling}}function ki(t,n,a){for(a=(n.subtreeFlags&8772)!==0?a:a&-2,n=n.child;n!==null;){var r=n.alternate,c=t,u=n,g=u.flags,w=(a&1)!==0;switch(u.tag){case 0:case 11:case 15:ki(c,u,a),Jo(4,u);break;case 1:if(ki(c,u,a),r=u,c=r.stateNode,typeof c.componentDidMount=="function")try{c.componentDidMount()}catch(ht){qe(r,r.return,ht)}if(r=u,c=r.updateQueue,c!==null){var z=r.stateNode;try{var $=c.shared.hiddenCallbacks;if($!==null)for(c.shared.hiddenCallbacks=null,c=0;c<$.length;c++)P0($[c],z)}catch(ht){qe(r,r.return,ht)}}w&&g&64&&Yg(u),ia(u,u.return);break;case 27:(a&2)!==0&&Qg(u);case 5:u.tag!==5&&u.tag!==27||Zg(u),ki(c,u,a),w&&r===null&&g&4&&Eh(u),ia(u,u.return);break;case 6:Zg(u);break;case 26:z=u.stateNode,u.memoizedState!==null||z===null||Cn||xd(cl(z.ownerDocument),u.type,z),ki(c,u,a),w&&r===null&&g&4&&Eh(u),ia(u,u.return);break;case 12:ki(c,u,a);break;case 31:ki(c,u,a),w&&g&4&&c_(c,u);break;case 13:ki(c,u,a),w&&g&4&&u_(c,u);break;case 22:u.memoizedState===null&&ki(c,u,a),ia(u,u.return);break;case 30:ki(c,u,a),ia(u,u.return);break;case 7:ia(u,u.return);default:ki(c,u,a)}n=n.sibling}}function Ih(t,n){var a=null;t!==null&&t.memoizedState!==null&&t.memoizedState.cachePool!==null&&(a=t.memoizedState.cachePool.pool),t=null,n.memoizedState!==null&&n.memoizedState.cachePool!==null&&(t=n.memoizedState.cachePool.pool),t!==a&&(t!=null&&t.refCount++,a!=null&&Fo(a))}function zh(t,n){t=null,n.alternate!==null&&(t=n.alternate.memoizedState.cache),n=n.memoizedState.cache,n!==t&&(n.refCount++,t!=null&&Fo(t))}function Di(t,n,a,r){var c=(a&335544064)===a;if(n.subtreeFlags&(c?10262:10256))for(n=n.child;n!==null;)p_(t,n,a,r),n=n.sibling;else c&&n_(n)}function p_(t,n,a,r){var c=(a&335544064)===a;c&&n.alternate===null&&n.return!==null&&n.return.alternate!==null&&Lc(n);var u=n.flags;switch(n.tag){case 0:case 11:case 15:Di(t,n,a,r),u&2048&&Jo(9,n);break;case 1:Di(t,n,a,r);break;case 3:Di(t,n,a,r),c&&Lh&&(t=t.containerInfo,t=t.nodeType===9?t.body:t.nodeName==="HTML"?t.ownerDocument.body:t,t.style.viewTransitionName==="root"&&(t.style.viewTransitionName=""),t=t.ownerDocument.documentElement,t!==null&&t.style.viewTransitionName==="none"&&(t.style.viewTransitionName="")),u&2048&&(u=null,n.alternate!==null&&(u=n.alternate.memoizedState.cache),n=n.memoizedState.cache,n!==u&&(n.refCount++,u!=null&&Fo(u)));break;case 12:if(u&2048){Di(t,n,a,r),u=n.stateNode;try{var g=n.memoizedProps,w=g.id,z=g.onPostCommit;typeof z=="function"&&z(w,n.alternate===null?"mount":"update",u.passiveEffectDuration,-0)}catch($){qe(n,n.return,$)}}else Di(t,n,a,r);break;case 31:Di(t,n,a,r);break;case 13:Di(t,n,a,r);break;case 23:break;case 22:g=n.stateNode,w=n.alternate,n.memoizedState!==null?(c&&w!==null&&w.memoizedState===null&&Lc(w),g._visibility&2?Di(t,n,a,r):el(t,n)):(c&&w!==null&&w.memoizedState!==null&&Lc(n),g._visibility&2?Di(t,n,a,r):(g._visibility|=2,Lr(t,n,a,r,(n.subtreeFlags&10256)!==0||!1))),u&2048&&Ih(w,n);break;case 24:Di(t,n,a,r),u&2048&&zh(n.alternate,n);break;case 30:c&&(u=n.alternate,u!==null&&(sa(u.child,!0),sa(n.child,!0))),Di(t,n,a,r);break;default:Di(t,n,a,r)}}function Lr(t,n,a,r,c){for(c=c&&((n.subtreeFlags&10256)!==0||!1),n=n.child;n!==null;){var u=t,g=n,w=a,z=r,$=g.flags;switch(g.tag){case 0:case 11:case 15:Lr(u,g,w,z,c),Jo(8,g);break;case 23:break;case 22:var ht=g.stateNode;g.memoizedState!==null?ht._visibility&2?Lr(u,g,w,z,c):el(u,g):(ht._visibility|=2,Lr(u,g,w,z,c)),c&&$&2048&&Ih(g.alternate,g);break;case 24:Lr(u,g,w,z,c),c&&$&2048&&zh(g.alternate,g);break;default:Lr(u,g,w,z,c)}n=n.sibling}}function el(t,n){if(n.subtreeFlags&10256)for(n=n.child;n!==null;){var a=t,r=n,c=r.flags;switch(r.tag){case 22:el(a,r),c&2048&&Ih(r.alternate,r);break;case 24:el(a,r),c&2048&&zh(r.alternate,r);break;default:el(a,r)}n=n.sibling}}var js=8192;function Zs(t,n,a){if(t.subtreeFlags&js)for(t=t.child;t!==null;)m_(t,n,a),t=t.sibling}function m_(t,n,a){switch(t.tag){case 26:Zs(t,n,a),t.flags&js&&(t.memoizedState!==null?fE(a,Vi,t.memoizedState,t.memoizedProps):(t=t.stateNode,(n&335544128)===n&&Mv(a,t)));break;case 5:Zs(t,n,a),t.flags&js&&(t=t.stateNode,(n&335544128)===n&&Mv(a,t));break;case 3:case 4:var r=Vi;Vi=cl(t.stateNode.containerInfo),Zs(t,n,a),Vi=r;break;case 22:t.memoizedState===null&&(r=t.alternate,r!==null&&r.memoizedState!==null?(r=js,js=16777216,Zs(t,n,a),js=r):Zs(t,n,a));break;case 30:if((t.flags&js)!==0&&(r=t.memoizedProps.name,r!=null&&r!=="auto")){var c=t.stateNode;c.paired=null,hi===null&&(hi=new Map),hi.set(r,c)}Zs(t,n,a);break;default:Zs(t,n,a)}}function g_(t){var n=t.alternate;if(n!==null&&(t=n.child,t!==null)){n.child=null;do n=t.sibling,t.sibling=null,t=n;while(t!==null)}}function nl(t){var n=t.deletions;if((t.flags&16)!==0){if(n!==null)for(var a=0;a<n.length;a++){var r=n[a];Nn=r,v_(r,t)}g_(t)}if(t.subtreeFlags&10256)for(t=t.child;t!==null;)__(t),t=t.sibling}function __(t){switch(t.tag){case 0:case 11:case 15:nl(t),t.flags&2048&&ls(9,t,t.return);break;case 3:nl(t);break;case 12:nl(t);break;case 22:var n=t.stateNode;t.memoizedState!==null&&n._visibility&2&&(t.return===null||t.return.tag!==13)?(n._visibility&=-3,zc(t)):nl(t);break;default:nl(t)}}function zc(t){var n=t.deletions;if((t.flags&16)!==0){if(n!==null)for(var a=0;a<n.length;a++){var r=n[a];Nn=r,v_(r,t)}g_(t)}for(t=t.child;t!==null;){switch(n=t,n.tag){case 0:case 11:case 15:ls(8,n,n.return),zc(n);break;case 22:a=n.stateNode,a._visibility&2&&(a._visibility&=-3,zc(n));break;default:zc(n)}t=t.sibling}}function v_(t,n){for(;Nn!==null;){var a=Nn;switch(a.tag){case 0:case 11:case 15:ls(8,a,n);break;case 23:case 22:if(a.memoizedState!==null&&a.memoizedState.cachePool!==null){var r=a.memoizedState.cachePool.pool;r!=null&&r.refCount++}break;case 24:Fo(a.memoizedState.cache)}if(r=a.child,r!==null)r.return=a,Nn=r;else t:for(a=t;Nn!==null;){r=Nn;var c=r.sibling,u=r.return;if(o_(r),r===a){Nn=null;break t}if(c!==null){c.return=u,Nn=c;break t}Nn=u}}}var rM={getCacheForType:function(t){var n=Ln(vn),a=n.data.get(t);return a===void 0&&(a=t(),n.data.set(t,a)),a},cacheSignal:function(){return Ln(vn).controller.signal}},oM=typeof WeakMap=="function"?WeakMap:Map,Ge=0,tn=null,Ae=null,Ne=0,We=0,di=null,us=!1,Or=!1,Bh=!1,Oa=0,pn=0,fs=0,Ks=0,Bc=0,pi=0,Pr=0,il=null,ni=null,Fh=!1,Fc=0,x_=0,Hc=1/0,Gc=null,hs=null,on=0,Xi=null,Qs=null,ca=0,Hh=0,Gh=null,S_=null,Ir=null,zr=null,Br=null,al=0,Vc=null;function mi(){return(Ge&2)!==0&&Ne!==0?Ne&-Ne:vt.T!==null?Qh():Hl()}function y_(){if(pi===0)if((Ne&536870912)===0||ye){var t=Ns;Ns<<=1,(Ns&3932160)===0&&(Ns=262144),pi=t}else pi=536870912;return t=On.current,t!==null&&(t.flags|=32),pi}function Fr(t,n){if(n!=null){var a=t.stateNode,r=a.ref;r===null&&(r=a.ref=ev(ba(t.memoizedProps,a))),zr===null&&(zr=[]),zr.push(n.bind(null,r))}}function ii(t,n,a){(t===tn&&(We===2||We===9)||t.cancelPendingCommit!==null)&&(Hr(t,0),ds(t,Ne,pi,!1)),Ji(t,a),((Ge&2)===0||t!==tn)&&(t===tn&&((Ge&2)===0&&(Ks|=a),pn===4&&ds(t,Ne,pi,!1)),ua(t))}function M_(t,n,a){if((Ge&6)!==0)throw Error(s(327));var r=!a&&(n&127)===0&&(n&t.expiredLanes)===0||ja(t,n),c=r?uM(t,n):kh(t,n,!0),u=r;do{if(c===0){Or&&!r&&ds(t,n,0,!1);break}else{if(a=t.current.alternate,u&&!lM(a)){c=kh(t,n,!1),u=!1;continue}if(c===2){if(u=n,t.errorRecoveryDisabledLanes&u)var g=0;else g=t.pendingLanes&-536870913,g=g!==0?g:g&536870912?536870912:0;if(g!==0){n=g;t:{var w=t;c=il;var z=w.current.memoizedState.isDehydrated;if(z&&(Hr(w,g).flags|=256),g=kh(w,g,!1),g!==2&&g!==6){if(Bh&&!z){w.errorRecoveryDisabledLanes|=u,Ks|=u,c=4;break t}u=ni,ni=c,u!==null&&(ni===null?ni=u:ni.push.apply(ni,u))}c=g}if(u=!1,c!==2)continue}}if(c===1){Hr(t,0),ds(t,n,0,!0);break}t:{switch(r=t,u=c,u){case 0:case 1:throw Error(s(345));case 4:if((n&4194048)!==n&&(n&62914560)!==n)break;case 6:ds(r,n,pi,!us);break t;case 2:ni=null;break;case 3:case 5:break;default:throw Error(s(329))}if((n&62914560)===n&&(c=Fc+300-Lt(),10<c)){if(ds(r,n,pi,!us),Ds(r,0,!0)!==0)break t;ca=n,r.timeoutHandle=ld(E_.bind(null,r,a,ni,Gc,Fh,n,pi,Ks,Pr,us,u,"Throttled",-0,0),c);break t}E_(r,a,ni,Gc,Fh,n,pi,Ks,Pr,us,u,null,-0,0)}}break}while(!0);ua(t)}function E_(t,n,a,r,c,u,g,w,z,$,ht,Et,K,ct){t.timeoutHandle=-1;var Ht=n.subtreeFlags,$t=(u&335544064)===u;if(Et=null,($t||Ht&8192||(Ht&16785408)===16785408)&&(Et={stylesheets:null,count:0,imgCount:0,imgBytes:0,suspenseyImages:[],waitingForImages:!0,waitingForViewTransition:!1,unsuspend:ta},hi=null,m_(n,u,Et),$t&&(Ht=Et,$t=t.containerInfo,$t=($t.nodeType===9?$t:$t.ownerDocument).__reactViewTransition,$t!=null&&(Ht.count++,Ht.waitingForViewTransition=!0,Ht=hl.bind(Ht),$t.finished.then(Ht,Ht))),Ht=(u&62914560)===u?Fc-Lt():(u&4194048)===u?x_-Lt():0,Ht=hE(Et,Ht),Ht!==null)){ca=u,t.cancelPendingCommit=Ht(D_.bind(null,t,n,u,a,r,c,g,w,z,$,ht,Et,null,K,ct)),ds(t,u,g,!$);return}D_(t,n,u,a,r,c,g,w,z,$,ht,Et)}function lM(t){for(var n=t;;){var a=n.tag;if((a===0||a===11||a===15)&&n.flags&16384&&(a=n.updateQueue,a!==null&&(a=a.stores,a!==null)))for(var r=0;r<a.length;r++){var c=a[r],u=c.getSnapshot;c=c.value;try{if(!ui(u(),c))return!1}catch{return!1}}if(a=n.child,n.subtreeFlags&16384&&a!==null)a.return=n,n=a;else{if(n===t)break;for(;n.sibling===null;){if(n.return===null||n.return===t)return!0;n=n.return}n.sibling.return=n.return,n=n.sibling}}return!0}function ds(t,n,a,r){n=Qi(t,n),n&=~Bc,n&=~Ks,t.suspendedLanes|=n,t.pingedLanes&=~n,r&&(t.warmLanes|=n),r=t.expirationTimes;for(var c=n;0<c;){var u=31-fe(c),g=1<<u;r[u]=-1,c&=~g}a!==0&&Us(t,a,n)}function kc(){return(Ge&6)===0?(sl(0),!1):!0}function Vh(){if(Ae!==null){if(We===0)var t=Ae.return;else t=Ae,wa=Bs=null,Kf(t),Ar=null,Vo=0,t=Ae;for(;t!==null;)qg(t.alternate,t),t=t.return;Ae=null}}function Hr(t,n){var a=t.timeoutHandle;return a!==-1&&(t.timeoutHandle=-1,UM(a)),a=t.cancelPendingCommit,a!==null&&(t.cancelPendingCommit=null,a()),ca=0,Vh(),tn=t,Ae=a=Aa(t.current,null),Ne=n,We=0,di=null,us=!1,Or=ja(t,n),Bh=!1,Pr=pi=Bc=Ks=fs=pn=0,ni=il=null,Fh=!1,Oa=Qi(t,n),Ql(),a}function b_(t,n){me=null,vt.H=Mc,n===Tr||n===lc?(n=D0(),We=3):n===zf?(n=D0(),We=4):We=n===fh?8:n!==null&&typeof n=="object"&&typeof n.then=="function"?6:1,di=n,Ae===null&&(pn=1,Ec(t,Ri(n,t.current)))}function T_(){var t=On.current;return t===null?!0:(Ne&4194048)===Ne?Hn===null:(Ne&62914560)===Ne||(Ne&536870912)!==0?t===Hn:!1}function A_(){var t=vt.H;return vt.H=Mc,t===null?Mc:t}function R_(){var t=vt.A;return vt.A=rM,t}function Xc(){pn=4,us||(Ne&4194048)!==Ne&&On.current!==null||(Or=!0),(fs&134217727)===0&&(Ks&134217727)===0||tn===null||ds(tn,Ne,pi,!1)}function kh(t,n,a){var r=Ge;Ge|=2;var c=A_(),u=R_();(tn!==t||Ne!==n)&&(Gc=null,Hr(t,n)),n=!1;var g=pn;t:do try{if(We!==0&&Ae!==null){var w=Ae,z=di;switch(We){case 8:Vh(),g=6;break t;case 3:case 2:case 9:case 6:On.current===null&&(n=!0);var $=We;if(We=0,di=null,Gr(t,w,z,$),a&&Or){g=0;break t}break;default:$=We,We=0,di=null,Gr(t,w,z,$)}}cM(),g=pn;break}catch(ht){b_(t,ht)}while(!0);return n&&t.shellSuspendCounter++,wa=Bs=null,Ge=r,vt.H=c,vt.A=u,Ae===null&&(tn=null,Ne=0,Ql()),g}function cM(){for(;Ae!==null;)w_(Ae)}function uM(t,n){var a=Ge;Ge|=2;var r=A_(),c=R_();tn!==t||Ne!==n?(Gc=null,Hc=Lt()+500,Hr(t,n)):Or=ja(t,n);t:do try{if(We!==0&&Ae!==null){n=Ae;var u=di;e:switch(We){case 1:We=0,di=null,Gr(t,n,u,1);break;case 2:case 9:if(C0(u)){We=0,di=null,C_(n);break}n=function(){We!==2&&We!==9||tn!==t||(We=7),ua(t)},u.then(n,n);break t;case 3:We=7;break t;case 4:We=5;break t;case 7:C0(u)?(We=0,di=null,C_(n)):(We=0,di=null,Gr(t,n,u,7));break;case 5:var g=null;switch(Ae.tag){case 26:g=Ae.memoizedState;case 5:case 27:var w=Ae;if(g?Sv(g):w.stateNode.complete){We=0,di=null;var z=w.sibling;if(z!==null)Ae=z;else{var $=w.return;$!==null?(Ae=$,Wc($)):Ae=null}break e}}We=0,di=null,Gr(t,n,u,5);break;case 6:We=0,di=null,Gr(t,n,u,6);break;case 8:Vh(),pn=6;break t;default:throw Error(s(462))}}fM();break}catch(ht){b_(t,ht)}while(!0);return wa=Bs=null,vt.H=r,vt.A=c,Ge=a,Ae!==null?0:(tn=null,Ne=0,Ql(),pn)}function fM(){for(;Ae!==null&&!yt();)w_(Ae)}function w_(t){var n=Xg(t.alternate,t,Oa);t.memoizedProps=t.pendingProps,n===null?Wc(t):Ae=n}function C_(t){var n=t,a=n.alternate;switch(n.tag){case 15:case 0:n=zg(a,n,n.pendingProps,n.type,void 0,Ne);break;case 11:n=zg(a,n,n.pendingProps,n.type.render,n.ref,Ne);break;case 5:Kf(n);var r=n;r===wn&&(ye?(ic(r),r.tag===5&&r.stateNode!=null&&(nn=r.stateNode)):(ic(r),ye=!0));default:qg(a,n),n=Ae=v0(n,Oa),n=Xg(a,n,Oa)}t.memoizedProps=t.pendingProps,n===null?Wc(t):Ae=n}function Gr(t,n,a,r){wa=Bs=null,Kf(n),Ar=null,Vo=0;var c=n.return;try{if(Jy(t,c,n,a,Ne)){pn=1,Ec(t,Ri(a,t.current)),Ae=null;return}}catch(u){if(c!==null)throw Ae=c,u;pn=1,Ec(t,Ri(a,t.current)),Ae=null;return}n.flags&32768?(ye||r===1?t=!0:Or||(Ne&536870912)!==0?t=!1:(us=t=!0,(r===2||r===9||r===3||r===6)&&(r=On.current,r!==null&&r.tag===13&&(r.flags|=16384))),N_(n,t)):Wc(n)}function Wc(t){var n=t;do{if((n.flags&32768)!==0){N_(n,us);return}t=n.return;var a=nM(n.alternate,n,Oa);if(a!==null){Ae=a;return}if(n=n.sibling,n!==null){Ae=n;return}Ae=n=t}while(n!==null);pn===0&&(pn=5)}function N_(t,n){do{var a=iM(t.alternate,t);if(a!==null){a.flags&=32767,Ae=a;return}if(a=t.return,a!==null&&(a.flags|=32768,a.subtreeFlags=0,a.deletions=null),!n&&(t=t.sibling,t!==null)){Ae=t;return}Ae=t=a}while(t!==null);pn=6,Ae=null}function D_(t,n,a,r,c,u,g,w,z,$,ht,Et){t.cancelPendingCommit=null;do qc();while(on!==0);if((Ge&6)!==0)throw Error(s(327));if(n!==null){if(n===t.current)throw Error(s(177));t===tn&&(Ae=tn=null,Ne=0),Qs=n,Xi=t,ca=a,Gh=c,S_=r,hM(t,n,a,g,w,z,Et)}}function hM(t,n,a,r,c,u,g){var w=n.lanes|n.childLanes;if(Hh=w,w|=bf,Fl(t,a,w,r,c,u),zr=null,(a&335544064)===a?(Br=Hy(t),r=10262):(Br=null,r=10256),(n.subtreeFlags&r)!==0||(n.flags&r)!==0?(t.callbackNode=null,t.callbackPriority=0,vM(zt,function(){return Yh(),null})):(t.callbackNode=null,t.callbackPriority=0),Dc=!1,r=(n.flags&13878)!==0,(n.subtreeFlags&13878)!==0||r){r=vt.T,vt.T=null,c=Ut.p,Ut.p=2,u=Ge,Ge|=4;try{aM(t,n,a)}finally{Ge=u,Ut.p=c,vt.T=r}}on=1,Dc?Ir=BM(g,t.containerInfo,Br,Xh,Wh,pM,qh,Yh,dM):(Xh(),Wh(),qh())}function dM(t){if(on!==0){var n=Xi.onRecoverableError;n(t,{componentStack:null})}}function pM(){on===3&&(on=0,d_(Qs,Xi),on=4)}function Xh(){if(on===1){on=0;var t=Xi,n=Qs,a=ca,r=(n.flags&13878)!==0;if((n.subtreeFlags&13878)!==0||r){r=vt.T,vt.T=null;var c=Ut.p;Ut.p=2;var u=Ge;Ge|=4;try{tl=Oc=!1,f_(n,t,a),a=sd;var g=l0(t.containerInfo),w=a.focusedElem,z=a.selectionRange;if(g!==w&&w&&w.ownerDocument&&o0(w.ownerDocument.documentElement,w)){if(z!==null&&xf(w)){var $=z.start,ht=z.end;if(ht===void 0&&(ht=$),"selectionStart"in w)w.selectionStart=$,w.selectionEnd=Math.min(ht,w.value.length);else{var Et=w.ownerDocument||document,K=Et&&Et.defaultView||window;if(K.getSelection){var ct=K.getSelection(),Ht=w.textContent.length,$t=Math.min(z.start,Ht),ge=z.end===void 0?$t:Math.min(z.end,Ht);!ct.extend&&$t>ge&&(g=ge,ge=$t,$t=g);var J=r0(w,$t),V=r0(w,ge);if(J&&V&&(ct.rangeCount!==1||ct.anchorNode!==J.node||ct.anchorOffset!==J.offset||ct.focusNode!==V.node||ct.focusOffset!==V.offset)){var it=Et.createRange();it.setStart(J.node,J.offset),ct.removeAllRanges(),$t>ge?(ct.addRange(it),ct.extend(V.node,V.offset)):(it.setEnd(V.node,V.offset),ct.addRange(it))}}}}for(Et=[],ct=w;ct=ct.parentNode;)ct.nodeType===1&&Et.push({element:ct,left:ct.scrollLeft,top:ct.scrollTop});for(typeof w.focus=="function"&&w.focus(),w=0;w<Et.length;w++){var Mt=Et[w];Mt.element.scrollLeft=Mt.left,Mt.element.scrollTop=Mt.top}}Zr=!!ad,sd=ad=null}finally{Ge=u,Ut.p=c,vt.T=r}}t.current=n,on=2}}function Wh(){if(on===2){on=0;var t=Xi,n=Qs,a=(n.flags&8772)!==0;if((n.subtreeFlags&8772)!==0||a){a=vt.T,vt.T=null;var r=Ut.p;Ut.p=2;var c=Ge;Ge|=4;try{s_(t,n.alternate,n)}finally{Ge=c,Ut.p=r,vt.T=a}}on=3}}function qh(){if(on===4||on===3){on=0;var t=Ir;Ir=null,At();var n=Xi,a=Qs,r=ca,c=S_,u=(r&335544064)===r?10262:10256;if((a.subtreeFlags&u)!==0||(a.flags&u)!==0?on=5:(on=0,Qs=Xi=null,U_(n,n.pendingLanes)),u=n.pendingLanes,u===0&&(hs=null),Ro(r),a=a.stateNode,Wt&&typeof Wt.onCommitFiberRoot=="function")try{Wt.onCommitFiberRoot(te,a,void 0,(a.current.flags&128)===128)}catch{}if(c!==null){a=vt.T,u=Ut.p,Ut.p=2,vt.T=null;try{for(var g=n.onRecoverableError,w=0;w<c.length;w++){var z=c[w];g(z.value,{componentStack:z.stack})}}finally{vt.T=a,Ut.p=u}}if(c=zr,g=Br,Br=null,c!==null&&(zr=null,g===null&&(g=[]),t!==null))for(z=0;z<c.length;z++)a=(0,c[z])(g),a!==void 0&&t.finished.finally(a);(ca&3)!==0&&qc(),ua(n),u=n.pendingLanes,(r&261930)!==0&&(u&42)!==0?n===Vc?al++:(al=0,Vc=n):(al=0,Vc=null),sl(0)}}function U_(t,n){(t.pooledCacheLanes&=n)===0&&(n=t.pooledCache,n!=null&&(t.pooledCache=null,Fo(n)))}function qc(){return Ir!==null&&(Ir.skipTransition(),Ir=null),Xh(),Wh(),qh(),Yh()}function Yh(){if(on!==5)return!1;var t=Xi,n=Hh;Hh=0;var a=Ro(ca),r=vt.T,c=Ut.p;try{Ut.p=32>a?32:a,vt.T=null,a=Gh,Gh=null;var u=Xi,g=ca;if(on=0,Qs=Xi=null,ca=0,(Ge&6)!==0)throw Error(s(331));var w=Ge;if(Ge|=4,__(u.current),p_(u,u.current,g,a),Ge=w,sl(0,!1),Wt&&typeof Wt.onPostCommitFiberRoot=="function")try{Wt.onPostCommitFiberRoot(te,u)}catch{}return!0}finally{Ut.p=c,vt.T=r,U_(t,n)}}function L_(t,n,a){n=Ri(a,n),n=uh(t.stateNode,n,2),t=as(t,n,2),t!==null&&(Ji(t,2),ua(t))}function qe(t,n,a){if(t.tag===3)L_(t,t,a);else for(;n!==null;){if(n.tag===3){L_(n,t,a);break}else if(n.tag===1){var r=n.stateNode;if(typeof n.type.getDerivedStateFromError=="function"||typeof r.componentDidCatch=="function"&&(hs===null||!hs.has(r))){t=Ri(a,t),a=Cg(2),r=as(n,a,2),r!==null&&(Ng(a,r,n,t),Ji(r,2),ua(r));break}}n=n.return}}function jh(t,n,a){var r=t.pingCache;if(r===null){r=t.pingCache=new oM;var c=new Set;r.set(n,c)}else c=r.get(n),c===void 0&&(c=new Set,r.set(n,c));c.has(a)||(Bh=!0,c.add(a),t=mM.bind(null,t,n,a),n.then(t,t))}function mM(t,n,a){var r=t.pingCache;r!==null&&r.delete(n),t.pingedLanes|=t.suspendedLanes&a,t.warmLanes&=~a,tn===t&&(Ne&a)===a&&((pn===4||pn===3&&(Ne&62914560)===Ne&&300>Lt()-Fc)&&(Ge&2)===0?Hr(t,0):Bc|=a,Pr===Ne&&(Pr=0)),ua(t)}function O_(t,n){n===0&&(n=Eo()),t=Ps(t,n),t!==null&&(Ji(t,n),ua(t))}function gM(t){var n=t.memoizedState,a=0;n!==null&&(a=n.retryLane),O_(t,a)}function _M(t,n){var a=0;switch(t.tag){case 31:case 13:var r=t.stateNode,c=t.memoizedState;c!==null&&(a=c.retryLane);break;case 19:r=t.stateNode;break;case 22:r=t.stateNode._retryCache;break;default:throw Error(s(314))}r!==null&&r.delete(n),O_(t,a)}function vM(t,n){return mt(t,n)}var Vr=null,kr=null,Zh=!1,Yc=!1,Kh=!1,ps=0;function ua(t){t!==kr&&t.next===null&&(kr===null?Vr=kr=t:kr=kr.next=t),Yc=!0,Zh||(Zh=!0,SM())}function sl(t,n){if(!Kh&&Yc){Kh=!0;do for(var a=!1,r=Vr;r!==null;){if(t!==0){var c=r.pendingLanes;if(c===0)var u=0;else{var g=r.suspendedLanes,w=r.pingedLanes;u=(1<<31-fe(42|t)+1)-1,u&=c&~(g&~w),u=u&201326741?u&201326741|1:u?u|2:0}u!==0&&(a=!0,B_(r,u))}else u=Ne,u=Ds(r,r===tn?u:0,r.cancelPendingCommit!==null||r.timeoutHandle!==-1),(u&3)===0||ja(r,u)||(a=!0,B_(r,u));r=r.next}while(a);Kh=!1}}function xM(){P_()}function P_(){Yc=Zh=!1;var t=0;ps!==0&&DM()&&(t=ps);for(var n=Lt(),a=null,r=Vr;r!==null;){var c=r.next,u=I_(r,n);u===0?(r.next=null,a===null?Vr=c:a.next=c,c===null&&(kr=a)):(a=r,(t!==0||(u&3)!==0)&&(Yc=!0)),r=c}on!==0&&on!==5||sl(t),ps!==0&&(ps=0)}function I_(t,n){for(var a=t.suspendedLanes,r=t.pingedLanes,c=t.expirationTimes,u=t.pendingLanes&-62914561;0<u;){var g=31-fe(u),w=1<<g,z=c[g];z===-1?((w&a)===0||(w&r)!==0)&&(c[g]=Mo(w,n)):z<=n&&(t.expiredLanes|=w),u&=~w}if(n=tn,a=Ne,a=Ds(t,t===n?a:0,t.cancelPendingCommit!==null||t.timeoutHandle!==-1),r=t.callbackNode,a===0||t===n&&(We===2||We===9)||t.cancelPendingCommit!==null)return r!==null&&r!==null&&wt(r),t.callbackNode=null,t.callbackPriority=0;if((a&3)===0||ja(t,a)){if(n=a&-a,n===t.callbackPriority)return n;switch(r!==null&&wt(r),Ro(a)){case 2:case 8:a=W;break;case 32:a=zt;break;case 268435456:a=Bt;break;default:a=zt}return r=z_.bind(null,t),a=mt(a,r),t.callbackPriority=n,t.callbackNode=a,n}return r!==null&&r!==null&&wt(r),t.callbackPriority=2,t.callbackNode=null,2}function z_(t,n){if(on!==0&&on!==5)return t.callbackNode=null,t.callbackPriority=0,null;var a=t.callbackNode;if(qc()&&t.callbackNode!==a)return null;var r=Ne;return r=Ds(t,t===tn?r:0,t.cancelPendingCommit!==null||t.timeoutHandle!==-1),r===0?null:(M_(t,r,n),I_(t,Lt()),t.callbackNode!=null&&t.callbackNode===a?z_.bind(null,t):null)}function B_(t,n){if(qc())return null;M_(t,n,!0)}function SM(){LM(function(){(Ge&6)!==0?mt(ae,xM):P_()})}function Qh(){if(ps===0){var t=Gs;t===0&&(t=ur,ur<<=1,(ur&261888)===0&&(ur=256)),ps=t}return ps}function F_(t){return t==null||typeof t=="symbol"||typeof t=="boolean"?null:typeof t=="function"?t:kl(t)}function yM(t,n,a,r,c){if(n==="submit"&&a&&a.stateNode===c){var u=F_((c[H]||null).action),g=r.submitter;g&&(n=(n=g[H]||null)?F_(n.formAction):g.getAttribute("formAction"),n!==null&&(u=n,g=null));var w=new Yl("action","action",null,r,c);t.push({event:w,listeners:[{instance:null,listener:function(){if(r.defaultPrevented){if(ps!==0){var z=new FormData(c,g);sh(a,{pending:!0,data:z,method:c.method,action:u},null,z)}}else typeof u=="function"&&(w.preventDefault(),z=new FormData(c,g),sh(a,{pending:!0,data:z,method:c.method,action:u},u,z))},currentTarget:c}]})}}for(var Jh=0;Jh<Ef.length;Jh++){var $h=Ef[Jh],MM=$h.toLowerCase(),EM=$h[0].toUpperCase()+$h.slice(1);Hi(MM,"on"+EM)}Hi(f0,"onAnimationEnd"),Hi(h0,"onAnimationIteration"),Hi(d0,"onAnimationStart"),Hi("dblclick","onDoubleClick"),Hi("focusin","onFocus"),Hi("focusout","onBlur"),Hi(Uy,"onTransitionRun"),Hi(Ly,"onTransitionStart"),Hi(Oy,"onTransitionCancel"),Hi(p0,"onTransitionEnd"),fn("onMouseEnter",["mouseout","mouseover"]),fn("onMouseLeave",["mouseout","mouseover"]),fn("onPointerEnter",["pointerout","pointerover"]),fn("onPointerLeave",["pointerout","pointerover"]),kt("onChange","change click focusin focusout input keydown keyup selectionchange".split(" ")),kt("onSelect","focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange".split(" ")),kt("onBeforeInput",["compositionend","keypress","textInput","paste"]),kt("onCompositionEnd","compositionend focusout keydown keypress keyup mousedown".split(" ")),kt("onCompositionStart","compositionstart focusout keydown keypress keyup mousedown".split(" ")),kt("onCompositionUpdate","compositionupdate focusout keydown keypress keyup mousedown".split(" "));var rl="abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting".split(" "),bM=new Set("beforetoggle cancel close invalid load scroll scrollend toggle".split(" ").concat(rl));function H_(t,n){n=(n&4)!==0;for(var a=0;a<t.length;a++){var r=t[a],c=r.event;r=r.listeners;t:{var u=void 0;if(n)for(var g=r.length-1;0<=g;g--){var w=r[g],z=w.instance,$=w.currentTarget;if(w=w.listener,z!==u&&c.isPropagationStopped())break t;u=w,c.currentTarget=$;try{u(c)}catch(ht){Kl(ht)}c.currentTarget=null,u=z}else for(g=0;g<r.length;g++){if(w=r[g],z=w.instance,$=w.currentTarget,w=w.listener,z!==u&&c.isPropagationStopped())break t;u=w,c.currentTarget=$;try{u(c)}catch(ht){Kl(ht)}c.currentTarget=null,u=z}}}}function Re(t,n){var a=n[ot];a===void 0&&(a=n[ot]=new Set);var r=t+"__bubble";a.has(r)||(G_(n,t,2,!1),a.add(r))}function td(t,n,a){var r=0;n&&(r|=4),G_(a,t,r,n)}var jc="_reactListening"+Math.random().toString(36).slice(2);function ed(t){if(!t[jc]){t[jc]=!0,ke.forEach(function(a){a!=="selectionchange"&&(bM.has(a)||td(a,!1,t),td(a,!0,t))});var n=t.nodeType===9?t:t.ownerDocument;n===null||n[jc]||(n[jc]=!0,td("selectionchange",!1,n))}}function G_(t,n,a,r){switch(Nv(n)){case 2:var c=gE;break;case 8:c=_E;break;default:c=yd}a=c.bind(null,n,a,t),c=void 0,!cf||n!=="touchstart"&&n!=="touchmove"&&n!=="wheel"||(c=!0),r?c!==void 0?t.addEventListener(n,a,{capture:!0,passive:c}):t.addEventListener(n,a,!0):c!==void 0?t.addEventListener(n,a,{passive:c}):t.addEventListener(n,a,!1)}function nd(t,n,a,r,c){var u=r;if((n&1)===0&&(n&2)===0&&r!==null)t:for(;;){if(r===null)return;var g=r.tag;if(g===3||g===4){var w=r.stateNode.containerInfo;if(w===c)break;if(g===4)for(g=r.return;g!==null;){var z=g.tag;if((z===3||z===4)&&g.stateNode.containerInfo===c)return;g=g.return}for(;w!==null;){if(g=re(w),g===null)return;if(z=g.tag,z===5||z===6||z===26||z===27){r=u=g;continue t}w=w.parentNode}}r=r.return}Gm(function(){var $=u,ht=of(a),Et=[];t:{var K=m0.get(t);if(K!==void 0){var ct=Yl,Ht=t;switch(t){case"keypress":if(Wl(a)===0)break t;case"keydown":case"keyup":ct=ly;break;case"focusin":Ht="focus",ct=df;break;case"focusout":Ht="blur",ct=df;break;case"beforeblur":case"afterblur":ct=df;break;case"click":if(a.button===2)break t;case"auxclick":case"dblclick":case"mousedown":case"mousemove":case"mouseup":case"mouseout":case"mouseover":case"contextmenu":ct=Xm;break;case"drag":case"dragend":case"dragenter":case"dragexit":case"dragleave":case"dragover":case"dragstart":case"drop":ct=KS;break;case"touchcancel":case"touchend":case"touchmove":case"touchstart":ct=dy;break;case f0:case h0:case d0:ct=$S;break;case p0:ct=my;break;case"scroll":case"scrollend":ct=jS;break;case"wheel":ct=_y;break;case"copy":case"cut":case"paste":ct=ey;break;case"gotpointercapture":case"lostpointercapture":case"pointercancel":case"pointerdown":case"pointermove":case"pointerout":case"pointerover":case"pointerup":ct=qm;break;case"submit":ct=fy;break;case"toggle":case"beforetoggle":ct=xy}var $t=(n&4)!==0,ge=!$t&&(t==="scroll"||t==="scrollend"),J=$t?K!==null?K+"Capture":null:K;$t=[];for(var V=$,it;V!==null;){var Mt=V;if(it=Mt.stateNode,Mt=Mt.tag,Mt!==5&&Mt!==26&&Mt!==27||it===null||J===null||(Mt=wo(V,J),Mt!=null&&$t.push(ol(V,Mt,it))),ge)break;V=V.return}0<$t.length&&(K=new ct(K,Ht,null,a,ht),Et.push({event:K,listeners:$t}))}}if((n&7)===0){t:{if(ct=t==="mouseover"||t==="pointerover",K=t==="mouseout"||t==="pointerout",ct&&a!==rf&&(Ht=a.relatedTarget||a.fromElement)&&(re(Ht)||Ht[pt]))break t;(K||ct)&&(Ht=ht.window===ht?ht:(ct=ht.ownerDocument)?ct.defaultView||ct.parentWindow:window,K?(ct=a.relatedTarget||a.toElement,K=$,ct=ct?re(ct):null,ct!==null&&(ge=f(ct),$t=ct.tag,ct!==ge||$t!==5&&$t!==27&&$t!==6)&&(ct=null)):(K=null,ct=$),K!==ct&&($t=Xm,Mt="onMouseLeave",J="onMouseEnter",V="mouse",(t==="pointerout"||t==="pointerover")&&($t=qm,Mt="onPointerLeave",J="onPointerEnter",V="pointer"),ge=K==null?Ht:jt(K),it=ct==null?Ht:jt(ct),Ht=new $t(Mt,V+"leave",K,a,ht),Ht.target=ge,Ht.relatedTarget=it,Mt=null,re(ht)===$&&($t=new $t(J,V+"enter",ct,a,ht),$t.target=it,$t.relatedTarget=ge,Mt=$t),ge=Mt,$t=K&&ct?L(K,ct,TM):null,K!==null&&V_(Et,Ht,K,$t,!1),ct!==null&&ge!==null&&V_(Et,ge,ct,$t,!0)))}t:{if(K=$?jt($):window,ct=K.nodeName&&K.nodeName.toLowerCase(),ct==="select"||ct==="input"&&K.type==="file")var Zt=t0;else if(Jm(K))if(e0)Zt=Cy;else{Zt=Ry;var De=Ay}else ct=K.nodeName,!ct||ct.toLowerCase()!=="input"||K.type!=="checkbox"&&K.type!=="radio"?$&&sf($.elementType)&&(Zt=t0):Zt=wy;if(Zt&&(Zt=Zt(t,$))){$m(Et,Zt,a,ht);break t}De&&De(t,K,$)}switch(De=$?jt($):window,t){case"focusin":(Jm(De)||De.contentEditable==="true")&&(_r=De,Sf=$,Io=null);break;case"focusout":Io=Sf=_r=null;break;case"mousedown":yf=!0;break;case"contextmenu":case"mouseup":case"dragend":yf=!1,c0(Et,a,ht);break;case"selectionchange":if(Dy)break;case"keydown":case"keyup":c0(Et,a,ht)}var ie;if(mf)t:{switch(t){case"compositionstart":var se="onCompositionStart";break t;case"compositionend":se="onCompositionEnd";break t;case"compositionupdate":se="onCompositionUpdate";break t}se=void 0}else gr?Km(t,a)&&(se="onCompositionEnd"):t==="keydown"&&a.keyCode===229&&(se="onCompositionStart");se&&(Ym&&a.locale!=="ko"&&(gr||se!=="onCompositionStart"?se==="onCompositionEnd"&&gr&&(ie=Vm()):(Za=ht,uf="value"in Za?Za.value:Za.textContent,gr=!0)),De=Zc($,se),0<De.length&&(se=new Wm(se,t,null,a,ht),Et.push({event:se,listeners:De}),ie?se.data=ie:(ie=Qm(a),ie!==null&&(se.data=ie)))),(ie=yy?My(t,a):Ey(t,a))&&(se=Zc($,"onBeforeInput"),0<se.length&&(De=new Wm("onBeforeInput","beforeinput",null,a,ht),Et.push({event:De,listeners:se}),De.data=ie)),yM(Et,t,$,a,ht)}H_(Et,n)})}function ol(t,n,a){return{instance:t,listener:n,currentTarget:a}}function Zc(t,n){for(var a=n+"Capture",r=[];t!==null;){var c=t,u=c.stateNode;if(c=c.tag,c!==5&&c!==26&&c!==27||u===null||(c=wo(t,a),c!=null&&r.unshift(ol(t,c,u)),c=wo(t,n),c!=null&&r.push(ol(t,c,u))),t.tag===3)return r;t=t.return}return[]}function TM(t){if(t===null)return null;do t=t.return;while(t&&t.tag!==5&&t.tag!==27);return t||null}function V_(t,n,a,r,c){for(var u=n._reactName,g=[];a!==null&&a!==r;){var w=a,z=w.alternate,$=w.stateNode;if(w=w.tag,z!==null&&z===r)break;w!==5&&w!==26&&w!==27||$===null||(z=$,c?($=wo(a,u),$!=null&&g.unshift(ol(a,$,z))):c||($=wo(a,u),$!=null&&g.push(ol(a,$,z)))),a=a.return}g.length!==0&&t.push({event:n,listeners:g})}var AM=/\r\n?/g,RM=/\u0000|\uFFFD/g;function k_(t){return(typeof t=="string"?t:""+t).replace(AM,`
`).replace(RM,"")}function X_(t,n){return n=k_(n),k_(t)===n}function Ye(t,n,a,r,c,u){switch(a){case"children":if(typeof r=="string")n==="body"||n==="textarea"&&r===""||dr(t,r);else if(typeof r=="number"||typeof r=="bigint")n!=="body"&&dr(t,""+r);else return;break;case"className":ci(t,"class",r);break;case"tabIndex":ci(t,"tabindex",r);break;case"dir":case"role":case"viewBox":case"width":case"height":ci(t,a,r);break;case"style":Fm(t,r,u);return;case"data":if(n!=="object"){ci(t,"data",r);break}case"src":case"href":if(r===""&&(n!=="a"||a!=="href")){t.removeAttribute(a);break}if(r==null||typeof r=="function"||typeof r=="symbol"||typeof r=="boolean"){t.removeAttribute(a);break}r=kl(r),t.setAttribute(a,r);break;case"action":case"formAction":if(typeof r=="function"){t.setAttribute(a,"javascript:throw new Error('A React form was unexpectedly submitted. If you called form.submit() manually, consider using form.requestSubmit() instead. If you\\'re trying to use event.stopPropagation() in a submit event handler, consider also calling event.preventDefault().')");break}else typeof u=="function"&&(a==="formAction"?(n!=="input"&&Ye(t,n,"name",c.name,c,null),Ye(t,n,"formEncType",c.formEncType,c,null),Ye(t,n,"formMethod",c.formMethod,c,null),Ye(t,n,"formTarget",c.formTarget,c,null)):(Ye(t,n,"encType",c.encType,c,null),Ye(t,n,"method",c.method,c,null),Ye(t,n,"target",c.target,c,null)));if(r==null||typeof r=="symbol"||typeof r=="boolean"){t.removeAttribute(a);break}r=kl(r),t.setAttribute(a,r);break;case"onClick":r!=null&&(t.onclick=ta);return;case"onScroll":r!=null&&Re("scroll",t);return;case"onScrollEnd":r!=null&&Re("scrollend",t);return;case"dangerouslySetInnerHTML":if(r!=null){if(typeof r!="object"||!("__html"in r))throw Error(s(61));if(a=r.__html,a!=null){if(c.children!=null)throw Error(s(60));u?.__html!==a&&(t.innerHTML=a)}}break;case"multiple":t.multiple=r&&typeof r!="function"&&typeof r!="symbol";break;case"muted":t.muted=r&&typeof r!="function"&&typeof r!="symbol";break;case"suppressContentEditableWarning":case"suppressHydrationWarning":case"defaultValue":case"defaultChecked":case"innerHTML":case"ref":break;case"autoFocus":break;case"xlinkHref":if(r==null||typeof r=="function"||typeof r=="boolean"||typeof r=="symbol"){t.removeAttribute("xlink:href");break}a=kl(r),t.setAttributeNS("http://www.w3.org/1999/xlink","xlink:href",a);break;case"contentEditable":case"spellCheck":case"draggable":case"value":case"autoReverse":case"externalResourcesRequired":case"focusable":case"preserveAlpha":r!=null&&typeof r!="function"&&typeof r!="symbol"?t.setAttribute(a,r):t.removeAttribute(a);break;case"inert":case"allowFullScreen":case"async":case"autoPlay":case"controls":case"credentialless":case"default":case"defer":case"disabled":case"disablePictureInPicture":case"disableRemotePlayback":case"formNoValidate":case"hidden":case"loop":case"noModule":case"noValidate":case"open":case"playsInline":case"readOnly":case"required":case"reversed":case"scoped":case"seamless":case"itemScope":r&&typeof r!="function"&&typeof r!="symbol"?t.setAttribute(a,""):t.removeAttribute(a);break;case"capture":case"download":r===!0?t.setAttribute(a,""):r!==!1&&r!=null&&typeof r!="function"&&typeof r!="symbol"?t.setAttribute(a,r):t.removeAttribute(a);break;case"cols":case"rows":case"size":case"span":r!=null&&typeof r!="function"&&typeof r!="symbol"&&!isNaN(r)&&1<=r?t.setAttribute(a,r):t.removeAttribute(a);break;case"rowSpan":case"start":r==null||typeof r=="function"||typeof r=="symbol"||isNaN(r)?t.removeAttribute(a):t.setAttribute(a,r);break;case"popover":Re("beforetoggle",t),Re("toggle",t),en(t,"popover",r);break;case"xlinkActuate":Ce(t,"http://www.w3.org/1999/xlink","xlink:actuate",r);break;case"xlinkArcrole":Ce(t,"http://www.w3.org/1999/xlink","xlink:arcrole",r);break;case"xlinkRole":Ce(t,"http://www.w3.org/1999/xlink","xlink:role",r);break;case"xlinkShow":Ce(t,"http://www.w3.org/1999/xlink","xlink:show",r);break;case"xlinkTitle":Ce(t,"http://www.w3.org/1999/xlink","xlink:title",r);break;case"xlinkType":Ce(t,"http://www.w3.org/1999/xlink","xlink:type",r);break;case"xmlBase":Ce(t,"http://www.w3.org/XML/1998/namespace","xml:base",r);break;case"xmlLang":Ce(t,"http://www.w3.org/XML/1998/namespace","xml:lang",r);break;case"xmlSpace":Ce(t,"http://www.w3.org/XML/1998/namespace","xml:space",r);break;case"is":en(t,"is",r);break;case"innerText":case"textContent":return;default:if(!(2<a.length)||a[0]!=="o"&&a[0]!=="O"||a[1]!=="n"&&a[1]!=="N")a=qS.get(a)||a,en(t,a,r);else return}Se=!0}function id(t,n,a,r,c,u){switch(a){case"style":Fm(t,r,u);return;case"dangerouslySetInnerHTML":if(r!=null){if(typeof r!="object"||!("__html"in r))throw Error(s(61));if(a=r.__html,a!=null){if(c.children!=null)throw Error(s(60));u?.__html!==a&&(t.innerHTML=a)}}break;case"children":if(typeof r=="string")dr(t,r);else if(typeof r=="number"||typeof r=="bigint")dr(t,""+r);else return;break;case"onScroll":r!=null&&Re("scroll",t);return;case"onScrollEnd":r!=null&&Re("scrollend",t);return;case"onClick":r!=null&&(t.onclick=ta);return;case"suppressContentEditableWarning":case"suppressHydrationWarning":case"innerHTML":case"ref":return;case"innerText":case"textContent":return;default:if(!En.hasOwnProperty(a))t:{if(a[0]==="o"&&a[1]==="n"&&(c=a.endsWith("Capture"),u=a.slice(2,c?a.length-7:void 0),n=t[H]||null,n=n!=null?n[a]:null,typeof n=="function"&&t.removeEventListener(u,n,c),typeof r=="function")){typeof n!="function"&&n!==null&&(a in t?t[a]=null:t.hasAttribute(a)&&t.removeAttribute(a)),t.addEventListener(u,r,c);break t}Se=!0,a in t?t[a]=r:r===!0?t.setAttribute(a,""):en(t,a,r)}return}Se=!0}function zn(t,n,a){switch(n){case"div":case"span":case"svg":case"path":case"a":case"g":case"p":case"li":break;case"img":Re("error",t),Re("load",t);var r=!1,c=!1,u;for(u in a)if(a.hasOwnProperty(u)){var g=a[u];if(g!=null)switch(u){case"src":r=!0;break;case"srcSet":c=!0;break;case"children":case"dangerouslySetInnerHTML":throw Error(s(137,n));default:Ye(t,n,u,g,a,null)}}c&&Ye(t,n,"srcSet",a.srcSet,a,null),r&&Ye(t,n,"src",a.src,a,null);return;case"input":Re("invalid",t);var w=u=g=c=null,z=null,$=null;for(r in a)if(a.hasOwnProperty(r)){var ht=a[r];if(ht!=null)switch(r){case"name":c=ht;break;case"type":g=ht;break;case"checked":z=ht;break;case"defaultChecked":$=ht;break;case"value":u=ht;break;case"defaultValue":w=ht;break;case"children":case"dangerouslySetInnerHTML":if(ht!=null)throw Error(s(137,n));break;default:Ye(t,n,r,ht,a,null)}}Pm(t,u,w,z,$,g,c,!1);return;case"select":Re("invalid",t),r=g=u=null;for(c in a)if(a.hasOwnProperty(c)&&(w=a[c],w!=null))switch(c){case"value":u=w;break;case"defaultValue":g=w;break;case"multiple":r=w;default:Ye(t,n,c,w,a,null)}n=u,a=g,t.multiple=!!r,n!=null?hr(t,!!r,n,!1):a!=null&&hr(t,!!r,a,!0);return;case"textarea":Re("invalid",t),u=c=r=null;for(g in a)if(a.hasOwnProperty(g)&&(w=a[g],w!=null))switch(g){case"value":r=w;break;case"defaultValue":c=w;break;case"children":u=w;break;case"dangerouslySetInnerHTML":if(w!=null)throw Error(s(91));break;default:Ye(t,n,g,w,a,null)}zm(t,r,c,u);return;case"option":for(z in a)a.hasOwnProperty(z)&&(r=a[z],r!=null)&&(z==="selected"?t.selected=r&&typeof r!="function"&&typeof r!="symbol":Ye(t,n,z,r,a,null));return;case"dialog":Re("beforetoggle",t),Re("toggle",t),Re("cancel",t),Re("close",t);break;case"iframe":case"object":Re("load",t);break;case"video":case"audio":for(r=0;r<rl.length;r++)Re(rl[r],t);break;case"image":Re("error",t),Re("load",t);break;case"details":Re("toggle",t);break;case"embed":case"source":case"link":Re("error",t),Re("load",t);case"area":case"base":case"br":case"col":case"hr":case"keygen":case"meta":case"param":case"track":case"wbr":case"menuitem":for($ in a)if(a.hasOwnProperty($)&&(r=a[$],r!=null))switch($){case"children":case"dangerouslySetInnerHTML":throw Error(s(137,n));default:Ye(t,n,$,r,a,null)}return;default:if(sf(n)){for(ht in a)a.hasOwnProperty(ht)&&(r=a[ht],r!==void 0&&id(t,n,ht,r,a,void 0));return}}for(w in a)a.hasOwnProperty(w)&&(r=a[w],r!=null&&Ye(t,n,w,r,a,null))}var wM={};function CM(t,n,a,r){switch(n){case"div":case"span":case"svg":case"path":case"a":case"g":case"p":case"li":break;case"input":var c=null,u=null,g=null,w=null,z=null,$=null,ht=null;for(ct in a){var Et=a[ct];if(a.hasOwnProperty(ct)&&Et!=null)switch(ct){case"checked":break;case"value":break;case"defaultValue":z=Et;default:r.hasOwnProperty(ct)||Ye(t,n,ct,null,r,Et)}}for(var K in r){var ct=r[K];if(Et=a[K],r.hasOwnProperty(K)&&(ct!=null||Et!=null))switch(K){case"type":ct!==Et&&(Se=!0),u=ct;break;case"name":ct!==Et&&(Se=!0),c=ct;break;case"checked":ct!==Et&&(Se=!0),$=ct;break;case"defaultChecked":ct!==Et&&(Se=!0),ht=ct;break;case"value":ct!==Et&&(Se=!0),g=ct;break;case"defaultValue":ct!==Et&&(Se=!0),w=ct;break;case"children":case"dangerouslySetInnerHTML":if(ct!=null)throw Error(s(137,n));break;default:ct!==Et&&Ye(t,n,K,ct,r,Et)}}nf(t,g,w,z,$,ht,u,c);return;case"select":ct=g=w=K=null;for(u in a)if(z=a[u],a.hasOwnProperty(u)&&z!=null)switch(u){case"value":break;case"multiple":ct=z;default:r.hasOwnProperty(u)||Ye(t,n,u,null,r,z)}for(c in r)if(u=r[c],z=a[c],r.hasOwnProperty(c)&&(u!=null||z!=null))switch(c){case"value":u!==z&&(Se=!0),K=u;break;case"defaultValue":u!==z&&(Se=!0),w=u;break;case"multiple":u!==z&&(Se=!0),g=u;default:u!==z&&Ye(t,n,c,u,r,z)}n=w,a=g,r=ct,K!=null?hr(t,!!a,K,!1):!!r!=!!a&&(n!=null?hr(t,!!a,n,!0):hr(t,!!a,a?[]:"",!1));return;case"textarea":ct=K=null;for(w in a)if(c=a[w],a.hasOwnProperty(w)&&c!=null&&!r.hasOwnProperty(w))switch(w){case"value":break;case"children":break;default:Ye(t,n,w,null,r,c)}for(g in r)if(c=r[g],u=a[g],r.hasOwnProperty(g)&&(c!=null||u!=null))switch(g){case"value":c!==u&&(Se=!0),K=c;break;case"defaultValue":c!==u&&(Se=!0),ct=c;break;case"children":break;case"dangerouslySetInnerHTML":if(c!=null)throw Error(s(91));break;default:c!==u&&Ye(t,n,g,c,r,u)}Im(t,K,ct);return;case"option":for(var Ht in a)K=a[Ht],a.hasOwnProperty(Ht)&&K!=null&&!r.hasOwnProperty(Ht)&&(Ht==="selected"?t.selected=!1:Ye(t,n,Ht,null,r,K));for(z in r)K=r[z],ct=a[z],r.hasOwnProperty(z)&&K!==ct&&(K!=null||ct!=null)&&(z==="selected"?(K!==ct&&(Se=!0),t.selected=K&&typeof K!="function"&&typeof K!="symbol"):Ye(t,n,z,K,r,ct));return;case"img":case"link":case"area":case"base":case"br":case"col":case"embed":case"hr":case"keygen":case"meta":case"param":case"source":case"track":case"wbr":case"menuitem":for(var $t in a)K=a[$t],a.hasOwnProperty($t)&&K!=null&&!r.hasOwnProperty($t)&&Ye(t,n,$t,null,r,K);for($ in r)if(K=r[$],ct=a[$],r.hasOwnProperty($)&&K!==ct&&(K!=null||ct!=null))switch($){case"children":case"dangerouslySetInnerHTML":if(K!=null)throw Error(s(137,n));break;default:Ye(t,n,$,K,r,ct)}return;default:if(sf(n)){for(var ge in a)K=a[ge],a.hasOwnProperty(ge)&&K!==void 0&&!r.hasOwnProperty(ge)&&id(t,n,ge,void 0,r,K);for(ht in r)K=r[ht],ct=a[ht],!r.hasOwnProperty(ht)||K===ct||K===void 0&&ct===void 0||id(t,n,ht,K,r,ct);return}}for(var J in a)K=a[J],a.hasOwnProperty(J)&&K!=null&&!r.hasOwnProperty(J)&&Ye(t,n,J,null,r,K);for(Et in r)K=r[Et],ct=a[Et],!r.hasOwnProperty(Et)||K===ct||K==null&&ct==null||Ye(t,n,Et,K,r,ct)}function W_(t){switch(t){case"css":case"script":case"font":case"img":case"image":case"input":case"link":return!0;default:return!1}}function NM(){if(typeof performance.getEntriesByType=="function"){for(var t=0,n=0,a=performance.getEntriesByType("resource"),r=0;r<a.length;r++){var c=a[r],u=c.transferSize,g=c.initiatorType,w=c.duration;if(u&&w&&W_(g)){for(g=0,w=c.responseEnd,r+=1;r<a.length;r++){var z=a[r],$=z.startTime;if($>w)break;var ht=z.transferSize,Et=z.initiatorType;ht&&W_(Et)&&(z=z.responseEnd,g+=ht*(z<w?1:(w-$)/(z-$)))}if(--r,n+=8*(u+g)/(c.duration/1e3),t++,10<t)break}}if(0<t)return n/t/1e6}return navigator.connection&&(t=navigator.connection.downlink,typeof t=="number")?t:5}var ad=null,sd=null;function ll(t){return t.nodeType===9?t:t.ownerDocument}function q_(t){switch(t){case"http://www.w3.org/2000/svg":return 1;case"http://www.w3.org/1998/Math/MathML":return 2;default:return 0}}function Y_(t,n){if(t===0)switch(n){case"svg":return 1;case"math":return 2;default:return 0}return t===1&&n==="foreignObject"?0:t}function j_(t,n,a,r){return a=ll(a).createElement(t),a[R]=r,a[H]=n,zn(a,t,n),xe(a),a}function rd(t,n){return t==="textarea"||t==="noscript"||typeof n.children=="string"||typeof n.children=="number"||typeof n.children=="bigint"||typeof n.dangerouslySetInnerHTML=="object"&&n.dangerouslySetInnerHTML!==null&&n.dangerouslySetInnerHTML.__html!=null}var od=null;function DM(){var t=window.event;return t&&t.type==="popstate"?t===od?!1:(od=t,!0):(od=null,!1)}var ld=typeof setTimeout=="function"?setTimeout:void 0,UM=typeof clearTimeout=="function"?clearTimeout:void 0,Z_=typeof Promise=="function"?Promise:void 0,K_=typeof requestAnimationFrame=="function"?requestAnimationFrame:ld,LM=typeof queueMicrotask=="function"?queueMicrotask:typeof Z_<"u"?function(t){return Z_.resolve(null).then(t).catch(OM)}:ld;function OM(t){setTimeout(function(){throw t})}function ms(t){return t==="head"}function Q_(t,n){var a=n,r=0;do{var c=a.nextSibling;if(t.removeChild(a),c&&c.nodeType===8)if(a=c.data,a==="/$"||a==="/&"){if(r===0){t.removeChild(c),Kr(n);return}r--}else if(a==="$"||a==="$?"||a==="$~"||a==="$!"||a==="&")r++;else if(a==="html")gd(t.ownerDocument.documentElement);else if(a==="head"){a=t.ownerDocument.head,gd(a);for(var u=a.firstChild;u;){var g=u.nextSibling,w=u.nodeName;u[Ft]||w==="SCRIPT"||w==="STYLE"||w==="LINK"&&u.rel.toLowerCase()==="stylesheet"||a.removeChild(u),u=g}}else a==="body"&&gd(t.ownerDocument.body);a=c}while(a);Kr(n)}function J_(t,n){var a=t;t=0;do{var r=a.nextSibling;if(a.nodeType===1?n?(a._stashedDisplay=a.style.display,a.style.display="none"):(a.style.display=a._stashedDisplay||"",a.getAttribute("style")===""&&a.removeAttribute("style")):a.nodeType===3&&(n?(a._stashedText=a.nodeValue,a.nodeValue=""):a.nodeValue=a._stashedText||""),r&&r.nodeType===8)if(a=r.data,a==="/$"){if(t===0)break;t--}else a!=="$"&&a!=="$?"&&a!=="$~"&&a!=="$!"||t++;a=r}while(a)}function $_(t,n,a){if(n=CSS.escape(n)!==n?"r-"+btoa(n).replace(/=/g,""):n,t.style.viewTransitionName=n,a!=null&&(t.style.viewTransitionClass=a),a=getComputedStyle(t),a.display==="inline"){if(n=t.getClientRects(),n.length===1)var r=1;else for(var c=r=0;c<n.length;c++){var u=n[c];0<u.width&&0<u.height&&r++}r===1&&(t=t.style,t.display=n.length===1?"inline-block":"block",t.marginTop="-"+a.paddingTop,t.marginBottom="-"+a.paddingBottom)}}function tv(t,n){t=t.style,n=n.style;var a=n!=null?n.hasOwnProperty("viewTransitionName")?n.viewTransitionName:n.hasOwnProperty("view-transition-name")?n["view-transition-name"]:null:null;t.viewTransitionName=a==null||typeof a=="boolean"?"":(""+a).trim(),a=n!=null?n.hasOwnProperty("viewTransitionClass")?n.viewTransitionClass:n.hasOwnProperty("view-transition-class")?n["view-transition-class"]:null:null,t.viewTransitionClass=a==null||typeof a=="boolean"?"":(""+a).trim(),t.display==="inline-block"&&(n==null?t.display=t.margin="":(a=n.display,t.display=a==null||typeof a=="boolean"?"":a,a=n.margin,a!=null?t.margin=a:(a=n.hasOwnProperty("marginTop")?n.marginTop:n["margin-top"],t.marginTop=a==null||typeof a=="boolean"?"":a,n=n.hasOwnProperty("marginBottom")?n.marginBottom:n["margin-bottom"],t.marginBottom=n==null||typeof n=="boolean"?"":n)))}function PM(t,n,a){return a=a.ownerDocument.defaultView,{rect:t,abs:n.position==="absolute"||n.position==="fixed",clip:n.clipPath!=="none"||n.overflow!=="visible"||n.filter!=="none"||n.mask!=="none"||n.mask!=="none"||n.borderRadius!=="0px",view:0<=t.bottom&&0<=t.right&&t.top<=a.innerHeight&&t.left<=a.innerWidth}}function cd(t){var n=t.getBoundingClientRect(),a=getComputedStyle(t);return PM(n,a,t)}function IM(t){return t.documentElement.clientHeight}function zM(t){this.addEventListener("load",t),this.addEventListener("error",t)}function BM(t,n,a,r,c,u,g,w,z){var $=n.nodeType===9?n:n.ownerDocument;try{var ht=$.startViewTransition({update:function(){var K=$.defaultView,ct=K.navigation&&K.navigation.transition,Ht=$.fonts.status;r();var $t=[];if(Ht==="loaded"&&(IM($),$.fonts.status==="loading"&&$t.push($.fonts.ready)),Ht=$t.length,t!==null)for(var ge=t.suspenseyImages,J=0,V=0;V<ge.length;V++){var it=ge[V];if(!it.complete){var Mt=it.getBoundingClientRect();if(0<Mt.bottom&&0<Mt.right&&Mt.top<K.innerHeight&&Mt.left<K.innerWidth){if(J+=yv(it),J>Jc){$t.length=Ht;break}it=new Promise(zM.bind(it)),$t.push(it)}}}if(0<$t.length)return K=Promise.race([Promise.all($t),new Promise(function(Zt){return setTimeout(Zt,500)})]).then(c,c),(ct?Promise.allSettled([ct.finished,K]):K).then(u,u);if(c(),ct)return ct.finished.then(u,u);u()},types:a});$.__reactViewTransition=ht;var Et=[];return ht.ready.then(function(){for(var K=$.documentElement.getAnimations({subtree:!0}),ct=0;ct<K.length;ct++){var Ht=K[ct],$t=Ht.effect,ge=$t.pseudoElement;if(ge!=null&&ge.startsWith("::view-transition")){Et.push(Ht),Ht=$t.getKeyframes();for(var J=ge=void 0,V=!0,it=0;it<Ht.length;it++){var Mt=Ht[it],Zt=Mt.width;if(ge===void 0)ge=Zt;else if(ge!==Zt){V=!1;break}if(Zt=Mt.height,J===void 0)J=Zt;else if(J!==Zt){V=!1;break}delete Mt.width,delete Mt.height,Mt.transform==="none"&&delete Mt.transform}V&&ge!==void 0&&J!==void 0&&($t.setKeyframes(Ht),V=getComputedStyle($t.target,$t.pseudoElement),V.width!==ge||V.height!==J)&&(V=Ht[0],V.width=ge,V.height=J,V=Ht[Ht.length-1],V.width=ge,V.height=J,$t.setKeyframes(Ht))}}g()},function(K){$.__reactViewTransition===ht&&($.__reactViewTransition=null);try{typeof K=="object"&&K!==null&&K.name==="InvalidStateError"&&(K.message==="View transition was skipped because document visibility state is hidden."||K.message==="Skipping view transition because document visibility state has become hidden."||K.message==="Skipping view transition because viewport size changed."||K.message==="Transition was aborted because of invalid state")&&(K=null),K!==null&&z(K)}finally{r(),c(),g()}}),ht.finished.finally(function(){for(var K=0;K<Et.length;K++)Et[K].cancel();$.__reactViewTransition===ht&&($.__reactViewTransition=null),w()}),ht}catch{return r(),c(),g(),null}}function Js(t,n){this._scope=document.documentElement,this._selector="::view-transition-"+t+"("+n+")"}Js.prototype.animate=function(t,n){return n=typeof n=="number"?{duration:n}:I({},n),n.pseudoElement=this._selector,this._scope.animate(t,n)},Js.prototype.getAnimations=function(){for(var t=this._scope,n=this._selector,a=t.getAnimations({subtree:!0}),r=[],c=0;c<a.length;c++){var u=a[c].effect;u!==null&&u.target===t&&u.pseudoElement===n&&r.push(a[c])}return r},Js.prototype.getComputedStyle=function(){return getComputedStyle(this._scope,this._selector)};function ev(t){return{name:t,group:new Js("group",t),imagePair:new Js("image-pair",t),old:new Js("old",t),new:new Js("new",t)}}function gi(t){this._fragmentFiber=t,this._observers=this._eventListeners=null}gi.prototype.addEventListener=function(t,n,a){var r=null,c=null;if(!(a!=null&&typeof a!="boolean"&&(r=a.signal||null,r!==null&&r.aborted))){this._eventListeners===null&&(this._eventListeners=[]);var u=this._eventListeners;if(iv(u,t,n,a)===-1){var g=this,w=n;a!=null&&typeof a!="boolean"&&a.once===!0&&(w=function(z){g.removeEventListener(t,n,a),typeof n=="function"?n.call(this,z):n.handleEvent(z)}),r!==null&&(c=g.removeEventListener.bind(g,t,n,a),r.addEventListener("abort",c,{once:!0}),c=r.removeEventListener.bind(r,"abort",c)),r=Xr(a),u.push({type:t,listener:n,optionsOrUseCapture:a,attachedListener:w,cleanup:c}),_(this._fragmentFiber.child,!1,FM,t,w,r)}this._eventListeners=u}};function FM(t,n,a,r){return y(t).addEventListener(n,a,r),!1}gi.prototype.removeEventListener=function(t,n,a){var r=this._eventListeners;if(r!==null&&(n=iv(r,t,n,a),n!==-1)){var c=r[n];a=c.attachedListener;var u=c.cleanup;c=Xr(c.optionsOrUseCapture),_(this._fragmentFiber.child,!1,HM,t,a,c),r.splice(n,1),u!==null&&u()}};function HM(t,n,a,r){return y(t).removeEventListener(n,a,r),!1}function Xr(t){return t!=null&&typeof t!="boolean"&&(t.once===!0||t.signal instanceof AbortSignal)?{capture:t.capture,passive:t.passive}:t}function nv(t){return t==null?"c=0":typeof t=="boolean"?"c="+(t?"1":"0"):"c="+(t.capture?"1":"0")}function iv(t,n,a,r){if(t.length===0)return-1;r=nv(r);for(var c=0;c<t.length;c++){var u=t[c];if(u.type===n&&u.listener===a&&nv(u.optionsOrUseCapture)===r)return c}return-1}gi.prototype.dispatchEvent=function(t){var n=v(this._fragmentFiber);if(n===null)return!0;n=y(n);var a=this._eventListeners;if(a!==null&&0<a.length||!t.bubbles){var r=n.nodeType===9?n.createComment(""):document.createTextNode("");if(a)for(var c=0;c<a.length;c++){var u=a[c];r.addEventListener(u.type,u.attachedListener,Xr(u.optionsOrUseCapture))}if(n.appendChild(r),t=r.dispatchEvent(t),a)for(c=0;c<a.length;c++)u=a[c],r.removeEventListener(u.type,u.attachedListener,Xr(u.optionsOrUseCapture));return n.removeChild(r),t}return n.dispatchEvent(t)},gi.prototype.focus=function(t){_(this._fragmentFiber.child,!0,av,t,void 0,void 0)};function av(t,n){return t.tag===6?!1:(t=y(t),JM(t,n))}gi.prototype.focusLast=function(t){var n=[];_(this._fragmentFiber.child,!0,ud,n,void 0,void 0);for(var a=n.length-1;0<=a&&!av(n[a],t);a--);};function ud(t,n){return n.push(t),!1}gi.prototype.blur=function(){var t=v(this._fragmentFiber);t!==null&&(t=y(t),t=ll(t).activeElement,t!==null&&_(this._fragmentFiber.child,!1,GM,t,void 0,void 0))};function GM(t,n){return t.tag===6?!1:(t=y(t),t===n||t.contains(n)?(n.blur(),!0):!1)}gi.prototype.observeUsing=function(t){this._observers===null&&(this._observers=new Set),this._observers.add(t),_(this._fragmentFiber.child,!1,VM,t,void 0,void 0)};function VM(t,n){return t.tag===6||(t=y(t),n.observe(t)),!1}gi.prototype.unobserveUsing=function(t){var n=this._observers;if(n!==null&&n.has(t)){n.delete(t),_(this._fragmentFiber.child,!1,kM,t,void 0,void 0);for(var a=n=0;a<Wi.length;a++){var r=Wi[a];r.fragmentInstance===this&&r.observer===t?t.unobserve(r.instance):Wi[n++]=r}Wi.length=n}};function kM(t,n){return t.tag===6||(t=y(t),n.unobserve(t)),!1}var Wi=[],fd=!1;function XM(t,n,a){Wi.push({fragmentInstance:t,observer:n,instance:a}),fd||(fd=!0,$M(function(){fd=!1;var r=Wi;Wi=[];for(var c=0;c<r.length;c++){var u=r[c];u.observer.unobserve(u.instance)}}))}gi.prototype.getClientRects=function(){var t=[];return _(this._fragmentFiber.child,!1,WM,t,void 0,void 0),t};function WM(t,n){if(t.tag===6){t=t.stateNode;var a=t.ownerDocument.createRange();a.selectNodeContents(t),n.push.apply(n,a.getClientRects())}else t=y(t),n.push.apply(n,t.getClientRects());return!1}gi.prototype.getRootNode=function(t){var n=v(this._fragmentFiber);return n===null?this:y(n).getRootNode(t)},gi.prototype.compareDocumentPosition=function(t){var n=v(this._fragmentFiber);if(n===null)return Node.DOCUMENT_POSITION_DISCONNECTED;var a=[];_(this._fragmentFiber.child,!1,ud,a,void 0,void 0);var r=y(n);if(a.length===0){if(a=r,M(this._fragmentFiber)){t:{for(n=this._fragmentFiber.return;n!==null;){if(n.tag===4){n=n.stateNode.containerInfo;break t}if(n.tag===3||n.tag===5||n.tag===27)break;n=n.return}n=null}n!=null&&(a=n)}n=this._fragmentFiber;var c=r=a.compareDocumentPosition(t);return a===t?c=Node.DOCUMENT_POSITION_CONTAINS:r&Node.DOCUMENT_POSITION_CONTAINED_BY&&(a=A(n)[1],a===null?c=Node.DOCUMENT_POSITION_PRECEDING:(t=y(a).compareDocumentPosition(t),c=t===0||t&Node.DOCUMENT_POSITION_FOLLOWING?Node.DOCUMENT_POSITION_FOLLOWING:Node.DOCUMENT_POSITION_PRECEDING)),c|=Node.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC}n=y(a[0]),c=y(a[a.length-1]);var u=M(this._fragmentFiber)?n.parentElement:r;if(u==null)return Node.DOCUMENT_POSITION_DISCONNECTED;r=u.compareDocumentPosition(n)&Node.DOCUMENT_POSITION_CONTAINED_BY,u=u.compareDocumentPosition(c)&Node.DOCUMENT_POSITION_CONTAINED_BY;var g=n.compareDocumentPosition(t),w=c.compareDocumentPosition(t),z=g&Node.DOCUMENT_POSITION_CONTAINED_BY||w&Node.DOCUMENT_POSITION_CONTAINED_BY;return w=r&&u&&g&Node.DOCUMENT_POSITION_FOLLOWING&&w&Node.DOCUMENT_POSITION_PRECEDING,n=r&&n===t||u&&c===t||z||w?Node.DOCUMENT_POSITION_CONTAINED_BY:!r&&n===t||!u&&c===t?Node.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC:g,n&Node.DOCUMENT_POSITION_DISCONNECTED||n&Node.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC||qM(n,this._fragmentFiber,a[0],a[a.length-1],t)?n:Node.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC};function qM(t,n,a,r,c){var u=re(c);if(t&Node.DOCUMENT_POSITION_CONTAINED_BY){if(a=!!u)t:{for(;u!==null;){if(u.tag===7&&(u===n||u.alternate===n)){a=!0;break t}u=u.return}a=!1}return a}if(t&Node.DOCUMENT_POSITION_CONTAINS){if(u===null)return u=c.ownerDocument,c===u||c===u.documentElement||c===u.body;t:{for(u=n,n=v(n);u!==null;){if(!(u.tag!==5&&u.tag!==3&&u.tag!==27||u!==n&&u.alternate!==n)){u=!0;break t}u=u.return}u=!1}return u}return t&Node.DOCUMENT_POSITION_PRECEDING?((n=!!u)&&!(n=u===a)&&(n=L(a,u,D),n===null?n=!1:(_(n,!0,F,u,a),u=x,x=null,n=u!==null)),n):t&Node.DOCUMENT_POSITION_FOLLOWING?((n=!!u)&&!(n=u===r)&&(n=L(r,u,D),n===null?n=!1:(_(n,!0,C,u,r),u=x,U=x=null,n=u!==null)),n):!1}function sv(t,n){var a=t.ownerDocument.createRange();a.selectNodeContents(t),t=a.getBoundingClientRect(),window.scrollTo(window.scrollX+t.left,n?window.scrollY+t.top:window.scrollY+t.bottom-window.innerHeight)}gi.prototype.scrollIntoView=function(t){if(typeof t=="object")throw Error(s(566));var n=[];_(this._fragmentFiber.child,!1,ud,n,void 0,void 0);var a=t!==!1;if(n.length===0){var r=A(this._fragmentFiber);if(r=a?r[1]||r[0]||v(this._fragmentFiber):r[0]||r[1],r===null)return;if(r.tag===6){t=y(r),sv(t,a);return}if(r=y(r),r.nodeType!==9){if(r.nodeType===11){a="host"in r?r.host:null,a!==null&&a.scrollIntoView(t);return}r.scrollIntoView(t)}}for(r=a?n.length-1:0;r!==(a?-1:n.length);){var c=n[r];c.tag===6?(c=y(c),sv(c,a)):y(c).scrollIntoView(t),r+=a?-1:1}};function YM(t,n){return t=y(t),rv(t,n),!1}function rv(t,n){t.reactFragments==null&&(t.reactFragments=new Set),t.reactFragments.add(n)}function ov(t,n){var a=n._eventListeners;if(a!==null)for(var r=0;r<a.length;r++){var c=a[r];t.addEventListener(c.type,c.attachedListener,Xr(c.optionsOrUseCapture))}t.nodeType!==3&&(a=n._observers,a!==null&&a.forEach(function(u){for(var g=0,w=0;w<Wi.length;w++){var z=Wi[w];(z.fragmentInstance!==n||z.observer!==u||z.instance!==t)&&(Wi[g++]=z)}Wi.length=g,u.observe(t)}),rv(t,n))}function jM(t,n){var a=n._eventListeners;if(a!==null)for(var r=0;r<a.length;r++){var c=a[r];t.removeEventListener(c.type,c.attachedListener,Xr(c.optionsOrUseCapture))}t.nodeType!==3&&(a=n._observers,a!==null&&a.forEach(function(u){typeof u.rootMargin=="string"?XM(n,u,t):u.unobserve(t)}),t.reactFragments!=null&&t.reactFragments.delete(n))}function hd(t){var n=t.firstChild;for(n&&n.nodeType===10&&(n=n.nextSibling);n;){var a=n;switch(n=n.nextSibling,a.nodeName){case"HTML":case"HEAD":case"BODY":hd(a),Jt(a);continue;case"SCRIPT":case"STYLE":continue;case"LINK":if(a.rel.toLowerCase()==="stylesheet")continue}t.removeChild(a)}}function ZM(t,n,a,r){for(;t.nodeType===1;){var c=a;if(t.nodeName.toLowerCase()!==n.toLowerCase()){if(!r&&(t.nodeName!=="INPUT"||t.type!=="hidden"))break}else if(r){if(!t[Ft])switch(n){case"meta":if(!t.hasAttribute("itemprop"))break;return t;case"link":if(u=t.getAttribute("rel"),u==="stylesheet"&&t.hasAttribute("data-precedence"))break;if(u!==c.rel||t.getAttribute("href")!==(c.href==null||c.href===""?null:c.href)||t.getAttribute("crossorigin")!==(c.crossOrigin==null?null:c.crossOrigin)||t.getAttribute("title")!==(c.title==null?null:c.title))break;return t;case"style":if(t.hasAttribute("data-precedence"))break;return t;case"script":if(u=t.getAttribute("src"),(u!==(c.src==null?null:c.src)||t.getAttribute("type")!==(c.type==null?null:c.type)||t.getAttribute("crossorigin")!==(c.crossOrigin==null?null:c.crossOrigin))&&u&&t.hasAttribute("async")&&!t.hasAttribute("itemprop"))break;return t;default:return t}}else if(n==="input"&&t.type==="hidden"){var u=c.name==null?null:""+c.name;if(c.type==="hidden"&&t.getAttribute("name")===u)return t}else return t;if(t=Ui(t.nextSibling),t===null)break}return null}function KM(t,n,a){if(n==="")return null;for(;t.nodeType!==3;)if((t.nodeType!==1||t.nodeName!=="INPUT"||t.type!=="hidden")&&!a||(t=Ui(t.nextSibling),t===null))return null;return t}function lv(t,n){for(;t.nodeType!==8;)if((t.nodeType!==1||t.nodeName!=="INPUT"||t.type!=="hidden")&&!n||(t=Ui(t.nextSibling),t===null))return null;return t}function dd(t){return t.data==="$?"||t.data==="$~"}function pd(t){return t.data==="$!"||t.data==="$?"&&t.ownerDocument.readyState!=="loading"}function QM(t,n){var a=t.ownerDocument;if(t.data==="$~")t._reactRetry=n;else if(t.data!=="$?"||a.readyState!=="loading")n();else{var r=function(){n(),a.removeEventListener("DOMContentLoaded",r)};a.addEventListener("DOMContentLoaded",r),t._reactRetry=r}}function Ui(t){for(;t!=null;t=t.nextSibling){var n=t.nodeType;if(n===1||n===3)break;if(n===8){if(n=t.data,n==="$"||n==="$!"||n==="$?"||n==="$~"||n==="&"||n==="F!"||n==="F")break;if(n==="/$"||n==="/&")return null}}return t}var md=null;function cv(t){t=t.nextSibling;for(var n=0;t;){if(t.nodeType===8){var a=t.data;if(a==="/$"||a==="/&"){if(n===0)return Ui(t.nextSibling);n--}else a!=="$"&&a!=="$!"&&a!=="$?"&&a!=="$~"&&a!=="&"||n++}t=t.nextSibling}return null}function uv(t){t=t.previousSibling;for(var n=0;t;){if(t.nodeType===8){var a=t.data;if(a==="$"||a==="$!"||a==="$?"||a==="$~"||a==="&"){if(n===0)return t;n--}else a!=="/$"&&a!=="/&"||n++}t=t.previousSibling}return null}function JM(t,n){function a(){r=!0}if(t.ownerDocument.activeElement===t)return!0;var r=!1;try{t.ownerDocument.addEventListener("focus",a,!0),(t.focus||HTMLElement.prototype.focus).call(t,n)}finally{t.ownerDocument.removeEventListener("focus",a,!0)}return r}function $M(t){K_(function(){K_(function(n){return t(n)})})}function fv(t,n,a){switch(n=ll(a),t){case"html":if(t=n.documentElement,!t)throw Error(s(452));return t;case"head":if(t=n.head,!t)throw Error(s(453));return t;case"body":if(t=n.body,!t)throw Error(s(454));return t;default:throw Error(s(451))}}function hv(t,n,a){for(var r in a){var c=a[r];a.hasOwnProperty(r)&&c!=null&&Ye(t,n,r,null,wM,c)}a.dangerouslySetInnerHTML!=null&&(t.textContent=""),t.onclick===ta&&(t.onclick=null),Jt(t)}function gd(t){for(var n=t.attributes;n.length;)t.removeAttributeNode(n[0]);Jt(t)}var Li=new Map,dv=new Set;function cl(t){if(typeof t.getRootNode=="function"){var n=t.getRootNode();if(n.nodeType===9||n.nodeType===11)return n}return t.nodeType===9?t:t.ownerDocument}var Pa=Ut.d;Ut.d={f:tE,r:eE,D:nE,C:iE,L:aE,m:sE,X:oE,S:rE,M:lE};function tE(){var t=Pa.f(),n=kc();return t||n}function eE(t){var n=he(t);n!==null&&n.tag===5&&n.type==="form"?mg(n):Pa.r(t)}var Wr=typeof document>"u"?null:document;function pv(t,n,a){var r=Wr;if(r&&typeof n=="string"&&n){var c=Ti(n);c='link[rel="'+t+'"][href="'+c+'"]',typeof a=="string"&&(c+='[crossorigin="'+a+'"]'),dv.has(c)||(dv.add(c),t={rel:t,crossOrigin:a,href:n},r.querySelector(c)===null&&(n=r.createElement("link"),zn(n,"link",t),xe(n),r.head.appendChild(n)))}}function nE(t){Pa.D(t),pv("dns-prefetch",t,null)}function iE(t,n){Pa.C(t,n),pv("preconnect",t,n)}function aE(t,n,a){Pa.L(t,n,a);var r=Wr;if(r&&t&&n){var c='link[rel="preload"][as="'+Ti(n)+'"]';n==="image"&&a&&a.imageSrcSet?(c+='[imagesrcset="'+Ti(a.imageSrcSet)+'"]',typeof a.imageSizes=="string"&&(c+='[imagesizes="'+Ti(a.imageSizes)+'"]')):c+='[href="'+Ti(t)+'"]';var u=c;switch(n){case"style":u=qr(t);break;case"script":u=Yr(t)}if(!(Li.has(u)||(t=I({rel:"preload",href:n==="image"&&a&&a.imageSrcSet?void 0:t,as:n},a),Li.set(u,t),r.querySelector(c)!==null||n==="style"&&r.querySelector(ul(u))||n==="script"&&r.querySelector(fl(u))))){var g=r.createElement("link");zn(g,"link",t),n==="style"&&(g[Kt]=!0,g.onload=g.onerror=function(){Qe(g)}),xe(g),r.head.appendChild(g)}}}function sE(t,n){Pa.m(t,n);var a=Wr;if(a&&t){var r=n&&typeof n.as=="string"?n.as:"script",c='link[rel="modulepreload"][as="'+Ti(r)+'"][href="'+Ti(t)+'"]',u=c;switch(r){case"audioworklet":case"paintworklet":case"serviceworker":case"sharedworker":case"worker":case"script":u=Yr(t)}if(!Li.has(u)&&(t=I({rel:"modulepreload",href:t},n),Li.set(u,t),a.querySelector(c)===null)){switch(r){case"audioworklet":case"paintworklet":case"serviceworker":case"sharedworker":case"worker":case"script":if(a.querySelector(fl(u)))return}r=a.createElement("link"),zn(r,"link",t),xe(r),a.head.appendChild(r)}}}function rE(t,n,a){Pa.S(t,n,a);var r=Wr;if(r&&t){var c=Te(r).hoistableStyles,u=qr(t);n=n||"default";var g=c.get(u);if(!g){var w={loading:0,preload:null};if(g=r.querySelector(ul(u)))w.loading=5;else{t=I({rel:"stylesheet",href:t,"data-precedence":n},a),(a=Li.get(u))&&_d(t,a);var z=g=r.createElement("link");xe(z),zn(z,"link",t),z._p=new Promise(function($,ht){z.onload=$,z.onerror=ht}),z.addEventListener("load",function(){w.loading|=1}),z.addEventListener("error",function(){w.loading|=2}),w.loading|=4,Kc(g,n,r)}g={type:"stylesheet",instance:g,count:1,state:w},c.set(u,g)}}}function oE(t,n){Pa.X(t,n);var a=Wr;if(a&&t){var r=Te(a).hoistableScripts,c=Yr(t),u=r.get(c);u||(u=a.querySelector(fl(c)),u||(t=I({src:t,async:!0},n),(n=Li.get(c))&&vd(t,n),u=a.createElement("script"),xe(u),zn(u,"link",t),a.head.appendChild(u)),u={type:"script",instance:u,count:1,state:null},r.set(c,u))}}function lE(t,n){Pa.M(t,n);var a=Wr;if(a&&t){var r=Te(a).hoistableScripts,c=Yr(t),u=r.get(c);u||(u=a.querySelector(fl(c)),u||(t=I({src:t,async:!0,type:"module"},n),(n=Li.get(c))&&vd(t,n),u=a.createElement("script"),xe(u),zn(u,"link",t),a.head.appendChild(u)),u={type:"script",instance:u,count:1,state:null},r.set(c,u))}}function mv(t,n,a,r){var c=(c=Pe.current)?cl(c):null;if(!c)throw Error(s(446));switch(t){case"meta":case"title":return null;case"style":return typeof a.precedence=="string"&&typeof a.href=="string"?(a=qr(a.href),n=Te(c).hoistableStyles,r=n.get(a),r||(r={type:"style",instance:null,count:0,state:null},n.set(a,r)),r):{type:"void",instance:null,count:0,state:null};case"link":if(a.rel==="stylesheet"&&typeof a.href=="string"&&typeof a.precedence=="string"){t=qr(a.href);var u=Te(c).hoistableStyles,g=u.get(t);if(g||(c=c.ownerDocument||c,g={type:"stylesheet",instance:null,count:0,state:{loading:0,preload:null}},u.set(t,g),(u=c.querySelector(ul(t)))?u._p||(g.instance=u,g.state.loading=5):(u=Li.get(t),u||(u={rel:"preload",as:"style",href:a.href,crossOrigin:a.crossOrigin,integrity:a.integrity,media:a.media,hrefLang:a.hrefLang,referrerPolicy:a.referrerPolicy},Li.set(t,u)),cE(c,t,u,g.state))),n&&r===null)throw Error(s(528,""));return g}if(n&&r!==null)throw Error(s(529,""));return null;case"script":return n=a.async,a=a.src,typeof a=="string"&&n&&typeof n!="function"&&typeof n!="symbol"?(a=Yr(a),n=Te(c).hoistableScripts,r=n.get(a),r||(r={type:"script",instance:null,count:0,state:null},n.set(a,r)),r):{type:"void",instance:null,count:0,state:null};default:throw Error(s(444,t))}}function qr(t){return'href="'+Ti(t)+'"'}function ul(t){return'link[rel="stylesheet"]['+t+"]"}function gv(t){return I({},t,{"data-precedence":t.precedence,precedence:null})}function cE(t,n,a,r){if(n=t.querySelector('link[rel="preload"][as="style"]['+n+"]")){if(n[Kt]!==!0){r.loading=1;return}}else n=t.createElement("link"),n[Kt]=!0,n.onload=n.onerror=Qe.bind(null,n),zn(n,"link",a),xe(n),t.head.appendChild(n);r.preload=n,n.addEventListener("load",function(){return r.loading|=1}),n.addEventListener("error",function(){return r.loading|=2})}function Yr(t){return'[src="'+Ti(t)+'"]'}function fl(t){return"script[async]"+t}function _v(t,n,a){if(n.count++,n.instance===null)switch(n.type){case"style":var r=t.querySelector('style[data-href~="'+Ti(a.href)+'"]');if(r)return n.instance=r,xe(r),r;var c=I({},a,{"data-href":a.href,"data-precedence":a.precedence,href:null,precedence:null});return r=(t.ownerDocument||t).createElement("style"),xe(r),zn(r,"style",c),Kc(r,a.precedence,t),n.instance=r;case"stylesheet":c=qr(a.href);var u=t.querySelector(ul(c));if(u)return n.state.loading|=4,n.instance=u,xe(u),u;r=gv(a),(c=Li.get(c))&&_d(r,c),u=(t.ownerDocument||t).createElement("link"),xe(u);var g=u;return g._p=new Promise(function(w,z){g.onload=w,g.onerror=z}),zn(u,"link",r),n.state.loading|=4,Kc(u,a.precedence,t),n.instance=u;case"script":return u=Yr(a.src),(c=t.querySelector(fl(u)))?(n.instance=c,xe(c),c):(r=a,(c=Li.get(u))&&(r=I({},a),vd(r,c)),t=t.ownerDocument||t,c=t.createElement("script"),xe(c),zn(c,"link",r),t.head.appendChild(c),n.instance=c);case"void":return null;default:throw Error(s(443,n.type))}else n.type==="stylesheet"&&(n.state.loading&4)===0&&(r=n.instance,n.state.loading|=4,Kc(r,a.precedence,t));return n.instance}function Kc(t,n,a){for(var r=a.querySelectorAll('link[rel="stylesheet"][data-precedence],style[data-precedence]'),c=r.length?r[r.length-1]:null,u=c,g=0;g<r.length;g++){var w=r[g];if(w.dataset.precedence===n)u=w;else if(u!==c)break}u?u.parentNode.insertBefore(t,u.nextSibling):(n=a.nodeType===9?a.head:a,n.insertBefore(t,n.firstChild))}function _d(t,n){t.crossOrigin==null&&(t.crossOrigin=n.crossOrigin),t.referrerPolicy==null&&(t.referrerPolicy=n.referrerPolicy),t.title==null&&(t.title=n.title)}function vd(t,n){t.crossOrigin==null&&(t.crossOrigin=n.crossOrigin),t.referrerPolicy==null&&(t.referrerPolicy=n.referrerPolicy),t.integrity==null&&(t.integrity=n.integrity)}var Qc=null;function vv(t,n,a){if(Qc===null){var r=new Map,c=Qc=new Map;c.set(a,r)}else c=Qc,r=c.get(a),r||(r=new Map,c.set(a,r));if(r.has(t))return r;for(r.set(t,null),a=a.getElementsByTagName(t),c=0;c<a.length;c++){var u=a[c];if(!(u[Ft]||u[R]||t==="link"&&u.getAttribute("rel")==="stylesheet")&&u.namespaceURI!=="http://www.w3.org/2000/svg"){var g=u.getAttribute(n)||"";g=t+g;var w=r.get(g);w?w.push(u):r.set(g,[u])}}return r}function xd(t,n,a){t=t.ownerDocument||t,t.head.insertBefore(a,n==="title"?t.querySelector("head > title"):null)}function uE(t,n,a){if(a===1||n.itemProp!=null)return!1;switch(t){case"meta":case"title":return!0;case"style":if(typeof n.precedence!="string"||typeof n.href!="string"||n.href==="")break;return!0;case"link":if(typeof n.rel!="string"||typeof n.href!="string"||n.href===""||n.onLoad||n.onError)break;return n.rel==="stylesheet"?(t=n.disabled,typeof n.precedence=="string"&&t==null):!0;case"script":if(n.async&&typeof n.async!="function"&&typeof n.async!="symbol"&&!n.onLoad&&!n.onError&&n.src&&typeof n.src=="string")return!0}return!1}function xv(t,n){return t==="img"&&n.src!=null&&n.src!==""&&n.onLoad==null&&n.loading!=="lazy"}function Sv(t){return!(t.type==="stylesheet"&&(t.state.loading&3)===0)}function yv(t){return(t.width||100)*(t.height||100)*(typeof devicePixelRatio=="number"?devicePixelRatio:1)*.25}function Mv(t,n){typeof n.decode=="function"&&(t.imgCount++,n.complete||(t.imgBytes+=yv(n),t.suspenseyImages.push(n)),t=dE.bind(t),n.decode().then(t,t))}function fE(t,n,a,r){if(a.type==="stylesheet"&&(typeof r.media!="string"||matchMedia(r.media).matches!==!1)&&(a.state.loading&4)===0){if(a.instance===null){var c=qr(r.href),u=n.querySelector(ul(c));if(u){n=u._p,n!==null&&typeof n=="object"&&typeof n.then=="function"&&(t.count++,t=hl.bind(t),n.then(t,t)),a.state.loading|=4,a.instance=u,xe(u);return}u=n.ownerDocument||n,r=gv(r),(c=Li.get(c))&&_d(r,c),u=u.createElement("link"),xe(u);var g=u;g._p=new Promise(function(w,z){g.onload=w,g.onerror=z}),zn(u,"link",r),a.instance=u}t.stylesheets===null&&(t.stylesheets=new Map),t.stylesheets.set(a,n),(n=a.state.preload)&&(a.state.loading&3)===0&&(t.count++,a=hl.bind(t),n.addEventListener("load",a),n.addEventListener("error",a))}}var Jc=0;function hE(t,n){return t.stylesheets&&t.count===0&&tu(t,t.stylesheets),0<t.count||0<t.imgCount?function(a){var r=setTimeout(function(){if(t.stylesheets&&tu(t,t.stylesheets),t.unsuspend){var u=t.unsuspend;t.unsuspend=null,u()}},6e4+n);0<t.imgBytes&&Jc===0&&(Jc=62500*NM());var c=setTimeout(function(){if(t.waitingForImages=!1,t.count===0&&(t.stylesheets&&tu(t,t.stylesheets),t.unsuspend)){var u=t.unsuspend;t.unsuspend=null,u()}},(t.imgBytes>Jc?50:800)+n);return t.unsuspend=a,function(){t.unsuspend=null,clearTimeout(r),clearTimeout(c)}}:null}function Ev(t){if(t.count===0&&(t.imgCount===0||!t.waitingForImages)){if(t.stylesheets)tu(t,t.stylesheets);else if(t.unsuspend){var n=t.unsuspend;t.unsuspend=null,n()}}}function hl(){this.count--,Ev(this)}function dE(){this.imgCount--,Ev(this)}var $c=null;function tu(t,n){t.stylesheets=null,t.unsuspend!==null&&(t.count++,$c=new Map,n.forEach(pE,t),$c=null,hl.call(t))}function pE(t,n){if(!(n.state.loading&4)){var a=$c.get(t);if(a)var r=a.get(null);else{a=new Map,$c.set(t,a);for(var c=t.querySelectorAll("link[data-precedence],style[data-precedence]"),u=0;u<c.length;u++){var g=c[u];(g.nodeName==="LINK"||g.getAttribute("media")!=="not all")&&(a.set(g.dataset.precedence,g),r=g)}r&&a.set(null,r)}c=n.instance,g=c.getAttribute("data-precedence"),u=a.get(g)||r,u===r&&a.set(null,c),a.set(g,c),this.count++,r=hl.bind(this),c.addEventListener("load",r),c.addEventListener("error",r),u?u.parentNode.insertBefore(c,u.nextSibling):(t=t.nodeType===9?t.head:t,t.insertBefore(c,t.firstChild)),n.state.loading|=4}}var jr={$$typeof:tt,Provider:null,Consumer:null,_currentValue:be,_currentValue2:be,_threadCount:0};function mE(t,n,a,r,c,u,g,w,z){this.tag=1,this.containerInfo=t,this.pingCache=this.current=this.pendingChildren=null,this.timeoutHandle=-1,this.callbackNode=this.next=this.pendingContext=this.context=this.cancelPendingCommit=null,this.callbackPriority=0,this.expirationTimes=fr(-1),this.entangledLanes=this.shellSuspendCounter=this.errorRecoveryDisabledLanes=this.expiredLanes=this.warmLanes=this.pingedLanes=this.suspendedLanes=this.pendingLanes=0,this.entanglements=fr(0),this.hiddenUpdates=fr(null),this.identifierPrefix=r,this.onUncaughtError=c,this.onCaughtError=u,this.onRecoverableError=g,this.pooledCache=null,this.pooledCacheLanes=0,this.formState=z,this.transitionTypes=null,this.incompleteTransitions=new Map}function bv(t,n,a,r,c,u,g,w,z,$,ht,Et){return t=new mE(t,n,a,g,z,$,ht,Et,w),n=1,u===!0&&(n|=24),u=$n(3,null,null,n),t.current=u,u.stateNode=t,n=Of(),n.refCount++,t.pooledCache=n,n.refCount++,u.memoizedState={element:r,isDehydrated:a,cache:n},Bf(u),t}function Tv(t){return t?(t=Sr,t):Sr}function Av(t,n,a,r,c,u){c=Tv(c),r.context===null?r.context=c:r.pendingContext=c,r=is(n),r.payload={element:a},u=u===void 0?null:u,u!==null&&(r.callback=u),a=as(t,r,n),a!==null&&(ii(a,t,n),ko(a,t,n))}function Rv(t,n){if(t=t.memoizedState,t!==null&&t.dehydrated!==null){var a=t.retryLane;t.retryLane=a!==0&&a<n?a:n}}function Sd(t,n){Rv(t,n),(t=t.alternate)&&Rv(t,n)}function wv(t){if(t.tag===13||t.tag===31){var n=Ps(t,67108864);n!==null&&ii(n,t,67108864),Sd(t,67108864)}}function Cv(t){if(t.tag===13||t.tag===31){var n=mi();n=Ao(n);var a=Ps(t,n);a!==null&&ii(a,t,n),Sd(t,n)}}var Zr=!0;function gE(t,n,a,r){var c=vt.T;vt.T=null;var u=Ut.p;try{Ut.p=2,yd(t,n,a,r)}finally{Ut.p=u,vt.T=c}}function _E(t,n,a,r){var c=vt.T;vt.T=null;var u=Ut.p;try{Ut.p=8,yd(t,n,a,r)}finally{Ut.p=u,vt.T=c}}function yd(t,n,a,r){if(Zr){var c=Md(r);if(c===null)nd(t,n,r,eu,a),Dv(t,r);else if(xE(c,t,n,a,r))r.stopPropagation();else if(Dv(t,r),n&4&&-1<vE.indexOf(t)){for(;c!==null;){var u=he(c);if(u!==null)switch(u.tag){case 3:if(u=u.stateNode,u.current.memoizedState.isDehydrated){var g=ya(u.pendingLanes);if(g!==0){var w=u;for(w.pendingLanes|=2,w.entangledLanes|=2;g;){var z=1<<31-fe(g);w.entanglements[1]|=z,g&=~z}ua(u),(Ge&6)===0&&(Hc=Lt()+500,sl(0))}}break;case 31:case 13:w=Ps(u,2),w!==null&&ii(w,u,2),kc(),Sd(u,2)}if(u=Md(r),u===null&&nd(t,n,r,eu,a),u===c)break;c=u}c!==null&&r.stopPropagation()}else nd(t,n,r,null,a)}}function Md(t){return t=of(t),Ed(t)}var eu=null;function Ed(t){if(eu=null,t=re(t),t!==null){var n=f(t);if(n===null)t=null;else{var a=n.tag;if(a===13){if(t=h(n),t!==null)return t;t=null}else if(a===31){if(t=d(n),t!==null)return t;t=null}else if(a===3){if(n.stateNode.current.memoizedState.isDehydrated)return n.tag===3?n.stateNode.containerInfo:null;t=null}else n!==t&&(t=null)}}return eu=t,null}function Nv(t){switch(t){case"beforetoggle":case"cancel":case"click":case"close":case"contextmenu":case"copy":case"cut":case"auxclick":case"dblclick":case"dragend":case"dragstart":case"drop":case"focusin":case"focusout":case"input":case"invalid":case"keydown":case"keypress":case"keyup":case"mousedown":case"mouseup":case"paste":case"pause":case"play":case"pointercancel":case"pointerdown":case"pointerup":case"ratechange":case"reset":case"seeked":case"submit":case"toggle":case"touchcancel":case"touchend":case"touchstart":case"volumechange":case"change":case"selectionchange":case"textInput":case"compositionstart":case"compositionend":case"compositionupdate":case"beforeblur":case"afterblur":case"beforeinput":case"blur":case"fullscreenchange":case"fullscreenerror":case"focus":case"hashchange":case"popstate":case"select":case"selectstart":return 2;case"drag":case"dragenter":case"dragexit":case"dragleave":case"dragover":case"mousemove":case"mouseout":case"mouseover":case"pointermove":case"pointerout":case"pointerover":case"resize":case"scroll":case"touchmove":case"wheel":case"mouseenter":case"mouseleave":case"pointerenter":case"pointerleave":return 8;case"message":switch(Qt()){case ae:return 2;case W:return 8;case zt:case bt:return 32;case Bt:return 268435456;default:return 32}default:return 32}}var bd=!1,gs=null,_s=null,vs=null,dl=new Map,pl=new Map,xs=[],vE="mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset".split(" ");function Dv(t,n){switch(t){case"focusin":case"focusout":gs=null;break;case"dragenter":case"dragleave":_s=null;break;case"mouseover":case"mouseout":vs=null;break;case"pointerover":case"pointerout":dl.delete(n.pointerId);break;case"gotpointercapture":case"lostpointercapture":pl.delete(n.pointerId)}}function ml(t,n,a,r,c,u){return t===null||t.nativeEvent!==u?(t={blockedOn:n,domEventName:a,eventSystemFlags:r,nativeEvent:u,targetContainers:[c]},n!==null&&(n=he(n),n!==null&&wv(n)),t):(t.eventSystemFlags|=r,n=t.targetContainers,c!==null&&n.indexOf(c)===-1&&n.push(c),t)}function xE(t,n,a,r,c){switch(n){case"focusin":return gs=ml(gs,t,n,a,r,c),!0;case"dragenter":return _s=ml(_s,t,n,a,r,c),!0;case"mouseover":return vs=ml(vs,t,n,a,r,c),!0;case"pointerover":var u=c.pointerId;return dl.set(u,ml(dl.get(u)||null,t,n,a,r,c)),!0;case"gotpointercapture":return u=c.pointerId,pl.set(u,ml(pl.get(u)||null,t,n,a,r,c)),!0}return!1}function Uv(t){var n=re(t.target);if(n!==null){var a=f(n);if(a!==null){if(n=a.tag,n===13){if(n=h(a),n!==null){t.blockedOn=n,Gl(t.priority,function(){Cv(a)});return}}else if(n===31){if(n=d(a),n!==null){t.blockedOn=n,Gl(t.priority,function(){Cv(a)});return}}else if(n===3&&a.stateNode.current.memoizedState.isDehydrated){t.blockedOn=a.tag===3?a.stateNode.containerInfo:null;return}}}t.blockedOn=null}function nu(t){if(t.blockedOn!==null)return!1;for(var n=t.targetContainers;0<n.length;){var a=Md(t.nativeEvent);if(a===null){a=t.nativeEvent;var r=new a.constructor(a.type,a);rf=r,a.target.dispatchEvent(r),rf=null}else return n=he(a),n!==null&&wv(n),t.blockedOn=a,!1;n.shift()}return!0}function Lv(t,n,a){nu(t)&&a.delete(n)}function SE(){bd=!1,gs!==null&&nu(gs)&&(gs=null),_s!==null&&nu(_s)&&(_s=null),vs!==null&&nu(vs)&&(vs=null),dl.forEach(Lv),pl.forEach(Lv)}function iu(t,n){t.blockedOn===n&&(t.blockedOn=null,bd||(bd=!0,o.unstable_scheduleCallback(o.unstable_NormalPriority,SE)))}var au=null;function Ov(t){au!==t&&(au=t,o.unstable_scheduleCallback(o.unstable_NormalPriority,function(){au===t&&(au=null);for(var n=0;n<t.length;n+=3){var a=t[n],r=t[n+1],c=t[n+2];if(typeof r!="function"){if(Ed(r||a)===null)continue;break}var u=he(a);u!==null&&(t.splice(n,3),n-=3,sh(u,{pending:!0,data:c,method:a.method,action:r},r,c))}}))}function Kr(t){function n(z){return iu(z,t)}gs!==null&&iu(gs,t),_s!==null&&iu(_s,t),vs!==null&&iu(vs,t),dl.forEach(n),pl.forEach(n);for(var a=0;a<xs.length;a++){var r=xs[a];r.blockedOn===t&&(r.blockedOn=null)}for(;0<xs.length&&(a=xs[0],a.blockedOn===null);)Uv(a),a.blockedOn===null&&xs.shift();if(a=(t.ownerDocument||t).$$reactFormReplay,a!=null)for(r=0;r<a.length;r+=3){var c=a[r],u=a[r+1],g=c[H]||null;if(typeof u=="function")g||Ov(a);else if(g){var w=null;if(u&&u.hasAttribute("formAction")){if(c=u,g=u[H]||null)w=g.formAction;else if(Ed(c)!==null)continue}else w=g.action;typeof w=="function"?a[r+1]=w:(a.splice(r,3),r-=3),Ov(a)}}}function Pv(){function t(u){u.canIntercept&&u.info==="react-transition"&&u.intercept({handler:function(){return new Promise(function(g){return c=g})},focusReset:"manual",scroll:"manual"})}function n(){c!==null&&(c(),c=null),r||setTimeout(a,20)}function a(){if(!r&&!navigation.transition){var u=navigation.currentEntry;u&&u.url!=null&&navigation.navigate(u.url,{state:u.getState(),info:"react-transition",history:"replace"})}}if(typeof navigation=="object"){var r=!1,c=null;return navigation.addEventListener("navigate",t),navigation.addEventListener("navigatesuccess",n),navigation.addEventListener("navigateerror",n),setTimeout(a,100),function(){r=!0,navigation.removeEventListener("navigate",t),navigation.removeEventListener("navigatesuccess",n),navigation.removeEventListener("navigateerror",n),c!==null&&(c(),c=null)}}}function Td(t){this._internalRoot=t}su.prototype.render=Td.prototype.render=function(t){var n=this._internalRoot;if(n===null)throw Error(s(409));var a=n.current,r=mi();Av(a,r,t,n,null,null)},su.prototype.unmount=Td.prototype.unmount=function(){var t=this._internalRoot;if(t!==null){this._internalRoot=null;var n=t.containerInfo;Av(t.current,2,null,t,null,null),kc(),n[pt]=null}};function su(t){this._internalRoot=t}su.prototype.unstable_scheduleHydration=function(t){if(t){var n=Hl();t={blockedOn:null,target:t,priority:n};for(var a=0;a<xs.length&&n!==0&&n<xs[a].priority;a++);xs.splice(a,0,t),a===0&&Uv(t)}};var Iv=e.version;if(Iv!=="19.3.0")throw Error(s(527,Iv,"19.3.0"));Ut.findDOMNode=function(t){var n=t._reactInternals;if(n===void 0)throw typeof t.render=="function"?Error(s(188)):(t=Object.keys(t).join(","),Error(s(268,t)));return t=p(n),t=t!==null?S(t):null,t=t===null?null:t.stateNode,t};var yE={bundleType:0,version:"19.3.0",rendererPackageName:"react-dom",currentDispatcherRef:vt,reconcilerVersion:"19.3.0"};if(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__<"u"){var ru=__REACT_DEVTOOLS_GLOBAL_HOOK__;if(!ru.isDisabled&&ru.supportsFiber)try{te=ru.inject(yE),Wt=ru}catch{}}return _l.createRoot=function(t,n){if(!l(t))throw Error(s(299));var a=!1,r="",c=Tg,u=Ag,g=Rg;return n!=null&&(n.unstable_strictMode===!0&&(a=!0),n.identifierPrefix!==void 0&&(r=n.identifierPrefix),n.onUncaughtError!==void 0&&(c=n.onUncaughtError),n.onCaughtError!==void 0&&(u=n.onCaughtError),n.onRecoverableError!==void 0&&(g=n.onRecoverableError)),n=bv(t,1,!1,null,null,a,r,null,c,u,g,Pv),t[pt]=n.current,ed(t),new Td(n)},_l.hydrateRoot=function(t,n,a){if(!l(t))throw Error(s(299));var r=!1,c="",u=Tg,g=Ag,w=Rg,z=null;return a!=null&&(a.unstable_strictMode===!0&&(r=!0),a.identifierPrefix!==void 0&&(c=a.identifierPrefix),a.onUncaughtError!==void 0&&(u=a.onUncaughtError),a.onCaughtError!==void 0&&(g=a.onCaughtError),a.onRecoverableError!==void 0&&(w=a.onRecoverableError),a.formState!==void 0&&(z=a.formState)),n=bv(t,1,!0,n,a??null,r,c,z,u,g,w,Pv),n.context=Tv(null),a=n.current,r=mi(),r=Ao(r),c=is(r),c.callback=null,as(a,c,r),a=r,n.current.lanes=a,Ji(n,a),ua(n),t[pt]=n.current,ed(t),new su(n)},_l.version="19.3.0",_l}var qv;function DE(){if(qv)return wd.exports;qv=1;function o(){if(!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__>"u"||typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE!="function"))try{__REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(o)}catch(e){console.error(e)}}return o(),wd.exports=NE(),wd.exports}var UE=DE();const rm="186",po={ROTATE:0,DOLLY:1,PAN:2},fo={ROTATE:0,PAN:1,DOLLY_PAN:2,DOLLY_ROTATE:3},LE=0,Yv=1,OE=2,wl=1,PE=2,Al=3,rr=0,ri=1,Ii=2,ka=0,Cl=1,jv=2,Zv=3,Kv=4,IE=5,uo=100,zE=101,BE=102,FE=103,HE=104,GE=200,VE=201,kE=202,XE=203,$x=204,tS=205,WE=206,qE=207,YE=208,jE=209,ZE=210,KE=211,QE=212,JE=213,$E=214,dp=0,pp=1,mp=2,Dl=3,gp=4,_p=5,vp=6,xp=7,eS=0,tb=1,eb=2,_a=0,nS=1,iS=2,aS=3,sS=4,rS=5,oS=6,lS=7,cS=300,or=301,_o=302,Ud=303,Ld=304,Zu=306,Sp=1e3,Va=1001,yp=1002,Fn=1003,nb=1004,ou=1005,kn=1006,Od=1007,ar=1008,yi=1009,uS=1010,fS=1011,Ul=1012,om=1013,va=1014,ma=1015,xa=1016,lm=1017,cm=1018,Ll=1020,hS=35902,dS=35899,pS=1021,mS=1022,Zi=1023,qa=1026,sr=1027,gS=1028,um=1029,lr=1030,fm=1031,hm=1033,Pu=33776,Iu=33777,zu=33778,Bu=33779,Mp=35840,Ep=35841,bp=35842,Tp=35843,Ap=36196,Rp=37492,wp=37496,Cp=37488,Np=37489,Gu=37490,Dp=37491,Up=37808,Lp=37809,Op=37810,Pp=37811,Ip=37812,zp=37813,Bp=37814,Fp=37815,Hp=37816,Gp=37817,Vp=37818,kp=37819,Xp=37820,Wp=37821,qp=36492,Yp=36494,jp=36495,Zp=36283,Kp=36284,Vu=36285,Qp=36286,ib=3200,Jp=0,ab=1,As="",Pi="srgb",ku="srgb-linear",Xu="linear",je="srgb",Pd=7680,sb=519,rb=512,ob=513,lb=514,dm=515,cb=516,ub=517,pm=518,fb=519,hb=35044,Qv="300 es",ga=2e3,Ol=2001;function db(o){for(let e=o.length-1;e>=0;--e)if(o[e]>=65535)return!0;return!1}function Wu(o){return document.createElementNS("http://www.w3.org/1999/xhtml",o)}function pb(){const o=Wu("canvas");return o.style.display="block",o}const Jv={};function $v(...o){const e="THREE."+o.shift();console.log(e,...o)}function _S(o){const e=o[0];if(typeof e=="string"&&e.startsWith("TSL:")){const i=o[1];i&&i.isStackTrace?o[0]+=" "+i.getLocation():o[1]='Stack trace not available. Enable "THREE.Node.captureStackTrace" to capture stack traces.'}return o}function oe(...o){o=_S(o);const e="THREE."+o.shift();{const i=o[0];i&&i.isStackTrace?console.warn(i.getError(e)):console.warn(e,...o)}}function Fe(...o){o=_S(o);const e="THREE."+o.shift();{const i=o[0];i&&i.isStackTrace?console.error(i.getError(e)):console.error(e,...o)}}function mo(...o){const e=o.join(" ");e in Jv||(Jv[e]=!0,oe(...o))}function mb(o,e,i){return new Promise(function(s,l){function f(){switch(o.clientWaitSync(e,o.SYNC_FLUSH_COMMANDS_BIT,0)){case o.WAIT_FAILED:l();break;case o.TIMEOUT_EXPIRED:setTimeout(f,i);break;default:s()}}setTimeout(f,i)})}const gb={[dp]:pp,[mp]:vp,[gp]:xp,[Dl]:_p,[pp]:dp,[vp]:mp,[xp]:gp,[_p]:Dl};class Cs{addEventListener(e,i){this._listeners===void 0&&(this._listeners={});const s=this._listeners;s[e]===void 0&&(s[e]=[]),s[e].indexOf(i)===-1&&s[e].push(i)}hasEventListener(e,i){const s=this._listeners;return s===void 0?!1:s[e]!==void 0&&s[e].indexOf(i)!==-1}removeEventListener(e,i){const s=this._listeners;if(s===void 0)return;const l=s[e];if(l!==void 0){const f=l.indexOf(i);f!==-1&&l.splice(f,1)}}dispatchEvent(e){const i=this._listeners;if(i===void 0)return;const s=i[e.type];if(s!==void 0){e.target=this;const l=s.slice(0);for(let f=0,h=l.length;f<h;f++)l[f].call(this,e);e.target=null}}}const Gn=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"],Nl=Math.PI/180,$p=180/Math.PI;function Il(){const o=Math.random()*4294967295|0,e=Math.random()*4294967295|0,i=Math.random()*4294967295|0,s=Math.random()*4294967295|0;return(Gn[o&255]+Gn[o>>8&255]+Gn[o>>16&255]+Gn[o>>24&255]+"-"+Gn[e&255]+Gn[e>>8&255]+"-"+Gn[e>>16&15|64]+Gn[e>>24&255]+"-"+Gn[i&63|128]+Gn[i>>8&255]+"-"+Gn[i>>16&255]+Gn[i>>24&255]+Gn[s&255]+Gn[s>>8&255]+Gn[s>>16&255]+Gn[s>>24&255]).toLowerCase()}function we(o,e,i){return Math.max(e,Math.min(i,o))}function _b(o,e){return(o%e+e)%e}function Id(o,e,i){return(1-i)*o+i*e}function vl(o,e){switch(e.constructor){case Float32Array:return o;case Uint32Array:return o/4294967295;case Uint16Array:return o/65535;case Uint8Array:case Uint8ClampedArray:return o/255;case Int32Array:return Math.max(o/2147483647,-1);case Int16Array:return Math.max(o/32767,-1);case Int8Array:return Math.max(o/127,-1);default:throw new Error("THREE.MathUtils: Invalid component type.")}}function ai(o,e){switch(e.constructor){case Float32Array:return o;case Uint32Array:return Math.round(o*4294967295);case Uint16Array:return Math.round(o*65535);case Uint8Array:case Uint8ClampedArray:return Math.round(o*255);case Int32Array:return Math.round(o*2147483647);case Int16Array:return Math.round(o*32767);case Int8Array:return Math.round(o*127);default:throw new Error("THREE.MathUtils: Invalid component type.")}}const vb={DEG2RAD:Nl},Cm=class Cm{constructor(e=0,i=0){this.x=e,this.y=i}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,i){return this.x=e,this.y=i,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,i){switch(e){case 0:this.x=i;break;case 1:this.y=i;break;default:throw new Error("THREE.Vector2: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw new Error("THREE.Vector2: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,i){return this.x=e.x+i.x,this.y=e.y+i.y,this}addScaledVector(e,i){return this.x+=e.x*i,this.y+=e.y*i,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,i){return this.x=e.x-i.x,this.y=e.y-i.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){const i=this.x,s=this.y,l=e.elements;return this.x=l[0]*i+l[3]*s+l[6],this.y=l[1]*i+l[4]*s+l[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,i){return this.x=we(this.x,e.x,i.x),this.y=we(this.y,e.y,i.y),this}clampScalar(e,i){return this.x=we(this.x,e,i),this.y=we(this.y,e,i),this}clampLength(e,i){const s=this.length();return this.divideScalar(s||1).multiplyScalar(we(s,e,i))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(e){const i=Math.sqrt(this.lengthSq()*e.lengthSq());if(i===0)return Math.PI/2;const s=this.dot(e)/i;return Math.acos(we(s,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){const i=this.x-e.x,s=this.y-e.y;return i*i+s*s}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,i){return this.x+=(e.x-this.x)*i,this.y+=(e.y-this.y)*i,this}lerpVectors(e,i,s){return this.x=e.x+(i.x-e.x)*s,this.y=e.y+(i.y-e.y)*s,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,i=0){return this.x=e[i],this.y=e[i+1],this}toArray(e=[],i=0){return e[i]=this.x,e[i+1]=this.y,e}fromBufferAttribute(e,i){return this.x=e.getX(i),this.y=e.getY(i),this}rotateAround(e,i){const s=Math.cos(i),l=Math.sin(i),f=this.x-e.x,h=this.y-e.y;return this.x=f*s-h*l+e.x,this.y=f*l+h*s+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}};Cm.prototype.isVector2=!0;let le=Cm;class Rs{constructor(e=0,i=0,s=0,l=1){this.isQuaternion=!0,this._x=e,this._y=i,this._z=s,this._w=l}static slerpFlat(e,i,s,l,f,h,d){let m=s[l+0],p=s[l+1],S=s[l+2],_=s[l+3],v=f[h+0],M=f[h+1],A=f[h+2],N=f[h+3];if(_!==N||m!==v||p!==M||S!==A){let y=m*v+p*M+S*A+_*N;y<0&&(v=-v,M=-M,A=-A,N=-N,y=-y);let x=1-d;if(y<.9995){const U=Math.acos(y),F=Math.sin(U);x=Math.sin(x*U)/F,d=Math.sin(d*U)/F,m=m*x+v*d,p=p*x+M*d,S=S*x+A*d,_=_*x+N*d}else{m=m*x+v*d,p=p*x+M*d,S=S*x+A*d,_=_*x+N*d;const U=1/Math.sqrt(m*m+p*p+S*S+_*_);m*=U,p*=U,S*=U,_*=U}}e[i]=m,e[i+1]=p,e[i+2]=S,e[i+3]=_}static multiplyQuaternionsFlat(e,i,s,l,f,h){const d=s[l],m=s[l+1],p=s[l+2],S=s[l+3],_=f[h],v=f[h+1],M=f[h+2],A=f[h+3];return e[i]=d*A+S*_+m*M-p*v,e[i+1]=m*A+S*v+p*_-d*M,e[i+2]=p*A+S*M+d*v-m*_,e[i+3]=S*A-d*_-m*v-p*M,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,i,s,l){return this._x=e,this._y=i,this._z=s,this._w=l,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,i=!0){const s=e._x,l=e._y,f=e._z,h=e._order,d=Math.cos,m=Math.sin,p=d(s/2),S=d(l/2),_=d(f/2),v=m(s/2),M=m(l/2),A=m(f/2);switch(h){case"XYZ":this._x=v*S*_+p*M*A,this._y=p*M*_-v*S*A,this._z=p*S*A+v*M*_,this._w=p*S*_-v*M*A;break;case"YXZ":this._x=v*S*_+p*M*A,this._y=p*M*_-v*S*A,this._z=p*S*A-v*M*_,this._w=p*S*_+v*M*A;break;case"ZXY":this._x=v*S*_-p*M*A,this._y=p*M*_+v*S*A,this._z=p*S*A+v*M*_,this._w=p*S*_-v*M*A;break;case"ZYX":this._x=v*S*_-p*M*A,this._y=p*M*_+v*S*A,this._z=p*S*A-v*M*_,this._w=p*S*_+v*M*A;break;case"YZX":this._x=v*S*_+p*M*A,this._y=p*M*_+v*S*A,this._z=p*S*A-v*M*_,this._w=p*S*_-v*M*A;break;case"XZY":this._x=v*S*_-p*M*A,this._y=p*M*_-v*S*A,this._z=p*S*A+v*M*_,this._w=p*S*_+v*M*A;break;default:oe("Quaternion: .setFromEuler() encountered an unknown order: "+h)}return i===!0&&this._onChangeCallback(),this}setFromAxisAngle(e,i){const s=i/2,l=Math.sin(s);return this._x=e.x*l,this._y=e.y*l,this._z=e.z*l,this._w=Math.cos(s),this._onChangeCallback(),this}setFromRotationMatrix(e){const i=e.elements,s=i[0],l=i[4],f=i[8],h=i[1],d=i[5],m=i[9],p=i[2],S=i[6],_=i[10],v=s+d+_;if(v>0){const M=.5/Math.sqrt(v+1);this._w=.25/M,this._x=(S-m)*M,this._y=(f-p)*M,this._z=(h-l)*M}else if(s>d&&s>_){const M=2*Math.sqrt(1+s-d-_);this._w=(S-m)/M,this._x=.25*M,this._y=(l+h)/M,this._z=(f+p)/M}else if(d>_){const M=2*Math.sqrt(1+d-s-_);this._w=(f-p)/M,this._x=(l+h)/M,this._y=.25*M,this._z=(m+S)/M}else{const M=2*Math.sqrt(1+_-s-d);this._w=(h-l)/M,this._x=(f+p)/M,this._y=(m+S)/M,this._z=.25*M}return this._onChangeCallback(),this}setFromUnitVectors(e,i){let s=e.dot(i)+1;return s<1e-8?(s=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=s):(this._x=0,this._y=-e.z,this._z=e.y,this._w=s)):(this._x=e.y*i.z-e.z*i.y,this._y=e.z*i.x-e.x*i.z,this._z=e.x*i.y-e.y*i.x,this._w=s),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(we(this.dot(e),-1,1)))}rotateTowards(e,i){const s=this.angleTo(e);if(s===0)return this;const l=Math.min(1,i/s);return this.slerp(e,l),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x=this._x*e,this._y=this._y*e,this._z=this._z*e,this._w=this._w*e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,i){const s=e._x,l=e._y,f=e._z,h=e._w,d=i._x,m=i._y,p=i._z,S=i._w;return this._x=s*S+h*d+l*p-f*m,this._y=l*S+h*m+f*d-s*p,this._z=f*S+h*p+s*m-l*d,this._w=h*S-s*d-l*m-f*p,this._onChangeCallback(),this}slerp(e,i){let s=e._x,l=e._y,f=e._z,h=e._w,d=this.dot(e);d<0&&(s=-s,l=-l,f=-f,h=-h,d=-d);let m=1-i;if(d<.9995){const p=Math.acos(d),S=Math.sin(p);m=Math.sin(m*p)/S,i=Math.sin(i*p)/S,this._x=this._x*m+s*i,this._y=this._y*m+l*i,this._z=this._z*m+f*i,this._w=this._w*m+h*i,this._onChangeCallback()}else this._x=this._x*m+s*i,this._y=this._y*m+l*i,this._z=this._z*m+f*i,this._w=this._w*m+h*i,this.normalize();return this}slerpQuaternions(e,i,s){return this.copy(e).slerp(i,s)}random(){const e=2*Math.PI*Math.random(),i=2*Math.PI*Math.random(),s=Math.random(),l=Math.sqrt(1-s),f=Math.sqrt(s);return this.set(l*Math.sin(e),l*Math.cos(e),f*Math.sin(i),f*Math.cos(i))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,i=0){return this._x=e[i],this._y=e[i+1],this._z=e[i+2],this._w=e[i+3],this._onChangeCallback(),this}toArray(e=[],i=0){return e[i]=this._x,e[i+1]=this._y,e[i+2]=this._z,e[i+3]=this._w,e}fromBufferAttribute(e,i){return this._x=e.getX(i),this._y=e.getY(i),this._z=e.getZ(i),this._w=e.getW(i),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}}const Nm=class Nm{constructor(e=0,i=0,s=0){this.x=e,this.y=i,this.z=s}set(e,i,s){return s===void 0&&(s=this.z),this.x=e,this.y=i,this.z=s,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,i){switch(e){case 0:this.x=i;break;case 1:this.y=i;break;case 2:this.z=i;break;default:throw new Error("THREE.Vector3: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("THREE.Vector3: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,i){return this.x=e.x+i.x,this.y=e.y+i.y,this.z=e.z+i.z,this}addScaledVector(e,i){return this.x+=e.x*i,this.y+=e.y*i,this.z+=e.z*i,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,i){return this.x=e.x-i.x,this.y=e.y-i.y,this.z=e.z-i.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,i){return this.x=e.x*i.x,this.y=e.y*i.y,this.z=e.z*i.z,this}applyEuler(e){return this.applyQuaternion(tx.setFromEuler(e))}applyAxisAngle(e,i){return this.applyQuaternion(tx.setFromAxisAngle(e,i))}applyMatrix3(e){const i=this.x,s=this.y,l=this.z,f=e.elements;return this.x=f[0]*i+f[3]*s+f[6]*l,this.y=f[1]*i+f[4]*s+f[7]*l,this.z=f[2]*i+f[5]*s+f[8]*l,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){const i=this.x,s=this.y,l=this.z,f=e.elements,h=1/(f[3]*i+f[7]*s+f[11]*l+f[15]);return this.x=(f[0]*i+f[4]*s+f[8]*l+f[12])*h,this.y=(f[1]*i+f[5]*s+f[9]*l+f[13])*h,this.z=(f[2]*i+f[6]*s+f[10]*l+f[14])*h,this}applyQuaternion(e){const i=this.x,s=this.y,l=this.z,f=e.x,h=e.y,d=e.z,m=e.w,p=2*(h*l-d*s),S=2*(d*i-f*l),_=2*(f*s-h*i);return this.x=i+m*p+h*_-d*S,this.y=s+m*S+d*p-f*_,this.z=l+m*_+f*S-h*p,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){const i=this.x,s=this.y,l=this.z,f=e.elements;return this.x=f[0]*i+f[4]*s+f[8]*l,this.y=f[1]*i+f[5]*s+f[9]*l,this.z=f[2]*i+f[6]*s+f[10]*l,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,i){return this.x=we(this.x,e.x,i.x),this.y=we(this.y,e.y,i.y),this.z=we(this.z,e.z,i.z),this}clampScalar(e,i){return this.x=we(this.x,e,i),this.y=we(this.y,e,i),this.z=we(this.z,e,i),this}clampLength(e,i){const s=this.length();return this.divideScalar(s||1).multiplyScalar(we(s,e,i))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,i){return this.x+=(e.x-this.x)*i,this.y+=(e.y-this.y)*i,this.z+=(e.z-this.z)*i,this}lerpVectors(e,i,s){return this.x=e.x+(i.x-e.x)*s,this.y=e.y+(i.y-e.y)*s,this.z=e.z+(i.z-e.z)*s,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,i){const s=e.x,l=e.y,f=e.z,h=i.x,d=i.y,m=i.z;return this.x=l*m-f*d,this.y=f*h-s*m,this.z=s*d-l*h,this}projectOnVector(e){const i=e.lengthSq();if(i===0)return this.set(0,0,0);const s=e.dot(this)/i;return this.copy(e).multiplyScalar(s)}projectOnPlane(e){return zd.copy(this).projectOnVector(e),this.sub(zd)}reflect(e){return this.sub(zd.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){const i=Math.sqrt(this.lengthSq()*e.lengthSq());if(i===0)return Math.PI/2;const s=this.dot(e)/i;return Math.acos(we(s,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){const i=this.x-e.x,s=this.y-e.y,l=this.z-e.z;return i*i+s*s+l*l}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,i,s){const l=Math.sin(i)*e;return this.x=l*Math.sin(s),this.y=Math.cos(i)*e,this.z=l*Math.cos(s),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,i,s){return this.x=e*Math.sin(i),this.y=s,this.z=e*Math.cos(i),this}setFromMatrixPosition(e){const i=e.elements;return this.x=i[12],this.y=i[13],this.z=i[14],this}setFromMatrixScale(e){const i=this.setFromMatrixColumn(e,0).length(),s=this.setFromMatrixColumn(e,1).length(),l=this.setFromMatrixColumn(e,2).length();return this.x=i,this.y=s,this.z=l,this}setFromMatrixColumn(e,i){return this.fromArray(e.elements,i*4)}setFromMatrix3Column(e,i){return this.fromArray(e.elements,i*3)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}setFromColor(e){return this.x=e.r,this.y=e.g,this.z=e.b,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,i=0){return this.x=e[i],this.y=e[i+1],this.z=e[i+2],this}toArray(e=[],i=0){return e[i]=this.x,e[i+1]=this.y,e[i+2]=this.z,e}fromBufferAttribute(e,i){return this.x=e.getX(i),this.y=e.getY(i),this.z=e.getZ(i),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){const e=Math.random()*Math.PI*2,i=Math.random()*2-1,s=Math.sqrt(1-i*i);return this.x=s*Math.cos(e),this.y=i,this.z=s*Math.sin(e),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}};Nm.prototype.isVector3=!0;let nt=Nm;const zd=new nt,tx=new Rs,Dm=class Dm{constructor(e,i,s,l,f,h,d,m,p){this.elements=[1,0,0,0,1,0,0,0,1],e!==void 0&&this.set(e,i,s,l,f,h,d,m,p)}set(e,i,s,l,f,h,d,m,p){const S=this.elements;return S[0]=e,S[1]=l,S[2]=d,S[3]=i,S[4]=f,S[5]=m,S[6]=s,S[7]=h,S[8]=p,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){const i=this.elements,s=e.elements;return i[0]=s[0],i[1]=s[1],i[2]=s[2],i[3]=s[3],i[4]=s[4],i[5]=s[5],i[6]=s[6],i[7]=s[7],i[8]=s[8],this}extractBasis(e,i,s){return e.setFromMatrix3Column(this,0),i.setFromMatrix3Column(this,1),s.setFromMatrix3Column(this,2),this}setFromMatrix4(e){const i=e.elements;return this.set(i[0],i[4],i[8],i[1],i[5],i[9],i[2],i[6],i[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,i){const s=e.elements,l=i.elements,f=this.elements,h=s[0],d=s[3],m=s[6],p=s[1],S=s[4],_=s[7],v=s[2],M=s[5],A=s[8],N=l[0],y=l[3],x=l[6],U=l[1],F=l[4],C=l[7],D=l[2],L=l[5],I=l[8];return f[0]=h*N+d*U+m*D,f[3]=h*y+d*F+m*L,f[6]=h*x+d*C+m*I,f[1]=p*N+S*U+_*D,f[4]=p*y+S*F+_*L,f[7]=p*x+S*C+_*I,f[2]=v*N+M*U+A*D,f[5]=v*y+M*F+A*L,f[8]=v*x+M*C+A*I,this}multiplyScalar(e){const i=this.elements;return i[0]*=e,i[3]*=e,i[6]*=e,i[1]*=e,i[4]*=e,i[7]*=e,i[2]*=e,i[5]*=e,i[8]*=e,this}determinant(){const e=this.elements,i=e[0],s=e[1],l=e[2],f=e[3],h=e[4],d=e[5],m=e[6],p=e[7],S=e[8];return i*h*S-i*d*p-s*f*S+s*d*m+l*f*p-l*h*m}invert(){const e=this.elements,i=e[0],s=e[1],l=e[2],f=e[3],h=e[4],d=e[5],m=e[6],p=e[7],S=e[8],_=S*h-d*p,v=d*m-S*f,M=p*f-h*m,A=i*_+s*v+l*M;if(A===0)return this.set(0,0,0,0,0,0,0,0,0);const N=1/A;return e[0]=_*N,e[1]=(l*p-S*s)*N,e[2]=(d*s-l*h)*N,e[3]=v*N,e[4]=(S*i-l*m)*N,e[5]=(l*f-d*i)*N,e[6]=M*N,e[7]=(s*m-p*i)*N,e[8]=(h*i-s*f)*N,this}transpose(){let e;const i=this.elements;return e=i[1],i[1]=i[3],i[3]=e,e=i[2],i[2]=i[6],i[6]=e,e=i[5],i[5]=i[7],i[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){const i=this.elements;return e[0]=i[0],e[1]=i[3],e[2]=i[6],e[3]=i[1],e[4]=i[4],e[5]=i[7],e[6]=i[2],e[7]=i[5],e[8]=i[8],this}setUvTransform(e,i,s,l,f,h,d){const m=Math.cos(f),p=Math.sin(f);return this.set(s*m,s*p,-s*(m*h+p*d)+h+e,-l*p,l*m,-l*(-p*h+m*d)+d+i,0,0,1),this}scale(e,i){return mo("Matrix3: .scale() is deprecated. Use .makeScale() instead."),this.premultiply(Bd.makeScale(e,i)),this}rotate(e){return mo("Matrix3: .rotate() is deprecated. Use .makeRotation() instead."),this.premultiply(Bd.makeRotation(-e)),this}translate(e,i){return mo("Matrix3: .translate() is deprecated. Use .makeTranslation() instead."),this.premultiply(Bd.makeTranslation(e,i)),this}makeTranslation(e,i){return e.isVector2?this.set(1,0,e.x,0,1,e.y,0,0,1):this.set(1,0,e,0,1,i,0,0,1),this}makeRotation(e){const i=Math.cos(e),s=Math.sin(e);return this.set(i,-s,0,s,i,0,0,0,1),this}makeScale(e,i){return this.set(e,0,0,0,i,0,0,0,1),this}equals(e){const i=this.elements,s=e.elements;for(let l=0;l<9;l++)if(i[l]!==s[l])return!1;return!0}fromArray(e,i=0){for(let s=0;s<9;s++)this.elements[s]=e[s+i];return this}toArray(e=[],i=0){const s=this.elements;return e[i]=s[0],e[i+1]=s[1],e[i+2]=s[2],e[i+3]=s[3],e[i+4]=s[4],e[i+5]=s[5],e[i+6]=s[6],e[i+7]=s[7],e[i+8]=s[8],e}clone(){return new this.constructor().fromArray(this.elements)}};Dm.prototype.isMatrix3=!0;let de=Dm;const Bd=new de,ex=new de().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),nx=new de().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function xb(){const o={enabled:!0,workingColorSpace:ku,spaces:{},convert:function(l,f,h){return this.enabled===!1||f===h||!f||!h||(this.spaces[f].transfer===je&&(l.r=Xa(l.r),l.g=Xa(l.g),l.b=Xa(l.b)),this.spaces[f].primaries!==this.spaces[h].primaries&&(l.applyMatrix3(this.spaces[f].toXYZ),l.applyMatrix3(this.spaces[h].fromXYZ)),this.spaces[h].transfer===je&&(l.r=go(l.r),l.g=go(l.g),l.b=go(l.b))),l},workingToColorSpace:function(l,f){return this.convert(l,this.workingColorSpace,f)},colorSpaceToWorking:function(l,f){return this.convert(l,f,this.workingColorSpace)},getPrimaries:function(l){return this.spaces[l].primaries},getTransfer:function(l){return l===As?Xu:this.spaces[l].transfer},getToneMappingMode:function(l){return this.spaces[l].outputColorSpaceConfig.toneMappingMode||"standard"},getLuminanceCoefficients:function(l,f=this.workingColorSpace){return l.fromArray(this.spaces[f].luminanceCoefficients)},define:function(l){Object.assign(this.spaces,l)},_getMatrix:function(l,f,h){return l.copy(this.spaces[f].toXYZ).multiply(this.spaces[h].fromXYZ)},_getDrawingBufferColorSpace:function(l){return this.spaces[l].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(l=this.workingColorSpace){return this.spaces[l].workingColorSpaceConfig.unpackColorSpace},fromWorkingColorSpace:function(l,f){return mo("ColorManagement: .fromWorkingColorSpace() has been renamed to .workingToColorSpace()."),o.workingToColorSpace(l,f)},toWorkingColorSpace:function(l,f){return mo("ColorManagement: .toWorkingColorSpace() has been renamed to .colorSpaceToWorking()."),o.colorSpaceToWorking(l,f)}},e=[.64,.33,.3,.6,.15,.06],i=[.2126,.7152,.0722],s=[.3127,.329];return o.define({[ku]:{primaries:e,whitePoint:s,transfer:Xu,toXYZ:ex,fromXYZ:nx,luminanceCoefficients:i,workingColorSpaceConfig:{unpackColorSpace:Pi},outputColorSpaceConfig:{drawingBufferColorSpace:Pi}},[Pi]:{primaries:e,whitePoint:s,transfer:je,toXYZ:ex,fromXYZ:nx,luminanceCoefficients:i,outputColorSpaceConfig:{drawingBufferColorSpace:Pi}}}),o}const Oe=xb();function Xa(o){return o<.04045?o*.0773993808:Math.pow(o*.9478672986+.0521327014,2.4)}function go(o){return o<.0031308?o*12.92:1.055*Math.pow(o,.41666)-.055}let Qr;class Sb{static getDataURL(e,i="image/png"){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>"u")return e.src;let s;if(e instanceof HTMLCanvasElement)s=e;else{Qr===void 0&&(Qr=Wu("canvas")),Qr.width=e.width,Qr.height=e.height;const l=Qr.getContext("2d");e instanceof ImageData?l.putImageData(e,0,0):l.drawImage(e,0,0,e.width,e.height),s=Qr}return s.toDataURL(i)}static sRGBToLinear(e){if(typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&e instanceof ImageBitmap){const i=Wu("canvas");i.width=e.width,i.height=e.height;const s=i.getContext("2d");s.drawImage(e,0,0,e.width,e.height);const l=s.getImageData(0,0,e.width,e.height),f=l.data;for(let h=0;h<f.length;h++)f[h]=Xa(f[h]/255)*255;return s.putImageData(l,0,0),i}else if(e.data){const i=e.data.slice(0);for(let s=0;s<i.length;s++)i instanceof Uint8Array||i instanceof Uint8ClampedArray?i[s]=Math.floor(Xa(i[s]/255)*255):i[s]=Xa(i[s]);return{data:i,width:e.width,height:e.height}}else return oe("ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),e}}let yb=0;class mm{constructor(e=null){this.isTextureSource=!0,Object.defineProperty(this,"id",{value:yb++}),this.uuid=Il(),this.data=e,this.dataReady=!0,this.version=0}getSize(e){const i=this.data;return typeof HTMLVideoElement<"u"&&i instanceof HTMLVideoElement?e.set(i.videoWidth,i.videoHeight,0):typeof VideoFrame<"u"&&i instanceof VideoFrame?e.set(i.displayWidth,i.displayHeight,0):i!==null?e.set(i.width,i.height,i.depth||0):e.set(0,0,0),e}set needsUpdate(e){e===!0&&this.version++}toJSON(e){const i=e===void 0||typeof e=="string";if(!i&&e.images[this.uuid]!==void 0)return e.images[this.uuid];const s={uuid:this.uuid,url:""},l=this.data;if(l!==null){let f;if(Array.isArray(l)){f=[];for(let h=0,d=l.length;h<d;h++)l[h].isDataTexture?f.push(Fd(l[h].image)):f.push(Fd(l[h]))}else f=Fd(l);s.url=f}return i||(e.images[this.uuid]=s),s}}function Fd(o){return typeof HTMLImageElement<"u"&&o instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&o instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&o instanceof ImageBitmap?Sb.getDataURL(o):o.data?{data:Array.from(o.data),width:o.width,height:o.height,type:o.data.constructor.name}:(oe("Texture: Unable to serialize Texture."),{})}let Mb=0;const Hd=new nt;class Qn extends Cs{constructor(e=Qn.DEFAULT_IMAGE,i=Qn.DEFAULT_MAPPING,s=Va,l=Va,f=kn,h=ar,d=Zi,m=yi,p=Qn.DEFAULT_ANISOTROPY,S=As){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:Mb++}),this.uuid=Il(),this.name="",this.source=new mm(e),this.mipmaps=[],this.mapping=i,this.channel=0,this.wrapS=s,this.wrapT=l,this.magFilter=f,this.minFilter=h,this.anisotropy=p,this.format=d,this.internalFormat=null,this.type=m,this.offset=new le(0,0),this.repeat=new le(1,1),this.center=new le(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new de,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=S,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.isArrayTexture=!!(e&&e.depth&&e.depth>1),this.pmremVersion=0,this.normalized=!1}get width(){return this.source.getSize(Hd).x}get height(){return this.source.getSize(Hd).y}get depth(){return this.source.getSize(Hd).z}get image(){return this.source.data}set image(e){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}addUpdateRange(e,i){this.updateRanges.push({start:e,count:i})}clearUpdateRanges(){this.updateRanges.length=0}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.channel=e.channel,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.normalized=e.normalized,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.colorSpace=e.colorSpace,this.renderTarget=e.renderTarget,this.isRenderTargetTexture=e.isRenderTargetTexture,this.isArrayTexture=e.isArrayTexture,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}setValues(e){for(const i in e){const s=e[i];if(s===void 0){oe(`Texture.setValues(): parameter '${i}' has value of undefined.`);continue}const l=this[i];if(l===void 0){oe(`Texture.setValues(): property '${i}' does not exist.`);continue}l&&s&&l.isVector2&&s.isVector2||l&&s&&l.isVector3&&s.isVector3||l&&s&&l.isMatrix3&&s.isMatrix3?l.copy(s):this[i]=s}}toJSON(e){const i=e===void 0||typeof e=="string";if(!i&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];const s={metadata:{version:4.7,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,normalized:this.normalized,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(s.userData=this.userData),i||(e.textures[this.uuid]=s),s}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(e){if(this.mapping!==cS)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case Sp:e.x=e.x-Math.floor(e.x);break;case Va:e.x=e.x<0?0:1;break;case yp:Math.abs(Math.floor(e.x)%2)===1?e.x=Math.ceil(e.x)-e.x:e.x=e.x-Math.floor(e.x);break}if(e.y<0||e.y>1)switch(this.wrapT){case Sp:e.y=e.y-Math.floor(e.y);break;case Va:e.y=e.y<0?0:1;break;case yp:Math.abs(Math.floor(e.y)%2)===1?e.y=Math.ceil(e.y)-e.y:e.y=e.y-Math.floor(e.y);break}return this.flipY&&(e.y=1-e.y),e}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(e){e===!0&&this.pmremVersion++}}Qn.DEFAULT_IMAGE=null;Qn.DEFAULT_MAPPING=cS;Qn.DEFAULT_ANISOTROPY=1;const Um=class Um{constructor(e=0,i=0,s=0,l=1){this.x=e,this.y=i,this.z=s,this.w=l}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,i,s,l){return this.x=e,this.y=i,this.z=s,this.w=l,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,i){switch(e){case 0:this.x=i;break;case 1:this.y=i;break;case 2:this.z=i;break;case 3:this.w=i;break;default:throw new Error("THREE.Vector4: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("THREE.Vector4: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w!==void 0?e.w:1,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,i){return this.x=e.x+i.x,this.y=e.y+i.y,this.z=e.z+i.z,this.w=e.w+i.w,this}addScaledVector(e,i){return this.x+=e.x*i,this.y+=e.y*i,this.z+=e.z*i,this.w+=e.w*i,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,i){return this.x=e.x-i.x,this.y=e.y-i.y,this.z=e.z-i.z,this.w=e.w-i.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){const i=this.x,s=this.y,l=this.z,f=this.w,h=e.elements;return this.x=h[0]*i+h[4]*s+h[8]*l+h[12]*f,this.y=h[1]*i+h[5]*s+h[9]*l+h[13]*f,this.z=h[2]*i+h[6]*s+h[10]*l+h[14]*f,this.w=h[3]*i+h[7]*s+h[11]*l+h[15]*f,this}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this.w/=e.w,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);const i=Math.sqrt(1-e.w*e.w);return i<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/i,this.y=e.y/i,this.z=e.z/i),this}setAxisAngleFromRotationMatrix(e){let i,s,l,f;const m=e.elements,p=m[0],S=m[4],_=m[8],v=m[1],M=m[5],A=m[9],N=m[2],y=m[6],x=m[10];if(Math.abs(S-v)<.01&&Math.abs(_-N)<.01&&Math.abs(A-y)<.01){if(Math.abs(S+v)<.1&&Math.abs(_+N)<.1&&Math.abs(A+y)<.1&&Math.abs(p+M+x-3)<.1)return this.set(1,0,0,0),this;i=Math.PI;const F=(p+1)/2,C=(M+1)/2,D=(x+1)/2,L=(S+v)/4,I=(_+N)/4,T=(A+y)/4;return F>C&&F>D?F<.01?(s=0,l=.707106781,f=.707106781):(s=Math.sqrt(F),l=L/s,f=I/s):C>D?C<.01?(s=.707106781,l=0,f=.707106781):(l=Math.sqrt(C),s=L/l,f=T/l):D<.01?(s=.707106781,l=.707106781,f=0):(f=Math.sqrt(D),s=I/f,l=T/f),this.set(s,l,f,i),this}let U=Math.sqrt((y-A)*(y-A)+(_-N)*(_-N)+(v-S)*(v-S));return Math.abs(U)<.001&&(U=1),this.x=(y-A)/U,this.y=(_-N)/U,this.z=(v-S)/U,this.w=Math.acos((p+M+x-1)/2),this}setFromMatrixPosition(e){const i=e.elements;return this.x=i[12],this.y=i[13],this.z=i[14],this.w=i[15],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,i){return this.x=we(this.x,e.x,i.x),this.y=we(this.y,e.y,i.y),this.z=we(this.z,e.z,i.z),this.w=we(this.w,e.w,i.w),this}clampScalar(e,i){return this.x=we(this.x,e,i),this.y=we(this.y,e,i),this.z=we(this.z,e,i),this.w=we(this.w,e,i),this}clampLength(e,i){const s=this.length();return this.divideScalar(s||1).multiplyScalar(we(s,e,i))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,i){return this.x+=(e.x-this.x)*i,this.y+=(e.y-this.y)*i,this.z+=(e.z-this.z)*i,this.w+=(e.w-this.w)*i,this}lerpVectors(e,i,s){return this.x=e.x+(i.x-e.x)*s,this.y=e.y+(i.y-e.y)*s,this.z=e.z+(i.z-e.z)*s,this.w=e.w+(i.w-e.w)*s,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,i=0){return this.x=e[i],this.y=e[i+1],this.z=e[i+2],this.w=e[i+3],this}toArray(e=[],i=0){return e[i]=this.x,e[i+1]=this.y,e[i+2]=this.z,e[i+3]=this.w,e}fromBufferAttribute(e,i){return this.x=e.getX(i),this.y=e.getY(i),this.z=e.getZ(i),this.w=e.getW(i),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}};Um.prototype.isVector4=!0;let ln=Um;class Eb extends Cs{constructor(e=1,i=1,s={}){super(),s=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:kn,depthBuffer:!0,stencilBuffer:!1,resolveColorBuffer:!0,resolveDepthBuffer:!0,resolveStencilBuffer:!0,storeMultisampledColorBuffer:!0,storeMultisampledDepthBuffer:!0,storeMultisampledStencilBuffer:!0,depthTexture:null,samples:0,count:1,depth:1,multiview:!1,useArrayDepthTexture:!1},s),this.isRenderTarget=!0,this.width=e,this.height=i,this.depth=s.depth,this.scissor=new ln(0,0,e,i),this.scissorTest=!1,this.viewport=new ln(0,0,e,i),this.textures=[];const l={width:e,height:i,depth:s.depth},f=new Qn(l),h=s.count;for(let d=0;d<h;d++)this.textures[d]=f.clone(),this.textures[d].isRenderTargetTexture=!0,this.textures[d].renderTarget=this;this._setTextureOptions(s),this.depthBuffer=s.depthBuffer,this.stencilBuffer=s.stencilBuffer,this.resolveColorBuffer=s.resolveColorBuffer,this.resolveDepthBuffer=s.resolveDepthBuffer,this.resolveStencilBuffer=s.resolveStencilBuffer,this.storeMultisampledColorBuffer=s.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=s.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=s.storeMultisampledStencilBuffer,this._depthTexture=null,this.depthTexture=s.depthTexture,this.samples=s.samples,this.multiview=s.multiview,this.useArrayDepthTexture=s.useArrayDepthTexture}_setTextureOptions(e={}){const i={minFilter:kn,generateMipmaps:!1,flipY:!1,internalFormat:null};e.mapping!==void 0&&(i.mapping=e.mapping),e.wrapS!==void 0&&(i.wrapS=e.wrapS),e.wrapT!==void 0&&(i.wrapT=e.wrapT),e.wrapR!==void 0&&(i.wrapR=e.wrapR),e.magFilter!==void 0&&(i.magFilter=e.magFilter),e.minFilter!==void 0&&(i.minFilter=e.minFilter),e.format!==void 0&&(i.format=e.format),e.type!==void 0&&(i.type=e.type),e.anisotropy!==void 0&&(i.anisotropy=e.anisotropy),e.colorSpace!==void 0&&(i.colorSpace=e.colorSpace),e.flipY!==void 0&&(i.flipY=e.flipY),e.generateMipmaps!==void 0&&(i.generateMipmaps=e.generateMipmaps),e.internalFormat!==void 0&&(i.internalFormat=e.internalFormat);for(let s=0;s<this.textures.length;s++)this.textures[s].setValues(i)}get texture(){return this.textures[0]}set texture(e){this.textures[0]=e}set depthTexture(e){this._depthTexture!==null&&this._depthTexture.renderTarget===this&&(this._depthTexture.renderTarget=null),e!==null&&e.renderTarget===null&&(e.renderTarget=this),this._depthTexture=e}get depthTexture(){return this._depthTexture}setSize(e,i,s=1){if(this.width!==e||this.height!==i||this.depth!==s){this.width=e,this.height=i,this.depth=s;for(let l=0,f=this.textures.length;l<f;l++)this.textures[l].image.width=e,this.textures[l].image.height=i,this.textures[l].image.depth=s,this.textures[l].isData3DTexture!==!0&&(this.textures[l].isArrayTexture=this.textures[l].image.depth>1);this.dispose()}this.viewport.set(0,0,e,i),this.scissor.set(0,0,e,i)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.scissor.copy(e.scissor),this.scissorTest=e.scissorTest,this.viewport.copy(e.viewport),this.textures.length=0;for(let i=0,s=e.textures.length;i<s;i++){this.textures[i]=e.textures[i].clone(),this.textures[i].isRenderTargetTexture=!0,this.textures[i].renderTarget=this;const l=Object.assign({},e.textures[i].image);this.textures[i].source=new mm(l)}if(this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,this.resolveColorBuffer=e.resolveColorBuffer,this.resolveDepthBuffer=e.resolveDepthBuffer,this.resolveStencilBuffer=e.resolveStencilBuffer,this.storeMultisampledColorBuffer=e.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=e.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=e.storeMultisampledStencilBuffer,e.depthTexture!==null)if(e.depthTexture.renderTarget===e){const i=e.depthTexture.clone();i.renderTarget=null,this.depthTexture=i}else this.depthTexture=e.depthTexture;return this.samples=e.samples,this.multiview=e.multiview,this.useArrayDepthTexture=e.useArrayDepthTexture,this}dispose(){this.dispatchEvent({type:"dispose"})}}class Ki extends Eb{constructor(e=1,i=1,s={}){super(e,i,s),this.isWebGLRenderTarget=!0}}class vS extends Qn{constructor(e=null,i=1,s=1,l=1){super(null),this.isDataArrayTexture=!0,this.image={data:e,width:i,height:s,depth:l},this.magFilter=Fn,this.minFilter=Fn,this.wrapR=Va,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}copy(e){return super.copy(e),this.wrapR=e.wrapR,this}addLayerUpdate(e){this.layerUpdates.add(e)}clearLayerUpdates(){this.layerUpdates.clear()}}class bb extends Qn{constructor(e=null,i=1,s=1,l=1){super(null),this.isData3DTexture=!0,this.image={data:e,width:i,height:s,depth:l},this.magFilter=Fn,this.minFilter=Fn,this.wrapR=Va,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}copy(e){return super.copy(e),this.wrapR=e.wrapR,this}}const ju=class ju{constructor(e,i,s,l,f,h,d,m,p,S,_,v,M,A,N,y){this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],e!==void 0&&this.set(e,i,s,l,f,h,d,m,p,S,_,v,M,A,N,y)}set(e,i,s,l,f,h,d,m,p,S,_,v,M,A,N,y){const x=this.elements;return x[0]=e,x[4]=i,x[8]=s,x[12]=l,x[1]=f,x[5]=h,x[9]=d,x[13]=m,x[2]=p,x[6]=S,x[10]=_,x[14]=v,x[3]=M,x[7]=A,x[11]=N,x[15]=y,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new ju().fromArray(this.elements)}copy(e){const i=this.elements,s=e.elements;return i[0]=s[0],i[1]=s[1],i[2]=s[2],i[3]=s[3],i[4]=s[4],i[5]=s[5],i[6]=s[6],i[7]=s[7],i[8]=s[8],i[9]=s[9],i[10]=s[10],i[11]=s[11],i[12]=s[12],i[13]=s[13],i[14]=s[14],i[15]=s[15],this}copyPosition(e){const i=this.elements,s=e.elements;return i[12]=s[12],i[13]=s[13],i[14]=s[14],this}setFromMatrix3(e){const i=e.elements;return this.set(i[0],i[3],i[6],0,i[1],i[4],i[7],0,i[2],i[5],i[8],0,0,0,0,1),this}extractBasis(e,i,s){return this.determinantAffine()===0?(e.set(1,0,0),i.set(0,1,0),s.set(0,0,1),this):(e.setFromMatrixColumn(this,0),i.setFromMatrixColumn(this,1),s.setFromMatrixColumn(this,2),this)}makeBasis(e,i,s){return this.set(e.x,i.x,s.x,0,e.y,i.y,s.y,0,e.z,i.z,s.z,0,0,0,0,1),this}extractRotation(e){if(e.determinantAffine()===0)return this.identity();const i=this.elements,s=e.elements,l=1/Jr.setFromMatrixColumn(e,0).length(),f=1/Jr.setFromMatrixColumn(e,1).length(),h=1/Jr.setFromMatrixColumn(e,2).length();return i[0]=s[0]*l,i[1]=s[1]*l,i[2]=s[2]*l,i[3]=0,i[4]=s[4]*f,i[5]=s[5]*f,i[6]=s[6]*f,i[7]=0,i[8]=s[8]*h,i[9]=s[9]*h,i[10]=s[10]*h,i[11]=0,i[12]=0,i[13]=0,i[14]=0,i[15]=1,this}makeRotationFromEuler(e){const i=this.elements,s=e.x,l=e.y,f=e.z,h=Math.cos(s),d=Math.sin(s),m=Math.cos(l),p=Math.sin(l),S=Math.cos(f),_=Math.sin(f);if(e.order==="XYZ"){const v=h*S,M=h*_,A=d*S,N=d*_;i[0]=m*S,i[4]=-m*_,i[8]=p,i[1]=M+A*p,i[5]=v-N*p,i[9]=-d*m,i[2]=N-v*p,i[6]=A+M*p,i[10]=h*m}else if(e.order==="YXZ"){const v=m*S,M=m*_,A=p*S,N=p*_;i[0]=v+N*d,i[4]=A*d-M,i[8]=h*p,i[1]=h*_,i[5]=h*S,i[9]=-d,i[2]=M*d-A,i[6]=N+v*d,i[10]=h*m}else if(e.order==="ZXY"){const v=m*S,M=m*_,A=p*S,N=p*_;i[0]=v-N*d,i[4]=-h*_,i[8]=A+M*d,i[1]=M+A*d,i[5]=h*S,i[9]=N-v*d,i[2]=-h*p,i[6]=d,i[10]=h*m}else if(e.order==="ZYX"){const v=h*S,M=h*_,A=d*S,N=d*_;i[0]=m*S,i[4]=A*p-M,i[8]=v*p+N,i[1]=m*_,i[5]=N*p+v,i[9]=M*p-A,i[2]=-p,i[6]=d*m,i[10]=h*m}else if(e.order==="YZX"){const v=h*m,M=h*p,A=d*m,N=d*p;i[0]=m*S,i[4]=N-v*_,i[8]=A*_+M,i[1]=_,i[5]=h*S,i[9]=-d*S,i[2]=-p*S,i[6]=M*_+A,i[10]=v-N*_}else if(e.order==="XZY"){const v=h*m,M=h*p,A=d*m,N=d*p;i[0]=m*S,i[4]=-_,i[8]=p*S,i[1]=v*_+N,i[5]=h*S,i[9]=M*_-A,i[2]=A*_-M,i[6]=d*S,i[10]=N*_+v}return i[3]=0,i[7]=0,i[11]=0,i[12]=0,i[13]=0,i[14]=0,i[15]=1,this}makeRotationFromQuaternion(e){return this.compose(Tb,e,Ab)}lookAt(e,i,s){const l=this.elements;return _i.subVectors(e,i),_i.lengthSq()===0&&(_i.z=1),_i.normalize(),ys.crossVectors(s,_i),ys.lengthSq()===0&&(Math.abs(s.z)===1?_i.x+=1e-4:_i.z+=1e-4,_i.normalize(),ys.crossVectors(s,_i)),ys.normalize(),lu.crossVectors(_i,ys),l[0]=ys.x,l[4]=lu.x,l[8]=_i.x,l[1]=ys.y,l[5]=lu.y,l[9]=_i.y,l[2]=ys.z,l[6]=lu.z,l[10]=_i.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,i){const s=e.elements,l=i.elements,f=this.elements,h=s[0],d=s[4],m=s[8],p=s[12],S=s[1],_=s[5],v=s[9],M=s[13],A=s[2],N=s[6],y=s[10],x=s[14],U=s[3],F=s[7],C=s[11],D=s[15],L=l[0],I=l[4],T=l[8],O=l[12],G=l[1],k=l[5],Q=l[9],st=l[13],Y=l[2],tt=l[6],q=l[10],j=l[14],dt=l[3],ut=l[7],rt=l[11],Tt=l[15];return f[0]=h*L+d*G+m*Y+p*dt,f[4]=h*I+d*k+m*tt+p*ut,f[8]=h*T+d*Q+m*q+p*rt,f[12]=h*O+d*st+m*j+p*Tt,f[1]=S*L+_*G+v*Y+M*dt,f[5]=S*I+_*k+v*tt+M*ut,f[9]=S*T+_*Q+v*q+M*rt,f[13]=S*O+_*st+v*j+M*Tt,f[2]=A*L+N*G+y*Y+x*dt,f[6]=A*I+N*k+y*tt+x*ut,f[10]=A*T+N*Q+y*q+x*rt,f[14]=A*O+N*st+y*j+x*Tt,f[3]=U*L+F*G+C*Y+D*dt,f[7]=U*I+F*k+C*tt+D*ut,f[11]=U*T+F*Q+C*q+D*rt,f[15]=U*O+F*st+C*j+D*Tt,this}multiplyScalar(e){const i=this.elements;return i[0]*=e,i[4]*=e,i[8]*=e,i[12]*=e,i[1]*=e,i[5]*=e,i[9]*=e,i[13]*=e,i[2]*=e,i[6]*=e,i[10]*=e,i[14]*=e,i[3]*=e,i[7]*=e,i[11]*=e,i[15]*=e,this}determinant(){const e=this.elements,i=e[0],s=e[4],l=e[8],f=e[12],h=e[1],d=e[5],m=e[9],p=e[13],S=e[2],_=e[6],v=e[10],M=e[14],A=e[3],N=e[7],y=e[11],x=e[15],U=m*M-p*v,F=d*M-p*_,C=d*v-m*_,D=h*M-p*S,L=h*v-m*S,I=h*_-d*S;return i*(N*U-y*F+x*C)-s*(A*U-y*D+x*L)+l*(A*F-N*D+x*I)-f*(A*C-N*L+y*I)}determinantAffine(){const e=this.elements,i=e[0],s=e[4],l=e[8],f=e[1],h=e[5],d=e[9],m=e[2],p=e[6],S=e[10];return i*(h*S-d*p)-s*(f*S-d*m)+l*(f*p-h*m)}transpose(){const e=this.elements;let i;return i=e[1],e[1]=e[4],e[4]=i,i=e[2],e[2]=e[8],e[8]=i,i=e[6],e[6]=e[9],e[9]=i,i=e[3],e[3]=e[12],e[12]=i,i=e[7],e[7]=e[13],e[13]=i,i=e[11],e[11]=e[14],e[14]=i,this}setPosition(e,i,s){const l=this.elements;return e.isVector3?(l[12]=e.x,l[13]=e.y,l[14]=e.z):(l[12]=e,l[13]=i,l[14]=s),this}invert(){const e=this.elements,i=e[0],s=e[1],l=e[2],f=e[3],h=e[4],d=e[5],m=e[6],p=e[7],S=e[8],_=e[9],v=e[10],M=e[11],A=e[12],N=e[13],y=e[14],x=e[15],U=i*d-s*h,F=i*m-l*h,C=i*p-f*h,D=s*m-l*d,L=s*p-f*d,I=l*p-f*m,T=S*N-_*A,O=S*y-v*A,G=S*x-M*A,k=_*y-v*N,Q=_*x-M*N,st=v*x-M*y,Y=U*st-F*Q+C*k+D*G-L*O+I*T;if(Y===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);const tt=1/Y;return e[0]=(d*st-m*Q+p*k)*tt,e[1]=(l*Q-s*st-f*k)*tt,e[2]=(N*I-y*L+x*D)*tt,e[3]=(v*L-_*I-M*D)*tt,e[4]=(m*G-h*st-p*O)*tt,e[5]=(i*st-l*G+f*O)*tt,e[6]=(y*C-A*I-x*F)*tt,e[7]=(S*I-v*C+M*F)*tt,e[8]=(h*Q-d*G+p*T)*tt,e[9]=(s*G-i*Q-f*T)*tt,e[10]=(A*L-N*C+x*U)*tt,e[11]=(_*C-S*L-M*U)*tt,e[12]=(d*O-h*k-m*T)*tt,e[13]=(i*k-s*O+l*T)*tt,e[14]=(N*F-A*D-y*U)*tt,e[15]=(S*D-_*F+v*U)*tt,this}scale(e){const i=this.elements,s=e.x,l=e.y,f=e.z;return i[0]*=s,i[4]*=l,i[8]*=f,i[1]*=s,i[5]*=l,i[9]*=f,i[2]*=s,i[6]*=l,i[10]*=f,i[3]*=s,i[7]*=l,i[11]*=f,this}getMaxScaleOnAxis(){const e=this.elements,i=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],s=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],l=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(i,s,l))}makeTranslation(e,i,s){return e.isVector3?this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1):this.set(1,0,0,e,0,1,0,i,0,0,1,s,0,0,0,1),this}makeRotationX(e){const i=Math.cos(e),s=Math.sin(e);return this.set(1,0,0,0,0,i,-s,0,0,s,i,0,0,0,0,1),this}makeRotationY(e){const i=Math.cos(e),s=Math.sin(e);return this.set(i,0,s,0,0,1,0,0,-s,0,i,0,0,0,0,1),this}makeRotationZ(e){const i=Math.cos(e),s=Math.sin(e);return this.set(i,-s,0,0,s,i,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,i){const s=Math.cos(i),l=Math.sin(i),f=1-s,h=e.x,d=e.y,m=e.z,p=f*h,S=f*d;return this.set(p*h+s,p*d-l*m,p*m+l*d,0,p*d+l*m,S*d+s,S*m-l*h,0,p*m-l*d,S*m+l*h,f*m*m+s,0,0,0,0,1),this}makeScale(e,i,s){return this.set(e,0,0,0,0,i,0,0,0,0,s,0,0,0,0,1),this}makeShear(e,i,s,l,f,h){return this.set(1,s,f,0,e,1,h,0,i,l,1,0,0,0,0,1),this}compose(e,i,s){const l=this.elements,f=i._x,h=i._y,d=i._z,m=i._w,p=f+f,S=h+h,_=d+d,v=f*p,M=f*S,A=f*_,N=h*S,y=h*_,x=d*_,U=m*p,F=m*S,C=m*_,D=s.x,L=s.y,I=s.z;return l[0]=(1-(N+x))*D,l[1]=(M+C)*D,l[2]=(A-F)*D,l[3]=0,l[4]=(M-C)*L,l[5]=(1-(v+x))*L,l[6]=(y+U)*L,l[7]=0,l[8]=(A+F)*I,l[9]=(y-U)*I,l[10]=(1-(v+N))*I,l[11]=0,l[12]=e.x,l[13]=e.y,l[14]=e.z,l[15]=1,this}decompose(e,i,s){const l=this.elements;e.x=l[12],e.y=l[13],e.z=l[14];const f=this.determinantAffine();if(f===0)return s.set(1,1,1),i.identity(),this;let h=Jr.set(l[0],l[1],l[2]).length();const d=Jr.set(l[4],l[5],l[6]).length(),m=Jr.set(l[8],l[9],l[10]).length();f<0&&(h=-h),qi.copy(this);const p=1/h,S=1/d,_=1/m;return qi.elements[0]*=p,qi.elements[1]*=p,qi.elements[2]*=p,qi.elements[4]*=S,qi.elements[5]*=S,qi.elements[6]*=S,qi.elements[8]*=_,qi.elements[9]*=_,qi.elements[10]*=_,i.setFromRotationMatrix(qi),s.x=h,s.y=d,s.z=m,this}makePerspective(e,i,s,l,f,h,d=ga,m=!1){const p=this.elements,S=2*f/(i-e),_=2*f/(s-l),v=(i+e)/(i-e),M=(s+l)/(s-l);let A,N;if(m)A=f/(h-f),N=h*f/(h-f);else if(d===ga)A=-(h+f)/(h-f),N=-2*h*f/(h-f);else if(d===Ol)A=-h/(h-f),N=-h*f/(h-f);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+d);return p[0]=S,p[4]=0,p[8]=v,p[12]=0,p[1]=0,p[5]=_,p[9]=M,p[13]=0,p[2]=0,p[6]=0,p[10]=A,p[14]=N,p[3]=0,p[7]=0,p[11]=-1,p[15]=0,this}makeOrthographic(e,i,s,l,f,h,d=ga,m=!1){const p=this.elements,S=2/(i-e),_=2/(s-l),v=-(i+e)/(i-e),M=-(s+l)/(s-l);let A,N;if(m)A=1/(h-f),N=h/(h-f);else if(d===ga)A=-2/(h-f),N=-(h+f)/(h-f);else if(d===Ol)A=-1/(h-f),N=-f/(h-f);else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+d);return p[0]=S,p[4]=0,p[8]=0,p[12]=v,p[1]=0,p[5]=_,p[9]=0,p[13]=M,p[2]=0,p[6]=0,p[10]=A,p[14]=N,p[3]=0,p[7]=0,p[11]=0,p[15]=1,this}equals(e){const i=this.elements,s=e.elements;for(let l=0;l<16;l++)if(i[l]!==s[l])return!1;return!0}fromArray(e,i=0){for(let s=0;s<16;s++)this.elements[s]=e[s+i];return this}toArray(e=[],i=0){const s=this.elements;return e[i]=s[0],e[i+1]=s[1],e[i+2]=s[2],e[i+3]=s[3],e[i+4]=s[4],e[i+5]=s[5],e[i+6]=s[6],e[i+7]=s[7],e[i+8]=s[8],e[i+9]=s[9],e[i+10]=s[10],e[i+11]=s[11],e[i+12]=s[12],e[i+13]=s[13],e[i+14]=s[14],e[i+15]=s[15],e}};ju.prototype.isMatrix4=!0;let cn=ju;const Jr=new nt,qi=new cn,Tb=new nt(0,0,0),Ab=new nt(1,1,1),ys=new nt,lu=new nt,_i=new nt,ix=new cn,ax=new Rs;class ws{constructor(e=0,i=0,s=0,l=ws.DEFAULT_ORDER){this.isEuler=!0,this._x=e,this._y=i,this._z=s,this._order=l}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,i,s,l=this._order){return this._x=e,this._y=i,this._z=s,this._order=l,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,i=this._order,s=!0){const l=e.elements,f=l[0],h=l[4],d=l[8],m=l[1],p=l[5],S=l[9],_=l[2],v=l[6],M=l[10];switch(i){case"XYZ":this._y=Math.asin(we(d,-1,1)),Math.abs(d)<.9999999?(this._x=Math.atan2(-S,M),this._z=Math.atan2(-h,f)):(this._x=Math.atan2(v,p),this._z=0);break;case"YXZ":this._x=Math.asin(-we(S,-1,1)),Math.abs(S)<.9999999?(this._y=Math.atan2(d,M),this._z=Math.atan2(m,p)):(this._y=Math.atan2(-_,f),this._z=0);break;case"ZXY":this._x=Math.asin(we(v,-1,1)),Math.abs(v)<.9999999?(this._y=Math.atan2(-_,M),this._z=Math.atan2(-h,p)):(this._y=0,this._z=Math.atan2(m,f));break;case"ZYX":this._y=Math.asin(-we(_,-1,1)),Math.abs(_)<.9999999?(this._x=Math.atan2(v,M),this._z=Math.atan2(m,f)):(this._x=0,this._z=Math.atan2(-h,p));break;case"YZX":this._z=Math.asin(we(m,-1,1)),Math.abs(m)<.9999999?(this._x=Math.atan2(-S,p),this._y=Math.atan2(-_,f)):(this._x=0,this._y=Math.atan2(d,M));break;case"XZY":this._z=Math.asin(-we(h,-1,1)),Math.abs(h)<.9999999?(this._x=Math.atan2(v,p),this._y=Math.atan2(d,f)):(this._x=Math.atan2(-S,M),this._y=0);break;default:oe("Euler: .setFromRotationMatrix() encountered an unknown order: "+i)}return this._order=i,s===!0&&this._onChangeCallback(),this}setFromQuaternion(e,i,s){return ix.makeRotationFromQuaternion(e),this.setFromRotationMatrix(ix,i,s)}setFromVector3(e,i=this._order){return this.set(e.x,e.y,e.z,i)}reorder(e){return ax.setFromEuler(this),this.setFromQuaternion(ax,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],i=0){return e[i]=this._x,e[i+1]=this._y,e[i+2]=this._z,e[i+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}}ws.DEFAULT_ORDER="XYZ";class xS{constructor(){this.mask=1}set(e){this.mask=(1<<e|0)>>>0}enable(e){this.mask|=1<<e|0}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e|0}disable(e){this.mask&=~(1<<e|0)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!==0}isEnabled(e){return(this.mask&(1<<e|0))!==0}}let Rb=0;const sx=new nt,$r=new Rs,Ia=new cn,cu=new nt,xl=new nt,wb=new nt,Cb=new Rs,rx=new nt(1,0,0),ox=new nt(0,1,0),lx=new nt(0,0,1),cx={type:"added"},Nb={type:"removed"},to={type:"childadded",child:null},Gd={type:"childremoved",child:null};class Un extends Cs{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:Rb++}),this.uuid=Il(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=Un.DEFAULT_UP.clone();const e=new nt,i=new ws,s=new Rs,l=new nt(1,1,1);function f(){s.setFromEuler(i,!1)}function h(){i.setFromQuaternion(s,void 0,!1)}i._onChange(f),s._onChange(h),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:e},rotation:{configurable:!0,enumerable:!0,value:i},quaternion:{configurable:!0,enumerable:!0,value:s},scale:{configurable:!0,enumerable:!0,value:l},modelViewMatrix:{value:new cn},normalMatrix:{value:new de}}),this.matrix=new cn,this.matrixWorld=new cn,this.matrixAutoUpdate=Un.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=Un.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new xS,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.static=!1,this.userData={},this.pivot=null}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,i){this.quaternion.setFromAxisAngle(e,i)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,i){return $r.setFromAxisAngle(e,i),this.quaternion.multiply($r),this}rotateOnWorldAxis(e,i){return $r.setFromAxisAngle(e,i),this.quaternion.premultiply($r),this}rotateX(e){return this.rotateOnAxis(rx,e)}rotateY(e){return this.rotateOnAxis(ox,e)}rotateZ(e){return this.rotateOnAxis(lx,e)}translateOnAxis(e,i){return sx.copy(e).applyQuaternion(this.quaternion),this.position.add(sx.multiplyScalar(i)),this}translateX(e){return this.translateOnAxis(rx,e)}translateY(e){return this.translateOnAxis(ox,e)}translateZ(e){return this.translateOnAxis(lx,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(Ia.copy(this.matrixWorld).invert())}lookAt(e,i,s){e.isVector3?cu.copy(e):cu.set(e,i,s);const l=this.parent;this.updateWorldMatrix(!0,!1),xl.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?Ia.lookAt(xl,cu,this.up):Ia.lookAt(cu,xl,this.up),this.quaternion.setFromRotationMatrix(Ia),l&&(Ia.extractRotation(l.matrixWorld),$r.setFromRotationMatrix(Ia),this.quaternion.premultiply($r.invert()))}add(e){if(arguments.length>1){for(let i=0;i<arguments.length;i++)this.add(arguments[i]);return this}return e===this?(Fe("Object3D.add: object can't be added as a child of itself.",e),this):(e&&e.isObject3D?(e.removeFromParent(),e.parent=this,this.children.push(e),e.dispatchEvent(cx),to.child=e,this.dispatchEvent(to),to.child=null):Fe("Object3D.add: object not an instance of THREE.Object3D.",e),this)}remove(e){if(arguments.length>1){for(let s=0;s<arguments.length;s++)this.remove(arguments[s]);return this}const i=this.children.indexOf(e);return i!==-1&&(e.parent=null,this.children.splice(i,1),e.dispatchEvent(Nb),Gd.child=e,this.dispatchEvent(Gd),Gd.child=null),this}removeFromParent(){const e=this.parent;return e!==null&&e.remove(this),this}clear(){return this.remove(...this.children)}attach(e){return this.updateWorldMatrix(!0,!1),Ia.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),Ia.multiply(e.parent.matrixWorld)),e.applyMatrix4(Ia),e.removeFromParent(),e.parent=this,this.children.push(e),e.updateWorldMatrix(!1,!0),e.dispatchEvent(cx),to.child=e,this.dispatchEvent(to),to.child=null,this}getObjectById(e){return this.getObjectByProperty("id",e)}getObjectByName(e){return this.getObjectByProperty("name",e)}getObjectByProperty(e,i){if(this[e]===i)return this;for(let s=0,l=this.children.length;s<l;s++){const h=this.children[s].getObjectByProperty(e,i);if(h!==void 0)return h}}getObjectsByProperty(e,i,s=[]){this[e]===i&&s.push(this);const l=this.children;for(let f=0,h=l.length;f<h;f++)l[f].getObjectsByProperty(e,i,s);return s}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(xl,e,wb),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(xl,Cb,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);const i=this.matrixWorld.elements;return e.set(i[8],i[9],i[10]).normalize()}raycast(){}intersectsFrustum(){}traverse(e){e(this);const i=this.children;for(let s=0,l=i.length;s<l;s++)i[s].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);const i=this.children;for(let s=0,l=i.length;s<l;s++)i[s].traverseVisible(e)}traverseAncestors(e){const i=this.parent;i!==null&&(e(i),i.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale);const e=this.pivot;if(e!==null){const i=e.x,s=e.y,l=e.z,f=this.matrix.elements;f[12]+=i-f[0]*i-f[4]*s-f[8]*l,f[13]+=s-f[1]*i-f[5]*s-f[9]*l,f[14]+=l-f[2]*i-f[6]*s-f[10]*l}this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,e=!0);const i=this.children;for(let s=0,l=i.length;s<l;s++)i[s].updateMatrixWorld(e)}updateWorldMatrix(e,i,s=!1){const l=this.parent;if(e===!0&&l!==null&&l.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||s)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,s=!0),i===!0){const f=this.children;for(let h=0,d=f.length;h<d;h++)f[h].updateWorldMatrix(!1,!0,s)}}toJSON(e){const i=e===void 0||typeof e=="string",s={};i&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},s.metadata={version:4.7,type:"Object",generator:"Object3D.toJSON"});const l={};l.uuid=this.uuid,l.type=this.type,l.name=this.name,l.castShadow=this.castShadow,l.receiveShadow=this.receiveShadow,l.visible=this.visible,l.frustumCulled=this.frustumCulled,l.renderOrder=this.renderOrder,l.static=this.static,l.matrixAutoUpdate=this.matrixAutoUpdate,Object.keys(this.userData).length>0&&(l.userData=this.userData),l.layers=this.layers.mask,l.matrix=this.matrix.toArray(),l.up=this.up.toArray(),this.pivot!==null&&(l.pivot=this.pivot.toArray()),this.morphTargetDictionary!==void 0&&(l.morphTargetDictionary=Object.assign({},this.morphTargetDictionary)),this.morphTargetInfluences!==void 0&&(l.morphTargetInfluences=this.morphTargetInfluences.slice()),this.isInstancedMesh&&(l.type="InstancedMesh",l.count=this.count,l.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(l.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(l.type="BatchedMesh",l.perObjectFrustumCulled=this.perObjectFrustumCulled,l.sortObjects=this.sortObjects,l.drawRanges=this._drawRanges,l.reservedRanges=this._reservedRanges,l.geometryInfo=this._geometryInfo.map(d=>({...d,boundingBox:d.boundingBox?d.boundingBox.toJSON():void 0,boundingSphere:d.boundingSphere?d.boundingSphere.toJSON():void 0})),l.instanceInfo=this._instanceInfo.map(d=>({...d})),l.availableInstanceIds=this._availableInstanceIds.slice(),l.availableGeometryIds=this._availableGeometryIds.slice(),l.nextIndexStart=this._nextIndexStart,l.nextVertexStart=this._nextVertexStart,l.geometryCount=this._geometryCount,l.maxInstanceCount=this._maxInstanceCount,l.maxVertexCount=this._maxVertexCount,l.maxIndexCount=this._maxIndexCount,l.geometryInitialized=this._geometryInitialized,l.matricesTexture=this._matricesTexture.toJSON(e),l.indirectTexture=this._indirectTexture.toJSON(e),this._colorsTexture!==null&&(l.colorsTexture=this._colorsTexture.toJSON(e)),this.boundingSphere!==null&&(l.boundingSphere=this.boundingSphere.toJSON()),this.boundingBox!==null&&(l.boundingBox=this.boundingBox.toJSON()));function f(d,m){return d[m.uuid]===void 0&&(d[m.uuid]=m.toJSON(e)),m.uuid}if(this.isScene)this.background&&(this.background.isColor?l.background=this.background.toJSON():this.background.isTexture&&(l.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(l.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){l.geometry=f(e.geometries,this.geometry);const d=this.geometry.parameters;if(d!==void 0&&d.shapes!==void 0){const m=d.shapes;if(Array.isArray(m))for(let p=0,S=m.length;p<S;p++){const _=m[p];f(e.shapes,_)}else f(e.shapes,m)}}if(this.isSkinnedMesh&&(l.bindMode=this.bindMode,l.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(f(e.skeletons,this.skeleton),l.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){const d=[];for(let m=0,p=this.material.length;m<p;m++)d.push(f(e.materials,this.material[m]));l.material=d}else l.material=f(e.materials,this.material);if(this.children.length>0){l.children=[];for(let d=0;d<this.children.length;d++)l.children.push(this.children[d].toJSON(e).object)}if(this.animations.length>0){l.animations=[];for(let d=0;d<this.animations.length;d++){const m=this.animations[d];l.animations.push(f(e.animations,m))}}if(i){const d=h(e.geometries),m=h(e.materials),p=h(e.textures),S=h(e.images),_=h(e.shapes),v=h(e.skeletons),M=h(e.animations),A=h(e.nodes);d.length>0&&(s.geometries=d),m.length>0&&(s.materials=m),p.length>0&&(s.textures=p),S.length>0&&(s.images=S),_.length>0&&(s.shapes=_),v.length>0&&(s.skeletons=v),M.length>0&&(s.animations=M),A.length>0&&(s.nodes=A)}return s.object=l,s;function h(d){const m=[];for(const p in d){const S=d[p];delete S.metadata,m.push(S)}return m}}clone(e){return new this.constructor().copy(this,e)}copy(e,i=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.pivot=e.pivot!==null?e.pivot.clone():null,this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.static=e.static,this.animations=e.animations.slice(),this.userData=JSON.parse(JSON.stringify(e.userData)),i===!0)for(let s=0;s<e.children.length;s++){const l=e.children[s];this.add(l.clone())}return this}dispose(){this.dispatchEvent({type:"dispose"})}}Un.DEFAULT_UP=new nt(0,1,0);Un.DEFAULT_MATRIX_AUTO_UPDATE=!0;Un.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;class da extends Un{constructor(){super(),this.isGroup=!0,this.type="Group"}}const Db={type:"move"};class Vd{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new da,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new da,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new nt,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new nt),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new da,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new nt,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new nt,this._grip.eventsEnabled=!1),this._grip}dispatchEvent(e){return this._targetRay!==null&&this._targetRay.dispatchEvent(e),this._grip!==null&&this._grip.dispatchEvent(e),this._hand!==null&&this._hand.dispatchEvent(e),this}connect(e){if(e&&e.hand){const i=this._hand;if(i)for(const s of e.hand.values())this._getHandJoint(i,s)}return this.dispatchEvent({type:"connected",data:e}),this}disconnect(e){return this.dispatchEvent({type:"disconnected",data:e}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(e,i,s){let l=null,f=null,h=null;const d=this._targetRay,m=this._grip,p=this._hand;if(e&&i.session.visibilityState!=="visible-blurred"){if(p&&e.hand){h=!0;for(const N of e.hand.values()){const y=i.getJointPose(N,s),x=this._getHandJoint(p,N);y!==null&&(x.matrix.fromArray(y.transform.matrix),x.matrix.decompose(x.position,x.rotation,x.scale),x.matrixWorldNeedsUpdate=!0,x.jointRadius=y.radius),x.visible=y!==null}const S=p.joints["index-finger-tip"],_=p.joints["thumb-tip"],v=S.position.distanceTo(_.position),M=.02,A=.005;p.inputState.pinching&&v>M+A?(p.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:e.handedness,target:this})):!p.inputState.pinching&&v<=M-A&&(p.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:e.handedness,target:this}))}else m!==null&&e.gripSpace&&(f=i.getPose(e.gripSpace,s),f!==null&&(m.matrix.fromArray(f.transform.matrix),m.matrix.decompose(m.position,m.rotation,m.scale),m.matrixWorldNeedsUpdate=!0,f.linearVelocity?(m.hasLinearVelocity=!0,m.linearVelocity.copy(f.linearVelocity)):m.hasLinearVelocity=!1,f.angularVelocity?(m.hasAngularVelocity=!0,m.angularVelocity.copy(f.angularVelocity)):m.hasAngularVelocity=!1,m.eventsEnabled&&m.dispatchEvent({type:"gripUpdated",data:e,target:this})));d!==null&&(l=i.getPose(e.targetRaySpace,s),l===null&&f!==null&&(l=f),l!==null&&(d.matrix.fromArray(l.transform.matrix),d.matrix.decompose(d.position,d.rotation,d.scale),d.matrixWorldNeedsUpdate=!0,l.linearVelocity?(d.hasLinearVelocity=!0,d.linearVelocity.copy(l.linearVelocity)):d.hasLinearVelocity=!1,l.angularVelocity?(d.hasAngularVelocity=!0,d.angularVelocity.copy(l.angularVelocity)):d.hasAngularVelocity=!1,this.dispatchEvent(Db)))}return d!==null&&(d.visible=l!==null),m!==null&&(m.visible=f!==null),p!==null&&(p.visible=h!==null),this}_getHandJoint(e,i){if(e.joints[i.jointName]===void 0){const s=new da;s.matrixAutoUpdate=!1,s.visible=!1,e.joints[i.jointName]=s,e.add(s)}return e.joints[i.jointName]}}const SS={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},Ms={h:0,s:0,l:0},uu={h:0,s:0,l:0};function kd(o,e,i){return i<0&&(i+=1),i>1&&(i-=1),i<1/6?o+(e-o)*6*i:i<1/2?e:i<2/3?o+(e-o)*6*(2/3-i):o}class Me{constructor(e,i,s){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(e,i,s)}set(e,i,s){if(i===void 0&&s===void 0){const l=e;l&&l.isColor?this.copy(l):typeof l=="number"?this.setHex(l):typeof l=="string"&&this.setStyle(l)}else this.setRGB(e,i,s);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,i=Pi){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(e&255)/255,Oe.colorSpaceToWorking(this,i),this}setRGB(e,i,s,l=Oe.workingColorSpace){return this.r=e,this.g=i,this.b=s,Oe.colorSpaceToWorking(this,l),this}setHSL(e,i,s,l=Oe.workingColorSpace){if(e=_b(e,1),i=we(i,0,1),s=we(s,0,1),i===0)this.r=this.g=this.b=s;else{const f=s<=.5?s*(1+i):s+i-s*i,h=2*s-f;this.r=kd(h,f,e+1/3),this.g=kd(h,f,e),this.b=kd(h,f,e-1/3)}return Oe.colorSpaceToWorking(this,l),this}setStyle(e,i=Pi){function s(f){f!==void 0&&parseFloat(f)<1&&oe("Color: Alpha component of "+e+" will be ignored.")}let l;if(l=/^(\w+)\(([^\)]*)\)/.exec(e)){let f;const h=l[1],d=l[2];switch(h){case"rgb":case"rgba":if(f=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(d))return s(f[4]),this.setRGB(Math.min(255,parseInt(f[1],10))/255,Math.min(255,parseInt(f[2],10))/255,Math.min(255,parseInt(f[3],10))/255,i);if(f=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(d))return s(f[4]),this.setRGB(Math.min(100,parseInt(f[1],10))/100,Math.min(100,parseInt(f[2],10))/100,Math.min(100,parseInt(f[3],10))/100,i);break;case"hsl":case"hsla":if(f=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(d))return s(f[4]),this.setHSL(parseFloat(f[1])/360,parseFloat(f[2])/100,parseFloat(f[3])/100,i);break;default:oe("Color: Unknown color model "+e)}}else if(l=/^\#([A-Fa-f\d]+)$/.exec(e)){const f=l[1],h=f.length;if(h===3)return this.setRGB(parseInt(f.charAt(0),16)/15,parseInt(f.charAt(1),16)/15,parseInt(f.charAt(2),16)/15,i);if(h===6)return this.setHex(parseInt(f,16),i);oe("Color: Invalid hex color "+e)}else if(e&&e.length>0)return this.setColorName(e,i);return this}setColorName(e,i=Pi){const s=SS[e.toLowerCase()];return s!==void 0?this.setHex(s,i):oe("Color: Unknown color "+e),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=Xa(e.r),this.g=Xa(e.g),this.b=Xa(e.b),this}copyLinearToSRGB(e){return this.r=go(e.r),this.g=go(e.g),this.b=go(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=Pi){return Oe.workingToColorSpace(Vn.copy(this),e),Math.round(we(Vn.r*255,0,255))*65536+Math.round(we(Vn.g*255,0,255))*256+Math.round(we(Vn.b*255,0,255))}getHexString(e=Pi){return("000000"+this.getHex(e).toString(16)).slice(-6)}getHSL(e,i=Oe.workingColorSpace){Oe.workingToColorSpace(Vn.copy(this),i);const s=Vn.r,l=Vn.g,f=Vn.b,h=Math.max(s,l,f),d=Math.min(s,l,f);let m,p;const S=(d+h)/2;if(d===h)m=0,p=0;else{const _=h-d;switch(p=S<=.5?_/(h+d):_/(2-h-d),h){case s:m=(l-f)/_+(l<f?6:0);break;case l:m=(f-s)/_+2;break;case f:m=(s-l)/_+4;break}m/=6}return e.h=m,e.s=p,e.l=S,e}getRGB(e,i=Oe.workingColorSpace){return Oe.workingToColorSpace(Vn.copy(this),i),e.r=Vn.r,e.g=Vn.g,e.b=Vn.b,e}getStyle(e=Pi){Oe.workingToColorSpace(Vn.copy(this),e);const i=Vn.r,s=Vn.g,l=Vn.b;return e!==Pi?`color(${e} ${i.toFixed(3)} ${s.toFixed(3)} ${l.toFixed(3)})`:`rgb(${Math.round(i*255)},${Math.round(s*255)},${Math.round(l*255)})`}offsetHSL(e,i,s){return this.getHSL(Ms),this.setHSL(Ms.h+e,Ms.s+i,Ms.l+s)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,i){return this.r=e.r+i.r,this.g=e.g+i.g,this.b=e.b+i.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,i){return this.r+=(e.r-this.r)*i,this.g+=(e.g-this.g)*i,this.b+=(e.b-this.b)*i,this}lerpColors(e,i,s){return this.r=e.r+(i.r-e.r)*s,this.g=e.g+(i.g-e.g)*s,this.b=e.b+(i.b-e.b)*s,this}lerpHSL(e,i){this.getHSL(Ms),e.getHSL(uu);const s=Id(Ms.h,uu.h,i),l=Id(Ms.s,uu.s,i),f=Id(Ms.l,uu.l,i);return this.setHSL(s,l,f),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){const i=this.r,s=this.g,l=this.b,f=e.elements;return this.r=f[0]*i+f[3]*s+f[6]*l,this.g=f[1]*i+f[4]*s+f[7]*l,this.b=f[2]*i+f[5]*s+f[8]*l,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,i=0){return this.r=e[i],this.g=e[i+1],this.b=e[i+2],this}toArray(e=[],i=0){return e[i]=this.r,e[i+1]=this.g,e[i+2]=this.b,e}fromBufferAttribute(e,i){return this.r=e.getX(i),this.g=e.getY(i),this.b=e.getZ(i),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}}const Vn=new Me;Me.NAMES=SS;class gm{constructor(e,i=1,s=1e3){this.isFog=!0,this.name="",this.color=new Me(e),this.near=i,this.far=s}clone(){return new gm(this.color,this.near,this.far)}toJSON(){return{type:"Fog",name:this.name,color:this.color.getHex(),near:this.near,far:this.far}}}class Ub extends Un{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new ws,this.environmentIntensity=1,this.environmentRotation=new ws,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(e,i){return super.copy(e,i),e.background!==null&&(this.background=e.background.clone()),e.environment!==null&&(this.environment=e.environment.clone()),e.fog!==null&&(this.fog=e.fog.clone()),this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,this.backgroundRotation.copy(e.backgroundRotation),this.environmentIntensity=e.environmentIntensity,this.environmentRotation.copy(e.environmentRotation),e.overrideMaterial!==null&&(this.overrideMaterial=e.overrideMaterial.clone()),this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){const i=super.toJSON(e);return this.fog!==null&&(i.object.fog=this.fog.toJSON()),i.object.backgroundBlurriness=this.backgroundBlurriness,i.object.backgroundIntensity=this.backgroundIntensity,i.object.backgroundRotation=this.backgroundRotation.toArray(),i.object.environmentIntensity=this.environmentIntensity,i.object.environmentRotation=this.environmentRotation.toArray(),i}}const Yi=new nt,za=new nt,Xd=new nt,Ba=new nt,eo=new nt,no=new nt,ux=new nt,Wd=new nt,qd=new nt,Yd=new nt,jd=new ln,Zd=new ln,Kd=new ln;class zi{constructor(e=new nt,i=new nt,s=new nt){this.a=e,this.b=i,this.c=s}static getNormal(e,i,s,l){l.subVectors(s,i),Yi.subVectors(e,i),l.cross(Yi);const f=l.lengthSq();return f>0?l.multiplyScalar(1/Math.sqrt(f)):l.set(0,0,0)}static getBarycoord(e,i,s,l,f){Yi.subVectors(l,i),za.subVectors(s,i),Xd.subVectors(e,i);const h=Yi.dot(Yi),d=Yi.dot(za),m=Yi.dot(Xd),p=za.dot(za),S=za.dot(Xd),_=h*p-d*d;if(_===0)return f.set(0,0,0),null;const v=1/_,M=(p*m-d*S)*v,A=(h*S-d*m)*v;return f.set(1-M-A,A,M)}static containsPoint(e,i,s,l){return this.getBarycoord(e,i,s,l,Ba)===null?!1:Ba.x>=0&&Ba.y>=0&&Ba.x+Ba.y<=1}static getInterpolation(e,i,s,l,f,h,d,m){return this.getBarycoord(e,i,s,l,Ba)===null?(m.x=0,m.y=0,"z"in m&&(m.z=0),"w"in m&&(m.w=0),null):(m.setScalar(0),m.addScaledVector(f,Ba.x),m.addScaledVector(h,Ba.y),m.addScaledVector(d,Ba.z),m)}static getInterpolatedAttribute(e,i,s,l,f,h){return jd.setScalar(0),Zd.setScalar(0),Kd.setScalar(0),jd.fromBufferAttribute(e,i),Zd.fromBufferAttribute(e,s),Kd.fromBufferAttribute(e,l),h.setScalar(0),h.addScaledVector(jd,f.x),h.addScaledVector(Zd,f.y),h.addScaledVector(Kd,f.z),h}static isFrontFacing(e,i,s,l){return Yi.subVectors(s,i),za.subVectors(e,i),Yi.cross(za).dot(l)<0}set(e,i,s){return this.a.copy(e),this.b.copy(i),this.c.copy(s),this}setFromPointsAndIndices(e,i,s,l){return this.a.copy(e[i]),this.b.copy(e[s]),this.c.copy(e[l]),this}setFromAttributeAndIndices(e,i,s,l){return this.a.fromBufferAttribute(e,i),this.b.fromBufferAttribute(e,s),this.c.fromBufferAttribute(e,l),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return Yi.subVectors(this.c,this.b),za.subVectors(this.a,this.b),Yi.cross(za).length()*.5}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(e){return zi.getNormal(this.a,this.b,this.c,e)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(e,i){return zi.getBarycoord(e,this.a,this.b,this.c,i)}getInterpolation(e,i,s,l,f){return zi.getInterpolation(e,this.a,this.b,this.c,i,s,l,f)}containsPoint(e){return zi.containsPoint(e,this.a,this.b,this.c)}isFrontFacing(e){return zi.isFrontFacing(this.a,this.b,this.c,e)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,i){const s=this.a,l=this.b,f=this.c;let h,d;eo.subVectors(l,s),no.subVectors(f,s),Wd.subVectors(e,s);const m=eo.dot(Wd),p=no.dot(Wd);if(m<=0&&p<=0)return i.copy(s);qd.subVectors(e,l);const S=eo.dot(qd),_=no.dot(qd);if(S>=0&&_<=S)return i.copy(l);const v=m*_-S*p;if(v<=0&&m>=0&&S<=0)return h=m/(m-S),i.copy(s).addScaledVector(eo,h);Yd.subVectors(e,f);const M=eo.dot(Yd),A=no.dot(Yd);if(A>=0&&M<=A)return i.copy(f);const N=M*p-m*A;if(N<=0&&p>=0&&A<=0)return d=p/(p-A),i.copy(s).addScaledVector(no,d);const y=S*A-M*_;if(y<=0&&_-S>=0&&M-A>=0)return ux.subVectors(f,l),d=(_-S)/(_-S+(M-A)),i.copy(l).addScaledVector(ux,d);const x=1/(y+N+v);return h=N*x,d=v*x,i.copy(s).addScaledVector(eo,h).addScaledVector(no,d)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}}class zl{constructor(e=new nt(1/0,1/0,1/0),i=new nt(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=i}set(e,i){return this.min.copy(e),this.max.copy(i),this}setFromArray(e){this.makeEmpty();for(let i=0,s=e.length;i<s;i+=3)this.expandByPoint(ji.fromArray(e,i));return this}setFromBufferAttribute(e){this.makeEmpty();for(let i=0,s=e.count;i<s;i++)this.expandByPoint(ji.fromBufferAttribute(e,i));return this}setFromPoints(e){this.makeEmpty();for(let i=0,s=e.length;i<s;i++)this.expandByPoint(e[i]);return this}setFromCenterAndSize(e,i){const s=ji.copy(i).multiplyScalar(.5);return this.min.copy(e).sub(s),this.max.copy(e).add(s),this}setFromObject(e,i=!1){return this.makeEmpty(),this.expandByObject(e,i)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,i=!1){e.updateWorldMatrix(!1,!1);const s=e.geometry;if(s!==void 0){const f=s.getAttribute("position");if(i===!0&&f!==void 0&&e.isInstancedMesh!==!0)for(let h=0,d=f.count;h<d;h++)e.isMesh===!0?e.getVertexPosition(h,ji):ji.fromBufferAttribute(f,h),ji.applyMatrix4(e.matrixWorld),this.expandByPoint(ji);else e.boundingBox!==void 0?(e.boundingBox===null&&e.computeBoundingBox(),fu.copy(e.boundingBox)):(s.boundingBox===null&&s.computeBoundingBox(),fu.copy(s.boundingBox)),fu.applyMatrix4(e.matrixWorld),this.union(fu)}const l=e.children;for(let f=0,h=l.length;f<h;f++)this.expandByObject(l[f],i);return this}containsPoint(e){return e.x>=this.min.x&&e.x<=this.max.x&&e.y>=this.min.y&&e.y<=this.max.y&&e.z>=this.min.z&&e.z<=this.max.z}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,i){return i.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return e.max.x>=this.min.x&&e.min.x<=this.max.x&&e.max.y>=this.min.y&&e.min.y<=this.max.y&&e.max.z>=this.min.z&&e.min.z<=this.max.z}intersectsSphere(e){return this.clampPoint(e.center,ji),ji.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let i,s;return e.normal.x>0?(i=e.normal.x*this.min.x,s=e.normal.x*this.max.x):(i=e.normal.x*this.max.x,s=e.normal.x*this.min.x),e.normal.y>0?(i+=e.normal.y*this.min.y,s+=e.normal.y*this.max.y):(i+=e.normal.y*this.max.y,s+=e.normal.y*this.min.y),e.normal.z>0?(i+=e.normal.z*this.min.z,s+=e.normal.z*this.max.z):(i+=e.normal.z*this.max.z,s+=e.normal.z*this.min.z),i<=-e.constant&&s>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(Sl),hu.subVectors(this.max,Sl),io.subVectors(e.a,Sl),ao.subVectors(e.b,Sl),so.subVectors(e.c,Sl),Es.subVectors(ao,io),bs.subVectors(so,ao),$s.subVectors(io,so);let i=[0,-Es.z,Es.y,0,-bs.z,bs.y,0,-$s.z,$s.y,Es.z,0,-Es.x,bs.z,0,-bs.x,$s.z,0,-$s.x,-Es.y,Es.x,0,-bs.y,bs.x,0,-$s.y,$s.x,0];return!Qd(i,io,ao,so,hu)||(i=[1,0,0,0,1,0,0,0,1],!Qd(i,io,ao,so,hu))?!1:(du.crossVectors(Es,bs),i=[du.x,du.y,du.z],Qd(i,io,ao,so,hu))}clampPoint(e,i){return i.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,ji).distanceTo(e)}getBoundingSphere(e){return this.isEmpty()?e.makeEmpty():(this.getCenter(e.center),e.radius=this.getSize(ji).length()*.5),e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()?this:(Fa[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),Fa[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),Fa[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),Fa[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),Fa[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),Fa[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),Fa[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),Fa[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(Fa),this)}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(e){return this.min.fromArray(e.min),this.max.fromArray(e.max),this}}const Fa=[new nt,new nt,new nt,new nt,new nt,new nt,new nt,new nt],ji=new nt,fu=new zl,io=new nt,ao=new nt,so=new nt,Es=new nt,bs=new nt,$s=new nt,Sl=new nt,hu=new nt,du=new nt,tr=new nt;function Qd(o,e,i,s,l){for(let f=0,h=o.length-3;f<=h;f+=3){tr.fromArray(o,f);const d=l.x*Math.abs(tr.x)+l.y*Math.abs(tr.y)+l.z*Math.abs(tr.z),m=e.dot(tr),p=i.dot(tr),S=s.dot(tr);if(Math.max(-Math.max(m,p,S),Math.min(m,p,S))>d)return!1}return!0}const Mn=new nt,pu=new le;let Lb=0;class Wa extends Cs{constructor(e,i,s=!1){if(super(),Array.isArray(e))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:Lb++}),this.name="",this.array=e,this.itemSize=i,this.count=e!==void 0?e.length/i:0,this.normalized=s,this.usage=hb,this.updateRanges=[],this.gpuType=ma,this.version=0}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,i){this.updateRanges.push({start:e,count:i})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this.gpuType=e.gpuType,this}copyAt(e,i,s){e*=this.itemSize,s*=i.itemSize;for(let l=0,f=this.itemSize;l<f;l++)this.array[e+l]=i.array[s+l];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let i=0,s=this.count;i<s;i++)pu.fromBufferAttribute(this,i),pu.applyMatrix3(e),this.setXY(i,pu.x,pu.y);else if(this.itemSize===3)for(let i=0,s=this.count;i<s;i++)Mn.fromBufferAttribute(this,i),Mn.applyMatrix3(e),this.setXYZ(i,Mn.x,Mn.y,Mn.z);return this}applyMatrix4(e){for(let i=0,s=this.count;i<s;i++)Mn.fromBufferAttribute(this,i),Mn.applyMatrix4(e),this.setXYZ(i,Mn.x,Mn.y,Mn.z);return this}applyNormalMatrix(e){for(let i=0,s=this.count;i<s;i++)Mn.fromBufferAttribute(this,i),Mn.applyNormalMatrix(e),this.setXYZ(i,Mn.x,Mn.y,Mn.z);return this}transformDirection(e){for(let i=0,s=this.count;i<s;i++)Mn.fromBufferAttribute(this,i),Mn.transformDirection(e),this.setXYZ(i,Mn.x,Mn.y,Mn.z);return this}set(e,i=0){return this.array.set(e,i),this}getComponent(e,i){let s=this.array[e*this.itemSize+i];return this.normalized&&(s=vl(s,this.array)),s}setComponent(e,i,s){return this.normalized&&(s=ai(s,this.array)),this.array[e*this.itemSize+i]=s,this}getX(e){let i=this.array[e*this.itemSize];return this.normalized&&(i=vl(i,this.array)),i}setX(e,i){return this.normalized&&(i=ai(i,this.array)),this.array[e*this.itemSize]=i,this}getY(e){let i=this.array[e*this.itemSize+1];return this.normalized&&(i=vl(i,this.array)),i}setY(e,i){return this.normalized&&(i=ai(i,this.array)),this.array[e*this.itemSize+1]=i,this}getZ(e){let i=this.array[e*this.itemSize+2];return this.normalized&&(i=vl(i,this.array)),i}setZ(e,i){return this.normalized&&(i=ai(i,this.array)),this.array[e*this.itemSize+2]=i,this}getW(e){let i=this.array[e*this.itemSize+3];return this.normalized&&(i=vl(i,this.array)),i}setW(e,i){return this.normalized&&(i=ai(i,this.array)),this.array[e*this.itemSize+3]=i,this}setXY(e,i,s){return e*=this.itemSize,this.normalized&&(i=ai(i,this.array),s=ai(s,this.array)),this.array[e+0]=i,this.array[e+1]=s,this}setXYZ(e,i,s,l){return e*=this.itemSize,this.normalized&&(i=ai(i,this.array),s=ai(s,this.array),l=ai(l,this.array)),this.array[e+0]=i,this.array[e+1]=s,this.array[e+2]=l,this}setXYZW(e,i,s,l,f){return e*=this.itemSize,this.normalized&&(i=ai(i,this.array),s=ai(s,this.array),l=ai(l,this.array),f=ai(f,this.array)),this.array[e+0]=i,this.array[e+1]=s,this.array[e+2]=l,this.array[e+3]=f,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){const e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return e.name=this.name,e.usage=this.usage,e.gpuType=this.gpuType,e}dispose(){this.dispatchEvent({type:"dispose"})}}class yS extends Wa{constructor(e,i,s){super(new Uint16Array(e),i,s)}}class MS extends Wa{constructor(e,i,s){super(new Uint32Array(e),i,s)}}class un extends Wa{constructor(e,i,s){super(new Float32Array(e),i,s)}}const Ob=new zl,yl=new nt,Jd=new nt;class Ku{constructor(e=new nt,i=-1){this.isSphere=!0,this.center=e,this.radius=i}set(e,i){return this.center.copy(e),this.radius=i,this}setFromPoints(e,i){const s=this.center;i!==void 0?s.copy(i):Ob.setFromPoints(e).getCenter(s);let l=0;for(let f=0,h=e.length;f<h;f++)l=Math.max(l,s.distanceToSquared(e[f]));return this.radius=Math.sqrt(l),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){const i=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=i*i}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,i){const s=this.center.distanceToSquared(e);return i.copy(e),s>this.radius*this.radius&&(i.sub(this.center).normalize(),i.multiplyScalar(this.radius).add(this.center)),i}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius=this.radius*e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;yl.subVectors(e,this.center);const i=yl.lengthSq();if(i>this.radius*this.radius){const s=Math.sqrt(i),l=(s-this.radius)*.5;this.center.addScaledVector(yl,l/s),this.radius+=l}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(Jd.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(yl.copy(e.center).add(Jd)),this.expandByPoint(yl.copy(e.center).sub(Jd))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return{radius:this.radius,center:this.center.toArray()}}fromJSON(e){return this.radius=e.radius,this.center.fromArray(e.center),this}}let Pb=0;const Oi=new cn,$d=new Un,ro=new nt,vi=new zl,Ml=new zl,Dn=new nt;class Jn extends Cs{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:Pb++}),this.uuid=Il(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.indirectOffset=0,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={},this._transformed=!1}getIndex(){return this.index}setIndex(e){return Array.isArray(e)?this.index=new(db(e)?MS:yS)(e,1):this.index=e,this}setIndirect(e,i=0){return this.indirect=e,this.indirectOffset=i,this}getIndirect(){return this.indirect}getAttribute(e){return this.attributes[e]}setAttribute(e,i){return this.attributes[e]=i,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,i,s=0){this.groups.push({start:e,count:i,materialIndex:s})}clearGroups(){this.groups=[]}setDrawRange(e,i){this.drawRange.start=e,this.drawRange.count=i}applyMatrix4(e){const i=this.attributes.position;i!==void 0&&(i.applyMatrix4(e),i.needsUpdate=!0);const s=this.attributes.normal;if(s!==void 0){const f=new de().getNormalMatrix(e);s.applyNormalMatrix(f),s.needsUpdate=!0}const l=this.attributes.tangent;return l!==void 0&&(l.transformDirection(e),l.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this._transformed=!0,this}applyQuaternion(e){return Oi.makeRotationFromQuaternion(e),this.applyMatrix4(Oi),this}rotateX(e){return Oi.makeRotationX(e),this.applyMatrix4(Oi),this}rotateY(e){return Oi.makeRotationY(e),this.applyMatrix4(Oi),this}rotateZ(e){return Oi.makeRotationZ(e),this.applyMatrix4(Oi),this}translate(e,i,s){return Oi.makeTranslation(e,i,s),this.applyMatrix4(Oi),this}scale(e,i,s){return Oi.makeScale(e,i,s),this.applyMatrix4(Oi),this}lookAt(e){return $d.lookAt(e),$d.updateMatrix(),this.applyMatrix4($d.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(ro).negate(),this.translate(ro.x,ro.y,ro.z),this}setFromPoints(e){const i=this.getAttribute("position");if(i===void 0){const s=[];for(let l=0,f=e.length;l<f;l++){const h=e[l];s.push(h.x,h.y,h.z||0)}this.setAttribute("position",new un(s,3))}else{const s=Math.min(e.length,i.count);for(let l=0;l<s;l++){const f=e[l];i.setXYZ(l,f.x,f.y,f.z||0)}e.length>i.count&&oe("BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),i.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new zl);const e=this.attributes.position,i=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){Fe("BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new nt(-1/0,-1/0,-1/0),new nt(1/0,1/0,1/0));return}if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),i)for(let s=0,l=i.length;s<l;s++){const f=i[s];vi.setFromBufferAttribute(f),this.morphTargetsRelative?(Dn.addVectors(this.boundingBox.min,vi.min),this.boundingBox.expandByPoint(Dn),Dn.addVectors(this.boundingBox.max,vi.max),this.boundingBox.expandByPoint(Dn)):(this.boundingBox.expandByPoint(vi.min),this.boundingBox.expandByPoint(vi.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&Fe('BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new Ku);const e=this.attributes.position,i=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){Fe("BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new nt,1/0);return}if(e){const s=this.boundingSphere.center;if(vi.setFromBufferAttribute(e),i)for(let f=0,h=i.length;f<h;f++){const d=i[f];Ml.setFromBufferAttribute(d),this.morphTargetsRelative?(Dn.addVectors(vi.min,Ml.min),vi.expandByPoint(Dn),Dn.addVectors(vi.max,Ml.max),vi.expandByPoint(Dn)):(vi.expandByPoint(Ml.min),vi.expandByPoint(Ml.max))}vi.getCenter(s);let l=0;for(let f=0,h=e.count;f<h;f++)Dn.fromBufferAttribute(e,f),l=Math.max(l,s.distanceToSquared(Dn));if(i)for(let f=0,h=i.length;f<h;f++){const d=i[f],m=this.morphTargetsRelative;for(let p=0,S=d.count;p<S;p++)Dn.fromBufferAttribute(d,p),m&&(ro.fromBufferAttribute(e,p),Dn.add(ro)),l=Math.max(l,s.distanceToSquared(Dn))}this.boundingSphere.radius=Math.sqrt(l),isNaN(this.boundingSphere.radius)&&Fe('BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){const e=this.index,i=this.attributes;if(e===null||i.position===void 0||i.normal===void 0||i.uv===void 0){Fe("BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}const s=i.position,l=i.normal,f=i.uv;let h=this.getAttribute("tangent");(h===void 0||h.count!==s.count)&&(h=new Wa(new Float32Array(4*s.count),4),this.setAttribute("tangent",h));const d=[],m=[];for(let T=0;T<s.count;T++)d[T]=new nt,m[T]=new nt;const p=new nt,S=new nt,_=new nt,v=new le,M=new le,A=new le,N=new nt,y=new nt;function x(T,O,G){p.fromBufferAttribute(s,T),S.fromBufferAttribute(s,O),_.fromBufferAttribute(s,G),v.fromBufferAttribute(f,T),M.fromBufferAttribute(f,O),A.fromBufferAttribute(f,G),S.sub(p),_.sub(p),M.sub(v),A.sub(v);const k=1/(M.x*A.y-A.x*M.y);isFinite(k)&&(N.copy(S).multiplyScalar(A.y).addScaledVector(_,-M.y).multiplyScalar(k),y.copy(_).multiplyScalar(M.x).addScaledVector(S,-A.x).multiplyScalar(k),d[T].add(N),d[O].add(N),d[G].add(N),m[T].add(y),m[O].add(y),m[G].add(y))}let U=this.groups;U.length===0&&(U=[{start:0,count:e.count}]);for(let T=0,O=U.length;T<O;++T){const G=U[T],k=G.start,Q=G.count;for(let st=k,Y=k+Q;st<Y;st+=3)x(e.getX(st+0),e.getX(st+1),e.getX(st+2))}const F=new nt,C=new nt,D=new nt,L=new nt;function I(T){D.fromBufferAttribute(l,T),L.copy(D);const O=d[T];F.copy(O),F.sub(D.multiplyScalar(D.dot(O))).normalize(),C.crossVectors(L,O);const k=C.dot(m[T])<0?-1:1;h.setXYZW(T,F.x,F.y,F.z,k)}for(let T=0,O=U.length;T<O;++T){const G=U[T],k=G.start,Q=G.count;for(let st=k,Y=k+Q;st<Y;st+=3)I(e.getX(st+0)),I(e.getX(st+1)),I(e.getX(st+2))}this._transformed=!0}computeVertexNormals(){const e=this.index,i=this.getAttribute("position");if(i!==void 0){let s=this.getAttribute("normal");if(s===void 0||s.count!==i.count)s=new Wa(new Float32Array(i.count*3),3),this.setAttribute("normal",s);else for(let v=0,M=s.count;v<M;v++)s.setXYZ(v,0,0,0);const l=new nt,f=new nt,h=new nt,d=new nt,m=new nt,p=new nt,S=new nt,_=new nt;if(e)for(let v=0,M=e.count;v<M;v+=3){const A=e.getX(v+0),N=e.getX(v+1),y=e.getX(v+2);l.fromBufferAttribute(i,A),f.fromBufferAttribute(i,N),h.fromBufferAttribute(i,y),S.subVectors(h,f),_.subVectors(l,f),S.cross(_),d.fromBufferAttribute(s,A),m.fromBufferAttribute(s,N),p.fromBufferAttribute(s,y),d.add(S),m.add(S),p.add(S),s.setXYZ(A,d.x,d.y,d.z),s.setXYZ(N,m.x,m.y,m.z),s.setXYZ(y,p.x,p.y,p.z)}else for(let v=0,M=i.count;v<M;v+=3)l.fromBufferAttribute(i,v+0),f.fromBufferAttribute(i,v+1),h.fromBufferAttribute(i,v+2),S.subVectors(h,f),_.subVectors(l,f),S.cross(_),s.setXYZ(v+0,S.x,S.y,S.z),s.setXYZ(v+1,S.x,S.y,S.z),s.setXYZ(v+2,S.x,S.y,S.z);this.normalizeNormals(),s.needsUpdate=!0}}normalizeNormals(){const e=this.attributes.normal;for(let i=0,s=e.count;i<s;i++)Dn.fromBufferAttribute(e,i),Dn.normalize(),e.setXYZ(i,Dn.x,Dn.y,Dn.z)}toNonIndexed(){function e(d,m){const p=d.array,S=d.itemSize,_=d.normalized,v=new p.constructor(m.length*S);let M=0,A=0;for(let N=0,y=m.length;N<y;N++){d.isInterleavedBufferAttribute?M=m[N]*d.data.stride+d.offset:M=m[N]*S;for(let x=0;x<S;x++)v[A++]=p[M++]}return new Wa(v,S,_)}if(this.index===null)return oe("BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;const i=new Jn,s=this.index.array,l=this.attributes;for(const d in l){const m=l[d],p=e(m,s);i.setAttribute(d,p)}const f=this.morphAttributes;for(const d in f){const m=[],p=f[d];for(let S=0,_=p.length;S<_;S++){const v=p[S],M=e(v,s);m.push(M)}i.morphAttributes[d]=m}i.morphTargetsRelative=this.morphTargetsRelative;const h=this.groups;for(let d=0,m=h.length;d<m;d++){const p=h[d];i.addGroup(p.start,p.count,p.materialIndex)}return i}toJSON(){const e={metadata:{version:4.7,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(e.uuid=this.uuid,e.type=this.parameters!==void 0&&this._transformed===!0?"BufferGeometry":this.type,e.name=this.name,Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0&&this._transformed!==!0){const m=this.parameters;for(const p in m)m[p]!==void 0&&(e[p]=m[p]);return e}e.data={attributes:{}};const i=this.index;i!==null&&(e.data.index={type:i.array.constructor.name,array:Array.prototype.slice.call(i.array)});const s=this.attributes;for(const m in s){const p=s[m];e.data.attributes[m]=p.toJSON(e.data)}const l={};let f=!1;for(const m in this.morphAttributes){const p=this.morphAttributes[m],S=[];for(let _=0,v=p.length;_<v;_++){const M=p[_];S.push(M.toJSON(e.data))}S.length>0&&(l[m]=S,f=!0)}f&&(e.data.morphAttributes=l,e.data.morphTargetsRelative=this.morphTargetsRelative);const h=this.groups;h.length>0&&(e.data.groups=JSON.parse(JSON.stringify(h)));const d=this.boundingSphere;return d!==null&&(e.data.boundingSphere=d.toJSON()),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;const i={};this.name=e.name;const s=e.index;s!==null&&this.setIndex(s.clone());const l=e.attributes;for(const p in l){const S=l[p];this.setAttribute(p,S.clone(i))}const f=e.morphAttributes;for(const p in f){const S=[],_=f[p];for(let v=0,M=_.length;v<M;v++)S.push(_[v].clone(i));this.morphAttributes[p]=S}this.morphTargetsRelative=e.morphTargetsRelative;const h=e.groups;for(let p=0,S=h.length;p<S;p++){const _=h[p];this.addGroup(_.start,_.count,_.materialIndex)}const d=e.boundingBox;d!==null&&(this.boundingBox=d.clone());const m=e.boundingSphere;return m!==null&&(this.boundingSphere=m.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,this._transformed=e._transformed,this}dispose(){this.dispatchEvent({type:"dispose"})}}const tp=new nt,Ib=new nt,zb=new de;class Ga{constructor(e=new nt(1,0,0),i=0){this.isPlane=!0,this.normal=e,this.constant=i}set(e,i){return this.normal.copy(e),this.constant=i,this}setComponents(e,i,s,l){return this.normal.set(e,i,s),this.constant=l,this}setFromNormalAndCoplanarPoint(e,i){return this.normal.copy(e),this.constant=-i.dot(this.normal),this}setFromCoplanarPoints(e,i,s){const l=tp.subVectors(s,i).cross(Ib.subVectors(e,i)).normalize();return this.setFromNormalAndCoplanarPoint(l,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){const e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,i){return i.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,i,s=!0){const l=e.delta(tp),f=this.normal.dot(l);if(f===0)return this.distanceToPoint(e.start)===0?i.copy(e.start):null;const h=-(e.start.dot(this.normal)+this.constant)/f;return s===!0&&(h<0||h>1)?null:i.copy(e.start).addScaledVector(l,h)}intersectsLine(e){const i=this.distanceToPoint(e.start),s=this.distanceToPoint(e.end);return i<0&&s>0||s<0&&i>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,i){const s=i||zb.getNormalMatrix(e),l=this.coplanarPoint(tp).applyMatrix4(e),f=this.normal.applyMatrix3(s).normalize();return this.constant=-l.dot(f),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}toJSON(){return{normal:this.normal.toArray(),constant:this.constant}}fromJSON(e){return this.normal.fromArray(e.normal),this.constant=e.constant,this}}let Bb=0;class So extends Cs{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:Bb++}),this.uuid=Il(),this.name="",this.type="Material",this.blending=Cl,this.side=rr,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=$x,this.blendDst=tS,this.blendEquation=uo,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new Me(0,0,0),this.blendAlpha=0,this.depthFunc=Dl,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=sb,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=Pd,this.stencilZFail=Pd,this.stencilZPass=Pd,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(const i in e){const s=e[i];if(s===void 0){oe(`Material: parameter '${i}' has value of undefined.`);continue}const l=this[i];if(l===void 0){oe(`Material: '${i}' is not a property of THREE.${this.type}.`);continue}l&&l.isColor?l.set(s):l&&l.isVector2&&s&&s.isVector2||l&&l.isEuler&&s&&s.isEuler||l&&l.isVector3&&s&&s.isVector3?l.copy(s):this[i]=s}}toJSON(e){const i=e===void 0||typeof e=="string";i&&(e={textures:{},images:{}});const s={metadata:{version:4.7,type:"Material",generator:"Material.toJSON"}};s.uuid=this.uuid,s.type=this.type,s.blending=this.blending,s.side=this.side,s.shadowSide=this.shadowSide,s.vertexColors=this.vertexColors,s.opacity=this.opacity,s.transparent=this.transparent,s.blendSrc=this.blendSrc,s.blendDst=this.blendDst,s.blendEquation=this.blendEquation,s.blendSrcAlpha=this.blendSrcAlpha,s.blendDstAlpha=this.blendDstAlpha,s.blendEquationAlpha=this.blendEquationAlpha,s.blendColor=this.blendColor.getHex(),s.blendAlpha=this.blendAlpha,s.depthFunc=this.depthFunc,s.depthTest=this.depthTest,s.depthWrite=this.depthWrite,s.colorWrite=this.colorWrite,s.clipIntersection=this.clipIntersection,s.clipShadows=this.clipShadows,s.stencilWriteMask=this.stencilWriteMask,s.stencilFunc=this.stencilFunc,s.stencilRef=this.stencilRef,s.stencilFuncMask=this.stencilFuncMask,s.stencilFail=this.stencilFail,s.stencilZFail=this.stencilZFail,s.stencilZPass=this.stencilZPass,s.stencilWrite=this.stencilWrite,s.polygonOffset=this.polygonOffset,s.polygonOffsetFactor=this.polygonOffsetFactor,s.polygonOffsetUnits=this.polygonOffsetUnits,s.dithering=this.dithering,s.alphaTest=this.alphaTest,s.alphaHash=this.alphaHash,s.alphaToCoverage=this.alphaToCoverage,s.premultipliedAlpha=this.premultipliedAlpha,s.forceSinglePass=this.forceSinglePass,s.allowOverride=this.allowOverride,s.visible=this.visible,s.toneMapped=this.toneMapped,s.name=this.name,this.color&&this.color.isColor&&(s.color=this.color.getHex()),this.roughness!==void 0&&(s.roughness=this.roughness),this.metalness!==void 0&&(s.metalness=this.metalness),this.sheen!==void 0&&(s.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(s.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(s.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(s.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&(s.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(s.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(s.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(s.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(s.shininess=this.shininess),this.clearcoat!==void 0&&(s.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(s.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(s.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(s.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(s.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,s.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.sheenColorMap&&this.sheenColorMap.isTexture&&(s.sheenColorMap=this.sheenColorMap.toJSON(e).uuid),this.sheenRoughnessMap&&this.sheenRoughnessMap.isTexture&&(s.sheenRoughnessMap=this.sheenRoughnessMap.toJSON(e).uuid),this.dispersion!==void 0&&(s.dispersion=this.dispersion),this.retroreflectivity!==void 0&&(s.retroreflectivity=this.retroreflectivity),this.iridescence!==void 0&&(s.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(s.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(s.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(s.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(s.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.anisotropy!==void 0&&(s.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(s.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(s.anisotropyMap=this.anisotropyMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(s.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(s.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(s.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(s.lightMap=this.lightMap.toJSON(e).uuid,s.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(s.aoMap=this.aoMap.toJSON(e).uuid,s.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(s.bumpMap=this.bumpMap.toJSON(e).uuid,s.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(s.normalMap=this.normalMap.toJSON(e).uuid,s.normalMapType=this.normalMapType,s.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(s.displacementMap=this.displacementMap.toJSON(e).uuid,s.displacementScale=this.displacementScale,s.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(s.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(s.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(s.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(s.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(s.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(s.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(s.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(s.combine=this.combine)),this.envMapRotation!==void 0&&(s.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(s.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(s.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(s.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(s.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(s.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(s.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(s.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(s.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&(s.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(s.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(s.size=this.size),this.sizeAttenuation!==void 0&&(s.sizeAttenuation=this.sizeAttenuation),Array.isArray(this.clippingPlanes)&&this.clippingPlanes.length>0&&(s.clippingPlanes=this.clippingPlanes.map(f=>f.toJSON())),this.rotation!==void 0&&(s.rotation=this.rotation),this.depthPacking!==void 0&&(s.depthPacking=this.depthPacking),this.linewidth!==void 0&&(s.linewidth=this.linewidth),this.linecap!==void 0&&(s.linecap=this.linecap),this.linejoin!==void 0&&(s.linejoin=this.linejoin),this.dashSize!==void 0&&(s.dashSize=this.dashSize),this.gapSize!==void 0&&(s.gapSize=this.gapSize),this.scale!==void 0&&(s.scale=this.scale),this.wireframe!==void 0&&(s.wireframe=this.wireframe),this.wireframeLinewidth!==void 0&&(s.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!==void 0&&(s.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!==void 0&&(s.wireframeLinejoin=this.wireframeLinejoin),this.flatShading!==void 0&&(s.flatShading=this.flatShading),this.fog!==void 0&&(s.fog=this.fog),Object.keys(this.userData).length>0&&(s.userData=this.userData);function l(f){const h=[];for(const d in f){const m=f[d];delete m.metadata,h.push(m)}return h}if(i){const f=l(e.textures),h=l(e.images);f.length>0&&(s.textures=f),h.length>0&&(s.images=h)}return s}fromJSON(e,i){if(e.uuid!==void 0&&(this.uuid=e.uuid),e.name!==void 0&&(this.name=e.name),e.color!==void 0&&this.color!==void 0&&this.color.setHex(e.color),e.roughness!==void 0&&(this.roughness=e.roughness),e.metalness!==void 0&&(this.metalness=e.metalness),e.sheen!==void 0&&(this.sheen=e.sheen),e.sheenColor!==void 0&&(this.sheenColor=new Me().setHex(e.sheenColor)),e.sheenRoughness!==void 0&&(this.sheenRoughness=e.sheenRoughness),e.emissive!==void 0&&this.emissive!==void 0&&this.emissive.setHex(e.emissive),e.specular!==void 0&&this.specular!==void 0&&this.specular.setHex(e.specular),e.specularIntensity!==void 0&&(this.specularIntensity=e.specularIntensity),e.specularColor!==void 0&&this.specularColor!==void 0&&this.specularColor.setHex(e.specularColor),e.shininess!==void 0&&(this.shininess=e.shininess),e.clearcoat!==void 0&&(this.clearcoat=e.clearcoat),e.clearcoatRoughness!==void 0&&(this.clearcoatRoughness=e.clearcoatRoughness),e.dispersion!==void 0&&(this.dispersion=e.dispersion),e.retroreflectivity!==void 0&&(this.retroreflectivity=e.retroreflectivity),e.iridescence!==void 0&&(this.iridescence=e.iridescence),e.iridescenceIOR!==void 0&&(this.iridescenceIOR=e.iridescenceIOR),e.iridescenceThicknessRange!==void 0&&(this.iridescenceThicknessRange=e.iridescenceThicknessRange),e.transmission!==void 0&&(this.transmission=e.transmission),e.thickness!==void 0&&(this.thickness=e.thickness),e.attenuationDistance!==void 0&&(this.attenuationDistance=e.attenuationDistance),e.attenuationColor!==void 0&&this.attenuationColor!==void 0&&this.attenuationColor.setHex(e.attenuationColor),e.anisotropy!==void 0&&(this.anisotropy=e.anisotropy),e.anisotropyRotation!==void 0&&(this.anisotropyRotation=e.anisotropyRotation),e.fog!==void 0&&(this.fog=e.fog),e.flatShading!==void 0&&(this.flatShading=e.flatShading),e.blending!==void 0&&(this.blending=e.blending),e.combine!==void 0&&(this.combine=e.combine),e.side!==void 0&&(this.side=e.side),e.shadowSide!==void 0&&(this.shadowSide=e.shadowSide),e.opacity!==void 0&&(this.opacity=e.opacity),e.transparent!==void 0&&(this.transparent=e.transparent),e.alphaTest!==void 0&&(this.alphaTest=e.alphaTest),e.alphaHash!==void 0&&(this.alphaHash=e.alphaHash),e.depthFunc!==void 0&&(this.depthFunc=e.depthFunc),e.depthTest!==void 0&&(this.depthTest=e.depthTest),e.depthWrite!==void 0&&(this.depthWrite=e.depthWrite),e.colorWrite!==void 0&&(this.colorWrite=e.colorWrite),e.clippingPlanes!==void 0&&(this.clippingPlanes=e.clippingPlanes.map(s=>new Ga().fromJSON(s))),e.clipIntersection!==void 0&&(this.clipIntersection=e.clipIntersection),e.clipShadows!==void 0&&(this.clipShadows=e.clipShadows),e.depthPacking!==void 0&&(this.depthPacking=e.depthPacking),e.blendSrc!==void 0&&(this.blendSrc=e.blendSrc),e.blendDst!==void 0&&(this.blendDst=e.blendDst),e.blendEquation!==void 0&&(this.blendEquation=e.blendEquation),e.blendSrcAlpha!==void 0&&(this.blendSrcAlpha=e.blendSrcAlpha),e.blendDstAlpha!==void 0&&(this.blendDstAlpha=e.blendDstAlpha),e.blendEquationAlpha!==void 0&&(this.blendEquationAlpha=e.blendEquationAlpha),e.blendColor!==void 0&&this.blendColor!==void 0&&this.blendColor.setHex(e.blendColor),e.blendAlpha!==void 0&&(this.blendAlpha=e.blendAlpha),e.stencilWriteMask!==void 0&&(this.stencilWriteMask=e.stencilWriteMask),e.stencilFunc!==void 0&&(this.stencilFunc=e.stencilFunc),e.stencilRef!==void 0&&(this.stencilRef=e.stencilRef),e.stencilFuncMask!==void 0&&(this.stencilFuncMask=e.stencilFuncMask),e.stencilFail!==void 0&&(this.stencilFail=e.stencilFail),e.stencilZFail!==void 0&&(this.stencilZFail=e.stencilZFail),e.stencilZPass!==void 0&&(this.stencilZPass=e.stencilZPass),e.stencilWrite!==void 0&&(this.stencilWrite=e.stencilWrite),e.wireframe!==void 0&&(this.wireframe=e.wireframe),e.wireframeLinewidth!==void 0&&(this.wireframeLinewidth=e.wireframeLinewidth),e.wireframeLinecap!==void 0&&(this.wireframeLinecap=e.wireframeLinecap),e.wireframeLinejoin!==void 0&&(this.wireframeLinejoin=e.wireframeLinejoin),e.rotation!==void 0&&(this.rotation=e.rotation),e.linewidth!==void 0&&(this.linewidth=e.linewidth),e.linecap!==void 0&&(this.linecap=e.linecap),e.linejoin!==void 0&&(this.linejoin=e.linejoin),e.dashSize!==void 0&&(this.dashSize=e.dashSize),e.gapSize!==void 0&&(this.gapSize=e.gapSize),e.scale!==void 0&&(this.scale=e.scale),e.polygonOffset!==void 0&&(this.polygonOffset=e.polygonOffset),e.polygonOffsetFactor!==void 0&&(this.polygonOffsetFactor=e.polygonOffsetFactor),e.polygonOffsetUnits!==void 0&&(this.polygonOffsetUnits=e.polygonOffsetUnits),e.dithering!==void 0&&(this.dithering=e.dithering),e.alphaToCoverage!==void 0&&(this.alphaToCoverage=e.alphaToCoverage),e.premultipliedAlpha!==void 0&&(this.premultipliedAlpha=e.premultipliedAlpha),e.forceSinglePass!==void 0&&(this.forceSinglePass=e.forceSinglePass),e.allowOverride!==void 0&&(this.allowOverride=e.allowOverride),e.visible!==void 0&&(this.visible=e.visible),e.toneMapped!==void 0&&(this.toneMapped=e.toneMapped),e.userData!==void 0&&(this.userData=e.userData),e.vertexColors!==void 0&&(typeof e.vertexColors=="number"?this.vertexColors=e.vertexColors>0:this.vertexColors=e.vertexColors),e.size!==void 0&&(this.size=e.size),e.sizeAttenuation!==void 0&&(this.sizeAttenuation=e.sizeAttenuation),e.map!==void 0&&(this.map=i[e.map]||null),e.matcap!==void 0&&(this.matcap=i[e.matcap]||null),e.alphaMap!==void 0&&(this.alphaMap=i[e.alphaMap]||null),e.bumpMap!==void 0&&(this.bumpMap=i[e.bumpMap]||null),e.bumpScale!==void 0&&(this.bumpScale=e.bumpScale),e.normalMap!==void 0&&(this.normalMap=i[e.normalMap]||null),e.normalMapType!==void 0&&(this.normalMapType=e.normalMapType),e.normalScale!==void 0){let s=e.normalScale;Array.isArray(s)===!1&&(s=[s,s]),this.normalScale=new le().fromArray(s)}return e.displacementMap!==void 0&&(this.displacementMap=i[e.displacementMap]||null),e.displacementScale!==void 0&&(this.displacementScale=e.displacementScale),e.displacementBias!==void 0&&(this.displacementBias=e.displacementBias),e.roughnessMap!==void 0&&(this.roughnessMap=i[e.roughnessMap]||null),e.metalnessMap!==void 0&&(this.metalnessMap=i[e.metalnessMap]||null),e.emissiveMap!==void 0&&(this.emissiveMap=i[e.emissiveMap]||null),e.emissiveIntensity!==void 0&&(this.emissiveIntensity=e.emissiveIntensity),e.specularMap!==void 0&&(this.specularMap=i[e.specularMap]||null),e.specularIntensityMap!==void 0&&(this.specularIntensityMap=i[e.specularIntensityMap]||null),e.specularColorMap!==void 0&&(this.specularColorMap=i[e.specularColorMap]||null),e.envMap!==void 0&&(this.envMap=i[e.envMap]||null),e.envMapRotation!==void 0&&this.envMapRotation.fromArray(e.envMapRotation),e.envMapIntensity!==void 0&&(this.envMapIntensity=e.envMapIntensity),e.reflectivity!==void 0&&(this.reflectivity=e.reflectivity),e.refractionRatio!==void 0&&(this.refractionRatio=e.refractionRatio),e.lightMap!==void 0&&(this.lightMap=i[e.lightMap]||null),e.lightMapIntensity!==void 0&&(this.lightMapIntensity=e.lightMapIntensity),e.aoMap!==void 0&&(this.aoMap=i[e.aoMap]||null),e.aoMapIntensity!==void 0&&(this.aoMapIntensity=e.aoMapIntensity),e.gradientMap!==void 0&&(this.gradientMap=i[e.gradientMap]||null),e.clearcoatMap!==void 0&&(this.clearcoatMap=i[e.clearcoatMap]||null),e.clearcoatRoughnessMap!==void 0&&(this.clearcoatRoughnessMap=i[e.clearcoatRoughnessMap]||null),e.clearcoatNormalMap!==void 0&&(this.clearcoatNormalMap=i[e.clearcoatNormalMap]||null),e.clearcoatNormalScale!==void 0&&(this.clearcoatNormalScale=new le().fromArray(e.clearcoatNormalScale)),e.iridescenceMap!==void 0&&(this.iridescenceMap=i[e.iridescenceMap]||null),e.iridescenceThicknessMap!==void 0&&(this.iridescenceThicknessMap=i[e.iridescenceThicknessMap]||null),e.transmissionMap!==void 0&&(this.transmissionMap=i[e.transmissionMap]||null),e.thicknessMap!==void 0&&(this.thicknessMap=i[e.thicknessMap]||null),e.anisotropyMap!==void 0&&(this.anisotropyMap=i[e.anisotropyMap]||null),e.sheenColorMap!==void 0&&(this.sheenColorMap=i[e.sheenColorMap]||null),e.sheenRoughnessMap!==void 0&&(this.sheenRoughnessMap=i[e.sheenRoughnessMap]||null),this}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.blendColor.copy(e.blendColor),this.blendAlpha=e.blendAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;const i=e.clippingPlanes;let s=null;if(i!==null){const l=i.length;s=new Array(l);for(let f=0;f!==l;++f)s[f]=i[f].clone()}return this.clippingPlanes=s,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaHash=e.alphaHash,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.allowOverride=e.allowOverride,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(e){e===!0&&this.version++}}const Ha=new nt,ep=new nt,mu=new nt,gu=new nt;class _m{constructor(e=new nt,i=new nt(0,0,-1)){this.origin=e,this.direction=i}set(e,i){return this.origin.copy(e),this.direction.copy(i),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,i){return i.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,Ha)),this}closestPointToPoint(e,i){i.subVectors(e,this.origin);const s=i.dot(this.direction);return s<0?i.copy(this.origin):i.copy(this.origin).addScaledVector(this.direction,s)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){const i=Ha.subVectors(e,this.origin).dot(this.direction);return i<0?this.origin.distanceToSquared(e):(Ha.copy(this.origin).addScaledVector(this.direction,i),Ha.distanceToSquared(e))}distanceSqToSegment(e,i,s,l){ep.copy(e).add(i).multiplyScalar(.5),mu.copy(i).sub(e).normalize(),gu.copy(this.origin).sub(ep);const f=e.distanceTo(i)*.5,h=-this.direction.dot(mu),d=gu.dot(this.direction),m=-gu.dot(mu),p=gu.lengthSq(),S=Math.abs(1-h*h);let _,v,M,A;if(S>0)if(_=h*m-d,v=h*d-m,A=f*S,_>=0)if(v>=-A)if(v<=A){const N=1/S;_*=N,v*=N,M=_*(_+h*v+2*d)+v*(h*_+v+2*m)+p}else v=f,_=Math.max(0,-(h*v+d)),M=-_*_+v*(v+2*m)+p;else v=-f,_=Math.max(0,-(h*v+d)),M=-_*_+v*(v+2*m)+p;else v<=-A?(_=Math.max(0,-(-h*f+d)),v=_>0?-f:Math.min(Math.max(-f,-m),f),M=-_*_+v*(v+2*m)+p):v<=A?(_=0,v=Math.min(Math.max(-f,-m),f),M=v*(v+2*m)+p):(_=Math.max(0,-(h*f+d)),v=_>0?f:Math.min(Math.max(-f,-m),f),M=-_*_+v*(v+2*m)+p);else v=h>0?-f:f,_=Math.max(0,-(h*v+d)),M=-_*_+v*(v+2*m)+p;return s&&s.copy(this.origin).addScaledVector(this.direction,_),l&&l.copy(ep).addScaledVector(mu,v),M}intersectSphere(e,i){if(e.radius<0)return null;Ha.subVectors(e.center,this.origin);const s=Ha.dot(this.direction),l=Ha.dot(Ha)-s*s,f=e.radius*e.radius;if(l>f)return null;const h=Math.sqrt(f-l),d=s-h,m=s+h;return m<0?null:d<0?this.at(m,i):this.at(d,i)}intersectsSphere(e){return e.radius<0?!1:this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){const i=e.normal.dot(this.direction);if(i===0)return e.distanceToPoint(this.origin)===0?0:null;const s=-(this.origin.dot(e.normal)+e.constant)/i;return s>=0?s:null}intersectPlane(e,i){const s=this.distanceToPlane(e);return s===null?null:this.at(s,i)}intersectsPlane(e){const i=e.distanceToPoint(this.origin);return i===0||e.normal.dot(this.direction)*i<0}intersectBox(e,i){let s,l,f,h,d,m;const p=1/this.direction.x,S=1/this.direction.y,_=1/this.direction.z,v=this.origin;return p>=0?(s=(e.min.x-v.x)*p,l=(e.max.x-v.x)*p):(s=(e.max.x-v.x)*p,l=(e.min.x-v.x)*p),S>=0?(f=(e.min.y-v.y)*S,h=(e.max.y-v.y)*S):(f=(e.max.y-v.y)*S,h=(e.min.y-v.y)*S),s>h||f>l||((f>s||isNaN(s))&&(s=f),(h<l||isNaN(l))&&(l=h),_>=0?(d=(e.min.z-v.z)*_,m=(e.max.z-v.z)*_):(d=(e.max.z-v.z)*_,m=(e.min.z-v.z)*_),s>m||d>l)||((d>s||s!==s)&&(s=d),(m<l||l!==l)&&(l=m),l<0)?null:this.at(s>=0?s:l,i)}intersectsBox(e){return this.intersectBox(e,Ha)!==null}intersectTriangle(e,i,s,l,f){const h=this.origin,d=this.direction,m=d.x,p=d.y,S=d.z,_=e.x-h.x,v=e.y-h.y,M=e.z-h.z,A=i.x-h.x,N=i.y-h.y,y=i.z-h.z,x=s.x-h.x,U=s.y-h.y,F=s.z-h.z,C=Math.abs(m),D=Math.abs(p),L=Math.abs(S);let I,T,O,G,k,Q,st,Y,tt,q,j,dt;if(C>=D&&C>=L?(O=m,Q=_,tt=A,dt=x,m>=0?(I=p,T=S,G=v,k=M,st=N,Y=y,q=U,j=F):(I=S,T=p,G=M,k=v,st=y,Y=N,q=F,j=U)):D>=L?(O=p,Q=v,tt=N,dt=U,p>=0?(I=S,T=m,G=M,k=_,st=y,Y=A,q=F,j=x):(I=m,T=S,G=_,k=M,st=A,Y=y,q=x,j=F)):(O=S,Q=M,tt=y,dt=F,S>=0?(I=m,T=p,G=_,k=v,st=A,Y=N,q=x,j=U):(I=p,T=m,G=v,k=_,st=N,Y=A,q=U,j=x)),O===0)return null;const ut=I/O,rt=T/O,Tt=1/O,Gt=G-ut*Q,Ot=k-rt*Q,B=st-ut*tt,_t=Y-rt*tt,Dt=q-ut*dt,Z=j-rt*dt,ft=Dt*_t-Z*B,Ct=Gt*Z-Ot*Dt,Pt=B*Ot-_t*Gt;if(l){if(ft<0||Ct<0||Pt<0)return null}else if((ft<0||Ct<0||Pt<0)&&(ft>0||Ct>0||Pt>0))return null;const vt=ft+Ct+Pt;if(vt===0)return null;const Ut=Tt*(ft*Q+Ct*tt+Pt*dt);return(vt>0?Ut<0:Ut>0)?null:this.at(Ut/vt,f)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}}class vm extends So{constructor(e){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new Me(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new ws,this.combine=eS,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}}const fx=new cn,er=new _m,_u=new Ku,hx=new nt,vu=new nt,xu=new nt,Su=new nt,np=new nt,yu=new nt,dx=new nt,Mu=new nt;class ze extends Un{constructor(e=new Jn,i=new vm){super(),this.isMesh=!0,this.type="Mesh",this.geometry=e,this.material=i,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.count=1,this.updateMorphTargets()}copy(e,i){return super.copy(e,i),e.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=e.morphTargetInfluences.slice()),e.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary)),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}updateMorphTargets(){const i=this.geometry.morphAttributes,s=Object.keys(i);if(s.length>0){const l=i[s[0]];if(l!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let f=0,h=l.length;f<h;f++){const d=l[f].name||String(f);this.morphTargetInfluences.push(0),this.morphTargetDictionary[d]=f}}}}getVertexPosition(e,i){const s=this.geometry,l=s.attributes.position,f=s.morphAttributes.position,h=s.morphTargetsRelative;i.fromBufferAttribute(l,e);const d=this.morphTargetInfluences;if(f&&d){yu.set(0,0,0);for(let m=0,p=f.length;m<p;m++){const S=d[m],_=f[m];S!==0&&(np.fromBufferAttribute(_,e),h?yu.addScaledVector(np,S):yu.addScaledVector(np.sub(i),S))}i.add(yu)}return i}intersectsFrustum(e){return e.intersectsObject(this)}raycast(e,i){const s=this.geometry,l=this.material,f=this.matrixWorld;l!==void 0&&(s.boundingSphere===null&&s.computeBoundingSphere(),_u.copy(s.boundingSphere),_u.applyMatrix4(f),er.copy(e.ray).recast(e.near),!(_u.containsPoint(er.origin)===!1&&(er.intersectSphere(_u,hx)===null||er.origin.distanceToSquared(hx)>(e.far-e.near)**2))&&(fx.copy(f).invert(),er.copy(e.ray).applyMatrix4(fx),!(s.boundingBox!==null&&er.intersectsBox(s.boundingBox)===!1)&&this._computeIntersections(e,i,er)))}_computeIntersections(e,i,s){let l;const f=this.geometry,h=this.material,d=f.index,m=f.attributes.position,p=f.attributes.uv,S=f.attributes.uv1,_=f.attributes.normal,v=f.groups,M=f.drawRange;if(d!==null)if(Array.isArray(h))for(let A=0,N=v.length;A<N;A++){const y=v[A],x=h[y.materialIndex],U=Math.max(y.start,M.start),F=Math.min(d.count,Math.min(y.start+y.count,M.start+M.count));for(let C=U,D=F;C<D;C+=3){const L=d.getX(C),I=d.getX(C+1),T=d.getX(C+2);l=Eu(this,x,e,s,p,S,_,L,I,T),l&&(l.faceIndex=Math.floor(C/3),l.face.materialIndex=y.materialIndex,i.push(l))}}else{const A=Math.max(0,M.start),N=Math.min(d.count,M.start+M.count);for(let y=A,x=N;y<x;y+=3){const U=d.getX(y),F=d.getX(y+1),C=d.getX(y+2);l=Eu(this,h,e,s,p,S,_,U,F,C),l&&(l.faceIndex=Math.floor(y/3),i.push(l))}}else if(m!==void 0)if(Array.isArray(h))for(let A=0,N=v.length;A<N;A++){const y=v[A],x=h[y.materialIndex],U=Math.max(y.start,M.start),F=Math.min(m.count,Math.min(y.start+y.count,M.start+M.count));for(let C=U,D=F;C<D;C+=3){const L=C,I=C+1,T=C+2;l=Eu(this,x,e,s,p,S,_,L,I,T),l&&(l.faceIndex=Math.floor(C/3),l.face.materialIndex=y.materialIndex,i.push(l))}}else{const A=Math.max(0,M.start),N=Math.min(m.count,M.start+M.count);for(let y=A,x=N;y<x;y+=3){const U=y,F=y+1,C=y+2;l=Eu(this,h,e,s,p,S,_,U,F,C),l&&(l.faceIndex=Math.floor(y/3),i.push(l))}}}}function Fb(o,e,i,s,l,f,h,d){let m;if(e.side===ri?m=s.intersectTriangle(h,f,l,!0,d):m=s.intersectTriangle(l,f,h,e.side===rr,d),m===null)return null;Mu.copy(d),Mu.applyMatrix4(o.matrixWorld);const p=i.ray.origin.distanceTo(Mu);return p<i.near||p>i.far?null:{distance:p,point:Mu.clone(),object:o}}function Eu(o,e,i,s,l,f,h,d,m,p){o.getVertexPosition(d,vu),o.getVertexPosition(m,xu),o.getVertexPosition(p,Su);const S=Fb(o,e,i,s,vu,xu,Su,dx);if(S){const _=new nt;zi.getBarycoord(dx,vu,xu,Su,_),l&&(S.uv=zi.getInterpolatedAttribute(l,d,m,p,_,new le)),f&&(S.uv1=zi.getInterpolatedAttribute(f,d,m,p,_,new le)),h&&(S.normal=zi.getInterpolatedAttribute(h,d,m,p,_,new nt),S.normal.dot(s.direction)>0&&S.normal.multiplyScalar(-1));const v={a:d,b:m,c:p,normal:new nt,materialIndex:0};zi.getNormal(vu,xu,Su,v.normal),S.face=v,S.barycoord=_}return S}class Hb extends Qn{constructor(e=null,i=1,s=1,l,f,h,d,m,p=Fn,S=Fn,_,v){super(null,h,d,m,p,S,l,f,_,v),this.isDataTexture=!0,this.image={data:e,width:i,height:s},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}const nr=new Ku,Gb=new le(.5,.5),bu=new nt;class xm{constructor(e=new Ga,i=new Ga,s=new Ga,l=new Ga,f=new Ga,h=new Ga){this.planes=[e,i,s,l,f,h]}set(e,i,s,l,f,h){const d=this.planes;return d[0].copy(e),d[1].copy(i),d[2].copy(s),d[3].copy(l),d[4].copy(f),d[5].copy(h),this}copy(e){const i=this.planes;for(let s=0;s<6;s++)i[s].copy(e.planes[s]);return this}setFromProjectionMatrix(e,i=ga,s=!1){const l=this.planes,f=e.elements,h=f[0],d=f[1],m=f[2],p=f[3],S=f[4],_=f[5],v=f[6],M=f[7],A=f[8],N=f[9],y=f[10],x=f[11],U=f[12],F=f[13],C=f[14],D=f[15];if(l[0].setComponents(p-h,M-S,x-A,D-U).normalize(),l[1].setComponents(p+h,M+S,x+A,D+U).normalize(),l[2].setComponents(p+d,M+_,x+N,D+F).normalize(),l[3].setComponents(p-d,M-_,x-N,D-F).normalize(),s)l[4].setComponents(m,v,y,C).normalize(),l[5].setComponents(p-m,M-v,x-y,D-C).normalize();else if(l[4].setComponents(p-m,M-v,x-y,D-C).normalize(),i===ga)l[5].setComponents(p+m,M+v,x+y,D+C).normalize();else if(i===Ol)l[5].setComponents(m,v,y,C).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+i);return this}intersectsObject(e){if(e.boundingSphere!==void 0)e.boundingSphere===null&&e.computeBoundingSphere(),nr.copy(e.boundingSphere).applyMatrix4(e.matrixWorld);else{const i=e.geometry;i.boundingSphere===null&&i.computeBoundingSphere(),nr.copy(i.boundingSphere).applyMatrix4(e.matrixWorld)}return this.intersectsSphere(nr)}intersectsSprite(e){nr.center.set(0,0,0);const i=Gb.distanceTo(e.center);return nr.radius=.7071067811865476+i,nr.applyMatrix4(e.matrixWorld),this.intersectsSphere(nr)}intersectsSphere(e){const i=this.planes,s=e.center,l=-e.radius;for(let f=0;f<6;f++)if(i[f].distanceToPoint(s)<l)return!1;return!0}intersectsBox(e){const i=this.planes;for(let s=0;s<6;s++){const l=i[s];if(bu.x=l.normal.x>0?e.max.x:e.min.x,bu.y=l.normal.y>0?e.max.y:e.min.y,bu.z=l.normal.z>0?e.max.z:e.min.z,l.distanceToPoint(bu)<0)return!1}return!0}containsPoint(e){const i=this.planes;for(let s=0;s<6;s++)if(i[s].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}}class Sm extends So{constructor(e){super(),this.isLineBasicMaterial=!0,this.type="LineBasicMaterial",this.color=new Me(16777215),this.map=null,this.linewidth=1,this.linecap="round",this.linejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.linewidth=e.linewidth,this.linecap=e.linecap,this.linejoin=e.linejoin,this.fog=e.fog,this}}const qu=new nt,Yu=new nt,px=new cn,El=new _m,Tu=new Ku,ip=new nt,mx=new nt;class Vb extends Un{constructor(e=new Jn,i=new Sm){super(),this.isLine=!0,this.type="Line",this.geometry=e,this.material=i,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(e,i){return super.copy(e,i),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}computeLineDistances(){const e=this.geometry;if(e.index===null){const i=e.attributes.position,s=[0];for(let l=1,f=i.count;l<f;l++)qu.fromBufferAttribute(i,l-1),Yu.fromBufferAttribute(i,l),s[l]=s[l-1],s[l]+=qu.distanceTo(Yu);e.setAttribute("lineDistance",new un(s,1))}else oe("Line.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}intersectsFrustum(e){return e.intersectsObject(this)}raycast(e,i){const s=this.geometry,l=this.matrixWorld,f=e.params.Line.threshold,h=s.drawRange;if(s.boundingSphere===null&&s.computeBoundingSphere(),Tu.copy(s.boundingSphere),Tu.applyMatrix4(l),Tu.radius+=f,e.ray.intersectsSphere(Tu)===!1)return;px.copy(l).invert(),El.copy(e.ray).applyMatrix4(px);const d=f/((this.scale.x+this.scale.y+this.scale.z)/3),m=d*d,p=this.isLineSegments?2:1,S=s.index,v=s.attributes.position;if(S!==null){const M=Math.max(0,h.start),A=Math.min(S.count,h.start+h.count);for(let N=M,y=A-1;N<y;N+=p){const x=S.getX(N),U=S.getX(N+1),F=Au(this,e,El,m,x,U,N);F&&i.push(F)}if(this.isLineLoop){const N=S.getX(A-1),y=S.getX(M),x=Au(this,e,El,m,N,y,A-1);x&&i.push(x)}}else{const M=Math.max(0,h.start),A=Math.min(v.count,h.start+h.count);for(let N=M,y=A-1;N<y;N+=p){const x=Au(this,e,El,m,N,N+1,N);x&&i.push(x)}if(this.isLineLoop){const N=Au(this,e,El,m,A-1,M,A-1);N&&i.push(N)}}}updateMorphTargets(){const i=this.geometry.morphAttributes,s=Object.keys(i);if(s.length>0){const l=i[s[0]];if(l!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let f=0,h=l.length;f<h;f++){const d=l[f].name||String(f);this.morphTargetInfluences.push(0),this.morphTargetDictionary[d]=f}}}}}function Au(o,e,i,s,l,f,h){const d=o.geometry.attributes.position;if(qu.fromBufferAttribute(d,l),Yu.fromBufferAttribute(d,f),i.distanceSqToSegment(qu,Yu,ip,mx)>s)return;ip.applyMatrix4(o.matrixWorld);const p=e.ray.origin.distanceTo(ip);if(!(p<e.near||p>e.far))return{distance:p,point:mx.clone().applyMatrix4(o.matrixWorld),index:h,face:null,faceIndex:null,barycoord:null,object:o}}const gx=new nt,_x=new nt;class ES extends Vb{constructor(e,i){super(e,i),this.isLineSegments=!0,this.type="LineSegments"}computeLineDistances(){const e=this.geometry;if(e.index===null){const i=e.attributes.position,s=[];for(let l=0,f=i.count;l<f;l+=2)gx.fromBufferAttribute(i,l),_x.fromBufferAttribute(i,l+1),s[l]=l===0?0:s[l-1],s[l+1]=s[l]+gx.distanceTo(_x);e.setAttribute("lineDistance",new un(s,1))}else oe("LineSegments.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}}class bS extends Qn{constructor(e=[],i=or,s,l,f,h,d,m,p,S){super(e,i,s,l,f,h,d,m,p,S),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}}class Pl extends Qn{constructor(e,i,s=va,l,f,h,d=Fn,m=Fn,p,S=qa,_=1){if(S!==qa&&S!==sr)throw new Error("THREE.DepthTexture: format must be either THREE.DepthFormat or THREE.DepthStencilFormat");const v={width:e,height:i,depth:_};super(v,l,f,h,d,m,S,s,p),this.isDepthTexture=!0,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(e){return super.copy(e),this.source=new mm(Object.assign({},e.image)),this.compareFunction=e.compareFunction,this}toJSON(e){const i=super.toJSON(e);return i.compareFunction=this.compareFunction,i}}class kb extends Pl{constructor(e,i=va,s=or,l,f,h=Fn,d=Fn,m,p=qa){const S={width:e,height:e,depth:1},_=[S,S,S,S,S,S];super(e,e,i,s,l,f,h,d,m,p),this.image=_,this.isCubeDepthTexture=!0,this.isCubeTexture=!0}get images(){return this.image}set images(e){this.image=e}}class TS extends Qn{constructor(e=null){super(),this.sourceTexture=e,this.isExternalTexture=!0}copy(e){return super.copy(e),this.sourceTexture=e.sourceTexture,this}}class xi extends Jn{constructor(e=1,i=1,s=1,l=1,f=1,h=1){super(),this.type="BoxGeometry",this.parameters={width:e,height:i,depth:s,widthSegments:l,heightSegments:f,depthSegments:h};const d=this;l=Math.floor(l),f=Math.floor(f),h=Math.floor(h);const m=[],p=[],S=[],_=[];let v=0,M=0;A("z","y","x",-1,-1,s,i,e,h,f,0),A("z","y","x",1,-1,s,i,-e,h,f,1),A("x","z","y",1,1,e,s,i,l,h,2),A("x","z","y",1,-1,e,s,-i,l,h,3),A("x","y","z",1,-1,e,i,s,l,f,4),A("x","y","z",-1,-1,e,i,-s,l,f,5),this.setIndex(m),this.setAttribute("position",new un(p,3)),this.setAttribute("normal",new un(S,3)),this.setAttribute("uv",new un(_,2));function A(N,y,x,U,F,C,D,L,I,T,O){const G=C/I,k=D/T,Q=C/2,st=D/2,Y=L/2,tt=I+1,q=T+1;let j=0,dt=0;const ut=new nt;for(let rt=0;rt<q;rt++){const Tt=rt*k-st;for(let Gt=0;Gt<tt;Gt++){const Ot=Gt*G-Q;ut[N]=Ot*U,ut[y]=Tt*F,ut[x]=Y,p.push(ut.x,ut.y,ut.z),ut[N]=0,ut[y]=0,ut[x]=L>0?1:-1,S.push(ut.x,ut.y,ut.z),_.push(Gt/I),_.push(1-rt/T),j+=1}}for(let rt=0;rt<T;rt++)for(let Tt=0;Tt<I;Tt++){const Gt=v+Tt+tt*rt,Ot=v+Tt+tt*(rt+1),B=v+(Tt+1)+tt*(rt+1),_t=v+(Tt+1)+tt*rt;m.push(Gt,Ot,_t),m.push(Ot,B,_t),dt+=6}d.addGroup(M,dt,O),M+=dt,v+=j}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new xi(e.width,e.height,e.depth,e.widthSegments,e.heightSegments,e.depthSegments)}}class ym extends Jn{constructor(e=1,i=32,s=0,l=Math.PI*2){super(),this.type="CircleGeometry",this.parameters={radius:e,segments:i,thetaStart:s,thetaLength:l},i=Math.max(3,i);const f=[],h=[],d=[],m=[],p=new nt,S=new le;h.push(0,0,0),d.push(0,0,1),m.push(.5,.5);for(let _=0,v=3;_<=i;_++,v+=3){const M=s+_/i*l;p.x=e*Math.cos(M),p.y=e*Math.sin(M),h.push(p.x,p.y,p.z),d.push(0,0,1),S.x=(h[v]/e+1)/2,S.y=(h[v+1]/e+1)/2,m.push(S.x,S.y)}for(let _=1;_<=i;_++)f.push(_,_+1,0);this.setIndex(f),this.setAttribute("position",new un(h,3)),this.setAttribute("normal",new un(d,3)),this.setAttribute("uv",new un(m,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new ym(e.radius,e.segments,e.thetaStart,e.thetaLength)}}class Kn extends Jn{constructor(e=1,i=1,s=1,l=32,f=1,h=!1,d=0,m=Math.PI*2){super(),this.type="CylinderGeometry",this.parameters={radiusTop:e,radiusBottom:i,height:s,radialSegments:l,heightSegments:f,openEnded:h,thetaStart:d,thetaLength:m};const p=this;l=Math.floor(l),f=Math.floor(f);const S=[],_=[],v=[],M=[];let A=0;const N=[],y=s/2;let x=0;U(),h===!1&&(e>0&&F(!0),i>0&&F(!1)),this.setIndex(S),this.setAttribute("position",new un(_,3)),this.setAttribute("normal",new un(v,3)),this.setAttribute("uv",new un(M,2));function U(){const C=new nt,D=new nt;let L=0;const I=(i-e)/s;for(let T=0;T<=f;T++){const O=[],G=T/f,k=G*(i-e)+e;for(let Q=0;Q<=l;Q++){const st=Q/l,Y=st*m+d,tt=Math.sin(Y),q=Math.cos(Y);D.x=k*tt,D.y=-G*s+y,D.z=k*q,_.push(D.x,D.y,D.z),C.set(tt,I,q).normalize(),v.push(C.x,C.y,C.z),M.push(st,1-G),O.push(A++)}N.push(O)}for(let T=0;T<l;T++)for(let O=0;O<f;O++){const G=N[O][T],k=N[O+1][T],Q=N[O+1][T+1],st=N[O][T+1];(e>0||O!==0)&&(S.push(G,k,st),L+=3),(i>0||O!==f-1)&&(S.push(k,Q,st),L+=3)}p.addGroup(x,L,0),x+=L}function F(C){const D=A,L=new le,I=new nt;let T=0;const O=C===!0?e:i,G=C===!0?1:-1;for(let Q=1;Q<=l;Q++)_.push(0,y*G,0),v.push(0,G,0),M.push(.5,.5),A++;const k=A;for(let Q=0;Q<=l;Q++){const Y=Q/l*m+d,tt=Math.cos(Y),q=Math.sin(Y);I.x=O*q,I.y=y*G,I.z=O*tt,_.push(I.x,I.y,I.z),v.push(0,G,0),L.x=tt*.5+.5,L.y=q*.5*G+.5,M.push(L.x,L.y),A++}for(let Q=0;Q<l;Q++){const st=D+Q,Y=k+Q;C===!0?S.push(Y,Y+1,st):S.push(Y+1,Y,st),T+=3}p.addGroup(x,T,C===!0?1:2),x+=T}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new Kn(e.radiusTop,e.radiusBottom,e.height,e.radialSegments,e.heightSegments,e.openEnded,e.thetaStart,e.thetaLength)}}class Mm extends Kn{constructor(e=1,i=1,s=32,l=1,f=!1,h=0,d=Math.PI*2){super(0,e,i,s,l,f,h,d),this.type="ConeGeometry",this.parameters={radius:e,height:i,radialSegments:s,heightSegments:l,openEnded:f,thetaStart:h,thetaLength:d}}static fromJSON(e){return new Mm(e.radius,e.height,e.radialSegments,e.heightSegments,e.openEnded,e.thetaStart,e.thetaLength)}}const Ru=new nt,wu=new nt,ap=new nt,Cu=new zi;class Xb extends Jn{constructor(e=null,i=1){if(super(),this.type="EdgesGeometry",this.parameters={geometry:e,thresholdAngle:i},e!==null){const l=Math.pow(10,4),f=Math.cos(Nl*i),h=e.getIndex(),d=e.getAttribute("position"),m=h?h.count:d.count,p=[0,0,0],S=["a","b","c"],_=new Array(3),v={},M=[];for(let A=0;A<m;A+=3){h?(p[0]=h.getX(A),p[1]=h.getX(A+1),p[2]=h.getX(A+2)):(p[0]=A,p[1]=A+1,p[2]=A+2);const{a:N,b:y,c:x}=Cu;if(N.fromBufferAttribute(d,p[0]),y.fromBufferAttribute(d,p[1]),x.fromBufferAttribute(d,p[2]),Cu.getNormal(ap),_[0]=`${Math.round(N.x*l)},${Math.round(N.y*l)},${Math.round(N.z*l)}`,_[1]=`${Math.round(y.x*l)},${Math.round(y.y*l)},${Math.round(y.z*l)}`,_[2]=`${Math.round(x.x*l)},${Math.round(x.y*l)},${Math.round(x.z*l)}`,!(_[0]===_[1]||_[1]===_[2]||_[2]===_[0]))for(let U=0;U<3;U++){const F=(U+1)%3,C=_[U],D=_[F],L=Cu[S[U]],I=Cu[S[F]],T=`${C}_${D}`,O=`${D}_${C}`;O in v&&v[O]?(ap.dot(v[O].normal)<=f&&(M.push(L.x,L.y,L.z),M.push(I.x,I.y,I.z)),v[O]=null):T in v||(v[T]={index0:p[U],index1:p[F],normal:ap.clone()})}}for(const A in v)if(v[A]){const{index0:N,index1:y}=v[A];Ru.fromBufferAttribute(d,N),wu.fromBufferAttribute(d,y),M.push(Ru.x,Ru.y,Ru.z),M.push(wu.x,wu.y,wu.z)}this.setAttribute("position",new un(M,3))}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}}class vo extends Jn{constructor(e=1,i=1,s=1,l=1){super(),this.type="PlaneGeometry",this.parameters={width:e,height:i,widthSegments:s,heightSegments:l};const f=e/2,h=i/2,d=Math.floor(s),m=Math.floor(l),p=d+1,S=m+1,_=e/d,v=i/m,M=[],A=[],N=[],y=[];for(let x=0;x<S;x++){const U=x*v-h;for(let F=0;F<p;F++){const C=F*_-f;A.push(C,-U,0),N.push(0,0,1),y.push(F/d),y.push(1-x/m)}}for(let x=0;x<m;x++)for(let U=0;U<d;U++){const F=U+p*x,C=U+p*(x+1),D=U+1+p*(x+1),L=U+1+p*x;M.push(F,C,L),M.push(C,D,L)}this.setIndex(M),this.setAttribute("position",new un(A,3)),this.setAttribute("normal",new un(N,3)),this.setAttribute("uv",new un(y,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new vo(e.width,e.height,e.widthSegments,e.heightSegments)}}class Em extends Jn{constructor(e=1,i=32,s=16,l=0,f=Math.PI*2,h=0,d=Math.PI){super(),this.type="SphereGeometry",this.parameters={radius:e,widthSegments:i,heightSegments:s,phiStart:l,phiLength:f,thetaStart:h,thetaLength:d},i=Math.max(3,Math.floor(i)),s=Math.max(2,Math.floor(s));const m=Math.min(h+d,Math.PI);let p=0;const S=[],_=new nt,v=new nt,M=[],A=[],N=[],y=[];for(let x=0;x<=s;x++){const U=[],F=x/s,C=h+F*d,D=e*Math.cos(C),L=Math.sqrt(e*e-D*D);let I=0;x===0&&h===0?I=.5/i:x===s&&m===Math.PI&&(I=-.5/i);for(let T=0;T<=i;T++){const O=T/i,G=l+O*f;_.x=-L*Math.cos(G),_.y=D,_.z=L*Math.sin(G),A.push(_.x,_.y,_.z),v.copy(_).normalize(),N.push(v.x,v.y,v.z),y.push(O+I,1-F),U.push(p++)}S.push(U)}for(let x=0;x<s;x++)for(let U=0;U<i;U++){const F=S[x][U+1],C=S[x][U],D=S[x+1][U],L=S[x+1][U+1];(x!==0||h>0)&&M.push(F,C,L),(x!==s-1||m<Math.PI)&&M.push(C,D,L)}this.setIndex(M),this.setAttribute("position",new un(A,3)),this.setAttribute("normal",new un(N,3)),this.setAttribute("uv",new un(y,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new Em(e.radius,e.widthSegments,e.heightSegments,e.phiStart,e.phiLength,e.thetaStart,e.thetaLength)}}function xo(o){const e={};for(const i in o){e[i]={};for(const s in o[i]){const l=o[i][s];if(vx(l))l.isRenderTargetTexture?(oe("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),e[i][s]=null):e[i][s]=l.clone();else if(Array.isArray(l))if(vx(l[0])){const f=[];for(let h=0,d=l.length;h<d;h++)f[h]=l[h].clone();e[i][s]=f}else e[i][s]=l.slice();else e[i][s]=l}}return e}function Zn(o){const e={};for(let i=0;i<o.length;i++){const s=xo(o[i]);for(const l in s)e[l]=s[l]}return e}function vx(o){return o&&(o.isColor||o.isMatrix3||o.isMatrix4||o.isVector2||o.isVector3||o.isVector4||o.isTexture||o.isQuaternion)}function Wb(o){const e=[];for(let i=0;i<o.length;i++)e.push(o[i].clone());return e}function AS(o){const e=o.getRenderTarget();return e===null?o.outputColorSpace:e.isXRRenderTarget===!0?e.texture.colorSpace:Oe.workingColorSpace}const qb={clone:xo,merge:Zn};var Yb=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,jb=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`;class Sa extends So{constructor(e){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=Yb,this.fragmentShader=jb,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0&&this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=xo(e.uniforms),this.uniformsGroups=Wb(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this.defaultAttributeValues=Object.assign({},e.defaultAttributeValues),this.index0AttributeName=e.index0AttributeName,this.uniformsNeedUpdate=e.uniformsNeedUpdate,this}toJSON(e){const i=super.toJSON(e);i.glslVersion=this.glslVersion,i.uniforms={};for(const l in this.uniforms){const h=this.uniforms[l].value;h&&h.isTexture?i.uniforms[l]={type:"t",value:h.toJSON(e).uuid}:h&&h.isColor?i.uniforms[l]={type:"c",value:h.getHex()}:h&&h.isVector2?i.uniforms[l]={type:"v2",value:h.toArray()}:h&&h.isVector3?i.uniforms[l]={type:"v3",value:h.toArray()}:h&&h.isVector4?i.uniforms[l]={type:"v4",value:h.toArray()}:h&&h.isMatrix3?i.uniforms[l]={type:"m3",value:h.toArray()}:h&&h.isMatrix4?i.uniforms[l]={type:"m4",value:h.toArray()}:i.uniforms[l]={value:h}}Object.keys(this.defines).length>0&&(i.defines=this.defines),i.vertexShader=this.vertexShader,i.fragmentShader=this.fragmentShader,i.lights=this.lights,i.clipping=this.clipping;const s={};for(const l in this.extensions)this.extensions[l]===!0&&(s[l]=!0);return Object.keys(s).length>0&&(i.extensions=s),i}fromJSON(e,i){if(super.fromJSON(e,i),e.uniforms!==void 0)for(const s in e.uniforms){const l=e.uniforms[s];switch(this.uniforms[s]={},l.type){case"t":this.uniforms[s].value=i[l.value]||null;break;case"c":this.uniforms[s].value=new Me().setHex(l.value);break;case"v2":this.uniforms[s].value=new le().fromArray(l.value);break;case"v3":this.uniforms[s].value=new nt().fromArray(l.value);break;case"v4":this.uniforms[s].value=new ln().fromArray(l.value);break;case"m3":this.uniforms[s].value=new de().fromArray(l.value);break;case"m4":this.uniforms[s].value=new cn().fromArray(l.value);break;default:this.uniforms[s].value=l.value}}if(e.defines!==void 0&&(this.defines=e.defines),e.vertexShader!==void 0&&(this.vertexShader=e.vertexShader),e.fragmentShader!==void 0&&(this.fragmentShader=e.fragmentShader),e.glslVersion!==void 0&&(this.glslVersion=e.glslVersion),e.extensions!==void 0)for(const s in e.extensions)this.extensions[s]=e.extensions[s];return e.lights!==void 0&&(this.lights=e.lights),e.clipping!==void 0&&(this.clipping=e.clipping),this}}class Zb extends Sa{constructor(e){super(e),this.isRawShaderMaterial=!0,this.type="RawShaderMaterial"}}class mn extends So{constructor(e){super(),this.isMeshStandardMaterial=!0,this.type="MeshStandardMaterial",this.defines={STANDARD:""},this.color=new Me(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new Me(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=Jp,this.normalScale=new le(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new ws,this.envMapIntensity=1,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.defines={STANDARD:""},this.color.copy(e.color),this.roughness=e.roughness,this.metalness=e.metalness,this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.roughnessMap=e.roughnessMap,this.metalnessMap=e.metalnessMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.envMapIntensity=e.envMapIntensity,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.flatShading=e.flatShading,this.fog=e.fog,this}}class Kb extends So{constructor(e){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=ib,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(e)}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}}class Qb extends So{constructor(e){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e)}copy(e){return super.copy(e),this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}}class bm extends Un{constructor(e,i=1){super(),this.isLight=!0,this.type="Light",this.color=new Me(e),this.intensity=i}copy(e,i){return super.copy(e,i),this.color.copy(e.color),this.intensity=e.intensity,this}toJSON(e){const i=super.toJSON(e);return i.object.color=this.color.getHex(),i.object.intensity=this.intensity,i}}class Jb extends bm{constructor(e,i,s){super(e,s),this.isHemisphereLight=!0,this.type="HemisphereLight",this.position.copy(Un.DEFAULT_UP),this.updateMatrix(),this.groundColor=new Me(i)}copy(e,i){return super.copy(e,i),this.groundColor.copy(e.groundColor),this}toJSON(e){const i=super.toJSON(e);return i.object.groundColor=this.groundColor.getHex(),i}}const sp=new cn,xx=new nt,Sx=new nt;class RS{constructor(e){this.camera=e,this.intensity=1,this.bias=0,this.biasNode=null,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new le(512,512),this.mapType=yi,this.map=null,this.mapPass=null,this.matrix=new cn,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new xm,this._frameExtents=new le(1,1),this._viewportCount=1,this._viewports=[new ln(0,0,1,1)]}getViewportCount(){return this._viewportCount}getCamera(){return this.camera}getFrustum(){return this._frustum}updateMatrices(e){const i=this.camera;xx.setFromMatrixPosition(e.matrixWorld),i.position.copy(xx),Sx.setFromMatrixPosition(e.target.matrixWorld),i.lookAt(Sx),i.updateMatrixWorld(),this._updateMatrix(i,this.matrix,this._frustum)}_updateMatrix(e,i,s,l){sp.multiplyMatrices(e.projectionMatrix,e.matrixWorldInverse),s.setFromProjectionMatrix(sp,e.coordinateSystem,e.reversedDepth);const f=this._frameExtents,h=l?l.z/f.x:1,d=l?l.w/f.y:1,m=l?l.x/f.x:0,p=l?l.y/f.y:0;e.coordinateSystem===Ol||e.reversedDepth?i.set(.5*h,0,0,.5*h+m,0,.5*d,0,.5*d+p,0,0,1,0,0,0,0,1):i.set(.5*h,0,0,.5*h+m,0,.5*d,0,.5*d+p,0,0,.5,.5,0,0,0,1),i.multiply(sp)}getViewport(e){return this._viewports[e]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(e){return this.camera=e.camera.clone(),this.intensity=e.intensity,this.bias=e.bias,this.radius=e.radius,this.autoUpdate=e.autoUpdate,this.needsUpdate=e.needsUpdate,this.normalBias=e.normalBias,this.blurSamples=e.blurSamples,this.mapSize.copy(e.mapSize),this.biasNode=e.biasNode,this}clone(){return new this.constructor().copy(this)}toJSON(){const e={};return e.intensity=this.intensity,e.bias=this.bias,e.normalBias=this.normalBias,e.radius=this.radius,e.blurSamples=this.blurSamples,e.mapSize=this.mapSize.toArray(),e.camera=this.camera.toJSON(!1).object,delete e.camera.matrix,e}}const Nu=new nt,Du=new Rs,fa=new nt;class wS extends Un{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new cn,this.projectionMatrix=new cn,this.projectionMatrixInverse=new cn,this.coordinateSystem=ga,this._reversedDepth=!1}get reversedDepth(){return this._reversedDepth}copy(e,i){return super.copy(e,i),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this.coordinateSystem=e.coordinateSystem,this}getWorldDirection(e){return super.getWorldDirection(e).negate()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorld.decompose(Nu,Du,fa),fa.x===1&&fa.y===1&&fa.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(Nu,Du,fa.set(1,1,1)).invert()}updateWorldMatrix(e,i,s=!1){super.updateWorldMatrix(e,i,s),this.matrixWorld.decompose(Nu,Du,fa),fa.x===1&&fa.y===1&&fa.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(Nu,Du,fa.set(1,1,1)).invert()}clone(){return new this.constructor().copy(this)}}const Ts=new nt,yx=new le,Mx=new le;class Si extends wS{constructor(e=50,i=1,s=.1,l=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=e,this.zoom=1,this.near=s,this.far=l,this.focus=10,this.aspect=i,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,i){return super.copy(e,i),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){const i=.5*this.getFilmHeight()/e;this.fov=$p*2*Math.atan(i),this.updateProjectionMatrix()}getFocalLength(){const e=Math.tan(Nl*.5*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return $p*2*Math.atan(Math.tan(Nl*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(e,i,s){Ts.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),i.set(Ts.x,Ts.y).multiplyScalar(-e/Ts.z),Ts.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),s.set(Ts.x,Ts.y).multiplyScalar(-e/Ts.z)}getViewSize(e,i){return this.getViewBounds(e,yx,Mx),i.subVectors(Mx,yx)}setViewOffset(e,i,s,l,f,h){this.aspect=e/i,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=i,this.view.offsetX=s,this.view.offsetY=l,this.view.width=f,this.view.height=h,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const e=this.near;let i=e*Math.tan(Nl*.5*this.fov)/this.zoom,s=2*i,l=this.aspect*s,f=-.5*l;const h=this.view;if(this.view!==null&&this.view.enabled){const m=h.fullWidth,p=h.fullHeight;f+=h.offsetX*l/m,i-=h.offsetY*s/p,l*=h.width/m,s*=h.height/p}const d=this.filmOffset;d!==0&&(f+=e*d/this.getFilmWidth()),this.projectionMatrix.makePerspective(f,f+l,i,i-s,e,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){const i=super.toJSON(e);return i.object.fov=this.fov,i.object.zoom=this.zoom,i.object.near=this.near,i.object.far=this.far,i.object.focus=this.focus,i.object.aspect=this.aspect,this.view!==null&&(i.object.view=Object.assign({},this.view)),i.object.filmGauge=this.filmGauge,i.object.filmOffset=this.filmOffset,i}}class $b extends RS{constructor(){super(new Si(90,1,.5,500)),this.isPointLightShadow=!0}}class tT extends bm{constructor(e,i,s=0,l=2){super(e,i),this.isPointLight=!0,this.type="PointLight",this.distance=s,this.decay=l,this.shadow=new $b}get power(){return this.intensity*4*Math.PI}set power(e){this.intensity=e/(4*Math.PI)}dispose(){super.dispose(),this.shadow.dispose()}copy(e,i){return super.copy(e,i),this.distance=e.distance,this.decay=e.decay,this.shadow=e.shadow.clone(),this}toJSON(e){const i=super.toJSON(e);return i.object.distance=this.distance,i.object.decay=this.decay,i.object.shadow=this.shadow.toJSON(),i}}class Tm extends wS{constructor(e=-1,i=1,s=1,l=-1,f=.1,h=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=e,this.right=i,this.top=s,this.bottom=l,this.near=f,this.far=h,this.updateProjectionMatrix()}copy(e,i){return super.copy(e,i),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,i,s,l,f,h){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=i,this.view.offsetX=s,this.view.offsetY=l,this.view.width=f,this.view.height=h,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const e=(this.right-this.left)/(2*this.zoom),i=(this.top-this.bottom)/(2*this.zoom),s=(this.right+this.left)/2,l=(this.top+this.bottom)/2;let f=s-e,h=s+e,d=l+i,m=l-i;if(this.view!==null&&this.view.enabled){const p=(this.right-this.left)/this.view.fullWidth/this.zoom,S=(this.top-this.bottom)/this.view.fullHeight/this.zoom;f+=p*this.view.offsetX,h=f+p*this.view.width,d-=S*this.view.offsetY,m=d-S*this.view.height}this.projectionMatrix.makeOrthographic(f,h,d,m,this.near,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){const i=super.toJSON(e);return i.object.zoom=this.zoom,i.object.left=this.left,i.object.right=this.right,i.object.top=this.top,i.object.bottom=this.bottom,i.object.near=this.near,i.object.far=this.far,this.view!==null&&(i.object.view=Object.assign({},this.view)),i}}class eT extends RS{constructor(){super(new Tm(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}}class Ex extends bm{constructor(e,i){super(e,i),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(Un.DEFAULT_UP),this.updateMatrix(),this.target=new Un,this.shadow=new eT}dispose(){super.dispose(),this.shadow.dispose()}copy(e){return super.copy(e),this.target=e.target.clone(),this.shadow=e.shadow.clone(),this}toJSON(e){const i=super.toJSON(e);return i.object.shadow=this.shadow.toJSON(),i.object.target=this.target.uuid,i}}const oo=-90,lo=1;class nT extends Un{constructor(e,i,s){super(),this.type="CubeCamera",this.renderTarget=s,this.coordinateSystem=null,this.activeMipmapLevel=0;const l=new Si(oo,lo,e,i);l.layers=this.layers,this.add(l);const f=new Si(oo,lo,e,i);f.layers=this.layers,this.add(f);const h=new Si(oo,lo,e,i);h.layers=this.layers,this.add(h);const d=new Si(oo,lo,e,i);d.layers=this.layers,this.add(d);const m=new Si(oo,lo,e,i);m.layers=this.layers,this.add(m);const p=new Si(oo,lo,e,i);p.layers=this.layers,this.add(p)}updateCoordinateSystem(){const e=this.coordinateSystem,i=this.children.concat(),[s,l,f,h,d,m]=i;for(const p of i)this.remove(p);if(e===ga)s.up.set(0,1,0),s.lookAt(1,0,0),l.up.set(0,1,0),l.lookAt(-1,0,0),f.up.set(0,0,-1),f.lookAt(0,1,0),h.up.set(0,0,1),h.lookAt(0,-1,0),d.up.set(0,1,0),d.lookAt(0,0,1),m.up.set(0,1,0),m.lookAt(0,0,-1);else if(e===Ol)s.up.set(0,-1,0),s.lookAt(-1,0,0),l.up.set(0,-1,0),l.lookAt(1,0,0),f.up.set(0,0,1),f.lookAt(0,1,0),h.up.set(0,0,-1),h.lookAt(0,-1,0),d.up.set(0,-1,0),d.lookAt(0,0,1),m.up.set(0,-1,0),m.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+e);for(const p of i)this.add(p),p.updateMatrixWorld()}update(e,i){this.parent===null&&this.updateMatrixWorld();const{renderTarget:s,activeMipmapLevel:l}=this;this.coordinateSystem!==e.coordinateSystem&&(this.coordinateSystem=e.coordinateSystem,this.updateCoordinateSystem());const[f,h,d,m,p,S]=this.children,_=e.getRenderTarget(),v=e.getActiveCubeFace(),M=e.getActiveMipmapLevel(),A=e.xr.enabled;e.xr.enabled=!1;const N=s.texture.generateMipmaps;s.texture.generateMipmaps=!1;let y=!1;e.isWebGLRenderer===!0?y=e.state.buffers.depth.getReversed():y=e.reversedDepthBuffer,e.setRenderTarget(s,0,l),y&&e.autoClear===!1&&e.clearDepth(),e.render(i,f),e.setRenderTarget(s,1,l),y&&e.autoClear===!1&&e.clearDepth(),e.render(i,h),e.setRenderTarget(s,2,l),y&&e.autoClear===!1&&e.clearDepth(),e.render(i,d),e.setRenderTarget(s,3,l),y&&e.autoClear===!1&&e.clearDepth(),e.render(i,m),e.setRenderTarget(s,4,l),y&&e.autoClear===!1&&e.clearDepth(),e.render(i,p),s.texture.generateMipmaps=N,e.setRenderTarget(s,5,l),y&&e.autoClear===!1&&e.clearDepth(),e.render(i,S),e.setRenderTarget(_,v,M),e.xr.enabled=A,s.texture.needsPMREMUpdate=!0}}class iT extends Si{constructor(e=[]){super(),this.isArrayCamera=!0,this.isMultiViewCamera=!1,this.cameras=e}}class bx{constructor(e=1,i=0,s=0){this.radius=e,this.phi=i,this.theta=s}set(e,i,s){return this.radius=e,this.phi=i,this.theta=s,this}copy(e){return this.radius=e.radius,this.phi=e.phi,this.theta=e.theta,this}makeSafe(){return this.phi=we(this.phi,1e-6,Math.PI-1e-6),this}setFromVector3(e){return this.setFromCartesianCoords(e.x,e.y,e.z)}setFromCartesianCoords(e,i,s){return this.radius=Math.sqrt(e*e+i*i+s*s),this.radius===0?(this.theta=0,this.phi=0):(this.theta=Math.atan2(e,s),this.phi=Math.acos(we(i/this.radius,-1,1))),this}clone(){return new this.constructor().copy(this)}}const Lm=class Lm{constructor(e,i,s,l){this.elements=[1,0,0,1],e!==void 0&&this.set(e,i,s,l)}identity(){return this.set(1,0,0,1),this}fromArray(e,i=0){for(let s=0;s<4;s++)this.elements[s]=e[s+i];return this}set(e,i,s,l){const f=this.elements;return f[0]=e,f[2]=i,f[1]=s,f[3]=l,this}};Lm.prototype.isMatrix2=!0;let Tx=Lm;class aT extends ES{constructor(e=10,i=10,s=4473924,l=8947848){s=new Me(s),l=new Me(l);const f=i/2,h=e/i,d=e/2,m=[],p=[];for(let v=0,M=0,A=-d;v<=i;v++,A+=h){m.push(-d,0,A,d,0,A),m.push(A,0,-d,A,0,d);const N=v===f?s:l;N.toArray(p,M),M+=3,N.toArray(p,M),M+=3,N.toArray(p,M),M+=3,N.toArray(p,M),M+=3}const S=new Jn;S.setAttribute("position",new un(m,3)),S.setAttribute("color",new un(p,3));const _=new Sm({vertexColors:!0,toneMapped:!1});super(S,_),this.type="GridHelper"}dispose(){super.dispose(),this.geometry.dispose(),this.material.dispose()}}class sT extends Cs{constructor(e,i=null){super(),this.object=e,this.domElement=i,this.enabled=!0,this.state=-1,this.keys={},this.mouseButtons={LEFT:null,MIDDLE:null,RIGHT:null},this.touches={ONE:null,TWO:null}}connect(e){this.domElement!==null&&this.disconnect(),this.domElement=e}disconnect(){}dispose(){}update(){}}function Ax(o,e,i,s){const l=rT(s);switch(i){case pS:return o*e;case gS:return o*e/l.components*l.byteLength;case um:return o*e/l.components*l.byteLength;case lr:return o*e*2/l.components*l.byteLength;case fm:return o*e*2/l.components*l.byteLength;case mS:return o*e*3/l.components*l.byteLength;case Zi:return o*e*4/l.components*l.byteLength;case hm:return o*e*4/l.components*l.byteLength;case Pu:case Iu:return Math.floor((o+3)/4)*Math.floor((e+3)/4)*8;case zu:case Bu:return Math.floor((o+3)/4)*Math.floor((e+3)/4)*16;case Ep:case Tp:return Math.max(o,16)*Math.max(e,8)/4;case Mp:case bp:return Math.max(o,8)*Math.max(e,8)/2;case Ap:case Rp:case Cp:case Np:return Math.floor((o+3)/4)*Math.floor((e+3)/4)*8;case wp:case Gu:case Dp:return Math.floor((o+3)/4)*Math.floor((e+3)/4)*16;case Up:return Math.floor((o+3)/4)*Math.floor((e+3)/4)*16;case Lp:return Math.floor((o+4)/5)*Math.floor((e+3)/4)*16;case Op:return Math.floor((o+4)/5)*Math.floor((e+4)/5)*16;case Pp:return Math.floor((o+5)/6)*Math.floor((e+4)/5)*16;case Ip:return Math.floor((o+5)/6)*Math.floor((e+5)/6)*16;case zp:return Math.floor((o+7)/8)*Math.floor((e+4)/5)*16;case Bp:return Math.floor((o+7)/8)*Math.floor((e+5)/6)*16;case Fp:return Math.floor((o+7)/8)*Math.floor((e+7)/8)*16;case Hp:return Math.floor((o+9)/10)*Math.floor((e+4)/5)*16;case Gp:return Math.floor((o+9)/10)*Math.floor((e+5)/6)*16;case Vp:return Math.floor((o+9)/10)*Math.floor((e+7)/8)*16;case kp:return Math.floor((o+9)/10)*Math.floor((e+9)/10)*16;case Xp:return Math.floor((o+11)/12)*Math.floor((e+9)/10)*16;case Wp:return Math.floor((o+11)/12)*Math.floor((e+11)/12)*16;case qp:case Yp:case jp:return Math.ceil(o/4)*Math.ceil(e/4)*16;case Zp:case Kp:return Math.ceil(o/4)*Math.ceil(e/4)*8;case Vu:case Qp:return Math.ceil(o/4)*Math.ceil(e/4)*16}throw new Error(`Unable to determine texture byte length for ${i} format.`)}function rT(o){switch(o){case yi:case uS:return{byteLength:1,components:1};case Ul:case fS:case xa:return{byteLength:2,components:1};case lm:case cm:return{byteLength:2,components:4};case va:case om:case ma:return{byteLength:4,components:1};case hS:case dS:return{byteLength:4,components:3}}throw new Error(`THREE.TextureUtils: Unknown texture type ${o}.`)}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:rm}}));typeof window<"u"&&(window.__THREE__?oe("WARNING: Multiple instances of Three.js being imported."):window.__THREE__=rm);function CS(){let o=null,e=!1,i=null,s=null;function l(f,h){s=o.requestAnimationFrame(l),i(f,h)}return{start:function(){e!==!0&&i!==null&&o!==null&&(s=o.requestAnimationFrame(l),e=!0)},stop:function(){o!==null&&o.cancelAnimationFrame(s),e=!1},setAnimationLoop:function(f){i=f},setContext:function(f){o=f}}}function oT(o){const e=new WeakMap;function i(d,m){const p=d.array,S=d.usage,_=p.byteLength,v=o.createBuffer();o.bindBuffer(m,v),o.bufferData(m,p,S),d.onUploadCallback();let M;if(p instanceof Float32Array)M=o.FLOAT;else if(typeof Float16Array<"u"&&p instanceof Float16Array)M=o.HALF_FLOAT;else if(p instanceof Uint16Array)d.isFloat16BufferAttribute?M=o.HALF_FLOAT:M=o.UNSIGNED_SHORT;else if(p instanceof Int16Array)M=o.SHORT;else if(p instanceof Uint32Array)M=o.UNSIGNED_INT;else if(p instanceof Int32Array)M=o.INT;else if(p instanceof Int8Array)M=o.BYTE;else if(p instanceof Uint8Array)M=o.UNSIGNED_BYTE;else if(p instanceof Uint8ClampedArray)M=o.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+p);return{buffer:v,type:M,bytesPerElement:p.BYTES_PER_ELEMENT,version:d.version,size:_}}function s(d,m,p){const S=m.array,_=m.updateRanges;if(o.bindBuffer(p,d),_.length===0)o.bufferSubData(p,0,S);else{_.sort((M,A)=>M.start-A.start);let v=0;for(let M=1;M<_.length;M++){const A=_[v],N=_[M];N.start<=A.start+A.count+1?A.count=Math.max(A.count,N.start+N.count-A.start):(++v,_[v]=N)}_.length=v+1;for(let M=0,A=_.length;M<A;M++){const N=_[M];o.bufferSubData(p,N.start*S.BYTES_PER_ELEMENT,S,N.start,N.count)}m.clearUpdateRanges()}m.onUploadCallback()}function l(d){return d.isInterleavedBufferAttribute&&(d=d.data),e.get(d)}function f(d){d.isInterleavedBufferAttribute&&(d=d.data);const m=e.get(d);m&&(o.deleteBuffer(m.buffer),e.delete(d))}function h(d,m){if(d.isInterleavedBufferAttribute&&(d=d.data),d.isGLBufferAttribute){const S=e.get(d);(!S||S.version<d.version)&&e.set(d,{buffer:d.buffer,type:d.type,bytesPerElement:d.elementSize,version:d.version});return}const p=e.get(d);if(p===void 0)e.set(d,i(d,m));else if(p.version<d.version){if(p.size!==d.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");s(p.buffer,d,m),p.version=d.version}}return{get:l,remove:f,update:h}}var lT=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,cT=`#ifdef USE_ALPHAHASH
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
#endif`,uT=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,fT=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,hT=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,dT=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,pT=`#ifdef USE_AOMAP
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
#endif`,mT=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,gT=`#ifdef USE_BATCHING
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
#endif`,_T=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,vT=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,xT=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,ST=`float G_BlinnPhong_Implicit( ) {
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
} // validated`,yT=`#ifdef USE_IRIDESCENCE
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
#endif`,MT=`#ifdef USE_BUMPMAP
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
#endif`,ET=`#if NUM_CLIPPING_PLANES > 0
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
#endif`,bT=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,TT=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,AT=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,RT=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#endif`,wT=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#endif`,CT=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec4 vColor;
#endif`,NT=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
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
#endif`,DT=`#define PI 3.141592653589793
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
} // validated`,UT=`#ifdef ENVMAP_TYPE_CUBE_UV
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
#endif`,LT=`vec3 transformedNormal = objectNormal;
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
#endif`,OT=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,PT=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,IT=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,zT=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,BT="gl_FragColor = linearToOutputTexel( gl_FragColor );",FT=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,HT=`#ifdef USE_ENVMAP
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
#endif`,GT=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
#endif`,VT=`#ifdef USE_ENVMAP
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
#endif`,kT=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,XT=`#ifdef USE_ENVMAP
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
#endif`,WT=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,qT=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,YT=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,jT=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,ZT=`#ifdef USE_GRADIENTMAP
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
}`,KT=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,QT=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,JT=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,$T=`uniform bool receiveShadow;
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
#include <lightprobes_pars_fragment>`,t1=`#ifdef USE_ENVMAP
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
#endif`,e1=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,n1=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,i1=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,a1=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,s1=`PhysicalMaterial material;
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
#endif`,r1=`uniform sampler2D dfgLUT;
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
}`,o1=`
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
#endif`,l1=`#if defined( RE_IndirectDiffuse )
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
#endif`,c1=`#if defined( RE_IndirectDiffuse )
	#if defined( LAMBERT ) || defined( PHONG )
		irradiance += iblIrradiance;
	#endif
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,u1=`#ifdef USE_LIGHT_PROBES_GRID
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
#endif`,f1=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,h1=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,d1=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,p1=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,m1=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,g1=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,_1=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
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
#endif`,v1=`#if defined( USE_POINTS_UV )
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
#endif`,x1=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,S1=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,y1=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,M1=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,E1=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,b1=`#ifdef USE_MORPHTARGETS
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
#endif`,T1=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,A1=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
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
vec3 nonPerturbedNormal = normal;`,R1=`#ifdef USE_NORMALMAP_OBJECTSPACE
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
#endif`,w1=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,C1=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,N1=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
		#ifdef FLIP_SIDED
			vBitangent = - vBitangent;
		#endif
	#endif
#endif`,D1=`#ifdef USE_NORMALMAP
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
#endif`,U1=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,L1=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,O1=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,P1=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,I1=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,z1=`vec3 packNormalToRGB( const in vec3 normal ) {
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
}`,B1=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,F1=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,H1=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,G1=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,V1=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,k1=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,X1=`#if NUM_SPOT_LIGHT_COORDS > 0
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
#endif`,W1=`#if NUM_SPOT_LIGHT_COORDS > 0
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
#endif`,q1=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_SUN_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
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
#endif`,Y1=`float getShadowMask() {
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
}`,j1=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,Z1=`#ifdef USE_SKINNING
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
#endif`,K1=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,Q1=`#ifdef USE_SKINNING
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
#endif`,J1=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,$1=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,tA=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,eA=`#ifndef saturate
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
vec3 CustomToneMapping( vec3 color ) { return color; }`,nA=`#ifdef USE_TRANSMISSION
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
#endif`,iA=`#ifdef USE_TRANSMISSION
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
#endif`,aA=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,sA=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,rA=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,oA=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`;const lA=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,cA=`uniform sampler2D t2D;
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
}`,uA=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,fA=`#ifdef ENVMAP_TYPE_CUBE
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
}`,hA=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,dA=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,pA=`#include <common>
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
}`,mA=`#if DEPTH_PACKING == 3200
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
}`,gA=`#define DISTANCE
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
}`,_A=`#define DISTANCE
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
}`,vA=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,xA=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,SA=`uniform float scale;
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
}`,yA=`uniform vec3 diffuse;
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
}`,MA=`#include <common>
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
}`,EA=`uniform vec3 diffuse;
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
}`,bA=`#define LAMBERT
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
}`,TA=`#define LAMBERT
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
}`,AA=`#define MATCAP
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
}`,RA=`#define MATCAP
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
}`,wA=`#define NORMAL
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
}`,CA=`#define NORMAL
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
}`,NA=`#define PHONG
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
}`,DA=`#define PHONG
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
}`,UA=`#define STANDARD
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
}`,LA=`#define STANDARD
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
}`,OA=`#define TOON
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
}`,PA=`#define TOON
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
}`,IA=`uniform float size;
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
}`,zA=`uniform vec3 diffuse;
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
}`,BA=`#include <common>
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
}`,FA=`uniform vec3 color;
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
}`,HA=`uniform float rotation;
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
}`,GA=`uniform vec3 diffuse;
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
}`,ve={alphahash_fragment:lT,alphahash_pars_fragment:cT,alphamap_fragment:uT,alphamap_pars_fragment:fT,alphatest_fragment:hT,alphatest_pars_fragment:dT,aomap_fragment:pT,aomap_pars_fragment:mT,batching_pars_vertex:gT,batching_vertex:_T,begin_vertex:vT,beginnormal_vertex:xT,bsdfs:ST,iridescence_fragment:yT,bumpmap_pars_fragment:MT,clipping_planes_fragment:ET,clipping_planes_pars_fragment:bT,clipping_planes_pars_vertex:TT,clipping_planes_vertex:AT,color_fragment:RT,color_pars_fragment:wT,color_pars_vertex:CT,color_vertex:NT,common:DT,cube_uv_reflection_fragment:UT,defaultnormal_vertex:LT,displacementmap_pars_vertex:OT,displacementmap_vertex:PT,emissivemap_fragment:IT,emissivemap_pars_fragment:zT,colorspace_fragment:BT,colorspace_pars_fragment:FT,envmap_fragment:HT,envmap_common_pars_fragment:GT,envmap_pars_fragment:VT,envmap_pars_vertex:kT,envmap_physical_pars_fragment:t1,envmap_vertex:XT,fog_vertex:WT,fog_pars_vertex:qT,fog_fragment:YT,fog_pars_fragment:jT,gradientmap_pars_fragment:ZT,lightmap_pars_fragment:KT,lights_lambert_fragment:QT,lights_lambert_pars_fragment:JT,lights_pars_begin:$T,lights_toon_fragment:e1,lights_toon_pars_fragment:n1,lights_phong_fragment:i1,lights_phong_pars_fragment:a1,lights_physical_fragment:s1,lights_physical_pars_fragment:r1,lights_fragment_begin:o1,lights_fragment_maps:l1,lights_fragment_end:c1,lightprobes_pars_fragment:u1,logdepthbuf_fragment:f1,logdepthbuf_pars_fragment:h1,logdepthbuf_pars_vertex:d1,logdepthbuf_vertex:p1,map_fragment:m1,map_pars_fragment:g1,map_particle_fragment:_1,map_particle_pars_fragment:v1,metalnessmap_fragment:x1,metalnessmap_pars_fragment:S1,morphinstance_vertex:y1,morphcolor_vertex:M1,morphnormal_vertex:E1,morphtarget_pars_vertex:b1,morphtarget_vertex:T1,normal_fragment_begin:A1,normal_fragment_maps:R1,normal_pars_fragment:w1,normal_pars_vertex:C1,normal_vertex:N1,normalmap_pars_fragment:D1,clearcoat_normal_fragment_begin:U1,clearcoat_normal_fragment_maps:L1,clearcoat_pars_fragment:O1,iridescence_pars_fragment:P1,opaque_fragment:I1,packing:z1,premultiplied_alpha_fragment:B1,project_vertex:F1,dithering_fragment:H1,dithering_pars_fragment:G1,roughnessmap_fragment:V1,roughnessmap_pars_fragment:k1,shadowmap_pars_fragment:X1,shadowmap_pars_vertex:W1,shadowmap_vertex:q1,shadowmask_pars_fragment:Y1,skinbase_vertex:j1,skinning_pars_vertex:Z1,skinning_vertex:K1,skinnormal_vertex:Q1,specularmap_fragment:J1,specularmap_pars_fragment:$1,tonemapping_fragment:tA,tonemapping_pars_fragment:eA,transmission_fragment:nA,transmission_pars_fragment:iA,uv_pars_fragment:aA,uv_pars_vertex:sA,uv_vertex:rA,worldpos_vertex:oA,background_vert:lA,background_frag:cA,backgroundCube_vert:uA,backgroundCube_frag:fA,cube_vert:hA,cube_frag:dA,depth_vert:pA,depth_frag:mA,distance_vert:gA,distance_frag:_A,equirect_vert:vA,equirect_frag:xA,linedashed_vert:SA,linedashed_frag:yA,meshbasic_vert:MA,meshbasic_frag:EA,meshlambert_vert:bA,meshlambert_frag:TA,meshmatcap_vert:AA,meshmatcap_frag:RA,meshnormal_vert:wA,meshnormal_frag:CA,meshphong_vert:NA,meshphong_frag:DA,meshphysical_vert:UA,meshphysical_frag:LA,meshtoon_vert:OA,meshtoon_frag:PA,points_vert:IA,points_frag:zA,shadow_vert:BA,shadow_frag:FA,sprite_vert:HA,sprite_frag:GA},Xt={common:{diffuse:{value:new Me(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new de},alphaMap:{value:null},alphaMapTransform:{value:new de},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new de}},envmap:{envMap:{value:null},envMapRotation:{value:new de},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98},dfgLUT:{value:null}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new de}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new de}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new de},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new de},normalScale:{value:new le(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new de},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new de}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new de}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new de}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new Me(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},sunLights:{value:[],properties:{direction:{},color:{}}},sunLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},sunShadowMatrix:{value:[]},sunShadowCascade:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null},probesSH:{value:null},probesMin:{value:new nt},probesMax:{value:new nt},probesResolution:{value:new nt}},points:{diffuse:{value:new Me(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new de},alphaTest:{value:0},uvTransform:{value:new de}},sprite:{diffuse:{value:new Me(16777215)},opacity:{value:1},center:{value:new le(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new de},alphaMap:{value:null},alphaMapTransform:{value:new de},alphaTest:{value:0}}},pa={basic:{uniforms:Zn([Xt.common,Xt.specularmap,Xt.envmap,Xt.aomap,Xt.lightmap,Xt.fog]),vertexShader:ve.meshbasic_vert,fragmentShader:ve.meshbasic_frag},lambert:{uniforms:Zn([Xt.common,Xt.specularmap,Xt.envmap,Xt.aomap,Xt.lightmap,Xt.emissivemap,Xt.bumpmap,Xt.normalmap,Xt.displacementmap,Xt.fog,Xt.lights,{emissive:{value:new Me(0)},envMapIntensity:{value:1}}]),vertexShader:ve.meshlambert_vert,fragmentShader:ve.meshlambert_frag},phong:{uniforms:Zn([Xt.common,Xt.specularmap,Xt.envmap,Xt.aomap,Xt.lightmap,Xt.emissivemap,Xt.bumpmap,Xt.normalmap,Xt.displacementmap,Xt.fog,Xt.lights,{emissive:{value:new Me(0)},specular:{value:new Me(1118481)},shininess:{value:30},envMapIntensity:{value:1}}]),vertexShader:ve.meshphong_vert,fragmentShader:ve.meshphong_frag},standard:{uniforms:Zn([Xt.common,Xt.envmap,Xt.aomap,Xt.lightmap,Xt.emissivemap,Xt.bumpmap,Xt.normalmap,Xt.displacementmap,Xt.roughnessmap,Xt.metalnessmap,Xt.fog,Xt.lights,{emissive:{value:new Me(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:ve.meshphysical_vert,fragmentShader:ve.meshphysical_frag},toon:{uniforms:Zn([Xt.common,Xt.aomap,Xt.lightmap,Xt.emissivemap,Xt.bumpmap,Xt.normalmap,Xt.displacementmap,Xt.gradientmap,Xt.fog,Xt.lights,{emissive:{value:new Me(0)}}]),vertexShader:ve.meshtoon_vert,fragmentShader:ve.meshtoon_frag},matcap:{uniforms:Zn([Xt.common,Xt.bumpmap,Xt.normalmap,Xt.displacementmap,Xt.fog,{matcap:{value:null}}]),vertexShader:ve.meshmatcap_vert,fragmentShader:ve.meshmatcap_frag},points:{uniforms:Zn([Xt.points,Xt.fog]),vertexShader:ve.points_vert,fragmentShader:ve.points_frag},dashed:{uniforms:Zn([Xt.common,Xt.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:ve.linedashed_vert,fragmentShader:ve.linedashed_frag},depth:{uniforms:Zn([Xt.common,Xt.displacementmap]),vertexShader:ve.depth_vert,fragmentShader:ve.depth_frag},normal:{uniforms:Zn([Xt.common,Xt.bumpmap,Xt.normalmap,Xt.displacementmap,{opacity:{value:1}}]),vertexShader:ve.meshnormal_vert,fragmentShader:ve.meshnormal_frag},sprite:{uniforms:Zn([Xt.sprite,Xt.fog]),vertexShader:ve.sprite_vert,fragmentShader:ve.sprite_frag},background:{uniforms:{uvTransform:{value:new de},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:ve.background_vert,fragmentShader:ve.background_frag},backgroundCube:{uniforms:{envMap:{value:null},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new de}},vertexShader:ve.backgroundCube_vert,fragmentShader:ve.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:ve.cube_vert,fragmentShader:ve.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:ve.equirect_vert,fragmentShader:ve.equirect_frag},distance:{uniforms:Zn([Xt.common,Xt.displacementmap,{referencePosition:{value:new nt},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:ve.distance_vert,fragmentShader:ve.distance_frag},shadow:{uniforms:Zn([Xt.lights,Xt.fog,{color:{value:new Me(0)},opacity:{value:1}}]),vertexShader:ve.shadow_vert,fragmentShader:ve.shadow_frag}};pa.physical={uniforms:Zn([pa.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new de},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new de},clearcoatNormalScale:{value:new le(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new de},dispersion:{value:0},retroreflectivity:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new de},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new de},sheen:{value:0},sheenColor:{value:new Me(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new de},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new de},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new de},transmissionSamplerSize:{value:new le},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new de},attenuationDistance:{value:0},attenuationColor:{value:new Me(0)},specularColor:{value:new Me(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new de},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new de},anisotropyVector:{value:new le},anisotropyMap:{value:null},anisotropyMapTransform:{value:new de}}]),vertexShader:ve.meshphysical_vert,fragmentShader:ve.meshphysical_frag};const Uu={r:0,b:0,g:0},VA=new cn,NS=new de;NS.set(-1,0,0,0,1,0,0,0,1);function kA(o,e,i,s,l,f){const h=new Me(0);let d=l===!0?0:1,m,p,S=null,_=0,v=null;function M(U){let F=U.isScene===!0?U.background:null;if(F&&F.isTexture){const C=U.backgroundBlurriness>0;F=e.get(F,C)}return F}function A(U){let F=!1;const C=M(U);C===null?y(h,d):C&&C.isColor&&(y(C,1),F=!0);const D=o.xr.getEnvironmentBlendMode();D==="additive"?i.buffers.color.setClear(0,0,0,1,f):D==="alpha-blend"&&i.buffers.color.setClear(0,0,0,0,f),(o.autoClear||F)&&(i.buffers.depth.setTest(!0),i.buffers.depth.setMask(!0),i.buffers.color.setMask(!0),o.clear(o.autoClearColor,o.autoClearDepth,o.autoClearStencil))}function N(U,F){const C=M(F);C&&(C.isCubeTexture||C.mapping===Zu)?(p===void 0&&(p=new ze(new xi(1,1,1),new Sa({name:"BackgroundCubeMaterial",uniforms:xo(pa.backgroundCube.uniforms),vertexShader:pa.backgroundCube.vertexShader,fragmentShader:pa.backgroundCube.fragmentShader,side:ri,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),p.geometry.deleteAttribute("normal"),p.geometry.deleteAttribute("uv"),p.onBeforeRender=function(D,L,I){this.matrixWorld.copyPosition(I.matrixWorld)},Object.defineProperty(p.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),s.update(p)),p.material.uniforms.envMap.value=C,p.material.uniforms.backgroundBlurriness.value=F.backgroundBlurriness,p.material.uniforms.backgroundIntensity.value=F.backgroundIntensity,p.material.uniforms.backgroundRotation.value.setFromMatrix4(VA.makeRotationFromEuler(F.backgroundRotation)).transpose(),C.isCubeTexture&&C.isRenderTargetTexture===!1&&p.material.uniforms.backgroundRotation.value.premultiply(NS),p.material.toneMapped=Oe.getTransfer(C.colorSpace)!==je,(S!==C||_!==C.version||v!==o.toneMapping)&&(p.material.needsUpdate=!0,S=C,_=C.version,v=o.toneMapping),p.layers.enableAll(),U.unshift(p,p.geometry,p.material,0,0,null)):C&&C.isTexture&&(m===void 0&&(m=new ze(new vo(2,2),new Sa({name:"BackgroundMaterial",uniforms:xo(pa.background.uniforms),vertexShader:pa.background.vertexShader,fragmentShader:pa.background.fragmentShader,side:rr,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),m.geometry.deleteAttribute("normal"),Object.defineProperty(m.material,"map",{get:function(){return this.uniforms.t2D.value}}),s.update(m)),m.material.uniforms.t2D.value=C,m.material.uniforms.backgroundIntensity.value=F.backgroundIntensity,m.material.toneMapped=Oe.getTransfer(C.colorSpace)!==je,C.matrixAutoUpdate===!0&&C.updateMatrix(),m.material.uniforms.uvTransform.value.copy(C.matrix),(S!==C||_!==C.version||v!==o.toneMapping)&&(m.material.needsUpdate=!0,S=C,_=C.version,v=o.toneMapping),m.layers.enableAll(),U.unshift(m,m.geometry,m.material,0,0,null))}function y(U,F){U.getRGB(Uu,AS(o)),i.buffers.color.setClear(Uu.r,Uu.g,Uu.b,F,f)}function x(){p!==void 0&&(p.geometry.dispose(),p.material.dispose(),p=void 0),m!==void 0&&(m.geometry.dispose(),m.material.dispose(),m=void 0)}return{getClearColor:function(){return h},setClearColor:function(U,F=1){h.set(U),d=F,y(h,d)},getClearAlpha:function(){return d},setClearAlpha:function(U){d=U,y(h,d)},render:A,addToRenderList:N,dispose:x}}function XA(o,e){const i=o.getParameter(o.MAX_VERTEX_ATTRIBS),s={},l=v(null);let f=l,h=!1;function d(k,Q,st,Y,tt){let q=!1;const j=_(k,Y,st,Q);f!==j&&(f=j,p(f.object)),q=M(k,Y,st,tt),q&&A(k,Y,st,tt),tt!==null&&e.update(tt,o.ELEMENT_ARRAY_BUFFER),(q||h)&&(h=!1,C(k,Q,st,Y),tt!==null&&o.bindBuffer(o.ELEMENT_ARRAY_BUFFER,e.get(tt).buffer))}function m(){return o.createVertexArray()}function p(k){return o.bindVertexArray(k)}function S(k){return o.deleteVertexArray(k)}function _(k,Q,st,Y){const tt=Y.wireframe===!0;let q=s[Q.id];q===void 0&&(q={},s[Q.id]=q);const j=k.isInstancedMesh===!0?k.id:0;let dt=q[j];dt===void 0&&(dt={},q[j]=dt);let ut=dt[st.id];ut===void 0&&(ut={},dt[st.id]=ut);let rt=ut[tt];return rt===void 0&&(rt=v(m()),ut[tt]=rt),rt}function v(k){const Q=[],st=[],Y=[];for(let tt=0;tt<i;tt++)Q[tt]=0,st[tt]=0,Y[tt]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:Q,enabledAttributes:st,attributeDivisors:Y,object:k,attributes:{},index:null}}function M(k,Q,st,Y){const tt=f.attributes,q=Q.attributes;let j=0;const dt=st.getAttributes();for(const ut in dt)if(dt[ut].location>=0){const Tt=tt[ut];let Gt=q[ut];if(Gt===void 0&&(ut==="instanceMatrix"&&k.instanceMatrix&&(Gt=k.instanceMatrix),ut==="instanceColor"&&k.instanceColor&&(Gt=k.instanceColor)),Tt===void 0||Tt.attribute!==Gt||Gt&&Tt.data!==Gt.data)return!0;j++}return f.attributesNum!==j||f.index!==Y}function A(k,Q,st,Y){const tt={},q=Q.attributes;let j=0;const dt=st.getAttributes();for(const ut in dt)if(dt[ut].location>=0){let Tt=q[ut];Tt===void 0&&(ut==="instanceMatrix"&&k.instanceMatrix&&(Tt=k.instanceMatrix),ut==="instanceColor"&&k.instanceColor&&(Tt=k.instanceColor));const Gt={};Gt.attribute=Tt,Tt&&Tt.data&&(Gt.data=Tt.data),tt[ut]=Gt,j++}f.attributes=tt,f.attributesNum=j,f.index=Y}function N(){const k=f.newAttributes;for(let Q=0,st=k.length;Q<st;Q++)k[Q]=0}function y(k){x(k,0)}function x(k,Q){const st=f.newAttributes,Y=f.enabledAttributes,tt=f.attributeDivisors;st[k]=1,Y[k]===0&&(o.enableVertexAttribArray(k),Y[k]=1),tt[k]!==Q&&(o.vertexAttribDivisor(k,Q),tt[k]=Q)}function U(){const k=f.newAttributes,Q=f.enabledAttributes;for(let st=0,Y=Q.length;st<Y;st++)Q[st]!==k[st]&&(o.disableVertexAttribArray(st),Q[st]=0)}function F(k,Q,st,Y,tt,q,j){j===!0?o.vertexAttribIPointer(k,Q,st,tt,q):o.vertexAttribPointer(k,Q,st,Y,tt,q)}function C(k,Q,st,Y){N();const tt=Y.attributes,q=st.getAttributes(),j=Q.defaultAttributeValues;for(const dt in q){const ut=q[dt];if(ut.location>=0){let rt=tt[dt];if(rt===void 0&&(dt==="instanceMatrix"&&k.instanceMatrix&&(rt=k.instanceMatrix),dt==="instanceColor"&&k.instanceColor&&(rt=k.instanceColor)),rt!==void 0){const Tt=rt.normalized,Gt=rt.itemSize,Ot=e.get(rt);if(Ot===void 0)continue;const B=Ot.buffer,_t=Ot.type,Dt=Ot.bytesPerElement,Z=_t===o.INT||_t===o.UNSIGNED_INT||rt.gpuType===om;if(rt.isInterleavedBufferAttribute){const ft=rt.data,Ct=ft.stride,Pt=rt.offset;if(ft.isInstancedInterleavedBuffer){for(let vt=0;vt<ut.locationSize;vt++)x(ut.location+vt,ft.meshPerAttribute);k.isInstancedMesh!==!0&&Y._maxInstanceCount===void 0&&(Y._maxInstanceCount=ft.meshPerAttribute*ft.count)}else for(let vt=0;vt<ut.locationSize;vt++)y(ut.location+vt);o.bindBuffer(o.ARRAY_BUFFER,B);for(let vt=0;vt<ut.locationSize;vt++)F(ut.location+vt,Gt/ut.locationSize,_t,Tt,Ct*Dt,(Pt+Gt/ut.locationSize*vt)*Dt,Z)}else{if(rt.isInstancedBufferAttribute){for(let ft=0;ft<ut.locationSize;ft++)x(ut.location+ft,rt.meshPerAttribute);k.isInstancedMesh!==!0&&Y._maxInstanceCount===void 0&&(Y._maxInstanceCount=rt.meshPerAttribute*rt.count)}else for(let ft=0;ft<ut.locationSize;ft++)y(ut.location+ft);o.bindBuffer(o.ARRAY_BUFFER,B);for(let ft=0;ft<ut.locationSize;ft++)F(ut.location+ft,Gt/ut.locationSize,_t,Tt,Gt*Dt,Gt/ut.locationSize*ft*Dt,Z)}}else if(j!==void 0){const Tt=j[dt];if(Tt!==void 0)switch(Tt.length){case 2:o.vertexAttrib2fv(ut.location,Tt);break;case 3:o.vertexAttrib3fv(ut.location,Tt);break;case 4:o.vertexAttrib4fv(ut.location,Tt);break;default:o.vertexAttrib1fv(ut.location,Tt)}}}}U()}function D(){O();for(const k in s){const Q=s[k];for(const st in Q){const Y=Q[st];for(const tt in Y){const q=Y[tt];for(const j in q)S(q[j].object),delete q[j];delete Y[tt]}}delete s[k]}}function L(k){if(s[k.id]===void 0)return;const Q=s[k.id];for(const st in Q){const Y=Q[st];for(const tt in Y){const q=Y[tt];for(const j in q)S(q[j].object),delete q[j];delete Y[tt]}}delete s[k.id]}function I(k){for(const Q in s){const st=s[Q];for(const Y in st){const tt=st[Y];if(tt[k.id]===void 0)continue;const q=tt[k.id];for(const j in q)S(q[j].object),delete q[j];delete tt[k.id]}}}function T(k){for(const Q in s){const st=s[Q],Y=k.isInstancedMesh===!0?k.id:0,tt=st[Y];if(tt!==void 0){for(const q in tt){const j=tt[q];for(const dt in j)S(j[dt].object),delete j[dt];delete tt[q]}delete st[Y],Object.keys(st).length===0&&delete s[Q]}}}function O(){G(),h=!0,f!==l&&(f=l,p(f.object))}function G(){l.geometry=null,l.program=null,l.wireframe=!1}return{setup:d,reset:O,resetDefaultState:G,dispose:D,releaseStatesOfGeometry:L,releaseStatesOfObject:T,releaseStatesOfProgram:I,initAttributes:N,enableAttribute:y,disableUnusedAttributes:U}}function WA(o,e,i){let s;function l(m){s=m}function f(m,p){o.drawArrays(s,m,p),i.update(p,s,1)}function h(m,p,S){S!==0&&(o.drawArraysInstanced(s,m,p,S),i.update(p,s,S))}function d(m,p,S){if(S===0)return;e.get("WEBGL_multi_draw").multiDrawArraysWEBGL(s,m,0,p,0,S);let v=0;for(let M=0;M<S;M++)v+=p[M];i.update(v,s,1)}this.setMode=l,this.render=f,this.renderInstances=h,this.renderMultiDraw=d}function qA(o,e,i,s){let l;function f(){if(l!==void 0)return l;if(e.has("EXT_texture_filter_anisotropic")===!0){const I=e.get("EXT_texture_filter_anisotropic");l=o.getParameter(I.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else l=0;return l}function h(I){return!(I!==Zi&&s.convert(I)!==o.getParameter(o.IMPLEMENTATION_COLOR_READ_FORMAT))}function d(I){const T=I===xa&&(e.has("EXT_color_buffer_half_float")||e.has("EXT_color_buffer_float"));return!(I!==yi&&I!==ma&&!T&&s.convert(I)!==o.getParameter(o.IMPLEMENTATION_COLOR_READ_TYPE))}function m(I){if(I==="highp"){if(o.getShaderPrecisionFormat(o.VERTEX_SHADER,o.HIGH_FLOAT).precision>0&&o.getShaderPrecisionFormat(o.FRAGMENT_SHADER,o.HIGH_FLOAT).precision>0)return"highp";I="mediump"}return I==="mediump"&&o.getShaderPrecisionFormat(o.VERTEX_SHADER,o.MEDIUM_FLOAT).precision>0&&o.getShaderPrecisionFormat(o.FRAGMENT_SHADER,o.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let p=i.precision!==void 0?i.precision:"highp";const S=m(p);S!==p&&(oe("WebGLRenderer:",p,"not supported, using",S,"instead."),p=S);const _=i.logarithmicDepthBuffer===!0,v=i.reversedDepthBuffer===!0&&e.has("EXT_clip_control");i.reversedDepthBuffer===!0&&v===!1&&oe("WebGLRenderer: Unable to use reversed depth buffer due to missing EXT_clip_control extension. Fallback to default depth buffer.");const M=o.getParameter(o.MAX_TEXTURE_IMAGE_UNITS),A=o.getParameter(o.MAX_VERTEX_TEXTURE_IMAGE_UNITS),N=o.getParameter(o.MAX_TEXTURE_SIZE),y=o.getParameter(o.MAX_CUBE_MAP_TEXTURE_SIZE),x=o.getParameter(o.MAX_VERTEX_ATTRIBS),U=o.getParameter(o.MAX_VERTEX_UNIFORM_VECTORS),F=o.getParameter(o.MAX_VARYING_VECTORS),C=o.getParameter(o.MAX_FRAGMENT_UNIFORM_VECTORS),D=o.getParameter(o.MAX_SAMPLES),L=o.getParameter(o.SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:f,getMaxPrecision:m,textureFormatReadable:h,textureTypeReadable:d,precision:p,logarithmicDepthBuffer:_,reversedDepthBuffer:v,maxTextures:M,maxVertexTextures:A,maxTextureSize:N,maxCubemapSize:y,maxAttributes:x,maxVertexUniforms:U,maxVaryings:F,maxFragmentUniforms:C,maxSamples:D,samples:L}}function YA(o){const e=this;let i=null,s=0,l=!1,f=!1;const h=new Ga,d=new de,m={value:null,needsUpdate:!1};this.uniform=m,this.numPlanes=0,this.numIntersection=0,this.init=function(_,v){const M=_.length!==0||v||s!==0||l;return l=v,s=_.length,M},this.beginShadows=function(){f=!0,S(null)},this.endShadows=function(){f=!1},this.setGlobalState=function(_,v){i=S(_,v,0)},this.setState=function(_,v,M){const A=_.clippingPlanes,N=_.clipIntersection,y=_.clipShadows,x=o.get(_);if(!l||A===null||A.length===0||f&&!y)f?S(null):p();else{const U=f?0:s,F=U*4;let C=x.clippingState||null;m.value=C,C=S(A,v,F,M);for(let D=0;D!==F;++D)C[D]=i[D];x.clippingState=C,this.numIntersection=N?this.numPlanes:0,this.numPlanes+=U}};function p(){m.value!==i&&(m.value=i,m.needsUpdate=s>0),e.numPlanes=s,e.numIntersection=0}function S(_,v,M,A){const N=_!==null?_.length:0;let y=null;if(N!==0){if(y=m.value,A!==!0||y===null){const x=M+N*4,U=v.matrixWorldInverse;d.getNormalMatrix(U),(y===null||y.length<x)&&(y=new Float32Array(x));for(let F=0,C=M;F!==N;++F,C+=4)h.copy(_[F]).applyMatrix4(U,d),h.normal.toArray(y,C),y[C+3]=h.constant}m.value=y,m.needsUpdate=!0}return e.numPlanes=N,e.numIntersection=0,y}}const ho=4,jA=6,ZA=20,KA=256,bl=new Tm,Rx=new Me;let rp=null,op=0,lp=0,cp=!1;const QA=new nt,ir=new nt;class wx{constructor(e){this._renderer=e,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._sizeLods=[],this._lodMeshes=[],this._backgroundBox=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._blurMaterial=null,this._ggxMaterial=null}fromScene(e,i=0,s=.1,l=100,f={}){const{size:h=256,position:d=QA}=f;rp=this._renderer.getRenderTarget(),op=this._renderer.getActiveCubeFace(),lp=this._renderer.getActiveMipmapLevel(),cp=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(h);const m=this._allocateTargets();return m.depthBuffer=!0,this._sceneToCubeUV(e,s,l,m,d),i>0&&this._blur(m,0,0,i),this._applyPMREM(m),this._cleanup(m),m}fromEquirectangular(e,i=null){return this._fromTexture(e,i)}fromCubemap(e,i=null){return this._fromTexture(e,i)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=Dx(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=Nx(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose(),this._backgroundBox!==null&&(this._backgroundBox.geometry.dispose(),this._backgroundBox.material.dispose())}_setSize(e){this._lodMax=Math.floor(Math.log2(e)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._ggxMaterial!==null&&this._ggxMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let e=0;e<this._lodMeshes.length;e++)this._lodMeshes[e].geometry.dispose()}_cleanup(e){this._renderer.setRenderTarget(rp,op,lp),this._renderer.xr.enabled=cp,e.scissorTest=!1,co(e,0,0,e.width,e.height)}_fromTexture(e,i){e.mapping===or||e.mapping===_o?this._setSize(e.image.length===0?16:e.image[0].width||e.image[0].image.width):this._setSize(e.image.width/4),rp=this._renderer.getRenderTarget(),op=this._renderer.getActiveCubeFace(),lp=this._renderer.getActiveMipmapLevel(),cp=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;const s=i||this._allocateTargets();return this._textureToCubeUV(e,s),this._applyPMREM(s),this._cleanup(s),s}_allocateTargets(){const e=3*Math.max(this._cubeSize,112),i=4*this._cubeSize,s={magFilter:kn,minFilter:kn,generateMipmaps:!1,type:xa,format:Zi,colorSpace:ku,depthBuffer:!1},l=Cx(e,i,s);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==e||this._pingPongRenderTarget.height!==i){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=Cx(e,i,s);const{_lodMax:f}=this;({lodMeshes:this._lodMeshes,sizeLods:this._sizeLods}=JA(f)),this._blurMaterial=tR(f,e,i),this._ggxMaterial=$A(f,e,i)}return l}_compileMaterial(e){const i=new ze(new Jn,e);this._renderer.compile(i,bl)}_sceneToCubeUV(e,i,s,l,f){const m=new Si(90,1,i,s),p=[1,-1,1,1,1,1],S=[1,1,1,-1,-1,-1],_=this._renderer,v=_.autoClear,M=_.toneMapping;_.getClearColor(Rx),_.toneMapping=_a,_.autoClear=!1,_.state.buffers.depth.getReversed()&&(_.setRenderTarget(l),_.clearDepth(),_.setRenderTarget(null)),this._backgroundBox===null&&(this._backgroundBox=new ze(new xi,new vm({name:"PMREM.Background",side:ri,depthWrite:!1,depthTest:!1})));const N=this._backgroundBox,y=N.material;let x=!1;const U=e.background;U?U.isColor&&(y.color.copy(U),e.background=null,x=!0):(y.color.copy(Rx),x=!0);for(let F=0;F<6;F++){const C=F%3;C===0?(m.up.set(0,p[F],0),m.position.set(f.x,f.y,f.z),m.lookAt(f.x+S[F],f.y,f.z)):C===1?(m.up.set(0,0,p[F]),m.position.set(f.x,f.y,f.z),m.lookAt(f.x,f.y+S[F],f.z)):(m.up.set(0,p[F],0),m.position.set(f.x,f.y,f.z),m.lookAt(f.x,f.y,f.z+S[F]));const D=this._cubeSize;co(l,C*D,F>2?D:0,D,D),_.setRenderTarget(l),x&&_.render(N,m),_.render(e,m)}_.toneMapping=M,_.autoClear=v,e.background=U}_textureToCubeUV(e,i){const s=this._renderer,l=e.mapping===or||e.mapping===_o;l?(this._cubemapMaterial===null&&(this._cubemapMaterial=Dx()),this._cubemapMaterial.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=Nx());const f=l?this._cubemapMaterial:this._equirectMaterial,h=this._lodMeshes[0];h.material=f;const d=f.uniforms;d.envMap.value=e;const m=this._cubeSize;co(i,0,0,3*m,2*m),s.setRenderTarget(i),s.render(h,bl)}_applyPMREM(e){const i=this._renderer,s=i.autoClear;i.autoClear=!1;const l=this._lodMeshes.length;for(let f=1;f<l;f++)this._applyGGXFilter(e,f-1,f);i.autoClear=s}_applyGGXFilter(e,i,s){const l=this._renderer,f=this._pingPongRenderTarget,h=this._ggxMaterial,d=this._lodMeshes[s];d.material=h;const m=h.uniforms,p=s/(this._lodMeshes.length-1),S=i/(this._lodMeshes.length-1),_=Math.sqrt(p*p-S*S),v=p*1.25,M=_*v,{_lodMax:A}=this,N=this._sizeLods[s],y=3*N*(s>A-ho?s-A+ho:0),x=4*(this._cubeSize-N);m.envMap.value=e.texture,m.roughness.value=M,m.mipInt.value=A-i,co(f,y,x,3*N,2*N),l.setRenderTarget(f),l.render(d,bl),m.envMap.value=f.texture,m.roughness.value=0,m.mipInt.value=A-s,co(e,y,x,3*N,2*N),l.setRenderTarget(e),l.render(d,bl)}_blur(e,i,s,l){const f=this._pingPongRenderTarget,h=Math.min(l,Math.PI)/Math.SQRT2;this._blurPass(e,f,i,s,h),this._blurPass(f,e,s,s,h)}_blurPass(e,i,s,l,f){const h=this._renderer,d=this._blurMaterial,m=this._lodMeshes[l];m.material=d;const p=d.uniforms;p.envMap.value=e.texture,p.sigma.value=f,p.mipInt.value=this._lodMax-s;const S=this._sizeLods[l],_=3*S*(l>this._lodMax-ho?l-this._lodMax+ho:0),v=4*(this._cubeSize-S);co(i,_,v,3*S,2*S),h.setRenderTarget(i),h.render(m,bl)}}function JA(o){const e=[],i=[];let s=o;const l=o-ho+1+jA;for(let f=0;f<l;f++){const h=Math.pow(2,s);e.push(h);const d=1/(h-2),m=-d,p=1+d,S=[m,m,p,m,p,p,m,m,p,p,m,p],_=6,v=6,M=3,A=new Float32Array(M*v*_),N=new Float32Array(M*v*_);for(let x=0;x<_;x++){const U=x%3*2/3-1,F=x>2?0:-1,C=[U,F,0,U+2/3,F,0,U+2/3,F+1,0,U,F,0,U+2/3,F+1,0,U,F+1,0];A.set(C,M*v*x);for(let D=0;D<v;D++){const L=S[D*2]*2-1,I=S[D*2+1]*2-1;x===0?ir.set(1,I,L):x===1?ir.set(-L,1,-I):x===2?ir.set(-L,I,1):x===3?ir.set(-1,I,-L):x===4?ir.set(-L,-1,I):ir.set(L,I,-1),ir.toArray(N,(x*v+D)*M)}}const y=new Jn;y.setAttribute("position",new Wa(A,M)),y.setAttribute("outputDirection",new Wa(N,M)),i.push(new ze(y,null)),s>ho&&s--}return{lodMeshes:i,sizeLods:e}}function Cx(o,e,i){const s=new Ki(o,e,i);return s.texture.mapping=Zu,s.texture.name="PMREM.cubeUv",s.scissorTest=!0,s}function co(o,e,i,s,l){o.viewport.set(e,i,s,l),o.scissor.set(e,i,s,l)}function $A(o,e,i){return new Sa({name:"PMREMGGXConvolution",defines:{GGX_SAMPLES:KA,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/i,CUBEUV_MAX_MIP:`${o}.0`},uniforms:{envMap:{value:null},roughness:{value:0},mipInt:{value:0}},vertexShader:Qu(),fragmentShader:`

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
		`,blending:ka,depthTest:!1,depthWrite:!1})}function tR(o,e,i){return new Sa({name:"SphericalGaussianBlur",defines:{SAMPLES:ZA,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/i,CUBEUV_MAX_MIP:`${o}.0`},uniforms:{envMap:{value:null},sigma:{value:0},mipInt:{value:0}},vertexShader:Qu(),fragmentShader:`

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
		`,blending:ka,depthTest:!1,depthWrite:!1})}function Nx(){return new Sa({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:Qu(),fragmentShader:`

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
		`,blending:ka,depthTest:!1,depthWrite:!1})}function Dx(){return new Sa({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:Qu(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:ka,depthTest:!1,depthWrite:!1})}function Qu(){return`

		precision mediump float;
		precision mediump int;

		attribute vec3 outputDirection;

		varying vec3 vOutputDirection;

		void main() {

			vOutputDirection = outputDirection;
			gl_Position = vec4( position, 1.0 );

		}
	`}class DS extends Ki{constructor(e=1,i={}){super(e,e,i),this.isWebGLCubeRenderTarget=!0;const s={width:e,height:e,depth:1},l=[s,s,s,s,s,s];this.texture=new bS(l),this._setTextureOptions(i),this.texture.isRenderTargetTexture=!0}fromEquirectangularTexture(e,i){this.texture.type=i.type,this.texture.colorSpace=i.colorSpace,this.texture.generateMipmaps=i.generateMipmaps,this.texture.minFilter=i.minFilter,this.texture.magFilter=i.magFilter;const s={uniforms:{tEquirect:{value:null}},vertexShader:`

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
			`},l=new xi(5,5,5),f=new Sa({name:"CubemapFromEquirect",uniforms:xo(s.uniforms),vertexShader:s.vertexShader,fragmentShader:s.fragmentShader,side:ri,blending:ka});f.uniforms.tEquirect.value=i;const h=new ze(l,f),d=i.minFilter;return i.minFilter===ar&&(i.minFilter=kn),new nT(1,10,this).update(e,h),i.minFilter=d,h.geometry.dispose(),h.material.dispose(),this}clear(e,i=!0,s=!0,l=!0){const f=e.getRenderTarget();for(let h=0;h<6;h++)e.setRenderTarget(this,h),e.clear(i,s,l);e.setRenderTarget(f)}}function eR(o){let e=new WeakMap,i=new WeakMap,s=null;function l(v,M=!1){return v==null?null:M?h(v):f(v)}function f(v){if(v&&v.isTexture){const M=v.mapping;if(M===Ud||M===Ld)if(e.has(v)){const A=e.get(v).texture;return d(A,v.mapping)}else{const A=v.image;if(A&&A.height>0){const N=new DS(A.height);return N.fromEquirectangularTexture(o,v),e.set(v,N),v.addEventListener("dispose",p),d(N.texture,v.mapping)}else return null}}return v}function h(v){if(v&&v.isTexture){const M=v.mapping,A=M===Ud||M===Ld,N=M===or||M===_o;if(A||N){let y=i.get(v);const x=y!==void 0?y.texture.pmremVersion:0;if(v.isRenderTargetTexture&&v.pmremVersion!==x)return s===null&&(s=new wx(o)),y=A?s.fromEquirectangular(v,y):s.fromCubemap(v,y),y.texture.pmremVersion=v.pmremVersion,i.set(v,y),y.texture;if(y!==void 0)return y.texture;{const U=v.image;return A&&U&&U.height>0||N&&U&&m(U)?(s===null&&(s=new wx(o)),y=A?s.fromEquirectangular(v):s.fromCubemap(v),y.texture.pmremVersion=v.pmremVersion,i.set(v,y),v.addEventListener("dispose",S),y.texture):null}}}return v}function d(v,M){return M===Ud?v.mapping=or:M===Ld&&(v.mapping=_o),v}function m(v){let M=0;const A=6;for(let N=0;N<A;N++)v[N]!==void 0&&M++;return M===A}function p(v){const M=v.target;M.removeEventListener("dispose",p);const A=e.get(M);A!==void 0&&(e.delete(M),A.dispose())}function S(v){const M=v.target;M.removeEventListener("dispose",S);const A=i.get(M);A!==void 0&&(i.delete(M),A.dispose())}function _(){e=new WeakMap,i=new WeakMap,s!==null&&(s.dispose(),s=null)}return{get:l,dispose:_}}function nR(o){const e={};function i(s){if(e[s]!==void 0)return e[s];const l=o.getExtension(s);return e[s]=l,l}return{has:function(s){return i(s)!==null},init:function(){i("EXT_color_buffer_float"),i("WEBGL_clip_cull_distance"),i("OES_texture_float_linear"),i("EXT_color_buffer_half_float"),i("WEBGL_multisampled_render_to_texture"),i("WEBGL_render_shared_exponent")},get:function(s){const l=i(s);return l===null&&mo("WebGLRenderer: "+s+" extension not supported."),l}}}function iR(o,e,i,s){const l={},f=new WeakMap;function h(_){const v=_.target;v.index!==null&&e.remove(v.index);for(const A in v.attributes)e.remove(v.attributes[A]);v.removeEventListener("dispose",h),delete l[v.id];const M=f.get(v);M&&(e.remove(M),f.delete(v)),s.releaseStatesOfGeometry(v),v.isInstancedBufferGeometry===!0&&delete v._maxInstanceCount,i.memory.geometries--}function d(_,v){return l[v.id]===!0||(v.addEventListener("dispose",h),l[v.id]=!0,i.memory.geometries++),v}function m(_){const v=_.attributes;for(const M in v)e.update(v[M],o.ARRAY_BUFFER)}function p(_){const v=[],M=_.index,A=_.attributes.position;let N=0;if(A===void 0)return;if(M!==null){const U=M.array;N=M.version;for(let F=0,C=U.length;F<C;F+=3){const D=U[F+0],L=U[F+1],I=U[F+2];v.push(D,L,L,I,I,D)}}else{const U=A.array;N=A.version;for(let F=0,C=U.length/3-1;F<C;F+=3){const D=F+0,L=F+1,I=F+2;v.push(D,L,L,I,I,D)}}const y=new(A.count>=65535?MS:yS)(v,1);y.version=N;const x=f.get(_);x&&e.remove(x),f.set(_,y)}function S(_){const v=f.get(_);if(v){const M=_.index;M!==null&&v.version<M.version&&p(_)}else p(_);return f.get(_)}return{get:d,update:m,getWireframeAttribute:S}}function aR(o,e,i){let s;function l(_){s=_}let f,h;function d(_){f=_.type,h=_.bytesPerElement}function m(_,v){o.drawElements(s,v,f,_*h),i.update(v,s,1)}function p(_,v,M){M!==0&&(o.drawElementsInstanced(s,v,f,_*h,M),i.update(v,s,M))}function S(_,v,M){if(M===0)return;e.get("WEBGL_multi_draw").multiDrawElementsWEBGL(s,v,0,f,_,0,M);let N=0;for(let y=0;y<M;y++)N+=v[y];i.update(N,s,1)}this.setMode=l,this.setIndex=d,this.render=m,this.renderInstances=p,this.renderMultiDraw=S}function sR(o){const e={geometries:0,textures:0},i={frame:0,calls:0,triangles:0,points:0,lines:0};function s(f,h,d){switch(i.calls++,h){case o.TRIANGLES:i.triangles+=d*(f/3);break;case o.LINES:i.lines+=d*(f/2);break;case o.LINE_STRIP:i.lines+=d*(f-1);break;case o.LINE_LOOP:i.lines+=d*f;break;case o.POINTS:i.points+=d*f;break;default:Fe("WebGLInfo: Unknown draw mode:",h);break}}function l(){i.calls=0,i.triangles=0,i.points=0,i.lines=0}return{memory:e,render:i,programs:null,autoReset:!0,reset:l,update:s}}function rR(o,e,i){const s=new WeakMap,l=new ln;function f(h,d,m){const p=h.morphTargetInfluences,S=d.morphAttributes.position||d.morphAttributes.normal||d.morphAttributes.color,_=S!==void 0?S.length:0;let v=s.get(d);if(v===void 0||v.count!==_){let G=function(){T.dispose(),s.delete(d),d.removeEventListener("dispose",G)};var M=G;v!==void 0&&v.texture.dispose();const A=d.morphAttributes.position!==void 0,N=d.morphAttributes.normal!==void 0,y=d.morphAttributes.color!==void 0,x=d.morphAttributes.position||[],U=d.morphAttributes.normal||[],F=d.morphAttributes.color||[];let C=0;A===!0&&(C=1),N===!0&&(C=2),y===!0&&(C=3);let D=d.attributes.position.count*C,L=1;D>e.maxTextureSize&&(L=Math.ceil(D/e.maxTextureSize),D=e.maxTextureSize);const I=new Float32Array(D*L*4*_),T=new vS(I,D,L,_);T.type=ma,T.needsUpdate=!0;const O=C*4;for(let k=0;k<_;k++){const Q=x[k],st=U[k],Y=F[k],tt=D*L*4*k;for(let q=0;q<Q.count;q++){const j=q*O;A===!0&&(l.fromBufferAttribute(Q,q),I[tt+j+0]=l.x,I[tt+j+1]=l.y,I[tt+j+2]=l.z,I[tt+j+3]=0),N===!0&&(l.fromBufferAttribute(st,q),I[tt+j+4]=l.x,I[tt+j+5]=l.y,I[tt+j+6]=l.z,I[tt+j+7]=0),y===!0&&(l.fromBufferAttribute(Y,q),I[tt+j+8]=l.x,I[tt+j+9]=l.y,I[tt+j+10]=l.z,I[tt+j+11]=Y.itemSize===4?l.w:1)}}v={count:_,texture:T,size:new le(D,L)},s.set(d,v),d.addEventListener("dispose",G)}if(h.isInstancedMesh===!0&&h.morphTexture!==null)m.getUniforms().setValue(o,"morphTexture",h.morphTexture,i);else{let A=0;for(let y=0;y<p.length;y++)A+=p[y];const N=d.morphTargetsRelative?1:1-A;m.getUniforms().setValue(o,"morphTargetBaseInfluence",N),m.getUniforms().setValue(o,"morphTargetInfluences",p)}m.getUniforms().setValue(o,"morphTargetsTexture",v.texture,i),m.getUniforms().setValue(o,"morphTargetsTextureSize",v.size)}return{update:f}}function oR(o,e,i,s,l){let f=new WeakMap;function h(p){const S=l.render.frame,_=p.geometry,v=e.get(p,_);if(f.get(v)!==S&&(e.update(v),f.set(v,S)),p.isInstancedMesh&&(p.hasEventListener("dispose",m)===!1&&p.addEventListener("dispose",m),f.get(p)!==S&&(i.update(p.instanceMatrix,o.ARRAY_BUFFER),p.instanceColor!==null&&i.update(p.instanceColor,o.ARRAY_BUFFER),f.set(p,S))),p.isSkinnedMesh){const M=p.skeleton;f.get(M)!==S&&(M.update(),f.set(M,S))}return v}function d(){f=new WeakMap}function m(p){const S=p.target;S.removeEventListener("dispose",m),s.releaseStatesOfObject(S),i.remove(S.instanceMatrix),S.instanceColor!==null&&i.remove(S.instanceColor)}return{update:h,dispose:d}}const lR={[nS]:"LINEAR_TONE_MAPPING",[iS]:"REINHARD_TONE_MAPPING",[aS]:"CINEON_TONE_MAPPING",[sS]:"ACES_FILMIC_TONE_MAPPING",[oS]:"AGX_TONE_MAPPING",[lS]:"NEUTRAL_TONE_MAPPING",[rS]:"CUSTOM_TONE_MAPPING"};function cR(o,e,i,s,l,f){const h=new Ki(e,i,{type:o,depthBuffer:l,stencilBuffer:f,samples:s?4:0,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,resolveDepthBuffer:!1,resolveStencilBuffer:!1});let d=null,m=null;const p=new Jn;p.setAttribute("position",new un([-1,3,0,-1,-1,0,3,-1,0],3)),p.setAttribute("uv",new un([0,2,0,0,2,0],2));const S=new Zb({uniforms:{tDiffuse:{value:null}},vertexShader:`
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
			}`,depthTest:!1,depthWrite:!1}),_=new ze(p,S),v=new Tm(-1,1,1,-1,0,1);let M=null,A=null,N=!1,y,x=null,U=[],F=!1;this.setSize=function(C,D){h.setSize(C,D),d!==null&&d.setSize(C,D),m!==null&&m.setSize(C,D);for(let L=0;L<U.length;L++){const I=U[L];I.setSize&&I.setSize(C,D)}},this.setEffects=function(C){U=C,F=U.length>0&&U[0].isRenderPass===!0;const D=h.width,L=h.height;U.length>0&&d===null&&(d=new Ki(D,L,{type:xa,depthBuffer:!1,stencilBuffer:!1}),m=new Ki(D,L,{type:xa,depthBuffer:!1,stencilBuffer:!1}));for(let I=0;I<U.length;I++){const T=U[I];T.setSize&&T.setSize(D,L)}},this.begin=function(C,D){if(N||C.toneMapping===_a&&U.length===0)return!1;if(x=D,D!==null){const L=D.width,I=D.height;(h.width!==L||h.height!==I)&&this.setSize(L,I)}return F===!1&&C.setRenderTarget(h),y=C.toneMapping,C.toneMapping=_a,!0},this.hasRenderPass=function(){return F},this.end=function(C,D){C.toneMapping=y,N=!0;let L=h,I=d;for(let T=0;T<U.length;T++){const O=U[T];O.enabled!==!1&&(O.render(C,I,L,D),O.needsSwap!==!1&&(L=I,I=I===d?m:d))}if(M!==C.outputColorSpace||A!==C.toneMapping){M=C.outputColorSpace,A=C.toneMapping,S.defines={},Oe.getTransfer(M)===je&&(S.defines.SRGB_TRANSFER="");const T=lR[A];T&&(S.defines[T]=""),S.needsUpdate=!0}S.uniforms.tDiffuse.value=L.texture,C.setRenderTarget(x),C.render(_,v),x=null,N=!1},this.isCompositing=function(){return N},this.dispose=function(){h.dispose(),d!==null&&d.dispose(),m!==null&&m.dispose(),p.dispose(),S.dispose()}}const US=new Qn,tm=new Pl(1,1),LS=new vS,OS=new bb,PS=new bS,Ux=[],Lx=[],Ox=new Float32Array(16),Px=new Float32Array(9),Ix=new Float32Array(4);function yo(o,e,i){const s=o[0];if(s<=0||s>0)return o;const l=e*i;let f=Ux[l];if(f===void 0&&(f=new Float32Array(l),Ux[l]=f),e!==0){s.toArray(f,0);for(let h=1,d=0;h!==e;++h)d+=i,o[h].toArray(f,d)}return f}function An(o,e){if(o.length!==e.length)return!1;for(let i=0,s=o.length;i<s;i++)if(o[i]!==e[i])return!1;return!0}function Rn(o,e){for(let i=0,s=e.length;i<s;i++)o[i]=e[i]}function Ju(o,e){let i=Lx[e];i===void 0&&(i=new Int32Array(e),Lx[e]=i);for(let s=0;s!==e;++s)i[s]=o.allocateTextureUnit();return i}function uR(o,e){const i=this.cache;i[0]!==e&&(o.uniform1f(this.addr,e),i[0]=e)}function fR(o,e){const i=this.cache;if(e.x!==void 0)(i[0]!==e.x||i[1]!==e.y)&&(o.uniform2f(this.addr,e.x,e.y),i[0]=e.x,i[1]=e.y);else{if(An(i,e))return;o.uniform2fv(this.addr,e),Rn(i,e)}}function hR(o,e){const i=this.cache;if(e.x!==void 0)(i[0]!==e.x||i[1]!==e.y||i[2]!==e.z)&&(o.uniform3f(this.addr,e.x,e.y,e.z),i[0]=e.x,i[1]=e.y,i[2]=e.z);else if(e.r!==void 0)(i[0]!==e.r||i[1]!==e.g||i[2]!==e.b)&&(o.uniform3f(this.addr,e.r,e.g,e.b),i[0]=e.r,i[1]=e.g,i[2]=e.b);else{if(An(i,e))return;o.uniform3fv(this.addr,e),Rn(i,e)}}function dR(o,e){const i=this.cache;if(e.x!==void 0)(i[0]!==e.x||i[1]!==e.y||i[2]!==e.z||i[3]!==e.w)&&(o.uniform4f(this.addr,e.x,e.y,e.z,e.w),i[0]=e.x,i[1]=e.y,i[2]=e.z,i[3]=e.w);else{if(An(i,e))return;o.uniform4fv(this.addr,e),Rn(i,e)}}function pR(o,e){const i=this.cache,s=e.elements;if(s===void 0){if(An(i,e))return;o.uniformMatrix2fv(this.addr,!1,e),Rn(i,e)}else{if(An(i,s))return;Ix.set(s),o.uniformMatrix2fv(this.addr,!1,Ix),Rn(i,s)}}function mR(o,e){const i=this.cache,s=e.elements;if(s===void 0){if(An(i,e))return;o.uniformMatrix3fv(this.addr,!1,e),Rn(i,e)}else{if(An(i,s))return;Px.set(s),o.uniformMatrix3fv(this.addr,!1,Px),Rn(i,s)}}function gR(o,e){const i=this.cache,s=e.elements;if(s===void 0){if(An(i,e))return;o.uniformMatrix4fv(this.addr,!1,e),Rn(i,e)}else{if(An(i,s))return;Ox.set(s),o.uniformMatrix4fv(this.addr,!1,Ox),Rn(i,s)}}function _R(o,e){const i=this.cache;i[0]!==e&&(o.uniform1i(this.addr,e),i[0]=e)}function vR(o,e){const i=this.cache;if(e.x!==void 0)(i[0]!==e.x||i[1]!==e.y)&&(o.uniform2i(this.addr,e.x,e.y),i[0]=e.x,i[1]=e.y);else{if(An(i,e))return;o.uniform2iv(this.addr,e),Rn(i,e)}}function xR(o,e){const i=this.cache;if(e.x!==void 0)(i[0]!==e.x||i[1]!==e.y||i[2]!==e.z)&&(o.uniform3i(this.addr,e.x,e.y,e.z),i[0]=e.x,i[1]=e.y,i[2]=e.z);else{if(An(i,e))return;o.uniform3iv(this.addr,e),Rn(i,e)}}function SR(o,e){const i=this.cache;if(e.x!==void 0)(i[0]!==e.x||i[1]!==e.y||i[2]!==e.z||i[3]!==e.w)&&(o.uniform4i(this.addr,e.x,e.y,e.z,e.w),i[0]=e.x,i[1]=e.y,i[2]=e.z,i[3]=e.w);else{if(An(i,e))return;o.uniform4iv(this.addr,e),Rn(i,e)}}function yR(o,e){const i=this.cache;i[0]!==e&&(o.uniform1ui(this.addr,e),i[0]=e)}function MR(o,e){const i=this.cache;if(e.x!==void 0)(i[0]!==e.x||i[1]!==e.y)&&(o.uniform2ui(this.addr,e.x,e.y),i[0]=e.x,i[1]=e.y);else{if(An(i,e))return;o.uniform2uiv(this.addr,e),Rn(i,e)}}function ER(o,e){const i=this.cache;if(e.x!==void 0)(i[0]!==e.x||i[1]!==e.y||i[2]!==e.z)&&(o.uniform3ui(this.addr,e.x,e.y,e.z),i[0]=e.x,i[1]=e.y,i[2]=e.z);else{if(An(i,e))return;o.uniform3uiv(this.addr,e),Rn(i,e)}}function bR(o,e){const i=this.cache;if(e.x!==void 0)(i[0]!==e.x||i[1]!==e.y||i[2]!==e.z||i[3]!==e.w)&&(o.uniform4ui(this.addr,e.x,e.y,e.z,e.w),i[0]=e.x,i[1]=e.y,i[2]=e.z,i[3]=e.w);else{if(An(i,e))return;o.uniform4uiv(this.addr,e),Rn(i,e)}}function TR(o,e,i){const s=this.cache,l=i.allocateTextureUnit();s[0]!==l&&(o.uniform1i(this.addr,l),s[0]=l);let f;this.type===o.SAMPLER_2D_SHADOW?(tm.compareFunction=i.isReversedDepthBuffer()?pm:dm,f=tm):f=US,i.setTexture2D(e||f,l)}function AR(o,e,i){const s=this.cache,l=i.allocateTextureUnit();s[0]!==l&&(o.uniform1i(this.addr,l),s[0]=l),i.setTexture3D(e||OS,l)}function RR(o,e,i){const s=this.cache,l=i.allocateTextureUnit();s[0]!==l&&(o.uniform1i(this.addr,l),s[0]=l),i.setTextureCube(e||PS,l)}function wR(o,e,i){const s=this.cache,l=i.allocateTextureUnit();s[0]!==l&&(o.uniform1i(this.addr,l),s[0]=l),i.setTexture2DArray(e||LS,l)}function CR(o){switch(o){case 5126:return uR;case 35664:return fR;case 35665:return hR;case 35666:return dR;case 35674:return pR;case 35675:return mR;case 35676:return gR;case 5124:case 35670:return _R;case 35667:case 35671:return vR;case 35668:case 35672:return xR;case 35669:case 35673:return SR;case 5125:return yR;case 36294:return MR;case 36295:return ER;case 36296:return bR;case 35678:case 36198:case 36298:case 36306:case 35682:return TR;case 35679:case 36299:case 36307:return AR;case 35680:case 36300:case 36308:case 36293:return RR;case 36289:case 36303:case 36311:case 36292:return wR}}function NR(o,e){o.uniform1fv(this.addr,e)}function DR(o,e){const i=yo(e,this.size,2);o.uniform2fv(this.addr,i)}function UR(o,e){const i=yo(e,this.size,3);o.uniform3fv(this.addr,i)}function LR(o,e){const i=yo(e,this.size,4);o.uniform4fv(this.addr,i)}function OR(o,e){const i=yo(e,this.size,4);o.uniformMatrix2fv(this.addr,!1,i)}function PR(o,e){const i=yo(e,this.size,9);o.uniformMatrix3fv(this.addr,!1,i)}function IR(o,e){const i=yo(e,this.size,16);o.uniformMatrix4fv(this.addr,!1,i)}function zR(o,e){o.uniform1iv(this.addr,e)}function BR(o,e){o.uniform2iv(this.addr,e)}function FR(o,e){o.uniform3iv(this.addr,e)}function HR(o,e){o.uniform4iv(this.addr,e)}function GR(o,e){o.uniform1uiv(this.addr,e)}function VR(o,e){o.uniform2uiv(this.addr,e)}function kR(o,e){o.uniform3uiv(this.addr,e)}function XR(o,e){o.uniform4uiv(this.addr,e)}function WR(o,e,i){const s=this.cache,l=e.length,f=Ju(i,l);An(s,f)||(o.uniform1iv(this.addr,f),Rn(s,f));let h;this.type===o.SAMPLER_2D_SHADOW?h=tm:h=US;for(let d=0;d!==l;++d)i.setTexture2D(e[d]||h,f[d])}function qR(o,e,i){const s=this.cache,l=e.length,f=Ju(i,l);An(s,f)||(o.uniform1iv(this.addr,f),Rn(s,f));for(let h=0;h!==l;++h)i.setTexture3D(e[h]||OS,f[h])}function YR(o,e,i){const s=this.cache,l=e.length,f=Ju(i,l);An(s,f)||(o.uniform1iv(this.addr,f),Rn(s,f));for(let h=0;h!==l;++h)i.setTextureCube(e[h]||PS,f[h])}function jR(o,e,i){const s=this.cache,l=e.length,f=Ju(i,l);An(s,f)||(o.uniform1iv(this.addr,f),Rn(s,f));for(let h=0;h!==l;++h)i.setTexture2DArray(e[h]||LS,f[h])}function ZR(o){switch(o){case 5126:return NR;case 35664:return DR;case 35665:return UR;case 35666:return LR;case 35674:return OR;case 35675:return PR;case 35676:return IR;case 5124:case 35670:return zR;case 35667:case 35671:return BR;case 35668:case 35672:return FR;case 35669:case 35673:return HR;case 5125:return GR;case 36294:return VR;case 36295:return kR;case 36296:return XR;case 35678:case 36198:case 36298:case 36306:case 35682:return WR;case 35679:case 36299:case 36307:return qR;case 35680:case 36300:case 36308:case 36293:return YR;case 36289:case 36303:case 36311:case 36292:return jR}}class KR{constructor(e,i,s){this.id=e,this.addr=s,this.cache=[],this.type=i.type,this.setValue=CR(i.type)}}class QR{constructor(e,i,s){this.id=e,this.addr=s,this.cache=[],this.type=i.type,this.size=i.size,this.setValue=ZR(i.type)}}class JR{constructor(e){this.id=e,this.seq=[],this.map={}}setValue(e,i,s){const l=this.seq;for(let f=0,h=l.length;f!==h;++f){const d=l[f];d.setValue(e,i[d.id],s)}}}const up=/(\w+)(\])?(\[|\.)?/g;function zx(o,e){o.seq.push(e),o.map[e.id]=e}function $R(o,e,i){const s=o.name,l=s.length;for(up.lastIndex=0;;){const f=up.exec(s),h=up.lastIndex;let d=f[1];const m=f[2]==="]",p=f[3];if(m&&(d=d|0),p===void 0||p==="["&&h+2===l){zx(i,p===void 0?new KR(d,o,e):new QR(d,o,e));break}else{let _=i.map[d];_===void 0&&(_=new JR(d),zx(i,_)),i=_}}}class Fu{constructor(e,i){this.seq=[],this.map={};const s=e.getProgramParameter(i,e.ACTIVE_UNIFORMS);for(let h=0;h<s;++h){const d=e.getActiveUniform(i,h),m=e.getUniformLocation(i,d.name);$R(d,m,this)}const l=[],f=[];for(const h of this.seq)h.type===e.SAMPLER_2D_SHADOW||h.type===e.SAMPLER_CUBE_SHADOW||h.type===e.SAMPLER_2D_ARRAY_SHADOW?l.push(h):f.push(h);l.length>0&&(this.seq=l.concat(f))}setValue(e,i,s,l){const f=this.map[i];f!==void 0&&f.setValue(e,s,l)}setOptional(e,i,s){const l=i[s];l!==void 0&&this.setValue(e,s,l)}static upload(e,i,s,l){for(let f=0,h=i.length;f!==h;++f){const d=i[f],m=s[d.id];m.needsUpdate!==!1&&d.setValue(e,m.value,l)}}static seqWithValue(e,i){const s=[];for(let l=0,f=e.length;l!==f;++l){const h=e[l];h.id in i&&s.push(h)}return s}}function Bx(o,e,i){const s=o.createShader(e);return o.shaderSource(s,i),o.compileShader(s),s}const tw=37297;let ew=0;function nw(o,e){const i=o.split(`
`),s=[],l=Math.max(e-6,0),f=Math.min(e+6,i.length);for(let h=l;h<f;h++){const d=h+1;s.push(`${d===e?">":" "} ${d}: ${i[h]}`)}return s.join(`
`)}const Fx=new de;function iw(o){Oe._getMatrix(Fx,Oe.workingColorSpace,o);const e=`mat3( ${Fx.elements.map(i=>i.toFixed(4))} )`;switch(Oe.getTransfer(o)){case Xu:return[e,"LinearTransferOETF"];case je:return[e,"sRGBTransferOETF"];default:return oe("WebGLProgram: Unsupported color space: ",o),[e,"LinearTransferOETF"]}}function Hx(o,e,i){const s=o.getShaderParameter(e,o.COMPILE_STATUS),f=(o.getShaderInfoLog(e)||"").trim();if(s&&f==="")return"";const h=/ERROR: 0:(\d+)/.exec(f);if(h){const d=parseInt(h[1]);return i.toUpperCase()+`

`+f+`

`+nw(o.getShaderSource(e),d)}else return f}function aw(o,e){const i=iw(e);return[`vec4 ${o}( vec4 value ) {`,`	return ${i[1]}( vec4( value.rgb * ${i[0]}, value.a ) );`,"}"].join(`
`)}const sw={[nS]:"Linear",[iS]:"Reinhard",[aS]:"Cineon",[sS]:"ACESFilmic",[oS]:"AgX",[lS]:"Neutral",[rS]:"Custom"};function rw(o,e){const i=sw[e];return i===void 0?(oe("WebGLProgram: Unsupported toneMapping:",e),"vec3 "+o+"( vec3 color ) { return LinearToneMapping( color ); }"):"vec3 "+o+"( vec3 color ) { return "+i+"ToneMapping( color ); }"}const Lu=new nt;function ow(){Oe.getLuminanceCoefficients(Lu);const o=Lu.x.toFixed(4),e=Lu.y.toFixed(4),i=Lu.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${o}, ${e}, ${i} );`,"	return dot( weights, rgb );","}"].join(`
`)}function lw(o){return[o.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",o.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(Rl).join(`
`)}function cw(o){const e=[];for(const i in o){const s=o[i];s!==!1&&e.push("#define "+i+" "+s)}return e.join(`
`)}function uw(o,e){const i={},s=o.getProgramParameter(e,o.ACTIVE_ATTRIBUTES);for(let l=0;l<s;l++){const f=o.getActiveAttrib(e,l),h=f.name;let d=1;f.type===o.FLOAT_MAT2&&(d=2),f.type===o.FLOAT_MAT3&&(d=3),f.type===o.FLOAT_MAT4&&(d=4),i[h]={type:f.type,location:o.getAttribLocation(e,h),locationSize:d}}return i}function Rl(o){return o!==""}function Gx(o,e){const i=e.numSpotLightShadows+e.numSpotLightMaps-e.numSpotLightShadowsWithMaps;return o.replace(/NUM_SUN_LIGHTS/g,e.numSunLights).replace(/NUM_DIR_LIGHTS/g,e.numDirLights).replace(/NUM_SPOT_LIGHTS/g,e.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,e.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,i).replace(/NUM_RECT_AREA_LIGHTS/g,e.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,e.numPointLights).replace(/NUM_HEMI_LIGHTS/g,e.numHemiLights).replace(/NUM_SUN_LIGHT_SHADOWS/g,e.numSunLightShadows).replace(/NUM_DIR_LIGHT_SHADOWS/g,e.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,e.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,e.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,e.numPointLightShadows)}function Vx(o,e){return o.replace(/NUM_CLIPPING_PLANES/g,e.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,e.numClippingPlanes-e.numClipIntersection)}const fw=/^[ \t]*#include +<([\w\d./]+)>/gm;function em(o){return o.replace(fw,dw)}const hw=new Map;function dw(o,e){let i=ve[e];if(i===void 0){const s=hw.get(e);if(s!==void 0)i=ve[s],oe('WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',e,s);else throw new Error("THREE.WebGLProgram: Can not resolve #include <"+e+">")}return em(i)}const pw=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function kx(o){return o.replace(pw,mw)}function mw(o,e,i,s){let l="";for(let f=parseInt(e);f<parseInt(i);f++)l+=s.replace(/\[\s*i\s*\]/g,"[ "+f+" ]").replace(/UNROLLED_LOOP_INDEX/g,f);return l}function Xx(o){let e=`precision ${o.precision} float;
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
#define LOW_PRECISION`),e}const gw={[wl]:"SHADOWMAP_TYPE_PCF",[Al]:"SHADOWMAP_TYPE_VSM"};function _w(o){return gw[o.shadowMapType]||"SHADOWMAP_TYPE_BASIC"}const vw={[or]:"ENVMAP_TYPE_CUBE",[_o]:"ENVMAP_TYPE_CUBE",[Zu]:"ENVMAP_TYPE_CUBE_UV"};function xw(o){return o.envMap===!1?"ENVMAP_TYPE_CUBE":vw[o.envMapMode]||"ENVMAP_TYPE_CUBE"}const Sw={[_o]:"ENVMAP_MODE_REFRACTION"};function yw(o){return o.envMap===!1?"ENVMAP_MODE_REFLECTION":Sw[o.envMapMode]||"ENVMAP_MODE_REFLECTION"}const Mw={[eS]:"ENVMAP_BLENDING_MULTIPLY",[tb]:"ENVMAP_BLENDING_MIX",[eb]:"ENVMAP_BLENDING_ADD"};function Ew(o){return o.envMap===!1?"ENVMAP_BLENDING_NONE":Mw[o.combine]||"ENVMAP_BLENDING_NONE"}function bw(o){const e=o.envMapCubeUVHeight;if(e===null)return null;const i=Math.log2(e)-2,s=1/e;return{texelWidth:1/(3*Math.max(Math.pow(2,i),112)),texelHeight:s,maxMip:i}}function Tw(o,e,i,s){const l=o.getContext(),f=i.defines;let h=i.vertexShader,d=i.fragmentShader;const m=_w(i),p=xw(i),S=yw(i),_=Ew(i),v=bw(i),M=lw(i),A=cw(f),N=l.createProgram();let y,x,U=i.glslVersion?"#version "+i.glslVersion+`
`:"";i.isRawShaderMaterial?(y=["#define SHADER_TYPE "+i.shaderType,"#define SHADER_NAME "+i.shaderName,A].filter(Rl).join(`
`),y.length>0&&(y+=`
`),x=["#define SHADER_TYPE "+i.shaderType,"#define SHADER_NAME "+i.shaderName,A].filter(Rl).join(`
`),x.length>0&&(x+=`
`)):(y=[Xx(i),"#define SHADER_TYPE "+i.shaderType,"#define SHADER_NAME "+i.shaderName,A,i.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",i.batching?"#define USE_BATCHING":"",i.batchingColor?"#define USE_BATCHING_COLOR":"",i.instancing?"#define USE_INSTANCING":"",i.instancingColor?"#define USE_INSTANCING_COLOR":"",i.instancingMorph?"#define USE_INSTANCING_MORPH":"",i.useFog&&i.fog?"#define USE_FOG":"",i.useFog&&i.fogExp2?"#define FOG_EXP2":"",i.map?"#define USE_MAP":"",i.envMap?"#define USE_ENVMAP":"",i.envMap?"#define "+S:"",i.lightMap?"#define USE_LIGHTMAP":"",i.aoMap?"#define USE_AOMAP":"",i.bumpMap?"#define USE_BUMPMAP":"",i.normalMap?"#define USE_NORMALMAP":"",i.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",i.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",i.displacementMap?"#define USE_DISPLACEMENTMAP":"",i.emissiveMap?"#define USE_EMISSIVEMAP":"",i.anisotropy?"#define USE_ANISOTROPY":"",i.anisotropyMap?"#define USE_ANISOTROPYMAP":"",i.clearcoatMap?"#define USE_CLEARCOATMAP":"",i.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",i.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",i.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",i.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",i.specularMap?"#define USE_SPECULARMAP":"",i.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",i.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",i.roughnessMap?"#define USE_ROUGHNESSMAP":"",i.metalnessMap?"#define USE_METALNESSMAP":"",i.alphaMap?"#define USE_ALPHAMAP":"",i.alphaHash?"#define USE_ALPHAHASH":"",i.transmission?"#define USE_TRANSMISSION":"",i.transmissionMap?"#define USE_TRANSMISSIONMAP":"",i.thicknessMap?"#define USE_THICKNESSMAP":"",i.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",i.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",i.mapUv?"#define MAP_UV "+i.mapUv:"",i.alphaMapUv?"#define ALPHAMAP_UV "+i.alphaMapUv:"",i.lightMapUv?"#define LIGHTMAP_UV "+i.lightMapUv:"",i.aoMapUv?"#define AOMAP_UV "+i.aoMapUv:"",i.emissiveMapUv?"#define EMISSIVEMAP_UV "+i.emissiveMapUv:"",i.bumpMapUv?"#define BUMPMAP_UV "+i.bumpMapUv:"",i.normalMapUv?"#define NORMALMAP_UV "+i.normalMapUv:"",i.displacementMapUv?"#define DISPLACEMENTMAP_UV "+i.displacementMapUv:"",i.metalnessMapUv?"#define METALNESSMAP_UV "+i.metalnessMapUv:"",i.roughnessMapUv?"#define ROUGHNESSMAP_UV "+i.roughnessMapUv:"",i.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+i.anisotropyMapUv:"",i.clearcoatMapUv?"#define CLEARCOATMAP_UV "+i.clearcoatMapUv:"",i.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+i.clearcoatNormalMapUv:"",i.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+i.clearcoatRoughnessMapUv:"",i.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+i.iridescenceMapUv:"",i.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+i.iridescenceThicknessMapUv:"",i.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+i.sheenColorMapUv:"",i.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+i.sheenRoughnessMapUv:"",i.specularMapUv?"#define SPECULARMAP_UV "+i.specularMapUv:"",i.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+i.specularColorMapUv:"",i.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+i.specularIntensityMapUv:"",i.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+i.transmissionMapUv:"",i.thicknessMapUv?"#define THICKNESSMAP_UV "+i.thicknessMapUv:"",i.vertexTangents&&i.flatShading===!1?"#define USE_TANGENT":"",i.vertexNormals?"#define HAS_NORMAL":"",i.vertexColors?"#define USE_COLOR":"",i.vertexAlphas?"#define USE_COLOR_ALPHA":"",i.vertexUv1s?"#define USE_UV1":"",i.vertexUv2s?"#define USE_UV2":"",i.vertexUv3s?"#define USE_UV3":"",i.pointsUvs?"#define USE_POINTS_UV":"",i.flatShading?"#define FLAT_SHADED":"",i.skinning?"#define USE_SKINNING":"",i.morphTargets?"#define USE_MORPHTARGETS":"",i.morphNormals&&i.flatShading===!1?"#define USE_MORPHNORMALS":"",i.morphColors?"#define USE_MORPHCOLORS":"",i.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+i.morphTextureStride:"",i.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+i.morphTargetsCount:"",i.doubleSided?"#define DOUBLE_SIDED":"",i.flipSided?"#define FLIP_SIDED":"",i.shadowMapEnabled?"#define USE_SHADOWMAP":"",i.shadowMapEnabled?"#define "+m:"",i.sizeAttenuation?"#define USE_SIZEATTENUATION":"",i.numLightProbes>0?"#define USE_LIGHT_PROBES":"",i.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",i.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(Rl).join(`
`),x=[Xx(i),"#define SHADER_TYPE "+i.shaderType,"#define SHADER_NAME "+i.shaderName,A,i.useFog&&i.fog?"#define USE_FOG":"",i.useFog&&i.fogExp2?"#define FOG_EXP2":"",i.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",i.map?"#define USE_MAP":"",i.matcap?"#define USE_MATCAP":"",i.envMap?"#define USE_ENVMAP":"",i.envMap?"#define "+p:"",i.envMap?"#define "+S:"",i.envMap?"#define "+_:"",v?"#define CUBEUV_TEXEL_WIDTH "+v.texelWidth:"",v?"#define CUBEUV_TEXEL_HEIGHT "+v.texelHeight:"",v?"#define CUBEUV_MAX_MIP "+v.maxMip+".0":"",i.lightMap?"#define USE_LIGHTMAP":"",i.aoMap?"#define USE_AOMAP":"",i.bumpMap?"#define USE_BUMPMAP":"",i.normalMap?"#define USE_NORMALMAP":"",i.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",i.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",i.packedNormalMap?"#define USE_PACKED_NORMALMAP":"",i.emissiveMap?"#define USE_EMISSIVEMAP":"",i.anisotropy?"#define USE_ANISOTROPY":"",i.anisotropyMap?"#define USE_ANISOTROPYMAP":"",i.clearcoat?"#define USE_CLEARCOAT":"",i.clearcoatMap?"#define USE_CLEARCOATMAP":"",i.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",i.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",i.dispersion?"#define USE_DISPERSION":"",i.retroreflection?"#define USE_RETROREFLECTION":"",i.iridescence?"#define USE_IRIDESCENCE":"",i.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",i.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",i.specularMap?"#define USE_SPECULARMAP":"",i.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",i.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",i.roughnessMap?"#define USE_ROUGHNESSMAP":"",i.metalnessMap?"#define USE_METALNESSMAP":"",i.alphaMap?"#define USE_ALPHAMAP":"",i.alphaTest?"#define USE_ALPHATEST":"",i.alphaHash?"#define USE_ALPHAHASH":"",i.sheen?"#define USE_SHEEN":"",i.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",i.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",i.transmission?"#define USE_TRANSMISSION":"",i.transmissionMap?"#define USE_TRANSMISSIONMAP":"",i.thicknessMap?"#define USE_THICKNESSMAP":"",i.vertexTangents&&i.flatShading===!1?"#define USE_TANGENT":"",i.vertexColors||i.instancingColor?"#define USE_COLOR":"",i.vertexAlphas||i.batchingColor?"#define USE_COLOR_ALPHA":"",i.vertexUv1s?"#define USE_UV1":"",i.vertexUv2s?"#define USE_UV2":"",i.vertexUv3s?"#define USE_UV3":"",i.pointsUvs?"#define USE_POINTS_UV":"",i.gradientMap?"#define USE_GRADIENTMAP":"",i.flatShading?"#define FLAT_SHADED":"",i.doubleSided?"#define DOUBLE_SIDED":"",i.flipSided?"#define FLIP_SIDED":"",i.shadowMapEnabled?"#define USE_SHADOWMAP":"",i.shadowMapEnabled?"#define "+m:"",i.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",i.numLightProbes>0?"#define USE_LIGHT_PROBES":"",i.numLightProbeGrids>0?"#define USE_LIGHT_PROBES_GRID":"",i.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",i.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",i.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",i.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",i.toneMapping!==_a?"#define TONE_MAPPING":"",i.toneMapping!==_a?ve.tonemapping_pars_fragment:"",i.toneMapping!==_a?rw("toneMapping",i.toneMapping):"",i.dithering?"#define DITHERING":"",i.opaque?"#define OPAQUE":"",ve.colorspace_pars_fragment,aw("linearToOutputTexel",i.outputColorSpace),ow(),i.useDepthPacking?"#define DEPTH_PACKING "+i.depthPacking:"",`
`].filter(Rl).join(`
`)),h=em(h),h=Gx(h,i),h=Vx(h,i),d=em(d),d=Gx(d,i),d=Vx(d,i),h=kx(h),d=kx(d),i.isRawShaderMaterial!==!0&&(U=`#version 300 es
`,y=[M,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+y,x=["#define varying in",i.glslVersion===Qv?"":"layout(location = 0) out highp vec4 pc_fragColor;",i.glslVersion===Qv?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+x);const F=U+y+h,C=U+x+d,D=Bx(l,l.VERTEX_SHADER,F),L=Bx(l,l.FRAGMENT_SHADER,C);l.attachShader(N,D),l.attachShader(N,L),i.index0AttributeName!==void 0?l.bindAttribLocation(N,0,i.index0AttributeName):i.hasPositionAttribute===!0&&l.bindAttribLocation(N,0,"position"),l.linkProgram(N);function I(k){if(o.debug.checkShaderErrors){const Q=l.getProgramInfoLog(N)||"",st=l.getShaderInfoLog(D)||"",Y=l.getShaderInfoLog(L)||"",tt=Q.trim(),q=st.trim(),j=Y.trim();let dt=!0,ut=!0;if(l.getProgramParameter(N,l.LINK_STATUS)===!1)if(dt=!1,typeof o.debug.onShaderError=="function")o.debug.onShaderError(l,N,D,L);else{const rt=Hx(l,D,"vertex"),Tt=Hx(l,L,"fragment");Fe("WebGLProgram: Shader Error "+l.getError()+" - VALIDATE_STATUS "+l.getProgramParameter(N,l.VALIDATE_STATUS)+`

Material Name: `+k.name+`
Material Type: `+k.type+`

Program Info Log: `+tt+`
`+rt+`
`+Tt)}else tt!==""?oe("WebGLProgram: Program Info Log:",tt):(q===""||j==="")&&(ut=!1);ut&&(k.diagnostics={runnable:dt,programLog:tt,vertexShader:{log:q,prefix:y},fragmentShader:{log:j,prefix:x}})}l.deleteShader(D),l.deleteShader(L),T=new Fu(l,N),O=uw(l,N)}let T;this.getUniforms=function(){return T===void 0&&I(this),T};let O;this.getAttributes=function(){return O===void 0&&I(this),O};let G=i.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return G===!1&&(G=l.getProgramParameter(N,tw)),G},this.destroy=function(){s.releaseStatesOfProgram(this),l.deleteProgram(N),this.program=void 0},this.type=i.shaderType,this.name=i.shaderName,this.id=ew++,this.cacheKey=e,this.usedTimes=1,this.program=N,this.vertexShader=D,this.fragmentShader=L,this}let Aw=0;class Rw{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(e,i,s){const l=this._getShaderCacheForMaterial(e);return l.has(i)===!1&&(l.add(i),i.usedTimes++),l.has(s)===!1&&(l.add(s),s.usedTimes++),this}remove(e){const i=this.materialCache.get(e);for(const s of i)s.usedTimes--,s.usedTimes===0&&this.shaderCache.delete(s.code);return this.materialCache.delete(e),this}getVertexShaderStage(e){return this._getShaderStage(e.vertexShader)}getFragmentShaderStage(e){return this._getShaderStage(e.fragmentShader)}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(e){const i=this.materialCache;let s=i.get(e);return s===void 0&&(s=new Set,i.set(e,s)),s}_getShaderStage(e){const i=this.shaderCache;let s=i.get(e);return s===void 0&&(s=new ww(e),i.set(e,s)),s}}class ww{constructor(e){this.id=Aw++,this.code=e,this.usedTimes=0}}function Cw(o){return o===lr||o===Gu||o===Vu}function Nw(o,e,i,s,l,f){const h=new xS,d=new Rw,m=new Set,p=[],S=new Map,_=s.logarithmicDepthBuffer;let v=s.precision;const M={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distance",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function A(T){return m.add(T),T===0?"uv":`uv${T}`}function N(T,O,G,k,Q,st){const Y=k.fog,tt=Q.geometry,q=T.isMeshStandardMaterial||T.isMeshLambertMaterial||T.isMeshPhongMaterial?k.environment:null,j=T.isMeshStandardMaterial||T.isMeshLambertMaterial&&!T.envMap||T.isMeshPhongMaterial&&!T.envMap,dt=e.get(T.envMap||q,j),ut=dt&&dt.mapping===Zu?dt.image.height:null,rt=M[T.type];T.precision!==null&&(v=s.getMaxPrecision(T.precision),v!==T.precision&&oe("WebGLProgram.getParameters:",T.precision,"not supported, using",v,"instead."));const Tt=tt.morphAttributes.position||tt.morphAttributes.normal||tt.morphAttributes.color,Gt=Tt!==void 0?Tt.length:0;let Ot=0;tt.morphAttributes.position!==void 0&&(Ot=1),tt.morphAttributes.normal!==void 0&&(Ot=2),tt.morphAttributes.color!==void 0&&(Ot=3);let B,_t,Dt,Z;if(rt){const Ue=pa[rt];B=Ue.vertexShader,_t=Ue.fragmentShader}else{B=T.vertexShader,_t=T.fragmentShader;const Ue=d.getVertexShaderStage(T),fe=d.getFragmentShaderStage(T);d.update(T,Ue,fe),Dt=Ue.id,Z=fe.id}const ft=o.getRenderTarget(),Ct=o.state.buffers.depth.getReversed(),Pt=Q.isInstancedMesh===!0,vt=Q.isBatchedMesh===!0,Ut=!!T.map,be=!!T.matcap,ue=!!dt,pe=!!T.aoMap,_e=!!T.lightMap,ee=!!T.bumpMap&&T.wireframe===!1,ne=!!T.normalMap,Be=!!T.displacementMap,rn=!!T.emissiveMap,Pe=!!T.metalnessMap,$e=!!T.roughnessMap,X=T.anisotropy>0,Ke=T.clearcoat>0,Ee=T.dispersion>0,P=T.retroreflectivity>0,E=T.iridescence>0,et=T.sheen>0,at=T.transmission>0,gt=X&&!!T.anisotropyMap,Nt=Ke&&!!T.clearcoatMap,It=Ke&&!!T.clearcoatNormalMap,xt=Ke&&!!T.clearcoatRoughnessMap,St=E&&!!T.iridescenceMap,mt=E&&!!T.iridescenceThicknessMap,wt=et&&!!T.sheenColorMap,yt=et&&!!T.sheenRoughnessMap,At=!!T.specularMap,Lt=!!T.specularColorMap,Qt=!!T.specularIntensityMap,ae=at&&!!T.transmissionMap,W=at&&!!T.thicknessMap,zt=!!T.gradientMap,bt=!!T.alphaMap,Bt=T.alphaTest>0,qt=!!T.alphaHash,Rt=!!T.extensions;let te=_a;T.toneMapped&&(ft===null||ft.isXRRenderTarget===!0)&&(te=o.toneMapping);const Wt={shaderID:rt,shaderType:T.type,shaderName:T.name,vertexShader:B,fragmentShader:_t,defines:T.defines,customVertexShaderID:Dt,customFragmentShaderID:Z,isRawShaderMaterial:T.isRawShaderMaterial===!0,glslVersion:T.glslVersion,precision:v,batching:vt,batchingColor:vt&&Q._colorsTexture!==null,instancing:Pt,instancingColor:Pt&&Q.instanceColor!==null,instancingMorph:Pt&&Q.morphTexture!==null,outputColorSpace:ft===null?o.outputColorSpace:ft.isXRRenderTarget===!0?ft.texture.colorSpace:Oe.workingColorSpace,alphaToCoverage:!!T.alphaToCoverage,map:Ut,matcap:be,envMap:ue,envMapMode:ue&&dt.mapping,envMapCubeUVHeight:ut,aoMap:pe,lightMap:_e,bumpMap:ee,normalMap:ne,displacementMap:Be,emissiveMap:rn,normalMapObjectSpace:ne&&T.normalMapType===ab,normalMapTangentSpace:ne&&T.normalMapType===Jp,packedNormalMap:ne&&T.normalMapType===Jp&&Cw(T.normalMap.format),metalnessMap:Pe,roughnessMap:$e,anisotropy:X,anisotropyMap:gt,clearcoat:Ke,clearcoatMap:Nt,clearcoatNormalMap:It,clearcoatRoughnessMap:xt,dispersion:Ee,retroreflection:P,iridescence:E,iridescenceMap:St,iridescenceThicknessMap:mt,sheen:et,sheenColorMap:wt,sheenRoughnessMap:yt,specularMap:At,specularColorMap:Lt,specularIntensityMap:Qt,transmission:at,transmissionMap:ae,thicknessMap:W,gradientMap:zt,opaque:T.transparent===!1&&T.blending===Cl&&T.alphaToCoverage===!1,alphaMap:bt,alphaTest:Bt,alphaHash:qt,combine:T.combine,mapUv:Ut&&A(T.map.channel),aoMapUv:pe&&A(T.aoMap.channel),lightMapUv:_e&&A(T.lightMap.channel),bumpMapUv:ee&&A(T.bumpMap.channel),normalMapUv:ne&&A(T.normalMap.channel),displacementMapUv:Be&&A(T.displacementMap.channel),emissiveMapUv:rn&&A(T.emissiveMap.channel),metalnessMapUv:Pe&&A(T.metalnessMap.channel),roughnessMapUv:$e&&A(T.roughnessMap.channel),anisotropyMapUv:gt&&A(T.anisotropyMap.channel),clearcoatMapUv:Nt&&A(T.clearcoatMap.channel),clearcoatNormalMapUv:It&&A(T.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:xt&&A(T.clearcoatRoughnessMap.channel),iridescenceMapUv:St&&A(T.iridescenceMap.channel),iridescenceThicknessMapUv:mt&&A(T.iridescenceThicknessMap.channel),sheenColorMapUv:wt&&A(T.sheenColorMap.channel),sheenRoughnessMapUv:yt&&A(T.sheenRoughnessMap.channel),specularMapUv:At&&A(T.specularMap.channel),specularColorMapUv:Lt&&A(T.specularColorMap.channel),specularIntensityMapUv:Qt&&A(T.specularIntensityMap.channel),transmissionMapUv:ae&&A(T.transmissionMap.channel),thicknessMapUv:W&&A(T.thicknessMap.channel),alphaMapUv:bt&&A(T.alphaMap.channel),vertexTangents:!!tt.attributes.tangent&&(ne||X),vertexNormals:!!tt.attributes.normal,vertexColors:T.vertexColors,vertexAlphas:T.vertexColors===!0&&!!tt.attributes.color&&tt.attributes.color.itemSize===4,pointsUvs:Q.isPoints===!0&&!!tt.attributes.uv&&(Ut||bt),fog:!!Y,useFog:T.fog===!0,fogExp2:!!Y&&Y.isFogExp2,flatShading:T.wireframe===!1&&(T.flatShading===!0||tt.attributes.normal===void 0&&ne===!1&&(T.isMeshLambertMaterial||T.isMeshPhongMaterial||T.isMeshStandardMaterial||T.isMeshPhysicalMaterial)),sizeAttenuation:T.sizeAttenuation===!0,logarithmicDepthBuffer:_,reversedDepthBuffer:Ct,skinning:Q.isSkinnedMesh===!0,hasPositionAttribute:tt.attributes.position!==void 0,morphTargets:tt.morphAttributes.position!==void 0,morphNormals:tt.morphAttributes.normal!==void 0,morphColors:tt.morphAttributes.color!==void 0,morphTargetsCount:Gt,morphTextureStride:Ot,numSunLights:O.sun.length,numDirLights:O.directional.length,numPointLights:O.point.length,numSpotLights:O.spot.length,numSpotLightMaps:O.spotLightMap.length,numRectAreaLights:O.rectArea.length,numHemiLights:O.hemi.length,numSunLightShadows:O.sunShadowMap.length,numDirLightShadows:O.directionalShadowMap.length,numPointLightShadows:O.pointShadowMap.length,numSpotLightShadows:O.spotShadowMap.length,numSpotLightShadowsWithMaps:O.numSpotLightShadowsWithMaps,numLightProbes:O.numLightProbes,numLightProbeGrids:st.length,numClippingPlanes:f.numPlanes,numClipIntersection:f.numIntersection,dithering:T.dithering,shadowMapEnabled:o.shadowMap.enabled&&G.length>0,shadowMapType:o.shadowMap.type,toneMapping:te,decodeVideoTexture:Ut&&T.map.isVideoTexture===!0&&Oe.getTransfer(T.map.colorSpace)===je,decodeVideoTextureEmissive:rn&&T.emissiveMap.isVideoTexture===!0&&Oe.getTransfer(T.emissiveMap.colorSpace)===je,premultipliedAlpha:T.premultipliedAlpha,doubleSided:T.side===Ii,flipSided:T.side===ri,useDepthPacking:T.depthPacking>=0,depthPacking:T.depthPacking||0,index0AttributeName:T.index0AttributeName,extensionClipCullDistance:Rt&&T.extensions.clipCullDistance===!0&&i.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(Rt&&T.extensions.multiDraw===!0||vt)&&i.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:i.has("KHR_parallel_shader_compile"),customProgramCacheKey:T.customProgramCacheKey()};return Wt.vertexUv1s=m.has(1),Wt.vertexUv2s=m.has(2),Wt.vertexUv3s=m.has(3),m.clear(),Wt}function y(T){const O=[];if(T.shaderID?O.push(T.shaderID):(O.push(T.customVertexShaderID),O.push(T.customFragmentShaderID)),T.defines!==void 0)for(const G in T.defines)O.push(G),O.push(T.defines[G]);return T.isRawShaderMaterial===!1&&(x(O,T),U(O,T),O.push(o.outputColorSpace)),O.push(T.customProgramCacheKey),O.join()}function x(T,O){T.push(O.precision),T.push(O.outputColorSpace),T.push(O.envMapMode),T.push(O.envMapCubeUVHeight),T.push(O.mapUv),T.push(O.alphaMapUv),T.push(O.lightMapUv),T.push(O.aoMapUv),T.push(O.bumpMapUv),T.push(O.normalMapUv),T.push(O.displacementMapUv),T.push(O.emissiveMapUv),T.push(O.metalnessMapUv),T.push(O.roughnessMapUv),T.push(O.anisotropyMapUv),T.push(O.clearcoatMapUv),T.push(O.clearcoatNormalMapUv),T.push(O.clearcoatRoughnessMapUv),T.push(O.iridescenceMapUv),T.push(O.iridescenceThicknessMapUv),T.push(O.sheenColorMapUv),T.push(O.sheenRoughnessMapUv),T.push(O.specularMapUv),T.push(O.specularColorMapUv),T.push(O.specularIntensityMapUv),T.push(O.transmissionMapUv),T.push(O.thicknessMapUv),T.push(O.combine),T.push(O.fogExp2),T.push(O.sizeAttenuation),T.push(O.morphTargetsCount),T.push(O.morphAttributeCount),T.push(O.numSunLights),T.push(O.numDirLights),T.push(O.numPointLights),T.push(O.numSpotLights),T.push(O.numSpotLightMaps),T.push(O.numHemiLights),T.push(O.numRectAreaLights),T.push(O.numSunLightShadows),T.push(O.numDirLightShadows),T.push(O.numPointLightShadows),T.push(O.numSpotLightShadows),T.push(O.numSpotLightShadowsWithMaps),T.push(O.numLightProbes),T.push(O.shadowMapType),T.push(O.toneMapping),T.push(O.numClippingPlanes),T.push(O.numClipIntersection),T.push(O.depthPacking)}function U(T,O){h.disableAll(),O.instancing&&h.enable(0),O.instancingColor&&h.enable(1),O.instancingMorph&&h.enable(2),O.matcap&&h.enable(3),O.envMap&&h.enable(4),O.normalMapObjectSpace&&h.enable(5),O.normalMapTangentSpace&&h.enable(6),O.clearcoat&&h.enable(7),O.iridescence&&h.enable(8),O.alphaTest&&h.enable(9),O.vertexColors&&h.enable(10),O.vertexAlphas&&h.enable(11),O.vertexUv1s&&h.enable(12),O.vertexUv2s&&h.enable(13),O.vertexUv3s&&h.enable(14),O.vertexTangents&&h.enable(15),O.anisotropy&&h.enable(16),O.alphaHash&&h.enable(17),O.batching&&h.enable(18),O.dispersion&&h.enable(19),O.retroreflection&&h.enable(24),O.batchingColor&&h.enable(20),O.gradientMap&&h.enable(21),O.packedNormalMap&&h.enable(22),O.vertexNormals&&h.enable(23),T.push(h.mask),h.disableAll(),O.fog&&h.enable(0),O.useFog&&h.enable(1),O.flatShading&&h.enable(2),O.logarithmicDepthBuffer&&h.enable(3),O.reversedDepthBuffer&&h.enable(4),O.skinning&&h.enable(5),O.morphTargets&&h.enable(6),O.morphNormals&&h.enable(7),O.morphColors&&h.enable(8),O.premultipliedAlpha&&h.enable(9),O.shadowMapEnabled&&h.enable(10),O.doubleSided&&h.enable(11),O.flipSided&&h.enable(12),O.useDepthPacking&&h.enable(13),O.dithering&&h.enable(14),O.transmission&&h.enable(15),O.sheen&&h.enable(16),O.opaque&&h.enable(17),O.pointsUvs&&h.enable(18),O.decodeVideoTexture&&h.enable(19),O.decodeVideoTextureEmissive&&h.enable(20),O.alphaToCoverage&&h.enable(21),O.numLightProbeGrids>0&&h.enable(22),O.hasPositionAttribute&&h.enable(23),T.push(h.mask)}function F(T){const O=M[T.type];let G;if(O){const k=pa[O];G=qb.clone(k.uniforms)}else G=T.uniforms;return G}function C(T,O){let G=S.get(O);return G!==void 0?++G.usedTimes:(G=new Tw(o,O,T,l),p.push(G),S.set(O,G)),G}function D(T){if(--T.usedTimes===0){const O=p.indexOf(T);p[O]=p[p.length-1],p.pop(),S.delete(T.cacheKey),T.destroy()}}function L(T){d.remove(T)}function I(){d.dispose()}return{getParameters:N,getProgramCacheKey:y,getUniforms:F,acquireProgram:C,releaseProgram:D,releaseShaderCache:L,programs:p,dispose:I}}function Dw(){let o=new WeakMap;function e(h){return o.has(h)}function i(h){let d=o.get(h);return d===void 0&&(d={},o.set(h,d)),d}function s(h){o.delete(h)}function l(h,d,m){o.get(h)[d]=m}function f(){o=new WeakMap}return{has:e,get:i,remove:s,update:l,dispose:f}}function Uw(o,e){return o.groupOrder!==e.groupOrder?o.groupOrder-e.groupOrder:o.renderOrder!==e.renderOrder?o.renderOrder-e.renderOrder:o.material.id!==e.material.id?o.material.id-e.material.id:o.materialVariant!==e.materialVariant?o.materialVariant-e.materialVariant:o.z!==e.z?o.z-e.z:o.id-e.id}function Wx(o,e){return o.groupOrder!==e.groupOrder?o.groupOrder-e.groupOrder:o.renderOrder!==e.renderOrder?o.renderOrder-e.renderOrder:o.z!==e.z?e.z-o.z:o.id-e.id}function qx(){const o=[];let e=0;const i=[],s=[],l=[];function f(){e=0,i.length=0,s.length=0,l.length=0}function h(v){let M=0;return v.isInstancedMesh&&(M+=2),v.isSkinnedMesh&&(M+=1),M}function d(v,M,A,N,y,x){let U=o[e];return U===void 0?(U={id:v.id,object:v,geometry:M,material:A,materialVariant:h(v),groupOrder:N,renderOrder:v.renderOrder,z:y,group:x},o[e]=U):(U.id=v.id,U.object=v,U.geometry=M,U.material=A,U.materialVariant=h(v),U.groupOrder=N,U.renderOrder=v.renderOrder,U.z=y,U.group=x),e++,U}function m(v,M,A,N,y,x,U){U.reversedDepth===!0&&(y=-y);const F=d(v,M,A,N,y,x);A.transmission>0?s.push(F):A.transparent===!0?l.push(F):i.push(F)}function p(v,M,A,N,y,x){const U=d(v,M,A,N,y,x);A.transmission>0?s.unshift(U):A.transparent===!0?l.unshift(U):i.unshift(U)}function S(v,M){i.length>1&&i.sort(v||Uw),s.length>1&&s.sort(M||Wx),l.length>1&&l.sort(M||Wx)}function _(){for(let v=e,M=o.length;v<M;v++){const A=o[v];if(A.id===null)break;A.id=null,A.object=null,A.geometry=null,A.material=null,A.group=null}}return{opaque:i,transmissive:s,transparent:l,init:f,push:m,unshift:p,finish:_,sort:S}}function Lw(){let o=new WeakMap;function e(s,l){const f=o.get(s);let h;return f===void 0?(h=new qx,o.set(s,[h])):l>=f.length?(h=new qx,f.push(h)):h=f[l],h}function i(){o=new WeakMap}return{get:e,dispose:i}}function Ow(){const o={};return{get:function(e){if(o[e.id]!==void 0)return o[e.id];let i;switch(e.type){case"SunLight":case"DirectionalLight":i={direction:new nt,color:new Me};break;case"SpotLight":i={position:new nt,direction:new nt,color:new Me,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":i={position:new nt,color:new Me,distance:0,decay:0};break;case"HemisphereLight":i={direction:new nt,skyColor:new Me,groundColor:new Me};break;case"RectAreaLight":i={color:new Me,position:new nt,halfWidth:new nt,halfHeight:new nt};break}return o[e.id]=i,i}}}function Pw(){const o={};return{get:function(e){if(o[e.id]!==void 0)return o[e.id];let i;switch(e.type){case"SunLight":case"DirectionalLight":i={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new le};break;case"SpotLight":i={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new le};break;case"PointLight":i={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new le,shadowCameraNear:1,shadowCameraFar:1e3};break}return o[e.id]=i,i}}}let Iw=0;function zw(o,e){return(e.castShadow?2:0)-(o.castShadow?2:0)+(e.map?1:0)-(o.map?1:0)}function Bw(o){const e=new Ow,i=Pw(),s={version:0,hash:{sunLength:-1,directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numSunShadows:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],sun:[],sunShadow:[],sunShadowMap:[],sunShadowMatrix:[],sunShadowCascade:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let p=0;p<9;p++)s.probe.push(new nt);const l=new nt,f=new cn,h=new cn;function d(p){let S=0,_=0,v=0;for(let Q=0;Q<9;Q++)s.probe[Q].set(0,0,0);let M=0,A=0,N=0,y=0,x=0,U=0,F=0,C=0,D=0,L=0,I=0,T=0,O=0,G=0;p.sort(zw);for(let Q=0,st=p.length;Q<st;Q++){const Y=p[Q],tt=Y.color,q=Y.intensity,j=Y.distance;let dt=null;if(Y.shadow&&Y.shadow.map&&(Y.shadow.map.texture.format===lr?dt=Y.shadow.map.texture:dt=Y.shadow.map.depthTexture||Y.shadow.map.texture),Y.isAmbientLight)S+=tt.r*q,_+=tt.g*q,v+=tt.b*q;else if(Y.isLightProbe){for(let ut=0;ut<9;ut++)s.probe[ut].addScaledVector(Y.sh.coefficients[ut],q);G++}else if(Y.isSunLight){const ut=e.get(Y);if(ut.color.copy(Y.color).multiplyScalar(Y.intensity),Y.castShadow){const rt=Y.shadow,Tt=i.get(Y);Tt.shadowIntensity=rt.intensity,Tt.shadowBias=rt.bias,Tt.shadowNormalBias=rt.normalBias,Tt.shadowRadius=rt.radius,Tt.shadowMapSize.copy(rt.mapSize).multiply(rt.getFrameExtents()),s.sunShadow[A]=Tt,s.sunShadowMap[A]=dt;const Gt=rt.getViewportCount();for(let Ot=0;Ot<Gt;Ot++)s.sunShadowMatrix[N+Ot]=rt.getMatrix(Ot),s.sunShadowCascade[N+Ot]=rt._cascadeData[Ot];N+=Gt,A++}s.sun[M]=ut,M++}else if(Y.isDirectionalLight){const ut=e.get(Y);if(ut.color.copy(Y.color).multiplyScalar(Y.intensity),Y.castShadow){const rt=Y.shadow,Tt=i.get(Y);Tt.shadowIntensity=rt.intensity,Tt.shadowBias=rt.bias,Tt.shadowNormalBias=rt.normalBias,Tt.shadowRadius=rt.radius,Tt.shadowMapSize=rt.mapSize,s.directionalShadow[y]=Tt,s.directionalShadowMap[y]=dt,s.directionalShadowMatrix[y]=Y.shadow.matrix,D++}s.directional[y]=ut,y++}else if(Y.isSpotLight){const ut=e.get(Y);ut.position.setFromMatrixPosition(Y.matrixWorld),ut.color.copy(tt).multiplyScalar(q),ut.distance=j,ut.coneCos=Math.cos(Y.angle),ut.penumbraCos=Math.cos(Y.angle*(1-Y.penumbra)),ut.decay=Y.decay,s.spot[U]=ut;const rt=Y.shadow;if(Y.map&&(s.spotLightMap[T]=Y.map,T++,rt.updateMatrices(Y),Y.castShadow&&O++),s.spotLightMatrix[U]=rt.matrix,Y.castShadow){const Tt=i.get(Y);Tt.shadowIntensity=rt.intensity,Tt.shadowBias=rt.bias,Tt.shadowNormalBias=rt.normalBias,Tt.shadowRadius=rt.radius,Tt.shadowMapSize=rt.mapSize,s.spotShadow[U]=Tt,s.spotShadowMap[U]=dt,I++}U++}else if(Y.isRectAreaLight){const ut=e.get(Y);ut.color.copy(tt).multiplyScalar(q),ut.halfWidth.set(Y.width*.5,0,0),ut.halfHeight.set(0,Y.height*.5,0),s.rectArea[F]=ut,F++}else if(Y.isPointLight){const ut=e.get(Y);if(ut.color.copy(Y.color).multiplyScalar(Y.intensity),ut.distance=Y.distance,ut.decay=Y.decay,Y.castShadow){const rt=Y.shadow,Tt=i.get(Y);Tt.shadowIntensity=rt.intensity,Tt.shadowBias=rt.bias,Tt.shadowNormalBias=rt.normalBias,Tt.shadowRadius=rt.radius,Tt.shadowMapSize=rt.mapSize,Tt.shadowCameraNear=rt.camera.near,Tt.shadowCameraFar=rt.camera.far,s.pointShadow[x]=Tt,s.pointShadowMap[x]=dt,s.pointShadowMatrix[x]=Y.shadow.matrix,L++}s.point[x]=ut,x++}else if(Y.isHemisphereLight){const ut=e.get(Y);ut.skyColor.copy(Y.color).multiplyScalar(q),ut.groundColor.copy(Y.groundColor).multiplyScalar(q),s.hemi[C]=ut,C++}}F>0&&(o.has("OES_texture_float_linear")===!0?(s.rectAreaLTC1=Xt.LTC_FLOAT_1,s.rectAreaLTC2=Xt.LTC_FLOAT_2):(s.rectAreaLTC1=Xt.LTC_HALF_1,s.rectAreaLTC2=Xt.LTC_HALF_2)),s.ambient[0]=S,s.ambient[1]=_,s.ambient[2]=v;const k=s.hash;(k.sunLength!==M||k.directionalLength!==y||k.pointLength!==x||k.spotLength!==U||k.rectAreaLength!==F||k.hemiLength!==C||k.numSunShadows!==A||k.numDirectionalShadows!==D||k.numPointShadows!==L||k.numSpotShadows!==I||k.numSpotMaps!==T||k.numLightProbes!==G)&&(s.sun.length=M,s.directional.length=y,s.spot.length=U,s.rectArea.length=F,s.point.length=x,s.hemi.length=C,s.sunShadow.length=A,s.sunShadowMap.length=A,s.sunShadowMatrix.length=N,s.sunShadowCascade.length=N,s.directionalShadow.length=D,s.directionalShadowMap.length=D,s.directionalShadowMatrix.length=D,s.pointShadow.length=L,s.pointShadowMap.length=L,s.pointShadowMatrix.length=L,s.spotShadow.length=I,s.spotShadowMap.length=I,s.spotLightMatrix.length=I+T-O,s.spotLightMap.length=T,s.numSpotLightShadowsWithMaps=O,s.numLightProbes=G,k.sunLength=M,k.directionalLength=y,k.pointLength=x,k.spotLength=U,k.rectAreaLength=F,k.hemiLength=C,k.numSunShadows=A,k.numDirectionalShadows=D,k.numPointShadows=L,k.numSpotShadows=I,k.numSpotMaps=T,k.numLightProbes=G,s.version=Iw++)}function m(p,S){let _=0,v=0,M=0,A=0,N=0,y=0;const x=S.matrixWorldInverse;for(let U=0,F=p.length;U<F;U++){const C=p[U];if(C.isSunLight){const D=s.sun[_];D.direction.setFromMatrixPosition(C.matrixWorld),D.direction.transformDirection(x),_++}else if(C.isDirectionalLight){const D=s.directional[v];D.direction.setFromMatrixPosition(C.matrixWorld),l.setFromMatrixPosition(C.target.matrixWorld),D.direction.sub(l),D.direction.transformDirection(x),v++}else if(C.isSpotLight){const D=s.spot[A];D.position.setFromMatrixPosition(C.matrixWorld),D.position.applyMatrix4(x),D.direction.setFromMatrixPosition(C.matrixWorld),l.setFromMatrixPosition(C.target.matrixWorld),D.direction.sub(l),D.direction.transformDirection(x),A++}else if(C.isRectAreaLight){const D=s.rectArea[N];D.position.setFromMatrixPosition(C.matrixWorld),D.position.applyMatrix4(x),h.identity(),f.copy(C.matrixWorld),f.premultiply(x),h.extractRotation(f),D.halfWidth.set(C.width*.5,0,0),D.halfHeight.set(0,C.height*.5,0),D.halfWidth.applyMatrix4(h),D.halfHeight.applyMatrix4(h),N++}else if(C.isPointLight){const D=s.point[M];D.position.setFromMatrixPosition(C.matrixWorld),D.position.applyMatrix4(x),M++}else if(C.isHemisphereLight){const D=s.hemi[y];D.direction.setFromMatrixPosition(C.matrixWorld),D.direction.transformDirection(x),y++}}}return{setup:d,setupView:m,state:s}}function Yx(o){const e=new Bw(o),i=[],s=[],l=[];function f(v){_.camera=v,i.length=0,s.length=0,l.length=0}function h(v){i.push(v)}function d(v){s.push(v)}function m(v){l.push(v)}function p(){e.setup(i)}function S(v){e.setupView(i,v)}const _={lightsArray:i,shadowsArray:s,lightProbeGridArray:l,camera:null,lights:e,transmissionRenderTarget:{},textureUnits:0};return{init:f,state:_,setupLights:p,setupLightsView:S,pushLight:h,pushShadow:d,pushLightProbeGrid:m}}function Fw(o){let e=new WeakMap;function i(l,f=0){const h=e.get(l);let d;return h===void 0?(d=new Yx(o),e.set(l,[d])):f>=h.length?(d=new Yx(o),h.push(d)):d=h[f],d}function s(){e=new WeakMap}return{get:i,dispose:s}}const Hw=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,Gw=`uniform sampler2D shadow_pass;
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
}`,Vw=[new nt(1,0,0),new nt(-1,0,0),new nt(0,1,0),new nt(0,-1,0),new nt(0,0,1),new nt(0,0,-1)],kw=[new nt(0,-1,0),new nt(0,-1,0),new nt(0,0,1),new nt(0,0,-1),new nt(0,-1,0),new nt(0,-1,0)],jx=new cn,Tl=new nt,fp=new nt;function Xw(o,e,i){let s=new xm;const l=new le,f=new le,h=new ln,d=new Kb,m=new Qb,p={},S=i.maxTextureSize,_={[rr]:ri,[ri]:rr,[Ii]:Ii},v=new Sa({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new le},radius:{value:4}},vertexShader:Hw,fragmentShader:Gw}),M=v.clone();M.defines.HORIZONTAL_PASS=1;const A=new Jn;A.setAttribute("position",new Wa(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));const N=new ze(A,v),y=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=wl;let x=this.type;this.render=function(L,I,T){if(y.enabled===!1||y.autoUpdate===!1&&y.needsUpdate===!1||L.length===0)return;this.type===PE&&(oe("WebGLShadowMap: PCFSoftShadowMap has been removed. Using PCFShadowMap instead."),this.type=wl);const O=o.getRenderTarget(),G=o.getActiveCubeFace(),k=o.getActiveMipmapLevel(),Q=o.state;Q.setBlending(ka),Q.buffers.depth.getReversed()===!0?Q.buffers.color.setClear(0,0,0,0):Q.buffers.color.setClear(1,1,1,1),Q.buffers.depth.setTest(!0),Q.setScissorTest(!1);const st=x!==this.type;st&&I.traverse(function(Y){Y.material&&(Array.isArray(Y.material)?Y.material.forEach(tt=>tt.needsUpdate=!0):Y.material.needsUpdate=!0)});for(let Y=0,tt=L.length;Y<tt;Y++){const q=L[Y],j=q.shadow;if(j===void 0){oe("WebGLShadowMap:",q,"has no shadow.");continue}if(j.autoUpdate===!1&&j.needsUpdate===!1)continue;l.copy(j.mapSize);const dt=j.getFrameExtents();l.multiply(dt),f.copy(j.mapSize),(l.x>S||l.y>S)&&(l.x>S&&(f.x=Math.floor(S/dt.x),l.x=f.x*dt.x,j.mapSize.x=f.x),l.y>S&&(f.y=Math.floor(S/dt.y),l.y=f.y*dt.y,j.mapSize.y=f.y));const ut=o.state.buffers.depth.getReversed();if(j.camera._reversedDepth=ut,j.map===null||st===!0){if(j.map!==null&&(j.map.depthTexture!==null&&(j.map.depthTexture.dispose(),j.map.depthTexture=null),j.map.dispose()),this.type===Al){if(q.isPointLight){oe("WebGLShadowMap: VSM shadow maps are not supported for PointLights. Use PCF or BasicShadowMap instead.");continue}j.map=new Ki(l.x,l.y,{format:lr,type:xa,minFilter:kn,magFilter:kn,generateMipmaps:!1}),j.map.texture.name=q.name+".shadowMap",j.map.depthTexture=new Pl(l.x,l.y,ma),j.map.depthTexture.name=q.name+".shadowMapDepth",j.map.depthTexture.format=qa,j.map.depthTexture.compareFunction=null,j.map.depthTexture.minFilter=Fn,j.map.depthTexture.magFilter=Fn}else q.isPointLight?(j.map=new DS(l.x),j.map.depthTexture=new kb(l.x,va)):(j.map=new Ki(l.x,l.y),j.map.depthTexture=new Pl(l.x,l.y,va)),j.map.depthTexture.name=q.name+".shadowMap",j.map.depthTexture.format=qa,this.type===wl?(j.map.depthTexture.compareFunction=ut?pm:dm,j.map.depthTexture.minFilter=kn,j.map.depthTexture.magFilter=kn):(j.map.depthTexture.compareFunction=null,j.map.depthTexture.minFilter=Fn,j.map.depthTexture.magFilter=Fn);j.camera.updateProjectionMatrix()}j.map.isWebGLCubeRenderTarget!==!0&&(j.map.width!==l.x||j.map.height!==l.y)&&j.map.setSize(l.x,l.y);const rt=j.map.isWebGLCubeRenderTarget?6:j.getViewportCount();q.isPointLight!==!0&&j.updateMatrices(q,T);for(let Tt=0;Tt<rt;Tt++){const Gt=j.getCamera(Tt);if(q.isPointLight){const Ot=j.camera,B=j.matrix,_t=q.distance||Ot.far;_t!==Ot.far&&(Ot.far=_t,Ot.updateProjectionMatrix()),Tl.setFromMatrixPosition(q.matrixWorld),Ot.position.copy(Tl),fp.copy(Ot.position),fp.add(Vw[Tt]),Ot.up.copy(kw[Tt]),Ot.lookAt(fp),Ot.updateMatrixWorld(),B.makeTranslation(-Tl.x,-Tl.y,-Tl.z),jx.multiplyMatrices(Ot.projectionMatrix,Ot.matrixWorldInverse),j._frustum.setFromProjectionMatrix(jx,Ot.coordinateSystem,Ot.reversedDepth)}if(j.map.isWebGLCubeRenderTarget)o.setRenderTarget(j.map,Tt),o.clear();else{Tt===0&&(o.setRenderTarget(j.map),o.clear());const Ot=j.getViewport(Tt);h.set(f.x*Ot.x,f.y*Ot.y,f.x*Ot.z,f.y*Ot.w),Q.viewport(h)}s=j.getFrustum(Tt),C(I,T,Gt,q,this.type)}j.isPointLightShadow!==!0&&this.type===Al&&U(j,T),j.needsUpdate=!1}x=this.type,y.needsUpdate=!1,o.setRenderTarget(O,G,k)};function U(L,I){const T=e.update(N);v.defines.VSM_SAMPLES!==L.blurSamples&&(v.defines.VSM_SAMPLES=L.blurSamples,M.defines.VSM_SAMPLES=L.blurSamples,v.needsUpdate=!0,M.needsUpdate=!0),L.mapPass===null?L.mapPass=new Ki(l.x,l.y,{format:lr,type:xa}):(L.mapPass.width!==L.map.width||L.mapPass.height!==L.map.height)&&L.mapPass.setSize(L.map.width,L.map.height),v.uniforms.shadow_pass.value=L.map.depthTexture,v.uniforms.resolution.value.set(L.map.width,L.map.height),v.uniforms.radius.value=L.radius,o.setRenderTarget(L.mapPass),o.clear(),o.renderBufferDirect(I,null,T,v,N,null),M.uniforms.shadow_pass.value=L.mapPass.texture,M.uniforms.resolution.value.set(L.map.width,L.map.height),M.uniforms.radius.value=L.radius,o.setRenderTarget(L.map),o.clear(),o.renderBufferDirect(I,null,T,M,N,null)}function F(L,I,T,O){let G=null;const k=T.isPointLight===!0?L.customDistanceMaterial:L.customDepthMaterial;if(k!==void 0)G=k;else if(G=T.isPointLight===!0?m:d,o.localClippingEnabled&&I.clipShadows===!0&&Array.isArray(I.clippingPlanes)&&I.clippingPlanes.length!==0||I.displacementMap&&I.displacementScale!==0||I.alphaMap&&I.alphaTest>0||I.map&&I.alphaTest>0||I.alphaToCoverage===!0){const Q=G.uuid,st=I.uuid;let Y=p[Q];Y===void 0&&(Y={},p[Q]=Y);let tt=Y[st];tt===void 0&&(tt=G.clone(),Y[st]=tt,I.addEventListener("dispose",D)),G=tt}if(G.visible=I.visible,G.wireframe=I.wireframe,O===Al?G.side=I.shadowSide!==null?I.shadowSide:I.side:G.side=I.shadowSide!==null?I.shadowSide:_[I.side],G.alphaMap=I.alphaMap,G.alphaTest=I.alphaToCoverage===!0?.5:I.alphaTest,G.map=I.map,G.clipShadows=I.clipShadows,G.clippingPlanes=I.clippingPlanes,G.clipIntersection=I.clipIntersection,G.displacementMap=I.displacementMap,G.displacementScale=I.displacementScale,G.displacementBias=I.displacementBias,G.wireframeLinewidth=I.wireframeLinewidth,G.linewidth=I.linewidth,T.isPointLight===!0&&G.isMeshDistanceMaterial===!0){const Q=o.properties.get(G);Q.light=T}return G}function C(L,I,T,O,G){if(L.visible===!1)return;if(L.layers.test(I.layers)&&(L.isMesh||L.isLine||L.isPoints)&&(L.castShadow||L.receiveShadow&&G===Al)&&(!L.frustumCulled||L.intersectsFrustum(s))){L.modelViewMatrix.multiplyMatrices(T.matrixWorldInverse,L.matrixWorld);const st=e.update(L),Y=L.material;if(Array.isArray(Y)){const tt=st.groups;for(let q=0,j=tt.length;q<j;q++){const dt=tt[q],ut=Y[dt.materialIndex];if(ut&&ut.visible){const rt=F(L,ut,O,G);L.onBeforeShadow(o,L,I,T,st,rt,dt),o.renderBufferDirect(T,null,st,rt,L,dt),L.onAfterShadow(o,L,I,T,st,rt,dt)}}}else if(Y.visible){const tt=F(L,Y,O,G);L.onBeforeShadow(o,L,I,T,st,tt,null),o.renderBufferDirect(T,null,st,tt,L,null),L.onAfterShadow(o,L,I,T,st,tt,null)}}const Q=L.children;for(let st=0,Y=Q.length;st<Y;st++)C(Q[st],I,T,O,G)}function D(L){L.target.removeEventListener("dispose",D);for(const T in p){const O=p[T],G=L.target.uuid;G in O&&(O[G].dispose(),delete O[G])}}}function Ww(o,e){function i(){let W=!1;const zt=new ln;let bt=null;const Bt=new ln(0,0,0,0);return{setMask:function(qt){bt!==qt&&!W&&(o.colorMask(qt,qt,qt,qt),bt=qt)},setLocked:function(qt){W=qt},setClear:function(qt,Rt,te,Wt,Ue){Ue===!0&&(qt*=Wt,Rt*=Wt,te*=Wt),zt.set(qt,Rt,te,Wt),Bt.equals(zt)===!1&&(o.clearColor(qt,Rt,te,Wt),Bt.copy(zt))},reset:function(){W=!1,bt=null,Bt.set(-1,0,0,0)}}}function s(){let W=!1,zt=!1,bt=null,Bt=null,qt=null;return{setReversed:function(Rt){if(zt!==Rt){const te=e.get("EXT_clip_control");Rt?te.clipControlEXT(te.LOWER_LEFT_EXT,te.ZERO_TO_ONE_EXT):te.clipControlEXT(te.LOWER_LEFT_EXT,te.NEGATIVE_ONE_TO_ONE_EXT),zt=Rt;const Wt=qt;qt=null,this.setClear(Wt)}},getReversed:function(){return zt},setTest:function(Rt){Rt?ft(o.DEPTH_TEST):Ct(o.DEPTH_TEST)},setMask:function(Rt){bt!==Rt&&!W&&(o.depthMask(Rt),bt=Rt)},setFunc:function(Rt){if(zt&&(Rt=gb[Rt]),Bt!==Rt){switch(Rt){case dp:o.depthFunc(o.NEVER);break;case pp:o.depthFunc(o.ALWAYS);break;case mp:o.depthFunc(o.LESS);break;case Dl:o.depthFunc(o.LEQUAL);break;case gp:o.depthFunc(o.EQUAL);break;case _p:o.depthFunc(o.GEQUAL);break;case vp:o.depthFunc(o.GREATER);break;case xp:o.depthFunc(o.NOTEQUAL);break;default:o.depthFunc(o.LEQUAL)}Bt=Rt}},setLocked:function(Rt){W=Rt},setClear:function(Rt){qt!==Rt&&(qt=Rt,zt&&(Rt=1-Rt),o.clearDepth(Rt))},reset:function(){W=!1,bt=null,Bt=null,qt=null,zt=!1}}}function l(){let W=!1,zt=null,bt=null,Bt=null,qt=null,Rt=null,te=null,Wt=null,Ue=null;return{setTest:function(fe){W||(fe?ft(o.STENCIL_TEST):Ct(o.STENCIL_TEST))},setMask:function(fe){zt!==fe&&!W&&(o.stencilMask(fe),zt=fe)},setFunc:function(fe,oi,Ei){(bt!==fe||Bt!==oi||qt!==Ei)&&(o.stencilFunc(fe,oi,Ei),bt=fe,Bt=oi,qt=Ei)},setOp:function(fe,oi,Ei){(Rt!==fe||te!==oi||Wt!==Ei)&&(o.stencilOp(fe,oi,Ei),Rt=fe,te=oi,Wt=Ei)},setLocked:function(fe){W=fe},setClear:function(fe){Ue!==fe&&(o.clearStencil(fe),Ue=fe)},reset:function(){W=!1,zt=null,bt=null,Bt=null,qt=null,Rt=null,te=null,Wt=null,Ue=null}}}const f=new i,h=new s,d=new l,m=new WeakMap,p=new WeakMap;let S={},_={},v={},M=new WeakMap,A=[],N=null,y=!1,x=null,U=null,F=null,C=null,D=null,L=null,I=null,T=new Me(0,0,0),O=0,G=!1,k=null,Q=null,st=null,Y=null,tt=null;const q=o.getParameter(o.MAX_COMBINED_TEXTURE_IMAGE_UNITS);let j=!1,dt=0;const ut=o.getParameter(o.VERSION);ut.indexOf("WebGL")!==-1?(dt=parseFloat(/^WebGL (\d)/.exec(ut)[1]),j=dt>=1):ut.indexOf("OpenGL ES")!==-1&&(dt=parseFloat(/^OpenGL ES (\d)/.exec(ut)[1]),j=dt>=2);let rt=null,Tt={};const Gt=o.getParameter(o.SCISSOR_BOX),Ot=o.getParameter(o.VIEWPORT),B=new ln().fromArray(Gt),_t=new ln().fromArray(Ot);function Dt(W,zt,bt,Bt){const qt=new Uint8Array(4),Rt=o.createTexture();o.bindTexture(W,Rt),o.texParameteri(W,o.TEXTURE_MIN_FILTER,o.NEAREST),o.texParameteri(W,o.TEXTURE_MAG_FILTER,o.NEAREST);for(let te=0;te<bt;te++)W===o.TEXTURE_3D||W===o.TEXTURE_2D_ARRAY?o.texImage3D(zt,0,o.RGBA,1,1,Bt,0,o.RGBA,o.UNSIGNED_BYTE,qt):o.texImage2D(zt+te,0,o.RGBA,1,1,0,o.RGBA,o.UNSIGNED_BYTE,qt);return Rt}const Z={};Z[o.TEXTURE_2D]=Dt(o.TEXTURE_2D,o.TEXTURE_2D,1),Z[o.TEXTURE_CUBE_MAP]=Dt(o.TEXTURE_CUBE_MAP,o.TEXTURE_CUBE_MAP_POSITIVE_X,6),Z[o.TEXTURE_2D_ARRAY]=Dt(o.TEXTURE_2D_ARRAY,o.TEXTURE_2D_ARRAY,1,1),Z[o.TEXTURE_3D]=Dt(o.TEXTURE_3D,o.TEXTURE_3D,1,1),f.setClear(0,0,0,1),h.setClear(1),d.setClear(0),ft(o.DEPTH_TEST),h.setFunc(Dl),ee(!1),ne(Yv),ft(o.CULL_FACE),pe(ka);function ft(W){S[W]!==!0&&(o.enable(W),S[W]=!0)}function Ct(W){S[W]!==!1&&(o.disable(W),S[W]=!1)}function Pt(W,zt){return v[W]!==zt?(o.bindFramebuffer(W,zt),v[W]=zt,W===o.DRAW_FRAMEBUFFER&&(v[o.FRAMEBUFFER]=zt),W===o.FRAMEBUFFER&&(v[o.DRAW_FRAMEBUFFER]=zt),!0):!1}function vt(W,zt){let bt=A,Bt=!1;if(W){bt=M.get(zt),bt===void 0&&(bt=[],M.set(zt,bt));const qt=W.textures;if(bt.length!==qt.length||bt[0]!==o.COLOR_ATTACHMENT0){for(let Rt=0,te=qt.length;Rt<te;Rt++)bt[Rt]=o.COLOR_ATTACHMENT0+Rt;bt.length=qt.length,Bt=!0}}else bt[0]!==o.BACK&&(bt[0]=o.BACK,Bt=!0);Bt&&o.drawBuffers(bt)}function Ut(W){return N!==W?(o.useProgram(W),N=W,!0):!1}const be={[uo]:o.FUNC_ADD,[zE]:o.FUNC_SUBTRACT,[BE]:o.FUNC_REVERSE_SUBTRACT};be[FE]=o.MIN,be[HE]=o.MAX;const ue={[GE]:o.ZERO,[VE]:o.ONE,[kE]:o.SRC_COLOR,[$x]:o.SRC_ALPHA,[ZE]:o.SRC_ALPHA_SATURATE,[YE]:o.DST_COLOR,[WE]:o.DST_ALPHA,[XE]:o.ONE_MINUS_SRC_COLOR,[tS]:o.ONE_MINUS_SRC_ALPHA,[jE]:o.ONE_MINUS_DST_COLOR,[qE]:o.ONE_MINUS_DST_ALPHA,[KE]:o.CONSTANT_COLOR,[QE]:o.ONE_MINUS_CONSTANT_COLOR,[JE]:o.CONSTANT_ALPHA,[$E]:o.ONE_MINUS_CONSTANT_ALPHA};function pe(W,zt,bt,Bt,qt,Rt,te,Wt,Ue,fe){if(W===ka){y===!0&&(Ct(o.BLEND),y=!1);return}if(y===!1&&(ft(o.BLEND),y=!0),W!==IE){if(W!==x||fe!==G){if((U!==uo||D!==uo)&&(o.blendEquation(o.FUNC_ADD),U=uo,D=uo),fe)switch(W){case Cl:o.blendFuncSeparate(o.ONE,o.ONE_MINUS_SRC_ALPHA,o.ONE,o.ONE_MINUS_SRC_ALPHA);break;case jv:o.blendFunc(o.ONE,o.ONE);break;case Zv:o.blendFuncSeparate(o.ZERO,o.ONE_MINUS_SRC_COLOR,o.ZERO,o.ONE);break;case Kv:o.blendFuncSeparate(o.DST_COLOR,o.ONE_MINUS_SRC_ALPHA,o.ZERO,o.ONE);break;default:Fe("WebGLState: Invalid blending: ",W);break}else switch(W){case Cl:o.blendFuncSeparate(o.SRC_ALPHA,o.ONE_MINUS_SRC_ALPHA,o.ONE,o.ONE_MINUS_SRC_ALPHA);break;case jv:o.blendFuncSeparate(o.SRC_ALPHA,o.ONE,o.ONE,o.ONE);break;case Zv:Fe("WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true");break;case Kv:Fe("WebGLState: MultiplyBlending requires material.premultipliedAlpha = true");break;default:Fe("WebGLState: Invalid blending: ",W);break}F=null,C=null,L=null,I=null,T.set(0,0,0),O=0,x=W,G=fe}return}qt=qt||zt,Rt=Rt||bt,te=te||Bt,(zt!==U||qt!==D)&&(o.blendEquationSeparate(be[zt],be[qt]),U=zt,D=qt),(bt!==F||Bt!==C||Rt!==L||te!==I)&&(o.blendFuncSeparate(ue[bt],ue[Bt],ue[Rt],ue[te]),F=bt,C=Bt,L=Rt,I=te),(Wt.equals(T)===!1||Ue!==O)&&(o.blendColor(Wt.r,Wt.g,Wt.b,Ue),T.copy(Wt),O=Ue),x=W,G=!1}function _e(W,zt){W.side===Ii?Ct(o.CULL_FACE):ft(o.CULL_FACE);let bt=W.side===ri;zt&&(bt=!bt),ee(bt),W.blending===Cl&&W.transparent===!1?pe(ka):pe(W.blending,W.blendEquation,W.blendSrc,W.blendDst,W.blendEquationAlpha,W.blendSrcAlpha,W.blendDstAlpha,W.blendColor,W.blendAlpha,W.premultipliedAlpha),h.setFunc(W.depthFunc),h.setTest(W.depthTest),h.setMask(W.depthWrite),f.setMask(W.colorWrite);const Bt=W.stencilWrite;d.setTest(Bt),Bt&&(d.setMask(W.stencilWriteMask),d.setFunc(W.stencilFunc,W.stencilRef,W.stencilFuncMask),d.setOp(W.stencilFail,W.stencilZFail,W.stencilZPass)),rn(W.polygonOffset,W.polygonOffsetFactor,W.polygonOffsetUnits),W.alphaToCoverage===!0?ft(o.SAMPLE_ALPHA_TO_COVERAGE):Ct(o.SAMPLE_ALPHA_TO_COVERAGE)}function ee(W){k!==W&&(W?o.frontFace(o.CW):o.frontFace(o.CCW),k=W)}function ne(W){W!==LE?(ft(o.CULL_FACE),W!==Q&&(W===Yv?o.cullFace(o.BACK):W===OE?o.cullFace(o.FRONT):o.cullFace(o.FRONT_AND_BACK))):Ct(o.CULL_FACE),Q=W}function Be(W){W!==st&&(j&&o.lineWidth(W),st=W)}function rn(W,zt,bt){W?(ft(o.POLYGON_OFFSET_FILL),(Y!==zt||tt!==bt)&&(Y=zt,tt=bt,h.getReversed()&&(zt=-zt),o.polygonOffset(zt,bt))):Ct(o.POLYGON_OFFSET_FILL)}function Pe(W){W?ft(o.SCISSOR_TEST):Ct(o.SCISSOR_TEST)}function $e(W){W===void 0&&(W=o.TEXTURE0+q-1),rt!==W&&(o.activeTexture(W),rt=W)}function X(W,zt,bt){bt===void 0&&(rt===null?bt=o.TEXTURE0+q-1:bt=rt);let Bt=Tt[bt];Bt===void 0&&(Bt={type:void 0,texture:void 0},Tt[bt]=Bt),(Bt.type!==W||Bt.texture!==zt)&&(rt!==bt&&(o.activeTexture(bt),rt=bt),o.bindTexture(W,zt||Z[W]),Bt.type=W,Bt.texture=zt)}function Ke(){const W=Tt[rt];W!==void 0&&W.type!==void 0&&(o.bindTexture(W.type,null),W.type=void 0,W.texture=void 0)}function Ee(){try{o.compressedTexImage2D(...arguments)}catch(W){Fe("WebGLState:",W)}}function P(){try{o.compressedTexImage3D(...arguments)}catch(W){Fe("WebGLState:",W)}}function E(){try{o.texSubImage2D(...arguments)}catch(W){Fe("WebGLState:",W)}}function et(){try{o.texSubImage3D(...arguments)}catch(W){Fe("WebGLState:",W)}}function at(){try{o.compressedTexSubImage2D(...arguments)}catch(W){Fe("WebGLState:",W)}}function gt(){try{o.compressedTexSubImage3D(...arguments)}catch(W){Fe("WebGLState:",W)}}function Nt(){try{o.texStorage2D(...arguments)}catch(W){Fe("WebGLState:",W)}}function It(){try{o.texStorage3D(...arguments)}catch(W){Fe("WebGLState:",W)}}function xt(){try{o.texImage2D(...arguments)}catch(W){Fe("WebGLState:",W)}}function St(){try{o.texImage3D(...arguments)}catch(W){Fe("WebGLState:",W)}}function mt(W){return _[W]!==void 0?_[W]:o.getParameter(W)}function wt(W,zt){_[W]!==zt&&(o.pixelStorei(W,zt),_[W]=zt)}function yt(W){B.equals(W)===!1&&(o.scissor(W.x,W.y,W.z,W.w),B.copy(W))}function At(W){_t.equals(W)===!1&&(o.viewport(W.x,W.y,W.z,W.w),_t.copy(W))}function Lt(W,zt){let bt=p.get(zt);bt===void 0&&(bt=new WeakMap,p.set(zt,bt));let Bt=bt.get(W);Bt===void 0&&(Bt=o.getUniformBlockIndex(zt,W.name),bt.set(W,Bt))}function Qt(W,zt){const Bt=p.get(zt).get(W);m.get(zt)!==Bt&&(o.uniformBlockBinding(zt,Bt,W.__bindingPointIndex),m.set(zt,Bt))}function ae(){o.disable(o.BLEND),o.disable(o.CULL_FACE),o.disable(o.DEPTH_TEST),o.disable(o.POLYGON_OFFSET_FILL),o.disable(o.SCISSOR_TEST),o.disable(o.STENCIL_TEST),o.disable(o.SAMPLE_ALPHA_TO_COVERAGE),o.blendEquation(o.FUNC_ADD),o.blendFunc(o.ONE,o.ZERO),o.blendFuncSeparate(o.ONE,o.ZERO,o.ONE,o.ZERO),o.blendColor(0,0,0,0),o.colorMask(!0,!0,!0,!0),o.clearColor(0,0,0,0),o.depthMask(!0),o.depthFunc(o.LESS),h.setReversed(!1),o.clearDepth(1),o.stencilMask(4294967295),o.stencilFunc(o.ALWAYS,0,4294967295),o.stencilOp(o.KEEP,o.KEEP,o.KEEP),o.clearStencil(0),o.cullFace(o.BACK),o.frontFace(o.CCW),o.polygonOffset(0,0),o.activeTexture(o.TEXTURE0),o.bindFramebuffer(o.FRAMEBUFFER,null),o.bindFramebuffer(o.DRAW_FRAMEBUFFER,null),o.bindFramebuffer(o.READ_FRAMEBUFFER,null),o.useProgram(null),o.lineWidth(1),o.scissor(0,0,o.canvas.width,o.canvas.height),o.viewport(0,0,o.canvas.width,o.canvas.height),o.pixelStorei(o.PACK_ALIGNMENT,4),o.pixelStorei(o.UNPACK_ALIGNMENT,4),o.pixelStorei(o.UNPACK_FLIP_Y_WEBGL,!1),o.pixelStorei(o.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),o.pixelStorei(o.UNPACK_COLORSPACE_CONVERSION_WEBGL,o.BROWSER_DEFAULT_WEBGL),o.pixelStorei(o.PACK_ROW_LENGTH,0),o.pixelStorei(o.PACK_SKIP_PIXELS,0),o.pixelStorei(o.PACK_SKIP_ROWS,0),o.pixelStorei(o.UNPACK_ROW_LENGTH,0),o.pixelStorei(o.UNPACK_IMAGE_HEIGHT,0),o.pixelStorei(o.UNPACK_SKIP_PIXELS,0),o.pixelStorei(o.UNPACK_SKIP_ROWS,0),o.pixelStorei(o.UNPACK_SKIP_IMAGES,0),S={},_={},rt=null,Tt={},v={},M=new WeakMap,A=[],N=null,y=!1,x=null,U=null,F=null,C=null,D=null,L=null,I=null,T=new Me(0,0,0),O=0,G=!1,k=null,Q=null,st=null,Y=null,tt=null,B.set(0,0,o.canvas.width,o.canvas.height),_t.set(0,0,o.canvas.width,o.canvas.height),f.reset(),h.reset(),d.reset()}return{buffers:{color:f,depth:h,stencil:d},enable:ft,disable:Ct,bindFramebuffer:Pt,drawBuffers:vt,useProgram:Ut,setBlending:pe,setMaterial:_e,setFlipSided:ee,setCullFace:ne,setLineWidth:Be,setPolygonOffset:rn,setScissorTest:Pe,activeTexture:$e,bindTexture:X,unbindTexture:Ke,compressedTexImage2D:Ee,compressedTexImage3D:P,texImage2D:xt,texImage3D:St,pixelStorei:wt,getParameter:mt,updateUBOMapping:Lt,uniformBlockBinding:Qt,texStorage2D:Nt,texStorage3D:It,texSubImage2D:E,texSubImage3D:et,compressedTexSubImage2D:at,compressedTexSubImage3D:gt,scissor:yt,viewport:At,reset:ae}}function qw(o,e,i,s,l,f,h){const d=e.has("WEBGL_multisampled_render_to_texture")?e.get("WEBGL_multisampled_render_to_texture"):null,m=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),p=new le,S=new WeakMap,_=new Set;let v;const M=new WeakMap;let A=!1;try{A=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function N(P,E){return A?new OffscreenCanvas(P,E):Wu("canvas")}function y(P,E,et){let at=1;const gt=Ee(P);if((gt.width>et||gt.height>et)&&(at=et/Math.max(gt.width,gt.height)),at<1)if(typeof HTMLImageElement<"u"&&P instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&P instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&P instanceof ImageBitmap||typeof VideoFrame<"u"&&P instanceof VideoFrame){const Nt=Math.floor(at*gt.width),It=Math.floor(at*gt.height);v===void 0&&(v=N(Nt,It));const xt=E?N(Nt,It):v;return xt.width=Nt,xt.height=It,xt.getContext("2d").drawImage(P,0,0,Nt,It),oe("WebGLRenderer: Texture has been resized from ("+gt.width+"x"+gt.height+") to ("+Nt+"x"+It+")."),xt}else return"data"in P&&oe("WebGLRenderer: Image in DataTexture is too big ("+gt.width+"x"+gt.height+")."),P;return P}function x(P){return P.generateMipmaps}function U(P){o.generateMipmap(P)}function F(P){return P.isWebGLCubeRenderTarget?o.TEXTURE_CUBE_MAP:P.isWebGL3DRenderTarget?o.TEXTURE_3D:P.isWebGLArrayRenderTarget||P.isCompressedArrayTexture?o.TEXTURE_2D_ARRAY:o.TEXTURE_2D}function C(P,E,et,at,gt,Nt=!1){if(P!==null){if(o[P]!==void 0)return o[P];oe("WebGLRenderer: Attempt to use non-existing WebGL internal format '"+P+"'")}let It;at&&(It=e.get("EXT_texture_norm16"),It||oe("WebGLRenderer: Unable to use normalized textures without EXT_texture_norm16 extension"));let xt=E;if(E===o.RED&&(et===o.FLOAT&&(xt=o.R32F),et===o.HALF_FLOAT&&(xt=o.R16F),et===o.UNSIGNED_BYTE&&(xt=o.R8),et===o.UNSIGNED_SHORT&&It&&(xt=It.R16_EXT),et===o.SHORT&&It&&(xt=It.R16_SNORM_EXT)),E===o.RED_INTEGER&&(et===o.UNSIGNED_BYTE&&(xt=o.R8UI),et===o.UNSIGNED_SHORT&&(xt=o.R16UI),et===o.UNSIGNED_INT&&(xt=o.R32UI),et===o.BYTE&&(xt=o.R8I),et===o.SHORT&&(xt=o.R16I),et===o.INT&&(xt=o.R32I)),E===o.RG&&(et===o.FLOAT&&(xt=o.RG32F),et===o.HALF_FLOAT&&(xt=o.RG16F),et===o.UNSIGNED_BYTE&&(xt=o.RG8),et===o.UNSIGNED_SHORT&&It&&(xt=It.RG16_EXT),et===o.SHORT&&It&&(xt=It.RG16_SNORM_EXT)),E===o.RG_INTEGER&&(et===o.UNSIGNED_BYTE&&(xt=o.RG8UI),et===o.UNSIGNED_SHORT&&(xt=o.RG16UI),et===o.UNSIGNED_INT&&(xt=o.RG32UI),et===o.BYTE&&(xt=o.RG8I),et===o.SHORT&&(xt=o.RG16I),et===o.INT&&(xt=o.RG32I)),E===o.RGB_INTEGER&&(et===o.UNSIGNED_BYTE&&(xt=o.RGB8UI),et===o.UNSIGNED_SHORT&&(xt=o.RGB16UI),et===o.UNSIGNED_INT&&(xt=o.RGB32UI),et===o.BYTE&&(xt=o.RGB8I),et===o.SHORT&&(xt=o.RGB16I),et===o.INT&&(xt=o.RGB32I)),E===o.RGBA_INTEGER&&(et===o.UNSIGNED_BYTE&&(xt=o.RGBA8UI),et===o.UNSIGNED_SHORT&&(xt=o.RGBA16UI),et===o.UNSIGNED_INT&&(xt=o.RGBA32UI),et===o.BYTE&&(xt=o.RGBA8I),et===o.SHORT&&(xt=o.RGBA16I),et===o.INT&&(xt=o.RGBA32I)),E===o.RGB&&(et===o.UNSIGNED_SHORT&&It&&(xt=It.RGB16_EXT),et===o.SHORT&&It&&(xt=It.RGB16_SNORM_EXT),et===o.UNSIGNED_INT_5_9_9_9_REV&&(xt=o.RGB9_E5),et===o.UNSIGNED_INT_10F_11F_11F_REV&&(xt=o.R11F_G11F_B10F)),E===o.RGBA){const St=Nt?Xu:Oe.getTransfer(gt);et===o.FLOAT&&(xt=o.RGBA32F),et===o.HALF_FLOAT&&(xt=o.RGBA16F),et===o.UNSIGNED_BYTE&&(xt=St===je?o.SRGB8_ALPHA8:o.RGBA8),et===o.UNSIGNED_SHORT&&It&&(xt=It.RGBA16_EXT),et===o.SHORT&&It&&(xt=It.RGBA16_SNORM_EXT),et===o.UNSIGNED_SHORT_4_4_4_4&&(xt=o.RGBA4),et===o.UNSIGNED_SHORT_5_5_5_1&&(xt=o.RGB5_A1)}return(xt===o.R16F||xt===o.R32F||xt===o.RG16F||xt===o.RG32F||xt===o.RGBA16F||xt===o.RGBA32F)&&e.get("EXT_color_buffer_float"),xt}function D(P,E){let et;return P?E===null||E===va||E===Ll?et=o.DEPTH24_STENCIL8:E===ma?et=o.DEPTH32F_STENCIL8:E===Ul&&(et=o.DEPTH24_STENCIL8,oe("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):E===null||E===va||E===Ll?et=o.DEPTH_COMPONENT24:E===ma?et=o.DEPTH_COMPONENT32F:E===Ul&&(et=o.DEPTH_COMPONENT16),et}function L(P,E){return x(P)===!0||P.isFramebufferTexture&&P.minFilter!==Fn&&P.minFilter!==kn?Math.log2(Math.max(E.width,E.height))+1:P.mipmaps!==void 0&&P.mipmaps.length>0?P.mipmaps.length:P.isCompressedTexture&&Array.isArray(P.image)?E.mipmaps.length:1}function I(P){const E=P.target;E.removeEventListener("dispose",I),O(E),E.isVideoTexture&&S.delete(E),E.isHTMLTexture&&_.delete(E)}function T(P){const E=P.target;E.removeEventListener("dispose",T),k(E)}function O(P){const E=s.get(P);if(E.__webglInit===void 0)return;const et=P.source,at=M.get(et);if(at){const gt=at[E.__cacheKey];gt.usedTimes--,gt.usedTimes===0&&G(P),Object.keys(at).length===0&&M.delete(et)}s.remove(P)}function G(P){const E=s.get(P);o.deleteTexture(E.__webglTexture);const et=P.source,at=M.get(et);delete at[E.__cacheKey],h.memory.textures--}function k(P){const E=s.get(P);if(P.depthTexture&&(P.depthTexture.dispose(),s.remove(P.depthTexture)),P.isWebGLCubeRenderTarget)for(let at=0;at<6;at++){if(Array.isArray(E.__webglFramebuffer[at]))for(let gt=0;gt<E.__webglFramebuffer[at].length;gt++)o.deleteFramebuffer(E.__webglFramebuffer[at][gt]);else o.deleteFramebuffer(E.__webglFramebuffer[at]);E.__webglDepthbuffer&&o.deleteRenderbuffer(E.__webglDepthbuffer[at])}else{if(Array.isArray(E.__webglFramebuffer))for(let at=0;at<E.__webglFramebuffer.length;at++)o.deleteFramebuffer(E.__webglFramebuffer[at]);else o.deleteFramebuffer(E.__webglFramebuffer);if(E.__webglDepthbuffer&&o.deleteRenderbuffer(E.__webglDepthbuffer),E.__webglMultisampledFramebuffer&&o.deleteFramebuffer(E.__webglMultisampledFramebuffer),E.__webglColorRenderbuffer)for(let at=0;at<E.__webglColorRenderbuffer.length;at++)E.__webglColorRenderbuffer[at]&&o.deleteRenderbuffer(E.__webglColorRenderbuffer[at]);E.__webglDepthRenderbuffer&&o.deleteRenderbuffer(E.__webglDepthRenderbuffer)}const et=P.textures;for(let at=0,gt=et.length;at<gt;at++){const Nt=s.get(et[at]);Nt.__webglTexture&&(o.deleteTexture(Nt.__webglTexture),h.memory.textures--),s.remove(et[at])}s.remove(P)}let Q=0;function st(){Q=0}function Y(){return Q}function tt(P){Q=P}function q(){const P=Q;return P>=l.maxTextures&&oe("WebGLTextures: Trying to use "+(P+1)+" texture units while this GPU supports only "+l.maxTextures),Q+=1,P}function j(P){const E=[];return E.push(P.wrapS),E.push(P.wrapT),E.push(P.wrapR||0),E.push(P.magFilter),E.push(P.minFilter),E.push(P.anisotropy),E.push(P.internalFormat),E.push(P.format),E.push(P.type),E.push(P.generateMipmaps),E.push(P.premultiplyAlpha),E.push(P.flipY),E.push(P.unpackAlignment),E.push(P.colorSpace),E.join()}function dt(P,E){const et=s.get(P);if(P.isVideoTexture&&X(P),P.isRenderTargetTexture===!1&&P.isExternalTexture!==!0&&P.version>0&&et.__version!==P.version){const at=P.image;if(at===null)oe("WebGLRenderer: Texture marked for update but no image data found.");else if(at.complete===!1)oe("WebGLRenderer: Texture marked for update but image is incomplete");else{Ct(et,P,E);return}}else P.isExternalTexture&&(et.__webglTexture=P.sourceTexture?P.sourceTexture:null);i.bindTexture(o.TEXTURE_2D,et.__webglTexture,o.TEXTURE0+E)}function ut(P,E){const et=s.get(P);if(P.isRenderTargetTexture===!1&&P.version>0&&et.__version!==P.version){Ct(et,P,E);return}else P.isExternalTexture&&(et.__webglTexture=P.sourceTexture?P.sourceTexture:null);i.bindTexture(o.TEXTURE_2D_ARRAY,et.__webglTexture,o.TEXTURE0+E)}function rt(P,E){const et=s.get(P);if(P.isRenderTargetTexture===!1&&P.version>0&&et.__version!==P.version){Ct(et,P,E);return}i.bindTexture(o.TEXTURE_3D,et.__webglTexture,o.TEXTURE0+E)}function Tt(P,E){const et=s.get(P);if(P.isCubeDepthTexture!==!0&&P.version>0&&et.__version!==P.version){Pt(et,P,E);return}i.bindTexture(o.TEXTURE_CUBE_MAP,et.__webglTexture,o.TEXTURE0+E)}const Gt={[Sp]:o.REPEAT,[Va]:o.CLAMP_TO_EDGE,[yp]:o.MIRRORED_REPEAT},Ot={[Fn]:o.NEAREST,[nb]:o.NEAREST_MIPMAP_NEAREST,[ou]:o.NEAREST_MIPMAP_LINEAR,[kn]:o.LINEAR,[Od]:o.LINEAR_MIPMAP_NEAREST,[ar]:o.LINEAR_MIPMAP_LINEAR},B={[rb]:o.NEVER,[fb]:o.ALWAYS,[ob]:o.LESS,[dm]:o.LEQUAL,[lb]:o.EQUAL,[pm]:o.GEQUAL,[cb]:o.GREATER,[ub]:o.NOTEQUAL};function _t(P,E){if(E.type===ma&&e.has("OES_texture_float_linear")===!1&&(E.magFilter===kn||E.magFilter===Od||E.magFilter===ou||E.magFilter===ar||E.minFilter===kn||E.minFilter===Od||E.minFilter===ou||E.minFilter===ar)&&oe("WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),o.texParameteri(P,o.TEXTURE_WRAP_S,Gt[E.wrapS]),o.texParameteri(P,o.TEXTURE_WRAP_T,Gt[E.wrapT]),(P===o.TEXTURE_3D||P===o.TEXTURE_2D_ARRAY)&&o.texParameteri(P,o.TEXTURE_WRAP_R,Gt[E.wrapR]),o.texParameteri(P,o.TEXTURE_MAG_FILTER,Ot[E.magFilter]),o.texParameteri(P,o.TEXTURE_MIN_FILTER,Ot[E.minFilter]),E.compareFunction&&(o.texParameteri(P,o.TEXTURE_COMPARE_MODE,o.COMPARE_REF_TO_TEXTURE),o.texParameteri(P,o.TEXTURE_COMPARE_FUNC,B[E.compareFunction])),e.has("EXT_texture_filter_anisotropic")===!0){if(E.magFilter===Fn||E.minFilter!==ou&&E.minFilter!==ar||E.type===ma&&e.has("OES_texture_float_linear")===!1)return;if(E.anisotropy>1||s.get(E).__currentAnisotropy){const et=e.get("EXT_texture_filter_anisotropic");o.texParameterf(P,et.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(E.anisotropy,l.getMaxAnisotropy())),s.get(E).__currentAnisotropy=E.anisotropy}}}function Dt(P,E){let et=!1;P.__webglInit===void 0&&(P.__webglInit=!0,E.addEventListener("dispose",I));const at=E.source;let gt=M.get(at);gt===void 0&&(gt={},M.set(at,gt));const Nt=j(E);if(Nt!==P.__cacheKey){gt[Nt]===void 0&&(gt[Nt]={texture:o.createTexture(),usedTimes:0},h.memory.textures++,et=!0),gt[Nt].usedTimes++;const It=gt[P.__cacheKey];It!==void 0&&(gt[P.__cacheKey].usedTimes--,It.usedTimes===0&&G(E)),P.__cacheKey=Nt,P.__webglTexture=gt[Nt].texture}return et}function Z(P,E,et){return Math.floor(Math.floor(P/et)/E)}function ft(P,E,et,at){const Nt=P.updateRanges;if(Nt.length===0)i.texSubImage2D(o.TEXTURE_2D,0,0,0,E.width,E.height,et,at,E.data);else{Nt.sort((wt,yt)=>wt.start-yt.start);let It=0;for(let wt=1;wt<Nt.length;wt++){const yt=Nt[It],At=Nt[wt],Lt=yt.start+yt.count,Qt=Z(At.start,E.width,4),ae=Z(yt.start,E.width,4);At.start<=Lt+1&&Qt===ae&&Z(At.start+At.count-1,E.width,4)===Qt?yt.count=Math.max(yt.count,At.start+At.count-yt.start):(++It,Nt[It]=At)}Nt.length=It+1;const xt=i.getParameter(o.UNPACK_ROW_LENGTH),St=i.getParameter(o.UNPACK_SKIP_PIXELS),mt=i.getParameter(o.UNPACK_SKIP_ROWS);i.pixelStorei(o.UNPACK_ROW_LENGTH,E.width);for(let wt=0,yt=Nt.length;wt<yt;wt++){const At=Nt[wt],Lt=Math.floor(At.start/4),Qt=Math.ceil(At.count/4),ae=Lt%E.width,W=Math.floor(Lt/E.width),zt=Qt,bt=1;i.pixelStorei(o.UNPACK_SKIP_PIXELS,ae),i.pixelStorei(o.UNPACK_SKIP_ROWS,W),i.texSubImage2D(o.TEXTURE_2D,0,ae,W,zt,bt,et,at,E.data)}P.clearUpdateRanges(),i.pixelStorei(o.UNPACK_ROW_LENGTH,xt),i.pixelStorei(o.UNPACK_SKIP_PIXELS,St),i.pixelStorei(o.UNPACK_SKIP_ROWS,mt)}}function Ct(P,E,et){let at=o.TEXTURE_2D;(E.isDataArrayTexture||E.isCompressedArrayTexture)&&(at=o.TEXTURE_2D_ARRAY),E.isData3DTexture&&(at=o.TEXTURE_3D);const gt=Dt(P,E),Nt=E.source;i.bindTexture(at,P.__webglTexture,o.TEXTURE0+et);const It=s.get(Nt);if(Nt.version!==It.__version||gt===!0){if(i.activeTexture(o.TEXTURE0+et),(typeof ImageBitmap<"u"&&E.image instanceof ImageBitmap)===!1){const bt=Oe.getPrimaries(Oe.workingColorSpace),Bt=E.colorSpace===As?null:Oe.getPrimaries(E.colorSpace),qt=E.colorSpace===As||bt===Bt?o.NONE:o.BROWSER_DEFAULT_WEBGL;i.pixelStorei(o.UNPACK_FLIP_Y_WEBGL,E.flipY),i.pixelStorei(o.UNPACK_PREMULTIPLY_ALPHA_WEBGL,E.premultiplyAlpha),i.pixelStorei(o.UNPACK_COLORSPACE_CONVERSION_WEBGL,qt)}i.pixelStorei(o.UNPACK_ALIGNMENT,E.unpackAlignment);let St=y(E.image,!1,l.maxTextureSize);St=Ke(E,St);const mt=f.convert(E.format,E.colorSpace),wt=f.convert(E.type);let yt=C(E.internalFormat,mt,wt,E.normalized,E.colorSpace,E.isVideoTexture);_t(at,E);let At;const Lt=E.mipmaps,Qt=E.isVideoTexture!==!0,ae=It.__version===void 0||gt===!0,W=Nt.dataReady,zt=L(E,St);if(E.isDepthTexture)yt=D(E.format===sr,E.type),ae&&(Qt?i.texStorage2D(o.TEXTURE_2D,1,yt,St.width,St.height):i.texImage2D(o.TEXTURE_2D,0,yt,St.width,St.height,0,mt,wt,null));else if(E.isDataTexture)if(Lt.length>0){Qt&&ae&&i.texStorage2D(o.TEXTURE_2D,zt,yt,Lt[0].width,Lt[0].height);for(let bt=0,Bt=Lt.length;bt<Bt;bt++)At=Lt[bt],Qt?W&&i.texSubImage2D(o.TEXTURE_2D,bt,0,0,At.width,At.height,mt,wt,At.data):i.texImage2D(o.TEXTURE_2D,bt,yt,At.width,At.height,0,mt,wt,At.data);E.generateMipmaps=!1}else Qt?(ae&&i.texStorage2D(o.TEXTURE_2D,zt,yt,St.width,St.height),W&&ft(E,St,mt,wt)):i.texImage2D(o.TEXTURE_2D,0,yt,St.width,St.height,0,mt,wt,St.data);else if(E.isCompressedTexture)if(E.isCompressedArrayTexture){Qt&&ae&&i.texStorage3D(o.TEXTURE_2D_ARRAY,zt,yt,Lt[0].width,Lt[0].height,St.depth);for(let bt=0,Bt=Lt.length;bt<Bt;bt++)if(At=Lt[bt],E.format!==Zi)if(mt!==null)if(Qt){if(W)if(E.layerUpdates.size>0){const qt=Ax(At.width,At.height,E.format,E.type);for(const Rt of E.layerUpdates){const te=At.data.subarray(Rt*qt/At.data.BYTES_PER_ELEMENT,(Rt+1)*qt/At.data.BYTES_PER_ELEMENT);i.compressedTexSubImage3D(o.TEXTURE_2D_ARRAY,bt,0,0,Rt,At.width,At.height,1,mt,te)}}else i.compressedTexSubImage3D(o.TEXTURE_2D_ARRAY,bt,0,0,0,At.width,At.height,St.depth,mt,At.data)}else i.compressedTexImage3D(o.TEXTURE_2D_ARRAY,bt,yt,At.width,At.height,St.depth,0,At.data,0,0);else oe("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else Qt?W&&i.texSubImage3D(o.TEXTURE_2D_ARRAY,bt,0,0,0,At.width,At.height,St.depth,mt,wt,At.data):i.texImage3D(o.TEXTURE_2D_ARRAY,bt,yt,At.width,At.height,St.depth,0,mt,wt,At.data);E.layerUpdates.size>0&&E.clearLayerUpdates()}else{Qt&&ae&&i.texStorage2D(o.TEXTURE_2D,zt,yt,Lt[0].width,Lt[0].height);for(let bt=0,Bt=Lt.length;bt<Bt;bt++)At=Lt[bt],E.format!==Zi?mt!==null?Qt?W&&i.compressedTexSubImage2D(o.TEXTURE_2D,bt,0,0,At.width,At.height,mt,At.data):i.compressedTexImage2D(o.TEXTURE_2D,bt,yt,At.width,At.height,0,At.data):oe("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):Qt?W&&i.texSubImage2D(o.TEXTURE_2D,bt,0,0,At.width,At.height,mt,wt,At.data):i.texImage2D(o.TEXTURE_2D,bt,yt,At.width,At.height,0,mt,wt,At.data)}else if(E.isDataArrayTexture)if(Qt){if(ae&&i.texStorage3D(o.TEXTURE_2D_ARRAY,zt,yt,St.width,St.height,St.depth),W)if(E.layerUpdates.size>0){const bt=Ax(St.width,St.height,E.format,E.type);for(const Bt of E.layerUpdates){const qt=St.data.subarray(Bt*bt/St.data.BYTES_PER_ELEMENT,(Bt+1)*bt/St.data.BYTES_PER_ELEMENT);i.texSubImage3D(o.TEXTURE_2D_ARRAY,0,0,0,Bt,St.width,St.height,1,mt,wt,qt)}E.clearLayerUpdates()}else i.texSubImage3D(o.TEXTURE_2D_ARRAY,0,0,0,0,St.width,St.height,St.depth,mt,wt,St.data)}else i.texImage3D(o.TEXTURE_2D_ARRAY,0,yt,St.width,St.height,St.depth,0,mt,wt,St.data);else if(E.isData3DTexture)Qt?(ae&&i.texStorage3D(o.TEXTURE_3D,zt,yt,St.width,St.height,St.depth),W&&i.texSubImage3D(o.TEXTURE_3D,0,0,0,0,St.width,St.height,St.depth,mt,wt,St.data)):i.texImage3D(o.TEXTURE_3D,0,yt,St.width,St.height,St.depth,0,mt,wt,St.data);else if(E.isFramebufferTexture){if(ae)if(Qt)i.texStorage2D(o.TEXTURE_2D,zt,yt,St.width,St.height);else{let bt=St.width,Bt=St.height;for(let qt=0;qt<zt;qt++)i.texImage2D(o.TEXTURE_2D,qt,yt,bt,Bt,0,mt,wt,null),bt>>=1,Bt>>=1}}else if(E.isHTMLTexture){if("texElementImage2D"in o){const bt=o.canvas;if(bt.hasAttribute("layoutsubtree")||bt.setAttribute("layoutsubtree","true"),St.parentNode!==bt){bt.appendChild(St),_.add(E),bt.onpaint=Bt=>{const qt=Bt.changedElements;for(const Rt of _)qt.includes(Rt.image)&&(Rt.needsUpdate=!0)},bt.requestPaint();return}if(o.texElementImage2D.length===3)o.texElementImage2D(o.TEXTURE_2D,o.RGBA8,St);else{const qt=o.RGBA,Rt=o.RGBA,te=o.UNSIGNED_BYTE;o.texElementImage2D(o.TEXTURE_2D,0,qt,Rt,te,St)}o.texParameteri(o.TEXTURE_2D,o.TEXTURE_MIN_FILTER,o.LINEAR),o.texParameteri(o.TEXTURE_2D,o.TEXTURE_WRAP_S,o.CLAMP_TO_EDGE),o.texParameteri(o.TEXTURE_2D,o.TEXTURE_WRAP_T,o.CLAMP_TO_EDGE)}}else if(Lt.length>0){if(Qt&&ae){const bt=Ee(Lt[0]);i.texStorage2D(o.TEXTURE_2D,zt,yt,bt.width,bt.height)}for(let bt=0,Bt=Lt.length;bt<Bt;bt++)At=Lt[bt],Qt?W&&i.texSubImage2D(o.TEXTURE_2D,bt,0,0,mt,wt,At):i.texImage2D(o.TEXTURE_2D,bt,yt,mt,wt,At);E.generateMipmaps=!1}else if(Qt){if(ae){const bt=Ee(St);i.texStorage2D(o.TEXTURE_2D,zt,yt,bt.width,bt.height)}W&&i.texSubImage2D(o.TEXTURE_2D,0,0,0,mt,wt,St)}else i.texImage2D(o.TEXTURE_2D,0,yt,mt,wt,St);x(E)&&U(at),It.__version=Nt.version,E.onUpdate&&E.onUpdate(E)}P.__version=E.version}function Pt(P,E,et){if(E.image.length!==6)return;const at=Dt(P,E),gt=E.source;i.bindTexture(o.TEXTURE_CUBE_MAP,P.__webglTexture,o.TEXTURE0+et);const Nt=s.get(gt);if(gt.version!==Nt.__version||at===!0){i.activeTexture(o.TEXTURE0+et);const It=Oe.getPrimaries(Oe.workingColorSpace),xt=E.colorSpace===As?null:Oe.getPrimaries(E.colorSpace),St=E.colorSpace===As||It===xt?o.NONE:o.BROWSER_DEFAULT_WEBGL;i.pixelStorei(o.UNPACK_FLIP_Y_WEBGL,E.flipY),i.pixelStorei(o.UNPACK_PREMULTIPLY_ALPHA_WEBGL,E.premultiplyAlpha),i.pixelStorei(o.UNPACK_ALIGNMENT,E.unpackAlignment),i.pixelStorei(o.UNPACK_COLORSPACE_CONVERSION_WEBGL,St);const mt=E.isCompressedTexture||E.image[0].isCompressedTexture,wt=E.image[0]&&E.image[0].isDataTexture,yt=[];for(let Rt=0;Rt<6;Rt++)!mt&&!wt?yt[Rt]=y(E.image[Rt],!0,l.maxCubemapSize):yt[Rt]=wt?E.image[Rt].image:E.image[Rt],yt[Rt]=Ke(E,yt[Rt]);const At=yt[0],Lt=f.convert(E.format,E.colorSpace),Qt=f.convert(E.type),ae=C(E.internalFormat,Lt,Qt,E.normalized,E.colorSpace),W=E.isVideoTexture!==!0,zt=Nt.__version===void 0||at===!0,bt=gt.dataReady;let Bt=L(E,At);_t(o.TEXTURE_CUBE_MAP,E);let qt;if(mt){W&&zt&&i.texStorage2D(o.TEXTURE_CUBE_MAP,Bt,ae,At.width,At.height);for(let Rt=0;Rt<6;Rt++){qt=yt[Rt].mipmaps;for(let te=0;te<qt.length;te++){const Wt=qt[te];E.format!==Zi?Lt!==null?W?bt&&i.compressedTexSubImage2D(o.TEXTURE_CUBE_MAP_POSITIVE_X+Rt,te,0,0,Wt.width,Wt.height,Lt,Wt.data):i.compressedTexImage2D(o.TEXTURE_CUBE_MAP_POSITIVE_X+Rt,te,ae,Wt.width,Wt.height,0,Wt.data):oe("WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):W?bt&&i.texSubImage2D(o.TEXTURE_CUBE_MAP_POSITIVE_X+Rt,te,0,0,Wt.width,Wt.height,Lt,Qt,Wt.data):i.texImage2D(o.TEXTURE_CUBE_MAP_POSITIVE_X+Rt,te,ae,Wt.width,Wt.height,0,Lt,Qt,Wt.data)}}}else{if(qt=E.mipmaps,W&&zt){qt.length>0&&Bt++;const Rt=Ee(yt[0]);i.texStorage2D(o.TEXTURE_CUBE_MAP,Bt,ae,Rt.width,Rt.height)}for(let Rt=0;Rt<6;Rt++)if(wt){W?bt&&i.texSubImage2D(o.TEXTURE_CUBE_MAP_POSITIVE_X+Rt,0,0,0,yt[Rt].width,yt[Rt].height,Lt,Qt,yt[Rt].data):i.texImage2D(o.TEXTURE_CUBE_MAP_POSITIVE_X+Rt,0,ae,yt[Rt].width,yt[Rt].height,0,Lt,Qt,yt[Rt].data);for(let te=0;te<qt.length;te++){const Ue=qt[te].image[Rt].image;W?bt&&i.texSubImage2D(o.TEXTURE_CUBE_MAP_POSITIVE_X+Rt,te+1,0,0,Ue.width,Ue.height,Lt,Qt,Ue.data):i.texImage2D(o.TEXTURE_CUBE_MAP_POSITIVE_X+Rt,te+1,ae,Ue.width,Ue.height,0,Lt,Qt,Ue.data)}}else{W?bt&&i.texSubImage2D(o.TEXTURE_CUBE_MAP_POSITIVE_X+Rt,0,0,0,Lt,Qt,yt[Rt]):i.texImage2D(o.TEXTURE_CUBE_MAP_POSITIVE_X+Rt,0,ae,Lt,Qt,yt[Rt]);for(let te=0;te<qt.length;te++){const Wt=qt[te];W?bt&&i.texSubImage2D(o.TEXTURE_CUBE_MAP_POSITIVE_X+Rt,te+1,0,0,Lt,Qt,Wt.image[Rt]):i.texImage2D(o.TEXTURE_CUBE_MAP_POSITIVE_X+Rt,te+1,ae,Lt,Qt,Wt.image[Rt])}}}x(E)&&U(o.TEXTURE_CUBE_MAP),Nt.__version=gt.version,E.onUpdate&&E.onUpdate(E)}P.__version=E.version}function vt(P,E,et,at,gt,Nt){const It=f.convert(et.format,et.colorSpace),xt=f.convert(et.type),St=C(et.internalFormat,It,xt,et.normalized,et.colorSpace),mt=s.get(E),wt=s.get(et);if(wt.__renderTarget=E,!mt.__hasExternalTextures){const yt=Math.max(1,E.width>>Nt),At=Math.max(1,E.height>>Nt);gt===o.TEXTURE_3D||gt===o.TEXTURE_2D_ARRAY?i.texImage3D(gt,Nt,St,yt,At,E.depth,0,It,xt,null):i.texImage2D(gt,Nt,St,yt,At,0,It,xt,null)}i.bindFramebuffer(o.FRAMEBUFFER,P),$e(E)?d.framebufferTexture2DMultisampleEXT(o.FRAMEBUFFER,at,gt,wt.__webglTexture,0,Pe(E)):(gt===o.TEXTURE_2D||gt>=o.TEXTURE_CUBE_MAP_POSITIVE_X&&gt<=o.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&o.framebufferTexture2D(o.FRAMEBUFFER,at,gt,wt.__webglTexture,Nt),i.bindFramebuffer(o.FRAMEBUFFER,null)}function Ut(P,E,et){if(o.bindRenderbuffer(o.RENDERBUFFER,P),E.depthBuffer){const at=E.depthTexture,gt=at&&at.isDepthTexture?at.type:null,Nt=D(E.stencilBuffer,gt),It=E.stencilBuffer?o.DEPTH_STENCIL_ATTACHMENT:o.DEPTH_ATTACHMENT;$e(E)?d.renderbufferStorageMultisampleEXT(o.RENDERBUFFER,Pe(E),Nt,E.width,E.height):et?o.renderbufferStorageMultisample(o.RENDERBUFFER,Pe(E),Nt,E.width,E.height):o.renderbufferStorage(o.RENDERBUFFER,Nt,E.width,E.height),o.framebufferRenderbuffer(o.FRAMEBUFFER,It,o.RENDERBUFFER,P)}else{const at=E.textures;for(let gt=0;gt<at.length;gt++){const Nt=at[gt],It=f.convert(Nt.format,Nt.colorSpace),xt=f.convert(Nt.type),St=C(Nt.internalFormat,It,xt,Nt.normalized,Nt.colorSpace);$e(E)?d.renderbufferStorageMultisampleEXT(o.RENDERBUFFER,Pe(E),St,E.width,E.height):et?o.renderbufferStorageMultisample(o.RENDERBUFFER,Pe(E),St,E.width,E.height):o.renderbufferStorage(o.RENDERBUFFER,St,E.width,E.height)}}o.bindRenderbuffer(o.RENDERBUFFER,null)}function be(P,E,et){const at=E.isWebGLCubeRenderTarget===!0;if(i.bindFramebuffer(o.FRAMEBUFFER,P),!(E.depthTexture&&E.depthTexture.isDepthTexture))throw new Error("THREE.WebGLTextures: renderTarget.depthTexture must be an instance of THREE.DepthTexture.");const gt=s.get(E.depthTexture);if(gt.__renderTarget=E,(!gt.__webglTexture||E.depthTexture.image.width!==E.width||E.depthTexture.image.height!==E.height)&&(E.depthTexture.image.width=E.width,E.depthTexture.image.height=E.height,E.depthTexture.needsUpdate=!0),at){if(gt.__webglInit===void 0&&(gt.__webglInit=!0,E.depthTexture.addEventListener("dispose",I)),gt.__webglTexture===void 0){gt.__webglTexture=o.createTexture(),i.bindTexture(o.TEXTURE_CUBE_MAP,gt.__webglTexture),_t(o.TEXTURE_CUBE_MAP,E.depthTexture);const mt=f.convert(E.depthTexture.format),wt=f.convert(E.depthTexture.type);let yt;E.depthTexture.format===qa?yt=o.DEPTH_COMPONENT24:E.depthTexture.format===sr&&(yt=o.DEPTH24_STENCIL8);for(let At=0;At<6;At++)o.texImage2D(o.TEXTURE_CUBE_MAP_POSITIVE_X+At,0,yt,E.width,E.height,0,mt,wt,null)}}else dt(E.depthTexture,0);const Nt=gt.__webglTexture,It=Pe(E),xt=at?o.TEXTURE_CUBE_MAP_POSITIVE_X+et:o.TEXTURE_2D,St=E.depthTexture.format===sr?o.DEPTH_STENCIL_ATTACHMENT:o.DEPTH_ATTACHMENT;if(E.depthTexture.format===qa)$e(E)?d.framebufferTexture2DMultisampleEXT(o.FRAMEBUFFER,St,xt,Nt,0,It):o.framebufferTexture2D(o.FRAMEBUFFER,St,xt,Nt,0);else if(E.depthTexture.format===sr)$e(E)?d.framebufferTexture2DMultisampleEXT(o.FRAMEBUFFER,St,xt,Nt,0,It):o.framebufferTexture2D(o.FRAMEBUFFER,St,xt,Nt,0);else throw new Error("THREE.WebGLTextures: Unknown depthTexture format.")}function ue(P){const E=s.get(P),et=P.isWebGLCubeRenderTarget===!0;if(E.__boundDepthTexture!==P.depthTexture){const at=P.depthTexture;if(E.__depthDisposeCallback&&E.__depthDisposeCallback(),at){const gt=()=>{delete E.__boundDepthTexture,delete E.__depthDisposeCallback,at.removeEventListener("dispose",gt)};at.addEventListener("dispose",gt),E.__depthDisposeCallback=gt}E.__boundDepthTexture=at}if(P.depthTexture&&!E.__autoAllocateDepthBuffer)if(et)for(let at=0;at<6;at++)be(E.__webglFramebuffer[at],P,at);else{const at=P.texture.mipmaps;at&&at.length>0?be(E.__webglFramebuffer[0],P,0):be(E.__webglFramebuffer,P,0)}else if(et){E.__webglDepthbuffer=[];for(let at=0;at<6;at++)if(i.bindFramebuffer(o.FRAMEBUFFER,E.__webglFramebuffer[at]),E.__webglDepthbuffer[at]===void 0)E.__webglDepthbuffer[at]=o.createRenderbuffer(),Ut(E.__webglDepthbuffer[at],P,!1);else{const gt=P.stencilBuffer?o.DEPTH_STENCIL_ATTACHMENT:o.DEPTH_ATTACHMENT,Nt=E.__webglDepthbuffer[at];o.bindRenderbuffer(o.RENDERBUFFER,Nt),o.framebufferRenderbuffer(o.FRAMEBUFFER,gt,o.RENDERBUFFER,Nt)}}else{const at=P.texture.mipmaps;if(at&&at.length>0?i.bindFramebuffer(o.FRAMEBUFFER,E.__webglFramebuffer[0]):i.bindFramebuffer(o.FRAMEBUFFER,E.__webglFramebuffer),E.__webglDepthbuffer===void 0)E.__webglDepthbuffer=o.createRenderbuffer(),Ut(E.__webglDepthbuffer,P,!1);else{const gt=P.stencilBuffer?o.DEPTH_STENCIL_ATTACHMENT:o.DEPTH_ATTACHMENT,Nt=E.__webglDepthbuffer;o.bindRenderbuffer(o.RENDERBUFFER,Nt),o.framebufferRenderbuffer(o.FRAMEBUFFER,gt,o.RENDERBUFFER,Nt)}}i.bindFramebuffer(o.FRAMEBUFFER,null)}function pe(P,E,et){const at=s.get(P);E!==void 0&&vt(at.__webglFramebuffer,P,P.texture,o.COLOR_ATTACHMENT0,o.TEXTURE_2D,0),et!==void 0&&ue(P)}function _e(P){const E=P.texture,et=s.get(P),at=s.get(E);P.addEventListener("dispose",T);const gt=P.textures,Nt=P.isWebGLCubeRenderTarget===!0,It=gt.length>1;if(It||(at.__webglTexture===void 0&&(at.__webglTexture=o.createTexture()),at.__version=E.version,h.memory.textures++),Nt){et.__webglFramebuffer=[];for(let xt=0;xt<6;xt++)if(E.mipmaps&&E.mipmaps.length>0){et.__webglFramebuffer[xt]=[];for(let St=0;St<E.mipmaps.length;St++)et.__webglFramebuffer[xt][St]=o.createFramebuffer()}else et.__webglFramebuffer[xt]=o.createFramebuffer()}else{if(E.mipmaps&&E.mipmaps.length>0){et.__webglFramebuffer=[];for(let xt=0;xt<E.mipmaps.length;xt++)et.__webglFramebuffer[xt]=o.createFramebuffer()}else et.__webglFramebuffer=o.createFramebuffer();if(It)for(let xt=0,St=gt.length;xt<St;xt++){const mt=s.get(gt[xt]);mt.__webglTexture===void 0&&(mt.__webglTexture=o.createTexture(),h.memory.textures++)}if(P.samples>0&&$e(P)===!1){et.__webglMultisampledFramebuffer=o.createFramebuffer(),et.__webglColorRenderbuffer=[],i.bindFramebuffer(o.FRAMEBUFFER,et.__webglMultisampledFramebuffer);for(let xt=0;xt<gt.length;xt++){const St=gt[xt];et.__webglColorRenderbuffer[xt]=o.createRenderbuffer(),o.bindRenderbuffer(o.RENDERBUFFER,et.__webglColorRenderbuffer[xt]);const mt=f.convert(St.format,St.colorSpace),wt=f.convert(St.type),yt=C(St.internalFormat,mt,wt,St.normalized,St.colorSpace,P.isXRRenderTarget===!0),At=Pe(P);o.renderbufferStorageMultisample(o.RENDERBUFFER,At,yt,P.width,P.height),o.framebufferRenderbuffer(o.FRAMEBUFFER,o.COLOR_ATTACHMENT0+xt,o.RENDERBUFFER,et.__webglColorRenderbuffer[xt])}o.bindRenderbuffer(o.RENDERBUFFER,null),P.depthBuffer&&(et.__webglDepthRenderbuffer=o.createRenderbuffer(),Ut(et.__webglDepthRenderbuffer,P,!0)),i.bindFramebuffer(o.FRAMEBUFFER,null)}}if(Nt){i.bindTexture(o.TEXTURE_CUBE_MAP,at.__webglTexture),_t(o.TEXTURE_CUBE_MAP,E);for(let xt=0;xt<6;xt++)if(E.mipmaps&&E.mipmaps.length>0)for(let St=0;St<E.mipmaps.length;St++)vt(et.__webglFramebuffer[xt][St],P,E,o.COLOR_ATTACHMENT0,o.TEXTURE_CUBE_MAP_POSITIVE_X+xt,St);else vt(et.__webglFramebuffer[xt],P,E,o.COLOR_ATTACHMENT0,o.TEXTURE_CUBE_MAP_POSITIVE_X+xt,0);x(E)&&U(o.TEXTURE_CUBE_MAP),i.unbindTexture()}else if(It){for(let xt=0,St=gt.length;xt<St;xt++){const mt=gt[xt],wt=s.get(mt);let yt=o.TEXTURE_2D;(P.isWebGL3DRenderTarget||P.isWebGLArrayRenderTarget)&&(yt=P.isWebGL3DRenderTarget?o.TEXTURE_3D:o.TEXTURE_2D_ARRAY),i.bindTexture(yt,wt.__webglTexture),_t(yt,mt),vt(et.__webglFramebuffer,P,mt,o.COLOR_ATTACHMENT0+xt,yt,0),x(mt)&&U(yt)}i.unbindTexture()}else{let xt=o.TEXTURE_2D;if((P.isWebGL3DRenderTarget||P.isWebGLArrayRenderTarget)&&(xt=P.isWebGL3DRenderTarget?o.TEXTURE_3D:o.TEXTURE_2D_ARRAY),i.bindTexture(xt,at.__webglTexture),_t(xt,E),E.mipmaps&&E.mipmaps.length>0)for(let St=0;St<E.mipmaps.length;St++)vt(et.__webglFramebuffer[St],P,E,o.COLOR_ATTACHMENT0,xt,St);else vt(et.__webglFramebuffer,P,E,o.COLOR_ATTACHMENT0,xt,0);x(E)&&U(xt),i.unbindTexture()}P.depthBuffer&&ue(P)}function ee(P){const E=P.textures;for(let et=0,at=E.length;et<at;et++){const gt=E[et];if(x(gt)){const Nt=F(P),It=s.get(gt).__webglTexture;i.bindTexture(Nt,It),U(Nt),i.unbindTexture()}}}const ne=[],Be=[];function rn(P){if(P.samples>0){if($e(P)===!1){const E=P.textures,et=P.width,at=P.height;let gt=o.COLOR_BUFFER_BIT;const Nt=P.stencilBuffer?o.DEPTH_STENCIL_ATTACHMENT:o.DEPTH_ATTACHMENT,It=s.get(P),xt=E.length>1;if(xt)for(let mt=0;mt<E.length;mt++)i.bindFramebuffer(o.FRAMEBUFFER,It.__webglMultisampledFramebuffer),o.framebufferRenderbuffer(o.FRAMEBUFFER,o.COLOR_ATTACHMENT0+mt,o.RENDERBUFFER,null),i.bindFramebuffer(o.FRAMEBUFFER,It.__webglFramebuffer),o.framebufferTexture2D(o.DRAW_FRAMEBUFFER,o.COLOR_ATTACHMENT0+mt,o.TEXTURE_2D,null,0);i.bindFramebuffer(o.READ_FRAMEBUFFER,It.__webglMultisampledFramebuffer);const St=P.texture.mipmaps;St&&St.length>0?i.bindFramebuffer(o.DRAW_FRAMEBUFFER,It.__webglFramebuffer[0]):i.bindFramebuffer(o.DRAW_FRAMEBUFFER,It.__webglFramebuffer);for(let mt=0;mt<E.length;mt++){if(P.resolveDepthBuffer&&(P.depthBuffer&&(gt|=o.DEPTH_BUFFER_BIT),P.stencilBuffer&&P.resolveStencilBuffer&&(gt|=o.STENCIL_BUFFER_BIT)),xt){o.framebufferRenderbuffer(o.READ_FRAMEBUFFER,o.COLOR_ATTACHMENT0,o.RENDERBUFFER,It.__webglColorRenderbuffer[mt]);const wt=s.get(E[mt]).__webglTexture;o.framebufferTexture2D(o.DRAW_FRAMEBUFFER,o.COLOR_ATTACHMENT0,o.TEXTURE_2D,wt,0)}o.blitFramebuffer(0,0,et,at,0,0,et,at,gt,o.NEAREST),m===!0&&(ne.length=0,Be.length=0,ne.push(o.COLOR_ATTACHMENT0+mt),P.depthBuffer&&P.storeMultisampledDepthBuffer===!1&&(ne.push(Nt),Be.push(Nt),o.invalidateFramebuffer(o.DRAW_FRAMEBUFFER,Be)),o.invalidateFramebuffer(o.READ_FRAMEBUFFER,ne))}if(i.bindFramebuffer(o.READ_FRAMEBUFFER,null),i.bindFramebuffer(o.DRAW_FRAMEBUFFER,null),xt)for(let mt=0;mt<E.length;mt++){i.bindFramebuffer(o.FRAMEBUFFER,It.__webglMultisampledFramebuffer),o.framebufferRenderbuffer(o.FRAMEBUFFER,o.COLOR_ATTACHMENT0+mt,o.RENDERBUFFER,It.__webglColorRenderbuffer[mt]);const wt=s.get(E[mt]).__webglTexture;i.bindFramebuffer(o.FRAMEBUFFER,It.__webglFramebuffer),o.framebufferTexture2D(o.DRAW_FRAMEBUFFER,o.COLOR_ATTACHMENT0+mt,o.TEXTURE_2D,wt,0)}i.bindFramebuffer(o.DRAW_FRAMEBUFFER,It.__webglMultisampledFramebuffer)}else if(P.depthBuffer&&P.storeMultisampledDepthBuffer===!1&&m){const E=P.stencilBuffer?o.DEPTH_STENCIL_ATTACHMENT:o.DEPTH_ATTACHMENT;o.invalidateFramebuffer(o.DRAW_FRAMEBUFFER,[E])}}}function Pe(P){return Math.min(l.maxSamples,P.samples)}function $e(P){const E=s.get(P);return P.samples>0&&e.has("WEBGL_multisampled_render_to_texture")===!0&&E.__useRenderToTexture!==!1}function X(P){const E=h.render.frame;S.get(P)!==E&&(S.set(P,E),P.update())}function Ke(P,E){const et=P.colorSpace,at=P.format,gt=P.type;return P.isCompressedTexture===!0||P.isVideoTexture===!0||et!==ku&&et!==As&&(Oe.getTransfer(et)===je?(at!==Zi||gt!==yi)&&oe("WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):Fe("WebGLTextures: Unsupported texture color space:",et)),E}function Ee(P){return typeof HTMLImageElement<"u"&&P instanceof HTMLImageElement?(p.width=P.naturalWidth||P.width,p.height=P.naturalHeight||P.height):typeof VideoFrame<"u"&&P instanceof VideoFrame?(p.width=P.displayWidth,p.height=P.displayHeight):(p.width=P.width,p.height=P.height),p}this.allocateTextureUnit=q,this.resetTextureUnits=st,this.getTextureUnits=Y,this.setTextureUnits=tt,this.setTexture2D=dt,this.setTexture2DArray=ut,this.setTexture3D=rt,this.setTextureCube=Tt,this.rebindTextures=pe,this.setupRenderTarget=_e,this.updateRenderTargetMipmap=ee,this.updateMultisampleRenderTarget=rn,this.setupDepthRenderbuffer=ue,this.setupFrameBufferTexture=vt,this.useMultisampledRTT=$e,this.isReversedDepthBuffer=function(){return i.buffers.depth.getReversed()}}function Yw(o,e){function i(s,l=As){let f;const h=Oe.getTransfer(l);if(s===yi)return o.UNSIGNED_BYTE;if(s===lm)return o.UNSIGNED_SHORT_4_4_4_4;if(s===cm)return o.UNSIGNED_SHORT_5_5_5_1;if(s===hS)return o.UNSIGNED_INT_5_9_9_9_REV;if(s===dS)return o.UNSIGNED_INT_10F_11F_11F_REV;if(s===uS)return o.BYTE;if(s===fS)return o.SHORT;if(s===Ul)return o.UNSIGNED_SHORT;if(s===om)return o.INT;if(s===va)return o.UNSIGNED_INT;if(s===ma)return o.FLOAT;if(s===xa)return o.HALF_FLOAT;if(s===pS)return o.ALPHA;if(s===mS)return o.RGB;if(s===Zi)return o.RGBA;if(s===qa)return o.DEPTH_COMPONENT;if(s===sr)return o.DEPTH_STENCIL;if(s===gS)return o.RED;if(s===um)return o.RED_INTEGER;if(s===lr)return o.RG;if(s===fm)return o.RG_INTEGER;if(s===hm)return o.RGBA_INTEGER;if(s===Pu||s===Iu||s===zu||s===Bu)if(h===je)if(f=e.get("WEBGL_compressed_texture_s3tc_srgb"),f!==null){if(s===Pu)return f.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(s===Iu)return f.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(s===zu)return f.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(s===Bu)return f.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(f=e.get("WEBGL_compressed_texture_s3tc"),f!==null){if(s===Pu)return f.COMPRESSED_RGB_S3TC_DXT1_EXT;if(s===Iu)return f.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(s===zu)return f.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(s===Bu)return f.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(s===Mp||s===Ep||s===bp||s===Tp)if(f=e.get("WEBGL_compressed_texture_pvrtc"),f!==null){if(s===Mp)return f.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(s===Ep)return f.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(s===bp)return f.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(s===Tp)return f.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(s===Ap||s===Rp||s===wp||s===Cp||s===Np||s===Gu||s===Dp)if(f=e.get("WEBGL_compressed_texture_etc"),f!==null){if(s===Ap||s===Rp)return h===je?f.COMPRESSED_SRGB8_ETC2:f.COMPRESSED_RGB8_ETC2;if(s===wp)return h===je?f.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:f.COMPRESSED_RGBA8_ETC2_EAC;if(s===Cp)return f.COMPRESSED_R11_EAC;if(s===Np)return f.COMPRESSED_SIGNED_R11_EAC;if(s===Gu)return f.COMPRESSED_RG11_EAC;if(s===Dp)return f.COMPRESSED_SIGNED_RG11_EAC}else return null;if(s===Up||s===Lp||s===Op||s===Pp||s===Ip||s===zp||s===Bp||s===Fp||s===Hp||s===Gp||s===Vp||s===kp||s===Xp||s===Wp)if(f=e.get("WEBGL_compressed_texture_astc"),f!==null){if(s===Up)return h===je?f.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:f.COMPRESSED_RGBA_ASTC_4x4_KHR;if(s===Lp)return h===je?f.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:f.COMPRESSED_RGBA_ASTC_5x4_KHR;if(s===Op)return h===je?f.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:f.COMPRESSED_RGBA_ASTC_5x5_KHR;if(s===Pp)return h===je?f.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:f.COMPRESSED_RGBA_ASTC_6x5_KHR;if(s===Ip)return h===je?f.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:f.COMPRESSED_RGBA_ASTC_6x6_KHR;if(s===zp)return h===je?f.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:f.COMPRESSED_RGBA_ASTC_8x5_KHR;if(s===Bp)return h===je?f.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:f.COMPRESSED_RGBA_ASTC_8x6_KHR;if(s===Fp)return h===je?f.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:f.COMPRESSED_RGBA_ASTC_8x8_KHR;if(s===Hp)return h===je?f.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:f.COMPRESSED_RGBA_ASTC_10x5_KHR;if(s===Gp)return h===je?f.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:f.COMPRESSED_RGBA_ASTC_10x6_KHR;if(s===Vp)return h===je?f.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:f.COMPRESSED_RGBA_ASTC_10x8_KHR;if(s===kp)return h===je?f.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:f.COMPRESSED_RGBA_ASTC_10x10_KHR;if(s===Xp)return h===je?f.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:f.COMPRESSED_RGBA_ASTC_12x10_KHR;if(s===Wp)return h===je?f.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:f.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(s===qp||s===Yp||s===jp)if(f=e.get("EXT_texture_compression_bptc"),f!==null){if(s===qp)return h===je?f.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:f.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(s===Yp)return f.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(s===jp)return f.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(s===Zp||s===Kp||s===Vu||s===Qp)if(f=e.get("EXT_texture_compression_rgtc"),f!==null){if(s===Zp)return f.COMPRESSED_RED_RGTC1_EXT;if(s===Kp)return f.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(s===Vu)return f.COMPRESSED_RED_GREEN_RGTC2_EXT;if(s===Qp)return f.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return s===Ll?o.UNSIGNED_INT_24_8:o[s]!==void 0?o[s]:null}return{convert:i}}const jw=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,Zw=`
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

}`;class Kw{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(e,i){if(this.texture===null){const s=new TS(e.texture);(e.depthNear!==i.depthNear||e.depthFar!==i.depthFar)&&(this.depthNear=e.depthNear,this.depthFar=e.depthFar),this.texture=s}}getMesh(e){if(this.texture!==null&&this.mesh===null){const i=e.cameras[0].viewport,s=new Sa({vertexShader:jw,fragmentShader:Zw,uniforms:{depthColor:{value:this.texture},depthWidth:{value:i.z},depthHeight:{value:i.w}}});this.mesh=new ze(new vo(20,20),s)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}}class Qw extends Cs{constructor(e,i){super();const s=this;let l=null,f=1,h=null,d="local-floor",m=1,p=null,S=null,_=null,v=null,M=null,A=null;const N=typeof XRWebGLBinding<"u",y=new Kw,x={},U=i.getContextAttributes();let F=null,C=null;const D=[],L=[],I=new le;let T=null,O=null;const G=new Si;G.viewport=new ln;const k=new Si;k.viewport=new ln;const Q=[G,k],st=new iT;let Y=null,tt=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(Z){let ft=D[Z];return ft===void 0&&(ft=new Vd,D[Z]=ft),ft.getTargetRaySpace()},this.getControllerGrip=function(Z){let ft=D[Z];return ft===void 0&&(ft=new Vd,D[Z]=ft),ft.getGripSpace()},this.getHand=function(Z){let ft=D[Z];return ft===void 0&&(ft=new Vd,D[Z]=ft),ft.getHandSpace()};function q(Z){const ft=L.indexOf(Z.inputSource);if(ft===-1)return;const Ct=D[ft];Ct!==void 0&&(Ct.update(Z.inputSource,Z.frame,p||h),Ct.dispatchEvent({type:Z.type,data:Z.inputSource}))}function j(){l.removeEventListener("select",q),l.removeEventListener("selectstart",q),l.removeEventListener("selectend",q),l.removeEventListener("squeeze",q),l.removeEventListener("squeezestart",q),l.removeEventListener("squeezeend",q),l.removeEventListener("end",j),l.removeEventListener("inputsourceschange",dt);for(let Z=0;Z<D.length;Z++){const ft=L[Z];ft!==null&&(L[Z]=null,D[Z].disconnect(ft))}Y=null,tt=null,y.reset();for(const Z in x)delete x[Z];if(e.setRenderTarget(F),M=null,v=null,_=null,l=null,C=null,Dt.stop(),s.isPresenting=!1,e.setPixelRatio(T),e.setSize(I.width,I.height,!1),O!==null){const Z=O.camera;Z.fov=O.fov,Z.zoom=O.zoom,Z.updateProjectionMatrix(),O=null}s.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(Z){f=Z,s.isPresenting===!0&&oe("WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(Z){d=Z,s.isPresenting===!0&&oe("WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return p||h},this.setReferenceSpace=function(Z){p=Z},this.getBaseLayer=function(){return v!==null?v:M},this.getBinding=function(){return _===null&&N&&(_=new XRWebGLBinding(l,i)),_},this.getFrame=function(){return A},this.getSession=function(){return l},this.setSession=async function(Z){if(l=Z,l!==null){if(F=e.getRenderTarget(),l.addEventListener("select",q),l.addEventListener("selectstart",q),l.addEventListener("selectend",q),l.addEventListener("squeeze",q),l.addEventListener("squeezestart",q),l.addEventListener("squeezeend",q),l.addEventListener("end",j),l.addEventListener("inputsourceschange",dt),U.xrCompatible!==!0&&await i.makeXRCompatible(),T=e.getPixelRatio(),e.getSize(I),N&&"createProjectionLayer"in XRWebGLBinding.prototype){let Ct=null,Pt=null,vt=null;U.depth&&(vt=U.stencil?i.DEPTH24_STENCIL8:i.DEPTH_COMPONENT24,Ct=U.stencil?sr:qa,Pt=U.stencil?Ll:va);const Ut={colorFormat:i.RGBA8,depthFormat:vt,scaleFactor:f};_=this.getBinding(),v=_.createProjectionLayer(Ut),l.updateRenderState({layers:[v]}),e.setPixelRatio(1),e.setSize(v.textureWidth,v.textureHeight,!1),C=new Ki(v.textureWidth,v.textureHeight,{format:Zi,type:yi,depthTexture:new Pl(v.textureWidth,v.textureHeight,Pt,void 0,void 0,void 0,void 0,void 0,void 0,Ct),stencilBuffer:U.stencil,colorSpace:e.outputColorSpace,samples:U.antialias?4:0,resolveDepthBuffer:v.ignoreDepthValues===!1,resolveStencilBuffer:v.ignoreDepthValues===!1,storeMultisampledDepthBuffer:v.ignoreDepthValues===!1,storeMultisampledStencilBuffer:v.ignoreDepthValues===!1})}else{const Ct={antialias:U.antialias,alpha:!0,depth:U.depth,stencil:U.stencil,framebufferScaleFactor:f};M=new XRWebGLLayer(l,i,Ct),l.updateRenderState({baseLayer:M}),e.setPixelRatio(1),e.setSize(M.framebufferWidth,M.framebufferHeight,!1),C=new Ki(M.framebufferWidth,M.framebufferHeight,{format:Zi,type:yi,colorSpace:e.outputColorSpace,stencilBuffer:U.stencil,resolveDepthBuffer:M.ignoreDepthValues===!1,resolveStencilBuffer:M.ignoreDepthValues===!1,storeMultisampledDepthBuffer:M.ignoreDepthValues===!1,storeMultisampledStencilBuffer:M.ignoreDepthValues===!1})}C.isXRRenderTarget=!0,this.setFoveation(m),p=null,h=await l.requestReferenceSpace(d),Dt.setContext(l),Dt.start(),s.isPresenting=!0,s.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(l!==null)return l.environmentBlendMode},this.getDepthTexture=function(){return y.getDepthTexture()};function dt(Z){for(let ft=0;ft<Z.removed.length;ft++){const Ct=Z.removed[ft],Pt=L.indexOf(Ct);Pt>=0&&(L[Pt]=null,D[Pt].disconnect(Ct))}for(let ft=0;ft<Z.added.length;ft++){const Ct=Z.added[ft];let Pt=L.indexOf(Ct);if(Pt===-1){for(let Ut=0;Ut<D.length;Ut++)if(Ut>=L.length){L.push(Ct),Pt=Ut;break}else if(L[Ut]===null){L[Ut]=Ct,Pt=Ut;break}if(Pt===-1)break}const vt=D[Pt];vt&&vt.connect(Ct)}}const ut=new nt,rt=new nt;function Tt(Z,ft,Ct){ut.setFromMatrixPosition(ft.matrixWorld),rt.setFromMatrixPosition(Ct.matrixWorld);const Pt=ut.distanceTo(rt),vt=ft.projectionMatrix.elements,Ut=Ct.projectionMatrix.elements,be=vt[14]/(vt[10]-1),ue=vt[14]/(vt[10]+1),pe=(vt[9]+1)/vt[5],_e=(vt[9]-1)/vt[5],ee=(vt[8]-1)/vt[0],ne=(Ut[8]+1)/Ut[0],Be=be*ee,rn=be*ne,Pe=Pt/(-ee+ne),$e=Pe*-ee;if(ft.matrixWorld.decompose(Z.position,Z.quaternion,Z.scale),Z.translateX($e),Z.translateZ(Pe),Z.matrixWorld.compose(Z.position,Z.quaternion,Z.scale),Z.matrixWorldInverse.copy(Z.matrixWorld).invert(),vt[10]===-1)Z.projectionMatrix.copy(ft.projectionMatrix),Z.projectionMatrixInverse.copy(ft.projectionMatrixInverse);else{const X=be+Pe,Ke=ue+Pe,Ee=Be-$e,P=rn+(Pt-$e),E=pe*ue/Ke*X,et=_e*ue/Ke*X;Z.projectionMatrix.makePerspective(Ee,P,E,et,X,Ke),Z.projectionMatrixInverse.copy(Z.projectionMatrix).invert()}}function Gt(Z,ft){ft===null?Z.matrixWorld.copy(Z.matrix):Z.matrixWorld.multiplyMatrices(ft.matrixWorld,Z.matrix),Z.matrixWorldInverse.copy(Z.matrixWorld).invert()}this.updateCamera=function(Z){if(l===null)return;let ft=Z.near,Ct=Z.far;y.texture!==null&&(y.depthNear>0&&(ft=y.depthNear),y.depthFar>0&&(Ct=y.depthFar)),st.near=k.near=G.near=ft,st.far=k.far=G.far=Ct,(Y!==st.near||tt!==st.far)&&(l.updateRenderState({depthNear:st.near,depthFar:st.far}),Y=st.near,tt=st.far),st.layers.mask=Z.layers.mask|6,G.layers.mask=st.layers.mask&-5,k.layers.mask=st.layers.mask&-3;const Pt=Z.parent,vt=st.cameras;Gt(st,Pt);for(let Ut=0;Ut<vt.length;Ut++)Gt(vt[Ut],Pt);vt.length===2?Tt(st,G,k):st.projectionMatrix.copy(G.projectionMatrix),O===null&&Z.isPerspectiveCamera&&(O={camera:Z,fov:Z.fov,zoom:Z.zoom}),Ot(Z,st,Pt)};function Ot(Z,ft,Ct){Ct===null?Z.matrix.copy(ft.matrixWorld):(Z.matrix.copy(Ct.matrixWorld),Z.matrix.invert(),Z.matrix.multiply(ft.matrixWorld)),Z.matrix.decompose(Z.position,Z.quaternion,Z.scale),Z.updateMatrixWorld(!0),Z.projectionMatrix.copy(ft.projectionMatrix),Z.projectionMatrixInverse.copy(ft.projectionMatrixInverse),Z.isPerspectiveCamera&&(Z.fov=$p*2*Math.atan(1/Z.projectionMatrix.elements[5]),Z.zoom=1)}this.getCamera=function(){return st},this.getFoveation=function(){if(!(v===null&&M===null))return m},this.setFoveation=function(Z){m=Z,v!==null&&(v.fixedFoveation=Z),M!==null&&M.fixedFoveation!==void 0&&(M.fixedFoveation=Z)},this.hasDepthSensing=function(){return y.texture!==null},this.getDepthSensingMesh=function(){return y.getMesh(st)},this.getCameraTexture=function(Z){return x[Z]};let B=null;function _t(Z,ft){if(S=ft.getViewerPose(p||h),A=ft,S!==null){const Ct=S.views;M!==null&&(e.setRenderTargetFramebuffer(C,M.framebuffer),e.setRenderTarget(C));let Pt=!1;Ct.length!==st.cameras.length&&(st.cameras.length=0,Pt=!0);for(let ue=0;ue<Ct.length;ue++){const pe=Ct[ue];let _e=null;if(M!==null)_e=M.getViewport(pe);else{const ne=_.getViewSubImage(v,pe);_e=ne.viewport,ue===0&&(e.setRenderTargetTextures(C,ne.colorTexture,ne.depthStencilTexture),e.setRenderTarget(C))}let ee=Q[ue];ee===void 0&&(ee=new Si,ee.layers.enable(ue),ee.viewport=new ln,Q[ue]=ee),ee.matrix.fromArray(pe.transform.matrix),ee.matrix.decompose(ee.position,ee.quaternion,ee.scale),ee.projectionMatrix.fromArray(pe.projectionMatrix),ee.projectionMatrixInverse.copy(ee.projectionMatrix).invert(),ee.viewport.set(_e.x,_e.y,_e.width,_e.height),ue===0&&(st.matrix.copy(ee.matrix),st.matrix.decompose(st.position,st.quaternion,st.scale)),Pt===!0&&st.cameras.push(ee)}const vt=l.enabledFeatures;if(vt&&vt.includes("depth-sensing")&&l.depthUsage=="gpu-optimized"&&N){_=s.getBinding();const ue=_.getDepthInformation(Ct[0]);ue&&ue.isValid&&ue.texture&&y.init(ue,l.renderState)}if(vt&&vt.includes("camera-access")&&N){e.state.unbindTexture(),_=s.getBinding();for(let ue=0;ue<Ct.length;ue++){const pe=Ct[ue].camera;if(pe){let _e=x[pe];_e||(_e=new TS,x[pe]=_e);const ee=_.getCameraImage(pe);_e.sourceTexture=ee}}}}for(let Ct=0;Ct<D.length;Ct++){const Pt=L[Ct],vt=D[Ct];Pt!==null&&vt!==void 0&&vt.update(Pt,ft,p||h)}B&&B(Z,ft),ft.detectedPlanes&&s.dispatchEvent({type:"planesdetected",data:ft}),A=null}const Dt=new CS;Dt.setAnimationLoop(_t),this.setAnimationLoop=function(Z){B=Z},this.dispose=function(){}}}const Jw=new cn,IS=new de;IS.set(-1,0,0,0,1,0,0,0,1);function $w(o,e){function i(y,x){y.matrixAutoUpdate===!0&&y.updateMatrix(),x.value.copy(y.matrix)}function s(y,x){x.color.getRGB(y.fogColor.value,AS(o)),x.isFog?(y.fogNear.value=x.near,y.fogFar.value=x.far):x.isFogExp2&&(y.fogDensity.value=x.density)}function l(y,x,U,F,C){x.isNodeMaterial?x.uniformsNeedUpdate=!1:x.isMeshBasicMaterial?f(y,x):x.isMeshLambertMaterial?(f(y,x),x.envMap&&(y.envMapIntensity.value=x.envMapIntensity)):x.isMeshToonMaterial?(f(y,x),_(y,x)):x.isMeshPhongMaterial?(f(y,x),S(y,x),x.envMap&&(y.envMapIntensity.value=x.envMapIntensity)):x.isMeshStandardMaterial?(f(y,x),v(y,x),x.isMeshPhysicalMaterial&&M(y,x,C)):x.isMeshMatcapMaterial?(f(y,x),A(y,x)):x.isMeshDepthMaterial?f(y,x):x.isMeshDistanceMaterial?(f(y,x),N(y,x)):x.isMeshNormalMaterial?f(y,x):x.isLineBasicMaterial?(h(y,x),x.isLineDashedMaterial&&d(y,x)):x.isPointsMaterial?m(y,x,U,F):x.isSpriteMaterial?p(y,x):x.isShadowMaterial?(y.color.value.copy(x.color),y.opacity.value=x.opacity):x.isShaderMaterial&&(x.uniformsNeedUpdate=!1)}function f(y,x){y.opacity.value=x.opacity,x.color&&y.diffuse.value.copy(x.color),x.emissive&&y.emissive.value.copy(x.emissive).multiplyScalar(x.emissiveIntensity),x.map&&(y.map.value=x.map,i(x.map,y.mapTransform)),x.alphaMap&&(y.alphaMap.value=x.alphaMap,i(x.alphaMap,y.alphaMapTransform)),x.bumpMap&&(y.bumpMap.value=x.bumpMap,i(x.bumpMap,y.bumpMapTransform),y.bumpScale.value=x.bumpScale,x.side===ri&&(y.bumpScale.value*=-1)),x.normalMap&&(y.normalMap.value=x.normalMap,i(x.normalMap,y.normalMapTransform),y.normalScale.value.copy(x.normalScale),x.side===ri&&y.normalScale.value.negate()),x.displacementMap&&(y.displacementMap.value=x.displacementMap,i(x.displacementMap,y.displacementMapTransform),y.displacementScale.value=x.displacementScale,y.displacementBias.value=x.displacementBias),x.emissiveMap&&(y.emissiveMap.value=x.emissiveMap,i(x.emissiveMap,y.emissiveMapTransform)),x.specularMap&&(y.specularMap.value=x.specularMap,i(x.specularMap,y.specularMapTransform)),x.alphaTest>0&&(y.alphaTest.value=x.alphaTest);const U=e.get(x),F=U.envMap,C=U.envMapRotation;F&&(y.envMap.value=F,y.envMapRotation.value.setFromMatrix4(Jw.makeRotationFromEuler(C)).transpose(),F.isCubeTexture&&F.isRenderTargetTexture===!1&&y.envMapRotation.value.premultiply(IS),y.reflectivity.value=x.reflectivity,y.ior.value=x.ior,y.refractionRatio.value=x.refractionRatio),x.lightMap&&(y.lightMap.value=x.lightMap,y.lightMapIntensity.value=x.lightMapIntensity,i(x.lightMap,y.lightMapTransform)),x.aoMap&&(y.aoMap.value=x.aoMap,y.aoMapIntensity.value=x.aoMapIntensity,i(x.aoMap,y.aoMapTransform))}function h(y,x){y.diffuse.value.copy(x.color),y.opacity.value=x.opacity,x.map&&(y.map.value=x.map,i(x.map,y.mapTransform))}function d(y,x){y.dashSize.value=x.dashSize,y.totalSize.value=x.dashSize+x.gapSize,y.scale.value=x.scale}function m(y,x,U,F){y.diffuse.value.copy(x.color),y.opacity.value=x.opacity,y.size.value=x.size*U,y.scale.value=F*.5,x.map&&(y.map.value=x.map,i(x.map,y.uvTransform)),x.alphaMap&&(y.alphaMap.value=x.alphaMap,i(x.alphaMap,y.alphaMapTransform)),x.alphaTest>0&&(y.alphaTest.value=x.alphaTest)}function p(y,x){y.diffuse.value.copy(x.color),y.opacity.value=x.opacity,y.rotation.value=x.rotation,x.map&&(y.map.value=x.map,i(x.map,y.mapTransform)),x.alphaMap&&(y.alphaMap.value=x.alphaMap,i(x.alphaMap,y.alphaMapTransform)),x.alphaTest>0&&(y.alphaTest.value=x.alphaTest)}function S(y,x){y.specular.value.copy(x.specular),y.shininess.value=Math.max(x.shininess,1e-4)}function _(y,x){x.gradientMap&&(y.gradientMap.value=x.gradientMap)}function v(y,x){y.metalness.value=x.metalness,x.metalnessMap&&(y.metalnessMap.value=x.metalnessMap,i(x.metalnessMap,y.metalnessMapTransform)),y.roughness.value=x.roughness,x.roughnessMap&&(y.roughnessMap.value=x.roughnessMap,i(x.roughnessMap,y.roughnessMapTransform)),x.envMap&&(y.envMapIntensity.value=x.envMapIntensity)}function M(y,x,U){y.ior.value=x.ior,x.sheen>0&&(y.sheenColor.value.copy(x.sheenColor).multiplyScalar(x.sheen),y.sheenRoughness.value=x.sheenRoughness,x.sheenColorMap&&(y.sheenColorMap.value=x.sheenColorMap,i(x.sheenColorMap,y.sheenColorMapTransform)),x.sheenRoughnessMap&&(y.sheenRoughnessMap.value=x.sheenRoughnessMap,i(x.sheenRoughnessMap,y.sheenRoughnessMapTransform))),x.clearcoat>0&&(y.clearcoat.value=x.clearcoat,y.clearcoatRoughness.value=x.clearcoatRoughness,x.clearcoatMap&&(y.clearcoatMap.value=x.clearcoatMap,i(x.clearcoatMap,y.clearcoatMapTransform)),x.clearcoatRoughnessMap&&(y.clearcoatRoughnessMap.value=x.clearcoatRoughnessMap,i(x.clearcoatRoughnessMap,y.clearcoatRoughnessMapTransform)),x.clearcoatNormalMap&&(y.clearcoatNormalMap.value=x.clearcoatNormalMap,i(x.clearcoatNormalMap,y.clearcoatNormalMapTransform),y.clearcoatNormalScale.value.copy(x.clearcoatNormalScale),x.side===ri&&y.clearcoatNormalScale.value.negate())),x.dispersion>0&&(y.dispersion.value=x.dispersion),x.retroreflectivity>0&&(y.retroreflectivity.value=x.retroreflectivity),x.iridescence>0&&(y.iridescence.value=x.iridescence,y.iridescenceIOR.value=x.iridescenceIOR,y.iridescenceThicknessMinimum.value=x.iridescenceThicknessRange[0],y.iridescenceThicknessMaximum.value=x.iridescenceThicknessRange[1],x.iridescenceMap&&(y.iridescenceMap.value=x.iridescenceMap,i(x.iridescenceMap,y.iridescenceMapTransform)),x.iridescenceThicknessMap&&(y.iridescenceThicknessMap.value=x.iridescenceThicknessMap,i(x.iridescenceThicknessMap,y.iridescenceThicknessMapTransform))),x.transmission>0&&(y.transmission.value=x.transmission,y.transmissionSamplerMap.value=U.texture,y.transmissionSamplerSize.value.set(U.width,U.height),x.transmissionMap&&(y.transmissionMap.value=x.transmissionMap,i(x.transmissionMap,y.transmissionMapTransform)),y.thickness.value=x.thickness,x.thicknessMap&&(y.thicknessMap.value=x.thicknessMap,i(x.thicknessMap,y.thicknessMapTransform)),y.attenuationDistance.value=x.attenuationDistance,y.attenuationColor.value.copy(x.attenuationColor)),x.anisotropy>0&&(y.anisotropyVector.value.set(x.anisotropy*Math.cos(x.anisotropyRotation),x.anisotropy*Math.sin(x.anisotropyRotation)),x.anisotropyMap&&(y.anisotropyMap.value=x.anisotropyMap,i(x.anisotropyMap,y.anisotropyMapTransform))),y.specularIntensity.value=x.specularIntensity,y.specularColor.value.copy(x.specularColor),x.specularColorMap&&(y.specularColorMap.value=x.specularColorMap,i(x.specularColorMap,y.specularColorMapTransform)),x.specularIntensityMap&&(y.specularIntensityMap.value=x.specularIntensityMap,i(x.specularIntensityMap,y.specularIntensityMapTransform))}function A(y,x){x.matcap&&(y.matcap.value=x.matcap)}function N(y,x){const U=e.get(x).light;y.referencePosition.value.setFromMatrixPosition(U.matrixWorld),y.nearDistance.value=U.shadow.camera.near,y.farDistance.value=U.shadow.camera.far}return{refreshFogUniforms:s,refreshMaterialUniforms:l}}function t3(o,e,i,s){let l={},f={},h=[];const d=o.getParameter(o.MAX_UNIFORM_BUFFER_BINDINGS);function m(C,D){const L=D.program;s.uniformBlockBinding(C,L)}function p(C,D){let L=l[C.id];L===void 0&&(y(C),L=S(C),l[C.id]=L,C.addEventListener("dispose",U));const I=D.program;s.updateUBOMapping(C,I);const T=e.render.frame;f[C.id]!==T&&(v(C),f[C.id]=T)}function S(C){const D=_();C.__bindingPointIndex=D;const L=o.createBuffer(),I=C.__size,T=C.usage;return o.bindBuffer(o.UNIFORM_BUFFER,L),o.bufferData(o.UNIFORM_BUFFER,I,T),o.bindBuffer(o.UNIFORM_BUFFER,null),o.bindBufferBase(o.UNIFORM_BUFFER,D,L),L}function _(){for(let C=0;C<d;C++)if(h.indexOf(C)===-1)return h.push(C),C;return Fe("WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function v(C){const D=l[C.id],L=C.uniforms,I=C.__cache;o.bindBuffer(o.UNIFORM_BUFFER,D);for(let T=0,O=L.length;T<O;T++){const G=L[T];if(Array.isArray(G))for(let k=0,Q=G.length;k<Q;k++)M(G[k],T,k,I);else M(G,T,0,I)}o.bindBuffer(o.UNIFORM_BUFFER,null)}function M(C,D,L,I){if(N(C,D,L,I)===!0){const T=C.__offset,O=C.value;if(Array.isArray(O)){let G=0;for(let k=0;k<O.length;k++){const Q=O[k],st=x(Q);A(Q,C.__data,G),typeof Q!="number"&&typeof Q!="boolean"&&!Q.isMatrix3&&!ArrayBuffer.isView(Q)&&(G+=st.storage/Float32Array.BYTES_PER_ELEMENT)}}else A(O,C.__data,0);o.bufferSubData(o.UNIFORM_BUFFER,T,C.__data)}}function A(C,D,L){typeof C=="number"||typeof C=="boolean"?D[0]=C:C.isMatrix3?(D[0]=C.elements[0],D[1]=C.elements[1],D[2]=C.elements[2],D[3]=0,D[4]=C.elements[3],D[5]=C.elements[4],D[6]=C.elements[5],D[7]=0,D[8]=C.elements[6],D[9]=C.elements[7],D[10]=C.elements[8],D[11]=0):ArrayBuffer.isView(C)?D.set(new C.constructor(C.buffer,C.byteOffset,D.length)):C.toArray(D,L)}function N(C,D,L,I){const T=C.value,O=D+"_"+L;if(I[O]===void 0)return typeof T=="number"||typeof T=="boolean"?I[O]=T:ArrayBuffer.isView(T)?I[O]=T.slice():I[O]=T.clone(),!0;{const G=I[O];if(typeof T=="number"||typeof T=="boolean"){if(G!==T)return I[O]=T,!0}else{if(ArrayBuffer.isView(T))return!0;if(G.equals(T)===!1)return G.copy(T),!0}}return!1}function y(C){const D=C.uniforms;let L=0;const I=16;for(let O=0,G=D.length;O<G;O++){const k=Array.isArray(D[O])?D[O]:[D[O]];for(let Q=0,st=k.length;Q<st;Q++){const Y=k[Q],tt=Array.isArray(Y.value)?Y.value:[Y.value];for(let q=0,j=tt.length;q<j;q++){const dt=tt[q],ut=x(dt),rt=L%I,Tt=rt%ut.boundary,Gt=rt+Tt;L+=Tt,Gt!==0&&I-Gt<ut.storage&&(L+=I-Gt),Y.__data=new Float32Array(ut.storage/Float32Array.BYTES_PER_ELEMENT),Y.__offset=L,L+=ut.storage}}}const T=L%I;return T>0&&(L+=I-T),C.__size=L,C.__cache={},this}function x(C){const D={boundary:0,storage:0};return typeof C=="number"||typeof C=="boolean"?(D.boundary=4,D.storage=4):C.isVector2?(D.boundary=8,D.storage=8):C.isVector3||C.isColor?(D.boundary=16,D.storage=12):C.isVector4?(D.boundary=16,D.storage=16):C.isMatrix3?(D.boundary=48,D.storage=48):C.isMatrix4?(D.boundary=64,D.storage=64):C.isTexture?oe("WebGLRenderer: Texture samplers can not be part of an uniforms group."):ArrayBuffer.isView(C)?(D.boundary=16,D.storage=C.byteLength):oe("WebGLRenderer: Unsupported uniform value type.",C),D}function U(C){const D=C.target;D.removeEventListener("dispose",U);const L=h.indexOf(D.__bindingPointIndex);h.splice(L,1),o.deleteBuffer(l[D.id]),delete l[D.id],delete f[D.id]}function F(){for(const C in l)o.deleteBuffer(l[C]);h=[],l={},f={}}return{bind:m,update:p,dispose:F}}const e3=new Uint16Array([12469,15057,12620,14925,13266,14620,13807,14376,14323,13990,14545,13625,14713,13328,14840,12882,14931,12528,14996,12233,15039,11829,15066,11525,15080,11295,15085,10976,15082,10705,15073,10495,13880,14564,13898,14542,13977,14430,14158,14124,14393,13732,14556,13410,14702,12996,14814,12596,14891,12291,14937,11834,14957,11489,14958,11194,14943,10803,14921,10506,14893,10278,14858,9960,14484,14039,14487,14025,14499,13941,14524,13740,14574,13468,14654,13106,14743,12678,14818,12344,14867,11893,14889,11509,14893,11180,14881,10751,14852,10428,14812,10128,14765,9754,14712,9466,14764,13480,14764,13475,14766,13440,14766,13347,14769,13070,14786,12713,14816,12387,14844,11957,14860,11549,14868,11215,14855,10751,14825,10403,14782,10044,14729,9651,14666,9352,14599,9029,14967,12835,14966,12831,14963,12804,14954,12723,14936,12564,14917,12347,14900,11958,14886,11569,14878,11247,14859,10765,14828,10401,14784,10011,14727,9600,14660,9289,14586,8893,14508,8533,15111,12234,15110,12234,15104,12216,15092,12156,15067,12010,15028,11776,14981,11500,14942,11205,14902,10752,14861,10393,14812,9991,14752,9570,14682,9252,14603,8808,14519,8445,14431,8145,15209,11449,15208,11451,15202,11451,15190,11438,15163,11384,15117,11274,15055,10979,14994,10648,14932,10343,14871,9936,14803,9532,14729,9218,14645,8742,14556,8381,14461,8020,14365,7603,15273,10603,15272,10607,15267,10619,15256,10631,15231,10614,15182,10535,15118,10389,15042,10167,14963,9787,14883,9447,14800,9115,14710,8665,14615,8318,14514,7911,14411,7507,14279,7198,15314,9675,15313,9683,15309,9712,15298,9759,15277,9797,15229,9773,15166,9668,15084,9487,14995,9274,14898,8910,14800,8539,14697,8234,14590,7790,14479,7409,14367,7067,14178,6621,15337,8619,15337,8631,15333,8677,15325,8769,15305,8871,15264,8940,15202,8909,15119,8775,15022,8565,14916,8328,14804,8009,14688,7614,14569,7287,14448,6888,14321,6483,14088,6171,15350,7402,15350,7419,15347,7480,15340,7613,15322,7804,15287,7973,15229,8057,15148,8012,15046,7846,14933,7611,14810,7357,14682,7069,14552,6656,14421,6316,14251,5948,14007,5528,15356,5942,15356,5977,15353,6119,15348,6294,15332,6551,15302,6824,15249,7044,15171,7122,15070,7050,14949,6861,14818,6611,14679,6349,14538,6067,14398,5651,14189,5311,13935,4958,15359,4123,15359,4153,15356,4296,15353,4646,15338,5160,15311,5508,15263,5829,15188,6042,15088,6094,14966,6001,14826,5796,14678,5543,14527,5287,14377,4985,14133,4586,13869,4257,15360,1563,15360,1642,15358,2076,15354,2636,15341,3350,15317,4019,15273,4429,15203,4732,15105,4911,14981,4932,14836,4818,14679,4621,14517,4386,14359,4156,14083,3795,13808,3437,15360,122,15360,137,15358,285,15355,636,15344,1274,15322,2177,15281,2765,15215,3223,15120,3451,14995,3569,14846,3567,14681,3466,14511,3305,14344,3121,14037,2800,13753,2467,15360,0,15360,1,15359,21,15355,89,15346,253,15325,479,15287,796,15225,1148,15133,1492,15008,1749,14856,1882,14685,1886,14506,1783,14324,1608,13996,1398,13702,1183]);let ha=null;function n3(){return ha===null&&(ha=new Hb(e3,16,16,lr,xa),ha.name="DFG_LUT",ha.minFilter=kn,ha.magFilter=kn,ha.wrapS=Va,ha.wrapT=Va,ha.generateMipmaps=!1,ha.needsUpdate=!0),ha}class i3{constructor(e={}){const{canvas:i=pb(),context:s=null,depth:l=!0,stencil:f=!1,alpha:h=!1,antialias:d=!1,premultipliedAlpha:m=!0,preserveDrawingBuffer:p=!1,powerPreference:S="default",failIfMajorPerformanceCaveat:_=!1,reversedDepthBuffer:v=!1,outputBufferType:M=yi}=e;this.isWebGLRenderer=!0;let A;if(s!==null){if(typeof WebGLRenderingContext<"u"&&s instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");A=s.getContextAttributes().alpha}else A=h;const N=M,y=new Set([hm,fm,um]),x=new Set([yi,va,Ul,Ll,lm,cm]),U=new Uint32Array(4),F=new Int32Array(4),C=new nt;let D=null,L=null;const I=[],T=[];let O=null;this.domElement=i,this.debug={checkShaderErrors:!0,diagnostics:{keywords:!1},onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=_a,this.toneMappingExposure=1,this.transmissionResolutionScale=1;const G=this;let k=!1,Q=null,st=null,Y=null,tt=null;this._outputColorSpace=Pi;let q=0,j=0,dt=null,ut=-1,rt=null;const Tt=new ln,Gt=new ln;let Ot=null;const B=new Me(0);let _t=0,Dt=i.width,Z=i.height,ft=1,Ct=null,Pt=null;const vt=new ln(0,0,Dt,Z),Ut=new ln(0,0,Dt,Z);let be=!1;const ue=new xm;let pe=!1,_e=!1;const ee=new cn,ne=new nt,Be=new ln,rn={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0};let Pe=!1;function $e(){return dt===null?ft:1}let X=s;function Ke(R,H){return i.getContext(R,H)}let Ee,P,E,et,at,gt,Nt,It,xt,St,mt,wt,yt,At,Lt,Qt,ae,W,zt,bt,Bt,qt,Rt;try{const R={alpha:!0,depth:l,stencil:f,antialias:d,premultipliedAlpha:m,preserveDrawingBuffer:p,powerPreference:S,failIfMajorPerformanceCaveat:_};if("setAttribute"in i&&i.setAttribute("data-engine",`three.js r${rm}`),i.addEventListener("webglcontextlost",Ue,!1),i.addEventListener("webglcontextrestored",fe,!1),i.addEventListener("webglcontextcreationerror",oi,!1),X===null){const H="webgl2";if(X=Ke(H,R),X===null)throw Ke(H)?new Error("THREE.WebGLRenderer: Error creating WebGL context with your selected attributes."):new Error("THREE.WebGLRenderer: Error creating WebGL context.")}te()}catch(R){throw i.removeEventListener("webglcontextlost",Ue,!1),i.removeEventListener("webglcontextrestored",fe,!1),i.removeEventListener("webglcontextcreationerror",oi,!1),Fe("WebGLRenderer: "+R.message),R}function te(){Ee=new nR(X),Ee.init(),Bt=new Yw(X,Ee),P=new qA(X,Ee,e,Bt),E=new Ww(X,Ee),P.reversedDepthBuffer&&v&&E.buffers.depth.setReversed(!0),st=X.createFramebuffer(),Y=X.createFramebuffer(),tt=X.createFramebuffer(),et=new sR(X),at=new Dw,gt=new qw(X,Ee,E,at,P,Bt,et),Nt=new eR(G),It=new oT(X),qt=new XA(X,It),xt=new iR(X,It,et,qt),St=new oR(X,xt,It,qt,et),W=new rR(X,P,gt),Lt=new YA(at),mt=new Nw(G,Nt,Ee,P,qt,Lt),wt=new $w(G,at),yt=new Lw,At=new Fw(Ee),ae=new kA(G,Nt,E,St,A,m),Qt=new Xw(G,St,P),Rt=new t3(X,et,P,E),zt=new WA(X,Ee,et),bt=new aR(X,Ee,et),et.programs=mt.programs,G.capabilities=P,G.extensions=Ee,G.properties=at,G.renderLists=yt,G.shadowMap=Qt,G.state=E,G.info=et}N!==yi&&(O=new cR(N,i.width,i.height,d,l,f));const Wt=new Qw(G,X);this.xr=Wt,this.getContext=function(){return X},this.getContextAttributes=function(){return X.getContextAttributes()},this.forceContextLoss=function(){const R=Ee.get("WEBGL_lose_context");R&&R.loseContext()},this.forceContextRestore=function(){const R=Ee.get("WEBGL_lose_context");R&&R.restoreContext()},this.getPixelRatio=function(){return ft},this.setPixelRatio=function(R){R!==void 0&&(ft=R,this.setSize(Dt,Z,!1))},this.getSize=function(R){return R.set(Dt,Z)},this.setSize=function(R,H,pt=!0){if(Wt.isPresenting){oe("WebGLRenderer: Can't change size while VR device is presenting.");return}Dt=R,Z=H,i.width=Math.floor(R*ft),i.height=Math.floor(H*ft),pt===!0&&(i.style.width=R+"px",i.style.height=H+"px"),O!==null&&O.setSize(i.width,i.height),this.setViewport(0,0,R,H)},this.getDrawingBufferSize=function(R){return R.set(Dt*ft,Z*ft).floor()},this.setDrawingBufferSize=function(R,H,pt){Dt=R,Z=H,ft=pt,i.width=Math.floor(R*pt),i.height=Math.floor(H*pt),this.setViewport(0,0,R,H)},this.setEffects=function(R){if(N===yi){Fe("WebGLRenderer: setEffects() requires outputBufferType set to HalfFloatType or FloatType.");return}if(R){for(let H=0;H<R.length;H++)if(R[H].isOutputPass===!0){oe("WebGLRenderer: OutputPass is not needed in setEffects(). Tone mapping and color space conversion are applied automatically.");break}}O.setEffects(R||[])},this.getCurrentViewport=function(R){return R.copy(Tt)},this.getViewport=function(R){return R.copy(vt)},this.setViewport=function(R,H,pt,ot){R.isVector4?vt.set(R.x,R.y,R.z,R.w):vt.set(R,H,pt,ot),E.viewport(Tt.copy(vt).multiplyScalar(ft).round())},this.getScissor=function(R){return R.copy(Ut)},this.setScissor=function(R,H,pt,ot){R.isVector4?Ut.set(R.x,R.y,R.z,R.w):Ut.set(R,H,pt,ot),E.scissor(Gt.copy(Ut).multiplyScalar(ft).round())},this.getScissorTest=function(){return be},this.setScissorTest=function(R){E.setScissorTest(be=R)},this.setOpaqueSort=function(R){Ct=R},this.setTransparentSort=function(R){Pt=R},this.getClearColor=function(R){return R.copy(ae.getClearColor())},this.setClearColor=function(){ae.setClearColor(...arguments)},this.getClearAlpha=function(){return ae.getClearAlpha()},this.setClearAlpha=function(){ae.setClearAlpha(...arguments)},this.clear=function(R=!0,H=!0,pt=!0){let ot=0;if(R){let lt=!1;if(dt!==null){const Vt=dt.texture.format;lt=y.has(Vt)}if(lt){const Vt=dt.texture.type,Yt=x.has(Vt),Ft=ae.getClearColor(),Kt=ae.getClearAlpha(),Jt=Ft.r,re=Ft.g,he=Ft.b;Yt?(U[0]=Jt,U[1]=re,U[2]=he,U[3]=Kt,X.clearBufferuiv(X.COLOR,0,U)):(F[0]=Jt,F[1]=re,F[2]=he,F[3]=Kt,X.clearBufferiv(X.COLOR,0,F))}else ot|=X.COLOR_BUFFER_BIT}H&&(ot|=X.DEPTH_BUFFER_BIT,this.state.buffers.depth.setMask(!0)),pt&&(ot|=X.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),ot!==0&&X.clear(ot)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.setNodesHandler=function(R){R.setRenderer(this),Q=R},this.dispose=function(){i.removeEventListener("webglcontextlost",Ue,!1),i.removeEventListener("webglcontextrestored",fe,!1),i.removeEventListener("webglcontextcreationerror",oi,!1),ae.dispose(),yt.dispose(),At.dispose(),at.dispose(),Nt.dispose(),St.dispose(),qt.dispose(),Rt.dispose(),mt.dispose(),Wt.dispose(),Wt.removeEventListener("sessionstart",Ds),Wt.removeEventListener("sessionend",ja),Qi.stop()};function Ue(R){R.preventDefault(),$v("WebGLRenderer: Context Lost."),k=!0}function fe(){$v("WebGLRenderer: Context Restored."),k=!1;const R=et.autoReset,H=Qt.enabled,pt=Qt.autoUpdate,ot=Qt.needsUpdate,lt=Qt.type;te(),et.autoReset=R,Qt.enabled=H,Qt.autoUpdate=pt,Qt.needsUpdate=ot,Qt.type=lt}function oi(R){Fe("WebGLRenderer: A WebGL context could not be created. Reason: ",R.statusMessage)}function Ei(R){const H=R.target;H.removeEventListener("dispose",Ei),tf(H)}function tf(R){ur(R),at.remove(R)}function ur(R){const H=at.get(R).programs;H!==void 0&&(H.forEach(function(pt){mt.releaseProgram(pt)}),R.isShaderMaterial&&mt.releaseShaderCache(R))}this.renderBufferDirect=function(R,H,pt,ot,lt,Vt){H===null&&(H=rn);const Yt=lt.isMesh&&lt.matrixWorld.determinantAffine()<0,Ft=Ro(R,H,pt,ot,lt);E.setMaterial(ot,Yt);let Kt=pt.index,Jt=1;if(ot.wireframe===!0){if(Kt=xt.getWireframeAttribute(pt),Kt===void 0)return;Jt=2}const re=pt.drawRange,he=pt.attributes.position;let jt=re.start*Jt,Te=(re.start+re.count)*Jt;Vt!==null&&(jt=Math.max(jt,Vt.start*Jt),Te=Math.min(Te,(Vt.start+Vt.count)*Jt)),Kt!==null?(jt=Math.max(jt,0),Te=Math.min(Te,Kt.count)):he!=null&&(jt=Math.max(jt,0),Te=Math.min(Te,he.count));const xe=Te-jt;if(xe<0||xe===1/0)return;qt.setup(lt,ot,Ft,pt,Kt);let Qe,ke=zt;if(Kt!==null&&(Qe=It.get(Kt),ke=bt,ke.setIndex(Qe)),lt.isMesh)ot.wireframe===!0?(E.setLineWidth(ot.wireframeLinewidth*$e()),ke.setMode(X.LINES)):ke.setMode(X.TRIANGLES);else if(lt.isLine){let En=ot.linewidth;En===void 0&&(En=1),E.setLineWidth(En*$e()),lt.isLineSegments?ke.setMode(X.LINES):lt.isLineLoop?ke.setMode(X.LINE_LOOP):ke.setMode(X.LINE_STRIP)}else lt.isPoints?ke.setMode(X.POINTS):lt.isSprite&&ke.setMode(X.TRIANGLES);if(lt.isBatchedMesh)if(Ee.get("WEBGL_multi_draw"))ke.renderMultiDraw(lt._multiDrawStarts,lt._multiDrawCounts,lt._multiDrawCount);else{const En=lt._multiDrawStarts,kt=lt._multiDrawCounts,fn=lt._multiDrawCount,Le=Kt?It.get(Kt).bytesPerElement:1,Xn=at.get(ot).currentProgram.getUniforms();for(let li=0;li<fn;li++)Xn.setValue(X,"_gl_DrawID",li),ke.render(En[li]/Le,kt[li])}else if(lt.isInstancedMesh)ke.renderInstances(jt,xe,lt.count);else if(pt.isInstancedBufferGeometry){const En=pt._maxInstanceCount!==void 0?pt._maxInstanceCount:1/0,kt=Math.min(pt.instanceCount,En);ke.renderInstances(jt,xe,kt)}else ke.render(jt,xe)};function Ns(R,H,pt,ot){Q!==null&&R.isNodeMaterial&&Q.setObject(ot,R),pe===!0&&Lt.setState(R,pt,!1),R.transparent===!0&&R.side===Ii&&R.forceSinglePass===!1?(R.side=ri,R.needsUpdate=!0,Us(R,H,ot),R.side=rr,R.needsUpdate=!0,Us(R,H,ot),R.side=Ii):Us(R,H,ot)}this.compile=function(R,H,pt=null){pt===null&&(pt=R),Q!==null&&Q.renderStart(R,H,pt),L=At.get(pt),L.init(H),T.push(L),pt.traverseVisible(function(lt){lt.isLight&&lt.layers.test(H.layers)&&(L.pushLight(lt),lt.castShadow&&L.pushShadow(lt))}),R!==pt&&R.traverseVisible(function(lt){lt.isLight&&lt.layers.test(H.layers)&&(L.pushLight(lt),lt.castShadow&&L.pushShadow(lt))}),L.setupLights(),Q!==null&&Q.updateLights(L.state.lightsArray),_e=this.localClippingEnabled,pe=Lt.init(this.clippingPlanes,_e),pe===!0&&Lt.setGlobalState(this.clippingPlanes,H),Q!==null&&Qt.render(L.state.shadowsArray,pt,H);const ot=new Set;return R.traverse(function(lt){if(!(lt.isMesh||lt.isPoints||lt.isLine||lt.isSprite))return;const Vt=lt.material;if(Vt)if(Array.isArray(Vt))for(let Yt=0;Yt<Vt.length;Yt++){const Ft=Vt[Yt];Ns(Ft,pt,H,lt),ot.add(Ft)}else Ns(Vt,pt,H,lt),ot.add(Vt)}),L=T.pop(),Q!==null&&Q.renderEnd(),ot},this.compileAsync=function(R,H,pt=null){const ot=this.compile(R,H,pt);return new Promise(lt=>{function Vt(){if(ot.forEach(function(Yt){const Kt=at.get(Yt).currentProgram;(Kt===void 0||Kt.isReady())&&ot.delete(Yt)}),ot.size===0){lt(R);return}setTimeout(Vt,10)}Ee.get("KHR_parallel_shader_compile")!==null?Vt():setTimeout(Vt,10)})};let Ya=null;function ya(R){Ya&&Ya(R)}function Ds(){Qi.stop()}function ja(){Qi.start()}const Qi=new CS;Qi.setAnimationLoop(ya),typeof self<"u"&&Qi.setContext(self),this.setAnimationLoop=function(R){Ya=R,Wt.setAnimationLoop(R),R===null?Qi.stop():Qi.start()},Wt.addEventListener("sessionstart",Ds),Wt.addEventListener("sessionend",ja),this.render=function(R,H){if(H!==void 0&&H.isCamera!==!0){Fe("WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(k===!0)return;Q!==null&&Q.renderStart(R,H);const pt=Wt.enabled===!0&&Wt.isPresenting===!0,ot=O!==null&&(dt===null||pt)&&O.begin(G,dt);if(R.matrixWorldAutoUpdate===!0&&R.updateMatrixWorld(),H.parent===null&&H.matrixWorldAutoUpdate===!0&&H.updateMatrixWorld(),Wt.enabled===!0&&Wt.isPresenting===!0&&(O===null||O.isCompositing()===!1)&&(Wt.cameraAutoUpdate===!0&&Wt.updateCamera(H),H=Wt.getCamera()),R.isScene===!0&&R.onBeforeRender(G,R,H,dt),L=At.get(R,T.length),L.init(H),L.state.textureUnits=gt.getTextureUnits(),T.push(L),ee.multiplyMatrices(H.projectionMatrix,H.matrixWorldInverse),ue.setFromProjectionMatrix(ee,ga,H.reversedDepth),_e=this.localClippingEnabled,pe=Lt.init(this.clippingPlanes,_e),D=yt.get(R,I.length),D.init(),I.push(D),Wt.enabled===!0&&Wt.isPresenting===!0){const Yt=G.xr.getDepthSensingMesh();Yt!==null&&Mo(Yt,H,-1/0,G.sortObjects)}Mo(R,H,0,G.sortObjects),D.finish(),Q!==null&&Q.updateLights(L.state.lightsArray),G.sortObjects===!0&&D.sort(Ct,Pt),Pe=Wt.enabled===!1||Wt.isPresenting===!1||Wt.hasDepthSensing()===!1,Pe&&ae.addToRenderList(D,R),this.info.render.frame++,this.info.autoReset===!0&&this.info.reset(),pe===!0&&Lt.beginShadows();const lt=L.state.shadowsArray;if(Qt.render(lt,R,H),pe===!0&&Lt.endShadows(),(ot&&O.hasRenderPass())===!1){const Yt=D.opaque,Ft=D.transmissive;if(L.setupLights(),H.isArrayCamera){const Kt=H.cameras;if(Ft.length>0)for(let Jt=0,re=Kt.length;Jt<re;Jt++){const he=Kt[Jt];fr(Yt,Ft,R,he)}Pe&&ae.render(R);for(let Jt=0,re=Kt.length;Jt<re;Jt++){const he=Kt[Jt];Eo(D,R,he,he.viewport)}}else Ft.length>0&&fr(Yt,Ft,R,H),Pe&&ae.render(R),Eo(D,R,H)}dt!==null&&j===0&&(gt.updateMultisampleRenderTarget(dt),gt.updateRenderTargetMipmap(dt)),ot&&O.end(G),R.isScene===!0&&R.onAfterRender(G,R,H),qt.resetDefaultState(),ut=-1,rt=null,T.pop(),T.length>0?(L=T[T.length-1],gt.setTextureUnits(L.state.textureUnits),pe===!0&&Lt.setGlobalState(G.clippingPlanes,L.state.camera)):L=null,I.pop(),I.length>0?D=I[I.length-1]:D=null,Q!==null&&Q.renderEnd()};function Mo(R,H,pt,ot){if(R.visible===!1)return;if(R.layers.test(H.layers)){if(R.isGroup)pt=R.renderOrder;else if(R.isLOD)R.autoUpdate===!0&&R.update(H);else if(R.isLightProbeGrid)L.pushLightProbeGrid(R);else if(R.isLight)L.pushLight(R),R.castShadow&&L.pushShadow(R);else if(R.isSprite){if(!R.frustumCulled||R.intersectsFrustum(ue)){ot&&Be.setFromMatrixPosition(R.matrixWorld).applyMatrix4(ee);const Yt=St.update(R),Ft=R.material;Ft.visible&&D.push(R,Yt,Ft,pt,Be.z,null,H)}}else if((R.isMesh||R.isLine||R.isPoints)&&(!R.frustumCulled||R.intersectsFrustum(ue))){const Yt=St.update(R),Ft=R.material;if(ot&&(R.boundingSphere!==void 0?(R.boundingSphere===null&&R.computeBoundingSphere(),Be.copy(R.boundingSphere.center)):(Yt.boundingSphere===null&&Yt.computeBoundingSphere(),Be.copy(Yt.boundingSphere.center)),Be.applyMatrix4(R.matrixWorld).applyMatrix4(ee)),Array.isArray(Ft)){const Kt=Yt.groups;for(let Jt=0,re=Kt.length;Jt<re;Jt++){const he=Kt[Jt],jt=Ft[he.materialIndex];jt&&jt.visible&&D.push(R,Yt,jt,pt,Be.z,he,H)}}else Ft.visible&&D.push(R,Yt,Ft,pt,Be.z,null,H)}}const Vt=R.children;for(let Yt=0,Ft=Vt.length;Yt<Ft;Yt++)Mo(Vt[Yt],H,pt,ot)}function Eo(R,H,pt,ot){const{opaque:lt,transmissive:Vt,transparent:Yt}=R;L.setupLightsView(pt),pe===!0&&Lt.setGlobalState(G.clippingPlanes,pt),ot&&E.viewport(Tt.copy(ot)),lt.length>0&&Ji(lt,H,pt),Vt.length>0&&Ji(Vt,H,pt),Yt.length>0&&Ji(Yt,H,pt),E.buffers.depth.setTest(!0),E.buffers.depth.setMask(!0),E.buffers.color.setMask(!0),E.setPolygonOffset(!1)}function fr(R,H,pt,ot){if((pt.isScene===!0?pt.overrideMaterial:null)!==null)return;if(L.state.transmissionRenderTarget[ot.id]===void 0){const jt=Ee.has("EXT_color_buffer_half_float")||Ee.has("EXT_color_buffer_float");L.state.transmissionRenderTarget[ot.id]=new Ki(1,1,{generateMipmaps:!0,type:jt?xa:yi,minFilter:ar,samples:Math.max(4,P.samples),stencilBuffer:f,resolveDepthBuffer:!1,resolveStencilBuffer:!1,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,colorSpace:Oe.workingColorSpace})}const Vt=L.state.transmissionRenderTarget[ot.id],Yt=ot.viewport||Tt;Vt.setSize(Yt.z*G.transmissionResolutionScale,Yt.w*G.transmissionResolutionScale);const Ft=G.getRenderTarget(),Kt=G.getActiveCubeFace(),Jt=G.getActiveMipmapLevel();G.setRenderTarget(Vt),G.getClearColor(B),_t=G.getClearAlpha(),_t<1&&G.setClearColor(16777215,.5),G.clear(),Pe&&ae.render(pt);const re=G.toneMapping;G.toneMapping=_a;const he=ot.viewport;if(ot.viewport!==void 0&&(ot.viewport=void 0),L.setupLightsView(ot),pe===!0&&Lt.setGlobalState(G.clippingPlanes,ot),Ji(R,pt,ot),gt.updateMultisampleRenderTarget(Vt),gt.updateRenderTargetMipmap(Vt),Ee.has("WEBGL_multisampled_render_to_texture")===!1){let jt=!1;for(let Te=0,xe=H.length;Te<xe;Te++){const Qe=H[Te],{object:ke,geometry:En,material:kt,group:fn}=Qe;if(kt.side===Ii&&ke.layers.test(ot.layers)){const Le=kt.side;kt.side=ri,kt.needsUpdate=!0,Fl(ke,pt,ot,En,kt,fn),kt.side=Le,kt.needsUpdate=!0,jt=!0}}jt===!0&&(gt.updateMultisampleRenderTarget(Vt),gt.updateRenderTargetMipmap(Vt))}G.setRenderTarget(Ft,Kt,Jt),G.setClearColor(B,_t),he!==void 0&&(ot.viewport=he),G.toneMapping=re}function Ji(R,H,pt){const ot=H.isScene===!0?H.overrideMaterial:null;for(let lt=0,Vt=R.length;lt<Vt;lt++){const Yt=R[lt],{object:Ft,geometry:Kt,group:Jt}=Yt;let re=Yt.material;re.allowOverride===!0&&ot!==null&&(re=ot),Ft.layers.test(pt.layers)&&Fl(Ft,H,pt,Kt,re,Jt)}}function Fl(R,H,pt,ot,lt,Vt){Q!==null&&lt.isNodeMaterial&&Q.setObject(R,lt),R.onBeforeRender(G,H,pt,ot,lt,Vt),R.modelViewMatrix.multiplyMatrices(pt.matrixWorldInverse,R.matrixWorld),R.normalMatrix.getNormalMatrix(R.modelViewMatrix),lt.onBeforeRender(G,H,pt,ot,R,Vt),lt.transparent===!0&&lt.side===Ii&&lt.forceSinglePass===!1?(lt.side=ri,lt.needsUpdate=!0,G.renderBufferDirect(pt,H,ot,lt,R,Vt),lt.side=rr,lt.needsUpdate=!0,G.renderBufferDirect(pt,H,ot,lt,R,Vt),lt.side=Ii):G.renderBufferDirect(pt,H,ot,lt,R,Vt),R.onAfterRender(G,H,pt,ot,lt,Vt)}function Us(R,H,pt){H.isScene!==!0&&(H=rn);const ot=at.get(R),lt=L.state.lights,Vt=L.state.shadowsArray,Yt=lt.state.version,Ft=mt.getParameters(R,lt.state,Vt,H,pt,L.state.lightProbeGridArray),Kt=mt.getProgramCacheKey(Ft);let Jt=ot.programs;ot.environment=R.isMeshStandardMaterial||R.isMeshLambertMaterial||R.isMeshPhongMaterial?H.environment:null,ot.fog=H.fog;const re=R.isMeshStandardMaterial||R.isMeshLambertMaterial&&!R.envMap||R.isMeshPhongMaterial&&!R.envMap;ot.envMap=Nt.get(R.envMap||ot.environment,re),ot.envMapRotation=ot.environment!==null&&R.envMap===null?H.environmentRotation:R.envMapRotation,Jt===void 0&&(R.addEventListener("dispose",Ei),Jt=new Map,ot.programs=Jt);let he=Jt.get(Kt);if(he!==void 0){if(ot.currentProgram===he&&ot.lightsStateVersion===Yt)return To(R,Ft),he}else Ft.uniforms=mt.getUniforms(R),Q!==null&&R.isNodeMaterial&&Q.build(R,pt,Ft),R.onBeforeCompile(Ft,G),he=mt.acquireProgram(Ft,Kt),Jt.set(Kt,he),ot.uniforms=Ft.uniforms;const jt=ot.uniforms;return(!R.isShaderMaterial&&!R.isRawShaderMaterial||R.clipping===!0)&&(jt.clippingPlanes=Lt.uniform),To(R,Ft),ot.needsLights=Gl(R),ot.lightsStateVersion=Yt,ot.needsLights&&(jt.ambientLightColor.value=lt.state.ambient,jt.lightProbe.value=lt.state.probe,jt.sunLights.value=lt.state.sun,jt.sunLightShadows.value=lt.state.sunShadow,jt.directionalLights.value=lt.state.directional,jt.directionalLightShadows.value=lt.state.directionalShadow,jt.spotLights.value=lt.state.spot,jt.spotLightShadows.value=lt.state.spotShadow,jt.rectAreaLights.value=lt.state.rectArea,jt.ltc_1.value=lt.state.rectAreaLTC1,jt.ltc_2.value=lt.state.rectAreaLTC2,jt.pointLights.value=lt.state.point,jt.pointLightShadows.value=lt.state.pointShadow,jt.hemisphereLights.value=lt.state.hemi,jt.sunShadowMatrix.value=lt.state.sunShadowMatrix,jt.sunShadowCascade.value=lt.state.sunShadowCascade,jt.directionalShadowMatrix.value=lt.state.directionalShadowMatrix,jt.spotLightMatrix.value=lt.state.spotLightMatrix,jt.spotLightMap.value=lt.state.spotLightMap,jt.pointShadowMatrix.value=lt.state.pointShadowMatrix),ot.lightProbeGrid=L.state.lightProbeGridArray.length>0,ot.currentProgram=he,ot.uniformsList=null,he}function bo(R){if(R.uniformsList===null){const H=R.currentProgram.getUniforms();R.uniformsList=Fu.seqWithValue(H.seq,R.uniforms)}return R.uniformsList}function To(R,H){const pt=at.get(R);pt.outputColorSpace=H.outputColorSpace,pt.batching=H.batching,pt.batchingColor=H.batchingColor,pt.instancing=H.instancing,pt.instancingColor=H.instancingColor,pt.instancingMorph=H.instancingMorph,pt.skinning=H.skinning,pt.morphTargets=H.morphTargets,pt.morphNormals=H.morphNormals,pt.morphColors=H.morphColors,pt.morphTargetsCount=H.morphTargetsCount,pt.numClippingPlanes=H.numClippingPlanes,pt.numIntersection=H.numClipIntersection,pt.vertexAlphas=H.vertexAlphas,pt.vertexTangents=H.vertexTangents,pt.toneMapping=H.toneMapping}function Ao(R,H){if(R.length===0)return null;if(R.length===1)return R[0].texture!==null?R[0]:null;C.setFromMatrixPosition(H.matrixWorld);for(let pt=0,ot=R.length;pt<ot;pt++){const lt=R[pt];if(lt.texture!==null&&lt.boundingBox.containsPoint(C))return lt}return null}function Ro(R,H,pt,ot,lt){H.isScene!==!0&&(H=rn),gt.resetTextureUnits();const Vt=H.fog,Yt=ot.isMeshStandardMaterial||ot.isMeshLambertMaterial||ot.isMeshPhongMaterial?H.environment:null,Ft=dt===null?G.outputColorSpace:dt.isXRRenderTarget===!0?dt.texture.colorSpace:Oe.workingColorSpace,Kt=ot.isMeshStandardMaterial||ot.isMeshLambertMaterial&&!ot.envMap||ot.isMeshPhongMaterial&&!ot.envMap,Jt=Nt.get(ot.envMap||Yt,Kt),re=ot.vertexColors===!0&&!!pt.attributes.color&&pt.attributes.color.itemSize===4,he=!!pt.attributes.tangent&&(!!ot.normalMap||ot.anisotropy>0),jt=!!pt.morphAttributes.position,Te=!!pt.morphAttributes.normal,xe=!!pt.morphAttributes.color;let Qe=_a;ot.toneMapped&&(dt===null||dt.isXRRenderTarget===!0)&&(Qe=G.toneMapping);const ke=pt.morphAttributes.position||pt.morphAttributes.normal||pt.morphAttributes.color,En=ke!==void 0?ke.length:0,kt=at.get(ot),fn=L.state.lights;if(pe===!0&&(_e===!0||R!==rt)){const Ce=R===rt&&ot.id===ut;Lt.setState(ot,R,Ce)}let Le=!1;ot.version===kt.__version?(kt.needsLights&&kt.lightsStateVersion!==fn.state.version||kt.outputColorSpace!==Ft||lt.isBatchedMesh&&kt.batching===!1||!lt.isBatchedMesh&&kt.batching===!0||lt.isBatchedMesh&&kt.batchingColor===!0&&lt._colorsTexture===null||lt.isBatchedMesh&&kt.batchingColor===!1&&lt._colorsTexture!==null||lt.isInstancedMesh&&kt.instancing===!1||!lt.isInstancedMesh&&kt.instancing===!0||lt.isSkinnedMesh&&kt.skinning===!1||!lt.isSkinnedMesh&&kt.skinning===!0||lt.isInstancedMesh&&kt.instancingColor===!0&&lt.instanceColor===null||lt.isInstancedMesh&&kt.instancingColor===!1&&lt.instanceColor!==null||lt.isInstancedMesh&&kt.instancingMorph===!0&&lt.morphTexture===null||lt.isInstancedMesh&&kt.instancingMorph===!1&&lt.morphTexture!==null||kt.envMap!==Jt||ot.fog===!0&&kt.fog!==Vt||kt.numClippingPlanes!==void 0&&(kt.numClippingPlanes!==Lt.numPlanes||kt.numIntersection!==Lt.numIntersection)||kt.vertexAlphas!==re||kt.vertexTangents!==he||kt.morphTargets!==jt||kt.morphNormals!==Te||kt.morphColors!==xe||kt.toneMapping!==Qe||kt.morphTargetsCount!==En||!!kt.lightProbeGrid!=L.state.lightProbeGridArray.length>0)&&(Le=!0):(Le=!0,kt.__version=ot.version);let Xn=kt.currentProgram;Le===!0&&(Xn=Us(ot,H,lt),Q&&ot.isNodeMaterial&&Q.onUpdateProgram(ot,Xn,kt));let li=!1,$i=!1,Se=!1;const He=Xn.getUniforms(),en=kt.uniforms;if(E.useProgram(Xn.program)&&(li=!0,$i=!0,Se=!0),ot.id!==ut&&(ut=ot.id,$i=!0),kt.needsLights){const Ce=Ao(L.state.lightProbeGridArray,lt);kt.lightProbeGrid!==Ce&&(kt.lightProbeGrid=Ce,$i=!0)}if(li||rt!==R){E.buffers.depth.getReversed()&&R.reversedDepth!==!0&&(R._reversedDepth=!0,R.updateProjectionMatrix()),He.setValue(X,"projectionMatrix",R.projectionMatrix),He.setValue(X,"viewMatrix",R.matrixWorldInverse);const hn=He.map.cameraPosition;hn!==void 0&&hn.setValue(X,ne.setFromMatrixPosition(R.matrixWorld)),P.logarithmicDepthBuffer&&He.setValue(X,"logDepthBufFC",2/(Math.log(R.far+1)/Math.LN2)),(ot.isMeshPhongMaterial||ot.isMeshToonMaterial||ot.isMeshLambertMaterial||ot.isMeshBasicMaterial||ot.isMeshStandardMaterial||ot.isShaderMaterial)&&He.setValue(X,"isOrthographic",R.isOrthographicCamera===!0),rt!==R&&(rt=R,$i=!0,Se=!0)}if(kt.needsLights&&(fn.state.sunShadowMap.length>0&&He.setValue(X,"sunShadowMap",fn.state.sunShadowMap,gt),fn.state.directionalShadowMap.length>0&&He.setValue(X,"directionalShadowMap",fn.state.directionalShadowMap,gt),fn.state.spotShadowMap.length>0&&He.setValue(X,"spotShadowMap",fn.state.spotShadowMap,gt),fn.state.pointShadowMap.length>0&&He.setValue(X,"pointShadowMap",fn.state.pointShadowMap,gt)),lt.isSkinnedMesh){He.setOptional(X,lt,"bindMatrix"),He.setOptional(X,lt,"bindMatrixInverse");const Ce=lt.skeleton;Ce&&(Ce.boneTexture===null&&Ce.computeBoneTexture(),He.setValue(X,"boneTexture",Ce.boneTexture,gt))}lt.isBatchedMesh&&(He.setOptional(X,lt,"batchingTexture"),He.setValue(X,"batchingTexture",lt._matricesTexture,gt),He.setOptional(X,lt,"batchingIdTexture"),He.setValue(X,"batchingIdTexture",lt._indirectTexture,gt),He.setOptional(X,lt,"batchingColorTexture"),lt._colorsTexture!==null&&He.setValue(X,"batchingColorTexture",lt._colorsTexture,gt));const ci=pt.morphAttributes;if((ci.position!==void 0||ci.normal!==void 0||ci.color!==void 0)&&W.update(lt,pt,Xn),($i||kt.receiveShadow!==lt.receiveShadow)&&(kt.receiveShadow=lt.receiveShadow,He.setValue(X,"receiveShadow",lt.receiveShadow)),(ot.isMeshStandardMaterial||ot.isMeshLambertMaterial||ot.isMeshPhongMaterial)&&ot.envMap===null&&H.environment!==null&&(en.envMapIntensity.value=H.environmentIntensity),en.dfgLUT!==void 0&&(en.dfgLUT.value=n3()),$i){if(He.setValue(X,"toneMappingExposure",G.toneMappingExposure),kt.needsLights&&Hl(en,Se),Vt&&ot.fog===!0&&wt.refreshFogUniforms(en,Vt),wt.refreshMaterialUniforms(en,ot,ft,Z,L.state.transmissionRenderTarget[R.id]),kt.needsLights&&kt.lightProbeGrid){const Ce=kt.lightProbeGrid;en.probesSH.value=Ce.texture,en.probesMin.value.copy(Ce.boundingBox.min),en.probesMax.value.copy(Ce.boundingBox.max),en.probesResolution.value.copy(Ce.resolution)}Fu.upload(X,bo(kt),en,gt)}if(ot.isShaderMaterial&&ot.uniformsNeedUpdate===!0&&(Fu.upload(X,bo(kt),en,gt),ot.uniformsNeedUpdate=!1),ot.isSpriteMaterial&&He.setValue(X,"center",lt.center),He.setValue(X,"modelViewMatrix",lt.modelViewMatrix),He.setValue(X,"normalMatrix",lt.normalMatrix),He.setValue(X,"modelMatrix",lt.matrixWorld),ot.uniformsGroups!==void 0){const Ce=ot.uniformsGroups;for(let hn=0,Ma=Ce.length;hn<Ma;hn++){const Vl=Ce[hn];Rt.update(Vl,Xn),Rt.bind(Vl,Xn)}}return Xn}function Hl(R,H){R.ambientLightColor.needsUpdate=H,R.lightProbe.needsUpdate=H,R.sunLights.needsUpdate=H,R.sunLightShadows.needsUpdate=H,R.directionalLights.needsUpdate=H,R.directionalLightShadows.needsUpdate=H,R.pointLights.needsUpdate=H,R.pointLightShadows.needsUpdate=H,R.spotLights.needsUpdate=H,R.spotLightShadows.needsUpdate=H,R.rectAreaLights.needsUpdate=H,R.hemisphereLights.needsUpdate=H}function Gl(R){return R.isMeshLambertMaterial||R.isMeshToonMaterial||R.isMeshPhongMaterial||R.isMeshStandardMaterial||R.isShadowMaterial||R.isShaderMaterial&&R.lights===!0}this.getActiveCubeFace=function(){return q},this.getActiveMipmapLevel=function(){return j},this.getRenderTarget=function(){return dt},this.setRenderTargetTextures=function(R,H,pt){const ot=at.get(R);ot.__autoAllocateDepthBuffer=R.resolveDepthBuffer===!1,ot.__autoAllocateDepthBuffer===!1&&(ot.__useRenderToTexture=!1),at.get(R.texture).__webglTexture=H,at.get(R.depthTexture).__webglTexture=ot.__autoAllocateDepthBuffer?void 0:pt,ot.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(R,H){const pt=at.get(R);pt.__webglFramebuffer=H,pt.__useDefaultFramebuffer=H===void 0},this.setRenderTarget=function(R,H=0,pt=0){dt=R,q=H,j=pt;let ot=null,lt=!1,Vt=!1;if(R){const Ft=at.get(R);if(Ft.__useDefaultFramebuffer!==void 0){E.bindFramebuffer(X.FRAMEBUFFER,Ft.__webglFramebuffer),Tt.copy(R.viewport),Gt.copy(R.scissor),Ot=R.scissorTest,E.viewport(Tt),E.scissor(Gt),E.setScissorTest(Ot),ut=-1;return}else if(Ft.__webglFramebuffer===void 0)gt.setupRenderTarget(R);else if(Ft.__hasExternalTextures)gt.rebindTextures(R,at.get(R.texture).__webglTexture,at.get(R.depthTexture).__webglTexture);else if(R.depthBuffer){const re=R.depthTexture;if(Ft.__boundDepthTexture!==re){if(re!==null&&at.has(re)&&(R.width!==re.image.width||R.height!==re.image.height))throw new Error("THREE.WebGLRenderer: Attached DepthTexture is initialized to the incorrect size.");gt.setupDepthRenderbuffer(R)}}const Kt=R.texture;(Kt.isData3DTexture||Kt.isDataArrayTexture||Kt.isCompressedArrayTexture)&&(Vt=!0);const Jt=at.get(R).__webglFramebuffer;R.isWebGLCubeRenderTarget?(Array.isArray(Jt[H])?ot=Jt[H][pt]:ot=Jt[H],lt=!0):R.samples>0&&gt.useMultisampledRTT(R)===!1?ot=at.get(R).__webglMultisampledFramebuffer:Array.isArray(Jt)?ot=Jt[pt]:ot=Jt,Tt.copy(R.viewport),Gt.copy(R.scissor),Ot=R.scissorTest}else Tt.copy(vt).multiplyScalar(ft).floor(),Gt.copy(Ut).multiplyScalar(ft).floor(),Ot=be;if(pt!==0&&(ot=st),E.bindFramebuffer(X.FRAMEBUFFER,ot)&&E.drawBuffers(R,ot),E.viewport(Tt),E.scissor(Gt),E.setScissorTest(Ot),lt){const Ft=at.get(R.texture);X.framebufferTexture2D(X.FRAMEBUFFER,X.COLOR_ATTACHMENT0,X.TEXTURE_CUBE_MAP_POSITIVE_X+H,Ft.__webglTexture,pt)}else if(Vt){const Ft=H;for(let Kt=0;Kt<R.textures.length;Kt++){const Jt=at.get(R.textures[Kt]);X.framebufferTextureLayer(X.FRAMEBUFFER,X.COLOR_ATTACHMENT0+Kt,Jt.__webglTexture,pt,Ft)}}else if(R!==null&&pt!==0){const Ft=at.get(R.texture);X.framebufferTexture2D(X.FRAMEBUFFER,X.COLOR_ATTACHMENT0,X.TEXTURE_2D,Ft.__webglTexture,pt)}ut=-1};function bi(R){const H=at.get(R);return(H.__readFormat!==R.format||H.__readType!==R.type)&&(H.__readFormat=R.format,H.__readType=R.type,H.__formatReadable=P.textureFormatReadable(R.format),H.__typeReadable=P.textureTypeReadable(R.type)),H}this.readRenderTargetPixels=function(R,H,pt,ot,lt,Vt,Yt,Ft=0){if(!(R&&R.isWebGLRenderTarget)){Fe("WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let Kt=at.get(R).__webglFramebuffer;if(R.isWebGLCubeRenderTarget&&Yt!==void 0&&(Kt=Kt[Yt]),Kt){E.bindFramebuffer(X.FRAMEBUFFER,Kt);try{const Jt=R.textures[Ft],re=Jt.format,he=Jt.type;R.textures.length>1&&X.readBuffer(X.COLOR_ATTACHMENT0+Ft);const jt=bi(Jt);if(jt.__formatReadable===!1){Fe("WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(jt.__typeReadable===!1){Fe("WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}H>=0&&H<=R.width-ot&&pt>=0&&pt<=R.height-lt&&X.readPixels(H,pt,ot,lt,Bt.convert(re),Bt.convert(he),Vt)}finally{const Jt=dt!==null?at.get(dt).__webglFramebuffer:null;E.bindFramebuffer(X.FRAMEBUFFER,Jt)}}},this.readRenderTargetPixelsAsync=async function(R,H,pt,ot,lt,Vt,Yt,Ft=0){if(!(R&&R.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let Kt=at.get(R).__webglFramebuffer;if(R.isWebGLCubeRenderTarget&&Yt!==void 0&&(Kt=Kt[Yt]),Kt)if(H>=0&&H<=R.width-ot&&pt>=0&&pt<=R.height-lt){E.bindFramebuffer(X.FRAMEBUFFER,Kt);const Jt=R.textures[Ft],re=Jt.format,he=Jt.type;R.textures.length>1&&X.readBuffer(X.COLOR_ATTACHMENT0+Ft);const jt=bi(Jt);if(jt.__formatReadable===!1)throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(jt.__typeReadable===!1)throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");const Te=X.createBuffer();X.bindBuffer(X.PIXEL_PACK_BUFFER,Te),X.bufferData(X.PIXEL_PACK_BUFFER,Vt.byteLength,X.STREAM_READ),X.readPixels(H,pt,ot,lt,Bt.convert(re),Bt.convert(he),0),X.bindBuffer(X.PIXEL_PACK_BUFFER,null);const xe=dt!==null?at.get(dt).__webglFramebuffer:null;E.bindFramebuffer(X.FRAMEBUFFER,xe);const Qe=X.fenceSync(X.SYNC_GPU_COMMANDS_COMPLETE,0);return X.flush(),await mb(X,Qe,4),X.bindBuffer(X.PIXEL_PACK_BUFFER,Te),X.getBufferSubData(X.PIXEL_PACK_BUFFER,0,Vt),X.bindBuffer(X.PIXEL_PACK_BUFFER,null),X.deleteBuffer(Te),X.deleteSync(Qe),Vt}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")},this.copyFramebufferToTexture=function(R,H=null,pt=0){const ot=Math.pow(2,-pt),lt=Math.floor(R.image.width*ot),Vt=Math.floor(R.image.height*ot),Yt=H!==null?H.x:0,Ft=H!==null?H.y:0;gt.setTexture2D(R,0),X.copyTexSubImage2D(X.TEXTURE_2D,pt,0,0,Yt,Ft,lt,Vt),E.unbindTexture()},this.copyTextureToTexture=function(R,H,pt=null,ot=null,lt=0,Vt=0){let Yt,Ft,Kt,Jt,re,he,jt,Te,xe;const Qe=R.isCompressedTexture?R.mipmaps[Vt]:R.image;if(pt!==null)Yt=pt.max.x-pt.min.x,Ft=pt.max.y-pt.min.y,Kt=pt.isBox3?pt.max.z-pt.min.z:1,Jt=pt.min.x,re=pt.min.y,he=pt.isBox3?pt.min.z:0;else{const en=Math.pow(2,-lt);Yt=Math.floor(Qe.width*en),Ft=Math.floor(Qe.height*en),R.isDataArrayTexture?Kt=Qe.depth:R.isData3DTexture?Kt=Math.floor(Qe.depth*en):Kt=1,Jt=0,re=0,he=0}ot!==null?(jt=ot.x,Te=ot.y,xe=ot.z):(jt=0,Te=0,xe=0);const ke=Bt.convert(H.format),En=Bt.convert(H.type);let kt;H.isData3DTexture?(gt.setTexture3D(H,0),kt=X.TEXTURE_3D):H.isDataArrayTexture||H.isCompressedArrayTexture?(gt.setTexture2DArray(H,0),kt=X.TEXTURE_2D_ARRAY):(gt.setTexture2D(H,0),kt=X.TEXTURE_2D),E.activeTexture(X.TEXTURE0),E.pixelStorei(X.UNPACK_FLIP_Y_WEBGL,H.flipY),E.pixelStorei(X.UNPACK_PREMULTIPLY_ALPHA_WEBGL,H.premultiplyAlpha),E.pixelStorei(X.UNPACK_ALIGNMENT,H.unpackAlignment);const fn=E.getParameter(X.UNPACK_ROW_LENGTH),Le=E.getParameter(X.UNPACK_IMAGE_HEIGHT),Xn=E.getParameter(X.UNPACK_SKIP_PIXELS),li=E.getParameter(X.UNPACK_SKIP_ROWS),$i=E.getParameter(X.UNPACK_SKIP_IMAGES);E.pixelStorei(X.UNPACK_ROW_LENGTH,Qe.width),E.pixelStorei(X.UNPACK_IMAGE_HEIGHT,Qe.height),E.pixelStorei(X.UNPACK_SKIP_PIXELS,Jt),E.pixelStorei(X.UNPACK_SKIP_ROWS,re),E.pixelStorei(X.UNPACK_SKIP_IMAGES,he);const Se=R.isDataArrayTexture||R.isData3DTexture,He=H.isDataArrayTexture||H.isData3DTexture;if(R.isDepthTexture){const en=at.get(R),ci=at.get(H),Ce=at.get(en.__renderTarget),hn=at.get(ci.__renderTarget);E.bindFramebuffer(X.READ_FRAMEBUFFER,Ce.__webglFramebuffer),E.bindFramebuffer(X.DRAW_FRAMEBUFFER,hn.__webglFramebuffer);for(let Ma=0;Ma<Kt;Ma++)Se&&(X.framebufferTextureLayer(X.READ_FRAMEBUFFER,X.COLOR_ATTACHMENT0,at.get(R).__webglTexture,lt,he+Ma),X.framebufferTextureLayer(X.DRAW_FRAMEBUFFER,X.COLOR_ATTACHMENT0,at.get(H).__webglTexture,Vt,xe+Ma)),X.blitFramebuffer(Jt,re,Yt,Ft,jt,Te,Yt,Ft,X.DEPTH_BUFFER_BIT,X.NEAREST);E.bindFramebuffer(X.READ_FRAMEBUFFER,null),E.bindFramebuffer(X.DRAW_FRAMEBUFFER,null)}else if(lt!==0||R.isRenderTargetTexture||at.has(R)){const en=at.get(R),ci=at.get(H);E.bindFramebuffer(X.READ_FRAMEBUFFER,Y),E.bindFramebuffer(X.DRAW_FRAMEBUFFER,tt);for(let Ce=0;Ce<Kt;Ce++)Se?X.framebufferTextureLayer(X.READ_FRAMEBUFFER,X.COLOR_ATTACHMENT0,en.__webglTexture,lt,he+Ce):X.framebufferTexture2D(X.READ_FRAMEBUFFER,X.COLOR_ATTACHMENT0,X.TEXTURE_2D,en.__webglTexture,lt),He?X.framebufferTextureLayer(X.DRAW_FRAMEBUFFER,X.COLOR_ATTACHMENT0,ci.__webglTexture,Vt,xe+Ce):X.framebufferTexture2D(X.DRAW_FRAMEBUFFER,X.COLOR_ATTACHMENT0,X.TEXTURE_2D,ci.__webglTexture,Vt),lt!==0?X.blitFramebuffer(Jt,re,Yt,Ft,jt,Te,Yt,Ft,X.COLOR_BUFFER_BIT,X.NEAREST):He?X.copyTexSubImage3D(kt,Vt,jt,Te,xe+Ce,Jt,re,Yt,Ft):X.copyTexSubImage2D(kt,Vt,jt,Te,Jt,re,Yt,Ft);E.bindFramebuffer(X.READ_FRAMEBUFFER,null),E.bindFramebuffer(X.DRAW_FRAMEBUFFER,null)}else He?R.isDataTexture||R.isData3DTexture?X.texSubImage3D(kt,Vt,jt,Te,xe,Yt,Ft,Kt,ke,En,Qe.data):H.isCompressedArrayTexture?X.compressedTexSubImage3D(kt,Vt,jt,Te,xe,Yt,Ft,Kt,ke,Qe.data):X.texSubImage3D(kt,Vt,jt,Te,xe,Yt,Ft,Kt,ke,En,Qe):R.isDataTexture?X.texSubImage2D(X.TEXTURE_2D,Vt,jt,Te,Yt,Ft,ke,En,Qe.data):R.isCompressedTexture?X.compressedTexSubImage2D(X.TEXTURE_2D,Vt,jt,Te,Qe.width,Qe.height,ke,Qe.data):X.texSubImage2D(X.TEXTURE_2D,Vt,jt,Te,Yt,Ft,ke,En,Qe);E.pixelStorei(X.UNPACK_ROW_LENGTH,fn),E.pixelStorei(X.UNPACK_IMAGE_HEIGHT,Le),E.pixelStorei(X.UNPACK_SKIP_PIXELS,Xn),E.pixelStorei(X.UNPACK_SKIP_ROWS,li),E.pixelStorei(X.UNPACK_SKIP_IMAGES,$i),Vt===0&&H.generateMipmaps&&X.generateMipmap(kt),E.unbindTexture()},this.initRenderTarget=function(R){at.get(R).__webglFramebuffer===void 0&&gt.setupRenderTarget(R)},this.initTexture=function(R){R.isCubeTexture?gt.setTextureCube(R,0):R.isData3DTexture?gt.setTexture3D(R,0):R.isDataArrayTexture||R.isCompressedArrayTexture?gt.setTexture2DArray(R,0):gt.setTexture2D(R,0),E.unbindTexture()},this.resetState=function(){q=0,j=0,dt=null,E.reset(),qt.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return ga}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(e){this._outputColorSpace=e;const i=this.getContext();i.drawingBufferColorSpace=Oe._getDrawingBufferColorSpace(e),i.unpackColorSpace=Oe._getUnpackColorSpace()}}const Zx={type:"change"},Am={type:"start"},zS={type:"end"},Ou=new _m,Kx=new Ga,a3=Math.cos(70*vb.DEG2RAD),Tn=new nt,si=2*Math.PI,Ze={NONE:-1,ROTATE:0,DOLLY:1,PAN:2,TOUCH_ROTATE:3,TOUCH_PAN:4,TOUCH_DOLLY_PAN:5,TOUCH_DOLLY_ROTATE:6},hp=1e-6;class s3 extends sT{constructor(e,i=null){super(e,i),this.state=Ze.NONE,this.target=new nt,this.cursor=new nt,this.minDistance=0,this.maxDistance=1/0,this.minZoom=0,this.maxZoom=1/0,this.minTargetRadius=0,this.maxTargetRadius=1/0,this.minPolarAngle=0,this.maxPolarAngle=Math.PI,this.minAzimuthAngle=-1/0,this.maxAzimuthAngle=1/0,this.enableDamping=!1,this.dampingFactor=.05,this.enableZoom=!0,this.zoomSpeed=1,this.enableRotate=!0,this.rotateSpeed=1,this.keyRotateSpeed=1,this.enablePan=!0,this.panSpeed=1,this.screenSpacePanning=!0,this.keyPanSpeed=7,this.zoomToCursor=!1,this.autoRotate=!1,this.autoRotateSpeed=2,this.keys={LEFT:"ArrowLeft",UP:"ArrowUp",RIGHT:"ArrowRight",BOTTOM:"ArrowDown"},this.mouseButtons={LEFT:po.ROTATE,MIDDLE:po.DOLLY,RIGHT:po.PAN},this.touches={ONE:fo.ROTATE,TWO:fo.DOLLY_PAN},this.target0=this.target.clone(),this.position0=this.object.position.clone(),this.zoom0=this.object.zoom,this._cursorStyle="auto",this._domElementKeyEvents=null,this._lastPosition=new nt,this._lastQuaternion=new Rs,this._lastTargetPosition=new nt,this._quat=new Rs().setFromUnitVectors(e.up,new nt(0,1,0)),this._quatInverse=this._quat.clone().invert(),this._spherical=new bx,this._sphericalDelta=new bx,this._scale=1,this._panOffset=new nt,this._rotateStart=new le,this._rotateEnd=new le,this._rotateDelta=new le,this._panStart=new le,this._panEnd=new le,this._panDelta=new le,this._dollyStart=new le,this._dollyEnd=new le,this._dollyDelta=new le,this._dollyDirection=new nt,this._mouse=new le,this._performCursorZoom=!1,this._pointers=[],this._pointerPositions={},this._controlActive=!1,this._onPointerMove=o3.bind(this),this._onPointerDown=r3.bind(this),this._onPointerUp=l3.bind(this),this._onContextMenu=m3.bind(this),this._onMouseWheel=f3.bind(this),this._onKeyDown=h3.bind(this),this._onTouchStart=d3.bind(this),this._onTouchMove=p3.bind(this),this._onMouseDown=c3.bind(this),this._onMouseMove=u3.bind(this),this._interceptControlDown=g3.bind(this),this._interceptControlUp=_3.bind(this),this.domElement!==null&&this.connect(this.domElement),this.update()}set cursorStyle(e){this._cursorStyle=e,e==="grab"?this.domElement.style.cursor="grab":this.domElement.style.cursor="auto"}get cursorStyle(){return this._cursorStyle}connect(e){super.connect(e),this.domElement.addEventListener("pointerdown",this._onPointerDown),this.domElement.addEventListener("pointercancel",this._onPointerUp),this.domElement.addEventListener("contextmenu",this._onContextMenu),this.domElement.addEventListener("wheel",this._onMouseWheel,{passive:!1}),this.domElement.getRootNode().addEventListener("keydown",this._interceptControlDown,{passive:!0,capture:!0}),this.domElement.style.touchAction="none"}disconnect(){this.state=Ze.NONE,this.domElement.removeEventListener("pointerdown",this._onPointerDown),this.domElement.ownerDocument.removeEventListener("pointermove",this._onPointerMove),this.domElement.ownerDocument.removeEventListener("pointerup",this._onPointerUp),this.domElement.removeEventListener("pointercancel",this._onPointerUp),this.domElement.removeEventListener("wheel",this._onMouseWheel),this.domElement.removeEventListener("contextmenu",this._onContextMenu),this.stopListenToKeyEvents();const e=this.domElement.getRootNode();e.removeEventListener("keydown",this._interceptControlDown,{capture:!0}),e.removeEventListener("keyup",this._interceptControlUp,{capture:!0}),this._controlActive=!1,this._pointers.length=0,this._pointerPositions={},this.domElement.style.touchAction="",this.domElement.style.cursor="auto"}dispose(){this.disconnect()}getPolarAngle(){return this._spherical.phi}getAzimuthalAngle(){return this._spherical.theta}getDistance(){return this.object.position.distanceTo(this.target)}listenToKeyEvents(e){e.addEventListener("keydown",this._onKeyDown),this._domElementKeyEvents=e}stopListenToKeyEvents(){this._domElementKeyEvents!==null&&(this._domElementKeyEvents.removeEventListener("keydown",this._onKeyDown),this._domElementKeyEvents=null)}saveState(){this.target0.copy(this.target),this.position0.copy(this.object.position),this.zoom0=this.object.zoom}reset(){this.target.copy(this.target0),this.object.position.copy(this.position0),this.object.zoom=this.zoom0,this.object.updateProjectionMatrix(),this.dispatchEvent(Zx),this.update(),this.state=Ze.NONE}pan(e,i){this._pan(e,i),this.update()}dollyIn(e){this._dollyIn(e),this.update()}dollyOut(e){this._dollyOut(e),this.update()}rotateLeft(e){this._rotateLeft(e),this.update()}rotateUp(e){this._rotateUp(e),this.update()}update(e=null){const i=this.object.position;Tn.copy(i).sub(this.target),Tn.applyQuaternion(this._quat),this._spherical.setFromVector3(Tn),this.autoRotate&&this.state===Ze.NONE&&this._rotateLeft(this._getAutoRotationAngle(e)),this.enableDamping?(this._spherical.theta+=this._sphericalDelta.theta*this.dampingFactor,this._spherical.phi+=this._sphericalDelta.phi*this.dampingFactor):(this._spherical.theta+=this._sphericalDelta.theta,this._spherical.phi+=this._sphericalDelta.phi);let s=this.minAzimuthAngle,l=this.maxAzimuthAngle;isFinite(s)&&isFinite(l)&&(s<-Math.PI?s+=si:s>Math.PI&&(s-=si),l<-Math.PI?l+=si:l>Math.PI&&(l-=si),s<=l?this._spherical.theta=Math.max(s,Math.min(l,this._spherical.theta)):this._spherical.theta=this._spherical.theta>(s+l)/2?Math.max(s,this._spherical.theta):Math.min(l,this._spherical.theta)),this._spherical.phi=Math.max(this.minPolarAngle,Math.min(this.maxPolarAngle,this._spherical.phi)),this._spherical.makeSafe(),this.enableDamping===!0?this.target.addScaledVector(this._panOffset,this.dampingFactor):this.target.add(this._panOffset),this.target.sub(this.cursor),this.target.clampLength(this.minTargetRadius,this.maxTargetRadius),this.target.add(this.cursor);let f=!1;if(this.zoomToCursor&&this._performCursorZoom||this.object.isOrthographicCamera)this._spherical.radius=this._clampDistance(this._spherical.radius);else{const h=this._spherical.radius;this._spherical.radius=this._clampDistance(this._spherical.radius*this._scale),f=h!=this._spherical.radius}if(Tn.setFromSpherical(this._spherical),Tn.applyQuaternion(this._quatInverse),i.copy(this.target).add(Tn),this.object.lookAt(this.target),this.enableDamping===!0?(this._sphericalDelta.theta*=1-this.dampingFactor,this._sphericalDelta.phi*=1-this.dampingFactor,this._panOffset.multiplyScalar(1-this.dampingFactor)):(this._sphericalDelta.set(0,0,0),this._panOffset.set(0,0,0)),this.zoomToCursor&&this._performCursorZoom){let h=null;if(this.object.isPerspectiveCamera){const d=Tn.length();h=this._clampDistance(d*this._scale);const m=d-h;this.object.position.addScaledVector(this._dollyDirection,m),this.object.updateMatrixWorld(),f=!!m}else if(this.object.isOrthographicCamera){const d=new nt(this._mouse.x,this._mouse.y,0);d.unproject(this.object);const m=this.object.zoom;this.object.zoom=Math.max(this.minZoom,Math.min(this.maxZoom,this.object.zoom/this._scale)),this.object.updateProjectionMatrix(),f=m!==this.object.zoom;const p=new nt(this._mouse.x,this._mouse.y,0);p.unproject(this.object),this.object.position.sub(p).add(d),this.object.updateMatrixWorld(),h=Tn.length()}else console.warn("WARNING: OrbitControls.js encountered an unknown camera type - zoom to cursor disabled."),this.zoomToCursor=!1;h!==null&&(this.screenSpacePanning?this.target.set(0,0,-1).transformDirection(this.object.matrix).multiplyScalar(h).add(this.object.position):(Ou.origin.copy(this.object.position),Ou.direction.set(0,0,-1).transformDirection(this.object.matrix),Math.abs(this.object.up.dot(Ou.direction))<a3?this.object.lookAt(this.target):(Kx.setFromNormalAndCoplanarPoint(this.object.up,this.target),Ou.intersectPlane(Kx,this.target))))}else if(this.object.isOrthographicCamera){const h=this.object.zoom;this.object.zoom=Math.max(this.minZoom,Math.min(this.maxZoom,this.object.zoom/this._scale)),h!==this.object.zoom&&(this.object.updateProjectionMatrix(),f=!0)}return this._scale=1,this._performCursorZoom=!1,f||this._lastPosition.distanceToSquared(this.object.position)>hp||8*(1-this._lastQuaternion.dot(this.object.quaternion))>hp||this._lastTargetPosition.distanceToSquared(this.target)>hp?(this.dispatchEvent(Zx),this._lastPosition.copy(this.object.position),this._lastQuaternion.copy(this.object.quaternion),this._lastTargetPosition.copy(this.target),!0):!1}_getAutoRotationAngle(e){return e!==null?si/60*this.autoRotateSpeed*e:si/60/60*this.autoRotateSpeed}_getZoomScale(e){const i=Math.abs(e*.01);return Math.pow(.95,this.zoomSpeed*i)}_rotateLeft(e){this._sphericalDelta.theta-=e}_rotateUp(e){this._sphericalDelta.phi-=e}_panLeft(e,i){Tn.setFromMatrixColumn(i,0),Tn.multiplyScalar(-e),this._panOffset.add(Tn)}_panUp(e,i){this.screenSpacePanning===!0?Tn.setFromMatrixColumn(i,1):(Tn.setFromMatrixColumn(i,0),Tn.crossVectors(this.object.up,Tn)),Tn.multiplyScalar(e),this._panOffset.add(Tn)}_pan(e,i){const s=this.domElement;if(this.object.isPerspectiveCamera){const l=this.object.position;Tn.copy(l).sub(this.target);let f=Tn.length();f*=Math.tan(this.object.fov/2*Math.PI/180),this._panLeft(2*e*f/s.clientHeight,this.object.matrix),this._panUp(2*i*f/s.clientHeight,this.object.matrix)}else this.object.isOrthographicCamera?(this._panLeft(e*(this.object.right-this.object.left)/this.object.zoom/s.clientWidth,this.object.matrix),this._panUp(i*(this.object.top-this.object.bottom)/this.object.zoom/s.clientHeight,this.object.matrix)):(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - pan disabled."),this.enablePan=!1)}_dollyOut(e){this.object.isPerspectiveCamera||this.object.isOrthographicCamera?this._scale/=e:(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),this.enableZoom=!1)}_dollyIn(e){this.object.isPerspectiveCamera||this.object.isOrthographicCamera?this._scale*=e:(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),this.enableZoom=!1)}_updateZoomParameters(e,i){if(!this.zoomToCursor)return;this._performCursorZoom=!0;const s=this.domElement.getBoundingClientRect(),l=e-s.left,f=i-s.top,h=s.width,d=s.height;this._mouse.x=l/h*2-1,this._mouse.y=-(f/d)*2+1,this._dollyDirection.set(this._mouse.x,this._mouse.y,1).unproject(this.object).sub(this.object.position).normalize()}_clampDistance(e){return Math.max(this.minDistance,Math.min(this.maxDistance,e))}_handleMouseDownRotate(e){this._rotateStart.set(e.clientX,e.clientY)}_handleMouseDownDolly(e){this._updateZoomParameters(e.clientX,e.clientX),this._dollyStart.set(e.clientX,e.clientY)}_handleMouseDownPan(e){this._panStart.set(e.clientX,e.clientY)}_handleMouseMoveRotate(e){this._rotateEnd.set(e.clientX,e.clientY),this._rotateDelta.subVectors(this._rotateEnd,this._rotateStart).multiplyScalar(this.rotateSpeed);const i=this.domElement;this._rotateLeft(si*this._rotateDelta.x/i.clientHeight),this._rotateUp(si*this._rotateDelta.y/i.clientHeight),this._rotateStart.copy(this._rotateEnd),this.update()}_handleMouseMoveDolly(e){this._dollyEnd.set(e.clientX,e.clientY),this._dollyDelta.subVectors(this._dollyEnd,this._dollyStart),this._dollyDelta.y>0?this._dollyOut(this._getZoomScale(this._dollyDelta.y)):this._dollyDelta.y<0&&this._dollyIn(this._getZoomScale(this._dollyDelta.y)),this._dollyStart.copy(this._dollyEnd),this.update()}_handleMouseMovePan(e){this._panEnd.set(e.clientX,e.clientY),this._panDelta.subVectors(this._panEnd,this._panStart).multiplyScalar(this.panSpeed),this._pan(this._panDelta.x,this._panDelta.y),this._panStart.copy(this._panEnd),this.update()}_handleMouseWheel(e){this._updateZoomParameters(e.clientX,e.clientY),e.deltaY<0?this._dollyIn(this._getZoomScale(e.deltaY)):e.deltaY>0&&this._dollyOut(this._getZoomScale(e.deltaY)),this.update()}_handleKeyDown(e){let i=!1;switch(e.code){case this.keys.UP:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateUp(si*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(0,this.keyPanSpeed),i=!0;break;case this.keys.BOTTOM:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateUp(-si*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(0,-this.keyPanSpeed),i=!0;break;case this.keys.LEFT:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateLeft(si*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(this.keyPanSpeed,0),i=!0;break;case this.keys.RIGHT:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateLeft(-si*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(-this.keyPanSpeed,0),i=!0;break}i&&(e.preventDefault(),this.update())}_handleTouchStartRotate(e){if(this._pointers.length===1)this._rotateStart.set(e.pageX,e.pageY);else{const i=this._getSecondPointerPosition(e),s=.5*(e.pageX+i.x),l=.5*(e.pageY+i.y);this._rotateStart.set(s,l)}}_handleTouchStartPan(e){if(this._pointers.length===1)this._panStart.set(e.pageX,e.pageY);else{const i=this._getSecondPointerPosition(e),s=.5*(e.pageX+i.x),l=.5*(e.pageY+i.y);this._panStart.set(s,l)}}_handleTouchStartDolly(e){const i=this._getSecondPointerPosition(e),s=e.pageX-i.x,l=e.pageY-i.y,f=Math.sqrt(s*s+l*l);this._dollyStart.set(0,f)}_handleTouchStartDollyPan(e){this.enableZoom&&this._handleTouchStartDolly(e),this.enablePan&&this._handleTouchStartPan(e)}_handleTouchStartDollyRotate(e){this.enableZoom&&this._handleTouchStartDolly(e),this.enableRotate&&this._handleTouchStartRotate(e)}_handleTouchMoveRotate(e){if(this._pointers.length==1)this._rotateEnd.set(e.pageX,e.pageY);else{const s=this._getSecondPointerPosition(e),l=.5*(e.pageX+s.x),f=.5*(e.pageY+s.y);this._rotateEnd.set(l,f)}this._rotateDelta.subVectors(this._rotateEnd,this._rotateStart).multiplyScalar(this.rotateSpeed);const i=this.domElement;this._rotateLeft(si*this._rotateDelta.x/i.clientHeight),this._rotateUp(si*this._rotateDelta.y/i.clientHeight),this._rotateStart.copy(this._rotateEnd)}_handleTouchMovePan(e){if(this._pointers.length===1)this._panEnd.set(e.pageX,e.pageY);else{const i=this._getSecondPointerPosition(e),s=.5*(e.pageX+i.x),l=.5*(e.pageY+i.y);this._panEnd.set(s,l)}this._panDelta.subVectors(this._panEnd,this._panStart).multiplyScalar(this.panSpeed),this._pan(this._panDelta.x,this._panDelta.y),this._panStart.copy(this._panEnd)}_handleTouchMoveDolly(e){const i=this._getSecondPointerPosition(e),s=e.pageX-i.x,l=e.pageY-i.y,f=Math.sqrt(s*s+l*l);this._dollyEnd.set(0,f),this._dollyDelta.set(0,Math.pow(this._dollyEnd.y/this._dollyStart.y,this.zoomSpeed)),this._dollyOut(this._dollyDelta.y),this._dollyStart.copy(this._dollyEnd);const h=(e.pageX+i.x)*.5,d=(e.pageY+i.y)*.5;this._updateZoomParameters(h,d)}_handleTouchMoveDollyPan(e){this.enableZoom&&this._handleTouchMoveDolly(e),this.enablePan&&this._handleTouchMovePan(e)}_handleTouchMoveDollyRotate(e){this.enableZoom&&this._handleTouchMoveDolly(e),this.enableRotate&&this._handleTouchMoveRotate(e)}_addPointer(e){this._pointers.push(e.pointerId)}_removePointer(e){delete this._pointerPositions[e.pointerId];for(let i=0;i<this._pointers.length;i++)if(this._pointers[i]==e.pointerId){this._pointers.splice(i,1);return}}_isTrackingPointer(e){for(let i=0;i<this._pointers.length;i++)if(this._pointers[i]==e.pointerId)return!0;return!1}_trackPointer(e){let i=this._pointerPositions[e.pointerId];i===void 0&&(i=new le,this._pointerPositions[e.pointerId]=i),i.set(e.pageX,e.pageY)}_getSecondPointerPosition(e){const i=e.pointerId===this._pointers[0]?this._pointers[1]:this._pointers[0];return this._pointerPositions[i]}_customWheelEvent(e){const i=e.deltaMode,s={clientX:e.clientX,clientY:e.clientY,deltaY:e.deltaY};switch(i){case 1:s.deltaY*=16;break;case 2:s.deltaY*=100;break}return e.ctrlKey&&!this._controlActive&&(s.deltaY*=10),s}}function r3(o){this.enabled!==!1&&(this._pointers.length===0&&(this.domElement.setPointerCapture(o.pointerId),this.domElement.ownerDocument.addEventListener("pointermove",this._onPointerMove),this.domElement.ownerDocument.addEventListener("pointerup",this._onPointerUp)),!this._isTrackingPointer(o)&&(this._addPointer(o),o.pointerType==="touch"?this._onTouchStart(o):this._onMouseDown(o),this._cursorStyle==="grab"&&(this.domElement.style.cursor="grabbing")))}function o3(o){this.enabled!==!1&&(o.pointerType==="touch"?this._onTouchMove(o):this._onMouseMove(o))}function l3(o){switch(this._removePointer(o),this._pointers.length){case 0:this.domElement.releasePointerCapture(o.pointerId),this.domElement.ownerDocument.removeEventListener("pointermove",this._onPointerMove),this.domElement.ownerDocument.removeEventListener("pointerup",this._onPointerUp),this.dispatchEvent(zS),this.state=Ze.NONE,this._cursorStyle==="grab"&&(this.domElement.style.cursor="grab");break;case 1:const e=this._pointers[0],i=this._pointerPositions[e];this._onTouchStart({pointerId:e,pageX:i.x,pageY:i.y});break}}function c3(o){let e;switch(o.button){case 0:e=this.mouseButtons.LEFT;break;case 1:e=this.mouseButtons.MIDDLE;break;case 2:e=this.mouseButtons.RIGHT;break;default:e=-1}switch(e){case po.DOLLY:if(this.enableZoom===!1)return;this._handleMouseDownDolly(o),this.state=Ze.DOLLY;break;case po.ROTATE:if(o.ctrlKey||o.metaKey||o.shiftKey){if(this.enablePan===!1)return;this._handleMouseDownPan(o),this.state=Ze.PAN}else{if(this.enableRotate===!1)return;this._handleMouseDownRotate(o),this.state=Ze.ROTATE}break;case po.PAN:if(o.ctrlKey||o.metaKey||o.shiftKey){if(this.enableRotate===!1)return;this._handleMouseDownRotate(o),this.state=Ze.ROTATE}else{if(this.enablePan===!1)return;this._handleMouseDownPan(o),this.state=Ze.PAN}break;default:this.state=Ze.NONE}this.state!==Ze.NONE&&this.dispatchEvent(Am)}function u3(o){switch(this.state){case Ze.ROTATE:if(this.enableRotate===!1)return;this._handleMouseMoveRotate(o);break;case Ze.DOLLY:if(this.enableZoom===!1)return;this._handleMouseMoveDolly(o);break;case Ze.PAN:if(this.enablePan===!1)return;this._handleMouseMovePan(o);break}}function f3(o){this.enabled===!1||this.enableZoom===!1||this.state!==Ze.NONE||(o.preventDefault(),this.dispatchEvent(Am),this._handleMouseWheel(this._customWheelEvent(o)),this.dispatchEvent(zS))}function h3(o){this.enabled!==!1&&this._handleKeyDown(o)}function d3(o){switch(this._trackPointer(o),this._pointers.length){case 1:switch(this.touches.ONE){case fo.ROTATE:if(this.enableRotate===!1)return;this._handleTouchStartRotate(o),this.state=Ze.TOUCH_ROTATE;break;case fo.PAN:if(this.enablePan===!1)return;this._handleTouchStartPan(o),this.state=Ze.TOUCH_PAN;break;default:this.state=Ze.NONE}break;case 2:switch(this.touches.TWO){case fo.DOLLY_PAN:if(this.enableZoom===!1&&this.enablePan===!1)return;this._handleTouchStartDollyPan(o),this.state=Ze.TOUCH_DOLLY_PAN;break;case fo.DOLLY_ROTATE:if(this.enableZoom===!1&&this.enableRotate===!1)return;this._handleTouchStartDollyRotate(o),this.state=Ze.TOUCH_DOLLY_ROTATE;break;default:this.state=Ze.NONE}break;default:this.state=Ze.NONE}this.state!==Ze.NONE&&this.dispatchEvent(Am)}function p3(o){switch(this._trackPointer(o),this.state){case Ze.TOUCH_ROTATE:if(this.enableRotate===!1)return;this._handleTouchMoveRotate(o),this.update();break;case Ze.TOUCH_PAN:if(this.enablePan===!1)return;this._handleTouchMovePan(o),this.update();break;case Ze.TOUCH_DOLLY_PAN:if(this.enableZoom===!1&&this.enablePan===!1)return;this._handleTouchMoveDollyPan(o),this.update();break;case Ze.TOUCH_DOLLY_ROTATE:if(this.enableZoom===!1&&this.enableRotate===!1)return;this._handleTouchMoveDollyRotate(o),this.update();break;default:this.state=Ze.NONE}}function m3(o){this.enabled!==!1&&o.preventDefault()}function g3(o){o.key==="Control"&&(this._controlActive=!0,this.domElement.getRootNode().addEventListener("keyup",this._interceptControlUp,{passive:!0,capture:!0}))}function _3(o){o.key==="Control"&&(this._controlActive=!1,this.domElement.getRootNode().removeEventListener("keyup",this._interceptControlUp,{passive:!0,capture:!0}))}const v3="/assets/trak-tc820-machine-transparent-D7PwEI2F.png",x3=[{id:"monitor",label:"监控中心",icon:"⌁",badge:"实时"},{id:"diagnosis",label:"智能诊断",icon:"◇"},{id:"maintenance",label:"维修决策",icon:"▣"},{id:"workorder",label:"工单系统",icon:"□"},{id:"quality",label:"质检系统",icon:"✓"},{id:"report",label:"报告中心",icon:"≡"},{id:"rag",label:"RAG知识问答",icon:"?"},{id:"trace",label:"运行追踪",icon:"⋮"}],Hu=[{id:"TRAK-TC820LTYSI-001",name:"TRAK-TC820LTYSI-001",line:"A线 · 主加工单元",type:"数控车削中心",x:50,y:39,live:!0,image:v3}],BS={critical:"关键规则",threshold:"阈值规则",duration:"持续规则",count:"计数规则",trend:"趋势规则",multi_metric:"多指标规则"},FS={normal:"正常",warning:"预警",alarm:"报警",fault:"故障",running:"运行中",stopped:"已停止",offline:"离线"},S3={normal:"正常",initial:"初级预警",intermediate:"中级报警",high:"高级故障"},Qx={metric:"指标异常",temperature:"温度异常",vibration:"振动异常",alarm:"设备报警",status:"设备状态",trend:"趋势异常",multi_metric:"多指标联合异常"},nm={idle:"等待异常",running:"分析中",completed:"已完成",fallback:"备用诊断",failed:"执行失败"},y3={get_alarm_definition:"报警定义库"},im={open:"待处理",in_progress:"处理中",completed:"已完成",closed:"已关闭"},Jx=["主轴温度过高怎么检查？","报警 ALM-1001 的处理步骤是什么？","振动异常时应该优先排查哪些部件？"],M3=["执行设备断电和挂牌上锁","检查冷却液液位、流量和冷却泵","空载运行并复测主轴温度"],E3={closed:"已关闭",open:"已打开",locked:"已锁定",unlocked:"未锁定",released:"已释放",pressed:"已按下",running:"运行中",stopped:"已停止",ready:"已就绪",clamped:"已夹紧",referenced:"已回零",inhibited:"已禁止",overtemperature:"温度过高",pressure_low:"压力不足",rotation_timeout:"旋转超时",clamp_pressure_low:"夹紧压力不足",not_in_position:"未到位",movement_error:"动作异常",alarm:"报警",overload:"过载",high_pressure_low:"高压不足",vibration_high:"振动过高"};async function Mi(o,e={}){const i=await fetch(o,{cache:"no-store",headers:{"Content-Type":"application/json"},...e}),s=await i.json();if(!i.ok)throw new Error(s.error||`请求失败：${i.status}`);return s}function Bl(o){if(!o)return"--";const e=new Date(o);return Number.isNaN(e.getTime())?o:e.toLocaleTimeString("zh-CN",{hour12:!1})}function Fi(o,e){return o[e]||e||"--"}function b3(o){return o==="fault"?"fault":o==="alarm"?"alarm":o==="warning"?"warning":"normal"}function HS(o){return o==="high"?"fault":o==="intermediate"?"alarm":o==="initial"?"warning":"normal"}function T3(o){return o.kind==="multi_metric"?Qx.multi_metric:o.label||Qx[o.kind]||o.kind||"监测项"}function A3(){const[o,e]=Ve.useState(null),[i,s]=Ve.useState("");async function l(){try{e(await Mi("/api/monitor/snapshot")),s("")}catch(d){s(d.message)}}Ve.useEffect(()=>{l();const d=window.setInterval(l,1e3);return()=>window.clearInterval(d)},[]);async function f(d){try{e(await Mi("/api/monitor/control",{method:"POST",body:JSON.stringify({action:d})})),s("")}catch(m){s(m.message)}}async function h(){try{e(await Mi("/api/monitor/reset",{method:"POST",body:"{}"})),s("")}catch(d){s(d.message)}}return{snapshot:o,error:i,control:f,resetStats:h}}function R3(){const[o,e]=Ve.useState("monitor"),[i,s]=Ve.useState(Hu[0].id),{snapshot:l,error:f,control:h,resetStats:d}=A3(),m=l?.runner||{},p=l?.latest_result,S=p?.current_sample,_=S?.health_score===null||S?.health_score===void 0?"--":`${Number(S.health_score).toFixed(0)} / 100`,v=f||m.last_error?"接口异常":"连接正常";return b.jsxs("div",{className:"platform-shell",children:[b.jsx(w3,{activeView:o,onChange:e,connectionText:v,hasError:!!(f||m.last_error)}),b.jsxs("main",{className:"app-shell",children:[b.jsx(C3,{snapshot:l,runner:m,onControl:h,onReset:d}),o==="monitor"&&b.jsx(N3,{snapshot:l,result:p,sample:S,runner:m,healthText:_,selectedMachineId:i,onSelectMachine:s}),o==="diagnosis"&&b.jsx(W3,{snapshot:l}),o==="maintenance"&&b.jsx(q3,{snapshot:l}),o==="workorder"&&b.jsx(Z3,{snapshot:l,sample:S}),o==="rag"&&b.jsx(Q3,{snapshot:l,sample:S}),o==="quality"&&b.jsx(J3,{snapshot:l,sample:S}),o==="report"&&b.jsx(Y3,{snapshot:l}),o==="trace"&&b.jsx(j3,{snapshot:l}),(f||m.last_error)&&b.jsx("footer",{className:"error-bar",children:f||m.last_error})]})]})}function w3({activeView:o,onChange:e,connectionText:i,hasError:s}){return b.jsxs("aside",{className:"sidebar","aria-label":"平台导航",children:[b.jsxs("div",{className:"brand-block",children:[b.jsx("span",{className:"brand-mark",children:"IA"}),b.jsxs("div",{children:[b.jsx("strong",{children:"IND-Agent"}),b.jsx("span",{children:"工业智能平台"})]})]}),b.jsx("nav",{className:"side-nav",children:x3.map(l=>b.jsxs("button",{className:`nav-item ${o===l.id?"active":""}`,type:"button",onClick:()=>e(l.id),children:[b.jsx("span",{className:"nav-icon",children:l.icon}),b.jsx("span",{children:l.label}),l.badge&&b.jsx("em",{children:l.badge})]},l.id))}),b.jsxs("div",{className:"sidebar-card",children:[b.jsx("span",{children:"平台状态"}),b.jsx("strong",{className:s?"bad":"",children:i}),b.jsx("p",{children:"监控服务、诊断智能体和知识工具将统一汇入平台工作台。"})]})]})}function C3({snapshot:o,runner:e,onControl:i,onReset:s}){const l=`数据源：${o?.data_source||"设备数据源"} · ${o?.device_id||"--"} · 在线监测`;return b.jsxs("header",{className:"topbar",children:[b.jsxs("div",{children:[b.jsx("span",{className:"eyebrow",children:"工业运营中台"}),b.jsx("h1",{children:"智能制造统一工作台"}),b.jsx("p",{className:"subline",children:l})]}),b.jsxs("div",{className:"toolbar",children:[b.jsxs("label",{className:"switch-control",title:"开启或暂停自动监测",children:[b.jsx("input",{type:"checkbox",checked:!!e.enabled,onChange:f=>i(f.target.checked?"on":"off")}),b.jsx("span",{className:"switch-track",children:b.jsx("span",{className:"switch-thumb"})}),b.jsx("span",{children:e.enabled?"监测开启":"监测暂停"})]}),b.jsx("button",{className:"button",type:"button",onClick:s,children:"归零统计"})]})]})}function N3({snapshot:o,result:e,sample:i,runner:s,healthText:l,selectedMachineId:f,onSelectMachine:h}){const d=Hu.find(p=>p.id===f)||Hu[0],m=d.live;return b.jsxs("section",{className:"workspace-view active",children:[b.jsx(D3,{machines:Hu,selectedMachineId:d.id,result:e,sample:i,healthText:l,onSelectMachine:h}),b.jsx(O3,{machine:d,isLiveMachine:m,sample:i,result:e,healthText:l}),m?b.jsxs(b.Fragment,{children:[b.jsx(P3,{snapshot:o,sample:i,runner:s,healthText:l}),b.jsxs("section",{className:"main-grid",children:[b.jsx(I3,{result:e,sample:i}),b.jsx(H3,{snapshot:o,result:e})]}),b.jsxs("section",{className:"lower-grid",children:[b.jsx(V3,{snapshot:o}),b.jsx(k3,{snapshot:o})]})]}):b.jsxs("section",{className:"panel machine-empty-panel",children:[b.jsx("span",{className:"eyebrow",children:"设备详情"}),b.jsx("h2",{children:"该设备暂未接入实时采集"}),b.jsx("p",{children:"后续接入多设备监控接口后，这里会展示该机器的实时指标、规则判定和诊断结果。"})]})]})}function D3({machines:o,selectedMachineId:e,result:i,sample:s,healthText:l,onSelectMachine:f}){const h=i?.status&&i.status!=="normal"?1:0,d=o.find(p=>p.id===e)||o[0],m=GS(d,i);return b.jsxs("section",{className:"panel workshop-panel",children:[b.jsxs("div",{className:"factory-map","aria-label":"车间设备分布图",children:[b.jsx(U3,{status:m,onSelect:()=>f(d.id)}),b.jsxs("div",{className:"scene-overlay",children:[b.jsxs("div",{children:[b.jsx("span",{className:"eyebrow",children:"车间总览"}),b.jsx("h2",{children:"车间设备状态总览"})]}),b.jsxs("div",{className:"map-legend","aria-label":"状态图例",children:[b.jsxs("span",{children:[b.jsx("i",{className:"legend-dot normal"}),"正常"]}),b.jsxs("span",{children:[b.jsx("i",{className:"legend-dot warning"}),"预警"]}),b.jsxs("span",{children:[b.jsx("i",{className:"legend-dot fault"}),"故障"]})]})]}),b.jsxs("button",{type:"button",className:`scene-device-badge ${m}`,onClick:()=>f(d.id),"aria-label":`${d.name} ${am(m)}`,children:[b.jsx("strong",{children:d.name}),b.jsx("span",{children:am(m)})]}),b.jsx("div",{className:"scene-control-hint",children:"内部加工动画 · 拖动旋转 · 滚轮缩放"})]}),b.jsxs("div",{className:"map-summary",children:[b.jsxs("div",{children:[b.jsx("span",{children:"接入设备"}),b.jsx("strong",{children:"1 / 1"})]}),b.jsxs("div",{children:[b.jsx("span",{children:"当前工艺"}),b.jsx("strong",{children:"内部加工"})]}),b.jsxs("div",{children:[b.jsx("span",{children:"当前故障"}),b.jsx("strong",{children:h})]}),b.jsxs("div",{children:[b.jsx("span",{children:"毛坯入料"}),b.jsx("strong",{children:"棒料"})]}),b.jsxs("div",{children:[b.jsx("span",{children:"成品出料"}),b.jsx("strong",{children:"轴套件"})]})]})]})}function GS(o,e){return o.live?e?.status==="fault"?"fault":e?.status==="alarm"?"alarm":e?.status==="warning"?"warning":"normal":"idle"}function am(o){return o==="fault"?"故障":o==="alarm"?"报警":o==="warning"?"预警":o==="idle"?"未接入":"正常"}function U3({status:o,onSelect:e}){const i=Ve.useRef(null),s=Ve.useRef(e);return Ve.useEffect(()=>{s.current=e},[e]),Ve.useEffect(()=>{const l=i.current;if(!l)return;const f=new Ub;f.fog=new gm(15988468,14,32);const h=new Si(36,l.clientWidth/l.clientHeight,.1,100);h.position.set(7.8,4.6,8.8),h.lookAt(0,.75,0);const d=new i3({antialias:!0,alpha:!0,preserveDrawingBuffer:!0});d.setPixelRatio(Math.min(window.devicePixelRatio,2)),d.setSize(l.clientWidth,l.clientHeight),d.shadowMap.enabled=!0,d.shadowMap.type=wl,l.appendChild(d.domElement);const m=new s3(h,d.domElement);m.target.set(0,.75,0),m.enableDamping=!0,m.dampingFactor=.08,m.minDistance=6.2,m.maxDistance=15.5,m.minPolarAngle=Math.PI*.16,m.maxPolarAngle=Math.PI*.49,m.enablePan=!0,m.panSpeed=.55,m.rotateSpeed=.55,m.zoomSpeed=.72,m.update();const p=L3(o),S=new mn({color:15002858,roughness:.84,metalness:.02}),_=new mn({color:12899280,roughness:.78,metalness:.01}),v=new mn({color:14741998,roughness:.82,metalness:.02,transparent:!0,opacity:.58}),M=new mn({color:14148063,roughness:.86,metalness:.02,transparent:!0,opacity:.72}),A=new mn({color:14262811,roughness:.58,metalness:.04}),N=new mn({color:4214871,roughness:.6,metalness:.18}),y=new mn({color:p,roughness:.42,metalness:.1,emissive:p,emissiveIntensity:.12,transparent:!0,opacity:.82}),x=new mn({color:6582647,roughness:.72,metalness:.08}),U=new mn({color:2831160,roughness:.75,metalness:.05}),F=new mn({color:6910328,roughness:.62,metalness:.18,transparent:!0,opacity:.64}),C=new mn({color:6910328,roughness:.62,metalness:.18}),D=new mn({color:2238253,roughness:.7,metalness:.2,transparent:!0,opacity:.86}),L=new mn({color:12172994,roughness:.55,metalness:.12,transparent:!0,opacity:.68}),I=new mn({color:9417916,roughness:.2,metalness:.04,transparent:!0,opacity:.24,side:Ii}),T=new mn({color:p,roughness:.42,metalness:.12,emissive:p,emissiveIntensity:.08}),O=new mn({color:p,transparent:!0,opacity:.45,roughness:.6,metalness:.05,side:Ii}),G=new mn({color:9805989,roughness:.52,metalness:.28}),k=new mn({color:4805722,roughness:.36,metalness:.45}),Q=new mn({color:12026410,roughness:.42,metalness:.22,emissive:3810048,emissiveIntensity:.05}),st=new mn({color:13357783,roughness:.32,metalness:.72}),Y=new mn({color:4345945,roughness:.28,metalness:.78}),tt=new mn({color:13673276,roughness:.5,metalness:.38,emissive:5912576,emissiveIntensity:.06}),q=new Sm({color:2503224,transparent:!0,opacity:.42}),j=new vm({color:p,transparent:!0,opacity:.22,side:Ii,depthWrite:!1}),dt=new ze(new vo(26,16),S);dt.rotation.x=-Math.PI/2,dt.position.y=-.36,dt.receiveShadow=!0,f.add(dt);const ut=new aT(26,26,10401974,13359575);ut.position.y=-.34,f.add(ut);const rt=(mt,wt,yt,At=[0,0,0])=>{const Lt=new ze(new xi(...mt),yt);return Lt.position.set(...wt),Lt.rotation.set(...At),Lt.castShadow=!0,Lt.receiveShadow=!0,f.add(Lt),Lt};rt([26,2.6,.08],[0,.92,-7.2],M),rt([.08,2.25,12.5],[-12.3,.78,-.6],M),rt([.08,2.25,12.5],[12.3,.78,-.6],M),rt([24,.08,.12],[0,2.32,-6.95],U),rt([.12,.08,12],[-11.5,2.16,-.8],U),rt([.12,.08,12],[11.5,2.16,-.8],U),rt([20,.035,1.45],[0,-.31,3.25],_),rt([1.5,.035,10.5],[-5.2,-.3,-.9],_),rt([6.6,.045,3.8],[0,-.28,.05],v),rt([6.8,.03,.08],[0,-.235,2],A),rt([6.8,.03,.08],[0,-.235,-1.95],A),rt([.08,.03,3.95],[-3.4,-.235,.02],A),rt([.08,.03,3.95],[3.4,-.235,.02],A);const Tt=(mt,wt,yt=[0,0,0])=>{rt(mt,wt,N,yt),rt([mt[0],.035,.08],[wt[0],wt[1]+.06,wt[2]-mt[2]/2],y,yt),rt([mt[0],.035,.08],[wt[0],wt[1]+.06,wt[2]+mt[2]/2],y,yt)};Tt([3.25,.13,.52],[-4.35,-.08,1.05]),Tt([3.35,.13,.52],[4.35,-.08,1.05]);for(let mt=0;mt<7;mt+=1){const wt=new ze(new Kn(.045,.045,.62,16),k);wt.position.set(-5.75+mt*.46,.03,1.05),wt.rotation.x=Math.PI/2,f.add(wt);const yt=wt.clone();yt.material=k,yt.position.x=3+mt*.46,f.add(yt)}rt([1.45,.42,.75],[-6.15,-.08,-4.95],x),rt([1.55,.13,.85],[-6.15,.22,-4.95],U),rt([1.35,.38,.72],[6.05,-.08,-4.8],x),rt([1.45,.12,.82],[6.05,.18,-4.8],U);for(let mt=0;mt<10;mt+=1){const wt=mt%2===0?-10.8:10.8,yt=-5.7+Math.floor(mt/2)*2.8,At=new ze(new Kn(.06,.06,2.6,12),x);At.position.set(wt,.92,yt),At.castShadow=!0,f.add(At)}const Gt=new da;Gt.position.set(.05,-.1,-.08),Gt.rotation.y=-.28,Gt.scale.set(.82,.82,.82),f.add(Gt);const Ot=(mt,wt,yt,At,Lt=[0,0,0])=>{const Qt=new ze(new xi(...wt),At);Qt.name=mt,Qt.position.set(...yt),Qt.rotation.set(...Lt),Qt.castShadow=!0,Qt.receiveShadow=!0,Gt.add(Qt);const ae=new ES(new Xb(Qt.geometry),q);return ae.position.copy(Qt.position),ae.rotation.copy(Qt.rotation),ae.scale.copy(Qt.scale),Gt.add(ae),Qt};Ot("machine-base",[4.65,.52,1.68],[0,.28,0],D),Ot("left-headstock-cabinet",[1.08,1.88,1.66],[-1.78,1.4,0],D),Ot("transparent-main-shell",[3.35,1.78,1.58],[-.15,1.4,0],F),Ot("rear-column",[.45,1.95,1.58],[-2.2,1.44,0],C),Ot("front-glass-door",[1.78,1.22,.06],[-.72,1.42,.84],I),Ot("right-slanted-cover",[.86,1.56,1.5],[1.32,1.38,.04],F,[0,0,-.18]),Ot("control-panel",[.45,1.22,.18],[1.98,1.5,.78],D,[0,0,-.24]),Ot("top-service-rail",[3.12,.16,1.34],[-.24,2.28,0],D),Ot("status-strip",[1.82,.06,.08],[-.42,2.39,.7],T),Ot("chip-conveyor-neck",[1.12,.28,.34],[2.38,1,.22],D,[0,0,.4]),Ot("chip-bin",[.7,.58,.7],[3,.76,.22],F),Ot("front-service-panel",[2.68,.5,.08],[-.36,.58,.86],L),Ot("left-foot",[.25,.5,.22],[-1.85,-.02,.56],D),Ot("right-foot",[.25,.5,.22],[1.55,-.02,.56],D),Ot("inner-bed",[2.45,.18,.46],[-.35,1.02,.4],G),Ot("linear-guide-left",[2.35,.055,.055],[-.32,1.16,.22],k),Ot("linear-guide-right",[2.35,.055,.055],[-.32,1.16,.58],k),Ot("tailstock-shadow",[.42,.44,.5],[.9,1.26,.38],G);const B=new da;B.name="spindleChuck",B.position.set(-1.12,1.36,.78),Gt.add(B);const _t=new ze(new Kn(.29,.29,.22,48),k);_t.rotation.z=Math.PI/2,_t.castShadow=!0,B.add(_t);const Dt=new ze(new Kn(.22,.22,.04,48),T);Dt.position.x=.13,Dt.rotation.z=Math.PI/2,B.add(Dt);for(let mt=0;mt<3;mt+=1){const wt=mt*(Math.PI*2/3),yt=new ze(new xi(.16,.06,.24),Y);yt.position.set(.17,Math.cos(wt)*.16,Math.sin(wt)*.16),yt.rotation.x=wt,yt.castShadow=!0,B.add(yt)}const Z=new ze(new Kn(.13,.13,.88,48),st);Z.name="machiningWorkpiece",Z.position.x=.48,Z.rotation.z=Math.PI/2,Z.castShadow=!0,B.add(Z);const ft=new da;ft.name="toolSlide",ft.position.set(.32,1.27,.55),Gt.add(ft);const Ct=new ze(new xi(.56,.34,.42),G);Ct.castShadow=!0,ft.add(Ct);const Pt=new ze(new Kn(.22,.22,.25,8),k);Pt.rotation.x=Math.PI/2,Pt.position.set(-.05,.08,.24),Pt.castShadow=!0,ft.add(Pt);const vt=new ze(new Mm(.06,.34,4),Y);vt.name="cutterTip",vt.position.set(-.33,.08,.24),vt.rotation.z=Math.PI/2,vt.rotation.y=Math.PI/4,vt.castShadow=!0,ft.add(vt);const Ut=new tT(16760922,.9,1.3);Ut.name="cuttingGlow",Ut.position.set(-.45,.08,.24),ft.add(Ut);const be=new da;be.name="loadingArm",be.position.set(-2.02,1.62,.62),Gt.add(be);const ue=new ze(new xi(.08,.72,.08),k);ue.castShadow=!0,be.add(ue);const pe=new ze(new xi(.08,.08,.38),Y);pe.position.set(.18,-.33,.12),be.add(pe);const _e=pe.clone();_e.position.z=-.12,be.add(_e);const ee=new ze(new Kn(.08,.08,.25,24),T);ee.position.set(-1.72,2.68,0),ee.castShadow=!0,Gt.add(ee);const ne=new ze(new vo(4.8,2.7),j);ne.position.set(-2.05,1.28,.02),ne.rotation.y=Math.PI/2,Gt.add(ne);const Be=mt=>{const wt=new da;wt.userData.offset=mt,wt.name="rawBarStock";const yt=new ze(new Kn(.11,.11,.66,32),Q);yt.rotation.z=Math.PI/2,yt.castShadow=!0,wt.add(yt);const At=new ze(new Kn(.115,.115,.025,32),D);return At.position.x=-.35,At.rotation.z=Math.PI/2,wt.add(At),f.add(wt),wt},rn=mt=>{const wt=new da;wt.userData.offset=mt,wt.name="finishedParts";const yt=new ze(new Kn(.095,.095,.48,40),st);yt.rotation.z=Math.PI/2,yt.castShadow=!0,wt.add(yt);const At=new ze(new Kn(.14,.14,.14,40),st);At.position.x=-.16,At.rotation.z=Math.PI/2,At.castShadow=!0,wt.add(At);const Lt=new ze(new Kn(.042,.042,.5,24),D);return Lt.rotation.z=Math.PI/2,Lt.scale.set(1,1,1),wt.add(Lt),f.add(wt),wt},Pe=[Be(0),Be(.48)],$e=[rn(.1),rn(.62)],X=Array.from({length:18},(mt,wt)=>{const yt=new ze(new xi(.055,.018,.018),tt);return yt.userData.offset=wt/18,yt.castShadow=!0,Gt.add(yt),yt}),Ke=new ze(new ym(2.55,72),O);Ke.rotation.x=-Math.PI/2,Ke.position.set(.15,-.27,.15),Ke.receiveShadow=!0,f.add(Ke);const Ee=new ze(new xi(.22,1.45,.07),O);Ee.position.set(.8,1.62,-1.55),Ee.rotation.y=-.18,Ee.castShadow=!0,f.add(Ee);const P=new ze(new Em(.13,24,16),T);P.position.set(.8,2.42,-1.55),P.castShadow=!0,f.add(P);const E=new Jb(16777215,12109257,1.4);f.add(E);const et=new Ex(16777215,2.3);et.position.set(3,5,4),et.castShadow=!0,f.add(et);const at=new Ex(p,.9);at.position.set(-3,2.5,-2),f.add(at);let gt=0;const Nt=()=>{gt=window.requestAnimationFrame(Nt);const mt=performance.now()*.001,wt=(Math.sin(mt*1.05)+1)/2;B.rotation.x=mt*8.6,Z.rotation.x=mt*14,ft.position.x=.22+Math.sin(mt*.92)*.22,ft.position.z=.48+Math.sin(mt*1.45)*.08,Pt.rotation.z=mt*.65,Ut.intensity=.45+Math.abs(Math.sin(mt*5.4))*.85,vt.material.emissive=new Me(16747818),vt.material.emissiveIntensity=.08+wt*.18,be.rotation.z=Math.sin(mt*1.2)*.18,ne.position.x=-2.1+mt*.35%4.2,ne.material.opacity=.12+Math.sin(mt*2.2)*.05,Pe.forEach(yt=>{const At=(mt*.16+yt.userData.offset)%1;yt.position.set(-5.78+At*2.45,.08,1.05),yt.rotation.x=mt*2.5}),$e.forEach(yt=>{const At=(mt*.15+yt.userData.offset)%1;yt.position.set(2.86+At*2.65,.08,1.05),yt.rotation.x=mt*3.4,yt.rotation.y=Math.sin(mt*1.6+yt.userData.offset)*.08}),X.forEach(yt=>{const At=(mt*1.4+yt.userData.offset)%1;yt.position.set(-.18+At*.7,1.35-At*.45+Math.sin(At*Math.PI*4)*.035,.8+At*.28),yt.rotation.set(mt*4+At,mt*2.3,At*6),yt.material.opacity=1-At*.7}),ee.material.emissiveIntensity=.12+Math.abs(Math.sin(mt*3.2))*.36,P.material.emissiveIntensity=.12+Math.abs(Math.sin(mt*3.2))*.36,m.update(),d.render(f,h)};Nt();const It=()=>{!l.clientWidth||!l.clientHeight||(h.aspect=l.clientWidth/l.clientHeight,h.updateProjectionMatrix(),d.setSize(l.clientWidth,l.clientHeight))},xt=new ResizeObserver(It);xt.observe(l);const St=()=>s.current();return d.domElement.addEventListener("click",St),()=>{window.cancelAnimationFrame(gt),xt.disconnect(),d.domElement.removeEventListener("click",St),l.removeChild(d.domElement),f.traverse(mt=>{mt.geometry&&mt.geometry.dispose(),mt.material&&(Array.isArray(mt.material)?mt.material.forEach(wt=>wt.dispose()):mt.material.dispose())}),m.dispose(),d.dispose()}},[o]),b.jsx("div",{ref:i,className:"machine-3d-canvas","aria-hidden":"true"})}function L3(o){return o==="fault"?12007218:o==="alarm"||o==="warning"?11954688:o==="idle"?8227987:556917}function O3({machine:o,isLiveMachine:e,sample:i,result:s,healthText:l}){const f=e?GS(o,s):"idle";return b.jsxs("section",{className:"machine-detail-header",children:[b.jsxs("div",{children:[b.jsx("span",{className:"eyebrow",children:"设备详情"}),b.jsxs("h2",{children:[o.name," · ",o.type]}),b.jsxs("p",{children:[o.line," · ",e&&i?.device_id||o.id]})]}),b.jsxs("div",{className:"machine-detail-stats",children:[b.jsxs("div",{children:[b.jsx("span",{children:"状态"}),b.jsx("strong",{className:f,children:am(f)})]}),b.jsxs("div",{children:[b.jsx("span",{children:"告警"}),b.jsx("strong",{children:e?i?.alarm_code||"无":"--"})]}),b.jsxs("div",{children:[b.jsx("span",{children:"健康度"}),b.jsx("strong",{children:e?l:"--"})]})]})]})}function P3({snapshot:o,sample:e,runner:i,healthText:s}){const l=[["监测状态",i.enabled?"开启":"暂停"],["设备状态",Fi(FS,e?.status)],["当前告警",e?.alarm_code||"无"],["采样次数",o?.result_count??"--"],["告警事件次数",o?.alarm_event_count??"--"],["Agent诊断任务",o?.diagnosis_task_count??"--"],["采样周期",i.interval_seconds?`${i.interval_seconds} 秒/次`:"--"],["整机健康度",s]];return b.jsx("section",{className:"status-strip","aria-label":"运行状态",children:l.map(([f,h])=>b.jsxs("div",{className:"status-item",children:[b.jsx("span",{children:f}),b.jsx("strong",{children:h})]},f))})}function I3({result:o,sample:e}){const i=Ve.useMemo(()=>z3(o,e),[o,e]);return b.jsxs("section",{className:"panel metrics-panel",children:[b.jsxs("div",{className:"panel-heading",children:[b.jsxs("div",{children:[b.jsx("span",{className:"eyebrow",children:"实时快照"}),b.jsx("h2",{children:"实时指标"})]}),b.jsx("span",{className:"muted",children:e?`最近采样 ${Bl(e.timestamp)}`:"等待采样"})]}),b.jsx("div",{className:"metrics-grid",children:i.map(s=>b.jsx(B3,{item:s,result:o},s.key))}),(e?.vibration===null||e?.vibration===void 0)&&b.jsx("div",{className:"notice",children:"当前设备数据源没有提供振动字段，振动不会被其他指标替代；其他设备指标仍会继续监测。"}),b.jsxs("div",{className:"subsection-heading",children:[b.jsx("span",{className:"eyebrow",children:"设备联锁与执行部件"}),b.jsx("strong",{children:"整机状态"})]}),b.jsx(F3,{sample:e})]})}function z3(o,e){const i=e?.metrics||{},s=e?.metric_details||{},l=Object.entries(s).map(([f,h])=>({key:f,name:h.label||f,group:h.group||"整机",value:i[f],unit:h.unit||"",normalRange:h.normal_range}));return l.length?l:[{key:"temperature",name:"温度",group:"主轴",value:e?.temperature,unit:"C"},{key:"vibration",name:"振动",group:"主轴",value:e?.vibration,unit:"mm/s"},{key:"rpm",name:"转速",group:"主轴",value:e?.rpm,unit:"rpm"}]}function B3({item:o,result:e}){const i=e?.observations?.find(h=>h.key===`metric:${o.key}`||h.key===o.key||o.key==="spindle_temperature_c"&&h.key==="temperature"||o.key==="spindle_vibration_rms"&&h.key==="vibration"),s=HS(i?.alert_level),l=o.value===null||o.value===void 0?"未提供":`${Number(o.value).toFixed(1)}`,f=o.normalRange?`正常 ${o.normalRange[0]} - ${o.normalRange[1]}`:"";return b.jsxs("div",{className:`metric ${s}`,children:[b.jsx("span",{className:"metric-group",children:o.group}),b.jsx("span",{className:"metric-name",children:o.name}),b.jsx("strong",{className:"metric-value",children:l}),b.jsxs("span",{className:"metric-unit",children:[o.unit," ",f]})]})}function F3({sample:o}){const e=Object.values(o?.equipment_states||{});return e.length?b.jsx("div",{className:"equipment-grid",children:e.map((i,s)=>b.jsxs("div",{className:`equipment-state ${i.is_normal?"normal":"fault"}`,children:[b.jsx("span",{children:i.label||"设备状态"}),b.jsx("strong",{children:Fi(E3,i.value)})]},`${i.label||"state"}-${s}`))}):b.jsx("div",{className:"equipment-grid",children:b.jsx("div",{className:"empty-state",children:"当前接口没有提供离散设备状态"})})}function H3({result:o}){const e=o?.status||"normal";return b.jsxs("section",{className:"panel decision-panel",children:[b.jsxs("div",{className:"panel-heading",children:[b.jsxs("div",{children:[b.jsx("span",{className:"eyebrow",children:"监测判定"}),b.jsx("h2",{children:"规则引擎"})]}),b.jsx("span",{className:`severity-pill ${b3(e)}`,children:Fi(FS,e)})]}),b.jsx(G3,{observations:o?.observations||[]}),b.jsxs("div",{className:"threshold-note",children:[b.jsx("span",{children:"触发条件"}),b.jsx("strong",{children:"关键故障立即触发；普通指标阈值+5秒；间歇故障5分钟内3次；趋势/联合异常"})]})]})}function G3({observations:o}){return o.length?b.jsx("div",{className:"observation-list",children:o.map((e,i)=>{const s=HS(e.alert_level);return b.jsxs("div",{className:"observation",children:[b.jsx("span",{className:`observation-dot ${s}`}),b.jsxs("div",{children:[b.jsxs("div",{className:"observation-title",children:[Fi(BS,e.rule_type)," · ",T3(e),"：",e.value]}),b.jsxs("div",{className:"observation-meta",children:[e.message," · 阈值 ",e.threshold??"-"," ",e.unit||""]})]}),b.jsx("span",{className:"observation-level",children:Fi(S3,e.alert_level)})]},`${e.key||e.kind}-${i}`)})}):b.jsx("div",{className:"observation-list",children:b.jsx("div",{className:"empty-state",children:"当前没有检测到异常"})})}function V3({snapshot:o}){const e=o?.trigger_history||[];return b.jsxs("section",{className:"panel trigger-panel",children:[b.jsxs("div",{className:"panel-heading",children:[b.jsxs("div",{children:[b.jsx("span",{className:"eyebrow",children:"诊断移交"}),b.jsx("h2",{children:"诊断触发记录"})]}),b.jsx("span",{className:"muted",children:"只记录监测器已确认的触发事件"})]}),b.jsxs("div",{className:"trigger-list",children:[!e.length&&b.jsx("div",{className:"empty-state",children:"暂无触发记录"}),e.map((i,s)=>b.jsxs("div",{className:"trigger-row",children:[b.jsx("span",{className:"trigger-time",children:Bl(i.triggered_at)}),b.jsx("span",{className:"trigger-device",children:i.device_id}),b.jsx("span",{className:"trigger-rules",children:i.event_id||i.abnormal_event?.event_id||"--"}),b.jsxs("span",{className:"trigger-reason",children:[i.trigger_cause||"首次确认异常"," · ",i.task_id||"--"," · ",(i.rule_types||[]).map(l=>BS[l]||l).join("、")]})]},`${i.task_id||i.event_id||s}`))]})]})}function k3({snapshot:o}){const e=o?.diagnosis?.latest||{},i=e.status||"idle",s=i==="failed"?"fault":i==="fallback"?"warning":"normal";return b.jsxs("section",{className:"panel diagnosis-panel",children:[b.jsxs("div",{className:"panel-heading",children:[b.jsxs("div",{children:[b.jsx("span",{className:"eyebrow",children:"智能诊断"}),b.jsx("h2",{children:"诊断结果"})]}),b.jsx("span",{className:`severity-pill ${s}`,children:Fi(nm,i)})]}),b.jsx(X3,{latest:e})]})}function X3({latest:o}){if(!o||o.status==="idle")return b.jsx("div",{className:"diagnosis-result",children:b.jsx("div",{className:"empty-state",children:"满足触发条件后自动生成诊断结果"})});const e=o.confidence===null||o.confidence===void 0?"--":`${(Number(o.confidence)*100).toFixed(0)}%`,i=o.alarm_definition||{},s=(o.tool_calls||[]).map(f=>Fi(y3,f.name)).join("、")||"等待诊断依据",l=[["设备",o.device_id||"--"],["诊断任务",o.task_id||"--"],["异常事件",o.event_id||"--"],["事件轮次",`第 ${o.event_revision||1} 次`],["触发时间",Bl(o.triggered_at)],["报警定义",i.name||"未查询到"],["置信度",e],["诊断依据",s]];return b.jsxs("div",{className:"diagnosis-result",children:[b.jsx("div",{className:"diagnosis-summary",children:o.summary||"正在生成诊断结果"}),b.jsx("div",{className:"diagnosis-grid",children:l.map(([f,h])=>b.jsxs("div",{children:[b.jsx("span",{children:f}),b.jsx("strong",{children:h})]},f))}),b.jsxs("div",{className:"diagnosis-detail",children:[b.jsx("span",{children:"诊断说明"}),b.jsx("p",{children:o.diagnosis||"暂无详细诊断"})]}),o.error&&b.jsx("div",{className:"diagnosis-error",children:o.error})]})}function $u({snapshot:o}){return o?.diagnosis?.pipeline||{}}function W3({snapshot:o}){const e=o?.diagnosis?.latest||{},s=$u({snapshot:o}).knowledge||{},l=e.tool_calls||[];return b.jsxs("section",{className:"workspace-view active module-board","aria-label":"智能诊断中心",children:[b.jsx(cr,{eyebrow:"Diagnosis Agent",title:"智能诊断中心",text:"查看异常事件、诊断结论、报警定义、历史证据和知识检索结果。"}),b.jsxs("div",{className:"module-grid",children:[b.jsx(_n,{label:"诊断状态",value:Fi(nm,e.status),text:e.diagnosis_run_id||"等待异常任务"}),b.jsx(_n,{label:"置信度",value:e.confidence==null?"--":`${(Number(e.confidence)*100).toFixed(0)}%`,text:e.event_id||"暂无异常事件"}),b.jsx(_n,{label:"知识证据",value:(s.documents||[]).length,text:s.source||"A2A / RAG"})]}),b.jsxs("div",{className:"ops-grid",children:[b.jsxs("section",{className:"panel module-panel",children:[b.jsxs("div",{className:"panel-heading",children:[b.jsxs("div",{children:[b.jsx("span",{className:"eyebrow",children:"最终诊断"}),b.jsx("h2",{children:e.summary||"等待异常事件"})]}),b.jsx("span",{className:`severity-pill ${e.status==="failed"?"fault":"normal"}`,children:Fi(nm,e.status)})]}),b.jsxs("div",{className:"detail-grid",children:[b.jsx(Bi,{label:"设备",value:e.device_id}),b.jsx(Bi,{label:"异常事件",value:e.event_id}),b.jsx(Bi,{label:"事件轮次",value:e.event_revision?`第 ${e.event_revision} 次`:"--"}),b.jsx(Bi,{label:"触发原因",value:e.trigger_cause})]}),b.jsxs("div",{className:"diagnosis-detail",children:[b.jsx("span",{children:"诊断说明"}),b.jsx("p",{children:e.diagnosis||"暂无诊断说明"})]}),e.recommendation&&b.jsxs("div",{className:"diagnosis-detail",children:[b.jsx("span",{children:"下一步建议"}),b.jsx("p",{children:e.recommendation})]})]}),b.jsxs("section",{className:"panel module-panel",children:[b.jsx("div",{className:"panel-heading",children:b.jsxs("div",{children:[b.jsx("span",{className:"eyebrow",children:"工具证据"}),b.jsx("h2",{children:"Reason · Act · Observe"})]})}),b.jsx(wm,{items:l.map(f=>({event:f.name,agent:"Diagnosis Agent",tool:f.name,arguments:f.arguments}))}),b.jsx(VS,{documents:s.documents||[]})]})]})]})}function q3({snapshot:o}){const e=$u({snapshot:o}),i=e.maintenance_plan||{},s=i.diagnosis||e.diagnosis||{};return b.jsxs("section",{className:"workspace-view active module-board","aria-label":"维修决策中心",children:[b.jsx(cr,{eyebrow:"Maintenance Agent",title:"维修决策中心",text:"将诊断结果、RAG知识和CAD/BOM部件信息汇总为可执行维修方案。"}),b.jsxs("div",{className:"module-grid",children:[b.jsx(_n,{label:"方案编号",value:i.plan_id||"--",text:s.fault||s.summary||"等待诊断"}),b.jsx(_n,{label:"预计用时",value:i.estimated_time||"--",text:"Maintenance Agent 估算"}),b.jsx(_n,{label:"关联部件",value:(i.cad_components||[]).length,text:"来自 CAD / BOM 查询"})]}),b.jsxs("div",{className:"ops-grid",children:[b.jsxs("section",{className:"panel module-panel",children:[b.jsx("div",{className:"panel-heading",children:b.jsxs("div",{children:[b.jsx("span",{className:"eyebrow",children:"维修步骤"}),b.jsx("h2",{children:"执行清单"})]})}),b.jsx(Rm,{steps:i.repair_steps||[]})]}),b.jsxs("section",{className:"panel module-panel",children:[b.jsx("div",{className:"panel-heading",children:b.jsxs("div",{children:[b.jsx("span",{className:"eyebrow",children:"安全与资源"}),b.jsx("h2",{children:"工器具、备件和安全要求"})]})}),b.jsxs("div",{className:"detail-grid",children:[b.jsx(Bi,{label:"工器具",value:(i.tools||[]).join("、")}),b.jsx(Bi,{label:"备件",value:(i.parts||[]).join("、")}),b.jsx(Bi,{label:"安全要求",value:(i.safety||[]).join("；")}),b.jsx(Bi,{label:"知识来源",value:(i.source_documents||[]).join("、")})]})]})]})]})}function Y3({snapshot:o}){const i=$u({snapshot:o}).report||{},s=i.sections||{};return b.jsxs("section",{className:"workspace-view active module-board","aria-label":"报告中心",children:[b.jsx(cr,{eyebrow:"Report Agent",title:"报告中心",text:"汇总诊断、维修方案、工单和质检结果，形成可追溯运维报告。"}),b.jsxs("div",{className:"module-grid",children:[b.jsx(_n,{label:"报告编号",value:i.report_id||"--",text:i.report_type||"maintenance"}),b.jsx(_n,{label:"报告标题",value:i.title||"--",text:i.created_at?Bl(i.created_at):"等待生成"}),b.jsx(_n,{label:"质量状态",value:s.quality?.passed==null?"--":s.quality.passed?"通过":"未通过",text:"Quality Agent"})]}),b.jsxs("section",{className:"panel module-panel report-panel",children:[b.jsx("div",{className:"panel-heading",children:b.jsxs("div",{children:[b.jsx("span",{className:"eyebrow",children:"报告摘要"}),b.jsx("h2",{children:i.title||"暂无报告"})]})}),b.jsx("p",{className:"answer-summary",children:i.summary||"完成一次异常闭环后，将在此展示诊断报告、维修报告和质检报告内容。"}),b.jsx(kS,{value:s})]})]})}function j3({snapshot:o}){const e=$u({snapshot:o}),i=e.trace||[];return b.jsxs("section",{className:"workspace-view active module-board","aria-label":"AI运行追踪",children:[b.jsx(cr,{eyebrow:"Agent Runtime",title:"AI运行追踪",text:"观察 Router、Harness、Agent、Tool、MCP 和 Experience 的调用链。"}),b.jsxs("div",{className:"module-grid",children:[b.jsx(_n,{label:"Trace记录",value:i.length,text:e.trace_id||"当前异常流程"}),b.jsx(_n,{label:"Agent事件",value:i.filter(s=>s.agent).length,text:"生命周期记录"}),b.jsx(_n,{label:"Tool事件",value:i.filter(s=>s.tool).length,text:"MCP工具调用记录"})]}),b.jsxs("section",{className:"panel module-panel",children:[b.jsx("div",{className:"panel-heading",children:b.jsxs("div",{children:[b.jsx("span",{className:"eyebrow",children:"调用链"}),b.jsx("h2",{children:"Trace Timeline"})]})}),b.jsx(wm,{items:i})]})]})}function Z3({snapshot:o,sample:e}){const[i,s]=Ve.useState([]),[l,f]=Ve.useState(""),[h,d]=Ve.useState("维修一组"),[m,p]=Ve.useState(""),[S,_]=Ve.useState(!1),v=o?.diagnosis?.latest||{},M=i.find(x=>x.workorder_id===l)||i[0];async function A(){try{const U=(await Mi("/api/workorders")).items||[];s(U),!l&&U.length&&f(U[0].workorder_id),p("")}catch(x){p(x.message)}}Ve.useEffect(()=>{A()},[]);async function N(){_(!0);try{const x=v.summary||v.fault||`${e?.device_id||o?.device_id||"unknown"} 设备维修`,U=await Mi("/api/workorders",{method:"POST",body:JSON.stringify({device_id:e?.device_id||o?.device_id||"unknown",title:x,steps:v.recommendation?[v.recommendation]:M3,assignee:h})});await A(),f(U.workorder_id),p("")}catch(x){p(x.message)}finally{_(!1)}}async function y(x){if(M){_(!0);try{const U=x==="closed"?"close":"update",F=await Mi(`/api/workorders/${M.workorder_id}/action`,{method:"POST",body:JSON.stringify({action:U,status:x,assignee:h})});s(C=>C.map(D=>D.workorder_id===F.workorder_id?F:D)),p("")}catch(U){p(U.message)}finally{_(!1)}}}return b.jsxs("section",{className:"workspace-view active module-board","aria-label":"工单系统",children:[b.jsx(cr,{eyebrow:"MES 工单系统",title:"维修工单闭环",text:"把诊断结果转成维修任务，跟踪处理人、步骤和状态，并为质检验收提供入口。"}),b.jsxs("div",{className:"module-grid",children:[b.jsx(_n,{label:"当前工单",value:i.length,text:"Agent Service 内存工单池"}),b.jsx(_n,{label:"选中状态",value:Fi(im,M?.status),text:M?.workorder_id||"暂无工单"}),b.jsx(_n,{label:"关联设备",value:M?.device_id||e?.device_id||o?.device_id||"--",text:"来自实时监测上下文"})]}),b.jsxs("div",{className:"ops-grid",children:[b.jsxs("section",{className:"panel module-panel",children:[b.jsxs("div",{className:"panel-heading",children:[b.jsxs("div",{children:[b.jsx("span",{className:"eyebrow",children:"创建工单"}),b.jsx("h2",{children:"诊断转派"})]}),b.jsx("span",{className:"muted",children:v.summary||"可先创建演示工单"})]}),b.jsxs("div",{className:"form-row",children:[b.jsxs("label",{children:["处理人",b.jsx("input",{value:h,onChange:x=>d(x.target.value)})]}),b.jsx("button",{className:"button primary",type:"button",disabled:S,onClick:N,children:S?"处理中":"创建工单"})]}),m&&b.jsx("div",{className:"inline-error",children:m})]}),b.jsxs("section",{className:"panel module-panel",children:[b.jsxs("div",{className:"panel-heading",children:[b.jsxs("div",{children:[b.jsx("span",{className:"eyebrow",children:"工单列表"}),b.jsx("h2",{children:"任务队列"})]}),b.jsx("button",{className:"button",type:"button",onClick:A,children:"刷新"})]}),b.jsxs("div",{className:"order-list",children:[!i.length&&b.jsx("div",{className:"empty-state",children:"暂无工单，点击创建工单生成第一条任务"}),i.map(x=>b.jsxs("button",{type:"button",className:`order-row ${x.workorder_id===M?.workorder_id?"active":""}`,onClick:()=>f(x.workorder_id),children:[b.jsxs("span",{children:[b.jsx("strong",{children:x.title}),b.jsx("em",{children:x.workorder_id})]}),b.jsx("b",{children:Fi(im,x.status)})]},x.workorder_id))]})]})]}),b.jsx(K3,{order:M,busy:S,onUpdate:y})]})}function K3({order:o,busy:e,onUpdate:i}){return o?b.jsxs("section",{className:"panel module-panel detail-panel",children:[b.jsxs("div",{className:"panel-heading",children:[b.jsxs("div",{children:[b.jsx("span",{className:"eyebrow",children:"工单详情"}),b.jsx("h2",{children:o.title})]}),b.jsx("span",{className:`severity-pill ${o.status==="closed"||o.status==="completed"?"normal":"warning"}`,children:Fi(im,o.status)})]}),b.jsxs("div",{className:"detail-grid",children:[b.jsx(Bi,{label:"工单编号",value:o.workorder_id}),b.jsx(Bi,{label:"设备",value:o.device_id}),b.jsx(Bi,{label:"处理人",value:o.assignee||"未分配"}),b.jsx(Bi,{label:"更新时间",value:Bl(o.updated_at)})]}),b.jsx(Rm,{steps:o.steps}),b.jsxs("div",{className:"action-row",children:[b.jsx("button",{className:"button",type:"button",disabled:e,onClick:()=>i("in_progress"),children:"标记处理中"}),b.jsx("button",{className:"button",type:"button",disabled:e,onClick:()=>i("completed"),children:"标记完成"}),b.jsx("button",{className:"button primary",type:"button",disabled:e,onClick:()=>i("closed"),children:"关闭工单"})]})]}):b.jsx("section",{className:"panel module-panel",children:b.jsx("div",{className:"empty-state",children:"暂无工单详情"})})}function Q3({snapshot:o,sample:e}){const[i,s]=Ve.useState(Jx[0]),[l,f]=Ve.useState(null),[h,d]=Ve.useState(null),[m,p]=Ve.useState(null),[S,_]=Ve.useState(""),[v,M]=Ve.useState(!1);async function A(){try{p(await Mi("/api/rag/status"))}catch(U){_(U.message)}}Ve.useEffect(()=>{A()},[]);async function N(U=i){if(U.trim()){M(!0);try{const[F,C]=await Promise.all([Mi("/api/agent/question",{method:"POST",body:JSON.stringify({user_text:U,context:{device_id:e?.device_id||o?.device_id||""}})}),Mi(`/api/rag/search?query=${encodeURIComponent(U)}&limit=5`)]);f(F),d(C),_("")}catch(F){_(F.message)}finally{M(!1)}}}const y=h?.documents||l?.knowledge?.documents||[],x=l?.report||{};return b.jsxs("section",{className:"workspace-view active module-board","aria-label":"RAG知识问答",children:[b.jsx(cr,{eyebrow:"RAG 知识中枢",title:"维修知识问答",text:"统一调用 Router、Knowledge 和 RAG 检索接口，展示答案摘要、命中文档与知识库状态。"}),b.jsxs("div",{className:"module-grid",children:[b.jsx(_n,{label:"检索后端",value:m?.backend||"--",text:"支持本地 fallback 或远程 RAG"}),b.jsx(_n,{label:"知识记录",value:m?.record_count??"--",text:"当前可检索记录数"}),b.jsx(_n,{label:"命中文档",value:y.length,text:"本次问答引用结果"})]}),b.jsxs("section",{className:"qa-shell",children:[b.jsx("div",{className:"quick-row",children:Jx.map(U=>b.jsx("button",{className:"button",type:"button",onClick:()=>{s(U),N(U)},children:U},U))}),b.jsx("textarea",{className:"qa-input",value:i,onChange:U=>s(U.target.value),placeholder:"输入设备维修、SOP、报警码问题"}),b.jsxs("div",{className:"action-row",children:[b.jsx("button",{className:"button primary",type:"button",disabled:v,onClick:()=>N(),children:v?"检索中":"提交问答"}),b.jsx("button",{className:"button",type:"button",onClick:A,children:"刷新知识库状态"})]}),S&&b.jsx("div",{className:"inline-error",children:S})]}),b.jsxs("section",{className:"answer-grid",children:[b.jsxs("div",{className:"panel module-panel",children:[b.jsx("div",{className:"panel-heading",children:b.jsxs("div",{children:[b.jsx("span",{className:"eyebrow",children:"Agent 回答"}),b.jsx("h2",{children:x.title||"等待提问"})]})}),b.jsx("p",{className:"answer-summary",children:x.summary||l?.diagnosis?.fault||l?.route_result?.reason||"输入问题后将展示 Router 与 Knowledge Agent 的回答。"}),l?.route_result&&b.jsx(kS,{value:l.route_result})]}),b.jsxs("div",{className:"panel module-panel",children:[b.jsxs("div",{className:"panel-heading",children:[b.jsxs("div",{children:[b.jsx("span",{className:"eyebrow",children:"引用文档"}),b.jsx("h2",{children:"RAG 命中"})]}),b.jsx("span",{className:"muted",children:h?.source||l?.knowledge?.source||"--"})]}),b.jsx(VS,{documents:y})]})]})]})}function J3({snapshot:o,sample:e}){const[i,s]=Ve.useState([]),[l,f]=Ve.useState(""),[h,d]=Ve.useState(null),[m,p]=Ve.useState([]),[S,_]=Ve.useState([]),[v,M]=Ve.useState(""),[A,N]=Ve.useState(!1),y=i.find(F=>F.workorder_id===l)||i[0];async function x(){try{const[F,C,D]=await Promise.all([Mi("/api/workorders"),Mi("/api/trace"),Mi("/api/experience/search",{method:"POST",body:JSON.stringify({device_id:e?.device_id||o?.device_id||"",limit:8})})]),L=F.items||[];s(L),p(C.trace||[]),_(D.items||[]),!l&&L.length&&f(L[0].workorder_id),M("")}catch(F){M(F.message)}}Ve.useEffect(()=>{x()},[]);async function U(){if(y){N(!0);try{const F=await Mi(`/api/workorders/${y.workorder_id}/quality`,{method:"POST",body:"{}"});d(F),await x(),M("")}catch(F){M(F.message)}finally{N(!1)}}}return b.jsxs("section",{className:"workspace-view active module-board","aria-label":"质检系统",children:[b.jsx(cr,{eyebrow:"QMS 质检系统",title:"维修验收与经验沉淀",text:"对已处理工单执行恢复验证，查看 Agent Trace，并展示维修经验库检索结果。"}),b.jsxs("div",{className:"module-grid",children:[b.jsx(_n,{label:"待验工单",value:i.length,text:"来自当前工单池"}),b.jsx(_n,{label:"最近验收",value:h?h.passed?"通过":"未通过":"未执行",text:h?.workorder_id||"选择工单后执行"}),b.jsx(_n,{label:"经验记录",value:S.length,text:"长期记忆/经验库结果"})]}),b.jsxs("div",{className:"ops-grid",children:[b.jsxs("section",{className:"panel module-panel",children:[b.jsxs("div",{className:"panel-heading",children:[b.jsxs("div",{children:[b.jsx("span",{className:"eyebrow",children:"验收对象"}),b.jsx("h2",{children:"选择工单"})]}),b.jsx("button",{className:"button",type:"button",onClick:x,children:"刷新"})]}),b.jsxs("select",{className:"select-input",value:y?.workorder_id||"",onChange:F=>f(F.target.value),children:[!i.length&&b.jsx("option",{value:"",children:"暂无工单"}),i.map(F=>b.jsxs("option",{value:F.workorder_id,children:[F.workorder_id," · ",F.title]},F.workorder_id))]}),b.jsx("div",{className:"action-row",children:b.jsx("button",{className:"button primary",type:"button",disabled:A||!y,onClick:U,children:A?"验收中":"执行质检"})}),v&&b.jsx("div",{className:"inline-error",children:v})]}),b.jsxs("section",{className:"panel module-panel",children:[b.jsx("div",{className:"panel-heading",children:b.jsxs("div",{children:[b.jsx("span",{className:"eyebrow",children:"质检结果"}),b.jsx("h2",{children:h?h.passed?"验收通过":"验收未通过":"等待验收"})]})}),h?b.jsx($3,{quality:h}):b.jsx("div",{className:"empty-state",children:"工单完成或关闭后，质检结果会显示恢复状态、报警清除和 SOP 合规性。"})]})]}),b.jsxs("section",{className:"answer-grid",children:[b.jsxs("div",{className:"panel module-panel",children:[b.jsx("div",{className:"panel-heading",children:b.jsxs("div",{children:[b.jsx("span",{className:"eyebrow",children:"经验库"}),b.jsx("h2",{children:"维修经验"})]})}),b.jsx(tC,{items:S})]}),b.jsxs("div",{className:"panel module-panel",children:[b.jsx("div",{className:"panel-heading",children:b.jsxs("div",{children:[b.jsx("span",{className:"eyebrow",children:"Trace"}),b.jsx("h2",{children:"Agent 调用轨迹"})]})}),b.jsx(wm,{items:m})]})]})]})}function cr({eyebrow:o,title:e,text:i}){return b.jsxs("div",{className:"module-hero",children:[b.jsx("span",{className:"eyebrow",children:o}),b.jsx("h2",{children:e}),b.jsx("p",{children:i})]})}function _n({label:o,value:e,text:i}){return b.jsxs("div",{className:"module-card",children:[b.jsx("span",{children:o}),b.jsx("strong",{children:e}),b.jsx("p",{children:i})]})}function Bi({label:o,value:e}){return b.jsxs("div",{children:[b.jsx("span",{children:o}),b.jsx("strong",{children:e||"--"})]})}function Rm({steps:o=[]}){return o.length?b.jsx("ol",{className:"step-list",children:o.map((e,i)=>b.jsx("li",{children:e},`${e}-${i}`))}):b.jsx("div",{className:"empty-state",children:"暂无维修步骤"})}function VS({documents:o}){return o.length?b.jsx("div",{className:"document-list",children:o.map((e,i)=>b.jsxs("article",{children:[b.jsx("strong",{children:e.title||e.document_id}),b.jsx("p",{children:e.content}),b.jsxs("span",{children:[e.source||e.metadata?.collection||"知识库"," · 相关度 ",e.score??"--"]})]},e.document_id||i))}):b.jsx("div",{className:"empty-state",children:"暂无命中文档"})}function $3({quality:o}){const e=[["设备恢复",o.device_recovered],["报警清除",o.alarm_cleared],["SOP合规",o.sop_compliant]];return b.jsxs("div",{className:"quality-result",children:[b.jsx("div",{className:"check-grid",children:e.map(([i,s])=>b.jsxs("div",{className:s?"normal":"fault",children:[b.jsx("span",{children:i}),b.jsx("strong",{children:s?"通过":"未通过"})]},i))}),b.jsx(Rm,{steps:o.findings||[]})]})}function tC({items:o}){return o.length?b.jsx("div",{className:"document-list",children:o.map((e,i)=>b.jsxs("article",{children:[b.jsx("strong",{children:e.title}),b.jsx("p",{children:e.content}),b.jsxs("span",{children:[e.device_id||"--"," · ",e.source_workorder||"历史经验"]})]},e.experience_id||i))}):b.jsx("div",{className:"empty-state",children:"暂无经验记录；闭环通过后会自动沉淀。"})}function wm({items:o}){return o.length?b.jsx("div",{className:"trace-list",children:o.slice(0,12).map((e,i)=>b.jsxs("div",{children:[b.jsx("strong",{children:e.event}),b.jsx("span",{children:e.agent||e.tool||e.mcp_server||"runtime"})]},`${e.event||"trace"}-${i}`))}):b.jsx("div",{className:"empty-state",children:"暂无调用轨迹"})}function kS({value:o}){return b.jsx("pre",{className:"json-block",children:JSON.stringify(o,null,2)})}UE.createRoot(document.getElementById("root")).render(b.jsx(R3,{}));
