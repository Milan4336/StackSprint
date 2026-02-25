"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRiskProfileRepository = void 0;
const UserRiskProfile_1 = require("../models/UserRiskProfile");
class UserRiskProfileRepository {
    async upsert(userId, payload) {
        const next = await UserRiskProfile_1.UserRiskProfileModel.findOneAndUpdate({ userId }, { ...payload, userId }, { new: true, upsert: true });
        if (!next) {
            throw new Error('Failed to upsert user risk profile');
        }
        return next;
    }
    async findByUserId(userId) {
        return UserRiskProfile_1.UserRiskProfileModel.findOne({ userId });
    }
}
exports.UserRiskProfileRepository = UserRiskProfileRepository;
