import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';
import ZAI from 'z-ai-web-dev-sdk';

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.success) return auth.response;

    const body = await request.json();
    const { ideaTitle, hook, contentAngle, targetEmotion, style = 'storytelling', tone = 'serious', projectId } = body;

    if (!ideaTitle || !hook || !contentAngle) {
      return NextResponse.json(
        { error: 'ideaTitle, hook, and contentAngle are required.' },
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

    // Generate script using LLM
    const zai = await ZAI.create();

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are an expert scriptwriter for viral faceless social media videos. You write scripts optimized for short-form content (30-90 seconds) on TikTok, YouTube Shorts, and Instagram Reels.

You write scripts that:
- Hook viewers in the first 3 seconds
- Maintain engagement throughout
- End with a strong call-to-action
- Don't require the creator to show their face
- Use voiceover-friendly language
- Include visual/audio cues in brackets

You must respond with valid JSON containing these fields:
- "hook": The first 0-3 seconds opening (the hook line spoken aloud)
- "mainContent": The body of the script (spoken content with [visual cue] brackets)
- "cta": The call-to-action closing line
- "fullScript": The complete script combining hook + main content + cta as a single flowing script
- "duration": Estimated duration range like "30-45" or "60-90"

Write in ${style} style with a ${tone} tone. Target emotion: ${targetEmotion || 'curiosity'}.

Respond ONLY with valid JSON, no markdown or extra text.`
        },
        {
          role: 'user',
          content: `Write a viral faceless video script based on:
- Title: "${ideaTitle}"
- Hook concept: "${hook}"
- Content angle: "${contentAngle}"
- Target emotion: ${targetEmotion || 'curiosity'}
- Style: ${style}
- Tone: ${tone}

Return the script as JSON.`
        }
      ],
      thinking: { type: 'disabled' }
    });

    const rawContent = completion.choices[0]?.message?.content || '{}';
    let scriptData;
    try {
      const cleaned = rawContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      scriptData = JSON.parse(cleaned);
    } catch {
      scriptData = {
        hook: hook,
        mainContent: contentAngle,
        cta: 'Follow for more!',
        fullScript: `${hook} ${contentAngle} Follow for more!`,
        duration: '30-60',
      };
    }

    // Find or create project
    let targetProjectId = projectId;
    if (!targetProjectId) {
      const project = await db.project.create({
        data: {
          userId: auth.payload.userId,
          title: ideaTitle,
          status: 'generating',
          creditsUsed: 1,
        },
      });
      targetProjectId = project.id;
    }

    // Save script to database
    const script = await db.script.create({
      data: {
        projectId: targetProjectId,
        title: ideaTitle,
        hook: scriptData.hook || hook,
        mainContent: scriptData.mainContent || contentAngle,
        cta: scriptData.cta || 'Follow for more!',
        style,
        tone,
        duration: scriptData.duration || '30-60',
        fullScript: scriptData.fullScript || `${hook} ${contentAngle}`,
      },
    });

    // Update project status
    await db.project.update({
      where: { id: targetProjectId },
      data: {
        status: 'completed',
        creditsUsed: { increment: 1 },
      },
    });

    // Deduct credit
    await db.user.update({
      where: { id: auth.payload.userId },
      data: { credits: { decrement: 1 } },
    });

    return NextResponse.json({
      message: 'Script generated successfully.',
      script,
      projectId: targetProjectId,
      remainingCredits: user.credits - 1,
    });
  } catch (error: unknown) {
    console.error('Script generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate script. Please try again.' },
      { status: 500 }
    );
  }
}
