import { ComprotoFactroy } from '@bfchain/comproto';

const comproto = ComprotoFactroy.getSingleton();

export function addCloneableClassHandler(handler: BFChainComproto.TransferClassHandler) {
  return comproto.addClassHandler(handler);
}

export function deleteCloneableClassHandler(handlerName: string) {
  return comproto.deleteClassHandler(handlerName);
}

function canClone(obj: unknown) {
  return comproto.canHandle(obj);
}

const jsonSerializeFlag: number = 0xd5d6;
// import { serialize, deserialize } from "v8";
export const serialize = (data: unknown) => {
  try {
    return comproto.serialize(data);
  } catch (err) {
    // ignore err, use Json.stringify for serialize
  } 

  const json = JSON.stringify(data);
  const u16 = new Uint16Array(json.length + 1);
  u16[0] = jsonSerializeFlag; // add Flag
  for (let i = 0; i < json.length; i++) {
    const code = json.charCodeAt(i);
    if (code >= 65536) {
      throw new RangeError("");
    }
    u16[i + 1] = code;
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
  if (u8[0] + (u8[1] << 8) !== jsonSerializeFlag) {
    try {
      return comproto.deserialize(u8);
    } catch (err) {
      // ignore deserialize error
    }
    return;
  }

  let json = "";
  for (let i = 0; i < u8.byteLength; i += 2) {
    const l = u8[i + 2];
    const h = u8[i + 2 + 1];
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

function isConstructor(obj: any) {
  try {
    new new Proxy(obj, {construct() { return {};}});
    return true;
  } catch (err) {
    return false;
  }
}
type Ctor = (new () => any);
const CLONEABLE_OBJS = new WeakSet<object>();
const CLONEABLE_CTOR = new WeakSet<Ctor>();
export const isMarkedCloneable = (obj: object) => {
  return CLONEABLE_OBJS.has(obj) || CLONEABLE_CTOR.has(obj.constructor as Ctor) || canClone(obj);
};
export const markCloneable = (obj: object | (new () => any), canClone: boolean) => {
  if (isConstructor(obj)) {
    if (canClone) {
      CLONEABLE_CTOR.add(obj as Ctor);
    } else {
      CLONEABLE_CTOR.delete(obj as Ctor);
    }
  } else {
    if (canClone) {
      CLONEABLE_OBJS.add(obj);
    } else {
      CLONEABLE_OBJS.delete(obj);
    }
  }
};

Object.defineProperty(Object, "bfslink", {
  value: Object.freeze({
    isMarkedTransferable: isMarkedTransferable,
    markTransferAble: markTransferAble,
    isMarkedCloneable: isMarkedCloneable,
    markCloneable: markCloneable,
    addCloneableClassHandler: addCloneableClassHandler,
    deleteCloneableClassHandler: deleteCloneableClassHandler,
    serialize: serialize,
    deserialize: deserialize,
  }),
  writable: false,
});
