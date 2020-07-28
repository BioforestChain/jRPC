/**
 * Copyright 2019 Google Inc. All Rights Reserved.
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
import { Endpoint, EventSource, PostMessageWithOrigin } from "./protocol";
import { TransferHandlerMap } from "./transferHandlerMap";
export * from "./transferHandlerMap";
export { Endpoint };
export declare const proxyMarker: unique symbol;
export declare const createEndpoint: unique symbol;
export declare const releaseProxy: unique symbol;
declare type Promise1<T> = T extends Promise<any> ? T : Promise<T>;
declare type Promisify<T> = T extends {
    [proxyMarker]: boolean;
} ? Promise1<Remote<T>> : T extends (...args: infer R1) => infer R2 ? (...args: R1) => Promisify<R2> : Promise1<T>;
export declare type Remote<T> = (T extends (...args: infer R1) => infer R2 ? (...args: R1) => Promisify<R2> : unknown) & (T extends {
    new (...args: infer R1): infer R2;
} ? {
    new (...args: R1): Promise1<Remote<R2>>;
} : unknown) & (T extends Object ? {
    [K in keyof T]: Remote<T[K]>;
} : unknown) & (T extends string ? Promise1<string> : unknown) & (T extends number ? Promise1<number> : unknown) & (T extends boolean ? Promise1<boolean> : unknown) & {
    [createEndpoint]: () => Promise<MessagePort>;
    [releaseProxy]: () => void;
};
export interface TransferHandler {
    canHandle(obj: any): boolean;
    serialize(obj: any): [any, Transferable[]];
    deserialize(obj: any): any;
}
export declare const transferHandlers: TransferHandlerMap;
export declare function expose(obj: any, ep?: Endpoint): void;
export declare function wrap<T>(ep: Endpoint, target?: any): Remote<T>;
export declare function transfer(obj: any, transfers: Transferable[]): any;
export declare function proxy<T>(obj: T): T & {
    [proxyMarker]: true;
};
export declare function windowEndpoint(w: PostMessageWithOrigin, context?: EventSource, targetOrigin?: string): Endpoint;
//# sourceMappingURL=comlink.d.ts.map