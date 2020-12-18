import { isObj } from "./helper";
const checkUnregisterToken = (unregisterToken: object) => {
  if (!isObj(unregisterToken)) {
    throw new TypeError(`unregisterToken ('${unregisterToken}') must be an object`);
  }
};
const checkTarget = (target: object) => {
  if (!isObj(target)) {
    throw new TypeError("target must be an object");
  }
};
if (typeof WeakRef === "undefined") {
  const wr = new WeakMap();
  class WeakRef<T extends object> {
    constructor(target: T) {
      checkTarget(target);
      wr.set(this, target);
    }
    deref() {
      return wr.get(this) as T | undefined;
    }
  }
  Object.defineProperty(globalThis, "WeakRef", { value: WeakRef });

  ///
}
if (typeof FinalizationRegistry === "undefined") {
  if (typeof FinalizationGroup !== "undefined") {
    class FinalizationRegistry {
      private fg: FinalizationGroup;
      constructor(cleanupCallback: (heldValue: unknown) => unknown) {
        this.fg = new FinalizationGroup((heldValueIter) => {
          for (const heldValue of heldValueIter) {
            cleanupCallback(heldValue);
          }
        });
      }
      register(target: object, heldValue: unknown, unregisterToken?: object) {
        this.fg.register(target, heldValue, unregisterToken);
      }
      unregister(unregisterToken: object) {
        this.fg.unregister(unregisterToken);
      }
    }
    Object.defineProperty(globalThis, "FinalizationRegistry", {
      value: FinalizationRegistry,
    });
  } else {
    class FinalizationRegistry {
      constructor(cleanupCallback: (heldValue: unknown) => unknown) {}
      register(target: object, heldValue: unknown, unregisterToken?: object) {
        checkTarget(target);
        if (unregisterToken !== undefined) {
          checkUnregisterToken(unregisterToken);
        }
      }
      unregister(unregisterToken: object) {
        checkUnregisterToken(unregisterToken);
      }
    }
    Object.defineProperty(globalThis, "FinalizationRegistry", {
      value: FinalizationRegistry,
    });
  }
}
