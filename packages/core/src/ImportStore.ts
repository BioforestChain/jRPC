export class ImportStore<E = unknown> {
  /**我所导入的 */
  objIdStore = new Map<
    number | Object | symbol,
    {
      id: number;
      ref: /*  typeof Proxy<object|function> */ Object | /* unique  */ symbol;
    }
  >();
  idExtendsStore = new Map<number, E>();
}
// export const importStore = new ImportStore();
