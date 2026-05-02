import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Initialize OpenAI client
const client = new OpenAI({
  apiKey: process.env.LLM_API_KEY || '',
  baseURL: process.env.LLM_BASE_URL || 'https://api.openai.com/v1',
});

const modelId = process.env.LLM_MODEL_ID || 'gpt-3.5-turbo';

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    configured: !!(process.env.LLM_API_KEY && process.env.LLM_BASE_URL),
    provider: process.env.LLM_PROVIDER || 'openai',
    model: modelId,
  });
});

// Generate text endpoint
app.post('/generate', async (req: Request, res: Response) => {
  try {
    const { prompt, tone, length } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const lengthInstructions: Record<string, string> = {
      short: 'Respond with 1-2 sentences only.',
      medium: 'Respond with exactly one paragraph.',
      long: 'Respond with multiple paragraphs, providing detailed information.',
    };

    const toneInstructions: Record<string, string> = {
      professional: 'Write in a professional, formal tone suitable for business contexts.',
      casual: 'Write in a casual, conversational tone as if talking to a friend.',
      creative: 'Write in a creative, imaginative tone with vivid descriptions and artistic flair.',
      academic: 'Write in an academic, scholarly tone with formal language and structured arguments.',
    };

    const systemPrompt = `You are an AI writing assistant. ${toneInstructions[tone] || toneInstructions.professional} ${lengthInstructions[length] || lengthInstructions.medium}`;

    const completion = await client.chat.completions.create({
      model: modelId,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      max_tokens: length === 'short' ? 100 : length === 'medium' ? 300 : 1000,
      temperature: 0.7,
    });

    const result = completion.choices[0]?.message?.content || 'Unable to generate text. Please try again.';
    res.json({ result });
  } catch (error) {
    console.error('Generate API Error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to generate text',
    });
  }
});

// Edit text endpoint
app.post('/edit', async (req: Request, res: Response) => {
  try {
    const { text, instruction } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required' });
    }

    if (!instruction || typeof instruction !== 'string') {
      return res.status(400).json({ error: 'Instruction is required' });
    }

    let specificPrompt = instruction;

    const instructionMap: Record<string, string> = {
      'Improve clarity and readability':
        'Rewrite this text to make it clearer and easier to understand. Use simpler words and better sentence structure while maintaining the original meaning.',
      'Fix grammar and spelling errors':
        'Correct all grammar, spelling, and punctuation errors in this text. Keep the original meaning and style intact.',
      'Make the text more concise and to the point':
        'Rewrite this text to be more concise and direct. Remove unnecessary words and phrases while preserving the essential meaning. Make it shorter but keep the main points.',
      'Expand on the ideas and add more detail':
        'Expand this text by adding more details, examples, and explanations. Elaborate on the key ideas while maintaining coherence.',
    };

    if (instructionMap[instruction]) {
      specificPrompt = instructionMap[instruction];
    }

    const completion = await client.chat.completions.create({
      model: modelId,
      messages: [
        {
          role: 'system',
          content:
            'You are an AI writing assistant. Edit the provided text according to the instructions. Return only the edited text without explanations or commentary.',
        },
        { role: 'user', content: `Text: "${text}"\n\nTask: ${specificPrompt}` },
      ],
      max_tokens: 1500,
      temperature: 0.3,
    });

    const result = completion.choices[0]?.message?.content?.trim() || '';

    if (!result) {
      return res.status(500).json({ error: 'Unable to edit text. Please try again.' });
    }

    res.json({ result: result.replace(/^["']|["']$/g, '') });
  } catch (error) {
    console.error('Edit API Error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to edit text',
    });
  }
});

// Summarize text endpoint
app.post('/summarize', async (req: Request, res: Response) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required' });
    }

    const completion = await client.chat.completions.create({
      model: modelId,
      messages: [
        {
          role: 'system',
          content:
            'You are an AI writing assistant. Summarize the provided text in a concise and clear manner. Extract the key points and main ideas.',
        },
        { role: 'user', content: `Text to summarize: "${text}"` },
      ],
      max_tokens: 300,
      temperature: 0.3,
    });

    const result = completion.choices[0]?.message?.content || 'Unable to summarize text. Please try again.';
    res.json({ result });
  } catch (error) {
    console.error('Summarize API Error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to summarize text',
    });
  }
});

// Global error handler — catch anything that slips through
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
  });
});

export default app;
