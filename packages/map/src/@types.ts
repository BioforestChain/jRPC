declare namespace BFChainComlink {
  interface TransferKeyValue<
    K = unknown,
    IVB = unknown,
    IVS = unknown,
    IVD = unknown,
    OVB = IVB,
    OVS = IVS,
    OVD = IVD
  > {
    Key: K;
    Both: TransferKeyValue.Both<OVB>;
    SerializeOnly: TransferKeyValue.SerializeOnly<OVS>;
    DeserializeOnly: TransferKeyValue.DeserializeOnly<OVD>;
    Any: TransferKeyValue.Any<OVB, OVS, OVD>;

    SourceBoth: IVB;
    SourceSerializeOnly: IVS;
    SourceDeserializeOnly: IVD;
    SourceAny: IVB | IVS | IVD;
  }
  namespace TransferKeyValue {
    type Both<VB> = VB & {
      type: "both";
    };
    type SerializeOnly<VS> = VS & {
      type: "serialize";
    };
    type DeserializeOnly<VD> = VD & {
      type: "deserialize";
    };
    type Any<VB, VS, VD> = Both<VB> | SerializeOnly<VS> | DeserializeOnly<VD>;
  }

  interface TransferMap<VK extends TransferKeyValue = TransferKeyValue> {
    set(name: VK["Key"], transfer: VK["Any"]): void;
    get<M extends TransferMap.TypeModel>(
      name: VK["Key"],
      mode?: M
    ): TransferMap.Transfer<M, VK> | undefined;
    has(name: VK["Key"], mode?: TransferMap.TypeModel): boolean;
    delete(name: VK["Key"]): boolean;
    clear(): void;
    forEach<M extends TransferMap.TypeModel, THIS = unknown>(
      callbackfn: (
        value: TransferMap.Transfer<M, VK>,
        key: VK["Key"],
        map: THIS
      ) => void,
      thisArg?: THIS,
      mode?: M
    ): void;
    readonly size: number;
    getSize<M extends TransferMap.TypeModel>(mode?: M): number;
    [Symbol.iterator]<M extends TransferMap.TypeModel>(
      mode?: M
    ): Generator<[VK["Key"], TransferMap.Transfer<M, VK>]>;
    entries<M extends TransferMap.TypeModel>(
      mode?: M
    ): Generator<[VK["Key"], TransferMap.Transfer<M, VK>]>;
    keys(mode?: TransferMap.TypeModel): Generator<VK["Key"]>;
    values<M extends TransferMap.TypeModel>(
      mode?: M
    ): Generator<TransferMap.Transfer<M, VK>>;
  }
  namespace TransferMap {
    type TypeTransferMap<VK extends TransferKeyValue = TransferKeyValue> = {
      both: Map<VK["Key"], VK["Both"]>;
      serialize: Map<VK["Key"], VK["SerializeOnly"]>;
      deserialize: Map<VK["Key"], VK["DeserializeOnly"]>;
    };
    type TypeModel = keyof typeof import("./const").MODE_TRANSFER_TYPES_KEY;
    type Type = keyof TypeTransferMap;
    type NameTypeMap<K> = Map<K, Type>;

    type TYPES_KEYS<T extends ReadonlyArray<Type>> =
      | T[0]
      | (T[1] extends undefined ? never : T[1])
      | (T[2] extends undefined ? never : T[2]);

    type ModelTypes<T extends TypeModel> = T extends TypeModel
      ? TYPES_KEYS<typeof import("./const").MODE_TRANSFER_TYPES_MAP[T]>
      : never;

    type MapValueType<M extends Map<any, any>> = M extends Map<any, infer U>
      ? U
      : never;
    type Transfer<
      M extends TypeModel,
      VK extends TransferKeyValue
    > = MapValueType<TypeTransferMap<VK>[ModelTypes<M>]>;
  }

  namespace TransferHandler {
    type Key = string;
    interface SerializeOnly<C = unknown, S = unknown>
      extends Omit<TransferHandler<C, S>, "deserialize"> {}
    interface DeserializeOnly<C = unknown, S = unknown>
      extends Pick<TransferHandler<C, S>, "deserialize"> {}
    type Any<C = unknown, S = unknown> =
      | TransferHandler<C, S>
      | SerializeOnly<C, S>
      | DeserializeOnly<C, S>;
  }
  type TransferHanlderKeyValue = TransferKeyValue<
    TransferHandler.Key,
    TransferHandler,
    TransferHandler.SerializeOnly,
    TransferHandler.DeserializeOnly
  >;

  namespace TransferClass {
    type Key = string;
    const TRANSFER_SYMBOL: unique symbol;
    type TransferSymbol = typeof TRANSFER_SYMBOL;

    type CtorWithSymbol<C extends AnyClass = AnyClass> = C & {
      prototype: InstanceType<C> & TransferAbleInstance;
    };
    interface TransferAbleInstance {
      [TRANSFER_SYMBOL]: Key;
    }

    //#region In
    interface IBoth<C extends AnyClass = AnyClass, S = unknown>
      extends TransferClass<C, S> {}
    interface ISerializeOnly<C extends AnyClass = AnyClass, S = unknown>
      extends Omit<TransferClass<C, S>, "deserialize"> {}
    interface IDeserializeOnly<C extends AnyClass = AnyClass, S = unknown>
      extends Pick<TransferClass<C, S>, "deserialize"> {}
    type IAny<C extends AnyClass = AnyClass, S = unknown> =
      | IBoth<C, S>
      | ISerializeOnly<C, S>
      | IDeserializeOnly<C, S>;
    //#endregion

    //#region Out
    interface Both<C extends AnyClass = AnyClass, S = unknown>
      extends IBoth<C, S> {
      ctor: CtorWithSymbol<C>;
    }
    interface SerializeOnly<C extends AnyClass = AnyClass, S = unknown>
      extends ISerializeOnly<C, S> {
      ctor: CtorWithSymbol<C>;
    }
    interface DeserializeOnly<C extends AnyClass = AnyClass, S = unknown>
      extends IDeserializeOnly<C, S> {}

    type Any<C extends AnyClass = AnyClass, S = unknown> =
      | Both<C, S>
      | SerializeOnly<C, S>
      | DeserializeOnly<C, S>;
    //#endregion
  }
  type TransferClassKeyValue = TransferKeyValue<
    TransferClass.Key,
    TransferClass.IBoth,
    TransferClass.ISerializeOnly,
    TransferClass.IDeserializeOnly,
    TransferClass.Both,
    TransferClass.SerializeOnly,
    TransferClass.DeserializeOnly
  >;

  //   namespace HanlderMap {
  //     //#region Key Value
  //     type Name = string; //| number;
  //     interface Both extends TransferHandler {
  //       type: "both";
  //     }
  //     interface SerializeOnly extends TransferHandler.SerializeOnly {
  //       type: "serialize";
  //     }
  //     interface DeserializeOnly extends TransferHandler.DeserializeOnly {
  //       type: "deserialize";
  //     }
  //     type Any = Both | SerializeOnly | DeserializeOnly;
  //     //#endregion

  //     type TypeTransferHandlersMap = {
  //       both: Map<Name, Both>;
  //       serialize: Map<Name, SerializeOnly>;
  //       deserialize: Map<Name, DeserializeOnly>;
  //     };
  //     type NameTypeMap = Map<Name, Type>;

  //     type Type = keyof TypeTransferHandlersMap;
  //     type TypeModel = keyof typeof import("./const").MODE_TRANSFER_TYPES_MAP;

  //     type TYPES_KEYS<T extends ReadonlyArray<Type>> =
  //       | T[0]
  //       | (T[1] extends undefined ? never : T[1])
  //       | (T[2] extends undefined ? never : T[2]);

  //     type ModelTypes<T extends TypeModel> = T extends TypeModel
  //       ? TYPES_KEYS<typeof import("./const").MODE_TRANSFER_TYPES_MAP[T]>
  //       : never;

  //     type MapValueType<M extends Map<any, any>> = M extends Map<any, infer U>
  //       ? U
  //       : never;
  //     type Handler<M extends TypeModel> = MapValueType<
  //       TypeTransferHandlersMap[ModelTypes<M>]
  //     >;
  //   }

  //   namespace ClassMap {
  //     //#region Key Value
  //     type Name = string; //| number;

  //     interface Both extends TransferClass {
  //       type: "both";
  //     }
  //     interface SerializeOnly extends TransferClass.SerializeOnly {
  //       type: "serialize";
  //     }
  //     interface DeserializeOnly extends TransferClass.DeserializeOnly {
  //       type: "deserialize";
  //     }
  //     type Any = Both | SerializeOnly | DeserializeOnly;
  //     //#endregion

  //     type TypeTransferClassesMap = {
  //       both: Map<Name, Both>;
  //       serialize: Map<Name, SerializeOnly>;
  //       deserialize: Map<Name, DeserializeOnly>;
  //     };
  //     type NameTypeMap = Map<Name, Type>;

  //     type Type = keyof TypeTransferClassesMap;
  //     type TypeModel = keyof typeof import("./const").MODE_TRANSFER_TYPES_MAP;

  //     type TYPES_KEYS<T extends ReadonlyArray<Type>> =
  //       | T[0]
  //       | (T[1] extends undefined ? never : T[1])
  //       | (T[2] extends undefined ? never : T[2]);

  //     type ModelTypes<T extends TypeModel> = T extends TypeModel
  //       ? TYPES_KEYS<typeof import("./const").MODE_TRANSFER_TYPES_MAP[T]>
  //       : never;

  //     type MapValueType<M extends Map<any, any>> = M extends Map<any, infer U>
  //       ? U
  //       : never;
  //     type Handler<M extends TypeModel> = MapValueType<
  //       TypeTransferClassesMap[ModelTypes<M>]
  //     >;
  //   }
}
