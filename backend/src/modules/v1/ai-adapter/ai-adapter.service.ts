import { Injectable, BadRequestException } from '@nestjs/common';
import { EAIProcessorType } from '@shared/enums';
import { OpenAIAdapter } from './adapters/openai-adapter';
import { AwsBedrockAdapter } from './adapters/aws-bedrock-adapter';
import { AnthropicAdapter } from './adapters/anthropic-adapter';
import { GoogleAIAdapter } from './adapters/google-ai-adapter';
import { AzureOpenAIAdapter } from './adapters/azure-openai-adapter';
import type { IAIAdapter, AIGenerateOptions, AIGenerateResult } from './interfaces/ai-adapter.interface';
import { BusinessService } from '../business/business.service';
import { AIProcessorsService } from '@/common/ai-processors/ai-processors.service';
import { LoggerService } from '@/common/logger/logger.service';

/**
 * Resolves the AI adapter for a tenant/business.
 * Each business can have an AI processor (OpenAI, AWS Bedrock, Anthropic, etc.); we return the matching adapter.
 * If no processor selected, defaults to OpenAI when enabled.
 */
@Injectable()
export class AIAdapterService {
  private readonly logger = new LoggerService(AIAdapterService.name);

  constructor(
    private readonly businessService: BusinessService,
    private readonly aiProcessorsService: AIProcessorsService,
    private readonly openAIAdapter: OpenAIAdapter,
    private readonly awsBedrockAdapter: AwsBedrockAdapter,
    private readonly anthropicAdapter: AnthropicAdapter,
    private readonly googleAIAdapter: GoogleAIAdapter,
    private readonly azureOpenAIAdapter: AzureOpenAIAdapter,
  ) {}

  /**
   * Get the AI adapter. Tenant is optional.
   * - If options.type is set: use that adapter directly.
   * - Else if tenantId: use business.aiProcessor or first enabled.
   * - Else: use first enabled processor.
   */
  async getAdapter(tenantId: string | undefined, options?: { type?: EAIProcessorType }): Promise<IAIAdapter> {
    let processorType: EAIProcessorType = EAIProcessorType.OPENAI;

    if (options?.type) {
      processorType = options.type;
    } else if (tenantId) {
      const business = await this.businessService.getSingle(
        { tenantId },
        { _relations: ['aiProcessor'] },
      );

      if (business?.aiProcessor) {
        processorType = business.aiProcessor.type;
      } else {
        const enabled = await this.getFirstEnabledProcessor();
        if (enabled) processorType = enabled;
      }
    } else {
      const enabled = await this.getFirstEnabledProcessor();
      if (enabled) processorType = enabled;
    }

    return this.getAdapterByType(processorType);
  }

  /** @deprecated Use getAdapter instead */
  async getAdapterForTenant(tenantId?: string): Promise<IAIAdapter> {
    return this.getAdapter(tenantId);
  }

  private async getFirstEnabledProcessor(): Promise<EAIProcessorType | null> {
    const types = [
      EAIProcessorType.OPENAI,
      EAIProcessorType.ANTHROPIC,
      EAIProcessorType.AWS_BEDROCK,
      EAIProcessorType.GOOGLE_AI,
      EAIProcessorType.AZURE_OPENAI,
    ];
    for (const t of types) {
      if (await this.aiProcessorsService.isAIProcessorEnabled(t)) {
        return t;
      }
    }
    return null;
  }

  private getAdapterByType(type: EAIProcessorType): IAIAdapter {
    switch (type) {
      case EAIProcessorType.OPENAI:
        return this.openAIAdapter;
      case EAIProcessorType.AWS_BEDROCK:
        return this.awsBedrockAdapter;
      case EAIProcessorType.ANTHROPIC:
        return this.anthropicAdapter;
      case EAIProcessorType.GOOGLE_AI:
        return this.googleAIAdapter;
      case EAIProcessorType.AZURE_OPENAI:
        return this.azureOpenAIAdapter;
      default:
        this.logger.warn(`Unknown AI processor type ${type}; defaulting to OpenAI`);
        return this.openAIAdapter;
    }
  }

  /**
   * Generate AI response. Tenant is optional; options.type can override adapter selection.
   */
  async generate(
    options: AIGenerateOptions,
    tenantId?: string,
  ): Promise<AIGenerateResult> {
    const adapter = await this.getAdapter(tenantId, { type: options.type });
    const { type: _, ...generateOptions } = options;
    return adapter.generate(generateOptions);
  }

  /** @deprecated Use generate instead */
  async generateForTenant(
    tenantId: string | undefined,
    options: AIGenerateOptions,
  ): Promise<AIGenerateResult> {
    return this.generate(options, tenantId);
  }

  /**
   * Ensure at least one AI processor is enabled.
   */
  async assertBusinessHasAIProcessor(_tenantId?: string): Promise<void> {
    const enabled = await this.getFirstEnabledProcessor();
    if (!enabled) {
      throw new BadRequestException(
        'No AI processor is enabled. Please enable one in Settings → AI Processors.',
      );
    }
  }
}
