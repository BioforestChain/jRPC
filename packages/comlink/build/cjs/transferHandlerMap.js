"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransferHandlerMap = void 0;
const ANY_TRANSFER_TYPES = ["deserialize", "serialize", "both"];
const DESERIALIZABLE_TRANSFER_TYPES = ["deserialize", "both"];
const SERIALIZABLE_TRANSFER_TYPES = ["serialize", "both"];
const DESERIALIZEONLY_TRANSFER_TYPES = ["deserialize"];
const SERIALIZEONLY_TRANSFER_TYPES = ["serialize"];
const BOTHONLY_TRANSFER_TYPES = ["both"];
const MODE_TRANSFER_TYPES_MAP = {
    any: ANY_TRANSFER_TYPES,
    deserializable: DESERIALIZABLE_TRANSFER_TYPES,
    serializable: SERIALIZABLE_TRANSFER_TYPES,
    deserializeonly: DESERIALIZEONLY_TRANSFER_TYPES,
    serializeonly: SERIALIZEONLY_TRANSFER_TYPES,
    bothonly: BOTHONLY_TRANSFER_TYPES
};
class TransferHandlerMap {
    constructor(entries) {
        /**
         * TransferType and TransferHandlers mapping.
         */
        /* private */ this._map = {
            both: new Map(),
            serialize: new Map(),
            deserialize: new Map()
        };
        /**
         * TransferName and TransferType mapping
         */
        this._nameTypeMap = new Map();
        if (entries) {
            for (const item of entries) {
                this.set(item[0], item[1]);
            }
        }
    }
    set(name, transferHandler) {
        /// try remove old one first. ensure transferHandler exists in one map only
        this.delete(name);
        let type;
        if ("canHandle" in transferHandler) {
            if ("deserialize" in transferHandler) {
                type = "both";
                this._map[type].set(name, {
                    type,
                    canHandle: transferHandler.canHandle,
                    serialize: transferHandler.serialize,
                    deserialize: transferHandler.deserialize
                });
            }
            else {
                type = "serialize";
                this._map[type].set(name, {
                    type,
                    canHandle: transferHandler.canHandle,
                    serialize: transferHandler.serialize
                });
            }
        }
        else {
            type = "deserialize";
            this._map[type].set(name, {
                type,
                deserialize: transferHandler.deserialize
            });
        }
        /// falg the TransferName's TransferType
        this._nameTypeMap.set(name, type);
    }
    get(name, mode = "any") {
        for (const type of MODE_TRANSFER_TYPES_MAP[mode]) {
            const transferHandler = this._map[type].get(name);
            if (transferHandler) {
                return transferHandler;
            }
        }
    }
    has(name, mode = "any") {
        return MODE_TRANSFER_TYPES_MAP[mode].some(type => this._map[type].has(name));
    }
    delete(name) {
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
    forEach(callbackfn, thisArg, mode = "any") {
        for (const type of MODE_TRANSFER_TYPES_MAP[mode]) {
            this._map[type].forEach(callbackfn, thisArg);
        }
    }
    get size() {
        return ANY_TRANSFER_TYPES.reduce((size, type) => size + this._map[type].size, 0);
    }
    getSize(mode = "any") {
        let size = 0;
        for (const type of MODE_TRANSFER_TYPES_MAP[mode]) {
            size = +this._map[type].size;
        }
        return size;
    }
    /** Returns an iterable of entries in the map. */
    [Symbol.iterator](mode = "any") {
        return this.entries(mode);
    }
    /**
     * Returns an iterable of key, value pairs for every entry in the map.
     */
    *entries(mode = "any") {
        for (const type of MODE_TRANSFER_TYPES_MAP[mode]) {
            yield* this._map[type].entries();
        }
    }
    /**
     * Returns an iterable of keys in the map
     */
    *keys(mode = "any") {
        for (const type of MODE_TRANSFER_TYPES_MAP[mode]) {
            yield* this._map[type].keys();
        }
    }
    /**
     * Returns an iterable of values in the map
     */
    *values(mode = "any") {
        for (const type of MODE_TRANSFER_TYPES_MAP[mode]) {
            yield* this._map[type].values();
        }
    }
}
exports.TransferHandlerMap = TransferHandlerMap;
//# sourceMappingURL=transferHandlerMap.js.map