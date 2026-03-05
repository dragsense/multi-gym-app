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
export class AzureOpenAIAdapter implements IAIAdapter {
  private readonly logger = new LoggerService(AzureOpenAIAdapter.name);

  constructor(private readonly configService: ConfigService) {}

  async generate(options: AIGenerateOptions): Promise<AIGenerateResult> {
    const config = this.configService.get<{
      apiKey?: string;
      endpoint?: string;
      deploymentName?: string;
      apiVersion?: string;
    }>('aiProcessors.azureOpenai');

    if (!config?.apiKey || !config?.endpoint || !config?.deploymentName) {
      this.logger.warn('Azure OpenAI not fully configured');
      return { success: false, error: 'Azure OpenAI not configured' };
    }

    try {
      const client = new OpenAI({
        apiKey: config.apiKey,
        baseURL: `${config.endpoint.replace(/\/$/, '')}/openai/deployments/${config.deploymentName}`,
      });

      const model = options.model || config.deploymentName;
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
      this.logger.error('Azure OpenAI generate error', err);
      return {
        success: false,
        error: err?.message ?? 'Azure OpenAI request failed',
      };
    }
  }
}
