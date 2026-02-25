"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSettingsSchema = exports.updateCaseSchema = exports.createCaseSchema = exports.simulationSchema = exports.loginSchema = exports.registerSchema = exports.createTransactionSchema = void 0;
const zod_1 = require("zod");
exports.createTransactionSchema = zod_1.z.object({
    transactionId: zod_1.z.string().min(1),
    userId: zod_1.z.string().min(1),
    amount: zod_1.z.number().positive(),
    currency: zod_1.z.string().length(3),
    location: zod_1.z.string().min(2),
    deviceId: zod_1.z.string().min(1),
    ipAddress: zod_1.z.string().ip(),
    timestamp: zod_1.z.string().datetime()
});
exports.registerSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(10),
    role: zod_1.z.enum(['admin', 'analyst'])
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(1)
});
exports.simulationSchema = zod_1.z.object({
    count: zod_1.z.number().int().min(1).max(500).optional()
});
exports.createCaseSchema = zod_1.z.object({
    transactionId: zod_1.z.string().min(1),
    alertId: zod_1.z.string().min(1).optional(),
    assignedTo: zod_1.z.string().min(1).optional(),
    status: zod_1.z.enum(['OPEN', 'INVESTIGATING', 'RESOLVED', 'FALSE_POSITIVE']).optional(),
    priority: zod_1.z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
    notes: zod_1.z.array(zod_1.z.string().min(1)).optional()
});
exports.updateCaseSchema = zod_1.z.object({
    status: zod_1.z.enum(['OPEN', 'INVESTIGATING', 'RESOLVED', 'FALSE_POSITIVE']).optional(),
    priority: zod_1.z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
    assignedTo: zod_1.z.string().min(1).optional(),
    note: zod_1.z.string().min(1).optional()
});
exports.updateSettingsSchema = zod_1.z.object({
    highAmountThreshold: zod_1.z.number().positive().optional(),
    velocityWindowMinutes: zod_1.z.number().int().min(1).max(180).optional(),
    velocityTxThreshold: zod_1.z.number().int().min(1).max(200).optional(),
    scoreRuleWeight: zod_1.z.number().min(0).max(1).optional(),
    scoreMlWeight: zod_1.z.number().min(0).max(1).optional(),
    autonomousAlertThreshold: zod_1.z.number().min(1).max(100).optional(),
    simulationMode: zod_1.z.boolean().optional()
});
