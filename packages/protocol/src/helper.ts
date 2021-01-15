// import { serialize, deserialize } from "v8";
export const serialize = (data: unknown) => {
  const json = JSON.stringify(data);
  const u16 = new Uint16Array(json.length);
  for (let i = 0; i < json.length; i++) {
    const code = json.charCodeAt(i);
    if (code >= 65536) {
      throw new RangeError("");
    }
    u16[i] = code;
  }
  return new Uint8Array(u16.buffer);
  // const u8 = new Uint8Array(json.length);
  // for (let i = 0; i < json.length; i++) {
  //   const code = json.charCodeAt(i);
  //   if (code >= 256) {
  //     throw new RangeError("");
  //   }
  //   u8[i] = code;
  // }
  // return u8;
};
export const deserialize = (u8: Uint8Array) => {
  let json = "";
  for (let i = 0; i < u8.byteLength; i += 2) {
    const l = u8[i];
    const h = u8[i + 1];
    const code = (h << 8) + l;
    json += String.fromCharCode(code);
  }
  // for (const code of u8) {
  //   json += String.fromCharCode(code);
  // }

  return JSON.parse(json);
};

const TRANSFERABLE_OBJS = new WeakSet();
export const isMarkedTransferable = (obj: object) => {
  return TRANSFERABLE_OBJS.has(obj);
};
export const markTransferAble = (obj: object, canTransfer: boolean) => {
  if (canTransfer) {
    TRANSFERABLE_OBJS.add(obj);
  } else {
    TRANSFERABLE_OBJS.delete(obj);
  }
};

const CLONEABLE_OBJS = new WeakSet<object>();
export const isMarkedCloneable = (obj: object) => {
  return CLONEABLE_OBJS.has(obj);
};
export const markCloneable = (obj: object, canClone: boolean) => {
  if (canClone) {
    CLONEABLE_OBJS.add(obj);
  } else {
    CLONEABLE_OBJS.delete(obj);
  }
};
Object.defineProperty(Object, "bfslink", {
  value: Object.freeze({
    isMarkedTransferable: isMarkedTransferable,
    markTransferAble: markTransferAble,
    isMarkedCloneable: isMarkedCloneable,
    markCloneable: markCloneable,
  }),
  writable: false,
});
