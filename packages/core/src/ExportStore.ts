export class ExportStore {
  /**提供给远端的refId
   * 远端可以使用locId来进行访问
   */
  refIdAcc = 0;
  /**我所导出的 */
  objIdStore = new Map<
    number | object | string,
    {
      id: number;
      key: string;
      obj: object;
    }
  >();
  /**传输管道引用了多少的对象 */
  portStore = new Map<BFChainComlink.BinaryPort<unknown, unknown>, number>();
}
// export const exportStore = new ExportStore();
