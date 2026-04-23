import ZAI from 'z-ai-web-dev-sdk';

// AI Proxy URL - points to sandbox's AI proxy endpoint
// In production (EC2), this should be set via AI_PROXY_URL env var
// In sandbox development, z-ai-web-dev-sdk is used directly
const AI_PROXY_URL = process.env.AI_PROXY_URL || '';
const AI_PROXY_KEY = process.env.AI_PROXY_KEY || 'viralfaceless-ai-proxy-2024';

interface Message {
  role: string;
  content: string;
}

export async function aiChatCompletion(messages: Message[]): Promise<string> {
  if (AI_PROXY_URL) {
    // Use proxy (production on EC2)
    const response = await fetch(AI_PROXY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AI_PROXY_KEY}`,
      },
      body: JSON.stringify({ messages }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Proxy request failed' }));
      throw new Error(error.error || `AI Proxy error: ${response.status}`);
    }

    const data = await response.json();
    return data.content || '';
  } else {
    // Use z-ai-web-dev-sdk directly (sandbox)
    const zai = await ZAI.create();
    const completion = await zai.chat.completions.create({
      messages: messages as Array<{ role: string; content: string }>,
      thinking: { type: 'disabled' },
    });
    return completion.choices[0]?.message?.content || '';
  }
}
