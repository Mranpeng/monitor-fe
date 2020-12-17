/**
 *工具箱
 *
 * @class Utils
 */
class Utils {
  constructor() {

  }

  /**
   * 是否是错误对象
   *
   * @return {*} 
   * @memberof WebMonitor
   */
  isErrorObj(data) {
    return Object.prototype.toString.call(data) === '[object Error]'
  }


  /**
   * 是否是字符串
   *
   * @return {*} 
   * @memberof WebMonitor
   */
  isString(data) {
    return typeof data === 'string'
  }


  /**
   * 是否是axios response对象
   *
   * @return {*} 
   * @memberof WebMonitor
   */
  isAxiosResponseObj(data) {
    return !!((Object.prototype.toString.call(data) === '[object Object]') && data.request && data.headers && data.config)
  }


  /**
   * 是否是对象
   *
   * @memberof WebMonitor
   */
  isObject(data) {
    return Object.prototype.toString.call(data) === '[object Object]'
  }


  /**
   * 格式化日期和时间
   *
   * @param {*} value
   * @param {*} fmt
   * @return {*} 
   * @memberof Utils
   */
  formatDate(value, fmt) {
    if (!(value instanceof Date)) {
      // // safari 仅支持 年/月/日 格式，不支持 年-月-日 
      value = isSafariBrowser() ? value && value.replace(/-/g, '/') : value
      value = new Date(value);
    }
    var o = {
      "M+": value.getMonth() + 1,                 //月份   
      "d+": value.getDate(),                    //日   
      "h+": value.getHours(),                   //小时   
      "m+": value.getMinutes(),                 //分   
      "s+": value.getSeconds(),                 //秒   
      "q+": Math.floor((value.getMonth() + 3) / 3), //季度   
      "S": value.getMilliseconds()             //毫秒   
    };
    if (/(y+)/.test(fmt)) {
      fmt = fmt.replace(RegExp.$1, (value.getFullYear() + "").substr(4 - RegExp.$1.length));
    }
    for (var k in o) {
      if (new RegExp("(" + k + ")").test(fmt)) {
        fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
      }
    }
    return fmt;
  }
}

module.exports = Utils