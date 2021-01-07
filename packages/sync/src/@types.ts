declare namespace BFChainComlink {
  /**
   * IOB : InOutBinary
   * TB : TransferableBinary
   */
  interface ComlinkSync extends ComlinkCore {
    /**导入
     * 同语法：
     * import ? from port
     * import { key } from port
     */
    import<T>(key?: string): T;
  }

  type AsyncToSync<T> = T extends (...args: infer ARGS) => infer Return
    ? (...args: ARGS) => Util.Promisify<Return>
    : T;
  type SyncToAsync<T> = T extends (...args: infer ARGS) => infer Return
    ? (...args: ARGS) => Util.Unpromisify<Return>
    : T;
}
