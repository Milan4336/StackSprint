"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const logger_1 = require("../config/logger");
class AuthController {
    authService;
    constructor(authService) {
        this.authService = authService;
    }
    register = async (req, res) => {
        try {
            const { email, password, role } = req.body;
            const result = await this.authService.register(email, password, role);
            res.status(201).json(result);
        }
        catch (error) {
            if (error?.code === 11000) {
                res.status(409).json({ error: 'User already exists' });
                return;
            }
            if (error?.message?.toLowerCase().includes('exists')) {
                res.status(409).json({ error: 'User already exists' });
                return;
            }
            logger_1.logger.error({ error }, 'Register failed');
            res.status(500).json({ error: 'Internal server error' });
        }
    };
    login = async (req, res) => {
        try {
            const { email, password } = req.body;
            const result = await this.authService.login(email, password);
            res.status(200).json(result);
        }
        catch (error) {
            if (error?.message?.toLowerCase().includes('invalid')) {
                res.status(401).json({ error: 'Invalid credentials' });
                return;
            }
            logger_1.logger.error({ error }, 'Login failed');
            res.status(500).json({ error: 'Internal server error' });
        }
    };
    requestOtp = async (req, res) => {
        try {
            const { userId } = req.body;
            const result = await this.authService.requestOtp(userId);
            res.status(200).json(result);
        }
        catch (error) {
            logger_1.logger.error({ error }, 'Request OTP failed');
            res.status(500).json({ error: 'Internal server error' });
        }
    };
    verifyOtp = async (req, res) => {
        try {
            const { userId, code } = req.body;
            const result = await this.authService.verifyOtp(userId, code);
            res.status(200).json(result);
        }
        catch (error) {
            if (error?.message?.toLowerCase().includes('invalid')) {
                res.status(401).json({ error: 'Invalid or expired OTP' });
                return;
            }
            logger_1.logger.error({ error }, 'Verify OTP failed');
            res.status(500).json({ error: 'Internal server error' });
        }
    };
    me = async (req, res) => {
        try {
            const user = await this.authService.me(req.user.email);
            res.status(200).json(user);
        }
        catch (error) {
            logger_1.logger.error({ error }, 'Get me failed');
            res.status(500).json({ error: 'Internal server error' });
        }
    };
}
exports.AuthController = AuthController;
