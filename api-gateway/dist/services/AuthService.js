"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const errors_1 = require("../utils/errors");
const password_1 = require("../utils/password");
const jwt_1 = require("../utils/jwt");
class AuthService {
    userRepository;
    auditService;
    otpRepository;
    constructor(userRepository, auditService, otpRepository) {
        this.userRepository = userRepository;
        this.auditService = auditService;
        this.otpRepository = otpRepository;
    }
    async register(email, password, role) {
        try {
            // Check if user already exists
            const existing = await this.userRepository.findByEmail(email);
            if (existing) {
                throw new errors_1.AppError('User already exists', 409);
            }
            // Create user
            const user = await this.userRepository.upsert(email, (0, password_1.hashPassword)(password), role);
            // Audit log
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
            // Return JWT token
            return {
                token: (0, jwt_1.signJwt)({
                    sub: user.userId || String(user._id),
                    email: user.email,
                    role: user.role,
                    status: user.status
                })
            };
        }
        catch (error) {
            if (error?.code === 11000 || error?.message?.includes('duplicate key')) {
                throw new errors_1.AppError('User already exists', 409);
            }
            if (error instanceof errors_1.AppError)
                throw error;
            throw new errors_1.AppError('Failed to register user', 500);
        }
    }
    async login(email, password) {
        try {
            const user = await this.userRepository.findByEmail(email);
            console.error(`[DEBUG LOGIN] email: ${email}`);
            console.error(`[DEBUG LOGIN] user exists?: ${!!user}`);
            if (user) {
                console.error(`[DEBUG LOGIN] password hash match?: ${(0, password_1.comparePassword)(password, user.password)}`);
            }
            if (!user || !(0, password_1.comparePassword)(password, user.password)) {
                throw new errors_1.AppError('Invalid credentials', 401);
            }
            if (user.status === 'FROZEN') {
                throw new errors_1.AppError('Account is frozen due to suspicious activity. Contact support.', 403);
            }
            // Update last login
            user.lastLogin = new Date();
            if (!user.userId) {
                user.userId = user.email;
            }
            await user.save();
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
            return {
                token: (0, jwt_1.signJwt)({
                    sub: user.userId || String(user._id),
                    email: user.email,
                    role: user.role,
                    status: user.status
                })
            };
        }
        catch (error) {
            if (error instanceof errors_1.AppError)
                throw error;
            console.error("Inner Login Error:", error);
            throw new errors_1.AppError('Login failed', 500);
        }
    }
    async requestOtp(userId) {
        const user = await this.userRepository.findByEmail(userId);
        if (!user)
            throw new errors_1.AppError('User not found', 404);
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        await this.otpRepository.create(user.userId, code);
        console.log(`[BANK-GRADE SECURITY] OTP for ${user.email}: ${code}`);
        await this.auditService.log({
            eventType: 'AUTH_OTP_REQUESTED',
            action: 'request',
            entityType: 'otp',
            entityId: user.userId,
            actor: { actorId: user.userId, actorEmail: user.email },
            metadata: { method: 'SMS_FALLBACK' }
        });
        return { message: 'OTP sent successfully' };
    }
    async verifyOtp(userId, code) {
        const isValid = await this.otpRepository.verify(userId, code);
        if (!isValid)
            throw new errors_1.AppError('Invalid or expired OTP', 401);
        const user = await this.userRepository.findByEmail(userId);
        if (user && user.status === 'RESTRICTED') {
            user.status = 'ACTIVE';
            await user.save();
        }
        await this.auditService.log({
            eventType: 'AUTH_OTP_VERIFIED',
            action: 'verify',
            entityType: 'otp',
            entityId: userId,
            metadata: { success: true }
        });
        return { message: 'OTP verified successfully' };
    }
    async me(userId) {
        const user = await this.userRepository.findByEmail(userId);
        if (!user)
            throw new errors_1.AppError('User not found', 404);
        return {
            userId: user.userId,
            email: user.email,
            role: user.role,
            status: user.status,
            riskScore: user.riskScore,
            lastLogin: user.lastLogin
        };
    }
}
exports.AuthService = AuthService;
