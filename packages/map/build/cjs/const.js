"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MODE_TRANSFER_TYPES_MAP = exports.BOTHONLY_TRANSFER_TYPES = exports.SERIALIZEONLY_TRANSFER_TYPES = exports.DESERIALIZEONLY_TRANSFER_TYPES = exports.SERIALIZABLE_TRANSFER_TYPES = exports.DESERIALIZABLE_TRANSFER_TYPES = exports.ANY_TRANSFER_TYPES = void 0;
exports.ANY_TRANSFER_TYPES = ["deserialize", "serialize", "both"];
exports.DESERIALIZABLE_TRANSFER_TYPES = ["deserialize", "both"];
exports.SERIALIZABLE_TRANSFER_TYPES = ["serialize", "both"];
exports.DESERIALIZEONLY_TRANSFER_TYPES = ["deserialize"];
exports.SERIALIZEONLY_TRANSFER_TYPES = ["serialize"];
exports.BOTHONLY_TRANSFER_TYPES = ["both"];
exports.MODE_TRANSFER_TYPES_MAP = {
    any: exports.ANY_TRANSFER_TYPES,
    deserializable: exports.DESERIALIZABLE_TRANSFER_TYPES,
    serializable: exports.SERIALIZABLE_TRANSFER_TYPES,
    deserializeonly: exports.DESERIALIZEONLY_TRANSFER_TYPES,
    serializeonly: exports.SERIALIZEONLY_TRANSFER_TYPES,
    bothonly: exports.BOTHONLY_TRANSFER_TYPES
};
//# sourceMappingURL=const.js.map