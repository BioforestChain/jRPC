declare var AggregateError: AggregateErrorConstructor;
interface AggregateErrorConstructor {
  new (errors: Error[], message?: string): AggregateError;
  prototype: AggregateError;
}
interface AggregateError extends Error {
  errors: Error[];
}

declare var InternalError: InternalErrorConstructor;
interface InternalErrorConstructor extends ErrorConstructor {
  new (message?: string, fileName?: string, lineNumber?: number): InternalError;
  prototype: InternalError;
}
interface InternalError extends Error {
  fileName?: string;
  lineNumber?: number;
}

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
