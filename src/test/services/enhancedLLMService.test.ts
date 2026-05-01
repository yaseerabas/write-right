import { describe, it, expect, vi, beforeEach } from 'vitest';
import { enhancedLLMService } from '@/services/enhancedLLMService';
import { llmService } from '@/services/llmService';

// Mock the original llmService
vi.mock('@/services/llmService', () => ({
  llmService: {
    generateText: vi.fn(),
    editText: vi.fn(),
    summarizeText: vi.fn(),
    isConfigured: vi.fn(),
    reloadSettings: vi.fn(),
  },
  isCORSError: vi.fn(() => false),
}));

describe('EnhancedLLMService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    enhancedLLMService.clearCache();
  });

  describe('generateText', () => {
    it('should cache results and return cached data on subsequent calls', async () => {
      const mockResult = 'Generated text';
      vi.mocked(llmService.generateText).mockResolvedValue(mockResult);

      // First call
      const result1 = await enhancedLLMService.generateText('prompt', 'professional', 'medium');
      expect(result1).toBe(mockResult);
      expect(llmService.generateText).toHaveBeenCalledTimes(1);

      // Second call with same parameters should use cache
      const result2 = await enhancedLLMService.generateText('prompt', 'professional', 'medium');
      expect(result2).toBe(mockResult);
      expect(llmService.generateText).toHaveBeenCalledTimes(1); // Should not be called again
    });

    it('should make new API call for different parameters', async () => {
      const mockResult1 = 'Generated text 1';
      const mockResult2 = 'Generated text 2';
      vi.mocked(llmService.generateText)
        .mockResolvedValueOnce(mockResult1)
        .mockResolvedValueOnce(mockResult2);

      await enhancedLLMService.generateText('prompt1', 'professional', 'medium');
      await enhancedLLMService.generateText('prompt2', 'professional', 'medium');

      expect(llmService.generateText).toHaveBeenCalledTimes(2);
    });

    it('should handle errors from the underlying service', async () => {
      const mockError = new Error('API Error');
      vi.mocked(llmService.generateText).mockRejectedValue(mockError);

      await expect(enhancedLLMService.generateText('prompt', 'professional', 'medium'))
        .rejects.toThrow('API Error');
    }, 15000);
  });

  describe('editText', () => {
    it('should cache edit results', async () => {
      const mockResult = 'Edited text';
      vi.mocked(llmService.editText).mockResolvedValue(mockResult);

      const result1 = await enhancedLLMService.editText('sample text for editing', 'instruction');
      const result2 = await enhancedLLMService.editText('sample text for editing', 'instruction');

      expect(result1).toBe(mockResult);
      expect(result2).toBe(mockResult);
      expect(llmService.editText).toHaveBeenCalledTimes(1);
    });
  });

  describe('summarizeText', () => {
    it('should cache summary results', async () => {
      const mockResult = 'Summary text';
      vi.mocked(llmService.summarizeText).mockResolvedValue(mockResult);

      const longText = 'This is a sufficiently long piece of text that meets the minimum fifty character requirement for summarization operations.';
      const result1 = await enhancedLLMService.summarizeText(longText);
      const result2 = await enhancedLLMService.summarizeText(longText);

      expect(result1).toBe(mockResult);
      expect(result2).toBe(mockResult);
      expect(llmService.summarizeText).toHaveBeenCalledTimes(1);
    });
  });

  describe('cache management', () => {
    it('should clear cache when requested', async () => {
      const mockResult = 'Generated text';
      vi.mocked(llmService.generateText).mockResolvedValue(mockResult);

      await enhancedLLMService.generateText('prompt', 'professional', 'medium');
      await enhancedLLMService.generateText('prompt', 'professional', 'medium'); // Should use cache

      expect(llmService.generateText).toHaveBeenCalledTimes(1);

      enhancedLLMService.clearCache();
      await enhancedLLMService.generateText('prompt', 'professional', 'medium'); // Should make new call

      expect(llmService.generateText).toHaveBeenCalledTimes(2);
    });
  });
});