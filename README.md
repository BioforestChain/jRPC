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
- [ ] v2.3 实现 MagicBinaryReflect，可以同时用于同步与异步通讯
- [ ] v2.4 支持自定义 CloneAble
