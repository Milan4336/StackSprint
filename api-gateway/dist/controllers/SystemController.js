"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SystemController = void 0;
class SystemController {
    mlServiceClient;
    systemHealthService;
    constructor(mlServiceClient, systemHealthService) {
        this.mlServiceClient = mlServiceClient;
        this.systemHealthService = systemHealthService;
    }
    mlStatus = async (_req, res) => {
        res.status(200).json(this.mlServiceClient.getStatus());
    };
    health = async (_req, res) => {
        const result = await this.systemHealthService.getHealth();
        res.status(200).json(result);
    };
}
exports.SystemController = SystemController;
