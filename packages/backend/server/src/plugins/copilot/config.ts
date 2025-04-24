import { z } from 'zod';

import {
  defineModuleConfig,
  StorageJSONSchema,
  StorageProviderConfig,
} from '../../base';
import { CopilotPromptScenario } from './prompt/prompts';
import {
  AnthropicOfficialConfig,
  AnthropicVertexConfig,
} from './providers/anthropic';
import type { FalConfig } from './providers/fal';
import { GeminiGenerativeConfig, GeminiVertexConfig } from './providers/gemini';
import { MorphConfig } from './providers/morph';
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
      scenarios: ConfigItem<CopilotPromptScenario>;
      providers: {
        openai: ConfigItem<OpenAIConfig>;
        fal: ConfigItem<FalConfig>;
        gemini: ConfigItem<GeminiGenerativeConfig>;
        geminiVertex: ConfigItem<GeminiVertexConfig>;
        perplexity: ConfigItem<PerplexityConfig>;
        anthropic: ConfigItem<AnthropicOfficialConfig>;
        anthropicVertex: ConfigItem<AnthropicVertexConfig>;
        morph: ConfigItem<MorphConfig>;
      };
    };
  }
}

/**
 * Creates a validator for API key configurations
 * Handles string input (API key) or object input with environment variable support
 */
function createApiKeyValidator(envVarName?: string) {
  return (
    val: unknown
  ): z.SafeParseReturnType<{ apiKey: string }, { apiKey: string }> => {
    const schema = z.object({ apiKey: z.string() });
    const valueFromEnv = envVarName ? process.env[envVarName] || '' : '';
    let config: { apiKey: string } = { apiKey: '' };

    // Handle string input (treat as API key)
    if (typeof val === 'string') {
      try {
        // Try parsing as JSON first
        const parsed = JSON.parse(val);
        config = { ...config, ...parsed };
      } catch {
        // If not valid JSON, treat as API key
        config.apiKey = val || valueFromEnv;
        return schema.safeParse(config);
      }
    }
    // Handle object input
    else if (val && typeof val === 'object') {
      const typedVal = val as Partial<{ apiKey: string }>;
      config = { ...config, ...typedVal };

      // Apply env value if property is empty in val
      if (!config.apiKey && valueFromEnv) {
        config.apiKey = valueFromEnv;
      }
    }

    return schema.safeParse(config);
  };
}

/**
 * Creates a validator specifically for Unsplash's key configuration
 */
function createUnsplashValidator(envVarName?: string) {
  return (
    val: unknown
  ): z.SafeParseReturnType<{ key: string }, { key: string }> => {
    const schema = z.object({ key: z.string() });
    const valueFromEnv = envVarName ? process.env[envVarName] || '' : '';
    let config: { key: string } = { key: '' };

    // Handle string input (treat as key)
    if (typeof val === 'string') {
      try {
        // Try parsing as JSON first
        const parsed = JSON.parse(val);
        config = { ...config, ...parsed };
      } catch {
        // If not valid JSON, treat as key
        config.key = val || valueFromEnv;
        return schema.safeParse(config);
      }
    }
    // Handle object input
    else if (val && typeof val === 'object') {
      const typedVal = val as Partial<{ key: string }>;
      config = { ...config, ...typedVal };

      // Apply env value if property is empty in val
      if (!config.key && valueFromEnv) {
        config.key = valueFromEnv;
      }
    }

    return schema.safeParse(config);
  };
}

/**
 * Creates a validator for storage configuration with R2 support
 */
function createStorageValidator() {
  return (
    val: unknown
  ): z.SafeParseReturnType<StorageProviderConfig, StorageProviderConfig> => {
    // Get R2 credentials from environment variables
    const accountId = process.env.R2_OBJECT_STORAGE_ACCOUNT_ID || '';
    const accessKeyId = process.env.R2_OBJECT_STORAGE_ACCESS_KEY_ID || '';
    const secretAccessKey =
      process.env.R2_OBJECT_STORAGE_SECRET_ACCESS_KEY || '';

    // Default fs storage config - fallback if no other configuration is valid
    const defaultConfig: StorageProviderConfig = {
      provider: 'fs',
      bucket: 'copilot',
      config: {
        path: '~/.affine/storage',
      },
    };

    // Skip validation and apply direct overrides if we have R2 environment variables
    if (accountId && accessKeyId && secretAccessKey) {
      console.log(
        'Using R2 storage provider with credentials from environment variables'
      );
      // Return success directly with a valid R2 configuration
      return {
        success: true,
        data: {
          provider: 'cloudflare-r2',
          bucket: 'copilot',
          config: {
            accountId,
            credentials: {
              accessKeyId,
              secretAccessKey,
            },
          },
        } as StorageProviderConfig,
      };
    }

    // Otherwise, handle existing configuration
    if (typeof val === 'object' && val !== null) {
      const config = val as Partial<StorageProviderConfig>;

      // Make sure we have a valid provider field
      if (!config.provider) {
        config.provider = defaultConfig.provider;
      }

      // Make sure we have a valid bucket field
      if (!config.bucket) {
        config.bucket = defaultConfig.bucket;
      }

      // Make sure we have a valid config field
      if (!config.config) {
        config.config = defaultConfig.config;
      }

      // Return the validated config
      return {
        success: true,
        data: config as StorageProviderConfig,
      };
    }

    // Use default fs storage as a last resort
    return {
      success: true,
      data: defaultConfig,
    };
  };
}

/**
 * Special validator for OpenAI to handle both apiKey and baseUrl
 */
function createOpenAIValidator() {
  return (val: unknown) => {
    const schema = z.object({
      apiKey: z.string(),
      baseUrl: z.string().optional(),
    });

    const apiKeyFromEnv = process.env.AFFINE_COPILOT_OPENAI_API_KEY || '';
    const baseUrlFromEnv = process.env.AFFINE_COPILOT_OPENAI_BASE_URL || '';
    let config: OpenAIConfig = { apiKey: '', baseUrl: '' };

    // Handle string input (treat as API key)
    if (typeof val === 'string') {
      try {
        // Try parsing as JSON first
        const parsed = JSON.parse(val);
        config = { ...config, ...parsed };
      } catch {
        // If not valid JSON, treat as API key
        config.apiKey = val || apiKeyFromEnv;
        if (baseUrlFromEnv) {
          config.baseUrl = baseUrlFromEnv;
        }
        return schema.safeParse(config);
      }
    }
    // Handle object input
    else if (val && typeof val === 'object') {
      const typedVal = val as Partial<OpenAIConfig>;
      config = { ...config, ...typedVal };

      // Apply env values if properties are empty in val
      if (!config.apiKey && apiKeyFromEnv) {
        config.apiKey = apiKeyFromEnv;
      }

      if (!config.baseUrl && baseUrlFromEnv) {
        config.baseUrl = baseUrlFromEnv;
      }
    }

    return schema.safeParse(config);
  };
}

// Define the module configuration
defineModuleConfig('copilot', {
  // Enable/disable the copilot plugin
  enabled: {
    desc: 'Whether to enable the copilot plugin. <br> Document: <a href="https://docs.affine.pro/self-host-affine/administer/ai" target="_blank">https://docs.affine.pro/self-host-affine/administer/ai</a>',
    default: false,
    env: ['AFFINE_COPILOT_ENABLED', 'boolean'],
  },
  scenarios: {
    desc: 'Use custom models in scenarios and override default settings.',
    default: {
      override_enabled: false,
      scenarios: {
        audio_transcribing: 'gemini-2.5-flash',
        chat: 'gemini-2.5-flash',
        embedding: 'gemini-embedding-001',
        image: 'gpt-image-1',
        rerank: 'gpt-4.1',
        coding: 'claude-sonnet-4-5@20250929',
        complex_text_generation: 'gpt-4o-2024-08-06',
        quick_decision_making: 'gpt-5-mini',
        quick_text_generation: 'gemini-2.5-flash',
        polish_and_summarize: 'gemini-2.5-flash',
      },
    },
  },
  'providers.openai': {
    desc: 'The config for the openai provider.',
    default: {
      apiKey: '',
      baseURL: 'https://api.openai.com/v1',
    },
    validate: createOpenAIValidator(),
    env: ['AFFINE_COPILOT_OPENAI_API_KEY', 'string'],
    link: 'https://github.com/openai/openai-node',
  },

  // FAL provider
  'providers.fal': {
    desc: 'The config for the fal provider.',
    default: {
      apiKey: '',
    },
    validate: createApiKeyValidator('AFFINE_COPILOT_FAL_API_KEY'),
    env: ['AFFINE_COPILOT_FAL_API_KEY', 'string'],
  },

  // Gemini provider
  'providers.gemini': {
    desc: 'The config for the gemini provider.',
    default: {
      apiKey: '',
      baseURL: 'https://generativelanguage.googleapis.com/v1beta',
    },
    validate: createApiKeyValidator('AFFINE_COPILOT_GEMINI_API_KEY'),
    env: ['AFFINE_COPILOT_GEMINI_API_KEY', 'string'],
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
      baseURL: 'https://api.anthropic.com/v1',
    },
  },
  'providers.anthropicVertex': {
    desc: 'The config for the anthropic provider in Google Vertex AI.',
    default: {},
    schema: VertexSchema,
  },
  'providers.morph': {
    desc: 'The config for the morph provider.',
    default: {},
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
    desc: 'The config for the storage provider with support for R2 configuration via environment variables.',
    default: {
      provider: 'fs',
      bucket: 'copilot',
      config: {
        path: '~/.affine/storage',
      },
    },
    schema: StorageJSONSchema,
    validate: createStorageValidator(),
    env: ['R2_OBJECT_STORAGE_ACCOUNT_ID', 'string'], // We only need one env var in the property
  },
});
