export function CallbackToAsync<R, ARGS extends readonly unknown[]>(
  cbCaller: (cb: BFChainComlink.Callback<R>, ...args: ARGS) => void,
  args: ARGS,
  ctx: unknown,
) {
  let syncRet = {
    isError: true,
    error: undefined as any,
  } as BFChainComlink.CallbackArg<R>;

  /// 默认是同步模式
  let syncResolve = (data: R) => {
    syncRet = {
      isError: false,
      data,
    };
  };
  let syncReject = (err?: unknown): unknown => {
    throw err;
  };
  /// 执行，并尝试同步
  cbCaller.call(
    ctx,
    (ret) => {
      if (ret.isError) {
        syncReject(ret.error);
      } else {
        syncResolve(ret.data);
      }
    },
    ...args,
  );
  /// 没有得到及时的响应，进入异步模式
  if (syncRet.isError) {
    return new Promise<R>((resolve, reject) => {
      syncResolve = resolve;
      syncReject = reject;
    });
  }
  return syncRet.data;
}
/**
 * ## 强泛型定义的bind实现
 * 这种写法很骚，因为一共定义了两套泛型，一套是由传入的cbCaller提供，一套由返回后，外界的调用者提供
 * 而cbCaller因为被夹在中间，要用于满足外界调用者的类型定义，所以在内部不得不any化
 *
 * ---
 * 但是这种推导也是**有条件的**
 * 举个例子:
 * ```ts
 * cbCaller = <A1>(cb: BFChainComlink.Callback<Result<A1>>, arg1: A1) => void
 * type Result<T> = ...
 * ```
 * 在上面这个例子中,终点在于 `Result<T>`，
 * 在这里 `R = Result<T>`， 同时 `R2 extends R`。
 * 所以当我们要用R2推导出R的时候， T此时就是由外部输入。
 *
 * 此时如果我们是这样定义 `type Result<T extends ...>` 就会可能出现问题。
 * 比如：
 * ```ts
 * cbCaller = <A1 extends keyof T>(cb: BFChainComlink.Callback<Result<T, A1>>, arg1: A1) => void
 * type Result<T, K extends keyof T> = T[K]
 * ```
 * 因为我们把原本有关系的 `Result<T,A1>` 和 `A1`，分解成了`R`与`ARGS`两个没有关系的类型。
 * 也就是说此时`R`与`ARGS`分别独立携带了一份`A1`，而`R`的那份`A1`则是由`R2`继承过去，用于接收外界的输入。
 * 也就会导致，当我们使用`R2`来尝试推理`A1`时，就会与`ARGS`携带进来的`A1`发生冲突。
 * 编译器无法认证到底要使用哪一种。
 */
export function CallbackToAsyncBind<R, ARGS extends readonly unknown[]>(
  cbCaller: (cb: BFChainComlink.Callback<R>, ...args: ARGS) => void,
  ctx: unknown,
) {
  return <R2 extends R>(...args: ARGS) => CallbackToAsync<R2, ARGS>(cbCaller as any, args, ctx);
}

export function isNil(value: unknown): value is undefined | null {
  return value === undefined || value === null;
}
export function isNoNilPrimivite(value: unknown) {
  switch (typeof value) {
    case "bigint":
    case "boolean":
    case "number":
    case "string":
    case "symbol":
      return true;
  }
  return false;
}