export const enum MESSAGE_TYPE {
  // _OUT = 1,
  // _IN = 1 << 1,
  // _NEED_RES = 1 << 2,
  SIM, //= MESSAGE_TYPE._OUT,
  REQ, //= MESSAGE_TYPE._OUT | MESSAGE_TYPE._NEED_RES,
  RES, //= MESSAGE_TYPE._IN,
}

/**
 * SAB 数据格式：
 * [STATUS,TYPE,...data]
 */
export const enum SAB_HELPER {
  SI32_MSG_STATUS = 0,
  SI32_MSG_TYPE = SAB_HELPER.SI32_MSG_STATUS + 1,
}
export const enum SAB_MSG_STATUS {
  /**私有*/
  PRIVATE,
  /**保护，非公开且写入中，可以准备读取了 */
  PROTECTED,
  /**共有，对方可读 */
  PUBLIC,
}
/**这个可以作为数据的VERSION来对待，比如升级版本号可以用EVENT2、EVENT3…… */
export const enum SAB_MSG_TYPE {
 
  /**传输协议事件 */
  EVENT,
}

/**
 * SAB EVENT 数据格式
 * [TYPE,STATUS,eventId<i32>,msgTotalSize<i32>,chunkOffset,chunkSize,...chunk]
 */
export const enum SAB_EVENT_HELPER {
  U32_EVENT_ID_INDEX = SAB_HELPER.SI32_MSG_TYPE + 1,
  /**分包的数量 */
  U16_CHUNK_COUNT_INDEX = SAB_EVENT_HELPER.U32_EVENT_ID_INDEX * 2 + 1,
  /**分包的数据包编号 */
  U16_CHUNK_ID_INDEX = SAB_EVENT_HELPER.U16_CHUNK_COUNT_INDEX + 1,
  /**此分包数据包的大小 */
  U32_MSG_CHUNK_SIZE_INDEX = SAB_EVENT_HELPER.U16_CHUNK_ID_INDEX / 2 + 1,
  U8_MSG_DATA_OFFSET = (SAB_EVENT_HELPER.U32_MSG_CHUNK_SIZE_INDEX + 1) *
    /* Int32Array.BYTES_PER_ELEMENT */ 4,
}

export const enum REMOTE_MODE {
  SYNC = 1,
  ASYNC = 2,
  UNKNOWN = REMOTE_MODE.SYNC | REMOTE_MODE.ASYNC,
}
