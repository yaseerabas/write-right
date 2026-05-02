export interface LLMServiceError extends Error {
  status?: number;
}

export function createError(message: string, status?: number): LLMServiceError {
  const error = new Error(message) as LLMServiceError;
  error.status = status;
  return error;
}

/**
 * Simple HTTP-based LLM service that calls the backend API.
 * All LLM configuration (API keys, base URLs, models) is handled server-side.
 */
export class LLMService {
  private async post<T>(endpoint: string, body: unknown): Promise<T> {
    const response = await fetch(`/api${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json().catch(() => ({ error: 'Invalid response from server' }));

    if (!response.ok) {
      throw createError(data.error || `HTTP ${response.status}`, response.status);
    }

    return data as T;
  }

  public async isConfigured(): Promise<boolean> {
    try {
      const response = await fetch('/api/health');
      const data = await response.json();
      return data.configured === true;
    } catch {
      return false;
    }
  }

  public async generateText(prompt: string, tone: string, length: string): Promise<string> {
    const data = await this.post<{ result: string }>('/generate', { prompt, tone, length });
    return data.result;
  }

  public async editText(text: string, instruction: string): Promise<string> {
    const data = await this.post<{ result: string }>('/edit', { text, instruction });
    return data.result;
  }

  public async summarizeText(text: string): Promise<string> {
    const data = await this.post<{ result: string }>('/summarize', { text });
    return data.result;
  }
}

export const llmService = new LLMService();
