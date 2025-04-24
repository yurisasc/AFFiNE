import {
  defineModuleConfig,
  StorageJSONSchema,
  StorageProviderConfig,
} from '../../base';
import {
  AnthropicOfficialConfig,
  AnthropicVertexConfig,
} from './providers/anthropic';
import type { FalConfig } from './providers/fal';
import { GeminiGenerativeConfig, GeminiVertexConfig } from './providers/gemini';
import { OpenAIConfig } from './providers/openai';
import { PerplexityConfig } from './providers/perplexity';
import { VertexSchema } from './providers/types';
declare global {
  interface AppConfigSchema {
    copilot: {
      enabled: boolean;
      unsplash: ConfigItem<{
        key: string;
      }>;
      exa: ConfigItem<{
        key: string;
      }>;
      storage: ConfigItem<StorageProviderConfig>;
      providers: {
        openai: ConfigItem<OpenAIConfig>;
        fal: ConfigItem<FalConfig>;
        gemini: ConfigItem<GeminiGenerativeConfig>;
        geminiVertex: ConfigItem<GeminiVertexConfig>;
        perplexity: ConfigItem<PerplexityConfig>;
        anthropic: ConfigItem<AnthropicOfficialConfig>;
        anthropicVertex: ConfigItem<AnthropicVertexConfig>;
      };
    };
  }
}

// Define the module configuration
defineModuleConfig('copilot', {
  // Enable/disable the copilot plugin
  enabled: {
    desc: 'Whether to enable the copilot plugin.',
    default: false,
    env: ['AFFINE_COPILOT_ENABLED', 'boolean'],
  },

  // OpenAI provider with both API key and baseUrl configuration
  'providers.openai': {
    desc: 'The config for the openai provider.',
    default: {
      apiKey: '',
      baseUrl: 'https://openrouter.ai/api/v1',
    },
    link: 'https://github.com/openai/openai-node',
  },

  // FAL provider
  'providers.fal': {
    desc: 'The config for the fal provider.',
    default: {
      apiKey: '',
    },
  },

  // Gemini provider
  'providers.gemini': {
    desc: 'The config for the gemini provider.',
    default: {
      apiKey: '',
    },
  },
  'providers.geminiVertex': {
    desc: 'The config for the gemini provider in Google Vertex AI.',
    default: {},
    schema: VertexSchema,
  },
  'providers.perplexity': {
    desc: 'The config for the perplexity provider.',
    default: {
      apiKey: '',
    },
  },
  'providers.anthropic': {
    desc: 'The config for the anthropic provider.',
    default: {
      apiKey: '',
    },
  },
  'providers.anthropicVertex': {
    desc: 'The config for the anthropic provider in Google Vertex AI.',
    default: {},
    schema: VertexSchema,
  },
  unsplash: {
    desc: 'The config for the unsplash key.',
    default: {
      key: '',
    },
  },
  exa: {
    desc: 'The config for the exa web search key.',
    default: {
      key: '',
    },
  },
  storage: {
    desc: 'The config for the storage provider',
    default: {
      provider: 'fs',
      bucket: 'copilot',
      config: {
        path: '~/.affine/storage',
      },
    },
    schema: StorageJSONSchema,
  },
});
