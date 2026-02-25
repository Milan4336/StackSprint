"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = require("http");
const app_1 = require("./app");
const db_1 = require("./config/db");
const env_1 = require("./config/env");
const logger_1 = require("./config/logger");
const redis_1 = require("./config/redis");
const server_1 = require("./websocket/server");
const bootstrap = async () => {
    await Promise.all([(0, db_1.connectMongo)(), redis_1.redisClient.ping()]);
    const httpServer = (0, http_1.createServer)(app_1.app);
    await server_1.gatewayWebSocketServer.initialize(httpServer);
    httpServer.listen(env_1.env.PORT, "0.0.0.0", () => {
        logger_1.logger.info(`API Gateway listening on ${env_1.env.PORT}`);
    });
};
bootstrap().catch((error) => {
    logger_1.logger.error({ error }, 'Failed to bootstrap API gateway');
    process.exit(1);
});
