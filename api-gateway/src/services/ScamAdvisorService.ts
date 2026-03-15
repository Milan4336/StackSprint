import { geminiService } from './GeminiService';
import { ollamaService } from './OllamaService';
import { logger } from '../config/logger';

export interface ScamAnalysisResult {
    isScam: boolean;
    scamType?: string;
    confidence: number;
    explanation: string;
    recommendedActions: string[];
}

export class ScamAdvisorService {
    /**
     * Analyzes text or image data for common scam patterns.
     */
    async analyzeContent(content: string, type: 'text' | 'image' = 'text'): Promise<ScamAnalysisResult> {
        try {
            const prompt = `
                You are the Argus AI Scam Advisor. Analyze the following ${type} content for signs of social engineering, phishing, or financial fraud.
                
                Content: "${content}"
                
                Scam Patterns to check:
                1. "Electricity Bill" scam (threat of disconnection).
                2. "KYC Update" scam (urgent account verification).
                3. "Refund/Prize" scam (requesting bank details to credit money).
                4. "Job Offer" scams.
                5. "Family Emergency" scams.
                
                Return a JSON object in this format:
                {
                    "isScam": boolean,
                    "scamType": "Phishing" | "Social Engineering" | "Smishing" | "None",
                    "confidence": number (0-1),
                    "explanation": "Detailed forensic explanation of why this is a scam",
                    "recommendedActions": ["Action 1", "Action 2"]
                }
            `;

            let rawResponse: string;

            try {
                rawResponse = await ollamaService.generateResponse(prompt, 'Analyze scam content.');
            } catch (ollamaErr) {
                logger.warn({ error: ollamaErr }, 'Ollama failed in ScamAdvisor, trying Gemini');
                rawResponse = await geminiService.generateResponse(prompt, 'Analyze scam content.');
            }
            
            // Clean up JSON response if model adds markers
            const cleanedJson = rawResponse.replace(/```json|```/g, '').trim();
            const result = JSON.parse(cleanedJson);

            return {
                isScam: result.isScam ?? false,
                scamType: result.scamType,
                confidence: result.confidence ?? 0,
                explanation: result.explanation ?? 'No explanation provided.',
                recommendedActions: result.recommendedActions ?? []
            };
        } catch (error) {
            logger.error({ error }, 'ScamAdvisorService.analyzeContent failed');
            return {
                isScam: false,
                confidence: 0,
                explanation: 'Analysis failed. Please try again later.',
                recommendedActions: ['Do not click any links.', 'Contact your bank directly.']
            };
        }
    }
}

export const scamAdvisorService = new ScamAdvisorService();
