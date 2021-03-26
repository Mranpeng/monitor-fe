

/**
 * 前端监控错误上报工具
 */
 const Utils = require('./utils.js')


/**
 *前端监控器
 *
 * @class WebMonitor
 */
class WebMonitor {


  
  /**
   * Creates an instance of WebMonitor.
   * @param {*} params
   * @memberof WebMonitor
   */
  constructor(params) {
    this.utils = new Utils()
    this.baseOptions = { //基础参数
      systemName: '',
      reportUrl: '',
      delayTime: 10000,
      whiteList: [],
      userId: '',
      shopId: '',
      vue: false,
      mini: false, //默认是在小程序环境里，为了兼容小程序老代码
      wx: null  //微信对象
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
    if(this.options.vue) {
      this.Vue = require('vue')
    }
  }

  /**
   *初始化
   *
   * @memberof WebMonitor
   */
  __init() {
    this. __getWhiteList((data) => {
      if(!data) {
        console.warn('获取白名单失败！')
        return
      }else {
        this.__getBrowserInfo()  //浏览器信息
        this.__initQuene()
        this.__vueError()
        this.__consoleError()
        this.__promiseError()
      }
    })
  }

    /**
   *设置白名单
   *
   * @memberof WebMonitor
   */
   __getWhiteList(callback) {
    const _self = this
    const whiteListUrl = 'https://omo.aiyouyi.cn/common-static/monitor-white-list.json?v=' + new Date().getTime()
    if(!this.options.mini) {

      //浏览器ajax获取白名单
      this.request({
        url: whiteListUrl,
        method: 'GET',
        data: null,
        callback: (data) => {
          if(data && Array.isArray(data)) {
            _self.setWhiteList(data)
            callback && callback(data)
          }else {
            callback && callback(null)
          }
        }
      })
    }else {

      //小程序获取白名单
      this.options.wx && this.options.wx.request({
        url: whiteListUrl,
        method: 'get',
        headers: {
          'Content-Type': 'application/json'
        },
        success(data) {
        debugger
          _self.setWhiteList(data.data)
          callback && callback(data.data)
        },
        fail(error) {
          callback && callback(null)
        }
      })
    }
  }


  /**
   * 对外开放的设置白名单
   *
   * @param {*} list
   * @memberof WebMonitor
   */
  setWhiteList(list) {
    let _list = []
    if(this.utils.isObject(list)) {
      for(let key in list) {
        _list.push(list[key])
      }
    }else {
      _list = list
    }

    if(_list && Array.isArray(_list)) {
      this.options.whiteList = _list
    }
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
    var result = []
    for (var i = 0, l = array.length; i < l; i++) {
      for (var j = i + 1; j < l; j++) {
        if (array[i].errorMessage === array[j].errorMessage) {
          j = ++i
        }
      }
      result.push(array[i])
    }
    return result
  }


  /**
   *
   *
   * @param {*} type  上报错误类型
   * @param {*} msg  消息文本
   * @param {*} requestInfo  请求信息
   * @memberof WebMonitor
   */
  __report(type, msg, requestInfo) {
    for (let i = 0; i<this.options.whiteList.length; i++) {
      let one = this.options.whiteList[i]
      if(one.includes('$$')) {  //如果白名单项是正则对象则匹配屏蔽
        one = one.match(/[^【]+(?=】)/g);
        let _Reg = new RegExp(one[0], one[1] || '');
        if (_Reg.test(msg)) {
          console.log(66666666666)
          return
        }
      }else if(this.utils.isString(one)){ //如果白名单是字符串则包含屏蔽
        if (msg.includes(one)) {
          return
        }
      }
    }

    //如果有自定义参数，则加上自定义参数
    let options = {}
    for (let key in this.options) {
      if (!Object.keys(this.baseOptions).includes(key)) {
        options[key] = this.options[key]
      }
    }

    this.cacheQuene.push({
      pageUrl: this.options.pageUrl || (typeof window !== 'undefined' ? window.location.href : ''),
      systemName: this.options.systemName,
      errorType: type ,
      errorTime: this.utils.formatDate(new Date(), 'yyyy-MM-dd hh:mm:ss'),
      userAgent: this.userAgent,
      userId: this.options.userId,
      shopId: this.options.shopId,
      requestInfo: requestInfo || {},
      errorMessage: msg,
      customInfo: options
    })                                                                                                                                                                                                   
  }


  /**
   * 发送http请求上报
   *
   * @param {*} data 发送的数据
   * @memberof WebMonitor
   */
  __send(data) {
    if (this.options.ajax && this.utils.isFunction(this.options.ajax)) {
      this.options.ajax(data)
      return
    }else {
      if(!this.options.mini) {

        //浏览器ajax上报错误
        this.request({
          url: this.options.reportUrl,
          method: 'POST',
          data: data
        })
      }else {

        //小程序上报错误
        this.options.wx && this.options.wx.request({
          url: this.options.reportUrl,
          method: 'post',
          data: Object.assign({}, data, {pageUrl: this.options.pageUrl})
        })
      }

    }

  }


  /**
   * 
   *
   * @param {*} url
   * @param {*} method
   * @param {*} data
   * @param {*} callback
   * @memberof WebMonitor
   */
  request({url, method, data,  callback}){
    var versionList = ["MSXML2.XMLHttp.5.0","MSXML2.XMLHttp.4.0","MSXML2.XMLHttp.3.0","MSXML2.XMLHttp","Microsoft.XMLHttp"];
    var xhr;
    if(XMLHttpRequest){
      xhr = new XMLHttpRequest();
    }else{
      for(var i =0;i<versionList.length;i++){
        try{
          xhr = new ActiveXObject(versionList[i]);
          break;
        }catch(e){
          console.warn(e)
        }
      }
    }
        
    xhr.onreadystatechange = (function(myxhr){
      return function(){
        if(myxhr.readyState === 4 && myxhr.status === 200){
          callback(myxhr.responseText);
        }else {
          callback(null)
        }
      }
    })(xhr);
    xhr.open(method,url,true);
    xhr.send(data);
}


  /**
   *对外提供的错误发送方法
   *
   * @param {*} {type, error}  type:错误类型   error:错误内容
   * @memberof WebMonitor
   */
  emit({type, error}) {
    if (!type) {
      console.warn('未定义错误类型')
      return
    }

    //如果是请求错误，带上请求参数
    if (type === 'httpError') {
      const requestInfo = this.__httpError(error)
      this.__report(type, this.__createMessage({
        error
      }), requestInfo)
    } else {
      //其他自定义错误事件，直接上报
      this.__report(type, this.__createMessage({
        error
      }))
    }
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
    if(!this.Vue) {
      console.warn('Vue不存在!')
      return
    }
    let vue = this.Vue.default || this.Vue
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
    if(typeof window === 'undefined') {
      return
    }
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
    if(typeof window === 'undefined') {
      return
    }
    window.addEventListener('unhandledrejection', function (error) {
      if(error.reason) {
        _self.__report(errorType, _self.__createMessage({
          error: error.reason
        }))
      }
    })
  }


  /**
   *
   *
   * @param {*} error  错误信息
   * @return {*} 
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
    if (this.options.getUserAgent && this.utils.isFunction(this.options.getUserAgent)) {
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

    if(typeof window === 'undefined') {
      return
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

export default WebMonitor;


