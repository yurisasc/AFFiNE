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
      models: [
        'gpt-4o',
        'gpt-4o-2024-08-06',
        'gpt-4o-mini',
        'gpt-4o-mini-2024-07-18',
        'gpt-4.1',
        'gpt-4.1-2025-04-14',
        'gpt-4.1-mini',
        'o1',
        'o3-mini',
        'text-embedding-3-large',
        'text-embedding-3-small',
        'text-embedding-ada-002',
        'text-moderation-latest',
        'text-moderation-stable',
        'dall-e-3',
      ],
    },
    link: 'https://github.com/openai/openai-node',
  },

  // FAL provider
  'providers.fal': {
    desc: 'The config for the fal provider.',
    default: {
      apiKey: '',
      models: [
        'fast-turbo-diffusion',
        'lcm-sd15-i2i',
        'clarity-upscaler',
        'face-to-sticker',
        'imageutils/rembg',
        'fast-sdxl/image-to-image',
        'workflowutils/teed',
        'lora/image-to-image',
        'llava-next',
      ],
    },
  },

  // Gemini provider
  'providers.gemini': {
    desc: 'The config for the gemini provider.',
    default: {
      apiKey: '',
      models: [
        'gemini-2.0-flash-001',
        'gemini-2.5-pro-preview-03-25',
        'text-embedding-004',
      ],
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
      models: ['sonar', 'sonar-pro', 'sonar-reasoning', 'sonar-reasoning-pro'],
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
