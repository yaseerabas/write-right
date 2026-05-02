/**
 * LLM Configuration
 *
 * This file previously contained frontend LLM settings.
 * All LLM configuration is now handled server-side for security.
 * This file is kept for backward compatibility of any imports.
 */

export interface LLMSettings {
  provider: string;
  modelId: string;
  apiKey: string;
  baseUrl: string;
}

export function isLLMConfigured(): boolean {
  // Deprecated: Configuration is checked server-side via /api/health
  return true;
}

export function getDisplayConfig(): Omit<LLMSettings, 'apiKey'> & { apiKeyMasked: string } {
  // Deprecated: Configuration is no longer exposed to the frontend
  return {
    provider: 'server-side',
    modelId: 'server-side',
    baseUrl: 'server-side',
    corsProxyUrl: 'None',
    apiKeyMasked: 'server-side',
  };
}
