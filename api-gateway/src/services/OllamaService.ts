import axios from 'axios';
import { env } from '../config/env';
import { logger } from '../config/logger';

export interface OllamaResponse {
    model: string;
    created_at: string;
    response: string;
    done: boolean;
}

export class OllamaService {
    private baseUrl: string;
    private model: string;

    constructor() {
        this.baseUrl = env.OLLAMA_URL;
        this.model = env.OLLAMA_MODEL;
    }

    async generateResponse(prompt: string, context?: string): Promise<string> {
        try {
            const fullPrompt = context 
                ? `Context: ${context}\n\nQuestion: ${prompt}`
                : prompt;

            const response = await axios.post(`${this.baseUrl}/api/generate`, {
                model: this.model,
                prompt: fullPrompt,
                stream: false
            });

            const data = response.data as OllamaResponse;
            return data.response;
        } catch (error) {
            logger.error({ error, url: this.baseUrl, model: this.model }, 'Error calling Ollama API');
            throw new Error('Failed to generate response from Ollama');
        }
    }

    async isAvailable(): Promise<boolean> {
        try {
            await axios.get(`${this.baseUrl}/api/tags`, { timeout: 2000 });
            return true;
        } catch (error) {
            return false;
        }
    }
}

export const ollamaService = new OllamaService();
