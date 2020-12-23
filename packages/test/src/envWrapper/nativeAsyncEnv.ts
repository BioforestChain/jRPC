import { ComlinkAsync } from "@bfchain/comlink";
import { NativeBinaryChannel } from "../innerComlink/index";

export async function installNativeEnv(
  moduleACallback: (module: ComlinkAsync) => unknown,
  moduleBCallback: (module: ComlinkAsync) => unknown,
) {
  /**
   * 生成一对相通的管道
   */
  const { portA, portB } = new NativeBinaryChannel<ComlinkProtocol.TB>();

  /// 模拟A模块作为服务模块
  try {
    /**模块控制器 */
    const moduleA = new ComlinkAsync(portA, "A");
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
    const moduleB = new ComlinkAsync(portB, "B");
    (global as any).moduleB = moduleB;

    // 执行回调
    await moduleBCallback(moduleB);
  } catch (err) {
    console.error(" ModuleB Error:", err?.stack ?? err);
    return;
  }

  console.log("✅ ~ all test passed!");
}
