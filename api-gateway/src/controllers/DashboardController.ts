import { Request, Response } from 'express';
import { TransactionModel } from '../models/Transaction';
import { FraudAlertModel } from '../models/FraudAlert';
import { logger } from '../config/logger';

export class DashboardController {

    public getOverview = async (req: Request, res: Response) => {
        try {
            const now = new Date();
            const fiveMinAgo = new Date(now.getTime() - 5 * 60000);
            const oneHourAgo = new Date(now.getTime() - 60 * 60000);

            const [txCount, openAlerts, recentTxs, last5MinTxs] = await Promise.all([
                TransactionModel.countDocuments(),
                FraudAlertModel.countDocuments({ status: 'open' }),
                TransactionModel.find({ timestamp: { $gte: oneHourAgo } })
                    .select('fraudScore isFraud riskLevel')
                    .lean(),
                TransactionModel.countDocuments({ timestamp: { $gte: fiveMinAgo } })
            ]);

            const fraudCount = await TransactionModel.countDocuments({ isFraud: true });

            const localFraudCount = recentTxs.filter((t: any) => t.isFraud).length;
            const fraudRate = recentTxs.length > 0
                ? (localFraudCount / recentTxs.length) * 100
                : 0;

            const avgScore = recentTxs.length > 0
                ? recentTxs.reduce((s: number, t: any) => s + (t.fraudScore || 0), 0) / recentTxs.length
                : 0;

            // Derive threat index: blend fraud rate + avg score
            const threatIndex = Math.min(100, Math.round(fraudRate * 1.5 + avgScore * 0.5));

            const velocity = last5MinTxs / 300; // avg TPS over 5 min

            const riskDistribution = { Low: 0, Medium: 0, High: 0 };
            recentTxs.forEach((t: any) => {
                const level = t.riskLevel as keyof typeof riskDistribution;
                if (level in riskDistribution) riskDistribution[level]++;
            });

            res.json({
                transactionCount: txCount,
                fraudCount,
                alertCount: openAlerts,
                threatIndex,
                fraudRate: Math.round(fraudRate * 10) / 10,
                velocity,
                riskDistribution,
                systemHealth: 'HEALTHY',
                lastUpdated: now.toISOString()
            });
        } catch (error) {
            logger.error({ error }, 'DashboardController.getOverview failed');
            res.status(500).json({ error: 'Failed to compute overview' });
        }
    };

    public getRiskPulse = async (req: Request, res: Response) => {
        try {
            const fiveMinAgo = new Date(Date.now() - 5 * 60000);
            const txs = await TransactionModel.find({ timestamp: { $gte: fiveMinAgo } })
                .select('fraudScore')
                .lean();
            const avgScore = txs.length
                ? txs.reduce((s: number, t: any) => s + (t.fraudScore || 0), 0) / txs.length
                : 0;
            res.json({ level: Math.min(100, avgScore) });
        } catch (error) {
            res.status(500).json({ error: 'Failed to compute risk pulse' });
        }
    };

    public getSpike = async (req: Request, res: Response) => {
        res.json({ detected: false, ratio: 1.0 });
    };

    public getModelConfidence = async (req: Request, res: Response) => {
        // Return 24h of trending confidence data from recent transactions
        try {
            const oneDayAgo = new Date(Date.now() - 24 * 60 * 60000);
            const txs = await TransactionModel.find({ timestamp: { $gte: oneDayAgo } })
                .select('modelConfidence timestamp')
                .sort({ timestamp: 1 })
                .lean();

            if (txs.length === 0) {
                // Return baseline placeholder data
                return res.json([
                    { time: new Date(Date.now() - 3600000).toISOString(), value: 94.1 },
                    { time: new Date(Date.now() - 2400000).toISOString(), value: 92.5 },
                    { time: new Date(Date.now() - 1200000).toISOString(), value: 93.8 },
                    { time: new Date().toISOString(), value: 95.0 }
                ]);
            }

            // Bucket into hourly groups
            const hourMap = new Map<string, { sum: number; count: number }>();
            txs.forEach((t: any) => {
                const hour = new Date(t.timestamp);
                hour.setMinutes(0, 0, 0);
                const key = hour.toISOString();
                const bucket = hourMap.get(key) ?? { sum: 0, count: 0 };
                bucket.sum += (t.modelConfidence || 95) * 100; // stored as 0-1
                bucket.count++;
                hourMap.set(key, bucket);
            });

            const result = Array.from(hourMap.entries()).map(([time, b]) => ({
                time,
                value: Math.round(b.sum / b.count * 10) / 10
            }));

            return res.json(result);
        } catch (error) {
            return res.status(500).json({ error: 'Failed to compute model confidence' });
        }
    };

    public getDrift = async (req: Request, res: Response) => {
        res.json([
            { time: new Date(Date.now() - 3600000).toISOString(), value: 0.02 },
            { time: new Date(Date.now() - 2400000).toISOString(), value: 0.03 },
            { time: new Date(Date.now() - 1200000).toISOString(), value: 0.025 },
            { time: new Date().toISOString(), value: 0.015 }
        ]);
    };

    public getGeoIntensity = async (req: Request, res: Response) => {
        try {
            const oneDayAgo = new Date(Date.now() - 24 * 60 * 60000);
            const txs = await TransactionModel.find({
                timestamp: { $gte: oneDayAgo },
                $or: [
                    { latitude: { $exists: true, $ne: null } },
                    { location: { $exists: true, $ne: '' } }
                ]
            })
                .select('latitude longitude location fraudScore isFraud country')
                .lean();

            // Location → coordinates fallback map
            const locationCoords: Record<string, [number, number]> = {
                ny: [40.7128, -74.006], newyork: [40.7128, -74.006],
                ca: [36.7783, -119.4179], california: [36.7783, -119.4179],
                tx: [31.9686, -99.9018], texas: [31.9686, -99.9018],
                fl: [27.6648, -81.5158], florida: [27.6648, -81.5158],
                wa: [47.7511, -120.7401], washington: [47.7511, -120.7401],
                london: [51.5072, -0.1276],
                delhi: [28.6139, 77.209],
                tokyo: [35.6762, 139.6503],
                dubai: [25.2048, 55.2708],
                sydney: [-33.8688, 151.2093],
                us: [37.0902, -95.7129],
                uk: [51.5072, -0.1276],
                in: [20.5937, 78.9629],
                de: [51.1657, 10.4515],
                fr: [46.2276, 2.2137],
                jp: [36.2048, 138.2529],
                cn: [35.8617, 104.1954],
                br: [-14.235, -51.9253],
                ru: [61.524, 105.3188],
                au: [-25.2744, 133.7751]
            };

            const points: { lat: number; lng: number; risk: number }[] = [];

            for (const t of txs as any[]) {
                let lat: number | null = t.latitude ?? null;
                let lng: number | null = t.longitude ?? null;

                if (!lat || !lng) {
                    const loc = (t.location || t.country || '').toLowerCase().trim().replace(/\s+/g, '');
                    const coords = locationCoords[loc];
                    if (coords) { lat = coords[0]; lng = coords[1]; }
                }

                if (lat && lng) {
                    points.push({
                        lat,
                        lng: lng,
                        risk: Math.max(0.1, Math.min(1, (t.fraudScore || 0) / 100))
                    });
                }
            }

            res.json(points);
        } catch (error) {
            logger.error({ error }, 'DashboardController.getGeoIntensity failed');
            res.status(500).json({ error: 'Failed to compute geo intensity' });
        }
    };

    public getGeoLive = async (req: Request, res: Response) => {
        res.json([]);
    };

    public getDevices = async (req: Request, res: Response) => {
        res.json({ success: true, message: 'Devices data' });
    };

    public getCollusion = async (req: Request, res: Response) => {
        res.json({ success: true, message: 'Collusion data' });
    };

    public getRiskForecast = async (req: Request, res: Response) => {
        res.json({ success: true, message: 'Risk forecast data' });
    };

    public getAlertPressure = async (req: Request, res: Response) => {
        res.json({ success: true, message: 'Alert pressure data' });
    };

    public getVelocity = async (req: Request, res: Response) => {
        try {
            const now = new Date();
            const buckets: { time: string; value: number }[] = [];

            // Return 24 hourly TPS buckets
            for (let h = 23; h >= 0; h--) {
                const from = new Date(now.getTime() - (h + 1) * 3600000);
                const to = new Date(now.getTime() - h * 3600000);
                const count = await TransactionModel.countDocuments({
                    timestamp: { $gte: from, $lt: to }
                });
                buckets.push({
                    time: to.toISOString(),
                    value: Math.round((count / 3600) * 1000) / 1000  // TPS
                });
            }

            res.json(buckets);
        } catch (error) {
            res.status(500).json({ error: 'Failed to compute velocity' });
        }
    };

    public getRiskDistribution = async (req: Request, res: Response) => {
        try {
            const [low, medium, high] = await Promise.all([
                TransactionModel.countDocuments({ riskLevel: 'Low' }),
                TransactionModel.countDocuments({ riskLevel: 'Medium' }),
                TransactionModel.countDocuments({ riskLevel: 'High' })
            ]);
            res.json({ Low: low, Medium: medium, High: high });
        } catch (error) {
            res.status(500).json({ error: 'Failed to compute risk distribution' });
        }
    };

    public getRiskTrend = async (req: Request, res: Response) => {
        try {
            const oneDayAgo = new Date(Date.now() - 24 * 60 * 60000);
            const txs = await TransactionModel.find({ timestamp: { $gte: oneDayAgo } })
                .select('fraudScore timestamp')
                .sort({ timestamp: 1 })
                .lean();

            const hourMap = new Map<string, { sum: number; count: number }>();
            (txs as any[]).forEach(t => {
                const hour = new Date(t.timestamp);
                hour.setMinutes(0, 0, 0);
                const key = hour.toISOString();
                const b = hourMap.get(key) ?? { sum: 0, count: 0 };
                b.sum += t.fraudScore || 0;
                b.count++;
                hourMap.set(key, b);
            });

            const result = Array.from(hourMap.entries()).map(([time, b]) => ({
                time,
                value: Math.round((b.sum / b.count) * 10) / 10
            }));

            res.json(result);
        } catch (error) {
            res.status(500).json({ error: 'Failed to compute risk trend' });
        }
    };

    public getFraudTrend = async (req: Request, res: Response) => {
        try {
            const oneDayAgo = new Date(Date.now() - 24 * 60 * 60000);
            const txs = await TransactionModel.find({ timestamp: { $gte: oneDayAgo } })
                .select('isFraud timestamp amount action')
                .sort({ timestamp: 1 })
                .lean();

            const hourMap = new Map<string, { fraudCount: number; total: number; blocked: number }>();
            (txs as any[]).forEach(t => {
                const hour = new Date(t.timestamp);
                hour.setMinutes(0, 0, 0);
                const key = hour.toISOString();
                const b = hourMap.get(key) ?? { fraudCount: 0, total: 0, blocked: 0 };
                b.total++;
                if (t.isFraud) b.fraudCount++;
                if (t.action === 'BLOCK') b.blocked++;
                hourMap.set(key, b);
            });

            const result = Array.from(hourMap.entries()).map(([time, b]) => ({
                time,
                fraudCount: b.fraudCount,
                total: b.total,
                blocked: b.blocked,
                fraudRate: b.total > 0 ? Math.round((b.fraudCount / b.total) * 1000) / 10 : 0
            }));

            res.json(result);
        } catch (error) {
            res.status(500).json({ error: 'Failed to compute fraud trend' });
        }
    };
}

export const dashboardController = new DashboardController();
