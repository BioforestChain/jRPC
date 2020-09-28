export class ExportStore {
  /**提供给远端的 refId|symId
   * 远端可以使用 locId 来进行访问
   */
  accId = 0;
  /**我所导出的符号 */
  symIdStore = new Map<
    number | symbol,
    {
      id: number;
      sym: symbol;
    }
  >();
  /**我所导出的引用对象 */
  objIdStore = new Map<
    /**key */
    | number
    /**obj */
    | object,
    {
      id: number;
      obj: object;
    }
  >();
  /**导出的命名 */
  nameStore = new Map<
    string | number,
    { type: "sym" | "obj"; name: string; id: number }
  >();
  /**传输管道引用了多少的对象 */
  portStore = new Map<BFChainComlink.BinaryPort<unknown, unknown>, number>();
}
// export const exportStore = new ExportStore();
