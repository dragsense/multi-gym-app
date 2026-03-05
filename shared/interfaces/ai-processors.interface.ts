import type { EAIProcessorType } from '../enums/ai-processors.enum';

export interface IAIProcessor {
  id: string;
  type: EAIProcessorType;
  enabled: boolean;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
}
