"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchService = void 0;
const Case_1 = require("../models/Case");
const FraudAlert_1 = require("../models/FraudAlert");
const Transaction_1 = require("../models/Transaction");
const User_1 = require("../models/User");
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
class SearchService {
    async search(raw) {
        const query = raw.trim();
        if (!query) {
            return {
                transactions: [],
                users: [],
                alerts: [],
                cases: []
            };
        }
        const safe = escapeRegex(query);
        const pattern = { $regex: safe, $options: 'i' };
        const [transactions, users, alerts, cases] = await Promise.all([
            Transaction_1.TransactionModel.find({
                $or: [{ transactionId: pattern }, { userId: pattern }, { deviceId: pattern }, { location: pattern }]
            })
                .sort({ timestamp: -1 })
                .limit(20),
            User_1.UserModel.find({ $or: [{ email: pattern }, { role: pattern }] })
                .select('email role createdAt')
                .limit(20),
            FraudAlert_1.FraudAlertModel.find({
                $or: [{ alertId: pattern }, { transactionId: pattern }, { userId: pattern }, { reason: pattern }]
            })
                .sort({ createdAt: -1 })
                .limit(20),
            Case_1.CaseModel.find({
                $or: [{ caseId: pattern }, { transactionId: pattern }, { assignedTo: pattern }]
            })
                .sort({ updatedAt: -1 })
                .limit(20)
        ]);
        return {
            transactions,
            users,
            alerts,
            cases
        };
    }
}
exports.SearchService = SearchService;
