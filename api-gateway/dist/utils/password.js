"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.comparePassword = exports.hashPassword = void 0;
const crypto_1 = __importDefault(require("crypto"));
const hashPassword = (value) => {
    const salt = crypto_1.default.randomBytes(16).toString('hex');
    const hash = crypto_1.default.scryptSync(value, salt, 64).toString('hex');
    return `${salt}:${hash}`;
};
exports.hashPassword = hashPassword;
const comparePassword = (value, encoded) => {
    const parts = encoded.split(':');
    if (parts.length !== 2)
        return false;
    const [salt, hash] = parts;
    const candidate = crypto_1.default.scryptSync(value, salt, 64).toString('hex');
    const hashBuf = Buffer.from(hash, 'hex');
    const candidateBuf = Buffer.from(candidate, 'hex');
    if (hashBuf.length !== candidateBuf.length)
        return false;
    return crypto_1.default.timingSafeEqual(hashBuf, candidateBuf);
};
exports.comparePassword = comparePassword;
