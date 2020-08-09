declare namespace BFChainComlink {
  //#region map-key=value
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
  //#endregion

  //#region 通用Map
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

    type MapValueType<M extends Map<unknown, unknown>> = M extends Map<
      unknown,
      infer U
    >
      ? U
      : never;

    type Transfer<
      M extends TypeModel,
      VK extends TransferKeyValue
    > = MapValueType<TypeTransferMap<VK>[ModelTypes<M>]>;
  }
  //#endregion

  //#region hanlder

  namespace TransferHandler {
    type Key = TransferKey;
    interface SerializeOnly<I = unknown, S = unknown, TA = Transferable>
      extends Omit<TransferHandler<I, S, I, TA>, "deserialize"> {}
    interface DeserializeOnly<I = unknown, S = unknown, TA = Transferable>
      extends Pick<TransferHandler<I, S, I, TA>, "deserialize"> {}
    type Any<I = unknown, S = unknown, TA = Transferable> =
      | TransferHandler<I, S, I, TA>
      | SerializeOnly<I, S, TA>
      | DeserializeOnly<I, S, TA>;
  }
  type TransferHanlderKeyValue<
    I = unknown,
    S = unknown,
    TA = Transferable
  > = TransferKeyValue<
    TransferHandler.Key,
    TransferHandler<I, S, I, TA>,
    TransferHandler.SerializeOnly<I, S, TA>,
    TransferHandler.DeserializeOnly<I, S, TA>
  >;
  //#endregion

  //#region class

  namespace TransferClass {
    type Key = TransferKey;

    type CtorWithSymbol<C extends AnyClass = AnyClass> = C & {
      prototype: InstanceType<C> & TransferAbleInstance;
    };
    interface TransferAbleInstance {
      [TRANSFER_SYMBOL]: Key;
    }

    //#region In
    interface IBoth<
      C extends AnyClass = AnyClass,
      S = unknown,
      TA = Transferable
    > extends TransferClass<C, S, TA> {}
    interface ISerializeOnly<
      C extends AnyClass = AnyClass,
      S = unknown,
      TA = Transferable
    > extends Omit<TransferClass<C, S, TA>, "deserialize"> {}
    interface IDeserializeOnly<
      C extends AnyClass = AnyClass,
      S = unknown,
      TA = Transferable
    > extends Pick<TransferClass<C, S, TA>, "deserialize"> {}
    type IAny<C extends AnyClass = AnyClass, S = unknown, TA = Transferable> =
      | IBoth<C, S, TA>
      | ISerializeOnly<C, S, TA>
      | IDeserializeOnly<C, S, TA>;
    //#endregion

    //#region Out
    interface Both<
      C extends AnyClass = AnyClass,
      S = unknown,
      TA = Transferable
    > extends IBoth<C, S, TA> {
      ctor: CtorWithSymbol<C>;
    }
    interface SerializeOnly<
      C extends AnyClass = AnyClass,
      S = unknown,
      TA = Transferable
    > extends ISerializeOnly<C, S, TA> {
      ctor: CtorWithSymbol<C>;
    }
    interface DeserializeOnly<
      C extends AnyClass = AnyClass,
      S = unknown,
      TA = Transferable
    > extends IDeserializeOnly<C, S, TA> {}

    type Any<C extends AnyClass = AnyClass, S = unknown, TA = Transferable> =
      | Both<C, S, TA>
      | SerializeOnly<C, S, TA>
      | DeserializeOnly<C, S, TA>;
    //#endregion
  }
  type TransferClassKeyValue<
    C extends AnyClass = AnyClass,
    S = unknown,
    TA = Transferable
  > = TransferKeyValue<
    TransferClass.Key,
    TransferClass.IBoth<C, S, TA>,
    TransferClass.ISerializeOnly<C, S, TA>,
    TransferClass.IDeserializeOnly<C, S, TA>,
    TransferClass.Both<C, S, TA>,
    TransferClass.SerializeOnly<C, S, TA>,
    TransferClass.DeserializeOnly<C, S, TA>
  >;
  //#endregion

  //#region proto
  namespace TransferProto {
    type Key = TransferKey;
    type TransferAbleInstance<V = unknown> = TransferMarked<Key, V>;

    interface SerializeOnly<I = unknown, S = unknown, TA = Transferable>
      extends Omit<TransferProto<I, S, I, TA>, "deserialize"> {}
    interface DeserializeOnly<I = unknown, S = unknown, TA = Transferable>
      extends Pick<TransferProto<I, S, I, TA>, "deserialize"> {}
    type Any<I = unknown, S = unknown, TA = Transferable> =
      | TransferProto<I, S, I, TA>
      | SerializeOnly<I, S, TA>
      | DeserializeOnly<I, S, TA>;
  }
  type TransferProtoKeyValue<
    I = unknown,
    S = unknown,
    TA = Transferable
  > = TransferKeyValue<
    TransferProto.Key,
    TransferProto<I, S, I, TA>,
    TransferProto.SerializeOnly<I, S, TA>,
    TransferProto.DeserializeOnly<I, S, TA>
  >;
  //#endregion
}
