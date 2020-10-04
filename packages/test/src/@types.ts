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

  /**如果是function，那么name、length就使用本地 */
  type RefFunctionItemExtends = {
    type: import("./const").IOB_Extends_Type.Function;
    funType: import("./const").IOB_Extends_Function_Type;
    name: string;
    length: number;
    sourceCode: string;
  };
  type FunctionExportDescriptor = {
    protectSourceCode?: boolean;
  };
  /**如果是Object，对象属性变更的时候，会发来推送信息 */
  type RefObjectItemExtends = {
    type: import("./const").IOB_Extends_Type.Object;
    status: import("./const").IOB_Extends_Object_Status;
  };

  type RemoteSymbolItemExtends = {
    type: import("./const").IOB_Extends_Type.Symbol;
    /**是否是使用Symbol.keyFor生成的 */
    unique: boolean;
    /**是否是全局的，绑定在Symbol对象本身上面 */
    global: boolean;
    description: string;
  };
  type RefItemExtends = RefFunctionItemExtends | RefObjectItemExtends;

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
