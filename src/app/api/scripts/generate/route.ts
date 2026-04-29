import { NextRequest, NextResponse } from 'next/server';
import { execSync } from 'child_process';
import { writeFileSync, readFileSync, unlinkSync, mkdtempSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { db } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { buildScriptPrompt } from '@/app/api/ideas/generate/prompt';

// ============================================
// DUAL MODE: z-ai CLI (sandbox) or Groq API (EC2/Docker)
// ============================================

function callZaiCli(prompt: string): string {
  const tmpDir = mkdtempSync(join(tmpdir(), 'vf-script-'));
  const promptFile = join(tmpDir, 'prompt.txt');
  const outputFile = join(tmpDir, 'output.json');
  writeFileSync(promptFile, prompt, 'utf-8');

  try {
    execSync(`z-ai chat --prompt "$(cat '${promptFile}')" --output '${outputFile}'`, {
      encoding: 'utf-8',
      timeout: 90000,
      maxBuffer: 2 * 1024 * 1024,
      shell: '/bin/bash',
      stdio: 'pipe',
    });

    const output = readFileSync(outputFile, 'utf-8');
    const parsed = JSON.parse(output.trim());
    const content = parsed.choices?.[0]?.message?.content;
    if (content) return content.trim();
    return output.trim();
  } catch (error) {
    console.error('z-ai CLI error:', error);
    throw error;
  } finally {
    try { unlinkSync(promptFile); } catch {}
    try { unlinkSync(outputFile); } catch {}
  }
}

async function callGroqApi(prompt: string): Promise<string> {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.AI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8,
      max_tokens: 4096,
      response_format: { type: 'json_object' },
    }),
  });
  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

// ============================================
// JSON Extraction Helper
// ============================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractScriptJson(text: string): any | null {
  try {
    return JSON.parse(text);
  } catch {}

  const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (match) {
    try {
      return JSON.parse(match[1]);
    } catch {}
  }

  const objMatch = text.match(/\{[\s\S]*\}/);
  if (objMatch) {
    try {
      return JSON.parse(objMatch[0]);
    } catch {}
  }

  return null;
}

// ============================================
// POST Handler
// ============================================

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse body
    const body = await request.json();
    const { ideaId, language = 'en' } = body;

    if (!ideaId) {
      return NextResponse.json(
        { error: 'Idea ID is required' },
        { status: 400 }
      );
    }

    // Fetch the idea and verify ownership
    const idea = await db.viralIdea.findUnique({ where: { id: ideaId } });
    if (!idea) {
      return NextResponse.json(
        { error: 'Idea not found' },
        { status: 404 }
      );
    }

    if (idea.userId !== user.userId) {
      return NextResponse.json(
        { error: 'You do not own this idea' },
        { status: 403 }
      );
    }

    // Check credits
    const dbUser = await db.user.findUnique({ where: { id: user.userId } });
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (dbUser.credits < 5) {
      return NextResponse.json(
        { error: 'Insufficient credits. 5 credits required for script generation.' },
        { status: 403 }
      );
    }

    // Deduct credits
    await db.user.update({
      where: { id: user.userId },
      data: { credits: dbUser.credits - 5 },
    });

    // Build prompt
    const prompt = buildScriptPrompt(
      { title: idea.title, hook: idea.hook, niche: idea.niche },
      language
    );

    // Call LLM — dual mode
    let rawText: string;
    if (process.env.AI_API_KEY) {
      rawText = await callGroqApi(prompt);
    } else {
      rawText = callZaiCli(prompt);
    }

    // Extract JSON
    const scriptData = extractScriptJson(rawText);

    if (!scriptData || !scriptData.scenes) {
      // Refund credits on failure
      await db.user.update({
        where: { id: user.userId },
        data: { credits: dbUser.credits },
      });
      return NextResponse.json(
        { error: 'Failed to generate script. Please try again.' },
        { status: 500 }
      );
    }

    // Save script to database
    const script = await db.script.create({
      data: {
        ideaId: idea.id,
        userId: user.userId,
        content: scriptData,
        language,
      },
    });

    // Get updated credits
    const updatedUser = await db.user.findUnique({ where: { id: user.userId } });

    return NextResponse.json({
      script,
      creditsRemaining: updatedUser?.credits ?? 0,
    }, { status: 201 });
  } catch (error) {
    console.error('Script generation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
