"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const pino_http_1 = __importDefault(require("pino-http"));
const env_1 = require("./config/env");
const logger_1 = require("./config/logger");
const rateLimiter_1 = require("./middleware/rateLimiter");
const requestId_1 = require("./middleware/requestId");
const errorHandler_1 = require("./middleware/errorHandler");
const routes_1 = require("./routes");
const metrics_1 = require("./utils/metrics");
exports.app = (0, express_1.default)();
exports.app.disable('x-powered-by');
exports.app.use((0, helmet_1.default)());
exports.app.use((0, cors_1.default)({
    origin: env_1.env.ALLOWED_ORIGINS.split(',').map((v) => v.trim()),
    credentials: true
}));
exports.app.use(express_1.default.json({ limit: '1mb' }));
exports.app.use(requestId_1.requestIdMiddleware);
exports.app.use(rateLimiter_1.apiRateLimiter);
exports.app.use((0, pino_http_1.default)({
    logger: logger_1.logger,
    genReqId: (req) => req.requestId
}));
exports.app.use((0, morgan_1.default)('combined'));
exports.app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', service: 'api-gateway' });
});
exports.app.get('/metrics', async (_req, res) => {
    res.set('Content-Type', metrics_1.register.contentType);
    res.end(await metrics_1.register.metrics());
});
exports.app.use((req, res, next) => {
    res.on('finish', () => {
        metrics_1.httpRequestsTotal.inc({ method: req.method, route: req.path, status: String(res.statusCode) });
    });
    next();
});
exports.app.use(routes_1.router);
exports.app.use(errorHandler_1.errorHandler);
