"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const errors_1 = require("../utils/errors");
const password_1 = require("../utils/password");
const jwt_1 = require("../utils/jwt");
class AuthService {
    userRepository;
    auditService;
    constructor(userRepository, auditService) {
        this.userRepository = userRepository;
        this.auditService = auditService;
    }
    async register(email, password, role) {
        const existing = await this.userRepository.findByEmail(email);
        if (existing) {
            throw new errors_1.AppError('User already exists', 409);
        }
        const user = await this.userRepository.upsert(email, (0, password_1.hashPassword)(password), role);
        await this.auditService.log({
            eventType: 'AUTH_REGISTER',
            action: 'register',
            entityType: 'user',
            entityId: String(user._id),
            actor: {
                actorId: String(user._id),
                actorEmail: user.email
            },
            metadata: {
                role: user.role
            }
        });
        return { token: (0, jwt_1.signJwt)({ sub: String(user._id), email: user.email, role: user.role }) };
    }
    async login(email, password) {
        const user = await this.userRepository.findByEmail(email);
        if (!user || !(0, password_1.comparePassword)(password, user.password)) {
            throw new errors_1.AppError('Invalid credentials', 401);
        }
        await this.auditService.log({
            eventType: 'AUTH_LOGIN',
            action: 'login',
            entityType: 'user',
            entityId: String(user._id),
            actor: {
                actorId: String(user._id),
                actorEmail: user.email
            },
            metadata: {
                role: user.role
            }
        });
        return { token: (0, jwt_1.signJwt)({ sub: String(user._id), email: user.email, role: user.role }) };
    }
}
exports.AuthService = AuthService;
