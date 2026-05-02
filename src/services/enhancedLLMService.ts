import { llmService } from './llmService';
import { showSuccess, showError } from '@/utils/toast';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface RetryConfig {
  maxRetries: number;
  retryDelay: number;
  backoffMultiplier: number;
}

class EnhancedLLMService {
  private cache = new Map<string, CacheEntry<string>>();
  private readonly CACHE_TTL = 10 * 60 * 1000; // 10 minutes
  private readonly MAX_CACHE_SIZE = 100; // Limit cache size
  private readonly retryConfig: RetryConfig = {
    maxRetries: 3,
    retryDelay: 1000,
    backoffMultiplier: 2
  };

  private getCacheKey(type: string, input: string, params?: string): string {
    const normalizedInput = input.toLowerCase().trim().replace(/\s+/g, ' ');
    return `${type}:${btoa(normalizedInput)}:${params || ''}`;
  }

  private getFromCache(key: string): string | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  private setCache(key: string, data: string): void {
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: this.CACHE_TTL
    });
  }

  private async retryOperation<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt === this.retryConfig.maxRetries) {
          console.error(`Operation ${operationName} failed after ${this.retryConfig.maxRetries + 1} attempts:`, lastError);
          throw lastError;
        }

        const delay = this.retryConfig.retryDelay * Math.pow(this.retryConfig.backoffMultiplier, attempt);
        console.log(`Retrying ${operationName} in ${delay}ms (attempt ${attempt + 1}/${this.retryConfig.maxRetries + 1})`);

        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  }

  private validateInput(input: string, minLength: number = 1): void {
    if (!input || typeof input !== 'string') {
      throw new Error('Invalid input: input must be a non-empty string');
    }
    if (input.trim().length < minLength) {
      throw new Error(`Input too short: minimum ${minLength} characters required`);
    }
    if (input.length > 10000) {
      throw new Error('Input too long: maximum 10,000 characters allowed');
    }
  }

  public async generateText(prompt: string, tone: string, length: string): Promise<string> {
    this.validateInput(prompt, 3);

    const cacheKey = this.getCacheKey('generate', prompt, `${tone}:${length}`);
    const cached = this.getFromCache(cacheKey);

    if (cached) {
      console.log('Returning cached result for generateText');
      return cached;
    }

    return this.retryOperation(async () => {
      const result = await llmService.generateText(prompt, tone, length);

      if (!result || result.trim().length === 0) {
        throw new Error('Empty response received from AI service');
      }

      this.setCache(cacheKey, result);
      return result;
    }, 'generateText');
  }

  public async editText(text: string, instruction: string): Promise<string> {
    this.validateInput(text, 5);
    this.validateInput(instruction, 3);

    const cacheKey = this.getCacheKey('edit', text, instruction);
    const cached = this.getFromCache(cacheKey);

    if (cached) {
      console.log('Returning cached result for editText');
      return cached;
    }

    return this.retryOperation(async () => {
      const result = await llmService.editText(text, instruction);

      if (!result || result.trim().length === 0) {
        throw new Error('Empty response received from AI service');
      }

      if (result.trim() === text.trim()) {
        console.warn('Edit operation returned unchanged text');
      }

      this.setCache(cacheKey, result);
      return result;
    }, 'editText');
  }

  public async summarizeText(text: string): Promise<string> {
    this.validateInput(text, 50);

    const cacheKey = this.getCacheKey('summarize', text);
    const cached = this.getFromCache(cacheKey);

    if (cached) {
      console.log('Returning cached result for summarizeText');
      return cached;
    }

    return this.retryOperation(async () => {
      const result = await llmService.summarizeText(text);

      if (!result || result.trim().length === 0) {
        throw new Error('Empty response received from AI service');
      }

      if (result.length >= text.length) {
        console.warn('Summary is longer than original text');
      }

      this.setCache(cacheKey, result);
      return result;
    }, 'summarizeText');
  }

  public clearCache(): void {
    this.cache.clear();
    console.log('Cache cleared');
  }

  public getCacheStats(): { size: number; maxSize: number; ttl: number } {
    return {
      size: this.cache.size,
      maxSize: this.MAX_CACHE_SIZE,
      ttl: this.CACHE_TTL
    };
  }

  public isConfigured(): Promise<boolean> {
    return llmService.isConfigured();
  }

  public reloadSettings(): void {
    this.clearCache();
  }

  public async testConnection(): Promise<boolean> {
    return this.isConfigured();
  }
}

export const enhancedLLMService = new EnhancedLLMService();
