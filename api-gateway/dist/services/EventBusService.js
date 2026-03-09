"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventBusService = void 0;
const redis_1 = require("../config/redis");
class EventBusService {
    async publishTransactionCreated(payload) {
        const serialized = JSON.stringify(payload);
        await Promise.all([
            redis_1.redisClient.publish('transactions.created', serialized),
            redis_1.redisClient.publish('transactions.live', serialized)
        ]);
    }
    async publishFraudAlert(payload) {
        await redis_1.redisClient.publish('fraud.alerts', JSON.stringify(payload));
    }
    async publishSimulationEvent(payload) {
        await redis_1.redisClient.publish('simulation.events', JSON.stringify(payload));
    }
    // Generic publisher for Dashboard V3 realtime events
    async publishDashboardEvent(event, payload) {
        const message = {
            event,
            timestamp: new Date().toISOString(),
            payload
        };
        await redis_1.redisClient.publish(event, JSON.stringify(message));
    }
}
exports.EventBusService = EventBusService;
