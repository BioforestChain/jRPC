export class MyItem {
  constructor(public readonly value: number) {}
}
export class CGService {
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

  static async testAll(ctxA: CGService, UTIMES: number) {
    let myItem = ctxA.getList(1)[0];
    ctxA.clear();

    /// 测试A能回收
    for (let i = 0; i < 10; i++) {
      ctxA.getList(UTIMES).reduce((r, item) => r + item.value, 0);
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
    console.assert(myItem.value === 0);
  }

  static async testAll2(ctxA: BFChainComlink.AsyncUtil.Remote<CGService>, UTIMES: number) {
    let myItem = await (await ctxA.getList(1))[0];
    ctxA.clear();

    /// 测试A能回收
    for (let i = 0; i < 10; i++) {
      const list = await ctxA.getList(UTIMES);
      let total = 0;
      for await (const item of list) {
        total += await item.value;
      }
      console.log(`UTIMES: %d; total: %d;`, UTIMES, total);
      await ctxA.clear();
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
    console.assert((await myItem.value) === 0);
  }
}

export const sleep = (ms: number) => new Promise((cb) => setTimeout(cb, ms));
