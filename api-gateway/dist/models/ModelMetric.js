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
exports.ModelMetricModel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const scoreDistributionSchema = new mongoose_1.Schema({
    low: { type: Number, required: true },
    medium: { type: Number, required: true },
    high: { type: Number, required: true }
}, { _id: false });
const inputDistributionSchema = new mongoose_1.Schema({
    avgAmount: { type: Number, required: true },
    uniqueDevices: { type: Number, required: true },
    uniqueLocations: { type: Number, required: true }
}, { _id: false });
const modelMetricSchema = new mongoose_1.Schema({
    snapshotAt: { type: Date, required: true, index: true, default: () => new Date() },
    fraudRate: { type: Number, required: true },
    avgFraudScore: { type: Number, required: true },
    scoreDistribution: { type: scoreDistributionSchema, required: true },
    inputDistribution: { type: inputDistributionSchema, required: true },
    driftDetected: { type: Boolean, required: true, index: true, default: false },
    driftReason: { type: String, required: false }
}, { timestamps: true, collection: 'model_metrics' });
exports.ModelMetricModel = mongoose_1.default.model('ModelMetric', modelMetricSchema);
