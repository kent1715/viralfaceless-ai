import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';
import ZAI from 'z-ai-web-dev-sdk';

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.success) return auth.response;

    const body = await request.json();
    const { title, description, niche, platforms } = body;

    if (!title || !niche) {
      return NextResponse.json(
        { error: 'Title and niche are required.' },
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

    // Generate SEO metadata using LLM
    const zai = await ZAI.create();
    const targetPlatforms = platforms || ['youtube', 'tiktok', 'instagram'];

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'assistant',
          content: `You are an expert SEO specialist and social media strategist. You optimize content titles, descriptions, and hashtags for maximum discoverability and engagement across social media platforms.

You must respond with valid JSON containing these fields:
- "optimizedTitle": A clickbait-optimized title that is also SEO-friendly (include keywords naturally)
- "description": An engaging description optimized for search and engagement (include relevant keywords)
- "hashtags": An object where each key is a platform name and the value is an array of 10-15 relevant hashtags for that platform
- "keywords": An array of 10 relevant SEO keywords related to the content
- "suggestedPostingTimes": An object with platform-specific best posting time suggestions

For hashtags:
- YouTube: Use a mix of broad and niche tags
- TikTok: Use trending + niche hashtags
- Instagram: Use a mix of popular and niche hashtags

Respond ONLY with valid JSON, no markdown or extra text.`
        },
        {
          role: 'user',
          content: `Generate optimized SEO metadata for:
- Title: "${title}"
- Description: "${description || 'Not provided'}"
- Niche: "${niche}"
- Target platforms: ${targetPlatforms.join(', ')}

Return the SEO data as JSON.`
        }
      ],
      thinking: { type: 'disabled' }
    });

    const rawContent = completion.choices[0]?.message?.content || '{}';
    let seoData;
    try {
      const cleaned = rawContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      seoData = JSON.parse(cleaned);
    } catch {
      seoData = {
        optimizedTitle: title,
        description: description || '',
        hashtags: {},
        keywords: [],
        suggestedPostingTimes: {},
      };
    }

    // Deduct credit
    await db.user.update({
      where: { id: auth.payload.userId },
      data: { credits: { decrement: 1 } },
    });

    return NextResponse.json({
      message: 'SEO metadata generated successfully.',
      seo: seoData,
      creditsRemaining: user.credits - 1,
    });
  } catch (error: unknown) {
    console.error('SEO generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate SEO metadata. Please try again.' },
      { status: 500 }
    );
  }
}
