"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModelController = void 0;
class ModelController {
    mlServiceClient;
    modelMetricsService;
    constructor(mlServiceClient, modelMetricsService) {
        this.mlServiceClient = mlServiceClient;
        this.modelMetricsService = modelMetricsService;
    }
    info = async (_req, res) => {
        const info = await this.mlServiceClient.fetchRemoteModelInfo();
        res.status(200).json(info);
    };
    health = async (req, res) => {
        const limit = Number(req.query.limit ?? 100);
        const [latest, metrics] = await Promise.all([
            this.modelMetricsService.latest(),
            this.modelMetricsService.listRecent(Math.max(1, Math.min(500, limit)))
        ]);
        res.status(200).json({ latest, metrics });
    };
    updateConfig = async (req, res) => {
        const result = await this.mlServiceClient.updateModelConfig(req.body);
        res.status(200).json(result);
    };
}
exports.ModelController = ModelController;
