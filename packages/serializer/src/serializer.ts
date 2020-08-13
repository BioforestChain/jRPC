import type { TransferRepo } from "@bfchain/comlink-map";
import { SerializationTag } from "./const";

const TypedArray = Object.getPrototypeOf(Uint8Array.prototype).constructor;

export class ValueSerializer<TA = unknown> {
  constructor(private tp: TransferRepo<TA>) {}
  private transferables = new Set<TA>();
  private head: number[] = [];
  private flat = new Map<unknown, number>();
  private _ph(ptr: number) {
    this.head[this.head.length] = ptr;
  }

  private _pf(val: unknown) {
    let ptr = this.flat.get(val);
    if (ptr === undefined) {
      ptr = this.flat.size;
      this.flat.set(val, ptr);
    }
    return ptr;
  }

  writeHeader() {}
  writeAny(item: unknown): number | undefined {
    switch (typeof item) {
      case "object": {
        return this.writeObject(item);
      }
      case "number": {
        return this.writeNumber(item);
      }
      case "undefined": {
        return this.writeUndefined();
      }
      case "string": {
        return this.writeString(item);
      }
      case "bigint": {
        return this.writeBigInt(item);
      }
      case "boolean": {
        return this.writeBool(item);
      }
      case "symbol": {
        return this.writeSymbol(item);
      }
      // ignore "symbol", "function"
    }
  }
  writeObject(obj: object | null) {
    if (obj === null) {
      return this.writeNull();
    }

    const wireValue = this.tp.fastToWireValue(obj);
    if (wireValue) {
      return this.writeWire(wireValue);
    }

    if (obj instanceof ArrayBuffer || obj instanceof TypedArray) {
      return this._pf(obj);
    }
    if (obj instanceof Array) {
      const arrayFlat = [SerializationTag.Object];
      for (const item of obj) {
      }
    }

    const objectFlat = [SerializationTag.Object];
    for (const key in obj) {
      if (typeof key !== "string") {
        return;
      }
      const value = Reflect.get(obj, key);
      const vPtr = this.writeAny(value);
      if (vPtr !== undefined) {
        const kPtr = this.writeString(key);
        objectFlat.push(kPtr, vPtr);
      }
    }
    return this._pf(objectFlat);
  }
  writePair(key: string, value: unknown) {
    const vPtr = this.writeAny(value);
    if (vPtr !== undefined) {
      const kPtr = this.writeString(key);
      return [kPtr, vPtr];
    }
  }
  writeBool(bool: boolean) {
    return this._pf(bool);
  }
  writeSymbol(sym: symbol) {
    const key = Symbol.keyFor(sym);
    return key !== undefined ? this._pf([SerializationTag.Symbol, key]) : key;
  }
  writeNull() {
    return this._pf(null);
  }
  writeUndefined() {
    return this._pf(undefined);
  }
  writeNumber(num: number) {
    return this._pf(num);
  }
  writeString(str: string) {
    return this._pf(str);
  }
  writeWire(wire: [BFChainComlink.WireValue, TA[]]) {
    for (const ta of wire[1]) {
      this.transferables.add(ta);
    }
    return this._pf(wire[0]);
  }
  writeBigInt(int: bigint) {
    const numInt = Number(int);
    return this._pf([
      SerializationTag.BigInt,
      numInt > Number.MAX_SAFE_INTEGER ? numInt : String(int)
    ]);
  }
}
