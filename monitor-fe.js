/*!
 * monitor-fe.js v1.2.2
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
 * 前端监控错误上报工具
 */
var Vue = typeof process === 'undefined' || !process ? null : require('vue');
var axios = typeof process === 'undefined' || !process ? null : require('axios');
var Utils = require('./utils.js');

/**
 *前端监控器
 *
 * @class WebMonitor
 */

var WebMonitor = function () {

  /**
   * Creates an instance of WebMonitor.
   * @param {*} systemName  系统名称
   * @param {*} baseUrl     接口根路径
   * @param {*} delayTime   检测发送间隔
   * @memberof WebMonitor
   */
  function WebMonitor(params) {
    classCallCheck(this, WebMonitor);

    this.utils = new Utils();
    this.baseOptions = { //基础参数
      systemName: '',
      reportUrl: '',
      delayTime: 10000,
      whiteList: [],
      userId: '',
      shopId: ''
    };
    this.options = {};
    this.setOption(params);
    if (!this.options.systemName) {
      console.warn('前端监控器缺少systemName参数，无法运行，请检查！');
      return;
    }
    if (!this.options.reportUrl) {
      console.warn('前端监控器缺少reportUrl参数，无法运行，请检查！');
      return;
    }
    this.cacheQuene = []; //缓冲队列
    this.__init();
  }

  /**
   * 设置配置参数
   *
   * @param {*} options 外部配置的参数集合（userId，shopId, 以及其他自定义的参数会发送到服务器）
   * @memberof WebMonitor
   */


  createClass(WebMonitor, [{
    key: 'setOption',
    value: function setOption(options) {
      if (!this.utils.isObject(options)) {
        console.warn('前端监控器初始化参数格式错误,请检查!');
        return;
      }
      this.options = Object.assign({}, this.baseOptions, this.options, options);
    }

    /**
     *初始化
     *
     * @memberof WebMonitor
     */

  }, {
    key: '__init',
    value: function __init() {
      this.__getBrowserInfo(); //浏览器信息
      this.__initQuene();
      this.__vueError();
      this.__consoleError();
      this.__promiseError();
    }

    /**
     *初始化延迟合并队列
     *
     * @memberof WebMonitor
     */

  }, {
    key: '__initQuene',
    value: function __initQuene() {
      var _self = this;
      setInterval(function () {
        _self.__removeDuplicate(_self.cacheQuene).forEach(function (item) {
          _self.__send(item);
        });
        _self.cacheQuene = [];
      }, this.options.delayTime);
    }

    /**
     *发送队列去重
     *
     * @param {*} array 发送队列
     * @return {*} 
     * @memberof WebMonitor
     */

  }, {
    key: '__removeDuplicate',
    value: function __removeDuplicate(array) {
      var result = [];
      for (var i = 0, l = array.length; i < l; i++) {
        for (var j = i + 1; j < l; j++) {
          if (array[i].errorMessage === array[j].errorMessage) {
            j = ++i;
          }
        }
        result.push(array[i]);
      }
      return result;
    }

    /**
     *上报错误信息
     *
     * @param {*} type 上报错误类型
     * @param {*} msg 消息文本
     * @memberof WebMonitor
     */

  }, {
    key: '__report',
    value: function __report(type, msg, requestInfo) {
      for (var i = 0; i < this.options.whiteList.length; i++) {
        var one = this.options.whiteList[i];
        if (this.utils.isRegExp(one)) {
          //如果白名单项是正则对象则匹配屏蔽
          if (one.test(msg)) {
            return;
          }
        } else if (this.utils.isString(one)) {
          //如果白名单是字符串则包含屏蔽
          if (msg.includes(one)) {
            return;
          }
        }
      }

      this.cacheQuene.push({
        pageUrl: this.options.pageUrl || (typeof window !== 'undefined' ? window.location.href : ''),
        systemName: this.options.systemName,
        errorType: type + ', ' + this.utils.formatDate(new Date(), 'yyyy-MM-dd hh:mm:ss'),
        userAgent: this.userAgent,
        userId: this.options.userId,
        shopId: this.options.shopId,
        requestInfo: requestInfo || {},
        errorMessage: msg
      });
    }

    /**
     * 发送http请求上报
     *
     * @param {*} data 发送的数据
     * @memberof WebMonitor
     */

  }, {
    key: '__send',
    value: function __send(data) {
      if (this.options.ajax) {
        this.options.ajax(data);
        return;
      }
      if (axios) {
        axios.post(this.options.reportUrl, data);
      } else {
        console.warn('axios不存在');
      }
    }

    /**
     *发送自定义错误事件(type: 自定义错误事件类型, error: 错误对象/错误字符串)
     *
     * @memberof WebMonitor
     */

  }, {
    key: 'emit',
    value: function emit(_ref) {
      var type = _ref.type,
          error = _ref.error;

      if (!type) {
        console.warn('未定义错误类型');
        return;
      }

      //如果是请求错误，带上请求参数
      if (type === 'httpError') {
        var requestInfo = this.__httpError(error);
        this.__report(type, this.__createMessage({
          error: error
        }), requestInfo);
      } else {
        //其他自定义错误事件，直接上报
        this.__report(type, this.__createMessage({
          error: error
        }));
      }
    }

    /**
     *创建消息
     *
     * @param {*} { componentInfo：vue组件路径/组件名称, error：错误对象/错误字符串/axios的response }
     * @return {*}  生成的消息体
     * @memberof WebMonitor
     */

  }, {
    key: '__createMessage',
    value: function __createMessage(_ref2) {
      var componentInfo = _ref2.componentInfo,
          error = _ref2.error;


      //消息内容
      var errorMessage = '';

      //收集消息
      if (this.utils.isErrorObj(error)) {
        errorMessage = error.stack ? error.stack.toString() : error.message ? error.message : error || '未知错误';
      } else if (this.utils.isString(error)) {
        errorMessage = error;
      } else if (this.utils.isAxiosResponseObj(error)) {
        errorMessage = 'code:' + (error.data.code || '--') + ',msg:' + error.data.msg + ',status:' + error.data.status;
      }

      //如果是vue组件，则可以带上组件路径或名称
      if (componentInfo) {
        errorMessage = '[componentInfo]: ' + componentInfo + ', ' + errorMessage;
      }

      //如果有自定义参数，则加上自定义参数
      var options = {};
      for (var key in this.options) {
        if (!Object.keys(this.baseOptions).includes(key)) {
          options[key] = this.options[key];
        }
      }
      if (Object.keys(options).length > 0) {
        errorMessage += ', ' + JSON.stringify(options);
      }

      //此行不可删除，截获信息以后在浏览器里显示
      console.log('!!!monitorError: ' + errorMessage);
      return errorMessage;
    }

    /**
     *注册vue实例错误事件
     *
     * @memberof WebMonitor
     */

  }, {
    key: '__vueError',
    value: function __vueError() {
      var _self = this;
      var errorType = 'vueError';
      if (!Vue) {
        console.warn('Vue不存在!');
        return;
      }
      var vue = Vue.default || Vue;
      vue.config.errorHandler = function (error, vm, info) {
        var componentInfo = vm._isVue ? vm.$options.__file || vm.$options.name || vm.$options._componentTag : vm.name;
        _self.__report(errorType, _self.__createMessage({
          componentInfo: componentInfo || '',
          error: error
        }));
      };
    }

    /**
     *注册控制台错误事件
     *
     * @memberof WebMonitor
     */

  }, {
    key: '__consoleError',
    value: function __consoleError() {
      var errorType = 'consoleError';
      if (typeof window === 'undefined') {
        return;
      }
      if (!window.console || !window.console.error) {
        return;
      }

      var _self = this;
      var consoleError = window.console.error;
      window.console.error = function (error) {
        _self.__report(errorType, _self.__createMessage({
          error: error
        }));
        consoleError && consoleError.apply(window, arguments);
      };
    }

    /**
     *注册promise错误事件
     *
     * @memberof WebMonitor
     */

  }, {
    key: '__promiseError',
    value: function __promiseError() {
      var errorType = 'promiseError';
      var _self = this;
      if (typeof window === 'undefined') {
        return;
      }
      window.addEventListener('unhandledrejection', function (error) {
        if (error.reason) {
          _self.__report(errorType, _self.__createMessage({
            error: error.reason
          }));
        }
      });
    }

    /**
     *处理http错误事件
     *
     * @memberof WebMonitor
     */

  }, {
    key: '__httpError',
    value: function __httpError(error) {
      var requestInfo = {};
      if (!error.config) {
        return requestInfo;
      }

      requestInfo = {
        url: error.request && error.request.responseURL ? error.request.responseURL : '',
        method: error.config.method
      };

      if (error.config.method.toLowerCase() === 'post' && error.config.data) {
        var rusult = {};
        if (this.utils.isString(error.config.data)) {
          var decodeString = decodeURI(error.config.data);
          if (decodeString.includes('json=')) {
            rusult = JSON.parse(decodeString.split('json=')[1]);
          } else {
            rusult = JSON.parse(decodeString);
          }
        } else if (this.utils.isObject(error.config.data)) {
          rusult = error.config.data;
        }
        requestInfo['data'] = rusult;
      }

      if (error.config.method.toLowerCase() === 'get' && error.config.params) {
        if (this.utils.isString(error.config.params)) {
          requestInfo['params'] = JSON.parse(error.config.params);
        } else if (this.utils.isObject(error.config.data)) {
          requestInfo['params'] = error.config.params;
        }
      }
      requestInfo['headers'] = error.config.headers;
      return requestInfo;
    }

    /**
     *获取浏览器信息(浏览器名称+版本)
     *
     * @return {*} 
     * @memberof WebMonitor
     */

  }, {
    key: '__getBrowserInfo',
    value: function __getBrowserInfo() {
      if (this.options.getUserAgent) {
        this.userAgent = this.options.getUserAgent();
        return;
      }
      var browser = {
        msie: false,
        firefox: false,
        opera: false,
        safari: false,
        chrome: false,
        netscape: false,
        name: 'unknown',
        version: 0
      };

      if (typeof window === 'undefined') {
        return;
      }

      var userAgent = window.navigator.userAgent.toLowerCase();
      if (/(msie|firefox|opera|chrome|netscape)\D+(\d[\d.]*)/.test(userAgent)) {
        browser[RegExp.$1] = true;
        browser.name = RegExp.$1;
        browser.version = RegExp.$2;
      } else if (/version\D+(\d[\d.]*).*safari/.test(userAgent)) {
        // safari
        browser.safari = true;
        browser.name = 'safari';
        browser.version = RegExp.$2;
      }
      this.userAgent = browser.name + '-' + browser.version;
    }
  }]);
  return WebMonitor;
}();

return WebMonitor;

})));
