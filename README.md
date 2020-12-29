# Comlink

> 灵感来源是 GoogleChromeLabs/Comlink
> 但我们用完全不同的思路重写了一套

1. 首先是内核层，这里是很简单一层流程基础。
   > 在这里，没有异步，因为异步本身的基础就是同步与回调，所以当我们的定位本身就是同步时，就意味着全面兼容各种最原始的代码编写方式。
1. 而后是协议层，这里是魔力开始的地方。
   > 我们目前做了 `Emscription-协议`（准确说是`v8-js-协议`，但之后我们会用 `comproto` 这个项目替代 `v8` 的那部分）。我们的野心很大，希望将协议兼容到各家编程语言
1. 核心技术
   1. Worker
   1. Atomic
   1. WeakRef

## Roadmap

- [x] v2.1 实现 HolderReflect 模块，使得支持异步操作
  > 将核心协议部分使用纯函数+回调的风格重写
- [x] v2.2 更强类型的 ComlinkAsync 推导
- [x] v2.3 实现 MagicBinaryReflect，可以同时用于同步与异步通讯
- [x] v2.4 支持浏览器
- [ ] v2.5 支持自定义 CloneAble

## 异步与同步

Comlink 支持同步与异步模块互相调度。

#### 不支持同步的浏览器前端

`main Thread`不支持`Atomics.wait`，我们可以为其注册远端的异步模块来进行编程。
当然也可以将浏览器前端注册为模块，提供给其它线程调度，从而可以享用到主线程特有的模块，比如 `DOM-API`，`WebRTC` 等等。
但这里要注意的是，将自己作为模块注册出去时，被注册的模块往往以为自己是同步模式，这可能会引发异常，所以编写代码的类型时要务必注意。
比如：

```ts
/// windows env
const duplexFactory = new BrowserDuplexFactory();
const windowsModule = Comlink.asyncModuleCreater("A", duplexFactory);
windowsModule.export((obj) => {
  return obj.a + obj.b;
}, "some api");
```

这里 `obj` 很可能是来自其它线程，而我们自己又是处于异步模式，所以 `obj` 有可能是 `Holder` 对象。
结果就会导致运行函数不成立。
所以要针对这种问题，要使用特定的 API 来达成目的。我们以 `WebRTC` 的 API 为例

```ts
/// windows env

// 使用异步函数来进行初始化
windowsModule.export(async function RTCPeerConnection(
  configuration: Holder<RTCConfiguration>,
  constraints: Holder<MediaConstraints>,
) {
  /// 将 Holder 复制成本地对象
  const localeConfiguration = await HolderReflect.JsonStringify(configuration);
  const localeConstraints = await HolderReflect.cloneAsJson(constraints);
  return new RTCPeerConnection(localeConfiguration, localeConstraints);
},
"RTCPeerConnection");

/// worker env
const RTCPeerConnection = workerModule.importAsSync("RTCPeerConnection");
const peerConnection = new RTCPeerConnection({ ...configuration });

/// or
{
  const RTCPeerConnectionAsync = workerModule.import("RTCPeerConnection");
  const RTCPeerConnection = workerModule.asyncToSync(RTCPeerConnectionAsync);
}
```

#### 同步转异步

我们经常看到一些需要长 CPU 时间的 nodejs 任务，在绑定到原生模块的时候，是将其注册为异步模块。
在 Comlink 中，同样也能将一个同步函数注册成异步函数。不同的是，你可以选择是保持同步模式还是注册成异步模式。

```ts
const fibAsync = workerModule.importAsAsync("fib");
await fibAsync(40);
/// same other task still work in current thread.

// or
{
  const fib = workerModule.import("fib");
  const fibAsync = workerModule.syncToAsync(fib);
}
```
