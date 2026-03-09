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
// All Redis channels that the dashboard needs forwarded to Socket.IO clients
const SUBSCRIBED_CHANNELS = [
    // Transaction events
    'transactions.live',
    'transactions.created',
    // Fraud / alert events
    'fraud.alerts',
    // Simulation events
    'simulation.events',
    // Dashboard Intelligence Cron events
    'system.threatIndex',
    'system.riskPulse',
    'system.spike',
    'system.modelConfidence',
    'velocity.live',
    'drift.live',
    'risk.forecast',
    'alerts.pressure',
    // Geo & Collusion
    'geo.live',
    'collusion.detected',
    // System actions feed
    'system.actions',
];
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
            try {
                const token = resolveToken(socket.handshake.auth?.token || socket.handshake.headers?.authorization);
                if (!token)
                    return next(new Error('Authentication error'));
                const decoded = (0, jwt_1.verifyJwt)(token);
                socket.user = decoded;
                next();
            }
            catch (error) {
                next(new Error('Authentication error'));
            }
        });
        this.io.on('connection', (socket) => {
            socket.emit('system.status', {
                status: 'connected',
                at: new Date().toISOString()
            });
            logger_1.logger.info({ socketId: socket.id }, 'Client connected');
            socket.on('disconnect', () => {
                logger_1.logger.info({ socketId: socket.id }, 'Client disconnected');
            });
        });
        this.subscriber = redis_1.redisClient.duplicate();
        await this.subscriber.subscribe(...SUBSCRIBED_CHANNELS);
        this.subscriber.on('message', (channel, message) => {
            if (!this.io)
                return;
            try {
                const parsed = JSON.parse(message);
                // RealtimeEventBus wraps in { event, timestamp, payload }
                // Emit the inner payload so frontend sees it at the top level,
                // but also emit the full envelope so either format works.
                const payloadToEmit = parsed?.payload ?? parsed;
                this.io.emit(channel, payloadToEmit);
            }
            catch {
                logger_1.logger.warn({ channel }, 'Failed to parse websocket payload');
            }
        });
        logger_1.logger.info({ channels: SUBSCRIBED_CHANNELS }, 'WebSocket server initialized');
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
