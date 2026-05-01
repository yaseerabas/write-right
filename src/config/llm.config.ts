/**
 * LLM Configuration
 *
 * This file centralizes all LLM settings sourced from environment variables.
 * In development, a custom fetch adapter routes requests through the Vite proxy.
 * In production, ensure your deployment environment sets these variables.
 */

export interface LLMSettings {
  provider: string;
  modelId: string;
  apiKey: string;
  baseUrl: string;
  corsProxyUrl?: string;
}

function getEnvVar(key: string, defaultValue: string = ''): string {
  const value = import.meta.env[key];
  return value !== undefined && value !== null ? String(value) : defaultValue;
}

const rawBaseUrl = getEnvVar('VITE_LLM_BASE_URL', 'https://api.openai.com/v1');

export const llmConfig: LLMSettings = {
  provider: getEnvVar('VITE_LLM_PROVIDER', 'openai'),
  modelId: getEnvVar('VITE_LLM_MODEL_ID', 'gpt-3.5-turbo'),
  apiKey: getEnvVar('VITE_LLM_API_KEY', ''),
  baseUrl: rawBaseUrl,
  corsProxyUrl: import.meta.env.DEV
    ? '' // Dev uses Vite proxy; no CORS proxy needed
    : getEnvVar('VITE_LLM_CORS_PROXY_URL', ''),
};

export function isLLMConfigured(): boolean {
  return !!(
    llmConfig.apiKey &&
    llmConfig.apiKey.trim() !== '' &&
    llmConfig.modelId &&
    llmConfig.modelId.trim() !== '' &&
    llmConfig.baseUrl &&
    llmConfig.baseUrl.trim() !== ''
  );
}

export function getDisplayConfig(): Omit<LLMSettings, 'apiKey'> & { apiKeyMasked: string } {
  const maskedKey = llmConfig.apiKey
    ? llmConfig.apiKey.slice(0, 4) + '...' + llmConfig.apiKey.slice(-4)
    : 'Not set';

  return {
    provider: llmConfig.provider,
    modelId: llmConfig.modelId,
    baseUrl: llmConfig.baseUrl,
    corsProxyUrl: llmConfig.corsProxyUrl || 'None',
    apiKeyMasked: maskedKey,
  };
}
