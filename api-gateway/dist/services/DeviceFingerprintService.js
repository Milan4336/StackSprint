"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeviceFingerprintService = void 0;
class DeviceFingerprintService {
    userDeviceRepository;
    constructor(userDeviceRepository) {
        this.userDeviceRepository = userDeviceRepository;
    }
    async track(input) {
        const existing = await this.userDeviceRepository.findByUserAndDevice(input.userId, input.deviceId);
        const suspiciousByNovelty = !existing;
        const suspiciousByRisk = input.riskLevel === 'High' || input.fraudScore >= 75;
        await this.userDeviceRepository.upsert({
            userId: input.userId,
            deviceId: input.deviceId,
            location: input.location,
            firstSeen: existing?.firstSeen ?? input.timestamp,
            lastSeen: input.timestamp,
            isSuspicious: suspiciousByNovelty || suspiciousByRisk,
            riskLevel: suspiciousByRisk ? 'High' : input.riskLevel
        });
    }
}
exports.DeviceFingerprintService = DeviceFingerprintService;
