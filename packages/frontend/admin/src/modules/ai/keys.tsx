import { Button } from '@affine/admin/components/ui/button';
import { Input } from '@affine/admin/components/ui/input';
import { Label } from '@affine/admin/components/ui/label';
import { Separator } from '@affine/admin/components/ui/separator';
import { Loader2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { type ApiKeys, useKeys } from './use-keys';

export function Keys() {
  const { apiKeys, loading, updateKey } = useKeys();
  const initialLoadDone = useRef(false);

  const [openAIKey, setOpenAIKey] = useState('');
  const [openAIBaseUrl, setOpenAIBaseUrl] = useState('');
  const [openRouterKey, setOpenRouterKey] = useState('');
  const [openRouterBaseUrl, setOpenRouterBaseUrl] = useState('');
  const [falAIKey, setFalAIKey] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [perplexityKey, setPerplexityKey] = useState('');
  const [exaKey, setExaKey] = useState('');
  const [unsplashKey, setUnsplashKey] = useState('');

  const [savingStates, setSavingStates] = useState<Record<string, boolean>>({});

  // Load initial values only once when data is first available
  useEffect(() => {
    if (!loading && apiKeys && !initialLoadDone.current) {
      setOpenAIKey(apiKeys.openai?.apiKey || '');
      setOpenAIBaseUrl(apiKeys.openai?.baseUrl || '');
      setOpenRouterKey(apiKeys.openrouter?.apiKey || '');
      setOpenRouterBaseUrl(apiKeys.openrouter?.baseUrl || '');
      setFalAIKey(apiKeys.fal?.apiKey || '');
      setGeminiKey(apiKeys.gemini?.apiKey || '');
      setPerplexityKey(apiKeys.perplexity?.apiKey || '');
      setExaKey(apiKeys.exa?.key || '');
      setUnsplashKey(apiKeys.unsplash?.key || '');
      initialLoadDone.current = true;
    }
  }, [apiKeys, loading]);

  // Handler to save key with loading state and preserve existing models
  const handleSaveKey = (provider: string, config: Record<string, any>) => {
    setSavingStates(prev => ({ ...prev, [provider]: true }));

    try {
      // Preserve the existing models configuration when updating API key
      const preservedConfig = { ...config };

      // Add existing models to the config if they exist and aren't already in the new config
      // Only add models for AI providers that support models array (not unsplash/other keys)
      const providerKey = provider as keyof ApiKeys;
      const aiProviders = [
        'openai',
        'openrouter',
        'fal',
        'gemini',
        'perplexity',
        'anthropic',
        'vertex_anthropic',
        'vertex_gemini',
      ];
      if (
        aiProviders.includes(provider) &&
        'models' in (apiKeys[providerKey] || {}) &&
        !preservedConfig.models
      ) {
        // Type assertion to handle the fact that unsplash and other non-AI providers don't have models
        const providerConfig = apiKeys[providerKey] as { models?: any[] };
        preservedConfig.models = providerConfig.models || [];
      }

      updateKey({
        provider: providerKey,
        config: preservedConfig,
      });
    } finally {
      // Clear saving state after a short delay for better UX
      setTimeout(() => {
        setSavingStates(prev => ({ ...prev, [provider]: false }));
      }, 1000);
    }
  };

  return (
    <div className="flex flex-col h-full gap-3 py-5 px-6 w-full">
      <div className="flex items-center">
        <span className="text-xl font-semibold">API Keys</span>
      </div>
      <div className="flex-grow overflow-y-auto space-y-[10px]">
        <div className="flex flex-col rounded-md border py-4 gap-4">
          {/* OpenAI Configuration */}
          <div className="px-5 space-y-4">
            <Label className="text-sm font-medium">OpenAI Key</Label>
            <div className="flex items-center gap-2">
              <Input
                type="password"
                className="py-2 px-3 text-base font-normal placeholder:opacity-50"
                value={openAIKey}
                placeholder="sk-xxxxxxxxxxxxx-xxxxxxxxxxxxxx"
                onChange={e => setOpenAIKey(e.target.value)}
              />
              <Button
                disabled={!openAIKey || savingStates['openai']}
                onClick={() =>
                  handleSaveKey('openai', {
                    apiKey: openAIKey,
                    baseUrl: openAIBaseUrl || 'https://api.openai.com/v1',
                  })
                }
              >
                {savingStates['openai'] ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Save'
                )}
              </Button>
            </div>
            <Label className="text-sm font-medium mt-3">
              OpenAI Base URL (optional)
            </Label>
            <div className="flex items-center gap-2">
              <Input
                type="text"
                className="py-2 px-3 text-base font-normal placeholder:opacity-50"
                value={openAIBaseUrl}
                placeholder="https://api.openai.com/v1"
                onChange={e => setOpenAIBaseUrl(e.target.value)}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              You can use this for OpenAI-compatible APIs like OpenRouter
            </p>
          </div>

          <Separator />

          {/* OpenRouter Configuration */}
          <div className="px-5 space-y-4">
            <Label className="text-sm font-medium">OpenRouter API Key</Label>
            <div className="flex items-center gap-2">
              <Input
                type="password"
                className="py-2 px-3 text-base font-normal placeholder:opacity-50"
                value={openRouterKey}
                placeholder="sk-or-xxxxxxxxxxxxx-xxxxxxxxxxxxxx"
                onChange={e => setOpenRouterKey(e.target.value)}
              />
              <Button
                disabled={!openRouterKey || savingStates['openrouter']}
                onClick={() =>
                  handleSaveKey('openrouter', {
                    apiKey: openRouterKey,
                    baseUrl:
                      openRouterBaseUrl || 'https://openrouter.ai/api/v1',
                  })
                }
              >
                {savingStates['openrouter'] ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Save'
                )}
              </Button>
            </div>
            <Label className="text-sm font-medium mt-3">
              OpenRouter Base URL (optional)
            </Label>
            <div className="flex items-center gap-2">
              <Input
                type="text"
                className="py-2 px-3 text-base font-normal placeholder:opacity-50"
                value={openRouterBaseUrl}
                placeholder="https://openrouter.ai/api/v1"
                onChange={e => setOpenRouterBaseUrl(e.target.value)}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              OpenRouter provides access to many AI models through a unified API
            </p>
          </div>

          <Separator />

          {/* Fal.AI Key */}
          <div className="px-5 space-y-4">
            <Label className="text-sm font-medium">Fal.AI Key</Label>
            <div className="flex items-center gap-2">
              <Input
                type="password"
                className="py-2 px-3 text-base font-normal placeholder:opacity-50"
                value={falAIKey}
                placeholder="00000000-0000-0000-00000000:xxxxxxxxxxxxxxxxx"
                onChange={e => setFalAIKey(e.target.value)}
              />
              <Button
                disabled={!falAIKey || savingStates['fal']}
                onClick={() => handleSaveKey('fal', { apiKey: falAIKey })}
              >
                {savingStates['fal'] ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Save'
                )}
              </Button>
            </div>
          </div>

          <Separator />

          {/* Gemini Key */}
          <div className="px-5 space-y-4">
            <Label className="text-sm font-medium">Google Gemini Key</Label>
            <div className="flex items-center gap-2">
              <Input
                type="password"
                className="py-2 px-3 text-base font-normal placeholder:opacity-50"
                value={geminiKey}
                placeholder="gemini api key"
                onChange={e => setGeminiKey(e.target.value)}
              />
              <Button
                disabled={!geminiKey || savingStates['gemini']}
                onClick={() => handleSaveKey('gemini', { apiKey: geminiKey })}
              >
                {savingStates['gemini'] ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Save'
                )}
              </Button>
            </div>
          </div>

          <Separator />

          {/* Perplexity Key */}
          <div className="px-5 space-y-4">
            <Label className="text-sm font-medium">Perplexity API Key</Label>
            <div className="flex items-center gap-2">
              <Input
                type="password"
                className="py-2 px-3 text-base font-normal placeholder:opacity-50"
                value={perplexityKey}
                placeholder="perplexity api key"
                onChange={e => setPerplexityKey(e.target.value)}
              />
              <Button
                disabled={!perplexityKey || savingStates['perplexity']}
                onClick={() =>
                  handleSaveKey('perplexity', { apiKey: perplexityKey })
                }
              >
                {savingStates['perplexity'] ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Save'
                )}
              </Button>
            </div>
          </div>

          <Separator />

          {/* Exa API Key */}
          <div className="px-5 space-y-4">
            <Label className="text-sm font-medium">Exa API Key</Label>
            <div className="flex items-center gap-2">
              <Input
                type="password"
                className="py-2 px-3 text-base font-normal placeholder:opacity-50"
                value={exaKey}
                placeholder="exa api key"
                onChange={e => setExaKey(e.target.value)}
              />
              <Button
                disabled={!exaKey || savingStates['exa']}
                onClick={() => handleSaveKey('exa', { key: exaKey })}
              >
                {savingStates['exa'] ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Save'
                )}
              </Button>
            </div>
          </div>

          <Separator />

          {/* Anthropic API Key */}
          <div className="px-5 space-y-4">
            <div className="mb-4">
              <Label
                htmlFor="anthropic-key"
                className="block text-sm font-medium mb-2"
              >
                Anthropic API Key
              </Label>
              <Input
                placeholder="sk-ant-..."
                type="password"
                id="anthropic-key"
                value={(apiKeys.anthropic?.apiKey as string) || ''}
                onChange={e =>
                  void updateKey({
                    provider: 'anthropic',
                    config: {
                      ...apiKeys.anthropic,
                      apiKey: e.target.value,
                    },
                  })
                }
              />
            </div>
            <div className="mb-4">
              <Label
                htmlFor="anthropic-base-url"
                className="block text-sm font-medium mb-2"
              >
                Anthropic Base URL (Optional)
              </Label>
              <Input
                placeholder="https://api.anthropic.com"
                id="anthropic-base-url"
                value={(apiKeys.anthropic?.baseUrl as string) || ''}
                onChange={e =>
                  void updateKey({
                    provider: 'anthropic',
                    config: {
                      ...apiKeys.anthropic,
                      baseUrl: e.target.value,
                    },
                  })
                }
              />
            </div>
          </div>

          <Separator />

          {/* Vertex AI Anthropic */}
          <div className="px-5 space-y-4">
            <h3 className="font-medium text-lg mb-2">Vertex Anthropic</h3>
            <div className="mb-4">
              <Label
                htmlFor="vertex-anthropic-location"
                className="block text-sm font-medium mb-2"
              >
                GCP Location
              </Label>
              <Input
                placeholder="us-central1"
                id="vertex-anthropic-location"
                value={(apiKeys.vertex_anthropic?.location as string) || ''}
                onChange={e =>
                  void updateKey({
                    provider: 'vertex_anthropic',
                    config: {
                      ...apiKeys.vertex_anthropic,
                      location: e.target.value,
                    },
                  })
                }
              />
            </div>
            <div className="mb-4">
              <Label
                htmlFor="vertex-anthropic-client-email"
                className="block text-sm font-medium mb-2"
              >
                GCP Service Account Email
              </Label>
              <Input
                placeholder="service-account@project.iam.gserviceaccount.com"
                id="vertex-anthropic-client-email"
                value={
                  (apiKeys.vertex_anthropic?.googleAuthOptions?.credentials
                    ?.client_email as string) || ''
                }
                onChange={e => {
                  const currentCredentials =
                    apiKeys.vertex_anthropic?.googleAuthOptions?.credentials ||
                    {};
                  void updateKey({
                    provider: 'vertex_anthropic',
                    config: {
                      ...apiKeys.vertex_anthropic,
                      googleAuthOptions: {
                        ...apiKeys.vertex_anthropic?.googleAuthOptions,
                        credentials: {
                          ...currentCredentials,
                          client_email: e.target.value,
                        },
                      },
                    },
                  });
                }}
              />
            </div>
            <div className="mb-4">
              <Label
                htmlFor="vertex-anthropic-private-key"
                className="block text-sm font-medium mb-2"
              >
                GCP Service Account Private Key
              </Label>
              <Input
                placeholder="-----BEGIN PRIVATE KEY-----..."
                type="password"
                id="vertex-anthropic-private-key"
                value={
                  (apiKeys.vertex_anthropic?.googleAuthOptions?.credentials
                    ?.private_key as string) || ''
                }
                onChange={e => {
                  const currentCredentials =
                    apiKeys.vertex_anthropic?.googleAuthOptions?.credentials ||
                    {};
                  void updateKey({
                    provider: 'vertex_anthropic',
                    config: {
                      ...apiKeys.vertex_anthropic,
                      googleAuthOptions: {
                        ...apiKeys.vertex_anthropic?.googleAuthOptions,
                        credentials: {
                          ...currentCredentials,
                          private_key: e.target.value,
                        },
                      },
                    },
                  });
                }}
              />
            </div>
          </div>

          <Separator />

          {/* Vertex AI Gemini */}
          <div className="px-5 space-y-4">
            <h3 className="font-medium text-lg mb-2">Vertex Gemini</h3>
            <div className="mb-4">
              <Label
                htmlFor="vertex-gemini-location"
                className="block text-sm font-medium mb-2"
              >
                GCP Location
              </Label>
              <Input
                placeholder="us-central1"
                id="vertex-gemini-location"
                value={(apiKeys.vertex_gemini?.location as string) || ''}
                onChange={e =>
                  void updateKey({
                    provider: 'vertex_gemini',
                    config: {
                      ...apiKeys.vertex_gemini,
                      location: e.target.value,
                    },
                  })
                }
              />
            </div>
            <div className="mb-4">
              <Label
                htmlFor="vertex-gemini-client-email"
                className="block text-sm font-medium mb-2"
              >
                GCP Service Account Email
              </Label>
              <Input
                placeholder="service-account@project.iam.gserviceaccount.com"
                id="vertex-gemini-client-email"
                value={
                  (apiKeys.vertex_gemini?.googleAuthOptions?.credentials
                    ?.client_email as string) || ''
                }
                onChange={e => {
                  const currentCredentials =
                    apiKeys.vertex_gemini?.googleAuthOptions?.credentials || {};
                  void updateKey({
                    provider: 'vertex_gemini',
                    config: {
                      ...apiKeys.vertex_gemini,
                      googleAuthOptions: {
                        ...apiKeys.vertex_gemini?.googleAuthOptions,
                        credentials: {
                          ...currentCredentials,
                          client_email: e.target.value,
                        },
                      },
                    },
                  });
                }}
              />
            </div>
            <div className="mb-4">
              <Label
                htmlFor="vertex-gemini-private-key"
                className="block text-sm font-medium mb-2"
              >
                GCP Service Account Private Key
              </Label>
              <Input
                placeholder="-----BEGIN PRIVATE KEY-----..."
                type="password"
                id="vertex-gemini-private-key"
                value={
                  (apiKeys.vertex_gemini?.googleAuthOptions?.credentials
                    ?.private_key as string) || ''
                }
                onChange={e => {
                  const currentCredentials =
                    apiKeys.vertex_gemini?.googleAuthOptions?.credentials || {};
                  void updateKey({
                    provider: 'vertex_gemini',
                    config: {
                      ...apiKeys.vertex_gemini,
                      googleAuthOptions: {
                        ...apiKeys.vertex_gemini?.googleAuthOptions,
                        credentials: {
                          ...currentCredentials,
                          private_key: e.target.value,
                        },
                      },
                    },
                  });
                }}
              />
            </div>
          </div>

          <Separator />

          {/* Unsplash Key */}
          <div className="px-5 space-y-4">
            <Label className="text-sm font-medium">Unsplash API Key</Label>
            <div className="flex items-center gap-2">
              <Input
                type="password"
                className="py-2 px-3 text-base font-normal placeholder:opacity-50"
                value={unsplashKey}
                placeholder="00000000-0000-0000-00000000:xxxxxxxxxxxxxxxxx"
                onChange={e => setUnsplashKey(e.target.value)}
              />
              <Button
                disabled={!unsplashKey || savingStates['unsplash']}
                onClick={() => handleSaveKey('unsplash', { key: unsplashKey })}
              >
                {savingStates['unsplash'] ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Save'
                )}
              </Button>
            </div>
          </div>

          <Separator />

          <div className="px-5 space-y-3 text-sm font-normal text-gray-500">
            <p>
              These API keys will be stored securely on your server. Changing
              them will affect all users of your self-hosted instance.
            </p>
            <p className="mt-1">
              Custom API keys may have varying performance. AFFiNE does not
              guarantee results when using custom API keys.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
