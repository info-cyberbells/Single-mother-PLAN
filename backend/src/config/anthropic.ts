import { env } from './env';

interface ClaudeMessageResponse {
  content: Array<{ text: string }>;
}

export const callClaudeApi = async (systemPrompt: string, userPrompt: string): Promise<string> => {
  const isPlaceholder = env.ANTHROPIC_API_KEY.includes('placeholder');
  
  if (isPlaceholder) {
    console.log('⚠️ Using mocked Anthropic Claude API due to placeholder key.');
    // Return mock successful match array for testing eligibility scan
    return JSON.stringify([
      {
        programId: 'mock-program-id',
        status: 'qualified',
        confidence_score: 95,
        reasoning: 'Household income and size fall well within standard federal guidelines for this program.',
      }
    ]);
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4000,
      system: systemPrompt,
      messages: [
        { role: 'user', content: userPrompt }
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ Anthropic API Error:', errorText);
    throw new Error(`Anthropic API call failed: ${response.statusText}`);
  }

  const data = (await response.json()) as ClaudeMessageResponse;
  return data.content[0]?.text || '[]';
};
