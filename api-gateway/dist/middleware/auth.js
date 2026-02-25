"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roleMiddleware = exports.authMiddleware = void 0;
const errors_1 = require("../utils/errors");
const jwt_1 = require("../utils/jwt");
const authMiddleware = (req, _res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        throw new errors_1.AppError('Missing bearer token', 401);
    }
    const token = authHeader.replace('Bearer ', '').trim();
    req.user = (0, jwt_1.verifyJwt)(token);
    next();
};
exports.authMiddleware = authMiddleware;
const roleMiddleware = (allowedRoles) => (req, _res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
        throw new errors_1.AppError('Forbidden', 403);
    }
    next();
};
exports.roleMiddleware = roleMiddleware;
