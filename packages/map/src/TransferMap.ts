import { MODE_TRANSFER_TYPES_MAP, ANY_TRANSFER_TYPES } from "./const";

export class TransferMap<KV extends BFChainComlink.TransferKeyValue>
  implements BFChainComlink.TransferMap<KV> {
  constructor(entries?: ReadonlyArray<readonly [KV["Key"], KV["Any"]]> | null) {
    if (entries) {
      for (const item of entries) {
        this.set(item[0], item[1]);
      }
    }
  }
  /**
   * TransferType and TransferHandlers mapping.
   */
  protected _map: BFChainComlink.TransferMap.TypeTransferMap<KV> = {
    both: new Map(),
    serialize: new Map(),
    deserialize: new Map()
  };

  /**
   * TransferName and TransferType mapping
   */
  protected _nameTypeMap: BFChainComlink.TransferMap.NameTypeMap<
    KV["Key"]
  > = new Map();

  set(name: KV["Key"], transfer: KV["SourceAny"]): void {
    throw new Error("Method not implemented.");
  }
  get<M extends BFChainComlink.TransferMap.TypeModel>(
    name: KV["Key"],
    mode: M = "any" as M
  ): BFChainComlink.TransferMap.Transfer<M, KV> | undefined {
    for (const type of MODE_TRANSFER_TYPES_MAP[mode]) {
      const transfer = this._map[type].get(name);
      if (transfer) {
        return transfer as BFChainComlink.TransferMap.Transfer<M, KV>;
      }
    }
  }
  has(
    name: KV["Key"],
    mode = "any" as BFChainComlink.TransferMap.TypeModel
  ): boolean {
    return MODE_TRANSFER_TYPES_MAP[mode].some(type =>
      this._map[type].has(name)
    );
  }
  delete(name: KV["Key"]): boolean {
    const oldType = this._nameTypeMap.get(name);
    if (oldType) {
      this._nameTypeMap.delete(name);
      return this._map[oldType].delete(name);
    }
    return false;
  }
  clear(): void {
    for (const type of ANY_TRANSFER_TYPES) {
      this._map[type].clear();
    }
  }
  forEach<M extends BFChainComlink.TransferMap.TypeModel, THIS = unknown>(
    callbackfn: (
      value: BFChainComlink.TransferMap.Transfer<M, KV>,
      key: KV["Key"],
      map: THIS
    ) => void,
    thisArg?: THIS | undefined,
    mode = "any" as M
  ): void {
    for (const type of MODE_TRANSFER_TYPES_MAP[mode]) {
      this._map[type].forEach(callbackfn as any, thisArg);
    }
  }
  get size() {
    return ANY_TRANSFER_TYPES.reduce(
      (size, type) => size + this._map[type].size,
      0
    );
  }
  getSize<M extends BFChainComlink.TransferMap.TypeModel>(
    mode = "any" as M
  ): number {
    let size = 0;
    for (const type of MODE_TRANSFER_TYPES_MAP[mode]) {
      size = +this._map[type].size;
    }
    return size;
  }
  /** Returns an iterable of entries in the map. */
  [Symbol.iterator]<M extends BFChainComlink.TransferMap.TypeModel>(
    mode = "any" as M
  ): Generator<[KV["Key"], BFChainComlink.TransferMap.Transfer<M, KV>]> {
    return this.entries<M>(mode);
  }
  /**
   * Returns an iterable of key, value pairs for every entry in the map.
   */
  *entries<M extends BFChainComlink.TransferMap.TypeModel>(mode = "any" as M) {
    for (const type of MODE_TRANSFER_TYPES_MAP[mode]) {
      yield* this._map[type].entries() as IterableIterator<
        [KV["Key"], BFChainComlink.TransferMap.Transfer<M, KV>]
      >;
    }
  }
  /**
   * Returns an iterable of keys in the map
   */
  *keys(mode: BFChainComlink.TransferMap.TypeModel = "any") {
    for (const type of MODE_TRANSFER_TYPES_MAP[mode]) {
      yield* this._map[type].keys();
    }
  }
  /**
   * Returns an iterable of values in the map
   */
  *values<M extends BFChainComlink.TransferMap.TypeModel>(mode = "any" as M) {
    for (const type of MODE_TRANSFER_TYPES_MAP[mode]) {
      yield* this._map[type].values() as IterableIterator<
        BFChainComlink.TransferMap.Transfer<M, KV>
      >;
    }
  }
}
