(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const l of document.querySelectorAll('link[rel="modulepreload"]'))s(l);new MutationObserver(l=>{for(const f of l)if(f.type==="childList")for(const h of f.addedNodes)h.tagName==="LINK"&&h.rel==="modulepreload"&&s(h)}).observe(document,{childList:!0,subtree:!0});function i(l){const f={};return l.integrity&&(f.integrity=l.integrity),l.referrerPolicy&&(f.referrerPolicy=l.referrerPolicy),l.crossOrigin==="use-credentials"?f.credentials="include":l.crossOrigin==="anonymous"?f.credentials="omit":f.credentials="same-origin",f}function s(l){if(l.ep)return;l.ep=!0;const f=i(l);fetch(l.href,f)}})();var Sd={exports:{}},hl={};var Dv;function dE(){if(Dv)return hl;Dv=1;var o=Symbol.for("react.transitional.element"),e=Symbol.for("react.fragment");function i(s,l,f){var h=null;if(f!==void 0&&(h=""+f),l.key!==void 0&&(h=""+l.key),"key"in l){f={};for(var d in l)d!=="key"&&(f[d]=l[d])}else f=l;return l=f.ref,{$$typeof:o,type:s,key:h,ref:l!==void 0?l:null,props:f}}return hl.Fragment=e,hl.jsx=i,hl.jsxs=i,hl}var Nv;function pE(){return Nv||(Nv=1,Sd.exports=dE()),Sd.exports}var K=pE(),yd={exports:{}},ue={};var Uv;function mE(){if(Uv)return ue;Uv=1;var o=Symbol.for("react.transitional.element"),e=Symbol.for("react.portal"),i=Symbol.for("react.fragment"),s=Symbol.for("react.strict_mode"),l=Symbol.for("react.profiler"),f=Symbol.for("react.consumer"),h=Symbol.for("react.context"),d=Symbol.for("react.forward_ref"),m=Symbol.for("react.suspense"),p=Symbol.for("react.memo"),x=Symbol.for("react.lazy"),_=Symbol.for("react.activity"),v=Symbol.for("react.view_transition"),M=Symbol.iterator;function R(z){return z===null||typeof z!="object"?null:(z=M&&z[M]||z["@@iterator"],typeof z=="function"?z:null)}var w={isMounted:function(){return!1},enqueueForceUpdate:function(){},enqueueReplaceState:function(){},enqueueSetState:function(){}},y=Object.assign,S={};function O(z,_t,Nt){this.props=z,this.context=_t,this.refs=S,this.updater=Nt||w}O.prototype.isReactComponent={},O.prototype.setState=function(z,_t){if(typeof z!="object"&&typeof z!="function"&&z!=null)throw Error("takes an object of state variables to update or a function which returns an object of state variables.");this.updater.enqueueSetState(this,z,_t,"setState")},O.prototype.forceUpdate=function(z){this.updater.enqueueForceUpdate(this,z,"forceUpdate")};function G(){}G.prototype=O.prototype;function C(z,_t,Nt){this.props=z,this.context=_t,this.refs=S,this.updater=Nt||w}var D=C.prototype=new G;D.constructor=C,y(D,O.prototype),D.isPureReactComponent=!0;var N=Array.isArray;function P(){}var T={H:null,A:null,T:null,S:null},U=Object.prototype.hasOwnProperty;function F(z,_t,Nt){var Z=Nt.ref;return{$$typeof:o,type:z,key:_t,ref:Z!==void 0?Z:null,props:Nt}}function V(z,_t){return F(z.type,_t,z.props)}function Q(z){return typeof z=="object"&&z!==null&&z.$$typeof===o}function st(z){var _t={"=":"=0",":":"=2"};return"$"+z.replace(/[=:]/g,function(Nt){return _t[Nt]})}var Y=/\/+/g;function tt(z,_t){return typeof z=="object"&&z!==null&&z.key!=null?st(""+z.key):_t.toString(36)}function W(z){switch(z.status){case"fulfilled":return z.value;case"rejected":throw z.reason;default:switch(typeof z.status=="string"?z.then(P,P):(z.status="pending",z.then(function(_t){z.status==="pending"&&(z.status="fulfilled",z.value=_t)},function(_t){z.status==="pending"&&(z.status="rejected",z.reason=_t)})),z.status){case"fulfilled":return z.value;case"rejected":throw z.reason}}throw z}function q(z,_t,Nt,Z,ft){var wt=typeof z;(wt==="undefined"||wt==="boolean")&&(z=null);var Pt=!1;if(z===null)Pt=!0;else switch(wt){case"bigint":case"string":case"number":Pt=!0;break;case"object":switch(z.$$typeof){case o:case e:Pt=!0;break;case x:return Pt=z._init,q(Pt(z._payload),_t,Nt,Z,ft)}}if(Pt)return ft=ft(z),Pt=Z===""?"."+tt(z,0):Z,N(ft)?(Nt="",Pt!=null&&(Nt=Pt.replace(Y,"$&/")+"/"),q(ft,_t,Nt,"",function(Te){return Te})):ft!=null&&(Q(ft)&&(ft=V(ft,Nt+(ft.key==null||z&&z.key===ft.key?"":(""+ft.key).replace(Y,"$&/")+"/")+Pt)),_t.push(ft)),1;Pt=0;var vt=Z===""?".":Z+":";if(N(z))for(var Ut=0;Ut<z.length;Ut++)Z=z[Ut],wt=vt+tt(Z,Ut),Pt+=q(Z,_t,Nt,wt,ft);else if(Ut=R(z),typeof Ut=="function")for(z=Ut.call(z),Ut=0;!(Z=z.next()).done;)Z=Z.value,wt=vt+tt(Z,Ut++),Pt+=q(Z,_t,Nt,wt,ft);else if(wt==="object"){if(typeof z.then=="function")return q(W(z),_t,Nt,Z,ft);throw _t=String(z),Error("Objects are not valid as a React child (found: "+(_t==="[object Object]"?"object with keys {"+Object.keys(z).join(", ")+"}":_t)+"). If you meant to render a collection of children, use an array instead.")}return Pt}function dt(z,_t,Nt){if(z==null)return z;var Z=[],ft=0;return q(z,Z,"","",function(wt){return _t.call(Nt,wt,ft++)}),Z}function ct(z){if(z._status===-1){var _t=z._result,Nt=_t();Nt.then(function(Z){(z._status===0||z._status===-1)&&(z._status=1,z._result=Z,Nt.status===void 0&&(Nt.status="fulfilled",Nt.value=Z))},function(Z){(z._status===0||z._status===-1)&&(z._status=2,z._result=Z,Nt.status===void 0&&(Nt.status="rejected",Nt.reason=Z))}),z._status===-1&&(z._status=0,z._result=Nt)}if(z._status===1)return z._result.default;throw z._result}var rt=typeof reportError=="function"?reportError:function(z){if(typeof window=="object"&&typeof window.ErrorEvent=="function"){var _t=new window.ErrorEvent("error",{bubbles:!0,cancelable:!0,message:typeof z=="object"&&z!==null&&typeof z.message=="string"?String(z.message):String(z),error:z});if(!window.dispatchEvent(_t))return}else if(typeof process=="object"&&typeof process.emit=="function"){process.emit("uncaughtException",z);return}console.error(z)};function bt(z){var _t=T.T,Nt={};Nt.types=_t!==null?_t.types:null,T.T=Nt;try{var Z=z(),ft=T.S;ft!==null&&ft(Nt,Z),typeof Z=="object"&&Z!==null&&typeof Z.then=="function"&&Z.then(P,rt)}catch(wt){rt(wt)}finally{_t!==null&&Nt.types!==null&&(_t.types=Nt.types),T.T=_t}}function Gt(z){var _t=T.T;if(_t!==null){var Nt=_t.types;Nt===null?_t.types=[z]:Nt.indexOf(z)===-1&&Nt.push(z)}else bt(Gt.bind(null,z))}var Ot={map:dt,forEach:function(z,_t,Nt){dt(z,function(){_t.apply(this,arguments)},Nt)},count:function(z){var _t=0;return dt(z,function(){_t++}),_t},toArray:function(z){return dt(z,function(_t){return _t})||[]},only:function(z){if(!Q(z))throw Error("React.Children.only expected to receive a single React element child.");return z}};return ue.Activity=_,ue.Children=Ot,ue.Component=O,ue.Fragment=i,ue.Profiler=l,ue.PureComponent=C,ue.StrictMode=s,ue.Suspense=m,ue.ViewTransition=v,ue.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE=T,ue.__COMPILER_RUNTIME={__proto__:null,c:function(z){return T.H.useMemoCache(z)}},ue.addTransitionType=Gt,ue.cache=function(z){return function(){return z.apply(null,arguments)}},ue.cacheSignal=function(){return null},ue.cloneElement=function(z,_t,Nt){if(z==null)throw Error("The argument must be a React element, but you passed "+z+".");var Z=y({},z.props),ft=z.key;if(_t!=null)for(wt in _t.key!==void 0&&(ft=""+_t.key),_t)!U.call(_t,wt)||wt==="key"||wt==="__self"||wt==="__source"||wt==="ref"&&_t.ref===void 0||(Z[wt]=_t[wt]);var wt=arguments.length-2;if(wt===1)Z.children=Nt;else if(1<wt){for(var Pt=Array(wt),vt=0;vt<wt;vt++)Pt[vt]=arguments[vt+2];Z.children=Pt}return F(z.type,ft,Z)},ue.createContext=function(z){return z={$$typeof:h,_currentValue:z,_currentValue2:z,_threadCount:0,Provider:null,Consumer:null},z.Provider=z,z.Consumer={$$typeof:f,_context:z},z},ue.createElement=function(z,_t,Nt){var Z,ft={},wt=null;if(_t!=null)for(Z in _t.key!==void 0&&(wt=""+_t.key),_t)U.call(_t,Z)&&Z!=="key"&&Z!=="__self"&&Z!=="__source"&&(ft[Z]=_t[Z]);var Pt=arguments.length-2;if(Pt===1)ft.children=Nt;else if(1<Pt){for(var vt=Array(Pt),Ut=0;Ut<Pt;Ut++)vt[Ut]=arguments[Ut+2];ft.children=vt}if(z&&z.defaultProps)for(Z in Pt=z.defaultProps,Pt)ft[Z]===void 0&&(ft[Z]=Pt[Z]);return F(z,wt,ft)},ue.createRef=function(){return{current:null}},ue.forwardRef=function(z){return{$$typeof:d,render:z}},ue.isValidElement=Q,ue.lazy=function(z){return{$$typeof:x,_payload:{_status:-1,_result:z},_init:ct}},ue.memo=function(z,_t){return{$$typeof:p,type:z,compare:_t===void 0?null:_t}},ue.startTransition=bt,ue.unstable_useCacheRefresh=function(){return T.H.useCacheRefresh()},ue.use=function(z){return T.H.use(z)},ue.useActionState=function(z,_t,Nt){return T.H.useActionState(z,_t,Nt)},ue.useCallback=function(z,_t){return T.H.useCallback(z,_t)},ue.useContext=function(z){return T.H.useContext(z)},ue.useDebugValue=function(){},ue.useDeferredValue=function(z,_t){return T.H.useDeferredValue(z,_t)},ue.useEffect=function(z,_t){return T.H.useEffect(z,_t)},ue.useEffectEvent=function(z){return T.H.useEffectEvent(z)},ue.useId=function(){return T.H.useId()},ue.useImperativeHandle=function(z,_t,Nt){return T.H.useImperativeHandle(z,_t,Nt)},ue.useInsertionEffect=function(z,_t){return T.H.useInsertionEffect(z,_t)},ue.useLayoutEffect=function(z,_t){return T.H.useLayoutEffect(z,_t)},ue.useMemo=function(z,_t){return T.H.useMemo(z,_t)},ue.useOptimistic=function(z,_t){return T.H.useOptimistic(z,_t)},ue.useReducer=function(z,_t,Nt){return T.H.useReducer(z,_t,Nt)},ue.useRef=function(z){return T.H.useRef(z)},ue.useState=function(z){return T.H.useState(z)},ue.useSyncExternalStore=function(z,_t,Nt){return T.H.useSyncExternalStore(z,_t,Nt)},ue.useTransition=function(){return T.H.useTransition()},ue.version="19.3.0",ue}var Lv;function $p(){return Lv||(Lv=1,yd.exports=mE()),yd.exports}var ca=$p(),Md={exports:{}},dl={},Ed={exports:{}},Td={};var Ov;function gE(){return Ov||(Ov=1,(function(o){function e(W,q){var dt=W.length;W.push(q);t:for(;0<dt;){var ct=dt-1>>>1,rt=W[ct];if(0<l(rt,q))W[ct]=q,W[dt]=rt,dt=ct;else break t}}function i(W){return W.length===0?null:W[0]}function s(W){if(W.length===0)return null;var q=W[0],dt=W.pop();if(dt!==q){W[0]=dt;t:for(var ct=0,rt=W.length,bt=rt>>>1;ct<bt;){var Gt=2*(ct+1)-1,Ot=W[Gt],z=Gt+1,_t=W[z];if(0>l(Ot,dt))z<rt&&0>l(_t,Ot)?(W[ct]=_t,W[z]=dt,ct=z):(W[ct]=Ot,W[Gt]=dt,ct=Gt);else if(z<rt&&0>l(_t,dt))W[ct]=_t,W[z]=dt,ct=z;else break t}}return q}function l(W,q){var dt=W.sortIndex-q.sortIndex;return dt!==0?dt:W.id-q.id}if(o.unstable_now=void 0,typeof performance=="object"&&typeof performance.now=="function"){var f=performance;o.unstable_now=function(){return f.now()}}else{var h=Date,d=h.now();o.unstable_now=function(){return h.now()-d}}var m=[],p=[],x=1,_=null,v=3,M=!1,R=!1,w=!1,y=!1,S=typeof setTimeout=="function"?setTimeout:null,O=typeof clearTimeout=="function"?clearTimeout:null,G=typeof setImmediate<"u"?setImmediate:null;function C(W){for(var q=i(p);q!==null;){if(q.callback===null)s(p);else if(q.startTime<=W)s(p),q.sortIndex=q.expirationTime,e(m,q);else break;q=i(p)}}function D(W){if(w=!1,C(W),!R)if(i(m)!==null)R=!0,N||(N=!0,Q());else{var q=i(p);q!==null&&tt(D,q.startTime-W)}}var N=!1,P=-1,T=5,U=-1;function F(){return y?!0:!(o.unstable_now()-U<T)}function V(){if(y=!1,N){var W=o.unstable_now();U=W;var q=!0;try{t:{R=!1,w&&(w=!1,O(P),P=-1),M=!0;var dt=v;try{e:{for(C(W),_=i(m);_!==null&&!(_.expirationTime>W&&F());){var ct=_.callback;if(typeof ct=="function"){_.callback=null,v=_.priorityLevel;var rt=ct(_.expirationTime<=W);if(W=o.unstable_now(),typeof rt=="function"){_.callback=rt,C(W),q=!0;break e}_===i(m)&&s(m),C(W)}else s(m);_=i(m)}if(_!==null)q=!0;else{var bt=i(p);bt!==null&&tt(D,bt.startTime-W),q=!1}}break t}finally{_=null,v=dt,M=!1}q=void 0}}finally{q?Q():N=!1}}}var Q;if(typeof G=="function")Q=function(){G(V)};else if(typeof MessageChannel<"u"){var st=new MessageChannel,Y=st.port2;st.port1.onmessage=V,Q=function(){Y.postMessage(null)}}else Q=function(){S(V,0)};function tt(W,q){P=S(function(){W(o.unstable_now())},q)}o.unstable_IdlePriority=5,o.unstable_ImmediatePriority=1,o.unstable_LowPriority=4,o.unstable_NormalPriority=3,o.unstable_Profiling=null,o.unstable_UserBlockingPriority=2,o.unstable_cancelCallback=function(W){W.callback=null},o.unstable_forceFrameRate=function(W){0>W||125<W?console.error("forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported"):T=0<W?Math.floor(1e3/W):5},o.unstable_getCurrentPriorityLevel=function(){return v},o.unstable_next=function(W){switch(v){case 1:case 2:case 3:var q=3;break;default:q=v}var dt=v;v=q;try{return W()}finally{v=dt}},o.unstable_requestPaint=function(){y=!0},o.unstable_runWithPriority=function(W,q){switch(W){case 1:case 2:case 3:case 4:case 5:break;default:W=3}var dt=v;v=W;try{return q()}finally{v=dt}},o.unstable_scheduleCallback=function(W,q,dt){var ct=o.unstable_now();switch(typeof dt=="object"&&dt!==null?(dt=dt.delay,dt=typeof dt=="number"&&0<dt?ct+dt:ct):dt=ct,W){case 1:var rt=-1;break;case 2:rt=250;break;case 5:rt=1073741823;break;case 4:rt=1e4;break;default:rt=5e3}return rt=dt+rt,W={id:x++,callback:q,priorityLevel:W,startTime:dt,expirationTime:rt,sortIndex:-1},dt>ct?(W.sortIndex=dt,e(p,W),i(m)===null&&W===i(p)&&(w?(O(P),P=-1):w=!0,tt(D,dt-ct))):(W.sortIndex=rt,e(m,W),R||M||(R=!0,N||(N=!0,Q()))),W},o.unstable_shouldYield=F,o.unstable_wrapCallback=function(W){var q=v;return function(){var dt=v;v=q;try{return W.apply(this,arguments)}finally{v=dt}}}})(Td)),Td}var Pv;function _E(){return Pv||(Pv=1,Ed.exports=gE()),Ed.exports}var bd={exports:{}},In={};var Iv;function vE(){if(Iv)return In;Iv=1;var o=$p();function e(x){var _="https://react.dev/errors/"+x;if(1<arguments.length){_+="?args[]="+encodeURIComponent(arguments[1]);for(var v=2;v<arguments.length;v++)_+="&args[]="+encodeURIComponent(arguments[v])}return"Minified React error #"+x+"; visit "+_+" for the full message or use the non-minified dev environment for full errors and additional helpful warnings."}function i(){}var s={d:{f:i,r:function(){throw Error(e(522))},D:i,C:i,L:i,m:i,X:i,S:i,M:i},p:0,findDOMNode:null},l=Symbol.for("react.portal"),f=Symbol.for("react.recoverable"),h=Symbol.for("react.optimistic_key");function d(x,_,v){var M=3<arguments.length&&arguments[3]!==void 0?arguments[3]:null;return{$$typeof:l,key:M==null?null:M===h?h:""+M,children:x,containerInfo:_,implementation:v}}var m=o.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;function p(x,_){if(x==="font")return"";if(typeof _=="string")return _==="use-credentials"?_:""}return In.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE=s,In.browser=function(x){return{$$typeof:f,_reason:x}},In.createPortal=function(x,_){var v=2<arguments.length&&arguments[2]!==void 0?arguments[2]:null;if(!_||_.nodeType!==1&&_.nodeType!==9&&_.nodeType!==11)throw Error(e(299));return d(x,_,null,v)},In.flushSync=function(x){var _=m.T,v=s.p;try{if(m.T=null,s.p=2,x)return x()}finally{m.T=_,s.p=v,s.d.f()}},In.preconnect=function(x,_){typeof x=="string"&&(_?(_=_.crossOrigin,_=typeof _=="string"?_==="use-credentials"?_:"":void 0):_=null,s.d.C(x,_))},In.prefetchDNS=function(x){typeof x=="string"&&s.d.D(x)},In.preinit=function(x,_){if(typeof x=="string"&&_&&typeof _.as=="string"){var v=_.as,M=p(v,_.crossOrigin),R=typeof _.integrity=="string"?_.integrity:void 0,w=typeof _.fetchPriority=="string"?_.fetchPriority:void 0;v==="style"?s.d.S(x,typeof _.precedence=="string"?_.precedence:void 0,{crossOrigin:M,integrity:R,fetchPriority:w}):v==="script"&&s.d.X(x,{crossOrigin:M,integrity:R,fetchPriority:w,nonce:typeof _.nonce=="string"?_.nonce:void 0})}},In.preinitModule=function(x,_){if(typeof x=="string")if(typeof _=="object"&&_!==null){if(_.as==null||_.as==="script"){var v=p(_.as,_.crossOrigin);s.d.M(x,{crossOrigin:v,integrity:typeof _.integrity=="string"?_.integrity:void 0,nonce:typeof _.nonce=="string"?_.nonce:void 0,fetchPriority:typeof _.fetchPriority=="string"?_.fetchPriority:void 0})}}else _==null&&s.d.M(x)},In.preload=function(x,_){if(typeof x=="string"&&typeof _=="object"&&_!==null&&typeof _.as=="string"){var v=_.as,M=p(v,_.crossOrigin);s.d.L(x,v,{crossOrigin:M,integrity:typeof _.integrity=="string"?_.integrity:void 0,nonce:typeof _.nonce=="string"?_.nonce:void 0,type:typeof _.type=="string"?_.type:void 0,fetchPriority:typeof _.fetchPriority=="string"?_.fetchPriority:void 0,referrerPolicy:typeof _.referrerPolicy=="string"?_.referrerPolicy:void 0,imageSrcSet:typeof _.imageSrcSet=="string"?_.imageSrcSet:void 0,imageSizes:typeof _.imageSizes=="string"?_.imageSizes:void 0,media:typeof _.media=="string"?_.media:void 0})}},In.preloadModule=function(x,_){if(typeof x=="string")if(_){var v=p(_.as,_.crossOrigin);s.d.m(x,{as:typeof _.as=="string"&&_.as!=="script"?_.as:void 0,crossOrigin:v,integrity:typeof _.integrity=="string"?_.integrity:void 0,nonce:typeof _.nonce=="string"?_.nonce:void 0,fetchPriority:typeof _.fetchPriority=="string"?_.fetchPriority:void 0})}else s.d.m(x)},In.requestFormReset=function(x){s.d.r(x)},In.unstable_batchedUpdates=function(x,_){return x(_)},In.useFormState=function(x,_,v){return m.H.useFormState(x,_,v)},In.useFormStatus=function(){return m.H.useHostTransitionStatus()},In.version="19.3.0",In}var zv;function xE(){if(zv)return bd.exports;zv=1;function o(){if(!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__>"u"||typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE!="function"))try{__REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(o)}catch(e){console.error(e)}}return o(),bd.exports=vE(),bd.exports}var Bv;function SE(){if(Bv)return dl;Bv=1;var o=_E(),e=$p(),i=xE();function s(t){var n="https://react.dev/errors/"+t;if(1<arguments.length){n+="?args[]="+encodeURIComponent(arguments[1]);for(var a=2;a<arguments.length;a++)n+="&args[]="+encodeURIComponent(arguments[a])}return"Minified React error #"+t+"; visit "+n+" for the full message or use the non-minified dev environment for full errors and additional helpful warnings."}function l(t){return!(!t||t.nodeType!==1&&t.nodeType!==9&&t.nodeType!==11)}function f(t){for(var n=t,a=n;a&&!a.alternate;)n=a,(n.flags&4098)!==0&&(t=n.return),a=n.return;for(;n.return;)n=n.return;return n.tag===3?t:null}function h(t){if(t.tag===13){var n=t.memoizedState;if(n===null&&(t=t.alternate,t!==null&&(n=t.memoizedState)),n!==null)return n.dehydrated}return null}function d(t){if(t.tag===31){var n=t.memoizedState;if(n===null&&(t=t.alternate,t!==null&&(n=t.memoizedState)),n!==null)return n.dehydrated}return null}function m(t){if(f(t)!==t)throw Error(s(188))}function p(t){var n=t.alternate;if(!n){if(n=f(t),n===null)throw Error(s(188));return n!==t?null:t}for(var a=t,r=n;;){var u=a.return;if(u===null)break;var c=u.alternate;if(c===null){if(r=u.return,r!==null){a=r;continue}break}if(u.child===c.child){for(c=u.child;c;){if(c===a)return m(u),t;if(c===r)return m(u),n;c=c.sibling}throw Error(s(188))}if(a.return!==r.return)a=u,r=c;else{for(var g=!1,A=u.child;A;){if(A===a){g=!0,a=u,r=c;break}if(A===r){g=!0,r=u,a=c;break}A=A.sibling}if(!g){for(A=c.child;A;){if(A===a){g=!0,a=c,r=u;break}if(A===r){g=!0,r=c,a=u;break}A=A.sibling}if(!g)throw Error(s(189))}}if(a.alternate!==r)throw Error(s(190))}if(a.tag!==3)throw Error(s(188));return a.stateNode.current===a?t:n}function x(t){var n=t.tag;if(n===5||n===26||n===27||n===6)return t;for(t=t.child;t!==null;){if(n=x(t),n!==null)return n;t=t.sibling}return null}function _(t,n,a,r,u,c){for(;t!==null;){if((t.tag===5||t.tag===27||t.tag===6)&&a(t,r,u,c)||(t.tag!==22||t.memoizedState===null)&&(n||t.tag!==5&&t.tag!==27)&&_(t.child,n,a,r,u,c))return!0;t=t.sibling}return!1}function v(t){for(t=t.return;t!==null;){if(t.tag===3||t.tag===5||t.tag===27)return t;t=t.return}return null}function M(t){var n=!1;for(t=t.return;t!==null&&(t.tag===4&&(n=!0),!(t.tag===3||t.tag===5||t.tag===27));)t=t.return;return n}function R(t){var n=[null,null],a=v(t);return a===null||w(n,t,a.child,{foundSelf:!1}),n}function w(t,n,a,r){for(;a!==null;){if(a===n)r.foundSelf=!0;else if(a.tag===5||a.tag===27||a.tag===6){if(r.foundSelf)return t[1]=a,!0;t[0]=a}else if((a.tag!==22||a.memoizedState===null)&&w(t,n,a.child,r))return!0;a=a.sibling}return!1}function y(t){switch(t.tag){case 5:case 27:case 6:return t.stateNode;case 3:return t.stateNode.containerInfo;default:throw Error(s(559))}}var S=null,O=null;function G(t,n,a){return t===a?!0:t===n?(S=t,!0):!1}function C(t,n,a){return t===a?(O=t,!1):t===n?(O!==null&&(S=t),!0):!1}function D(t){if(t===null)return null;do t=t===null?null:t.return;while(t&&t.tag!==5&&t.tag!==27&&t.tag!==3);return t||null}function N(t,n,a){for(var r=0,u=t;u;u=a(u))r++;u=0;for(var c=n;c;c=a(c))u++;for(;0<r-u;)t=a(t),r--;for(;0<u-r;)n=a(n),u--;for(;r--;){if(t===n||n!==null&&t===n.alternate)return t;t=a(t),n=a(n)}return null}var P=Object.assign,T=Symbol.for("react.element"),U=Symbol.for("react.transitional.element"),F=Symbol.for("react.portal"),V=Symbol.for("react.fragment"),Q=Symbol.for("react.strict_mode"),st=Symbol.for("react.profiler"),Y=Symbol.for("react.consumer"),tt=Symbol.for("react.context"),W=Symbol.for("react.forward_ref"),q=Symbol.for("react.suspense"),dt=Symbol.for("react.suspense_list"),ct=Symbol.for("react.memo"),rt=Symbol.for("react.lazy"),bt=Symbol.for("react.activity"),Gt=Symbol.for("react.legacy_hidden"),Ot=Symbol.for("react.memo_cache_sentinel"),z=Symbol.for("react.view_transition"),_t=Symbol.for("react.recoverable"),Nt=Symbol.iterator;function Z(t){return t===null||typeof t!="object"?null:(t=Nt&&t[Nt]||t["@@iterator"],typeof t=="function"?t:null)}var ft=Symbol.for("react.client.reference");function wt(t){if(t==null)return null;if(typeof t=="function")return t.$$typeof===ft?null:t.displayName||t.name||null;if(typeof t=="string")return t;switch(t){case V:return"Fragment";case st:return"Profiler";case Q:return"StrictMode";case q:return"Suspense";case dt:return"SuspenseList";case bt:return"Activity";case z:return"ViewTransition"}if(typeof t=="object")switch(t.$$typeof){case F:return"Portal";case tt:return t.displayName||"Context";case Y:return(t._context.displayName||"Context")+".Consumer";case W:var n=t.render;return t=t.displayName,t||(t=n.displayName||n.name||"",t=t!==""?"ForwardRef("+t+")":"ForwardRef"),t;case ct:return n=t.displayName||null,n!==null?n:wt(t.type)||"Memo";case rt:n=t._payload,t=t._init;try{return wt(t(n))}catch{}}return null}var Pt=Array.isArray,vt=e.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE,Ut=i.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE,Te={pending:!1,data:null,method:null,action:null},ce=[],pe=-1;function _e(t){return{current:t}}function ee(t){0>pe||(t.current=ce[pe],ce[pe]=null,pe--)}function ne(t,n){pe++,ce[pe]=t.current,t.current=n}var Be=_e(null),sn=_e(null),Pe=_e(null),Je=_e(null);function X(t,n){switch(ne(Pe,n),ne(sn,t),ne(Be,null),n.nodeType){case 9:case 11:t=(t=n.documentElement)&&(t=t.namespaceURI)?F_(t):0;break;default:if(t=n.tagName,n=n.namespaceURI)n=F_(n),t=H_(n,t);else switch(t){case"svg":t=1;break;case"math":t=2;break;default:t=0}}ee(Be),ne(Be,t)}function je(){ee(Be),ee(sn),ee(Pe)}function Ee(t){var n=t.memoizedState;n!==null&&(kr._currentValue=n.memoizedState,ne(Je,t)),n=Be.current;var a=H_(n,t.type);n!==a&&(ne(sn,t),ne(Be,a))}function L(t){sn.current===t&&(ee(Be),ee(sn)),Je.current===t&&(ee(Je),kr._currentValue=Te)}var E,et;function at(t){if(E===void 0)try{throw Error()}catch(a){var n=a.stack.trim().match(/\n( *(at )?)/);E=n&&n[1]||"",et=-1<a.stack.indexOf(`
    at`)?" (<anonymous>)":-1<a.stack.indexOf("@")?"@unknown:0:0":""}return`
`+E+t+et}var gt=!1;function Dt(t,n){if(!t||gt)return"";gt=!0;var a=Error.prepareStackTrace;Error.prepareStackTrace=void 0;try{var r={DetermineComponentFrameRoot:function(){try{if(n){var Et=function(){throw Error()};if(Object.defineProperty(Et.prototype,"props",{set:function(){throw Error()}}),typeof Reflect=="object"&&Reflect.construct){try{Reflect.construct(Et,[])}catch(Ht){var j=Ht}Reflect.construct(t,[],Et)}else{try{Et.call()}catch(Ht){j=Ht}Et=!1;try{var ut=Object.getOwnPropertyDescriptor(t.prototype,"props");Object.defineProperty(t.prototype,"props",{configurable:!0,set:function(){throw Error()}}),Et=!0,new t}finally{Et&&(ut!==void 0?Object.defineProperty(t.prototype,"props",ut):delete t.prototype.props)}}}else{try{throw Error()}catch(Ht){j=Ht}(Et=t())&&typeof Et.catch=="function"&&Et.catch(function(){})}}catch(Ht){if(Ht&&j&&typeof Ht.stack=="string")return[Ht.stack,j.stack]}return[null,null]}};r.DetermineComponentFrameRoot.displayName="DetermineComponentFrameRoot";var u=Object.getOwnPropertyDescriptor(r.DetermineComponentFrameRoot,"name");u&&u.configurable&&Object.defineProperty(r.DetermineComponentFrameRoot,"name",{value:"DetermineComponentFrameRoot"});var c=r.DetermineComponentFrameRoot(),g=c[0],A=c[1];if(g&&A){var I=g.split(`
`),$=A.split(`
`);for(u=r=0;r<I.length&&!I[r].includes("DetermineComponentFrameRoot");)r++;for(;u<$.length&&!$[u].includes("DetermineComponentFrameRoot");)u++;if(r===I.length||u===$.length)for(r=I.length-1,u=$.length-1;1<=r&&0<=u&&I[r]!==$[u];)u--;for(;1<=r&&0<=u;r--,u--)if(I[r]!==$[u]){if(r!==1||u!==1)do if(r--,u--,0>u||I[r]!==$[u]){var ht=`
`+I[r].replace(" at new "," at ");return t.displayName&&ht.includes("<anonymous>")&&(ht=ht.replace("<anonymous>",t.displayName)),ht}while(1<=r&&0<=u);break}}}finally{gt=!1,Error.prepareStackTrace=a}return(a=t?t.displayName||t.name:"")?at(a):""}function It(t,n){switch(t.tag){case 26:case 27:case 5:return at(t.type);case 16:return at("Lazy");case 13:return t.child!==n&&n!==null?at("Suspense Fallback"):at("Suspense");case 19:return at("SuspenseList");case 0:case 15:return Dt(t.type,!1);case 11:return Dt(t.type.render,!1);case 1:return Dt(t.type,!0);case 31:return at("Activity");case 30:return at("ViewTransition");default:return""}}function xt(t){try{var n="",a=null;do n+=It(t,a),a=t,t=t.return;while(t);return n}catch(r){return`
Error generating stack: `+r.message+`
`+r.stack}}var St=Object.prototype.hasOwnProperty,mt=o.unstable_scheduleCallback,Ct=o.unstable_cancelCallback,yt=o.unstable_shouldYield,At=o.unstable_requestPaint,Lt=o.unstable_now,Qt=o.unstable_getCurrentPriorityLevel,ae=o.unstable_ImmediatePriority,k=o.unstable_UserBlockingPriority,zt=o.unstable_NormalPriority,Tt=o.unstable_LowPriority,Bt=o.unstable_IdlePriority,Yt=o.log,Rt=o.unstable_setDisableYieldValue,te=null,Wt=null;function Ue(t){if(typeof Yt=="function"&&Rt(t),Wt&&typeof Wt.setStrictMode=="function")try{Wt.setStrictMode(te,t)}catch{}}var fe=Math.clz32?Math.clz32:Zc,si=Math.log,Si=Math.LN2;function Zc(t){return t>>>=0,t===0?32:31-(si(t)/Si|0)|0}var rr=256,As=262144,Xa=4194304;function _a(t){var n=t&42;if(n!==0)return n;switch(t&-t){case 1:return 1;case 2:return 2;case 4:return 4;case 8:return 8;case 16:return 16;case 32:return 32;case 64:return 64;case 128:return 128;case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:return t&-t;case 262144:case 524288:case 1048576:case 2097152:return t&3932160;case 4194304:case 8388608:case 16777216:case 33554432:return t&62914560;case 67108864:return 67108864;case 134217728:return 134217728;case 268435456:return 268435456;case 536870912:return 536870912;case 1073741824:return 0;default:return t}}function Rs(t,n,a){var r=t.pendingLanes;if(r===0)return 0;var u=0,c=t.suspendedLanes,g=t.pingedLanes;t=t.warmLanes;var A=r&134217727;return A!==0?(r=A&~c,r!==0?u=_a(r):(g&=A,g!==0?u=_a(g):a||(a=A&~t,a!==0&&(u=_a(a))))):(A=r&~c,A!==0?u=_a(A):g!==0?u=_a(g):a||(a=r&~t,a!==0&&(u=_a(a)))),u===0?0:n!==0&&n!==u&&(n&c)===0&&(c=u&-u,a=n&-n,c>=a||c===32&&(a&4194048)!==0)?n:u}function ka(t,n){return(t.pendingLanes&~(t.suspendedLanes&~t.pingedLanes)&n)===0}function Yi(t,n){(n&8)!==0&&(n|=n&32);var a=t.entangledLanes;if(a!==0)for(t=t.entanglements,a&=n;0<a;){var r=31-fe(a),u=1<<r;n|=t[r],a&=~u}return n}function vo(t,n){switch(t){case 1:case 2:case 4:case 8:case 64:return n+250;case 16:case 32:case 128:case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:return n+5e3;case 4194304:case 8388608:case 16777216:case 33554432:return-1;case 67108864:case 134217728:case 268435456:case 536870912:case 1073741824:return-1;default:return-1}}function xo(){var t=Xa;return Xa<<=1,(Xa&62914560)===0&&(Xa=4194304),t}function or(t){for(var n=[],a=0;31>a;a++)n.push(t);return n}function qi(t,n){t.pendingLanes|=n,n!==268435456&&(t.suspendedLanes=0,t.pingedLanes=0,t.warmLanes=0)}function Ol(t,n,a,r,u,c){var g=t.pendingLanes;t.pendingLanes=a,t.suspendedLanes=0,t.pingedLanes=0,t.warmLanes=0,t.expiredLanes&=a,t.entangledLanes&=a,t.errorRecoveryDisabledLanes&=a,t.shellSuspendCounter=0;var A=t.entanglements,I=t.expirationTimes,$=t.hiddenUpdates;for(a=g&~a;0<a;){var ht=31-fe(a),Et=1<<ht;A[ht]=0,I[ht]=-1;var j=$[ht];if(j!==null)for($[ht]=null,ht=0;ht<j.length;ht++){var ut=j[ht];ut!==null&&(ut.lane&=-536870913)}a&=~Et}r!==0&&Cs(t,r,0),c!==0&&u===0&&t.tag!==0&&(t.suspendedLanes|=c&~(g&~n))}function Cs(t,n,a){t.pendingLanes|=n,t.suspendedLanes&=~n;var r=31-fe(n);t.entangledLanes|=n,t.entanglements[r]=t.entanglements[r]|1073741824|a&261930}function So(t,n){var a=t.entangledLanes|=n;for(t=t.entanglements;a;){var r=31-fe(a),u=1<<r;u&n|t[r]&n&&(t[r]|=n),a&=~u}}function yo(t,n){var a=n&-n;return a=(a&42)!==0?1:Mo(a),(a&(t.suspendedLanes|n))!==0?0:a}function Mo(t){switch(t){case 2:t=1;break;case 8:t=4;break;case 32:t=16;break;case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:case 4194304:case 8388608:case 16777216:case 33554432:t=128;break;case 268435456:t=134217728;break;default:t=0}return t}function Eo(t){return t&=-t,2<t?8<t?(t&134217727)!==0?32:268435456:8:2}function Pl(){var t=Ut.p;return t!==0?t:(t=window.event,t===void 0?32:Ev(t.type))}function Il(t,n){var a=Ut.p;try{return Ut.p=t,n()}finally{Ut.p=a}}var yi=Math.random().toString(36).slice(2),b="__reactFiber$"+yi,B="__reactProps$"+yi,pt="__reactContainer$"+yi,ot="__reactEvents$"+yi,lt="__reactListeners$"+yi,Vt="__reactHandles$"+yi,qt="__reactResources$"+yi,Ft="__reactMarker$"+yi,Kt="__reactLoad$"+yi;function Jt(t){delete t[b],delete t[B],delete t[lt],delete t[Vt]}function re(t){var n;if(n=t[b])return n;for(var a=t.parentNode;a;){if(n=a[pt]||a[b]){if(a=n.alternate,n.child!==null||a!==null&&a.child!==null)for(t=iv(t);t!==null;){if(a=t[b])return a;t=iv(t)}return n}t=a,a=t.parentNode}return null}function he(t){if(t=t[b]||t[pt]){var n=t.tag;if(n===5||n===6||n===13||n===31||n===26||n===27||n===3)return t}return null}function Zt(t){var n=t.tag;if(n===5||n===26||n===27||n===6)return t.stateNode;throw Error(s(33))}function be(t){var n=t[qt];return n||(n=t[qt]={hoistableStyles:new Map,hoistableScripts:new Map}),n}function xe(t){t[Ft]=!0}function Ke(t){t[Kt]=void 0}var Ve=new Set,yn={};function Xt(t,n){cn(t,n),cn(t+"Capture",n)}function cn(t,n){for(yn[t]=n,t=0;t<n.length;t++)Ve.add(n[t])}var Le=RegExp("^[:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD][:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD\\-.0-9\\u00B7\\u0300-\\u036F\\u203F-\\u2040]*$"),Vn={},ri={};function Zi(t){return St.call(ri,t)?!0:St.call(Vn,t)?!1:Le.test(t)?ri[t]=!0:(Vn[t]=!0,!1)}var Se=!1;function He(){var t=Se;return Se=!1,t}function tn(t,n,a){if(Zi(n))if(a===null)t.removeAttribute(n);else{switch(typeof a){case"undefined":case"function":case"symbol":t.removeAttribute(n);return;case"boolean":var r=n.toLowerCase().slice(0,5);if(r!=="data-"&&r!=="aria-"){t.removeAttribute(n);return}}t.setAttribute(n,a)}}function oi(t,n,a){if(a===null)t.removeAttribute(n);else{switch(typeof a){case"undefined":case"function":case"symbol":case"boolean":t.removeAttribute(n);return}t.setAttribute(n,a)}}function we(t,n,a,r){if(r===null)t.removeAttribute(a);else{switch(typeof r){case"undefined":case"function":case"symbol":case"boolean":t.removeAttribute(a);return}t.setAttributeNS(n,a,r)}}function fn(t){switch(typeof t){case"bigint":case"boolean":case"number":case"string":case"undefined":return t;case"object":return t;default:return""}}function va(t){var n=t.type;return(t=t.nodeName)&&t.toLowerCase()==="input"&&(n==="checkbox"||n==="radio")}function zl(t,n,a){var r=Object.getOwnPropertyDescriptor(t.constructor.prototype,n);if(!t.hasOwnProperty(n)&&typeof r<"u"&&typeof r.get=="function"&&typeof r.set=="function"){var u=r.get,c=r.set;return Object.defineProperty(t,n,{configurable:!0,get:function(){return u.call(this)},set:function(g){a=""+g,c.call(this,g)}}),Object.defineProperty(t,n,{enumerable:r.enumerable}),{getValue:function(){return a},setValue:function(g){a=""+g},stopTracking:function(){t._valueTracker=null,delete t[n]}}}}function jc(t){if(!t._valueTracker){var n=va(t)?"checked":"value";t._valueTracker=zl(t,n,""+t[n])}}function Rm(t){if(!t)return!1;var n=t._valueTracker;if(!n)return!0;var a=n.getValue(),r="";return t&&(r=va(t)?t.checked?"true":"false":t.value),t=r,t!==a?(n.setValue(t),!0):!1}var OS=/[\n"\\]/g;function Mi(t){return t.replace(OS,function(n){return"\\"+n.charCodeAt(0).toString(16)+" "})}function Kc(t,n,a,r,u,c,g,A){t.name="",g!=null&&typeof g!="function"&&typeof g!="symbol"&&typeof g!="boolean"?t.type=g:t.removeAttribute("type"),n!=null?g==="number"?(n===0&&t.value===""||t.value!=n)&&(t.value=""+fn(n)):t.value!==""+fn(n)&&(t.value=""+fn(n)):g!=="submit"&&g!=="reset"||t.removeAttribute("value"),n!=null?g==="number"&&t.value==n?Qc(t,fn(t.value)):Qc(t,fn(n)):a!=null?Qc(t,fn(a)):r!=null&&t.removeAttribute("value"),u==null&&c!=null&&(t.defaultChecked=!!c),u!=null&&(t.checked=u&&typeof u!="function"&&typeof u!="symbol"),A!=null&&typeof A!="function"&&typeof A!="symbol"&&typeof A!="boolean"?t.name=""+fn(A):t.removeAttribute("name")}function Cm(t,n,a,r,u,c,g,A){if(c!=null&&typeof c!="function"&&typeof c!="symbol"&&typeof c!="boolean"&&(t.type=c),n!=null||a!=null){if(!(c!=="submit"&&c!=="reset"||n!=null)){jc(t);return}a=a!=null?""+fn(a):"",n=n!=null?""+fn(n):a,A||n===t.value||(t.value=n),t.defaultValue=n}r=r??u,r=typeof r!="function"&&typeof r!="symbol"&&!!r,t.checked=A?t.checked:!!r,t.defaultChecked=!!r,g!=null&&typeof g!="function"&&typeof g!="symbol"&&typeof g!="boolean"&&(t.name=g),jc(t)}function Qc(t,n){t.defaultValue!==""+n&&(t.defaultValue=""+n)}function lr(t,n,a,r){if(t=t.options,n){n={};for(var u=0;u<a.length;u++)n["$"+a[u]]=!0;for(a=0;a<t.length;a++)u=n.hasOwnProperty("$"+t[a].value),t[a].selected!==u&&(t[a].selected=u),u&&r&&(t[a].defaultSelected=!0)}else{for(a=""+fn(a),n=null,u=0;u<t.length;u++){if(t[u].value===a){t[u].selected=!0,r&&(t[u].defaultSelected=!0);return}n!==null||t[u].disabled||(n=t[u])}n!==null&&(n.selected=!0)}}function wm(t,n,a){if(n!=null&&(n=""+fn(n),n!==t.value&&(t.value=n),a==null)){t.defaultValue!==n&&(t.defaultValue=n);return}t.defaultValue=a!=null?""+fn(a):""}function Dm(t,n,a,r){if(n==null){if(r!=null){if(a!=null)throw Error(s(92));if(Pt(r)){if(1<r.length)throw Error(s(93));r=r[0]}a=r}a==null&&(a=""),n=a}a=fn(n),t.defaultValue=a,r=t.textContent,r===a&&r!==""&&r!==null&&(t.value=r),jc(t)}function ur(t,n){if(n){var a=t.firstChild;if(a&&a===t.lastChild&&a.nodeType===3){a.nodeValue=n;return}}t.textContent=n}var PS=new Set("animationIterationCount aspectRatio borderImageOutset borderImageSlice borderImageWidth boxFlex boxFlexGroup boxOrdinalGroup columnCount columns flex flexGrow flexPositive flexShrink flexNegative flexOrder gridArea gridRow gridRowEnd gridRowSpan gridRowStart gridColumn gridColumnEnd gridColumnSpan gridColumnStart fontWeight lineClamp lineHeight opacity order orphans scale tabSize widows zIndex zoom fillOpacity floodOpacity stopOpacity strokeDasharray strokeDashoffset strokeMiterlimit strokeOpacity strokeWidth MozAnimationIterationCount MozBoxFlex MozBoxFlexGroup MozLineClamp msAnimationIterationCount msFlex msZoom msFlexGrow msFlexNegative msFlexOrder msFlexPositive msFlexShrink msGridColumn msGridColumnSpan msGridRow msGridRowSpan WebkitAnimationIterationCount WebkitBoxFlex WebKitBoxFlexGroup WebkitBoxOrdinalGroup WebkitColumnCount WebkitColumns WebkitFlex WebkitFlexGrow WebkitFlexPositive WebkitFlexShrink WebkitLineClamp".split(" "));function Nm(t,n,a){var r=n.indexOf("--")===0;a==null||typeof a=="boolean"||a===""?r?t.setProperty(n,""):n==="float"?t.cssFloat="":t[n]="":r?t.setProperty(n,a):typeof a!="number"||a===0||PS.has(n)?n==="float"?t.cssFloat=a:t[n]=(""+a).trim():t[n]=a+"px"}function Um(t,n,a){if(n!=null&&typeof n!="object")throw Error(s(62));if(t=t.style,a!=null){for(var r in a)!a.hasOwnProperty(r)||n!=null&&n.hasOwnProperty(r)||(r.indexOf("--")===0?t.setProperty(r,""):r==="float"?t.cssFloat="":t[r]="",Se=!0);for(var u in n)r=n[u],n.hasOwnProperty(u)&&a[u]!==r&&(Nm(t,u,r),Se=!0)}else for(var c in n)n.hasOwnProperty(c)&&Nm(t,c,n[c])}function Jc(t){if(t.indexOf("-")===-1)return!1;switch(t){case"annotation-xml":case"color-profile":case"font-face":case"font-face-src":case"font-face-uri":case"font-face-format":case"font-face-name":case"missing-glyph":return!1;default:return!0}}var IS=new Map([["acceptCharset","accept-charset"],["htmlFor","for"],["httpEquiv","http-equiv"],["crossOrigin","crossorigin"],["accentHeight","accent-height"],["alignmentBaseline","alignment-baseline"],["arabicForm","arabic-form"],["baselineShift","baseline-shift"],["capHeight","cap-height"],["clipPath","clip-path"],["clipRule","clip-rule"],["colorInterpolation","color-interpolation"],["colorInterpolationFilters","color-interpolation-filters"],["colorProfile","color-profile"],["colorRendering","color-rendering"],["dominantBaseline","dominant-baseline"],["enableBackground","enable-background"],["fillOpacity","fill-opacity"],["fillRule","fill-rule"],["floodColor","flood-color"],["floodOpacity","flood-opacity"],["fontFamily","font-family"],["fontSize","font-size"],["fontSizeAdjust","font-size-adjust"],["fontStretch","font-stretch"],["fontStyle","font-style"],["fontVariant","font-variant"],["fontWeight","font-weight"],["glyphName","glyph-name"],["glyphOrientationHorizontal","glyph-orientation-horizontal"],["glyphOrientationVertical","glyph-orientation-vertical"],["horizAdvX","horiz-adv-x"],["horizOriginX","horiz-origin-x"],["imageRendering","image-rendering"],["letterSpacing","letter-spacing"],["lightingColor","lighting-color"],["markerEnd","marker-end"],["markerMid","marker-mid"],["markerStart","marker-start"],["maskType","mask-type"],["overlinePosition","overline-position"],["overlineThickness","overline-thickness"],["paintOrder","paint-order"],["panose-1","panose-1"],["pointerEvents","pointer-events"],["renderingIntent","rendering-intent"],["shapeRendering","shape-rendering"],["stopColor","stop-color"],["stopOpacity","stop-opacity"],["strikethroughPosition","strikethrough-position"],["strikethroughThickness","strikethrough-thickness"],["strokeDasharray","stroke-dasharray"],["strokeDashoffset","stroke-dashoffset"],["strokeLinecap","stroke-linecap"],["strokeLinejoin","stroke-linejoin"],["strokeMiterlimit","stroke-miterlimit"],["strokeOpacity","stroke-opacity"],["strokeWidth","stroke-width"],["textAnchor","text-anchor"],["textDecoration","text-decoration"],["textRendering","text-rendering"],["transformOrigin","transform-origin"],["underlinePosition","underline-position"],["underlineThickness","underline-thickness"],["unicodeBidi","unicode-bidi"],["unicodeRange","unicode-range"],["unitsPerEm","units-per-em"],["vAlphabetic","v-alphabetic"],["vHanging","v-hanging"],["vIdeographic","v-ideographic"],["vMathematical","v-mathematical"],["vectorEffect","vector-effect"],["vertAdvY","vert-adv-y"],["vertOriginX","vert-origin-x"],["vertOriginY","vert-origin-y"],["wordSpacing","word-spacing"],["writingMode","writing-mode"],["xmlnsXlink","xmlns:xlink"],["xHeight","x-height"]]),zS=/^[\u0000-\u001F ]*j[\r\n\t]*a[\r\n\t]*v[\r\n\t]*a[\r\n\t]*s[\r\n\t]*c[\r\n\t]*r[\r\n\t]*i[\r\n\t]*p[\r\n\t]*t[\r\n\t]*:/i;function Bl(t){return zS.test(""+t)?"javascript:throw new Error('React has blocked a javascript: URL as a security precaution.')":t}function ji(){}var $c=null;function tf(t){return t=t.target||t.srcElement||window,t.correspondingUseElement&&(t=t.correspondingUseElement),t.nodeType===3?t.parentNode:t}var cr=null,fr=null;function Lm(t){var n=he(t);if(n&&(t=n.stateNode)){var a=t[B]||null;t:switch(t=n.stateNode,n.type){case"input":if(Kc(t,a.value,a.defaultValue,a.defaultValue,a.checked,a.defaultChecked,a.type,a.name),n=a.name,a.type==="radio"&&n!=null){for(a=t;a.parentNode;)a=a.parentNode;for(a=a.querySelectorAll('input[name="'+Mi(""+n)+'"][type="radio"]'),n=0;n<a.length;n++){var r=a[n];if(r!==t&&r.form===t.form){var u=r[B]||null;if(!u)throw Error(s(90));Kc(r,u.value,u.defaultValue,u.defaultValue,u.checked,u.defaultChecked,u.type,u.name)}}for(n=0;n<a.length;n++)r=a[n],r.form===t.form&&Rm(r)}break t;case"textarea":wm(t,a.value,a.defaultValue);break t;case"select":n=a.value,n!=null&&lr(t,!!a.multiple,n,!1)}}}var ef=!1;function Om(t,n,a){if(ef)return t(n,a);ef=!0;try{var r=t(n);return r}finally{if(ef=!1,(cr!==null||fr!==null)&&(Bu(),cr&&(n=cr,t=fr,fr=cr=null,Lm(n),t)))for(n=0;n<t.length;n++)Lm(t[n])}}function To(t,n){var a=t.stateNode;if(a===null)return null;var r=a[B]||null;if(r===null)return null;a=r[n];t:switch(n){case"onClick":case"onClickCapture":case"onDoubleClick":case"onDoubleClickCapture":case"onMouseDown":case"onMouseDownCapture":case"onMouseMove":case"onMouseMoveCapture":case"onMouseUp":case"onMouseUpCapture":case"onMouseEnter":(r=!r.disabled)||(t=t.type,r=!(t==="button"||t==="input"||t==="select"||t==="textarea")),t=!r;break t;default:t=!1}if(t)return null;if(a&&typeof a!="function")throw Error(s(231,n,typeof a));return a}var xa=!(typeof window>"u"||typeof window.document>"u"||typeof window.document.createElement>"u"),nf=!1;if(xa)try{var bo={};Object.defineProperty(bo,"passive",{get:function(){nf=!0}}),window.addEventListener("test",bo,bo),window.removeEventListener("test",bo,bo)}catch{nf=!1}var Wa=null,af=null,Fl=null;function Pm(){if(Fl)return Fl;var t,n=af,a=n.length,r,u="value"in Wa?Wa.value:Wa.textContent,c=u.length;for(t=0;t<a&&n[t]===u[t];t++);var g=a-t;for(r=1;r<=g&&n[a-r]===u[c-r];r++);return Fl=u.slice(t,1<r?1-r:void 0)}function Hl(t){var n=t.keyCode;return"charCode"in t?(t=t.charCode,t===0&&n===13&&(t=13)):t=n,t===10&&(t=13),32<=t||t===13?t:0}function Gl(){return!0}function Im(){return!1}function Xn(t){function n(a,r,u,c,g){this._reactName=a,this._targetInst=u,this.type=r,this.nativeEvent=c,this.target=g,this.currentTarget=null;for(var A in t)t.hasOwnProperty(A)&&(a=t[A],this[A]=a?a(c):c[A]);return this.isDefaultPrevented=(c.defaultPrevented!=null?c.defaultPrevented:c.returnValue===!1)?Gl:Im,this.isPropagationStopped=Im,this}return P(n.prototype,{preventDefault:function(){this.defaultPrevented=!0;var a=this.nativeEvent;a&&(a.preventDefault?a.preventDefault():typeof a.returnValue!="unknown"&&(a.returnValue=!1),this.isDefaultPrevented=Gl)},stopPropagation:function(){var a=this.nativeEvent;a&&(a.stopPropagation?a.stopPropagation():typeof a.cancelBubble!="unknown"&&(a.cancelBubble=!0),this.isPropagationStopped=Gl)},persist:function(){},isPersistent:Gl}),n}var Ya={eventPhase:0,bubbles:0,cancelable:0,timeStamp:function(t){return t.timeStamp||Date.now()},defaultPrevented:0,isTrusted:0},Vl=Xn(Ya),Ao=P({},Ya,{view:0,detail:0}),BS=Xn(Ao),sf,rf,Ro,Xl=P({},Ao,{screenX:0,screenY:0,clientX:0,clientY:0,pageX:0,pageY:0,ctrlKey:0,shiftKey:0,altKey:0,metaKey:0,getModifierState:lf,button:0,buttons:0,relatedTarget:function(t){return t.relatedTarget===void 0?t.fromElement===t.srcElement?t.toElement:t.fromElement:t.relatedTarget},movementX:function(t){return"movementX"in t?t.movementX:(t!==Ro&&(Ro&&t.type==="mousemove"?(sf=t.screenX-Ro.screenX,rf=t.screenY-Ro.screenY):rf=sf=0,Ro=t),sf)},movementY:function(t){return"movementY"in t?t.movementY:rf}}),zm=Xn(Xl),FS=P({},Xl,{dataTransfer:0}),HS=Xn(FS),GS=P({},Ao,{relatedTarget:0}),of=Xn(GS),VS=P({},Ya,{animationName:0,elapsedTime:0,pseudoElement:0}),XS=Xn(VS),kS=P({},Ya,{clipboardData:function(t){return"clipboardData"in t?t.clipboardData:window.clipboardData}}),WS=Xn(kS),YS=P({},Ya,{data:0}),Bm=Xn(YS),qS={Esc:"Escape",Spacebar:" ",Left:"ArrowLeft",Up:"ArrowUp",Right:"ArrowRight",Down:"ArrowDown",Del:"Delete",Win:"OS",Menu:"ContextMenu",Apps:"ContextMenu",Scroll:"ScrollLock",MozPrintableKey:"Unidentified"},ZS={8:"Backspace",9:"Tab",12:"Clear",13:"Enter",16:"Shift",17:"Control",18:"Alt",19:"Pause",20:"CapsLock",27:"Escape",32:" ",33:"PageUp",34:"PageDown",35:"End",36:"Home",37:"ArrowLeft",38:"ArrowUp",39:"ArrowRight",40:"ArrowDown",45:"Insert",46:"Delete",112:"F1",113:"F2",114:"F3",115:"F4",116:"F5",117:"F6",118:"F7",119:"F8",120:"F9",121:"F10",122:"F11",123:"F12",144:"NumLock",145:"ScrollLock",224:"Meta"},jS={Alt:"altKey",Control:"ctrlKey",Meta:"metaKey",Shift:"shiftKey"};function KS(t){var n=this.nativeEvent;return n.getModifierState?n.getModifierState(t):(t=jS[t])?!!n[t]:!1}function lf(){return KS}var QS=P({},Ao,{key:function(t){if(t.key){var n=qS[t.key]||t.key;if(n!=="Unidentified")return n}return t.type==="keypress"?(t=Hl(t),t===13?"Enter":String.fromCharCode(t)):t.type==="keydown"||t.type==="keyup"?ZS[t.keyCode]||"Unidentified":""},code:0,location:0,ctrlKey:0,shiftKey:0,altKey:0,metaKey:0,repeat:0,locale:0,getModifierState:lf,charCode:function(t){return t.type==="keypress"?Hl(t):0},keyCode:function(t){return t.type==="keydown"||t.type==="keyup"?t.keyCode:0},which:function(t){return t.type==="keypress"?Hl(t):t.type==="keydown"||t.type==="keyup"?t.keyCode:0}}),JS=Xn(QS),$S=P({},Xl,{pointerId:0,width:0,height:0,pressure:0,tangentialPressure:0,tiltX:0,tiltY:0,twist:0,pointerType:0,isPrimary:0}),Fm=Xn($S),ty=P({},Ya,{submitter:0}),ey=Xn(ty),ny=P({},Ao,{touches:0,targetTouches:0,changedTouches:0,altKey:0,metaKey:0,ctrlKey:0,shiftKey:0,getModifierState:lf}),iy=Xn(ny),ay=P({},Ya,{propertyName:0,elapsedTime:0,pseudoElement:0}),sy=Xn(ay),ry=P({},Xl,{deltaX:function(t){return"deltaX"in t?t.deltaX:"wheelDeltaX"in t?-t.wheelDeltaX:0},deltaY:function(t){return"deltaY"in t?t.deltaY:"wheelDeltaY"in t?-t.wheelDeltaY:"wheelDelta"in t?-t.wheelDelta:0},deltaZ:0,deltaMode:0}),oy=Xn(ry),ly=P({},Ya,{newState:0,oldState:0,source:0}),uy=Xn(ly),cy=[9,13,27,32],uf=xa&&"CompositionEvent"in window,Co=null;xa&&"documentMode"in document&&(Co=document.documentMode);var fy=xa&&"TextEvent"in window&&!Co,Hm=xa&&(!uf||Co&&8<Co&&11>=Co),Gm=" ",Vm=!1;function Xm(t,n){switch(t){case"keyup":return cy.indexOf(n.keyCode)!==-1;case"keydown":return n.keyCode!==229;case"keypress":case"mousedown":case"focusout":return!0;default:return!1}}function km(t){return t=t.detail,typeof t=="object"&&"data"in t?t.data:null}var hr=!1;function hy(t,n){switch(t){case"compositionend":return km(n);case"keypress":return n.which!==32?null:(Vm=!0,Gm);case"textInput":return t=n.data,t===Gm&&Vm?null:t;default:return null}}function dy(t,n){if(hr)return t==="compositionend"||!uf&&Xm(t,n)?(t=Pm(),Fl=af=Wa=null,hr=!1,t):null;switch(t){case"paste":return null;case"keypress":if(!(n.ctrlKey||n.altKey||n.metaKey)||n.ctrlKey&&n.altKey){if(n.char&&1<n.char.length)return n.char;if(n.which)return String.fromCharCode(n.which)}return null;case"compositionend":return Hm&&n.locale!=="ko"?null:n.data;default:return null}}var py={color:!0,date:!0,datetime:!0,"datetime-local":!0,email:!0,month:!0,number:!0,password:!0,range:!0,search:!0,tel:!0,text:!0,time:!0,url:!0,week:!0};function Wm(t){var n=t&&t.nodeName&&t.nodeName.toLowerCase();return n==="input"?!!py[t.type]:n==="textarea"}function Ym(t,n,a,r){cr?fr?fr.push(r):fr=[r]:cr=r,n=ku(n,"onChange"),0<n.length&&(a=new Vl("onChange","change",null,a,r),t.push({event:a,listeners:n}))}var wo=null,Do=null;function my(t){L_(t,0)}function kl(t){var n=Zt(t);if(Rm(n))return t}function qm(t,n){if(t==="change")return n}var Zm=!1;if(xa){var cf;if(xa){var ff="oninput"in document;if(!ff){var jm=document.createElement("div");jm.setAttribute("oninput","return;"),ff=typeof jm.oninput=="function"}cf=ff}else cf=!1;Zm=cf&&(!document.documentMode||9<document.documentMode)}function Km(){wo&&(wo.detachEvent("onpropertychange",Qm),Do=wo=null)}function Qm(t){if(t.propertyName==="value"&&kl(Do)){var n=[];Ym(n,Do,t,tf(t)),Om(my,n)}}function gy(t,n,a){t==="focusin"?(Km(),wo=n,Do=a,wo.attachEvent("onpropertychange",Qm)):t==="focusout"&&Km()}function _y(t){if(t==="selectionchange"||t==="keyup"||t==="keydown")return kl(Do)}function vy(t,n){if(t==="click")return kl(n)}function xy(t,n){if(t==="input"||t==="change")return kl(n)}function Sy(t,n){return t===n&&(t!==0||1/t===1/n)||t!==t&&n!==n}var li=typeof Object.is=="function"?Object.is:Sy;function No(t,n){if(li(t,n))return!0;if(typeof t!="object"||t===null||typeof n!="object"||n===null)return!1;var a=Object.keys(t),r=Object.keys(n);if(a.length!==r.length)return!1;for(r=0;r<a.length;r++){var u=a[r];if(!St.call(n,u)||!li(t[u],n[u]))return!1}return!0}function hf(t){if(t=t||(typeof document<"u"?document:void 0),typeof t>"u")return null;try{return t.activeElement||t.body}catch{return t.body}}function Jm(t){for(;t&&t.firstChild;)t=t.firstChild;return t}function $m(t,n){var a=Jm(t);t=0;for(var r;a;){if(a.nodeType===3){if(r=t+a.textContent.length,t<=n&&r>=n)return{node:a,offset:n-t};t=r}t:{for(;a;){if(a.nextSibling){a=a.nextSibling;break t}a=a.parentNode}a=void 0}a=Jm(a)}}function t0(t,n){return t&&n?t===n?!0:t&&t.nodeType===3?!1:n&&n.nodeType===3?t0(t,n.parentNode):"contains"in t?t.contains(n):t.compareDocumentPosition?!!(t.compareDocumentPosition(n)&16):!1:!1}function e0(t){t=t!=null&&t.ownerDocument!=null&&t.ownerDocument.defaultView!=null?t.ownerDocument.defaultView:window;for(var n=hf(t.document);n instanceof t.HTMLIFrameElement;){try{var a=typeof n.contentWindow.location.href=="string"}catch{a=!1}if(a)t=n.contentWindow;else break;n=hf(t.document)}return n}function df(t){var n=t&&t.nodeName&&t.nodeName.toLowerCase();return n&&(n==="input"&&(t.type==="text"||t.type==="search"||t.type==="tel"||t.type==="url"||t.type==="password")||n==="textarea"||t.contentEditable==="true")}var yy=xa&&"documentMode"in document&&11>=document.documentMode,dr=null,pf=null,Uo=null,mf=!1;function n0(t,n,a){var r=a.window===a?a.document:a.nodeType===9?a:a.ownerDocument;mf||dr==null||dr!==hf(r)||(r=dr,"selectionStart"in r&&df(r)?r={start:r.selectionStart,end:r.selectionEnd}:(r=(r.ownerDocument&&r.ownerDocument.defaultView||window).getSelection(),r={anchorNode:r.anchorNode,anchorOffset:r.anchorOffset,focusNode:r.focusNode,focusOffset:r.focusOffset}),Uo&&No(Uo,r)||(Uo=r,r=ku(pf,"onSelect"),0<r.length&&(n=new Vl("onSelect","select",null,n,a),t.push({event:n,listeners:r}),n.target=dr)))}function ws(t,n){var a={};return a[t.toLowerCase()]=n.toLowerCase(),a["Webkit"+t]="webkit"+n,a["Moz"+t]="moz"+n,a}var pr={animationend:ws("Animation","AnimationEnd"),animationiteration:ws("Animation","AnimationIteration"),animationstart:ws("Animation","AnimationStart"),transitionrun:ws("Transition","TransitionRun"),transitionstart:ws("Transition","TransitionStart"),transitioncancel:ws("Transition","TransitionCancel"),transitionend:ws("Transition","TransitionEnd")},gf={},i0={};xa&&(i0=document.createElement("div").style,"AnimationEvent"in window||(delete pr.animationend.animation,delete pr.animationiteration.animation,delete pr.animationstart.animation),"TransitionEvent"in window||delete pr.transitionend.transition);function Ds(t){if(gf[t])return gf[t];if(!pr[t])return t;var n=pr[t],a;for(a in n)if(n.hasOwnProperty(a)&&a in i0)return gf[t]=n[a];return t}var a0=Ds("animationend"),s0=Ds("animationiteration"),r0=Ds("animationstart"),My=Ds("transitionrun"),Ey=Ds("transitionstart"),Ty=Ds("transitioncancel"),o0=Ds("transitionend"),l0=new Map,_f="abort auxClick beforeToggle cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error fullscreenChange fullscreenError gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel".split(" ");_f.push("scrollEnd");function Pi(t,n){l0.set(t,n),Xt(n,[t])}var by=0;function Sa(t,n){if(t.name!=null&&t.name!=="auto")return t.name;if(n.autoName!==null)return n.autoName;t=Fi.identifierPrefix;var a=by++;return t="_"+t+"t_"+a.toString(32)+"_",n.autoName=t}function u0(t){if(t==null||typeof t=="string")return t;var n=null,a=Or;if(a!==null)for(var r=0;r<a.length;r++){var u=t[a[r]];if(u!=null){if(u==="none")return"none";n=n==null?u:n+(" "+u)}}return n??t.default}function ya(t,n){return t=u0(t),n=u0(n),n==null?t==="auto"?null:t:n==="auto"?null:n}var Wl=typeof reportError=="function"?reportError:function(t){if(typeof window=="object"&&typeof window.ErrorEvent=="function"){var n=new window.ErrorEvent("error",{bubbles:!0,cancelable:!0,message:typeof t=="object"&&t!==null&&typeof t.message=="string"?String(t.message):String(t),error:t});if(!window.dispatchEvent(n))return}else if(typeof process=="object"&&typeof process.emit=="function"){process.emit("uncaughtException",t);return}console.error(t)},Ei=[],mr=0,vf=0;function Yl(){for(var t=mr,n=vf=mr=0;n<t;){var a=Ei[n];Ei[n++]=null;var r=Ei[n];Ei[n++]=null;var u=Ei[n];Ei[n++]=null;var c=Ei[n];if(Ei[n++]=null,r!==null&&u!==null){var g=r.pending;g===null?u.next=u:(u.next=g.next,g.next=u),r.pending=u}c!==0&&c0(a,u,c)}}function ql(t,n,a,r){Ei[mr++]=t,Ei[mr++]=n,Ei[mr++]=a,Ei[mr++]=r,vf|=r,t.lanes|=r,t=t.alternate,t!==null&&(t.lanes|=r)}function xf(t,n,a,r){return ql(t,n,a,r),Zl(t)}function Ns(t,n){return ql(t,null,null,n),Zl(t)}function c0(t,n,a){t.lanes|=a;var r=t.alternate;r!==null&&(r.lanes|=a);for(var u=!1,c=t.return;c!==null;)c.childLanes|=a,r=c.alternate,r!==null&&(r.childLanes|=a),c.tag===22&&(t=c.stateNode,t===null||t._visibility&1||(u=!0)),t=c,c=c.return;return t.tag===3?(c=t.stateNode,u&&n!==null&&(u=31-fe(a),t=c.hiddenUpdates,r=t[u],r===null?t[u]=[n]:r.push(n),n.lane=a|536870912),c):null}function Zl(t){if(50<tl)throw tl=0,zu=null,Error(s(185));for(var n=t.return;n!==null;)t=n,n=t.return;return t.tag===3?t.stateNode:null}var gr={};function Ay(t,n,a,r){this.tag=t,this.key=a,this.sibling=this.child=this.return=this.stateNode=this.type=this.elementType=null,this.index=0,this.refCleanup=this.ref=null,this.pendingProps=n,this.dependencies=this.memoizedState=this.updateQueue=this.memoizedProps=null,this.mode=r,this.subtreeFlags=this.flags=0,this.deletions=null,this.childLanes=this.lanes=0,this.alternate=null}function Qn(t,n,a,r){return new Ay(t,n,a,r)}function Sf(t){return t=t.prototype,!(!t||!t.isReactComponent)}function Ma(t,n){var a=t.alternate;return a===null?(a=Qn(t.tag,n,t.key,t.mode),a.elementType=t.elementType,a.type=t.type,a.stateNode=t.stateNode,a.alternate=t,t.alternate=a):(a.pendingProps=n,a.type=t.type,a.flags=0,a.subtreeFlags=0,a.deletions=null),a.flags=t.flags&1206910976,a.childLanes=t.childLanes,a.lanes=t.lanes,a.child=t.child,a.memoizedProps=t.memoizedProps,a.memoizedState=t.memoizedState,a.updateQueue=t.updateQueue,n=t.dependencies,a.dependencies=n===null?null:{lanes:n.lanes,firstContext:n.firstContext},a.sibling=t.sibling,a.index=t.index,a.ref=t.ref,a.refCleanup=t.refCleanup,a}function f0(t,n){t.flags&=1206910978;var a=t.alternate;return a===null?(t.childLanes=0,t.lanes=n,t.child=null,t.subtreeFlags=0,t.memoizedProps=null,t.memoizedState=null,t.updateQueue=null,t.dependencies=null,t.stateNode=null):(t.childLanes=a.childLanes,t.lanes=a.lanes,t.child=a.child,t.subtreeFlags=0,t.deletions=null,t.memoizedProps=a.memoizedProps,t.memoizedState=a.memoizedState,t.updateQueue=a.updateQueue,t.type=a.type,n=a.dependencies,t.dependencies=n===null?null:{lanes:n.lanes,firstContext:n.firstContext}),t}function jl(t,n,a,r,u,c){var g=0;if(r=t,typeof r=="function")Sf(r)&&(g=1);else if(typeof r=="string")g=tE(t,a,Be.current)?26:t==="html"||t==="head"||t==="body"?27:5;else t:switch(r){case bt:return t=Qn(31,a,n,u),t.elementType=bt,t.lanes=c,t;case V:return Us(a.children,u,c,n);case Q:g=8,u|=24;break;case st:return t=Qn(12,a,n,u|2),t.elementType=st,t.lanes=c,t;case q:return t=Qn(13,a,n,u),t.elementType=q,t.lanes=c,t;case dt:return t=Qn(19,a,n,u),t.elementType=dt,t.lanes=c,t;case Gt:case z:return t=u|32,t=Qn(30,a,n,t),t.elementType=z,t.lanes=c,t.stateNode={autoName:null,paired:null,clones:null,ref:null},t;default:if(typeof r=="object"&&r!==null)switch(r.$$typeof){case tt:g=10;break t;case Y:g=9;break t;case W:g=11;break t;case ct:g=14;break t;case rt:g=16,r=null;break t}g=29,a=Error(s(130,t===null?"null":typeof t,"")),r=null}return n=Qn(g,a,n,u),n.elementType=t,n.type=r,n.lanes=c,n}function Us(t,n,a,r){return t=Qn(7,t,r,n),t.lanes=a,t}function yf(t,n,a){return t=Qn(6,t,null,n),t.lanes=a,t}function h0(t){var n=Qn(18,null,null,0);return n.stateNode=t,n}function Mf(t,n,a){return n=Qn(4,t.children!==null?t.children:[],t.key,n),n.lanes=a,n.stateNode={containerInfo:t.containerInfo,pendingChildren:null,implementation:t.implementation},n}var d0=new WeakMap;function Ti(t,n){if(typeof t=="object"&&t!==null){var a=d0.get(t);return a!==void 0?a:(n={value:t,source:n,stack:xt(n)},d0.set(t,n),n)}return{value:t,source:n,stack:xt(n)}}var _r=[],vr=0,Kl=null,Lo=0,bi=[],Ai=0,qa=null,Ki=1,Qi="";function Ea(t,n){_r[vr++]=Lo,_r[vr++]=Kl,Kl=t,Lo=n}function p0(t,n,a){bi[Ai++]=Ki,bi[Ai++]=Qi,bi[Ai++]=qa,qa=t;var r=Ki;t=Qi;var u=32-fe(r)-1;r&=~(1<<u),a+=1;var c=32-fe(n)+u;if(30<c){var g=u-u%5;c=(r&(1<<g)-1).toString(32),r>>=g,u-=g,Ki=1<<32-fe(n)+u|a<<u|r,Qi=c+t}else Ki=1<<c|a<<u|r,Qi=t}function Ql(t){t.return!==null&&(Ea(t,1),p0(t,1,0))}function Ef(t){for(;t===Kl;)Kl=_r[--vr],_r[vr]=null,Lo=_r[--vr],_r[vr]=null;for(;t===qa;)qa=bi[--Ai],bi[Ai]=null,Qi=bi[--Ai],bi[Ai]=null,Ki=bi[--Ai],bi[Ai]=null}function m0(t,n){bi[Ai++]=Ki,bi[Ai++]=Qi,bi[Ai++]=qa,Ki=n.id,Qi=n.overflow,qa=t}var An=null,en=null,ye=!1,Za=null,Ri=!1,Tf=Error(s(519));function ja(t){var n=Error(s(418,1<arguments.length&&arguments[1]!==void 0&&arguments[1]?"text":"HTML",""));throw Oo(Ti(n,t)),Tf}function g0(t){var n=t.stateNode,a=t.type,r=t.memoizedProps;switch(n[b]=t,n[B]=r,a){case"dialog":Re("cancel",n),Re("close",n);break;case"iframe":case"object":case"embed":Re("load",n);break;case"video":case"audio":for(a=0;a<nl.length;a++)Re(nl[a],n);break;case"source":Re("error",n);break;case"img":case"image":case"link":Re("error",n),Re("load",n);break;case"details":Re("toggle",n);break;case"input":Re("invalid",n),Cm(n,r.value,r.defaultValue,r.checked,r.defaultChecked,r.type,r.name,!0);break;case"select":Re("invalid",n);break;case"textarea":Re("invalid",n),Dm(n,r.value,r.defaultValue,r.children)}a=r.children,typeof a!="string"&&typeof a!="number"&&typeof a!="bigint"||n.textContent===""+a||r.suppressHydrationWarning===!0||z_(n.textContent,a)?(r.popover!=null&&(Re("beforetoggle",n),Re("toggle",n)),r.onScroll!=null&&Re("scroll",n),r.onScrollEnd!=null&&Re("scrollend",n),r.onClick!=null&&(n.onclick=ji),n=!0):n=!1,n||ja(t,!0)}function Jl(t){for(An=t.return;An;)switch(An.tag){case 5:case 31:case 13:Ri=!1;return;case 27:case 3:Ri=!0;return;default:An=An.return}}function xr(t){if(t!==An)return!1;if(!ye)return Jl(t),ye=!0,!1;var n=t.tag,a;if((a=n!==3&&n!==27)&&((a=n===5)&&(a=t.type,a=!(a!=="form"&&a!=="button")||td(t.type,t.memoizedProps)),a=!a),a&&en&&ja(t),Jl(t),n===13){if(t=t.memoizedState,t=t!==null?t.dehydrated:null,!t)throw Error(s(317));en=nv(t)}else if(n===31){if(t=t.memoizedState,t=t!==null?t.dehydrated:null,!t)throw Error(s(317));en=nv(t)}else n===27?(n=en,fs(t.type)?(t=ud,ud=null,en=t):en=n):en=An?wi(t.stateNode.nextSibling):null;return!0}function Ls(){en=An=null,ye=!1}function bf(){var t=Za;return t!==null&&(ti===null?ti=t:ti.push.apply(ti,t),Za=null),t}function Oo(t){Za===null?Za=[t]:Za.push(t)}var Af=_e(null),Os=null,Ta=null;function Ka(t,n,a){ne(Af,n._currentValue),n._currentValue=a}function ba(t){t._currentValue=Af.current,ee(Af)}function $l(t,n,a){for(;t!==null;){var r=t.alternate;if((t.childLanes&n)!==n?(t.childLanes|=n,r!==null&&(r.childLanes|=n)):r!==null&&(r.childLanes&n)!==n&&(r.childLanes|=n),t===a)break;t=t.return}}function Rf(t,n,a,r){var u=t.child;for(u!==null&&(u.return=t);u!==null;){var c=u.dependencies;if(c!==null){var g=u.child;c=c.firstContext;t:for(;c!==null;){var A=c;c=u;for(var I=0;I<n.length;I++)if(A.context===n[I]){c.lanes|=a,A=c.alternate,A!==null&&(A.lanes|=a),$l(c.return,a,t),r||(g=null);break t}c=A.next}}else if(u.tag===18){if(g=u.return,g===null)throw Error(s(341));g.lanes|=a,c=g.alternate,c!==null&&(c.lanes|=a),$l(g,a,t),g=null}else u.tag===13&&u.memoizedState!==null&&u.memoizedState.dehydrated===null?(u.lanes|=a,g=u.alternate,g!==null&&(g.lanes|=a),$l(u.return,a,t),g=u.child,g=g!==null?g.sibling:null):g=u.child;if(g!==null)g.return=u;else for(g=u;g!==null;){if(g===t){g=null;break}if(u=g.sibling,u!==null){u.return=g.return,g=u;break}g=g.return}u=g}}function Ps(t,n,a,r){t=null;for(var u=n,c=!1;u!==null;){if(!c){if((u.flags&524288)!==0)c=!0;else if((u.flags&262144)!==0)break}if(u.tag===10){var g=u.alternate;if(g===null)throw Error(s(387));if(g=g.memoizedProps,g!==null){var A=u.type;li(u.pendingProps.value,g.value)||(t!==null?t.push(A):t=[A])}}else if(u===Je.current){if(g=u.alternate,g===null)throw Error(s(387));g.memoizedState.memoizedState!==u.memoizedState.memoizedState&&(t!==null?t.push(kr):t=[kr])}u=u.return}return t!==null&&Rf(n,t,a,r),n.flags|=262144,t!==null}function tu(t){for(t=t.firstContext;t!==null;){if(!li(t.context._currentValue,t.memoizedValue))return!0;t=t.next}return!1}function Is(t){Os=t,Ta=null,t=t.dependencies,t!==null&&(t.firstContext=null)}function Nn(t){return _0(Os,t)}function eu(t,n){return Os===null&&Is(t),_0(t,n)}function _0(t,n){var a=n._currentValue;if(n={context:n,memoizedValue:a,next:null},Ta===null){if(t===null)throw Error(s(308));Ta=n,t.dependencies={lanes:0,firstContext:n},t.flags|=524288}else Ta=Ta.next=n;return a}var Ry=typeof AbortController<"u"?AbortController:function(){var t=[],n=this.signal={aborted:!1,addEventListener:function(a,r){t.push(r)}};this.abort=function(){n.aborted=!0,t.forEach(function(a){return a()})}},Cy=o.unstable_scheduleCallback,wy=o.unstable_NormalPriority,gn={$$typeof:tt,Consumer:null,Provider:null,_currentValue:null,_currentValue2:null,_threadCount:0};function Cf(){return{controller:new Ry,data:new Map,refCount:0}}function Po(t){t.refCount--,t.refCount===0&&Cy(wy,function(){t.controller.abort()})}function v0(t,n){if((t.pendingLanes&4194048)!==0){var a=t.transitionTypes;for(a===null&&(a=t.transitionTypes=[]),t=0;t<n.length;t++){var r=n[t];a.indexOf(r)===-1&&a.push(r)}}}var Io=null;function Dy(t){var n=t.transitionTypes;return t.transitionTypes=null,n}var zo=null,wf=0,zs=0,Sr=null;function Ny(t,n){if(zo===null){var a=zo=[];wf=0,zs=Wh(),Sr={status:"pending",value:void 0,then:function(r){a.push(r)}}}return wf++,n.then(x0,x0),n}function x0(){if(--wf===0&&(Io=null,zo!==null)){Sr!==null&&(Sr.status="fulfilled");var t=zo;zo=null,zs=0,Sr=null;for(var n=0;n<t.length;n++)(0,t[n])()}}function Uy(t,n){var a=[],r={status:"pending",value:null,reason:null,then:function(u){a.push(u)}};return t.then(function(){r.status="fulfilled",r.value=n;for(var u=0;u<a.length;u++)(0,a[u])(n)},function(u){for(r.status="rejected",r.reason=u,u=0;u<a.length;u++)(0,a[u])(void 0)}),r}var S0=vt.S;vt.S=function(t,n){if(h_=Lt(),typeof n=="object"&&n!==null&&typeof n.then=="function"&&Ny(t,n),Io!==null)for(var a=Br;a!==null;)v0(a,Io),a=a.next;if(a=t.types,a!==null){for(var r=Br;r!==null;)v0(r,a),r=r.next;if(zs!==0){r=Io,r===null&&(r=Io=[]);for(var u=0;u<a.length;u++){var c=a[u];r.indexOf(c)===-1&&r.push(c)}}}S0!==null&&S0(t,n)};var Bs=_e(null);function Df(){var t=Bs.current;return t!==null?t:$e.pooledCache}function nu(t,n){n===null?ne(Bs,Bs.current):ne(Bs,n.pool)}function y0(){var t=Df();return t===null?null:{parent:gn._currentValue,pool:t}}var yr=Error(s(460)),Nf=Error(s(474)),iu=Error(s(542)),au={then:function(){}};function M0(t){return t=t.status,t==="fulfilled"||t==="rejected"}function E0(t,n,a){switch(a=t[a],a===void 0?t.push(n):a!==n&&(n.then(ji,ji),n=a),n.status){case"fulfilled":return n.value;case"rejected":throw t=n.reason,b0(t),t===void 0&&!("reason"in n)?Error(s(600)):t;default:if(typeof n.status=="string")n.then(ji,ji);else{if(t=$e,t!==null&&100<t.shellSuspendCounter)throw Error(s(482));t=n,t.status="pending",t.then(function(r){if(n.status==="pending"){var u=n;u.status="fulfilled",u.value=r}},function(r){if(n.status==="pending"){var u=n;u.status="rejected",u.reason=r}})}switch(n.status){case"fulfilled":return n.value;case"rejected":throw t=n.reason,b0(t),t}throw Hs=n,yr}}function Fs(t){try{var n=t._init;return n(t._payload)}catch(a){throw a!==null&&typeof a=="object"&&typeof a.then=="function"?(Hs=a,yr):a}}var Hs=null;function T0(){if(Hs===null)throw Error(s(459));var t=Hs;return Hs=null,t}function b0(t){if(t===yr||t===iu)throw Error(s(483))}var Mr=null,Bo=0;function su(t){var n=Bo;return Bo+=1,Mr===null&&(Mr=[]),E0(Mr,t,n)}function Qa(t,n){n=n.props.ref,t.ref=n!==void 0?n:null}function ru(t,n){throw n.$$typeof===T?Error(s(525)):(t=Object.prototype.toString.call(n),Error(s(31,t==="[object Object]"?"object with keys {"+Object.keys(n).join(", ")+"}":t)))}function A0(t){function n(J,H){if(t){var it=J.deletions;it===null?(J.deletions=[H],J.flags|=16):it.push(H)}}function a(J,H){if(!t)return null;for(;H!==null;)n(J,H),H=H.sibling;return null}function r(J){for(var H=new Map;J!==null;)J.key===null?H.set(J.index,J):H.set(J.key,J),J=J.sibling;return H}function u(J,H){return J=Ma(J,H),J.index=0,J.sibling=null,J}function c(J,H,it){return J.index=it,t?(it=J.alternate,it!==null?(it=it.index,it<H?(J.flags|=2,H):it):(J.flags|=134217730,H)):(J.flags|=1048576,H)}function g(J){return t&&J.alternate===null&&(J.flags|=134217730),J}function A(J,H,it,Mt){return H===null||H.tag!==6?(H=yf(it,J.mode,Mt),H.return=J,H):(H=u(H,it),H.return=J,H)}function I(J,H,it,Mt){var jt=it.type;return jt===V?(J=ht(J,H,it.props.children,Mt,it.key),Qa(J,it),J):H!==null&&(H.elementType===jt||typeof jt=="object"&&jt!==null&&jt.$$typeof===rt&&Fs(jt)===H.type)?(H=u(H,it.props),Qa(H,it),H.return=J,H):(H=jl(it.type,it.key,it.props,null,J.mode,Mt),Qa(H,it),H.return=J,H)}function $(J,H,it,Mt){return H===null||H.tag!==4||H.stateNode.containerInfo!==it.containerInfo||H.stateNode.implementation!==it.implementation?(H=Mf(it,J.mode,Mt),H.return=J,H):(H=u(H,it.children||[]),H.return=J,H)}function ht(J,H,it,Mt,jt){return H===null||H.tag!==7?(H=Us(it,J.mode,Mt,jt),H.return=J,H):(H=u(H,it),H.return=J,H)}function Et(J,H,it){if(typeof H=="string"&&H!==""||typeof H=="number"||typeof H=="bigint")return H=yf(""+H,J.mode,it),H.return=J,H;if(typeof H=="object"&&H!==null){switch(H.$$typeof){case U:return it=jl(H.type,H.key,H.props,null,J.mode,it),Qa(it,H),it.return=J,it;case F:return H=Mf(H,J.mode,it),H.return=J,H;case rt:return H=Fs(H),Et(J,H,it)}if(Pt(H)||Z(H))return H=Us(H,J.mode,it,null),H.return=J,H;if(typeof H.then=="function")return Et(J,su(H),it);if(H.$$typeof===tt)return Et(J,eu(J,H),it);ru(J,H)}return null}function j(J,H,it,Mt){var jt=H!==null?H.key:null;if(typeof it=="string"&&it!==""||typeof it=="number"||typeof it=="bigint")return jt!==null?null:A(J,H,""+it,Mt);if(typeof it=="object"&&it!==null){switch(it.$$typeof){case U:return it.key===jt?I(J,H,it,Mt):null;case F:return it.key===jt?$(J,H,it,Mt):null;case rt:return it=Fs(it),j(J,H,it,Mt)}if(Pt(it)||Z(it))return jt!==null?null:ht(J,H,it,Mt,null);if(typeof it.then=="function")return j(J,H,su(it),Mt);if(it.$$typeof===tt)return j(J,H,eu(J,it),Mt);ru(J,it)}return null}function ut(J,H,it,Mt,jt){if(typeof Mt=="string"&&Mt!==""||typeof Mt=="number"||typeof Mt=="bigint")return J=J.get(it)||null,A(H,J,""+Mt,jt);if(typeof Mt=="object"&&Mt!==null){switch(Mt.$$typeof){case U:return J=J.get(Mt.key===null?it:Mt.key)||null,I(H,J,Mt,jt);case F:return J=J.get(Mt.key===null?it:Mt.key)||null,$(H,J,Mt,jt);case rt:return Mt=Fs(Mt),ut(J,H,it,Mt,jt)}if(Pt(Mt)||Z(Mt))return J=J.get(it)||null,ht(H,J,Mt,jt,null);if(typeof Mt.then=="function")return ut(J,H,it,su(Mt),jt);if(Mt.$$typeof===tt)return ut(J,H,it,eu(H,Mt),jt);ru(H,Mt)}return null}function Ht(J,H,it,Mt){for(var jt=null,Ne=null,ie=H,se=H=0,xn=null;ie!==null&&se<it.length;se++){ie.index>se?(xn=ie,ie=null):xn=ie.sibling;var Ie=j(J,ie,it[se],Mt);if(Ie===null){ie===null&&(ie=xn);break}t&&ie&&Ie.alternate===null&&n(J,ie),H=c(Ie,H,se),Ne===null?jt=Ie:Ne.sibling=Ie,Ne=Ie,ie=xn}if(se===it.length)return a(J,ie),ye&&Ea(J,se),jt;if(ie===null){for(;se<it.length;se++)ie=Et(J,it[se],Mt),ie!==null&&(H=c(ie,H,se),Ne===null?jt=ie:Ne.sibling=ie,Ne=ie);return ye&&Ea(J,se),jt}for(ie=r(ie);se<it.length;se++)xn=ut(ie,J,se,it[se],Mt),xn!==null&&(t&&(Ie=xn.alternate,Ie!==null&&ie.delete(Ie.key===null?se:Ie.key)),H=c(xn,H,se),Ne===null?jt=xn:Ne.sibling=xn,Ne=xn);return t&&ie.forEach(function(gs){return n(J,gs)}),ye&&Ea(J,se),jt}function $t(J,H,it,Mt){if(it==null)throw Error(s(151));for(var jt=null,Ne=null,ie=H,se=H=0,xn=null,Ie=it.next();ie!==null&&!Ie.done;se++,Ie=it.next()){ie.index>se?(xn=ie,ie=null):xn=ie.sibling;var gs=j(J,ie,Ie.value,Mt);if(gs===null){ie===null&&(ie=xn);break}t&&ie&&gs.alternate===null&&n(J,ie),H=c(gs,H,se),Ne===null?jt=gs:Ne.sibling=gs,Ne=gs,ie=xn}if(Ie.done)return a(J,ie),ye&&Ea(J,se),jt;if(ie===null){for(;!Ie.done;se++,Ie=it.next())Ie=Et(J,Ie.value,Mt),Ie!==null&&(H=c(Ie,H,se),Ne===null?jt=Ie:Ne.sibling=Ie,Ne=Ie);return ye&&Ea(J,se),jt}for(ie=r(ie);!Ie.done;se++,Ie=it.next())Ie=ut(ie,J,se,Ie.value,Mt),Ie!==null&&(t&&(xn=Ie.alternate,xn!==null&&ie.delete(xn.key===null?se:xn.key)),H=c(Ie,H,se),Ne===null?jt=Ie:Ne.sibling=Ie,Ne=Ie);return t&&ie.forEach(function(hE){return n(J,hE)}),ye&&Ea(J,se),jt}function ge(J,H,it,Mt){if(typeof it=="object"&&it!==null&&it.type===V&&it.key===null&&it.props.ref===void 0&&(it=it.props.children),typeof it=="object"&&it!==null){switch(it.$$typeof){case U:t:{for(var jt=it.key;H!==null;){if(H.key===jt){if(jt=it.type,jt===V){if(H.tag===7){a(J,H.sibling),Mt=u(H,it.props.children),Qa(Mt,it),Mt.return=J,J=Mt;break t}}else if(H.elementType===jt||typeof jt=="object"&&jt!==null&&jt.$$typeof===rt&&Fs(jt)===H.type){a(J,H.sibling),Mt=u(H,it.props),Qa(Mt,it),Mt.return=J,J=Mt;break t}a(J,H);break}else n(J,H);H=H.sibling}it.type===V?(Mt=Us(it.props.children,J.mode,Mt,it.key),Qa(Mt,it),Mt.return=J,J=Mt):(Mt=jl(it.type,it.key,it.props,null,J.mode,Mt),Qa(Mt,it),Mt.return=J,J=Mt)}return g(J);case F:t:{for(jt=it.key;H!==null;){if(H.key===jt)if(H.tag===4&&H.stateNode.containerInfo===it.containerInfo&&H.stateNode.implementation===it.implementation){a(J,H.sibling),Mt=u(H,it.children||[]),Mt.return=J,J=Mt;break t}else{a(J,H);break}else n(J,H);H=H.sibling}Mt=Mf(it,J.mode,Mt),Mt.return=J,J=Mt}return g(J);case rt:return it=Fs(it),ge(J,H,it,Mt)}if(Pt(it))return Ht(J,H,it,Mt);if(Z(it)){if(jt=Z(it),typeof jt!="function")throw Error(s(150));return it=jt.call(it),$t(J,H,it,Mt)}if(typeof it.then=="function")return ge(J,H,su(it),Mt);if(it.$$typeof===tt)return ge(J,H,eu(J,it),Mt);ru(J,it)}return typeof it=="string"&&it!==""||typeof it=="number"||typeof it=="bigint"?(it=""+it,H!==null&&H.tag===6?(a(J,H.sibling),Mt=u(H,it),Mt.return=J,J=Mt):(a(J,H),Mt=yf(it,J.mode,Mt),Mt.return=J,J=Mt),g(J)):a(J,H)}return function(J,H,it,Mt){try{Bo=0;var jt=ge(J,H,it,Mt);return Mr=null,jt}catch(ie){if(ie===yr||ie===iu)throw ie;var Ne=Qn(29,ie,null,J.mode);return Ne.lanes=Mt,Ne.return=J,Ne}}}var Gs=A0(!0),R0=A0(!1),Ja=!1;function Uf(t){t.updateQueue={baseState:t.memoizedState,firstBaseUpdate:null,lastBaseUpdate:null,shared:{pending:null,lanes:0,hiddenCallbacks:null},callbacks:null}}function Lf(t,n){t=t.updateQueue,n.updateQueue===t&&(n.updateQueue={baseState:t.baseState,firstBaseUpdate:t.firstBaseUpdate,lastBaseUpdate:t.lastBaseUpdate,shared:t.shared,callbacks:null})}function $a(t){return{lane:t,tag:0,payload:null,callback:null,next:null}}function ts(t,n,a){var r=t.updateQueue;if(r===null)return null;if(r=r.shared,(Ge&2)!==0){var u=r.pending;return u===null?n.next=n:(n.next=u.next,u.next=n),r.pending=n,n=Zl(t),c0(t,null,a),n}return ql(t,r,n,a),Zl(t)}function Fo(t,n,a){if(n=n.updateQueue,n!==null&&(n=n.shared,(a&4194048)!==0)){var r=n.lanes;r&=t.pendingLanes,a|=r,n.lanes=a,So(t,a)}}function Of(t,n){var a=t.updateQueue,r=t.alternate;if(r!==null&&(r=r.updateQueue,a===r)){var u=null,c=null;if(a=a.firstBaseUpdate,a!==null){do{var g={lane:a.lane,tag:a.tag,payload:a.payload,callback:null,next:null};c===null?u=c=g:c=c.next=g,a=a.next}while(a!==null);c===null?u=c=n:c=c.next=n}else u=c=n;a={baseState:r.baseState,firstBaseUpdate:u,lastBaseUpdate:c,shared:r.shared,callbacks:r.callbacks},t.updateQueue=a;return}t=a.lastBaseUpdate,t===null?a.firstBaseUpdate=n:t.next=n,a.lastBaseUpdate=n}var Pf=!1;function Ho(){if(Pf){var t=Sr;if(t!==null)throw t}}function Go(t,n,a,r){Pf=!1;var u=t.updateQueue;Ja=!1;var c=u.firstBaseUpdate,g=u.lastBaseUpdate,A=u.shared.pending;if(A!==null){u.shared.pending=null;var I=A,$=I.next;I.next=null,g===null?c=$:g.next=$,g=I;var ht=t.alternate;ht!==null&&(ht=ht.updateQueue,A=ht.lastBaseUpdate,A!==g&&(A===null?ht.firstBaseUpdate=$:A.next=$,ht.lastBaseUpdate=I))}if(c!==null){var Et=u.baseState;g=0,ht=$=I=null,A=c;do{var j=A.lane&-536870913,ut=j!==A.lane;if(ut?(De&j)===j:(r&j)===j){j!==0&&j===zs&&(Pf=!0),ht!==null&&(ht=ht.next={lane:0,tag:A.tag,payload:A.payload,callback:null,next:null});t:{var Ht=t,$t=A;j=n;var ge=a;switch($t.tag){case 1:if(Ht=$t.payload,typeof Ht=="function"){Et=Ht.call(ge,Et,j);break t}Et=Ht;break t;case 3:Ht.flags=Ht.flags&-65537|128;case 0:if(Ht=$t.payload,j=typeof Ht=="function"?Ht.call(ge,Et,j):Ht,j==null)break t;Et=P({},Et,j);break t;case 2:Ja=!0}}j=A.callback,j!==null&&(t.flags|=64,ut&&(t.flags|=8192),ut=u.callbacks,ut===null?u.callbacks=[j]:ut.push(j))}else ut={lane:j,tag:A.tag,payload:A.payload,callback:A.callback,next:null},ht===null?($=ht=ut,I=Et):ht=ht.next=ut,g|=j;if(A=A.next,A===null){if(A=u.shared.pending,A===null)break;ut=A,A=ut.next,ut.next=null,u.lastBaseUpdate=ut,u.shared.pending=null}}while(!0);ht===null&&(I=Et),u.baseState=I,u.firstBaseUpdate=$,u.lastBaseUpdate=ht,c===null&&(u.shared.lanes=0),os|=g,t.lanes=g,t.memoizedState=Et}}function C0(t,n){if(typeof t!="function")throw Error(s(191,t));t.call(n)}function w0(t,n){var a=t.callbacks;if(a!==null)for(t.callbacks=null,t=0;t<a.length;t++)C0(a[t],n)}var es=_e(null),ou=_e(0);function D0(t,n){t=Da,ne(ou,t),ne(es,n),Da=t|n.baseLanes}function If(){ne(ou,Da),ne(es,es.current)}function zf(){Da=ou.current,ee(es),ee(ou)}var Un=_e(null),Bn=null;function ns(t){var n=t.alternate;ne(Ln,Ln.current&1),ne(Un,t),Bn===null&&(n===null||es.current!==null||n.memoizedState!==null)&&(Bn=t)}function Bf(t){ne(Ln,Ln.current),ne(Un,t),Bn===null&&(Bn=t)}function N0(t){t.tag===22?(ne(Ln,Ln.current),ne(Un,t),Bn===null&&(Bn=t)):is()}function is(){ne(Ln,Ln.current),ne(Un,Un.current)}function ui(t){ee(Un),Bn===t&&(Bn=null),ee(Ln)}var Ln=_e(0);function Vo(t,n){ne(Un,Un.current),ne(Ln,n)}function Ff(t){ee(Ln),ee(Un),Bn===t&&(Bn=null)}function lu(t){for(var n=t;n!==null;){if(n.tag===13){var a=n.memoizedState;if(a!==null&&(a=a.dehydrated,a===null||od(a)||ld(a)))return n}else if(n.tag===19&&n.memoizedProps.revealOrder!=="independent"){if((n.flags&128)!==0)return n}else if(n.child!==null){n.child.return=n,n=n.child;continue}if(n===t)break;for(;n.sibling===null;){if(n.return===null||n.return===t)return null;n=n.return}n.sibling.return=n.return,n=n.sibling}return null}var Aa=0,me=null,Qe=null,_n=null,uu=!1,Er=!1,Vs=!1,cu=0,Xo=0,Tr=null,Ly=0;function hn(){throw Error(s(321))}function Hf(t,n){if(n===null)return!1;for(var a=0;a<n.length&&a<t.length;a++)if(!li(t[a],n[a]))return!1;return!0}function Gf(t,n,a,r,u,c){return Aa=c,me=n,n.memoizedState=null,n.updateQueue=null,n.lanes=0,vt.H=t===null||t.memoizedState===null?pg:mg,Vs=!1,c=a(r,u),Vs=!1,Er&&(c=L0(n,a,r,u)),U0(t),c}function U0(t){vt.H=_u;var n=Qe!==null&&Qe.next!==null;if(Aa=0,_n=Qe=me=null,uu=!1,Xo=0,Tr=null,n)throw Error(s(300));t===null||vn||(t=t.dependencies,t!==null&&tu(t)&&(vn=!0))}function L0(t,n,a,r){me=t;var u=0;do{if(Er&&(Tr=null),Xo=0,Er=!1,25<=u)throw Error(s(301));if(u+=1,_n=Qe=null,t.updateQueue!=null){var c=t.updateQueue;c.lastEffect=null,c.events=null,c.stores=null,c.memoCache!=null&&(c.memoCache.index=0)}vt.H=Gy,c=n(a,r)}while(Er);return c}function Oy(){var t=vt.H,n=t.useState()[0];return n=typeof n.then=="function"?ko(n):n,t=t.useState()[0],(Qe!==null?Qe.memoizedState:null)!==t&&(me.flags|=1024),n}function Vf(){var t=cu!==0;return cu=0,t}function Xf(t,n,a){n.updateQueue=t.updateQueue,n.flags&=-2053,t.lanes&=~a}function kf(t){if(uu){for(t=t.memoizedState;t!==null;){var n=t.queue;n!==null&&(n.pending=null),t=t.next}uu=!1}Aa=0,_n=Qe=me=null,Er=!1,Xo=cu=0,Tr=null}function kn(){var t={memoizedState:null,baseState:null,baseQueue:null,queue:null,next:null};return _n===null?me.memoizedState=_n=t:_n=_n.next=t,_n}function mn(){if(Qe===null){var t=me.alternate;t=t!==null?t.memoizedState:null}else t=Qe.next;var n=_n===null?me.memoizedState:_n.next;if(n!==null)_n=n,Qe=t;else{if(t===null)throw me.alternate===null?Error(s(467)):Error(s(310));Qe=t,t={memoizedState:Qe.memoizedState,baseState:Qe.baseState,baseQueue:Qe.baseQueue,queue:Qe.queue,next:null},_n===null?me.memoizedState=_n=t:_n=_n.next=t}return _n}function fu(){return{lastEffect:null,events:null,stores:null,memoCache:null}}function ko(t){var n=Xo;return Xo+=1,Tr===null&&(Tr=[]),t=E0(Tr,t,n),n=me,(_n===null?n.memoizedState:_n.next)===null&&(n=n.alternate,vt.H=n===null||n.memoizedState===null?pg:mg),t}function hu(t){if(t!==null&&typeof t=="object"){if(typeof t.then=="function")return ko(t);if(t.$$typeof===_t)return;if(t.$$typeof===tt)return Nn(t)}throw Error(s(438,String(t)))}function Wf(t){var n=null,a=me.updateQueue;if(a!==null&&(n=a.memoCache),n==null){var r=me.alternate;r!==null&&(r=r.updateQueue,r!==null&&(r=r.memoCache,r!=null&&(n={data:r.data.map(function(u){return u.slice()}),index:0})))}if(n==null&&(n={data:[],index:0}),a===null&&(a=fu(),me.updateQueue=a),a.memoCache=n,a=n.data[n.index],a===void 0)for(a=n.data[n.index]=Array(t),r=0;r<t;r++)a[r]=Ot;return n.index++,a}function Ra(t,n){return typeof n=="function"?n(t):n}function du(t){var n=mn();return Yf(n,Qe,t)}function Yf(t,n,a){var r=t.queue;if(r===null)throw Error(s(311));r.lastRenderedReducer=a;var u=t.baseQueue,c=r.pending;if(c!==null){if(u!==null){var g=u.next;u.next=c.next,c.next=g}n.baseQueue=u=c,r.pending=null}if(c=t.baseState,u===null)t.memoizedState=c;else{n=u.next;var A=g=null,I=null,$=n,ht=!1;do{var Et=$.lane&-536870913;if(Et!==$.lane?(De&Et)===Et:(Aa&Et)===Et){var j=$.revertLane;if(j===0)I!==null&&(I=I.next={lane:0,revertLane:0,gesture:null,action:$.action,hasEagerState:$.hasEagerState,eagerState:$.eagerState,next:null}),Et===zs&&(ht=!0);else if((Aa&j)===j){$=$.next,j===zs&&(ht=!0);continue}else Et={lane:0,revertLane:$.revertLane,gesture:null,action:$.action,hasEagerState:$.hasEagerState,eagerState:$.eagerState,next:null},I===null?(A=I=Et,g=c):I=I.next=Et,me.lanes|=j,os|=j;Et=$.action,Vs&&a(c,Et),c=$.hasEagerState?$.eagerState:a(c,Et)}else j={lane:Et,revertLane:$.revertLane,gesture:$.gesture,action:$.action,hasEagerState:$.hasEagerState,eagerState:$.eagerState,next:null},I===null?(A=I=j,g=c):I=I.next=j,me.lanes|=Et,os|=Et;$=$.next}while($!==null&&$!==n);if(I===null?g=c:I.next=A,!li(c,t.memoizedState)&&(vn=!0,ht&&(a=Sr,a!==null)))throw a;t.memoizedState=c,t.baseState=g,t.baseQueue=I,r.lastRenderedState=c}return u===null&&(r.lanes=0),[t.memoizedState,r.dispatch]}function qf(t){var n=mn(),a=n.queue;if(a===null)throw Error(s(311));a.lastRenderedReducer=t;var r=a.dispatch,u=a.pending,c=n.memoizedState;if(u!==null){a.pending=null;var g=u=u.next;do c=t(c,g.action),g=g.next;while(g!==u);li(c,n.memoizedState)||(vn=!0),n.memoizedState=c,n.baseQueue===null&&(n.baseState=c),a.lastRenderedState=c}return[c,r]}function O0(t,n,a){var r=me,u=mn(),c=ye;if(c){if(a===void 0)throw Error(s(407));a=a()}else a=n();var g=!li((Qe||u).memoizedState,a);if(g&&(u.memoizedState=a,vn=!0),u=u.queue,Kf(z0.bind(null,r,u,t),[t]),t=u.getSnapshot!==n||g||_n!==null&&(_n.memoizedState.tag&1)!==0,br(t?9:8,{destroy:void 0},I0.bind(null,r,u,a,n),null),t){if(r.flags|=2048,$e===null)throw Error(s(349));c||(Aa&127)!==0||P0(r,n,a)}return a}function P0(t,n,a){t.flags|=16384,t={getSnapshot:n,value:a},n=me.updateQueue,n===null?(n=fu(),me.updateQueue=n,n.stores=[t]):(a=n.stores,a===null?n.stores=[t]:a.push(t))}function I0(t,n,a,r){n.value=a,n.getSnapshot=r,B0(n)&&F0(t)}function z0(t,n,a){return a(function(){B0(n)&&F0(t)})}function B0(t){var n=t.getSnapshot;t=t.value;try{var a=n();return!li(t,a)}catch{return!0}}function F0(t){var n=Ns(t,2);n!==null&&ei(n,t,2)}function Zf(t){var n=kn();if(typeof t=="function"){var a=t;if(t=a(),Vs){Ue(!0);try{a()}finally{Ue(!1)}}}return n.memoizedState=n.baseState=t,n.queue={pending:null,lanes:0,dispatch:null,lastRenderedReducer:Ra,lastRenderedState:t},n}function H0(t,n,a,r){return t.baseState=a,Yf(t,Qe,typeof r=="function"?r:Ra)}function Py(t,n,a,r,u){if(gu(t))throw Error(s(485));if(t=n.action,t!==null){var c={payload:u,action:t,next:null,isTransition:!0,status:"pending",value:null,reason:null,listeners:[],then:function(g){c.listeners.push(g)}};vt.T!==null?a(!0):c.isTransition=!1,r(c),a=n.pending,a===null?(c.next=n.pending=c,G0(n,c)):(c.next=a.next,n.pending=a.next=c)}}function G0(t,n){var a=n.action,r=n.payload,u=t.state;if(n.isTransition){var c=vt.T,g={};g.types=c!==null?c.types:null,vt.T=g;try{var A=a(u,r),I=vt.S;I!==null&&I(g,A),V0(t,n,A)}catch($){jf(t,n,$)}finally{c!==null&&g.types!==null&&(c.types=g.types),vt.T=c}}else try{c=a(u,r),V0(t,n,c)}catch($){jf(t,n,$)}}function V0(t,n,a){a!==null&&typeof a=="object"&&typeof a.then=="function"?a.then(function(r){X0(t,n,r)},function(r){return jf(t,n,r)}):X0(t,n,a)}function X0(t,n,a){n.status="fulfilled",n.value=a,k0(n),t.state=a,n=t.pending,n!==null&&(a=n.next,a===n?t.pending=null:(a=a.next,n.next=a,G0(t,a)))}function jf(t,n,a){var r=t.pending;if(t.pending=null,r!==null){r=r.next;do n.status="rejected",n.reason=a,k0(n),n=n.next;while(n!==r)}t.action=null}function k0(t){t=t.listeners;for(var n=0;n<t.length;n++)(0,t[n])()}function W0(t,n){return n}function Y0(t,n){if(ye){var a=$e.formState;if(a!==null){t:{var r=me;if(ye){if(en){e:{for(var u=en,c=Ri;u.nodeType!==8;){if(!c){u=null;break e}if(u=wi(u.nextSibling),u===null){u=null;break e}}c=u.data,u=c==="F!"||c==="F"?u:null}if(u){en=wi(u.nextSibling),r=u.data==="F!";break t}}ja(r)}r=!1}r&&(n=a[0])}}return a=kn(),a.memoizedState=a.baseState=n,r={pending:null,lanes:0,dispatch:null,lastRenderedReducer:W0,lastRenderedState:n},a.queue=r,a=fg.bind(null,me,r),r.dispatch=a,r=Zf(!1),c=eh.bind(null,me,!1,r.queue),r=kn(),u={state:n,dispatch:null,action:t,pending:null},r.queue=u,a=Py.bind(null,me,u,c,a),u.dispatch=a,r.memoizedState=t,[n,a,!1]}function q0(t){var n=mn();return Z0(n,Qe,t)}function Z0(t,n,a){if(n=Yf(t,n,W0)[0],t=du(Ra)[0],typeof n=="object"&&n!==null&&typeof n.then=="function")try{var r=ko(n)}catch(g){throw g===yr?iu:g}else r=n;n=mn();var u=n.queue,c=u.dispatch;return a!==n.memoizedState&&(me.flags|=2048,br(9,{destroy:void 0},Iy.bind(null,u,a),null)),[r,c,t]}function Iy(t,n){t.action=n}function j0(t){var n=mn(),a=Qe;if(a!==null)return Z0(n,a,t);mn(),n=n.memoizedState,a=mn();var r=a.queue.dispatch;return a.memoizedState=t,[n,r,!1]}function br(t,n,a,r){return t={tag:t,create:a,deps:r,inst:n,next:null},n=me.updateQueue,n===null&&(n=fu(),me.updateQueue=n),a=n.lastEffect,a===null?n.lastEffect=t.next=t:(r=a.next,a.next=t,t.next=r,n.lastEffect=t),t}function K0(){return mn().memoizedState}function pu(t,n,a,r){var u=kn();me.flags|=t,u.memoizedState=br(1|n,{destroy:void 0},a,r===void 0?null:r)}function mu(t,n,a,r){var u=mn();r=r===void 0?null:r;var c=u.memoizedState.inst;Qe!==null&&r!==null&&Hf(r,Qe.memoizedState.deps)?u.memoizedState=br(n,c,a,r):(me.flags|=t,u.memoizedState=br(1|n,c,a,r))}function Q0(t,n){pu(8390656,8,t,n)}function Kf(t,n){mu(2048,8,t,n)}function zy(t){me.flags|=4;var n=me.updateQueue;if(n===null)n=fu(),me.updateQueue=n,n.events=[t];else{var a=n.events;a===null?n.events=[t]:a.push(t)}}function J0(t){var n=mn().memoizedState;return zy({ref:n,nextImpl:t}),function(){if((Ge&2)!==0)throw Error(s(440));return n.impl.apply(void 0,arguments)}}function $0(t,n){return mu(4,2,t,n)}function tg(t,n){return mu(4,4,t,n)}function eg(t,n){if(typeof n=="function"){t=t();var a=n(t);return function(){typeof a=="function"?a():n(null)}}if(n!=null)return t=t(),n.current=t,function(){n.current=null}}function ng(t,n,a){a=a!=null?a.concat([t]):null,mu(4,4,eg.bind(null,n,t),a)}function Qf(){}function ig(t,n){var a=mn();n=n===void 0?null:n;var r=a.memoizedState;return n!==null&&Hf(n,r[1])?r[0]:(a.memoizedState=[t,n],t)}function ag(t,n){var a=mn();n=n===void 0?null:n;var r=a.memoizedState;if(n!==null&&Hf(n,r[1]))return r[0];if(r=t(),Vs){Ue(!0);try{t()}finally{Ue(!1)}}return a.memoizedState=[r,n],r}function Jf(t,n,a){return a===void 0||(Aa&1073741824)!==0&&(De&261930)===0?t.memoizedState=n:(t.memoizedState=a,t=p_(),me.lanes|=t,os|=t,a)}function sg(t,n,a,r){return li(a,n)?a:es.current!==null?(t=Jf(t,a,r),li(t,n)||(vn=!0),t):(Aa&106)===0||(Aa&1073741824)!==0&&(De&261930)===0?(vn=!0,t.memoizedState=a):(t=p_(),me.lanes|=t,os|=t,n)}function rg(t,n,a,r,u){var c=Ut.p;Ut.p=c!==0&&8>c?c:8;var g=vt.T,A={};A.types=g!==null?g.types:null,vt.T=A,eh(t,!1,n,a);try{var I=u(),$=vt.S;if($!==null&&$(A,I),I!==null&&typeof I=="object"&&typeof I.then=="function"){var ht=Uy(I,r);Wo(t,n,ht,di(t))}else Wo(t,n,r,di(t))}catch(Et){Wo(t,n,{then:function(){},status:"rejected",reason:Et},di())}finally{Ut.p=c,g!==null&&A.types!==null&&(g.types=A.types),vt.T=g}}function By(){}function $f(t,n,a,r){if(t.tag!==5)throw Error(s(476));var u=og(t).queue;rg(t,u,n,Te,a===null?By:function(){return lg(t),a(r)})}function og(t){var n=t.memoizedState;if(n!==null)return n;n={memoizedState:Te,baseState:Te,baseQueue:null,queue:{pending:null,lanes:0,dispatch:null,lastRenderedReducer:Ra,lastRenderedState:Te},next:null};var a={};return n.next={memoizedState:a,baseState:a,baseQueue:null,queue:{pending:null,lanes:0,dispatch:null,lastRenderedReducer:Ra,lastRenderedState:a},next:null},t.memoizedState=n,t=t.alternate,t!==null&&(t.memoizedState=n),n}function lg(t){var n=og(t);n.next===null&&(n=t.alternate.memoizedState),Wo(t,n.next.queue,{},di())}function th(){return Nn(kr)}function ug(){return mn().memoizedState}function cg(){return mn().memoizedState}function Fy(t){for(var n=t.return;n!==null;){switch(n.tag){case 24:case 3:var a=di();t=$a(a);var r=ts(n,t,a);r!==null&&(ei(r,n,a),Fo(r,n,a)),n={cache:Cf()},t.payload=n;return}n=n.return}}function Hy(t,n,a){var r=di();a={lane:r,revertLane:0,gesture:null,action:a,hasEagerState:!1,eagerState:null,next:null},gu(t)?hg(n,a):(a=xf(t,n,a,r),a!==null&&(ei(a,t,r),dg(a,n,r)))}function fg(t,n,a){var r=di();Wo(t,n,a,r)}function Wo(t,n,a,r){var u={lane:r,revertLane:0,gesture:null,action:a,hasEagerState:!1,eagerState:null,next:null};if(gu(t))hg(n,u);else{var c=t.alternate;if(t.lanes===0&&(c===null||c.lanes===0)&&(c=n.lastRenderedReducer,c!==null))try{var g=n.lastRenderedState,A=c(g,a);if(u.hasEagerState=!0,u.eagerState=A,li(A,g))return ql(t,n,u,0),$e===null&&Yl(),!1}catch{}if(a=xf(t,n,u,r),a!==null)return ei(a,t,r),dg(a,n,r),!0}return!1}function eh(t,n,a,r){if(r={lane:2,revertLane:Wh(),gesture:null,action:r,hasEagerState:!1,eagerState:null,next:null},gu(t)){if(n)throw Error(s(479))}else n=xf(t,a,r,2),n!==null&&ei(n,t,2)}function gu(t){var n=t.alternate;return t===me||n!==null&&n===me}function hg(t,n){Er=uu=!0;var a=t.pending;a===null?n.next=n:(n.next=a.next,a.next=n),t.pending=n}function dg(t,n,a){if((a&4194048)!==0){var r=n.lanes;r&=t.pendingLanes,a|=r,n.lanes=a,So(t,a)}}var _u={readContext:Nn,use:hu,useCallback:hn,useContext:hn,useEffect:hn,useImperativeHandle:hn,useLayoutEffect:hn,useInsertionEffect:hn,useMemo:hn,useReducer:hn,useRef:hn,useState:hn,useDebugValue:hn,useDeferredValue:hn,useTransition:hn,useSyncExternalStore:hn,useId:hn,useHostTransitionStatus:hn,useFormState:hn,useActionState:hn,useOptimistic:hn,useMemoCache:hn,useCacheRefresh:hn,useEffectEvent:hn},pg={readContext:Nn,use:hu,useCallback:function(t,n){return kn().memoizedState=[t,n===void 0?null:n],t},useContext:Nn,useEffect:Q0,useImperativeHandle:function(t,n,a){a=a!=null?a.concat([t]):null,pu(4194308,4,eg.bind(null,n,t),a)},useLayoutEffect:function(t,n){return pu(4194308,4,t,n)},useInsertionEffect:function(t,n){pu(4,2,t,n)},useMemo:function(t,n){var a=kn();n=n===void 0?null:n;var r=t();if(Vs){Ue(!0);try{t()}finally{Ue(!1)}}return a.memoizedState=[r,n],r},useReducer:function(t,n,a){var r=kn();if(a!==void 0){var u=a(n);if(Vs){Ue(!0);try{a(n)}finally{Ue(!1)}}}else u=n;return r.memoizedState=r.baseState=u,t={pending:null,lanes:0,dispatch:null,lastRenderedReducer:t,lastRenderedState:u},r.queue=t,t=t.dispatch=Hy.bind(null,me,t),[r.memoizedState,t]},useRef:function(t){var n=kn();return t={current:t},n.memoizedState=t},useState:function(t){t=Zf(t);var n=t.queue,a=fg.bind(null,me,n);return n.dispatch=a,[t.memoizedState,a]},useDebugValue:Qf,useDeferredValue:function(t,n){var a=kn();return Jf(a,t,n)},useTransition:function(){var t=Zf(!1);return t=rg.bind(null,me,t.queue,!0,!1),kn().memoizedState=t,[!1,t]},useSyncExternalStore:function(t,n,a){var r=me,u=kn();if(ye){if(a===void 0)throw Error(s(407));a=a()}else{if(a=n(),$e===null)throw Error(s(349));(De&127)!==0||P0(r,n,a)}u.memoizedState=a;var c={value:a,getSnapshot:n};return u.queue=c,Q0(z0.bind(null,r,c,t),[t]),r.flags|=2048,br(9,{destroy:void 0},I0.bind(null,r,c,a,n),null),a},useId:function(){var t=kn(),n=$e.identifierPrefix;if(ye){var a=Qi,r=Ki;a=(r&~(1<<32-fe(r)-1)).toString(32)+a,n="_"+n+"R_"+a,a=cu++,0<a&&(n+="H"+a.toString(32)),n+="_"}else a=Ly++,n="_"+n+"r_"+a.toString(32)+"_";return t.memoizedState=n},useHostTransitionStatus:th,useFormState:Y0,useActionState:Y0,useOptimistic:function(t){var n=kn();n.memoizedState=n.baseState=t;var a={pending:null,lanes:0,dispatch:null,lastRenderedReducer:null,lastRenderedState:null};return n.queue=a,n=eh.bind(null,me,!0,a),a.dispatch=n,[t,n]},useMemoCache:Wf,useCacheRefresh:function(){return kn().memoizedState=Fy.bind(null,me)},useEffectEvent:function(t){var n=kn(),a={impl:t};return n.memoizedState=a,function(){if((Ge&2)!==0)throw Error(s(440));return a.impl.apply(void 0,arguments)}}},mg={readContext:Nn,use:hu,useCallback:ig,useContext:Nn,useEffect:Kf,useImperativeHandle:ng,useInsertionEffect:$0,useLayoutEffect:tg,useMemo:ag,useReducer:du,useRef:K0,useState:function(){return du(Ra)},useDebugValue:Qf,useDeferredValue:function(t,n){var a=mn();return sg(a,Qe.memoizedState,t,n)},useTransition:function(){var t=du(Ra)[0],n=mn().memoizedState;return[typeof t=="boolean"?t:ko(t),n]},useSyncExternalStore:O0,useId:ug,useHostTransitionStatus:th,useFormState:q0,useActionState:q0,useOptimistic:function(t,n){var a=mn();return H0(a,Qe,t,n)},useMemoCache:Wf,useCacheRefresh:cg,useEffectEvent:J0},Gy={readContext:Nn,use:hu,useCallback:ig,useContext:Nn,useEffect:Kf,useImperativeHandle:ng,useInsertionEffect:$0,useLayoutEffect:tg,useMemo:ag,useReducer:qf,useRef:K0,useState:function(){return qf(Ra)},useDebugValue:Qf,useDeferredValue:function(t,n){var a=mn();return Qe===null?Jf(a,t,n):sg(a,Qe.memoizedState,t,n)},useTransition:function(){var t=qf(Ra)[0],n=mn().memoizedState;return[typeof t=="boolean"?t:ko(t),n]},useSyncExternalStore:O0,useId:ug,useHostTransitionStatus:th,useFormState:j0,useActionState:j0,useOptimistic:function(t,n){var a=mn();return Qe!==null?H0(a,Qe,t,n):(a.baseState=t,[t,a.queue.dispatch])},useMemoCache:Wf,useCacheRefresh:cg,useEffectEvent:J0};function nh(t,n,a,r){n=t.memoizedState,a=a(r,n),a=a==null?n:P({},n,a),t.memoizedState=a,t.lanes===0&&(t.updateQueue.baseState=a)}var ih={enqueueSetState:function(t,n,a){t=t._reactInternals;var r=di(),u=$a(r);u.payload=n,a!=null&&(u.callback=a),n=ts(t,u,r),n!==null&&(ei(n,t,r),Fo(n,t,r))},enqueueReplaceState:function(t,n,a){t=t._reactInternals;var r=di(),u=$a(r);u.tag=1,u.payload=n,a!=null&&(u.callback=a),n=ts(t,u,r),n!==null&&(ei(n,t,r),Fo(n,t,r))},enqueueForceUpdate:function(t,n){t=t._reactInternals;var a=di(),r=$a(a);r.tag=2,n!=null&&(r.callback=n),n=ts(t,r,a),n!==null&&(ei(n,t,a),Fo(n,t,a))}};function gg(t,n,a,r,u,c,g){return t=t.stateNode,typeof t.shouldComponentUpdate=="function"?t.shouldComponentUpdate(r,c,g):n.prototype&&n.prototype.isPureReactComponent?!No(a,r)||!No(u,c):!0}function _g(t,n,a,r){t=n.state,typeof n.componentWillReceiveProps=="function"&&n.componentWillReceiveProps(a,r),typeof n.UNSAFE_componentWillReceiveProps=="function"&&n.UNSAFE_componentWillReceiveProps(a,r),n.state!==t&&ih.enqueueReplaceState(n,n.state,null)}function Xs(t,n){var a=n;if("ref"in n){a={};for(var r in n)r!=="ref"&&(a[r]=n[r])}if(t=t.defaultProps){a===n&&(a=P({},a));for(var u in t)a[u]===void 0&&(a[u]=t[u])}return a}function vg(t){Wl(t)}function xg(t){console.error(t)}function Sg(t){Wl(t)}function vu(t,n){try{var a=t.onUncaughtError;a(n.value,{componentStack:n.stack})}catch(r){setTimeout(function(){throw r})}}function yg(t,n,a){try{var r=t.onCaughtError;r(a.value,{componentStack:a.stack,errorBoundary:n.tag===1?n.stateNode:null})}catch(u){setTimeout(function(){throw u})}}function ah(t,n,a){return a=$a(a),a.tag=3,a.payload={element:null},a.callback=function(){vu(t,n)},a}function Mg(t){return t=$a(t),t.tag=3,t}function Eg(t,n,a,r){var u=a.type.getDerivedStateFromError;if(typeof u=="function"){var c=r.value;t.payload=function(){return u(c)},t.callback=function(){yg(n,a,r)}}var g=a.stateNode;g!==null&&typeof g.componentDidCatch=="function"&&(t.callback=function(){yg(n,a,r),typeof u!="function"&&(ls===null?ls=new Set([this]):ls.add(this));var A=r.stack;this.componentDidCatch(r.value,{componentStack:A!==null?A:""})})}function Vy(t,n,a,r,u){if(a.flags|=32768,r!==null&&typeof r=="object"&&typeof r.then=="function"){if(n=a.alternate,n!==null&&Ps(n,a,u,!0),a=Un.current,a!==null){switch(a.tag){case 31:case 13:case 19:return Bn===null?Fu():a.alternate===null&&dn===0&&(dn=3),a.flags&=-257,a.flags|=65536,a.lanes=u,r===au?a.flags|=16384:(n=a.updateQueue,n===null?a.updateQueue=new Set([r]):n.add(r),Vh(t,r,u)),!1;case 22:return a.flags|=65536,r===au?a.flags|=16384:(n=a.updateQueue,n===null?(n={transitions:null,markerInstances:null,retryQueue:new Set([r])},a.updateQueue=n):(a=n.retryQueue,a===null?n.retryQueue=new Set([r]):a.add(r)),Vh(t,r,u)),!1}throw Error(s(435,a.tag))}return Vh(t,r,u),Fu(),!1}if(ye)return n=Un.current,n!==null?((n.flags&65536)===0&&(n.flags|=256),n.flags|=65536,n.lanes=u,r!==Tf&&(t=Error(s(422),{cause:r}),Oo(Ti(t,a)))):(r!==Tf&&(n=Error(s(423),{cause:r}),Oo(Ti(n,a))),t=t.current.alternate,t.flags|=65536,u&=-u,t.lanes|=u,r=Ti(r,a),u=ah(t.stateNode,r,u),Of(t,u),dn!==4&&(dn=2)),!1;var c=Error(s(520),{cause:r});if(c=Ti(c,a),$o===null?$o=[c]:$o.push(c),dn!==4&&(dn=2),n===null)return!0;r=Ti(r,a),a=n;do{switch(a.tag){case 3:return a.flags|=65536,t=u&-u,a.lanes|=t,t=ah(a.stateNode,r,t),Of(a,t),!1;case 1:if(n=a.type,c=a.stateNode,(a.flags&128)===0&&(typeof n.getDerivedStateFromError=="function"||c!==null&&typeof c.componentDidCatch=="function"&&(ls===null||!ls.has(c))))return a.flags|=65536,u&=-u,a.lanes|=u,u=Mg(u),Eg(u,t,a,r),Of(a,u),!1;break;case 22:if(a.memoizedState!==null)return a.flags|=65536,!1}a=a.return}while(a!==null);return!1}var sh=Error(s(461)),vn=!1;function Mn(t,n,a,r){n.child=t===null?R0(n,null,a,r):Gs(n,t.child,a,r)}function Tg(t,n,a,r,u){a=a.render;var c=n.ref;if("ref"in r){var g={};for(var A in r)A!=="ref"&&(g[A]=r[A])}else g=r;return Is(n),r=Gf(t,n,a,g,c,u),A=Vf(),t!==null&&!vn?(Xf(t,n,u),Ca(t,n,u)):(ye&&A&&Ql(n),n.flags|=1,Mn(t,n,r,u),n.child)}function bg(t,n,a,r,u){if(t===null){var c=a.type;return typeof c=="function"&&!Sf(c)&&c.defaultProps===void 0&&a.compare===null?(n.tag=15,n.type=c,Ag(t,n,c,r,u)):(t=jl(a.type,null,r,n,n.mode,u),t.ref=n.ref,t.return=n,n.child=t)}if(c=t.child,!dh(t,u)){var g=c.memoizedProps;if(a=a.compare,a=a!==null?a:No,a(g,r)&&t.ref===n.ref)return Ca(t,n,u)}return n.flags|=1,t=Ma(c,r),t.ref=n.ref,t.return=n,n.child=t}function Ag(t,n,a,r,u){if(t!==null){var c=t.memoizedProps;if(No(c,r)&&t.ref===n.ref)if(vn=!1,n.pendingProps=r=c,dh(t,u))(t.flags&131072)!==0&&(vn=!0);else return n.lanes=t.lanes,Ca(t,n,u)}return rh(t,n,a,r,u)}function Rg(t,n,a,r){var u=r.children,c=t!==null?t.memoizedState:null;if(t===null&&n.stateNode===null&&(n.stateNode={_visibility:1,_pendingMarkers:null,_retryCache:null,_transitions:null}),r.mode==="hidden"){if((n.flags&128)!==0){if(c=c!==null?c.baseLanes|a:a,t!==null){for(r=n.child=t.child,u=0;r!==null;)u=u|r.lanes|r.childLanes,r=r.sibling;r=u&~c}else r=0,n.child=null;return Cg(t,n,c,a,r)}if((a&536870912)!==0)n.memoizedState={baseLanes:0,cachePool:null},t!==null&&nu(n,c!==null?c.cachePool:null),c!==null?D0(n,c):If(),N0(n);else return r=n.lanes=536870912,Cg(t,n,c!==null?c.baseLanes|a:a,a,r)}else c!==null?(nu(n,c.cachePool),D0(n,c),is(),n.memoizedState=null):(t!==null&&nu(n,null),If(),is());return Mn(t,n,u,a),n.child}function Yo(t,n){return t!==null&&t.tag===22||n.stateNode!==null||(n.stateNode={_visibility:1,_pendingMarkers:null,_retryCache:null,_transitions:null}),n.sibling}function Cg(t,n,a,r,u){var c=Df();return c=c===null?null:{parent:gn._currentValue,pool:c},n.memoizedState={baseLanes:a,cachePool:c},t!==null&&nu(n,null),If(),N0(n),t!==null&&Ps(t,n,r,!0),n.childLanes=u,null}function xu(t,n){return n=Su({mode:n.mode,children:n.children},t.mode),n.ref=t.ref,t.child=n,n.return=t,n}function wg(t,n,a){return Gs(n,t.child,null,a),t=xu(n,n.pendingProps),t.flags|=2,ui(n),n.memoizedState=null,t}function Xy(t,n,a){var r=n.pendingProps,u=(n.flags&128)!==0;if(n.flags&=-129,t===null){if(ye){if(r.mode==="hidden")return t=xu(n,r),n.lanes=536870912,t.memoizedState={baseLanes:0,cachePool:null},Yo(null,t);if(Bf(n),(t=en)?(t=ev(t,Ri),t=t!==null&&t.data==="&"?t:null,t!==null&&(n.memoizedState={dehydrated:t,treeContext:qa!==null?{id:Ki,overflow:Qi}:null,retryLane:536870912,hydrationErrors:null},a=h0(t),a.return=n,n.child=a,An=n,en=null)):t=null,t===null)throw ja(n);return n.lanes=536870912,null}return xu(n,r)}var c=t.memoizedState;if(c!==null){var g=c.dehydrated;if(Bf(n),u)if(n.flags&256)n.flags&=-257,n=wg(t,n,a);else if(n.memoizedState!==null)n.child=t.child,n.flags|=128,n=null;else throw Error(s(558));else if(vn||Ps(t,n,a,!1),u=(a&t.childLanes)!==0,vn||u){if(es.current===null){if(r=$e,r!==null&&(g=yo(r,a),g!==0&&g!==c.retryLane))throw c.retryLane=g,Ns(t,g),ei(r,t,g),sh;Fu()}n=wg(t,n,a)}else t=c.treeContext,en=wi(g.nextSibling),An=n,ye=!0,Za=null,Ri=!1,t!==null&&m0(n,t),n=xu(n,r),n.flags|=134221824;return n}return t=Ma(t.child,{mode:r.mode,children:r.children}),t.ref=n.ref,n.child=t,t.return=n,t}function Ar(t,n){var a=n.ref;if(a===null)t!==null&&t.ref!==null&&(n.flags|=4194816);else{if(typeof a!="function"&&typeof a!="object")throw Error(s(284));(t===null||t.ref!==a)&&(n.flags|=4194816)}}function rh(t,n,a,r,u){return Is(n),a=Gf(t,n,a,r,void 0,u),r=Vf(),t!==null&&!vn?(Xf(t,n,u),Ca(t,n,u)):(ye&&r&&Ql(n),n.flags|=1,Mn(t,n,a,u),n.child)}function Dg(t,n,a,r,u,c){return Is(n),n.updateQueue=null,a=L0(n,r,a,u),U0(t),r=Vf(),t!==null&&!vn?(Xf(t,n,c),Ca(t,n,c)):(ye&&r&&Ql(n),n.flags|=1,Mn(t,n,a,c),n.child)}function Ng(t,n,a,r,u){if(Is(n),n.stateNode===null){var c=gr,g=a.contextType;typeof g=="object"&&g!==null&&(c=Nn(g)),c=new a(r,c),n.memoizedState=c.state!==null&&c.state!==void 0?c.state:null,c.updater=ih,n.stateNode=c,c._reactInternals=n,c=n.stateNode,c.props=r,c.state=n.memoizedState,c.refs={},Uf(n),g=a.contextType,c.context=typeof g=="object"&&g!==null?Nn(g):gr,c.state=n.memoizedState,g=a.getDerivedStateFromProps,typeof g=="function"&&(nh(n,a,g,r),c.state=n.memoizedState),typeof a.getDerivedStateFromProps=="function"||typeof c.getSnapshotBeforeUpdate=="function"||typeof c.UNSAFE_componentWillMount!="function"&&typeof c.componentWillMount!="function"||(g=c.state,typeof c.componentWillMount=="function"&&c.componentWillMount(),typeof c.UNSAFE_componentWillMount=="function"&&c.UNSAFE_componentWillMount(),g!==c.state&&ih.enqueueReplaceState(c,c.state,null),Go(n,r,c,u),Ho(),c.state=n.memoizedState),typeof c.componentDidMount=="function"&&(n.flags|=4194308),r=!0}else if(t===null){c=n.stateNode;var A=n.memoizedProps,I=Xs(a,A);c.props=I;var $=c.context,ht=a.contextType;g=gr,typeof ht=="object"&&ht!==null&&(g=Nn(ht));var Et=a.getDerivedStateFromProps;ht=typeof Et=="function"||typeof c.getSnapshotBeforeUpdate=="function",A=n.pendingProps!==A,ht||typeof c.UNSAFE_componentWillReceiveProps!="function"&&typeof c.componentWillReceiveProps!="function"||(A||$!==g)&&_g(n,c,r,g),Ja=!1;var j=n.memoizedState;c.state=j,Go(n,r,c,u),Ho(),$=n.memoizedState,A||j!==$||Ja?(typeof Et=="function"&&(nh(n,a,Et,r),$=n.memoizedState),(I=Ja||gg(n,a,I,r,j,$,g))?(ht||typeof c.UNSAFE_componentWillMount!="function"&&typeof c.componentWillMount!="function"||(typeof c.componentWillMount=="function"&&c.componentWillMount(),typeof c.UNSAFE_componentWillMount=="function"&&c.UNSAFE_componentWillMount()),typeof c.componentDidMount=="function"&&(n.flags|=4194308)):(typeof c.componentDidMount=="function"&&(n.flags|=4194308),n.memoizedProps=r,n.memoizedState=$),c.props=r,c.state=$,c.context=g,r=I):(typeof c.componentDidMount=="function"&&(n.flags|=4194308),r=!1)}else{c=n.stateNode,Lf(t,n),g=n.memoizedProps,ht=Xs(a,g),c.props=ht,Et=n.pendingProps,j=c.context,$=a.contextType,I=gr,typeof $=="object"&&$!==null&&(I=Nn($)),A=a.getDerivedStateFromProps,($=typeof A=="function"||typeof c.getSnapshotBeforeUpdate=="function")||typeof c.UNSAFE_componentWillReceiveProps!="function"&&typeof c.componentWillReceiveProps!="function"||(g!==Et||j!==I)&&_g(n,c,r,I),Ja=!1,j=n.memoizedState,c.state=j,Go(n,r,c,u),Ho();var ut=n.memoizedState;g!==Et||j!==ut||Ja||t!==null&&t.dependencies!==null&&tu(t.dependencies)?(typeof A=="function"&&(nh(n,a,A,r),ut=n.memoizedState),(ht=Ja||gg(n,a,ht,r,j,ut,I)||t!==null&&t.dependencies!==null&&tu(t.dependencies))?($||typeof c.UNSAFE_componentWillUpdate!="function"&&typeof c.componentWillUpdate!="function"||(typeof c.componentWillUpdate=="function"&&c.componentWillUpdate(r,ut,I),typeof c.UNSAFE_componentWillUpdate=="function"&&c.UNSAFE_componentWillUpdate(r,ut,I)),typeof c.componentDidUpdate=="function"&&(n.flags|=4),typeof c.getSnapshotBeforeUpdate=="function"&&(n.flags|=1024)):(typeof c.componentDidUpdate!="function"||g===t.memoizedProps&&j===t.memoizedState||(n.flags|=4),typeof c.getSnapshotBeforeUpdate!="function"||g===t.memoizedProps&&j===t.memoizedState||(n.flags|=1024),n.memoizedProps=r,n.memoizedState=ut),c.props=r,c.state=ut,c.context=I,r=ht):(typeof c.componentDidUpdate!="function"||g===t.memoizedProps&&j===t.memoizedState||(n.flags|=4),typeof c.getSnapshotBeforeUpdate!="function"||g===t.memoizedProps&&j===t.memoizedState||(n.flags|=1024),r=!1)}return c=r,Ar(t,n),r=(n.flags&128)!==0,c||r?(c=n.stateNode,a=r&&typeof a.getDerivedStateFromError!="function"?null:c.render(),n.flags|=1,t!==null&&r?(n.child=Gs(n,t.child,null,u),n.child=Gs(n,null,a,u)):Mn(t,n,a,u),n.memoizedState=c.state,t=n.child):t=Ca(t,n,u),t}function Ug(t,n,a,r){return Ls(),n.flags|=256,Mn(t,n,a,r),n.child}var oh={dehydrated:null,treeContext:null,retryLane:0,hydrationErrors:null};function lh(t){return{baseLanes:t,cachePool:y0()}}function uh(t,n,a){return t=t!==null?t.childLanes&~a:0,n&&(t|=hi),t}function Lg(t,n,a){var r=n.pendingProps,u=!1,c=(n.flags&128)!==0,g;if((g=c)||(g=t!==null&&t.memoizedState===null?!1:(Ln.current&2)!==0),g&&(u=!0,n.flags&=-129),g=(n.flags&32)!==0,n.flags&=-33,t===null){if(ye){if(u?ns(n):is(),(t=en)?(t=ev(t,Ri),t=t!==null&&t.data!=="&"?t:null,t!==null&&(n.memoizedState={dehydrated:t,treeContext:qa!==null?{id:Ki,overflow:Qi}:null,retryLane:536870912,hydrationErrors:null},a=h0(t),a.return=n,n.child=a,An=n,en=null)):t=null,t===null)throw ja(n);return ld(t)?n.lanes=32:n.lanes=536870912,null}return c=r.children,r=r.fallback,u?(is(),u=n.mode,c=Su({mode:"hidden",children:c},u),r=Us(r,u,a,null),c.return=n,r.return=n,c.sibling=r,n.child=c,r=n.child,r.memoizedState=lh(a),r.childLanes=uh(t,g,a),n.memoizedState=oh,Yo(null,r)):(ns(n),ch(n,c))}var A=t.memoizedState;if(A!==null){var I=A.dehydrated;if(I!==null)return ky(t,n,c,g,r,I,A,a)}return u?(is(),u=r.fallback,c=n.mode,A=t.child,I=A.sibling,r=Ma(A,{mode:"hidden",children:r.children}),r.subtreeFlags=A.subtreeFlags&1206910976,I!==null?u=Ma(I,u):(u=Us(u,c,a,null),u.flags|=2),u.return=n,r.return=n,r.sibling=u,n.child=r,Yo(null,r),r=n.child,u=t.child.memoizedState,u===null?u=lh(a):(c=u.cachePool,c!==null?(A=gn._currentValue,c=c.parent!==A?{parent:A,pool:A}:c):c=y0(),u={baseLanes:u.baseLanes|a,cachePool:c}),r.memoizedState=u,r.childLanes=uh(t,g,a),n.memoizedState=oh,Yo(t.child,r)):(ns(n),a=t.child,t=a.sibling,a=Ma(a,{mode:"visible",children:r.children}),a.return=n,a.sibling=null,t!==null&&(g=n.deletions,g===null?(n.deletions=[t],n.flags|=16):g.push(t)),n.child=a,n.memoizedState=null,a)}function ch(t,n){return n=Su({mode:"visible",children:n},t.mode),n.return=t,t.child=n}function Su(t,n){return t=Qn(22,t,null,n),t.lanes=0,t}function yu(t,n,a){return Gs(n,t.child,null,a),t=ch(n,n.pendingProps.children),t.flags|=2,n.memoizedState=null,t}function ky(t,n,a,r,u,c,g,A){if(a)return n.flags&256?(ns(n),n.flags&=-257,yu(t,n,A)):n.memoizedState!==null?(is(),n.child=t.child,n.flags|=128,null):(is(),c=u.fallback,g=n.mode,u=Su({mode:"visible",children:u.children},g),c=Us(c,g,A,null),c.flags|=2,u.return=n,c.return=n,u.sibling=c,n.child=u,Gs(n,t.child,null,A),u=n.child,u.memoizedState=lh(A),u.childLanes=uh(t,r,A),n.memoizedState=oh,Yo(null,u));if(ns(n),ld(c)){if(r=c.nextSibling&&c.nextSibling.dataset,r)var I=r.dgst;return r=I,r!==""&&(u=Error(s(419)),u.stack="",u.digest=r,Oo({value:u,source:null,stack:null})),yu(t,n,A)}if(vn||Ps(t,n,A,!1),r=(A&t.childLanes)!==0,vn||r){if(es.current!==null)return yu(t,n,A);if(r=$e,r!==null&&(u=yo(r,A),u!==0&&u!==g.retryLane))throw g.retryLane=u,Ns(t,u),ei(r,t,u),sh;return od(c)||Fu(),yu(t,n,A)}return od(c)?(n.flags|=192,n.child=t.child,null):(t=g.treeContext,en=wi(c.nextSibling),An=n,ye=!0,Za=null,Ri=!1,t!==null&&m0(n,t),n=ch(n,u.children),n.flags|=134221824,n)}function Og(t,n,a){t.lanes|=n;var r=t.alternate;r!==null&&(r.lanes|=n),$l(t.return,n,a)}function Pg(t){for(var n=null;t!==null;){var a=t.alternate;a!==null&&lu(a)===null&&(n=t),t=t.sibling}return n}function Mu(t,n,a,r,u,c){var g=t.memoizedState;g===null?t.memoizedState={isBackwards:n,rendering:null,renderingStartTime:0,last:r,tail:a,tailMode:u,treeForkCount:c}:(g.isBackwards=n,g.rendering=null,g.renderingStartTime=0,g.last=r,g.tail=a,g.tailMode=u,g.treeForkCount=c)}function fh(t){var n=t.child;for(t.child=null;n!==null;){var a=n.sibling;n.sibling=t.child,t.child=n,n=a}}function hh(t,n,a){var r=n.pendingProps,u=r.revealOrder,c=r.tail;r=r.children;var g=Ln.current;if(n.flags&128)return Vo(n,g),null;var A=(g&2)!==0;if(A?(g=g&1|2,n.flags|=128):g&=1,Vo(n,g),u==="backwards"&&t!==null?(fh(t),Mn(t,n,r,a),fh(t)):Mn(t,n,r,a),r=ye?Lo:0,!A&&t!==null&&(t.flags&128)!==0)t:for(t=n.child;t!==null;){if(t.tag===13)t.memoizedState!==null&&Og(t,a,n);else if(t.tag===19)Og(t,a,n);else if(t.child!==null){t.child.return=t,t=t.child;continue}if(t===n)break t;for(;t.sibling===null;){if(t.return===null||t.return===n)break t;t=t.return}t.sibling.return=t.return,t=t.sibling}switch(u){case"backwards":a=Pg(n.child),a===null?(u=n.child,n.child=null):(u=a.sibling,a.sibling=null,fh(n)),Mu(n,!0,u,null,c,r);break;case"unstable_legacy-backwards":for(a=null,u=n.child,n.child=null;u!==null;){if(t=u.alternate,t!==null&&lu(t)===null){n.child=u;break}t=u.sibling,u.sibling=a,a=u,u=t}Mu(n,!0,a,null,c,r);break;case"together":Mu(n,!1,null,null,void 0,r);break;case"independent":n.memoizedState=null;break;default:a=Pg(n.child),a===null?(u=n.child,n.child=null):(u=a.sibling,a.sibling=null),Mu(n,!1,u,a,c,r)}return n.child}function Ig(t,n,a){var r=n.pendingProps;return Ka(n,n.type,r.value),Mn(t,n,r.children,a),n.child}function Ca(t,n,a){if(t!==null&&(n.dependencies=t.dependencies),os|=n.lanes,(a&n.childLanes)===0)if(t!==null){if(Ps(t,n,a,!1),(a&n.childLanes)===0)return null}else return null;if(t!==null&&n.child!==t.child)throw Error(s(153));if(n.child!==null){for(t=n.child,a=Ma(t,t.pendingProps),n.child=a,a.return=n;t.sibling!==null;)t=t.sibling,a=a.sibling=Ma(t,t.pendingProps),a.return=n;a.sibling=null}return n.child}function dh(t,n){return(t.lanes&n)!==0?!0:(t=t.dependencies,!!(t!==null&&tu(t)))}function Wy(t,n,a){switch(n.tag){case 3:X(n,n.stateNode.containerInfo),Ka(n,gn,t.memoizedState.cache),Ls();break;case 27:case 5:Ee(n);break;case 4:X(n,n.stateNode.containerInfo);break;case 10:Ka(n,n.type,n.memoizedProps.value);break;case 31:if(n.memoizedState!==null)return n.flags|=128,Bf(n),null;break;case 13:var r=n.memoizedState;if(r!==null){if(r.dehydrated!==null)return ns(n),n.flags|=128,null;r=Ps(t,n,a,!1);var u=n.child.childLanes;return r||(a&u)!==0?Lg(t,n,a):(ns(n),t=Ca(t,n,a),t!==null?t.sibling:null)}ns(n);break;case 19:if(n.flags&128)return hh(t,n,a);if(u=(t.flags&128)!==0,r=(a&n.childLanes)!==0,r||(Ps(t,n,a,!1),r=(a&n.childLanes)!==0),u){if(r)return hh(t,n,a);n.flags|=128}if(u=n.memoizedState,u!==null&&(u.rendering=null,u.tail=null,u.lastEffect=null),Vo(n,Ln.current),r)break;return null;case 22:return n.lanes=0,Rg(t,n,a,n.pendingProps);case 24:Ka(n,gn,t.memoizedState.cache)}return Ca(t,n,a)}function zg(t,n,a){if(t!==null)if(t.memoizedProps!==n.pendingProps)vn=!0;else{if(!dh(t,a)&&(n.flags&128)===0)return vn=!1,Wy(t,n,a);vn=(t.flags&131072)!==0}else vn=!1,ye&&(n.flags&1048576)!==0&&p0(n,Lo,n.index);switch(n.lanes=0,n.tag){case 16:t:{var r=n.pendingProps;if(t=Fs(n.elementType),n.type=t,typeof t=="function")Sf(t)?(r=Xs(t,r),n.tag=1,n=Ng(null,n,t,r,a)):(n.tag=0,n=rh(null,n,t,r,a));else{if(t!=null){var u=t.$$typeof;if(u===W){n.tag=11,n=Tg(null,n,t,r,a);break t}else if(u===ct){n.tag=14,n=bg(null,n,t,r,a);break t}else if(u===tt){n.tag=10,n.type=t,n=Ig(null,n,a);break t}}throw n=wt(t)||t,Error(s(306,n,""))}}return n;case 0:return rh(t,n,n.type,n.pendingProps,a);case 1:return r=n.type,u=Xs(r,n.pendingProps),Ng(t,n,r,u,a);case 3:t:{if(X(n,n.stateNode.containerInfo),t===null)throw Error(s(387));r=n.pendingProps;var c=n.memoizedState;u=c.element,Lf(t,n),Go(n,r,null,a);var g=n.memoizedState;if(r=g.cache,Ka(n,gn,r),r!==c.cache&&Rf(n,[gn],a,!0),Ho(),r=g.element,c.isDehydrated)if(c={element:r,isDehydrated:!1,cache:g.cache},n.updateQueue.baseState=c,n.memoizedState=c,n.flags&256){n=Ug(t,n,r,a);break t}else if(r!==u){u=Ti(Error(s(424)),n),Oo(u),n=Ug(t,n,r,a);break t}else for(t=n.stateNode.containerInfo,t.nodeType===9?t=t.body:t=t.nodeName==="HTML"?t.ownerDocument.body:t,en=wi(t.firstChild),An=n,ye=!0,Za=null,Ri=!0,a=R0(n,null,r,a),n.child=a;a;)a.flags=a.flags&-3|134221824,a=a.sibling;else{if(Ls(),r===u){n=Ca(t,n,a);break t}Mn(t,n,r,a)}n=n.child}return n;case 26:return Ar(t,n),t===null?(a=lv(n.type,null,n.pendingProps,null))?n.memoizedState=a:ye||(n.stateNode=G_(n.type,n.pendingProps,Pe.current,n)):n.memoizedState=lv(n.type,t.memoizedProps,n.pendingProps,t.memoizedState),null;case 27:return Ee(n),t===null&&ye&&(r=n.stateNode=av(n.type,n.pendingProps,Pe.current),An=n,Ri=!0,u=en,fs(n.type)?(ud=u,en=wi(r.firstChild)):en=u),Mn(t,n,n.pendingProps.children,a),Ar(t,n),t===null&&(n.flags|=4194304),n.child;case 5:return t===null&&ye&&((u=r=en)&&(r=FM(r,n.type,n.pendingProps,Ri),r!==null?(n.stateNode=r,An=n,en=wi(r.firstChild),Ri=!1,u=!0):u=!1),u||ja(n)),Ee(n),u=n.type,c=n.pendingProps,g=t!==null?t.memoizedProps:null,r=c.children,td(u,c)?r=null:g!==null&&td(u,g)&&(n.flags|=32),n.memoizedState!==null&&(u=Gf(t,n,Oy,null,null,a),kr._currentValue=u),Ar(t,n),Mn(t,n,r,a),n.child;case 6:return t===null&&ye&&((t=a=en)&&(a=HM(a,n.pendingProps,Ri),a!==null?(n.stateNode=a,An=n,en=null,t=!0):t=!1),t||ja(n)),null;case 13:return Lg(t,n,a);case 4:return X(n,n.stateNode.containerInfo),r=n.pendingProps,t===null?n.child=Gs(n,null,r,a):Mn(t,n,r,a),n.child;case 11:return Tg(t,n,n.type,n.pendingProps,a);case 7:return r=n.pendingProps,Ar(t,n),Mn(t,n,r,a),n.child;case 8:return Mn(t,n,n.pendingProps.children,a),n.child;case 12:return Mn(t,n,n.pendingProps.children,a),n.child;case 10:return Ig(t,n,a);case 9:return u=n.type._context,r=n.pendingProps.children,Is(n),u=Nn(u),r=r(u),n.flags|=1,Mn(t,n,r,a),n.child;case 14:return bg(t,n,n.type,n.pendingProps,a);case 15:return Ag(t,n,n.type,n.pendingProps,a);case 19:return hh(t,n,a);case 31:return Xy(t,n,a);case 22:return Rg(t,n,a,n.pendingProps);case 24:return Is(n),r=Nn(gn),t===null?(u=Df(),u===null&&(u=$e,c=Cf(),u.pooledCache=c,c.refCount++,c!==null&&(u.pooledCacheLanes|=a),u=c),n.memoizedState={parent:r,cache:u},Uf(n),Ka(n,gn,u)):((t.lanes&a)!==0&&(Lf(t,n),Go(n,null,null,a),Ho()),u=t.memoizedState,c=n.memoizedState,u.parent!==r?(u={parent:r,cache:r},n.memoizedState=u,n.lanes===0&&(n.memoizedState=n.updateQueue.baseState=u),Ka(n,gn,r)):(r=c.cache,Ka(n,gn,r),r!==u.cache&&Rf(n,[gn],a,!0))),Mn(t,n,n.pendingProps.children,a),n.child;case 30:return n.stateNode===null&&(n.stateNode={autoName:null,paired:null,clones:null,ref:null}),r=n.pendingProps,r.name!=null&&r.name!=="auto"?n.flags|=t===null?18882560:18874368:ye&&Ql(n),t!==null&&t.memoizedProps.name!==r.name?n.flags|=4194816:Ar(t,n),Mn(t,n,r.children,a),n.child;case 29:throw n.pendingProps}throw Error(s(156,n.tag))}function wa(t){t.flags|=4}function ph(t,n,a,r,u){var c;if((c=(t.mode&32)!==0)&&(c=a===null?hv(n,r):hv(n,r)&&(r.src!==a.src||r.srcSet!==a.srcSet)),c){if(t.flags|=16777216,(u&335544128)===u)if(t.stateNode.complete)t.flags|=8192;else if(v_())t.flags|=8192;else throw Hs=au,Nf}else t.flags&=-16777217}function Bg(t,n){if(n.type!=="stylesheet"||(n.state.loading&4)!==0)t.flags&=-16777217;else if(t.flags|=16777216,!dv(n))if(v_())t.flags|=8192;else throw Hs=au,Nf}function Eu(t,n){n!==null&&(t.flags|=4),t.flags&16384&&(n=t.tag!==22?xo():536870912,t.lanes|=n,Nr|=n)}function qo(t,n){if(!ye)switch(t.tailMode){case"visible":break;case"collapsed":for(var a=t.tail,r=null;a!==null;)a.alternate!==null&&(r=a),a=a.sibling;r===null?n||t.tail===null?t.tail=null:t.tail.sibling=null:r.sibling=null;break;default:for(n=t.tail,a=null;n!==null;)n.alternate!==null&&(a=n),n=n.sibling;a===null?t.tail=null:a.sibling=null}}function nn(t){var n=t.alternate!==null&&t.alternate.child===t.child,a=0,r=0;if(n)for(var u=t.child;u!==null;)a|=u.lanes|u.childLanes,r|=u.subtreeFlags&1206910976,r|=u.flags&1206910976,u.return=t,u=u.sibling;else for(u=t.child;u!==null;)a|=u.lanes|u.childLanes,r|=u.subtreeFlags,r|=u.flags,u.return=t,u=u.sibling;return t.subtreeFlags|=r,t.childLanes=a,n}function Yy(t,n,a){var r=n.pendingProps;switch(Ef(n),n.tag){case 16:case 15:case 0:case 11:case 7:case 8:case 12:case 9:case 14:return nn(n),null;case 1:return nn(n),null;case 3:return a=n.stateNode,r=null,t!==null&&(r=t.memoizedState.cache),n.memoizedState.cache!==r&&(n.flags|=2048),ba(gn),je(),a.pendingContext&&(a.context=a.pendingContext,a.pendingContext=null),(t===null||t.child===null)&&(xr(n)?wa(n):t===null||t.memoizedState.isDehydrated&&(n.flags&256)===0||(n.flags|=1024,bf())),nn(n),null;case 26:var u=n.type,c=n.memoizedState;return t===null?(wa(n),c!==null?(nn(n),Bg(n,c)):(nn(n),ph(n,u,null,r,a))):c?c!==t.memoizedState?(wa(n),nn(n),Bg(n,c)):(nn(n),n.flags&=-16777217):(t=t.memoizedProps,t!==r&&wa(n),nn(n),ph(n,u,t,r,a)),null;case 27:if(L(n),a=Pe.current,u=n.type,t!==null&&n.stateNode!=null)t.memoizedProps!==r&&wa(n);else{if(!r){if(n.stateNode===null)throw Error(s(166));return nn(n),n.subtreeFlags&=-33554433,null}t=Be.current,xr(n)?g0(n):(t=av(u,r,a),n.stateNode=t,wa(n))}return nn(n),n.subtreeFlags&=-33554433,null;case 5:if(L(n),u=n.type,t!==null&&n.stateNode!=null)t.memoizedProps!==r&&wa(n);else{if(!r){if(n.stateNode===null)throw Error(s(166));return nn(n),n.subtreeFlags&=-33554433,null}if(c=Be.current,xr(n))g0(n);else{var g=al(Pe.current);switch(c){case 1:c=g.createElementNS("http://www.w3.org/2000/svg",u);break;case 2:c=g.createElementNS("http://www.w3.org/1998/Math/MathML",u);break;default:switch(u){case"svg":c=g.createElementNS("http://www.w3.org/2000/svg",u);break;case"math":c=g.createElementNS("http://www.w3.org/1998/Math/MathML",u);break;case"script":c=g.createElement("div"),c.innerHTML="<script><\/script>",c=c.removeChild(c.firstChild);break;case"select":c=typeof r.is=="string"?g.createElement("select",{is:r.is}):g.createElement("select"),r.multiple?c.multiple=!0:r.size&&(c.size=r.size);break;default:c=typeof r.is=="string"?g.createElement(u,{is:r.is}):g.createElement(u)}}c[b]=n,c[B]=r;t:for(g=n.child;g!==null;){if(g.tag===5||g.tag===6)c.appendChild(g.stateNode);else if(g.tag!==4&&g.tag!==27&&g.child!==null){g.child.return=g,g=g.child;continue}if(g===n)break t;for(;g.sibling===null;){if(g.return===null||g.return===n)break t;g=g.return}g.sibling.return=g.return,g=g.sibling}n.stateNode=c;t:switch(Pn(c,u,r),u){case"button":case"input":case"select":case"textarea":r=!!r.autoFocus;break t;case"img":r=!0;break t;default:r=!1}r&&wa(n)}}return nn(n),n.subtreeFlags&=-33554433,ph(n,n.type,t===null?null:t.memoizedProps,n.pendingProps,a),null;case 6:if(t&&n.stateNode!=null)t.memoizedProps!==r&&wa(n);else{if(typeof r!="string"&&n.stateNode===null)throw Error(s(166));if(t=Pe.current,xr(n)){if(t=n.stateNode,a=n.memoizedProps,r=null,u=An,u!==null)switch(u.tag){case 27:case 5:r=u.memoizedProps}t[b]=n,t=!!(t.nodeValue===a||r!==null&&r.suppressHydrationWarning===!0||z_(t.nodeValue,a)),t||ja(n,!0)}else t=al(t).createTextNode(r),t[b]=n,n.stateNode=t}return nn(n),null;case 31:if(a=n.memoizedState,t===null||t.memoizedState!==null){if(r=xr(n),a!==null){if(t===null){if(!r)throw Error(s(318));if(t=n.memoizedState,t=t!==null?t.dehydrated:null,!t)throw Error(s(557));t[b]=n}else Ls(),(n.flags&128)===0&&(n.memoizedState=null),n.flags|=4;nn(n),t=!1}else a=bf(),t!==null&&t.memoizedState!==null&&(t.memoizedState.hydrationErrors=a),t=!0;if(!t)return n.flags&256?(ui(n),n):(ui(n),null);if((n.flags&128)!==0)throw Error(s(558))}return nn(n),null;case 13:if(r=n.memoizedState,t===null||t.memoizedState!==null&&t.memoizedState.dehydrated!==null){if(u=xr(n),r!==null&&r.dehydrated!==null){if(t===null){if(!u)throw Error(s(318));if(u=n.memoizedState,u=u!==null?u.dehydrated:null,!u)throw Error(s(317));u[b]=n}else Ls(),(n.flags&128)===0&&(n.memoizedState=null),n.flags|=4;nn(n),u=!1}else u=bf(),t!==null&&t.memoizedState!==null&&(t.memoizedState.hydrationErrors=u),u=!0;if(!u)return n.flags&256?(ui(n),n):(ui(n),null)}return ui(n),(n.flags&128)!==0?(n.lanes=a,n):(a=r!==null,t=t!==null&&t.memoizedState!==null,a&&(r=n.child,u=null,r.alternate!==null&&r.alternate.memoizedState!==null&&r.alternate.memoizedState.cachePool!==null&&(u=r.alternate.memoizedState.cachePool.pool),c=null,r.memoizedState!==null&&r.memoizedState.cachePool!==null&&(c=r.memoizedState.cachePool.pool),c!==u&&(r.flags|=2048)),a!==t&&a&&(n.child.flags|=8192),Eu(n,n.updateQueue),nn(n),null);case 4:return je(),t===null&&jh(n.stateNode.containerInfo),n.flags|=67108864,nn(n),null;case 10:return ba(n.type),nn(n),null;case 19:if(Ff(n),r=n.memoizedState,r===null)return nn(n),null;if(u=(n.flags&128)!==0,c=r.rendering,c===null)if(u)qo(r,!1);else{if(dn!==0||t!==null&&(t.flags&128)!==0)for(t=n.child;t!==null;){if(c=lu(t),c!==null){for(n.flags|=128,qo(r,!1),t=c.updateQueue,n.updateQueue=t,Eu(n,t),n.subtreeFlags=0,t=a,a=n.child;a!==null;)f0(a,t),a=a.sibling;return Vo(n,Ln.current&1|2),ye&&Ea(n,r.treeForkCount),n.child}t=t.sibling}r.tail!==null&&Lt()>Pu&&(n.flags|=128,u=!0,qo(r,!1),n.lanes=4194304)}else{if(!u)if(t=lu(c),t!==null){if(n.flags|=128,u=!0,t=t.updateQueue,n.updateQueue=t,Eu(n,t),qo(r,!0),r.tail===null&&r.tailMode!=="collapsed"&&r.tailMode!=="visible"&&!c.alternate&&!ye)return nn(n),null}else 2*Lt()-r.renderingStartTime>Pu&&a!==536870912&&(n.flags|=128,u=!0,qo(r,!1),n.lanes=4194304);r.isBackwards?(c.sibling=n.child,n.child=c):(t=r.last,t!==null?t.sibling=c:n.child=c,r.last=c)}if(r.tail!==null){t=r.tail;t:{for(a=t;a!==null;){if(a.alternate!==null){a=!1;break t}a=a.sibling}a=!0}return r.rendering=t,r.tail=t.sibling,r.renderingStartTime=Lt(),t.sibling=null,c=Ln.current,c=u?c&1|2:c&1,r.tailMode==="visible"||r.tailMode==="collapsed"||!a||ye?Vo(n,c):(a=c,ne(Un,n),ne(Ln,a),Bn===null&&(Bn=n)),ye&&Ea(n,r.treeForkCount),t}return nn(n),null;case 22:case 23:return ui(n),zf(),r=n.memoizedState!==null,t!==null?t.memoizedState!==null!==r&&(n.flags|=8192):r&&(n.flags|=8192),r?(a&536870912)!==0&&(n.flags&128)===0&&(nn(n),n.subtreeFlags&6&&(n.flags|=8192)):nn(n),a=n.updateQueue,a!==null&&Eu(n,a.retryQueue),a=null,t!==null&&t.memoizedState!==null&&t.memoizedState.cachePool!==null&&(a=t.memoizedState.cachePool.pool),r=null,n.memoizedState!==null&&n.memoizedState.cachePool!==null&&(r=n.memoizedState.cachePool.pool),r!==a&&(n.flags|=2048),t!==null&&ee(Bs),null;case 24:return a=null,t!==null&&(a=t.memoizedState.cache),n.memoizedState.cache!==a&&(n.flags|=2048),ba(gn),nn(n),null;case 25:return null;case 30:return n.flags|=33554432,nn(n),null}throw Error(s(156,n.tag))}function qy(t,n){switch(Ef(n),n.tag){case 1:return t=n.flags,t&65536?(n.flags=t&-65537|128,n):null;case 3:return ba(gn),je(),t=n.flags,(t&65536)!==0&&(t&128)===0?(n.flags=t&-65537|128,n):null;case 26:case 27:case 5:return L(n),null;case 31:if(n.memoizedState!==null){if(ui(n),n.alternate===null)throw Error(s(340));Ls()}return t=n.flags,t&65536?(n.flags=t&-65537|128,n):null;case 13:if(ui(n),t=n.memoizedState,t!==null&&t.dehydrated!==null){if(n.alternate===null)throw Error(s(340));Ls()}return t=n.flags,t&65536?(n.flags=t&-65537|128,n):null;case 19:return Ff(n),t=n.flags,t&65536?(n.flags=t&-65537|128,t=n.memoizedState,t!==null&&(t.rendering=null,t.tail=null),n.flags|=4,n):null;case 4:return je(),null;case 10:return ba(n.type),null;case 22:case 23:return ui(n),zf(),t!==null&&ee(Bs),t=n.flags,t&65536?(n.flags=t&-65537|128,n):null;case 24:return ba(gn),null;case 25:return null;default:return null}}function Fg(t,n){switch(Ef(n),n.tag){case 3:ba(gn),je();break;case 26:case 27:case 5:L(n);break;case 4:je();break;case 31:n.memoizedState!==null&&ui(n);break;case 13:ui(n);break;case 19:Ff(n);break;case 10:ba(n.type);break;case 22:case 23:ui(n),zf(),t!==null&&ee(Bs);break;case 24:ba(gn)}}function Zo(t,n){try{var a=n.updateQueue,r=a!==null?a.lastEffect:null;if(r!==null){var u=r.next;a=u;do{if((a.tag&t)===t){r=void 0;var c=a.create,g=a.inst;r=c(),g.destroy=r}a=a.next}while(a!==u)}}catch(A){We(n,n.return,A)}}function as(t,n,a){try{var r=n.updateQueue,u=r!==null?r.lastEffect:null;if(u!==null){var c=u.next;r=c;do{if((r.tag&t)===t){var g=r.inst,A=g.destroy;if(A!==void 0){g.destroy=void 0,u=n;var I=a,$=A;try{$()}catch(ht){We(u,I,ht)}}}r=r.next}while(r!==c)}}catch(ht){We(n,n.return,ht)}}function Hg(t){var n=t.updateQueue;if(n!==null){var a=t.stateNode;try{w0(n,a)}catch(r){We(t,t.return,r)}}}function Gg(t,n,a){a.props=Xs(t.type,t.memoizedProps),a.state=t.memoizedState;try{a.componentWillUnmount()}catch(r){We(t,n,r)}}function Ji(t,n){try{var a=t.ref;if(a!==null){switch(t.tag){case 26:case 27:case 5:var r=t.stateNode;break;case 30:var u=t.stateNode,c=Sa(t.memoizedProps,u);(u.ref===null||u.ref.name!==c)&&(u.ref=Z_(c)),r=u.ref;break;case 7:if(t.stateNode===null){var g=new pi(t);_(t.child,!1,zM,g,void 0,void 0),t.stateNode=g}r=t.stateNode;break;default:r=t.stateNode}typeof a=="function"?t.refCleanup=a(r):a.current=r}}catch(A){We(t,n,A)}}function On(t,n){var a=t.ref,r=t.refCleanup;if(a!==null)if(typeof r=="function")try{r()}catch(u){We(t,n,u)}finally{t.refCleanup=null,t=t.alternate,t!=null&&(t.refCleanup=null)}else if(typeof a=="function")try{a(null)}catch(u){We(t,n,u)}else a.current=null}function Tu(t,n){if((t.tag===5||t.tag===27||t.tag===6)&&t.alternate===null&&n!==null)for(var a=0;a<n.length;a++)tv(t.stateNode,n[a])}function Vg(t){for(var n=t.return;n!==null&&(gh(n)&&tv(t.stateNode,n.stateNode),!mh(n));)n=n.return}function jo(t){for(var n=t.return;n!==null&&(gh(n)&&BM(t.stateNode,n.stateNode),!mh(n));)n=n.return}function mh(t){return t.tag===5||t.tag===3||t.tag===27}function gh(t){return t&&t.tag===7&&t.stateNode!==null}function _h(t){var n=t.type,a=t.memoizedProps,r=t.stateNode;try{t:switch(n){case"button":case"input":case"select":case"textarea":a.autoFocus&&r.focus();break t;case"img":a.src?r.src=a.src:a.srcSet&&(r.srcset=a.srcSet)}}catch(u){We(t,t.return,u)}}function vh(t,n,a){try{var r=t.stateNode;xM(r,t.type,a,n),r[B]=n}catch(u){We(t,t.return,u)}}function Xg(t){return t.tag===5||t.tag===3||t.tag===26||t.tag===27&&fs(t.type)||t.tag===4}function xh(t){t:for(;;){for(;t.sibling===null;){if(t.return===null||Xg(t.return))return null;t=t.return}for(t.sibling.return=t.return,t=t.sibling;t.tag!==5&&t.tag!==6&&t.tag!==18;){if(t.tag===27&&fs(t.type)||t.flags&2||t.child===null||t.tag===4)continue t;t.child.return=t,t=t.child}if(!(t.flags&2))return t.stateNode}}function Sh(t,n,a,r){var u=t.tag;if(u===5||u===6)u=t.stateNode,n?(a.nodeType===9?a.body:a.nodeName==="HTML"?a.ownerDocument.body:a).insertBefore(u,n):(n=a.nodeType===9?a.body:a.nodeName==="HTML"?a.ownerDocument.body:a,n.appendChild(u),a=a._reactRootContainer,a!=null||n.onclick!==null||(n.onclick=ji)),Tu(t,r),Se=!0;else if(u!==4&&(u===27&&(Tu(t,r),r=null,fs(t.type)&&(a=t.stateNode,n=null)),t=t.child,t!==null))for(Sh(t,n,a,r),t=t.sibling;t!==null;)Sh(t,n,a,r),t=t.sibling}function bu(t,n,a,r){var u=t.tag;if(u===5||u===6)u=t.stateNode,n?a.insertBefore(u,n):a.appendChild(u),Tu(t,r),Se=!0;else if(u!==4&&(u===27&&(Tu(t,r),r=null,fs(t.type)&&(a=t.stateNode)),t=t.child,t!==null))for(bu(t,n,a,r),t=t.sibling;t!==null;)bu(t,n,a,r),t=t.sibling}function kg(t){var n=t.stateNode,a=t.memoizedProps;try{for(var r=t.type,u=n.attributes;u.length;)n.removeAttributeNode(u[0]);Pn(n,r,a),n[b]=t,n[B]=a}catch(c){We(t,t.return,c)}}var Au=!1,ci=null;function Wg(t){(t.tag===30||(t.subtreeFlags&33554432)!==0)&&(Au=!0)}var $i=null;function Yg(){var t=$i;return $i=null,t}var Jn=0;function Rr(t,n,a,r,u){return Jn=0,qg(t.child,n,a,r,u)}function qg(t,n,a,r,u){for(var c=!1;t!==null;){if(t.tag===5){var g=t.stateNode;if(r!==null){var A=id(g);r.push(A),A.view&&(c=!0)}else c||id(g).view&&(c=!0);Au=!0,Y_(g,Jn===0?n:n+"_"+Jn,a),Jn++}else(t.tag!==22||t.memoizedState===null)&&(t.tag===30&&u||qg(t.child,n,a,r,u)&&(c=!0));t=t.sibling}return c}function ta(t,n){for(;t!==null;)t.tag===5?q_(t.stateNode,t.memoizedProps):(t.tag!==22||t.memoizedState===null)&&(t.tag===30&&n||ta(t.child,n)),t=t.sibling}function Ru(t){if((t.subtreeFlags&18874368)!==0)for(t=t.child;t!==null;){if((t.tag!==22||t.memoizedState===null)&&(Ru(t),t.tag===30&&(t.flags&18874368)!==0&&t.stateNode.paired)){var n=t.memoizedProps;if(n.name==null||n.name==="auto")throw Error(s(544));var a=n.name;n=ya(n.default,n.share),n!=="none"&&(Rr(t,a,n,null,!1)||ta(t.child,!1))}t=t.sibling}}function yh(t,n){if(t.tag===30){var a=t.stateNode,r=t.memoizedProps,u=Sa(r,a),c=ya(r.default,a.paired?r.share:r.enter);c!=="none"?Rr(t,u,c,null,!1)?(Ru(t),a.paired||n||Pr(t,r.onEnter)):ta(t.child,!1):Ru(t)}else if((t.subtreeFlags&33554432)!==0)for(t=t.child;t!==null;)yh(t,n),t=t.sibling;else Ru(t)}function Mh(t){if(ci!==null&&ci.size!==0){var n=ci;if((t.subtreeFlags&18874368)!==0)for(t=t.child;t!==null;){if(t.tag!==22||t.memoizedState===null){if(t.tag===30&&(t.flags&18874368)!==0){var a=t.memoizedProps,r=a.name;if(r!=null&&r!=="auto"){var u=n.get(r);if(u!==void 0){var c=ya(a.default,a.share);if(c!=="none"&&(Rr(t,r,c,null,!1)?(c=t.stateNode,u.paired=c,c.paired=u,Pr(t,a.onShare)):ta(t.child,!1)),n.delete(r),n.size===0)break}}}Mh(t)}t=t.sibling}}}function Eh(t){if(t.tag===30){var n=t.memoizedProps,a=Sa(n,t.stateNode),r=ci!==null?ci.get(a):void 0,u=ya(n.default,r!==void 0?n.share:n.exit);u!=="none"&&(Rr(t,a,u,null,!1)?r!==void 0?(u=t.stateNode,r.paired=u,u.paired=r,ci.delete(a),Pr(t,n.onShare)):Pr(t,n.onExit):ta(t.child,!1)),ci!==null&&Mh(t)}else if((t.subtreeFlags&33554432)!==0)for(t=t.child;t!==null;)Eh(t),t=t.sibling;else ci!==null&&Mh(t)}function Zg(t){for(t=t.child;t!==null;){if(t.tag===30){var n=t.memoizedProps,a=Sa(n,t.stateNode);n=ya(n.default,n.update),t.flags&=-5,n!=="none"&&Rr(t,a,n,t.memoizedState=[],!1)}else(t.subtreeFlags&33554432)!==0&&Zg(t);t=t.sibling}}function Th(t){if((t.subtreeFlags&18874368)!==0)for(t=t.child;t!==null;){if(t.tag!==22||t.memoizedState===null){if(t.tag===30&&(t.flags&18874368)!==0){var n=t.stateNode;n.paired!==null&&(n.paired=null,ta(t.child,!1))}Th(t)}t=t.sibling}}function Cu(t){if(t.tag===30)t.stateNode.paired=null,ta(t.child,!1),Th(t);else if((t.subtreeFlags&33554432)!==0)for(t=t.child;t!==null;)Cu(t),t=t.sibling;else Th(t)}function jg(t){for(t=t.child;t!==null;)t.tag===30?ta(t.child,!1):(t.subtreeFlags&33554432)!==0&&jg(t),t=t.sibling}function bh(t,n,a,r,u,c,g){for(var A=!1;n!==null;){if(n.tag===5){var I=n.stateNode;if(c!==null&&Jn<c.length){var $=c[Jn],ht=id(I);($.view||ht.view)&&(A=!0);var Et;if(Et=(t.flags&4)===0)if(ht.clip)Et=!0;else{Et=$.rect;var j=ht.rect;Et=Et.y!==j.y||Et.x!==j.x||Et.height!==j.height||Et.width!==j.width}Et&&(t.flags|=4),ht.abs?ht=!$.abs:($=$.rect,ht=ht.rect,ht=$.height!==ht.height||$.width!==ht.width),ht&&(t.flags|=32)}else t.flags|=32;(t.flags&4)!==0&&Y_(I,Jn===0?a:a+"_"+Jn,u),A&&(t.flags&4)!==0||($i===null&&($i=[]),$i.push(I,Jn===0?r:r+"_"+Jn,n.memoizedProps)),Jn++}else(n.tag!==22||n.memoizedState===null)&&(n.tag===30&&g?t.flags|=n.flags&32:bh(t,n.child,a,r,u,c,g)&&(A=!0));n=n.sibling}return A}function Kg(t,n){for(t=t.child;t!==null;){if(t.tag===30){var a=t.memoizedProps,r=t.stateNode,u=Sa(a,r),c=ya(a.default,a.update),g;g=t.memoizedState,t.memoizedState=null,r=t;var A=t.child;Jn=0,u=bh(r,A,u,u,c,g,!1),(t.flags&4)!==0&&u&&Pr(t,a.onUpdate)}else(t.subtreeFlags&33554432)!==0&&Kg(t);t=t.sibling}}var Rn=!1,Xe=!1,ea=!1,Ah=!1,Qg=typeof WeakSet=="function"?WeakSet:Set,Cn=null,na=!1,Ko=!1,wu=!1,Rh=!1;function Zy(t,n,a){if(t=t.containerInfo,Jh=Wr,t=e0(t),df(t)){if("selectionStart"in t)var r={start:t.selectionStart,end:t.selectionEnd};else t:{r=(r=t.ownerDocument)&&r.defaultView||window;var u=r.getSelection&&r.getSelection();if(u&&u.rangeCount!==0){r=u.anchorNode;var c=u.anchorOffset,g=u.focusNode;u=u.focusOffset;try{r.nodeType,g.nodeType}catch{r=null;break t}var A=0,I=-1,$=-1,ht=0,Et=0,j=t,ut=null;e:for(;;){for(var Ht;j!==r||c!==0&&j.nodeType!==3||(I=A+c),j!==g||u!==0&&j.nodeType!==3||($=A+u),j.nodeType===3&&(A+=j.nodeValue.length),(Ht=j.firstChild)!==null;)ut=j,j=Ht;for(;;){if(j===t)break e;if(ut===r&&++ht===c&&(I=A),ut===g&&++Et===u&&($=A),(Ht=j.nextSibling)!==null)break;j=ut,ut=j.parentNode}j=Ht}r=I===-1||$===-1?null:{start:I,end:$}}else r=null}r=r||{start:0,end:0}}else r=null;for($h={focusedElem:t,selectionRange:r},Wr=!1,a=(a&335544064)===a,Cn=n,n=a?9270:1024;Cn!==null;){if(t=Cn,a&&(r=t.deletions,r!==null))for(c=0;c<r.length;c++)a&&Eh(r[c]);if(t.alternate===null&&(t.flags&2)!==0)a&&Wg(t),Du(a);else{if(t.tag===22){if(r=t.alternate,t.memoizedState!==null){r!==null&&r.memoizedState===null&&a&&Eh(r),Du(a);continue}else if(r!==null&&r.memoizedState!==null){a&&Wg(t),Du(a);continue}}r=t.child,(t.subtreeFlags&n)!==0&&r!==null?(r.return=t,Cn=r):(a&&Zg(t),Du(a))}}ci=null}function Du(t){for(;Cn!==null;){var n=Cn,a=t,r=n.alternate,u=n.flags;switch(n.tag){case 0:case 11:case 15:break;case 1:if((u&1024)!==0&&r!==null){a=void 0,u=r.memoizedProps,r=r.memoizedState;var c=n.stateNode;try{var g=Xs(n.type,u);a=c.getSnapshotBeforeUpdate(g,r),c.__reactInternalSnapshotBeforeUpdate=a}catch(A){We(n,n.return,A)}}break;case 3:if((u&1024)!==0){if(r=n.stateNode.containerInfo,a=r.nodeType,a===9)rd(r);else if(a===1)switch(r.nodeName){case"HEAD":case"HTML":case"BODY":rd(r);break;default:r.textContent=""}}break;case 5:case 26:case 27:case 6:case 4:case 17:break;case 30:a&&r!==null&&(a=Sa(r.memoizedProps,r.stateNode),u=n.memoizedProps,u=ya(u.default,u.update),u!=="none"&&Rr(r,a,u,r.memoizedState=[],!0));break;default:if((u&1024)!==0)throw Error(s(163))}if(r=n.sibling,r!==null){r.return=n.return,Cn=r;break}Cn=n.return}}function Jg(t,n,a){var r=a.flags;switch(a.tag){case 0:case 11:case 15:ia(t,a),r&4&&Zo(5,a);break;case 1:if(ia(t,a),r&4)if(t=a.stateNode,n===null)try{t.componentDidMount()}catch(g){We(a,a.return,g)}else{var u=Xs(a.type,n.memoizedProps);n=n.memoizedState;try{t.componentDidUpdate(u,n,t.__reactInternalSnapshotBeforeUpdate)}catch(g){We(a,a.return,g)}}r&64&&Hg(a),r&512&&Ji(a,a.return);break;case 3:if(ia(t,a),r&64&&(t=a.updateQueue,t!==null)){if(n=null,a.child!==null)switch(a.child.tag){case 27:case 5:n=a.child.stateNode;break;case 1:n=a.child.stateNode}try{w0(t,n)}catch(g){We(a,a.return,g)}}break;case 27:n===null&&r&4&&kg(a);case 26:case 5:ia(t,a),n===null&&r&4&&_h(a),r&512&&Ji(a,a.return);break;case 12:ia(t,a);break;case 31:ia(t,a),r&4&&n_(t,a);break;case 13:ia(t,a),r&4&&i_(t,a),r&64&&(t=a.memoizedState,t!==null&&(t=t.dehydrated,t!==null&&(a=rM.bind(null,a),GM(t,a))));break;case 22:if(r=a.memoizedState!==null||Rn,!r){var c=n!==null&&n.memoizedState!==null||Xe;n=Rn,u=Xe,Rn=r,(Xe=c)&&!u?(r=2,(a.subtreeFlags&8772)!==0&&(r|=1),Bi(t,a,r)):ia(t,a),Rn=n,Xe=u}break;case 30:ia(t,a),r&512&&Ji(a,a.return);break;case 7:r&512&&Ji(a,a.return);default:ia(t,a)}}function Ch(t,n){for(t=t.child;t!==null;)$g(t,n),t=t.sibling}function $g(t,n){switch(t.tag){case 5:case 26:try{var a=t.stateNode;if(n){var r=a.style;typeof r.setProperty=="function"?r.setProperty("display","none","important"):r.display="none"}else{var u=t.stateNode,c=t.memoizedProps.style,g=c!=null&&c.hasOwnProperty("display")?c.display:null;u.style.display=g==null||typeof g=="boolean"?"":(""+g).trim()}}catch(I){We(t,t.return,I)}wh(t,n);break;case 6:try{t.stateNode.nodeValue=n?"":t.memoizedProps,Se=!0}catch(I){We(t,t.return,I)}break;case 18:try{var A=t.stateNode;n?W_(A,!0):W_(t.stateNode,!1)}catch(I){We(t,t.return,I)}break;case 22:case 23:t.memoizedState===null&&Ch(t,n);break;default:Ch(t,n)}}function wh(t,n){if(t.subtreeFlags&67108864)for(t=t.child;t!==null;){t:{var a=t,r=n;switch(a.tag){case 4:$g(a,r);break t;case 22:a.memoizedState===null&&wh(a,r);break t;default:wh(a,r)}}t=t.sibling}}function t_(t){var n=t.alternate;n!==null&&(t.alternate=null,t_(n)),t.child=null,t.deletions=null,t.sibling=null,t.tag===5&&(n=t.stateNode,n!==null&&Jt(n)),t.stateNode=null,t.return=null,t.dependencies=null,t.memoizedProps=null,t.memoizedState=null,t.pendingProps=null,t.stateNode=null,t.updateQueue=null}var an=null,$n=!1;function Ii(t,n,a){for(a=a.child;a!==null;)e_(t,n,a),a=a.sibling}function e_(t,n,a){if(Wt&&typeof Wt.onCommitFiberUnmount=="function")try{Wt.onCommitFiberUnmount(te,a)}catch{}switch(a.tag){case 26:Xe||On(a,n),Ii(t,n,a),a.memoizedState?a.memoizedState.count--:a.stateNode&&!Xe&&(a=a.stateNode,a.parentNode.removeChild(a));break;case 27:Xe||On(a,n),jo(a);var r=an,u=$n;fs(a.type)&&(an=a.stateNode,$n=!1),Ii(t,n,a),sv(a.stateNode,a.type,a.memoizedProps),an=r,$n=u;break;case 5:Xe||On(a,n),jo(a);case 6:if(a.tag===6&&jo(a),r=an,u=$n,an=null,Ii(t,n,a),an=r,$n=u,an!==null)if($n)try{(an.nodeType===9?an.body:an.nodeName==="HTML"?an.ownerDocument.body:an).removeChild(a.stateNode),Se=!0}catch(c){We(a,n,c)}else try{an.removeChild(a.stateNode),Se=!0}catch(c){We(a,n,c)}break;case 18:an!==null&&($n?(t=an,k_(t.nodeType===9?t.body:t.nodeName==="HTML"?t.ownerDocument.body:t,a.stateNode),Yr(t)):k_(an,a.stateNode));break;case 4:r=an,u=$n,an=a.stateNode.containerInfo,$n=!0,Ii(t,n,a),an=r,$n=u;break;case 0:case 11:case 14:case 15:as(2,a,n),Xe||as(4,a,n),Ii(t,n,a);break;case 1:Xe||(On(a,n),r=a.stateNode,typeof r.componentWillUnmount=="function"&&Gg(a,n,r)),Ii(t,n,a);break;case 21:Ii(t,n,a);break;case 22:Xe=(r=Xe)||a.memoizedState!==null,Ii(t,n,a),Xe=r;break;case 30:On(a,n),Ii(t,n,a);break;case 7:Xe||On(a,n),Ii(t,n,a);break;default:Ii(t,n,a)}}function n_(t,n){if(n.memoizedState===null&&(t=n.alternate,t!==null&&(t=t.memoizedState,t!==null))){t=t.dehydrated;try{Yr(t)}catch(a){We(n,n.return,a)}}}function i_(t,n){if(n.memoizedState===null&&(t=n.alternate,t!==null&&(t=t.memoizedState,t!==null&&(t=t.dehydrated,t!==null))))try{Yr(t)}catch(a){We(n,n.return,a)}}function jy(t){switch(t.tag){case 31:case 13:case 19:var n=t.stateNode;return n===null&&(n=t.stateNode=new Qg),n;case 22:return t=t.stateNode,n=t._retryCache,n===null&&(n=t._retryCache=new Qg),n;default:throw Error(s(435,t.tag))}}function Nu(t,n){var a=jy(t);n.forEach(function(r){if(!a.has(r)){a.add(r);var u=oM.bind(null,t,r);r.then(u,u)}})}function Wn(t,n,a){var r=n.deletions;if(r!==null)for(var u=0;u<r.length;u++){var c=r[u],g=t,A=n,I=A;t:for(;I!==null;){switch(I.tag){case 27:if(fs(I.type)){an=I.stateNode,$n=!1;break t}break;case 5:an=I.stateNode,$n=!1;break t;case 3:case 4:an=I.stateNode.containerInfo,$n=!0;break t}I=I.return}if(an===null)throw Error(s(160));e_(g,A,c),an=null,$n=!1,g=c.alternate,g!==null&&(g.return=null),c.return=null}if(n.subtreeFlags&13886)for(n=n.child;n!==null;)a_(n,t,a),n=n.sibling}var zi=null;function a_(t,n,a){var r=t.alternate,u=t.flags;switch(t.tag){case 0:case 11:case 14:case 15:if(u&4&&(r=t.updateQueue,r=r!==null?r.events:null,r!==null))for(var c=0;c<r.length;c++){var g=r[c];g.ref.impl=g.nextImpl}Wn(n,t,a),Yn(t),u&4&&(as(3,t,t.return),Zo(3,t),as(5,t,t.return));break;case 1:Wn(n,t,a),Yn(t),u&512&&(Xe||r===null||On(r,r.return)),u&64&&Rn&&(t=t.updateQueue,t!==null&&(n=t.callbacks,n!==null&&(a=t.shared.hiddenCallbacks,t.shared.hiddenCallbacks=a===null?n:a.concat(n))));break;case 26:if(c=zi,Wn(n,t,a),Yn(t),u&512&&(Xe||r===null||On(r,r.return)),u&4)if(u=r!==null?r.memoizedState:null,a=t.memoizedState,r===null)if(a===null)if(t.stateNode===null)if(Rn)t.stateNode=G_(t.type,t.memoizedProps,n.containerInfo,t);else{t:{n=t.type,a=t.memoizedProps,u=c.ownerDocument||c;e:switch(n){case"title":r=u.getElementsByTagName("title")[0],(!r||r[Ft]||r[b]||r.namespaceURI==="http://www.w3.org/2000/svg"||r.hasAttribute("itemprop"))&&(r=u.createElement(n),u.head.insertBefore(r,u.querySelector("head > title"))),Pn(r,n,a),r[b]=t,xe(r),n=r;break t;case"link":if(c=fv("link","href",u).get(n+(a.href||""))){for(g=0;g<c.length;g++)if(r=c[g],r.getAttribute("href")===(a.href==null||a.href===""?null:a.href)&&r.getAttribute("rel")===(a.rel==null?null:a.rel)&&r.getAttribute("title")===(a.title==null?null:a.title)&&r.getAttribute("crossorigin")===(a.crossOrigin==null?null:a.crossOrigin)){c.splice(g,1);break e}}r=u.createElement(n),Pn(r,n,a),u.head.appendChild(r);break;case"meta":if(c=fv("meta","content",u).get(n+(a.content||""))){for(g=0;g<c.length;g++)if(r=c[g],r.getAttribute("content")===(a.content==null?null:""+a.content)&&r.getAttribute("name")===(a.name==null?null:a.name)&&r.getAttribute("property")===(a.property==null?null:a.property)&&r.getAttribute("http-equiv")===(a.httpEquiv==null?null:a.httpEquiv)&&r.getAttribute("charset")===(a.charSet==null?null:a.charSet)){c.splice(g,1);break e}}r=u.createElement(n),Pn(r,n,a),u.head.appendChild(r);break;default:throw Error(s(468,n))}r[b]=t,xe(r),n=r}t.stateNode=n}else Rn||dd(c,t.type,t.stateNode);else t.stateNode=cv(c,a,t.memoizedProps);else u!==a?(u===null?(n=r.stateNode,n===null||Xe||n.parentNode.removeChild(n)):u.count--,a===null?Rn||dd(c,t.type,t.stateNode):cv(c,a,t.memoizedProps)):a===null&&t.stateNode!==null&&vh(t,t.memoizedProps,r.memoizedProps);break;case 27:Wn(n,t,a),Yn(t),u&512&&(Xe||r===null||On(r,r.return)),r!==null&&u&4&&vh(t,t.memoizedProps,r.memoizedProps);break;case 5:if(c=ea,ea=!1,Wn(n,t,a),ea=c,Yn(t),u&512&&(Xe||r===null||On(r,r.return)),t.flags&32){n=t.stateNode;try{ur(n,""),Se=!0}catch(ht){We(t,t.return,ht)}}u&4&&t.stateNode!=null&&(n=t.memoizedProps,vh(t,n,r!==null?r.memoizedProps:n)),u&1024&&(Ah=!0);break;case 6:if(Wn(n,t,a),Yn(t),u&4){if(t.stateNode===null)throw Error(s(162));n=t.memoizedProps,a=t.stateNode;try{a.nodeValue=n,Se=!0}catch(ht){We(t,t.return,ht)}}break;case 3:if(Se=!1,Yu=null,c=zi,zi=sl(n.containerInfo),Wn(n,t,a),zi=c,Yn(t),u&4&&r!==null&&r.memoizedState.isDehydrated)try{Yr(n.containerInfo)}catch(ht){We(t,t.return,ht)}Ah&&(Ah=!1,s_(t)),Se=!1;break;case 4:u=ea,ea=Rn,r=He(),c=zi,zi=sl(t.stateNode.containerInfo),Wn(n,t,a),Yn(t),zi=c,Se&&Ko&&(wu=!0),Se=r,ea=u;break;case 12:Wn(n,t,a),Yn(t);break;case 31:Wn(n,t,a),Yn(t),u&4&&(n=t.updateQueue,n!==null&&(t.updateQueue=null,Nu(t,n)));break;case 13:Wn(n,t,a),Yn(t),t.child.flags&8192&&t.memoizedState!==null!=(r!==null&&r.memoizedState!==null)&&(Ou=Lt()),u&4&&(n=t.updateQueue,n!==null&&(t.updateQueue=null,Nu(t,n)));break;case 22:c=t.memoizedState!==null,g=r!==null&&r.memoizedState!==null;var A=Rn,I=Xe,$=ea;Rn=A||c,ea=$||c,Xe=I||g,Wn(n,t,a),Xe=I,ea=$,Rn=A,Yn(t),u&8192&&(n=t.stateNode,n._visibility=c?n._visibility&-2:n._visibility|1,!c||r===null||g||Rn||Xe||(n=g||Xe,a=Rn,r=Xe,Rn=c||Rn,Xe=n,ss(t,2),Rn=a,Xe=r),!c&&ea||Ch(t,c)),u&4&&(n=t.updateQueue,n!==null&&(a=n.retryQueue,a!==null&&(n.retryQueue=null,Nu(t,a))));break;case 19:Wn(n,t,a),Yn(t),u&4&&(n=t.updateQueue,n!==null&&(t.updateQueue=null,Nu(t,n)));break;case 30:u&512&&(Xe||r===null||On(r,r.return)),u=He(),c=Ko,g=(a&335544064)===a,A=t.memoizedProps,Ko=g&&ya(A.default,A.update)!=="none",Wn(n,t,a),Yn(t),g&&r!==null&&Se&&(t.flags|=4),Ko=c,Se=u;break;case 21:break;case 7:u&512&&(Xe||r===null||On(r,r.return)),r&&r.stateNode!==null&&(r.stateNode._fragmentFiber=t);default:Wn(n,t,a),Yn(t)}}function Yn(t){var n=t.flags;if(n&2){try{for(var a,r=t.return;r!==null;){if(Xg(r)){a=r;break}r=r.return}r=null;for(var u=t.return;u!==null;){if(gh(u)){var c=u.stateNode;r===null?r=[c]:r.push(c)}if(mh(u))break;u=u.return}var g=r;if(a==null)throw Error(s(160));switch(a.tag){case 27:var A=a.stateNode,I=xh(t);bu(t,I,A,g);break;case 5:var $=a.stateNode;a.flags&32&&(ur($,""),a.flags&=-33);var ht=xh(t);bu(t,ht,$,g);break;case 3:case 4:var Et=a.stateNode.containerInfo,j=xh(t);Sh(t,j,Et,g);break;default:throw Error(s(161))}}catch(ut){We(t,t.return,ut)}t.flags&=-3}n&4096&&(t.flags&=-4097)}function s_(t){if(t.subtreeFlags&1024)for(t=t.child;t!==null;){var n=t;s_(n),n.tag===5&&n.flags&1024&&(n=n.stateNode,Wr=!0,n.reset(),Wr=!1),t=t.sibling}}function Cr(t,n){if(n.subtreeFlags&9270)for(n=n.child;n!==null;)r_(n,t),n=n.sibling;else Kg(n)}function r_(t,n){var a=t.alternate;if(a===null)yh(t,!1);else switch(t.tag){case 3:if(Rh=na=!1,Yg(),Cr(n,t),!na&&!wu){if(t=$i,t!==null)for(var r=0;r<t.length;r+=3){a=t[r];var u=t[r+1];q_(a,t[r+2]),a=a.ownerDocument.documentElement,a!==null&&a.animate({opacity:[0,0],pointerEvents:["none","none"]},{duration:0,fill:"forwards",pseudoElement:"::view-transition-group("+u+")"})}t=n.containerInfo,t=t.nodeType===9?t.documentElement:t.ownerDocument.documentElement,t!==null&&t.style.viewTransitionName===""&&(t.style.viewTransitionName="none",t.animate({opacity:[0,0],pointerEvents:["none","none"]},{duration:0,fill:"forwards",pseudoElement:"::view-transition-group(root)"}),t.animate({width:[0,0],height:[0,0]},{duration:0,fill:"forwards",pseudoElement:"::view-transition"})),Rh=!0}$i=null;break;case 5:Cr(n,t);break;case 4:r=na,na=!1,Cr(n,t),na&&(wu=!0),na=r;break;case 22:t.memoizedState===null&&(a.memoizedState!==null?yh(t,!1):Cr(n,t));break;case 30:r=na,u=Yg(),na=!1,Cr(n,t),na&&(t.flags|=4);var c=t.memoizedProps,g=t.stateNode;n=Sa(c,g),g=Sa(a.memoizedProps,g);var A=ya(c.default,c.update);A==="none"?n=!1:(c=a.memoizedState,a.memoizedState=null,a=t.child,Jn=0,n=bh(t,a,n,g,A,c,!0),Jn!==(c===null?0:c.length)&&(t.flags|=32)),(t.flags&4)!==0&&n?(Pr(t,t.memoizedProps.onUpdate),$i=u):u!==null&&(u.push.apply(u,$i),$i=u),na=(t.flags&32)!==0?!0:r;break;default:Cr(n,t)}}function ia(t,n){if(n.subtreeFlags&8772)for(n=n.child;n!==null;)Jg(t,n.alternate,n),n=n.sibling}function ss(t,n){for(t=t.child;t!==null;){var a=t,r=n;switch(a.tag){case 0:case 11:case 14:case 15:as(4,a,a.return),ss(a,r);break;case 1:On(a,a.return);var u=a.stateNode;typeof u.componentWillUnmount=="function"&&Gg(a,a.return,u),ss(a,r);break;case 27:(r&2)!==0&&sv(a.stateNode,a.type,a.memoizedProps);case 5:On(a,a.return),a.tag!==5&&a.tag!==27||jo(a),ss(a,r);break;case 6:jo(a);break;case 26:On(a,a.return),u=a.stateNode,a.memoizedState!==null||u===null||Xe||u.parentNode.removeChild(u),ss(a,r);break;case 22:a.memoizedState===null&&ss(a,r);break;case 30:On(a,a.return),ss(a,r);break;case 7:On(a,a.return);default:ss(a,r)}t=t.sibling}}function Bi(t,n,a){for(a=(n.subtreeFlags&8772)!==0?a:a&-2,n=n.child;n!==null;){var r=n.alternate,u=t,c=n,g=c.flags,A=(a&1)!==0;switch(c.tag){case 0:case 11:case 15:Bi(u,c,a),Zo(4,c);break;case 1:if(Bi(u,c,a),r=c,u=r.stateNode,typeof u.componentDidMount=="function")try{u.componentDidMount()}catch(ht){We(r,r.return,ht)}if(r=c,u=r.updateQueue,u!==null){var I=r.stateNode;try{var $=u.shared.hiddenCallbacks;if($!==null)for(u.shared.hiddenCallbacks=null,u=0;u<$.length;u++)C0($[u],I)}catch(ht){We(r,r.return,ht)}}A&&g&64&&Hg(c),Ji(c,c.return);break;case 27:(a&2)!==0&&kg(c);case 5:c.tag!==5&&c.tag!==27||Vg(c),Bi(u,c,a),A&&r===null&&g&4&&_h(c),Ji(c,c.return);break;case 6:Vg(c);break;case 26:I=c.stateNode,c.memoizedState!==null||I===null||Rn||dd(sl(I.ownerDocument),c.type,I),Bi(u,c,a),A&&r===null&&g&4&&_h(c),Ji(c,c.return);break;case 12:Bi(u,c,a);break;case 31:Bi(u,c,a),A&&g&4&&n_(u,c);break;case 13:Bi(u,c,a),A&&g&4&&i_(u,c);break;case 22:c.memoizedState===null&&Bi(u,c,a),Ji(c,c.return);break;case 30:Bi(u,c,a),Ji(c,c.return);break;case 7:Ji(c,c.return);default:Bi(u,c,a)}n=n.sibling}}function Dh(t,n){var a=null;t!==null&&t.memoizedState!==null&&t.memoizedState.cachePool!==null&&(a=t.memoizedState.cachePool.pool),t=null,n.memoizedState!==null&&n.memoizedState.cachePool!==null&&(t=n.memoizedState.cachePool.pool),t!==a&&(t!=null&&t.refCount++,a!=null&&Po(a))}function Nh(t,n){t=null,n.alternate!==null&&(t=n.alternate.memoizedState.cache),n=n.memoizedState.cache,n!==t&&(n.refCount++,t!=null&&Po(t))}function Ci(t,n,a,r){var u=(a&335544064)===a;if(n.subtreeFlags&(u?10262:10256))for(n=n.child;n!==null;)o_(t,n,a,r),n=n.sibling;else u&&jg(n)}function o_(t,n,a,r){var u=(a&335544064)===a;u&&n.alternate===null&&n.return!==null&&n.return.alternate!==null&&Cu(n);var c=n.flags;switch(n.tag){case 0:case 11:case 15:Ci(t,n,a,r),c&2048&&Zo(9,n);break;case 1:Ci(t,n,a,r);break;case 3:Ci(t,n,a,r),u&&Rh&&(t=t.containerInfo,t=t.nodeType===9?t.body:t.nodeName==="HTML"?t.ownerDocument.body:t,t.style.viewTransitionName==="root"&&(t.style.viewTransitionName=""),t=t.ownerDocument.documentElement,t!==null&&t.style.viewTransitionName==="none"&&(t.style.viewTransitionName="")),c&2048&&(c=null,n.alternate!==null&&(c=n.alternate.memoizedState.cache),n=n.memoizedState.cache,n!==c&&(n.refCount++,c!=null&&Po(c)));break;case 12:if(c&2048){Ci(t,n,a,r),c=n.stateNode;try{var g=n.memoizedProps,A=g.id,I=g.onPostCommit;typeof I=="function"&&I(A,n.alternate===null?"mount":"update",c.passiveEffectDuration,-0)}catch($){We(n,n.return,$)}}else Ci(t,n,a,r);break;case 31:Ci(t,n,a,r);break;case 13:Ci(t,n,a,r);break;case 23:break;case 22:g=n.stateNode,A=n.alternate,n.memoizedState!==null?(u&&A!==null&&A.memoizedState===null&&Cu(A),g._visibility&2?Ci(t,n,a,r):Qo(t,n)):(u&&A!==null&&A.memoizedState!==null&&Cu(n),g._visibility&2?Ci(t,n,a,r):(g._visibility|=2,wr(t,n,a,r,(n.subtreeFlags&10256)!==0||!1))),c&2048&&Dh(A,n);break;case 24:Ci(t,n,a,r),c&2048&&Nh(n.alternate,n);break;case 30:u&&(c=n.alternate,c!==null&&(ta(c.child,!0),ta(n.child,!0))),Ci(t,n,a,r);break;default:Ci(t,n,a,r)}}function wr(t,n,a,r,u){for(u=u&&((n.subtreeFlags&10256)!==0||!1),n=n.child;n!==null;){var c=t,g=n,A=a,I=r,$=g.flags;switch(g.tag){case 0:case 11:case 15:wr(c,g,A,I,u),Zo(8,g);break;case 23:break;case 22:var ht=g.stateNode;g.memoizedState!==null?ht._visibility&2?wr(c,g,A,I,u):Qo(c,g):(ht._visibility|=2,wr(c,g,A,I,u)),u&&$&2048&&Dh(g.alternate,g);break;case 24:wr(c,g,A,I,u),u&&$&2048&&Nh(g.alternate,g);break;default:wr(c,g,A,I,u)}n=n.sibling}}function Qo(t,n){if(n.subtreeFlags&10256)for(n=n.child;n!==null;){var a=t,r=n,u=r.flags;switch(r.tag){case 22:Qo(a,r),u&2048&&Dh(r.alternate,r);break;case 24:Qo(a,r),u&2048&&Nh(r.alternate,r);break;default:Qo(a,r)}n=n.sibling}}var ks=8192;function Ws(t,n,a){if(t.subtreeFlags&ks)for(t=t.child;t!==null;)l_(t,n,a),t=t.sibling}function l_(t,n,a){switch(t.tag){case 26:Ws(t,n,a),t.flags&ks&&(t.memoizedState!==null?eE(a,zi,t.memoizedState,t.memoizedProps):(t=t.stateNode,(n&335544128)===n&&mv(a,t)));break;case 5:Ws(t,n,a),t.flags&ks&&(t=t.stateNode,(n&335544128)===n&&mv(a,t));break;case 3:case 4:var r=zi;zi=sl(t.stateNode.containerInfo),Ws(t,n,a),zi=r;break;case 22:t.memoizedState===null&&(r=t.alternate,r!==null&&r.memoizedState!==null?(r=ks,ks=16777216,Ws(t,n,a),ks=r):Ws(t,n,a));break;case 30:if((t.flags&ks)!==0&&(r=t.memoizedProps.name,r!=null&&r!=="auto")){var u=t.stateNode;u.paired=null,ci===null&&(ci=new Map),ci.set(r,u)}Ws(t,n,a);break;default:Ws(t,n,a)}}function u_(t){var n=t.alternate;if(n!==null&&(t=n.child,t!==null)){n.child=null;do n=t.sibling,t.sibling=null,t=n;while(t!==null)}}function Jo(t){var n=t.deletions;if((t.flags&16)!==0){if(n!==null)for(var a=0;a<n.length;a++){var r=n[a];Cn=r,f_(r,t)}u_(t)}if(t.subtreeFlags&10256)for(t=t.child;t!==null;)c_(t),t=t.sibling}function c_(t){switch(t.tag){case 0:case 11:case 15:Jo(t),t.flags&2048&&as(9,t,t.return);break;case 3:Jo(t);break;case 12:Jo(t);break;case 22:var n=t.stateNode;t.memoizedState!==null&&n._visibility&2&&(t.return===null||t.return.tag!==13)?(n._visibility&=-3,Uu(t)):Jo(t);break;default:Jo(t)}}function Uu(t){var n=t.deletions;if((t.flags&16)!==0){if(n!==null)for(var a=0;a<n.length;a++){var r=n[a];Cn=r,f_(r,t)}u_(t)}for(t=t.child;t!==null;){switch(n=t,n.tag){case 0:case 11:case 15:as(8,n,n.return),Uu(n);break;case 22:a=n.stateNode,a._visibility&2&&(a._visibility&=-3,Uu(n));break;default:Uu(n)}t=t.sibling}}function f_(t,n){for(;Cn!==null;){var a=Cn;switch(a.tag){case 0:case 11:case 15:as(8,a,n);break;case 23:case 22:if(a.memoizedState!==null&&a.memoizedState.cachePool!==null){var r=a.memoizedState.cachePool.pool;r!=null&&r.refCount++}break;case 24:Po(a.memoizedState.cache)}if(r=a.child,r!==null)r.return=a,Cn=r;else t:for(a=t;Cn!==null;){r=Cn;var u=r.sibling,c=r.return;if(t_(r),r===a){Cn=null;break t}if(u!==null){u.return=c,Cn=u;break t}Cn=c}}}var Ky={getCacheForType:function(t){var n=Nn(gn),a=n.data.get(t);return a===void 0&&(a=t(),n.data.set(t,a)),a},cacheSignal:function(){return Nn(gn).controller.signal}},Qy=typeof WeakMap=="function"?WeakMap:Map,Ge=0,$e=null,Ae=null,De=0,ke=0,fi=null,rs=!1,Dr=!1,Uh=!1,Da=0,dn=0,os=0,Ys=0,Lu=0,hi=0,Nr=0,$o=null,ti=null,Lh=!1,Ou=0,h_=0,Pu=1/0,Iu=null,ls=null,rn=0,Fi=null,qs=null,aa=0,Oh=0,Ph=null,d_=null,Ur=null,Lr=null,Or=null,tl=0,zu=null;function di(){return(Ge&2)!==0&&De!==0?De&-De:vt.T!==null?Wh():Pl()}function p_(){if(hi===0)if((De&536870912)===0||ye){var t=As;As<<=1,(As&3932160)===0&&(As=262144),hi=t}else hi=536870912;return t=Un.current,t!==null&&(t.flags|=32),hi}function Pr(t,n){if(n!=null){var a=t.stateNode,r=a.ref;r===null&&(r=a.ref=Z_(Sa(t.memoizedProps,a))),Lr===null&&(Lr=[]),Lr.push(n.bind(null,r))}}function ei(t,n,a){(t===$e&&(ke===2||ke===9)||t.cancelPendingCommit!==null)&&(Ir(t,0),us(t,De,hi,!1)),qi(t,a),((Ge&2)===0||t!==$e)&&(t===$e&&((Ge&2)===0&&(Ys|=a),dn===4&&us(t,De,hi,!1)),sa(t))}function m_(t,n,a){if((Ge&6)!==0)throw Error(s(327));var r=!a&&(n&127)===0&&(n&t.expiredLanes)===0||ka(t,n),u=r?tM(t,n):zh(t,n,!0),c=r;do{if(u===0){Dr&&!r&&us(t,n,0,!1);break}else{if(a=t.current.alternate,c&&!Jy(a)){u=zh(t,n,!1),c=!1;continue}if(u===2){if(c=n,t.errorRecoveryDisabledLanes&c)var g=0;else g=t.pendingLanes&-536870913,g=g!==0?g:g&536870912?536870912:0;if(g!==0){n=g;t:{var A=t;u=$o;var I=A.current.memoizedState.isDehydrated;if(I&&(Ir(A,g).flags|=256),g=zh(A,g,!1),g!==2&&g!==6){if(Uh&&!I){A.errorRecoveryDisabledLanes|=c,Ys|=c,u=4;break t}c=ti,ti=u,c!==null&&(ti===null?ti=c:ti.push.apply(ti,c))}u=g}if(c=!1,u!==2)continue}}if(u===1){Ir(t,0),us(t,n,0,!0);break}t:{switch(r=t,c=u,c){case 0:case 1:throw Error(s(345));case 4:if((n&4194048)!==n&&(n&62914560)!==n)break;case 6:us(r,n,hi,!rs);break t;case 2:ti=null;break;case 3:case 5:break;default:throw Error(s(329))}if((n&62914560)===n&&(u=Ou+300-Lt(),10<u)){if(us(r,n,hi,!rs),Rs(r,0,!0)!==0)break t;aa=n,r.timeoutHandle=nd(g_.bind(null,r,a,ti,Iu,Lh,n,hi,Ys,Nr,rs,c,"Throttled",-0,0),u);break t}g_(r,a,ti,Iu,Lh,n,hi,Ys,Nr,rs,c,null,-0,0)}}break}while(!0);sa(t)}function g_(t,n,a,r,u,c,g,A,I,$,ht,Et,j,ut){t.timeoutHandle=-1;var Ht=n.subtreeFlags,$t=(c&335544064)===c;if(Et=null,($t||Ht&8192||(Ht&16785408)===16785408)&&(Et={stylesheets:null,count:0,imgCount:0,imgBytes:0,suspenseyImages:[],waitingForImages:!0,waitingForViewTransition:!1,unsuspend:ji},ci=null,l_(n,c,Et),$t&&(Ht=Et,$t=t.containerInfo,$t=($t.nodeType===9?$t:$t.ownerDocument).__reactViewTransition,$t!=null&&(Ht.count++,Ht.waitingForViewTransition=!0,Ht=ll.bind(Ht),$t.finished.then(Ht,Ht))),Ht=(c&62914560)===c?Ou-Lt():(c&4194048)===c?h_-Lt():0,Ht=nE(Et,Ht),Ht!==null)){aa=c,t.cancelPendingCommit=Ht(T_.bind(null,t,n,c,a,r,u,g,A,I,$,ht,Et,null,j,ut)),us(t,c,g,!$);return}T_(t,n,c,a,r,u,g,A,I,$,ht,Et)}function Jy(t){for(var n=t;;){var a=n.tag;if((a===0||a===11||a===15)&&n.flags&16384&&(a=n.updateQueue,a!==null&&(a=a.stores,a!==null)))for(var r=0;r<a.length;r++){var u=a[r],c=u.getSnapshot;u=u.value;try{if(!li(c(),u))return!1}catch{return!1}}if(a=n.child,n.subtreeFlags&16384&&a!==null)a.return=n,n=a;else{if(n===t)break;for(;n.sibling===null;){if(n.return===null||n.return===t)return!0;n=n.return}n.sibling.return=n.return,n=n.sibling}}return!0}function us(t,n,a,r){n=Yi(t,n),n&=~Lu,n&=~Ys,t.suspendedLanes|=n,t.pingedLanes&=~n,r&&(t.warmLanes|=n),r=t.expirationTimes;for(var u=n;0<u;){var c=31-fe(u),g=1<<c;r[c]=-1,u&=~g}a!==0&&Cs(t,a,n)}function Bu(){return(Ge&6)===0?(el(0),!1):!0}function Ih(){if(Ae!==null){if(ke===0)var t=Ae.return;else t=Ae,Ta=Os=null,kf(t),Mr=null,Bo=0,t=Ae;for(;t!==null;)Fg(t.alternate,t),t=t.return;Ae=null}}function Ir(t,n){var a=t.timeoutHandle;return a!==-1&&(t.timeoutHandle=-1,MM(a)),a=t.cancelPendingCommit,a!==null&&(t.cancelPendingCommit=null,a()),aa=0,Ih(),$e=t,Ae=a=Ma(t.current,null),De=n,ke=0,fi=null,rs=!1,Dr=ka(t,n),Uh=!1,Nr=hi=Lu=Ys=os=dn=0,ti=$o=null,Lh=!1,Da=Yi(t,n),Yl(),a}function __(t,n){me=null,vt.H=_u,n===yr||n===iu?(n=T0(),ke=3):n===Nf?(n=T0(),ke=4):ke=n===sh?8:n!==null&&typeof n=="object"&&typeof n.then=="function"?6:1,fi=n,Ae===null&&(dn=1,vu(t,Ti(n,t.current)))}function v_(){var t=Un.current;return t===null?!0:(De&4194048)===De?Bn===null:(De&62914560)===De||(De&536870912)!==0?t===Bn:!1}function x_(){var t=vt.H;return vt.H=_u,t===null?_u:t}function S_(){var t=vt.A;return vt.A=Ky,t}function Fu(){dn=4,rs||(De&4194048)!==De&&Un.current!==null||(Dr=!0),(os&134217727)===0&&(Ys&134217727)===0||$e===null||us($e,De,hi,!1)}function zh(t,n,a){var r=Ge;Ge|=2;var u=x_(),c=S_();($e!==t||De!==n)&&(Iu=null,Ir(t,n)),n=!1;var g=dn;t:do try{if(ke!==0&&Ae!==null){var A=Ae,I=fi;switch(ke){case 8:Ih(),g=6;break t;case 3:case 2:case 9:case 6:Un.current===null&&(n=!0);var $=ke;if(ke=0,fi=null,zr(t,A,I,$),a&&Dr){g=0;break t}break;default:$=ke,ke=0,fi=null,zr(t,A,I,$)}}$y(),g=dn;break}catch(ht){__(t,ht)}while(!0);return n&&t.shellSuspendCounter++,Ta=Os=null,Ge=r,vt.H=u,vt.A=c,Ae===null&&($e=null,De=0,Yl()),g}function $y(){for(;Ae!==null;)y_(Ae)}function tM(t,n){var a=Ge;Ge|=2;var r=x_(),u=S_();$e!==t||De!==n?(Iu=null,Pu=Lt()+500,Ir(t,n)):Dr=ka(t,n);t:do try{if(ke!==0&&Ae!==null){n=Ae;var c=fi;e:switch(ke){case 1:ke=0,fi=null,zr(t,n,c,1);break;case 2:case 9:if(M0(c)){ke=0,fi=null,M_(n);break}n=function(){ke!==2&&ke!==9||$e!==t||(ke=7),sa(t)},c.then(n,n);break t;case 3:ke=7;break t;case 4:ke=5;break t;case 7:M0(c)?(ke=0,fi=null,M_(n)):(ke=0,fi=null,zr(t,n,c,7));break;case 5:var g=null;switch(Ae.tag){case 26:g=Ae.memoizedState;case 5:case 27:var A=Ae;if(g?dv(g):A.stateNode.complete){ke=0,fi=null;var I=A.sibling;if(I!==null)Ae=I;else{var $=A.return;$!==null?(Ae=$,Hu($)):Ae=null}break e}}ke=0,fi=null,zr(t,n,c,5);break;case 6:ke=0,fi=null,zr(t,n,c,6);break;case 8:Ih(),dn=6;break t;default:throw Error(s(462))}}eM();break}catch(ht){__(t,ht)}while(!0);return Ta=Os=null,vt.H=r,vt.A=u,Ge=a,Ae!==null?0:($e=null,De=0,Yl(),dn)}function eM(){for(;Ae!==null&&!yt();)y_(Ae)}function y_(t){var n=zg(t.alternate,t,Da);t.memoizedProps=t.pendingProps,n===null?Hu(t):Ae=n}function M_(t){var n=t,a=n.alternate;switch(n.tag){case 15:case 0:n=Dg(a,n,n.pendingProps,n.type,void 0,De);break;case 11:n=Dg(a,n,n.pendingProps,n.type.render,n.ref,De);break;case 5:kf(n);var r=n;r===An&&(ye?(Jl(r),r.tag===5&&r.stateNode!=null&&(en=r.stateNode)):(Jl(r),ye=!0));default:Fg(a,n),n=Ae=f0(n,Da),n=zg(a,n,Da)}t.memoizedProps=t.pendingProps,n===null?Hu(t):Ae=n}function zr(t,n,a,r){Ta=Os=null,kf(n),Mr=null,Bo=0;var u=n.return;try{if(Vy(t,u,n,a,De)){dn=1,vu(t,Ti(a,t.current)),Ae=null;return}}catch(c){if(u!==null)throw Ae=u,c;dn=1,vu(t,Ti(a,t.current)),Ae=null;return}n.flags&32768?(ye||r===1?t=!0:Dr||(De&536870912)!==0?t=!1:(rs=t=!0,(r===2||r===9||r===3||r===6)&&(r=Un.current,r!==null&&r.tag===13&&(r.flags|=16384))),E_(n,t)):Hu(n)}function Hu(t){var n=t;do{if((n.flags&32768)!==0){E_(n,rs);return}t=n.return;var a=Yy(n.alternate,n,Da);if(a!==null){Ae=a;return}if(n=n.sibling,n!==null){Ae=n;return}Ae=n=t}while(n!==null);dn===0&&(dn=5)}function E_(t,n){do{var a=qy(t.alternate,t);if(a!==null){a.flags&=32767,Ae=a;return}if(a=t.return,a!==null&&(a.flags|=32768,a.subtreeFlags=0,a.deletions=null),!n&&(t=t.sibling,t!==null)){Ae=t;return}Ae=t=a}while(t!==null);dn=6,Ae=null}function T_(t,n,a,r,u,c,g,A,I,$,ht,Et){t.cancelPendingCommit=null;do Gu();while(rn!==0);if((Ge&6)!==0)throw Error(s(327));if(n!==null){if(n===t.current)throw Error(s(177));t===$e&&(Ae=$e=null,De=0),qs=n,Fi=t,aa=a,Ph=u,d_=r,nM(t,n,a,g,A,I,Et)}}function nM(t,n,a,r,u,c,g){var A=n.lanes|n.childLanes;if(Oh=A,A|=vf,Ol(t,a,A,r,u,c),Lr=null,(a&335544064)===a?(Or=Dy(t),r=10262):(Or=null,r=10256),(n.subtreeFlags&r)!==0||(n.flags&r)!==0?(t.callbackNode=null,t.callbackPriority=0,lM(zt,function(){return Gh(),null})):(t.callbackNode=null,t.callbackPriority=0),Au=!1,r=(n.flags&13878)!==0,(n.subtreeFlags&13878)!==0||r){r=vt.T,vt.T=null,u=Ut.p,Ut.p=2,c=Ge,Ge|=4;try{Zy(t,n,a)}finally{Ge=c,Ut.p=u,vt.T=r}}rn=1,Au?Ur=CM(g,t.containerInfo,Or,Bh,Fh,aM,Hh,Gh,iM):(Bh(),Fh(),Hh())}function iM(t){if(rn!==0){var n=Fi.onRecoverableError;n(t,{componentStack:null})}}function aM(){rn===3&&(rn=0,r_(qs,Fi),rn=4)}function Bh(){if(rn===1){rn=0;var t=Fi,n=qs,a=aa,r=(n.flags&13878)!==0;if((n.subtreeFlags&13878)!==0||r){r=vt.T,vt.T=null;var u=Ut.p;Ut.p=2;var c=Ge;Ge|=4;try{Ko=wu=!1,a_(n,t,a),a=$h;var g=e0(t.containerInfo),A=a.focusedElem,I=a.selectionRange;if(g!==A&&A&&A.ownerDocument&&t0(A.ownerDocument.documentElement,A)){if(I!==null&&df(A)){var $=I.start,ht=I.end;if(ht===void 0&&(ht=$),"selectionStart"in A)A.selectionStart=$,A.selectionEnd=Math.min(ht,A.value.length);else{var Et=A.ownerDocument||document,j=Et&&Et.defaultView||window;if(j.getSelection){var ut=j.getSelection(),Ht=A.textContent.length,$t=Math.min(I.start,Ht),ge=I.end===void 0?$t:Math.min(I.end,Ht);!ut.extend&&$t>ge&&(g=ge,ge=$t,$t=g);var J=$m(A,$t),H=$m(A,ge);if(J&&H&&(ut.rangeCount!==1||ut.anchorNode!==J.node||ut.anchorOffset!==J.offset||ut.focusNode!==H.node||ut.focusOffset!==H.offset)){var it=Et.createRange();it.setStart(J.node,J.offset),ut.removeAllRanges(),$t>ge?(ut.addRange(it),ut.extend(H.node,H.offset)):(it.setEnd(H.node,H.offset),ut.addRange(it))}}}}for(Et=[],ut=A;ut=ut.parentNode;)ut.nodeType===1&&Et.push({element:ut,left:ut.scrollLeft,top:ut.scrollTop});for(typeof A.focus=="function"&&A.focus(),A=0;A<Et.length;A++){var Mt=Et[A];Mt.element.scrollLeft=Mt.left,Mt.element.scrollTop=Mt.top}}Wr=!!Jh,$h=Jh=null}finally{Ge=c,Ut.p=u,vt.T=r}}t.current=n,rn=2}}function Fh(){if(rn===2){rn=0;var t=Fi,n=qs,a=(n.flags&8772)!==0;if((n.subtreeFlags&8772)!==0||a){a=vt.T,vt.T=null;var r=Ut.p;Ut.p=2;var u=Ge;Ge|=4;try{Jg(t,n.alternate,n)}finally{Ge=u,Ut.p=r,vt.T=a}}rn=3}}function Hh(){if(rn===4||rn===3){rn=0;var t=Ur;Ur=null,At();var n=Fi,a=qs,r=aa,u=d_,c=(r&335544064)===r?10262:10256;if((a.subtreeFlags&c)!==0||(a.flags&c)!==0?rn=5:(rn=0,qs=Fi=null,b_(n,n.pendingLanes)),c=n.pendingLanes,c===0&&(ls=null),Eo(r),a=a.stateNode,Wt&&typeof Wt.onCommitFiberRoot=="function")try{Wt.onCommitFiberRoot(te,a,void 0,(a.current.flags&128)===128)}catch{}if(u!==null){a=vt.T,c=Ut.p,Ut.p=2,vt.T=null;try{for(var g=n.onRecoverableError,A=0;A<u.length;A++){var I=u[A];g(I.value,{componentStack:I.stack})}}finally{vt.T=a,Ut.p=c}}if(u=Lr,g=Or,Or=null,u!==null&&(Lr=null,g===null&&(g=[]),t!==null))for(I=0;I<u.length;I++)a=(0,u[I])(g),a!==void 0&&t.finished.finally(a);(aa&3)!==0&&Gu(),sa(n),c=n.pendingLanes,(r&261930)!==0&&(c&42)!==0?n===zu?tl++:(tl=0,zu=n):(tl=0,zu=null),el(0)}}function b_(t,n){(t.pooledCacheLanes&=n)===0&&(n=t.pooledCache,n!=null&&(t.pooledCache=null,Po(n)))}function Gu(){return Ur!==null&&(Ur.skipTransition(),Ur=null),Bh(),Fh(),Hh(),Gh()}function Gh(){if(rn!==5)return!1;var t=Fi,n=Oh;Oh=0;var a=Eo(aa),r=vt.T,u=Ut.p;try{Ut.p=32>a?32:a,vt.T=null,a=Ph,Ph=null;var c=Fi,g=aa;if(rn=0,qs=Fi=null,aa=0,(Ge&6)!==0)throw Error(s(331));var A=Ge;if(Ge|=4,c_(c.current),o_(c,c.current,g,a),Ge=A,el(0,!1),Wt&&typeof Wt.onPostCommitFiberRoot=="function")try{Wt.onPostCommitFiberRoot(te,c)}catch{}return!0}finally{Ut.p=u,vt.T=r,b_(t,n)}}function A_(t,n,a){n=Ti(a,n),n=ah(t.stateNode,n,2),t=ts(t,n,2),t!==null&&(qi(t,2),sa(t))}function We(t,n,a){if(t.tag===3)A_(t,t,a);else for(;n!==null;){if(n.tag===3){A_(n,t,a);break}else if(n.tag===1){var r=n.stateNode;if(typeof n.type.getDerivedStateFromError=="function"||typeof r.componentDidCatch=="function"&&(ls===null||!ls.has(r))){t=Ti(a,t),a=Mg(2),r=ts(n,a,2),r!==null&&(Eg(a,r,n,t),qi(r,2),sa(r));break}}n=n.return}}function Vh(t,n,a){var r=t.pingCache;if(r===null){r=t.pingCache=new Qy;var u=new Set;r.set(n,u)}else u=r.get(n),u===void 0&&(u=new Set,r.set(n,u));u.has(a)||(Uh=!0,u.add(a),t=sM.bind(null,t,n,a),n.then(t,t))}function sM(t,n,a){var r=t.pingCache;r!==null&&r.delete(n),t.pingedLanes|=t.suspendedLanes&a,t.warmLanes&=~a,$e===t&&(De&a)===a&&((dn===4||dn===3&&(De&62914560)===De&&300>Lt()-Ou)&&(Ge&2)===0?Ir(t,0):Lu|=a,Nr===De&&(Nr=0)),sa(t)}function R_(t,n){n===0&&(n=xo()),t=Ns(t,n),t!==null&&(qi(t,n),sa(t))}function rM(t){var n=t.memoizedState,a=0;n!==null&&(a=n.retryLane),R_(t,a)}function oM(t,n){var a=0;switch(t.tag){case 31:case 13:var r=t.stateNode,u=t.memoizedState;u!==null&&(a=u.retryLane);break;case 19:r=t.stateNode;break;case 22:r=t.stateNode._retryCache;break;default:throw Error(s(314))}r!==null&&r.delete(n),R_(t,a)}function lM(t,n){return mt(t,n)}var Br=null,Fr=null,Xh=!1,Vu=!1,kh=!1,cs=0;function sa(t){t!==Fr&&t.next===null&&(Fr===null?Br=Fr=t:Fr=Fr.next=t),Vu=!0,Xh||(Xh=!0,cM())}function el(t,n){if(!kh&&Vu){kh=!0;do for(var a=!1,r=Br;r!==null;){if(t!==0){var u=r.pendingLanes;if(u===0)var c=0;else{var g=r.suspendedLanes,A=r.pingedLanes;c=(1<<31-fe(42|t)+1)-1,c&=u&~(g&~A),c=c&201326741?c&201326741|1:c?c|2:0}c!==0&&(a=!0,N_(r,c))}else c=De,c=Rs(r,r===$e?c:0,r.cancelPendingCommit!==null||r.timeoutHandle!==-1),(c&3)===0||ka(r,c)||(a=!0,N_(r,c));r=r.next}while(a);kh=!1}}function uM(){C_()}function C_(){Vu=Xh=!1;var t=0;cs!==0&&yM()&&(t=cs);for(var n=Lt(),a=null,r=Br;r!==null;){var u=r.next,c=w_(r,n);c===0?(r.next=null,a===null?Br=u:a.next=u,u===null&&(Fr=a)):(a=r,(t!==0||(c&3)!==0)&&(Vu=!0)),r=u}rn!==0&&rn!==5||el(t),cs!==0&&(cs=0)}function w_(t,n){for(var a=t.suspendedLanes,r=t.pingedLanes,u=t.expirationTimes,c=t.pendingLanes&-62914561;0<c;){var g=31-fe(c),A=1<<g,I=u[g];I===-1?((A&a)===0||(A&r)!==0)&&(u[g]=vo(A,n)):I<=n&&(t.expiredLanes|=A),c&=~A}if(n=$e,a=De,a=Rs(t,t===n?a:0,t.cancelPendingCommit!==null||t.timeoutHandle!==-1),r=t.callbackNode,a===0||t===n&&(ke===2||ke===9)||t.cancelPendingCommit!==null)return r!==null&&r!==null&&Ct(r),t.callbackNode=null,t.callbackPriority=0;if((a&3)===0||ka(t,a)){if(n=a&-a,n===t.callbackPriority)return n;switch(r!==null&&Ct(r),Eo(a)){case 2:case 8:a=k;break;case 32:a=zt;break;case 268435456:a=Bt;break;default:a=zt}return r=D_.bind(null,t),a=mt(a,r),t.callbackPriority=n,t.callbackNode=a,n}return r!==null&&r!==null&&Ct(r),t.callbackPriority=2,t.callbackNode=null,2}function D_(t,n){if(rn!==0&&rn!==5)return t.callbackNode=null,t.callbackPriority=0,null;var a=t.callbackNode;if(Gu()&&t.callbackNode!==a)return null;var r=De;return r=Rs(t,t===$e?r:0,t.cancelPendingCommit!==null||t.timeoutHandle!==-1),r===0?null:(m_(t,r,n),w_(t,Lt()),t.callbackNode!=null&&t.callbackNode===a?D_.bind(null,t):null)}function N_(t,n){if(Gu())return null;m_(t,n,!0)}function cM(){EM(function(){(Ge&6)!==0?mt(ae,uM):C_()})}function Wh(){if(cs===0){var t=zs;t===0&&(t=rr,rr<<=1,(rr&261888)===0&&(rr=256)),cs=t}return cs}function U_(t){return t==null||typeof t=="symbol"||typeof t=="boolean"?null:typeof t=="function"?t:Bl(t)}function fM(t,n,a,r,u){if(n==="submit"&&a&&a.stateNode===u){var c=U_((u[B]||null).action),g=r.submitter;g&&(n=(n=g[B]||null)?U_(n.formAction):g.getAttribute("formAction"),n!==null&&(c=n,g=null));var A=new Vl("action","action",null,r,u);t.push({event:A,listeners:[{instance:null,listener:function(){if(r.defaultPrevented){if(cs!==0){var I=new FormData(u,g);$f(a,{pending:!0,data:I,method:u.method,action:c},null,I)}}else typeof c=="function"&&(A.preventDefault(),I=new FormData(u,g),$f(a,{pending:!0,data:I,method:u.method,action:c},c,I))},currentTarget:u}]})}}for(var Yh=0;Yh<_f.length;Yh++){var qh=_f[Yh],hM=qh.toLowerCase(),dM=qh[0].toUpperCase()+qh.slice(1);Pi(hM,"on"+dM)}Pi(a0,"onAnimationEnd"),Pi(s0,"onAnimationIteration"),Pi(r0,"onAnimationStart"),Pi("dblclick","onDoubleClick"),Pi("focusin","onFocus"),Pi("focusout","onBlur"),Pi(My,"onTransitionRun"),Pi(Ey,"onTransitionStart"),Pi(Ty,"onTransitionCancel"),Pi(o0,"onTransitionEnd"),cn("onMouseEnter",["mouseout","mouseover"]),cn("onMouseLeave",["mouseout","mouseover"]),cn("onPointerEnter",["pointerout","pointerover"]),cn("onPointerLeave",["pointerout","pointerover"]),Xt("onChange","change click focusin focusout input keydown keyup selectionchange".split(" ")),Xt("onSelect","focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange".split(" ")),Xt("onBeforeInput",["compositionend","keypress","textInput","paste"]),Xt("onCompositionEnd","compositionend focusout keydown keypress keyup mousedown".split(" ")),Xt("onCompositionStart","compositionstart focusout keydown keypress keyup mousedown".split(" ")),Xt("onCompositionUpdate","compositionupdate focusout keydown keypress keyup mousedown".split(" "));var nl="abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting".split(" "),pM=new Set("beforetoggle cancel close invalid load scroll scrollend toggle".split(" ").concat(nl));function L_(t,n){n=(n&4)!==0;for(var a=0;a<t.length;a++){var r=t[a],u=r.event;r=r.listeners;t:{var c=void 0;if(n)for(var g=r.length-1;0<=g;g--){var A=r[g],I=A.instance,$=A.currentTarget;if(A=A.listener,I!==c&&u.isPropagationStopped())break t;c=A,u.currentTarget=$;try{c(u)}catch(ht){Wl(ht)}u.currentTarget=null,c=I}else for(g=0;g<r.length;g++){if(A=r[g],I=A.instance,$=A.currentTarget,A=A.listener,I!==c&&u.isPropagationStopped())break t;c=A,u.currentTarget=$;try{c(u)}catch(ht){Wl(ht)}u.currentTarget=null,c=I}}}}function Re(t,n){var a=n[ot];a===void 0&&(a=n[ot]=new Set);var r=t+"__bubble";a.has(r)||(O_(n,t,2,!1),a.add(r))}function Zh(t,n,a){var r=0;n&&(r|=4),O_(a,t,r,n)}var Xu="_reactListening"+Math.random().toString(36).slice(2);function jh(t){if(!t[Xu]){t[Xu]=!0,Ve.forEach(function(a){a!=="selectionchange"&&(pM.has(a)||Zh(a,!1,t),Zh(a,!0,t))});var n=t.nodeType===9?t:t.ownerDocument;n===null||n[Xu]||(n[Xu]=!0,Zh("selectionchange",!1,n))}}function O_(t,n,a,r){switch(Ev(n)){case 2:var u=rE;break;case 8:u=oE;break;default:u=md}a=u.bind(null,n,a,t),u=void 0,!nf||n!=="touchstart"&&n!=="touchmove"&&n!=="wheel"||(u=!0),r?u!==void 0?t.addEventListener(n,a,{capture:!0,passive:u}):t.addEventListener(n,a,!0):u!==void 0?t.addEventListener(n,a,{passive:u}):t.addEventListener(n,a,!1)}function Kh(t,n,a,r,u){var c=r;if((n&1)===0&&(n&2)===0&&r!==null)t:for(;;){if(r===null)return;var g=r.tag;if(g===3||g===4){var A=r.stateNode.containerInfo;if(A===u)break;if(g===4)for(g=r.return;g!==null;){var I=g.tag;if((I===3||I===4)&&g.stateNode.containerInfo===u)return;g=g.return}for(;A!==null;){if(g=re(A),g===null)return;if(I=g.tag,I===5||I===6||I===26||I===27){r=c=g;continue t}A=A.parentNode}}r=r.return}Om(function(){var $=c,ht=tf(a),Et=[];t:{var j=l0.get(t);if(j!==void 0){var ut=Vl,Ht=t;switch(t){case"keypress":if(Hl(a)===0)break t;case"keydown":case"keyup":ut=JS;break;case"focusin":Ht="focus",ut=of;break;case"focusout":Ht="blur",ut=of;break;case"beforeblur":case"afterblur":ut=of;break;case"click":if(a.button===2)break t;case"auxclick":case"dblclick":case"mousedown":case"mousemove":case"mouseup":case"mouseout":case"mouseover":case"contextmenu":ut=zm;break;case"drag":case"dragend":case"dragenter":case"dragexit":case"dragleave":case"dragover":case"dragstart":case"drop":ut=HS;break;case"touchcancel":case"touchend":case"touchmove":case"touchstart":ut=iy;break;case a0:case s0:case r0:ut=XS;break;case o0:ut=sy;break;case"scroll":case"scrollend":ut=BS;break;case"wheel":ut=oy;break;case"copy":case"cut":case"paste":ut=WS;break;case"gotpointercapture":case"lostpointercapture":case"pointercancel":case"pointerdown":case"pointermove":case"pointerout":case"pointerover":case"pointerup":ut=Fm;break;case"submit":ut=ey;break;case"toggle":case"beforetoggle":ut=uy}var $t=(n&4)!==0,ge=!$t&&(t==="scroll"||t==="scrollend"),J=$t?j!==null?j+"Capture":null:j;$t=[];for(var H=$,it;H!==null;){var Mt=H;if(it=Mt.stateNode,Mt=Mt.tag,Mt!==5&&Mt!==26&&Mt!==27||it===null||J===null||(Mt=To(H,J),Mt!=null&&$t.push(il(H,Mt,it))),ge)break;H=H.return}0<$t.length&&(j=new ut(j,Ht,null,a,ht),Et.push({event:j,listeners:$t}))}}if((n&7)===0){t:{if(ut=t==="mouseover"||t==="pointerover",j=t==="mouseout"||t==="pointerout",ut&&a!==$c&&(Ht=a.relatedTarget||a.fromElement)&&(re(Ht)||Ht[pt]))break t;(j||ut)&&(Ht=ht.window===ht?ht:(ut=ht.ownerDocument)?ut.defaultView||ut.parentWindow:window,j?(ut=a.relatedTarget||a.toElement,j=$,ut=ut?re(ut):null,ut!==null&&(ge=f(ut),$t=ut.tag,ut!==ge||$t!==5&&$t!==27&&$t!==6)&&(ut=null)):(j=null,ut=$),j!==ut&&($t=zm,Mt="onMouseLeave",J="onMouseEnter",H="mouse",(t==="pointerout"||t==="pointerover")&&($t=Fm,Mt="onPointerLeave",J="onPointerEnter",H="pointer"),ge=j==null?Ht:Zt(j),it=ut==null?Ht:Zt(ut),Ht=new $t(Mt,H+"leave",j,a,ht),Ht.target=ge,Ht.relatedTarget=it,Mt=null,re(ht)===$&&($t=new $t(J,H+"enter",ut,a,ht),$t.target=it,$t.relatedTarget=ge,Mt=$t),ge=Mt,$t=j&&ut?N(j,ut,mM):null,j!==null&&P_(Et,Ht,j,$t,!1),ut!==null&&ge!==null&&P_(Et,ge,ut,$t,!0)))}t:{if(j=$?Zt($):window,ut=j.nodeName&&j.nodeName.toLowerCase(),ut==="select"||ut==="input"&&j.type==="file")var jt=qm;else if(Wm(j))if(Zm)jt=xy;else{jt=_y;var Ne=gy}else ut=j.nodeName,!ut||ut.toLowerCase()!=="input"||j.type!=="checkbox"&&j.type!=="radio"?$&&Jc($.elementType)&&(jt=qm):jt=vy;if(jt&&(jt=jt(t,$))){Ym(Et,jt,a,ht);break t}Ne&&Ne(t,j,$)}switch(Ne=$?Zt($):window,t){case"focusin":(Wm(Ne)||Ne.contentEditable==="true")&&(dr=Ne,pf=$,Uo=null);break;case"focusout":Uo=pf=dr=null;break;case"mousedown":mf=!0;break;case"contextmenu":case"mouseup":case"dragend":mf=!1,n0(Et,a,ht);break;case"selectionchange":if(yy)break;case"keydown":case"keyup":n0(Et,a,ht)}var ie;if(uf)t:{switch(t){case"compositionstart":var se="onCompositionStart";break t;case"compositionend":se="onCompositionEnd";break t;case"compositionupdate":se="onCompositionUpdate";break t}se=void 0}else hr?Xm(t,a)&&(se="onCompositionEnd"):t==="keydown"&&a.keyCode===229&&(se="onCompositionStart");se&&(Hm&&a.locale!=="ko"&&(hr||se!=="onCompositionStart"?se==="onCompositionEnd"&&hr&&(ie=Pm()):(Wa=ht,af="value"in Wa?Wa.value:Wa.textContent,hr=!0)),Ne=ku($,se),0<Ne.length&&(se=new Bm(se,t,null,a,ht),Et.push({event:se,listeners:Ne}),ie?se.data=ie:(ie=km(a),ie!==null&&(se.data=ie)))),(ie=fy?hy(t,a):dy(t,a))&&(se=ku($,"onBeforeInput"),0<se.length&&(Ne=new Bm("onBeforeInput","beforeinput",null,a,ht),Et.push({event:Ne,listeners:se}),Ne.data=ie)),fM(Et,t,$,a,ht)}L_(Et,n)})}function il(t,n,a){return{instance:t,listener:n,currentTarget:a}}function ku(t,n){for(var a=n+"Capture",r=[];t!==null;){var u=t,c=u.stateNode;if(u=u.tag,u!==5&&u!==26&&u!==27||c===null||(u=To(t,a),u!=null&&r.unshift(il(t,u,c)),u=To(t,n),u!=null&&r.push(il(t,u,c))),t.tag===3)return r;t=t.return}return[]}function mM(t){if(t===null)return null;do t=t.return;while(t&&t.tag!==5&&t.tag!==27);return t||null}function P_(t,n,a,r,u){for(var c=n._reactName,g=[];a!==null&&a!==r;){var A=a,I=A.alternate,$=A.stateNode;if(A=A.tag,I!==null&&I===r)break;A!==5&&A!==26&&A!==27||$===null||(I=$,u?($=To(a,c),$!=null&&g.unshift(il(a,$,I))):u||($=To(a,c),$!=null&&g.push(il(a,$,I)))),a=a.return}g.length!==0&&t.push({event:n,listeners:g})}var gM=/\r\n?/g,_M=/\u0000|\uFFFD/g;function I_(t){return(typeof t=="string"?t:""+t).replace(gM,`
`).replace(_M,"")}function z_(t,n){return n=I_(n),I_(t)===n}function Ye(t,n,a,r,u,c){switch(a){case"children":if(typeof r=="string")n==="body"||n==="textarea"&&r===""||ur(t,r);else if(typeof r=="number"||typeof r=="bigint")n!=="body"&&ur(t,""+r);else return;break;case"className":oi(t,"class",r);break;case"tabIndex":oi(t,"tabindex",r);break;case"dir":case"role":case"viewBox":case"width":case"height":oi(t,a,r);break;case"style":Um(t,r,c);return;case"data":if(n!=="object"){oi(t,"data",r);break}case"src":case"href":if(r===""&&(n!=="a"||a!=="href")){t.removeAttribute(a);break}if(r==null||typeof r=="function"||typeof r=="symbol"||typeof r=="boolean"){t.removeAttribute(a);break}r=Bl(r),t.setAttribute(a,r);break;case"action":case"formAction":if(typeof r=="function"){t.setAttribute(a,"javascript:throw new Error('A React form was unexpectedly submitted. If you called form.submit() manually, consider using form.requestSubmit() instead. If you\\'re trying to use event.stopPropagation() in a submit event handler, consider also calling event.preventDefault().')");break}else typeof c=="function"&&(a==="formAction"?(n!=="input"&&Ye(t,n,"name",u.name,u,null),Ye(t,n,"formEncType",u.formEncType,u,null),Ye(t,n,"formMethod",u.formMethod,u,null),Ye(t,n,"formTarget",u.formTarget,u,null)):(Ye(t,n,"encType",u.encType,u,null),Ye(t,n,"method",u.method,u,null),Ye(t,n,"target",u.target,u,null)));if(r==null||typeof r=="symbol"||typeof r=="boolean"){t.removeAttribute(a);break}r=Bl(r),t.setAttribute(a,r);break;case"onClick":r!=null&&(t.onclick=ji);return;case"onScroll":r!=null&&Re("scroll",t);return;case"onScrollEnd":r!=null&&Re("scrollend",t);return;case"dangerouslySetInnerHTML":if(r!=null){if(typeof r!="object"||!("__html"in r))throw Error(s(61));if(a=r.__html,a!=null){if(u.children!=null)throw Error(s(60));c?.__html!==a&&(t.innerHTML=a)}}break;case"multiple":t.multiple=r&&typeof r!="function"&&typeof r!="symbol";break;case"muted":t.muted=r&&typeof r!="function"&&typeof r!="symbol";break;case"suppressContentEditableWarning":case"suppressHydrationWarning":case"defaultValue":case"defaultChecked":case"innerHTML":case"ref":break;case"autoFocus":break;case"xlinkHref":if(r==null||typeof r=="function"||typeof r=="boolean"||typeof r=="symbol"){t.removeAttribute("xlink:href");break}a=Bl(r),t.setAttributeNS("http://www.w3.org/1999/xlink","xlink:href",a);break;case"contentEditable":case"spellCheck":case"draggable":case"value":case"autoReverse":case"externalResourcesRequired":case"focusable":case"preserveAlpha":r!=null&&typeof r!="function"&&typeof r!="symbol"?t.setAttribute(a,r):t.removeAttribute(a);break;case"inert":case"allowFullScreen":case"async":case"autoPlay":case"controls":case"credentialless":case"default":case"defer":case"disabled":case"disablePictureInPicture":case"disableRemotePlayback":case"formNoValidate":case"hidden":case"loop":case"noModule":case"noValidate":case"open":case"playsInline":case"readOnly":case"required":case"reversed":case"scoped":case"seamless":case"itemScope":r&&typeof r!="function"&&typeof r!="symbol"?t.setAttribute(a,""):t.removeAttribute(a);break;case"capture":case"download":r===!0?t.setAttribute(a,""):r!==!1&&r!=null&&typeof r!="function"&&typeof r!="symbol"?t.setAttribute(a,r):t.removeAttribute(a);break;case"cols":case"rows":case"size":case"span":r!=null&&typeof r!="function"&&typeof r!="symbol"&&!isNaN(r)&&1<=r?t.setAttribute(a,r):t.removeAttribute(a);break;case"rowSpan":case"start":r==null||typeof r=="function"||typeof r=="symbol"||isNaN(r)?t.removeAttribute(a):t.setAttribute(a,r);break;case"popover":Re("beforetoggle",t),Re("toggle",t),tn(t,"popover",r);break;case"xlinkActuate":we(t,"http://www.w3.org/1999/xlink","xlink:actuate",r);break;case"xlinkArcrole":we(t,"http://www.w3.org/1999/xlink","xlink:arcrole",r);break;case"xlinkRole":we(t,"http://www.w3.org/1999/xlink","xlink:role",r);break;case"xlinkShow":we(t,"http://www.w3.org/1999/xlink","xlink:show",r);break;case"xlinkTitle":we(t,"http://www.w3.org/1999/xlink","xlink:title",r);break;case"xlinkType":we(t,"http://www.w3.org/1999/xlink","xlink:type",r);break;case"xmlBase":we(t,"http://www.w3.org/XML/1998/namespace","xml:base",r);break;case"xmlLang":we(t,"http://www.w3.org/XML/1998/namespace","xml:lang",r);break;case"xmlSpace":we(t,"http://www.w3.org/XML/1998/namespace","xml:space",r);break;case"is":tn(t,"is",r);break;case"innerText":case"textContent":return;default:if(!(2<a.length)||a[0]!=="o"&&a[0]!=="O"||a[1]!=="n"&&a[1]!=="N")a=IS.get(a)||a,tn(t,a,r);else return}Se=!0}function Qh(t,n,a,r,u,c){switch(a){case"style":Um(t,r,c);return;case"dangerouslySetInnerHTML":if(r!=null){if(typeof r!="object"||!("__html"in r))throw Error(s(61));if(a=r.__html,a!=null){if(u.children!=null)throw Error(s(60));c?.__html!==a&&(t.innerHTML=a)}}break;case"children":if(typeof r=="string")ur(t,r);else if(typeof r=="number"||typeof r=="bigint")ur(t,""+r);else return;break;case"onScroll":r!=null&&Re("scroll",t);return;case"onScrollEnd":r!=null&&Re("scrollend",t);return;case"onClick":r!=null&&(t.onclick=ji);return;case"suppressContentEditableWarning":case"suppressHydrationWarning":case"innerHTML":case"ref":return;case"innerText":case"textContent":return;default:if(!yn.hasOwnProperty(a))t:{if(a[0]==="o"&&a[1]==="n"&&(u=a.endsWith("Capture"),c=a.slice(2,u?a.length-7:void 0),n=t[B]||null,n=n!=null?n[a]:null,typeof n=="function"&&t.removeEventListener(c,n,u),typeof r=="function")){typeof n!="function"&&n!==null&&(a in t?t[a]=null:t.hasAttribute(a)&&t.removeAttribute(a)),t.addEventListener(c,r,u);break t}Se=!0,a in t?t[a]=r:r===!0?t.setAttribute(a,""):tn(t,a,r)}return}Se=!0}function Pn(t,n,a){switch(n){case"div":case"span":case"svg":case"path":case"a":case"g":case"p":case"li":break;case"img":Re("error",t),Re("load",t);var r=!1,u=!1,c;for(c in a)if(a.hasOwnProperty(c)){var g=a[c];if(g!=null)switch(c){case"src":r=!0;break;case"srcSet":u=!0;break;case"children":case"dangerouslySetInnerHTML":throw Error(s(137,n));default:Ye(t,n,c,g,a,null)}}u&&Ye(t,n,"srcSet",a.srcSet,a,null),r&&Ye(t,n,"src",a.src,a,null);return;case"input":Re("invalid",t);var A=c=g=u=null,I=null,$=null;for(r in a)if(a.hasOwnProperty(r)){var ht=a[r];if(ht!=null)switch(r){case"name":u=ht;break;case"type":g=ht;break;case"checked":I=ht;break;case"defaultChecked":$=ht;break;case"value":c=ht;break;case"defaultValue":A=ht;break;case"children":case"dangerouslySetInnerHTML":if(ht!=null)throw Error(s(137,n));break;default:Ye(t,n,r,ht,a,null)}}Cm(t,c,A,I,$,g,u,!1);return;case"select":Re("invalid",t),r=g=c=null;for(u in a)if(a.hasOwnProperty(u)&&(A=a[u],A!=null))switch(u){case"value":c=A;break;case"defaultValue":g=A;break;case"multiple":r=A;default:Ye(t,n,u,A,a,null)}n=c,a=g,t.multiple=!!r,n!=null?lr(t,!!r,n,!1):a!=null&&lr(t,!!r,a,!0);return;case"textarea":Re("invalid",t),c=u=r=null;for(g in a)if(a.hasOwnProperty(g)&&(A=a[g],A!=null))switch(g){case"value":r=A;break;case"defaultValue":u=A;break;case"children":c=A;break;case"dangerouslySetInnerHTML":if(A!=null)throw Error(s(91));break;default:Ye(t,n,g,A,a,null)}Dm(t,r,u,c);return;case"option":for(I in a)a.hasOwnProperty(I)&&(r=a[I],r!=null)&&(I==="selected"?t.selected=r&&typeof r!="function"&&typeof r!="symbol":Ye(t,n,I,r,a,null));return;case"dialog":Re("beforetoggle",t),Re("toggle",t),Re("cancel",t),Re("close",t);break;case"iframe":case"object":Re("load",t);break;case"video":case"audio":for(r=0;r<nl.length;r++)Re(nl[r],t);break;case"image":Re("error",t),Re("load",t);break;case"details":Re("toggle",t);break;case"embed":case"source":case"link":Re("error",t),Re("load",t);case"area":case"base":case"br":case"col":case"hr":case"keygen":case"meta":case"param":case"track":case"wbr":case"menuitem":for($ in a)if(a.hasOwnProperty($)&&(r=a[$],r!=null))switch($){case"children":case"dangerouslySetInnerHTML":throw Error(s(137,n));default:Ye(t,n,$,r,a,null)}return;default:if(Jc(n)){for(ht in a)a.hasOwnProperty(ht)&&(r=a[ht],r!==void 0&&Qh(t,n,ht,r,a,void 0));return}}for(A in a)a.hasOwnProperty(A)&&(r=a[A],r!=null&&Ye(t,n,A,r,a,null))}var vM={};function xM(t,n,a,r){switch(n){case"div":case"span":case"svg":case"path":case"a":case"g":case"p":case"li":break;case"input":var u=null,c=null,g=null,A=null,I=null,$=null,ht=null;for(ut in a){var Et=a[ut];if(a.hasOwnProperty(ut)&&Et!=null)switch(ut){case"checked":break;case"value":break;case"defaultValue":I=Et;default:r.hasOwnProperty(ut)||Ye(t,n,ut,null,r,Et)}}for(var j in r){var ut=r[j];if(Et=a[j],r.hasOwnProperty(j)&&(ut!=null||Et!=null))switch(j){case"type":ut!==Et&&(Se=!0),c=ut;break;case"name":ut!==Et&&(Se=!0),u=ut;break;case"checked":ut!==Et&&(Se=!0),$=ut;break;case"defaultChecked":ut!==Et&&(Se=!0),ht=ut;break;case"value":ut!==Et&&(Se=!0),g=ut;break;case"defaultValue":ut!==Et&&(Se=!0),A=ut;break;case"children":case"dangerouslySetInnerHTML":if(ut!=null)throw Error(s(137,n));break;default:ut!==Et&&Ye(t,n,j,ut,r,Et)}}Kc(t,g,A,I,$,ht,c,u);return;case"select":ut=g=A=j=null;for(c in a)if(I=a[c],a.hasOwnProperty(c)&&I!=null)switch(c){case"value":break;case"multiple":ut=I;default:r.hasOwnProperty(c)||Ye(t,n,c,null,r,I)}for(u in r)if(c=r[u],I=a[u],r.hasOwnProperty(u)&&(c!=null||I!=null))switch(u){case"value":c!==I&&(Se=!0),j=c;break;case"defaultValue":c!==I&&(Se=!0),A=c;break;case"multiple":c!==I&&(Se=!0),g=c;default:c!==I&&Ye(t,n,u,c,r,I)}n=A,a=g,r=ut,j!=null?lr(t,!!a,j,!1):!!r!=!!a&&(n!=null?lr(t,!!a,n,!0):lr(t,!!a,a?[]:"",!1));return;case"textarea":ut=j=null;for(A in a)if(u=a[A],a.hasOwnProperty(A)&&u!=null&&!r.hasOwnProperty(A))switch(A){case"value":break;case"children":break;default:Ye(t,n,A,null,r,u)}for(g in r)if(u=r[g],c=a[g],r.hasOwnProperty(g)&&(u!=null||c!=null))switch(g){case"value":u!==c&&(Se=!0),j=u;break;case"defaultValue":u!==c&&(Se=!0),ut=u;break;case"children":break;case"dangerouslySetInnerHTML":if(u!=null)throw Error(s(91));break;default:u!==c&&Ye(t,n,g,u,r,c)}wm(t,j,ut);return;case"option":for(var Ht in a)j=a[Ht],a.hasOwnProperty(Ht)&&j!=null&&!r.hasOwnProperty(Ht)&&(Ht==="selected"?t.selected=!1:Ye(t,n,Ht,null,r,j));for(I in r)j=r[I],ut=a[I],r.hasOwnProperty(I)&&j!==ut&&(j!=null||ut!=null)&&(I==="selected"?(j!==ut&&(Se=!0),t.selected=j&&typeof j!="function"&&typeof j!="symbol"):Ye(t,n,I,j,r,ut));return;case"img":case"link":case"area":case"base":case"br":case"col":case"embed":case"hr":case"keygen":case"meta":case"param":case"source":case"track":case"wbr":case"menuitem":for(var $t in a)j=a[$t],a.hasOwnProperty($t)&&j!=null&&!r.hasOwnProperty($t)&&Ye(t,n,$t,null,r,j);for($ in r)if(j=r[$],ut=a[$],r.hasOwnProperty($)&&j!==ut&&(j!=null||ut!=null))switch($){case"children":case"dangerouslySetInnerHTML":if(j!=null)throw Error(s(137,n));break;default:Ye(t,n,$,j,r,ut)}return;default:if(Jc(n)){for(var ge in a)j=a[ge],a.hasOwnProperty(ge)&&j!==void 0&&!r.hasOwnProperty(ge)&&Qh(t,n,ge,void 0,r,j);for(ht in r)j=r[ht],ut=a[ht],!r.hasOwnProperty(ht)||j===ut||j===void 0&&ut===void 0||Qh(t,n,ht,j,r,ut);return}}for(var J in a)j=a[J],a.hasOwnProperty(J)&&j!=null&&!r.hasOwnProperty(J)&&Ye(t,n,J,null,r,j);for(Et in r)j=r[Et],ut=a[Et],!r.hasOwnProperty(Et)||j===ut||j==null&&ut==null||Ye(t,n,Et,j,r,ut)}function B_(t){switch(t){case"css":case"script":case"font":case"img":case"image":case"input":case"link":return!0;default:return!1}}function SM(){if(typeof performance.getEntriesByType=="function"){for(var t=0,n=0,a=performance.getEntriesByType("resource"),r=0;r<a.length;r++){var u=a[r],c=u.transferSize,g=u.initiatorType,A=u.duration;if(c&&A&&B_(g)){for(g=0,A=u.responseEnd,r+=1;r<a.length;r++){var I=a[r],$=I.startTime;if($>A)break;var ht=I.transferSize,Et=I.initiatorType;ht&&B_(Et)&&(I=I.responseEnd,g+=ht*(I<A?1:(A-$)/(I-$)))}if(--r,n+=8*(c+g)/(u.duration/1e3),t++,10<t)break}}if(0<t)return n/t/1e6}return navigator.connection&&(t=navigator.connection.downlink,typeof t=="number")?t:5}var Jh=null,$h=null;function al(t){return t.nodeType===9?t:t.ownerDocument}function F_(t){switch(t){case"http://www.w3.org/2000/svg":return 1;case"http://www.w3.org/1998/Math/MathML":return 2;default:return 0}}function H_(t,n){if(t===0)switch(n){case"svg":return 1;case"math":return 2;default:return 0}return t===1&&n==="foreignObject"?0:t}function G_(t,n,a,r){return a=al(a).createElement(t),a[b]=r,a[B]=n,Pn(a,t,n),xe(a),a}function td(t,n){return t==="textarea"||t==="noscript"||typeof n.children=="string"||typeof n.children=="number"||typeof n.children=="bigint"||typeof n.dangerouslySetInnerHTML=="object"&&n.dangerouslySetInnerHTML!==null&&n.dangerouslySetInnerHTML.__html!=null}var ed=null;function yM(){var t=window.event;return t&&t.type==="popstate"?t===ed?!1:(ed=t,!0):(ed=null,!1)}var nd=typeof setTimeout=="function"?setTimeout:void 0,MM=typeof clearTimeout=="function"?clearTimeout:void 0,V_=typeof Promise=="function"?Promise:void 0,X_=typeof requestAnimationFrame=="function"?requestAnimationFrame:nd,EM=typeof queueMicrotask=="function"?queueMicrotask:typeof V_<"u"?function(t){return V_.resolve(null).then(t).catch(TM)}:nd;function TM(t){setTimeout(function(){throw t})}function fs(t){return t==="head"}function k_(t,n){var a=n,r=0;do{var u=a.nextSibling;if(t.removeChild(a),u&&u.nodeType===8)if(a=u.data,a==="/$"||a==="/&"){if(r===0){t.removeChild(u),Yr(n);return}r--}else if(a==="$"||a==="$?"||a==="$~"||a==="$!"||a==="&")r++;else if(a==="html")cd(t.ownerDocument.documentElement);else if(a==="head"){a=t.ownerDocument.head,cd(a);for(var c=a.firstChild;c;){var g=c.nextSibling,A=c.nodeName;c[Ft]||A==="SCRIPT"||A==="STYLE"||A==="LINK"&&c.rel.toLowerCase()==="stylesheet"||a.removeChild(c),c=g}}else a==="body"&&cd(t.ownerDocument.body);a=u}while(a);Yr(n)}function W_(t,n){var a=t;t=0;do{var r=a.nextSibling;if(a.nodeType===1?n?(a._stashedDisplay=a.style.display,a.style.display="none"):(a.style.display=a._stashedDisplay||"",a.getAttribute("style")===""&&a.removeAttribute("style")):a.nodeType===3&&(n?(a._stashedText=a.nodeValue,a.nodeValue=""):a.nodeValue=a._stashedText||""),r&&r.nodeType===8)if(a=r.data,a==="/$"){if(t===0)break;t--}else a!=="$"&&a!=="$?"&&a!=="$~"&&a!=="$!"||t++;a=r}while(a)}function Y_(t,n,a){if(n=CSS.escape(n)!==n?"r-"+btoa(n).replace(/=/g,""):n,t.style.viewTransitionName=n,a!=null&&(t.style.viewTransitionClass=a),a=getComputedStyle(t),a.display==="inline"){if(n=t.getClientRects(),n.length===1)var r=1;else for(var u=r=0;u<n.length;u++){var c=n[u];0<c.width&&0<c.height&&r++}r===1&&(t=t.style,t.display=n.length===1?"inline-block":"block",t.marginTop="-"+a.paddingTop,t.marginBottom="-"+a.paddingBottom)}}function q_(t,n){t=t.style,n=n.style;var a=n!=null?n.hasOwnProperty("viewTransitionName")?n.viewTransitionName:n.hasOwnProperty("view-transition-name")?n["view-transition-name"]:null:null;t.viewTransitionName=a==null||typeof a=="boolean"?"":(""+a).trim(),a=n!=null?n.hasOwnProperty("viewTransitionClass")?n.viewTransitionClass:n.hasOwnProperty("view-transition-class")?n["view-transition-class"]:null:null,t.viewTransitionClass=a==null||typeof a=="boolean"?"":(""+a).trim(),t.display==="inline-block"&&(n==null?t.display=t.margin="":(a=n.display,t.display=a==null||typeof a=="boolean"?"":a,a=n.margin,a!=null?t.margin=a:(a=n.hasOwnProperty("marginTop")?n.marginTop:n["margin-top"],t.marginTop=a==null||typeof a=="boolean"?"":a,n=n.hasOwnProperty("marginBottom")?n.marginBottom:n["margin-bottom"],t.marginBottom=n==null||typeof n=="boolean"?"":n)))}function bM(t,n,a){return a=a.ownerDocument.defaultView,{rect:t,abs:n.position==="absolute"||n.position==="fixed",clip:n.clipPath!=="none"||n.overflow!=="visible"||n.filter!=="none"||n.mask!=="none"||n.mask!=="none"||n.borderRadius!=="0px",view:0<=t.bottom&&0<=t.right&&t.top<=a.innerHeight&&t.left<=a.innerWidth}}function id(t){var n=t.getBoundingClientRect(),a=getComputedStyle(t);return bM(n,a,t)}function AM(t){return t.documentElement.clientHeight}function RM(t){this.addEventListener("load",t),this.addEventListener("error",t)}function CM(t,n,a,r,u,c,g,A,I){var $=n.nodeType===9?n:n.ownerDocument;try{var ht=$.startViewTransition({update:function(){var j=$.defaultView,ut=j.navigation&&j.navigation.transition,Ht=$.fonts.status;r();var $t=[];if(Ht==="loaded"&&(AM($),$.fonts.status==="loading"&&$t.push($.fonts.ready)),Ht=$t.length,t!==null)for(var ge=t.suspenseyImages,J=0,H=0;H<ge.length;H++){var it=ge[H];if(!it.complete){var Mt=it.getBoundingClientRect();if(0<Mt.bottom&&0<Mt.right&&Mt.top<j.innerHeight&&Mt.left<j.innerWidth){if(J+=pv(it),J>qu){$t.length=Ht;break}it=new Promise(RM.bind(it)),$t.push(it)}}}if(0<$t.length)return j=Promise.race([Promise.all($t),new Promise(function(jt){return setTimeout(jt,500)})]).then(u,u),(ut?Promise.allSettled([ut.finished,j]):j).then(c,c);if(u(),ut)return ut.finished.then(c,c);c()},types:a});$.__reactViewTransition=ht;var Et=[];return ht.ready.then(function(){for(var j=$.documentElement.getAnimations({subtree:!0}),ut=0;ut<j.length;ut++){var Ht=j[ut],$t=Ht.effect,ge=$t.pseudoElement;if(ge!=null&&ge.startsWith("::view-transition")){Et.push(Ht),Ht=$t.getKeyframes();for(var J=ge=void 0,H=!0,it=0;it<Ht.length;it++){var Mt=Ht[it],jt=Mt.width;if(ge===void 0)ge=jt;else if(ge!==jt){H=!1;break}if(jt=Mt.height,J===void 0)J=jt;else if(J!==jt){H=!1;break}delete Mt.width,delete Mt.height,Mt.transform==="none"&&delete Mt.transform}H&&ge!==void 0&&J!==void 0&&($t.setKeyframes(Ht),H=getComputedStyle($t.target,$t.pseudoElement),H.width!==ge||H.height!==J)&&(H=Ht[0],H.width=ge,H.height=J,H=Ht[Ht.length-1],H.width=ge,H.height=J,$t.setKeyframes(Ht))}}g()},function(j){$.__reactViewTransition===ht&&($.__reactViewTransition=null);try{typeof j=="object"&&j!==null&&j.name==="InvalidStateError"&&(j.message==="View transition was skipped because document visibility state is hidden."||j.message==="Skipping view transition because document visibility state has become hidden."||j.message==="Skipping view transition because viewport size changed."||j.message==="Transition was aborted because of invalid state")&&(j=null),j!==null&&I(j)}finally{r(),u(),g()}}),ht.finished.finally(function(){for(var j=0;j<Et.length;j++)Et[j].cancel();$.__reactViewTransition===ht&&($.__reactViewTransition=null),A()}),ht}catch{return r(),u(),g(),null}}function Zs(t,n){this._scope=document.documentElement,this._selector="::view-transition-"+t+"("+n+")"}Zs.prototype.animate=function(t,n){return n=typeof n=="number"?{duration:n}:P({},n),n.pseudoElement=this._selector,this._scope.animate(t,n)},Zs.prototype.getAnimations=function(){for(var t=this._scope,n=this._selector,a=t.getAnimations({subtree:!0}),r=[],u=0;u<a.length;u++){var c=a[u].effect;c!==null&&c.target===t&&c.pseudoElement===n&&r.push(a[u])}return r},Zs.prototype.getComputedStyle=function(){return getComputedStyle(this._scope,this._selector)};function Z_(t){return{name:t,group:new Zs("group",t),imagePair:new Zs("image-pair",t),old:new Zs("old",t),new:new Zs("new",t)}}function pi(t){this._fragmentFiber=t,this._observers=this._eventListeners=null}pi.prototype.addEventListener=function(t,n,a){var r=null,u=null;if(!(a!=null&&typeof a!="boolean"&&(r=a.signal||null,r!==null&&r.aborted))){this._eventListeners===null&&(this._eventListeners=[]);var c=this._eventListeners;if(K_(c,t,n,a)===-1){var g=this,A=n;a!=null&&typeof a!="boolean"&&a.once===!0&&(A=function(I){g.removeEventListener(t,n,a),typeof n=="function"?n.call(this,I):n.handleEvent(I)}),r!==null&&(u=g.removeEventListener.bind(g,t,n,a),r.addEventListener("abort",u,{once:!0}),u=r.removeEventListener.bind(r,"abort",u)),r=Hr(a),c.push({type:t,listener:n,optionsOrUseCapture:a,attachedListener:A,cleanup:u}),_(this._fragmentFiber.child,!1,wM,t,A,r)}this._eventListeners=c}};function wM(t,n,a,r){return y(t).addEventListener(n,a,r),!1}pi.prototype.removeEventListener=function(t,n,a){var r=this._eventListeners;if(r!==null&&(n=K_(r,t,n,a),n!==-1)){var u=r[n];a=u.attachedListener;var c=u.cleanup;u=Hr(u.optionsOrUseCapture),_(this._fragmentFiber.child,!1,DM,t,a,u),r.splice(n,1),c!==null&&c()}};function DM(t,n,a,r){return y(t).removeEventListener(n,a,r),!1}function Hr(t){return t!=null&&typeof t!="boolean"&&(t.once===!0||t.signal instanceof AbortSignal)?{capture:t.capture,passive:t.passive}:t}function j_(t){return t==null?"c=0":typeof t=="boolean"?"c="+(t?"1":"0"):"c="+(t.capture?"1":"0")}function K_(t,n,a,r){if(t.length===0)return-1;r=j_(r);for(var u=0;u<t.length;u++){var c=t[u];if(c.type===n&&c.listener===a&&j_(c.optionsOrUseCapture)===r)return u}return-1}pi.prototype.dispatchEvent=function(t){var n=v(this._fragmentFiber);if(n===null)return!0;n=y(n);var a=this._eventListeners;if(a!==null&&0<a.length||!t.bubbles){var r=n.nodeType===9?n.createComment(""):document.createTextNode("");if(a)for(var u=0;u<a.length;u++){var c=a[u];r.addEventListener(c.type,c.attachedListener,Hr(c.optionsOrUseCapture))}if(n.appendChild(r),t=r.dispatchEvent(t),a)for(u=0;u<a.length;u++)c=a[u],r.removeEventListener(c.type,c.attachedListener,Hr(c.optionsOrUseCapture));return n.removeChild(r),t}return n.dispatchEvent(t)},pi.prototype.focus=function(t){_(this._fragmentFiber.child,!0,Q_,t,void 0,void 0)};function Q_(t,n){return t.tag===6?!1:(t=y(t),VM(t,n))}pi.prototype.focusLast=function(t){var n=[];_(this._fragmentFiber.child,!0,ad,n,void 0,void 0);for(var a=n.length-1;0<=a&&!Q_(n[a],t);a--);};function ad(t,n){return n.push(t),!1}pi.prototype.blur=function(){var t=v(this._fragmentFiber);t!==null&&(t=y(t),t=al(t).activeElement,t!==null&&_(this._fragmentFiber.child,!1,NM,t,void 0,void 0))};function NM(t,n){return t.tag===6?!1:(t=y(t),t===n||t.contains(n)?(n.blur(),!0):!1)}pi.prototype.observeUsing=function(t){this._observers===null&&(this._observers=new Set),this._observers.add(t),_(this._fragmentFiber.child,!1,UM,t,void 0,void 0)};function UM(t,n){return t.tag===6||(t=y(t),n.observe(t)),!1}pi.prototype.unobserveUsing=function(t){var n=this._observers;if(n!==null&&n.has(t)){n.delete(t),_(this._fragmentFiber.child,!1,LM,t,void 0,void 0);for(var a=n=0;a<Hi.length;a++){var r=Hi[a];r.fragmentInstance===this&&r.observer===t?t.unobserve(r.instance):Hi[n++]=r}Hi.length=n}};function LM(t,n){return t.tag===6||(t=y(t),n.unobserve(t)),!1}var Hi=[],sd=!1;function OM(t,n,a){Hi.push({fragmentInstance:t,observer:n,instance:a}),sd||(sd=!0,XM(function(){sd=!1;var r=Hi;Hi=[];for(var u=0;u<r.length;u++){var c=r[u];c.observer.unobserve(c.instance)}}))}pi.prototype.getClientRects=function(){var t=[];return _(this._fragmentFiber.child,!1,PM,t,void 0,void 0),t};function PM(t,n){if(t.tag===6){t=t.stateNode;var a=t.ownerDocument.createRange();a.selectNodeContents(t),n.push.apply(n,a.getClientRects())}else t=y(t),n.push.apply(n,t.getClientRects());return!1}pi.prototype.getRootNode=function(t){var n=v(this._fragmentFiber);return n===null?this:y(n).getRootNode(t)},pi.prototype.compareDocumentPosition=function(t){var n=v(this._fragmentFiber);if(n===null)return Node.DOCUMENT_POSITION_DISCONNECTED;var a=[];_(this._fragmentFiber.child,!1,ad,a,void 0,void 0);var r=y(n);if(a.length===0){if(a=r,M(this._fragmentFiber)){t:{for(n=this._fragmentFiber.return;n!==null;){if(n.tag===4){n=n.stateNode.containerInfo;break t}if(n.tag===3||n.tag===5||n.tag===27)break;n=n.return}n=null}n!=null&&(a=n)}n=this._fragmentFiber;var u=r=a.compareDocumentPosition(t);return a===t?u=Node.DOCUMENT_POSITION_CONTAINS:r&Node.DOCUMENT_POSITION_CONTAINED_BY&&(a=R(n)[1],a===null?u=Node.DOCUMENT_POSITION_PRECEDING:(t=y(a).compareDocumentPosition(t),u=t===0||t&Node.DOCUMENT_POSITION_FOLLOWING?Node.DOCUMENT_POSITION_FOLLOWING:Node.DOCUMENT_POSITION_PRECEDING)),u|=Node.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC}n=y(a[0]),u=y(a[a.length-1]);var c=M(this._fragmentFiber)?n.parentElement:r;if(c==null)return Node.DOCUMENT_POSITION_DISCONNECTED;r=c.compareDocumentPosition(n)&Node.DOCUMENT_POSITION_CONTAINED_BY,c=c.compareDocumentPosition(u)&Node.DOCUMENT_POSITION_CONTAINED_BY;var g=n.compareDocumentPosition(t),A=u.compareDocumentPosition(t),I=g&Node.DOCUMENT_POSITION_CONTAINED_BY||A&Node.DOCUMENT_POSITION_CONTAINED_BY;return A=r&&c&&g&Node.DOCUMENT_POSITION_FOLLOWING&&A&Node.DOCUMENT_POSITION_PRECEDING,n=r&&n===t||c&&u===t||I||A?Node.DOCUMENT_POSITION_CONTAINED_BY:!r&&n===t||!c&&u===t?Node.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC:g,n&Node.DOCUMENT_POSITION_DISCONNECTED||n&Node.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC||IM(n,this._fragmentFiber,a[0],a[a.length-1],t)?n:Node.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC};function IM(t,n,a,r,u){var c=re(u);if(t&Node.DOCUMENT_POSITION_CONTAINED_BY){if(a=!!c)t:{for(;c!==null;){if(c.tag===7&&(c===n||c.alternate===n)){a=!0;break t}c=c.return}a=!1}return a}if(t&Node.DOCUMENT_POSITION_CONTAINS){if(c===null)return c=u.ownerDocument,u===c||u===c.documentElement||u===c.body;t:{for(c=n,n=v(n);c!==null;){if(!(c.tag!==5&&c.tag!==3&&c.tag!==27||c!==n&&c.alternate!==n)){c=!0;break t}c=c.return}c=!1}return c}return t&Node.DOCUMENT_POSITION_PRECEDING?((n=!!c)&&!(n=c===a)&&(n=N(a,c,D),n===null?n=!1:(_(n,!0,G,c,a),c=S,S=null,n=c!==null)),n):t&Node.DOCUMENT_POSITION_FOLLOWING?((n=!!c)&&!(n=c===r)&&(n=N(r,c,D),n===null?n=!1:(_(n,!0,C,c,r),c=S,O=S=null,n=c!==null)),n):!1}function J_(t,n){var a=t.ownerDocument.createRange();a.selectNodeContents(t),t=a.getBoundingClientRect(),window.scrollTo(window.scrollX+t.left,n?window.scrollY+t.top:window.scrollY+t.bottom-window.innerHeight)}pi.prototype.scrollIntoView=function(t){if(typeof t=="object")throw Error(s(566));var n=[];_(this._fragmentFiber.child,!1,ad,n,void 0,void 0);var a=t!==!1;if(n.length===0){var r=R(this._fragmentFiber);if(r=a?r[1]||r[0]||v(this._fragmentFiber):r[0]||r[1],r===null)return;if(r.tag===6){t=y(r),J_(t,a);return}if(r=y(r),r.nodeType!==9){if(r.nodeType===11){a="host"in r?r.host:null,a!==null&&a.scrollIntoView(t);return}r.scrollIntoView(t)}}for(r=a?n.length-1:0;r!==(a?-1:n.length);){var u=n[r];u.tag===6?(u=y(u),J_(u,a)):y(u).scrollIntoView(t),r+=a?-1:1}};function zM(t,n){return t=y(t),$_(t,n),!1}function $_(t,n){t.reactFragments==null&&(t.reactFragments=new Set),t.reactFragments.add(n)}function tv(t,n){var a=n._eventListeners;if(a!==null)for(var r=0;r<a.length;r++){var u=a[r];t.addEventListener(u.type,u.attachedListener,Hr(u.optionsOrUseCapture))}t.nodeType!==3&&(a=n._observers,a!==null&&a.forEach(function(c){for(var g=0,A=0;A<Hi.length;A++){var I=Hi[A];(I.fragmentInstance!==n||I.observer!==c||I.instance!==t)&&(Hi[g++]=I)}Hi.length=g,c.observe(t)}),$_(t,n))}function BM(t,n){var a=n._eventListeners;if(a!==null)for(var r=0;r<a.length;r++){var u=a[r];t.removeEventListener(u.type,u.attachedListener,Hr(u.optionsOrUseCapture))}t.nodeType!==3&&(a=n._observers,a!==null&&a.forEach(function(c){typeof c.rootMargin=="string"?OM(n,c,t):c.unobserve(t)}),t.reactFragments!=null&&t.reactFragments.delete(n))}function rd(t){var n=t.firstChild;for(n&&n.nodeType===10&&(n=n.nextSibling);n;){var a=n;switch(n=n.nextSibling,a.nodeName){case"HTML":case"HEAD":case"BODY":rd(a),Jt(a);continue;case"SCRIPT":case"STYLE":continue;case"LINK":if(a.rel.toLowerCase()==="stylesheet")continue}t.removeChild(a)}}function FM(t,n,a,r){for(;t.nodeType===1;){var u=a;if(t.nodeName.toLowerCase()!==n.toLowerCase()){if(!r&&(t.nodeName!=="INPUT"||t.type!=="hidden"))break}else if(r){if(!t[Ft])switch(n){case"meta":if(!t.hasAttribute("itemprop"))break;return t;case"link":if(c=t.getAttribute("rel"),c==="stylesheet"&&t.hasAttribute("data-precedence"))break;if(c!==u.rel||t.getAttribute("href")!==(u.href==null||u.href===""?null:u.href)||t.getAttribute("crossorigin")!==(u.crossOrigin==null?null:u.crossOrigin)||t.getAttribute("title")!==(u.title==null?null:u.title))break;return t;case"style":if(t.hasAttribute("data-precedence"))break;return t;case"script":if(c=t.getAttribute("src"),(c!==(u.src==null?null:u.src)||t.getAttribute("type")!==(u.type==null?null:u.type)||t.getAttribute("crossorigin")!==(u.crossOrigin==null?null:u.crossOrigin))&&c&&t.hasAttribute("async")&&!t.hasAttribute("itemprop"))break;return t;default:return t}}else if(n==="input"&&t.type==="hidden"){var c=u.name==null?null:""+u.name;if(u.type==="hidden"&&t.getAttribute("name")===c)return t}else return t;if(t=wi(t.nextSibling),t===null)break}return null}function HM(t,n,a){if(n==="")return null;for(;t.nodeType!==3;)if((t.nodeType!==1||t.nodeName!=="INPUT"||t.type!=="hidden")&&!a||(t=wi(t.nextSibling),t===null))return null;return t}function ev(t,n){for(;t.nodeType!==8;)if((t.nodeType!==1||t.nodeName!=="INPUT"||t.type!=="hidden")&&!n||(t=wi(t.nextSibling),t===null))return null;return t}function od(t){return t.data==="$?"||t.data==="$~"}function ld(t){return t.data==="$!"||t.data==="$?"&&t.ownerDocument.readyState!=="loading"}function GM(t,n){var a=t.ownerDocument;if(t.data==="$~")t._reactRetry=n;else if(t.data!=="$?"||a.readyState!=="loading")n();else{var r=function(){n(),a.removeEventListener("DOMContentLoaded",r)};a.addEventListener("DOMContentLoaded",r),t._reactRetry=r}}function wi(t){for(;t!=null;t=t.nextSibling){var n=t.nodeType;if(n===1||n===3)break;if(n===8){if(n=t.data,n==="$"||n==="$!"||n==="$?"||n==="$~"||n==="&"||n==="F!"||n==="F")break;if(n==="/$"||n==="/&")return null}}return t}var ud=null;function nv(t){t=t.nextSibling;for(var n=0;t;){if(t.nodeType===8){var a=t.data;if(a==="/$"||a==="/&"){if(n===0)return wi(t.nextSibling);n--}else a!=="$"&&a!=="$!"&&a!=="$?"&&a!=="$~"&&a!=="&"||n++}t=t.nextSibling}return null}function iv(t){t=t.previousSibling;for(var n=0;t;){if(t.nodeType===8){var a=t.data;if(a==="$"||a==="$!"||a==="$?"||a==="$~"||a==="&"){if(n===0)return t;n--}else a!=="/$"&&a!=="/&"||n++}t=t.previousSibling}return null}function VM(t,n){function a(){r=!0}if(t.ownerDocument.activeElement===t)return!0;var r=!1;try{t.ownerDocument.addEventListener("focus",a,!0),(t.focus||HTMLElement.prototype.focus).call(t,n)}finally{t.ownerDocument.removeEventListener("focus",a,!0)}return r}function XM(t){X_(function(){X_(function(n){return t(n)})})}function av(t,n,a){switch(n=al(a),t){case"html":if(t=n.documentElement,!t)throw Error(s(452));return t;case"head":if(t=n.head,!t)throw Error(s(453));return t;case"body":if(t=n.body,!t)throw Error(s(454));return t;default:throw Error(s(451))}}function sv(t,n,a){for(var r in a){var u=a[r];a.hasOwnProperty(r)&&u!=null&&Ye(t,n,r,null,vM,u)}a.dangerouslySetInnerHTML!=null&&(t.textContent=""),t.onclick===ji&&(t.onclick=null),Jt(t)}function cd(t){for(var n=t.attributes;n.length;)t.removeAttributeNode(n[0]);Jt(t)}var Di=new Map,rv=new Set;function sl(t){if(typeof t.getRootNode=="function"){var n=t.getRootNode();if(n.nodeType===9||n.nodeType===11)return n}return t.nodeType===9?t:t.ownerDocument}var Na=Ut.d;Ut.d={f:kM,r:WM,D:YM,C:qM,L:ZM,m:jM,X:QM,S:KM,M:JM};function kM(){var t=Na.f(),n=Bu();return t||n}function WM(t){var n=he(t);n!==null&&n.tag===5&&n.type==="form"?lg(n):Na.r(t)}var Gr=typeof document>"u"?null:document;function ov(t,n,a){var r=Gr;if(r&&typeof n=="string"&&n){var u=Mi(n);u='link[rel="'+t+'"][href="'+u+'"]',typeof a=="string"&&(u+='[crossorigin="'+a+'"]'),rv.has(u)||(rv.add(u),t={rel:t,crossOrigin:a,href:n},r.querySelector(u)===null&&(n=r.createElement("link"),Pn(n,"link",t),xe(n),r.head.appendChild(n)))}}function YM(t){Na.D(t),ov("dns-prefetch",t,null)}function qM(t,n){Na.C(t,n),ov("preconnect",t,n)}function ZM(t,n,a){Na.L(t,n,a);var r=Gr;if(r&&t&&n){var u='link[rel="preload"][as="'+Mi(n)+'"]';n==="image"&&a&&a.imageSrcSet?(u+='[imagesrcset="'+Mi(a.imageSrcSet)+'"]',typeof a.imageSizes=="string"&&(u+='[imagesizes="'+Mi(a.imageSizes)+'"]')):u+='[href="'+Mi(t)+'"]';var c=u;switch(n){case"style":c=Vr(t);break;case"script":c=Xr(t)}if(!(Di.has(c)||(t=P({rel:"preload",href:n==="image"&&a&&a.imageSrcSet?void 0:t,as:n},a),Di.set(c,t),r.querySelector(u)!==null||n==="style"&&r.querySelector(rl(c))||n==="script"&&r.querySelector(ol(c))))){var g=r.createElement("link");Pn(g,"link",t),n==="style"&&(g[Kt]=!0,g.onload=g.onerror=function(){Ke(g)}),xe(g),r.head.appendChild(g)}}}function jM(t,n){Na.m(t,n);var a=Gr;if(a&&t){var r=n&&typeof n.as=="string"?n.as:"script",u='link[rel="modulepreload"][as="'+Mi(r)+'"][href="'+Mi(t)+'"]',c=u;switch(r){case"audioworklet":case"paintworklet":case"serviceworker":case"sharedworker":case"worker":case"script":c=Xr(t)}if(!Di.has(c)&&(t=P({rel:"modulepreload",href:t},n),Di.set(c,t),a.querySelector(u)===null)){switch(r){case"audioworklet":case"paintworklet":case"serviceworker":case"sharedworker":case"worker":case"script":if(a.querySelector(ol(c)))return}r=a.createElement("link"),Pn(r,"link",t),xe(r),a.head.appendChild(r)}}}function KM(t,n,a){Na.S(t,n,a);var r=Gr;if(r&&t){var u=be(r).hoistableStyles,c=Vr(t);n=n||"default";var g=u.get(c);if(!g){var A={loading:0,preload:null};if(g=r.querySelector(rl(c)))A.loading=5;else{t=P({rel:"stylesheet",href:t,"data-precedence":n},a),(a=Di.get(c))&&fd(t,a);var I=g=r.createElement("link");xe(I),Pn(I,"link",t),I._p=new Promise(function($,ht){I.onload=$,I.onerror=ht}),I.addEventListener("load",function(){A.loading|=1}),I.addEventListener("error",function(){A.loading|=2}),A.loading|=4,Wu(g,n,r)}g={type:"stylesheet",instance:g,count:1,state:A},u.set(c,g)}}}function QM(t,n){Na.X(t,n);var a=Gr;if(a&&t){var r=be(a).hoistableScripts,u=Xr(t),c=r.get(u);c||(c=a.querySelector(ol(u)),c||(t=P({src:t,async:!0},n),(n=Di.get(u))&&hd(t,n),c=a.createElement("script"),xe(c),Pn(c,"link",t),a.head.appendChild(c)),c={type:"script",instance:c,count:1,state:null},r.set(u,c))}}function JM(t,n){Na.M(t,n);var a=Gr;if(a&&t){var r=be(a).hoistableScripts,u=Xr(t),c=r.get(u);c||(c=a.querySelector(ol(u)),c||(t=P({src:t,async:!0,type:"module"},n),(n=Di.get(u))&&hd(t,n),c=a.createElement("script"),xe(c),Pn(c,"link",t),a.head.appendChild(c)),c={type:"script",instance:c,count:1,state:null},r.set(u,c))}}function lv(t,n,a,r){var u=(u=Pe.current)?sl(u):null;if(!u)throw Error(s(446));switch(t){case"meta":case"title":return null;case"style":return typeof a.precedence=="string"&&typeof a.href=="string"?(a=Vr(a.href),n=be(u).hoistableStyles,r=n.get(a),r||(r={type:"style",instance:null,count:0,state:null},n.set(a,r)),r):{type:"void",instance:null,count:0,state:null};case"link":if(a.rel==="stylesheet"&&typeof a.href=="string"&&typeof a.precedence=="string"){t=Vr(a.href);var c=be(u).hoistableStyles,g=c.get(t);if(g||(u=u.ownerDocument||u,g={type:"stylesheet",instance:null,count:0,state:{loading:0,preload:null}},c.set(t,g),(c=u.querySelector(rl(t)))?c._p||(g.instance=c,g.state.loading=5):(c=Di.get(t),c||(c={rel:"preload",as:"style",href:a.href,crossOrigin:a.crossOrigin,integrity:a.integrity,media:a.media,hrefLang:a.hrefLang,referrerPolicy:a.referrerPolicy},Di.set(t,c)),$M(u,t,c,g.state))),n&&r===null)throw Error(s(528,""));return g}if(n&&r!==null)throw Error(s(529,""));return null;case"script":return n=a.async,a=a.src,typeof a=="string"&&n&&typeof n!="function"&&typeof n!="symbol"?(a=Xr(a),n=be(u).hoistableScripts,r=n.get(a),r||(r={type:"script",instance:null,count:0,state:null},n.set(a,r)),r):{type:"void",instance:null,count:0,state:null};default:throw Error(s(444,t))}}function Vr(t){return'href="'+Mi(t)+'"'}function rl(t){return'link[rel="stylesheet"]['+t+"]"}function uv(t){return P({},t,{"data-precedence":t.precedence,precedence:null})}function $M(t,n,a,r){if(n=t.querySelector('link[rel="preload"][as="style"]['+n+"]")){if(n[Kt]!==!0){r.loading=1;return}}else n=t.createElement("link"),n[Kt]=!0,n.onload=n.onerror=Ke.bind(null,n),Pn(n,"link",a),xe(n),t.head.appendChild(n);r.preload=n,n.addEventListener("load",function(){return r.loading|=1}),n.addEventListener("error",function(){return r.loading|=2})}function Xr(t){return'[src="'+Mi(t)+'"]'}function ol(t){return"script[async]"+t}function cv(t,n,a){if(n.count++,n.instance===null)switch(n.type){case"style":var r=t.querySelector('style[data-href~="'+Mi(a.href)+'"]');if(r)return n.instance=r,xe(r),r;var u=P({},a,{"data-href":a.href,"data-precedence":a.precedence,href:null,precedence:null});return r=(t.ownerDocument||t).createElement("style"),xe(r),Pn(r,"style",u),Wu(r,a.precedence,t),n.instance=r;case"stylesheet":u=Vr(a.href);var c=t.querySelector(rl(u));if(c)return n.state.loading|=4,n.instance=c,xe(c),c;r=uv(a),(u=Di.get(u))&&fd(r,u),c=(t.ownerDocument||t).createElement("link"),xe(c);var g=c;return g._p=new Promise(function(A,I){g.onload=A,g.onerror=I}),Pn(c,"link",r),n.state.loading|=4,Wu(c,a.precedence,t),n.instance=c;case"script":return c=Xr(a.src),(u=t.querySelector(ol(c)))?(n.instance=u,xe(u),u):(r=a,(u=Di.get(c))&&(r=P({},a),hd(r,u)),t=t.ownerDocument||t,u=t.createElement("script"),xe(u),Pn(u,"link",r),t.head.appendChild(u),n.instance=u);case"void":return null;default:throw Error(s(443,n.type))}else n.type==="stylesheet"&&(n.state.loading&4)===0&&(r=n.instance,n.state.loading|=4,Wu(r,a.precedence,t));return n.instance}function Wu(t,n,a){for(var r=a.querySelectorAll('link[rel="stylesheet"][data-precedence],style[data-precedence]'),u=r.length?r[r.length-1]:null,c=u,g=0;g<r.length;g++){var A=r[g];if(A.dataset.precedence===n)c=A;else if(c!==u)break}c?c.parentNode.insertBefore(t,c.nextSibling):(n=a.nodeType===9?a.head:a,n.insertBefore(t,n.firstChild))}function fd(t,n){t.crossOrigin==null&&(t.crossOrigin=n.crossOrigin),t.referrerPolicy==null&&(t.referrerPolicy=n.referrerPolicy),t.title==null&&(t.title=n.title)}function hd(t,n){t.crossOrigin==null&&(t.crossOrigin=n.crossOrigin),t.referrerPolicy==null&&(t.referrerPolicy=n.referrerPolicy),t.integrity==null&&(t.integrity=n.integrity)}var Yu=null;function fv(t,n,a){if(Yu===null){var r=new Map,u=Yu=new Map;u.set(a,r)}else u=Yu,r=u.get(a),r||(r=new Map,u.set(a,r));if(r.has(t))return r;for(r.set(t,null),a=a.getElementsByTagName(t),u=0;u<a.length;u++){var c=a[u];if(!(c[Ft]||c[b]||t==="link"&&c.getAttribute("rel")==="stylesheet")&&c.namespaceURI!=="http://www.w3.org/2000/svg"){var g=c.getAttribute(n)||"";g=t+g;var A=r.get(g);A?A.push(c):r.set(g,[c])}}return r}function dd(t,n,a){t=t.ownerDocument||t,t.head.insertBefore(a,n==="title"?t.querySelector("head > title"):null)}function tE(t,n,a){if(a===1||n.itemProp!=null)return!1;switch(t){case"meta":case"title":return!0;case"style":if(typeof n.precedence!="string"||typeof n.href!="string"||n.href==="")break;return!0;case"link":if(typeof n.rel!="string"||typeof n.href!="string"||n.href===""||n.onLoad||n.onError)break;return n.rel==="stylesheet"?(t=n.disabled,typeof n.precedence=="string"&&t==null):!0;case"script":if(n.async&&typeof n.async!="function"&&typeof n.async!="symbol"&&!n.onLoad&&!n.onError&&n.src&&typeof n.src=="string")return!0}return!1}function hv(t,n){return t==="img"&&n.src!=null&&n.src!==""&&n.onLoad==null&&n.loading!=="lazy"}function dv(t){return!(t.type==="stylesheet"&&(t.state.loading&3)===0)}function pv(t){return(t.width||100)*(t.height||100)*(typeof devicePixelRatio=="number"?devicePixelRatio:1)*.25}function mv(t,n){typeof n.decode=="function"&&(t.imgCount++,n.complete||(t.imgBytes+=pv(n),t.suspenseyImages.push(n)),t=iE.bind(t),n.decode().then(t,t))}function eE(t,n,a,r){if(a.type==="stylesheet"&&(typeof r.media!="string"||matchMedia(r.media).matches!==!1)&&(a.state.loading&4)===0){if(a.instance===null){var u=Vr(r.href),c=n.querySelector(rl(u));if(c){n=c._p,n!==null&&typeof n=="object"&&typeof n.then=="function"&&(t.count++,t=ll.bind(t),n.then(t,t)),a.state.loading|=4,a.instance=c,xe(c);return}c=n.ownerDocument||n,r=uv(r),(u=Di.get(u))&&fd(r,u),c=c.createElement("link"),xe(c);var g=c;g._p=new Promise(function(A,I){g.onload=A,g.onerror=I}),Pn(c,"link",r),a.instance=c}t.stylesheets===null&&(t.stylesheets=new Map),t.stylesheets.set(a,n),(n=a.state.preload)&&(a.state.loading&3)===0&&(t.count++,a=ll.bind(t),n.addEventListener("load",a),n.addEventListener("error",a))}}var qu=0;function nE(t,n){return t.stylesheets&&t.count===0&&ju(t,t.stylesheets),0<t.count||0<t.imgCount?function(a){var r=setTimeout(function(){if(t.stylesheets&&ju(t,t.stylesheets),t.unsuspend){var c=t.unsuspend;t.unsuspend=null,c()}},6e4+n);0<t.imgBytes&&qu===0&&(qu=62500*SM());var u=setTimeout(function(){if(t.waitingForImages=!1,t.count===0&&(t.stylesheets&&ju(t,t.stylesheets),t.unsuspend)){var c=t.unsuspend;t.unsuspend=null,c()}},(t.imgBytes>qu?50:800)+n);return t.unsuspend=a,function(){t.unsuspend=null,clearTimeout(r),clearTimeout(u)}}:null}function gv(t){if(t.count===0&&(t.imgCount===0||!t.waitingForImages)){if(t.stylesheets)ju(t,t.stylesheets);else if(t.unsuspend){var n=t.unsuspend;t.unsuspend=null,n()}}}function ll(){this.count--,gv(this)}function iE(){this.imgCount--,gv(this)}var Zu=null;function ju(t,n){t.stylesheets=null,t.unsuspend!==null&&(t.count++,Zu=new Map,n.forEach(aE,t),Zu=null,ll.call(t))}function aE(t,n){if(!(n.state.loading&4)){var a=Zu.get(t);if(a)var r=a.get(null);else{a=new Map,Zu.set(t,a);for(var u=t.querySelectorAll("link[data-precedence],style[data-precedence]"),c=0;c<u.length;c++){var g=u[c];(g.nodeName==="LINK"||g.getAttribute("media")!=="not all")&&(a.set(g.dataset.precedence,g),r=g)}r&&a.set(null,r)}u=n.instance,g=u.getAttribute("data-precedence"),c=a.get(g)||r,c===r&&a.set(null,u),a.set(g,u),this.count++,r=ll.bind(this),u.addEventListener("load",r),u.addEventListener("error",r),c?c.parentNode.insertBefore(u,c.nextSibling):(t=t.nodeType===9?t.head:t,t.insertBefore(u,t.firstChild)),n.state.loading|=4}}var kr={$$typeof:tt,Provider:null,Consumer:null,_currentValue:Te,_currentValue2:Te,_threadCount:0};function sE(t,n,a,r,u,c,g,A,I){this.tag=1,this.containerInfo=t,this.pingCache=this.current=this.pendingChildren=null,this.timeoutHandle=-1,this.callbackNode=this.next=this.pendingContext=this.context=this.cancelPendingCommit=null,this.callbackPriority=0,this.expirationTimes=or(-1),this.entangledLanes=this.shellSuspendCounter=this.errorRecoveryDisabledLanes=this.expiredLanes=this.warmLanes=this.pingedLanes=this.suspendedLanes=this.pendingLanes=0,this.entanglements=or(0),this.hiddenUpdates=or(null),this.identifierPrefix=r,this.onUncaughtError=u,this.onCaughtError=c,this.onRecoverableError=g,this.pooledCache=null,this.pooledCacheLanes=0,this.formState=I,this.transitionTypes=null,this.incompleteTransitions=new Map}function _v(t,n,a,r,u,c,g,A,I,$,ht,Et){return t=new sE(t,n,a,g,I,$,ht,Et,A),n=1,c===!0&&(n|=24),c=Qn(3,null,null,n),t.current=c,c.stateNode=t,n=Cf(),n.refCount++,t.pooledCache=n,n.refCount++,c.memoizedState={element:r,isDehydrated:a,cache:n},Uf(c),t}function vv(t){return t?(t=gr,t):gr}function xv(t,n,a,r,u,c){u=vv(u),r.context===null?r.context=u:r.pendingContext=u,r=$a(n),r.payload={element:a},c=c===void 0?null:c,c!==null&&(r.callback=c),a=ts(t,r,n),a!==null&&(ei(a,t,n),Fo(a,t,n))}function Sv(t,n){if(t=t.memoizedState,t!==null&&t.dehydrated!==null){var a=t.retryLane;t.retryLane=a!==0&&a<n?a:n}}function pd(t,n){Sv(t,n),(t=t.alternate)&&Sv(t,n)}function yv(t){if(t.tag===13||t.tag===31){var n=Ns(t,67108864);n!==null&&ei(n,t,67108864),pd(t,67108864)}}function Mv(t){if(t.tag===13||t.tag===31){var n=di();n=Mo(n);var a=Ns(t,n);a!==null&&ei(a,t,n),pd(t,n)}}var Wr=!0;function rE(t,n,a,r){var u=vt.T;vt.T=null;var c=Ut.p;try{Ut.p=2,md(t,n,a,r)}finally{Ut.p=c,vt.T=u}}function oE(t,n,a,r){var u=vt.T;vt.T=null;var c=Ut.p;try{Ut.p=8,md(t,n,a,r)}finally{Ut.p=c,vt.T=u}}function md(t,n,a,r){if(Wr){var u=gd(r);if(u===null)Kh(t,n,r,Ku,a),Tv(t,r);else if(uE(u,t,n,a,r))r.stopPropagation();else if(Tv(t,r),n&4&&-1<lE.indexOf(t)){for(;u!==null;){var c=he(u);if(c!==null)switch(c.tag){case 3:if(c=c.stateNode,c.current.memoizedState.isDehydrated){var g=_a(c.pendingLanes);if(g!==0){var A=c;for(A.pendingLanes|=2,A.entangledLanes|=2;g;){var I=1<<31-fe(g);A.entanglements[1]|=I,g&=~I}sa(c),(Ge&6)===0&&(Pu=Lt()+500,el(0))}}break;case 31:case 13:A=Ns(c,2),A!==null&&ei(A,c,2),Bu(),pd(c,2)}if(c=gd(r),c===null&&Kh(t,n,r,Ku,a),c===u)break;u=c}u!==null&&r.stopPropagation()}else Kh(t,n,r,null,a)}}function gd(t){return t=tf(t),_d(t)}var Ku=null;function _d(t){if(Ku=null,t=re(t),t!==null){var n=f(t);if(n===null)t=null;else{var a=n.tag;if(a===13){if(t=h(n),t!==null)return t;t=null}else if(a===31){if(t=d(n),t!==null)return t;t=null}else if(a===3){if(n.stateNode.current.memoizedState.isDehydrated)return n.tag===3?n.stateNode.containerInfo:null;t=null}else n!==t&&(t=null)}}return Ku=t,null}function Ev(t){switch(t){case"beforetoggle":case"cancel":case"click":case"close":case"contextmenu":case"copy":case"cut":case"auxclick":case"dblclick":case"dragend":case"dragstart":case"drop":case"focusin":case"focusout":case"input":case"invalid":case"keydown":case"keypress":case"keyup":case"mousedown":case"mouseup":case"paste":case"pause":case"play":case"pointercancel":case"pointerdown":case"pointerup":case"ratechange":case"reset":case"seeked":case"submit":case"toggle":case"touchcancel":case"touchend":case"touchstart":case"volumechange":case"change":case"selectionchange":case"textInput":case"compositionstart":case"compositionend":case"compositionupdate":case"beforeblur":case"afterblur":case"beforeinput":case"blur":case"fullscreenchange":case"fullscreenerror":case"focus":case"hashchange":case"popstate":case"select":case"selectstart":return 2;case"drag":case"dragenter":case"dragexit":case"dragleave":case"dragover":case"mousemove":case"mouseout":case"mouseover":case"pointermove":case"pointerout":case"pointerover":case"resize":case"scroll":case"touchmove":case"wheel":case"mouseenter":case"mouseleave":case"pointerenter":case"pointerleave":return 8;case"message":switch(Qt()){case ae:return 2;case k:return 8;case zt:case Tt:return 32;case Bt:return 268435456;default:return 32}default:return 32}}var vd=!1,hs=null,ds=null,ps=null,ul=new Map,cl=new Map,ms=[],lE="mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset".split(" ");function Tv(t,n){switch(t){case"focusin":case"focusout":hs=null;break;case"dragenter":case"dragleave":ds=null;break;case"mouseover":case"mouseout":ps=null;break;case"pointerover":case"pointerout":ul.delete(n.pointerId);break;case"gotpointercapture":case"lostpointercapture":cl.delete(n.pointerId)}}function fl(t,n,a,r,u,c){return t===null||t.nativeEvent!==c?(t={blockedOn:n,domEventName:a,eventSystemFlags:r,nativeEvent:c,targetContainers:[u]},n!==null&&(n=he(n),n!==null&&yv(n)),t):(t.eventSystemFlags|=r,n=t.targetContainers,u!==null&&n.indexOf(u)===-1&&n.push(u),t)}function uE(t,n,a,r,u){switch(n){case"focusin":return hs=fl(hs,t,n,a,r,u),!0;case"dragenter":return ds=fl(ds,t,n,a,r,u),!0;case"mouseover":return ps=fl(ps,t,n,a,r,u),!0;case"pointerover":var c=u.pointerId;return ul.set(c,fl(ul.get(c)||null,t,n,a,r,u)),!0;case"gotpointercapture":return c=u.pointerId,cl.set(c,fl(cl.get(c)||null,t,n,a,r,u)),!0}return!1}function bv(t){var n=re(t.target);if(n!==null){var a=f(n);if(a!==null){if(n=a.tag,n===13){if(n=h(a),n!==null){t.blockedOn=n,Il(t.priority,function(){Mv(a)});return}}else if(n===31){if(n=d(a),n!==null){t.blockedOn=n,Il(t.priority,function(){Mv(a)});return}}else if(n===3&&a.stateNode.current.memoizedState.isDehydrated){t.blockedOn=a.tag===3?a.stateNode.containerInfo:null;return}}}t.blockedOn=null}function Qu(t){if(t.blockedOn!==null)return!1;for(var n=t.targetContainers;0<n.length;){var a=gd(t.nativeEvent);if(a===null){a=t.nativeEvent;var r=new a.constructor(a.type,a);$c=r,a.target.dispatchEvent(r),$c=null}else return n=he(a),n!==null&&yv(n),t.blockedOn=a,!1;n.shift()}return!0}function Av(t,n,a){Qu(t)&&a.delete(n)}function cE(){vd=!1,hs!==null&&Qu(hs)&&(hs=null),ds!==null&&Qu(ds)&&(ds=null),ps!==null&&Qu(ps)&&(ps=null),ul.forEach(Av),cl.forEach(Av)}function Ju(t,n){t.blockedOn===n&&(t.blockedOn=null,vd||(vd=!0,o.unstable_scheduleCallback(o.unstable_NormalPriority,cE)))}var $u=null;function Rv(t){$u!==t&&($u=t,o.unstable_scheduleCallback(o.unstable_NormalPriority,function(){$u===t&&($u=null);for(var n=0;n<t.length;n+=3){var a=t[n],r=t[n+1],u=t[n+2];if(typeof r!="function"){if(_d(r||a)===null)continue;break}var c=he(a);c!==null&&(t.splice(n,3),n-=3,$f(c,{pending:!0,data:u,method:a.method,action:r},r,u))}}))}function Yr(t){function n(I){return Ju(I,t)}hs!==null&&Ju(hs,t),ds!==null&&Ju(ds,t),ps!==null&&Ju(ps,t),ul.forEach(n),cl.forEach(n);for(var a=0;a<ms.length;a++){var r=ms[a];r.blockedOn===t&&(r.blockedOn=null)}for(;0<ms.length&&(a=ms[0],a.blockedOn===null);)bv(a),a.blockedOn===null&&ms.shift();if(a=(t.ownerDocument||t).$$reactFormReplay,a!=null)for(r=0;r<a.length;r+=3){var u=a[r],c=a[r+1],g=u[B]||null;if(typeof c=="function")g||Rv(a);else if(g){var A=null;if(c&&c.hasAttribute("formAction")){if(u=c,g=c[B]||null)A=g.formAction;else if(_d(u)!==null)continue}else A=g.action;typeof A=="function"?a[r+1]=A:(a.splice(r,3),r-=3),Rv(a)}}}function Cv(){function t(c){c.canIntercept&&c.info==="react-transition"&&c.intercept({handler:function(){return new Promise(function(g){return u=g})},focusReset:"manual",scroll:"manual"})}function n(){u!==null&&(u(),u=null),r||setTimeout(a,20)}function a(){if(!r&&!navigation.transition){var c=navigation.currentEntry;c&&c.url!=null&&navigation.navigate(c.url,{state:c.getState(),info:"react-transition",history:"replace"})}}if(typeof navigation=="object"){var r=!1,u=null;return navigation.addEventListener("navigate",t),navigation.addEventListener("navigatesuccess",n),navigation.addEventListener("navigateerror",n),setTimeout(a,100),function(){r=!0,navigation.removeEventListener("navigate",t),navigation.removeEventListener("navigatesuccess",n),navigation.removeEventListener("navigateerror",n),u!==null&&(u(),u=null)}}}function xd(t){this._internalRoot=t}tc.prototype.render=xd.prototype.render=function(t){var n=this._internalRoot;if(n===null)throw Error(s(409));var a=n.current,r=di();xv(a,r,t,n,null,null)},tc.prototype.unmount=xd.prototype.unmount=function(){var t=this._internalRoot;if(t!==null){this._internalRoot=null;var n=t.containerInfo;xv(t.current,2,null,t,null,null),Bu(),n[pt]=null}};function tc(t){this._internalRoot=t}tc.prototype.unstable_scheduleHydration=function(t){if(t){var n=Pl();t={blockedOn:null,target:t,priority:n};for(var a=0;a<ms.length&&n!==0&&n<ms[a].priority;a++);ms.splice(a,0,t),a===0&&bv(t)}};var wv=e.version;if(wv!=="19.3.0")throw Error(s(527,wv,"19.3.0"));Ut.findDOMNode=function(t){var n=t._reactInternals;if(n===void 0)throw typeof t.render=="function"?Error(s(188)):(t=Object.keys(t).join(","),Error(s(268,t)));return t=p(n),t=t!==null?x(t):null,t=t===null?null:t.stateNode,t};var fE={bundleType:0,version:"19.3.0",rendererPackageName:"react-dom",currentDispatcherRef:vt,reconcilerVersion:"19.3.0"};if(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__<"u"){var ec=__REACT_DEVTOOLS_GLOBAL_HOOK__;if(!ec.isDisabled&&ec.supportsFiber)try{te=ec.inject(fE),Wt=ec}catch{}}return dl.createRoot=function(t,n){if(!l(t))throw Error(s(299));var a=!1,r="",u=vg,c=xg,g=Sg;return n!=null&&(n.unstable_strictMode===!0&&(a=!0),n.identifierPrefix!==void 0&&(r=n.identifierPrefix),n.onUncaughtError!==void 0&&(u=n.onUncaughtError),n.onCaughtError!==void 0&&(c=n.onCaughtError),n.onRecoverableError!==void 0&&(g=n.onRecoverableError)),n=_v(t,1,!1,null,null,a,r,null,u,c,g,Cv),t[pt]=n.current,jh(t),new xd(n)},dl.hydrateRoot=function(t,n,a){if(!l(t))throw Error(s(299));var r=!1,u="",c=vg,g=xg,A=Sg,I=null;return a!=null&&(a.unstable_strictMode===!0&&(r=!0),a.identifierPrefix!==void 0&&(u=a.identifierPrefix),a.onUncaughtError!==void 0&&(c=a.onUncaughtError),a.onCaughtError!==void 0&&(g=a.onCaughtError),a.onRecoverableError!==void 0&&(A=a.onRecoverableError),a.formState!==void 0&&(I=a.formState)),n=_v(t,1,!0,n,a??null,r,u,I,c,g,A,Cv),n.context=vv(null),a=n.current,r=di(),r=Mo(r),u=$a(r),u.callback=null,ts(a,u,r),a=r,n.current.lanes=a,qi(n,a),sa(n),t[pt]=n.current,jh(t),new tc(n)},dl.version="19.3.0",dl}var Fv;function yE(){if(Fv)return Md.exports;Fv=1;function o(){if(!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__>"u"||typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE!="function"))try{__REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(o)}catch(e){console.error(e)}}return o(),Md.exports=SE(),Md.exports}var ME=yE();const tm="186",uo={ROTATE:0,DOLLY:1,PAN:2},oo={ROTATE:0,PAN:1,DOLLY_PAN:2,DOLLY_ROTATE:3},EE=0,Hv=1,TE=2,Tl=1,bE=2,Ml=3,nr=0,ai=1,Li=2,Fa=0,bl=1,Gv=2,Vv=3,Xv=4,AE=5,ro=100,RE=101,CE=102,wE=103,DE=104,NE=200,UE=201,LE=202,OE=203,Wx=204,Yx=205,PE=206,IE=207,zE=208,BE=209,FE=210,HE=211,GE=212,VE=213,XE=214,up=0,cp=1,fp=2,Rl=3,hp=4,dp=5,pp=6,mp=7,qx=0,kE=1,WE=2,da=0,Zx=1,jx=2,Kx=3,Qx=4,Jx=5,$x=6,tS=7,eS=300,ir=301,ho=302,Ad=303,Rd=304,kc=306,gp=1e3,Ba=1001,_p=1002,zn=1003,YE=1004,nc=1005,Gn=1006,Cd=1007,tr=1008,xi=1009,nS=1010,iS=1011,Cl=1012,em=1013,pa=1014,fa=1015,ma=1016,nm=1017,im=1018,wl=1020,aS=35902,sS=35899,rS=1021,oS=1022,ki=1023,Va=1026,er=1027,lS=1028,am=1029,ar=1030,sm=1031,rm=1033,Dc=33776,Nc=33777,Uc=33778,Lc=33779,vp=35840,xp=35841,Sp=35842,yp=35843,Mp=36196,Ep=37492,Tp=37496,bp=37488,Ap=37489,Ic=37490,Rp=37491,Cp=37808,wp=37809,Dp=37810,Np=37811,Up=37812,Lp=37813,Op=37814,Pp=37815,Ip=37816,zp=37817,Bp=37818,Fp=37819,Hp=37820,Gp=37821,Vp=36492,Xp=36494,kp=36495,Wp=36283,Yp=36284,zc=36285,qp=36286,qE=3200,Zp=0,ZE=1,Ms="",Ui="srgb",Bc="srgb-linear",Fc="linear",qe="srgb",wd=7680,jE=519,KE=512,QE=513,JE=514,om=515,$E=516,tT=517,lm=518,eT=519,nT=35044,kv="300 es",ha=2e3,Dl=2001;function iT(o){for(let e=o.length-1;e>=0;--e)if(o[e]>=65535)return!0;return!1}function Hc(o){return document.createElementNS("http://www.w3.org/1999/xhtml",o)}function aT(){const o=Hc("canvas");return o.style.display="block",o}const Wv={};function Yv(...o){const e="THREE."+o.shift();console.log(e,...o)}function uS(o){const e=o[0];if(typeof e=="string"&&e.startsWith("TSL:")){const i=o[1];i&&i.isStackTrace?o[0]+=" "+i.getLocation():o[1]='Stack trace not available. Enable "THREE.Node.captureStackTrace" to capture stack traces.'}return o}function oe(...o){o=uS(o);const e="THREE."+o.shift();{const i=o[0];i&&i.isStackTrace?console.warn(i.getError(e)):console.warn(e,...o)}}function Fe(...o){o=uS(o);const e="THREE."+o.shift();{const i=o[0];i&&i.isStackTrace?console.error(i.getError(e)):console.error(e,...o)}}function co(...o){const e=o.join(" ");e in Wv||(Wv[e]=!0,oe(...o))}function sT(o,e,i){return new Promise(function(s,l){function f(){switch(o.clientWaitSync(e,o.SYNC_FLUSH_COMMANDS_BIT,0)){case o.WAIT_FAILED:l();break;case o.TIMEOUT_EXPIRED:setTimeout(f,i);break;default:s()}}setTimeout(f,i)})}const rT={[up]:cp,[fp]:pp,[hp]:mp,[Rl]:dp,[cp]:up,[pp]:fp,[mp]:hp,[dp]:Rl};class bs{addEventListener(e,i){this._listeners===void 0&&(this._listeners={});const s=this._listeners;s[e]===void 0&&(s[e]=[]),s[e].indexOf(i)===-1&&s[e].push(i)}hasEventListener(e,i){const s=this._listeners;return s===void 0?!1:s[e]!==void 0&&s[e].indexOf(i)!==-1}removeEventListener(e,i){const s=this._listeners;if(s===void 0)return;const l=s[e];if(l!==void 0){const f=l.indexOf(i);f!==-1&&l.splice(f,1)}}dispatchEvent(e){const i=this._listeners;if(i===void 0)return;const s=i[e.type];if(s!==void 0){e.target=this;const l=s.slice(0);for(let f=0,h=l.length;f<h;f++)l[f].call(this,e);e.target=null}}}const Fn=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"],Al=Math.PI/180,jp=180/Math.PI;function Ul(){const o=Math.random()*4294967295|0,e=Math.random()*4294967295|0,i=Math.random()*4294967295|0,s=Math.random()*4294967295|0;return(Fn[o&255]+Fn[o>>8&255]+Fn[o>>16&255]+Fn[o>>24&255]+"-"+Fn[e&255]+Fn[e>>8&255]+"-"+Fn[e>>16&15|64]+Fn[e>>24&255]+"-"+Fn[i&63|128]+Fn[i>>8&255]+"-"+Fn[i>>16&255]+Fn[i>>24&255]+Fn[s&255]+Fn[s>>8&255]+Fn[s>>16&255]+Fn[s>>24&255]).toLowerCase()}function Ce(o,e,i){return Math.max(e,Math.min(i,o))}function oT(o,e){return(o%e+e)%e}function Dd(o,e,i){return(1-i)*o+i*e}function pl(o,e){switch(e.constructor){case Float32Array:return o;case Uint32Array:return o/4294967295;case Uint16Array:return o/65535;case Uint8Array:case Uint8ClampedArray:return o/255;case Int32Array:return Math.max(o/2147483647,-1);case Int16Array:return Math.max(o/32767,-1);case Int8Array:return Math.max(o/127,-1);default:throw new Error("THREE.MathUtils: Invalid component type.")}}function ni(o,e){switch(e.constructor){case Float32Array:return o;case Uint32Array:return Math.round(o*4294967295);case Uint16Array:return Math.round(o*65535);case Uint8Array:case Uint8ClampedArray:return Math.round(o*255);case Int32Array:return Math.round(o*2147483647);case Int16Array:return Math.round(o*32767);case Int8Array:return Math.round(o*127);default:throw new Error("THREE.MathUtils: Invalid component type.")}}const lT={DEG2RAD:Al},Mm=class Mm{constructor(e=0,i=0){this.x=e,this.y=i}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,i){return this.x=e,this.y=i,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,i){switch(e){case 0:this.x=i;break;case 1:this.y=i;break;default:throw new Error("THREE.Vector2: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw new Error("THREE.Vector2: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,i){return this.x=e.x+i.x,this.y=e.y+i.y,this}addScaledVector(e,i){return this.x+=e.x*i,this.y+=e.y*i,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,i){return this.x=e.x-i.x,this.y=e.y-i.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){const i=this.x,s=this.y,l=e.elements;return this.x=l[0]*i+l[3]*s+l[6],this.y=l[1]*i+l[4]*s+l[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,i){return this.x=Ce(this.x,e.x,i.x),this.y=Ce(this.y,e.y,i.y),this}clampScalar(e,i){return this.x=Ce(this.x,e,i),this.y=Ce(this.y,e,i),this}clampLength(e,i){const s=this.length();return this.divideScalar(s||1).multiplyScalar(Ce(s,e,i))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(e){const i=Math.sqrt(this.lengthSq()*e.lengthSq());if(i===0)return Math.PI/2;const s=this.dot(e)/i;return Math.acos(Ce(s,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){const i=this.x-e.x,s=this.y-e.y;return i*i+s*s}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,i){return this.x+=(e.x-this.x)*i,this.y+=(e.y-this.y)*i,this}lerpVectors(e,i,s){return this.x=e.x+(i.x-e.x)*s,this.y=e.y+(i.y-e.y)*s,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,i=0){return this.x=e[i],this.y=e[i+1],this}toArray(e=[],i=0){return e[i]=this.x,e[i+1]=this.y,e}fromBufferAttribute(e,i){return this.x=e.getX(i),this.y=e.getY(i),this}rotateAround(e,i){const s=Math.cos(i),l=Math.sin(i),f=this.x-e.x,h=this.y-e.y;return this.x=f*s-h*l+e.x,this.y=f*l+h*s+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}};Mm.prototype.isVector2=!0;let le=Mm;class Es{constructor(e=0,i=0,s=0,l=1){this.isQuaternion=!0,this._x=e,this._y=i,this._z=s,this._w=l}static slerpFlat(e,i,s,l,f,h,d){let m=s[l+0],p=s[l+1],x=s[l+2],_=s[l+3],v=f[h+0],M=f[h+1],R=f[h+2],w=f[h+3];if(_!==w||m!==v||p!==M||x!==R){let y=m*v+p*M+x*R+_*w;y<0&&(v=-v,M=-M,R=-R,w=-w,y=-y);let S=1-d;if(y<.9995){const O=Math.acos(y),G=Math.sin(O);S=Math.sin(S*O)/G,d=Math.sin(d*O)/G,m=m*S+v*d,p=p*S+M*d,x=x*S+R*d,_=_*S+w*d}else{m=m*S+v*d,p=p*S+M*d,x=x*S+R*d,_=_*S+w*d;const O=1/Math.sqrt(m*m+p*p+x*x+_*_);m*=O,p*=O,x*=O,_*=O}}e[i]=m,e[i+1]=p,e[i+2]=x,e[i+3]=_}static multiplyQuaternionsFlat(e,i,s,l,f,h){const d=s[l],m=s[l+1],p=s[l+2],x=s[l+3],_=f[h],v=f[h+1],M=f[h+2],R=f[h+3];return e[i]=d*R+x*_+m*M-p*v,e[i+1]=m*R+x*v+p*_-d*M,e[i+2]=p*R+x*M+d*v-m*_,e[i+3]=x*R-d*_-m*v-p*M,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,i,s,l){return this._x=e,this._y=i,this._z=s,this._w=l,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,i=!0){const s=e._x,l=e._y,f=e._z,h=e._order,d=Math.cos,m=Math.sin,p=d(s/2),x=d(l/2),_=d(f/2),v=m(s/2),M=m(l/2),R=m(f/2);switch(h){case"XYZ":this._x=v*x*_+p*M*R,this._y=p*M*_-v*x*R,this._z=p*x*R+v*M*_,this._w=p*x*_-v*M*R;break;case"YXZ":this._x=v*x*_+p*M*R,this._y=p*M*_-v*x*R,this._z=p*x*R-v*M*_,this._w=p*x*_+v*M*R;break;case"ZXY":this._x=v*x*_-p*M*R,this._y=p*M*_+v*x*R,this._z=p*x*R+v*M*_,this._w=p*x*_-v*M*R;break;case"ZYX":this._x=v*x*_-p*M*R,this._y=p*M*_+v*x*R,this._z=p*x*R-v*M*_,this._w=p*x*_+v*M*R;break;case"YZX":this._x=v*x*_+p*M*R,this._y=p*M*_+v*x*R,this._z=p*x*R-v*M*_,this._w=p*x*_-v*M*R;break;case"XZY":this._x=v*x*_-p*M*R,this._y=p*M*_-v*x*R,this._z=p*x*R+v*M*_,this._w=p*x*_+v*M*R;break;default:oe("Quaternion: .setFromEuler() encountered an unknown order: "+h)}return i===!0&&this._onChangeCallback(),this}setFromAxisAngle(e,i){const s=i/2,l=Math.sin(s);return this._x=e.x*l,this._y=e.y*l,this._z=e.z*l,this._w=Math.cos(s),this._onChangeCallback(),this}setFromRotationMatrix(e){const i=e.elements,s=i[0],l=i[4],f=i[8],h=i[1],d=i[5],m=i[9],p=i[2],x=i[6],_=i[10],v=s+d+_;if(v>0){const M=.5/Math.sqrt(v+1);this._w=.25/M,this._x=(x-m)*M,this._y=(f-p)*M,this._z=(h-l)*M}else if(s>d&&s>_){const M=2*Math.sqrt(1+s-d-_);this._w=(x-m)/M,this._x=.25*M,this._y=(l+h)/M,this._z=(f+p)/M}else if(d>_){const M=2*Math.sqrt(1+d-s-_);this._w=(f-p)/M,this._x=(l+h)/M,this._y=.25*M,this._z=(m+x)/M}else{const M=2*Math.sqrt(1+_-s-d);this._w=(h-l)/M,this._x=(f+p)/M,this._y=(m+x)/M,this._z=.25*M}return this._onChangeCallback(),this}setFromUnitVectors(e,i){let s=e.dot(i)+1;return s<1e-8?(s=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=s):(this._x=0,this._y=-e.z,this._z=e.y,this._w=s)):(this._x=e.y*i.z-e.z*i.y,this._y=e.z*i.x-e.x*i.z,this._z=e.x*i.y-e.y*i.x,this._w=s),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(Ce(this.dot(e),-1,1)))}rotateTowards(e,i){const s=this.angleTo(e);if(s===0)return this;const l=Math.min(1,i/s);return this.slerp(e,l),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x=this._x*e,this._y=this._y*e,this._z=this._z*e,this._w=this._w*e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,i){const s=e._x,l=e._y,f=e._z,h=e._w,d=i._x,m=i._y,p=i._z,x=i._w;return this._x=s*x+h*d+l*p-f*m,this._y=l*x+h*m+f*d-s*p,this._z=f*x+h*p+s*m-l*d,this._w=h*x-s*d-l*m-f*p,this._onChangeCallback(),this}slerp(e,i){let s=e._x,l=e._y,f=e._z,h=e._w,d=this.dot(e);d<0&&(s=-s,l=-l,f=-f,h=-h,d=-d);let m=1-i;if(d<.9995){const p=Math.acos(d),x=Math.sin(p);m=Math.sin(m*p)/x,i=Math.sin(i*p)/x,this._x=this._x*m+s*i,this._y=this._y*m+l*i,this._z=this._z*m+f*i,this._w=this._w*m+h*i,this._onChangeCallback()}else this._x=this._x*m+s*i,this._y=this._y*m+l*i,this._z=this._z*m+f*i,this._w=this._w*m+h*i,this.normalize();return this}slerpQuaternions(e,i,s){return this.copy(e).slerp(i,s)}random(){const e=2*Math.PI*Math.random(),i=2*Math.PI*Math.random(),s=Math.random(),l=Math.sqrt(1-s),f=Math.sqrt(s);return this.set(l*Math.sin(e),l*Math.cos(e),f*Math.sin(i),f*Math.cos(i))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,i=0){return this._x=e[i],this._y=e[i+1],this._z=e[i+2],this._w=e[i+3],this._onChangeCallback(),this}toArray(e=[],i=0){return e[i]=this._x,e[i+1]=this._y,e[i+2]=this._z,e[i+3]=this._w,e}fromBufferAttribute(e,i){return this._x=e.getX(i),this._y=e.getY(i),this._z=e.getZ(i),this._w=e.getW(i),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}}const Em=class Em{constructor(e=0,i=0,s=0){this.x=e,this.y=i,this.z=s}set(e,i,s){return s===void 0&&(s=this.z),this.x=e,this.y=i,this.z=s,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,i){switch(e){case 0:this.x=i;break;case 1:this.y=i;break;case 2:this.z=i;break;default:throw new Error("THREE.Vector3: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("THREE.Vector3: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,i){return this.x=e.x+i.x,this.y=e.y+i.y,this.z=e.z+i.z,this}addScaledVector(e,i){return this.x+=e.x*i,this.y+=e.y*i,this.z+=e.z*i,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,i){return this.x=e.x-i.x,this.y=e.y-i.y,this.z=e.z-i.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,i){return this.x=e.x*i.x,this.y=e.y*i.y,this.z=e.z*i.z,this}applyEuler(e){return this.applyQuaternion(qv.setFromEuler(e))}applyAxisAngle(e,i){return this.applyQuaternion(qv.setFromAxisAngle(e,i))}applyMatrix3(e){const i=this.x,s=this.y,l=this.z,f=e.elements;return this.x=f[0]*i+f[3]*s+f[6]*l,this.y=f[1]*i+f[4]*s+f[7]*l,this.z=f[2]*i+f[5]*s+f[8]*l,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){const i=this.x,s=this.y,l=this.z,f=e.elements,h=1/(f[3]*i+f[7]*s+f[11]*l+f[15]);return this.x=(f[0]*i+f[4]*s+f[8]*l+f[12])*h,this.y=(f[1]*i+f[5]*s+f[9]*l+f[13])*h,this.z=(f[2]*i+f[6]*s+f[10]*l+f[14])*h,this}applyQuaternion(e){const i=this.x,s=this.y,l=this.z,f=e.x,h=e.y,d=e.z,m=e.w,p=2*(h*l-d*s),x=2*(d*i-f*l),_=2*(f*s-h*i);return this.x=i+m*p+h*_-d*x,this.y=s+m*x+d*p-f*_,this.z=l+m*_+f*x-h*p,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){const i=this.x,s=this.y,l=this.z,f=e.elements;return this.x=f[0]*i+f[4]*s+f[8]*l,this.y=f[1]*i+f[5]*s+f[9]*l,this.z=f[2]*i+f[6]*s+f[10]*l,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,i){return this.x=Ce(this.x,e.x,i.x),this.y=Ce(this.y,e.y,i.y),this.z=Ce(this.z,e.z,i.z),this}clampScalar(e,i){return this.x=Ce(this.x,e,i),this.y=Ce(this.y,e,i),this.z=Ce(this.z,e,i),this}clampLength(e,i){const s=this.length();return this.divideScalar(s||1).multiplyScalar(Ce(s,e,i))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,i){return this.x+=(e.x-this.x)*i,this.y+=(e.y-this.y)*i,this.z+=(e.z-this.z)*i,this}lerpVectors(e,i,s){return this.x=e.x+(i.x-e.x)*s,this.y=e.y+(i.y-e.y)*s,this.z=e.z+(i.z-e.z)*s,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,i){const s=e.x,l=e.y,f=e.z,h=i.x,d=i.y,m=i.z;return this.x=l*m-f*d,this.y=f*h-s*m,this.z=s*d-l*h,this}projectOnVector(e){const i=e.lengthSq();if(i===0)return this.set(0,0,0);const s=e.dot(this)/i;return this.copy(e).multiplyScalar(s)}projectOnPlane(e){return Nd.copy(this).projectOnVector(e),this.sub(Nd)}reflect(e){return this.sub(Nd.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){const i=Math.sqrt(this.lengthSq()*e.lengthSq());if(i===0)return Math.PI/2;const s=this.dot(e)/i;return Math.acos(Ce(s,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){const i=this.x-e.x,s=this.y-e.y,l=this.z-e.z;return i*i+s*s+l*l}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,i,s){const l=Math.sin(i)*e;return this.x=l*Math.sin(s),this.y=Math.cos(i)*e,this.z=l*Math.cos(s),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,i,s){return this.x=e*Math.sin(i),this.y=s,this.z=e*Math.cos(i),this}setFromMatrixPosition(e){const i=e.elements;return this.x=i[12],this.y=i[13],this.z=i[14],this}setFromMatrixScale(e){const i=this.setFromMatrixColumn(e,0).length(),s=this.setFromMatrixColumn(e,1).length(),l=this.setFromMatrixColumn(e,2).length();return this.x=i,this.y=s,this.z=l,this}setFromMatrixColumn(e,i){return this.fromArray(e.elements,i*4)}setFromMatrix3Column(e,i){return this.fromArray(e.elements,i*3)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}setFromColor(e){return this.x=e.r,this.y=e.g,this.z=e.b,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,i=0){return this.x=e[i],this.y=e[i+1],this.z=e[i+2],this}toArray(e=[],i=0){return e[i]=this.x,e[i+1]=this.y,e[i+2]=this.z,e}fromBufferAttribute(e,i){return this.x=e.getX(i),this.y=e.getY(i),this.z=e.getZ(i),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){const e=Math.random()*Math.PI*2,i=Math.random()*2-1,s=Math.sqrt(1-i*i);return this.x=s*Math.cos(e),this.y=i,this.z=s*Math.sin(e),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}};Em.prototype.isVector3=!0;let nt=Em;const Nd=new nt,qv=new Es,Tm=class Tm{constructor(e,i,s,l,f,h,d,m,p){this.elements=[1,0,0,0,1,0,0,0,1],e!==void 0&&this.set(e,i,s,l,f,h,d,m,p)}set(e,i,s,l,f,h,d,m,p){const x=this.elements;return x[0]=e,x[1]=l,x[2]=d,x[3]=i,x[4]=f,x[5]=m,x[6]=s,x[7]=h,x[8]=p,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){const i=this.elements,s=e.elements;return i[0]=s[0],i[1]=s[1],i[2]=s[2],i[3]=s[3],i[4]=s[4],i[5]=s[5],i[6]=s[6],i[7]=s[7],i[8]=s[8],this}extractBasis(e,i,s){return e.setFromMatrix3Column(this,0),i.setFromMatrix3Column(this,1),s.setFromMatrix3Column(this,2),this}setFromMatrix4(e){const i=e.elements;return this.set(i[0],i[4],i[8],i[1],i[5],i[9],i[2],i[6],i[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,i){const s=e.elements,l=i.elements,f=this.elements,h=s[0],d=s[3],m=s[6],p=s[1],x=s[4],_=s[7],v=s[2],M=s[5],R=s[8],w=l[0],y=l[3],S=l[6],O=l[1],G=l[4],C=l[7],D=l[2],N=l[5],P=l[8];return f[0]=h*w+d*O+m*D,f[3]=h*y+d*G+m*N,f[6]=h*S+d*C+m*P,f[1]=p*w+x*O+_*D,f[4]=p*y+x*G+_*N,f[7]=p*S+x*C+_*P,f[2]=v*w+M*O+R*D,f[5]=v*y+M*G+R*N,f[8]=v*S+M*C+R*P,this}multiplyScalar(e){const i=this.elements;return i[0]*=e,i[3]*=e,i[6]*=e,i[1]*=e,i[4]*=e,i[7]*=e,i[2]*=e,i[5]*=e,i[8]*=e,this}determinant(){const e=this.elements,i=e[0],s=e[1],l=e[2],f=e[3],h=e[4],d=e[5],m=e[6],p=e[7],x=e[8];return i*h*x-i*d*p-s*f*x+s*d*m+l*f*p-l*h*m}invert(){const e=this.elements,i=e[0],s=e[1],l=e[2],f=e[3],h=e[4],d=e[5],m=e[6],p=e[7],x=e[8],_=x*h-d*p,v=d*m-x*f,M=p*f-h*m,R=i*_+s*v+l*M;if(R===0)return this.set(0,0,0,0,0,0,0,0,0);const w=1/R;return e[0]=_*w,e[1]=(l*p-x*s)*w,e[2]=(d*s-l*h)*w,e[3]=v*w,e[4]=(x*i-l*m)*w,e[5]=(l*f-d*i)*w,e[6]=M*w,e[7]=(s*m-p*i)*w,e[8]=(h*i-s*f)*w,this}transpose(){let e;const i=this.elements;return e=i[1],i[1]=i[3],i[3]=e,e=i[2],i[2]=i[6],i[6]=e,e=i[5],i[5]=i[7],i[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){const i=this.elements;return e[0]=i[0],e[1]=i[3],e[2]=i[6],e[3]=i[1],e[4]=i[4],e[5]=i[7],e[6]=i[2],e[7]=i[5],e[8]=i[8],this}setUvTransform(e,i,s,l,f,h,d){const m=Math.cos(f),p=Math.sin(f);return this.set(s*m,s*p,-s*(m*h+p*d)+h+e,-l*p,l*m,-l*(-p*h+m*d)+d+i,0,0,1),this}scale(e,i){return co("Matrix3: .scale() is deprecated. Use .makeScale() instead."),this.premultiply(Ud.makeScale(e,i)),this}rotate(e){return co("Matrix3: .rotate() is deprecated. Use .makeRotation() instead."),this.premultiply(Ud.makeRotation(-e)),this}translate(e,i){return co("Matrix3: .translate() is deprecated. Use .makeTranslation() instead."),this.premultiply(Ud.makeTranslation(e,i)),this}makeTranslation(e,i){return e.isVector2?this.set(1,0,e.x,0,1,e.y,0,0,1):this.set(1,0,e,0,1,i,0,0,1),this}makeRotation(e){const i=Math.cos(e),s=Math.sin(e);return this.set(i,-s,0,s,i,0,0,0,1),this}makeScale(e,i){return this.set(e,0,0,0,i,0,0,0,1),this}equals(e){const i=this.elements,s=e.elements;for(let l=0;l<9;l++)if(i[l]!==s[l])return!1;return!0}fromArray(e,i=0){for(let s=0;s<9;s++)this.elements[s]=e[s+i];return this}toArray(e=[],i=0){const s=this.elements;return e[i]=s[0],e[i+1]=s[1],e[i+2]=s[2],e[i+3]=s[3],e[i+4]=s[4],e[i+5]=s[5],e[i+6]=s[6],e[i+7]=s[7],e[i+8]=s[8],e}clone(){return new this.constructor().fromArray(this.elements)}};Tm.prototype.isMatrix3=!0;let de=Tm;const Ud=new de,Zv=new de().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),jv=new de().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function uT(){const o={enabled:!0,workingColorSpace:Bc,spaces:{},convert:function(l,f,h){return this.enabled===!1||f===h||!f||!h||(this.spaces[f].transfer===qe&&(l.r=Ha(l.r),l.g=Ha(l.g),l.b=Ha(l.b)),this.spaces[f].primaries!==this.spaces[h].primaries&&(l.applyMatrix3(this.spaces[f].toXYZ),l.applyMatrix3(this.spaces[h].fromXYZ)),this.spaces[h].transfer===qe&&(l.r=fo(l.r),l.g=fo(l.g),l.b=fo(l.b))),l},workingToColorSpace:function(l,f){return this.convert(l,this.workingColorSpace,f)},colorSpaceToWorking:function(l,f){return this.convert(l,f,this.workingColorSpace)},getPrimaries:function(l){return this.spaces[l].primaries},getTransfer:function(l){return l===Ms?Fc:this.spaces[l].transfer},getToneMappingMode:function(l){return this.spaces[l].outputColorSpaceConfig.toneMappingMode||"standard"},getLuminanceCoefficients:function(l,f=this.workingColorSpace){return l.fromArray(this.spaces[f].luminanceCoefficients)},define:function(l){Object.assign(this.spaces,l)},_getMatrix:function(l,f,h){return l.copy(this.spaces[f].toXYZ).multiply(this.spaces[h].fromXYZ)},_getDrawingBufferColorSpace:function(l){return this.spaces[l].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(l=this.workingColorSpace){return this.spaces[l].workingColorSpaceConfig.unpackColorSpace},fromWorkingColorSpace:function(l,f){return co("ColorManagement: .fromWorkingColorSpace() has been renamed to .workingToColorSpace()."),o.workingToColorSpace(l,f)},toWorkingColorSpace:function(l,f){return co("ColorManagement: .toWorkingColorSpace() has been renamed to .colorSpaceToWorking()."),o.colorSpaceToWorking(l,f)}},e=[.64,.33,.3,.6,.15,.06],i=[.2126,.7152,.0722],s=[.3127,.329];return o.define({[Bc]:{primaries:e,whitePoint:s,transfer:Fc,toXYZ:Zv,fromXYZ:jv,luminanceCoefficients:i,workingColorSpaceConfig:{unpackColorSpace:Ui},outputColorSpaceConfig:{drawingBufferColorSpace:Ui}},[Ui]:{primaries:e,whitePoint:s,transfer:qe,toXYZ:Zv,fromXYZ:jv,luminanceCoefficients:i,outputColorSpaceConfig:{drawingBufferColorSpace:Ui}}}),o}const Oe=uT();function Ha(o){return o<.04045?o*.0773993808:Math.pow(o*.9478672986+.0521327014,2.4)}function fo(o){return o<.0031308?o*12.92:1.055*Math.pow(o,.41666)-.055}let qr;class cT{static getDataURL(e,i="image/png"){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>"u")return e.src;let s;if(e instanceof HTMLCanvasElement)s=e;else{qr===void 0&&(qr=Hc("canvas")),qr.width=e.width,qr.height=e.height;const l=qr.getContext("2d");e instanceof ImageData?l.putImageData(e,0,0):l.drawImage(e,0,0,e.width,e.height),s=qr}return s.toDataURL(i)}static sRGBToLinear(e){if(typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&e instanceof ImageBitmap){const i=Hc("canvas");i.width=e.width,i.height=e.height;const s=i.getContext("2d");s.drawImage(e,0,0,e.width,e.height);const l=s.getImageData(0,0,e.width,e.height),f=l.data;for(let h=0;h<f.length;h++)f[h]=Ha(f[h]/255)*255;return s.putImageData(l,0,0),i}else if(e.data){const i=e.data.slice(0);for(let s=0;s<i.length;s++)i instanceof Uint8Array||i instanceof Uint8ClampedArray?i[s]=Math.floor(Ha(i[s]/255)*255):i[s]=Ha(i[s]);return{data:i,width:e.width,height:e.height}}else return oe("ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),e}}let fT=0;class um{constructor(e=null){this.isTextureSource=!0,Object.defineProperty(this,"id",{value:fT++}),this.uuid=Ul(),this.data=e,this.dataReady=!0,this.version=0}getSize(e){const i=this.data;return typeof HTMLVideoElement<"u"&&i instanceof HTMLVideoElement?e.set(i.videoWidth,i.videoHeight,0):typeof VideoFrame<"u"&&i instanceof VideoFrame?e.set(i.displayWidth,i.displayHeight,0):i!==null?e.set(i.width,i.height,i.depth||0):e.set(0,0,0),e}set needsUpdate(e){e===!0&&this.version++}toJSON(e){const i=e===void 0||typeof e=="string";if(!i&&e.images[this.uuid]!==void 0)return e.images[this.uuid];const s={uuid:this.uuid,url:""},l=this.data;if(l!==null){let f;if(Array.isArray(l)){f=[];for(let h=0,d=l.length;h<d;h++)l[h].isDataTexture?f.push(Ld(l[h].image)):f.push(Ld(l[h]))}else f=Ld(l);s.url=f}return i||(e.images[this.uuid]=s),s}}function Ld(o){return typeof HTMLImageElement<"u"&&o instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&o instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&o instanceof ImageBitmap?cT.getDataURL(o):o.data?{data:Array.from(o.data),width:o.width,height:o.height,type:o.data.constructor.name}:(oe("Texture: Unable to serialize Texture."),{})}let hT=0;const Od=new nt;class jn extends bs{constructor(e=jn.DEFAULT_IMAGE,i=jn.DEFAULT_MAPPING,s=Ba,l=Ba,f=Gn,h=tr,d=ki,m=xi,p=jn.DEFAULT_ANISOTROPY,x=Ms){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:hT++}),this.uuid=Ul(),this.name="",this.source=new um(e),this.mipmaps=[],this.mapping=i,this.channel=0,this.wrapS=s,this.wrapT=l,this.magFilter=f,this.minFilter=h,this.anisotropy=p,this.format=d,this.internalFormat=null,this.type=m,this.offset=new le(0,0),this.repeat=new le(1,1),this.center=new le(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new de,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=x,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.isArrayTexture=!!(e&&e.depth&&e.depth>1),this.pmremVersion=0,this.normalized=!1}get width(){return this.source.getSize(Od).x}get height(){return this.source.getSize(Od).y}get depth(){return this.source.getSize(Od).z}get image(){return this.source.data}set image(e){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}addUpdateRange(e,i){this.updateRanges.push({start:e,count:i})}clearUpdateRanges(){this.updateRanges.length=0}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.channel=e.channel,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.normalized=e.normalized,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.colorSpace=e.colorSpace,this.renderTarget=e.renderTarget,this.isRenderTargetTexture=e.isRenderTargetTexture,this.isArrayTexture=e.isArrayTexture,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}setValues(e){for(const i in e){const s=e[i];if(s===void 0){oe(`Texture.setValues(): parameter '${i}' has value of undefined.`);continue}const l=this[i];if(l===void 0){oe(`Texture.setValues(): property '${i}' does not exist.`);continue}l&&s&&l.isVector2&&s.isVector2||l&&s&&l.isVector3&&s.isVector3||l&&s&&l.isMatrix3&&s.isMatrix3?l.copy(s):this[i]=s}}toJSON(e){const i=e===void 0||typeof e=="string";if(!i&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];const s={metadata:{version:4.7,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,normalized:this.normalized,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(s.userData=this.userData),i||(e.textures[this.uuid]=s),s}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(e){if(this.mapping!==eS)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case gp:e.x=e.x-Math.floor(e.x);break;case Ba:e.x=e.x<0?0:1;break;case _p:Math.abs(Math.floor(e.x)%2)===1?e.x=Math.ceil(e.x)-e.x:e.x=e.x-Math.floor(e.x);break}if(e.y<0||e.y>1)switch(this.wrapT){case gp:e.y=e.y-Math.floor(e.y);break;case Ba:e.y=e.y<0?0:1;break;case _p:Math.abs(Math.floor(e.y)%2)===1?e.y=Math.ceil(e.y)-e.y:e.y=e.y-Math.floor(e.y);break}return this.flipY&&(e.y=1-e.y),e}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(e){e===!0&&this.pmremVersion++}}jn.DEFAULT_IMAGE=null;jn.DEFAULT_MAPPING=eS;jn.DEFAULT_ANISOTROPY=1;const bm=class bm{constructor(e=0,i=0,s=0,l=1){this.x=e,this.y=i,this.z=s,this.w=l}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,i,s,l){return this.x=e,this.y=i,this.z=s,this.w=l,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,i){switch(e){case 0:this.x=i;break;case 1:this.y=i;break;case 2:this.z=i;break;case 3:this.w=i;break;default:throw new Error("THREE.Vector4: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("THREE.Vector4: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w!==void 0?e.w:1,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,i){return this.x=e.x+i.x,this.y=e.y+i.y,this.z=e.z+i.z,this.w=e.w+i.w,this}addScaledVector(e,i){return this.x+=e.x*i,this.y+=e.y*i,this.z+=e.z*i,this.w+=e.w*i,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,i){return this.x=e.x-i.x,this.y=e.y-i.y,this.z=e.z-i.z,this.w=e.w-i.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){const i=this.x,s=this.y,l=this.z,f=this.w,h=e.elements;return this.x=h[0]*i+h[4]*s+h[8]*l+h[12]*f,this.y=h[1]*i+h[5]*s+h[9]*l+h[13]*f,this.z=h[2]*i+h[6]*s+h[10]*l+h[14]*f,this.w=h[3]*i+h[7]*s+h[11]*l+h[15]*f,this}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this.w/=e.w,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);const i=Math.sqrt(1-e.w*e.w);return i<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/i,this.y=e.y/i,this.z=e.z/i),this}setAxisAngleFromRotationMatrix(e){let i,s,l,f;const m=e.elements,p=m[0],x=m[4],_=m[8],v=m[1],M=m[5],R=m[9],w=m[2],y=m[6],S=m[10];if(Math.abs(x-v)<.01&&Math.abs(_-w)<.01&&Math.abs(R-y)<.01){if(Math.abs(x+v)<.1&&Math.abs(_+w)<.1&&Math.abs(R+y)<.1&&Math.abs(p+M+S-3)<.1)return this.set(1,0,0,0),this;i=Math.PI;const G=(p+1)/2,C=(M+1)/2,D=(S+1)/2,N=(x+v)/4,P=(_+w)/4,T=(R+y)/4;return G>C&&G>D?G<.01?(s=0,l=.707106781,f=.707106781):(s=Math.sqrt(G),l=N/s,f=P/s):C>D?C<.01?(s=.707106781,l=0,f=.707106781):(l=Math.sqrt(C),s=N/l,f=T/l):D<.01?(s=.707106781,l=.707106781,f=0):(f=Math.sqrt(D),s=P/f,l=T/f),this.set(s,l,f,i),this}let O=Math.sqrt((y-R)*(y-R)+(_-w)*(_-w)+(v-x)*(v-x));return Math.abs(O)<.001&&(O=1),this.x=(y-R)/O,this.y=(_-w)/O,this.z=(v-x)/O,this.w=Math.acos((p+M+S-1)/2),this}setFromMatrixPosition(e){const i=e.elements;return this.x=i[12],this.y=i[13],this.z=i[14],this.w=i[15],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,i){return this.x=Ce(this.x,e.x,i.x),this.y=Ce(this.y,e.y,i.y),this.z=Ce(this.z,e.z,i.z),this.w=Ce(this.w,e.w,i.w),this}clampScalar(e,i){return this.x=Ce(this.x,e,i),this.y=Ce(this.y,e,i),this.z=Ce(this.z,e,i),this.w=Ce(this.w,e,i),this}clampLength(e,i){const s=this.length();return this.divideScalar(s||1).multiplyScalar(Ce(s,e,i))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,i){return this.x+=(e.x-this.x)*i,this.y+=(e.y-this.y)*i,this.z+=(e.z-this.z)*i,this.w+=(e.w-this.w)*i,this}lerpVectors(e,i,s){return this.x=e.x+(i.x-e.x)*s,this.y=e.y+(i.y-e.y)*s,this.z=e.z+(i.z-e.z)*s,this.w=e.w+(i.w-e.w)*s,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,i=0){return this.x=e[i],this.y=e[i+1],this.z=e[i+2],this.w=e[i+3],this}toArray(e=[],i=0){return e[i]=this.x,e[i+1]=this.y,e[i+2]=this.z,e[i+3]=this.w,e}fromBufferAttribute(e,i){return this.x=e.getX(i),this.y=e.getY(i),this.z=e.getZ(i),this.w=e.getW(i),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}};bm.prototype.isVector4=!0;let on=bm;class dT extends bs{constructor(e=1,i=1,s={}){super(),s=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:Gn,depthBuffer:!0,stencilBuffer:!1,resolveColorBuffer:!0,resolveDepthBuffer:!0,resolveStencilBuffer:!0,storeMultisampledColorBuffer:!0,storeMultisampledDepthBuffer:!0,storeMultisampledStencilBuffer:!0,depthTexture:null,samples:0,count:1,depth:1,multiview:!1,useArrayDepthTexture:!1},s),this.isRenderTarget=!0,this.width=e,this.height=i,this.depth=s.depth,this.scissor=new on(0,0,e,i),this.scissorTest=!1,this.viewport=new on(0,0,e,i),this.textures=[];const l={width:e,height:i,depth:s.depth},f=new jn(l),h=s.count;for(let d=0;d<h;d++)this.textures[d]=f.clone(),this.textures[d].isRenderTargetTexture=!0,this.textures[d].renderTarget=this;this._setTextureOptions(s),this.depthBuffer=s.depthBuffer,this.stencilBuffer=s.stencilBuffer,this.resolveColorBuffer=s.resolveColorBuffer,this.resolveDepthBuffer=s.resolveDepthBuffer,this.resolveStencilBuffer=s.resolveStencilBuffer,this.storeMultisampledColorBuffer=s.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=s.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=s.storeMultisampledStencilBuffer,this._depthTexture=null,this.depthTexture=s.depthTexture,this.samples=s.samples,this.multiview=s.multiview,this.useArrayDepthTexture=s.useArrayDepthTexture}_setTextureOptions(e={}){const i={minFilter:Gn,generateMipmaps:!1,flipY:!1,internalFormat:null};e.mapping!==void 0&&(i.mapping=e.mapping),e.wrapS!==void 0&&(i.wrapS=e.wrapS),e.wrapT!==void 0&&(i.wrapT=e.wrapT),e.wrapR!==void 0&&(i.wrapR=e.wrapR),e.magFilter!==void 0&&(i.magFilter=e.magFilter),e.minFilter!==void 0&&(i.minFilter=e.minFilter),e.format!==void 0&&(i.format=e.format),e.type!==void 0&&(i.type=e.type),e.anisotropy!==void 0&&(i.anisotropy=e.anisotropy),e.colorSpace!==void 0&&(i.colorSpace=e.colorSpace),e.flipY!==void 0&&(i.flipY=e.flipY),e.generateMipmaps!==void 0&&(i.generateMipmaps=e.generateMipmaps),e.internalFormat!==void 0&&(i.internalFormat=e.internalFormat);for(let s=0;s<this.textures.length;s++)this.textures[s].setValues(i)}get texture(){return this.textures[0]}set texture(e){this.textures[0]=e}set depthTexture(e){this._depthTexture!==null&&this._depthTexture.renderTarget===this&&(this._depthTexture.renderTarget=null),e!==null&&e.renderTarget===null&&(e.renderTarget=this),this._depthTexture=e}get depthTexture(){return this._depthTexture}setSize(e,i,s=1){if(this.width!==e||this.height!==i||this.depth!==s){this.width=e,this.height=i,this.depth=s;for(let l=0,f=this.textures.length;l<f;l++)this.textures[l].image.width=e,this.textures[l].image.height=i,this.textures[l].image.depth=s,this.textures[l].isData3DTexture!==!0&&(this.textures[l].isArrayTexture=this.textures[l].image.depth>1);this.dispose()}this.viewport.set(0,0,e,i),this.scissor.set(0,0,e,i)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.scissor.copy(e.scissor),this.scissorTest=e.scissorTest,this.viewport.copy(e.viewport),this.textures.length=0;for(let i=0,s=e.textures.length;i<s;i++){this.textures[i]=e.textures[i].clone(),this.textures[i].isRenderTargetTexture=!0,this.textures[i].renderTarget=this;const l=Object.assign({},e.textures[i].image);this.textures[i].source=new um(l)}if(this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,this.resolveColorBuffer=e.resolveColorBuffer,this.resolveDepthBuffer=e.resolveDepthBuffer,this.resolveStencilBuffer=e.resolveStencilBuffer,this.storeMultisampledColorBuffer=e.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=e.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=e.storeMultisampledStencilBuffer,e.depthTexture!==null)if(e.depthTexture.renderTarget===e){const i=e.depthTexture.clone();i.renderTarget=null,this.depthTexture=i}else this.depthTexture=e.depthTexture;return this.samples=e.samples,this.multiview=e.multiview,this.useArrayDepthTexture=e.useArrayDepthTexture,this}dispose(){this.dispatchEvent({type:"dispose"})}}class Wi extends dT{constructor(e=1,i=1,s={}){super(e,i,s),this.isWebGLRenderTarget=!0}}class cS extends jn{constructor(e=null,i=1,s=1,l=1){super(null),this.isDataArrayTexture=!0,this.image={data:e,width:i,height:s,depth:l},this.magFilter=zn,this.minFilter=zn,this.wrapR=Ba,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}copy(e){return super.copy(e),this.wrapR=e.wrapR,this}addLayerUpdate(e){this.layerUpdates.add(e)}clearLayerUpdates(){this.layerUpdates.clear()}}class pT extends jn{constructor(e=null,i=1,s=1,l=1){super(null),this.isData3DTexture=!0,this.image={data:e,width:i,height:s,depth:l},this.magFilter=zn,this.minFilter=zn,this.wrapR=Ba,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}copy(e){return super.copy(e),this.wrapR=e.wrapR,this}}const Xc=class Xc{constructor(e,i,s,l,f,h,d,m,p,x,_,v,M,R,w,y){this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],e!==void 0&&this.set(e,i,s,l,f,h,d,m,p,x,_,v,M,R,w,y)}set(e,i,s,l,f,h,d,m,p,x,_,v,M,R,w,y){const S=this.elements;return S[0]=e,S[4]=i,S[8]=s,S[12]=l,S[1]=f,S[5]=h,S[9]=d,S[13]=m,S[2]=p,S[6]=x,S[10]=_,S[14]=v,S[3]=M,S[7]=R,S[11]=w,S[15]=y,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new Xc().fromArray(this.elements)}copy(e){const i=this.elements,s=e.elements;return i[0]=s[0],i[1]=s[1],i[2]=s[2],i[3]=s[3],i[4]=s[4],i[5]=s[5],i[6]=s[6],i[7]=s[7],i[8]=s[8],i[9]=s[9],i[10]=s[10],i[11]=s[11],i[12]=s[12],i[13]=s[13],i[14]=s[14],i[15]=s[15],this}copyPosition(e){const i=this.elements,s=e.elements;return i[12]=s[12],i[13]=s[13],i[14]=s[14],this}setFromMatrix3(e){const i=e.elements;return this.set(i[0],i[3],i[6],0,i[1],i[4],i[7],0,i[2],i[5],i[8],0,0,0,0,1),this}extractBasis(e,i,s){return this.determinantAffine()===0?(e.set(1,0,0),i.set(0,1,0),s.set(0,0,1),this):(e.setFromMatrixColumn(this,0),i.setFromMatrixColumn(this,1),s.setFromMatrixColumn(this,2),this)}makeBasis(e,i,s){return this.set(e.x,i.x,s.x,0,e.y,i.y,s.y,0,e.z,i.z,s.z,0,0,0,0,1),this}extractRotation(e){if(e.determinantAffine()===0)return this.identity();const i=this.elements,s=e.elements,l=1/Zr.setFromMatrixColumn(e,0).length(),f=1/Zr.setFromMatrixColumn(e,1).length(),h=1/Zr.setFromMatrixColumn(e,2).length();return i[0]=s[0]*l,i[1]=s[1]*l,i[2]=s[2]*l,i[3]=0,i[4]=s[4]*f,i[5]=s[5]*f,i[6]=s[6]*f,i[7]=0,i[8]=s[8]*h,i[9]=s[9]*h,i[10]=s[10]*h,i[11]=0,i[12]=0,i[13]=0,i[14]=0,i[15]=1,this}makeRotationFromEuler(e){const i=this.elements,s=e.x,l=e.y,f=e.z,h=Math.cos(s),d=Math.sin(s),m=Math.cos(l),p=Math.sin(l),x=Math.cos(f),_=Math.sin(f);if(e.order==="XYZ"){const v=h*x,M=h*_,R=d*x,w=d*_;i[0]=m*x,i[4]=-m*_,i[8]=p,i[1]=M+R*p,i[5]=v-w*p,i[9]=-d*m,i[2]=w-v*p,i[6]=R+M*p,i[10]=h*m}else if(e.order==="YXZ"){const v=m*x,M=m*_,R=p*x,w=p*_;i[0]=v+w*d,i[4]=R*d-M,i[8]=h*p,i[1]=h*_,i[5]=h*x,i[9]=-d,i[2]=M*d-R,i[6]=w+v*d,i[10]=h*m}else if(e.order==="ZXY"){const v=m*x,M=m*_,R=p*x,w=p*_;i[0]=v-w*d,i[4]=-h*_,i[8]=R+M*d,i[1]=M+R*d,i[5]=h*x,i[9]=w-v*d,i[2]=-h*p,i[6]=d,i[10]=h*m}else if(e.order==="ZYX"){const v=h*x,M=h*_,R=d*x,w=d*_;i[0]=m*x,i[4]=R*p-M,i[8]=v*p+w,i[1]=m*_,i[5]=w*p+v,i[9]=M*p-R,i[2]=-p,i[6]=d*m,i[10]=h*m}else if(e.order==="YZX"){const v=h*m,M=h*p,R=d*m,w=d*p;i[0]=m*x,i[4]=w-v*_,i[8]=R*_+M,i[1]=_,i[5]=h*x,i[9]=-d*x,i[2]=-p*x,i[6]=M*_+R,i[10]=v-w*_}else if(e.order==="XZY"){const v=h*m,M=h*p,R=d*m,w=d*p;i[0]=m*x,i[4]=-_,i[8]=p*x,i[1]=v*_+w,i[5]=h*x,i[9]=M*_-R,i[2]=R*_-M,i[6]=d*x,i[10]=w*_+v}return i[3]=0,i[7]=0,i[11]=0,i[12]=0,i[13]=0,i[14]=0,i[15]=1,this}makeRotationFromQuaternion(e){return this.compose(mT,e,gT)}lookAt(e,i,s){const l=this.elements;return mi.subVectors(e,i),mi.lengthSq()===0&&(mi.z=1),mi.normalize(),_s.crossVectors(s,mi),_s.lengthSq()===0&&(Math.abs(s.z)===1?mi.x+=1e-4:mi.z+=1e-4,mi.normalize(),_s.crossVectors(s,mi)),_s.normalize(),ic.crossVectors(mi,_s),l[0]=_s.x,l[4]=ic.x,l[8]=mi.x,l[1]=_s.y,l[5]=ic.y,l[9]=mi.y,l[2]=_s.z,l[6]=ic.z,l[10]=mi.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,i){const s=e.elements,l=i.elements,f=this.elements,h=s[0],d=s[4],m=s[8],p=s[12],x=s[1],_=s[5],v=s[9],M=s[13],R=s[2],w=s[6],y=s[10],S=s[14],O=s[3],G=s[7],C=s[11],D=s[15],N=l[0],P=l[4],T=l[8],U=l[12],F=l[1],V=l[5],Q=l[9],st=l[13],Y=l[2],tt=l[6],W=l[10],q=l[14],dt=l[3],ct=l[7],rt=l[11],bt=l[15];return f[0]=h*N+d*F+m*Y+p*dt,f[4]=h*P+d*V+m*tt+p*ct,f[8]=h*T+d*Q+m*W+p*rt,f[12]=h*U+d*st+m*q+p*bt,f[1]=x*N+_*F+v*Y+M*dt,f[5]=x*P+_*V+v*tt+M*ct,f[9]=x*T+_*Q+v*W+M*rt,f[13]=x*U+_*st+v*q+M*bt,f[2]=R*N+w*F+y*Y+S*dt,f[6]=R*P+w*V+y*tt+S*ct,f[10]=R*T+w*Q+y*W+S*rt,f[14]=R*U+w*st+y*q+S*bt,f[3]=O*N+G*F+C*Y+D*dt,f[7]=O*P+G*V+C*tt+D*ct,f[11]=O*T+G*Q+C*W+D*rt,f[15]=O*U+G*st+C*q+D*bt,this}multiplyScalar(e){const i=this.elements;return i[0]*=e,i[4]*=e,i[8]*=e,i[12]*=e,i[1]*=e,i[5]*=e,i[9]*=e,i[13]*=e,i[2]*=e,i[6]*=e,i[10]*=e,i[14]*=e,i[3]*=e,i[7]*=e,i[11]*=e,i[15]*=e,this}determinant(){const e=this.elements,i=e[0],s=e[4],l=e[8],f=e[12],h=e[1],d=e[5],m=e[9],p=e[13],x=e[2],_=e[6],v=e[10],M=e[14],R=e[3],w=e[7],y=e[11],S=e[15],O=m*M-p*v,G=d*M-p*_,C=d*v-m*_,D=h*M-p*x,N=h*v-m*x,P=h*_-d*x;return i*(w*O-y*G+S*C)-s*(R*O-y*D+S*N)+l*(R*G-w*D+S*P)-f*(R*C-w*N+y*P)}determinantAffine(){const e=this.elements,i=e[0],s=e[4],l=e[8],f=e[1],h=e[5],d=e[9],m=e[2],p=e[6],x=e[10];return i*(h*x-d*p)-s*(f*x-d*m)+l*(f*p-h*m)}transpose(){const e=this.elements;let i;return i=e[1],e[1]=e[4],e[4]=i,i=e[2],e[2]=e[8],e[8]=i,i=e[6],e[6]=e[9],e[9]=i,i=e[3],e[3]=e[12],e[12]=i,i=e[7],e[7]=e[13],e[13]=i,i=e[11],e[11]=e[14],e[14]=i,this}setPosition(e,i,s){const l=this.elements;return e.isVector3?(l[12]=e.x,l[13]=e.y,l[14]=e.z):(l[12]=e,l[13]=i,l[14]=s),this}invert(){const e=this.elements,i=e[0],s=e[1],l=e[2],f=e[3],h=e[4],d=e[5],m=e[6],p=e[7],x=e[8],_=e[9],v=e[10],M=e[11],R=e[12],w=e[13],y=e[14],S=e[15],O=i*d-s*h,G=i*m-l*h,C=i*p-f*h,D=s*m-l*d,N=s*p-f*d,P=l*p-f*m,T=x*w-_*R,U=x*y-v*R,F=x*S-M*R,V=_*y-v*w,Q=_*S-M*w,st=v*S-M*y,Y=O*st-G*Q+C*V+D*F-N*U+P*T;if(Y===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);const tt=1/Y;return e[0]=(d*st-m*Q+p*V)*tt,e[1]=(l*Q-s*st-f*V)*tt,e[2]=(w*P-y*N+S*D)*tt,e[3]=(v*N-_*P-M*D)*tt,e[4]=(m*F-h*st-p*U)*tt,e[5]=(i*st-l*F+f*U)*tt,e[6]=(y*C-R*P-S*G)*tt,e[7]=(x*P-v*C+M*G)*tt,e[8]=(h*Q-d*F+p*T)*tt,e[9]=(s*F-i*Q-f*T)*tt,e[10]=(R*N-w*C+S*O)*tt,e[11]=(_*C-x*N-M*O)*tt,e[12]=(d*U-h*V-m*T)*tt,e[13]=(i*V-s*U+l*T)*tt,e[14]=(w*G-R*D-y*O)*tt,e[15]=(x*D-_*G+v*O)*tt,this}scale(e){const i=this.elements,s=e.x,l=e.y,f=e.z;return i[0]*=s,i[4]*=l,i[8]*=f,i[1]*=s,i[5]*=l,i[9]*=f,i[2]*=s,i[6]*=l,i[10]*=f,i[3]*=s,i[7]*=l,i[11]*=f,this}getMaxScaleOnAxis(){const e=this.elements,i=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],s=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],l=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(i,s,l))}makeTranslation(e,i,s){return e.isVector3?this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1):this.set(1,0,0,e,0,1,0,i,0,0,1,s,0,0,0,1),this}makeRotationX(e){const i=Math.cos(e),s=Math.sin(e);return this.set(1,0,0,0,0,i,-s,0,0,s,i,0,0,0,0,1),this}makeRotationY(e){const i=Math.cos(e),s=Math.sin(e);return this.set(i,0,s,0,0,1,0,0,-s,0,i,0,0,0,0,1),this}makeRotationZ(e){const i=Math.cos(e),s=Math.sin(e);return this.set(i,-s,0,0,s,i,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,i){const s=Math.cos(i),l=Math.sin(i),f=1-s,h=e.x,d=e.y,m=e.z,p=f*h,x=f*d;return this.set(p*h+s,p*d-l*m,p*m+l*d,0,p*d+l*m,x*d+s,x*m-l*h,0,p*m-l*d,x*m+l*h,f*m*m+s,0,0,0,0,1),this}makeScale(e,i,s){return this.set(e,0,0,0,0,i,0,0,0,0,s,0,0,0,0,1),this}makeShear(e,i,s,l,f,h){return this.set(1,s,f,0,e,1,h,0,i,l,1,0,0,0,0,1),this}compose(e,i,s){const l=this.elements,f=i._x,h=i._y,d=i._z,m=i._w,p=f+f,x=h+h,_=d+d,v=f*p,M=f*x,R=f*_,w=h*x,y=h*_,S=d*_,O=m*p,G=m*x,C=m*_,D=s.x,N=s.y,P=s.z;return l[0]=(1-(w+S))*D,l[1]=(M+C)*D,l[2]=(R-G)*D,l[3]=0,l[4]=(M-C)*N,l[5]=(1-(v+S))*N,l[6]=(y+O)*N,l[7]=0,l[8]=(R+G)*P,l[9]=(y-O)*P,l[10]=(1-(v+w))*P,l[11]=0,l[12]=e.x,l[13]=e.y,l[14]=e.z,l[15]=1,this}decompose(e,i,s){const l=this.elements;e.x=l[12],e.y=l[13],e.z=l[14];const f=this.determinantAffine();if(f===0)return s.set(1,1,1),i.identity(),this;let h=Zr.set(l[0],l[1],l[2]).length();const d=Zr.set(l[4],l[5],l[6]).length(),m=Zr.set(l[8],l[9],l[10]).length();f<0&&(h=-h),Gi.copy(this);const p=1/h,x=1/d,_=1/m;return Gi.elements[0]*=p,Gi.elements[1]*=p,Gi.elements[2]*=p,Gi.elements[4]*=x,Gi.elements[5]*=x,Gi.elements[6]*=x,Gi.elements[8]*=_,Gi.elements[9]*=_,Gi.elements[10]*=_,i.setFromRotationMatrix(Gi),s.x=h,s.y=d,s.z=m,this}makePerspective(e,i,s,l,f,h,d=ha,m=!1){const p=this.elements,x=2*f/(i-e),_=2*f/(s-l),v=(i+e)/(i-e),M=(s+l)/(s-l);let R,w;if(m)R=f/(h-f),w=h*f/(h-f);else if(d===ha)R=-(h+f)/(h-f),w=-2*h*f/(h-f);else if(d===Dl)R=-h/(h-f),w=-h*f/(h-f);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+d);return p[0]=x,p[4]=0,p[8]=v,p[12]=0,p[1]=0,p[5]=_,p[9]=M,p[13]=0,p[2]=0,p[6]=0,p[10]=R,p[14]=w,p[3]=0,p[7]=0,p[11]=-1,p[15]=0,this}makeOrthographic(e,i,s,l,f,h,d=ha,m=!1){const p=this.elements,x=2/(i-e),_=2/(s-l),v=-(i+e)/(i-e),M=-(s+l)/(s-l);let R,w;if(m)R=1/(h-f),w=h/(h-f);else if(d===ha)R=-2/(h-f),w=-(h+f)/(h-f);else if(d===Dl)R=-1/(h-f),w=-f/(h-f);else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+d);return p[0]=x,p[4]=0,p[8]=0,p[12]=v,p[1]=0,p[5]=_,p[9]=0,p[13]=M,p[2]=0,p[6]=0,p[10]=R,p[14]=w,p[3]=0,p[7]=0,p[11]=0,p[15]=1,this}equals(e){const i=this.elements,s=e.elements;for(let l=0;l<16;l++)if(i[l]!==s[l])return!1;return!0}fromArray(e,i=0){for(let s=0;s<16;s++)this.elements[s]=e[s+i];return this}toArray(e=[],i=0){const s=this.elements;return e[i]=s[0],e[i+1]=s[1],e[i+2]=s[2],e[i+3]=s[3],e[i+4]=s[4],e[i+5]=s[5],e[i+6]=s[6],e[i+7]=s[7],e[i+8]=s[8],e[i+9]=s[9],e[i+10]=s[10],e[i+11]=s[11],e[i+12]=s[12],e[i+13]=s[13],e[i+14]=s[14],e[i+15]=s[15],e}};Xc.prototype.isMatrix4=!0;let ln=Xc;const Zr=new nt,Gi=new ln,mT=new nt(0,0,0),gT=new nt(1,1,1),_s=new nt,ic=new nt,mi=new nt,Kv=new ln,Qv=new Es;class Ts{constructor(e=0,i=0,s=0,l=Ts.DEFAULT_ORDER){this.isEuler=!0,this._x=e,this._y=i,this._z=s,this._order=l}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,i,s,l=this._order){return this._x=e,this._y=i,this._z=s,this._order=l,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,i=this._order,s=!0){const l=e.elements,f=l[0],h=l[4],d=l[8],m=l[1],p=l[5],x=l[9],_=l[2],v=l[6],M=l[10];switch(i){case"XYZ":this._y=Math.asin(Ce(d,-1,1)),Math.abs(d)<.9999999?(this._x=Math.atan2(-x,M),this._z=Math.atan2(-h,f)):(this._x=Math.atan2(v,p),this._z=0);break;case"YXZ":this._x=Math.asin(-Ce(x,-1,1)),Math.abs(x)<.9999999?(this._y=Math.atan2(d,M),this._z=Math.atan2(m,p)):(this._y=Math.atan2(-_,f),this._z=0);break;case"ZXY":this._x=Math.asin(Ce(v,-1,1)),Math.abs(v)<.9999999?(this._y=Math.atan2(-_,M),this._z=Math.atan2(-h,p)):(this._y=0,this._z=Math.atan2(m,f));break;case"ZYX":this._y=Math.asin(-Ce(_,-1,1)),Math.abs(_)<.9999999?(this._x=Math.atan2(v,M),this._z=Math.atan2(m,f)):(this._x=0,this._z=Math.atan2(-h,p));break;case"YZX":this._z=Math.asin(Ce(m,-1,1)),Math.abs(m)<.9999999?(this._x=Math.atan2(-x,p),this._y=Math.atan2(-_,f)):(this._x=0,this._y=Math.atan2(d,M));break;case"XZY":this._z=Math.asin(-Ce(h,-1,1)),Math.abs(h)<.9999999?(this._x=Math.atan2(v,p),this._y=Math.atan2(d,f)):(this._x=Math.atan2(-x,M),this._y=0);break;default:oe("Euler: .setFromRotationMatrix() encountered an unknown order: "+i)}return this._order=i,s===!0&&this._onChangeCallback(),this}setFromQuaternion(e,i,s){return Kv.makeRotationFromQuaternion(e),this.setFromRotationMatrix(Kv,i,s)}setFromVector3(e,i=this._order){return this.set(e.x,e.y,e.z,i)}reorder(e){return Qv.setFromEuler(this),this.setFromQuaternion(Qv,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],i=0){return e[i]=this._x,e[i+1]=this._y,e[i+2]=this._z,e[i+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}}Ts.DEFAULT_ORDER="XYZ";class fS{constructor(){this.mask=1}set(e){this.mask=(1<<e|0)>>>0}enable(e){this.mask|=1<<e|0}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e|0}disable(e){this.mask&=~(1<<e|0)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!==0}isEnabled(e){return(this.mask&(1<<e|0))!==0}}let _T=0;const Jv=new nt,jr=new Es,Ua=new ln,ac=new nt,ml=new nt,vT=new nt,xT=new Es,$v=new nt(1,0,0),tx=new nt(0,1,0),ex=new nt(0,0,1),nx={type:"added"},ST={type:"removed"},Kr={type:"childadded",child:null},Pd={type:"childremoved",child:null};class Dn extends bs{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:_T++}),this.uuid=Ul(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=Dn.DEFAULT_UP.clone();const e=new nt,i=new Ts,s=new Es,l=new nt(1,1,1);function f(){s.setFromEuler(i,!1)}function h(){i.setFromQuaternion(s,void 0,!1)}i._onChange(f),s._onChange(h),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:e},rotation:{configurable:!0,enumerable:!0,value:i},quaternion:{configurable:!0,enumerable:!0,value:s},scale:{configurable:!0,enumerable:!0,value:l},modelViewMatrix:{value:new ln},normalMatrix:{value:new de}}),this.matrix=new ln,this.matrixWorld=new ln,this.matrixAutoUpdate=Dn.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=Dn.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new fS,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.static=!1,this.userData={},this.pivot=null}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,i){this.quaternion.setFromAxisAngle(e,i)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,i){return jr.setFromAxisAngle(e,i),this.quaternion.multiply(jr),this}rotateOnWorldAxis(e,i){return jr.setFromAxisAngle(e,i),this.quaternion.premultiply(jr),this}rotateX(e){return this.rotateOnAxis($v,e)}rotateY(e){return this.rotateOnAxis(tx,e)}rotateZ(e){return this.rotateOnAxis(ex,e)}translateOnAxis(e,i){return Jv.copy(e).applyQuaternion(this.quaternion),this.position.add(Jv.multiplyScalar(i)),this}translateX(e){return this.translateOnAxis($v,e)}translateY(e){return this.translateOnAxis(tx,e)}translateZ(e){return this.translateOnAxis(ex,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(Ua.copy(this.matrixWorld).invert())}lookAt(e,i,s){e.isVector3?ac.copy(e):ac.set(e,i,s);const l=this.parent;this.updateWorldMatrix(!0,!1),ml.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?Ua.lookAt(ml,ac,this.up):Ua.lookAt(ac,ml,this.up),this.quaternion.setFromRotationMatrix(Ua),l&&(Ua.extractRotation(l.matrixWorld),jr.setFromRotationMatrix(Ua),this.quaternion.premultiply(jr.invert()))}add(e){if(arguments.length>1){for(let i=0;i<arguments.length;i++)this.add(arguments[i]);return this}return e===this?(Fe("Object3D.add: object can't be added as a child of itself.",e),this):(e&&e.isObject3D?(e.removeFromParent(),e.parent=this,this.children.push(e),e.dispatchEvent(nx),Kr.child=e,this.dispatchEvent(Kr),Kr.child=null):Fe("Object3D.add: object not an instance of THREE.Object3D.",e),this)}remove(e){if(arguments.length>1){for(let s=0;s<arguments.length;s++)this.remove(arguments[s]);return this}const i=this.children.indexOf(e);return i!==-1&&(e.parent=null,this.children.splice(i,1),e.dispatchEvent(ST),Pd.child=e,this.dispatchEvent(Pd),Pd.child=null),this}removeFromParent(){const e=this.parent;return e!==null&&e.remove(this),this}clear(){return this.remove(...this.children)}attach(e){return this.updateWorldMatrix(!0,!1),Ua.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),Ua.multiply(e.parent.matrixWorld)),e.applyMatrix4(Ua),e.removeFromParent(),e.parent=this,this.children.push(e),e.updateWorldMatrix(!1,!0),e.dispatchEvent(nx),Kr.child=e,this.dispatchEvent(Kr),Kr.child=null,this}getObjectById(e){return this.getObjectByProperty("id",e)}getObjectByName(e){return this.getObjectByProperty("name",e)}getObjectByProperty(e,i){if(this[e]===i)return this;for(let s=0,l=this.children.length;s<l;s++){const h=this.children[s].getObjectByProperty(e,i);if(h!==void 0)return h}}getObjectsByProperty(e,i,s=[]){this[e]===i&&s.push(this);const l=this.children;for(let f=0,h=l.length;f<h;f++)l[f].getObjectsByProperty(e,i,s);return s}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(ml,e,vT),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(ml,xT,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);const i=this.matrixWorld.elements;return e.set(i[8],i[9],i[10]).normalize()}raycast(){}intersectsFrustum(){}traverse(e){e(this);const i=this.children;for(let s=0,l=i.length;s<l;s++)i[s].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);const i=this.children;for(let s=0,l=i.length;s<l;s++)i[s].traverseVisible(e)}traverseAncestors(e){const i=this.parent;i!==null&&(e(i),i.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale);const e=this.pivot;if(e!==null){const i=e.x,s=e.y,l=e.z,f=this.matrix.elements;f[12]+=i-f[0]*i-f[4]*s-f[8]*l,f[13]+=s-f[1]*i-f[5]*s-f[9]*l,f[14]+=l-f[2]*i-f[6]*s-f[10]*l}this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,e=!0);const i=this.children;for(let s=0,l=i.length;s<l;s++)i[s].updateMatrixWorld(e)}updateWorldMatrix(e,i,s=!1){const l=this.parent;if(e===!0&&l!==null&&l.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||s)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,s=!0),i===!0){const f=this.children;for(let h=0,d=f.length;h<d;h++)f[h].updateWorldMatrix(!1,!0,s)}}toJSON(e){const i=e===void 0||typeof e=="string",s={};i&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},s.metadata={version:4.7,type:"Object",generator:"Object3D.toJSON"});const l={};l.uuid=this.uuid,l.type=this.type,l.name=this.name,l.castShadow=this.castShadow,l.receiveShadow=this.receiveShadow,l.visible=this.visible,l.frustumCulled=this.frustumCulled,l.renderOrder=this.renderOrder,l.static=this.static,l.matrixAutoUpdate=this.matrixAutoUpdate,Object.keys(this.userData).length>0&&(l.userData=this.userData),l.layers=this.layers.mask,l.matrix=this.matrix.toArray(),l.up=this.up.toArray(),this.pivot!==null&&(l.pivot=this.pivot.toArray()),this.morphTargetDictionary!==void 0&&(l.morphTargetDictionary=Object.assign({},this.morphTargetDictionary)),this.morphTargetInfluences!==void 0&&(l.morphTargetInfluences=this.morphTargetInfluences.slice()),this.isInstancedMesh&&(l.type="InstancedMesh",l.count=this.count,l.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(l.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(l.type="BatchedMesh",l.perObjectFrustumCulled=this.perObjectFrustumCulled,l.sortObjects=this.sortObjects,l.drawRanges=this._drawRanges,l.reservedRanges=this._reservedRanges,l.geometryInfo=this._geometryInfo.map(d=>({...d,boundingBox:d.boundingBox?d.boundingBox.toJSON():void 0,boundingSphere:d.boundingSphere?d.boundingSphere.toJSON():void 0})),l.instanceInfo=this._instanceInfo.map(d=>({...d})),l.availableInstanceIds=this._availableInstanceIds.slice(),l.availableGeometryIds=this._availableGeometryIds.slice(),l.nextIndexStart=this._nextIndexStart,l.nextVertexStart=this._nextVertexStart,l.geometryCount=this._geometryCount,l.maxInstanceCount=this._maxInstanceCount,l.maxVertexCount=this._maxVertexCount,l.maxIndexCount=this._maxIndexCount,l.geometryInitialized=this._geometryInitialized,l.matricesTexture=this._matricesTexture.toJSON(e),l.indirectTexture=this._indirectTexture.toJSON(e),this._colorsTexture!==null&&(l.colorsTexture=this._colorsTexture.toJSON(e)),this.boundingSphere!==null&&(l.boundingSphere=this.boundingSphere.toJSON()),this.boundingBox!==null&&(l.boundingBox=this.boundingBox.toJSON()));function f(d,m){return d[m.uuid]===void 0&&(d[m.uuid]=m.toJSON(e)),m.uuid}if(this.isScene)this.background&&(this.background.isColor?l.background=this.background.toJSON():this.background.isTexture&&(l.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(l.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){l.geometry=f(e.geometries,this.geometry);const d=this.geometry.parameters;if(d!==void 0&&d.shapes!==void 0){const m=d.shapes;if(Array.isArray(m))for(let p=0,x=m.length;p<x;p++){const _=m[p];f(e.shapes,_)}else f(e.shapes,m)}}if(this.isSkinnedMesh&&(l.bindMode=this.bindMode,l.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(f(e.skeletons,this.skeleton),l.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){const d=[];for(let m=0,p=this.material.length;m<p;m++)d.push(f(e.materials,this.material[m]));l.material=d}else l.material=f(e.materials,this.material);if(this.children.length>0){l.children=[];for(let d=0;d<this.children.length;d++)l.children.push(this.children[d].toJSON(e).object)}if(this.animations.length>0){l.animations=[];for(let d=0;d<this.animations.length;d++){const m=this.animations[d];l.animations.push(f(e.animations,m))}}if(i){const d=h(e.geometries),m=h(e.materials),p=h(e.textures),x=h(e.images),_=h(e.shapes),v=h(e.skeletons),M=h(e.animations),R=h(e.nodes);d.length>0&&(s.geometries=d),m.length>0&&(s.materials=m),p.length>0&&(s.textures=p),x.length>0&&(s.images=x),_.length>0&&(s.shapes=_),v.length>0&&(s.skeletons=v),M.length>0&&(s.animations=M),R.length>0&&(s.nodes=R)}return s.object=l,s;function h(d){const m=[];for(const p in d){const x=d[p];delete x.metadata,m.push(x)}return m}}clone(e){return new this.constructor().copy(this,e)}copy(e,i=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.pivot=e.pivot!==null?e.pivot.clone():null,this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.static=e.static,this.animations=e.animations.slice(),this.userData=JSON.parse(JSON.stringify(e.userData)),i===!0)for(let s=0;s<e.children.length;s++){const l=e.children[s];this.add(l.clone())}return this}dispose(){this.dispatchEvent({type:"dispose"})}}Dn.DEFAULT_UP=new nt(0,1,0);Dn.DEFAULT_MATRIX_AUTO_UPDATE=!0;Dn.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;class la extends Dn{constructor(){super(),this.isGroup=!0,this.type="Group"}}const yT={type:"move"};class Id{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new la,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new la,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new nt,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new nt),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new la,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new nt,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new nt,this._grip.eventsEnabled=!1),this._grip}dispatchEvent(e){return this._targetRay!==null&&this._targetRay.dispatchEvent(e),this._grip!==null&&this._grip.dispatchEvent(e),this._hand!==null&&this._hand.dispatchEvent(e),this}connect(e){if(e&&e.hand){const i=this._hand;if(i)for(const s of e.hand.values())this._getHandJoint(i,s)}return this.dispatchEvent({type:"connected",data:e}),this}disconnect(e){return this.dispatchEvent({type:"disconnected",data:e}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(e,i,s){let l=null,f=null,h=null;const d=this._targetRay,m=this._grip,p=this._hand;if(e&&i.session.visibilityState!=="visible-blurred"){if(p&&e.hand){h=!0;for(const w of e.hand.values()){const y=i.getJointPose(w,s),S=this._getHandJoint(p,w);y!==null&&(S.matrix.fromArray(y.transform.matrix),S.matrix.decompose(S.position,S.rotation,S.scale),S.matrixWorldNeedsUpdate=!0,S.jointRadius=y.radius),S.visible=y!==null}const x=p.joints["index-finger-tip"],_=p.joints["thumb-tip"],v=x.position.distanceTo(_.position),M=.02,R=.005;p.inputState.pinching&&v>M+R?(p.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:e.handedness,target:this})):!p.inputState.pinching&&v<=M-R&&(p.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:e.handedness,target:this}))}else m!==null&&e.gripSpace&&(f=i.getPose(e.gripSpace,s),f!==null&&(m.matrix.fromArray(f.transform.matrix),m.matrix.decompose(m.position,m.rotation,m.scale),m.matrixWorldNeedsUpdate=!0,f.linearVelocity?(m.hasLinearVelocity=!0,m.linearVelocity.copy(f.linearVelocity)):m.hasLinearVelocity=!1,f.angularVelocity?(m.hasAngularVelocity=!0,m.angularVelocity.copy(f.angularVelocity)):m.hasAngularVelocity=!1,m.eventsEnabled&&m.dispatchEvent({type:"gripUpdated",data:e,target:this})));d!==null&&(l=i.getPose(e.targetRaySpace,s),l===null&&f!==null&&(l=f),l!==null&&(d.matrix.fromArray(l.transform.matrix),d.matrix.decompose(d.position,d.rotation,d.scale),d.matrixWorldNeedsUpdate=!0,l.linearVelocity?(d.hasLinearVelocity=!0,d.linearVelocity.copy(l.linearVelocity)):d.hasLinearVelocity=!1,l.angularVelocity?(d.hasAngularVelocity=!0,d.angularVelocity.copy(l.angularVelocity)):d.hasAngularVelocity=!1,this.dispatchEvent(yT)))}return d!==null&&(d.visible=l!==null),m!==null&&(m.visible=f!==null),p!==null&&(p.visible=h!==null),this}_getHandJoint(e,i){if(e.joints[i.jointName]===void 0){const s=new la;s.matrixAutoUpdate=!1,s.visible=!1,e.joints[i.jointName]=s,e.add(s)}return e.joints[i.jointName]}}const hS={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},vs={h:0,s:0,l:0},sc={h:0,s:0,l:0};function zd(o,e,i){return i<0&&(i+=1),i>1&&(i-=1),i<1/6?o+(e-o)*6*i:i<1/2?e:i<2/3?o+(e-o)*6*(2/3-i):o}class Me{constructor(e,i,s){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(e,i,s)}set(e,i,s){if(i===void 0&&s===void 0){const l=e;l&&l.isColor?this.copy(l):typeof l=="number"?this.setHex(l):typeof l=="string"&&this.setStyle(l)}else this.setRGB(e,i,s);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,i=Ui){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(e&255)/255,Oe.colorSpaceToWorking(this,i),this}setRGB(e,i,s,l=Oe.workingColorSpace){return this.r=e,this.g=i,this.b=s,Oe.colorSpaceToWorking(this,l),this}setHSL(e,i,s,l=Oe.workingColorSpace){if(e=oT(e,1),i=Ce(i,0,1),s=Ce(s,0,1),i===0)this.r=this.g=this.b=s;else{const f=s<=.5?s*(1+i):s+i-s*i,h=2*s-f;this.r=zd(h,f,e+1/3),this.g=zd(h,f,e),this.b=zd(h,f,e-1/3)}return Oe.colorSpaceToWorking(this,l),this}setStyle(e,i=Ui){function s(f){f!==void 0&&parseFloat(f)<1&&oe("Color: Alpha component of "+e+" will be ignored.")}let l;if(l=/^(\w+)\(([^\)]*)\)/.exec(e)){let f;const h=l[1],d=l[2];switch(h){case"rgb":case"rgba":if(f=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(d))return s(f[4]),this.setRGB(Math.min(255,parseInt(f[1],10))/255,Math.min(255,parseInt(f[2],10))/255,Math.min(255,parseInt(f[3],10))/255,i);if(f=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(d))return s(f[4]),this.setRGB(Math.min(100,parseInt(f[1],10))/100,Math.min(100,parseInt(f[2],10))/100,Math.min(100,parseInt(f[3],10))/100,i);break;case"hsl":case"hsla":if(f=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(d))return s(f[4]),this.setHSL(parseFloat(f[1])/360,parseFloat(f[2])/100,parseFloat(f[3])/100,i);break;default:oe("Color: Unknown color model "+e)}}else if(l=/^\#([A-Fa-f\d]+)$/.exec(e)){const f=l[1],h=f.length;if(h===3)return this.setRGB(parseInt(f.charAt(0),16)/15,parseInt(f.charAt(1),16)/15,parseInt(f.charAt(2),16)/15,i);if(h===6)return this.setHex(parseInt(f,16),i);oe("Color: Invalid hex color "+e)}else if(e&&e.length>0)return this.setColorName(e,i);return this}setColorName(e,i=Ui){const s=hS[e.toLowerCase()];return s!==void 0?this.setHex(s,i):oe("Color: Unknown color "+e),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=Ha(e.r),this.g=Ha(e.g),this.b=Ha(e.b),this}copyLinearToSRGB(e){return this.r=fo(e.r),this.g=fo(e.g),this.b=fo(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=Ui){return Oe.workingToColorSpace(Hn.copy(this),e),Math.round(Ce(Hn.r*255,0,255))*65536+Math.round(Ce(Hn.g*255,0,255))*256+Math.round(Ce(Hn.b*255,0,255))}getHexString(e=Ui){return("000000"+this.getHex(e).toString(16)).slice(-6)}getHSL(e,i=Oe.workingColorSpace){Oe.workingToColorSpace(Hn.copy(this),i);const s=Hn.r,l=Hn.g,f=Hn.b,h=Math.max(s,l,f),d=Math.min(s,l,f);let m,p;const x=(d+h)/2;if(d===h)m=0,p=0;else{const _=h-d;switch(p=x<=.5?_/(h+d):_/(2-h-d),h){case s:m=(l-f)/_+(l<f?6:0);break;case l:m=(f-s)/_+2;break;case f:m=(s-l)/_+4;break}m/=6}return e.h=m,e.s=p,e.l=x,e}getRGB(e,i=Oe.workingColorSpace){return Oe.workingToColorSpace(Hn.copy(this),i),e.r=Hn.r,e.g=Hn.g,e.b=Hn.b,e}getStyle(e=Ui){Oe.workingToColorSpace(Hn.copy(this),e);const i=Hn.r,s=Hn.g,l=Hn.b;return e!==Ui?`color(${e} ${i.toFixed(3)} ${s.toFixed(3)} ${l.toFixed(3)})`:`rgb(${Math.round(i*255)},${Math.round(s*255)},${Math.round(l*255)})`}offsetHSL(e,i,s){return this.getHSL(vs),this.setHSL(vs.h+e,vs.s+i,vs.l+s)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,i){return this.r=e.r+i.r,this.g=e.g+i.g,this.b=e.b+i.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,i){return this.r+=(e.r-this.r)*i,this.g+=(e.g-this.g)*i,this.b+=(e.b-this.b)*i,this}lerpColors(e,i,s){return this.r=e.r+(i.r-e.r)*s,this.g=e.g+(i.g-e.g)*s,this.b=e.b+(i.b-e.b)*s,this}lerpHSL(e,i){this.getHSL(vs),e.getHSL(sc);const s=Dd(vs.h,sc.h,i),l=Dd(vs.s,sc.s,i),f=Dd(vs.l,sc.l,i);return this.setHSL(s,l,f),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){const i=this.r,s=this.g,l=this.b,f=e.elements;return this.r=f[0]*i+f[3]*s+f[6]*l,this.g=f[1]*i+f[4]*s+f[7]*l,this.b=f[2]*i+f[5]*s+f[8]*l,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,i=0){return this.r=e[i],this.g=e[i+1],this.b=e[i+2],this}toArray(e=[],i=0){return e[i]=this.r,e[i+1]=this.g,e[i+2]=this.b,e}fromBufferAttribute(e,i){return this.r=e.getX(i),this.g=e.getY(i),this.b=e.getZ(i),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}}const Hn=new Me;Me.NAMES=hS;class cm{constructor(e,i=1,s=1e3){this.isFog=!0,this.name="",this.color=new Me(e),this.near=i,this.far=s}clone(){return new cm(this.color,this.near,this.far)}toJSON(){return{type:"Fog",name:this.name,color:this.color.getHex(),near:this.near,far:this.far}}}class MT extends Dn{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new Ts,this.environmentIntensity=1,this.environmentRotation=new Ts,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(e,i){return super.copy(e,i),e.background!==null&&(this.background=e.background.clone()),e.environment!==null&&(this.environment=e.environment.clone()),e.fog!==null&&(this.fog=e.fog.clone()),this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,this.backgroundRotation.copy(e.backgroundRotation),this.environmentIntensity=e.environmentIntensity,this.environmentRotation.copy(e.environmentRotation),e.overrideMaterial!==null&&(this.overrideMaterial=e.overrideMaterial.clone()),this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){const i=super.toJSON(e);return this.fog!==null&&(i.object.fog=this.fog.toJSON()),i.object.backgroundBlurriness=this.backgroundBlurriness,i.object.backgroundIntensity=this.backgroundIntensity,i.object.backgroundRotation=this.backgroundRotation.toArray(),i.object.environmentIntensity=this.environmentIntensity,i.object.environmentRotation=this.environmentRotation.toArray(),i}}const Vi=new nt,La=new nt,Bd=new nt,Oa=new nt,Qr=new nt,Jr=new nt,ix=new nt,Fd=new nt,Hd=new nt,Gd=new nt,Vd=new on,Xd=new on,kd=new on;class Oi{constructor(e=new nt,i=new nt,s=new nt){this.a=e,this.b=i,this.c=s}static getNormal(e,i,s,l){l.subVectors(s,i),Vi.subVectors(e,i),l.cross(Vi);const f=l.lengthSq();return f>0?l.multiplyScalar(1/Math.sqrt(f)):l.set(0,0,0)}static getBarycoord(e,i,s,l,f){Vi.subVectors(l,i),La.subVectors(s,i),Bd.subVectors(e,i);const h=Vi.dot(Vi),d=Vi.dot(La),m=Vi.dot(Bd),p=La.dot(La),x=La.dot(Bd),_=h*p-d*d;if(_===0)return f.set(0,0,0),null;const v=1/_,M=(p*m-d*x)*v,R=(h*x-d*m)*v;return f.set(1-M-R,R,M)}static containsPoint(e,i,s,l){return this.getBarycoord(e,i,s,l,Oa)===null?!1:Oa.x>=0&&Oa.y>=0&&Oa.x+Oa.y<=1}static getInterpolation(e,i,s,l,f,h,d,m){return this.getBarycoord(e,i,s,l,Oa)===null?(m.x=0,m.y=0,"z"in m&&(m.z=0),"w"in m&&(m.w=0),null):(m.setScalar(0),m.addScaledVector(f,Oa.x),m.addScaledVector(h,Oa.y),m.addScaledVector(d,Oa.z),m)}static getInterpolatedAttribute(e,i,s,l,f,h){return Vd.setScalar(0),Xd.setScalar(0),kd.setScalar(0),Vd.fromBufferAttribute(e,i),Xd.fromBufferAttribute(e,s),kd.fromBufferAttribute(e,l),h.setScalar(0),h.addScaledVector(Vd,f.x),h.addScaledVector(Xd,f.y),h.addScaledVector(kd,f.z),h}static isFrontFacing(e,i,s,l){return Vi.subVectors(s,i),La.subVectors(e,i),Vi.cross(La).dot(l)<0}set(e,i,s){return this.a.copy(e),this.b.copy(i),this.c.copy(s),this}setFromPointsAndIndices(e,i,s,l){return this.a.copy(e[i]),this.b.copy(e[s]),this.c.copy(e[l]),this}setFromAttributeAndIndices(e,i,s,l){return this.a.fromBufferAttribute(e,i),this.b.fromBufferAttribute(e,s),this.c.fromBufferAttribute(e,l),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return Vi.subVectors(this.c,this.b),La.subVectors(this.a,this.b),Vi.cross(La).length()*.5}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(e){return Oi.getNormal(this.a,this.b,this.c,e)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(e,i){return Oi.getBarycoord(e,this.a,this.b,this.c,i)}getInterpolation(e,i,s,l,f){return Oi.getInterpolation(e,this.a,this.b,this.c,i,s,l,f)}containsPoint(e){return Oi.containsPoint(e,this.a,this.b,this.c)}isFrontFacing(e){return Oi.isFrontFacing(this.a,this.b,this.c,e)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,i){const s=this.a,l=this.b,f=this.c;let h,d;Qr.subVectors(l,s),Jr.subVectors(f,s),Fd.subVectors(e,s);const m=Qr.dot(Fd),p=Jr.dot(Fd);if(m<=0&&p<=0)return i.copy(s);Hd.subVectors(e,l);const x=Qr.dot(Hd),_=Jr.dot(Hd);if(x>=0&&_<=x)return i.copy(l);const v=m*_-x*p;if(v<=0&&m>=0&&x<=0)return h=m/(m-x),i.copy(s).addScaledVector(Qr,h);Gd.subVectors(e,f);const M=Qr.dot(Gd),R=Jr.dot(Gd);if(R>=0&&M<=R)return i.copy(f);const w=M*p-m*R;if(w<=0&&p>=0&&R<=0)return d=p/(p-R),i.copy(s).addScaledVector(Jr,d);const y=x*R-M*_;if(y<=0&&_-x>=0&&M-R>=0)return ix.subVectors(f,l),d=(_-x)/(_-x+(M-R)),i.copy(l).addScaledVector(ix,d);const S=1/(y+w+v);return h=w*S,d=v*S,i.copy(s).addScaledVector(Qr,h).addScaledVector(Jr,d)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}}class Ll{constructor(e=new nt(1/0,1/0,1/0),i=new nt(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=i}set(e,i){return this.min.copy(e),this.max.copy(i),this}setFromArray(e){this.makeEmpty();for(let i=0,s=e.length;i<s;i+=3)this.expandByPoint(Xi.fromArray(e,i));return this}setFromBufferAttribute(e){this.makeEmpty();for(let i=0,s=e.count;i<s;i++)this.expandByPoint(Xi.fromBufferAttribute(e,i));return this}setFromPoints(e){this.makeEmpty();for(let i=0,s=e.length;i<s;i++)this.expandByPoint(e[i]);return this}setFromCenterAndSize(e,i){const s=Xi.copy(i).multiplyScalar(.5);return this.min.copy(e).sub(s),this.max.copy(e).add(s),this}setFromObject(e,i=!1){return this.makeEmpty(),this.expandByObject(e,i)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,i=!1){e.updateWorldMatrix(!1,!1);const s=e.geometry;if(s!==void 0){const f=s.getAttribute("position");if(i===!0&&f!==void 0&&e.isInstancedMesh!==!0)for(let h=0,d=f.count;h<d;h++)e.isMesh===!0?e.getVertexPosition(h,Xi):Xi.fromBufferAttribute(f,h),Xi.applyMatrix4(e.matrixWorld),this.expandByPoint(Xi);else e.boundingBox!==void 0?(e.boundingBox===null&&e.computeBoundingBox(),rc.copy(e.boundingBox)):(s.boundingBox===null&&s.computeBoundingBox(),rc.copy(s.boundingBox)),rc.applyMatrix4(e.matrixWorld),this.union(rc)}const l=e.children;for(let f=0,h=l.length;f<h;f++)this.expandByObject(l[f],i);return this}containsPoint(e){return e.x>=this.min.x&&e.x<=this.max.x&&e.y>=this.min.y&&e.y<=this.max.y&&e.z>=this.min.z&&e.z<=this.max.z}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,i){return i.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return e.max.x>=this.min.x&&e.min.x<=this.max.x&&e.max.y>=this.min.y&&e.min.y<=this.max.y&&e.max.z>=this.min.z&&e.min.z<=this.max.z}intersectsSphere(e){return this.clampPoint(e.center,Xi),Xi.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let i,s;return e.normal.x>0?(i=e.normal.x*this.min.x,s=e.normal.x*this.max.x):(i=e.normal.x*this.max.x,s=e.normal.x*this.min.x),e.normal.y>0?(i+=e.normal.y*this.min.y,s+=e.normal.y*this.max.y):(i+=e.normal.y*this.max.y,s+=e.normal.y*this.min.y),e.normal.z>0?(i+=e.normal.z*this.min.z,s+=e.normal.z*this.max.z):(i+=e.normal.z*this.max.z,s+=e.normal.z*this.min.z),i<=-e.constant&&s>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(gl),oc.subVectors(this.max,gl),$r.subVectors(e.a,gl),to.subVectors(e.b,gl),eo.subVectors(e.c,gl),xs.subVectors(to,$r),Ss.subVectors(eo,to),js.subVectors($r,eo);let i=[0,-xs.z,xs.y,0,-Ss.z,Ss.y,0,-js.z,js.y,xs.z,0,-xs.x,Ss.z,0,-Ss.x,js.z,0,-js.x,-xs.y,xs.x,0,-Ss.y,Ss.x,0,-js.y,js.x,0];return!Wd(i,$r,to,eo,oc)||(i=[1,0,0,0,1,0,0,0,1],!Wd(i,$r,to,eo,oc))?!1:(lc.crossVectors(xs,Ss),i=[lc.x,lc.y,lc.z],Wd(i,$r,to,eo,oc))}clampPoint(e,i){return i.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,Xi).distanceTo(e)}getBoundingSphere(e){return this.isEmpty()?e.makeEmpty():(this.getCenter(e.center),e.radius=this.getSize(Xi).length()*.5),e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()?this:(Pa[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),Pa[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),Pa[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),Pa[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),Pa[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),Pa[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),Pa[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),Pa[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(Pa),this)}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(e){return this.min.fromArray(e.min),this.max.fromArray(e.max),this}}const Pa=[new nt,new nt,new nt,new nt,new nt,new nt,new nt,new nt],Xi=new nt,rc=new Ll,$r=new nt,to=new nt,eo=new nt,xs=new nt,Ss=new nt,js=new nt,gl=new nt,oc=new nt,lc=new nt,Ks=new nt;function Wd(o,e,i,s,l){for(let f=0,h=o.length-3;f<=h;f+=3){Ks.fromArray(o,f);const d=l.x*Math.abs(Ks.x)+l.y*Math.abs(Ks.y)+l.z*Math.abs(Ks.z),m=e.dot(Ks),p=i.dot(Ks),x=s.dot(Ks);if(Math.max(-Math.max(m,p,x),Math.min(m,p,x))>d)return!1}return!0}const Sn=new nt,uc=new le;let ET=0;class Ga extends bs{constructor(e,i,s=!1){if(super(),Array.isArray(e))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:ET++}),this.name="",this.array=e,this.itemSize=i,this.count=e!==void 0?e.length/i:0,this.normalized=s,this.usage=nT,this.updateRanges=[],this.gpuType=fa,this.version=0}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,i){this.updateRanges.push({start:e,count:i})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this.gpuType=e.gpuType,this}copyAt(e,i,s){e*=this.itemSize,s*=i.itemSize;for(let l=0,f=this.itemSize;l<f;l++)this.array[e+l]=i.array[s+l];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let i=0,s=this.count;i<s;i++)uc.fromBufferAttribute(this,i),uc.applyMatrix3(e),this.setXY(i,uc.x,uc.y);else if(this.itemSize===3)for(let i=0,s=this.count;i<s;i++)Sn.fromBufferAttribute(this,i),Sn.applyMatrix3(e),this.setXYZ(i,Sn.x,Sn.y,Sn.z);return this}applyMatrix4(e){for(let i=0,s=this.count;i<s;i++)Sn.fromBufferAttribute(this,i),Sn.applyMatrix4(e),this.setXYZ(i,Sn.x,Sn.y,Sn.z);return this}applyNormalMatrix(e){for(let i=0,s=this.count;i<s;i++)Sn.fromBufferAttribute(this,i),Sn.applyNormalMatrix(e),this.setXYZ(i,Sn.x,Sn.y,Sn.z);return this}transformDirection(e){for(let i=0,s=this.count;i<s;i++)Sn.fromBufferAttribute(this,i),Sn.transformDirection(e),this.setXYZ(i,Sn.x,Sn.y,Sn.z);return this}set(e,i=0){return this.array.set(e,i),this}getComponent(e,i){let s=this.array[e*this.itemSize+i];return this.normalized&&(s=pl(s,this.array)),s}setComponent(e,i,s){return this.normalized&&(s=ni(s,this.array)),this.array[e*this.itemSize+i]=s,this}getX(e){let i=this.array[e*this.itemSize];return this.normalized&&(i=pl(i,this.array)),i}setX(e,i){return this.normalized&&(i=ni(i,this.array)),this.array[e*this.itemSize]=i,this}getY(e){let i=this.array[e*this.itemSize+1];return this.normalized&&(i=pl(i,this.array)),i}setY(e,i){return this.normalized&&(i=ni(i,this.array)),this.array[e*this.itemSize+1]=i,this}getZ(e){let i=this.array[e*this.itemSize+2];return this.normalized&&(i=pl(i,this.array)),i}setZ(e,i){return this.normalized&&(i=ni(i,this.array)),this.array[e*this.itemSize+2]=i,this}getW(e){let i=this.array[e*this.itemSize+3];return this.normalized&&(i=pl(i,this.array)),i}setW(e,i){return this.normalized&&(i=ni(i,this.array)),this.array[e*this.itemSize+3]=i,this}setXY(e,i,s){return e*=this.itemSize,this.normalized&&(i=ni(i,this.array),s=ni(s,this.array)),this.array[e+0]=i,this.array[e+1]=s,this}setXYZ(e,i,s,l){return e*=this.itemSize,this.normalized&&(i=ni(i,this.array),s=ni(s,this.array),l=ni(l,this.array)),this.array[e+0]=i,this.array[e+1]=s,this.array[e+2]=l,this}setXYZW(e,i,s,l,f){return e*=this.itemSize,this.normalized&&(i=ni(i,this.array),s=ni(s,this.array),l=ni(l,this.array),f=ni(f,this.array)),this.array[e+0]=i,this.array[e+1]=s,this.array[e+2]=l,this.array[e+3]=f,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){const e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return e.name=this.name,e.usage=this.usage,e.gpuType=this.gpuType,e}dispose(){this.dispatchEvent({type:"dispose"})}}class dS extends Ga{constructor(e,i,s){super(new Uint16Array(e),i,s)}}class pS extends Ga{constructor(e,i,s){super(new Uint32Array(e),i,s)}}class un extends Ga{constructor(e,i,s){super(new Float32Array(e),i,s)}}const TT=new Ll,_l=new nt,Yd=new nt;class Wc{constructor(e=new nt,i=-1){this.isSphere=!0,this.center=e,this.radius=i}set(e,i){return this.center.copy(e),this.radius=i,this}setFromPoints(e,i){const s=this.center;i!==void 0?s.copy(i):TT.setFromPoints(e).getCenter(s);let l=0;for(let f=0,h=e.length;f<h;f++)l=Math.max(l,s.distanceToSquared(e[f]));return this.radius=Math.sqrt(l),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){const i=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=i*i}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,i){const s=this.center.distanceToSquared(e);return i.copy(e),s>this.radius*this.radius&&(i.sub(this.center).normalize(),i.multiplyScalar(this.radius).add(this.center)),i}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius=this.radius*e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;_l.subVectors(e,this.center);const i=_l.lengthSq();if(i>this.radius*this.radius){const s=Math.sqrt(i),l=(s-this.radius)*.5;this.center.addScaledVector(_l,l/s),this.radius+=l}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(Yd.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(_l.copy(e.center).add(Yd)),this.expandByPoint(_l.copy(e.center).sub(Yd))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return{radius:this.radius,center:this.center.toArray()}}fromJSON(e){return this.radius=e.radius,this.center.fromArray(e.center),this}}let bT=0;const Ni=new ln,qd=new Dn,no=new nt,gi=new Ll,vl=new Ll,wn=new nt;class Kn extends bs{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:bT++}),this.uuid=Ul(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.indirectOffset=0,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={},this._transformed=!1}getIndex(){return this.index}setIndex(e){return Array.isArray(e)?this.index=new(iT(e)?pS:dS)(e,1):this.index=e,this}setIndirect(e,i=0){return this.indirect=e,this.indirectOffset=i,this}getIndirect(){return this.indirect}getAttribute(e){return this.attributes[e]}setAttribute(e,i){return this.attributes[e]=i,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,i,s=0){this.groups.push({start:e,count:i,materialIndex:s})}clearGroups(){this.groups=[]}setDrawRange(e,i){this.drawRange.start=e,this.drawRange.count=i}applyMatrix4(e){const i=this.attributes.position;i!==void 0&&(i.applyMatrix4(e),i.needsUpdate=!0);const s=this.attributes.normal;if(s!==void 0){const f=new de().getNormalMatrix(e);s.applyNormalMatrix(f),s.needsUpdate=!0}const l=this.attributes.tangent;return l!==void 0&&(l.transformDirection(e),l.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this._transformed=!0,this}applyQuaternion(e){return Ni.makeRotationFromQuaternion(e),this.applyMatrix4(Ni),this}rotateX(e){return Ni.makeRotationX(e),this.applyMatrix4(Ni),this}rotateY(e){return Ni.makeRotationY(e),this.applyMatrix4(Ni),this}rotateZ(e){return Ni.makeRotationZ(e),this.applyMatrix4(Ni),this}translate(e,i,s){return Ni.makeTranslation(e,i,s),this.applyMatrix4(Ni),this}scale(e,i,s){return Ni.makeScale(e,i,s),this.applyMatrix4(Ni),this}lookAt(e){return qd.lookAt(e),qd.updateMatrix(),this.applyMatrix4(qd.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(no).negate(),this.translate(no.x,no.y,no.z),this}setFromPoints(e){const i=this.getAttribute("position");if(i===void 0){const s=[];for(let l=0,f=e.length;l<f;l++){const h=e[l];s.push(h.x,h.y,h.z||0)}this.setAttribute("position",new un(s,3))}else{const s=Math.min(e.length,i.count);for(let l=0;l<s;l++){const f=e[l];i.setXYZ(l,f.x,f.y,f.z||0)}e.length>i.count&&oe("BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),i.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new Ll);const e=this.attributes.position,i=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){Fe("BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new nt(-1/0,-1/0,-1/0),new nt(1/0,1/0,1/0));return}if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),i)for(let s=0,l=i.length;s<l;s++){const f=i[s];gi.setFromBufferAttribute(f),this.morphTargetsRelative?(wn.addVectors(this.boundingBox.min,gi.min),this.boundingBox.expandByPoint(wn),wn.addVectors(this.boundingBox.max,gi.max),this.boundingBox.expandByPoint(wn)):(this.boundingBox.expandByPoint(gi.min),this.boundingBox.expandByPoint(gi.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&Fe('BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new Wc);const e=this.attributes.position,i=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){Fe("BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new nt,1/0);return}if(e){const s=this.boundingSphere.center;if(gi.setFromBufferAttribute(e),i)for(let f=0,h=i.length;f<h;f++){const d=i[f];vl.setFromBufferAttribute(d),this.morphTargetsRelative?(wn.addVectors(gi.min,vl.min),gi.expandByPoint(wn),wn.addVectors(gi.max,vl.max),gi.expandByPoint(wn)):(gi.expandByPoint(vl.min),gi.expandByPoint(vl.max))}gi.getCenter(s);let l=0;for(let f=0,h=e.count;f<h;f++)wn.fromBufferAttribute(e,f),l=Math.max(l,s.distanceToSquared(wn));if(i)for(let f=0,h=i.length;f<h;f++){const d=i[f],m=this.morphTargetsRelative;for(let p=0,x=d.count;p<x;p++)wn.fromBufferAttribute(d,p),m&&(no.fromBufferAttribute(e,p),wn.add(no)),l=Math.max(l,s.distanceToSquared(wn))}this.boundingSphere.radius=Math.sqrt(l),isNaN(this.boundingSphere.radius)&&Fe('BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){const e=this.index,i=this.attributes;if(e===null||i.position===void 0||i.normal===void 0||i.uv===void 0){Fe("BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}const s=i.position,l=i.normal,f=i.uv;let h=this.getAttribute("tangent");(h===void 0||h.count!==s.count)&&(h=new Ga(new Float32Array(4*s.count),4),this.setAttribute("tangent",h));const d=[],m=[];for(let T=0;T<s.count;T++)d[T]=new nt,m[T]=new nt;const p=new nt,x=new nt,_=new nt,v=new le,M=new le,R=new le,w=new nt,y=new nt;function S(T,U,F){p.fromBufferAttribute(s,T),x.fromBufferAttribute(s,U),_.fromBufferAttribute(s,F),v.fromBufferAttribute(f,T),M.fromBufferAttribute(f,U),R.fromBufferAttribute(f,F),x.sub(p),_.sub(p),M.sub(v),R.sub(v);const V=1/(M.x*R.y-R.x*M.y);isFinite(V)&&(w.copy(x).multiplyScalar(R.y).addScaledVector(_,-M.y).multiplyScalar(V),y.copy(_).multiplyScalar(M.x).addScaledVector(x,-R.x).multiplyScalar(V),d[T].add(w),d[U].add(w),d[F].add(w),m[T].add(y),m[U].add(y),m[F].add(y))}let O=this.groups;O.length===0&&(O=[{start:0,count:e.count}]);for(let T=0,U=O.length;T<U;++T){const F=O[T],V=F.start,Q=F.count;for(let st=V,Y=V+Q;st<Y;st+=3)S(e.getX(st+0),e.getX(st+1),e.getX(st+2))}const G=new nt,C=new nt,D=new nt,N=new nt;function P(T){D.fromBufferAttribute(l,T),N.copy(D);const U=d[T];G.copy(U),G.sub(D.multiplyScalar(D.dot(U))).normalize(),C.crossVectors(N,U);const V=C.dot(m[T])<0?-1:1;h.setXYZW(T,G.x,G.y,G.z,V)}for(let T=0,U=O.length;T<U;++T){const F=O[T],V=F.start,Q=F.count;for(let st=V,Y=V+Q;st<Y;st+=3)P(e.getX(st+0)),P(e.getX(st+1)),P(e.getX(st+2))}this._transformed=!0}computeVertexNormals(){const e=this.index,i=this.getAttribute("position");if(i!==void 0){let s=this.getAttribute("normal");if(s===void 0||s.count!==i.count)s=new Ga(new Float32Array(i.count*3),3),this.setAttribute("normal",s);else for(let v=0,M=s.count;v<M;v++)s.setXYZ(v,0,0,0);const l=new nt,f=new nt,h=new nt,d=new nt,m=new nt,p=new nt,x=new nt,_=new nt;if(e)for(let v=0,M=e.count;v<M;v+=3){const R=e.getX(v+0),w=e.getX(v+1),y=e.getX(v+2);l.fromBufferAttribute(i,R),f.fromBufferAttribute(i,w),h.fromBufferAttribute(i,y),x.subVectors(h,f),_.subVectors(l,f),x.cross(_),d.fromBufferAttribute(s,R),m.fromBufferAttribute(s,w),p.fromBufferAttribute(s,y),d.add(x),m.add(x),p.add(x),s.setXYZ(R,d.x,d.y,d.z),s.setXYZ(w,m.x,m.y,m.z),s.setXYZ(y,p.x,p.y,p.z)}else for(let v=0,M=i.count;v<M;v+=3)l.fromBufferAttribute(i,v+0),f.fromBufferAttribute(i,v+1),h.fromBufferAttribute(i,v+2),x.subVectors(h,f),_.subVectors(l,f),x.cross(_),s.setXYZ(v+0,x.x,x.y,x.z),s.setXYZ(v+1,x.x,x.y,x.z),s.setXYZ(v+2,x.x,x.y,x.z);this.normalizeNormals(),s.needsUpdate=!0}}normalizeNormals(){const e=this.attributes.normal;for(let i=0,s=e.count;i<s;i++)wn.fromBufferAttribute(e,i),wn.normalize(),e.setXYZ(i,wn.x,wn.y,wn.z)}toNonIndexed(){function e(d,m){const p=d.array,x=d.itemSize,_=d.normalized,v=new p.constructor(m.length*x);let M=0,R=0;for(let w=0,y=m.length;w<y;w++){d.isInterleavedBufferAttribute?M=m[w]*d.data.stride+d.offset:M=m[w]*x;for(let S=0;S<x;S++)v[R++]=p[M++]}return new Ga(v,x,_)}if(this.index===null)return oe("BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;const i=new Kn,s=this.index.array,l=this.attributes;for(const d in l){const m=l[d],p=e(m,s);i.setAttribute(d,p)}const f=this.morphAttributes;for(const d in f){const m=[],p=f[d];for(let x=0,_=p.length;x<_;x++){const v=p[x],M=e(v,s);m.push(M)}i.morphAttributes[d]=m}i.morphTargetsRelative=this.morphTargetsRelative;const h=this.groups;for(let d=0,m=h.length;d<m;d++){const p=h[d];i.addGroup(p.start,p.count,p.materialIndex)}return i}toJSON(){const e={metadata:{version:4.7,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(e.uuid=this.uuid,e.type=this.parameters!==void 0&&this._transformed===!0?"BufferGeometry":this.type,e.name=this.name,Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0&&this._transformed!==!0){const m=this.parameters;for(const p in m)m[p]!==void 0&&(e[p]=m[p]);return e}e.data={attributes:{}};const i=this.index;i!==null&&(e.data.index={type:i.array.constructor.name,array:Array.prototype.slice.call(i.array)});const s=this.attributes;for(const m in s){const p=s[m];e.data.attributes[m]=p.toJSON(e.data)}const l={};let f=!1;for(const m in this.morphAttributes){const p=this.morphAttributes[m],x=[];for(let _=0,v=p.length;_<v;_++){const M=p[_];x.push(M.toJSON(e.data))}x.length>0&&(l[m]=x,f=!0)}f&&(e.data.morphAttributes=l,e.data.morphTargetsRelative=this.morphTargetsRelative);const h=this.groups;h.length>0&&(e.data.groups=JSON.parse(JSON.stringify(h)));const d=this.boundingSphere;return d!==null&&(e.data.boundingSphere=d.toJSON()),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;const i={};this.name=e.name;const s=e.index;s!==null&&this.setIndex(s.clone());const l=e.attributes;for(const p in l){const x=l[p];this.setAttribute(p,x.clone(i))}const f=e.morphAttributes;for(const p in f){const x=[],_=f[p];for(let v=0,M=_.length;v<M;v++)x.push(_[v].clone(i));this.morphAttributes[p]=x}this.morphTargetsRelative=e.morphTargetsRelative;const h=e.groups;for(let p=0,x=h.length;p<x;p++){const _=h[p];this.addGroup(_.start,_.count,_.materialIndex)}const d=e.boundingBox;d!==null&&(this.boundingBox=d.clone());const m=e.boundingSphere;return m!==null&&(this.boundingSphere=m.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,this._transformed=e._transformed,this}dispose(){this.dispatchEvent({type:"dispose"})}}const Zd=new nt,AT=new nt,RT=new de;class za{constructor(e=new nt(1,0,0),i=0){this.isPlane=!0,this.normal=e,this.constant=i}set(e,i){return this.normal.copy(e),this.constant=i,this}setComponents(e,i,s,l){return this.normal.set(e,i,s),this.constant=l,this}setFromNormalAndCoplanarPoint(e,i){return this.normal.copy(e),this.constant=-i.dot(this.normal),this}setFromCoplanarPoints(e,i,s){const l=Zd.subVectors(s,i).cross(AT.subVectors(e,i)).normalize();return this.setFromNormalAndCoplanarPoint(l,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){const e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,i){return i.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,i,s=!0){const l=e.delta(Zd),f=this.normal.dot(l);if(f===0)return this.distanceToPoint(e.start)===0?i.copy(e.start):null;const h=-(e.start.dot(this.normal)+this.constant)/f;return s===!0&&(h<0||h>1)?null:i.copy(e.start).addScaledVector(l,h)}intersectsLine(e){const i=this.distanceToPoint(e.start),s=this.distanceToPoint(e.end);return i<0&&s>0||s<0&&i>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,i){const s=i||RT.getNormalMatrix(e),l=this.coplanarPoint(Zd).applyMatrix4(e),f=this.normal.applyMatrix3(s).normalize();return this.constant=-l.dot(f),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}toJSON(){return{normal:this.normal.toArray(),constant:this.constant}}fromJSON(e){return this.normal.fromArray(e.normal),this.constant=e.constant,this}}let CT=0;class go extends bs{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:CT++}),this.uuid=Ul(),this.name="",this.type="Material",this.blending=bl,this.side=nr,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=Wx,this.blendDst=Yx,this.blendEquation=ro,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new Me(0,0,0),this.blendAlpha=0,this.depthFunc=Rl,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=jE,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=wd,this.stencilZFail=wd,this.stencilZPass=wd,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(const i in e){const s=e[i];if(s===void 0){oe(`Material: parameter '${i}' has value of undefined.`);continue}const l=this[i];if(l===void 0){oe(`Material: '${i}' is not a property of THREE.${this.type}.`);continue}l&&l.isColor?l.set(s):l&&l.isVector2&&s&&s.isVector2||l&&l.isEuler&&s&&s.isEuler||l&&l.isVector3&&s&&s.isVector3?l.copy(s):this[i]=s}}toJSON(e){const i=e===void 0||typeof e=="string";i&&(e={textures:{},images:{}});const s={metadata:{version:4.7,type:"Material",generator:"Material.toJSON"}};s.uuid=this.uuid,s.type=this.type,s.blending=this.blending,s.side=this.side,s.shadowSide=this.shadowSide,s.vertexColors=this.vertexColors,s.opacity=this.opacity,s.transparent=this.transparent,s.blendSrc=this.blendSrc,s.blendDst=this.blendDst,s.blendEquation=this.blendEquation,s.blendSrcAlpha=this.blendSrcAlpha,s.blendDstAlpha=this.blendDstAlpha,s.blendEquationAlpha=this.blendEquationAlpha,s.blendColor=this.blendColor.getHex(),s.blendAlpha=this.blendAlpha,s.depthFunc=this.depthFunc,s.depthTest=this.depthTest,s.depthWrite=this.depthWrite,s.colorWrite=this.colorWrite,s.clipIntersection=this.clipIntersection,s.clipShadows=this.clipShadows,s.stencilWriteMask=this.stencilWriteMask,s.stencilFunc=this.stencilFunc,s.stencilRef=this.stencilRef,s.stencilFuncMask=this.stencilFuncMask,s.stencilFail=this.stencilFail,s.stencilZFail=this.stencilZFail,s.stencilZPass=this.stencilZPass,s.stencilWrite=this.stencilWrite,s.polygonOffset=this.polygonOffset,s.polygonOffsetFactor=this.polygonOffsetFactor,s.polygonOffsetUnits=this.polygonOffsetUnits,s.dithering=this.dithering,s.alphaTest=this.alphaTest,s.alphaHash=this.alphaHash,s.alphaToCoverage=this.alphaToCoverage,s.premultipliedAlpha=this.premultipliedAlpha,s.forceSinglePass=this.forceSinglePass,s.allowOverride=this.allowOverride,s.visible=this.visible,s.toneMapped=this.toneMapped,s.name=this.name,this.color&&this.color.isColor&&(s.color=this.color.getHex()),this.roughness!==void 0&&(s.roughness=this.roughness),this.metalness!==void 0&&(s.metalness=this.metalness),this.sheen!==void 0&&(s.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(s.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(s.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(s.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&(s.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(s.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(s.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(s.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(s.shininess=this.shininess),this.clearcoat!==void 0&&(s.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(s.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(s.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(s.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(s.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,s.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.sheenColorMap&&this.sheenColorMap.isTexture&&(s.sheenColorMap=this.sheenColorMap.toJSON(e).uuid),this.sheenRoughnessMap&&this.sheenRoughnessMap.isTexture&&(s.sheenRoughnessMap=this.sheenRoughnessMap.toJSON(e).uuid),this.dispersion!==void 0&&(s.dispersion=this.dispersion),this.retroreflectivity!==void 0&&(s.retroreflectivity=this.retroreflectivity),this.iridescence!==void 0&&(s.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(s.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(s.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(s.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(s.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.anisotropy!==void 0&&(s.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(s.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(s.anisotropyMap=this.anisotropyMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(s.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(s.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(s.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(s.lightMap=this.lightMap.toJSON(e).uuid,s.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(s.aoMap=this.aoMap.toJSON(e).uuid,s.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(s.bumpMap=this.bumpMap.toJSON(e).uuid,s.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(s.normalMap=this.normalMap.toJSON(e).uuid,s.normalMapType=this.normalMapType,s.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(s.displacementMap=this.displacementMap.toJSON(e).uuid,s.displacementScale=this.displacementScale,s.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(s.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(s.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(s.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(s.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(s.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(s.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(s.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(s.combine=this.combine)),this.envMapRotation!==void 0&&(s.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(s.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(s.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(s.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(s.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(s.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(s.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(s.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(s.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&(s.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(s.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(s.size=this.size),this.sizeAttenuation!==void 0&&(s.sizeAttenuation=this.sizeAttenuation),Array.isArray(this.clippingPlanes)&&this.clippingPlanes.length>0&&(s.clippingPlanes=this.clippingPlanes.map(f=>f.toJSON())),this.rotation!==void 0&&(s.rotation=this.rotation),this.depthPacking!==void 0&&(s.depthPacking=this.depthPacking),this.linewidth!==void 0&&(s.linewidth=this.linewidth),this.linecap!==void 0&&(s.linecap=this.linecap),this.linejoin!==void 0&&(s.linejoin=this.linejoin),this.dashSize!==void 0&&(s.dashSize=this.dashSize),this.gapSize!==void 0&&(s.gapSize=this.gapSize),this.scale!==void 0&&(s.scale=this.scale),this.wireframe!==void 0&&(s.wireframe=this.wireframe),this.wireframeLinewidth!==void 0&&(s.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!==void 0&&(s.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!==void 0&&(s.wireframeLinejoin=this.wireframeLinejoin),this.flatShading!==void 0&&(s.flatShading=this.flatShading),this.fog!==void 0&&(s.fog=this.fog),Object.keys(this.userData).length>0&&(s.userData=this.userData);function l(f){const h=[];for(const d in f){const m=f[d];delete m.metadata,h.push(m)}return h}if(i){const f=l(e.textures),h=l(e.images);f.length>0&&(s.textures=f),h.length>0&&(s.images=h)}return s}fromJSON(e,i){if(e.uuid!==void 0&&(this.uuid=e.uuid),e.name!==void 0&&(this.name=e.name),e.color!==void 0&&this.color!==void 0&&this.color.setHex(e.color),e.roughness!==void 0&&(this.roughness=e.roughness),e.metalness!==void 0&&(this.metalness=e.metalness),e.sheen!==void 0&&(this.sheen=e.sheen),e.sheenColor!==void 0&&(this.sheenColor=new Me().setHex(e.sheenColor)),e.sheenRoughness!==void 0&&(this.sheenRoughness=e.sheenRoughness),e.emissive!==void 0&&this.emissive!==void 0&&this.emissive.setHex(e.emissive),e.specular!==void 0&&this.specular!==void 0&&this.specular.setHex(e.specular),e.specularIntensity!==void 0&&(this.specularIntensity=e.specularIntensity),e.specularColor!==void 0&&this.specularColor!==void 0&&this.specularColor.setHex(e.specularColor),e.shininess!==void 0&&(this.shininess=e.shininess),e.clearcoat!==void 0&&(this.clearcoat=e.clearcoat),e.clearcoatRoughness!==void 0&&(this.clearcoatRoughness=e.clearcoatRoughness),e.dispersion!==void 0&&(this.dispersion=e.dispersion),e.retroreflectivity!==void 0&&(this.retroreflectivity=e.retroreflectivity),e.iridescence!==void 0&&(this.iridescence=e.iridescence),e.iridescenceIOR!==void 0&&(this.iridescenceIOR=e.iridescenceIOR),e.iridescenceThicknessRange!==void 0&&(this.iridescenceThicknessRange=e.iridescenceThicknessRange),e.transmission!==void 0&&(this.transmission=e.transmission),e.thickness!==void 0&&(this.thickness=e.thickness),e.attenuationDistance!==void 0&&(this.attenuationDistance=e.attenuationDistance),e.attenuationColor!==void 0&&this.attenuationColor!==void 0&&this.attenuationColor.setHex(e.attenuationColor),e.anisotropy!==void 0&&(this.anisotropy=e.anisotropy),e.anisotropyRotation!==void 0&&(this.anisotropyRotation=e.anisotropyRotation),e.fog!==void 0&&(this.fog=e.fog),e.flatShading!==void 0&&(this.flatShading=e.flatShading),e.blending!==void 0&&(this.blending=e.blending),e.combine!==void 0&&(this.combine=e.combine),e.side!==void 0&&(this.side=e.side),e.shadowSide!==void 0&&(this.shadowSide=e.shadowSide),e.opacity!==void 0&&(this.opacity=e.opacity),e.transparent!==void 0&&(this.transparent=e.transparent),e.alphaTest!==void 0&&(this.alphaTest=e.alphaTest),e.alphaHash!==void 0&&(this.alphaHash=e.alphaHash),e.depthFunc!==void 0&&(this.depthFunc=e.depthFunc),e.depthTest!==void 0&&(this.depthTest=e.depthTest),e.depthWrite!==void 0&&(this.depthWrite=e.depthWrite),e.colorWrite!==void 0&&(this.colorWrite=e.colorWrite),e.clippingPlanes!==void 0&&(this.clippingPlanes=e.clippingPlanes.map(s=>new za().fromJSON(s))),e.clipIntersection!==void 0&&(this.clipIntersection=e.clipIntersection),e.clipShadows!==void 0&&(this.clipShadows=e.clipShadows),e.depthPacking!==void 0&&(this.depthPacking=e.depthPacking),e.blendSrc!==void 0&&(this.blendSrc=e.blendSrc),e.blendDst!==void 0&&(this.blendDst=e.blendDst),e.blendEquation!==void 0&&(this.blendEquation=e.blendEquation),e.blendSrcAlpha!==void 0&&(this.blendSrcAlpha=e.blendSrcAlpha),e.blendDstAlpha!==void 0&&(this.blendDstAlpha=e.blendDstAlpha),e.blendEquationAlpha!==void 0&&(this.blendEquationAlpha=e.blendEquationAlpha),e.blendColor!==void 0&&this.blendColor!==void 0&&this.blendColor.setHex(e.blendColor),e.blendAlpha!==void 0&&(this.blendAlpha=e.blendAlpha),e.stencilWriteMask!==void 0&&(this.stencilWriteMask=e.stencilWriteMask),e.stencilFunc!==void 0&&(this.stencilFunc=e.stencilFunc),e.stencilRef!==void 0&&(this.stencilRef=e.stencilRef),e.stencilFuncMask!==void 0&&(this.stencilFuncMask=e.stencilFuncMask),e.stencilFail!==void 0&&(this.stencilFail=e.stencilFail),e.stencilZFail!==void 0&&(this.stencilZFail=e.stencilZFail),e.stencilZPass!==void 0&&(this.stencilZPass=e.stencilZPass),e.stencilWrite!==void 0&&(this.stencilWrite=e.stencilWrite),e.wireframe!==void 0&&(this.wireframe=e.wireframe),e.wireframeLinewidth!==void 0&&(this.wireframeLinewidth=e.wireframeLinewidth),e.wireframeLinecap!==void 0&&(this.wireframeLinecap=e.wireframeLinecap),e.wireframeLinejoin!==void 0&&(this.wireframeLinejoin=e.wireframeLinejoin),e.rotation!==void 0&&(this.rotation=e.rotation),e.linewidth!==void 0&&(this.linewidth=e.linewidth),e.linecap!==void 0&&(this.linecap=e.linecap),e.linejoin!==void 0&&(this.linejoin=e.linejoin),e.dashSize!==void 0&&(this.dashSize=e.dashSize),e.gapSize!==void 0&&(this.gapSize=e.gapSize),e.scale!==void 0&&(this.scale=e.scale),e.polygonOffset!==void 0&&(this.polygonOffset=e.polygonOffset),e.polygonOffsetFactor!==void 0&&(this.polygonOffsetFactor=e.polygonOffsetFactor),e.polygonOffsetUnits!==void 0&&(this.polygonOffsetUnits=e.polygonOffsetUnits),e.dithering!==void 0&&(this.dithering=e.dithering),e.alphaToCoverage!==void 0&&(this.alphaToCoverage=e.alphaToCoverage),e.premultipliedAlpha!==void 0&&(this.premultipliedAlpha=e.premultipliedAlpha),e.forceSinglePass!==void 0&&(this.forceSinglePass=e.forceSinglePass),e.allowOverride!==void 0&&(this.allowOverride=e.allowOverride),e.visible!==void 0&&(this.visible=e.visible),e.toneMapped!==void 0&&(this.toneMapped=e.toneMapped),e.userData!==void 0&&(this.userData=e.userData),e.vertexColors!==void 0&&(typeof e.vertexColors=="number"?this.vertexColors=e.vertexColors>0:this.vertexColors=e.vertexColors),e.size!==void 0&&(this.size=e.size),e.sizeAttenuation!==void 0&&(this.sizeAttenuation=e.sizeAttenuation),e.map!==void 0&&(this.map=i[e.map]||null),e.matcap!==void 0&&(this.matcap=i[e.matcap]||null),e.alphaMap!==void 0&&(this.alphaMap=i[e.alphaMap]||null),e.bumpMap!==void 0&&(this.bumpMap=i[e.bumpMap]||null),e.bumpScale!==void 0&&(this.bumpScale=e.bumpScale),e.normalMap!==void 0&&(this.normalMap=i[e.normalMap]||null),e.normalMapType!==void 0&&(this.normalMapType=e.normalMapType),e.normalScale!==void 0){let s=e.normalScale;Array.isArray(s)===!1&&(s=[s,s]),this.normalScale=new le().fromArray(s)}return e.displacementMap!==void 0&&(this.displacementMap=i[e.displacementMap]||null),e.displacementScale!==void 0&&(this.displacementScale=e.displacementScale),e.displacementBias!==void 0&&(this.displacementBias=e.displacementBias),e.roughnessMap!==void 0&&(this.roughnessMap=i[e.roughnessMap]||null),e.metalnessMap!==void 0&&(this.metalnessMap=i[e.metalnessMap]||null),e.emissiveMap!==void 0&&(this.emissiveMap=i[e.emissiveMap]||null),e.emissiveIntensity!==void 0&&(this.emissiveIntensity=e.emissiveIntensity),e.specularMap!==void 0&&(this.specularMap=i[e.specularMap]||null),e.specularIntensityMap!==void 0&&(this.specularIntensityMap=i[e.specularIntensityMap]||null),e.specularColorMap!==void 0&&(this.specularColorMap=i[e.specularColorMap]||null),e.envMap!==void 0&&(this.envMap=i[e.envMap]||null),e.envMapRotation!==void 0&&this.envMapRotation.fromArray(e.envMapRotation),e.envMapIntensity!==void 0&&(this.envMapIntensity=e.envMapIntensity),e.reflectivity!==void 0&&(this.reflectivity=e.reflectivity),e.refractionRatio!==void 0&&(this.refractionRatio=e.refractionRatio),e.lightMap!==void 0&&(this.lightMap=i[e.lightMap]||null),e.lightMapIntensity!==void 0&&(this.lightMapIntensity=e.lightMapIntensity),e.aoMap!==void 0&&(this.aoMap=i[e.aoMap]||null),e.aoMapIntensity!==void 0&&(this.aoMapIntensity=e.aoMapIntensity),e.gradientMap!==void 0&&(this.gradientMap=i[e.gradientMap]||null),e.clearcoatMap!==void 0&&(this.clearcoatMap=i[e.clearcoatMap]||null),e.clearcoatRoughnessMap!==void 0&&(this.clearcoatRoughnessMap=i[e.clearcoatRoughnessMap]||null),e.clearcoatNormalMap!==void 0&&(this.clearcoatNormalMap=i[e.clearcoatNormalMap]||null),e.clearcoatNormalScale!==void 0&&(this.clearcoatNormalScale=new le().fromArray(e.clearcoatNormalScale)),e.iridescenceMap!==void 0&&(this.iridescenceMap=i[e.iridescenceMap]||null),e.iridescenceThicknessMap!==void 0&&(this.iridescenceThicknessMap=i[e.iridescenceThicknessMap]||null),e.transmissionMap!==void 0&&(this.transmissionMap=i[e.transmissionMap]||null),e.thicknessMap!==void 0&&(this.thicknessMap=i[e.thicknessMap]||null),e.anisotropyMap!==void 0&&(this.anisotropyMap=i[e.anisotropyMap]||null),e.sheenColorMap!==void 0&&(this.sheenColorMap=i[e.sheenColorMap]||null),e.sheenRoughnessMap!==void 0&&(this.sheenRoughnessMap=i[e.sheenRoughnessMap]||null),this}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.blendColor.copy(e.blendColor),this.blendAlpha=e.blendAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;const i=e.clippingPlanes;let s=null;if(i!==null){const l=i.length;s=new Array(l);for(let f=0;f!==l;++f)s[f]=i[f].clone()}return this.clippingPlanes=s,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaHash=e.alphaHash,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.allowOverride=e.allowOverride,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(e){e===!0&&this.version++}}const Ia=new nt,jd=new nt,cc=new nt,fc=new nt;class fm{constructor(e=new nt,i=new nt(0,0,-1)){this.origin=e,this.direction=i}set(e,i){return this.origin.copy(e),this.direction.copy(i),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,i){return i.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,Ia)),this}closestPointToPoint(e,i){i.subVectors(e,this.origin);const s=i.dot(this.direction);return s<0?i.copy(this.origin):i.copy(this.origin).addScaledVector(this.direction,s)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){const i=Ia.subVectors(e,this.origin).dot(this.direction);return i<0?this.origin.distanceToSquared(e):(Ia.copy(this.origin).addScaledVector(this.direction,i),Ia.distanceToSquared(e))}distanceSqToSegment(e,i,s,l){jd.copy(e).add(i).multiplyScalar(.5),cc.copy(i).sub(e).normalize(),fc.copy(this.origin).sub(jd);const f=e.distanceTo(i)*.5,h=-this.direction.dot(cc),d=fc.dot(this.direction),m=-fc.dot(cc),p=fc.lengthSq(),x=Math.abs(1-h*h);let _,v,M,R;if(x>0)if(_=h*m-d,v=h*d-m,R=f*x,_>=0)if(v>=-R)if(v<=R){const w=1/x;_*=w,v*=w,M=_*(_+h*v+2*d)+v*(h*_+v+2*m)+p}else v=f,_=Math.max(0,-(h*v+d)),M=-_*_+v*(v+2*m)+p;else v=-f,_=Math.max(0,-(h*v+d)),M=-_*_+v*(v+2*m)+p;else v<=-R?(_=Math.max(0,-(-h*f+d)),v=_>0?-f:Math.min(Math.max(-f,-m),f),M=-_*_+v*(v+2*m)+p):v<=R?(_=0,v=Math.min(Math.max(-f,-m),f),M=v*(v+2*m)+p):(_=Math.max(0,-(h*f+d)),v=_>0?f:Math.min(Math.max(-f,-m),f),M=-_*_+v*(v+2*m)+p);else v=h>0?-f:f,_=Math.max(0,-(h*v+d)),M=-_*_+v*(v+2*m)+p;return s&&s.copy(this.origin).addScaledVector(this.direction,_),l&&l.copy(jd).addScaledVector(cc,v),M}intersectSphere(e,i){if(e.radius<0)return null;Ia.subVectors(e.center,this.origin);const s=Ia.dot(this.direction),l=Ia.dot(Ia)-s*s,f=e.radius*e.radius;if(l>f)return null;const h=Math.sqrt(f-l),d=s-h,m=s+h;return m<0?null:d<0?this.at(m,i):this.at(d,i)}intersectsSphere(e){return e.radius<0?!1:this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){const i=e.normal.dot(this.direction);if(i===0)return e.distanceToPoint(this.origin)===0?0:null;const s=-(this.origin.dot(e.normal)+e.constant)/i;return s>=0?s:null}intersectPlane(e,i){const s=this.distanceToPlane(e);return s===null?null:this.at(s,i)}intersectsPlane(e){const i=e.distanceToPoint(this.origin);return i===0||e.normal.dot(this.direction)*i<0}intersectBox(e,i){let s,l,f,h,d,m;const p=1/this.direction.x,x=1/this.direction.y,_=1/this.direction.z,v=this.origin;return p>=0?(s=(e.min.x-v.x)*p,l=(e.max.x-v.x)*p):(s=(e.max.x-v.x)*p,l=(e.min.x-v.x)*p),x>=0?(f=(e.min.y-v.y)*x,h=(e.max.y-v.y)*x):(f=(e.max.y-v.y)*x,h=(e.min.y-v.y)*x),s>h||f>l||((f>s||isNaN(s))&&(s=f),(h<l||isNaN(l))&&(l=h),_>=0?(d=(e.min.z-v.z)*_,m=(e.max.z-v.z)*_):(d=(e.max.z-v.z)*_,m=(e.min.z-v.z)*_),s>m||d>l)||((d>s||s!==s)&&(s=d),(m<l||l!==l)&&(l=m),l<0)?null:this.at(s>=0?s:l,i)}intersectsBox(e){return this.intersectBox(e,Ia)!==null}intersectTriangle(e,i,s,l,f){const h=this.origin,d=this.direction,m=d.x,p=d.y,x=d.z,_=e.x-h.x,v=e.y-h.y,M=e.z-h.z,R=i.x-h.x,w=i.y-h.y,y=i.z-h.z,S=s.x-h.x,O=s.y-h.y,G=s.z-h.z,C=Math.abs(m),D=Math.abs(p),N=Math.abs(x);let P,T,U,F,V,Q,st,Y,tt,W,q,dt;if(C>=D&&C>=N?(U=m,Q=_,tt=R,dt=S,m>=0?(P=p,T=x,F=v,V=M,st=w,Y=y,W=O,q=G):(P=x,T=p,F=M,V=v,st=y,Y=w,W=G,q=O)):D>=N?(U=p,Q=v,tt=w,dt=O,p>=0?(P=x,T=m,F=M,V=_,st=y,Y=R,W=G,q=S):(P=m,T=x,F=_,V=M,st=R,Y=y,W=S,q=G)):(U=x,Q=M,tt=y,dt=G,x>=0?(P=m,T=p,F=_,V=v,st=R,Y=w,W=S,q=O):(P=p,T=m,F=v,V=_,st=w,Y=R,W=O,q=S)),U===0)return null;const ct=P/U,rt=T/U,bt=1/U,Gt=F-ct*Q,Ot=V-rt*Q,z=st-ct*tt,_t=Y-rt*tt,Nt=W-ct*dt,Z=q-rt*dt,ft=Nt*_t-Z*z,wt=Gt*Z-Ot*Nt,Pt=z*Ot-_t*Gt;if(l){if(ft<0||wt<0||Pt<0)return null}else if((ft<0||wt<0||Pt<0)&&(ft>0||wt>0||Pt>0))return null;const vt=ft+wt+Pt;if(vt===0)return null;const Ut=bt*(ft*Q+wt*tt+Pt*dt);return(vt>0?Ut<0:Ut>0)?null:this.at(Ut/vt,f)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}}class hm extends go{constructor(e){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new Me(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Ts,this.combine=qx,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}}const ax=new ln,Qs=new fm,hc=new Wc,sx=new nt,dc=new nt,pc=new nt,mc=new nt,Kd=new nt,gc=new nt,rx=new nt,_c=new nt;class ze extends Dn{constructor(e=new Kn,i=new hm){super(),this.isMesh=!0,this.type="Mesh",this.geometry=e,this.material=i,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.count=1,this.updateMorphTargets()}copy(e,i){return super.copy(e,i),e.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=e.morphTargetInfluences.slice()),e.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary)),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}updateMorphTargets(){const i=this.geometry.morphAttributes,s=Object.keys(i);if(s.length>0){const l=i[s[0]];if(l!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let f=0,h=l.length;f<h;f++){const d=l[f].name||String(f);this.morphTargetInfluences.push(0),this.morphTargetDictionary[d]=f}}}}getVertexPosition(e,i){const s=this.geometry,l=s.attributes.position,f=s.morphAttributes.position,h=s.morphTargetsRelative;i.fromBufferAttribute(l,e);const d=this.morphTargetInfluences;if(f&&d){gc.set(0,0,0);for(let m=0,p=f.length;m<p;m++){const x=d[m],_=f[m];x!==0&&(Kd.fromBufferAttribute(_,e),h?gc.addScaledVector(Kd,x):gc.addScaledVector(Kd.sub(i),x))}i.add(gc)}return i}intersectsFrustum(e){return e.intersectsObject(this)}raycast(e,i){const s=this.geometry,l=this.material,f=this.matrixWorld;l!==void 0&&(s.boundingSphere===null&&s.computeBoundingSphere(),hc.copy(s.boundingSphere),hc.applyMatrix4(f),Qs.copy(e.ray).recast(e.near),!(hc.containsPoint(Qs.origin)===!1&&(Qs.intersectSphere(hc,sx)===null||Qs.origin.distanceToSquared(sx)>(e.far-e.near)**2))&&(ax.copy(f).invert(),Qs.copy(e.ray).applyMatrix4(ax),!(s.boundingBox!==null&&Qs.intersectsBox(s.boundingBox)===!1)&&this._computeIntersections(e,i,Qs)))}_computeIntersections(e,i,s){let l;const f=this.geometry,h=this.material,d=f.index,m=f.attributes.position,p=f.attributes.uv,x=f.attributes.uv1,_=f.attributes.normal,v=f.groups,M=f.drawRange;if(d!==null)if(Array.isArray(h))for(let R=0,w=v.length;R<w;R++){const y=v[R],S=h[y.materialIndex],O=Math.max(y.start,M.start),G=Math.min(d.count,Math.min(y.start+y.count,M.start+M.count));for(let C=O,D=G;C<D;C+=3){const N=d.getX(C),P=d.getX(C+1),T=d.getX(C+2);l=vc(this,S,e,s,p,x,_,N,P,T),l&&(l.faceIndex=Math.floor(C/3),l.face.materialIndex=y.materialIndex,i.push(l))}}else{const R=Math.max(0,M.start),w=Math.min(d.count,M.start+M.count);for(let y=R,S=w;y<S;y+=3){const O=d.getX(y),G=d.getX(y+1),C=d.getX(y+2);l=vc(this,h,e,s,p,x,_,O,G,C),l&&(l.faceIndex=Math.floor(y/3),i.push(l))}}else if(m!==void 0)if(Array.isArray(h))for(let R=0,w=v.length;R<w;R++){const y=v[R],S=h[y.materialIndex],O=Math.max(y.start,M.start),G=Math.min(m.count,Math.min(y.start+y.count,M.start+M.count));for(let C=O,D=G;C<D;C+=3){const N=C,P=C+1,T=C+2;l=vc(this,S,e,s,p,x,_,N,P,T),l&&(l.faceIndex=Math.floor(C/3),l.face.materialIndex=y.materialIndex,i.push(l))}}else{const R=Math.max(0,M.start),w=Math.min(m.count,M.start+M.count);for(let y=R,S=w;y<S;y+=3){const O=y,G=y+1,C=y+2;l=vc(this,h,e,s,p,x,_,O,G,C),l&&(l.faceIndex=Math.floor(y/3),i.push(l))}}}}function wT(o,e,i,s,l,f,h,d){let m;if(e.side===ai?m=s.intersectTriangle(h,f,l,!0,d):m=s.intersectTriangle(l,f,h,e.side===nr,d),m===null)return null;_c.copy(d),_c.applyMatrix4(o.matrixWorld);const p=i.ray.origin.distanceTo(_c);return p<i.near||p>i.far?null:{distance:p,point:_c.clone(),object:o}}function vc(o,e,i,s,l,f,h,d,m,p){o.getVertexPosition(d,dc),o.getVertexPosition(m,pc),o.getVertexPosition(p,mc);const x=wT(o,e,i,s,dc,pc,mc,rx);if(x){const _=new nt;Oi.getBarycoord(rx,dc,pc,mc,_),l&&(x.uv=Oi.getInterpolatedAttribute(l,d,m,p,_,new le)),f&&(x.uv1=Oi.getInterpolatedAttribute(f,d,m,p,_,new le)),h&&(x.normal=Oi.getInterpolatedAttribute(h,d,m,p,_,new nt),x.normal.dot(s.direction)>0&&x.normal.multiplyScalar(-1));const v={a:d,b:m,c:p,normal:new nt,materialIndex:0};Oi.getNormal(dc,pc,mc,v.normal),x.face=v,x.barycoord=_}return x}class DT extends jn{constructor(e=null,i=1,s=1,l,f,h,d,m,p=zn,x=zn,_,v){super(null,h,d,m,p,x,l,f,_,v),this.isDataTexture=!0,this.image={data:e,width:i,height:s},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}const Js=new Wc,NT=new le(.5,.5),xc=new nt;class dm{constructor(e=new za,i=new za,s=new za,l=new za,f=new za,h=new za){this.planes=[e,i,s,l,f,h]}set(e,i,s,l,f,h){const d=this.planes;return d[0].copy(e),d[1].copy(i),d[2].copy(s),d[3].copy(l),d[4].copy(f),d[5].copy(h),this}copy(e){const i=this.planes;for(let s=0;s<6;s++)i[s].copy(e.planes[s]);return this}setFromProjectionMatrix(e,i=ha,s=!1){const l=this.planes,f=e.elements,h=f[0],d=f[1],m=f[2],p=f[3],x=f[4],_=f[5],v=f[6],M=f[7],R=f[8],w=f[9],y=f[10],S=f[11],O=f[12],G=f[13],C=f[14],D=f[15];if(l[0].setComponents(p-h,M-x,S-R,D-O).normalize(),l[1].setComponents(p+h,M+x,S+R,D+O).normalize(),l[2].setComponents(p+d,M+_,S+w,D+G).normalize(),l[3].setComponents(p-d,M-_,S-w,D-G).normalize(),s)l[4].setComponents(m,v,y,C).normalize(),l[5].setComponents(p-m,M-v,S-y,D-C).normalize();else if(l[4].setComponents(p-m,M-v,S-y,D-C).normalize(),i===ha)l[5].setComponents(p+m,M+v,S+y,D+C).normalize();else if(i===Dl)l[5].setComponents(m,v,y,C).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+i);return this}intersectsObject(e){if(e.boundingSphere!==void 0)e.boundingSphere===null&&e.computeBoundingSphere(),Js.copy(e.boundingSphere).applyMatrix4(e.matrixWorld);else{const i=e.geometry;i.boundingSphere===null&&i.computeBoundingSphere(),Js.copy(i.boundingSphere).applyMatrix4(e.matrixWorld)}return this.intersectsSphere(Js)}intersectsSprite(e){Js.center.set(0,0,0);const i=NT.distanceTo(e.center);return Js.radius=.7071067811865476+i,Js.applyMatrix4(e.matrixWorld),this.intersectsSphere(Js)}intersectsSphere(e){const i=this.planes,s=e.center,l=-e.radius;for(let f=0;f<6;f++)if(i[f].distanceToPoint(s)<l)return!1;return!0}intersectsBox(e){const i=this.planes;for(let s=0;s<6;s++){const l=i[s];if(xc.x=l.normal.x>0?e.max.x:e.min.x,xc.y=l.normal.y>0?e.max.y:e.min.y,xc.z=l.normal.z>0?e.max.z:e.min.z,l.distanceToPoint(xc)<0)return!1}return!0}containsPoint(e){const i=this.planes;for(let s=0;s<6;s++)if(i[s].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}}class pm extends go{constructor(e){super(),this.isLineBasicMaterial=!0,this.type="LineBasicMaterial",this.color=new Me(16777215),this.map=null,this.linewidth=1,this.linecap="round",this.linejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.linewidth=e.linewidth,this.linecap=e.linecap,this.linejoin=e.linejoin,this.fog=e.fog,this}}const Gc=new nt,Vc=new nt,ox=new ln,xl=new fm,Sc=new Wc,Qd=new nt,lx=new nt;class UT extends Dn{constructor(e=new Kn,i=new pm){super(),this.isLine=!0,this.type="Line",this.geometry=e,this.material=i,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(e,i){return super.copy(e,i),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}computeLineDistances(){const e=this.geometry;if(e.index===null){const i=e.attributes.position,s=[0];for(let l=1,f=i.count;l<f;l++)Gc.fromBufferAttribute(i,l-1),Vc.fromBufferAttribute(i,l),s[l]=s[l-1],s[l]+=Gc.distanceTo(Vc);e.setAttribute("lineDistance",new un(s,1))}else oe("Line.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}intersectsFrustum(e){return e.intersectsObject(this)}raycast(e,i){const s=this.geometry,l=this.matrixWorld,f=e.params.Line.threshold,h=s.drawRange;if(s.boundingSphere===null&&s.computeBoundingSphere(),Sc.copy(s.boundingSphere),Sc.applyMatrix4(l),Sc.radius+=f,e.ray.intersectsSphere(Sc)===!1)return;ox.copy(l).invert(),xl.copy(e.ray).applyMatrix4(ox);const d=f/((this.scale.x+this.scale.y+this.scale.z)/3),m=d*d,p=this.isLineSegments?2:1,x=s.index,v=s.attributes.position;if(x!==null){const M=Math.max(0,h.start),R=Math.min(x.count,h.start+h.count);for(let w=M,y=R-1;w<y;w+=p){const S=x.getX(w),O=x.getX(w+1),G=yc(this,e,xl,m,S,O,w);G&&i.push(G)}if(this.isLineLoop){const w=x.getX(R-1),y=x.getX(M),S=yc(this,e,xl,m,w,y,R-1);S&&i.push(S)}}else{const M=Math.max(0,h.start),R=Math.min(v.count,h.start+h.count);for(let w=M,y=R-1;w<y;w+=p){const S=yc(this,e,xl,m,w,w+1,w);S&&i.push(S)}if(this.isLineLoop){const w=yc(this,e,xl,m,R-1,M,R-1);w&&i.push(w)}}}updateMorphTargets(){const i=this.geometry.morphAttributes,s=Object.keys(i);if(s.length>0){const l=i[s[0]];if(l!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let f=0,h=l.length;f<h;f++){const d=l[f].name||String(f);this.morphTargetInfluences.push(0),this.morphTargetDictionary[d]=f}}}}}function yc(o,e,i,s,l,f,h){const d=o.geometry.attributes.position;if(Gc.fromBufferAttribute(d,l),Vc.fromBufferAttribute(d,f),i.distanceSqToSegment(Gc,Vc,Qd,lx)>s)return;Qd.applyMatrix4(o.matrixWorld);const p=e.ray.origin.distanceTo(Qd);if(!(p<e.near||p>e.far))return{distance:p,point:lx.clone().applyMatrix4(o.matrixWorld),index:h,face:null,faceIndex:null,barycoord:null,object:o}}const ux=new nt,cx=new nt;class mS extends UT{constructor(e,i){super(e,i),this.isLineSegments=!0,this.type="LineSegments"}computeLineDistances(){const e=this.geometry;if(e.index===null){const i=e.attributes.position,s=[];for(let l=0,f=i.count;l<f;l+=2)ux.fromBufferAttribute(i,l),cx.fromBufferAttribute(i,l+1),s[l]=l===0?0:s[l-1],s[l+1]=s[l]+ux.distanceTo(cx);e.setAttribute("lineDistance",new un(s,1))}else oe("LineSegments.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}}class gS extends jn{constructor(e=[],i=ir,s,l,f,h,d,m,p,x){super(e,i,s,l,f,h,d,m,p,x),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}}class Nl extends jn{constructor(e,i,s=pa,l,f,h,d=zn,m=zn,p,x=Va,_=1){if(x!==Va&&x!==er)throw new Error("THREE.DepthTexture: format must be either THREE.DepthFormat or THREE.DepthStencilFormat");const v={width:e,height:i,depth:_};super(v,l,f,h,d,m,x,s,p),this.isDepthTexture=!0,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(e){return super.copy(e),this.source=new um(Object.assign({},e.image)),this.compareFunction=e.compareFunction,this}toJSON(e){const i=super.toJSON(e);return i.compareFunction=this.compareFunction,i}}class LT extends Nl{constructor(e,i=pa,s=ir,l,f,h=zn,d=zn,m,p=Va){const x={width:e,height:e,depth:1},_=[x,x,x,x,x,x];super(e,e,i,s,l,f,h,d,m,p),this.image=_,this.isCubeDepthTexture=!0,this.isCubeTexture=!0}get images(){return this.image}set images(e){this.image=e}}class _S extends jn{constructor(e=null){super(),this.sourceTexture=e,this.isExternalTexture=!0}copy(e){return super.copy(e),this.sourceTexture=e.sourceTexture,this}}class _i extends Kn{constructor(e=1,i=1,s=1,l=1,f=1,h=1){super(),this.type="BoxGeometry",this.parameters={width:e,height:i,depth:s,widthSegments:l,heightSegments:f,depthSegments:h};const d=this;l=Math.floor(l),f=Math.floor(f),h=Math.floor(h);const m=[],p=[],x=[],_=[];let v=0,M=0;R("z","y","x",-1,-1,s,i,e,h,f,0),R("z","y","x",1,-1,s,i,-e,h,f,1),R("x","z","y",1,1,e,s,i,l,h,2),R("x","z","y",1,-1,e,s,-i,l,h,3),R("x","y","z",1,-1,e,i,s,l,f,4),R("x","y","z",-1,-1,e,i,-s,l,f,5),this.setIndex(m),this.setAttribute("position",new un(p,3)),this.setAttribute("normal",new un(x,3)),this.setAttribute("uv",new un(_,2));function R(w,y,S,O,G,C,D,N,P,T,U){const F=C/P,V=D/T,Q=C/2,st=D/2,Y=N/2,tt=P+1,W=T+1;let q=0,dt=0;const ct=new nt;for(let rt=0;rt<W;rt++){const bt=rt*V-st;for(let Gt=0;Gt<tt;Gt++){const Ot=Gt*F-Q;ct[w]=Ot*O,ct[y]=bt*G,ct[S]=Y,p.push(ct.x,ct.y,ct.z),ct[w]=0,ct[y]=0,ct[S]=N>0?1:-1,x.push(ct.x,ct.y,ct.z),_.push(Gt/P),_.push(1-rt/T),q+=1}}for(let rt=0;rt<T;rt++)for(let bt=0;bt<P;bt++){const Gt=v+bt+tt*rt,Ot=v+bt+tt*(rt+1),z=v+(bt+1)+tt*(rt+1),_t=v+(bt+1)+tt*rt;m.push(Gt,Ot,_t),m.push(Ot,z,_t),dt+=6}d.addGroup(M,dt,U),M+=dt,v+=q}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new _i(e.width,e.height,e.depth,e.widthSegments,e.heightSegments,e.depthSegments)}}class mm extends Kn{constructor(e=1,i=32,s=0,l=Math.PI*2){super(),this.type="CircleGeometry",this.parameters={radius:e,segments:i,thetaStart:s,thetaLength:l},i=Math.max(3,i);const f=[],h=[],d=[],m=[],p=new nt,x=new le;h.push(0,0,0),d.push(0,0,1),m.push(.5,.5);for(let _=0,v=3;_<=i;_++,v+=3){const M=s+_/i*l;p.x=e*Math.cos(M),p.y=e*Math.sin(M),h.push(p.x,p.y,p.z),d.push(0,0,1),x.x=(h[v]/e+1)/2,x.y=(h[v+1]/e+1)/2,m.push(x.x,x.y)}for(let _=1;_<=i;_++)f.push(_,_+1,0);this.setIndex(f),this.setAttribute("position",new un(h,3)),this.setAttribute("normal",new un(d,3)),this.setAttribute("uv",new un(m,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new mm(e.radius,e.segments,e.thetaStart,e.thetaLength)}}class Zn extends Kn{constructor(e=1,i=1,s=1,l=32,f=1,h=!1,d=0,m=Math.PI*2){super(),this.type="CylinderGeometry",this.parameters={radiusTop:e,radiusBottom:i,height:s,radialSegments:l,heightSegments:f,openEnded:h,thetaStart:d,thetaLength:m};const p=this;l=Math.floor(l),f=Math.floor(f);const x=[],_=[],v=[],M=[];let R=0;const w=[],y=s/2;let S=0;O(),h===!1&&(e>0&&G(!0),i>0&&G(!1)),this.setIndex(x),this.setAttribute("position",new un(_,3)),this.setAttribute("normal",new un(v,3)),this.setAttribute("uv",new un(M,2));function O(){const C=new nt,D=new nt;let N=0;const P=(i-e)/s;for(let T=0;T<=f;T++){const U=[],F=T/f,V=F*(i-e)+e;for(let Q=0;Q<=l;Q++){const st=Q/l,Y=st*m+d,tt=Math.sin(Y),W=Math.cos(Y);D.x=V*tt,D.y=-F*s+y,D.z=V*W,_.push(D.x,D.y,D.z),C.set(tt,P,W).normalize(),v.push(C.x,C.y,C.z),M.push(st,1-F),U.push(R++)}w.push(U)}for(let T=0;T<l;T++)for(let U=0;U<f;U++){const F=w[U][T],V=w[U+1][T],Q=w[U+1][T+1],st=w[U][T+1];(e>0||U!==0)&&(x.push(F,V,st),N+=3),(i>0||U!==f-1)&&(x.push(V,Q,st),N+=3)}p.addGroup(S,N,0),S+=N}function G(C){const D=R,N=new le,P=new nt;let T=0;const U=C===!0?e:i,F=C===!0?1:-1;for(let Q=1;Q<=l;Q++)_.push(0,y*F,0),v.push(0,F,0),M.push(.5,.5),R++;const V=R;for(let Q=0;Q<=l;Q++){const Y=Q/l*m+d,tt=Math.cos(Y),W=Math.sin(Y);P.x=U*W,P.y=y*F,P.z=U*tt,_.push(P.x,P.y,P.z),v.push(0,F,0),N.x=tt*.5+.5,N.y=W*.5*F+.5,M.push(N.x,N.y),R++}for(let Q=0;Q<l;Q++){const st=D+Q,Y=V+Q;C===!0?x.push(Y,Y+1,st):x.push(Y+1,Y,st),T+=3}p.addGroup(S,T,C===!0?1:2),S+=T}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new Zn(e.radiusTop,e.radiusBottom,e.height,e.radialSegments,e.heightSegments,e.openEnded,e.thetaStart,e.thetaLength)}}class gm extends Zn{constructor(e=1,i=1,s=32,l=1,f=!1,h=0,d=Math.PI*2){super(0,e,i,s,l,f,h,d),this.type="ConeGeometry",this.parameters={radius:e,height:i,radialSegments:s,heightSegments:l,openEnded:f,thetaStart:h,thetaLength:d}}static fromJSON(e){return new gm(e.radius,e.height,e.radialSegments,e.heightSegments,e.openEnded,e.thetaStart,e.thetaLength)}}const Mc=new nt,Ec=new nt,Jd=new nt,Tc=new Oi;class OT extends Kn{constructor(e=null,i=1){if(super(),this.type="EdgesGeometry",this.parameters={geometry:e,thresholdAngle:i},e!==null){const l=Math.pow(10,4),f=Math.cos(Al*i),h=e.getIndex(),d=e.getAttribute("position"),m=h?h.count:d.count,p=[0,0,0],x=["a","b","c"],_=new Array(3),v={},M=[];for(let R=0;R<m;R+=3){h?(p[0]=h.getX(R),p[1]=h.getX(R+1),p[2]=h.getX(R+2)):(p[0]=R,p[1]=R+1,p[2]=R+2);const{a:w,b:y,c:S}=Tc;if(w.fromBufferAttribute(d,p[0]),y.fromBufferAttribute(d,p[1]),S.fromBufferAttribute(d,p[2]),Tc.getNormal(Jd),_[0]=`${Math.round(w.x*l)},${Math.round(w.y*l)},${Math.round(w.z*l)}`,_[1]=`${Math.round(y.x*l)},${Math.round(y.y*l)},${Math.round(y.z*l)}`,_[2]=`${Math.round(S.x*l)},${Math.round(S.y*l)},${Math.round(S.z*l)}`,!(_[0]===_[1]||_[1]===_[2]||_[2]===_[0]))for(let O=0;O<3;O++){const G=(O+1)%3,C=_[O],D=_[G],N=Tc[x[O]],P=Tc[x[G]],T=`${C}_${D}`,U=`${D}_${C}`;U in v&&v[U]?(Jd.dot(v[U].normal)<=f&&(M.push(N.x,N.y,N.z),M.push(P.x,P.y,P.z)),v[U]=null):T in v||(v[T]={index0:p[O],index1:p[G],normal:Jd.clone()})}}for(const R in v)if(v[R]){const{index0:w,index1:y}=v[R];Mc.fromBufferAttribute(d,w),Ec.fromBufferAttribute(d,y),M.push(Mc.x,Mc.y,Mc.z),M.push(Ec.x,Ec.y,Ec.z)}this.setAttribute("position",new un(M,3))}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}}class po extends Kn{constructor(e=1,i=1,s=1,l=1){super(),this.type="PlaneGeometry",this.parameters={width:e,height:i,widthSegments:s,heightSegments:l};const f=e/2,h=i/2,d=Math.floor(s),m=Math.floor(l),p=d+1,x=m+1,_=e/d,v=i/m,M=[],R=[],w=[],y=[];for(let S=0;S<x;S++){const O=S*v-h;for(let G=0;G<p;G++){const C=G*_-f;R.push(C,-O,0),w.push(0,0,1),y.push(G/d),y.push(1-S/m)}}for(let S=0;S<m;S++)for(let O=0;O<d;O++){const G=O+p*S,C=O+p*(S+1),D=O+1+p*(S+1),N=O+1+p*S;M.push(G,C,N),M.push(C,D,N)}this.setIndex(M),this.setAttribute("position",new un(R,3)),this.setAttribute("normal",new un(w,3)),this.setAttribute("uv",new un(y,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new po(e.width,e.height,e.widthSegments,e.heightSegments)}}class _m extends Kn{constructor(e=1,i=32,s=16,l=0,f=Math.PI*2,h=0,d=Math.PI){super(),this.type="SphereGeometry",this.parameters={radius:e,widthSegments:i,heightSegments:s,phiStart:l,phiLength:f,thetaStart:h,thetaLength:d},i=Math.max(3,Math.floor(i)),s=Math.max(2,Math.floor(s));const m=Math.min(h+d,Math.PI);let p=0;const x=[],_=new nt,v=new nt,M=[],R=[],w=[],y=[];for(let S=0;S<=s;S++){const O=[],G=S/s,C=h+G*d,D=e*Math.cos(C),N=Math.sqrt(e*e-D*D);let P=0;S===0&&h===0?P=.5/i:S===s&&m===Math.PI&&(P=-.5/i);for(let T=0;T<=i;T++){const U=T/i,F=l+U*f;_.x=-N*Math.cos(F),_.y=D,_.z=N*Math.sin(F),R.push(_.x,_.y,_.z),v.copy(_).normalize(),w.push(v.x,v.y,v.z),y.push(U+P,1-G),O.push(p++)}x.push(O)}for(let S=0;S<s;S++)for(let O=0;O<i;O++){const G=x[S][O+1],C=x[S][O],D=x[S+1][O],N=x[S+1][O+1];(S!==0||h>0)&&M.push(G,C,N),(S!==s-1||m<Math.PI)&&M.push(C,D,N)}this.setIndex(M),this.setAttribute("position",new un(R,3)),this.setAttribute("normal",new un(w,3)),this.setAttribute("uv",new un(y,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new _m(e.radius,e.widthSegments,e.heightSegments,e.phiStart,e.phiLength,e.thetaStart,e.thetaLength)}}function mo(o){const e={};for(const i in o){e[i]={};for(const s in o[i]){const l=o[i][s];if(fx(l))l.isRenderTargetTexture?(oe("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),e[i][s]=null):e[i][s]=l.clone();else if(Array.isArray(l))if(fx(l[0])){const f=[];for(let h=0,d=l.length;h<d;h++)f[h]=l[h].clone();e[i][s]=f}else e[i][s]=l.slice();else e[i][s]=l}}return e}function qn(o){const e={};for(let i=0;i<o.length;i++){const s=mo(o[i]);for(const l in s)e[l]=s[l]}return e}function fx(o){return o&&(o.isColor||o.isMatrix3||o.isMatrix4||o.isVector2||o.isVector3||o.isVector4||o.isTexture||o.isQuaternion)}function PT(o){const e=[];for(let i=0;i<o.length;i++)e.push(o[i].clone());return e}function vS(o){const e=o.getRenderTarget();return e===null?o.outputColorSpace:e.isXRRenderTarget===!0?e.texture.colorSpace:Oe.workingColorSpace}const IT={clone:mo,merge:qn};var zT=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,BT=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`;class ga extends go{constructor(e){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=zT,this.fragmentShader=BT,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0&&this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=mo(e.uniforms),this.uniformsGroups=PT(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this.defaultAttributeValues=Object.assign({},e.defaultAttributeValues),this.index0AttributeName=e.index0AttributeName,this.uniformsNeedUpdate=e.uniformsNeedUpdate,this}toJSON(e){const i=super.toJSON(e);i.glslVersion=this.glslVersion,i.uniforms={};for(const l in this.uniforms){const h=this.uniforms[l].value;h&&h.isTexture?i.uniforms[l]={type:"t",value:h.toJSON(e).uuid}:h&&h.isColor?i.uniforms[l]={type:"c",value:h.getHex()}:h&&h.isVector2?i.uniforms[l]={type:"v2",value:h.toArray()}:h&&h.isVector3?i.uniforms[l]={type:"v3",value:h.toArray()}:h&&h.isVector4?i.uniforms[l]={type:"v4",value:h.toArray()}:h&&h.isMatrix3?i.uniforms[l]={type:"m3",value:h.toArray()}:h&&h.isMatrix4?i.uniforms[l]={type:"m4",value:h.toArray()}:i.uniforms[l]={value:h}}Object.keys(this.defines).length>0&&(i.defines=this.defines),i.vertexShader=this.vertexShader,i.fragmentShader=this.fragmentShader,i.lights=this.lights,i.clipping=this.clipping;const s={};for(const l in this.extensions)this.extensions[l]===!0&&(s[l]=!0);return Object.keys(s).length>0&&(i.extensions=s),i}fromJSON(e,i){if(super.fromJSON(e,i),e.uniforms!==void 0)for(const s in e.uniforms){const l=e.uniforms[s];switch(this.uniforms[s]={},l.type){case"t":this.uniforms[s].value=i[l.value]||null;break;case"c":this.uniforms[s].value=new Me().setHex(l.value);break;case"v2":this.uniforms[s].value=new le().fromArray(l.value);break;case"v3":this.uniforms[s].value=new nt().fromArray(l.value);break;case"v4":this.uniforms[s].value=new on().fromArray(l.value);break;case"m3":this.uniforms[s].value=new de().fromArray(l.value);break;case"m4":this.uniforms[s].value=new ln().fromArray(l.value);break;default:this.uniforms[s].value=l.value}}if(e.defines!==void 0&&(this.defines=e.defines),e.vertexShader!==void 0&&(this.vertexShader=e.vertexShader),e.fragmentShader!==void 0&&(this.fragmentShader=e.fragmentShader),e.glslVersion!==void 0&&(this.glslVersion=e.glslVersion),e.extensions!==void 0)for(const s in e.extensions)this.extensions[s]=e.extensions[s];return e.lights!==void 0&&(this.lights=e.lights),e.clipping!==void 0&&(this.clipping=e.clipping),this}}class FT extends ga{constructor(e){super(e),this.isRawShaderMaterial=!0,this.type="RawShaderMaterial"}}class pn extends go{constructor(e){super(),this.isMeshStandardMaterial=!0,this.type="MeshStandardMaterial",this.defines={STANDARD:""},this.color=new Me(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new Me(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=Zp,this.normalScale=new le(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Ts,this.envMapIntensity=1,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.defines={STANDARD:""},this.color.copy(e.color),this.roughness=e.roughness,this.metalness=e.metalness,this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.roughnessMap=e.roughnessMap,this.metalnessMap=e.metalnessMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.envMapIntensity=e.envMapIntensity,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.flatShading=e.flatShading,this.fog=e.fog,this}}class HT extends go{constructor(e){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=qE,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(e)}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}}class GT extends go{constructor(e){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e)}copy(e){return super.copy(e),this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}}class vm extends Dn{constructor(e,i=1){super(),this.isLight=!0,this.type="Light",this.color=new Me(e),this.intensity=i}copy(e,i){return super.copy(e,i),this.color.copy(e.color),this.intensity=e.intensity,this}toJSON(e){const i=super.toJSON(e);return i.object.color=this.color.getHex(),i.object.intensity=this.intensity,i}}class VT extends vm{constructor(e,i,s){super(e,s),this.isHemisphereLight=!0,this.type="HemisphereLight",this.position.copy(Dn.DEFAULT_UP),this.updateMatrix(),this.groundColor=new Me(i)}copy(e,i){return super.copy(e,i),this.groundColor.copy(e.groundColor),this}toJSON(e){const i=super.toJSON(e);return i.object.groundColor=this.groundColor.getHex(),i}}const $d=new ln,hx=new nt,dx=new nt;class xS{constructor(e){this.camera=e,this.intensity=1,this.bias=0,this.biasNode=null,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new le(512,512),this.mapType=xi,this.map=null,this.mapPass=null,this.matrix=new ln,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new dm,this._frameExtents=new le(1,1),this._viewportCount=1,this._viewports=[new on(0,0,1,1)]}getViewportCount(){return this._viewportCount}getCamera(){return this.camera}getFrustum(){return this._frustum}updateMatrices(e){const i=this.camera;hx.setFromMatrixPosition(e.matrixWorld),i.position.copy(hx),dx.setFromMatrixPosition(e.target.matrixWorld),i.lookAt(dx),i.updateMatrixWorld(),this._updateMatrix(i,this.matrix,this._frustum)}_updateMatrix(e,i,s,l){$d.multiplyMatrices(e.projectionMatrix,e.matrixWorldInverse),s.setFromProjectionMatrix($d,e.coordinateSystem,e.reversedDepth);const f=this._frameExtents,h=l?l.z/f.x:1,d=l?l.w/f.y:1,m=l?l.x/f.x:0,p=l?l.y/f.y:0;e.coordinateSystem===Dl||e.reversedDepth?i.set(.5*h,0,0,.5*h+m,0,.5*d,0,.5*d+p,0,0,1,0,0,0,0,1):i.set(.5*h,0,0,.5*h+m,0,.5*d,0,.5*d+p,0,0,.5,.5,0,0,0,1),i.multiply($d)}getViewport(e){return this._viewports[e]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(e){return this.camera=e.camera.clone(),this.intensity=e.intensity,this.bias=e.bias,this.radius=e.radius,this.autoUpdate=e.autoUpdate,this.needsUpdate=e.needsUpdate,this.normalBias=e.normalBias,this.blurSamples=e.blurSamples,this.mapSize.copy(e.mapSize),this.biasNode=e.biasNode,this}clone(){return new this.constructor().copy(this)}toJSON(){const e={};return e.intensity=this.intensity,e.bias=this.bias,e.normalBias=this.normalBias,e.radius=this.radius,e.blurSamples=this.blurSamples,e.mapSize=this.mapSize.toArray(),e.camera=this.camera.toJSON(!1).object,delete e.camera.matrix,e}}const bc=new nt,Ac=new Es,ra=new nt;class SS extends Dn{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new ln,this.projectionMatrix=new ln,this.projectionMatrixInverse=new ln,this.coordinateSystem=ha,this._reversedDepth=!1}get reversedDepth(){return this._reversedDepth}copy(e,i){return super.copy(e,i),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this.coordinateSystem=e.coordinateSystem,this}getWorldDirection(e){return super.getWorldDirection(e).negate()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorld.decompose(bc,Ac,ra),ra.x===1&&ra.y===1&&ra.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(bc,Ac,ra.set(1,1,1)).invert()}updateWorldMatrix(e,i,s=!1){super.updateWorldMatrix(e,i,s),this.matrixWorld.decompose(bc,Ac,ra),ra.x===1&&ra.y===1&&ra.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(bc,Ac,ra.set(1,1,1)).invert()}clone(){return new this.constructor().copy(this)}}const ys=new nt,px=new le,mx=new le;class vi extends SS{constructor(e=50,i=1,s=.1,l=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=e,this.zoom=1,this.near=s,this.far=l,this.focus=10,this.aspect=i,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,i){return super.copy(e,i),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){const i=.5*this.getFilmHeight()/e;this.fov=jp*2*Math.atan(i),this.updateProjectionMatrix()}getFocalLength(){const e=Math.tan(Al*.5*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return jp*2*Math.atan(Math.tan(Al*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(e,i,s){ys.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),i.set(ys.x,ys.y).multiplyScalar(-e/ys.z),ys.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),s.set(ys.x,ys.y).multiplyScalar(-e/ys.z)}getViewSize(e,i){return this.getViewBounds(e,px,mx),i.subVectors(mx,px)}setViewOffset(e,i,s,l,f,h){this.aspect=e/i,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=i,this.view.offsetX=s,this.view.offsetY=l,this.view.width=f,this.view.height=h,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const e=this.near;let i=e*Math.tan(Al*.5*this.fov)/this.zoom,s=2*i,l=this.aspect*s,f=-.5*l;const h=this.view;if(this.view!==null&&this.view.enabled){const m=h.fullWidth,p=h.fullHeight;f+=h.offsetX*l/m,i-=h.offsetY*s/p,l*=h.width/m,s*=h.height/p}const d=this.filmOffset;d!==0&&(f+=e*d/this.getFilmWidth()),this.projectionMatrix.makePerspective(f,f+l,i,i-s,e,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){const i=super.toJSON(e);return i.object.fov=this.fov,i.object.zoom=this.zoom,i.object.near=this.near,i.object.far=this.far,i.object.focus=this.focus,i.object.aspect=this.aspect,this.view!==null&&(i.object.view=Object.assign({},this.view)),i.object.filmGauge=this.filmGauge,i.object.filmOffset=this.filmOffset,i}}class XT extends xS{constructor(){super(new vi(90,1,.5,500)),this.isPointLightShadow=!0}}class kT extends vm{constructor(e,i,s=0,l=2){super(e,i),this.isPointLight=!0,this.type="PointLight",this.distance=s,this.decay=l,this.shadow=new XT}get power(){return this.intensity*4*Math.PI}set power(e){this.intensity=e/(4*Math.PI)}dispose(){super.dispose(),this.shadow.dispose()}copy(e,i){return super.copy(e,i),this.distance=e.distance,this.decay=e.decay,this.shadow=e.shadow.clone(),this}toJSON(e){const i=super.toJSON(e);return i.object.distance=this.distance,i.object.decay=this.decay,i.object.shadow=this.shadow.toJSON(),i}}class xm extends SS{constructor(e=-1,i=1,s=1,l=-1,f=.1,h=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=e,this.right=i,this.top=s,this.bottom=l,this.near=f,this.far=h,this.updateProjectionMatrix()}copy(e,i){return super.copy(e,i),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,i,s,l,f,h){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=i,this.view.offsetX=s,this.view.offsetY=l,this.view.width=f,this.view.height=h,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const e=(this.right-this.left)/(2*this.zoom),i=(this.top-this.bottom)/(2*this.zoom),s=(this.right+this.left)/2,l=(this.top+this.bottom)/2;let f=s-e,h=s+e,d=l+i,m=l-i;if(this.view!==null&&this.view.enabled){const p=(this.right-this.left)/this.view.fullWidth/this.zoom,x=(this.top-this.bottom)/this.view.fullHeight/this.zoom;f+=p*this.view.offsetX,h=f+p*this.view.width,d-=x*this.view.offsetY,m=d-x*this.view.height}this.projectionMatrix.makeOrthographic(f,h,d,m,this.near,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){const i=super.toJSON(e);return i.object.zoom=this.zoom,i.object.left=this.left,i.object.right=this.right,i.object.top=this.top,i.object.bottom=this.bottom,i.object.near=this.near,i.object.far=this.far,this.view!==null&&(i.object.view=Object.assign({},this.view)),i}}class WT extends xS{constructor(){super(new xm(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}}class gx extends vm{constructor(e,i){super(e,i),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(Dn.DEFAULT_UP),this.updateMatrix(),this.target=new Dn,this.shadow=new WT}dispose(){super.dispose(),this.shadow.dispose()}copy(e){return super.copy(e),this.target=e.target.clone(),this.shadow=e.shadow.clone(),this}toJSON(e){const i=super.toJSON(e);return i.object.shadow=this.shadow.toJSON(),i.object.target=this.target.uuid,i}}const io=-90,ao=1;class YT extends Dn{constructor(e,i,s){super(),this.type="CubeCamera",this.renderTarget=s,this.coordinateSystem=null,this.activeMipmapLevel=0;const l=new vi(io,ao,e,i);l.layers=this.layers,this.add(l);const f=new vi(io,ao,e,i);f.layers=this.layers,this.add(f);const h=new vi(io,ao,e,i);h.layers=this.layers,this.add(h);const d=new vi(io,ao,e,i);d.layers=this.layers,this.add(d);const m=new vi(io,ao,e,i);m.layers=this.layers,this.add(m);const p=new vi(io,ao,e,i);p.layers=this.layers,this.add(p)}updateCoordinateSystem(){const e=this.coordinateSystem,i=this.children.concat(),[s,l,f,h,d,m]=i;for(const p of i)this.remove(p);if(e===ha)s.up.set(0,1,0),s.lookAt(1,0,0),l.up.set(0,1,0),l.lookAt(-1,0,0),f.up.set(0,0,-1),f.lookAt(0,1,0),h.up.set(0,0,1),h.lookAt(0,-1,0),d.up.set(0,1,0),d.lookAt(0,0,1),m.up.set(0,1,0),m.lookAt(0,0,-1);else if(e===Dl)s.up.set(0,-1,0),s.lookAt(-1,0,0),l.up.set(0,-1,0),l.lookAt(1,0,0),f.up.set(0,0,1),f.lookAt(0,1,0),h.up.set(0,0,-1),h.lookAt(0,-1,0),d.up.set(0,-1,0),d.lookAt(0,0,1),m.up.set(0,-1,0),m.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+e);for(const p of i)this.add(p),p.updateMatrixWorld()}update(e,i){this.parent===null&&this.updateMatrixWorld();const{renderTarget:s,activeMipmapLevel:l}=this;this.coordinateSystem!==e.coordinateSystem&&(this.coordinateSystem=e.coordinateSystem,this.updateCoordinateSystem());const[f,h,d,m,p,x]=this.children,_=e.getRenderTarget(),v=e.getActiveCubeFace(),M=e.getActiveMipmapLevel(),R=e.xr.enabled;e.xr.enabled=!1;const w=s.texture.generateMipmaps;s.texture.generateMipmaps=!1;let y=!1;e.isWebGLRenderer===!0?y=e.state.buffers.depth.getReversed():y=e.reversedDepthBuffer,e.setRenderTarget(s,0,l),y&&e.autoClear===!1&&e.clearDepth(),e.render(i,f),e.setRenderTarget(s,1,l),y&&e.autoClear===!1&&e.clearDepth(),e.render(i,h),e.setRenderTarget(s,2,l),y&&e.autoClear===!1&&e.clearDepth(),e.render(i,d),e.setRenderTarget(s,3,l),y&&e.autoClear===!1&&e.clearDepth(),e.render(i,m),e.setRenderTarget(s,4,l),y&&e.autoClear===!1&&e.clearDepth(),e.render(i,p),s.texture.generateMipmaps=w,e.setRenderTarget(s,5,l),y&&e.autoClear===!1&&e.clearDepth(),e.render(i,x),e.setRenderTarget(_,v,M),e.xr.enabled=R,s.texture.needsPMREMUpdate=!0}}class qT extends vi{constructor(e=[]){super(),this.isArrayCamera=!0,this.isMultiViewCamera=!1,this.cameras=e}}class _x{constructor(e=1,i=0,s=0){this.radius=e,this.phi=i,this.theta=s}set(e,i,s){return this.radius=e,this.phi=i,this.theta=s,this}copy(e){return this.radius=e.radius,this.phi=e.phi,this.theta=e.theta,this}makeSafe(){return this.phi=Ce(this.phi,1e-6,Math.PI-1e-6),this}setFromVector3(e){return this.setFromCartesianCoords(e.x,e.y,e.z)}setFromCartesianCoords(e,i,s){return this.radius=Math.sqrt(e*e+i*i+s*s),this.radius===0?(this.theta=0,this.phi=0):(this.theta=Math.atan2(e,s),this.phi=Math.acos(Ce(i/this.radius,-1,1))),this}clone(){return new this.constructor().copy(this)}}const Am=class Am{constructor(e,i,s,l){this.elements=[1,0,0,1],e!==void 0&&this.set(e,i,s,l)}identity(){return this.set(1,0,0,1),this}fromArray(e,i=0){for(let s=0;s<4;s++)this.elements[s]=e[s+i];return this}set(e,i,s,l){const f=this.elements;return f[0]=e,f[2]=i,f[1]=s,f[3]=l,this}};Am.prototype.isMatrix2=!0;let vx=Am;class ZT extends mS{constructor(e=10,i=10,s=4473924,l=8947848){s=new Me(s),l=new Me(l);const f=i/2,h=e/i,d=e/2,m=[],p=[];for(let v=0,M=0,R=-d;v<=i;v++,R+=h){m.push(-d,0,R,d,0,R),m.push(R,0,-d,R,0,d);const w=v===f?s:l;w.toArray(p,M),M+=3,w.toArray(p,M),M+=3,w.toArray(p,M),M+=3,w.toArray(p,M),M+=3}const x=new Kn;x.setAttribute("position",new un(m,3)),x.setAttribute("color",new un(p,3));const _=new pm({vertexColors:!0,toneMapped:!1});super(x,_),this.type="GridHelper"}dispose(){super.dispose(),this.geometry.dispose(),this.material.dispose()}}class jT extends bs{constructor(e,i=null){super(),this.object=e,this.domElement=i,this.enabled=!0,this.state=-1,this.keys={},this.mouseButtons={LEFT:null,MIDDLE:null,RIGHT:null},this.touches={ONE:null,TWO:null}}connect(e){this.domElement!==null&&this.disconnect(),this.domElement=e}disconnect(){}dispose(){}update(){}}function xx(o,e,i,s){const l=KT(s);switch(i){case rS:return o*e;case lS:return o*e/l.components*l.byteLength;case am:return o*e/l.components*l.byteLength;case ar:return o*e*2/l.components*l.byteLength;case sm:return o*e*2/l.components*l.byteLength;case oS:return o*e*3/l.components*l.byteLength;case ki:return o*e*4/l.components*l.byteLength;case rm:return o*e*4/l.components*l.byteLength;case Dc:case Nc:return Math.floor((o+3)/4)*Math.floor((e+3)/4)*8;case Uc:case Lc:return Math.floor((o+3)/4)*Math.floor((e+3)/4)*16;case xp:case yp:return Math.max(o,16)*Math.max(e,8)/4;case vp:case Sp:return Math.max(o,8)*Math.max(e,8)/2;case Mp:case Ep:case bp:case Ap:return Math.floor((o+3)/4)*Math.floor((e+3)/4)*8;case Tp:case Ic:case Rp:return Math.floor((o+3)/4)*Math.floor((e+3)/4)*16;case Cp:return Math.floor((o+3)/4)*Math.floor((e+3)/4)*16;case wp:return Math.floor((o+4)/5)*Math.floor((e+3)/4)*16;case Dp:return Math.floor((o+4)/5)*Math.floor((e+4)/5)*16;case Np:return Math.floor((o+5)/6)*Math.floor((e+4)/5)*16;case Up:return Math.floor((o+5)/6)*Math.floor((e+5)/6)*16;case Lp:return Math.floor((o+7)/8)*Math.floor((e+4)/5)*16;case Op:return Math.floor((o+7)/8)*Math.floor((e+5)/6)*16;case Pp:return Math.floor((o+7)/8)*Math.floor((e+7)/8)*16;case Ip:return Math.floor((o+9)/10)*Math.floor((e+4)/5)*16;case zp:return Math.floor((o+9)/10)*Math.floor((e+5)/6)*16;case Bp:return Math.floor((o+9)/10)*Math.floor((e+7)/8)*16;case Fp:return Math.floor((o+9)/10)*Math.floor((e+9)/10)*16;case Hp:return Math.floor((o+11)/12)*Math.floor((e+9)/10)*16;case Gp:return Math.floor((o+11)/12)*Math.floor((e+11)/12)*16;case Vp:case Xp:case kp:return Math.ceil(o/4)*Math.ceil(e/4)*16;case Wp:case Yp:return Math.ceil(o/4)*Math.ceil(e/4)*8;case zc:case qp:return Math.ceil(o/4)*Math.ceil(e/4)*16}throw new Error(`Unable to determine texture byte length for ${i} format.`)}function KT(o){switch(o){case xi:case nS:return{byteLength:1,components:1};case Cl:case iS:case ma:return{byteLength:2,components:1};case nm:case im:return{byteLength:2,components:4};case pa:case em:case fa:return{byteLength:4,components:1};case aS:case sS:return{byteLength:4,components:3}}throw new Error(`THREE.TextureUtils: Unknown texture type ${o}.`)}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:tm}}));typeof window<"u"&&(window.__THREE__?oe("WARNING: Multiple instances of Three.js being imported."):window.__THREE__=tm);function yS(){let o=null,e=!1,i=null,s=null;function l(f,h){s=o.requestAnimationFrame(l),i(f,h)}return{start:function(){e!==!0&&i!==null&&o!==null&&(s=o.requestAnimationFrame(l),e=!0)},stop:function(){o!==null&&o.cancelAnimationFrame(s),e=!1},setAnimationLoop:function(f){i=f},setContext:function(f){o=f}}}function QT(o){const e=new WeakMap;function i(d,m){const p=d.array,x=d.usage,_=p.byteLength,v=o.createBuffer();o.bindBuffer(m,v),o.bufferData(m,p,x),d.onUploadCallback();let M;if(p instanceof Float32Array)M=o.FLOAT;else if(typeof Float16Array<"u"&&p instanceof Float16Array)M=o.HALF_FLOAT;else if(p instanceof Uint16Array)d.isFloat16BufferAttribute?M=o.HALF_FLOAT:M=o.UNSIGNED_SHORT;else if(p instanceof Int16Array)M=o.SHORT;else if(p instanceof Uint32Array)M=o.UNSIGNED_INT;else if(p instanceof Int32Array)M=o.INT;else if(p instanceof Int8Array)M=o.BYTE;else if(p instanceof Uint8Array)M=o.UNSIGNED_BYTE;else if(p instanceof Uint8ClampedArray)M=o.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+p);return{buffer:v,type:M,bytesPerElement:p.BYTES_PER_ELEMENT,version:d.version,size:_}}function s(d,m,p){const x=m.array,_=m.updateRanges;if(o.bindBuffer(p,d),_.length===0)o.bufferSubData(p,0,x);else{_.sort((M,R)=>M.start-R.start);let v=0;for(let M=1;M<_.length;M++){const R=_[v],w=_[M];w.start<=R.start+R.count+1?R.count=Math.max(R.count,w.start+w.count-R.start):(++v,_[v]=w)}_.length=v+1;for(let M=0,R=_.length;M<R;M++){const w=_[M];o.bufferSubData(p,w.start*x.BYTES_PER_ELEMENT,x,w.start,w.count)}m.clearUpdateRanges()}m.onUploadCallback()}function l(d){return d.isInterleavedBufferAttribute&&(d=d.data),e.get(d)}function f(d){d.isInterleavedBufferAttribute&&(d=d.data);const m=e.get(d);m&&(o.deleteBuffer(m.buffer),e.delete(d))}function h(d,m){if(d.isInterleavedBufferAttribute&&(d=d.data),d.isGLBufferAttribute){const x=e.get(d);(!x||x.version<d.version)&&e.set(d,{buffer:d.buffer,type:d.type,bytesPerElement:d.elementSize,version:d.version});return}const p=e.get(d);if(p===void 0)e.set(d,i(d,m));else if(p.version<d.version){if(p.size!==d.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");s(p.buffer,d,m),p.version=d.version}}return{get:l,remove:f,update:h}}var JT=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,$T=`#ifdef USE_ALPHAHASH
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
#endif`,tb=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,eb=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,nb=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,ib=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,ab=`#ifdef USE_AOMAP
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
#endif`,sb=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,rb=`#ifdef USE_BATCHING
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
#endif`,ob=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,lb=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,ub=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,cb=`float G_BlinnPhong_Implicit( ) {
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
} // validated`,fb=`#ifdef USE_IRIDESCENCE
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
#endif`,hb=`#ifdef USE_BUMPMAP
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
#endif`,db=`#if NUM_CLIPPING_PLANES > 0
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
#endif`,pb=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,mb=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,gb=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,_b=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#endif`,vb=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#endif`,xb=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec4 vColor;
#endif`,Sb=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
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
#endif`,yb=`#define PI 3.141592653589793
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
} // validated`,Mb=`#ifdef ENVMAP_TYPE_CUBE_UV
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
#endif`,Eb=`vec3 transformedNormal = objectNormal;
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
#endif`,Tb=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,bb=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,Ab=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,Rb=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,Cb="gl_FragColor = linearToOutputTexel( gl_FragColor );",wb=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,Db=`#ifdef USE_ENVMAP
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
#endif`,Nb=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
#endif`,Ub=`#ifdef USE_ENVMAP
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
#endif`,Lb=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,Ob=`#ifdef USE_ENVMAP
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
#endif`,Pb=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,Ib=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,zb=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,Bb=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,Fb=`#ifdef USE_GRADIENTMAP
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
}`,Hb=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,Gb=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,Vb=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,Xb=`uniform bool receiveShadow;
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
#include <lightprobes_pars_fragment>`,kb=`#ifdef USE_ENVMAP
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
#endif`,Wb=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,Yb=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,qb=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,Zb=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,jb=`PhysicalMaterial material;
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
#endif`,Kb=`uniform sampler2D dfgLUT;
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
}`,Qb=`
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
#endif`,Jb=`#if defined( RE_IndirectDiffuse )
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
#endif`,$b=`#if defined( RE_IndirectDiffuse )
	#if defined( LAMBERT ) || defined( PHONG )
		irradiance += iblIrradiance;
	#endif
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,t1=`#ifdef USE_LIGHT_PROBES_GRID
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
#endif`,e1=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,n1=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,i1=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,a1=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,s1=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,r1=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,o1=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
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
#endif`,l1=`#if defined( USE_POINTS_UV )
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
#endif`,u1=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,c1=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,f1=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,h1=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,d1=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,p1=`#ifdef USE_MORPHTARGETS
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
#endif`,m1=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,g1=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
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
vec3 nonPerturbedNormal = normal;`,_1=`#ifdef USE_NORMALMAP_OBJECTSPACE
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
#endif`,v1=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,x1=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,S1=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
		#ifdef FLIP_SIDED
			vBitangent = - vBitangent;
		#endif
	#endif
#endif`,y1=`#ifdef USE_NORMALMAP
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
#endif`,M1=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,E1=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,T1=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,b1=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,A1=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,R1=`vec3 packNormalToRGB( const in vec3 normal ) {
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
}`,C1=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,w1=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,D1=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,N1=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,U1=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,L1=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,O1=`#if NUM_SPOT_LIGHT_COORDS > 0
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
#endif`,P1=`#if NUM_SPOT_LIGHT_COORDS > 0
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
#endif`,I1=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_SUN_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
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
#endif`,z1=`float getShadowMask() {
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
}`,B1=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,F1=`#ifdef USE_SKINNING
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
#endif`,H1=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,G1=`#ifdef USE_SKINNING
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
#endif`,V1=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,X1=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,k1=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,W1=`#ifndef saturate
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
vec3 CustomToneMapping( vec3 color ) { return color; }`,Y1=`#ifdef USE_TRANSMISSION
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
#endif`,q1=`#ifdef USE_TRANSMISSION
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
#endif`,Z1=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,j1=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,K1=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,Q1=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`;const J1=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,$1=`uniform sampler2D t2D;
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
}`,tA=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,eA=`#ifdef ENVMAP_TYPE_CUBE
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
}`,nA=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,iA=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,aA=`#include <common>
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
}`,sA=`#if DEPTH_PACKING == 3200
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
}`,rA=`#define DISTANCE
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
}`,oA=`#define DISTANCE
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
}`,lA=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,uA=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,cA=`uniform float scale;
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
}`,fA=`uniform vec3 diffuse;
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
}`,hA=`#include <common>
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
}`,dA=`uniform vec3 diffuse;
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
}`,pA=`#define LAMBERT
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
}`,mA=`#define LAMBERT
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
}`,gA=`#define MATCAP
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
}`,_A=`#define MATCAP
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
}`,vA=`#define NORMAL
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
}`,xA=`#define NORMAL
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
}`,SA=`#define PHONG
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
}`,yA=`#define PHONG
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
}`,MA=`#define STANDARD
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
}`,EA=`#define STANDARD
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
}`,TA=`#define TOON
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
}`,bA=`#define TOON
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
}`,AA=`uniform float size;
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
}`,RA=`uniform vec3 diffuse;
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
}`,CA=`#include <common>
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
}`,wA=`uniform vec3 color;
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
}`,DA=`uniform float rotation;
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
}`,NA=`uniform vec3 diffuse;
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
}`,ve={alphahash_fragment:JT,alphahash_pars_fragment:$T,alphamap_fragment:tb,alphamap_pars_fragment:eb,alphatest_fragment:nb,alphatest_pars_fragment:ib,aomap_fragment:ab,aomap_pars_fragment:sb,batching_pars_vertex:rb,batching_vertex:ob,begin_vertex:lb,beginnormal_vertex:ub,bsdfs:cb,iridescence_fragment:fb,bumpmap_pars_fragment:hb,clipping_planes_fragment:db,clipping_planes_pars_fragment:pb,clipping_planes_pars_vertex:mb,clipping_planes_vertex:gb,color_fragment:_b,color_pars_fragment:vb,color_pars_vertex:xb,color_vertex:Sb,common:yb,cube_uv_reflection_fragment:Mb,defaultnormal_vertex:Eb,displacementmap_pars_vertex:Tb,displacementmap_vertex:bb,emissivemap_fragment:Ab,emissivemap_pars_fragment:Rb,colorspace_fragment:Cb,colorspace_pars_fragment:wb,envmap_fragment:Db,envmap_common_pars_fragment:Nb,envmap_pars_fragment:Ub,envmap_pars_vertex:Lb,envmap_physical_pars_fragment:kb,envmap_vertex:Ob,fog_vertex:Pb,fog_pars_vertex:Ib,fog_fragment:zb,fog_pars_fragment:Bb,gradientmap_pars_fragment:Fb,lightmap_pars_fragment:Hb,lights_lambert_fragment:Gb,lights_lambert_pars_fragment:Vb,lights_pars_begin:Xb,lights_toon_fragment:Wb,lights_toon_pars_fragment:Yb,lights_phong_fragment:qb,lights_phong_pars_fragment:Zb,lights_physical_fragment:jb,lights_physical_pars_fragment:Kb,lights_fragment_begin:Qb,lights_fragment_maps:Jb,lights_fragment_end:$b,lightprobes_pars_fragment:t1,logdepthbuf_fragment:e1,logdepthbuf_pars_fragment:n1,logdepthbuf_pars_vertex:i1,logdepthbuf_vertex:a1,map_fragment:s1,map_pars_fragment:r1,map_particle_fragment:o1,map_particle_pars_fragment:l1,metalnessmap_fragment:u1,metalnessmap_pars_fragment:c1,morphinstance_vertex:f1,morphcolor_vertex:h1,morphnormal_vertex:d1,morphtarget_pars_vertex:p1,morphtarget_vertex:m1,normal_fragment_begin:g1,normal_fragment_maps:_1,normal_pars_fragment:v1,normal_pars_vertex:x1,normal_vertex:S1,normalmap_pars_fragment:y1,clearcoat_normal_fragment_begin:M1,clearcoat_normal_fragment_maps:E1,clearcoat_pars_fragment:T1,iridescence_pars_fragment:b1,opaque_fragment:A1,packing:R1,premultiplied_alpha_fragment:C1,project_vertex:w1,dithering_fragment:D1,dithering_pars_fragment:N1,roughnessmap_fragment:U1,roughnessmap_pars_fragment:L1,shadowmap_pars_fragment:O1,shadowmap_pars_vertex:P1,shadowmap_vertex:I1,shadowmask_pars_fragment:z1,skinbase_vertex:B1,skinning_pars_vertex:F1,skinning_vertex:H1,skinnormal_vertex:G1,specularmap_fragment:V1,specularmap_pars_fragment:X1,tonemapping_fragment:k1,tonemapping_pars_fragment:W1,transmission_fragment:Y1,transmission_pars_fragment:q1,uv_pars_fragment:Z1,uv_pars_vertex:j1,uv_vertex:K1,worldpos_vertex:Q1,background_vert:J1,background_frag:$1,backgroundCube_vert:tA,backgroundCube_frag:eA,cube_vert:nA,cube_frag:iA,depth_vert:aA,depth_frag:sA,distance_vert:rA,distance_frag:oA,equirect_vert:lA,equirect_frag:uA,linedashed_vert:cA,linedashed_frag:fA,meshbasic_vert:hA,meshbasic_frag:dA,meshlambert_vert:pA,meshlambert_frag:mA,meshmatcap_vert:gA,meshmatcap_frag:_A,meshnormal_vert:vA,meshnormal_frag:xA,meshphong_vert:SA,meshphong_frag:yA,meshphysical_vert:MA,meshphysical_frag:EA,meshtoon_vert:TA,meshtoon_frag:bA,points_vert:AA,points_frag:RA,shadow_vert:CA,shadow_frag:wA,sprite_vert:DA,sprite_frag:NA},kt={common:{diffuse:{value:new Me(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new de},alphaMap:{value:null},alphaMapTransform:{value:new de},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new de}},envmap:{envMap:{value:null},envMapRotation:{value:new de},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98},dfgLUT:{value:null}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new de}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new de}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new de},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new de},normalScale:{value:new le(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new de},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new de}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new de}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new de}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new Me(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},sunLights:{value:[],properties:{direction:{},color:{}}},sunLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},sunShadowMatrix:{value:[]},sunShadowCascade:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null},probesSH:{value:null},probesMin:{value:new nt},probesMax:{value:new nt},probesResolution:{value:new nt}},points:{diffuse:{value:new Me(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new de},alphaTest:{value:0},uvTransform:{value:new de}},sprite:{diffuse:{value:new Me(16777215)},opacity:{value:1},center:{value:new le(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new de},alphaMap:{value:null},alphaMapTransform:{value:new de},alphaTest:{value:0}}},ua={basic:{uniforms:qn([kt.common,kt.specularmap,kt.envmap,kt.aomap,kt.lightmap,kt.fog]),vertexShader:ve.meshbasic_vert,fragmentShader:ve.meshbasic_frag},lambert:{uniforms:qn([kt.common,kt.specularmap,kt.envmap,kt.aomap,kt.lightmap,kt.emissivemap,kt.bumpmap,kt.normalmap,kt.displacementmap,kt.fog,kt.lights,{emissive:{value:new Me(0)},envMapIntensity:{value:1}}]),vertexShader:ve.meshlambert_vert,fragmentShader:ve.meshlambert_frag},phong:{uniforms:qn([kt.common,kt.specularmap,kt.envmap,kt.aomap,kt.lightmap,kt.emissivemap,kt.bumpmap,kt.normalmap,kt.displacementmap,kt.fog,kt.lights,{emissive:{value:new Me(0)},specular:{value:new Me(1118481)},shininess:{value:30},envMapIntensity:{value:1}}]),vertexShader:ve.meshphong_vert,fragmentShader:ve.meshphong_frag},standard:{uniforms:qn([kt.common,kt.envmap,kt.aomap,kt.lightmap,kt.emissivemap,kt.bumpmap,kt.normalmap,kt.displacementmap,kt.roughnessmap,kt.metalnessmap,kt.fog,kt.lights,{emissive:{value:new Me(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:ve.meshphysical_vert,fragmentShader:ve.meshphysical_frag},toon:{uniforms:qn([kt.common,kt.aomap,kt.lightmap,kt.emissivemap,kt.bumpmap,kt.normalmap,kt.displacementmap,kt.gradientmap,kt.fog,kt.lights,{emissive:{value:new Me(0)}}]),vertexShader:ve.meshtoon_vert,fragmentShader:ve.meshtoon_frag},matcap:{uniforms:qn([kt.common,kt.bumpmap,kt.normalmap,kt.displacementmap,kt.fog,{matcap:{value:null}}]),vertexShader:ve.meshmatcap_vert,fragmentShader:ve.meshmatcap_frag},points:{uniforms:qn([kt.points,kt.fog]),vertexShader:ve.points_vert,fragmentShader:ve.points_frag},dashed:{uniforms:qn([kt.common,kt.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:ve.linedashed_vert,fragmentShader:ve.linedashed_frag},depth:{uniforms:qn([kt.common,kt.displacementmap]),vertexShader:ve.depth_vert,fragmentShader:ve.depth_frag},normal:{uniforms:qn([kt.common,kt.bumpmap,kt.normalmap,kt.displacementmap,{opacity:{value:1}}]),vertexShader:ve.meshnormal_vert,fragmentShader:ve.meshnormal_frag},sprite:{uniforms:qn([kt.sprite,kt.fog]),vertexShader:ve.sprite_vert,fragmentShader:ve.sprite_frag},background:{uniforms:{uvTransform:{value:new de},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:ve.background_vert,fragmentShader:ve.background_frag},backgroundCube:{uniforms:{envMap:{value:null},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new de}},vertexShader:ve.backgroundCube_vert,fragmentShader:ve.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:ve.cube_vert,fragmentShader:ve.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:ve.equirect_vert,fragmentShader:ve.equirect_frag},distance:{uniforms:qn([kt.common,kt.displacementmap,{referencePosition:{value:new nt},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:ve.distance_vert,fragmentShader:ve.distance_frag},shadow:{uniforms:qn([kt.lights,kt.fog,{color:{value:new Me(0)},opacity:{value:1}}]),vertexShader:ve.shadow_vert,fragmentShader:ve.shadow_frag}};ua.physical={uniforms:qn([ua.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new de},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new de},clearcoatNormalScale:{value:new le(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new de},dispersion:{value:0},retroreflectivity:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new de},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new de},sheen:{value:0},sheenColor:{value:new Me(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new de},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new de},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new de},transmissionSamplerSize:{value:new le},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new de},attenuationDistance:{value:0},attenuationColor:{value:new Me(0)},specularColor:{value:new Me(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new de},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new de},anisotropyVector:{value:new le},anisotropyMap:{value:null},anisotropyMapTransform:{value:new de}}]),vertexShader:ve.meshphysical_vert,fragmentShader:ve.meshphysical_frag};const Rc={r:0,b:0,g:0},UA=new ln,MS=new de;MS.set(-1,0,0,0,1,0,0,0,1);function LA(o,e,i,s,l,f){const h=new Me(0);let d=l===!0?0:1,m,p,x=null,_=0,v=null;function M(O){let G=O.isScene===!0?O.background:null;if(G&&G.isTexture){const C=O.backgroundBlurriness>0;G=e.get(G,C)}return G}function R(O){let G=!1;const C=M(O);C===null?y(h,d):C&&C.isColor&&(y(C,1),G=!0);const D=o.xr.getEnvironmentBlendMode();D==="additive"?i.buffers.color.setClear(0,0,0,1,f):D==="alpha-blend"&&i.buffers.color.setClear(0,0,0,0,f),(o.autoClear||G)&&(i.buffers.depth.setTest(!0),i.buffers.depth.setMask(!0),i.buffers.color.setMask(!0),o.clear(o.autoClearColor,o.autoClearDepth,o.autoClearStencil))}function w(O,G){const C=M(G);C&&(C.isCubeTexture||C.mapping===kc)?(p===void 0&&(p=new ze(new _i(1,1,1),new ga({name:"BackgroundCubeMaterial",uniforms:mo(ua.backgroundCube.uniforms),vertexShader:ua.backgroundCube.vertexShader,fragmentShader:ua.backgroundCube.fragmentShader,side:ai,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),p.geometry.deleteAttribute("normal"),p.geometry.deleteAttribute("uv"),p.onBeforeRender=function(D,N,P){this.matrixWorld.copyPosition(P.matrixWorld)},Object.defineProperty(p.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),s.update(p)),p.material.uniforms.envMap.value=C,p.material.uniforms.backgroundBlurriness.value=G.backgroundBlurriness,p.material.uniforms.backgroundIntensity.value=G.backgroundIntensity,p.material.uniforms.backgroundRotation.value.setFromMatrix4(UA.makeRotationFromEuler(G.backgroundRotation)).transpose(),C.isCubeTexture&&C.isRenderTargetTexture===!1&&p.material.uniforms.backgroundRotation.value.premultiply(MS),p.material.toneMapped=Oe.getTransfer(C.colorSpace)!==qe,(x!==C||_!==C.version||v!==o.toneMapping)&&(p.material.needsUpdate=!0,x=C,_=C.version,v=o.toneMapping),p.layers.enableAll(),O.unshift(p,p.geometry,p.material,0,0,null)):C&&C.isTexture&&(m===void 0&&(m=new ze(new po(2,2),new ga({name:"BackgroundMaterial",uniforms:mo(ua.background.uniforms),vertexShader:ua.background.vertexShader,fragmentShader:ua.background.fragmentShader,side:nr,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),m.geometry.deleteAttribute("normal"),Object.defineProperty(m.material,"map",{get:function(){return this.uniforms.t2D.value}}),s.update(m)),m.material.uniforms.t2D.value=C,m.material.uniforms.backgroundIntensity.value=G.backgroundIntensity,m.material.toneMapped=Oe.getTransfer(C.colorSpace)!==qe,C.matrixAutoUpdate===!0&&C.updateMatrix(),m.material.uniforms.uvTransform.value.copy(C.matrix),(x!==C||_!==C.version||v!==o.toneMapping)&&(m.material.needsUpdate=!0,x=C,_=C.version,v=o.toneMapping),m.layers.enableAll(),O.unshift(m,m.geometry,m.material,0,0,null))}function y(O,G){O.getRGB(Rc,vS(o)),i.buffers.color.setClear(Rc.r,Rc.g,Rc.b,G,f)}function S(){p!==void 0&&(p.geometry.dispose(),p.material.dispose(),p=void 0),m!==void 0&&(m.geometry.dispose(),m.material.dispose(),m=void 0)}return{getClearColor:function(){return h},setClearColor:function(O,G=1){h.set(O),d=G,y(h,d)},getClearAlpha:function(){return d},setClearAlpha:function(O){d=O,y(h,d)},render:R,addToRenderList:w,dispose:S}}function OA(o,e){const i=o.getParameter(o.MAX_VERTEX_ATTRIBS),s={},l=v(null);let f=l,h=!1;function d(V,Q,st,Y,tt){let W=!1;const q=_(V,Y,st,Q);f!==q&&(f=q,p(f.object)),W=M(V,Y,st,tt),W&&R(V,Y,st,tt),tt!==null&&e.update(tt,o.ELEMENT_ARRAY_BUFFER),(W||h)&&(h=!1,C(V,Q,st,Y),tt!==null&&o.bindBuffer(o.ELEMENT_ARRAY_BUFFER,e.get(tt).buffer))}function m(){return o.createVertexArray()}function p(V){return o.bindVertexArray(V)}function x(V){return o.deleteVertexArray(V)}function _(V,Q,st,Y){const tt=Y.wireframe===!0;let W=s[Q.id];W===void 0&&(W={},s[Q.id]=W);const q=V.isInstancedMesh===!0?V.id:0;let dt=W[q];dt===void 0&&(dt={},W[q]=dt);let ct=dt[st.id];ct===void 0&&(ct={},dt[st.id]=ct);let rt=ct[tt];return rt===void 0&&(rt=v(m()),ct[tt]=rt),rt}function v(V){const Q=[],st=[],Y=[];for(let tt=0;tt<i;tt++)Q[tt]=0,st[tt]=0,Y[tt]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:Q,enabledAttributes:st,attributeDivisors:Y,object:V,attributes:{},index:null}}function M(V,Q,st,Y){const tt=f.attributes,W=Q.attributes;let q=0;const dt=st.getAttributes();for(const ct in dt)if(dt[ct].location>=0){const bt=tt[ct];let Gt=W[ct];if(Gt===void 0&&(ct==="instanceMatrix"&&V.instanceMatrix&&(Gt=V.instanceMatrix),ct==="instanceColor"&&V.instanceColor&&(Gt=V.instanceColor)),bt===void 0||bt.attribute!==Gt||Gt&&bt.data!==Gt.data)return!0;q++}return f.attributesNum!==q||f.index!==Y}function R(V,Q,st,Y){const tt={},W=Q.attributes;let q=0;const dt=st.getAttributes();for(const ct in dt)if(dt[ct].location>=0){let bt=W[ct];bt===void 0&&(ct==="instanceMatrix"&&V.instanceMatrix&&(bt=V.instanceMatrix),ct==="instanceColor"&&V.instanceColor&&(bt=V.instanceColor));const Gt={};Gt.attribute=bt,bt&&bt.data&&(Gt.data=bt.data),tt[ct]=Gt,q++}f.attributes=tt,f.attributesNum=q,f.index=Y}function w(){const V=f.newAttributes;for(let Q=0,st=V.length;Q<st;Q++)V[Q]=0}function y(V){S(V,0)}function S(V,Q){const st=f.newAttributes,Y=f.enabledAttributes,tt=f.attributeDivisors;st[V]=1,Y[V]===0&&(o.enableVertexAttribArray(V),Y[V]=1),tt[V]!==Q&&(o.vertexAttribDivisor(V,Q),tt[V]=Q)}function O(){const V=f.newAttributes,Q=f.enabledAttributes;for(let st=0,Y=Q.length;st<Y;st++)Q[st]!==V[st]&&(o.disableVertexAttribArray(st),Q[st]=0)}function G(V,Q,st,Y,tt,W,q){q===!0?o.vertexAttribIPointer(V,Q,st,tt,W):o.vertexAttribPointer(V,Q,st,Y,tt,W)}function C(V,Q,st,Y){w();const tt=Y.attributes,W=st.getAttributes(),q=Q.defaultAttributeValues;for(const dt in W){const ct=W[dt];if(ct.location>=0){let rt=tt[dt];if(rt===void 0&&(dt==="instanceMatrix"&&V.instanceMatrix&&(rt=V.instanceMatrix),dt==="instanceColor"&&V.instanceColor&&(rt=V.instanceColor)),rt!==void 0){const bt=rt.normalized,Gt=rt.itemSize,Ot=e.get(rt);if(Ot===void 0)continue;const z=Ot.buffer,_t=Ot.type,Nt=Ot.bytesPerElement,Z=_t===o.INT||_t===o.UNSIGNED_INT||rt.gpuType===em;if(rt.isInterleavedBufferAttribute){const ft=rt.data,wt=ft.stride,Pt=rt.offset;if(ft.isInstancedInterleavedBuffer){for(let vt=0;vt<ct.locationSize;vt++)S(ct.location+vt,ft.meshPerAttribute);V.isInstancedMesh!==!0&&Y._maxInstanceCount===void 0&&(Y._maxInstanceCount=ft.meshPerAttribute*ft.count)}else for(let vt=0;vt<ct.locationSize;vt++)y(ct.location+vt);o.bindBuffer(o.ARRAY_BUFFER,z);for(let vt=0;vt<ct.locationSize;vt++)G(ct.location+vt,Gt/ct.locationSize,_t,bt,wt*Nt,(Pt+Gt/ct.locationSize*vt)*Nt,Z)}else{if(rt.isInstancedBufferAttribute){for(let ft=0;ft<ct.locationSize;ft++)S(ct.location+ft,rt.meshPerAttribute);V.isInstancedMesh!==!0&&Y._maxInstanceCount===void 0&&(Y._maxInstanceCount=rt.meshPerAttribute*rt.count)}else for(let ft=0;ft<ct.locationSize;ft++)y(ct.location+ft);o.bindBuffer(o.ARRAY_BUFFER,z);for(let ft=0;ft<ct.locationSize;ft++)G(ct.location+ft,Gt/ct.locationSize,_t,bt,Gt*Nt,Gt/ct.locationSize*ft*Nt,Z)}}else if(q!==void 0){const bt=q[dt];if(bt!==void 0)switch(bt.length){case 2:o.vertexAttrib2fv(ct.location,bt);break;case 3:o.vertexAttrib3fv(ct.location,bt);break;case 4:o.vertexAttrib4fv(ct.location,bt);break;default:o.vertexAttrib1fv(ct.location,bt)}}}}O()}function D(){U();for(const V in s){const Q=s[V];for(const st in Q){const Y=Q[st];for(const tt in Y){const W=Y[tt];for(const q in W)x(W[q].object),delete W[q];delete Y[tt]}}delete s[V]}}function N(V){if(s[V.id]===void 0)return;const Q=s[V.id];for(const st in Q){const Y=Q[st];for(const tt in Y){const W=Y[tt];for(const q in W)x(W[q].object),delete W[q];delete Y[tt]}}delete s[V.id]}function P(V){for(const Q in s){const st=s[Q];for(const Y in st){const tt=st[Y];if(tt[V.id]===void 0)continue;const W=tt[V.id];for(const q in W)x(W[q].object),delete W[q];delete tt[V.id]}}}function T(V){for(const Q in s){const st=s[Q],Y=V.isInstancedMesh===!0?V.id:0,tt=st[Y];if(tt!==void 0){for(const W in tt){const q=tt[W];for(const dt in q)x(q[dt].object),delete q[dt];delete tt[W]}delete st[Y],Object.keys(st).length===0&&delete s[Q]}}}function U(){F(),h=!0,f!==l&&(f=l,p(f.object))}function F(){l.geometry=null,l.program=null,l.wireframe=!1}return{setup:d,reset:U,resetDefaultState:F,dispose:D,releaseStatesOfGeometry:N,releaseStatesOfObject:T,releaseStatesOfProgram:P,initAttributes:w,enableAttribute:y,disableUnusedAttributes:O}}function PA(o,e,i){let s;function l(m){s=m}function f(m,p){o.drawArrays(s,m,p),i.update(p,s,1)}function h(m,p,x){x!==0&&(o.drawArraysInstanced(s,m,p,x),i.update(p,s,x))}function d(m,p,x){if(x===0)return;e.get("WEBGL_multi_draw").multiDrawArraysWEBGL(s,m,0,p,0,x);let v=0;for(let M=0;M<x;M++)v+=p[M];i.update(v,s,1)}this.setMode=l,this.render=f,this.renderInstances=h,this.renderMultiDraw=d}function IA(o,e,i,s){let l;function f(){if(l!==void 0)return l;if(e.has("EXT_texture_filter_anisotropic")===!0){const P=e.get("EXT_texture_filter_anisotropic");l=o.getParameter(P.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else l=0;return l}function h(P){return!(P!==ki&&s.convert(P)!==o.getParameter(o.IMPLEMENTATION_COLOR_READ_FORMAT))}function d(P){const T=P===ma&&(e.has("EXT_color_buffer_half_float")||e.has("EXT_color_buffer_float"));return!(P!==xi&&P!==fa&&!T&&s.convert(P)!==o.getParameter(o.IMPLEMENTATION_COLOR_READ_TYPE))}function m(P){if(P==="highp"){if(o.getShaderPrecisionFormat(o.VERTEX_SHADER,o.HIGH_FLOAT).precision>0&&o.getShaderPrecisionFormat(o.FRAGMENT_SHADER,o.HIGH_FLOAT).precision>0)return"highp";P="mediump"}return P==="mediump"&&o.getShaderPrecisionFormat(o.VERTEX_SHADER,o.MEDIUM_FLOAT).precision>0&&o.getShaderPrecisionFormat(o.FRAGMENT_SHADER,o.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let p=i.precision!==void 0?i.precision:"highp";const x=m(p);x!==p&&(oe("WebGLRenderer:",p,"not supported, using",x,"instead."),p=x);const _=i.logarithmicDepthBuffer===!0,v=i.reversedDepthBuffer===!0&&e.has("EXT_clip_control");i.reversedDepthBuffer===!0&&v===!1&&oe("WebGLRenderer: Unable to use reversed depth buffer due to missing EXT_clip_control extension. Fallback to default depth buffer.");const M=o.getParameter(o.MAX_TEXTURE_IMAGE_UNITS),R=o.getParameter(o.MAX_VERTEX_TEXTURE_IMAGE_UNITS),w=o.getParameter(o.MAX_TEXTURE_SIZE),y=o.getParameter(o.MAX_CUBE_MAP_TEXTURE_SIZE),S=o.getParameter(o.MAX_VERTEX_ATTRIBS),O=o.getParameter(o.MAX_VERTEX_UNIFORM_VECTORS),G=o.getParameter(o.MAX_VARYING_VECTORS),C=o.getParameter(o.MAX_FRAGMENT_UNIFORM_VECTORS),D=o.getParameter(o.MAX_SAMPLES),N=o.getParameter(o.SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:f,getMaxPrecision:m,textureFormatReadable:h,textureTypeReadable:d,precision:p,logarithmicDepthBuffer:_,reversedDepthBuffer:v,maxTextures:M,maxVertexTextures:R,maxTextureSize:w,maxCubemapSize:y,maxAttributes:S,maxVertexUniforms:O,maxVaryings:G,maxFragmentUniforms:C,maxSamples:D,samples:N}}function zA(o){const e=this;let i=null,s=0,l=!1,f=!1;const h=new za,d=new de,m={value:null,needsUpdate:!1};this.uniform=m,this.numPlanes=0,this.numIntersection=0,this.init=function(_,v){const M=_.length!==0||v||s!==0||l;return l=v,s=_.length,M},this.beginShadows=function(){f=!0,x(null)},this.endShadows=function(){f=!1},this.setGlobalState=function(_,v){i=x(_,v,0)},this.setState=function(_,v,M){const R=_.clippingPlanes,w=_.clipIntersection,y=_.clipShadows,S=o.get(_);if(!l||R===null||R.length===0||f&&!y)f?x(null):p();else{const O=f?0:s,G=O*4;let C=S.clippingState||null;m.value=C,C=x(R,v,G,M);for(let D=0;D!==G;++D)C[D]=i[D];S.clippingState=C,this.numIntersection=w?this.numPlanes:0,this.numPlanes+=O}};function p(){m.value!==i&&(m.value=i,m.needsUpdate=s>0),e.numPlanes=s,e.numIntersection=0}function x(_,v,M,R){const w=_!==null?_.length:0;let y=null;if(w!==0){if(y=m.value,R!==!0||y===null){const S=M+w*4,O=v.matrixWorldInverse;d.getNormalMatrix(O),(y===null||y.length<S)&&(y=new Float32Array(S));for(let G=0,C=M;G!==w;++G,C+=4)h.copy(_[G]).applyMatrix4(O,d),h.normal.toArray(y,C),y[C+3]=h.constant}m.value=y,m.needsUpdate=!0}return e.numPlanes=w,e.numIntersection=0,y}}const lo=4,BA=6,FA=20,HA=256,Sl=new xm,Sx=new Me;let tp=null,ep=0,np=0,ip=!1;const GA=new nt,$s=new nt;class yx{constructor(e){this._renderer=e,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._sizeLods=[],this._lodMeshes=[],this._backgroundBox=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._blurMaterial=null,this._ggxMaterial=null}fromScene(e,i=0,s=.1,l=100,f={}){const{size:h=256,position:d=GA}=f;tp=this._renderer.getRenderTarget(),ep=this._renderer.getActiveCubeFace(),np=this._renderer.getActiveMipmapLevel(),ip=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(h);const m=this._allocateTargets();return m.depthBuffer=!0,this._sceneToCubeUV(e,s,l,m,d),i>0&&this._blur(m,0,0,i),this._applyPMREM(m),this._cleanup(m),m}fromEquirectangular(e,i=null){return this._fromTexture(e,i)}fromCubemap(e,i=null){return this._fromTexture(e,i)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=Tx(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=Ex(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose(),this._backgroundBox!==null&&(this._backgroundBox.geometry.dispose(),this._backgroundBox.material.dispose())}_setSize(e){this._lodMax=Math.floor(Math.log2(e)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._ggxMaterial!==null&&this._ggxMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let e=0;e<this._lodMeshes.length;e++)this._lodMeshes[e].geometry.dispose()}_cleanup(e){this._renderer.setRenderTarget(tp,ep,np),this._renderer.xr.enabled=ip,e.scissorTest=!1,so(e,0,0,e.width,e.height)}_fromTexture(e,i){e.mapping===ir||e.mapping===ho?this._setSize(e.image.length===0?16:e.image[0].width||e.image[0].image.width):this._setSize(e.image.width/4),tp=this._renderer.getRenderTarget(),ep=this._renderer.getActiveCubeFace(),np=this._renderer.getActiveMipmapLevel(),ip=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;const s=i||this._allocateTargets();return this._textureToCubeUV(e,s),this._applyPMREM(s),this._cleanup(s),s}_allocateTargets(){const e=3*Math.max(this._cubeSize,112),i=4*this._cubeSize,s={magFilter:Gn,minFilter:Gn,generateMipmaps:!1,type:ma,format:ki,colorSpace:Bc,depthBuffer:!1},l=Mx(e,i,s);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==e||this._pingPongRenderTarget.height!==i){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=Mx(e,i,s);const{_lodMax:f}=this;({lodMeshes:this._lodMeshes,sizeLods:this._sizeLods}=VA(f)),this._blurMaterial=kA(f,e,i),this._ggxMaterial=XA(f,e,i)}return l}_compileMaterial(e){const i=new ze(new Kn,e);this._renderer.compile(i,Sl)}_sceneToCubeUV(e,i,s,l,f){const m=new vi(90,1,i,s),p=[1,-1,1,1,1,1],x=[1,1,1,-1,-1,-1],_=this._renderer,v=_.autoClear,M=_.toneMapping;_.getClearColor(Sx),_.toneMapping=da,_.autoClear=!1,_.state.buffers.depth.getReversed()&&(_.setRenderTarget(l),_.clearDepth(),_.setRenderTarget(null)),this._backgroundBox===null&&(this._backgroundBox=new ze(new _i,new hm({name:"PMREM.Background",side:ai,depthWrite:!1,depthTest:!1})));const w=this._backgroundBox,y=w.material;let S=!1;const O=e.background;O?O.isColor&&(y.color.copy(O),e.background=null,S=!0):(y.color.copy(Sx),S=!0);for(let G=0;G<6;G++){const C=G%3;C===0?(m.up.set(0,p[G],0),m.position.set(f.x,f.y,f.z),m.lookAt(f.x+x[G],f.y,f.z)):C===1?(m.up.set(0,0,p[G]),m.position.set(f.x,f.y,f.z),m.lookAt(f.x,f.y+x[G],f.z)):(m.up.set(0,p[G],0),m.position.set(f.x,f.y,f.z),m.lookAt(f.x,f.y,f.z+x[G]));const D=this._cubeSize;so(l,C*D,G>2?D:0,D,D),_.setRenderTarget(l),S&&_.render(w,m),_.render(e,m)}_.toneMapping=M,_.autoClear=v,e.background=O}_textureToCubeUV(e,i){const s=this._renderer,l=e.mapping===ir||e.mapping===ho;l?(this._cubemapMaterial===null&&(this._cubemapMaterial=Tx()),this._cubemapMaterial.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=Ex());const f=l?this._cubemapMaterial:this._equirectMaterial,h=this._lodMeshes[0];h.material=f;const d=f.uniforms;d.envMap.value=e;const m=this._cubeSize;so(i,0,0,3*m,2*m),s.setRenderTarget(i),s.render(h,Sl)}_applyPMREM(e){const i=this._renderer,s=i.autoClear;i.autoClear=!1;const l=this._lodMeshes.length;for(let f=1;f<l;f++)this._applyGGXFilter(e,f-1,f);i.autoClear=s}_applyGGXFilter(e,i,s){const l=this._renderer,f=this._pingPongRenderTarget,h=this._ggxMaterial,d=this._lodMeshes[s];d.material=h;const m=h.uniforms,p=s/(this._lodMeshes.length-1),x=i/(this._lodMeshes.length-1),_=Math.sqrt(p*p-x*x),v=p*1.25,M=_*v,{_lodMax:R}=this,w=this._sizeLods[s],y=3*w*(s>R-lo?s-R+lo:0),S=4*(this._cubeSize-w);m.envMap.value=e.texture,m.roughness.value=M,m.mipInt.value=R-i,so(f,y,S,3*w,2*w),l.setRenderTarget(f),l.render(d,Sl),m.envMap.value=f.texture,m.roughness.value=0,m.mipInt.value=R-s,so(e,y,S,3*w,2*w),l.setRenderTarget(e),l.render(d,Sl)}_blur(e,i,s,l){const f=this._pingPongRenderTarget,h=Math.min(l,Math.PI)/Math.SQRT2;this._blurPass(e,f,i,s,h),this._blurPass(f,e,s,s,h)}_blurPass(e,i,s,l,f){const h=this._renderer,d=this._blurMaterial,m=this._lodMeshes[l];m.material=d;const p=d.uniforms;p.envMap.value=e.texture,p.sigma.value=f,p.mipInt.value=this._lodMax-s;const x=this._sizeLods[l],_=3*x*(l>this._lodMax-lo?l-this._lodMax+lo:0),v=4*(this._cubeSize-x);so(i,_,v,3*x,2*x),h.setRenderTarget(i),h.render(m,Sl)}}function VA(o){const e=[],i=[];let s=o;const l=o-lo+1+BA;for(let f=0;f<l;f++){const h=Math.pow(2,s);e.push(h);const d=1/(h-2),m=-d,p=1+d,x=[m,m,p,m,p,p,m,m,p,p,m,p],_=6,v=6,M=3,R=new Float32Array(M*v*_),w=new Float32Array(M*v*_);for(let S=0;S<_;S++){const O=S%3*2/3-1,G=S>2?0:-1,C=[O,G,0,O+2/3,G,0,O+2/3,G+1,0,O,G,0,O+2/3,G+1,0,O,G+1,0];R.set(C,M*v*S);for(let D=0;D<v;D++){const N=x[D*2]*2-1,P=x[D*2+1]*2-1;S===0?$s.set(1,P,N):S===1?$s.set(-N,1,-P):S===2?$s.set(-N,P,1):S===3?$s.set(-1,P,-N):S===4?$s.set(-N,-1,P):$s.set(N,P,-1),$s.toArray(w,(S*v+D)*M)}}const y=new Kn;y.setAttribute("position",new Ga(R,M)),y.setAttribute("outputDirection",new Ga(w,M)),i.push(new ze(y,null)),s>lo&&s--}return{lodMeshes:i,sizeLods:e}}function Mx(o,e,i){const s=new Wi(o,e,i);return s.texture.mapping=kc,s.texture.name="PMREM.cubeUv",s.scissorTest=!0,s}function so(o,e,i,s,l){o.viewport.set(e,i,s,l),o.scissor.set(e,i,s,l)}function XA(o,e,i){return new ga({name:"PMREMGGXConvolution",defines:{GGX_SAMPLES:HA,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/i,CUBEUV_MAX_MIP:`${o}.0`},uniforms:{envMap:{value:null},roughness:{value:0},mipInt:{value:0}},vertexShader:Yc(),fragmentShader:`

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
		`,blending:Fa,depthTest:!1,depthWrite:!1})}function kA(o,e,i){return new ga({name:"SphericalGaussianBlur",defines:{SAMPLES:FA,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/i,CUBEUV_MAX_MIP:`${o}.0`},uniforms:{envMap:{value:null},sigma:{value:0},mipInt:{value:0}},vertexShader:Yc(),fragmentShader:`

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
		`,blending:Fa,depthTest:!1,depthWrite:!1})}function Ex(){return new ga({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:Yc(),fragmentShader:`

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
		`,blending:Fa,depthTest:!1,depthWrite:!1})}function Tx(){return new ga({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:Yc(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:Fa,depthTest:!1,depthWrite:!1})}function Yc(){return`

		precision mediump float;
		precision mediump int;

		attribute vec3 outputDirection;

		varying vec3 vOutputDirection;

		void main() {

			vOutputDirection = outputDirection;
			gl_Position = vec4( position, 1.0 );

		}
	`}class ES extends Wi{constructor(e=1,i={}){super(e,e,i),this.isWebGLCubeRenderTarget=!0;const s={width:e,height:e,depth:1},l=[s,s,s,s,s,s];this.texture=new gS(l),this._setTextureOptions(i),this.texture.isRenderTargetTexture=!0}fromEquirectangularTexture(e,i){this.texture.type=i.type,this.texture.colorSpace=i.colorSpace,this.texture.generateMipmaps=i.generateMipmaps,this.texture.minFilter=i.minFilter,this.texture.magFilter=i.magFilter;const s={uniforms:{tEquirect:{value:null}},vertexShader:`

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
			`},l=new _i(5,5,5),f=new ga({name:"CubemapFromEquirect",uniforms:mo(s.uniforms),vertexShader:s.vertexShader,fragmentShader:s.fragmentShader,side:ai,blending:Fa});f.uniforms.tEquirect.value=i;const h=new ze(l,f),d=i.minFilter;return i.minFilter===tr&&(i.minFilter=Gn),new YT(1,10,this).update(e,h),i.minFilter=d,h.geometry.dispose(),h.material.dispose(),this}clear(e,i=!0,s=!0,l=!0){const f=e.getRenderTarget();for(let h=0;h<6;h++)e.setRenderTarget(this,h),e.clear(i,s,l);e.setRenderTarget(f)}}function WA(o){let e=new WeakMap,i=new WeakMap,s=null;function l(v,M=!1){return v==null?null:M?h(v):f(v)}function f(v){if(v&&v.isTexture){const M=v.mapping;if(M===Ad||M===Rd)if(e.has(v)){const R=e.get(v).texture;return d(R,v.mapping)}else{const R=v.image;if(R&&R.height>0){const w=new ES(R.height);return w.fromEquirectangularTexture(o,v),e.set(v,w),v.addEventListener("dispose",p),d(w.texture,v.mapping)}else return null}}return v}function h(v){if(v&&v.isTexture){const M=v.mapping,R=M===Ad||M===Rd,w=M===ir||M===ho;if(R||w){let y=i.get(v);const S=y!==void 0?y.texture.pmremVersion:0;if(v.isRenderTargetTexture&&v.pmremVersion!==S)return s===null&&(s=new yx(o)),y=R?s.fromEquirectangular(v,y):s.fromCubemap(v,y),y.texture.pmremVersion=v.pmremVersion,i.set(v,y),y.texture;if(y!==void 0)return y.texture;{const O=v.image;return R&&O&&O.height>0||w&&O&&m(O)?(s===null&&(s=new yx(o)),y=R?s.fromEquirectangular(v):s.fromCubemap(v),y.texture.pmremVersion=v.pmremVersion,i.set(v,y),v.addEventListener("dispose",x),y.texture):null}}}return v}function d(v,M){return M===Ad?v.mapping=ir:M===Rd&&(v.mapping=ho),v}function m(v){let M=0;const R=6;for(let w=0;w<R;w++)v[w]!==void 0&&M++;return M===R}function p(v){const M=v.target;M.removeEventListener("dispose",p);const R=e.get(M);R!==void 0&&(e.delete(M),R.dispose())}function x(v){const M=v.target;M.removeEventListener("dispose",x);const R=i.get(M);R!==void 0&&(i.delete(M),R.dispose())}function _(){e=new WeakMap,i=new WeakMap,s!==null&&(s.dispose(),s=null)}return{get:l,dispose:_}}function YA(o){const e={};function i(s){if(e[s]!==void 0)return e[s];const l=o.getExtension(s);return e[s]=l,l}return{has:function(s){return i(s)!==null},init:function(){i("EXT_color_buffer_float"),i("WEBGL_clip_cull_distance"),i("OES_texture_float_linear"),i("EXT_color_buffer_half_float"),i("WEBGL_multisampled_render_to_texture"),i("WEBGL_render_shared_exponent")},get:function(s){const l=i(s);return l===null&&co("WebGLRenderer: "+s+" extension not supported."),l}}}function qA(o,e,i,s){const l={},f=new WeakMap;function h(_){const v=_.target;v.index!==null&&e.remove(v.index);for(const R in v.attributes)e.remove(v.attributes[R]);v.removeEventListener("dispose",h),delete l[v.id];const M=f.get(v);M&&(e.remove(M),f.delete(v)),s.releaseStatesOfGeometry(v),v.isInstancedBufferGeometry===!0&&delete v._maxInstanceCount,i.memory.geometries--}function d(_,v){return l[v.id]===!0||(v.addEventListener("dispose",h),l[v.id]=!0,i.memory.geometries++),v}function m(_){const v=_.attributes;for(const M in v)e.update(v[M],o.ARRAY_BUFFER)}function p(_){const v=[],M=_.index,R=_.attributes.position;let w=0;if(R===void 0)return;if(M!==null){const O=M.array;w=M.version;for(let G=0,C=O.length;G<C;G+=3){const D=O[G+0],N=O[G+1],P=O[G+2];v.push(D,N,N,P,P,D)}}else{const O=R.array;w=R.version;for(let G=0,C=O.length/3-1;G<C;G+=3){const D=G+0,N=G+1,P=G+2;v.push(D,N,N,P,P,D)}}const y=new(R.count>=65535?pS:dS)(v,1);y.version=w;const S=f.get(_);S&&e.remove(S),f.set(_,y)}function x(_){const v=f.get(_);if(v){const M=_.index;M!==null&&v.version<M.version&&p(_)}else p(_);return f.get(_)}return{get:d,update:m,getWireframeAttribute:x}}function ZA(o,e,i){let s;function l(_){s=_}let f,h;function d(_){f=_.type,h=_.bytesPerElement}function m(_,v){o.drawElements(s,v,f,_*h),i.update(v,s,1)}function p(_,v,M){M!==0&&(o.drawElementsInstanced(s,v,f,_*h,M),i.update(v,s,M))}function x(_,v,M){if(M===0)return;e.get("WEBGL_multi_draw").multiDrawElementsWEBGL(s,v,0,f,_,0,M);let w=0;for(let y=0;y<M;y++)w+=v[y];i.update(w,s,1)}this.setMode=l,this.setIndex=d,this.render=m,this.renderInstances=p,this.renderMultiDraw=x}function jA(o){const e={geometries:0,textures:0},i={frame:0,calls:0,triangles:0,points:0,lines:0};function s(f,h,d){switch(i.calls++,h){case o.TRIANGLES:i.triangles+=d*(f/3);break;case o.LINES:i.lines+=d*(f/2);break;case o.LINE_STRIP:i.lines+=d*(f-1);break;case o.LINE_LOOP:i.lines+=d*f;break;case o.POINTS:i.points+=d*f;break;default:Fe("WebGLInfo: Unknown draw mode:",h);break}}function l(){i.calls=0,i.triangles=0,i.points=0,i.lines=0}return{memory:e,render:i,programs:null,autoReset:!0,reset:l,update:s}}function KA(o,e,i){const s=new WeakMap,l=new on;function f(h,d,m){const p=h.morphTargetInfluences,x=d.morphAttributes.position||d.morphAttributes.normal||d.morphAttributes.color,_=x!==void 0?x.length:0;let v=s.get(d);if(v===void 0||v.count!==_){let F=function(){T.dispose(),s.delete(d),d.removeEventListener("dispose",F)};var M=F;v!==void 0&&v.texture.dispose();const R=d.morphAttributes.position!==void 0,w=d.morphAttributes.normal!==void 0,y=d.morphAttributes.color!==void 0,S=d.morphAttributes.position||[],O=d.morphAttributes.normal||[],G=d.morphAttributes.color||[];let C=0;R===!0&&(C=1),w===!0&&(C=2),y===!0&&(C=3);let D=d.attributes.position.count*C,N=1;D>e.maxTextureSize&&(N=Math.ceil(D/e.maxTextureSize),D=e.maxTextureSize);const P=new Float32Array(D*N*4*_),T=new cS(P,D,N,_);T.type=fa,T.needsUpdate=!0;const U=C*4;for(let V=0;V<_;V++){const Q=S[V],st=O[V],Y=G[V],tt=D*N*4*V;for(let W=0;W<Q.count;W++){const q=W*U;R===!0&&(l.fromBufferAttribute(Q,W),P[tt+q+0]=l.x,P[tt+q+1]=l.y,P[tt+q+2]=l.z,P[tt+q+3]=0),w===!0&&(l.fromBufferAttribute(st,W),P[tt+q+4]=l.x,P[tt+q+5]=l.y,P[tt+q+6]=l.z,P[tt+q+7]=0),y===!0&&(l.fromBufferAttribute(Y,W),P[tt+q+8]=l.x,P[tt+q+9]=l.y,P[tt+q+10]=l.z,P[tt+q+11]=Y.itemSize===4?l.w:1)}}v={count:_,texture:T,size:new le(D,N)},s.set(d,v),d.addEventListener("dispose",F)}if(h.isInstancedMesh===!0&&h.morphTexture!==null)m.getUniforms().setValue(o,"morphTexture",h.morphTexture,i);else{let R=0;for(let y=0;y<p.length;y++)R+=p[y];const w=d.morphTargetsRelative?1:1-R;m.getUniforms().setValue(o,"morphTargetBaseInfluence",w),m.getUniforms().setValue(o,"morphTargetInfluences",p)}m.getUniforms().setValue(o,"morphTargetsTexture",v.texture,i),m.getUniforms().setValue(o,"morphTargetsTextureSize",v.size)}return{update:f}}function QA(o,e,i,s,l){let f=new WeakMap;function h(p){const x=l.render.frame,_=p.geometry,v=e.get(p,_);if(f.get(v)!==x&&(e.update(v),f.set(v,x)),p.isInstancedMesh&&(p.hasEventListener("dispose",m)===!1&&p.addEventListener("dispose",m),f.get(p)!==x&&(i.update(p.instanceMatrix,o.ARRAY_BUFFER),p.instanceColor!==null&&i.update(p.instanceColor,o.ARRAY_BUFFER),f.set(p,x))),p.isSkinnedMesh){const M=p.skeleton;f.get(M)!==x&&(M.update(),f.set(M,x))}return v}function d(){f=new WeakMap}function m(p){const x=p.target;x.removeEventListener("dispose",m),s.releaseStatesOfObject(x),i.remove(x.instanceMatrix),x.instanceColor!==null&&i.remove(x.instanceColor)}return{update:h,dispose:d}}const JA={[Zx]:"LINEAR_TONE_MAPPING",[jx]:"REINHARD_TONE_MAPPING",[Kx]:"CINEON_TONE_MAPPING",[Qx]:"ACES_FILMIC_TONE_MAPPING",[$x]:"AGX_TONE_MAPPING",[tS]:"NEUTRAL_TONE_MAPPING",[Jx]:"CUSTOM_TONE_MAPPING"};function $A(o,e,i,s,l,f){const h=new Wi(e,i,{type:o,depthBuffer:l,stencilBuffer:f,samples:s?4:0,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,resolveDepthBuffer:!1,resolveStencilBuffer:!1});let d=null,m=null;const p=new Kn;p.setAttribute("position",new un([-1,3,0,-1,-1,0,3,-1,0],3)),p.setAttribute("uv",new un([0,2,0,0,2,0],2));const x=new FT({uniforms:{tDiffuse:{value:null}},vertexShader:`
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
			}`,depthTest:!1,depthWrite:!1}),_=new ze(p,x),v=new xm(-1,1,1,-1,0,1);let M=null,R=null,w=!1,y,S=null,O=[],G=!1;this.setSize=function(C,D){h.setSize(C,D),d!==null&&d.setSize(C,D),m!==null&&m.setSize(C,D);for(let N=0;N<O.length;N++){const P=O[N];P.setSize&&P.setSize(C,D)}},this.setEffects=function(C){O=C,G=O.length>0&&O[0].isRenderPass===!0;const D=h.width,N=h.height;O.length>0&&d===null&&(d=new Wi(D,N,{type:ma,depthBuffer:!1,stencilBuffer:!1}),m=new Wi(D,N,{type:ma,depthBuffer:!1,stencilBuffer:!1}));for(let P=0;P<O.length;P++){const T=O[P];T.setSize&&T.setSize(D,N)}},this.begin=function(C,D){if(w||C.toneMapping===da&&O.length===0)return!1;if(S=D,D!==null){const N=D.width,P=D.height;(h.width!==N||h.height!==P)&&this.setSize(N,P)}return G===!1&&C.setRenderTarget(h),y=C.toneMapping,C.toneMapping=da,!0},this.hasRenderPass=function(){return G},this.end=function(C,D){C.toneMapping=y,w=!0;let N=h,P=d;for(let T=0;T<O.length;T++){const U=O[T];U.enabled!==!1&&(U.render(C,P,N,D),U.needsSwap!==!1&&(N=P,P=P===d?m:d))}if(M!==C.outputColorSpace||R!==C.toneMapping){M=C.outputColorSpace,R=C.toneMapping,x.defines={},Oe.getTransfer(M)===qe&&(x.defines.SRGB_TRANSFER="");const T=JA[R];T&&(x.defines[T]=""),x.needsUpdate=!0}x.uniforms.tDiffuse.value=N.texture,C.setRenderTarget(S),C.render(_,v),S=null,w=!1},this.isCompositing=function(){return w},this.dispose=function(){h.dispose(),d!==null&&d.dispose(),m!==null&&m.dispose(),p.dispose(),x.dispose()}}const TS=new jn,Kp=new Nl(1,1),bS=new cS,AS=new pT,RS=new gS,bx=[],Ax=[],Rx=new Float32Array(16),Cx=new Float32Array(9),wx=new Float32Array(4);function _o(o,e,i){const s=o[0];if(s<=0||s>0)return o;const l=e*i;let f=bx[l];if(f===void 0&&(f=new Float32Array(l),bx[l]=f),e!==0){s.toArray(f,0);for(let h=1,d=0;h!==e;++h)d+=i,o[h].toArray(f,d)}return f}function Tn(o,e){if(o.length!==e.length)return!1;for(let i=0,s=o.length;i<s;i++)if(o[i]!==e[i])return!1;return!0}function bn(o,e){for(let i=0,s=e.length;i<s;i++)o[i]=e[i]}function qc(o,e){let i=Ax[e];i===void 0&&(i=new Int32Array(e),Ax[e]=i);for(let s=0;s!==e;++s)i[s]=o.allocateTextureUnit();return i}function tR(o,e){const i=this.cache;i[0]!==e&&(o.uniform1f(this.addr,e),i[0]=e)}function eR(o,e){const i=this.cache;if(e.x!==void 0)(i[0]!==e.x||i[1]!==e.y)&&(o.uniform2f(this.addr,e.x,e.y),i[0]=e.x,i[1]=e.y);else{if(Tn(i,e))return;o.uniform2fv(this.addr,e),bn(i,e)}}function nR(o,e){const i=this.cache;if(e.x!==void 0)(i[0]!==e.x||i[1]!==e.y||i[2]!==e.z)&&(o.uniform3f(this.addr,e.x,e.y,e.z),i[0]=e.x,i[1]=e.y,i[2]=e.z);else if(e.r!==void 0)(i[0]!==e.r||i[1]!==e.g||i[2]!==e.b)&&(o.uniform3f(this.addr,e.r,e.g,e.b),i[0]=e.r,i[1]=e.g,i[2]=e.b);else{if(Tn(i,e))return;o.uniform3fv(this.addr,e),bn(i,e)}}function iR(o,e){const i=this.cache;if(e.x!==void 0)(i[0]!==e.x||i[1]!==e.y||i[2]!==e.z||i[3]!==e.w)&&(o.uniform4f(this.addr,e.x,e.y,e.z,e.w),i[0]=e.x,i[1]=e.y,i[2]=e.z,i[3]=e.w);else{if(Tn(i,e))return;o.uniform4fv(this.addr,e),bn(i,e)}}function aR(o,e){const i=this.cache,s=e.elements;if(s===void 0){if(Tn(i,e))return;o.uniformMatrix2fv(this.addr,!1,e),bn(i,e)}else{if(Tn(i,s))return;wx.set(s),o.uniformMatrix2fv(this.addr,!1,wx),bn(i,s)}}function sR(o,e){const i=this.cache,s=e.elements;if(s===void 0){if(Tn(i,e))return;o.uniformMatrix3fv(this.addr,!1,e),bn(i,e)}else{if(Tn(i,s))return;Cx.set(s),o.uniformMatrix3fv(this.addr,!1,Cx),bn(i,s)}}function rR(o,e){const i=this.cache,s=e.elements;if(s===void 0){if(Tn(i,e))return;o.uniformMatrix4fv(this.addr,!1,e),bn(i,e)}else{if(Tn(i,s))return;Rx.set(s),o.uniformMatrix4fv(this.addr,!1,Rx),bn(i,s)}}function oR(o,e){const i=this.cache;i[0]!==e&&(o.uniform1i(this.addr,e),i[0]=e)}function lR(o,e){const i=this.cache;if(e.x!==void 0)(i[0]!==e.x||i[1]!==e.y)&&(o.uniform2i(this.addr,e.x,e.y),i[0]=e.x,i[1]=e.y);else{if(Tn(i,e))return;o.uniform2iv(this.addr,e),bn(i,e)}}function uR(o,e){const i=this.cache;if(e.x!==void 0)(i[0]!==e.x||i[1]!==e.y||i[2]!==e.z)&&(o.uniform3i(this.addr,e.x,e.y,e.z),i[0]=e.x,i[1]=e.y,i[2]=e.z);else{if(Tn(i,e))return;o.uniform3iv(this.addr,e),bn(i,e)}}function cR(o,e){const i=this.cache;if(e.x!==void 0)(i[0]!==e.x||i[1]!==e.y||i[2]!==e.z||i[3]!==e.w)&&(o.uniform4i(this.addr,e.x,e.y,e.z,e.w),i[0]=e.x,i[1]=e.y,i[2]=e.z,i[3]=e.w);else{if(Tn(i,e))return;o.uniform4iv(this.addr,e),bn(i,e)}}function fR(o,e){const i=this.cache;i[0]!==e&&(o.uniform1ui(this.addr,e),i[0]=e)}function hR(o,e){const i=this.cache;if(e.x!==void 0)(i[0]!==e.x||i[1]!==e.y)&&(o.uniform2ui(this.addr,e.x,e.y),i[0]=e.x,i[1]=e.y);else{if(Tn(i,e))return;o.uniform2uiv(this.addr,e),bn(i,e)}}function dR(o,e){const i=this.cache;if(e.x!==void 0)(i[0]!==e.x||i[1]!==e.y||i[2]!==e.z)&&(o.uniform3ui(this.addr,e.x,e.y,e.z),i[0]=e.x,i[1]=e.y,i[2]=e.z);else{if(Tn(i,e))return;o.uniform3uiv(this.addr,e),bn(i,e)}}function pR(o,e){const i=this.cache;if(e.x!==void 0)(i[0]!==e.x||i[1]!==e.y||i[2]!==e.z||i[3]!==e.w)&&(o.uniform4ui(this.addr,e.x,e.y,e.z,e.w),i[0]=e.x,i[1]=e.y,i[2]=e.z,i[3]=e.w);else{if(Tn(i,e))return;o.uniform4uiv(this.addr,e),bn(i,e)}}function mR(o,e,i){const s=this.cache,l=i.allocateTextureUnit();s[0]!==l&&(o.uniform1i(this.addr,l),s[0]=l);let f;this.type===o.SAMPLER_2D_SHADOW?(Kp.compareFunction=i.isReversedDepthBuffer()?lm:om,f=Kp):f=TS,i.setTexture2D(e||f,l)}function gR(o,e,i){const s=this.cache,l=i.allocateTextureUnit();s[0]!==l&&(o.uniform1i(this.addr,l),s[0]=l),i.setTexture3D(e||AS,l)}function _R(o,e,i){const s=this.cache,l=i.allocateTextureUnit();s[0]!==l&&(o.uniform1i(this.addr,l),s[0]=l),i.setTextureCube(e||RS,l)}function vR(o,e,i){const s=this.cache,l=i.allocateTextureUnit();s[0]!==l&&(o.uniform1i(this.addr,l),s[0]=l),i.setTexture2DArray(e||bS,l)}function xR(o){switch(o){case 5126:return tR;case 35664:return eR;case 35665:return nR;case 35666:return iR;case 35674:return aR;case 35675:return sR;case 35676:return rR;case 5124:case 35670:return oR;case 35667:case 35671:return lR;case 35668:case 35672:return uR;case 35669:case 35673:return cR;case 5125:return fR;case 36294:return hR;case 36295:return dR;case 36296:return pR;case 35678:case 36198:case 36298:case 36306:case 35682:return mR;case 35679:case 36299:case 36307:return gR;case 35680:case 36300:case 36308:case 36293:return _R;case 36289:case 36303:case 36311:case 36292:return vR}}function SR(o,e){o.uniform1fv(this.addr,e)}function yR(o,e){const i=_o(e,this.size,2);o.uniform2fv(this.addr,i)}function MR(o,e){const i=_o(e,this.size,3);o.uniform3fv(this.addr,i)}function ER(o,e){const i=_o(e,this.size,4);o.uniform4fv(this.addr,i)}function TR(o,e){const i=_o(e,this.size,4);o.uniformMatrix2fv(this.addr,!1,i)}function bR(o,e){const i=_o(e,this.size,9);o.uniformMatrix3fv(this.addr,!1,i)}function AR(o,e){const i=_o(e,this.size,16);o.uniformMatrix4fv(this.addr,!1,i)}function RR(o,e){o.uniform1iv(this.addr,e)}function CR(o,e){o.uniform2iv(this.addr,e)}function wR(o,e){o.uniform3iv(this.addr,e)}function DR(o,e){o.uniform4iv(this.addr,e)}function NR(o,e){o.uniform1uiv(this.addr,e)}function UR(o,e){o.uniform2uiv(this.addr,e)}function LR(o,e){o.uniform3uiv(this.addr,e)}function OR(o,e){o.uniform4uiv(this.addr,e)}function PR(o,e,i){const s=this.cache,l=e.length,f=qc(i,l);Tn(s,f)||(o.uniform1iv(this.addr,f),bn(s,f));let h;this.type===o.SAMPLER_2D_SHADOW?h=Kp:h=TS;for(let d=0;d!==l;++d)i.setTexture2D(e[d]||h,f[d])}function IR(o,e,i){const s=this.cache,l=e.length,f=qc(i,l);Tn(s,f)||(o.uniform1iv(this.addr,f),bn(s,f));for(let h=0;h!==l;++h)i.setTexture3D(e[h]||AS,f[h])}function zR(o,e,i){const s=this.cache,l=e.length,f=qc(i,l);Tn(s,f)||(o.uniform1iv(this.addr,f),bn(s,f));for(let h=0;h!==l;++h)i.setTextureCube(e[h]||RS,f[h])}function BR(o,e,i){const s=this.cache,l=e.length,f=qc(i,l);Tn(s,f)||(o.uniform1iv(this.addr,f),bn(s,f));for(let h=0;h!==l;++h)i.setTexture2DArray(e[h]||bS,f[h])}function FR(o){switch(o){case 5126:return SR;case 35664:return yR;case 35665:return MR;case 35666:return ER;case 35674:return TR;case 35675:return bR;case 35676:return AR;case 5124:case 35670:return RR;case 35667:case 35671:return CR;case 35668:case 35672:return wR;case 35669:case 35673:return DR;case 5125:return NR;case 36294:return UR;case 36295:return LR;case 36296:return OR;case 35678:case 36198:case 36298:case 36306:case 35682:return PR;case 35679:case 36299:case 36307:return IR;case 35680:case 36300:case 36308:case 36293:return zR;case 36289:case 36303:case 36311:case 36292:return BR}}class HR{constructor(e,i,s){this.id=e,this.addr=s,this.cache=[],this.type=i.type,this.setValue=xR(i.type)}}class GR{constructor(e,i,s){this.id=e,this.addr=s,this.cache=[],this.type=i.type,this.size=i.size,this.setValue=FR(i.type)}}class VR{constructor(e){this.id=e,this.seq=[],this.map={}}setValue(e,i,s){const l=this.seq;for(let f=0,h=l.length;f!==h;++f){const d=l[f];d.setValue(e,i[d.id],s)}}}const ap=/(\w+)(\])?(\[|\.)?/g;function Dx(o,e){o.seq.push(e),o.map[e.id]=e}function XR(o,e,i){const s=o.name,l=s.length;for(ap.lastIndex=0;;){const f=ap.exec(s),h=ap.lastIndex;let d=f[1];const m=f[2]==="]",p=f[3];if(m&&(d=d|0),p===void 0||p==="["&&h+2===l){Dx(i,p===void 0?new HR(d,o,e):new GR(d,o,e));break}else{let _=i.map[d];_===void 0&&(_=new VR(d),Dx(i,_)),i=_}}}class Oc{constructor(e,i){this.seq=[],this.map={};const s=e.getProgramParameter(i,e.ACTIVE_UNIFORMS);for(let h=0;h<s;++h){const d=e.getActiveUniform(i,h),m=e.getUniformLocation(i,d.name);XR(d,m,this)}const l=[],f=[];for(const h of this.seq)h.type===e.SAMPLER_2D_SHADOW||h.type===e.SAMPLER_CUBE_SHADOW||h.type===e.SAMPLER_2D_ARRAY_SHADOW?l.push(h):f.push(h);l.length>0&&(this.seq=l.concat(f))}setValue(e,i,s,l){const f=this.map[i];f!==void 0&&f.setValue(e,s,l)}setOptional(e,i,s){const l=i[s];l!==void 0&&this.setValue(e,s,l)}static upload(e,i,s,l){for(let f=0,h=i.length;f!==h;++f){const d=i[f],m=s[d.id];m.needsUpdate!==!1&&d.setValue(e,m.value,l)}}static seqWithValue(e,i){const s=[];for(let l=0,f=e.length;l!==f;++l){const h=e[l];h.id in i&&s.push(h)}return s}}function Nx(o,e,i){const s=o.createShader(e);return o.shaderSource(s,i),o.compileShader(s),s}const kR=37297;let WR=0;function YR(o,e){const i=o.split(`
`),s=[],l=Math.max(e-6,0),f=Math.min(e+6,i.length);for(let h=l;h<f;h++){const d=h+1;s.push(`${d===e?">":" "} ${d}: ${i[h]}`)}return s.join(`
`)}const Ux=new de;function qR(o){Oe._getMatrix(Ux,Oe.workingColorSpace,o);const e=`mat3( ${Ux.elements.map(i=>i.toFixed(4))} )`;switch(Oe.getTransfer(o)){case Fc:return[e,"LinearTransferOETF"];case qe:return[e,"sRGBTransferOETF"];default:return oe("WebGLProgram: Unsupported color space: ",o),[e,"LinearTransferOETF"]}}function Lx(o,e,i){const s=o.getShaderParameter(e,o.COMPILE_STATUS),f=(o.getShaderInfoLog(e)||"").trim();if(s&&f==="")return"";const h=/ERROR: 0:(\d+)/.exec(f);if(h){const d=parseInt(h[1]);return i.toUpperCase()+`

`+f+`

`+YR(o.getShaderSource(e),d)}else return f}function ZR(o,e){const i=qR(e);return[`vec4 ${o}( vec4 value ) {`,`	return ${i[1]}( vec4( value.rgb * ${i[0]}, value.a ) );`,"}"].join(`
`)}const jR={[Zx]:"Linear",[jx]:"Reinhard",[Kx]:"Cineon",[Qx]:"ACESFilmic",[$x]:"AgX",[tS]:"Neutral",[Jx]:"Custom"};function KR(o,e){const i=jR[e];return i===void 0?(oe("WebGLProgram: Unsupported toneMapping:",e),"vec3 "+o+"( vec3 color ) { return LinearToneMapping( color ); }"):"vec3 "+o+"( vec3 color ) { return "+i+"ToneMapping( color ); }"}const Cc=new nt;function QR(){Oe.getLuminanceCoefficients(Cc);const o=Cc.x.toFixed(4),e=Cc.y.toFixed(4),i=Cc.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${o}, ${e}, ${i} );`,"	return dot( weights, rgb );","}"].join(`
`)}function JR(o){return[o.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",o.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(El).join(`
`)}function $R(o){const e=[];for(const i in o){const s=o[i];s!==!1&&e.push("#define "+i+" "+s)}return e.join(`
`)}function t3(o,e){const i={},s=o.getProgramParameter(e,o.ACTIVE_ATTRIBUTES);for(let l=0;l<s;l++){const f=o.getActiveAttrib(e,l),h=f.name;let d=1;f.type===o.FLOAT_MAT2&&(d=2),f.type===o.FLOAT_MAT3&&(d=3),f.type===o.FLOAT_MAT4&&(d=4),i[h]={type:f.type,location:o.getAttribLocation(e,h),locationSize:d}}return i}function El(o){return o!==""}function Ox(o,e){const i=e.numSpotLightShadows+e.numSpotLightMaps-e.numSpotLightShadowsWithMaps;return o.replace(/NUM_SUN_LIGHTS/g,e.numSunLights).replace(/NUM_DIR_LIGHTS/g,e.numDirLights).replace(/NUM_SPOT_LIGHTS/g,e.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,e.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,i).replace(/NUM_RECT_AREA_LIGHTS/g,e.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,e.numPointLights).replace(/NUM_HEMI_LIGHTS/g,e.numHemiLights).replace(/NUM_SUN_LIGHT_SHADOWS/g,e.numSunLightShadows).replace(/NUM_DIR_LIGHT_SHADOWS/g,e.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,e.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,e.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,e.numPointLightShadows)}function Px(o,e){return o.replace(/NUM_CLIPPING_PLANES/g,e.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,e.numClippingPlanes-e.numClipIntersection)}const e3=/^[ \t]*#include +<([\w\d./]+)>/gm;function Qp(o){return o.replace(e3,i3)}const n3=new Map;function i3(o,e){let i=ve[e];if(i===void 0){const s=n3.get(e);if(s!==void 0)i=ve[s],oe('WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',e,s);else throw new Error("THREE.WebGLProgram: Can not resolve #include <"+e+">")}return Qp(i)}const a3=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function Ix(o){return o.replace(a3,s3)}function s3(o,e,i,s){let l="";for(let f=parseInt(e);f<parseInt(i);f++)l+=s.replace(/\[\s*i\s*\]/g,"[ "+f+" ]").replace(/UNROLLED_LOOP_INDEX/g,f);return l}function zx(o){let e=`precision ${o.precision} float;
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
#define LOW_PRECISION`),e}const r3={[Tl]:"SHADOWMAP_TYPE_PCF",[Ml]:"SHADOWMAP_TYPE_VSM"};function o3(o){return r3[o.shadowMapType]||"SHADOWMAP_TYPE_BASIC"}const l3={[ir]:"ENVMAP_TYPE_CUBE",[ho]:"ENVMAP_TYPE_CUBE",[kc]:"ENVMAP_TYPE_CUBE_UV"};function u3(o){return o.envMap===!1?"ENVMAP_TYPE_CUBE":l3[o.envMapMode]||"ENVMAP_TYPE_CUBE"}const c3={[ho]:"ENVMAP_MODE_REFRACTION"};function f3(o){return o.envMap===!1?"ENVMAP_MODE_REFLECTION":c3[o.envMapMode]||"ENVMAP_MODE_REFLECTION"}const h3={[qx]:"ENVMAP_BLENDING_MULTIPLY",[kE]:"ENVMAP_BLENDING_MIX",[WE]:"ENVMAP_BLENDING_ADD"};function d3(o){return o.envMap===!1?"ENVMAP_BLENDING_NONE":h3[o.combine]||"ENVMAP_BLENDING_NONE"}function p3(o){const e=o.envMapCubeUVHeight;if(e===null)return null;const i=Math.log2(e)-2,s=1/e;return{texelWidth:1/(3*Math.max(Math.pow(2,i),112)),texelHeight:s,maxMip:i}}function m3(o,e,i,s){const l=o.getContext(),f=i.defines;let h=i.vertexShader,d=i.fragmentShader;const m=o3(i),p=u3(i),x=f3(i),_=d3(i),v=p3(i),M=JR(i),R=$R(f),w=l.createProgram();let y,S,O=i.glslVersion?"#version "+i.glslVersion+`
`:"";i.isRawShaderMaterial?(y=["#define SHADER_TYPE "+i.shaderType,"#define SHADER_NAME "+i.shaderName,R].filter(El).join(`
`),y.length>0&&(y+=`
`),S=["#define SHADER_TYPE "+i.shaderType,"#define SHADER_NAME "+i.shaderName,R].filter(El).join(`
`),S.length>0&&(S+=`
`)):(y=[zx(i),"#define SHADER_TYPE "+i.shaderType,"#define SHADER_NAME "+i.shaderName,R,i.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",i.batching?"#define USE_BATCHING":"",i.batchingColor?"#define USE_BATCHING_COLOR":"",i.instancing?"#define USE_INSTANCING":"",i.instancingColor?"#define USE_INSTANCING_COLOR":"",i.instancingMorph?"#define USE_INSTANCING_MORPH":"",i.useFog&&i.fog?"#define USE_FOG":"",i.useFog&&i.fogExp2?"#define FOG_EXP2":"",i.map?"#define USE_MAP":"",i.envMap?"#define USE_ENVMAP":"",i.envMap?"#define "+x:"",i.lightMap?"#define USE_LIGHTMAP":"",i.aoMap?"#define USE_AOMAP":"",i.bumpMap?"#define USE_BUMPMAP":"",i.normalMap?"#define USE_NORMALMAP":"",i.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",i.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",i.displacementMap?"#define USE_DISPLACEMENTMAP":"",i.emissiveMap?"#define USE_EMISSIVEMAP":"",i.anisotropy?"#define USE_ANISOTROPY":"",i.anisotropyMap?"#define USE_ANISOTROPYMAP":"",i.clearcoatMap?"#define USE_CLEARCOATMAP":"",i.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",i.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",i.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",i.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",i.specularMap?"#define USE_SPECULARMAP":"",i.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",i.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",i.roughnessMap?"#define USE_ROUGHNESSMAP":"",i.metalnessMap?"#define USE_METALNESSMAP":"",i.alphaMap?"#define USE_ALPHAMAP":"",i.alphaHash?"#define USE_ALPHAHASH":"",i.transmission?"#define USE_TRANSMISSION":"",i.transmissionMap?"#define USE_TRANSMISSIONMAP":"",i.thicknessMap?"#define USE_THICKNESSMAP":"",i.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",i.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",i.mapUv?"#define MAP_UV "+i.mapUv:"",i.alphaMapUv?"#define ALPHAMAP_UV "+i.alphaMapUv:"",i.lightMapUv?"#define LIGHTMAP_UV "+i.lightMapUv:"",i.aoMapUv?"#define AOMAP_UV "+i.aoMapUv:"",i.emissiveMapUv?"#define EMISSIVEMAP_UV "+i.emissiveMapUv:"",i.bumpMapUv?"#define BUMPMAP_UV "+i.bumpMapUv:"",i.normalMapUv?"#define NORMALMAP_UV "+i.normalMapUv:"",i.displacementMapUv?"#define DISPLACEMENTMAP_UV "+i.displacementMapUv:"",i.metalnessMapUv?"#define METALNESSMAP_UV "+i.metalnessMapUv:"",i.roughnessMapUv?"#define ROUGHNESSMAP_UV "+i.roughnessMapUv:"",i.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+i.anisotropyMapUv:"",i.clearcoatMapUv?"#define CLEARCOATMAP_UV "+i.clearcoatMapUv:"",i.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+i.clearcoatNormalMapUv:"",i.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+i.clearcoatRoughnessMapUv:"",i.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+i.iridescenceMapUv:"",i.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+i.iridescenceThicknessMapUv:"",i.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+i.sheenColorMapUv:"",i.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+i.sheenRoughnessMapUv:"",i.specularMapUv?"#define SPECULARMAP_UV "+i.specularMapUv:"",i.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+i.specularColorMapUv:"",i.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+i.specularIntensityMapUv:"",i.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+i.transmissionMapUv:"",i.thicknessMapUv?"#define THICKNESSMAP_UV "+i.thicknessMapUv:"",i.vertexTangents&&i.flatShading===!1?"#define USE_TANGENT":"",i.vertexNormals?"#define HAS_NORMAL":"",i.vertexColors?"#define USE_COLOR":"",i.vertexAlphas?"#define USE_COLOR_ALPHA":"",i.vertexUv1s?"#define USE_UV1":"",i.vertexUv2s?"#define USE_UV2":"",i.vertexUv3s?"#define USE_UV3":"",i.pointsUvs?"#define USE_POINTS_UV":"",i.flatShading?"#define FLAT_SHADED":"",i.skinning?"#define USE_SKINNING":"",i.morphTargets?"#define USE_MORPHTARGETS":"",i.morphNormals&&i.flatShading===!1?"#define USE_MORPHNORMALS":"",i.morphColors?"#define USE_MORPHCOLORS":"",i.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+i.morphTextureStride:"",i.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+i.morphTargetsCount:"",i.doubleSided?"#define DOUBLE_SIDED":"",i.flipSided?"#define FLIP_SIDED":"",i.shadowMapEnabled?"#define USE_SHADOWMAP":"",i.shadowMapEnabled?"#define "+m:"",i.sizeAttenuation?"#define USE_SIZEATTENUATION":"",i.numLightProbes>0?"#define USE_LIGHT_PROBES":"",i.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",i.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(El).join(`
`),S=[zx(i),"#define SHADER_TYPE "+i.shaderType,"#define SHADER_NAME "+i.shaderName,R,i.useFog&&i.fog?"#define USE_FOG":"",i.useFog&&i.fogExp2?"#define FOG_EXP2":"",i.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",i.map?"#define USE_MAP":"",i.matcap?"#define USE_MATCAP":"",i.envMap?"#define USE_ENVMAP":"",i.envMap?"#define "+p:"",i.envMap?"#define "+x:"",i.envMap?"#define "+_:"",v?"#define CUBEUV_TEXEL_WIDTH "+v.texelWidth:"",v?"#define CUBEUV_TEXEL_HEIGHT "+v.texelHeight:"",v?"#define CUBEUV_MAX_MIP "+v.maxMip+".0":"",i.lightMap?"#define USE_LIGHTMAP":"",i.aoMap?"#define USE_AOMAP":"",i.bumpMap?"#define USE_BUMPMAP":"",i.normalMap?"#define USE_NORMALMAP":"",i.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",i.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",i.packedNormalMap?"#define USE_PACKED_NORMALMAP":"",i.emissiveMap?"#define USE_EMISSIVEMAP":"",i.anisotropy?"#define USE_ANISOTROPY":"",i.anisotropyMap?"#define USE_ANISOTROPYMAP":"",i.clearcoat?"#define USE_CLEARCOAT":"",i.clearcoatMap?"#define USE_CLEARCOATMAP":"",i.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",i.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",i.dispersion?"#define USE_DISPERSION":"",i.retroreflection?"#define USE_RETROREFLECTION":"",i.iridescence?"#define USE_IRIDESCENCE":"",i.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",i.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",i.specularMap?"#define USE_SPECULARMAP":"",i.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",i.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",i.roughnessMap?"#define USE_ROUGHNESSMAP":"",i.metalnessMap?"#define USE_METALNESSMAP":"",i.alphaMap?"#define USE_ALPHAMAP":"",i.alphaTest?"#define USE_ALPHATEST":"",i.alphaHash?"#define USE_ALPHAHASH":"",i.sheen?"#define USE_SHEEN":"",i.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",i.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",i.transmission?"#define USE_TRANSMISSION":"",i.transmissionMap?"#define USE_TRANSMISSIONMAP":"",i.thicknessMap?"#define USE_THICKNESSMAP":"",i.vertexTangents&&i.flatShading===!1?"#define USE_TANGENT":"",i.vertexColors||i.instancingColor?"#define USE_COLOR":"",i.vertexAlphas||i.batchingColor?"#define USE_COLOR_ALPHA":"",i.vertexUv1s?"#define USE_UV1":"",i.vertexUv2s?"#define USE_UV2":"",i.vertexUv3s?"#define USE_UV3":"",i.pointsUvs?"#define USE_POINTS_UV":"",i.gradientMap?"#define USE_GRADIENTMAP":"",i.flatShading?"#define FLAT_SHADED":"",i.doubleSided?"#define DOUBLE_SIDED":"",i.flipSided?"#define FLIP_SIDED":"",i.shadowMapEnabled?"#define USE_SHADOWMAP":"",i.shadowMapEnabled?"#define "+m:"",i.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",i.numLightProbes>0?"#define USE_LIGHT_PROBES":"",i.numLightProbeGrids>0?"#define USE_LIGHT_PROBES_GRID":"",i.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",i.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",i.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",i.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",i.toneMapping!==da?"#define TONE_MAPPING":"",i.toneMapping!==da?ve.tonemapping_pars_fragment:"",i.toneMapping!==da?KR("toneMapping",i.toneMapping):"",i.dithering?"#define DITHERING":"",i.opaque?"#define OPAQUE":"",ve.colorspace_pars_fragment,ZR("linearToOutputTexel",i.outputColorSpace),QR(),i.useDepthPacking?"#define DEPTH_PACKING "+i.depthPacking:"",`
`].filter(El).join(`
`)),h=Qp(h),h=Ox(h,i),h=Px(h,i),d=Qp(d),d=Ox(d,i),d=Px(d,i),h=Ix(h),d=Ix(d),i.isRawShaderMaterial!==!0&&(O=`#version 300 es
`,y=[M,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+y,S=["#define varying in",i.glslVersion===kv?"":"layout(location = 0) out highp vec4 pc_fragColor;",i.glslVersion===kv?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+S);const G=O+y+h,C=O+S+d,D=Nx(l,l.VERTEX_SHADER,G),N=Nx(l,l.FRAGMENT_SHADER,C);l.attachShader(w,D),l.attachShader(w,N),i.index0AttributeName!==void 0?l.bindAttribLocation(w,0,i.index0AttributeName):i.hasPositionAttribute===!0&&l.bindAttribLocation(w,0,"position"),l.linkProgram(w);function P(V){if(o.debug.checkShaderErrors){const Q=l.getProgramInfoLog(w)||"",st=l.getShaderInfoLog(D)||"",Y=l.getShaderInfoLog(N)||"",tt=Q.trim(),W=st.trim(),q=Y.trim();let dt=!0,ct=!0;if(l.getProgramParameter(w,l.LINK_STATUS)===!1)if(dt=!1,typeof o.debug.onShaderError=="function")o.debug.onShaderError(l,w,D,N);else{const rt=Lx(l,D,"vertex"),bt=Lx(l,N,"fragment");Fe("WebGLProgram: Shader Error "+l.getError()+" - VALIDATE_STATUS "+l.getProgramParameter(w,l.VALIDATE_STATUS)+`

Material Name: `+V.name+`
Material Type: `+V.type+`

Program Info Log: `+tt+`
`+rt+`
`+bt)}else tt!==""?oe("WebGLProgram: Program Info Log:",tt):(W===""||q==="")&&(ct=!1);ct&&(V.diagnostics={runnable:dt,programLog:tt,vertexShader:{log:W,prefix:y},fragmentShader:{log:q,prefix:S}})}l.deleteShader(D),l.deleteShader(N),T=new Oc(l,w),U=t3(l,w)}let T;this.getUniforms=function(){return T===void 0&&P(this),T};let U;this.getAttributes=function(){return U===void 0&&P(this),U};let F=i.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return F===!1&&(F=l.getProgramParameter(w,kR)),F},this.destroy=function(){s.releaseStatesOfProgram(this),l.deleteProgram(w),this.program=void 0},this.type=i.shaderType,this.name=i.shaderName,this.id=WR++,this.cacheKey=e,this.usedTimes=1,this.program=w,this.vertexShader=D,this.fragmentShader=N,this}let g3=0;class _3{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(e,i,s){const l=this._getShaderCacheForMaterial(e);return l.has(i)===!1&&(l.add(i),i.usedTimes++),l.has(s)===!1&&(l.add(s),s.usedTimes++),this}remove(e){const i=this.materialCache.get(e);for(const s of i)s.usedTimes--,s.usedTimes===0&&this.shaderCache.delete(s.code);return this.materialCache.delete(e),this}getVertexShaderStage(e){return this._getShaderStage(e.vertexShader)}getFragmentShaderStage(e){return this._getShaderStage(e.fragmentShader)}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(e){const i=this.materialCache;let s=i.get(e);return s===void 0&&(s=new Set,i.set(e,s)),s}_getShaderStage(e){const i=this.shaderCache;let s=i.get(e);return s===void 0&&(s=new v3(e),i.set(e,s)),s}}class v3{constructor(e){this.id=g3++,this.code=e,this.usedTimes=0}}function x3(o){return o===ar||o===Ic||o===zc}function S3(o,e,i,s,l,f){const h=new fS,d=new _3,m=new Set,p=[],x=new Map,_=s.logarithmicDepthBuffer;let v=s.precision;const M={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distance",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function R(T){return m.add(T),T===0?"uv":`uv${T}`}function w(T,U,F,V,Q,st){const Y=V.fog,tt=Q.geometry,W=T.isMeshStandardMaterial||T.isMeshLambertMaterial||T.isMeshPhongMaterial?V.environment:null,q=T.isMeshStandardMaterial||T.isMeshLambertMaterial&&!T.envMap||T.isMeshPhongMaterial&&!T.envMap,dt=e.get(T.envMap||W,q),ct=dt&&dt.mapping===kc?dt.image.height:null,rt=M[T.type];T.precision!==null&&(v=s.getMaxPrecision(T.precision),v!==T.precision&&oe("WebGLProgram.getParameters:",T.precision,"not supported, using",v,"instead."));const bt=tt.morphAttributes.position||tt.morphAttributes.normal||tt.morphAttributes.color,Gt=bt!==void 0?bt.length:0;let Ot=0;tt.morphAttributes.position!==void 0&&(Ot=1),tt.morphAttributes.normal!==void 0&&(Ot=2),tt.morphAttributes.color!==void 0&&(Ot=3);let z,_t,Nt,Z;if(rt){const Ue=ua[rt];z=Ue.vertexShader,_t=Ue.fragmentShader}else{z=T.vertexShader,_t=T.fragmentShader;const Ue=d.getVertexShaderStage(T),fe=d.getFragmentShaderStage(T);d.update(T,Ue,fe),Nt=Ue.id,Z=fe.id}const ft=o.getRenderTarget(),wt=o.state.buffers.depth.getReversed(),Pt=Q.isInstancedMesh===!0,vt=Q.isBatchedMesh===!0,Ut=!!T.map,Te=!!T.matcap,ce=!!dt,pe=!!T.aoMap,_e=!!T.lightMap,ee=!!T.bumpMap&&T.wireframe===!1,ne=!!T.normalMap,Be=!!T.displacementMap,sn=!!T.emissiveMap,Pe=!!T.metalnessMap,Je=!!T.roughnessMap,X=T.anisotropy>0,je=T.clearcoat>0,Ee=T.dispersion>0,L=T.retroreflectivity>0,E=T.iridescence>0,et=T.sheen>0,at=T.transmission>0,gt=X&&!!T.anisotropyMap,Dt=je&&!!T.clearcoatMap,It=je&&!!T.clearcoatNormalMap,xt=je&&!!T.clearcoatRoughnessMap,St=E&&!!T.iridescenceMap,mt=E&&!!T.iridescenceThicknessMap,Ct=et&&!!T.sheenColorMap,yt=et&&!!T.sheenRoughnessMap,At=!!T.specularMap,Lt=!!T.specularColorMap,Qt=!!T.specularIntensityMap,ae=at&&!!T.transmissionMap,k=at&&!!T.thicknessMap,zt=!!T.gradientMap,Tt=!!T.alphaMap,Bt=T.alphaTest>0,Yt=!!T.alphaHash,Rt=!!T.extensions;let te=da;T.toneMapped&&(ft===null||ft.isXRRenderTarget===!0)&&(te=o.toneMapping);const Wt={shaderID:rt,shaderType:T.type,shaderName:T.name,vertexShader:z,fragmentShader:_t,defines:T.defines,customVertexShaderID:Nt,customFragmentShaderID:Z,isRawShaderMaterial:T.isRawShaderMaterial===!0,glslVersion:T.glslVersion,precision:v,batching:vt,batchingColor:vt&&Q._colorsTexture!==null,instancing:Pt,instancingColor:Pt&&Q.instanceColor!==null,instancingMorph:Pt&&Q.morphTexture!==null,outputColorSpace:ft===null?o.outputColorSpace:ft.isXRRenderTarget===!0?ft.texture.colorSpace:Oe.workingColorSpace,alphaToCoverage:!!T.alphaToCoverage,map:Ut,matcap:Te,envMap:ce,envMapMode:ce&&dt.mapping,envMapCubeUVHeight:ct,aoMap:pe,lightMap:_e,bumpMap:ee,normalMap:ne,displacementMap:Be,emissiveMap:sn,normalMapObjectSpace:ne&&T.normalMapType===ZE,normalMapTangentSpace:ne&&T.normalMapType===Zp,packedNormalMap:ne&&T.normalMapType===Zp&&x3(T.normalMap.format),metalnessMap:Pe,roughnessMap:Je,anisotropy:X,anisotropyMap:gt,clearcoat:je,clearcoatMap:Dt,clearcoatNormalMap:It,clearcoatRoughnessMap:xt,dispersion:Ee,retroreflection:L,iridescence:E,iridescenceMap:St,iridescenceThicknessMap:mt,sheen:et,sheenColorMap:Ct,sheenRoughnessMap:yt,specularMap:At,specularColorMap:Lt,specularIntensityMap:Qt,transmission:at,transmissionMap:ae,thicknessMap:k,gradientMap:zt,opaque:T.transparent===!1&&T.blending===bl&&T.alphaToCoverage===!1,alphaMap:Tt,alphaTest:Bt,alphaHash:Yt,combine:T.combine,mapUv:Ut&&R(T.map.channel),aoMapUv:pe&&R(T.aoMap.channel),lightMapUv:_e&&R(T.lightMap.channel),bumpMapUv:ee&&R(T.bumpMap.channel),normalMapUv:ne&&R(T.normalMap.channel),displacementMapUv:Be&&R(T.displacementMap.channel),emissiveMapUv:sn&&R(T.emissiveMap.channel),metalnessMapUv:Pe&&R(T.metalnessMap.channel),roughnessMapUv:Je&&R(T.roughnessMap.channel),anisotropyMapUv:gt&&R(T.anisotropyMap.channel),clearcoatMapUv:Dt&&R(T.clearcoatMap.channel),clearcoatNormalMapUv:It&&R(T.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:xt&&R(T.clearcoatRoughnessMap.channel),iridescenceMapUv:St&&R(T.iridescenceMap.channel),iridescenceThicknessMapUv:mt&&R(T.iridescenceThicknessMap.channel),sheenColorMapUv:Ct&&R(T.sheenColorMap.channel),sheenRoughnessMapUv:yt&&R(T.sheenRoughnessMap.channel),specularMapUv:At&&R(T.specularMap.channel),specularColorMapUv:Lt&&R(T.specularColorMap.channel),specularIntensityMapUv:Qt&&R(T.specularIntensityMap.channel),transmissionMapUv:ae&&R(T.transmissionMap.channel),thicknessMapUv:k&&R(T.thicknessMap.channel),alphaMapUv:Tt&&R(T.alphaMap.channel),vertexTangents:!!tt.attributes.tangent&&(ne||X),vertexNormals:!!tt.attributes.normal,vertexColors:T.vertexColors,vertexAlphas:T.vertexColors===!0&&!!tt.attributes.color&&tt.attributes.color.itemSize===4,pointsUvs:Q.isPoints===!0&&!!tt.attributes.uv&&(Ut||Tt),fog:!!Y,useFog:T.fog===!0,fogExp2:!!Y&&Y.isFogExp2,flatShading:T.wireframe===!1&&(T.flatShading===!0||tt.attributes.normal===void 0&&ne===!1&&(T.isMeshLambertMaterial||T.isMeshPhongMaterial||T.isMeshStandardMaterial||T.isMeshPhysicalMaterial)),sizeAttenuation:T.sizeAttenuation===!0,logarithmicDepthBuffer:_,reversedDepthBuffer:wt,skinning:Q.isSkinnedMesh===!0,hasPositionAttribute:tt.attributes.position!==void 0,morphTargets:tt.morphAttributes.position!==void 0,morphNormals:tt.morphAttributes.normal!==void 0,morphColors:tt.morphAttributes.color!==void 0,morphTargetsCount:Gt,morphTextureStride:Ot,numSunLights:U.sun.length,numDirLights:U.directional.length,numPointLights:U.point.length,numSpotLights:U.spot.length,numSpotLightMaps:U.spotLightMap.length,numRectAreaLights:U.rectArea.length,numHemiLights:U.hemi.length,numSunLightShadows:U.sunShadowMap.length,numDirLightShadows:U.directionalShadowMap.length,numPointLightShadows:U.pointShadowMap.length,numSpotLightShadows:U.spotShadowMap.length,numSpotLightShadowsWithMaps:U.numSpotLightShadowsWithMaps,numLightProbes:U.numLightProbes,numLightProbeGrids:st.length,numClippingPlanes:f.numPlanes,numClipIntersection:f.numIntersection,dithering:T.dithering,shadowMapEnabled:o.shadowMap.enabled&&F.length>0,shadowMapType:o.shadowMap.type,toneMapping:te,decodeVideoTexture:Ut&&T.map.isVideoTexture===!0&&Oe.getTransfer(T.map.colorSpace)===qe,decodeVideoTextureEmissive:sn&&T.emissiveMap.isVideoTexture===!0&&Oe.getTransfer(T.emissiveMap.colorSpace)===qe,premultipliedAlpha:T.premultipliedAlpha,doubleSided:T.side===Li,flipSided:T.side===ai,useDepthPacking:T.depthPacking>=0,depthPacking:T.depthPacking||0,index0AttributeName:T.index0AttributeName,extensionClipCullDistance:Rt&&T.extensions.clipCullDistance===!0&&i.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(Rt&&T.extensions.multiDraw===!0||vt)&&i.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:i.has("KHR_parallel_shader_compile"),customProgramCacheKey:T.customProgramCacheKey()};return Wt.vertexUv1s=m.has(1),Wt.vertexUv2s=m.has(2),Wt.vertexUv3s=m.has(3),m.clear(),Wt}function y(T){const U=[];if(T.shaderID?U.push(T.shaderID):(U.push(T.customVertexShaderID),U.push(T.customFragmentShaderID)),T.defines!==void 0)for(const F in T.defines)U.push(F),U.push(T.defines[F]);return T.isRawShaderMaterial===!1&&(S(U,T),O(U,T),U.push(o.outputColorSpace)),U.push(T.customProgramCacheKey),U.join()}function S(T,U){T.push(U.precision),T.push(U.outputColorSpace),T.push(U.envMapMode),T.push(U.envMapCubeUVHeight),T.push(U.mapUv),T.push(U.alphaMapUv),T.push(U.lightMapUv),T.push(U.aoMapUv),T.push(U.bumpMapUv),T.push(U.normalMapUv),T.push(U.displacementMapUv),T.push(U.emissiveMapUv),T.push(U.metalnessMapUv),T.push(U.roughnessMapUv),T.push(U.anisotropyMapUv),T.push(U.clearcoatMapUv),T.push(U.clearcoatNormalMapUv),T.push(U.clearcoatRoughnessMapUv),T.push(U.iridescenceMapUv),T.push(U.iridescenceThicknessMapUv),T.push(U.sheenColorMapUv),T.push(U.sheenRoughnessMapUv),T.push(U.specularMapUv),T.push(U.specularColorMapUv),T.push(U.specularIntensityMapUv),T.push(U.transmissionMapUv),T.push(U.thicknessMapUv),T.push(U.combine),T.push(U.fogExp2),T.push(U.sizeAttenuation),T.push(U.morphTargetsCount),T.push(U.morphAttributeCount),T.push(U.numSunLights),T.push(U.numDirLights),T.push(U.numPointLights),T.push(U.numSpotLights),T.push(U.numSpotLightMaps),T.push(U.numHemiLights),T.push(U.numRectAreaLights),T.push(U.numSunLightShadows),T.push(U.numDirLightShadows),T.push(U.numPointLightShadows),T.push(U.numSpotLightShadows),T.push(U.numSpotLightShadowsWithMaps),T.push(U.numLightProbes),T.push(U.shadowMapType),T.push(U.toneMapping),T.push(U.numClippingPlanes),T.push(U.numClipIntersection),T.push(U.depthPacking)}function O(T,U){h.disableAll(),U.instancing&&h.enable(0),U.instancingColor&&h.enable(1),U.instancingMorph&&h.enable(2),U.matcap&&h.enable(3),U.envMap&&h.enable(4),U.normalMapObjectSpace&&h.enable(5),U.normalMapTangentSpace&&h.enable(6),U.clearcoat&&h.enable(7),U.iridescence&&h.enable(8),U.alphaTest&&h.enable(9),U.vertexColors&&h.enable(10),U.vertexAlphas&&h.enable(11),U.vertexUv1s&&h.enable(12),U.vertexUv2s&&h.enable(13),U.vertexUv3s&&h.enable(14),U.vertexTangents&&h.enable(15),U.anisotropy&&h.enable(16),U.alphaHash&&h.enable(17),U.batching&&h.enable(18),U.dispersion&&h.enable(19),U.retroreflection&&h.enable(24),U.batchingColor&&h.enable(20),U.gradientMap&&h.enable(21),U.packedNormalMap&&h.enable(22),U.vertexNormals&&h.enable(23),T.push(h.mask),h.disableAll(),U.fog&&h.enable(0),U.useFog&&h.enable(1),U.flatShading&&h.enable(2),U.logarithmicDepthBuffer&&h.enable(3),U.reversedDepthBuffer&&h.enable(4),U.skinning&&h.enable(5),U.morphTargets&&h.enable(6),U.morphNormals&&h.enable(7),U.morphColors&&h.enable(8),U.premultipliedAlpha&&h.enable(9),U.shadowMapEnabled&&h.enable(10),U.doubleSided&&h.enable(11),U.flipSided&&h.enable(12),U.useDepthPacking&&h.enable(13),U.dithering&&h.enable(14),U.transmission&&h.enable(15),U.sheen&&h.enable(16),U.opaque&&h.enable(17),U.pointsUvs&&h.enable(18),U.decodeVideoTexture&&h.enable(19),U.decodeVideoTextureEmissive&&h.enable(20),U.alphaToCoverage&&h.enable(21),U.numLightProbeGrids>0&&h.enable(22),U.hasPositionAttribute&&h.enable(23),T.push(h.mask)}function G(T){const U=M[T.type];let F;if(U){const V=ua[U];F=IT.clone(V.uniforms)}else F=T.uniforms;return F}function C(T,U){let F=x.get(U);return F!==void 0?++F.usedTimes:(F=new m3(o,U,T,l),p.push(F),x.set(U,F)),F}function D(T){if(--T.usedTimes===0){const U=p.indexOf(T);p[U]=p[p.length-1],p.pop(),x.delete(T.cacheKey),T.destroy()}}function N(T){d.remove(T)}function P(){d.dispose()}return{getParameters:w,getProgramCacheKey:y,getUniforms:G,acquireProgram:C,releaseProgram:D,releaseShaderCache:N,programs:p,dispose:P}}function y3(){let o=new WeakMap;function e(h){return o.has(h)}function i(h){let d=o.get(h);return d===void 0&&(d={},o.set(h,d)),d}function s(h){o.delete(h)}function l(h,d,m){o.get(h)[d]=m}function f(){o=new WeakMap}return{has:e,get:i,remove:s,update:l,dispose:f}}function M3(o,e){return o.groupOrder!==e.groupOrder?o.groupOrder-e.groupOrder:o.renderOrder!==e.renderOrder?o.renderOrder-e.renderOrder:o.material.id!==e.material.id?o.material.id-e.material.id:o.materialVariant!==e.materialVariant?o.materialVariant-e.materialVariant:o.z!==e.z?o.z-e.z:o.id-e.id}function Bx(o,e){return o.groupOrder!==e.groupOrder?o.groupOrder-e.groupOrder:o.renderOrder!==e.renderOrder?o.renderOrder-e.renderOrder:o.z!==e.z?e.z-o.z:o.id-e.id}function Fx(){const o=[];let e=0;const i=[],s=[],l=[];function f(){e=0,i.length=0,s.length=0,l.length=0}function h(v){let M=0;return v.isInstancedMesh&&(M+=2),v.isSkinnedMesh&&(M+=1),M}function d(v,M,R,w,y,S){let O=o[e];return O===void 0?(O={id:v.id,object:v,geometry:M,material:R,materialVariant:h(v),groupOrder:w,renderOrder:v.renderOrder,z:y,group:S},o[e]=O):(O.id=v.id,O.object=v,O.geometry=M,O.material=R,O.materialVariant=h(v),O.groupOrder=w,O.renderOrder=v.renderOrder,O.z=y,O.group=S),e++,O}function m(v,M,R,w,y,S,O){O.reversedDepth===!0&&(y=-y);const G=d(v,M,R,w,y,S);R.transmission>0?s.push(G):R.transparent===!0?l.push(G):i.push(G)}function p(v,M,R,w,y,S){const O=d(v,M,R,w,y,S);R.transmission>0?s.unshift(O):R.transparent===!0?l.unshift(O):i.unshift(O)}function x(v,M){i.length>1&&i.sort(v||M3),s.length>1&&s.sort(M||Bx),l.length>1&&l.sort(M||Bx)}function _(){for(let v=e,M=o.length;v<M;v++){const R=o[v];if(R.id===null)break;R.id=null,R.object=null,R.geometry=null,R.material=null,R.group=null}}return{opaque:i,transmissive:s,transparent:l,init:f,push:m,unshift:p,finish:_,sort:x}}function E3(){let o=new WeakMap;function e(s,l){const f=o.get(s);let h;return f===void 0?(h=new Fx,o.set(s,[h])):l>=f.length?(h=new Fx,f.push(h)):h=f[l],h}function i(){o=new WeakMap}return{get:e,dispose:i}}function T3(){const o={};return{get:function(e){if(o[e.id]!==void 0)return o[e.id];let i;switch(e.type){case"SunLight":case"DirectionalLight":i={direction:new nt,color:new Me};break;case"SpotLight":i={position:new nt,direction:new nt,color:new Me,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":i={position:new nt,color:new Me,distance:0,decay:0};break;case"HemisphereLight":i={direction:new nt,skyColor:new Me,groundColor:new Me};break;case"RectAreaLight":i={color:new Me,position:new nt,halfWidth:new nt,halfHeight:new nt};break}return o[e.id]=i,i}}}function b3(){const o={};return{get:function(e){if(o[e.id]!==void 0)return o[e.id];let i;switch(e.type){case"SunLight":case"DirectionalLight":i={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new le};break;case"SpotLight":i={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new le};break;case"PointLight":i={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new le,shadowCameraNear:1,shadowCameraFar:1e3};break}return o[e.id]=i,i}}}let A3=0;function R3(o,e){return(e.castShadow?2:0)-(o.castShadow?2:0)+(e.map?1:0)-(o.map?1:0)}function C3(o){const e=new T3,i=b3(),s={version:0,hash:{sunLength:-1,directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numSunShadows:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],sun:[],sunShadow:[],sunShadowMap:[],sunShadowMatrix:[],sunShadowCascade:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let p=0;p<9;p++)s.probe.push(new nt);const l=new nt,f=new ln,h=new ln;function d(p){let x=0,_=0,v=0;for(let Q=0;Q<9;Q++)s.probe[Q].set(0,0,0);let M=0,R=0,w=0,y=0,S=0,O=0,G=0,C=0,D=0,N=0,P=0,T=0,U=0,F=0;p.sort(R3);for(let Q=0,st=p.length;Q<st;Q++){const Y=p[Q],tt=Y.color,W=Y.intensity,q=Y.distance;let dt=null;if(Y.shadow&&Y.shadow.map&&(Y.shadow.map.texture.format===ar?dt=Y.shadow.map.texture:dt=Y.shadow.map.depthTexture||Y.shadow.map.texture),Y.isAmbientLight)x+=tt.r*W,_+=tt.g*W,v+=tt.b*W;else if(Y.isLightProbe){for(let ct=0;ct<9;ct++)s.probe[ct].addScaledVector(Y.sh.coefficients[ct],W);F++}else if(Y.isSunLight){const ct=e.get(Y);if(ct.color.copy(Y.color).multiplyScalar(Y.intensity),Y.castShadow){const rt=Y.shadow,bt=i.get(Y);bt.shadowIntensity=rt.intensity,bt.shadowBias=rt.bias,bt.shadowNormalBias=rt.normalBias,bt.shadowRadius=rt.radius,bt.shadowMapSize.copy(rt.mapSize).multiply(rt.getFrameExtents()),s.sunShadow[R]=bt,s.sunShadowMap[R]=dt;const Gt=rt.getViewportCount();for(let Ot=0;Ot<Gt;Ot++)s.sunShadowMatrix[w+Ot]=rt.getMatrix(Ot),s.sunShadowCascade[w+Ot]=rt._cascadeData[Ot];w+=Gt,R++}s.sun[M]=ct,M++}else if(Y.isDirectionalLight){const ct=e.get(Y);if(ct.color.copy(Y.color).multiplyScalar(Y.intensity),Y.castShadow){const rt=Y.shadow,bt=i.get(Y);bt.shadowIntensity=rt.intensity,bt.shadowBias=rt.bias,bt.shadowNormalBias=rt.normalBias,bt.shadowRadius=rt.radius,bt.shadowMapSize=rt.mapSize,s.directionalShadow[y]=bt,s.directionalShadowMap[y]=dt,s.directionalShadowMatrix[y]=Y.shadow.matrix,D++}s.directional[y]=ct,y++}else if(Y.isSpotLight){const ct=e.get(Y);ct.position.setFromMatrixPosition(Y.matrixWorld),ct.color.copy(tt).multiplyScalar(W),ct.distance=q,ct.coneCos=Math.cos(Y.angle),ct.penumbraCos=Math.cos(Y.angle*(1-Y.penumbra)),ct.decay=Y.decay,s.spot[O]=ct;const rt=Y.shadow;if(Y.map&&(s.spotLightMap[T]=Y.map,T++,rt.updateMatrices(Y),Y.castShadow&&U++),s.spotLightMatrix[O]=rt.matrix,Y.castShadow){const bt=i.get(Y);bt.shadowIntensity=rt.intensity,bt.shadowBias=rt.bias,bt.shadowNormalBias=rt.normalBias,bt.shadowRadius=rt.radius,bt.shadowMapSize=rt.mapSize,s.spotShadow[O]=bt,s.spotShadowMap[O]=dt,P++}O++}else if(Y.isRectAreaLight){const ct=e.get(Y);ct.color.copy(tt).multiplyScalar(W),ct.halfWidth.set(Y.width*.5,0,0),ct.halfHeight.set(0,Y.height*.5,0),s.rectArea[G]=ct,G++}else if(Y.isPointLight){const ct=e.get(Y);if(ct.color.copy(Y.color).multiplyScalar(Y.intensity),ct.distance=Y.distance,ct.decay=Y.decay,Y.castShadow){const rt=Y.shadow,bt=i.get(Y);bt.shadowIntensity=rt.intensity,bt.shadowBias=rt.bias,bt.shadowNormalBias=rt.normalBias,bt.shadowRadius=rt.radius,bt.shadowMapSize=rt.mapSize,bt.shadowCameraNear=rt.camera.near,bt.shadowCameraFar=rt.camera.far,s.pointShadow[S]=bt,s.pointShadowMap[S]=dt,s.pointShadowMatrix[S]=Y.shadow.matrix,N++}s.point[S]=ct,S++}else if(Y.isHemisphereLight){const ct=e.get(Y);ct.skyColor.copy(Y.color).multiplyScalar(W),ct.groundColor.copy(Y.groundColor).multiplyScalar(W),s.hemi[C]=ct,C++}}G>0&&(o.has("OES_texture_float_linear")===!0?(s.rectAreaLTC1=kt.LTC_FLOAT_1,s.rectAreaLTC2=kt.LTC_FLOAT_2):(s.rectAreaLTC1=kt.LTC_HALF_1,s.rectAreaLTC2=kt.LTC_HALF_2)),s.ambient[0]=x,s.ambient[1]=_,s.ambient[2]=v;const V=s.hash;(V.sunLength!==M||V.directionalLength!==y||V.pointLength!==S||V.spotLength!==O||V.rectAreaLength!==G||V.hemiLength!==C||V.numSunShadows!==R||V.numDirectionalShadows!==D||V.numPointShadows!==N||V.numSpotShadows!==P||V.numSpotMaps!==T||V.numLightProbes!==F)&&(s.sun.length=M,s.directional.length=y,s.spot.length=O,s.rectArea.length=G,s.point.length=S,s.hemi.length=C,s.sunShadow.length=R,s.sunShadowMap.length=R,s.sunShadowMatrix.length=w,s.sunShadowCascade.length=w,s.directionalShadow.length=D,s.directionalShadowMap.length=D,s.directionalShadowMatrix.length=D,s.pointShadow.length=N,s.pointShadowMap.length=N,s.pointShadowMatrix.length=N,s.spotShadow.length=P,s.spotShadowMap.length=P,s.spotLightMatrix.length=P+T-U,s.spotLightMap.length=T,s.numSpotLightShadowsWithMaps=U,s.numLightProbes=F,V.sunLength=M,V.directionalLength=y,V.pointLength=S,V.spotLength=O,V.rectAreaLength=G,V.hemiLength=C,V.numSunShadows=R,V.numDirectionalShadows=D,V.numPointShadows=N,V.numSpotShadows=P,V.numSpotMaps=T,V.numLightProbes=F,s.version=A3++)}function m(p,x){let _=0,v=0,M=0,R=0,w=0,y=0;const S=x.matrixWorldInverse;for(let O=0,G=p.length;O<G;O++){const C=p[O];if(C.isSunLight){const D=s.sun[_];D.direction.setFromMatrixPosition(C.matrixWorld),D.direction.transformDirection(S),_++}else if(C.isDirectionalLight){const D=s.directional[v];D.direction.setFromMatrixPosition(C.matrixWorld),l.setFromMatrixPosition(C.target.matrixWorld),D.direction.sub(l),D.direction.transformDirection(S),v++}else if(C.isSpotLight){const D=s.spot[R];D.position.setFromMatrixPosition(C.matrixWorld),D.position.applyMatrix4(S),D.direction.setFromMatrixPosition(C.matrixWorld),l.setFromMatrixPosition(C.target.matrixWorld),D.direction.sub(l),D.direction.transformDirection(S),R++}else if(C.isRectAreaLight){const D=s.rectArea[w];D.position.setFromMatrixPosition(C.matrixWorld),D.position.applyMatrix4(S),h.identity(),f.copy(C.matrixWorld),f.premultiply(S),h.extractRotation(f),D.halfWidth.set(C.width*.5,0,0),D.halfHeight.set(0,C.height*.5,0),D.halfWidth.applyMatrix4(h),D.halfHeight.applyMatrix4(h),w++}else if(C.isPointLight){const D=s.point[M];D.position.setFromMatrixPosition(C.matrixWorld),D.position.applyMatrix4(S),M++}else if(C.isHemisphereLight){const D=s.hemi[y];D.direction.setFromMatrixPosition(C.matrixWorld),D.direction.transformDirection(S),y++}}}return{setup:d,setupView:m,state:s}}function Hx(o){const e=new C3(o),i=[],s=[],l=[];function f(v){_.camera=v,i.length=0,s.length=0,l.length=0}function h(v){i.push(v)}function d(v){s.push(v)}function m(v){l.push(v)}function p(){e.setup(i)}function x(v){e.setupView(i,v)}const _={lightsArray:i,shadowsArray:s,lightProbeGridArray:l,camera:null,lights:e,transmissionRenderTarget:{},textureUnits:0};return{init:f,state:_,setupLights:p,setupLightsView:x,pushLight:h,pushShadow:d,pushLightProbeGrid:m}}function w3(o){let e=new WeakMap;function i(l,f=0){const h=e.get(l);let d;return h===void 0?(d=new Hx(o),e.set(l,[d])):f>=h.length?(d=new Hx(o),h.push(d)):d=h[f],d}function s(){e=new WeakMap}return{get:i,dispose:s}}const D3=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,N3=`uniform sampler2D shadow_pass;
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
}`,U3=[new nt(1,0,0),new nt(-1,0,0),new nt(0,1,0),new nt(0,-1,0),new nt(0,0,1),new nt(0,0,-1)],L3=[new nt(0,-1,0),new nt(0,-1,0),new nt(0,0,1),new nt(0,0,-1),new nt(0,-1,0),new nt(0,-1,0)],Gx=new ln,yl=new nt,sp=new nt;function O3(o,e,i){let s=new dm;const l=new le,f=new le,h=new on,d=new HT,m=new GT,p={},x=i.maxTextureSize,_={[nr]:ai,[ai]:nr,[Li]:Li},v=new ga({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new le},radius:{value:4}},vertexShader:D3,fragmentShader:N3}),M=v.clone();M.defines.HORIZONTAL_PASS=1;const R=new Kn;R.setAttribute("position",new Ga(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));const w=new ze(R,v),y=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=Tl;let S=this.type;this.render=function(N,P,T){if(y.enabled===!1||y.autoUpdate===!1&&y.needsUpdate===!1||N.length===0)return;this.type===bE&&(oe("WebGLShadowMap: PCFSoftShadowMap has been removed. Using PCFShadowMap instead."),this.type=Tl);const U=o.getRenderTarget(),F=o.getActiveCubeFace(),V=o.getActiveMipmapLevel(),Q=o.state;Q.setBlending(Fa),Q.buffers.depth.getReversed()===!0?Q.buffers.color.setClear(0,0,0,0):Q.buffers.color.setClear(1,1,1,1),Q.buffers.depth.setTest(!0),Q.setScissorTest(!1);const st=S!==this.type;st&&P.traverse(function(Y){Y.material&&(Array.isArray(Y.material)?Y.material.forEach(tt=>tt.needsUpdate=!0):Y.material.needsUpdate=!0)});for(let Y=0,tt=N.length;Y<tt;Y++){const W=N[Y],q=W.shadow;if(q===void 0){oe("WebGLShadowMap:",W,"has no shadow.");continue}if(q.autoUpdate===!1&&q.needsUpdate===!1)continue;l.copy(q.mapSize);const dt=q.getFrameExtents();l.multiply(dt),f.copy(q.mapSize),(l.x>x||l.y>x)&&(l.x>x&&(f.x=Math.floor(x/dt.x),l.x=f.x*dt.x,q.mapSize.x=f.x),l.y>x&&(f.y=Math.floor(x/dt.y),l.y=f.y*dt.y,q.mapSize.y=f.y));const ct=o.state.buffers.depth.getReversed();if(q.camera._reversedDepth=ct,q.map===null||st===!0){if(q.map!==null&&(q.map.depthTexture!==null&&(q.map.depthTexture.dispose(),q.map.depthTexture=null),q.map.dispose()),this.type===Ml){if(W.isPointLight){oe("WebGLShadowMap: VSM shadow maps are not supported for PointLights. Use PCF or BasicShadowMap instead.");continue}q.map=new Wi(l.x,l.y,{format:ar,type:ma,minFilter:Gn,magFilter:Gn,generateMipmaps:!1}),q.map.texture.name=W.name+".shadowMap",q.map.depthTexture=new Nl(l.x,l.y,fa),q.map.depthTexture.name=W.name+".shadowMapDepth",q.map.depthTexture.format=Va,q.map.depthTexture.compareFunction=null,q.map.depthTexture.minFilter=zn,q.map.depthTexture.magFilter=zn}else W.isPointLight?(q.map=new ES(l.x),q.map.depthTexture=new LT(l.x,pa)):(q.map=new Wi(l.x,l.y),q.map.depthTexture=new Nl(l.x,l.y,pa)),q.map.depthTexture.name=W.name+".shadowMap",q.map.depthTexture.format=Va,this.type===Tl?(q.map.depthTexture.compareFunction=ct?lm:om,q.map.depthTexture.minFilter=Gn,q.map.depthTexture.magFilter=Gn):(q.map.depthTexture.compareFunction=null,q.map.depthTexture.minFilter=zn,q.map.depthTexture.magFilter=zn);q.camera.updateProjectionMatrix()}q.map.isWebGLCubeRenderTarget!==!0&&(q.map.width!==l.x||q.map.height!==l.y)&&q.map.setSize(l.x,l.y);const rt=q.map.isWebGLCubeRenderTarget?6:q.getViewportCount();W.isPointLight!==!0&&q.updateMatrices(W,T);for(let bt=0;bt<rt;bt++){const Gt=q.getCamera(bt);if(W.isPointLight){const Ot=q.camera,z=q.matrix,_t=W.distance||Ot.far;_t!==Ot.far&&(Ot.far=_t,Ot.updateProjectionMatrix()),yl.setFromMatrixPosition(W.matrixWorld),Ot.position.copy(yl),sp.copy(Ot.position),sp.add(U3[bt]),Ot.up.copy(L3[bt]),Ot.lookAt(sp),Ot.updateMatrixWorld(),z.makeTranslation(-yl.x,-yl.y,-yl.z),Gx.multiplyMatrices(Ot.projectionMatrix,Ot.matrixWorldInverse),q._frustum.setFromProjectionMatrix(Gx,Ot.coordinateSystem,Ot.reversedDepth)}if(q.map.isWebGLCubeRenderTarget)o.setRenderTarget(q.map,bt),o.clear();else{bt===0&&(o.setRenderTarget(q.map),o.clear());const Ot=q.getViewport(bt);h.set(f.x*Ot.x,f.y*Ot.y,f.x*Ot.z,f.y*Ot.w),Q.viewport(h)}s=q.getFrustum(bt),C(P,T,Gt,W,this.type)}q.isPointLightShadow!==!0&&this.type===Ml&&O(q,T),q.needsUpdate=!1}S=this.type,y.needsUpdate=!1,o.setRenderTarget(U,F,V)};function O(N,P){const T=e.update(w);v.defines.VSM_SAMPLES!==N.blurSamples&&(v.defines.VSM_SAMPLES=N.blurSamples,M.defines.VSM_SAMPLES=N.blurSamples,v.needsUpdate=!0,M.needsUpdate=!0),N.mapPass===null?N.mapPass=new Wi(l.x,l.y,{format:ar,type:ma}):(N.mapPass.width!==N.map.width||N.mapPass.height!==N.map.height)&&N.mapPass.setSize(N.map.width,N.map.height),v.uniforms.shadow_pass.value=N.map.depthTexture,v.uniforms.resolution.value.set(N.map.width,N.map.height),v.uniforms.radius.value=N.radius,o.setRenderTarget(N.mapPass),o.clear(),o.renderBufferDirect(P,null,T,v,w,null),M.uniforms.shadow_pass.value=N.mapPass.texture,M.uniforms.resolution.value.set(N.map.width,N.map.height),M.uniforms.radius.value=N.radius,o.setRenderTarget(N.map),o.clear(),o.renderBufferDirect(P,null,T,M,w,null)}function G(N,P,T,U){let F=null;const V=T.isPointLight===!0?N.customDistanceMaterial:N.customDepthMaterial;if(V!==void 0)F=V;else if(F=T.isPointLight===!0?m:d,o.localClippingEnabled&&P.clipShadows===!0&&Array.isArray(P.clippingPlanes)&&P.clippingPlanes.length!==0||P.displacementMap&&P.displacementScale!==0||P.alphaMap&&P.alphaTest>0||P.map&&P.alphaTest>0||P.alphaToCoverage===!0){const Q=F.uuid,st=P.uuid;let Y=p[Q];Y===void 0&&(Y={},p[Q]=Y);let tt=Y[st];tt===void 0&&(tt=F.clone(),Y[st]=tt,P.addEventListener("dispose",D)),F=tt}if(F.visible=P.visible,F.wireframe=P.wireframe,U===Ml?F.side=P.shadowSide!==null?P.shadowSide:P.side:F.side=P.shadowSide!==null?P.shadowSide:_[P.side],F.alphaMap=P.alphaMap,F.alphaTest=P.alphaToCoverage===!0?.5:P.alphaTest,F.map=P.map,F.clipShadows=P.clipShadows,F.clippingPlanes=P.clippingPlanes,F.clipIntersection=P.clipIntersection,F.displacementMap=P.displacementMap,F.displacementScale=P.displacementScale,F.displacementBias=P.displacementBias,F.wireframeLinewidth=P.wireframeLinewidth,F.linewidth=P.linewidth,T.isPointLight===!0&&F.isMeshDistanceMaterial===!0){const Q=o.properties.get(F);Q.light=T}return F}function C(N,P,T,U,F){if(N.visible===!1)return;if(N.layers.test(P.layers)&&(N.isMesh||N.isLine||N.isPoints)&&(N.castShadow||N.receiveShadow&&F===Ml)&&(!N.frustumCulled||N.intersectsFrustum(s))){N.modelViewMatrix.multiplyMatrices(T.matrixWorldInverse,N.matrixWorld);const st=e.update(N),Y=N.material;if(Array.isArray(Y)){const tt=st.groups;for(let W=0,q=tt.length;W<q;W++){const dt=tt[W],ct=Y[dt.materialIndex];if(ct&&ct.visible){const rt=G(N,ct,U,F);N.onBeforeShadow(o,N,P,T,st,rt,dt),o.renderBufferDirect(T,null,st,rt,N,dt),N.onAfterShadow(o,N,P,T,st,rt,dt)}}}else if(Y.visible){const tt=G(N,Y,U,F);N.onBeforeShadow(o,N,P,T,st,tt,null),o.renderBufferDirect(T,null,st,tt,N,null),N.onAfterShadow(o,N,P,T,st,tt,null)}}const Q=N.children;for(let st=0,Y=Q.length;st<Y;st++)C(Q[st],P,T,U,F)}function D(N){N.target.removeEventListener("dispose",D);for(const T in p){const U=p[T],F=N.target.uuid;F in U&&(U[F].dispose(),delete U[F])}}}function P3(o,e){function i(){let k=!1;const zt=new on;let Tt=null;const Bt=new on(0,0,0,0);return{setMask:function(Yt){Tt!==Yt&&!k&&(o.colorMask(Yt,Yt,Yt,Yt),Tt=Yt)},setLocked:function(Yt){k=Yt},setClear:function(Yt,Rt,te,Wt,Ue){Ue===!0&&(Yt*=Wt,Rt*=Wt,te*=Wt),zt.set(Yt,Rt,te,Wt),Bt.equals(zt)===!1&&(o.clearColor(Yt,Rt,te,Wt),Bt.copy(zt))},reset:function(){k=!1,Tt=null,Bt.set(-1,0,0,0)}}}function s(){let k=!1,zt=!1,Tt=null,Bt=null,Yt=null;return{setReversed:function(Rt){if(zt!==Rt){const te=e.get("EXT_clip_control");Rt?te.clipControlEXT(te.LOWER_LEFT_EXT,te.ZERO_TO_ONE_EXT):te.clipControlEXT(te.LOWER_LEFT_EXT,te.NEGATIVE_ONE_TO_ONE_EXT),zt=Rt;const Wt=Yt;Yt=null,this.setClear(Wt)}},getReversed:function(){return zt},setTest:function(Rt){Rt?ft(o.DEPTH_TEST):wt(o.DEPTH_TEST)},setMask:function(Rt){Tt!==Rt&&!k&&(o.depthMask(Rt),Tt=Rt)},setFunc:function(Rt){if(zt&&(Rt=rT[Rt]),Bt!==Rt){switch(Rt){case up:o.depthFunc(o.NEVER);break;case cp:o.depthFunc(o.ALWAYS);break;case fp:o.depthFunc(o.LESS);break;case Rl:o.depthFunc(o.LEQUAL);break;case hp:o.depthFunc(o.EQUAL);break;case dp:o.depthFunc(o.GEQUAL);break;case pp:o.depthFunc(o.GREATER);break;case mp:o.depthFunc(o.NOTEQUAL);break;default:o.depthFunc(o.LEQUAL)}Bt=Rt}},setLocked:function(Rt){k=Rt},setClear:function(Rt){Yt!==Rt&&(Yt=Rt,zt&&(Rt=1-Rt),o.clearDepth(Rt))},reset:function(){k=!1,Tt=null,Bt=null,Yt=null,zt=!1}}}function l(){let k=!1,zt=null,Tt=null,Bt=null,Yt=null,Rt=null,te=null,Wt=null,Ue=null;return{setTest:function(fe){k||(fe?ft(o.STENCIL_TEST):wt(o.STENCIL_TEST))},setMask:function(fe){zt!==fe&&!k&&(o.stencilMask(fe),zt=fe)},setFunc:function(fe,si,Si){(Tt!==fe||Bt!==si||Yt!==Si)&&(o.stencilFunc(fe,si,Si),Tt=fe,Bt=si,Yt=Si)},setOp:function(fe,si,Si){(Rt!==fe||te!==si||Wt!==Si)&&(o.stencilOp(fe,si,Si),Rt=fe,te=si,Wt=Si)},setLocked:function(fe){k=fe},setClear:function(fe){Ue!==fe&&(o.clearStencil(fe),Ue=fe)},reset:function(){k=!1,zt=null,Tt=null,Bt=null,Yt=null,Rt=null,te=null,Wt=null,Ue=null}}}const f=new i,h=new s,d=new l,m=new WeakMap,p=new WeakMap;let x={},_={},v={},M=new WeakMap,R=[],w=null,y=!1,S=null,O=null,G=null,C=null,D=null,N=null,P=null,T=new Me(0,0,0),U=0,F=!1,V=null,Q=null,st=null,Y=null,tt=null;const W=o.getParameter(o.MAX_COMBINED_TEXTURE_IMAGE_UNITS);let q=!1,dt=0;const ct=o.getParameter(o.VERSION);ct.indexOf("WebGL")!==-1?(dt=parseFloat(/^WebGL (\d)/.exec(ct)[1]),q=dt>=1):ct.indexOf("OpenGL ES")!==-1&&(dt=parseFloat(/^OpenGL ES (\d)/.exec(ct)[1]),q=dt>=2);let rt=null,bt={};const Gt=o.getParameter(o.SCISSOR_BOX),Ot=o.getParameter(o.VIEWPORT),z=new on().fromArray(Gt),_t=new on().fromArray(Ot);function Nt(k,zt,Tt,Bt){const Yt=new Uint8Array(4),Rt=o.createTexture();o.bindTexture(k,Rt),o.texParameteri(k,o.TEXTURE_MIN_FILTER,o.NEAREST),o.texParameteri(k,o.TEXTURE_MAG_FILTER,o.NEAREST);for(let te=0;te<Tt;te++)k===o.TEXTURE_3D||k===o.TEXTURE_2D_ARRAY?o.texImage3D(zt,0,o.RGBA,1,1,Bt,0,o.RGBA,o.UNSIGNED_BYTE,Yt):o.texImage2D(zt+te,0,o.RGBA,1,1,0,o.RGBA,o.UNSIGNED_BYTE,Yt);return Rt}const Z={};Z[o.TEXTURE_2D]=Nt(o.TEXTURE_2D,o.TEXTURE_2D,1),Z[o.TEXTURE_CUBE_MAP]=Nt(o.TEXTURE_CUBE_MAP,o.TEXTURE_CUBE_MAP_POSITIVE_X,6),Z[o.TEXTURE_2D_ARRAY]=Nt(o.TEXTURE_2D_ARRAY,o.TEXTURE_2D_ARRAY,1,1),Z[o.TEXTURE_3D]=Nt(o.TEXTURE_3D,o.TEXTURE_3D,1,1),f.setClear(0,0,0,1),h.setClear(1),d.setClear(0),ft(o.DEPTH_TEST),h.setFunc(Rl),ee(!1),ne(Hv),ft(o.CULL_FACE),pe(Fa);function ft(k){x[k]!==!0&&(o.enable(k),x[k]=!0)}function wt(k){x[k]!==!1&&(o.disable(k),x[k]=!1)}function Pt(k,zt){return v[k]!==zt?(o.bindFramebuffer(k,zt),v[k]=zt,k===o.DRAW_FRAMEBUFFER&&(v[o.FRAMEBUFFER]=zt),k===o.FRAMEBUFFER&&(v[o.DRAW_FRAMEBUFFER]=zt),!0):!1}function vt(k,zt){let Tt=R,Bt=!1;if(k){Tt=M.get(zt),Tt===void 0&&(Tt=[],M.set(zt,Tt));const Yt=k.textures;if(Tt.length!==Yt.length||Tt[0]!==o.COLOR_ATTACHMENT0){for(let Rt=0,te=Yt.length;Rt<te;Rt++)Tt[Rt]=o.COLOR_ATTACHMENT0+Rt;Tt.length=Yt.length,Bt=!0}}else Tt[0]!==o.BACK&&(Tt[0]=o.BACK,Bt=!0);Bt&&o.drawBuffers(Tt)}function Ut(k){return w!==k?(o.useProgram(k),w=k,!0):!1}const Te={[ro]:o.FUNC_ADD,[RE]:o.FUNC_SUBTRACT,[CE]:o.FUNC_REVERSE_SUBTRACT};Te[wE]=o.MIN,Te[DE]=o.MAX;const ce={[NE]:o.ZERO,[UE]:o.ONE,[LE]:o.SRC_COLOR,[Wx]:o.SRC_ALPHA,[FE]:o.SRC_ALPHA_SATURATE,[zE]:o.DST_COLOR,[PE]:o.DST_ALPHA,[OE]:o.ONE_MINUS_SRC_COLOR,[Yx]:o.ONE_MINUS_SRC_ALPHA,[BE]:o.ONE_MINUS_DST_COLOR,[IE]:o.ONE_MINUS_DST_ALPHA,[HE]:o.CONSTANT_COLOR,[GE]:o.ONE_MINUS_CONSTANT_COLOR,[VE]:o.CONSTANT_ALPHA,[XE]:o.ONE_MINUS_CONSTANT_ALPHA};function pe(k,zt,Tt,Bt,Yt,Rt,te,Wt,Ue,fe){if(k===Fa){y===!0&&(wt(o.BLEND),y=!1);return}if(y===!1&&(ft(o.BLEND),y=!0),k!==AE){if(k!==S||fe!==F){if((O!==ro||D!==ro)&&(o.blendEquation(o.FUNC_ADD),O=ro,D=ro),fe)switch(k){case bl:o.blendFuncSeparate(o.ONE,o.ONE_MINUS_SRC_ALPHA,o.ONE,o.ONE_MINUS_SRC_ALPHA);break;case Gv:o.blendFunc(o.ONE,o.ONE);break;case Vv:o.blendFuncSeparate(o.ZERO,o.ONE_MINUS_SRC_COLOR,o.ZERO,o.ONE);break;case Xv:o.blendFuncSeparate(o.DST_COLOR,o.ONE_MINUS_SRC_ALPHA,o.ZERO,o.ONE);break;default:Fe("WebGLState: Invalid blending: ",k);break}else switch(k){case bl:o.blendFuncSeparate(o.SRC_ALPHA,o.ONE_MINUS_SRC_ALPHA,o.ONE,o.ONE_MINUS_SRC_ALPHA);break;case Gv:o.blendFuncSeparate(o.SRC_ALPHA,o.ONE,o.ONE,o.ONE);break;case Vv:Fe("WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true");break;case Xv:Fe("WebGLState: MultiplyBlending requires material.premultipliedAlpha = true");break;default:Fe("WebGLState: Invalid blending: ",k);break}G=null,C=null,N=null,P=null,T.set(0,0,0),U=0,S=k,F=fe}return}Yt=Yt||zt,Rt=Rt||Tt,te=te||Bt,(zt!==O||Yt!==D)&&(o.blendEquationSeparate(Te[zt],Te[Yt]),O=zt,D=Yt),(Tt!==G||Bt!==C||Rt!==N||te!==P)&&(o.blendFuncSeparate(ce[Tt],ce[Bt],ce[Rt],ce[te]),G=Tt,C=Bt,N=Rt,P=te),(Wt.equals(T)===!1||Ue!==U)&&(o.blendColor(Wt.r,Wt.g,Wt.b,Ue),T.copy(Wt),U=Ue),S=k,F=!1}function _e(k,zt){k.side===Li?wt(o.CULL_FACE):ft(o.CULL_FACE);let Tt=k.side===ai;zt&&(Tt=!Tt),ee(Tt),k.blending===bl&&k.transparent===!1?pe(Fa):pe(k.blending,k.blendEquation,k.blendSrc,k.blendDst,k.blendEquationAlpha,k.blendSrcAlpha,k.blendDstAlpha,k.blendColor,k.blendAlpha,k.premultipliedAlpha),h.setFunc(k.depthFunc),h.setTest(k.depthTest),h.setMask(k.depthWrite),f.setMask(k.colorWrite);const Bt=k.stencilWrite;d.setTest(Bt),Bt&&(d.setMask(k.stencilWriteMask),d.setFunc(k.stencilFunc,k.stencilRef,k.stencilFuncMask),d.setOp(k.stencilFail,k.stencilZFail,k.stencilZPass)),sn(k.polygonOffset,k.polygonOffsetFactor,k.polygonOffsetUnits),k.alphaToCoverage===!0?ft(o.SAMPLE_ALPHA_TO_COVERAGE):wt(o.SAMPLE_ALPHA_TO_COVERAGE)}function ee(k){V!==k&&(k?o.frontFace(o.CW):o.frontFace(o.CCW),V=k)}function ne(k){k!==EE?(ft(o.CULL_FACE),k!==Q&&(k===Hv?o.cullFace(o.BACK):k===TE?o.cullFace(o.FRONT):o.cullFace(o.FRONT_AND_BACK))):wt(o.CULL_FACE),Q=k}function Be(k){k!==st&&(q&&o.lineWidth(k),st=k)}function sn(k,zt,Tt){k?(ft(o.POLYGON_OFFSET_FILL),(Y!==zt||tt!==Tt)&&(Y=zt,tt=Tt,h.getReversed()&&(zt=-zt),o.polygonOffset(zt,Tt))):wt(o.POLYGON_OFFSET_FILL)}function Pe(k){k?ft(o.SCISSOR_TEST):wt(o.SCISSOR_TEST)}function Je(k){k===void 0&&(k=o.TEXTURE0+W-1),rt!==k&&(o.activeTexture(k),rt=k)}function X(k,zt,Tt){Tt===void 0&&(rt===null?Tt=o.TEXTURE0+W-1:Tt=rt);let Bt=bt[Tt];Bt===void 0&&(Bt={type:void 0,texture:void 0},bt[Tt]=Bt),(Bt.type!==k||Bt.texture!==zt)&&(rt!==Tt&&(o.activeTexture(Tt),rt=Tt),o.bindTexture(k,zt||Z[k]),Bt.type=k,Bt.texture=zt)}function je(){const k=bt[rt];k!==void 0&&k.type!==void 0&&(o.bindTexture(k.type,null),k.type=void 0,k.texture=void 0)}function Ee(){try{o.compressedTexImage2D(...arguments)}catch(k){Fe("WebGLState:",k)}}function L(){try{o.compressedTexImage3D(...arguments)}catch(k){Fe("WebGLState:",k)}}function E(){try{o.texSubImage2D(...arguments)}catch(k){Fe("WebGLState:",k)}}function et(){try{o.texSubImage3D(...arguments)}catch(k){Fe("WebGLState:",k)}}function at(){try{o.compressedTexSubImage2D(...arguments)}catch(k){Fe("WebGLState:",k)}}function gt(){try{o.compressedTexSubImage3D(...arguments)}catch(k){Fe("WebGLState:",k)}}function Dt(){try{o.texStorage2D(...arguments)}catch(k){Fe("WebGLState:",k)}}function It(){try{o.texStorage3D(...arguments)}catch(k){Fe("WebGLState:",k)}}function xt(){try{o.texImage2D(...arguments)}catch(k){Fe("WebGLState:",k)}}function St(){try{o.texImage3D(...arguments)}catch(k){Fe("WebGLState:",k)}}function mt(k){return _[k]!==void 0?_[k]:o.getParameter(k)}function Ct(k,zt){_[k]!==zt&&(o.pixelStorei(k,zt),_[k]=zt)}function yt(k){z.equals(k)===!1&&(o.scissor(k.x,k.y,k.z,k.w),z.copy(k))}function At(k){_t.equals(k)===!1&&(o.viewport(k.x,k.y,k.z,k.w),_t.copy(k))}function Lt(k,zt){let Tt=p.get(zt);Tt===void 0&&(Tt=new WeakMap,p.set(zt,Tt));let Bt=Tt.get(k);Bt===void 0&&(Bt=o.getUniformBlockIndex(zt,k.name),Tt.set(k,Bt))}function Qt(k,zt){const Bt=p.get(zt).get(k);m.get(zt)!==Bt&&(o.uniformBlockBinding(zt,Bt,k.__bindingPointIndex),m.set(zt,Bt))}function ae(){o.disable(o.BLEND),o.disable(o.CULL_FACE),o.disable(o.DEPTH_TEST),o.disable(o.POLYGON_OFFSET_FILL),o.disable(o.SCISSOR_TEST),o.disable(o.STENCIL_TEST),o.disable(o.SAMPLE_ALPHA_TO_COVERAGE),o.blendEquation(o.FUNC_ADD),o.blendFunc(o.ONE,o.ZERO),o.blendFuncSeparate(o.ONE,o.ZERO,o.ONE,o.ZERO),o.blendColor(0,0,0,0),o.colorMask(!0,!0,!0,!0),o.clearColor(0,0,0,0),o.depthMask(!0),o.depthFunc(o.LESS),h.setReversed(!1),o.clearDepth(1),o.stencilMask(4294967295),o.stencilFunc(o.ALWAYS,0,4294967295),o.stencilOp(o.KEEP,o.KEEP,o.KEEP),o.clearStencil(0),o.cullFace(o.BACK),o.frontFace(o.CCW),o.polygonOffset(0,0),o.activeTexture(o.TEXTURE0),o.bindFramebuffer(o.FRAMEBUFFER,null),o.bindFramebuffer(o.DRAW_FRAMEBUFFER,null),o.bindFramebuffer(o.READ_FRAMEBUFFER,null),o.useProgram(null),o.lineWidth(1),o.scissor(0,0,o.canvas.width,o.canvas.height),o.viewport(0,0,o.canvas.width,o.canvas.height),o.pixelStorei(o.PACK_ALIGNMENT,4),o.pixelStorei(o.UNPACK_ALIGNMENT,4),o.pixelStorei(o.UNPACK_FLIP_Y_WEBGL,!1),o.pixelStorei(o.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),o.pixelStorei(o.UNPACK_COLORSPACE_CONVERSION_WEBGL,o.BROWSER_DEFAULT_WEBGL),o.pixelStorei(o.PACK_ROW_LENGTH,0),o.pixelStorei(o.PACK_SKIP_PIXELS,0),o.pixelStorei(o.PACK_SKIP_ROWS,0),o.pixelStorei(o.UNPACK_ROW_LENGTH,0),o.pixelStorei(o.UNPACK_IMAGE_HEIGHT,0),o.pixelStorei(o.UNPACK_SKIP_PIXELS,0),o.pixelStorei(o.UNPACK_SKIP_ROWS,0),o.pixelStorei(o.UNPACK_SKIP_IMAGES,0),x={},_={},rt=null,bt={},v={},M=new WeakMap,R=[],w=null,y=!1,S=null,O=null,G=null,C=null,D=null,N=null,P=null,T=new Me(0,0,0),U=0,F=!1,V=null,Q=null,st=null,Y=null,tt=null,z.set(0,0,o.canvas.width,o.canvas.height),_t.set(0,0,o.canvas.width,o.canvas.height),f.reset(),h.reset(),d.reset()}return{buffers:{color:f,depth:h,stencil:d},enable:ft,disable:wt,bindFramebuffer:Pt,drawBuffers:vt,useProgram:Ut,setBlending:pe,setMaterial:_e,setFlipSided:ee,setCullFace:ne,setLineWidth:Be,setPolygonOffset:sn,setScissorTest:Pe,activeTexture:Je,bindTexture:X,unbindTexture:je,compressedTexImage2D:Ee,compressedTexImage3D:L,texImage2D:xt,texImage3D:St,pixelStorei:Ct,getParameter:mt,updateUBOMapping:Lt,uniformBlockBinding:Qt,texStorage2D:Dt,texStorage3D:It,texSubImage2D:E,texSubImage3D:et,compressedTexSubImage2D:at,compressedTexSubImage3D:gt,scissor:yt,viewport:At,reset:ae}}function I3(o,e,i,s,l,f,h){const d=e.has("WEBGL_multisampled_render_to_texture")?e.get("WEBGL_multisampled_render_to_texture"):null,m=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),p=new le,x=new WeakMap,_=new Set;let v;const M=new WeakMap;let R=!1;try{R=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function w(L,E){return R?new OffscreenCanvas(L,E):Hc("canvas")}function y(L,E,et){let at=1;const gt=Ee(L);if((gt.width>et||gt.height>et)&&(at=et/Math.max(gt.width,gt.height)),at<1)if(typeof HTMLImageElement<"u"&&L instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&L instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&L instanceof ImageBitmap||typeof VideoFrame<"u"&&L instanceof VideoFrame){const Dt=Math.floor(at*gt.width),It=Math.floor(at*gt.height);v===void 0&&(v=w(Dt,It));const xt=E?w(Dt,It):v;return xt.width=Dt,xt.height=It,xt.getContext("2d").drawImage(L,0,0,Dt,It),oe("WebGLRenderer: Texture has been resized from ("+gt.width+"x"+gt.height+") to ("+Dt+"x"+It+")."),xt}else return"data"in L&&oe("WebGLRenderer: Image in DataTexture is too big ("+gt.width+"x"+gt.height+")."),L;return L}function S(L){return L.generateMipmaps}function O(L){o.generateMipmap(L)}function G(L){return L.isWebGLCubeRenderTarget?o.TEXTURE_CUBE_MAP:L.isWebGL3DRenderTarget?o.TEXTURE_3D:L.isWebGLArrayRenderTarget||L.isCompressedArrayTexture?o.TEXTURE_2D_ARRAY:o.TEXTURE_2D}function C(L,E,et,at,gt,Dt=!1){if(L!==null){if(o[L]!==void 0)return o[L];oe("WebGLRenderer: Attempt to use non-existing WebGL internal format '"+L+"'")}let It;at&&(It=e.get("EXT_texture_norm16"),It||oe("WebGLRenderer: Unable to use normalized textures without EXT_texture_norm16 extension"));let xt=E;if(E===o.RED&&(et===o.FLOAT&&(xt=o.R32F),et===o.HALF_FLOAT&&(xt=o.R16F),et===o.UNSIGNED_BYTE&&(xt=o.R8),et===o.UNSIGNED_SHORT&&It&&(xt=It.R16_EXT),et===o.SHORT&&It&&(xt=It.R16_SNORM_EXT)),E===o.RED_INTEGER&&(et===o.UNSIGNED_BYTE&&(xt=o.R8UI),et===o.UNSIGNED_SHORT&&(xt=o.R16UI),et===o.UNSIGNED_INT&&(xt=o.R32UI),et===o.BYTE&&(xt=o.R8I),et===o.SHORT&&(xt=o.R16I),et===o.INT&&(xt=o.R32I)),E===o.RG&&(et===o.FLOAT&&(xt=o.RG32F),et===o.HALF_FLOAT&&(xt=o.RG16F),et===o.UNSIGNED_BYTE&&(xt=o.RG8),et===o.UNSIGNED_SHORT&&It&&(xt=It.RG16_EXT),et===o.SHORT&&It&&(xt=It.RG16_SNORM_EXT)),E===o.RG_INTEGER&&(et===o.UNSIGNED_BYTE&&(xt=o.RG8UI),et===o.UNSIGNED_SHORT&&(xt=o.RG16UI),et===o.UNSIGNED_INT&&(xt=o.RG32UI),et===o.BYTE&&(xt=o.RG8I),et===o.SHORT&&(xt=o.RG16I),et===o.INT&&(xt=o.RG32I)),E===o.RGB_INTEGER&&(et===o.UNSIGNED_BYTE&&(xt=o.RGB8UI),et===o.UNSIGNED_SHORT&&(xt=o.RGB16UI),et===o.UNSIGNED_INT&&(xt=o.RGB32UI),et===o.BYTE&&(xt=o.RGB8I),et===o.SHORT&&(xt=o.RGB16I),et===o.INT&&(xt=o.RGB32I)),E===o.RGBA_INTEGER&&(et===o.UNSIGNED_BYTE&&(xt=o.RGBA8UI),et===o.UNSIGNED_SHORT&&(xt=o.RGBA16UI),et===o.UNSIGNED_INT&&(xt=o.RGBA32UI),et===o.BYTE&&(xt=o.RGBA8I),et===o.SHORT&&(xt=o.RGBA16I),et===o.INT&&(xt=o.RGBA32I)),E===o.RGB&&(et===o.UNSIGNED_SHORT&&It&&(xt=It.RGB16_EXT),et===o.SHORT&&It&&(xt=It.RGB16_SNORM_EXT),et===o.UNSIGNED_INT_5_9_9_9_REV&&(xt=o.RGB9_E5),et===o.UNSIGNED_INT_10F_11F_11F_REV&&(xt=o.R11F_G11F_B10F)),E===o.RGBA){const St=Dt?Fc:Oe.getTransfer(gt);et===o.FLOAT&&(xt=o.RGBA32F),et===o.HALF_FLOAT&&(xt=o.RGBA16F),et===o.UNSIGNED_BYTE&&(xt=St===qe?o.SRGB8_ALPHA8:o.RGBA8),et===o.UNSIGNED_SHORT&&It&&(xt=It.RGBA16_EXT),et===o.SHORT&&It&&(xt=It.RGBA16_SNORM_EXT),et===o.UNSIGNED_SHORT_4_4_4_4&&(xt=o.RGBA4),et===o.UNSIGNED_SHORT_5_5_5_1&&(xt=o.RGB5_A1)}return(xt===o.R16F||xt===o.R32F||xt===o.RG16F||xt===o.RG32F||xt===o.RGBA16F||xt===o.RGBA32F)&&e.get("EXT_color_buffer_float"),xt}function D(L,E){let et;return L?E===null||E===pa||E===wl?et=o.DEPTH24_STENCIL8:E===fa?et=o.DEPTH32F_STENCIL8:E===Cl&&(et=o.DEPTH24_STENCIL8,oe("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):E===null||E===pa||E===wl?et=o.DEPTH_COMPONENT24:E===fa?et=o.DEPTH_COMPONENT32F:E===Cl&&(et=o.DEPTH_COMPONENT16),et}function N(L,E){return S(L)===!0||L.isFramebufferTexture&&L.minFilter!==zn&&L.minFilter!==Gn?Math.log2(Math.max(E.width,E.height))+1:L.mipmaps!==void 0&&L.mipmaps.length>0?L.mipmaps.length:L.isCompressedTexture&&Array.isArray(L.image)?E.mipmaps.length:1}function P(L){const E=L.target;E.removeEventListener("dispose",P),U(E),E.isVideoTexture&&x.delete(E),E.isHTMLTexture&&_.delete(E)}function T(L){const E=L.target;E.removeEventListener("dispose",T),V(E)}function U(L){const E=s.get(L);if(E.__webglInit===void 0)return;const et=L.source,at=M.get(et);if(at){const gt=at[E.__cacheKey];gt.usedTimes--,gt.usedTimes===0&&F(L),Object.keys(at).length===0&&M.delete(et)}s.remove(L)}function F(L){const E=s.get(L);o.deleteTexture(E.__webglTexture);const et=L.source,at=M.get(et);delete at[E.__cacheKey],h.memory.textures--}function V(L){const E=s.get(L);if(L.depthTexture&&(L.depthTexture.dispose(),s.remove(L.depthTexture)),L.isWebGLCubeRenderTarget)for(let at=0;at<6;at++){if(Array.isArray(E.__webglFramebuffer[at]))for(let gt=0;gt<E.__webglFramebuffer[at].length;gt++)o.deleteFramebuffer(E.__webglFramebuffer[at][gt]);else o.deleteFramebuffer(E.__webglFramebuffer[at]);E.__webglDepthbuffer&&o.deleteRenderbuffer(E.__webglDepthbuffer[at])}else{if(Array.isArray(E.__webglFramebuffer))for(let at=0;at<E.__webglFramebuffer.length;at++)o.deleteFramebuffer(E.__webglFramebuffer[at]);else o.deleteFramebuffer(E.__webglFramebuffer);if(E.__webglDepthbuffer&&o.deleteRenderbuffer(E.__webglDepthbuffer),E.__webglMultisampledFramebuffer&&o.deleteFramebuffer(E.__webglMultisampledFramebuffer),E.__webglColorRenderbuffer)for(let at=0;at<E.__webglColorRenderbuffer.length;at++)E.__webglColorRenderbuffer[at]&&o.deleteRenderbuffer(E.__webglColorRenderbuffer[at]);E.__webglDepthRenderbuffer&&o.deleteRenderbuffer(E.__webglDepthRenderbuffer)}const et=L.textures;for(let at=0,gt=et.length;at<gt;at++){const Dt=s.get(et[at]);Dt.__webglTexture&&(o.deleteTexture(Dt.__webglTexture),h.memory.textures--),s.remove(et[at])}s.remove(L)}let Q=0;function st(){Q=0}function Y(){return Q}function tt(L){Q=L}function W(){const L=Q;return L>=l.maxTextures&&oe("WebGLTextures: Trying to use "+(L+1)+" texture units while this GPU supports only "+l.maxTextures),Q+=1,L}function q(L){const E=[];return E.push(L.wrapS),E.push(L.wrapT),E.push(L.wrapR||0),E.push(L.magFilter),E.push(L.minFilter),E.push(L.anisotropy),E.push(L.internalFormat),E.push(L.format),E.push(L.type),E.push(L.generateMipmaps),E.push(L.premultiplyAlpha),E.push(L.flipY),E.push(L.unpackAlignment),E.push(L.colorSpace),E.join()}function dt(L,E){const et=s.get(L);if(L.isVideoTexture&&X(L),L.isRenderTargetTexture===!1&&L.isExternalTexture!==!0&&L.version>0&&et.__version!==L.version){const at=L.image;if(at===null)oe("WebGLRenderer: Texture marked for update but no image data found.");else if(at.complete===!1)oe("WebGLRenderer: Texture marked for update but image is incomplete");else{wt(et,L,E);return}}else L.isExternalTexture&&(et.__webglTexture=L.sourceTexture?L.sourceTexture:null);i.bindTexture(o.TEXTURE_2D,et.__webglTexture,o.TEXTURE0+E)}function ct(L,E){const et=s.get(L);if(L.isRenderTargetTexture===!1&&L.version>0&&et.__version!==L.version){wt(et,L,E);return}else L.isExternalTexture&&(et.__webglTexture=L.sourceTexture?L.sourceTexture:null);i.bindTexture(o.TEXTURE_2D_ARRAY,et.__webglTexture,o.TEXTURE0+E)}function rt(L,E){const et=s.get(L);if(L.isRenderTargetTexture===!1&&L.version>0&&et.__version!==L.version){wt(et,L,E);return}i.bindTexture(o.TEXTURE_3D,et.__webglTexture,o.TEXTURE0+E)}function bt(L,E){const et=s.get(L);if(L.isCubeDepthTexture!==!0&&L.version>0&&et.__version!==L.version){Pt(et,L,E);return}i.bindTexture(o.TEXTURE_CUBE_MAP,et.__webglTexture,o.TEXTURE0+E)}const Gt={[gp]:o.REPEAT,[Ba]:o.CLAMP_TO_EDGE,[_p]:o.MIRRORED_REPEAT},Ot={[zn]:o.NEAREST,[YE]:o.NEAREST_MIPMAP_NEAREST,[nc]:o.NEAREST_MIPMAP_LINEAR,[Gn]:o.LINEAR,[Cd]:o.LINEAR_MIPMAP_NEAREST,[tr]:o.LINEAR_MIPMAP_LINEAR},z={[KE]:o.NEVER,[eT]:o.ALWAYS,[QE]:o.LESS,[om]:o.LEQUAL,[JE]:o.EQUAL,[lm]:o.GEQUAL,[$E]:o.GREATER,[tT]:o.NOTEQUAL};function _t(L,E){if(E.type===fa&&e.has("OES_texture_float_linear")===!1&&(E.magFilter===Gn||E.magFilter===Cd||E.magFilter===nc||E.magFilter===tr||E.minFilter===Gn||E.minFilter===Cd||E.minFilter===nc||E.minFilter===tr)&&oe("WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),o.texParameteri(L,o.TEXTURE_WRAP_S,Gt[E.wrapS]),o.texParameteri(L,o.TEXTURE_WRAP_T,Gt[E.wrapT]),(L===o.TEXTURE_3D||L===o.TEXTURE_2D_ARRAY)&&o.texParameteri(L,o.TEXTURE_WRAP_R,Gt[E.wrapR]),o.texParameteri(L,o.TEXTURE_MAG_FILTER,Ot[E.magFilter]),o.texParameteri(L,o.TEXTURE_MIN_FILTER,Ot[E.minFilter]),E.compareFunction&&(o.texParameteri(L,o.TEXTURE_COMPARE_MODE,o.COMPARE_REF_TO_TEXTURE),o.texParameteri(L,o.TEXTURE_COMPARE_FUNC,z[E.compareFunction])),e.has("EXT_texture_filter_anisotropic")===!0){if(E.magFilter===zn||E.minFilter!==nc&&E.minFilter!==tr||E.type===fa&&e.has("OES_texture_float_linear")===!1)return;if(E.anisotropy>1||s.get(E).__currentAnisotropy){const et=e.get("EXT_texture_filter_anisotropic");o.texParameterf(L,et.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(E.anisotropy,l.getMaxAnisotropy())),s.get(E).__currentAnisotropy=E.anisotropy}}}function Nt(L,E){let et=!1;L.__webglInit===void 0&&(L.__webglInit=!0,E.addEventListener("dispose",P));const at=E.source;let gt=M.get(at);gt===void 0&&(gt={},M.set(at,gt));const Dt=q(E);if(Dt!==L.__cacheKey){gt[Dt]===void 0&&(gt[Dt]={texture:o.createTexture(),usedTimes:0},h.memory.textures++,et=!0),gt[Dt].usedTimes++;const It=gt[L.__cacheKey];It!==void 0&&(gt[L.__cacheKey].usedTimes--,It.usedTimes===0&&F(E)),L.__cacheKey=Dt,L.__webglTexture=gt[Dt].texture}return et}function Z(L,E,et){return Math.floor(Math.floor(L/et)/E)}function ft(L,E,et,at){const Dt=L.updateRanges;if(Dt.length===0)i.texSubImage2D(o.TEXTURE_2D,0,0,0,E.width,E.height,et,at,E.data);else{Dt.sort((Ct,yt)=>Ct.start-yt.start);let It=0;for(let Ct=1;Ct<Dt.length;Ct++){const yt=Dt[It],At=Dt[Ct],Lt=yt.start+yt.count,Qt=Z(At.start,E.width,4),ae=Z(yt.start,E.width,4);At.start<=Lt+1&&Qt===ae&&Z(At.start+At.count-1,E.width,4)===Qt?yt.count=Math.max(yt.count,At.start+At.count-yt.start):(++It,Dt[It]=At)}Dt.length=It+1;const xt=i.getParameter(o.UNPACK_ROW_LENGTH),St=i.getParameter(o.UNPACK_SKIP_PIXELS),mt=i.getParameter(o.UNPACK_SKIP_ROWS);i.pixelStorei(o.UNPACK_ROW_LENGTH,E.width);for(let Ct=0,yt=Dt.length;Ct<yt;Ct++){const At=Dt[Ct],Lt=Math.floor(At.start/4),Qt=Math.ceil(At.count/4),ae=Lt%E.width,k=Math.floor(Lt/E.width),zt=Qt,Tt=1;i.pixelStorei(o.UNPACK_SKIP_PIXELS,ae),i.pixelStorei(o.UNPACK_SKIP_ROWS,k),i.texSubImage2D(o.TEXTURE_2D,0,ae,k,zt,Tt,et,at,E.data)}L.clearUpdateRanges(),i.pixelStorei(o.UNPACK_ROW_LENGTH,xt),i.pixelStorei(o.UNPACK_SKIP_PIXELS,St),i.pixelStorei(o.UNPACK_SKIP_ROWS,mt)}}function wt(L,E,et){let at=o.TEXTURE_2D;(E.isDataArrayTexture||E.isCompressedArrayTexture)&&(at=o.TEXTURE_2D_ARRAY),E.isData3DTexture&&(at=o.TEXTURE_3D);const gt=Nt(L,E),Dt=E.source;i.bindTexture(at,L.__webglTexture,o.TEXTURE0+et);const It=s.get(Dt);if(Dt.version!==It.__version||gt===!0){if(i.activeTexture(o.TEXTURE0+et),(typeof ImageBitmap<"u"&&E.image instanceof ImageBitmap)===!1){const Tt=Oe.getPrimaries(Oe.workingColorSpace),Bt=E.colorSpace===Ms?null:Oe.getPrimaries(E.colorSpace),Yt=E.colorSpace===Ms||Tt===Bt?o.NONE:o.BROWSER_DEFAULT_WEBGL;i.pixelStorei(o.UNPACK_FLIP_Y_WEBGL,E.flipY),i.pixelStorei(o.UNPACK_PREMULTIPLY_ALPHA_WEBGL,E.premultiplyAlpha),i.pixelStorei(o.UNPACK_COLORSPACE_CONVERSION_WEBGL,Yt)}i.pixelStorei(o.UNPACK_ALIGNMENT,E.unpackAlignment);let St=y(E.image,!1,l.maxTextureSize);St=je(E,St);const mt=f.convert(E.format,E.colorSpace),Ct=f.convert(E.type);let yt=C(E.internalFormat,mt,Ct,E.normalized,E.colorSpace,E.isVideoTexture);_t(at,E);let At;const Lt=E.mipmaps,Qt=E.isVideoTexture!==!0,ae=It.__version===void 0||gt===!0,k=Dt.dataReady,zt=N(E,St);if(E.isDepthTexture)yt=D(E.format===er,E.type),ae&&(Qt?i.texStorage2D(o.TEXTURE_2D,1,yt,St.width,St.height):i.texImage2D(o.TEXTURE_2D,0,yt,St.width,St.height,0,mt,Ct,null));else if(E.isDataTexture)if(Lt.length>0){Qt&&ae&&i.texStorage2D(o.TEXTURE_2D,zt,yt,Lt[0].width,Lt[0].height);for(let Tt=0,Bt=Lt.length;Tt<Bt;Tt++)At=Lt[Tt],Qt?k&&i.texSubImage2D(o.TEXTURE_2D,Tt,0,0,At.width,At.height,mt,Ct,At.data):i.texImage2D(o.TEXTURE_2D,Tt,yt,At.width,At.height,0,mt,Ct,At.data);E.generateMipmaps=!1}else Qt?(ae&&i.texStorage2D(o.TEXTURE_2D,zt,yt,St.width,St.height),k&&ft(E,St,mt,Ct)):i.texImage2D(o.TEXTURE_2D,0,yt,St.width,St.height,0,mt,Ct,St.data);else if(E.isCompressedTexture)if(E.isCompressedArrayTexture){Qt&&ae&&i.texStorage3D(o.TEXTURE_2D_ARRAY,zt,yt,Lt[0].width,Lt[0].height,St.depth);for(let Tt=0,Bt=Lt.length;Tt<Bt;Tt++)if(At=Lt[Tt],E.format!==ki)if(mt!==null)if(Qt){if(k)if(E.layerUpdates.size>0){const Yt=xx(At.width,At.height,E.format,E.type);for(const Rt of E.layerUpdates){const te=At.data.subarray(Rt*Yt/At.data.BYTES_PER_ELEMENT,(Rt+1)*Yt/At.data.BYTES_PER_ELEMENT);i.compressedTexSubImage3D(o.TEXTURE_2D_ARRAY,Tt,0,0,Rt,At.width,At.height,1,mt,te)}}else i.compressedTexSubImage3D(o.TEXTURE_2D_ARRAY,Tt,0,0,0,At.width,At.height,St.depth,mt,At.data)}else i.compressedTexImage3D(o.TEXTURE_2D_ARRAY,Tt,yt,At.width,At.height,St.depth,0,At.data,0,0);else oe("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else Qt?k&&i.texSubImage3D(o.TEXTURE_2D_ARRAY,Tt,0,0,0,At.width,At.height,St.depth,mt,Ct,At.data):i.texImage3D(o.TEXTURE_2D_ARRAY,Tt,yt,At.width,At.height,St.depth,0,mt,Ct,At.data);E.layerUpdates.size>0&&E.clearLayerUpdates()}else{Qt&&ae&&i.texStorage2D(o.TEXTURE_2D,zt,yt,Lt[0].width,Lt[0].height);for(let Tt=0,Bt=Lt.length;Tt<Bt;Tt++)At=Lt[Tt],E.format!==ki?mt!==null?Qt?k&&i.compressedTexSubImage2D(o.TEXTURE_2D,Tt,0,0,At.width,At.height,mt,At.data):i.compressedTexImage2D(o.TEXTURE_2D,Tt,yt,At.width,At.height,0,At.data):oe("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):Qt?k&&i.texSubImage2D(o.TEXTURE_2D,Tt,0,0,At.width,At.height,mt,Ct,At.data):i.texImage2D(o.TEXTURE_2D,Tt,yt,At.width,At.height,0,mt,Ct,At.data)}else if(E.isDataArrayTexture)if(Qt){if(ae&&i.texStorage3D(o.TEXTURE_2D_ARRAY,zt,yt,St.width,St.height,St.depth),k)if(E.layerUpdates.size>0){const Tt=xx(St.width,St.height,E.format,E.type);for(const Bt of E.layerUpdates){const Yt=St.data.subarray(Bt*Tt/St.data.BYTES_PER_ELEMENT,(Bt+1)*Tt/St.data.BYTES_PER_ELEMENT);i.texSubImage3D(o.TEXTURE_2D_ARRAY,0,0,0,Bt,St.width,St.height,1,mt,Ct,Yt)}E.clearLayerUpdates()}else i.texSubImage3D(o.TEXTURE_2D_ARRAY,0,0,0,0,St.width,St.height,St.depth,mt,Ct,St.data)}else i.texImage3D(o.TEXTURE_2D_ARRAY,0,yt,St.width,St.height,St.depth,0,mt,Ct,St.data);else if(E.isData3DTexture)Qt?(ae&&i.texStorage3D(o.TEXTURE_3D,zt,yt,St.width,St.height,St.depth),k&&i.texSubImage3D(o.TEXTURE_3D,0,0,0,0,St.width,St.height,St.depth,mt,Ct,St.data)):i.texImage3D(o.TEXTURE_3D,0,yt,St.width,St.height,St.depth,0,mt,Ct,St.data);else if(E.isFramebufferTexture){if(ae)if(Qt)i.texStorage2D(o.TEXTURE_2D,zt,yt,St.width,St.height);else{let Tt=St.width,Bt=St.height;for(let Yt=0;Yt<zt;Yt++)i.texImage2D(o.TEXTURE_2D,Yt,yt,Tt,Bt,0,mt,Ct,null),Tt>>=1,Bt>>=1}}else if(E.isHTMLTexture){if("texElementImage2D"in o){const Tt=o.canvas;if(Tt.hasAttribute("layoutsubtree")||Tt.setAttribute("layoutsubtree","true"),St.parentNode!==Tt){Tt.appendChild(St),_.add(E),Tt.onpaint=Bt=>{const Yt=Bt.changedElements;for(const Rt of _)Yt.includes(Rt.image)&&(Rt.needsUpdate=!0)},Tt.requestPaint();return}if(o.texElementImage2D.length===3)o.texElementImage2D(o.TEXTURE_2D,o.RGBA8,St);else{const Yt=o.RGBA,Rt=o.RGBA,te=o.UNSIGNED_BYTE;o.texElementImage2D(o.TEXTURE_2D,0,Yt,Rt,te,St)}o.texParameteri(o.TEXTURE_2D,o.TEXTURE_MIN_FILTER,o.LINEAR),o.texParameteri(o.TEXTURE_2D,o.TEXTURE_WRAP_S,o.CLAMP_TO_EDGE),o.texParameteri(o.TEXTURE_2D,o.TEXTURE_WRAP_T,o.CLAMP_TO_EDGE)}}else if(Lt.length>0){if(Qt&&ae){const Tt=Ee(Lt[0]);i.texStorage2D(o.TEXTURE_2D,zt,yt,Tt.width,Tt.height)}for(let Tt=0,Bt=Lt.length;Tt<Bt;Tt++)At=Lt[Tt],Qt?k&&i.texSubImage2D(o.TEXTURE_2D,Tt,0,0,mt,Ct,At):i.texImage2D(o.TEXTURE_2D,Tt,yt,mt,Ct,At);E.generateMipmaps=!1}else if(Qt){if(ae){const Tt=Ee(St);i.texStorage2D(o.TEXTURE_2D,zt,yt,Tt.width,Tt.height)}k&&i.texSubImage2D(o.TEXTURE_2D,0,0,0,mt,Ct,St)}else i.texImage2D(o.TEXTURE_2D,0,yt,mt,Ct,St);S(E)&&O(at),It.__version=Dt.version,E.onUpdate&&E.onUpdate(E)}L.__version=E.version}function Pt(L,E,et){if(E.image.length!==6)return;const at=Nt(L,E),gt=E.source;i.bindTexture(o.TEXTURE_CUBE_MAP,L.__webglTexture,o.TEXTURE0+et);const Dt=s.get(gt);if(gt.version!==Dt.__version||at===!0){i.activeTexture(o.TEXTURE0+et);const It=Oe.getPrimaries(Oe.workingColorSpace),xt=E.colorSpace===Ms?null:Oe.getPrimaries(E.colorSpace),St=E.colorSpace===Ms||It===xt?o.NONE:o.BROWSER_DEFAULT_WEBGL;i.pixelStorei(o.UNPACK_FLIP_Y_WEBGL,E.flipY),i.pixelStorei(o.UNPACK_PREMULTIPLY_ALPHA_WEBGL,E.premultiplyAlpha),i.pixelStorei(o.UNPACK_ALIGNMENT,E.unpackAlignment),i.pixelStorei(o.UNPACK_COLORSPACE_CONVERSION_WEBGL,St);const mt=E.isCompressedTexture||E.image[0].isCompressedTexture,Ct=E.image[0]&&E.image[0].isDataTexture,yt=[];for(let Rt=0;Rt<6;Rt++)!mt&&!Ct?yt[Rt]=y(E.image[Rt],!0,l.maxCubemapSize):yt[Rt]=Ct?E.image[Rt].image:E.image[Rt],yt[Rt]=je(E,yt[Rt]);const At=yt[0],Lt=f.convert(E.format,E.colorSpace),Qt=f.convert(E.type),ae=C(E.internalFormat,Lt,Qt,E.normalized,E.colorSpace),k=E.isVideoTexture!==!0,zt=Dt.__version===void 0||at===!0,Tt=gt.dataReady;let Bt=N(E,At);_t(o.TEXTURE_CUBE_MAP,E);let Yt;if(mt){k&&zt&&i.texStorage2D(o.TEXTURE_CUBE_MAP,Bt,ae,At.width,At.height);for(let Rt=0;Rt<6;Rt++){Yt=yt[Rt].mipmaps;for(let te=0;te<Yt.length;te++){const Wt=Yt[te];E.format!==ki?Lt!==null?k?Tt&&i.compressedTexSubImage2D(o.TEXTURE_CUBE_MAP_POSITIVE_X+Rt,te,0,0,Wt.width,Wt.height,Lt,Wt.data):i.compressedTexImage2D(o.TEXTURE_CUBE_MAP_POSITIVE_X+Rt,te,ae,Wt.width,Wt.height,0,Wt.data):oe("WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):k?Tt&&i.texSubImage2D(o.TEXTURE_CUBE_MAP_POSITIVE_X+Rt,te,0,0,Wt.width,Wt.height,Lt,Qt,Wt.data):i.texImage2D(o.TEXTURE_CUBE_MAP_POSITIVE_X+Rt,te,ae,Wt.width,Wt.height,0,Lt,Qt,Wt.data)}}}else{if(Yt=E.mipmaps,k&&zt){Yt.length>0&&Bt++;const Rt=Ee(yt[0]);i.texStorage2D(o.TEXTURE_CUBE_MAP,Bt,ae,Rt.width,Rt.height)}for(let Rt=0;Rt<6;Rt++)if(Ct){k?Tt&&i.texSubImage2D(o.TEXTURE_CUBE_MAP_POSITIVE_X+Rt,0,0,0,yt[Rt].width,yt[Rt].height,Lt,Qt,yt[Rt].data):i.texImage2D(o.TEXTURE_CUBE_MAP_POSITIVE_X+Rt,0,ae,yt[Rt].width,yt[Rt].height,0,Lt,Qt,yt[Rt].data);for(let te=0;te<Yt.length;te++){const Ue=Yt[te].image[Rt].image;k?Tt&&i.texSubImage2D(o.TEXTURE_CUBE_MAP_POSITIVE_X+Rt,te+1,0,0,Ue.width,Ue.height,Lt,Qt,Ue.data):i.texImage2D(o.TEXTURE_CUBE_MAP_POSITIVE_X+Rt,te+1,ae,Ue.width,Ue.height,0,Lt,Qt,Ue.data)}}else{k?Tt&&i.texSubImage2D(o.TEXTURE_CUBE_MAP_POSITIVE_X+Rt,0,0,0,Lt,Qt,yt[Rt]):i.texImage2D(o.TEXTURE_CUBE_MAP_POSITIVE_X+Rt,0,ae,Lt,Qt,yt[Rt]);for(let te=0;te<Yt.length;te++){const Wt=Yt[te];k?Tt&&i.texSubImage2D(o.TEXTURE_CUBE_MAP_POSITIVE_X+Rt,te+1,0,0,Lt,Qt,Wt.image[Rt]):i.texImage2D(o.TEXTURE_CUBE_MAP_POSITIVE_X+Rt,te+1,ae,Lt,Qt,Wt.image[Rt])}}}S(E)&&O(o.TEXTURE_CUBE_MAP),Dt.__version=gt.version,E.onUpdate&&E.onUpdate(E)}L.__version=E.version}function vt(L,E,et,at,gt,Dt){const It=f.convert(et.format,et.colorSpace),xt=f.convert(et.type),St=C(et.internalFormat,It,xt,et.normalized,et.colorSpace),mt=s.get(E),Ct=s.get(et);if(Ct.__renderTarget=E,!mt.__hasExternalTextures){const yt=Math.max(1,E.width>>Dt),At=Math.max(1,E.height>>Dt);gt===o.TEXTURE_3D||gt===o.TEXTURE_2D_ARRAY?i.texImage3D(gt,Dt,St,yt,At,E.depth,0,It,xt,null):i.texImage2D(gt,Dt,St,yt,At,0,It,xt,null)}i.bindFramebuffer(o.FRAMEBUFFER,L),Je(E)?d.framebufferTexture2DMultisampleEXT(o.FRAMEBUFFER,at,gt,Ct.__webglTexture,0,Pe(E)):(gt===o.TEXTURE_2D||gt>=o.TEXTURE_CUBE_MAP_POSITIVE_X&&gt<=o.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&o.framebufferTexture2D(o.FRAMEBUFFER,at,gt,Ct.__webglTexture,Dt),i.bindFramebuffer(o.FRAMEBUFFER,null)}function Ut(L,E,et){if(o.bindRenderbuffer(o.RENDERBUFFER,L),E.depthBuffer){const at=E.depthTexture,gt=at&&at.isDepthTexture?at.type:null,Dt=D(E.stencilBuffer,gt),It=E.stencilBuffer?o.DEPTH_STENCIL_ATTACHMENT:o.DEPTH_ATTACHMENT;Je(E)?d.renderbufferStorageMultisampleEXT(o.RENDERBUFFER,Pe(E),Dt,E.width,E.height):et?o.renderbufferStorageMultisample(o.RENDERBUFFER,Pe(E),Dt,E.width,E.height):o.renderbufferStorage(o.RENDERBUFFER,Dt,E.width,E.height),o.framebufferRenderbuffer(o.FRAMEBUFFER,It,o.RENDERBUFFER,L)}else{const at=E.textures;for(let gt=0;gt<at.length;gt++){const Dt=at[gt],It=f.convert(Dt.format,Dt.colorSpace),xt=f.convert(Dt.type),St=C(Dt.internalFormat,It,xt,Dt.normalized,Dt.colorSpace);Je(E)?d.renderbufferStorageMultisampleEXT(o.RENDERBUFFER,Pe(E),St,E.width,E.height):et?o.renderbufferStorageMultisample(o.RENDERBUFFER,Pe(E),St,E.width,E.height):o.renderbufferStorage(o.RENDERBUFFER,St,E.width,E.height)}}o.bindRenderbuffer(o.RENDERBUFFER,null)}function Te(L,E,et){const at=E.isWebGLCubeRenderTarget===!0;if(i.bindFramebuffer(o.FRAMEBUFFER,L),!(E.depthTexture&&E.depthTexture.isDepthTexture))throw new Error("THREE.WebGLTextures: renderTarget.depthTexture must be an instance of THREE.DepthTexture.");const gt=s.get(E.depthTexture);if(gt.__renderTarget=E,(!gt.__webglTexture||E.depthTexture.image.width!==E.width||E.depthTexture.image.height!==E.height)&&(E.depthTexture.image.width=E.width,E.depthTexture.image.height=E.height,E.depthTexture.needsUpdate=!0),at){if(gt.__webglInit===void 0&&(gt.__webglInit=!0,E.depthTexture.addEventListener("dispose",P)),gt.__webglTexture===void 0){gt.__webglTexture=o.createTexture(),i.bindTexture(o.TEXTURE_CUBE_MAP,gt.__webglTexture),_t(o.TEXTURE_CUBE_MAP,E.depthTexture);const mt=f.convert(E.depthTexture.format),Ct=f.convert(E.depthTexture.type);let yt;E.depthTexture.format===Va?yt=o.DEPTH_COMPONENT24:E.depthTexture.format===er&&(yt=o.DEPTH24_STENCIL8);for(let At=0;At<6;At++)o.texImage2D(o.TEXTURE_CUBE_MAP_POSITIVE_X+At,0,yt,E.width,E.height,0,mt,Ct,null)}}else dt(E.depthTexture,0);const Dt=gt.__webglTexture,It=Pe(E),xt=at?o.TEXTURE_CUBE_MAP_POSITIVE_X+et:o.TEXTURE_2D,St=E.depthTexture.format===er?o.DEPTH_STENCIL_ATTACHMENT:o.DEPTH_ATTACHMENT;if(E.depthTexture.format===Va)Je(E)?d.framebufferTexture2DMultisampleEXT(o.FRAMEBUFFER,St,xt,Dt,0,It):o.framebufferTexture2D(o.FRAMEBUFFER,St,xt,Dt,0);else if(E.depthTexture.format===er)Je(E)?d.framebufferTexture2DMultisampleEXT(o.FRAMEBUFFER,St,xt,Dt,0,It):o.framebufferTexture2D(o.FRAMEBUFFER,St,xt,Dt,0);else throw new Error("THREE.WebGLTextures: Unknown depthTexture format.")}function ce(L){const E=s.get(L),et=L.isWebGLCubeRenderTarget===!0;if(E.__boundDepthTexture!==L.depthTexture){const at=L.depthTexture;if(E.__depthDisposeCallback&&E.__depthDisposeCallback(),at){const gt=()=>{delete E.__boundDepthTexture,delete E.__depthDisposeCallback,at.removeEventListener("dispose",gt)};at.addEventListener("dispose",gt),E.__depthDisposeCallback=gt}E.__boundDepthTexture=at}if(L.depthTexture&&!E.__autoAllocateDepthBuffer)if(et)for(let at=0;at<6;at++)Te(E.__webglFramebuffer[at],L,at);else{const at=L.texture.mipmaps;at&&at.length>0?Te(E.__webglFramebuffer[0],L,0):Te(E.__webglFramebuffer,L,0)}else if(et){E.__webglDepthbuffer=[];for(let at=0;at<6;at++)if(i.bindFramebuffer(o.FRAMEBUFFER,E.__webglFramebuffer[at]),E.__webglDepthbuffer[at]===void 0)E.__webglDepthbuffer[at]=o.createRenderbuffer(),Ut(E.__webglDepthbuffer[at],L,!1);else{const gt=L.stencilBuffer?o.DEPTH_STENCIL_ATTACHMENT:o.DEPTH_ATTACHMENT,Dt=E.__webglDepthbuffer[at];o.bindRenderbuffer(o.RENDERBUFFER,Dt),o.framebufferRenderbuffer(o.FRAMEBUFFER,gt,o.RENDERBUFFER,Dt)}}else{const at=L.texture.mipmaps;if(at&&at.length>0?i.bindFramebuffer(o.FRAMEBUFFER,E.__webglFramebuffer[0]):i.bindFramebuffer(o.FRAMEBUFFER,E.__webglFramebuffer),E.__webglDepthbuffer===void 0)E.__webglDepthbuffer=o.createRenderbuffer(),Ut(E.__webglDepthbuffer,L,!1);else{const gt=L.stencilBuffer?o.DEPTH_STENCIL_ATTACHMENT:o.DEPTH_ATTACHMENT,Dt=E.__webglDepthbuffer;o.bindRenderbuffer(o.RENDERBUFFER,Dt),o.framebufferRenderbuffer(o.FRAMEBUFFER,gt,o.RENDERBUFFER,Dt)}}i.bindFramebuffer(o.FRAMEBUFFER,null)}function pe(L,E,et){const at=s.get(L);E!==void 0&&vt(at.__webglFramebuffer,L,L.texture,o.COLOR_ATTACHMENT0,o.TEXTURE_2D,0),et!==void 0&&ce(L)}function _e(L){const E=L.texture,et=s.get(L),at=s.get(E);L.addEventListener("dispose",T);const gt=L.textures,Dt=L.isWebGLCubeRenderTarget===!0,It=gt.length>1;if(It||(at.__webglTexture===void 0&&(at.__webglTexture=o.createTexture()),at.__version=E.version,h.memory.textures++),Dt){et.__webglFramebuffer=[];for(let xt=0;xt<6;xt++)if(E.mipmaps&&E.mipmaps.length>0){et.__webglFramebuffer[xt]=[];for(let St=0;St<E.mipmaps.length;St++)et.__webglFramebuffer[xt][St]=o.createFramebuffer()}else et.__webglFramebuffer[xt]=o.createFramebuffer()}else{if(E.mipmaps&&E.mipmaps.length>0){et.__webglFramebuffer=[];for(let xt=0;xt<E.mipmaps.length;xt++)et.__webglFramebuffer[xt]=o.createFramebuffer()}else et.__webglFramebuffer=o.createFramebuffer();if(It)for(let xt=0,St=gt.length;xt<St;xt++){const mt=s.get(gt[xt]);mt.__webglTexture===void 0&&(mt.__webglTexture=o.createTexture(),h.memory.textures++)}if(L.samples>0&&Je(L)===!1){et.__webglMultisampledFramebuffer=o.createFramebuffer(),et.__webglColorRenderbuffer=[],i.bindFramebuffer(o.FRAMEBUFFER,et.__webglMultisampledFramebuffer);for(let xt=0;xt<gt.length;xt++){const St=gt[xt];et.__webglColorRenderbuffer[xt]=o.createRenderbuffer(),o.bindRenderbuffer(o.RENDERBUFFER,et.__webglColorRenderbuffer[xt]);const mt=f.convert(St.format,St.colorSpace),Ct=f.convert(St.type),yt=C(St.internalFormat,mt,Ct,St.normalized,St.colorSpace,L.isXRRenderTarget===!0),At=Pe(L);o.renderbufferStorageMultisample(o.RENDERBUFFER,At,yt,L.width,L.height),o.framebufferRenderbuffer(o.FRAMEBUFFER,o.COLOR_ATTACHMENT0+xt,o.RENDERBUFFER,et.__webglColorRenderbuffer[xt])}o.bindRenderbuffer(o.RENDERBUFFER,null),L.depthBuffer&&(et.__webglDepthRenderbuffer=o.createRenderbuffer(),Ut(et.__webglDepthRenderbuffer,L,!0)),i.bindFramebuffer(o.FRAMEBUFFER,null)}}if(Dt){i.bindTexture(o.TEXTURE_CUBE_MAP,at.__webglTexture),_t(o.TEXTURE_CUBE_MAP,E);for(let xt=0;xt<6;xt++)if(E.mipmaps&&E.mipmaps.length>0)for(let St=0;St<E.mipmaps.length;St++)vt(et.__webglFramebuffer[xt][St],L,E,o.COLOR_ATTACHMENT0,o.TEXTURE_CUBE_MAP_POSITIVE_X+xt,St);else vt(et.__webglFramebuffer[xt],L,E,o.COLOR_ATTACHMENT0,o.TEXTURE_CUBE_MAP_POSITIVE_X+xt,0);S(E)&&O(o.TEXTURE_CUBE_MAP),i.unbindTexture()}else if(It){for(let xt=0,St=gt.length;xt<St;xt++){const mt=gt[xt],Ct=s.get(mt);let yt=o.TEXTURE_2D;(L.isWebGL3DRenderTarget||L.isWebGLArrayRenderTarget)&&(yt=L.isWebGL3DRenderTarget?o.TEXTURE_3D:o.TEXTURE_2D_ARRAY),i.bindTexture(yt,Ct.__webglTexture),_t(yt,mt),vt(et.__webglFramebuffer,L,mt,o.COLOR_ATTACHMENT0+xt,yt,0),S(mt)&&O(yt)}i.unbindTexture()}else{let xt=o.TEXTURE_2D;if((L.isWebGL3DRenderTarget||L.isWebGLArrayRenderTarget)&&(xt=L.isWebGL3DRenderTarget?o.TEXTURE_3D:o.TEXTURE_2D_ARRAY),i.bindTexture(xt,at.__webglTexture),_t(xt,E),E.mipmaps&&E.mipmaps.length>0)for(let St=0;St<E.mipmaps.length;St++)vt(et.__webglFramebuffer[St],L,E,o.COLOR_ATTACHMENT0,xt,St);else vt(et.__webglFramebuffer,L,E,o.COLOR_ATTACHMENT0,xt,0);S(E)&&O(xt),i.unbindTexture()}L.depthBuffer&&ce(L)}function ee(L){const E=L.textures;for(let et=0,at=E.length;et<at;et++){const gt=E[et];if(S(gt)){const Dt=G(L),It=s.get(gt).__webglTexture;i.bindTexture(Dt,It),O(Dt),i.unbindTexture()}}}const ne=[],Be=[];function sn(L){if(L.samples>0){if(Je(L)===!1){const E=L.textures,et=L.width,at=L.height;let gt=o.COLOR_BUFFER_BIT;const Dt=L.stencilBuffer?o.DEPTH_STENCIL_ATTACHMENT:o.DEPTH_ATTACHMENT,It=s.get(L),xt=E.length>1;if(xt)for(let mt=0;mt<E.length;mt++)i.bindFramebuffer(o.FRAMEBUFFER,It.__webglMultisampledFramebuffer),o.framebufferRenderbuffer(o.FRAMEBUFFER,o.COLOR_ATTACHMENT0+mt,o.RENDERBUFFER,null),i.bindFramebuffer(o.FRAMEBUFFER,It.__webglFramebuffer),o.framebufferTexture2D(o.DRAW_FRAMEBUFFER,o.COLOR_ATTACHMENT0+mt,o.TEXTURE_2D,null,0);i.bindFramebuffer(o.READ_FRAMEBUFFER,It.__webglMultisampledFramebuffer);const St=L.texture.mipmaps;St&&St.length>0?i.bindFramebuffer(o.DRAW_FRAMEBUFFER,It.__webglFramebuffer[0]):i.bindFramebuffer(o.DRAW_FRAMEBUFFER,It.__webglFramebuffer);for(let mt=0;mt<E.length;mt++){if(L.resolveDepthBuffer&&(L.depthBuffer&&(gt|=o.DEPTH_BUFFER_BIT),L.stencilBuffer&&L.resolveStencilBuffer&&(gt|=o.STENCIL_BUFFER_BIT)),xt){o.framebufferRenderbuffer(o.READ_FRAMEBUFFER,o.COLOR_ATTACHMENT0,o.RENDERBUFFER,It.__webglColorRenderbuffer[mt]);const Ct=s.get(E[mt]).__webglTexture;o.framebufferTexture2D(o.DRAW_FRAMEBUFFER,o.COLOR_ATTACHMENT0,o.TEXTURE_2D,Ct,0)}o.blitFramebuffer(0,0,et,at,0,0,et,at,gt,o.NEAREST),m===!0&&(ne.length=0,Be.length=0,ne.push(o.COLOR_ATTACHMENT0+mt),L.depthBuffer&&L.storeMultisampledDepthBuffer===!1&&(ne.push(Dt),Be.push(Dt),o.invalidateFramebuffer(o.DRAW_FRAMEBUFFER,Be)),o.invalidateFramebuffer(o.READ_FRAMEBUFFER,ne))}if(i.bindFramebuffer(o.READ_FRAMEBUFFER,null),i.bindFramebuffer(o.DRAW_FRAMEBUFFER,null),xt)for(let mt=0;mt<E.length;mt++){i.bindFramebuffer(o.FRAMEBUFFER,It.__webglMultisampledFramebuffer),o.framebufferRenderbuffer(o.FRAMEBUFFER,o.COLOR_ATTACHMENT0+mt,o.RENDERBUFFER,It.__webglColorRenderbuffer[mt]);const Ct=s.get(E[mt]).__webglTexture;i.bindFramebuffer(o.FRAMEBUFFER,It.__webglFramebuffer),o.framebufferTexture2D(o.DRAW_FRAMEBUFFER,o.COLOR_ATTACHMENT0+mt,o.TEXTURE_2D,Ct,0)}i.bindFramebuffer(o.DRAW_FRAMEBUFFER,It.__webglMultisampledFramebuffer)}else if(L.depthBuffer&&L.storeMultisampledDepthBuffer===!1&&m){const E=L.stencilBuffer?o.DEPTH_STENCIL_ATTACHMENT:o.DEPTH_ATTACHMENT;o.invalidateFramebuffer(o.DRAW_FRAMEBUFFER,[E])}}}function Pe(L){return Math.min(l.maxSamples,L.samples)}function Je(L){const E=s.get(L);return L.samples>0&&e.has("WEBGL_multisampled_render_to_texture")===!0&&E.__useRenderToTexture!==!1}function X(L){const E=h.render.frame;x.get(L)!==E&&(x.set(L,E),L.update())}function je(L,E){const et=L.colorSpace,at=L.format,gt=L.type;return L.isCompressedTexture===!0||L.isVideoTexture===!0||et!==Bc&&et!==Ms&&(Oe.getTransfer(et)===qe?(at!==ki||gt!==xi)&&oe("WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):Fe("WebGLTextures: Unsupported texture color space:",et)),E}function Ee(L){return typeof HTMLImageElement<"u"&&L instanceof HTMLImageElement?(p.width=L.naturalWidth||L.width,p.height=L.naturalHeight||L.height):typeof VideoFrame<"u"&&L instanceof VideoFrame?(p.width=L.displayWidth,p.height=L.displayHeight):(p.width=L.width,p.height=L.height),p}this.allocateTextureUnit=W,this.resetTextureUnits=st,this.getTextureUnits=Y,this.setTextureUnits=tt,this.setTexture2D=dt,this.setTexture2DArray=ct,this.setTexture3D=rt,this.setTextureCube=bt,this.rebindTextures=pe,this.setupRenderTarget=_e,this.updateRenderTargetMipmap=ee,this.updateMultisampleRenderTarget=sn,this.setupDepthRenderbuffer=ce,this.setupFrameBufferTexture=vt,this.useMultisampledRTT=Je,this.isReversedDepthBuffer=function(){return i.buffers.depth.getReversed()}}function z3(o,e){function i(s,l=Ms){let f;const h=Oe.getTransfer(l);if(s===xi)return o.UNSIGNED_BYTE;if(s===nm)return o.UNSIGNED_SHORT_4_4_4_4;if(s===im)return o.UNSIGNED_SHORT_5_5_5_1;if(s===aS)return o.UNSIGNED_INT_5_9_9_9_REV;if(s===sS)return o.UNSIGNED_INT_10F_11F_11F_REV;if(s===nS)return o.BYTE;if(s===iS)return o.SHORT;if(s===Cl)return o.UNSIGNED_SHORT;if(s===em)return o.INT;if(s===pa)return o.UNSIGNED_INT;if(s===fa)return o.FLOAT;if(s===ma)return o.HALF_FLOAT;if(s===rS)return o.ALPHA;if(s===oS)return o.RGB;if(s===ki)return o.RGBA;if(s===Va)return o.DEPTH_COMPONENT;if(s===er)return o.DEPTH_STENCIL;if(s===lS)return o.RED;if(s===am)return o.RED_INTEGER;if(s===ar)return o.RG;if(s===sm)return o.RG_INTEGER;if(s===rm)return o.RGBA_INTEGER;if(s===Dc||s===Nc||s===Uc||s===Lc)if(h===qe)if(f=e.get("WEBGL_compressed_texture_s3tc_srgb"),f!==null){if(s===Dc)return f.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(s===Nc)return f.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(s===Uc)return f.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(s===Lc)return f.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(f=e.get("WEBGL_compressed_texture_s3tc"),f!==null){if(s===Dc)return f.COMPRESSED_RGB_S3TC_DXT1_EXT;if(s===Nc)return f.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(s===Uc)return f.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(s===Lc)return f.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(s===vp||s===xp||s===Sp||s===yp)if(f=e.get("WEBGL_compressed_texture_pvrtc"),f!==null){if(s===vp)return f.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(s===xp)return f.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(s===Sp)return f.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(s===yp)return f.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(s===Mp||s===Ep||s===Tp||s===bp||s===Ap||s===Ic||s===Rp)if(f=e.get("WEBGL_compressed_texture_etc"),f!==null){if(s===Mp||s===Ep)return h===qe?f.COMPRESSED_SRGB8_ETC2:f.COMPRESSED_RGB8_ETC2;if(s===Tp)return h===qe?f.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:f.COMPRESSED_RGBA8_ETC2_EAC;if(s===bp)return f.COMPRESSED_R11_EAC;if(s===Ap)return f.COMPRESSED_SIGNED_R11_EAC;if(s===Ic)return f.COMPRESSED_RG11_EAC;if(s===Rp)return f.COMPRESSED_SIGNED_RG11_EAC}else return null;if(s===Cp||s===wp||s===Dp||s===Np||s===Up||s===Lp||s===Op||s===Pp||s===Ip||s===zp||s===Bp||s===Fp||s===Hp||s===Gp)if(f=e.get("WEBGL_compressed_texture_astc"),f!==null){if(s===Cp)return h===qe?f.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:f.COMPRESSED_RGBA_ASTC_4x4_KHR;if(s===wp)return h===qe?f.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:f.COMPRESSED_RGBA_ASTC_5x4_KHR;if(s===Dp)return h===qe?f.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:f.COMPRESSED_RGBA_ASTC_5x5_KHR;if(s===Np)return h===qe?f.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:f.COMPRESSED_RGBA_ASTC_6x5_KHR;if(s===Up)return h===qe?f.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:f.COMPRESSED_RGBA_ASTC_6x6_KHR;if(s===Lp)return h===qe?f.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:f.COMPRESSED_RGBA_ASTC_8x5_KHR;if(s===Op)return h===qe?f.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:f.COMPRESSED_RGBA_ASTC_8x6_KHR;if(s===Pp)return h===qe?f.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:f.COMPRESSED_RGBA_ASTC_8x8_KHR;if(s===Ip)return h===qe?f.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:f.COMPRESSED_RGBA_ASTC_10x5_KHR;if(s===zp)return h===qe?f.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:f.COMPRESSED_RGBA_ASTC_10x6_KHR;if(s===Bp)return h===qe?f.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:f.COMPRESSED_RGBA_ASTC_10x8_KHR;if(s===Fp)return h===qe?f.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:f.COMPRESSED_RGBA_ASTC_10x10_KHR;if(s===Hp)return h===qe?f.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:f.COMPRESSED_RGBA_ASTC_12x10_KHR;if(s===Gp)return h===qe?f.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:f.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(s===Vp||s===Xp||s===kp)if(f=e.get("EXT_texture_compression_bptc"),f!==null){if(s===Vp)return h===qe?f.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:f.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(s===Xp)return f.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(s===kp)return f.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(s===Wp||s===Yp||s===zc||s===qp)if(f=e.get("EXT_texture_compression_rgtc"),f!==null){if(s===Wp)return f.COMPRESSED_RED_RGTC1_EXT;if(s===Yp)return f.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(s===zc)return f.COMPRESSED_RED_GREEN_RGTC2_EXT;if(s===qp)return f.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return s===wl?o.UNSIGNED_INT_24_8:o[s]!==void 0?o[s]:null}return{convert:i}}const B3=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,F3=`
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

}`;class H3{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(e,i){if(this.texture===null){const s=new _S(e.texture);(e.depthNear!==i.depthNear||e.depthFar!==i.depthFar)&&(this.depthNear=e.depthNear,this.depthFar=e.depthFar),this.texture=s}}getMesh(e){if(this.texture!==null&&this.mesh===null){const i=e.cameras[0].viewport,s=new ga({vertexShader:B3,fragmentShader:F3,uniforms:{depthColor:{value:this.texture},depthWidth:{value:i.z},depthHeight:{value:i.w}}});this.mesh=new ze(new po(20,20),s)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}}class G3 extends bs{constructor(e,i){super();const s=this;let l=null,f=1,h=null,d="local-floor",m=1,p=null,x=null,_=null,v=null,M=null,R=null;const w=typeof XRWebGLBinding<"u",y=new H3,S={},O=i.getContextAttributes();let G=null,C=null;const D=[],N=[],P=new le;let T=null,U=null;const F=new vi;F.viewport=new on;const V=new vi;V.viewport=new on;const Q=[F,V],st=new qT;let Y=null,tt=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(Z){let ft=D[Z];return ft===void 0&&(ft=new Id,D[Z]=ft),ft.getTargetRaySpace()},this.getControllerGrip=function(Z){let ft=D[Z];return ft===void 0&&(ft=new Id,D[Z]=ft),ft.getGripSpace()},this.getHand=function(Z){let ft=D[Z];return ft===void 0&&(ft=new Id,D[Z]=ft),ft.getHandSpace()};function W(Z){const ft=N.indexOf(Z.inputSource);if(ft===-1)return;const wt=D[ft];wt!==void 0&&(wt.update(Z.inputSource,Z.frame,p||h),wt.dispatchEvent({type:Z.type,data:Z.inputSource}))}function q(){l.removeEventListener("select",W),l.removeEventListener("selectstart",W),l.removeEventListener("selectend",W),l.removeEventListener("squeeze",W),l.removeEventListener("squeezestart",W),l.removeEventListener("squeezeend",W),l.removeEventListener("end",q),l.removeEventListener("inputsourceschange",dt);for(let Z=0;Z<D.length;Z++){const ft=N[Z];ft!==null&&(N[Z]=null,D[Z].disconnect(ft))}Y=null,tt=null,y.reset();for(const Z in S)delete S[Z];if(e.setRenderTarget(G),M=null,v=null,_=null,l=null,C=null,Nt.stop(),s.isPresenting=!1,e.setPixelRatio(T),e.setSize(P.width,P.height,!1),U!==null){const Z=U.camera;Z.fov=U.fov,Z.zoom=U.zoom,Z.updateProjectionMatrix(),U=null}s.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(Z){f=Z,s.isPresenting===!0&&oe("WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(Z){d=Z,s.isPresenting===!0&&oe("WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return p||h},this.setReferenceSpace=function(Z){p=Z},this.getBaseLayer=function(){return v!==null?v:M},this.getBinding=function(){return _===null&&w&&(_=new XRWebGLBinding(l,i)),_},this.getFrame=function(){return R},this.getSession=function(){return l},this.setSession=async function(Z){if(l=Z,l!==null){if(G=e.getRenderTarget(),l.addEventListener("select",W),l.addEventListener("selectstart",W),l.addEventListener("selectend",W),l.addEventListener("squeeze",W),l.addEventListener("squeezestart",W),l.addEventListener("squeezeend",W),l.addEventListener("end",q),l.addEventListener("inputsourceschange",dt),O.xrCompatible!==!0&&await i.makeXRCompatible(),T=e.getPixelRatio(),e.getSize(P),w&&"createProjectionLayer"in XRWebGLBinding.prototype){let wt=null,Pt=null,vt=null;O.depth&&(vt=O.stencil?i.DEPTH24_STENCIL8:i.DEPTH_COMPONENT24,wt=O.stencil?er:Va,Pt=O.stencil?wl:pa);const Ut={colorFormat:i.RGBA8,depthFormat:vt,scaleFactor:f};_=this.getBinding(),v=_.createProjectionLayer(Ut),l.updateRenderState({layers:[v]}),e.setPixelRatio(1),e.setSize(v.textureWidth,v.textureHeight,!1),C=new Wi(v.textureWidth,v.textureHeight,{format:ki,type:xi,depthTexture:new Nl(v.textureWidth,v.textureHeight,Pt,void 0,void 0,void 0,void 0,void 0,void 0,wt),stencilBuffer:O.stencil,colorSpace:e.outputColorSpace,samples:O.antialias?4:0,resolveDepthBuffer:v.ignoreDepthValues===!1,resolveStencilBuffer:v.ignoreDepthValues===!1,storeMultisampledDepthBuffer:v.ignoreDepthValues===!1,storeMultisampledStencilBuffer:v.ignoreDepthValues===!1})}else{const wt={antialias:O.antialias,alpha:!0,depth:O.depth,stencil:O.stencil,framebufferScaleFactor:f};M=new XRWebGLLayer(l,i,wt),l.updateRenderState({baseLayer:M}),e.setPixelRatio(1),e.setSize(M.framebufferWidth,M.framebufferHeight,!1),C=new Wi(M.framebufferWidth,M.framebufferHeight,{format:ki,type:xi,colorSpace:e.outputColorSpace,stencilBuffer:O.stencil,resolveDepthBuffer:M.ignoreDepthValues===!1,resolveStencilBuffer:M.ignoreDepthValues===!1,storeMultisampledDepthBuffer:M.ignoreDepthValues===!1,storeMultisampledStencilBuffer:M.ignoreDepthValues===!1})}C.isXRRenderTarget=!0,this.setFoveation(m),p=null,h=await l.requestReferenceSpace(d),Nt.setContext(l),Nt.start(),s.isPresenting=!0,s.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(l!==null)return l.environmentBlendMode},this.getDepthTexture=function(){return y.getDepthTexture()};function dt(Z){for(let ft=0;ft<Z.removed.length;ft++){const wt=Z.removed[ft],Pt=N.indexOf(wt);Pt>=0&&(N[Pt]=null,D[Pt].disconnect(wt))}for(let ft=0;ft<Z.added.length;ft++){const wt=Z.added[ft];let Pt=N.indexOf(wt);if(Pt===-1){for(let Ut=0;Ut<D.length;Ut++)if(Ut>=N.length){N.push(wt),Pt=Ut;break}else if(N[Ut]===null){N[Ut]=wt,Pt=Ut;break}if(Pt===-1)break}const vt=D[Pt];vt&&vt.connect(wt)}}const ct=new nt,rt=new nt;function bt(Z,ft,wt){ct.setFromMatrixPosition(ft.matrixWorld),rt.setFromMatrixPosition(wt.matrixWorld);const Pt=ct.distanceTo(rt),vt=ft.projectionMatrix.elements,Ut=wt.projectionMatrix.elements,Te=vt[14]/(vt[10]-1),ce=vt[14]/(vt[10]+1),pe=(vt[9]+1)/vt[5],_e=(vt[9]-1)/vt[5],ee=(vt[8]-1)/vt[0],ne=(Ut[8]+1)/Ut[0],Be=Te*ee,sn=Te*ne,Pe=Pt/(-ee+ne),Je=Pe*-ee;if(ft.matrixWorld.decompose(Z.position,Z.quaternion,Z.scale),Z.translateX(Je),Z.translateZ(Pe),Z.matrixWorld.compose(Z.position,Z.quaternion,Z.scale),Z.matrixWorldInverse.copy(Z.matrixWorld).invert(),vt[10]===-1)Z.projectionMatrix.copy(ft.projectionMatrix),Z.projectionMatrixInverse.copy(ft.projectionMatrixInverse);else{const X=Te+Pe,je=ce+Pe,Ee=Be-Je,L=sn+(Pt-Je),E=pe*ce/je*X,et=_e*ce/je*X;Z.projectionMatrix.makePerspective(Ee,L,E,et,X,je),Z.projectionMatrixInverse.copy(Z.projectionMatrix).invert()}}function Gt(Z,ft){ft===null?Z.matrixWorld.copy(Z.matrix):Z.matrixWorld.multiplyMatrices(ft.matrixWorld,Z.matrix),Z.matrixWorldInverse.copy(Z.matrixWorld).invert()}this.updateCamera=function(Z){if(l===null)return;let ft=Z.near,wt=Z.far;y.texture!==null&&(y.depthNear>0&&(ft=y.depthNear),y.depthFar>0&&(wt=y.depthFar)),st.near=V.near=F.near=ft,st.far=V.far=F.far=wt,(Y!==st.near||tt!==st.far)&&(l.updateRenderState({depthNear:st.near,depthFar:st.far}),Y=st.near,tt=st.far),st.layers.mask=Z.layers.mask|6,F.layers.mask=st.layers.mask&-5,V.layers.mask=st.layers.mask&-3;const Pt=Z.parent,vt=st.cameras;Gt(st,Pt);for(let Ut=0;Ut<vt.length;Ut++)Gt(vt[Ut],Pt);vt.length===2?bt(st,F,V):st.projectionMatrix.copy(F.projectionMatrix),U===null&&Z.isPerspectiveCamera&&(U={camera:Z,fov:Z.fov,zoom:Z.zoom}),Ot(Z,st,Pt)};function Ot(Z,ft,wt){wt===null?Z.matrix.copy(ft.matrixWorld):(Z.matrix.copy(wt.matrixWorld),Z.matrix.invert(),Z.matrix.multiply(ft.matrixWorld)),Z.matrix.decompose(Z.position,Z.quaternion,Z.scale),Z.updateMatrixWorld(!0),Z.projectionMatrix.copy(ft.projectionMatrix),Z.projectionMatrixInverse.copy(ft.projectionMatrixInverse),Z.isPerspectiveCamera&&(Z.fov=jp*2*Math.atan(1/Z.projectionMatrix.elements[5]),Z.zoom=1)}this.getCamera=function(){return st},this.getFoveation=function(){if(!(v===null&&M===null))return m},this.setFoveation=function(Z){m=Z,v!==null&&(v.fixedFoveation=Z),M!==null&&M.fixedFoveation!==void 0&&(M.fixedFoveation=Z)},this.hasDepthSensing=function(){return y.texture!==null},this.getDepthSensingMesh=function(){return y.getMesh(st)},this.getCameraTexture=function(Z){return S[Z]};let z=null;function _t(Z,ft){if(x=ft.getViewerPose(p||h),R=ft,x!==null){const wt=x.views;M!==null&&(e.setRenderTargetFramebuffer(C,M.framebuffer),e.setRenderTarget(C));let Pt=!1;wt.length!==st.cameras.length&&(st.cameras.length=0,Pt=!0);for(let ce=0;ce<wt.length;ce++){const pe=wt[ce];let _e=null;if(M!==null)_e=M.getViewport(pe);else{const ne=_.getViewSubImage(v,pe);_e=ne.viewport,ce===0&&(e.setRenderTargetTextures(C,ne.colorTexture,ne.depthStencilTexture),e.setRenderTarget(C))}let ee=Q[ce];ee===void 0&&(ee=new vi,ee.layers.enable(ce),ee.viewport=new on,Q[ce]=ee),ee.matrix.fromArray(pe.transform.matrix),ee.matrix.decompose(ee.position,ee.quaternion,ee.scale),ee.projectionMatrix.fromArray(pe.projectionMatrix),ee.projectionMatrixInverse.copy(ee.projectionMatrix).invert(),ee.viewport.set(_e.x,_e.y,_e.width,_e.height),ce===0&&(st.matrix.copy(ee.matrix),st.matrix.decompose(st.position,st.quaternion,st.scale)),Pt===!0&&st.cameras.push(ee)}const vt=l.enabledFeatures;if(vt&&vt.includes("depth-sensing")&&l.depthUsage=="gpu-optimized"&&w){_=s.getBinding();const ce=_.getDepthInformation(wt[0]);ce&&ce.isValid&&ce.texture&&y.init(ce,l.renderState)}if(vt&&vt.includes("camera-access")&&w){e.state.unbindTexture(),_=s.getBinding();for(let ce=0;ce<wt.length;ce++){const pe=wt[ce].camera;if(pe){let _e=S[pe];_e||(_e=new _S,S[pe]=_e);const ee=_.getCameraImage(pe);_e.sourceTexture=ee}}}}for(let wt=0;wt<D.length;wt++){const Pt=N[wt],vt=D[wt];Pt!==null&&vt!==void 0&&vt.update(Pt,ft,p||h)}z&&z(Z,ft),ft.detectedPlanes&&s.dispatchEvent({type:"planesdetected",data:ft}),R=null}const Nt=new yS;Nt.setAnimationLoop(_t),this.setAnimationLoop=function(Z){z=Z},this.dispose=function(){}}}const V3=new ln,CS=new de;CS.set(-1,0,0,0,1,0,0,0,1);function X3(o,e){function i(y,S){y.matrixAutoUpdate===!0&&y.updateMatrix(),S.value.copy(y.matrix)}function s(y,S){S.color.getRGB(y.fogColor.value,vS(o)),S.isFog?(y.fogNear.value=S.near,y.fogFar.value=S.far):S.isFogExp2&&(y.fogDensity.value=S.density)}function l(y,S,O,G,C){S.isNodeMaterial?S.uniformsNeedUpdate=!1:S.isMeshBasicMaterial?f(y,S):S.isMeshLambertMaterial?(f(y,S),S.envMap&&(y.envMapIntensity.value=S.envMapIntensity)):S.isMeshToonMaterial?(f(y,S),_(y,S)):S.isMeshPhongMaterial?(f(y,S),x(y,S),S.envMap&&(y.envMapIntensity.value=S.envMapIntensity)):S.isMeshStandardMaterial?(f(y,S),v(y,S),S.isMeshPhysicalMaterial&&M(y,S,C)):S.isMeshMatcapMaterial?(f(y,S),R(y,S)):S.isMeshDepthMaterial?f(y,S):S.isMeshDistanceMaterial?(f(y,S),w(y,S)):S.isMeshNormalMaterial?f(y,S):S.isLineBasicMaterial?(h(y,S),S.isLineDashedMaterial&&d(y,S)):S.isPointsMaterial?m(y,S,O,G):S.isSpriteMaterial?p(y,S):S.isShadowMaterial?(y.color.value.copy(S.color),y.opacity.value=S.opacity):S.isShaderMaterial&&(S.uniformsNeedUpdate=!1)}function f(y,S){y.opacity.value=S.opacity,S.color&&y.diffuse.value.copy(S.color),S.emissive&&y.emissive.value.copy(S.emissive).multiplyScalar(S.emissiveIntensity),S.map&&(y.map.value=S.map,i(S.map,y.mapTransform)),S.alphaMap&&(y.alphaMap.value=S.alphaMap,i(S.alphaMap,y.alphaMapTransform)),S.bumpMap&&(y.bumpMap.value=S.bumpMap,i(S.bumpMap,y.bumpMapTransform),y.bumpScale.value=S.bumpScale,S.side===ai&&(y.bumpScale.value*=-1)),S.normalMap&&(y.normalMap.value=S.normalMap,i(S.normalMap,y.normalMapTransform),y.normalScale.value.copy(S.normalScale),S.side===ai&&y.normalScale.value.negate()),S.displacementMap&&(y.displacementMap.value=S.displacementMap,i(S.displacementMap,y.displacementMapTransform),y.displacementScale.value=S.displacementScale,y.displacementBias.value=S.displacementBias),S.emissiveMap&&(y.emissiveMap.value=S.emissiveMap,i(S.emissiveMap,y.emissiveMapTransform)),S.specularMap&&(y.specularMap.value=S.specularMap,i(S.specularMap,y.specularMapTransform)),S.alphaTest>0&&(y.alphaTest.value=S.alphaTest);const O=e.get(S),G=O.envMap,C=O.envMapRotation;G&&(y.envMap.value=G,y.envMapRotation.value.setFromMatrix4(V3.makeRotationFromEuler(C)).transpose(),G.isCubeTexture&&G.isRenderTargetTexture===!1&&y.envMapRotation.value.premultiply(CS),y.reflectivity.value=S.reflectivity,y.ior.value=S.ior,y.refractionRatio.value=S.refractionRatio),S.lightMap&&(y.lightMap.value=S.lightMap,y.lightMapIntensity.value=S.lightMapIntensity,i(S.lightMap,y.lightMapTransform)),S.aoMap&&(y.aoMap.value=S.aoMap,y.aoMapIntensity.value=S.aoMapIntensity,i(S.aoMap,y.aoMapTransform))}function h(y,S){y.diffuse.value.copy(S.color),y.opacity.value=S.opacity,S.map&&(y.map.value=S.map,i(S.map,y.mapTransform))}function d(y,S){y.dashSize.value=S.dashSize,y.totalSize.value=S.dashSize+S.gapSize,y.scale.value=S.scale}function m(y,S,O,G){y.diffuse.value.copy(S.color),y.opacity.value=S.opacity,y.size.value=S.size*O,y.scale.value=G*.5,S.map&&(y.map.value=S.map,i(S.map,y.uvTransform)),S.alphaMap&&(y.alphaMap.value=S.alphaMap,i(S.alphaMap,y.alphaMapTransform)),S.alphaTest>0&&(y.alphaTest.value=S.alphaTest)}function p(y,S){y.diffuse.value.copy(S.color),y.opacity.value=S.opacity,y.rotation.value=S.rotation,S.map&&(y.map.value=S.map,i(S.map,y.mapTransform)),S.alphaMap&&(y.alphaMap.value=S.alphaMap,i(S.alphaMap,y.alphaMapTransform)),S.alphaTest>0&&(y.alphaTest.value=S.alphaTest)}function x(y,S){y.specular.value.copy(S.specular),y.shininess.value=Math.max(S.shininess,1e-4)}function _(y,S){S.gradientMap&&(y.gradientMap.value=S.gradientMap)}function v(y,S){y.metalness.value=S.metalness,S.metalnessMap&&(y.metalnessMap.value=S.metalnessMap,i(S.metalnessMap,y.metalnessMapTransform)),y.roughness.value=S.roughness,S.roughnessMap&&(y.roughnessMap.value=S.roughnessMap,i(S.roughnessMap,y.roughnessMapTransform)),S.envMap&&(y.envMapIntensity.value=S.envMapIntensity)}function M(y,S,O){y.ior.value=S.ior,S.sheen>0&&(y.sheenColor.value.copy(S.sheenColor).multiplyScalar(S.sheen),y.sheenRoughness.value=S.sheenRoughness,S.sheenColorMap&&(y.sheenColorMap.value=S.sheenColorMap,i(S.sheenColorMap,y.sheenColorMapTransform)),S.sheenRoughnessMap&&(y.sheenRoughnessMap.value=S.sheenRoughnessMap,i(S.sheenRoughnessMap,y.sheenRoughnessMapTransform))),S.clearcoat>0&&(y.clearcoat.value=S.clearcoat,y.clearcoatRoughness.value=S.clearcoatRoughness,S.clearcoatMap&&(y.clearcoatMap.value=S.clearcoatMap,i(S.clearcoatMap,y.clearcoatMapTransform)),S.clearcoatRoughnessMap&&(y.clearcoatRoughnessMap.value=S.clearcoatRoughnessMap,i(S.clearcoatRoughnessMap,y.clearcoatRoughnessMapTransform)),S.clearcoatNormalMap&&(y.clearcoatNormalMap.value=S.clearcoatNormalMap,i(S.clearcoatNormalMap,y.clearcoatNormalMapTransform),y.clearcoatNormalScale.value.copy(S.clearcoatNormalScale),S.side===ai&&y.clearcoatNormalScale.value.negate())),S.dispersion>0&&(y.dispersion.value=S.dispersion),S.retroreflectivity>0&&(y.retroreflectivity.value=S.retroreflectivity),S.iridescence>0&&(y.iridescence.value=S.iridescence,y.iridescenceIOR.value=S.iridescenceIOR,y.iridescenceThicknessMinimum.value=S.iridescenceThicknessRange[0],y.iridescenceThicknessMaximum.value=S.iridescenceThicknessRange[1],S.iridescenceMap&&(y.iridescenceMap.value=S.iridescenceMap,i(S.iridescenceMap,y.iridescenceMapTransform)),S.iridescenceThicknessMap&&(y.iridescenceThicknessMap.value=S.iridescenceThicknessMap,i(S.iridescenceThicknessMap,y.iridescenceThicknessMapTransform))),S.transmission>0&&(y.transmission.value=S.transmission,y.transmissionSamplerMap.value=O.texture,y.transmissionSamplerSize.value.set(O.width,O.height),S.transmissionMap&&(y.transmissionMap.value=S.transmissionMap,i(S.transmissionMap,y.transmissionMapTransform)),y.thickness.value=S.thickness,S.thicknessMap&&(y.thicknessMap.value=S.thicknessMap,i(S.thicknessMap,y.thicknessMapTransform)),y.attenuationDistance.value=S.attenuationDistance,y.attenuationColor.value.copy(S.attenuationColor)),S.anisotropy>0&&(y.anisotropyVector.value.set(S.anisotropy*Math.cos(S.anisotropyRotation),S.anisotropy*Math.sin(S.anisotropyRotation)),S.anisotropyMap&&(y.anisotropyMap.value=S.anisotropyMap,i(S.anisotropyMap,y.anisotropyMapTransform))),y.specularIntensity.value=S.specularIntensity,y.specularColor.value.copy(S.specularColor),S.specularColorMap&&(y.specularColorMap.value=S.specularColorMap,i(S.specularColorMap,y.specularColorMapTransform)),S.specularIntensityMap&&(y.specularIntensityMap.value=S.specularIntensityMap,i(S.specularIntensityMap,y.specularIntensityMapTransform))}function R(y,S){S.matcap&&(y.matcap.value=S.matcap)}function w(y,S){const O=e.get(S).light;y.referencePosition.value.setFromMatrixPosition(O.matrixWorld),y.nearDistance.value=O.shadow.camera.near,y.farDistance.value=O.shadow.camera.far}return{refreshFogUniforms:s,refreshMaterialUniforms:l}}function k3(o,e,i,s){let l={},f={},h=[];const d=o.getParameter(o.MAX_UNIFORM_BUFFER_BINDINGS);function m(C,D){const N=D.program;s.uniformBlockBinding(C,N)}function p(C,D){let N=l[C.id];N===void 0&&(y(C),N=x(C),l[C.id]=N,C.addEventListener("dispose",O));const P=D.program;s.updateUBOMapping(C,P);const T=e.render.frame;f[C.id]!==T&&(v(C),f[C.id]=T)}function x(C){const D=_();C.__bindingPointIndex=D;const N=o.createBuffer(),P=C.__size,T=C.usage;return o.bindBuffer(o.UNIFORM_BUFFER,N),o.bufferData(o.UNIFORM_BUFFER,P,T),o.bindBuffer(o.UNIFORM_BUFFER,null),o.bindBufferBase(o.UNIFORM_BUFFER,D,N),N}function _(){for(let C=0;C<d;C++)if(h.indexOf(C)===-1)return h.push(C),C;return Fe("WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function v(C){const D=l[C.id],N=C.uniforms,P=C.__cache;o.bindBuffer(o.UNIFORM_BUFFER,D);for(let T=0,U=N.length;T<U;T++){const F=N[T];if(Array.isArray(F))for(let V=0,Q=F.length;V<Q;V++)M(F[V],T,V,P);else M(F,T,0,P)}o.bindBuffer(o.UNIFORM_BUFFER,null)}function M(C,D,N,P){if(w(C,D,N,P)===!0){const T=C.__offset,U=C.value;if(Array.isArray(U)){let F=0;for(let V=0;V<U.length;V++){const Q=U[V],st=S(Q);R(Q,C.__data,F),typeof Q!="number"&&typeof Q!="boolean"&&!Q.isMatrix3&&!ArrayBuffer.isView(Q)&&(F+=st.storage/Float32Array.BYTES_PER_ELEMENT)}}else R(U,C.__data,0);o.bufferSubData(o.UNIFORM_BUFFER,T,C.__data)}}function R(C,D,N){typeof C=="number"||typeof C=="boolean"?D[0]=C:C.isMatrix3?(D[0]=C.elements[0],D[1]=C.elements[1],D[2]=C.elements[2],D[3]=0,D[4]=C.elements[3],D[5]=C.elements[4],D[6]=C.elements[5],D[7]=0,D[8]=C.elements[6],D[9]=C.elements[7],D[10]=C.elements[8],D[11]=0):ArrayBuffer.isView(C)?D.set(new C.constructor(C.buffer,C.byteOffset,D.length)):C.toArray(D,N)}function w(C,D,N,P){const T=C.value,U=D+"_"+N;if(P[U]===void 0)return typeof T=="number"||typeof T=="boolean"?P[U]=T:ArrayBuffer.isView(T)?P[U]=T.slice():P[U]=T.clone(),!0;{const F=P[U];if(typeof T=="number"||typeof T=="boolean"){if(F!==T)return P[U]=T,!0}else{if(ArrayBuffer.isView(T))return!0;if(F.equals(T)===!1)return F.copy(T),!0}}return!1}function y(C){const D=C.uniforms;let N=0;const P=16;for(let U=0,F=D.length;U<F;U++){const V=Array.isArray(D[U])?D[U]:[D[U]];for(let Q=0,st=V.length;Q<st;Q++){const Y=V[Q],tt=Array.isArray(Y.value)?Y.value:[Y.value];for(let W=0,q=tt.length;W<q;W++){const dt=tt[W],ct=S(dt),rt=N%P,bt=rt%ct.boundary,Gt=rt+bt;N+=bt,Gt!==0&&P-Gt<ct.storage&&(N+=P-Gt),Y.__data=new Float32Array(ct.storage/Float32Array.BYTES_PER_ELEMENT),Y.__offset=N,N+=ct.storage}}}const T=N%P;return T>0&&(N+=P-T),C.__size=N,C.__cache={},this}function S(C){const D={boundary:0,storage:0};return typeof C=="number"||typeof C=="boolean"?(D.boundary=4,D.storage=4):C.isVector2?(D.boundary=8,D.storage=8):C.isVector3||C.isColor?(D.boundary=16,D.storage=12):C.isVector4?(D.boundary=16,D.storage=16):C.isMatrix3?(D.boundary=48,D.storage=48):C.isMatrix4?(D.boundary=64,D.storage=64):C.isTexture?oe("WebGLRenderer: Texture samplers can not be part of an uniforms group."):ArrayBuffer.isView(C)?(D.boundary=16,D.storage=C.byteLength):oe("WebGLRenderer: Unsupported uniform value type.",C),D}function O(C){const D=C.target;D.removeEventListener("dispose",O);const N=h.indexOf(D.__bindingPointIndex);h.splice(N,1),o.deleteBuffer(l[D.id]),delete l[D.id],delete f[D.id]}function G(){for(const C in l)o.deleteBuffer(l[C]);h=[],l={},f={}}return{bind:m,update:p,dispose:G}}const W3=new Uint16Array([12469,15057,12620,14925,13266,14620,13807,14376,14323,13990,14545,13625,14713,13328,14840,12882,14931,12528,14996,12233,15039,11829,15066,11525,15080,11295,15085,10976,15082,10705,15073,10495,13880,14564,13898,14542,13977,14430,14158,14124,14393,13732,14556,13410,14702,12996,14814,12596,14891,12291,14937,11834,14957,11489,14958,11194,14943,10803,14921,10506,14893,10278,14858,9960,14484,14039,14487,14025,14499,13941,14524,13740,14574,13468,14654,13106,14743,12678,14818,12344,14867,11893,14889,11509,14893,11180,14881,10751,14852,10428,14812,10128,14765,9754,14712,9466,14764,13480,14764,13475,14766,13440,14766,13347,14769,13070,14786,12713,14816,12387,14844,11957,14860,11549,14868,11215,14855,10751,14825,10403,14782,10044,14729,9651,14666,9352,14599,9029,14967,12835,14966,12831,14963,12804,14954,12723,14936,12564,14917,12347,14900,11958,14886,11569,14878,11247,14859,10765,14828,10401,14784,10011,14727,9600,14660,9289,14586,8893,14508,8533,15111,12234,15110,12234,15104,12216,15092,12156,15067,12010,15028,11776,14981,11500,14942,11205,14902,10752,14861,10393,14812,9991,14752,9570,14682,9252,14603,8808,14519,8445,14431,8145,15209,11449,15208,11451,15202,11451,15190,11438,15163,11384,15117,11274,15055,10979,14994,10648,14932,10343,14871,9936,14803,9532,14729,9218,14645,8742,14556,8381,14461,8020,14365,7603,15273,10603,15272,10607,15267,10619,15256,10631,15231,10614,15182,10535,15118,10389,15042,10167,14963,9787,14883,9447,14800,9115,14710,8665,14615,8318,14514,7911,14411,7507,14279,7198,15314,9675,15313,9683,15309,9712,15298,9759,15277,9797,15229,9773,15166,9668,15084,9487,14995,9274,14898,8910,14800,8539,14697,8234,14590,7790,14479,7409,14367,7067,14178,6621,15337,8619,15337,8631,15333,8677,15325,8769,15305,8871,15264,8940,15202,8909,15119,8775,15022,8565,14916,8328,14804,8009,14688,7614,14569,7287,14448,6888,14321,6483,14088,6171,15350,7402,15350,7419,15347,7480,15340,7613,15322,7804,15287,7973,15229,8057,15148,8012,15046,7846,14933,7611,14810,7357,14682,7069,14552,6656,14421,6316,14251,5948,14007,5528,15356,5942,15356,5977,15353,6119,15348,6294,15332,6551,15302,6824,15249,7044,15171,7122,15070,7050,14949,6861,14818,6611,14679,6349,14538,6067,14398,5651,14189,5311,13935,4958,15359,4123,15359,4153,15356,4296,15353,4646,15338,5160,15311,5508,15263,5829,15188,6042,15088,6094,14966,6001,14826,5796,14678,5543,14527,5287,14377,4985,14133,4586,13869,4257,15360,1563,15360,1642,15358,2076,15354,2636,15341,3350,15317,4019,15273,4429,15203,4732,15105,4911,14981,4932,14836,4818,14679,4621,14517,4386,14359,4156,14083,3795,13808,3437,15360,122,15360,137,15358,285,15355,636,15344,1274,15322,2177,15281,2765,15215,3223,15120,3451,14995,3569,14846,3567,14681,3466,14511,3305,14344,3121,14037,2800,13753,2467,15360,0,15360,1,15359,21,15355,89,15346,253,15325,479,15287,796,15225,1148,15133,1492,15008,1749,14856,1882,14685,1886,14506,1783,14324,1608,13996,1398,13702,1183]);let oa=null;function Y3(){return oa===null&&(oa=new DT(W3,16,16,ar,ma),oa.name="DFG_LUT",oa.minFilter=Gn,oa.magFilter=Gn,oa.wrapS=Ba,oa.wrapT=Ba,oa.generateMipmaps=!1,oa.needsUpdate=!0),oa}class q3{constructor(e={}){const{canvas:i=aT(),context:s=null,depth:l=!0,stencil:f=!1,alpha:h=!1,antialias:d=!1,premultipliedAlpha:m=!0,preserveDrawingBuffer:p=!1,powerPreference:x="default",failIfMajorPerformanceCaveat:_=!1,reversedDepthBuffer:v=!1,outputBufferType:M=xi}=e;this.isWebGLRenderer=!0;let R;if(s!==null){if(typeof WebGLRenderingContext<"u"&&s instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");R=s.getContextAttributes().alpha}else R=h;const w=M,y=new Set([rm,sm,am]),S=new Set([xi,pa,Cl,wl,nm,im]),O=new Uint32Array(4),G=new Int32Array(4),C=new nt;let D=null,N=null;const P=[],T=[];let U=null;this.domElement=i,this.debug={checkShaderErrors:!0,diagnostics:{keywords:!1},onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=da,this.toneMappingExposure=1,this.transmissionResolutionScale=1;const F=this;let V=!1,Q=null,st=null,Y=null,tt=null;this._outputColorSpace=Ui;let W=0,q=0,dt=null,ct=-1,rt=null;const bt=new on,Gt=new on;let Ot=null;const z=new Me(0);let _t=0,Nt=i.width,Z=i.height,ft=1,wt=null,Pt=null;const vt=new on(0,0,Nt,Z),Ut=new on(0,0,Nt,Z);let Te=!1;const ce=new dm;let pe=!1,_e=!1;const ee=new ln,ne=new nt,Be=new on,sn={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0};let Pe=!1;function Je(){return dt===null?ft:1}let X=s;function je(b,B){return i.getContext(b,B)}let Ee,L,E,et,at,gt,Dt,It,xt,St,mt,Ct,yt,At,Lt,Qt,ae,k,zt,Tt,Bt,Yt,Rt;try{const b={alpha:!0,depth:l,stencil:f,antialias:d,premultipliedAlpha:m,preserveDrawingBuffer:p,powerPreference:x,failIfMajorPerformanceCaveat:_};if("setAttribute"in i&&i.setAttribute("data-engine",`three.js r${tm}`),i.addEventListener("webglcontextlost",Ue,!1),i.addEventListener("webglcontextrestored",fe,!1),i.addEventListener("webglcontextcreationerror",si,!1),X===null){const B="webgl2";if(X=je(B,b),X===null)throw je(B)?new Error("THREE.WebGLRenderer: Error creating WebGL context with your selected attributes."):new Error("THREE.WebGLRenderer: Error creating WebGL context.")}te()}catch(b){throw i.removeEventListener("webglcontextlost",Ue,!1),i.removeEventListener("webglcontextrestored",fe,!1),i.removeEventListener("webglcontextcreationerror",si,!1),Fe("WebGLRenderer: "+b.message),b}function te(){Ee=new YA(X),Ee.init(),Bt=new z3(X,Ee),L=new IA(X,Ee,e,Bt),E=new P3(X,Ee),L.reversedDepthBuffer&&v&&E.buffers.depth.setReversed(!0),st=X.createFramebuffer(),Y=X.createFramebuffer(),tt=X.createFramebuffer(),et=new jA(X),at=new y3,gt=new I3(X,Ee,E,at,L,Bt,et),Dt=new WA(F),It=new QT(X),Yt=new OA(X,It),xt=new qA(X,It,et,Yt),St=new QA(X,xt,It,Yt,et),k=new KA(X,L,gt),Lt=new zA(at),mt=new S3(F,Dt,Ee,L,Yt,Lt),Ct=new X3(F,at),yt=new E3,At=new w3(Ee),ae=new LA(F,Dt,E,St,R,m),Qt=new O3(F,St,L),Rt=new k3(X,et,L,E),zt=new PA(X,Ee,et),Tt=new ZA(X,Ee,et),et.programs=mt.programs,F.capabilities=L,F.extensions=Ee,F.properties=at,F.renderLists=yt,F.shadowMap=Qt,F.state=E,F.info=et}w!==xi&&(U=new $A(w,i.width,i.height,d,l,f));const Wt=new G3(F,X);this.xr=Wt,this.getContext=function(){return X},this.getContextAttributes=function(){return X.getContextAttributes()},this.forceContextLoss=function(){const b=Ee.get("WEBGL_lose_context");b&&b.loseContext()},this.forceContextRestore=function(){const b=Ee.get("WEBGL_lose_context");b&&b.restoreContext()},this.getPixelRatio=function(){return ft},this.setPixelRatio=function(b){b!==void 0&&(ft=b,this.setSize(Nt,Z,!1))},this.getSize=function(b){return b.set(Nt,Z)},this.setSize=function(b,B,pt=!0){if(Wt.isPresenting){oe("WebGLRenderer: Can't change size while VR device is presenting.");return}Nt=b,Z=B,i.width=Math.floor(b*ft),i.height=Math.floor(B*ft),pt===!0&&(i.style.width=b+"px",i.style.height=B+"px"),U!==null&&U.setSize(i.width,i.height),this.setViewport(0,0,b,B)},this.getDrawingBufferSize=function(b){return b.set(Nt*ft,Z*ft).floor()},this.setDrawingBufferSize=function(b,B,pt){Nt=b,Z=B,ft=pt,i.width=Math.floor(b*pt),i.height=Math.floor(B*pt),this.setViewport(0,0,b,B)},this.setEffects=function(b){if(w===xi){Fe("WebGLRenderer: setEffects() requires outputBufferType set to HalfFloatType or FloatType.");return}if(b){for(let B=0;B<b.length;B++)if(b[B].isOutputPass===!0){oe("WebGLRenderer: OutputPass is not needed in setEffects(). Tone mapping and color space conversion are applied automatically.");break}}U.setEffects(b||[])},this.getCurrentViewport=function(b){return b.copy(bt)},this.getViewport=function(b){return b.copy(vt)},this.setViewport=function(b,B,pt,ot){b.isVector4?vt.set(b.x,b.y,b.z,b.w):vt.set(b,B,pt,ot),E.viewport(bt.copy(vt).multiplyScalar(ft).round())},this.getScissor=function(b){return b.copy(Ut)},this.setScissor=function(b,B,pt,ot){b.isVector4?Ut.set(b.x,b.y,b.z,b.w):Ut.set(b,B,pt,ot),E.scissor(Gt.copy(Ut).multiplyScalar(ft).round())},this.getScissorTest=function(){return Te},this.setScissorTest=function(b){E.setScissorTest(Te=b)},this.setOpaqueSort=function(b){wt=b},this.setTransparentSort=function(b){Pt=b},this.getClearColor=function(b){return b.copy(ae.getClearColor())},this.setClearColor=function(){ae.setClearColor(...arguments)},this.getClearAlpha=function(){return ae.getClearAlpha()},this.setClearAlpha=function(){ae.setClearAlpha(...arguments)},this.clear=function(b=!0,B=!0,pt=!0){let ot=0;if(b){let lt=!1;if(dt!==null){const Vt=dt.texture.format;lt=y.has(Vt)}if(lt){const Vt=dt.texture.type,qt=S.has(Vt),Ft=ae.getClearColor(),Kt=ae.getClearAlpha(),Jt=Ft.r,re=Ft.g,he=Ft.b;qt?(O[0]=Jt,O[1]=re,O[2]=he,O[3]=Kt,X.clearBufferuiv(X.COLOR,0,O)):(G[0]=Jt,G[1]=re,G[2]=he,G[3]=Kt,X.clearBufferiv(X.COLOR,0,G))}else ot|=X.COLOR_BUFFER_BIT}B&&(ot|=X.DEPTH_BUFFER_BIT,this.state.buffers.depth.setMask(!0)),pt&&(ot|=X.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),ot!==0&&X.clear(ot)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.setNodesHandler=function(b){b.setRenderer(this),Q=b},this.dispose=function(){i.removeEventListener("webglcontextlost",Ue,!1),i.removeEventListener("webglcontextrestored",fe,!1),i.removeEventListener("webglcontextcreationerror",si,!1),ae.dispose(),yt.dispose(),At.dispose(),at.dispose(),Dt.dispose(),St.dispose(),Yt.dispose(),Rt.dispose(),mt.dispose(),Wt.dispose(),Wt.removeEventListener("sessionstart",Rs),Wt.removeEventListener("sessionend",ka),Yi.stop()};function Ue(b){b.preventDefault(),Yv("WebGLRenderer: Context Lost."),V=!0}function fe(){Yv("WebGLRenderer: Context Restored."),V=!1;const b=et.autoReset,B=Qt.enabled,pt=Qt.autoUpdate,ot=Qt.needsUpdate,lt=Qt.type;te(),et.autoReset=b,Qt.enabled=B,Qt.autoUpdate=pt,Qt.needsUpdate=ot,Qt.type=lt}function si(b){Fe("WebGLRenderer: A WebGL context could not be created. Reason: ",b.statusMessage)}function Si(b){const B=b.target;B.removeEventListener("dispose",Si),Zc(B)}function Zc(b){rr(b),at.remove(b)}function rr(b){const B=at.get(b).programs;B!==void 0&&(B.forEach(function(pt){mt.releaseProgram(pt)}),b.isShaderMaterial&&mt.releaseShaderCache(b))}this.renderBufferDirect=function(b,B,pt,ot,lt,Vt){B===null&&(B=sn);const qt=lt.isMesh&&lt.matrixWorld.determinantAffine()<0,Ft=Eo(b,B,pt,ot,lt);E.setMaterial(ot,qt);let Kt=pt.index,Jt=1;if(ot.wireframe===!0){if(Kt=xt.getWireframeAttribute(pt),Kt===void 0)return;Jt=2}const re=pt.drawRange,he=pt.attributes.position;let Zt=re.start*Jt,be=(re.start+re.count)*Jt;Vt!==null&&(Zt=Math.max(Zt,Vt.start*Jt),be=Math.min(be,(Vt.start+Vt.count)*Jt)),Kt!==null?(Zt=Math.max(Zt,0),be=Math.min(be,Kt.count)):he!=null&&(Zt=Math.max(Zt,0),be=Math.min(be,he.count));const xe=be-Zt;if(xe<0||xe===1/0)return;Yt.setup(lt,ot,Ft,pt,Kt);let Ke,Ve=zt;if(Kt!==null&&(Ke=It.get(Kt),Ve=Tt,Ve.setIndex(Ke)),lt.isMesh)ot.wireframe===!0?(E.setLineWidth(ot.wireframeLinewidth*Je()),Ve.setMode(X.LINES)):Ve.setMode(X.TRIANGLES);else if(lt.isLine){let yn=ot.linewidth;yn===void 0&&(yn=1),E.setLineWidth(yn*Je()),lt.isLineSegments?Ve.setMode(X.LINES):lt.isLineLoop?Ve.setMode(X.LINE_LOOP):Ve.setMode(X.LINE_STRIP)}else lt.isPoints?Ve.setMode(X.POINTS):lt.isSprite&&Ve.setMode(X.TRIANGLES);if(lt.isBatchedMesh)if(Ee.get("WEBGL_multi_draw"))Ve.renderMultiDraw(lt._multiDrawStarts,lt._multiDrawCounts,lt._multiDrawCount);else{const yn=lt._multiDrawStarts,Xt=lt._multiDrawCounts,cn=lt._multiDrawCount,Le=Kt?It.get(Kt).bytesPerElement:1,Vn=at.get(ot).currentProgram.getUniforms();for(let ri=0;ri<cn;ri++)Vn.setValue(X,"_gl_DrawID",ri),Ve.render(yn[ri]/Le,Xt[ri])}else if(lt.isInstancedMesh)Ve.renderInstances(Zt,xe,lt.count);else if(pt.isInstancedBufferGeometry){const yn=pt._maxInstanceCount!==void 0?pt._maxInstanceCount:1/0,Xt=Math.min(pt.instanceCount,yn);Ve.renderInstances(Zt,xe,Xt)}else Ve.render(Zt,xe)};function As(b,B,pt,ot){Q!==null&&b.isNodeMaterial&&Q.setObject(ot,b),pe===!0&&Lt.setState(b,pt,!1),b.transparent===!0&&b.side===Li&&b.forceSinglePass===!1?(b.side=ai,b.needsUpdate=!0,Cs(b,B,ot),b.side=nr,b.needsUpdate=!0,Cs(b,B,ot),b.side=Li):Cs(b,B,ot)}this.compile=function(b,B,pt=null){pt===null&&(pt=b),Q!==null&&Q.renderStart(b,B,pt),N=At.get(pt),N.init(B),T.push(N),pt.traverseVisible(function(lt){lt.isLight&&lt.layers.test(B.layers)&&(N.pushLight(lt),lt.castShadow&&N.pushShadow(lt))}),b!==pt&&b.traverseVisible(function(lt){lt.isLight&&lt.layers.test(B.layers)&&(N.pushLight(lt),lt.castShadow&&N.pushShadow(lt))}),N.setupLights(),Q!==null&&Q.updateLights(N.state.lightsArray),_e=this.localClippingEnabled,pe=Lt.init(this.clippingPlanes,_e),pe===!0&&Lt.setGlobalState(this.clippingPlanes,B),Q!==null&&Qt.render(N.state.shadowsArray,pt,B);const ot=new Set;return b.traverse(function(lt){if(!(lt.isMesh||lt.isPoints||lt.isLine||lt.isSprite))return;const Vt=lt.material;if(Vt)if(Array.isArray(Vt))for(let qt=0;qt<Vt.length;qt++){const Ft=Vt[qt];As(Ft,pt,B,lt),ot.add(Ft)}else As(Vt,pt,B,lt),ot.add(Vt)}),N=T.pop(),Q!==null&&Q.renderEnd(),ot},this.compileAsync=function(b,B,pt=null){const ot=this.compile(b,B,pt);return new Promise(lt=>{function Vt(){if(ot.forEach(function(qt){const Kt=at.get(qt).currentProgram;(Kt===void 0||Kt.isReady())&&ot.delete(qt)}),ot.size===0){lt(b);return}setTimeout(Vt,10)}Ee.get("KHR_parallel_shader_compile")!==null?Vt():setTimeout(Vt,10)})};let Xa=null;function _a(b){Xa&&Xa(b)}function Rs(){Yi.stop()}function ka(){Yi.start()}const Yi=new yS;Yi.setAnimationLoop(_a),typeof self<"u"&&Yi.setContext(self),this.setAnimationLoop=function(b){Xa=b,Wt.setAnimationLoop(b),b===null?Yi.stop():Yi.start()},Wt.addEventListener("sessionstart",Rs),Wt.addEventListener("sessionend",ka),this.render=function(b,B){if(B!==void 0&&B.isCamera!==!0){Fe("WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(V===!0)return;Q!==null&&Q.renderStart(b,B);const pt=Wt.enabled===!0&&Wt.isPresenting===!0,ot=U!==null&&(dt===null||pt)&&U.begin(F,dt);if(b.matrixWorldAutoUpdate===!0&&b.updateMatrixWorld(),B.parent===null&&B.matrixWorldAutoUpdate===!0&&B.updateMatrixWorld(),Wt.enabled===!0&&Wt.isPresenting===!0&&(U===null||U.isCompositing()===!1)&&(Wt.cameraAutoUpdate===!0&&Wt.updateCamera(B),B=Wt.getCamera()),b.isScene===!0&&b.onBeforeRender(F,b,B,dt),N=At.get(b,T.length),N.init(B),N.state.textureUnits=gt.getTextureUnits(),T.push(N),ee.multiplyMatrices(B.projectionMatrix,B.matrixWorldInverse),ce.setFromProjectionMatrix(ee,ha,B.reversedDepth),_e=this.localClippingEnabled,pe=Lt.init(this.clippingPlanes,_e),D=yt.get(b,P.length),D.init(),P.push(D),Wt.enabled===!0&&Wt.isPresenting===!0){const qt=F.xr.getDepthSensingMesh();qt!==null&&vo(qt,B,-1/0,F.sortObjects)}vo(b,B,0,F.sortObjects),D.finish(),Q!==null&&Q.updateLights(N.state.lightsArray),F.sortObjects===!0&&D.sort(wt,Pt),Pe=Wt.enabled===!1||Wt.isPresenting===!1||Wt.hasDepthSensing()===!1,Pe&&ae.addToRenderList(D,b),this.info.render.frame++,this.info.autoReset===!0&&this.info.reset(),pe===!0&&Lt.beginShadows();const lt=N.state.shadowsArray;if(Qt.render(lt,b,B),pe===!0&&Lt.endShadows(),(ot&&U.hasRenderPass())===!1){const qt=D.opaque,Ft=D.transmissive;if(N.setupLights(),B.isArrayCamera){const Kt=B.cameras;if(Ft.length>0)for(let Jt=0,re=Kt.length;Jt<re;Jt++){const he=Kt[Jt];or(qt,Ft,b,he)}Pe&&ae.render(b);for(let Jt=0,re=Kt.length;Jt<re;Jt++){const he=Kt[Jt];xo(D,b,he,he.viewport)}}else Ft.length>0&&or(qt,Ft,b,B),Pe&&ae.render(b),xo(D,b,B)}dt!==null&&q===0&&(gt.updateMultisampleRenderTarget(dt),gt.updateRenderTargetMipmap(dt)),ot&&U.end(F),b.isScene===!0&&b.onAfterRender(F,b,B),Yt.resetDefaultState(),ct=-1,rt=null,T.pop(),T.length>0?(N=T[T.length-1],gt.setTextureUnits(N.state.textureUnits),pe===!0&&Lt.setGlobalState(F.clippingPlanes,N.state.camera)):N=null,P.pop(),P.length>0?D=P[P.length-1]:D=null,Q!==null&&Q.renderEnd()};function vo(b,B,pt,ot){if(b.visible===!1)return;if(b.layers.test(B.layers)){if(b.isGroup)pt=b.renderOrder;else if(b.isLOD)b.autoUpdate===!0&&b.update(B);else if(b.isLightProbeGrid)N.pushLightProbeGrid(b);else if(b.isLight)N.pushLight(b),b.castShadow&&N.pushShadow(b);else if(b.isSprite){if(!b.frustumCulled||b.intersectsFrustum(ce)){ot&&Be.setFromMatrixPosition(b.matrixWorld).applyMatrix4(ee);const qt=St.update(b),Ft=b.material;Ft.visible&&D.push(b,qt,Ft,pt,Be.z,null,B)}}else if((b.isMesh||b.isLine||b.isPoints)&&(!b.frustumCulled||b.intersectsFrustum(ce))){const qt=St.update(b),Ft=b.material;if(ot&&(b.boundingSphere!==void 0?(b.boundingSphere===null&&b.computeBoundingSphere(),Be.copy(b.boundingSphere.center)):(qt.boundingSphere===null&&qt.computeBoundingSphere(),Be.copy(qt.boundingSphere.center)),Be.applyMatrix4(b.matrixWorld).applyMatrix4(ee)),Array.isArray(Ft)){const Kt=qt.groups;for(let Jt=0,re=Kt.length;Jt<re;Jt++){const he=Kt[Jt],Zt=Ft[he.materialIndex];Zt&&Zt.visible&&D.push(b,qt,Zt,pt,Be.z,he,B)}}else Ft.visible&&D.push(b,qt,Ft,pt,Be.z,null,B)}}const Vt=b.children;for(let qt=0,Ft=Vt.length;qt<Ft;qt++)vo(Vt[qt],B,pt,ot)}function xo(b,B,pt,ot){const{opaque:lt,transmissive:Vt,transparent:qt}=b;N.setupLightsView(pt),pe===!0&&Lt.setGlobalState(F.clippingPlanes,pt),ot&&E.viewport(bt.copy(ot)),lt.length>0&&qi(lt,B,pt),Vt.length>0&&qi(Vt,B,pt),qt.length>0&&qi(qt,B,pt),E.buffers.depth.setTest(!0),E.buffers.depth.setMask(!0),E.buffers.color.setMask(!0),E.setPolygonOffset(!1)}function or(b,B,pt,ot){if((pt.isScene===!0?pt.overrideMaterial:null)!==null)return;if(N.state.transmissionRenderTarget[ot.id]===void 0){const Zt=Ee.has("EXT_color_buffer_half_float")||Ee.has("EXT_color_buffer_float");N.state.transmissionRenderTarget[ot.id]=new Wi(1,1,{generateMipmaps:!0,type:Zt?ma:xi,minFilter:tr,samples:Math.max(4,L.samples),stencilBuffer:f,resolveDepthBuffer:!1,resolveStencilBuffer:!1,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,colorSpace:Oe.workingColorSpace})}const Vt=N.state.transmissionRenderTarget[ot.id],qt=ot.viewport||bt;Vt.setSize(qt.z*F.transmissionResolutionScale,qt.w*F.transmissionResolutionScale);const Ft=F.getRenderTarget(),Kt=F.getActiveCubeFace(),Jt=F.getActiveMipmapLevel();F.setRenderTarget(Vt),F.getClearColor(z),_t=F.getClearAlpha(),_t<1&&F.setClearColor(16777215,.5),F.clear(),Pe&&ae.render(pt);const re=F.toneMapping;F.toneMapping=da;const he=ot.viewport;if(ot.viewport!==void 0&&(ot.viewport=void 0),N.setupLightsView(ot),pe===!0&&Lt.setGlobalState(F.clippingPlanes,ot),qi(b,pt,ot),gt.updateMultisampleRenderTarget(Vt),gt.updateRenderTargetMipmap(Vt),Ee.has("WEBGL_multisampled_render_to_texture")===!1){let Zt=!1;for(let be=0,xe=B.length;be<xe;be++){const Ke=B[be],{object:Ve,geometry:yn,material:Xt,group:cn}=Ke;if(Xt.side===Li&&Ve.layers.test(ot.layers)){const Le=Xt.side;Xt.side=ai,Xt.needsUpdate=!0,Ol(Ve,pt,ot,yn,Xt,cn),Xt.side=Le,Xt.needsUpdate=!0,Zt=!0}}Zt===!0&&(gt.updateMultisampleRenderTarget(Vt),gt.updateRenderTargetMipmap(Vt))}F.setRenderTarget(Ft,Kt,Jt),F.setClearColor(z,_t),he!==void 0&&(ot.viewport=he),F.toneMapping=re}function qi(b,B,pt){const ot=B.isScene===!0?B.overrideMaterial:null;for(let lt=0,Vt=b.length;lt<Vt;lt++){const qt=b[lt],{object:Ft,geometry:Kt,group:Jt}=qt;let re=qt.material;re.allowOverride===!0&&ot!==null&&(re=ot),Ft.layers.test(pt.layers)&&Ol(Ft,B,pt,Kt,re,Jt)}}function Ol(b,B,pt,ot,lt,Vt){Q!==null&&lt.isNodeMaterial&&Q.setObject(b,lt),b.onBeforeRender(F,B,pt,ot,lt,Vt),b.modelViewMatrix.multiplyMatrices(pt.matrixWorldInverse,b.matrixWorld),b.normalMatrix.getNormalMatrix(b.modelViewMatrix),lt.onBeforeRender(F,B,pt,ot,b,Vt),lt.transparent===!0&&lt.side===Li&&lt.forceSinglePass===!1?(lt.side=ai,lt.needsUpdate=!0,F.renderBufferDirect(pt,B,ot,lt,b,Vt),lt.side=nr,lt.needsUpdate=!0,F.renderBufferDirect(pt,B,ot,lt,b,Vt),lt.side=Li):F.renderBufferDirect(pt,B,ot,lt,b,Vt),b.onAfterRender(F,B,pt,ot,lt,Vt)}function Cs(b,B,pt){B.isScene!==!0&&(B=sn);const ot=at.get(b),lt=N.state.lights,Vt=N.state.shadowsArray,qt=lt.state.version,Ft=mt.getParameters(b,lt.state,Vt,B,pt,N.state.lightProbeGridArray),Kt=mt.getProgramCacheKey(Ft);let Jt=ot.programs;ot.environment=b.isMeshStandardMaterial||b.isMeshLambertMaterial||b.isMeshPhongMaterial?B.environment:null,ot.fog=B.fog;const re=b.isMeshStandardMaterial||b.isMeshLambertMaterial&&!b.envMap||b.isMeshPhongMaterial&&!b.envMap;ot.envMap=Dt.get(b.envMap||ot.environment,re),ot.envMapRotation=ot.environment!==null&&b.envMap===null?B.environmentRotation:b.envMapRotation,Jt===void 0&&(b.addEventListener("dispose",Si),Jt=new Map,ot.programs=Jt);let he=Jt.get(Kt);if(he!==void 0){if(ot.currentProgram===he&&ot.lightsStateVersion===qt)return yo(b,Ft),he}else Ft.uniforms=mt.getUniforms(b),Q!==null&&b.isNodeMaterial&&Q.build(b,pt,Ft),b.onBeforeCompile(Ft,F),he=mt.acquireProgram(Ft,Kt),Jt.set(Kt,he),ot.uniforms=Ft.uniforms;const Zt=ot.uniforms;return(!b.isShaderMaterial&&!b.isRawShaderMaterial||b.clipping===!0)&&(Zt.clippingPlanes=Lt.uniform),yo(b,Ft),ot.needsLights=Il(b),ot.lightsStateVersion=qt,ot.needsLights&&(Zt.ambientLightColor.value=lt.state.ambient,Zt.lightProbe.value=lt.state.probe,Zt.sunLights.value=lt.state.sun,Zt.sunLightShadows.value=lt.state.sunShadow,Zt.directionalLights.value=lt.state.directional,Zt.directionalLightShadows.value=lt.state.directionalShadow,Zt.spotLights.value=lt.state.spot,Zt.spotLightShadows.value=lt.state.spotShadow,Zt.rectAreaLights.value=lt.state.rectArea,Zt.ltc_1.value=lt.state.rectAreaLTC1,Zt.ltc_2.value=lt.state.rectAreaLTC2,Zt.pointLights.value=lt.state.point,Zt.pointLightShadows.value=lt.state.pointShadow,Zt.hemisphereLights.value=lt.state.hemi,Zt.sunShadowMatrix.value=lt.state.sunShadowMatrix,Zt.sunShadowCascade.value=lt.state.sunShadowCascade,Zt.directionalShadowMatrix.value=lt.state.directionalShadowMatrix,Zt.spotLightMatrix.value=lt.state.spotLightMatrix,Zt.spotLightMap.value=lt.state.spotLightMap,Zt.pointShadowMatrix.value=lt.state.pointShadowMatrix),ot.lightProbeGrid=N.state.lightProbeGridArray.length>0,ot.currentProgram=he,ot.uniformsList=null,he}function So(b){if(b.uniformsList===null){const B=b.currentProgram.getUniforms();b.uniformsList=Oc.seqWithValue(B.seq,b.uniforms)}return b.uniformsList}function yo(b,B){const pt=at.get(b);pt.outputColorSpace=B.outputColorSpace,pt.batching=B.batching,pt.batchingColor=B.batchingColor,pt.instancing=B.instancing,pt.instancingColor=B.instancingColor,pt.instancingMorph=B.instancingMorph,pt.skinning=B.skinning,pt.morphTargets=B.morphTargets,pt.morphNormals=B.morphNormals,pt.morphColors=B.morphColors,pt.morphTargetsCount=B.morphTargetsCount,pt.numClippingPlanes=B.numClippingPlanes,pt.numIntersection=B.numClipIntersection,pt.vertexAlphas=B.vertexAlphas,pt.vertexTangents=B.vertexTangents,pt.toneMapping=B.toneMapping}function Mo(b,B){if(b.length===0)return null;if(b.length===1)return b[0].texture!==null?b[0]:null;C.setFromMatrixPosition(B.matrixWorld);for(let pt=0,ot=b.length;pt<ot;pt++){const lt=b[pt];if(lt.texture!==null&&lt.boundingBox.containsPoint(C))return lt}return null}function Eo(b,B,pt,ot,lt){B.isScene!==!0&&(B=sn),gt.resetTextureUnits();const Vt=B.fog,qt=ot.isMeshStandardMaterial||ot.isMeshLambertMaterial||ot.isMeshPhongMaterial?B.environment:null,Ft=dt===null?F.outputColorSpace:dt.isXRRenderTarget===!0?dt.texture.colorSpace:Oe.workingColorSpace,Kt=ot.isMeshStandardMaterial||ot.isMeshLambertMaterial&&!ot.envMap||ot.isMeshPhongMaterial&&!ot.envMap,Jt=Dt.get(ot.envMap||qt,Kt),re=ot.vertexColors===!0&&!!pt.attributes.color&&pt.attributes.color.itemSize===4,he=!!pt.attributes.tangent&&(!!ot.normalMap||ot.anisotropy>0),Zt=!!pt.morphAttributes.position,be=!!pt.morphAttributes.normal,xe=!!pt.morphAttributes.color;let Ke=da;ot.toneMapped&&(dt===null||dt.isXRRenderTarget===!0)&&(Ke=F.toneMapping);const Ve=pt.morphAttributes.position||pt.morphAttributes.normal||pt.morphAttributes.color,yn=Ve!==void 0?Ve.length:0,Xt=at.get(ot),cn=N.state.lights;if(pe===!0&&(_e===!0||b!==rt)){const we=b===rt&&ot.id===ct;Lt.setState(ot,b,we)}let Le=!1;ot.version===Xt.__version?(Xt.needsLights&&Xt.lightsStateVersion!==cn.state.version||Xt.outputColorSpace!==Ft||lt.isBatchedMesh&&Xt.batching===!1||!lt.isBatchedMesh&&Xt.batching===!0||lt.isBatchedMesh&&Xt.batchingColor===!0&&lt._colorsTexture===null||lt.isBatchedMesh&&Xt.batchingColor===!1&&lt._colorsTexture!==null||lt.isInstancedMesh&&Xt.instancing===!1||!lt.isInstancedMesh&&Xt.instancing===!0||lt.isSkinnedMesh&&Xt.skinning===!1||!lt.isSkinnedMesh&&Xt.skinning===!0||lt.isInstancedMesh&&Xt.instancingColor===!0&&lt.instanceColor===null||lt.isInstancedMesh&&Xt.instancingColor===!1&&lt.instanceColor!==null||lt.isInstancedMesh&&Xt.instancingMorph===!0&&lt.morphTexture===null||lt.isInstancedMesh&&Xt.instancingMorph===!1&&lt.morphTexture!==null||Xt.envMap!==Jt||ot.fog===!0&&Xt.fog!==Vt||Xt.numClippingPlanes!==void 0&&(Xt.numClippingPlanes!==Lt.numPlanes||Xt.numIntersection!==Lt.numIntersection)||Xt.vertexAlphas!==re||Xt.vertexTangents!==he||Xt.morphTargets!==Zt||Xt.morphNormals!==be||Xt.morphColors!==xe||Xt.toneMapping!==Ke||Xt.morphTargetsCount!==yn||!!Xt.lightProbeGrid!=N.state.lightProbeGridArray.length>0)&&(Le=!0):(Le=!0,Xt.__version=ot.version);let Vn=Xt.currentProgram;Le===!0&&(Vn=Cs(ot,B,lt),Q&&ot.isNodeMaterial&&Q.onUpdateProgram(ot,Vn,Xt));let ri=!1,Zi=!1,Se=!1;const He=Vn.getUniforms(),tn=Xt.uniforms;if(E.useProgram(Vn.program)&&(ri=!0,Zi=!0,Se=!0),ot.id!==ct&&(ct=ot.id,Zi=!0),Xt.needsLights){const we=Mo(N.state.lightProbeGridArray,lt);Xt.lightProbeGrid!==we&&(Xt.lightProbeGrid=we,Zi=!0)}if(ri||rt!==b){E.buffers.depth.getReversed()&&b.reversedDepth!==!0&&(b._reversedDepth=!0,b.updateProjectionMatrix()),He.setValue(X,"projectionMatrix",b.projectionMatrix),He.setValue(X,"viewMatrix",b.matrixWorldInverse);const fn=He.map.cameraPosition;fn!==void 0&&fn.setValue(X,ne.setFromMatrixPosition(b.matrixWorld)),L.logarithmicDepthBuffer&&He.setValue(X,"logDepthBufFC",2/(Math.log(b.far+1)/Math.LN2)),(ot.isMeshPhongMaterial||ot.isMeshToonMaterial||ot.isMeshLambertMaterial||ot.isMeshBasicMaterial||ot.isMeshStandardMaterial||ot.isShaderMaterial)&&He.setValue(X,"isOrthographic",b.isOrthographicCamera===!0),rt!==b&&(rt=b,Zi=!0,Se=!0)}if(Xt.needsLights&&(cn.state.sunShadowMap.length>0&&He.setValue(X,"sunShadowMap",cn.state.sunShadowMap,gt),cn.state.directionalShadowMap.length>0&&He.setValue(X,"directionalShadowMap",cn.state.directionalShadowMap,gt),cn.state.spotShadowMap.length>0&&He.setValue(X,"spotShadowMap",cn.state.spotShadowMap,gt),cn.state.pointShadowMap.length>0&&He.setValue(X,"pointShadowMap",cn.state.pointShadowMap,gt)),lt.isSkinnedMesh){He.setOptional(X,lt,"bindMatrix"),He.setOptional(X,lt,"bindMatrixInverse");const we=lt.skeleton;we&&(we.boneTexture===null&&we.computeBoneTexture(),He.setValue(X,"boneTexture",we.boneTexture,gt))}lt.isBatchedMesh&&(He.setOptional(X,lt,"batchingTexture"),He.setValue(X,"batchingTexture",lt._matricesTexture,gt),He.setOptional(X,lt,"batchingIdTexture"),He.setValue(X,"batchingIdTexture",lt._indirectTexture,gt),He.setOptional(X,lt,"batchingColorTexture"),lt._colorsTexture!==null&&He.setValue(X,"batchingColorTexture",lt._colorsTexture,gt));const oi=pt.morphAttributes;if((oi.position!==void 0||oi.normal!==void 0||oi.color!==void 0)&&k.update(lt,pt,Vn),(Zi||Xt.receiveShadow!==lt.receiveShadow)&&(Xt.receiveShadow=lt.receiveShadow,He.setValue(X,"receiveShadow",lt.receiveShadow)),(ot.isMeshStandardMaterial||ot.isMeshLambertMaterial||ot.isMeshPhongMaterial)&&ot.envMap===null&&B.environment!==null&&(tn.envMapIntensity.value=B.environmentIntensity),tn.dfgLUT!==void 0&&(tn.dfgLUT.value=Y3()),Zi){if(He.setValue(X,"toneMappingExposure",F.toneMappingExposure),Xt.needsLights&&Pl(tn,Se),Vt&&ot.fog===!0&&Ct.refreshFogUniforms(tn,Vt),Ct.refreshMaterialUniforms(tn,ot,ft,Z,N.state.transmissionRenderTarget[b.id]),Xt.needsLights&&Xt.lightProbeGrid){const we=Xt.lightProbeGrid;tn.probesSH.value=we.texture,tn.probesMin.value.copy(we.boundingBox.min),tn.probesMax.value.copy(we.boundingBox.max),tn.probesResolution.value.copy(we.resolution)}Oc.upload(X,So(Xt),tn,gt)}if(ot.isShaderMaterial&&ot.uniformsNeedUpdate===!0&&(Oc.upload(X,So(Xt),tn,gt),ot.uniformsNeedUpdate=!1),ot.isSpriteMaterial&&He.setValue(X,"center",lt.center),He.setValue(X,"modelViewMatrix",lt.modelViewMatrix),He.setValue(X,"normalMatrix",lt.normalMatrix),He.setValue(X,"modelMatrix",lt.matrixWorld),ot.uniformsGroups!==void 0){const we=ot.uniformsGroups;for(let fn=0,va=we.length;fn<va;fn++){const zl=we[fn];Rt.update(zl,Vn),Rt.bind(zl,Vn)}}return Vn}function Pl(b,B){b.ambientLightColor.needsUpdate=B,b.lightProbe.needsUpdate=B,b.sunLights.needsUpdate=B,b.sunLightShadows.needsUpdate=B,b.directionalLights.needsUpdate=B,b.directionalLightShadows.needsUpdate=B,b.pointLights.needsUpdate=B,b.pointLightShadows.needsUpdate=B,b.spotLights.needsUpdate=B,b.spotLightShadows.needsUpdate=B,b.rectAreaLights.needsUpdate=B,b.hemisphereLights.needsUpdate=B}function Il(b){return b.isMeshLambertMaterial||b.isMeshToonMaterial||b.isMeshPhongMaterial||b.isMeshStandardMaterial||b.isShadowMaterial||b.isShaderMaterial&&b.lights===!0}this.getActiveCubeFace=function(){return W},this.getActiveMipmapLevel=function(){return q},this.getRenderTarget=function(){return dt},this.setRenderTargetTextures=function(b,B,pt){const ot=at.get(b);ot.__autoAllocateDepthBuffer=b.resolveDepthBuffer===!1,ot.__autoAllocateDepthBuffer===!1&&(ot.__useRenderToTexture=!1),at.get(b.texture).__webglTexture=B,at.get(b.depthTexture).__webglTexture=ot.__autoAllocateDepthBuffer?void 0:pt,ot.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(b,B){const pt=at.get(b);pt.__webglFramebuffer=B,pt.__useDefaultFramebuffer=B===void 0},this.setRenderTarget=function(b,B=0,pt=0){dt=b,W=B,q=pt;let ot=null,lt=!1,Vt=!1;if(b){const Ft=at.get(b);if(Ft.__useDefaultFramebuffer!==void 0){E.bindFramebuffer(X.FRAMEBUFFER,Ft.__webglFramebuffer),bt.copy(b.viewport),Gt.copy(b.scissor),Ot=b.scissorTest,E.viewport(bt),E.scissor(Gt),E.setScissorTest(Ot),ct=-1;return}else if(Ft.__webglFramebuffer===void 0)gt.setupRenderTarget(b);else if(Ft.__hasExternalTextures)gt.rebindTextures(b,at.get(b.texture).__webglTexture,at.get(b.depthTexture).__webglTexture);else if(b.depthBuffer){const re=b.depthTexture;if(Ft.__boundDepthTexture!==re){if(re!==null&&at.has(re)&&(b.width!==re.image.width||b.height!==re.image.height))throw new Error("THREE.WebGLRenderer: Attached DepthTexture is initialized to the incorrect size.");gt.setupDepthRenderbuffer(b)}}const Kt=b.texture;(Kt.isData3DTexture||Kt.isDataArrayTexture||Kt.isCompressedArrayTexture)&&(Vt=!0);const Jt=at.get(b).__webglFramebuffer;b.isWebGLCubeRenderTarget?(Array.isArray(Jt[B])?ot=Jt[B][pt]:ot=Jt[B],lt=!0):b.samples>0&&gt.useMultisampledRTT(b)===!1?ot=at.get(b).__webglMultisampledFramebuffer:Array.isArray(Jt)?ot=Jt[pt]:ot=Jt,bt.copy(b.viewport),Gt.copy(b.scissor),Ot=b.scissorTest}else bt.copy(vt).multiplyScalar(ft).floor(),Gt.copy(Ut).multiplyScalar(ft).floor(),Ot=Te;if(pt!==0&&(ot=st),E.bindFramebuffer(X.FRAMEBUFFER,ot)&&E.drawBuffers(b,ot),E.viewport(bt),E.scissor(Gt),E.setScissorTest(Ot),lt){const Ft=at.get(b.texture);X.framebufferTexture2D(X.FRAMEBUFFER,X.COLOR_ATTACHMENT0,X.TEXTURE_CUBE_MAP_POSITIVE_X+B,Ft.__webglTexture,pt)}else if(Vt){const Ft=B;for(let Kt=0;Kt<b.textures.length;Kt++){const Jt=at.get(b.textures[Kt]);X.framebufferTextureLayer(X.FRAMEBUFFER,X.COLOR_ATTACHMENT0+Kt,Jt.__webglTexture,pt,Ft)}}else if(b!==null&&pt!==0){const Ft=at.get(b.texture);X.framebufferTexture2D(X.FRAMEBUFFER,X.COLOR_ATTACHMENT0,X.TEXTURE_2D,Ft.__webglTexture,pt)}ct=-1};function yi(b){const B=at.get(b);return(B.__readFormat!==b.format||B.__readType!==b.type)&&(B.__readFormat=b.format,B.__readType=b.type,B.__formatReadable=L.textureFormatReadable(b.format),B.__typeReadable=L.textureTypeReadable(b.type)),B}this.readRenderTargetPixels=function(b,B,pt,ot,lt,Vt,qt,Ft=0){if(!(b&&b.isWebGLRenderTarget)){Fe("WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let Kt=at.get(b).__webglFramebuffer;if(b.isWebGLCubeRenderTarget&&qt!==void 0&&(Kt=Kt[qt]),Kt){E.bindFramebuffer(X.FRAMEBUFFER,Kt);try{const Jt=b.textures[Ft],re=Jt.format,he=Jt.type;b.textures.length>1&&X.readBuffer(X.COLOR_ATTACHMENT0+Ft);const Zt=yi(Jt);if(Zt.__formatReadable===!1){Fe("WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(Zt.__typeReadable===!1){Fe("WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}B>=0&&B<=b.width-ot&&pt>=0&&pt<=b.height-lt&&X.readPixels(B,pt,ot,lt,Bt.convert(re),Bt.convert(he),Vt)}finally{const Jt=dt!==null?at.get(dt).__webglFramebuffer:null;E.bindFramebuffer(X.FRAMEBUFFER,Jt)}}},this.readRenderTargetPixelsAsync=async function(b,B,pt,ot,lt,Vt,qt,Ft=0){if(!(b&&b.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let Kt=at.get(b).__webglFramebuffer;if(b.isWebGLCubeRenderTarget&&qt!==void 0&&(Kt=Kt[qt]),Kt)if(B>=0&&B<=b.width-ot&&pt>=0&&pt<=b.height-lt){E.bindFramebuffer(X.FRAMEBUFFER,Kt);const Jt=b.textures[Ft],re=Jt.format,he=Jt.type;b.textures.length>1&&X.readBuffer(X.COLOR_ATTACHMENT0+Ft);const Zt=yi(Jt);if(Zt.__formatReadable===!1)throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(Zt.__typeReadable===!1)throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");const be=X.createBuffer();X.bindBuffer(X.PIXEL_PACK_BUFFER,be),X.bufferData(X.PIXEL_PACK_BUFFER,Vt.byteLength,X.STREAM_READ),X.readPixels(B,pt,ot,lt,Bt.convert(re),Bt.convert(he),0),X.bindBuffer(X.PIXEL_PACK_BUFFER,null);const xe=dt!==null?at.get(dt).__webglFramebuffer:null;E.bindFramebuffer(X.FRAMEBUFFER,xe);const Ke=X.fenceSync(X.SYNC_GPU_COMMANDS_COMPLETE,0);return X.flush(),await sT(X,Ke,4),X.bindBuffer(X.PIXEL_PACK_BUFFER,be),X.getBufferSubData(X.PIXEL_PACK_BUFFER,0,Vt),X.bindBuffer(X.PIXEL_PACK_BUFFER,null),X.deleteBuffer(be),X.deleteSync(Ke),Vt}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")},this.copyFramebufferToTexture=function(b,B=null,pt=0){const ot=Math.pow(2,-pt),lt=Math.floor(b.image.width*ot),Vt=Math.floor(b.image.height*ot),qt=B!==null?B.x:0,Ft=B!==null?B.y:0;gt.setTexture2D(b,0),X.copyTexSubImage2D(X.TEXTURE_2D,pt,0,0,qt,Ft,lt,Vt),E.unbindTexture()},this.copyTextureToTexture=function(b,B,pt=null,ot=null,lt=0,Vt=0){let qt,Ft,Kt,Jt,re,he,Zt,be,xe;const Ke=b.isCompressedTexture?b.mipmaps[Vt]:b.image;if(pt!==null)qt=pt.max.x-pt.min.x,Ft=pt.max.y-pt.min.y,Kt=pt.isBox3?pt.max.z-pt.min.z:1,Jt=pt.min.x,re=pt.min.y,he=pt.isBox3?pt.min.z:0;else{const tn=Math.pow(2,-lt);qt=Math.floor(Ke.width*tn),Ft=Math.floor(Ke.height*tn),b.isDataArrayTexture?Kt=Ke.depth:b.isData3DTexture?Kt=Math.floor(Ke.depth*tn):Kt=1,Jt=0,re=0,he=0}ot!==null?(Zt=ot.x,be=ot.y,xe=ot.z):(Zt=0,be=0,xe=0);const Ve=Bt.convert(B.format),yn=Bt.convert(B.type);let Xt;B.isData3DTexture?(gt.setTexture3D(B,0),Xt=X.TEXTURE_3D):B.isDataArrayTexture||B.isCompressedArrayTexture?(gt.setTexture2DArray(B,0),Xt=X.TEXTURE_2D_ARRAY):(gt.setTexture2D(B,0),Xt=X.TEXTURE_2D),E.activeTexture(X.TEXTURE0),E.pixelStorei(X.UNPACK_FLIP_Y_WEBGL,B.flipY),E.pixelStorei(X.UNPACK_PREMULTIPLY_ALPHA_WEBGL,B.premultiplyAlpha),E.pixelStorei(X.UNPACK_ALIGNMENT,B.unpackAlignment);const cn=E.getParameter(X.UNPACK_ROW_LENGTH),Le=E.getParameter(X.UNPACK_IMAGE_HEIGHT),Vn=E.getParameter(X.UNPACK_SKIP_PIXELS),ri=E.getParameter(X.UNPACK_SKIP_ROWS),Zi=E.getParameter(X.UNPACK_SKIP_IMAGES);E.pixelStorei(X.UNPACK_ROW_LENGTH,Ke.width),E.pixelStorei(X.UNPACK_IMAGE_HEIGHT,Ke.height),E.pixelStorei(X.UNPACK_SKIP_PIXELS,Jt),E.pixelStorei(X.UNPACK_SKIP_ROWS,re),E.pixelStorei(X.UNPACK_SKIP_IMAGES,he);const Se=b.isDataArrayTexture||b.isData3DTexture,He=B.isDataArrayTexture||B.isData3DTexture;if(b.isDepthTexture){const tn=at.get(b),oi=at.get(B),we=at.get(tn.__renderTarget),fn=at.get(oi.__renderTarget);E.bindFramebuffer(X.READ_FRAMEBUFFER,we.__webglFramebuffer),E.bindFramebuffer(X.DRAW_FRAMEBUFFER,fn.__webglFramebuffer);for(let va=0;va<Kt;va++)Se&&(X.framebufferTextureLayer(X.READ_FRAMEBUFFER,X.COLOR_ATTACHMENT0,at.get(b).__webglTexture,lt,he+va),X.framebufferTextureLayer(X.DRAW_FRAMEBUFFER,X.COLOR_ATTACHMENT0,at.get(B).__webglTexture,Vt,xe+va)),X.blitFramebuffer(Jt,re,qt,Ft,Zt,be,qt,Ft,X.DEPTH_BUFFER_BIT,X.NEAREST);E.bindFramebuffer(X.READ_FRAMEBUFFER,null),E.bindFramebuffer(X.DRAW_FRAMEBUFFER,null)}else if(lt!==0||b.isRenderTargetTexture||at.has(b)){const tn=at.get(b),oi=at.get(B);E.bindFramebuffer(X.READ_FRAMEBUFFER,Y),E.bindFramebuffer(X.DRAW_FRAMEBUFFER,tt);for(let we=0;we<Kt;we++)Se?X.framebufferTextureLayer(X.READ_FRAMEBUFFER,X.COLOR_ATTACHMENT0,tn.__webglTexture,lt,he+we):X.framebufferTexture2D(X.READ_FRAMEBUFFER,X.COLOR_ATTACHMENT0,X.TEXTURE_2D,tn.__webglTexture,lt),He?X.framebufferTextureLayer(X.DRAW_FRAMEBUFFER,X.COLOR_ATTACHMENT0,oi.__webglTexture,Vt,xe+we):X.framebufferTexture2D(X.DRAW_FRAMEBUFFER,X.COLOR_ATTACHMENT0,X.TEXTURE_2D,oi.__webglTexture,Vt),lt!==0?X.blitFramebuffer(Jt,re,qt,Ft,Zt,be,qt,Ft,X.COLOR_BUFFER_BIT,X.NEAREST):He?X.copyTexSubImage3D(Xt,Vt,Zt,be,xe+we,Jt,re,qt,Ft):X.copyTexSubImage2D(Xt,Vt,Zt,be,Jt,re,qt,Ft);E.bindFramebuffer(X.READ_FRAMEBUFFER,null),E.bindFramebuffer(X.DRAW_FRAMEBUFFER,null)}else He?b.isDataTexture||b.isData3DTexture?X.texSubImage3D(Xt,Vt,Zt,be,xe,qt,Ft,Kt,Ve,yn,Ke.data):B.isCompressedArrayTexture?X.compressedTexSubImage3D(Xt,Vt,Zt,be,xe,qt,Ft,Kt,Ve,Ke.data):X.texSubImage3D(Xt,Vt,Zt,be,xe,qt,Ft,Kt,Ve,yn,Ke):b.isDataTexture?X.texSubImage2D(X.TEXTURE_2D,Vt,Zt,be,qt,Ft,Ve,yn,Ke.data):b.isCompressedTexture?X.compressedTexSubImage2D(X.TEXTURE_2D,Vt,Zt,be,Ke.width,Ke.height,Ve,Ke.data):X.texSubImage2D(X.TEXTURE_2D,Vt,Zt,be,qt,Ft,Ve,yn,Ke);E.pixelStorei(X.UNPACK_ROW_LENGTH,cn),E.pixelStorei(X.UNPACK_IMAGE_HEIGHT,Le),E.pixelStorei(X.UNPACK_SKIP_PIXELS,Vn),E.pixelStorei(X.UNPACK_SKIP_ROWS,ri),E.pixelStorei(X.UNPACK_SKIP_IMAGES,Zi),Vt===0&&B.generateMipmaps&&X.generateMipmap(Xt),E.unbindTexture()},this.initRenderTarget=function(b){at.get(b).__webglFramebuffer===void 0&&gt.setupRenderTarget(b)},this.initTexture=function(b){b.isCubeTexture?gt.setTextureCube(b,0):b.isData3DTexture?gt.setTexture3D(b,0):b.isDataArrayTexture||b.isCompressedArrayTexture?gt.setTexture2DArray(b,0):gt.setTexture2D(b,0),E.unbindTexture()},this.resetState=function(){W=0,q=0,dt=null,E.reset(),Yt.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return ha}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(e){this._outputColorSpace=e;const i=this.getContext();i.drawingBufferColorSpace=Oe._getDrawingBufferColorSpace(e),i.unpackColorSpace=Oe._getUnpackColorSpace()}}const Vx={type:"change"},Sm={type:"start"},wS={type:"end"},wc=new fm,Xx=new za,Z3=Math.cos(70*lT.DEG2RAD),En=new nt,ii=2*Math.PI,Ze={NONE:-1,ROTATE:0,DOLLY:1,PAN:2,TOUCH_ROTATE:3,TOUCH_PAN:4,TOUCH_DOLLY_PAN:5,TOUCH_DOLLY_ROTATE:6},rp=1e-6;class j3 extends jT{constructor(e,i=null){super(e,i),this.state=Ze.NONE,this.target=new nt,this.cursor=new nt,this.minDistance=0,this.maxDistance=1/0,this.minZoom=0,this.maxZoom=1/0,this.minTargetRadius=0,this.maxTargetRadius=1/0,this.minPolarAngle=0,this.maxPolarAngle=Math.PI,this.minAzimuthAngle=-1/0,this.maxAzimuthAngle=1/0,this.enableDamping=!1,this.dampingFactor=.05,this.enableZoom=!0,this.zoomSpeed=1,this.enableRotate=!0,this.rotateSpeed=1,this.keyRotateSpeed=1,this.enablePan=!0,this.panSpeed=1,this.screenSpacePanning=!0,this.keyPanSpeed=7,this.zoomToCursor=!1,this.autoRotate=!1,this.autoRotateSpeed=2,this.keys={LEFT:"ArrowLeft",UP:"ArrowUp",RIGHT:"ArrowRight",BOTTOM:"ArrowDown"},this.mouseButtons={LEFT:uo.ROTATE,MIDDLE:uo.DOLLY,RIGHT:uo.PAN},this.touches={ONE:oo.ROTATE,TWO:oo.DOLLY_PAN},this.target0=this.target.clone(),this.position0=this.object.position.clone(),this.zoom0=this.object.zoom,this._cursorStyle="auto",this._domElementKeyEvents=null,this._lastPosition=new nt,this._lastQuaternion=new Es,this._lastTargetPosition=new nt,this._quat=new Es().setFromUnitVectors(e.up,new nt(0,1,0)),this._quatInverse=this._quat.clone().invert(),this._spherical=new _x,this._sphericalDelta=new _x,this._scale=1,this._panOffset=new nt,this._rotateStart=new le,this._rotateEnd=new le,this._rotateDelta=new le,this._panStart=new le,this._panEnd=new le,this._panDelta=new le,this._dollyStart=new le,this._dollyEnd=new le,this._dollyDelta=new le,this._dollyDirection=new nt,this._mouse=new le,this._performCursorZoom=!1,this._pointers=[],this._pointerPositions={},this._controlActive=!1,this._onPointerMove=Q3.bind(this),this._onPointerDown=K3.bind(this),this._onPointerUp=J3.bind(this),this._onContextMenu=sC.bind(this),this._onMouseWheel=eC.bind(this),this._onKeyDown=nC.bind(this),this._onTouchStart=iC.bind(this),this._onTouchMove=aC.bind(this),this._onMouseDown=$3.bind(this),this._onMouseMove=tC.bind(this),this._interceptControlDown=rC.bind(this),this._interceptControlUp=oC.bind(this),this.domElement!==null&&this.connect(this.domElement),this.update()}set cursorStyle(e){this._cursorStyle=e,e==="grab"?this.domElement.style.cursor="grab":this.domElement.style.cursor="auto"}get cursorStyle(){return this._cursorStyle}connect(e){super.connect(e),this.domElement.addEventListener("pointerdown",this._onPointerDown),this.domElement.addEventListener("pointercancel",this._onPointerUp),this.domElement.addEventListener("contextmenu",this._onContextMenu),this.domElement.addEventListener("wheel",this._onMouseWheel,{passive:!1}),this.domElement.getRootNode().addEventListener("keydown",this._interceptControlDown,{passive:!0,capture:!0}),this.domElement.style.touchAction="none"}disconnect(){this.state=Ze.NONE,this.domElement.removeEventListener("pointerdown",this._onPointerDown),this.domElement.ownerDocument.removeEventListener("pointermove",this._onPointerMove),this.domElement.ownerDocument.removeEventListener("pointerup",this._onPointerUp),this.domElement.removeEventListener("pointercancel",this._onPointerUp),this.domElement.removeEventListener("wheel",this._onMouseWheel),this.domElement.removeEventListener("contextmenu",this._onContextMenu),this.stopListenToKeyEvents();const e=this.domElement.getRootNode();e.removeEventListener("keydown",this._interceptControlDown,{capture:!0}),e.removeEventListener("keyup",this._interceptControlUp,{capture:!0}),this._controlActive=!1,this._pointers.length=0,this._pointerPositions={},this.domElement.style.touchAction="",this.domElement.style.cursor="auto"}dispose(){this.disconnect()}getPolarAngle(){return this._spherical.phi}getAzimuthalAngle(){return this._spherical.theta}getDistance(){return this.object.position.distanceTo(this.target)}listenToKeyEvents(e){e.addEventListener("keydown",this._onKeyDown),this._domElementKeyEvents=e}stopListenToKeyEvents(){this._domElementKeyEvents!==null&&(this._domElementKeyEvents.removeEventListener("keydown",this._onKeyDown),this._domElementKeyEvents=null)}saveState(){this.target0.copy(this.target),this.position0.copy(this.object.position),this.zoom0=this.object.zoom}reset(){this.target.copy(this.target0),this.object.position.copy(this.position0),this.object.zoom=this.zoom0,this.object.updateProjectionMatrix(),this.dispatchEvent(Vx),this.update(),this.state=Ze.NONE}pan(e,i){this._pan(e,i),this.update()}dollyIn(e){this._dollyIn(e),this.update()}dollyOut(e){this._dollyOut(e),this.update()}rotateLeft(e){this._rotateLeft(e),this.update()}rotateUp(e){this._rotateUp(e),this.update()}update(e=null){const i=this.object.position;En.copy(i).sub(this.target),En.applyQuaternion(this._quat),this._spherical.setFromVector3(En),this.autoRotate&&this.state===Ze.NONE&&this._rotateLeft(this._getAutoRotationAngle(e)),this.enableDamping?(this._spherical.theta+=this._sphericalDelta.theta*this.dampingFactor,this._spherical.phi+=this._sphericalDelta.phi*this.dampingFactor):(this._spherical.theta+=this._sphericalDelta.theta,this._spherical.phi+=this._sphericalDelta.phi);let s=this.minAzimuthAngle,l=this.maxAzimuthAngle;isFinite(s)&&isFinite(l)&&(s<-Math.PI?s+=ii:s>Math.PI&&(s-=ii),l<-Math.PI?l+=ii:l>Math.PI&&(l-=ii),s<=l?this._spherical.theta=Math.max(s,Math.min(l,this._spherical.theta)):this._spherical.theta=this._spherical.theta>(s+l)/2?Math.max(s,this._spherical.theta):Math.min(l,this._spherical.theta)),this._spherical.phi=Math.max(this.minPolarAngle,Math.min(this.maxPolarAngle,this._spherical.phi)),this._spherical.makeSafe(),this.enableDamping===!0?this.target.addScaledVector(this._panOffset,this.dampingFactor):this.target.add(this._panOffset),this.target.sub(this.cursor),this.target.clampLength(this.minTargetRadius,this.maxTargetRadius),this.target.add(this.cursor);let f=!1;if(this.zoomToCursor&&this._performCursorZoom||this.object.isOrthographicCamera)this._spherical.radius=this._clampDistance(this._spherical.radius);else{const h=this._spherical.radius;this._spherical.radius=this._clampDistance(this._spherical.radius*this._scale),f=h!=this._spherical.radius}if(En.setFromSpherical(this._spherical),En.applyQuaternion(this._quatInverse),i.copy(this.target).add(En),this.object.lookAt(this.target),this.enableDamping===!0?(this._sphericalDelta.theta*=1-this.dampingFactor,this._sphericalDelta.phi*=1-this.dampingFactor,this._panOffset.multiplyScalar(1-this.dampingFactor)):(this._sphericalDelta.set(0,0,0),this._panOffset.set(0,0,0)),this.zoomToCursor&&this._performCursorZoom){let h=null;if(this.object.isPerspectiveCamera){const d=En.length();h=this._clampDistance(d*this._scale);const m=d-h;this.object.position.addScaledVector(this._dollyDirection,m),this.object.updateMatrixWorld(),f=!!m}else if(this.object.isOrthographicCamera){const d=new nt(this._mouse.x,this._mouse.y,0);d.unproject(this.object);const m=this.object.zoom;this.object.zoom=Math.max(this.minZoom,Math.min(this.maxZoom,this.object.zoom/this._scale)),this.object.updateProjectionMatrix(),f=m!==this.object.zoom;const p=new nt(this._mouse.x,this._mouse.y,0);p.unproject(this.object),this.object.position.sub(p).add(d),this.object.updateMatrixWorld(),h=En.length()}else console.warn("WARNING: OrbitControls.js encountered an unknown camera type - zoom to cursor disabled."),this.zoomToCursor=!1;h!==null&&(this.screenSpacePanning?this.target.set(0,0,-1).transformDirection(this.object.matrix).multiplyScalar(h).add(this.object.position):(wc.origin.copy(this.object.position),wc.direction.set(0,0,-1).transformDirection(this.object.matrix),Math.abs(this.object.up.dot(wc.direction))<Z3?this.object.lookAt(this.target):(Xx.setFromNormalAndCoplanarPoint(this.object.up,this.target),wc.intersectPlane(Xx,this.target))))}else if(this.object.isOrthographicCamera){const h=this.object.zoom;this.object.zoom=Math.max(this.minZoom,Math.min(this.maxZoom,this.object.zoom/this._scale)),h!==this.object.zoom&&(this.object.updateProjectionMatrix(),f=!0)}return this._scale=1,this._performCursorZoom=!1,f||this._lastPosition.distanceToSquared(this.object.position)>rp||8*(1-this._lastQuaternion.dot(this.object.quaternion))>rp||this._lastTargetPosition.distanceToSquared(this.target)>rp?(this.dispatchEvent(Vx),this._lastPosition.copy(this.object.position),this._lastQuaternion.copy(this.object.quaternion),this._lastTargetPosition.copy(this.target),!0):!1}_getAutoRotationAngle(e){return e!==null?ii/60*this.autoRotateSpeed*e:ii/60/60*this.autoRotateSpeed}_getZoomScale(e){const i=Math.abs(e*.01);return Math.pow(.95,this.zoomSpeed*i)}_rotateLeft(e){this._sphericalDelta.theta-=e}_rotateUp(e){this._sphericalDelta.phi-=e}_panLeft(e,i){En.setFromMatrixColumn(i,0),En.multiplyScalar(-e),this._panOffset.add(En)}_panUp(e,i){this.screenSpacePanning===!0?En.setFromMatrixColumn(i,1):(En.setFromMatrixColumn(i,0),En.crossVectors(this.object.up,En)),En.multiplyScalar(e),this._panOffset.add(En)}_pan(e,i){const s=this.domElement;if(this.object.isPerspectiveCamera){const l=this.object.position;En.copy(l).sub(this.target);let f=En.length();f*=Math.tan(this.object.fov/2*Math.PI/180),this._panLeft(2*e*f/s.clientHeight,this.object.matrix),this._panUp(2*i*f/s.clientHeight,this.object.matrix)}else this.object.isOrthographicCamera?(this._panLeft(e*(this.object.right-this.object.left)/this.object.zoom/s.clientWidth,this.object.matrix),this._panUp(i*(this.object.top-this.object.bottom)/this.object.zoom/s.clientHeight,this.object.matrix)):(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - pan disabled."),this.enablePan=!1)}_dollyOut(e){this.object.isPerspectiveCamera||this.object.isOrthographicCamera?this._scale/=e:(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),this.enableZoom=!1)}_dollyIn(e){this.object.isPerspectiveCamera||this.object.isOrthographicCamera?this._scale*=e:(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),this.enableZoom=!1)}_updateZoomParameters(e,i){if(!this.zoomToCursor)return;this._performCursorZoom=!0;const s=this.domElement.getBoundingClientRect(),l=e-s.left,f=i-s.top,h=s.width,d=s.height;this._mouse.x=l/h*2-1,this._mouse.y=-(f/d)*2+1,this._dollyDirection.set(this._mouse.x,this._mouse.y,1).unproject(this.object).sub(this.object.position).normalize()}_clampDistance(e){return Math.max(this.minDistance,Math.min(this.maxDistance,e))}_handleMouseDownRotate(e){this._rotateStart.set(e.clientX,e.clientY)}_handleMouseDownDolly(e){this._updateZoomParameters(e.clientX,e.clientX),this._dollyStart.set(e.clientX,e.clientY)}_handleMouseDownPan(e){this._panStart.set(e.clientX,e.clientY)}_handleMouseMoveRotate(e){this._rotateEnd.set(e.clientX,e.clientY),this._rotateDelta.subVectors(this._rotateEnd,this._rotateStart).multiplyScalar(this.rotateSpeed);const i=this.domElement;this._rotateLeft(ii*this._rotateDelta.x/i.clientHeight),this._rotateUp(ii*this._rotateDelta.y/i.clientHeight),this._rotateStart.copy(this._rotateEnd),this.update()}_handleMouseMoveDolly(e){this._dollyEnd.set(e.clientX,e.clientY),this._dollyDelta.subVectors(this._dollyEnd,this._dollyStart),this._dollyDelta.y>0?this._dollyOut(this._getZoomScale(this._dollyDelta.y)):this._dollyDelta.y<0&&this._dollyIn(this._getZoomScale(this._dollyDelta.y)),this._dollyStart.copy(this._dollyEnd),this.update()}_handleMouseMovePan(e){this._panEnd.set(e.clientX,e.clientY),this._panDelta.subVectors(this._panEnd,this._panStart).multiplyScalar(this.panSpeed),this._pan(this._panDelta.x,this._panDelta.y),this._panStart.copy(this._panEnd),this.update()}_handleMouseWheel(e){this._updateZoomParameters(e.clientX,e.clientY),e.deltaY<0?this._dollyIn(this._getZoomScale(e.deltaY)):e.deltaY>0&&this._dollyOut(this._getZoomScale(e.deltaY)),this.update()}_handleKeyDown(e){let i=!1;switch(e.code){case this.keys.UP:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateUp(ii*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(0,this.keyPanSpeed),i=!0;break;case this.keys.BOTTOM:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateUp(-ii*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(0,-this.keyPanSpeed),i=!0;break;case this.keys.LEFT:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateLeft(ii*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(this.keyPanSpeed,0),i=!0;break;case this.keys.RIGHT:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateLeft(-ii*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(-this.keyPanSpeed,0),i=!0;break}i&&(e.preventDefault(),this.update())}_handleTouchStartRotate(e){if(this._pointers.length===1)this._rotateStart.set(e.pageX,e.pageY);else{const i=this._getSecondPointerPosition(e),s=.5*(e.pageX+i.x),l=.5*(e.pageY+i.y);this._rotateStart.set(s,l)}}_handleTouchStartPan(e){if(this._pointers.length===1)this._panStart.set(e.pageX,e.pageY);else{const i=this._getSecondPointerPosition(e),s=.5*(e.pageX+i.x),l=.5*(e.pageY+i.y);this._panStart.set(s,l)}}_handleTouchStartDolly(e){const i=this._getSecondPointerPosition(e),s=e.pageX-i.x,l=e.pageY-i.y,f=Math.sqrt(s*s+l*l);this._dollyStart.set(0,f)}_handleTouchStartDollyPan(e){this.enableZoom&&this._handleTouchStartDolly(e),this.enablePan&&this._handleTouchStartPan(e)}_handleTouchStartDollyRotate(e){this.enableZoom&&this._handleTouchStartDolly(e),this.enableRotate&&this._handleTouchStartRotate(e)}_handleTouchMoveRotate(e){if(this._pointers.length==1)this._rotateEnd.set(e.pageX,e.pageY);else{const s=this._getSecondPointerPosition(e),l=.5*(e.pageX+s.x),f=.5*(e.pageY+s.y);this._rotateEnd.set(l,f)}this._rotateDelta.subVectors(this._rotateEnd,this._rotateStart).multiplyScalar(this.rotateSpeed);const i=this.domElement;this._rotateLeft(ii*this._rotateDelta.x/i.clientHeight),this._rotateUp(ii*this._rotateDelta.y/i.clientHeight),this._rotateStart.copy(this._rotateEnd)}_handleTouchMovePan(e){if(this._pointers.length===1)this._panEnd.set(e.pageX,e.pageY);else{const i=this._getSecondPointerPosition(e),s=.5*(e.pageX+i.x),l=.5*(e.pageY+i.y);this._panEnd.set(s,l)}this._panDelta.subVectors(this._panEnd,this._panStart).multiplyScalar(this.panSpeed),this._pan(this._panDelta.x,this._panDelta.y),this._panStart.copy(this._panEnd)}_handleTouchMoveDolly(e){const i=this._getSecondPointerPosition(e),s=e.pageX-i.x,l=e.pageY-i.y,f=Math.sqrt(s*s+l*l);this._dollyEnd.set(0,f),this._dollyDelta.set(0,Math.pow(this._dollyEnd.y/this._dollyStart.y,this.zoomSpeed)),this._dollyOut(this._dollyDelta.y),this._dollyStart.copy(this._dollyEnd);const h=(e.pageX+i.x)*.5,d=(e.pageY+i.y)*.5;this._updateZoomParameters(h,d)}_handleTouchMoveDollyPan(e){this.enableZoom&&this._handleTouchMoveDolly(e),this.enablePan&&this._handleTouchMovePan(e)}_handleTouchMoveDollyRotate(e){this.enableZoom&&this._handleTouchMoveDolly(e),this.enableRotate&&this._handleTouchMoveRotate(e)}_addPointer(e){this._pointers.push(e.pointerId)}_removePointer(e){delete this._pointerPositions[e.pointerId];for(let i=0;i<this._pointers.length;i++)if(this._pointers[i]==e.pointerId){this._pointers.splice(i,1);return}}_isTrackingPointer(e){for(let i=0;i<this._pointers.length;i++)if(this._pointers[i]==e.pointerId)return!0;return!1}_trackPointer(e){let i=this._pointerPositions[e.pointerId];i===void 0&&(i=new le,this._pointerPositions[e.pointerId]=i),i.set(e.pageX,e.pageY)}_getSecondPointerPosition(e){const i=e.pointerId===this._pointers[0]?this._pointers[1]:this._pointers[0];return this._pointerPositions[i]}_customWheelEvent(e){const i=e.deltaMode,s={clientX:e.clientX,clientY:e.clientY,deltaY:e.deltaY};switch(i){case 1:s.deltaY*=16;break;case 2:s.deltaY*=100;break}return e.ctrlKey&&!this._controlActive&&(s.deltaY*=10),s}}function K3(o){this.enabled!==!1&&(this._pointers.length===0&&(this.domElement.setPointerCapture(o.pointerId),this.domElement.ownerDocument.addEventListener("pointermove",this._onPointerMove),this.domElement.ownerDocument.addEventListener("pointerup",this._onPointerUp)),!this._isTrackingPointer(o)&&(this._addPointer(o),o.pointerType==="touch"?this._onTouchStart(o):this._onMouseDown(o),this._cursorStyle==="grab"&&(this.domElement.style.cursor="grabbing")))}function Q3(o){this.enabled!==!1&&(o.pointerType==="touch"?this._onTouchMove(o):this._onMouseMove(o))}function J3(o){switch(this._removePointer(o),this._pointers.length){case 0:this.domElement.releasePointerCapture(o.pointerId),this.domElement.ownerDocument.removeEventListener("pointermove",this._onPointerMove),this.domElement.ownerDocument.removeEventListener("pointerup",this._onPointerUp),this.dispatchEvent(wS),this.state=Ze.NONE,this._cursorStyle==="grab"&&(this.domElement.style.cursor="grab");break;case 1:const e=this._pointers[0],i=this._pointerPositions[e];this._onTouchStart({pointerId:e,pageX:i.x,pageY:i.y});break}}function $3(o){let e;switch(o.button){case 0:e=this.mouseButtons.LEFT;break;case 1:e=this.mouseButtons.MIDDLE;break;case 2:e=this.mouseButtons.RIGHT;break;default:e=-1}switch(e){case uo.DOLLY:if(this.enableZoom===!1)return;this._handleMouseDownDolly(o),this.state=Ze.DOLLY;break;case uo.ROTATE:if(o.ctrlKey||o.metaKey||o.shiftKey){if(this.enablePan===!1)return;this._handleMouseDownPan(o),this.state=Ze.PAN}else{if(this.enableRotate===!1)return;this._handleMouseDownRotate(o),this.state=Ze.ROTATE}break;case uo.PAN:if(o.ctrlKey||o.metaKey||o.shiftKey){if(this.enableRotate===!1)return;this._handleMouseDownRotate(o),this.state=Ze.ROTATE}else{if(this.enablePan===!1)return;this._handleMouseDownPan(o),this.state=Ze.PAN}break;default:this.state=Ze.NONE}this.state!==Ze.NONE&&this.dispatchEvent(Sm)}function tC(o){switch(this.state){case Ze.ROTATE:if(this.enableRotate===!1)return;this._handleMouseMoveRotate(o);break;case Ze.DOLLY:if(this.enableZoom===!1)return;this._handleMouseMoveDolly(o);break;case Ze.PAN:if(this.enablePan===!1)return;this._handleMouseMovePan(o);break}}function eC(o){this.enabled===!1||this.enableZoom===!1||this.state!==Ze.NONE||(o.preventDefault(),this.dispatchEvent(Sm),this._handleMouseWheel(this._customWheelEvent(o)),this.dispatchEvent(wS))}function nC(o){this.enabled!==!1&&this._handleKeyDown(o)}function iC(o){switch(this._trackPointer(o),this._pointers.length){case 1:switch(this.touches.ONE){case oo.ROTATE:if(this.enableRotate===!1)return;this._handleTouchStartRotate(o),this.state=Ze.TOUCH_ROTATE;break;case oo.PAN:if(this.enablePan===!1)return;this._handleTouchStartPan(o),this.state=Ze.TOUCH_PAN;break;default:this.state=Ze.NONE}break;case 2:switch(this.touches.TWO){case oo.DOLLY_PAN:if(this.enableZoom===!1&&this.enablePan===!1)return;this._handleTouchStartDollyPan(o),this.state=Ze.TOUCH_DOLLY_PAN;break;case oo.DOLLY_ROTATE:if(this.enableZoom===!1&&this.enableRotate===!1)return;this._handleTouchStartDollyRotate(o),this.state=Ze.TOUCH_DOLLY_ROTATE;break;default:this.state=Ze.NONE}break;default:this.state=Ze.NONE}this.state!==Ze.NONE&&this.dispatchEvent(Sm)}function aC(o){switch(this._trackPointer(o),this.state){case Ze.TOUCH_ROTATE:if(this.enableRotate===!1)return;this._handleTouchMoveRotate(o),this.update();break;case Ze.TOUCH_PAN:if(this.enablePan===!1)return;this._handleTouchMovePan(o),this.update();break;case Ze.TOUCH_DOLLY_PAN:if(this.enableZoom===!1&&this.enablePan===!1)return;this._handleTouchMoveDollyPan(o),this.update();break;case Ze.TOUCH_DOLLY_ROTATE:if(this.enableZoom===!1&&this.enableRotate===!1)return;this._handleTouchMoveDollyRotate(o),this.update();break;default:this.state=Ze.NONE}}function sC(o){this.enabled!==!1&&o.preventDefault()}function rC(o){o.key==="Control"&&(this._controlActive=!0,this.domElement.getRootNode().addEventListener("keyup",this._interceptControlUp,{passive:!0,capture:!0}))}function oC(o){o.key==="Control"&&(this._controlActive=!1,this.domElement.getRootNode().removeEventListener("keyup",this._interceptControlUp,{passive:!0,capture:!0}))}const lC="/assets/trak-tc820-machine-transparent-D7PwEI2F.png",uC=[{id:"monitor",label:"监控中心",icon:"⌁",badge:"实时"},{id:"workorder",label:"工单系统",icon:"□"},{id:"rag",label:"RAG知识问答",icon:"?"},{id:"quality",label:"质检系统",icon:"✓"}],Pc=[{id:"TRAK-TC820LTYSI-001",name:"TRAK-TC820LTYSI-001",line:"A线 · 主加工单元",type:"数控车削中心",x:50,y:39,live:!0,image:lC}],DS={critical:"关键规则",threshold:"阈值规则",duration:"持续规则",count:"计数规则",trend:"趋势规则",multi_metric:"多指标规则"},NS={normal:"正常",warning:"预警",alarm:"报警",fault:"故障",running:"运行中",stopped:"已停止",offline:"离线"},cC={normal:"正常",initial:"初级预警",intermediate:"中级报警",high:"高级故障"},kx={metric:"指标异常",temperature:"温度异常",vibration:"振动异常",alarm:"设备报警",status:"设备状态",trend:"趋势异常",multi_metric:"多指标联合异常"},fC={idle:"等待异常",running:"分析中",completed:"已完成",fallback:"备用诊断",failed:"执行失败"},hC={get_alarm_definition:"报警定义库"},dC={closed:"已关闭",open:"已打开",locked:"已锁定",unlocked:"未锁定",released:"已释放",pressed:"已按下",running:"运行中",stopped:"已停止",ready:"已就绪",clamped:"已夹紧",referenced:"已回零",inhibited:"已禁止",overtemperature:"温度过高",pressure_low:"压力不足",rotation_timeout:"旋转超时",clamp_pressure_low:"夹紧压力不足",not_in_position:"未到位",movement_error:"动作异常",alarm:"报警",overload:"过载",high_pressure_low:"高压不足",vibration_high:"振动过高"};async function op(o,e={}){const i=await fetch(o,{cache:"no-store",headers:{"Content-Type":"application/json"},...e}),s=await i.json();if(!i.ok)throw new Error(s.error||`请求失败：${i.status}`);return s}function ym(o){if(!o)return"--";const e=new Date(o);return Number.isNaN(e.getTime())?o:e.toLocaleTimeString("zh-CN",{hour12:!1})}function sr(o,e){return o[e]||e||"--"}function pC(o){return o==="fault"?"fault":o==="alarm"?"alarm":o==="warning"?"warning":"normal"}function US(o){return o==="high"?"fault":o==="intermediate"?"alarm":o==="initial"?"warning":"normal"}function mC(o){return o.kind==="multi_metric"?kx.multi_metric:o.label||kx[o.kind]||o.kind||"监测项"}function gC(){const[o,e]=ca.useState(null),[i,s]=ca.useState("");async function l(){try{e(await op("/api/monitor/snapshot")),s("")}catch(d){s(d.message)}}ca.useEffect(()=>{l();const d=window.setInterval(l,1e3);return()=>window.clearInterval(d)},[]);async function f(d){try{e(await op("/api/monitor/control",{method:"POST",body:JSON.stringify({action:d})})),s("")}catch(m){s(m.message)}}async function h(){try{e(await op("/api/monitor/reset",{method:"POST",body:"{}"})),s("")}catch(d){s(d.message)}}return{snapshot:o,error:i,control:f,resetStats:h}}function _C(){const[o,e]=ca.useState("monitor"),[i,s]=ca.useState(Pc[0].id),{snapshot:l,error:f,control:h,resetStats:d}=gC(),m=l?.runner||{},p=l?.latest_result,x=p?.current_sample,_=x?.health_score===null||x?.health_score===void 0?"--":`${Number(x.health_score).toFixed(0)} / 100`,v=f||m.last_error?"接口异常":"连接正常";return K.jsxs("div",{className:"platform-shell",children:[K.jsx(vC,{activeView:o,onChange:e,connectionText:v,hasError:!!(f||m.last_error)}),K.jsxs("main",{className:"app-shell",children:[K.jsx(xC,{snapshot:l,runner:m,onControl:h,onReset:d}),o==="monitor"&&K.jsx(SC,{snapshot:l,result:p,sample:x,runner:m,healthText:_,selectedMachineId:i,onSelectMachine:s}),o==="workorder"&&K.jsx(lp,{title:"工单系统"}),o==="rag"&&K.jsx(lp,{title:"RAG知识问答"}),o==="quality"&&K.jsx(lp,{title:"质检系统"}),(f||m.last_error)&&K.jsx("footer",{className:"error-bar",children:f||m.last_error})]})]})}function vC({activeView:o,onChange:e,connectionText:i,hasError:s}){return K.jsxs("aside",{className:"sidebar","aria-label":"平台导航",children:[K.jsxs("div",{className:"brand-block",children:[K.jsx("span",{className:"brand-mark",children:"IA"}),K.jsxs("div",{children:[K.jsx("strong",{children:"IND-Agent"}),K.jsx("span",{children:"工业智能平台"})]})]}),K.jsx("nav",{className:"side-nav",children:uC.map(l=>K.jsxs("button",{className:`nav-item ${o===l.id?"active":""}`,type:"button",onClick:()=>e(l.id),children:[K.jsx("span",{className:"nav-icon",children:l.icon}),K.jsx("span",{children:l.label}),l.badge&&K.jsx("em",{children:l.badge})]},l.id))}),K.jsxs("div",{className:"sidebar-card",children:[K.jsx("span",{children:"平台状态"}),K.jsx("strong",{className:s?"bad":"",children:i}),K.jsx("p",{children:"监控服务、诊断智能体和知识工具将统一汇入平台工作台。"})]})]})}function xC({snapshot:o,runner:e,onControl:i,onReset:s}){const l=`数据源：${o?.data_source||"设备数据源"} · ${o?.device_id||"--"} · 在线监测`;return K.jsxs("header",{className:"topbar",children:[K.jsxs("div",{children:[K.jsx("span",{className:"eyebrow",children:"工业运营中台"}),K.jsx("h1",{children:"智能制造统一工作台"}),K.jsx("p",{className:"subline",children:l})]}),K.jsxs("div",{className:"toolbar",children:[K.jsxs("label",{className:"switch-control",title:"开启或暂停自动监测",children:[K.jsx("input",{type:"checkbox",checked:!!e.enabled,onChange:f=>i(f.target.checked?"on":"off")}),K.jsx("span",{className:"switch-track",children:K.jsx("span",{className:"switch-thumb"})}),K.jsx("span",{children:e.enabled?"监测开启":"监测暂停"})]}),K.jsx("button",{className:"button",type:"button",onClick:s,children:"归零统计"})]})]})}function SC({snapshot:o,result:e,sample:i,runner:s,healthText:l,selectedMachineId:f,onSelectMachine:h}){const d=Pc.find(p=>p.id===f)||Pc[0],m=d.live;return K.jsxs("section",{className:"workspace-view active",children:[K.jsx(yC,{machines:Pc,selectedMachineId:d.id,result:e,sample:i,healthText:l,onSelectMachine:h}),K.jsx(TC,{machine:d,isLiveMachine:m,sample:i,result:e,healthText:l}),m?K.jsxs(K.Fragment,{children:[K.jsx(bC,{snapshot:o,sample:i,runner:s,healthText:l}),K.jsxs("section",{className:"main-grid",children:[K.jsx(AC,{result:e,sample:i}),K.jsx(DC,{snapshot:o,result:e})]}),K.jsxs("section",{className:"lower-grid",children:[K.jsx(UC,{snapshot:o}),K.jsx(LC,{snapshot:o})]})]}):K.jsxs("section",{className:"panel machine-empty-panel",children:[K.jsx("span",{className:"eyebrow",children:"设备详情"}),K.jsx("h2",{children:"该设备暂未接入实时采集"}),K.jsx("p",{children:"后续接入多设备监控接口后，这里会展示该机器的实时指标、规则判定和诊断结果。"})]})]})}function yC({machines:o,selectedMachineId:e,result:i,sample:s,healthText:l,onSelectMachine:f}){const h=i?.status&&i.status!=="normal"?1:0,d=o.find(p=>p.id===e)||o[0],m=LS(d,i);return K.jsxs("section",{className:"panel workshop-panel",children:[K.jsxs("div",{className:"factory-map","aria-label":"车间设备分布图",children:[K.jsx(MC,{status:m,onSelect:()=>f(d.id)}),K.jsxs("div",{className:"scene-overlay",children:[K.jsxs("div",{children:[K.jsx("span",{className:"eyebrow",children:"车间总览"}),K.jsx("h2",{children:"车间设备状态总览"})]}),K.jsxs("div",{className:"map-legend","aria-label":"状态图例",children:[K.jsxs("span",{children:[K.jsx("i",{className:"legend-dot normal"}),"正常"]}),K.jsxs("span",{children:[K.jsx("i",{className:"legend-dot warning"}),"预警"]}),K.jsxs("span",{children:[K.jsx("i",{className:"legend-dot fault"}),"故障"]})]})]}),K.jsxs("button",{type:"button",className:`scene-device-badge ${m}`,onClick:()=>f(d.id),"aria-label":`${d.name} ${Jp(m)}`,children:[K.jsx("strong",{children:d.name}),K.jsx("span",{children:Jp(m)})]}),K.jsx("div",{className:"scene-control-hint",children:"内部加工动画 · 拖动旋转 · 滚轮缩放"})]}),K.jsxs("div",{className:"map-summary",children:[K.jsxs("div",{children:[K.jsx("span",{children:"接入设备"}),K.jsx("strong",{children:"1 / 1"})]}),K.jsxs("div",{children:[K.jsx("span",{children:"当前工艺"}),K.jsx("strong",{children:"内部加工"})]}),K.jsxs("div",{children:[K.jsx("span",{children:"当前故障"}),K.jsx("strong",{children:h})]}),K.jsxs("div",{children:[K.jsx("span",{children:"毛坯入料"}),K.jsx("strong",{children:"棒料"})]}),K.jsxs("div",{children:[K.jsx("span",{children:"成品出料"}),K.jsx("strong",{children:"轴套件"})]})]})]})}function LS(o,e){return o.live?e?.status==="fault"?"fault":e?.status==="alarm"?"alarm":e?.status==="warning"?"warning":"normal":"idle"}function Jp(o){return o==="fault"?"故障":o==="alarm"?"报警":o==="warning"?"预警":o==="idle"?"未接入":"正常"}function MC({status:o,onSelect:e}){const i=ca.useRef(null),s=ca.useRef(e);return ca.useEffect(()=>{s.current=e},[e]),ca.useEffect(()=>{const l=i.current;if(!l)return;const f=new MT;f.fog=new cm(15988468,14,32);const h=new vi(36,l.clientWidth/l.clientHeight,.1,100);h.position.set(7.8,4.6,8.8),h.lookAt(0,.75,0);const d=new q3({antialias:!0,alpha:!0,preserveDrawingBuffer:!0});d.setPixelRatio(Math.min(window.devicePixelRatio,2)),d.setSize(l.clientWidth,l.clientHeight),d.shadowMap.enabled=!0,d.shadowMap.type=Tl,l.appendChild(d.domElement);const m=new j3(h,d.domElement);m.target.set(0,.75,0),m.enableDamping=!0,m.dampingFactor=.08,m.minDistance=6.2,m.maxDistance=15.5,m.minPolarAngle=Math.PI*.16,m.maxPolarAngle=Math.PI*.49,m.enablePan=!0,m.panSpeed=.55,m.rotateSpeed=.55,m.zoomSpeed=.72,m.update();const p=EC(o),x=new pn({color:15002858,roughness:.84,metalness:.02}),_=new pn({color:12899280,roughness:.78,metalness:.01}),v=new pn({color:14741998,roughness:.82,metalness:.02,transparent:!0,opacity:.58}),M=new pn({color:14148063,roughness:.86,metalness:.02,transparent:!0,opacity:.72}),R=new pn({color:14262811,roughness:.58,metalness:.04}),w=new pn({color:4214871,roughness:.6,metalness:.18}),y=new pn({color:p,roughness:.42,metalness:.1,emissive:p,emissiveIntensity:.12,transparent:!0,opacity:.82}),S=new pn({color:6582647,roughness:.72,metalness:.08}),O=new pn({color:2831160,roughness:.75,metalness:.05}),G=new pn({color:6910328,roughness:.62,metalness:.18,transparent:!0,opacity:.64}),C=new pn({color:6910328,roughness:.62,metalness:.18}),D=new pn({color:2238253,roughness:.7,metalness:.2,transparent:!0,opacity:.86}),N=new pn({color:12172994,roughness:.55,metalness:.12,transparent:!0,opacity:.68}),P=new pn({color:9417916,roughness:.2,metalness:.04,transparent:!0,opacity:.24,side:Li}),T=new pn({color:p,roughness:.42,metalness:.12,emissive:p,emissiveIntensity:.08}),U=new pn({color:p,transparent:!0,opacity:.45,roughness:.6,metalness:.05,side:Li}),F=new pn({color:9805989,roughness:.52,metalness:.28}),V=new pn({color:4805722,roughness:.36,metalness:.45}),Q=new pn({color:12026410,roughness:.42,metalness:.22,emissive:3810048,emissiveIntensity:.05}),st=new pn({color:13357783,roughness:.32,metalness:.72}),Y=new pn({color:4345945,roughness:.28,metalness:.78}),tt=new pn({color:13673276,roughness:.5,metalness:.38,emissive:5912576,emissiveIntensity:.06}),W=new pm({color:2503224,transparent:!0,opacity:.42}),q=new hm({color:p,transparent:!0,opacity:.22,side:Li,depthWrite:!1}),dt=new ze(new po(26,16),x);dt.rotation.x=-Math.PI/2,dt.position.y=-.36,dt.receiveShadow=!0,f.add(dt);const ct=new ZT(26,26,10401974,13359575);ct.position.y=-.34,f.add(ct);const rt=(mt,Ct,yt,At=[0,0,0])=>{const Lt=new ze(new _i(...mt),yt);return Lt.position.set(...Ct),Lt.rotation.set(...At),Lt.castShadow=!0,Lt.receiveShadow=!0,f.add(Lt),Lt};rt([26,2.6,.08],[0,.92,-7.2],M),rt([.08,2.25,12.5],[-12.3,.78,-.6],M),rt([.08,2.25,12.5],[12.3,.78,-.6],M),rt([24,.08,.12],[0,2.32,-6.95],O),rt([.12,.08,12],[-11.5,2.16,-.8],O),rt([.12,.08,12],[11.5,2.16,-.8],O),rt([20,.035,1.45],[0,-.31,3.25],_),rt([1.5,.035,10.5],[-5.2,-.3,-.9],_),rt([6.6,.045,3.8],[0,-.28,.05],v),rt([6.8,.03,.08],[0,-.235,2],R),rt([6.8,.03,.08],[0,-.235,-1.95],R),rt([.08,.03,3.95],[-3.4,-.235,.02],R),rt([.08,.03,3.95],[3.4,-.235,.02],R);const bt=(mt,Ct,yt=[0,0,0])=>{rt(mt,Ct,w,yt),rt([mt[0],.035,.08],[Ct[0],Ct[1]+.06,Ct[2]-mt[2]/2],y,yt),rt([mt[0],.035,.08],[Ct[0],Ct[1]+.06,Ct[2]+mt[2]/2],y,yt)};bt([3.25,.13,.52],[-4.35,-.08,1.05]),bt([3.35,.13,.52],[4.35,-.08,1.05]);for(let mt=0;mt<7;mt+=1){const Ct=new ze(new Zn(.045,.045,.62,16),V);Ct.position.set(-5.75+mt*.46,.03,1.05),Ct.rotation.x=Math.PI/2,f.add(Ct);const yt=Ct.clone();yt.material=V,yt.position.x=3+mt*.46,f.add(yt)}rt([1.45,.42,.75],[-6.15,-.08,-4.95],S),rt([1.55,.13,.85],[-6.15,.22,-4.95],O),rt([1.35,.38,.72],[6.05,-.08,-4.8],S),rt([1.45,.12,.82],[6.05,.18,-4.8],O);for(let mt=0;mt<10;mt+=1){const Ct=mt%2===0?-10.8:10.8,yt=-5.7+Math.floor(mt/2)*2.8,At=new ze(new Zn(.06,.06,2.6,12),S);At.position.set(Ct,.92,yt),At.castShadow=!0,f.add(At)}const Gt=new la;Gt.position.set(.05,-.1,-.08),Gt.rotation.y=-.28,Gt.scale.set(.82,.82,.82),f.add(Gt);const Ot=(mt,Ct,yt,At,Lt=[0,0,0])=>{const Qt=new ze(new _i(...Ct),At);Qt.name=mt,Qt.position.set(...yt),Qt.rotation.set(...Lt),Qt.castShadow=!0,Qt.receiveShadow=!0,Gt.add(Qt);const ae=new mS(new OT(Qt.geometry),W);return ae.position.copy(Qt.position),ae.rotation.copy(Qt.rotation),ae.scale.copy(Qt.scale),Gt.add(ae),Qt};Ot("machine-base",[4.65,.52,1.68],[0,.28,0],D),Ot("left-headstock-cabinet",[1.08,1.88,1.66],[-1.78,1.4,0],D),Ot("transparent-main-shell",[3.35,1.78,1.58],[-.15,1.4,0],G),Ot("rear-column",[.45,1.95,1.58],[-2.2,1.44,0],C),Ot("front-glass-door",[1.78,1.22,.06],[-.72,1.42,.84],P),Ot("right-slanted-cover",[.86,1.56,1.5],[1.32,1.38,.04],G,[0,0,-.18]),Ot("control-panel",[.45,1.22,.18],[1.98,1.5,.78],D,[0,0,-.24]),Ot("top-service-rail",[3.12,.16,1.34],[-.24,2.28,0],D),Ot("status-strip",[1.82,.06,.08],[-.42,2.39,.7],T),Ot("chip-conveyor-neck",[1.12,.28,.34],[2.38,1,.22],D,[0,0,.4]),Ot("chip-bin",[.7,.58,.7],[3,.76,.22],G),Ot("front-service-panel",[2.68,.5,.08],[-.36,.58,.86],N),Ot("left-foot",[.25,.5,.22],[-1.85,-.02,.56],D),Ot("right-foot",[.25,.5,.22],[1.55,-.02,.56],D),Ot("inner-bed",[2.45,.18,.46],[-.35,1.02,.4],F),Ot("linear-guide-left",[2.35,.055,.055],[-.32,1.16,.22],V),Ot("linear-guide-right",[2.35,.055,.055],[-.32,1.16,.58],V),Ot("tailstock-shadow",[.42,.44,.5],[.9,1.26,.38],F);const z=new la;z.name="spindleChuck",z.position.set(-1.12,1.36,.78),Gt.add(z);const _t=new ze(new Zn(.29,.29,.22,48),V);_t.rotation.z=Math.PI/2,_t.castShadow=!0,z.add(_t);const Nt=new ze(new Zn(.22,.22,.04,48),T);Nt.position.x=.13,Nt.rotation.z=Math.PI/2,z.add(Nt);for(let mt=0;mt<3;mt+=1){const Ct=mt*(Math.PI*2/3),yt=new ze(new _i(.16,.06,.24),Y);yt.position.set(.17,Math.cos(Ct)*.16,Math.sin(Ct)*.16),yt.rotation.x=Ct,yt.castShadow=!0,z.add(yt)}const Z=new ze(new Zn(.13,.13,.88,48),st);Z.name="machiningWorkpiece",Z.position.x=.48,Z.rotation.z=Math.PI/2,Z.castShadow=!0,z.add(Z);const ft=new la;ft.name="toolSlide",ft.position.set(.32,1.27,.55),Gt.add(ft);const wt=new ze(new _i(.56,.34,.42),F);wt.castShadow=!0,ft.add(wt);const Pt=new ze(new Zn(.22,.22,.25,8),V);Pt.rotation.x=Math.PI/2,Pt.position.set(-.05,.08,.24),Pt.castShadow=!0,ft.add(Pt);const vt=new ze(new gm(.06,.34,4),Y);vt.name="cutterTip",vt.position.set(-.33,.08,.24),vt.rotation.z=Math.PI/2,vt.rotation.y=Math.PI/4,vt.castShadow=!0,ft.add(vt);const Ut=new kT(16760922,.9,1.3);Ut.name="cuttingGlow",Ut.position.set(-.45,.08,.24),ft.add(Ut);const Te=new la;Te.name="loadingArm",Te.position.set(-2.02,1.62,.62),Gt.add(Te);const ce=new ze(new _i(.08,.72,.08),V);ce.castShadow=!0,Te.add(ce);const pe=new ze(new _i(.08,.08,.38),Y);pe.position.set(.18,-.33,.12),Te.add(pe);const _e=pe.clone();_e.position.z=-.12,Te.add(_e);const ee=new ze(new Zn(.08,.08,.25,24),T);ee.position.set(-1.72,2.68,0),ee.castShadow=!0,Gt.add(ee);const ne=new ze(new po(4.8,2.7),q);ne.position.set(-2.05,1.28,.02),ne.rotation.y=Math.PI/2,Gt.add(ne);const Be=mt=>{const Ct=new la;Ct.userData.offset=mt,Ct.name="rawBarStock";const yt=new ze(new Zn(.11,.11,.66,32),Q);yt.rotation.z=Math.PI/2,yt.castShadow=!0,Ct.add(yt);const At=new ze(new Zn(.115,.115,.025,32),D);return At.position.x=-.35,At.rotation.z=Math.PI/2,Ct.add(At),f.add(Ct),Ct},sn=mt=>{const Ct=new la;Ct.userData.offset=mt,Ct.name="finishedParts";const yt=new ze(new Zn(.095,.095,.48,40),st);yt.rotation.z=Math.PI/2,yt.castShadow=!0,Ct.add(yt);const At=new ze(new Zn(.14,.14,.14,40),st);At.position.x=-.16,At.rotation.z=Math.PI/2,At.castShadow=!0,Ct.add(At);const Lt=new ze(new Zn(.042,.042,.5,24),D);return Lt.rotation.z=Math.PI/2,Lt.scale.set(1,1,1),Ct.add(Lt),f.add(Ct),Ct},Pe=[Be(0),Be(.48)],Je=[sn(.1),sn(.62)],X=Array.from({length:18},(mt,Ct)=>{const yt=new ze(new _i(.055,.018,.018),tt);return yt.userData.offset=Ct/18,yt.castShadow=!0,Gt.add(yt),yt}),je=new ze(new mm(2.55,72),U);je.rotation.x=-Math.PI/2,je.position.set(.15,-.27,.15),je.receiveShadow=!0,f.add(je);const Ee=new ze(new _i(.22,1.45,.07),U);Ee.position.set(.8,1.62,-1.55),Ee.rotation.y=-.18,Ee.castShadow=!0,f.add(Ee);const L=new ze(new _m(.13,24,16),T);L.position.set(.8,2.42,-1.55),L.castShadow=!0,f.add(L);const E=new VT(16777215,12109257,1.4);f.add(E);const et=new gx(16777215,2.3);et.position.set(3,5,4),et.castShadow=!0,f.add(et);const at=new gx(p,.9);at.position.set(-3,2.5,-2),f.add(at);let gt=0;const Dt=()=>{gt=window.requestAnimationFrame(Dt);const mt=performance.now()*.001,Ct=(Math.sin(mt*1.05)+1)/2;z.rotation.x=mt*8.6,Z.rotation.x=mt*14,ft.position.x=.22+Math.sin(mt*.92)*.22,ft.position.z=.48+Math.sin(mt*1.45)*.08,Pt.rotation.z=mt*.65,Ut.intensity=.45+Math.abs(Math.sin(mt*5.4))*.85,vt.material.emissive=new Me(16747818),vt.material.emissiveIntensity=.08+Ct*.18,Te.rotation.z=Math.sin(mt*1.2)*.18,ne.position.x=-2.1+mt*.35%4.2,ne.material.opacity=.12+Math.sin(mt*2.2)*.05,Pe.forEach(yt=>{const At=(mt*.16+yt.userData.offset)%1;yt.position.set(-5.78+At*2.45,.08,1.05),yt.rotation.x=mt*2.5}),Je.forEach(yt=>{const At=(mt*.15+yt.userData.offset)%1;yt.position.set(2.86+At*2.65,.08,1.05),yt.rotation.x=mt*3.4,yt.rotation.y=Math.sin(mt*1.6+yt.userData.offset)*.08}),X.forEach(yt=>{const At=(mt*1.4+yt.userData.offset)%1;yt.position.set(-.18+At*.7,1.35-At*.45+Math.sin(At*Math.PI*4)*.035,.8+At*.28),yt.rotation.set(mt*4+At,mt*2.3,At*6),yt.material.opacity=1-At*.7}),ee.material.emissiveIntensity=.12+Math.abs(Math.sin(mt*3.2))*.36,L.material.emissiveIntensity=.12+Math.abs(Math.sin(mt*3.2))*.36,m.update(),d.render(f,h)};Dt();const It=()=>{!l.clientWidth||!l.clientHeight||(h.aspect=l.clientWidth/l.clientHeight,h.updateProjectionMatrix(),d.setSize(l.clientWidth,l.clientHeight))},xt=new ResizeObserver(It);xt.observe(l);const St=()=>s.current();return d.domElement.addEventListener("click",St),()=>{window.cancelAnimationFrame(gt),xt.disconnect(),d.domElement.removeEventListener("click",St),l.removeChild(d.domElement),f.traverse(mt=>{mt.geometry&&mt.geometry.dispose(),mt.material&&(Array.isArray(mt.material)?mt.material.forEach(Ct=>Ct.dispose()):mt.material.dispose())}),m.dispose(),d.dispose()}},[o]),K.jsx("div",{ref:i,className:"machine-3d-canvas","aria-hidden":"true"})}function EC(o){return o==="fault"?12007218:o==="alarm"||o==="warning"?11954688:o==="idle"?8227987:556917}function TC({machine:o,isLiveMachine:e,sample:i,result:s,healthText:l}){const f=e?LS(o,s):"idle";return K.jsxs("section",{className:"machine-detail-header",children:[K.jsxs("div",{children:[K.jsx("span",{className:"eyebrow",children:"设备详情"}),K.jsxs("h2",{children:[o.name," · ",o.type]}),K.jsxs("p",{children:[o.line," · ",e&&i?.device_id||o.id]})]}),K.jsxs("div",{className:"machine-detail-stats",children:[K.jsxs("div",{children:[K.jsx("span",{children:"状态"}),K.jsx("strong",{className:f,children:Jp(f)})]}),K.jsxs("div",{children:[K.jsx("span",{children:"告警"}),K.jsx("strong",{children:e?i?.alarm_code||"无":"--"})]}),K.jsxs("div",{children:[K.jsx("span",{children:"健康度"}),K.jsx("strong",{children:e?l:"--"})]})]})]})}function bC({snapshot:o,sample:e,runner:i,healthText:s}){const l=[["监测状态",i.enabled?"开启":"暂停"],["设备状态",sr(NS,e?.status)],["当前告警",e?.alarm_code||"无"],["采样次数",o?.result_count??"--"],["告警事件次数",o?.alarm_event_count??"--"],["Agent诊断任务",o?.diagnosis_task_count??"--"],["采样周期",i.interval_seconds?`${i.interval_seconds} 秒/次`:"--"],["整机健康度",s]];return K.jsx("section",{className:"status-strip","aria-label":"运行状态",children:l.map(([f,h])=>K.jsxs("div",{className:"status-item",children:[K.jsx("span",{children:f}),K.jsx("strong",{children:h})]},f))})}function AC({result:o,sample:e}){const i=ca.useMemo(()=>RC(o,e),[o,e]);return K.jsxs("section",{className:"panel metrics-panel",children:[K.jsxs("div",{className:"panel-heading",children:[K.jsxs("div",{children:[K.jsx("span",{className:"eyebrow",children:"实时快照"}),K.jsx("h2",{children:"实时指标"})]}),K.jsx("span",{className:"muted",children:e?`最近采样 ${ym(e.timestamp)}`:"等待采样"})]}),K.jsx("div",{className:"metrics-grid",children:i.map(s=>K.jsx(CC,{item:s,result:o},s.key))}),(e?.vibration===null||e?.vibration===void 0)&&K.jsx("div",{className:"notice",children:"当前设备数据源没有提供振动字段，振动不会被其他指标替代；其他设备指标仍会继续监测。"}),K.jsxs("div",{className:"subsection-heading",children:[K.jsx("span",{className:"eyebrow",children:"设备联锁与执行部件"}),K.jsx("strong",{children:"整机状态"})]}),K.jsx(wC,{sample:e})]})}function RC(o,e){const i=e?.metrics||{},s=e?.metric_details||{},l=Object.entries(s).map(([f,h])=>({key:f,name:h.label||f,group:h.group||"整机",value:i[f],unit:h.unit||"",normalRange:h.normal_range}));return l.length?l:[{key:"temperature",name:"温度",group:"主轴",value:e?.temperature,unit:"C"},{key:"vibration",name:"振动",group:"主轴",value:e?.vibration,unit:"mm/s"},{key:"rpm",name:"转速",group:"主轴",value:e?.rpm,unit:"rpm"}]}function CC({item:o,result:e}){const i=e?.observations?.find(h=>h.key===`metric:${o.key}`||h.key===o.key||o.key==="spindle_temperature_c"&&h.key==="temperature"||o.key==="spindle_vibration_rms"&&h.key==="vibration"),s=US(i?.alert_level),l=o.value===null||o.value===void 0?"未提供":`${Number(o.value).toFixed(1)}`,f=o.normalRange?`正常 ${o.normalRange[0]} - ${o.normalRange[1]}`:"";return K.jsxs("div",{className:`metric ${s}`,children:[K.jsx("span",{className:"metric-group",children:o.group}),K.jsx("span",{className:"metric-name",children:o.name}),K.jsx("strong",{className:"metric-value",children:l}),K.jsxs("span",{className:"metric-unit",children:[o.unit," ",f]})]})}function wC({sample:o}){const e=Object.values(o?.equipment_states||{});return e.length?K.jsx("div",{className:"equipment-grid",children:e.map((i,s)=>K.jsxs("div",{className:`equipment-state ${i.is_normal?"normal":"fault"}`,children:[K.jsx("span",{children:i.label||"设备状态"}),K.jsx("strong",{children:sr(dC,i.value)})]},`${i.label||"state"}-${s}`))}):K.jsx("div",{className:"equipment-grid",children:K.jsx("div",{className:"empty-state",children:"当前接口没有提供离散设备状态"})})}function DC({result:o}){const e=o?.status||"normal";return K.jsxs("section",{className:"panel decision-panel",children:[K.jsxs("div",{className:"panel-heading",children:[K.jsxs("div",{children:[K.jsx("span",{className:"eyebrow",children:"监测判定"}),K.jsx("h2",{children:"规则引擎"})]}),K.jsx("span",{className:`severity-pill ${pC(e)}`,children:sr(NS,e)})]}),K.jsx(NC,{observations:o?.observations||[]}),K.jsxs("div",{className:"threshold-note",children:[K.jsx("span",{children:"触发条件"}),K.jsx("strong",{children:"关键故障立即触发；普通指标阈值+5秒；间歇故障5分钟内3次；趋势/联合异常"})]})]})}function NC({observations:o}){return o.length?K.jsx("div",{className:"observation-list",children:o.map((e,i)=>{const s=US(e.alert_level);return K.jsxs("div",{className:"observation",children:[K.jsx("span",{className:`observation-dot ${s}`}),K.jsxs("div",{children:[K.jsxs("div",{className:"observation-title",children:[sr(DS,e.rule_type)," · ",mC(e),"：",e.value]}),K.jsxs("div",{className:"observation-meta",children:[e.message," · 阈值 ",e.threshold??"-"," ",e.unit||""]})]}),K.jsx("span",{className:"observation-level",children:sr(cC,e.alert_level)})]},`${e.key||e.kind}-${i}`)})}):K.jsx("div",{className:"observation-list",children:K.jsx("div",{className:"empty-state",children:"当前没有检测到异常"})})}function UC({snapshot:o}){const e=o?.trigger_history||[];return K.jsxs("section",{className:"panel trigger-panel",children:[K.jsxs("div",{className:"panel-heading",children:[K.jsxs("div",{children:[K.jsx("span",{className:"eyebrow",children:"诊断移交"}),K.jsx("h2",{children:"诊断触发记录"})]}),K.jsx("span",{className:"muted",children:"只记录监测器已确认的触发事件"})]}),K.jsxs("div",{className:"trigger-list",children:[!e.length&&K.jsx("div",{className:"empty-state",children:"暂无触发记录"}),e.map((i,s)=>K.jsxs("div",{className:"trigger-row",children:[K.jsx("span",{className:"trigger-time",children:ym(i.triggered_at)}),K.jsx("span",{className:"trigger-device",children:i.device_id}),K.jsx("span",{className:"trigger-rules",children:i.event_id||i.abnormal_event?.event_id||"--"}),K.jsxs("span",{className:"trigger-reason",children:[i.trigger_cause||"首次确认异常"," · ",i.task_id||"--"," · ",(i.rule_types||[]).map(l=>DS[l]||l).join("、")]})]},`${i.task_id||i.event_id||s}`))]})]})}function LC({snapshot:o}){const e=o?.diagnosis?.latest||{},i=e.status||"idle",s=i==="failed"?"fault":i==="fallback"?"warning":"normal";return K.jsxs("section",{className:"panel diagnosis-panel",children:[K.jsxs("div",{className:"panel-heading",children:[K.jsxs("div",{children:[K.jsx("span",{className:"eyebrow",children:"智能诊断"}),K.jsx("h2",{children:"诊断结果"})]}),K.jsx("span",{className:`severity-pill ${s}`,children:sr(fC,i)})]}),K.jsx(OC,{latest:e})]})}function OC({latest:o}){if(!o||o.status==="idle")return K.jsx("div",{className:"diagnosis-result",children:K.jsx("div",{className:"empty-state",children:"满足触发条件后自动生成诊断结果"})});const e=o.confidence===null||o.confidence===void 0?"--":`${(Number(o.confidence)*100).toFixed(0)}%`,i=o.alarm_definition||{},s=(o.tool_calls||[]).map(f=>sr(hC,f.name)).join("、")||"等待诊断依据",l=[["设备",o.device_id||"--"],["诊断任务",o.task_id||"--"],["异常事件",o.event_id||"--"],["事件轮次",`第 ${o.event_revision||1} 次`],["触发时间",ym(o.triggered_at)],["报警定义",i.name||"未查询到"],["置信度",e],["诊断依据",s]];return K.jsxs("div",{className:"diagnosis-result",children:[K.jsx("div",{className:"diagnosis-summary",children:o.summary||"正在生成诊断结果"}),K.jsx("div",{className:"diagnosis-grid",children:l.map(([f,h])=>K.jsxs("div",{children:[K.jsx("span",{children:f}),K.jsx("strong",{children:h})]},f))}),K.jsxs("div",{className:"diagnosis-detail",children:[K.jsx("span",{children:"诊断说明"}),K.jsx("p",{children:o.diagnosis||"暂无详细诊断"})]}),o.error&&K.jsx("div",{className:"diagnosis-error",children:o.error})]})}function lp({title:o}){return K.jsx("section",{className:"workspace-view active pending-view","aria-label":o,children:K.jsxs("div",{className:"pending-board",children:[K.jsx("span",{className:"eyebrow",children:o}),K.jsx("h2",{children:"待开发~"})]})})}ME.createRoot(document.getElementById("root")).render(K.jsx(_C,{}));
