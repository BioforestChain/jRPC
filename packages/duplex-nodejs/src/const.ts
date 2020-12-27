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
 * [TYPE,STATUS,...data]
 */

export const enum SAB_MSG_TYPE {
  /**空闲、释放 */
  FREE,
  // /**传输数据包 */
  // CHUNK,
  /**传输协议事件 */
  EVENT,
}
export const enum SAB_MSG_STATUS {
  /**写入中 */
  WRITING,
  /**写入完成，等待中响应中 */
  FINISH,
}

export const enum SAB_HELPER {
  SI32_MSG_TYPE = 0,
  SI32_MSG_STATUS = SAB_HELPER.SI32_MSG_TYPE + 1,
}

// /**
//  * SAB CHUNK 数据格式
//  * [TYPE,STATUS,MSG_ID<i32>,MSG_SIZE<i32>,data<u8>]
//  */
// export const enum SAB_CHUNK_HELPER {
//   SI32_MSG_ID_INDEX = SAB_HELPER.SI32_MSG_STATUS + 1,
//   SI32_MSG_SIZE_INDEX = SAB_CHUNK_HELPER.SI32_MSG_ID_INDEX + 1,
//   SU8_MSG_DATA_OFFSET = (SAB_CHUNK_HELPER.SI32_MSG_SIZE_INDEX + 1) *
//     4 /* Int32Array.BYTES_PER_ELEMENT */,
// }

/**
 * SAB EVENT 数据格式
 * [TYPE,STATUS,eventId<i32>,msgTotalSize<i32>,chunkOffset,chunkSize,...chunk]
 */
export const enum SAB_EVENT_HELPER {
  U32_EVENT_ID_INDEX = SAB_HELPER.SI32_MSG_STATUS + 1,
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
