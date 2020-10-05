import { InnerComlink, SimpleBinaryChannel } from "../innerComlink/index";

export async function installSimpleEnv(
  moduleACallback: (module: InnerComlink) => unknown,
  moduleBCallback: (module: InnerComlink) => unknown,
) {
  /**
   * 生成一对相通的管道
   */
  const { portA, portB } = new SimpleBinaryChannel<InnerComlink.TB>();

  /// 模拟A模块作为服务模块
  try {
    /**模块控制器 */
    const moduleA = new InnerComlink(portA, "A");
    (global as any).moduleA = moduleA;

    // 执行回调
    await moduleACallback(moduleA);
  } catch (err) {
    console.error("❌ ModuleA Error", err?.stack ?? err);
    return;
  }

  /// 模拟B模块作为调用模块
  try {
    /**模块控制器 */
    const moduleB = new InnerComlink(portB, "B");
    (global as any).moduleB = moduleB;

    // 执行回调
    await moduleBCallback(moduleB);
  } catch (err) {
    console.error(" ModuleB Error:", err?.stack ?? err);
    return;
  }

  console.log("✅ ~ all test passed!");
}
