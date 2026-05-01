/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_LLM_PROVIDER: string;
  readonly VITE_LLM_MODEL_ID: string;
  readonly VITE_LLM_API_KEY: string;
  readonly VITE_LLM_BASE_URL: string;
  readonly VITE_LLM_CORS_PROXY_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
