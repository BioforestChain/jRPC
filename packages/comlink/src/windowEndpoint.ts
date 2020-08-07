export function windowEndpoint(
  w: BFChainComlink.PostMessageWithOrigin,
  context: BFChainComlink.EventSource = self,
  targetOrigin = "*"
): BFChainComlink.Endpoint {
  return {
    postMessage: (msg: any, transferables: Transferable[]) =>
      w.postMessage(msg, targetOrigin, transferables),
    addEventListener: context.addEventListener.bind(context),
    removeEventListener: context.removeEventListener.bind(context)
  };
}
