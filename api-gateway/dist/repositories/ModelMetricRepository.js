"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModelMetricRepository = void 0;
const ModelMetric_1 = require("../models/ModelMetric");
class ModelMetricRepository {
    async create(payload) {
        return ModelMetric_1.ModelMetricModel.create(payload);
    }
    async findRecent(limit = 100) {
        return ModelMetric_1.ModelMetricModel.find({}).sort({ snapshotAt: -1 }).limit(limit);
    }
    async findLatest() {
        return ModelMetric_1.ModelMetricModel.findOne({}).sort({ snapshotAt: -1 });
    }
}
exports.ModelMetricRepository = ModelMetricRepository;
