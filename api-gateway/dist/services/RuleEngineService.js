"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RuleEngineService = void 0;
const geolocation_1 = require("../utils/geolocation");
class RuleEngineService {
    transactionRepository;
    userRiskProfileService;
    settingsService;
    constructor(transactionRepository, userRiskProfileService, settingsService) {
        this.transactionRepository = transactionRepository;
        this.userRiskProfileService = userRiskProfileService;
        this.settingsService = settingsService;
    }
    async evaluate(input) {
        let score = 0;
        const reasons = [];
        let geoVelocityFlag = false;
        const runtimeConfig = await this.settingsService.getRuntimeConfig();
        const profile = await this.userRiskProfileService.buildAndStore(input.userId, input.timestamp);
        if (profile.avgTransactionAmount > 0 && input.amount > profile.avgTransactionAmount * 3) {
            score += 12;
            reasons.push(`Behavioral anomaly: amount ${input.amount} is >3x user average ${profile.avgTransactionAmount.toFixed(2)}.`);
        }
        if (profile.transactionVelocity >= 1.5) {
            score += 8;
            reasons.push(`Elevated user velocity profile (${profile.transactionVelocity.toFixed(2)} tx/hour).`);
        }
        if (profile.locationChangeFrequency >= 0.6) {
            score += 6;
            reasons.push(`High location change frequency (${(profile.locationChangeFrequency * 100).toFixed(0)}%).`);
        }
        if (profile.deviceCount >= 5) {
            score += 5;
            reasons.push(`High device churn detected (${profile.deviceCount} devices in last 24h).`);
        }
        if (input.amount >= runtimeConfig.highAmountThreshold) {
            score += 40;
            reasons.push(`High transaction amount (${input.amount}) exceeds threshold ${runtimeConfig.highAmountThreshold}.`);
        }
        const from = new Date(input.timestamp.getTime() - runtimeConfig.velocityWindowMinutes * 60 * 1000);
        const recent = await this.transactionRepository.findByUserWithinWindow(input.userId, from);
        if (recent.length >= runtimeConfig.velocityTxThreshold) {
            score += 25;
            reasons.push(`High velocity detected (${recent.length + 1} transactions in ${runtimeConfig.velocityWindowMinutes} minutes).`);
        }
        const latest = await this.transactionRepository.findLatestByUser(input.userId);
        if (latest && latest.location !== input.location) {
            score += 20;
            reasons.push(`Location anomaly: ${latest.location} -> ${input.location}.`);
        }
        if (latest && latest.deviceId !== input.deviceId) {
            score += 15;
            reasons.push(`New device detected: previous ${latest.deviceId}, current ${input.deviceId}.`);
        }
        if (latest && latest.ipAddress !== input.ipAddress) {
            score += 10;
            reasons.push(`IP change detected: ${latest.ipAddress} -> ${input.ipAddress}.`);
        }
        const latestHasCoords = typeof latest?.latitude === 'number' && typeof latest?.longitude === 'number';
        const inputHasCoords = typeof input.latitude === 'number' && typeof input.longitude === 'number';
        if (latest && latestHasCoords && inputHasCoords) {
            const hoursDiff = Math.abs(input.timestamp.getTime() - latest.timestamp.getTime()) / (1000 * 60 * 60);
            const geoDistance = (0, geolocation_1.haversineKm)({ latitude: latest.latitude, longitude: latest.longitude }, { latitude: input.latitude, longitude: input.longitude });
            if (geoDistance > 1500 && hoursDiff < 2) {
                score += 30;
                geoVelocityFlag = true;
                reasons.push(`Suspicious geo velocity detected (${Math.round(geoDistance)}km in ${hoursDiff.toFixed(2)}h).`);
            }
        }
        const from24h = new Date(input.timestamp.getTime() - 24 * 60 * 60 * 1000);
        const dayHistory = await this.transactionRepository.findByUserWithinWindow(input.userId, from24h);
        const uniqueDevices = new Set(dayHistory.map((tx) => tx.deviceId));
        uniqueDevices.add(input.deviceId);
        if (uniqueDevices.size >= 3) {
            score += 10;
            reasons.push(`Multiple devices used in 24h (${uniqueDevices.size} unique devices).`);
        }
        return {
            score: Math.max(0, Math.min(100, score)),
            reasons,
            geoVelocityFlag
        };
    }
}
exports.RuleEngineService = RuleEngineService;
