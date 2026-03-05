import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { LoggerService } from '@/common/logger/logger.service';
import type {
  IAIAdapter,
  AIGenerateOptions,
  AIGenerateResult,
} from '../interfaces/ai-adapter.interface';

@Injectable()
export class OpenAIAdapter implements IAIAdapter {
  private readonly logger = new LoggerService(OpenAIAdapter.name);

  constructor(private readonly configService: ConfigService) {}

  async generate(options: AIGenerateOptions): Promise<AIGenerateResult> {
    const config = this.configService.get<{ apiKey?: string; defaultModel?: string }>(
      'aiProcessors.openai',
    );
    const defaultModel = this.configService.get<string>('aiProcessors.defaultModel') || 'gpt-4o-mini';
    const model = options.model || config?.defaultModel || defaultModel;

    if (!config?.apiKey) {
      this.logger.warn('OpenAI API key not configured');
      return { success: false, error: 'OpenAI API key not configured' };
    }

    try {
      const client = new OpenAI({ apiKey: config.apiKey });

      const messages: Array<{ role: 'system' | 'user'; content: string }> = [];
      if (options.systemPrompt) {
        messages.push({ role: 'system', content: options.systemPrompt });
      }
      messages.push({ role: 'user', content: options.prompt });

      const response = await client.chat.completions.create({
        model,
        messages,
        max_tokens: options.maxTokens ?? 1024,
        temperature: options.temperature ?? 0.7,
      });

      const content = response.choices?.[0]?.message?.content ?? '';
      return { success: true, content, model };
    } catch (err: any) {
      this.logger.error('OpenAI generate error', err);
      return {
        success: false,
        error: err?.message ?? 'OpenAI request failed',
      };
    }
  }
}
