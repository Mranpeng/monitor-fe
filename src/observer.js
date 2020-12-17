 /**
 *观察器
 *
 * @class Observer
 */
class Observer {

  constructor() {
    this.funcs = []; //回调函数列表
  }


  /**
   *事件监听
   *
   * @param {*} fn
   * @memberof Observer
   */
  on(fn) {
    this.funcs.push(fn);
  }


  /**
   *事件解绑
   *
   * @param {*} fn
   * @memberof Observer
   */
  off(fn) {
    this.funcs = this.funcs.filter(
      function (el) {
        if (el !== fn) {
          return true;
        }
      }
    )
  }


  /**
   *事件发送
   *
   * @param {*} { type, error, scope }
   * @memberof Observer
   */
  emit({ type, error, scope }) {
    this.funcs.forEach(
      function (el) {
        el.call(scope || window, type, error);
      });
  }
}

module.exports = Observer