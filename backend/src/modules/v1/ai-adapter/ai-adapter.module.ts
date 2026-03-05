import { Module, forwardRef } from '@nestjs/common';
import { AIAdapterService } from './ai-adapter.service';
import { OpenAIAdapter } from './adapters/openai-adapter';
import { AwsBedrockAdapter } from './adapters/aws-bedrock-adapter';
import { AnthropicAdapter } from './adapters/anthropic-adapter';
import { GoogleAIAdapter } from './adapters/google-ai-adapter';
import { AzureOpenAIAdapter } from './adapters/azure-openai-adapter';
import { BusinessModule } from '../business/business.module';
import { AIProcessorsModule } from '@/common/ai-processors/ai-processors.module';

@Module({
  imports: [
    forwardRef(() => BusinessModule),
    AIProcessorsModule,
  ],
  providers: [
    AIAdapterService,
    OpenAIAdapter,
    AwsBedrockAdapter,
    AnthropicAdapter,
    GoogleAIAdapter,
    AzureOpenAIAdapter,
  ],
  exports: [AIAdapterService],
})
export class AIAdapterModule {}
