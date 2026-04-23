import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

// AI Proxy endpoint - allows EC2/external servers to use the sandbox's AI SDK
export async function POST(request: NextRequest) {
  try {
    // Simple API key auth for proxy
    const authHeader = request.headers.get('authorization');
    const proxyKey = process.env.AI_PROXY_KEY || 'viralfaceless-ai-proxy-2024';

    if (!authHeader || authHeader !== `Bearer ${proxyKey}`) {
      return NextResponse.json(
        { error: 'Invalid proxy key.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required.' },
        { status: 400 }
      );
    }

    const zai = await ZAI.create();
    const completion = await zai.chat.completions.create({
      messages,
      thinking: { type: 'disabled' }
    });

    const content = completion.choices[0]?.message?.content || '';
    return NextResponse.json({ content });
  } catch (error: unknown) {
    console.error('AI Proxy error:', error);
    return NextResponse.json(
      { error: 'AI proxy request failed.' },
      { status: 500 }
    );
  }
}
