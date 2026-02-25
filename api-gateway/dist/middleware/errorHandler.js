"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const errors_1 = require("../utils/errors");
const logger_1 = require("../config/logger");
const errorHandler = (err, req, res, _next) => {
    const appError = err instanceof errors_1.AppError ? err : new errors_1.AppError('Internal server error', 500);
    logger_1.logger.error({
        requestId: req.requestId,
        path: req.path,
        method: req.method,
        statusCode: appError.statusCode,
        details: appError.details,
        error: err.message
    }, 'Request failed');
    res.status(appError.statusCode).json({
        error: appError.message,
        requestId: req.requestId,
        details: appError.details
    });
};
exports.errorHandler = errorHandler;
