import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';
import { aiChatCompletion } from '@/lib/ai';

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.success) return auth.response;

    const body = await request.json();
    const { script, style = 'cinematic', projectId } = body;

    if (!script) {
      return NextResponse.json(
        { error: 'Script is required.' },
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

    // Generate video production plan using AI
    const rawContent = await aiChatCompletion([
      {
        role: 'system',
        content: `You are an expert video producer specializing in faceless social media content. You create detailed production plans for short-form videos (TikTok, YouTube Shorts, Instagram Reels).

Given a script, you create a comprehensive video production plan that includes:
- Subtitle segments (text to display on screen with timing)
- B-roll/stock footage suggestions for each segment
- Zoom and cut points for dynamic editing
- Keyword highlights (words to emphasize visually)
- Background music style recommendations
- Color grading/mood suggestions

You must respond with valid JSON containing:
- "subtitleSegments": Array of objects with "text", "startTime", "endTime" fields
- "brollSuggestions": Array of objects with "description", "timestamp", "searchKeywords" fields
- "editPoints": Array of objects with "time", "type" (zoom-in, zoom-out, cut, transition), "duration" fields
- "keywordHighlights": Array of objects with "word", "timestamp", "style" (bold, glow, pop) fields
- "musicStyle": String describing recommended background music style
- "colorMood": String describing color grading/mood
- "estimatedDuration": Estimated total duration in seconds
- "aspectRatio": Recommended aspect ratio ("9:16" for vertical, "16:9" for horizontal)

Respond ONLY with valid JSON, no markdown or extra text.`
      },
      {
        role: 'user',
        content: `Create a video production plan for this faceless video script:

"${script}"

Style: ${style}

Return the production plan as JSON.`
      }
    ]);

    let videoPlan;
    try {
      const cleaned = rawContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      videoPlan = JSON.parse(cleaned);
    } catch {
      videoPlan = {
        subtitleSegments: [],
        brollSuggestions: [],
        editPoints: [],
        keywordHighlights: [],
        musicStyle: 'ambient',
        colorMood: 'natural',
        estimatedDuration: 30,
        aspectRatio: '9:16',
      };
    }

    // Save video record to database
    let targetProjectId = projectId;
    if (!targetProjectId) {
      const project = await db.project.create({
        data: {
          userId: auth.payload.userId,
          title: 'Video Project',
          status: 'generating',
          creditsUsed: 1,
        },
      });
      targetProjectId = project.id;
    }

    const video = await db.video.create({
      data: {
        projectId: targetProjectId,
        status: 'pending',
        format: 'short',
      },
    });

    // Update project
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
      message: 'Video production plan generated successfully.',
      video: {
        id: video.id,
        ...videoPlan,
      },
      projectId: targetProjectId,
      remainingCredits: user.credits - 1,
    });
  } catch (error: unknown) {
    console.error('Video generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate video plan. Please try again.' },
      { status: 500 }
    );
  }
}
