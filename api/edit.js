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
    const { text, instruction } = await getBody(req);

    if (!text || typeof text !== 'string') {
      return json(res, 400, { error: 'Text is required' });
    }

    if (!instruction || typeof instruction !== 'string') {
      return json(res, 400, { error: 'Instruction is required' });
    }

    let specificPrompt = instruction;

    const instructionMap = {
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
      return json(res, 500, { error: 'Unable to edit text. Please try again.' });
    }

    json(res, 200, { result: result.replace(/^["']|["']$/g, '') });
  } catch (error) {
    console.error('Edit API Error:', error);
    json(res, 500, {
      error: error instanceof Error ? error.message : 'Failed to edit text',
    });
  }
}
