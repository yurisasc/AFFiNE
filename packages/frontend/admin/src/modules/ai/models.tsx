import { Button } from '@affine/admin/components/ui/button';
import { Card } from '@affine/admin/components/ui/card';
import { Input } from '@affine/admin/components/ui/input';
import { Label } from '@affine/admin/components/ui/label';
import { Separator } from '@affine/admin/components/ui/separator';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@affine/admin/components/ui/tabs';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';

import { useKeys } from './use-keys';

type ModelProvider = 'openai' | 'gemini' | 'perplexity' | 'fal';

// Helper to check if a provider has models
const hasModels = (provider: string): provider is ModelProvider => {
  return ['openai', 'gemini', 'perplexity', 'fal'].includes(provider);
};

export function Models() {
  const { apiKeys, loading, updateKey } = useKeys();
  const [newModel, setNewModel] = useState('');
  const [activeProvider, setActiveProvider] = useState<ModelProvider>('openai');
  const [isSaving, setIsSaving] = useState(false);

  // Get current models from the provider, or use empty array if not defined
  const currentModels = hasModels(activeProvider)
    ? apiKeys[activeProvider]?.models || []
    : [];

  const addModel = () => {
    if (
      !hasModels(activeProvider) ||
      !newModel ||
      currentModels.includes(newModel)
    ) {
      return;
    }

    setIsSaving(true);
    try {
      const updatedConfig = {
        ...apiKeys[activeProvider],
        models: [...currentModels, newModel],
      };

      updateKey({
        provider: activeProvider,
        config: updatedConfig,
      });

      setNewModel('');
    } finally {
      setIsSaving(false);
    }
  };

  const removeModel = async (model: string) => {
    if (!hasModels(activeProvider)) {
      return;
    }

    setIsSaving(true);
    try {
      const updatedConfig = {
        ...apiKeys[activeProvider],
        models: currentModels.filter(m => m !== model),
      };

      updateKey({
        provider: activeProvider,
        config: updatedConfig,
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center p-4">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );

  return (
    <div className="flex flex-col gap-3 py-5 px-6 w-full">
      <div className="flex items-center">
        <span className="text-xl font-semibold">AI Model Configuration</span>
      </div>

      <Card className="flex flex-col rounded-md border py-4 gap-4">
        <div className="px-5 space-y-4">
          <Tabs
            defaultValue="openai"
            value={activeProvider}
            onValueChange={value => {
              if (hasModels(value)) {
                setActiveProvider(value);
              }
            }}
            className="w-full"
          >
            <TabsList className="grid grid-cols-4 mb-4">
              <TabsTrigger value="openai">OpenAI</TabsTrigger>
              <TabsTrigger value="gemini">Gemini</TabsTrigger>
              <TabsTrigger value="perplexity">Perplexity</TabsTrigger>
              <TabsTrigger value="fal">FAL</TabsTrigger>
            </TabsList>

            {['openai', 'gemini', 'perplexity', 'fal']
              .filter(hasModels)
              .map(provider => (
                <TabsContent
                  key={provider}
                  value={provider}
                  className="space-y-4"
                >
                  <Label className="text-sm font-medium">
                    Available Models
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {(apiKeys[provider as ModelProvider]?.models || []).map(
                      (model: string) => (
                        <div
                          key={model}
                          className="flex items-center gap-2 p-2 border rounded-md"
                        >
                          <span>{model}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => void removeModel(model)}
                            disabled={isSaving}
                          >
                            ✕
                          </Button>
                        </div>
                      )
                    )}
                    {(apiKeys[provider as ModelProvider]?.models || [])
                      .length === 0 && (
                      <p className="text-sm text-gray-500">
                        No models configured. Add some below.
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Input
                      placeholder="Add new model"
                      value={provider === activeProvider ? newModel : ''}
                      onChange={e => setNewModel(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          void addModel();
                        }
                      }}
                      disabled={isSaving}
                    />
                    <Button onClick={addModel} disabled={!newModel || isSaving}>
                      {isSaving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Add'
                      )}
                    </Button>
                  </div>
                </TabsContent>
              ))}
          </Tabs>
        </div>

        <Separator />

        <div className="px-5 space-y-3 text-sm font-normal text-gray-500">
          <p>Configure which models are available for each AI provider.</p>
          <p>
            These models will be used for various AI tasks including text
            generation, transcription, and image generation.
          </p>
        </div>
      </Card>
    </div>
  );
}
