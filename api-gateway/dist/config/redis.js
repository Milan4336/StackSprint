"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisClient = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const env_1 = require("./env");
const redisUrl = env_1.env.REDIS_URI || "redis://redis:6379";
exports.redisClient = new ioredis_1.default(redisUrl, {
    retryStrategy: (times) => {
        console.log(`Redis retry attempt ${times}`);
        return Math.min(times * 50, 2000);
    },
});
exports.redisClient.on("connect", () => {
    console.log("Redis connected");
});
exports.redisClient.on("ready", () => {
    console.log("Redis ready");
});
exports.redisClient.on("error", (err) => {
    if (err && err.message) {
        console.error("Redis error:", err.message);
    }
});
