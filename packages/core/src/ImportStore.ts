export class ImportStore<E = unknown> {
//   /**导入的符号 */
//   symIdStore = new Map<
//     number | symbol,
//     {
//       id: number;
//       sym: symbol;
//     }
//   >();
  /**我所导入的引用对象 */
  proxyIdStore = new Map<
    number | Object | symbol,
    {
      id: number;
      proxy: /*  typeof Proxy<object|function> */ Object | /* unique  */ symbol;
    }
  >();
  /**导入的命名 */
  nameStore = new Map<
    string | number,
    { type: "sym" | "obj"; name: string; id: number }
  >();
  idExtendsStore = new Map<number, E>();
}
// export const importStore = new ImportStore();
