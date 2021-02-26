import { helper, Var } from "@bfchain/link-core";
import { EmscriptenReflect } from "@bfchain/link-typings";
import { cleanAllGetterCache, cacheGetter, cleanGetterCache } from "@bfchain/util-decorator";

export function CallbackToAsync<R, ARGS extends readonly unknown[]>(
  cbCaller: (cb: BFChainLink.Callback<R>, ...args: ARGS) => void,
  args: ARGS,
  ctx: unknown,
) {
  let syncRet: BFChainLink.CallbackArg<R> | undefined;

  /// 默认是同步模式
  let syncResolve = (data: R) => {
    syncRet = {
      isError: false,
      data,
    };
  };
  let syncReject = (error: unknown) => {
    syncRet = {
      isError: true,
      error,
    };
  };
  try {
    /// 执行，并尝试同步
    cbCaller.call(
      ctx,
      (ret) => {
        if (ret.isError) {
          syncReject(ret.error);
        } else {
          syncResolve(ret.data);
        }
      },
      ...args,
    );
  } catch (err) {
    syncReject(err);
  }
  /// 得到及时的响应，直接返回
  if (syncRet !== undefined) {
    return helper.OpenArg(syncRet);
  }
  /// 没有得到及时的响应，进入异步模式
  return new Promise<R>((resolve, reject) => {
    syncResolve = resolve;
    syncReject = reject;
  });
}
/**
 * ## 强泛型定义的bind实现
 * 这种写法很骚，因为一共定义了两套泛型，一套是由传入的cbCaller提供，一套由返回后，外界的调用者提供
 * 而cbCaller因为被夹在中间，要用于满足外界调用者的类型定义，所以在内部不得不any化
 *
 * ---
 * 但是这种推导也是**有条件的**
 * 举个例子:
 * ```ts
 * cbCaller = <A1>(cb: BFChainLink.Callback<Result<A1>>, arg1: A1) => void
 * type Result<T> = ...
 * ```
 * 在上面这个例子中,终点在于 `Result<T>`，
 * 在这里 `R = Result<T>`， 同时 `R2 extends R`。
 * 所以当我们要用R2推导出R的时候， T此时就是由外部输入。
 *
 * 此时如果我们是这样定义 `type Result<T extends ...>` 就会可能出现问题。
 * 比如：
 * ```ts
 * cbCaller = <A1 extends keyof T>(cb: BFChainLink.Callback<Result<T, A1>>, arg1: A1) => void
 * type Result<T, K extends keyof T> = T[K]
 * ```
 * 因为我们把原本有关系的 `Result<T,A1>` 和 `A1`，分解成了`R`与`ARGS`两个没有关系的类型。
 * 也就是说此时`R`与`ARGS`分别独立携带了一份`A1`，而`R`的那份`A1`则是由`R2`继承过去，用于接收外界的输入。
 * 也就会导致，当我们使用`R2`来尝试推理`A1`时，就会与`ARGS`携带进来的`A1`发生冲突。
 * 编译器无法认证到底要使用哪一种。
 */
export function CallbackToAsyncBind<R, ARGS extends readonly unknown[]>(
  cbCaller: (cb: BFChainLink.Callback<R>, ...args: ARGS) => void,
  ctx: unknown,
) {
  return <R2 extends R>(...args: ARGS) => CallbackToAsync<R2, ARGS>(cbCaller as any, args, ctx);
}

export function isNil(value: unknown): value is undefined | null {
  return value === undefined || value === null;
}
export function isNoNilPrimivite(value: unknown) {
  switch (typeof value) {
    case "bigint":
    case "boolean":
    case "number":
    case "string":
    case "symbol":
      return true;
  }
  return false;
}

export class GroupItem {
  constructor(public readonly target: number | Var, public readonly linkIn: BFChainLink.LinkIn) {}
  clearGetterCache() {
    cleanGetterCache(this, "startIndex");
    cleanGetterCache(this, "endIndex");
    // 后续的节点也要清除
    this.nextItem?.clearGetterCache();
  }
  private _prevItem?: GroupItem;
  public get prevItem() {
    return this._prevItem;
  }
  public set prevItem(value) {
    if (value !== this._prevItem) {
      this._prevItem = value;
      value && (value.nextItem = this);
      this.clearGetterCache();
    }
  }
  private _nextItem?: GroupItem;
  public get nextItem() {
    return this._nextItem;
  }
  public set nextItem(value) {
    if (value !== this._nextItem) {
      this._nextItem = value;
      value && (value.prevItem = this);
      this.clearGetterCache();
    }
  }
  @cacheGetter
  get startIndex() {
    return this.prevItem ? this.prevItem.endIndex + 1 : 0;
  }
  @cacheGetter
  get endIndex(): number {
    return this.startIndex + this.linkIn.length + 2 /* target+length */;
  }
  get length() {
    return this.linkIn.length;
  }
}

export class LinkInGroup {
  constructor(readonly itemList: GroupItem[] = []) {}
  append(groupItem: GroupItem) {
    this.insert(this.itemList.length, groupItem);
  }
  insert(index: number, groupItem: GroupItem) {
    const { itemList } = this;
    const prev = itemList[index - 1] as GroupItem | undefined;
    const next = itemList[index] as GroupItem | undefined;

    let movedVars: Set<Var> | undefined;
    const moveVarId = (param: Var) => {
      if (movedVars === undefined) {
        movedVars = new Set();
      } else if (movedVars.has(param)) {
        return;
      }
      movedVars.add(param);

      /// 顺序模式下，往后偏移
      if (param.id > index) {
        param.id += 1;
      }
      // /// 逆序模式，如果要保持逆序，那么往前偏移，或者直接转正绕过条件。
      // else if (param.id < 0) {
      //   /**
      //    * 这里直接转正，因为varList的长度在执行过程中长度会一直改变，所以逆序的可靠性不如正序
      //    * Var对象可能在不同的GroupItem中共享
      //    */
      //   const orderId = param.id + oldCount;
      //   if (orderId < index) {
      //     param.id = orderId;
      //   }
      // }
    };
    /// 对Var对象的指针进行偏移
    for (const item of itemList) {
      for (const param of item.linkIn) {
        if (param instanceof Var) {
          moveVarId(param);
        }
      }
      if (item.target instanceof Var) {
        moveVarId(item.target);
      }
    }

    /// 最后执行插入
    groupItem.prevItem = prev;
    groupItem.nextItem = next;
    itemList.splice(index, 0, groupItem);
  }
  get lastestItem() {
    return this.itemList[this.itemList.length - 1] as GroupItem | undefined;
  }
  get size() {
    return this.itemList.length;
  }
  toLinkIn() {
    const linkIn: BFChainLink.LinkIn = [EmscriptenReflect.Multi];
    for (const item of this.itemList) {
      linkIn.push(item.target, item.length, ...item.linkIn);
    }
    return linkIn;
  }
  static from(multiLinkIn: unknown[]) {
    const itemList: GroupItem[] = [];
    for (let i = 1; i < multiLinkIn.length; ) {
      const target = multiLinkIn[i] as number | Var;
      const len = multiLinkIn[i + 1] as number;
      const linkIn = multiLinkIn.slice(i + 2, i + 2 + len) as BFChainLink.LinkIn;
      itemList.push(new GroupItem(target, linkIn));

      i += len + 2;
    }
    return new LinkInGroup(itemList);
  }
}
