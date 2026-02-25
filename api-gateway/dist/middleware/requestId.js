"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestIdMiddleware = void 0;
const uuid_1 = require("uuid");
const requestIdMiddleware = (req, res, next) => {
    req.requestId = req.headers['x-request-id']?.toString() || (0, uuid_1.v4)();
    res.setHeader('x-request-id', req.requestId);
    next();
};
exports.requestIdMiddleware = requestIdMiddleware;
