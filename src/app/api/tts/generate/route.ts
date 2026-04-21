import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';
import ZAI from 'z-ai-web-dev-sdk';

const MAX_TTS_LENGTH = 1024;

function splitTextIntoChunks(text: string, maxLength = 1000): string[] {
  const chunks: string[] = [];
  // Try to split on sentence boundaries
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];

  let currentChunk = '';
  for (const sentence of sentences) {
    if ((currentChunk + sentence).length <= maxLength) {
      currentChunk += sentence;
    } else {
      if (currentChunk) chunks.push(currentChunk.trim());
      // If a single sentence is longer than maxLength, force split
      if (sentence.length > maxLength) {
        let remaining = sentence.trim();
        while (remaining.length > maxLength) {
          chunks.push(remaining.substring(0, maxLength).trim());
          remaining = remaining.substring(maxLength);
        }
        currentChunk = remaining;
      } else {
        currentChunk = sentence;
      }
    }
  }
  if (currentChunk) chunks.push(currentChunk.trim());

  return chunks.length > 0 ? chunks : [text.substring(0, maxLength)];
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.success) return auth.response;

    const body = await request.json();
    const { text, voice = 'tongtong', speed = 1.0 } = body;

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'Text is required.' },
        { status: 400 }
      );
    }

    // Clamp speed
    const clampedSpeed = Math.min(2.0, Math.max(0.5, Number(speed) || 1.0));

    // Check credits
    const user = await db.user.findUnique({ where: { id: auth.payload.userId } });
    if (!user || user.credits < 1) {
      return NextResponse.json(
        { error: 'Insufficient credits. Please purchase more credits.' },
        { status: 402 }
      );
    }

    const zai = await ZAI.create();

    let audioBuffer: Buffer;

    if (text.length <= MAX_TTS_LENGTH) {
      // Single request
      const response = await zai.audio.tts.create({
        input: text.trim(),
        voice,
        speed: clampedSpeed,
        response_format: 'mp3',
        stream: false,
      });

      const arrayBuffer = await response.arrayBuffer();
      audioBuffer = Buffer.from(new Uint8Array(arrayBuffer));
    } else {
      // Split into chunks and concatenate
      const chunks = splitTextIntoChunks(text);
      const buffers: Buffer[] = [];

      for (const chunk of chunks) {
        const response = await zai.audio.tts.create({
          input: chunk,
          voice,
          speed: clampedSpeed,
          response_format: 'mp3',
          stream: false,
        });

        const arrayBuffer = await response.arrayBuffer();
        buffers.push(Buffer.from(new Uint8Array(arrayBuffer)));
      }

      audioBuffer = Buffer.concat(buffers);
    }

    // Deduct credit
    await db.user.update({
      where: { id: auth.payload.userId },
      data: { credits: { decrement: 1 } },
    });

    // Return audio as binary response
    return new NextResponse(new Uint8Array(audioBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.length.toString(),
        'Cache-Control': 'no-cache',
        'X-Credits-Remaining': String(user.credits - 1),
      },
    });
  } catch (error: unknown) {
    console.error('TTS generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate speech. Please try again.' },
      { status: 500 }
    );
  }
}
