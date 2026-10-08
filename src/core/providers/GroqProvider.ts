import { LLMProvider } from './interfaces';
import Groq from 'groq-sdk';

const DEFAULT_MODEL = process.env.GROQ_MODEL || 'qwen/qwen3.8-27b';
const FALLBACK_MODELS = ['openai/gpt-oss-20b', 'openai/gpt-oss-120b', 'allam-2-7b'];

export class GroqProvider implements LLMProvider {
  private groq?: Groq;
  private model: string;
  private apiKey: string | undefined;

  constructor(apiKey?: string, model?: string) {
    this.apiKey = apiKey || process.env.GROQ_API_KEY;
    this.model = model || DEFAULT_MODEL;
  }

  private getClient(): Groq {
    if (!this.apiKey) {
      throw new Error('GROQ_API_KEY is not configured. Please add it to your environment variables.');
    }
    if (!this.groq) {
      this.groq = new Groq({ apiKey: this.apiKey, dangerouslyAllowBrowser: true });
    }
    return this.groq;
  }

  async generateText(prompt: string, context?: Record<string, any>): Promise<string> {
    const candidateModels = [this.model, ...FALLBACK_MODELS.filter(m => m !== this.model)];
    let lastError: any = null;

    for (const m of candidateModels) {
      try {
        const response = await this.getClient().chat.completions.create({
          messages: [{ role: 'user', content: prompt }],
          model: m,
          temperature: context?.temperature ?? 0.7,
        });

        return response.choices[0]?.message?.content || '';
      } catch (error: any) {
        lastError = error;
        console.warn(`Groq generateText failed on model ${m}:`, error.message);
        // Continue to fallback model if model not found / deprecated
        if (error.status === 404 || error?.error?.code === 'model_not_found') {
          continue;
        }
        throw error;
      }
    }

    console.error('Groq generateText error across all models:', lastError);
    throw lastError;
  }

  async generateJSON<T>(prompt: string, schema?: any): Promise<T> {
    const candidateModels = [this.model, ...FALLBACK_MODELS.filter(m => m !== this.model)];
    const jsonPrompt = `${prompt}\n\nYou must return only valid JSON matching this schema/intent. Do not wrap it in markdown block quotes.`;
    let lastError: any = null;

    for (const m of candidateModels) {
      try {
        const response = await this.getClient().chat.completions.create({
          messages: [{ role: 'user', content: jsonPrompt }],
          model: m,
          temperature: 0.1,
          response_format: { type: 'json_object' }
        });

        const content = response.choices[0]?.message?.content || '{}';
        return JSON.parse(content) as T;
      } catch (error: any) {
        lastError = error;
        console.warn(`Groq generateJSON failed on model ${m}:`, error.message);
        if (error.status === 404 || error?.error?.code === 'model_not_found') {
          continue;
        }
        // If JSON mode unsupported or parse error, fallback to generateText and manual parse
        try {
          const text = await this.generateText(jsonPrompt);
          const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
          const firstBrace = cleaned.indexOf('{');
          const lastBrace = cleaned.lastIndexOf('}');
          if (firstBrace !== -1 && lastBrace !== -1) {
            return JSON.parse(cleaned.substring(firstBrace, lastBrace + 1)) as T;
          }
          return JSON.parse(cleaned) as T;
        } catch (fallbackErr) {
          throw lastError;
        }
      }
    }

    console.error('Groq generateJSON error across all models:', lastError);
    throw lastError;
  }

  async streamText(prompt: string, onChunk: (chunk: string) => void): Promise<void> {
    const candidateModels = [this.model, ...FALLBACK_MODELS.filter(m => m !== this.model)];
    let lastError: any = null;

    for (const m of candidateModels) {
      try {
        const stream = await this.getClient().chat.completions.create({
          messages: [{ role: 'user', content: prompt }],
          model: m,
          temperature: 0.7,
          stream: true,
        });

        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content || '';
          if (content) {
            onChunk(content);
          }
        }
        return;
      } catch (error: any) {
        lastError = error;
        console.warn(`Groq streamText failed on model ${m}:`, error.message);
        if (error.status === 404 || error?.error?.code === 'model_not_found') {
          continue;
        }
        throw error;
      }
    }

    console.error('Groq streamText error across all models:', lastError);
    throw lastError;
  }
}
