"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MlServiceClient = void 0;
const axios_1 = __importDefault(require("axios"));
const env_1 = require("../config/env");
class MlServiceClient {
    failureCount = 0;
    lastError = null;
    lastLatencyMs = 0;
    circuitOpenUntil = 0;
    status = 'HEALTHY';
    failThreshold = env_1.env.ML_CIRCUIT_FAIL_THRESHOLD;
    resetMs = env_1.env.ML_CIRCUIT_RESET_SECONDS * 1000;
    openCircuit(reason) {
        this.status = 'OFFLINE';
        this.lastError = reason;
        this.circuitOpenUntil = Date.now() + this.resetMs;
    }
    markFailure(reason) {
        this.failureCount += 1;
        this.lastError = reason;
        if (this.failureCount >= this.failThreshold) {
            this.openCircuit(reason);
            return;
        }
        this.status = 'DEGRADED';
    }
    markSuccess(latencyMs) {
        this.lastLatencyMs = latencyMs;
        this.failureCount = 0;
        this.lastError = null;
        this.circuitOpenUntil = 0;
        this.status = 'HEALTHY';
    }
    canAttempt() {
        if (this.status !== 'OFFLINE') {
            return true;
        }
        if (Date.now() >= this.circuitOpenUntil) {
            this.status = 'DEGRADED';
            return true;
        }
        return false;
    }
    async score(payload) {
        if (!this.canAttempt()) {
            throw new Error(`ML circuit breaker open until ${new Date(this.circuitOpenUntil).toISOString()}`);
        }
        const startedAt = Date.now();
        const response = await axios_1.default.post(`${env_1.env.ML_SERVICE_URL}/predict`, payload, {
            timeout: 2500
        }).catch((error) => {
            const reason = error instanceof Error ? error.message : 'Unknown ML error';
            this.markFailure(reason);
            throw error;
        });
        this.markSuccess(Date.now() - startedAt);
        return response.data;
    }
    async healthCheck() {
        await axios_1.default.get(`${env_1.env.ML_SERVICE_URL}/health`, { timeout: 2500 });
    }
    getStatus() {
        return {
            status: this.status,
            failureCount: this.failureCount,
            lastLatencyMs: this.lastLatencyMs,
            lastError: this.lastError,
            circuitOpenUntil: this.circuitOpenUntil ? new Date(this.circuitOpenUntil).toISOString() : null
        };
    }
    getModelInfo() {
        return {
            modelName: env_1.env.MODEL_NAME,
            modelVersion: env_1.env.MODEL_VERSION,
            mlStatus: this.status,
            lastLatencyMs: this.lastLatencyMs
        };
    }
}
exports.MlServiceClient = MlServiceClient;
