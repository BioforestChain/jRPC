class U32Reader {
  private _u32 = new Uint32Array(1);
  private _u8 = new Uint8Array(this._u32.buffer);
  setByU8(u8: Uint8Array) {
    this._u8.set(u8);
    return this;
  }
  getU32() {
    return this._u32[0];
  }
}
export const u32Reader = new U32Reader();
