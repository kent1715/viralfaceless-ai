import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';
import ZAI from 'z-ai-web-dev-sdk';

const SUPPORTED_THUMBNAIL_SIZES = [
  '1024x1024',
  '768x1344',
  '864x1152',
  '1344x768',
  '1152x864',
  '1440x720',
  '720x1440',
];

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.success) return auth.response;

    const body = await request.json();
    const { prompt, style = 'clickbait' } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required.' },
        { status: 400 }
      );
    }

    // Check credits
    const user = await db.user.findUnique({ where: { id: auth.payload.userId } });
    if (!user || user.credits < 1) {
      return NextResponse.json(
        { error: 'Insufficient credits. Please purchase more credits.' },
        { status: 402 }
      );
    }

    const zai = await ZAI.create();

    // Enhance prompt based on style
    const stylePrompts: Record<string, string> = {
      clickbait: 'vibrant, bold colors, eye-catching, high contrast, dramatic lighting, attention-grabbing thumbnail style, professional YouTube thumbnail quality',
      clean: 'minimalist, clean design, professional, modern, simple composition, whitespace, elegant typography style',
      minimal: 'minimal, subtle, understated, soft colors, clean lines, modern aesthetic, professional quality',
    };

    const styleHint = stylePrompts[style] || stylePrompts.clickbait;
    const enhancedPrompt = `${prompt}, ${styleHint}, high quality, 4K, detailed`;

    // Use 1152x864 for thumbnails (16:10 ratio, great for YouTube)
    const size = '1152x864';

    const response = await zai.images.generations.create({
      prompt: enhancedPrompt,
      size,
    });

    const base64 = response.data[0]?.base64;
    if (!base64) {
      return NextResponse.json(
        { error: 'Failed to generate image. No image data returned.' },
        { status: 500 }
      );
    }

    // Deduct credit
    await db.user.update({
      where: { id: auth.payload.userId },
      data: { credits: { decrement: 1 } },
    });

    return NextResponse.json({
      message: 'Thumbnail generated successfully.',
      image: {
        base64,
        size,
        style,
        prompt: enhancedPrompt,
      },
      creditsRemaining: user.credits - 1,
    });
  } catch (error: unknown) {
    console.error('Thumbnail generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate thumbnail. Please try again.' },
      { status: 500 }
    );
  }
}
