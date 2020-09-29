if (typeof WeakRef === "undefined") {
  const isObj = (obj: unknown): obj is object => {
    const targetType = typeof obj;
    return (
      (targetType === "object" || targetType === "function") && obj !== null
    );
  };

  const wr = new WeakMap();
  class WeakRef<T extends object> {
    constructor(target: T) {
      if (!isObj(target)) {
        throw new TypeError("target must be an object");
      }
      wr.set(this, target);
    }
    deref() {
      return wr.get(this) as T | undefined;
    }
  }
  Object.defineProperty(globalThis, "WeakRef", { value: WeakRef });

  ///
  class FinalizationRegistry {
    constructor(cleanupCallback: (heldValue: unknown) => unknown) {}
    register(target: object, heldValue: unknown, unregisterToken?: object) {
      if (unregisterToken !== undefined) {
        this._checkUnregisterToken(unregisterToken);
      }
    }
    unregister(unregisterToken: object) {
      this._checkUnregisterToken(unregisterToken);
    }
    private _checkUnregisterToken(unregisterToken: object) {
      if (!isObj(unregisterToken)) {
        throw new TypeError(
          `unregisterToken ('${unregisterToken}') must be an object`
        );
      }
    }
  }
  Object.defineProperty(globalThis, "FinalizationRegistry", {
    value: FinalizationRegistry,
  });
}
