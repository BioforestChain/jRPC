import { ComprotoFactroy } from '@bfchain/comproto';

const comproto = ComprotoFactroy.getSingleton();
(function initExtendComprotoCloneableHandler() {
  type errorHandlerObject = {
    name: string,
    message: string,
    stack: string | undefined,
  };

  const addErrorHandler = <T extends ErrorConstructor>(ErrorClass: T, tag: string) => {
    comproto.addClassHandler({
        handlerObj: ErrorClass,
        handlerName: tag,
        serialize(err) {
            return {
                name: err.name,
                message: err.message,
                stack: err.stack,
            };
        },
        deserialize(errorObject: errorHandlerObject) {
            const err = new ErrorClass();
            err.name = errorObject.name;
            err.message = errorObject.message;
            err.stack = errorObject.stack;
            return err;
        },
    });
  };

  // AggregateError
  addErrorHandler(AggregateError, 'AggregateError');
  // // InternalError
  // if (typeof InternalError === "function") {
  //   addErrorHandler(InternalError, 'InternalError');
  // }
  // BigInt64Array
  comproto.addClassHandler({
    handlerObj: BigInt64Array,
    handlerName: "BigInt64Array",
    serialize(arr: BigInt64Array) {
      const i8adv = new DataView(new Int8Array(8 * arr.length).buffer);
      arr.forEach((value, i) => {
        i8adv.setBigInt64(i * 8, value);
      });
      return new Int8Array(i8adv.buffer);
    },
    deserialize(i8a: Int8Array) {
      const u8adv = new DataView(i8a.buffer);
      const len = i8a.length / 8;
      const arr = new BigInt64Array(len);
      for (let i = 0; i < len; i += 1) {
        arr[i] = u8adv.getBigInt64(i * 8);
      }
      return arr;
    },
  });
  // BigUint64Array
  comproto.addClassHandler({
    handlerObj: BigUint64Array,
    handlerName: "BigUint64Array",
    serialize(arr: BigUint64Array) {
      const u8adv = new DataView(new Uint8Array(8 * arr.length).buffer);
      arr.forEach((value, i) => {
        u8adv.setBigUint64(i * 8, value);
      });
      return new Uint8Array(u8adv.buffer);
    },
    deserialize(u8a: Uint8Array) {
      const u8adv = new DataView(u8a.buffer);
      const len = u8a.length / 8;
      const arr = new BigUint64Array(len);
      for (let i = 0; i < len; i += 1) {
        arr[i] = u8adv.getBigUint64(i * 8);
      }
      return arr;
    },
  });
  // DataView
  comproto.addClassHandler({
    handlerObj: DataView,
    handlerName: "DataView",
    serialize(dataview: DataView) {
      return new Uint8Array(dataview.buffer);
    },
    deserialize(u8a: Uint8Array) {
      return new DataView(u8a);
    },
  });
})();



export function addCloneableClassHandler(handler: BFChainComproto.TransferClassHandler) {
  return comproto.addClassHandler(handler);
}

export function deleteCloneableClassHandler(handlerName: string) {
  return comproto.deleteClassHandler(handlerName);
}

function isComprotoHandlable(obj: unknown) {
  return comproto.canHandle(obj);
}

export const serialize = (data: unknown) => {
  return comproto.serialize(data);
};

export const deserialize = (u8: Uint8Array) => {
  return comproto.deserialize(u8);
}

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
  return CLONEABLE_OBJS.has(obj) || isComprotoHandlable(obj);
};
export const markCloneable = (obj: object, canClone: boolean) => {
  if (isComprotoHandlable(obj) === false) {
    throw(new Error(`object ${obj} is not cloneable`));
  }

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
    addCloneableClassHandler: addCloneableClassHandler,
    deleteCloneableClassHandler: deleteCloneableClassHandler,
    serialize: serialize,
    deserialize: deserialize,
  }),
  writable: false,
});
