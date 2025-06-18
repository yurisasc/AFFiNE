import {
  AnthropicOfficialProvider,
  AnthropicVertexProvider,
} from './anthropic';
import { FalProvider } from './fal';
import { GeminiGenerativeProvider, GeminiVertexProvider } from './gemini';
import { OpenAIProvider } from './openai';
import { OpenRouterProvider } from './openrouter';
import { PerplexityProvider } from './perplexity';

export const CopilotProviders = [
  OpenAIProvider,
  FalProvider,
  GeminiGenerativeProvider,
  GeminiVertexProvider,
  PerplexityProvider,
  AnthropicOfficialProvider,
  AnthropicVertexProvider,
  OpenRouterProvider,
];

export {
  AnthropicOfficialProvider,
  AnthropicVertexProvider,
} from './anthropic';
export { CopilotProviderFactory } from './factory';
export { FalProvider } from './fal';
export { GeminiGenerativeProvider, GeminiVertexProvider } from './gemini';
export { OpenAIProvider } from './openai';
export { OpenRouterProvider } from './openrouter';
export { PerplexityProvider } from './perplexity';
export type { CopilotProvider } from './provider';
export * from './types';
