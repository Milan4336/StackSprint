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
            // Mongo duplicate key error
            if (error?.code === 11000) {
                res.status(409).json({
                    error: 'User already exists'
                });
                return;
            }
            // AuthService may throw custom duplicate error
            if (error?.message?.toLowerCase().includes('exists')) {
                res.status(409).json({
                    error: 'User already exists'
                });
                return;
            }
            logger_1.logger.error({ error }, 'Register failed');
            res.status(500).json({
                error: 'Internal server error'
            });
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
                res.status(401).json({
                    error: 'Invalid credentials'
                });
                return;
            }
            logger_1.logger.error({ error }, 'Login failed');
            res.status(500).json({
                error: 'Internal server error'
            });
        }
    };
}
exports.AuthController = AuthController;
