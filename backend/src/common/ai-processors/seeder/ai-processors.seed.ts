import { EAIProcessorType } from '@shared/enums/ai-processors.enum';
import { LoggerService } from '@/common/logger/logger.service';
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AIProcessor } from '../entities/ai-processor.entity';

@Injectable()
export class AIProcessorsSeed {
  private readonly logger = new LoggerService(AIProcessorsSeed.name);

  constructor(private readonly dataSource: DataSource) {}

  async run(dataSource?: DataSource): Promise<void> {
    const targetDataSource = dataSource || this.dataSource;

    const aiProcessors = [
      {
        type: EAIProcessorType.OPENAI,
        enabled: true,
        description: 'OpenAI GPT models (GPT-4, GPT-4o, etc.)',
      },
      {
        type: EAIProcessorType.AWS_BEDROCK,
        enabled: false,
        description: 'AWS Bedrock (Claude, Llama, etc.)',
      },
      {
        type: EAIProcessorType.ANTHROPIC,
        enabled: false,
        description: 'Anthropic Claude models',
      },
      {
        type: EAIProcessorType.GOOGLE_AI,
        enabled: false,
        description: 'Google AI (Gemini)',
      },
      {
        type: EAIProcessorType.AZURE_OPENAI,
        enabled: false,
        description: 'Azure OpenAI',
      },
    ];

    for (const data of aiProcessors) {
      try {
        const repo = targetDataSource.getRepository(AIProcessor);
        const existing = await repo.findOne({ where: { type: data.type } });

        if (existing) {
          await repo.update(existing.id, {
            enabled: data.enabled,
            description: data.description,
          });
          this.logger.log(`AI processor already exists: ${data.type}, updated`);
        } else {
          await repo.save(repo.create(data));
          this.logger.log(`Created AI processor: ${data.type}`);
        }
      } catch (error) {
        this.logger.error(`Error creating AI processor: ${data.type}`, error);
      }
    }
  }
}
