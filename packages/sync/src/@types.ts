declare namespace BFChainComlink {
  /**
   * IOB : InOutBinary
   * TB : TransferableBinary
   */
  interface ComlinkSync {
    //#region 导入导出
    /**导出
     * 同语法：
     * export default target
     * export const key = target
     */
    export(target: unknown, key?: string): void;
    /**导入
     * 同语法：
     * import ? from port
     * import { key } from port
     */
    import<T>(key?: string): T;
    //#endregion

    // /**释放绑定的通道 */
    // destroy(port: BinaryPort<TB>): boolean;
  }

  type AsyncToSync<T> = T extends (...args: infer ARGS) => infer Return
    ? (...args: ARGS) => Util.Promisify<Return>
    : T;
  type SyncToAsync<T> = T extends (...args: infer ARGS) => infer Return
    ? (...args: ARGS) => Util.Unpromisify<Return>
    : T;
}
