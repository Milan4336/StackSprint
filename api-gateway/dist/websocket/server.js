"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gatewayWebSocketServer = void 0;
const socket_io_1 = require("socket.io");
const env_1 = require("../config/env");
const logger_1 = require("../config/logger");
const redis_1 = require("../config/redis");
const jwt_1 = require("../utils/jwt");
const resolveToken = (candidate) => {
    if (typeof candidate !== 'string')
        return null;
    if (candidate.startsWith('Bearer '))
        return candidate.slice(7).trim();
    return candidate.trim();
};
class GatewayWebSocketServer {
    io;
    subscriber;
    initialized = false;
    async initialize(httpServer) {
        this.io = new socket_io_1.Server(httpServer, {
            cors: {
                origin: env_1.env.ALLOWED_ORIGINS.split(',').map((v) => v.trim()),
                credentials: true
            }
        });
        this.io.use((socket, next) => {
            const authToken = resolveToken(socket.handshake.auth?.token);
            const headerToken = resolveToken(socket.handshake.headers.authorization);
            const token = authToken ?? headerToken;
            if (!token) {
                next(new Error('Unauthorized'));
                return;
            }
            try {
                (0, jwt_1.verifyJwt)(token);
                next();
            }
            catch {
                next(new Error('Unauthorized'));
            }
        });
        this.io.on('connection', (socket) => {
            socket.emit('system.status', {
                status: 'connected',
                at: new Date().toISOString()
            });
        });
        this.subscriber = redis_1.redisClient.duplicate();
        await this.subscriber.subscribe('transactions.live', 'fraud.alerts', 'simulation.events');
        this.subscriber.on('message', (channel, message) => {
            if (!this.io)
                return;
            try {
                const payload = JSON.parse(message);
                this.io.emit(channel, payload);
            }
            catch {
                logger_1.logger.warn({ channel }, 'Failed to parse websocket payload');
            }
        });
        logger_1.logger.info('WebSocket server initialized');
        this.initialized = true;
    }
    getStats() {
        return {
            initialized: this.initialized,
            connectedClients: this.io?.engine.clientsCount ?? 0
        };
    }
}
exports.gatewayWebSocketServer = new GatewayWebSocketServer();
