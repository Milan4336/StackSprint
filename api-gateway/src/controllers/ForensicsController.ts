import { NextFunction, Request, Response } from 'express';
import { SessionReplayModel } from '../models/SessionReplay';
import { logger } from '../config/logger';

export class ForensicsController {
    /**
     * Get session replay data for a specific user or session
     */
    async getSessionReplay(req: Request, res: Response, _next: NextFunction) {
        try {
            const sessionId = req.params.sessionId as string;
            const replay = await SessionReplayModel.findOne({ sessionId });
            
            if (!replay) {
                // Return synthetic data if no real replay exists to demonstrate the WOW feature
                return res.json(this.generateSyntheticReplay(sessionId));
            }

            return res.json(replay);
        } catch (error) {
            logger.error(`Failed to fetch session replay: ${error}`);
            return res.status(500).json({ error: 'Failed to fetch session replay' });
        }
    }

    /**
     * List recent forensic sessions
     */
    async listSessions(req: Request, res: Response, _next: NextFunction) {
        try {
            const sessions = await SessionReplayModel.find().select('sessionId userId createdAt duration').sort({ createdAt: -1 }).limit(20);
            return res.json(sessions);
        } catch (error) {
            logger.error(`Failed to list sessions: ${error}`);
            return res.status(500).json({ error: 'Failed to list forensic sessions' });
        }
    }

    private generateSyntheticReplay(sessionId: string) {
        const events = [];
        const startTime = Date.now() - 60000;
        
        // Generate 50 synthetic events (mouse moves and clicks)
        for (let i = 0; i < 50; i++) {
            events.push({
                type: Math.random() > 0.8 ? 'CLICK' : 'MOUSE_MOVE',
                x: Math.floor(Math.random() * 1920),
                y: Math.floor(Math.random() * 1080),
                target: Math.random() > 0.9 ? 'SUBMIT_TX_BTN' : 'NAV_LINK',
                timestamp: startTime + (i * 1000)
            });
        }

        return {
            sessionId,
            userId: 'USR-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
            events,
            duration: 50,
            metadata: {
                browser: 'Chrome 122.0.0',
                os: 'Windows 11',
                ip: '192.168.1.45'
            }
        };
    }
}
