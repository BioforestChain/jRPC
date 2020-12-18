export function CallbackToAsync<R, ARGS extends readonly unknown[]>(
  cbCaller: (cb: BFChainComlink.Callback<R>, ...args: ARGS) => void,
  args: ARGS,
  ctx: unknown,
) {
  return new Promise<R>((resolve, reject) => {
    cbCaller.call(
      ctx,
      (ret) => {
        if (ret.isError) {
          reject(ret.error);
        } else {
          resolve(ret.data);
        }
      },
      ...args,
    );
  });
}
export function CallbackToAsyncBind<R, ARGS extends readonly unknown[]>(
  cbCaller: (cb: BFChainComlink.Callback<R>, ...args: ARGS) => void,
  ctx: unknown,
) {
  /**
   * 强泛型定义
   * 这种写法很骚，因为一共定义了两套泛型，一套是由传入的cbCaller提供，一套由返回后，外界的调用者提供
   * 而cbCaller因为被夹在中间，要用于满足外界调用者的类型定义，所以在内部不得不any化
   */
  return <R2 extends R, ARGS2 extends ARGS>(...args: ARGS2) =>
    CallbackToAsync<R2, ARGS2>(cbCaller as any, args, ctx);
}
