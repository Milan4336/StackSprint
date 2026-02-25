"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionModel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const explanationItemSchema = new mongoose_1.Schema({
    feature: { type: String, required: true },
    impact: { type: Number, required: true },
    reason: { type: String, required: true }
}, { _id: false });
const transactionSchema = new mongoose_1.Schema({
    transactionId: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    amount: { type: Number, required: true },
    currency: { type: String, required: true },
    location: { type: String, required: true },
    latitude: { type: Number, required: false },
    longitude: { type: Number, required: false },
    city: { type: String, required: false },
    country: { type: String, required: false },
    deviceId: { type: String, required: true },
    ipAddress: { type: String, required: true },
    timestamp: { type: Date, required: true, index: true },
    action: { type: String, enum: ['ALLOW', 'STEP_UP_AUTH', 'BLOCK'], required: true, index: true },
    ruleScore: { type: Number, required: true },
    mlScore: { type: Number, required: true },
    mlStatus: { type: String, enum: ['HEALTHY', 'DEGRADED', 'OFFLINE'], required: true, index: true },
    modelVersion: { type: String, required: true },
    modelName: { type: String, required: true },
    modelConfidence: { type: Number, required: true },
    fraudScore: { type: Number, required: true },
    riskLevel: { type: String, enum: ['Low', 'Medium', 'High'], required: true, index: true },
    isFraud: { type: Boolean, required: true, index: true },
    geoVelocityFlag: { type: Boolean, required: false, default: false },
    explanations: { type: [explanationItemSchema], default: [] }
}, { timestamps: true, collection: 'transactions' });
exports.TransactionModel = mongoose_1.default.model('Transaction', transactionSchema);
