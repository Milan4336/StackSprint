"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = exports.httpRequestsTotal = void 0;
const prom_client_1 = __importDefault(require("prom-client"));
prom_client_1.default.collectDefaultMetrics();
exports.httpRequestsTotal = new prom_client_1.default.Counter({
    name: 'http_requests_total',
    help: 'Total HTTP requests',
    labelNames: ['method', 'route', 'status']
});
exports.register = prom_client_1.default.register;
