export declare class TransferHandlerMap {
    constructor(entries?: ReadonlyArray<readonly [BFChainComlinkMap.Name, BFChainComlinkMap.TransferHandler.Any]> | null);
    /**
     * TransferType and TransferHandlers mapping.
     */
    _map: BFChainComlinkMap.TypeTransferHandlersMap;
    /**
     * TransferName and TransferType mapping
     */
    private _nameTypeMap;
    set(name: BFChainComlinkMap.Name, transferHandler: BFChainComlinkMap.TransferHandler.Any): void;
    get<M extends BFChainComlinkMap.TypeModel>(name: BFChainComlinkMap.Name, mode?: M): BFChainComlinkMap.MapValueType<BFChainComlinkMap.TypeTransferHandlersMap[BFChainComlinkMap.ModelTypes<M>]> | undefined;
    has(name: BFChainComlinkMap.Name, mode?: BFChainComlinkMap.TypeModel): boolean;
    delete(name: BFChainComlinkMap.Name): boolean;
    clear(): void;
    forEach<M extends BFChainComlinkMap.TypeModel>(callbackfn: (value: BFChainComlinkMap.Handler<M>, key: BFChainComlinkMap.Name, map: ReadonlyMap<BFChainComlinkMap.Name, BFChainComlinkMap.Handler<M>>) => void, thisArg?: any, mode?: M): void;
    get size(): number;
    getSize(mode?: BFChainComlinkMap.TypeModel): number;
    /** Returns an iterable of entries in the map. */
    [Symbol.iterator]<M extends BFChainComlinkMap.TypeModel>(mode?: M): Generator<[string, BFChainComlinkMap.MapValueType<BFChainComlinkMap.TypeTransferHandlersMap[BFChainComlinkMap.ModelTypes<M>]>], void, undefined>;
    /**
     * Returns an iterable of key, value pairs for every entry in the map.
     */
    entries<M extends BFChainComlinkMap.TypeModel>(mode?: M): Generator<[string, BFChainComlinkMap.MapValueType<BFChainComlinkMap.TypeTransferHandlersMap[BFChainComlinkMap.ModelTypes<M>]>], void, undefined>;
    /**
     * Returns an iterable of keys in the map
     */
    keys(mode?: BFChainComlinkMap.TypeModel): Generator<string, void, undefined>;
    /**
     * Returns an iterable of values in the map
     */
    values<M extends BFChainComlinkMap.TypeModel>(mode?: M): Generator<BFChainComlinkMap.MapValueType<BFChainComlinkMap.TypeTransferHandlersMap[BFChainComlinkMap.ModelTypes<M>]>, void, undefined>;
}
//# sourceMappingURL=transferHandlerMap.d.ts.map