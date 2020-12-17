
/**
 * 前端监控错误上报工具
 */
const Vue = require('vue')
const axios = require('axios')
const Observer = require('./observer.js')
const Utils = require('./utils.js')


/**
 *前端监控器
 *
 * @class WebMonitor
 */
class WebMonitor extends Observer {


  /**
   * Creates an instance of WebMonitor.
   * @param {*} systemName  系统名称
   * @param {*} baseUrl     接口根路径
   * @param {*} delayTime   检测发送间隔
   * @memberof WebMonitor
   */
  constructor(params) {
    super()
    this.utils = new Utils()
    this.baseOptions = { //基础参数
      systemName: '',
      reportUrl: '',
      delayTime: 10000,
      whiteList: [],
      userId: '',
      shopId: ''
    }
    this.options = {}
    this.setOption(params)
    if (!this.options.systemName) {
      console.warn('前端监控器缺少systemName参数，无法运行，请检查！')
      return
    }
    if (!this.options.reportUrl) {
      console.warn('前端监控器缺少reportUrl参数，无法运行，请检查！')
      return
    }
    this.cacheQuene = [] //缓冲队列
    this.__init()
  }


  /**
   * 设置配置参数
   *
   * @param {*} options 外部配置的参数集合（userId，shopId, 以及其他自定义的参数会发送到服务器）
   * @memberof WebMonitor
   */
  setOption(options) {
    if (!this.utils.isObject(options)) {
      console.warn('前端监控器初始化参数格式错误,请检查!')
      return
    }
    this.options = Object.assign({}, this.baseOptions, this.options, options)
  }


  /**
   *初始化
   *
   * @memberof WebMonitor
   */
  __init() {
    this.__getBrowserInfo()  //浏览器信息
    this.__initQuene()
    this.__vueError()
    this.__consoleError()
    this.__promiseError()
    this.__registerCustomError()
  }


  /**
   *初始化延迟合并队列
   *
   * @memberof WebMonitor
   */
  __initQuene() {
    const _self = this
    setInterval(() => {
      _self.__removeDuplicate(_self.cacheQuene).forEach((item) => {
        _self.__send(item)
      })
      _self.cacheQuene = []
    }, this.options.delayTime)
  }


  /**
   *发送队列去重
   *
   * @param {*} array 发送队列
   * @return {*} 
   * @memberof WebMonitor
   */
  __removeDuplicate(array) {
    let map = new Map();
    for (let item of array) {
      if (!map.has(item.errorMessage)) {
        map.set(item.errorMessage, item);
      }
    }
    return [...map.values()];
  }


  /**
   *上报错误信息
   *
   * @param {*} type 上报错误类型
   * @param {*} msg 消息文本
   * @memberof WebMonitor
   */
  __report(type, msg, requestInfo) {
    for (let item of this.options.whiteList) {
      if (msg.includes(item)) {
        return
      }
    }

    this.cacheQuene.push({
      pageUrl: window.location.href,
      systemName: this.options.systemName,
      errorType: type + ', ' + this.utils.formatDate(new Date(), 'yyyy-mm-dd hh:MM:ss'),
      userAgent: this.userAgent,
      userId: this.options.userId,
      shopId: this.options.shopId,
      requestInfo: requestInfo || {},
      errorMessage: msg
    })
  }


  /**
   * 发送http请求上报
   *
   * @param {*} data 发送的数据
   * @memberof WebMonitor
   */
  __send(data) {
    if (this.options.ajax) {
      this.options.ajax(data)
      return
    }
    axios.post(this.options.reportUrl, data)
  }


  /**
   *注册自定义错误事件(type: 自定义错误事件类型, error: 错误对象/错误字符串)
   *使用示例： 
      window.webMonitor.emit({
        type:'myError', 
        error: new Error('我错了')
      })
 
      window.webMonitor.emit({
        type:'myError', 
        error: '我错了'
      })
   *
   * @memberof WebMonitor
   */
  __registerCustomError() {
    const _self = this
    this.on(function (errorType, error) {
      if (!errorType) {
        console.warn('未定义错误类型')
        return
      }

      //如果是请求错误，带上请求参数
      if (errorType === 'httpError') {
        const requestInfo = _self.__httpError(error)
        _self.__report(errorType, _self.__createMessage({
          error
        }), requestInfo)
      } else {
        //其他自定义错误事件，直接上报
        _self.__report(errorType, _self.__createMessage({
          error
        }))
      }
    })
  }



  /**
   *创建消息
   *
   * @param {*} { componentInfo：vue组件路径/组件名称, error：错误对象/错误字符串/axios的response }
   * @return {*}  生成的消息体
   * @memberof WebMonitor
   */
  __createMessage({ componentInfo, error }) {

    //消息内容
    let errorMessage = ''

    //收集消息
    if (this.utils.isErrorObj(error)) {
      errorMessage = error.stack ? error.stack.toString() : error.message ? error.message : (error || '未知错误')
    } else if (this.utils.isString(error)) {
      errorMessage = error
    } else if (this.utils.isAxiosResponseObj(error)) {
      errorMessage = `code:${error.data.code || '--'},msg:${error.data.msg},status:${error.data.status}`
    }

    //如果是vue组件，则可以带上组件路径或名称
    if (componentInfo) {
      errorMessage = `[componentInfo]: ${componentInfo}, ${errorMessage}`
    }

    //如果有自定义参数，则加上自定义参数
    let options = {}
    for (let key in this.options) {
      if (!Object.keys(this.baseOptions).includes(key)) {
        options[key] = this.options[key]
      }
    }
    if(Object.keys(options).length > 0) {
      errorMessage += ', '+ JSON.stringify(options)
    }

    //此行不可删除，截获信息以后在浏览器里显示
    console.log(`!!!monitorError: ${errorMessage}`)
    return errorMessage
  }


  /**
   *注册vue实例错误事件
   *
   * @memberof WebMonitor
   */
  __vueError() {
    const _self = this
    const errorType = 'vueError'
    let vue = Vue.default || Vue
    vue.config.errorHandler = function (error, vm, info) {
      const componentInfo = vm._isVue ? vm.$options.__file || vm.$options.name || vm.$options._componentTag : vm.name;
      _self.__report(errorType, _self.__createMessage({
        componentInfo: componentInfo || '',
        error
      }))
    }
  }


  /**
   *注册控制台错误事件
   *
   * @memberof WebMonitor
   */
  __consoleError() {
    const errorType = 'consoleError'
    if (!window.console || !window.console.error) {
      return
    };

    const _self = this
    var consoleError = window.console.error
    window.console.error = function (error) {
      _self.__report(errorType, _self.__createMessage({
        error
      }))
      consoleError && consoleError.apply(window, arguments)
    }
  }


  /**
   *注册promise错误事件
   *
   * @memberof WebMonitor
   */
  __promiseError() {
    const errorType = 'promiseError'
    const _self = this
    window.addEventListener('unhandledrejection', function (error) {
      _self.__report(errorType, _self.__createMessage({
        error: error.reason
      }))
    })
  }


  /**
   *处理http错误事件
   *
   * @memberof WebMonitor
   */
  __httpError(error) {
    let requestInfo = {}
    if (!error.config) {
      return requestInfo
    }

    requestInfo = {
      url: error.request && error.request.responseURL ? error.request.responseURL : '',
      method: error.config.method
    }

    if (error.config.method.toLowerCase() === 'post' && error.config.data) {
      let rusult = {}
      if (this.utils.isString(error.config.data)) {
        let decodeString = decodeURI(error.config.data)
        if(decodeString.includes('json=')) {
          rusult = JSON.parse(decodeString.split('json=')[1])
        }else {
          rusult = JSON.parse(decodeString)
        }
      }else if(this.utils.isObject(error.config.data)) {
        rusult = error.config.data
      }
      requestInfo['data'] = rusult
    }

    if (error.config.method.toLowerCase() === 'get' && error.config.params) {
      if (this.utils.isString(error.config.params)) {
        requestInfo['params'] = JSON.parse(error.config.params)
      }else if(this.utils.isObject(error.config.data)){
        requestInfo['params'] = error.config.params
      }
    }
    requestInfo['headers'] = error.config.headers
    return requestInfo
  }


  /**
   *获取浏览器信息(浏览器名称+版本)
   *
   * @return {*} 
   * @memberof WebMonitor
   */
  __getBrowserInfo() {
    if (this.options.getUserAgent) {
      this.userAgent = this.options.getUserAgent()
      return
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
    }
    const userAgent = window.navigator.userAgent.toLowerCase();
    if (/(msie|firefox|opera|chrome|netscape)\D+(\d[\d.]*)/.test(userAgent)) {
      browser[RegExp.$1] = true;
      browser.name = RegExp.$1;
      browser.version = RegExp.$2;
    } else if (/version\D+(\d[\d.]*).*safari/.test(userAgent)) { // safari
      browser.safari = true;
      browser.name = 'safari';
      browser.version = RegExp.$2;
    }
    this.userAgent = `${browser.name}-${browser.version}`;
  }

}


module.exports = WebMonitor;


