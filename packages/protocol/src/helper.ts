// import { serialize, deserialize } from "v8";
export const serialize = (data: unknown) => {
  const json = JSON.stringify(data);
  const u16 = new Uint16Array(json.length);
  for (let i = 0; i < json.length; i++) {
    const code = json.charCodeAt(i);
    if (code >= 65536) {
      throw new RangeError("");
    }
    u16[i] = code;
  }
  return new Uint8Array(u16.buffer);
  // const u8 = new Uint8Array(json.length);
  // for (let i = 0; i < json.length; i++) {
  //   const code = json.charCodeAt(i);
  //   if (code >= 256) {
  //     throw new RangeError("");
  //   }
  //   u8[i] = code;
  // }
  // return u8;
};
export const deserialize = (u8: Uint8Array) => {
  let json = "";
  for (let i = 0; i < u8.byteLength; i += 2) {
    const l = u8[i];
    const h = u8[i + 1];
    const code = (h << 8) + l;
    json += String.fromCharCode(code);
  }
  // for (const code of u8) {
  //   json += String.fromCharCode(code);
  // }

  return JSON.parse(json);
};
