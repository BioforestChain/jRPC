/// <reference lib="dom"/>
import { assert, Has, NotHas, IsAny, IsExact } from "conditional-type-checks";

import {
  ComlinkFactory,
  windowEndpoint as ComlinkWindowEndpoint
} from "@bfchain/comlink";

const comlink = new ComlinkFactory();

async function closureSoICanUseAwait() {
  {
    function simpleNumberFunction() {
      return 4;
    }

    const proxy = comlink.wrap<typeof simpleNumberFunction>(0 as any);
    assert<IsAny<typeof proxy>>(false);
    const v = proxy();
    assert<Has<typeof v, Promise<number>>>(true);
  }

  {
    function simpleObjectFunction() {
      return { a: 3 };
    }

    const proxy = comlink.wrap<typeof simpleObjectFunction>(0 as any);
    const v = await proxy();
    assert<Has<typeof v, { a: number }>>(true);
  }

  {
    async function simpleAsyncFunction() {
      return { a: 3 };
    }

    const proxy = comlink.wrap<typeof simpleAsyncFunction>(0 as any);
    const v = await proxy();
    assert<Has<typeof v, { a: number }>>(true);
  }

  {
    function functionWithProxy() {
      return comlink.proxy({ a: 3 });
    }

    const proxy = comlink.wrap<typeof functionWithProxy>(0 as any);
    const subproxy = await proxy();
    const prop = subproxy.a;
    assert<Has<typeof prop, Promise<number>>>(true);
  }

  {
    class X {
      static staticFunc() {
        return 4;
      }
      private f = 4;
      public g = 9;
      sayHi() {
        return "hi";
      }
    }

    const proxy = comlink.wrap<typeof X>(0 as any);
    assert<Has<typeof proxy, { staticFunc: () => Promise<number> }>>(true);
    const instance = await new proxy();
    assert<Has<typeof instance, { sayHi: () => Promise<string> }>>(true);
    assert<Has<typeof instance, { g: Promise<number> }>>(true);
    assert<NotHas<typeof instance, { f: Promise<number> }>>(true);
    assert<IsAny<typeof instance>>(false);
  }

  {
    const x = {
      a: 4,
      b() {
        return 9;
      },
      c: {
        d: 3
      }
    };

    const proxy = comlink.wrap<typeof x>(0 as any);
    assert<IsAny<typeof proxy>>(false);
    const a = proxy.a;
    assert<Has<typeof a, Promise<number>>>(true);
    assert<IsAny<typeof a>>(false);
    const b = proxy.b;
    assert<Has<typeof b, () => Promise<number>>>(true);
    assert<IsAny<typeof b>>(false);
    const subproxy = proxy.c;
    assert<Has<typeof subproxy, Promise<{ d: number }>>>(true);
    assert<IsAny<typeof subproxy>>(false);
    const copy = await proxy.c;
    assert<Has<typeof copy, { d: number }>>(true);
  }

  {
    comlink.wrap(new MessageChannel().port1);
    comlink.expose({}, new MessageChannel().port2);

    interface Baz {
      baz: number;
      method(): number;
    }

    class Foo {
      constructor(cParam: string) {
        const self = this;
        assert<IsExact<typeof self.proxyProp, BFChainComlink.ProxyMarked<Bar>>>(
          true
        );
      }
      prop1: string = "abc";
      proxyProp = comlink.proxy(new Bar());
      methodWithTupleParams(...args: [string] | [number, string]): number {
        return 123;
      }
      methodWithProxiedReturnValue(): Baz & BFChainComlink.ProxyMarked {
        return comlink.proxy({ baz: 123, method: () => 123 });
      }
      methodWithProxyParameter(param: Baz & BFChainComlink.ProxyMarked): void {}
    }

    class Bar {
      prop2: string | number = "abc";
      method(param: string): number {
        return 123;
      }
      methodWithProxiedReturnValue(): Baz & BFChainComlink.ProxyMarked {
        return comlink.proxy({ baz: 123, method: () => 123 });
      }
    }
    const proxy = comlink.wrap<Foo>(ComlinkWindowEndpoint(self));
    assert<IsExact<typeof proxy, BFChainComlink.Remote<Foo>>>(true);

    proxy[comlink.releaseProxy]();
    const endp = proxy[comlink.createEndpoint]();
    assert<IsExact<typeof endp, Promise<BFChainComlink.MessagePort>>>(true);

    assert<IsAny<typeof proxy.prop1>>(false);
    assert<Has<typeof proxy.prop1, Promise<string>>>(true);

    const r1 = proxy.methodWithTupleParams(123, "abc");
    assert<IsExact<typeof r1, Promise<number>>>(true);

    const r2 = proxy.methodWithTupleParams("abc");
    assert<IsExact<typeof r2, Promise<number>>>(true);

    assert<
      IsExact<
        typeof proxy.proxyProp,
        BFChainComlink.Remote<Bar & BFChainComlink.ProxyMarked>
      >
    >(true);

    assert<IsAny<typeof proxy.proxyProp.prop2>>(false);
    assert<Has<typeof proxy.proxyProp.prop2, Promise<string>>>(true);
    assert<Has<typeof proxy.proxyProp.prop2, Promise<number>>>(true);

    const r3 = proxy.proxyProp.method("param");
    assert<IsAny<typeof r3>>(false);
    assert<Has<typeof r3, Promise<number>>>(true);

    // @ts-expect-error
    proxy.proxyProp.method(123);

    // @ts-expect-error
    proxy.proxyProp.method();

    const r4 = proxy.methodWithProxiedReturnValue();
    assert<IsAny<typeof r4>>(false);
    assert<
      IsExact<
        typeof r4,
        Promise<BFChainComlink.Remote<Baz & BFChainComlink.ProxyMarked>>
      >
    >(true);

    const r5 = proxy.proxyProp.methodWithProxiedReturnValue();
    assert<
      IsExact<
        typeof r5,
        Promise<BFChainComlink.Remote<Baz & BFChainComlink.ProxyMarked>>
      >
    >(true);

    const r6 = (await proxy.methodWithProxiedReturnValue()).baz;
    assert<IsAny<typeof r6>>(false);
    assert<Has<typeof r6, Promise<number>>>(true);

    const r7 = (await proxy.methodWithProxiedReturnValue()).method();
    assert<IsAny<typeof r7>>(false);
    assert<Has<typeof r7, Promise<number>>>(true);

    const ProxiedFooClass = comlink.wrap<typeof Foo>(
      ComlinkWindowEndpoint(self)
    );
    const inst1 = await new ProxiedFooClass("test");
    assert<IsExact<typeof inst1, BFChainComlink.Remote<Foo>>>(true);
    inst1[comlink.releaseProxy]();
    inst1[comlink.createEndpoint]();

    // @ts-expect-error
    await new ProxiedFooClass(123);

    // @ts-expect-error
    await new ProxiedFooClass();

    //
    // Tests for advanced proxy use cases
    //

    // Type round trips
    // This tests that Local is the exact inverse of Remote for objects:
    assert<
      IsExact<
        BFChainComlink.Local<BFChainComlink.Remote<BFChainComlink.ProxyMarked>>,
        BFChainComlink.ProxyMarked
      >
    >(true);
    // This tests that Local is the exact inverse of Remote for functions, with one difference:
    // The local version of a remote function can be either implemented as a sync or async function,
    // because Remote<T> always makes the function async.
    assert<
      IsExact<
        BFChainComlink.Local<BFChainComlink.Remote<(a: number) => string>>,
        (a: number) => string | Promise<string>
      >
    >(true);

    interface Subscriber<T> {
      closed?: boolean;
      next?: (value: T) => void;
    }
    interface Unsubscribable {
      unsubscribe(): void;
    }
    /** A Subscribable that can get proxied by Comlink */
    interface ProxyableSubscribable<T> extends BFChainComlink.ProxyMarked {
      subscribe(
        subscriber: BFChainComlink.Remote<
          Subscriber<T> & BFChainComlink.ProxyMarked
        >
      ): Unsubscribable & BFChainComlink.ProxyMarked;
    }

    /** Simple parameter object that gets cloned (not proxied) */
    interface Params {
      textDocument: string;
    }

    class Registry {
      async registerProvider(
        provider: BFChainComlink.Remote<
          ((params: Params) => ProxyableSubscribable<string>) &
            BFChainComlink.ProxyMarked
        >
      ) {
        const resultPromise = provider({ textDocument: "foo" });
        assert<
          IsExact<
            typeof resultPromise,
            Promise<BFChainComlink.Remote<ProxyableSubscribable<string>>>
          >
        >(true);
        const result = await resultPromise;

        const subscriptionPromise = result.subscribe({
          [comlink.transferProto]: comlink.proxyMarker,
          next: value => {
            assert<IsExact<typeof value, string>>(true);
          }
        });
        assert<
          IsExact<
            typeof subscriptionPromise,
            Promise<
              BFChainComlink.Remote<Unsubscribable & BFChainComlink.ProxyMarked>
            >
          >
        >(true);
        const subscriber = comlink.proxy({
          next: (value: string) => console.log(value)
        });
        result.subscribe(subscriber);

        const r1 = (await subscriptionPromise).unsubscribe();
        assert<IsExact<typeof r1, Promise<void>>>(true);
      }
    }
    const proxy2 = comlink.wrap<Registry>(ComlinkWindowEndpoint(self));

    proxy2.registerProvider(
      // Synchronous callback
      comlink.proxy(({ textDocument }: Params) => {
        const subscribable = comlink.proxy({
          subscribe(
            subscriber: BFChainComlink.Remote<
              Subscriber<string> & BFChainComlink.ProxyMarked
            >
          ): Unsubscribable & BFChainComlink.ProxyMarked {
            // Important to test here is that union types (such as Function | undefined) distribute properly
            // when wrapped in Promises/proxied

            assert<IsAny<typeof subscriber.closed>>(false);
            assert<
              IsExact<
                typeof subscriber.closed,
                Promise<true> | Promise<false> | Promise<undefined> | undefined
              >
            >(true);

            assert<IsAny<typeof subscriber.next>>(false);
            assert<
              IsExact<
                typeof subscriber.next,
                | BFChainComlink.Remote<(value: string) => void>
                | Promise<undefined>
                | undefined
              >
            >(true);

            // @ts-expect-error
            subscriber.next();

            if (subscriber.next) {
              // Only checking for presence is not enough, since it could be a Promise
              // @ts-expect-error
              subscriber.next();
            }

            if (typeof subscriber.next === "function") {
              subscriber.next("abc");
            }

            return comlink.proxy({ unsubscribe() {} });
          }
        });
        assert<Has<typeof subscribable, BFChainComlink.ProxyMarked>>(true);
        return subscribable;
      })
    );
    proxy2.registerProvider(
      // Async callback
      comlink.proxy(async ({ textDocument }: Params) => {
        const subscribable = comlink.proxy({
          subscribe(
            subscriber: BFChainComlink.Remote<
              Subscriber<string> & BFChainComlink.ProxyMarked
            >
          ): Unsubscribable & BFChainComlink.ProxyMarked {
            assert<IsAny<typeof subscriber.next>>(false);
            assert<
              IsExact<
                typeof subscriber.next,
                | BFChainComlink.Remote<(value: string) => void>
                | Promise<undefined>
                | undefined
              >
            >(true);

            // Only checking for presence is not enough, since it could be a Promise
            if (typeof subscriber.next === "function") {
              subscriber.next("abc");
            }
            return comlink.proxy({ unsubscribe() {} });
          }
        });
        return subscribable;
      })
    );
  }

  // Transfer handlers
  {
    const urlTransferHandler: BFChainComlink.TransferHandler<URL, string> = {
      canHandle: (val): val is URL => {
        assert<IsExact<typeof val, unknown>>(true);
        return val instanceof URL;
      },
      serialize: url => {
        assert<IsExact<typeof url, URL>>(true);
        return [url.href, []];
      },
      deserialize: str => {
        assert<IsExact<typeof str, string>>(true);
        return new URL(str);
      }
    };
    comlink.transferHandlers.set("URL", urlTransferHandler);
  }
}
import test from "ava";

test("type check not need test", t => {
  t.pass();
});
