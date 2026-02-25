"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimulationController = void 0;
class SimulationController {
    simulationService;
    constructor(simulationService) {
        this.simulationService = simulationService;
    }
    start = async (req, res) => {
        const count = Number(req.body?.count ?? 50);
        const result = await this.simulationService.startSimulation(Math.max(1, Math.min(500, count)));
        res.status(200).json(result);
    };
}
exports.SimulationController = SimulationController;
