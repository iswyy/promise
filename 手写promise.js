const PENDING = 'pending'
const FUFILLED = 'fufilled'
const REJECTED = 'reject'
class MyPromise {
    #_state = PENDING;
  #_data = undefined;
  #handleler = [];
    constructor(fn) {
        const _resolve = (data)=> {
            this.#changeState(FUFILLED, data)
        }
        const _reject = (reason)=> {
            this.#changeState(REJECTED, reason)
        }
        try {
            fn(_resolve,_reject)
        } catch (error) {
            _reject(error)
        }
  }
  // 改变状态
  #changeState(state, data) {
      // 如果状态已经改变，直接返回
        if (this.#_state !== PENDING) return;
        this.#_state = state;
        this.#_data = data
        console.log(this.#_data,this.#_state);
        this.#run()
  }
  // 判断是不是promise
  #isPromiseLike(value) {
    if(value !== null || typeof value === 'object' || typeof value === 'function') {
      return typeof value.then === 'function'
    }
    return false
  }
  // 将函数放入微任务队列中
  #runMicroTask(func) {
    // process是node环境，nextTick是浏览器环境
    if(typeof process !== null || typeof process.nextTick === 'function') {
      process.nextTick(func)
    }else if(typeof MutationObserver === 'function') {
      const ob = new MutationObserver(func)
      const textNode = document.createTextNode(1)
      ob.observe(textNode, { characterData: true })
      textNode.textContent = 2
    } else {
      setTimeout(func, 0)
    }
  }
  // 执行一个promise
  #runone(callback, resolve, reject) {
    // 将函数放入微任务队列中
    this.#runMicroTask(() => {
      // 如果传的回调不是一个函数，直接执行
      if (typeof callback !== 'function') {
        const settled = this.#_state === FUFILLED ? resolve : reject
        settled(this.#_data)
        return
      } else {
        // 如果是一个函数，返回一个promise
        try {
          const data = callback(this.#_data);
          if (this.#isPromiseLike(data)) {
            data.then(resolve,reject)
          } else {
            resolve(this.#_data)
          }
        } catch (error) {
          reject(this.#_data)
        }
      }
    })
  }
  #run() {
    if (this.#_state === PENDING) return
    while (this.#handleler.length) {
      const { onFullfilled, onRejected, resolve, reject } = this.#handleler.shift()
      if (this.#_state === FUFILLED) {
        this.#runone(onFullfilled, resolve, reject)
      } else {
        this.#runone(onRejected, resolve, reject)
      }
    }
  }
    then(onFullfilled, onRejected) {
      return new MyPromise((resolve, reject) => {
          // 收集回调以便在run中执行
          this.#handleler.push({ onFullfilled, onRejected, resolve, reject })
          this.#run()
        })
  }
  catch(onRejected) {
    // 只有失败的时候才会执行
    return this.then(undefined, onRejected)
  }
  finally(onFinally) {
    // 无论成功还是失败都会执行finally
    return this.then((data) => {
      onFinally()
      return data
    },err => {
      onFinally()
      throw err
    })
  }
  static resolve(value) {
    // 如果传入的是一个promise直接返回
    if (value instanceof MyPromise) return value;
    // 如果传入的是一个thenable，返回一个promise
    let _resolve, _reject;
    const p = new MyPromise((resolve, reject) => {
      _resolve = resolve
      _reject = reject
    });
    if(p.#isPromiseLike(value)) {
      value.then(_resolve, _reject)
    } else {
      _resolve(value)
    }
    return p
  }
  static reject(reason) {
    // 任何情况下都返回一个包含reason的promise
    return new MyPromise((reject) => reject(reason))
  }
}
let my = new MyPromise((resolve,reject) => {
    resolve(123)
})
console.log(my);
  