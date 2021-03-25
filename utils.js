/*!
 * monitor-fe.js v1.3.0
 * (c) 2021 fangyuan <735512174@qq.com>
 * Released under the MIT License.
 */
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global['monitor-fe'] = factory());
}(this, (function () { 'use strict';

var classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

var createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
}();

/**
 *工具箱
 *
 * @class Utils
 */
var Utils = function () {
  function Utils() {
    classCallCheck(this, Utils);
  }

  /**
   * 是否是错误对象
   *
   * @return {*} 
   * @memberof WebMonitor
   */


  createClass(Utils, [{
    key: 'isErrorObj',
    value: function isErrorObj(data) {
      return Object.prototype.toString.call(data) === '[object Error]';
    }

    /**
     * 是否是字符串
     *
     * @return {*} 
     * @memberof WebMonitor
     */

  }, {
    key: 'isString',
    value: function isString(data) {
      return typeof data === 'string';
    }

    /**
     * 是否是axios response对象
     *
     * @return {*} 
     * @memberof WebMonitor
     */

  }, {
    key: 'isAxiosResponseObj',
    value: function isAxiosResponseObj(data) {
      return !!(Object.prototype.toString.call(data) === '[object Object]' && data.request && data.headers && data.config);
    }

    /**
     * 是否是对象
     *
     * @memberof WebMonitor
     */

  }, {
    key: 'isObject',
    value: function isObject(data) {
      return Object.prototype.toString.call(data) === '[object Object]';
    }

    /**
     * 是否是正则对象
     *
     * @memberof WebMonitor
     */

  }, {
    key: 'isRegExp',
    value: function isRegExp(data) {
      return Object.prototype.toString.call(data) === '[object RegExp]';
    }

    /**
    * 是否是函数
    *
    * @return {*} 
    * @memberof WebMonitor
    */

  }, {
    key: 'isFunction',
    value: function isFunction(data) {
      return Object.prototype.toString.call(data) === '[object Function]';
    }

    /**
     * 格式化日期和时间
     *
     * @param {*} value
     * @param {*} fmt
     * @return {*} 
     * @memberof Utils
     */

  }, {
    key: 'formatDate',
    value: function formatDate(value, fmt) {
      if (!(value instanceof Date)) {
        // // safari 仅支持 年/月/日 格式，不支持 年-月-日 
        value = isSafariBrowser() ? value && value.replace(/-/g, '/') : value;
        value = new Date(value);
      }
      var o = {
        "M+": value.getMonth() + 1, //月份   
        "d+": value.getDate(), //日   
        "h+": value.getHours(), //小时   
        "m+": value.getMinutes(), //分   
        "s+": value.getSeconds(), //秒   
        "q+": Math.floor((value.getMonth() + 3) / 3), //季度   
        "S": value.getMilliseconds() //毫秒   
      };
      if (/(y+)/.test(fmt)) {
        fmt = fmt.replace(RegExp.$1, (value.getFullYear() + "").substr(4 - RegExp.$1.length));
      }
      for (var k in o) {
        if (new RegExp("(" + k + ")").test(fmt)) {
          fmt = fmt.replace(RegExp.$1, RegExp.$1.length == 1 ? o[k] : ("00" + o[k]).substr(("" + o[k]).length));
        }
      }
      return fmt;
    }
  }]);
  return Utils;
}();

var utils = Utils;

return utils;

})));
