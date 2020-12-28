declare namespace BFChainComlink {
  namespace Duplex {
    type SABS = { locale: SharedArrayBuffer; remote: SharedArrayBuffer };
    type CachedChunkInfo = Map<number, Uint8Array>; // { chunk: Uint8Array; range: [{ start: number; end: number }] };
    type PostMessage_ApplyWrite_HookArg = {
      si32: Int32Array;
      msgType: import("./const").SAB_MSG_TYPE;
      curMsgType: import("./const").SAB_MSG_TYPE;
      next: () => void;
    };
    type PostMessage_ChunkReady_HookArg = {
      si32: Int32Array;
      msgType: import("./const").SAB_MSG_TYPE;
      chunkCount: number;
      chunkId: number;
      next: () => void;
    };
  }
}
