import { ComprotoFactory } from '@bfchain/comproto';

const comproto = ComprotoFactory.getSingleton();

function initExtendComprotoCloneableHandler() {
  // AggregateError
  if (typeof AggregateError === "function") {
    comproto.addClassHandler({
      handlerObj: AggregateError,
      handlerName: "AggregateError",
      serialize(err: AggregateError) {
        return {
          name: err.name,
          message: err.message,
          stack: err.stack,
          errors: err.errors,
        };
      },
      deserialize(errorObject: { name: string, message: string, stack: string | undefined, errors: Error[] }) {
        const err = new AggregateError(errorObject.errors, errorObject.message);
        err.name = errorObject.name;
        err.stack = errorObject.stack;
        return err;
      },
    });
  }
  //InternalError
  if (typeof InternalError === "function") {
    comproto.addClassHandler({
      handlerObj: InternalError,
      handlerName: "InternalError",
      serialize(err: InternalError) {
        return {
          name: err.name,
          message: err.message,
          stack: err.stack,
          fileName: err.fileName,
          lineNumber: err.lineNumber,
        };
      },
      deserialize(errorObject: {name: string, message: string, stack: string | undefined, fileName:string | undefined, lineNumber: number | undefined}) {
        const err = new InternalError(errorObject.message, errorObject.fileName, errorObject.lineNumber);
        err.name = errorObject.name;
        err.stack = errorObject.stack;
        return err;
      },
    });
  }
}

export function addCloneableClassHandler(handler: BFChainComproto.TransferClassHandler) {
  return comproto.addClassHandler(handler);
}

export function deleteCloneableClassHandler(handlerName: string) {
  return comproto.deleteClassHandler(handlerName);
}

let _initExtendComprotoCloneableHandler = false;
function isComprotoHandlable(obj: unknown) {
  // add extend comproto calss Handler
  if (_initExtendComprotoCloneableHandler == false) {
    initExtendComprotoCloneableHandler();
    _initExtendComprotoCloneableHandler = true;
  }

  return comproto.canTransferType(obj) || comproto.canHandle(obj);
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
  return CLONEABLE_OBJS.has(obj);
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
