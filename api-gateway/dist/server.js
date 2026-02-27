"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = require("http");
const app_1 = require("./app");
const db_1 = require("./config/db");
const env_1 = require("./config/env");
const logger_1 = require("./config/logger");
const server_1 = require("./websocket/server");
const bootstrap = async () => {
    try {
        logger_1.logger.info('Starting API Gateway...');
        const httpServer = (0, http_1.createServer)(app_1.app);
        await server_1.gatewayWebSocketServer.initialize(httpServer);
        // Start server FIRST
        httpServer.listen(env_1.env.PORT || 8080, "0.0.0.0", () => {
            logger_1.logger.info(`API Gateway listening on ${env_1.env.PORT || 8080}`);
        });
        // Connect Mongo in background
        (0, db_1.connectMongo)()
            .then(() => logger_1.logger.info('Mongo connected'))
            .catch((error) => logger_1.logger.error({ error }, 'Mongo connection failed'));
    }
    catch (error) {
        logger_1.logger.error({ error }, 'Bootstrap failure');
    }
};
bootstrap();
