//# node --harmony-weak-refs --expose-gc
import { InnerComlink, SimpleBinaryChannel } from "./index";

class MyItem {
  constructor(public readonly value: number) {}
}
(global as any).MyItem = MyItem;
class CGService {
  private arr: MyItem[] = [];
  private i = 0;
  getList(len: number) {
    for (let i = 0; i < len; i++) {
      this.arr[i] = new MyItem(this.i + i);
    }
    this.i += len;
    return this.arr;
  }
  clear() {
    this.arr.length = 0;
  }
}
(global as any).CGService = CGService;

/**
 * 生成一对相通的管道
 */
const { portA, portB } = new SimpleBinaryChannel<InnerComlink.TB>();

/// 模拟A模块作为服务模块
(async () => {
  /**模块控制器 */
  const moduleA = new InnerComlink("A");
  console.log("moduleA", ((global as any).moduleA = moduleA));
  moduleA.listen(portA);

  /**生成服务 */
  const ctxA = new CGService();

  /**
   * 导出服务
   * 同语法： export default ctxA
   */
  moduleA.export(ctxA);
})();

/// 模拟B模块作为调用模块
(async function () {
  /**模块控制器 */
  const moduleB = new InnerComlink("B");
  console.log("moduleB", ((global as any).moduleB = moduleB));
  moduleB.listen(portB);

  /**
   * 导入服务
   * 同语法：
   * import ctx from port
   * import {a} from port
   */
  const ctxA = moduleB.import<CGService>(portB);

  // 执行
  for (let i = 0; i < 10; i++) {
    console.log(ctxA.getList(100).reduce((r, item) => r + item.value, 0));
    ctxA.clear();
    /// 尝试释放内存
    global.gc?.();
    await new Promise((cb) => setTimeout(cb, 100));
  }
})().catch((err) => {
  console.error("???", err.message);
});
