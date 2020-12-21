/**
 *工具箱
 *
 * @class Utils
 */
class Utils {
  constructor() {}

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
   * 是否是axios response对象
   *
   * @return {*} 
   * @memberof WebMonitor
   */
  isAxiosResponseObj(data) {
    return !!((Object.prototype.toString.call(data) === '[object Object]') && data.request && data.headers && data.config)
  }

}

module.exports = Utils