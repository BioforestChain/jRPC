export enum MESSAGE_TYPE {
  // _OUT = 1,
  // _IN = 1 << 1,
  // _NEED_RES = 1 << 2,
  SIM, //= MESSAGE_TYPE._OUT,
  REQ, //= MESSAGE_TYPE._OUT | MESSAGE_TYPE._NEED_RES,
  RES, //= MESSAGE_TYPE._IN,
}
