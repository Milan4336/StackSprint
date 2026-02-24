import mongoose from 'mongoose';
import { redisClient } from '../config/redis';
import { MlServiceClient } from './MlServiceClient';
import { gatewayWebSocketServer } from '../websocket/server';

export class SystemHealthService {
  constructor(private readonly mlServiceClient: MlServiceClient) {}

  async getHealth() {
    const apiStart = Date.now();
    await Promise.resolve();
    const apiLatencyMs = Date.now() - apiStart;

    const redisStart = Date.now();
    let redisStatus: 'UP' | 'DOWN' = 'UP';
    let redisLatencyMs = 0;
    try {
      await redisClient.ping();
      redisLatencyMs = Date.now() - redisStart;
    } catch {
      redisStatus = 'DOWN';
    }

    const mlStart = Date.now();
    let mlLatencyMs = 0;
    let mlStatus: 'UP' | 'DOWN' = 'UP';
    try {
      await this.mlServiceClient.healthCheck();
      mlLatencyMs = Date.now() - mlStart;
    } catch {
      mlStatus = 'DOWN';
    }

    const mongoStatus = mongoose.connection.readyState === 1 ? 'UP' : 'DOWN';
    const wsStats = gatewayWebSocketServer.getStats();

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
