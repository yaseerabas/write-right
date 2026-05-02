export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({
    status: 'ok',
    configured: !!(process.env.LLM_API_KEY && process.env.LLM_BASE_URL),
    provider: process.env.LLM_PROVIDER || 'openai',
    model: process.env.LLM_MODEL_ID || 'gpt-3.5-turbo',
  }));
}
