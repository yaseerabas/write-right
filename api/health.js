import { json } from './_lib/client.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return json(res, 405, { error: 'Method not allowed' });
  }

  json(res, 200, {
    status: 'ok',
    configured: !!(process.env.LLM_API_KEY && process.env.LLM_BASE_URL),
    provider: process.env.LLM_PROVIDER || 'openai',
    model: process.env.LLM_MODEL_ID || 'gpt-3.5-turbo',
  });
}
