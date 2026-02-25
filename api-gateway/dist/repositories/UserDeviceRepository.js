"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserDeviceRepository = void 0;
const UserDevice_1 = require("../models/UserDevice");
class UserDeviceRepository {
    async findByUserAndDevice(userId, deviceId) {
        return UserDevice_1.UserDeviceModel.findOne({ userId, deviceId });
    }
    async upsert(payload) {
        const now = new Date();
        return UserDevice_1.UserDeviceModel.findOneAndUpdate({ userId: payload.userId, deviceId: payload.deviceId }, {
            $set: {
                location: payload.location,
                lastSeen: payload.lastSeen ?? now,
                isSuspicious: payload.isSuspicious,
                riskLevel: payload.riskLevel
            },
            $setOnInsert: {
                firstSeen: payload.firstSeen ?? now
            },
            $inc: { txCount: 1 }
        }, { upsert: true, new: true });
    }
    async findRecent(limit = 200) {
        return UserDevice_1.UserDeviceModel.find({}).sort({ updatedAt: -1 }).limit(limit);
    }
    async findByUser(userId, limit = 200) {
        return UserDevice_1.UserDeviceModel.find({ userId }).sort({ updatedAt: -1 }).limit(limit);
    }
}
exports.UserDeviceRepository = UserDeviceRepository;
