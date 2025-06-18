import {
  useMutateQueryResource,
  useMutation,
} from '@affine/admin/use-mutation';
import { useQuery } from '@affine/admin/use-query';
import { useAsyncCallback } from '@affine/core/components/hooks/affine-async-hooks';
import { appConfigQuery, updateAppConfigMutation } from '@affine/graphql';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

export type ModelInputType = 'text' | 'image' | 'audio';
export type ModelOutputType = 'text' | 'image' | 'embedding' | 'structured';

export type ModelCapability = {
  input: ModelInputType[];
  output: ModelOutputType[];
  defaultForOutputType?: boolean;
};

export type Model = {
  id: string;
  name?: string;
  capabilities: ModelCapability[];
};

export type ApiKeys = {
  openai?: {
    apiKey: string;
    baseUrl?: string;
    models?: Model[];
  };
  openrouter?: {
    apiKey: string;
    baseUrl?: string;
    models?: Model[];
  };
  fal?: {
    apiKey: string;
    models?: Model[];
  };
  gemini?: {
    apiKey: string;
    models?: Model[];
  };
  perplexity?: {
    apiKey: string;
    models?: Model[];
  };
  anthropic?: {
    apiKey: string;
    baseUrl?: string;
    models?: Model[];
  };
  exa?: {
    key: string;
  };
  vertex_anthropic?: {
    location?: string;
    googleAuthOptions?: {
      credentials?: {
        client_email?: string;
        private_key?: string;
      };
    };
    models?: Model[];
  };
  vertex_gemini?: {
    location?: string;
    googleAuthOptions?: {
      credentials?: {
        client_email?: string;
        private_key?: string;
      };
    };
    models?: Model[];
  };
  unsplash?: {
    key: string;
  };
  storage?: {
    provider: 'fs' | 'aws-s3' | 'cloudflare-r2';
    bucket: string;
    config: {
      // FS provider
      path?: string;

      // AWS S3 & Cloudflare R2 common fields
      region?: string;
      endpoint?: string;
      accessKeyId?: string;
      secretAccessKey?: string;

      // Cloudflare R2 specific fields
      accountId?: string;
      usePresignedURL?: {
        enabled: boolean;
        urlPrefix: string;
        signKey: string;
      };
    };
  };
};

// Type for default models response from backend
type DefaultModelsResponse = Record<string, Model[]>;

export function useKeys() {
  const { data } = useQuery({
    query: appConfigQuery,
  });

  const revalidate = useMutateQueryResource();

  const setAppConfig = useMutation({
    mutation: updateAppConfigMutation,
  });

  // State for default models
  const [defaultModels, setDefaultModels] =
    useState<DefaultModelsResponse | null>(null);
  const [loadingDefaultModels, setLoadingDefaultModels] = useState(false);

  // Fetch default models from the backend
  useEffect(() => {
    const fetchDefaultModels = async () => {
      try {
        const response = await fetch('/api/copilot/default-models');
        if (!response.ok) {
          throw new Error('Failed to fetch default models');
        }
        setDefaultModels(await response.json());
      } catch (error) {
        console.error('Failed to fetch default models:', error);
      } finally {
        setLoadingDefaultModels(false);
      }
    };

    // Fix ESLint error by using .catch() instead of void operator
    fetchDefaultModels().catch(error => {
      console.error(
        'Unhandled promise rejection in fetchDefaultModels:',
        error
      );
    });
  }, []);

  // Parse provider configuration from appConfig
  const getProviderConfig = useCallback(() => {
    if (!data?.appConfig?.copilot?.providers) {
      return {} as ApiKeys;
    }

    const { providers } = data.appConfig.copilot;
    return {
      openai: providers.openai || { apiKey: '', baseUrl: '', models: [] },
      openrouter: providers.openrouter || {
        apiKey: '',
        baseUrl: '',
        models: [],
      },
      exa: providers.exa || { key: '' },
      fal: providers.fal || { apiKey: '', models: [] },
      gemini: providers.gemini || { apiKey: '', models: [] },
      perplexity: providers.perplexity || { apiKey: '', models: [] },
      anthropic: providers.anthropic || { apiKey: '', baseUrl: '', models: [] },
      vertex_anthropic: providers.anthropicVertex || {
        location: '',
        googleAuthOptions: {
          credentials: {
            client_email: '',
            private_key: '',
          },
        },
        models: [],
      },
      vertex_gemini: providers.geminiVertex || {
        location: '',
        googleAuthOptions: {
          credentials: {
            client_email: '',
            private_key: '',
          },
        },
        models: [],
      },
      unsplash: data.appConfig.copilot.unsplash || { key: '' },
      storage: data.appConfig.copilot.storage || {
        provider: '',
        bucket: '',
        config: { path: '' },
      },
    } as ApiKeys;
  }, [data]);

  // Helper function to get models for a provider, using default models if available and appropriate
  const getModelsForProvider = useCallback(
    (provider: string, currentModels: Model[] | undefined) => {
      // If provider already has models configured, keep using them
      if (currentModels && currentModels.length > 0) {
        return currentModels;
      }

      // Otherwise use default models if available
      if (defaultModels && defaultModels[provider]) {
        return defaultModels[provider];
      }

      // Fall back to empty array if no default models available
      return [];
    },
    [defaultModels]
  );

  // Update the API keys with new configuration - optimized to handle only provided keys
  const doUpdateKeys = useAsyncCallback(
    async (apiKeysToUpdate: Partial<ApiKeys>) => {
      try {
        // Initialize updates array for GraphQL mutation
        const updates: Array<{
          module: string;
          key: string;
          value: any;
        }> = [];

        // Helper function to handle complex objects and JSON strings
        const safeParseValue = (value: any) => {
          if (typeof value === 'string') {
            try {
              return JSON.parse(value);
            } catch {
              return value;
            }
          }
          return value;
        };

        // Process each provided key using a mapping of keys to their backend paths
        const keyToPathMap: Record<string, string> = {
          // Top-level keys
          unsplash: 'unsplash',
          exa: 'exa',
          storage: 'storage',
          // Provider keys with their backend paths
          openai: 'providers.openai',
          openrouter: 'providers.openrouter',
          fal: 'providers.fal',
          gemini: 'providers.gemini',
          perplexity: 'providers.perplexity',
          anthropic: 'providers.anthropic',
          vertex_anthropic: 'providers.anthropicVertex',
          vertex_gemini: 'providers.geminiVertex',
        };

        // Process each provided key
        Object.entries(apiKeysToUpdate).forEach(([key, config]) => {
          // Skip if configuration is null or undefined
          if (config == null) return;

          const backendKey = keyToPathMap[key];
          if (!backendKey) {
            console.warn(`Unknown key: ${key}, skipping`);
            return;
          }

          let processedConfig = { ...config };

          // Special handling for provider models - they need to be stringified
          if (key !== 'unsplash' && key !== 'storage' && key !== 'exa') {
            const typedConfig = processedConfig as { models?: Model[] };
            if (typedConfig.models) {
              // The backend expects a JSON string for models
              // We need to use 'as any' here since we're converting from Model[] to string
              // which the backend requires, but would cause a type error without the cast
              processedConfig = {
                ...processedConfig,
                models: JSON.stringify(typedConfig.models) as any,
              };
            }
          }

          // Add to updates array
          updates.push({
            module: 'copilot',
            key: backendKey,
            value: safeParseValue(processedConfig),
          });
        });

        // Debug: Log what's being sent
        console.log('Sending updates:', updates);

        // Don't proceed if there's nothing to update
        if (updates.length === 0) {
          toast.info('No changes to update');
          return;
        }

        // Send only the necessary updates
        await setAppConfig.trigger({ updates });

        // Refetch data after update
        await Promise.resolve(revalidate(appConfigQuery));
        toast.success('API key updated successfully');
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to update API key';
        toast.error(errorMessage);
        console.error(error);
      }
    },
    [revalidate, setAppConfig]
  );

  // Update a specific provider's API key and models
  const updateKey = useAsyncCallback(
    async ({
      provider,
      config,
    }: {
      provider: keyof ApiKeys;
      config: Record<string, any>;
    }) => {
      // Get current provider configuration
      const currentConfig = getProviderConfig();

      // Get current models for the provider
      const currentModels = (currentConfig[provider] as Record<string, any>)
        ?.models;

      // If no models are provided in the config, use existing or default models
      if (provider !== 'unsplash' && provider !== 'storage') {
        const providerConfig = config as { models?: Model[] };
        if (!providerConfig.models) {
          providerConfig.models = getModelsForProvider(
            provider as string,
            currentModels
          );
        }
      }

      // Only send the update for the specific provider - much smaller payload
      const singleUpdate = {
        [provider]: {
          ...config,
        },
      };

      // Update just this specific key
      await Promise.resolve(doUpdateKeys(singleUpdate));
    },
    [getProviderConfig, doUpdateKeys, getModelsForProvider]
  );

  return {
    apiKeys: getProviderConfig(),
    loading: !data || loadingDefaultModels,
    defaultModels,
    updateKey,
  };
}
