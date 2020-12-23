## 实现原理

在 ComlinkAsync 中，一切皆“异步代理”！这里的一切，除了引用对象，还包括异常、原始值……
在这基础上，我们对 await 赋予了更多的语义。它将能满足多数编程场景所需的功能。
同时我们提供 HolderReflect 来弥补“异步代理”所缺失的在同步场景下的编程语言功能。

#### 一个异步代理的状态机

1. Holder.Unknown
   > 占位对象
   - 在将来可以是任意值，甚至是异常。
   - Holder 只会由异步指令发起者创建，因为它明确将会有一个返回值（比如 get、apply 等行为），
   - 所以此时它可以通过创建 Holder 来代理这些将要进行执行的行为。
   - 在 Holder 阶段，除了 then 属性的调用 其余所有行为都是“临时有效的”，因为它们未执行，所以我们在发送端进行组装，直到 then 被调用。
   - 而 then 属性之所以无效，是因为我们需要借用 await 语法糖来实现最终的指令发送。
2. Holder.AsyncProxy
   > 异步代理
   - 本质上和 Holder 一样，还是 Proxy，只是修改了 Proxy 的处理函数。
   - 但至少确定了远端有对应的值，而不是异常（可能是引用对象，也可能是可克隆的对象）。
   - 相比于 Proxy，Proxy 只能代理 object。
   - 而 AsyncProxy 是一个异步代理器，本质是一个`function`，所以能代理任意种类的对象，包括 number、string、null 等 primitive 类型的值。
3. Primitive
   > 可复制的原始值
   - 在 AsyncProxy 中，我们已经明确知道远端的对象到底是一个什么类型的值。
   - 只不过 AsyncProxy 和 Holder 仍然是同一个 Proxy 对象，只是换了一个逻辑核心而已。
   - 在使用`await AsyncProxy`后，如果可以，则可能得到。
   - 如果需要强制转换，可以使用`await AsyncProxy[Symbol.toPrimitive](hit: "number"|"string")`来实现。

## 与 ComlinkSync 的对比

本质的差异可以通过 ModelTransfer 来区别出来。在 ComlinkCore 中，ModelTransfer 是一个抽象构造函数，它需要子类实现 InOutBinary2Any 这个方法。

在 ComlinkSync 的 SyncModelTransfer.InOutBinary2Any 中，可以看到它本质是通过对不可克隆对象的使用 Proxy（我们下面称之为 SyncProxy）来达成的。

但在 ComlinkAsync 中，我们则是围绕 Holder 来进行实现，这从 import 的起点便是如此。await 关键字在这里充当一个语法糖，意味着等待远端执行完任务并解码。解码的结果要么是 Primitive，要么还是 Holder。

但因为 Holder 的局限性，比如不能做 instanceof、typeof、Number(holder)、String(holder) 等等操作，我们提供了 HolderReflect 来实现这一系列的功能（并且拥有安全类型的接口风格）。
