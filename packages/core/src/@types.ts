declare var AggregateError: Function;
declare var InternalError: Function;
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
