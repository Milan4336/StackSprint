"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SystemSettingRepository = void 0;
const env_1 = require("../config/env");
const SystemSetting_1 = require("../models/SystemSetting");
const DEFAULT_KEY = 'fraud-config';
class SystemSettingRepository {
    async getOrCreate() {
        const existing = await SystemSetting_1.SystemSettingModel.findOne({ key: DEFAULT_KEY });
        if (existing)
            return existing;
        return SystemSetting_1.SystemSettingModel.create({
            key: DEFAULT_KEY,
            highAmountThreshold: env_1.env.HIGH_AMOUNT_THRESHOLD,
            velocityWindowMinutes: env_1.env.VELOCITY_WINDOW_MINUTES,
            velocityTxThreshold: env_1.env.VELOCITY_TX_THRESHOLD,
            scoreRuleWeight: env_1.env.SCORE_RULE_WEIGHT,
            scoreMlWeight: env_1.env.SCORE_ML_WEIGHT,
            autonomousAlertThreshold: env_1.env.AUTONOMOUS_ALERT_THRESHOLD,
            simulationMode: true
        });
    }
    async update(payload) {
        await this.getOrCreate();
        const updated = await SystemSetting_1.SystemSettingModel.findOneAndUpdate({ key: DEFAULT_KEY }, payload, {
            new: true,
            upsert: true
        });
        if (!updated) {
            throw new Error('Failed to update system settings');
        }
        return updated;
    }
}
exports.SystemSettingRepository = SystemSettingRepository;
