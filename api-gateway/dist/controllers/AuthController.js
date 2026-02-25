"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
class AuthController {
    authService;
    constructor(authService) {
        this.authService = authService;
    }
    register = async (req, res) => {
        const { email, password, role } = req.body;
        const result = await this.authService.register(email, password, role);
        res.status(201).json(result);
    };
    login = async (req, res) => {
        const { email, password } = req.body;
        const result = await this.authService.login(email, password);
        res.status(200).json(result);
    };
}
exports.AuthController = AuthController;
