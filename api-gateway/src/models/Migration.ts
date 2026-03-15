import mongoose, { Document, Schema } from 'mongoose';

export interface MigrationDocument extends Document {
  migrationId: string;
  description: string;
  appliedAt: Date;
}

const migrationSchema = new Schema<MigrationDocument>(
  {
    migrationId: { type: String, required: true, unique: true, index: true },
    description: { type: String, required: true },
    appliedAt: { type: Date, required: true, default: Date.now }
  },
  { collection: 'migrations', versionKey: false }
);

export const MigrationModel = mongoose.model<MigrationDocument>('Migration', migrationSchema);

