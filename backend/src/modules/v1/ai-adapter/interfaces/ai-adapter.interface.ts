import type { EAIProcessorType } from '@shared/enums';

/**
 * AI adapter: each business uses one AI processor (OpenAI, AWS Bedrock, Anthropic, etc.).
 * Adapter generates responses from prompts using the configured model.
 */
export interface AIGenerateOptions {
  /** System prompt (optional) */
  systemPrompt?: string;
  /** User prompt */
  prompt: string;
  /** Model override (uses config default if not set) */
  model?: string;
  /** Max tokens in response */
  maxTokens?: number;
  /** Temperature 0-2 */
  temperature?: number;
  /** Explicit AI processor type (OpenAI, Anthropic, etc.). When set, ignores tenant. */
  type?: EAIProcessorType;
}

export interface AIGenerateResult {
  success: boolean;
  content?: string;
  model?: string;
  error?: string;
}

export interface IAIAdapter {
  /**
   * Generate a response from the given prompt.
   * Uses default model from config if model not specified.
   */
  generate(options: AIGenerateOptions): Promise<AIGenerateResult>;
}
