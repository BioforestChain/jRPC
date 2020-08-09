/**
 * Copyright 2020 Bnqkl. All Rights Reserved.
 * Copyright 2017 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { ComlinkFactory } from "@bfchain/comlink";
import {
  nodeEndpointTransfer,
  NodejsComlinkFactory
} from "@bfchain/comlink-nodejs";
import ava, { ExecutionContext, TestInterface } from "ava";
import { MessagePort, MessageChannel } from "worker_threads";
const Comlink = new NodejsComlinkFactory();

class SampleClass {
  public _promise = Promise.resolve(4);
  constructor(public _counter = 1) {}

  static get SOME_NUMBER() {
    return 4;
  }

  static ADD(a: number, b: number) {
    return a + b;
  }

  get counter() {
    return this._counter;
  }

  set counter(value) {
    this._counter = value;
  }

  get promise() {
    return this._promise;
  }

  method() {
    return 4;
  }

  increaseCounter(delta = 1) {
    this._counter += delta;
  }

  promiseFunc() {
    return new Promise(resolve => setTimeout(_ => resolve(4), 100));
  }

  proxyFunc() {
    return Comlink.proxy({
      counter: 0,
      inc() {
        this.counter++;
      }
    });
  }

  throwsAnError() {
    throw Error("OMG");
  }
}
type Context = {
  port1: BFChainComlink.Endpoint<BFChainComlink.NodejsTransferable>;
  port2: BFChainComlink.Endpoint<BFChainComlink.NodejsTransferable>;
};
const test = ava as TestInterface<Context>;

test.beforeEach(t => {
  const { port1, port2 } = new MessageChannel();
  port1.start();
  port2.start();
  t.context.port1 = nodeEndpointTransfer(port1);
  t.context.port2 = nodeEndpointTransfer(port2);
});

// test("Comlink in the same realm", t => {

// });
test("can work with objects", async t => {
  const source = { value: 4 };
  const thing = Comlink.wrap<typeof source>(t.context.port1);
  Comlink.expose(source, t.context.port2);
  t.is(await thing.value, 4);
});

test("can work with functions on an object", async t => {
  const source = { f: () => 4 };
  const thing = Comlink.wrap<typeof source>(t.context.port1);
  Comlink.expose(source, t.context.port2);
  t.is(await thing.f(), 4);
});

test("can work with functions", async t => {
  const source = () => 4;
  const thing = Comlink.wrap<typeof source>(t.context.port1);
  Comlink.expose(source, t.context.port2);
  t.is(await thing(), 4);
});

test("can work with objects that have undefined properties", async t => {
  const source = { x: undefined };
  const thing = Comlink.wrap<typeof source>(t.context.port1);
  Comlink.expose({ x: undefined }, t.context.port2);
  t.is(await thing.x, undefined);
});

test("can keep the stack and message of thrown errors", async t => {
  let stack;
  const source = () => {
    const error = Error("OMG");
    stack = error.stack;
    throw error;
  };
  const thing = Comlink.wrap<typeof source>(t.context.port1);
  Comlink.expose(source, t.context.port2);
  try {
    await thing();
    throw "Should have thrown";
  } catch (err) {
    t.not(err, "Should have thrown");
    t.is(err.message, "OMG");
    t.is(err.stack, stack);
  }
});

test("can custom the stack and message of thrown errors", async t => {
  /// 注册自定义异常类
  class MyError extends Error {}
  Comlink.transferClasses.registryClass(
    "MyError",
    MyError,
    err => {
      return [err.message, []];
    },
    message => {
      const myError = new MyError("qaq:" + message);
      return myError;
    }
  );
  const source = () => {
    const error = new MyError("OMG");
    throw error;
  };
  const thing = Comlink.wrap<typeof source>(t.context.port1);
  Comlink.expose(source, t.context.port2);
  try {
    await thing();
    throw "Should have thrown";
  } catch (err) {
    t.not(err, "Should have thrown");
    t.is(err.message, "qaq:OMG");
  }
});

test("can forward an async function error", async t => {
  const source = {
    async throwError() {
      throw new Error("Should have thrown");
    }
  };
  const thing = Comlink.wrap<typeof source>(t.context.port1);
  Comlink.expose(source, t.context.port2);
  try {
    await thing.throwError();
  } catch (err) {
    t.is(err.message, "Should have thrown");
  }
});

test("can rethrow non-error objects", async t => {
  const source = () => {
    throw { test: true };
  };
  const thing = Comlink.wrap<typeof source>(t.context.port1);
  Comlink.expose(source, t.context.port2);
  try {
    await thing();
    throw "Should have thrown";
  } catch (err) {
    t.not(err, "Should have thrown");
    t.is(err.test, true);
  }
});

test("can rethrow scalars", async t => {
  const source = () => {
    throw "oops";
  };
  const thing = Comlink.wrap<typeof source>(t.context.port1);
  Comlink.expose(source, t.context.port2);
  try {
    await thing();
    throw "Should have thrown";
  } catch (err) {
    t.not(err, "Should have thrown");
    t.is(err, "oops");
    t.is(typeof err, "string");
  }
});

test("can rethrow null", async t => {
  const source = () => {
    throw null;
  };
  const thing = Comlink.wrap<typeof source>(t.context.port1);
  Comlink.expose(source, t.context.port2);
  try {
    await thing();
    throw "Should have thrown";
  } catch (err) {
    t.not(err, "Should have thrown");
    t.is(err, null);
    t.is(typeof err, "object");
  }
});

test("can work with parameterized functions", async t => {
  const source = (a: number, b: number) => a + b;
  const thing = Comlink.wrap<typeof source>(t.context.port1);
  Comlink.expose(source, t.context.port2);
  t.is(await thing(1, 3), 4);
});

test("can work with functions that return promises", async t => {
  const source = () => new Promise(resolve => setTimeout(_ => resolve(4), 100));
  const thing = Comlink.wrap<typeof source>(t.context.port1);
  Comlink.expose(source, t.context.port2);
  t.is(await thing(), 4);
});

test("can work with classes", async t => {
  const source = SampleClass;
  const thing = Comlink.wrap<typeof source>(t.context.port1);
  Comlink.expose(source, t.context.port2);
  const instance = await new thing();
  t.is(await instance.method(), 4);
});

test("can pass parameters to class constructor", async t => {
  const source = SampleClass;
  const thing = Comlink.wrap<typeof source>(t.context.port1);
  Comlink.expose(source, t.context.port2);
  const instance = await new thing(23);
  t.is(await instance.counter, 23);
});

test("can access a class in an object", async t => {
  const source = { SampleClass };
  const thing = Comlink.wrap<typeof source>(t.context.port1);
  Comlink.expose(source, t.context.port2);
  const instance = await new thing.SampleClass();
  t.is(await instance.method(), 4);
});

test("can work with class instance properties", async t => {
  const source = SampleClass;
  const thing = Comlink.wrap<typeof source>(t.context.port1);
  Comlink.expose(source, t.context.port2);
  const instance = await new thing();
  t.is(await instance.counter, 1);
});

test("can set class instance properties", async t => {
  const source = SampleClass;
  const thing = Comlink.wrap<typeof source>(t.context.port1);
  Comlink.expose(source, t.context.port2);
  const instance = await new thing();
  t.is(await instance._counter, 1);
  await (((instance as unknown) as SampleClass)._counter = 4);
  t.is(await instance._counter, 4);
});

test("can work with class instance methods", async t => {
  const source = SampleClass;
  const thing = Comlink.wrap<typeof source>(t.context.port1);
  Comlink.expose(source, t.context.port2);
  const instance = await new thing();
  t.is(await instance.counter, 1);
  await instance.increaseCounter();
  t.is(await instance.counter, 2);
});

test("can handle throwing class instance methods", async t => {
  const source = SampleClass;
  const thing = Comlink.wrap<typeof source>(t.context.port1);
  Comlink.expose(source, t.context.port2);
  const instance = await new thing();
  return instance
    .throwsAnError()
    .then(_ => Promise.reject())
    .catch(err => {
      t.pass();
    });
});

test("can work with class instance methods multiple times", async t => {
  const source = SampleClass;
  const thing = Comlink.wrap<typeof source>(t.context.port1);
  Comlink.expose(source, t.context.port2);
  const instance = await new thing();
  t.is(await instance.counter, 1);
  await instance.increaseCounter();
  await instance.increaseCounter(5);
  t.is(await instance.counter, 7);
});

test("can work with class instance methods that return promises", async t => {
  const source = SampleClass;
  const thing = Comlink.wrap<typeof source>(t.context.port1);
  Comlink.expose(source, t.context.port2);
  const instance = await new thing();
  t.is(await instance.promiseFunc(), 4);
});

test("can work with class instance properties that are promises", async t => {
  const source = SampleClass;
  const thing = Comlink.wrap<typeof source>(t.context.port1);
  Comlink.expose(source, t.context.port2);
  const instance = await new thing();
  t.is(await instance._promise, 4);
});

test("can work with class instance getters that are promises", async t => {
  const source = SampleClass;
  const thing = Comlink.wrap<typeof source>(t.context.port1);
  Comlink.expose(source, t.context.port2);
  const instance = await new thing();
  t.is(await instance.promise, 4);
});

test("can work with static class properties", async t => {
  const source = SampleClass;
  const thing = Comlink.wrap<typeof source>(t.context.port1);
  Comlink.expose(source, t.context.port2);
  t.is(await thing.SOME_NUMBER, 4);
});

test("can work with static class methods", async t => {
  const source = SampleClass;
  const thing = Comlink.wrap<typeof source>(t.context.port1);
  Comlink.expose(source, t.context.port2);
  t.is(await thing.ADD(1, 3), 4);
});

test("can work with bound class instance methods", async t => {
  const source = SampleClass;
  const thing = Comlink.wrap<typeof source>(t.context.port1);
  Comlink.expose(source, t.context.port2);
  const instance = await new thing();
  t.is(await instance.counter, 1);
  const method = instance.increaseCounter.bind(instance);
  await method();
  t.is(await instance.counter, 2);
});

test("can work with class instance getters", async t => {
  const source = SampleClass;
  const thing = Comlink.wrap<typeof source>(t.context.port1);
  Comlink.expose(source, t.context.port2);
  const instance = await new thing();
  t.is(await instance.counter, 1);
  await instance.increaseCounter();
  t.is(await instance.counter, 2);
});

test("can work with class instance setters", async t => {
  const source = SampleClass;
  const thing = Comlink.wrap<typeof source>(t.context.port1);
  Comlink.expose(source, t.context.port2);
  const instance = await new thing();
  t.is(await instance.counter, 1);
  await (((instance as unknown) as SampleClass).counter = 4);
  t.is(await instance._counter, 4);
});

const hasBroadcastChannel = () => "BroadcastChannel" in globalThis;
guardedIt(hasBroadcastChannel)("will work with BroadcastChannel", async t => {
  const b1 = new BroadcastChannel("comlink_bc_test");
  const b2 = new BroadcastChannel("comlink_bc_test");
  const source = (b: number) => 40 + b;
  const thing = Comlink.wrap<typeof source>(b1);
  Comlink.expose(source, b2);
  t.is(await thing(2), 42);
});

// Buffer transfers seem to have regressed in Safari 11.1, it’s fixed in 11.2.
const isNotSafari11_1 = () =>
  "navigator" in globalThis &&
  !/11\.1(\.[0-9]+)? Safari/.test(navigator.userAgent);
guardedIt(isNotSafari11_1)("will transfer buffers", async t => {
  const source = (b: ArrayBufferLike) => b.byteLength;
  const thing = Comlink.wrap<typeof source>(t.context.port1);
  Comlink.expose(source, t.context.port2);
  const buffer = new Uint8Array([1, 2, 3]).buffer;
  t.is(await thing(Comlink.transfer(buffer, [buffer])), 3);
  t.is(buffer.byteLength, 0);
});

guardedIt(isNotSafari11_1)("will copy TypedArrays", async t => {
  const source = <T>(b: T) => b;
  const thing = Comlink.wrap<typeof source>(t.context.port1)[Comlink.safeType];
  Comlink.expose(source, t.context.port2);
  const array = new Uint8Array([1, 2, 3]);
  const receive = await thing(array);
  t.not(array, receive);
  t.is(array.byteLength, receive.byteLength);
  t.deepEqual([...array], [...receive]);
});

guardedIt(isNotSafari11_1)("will copy nested TypedArrays", async t => {
  const source = <T>(b: T) => b;
  const thing = Comlink.wrap<typeof source>(t.context.port1)[Comlink.safeType];
  Comlink.expose(source, t.context.port2);
  const array = new Uint8Array([1, 2, 3]);
  const receive = await thing({
    v: 1,
    array
  });
  t.not(array, receive.array);
  t.is(array.byteLength, receive.array.byteLength);
  t.deepEqual([...array], [...receive.array]);
});

guardedIt(isNotSafari11_1)("will transfer deeply nested buffers", async t => {
  const source = (a: { b: { c: { d: ArrayBufferLike } } }) =>
    a.b.c.d.byteLength;
  const thing = Comlink.wrap<typeof source>(t.context.port1);
  Comlink.expose(source, t.context.port2);
  const buffer = new Uint8Array([1, 2, 3]).buffer;

  t.is(await thing(Comlink.transfer({ b: { c: { d: buffer } } }, [buffer])), 3);

  t.is(buffer.byteLength, 0);
});

test("will transfer a message port", async t => {
  const source = (a: MessagePort) => a.postMessage("ohai");
  const thing = Comlink.wrap<typeof source>(t.context.port1);
  Comlink.expose(source, t.context.port2);
  const { port1, port2 } = new MessageChannel();
  await thing(Comlink.transfer(port2, [port2]));
  const returnMsg = await new Promise<unknown>(resolve => {
    port1.on("message", resolve);
  });
  t.is(returnMsg, "ohai");
});

test("will wrap marked return values", async t => {
  const source = () =>
    Comlink.proxy({
      counter: 0,
      inc() {
        this.counter += 1;
      }
    });
  const thing = Comlink.wrap<typeof source>(t.context.port1);
  Comlink.expose(source, t.context.port2);
  const obj = await thing();
  t.is(await obj.counter, 0);
  await obj.inc();
  t.is(await obj.counter, 1);
});

test("will wrap marked return values from class instance methods", async t => {
  const source = SampleClass;
  const thing = Comlink.wrap<typeof source>(t.context.port1);
  Comlink.expose(source, t.context.port2);
  const instance = await new thing();
  const obj = await instance.proxyFunc();
  t.is(await obj.counter, 0);
  await obj.inc();
  t.is(await obj.counter, 1);
});

test("will wrap marked parameter values", async t => {
  const local = {
    counter: 0,
    inc() {
      this.counter++;
    }
  };
  const source = async function (f: typeof local) {
    await f.inc();
  };
  const thing = Comlink.wrap<typeof source>(t.context.port1);
  Comlink.expose(source, t.context.port2);
  t.is(local.counter, 0);
  await thing(Comlink.proxy(local));
  t.is(await local.counter, 1);
});

test("will wrap marked assignments", async t => {
  t.plan(1);

  const thing = Comlink.wrap<typeof obj>(t.context.port1);
  const obj = {
    onready: null as null | (() => unknown),
    call() {
      this.onready!();
    }
  };
  Comlink.expose(obj, t.context.port2);
  const task = new Promise(resolve => {
    thing[Comlink.safeType].onready = Comlink.proxy(() => {
      t.pass();
      resolve();
    });
  });
  thing.call();
  await task;
});

test("will wrap marked parameter values, simple function", async t => {
  t.plan(1);
  const source = async function (f: () => unknown) {
    await f();
  };
  const thing = Comlink.wrap<typeof source>(t.context.port1);
  Comlink.expose(source, t.context.port2);
  // Weird code because Mocha
  await new Promise(async resolve => {
    thing(
      Comlink.proxy(() => {
        t.pass();
        resolve();
      })
    );
  });
});

test("will wrap multiple marked parameter values, simple function", async t => {
  type Foo = () => number;
  const source = async function (f1: Foo, f2: Foo, f3: Foo) {
    return (await f1()) + (await f2()) + (await f3());
  };
  const thing = Comlink.wrap<typeof source>(t.context.port1);
  Comlink.expose(source, t.context.port2);
  // Weird code because Mocha
  t.is(
    await thing(
      Comlink.proxy(() => 1),
      Comlink.proxy(() => 2),
      Comlink.proxy(() => 3)
    ),
    6
  );
});

test("will proxy deeply nested values", async t => {
  const thing = Comlink.wrap<typeof obj>(t.context.port1)[Comlink.safeType];
  const obj = {
    a: {
      v: 4
    },
    b: Comlink.proxy({
      v: 5
    })
  };
  Comlink.expose(obj, t.context.port2);

  const a = await thing.a;
  const b = await thing.b;
  t.is(await a.v, 4);
  t.is(await b.v, 5);
  await (a.v = 8);
  await (b.v = 9);
  t.is(await thing.a.v, 4);
  t.is(await thing.b.v, 9);
});

test("will handle undefined parameters", async t => {
  const source = { f: () => 4 };
  const thing = Comlink.wrap<typeof source>(t.context.port1);
  Comlink.expose(source, t.context.port2);
  t.is(await thing.f(), 4);
});

test("can handle destructuring", async t => {
  const source = {
    a: 4,
    get b() {
      return 5;
    },
    c() {
      return 6;
    }
  };
  Comlink.expose(source, t.context.port2);
  const { a, b, c } = Comlink.wrap<typeof source>(t.context.port1);
  t.is(await a, 4);
  t.is(await b, 5);
  t.is(await c(), 6);
});

test("lets users define transfer handlers", async t => {
  class EventData {
    constructor(public data: unknown) {}
  }
  const errorTransferHandler: BFChainComlink.TransferHandler<
    EventData,
    unknown
  > = {
    canHandle(obj): obj is EventData {
      return obj instanceof EventData;
    },
    serialize(obj) {
      return [obj.data, []];
    },
    deserialize(message) {
      return new EventData(message);
    }
  };
  Comlink.transferHandlers.set("error", errorTransferHandler);

  const task = new Promise(resolve => {
    const source = (ev: EventData) => {
      t.true(ev instanceof EventData);
      t.deepEqual(ev.data, { a: 1 });
      t.pass();
      resolve();
    };

    Comlink.expose(source, t.context.port1);
    const thing = Comlink.wrap<typeof source>(t.context.port2);

    thing(new EventData({ a: 1 }));
  });
  await task;
});

test("can tunnels a new endpoint with createEndpoint", async t => {
  const source = {
    a: 4,
    c() {
      return 5;
    }
  };
  Comlink.expose(source, t.context.port2);
  const proxy = Comlink.wrap<typeof source>(t.context.port1);
  debugger;
  const otherEp = await proxy[Comlink.createEndpoint]();
  const otherProxy = Comlink.wrap<typeof source>(otherEp);
  t.is(await otherProxy.a, 4);
  t.is(await proxy.a, 4);
  t.is(await otherProxy.c(), 5);
  t.is(await proxy.c(), 5);
});

test("released proxy should no longer be useable and throw an exception", async t => {
  const source = SampleClass;
  const thing = Comlink.wrap<typeof source>(t.context.port1);
  Comlink.expose(source, t.context.port2);
  const instance = await new thing();
  await instance[Comlink.releaseProxy]();
  t.throws(() => instance.method());
});

test("can proxy with a given target", async t => {
  const source = { value: 4 };
  const thing = Comlink.wrap<typeof source>(t.context.port1, { value: {} });
  Comlink.expose(source, t.context.port2);
  t.is(await thing.value, 4);
});

function guardedIt(f: () => boolean) {
  return f() ? test : () => {};
}
