import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { LoggerService } from '@/common/logger/logger.service';
import type {
  IAIAdapter,
  AIGenerateOptions,
  AIGenerateResult,
} from '../interfaces/ai-adapter.interface';

@Injectable()
export class GoogleAIAdapter implements IAIAdapter {
  private readonly logger = new LoggerService(GoogleAIAdapter.name);

  constructor(private readonly configService: ConfigService) {}

  async generate(options: AIGenerateOptions): Promise<AIGenerateResult> {
    const config = this.configService.get<{
      apiKey?: string;
      defaultModel?: string;
    }>('aiProcessors.googleAi');

    const defaultModel = config?.defaultModel || 'gemini-pro';
    const model = options.model || defaultModel;

    if (!config?.apiKey) {
      this.logger.warn('Google AI API key not configured');
      return { success: false, error: 'Google AI API key not configured' };
    }

    try {
      const genAI = new GoogleGenerativeAI(config.apiKey);
      const generativeModel = genAI.getGenerativeModel({
        model,
        systemInstruction: options.systemPrompt,
      });

      const result = await generativeModel.generateContent(options.prompt);
      const response = result.response;
      const content = response.text() ?? '';

      return { success: true, content, model };
    } catch (err: any) {
      this.logger.error('Google AI generate error', err);
      return {
        success: false,
        error: err?.message ?? 'Google AI request failed',
      };
    }
  }
}
