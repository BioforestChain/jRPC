declare namespace InnerComlink {
  type IOB = EmscriptionLinkRefExtends.InOutObj;
  type IOB_E = EmscriptionLinkRefExtends.IOB_Extends;
  type TB = BFChainComlink.LinkObj<IOB>;
  type LinkObj = TB;
  type BinaryPort = BFChainComlink.BinaryPort<TB>;
  //   type LinkRefItem = BFChainComlink.LinkRefItem<REF_E>;
}

/**js语言的引用扩展格式 */
declare namespace EmscriptionLinkRefExtends {
  //#region 对象类型：引用（双向）、克隆、缺省
  type RefItemExtends =
    | {
        /**如果是function，那么call、apply就使用本地 */
        type: "function";
        isAsync: boolean;
        name: string;
        length: number;
      }
    | {
        type: "object";
        /**针对 PromiseLike，then使用本地 */
        hasThen: boolean;
      };
  type RemoteSymbolItemExtends = {
    type: "symbol";
    unique: boolean;
    description: string;
  };
  type IOB_Extends = RefItemExtends | RemoteSymbolItemExtends;

  type CloneItem = {
    type: import("./const").IOB_Type.Clone;
    data: unknown;
  };
  type RefItem = {
    type: import("./const").IOB_Type.Ref;
    refId: number;
    extends: RefItemExtends;
  };
  type RemoteSymbolItem = {
    type: import("./const").IOB_Type.RemoteSymbol;
    refId: number;
    extends: RemoteSymbolItemExtends;
  };
  type LocaleItem = {
    type: import("./const").IOB_Type.Locale;
    locId: number;
  };
  // type LocalSymbolItem = {
  //   type: import("./const").IOB_Type.LocalSymbol;
  //   lsId: number;
  // };

  type InOutObj = CloneItem | RefItem | LocaleItem | RemoteSymbolItem;
  // | LocalSymbolItem;

  //#endregion
}
