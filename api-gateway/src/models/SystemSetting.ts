import mongoose, { Document, Schema } from 'mongoose';

export interface SystemSettingDocument extends Document {
  key: string;
  highAmountThreshold: number;
  velocityWindowMinutes: number;
  velocityTxThreshold: number;
  scoreRuleWeight: number;
  scoreMlWeight: number;
  autonomousAlertThreshold: number;
  simulationMode: boolean;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const systemSettingSchema = new Schema<SystemSettingDocument>(
  {
    key: { type: String, required: true, unique: true, index: true },
    highAmountThreshold: { type: Number, required: true },
    velocityWindowMinutes: { type: Number, required: true },
    velocityTxThreshold: { type: Number, required: true },
    scoreRuleWeight: { type: Number, required: true },
    scoreMlWeight: { type: Number, required: true },
    autonomousAlertThreshold: { type: Number, required: true },
    simulationMode: { type: Boolean, required: true, default: true },
    updatedBy: { type: String, required: false }
  },
  { timestamps: true, collection: 'system_settings' }
);

export const SystemSettingModel = mongoose.model<SystemSettingDocument>('SystemSetting', systemSettingSchema);
