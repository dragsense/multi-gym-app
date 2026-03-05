import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { LoggerService } from '@/common/logger/logger.service';
import type {
  IAIAdapter,
  AIGenerateOptions,
  AIGenerateResult,
} from '../interfaces/ai-adapter.interface';

@Injectable()
export class AnthropicAdapter implements IAIAdapter {
  private readonly logger = new LoggerService(AnthropicAdapter.name);

  constructor(private readonly configService: ConfigService) {}

  async generate(options: AIGenerateOptions): Promise<AIGenerateResult> {
    const config = this.configService.get<{
      apiKey?: string;
      defaultModel?: string;
    }>('aiProcessors.anthropic');

    const defaultModel = config?.defaultModel || 'claude-3-sonnet-20240229';
    const model = options.model || defaultModel;

    if (!config?.apiKey) {
      this.logger.warn('Anthropic API key not configured');
      return { success: false, error: 'Anthropic API key not configured' };
    }

    try {
      const client = new Anthropic({ apiKey: config.apiKey });

      const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [
        { role: 'user', content: options.prompt },
      ];

      const response = await client.messages.create({
        model,
        max_tokens: options.maxTokens ?? 1024,
        system: options.systemPrompt,
        messages,
      });

      const content =
        response.content?.find((c) => c.type === 'text')?.text ?? '';
      return { success: true, content, model };
    } catch (err: any) {
      this.logger.error('Anthropic generate error', err);
      return {
        success: false,
        error: err?.message ?? 'Anthropic request failed',
      };
    }
  }
}
