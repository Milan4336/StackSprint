import { Schema, model, Document } from 'mongoose';

export interface ForensicEvent {
    type: 'MOUSE_MOVE' | 'CLICK' | 'HOVER' | 'SCROLL' | 'INPUT';
    x?: number;
    y?: number;
    target?: string;
    timestamp: number;
}

export interface SessionReplayDocument extends Document {
    sessionId: string;
    userId: string;
    events: ForensicEvent[];
    duration: number;
    metadata: any;
}

const forensicEventSchema = new Schema({
    type: { type: String, required: true },
    x: { type: Number },
    y: { type: Number },
    target: { type: String },
    timestamp: { type: Number, required: true }
});

const sessionReplaySchema = new Schema({
    sessionId: { type: String, required: true, unique: true },
    userId: { type: String, required: true, index: true },
    events: [forensicEventSchema],
    duration: { type: Number },
    metadata: { type: Schema.Types.Mixed }
}, { timestamps: true });

export const SessionReplayModel = model<SessionReplayDocument>('SessionReplay', sessionReplaySchema);
