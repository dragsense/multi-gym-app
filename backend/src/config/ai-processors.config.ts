import { registerAs } from '@nestjs/config';

export interface AIProcessorsConfig {
  /** Default model when none specified (e.g. gpt-4o, claude-3-sonnet) */
  defaultModel: string;
  openai: {
    apiKey?: string;
    organization?: string;
    baseUrl?: string;
  };
  awsBedrock: {
    region?: string;
    accessKeyId?: string;
    secretAccessKey?: string;
    defaultModel?: string;
  };
  anthropic: {
    apiKey?: string;
    defaultModel?: string;
  };
  googleAi: {
    apiKey?: string;
    defaultModel?: string;
  };
  azureOpenai: {
    apiKey?: string;
    endpoint?: string;
    deploymentName?: string;
    apiVersion?: string;
  };
}

export default registerAs('aiProcessors', (): AIProcessorsConfig => ({
  defaultModel: process.env.AI_DEFAULT_MODEL || 'gpt-4o-mini',
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    organization: process.env.OPENAI_ORG_ID,
    baseUrl: process.env.OPENAI_BASE_URL,
  },
  awsBedrock: {
    region: process.env.AWS_BEDROCK_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    defaultModel: process.env.AWS_BEDROCK_DEFAULT_MODEL || 'anthropic.claude-3-sonnet-20240229-v1:0',
  },
  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY,
    defaultModel: process.env.ANTHROPIC_DEFAULT_MODEL || 'claude-3-sonnet-20240229',
  },
  googleAi: {
    apiKey: process.env.GOOGLE_AI_API_KEY,
    defaultModel: process.env.GOOGLE_AI_DEFAULT_MODEL || 'gemini-pro',
  },
  azureOpenai: {
    apiKey: process.env.AZURE_OPENAI_API_KEY,
    endpoint: process.env.AZURE_OPENAI_ENDPOINT,
    deploymentName: process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
    apiVersion: process.env.AZURE_OPENAI_API_VERSION || '2024-02-15-preview',
  },
}));
