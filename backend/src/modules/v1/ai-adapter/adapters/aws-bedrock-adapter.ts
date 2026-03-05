import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { LoggerService } from '@/common/logger/logger.service';
import type {
  IAIAdapter,
  AIGenerateOptions,
  AIGenerateResult,
} from '../interfaces/ai-adapter.interface';

@Injectable()
export class AwsBedrockAdapter implements IAIAdapter {
  private readonly logger = new LoggerService(AwsBedrockAdapter.name);

  constructor(private readonly configService: ConfigService) {}

  async generate(options: AIGenerateOptions): Promise<AIGenerateResult> {
    const config = this.configService.get<{
      region?: string;
      accessKeyId?: string;
      secretAccessKey?: string;
      defaultModel?: string;
    }>('aiProcessors.awsBedrock');

    const defaultModel =
      config?.defaultModel || 'anthropic.claude-3-sonnet-20240229-v1:0';
    const model = options.model || defaultModel;

    if (!config?.accessKeyId || !config?.secretAccessKey) {
      this.logger.warn('AWS Bedrock credentials not configured');
      return { success: false, error: 'AWS Bedrock credentials not configured' };
    }

    try {
      const client = new BedrockRuntimeClient({
        region: config.region || 'us-east-1',
        credentials: {
          accessKeyId: config.accessKeyId,
          secretAccessKey: config.secretAccessKey,
        },
      });

      const prompt = options.systemPrompt
        ? `${options.systemPrompt}\n\n${options.prompt}`
        : options.prompt;

      const body = JSON.stringify({
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: options.maxTokens ?? 1024,
        temperature: options.temperature ?? 0.7,
        messages: [{ role: 'user', content: prompt }],
      });

      const command = new InvokeModelCommand({
        modelId: model,
        contentType: 'application/json',
        accept: 'application/json',
        body: Buffer.from(body),
      });

      const response = await client.send(command);
      const result = JSON.parse(new TextDecoder().decode(response.body));
      const content =
        result.content?.[0]?.text ?? result.completion ?? '';

      return { success: true, content, model };
    } catch (err: any) {
      this.logger.error('AWS Bedrock generate error', err);
      return {
        success: false,
        error: err?.message ?? 'AWS Bedrock request failed',
      };
    }
  }
}
