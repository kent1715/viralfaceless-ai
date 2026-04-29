import { NextRequest, NextResponse } from 'next/server';
import { execSync } from 'child_process';
import { writeFileSync, readFileSync, unlinkSync, mkdtempSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { db } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { buildIdeaPrompt } from './prompt';

// ============================================
// DUAL MODE: z-ai CLI (sandbox) or Groq API (EC2/Docker)
// ============================================

function callZaiCli(prompt: string): string {
  const tmpDir = mkdtempSync(join(tmpdir(), 'vf-idea-'));
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
function extractJson(text: string): any[] {
  // Try direct parse first
  try {
    const p = JSON.parse(text);
    return Array.isArray(p) ? p : p.ideas || [p];
  } catch {}

  // Try extracting from markdown code block
  const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (match) {
    try {
      const p = JSON.parse(match[1]);
      return Array.isArray(p) ? p : p.ideas || [p];
    } catch {}
  }

  // Try finding JSON array in text
  const arrMatch = text.match(/\[[\s\S]*\]/);
  if (arrMatch) {
    try {
      return JSON.parse(arrMatch[0]);
    } catch {}
  }

  return [];
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
    const { niche, language = 'en' } = body;

    if (!niche) {
      return NextResponse.json(
        { error: 'Niche is required' },
        { status: 400 }
      );
    }

    // Check credits
    const dbUser = await db.user.findUnique({ where: { id: user.userId } });
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (dbUser.credits < 3) {
      return NextResponse.json(
        { error: 'Insufficient credits. 3 credits required.' },
        { status: 403 }
      );
    }

    // Deduct credits
    await db.user.update({
      where: { id: user.userId },
      data: { credits: dbUser.credits - 3 },
    });

    // Build prompt
    const prompt = buildIdeaPrompt(niche, language);

    // Call LLM — dual mode
    let rawText: string;
    if (process.env.AI_API_KEY) {
      const wrappedPrompt = `Respond with a JSON object that has an "ideas" array.\n\n${prompt}`;
      rawText = await callGroqApi(wrappedPrompt);
    } else {
      rawText = callZaiCli(prompt);
    }

    // Extract JSON
    const ideas = extractJson(rawText);

    if (!ideas || ideas.length === 0) {
      // Refund credits on failure
      await db.user.update({
        where: { id: user.userId },
        data: { credits: dbUser.credits },
      });
      return NextResponse.json(
        { error: 'Failed to generate ideas. Please try again.' },
        { status: 500 }
      );
    }

    // ============================================
    // EXPLICIT FIELD MAPPING — LOCKED SCHEMA
    // ============================================
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mapped = ideas.map((raw: any) => ({
      niche,
      title: String(raw.title || ''),
      hook: String(raw.hook || ''),
      emotionalTrigger: Array.isArray(raw.emotionalTrigger) ? raw.emotionalTrigger : [],
      viralityScore: Math.min(100, Math.max(0, Number(raw.viralityScore) || 0)),
      curiosityScore: Math.min(100, Math.max(0, Number(raw.curiosityScore) || 0)),
      reason: String(raw.reason || ''),
      language,
      userId: user.userId,
    }));

    // Save to database
    await db.viralIdea.createMany({ data: mapped });

    // Get updated credits
    const updatedUser = await db.user.findUnique({ where: { id: user.userId } });

    return NextResponse.json({
      ideas: mapped,
      creditsRemaining: updatedUser?.credits ?? 0,
    }, { status: 200 });
  } catch (error) {
    console.error('Idea generation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
