import { helper } from "@bfchain/link-core";
const CB_TO_SYNC_ERROR = new SyntaxError("could not transfrom to sync function");

export function CallbackToSync<R, ARGS extends unknown[]>(
  cbCaller: (cb: BFChainLink.Callback<R>, ...args: ARGS) => void,
  args: ARGS,
  ctx: unknown,
) {
  let ret = {
    isError: true,
    error: CB_TO_SYNC_ERROR,
  } as BFChainLink.CallbackArg<R>;
  cbCaller.call(ctx, (_ret) => (ret = _ret), ...args);
  return helper.OpenArg(ret);
}
