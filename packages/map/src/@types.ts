declare namespace BFChainComlinkMap {
  export namespace TransferHandler {
    interface SerializeOnly
      extends Omit<BFChainComlink.TransferHandler, "deserialize"> {}
    interface DeserializeOnly
      extends Pick<BFChainComlink.TransferHandler, "deserialize"> {}
    type Any = BFChainComlink.TransferHandler | SerializeOnly | DeserializeOnly;
  }

  export type Name = string; //| number;

  type TypeTransferHandlersMap = {
    both: Map<Name, Both>;
    serialize: Map<Name, SerializeOnly>;
    deserialize: Map<Name, DeserializeOnly>;
  };
  type NameTypeMap = Map<Name, Type>;

  export type Type = keyof TypeTransferHandlersMap;
  export type TypeModel = keyof typeof import("./const").MODE_TRANSFER_TYPES_MAP;

  type TYPES_KEYS<T extends ReadonlyArray<Type>> =
    | T[0]
    | (T[1] extends undefined ? never : T[1])
    | (T[2] extends undefined ? never : T[2]);

  /**
   * use **extends** checker, to make some type which is <extends TypeModel> can work to.
   * @type { TYPES_KEYS<typeof MODE_TRANSFER_TYPES_MAP[T]> }
   */
  export type ModelTypes<T extends TypeModel> = T extends TypeModel
    ? TYPES_KEYS<typeof import("./const").MODE_TRANSFER_TYPES_MAP[T]>
    : never;

  type MapValueType<M extends Map<any, any>> = M extends Map<any, infer U>
    ? U
    : never;
  export type Handler<M extends TypeModel> = MapValueType<
    TypeTransferHandlersMap[ModelTypes<M>]
  >;

  export interface Both extends BFChainComlink.TransferHandler {
    type: "both";
  }
  export interface SerializeOnly extends TransferHandler.SerializeOnly {
    type: "serialize";
  }
  export interface DeserializeOnly extends TransferHandler.DeserializeOnly {
    type: "deserialize";
  }
  export type Any = Both | SerializeOnly | DeserializeOnly;
}
