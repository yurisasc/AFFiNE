import { Injectable, Logger } from '@nestjs/common';

import { ServerFeature, ServerService } from '../../../core';
import type { CopilotProvider } from './provider';
import {
  CopilotProviderModel,
  CopilotProviderType,
  ModelFullConditions,
} from './types';

@Injectable()
export class CopilotProviderFactory {
  constructor(private readonly server: ServerService) {}

  private readonly logger = new Logger(CopilotProviderFactory.name);

  readonly #providers = new Map<CopilotProviderType, CopilotProvider>();

  async getProvider(
    cond: ModelFullConditions,
    filter: {
      prefer?: CopilotProviderType;
    } = {}
  ): Promise<CopilotProvider | null> {
    this.logger.debug(
      `Resolving copilot provider for output type: ${cond.outputType}`
    );
    let candidate: CopilotProvider | null = null;
    this.logger.debug(`Total registered providers: ${this.#providers.size}`);
    for (const [type, provider] of this.#providers.entries()) {
      if (filter.prefer && filter.prefer !== type) {
        continue;
      }

      const isMatched = await provider.match(cond);

      if (isMatched) {
        candidate = provider;
        this.logger.debug(`Copilot provider candidate found: ${type}`);
        break;
      }
    }

    this.logger.debug(
      `Final provider selection for ${cond.outputType}: ${candidate ? candidate.type : 'NONE'}`
    );
    return candidate;
  }

  async getProviderByModel(
    modelId: string,
    filter: {
      prefer?: CopilotProviderType;
    } = {}
  ): Promise<CopilotProvider | null> {
    this.logger.debug(`Resolving copilot provider for model: ${modelId}`);

    let candidate: CopilotProvider | null = null;
    for (const [type, provider] of this.#providers.entries()) {
      if (filter.prefer && filter.prefer !== type) {
        continue;
      }

      if (await provider.match({ modelId })) {
        candidate = provider;
        this.logger.debug(`Copilot provider candidate found: ${type}`);
      }
    }

    return candidate;
  }

  register(provider: CopilotProvider) {
    this.#providers.set(provider.type, provider);
    this.logger.log(`Copilot provider [${provider.type}] registered.`);
    this.server.enableFeature(ServerFeature.Copilot);
  }

  /**
   * Get all default models from all registered providers
   * @returns Object mapping provider types to their default models
   */
  getDefaultModels(): Record<CopilotProviderType, CopilotProviderModel[]> {
    const defaultModels: Partial<
      Record<CopilotProviderType, CopilotProviderModel[]>
    > = {};

    for (const [type, provider] of this.#providers.entries()) {
      defaultModels[type] = provider.defaultModels;
    }

    return defaultModels as Record<CopilotProviderType, CopilotProviderModel[]>;
  }

  unregister(provider: CopilotProvider) {
    this.#providers.delete(provider.type);
    this.logger.log(`Copilot provider [${provider.type}] unregistered.`);
    if (this.#providers.size === 0) {
      this.server.disableFeature(ServerFeature.Copilot);
    }
  }
}
