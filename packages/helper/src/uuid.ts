const _uid_acc = new Uint32Array(1);
export function generateUUID(): BFChainComlink.MessageID {
  return _uid_acc[0]++;
}
