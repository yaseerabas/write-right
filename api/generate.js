import { client, modelId, getBody, json } from './_lib/client.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return json(res, 405, { error: 'Method not allowed' });
  }

  try {
    const { prompt, tone, length } = await getBody(req);

    if (!prompt || typeof prompt !== 'string') {
      return json(res, 400, { error: 'Prompt is required' });
    }

    const lengthInstructions = {
      short: 'Respond with 1-2 sentences only.',
      medium: 'Respond with exactly one paragraph.',
      long: 'Respond with multiple paragraphs, providing detailed information.',
    };

    const toneInstructions = {
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
    json(res, 200, { result });
  } catch (error) {
    console.error('Generate API Error:', error);
    json(res, 500, {
      error: error instanceof Error ? error.message : 'Failed to generate text',
    });
  }
}
