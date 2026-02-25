"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRiskProfileService = void 0;
class UserRiskProfileService {
    transactionRepository;
    userRiskProfileRepository;
    constructor(transactionRepository, userRiskProfileRepository) {
        this.transactionRepository = transactionRepository;
        this.userRiskProfileRepository = userRiskProfileRepository;
    }
    async buildAndStore(userId, now) {
        const from24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const from7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const [dayHistory, weekHistory] = await Promise.all([
            this.transactionRepository.findByUserWithinWindow(userId, from24h),
            this.transactionRepository.findByUserWithinWindow(userId, from7d)
        ]);
        const totalAmount = weekHistory.reduce((sum, tx) => sum + tx.amount, 0);
        const avgTransactionAmount = weekHistory.length ? totalAmount / weekHistory.length : 0;
        const transactionVelocity = dayHistory.length / 24;
        const deviceCount = new Set(dayHistory.map((tx) => tx.deviceId)).size;
        const locationChanges = dayHistory.reduce((count, tx, index, arr) => {
            if (index === 0)
                return 0;
            return count + (arr[index - 1]?.location !== tx.location ? 1 : 0);
        }, 0);
        const locationChangeFrequency = dayHistory.length > 1 ? locationChanges / (dayHistory.length - 1) : 0;
        await this.userRiskProfileRepository.upsert(userId, {
            avgTransactionAmount,
            transactionVelocity,
            deviceCount,
            locationChangeFrequency
        });
        return {
            avgTransactionAmount,
            transactionVelocity,
            deviceCount,
            locationChangeFrequency
        };
    }
    async findByUserId(userId) {
        return this.userRiskProfileRepository.findByUserId(userId);
    }
}
exports.UserRiskProfileService = UserRiskProfileService;
