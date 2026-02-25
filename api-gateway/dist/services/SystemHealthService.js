"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SystemHealthService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const redis_1 = require("../config/redis");
const server_1 = require("../websocket/server");
class SystemHealthService {
    mlServiceClient;
    constructor(mlServiceClient) {
        this.mlServiceClient = mlServiceClient;
    }
    async getHealth() {
        const apiStart = Date.now();
        await Promise.resolve();
        const apiLatencyMs = Date.now() - apiStart;
        const redisStart = Date.now();
        let redisStatus = 'UP';
        let redisLatencyMs = 0;
        try {
            await redis_1.redisClient.ping();
            redisLatencyMs = Date.now() - redisStart;
        }
        catch {
            redisStatus = 'DOWN';
        }
        const mlStart = Date.now();
        let mlLatencyMs = 0;
        let mlStatus = 'UP';
        try {
            await this.mlServiceClient.healthCheck();
            mlLatencyMs = Date.now() - mlStart;
        }
        catch {
            mlStatus = 'DOWN';
        }
        const mongoStatus = mongoose_1.default.connection.readyState === 1 ? 'UP' : 'DOWN';
        const wsStats = server_1.gatewayWebSocketServer.getStats();
        return {
            timestamp: new Date().toISOString(),
            apiLatencyMs,
            mlLatencyMs,
            redisLatencyMs,
            mongoStatus,
            redisStatus,
            mlStatus,
            websocketStatus: wsStats.initialized ? 'UP' : 'DOWN',
            websocketClients: wsStats.connectedClients
        };
    }
}
exports.SystemHealthService = SystemHealthService;
