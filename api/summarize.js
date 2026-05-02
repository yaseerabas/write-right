import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.LLM_API_KEY || '',
  baseURL: process.env.LLM_BASE_URL || 'https://api.openai.com/v1',
});

const modelId = process.env.LLM_MODEL_ID || 'gpt-3.5-turbo';

async function getBody(req) {
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

function json(res, status, data) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return json(res, 405, { error: 'Method not allowed' });
  }

  try {
    const { text } = await getBody(req);

    if (!text || typeof text !== 'string') {
      return json(res, 400, { error: 'Text is required' });
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
    json(res, 200, { result });
  } catch (error) {
    console.error('Summarize API Error:', error);
    json(res, 500, {
      error: error instanceof Error ? error.message : 'Failed to summarize text',
    });
  }
}
