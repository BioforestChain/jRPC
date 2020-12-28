export function u8Concat(
  ABC: typeof SharedArrayBuffer | typeof ArrayBuffer,
  u8s: ArrayLike<number>[],
) {
  let totalLen = 0;
  for (const u8 of u8s) {
    totalLen += u8.length;
  }
  const u8a = new Uint8Array(new ABC(totalLen));
  let offsetLen = 0;
  for (const u8 of u8s) {
    u8a.set(u8, offsetLen);
    offsetLen += u8.length;
  }
  return u8a;
}
