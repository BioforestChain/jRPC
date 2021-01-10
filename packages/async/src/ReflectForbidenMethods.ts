export class ReflectForbidenMethods {
  private _factory(method: keyof typeof Reflect, errorMessage: string) {
    return Function(
      `return function ${method}Forbiden(){throw new TypeError(\`${errorMessage}\`)}`,
    ) as (this: BFChainLink.HolderReflect<unknown>) => never;
  }

  // nullOrUndefine: reflectForbidenFactory('')
  deleteProperty = this._factory_NoObject("deleteProperty");
  defineProperty = this._factory_NoObject("defineProperty");
  ownKeys = this._factory_NoObject("ownKeys");
  has = this._factory_NoObject("has");
  set = this._factory_NoObject("set");
  get = this._factory_NoObject("get");
  getPrototypeOf = this._factory_NoObject("getPrototypeOf");
  isExtensible = this._factory_NoObject("isExtensible");
  preventExtensions = this._factory_NoObject("preventExtensions");
  setPrototypeOf = this._factory_NoObject("setPrototypeOf");
  private _factory_NoObject(method: keyof typeof Reflect) {
    return this._factory(method, `Reflect.${method} called on non-object(\${this.name})`);
  }

  apply = this._factory("apply", "[holder ${this.name}] is not a function");
  construct = this._factory("apply", "[holder ${this.name}] is not a constructor");

  //   nilConvert = this._factory(
  //     "deleteProperty",
  //     "Cannot convert ${this.name}(undefined or null) to object",
  //   );
  //   nilSet = this._factory(
  //     "defineProperty",
  //     "Cannot set property '${arguments[0]}' of ${this.name}(undefined or null)",
  //   );
  nilGet = this._factory(
    "defineProperty",
    "Cannot read property '${arguments[0]}' of ${this.name}(undefined or null)",
  );
  //   nilIn = this._factory(
  //     "has",
  //     "Cannot use 'in' operator to search for '${arguments[0]}' in ${this.name}(undefined or null)",
  //   );
}
