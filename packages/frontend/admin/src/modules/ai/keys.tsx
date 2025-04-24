import { Button } from '@affine/admin/components/ui/button';
import { Input } from '@affine/admin/components/ui/input';
import { Label } from '@affine/admin/components/ui/label';
import { Separator } from '@affine/admin/components/ui/separator';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

import { useKeys } from './use-keys';

export function Keys() {
  const { apiKeys, loading, updateKey } = useKeys();

  const [openAIKey, setOpenAIKey] = useState('');
  const [openAIBaseUrl, setOpenAIBaseUrl] = useState('');
  const [falAIKey, setFalAIKey] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [perplexityKey, setPerplexityKey] = useState('');
  const [unsplashKey, setUnsplashKey] = useState('');

  const [savingStates, setSavingStates] = useState<Record<string, boolean>>({});

  // Load initial values when data is available
  useEffect(() => {
    if (!loading && apiKeys) {
      setOpenAIKey(apiKeys.openai?.apiKey || '');
      setOpenAIBaseUrl(apiKeys.openai?.baseUrl || '');
      setFalAIKey(apiKeys.fal?.apiKey || '');
      setGeminiKey(apiKeys.gemini?.apiKey || '');
      setPerplexityKey(apiKeys.perplexity?.apiKey || '');
      setUnsplashKey(apiKeys.unsplash?.key || '');
    }
  }, [apiKeys, loading]);

  // Handler to save key with loading state
  const handleSaveKey = (provider: string, config: Record<string, string>) => {
    setSavingStates(prev => ({ ...prev, [provider]: true }));

    try {
      updateKey({
        provider: provider as keyof typeof apiKeys,
        config,
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
          <div className="px-5 space-y-3">
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
            <Label className="text-sm font-medium mt-2">
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

          {/* Fal.AI Key */}
          <div className="px-5 space-y-3">
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
          <div className="px-5 space-y-3">
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
          <div className="px-5 space-y-3">
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

          {/* Unsplash Key */}
          <div className="px-5 space-y-3">
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
