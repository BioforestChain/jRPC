declare namespace BFChainComlinkMap {
    namespace TransferHandler {
        interface SerializeOnly extends Omit<BFChainComlink.TransferHandler, "deserialize"> {
        }
        interface DeserializeOnly extends Pick<BFChainComlink.TransferHandler, "deserialize"> {
        }
        type Any = BFChainComlink.TransferHandler | SerializeOnly | DeserializeOnly;
    }
    type Name = string;
    type TypeTransferHandlersMap = {
        both: Map<Name, Both>;
        serialize: Map<Name, SerializeOnly>;
        deserialize: Map<Name, DeserializeOnly>;
    };
    type NameTypeMap = Map<Name, Type>;
    type Type = keyof TypeTransferHandlersMap;
    type TypeModel = keyof typeof import("./const").MODE_TRANSFER_TYPES_MAP;
    type TYPES_KEYS<T extends ReadonlyArray<Type>> = T[0] | (T[1] extends undefined ? never : T[1]) | (T[2] extends undefined ? never : T[2]);
    /**
     * use **extends** checker, to make some type which is <extends TypeModel> can work to.
     * @type { TYPES_KEYS<typeof MODE_TRANSFER_TYPES_MAP[T]> }
     */
    type ModelTypes<T extends TypeModel> = T extends TypeModel ? TYPES_KEYS<typeof import("./const").MODE_TRANSFER_TYPES_MAP[T]> : never;
    type MapValueType<M extends Map<any, any>> = M extends Map<any, infer U> ? U : never;
    type Handler<M extends TypeModel> = MapValueType<TypeTransferHandlersMap[ModelTypes<M>]>;
    interface Both extends BFChainComlink.TransferHandler {
        type: "both";
    }
    interface SerializeOnly extends TransferHandler.SerializeOnly {
        type: "serialize";
    }
    interface DeserializeOnly extends TransferHandler.DeserializeOnly {
        type: "deserialize";
    }
    type Any = Both | SerializeOnly | DeserializeOnly;
}
//# sourceMappingURL=@types.d.ts.map