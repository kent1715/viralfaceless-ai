import { NextRequest, NextResponse } from 'next/server';
import { execFile } from 'child_process';
import { writeFile, unlink, mkdtemp } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { promisify } from 'util';
import { authenticateRequest } from '@/lib/auth';
import { db } from '@/lib/db';

const execFileAsync = promisify(execFile);

// ─── Edge-TTS Voice Mapping ───────────────────────────────────────
const EDGE_VOICE_MAP: Record<string, { voice: string; lang: string }> = {
  gadis: { voice: 'id-ID-GadisNeural', lang: '🇮🇩' },
  ardi: { voice: 'id-ID-ArdiNeural', lang: '🇮🇩' },
  jenny: { voice: 'en-US-JennyNeural', lang: '🇺🇸' },
  guy: { voice: 'en-US-GuyNeural', lang: '🇺🇸' },
  aria: { voice: 'en-US-AriaNeural', lang: '🇺🇸' },
  davis: { voice: 'en-US-DavisNeural', lang: '🇺🇸' },
  sonia: { voice: 'en-GB-SoniaNeural', lang: '🇬🇧' },
  ryan: { voice: 'en-GB-RyanNeural', lang: '🇬🇧' },
};

// ─── Google Cloud TTS Voice Mapping ───────────────────────────────
const GOOGLE_VOICE_MAP: Record<string, { voice: string; lang: string; gender: string }> = {
  // Indonesian (Neural2)
  'gcp-ind-f1': { voice: 'id-ID-Neural2-A', lang: '🇮🇩', gender: 'Female' },
  'gcp-ind-f2': { voice: 'id-ID-Neural2-C', lang: '🇮🇩', gender: 'Female' },
  'gcp-ind-m1': { voice: 'id-ID-Neural2-B', lang: '🇮🇩', gender: 'Male' },
  'gcp-ind-m2': { voice: 'id-ID-Neural2-D', lang: '🇮🇩', gender: 'Male' },
  // US English (Neural2 / Journey)
  'gcp-us-f1': { voice: 'en-US-Neural2-A', lang: '🇺🇸', gender: 'Female' },
  'gcp-us-f2': { voice: 'en-US-Neural2-C', lang: '🇺🇸', gender: 'Female' },
  'gcp-us-f3': { voice: 'en-US-Neural2-F', lang: '🇺🇸', gender: 'Female' },
  'gcp-us-m1': { voice: 'en-US-Neural2-D', lang: '🇺🇸', gender: 'Male' },
  'gcp-us-m2': { voice: 'en-US-Journey-D', lang: '🇺🇸', gender: 'Male' },
  // British English (Neural2)
  'gcp-gb-f1': { voice: 'en-GB-Neural2-A', lang: '🇬🇧', gender: 'Female' },
  'gcp-gb-f2': { voice: 'en-GB-Neural2-C', lang: '🇬🇧', gender: 'Female' },
  'gcp-gb-m1': { voice: 'en-GB-Neural2-B', lang: '🇬🇧', gender: 'Male' },
  'gcp-gb-m2': { voice: 'en-GB-Neural2-D', lang: '🇬🇧', gender: 'Male' },
};

const DEFAULT_EDGE_VOICE = 'id-ID-GadisNeural';
const GCP_TTS_API_KEY = process.env.GCP_TTS_API_KEY || '';

// ─── Edge-TTS Engine ──────────────────────────────────────────────
async function generateEdgeTTS(
  text: string,
  voiceName: string,
  speed: number
): Promise<Buffer> {
  const tmpDir = await mkdtemp(join(tmpdir(), 'tts-'));
  const outputFile = join(tmpDir, 'output.mp3');

  try {
    const rateStr = `+${Math.round((speed - 1) * 100)}%`;
    await execFileAsync('edge-tts', [
      '--voice', voiceName,
      '--rate', rateStr,
      '--text', text.trim(),
      '--write-media', outputFile,
    ], { timeout: 60000 });

    const { readFile } = await import('fs/promises');
    return await readFile(outputFile);
  } finally {
    try {
      await unlink(outputFile);
      const { rmdir } = await import('fs/promises');
      await rmdir(tmpDir);
    } catch { /* ignore cleanup */ }
  }
}

// ─── Google Cloud TTS Engine (REST API) ───────────────────────────
async function generateGoogleTTS(
  text: string,
  voiceName: string,
  speed: number
): Promise<Buffer> {
  if (!GCP_TTS_API_KEY) {
    throw new Error('GCP_TTS_API_KEY is not configured.');
  }

  const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${GCP_TTS_API_KEY}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      input: { text: text.trim() },
      voice: {
        languageCode: voiceName.split('-').slice(0, 2).join('-'),
        name: voiceName,
      },
      audioConfig: {
        audioEncoding: 'MP3',
        speakingRate: speed,
        pitch: 0,
        volumeGainDb: 0,
      },
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(
      (err as { error?: { message?: string } })?.error?.message || `Google TTS API error: ${response.status}`
    );
  }

  const data = await response.json() as { audioContent: string };
  return Buffer.from(data.audioContent, 'base64');
}

// ─── POST Handler ─────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.success) return auth.response;

    const body = await request.json();
    const { text, voice = 'gadis', speed = 1.0, provider = 'edge' } = body;

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'Text is required.' },
        { status: 400 }
      );
    }

    const clampedSpeed = Math.min(2.0, Math.max(0.5, Number(speed) || 1.0));

    let audioBuffer: Buffer;
    let usedProvider: string;
    let displayVoice: string;

    if (provider === 'google') {
      // ── Google Cloud TTS ──
      const voiceConfig = GOOGLE_VOICE_MAP[voice];
      if (!voiceConfig) {
        return NextResponse.json(
          { error: `Unknown Google voice: ${voice}` },
          { status: 400 }
        );
      }

      audioBuffer = await generateGoogleTTS(text, voiceConfig.voice, clampedSpeed);
      usedProvider = 'google';
      displayVoice = voiceConfig.voice;
    } else {
      // ── Edge TTS (default) ──
      const voiceConfig = EDGE_VOICE_MAP[voice] || EDGE_VOICE_MAP.gadis;
      audioBuffer = await generateEdgeTTS(text, voiceConfig.voice, clampedSpeed);
      usedProvider = 'edge';
      displayVoice = voiceConfig.voice;
    }

    // Return audio as binary response
    return new NextResponse(new Uint8Array(audioBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.length.toString(),
        'Cache-Control': 'no-cache',
        'X-Voice-Used': voice,
        'X-Voice-Display': displayVoice,
        'X-TTS-Provider': usedProvider,
      },
    });
  } catch (error: unknown) {
    console.error('TTS generation error:', error);
    const errMsg = error instanceof Error ? error.message : String(error);

    if (errMsg.includes('ENOENT') || errMsg.includes('edge-tts')) {
      return NextResponse.json(
        { error: 'TTS engine not available. Please contact support.' },
        { status: 503 }
      );
    }
    if (errMsg.includes('GCP_TTS_API_KEY')) {
      return NextResponse.json(
        { error: 'Google Cloud TTS is not configured. Set GCP_TTS_API_KEY environment variable.' },
        { status: 503 }
      );
    }
    if (errMsg.includes('API key not valid') || errMsg.includes('PERMISSION_DENIED')) {
      return NextResponse.json(
        { error: 'Google Cloud TTS API key is invalid or lacks permissions.' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to generate speech. Please try again.' },
      { status: 500 }
    );
  }
}

// ─── GET Handler (Health Check) ───────────────────────────────────
export async function GET() {
  try {
    const edgeVoices: { id: string; voice: string; lang: string; provider: string }[] = [];
    const googleVoices: { id: string; voice: string; lang: string; provider: string }[] = [];

    // Check Edge TTS
    let edgeHealthy = false;
    try {
      await execFileAsync('edge-tts', ['--list-voices'], { timeout: 10000 });
      edgeHealthy = true;
      for (const [key, val] of Object.entries(EDGE_VOICE_MAP)) {
        edgeVoices.push({ id: key, voice: val.voice, lang: val.lang, provider: 'edge' });
      }
    } catch { /* edge-tts not available */ }

    // Check Google TTS
    let googleHealthy = !!GCP_TTS_API_KEY;
    if (GCP_TTS_API_KEY) {
      for (const [key, val] of Object.entries(GOOGLE_VOICE_MAP)) {
        googleVoices.push({ id: key, voice: val.voice, lang: val.lang, provider: 'google' });
      }
    }

    const healthy = edgeHealthy || googleHealthy;

    return NextResponse.json({
      status: healthy ? 'healthy' : 'unhealthy',
      engines: {
        edge: { status: edgeHealthy ? 'available' : 'unavailable', voices: edgeVoices.length },
        google: { status: googleHealthy ? 'available' : 'not_configured', voices: googleVoices.length },
      },
      voices: [...edgeVoices, ...googleVoices],
    });
  } catch {
    return NextResponse.json(
      { status: 'unhealthy', error: 'TTS check failed' },
      { status: 503 }
    );
  }
}
