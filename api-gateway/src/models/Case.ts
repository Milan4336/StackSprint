import mongoose, { Document, Schema } from 'mongoose';

export type CaseStatus = 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'FALSE_POSITIVE';
export type CasePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface CaseTimelineItem {
  at: Date;
  actor: string;
  action: string;
  note?: string;
}

export interface CaseDocument extends Document {
  caseId: string;
  transactionId: string;
  alertId?: string;
  assignedTo?: string;
  status: CaseStatus;
  priority: CasePriority;
  notes: string[];
  timeline: CaseTimelineItem[];
  createdAt: Date;
  updatedAt: Date;
}

const caseTimelineSchema = new Schema<CaseTimelineItem>(
  {
    at: { type: Date, required: true },
    actor: { type: String, required: true },
    action: { type: String, required: true },
    note: { type: String, required: false }
  },
  { _id: false }
);

const caseSchema = new Schema<CaseDocument>(
  {
    caseId: { type: String, required: true, unique: true, index: true },
    transactionId: { type: String, required: true, index: true },
    alertId: { type: String, required: false, index: true },
    assignedTo: { type: String, required: false, index: true },
    status: {
      type: String,
      enum: ['OPEN', 'INVESTIGATING', 'RESOLVED', 'FALSE_POSITIVE'],
      required: true,
      default: 'OPEN',
      index: true
    },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      required: true,
      default: 'MEDIUM',
      index: true
    },
    notes: { type: [String], default: [] },
    timeline: { type: [caseTimelineSchema], default: [] }
  },
  { timestamps: true, collection: 'cases' }
);

export const CaseModel = mongoose.model<CaseDocument>('Case', caseSchema);
