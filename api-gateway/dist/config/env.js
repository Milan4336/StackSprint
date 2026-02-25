"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const zod_1 = require("zod");
dotenv_1.default.config();
const envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(['development', 'test', 'production']).default('development'),
    PORT: zod_1.z.coerce.number().default(8080),
    MONGO_URI: zod_1.z.string().min(1),
    REDIS_URI: zod_1.z.string().min(1),
    JWT_SECRET: zod_1.z.string().min(32),
    JWT_EXPIRES_IN: zod_1.z.string().default('1h'),
    ML_SERVICE_URL: zod_1.z.string().url(),
    ALLOWED_ORIGINS: zod_1.z.string().default('http://localhost:5173'),
    HIGH_AMOUNT_THRESHOLD: zod_1.z.coerce.number().default(5000),
    VELOCITY_WINDOW_MINUTES: zod_1.z.coerce.number().default(5),
    VELOCITY_TX_THRESHOLD: zod_1.z.coerce.number().default(5),
    SCORE_RULE_WEIGHT: zod_1.z.coerce.number().default(0.6),
    SCORE_ML_WEIGHT: zod_1.z.coerce.number().default(0.4),
    AUTONOMOUS_ALERT_THRESHOLD: zod_1.z.coerce.number().default(80),
    GEOIP_API_URL: zod_1.z.string().url().default('https://ipwho.is'),
    GEO_CACHE_TTL_SECONDS: zod_1.z.coerce.number().int().min(60).default(86400),
    MODEL_NAME: zod_1.z.string().default('IsolationForest-Fraud-v1'),
    MODEL_VERSION: zod_1.z.string().default('1.0.0'),
    ML_CIRCUIT_FAIL_THRESHOLD: zod_1.z.coerce.number().int().min(1).default(3),
    ML_CIRCUIT_RESET_SECONDS: zod_1.z.coerce.number().int().min(5).default(60)
});
exports.env = envSchema.parse(process.env);
