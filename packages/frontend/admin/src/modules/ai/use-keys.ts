import {
  useMutateQueryResource,
  useMutation,
} from '@affine/admin/use-mutation';
import { useQuery } from '@affine/admin/use-query';
import { useAsyncCallback } from '@affine/core/components/hooks/affine-async-hooks';
import { appConfigQuery, updateAppConfigMutation } from '@affine/graphql';
import { toast } from 'sonner';

export type ApiKeys = {
  openai?: {
    apiKey: string;
    baseUrl?: string;
  };
  fal?: {
    apiKey: string;
  };
  gemini?: {
    apiKey: string;
  };
  perplexity?: {
    apiKey: string;
  };
  unsplash?: {
    key: string;
  };
};

export const useKeys = () => {
  // Query to get current configuration
  const { data } = useQuery({
    query: appConfigQuery,
  });

  const { trigger } = useMutation({
    mutation: updateAppConfigMutation,
  });

  const revalidate = useMutateQueryResource();

  // Parse provider configuration from appConfig
  const getProviderConfig = () => {
    if (!data?.appConfig?.copilot?.providers) {
      return {} as ApiKeys;
    }

    const { providers } = data.appConfig.copilot;
    return {
      openai: providers.openai || { apiKey: '', baseUrl: '' },
      fal: providers.fal || { apiKey: '' },
      gemini: providers.gemini || { apiKey: '' },
      perplexity: providers.perplexity || { apiKey: '' },
      unsplash: data.appConfig.copilot.unsplash || { key: '' },
    } as ApiKeys;
  };

  // Update a specific provider's API key
  const updateKey = useAsyncCallback(
    async ({
      provider,
      config,
    }: {
      provider: keyof ApiKeys;
      config: Record<string, string>;
    }) => {
      const key =
        provider === 'unsplash' ? 'unsplash' : `providers.${provider}`;

      try {
        await trigger({
          updates: [
            {
              module: 'copilot',
              key,
              value: config,
            },
          ],
        });

        // Query to refetch the data
        await revalidate(appConfigQuery);

        toast.success(`${provider} key updated successfully`);
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to update API key';
        toast.error(errorMessage);
        console.error(error);
      }
    },
    [revalidate, trigger]
  );

  return {
    apiKeys: getProviderConfig(),
    loading: !data,
    updateKey,
  };
};
