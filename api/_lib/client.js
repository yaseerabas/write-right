import OpenAI from 'openai';

// Initialize OpenAI client using environment variables (injected by Vercel)
export const client = new OpenAI({
  apiKey: process.env.LLM_API_KEY || '',
  baseURL: process.env.LLM_BASE_URL || 'https://api.openai.com/v1',
});

export const modelId = process.env.LLM_MODEL_ID || 'gpt-3.5-turbo';

// Helper to parse request body
export async function getBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(JSON.parse(body || '{}'));
      } catch {
        resolve({});
      }
    });
    req.on('error', reject);
  });
}

// Helper to send JSON response
export function json(res, status, data) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}
