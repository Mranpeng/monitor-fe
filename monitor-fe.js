/*!
 * monitor-fe.js v1.2.0
 * (c) 2021 fangyuan <735512174@qq.com>
 * Released under the MIT License.
 */
!function(e,o){"object"==typeof exports&&"undefined"!=typeof module?module.exports=o():"function"==typeof define&&define.amd?define(o):e["monitor-fe"]=o()}(this,function(){"use strict";var e=function(e,o){if(!(e instanceof o))throw new TypeError("Cannot call a class as a function")},o=function(){function e(e,o){for(var t=0;t<o.length;t++){var r=o[t];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(e,r.key,r)}}return function(o,t,r){return t&&e(o.prototype,t),r&&e(o,r),o}}(),t="undefined"!=typeof process&&process?require("vue"):null,r="undefined"!=typeof process&&process?require("axios"):null,s=require("./utils.js");return function(){function n(o){return e(this,n),this.utils=new s,this.baseOptions={systemName:"",reportUrl:"",delayTime:1e4,whiteList:[],userId:"",shopId:""},this.options={},this.setOption(o),this.options.systemName?this.options.reportUrl?(this.cacheQuene=[],void this.__init()):void console.warn("前端监控器缺少reportUrl参数，无法运行，请检查！"):void console.warn("前端监控器缺少systemName参数，无法运行，请检查！")}return o(n,[{key:"setOption",value:function(e){if(!this.utils.isObject(e))return void console.warn("前端监控器初始化参数格式错误,请检查!");this.options=Object.assign({},this.baseOptions,this.options,e)}},{key:"__init",value:function(){this.__getBrowserInfo(),this.__initQuene(),this.__vueError(),this.__consoleError(),this.__promiseError()}},{key:"__initQuene",value:function(){var e=this;setInterval(function(){e.__removeDuplicate(e.cacheQuene).forEach(function(o){e.__send(o)}),e.cacheQuene=[]},this.options.delayTime)}},{key:"__removeDuplicate",value:function(e){for(var o=[],t=0,r=e.length;t<r;t++){for(var s=t+1;s<r;s++)e[t].errorMessage===e[s].errorMessage&&(s=++t);o.push(e[t])}return o}},{key:"__report",value:function(e,o,t){for(var r=0;r<this.options.whiteList.length;r++)if(o.includes(this.options.whiteList[r]))return;this.cacheQuene.push({pageUrl:this.options.pageUrl||("undefined"!=typeof window?window.location.href:""),systemName:this.options.systemName,errorType:e+", "+this.utils.formatDate(new Date,"yyyy-MM-dd hh:mm:ss"),userAgent:this.userAgent,userId:this.options.userId,shopId:this.options.shopId,requestInfo:t||{},errorMessage:o})}},{key:"__send",value:function(e){if(this.options.ajax)return void this.options.ajax(e);r?r.post(this.options.reportUrl,e):console.warn("axios不存在")}},{key:"emit",value:function(e){var o=e.type,t=e.error;if(!o)return void console.warn("未定义错误类型");if("httpError"===o){var r=this.__httpError(t);this.__report(o,this.__createMessage({error:t}),r)}else this.__report(o,this.__createMessage({error:t}))}},{key:"__createMessage",value:function(e){var o=e.componentInfo,t=e.error,r="";this.utils.isErrorObj(t)?r=t.stack?t.stack.toString():t.message?t.message:t||"未知错误":this.utils.isString(t)?r=t:this.utils.isAxiosResponseObj(t)&&(r="code:"+(t.data.code||"--")+",msg:"+t.data.msg+",status:"+t.data.status),o&&(r="[componentInfo]: "+o+", "+r);var s={};for(var n in this.options)Object.keys(this.baseOptions).includes(n)||(s[n]=this.options[n]);return Object.keys(s).length>0&&(r+=", "+JSON.stringify(s)),console.log("!!!monitorError: "+r),r}},{key:"__vueError",value:function(){var e=this;if(!t)return void console.warn("Vue不存在!");(t.default||t).config.errorHandler=function(o,t,r){var s=t._isVue?t.$options.__file||t.$options.name||t.$options._componentTag:t.name;e.__report("vueError",e.__createMessage({componentInfo:s||"",error:o}))}}},{key:"__consoleError",value:function(){if("undefined"!=typeof window&&window.console&&window.console.error){var e=this,o=window.console.error;window.console.error=function(t){e.__report("consoleError",e.__createMessage({error:t})),o&&o.apply(window,arguments)}}}},{key:"__promiseError",value:function(){var e=this;"undefined"!=typeof window&&window.addEventListener("unhandledrejection",function(o){e.__report("promiseError",e.__createMessage({error:o.reason}))})}},{key:"__httpError",value:function(e){var o={};if(!e.config)return o;if(o={url:e.request&&e.request.responseURL?e.request.responseURL:"",method:e.config.method},"post"===e.config.method.toLowerCase()&&e.config.data){var t={};if(this.utils.isString(e.config.data)){var r=decodeURI(e.config.data);t=r.includes("json=")?JSON.parse(r.split("json=")[1]):JSON.parse(r)}else this.utils.isObject(e.config.data)&&(t=e.config.data);o.data=t}return"get"===e.config.method.toLowerCase()&&e.config.params&&(this.utils.isString(e.config.params)?o.params=JSON.parse(e.config.params):this.utils.isObject(e.config.data)&&(o.params=e.config.params)),o.headers=e.config.headers,o}},{key:"__getBrowserInfo",value:function(){if(this.options.getUserAgent)return void(this.userAgent=this.options.getUserAgent());var e={msie:!1,firefox:!1,opera:!1,safari:!1,chrome:!1,netscape:!1,name:"unknown",version:0};if("undefined"!=typeof window){var o=window.navigator.userAgent.toLowerCase();/(msie|firefox|opera|chrome|netscape)\D+(\d[\d.]*)/.test(o)?(e[RegExp.$1]=!0,e.name=RegExp.$1,e.version=RegExp.$2):/version\D+(\d[\d.]*).*safari/.test(o)&&(e.safari=!0,e.name="safari",e.version=RegExp.$2),this.userAgent=e.name+"-"+e.version}}}]),n}()});
