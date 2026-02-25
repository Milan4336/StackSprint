"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsController = void 0;
class SettingsController {
    settingsService;
    constructor(settingsService) {
        this.settingsService = settingsService;
    }
    get = async (_req, res) => {
        const result = await this.settingsService.get();
        res.status(200).json(result);
    };
    update = async (req, res) => {
        const result = await this.settingsService.update(req.body, {
            actorId: req.user?.sub,
            actorEmail: req.user?.email,
            ipAddress: req.ip
        });
        res.status(200).json(result);
    };
}
exports.SettingsController = SettingsController;
