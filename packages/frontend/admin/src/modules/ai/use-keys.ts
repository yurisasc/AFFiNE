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
      storage: data.appConfig.copilot.storage || {
        provider: '',
        bucket: '',
        config: { path: '' },
      },
    } as ApiKeys;
  };

  // Update a specific provider's API key
  const updateKey = useAsyncCallback(
    async ({
      provider,
      config,
    }: {
      provider: keyof ApiKeys;
      config: Record<string, any>;
    }) => {
      const key =
        provider === 'unsplash' || provider === 'storage'
          ? provider
          : `providers.${provider}`;

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
