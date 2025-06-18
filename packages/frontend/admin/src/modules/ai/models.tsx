import { Button } from '@affine/admin/components/ui/button';
import { Card } from '@affine/admin/components/ui/card';
import { Checkbox } from '@affine/admin/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@affine/admin/components/ui/dialog';
import { Input } from '@affine/admin/components/ui/input';
import { Label } from '@affine/admin/components/ui/label';
import { Separator } from '@affine/admin/components/ui/separator';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@affine/admin/components/ui/tabs';
import { Edit, Loader2 } from 'lucide-react';
import { useState } from 'react';

import type {
  Model,
  ModelCapability,
  ModelInputType,
  ModelOutputType,
} from './use-keys';
import { useKeys } from './use-keys';

type ModelProvider =
  | 'openai'
  | 'openrouter'
  | 'gemini'
  | 'perplexity'
  | 'fal'
  | 'anthropic'
  | 'vertex_anthropic';

// Helper to check if a provider has models
const hasModels = (provider: string): provider is ModelProvider => {
  return [
    'openai',
    'openrouter',
    'gemini',
    'perplexity',
    'fal',
    'anthropic',
    'vertex_anthropic',
  ].includes(provider);
};

interface EditModelDialogProps {
  model: Model;
  isOpen: boolean;
  onClose: () => void;
  onSave: (model: Model) => void;
  isSaving: boolean;
}

function EditModelDialog({
  model,
  isOpen,
  onClose,
  onSave,
  isSaving,
}: EditModelDialogProps) {
  const [editedModel, setEditedModel] = useState<Model>({
    ...model,
    capabilities: [...(model.capabilities || [])],
  });

  // Input/output type options
  const inputTypes: ModelInputType[] = ['text', 'image', 'audio'];
  const outputTypes: ModelOutputType[] = [
    'text',
    'image',
    'embedding',
    'structured',
  ];

  // Function to toggle input type in a capability
  const toggleInputType = (capabilityIndex: number, type: ModelInputType) => {
    const newCapabilities = [...editedModel.capabilities];
    const capability = newCapabilities[capabilityIndex];

    if (capability.input.includes(type)) {
      // Remove the input type if it exists
      capability.input = capability.input.filter(t => t !== type);
    } else {
      // Add the input type if it doesn't exist
      capability.input = [...capability.input, type];
    }

    setEditedModel({
      ...editedModel,
      capabilities: newCapabilities,
    });
  };

  // Function to toggle output type in a capability
  const toggleOutputType = (capabilityIndex: number, type: ModelOutputType) => {
    const newCapabilities = [...editedModel.capabilities];
    const capability = newCapabilities[capabilityIndex];

    if (capability.output.includes(type)) {
      // Remove the output type if it exists
      capability.output = capability.output.filter(t => t !== type);
    } else {
      // Add the output type if it doesn't exist
      capability.output = [...capability.output, type];
    }

    setEditedModel({
      ...editedModel,
      capabilities: newCapabilities,
    });
  };

  // Function to toggle defaultForOutputType for a capability
  const toggleDefaultForOutput = (capabilityIndex: number) => {
    const newCapabilities = [...editedModel.capabilities];
    const capability = newCapabilities[capabilityIndex];

    // Toggle the defaultForOutputType flag
    capability.defaultForOutputType = !capability.defaultForOutputType;

    setEditedModel({
      ...editedModel,
      capabilities: newCapabilities,
    });
  };

  // Function to add a new capability
  const addCapability = () => {
    const newCapability: ModelCapability = {
      input: ['text'],
      output: ['text'],
    };

    setEditedModel({
      ...editedModel,
      capabilities: [...editedModel.capabilities, newCapability],
    });
  };

  // Function to remove a capability
  const removeCapability = (index: number) => {
    const newCapabilities = [...editedModel.capabilities];
    newCapabilities.splice(index, 1);

    setEditedModel({
      ...editedModel,
      capabilities: newCapabilities,
    });
  };

  // Function to update model name
  const updateModelName = (name: string) => {
    setEditedModel({
      ...editedModel,
      name,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={isOpen => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Model: {model.id}</DialogTitle>
          <DialogDescription>
            Configure input/output capabilities for this model
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          <div>
            <Label htmlFor="model-name">Model Name (optional)</Label>
            <Input
              id="model-name"
              value={editedModel.name || ''}
              onChange={e => updateModelName(e.target.value)}
              className="mt-1"
              placeholder="Display name for model"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label>Capabilities</Label>
              <Button onClick={addCapability} size="sm" variant="outline">
                Add Capability
              </Button>
            </div>

            {editedModel.capabilities.map((capability, capIndex) => (
              <Card
                key={`${editedModel.id}-capability-${capability.input?.join('-')}-${capability.output?.join('-')}-${capIndex}`}
                className="p-4 space-y-4"
              >
                <div className="flex justify-between items-center">
                  <h4 className="font-semibold">Capability {capIndex + 1}</h4>
                  {editedModel.capabilities.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCapability(capIndex)}
                    >
                      Remove
                    </Button>
                  )}
                </div>

                <div>
                  <h5 className="font-medium mb-2">Input Types</h5>
                  <div className="flex flex-wrap gap-2">
                    {inputTypes.map(type => (
                      <label
                        key={type}
                        className="flex items-center space-x-2 border rounded-md p-2"
                      >
                        <Checkbox
                          checked={capability.input.includes(type)}
                          onCheckedChange={() =>
                            toggleInputType(capIndex, type)
                          }
                        />
                        <span>{type}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <h5 className="font-medium mb-2">Output Types</h5>
                  <div className="flex flex-wrap gap-2">
                    {outputTypes.map(type => (
                      <label
                        key={type}
                        className="flex items-center space-x-2 border rounded-md p-2"
                      >
                        <Checkbox
                          checked={capability.output.includes(type)}
                          onCheckedChange={() =>
                            toggleOutputType(capIndex, type)
                          }
                        />
                        <span>{type}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="flex items-center space-x-2">
                    <Checkbox
                      checked={!!capability.defaultForOutputType}
                      onCheckedChange={() => toggleDefaultForOutput(capIndex)}
                    />
                    <span>Default for output types</span>
                  </label>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={() => onSave(editedModel)} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Helper function to ensure models is an array, parsing JSON strings if needed
function ensureModelsArray(modelsData: any): Model[] {
  // If it's null or undefined, return an empty array
  if (!modelsData) {
    return [];
  }

  // If it's already an array, return it
  if (Array.isArray(modelsData)) {
    return modelsData;
  }

  // If it's a string, try to parse it as JSON
  if (typeof modelsData === 'string') {
    try {
      const parsed = JSON.parse(modelsData);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error('Failed to parse models string as JSON:', e);
      return [];
    }
  }

  // If it's some other type, return an empty array
  return [];
}

export function Models() {
  const { apiKeys, loading, updateKey } = useKeys();
  const [newModelId, setNewModelId] = useState('');
  const [activeProvider, setActiveProvider] = useState<ModelProvider>('openai');
  const [isSaving, setIsSaving] = useState(false);

  // State for model editing dialog
  const [editModelDialogOpen, setEditModelDialogOpen] = useState(false);
  const [currentEditModel, setCurrentEditModel] = useState<Model | null>(null);

  // Get current models from the provider, parse if string, or use empty array if not defined
  const currentModels = hasModels(activeProvider)
    ? ensureModelsArray(apiKeys[activeProvider]?.models)
    : [];

  const addModel = () => {
    if (
      !hasModels(activeProvider) ||
      !newModelId ||
      currentModels.some(model => model.id === newModelId)
    ) {
      return;
    }

    setIsSaving(true);
    try {
      // Create a new model with default text capability
      const newModel: Model = {
        id: newModelId,
        capabilities: [
          {
            input: ['text'],
            output: ['text'],
          },
        ],
      };

      const updatedConfig = {
        ...apiKeys[activeProvider],
        models: [...currentModels, newModel],
      };

      updateKey({
        provider: activeProvider,
        config: updatedConfig,
      });

      setNewModelId('');
    } finally {
      setIsSaving(false);
    }
  };

  // Open model edit dialog
  const openEditModelDialog = (model: Model) => {
    setCurrentEditModel(model);
    setEditModelDialogOpen(true);
  };

  // Close model edit dialog
  const closeEditModelDialog = () => {
    setEditModelDialogOpen(false);
    setCurrentEditModel(null);
  };

  // Save edited model
  const saveEditedModel = (editedModel: Model) => {
    if (!currentEditModel || !hasModels(activeProvider)) {
      return;
    }

    setIsSaving(true);
    try {
      const updatedModels = currentModels.map(model =>
        model.id === editedModel.id ? editedModel : model
      );

      const updatedConfig = {
        ...apiKeys[activeProvider],
        models: updatedModels,
      };

      updateKey({
        provider: activeProvider,
        config: updatedConfig,
      });

      closeEditModelDialog();
    } finally {
      setIsSaving(false);
    }
  };

  const removeModel = async (modelId: string) => {
    if (!hasModels(activeProvider)) {
      return;
    }

    setIsSaving(true);
    try {
      const updatedConfig = {
        ...apiKeys[activeProvider],
        models: currentModels.filter(model => model.id !== modelId),
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
            <TabsList className="grid grid-cols-7 mb-4">
              <TabsTrigger value="openai">OpenAI</TabsTrigger>
              <TabsTrigger value="openrouter">OpenRouter</TabsTrigger>
              <TabsTrigger value="gemini">Gemini</TabsTrigger>
              <TabsTrigger value="perplexity">Perplexity</TabsTrigger>
              <TabsTrigger value="fal">FAL</TabsTrigger>
              <TabsTrigger value="anthropic">Anthropic</TabsTrigger>
              <TabsTrigger value="vertex_anthropic">
                Vertex Anthropic
              </TabsTrigger>
            </TabsList>

            {[
              'openai',
              'openrouter',
              'gemini',
              'perplexity',
              'fal',
              'anthropic',
              'vertex_anthropic',
            ]
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
                    {ensureModelsArray(
                      apiKeys[provider as ModelProvider]?.models
                    ).map((model: Model) => (
                      <div
                        key={model.id}
                        className="flex items-center gap-2 p-2 border rounded-md"
                      >
                        <span>{model.name || model.id}</span>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditModelDialog(model)}
                            disabled={isSaving}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => void removeModel(model.id)}
                            disabled={isSaving}
                          >
                            ✕
                          </Button>
                        </div>
                      </div>
                    ))}
                    {ensureModelsArray(
                      apiKeys[provider as ModelProvider]?.models
                    ).length === 0 && (
                      <p className="text-sm text-gray-500">
                        No models configured. Add some below.
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Input
                      placeholder="Add new model ID"
                      value={provider === activeProvider ? newModelId : ''}
                      onChange={e => setNewModelId(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          void addModel();
                        }
                      }}
                      disabled={isSaving}
                    />
                    <Button
                      onClick={addModel}
                      disabled={!newModelId || isSaving}
                    >
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

      {/* Model Edit Dialog */}
      {currentEditModel && (
        <EditModelDialog
          model={currentEditModel}
          isOpen={editModelDialogOpen}
          onClose={closeEditModelDialog}
          onSave={saveEditedModel}
          isSaving={isSaving}
        />
      )}
    </div>
  );
}
