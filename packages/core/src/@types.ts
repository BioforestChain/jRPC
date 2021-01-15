declare var AggregateError: AggregateErrorConstructor;
interface AggregateErrorConstructor extends ErrorConstructor {
  new (message?: string): AggregateError;
  prototype: AggregateError;
}
interface AggregateError extends Error {}

declare var InternalError: Function;
interface InternalErrorConstructor extends ErrorConstructor {
  new (message?: string): InternalError;
  prototype: InternalError;
}
interface InternalError extends Error {}

declare var WebAssembly: any;
declare namespace Intl {
  interface ListFormat {}
  const ListFormat: {
    new (): ListFormat;
    prototype: ListFormat;
  };
  interface Locale {}
  const Locale: {
    new (): Locale;
    prototype: Locale;
  };
}

declare namespace BFChainLink {
  type z = Error;
  interface RefStore {
    refRemote(localeObject: object, remoteObject: object): void;
    unrefRemote(localeObject: object): void;
    getRefedObject(localeObject: object): object | undefined;
  }
}

interface ObjectConstructor {
  refRemote: BFChainLink.RefStore["refRemote"];
  unrefRemote: BFChainLink.RefStore["unrefRemote"];
}
