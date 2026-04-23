import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';
import ZAI from 'z-ai-web-dev-sdk';

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.success) return auth.response;

    const body = await request.json();
    const { niche, count = 5, makeMoreExtreme = false } = body;

    if (!niche) {
      return NextResponse.json(
        { error: 'Niche is required.' },
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

    // Generate ideas using LLM
    const zai = await ZAI.create();
    const extremeModifier = makeMoreExtreme
      ? ' Make these ideas MORE extreme, controversial, and attention-grabbing. Push boundaries to maximize virality.'
      : '';

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are an expert viral content strategist specializing in faceless social media content. You create ideas that are designed to go viral on platforms like TikTok, YouTube Shorts, and Instagram Reels.

You must respond with a valid JSON array of content ideas. Each idea must have exactly these fields:
- "title": A catchy, clickbait-style title for the video
- "hook": The first 3 seconds opening line that grabs attention immediately
- "contentAngle": A detailed description of the content angle and what makes it unique
- "targetEmotion": The primary emotion to trigger (e.g., shock, curiosity, fear, inspiration, anger, awe)
- "viralScore": An estimated viral potential score from 0 to 100

Generate ideas that:
- Don't require showing a face
- Use stock footage, animations, text overlays, or AI-generated visuals
- Have high shareability potential
- Target the given niche specifically${extremeModifier}

Respond ONLY with the JSON array, no additional text or markdown formatting.`
        },
        {
          role: 'user',
          content: `Generate ${count} viral faceless content ideas for the niche: "${niche}". Return a JSON array.`
        }
      ],
      thinking: { type: 'disabled' }
    });

    const rawContent = completion.choices[0]?.message?.content || '[]';
    // Parse JSON - handle potential markdown wrapping
    let ideasData;
    try {
      const cleaned = rawContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      ideasData = JSON.parse(cleaned);
    } catch {
      ideasData = [];
    }

    // Create project
    const project = await db.project.create({
      data: {
        userId: auth.payload.userId,
        title: `${niche} - Viral Ideas`,
        niche,
        status: 'generating',
        creditsUsed: 1,
      },
    });

    // Save ideas to database
    const savedIdeas = await Promise.all(
      ideasData.map((idea: {
        title: string;
        hook: string;
        contentAngle: string;
        targetEmotion: string;
        viralScore: number;
      }) =>
        db.idea.create({
          data: {
            projectId: project.id,
            title: idea.title,
            hook: idea.hook,
            contentAngle: idea.contentAngle,
            targetEmotion: idea.targetEmotion,
            viralScore: Math.min(100, Math.max(0, Number(idea.viralScore) || 0)),
            niche,
            isSelected: false,
          },
        })
      )
    );

    // Update project status
    await db.project.update({
      where: { id: project.id },
      data: { status: 'completed' },
    });

    // Deduct credit
    await db.user.update({
      where: { id: auth.payload.userId },
      data: { credits: { decrement: 1 } },
    });

    return NextResponse.json({
      message: `${savedIdeas.length} ideas generated successfully.`,
      projectId: project.id,
      ideas: savedIdeas,
      remainingCredits: user.credits - 1,
    });
  } catch (error: unknown) {
    console.error('Idea generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate ideas. Please try again.' },
      { status: 500 }
    );
  }
}
