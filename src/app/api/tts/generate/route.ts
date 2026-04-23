import { NextRequest, NextResponse } from 'next/server';
import { execFile } from 'child_process';
import { writeFile, unlink, mkdtemp } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { promisify } from 'util';
import { authenticateRequest } from '@/lib/auth';
import { db } from '@/lib/db';

const execFileAsync = promisify(execFile);

// Edge-TTS voice mapping
const VOICE_MAP: Record<string, { voice: string; lang: string }> = {
  gadis: { voice: 'id-ID-GadisNeural', lang: '🇮🇩' },
  ardi: { voice: 'id-ID-ArdiNeural', lang: '🇮🇩' },
  jenny: { voice: 'en-US-JennyNeural', lang: '🇺🇸' },
  guy: { voice: 'en-US-GuyNeural', lang: '🇺🇸' },
  aria: { voice: 'en-US-AriaNeural', lang: '🇺🇸' },
  davis: { voice: 'en-US-DavisNeural', lang: '🇺🇸' },
  sonia: { voice: 'en-GB-SoniaNeural', lang: '🇬🇧' },
  ryan: { voice: 'en-GB-RyanNeural', lang: '🇬🇧' },
};

const DEFAULT_VOICE = 'id-ID-GadisNeural';

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.success) return auth.response;

    const body = await request.json();
    const { text, voice = 'gadis', speed = 1.0 } = body;

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'Text is required.' },
        { status: 400 }
      );
    }

    // Map voice name to edge-tts voice
    const voiceConfig = VOICE_MAP[voice] || VOICE_MAP.gadis;
    const voiceName = voiceConfig.voice;

    // Clamp speed
    const clampedSpeed = Math.min(2.0, Math.max(0.5, Number(speed) || 1.0));
    // Edge-TTS uses percentage: +0% = normal, +50% = 1.5x, -50% = 0.5x
    const rateStr = `+${Math.round((clampedSpeed - 1) * 100)}%`;

    // Create temp directory and output file
    const tmpDir = await mkdtemp(join(tmpdir(), 'tts-'));
    const outputFile = join(tmpDir, 'output.mp3');

    try {
      // Call Python edge-tts CLI
      await execFileAsync('edge-tts', [
        '--voice', voiceName,
        '--rate', rateStr,
        '--text', text.trim(),
        '--write-media', outputFile,
      ], {
        timeout: 60000, // 60 second timeout for TTS generation
      });

      // Read the generated MP3 file
      const { readFile } = await import('fs/promises');
      const audioBuffer = await readFile(outputFile);

      // Return audio as binary response
      return new NextResponse(new Uint8Array(audioBuffer), {
        status: 200,
        headers: {
          'Content-Type': 'audio/mpeg',
          'Content-Length': audioBuffer.length.toString(),
          'Cache-Control': 'no-cache',
          'X-Voice-Used': voice,
          'X-Voice-Display': voiceName,
        },
      });
    } finally {
      // Cleanup temp files
      try {
        const { unlink } = await import('fs/promises');
        await unlink(outputFile);
        const { rmdir } = await import('fs/promises');
        await rmdir(tmpDir);
      } catch {
        // Ignore cleanup errors
      }
    }
  } catch (error: unknown) {
    console.error('TTS generation error:', error);
    const errMsg = error instanceof Error ? error.message : String(error);

    if (errMsg.includes('ENOENT') || errMsg.includes('edge-tts')) {
      return NextResponse.json(
        { error: 'TTS engine not available. Please contact support.' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to generate speech. Please try again.' },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  try {
    const { execFile } = await import('child_process');
    const { promisify } = await import('util');
    const execFileAsync = promisify(execFile);

    await execFileAsync('edge-tts', ['--list-voices'], { timeout: 10000 });

    return NextResponse.json({
      status: 'healthy',
      engine: 'edge-tts (Microsoft Edge Neural TTS)',
      voices: Object.entries(VOICE_MAP).map(([key, val]) => ({
        id: key,
        voice: val.voice,
        lang: val.lang,
      })),
    });
  } catch {
    return NextResponse.json(
      { status: 'unhealthy', error: 'edge-tts not available' },
      { status: 503 }
    );
  }
}
