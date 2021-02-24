declare namespace ComlinkProtocol {
  type IOB = EmscriptionLinkRefExtends.InOutObj;
  type IOB_E = EmscriptionLinkRefExtends.IOB_Extends;
  type TB = Uint8Array; // BFChainLink.LinkObj<IOB>;
  type LinkObj = BFChainLink.LinkObj<IOB>;
  type BinaryPort = BFChainLink.BinaryPort<TB>;
  //   type LinkRefItem = BFChainLink.LinkRefItem<REF_E>;
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
    isStatic: boolean;
    /**箭头函数、异步函数 都是无prototype的，这种情况可以直接判定对象不是构造函数 */
    canConstruct: boolean;
    /**是否已经禁止扩展了 */
    status: import("./const").IOB_Extends_Object_Status;
    /**是否延续标准，继承于Function */
    instanceOfFunction: boolean;
    /**@TODO
     * 如果有需要，可以扩展成三种模式
     * 如果是 === Function.prototype.toString，那么可以提供 showSourceCode 与 hideSourceCode 两种策略
     * 如果是 !== Function.prototype.toString，也就是自己实现了toString，那么直接使用最原始的方式进行代理
     */
    toString: RefFunctionToStringDynamicMode | RefFunctionToStringStaticMode;
  };
  type RefFunctionToStringDynamicMode = {
    mode: import("./const").IOB_Extends_Function_ToString_Mode.dynamic;
  };

  type RefFunctionToStringStaticMode = {
    mode: import("./const").IOB_Extends_Function_ToString_Mode.static;
    code: string;
  };
  type FunctionExportDescriptor = {
    showSourceCode?: boolean;
  };
  /**如果是Object，对象属性变更的时候，会发来推送信息 */
  type RefObjectItemExtends = {
    type: import("./const").IOB_Extends_Type.Object;
    status: import("./const").IOB_Extends_Object_Status;
    objType: import("./const").IOB_Extends_Object_Type;
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
  type RefItem<E extends RefItemExtends = RefItemExtends> = {
    type: import("./const").IOB_Type.Ref;
    refId: number;
    extends: E;
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
  type VarItem = {
    type: import("./const").IOB_Type.Var;
    id: number;
  };
  // type LocalSymbolItem = {
  //   type: import("./const").IOB_Type.LocalSymbol;
  //   lsId: number;
  // };

  type InOutObj = InOutObj.Local | InOutObj.Remote | InOutObj.Cmd;
  namespace InOutObj {
    type Local = CloneItem | LocaleItem;
    type Remote = RefItem | RemoteSymbolItem;
    type Cmd = VarItem;
  }
  // | LocalSymbolItem;

  //#endregion
}

interface ObjectConstructor {
  readonly bfslink: Readonly<{
    isMarkedTransferable(object: object): boolean;
    markTransferAble(object: object, canTransfer: boolean): void;
    isMarkedCloneable(object: object): boolean;
    markCloneable(object: object, canClone: boolean): void;
    addCloneableClassHandler(handler: BFChainComproto.TransferClassHandler): void;
    deleteCloneableClassHandler(handlerName: string): void;
    serialize(data: unknown): Uint8Array;
    deserialize(u8: Uint8Array): unknown;
  }>;
}
