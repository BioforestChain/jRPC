import { helper } from "@bfchain/comlink-core";
const CB_TO_SYNC_ERROR = new SyntaxError("could not transfrom to sync function");

export function CallbackToSync<R, ARGS extends unknown[]>(
  cbCaller: (cb: BFChainComlink.Callback<R>, ...args: ARGS) => void,
  args: ARGS,
  ctx: unknown,
) {
  let ret = {
    isError: true,
    error: CB_TO_SYNC_ERROR,
  } as BFChainComlink.CallbackArg<R>;
  cbCaller.call(ctx, (_ret) => (ret = _ret), ...args);
  return helper.OpenArg(ret);
}
