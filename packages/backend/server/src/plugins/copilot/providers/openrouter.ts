import {
  createOpenRouter,
  type OpenRouterProvider as VercelOpenRouterProvider,
  OpenRouterSharedSettings,
} from '@openrouter/ai-sdk-provider';
import { AISDKError, generateObject, generateText, streamText } from 'ai';

import {
  CopilotPromptInvalid,
  CopilotProviderSideError,
  metrics,
  UserFriendlyError,
} from '../../../base';
import { CopilotProvider } from './provider';
import type {
  CopilotChatOptions,
  CopilotImageOptions,
  CopilotStructuredOptions,
  ModelConditions,
  PromptMessage,
} from './types';
import {
  CopilotProviderModel,
  CopilotProviderType,
  ModelInputType,
  ModelOutputType,
} from './types';
import { chatToGPTMessage, CitationParser, TextStreamParser } from './utils';

// Define a new provider type for OpenRouter
// Use enum value from CopilotProviderType.OpenRouter
// Add the new type to CopilotProviderType if needed

export const DEFAULT_DIMENSIONS = 256;

export type OpenRouterConfig = {
  apiKey: string;
  baseUrl?: string;
  models?: CopilotProviderModel[];
};

export class OpenRouterProvider extends CopilotProvider<OpenRouterConfig> {
  readonly type = CopilotProviderType.OpenRouter;

  // Common models available on OpenRouter
  readonly defaultModels = [
    // Text models
    {
      id: 'openai/gpt-4-turbo',
      name: 'OpenAI GPT-4 Turbo',
      capabilities: [
        {
          input: [ModelInputType.Text],
          output: [ModelOutputType.Text, ModelOutputType.Structured],
          defaultForOutputType: true,
        },
      ],
    },
    {
      id: 'anthropic/claude-3-opus',
      name: 'Anthropic Claude 3 Opus',
      capabilities: [
        {
          input: [ModelInputType.Text, ModelInputType.Image],
          output: [ModelOutputType.Text],
        },
      ],
    },
    {
      id: 'anthropic/claude-3-sonnet',
      name: 'Anthropic Claude 3 Sonnet',
      capabilities: [
        {
          input: [ModelInputType.Text, ModelInputType.Image],
          output: [ModelOutputType.Text],
        },
      ],
    },
    {
      id: 'google/gemini-pro',
      name: 'Google Gemini Pro',
      capabilities: [
        {
          input: [ModelInputType.Text],
          output: [ModelOutputType.Text],
        },
      ],
    },
    // Embedding models
    {
      id: 'openai/text-embedding-ada-002',
      name: 'OpenAI Embedding Ada',
      capabilities: [
        {
          input: [ModelInputType.Text],
          output: [ModelOutputType.Embedding],
          defaultForOutputType: true,
        },
      ],
    },
  ];

  #instance!: VercelOpenRouterProvider;

  override configured(): boolean {
    const result = !!this.config.apiKey;
    return result;
  }

  protected override setup() {
    super.setup();

    // OpenRouter requires specific headers for proper operation
    // See https://openrouter.ai/docs
    this.#instance = createOpenRouter({
      apiKey: this.config.apiKey,
      headers: {
        'HTTP-Referer': 'https://affine.pro', // The URL of your site
        'X-Title': 'AFFiNE Copilot', // The name of your app
      },
    });
  }

  private handleError(
    e: any,
    model: string,
    options: CopilotImageOptions = {}
  ) {
    if (e instanceof UserFriendlyError) {
      return e;
    } else if (e instanceof AISDKError) {
      if (e.message.includes('safety') || e.message.includes('risk')) {
        metrics.ai
          .counter('chat_text_risk_errors')
          .add(1, { model, user: options.user || undefined });
      }

      return new CopilotProviderSideError({
        provider: this.type,
        kind: e.name || 'unknown',
        message: e.message,
      });
    } else {
      return new CopilotProviderSideError({
        provider: this.type,
        kind: 'unexpected_response',
        message: e?.message || 'Unexpected OpenRouter response',
      });
    }
  }

  async text(
    cond: ModelConditions,
    messages: PromptMessage[],
    options: CopilotChatOptions = {}
  ): Promise<string> {
    const fullCond = {
      ...cond,
      outputType: ModelOutputType.Text,
    };
    await this.checkParams({ messages, cond: fullCond, options });
    const model = this.selectModel(fullCond);

    try {
      metrics.ai.counter('chat_text_calls').add(1, { model: model.id });

      const [system, msgs] = await chatToGPTMessage(messages);

      const modelInstance = this.#instance(
        model.id,
        this.getExtraConfig(options)
      );

      const generateTextOptions = {
        model: modelInstance,
        system,
        messages: msgs,
        temperature: options.temperature ?? 0,
        maxTokens: options.maxTokens ?? 4096,
        abortSignal: options.signal,
      };

      const { text } = await generateText(generateTextOptions);

      return text.trim();
    } catch (e: any) {
      metrics.ai.counter('chat_text_errors').add(1, { model: model.id });
      throw this.handleError(e, model.id, options);
    }
  }

  async *streamText(
    cond: ModelConditions,
    messages: PromptMessage[],
    options: CopilotChatOptions = {}
  ): AsyncIterable<string> {
    const fullCond = {
      ...cond,
      outputType: ModelOutputType.Text,
    };
    await this.checkParams({ messages, cond: fullCond, options });
    const model = this.selectModel(fullCond);

    try {
      metrics.ai.counter('chat_text_stream_calls').add(1, { model: model.id });
      const [system, msgs] = await chatToGPTMessage(messages);

      const modelInstance = this.#instance(
        model.id,
        this.getExtraConfig(options)
      );

      const streamOptions = {
        model: modelInstance,
        system,
        messages: msgs,
        frequencyPenalty: options.frequencyPenalty ?? 0,
        presencePenalty: options.presencePenalty ?? 0,
        temperature: options.temperature ?? 0,
        maxTokens: options.maxTokens ?? 4096,
        abortSignal: options.signal,
      };

      const { fullStream } = streamText(streamOptions);

      const citationParser = new CitationParser();
      const textParser = new TextStreamParser();

      for await (const chunk of fullStream) {
        switch (chunk.type) {
          case 'text-delta': {
            let result = textParser.parse(chunk);
            result = citationParser.parse(result);
            yield result;
            break;
          }
          case 'finish': {
            const result = citationParser.end();
            yield result;
            break;
          }
          default: {
            yield textParser.parse(chunk);
            break;
          }
        }
        if (options.signal?.aborted) {
          await fullStream.cancel();
          break;
        }
      }
    } catch (e: any) {
      metrics.ai.counter('chat_text_stream_errors').add(1, { model: model.id });
      throw this.handleError(e, model.id, options);
    }
  }

  override async structure(
    cond: ModelConditions,
    messages: PromptMessage[],
    options: CopilotStructuredOptions = {}
  ): Promise<string> {
    const fullCond = { ...cond, outputType: ModelOutputType.Structured };
    await this.checkParams({ messages, cond: fullCond, options });
    const model = this.selectModel(fullCond);

    try {
      metrics.ai.counter('chat_text_calls').add(1, { model: model.id });

      const [system, msgs, schema] = await chatToGPTMessage(messages);
      if (!schema) {
        throw new CopilotPromptInvalid('Schema is required');
      }

      const modelInstance = this.#instance(model.id);

      const { object } = await generateObject({
        model: modelInstance,
        system,
        messages: msgs,
        temperature: options.temperature ?? 0,
        maxTokens: options.maxTokens ?? 4096,
        maxRetries: options.maxRetries ?? 3,
        schema,
        abortSignal: options.signal,
      });

      return JSON.stringify(object);
    } catch (e: any) {
      metrics.ai.counter('chat_text_errors').add(1, { model: model.id });
      throw this.handleError(e, model.id, options);
    }
  }

  private getExtraConfig(
    options: CopilotChatOptions
  ): OpenRouterSharedSettings {
    const extraConfig: OpenRouterSharedSettings = {};
    if (options?.webSearch) {
      extraConfig.extraBody = {
        plugins: [{ id: 'web' }],
      };
    }
    if (options?.reasoning) {
      extraConfig.reasoning = {
        effort: 'low' as const,
      };
    }

    return extraConfig;
  }
}
