import { MODE_TRANSFER_TYPES_MAP, ANY_TRANSFER_TYPES } from "./const";

export class TransferHandlerMap {
  constructor(
    entries?: ReadonlyArray<
      readonly [BFChainComlinkMap.Name, BFChainComlinkMap.TransferHandler.Any]
    > | null
  ) {
    if (entries) {
      for (const item of entries) {
        this.set(item[0], item[1]);
      }
    }
  }
  /**
   * TransferType and TransferHandlers mapping.
   */
  /* private */ _map: BFChainComlinkMap.TypeTransferHandlersMap = {
    both: new Map(),
    serialize: new Map(),
    deserialize: new Map()
  };

  /**
   * TransferName and TransferType mapping
   */
  private _nameTypeMap: BFChainComlinkMap.NameTypeMap = new Map();

  set(
    name: BFChainComlinkMap.Name,
    transferHandler: BFChainComlinkMap.TransferHandler.Any
  ) {
    /// try remove old one first. ensure transferHandler exists in one map only
    this.delete(name);

    let type: BFChainComlinkMap.Type;
    if ("canHandle" in transferHandler) {
      if ("deserialize" in transferHandler) {
        type = "both";
        this._map[type].set(name, {
          type,
          canHandle: transferHandler.canHandle,
          serialize: transferHandler.serialize,
          deserialize: transferHandler.deserialize
        });
      } else {
        type = "serialize";
        this._map[type].set(name, {
          type,
          canHandle: transferHandler.canHandle,
          serialize: transferHandler.serialize
        });
      }
    } else {
      type = "deserialize";
      this._map[type].set(name, {
        type,
        deserialize: transferHandler.deserialize
      });
    }
    /// falg the TransferName's TransferType
    this._nameTypeMap.set(name, type);
  }

  get<M extends BFChainComlinkMap.TypeModel>(
    name: BFChainComlinkMap.Name,
    mode: M = "any" as M
  ) {
    for (const type of MODE_TRANSFER_TYPES_MAP[mode]) {
      const transferHandler = this._map[type].get(name);
      if (transferHandler) {
        return transferHandler as BFChainComlinkMap.Handler<M>;
      }
    }
  }

  has(name: BFChainComlinkMap.Name, mode: BFChainComlinkMap.TypeModel = "any") {
    return MODE_TRANSFER_TYPES_MAP[mode].some(type =>
      this._map[type].has(name)
    );
  }

  delete(name: BFChainComlinkMap.Name) {
    const oldType = this._nameTypeMap.get(name);
    if (oldType) {
      return this._map[oldType].delete(name);
    }
    return false;
  }

  clear() {
    for (const type of ANY_TRANSFER_TYPES) {
      this._map[type].clear();
    }
  }
  forEach<M extends BFChainComlinkMap.TypeModel>(
    callbackfn: (
      value: BFChainComlinkMap.Handler<M>,
      key: BFChainComlinkMap.Name,
      map: ReadonlyMap<BFChainComlinkMap.Name, BFChainComlinkMap.Handler<M>>
    ) => void,
    thisArg?: any,
    mode: M = "any" as M
  ) {
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
  getSize(mode: BFChainComlinkMap.TypeModel = "any") {
    let size = 0;
    for (const type of MODE_TRANSFER_TYPES_MAP[mode]) {
      size = +this._map[type].size;
    }
    return size;
  }

  /** Returns an iterable of entries in the map. */
  [Symbol.iterator]<M extends BFChainComlinkMap.TypeModel>(
    mode: M = "any" as M
  ) {
    return this.entries<M>(mode);
  }

  /**
   * Returns an iterable of key, value pairs for every entry in the map.
   */
  *entries<M extends BFChainComlinkMap.TypeModel>(mode: M = "any" as M) {
    for (const type of MODE_TRANSFER_TYPES_MAP[mode]) {
      yield* this._map[type].entries() as IterableIterator<
        [BFChainComlinkMap.Name, BFChainComlinkMap.Handler<M>]
      >;
    }
  }

  /**
   * Returns an iterable of keys in the map
   */
  *keys(mode: BFChainComlinkMap.TypeModel = "any") {
    for (const type of MODE_TRANSFER_TYPES_MAP[mode]) {
      yield* this._map[type].keys();
    }
  }

  /**
   * Returns an iterable of values in the map
   */
  *values<M extends BFChainComlinkMap.TypeModel>(mode: M = "any" as M) {
    for (const type of MODE_TRANSFER_TYPES_MAP[mode]) {
      yield* this._map[type].values() as IterableIterator<
        BFChainComlinkMap.Handler<M>
      >;
    }
  }
}
