import { CopilotContextService } from './CopilotContextService';
import { InvestigationEngine, InvestigationResult } from './InvestigationEngine';
import { CopilotReportService } from './CopilotReportService';
import { FraudExplanationModel } from '../models/FraudExplanation';
import { logger } from '../config/logger';

export interface CopilotResponse {
    content: string;
    type: 'TEXT' | 'INVESTIGATION' | 'REPORT' | 'CLUSTER' | 'TIMELINE';
    data?: any;
    suggestions?: string[];
}

export class CopilotService {
    constructor(
        private readonly contextService: CopilotContextService,
        private readonly investigationEngine: InvestigationEngine,
        private readonly reportService: CopilotReportService
    ) { }

    async processQuery(query: string, currentContext?: any): Promise<CopilotResponse> {
        logger.info(`Copilot processing query: ${query}`);

        // Command Parsing
        if (query.startsWith('/')) {
            return this.handleCommand(query);
        }

        // Natural Language (MOCKED Intelligence Layer)
        if (query.toLowerCase().includes('investigate') && query.match(/TX\d+/)) {
            const txId = query.match(/TX\d+/)?.[0];
            if (txId) return this.handleCommand(`/investigate ${txId}`);
        }

        // Default Intelligence Response
        return {
            content: "I'm analyzing the current SOC telemetry. I've noticed a slight elevation in the Global Threat Index. Would you like me to /investigate the latest high-risk transactions?",
            type: 'TEXT',
            suggestions: ['/investigate recent', '/show-alerts', '/start-autonomous-mode']
        };
    }

    private async handleCommand(command: string): Promise<CopilotResponse> {
        const parts = command.split(' ');
        const cmd = parts[0].toLowerCase();
        const arg = parts[1];

        switch (cmd) {
            case '/investigate':
                if (!arg) return { content: "Please provide a Transaction ID. (e.g., /investigate TX123)", type: 'TEXT' };
                const result = await this.investigationEngine.investigateTransaction(arg);
                return {
                    content: `Investigation complete for ${arg}. Fraud Score is ${result.fraudScore.toFixed(2)}. ${result.conclusion}`,
                    type: 'INVESTIGATION',
                    data: result,
                    suggestions: [`/trace-user ${result.entityId}`, `/generate-report ${arg}`]
                };

            case '/analyze-user':
            case '/trace-user':
                if (!arg) return { content: "Please provide a User ID.", type: 'TEXT' };
                const userResult = await this.investigationEngine.investigateUser(arg);
                return {
                    content: `User Profile Analysis for ${arg}: ${userResult.conclusion}`,
                    type: 'INVESTIGATION',
                    data: userResult,
                    suggestions: [`/show-transactions ${arg}`, `/trace-device ${arg}`]
                };

            case '/explain-score':
                if (!arg) return { content: "Please provide a Transaction ID to explain.", type: 'TEXT' };
                const explanation = await FraudExplanationModel.findOne({ transactionId: arg }).lean();
                if (!explanation) return { content: `No ML explanation found for ${arg}. (Check SHAP pipeline sync)`, type: 'TEXT' };

                const breakdown = explanation.explanations
                    .map(e => `• ${e.feature}: ${e.impact > 0 ? '+' : ''}${e.impact.toFixed(2)} (${e.reason})`)
                    .join('\n');

                return {
                    content: `SHAP Explanation for ${arg}\nFraud Score: ${explanation.fraudScore.toFixed(2)}\n\nRisk Factors:\n${breakdown}`,
                    type: 'TEXT',
                    suggestions: [`/investigate ${arg}`, `/generate-report ${arg}`]
                };

            case '/generate-report':
                if (!arg) return { content: "Please provide a Transaction ID.", type: 'TEXT' };
                const report = await this.reportService.generateMarkdownReport(arg, 'TRANSACTION');
                return {
                    content: `Investigation Report for ${arg} has been generated.`,
                    type: 'REPORT',
                    data: { report, id: arg },
                    suggestions: [`/explain-score ${arg}`, '/start-autonomous-mode']
                };

            case '/start-autonomous-mode':
                return {
                    content: "Autonomous Investigation Mode ACTIVATED. I will now proactively monitor high-risk events and generate briefings.",
                    type: 'TEXT',
                    data: { autonomous: true }
                };

            case '/show-map':
                return {
                    content: "Redirecting to Planetary Threat Matrix. Global surveillance link active.",
                    type: 'TEXT',
                    data: { redirect: '/global-fraud-map' },
                    suggestions: ['/show-activity Europe', '/center-on-hotspots']
                };

            case '/show-activity':
                const region = arg || 'Global';
                return {
                    content: `Filtering planetary sensors for ${region}. Identifying localized fraud waves...`,
                    type: 'TEXT',
                    data: { filterRegion: region },
                    suggestions: ['/investigate latest', '/generate-report summary']
                };

            case '/stop-autonomous-mode':
                return {
                    content: "Autonomous Investigation Mode DEACTIVATED.",
                    type: 'TEXT',
                    data: { autonomous: false }
                };

            default:
                return {
                    content: `Command ${cmd} is registered but implementation is pending for this specific node.`,
                    type: 'TEXT'
                };
        }
    }
}
