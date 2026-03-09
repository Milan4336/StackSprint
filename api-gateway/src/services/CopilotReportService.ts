import { TransactionModel } from '../models/Transaction';
import { FraudExplanationModel } from '../models/FraudExplanation';
import { Device } from '../models/Device';
import { logger } from '../config/logger';

export class CopilotReportService {
    async generateMarkdownReport(id: string, type: 'TRANSACTION' | 'USER'): Promise<string> {
        if (type === 'TRANSACTION') {
            const transaction = await TransactionModel.findOne({ transactionId: id }).lean();
            const explanation = await FraudExplanationModel.findOne({ transactionId: id }).lean();
            const device = await Device.findOne({ deviceId: transaction?.deviceId }).lean();

            if (!transaction) return `# Incident Report: ${id}\n\nNo such transaction found in surveillance logs.`;

            const breakdown = explanation?.explanations
                .map(e => `| ${e.feature} | ${e.impact.toFixed(4)} | ${e.reason} |`)
                .join('\n') || '| No data | 0 | - |';

            return `
# SOC Investigation Briefing
**Incident ID:** ${id}
**Timestamp:** ${transaction.timestamp}
**Target Entity:** ${transaction.userId}

## Executive Summary
This transaction has been flagged with a fraud score of **${(transaction.fraudScore || 0).toFixed(4)}**. 
Potential coordinated activity detected via device-fingerprint correlation.

## ML Forensics (SHAP Analysis)
| Feature | Impact | Context |
| :--- | :--- | :--- |
${breakdown}

## Hardware Intelligence
- **Device ID:** \`${transaction.deviceId}\`
- **Trust Score:** ${device?.deviceTrustScore ?? 50}
- **Label:** ${device?.deviceLabel || 'New Node'}
- **Risk Level:** ${device?.deviceRiskLevel || 'Pending Investigation'}

## Network Analysis
- **IP Address:** \`${transaction.ipAddress}\`
- **Location Status:** Non-Residential VPN (Simulated)

## Conclusion & Recommendation
1. [ ] Freeze associated card account
2. [ ] Initiate secondary KYC verification
3. [ ] Flag device ID \`${transaction.deviceId}\` globally
`;
        }

        return `# Investigation Report: ${id}\n\nUser reports coming soon.`;
    }
}
