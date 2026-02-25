"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../config/db");
const Transaction_1 = require("../models/Transaction");
const geolocation_1 = require("./geolocation");
const seed = async () => {
    await (0, db_1.connectMongo)();
    const now = Date.now();
    const docs = Array.from({ length: 100 }).map((_, i) => {
        const location = ['NY', 'CA', 'TX', 'FL'][i % 4];
        const coordinates = (0, geolocation_1.geocodeLocation)(location);
        const fraudScore = Math.round(Math.random() * 100);
        const riskLevel = (fraudScore <= 30 ? 'Low' : fraudScore <= 70 ? 'Medium' : 'High');
        const action = (fraudScore >= 71 ? 'BLOCK' : fraudScore >= 31 ? 'STEP_UP_AUTH' : 'ALLOW');
        return {
            transactionId: `tx-${i + 1}`,
            userId: `user-${(i % 10) + 1}`,
            amount: Math.round(Math.random() * 9000 + 20),
            currency: 'USD',
            location,
            latitude: coordinates?.latitude,
            longitude: coordinates?.longitude,
            city: coordinates?.city,
            country: coordinates?.country,
            deviceId: `device-${(i % 15) + 1}`,
            ipAddress: `10.0.0.${(i % 250) + 1}`,
            timestamp: new Date(now - i * 60_000),
            action,
            ruleScore: fraudScore,
            mlScore: Number((fraudScore / 100).toFixed(4)),
            mlStatus: 'HEALTHY',
            modelVersion: '1.0.0',
            modelName: 'IsolationForest-Fraud-v1',
            modelConfidence: Number((fraudScore / 100).toFixed(4)),
            fraudScore,
            riskLevel,
            isFraud: riskLevel === 'High',
            geoVelocityFlag: false
        };
    });
    await Transaction_1.TransactionModel.deleteMany({});
    await Transaction_1.TransactionModel.insertMany(docs);
    process.exit(0);
};
seed().catch(() => process.exit(1));
