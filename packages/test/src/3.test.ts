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
  const moduleA = new InnerComlink(portA, "A");
  (global as any).moduleA = moduleA;

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
  const moduleB = new InnerComlink(portB, "B");
  (global as any).moduleB = moduleB;

  const sleep = (ms: number) => new Promise((cb) => setTimeout(cb, ms));
  /**
   * 导入服务
   * 同语法：
   * import ctx from port
   * import {a} from port
   */
  const ctxA = moduleB.import<CGService>();

  let myItem = ctxA.getList(1)[0];
  ctxA.clear();

  /// 测试A能回收
  for (let i = 0; i < 10; i++) {
    ctxA.getList(10000).reduce((r, item) => r + item.value, 0);
    ctxA.clear();
    const mem = process.memoryUsage();
    /// 尝试释放内存
    global.gc();
    await sleep(100);
    const mem2 = process.memoryUsage();
    const diff = mem2.heapUsed - mem.heapUsed;
    console.log(
      "%s 内存使用：从 %d => %d (%d)",
      diff < 0 ? "✅" : `❌`,
      mem.heapUsed,
      mem2.heapUsed,
      diff,
    );
  }
  /// 测试B能阻止A回收
  debugger;
  console.log(myItem.value);
})().catch((err) => {
  console.error("???", err.message);
});
