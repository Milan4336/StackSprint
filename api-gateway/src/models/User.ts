import mongoose, { Schema, Document } from 'mongoose';

export type UserRole = 'admin' | 'analyst' | 'user';

export interface UserDocument extends Document {
  userId: string;
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  role: UserRole;
  status: 'ACTIVE' | 'RESTRICTED' | 'FROZEN';
  riskScore: number;
  identitySafetyScore: number;
  mfaEnabled: boolean;
  lastLogin?: Date;
}

const userSchema = new Schema<UserDocument>(
  {
    userId: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    fullName: { type: String, required: true },
    phone: { type: String },
    role: { type: String, enum: ['admin', 'analyst', 'user'], required: true },
    status: { type: String, enum: ['ACTIVE', 'RESTRICTED', 'FROZEN'], default: 'ACTIVE' },
    riskScore: { type: Number, default: 0 },
    identitySafetyScore: { type: Number, default: 70 },
    mfaEnabled: { type: Boolean, default: false },
    lastLogin: { type: Date }
  },
  { timestamps: true }
);

export const UserModel = mongoose.model<UserDocument>('User', userSchema);
