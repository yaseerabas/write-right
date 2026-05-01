import OpenAI from 'openai';
import { llmConfig, LLMSettings, isLLMConfigured } from '@/config/llm.config';

export { isCORSError, getCORSHelpMessage } from './llmCorsUtils';

/**
 * Creates a fetch function that rewrites absolute API URLs to use the local Vite proxy path.
 * The OpenAI SDK builds absolute URLs (e.g. https://api.openai.com/v1/chat/completions).
 * We intercept them and route through /api/llm so the Vite dev server proxies the request,
 * which avoids CORS and keeps the Authorization header intact.
 */
function createDevProxyFetch(baseUrl: string): typeof fetch {
  let baseUrlObj: URL;
  try {
    baseUrlObj = new URL(baseUrl);
  } catch {
    console.warn('[Dev Proxy] Invalid baseUrl, falling back to default fetch');
    return fetch;
  }

  return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const originalUrl = new URL(typeof input === 'string' ? input : input.toString());

    // Only rewrite requests that match our configured API origin
    if (originalUrl.origin !== baseUrlObj.origin) {
      return fetch(input, init);
    }

    const proxyUrl = `/api/llm${originalUrl.pathname}${originalUrl.search}`;
    console.log('[Dev Proxy]', originalUrl.href, '->', proxyUrl);

    return fetch(proxyUrl, init);
  };
}

/**
 * Creates a custom fetch function that routes every request through the configured CORS proxy.
 * This is more reliable than prepending the proxy to baseURL, because the OpenAI SDK
 * dynamically constructs request paths (e.g., /chat/completions) and appending them to an
 * already-encoded proxy URL produces malformed requests.
 */
function createProxiedFetch(proxyUrl: string): typeof fetch {
  const normalizedProxy = proxyUrl.endsWith('?')
    ? proxyUrl
    : proxyUrl.endsWith('=')
    ? proxyUrl
    : proxyUrl + '?';

  return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const originalUrl = typeof input === 'string' ? input : input.toString();
    const proxiedUrl = normalizedProxy + encodeURIComponent(originalUrl);

    console.log('[CORS Proxy] Routing request:', originalUrl, '->', proxiedUrl);

    return fetch(proxiedUrl, init);
  };
}

export class LLMService {
  private client: OpenAI | null = null;
  private settings: LLMSettings | null = null;

  constructor() {
    this.settings = { ...llmConfig };
    if (isLLMConfigured()) {
      this.initializeClient();
    }
  }

  private initializeClient() {
    if (!this.settings) return;

    const clientOptions: OpenAI.ClientOptions = {
      apiKey: this.settings.apiKey,
      baseURL: this.settings.baseUrl,
      dangerouslyAllowBrowser: true
    };

    if (import.meta.env.DEV) {
      // In dev, route requests through the Vite proxy to avoid CORS
      clientOptions.fetch = createDevProxyFetch(this.settings.baseUrl);
    } else if (this.settings.corsProxyUrl && this.settings.corsProxyUrl.trim() !== '') {
      // In production, use CORS proxy if configured
      clientOptions.fetch = createProxiedFetch(this.settings.corsProxyUrl.trim());
    }

    this.client = new OpenAI(clientOptions);
  }

  public isConfigured(): boolean {
    return isLLMConfigured();
  }

  /**
   * Reload settings from config. Useful if env variables are hot-reloaded in dev.
   */
  public reloadSettings(): void {
    this.settings = { ...llmConfig };
    if (isLLMConfigured()) {
      this.initializeClient();
    } else {
      this.client = null;
    }
  }

  /**
   * @deprecated Settings now come from env/config. Kept for API compatibility.
   */
  public setSettings(settings: LLMSettings): void {
    this.settings = settings;
    this.initializeClient();
  }

  public async generateText(prompt: string, tone: string, length: string): Promise<string> {
    if (!this.client || !this.settings) {
      throw new Error("LLM service not configured");
    }

    const lengthInstructions = {
      short: "Respond with 1-2 sentences only.",
      medium: "Respond with exactly one paragraph.",
      long: "Respond with multiple paragraphs, providing detailed information."
    };

    const toneInstructions = {
      professional: "Write in a professional, formal tone suitable for business contexts.",
      casual: "Write in a casual, conversational tone as if talking to a friend.",
      creative: "Write in a creative, imaginative tone with vivid descriptions and artistic flair.",
      academic: "Write in an academic, scholarly tone with formal language and structured arguments."
    };

    const systemPrompt = `You are an AI writing assistant. ${toneInstructions[tone as keyof typeof toneInstructions]} ${lengthInstructions[length as keyof typeof lengthInstructions]}`;

    try {
      const completion = await this.client.chat.completions.create({
        model: this.settings.modelId,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt }
        ],
        max_tokens: length === "short" ? 100 : length === "medium" ? 300 : 1000,
        temperature: 0.7,
      });

      return completion.choices[0]?.message?.content || "Unable to generate text. Please try again.";
    } catch (error) {
      console.error("LLM API Error:", error);
      throw new Error("Failed to generate text. Please check your API settings and try again.");
    }
  }

  public async editText(text: string, instruction: string): Promise<string> {
    if (!this.client || !this.settings) {
      throw new Error("LLM service not configured");
    }

    try {
      console.log("Starting edit with:", { text, instruction });

      let specificPrompt = "";
      switch (instruction) {
        case "Improve clarity and readability":
          specificPrompt = "Rewrite this text to make it clearer and easier to understand. Use simpler words and better sentence structure while maintaining the original meaning.";
          break;
        case "Fix grammar and spelling errors":
          specificPrompt = "Correct all grammar, spelling, and punctuation errors in this text. Keep the original meaning and style intact.";
          break;
        case "Make the text more concise and to the point":
          specificPrompt = "Rewrite this text to be more concise and direct. Remove unnecessary words and phrases while preserving the essential meaning. Make it shorter but keep the main points.";
          break;
        case "Expand on the ideas and add more detail":
          specificPrompt = "Expand this text by adding more details, examples, and explanations. Elaborate on the key ideas while maintaining coherence.";
          break;
        default:
          specificPrompt = instruction;
      }

      const completion = await this.client.chat.completions.create({
        model: this.settings.modelId,
        messages: [
          {
            role: "system",
            content: "You are an AI writing assistant. Edit the provided text according to the instructions. Return only the edited text without explanations or commentary."
          },
          { role: "user", content: `Text: "${text}"\n\nTask: ${specificPrompt}` }
        ],
        max_tokens: 1500,
        temperature: 0.3,
      });

      const result = completion.choices[0]?.message?.content;
      console.log("Raw API response:", completion);
      console.log("Extracted result:", result);

      if (!result || result.trim() === "") {
        console.log("No result received from API or result is empty");
        return "Unable to edit text. Please try again.";
      }

      const cleanedResult = result.trim();
      console.log("Cleaned result:", cleanedResult);

      const finalResult = cleanedResult.replace(/^["']|["']$/g, '');
      console.log("Final result:", finalResult);

      const isActualError = finalResult.toLowerCase() === "unable to edit text. please try again." ||
                           finalResult.toLowerCase() === "i'm unable to edit text. please try again." ||
                           finalResult.toLowerCase() === "i cannot edit text. please try again." ||
                           finalResult.toLowerCase().startsWith("i'm unable to") ||
                           finalResult.toLowerCase().startsWith("i cannot") ||
                           finalResult.toLowerCase().startsWith("i'm sorry") ||
                           finalResult.toLowerCase().startsWith("sorry");

      if (isActualError) {
        console.log("Detected actual error response, trying simpler approach");

        const fallbackCompletion = await this.client.chat.completions.create({
          model: this.settings.modelId,
          messages: [
            {
              role: "system",
              content: "You are an AI writing assistant. Edit the text according to the instruction. Return only the edited text."
            },
            { role: "user", content: `Original text: "${text}"\n\nInstruction: ${specificPrompt}` }
          ],
          max_tokens: 1000,
          temperature: 0.3,
        });

        const fallbackResult = fallbackCompletion.choices[0]?.message?.content;
        console.log("Fallback result:", fallbackResult);

        if (fallbackResult && fallbackResult.trim() !== "") {
          const cleanedFallback = fallbackResult.trim().replace(/^["']|["']$/g, '');
          if (!cleanedFallback.toLowerCase().startsWith("i'm unable") &&
              !cleanedFallback.toLowerCase().startsWith("i cannot") &&
              !cleanedFallback.toLowerCase().startsWith("i'm sorry") &&
              !cleanedFallback.toLowerCase().startsWith("sorry")) {
            return cleanedFallback;
          }
        }

        return "Unable to edit text. Please try again.";
      }

      return finalResult;
    } catch (error) {
      console.error("LLM API Error in editText:", error);
      throw new Error("Failed to edit text. Please check your API settings and try again.");
    }
  }

  public async summarizeText(text: string): Promise<string> {
    if (!this.client || !this.settings) {
      throw new Error("LLM service not configured");
    }

    try {
      const completion = await this.client.chat.completions.create({
        model: this.settings.modelId,
        messages: [
          {
            role: "system",
            content: "You are an AI writing assistant. Summarize the provided text in a concise and clear manner. Extract the key points and main ideas."
          },
          { role: "user", content: `Text to summarize: "${text}"` }
        ],
        max_tokens: 300,
        temperature: 0.3,
      });

      return completion.choices[0]?.message?.content || "Unable to summarize text. Please try again.";
    } catch (error) {
      console.error("LLM API Error:", error);
      throw new Error("Failed to summarize text. Please check your API settings and try again.");
    }
  }
}

export const llmService = new LLMService();
