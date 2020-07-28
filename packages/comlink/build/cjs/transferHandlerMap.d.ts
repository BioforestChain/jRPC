export interface TransferHandler {
    canHandle(obj: any): boolean;
    serialize(obj: any): [any, Transferable[]];
    deserialize(obj: any): any;
}
export declare namespace TransferHandler {
    interface SerializeOnly extends Omit<TransferHandler, "deserialize"> {
    }
    interface DeserializeOnly extends Pick<TransferHandler, "deserialize"> {
    }
    type Any = TransferHandler | SerializeOnly | DeserializeOnly;
}
declare type MapValueType<M extends Map<any, any>> = M extends Map<any, infer U> ? U : never;
declare namespace TransferHandlerMap {
    export type Name = string;
    export type Type = keyof TransferHandlerMap["_map"];
    export type TypeModel = keyof typeof MODE_TRANSFER_TYPES_MAP;
    type TYPES_KEYS<T extends ReadonlyArray<Type>> = T[0] | (T[1] extends undefined ? never : T[1]) | (T[2] extends undefined ? never : T[2]);
    /**
     * use **extends** checker, to make some type which is <extends TypeModel> can work to.
     * @type { TYPES_KEYS<typeof MODE_TRANSFER_TYPES_MAP[T]> }
     */
    export type ModelTypes<T extends TypeModel> = T extends TypeModel ? TYPES_KEYS<typeof MODE_TRANSFER_TYPES_MAP[T]> : never;
    export type Handler<M extends TypeModel> = MapValueType<TransferHandlerMap["_map"][TransferHandlerMap.ModelTypes<M>]>;
    export interface Both extends TransferHandler {
        type: "both";
    }
    export interface SerializeOnly extends TransferHandler.SerializeOnly {
        type: "serialize";
    }
    export interface DeserializeOnly extends TransferHandler.DeserializeOnly {
        type: "deserialize";
    }
    export type Any = Both | SerializeOnly | DeserializeOnly;
    export {};
}
declare const MODE_TRANSFER_TYPES_MAP: {
    any: readonly ["deserialize", "serialize", "both"];
    deserializable: readonly ["deserialize", "both"];
    serializable: readonly ["serialize", "both"];
    deserializeonly: readonly ["deserialize"];
    serializeonly: readonly ["serialize"];
    bothonly: readonly ["both"];
};
export declare class TransferHandlerMap {
    constructor(entries?: ReadonlyArray<readonly [TransferHandlerMap.Name, TransferHandler.Any]> | null);
    /**
     * TransferType and TransferHandlers mapping.
     */
    _map: {
        both: Map<string, TransferHandlerMap.Both>;
        serialize: Map<string, TransferHandlerMap.SerializeOnly>;
        deserialize: Map<string, TransferHandlerMap.DeserializeOnly>;
    };
    /**
     * TransferName and TransferType mapping
     */
    private _nameTypeMap;
    set(name: TransferHandlerMap.Name, transferHandler: TransferHandler.Any): void;
    get<M extends TransferHandlerMap.TypeModel>(name: TransferHandlerMap.Name, mode?: M): MapValueType<{
        both: Map<string, TransferHandlerMap.Both>;
        serialize: Map<string, TransferHandlerMap.SerializeOnly>;
        deserialize: Map<string, TransferHandlerMap.DeserializeOnly>;
    }[TransferHandlerMap.ModelTypes<M>]> | undefined;
    has(name: TransferHandlerMap.Name, mode?: TransferHandlerMap.TypeModel): boolean;
    delete(name: TransferHandlerMap.Name): boolean;
    clear(): void;
    forEach<M extends TransferHandlerMap.TypeModel>(callbackfn: (value: TransferHandlerMap.Handler<M>, key: TransferHandlerMap.Name, map: ReadonlyMap<TransferHandlerMap.Name, TransferHandlerMap.Handler<M>>) => void, thisArg?: any, mode?: M): void;
    get size(): number;
    getSize(mode?: TransferHandlerMap.TypeModel): number;
    /** Returns an iterable of entries in the map. */
    [Symbol.iterator]<M extends TransferHandlerMap.TypeModel>(mode?: M): Generator<[string, MapValueType<{
        both: Map<string, TransferHandlerMap.Both>;
        serialize: Map<string, TransferHandlerMap.SerializeOnly>;
        deserialize: Map<string, TransferHandlerMap.DeserializeOnly>;
    }[TransferHandlerMap.ModelTypes<M>]>], void, undefined>;
    /**
     * Returns an iterable of key, value pairs for every entry in the map.
     */
    entries<M extends TransferHandlerMap.TypeModel>(mode?: M): Generator<[string, MapValueType<{
        both: Map<string, TransferHandlerMap.Both>;
        serialize: Map<string, TransferHandlerMap.SerializeOnly>;
        deserialize: Map<string, TransferHandlerMap.DeserializeOnly>;
    }[TransferHandlerMap.ModelTypes<M>]>], void, undefined>;
    /**
     * Returns an iterable of keys in the map
     */
    keys(mode?: TransferHandlerMap.TypeModel): Generator<string, void, undefined>;
    /**
     * Returns an iterable of values in the map
     */
    values<M extends TransferHandlerMap.TypeModel>(mode?: M): Generator<MapValueType<{
        both: Map<string, TransferHandlerMap.Both>;
        serialize: Map<string, TransferHandlerMap.SerializeOnly>;
        deserialize: Map<string, TransferHandlerMap.DeserializeOnly>;
    }[TransferHandlerMap.ModelTypes<M>]>, void, undefined>;
}
export {};
//# sourceMappingURL=transferHandlerMap.d.ts.map