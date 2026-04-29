// ============================================
// LOCKED SCHEMA — IdeaOutput Contract
// These fields are the ONLY allowed fields.
// DO NOT add: openLoop, curiosityGap, score, etc.
// ============================================

export interface IdeaOutput {
  title: string;
  hook: string;
  emotionalTrigger: string[];  // array of trigger names
  viralityScore: number;       // 0-100
  curiosityScore: number;      // 0-100
  reason: string;
}

export interface ScriptOutput {
  scenes: {
    number: number;
    duration: number;
    voiceover: string;
    visualDescription: string;
    onScreenText: string;
  }[];
  totalDuration: number;
  voiceoverFull: string;
  visualNotes: string;
}

/**
 * Build the prompt for generating viral ideas.
 * Output must be a JSON array of exactly 5 ideas with LOCKED fields only.
 */
export function buildIdeaPrompt(niche: string, language: string): string {
  return `You are a viral content strategist for faceless YouTube/TikTok channels.

You apply these 7 psychology rules:
1. Curiosity Gap Rule: Create information gaps viewers MUST close
2. Open Loop Rule: Start patterns brains auto-complete
3. Negativity Bias: Lead with potential loss or danger
4. Social Proof Trigger: Reference groups, trends, or consensus
5. Pattern Interrupt: Break expectations to force attention
6. Identity Resonance: Target self-concept and group belonging
7. Completion Drive: Start sequences viewers need to finish

NICHE: ${niche}
LANGUAGE: ${language}

Generate exactly 5 viral video ideas for the "${niche}" niche. Write all content in ${language}.

CRITICAL: Your output MUST be a valid JSON array with EXACTLY 5 objects. Each object MUST have ONLY these fields:
- "title" (string): scroll-stopping video title
- "hook" (string): first 3 seconds opener that grabs attention
- "emotionalTrigger" (string[]): which of the 7 psychology triggers are used (use exact trigger names: "Curiosity Gap", "Open Loop", "Negativity Bias", "Social Proof", "Pattern Interrupt", "Identity Resonance", "Completion Drive")
- "viralityScore" (number 0-100): predicted virality score
- "curiosityScore" (number 0-100): curiosity gap strength score
- "reason" (string): why this idea will go viral

DO NOT add any extra fields like "openLoop", "curiosityGap", "score", or any other field. ONLY the 6 fields listed above.

Output ONLY the JSON array, nothing else. No markdown, no explanation, no code blocks. Just raw JSON.

Example format:
[
  {
    "title": "...",
    "hook": "...",
    "emotionalTrigger": ["Curiosity Gap", "Negativity Bias"],
    "viralityScore": 85,
    "curiosityScore": 90,
    "reason": "..."
  }
]`;
}

/**
 * Build the prompt for generating a complete faceless video script.
 * Output must be a JSON object with scenes and metadata.
 */
export function buildScriptPrompt(
  idea: { title: string; hook: string; niche: string },
  language: string
): string {
  return `You are a professional scriptwriter for faceless YouTube/TikTok channels.

You write scripts that use stock footage, animations, and voiceover — no on-camera personality needed.

VIDEO TITLE: ${idea.title}
VIDEO HOOK: ${idea.hook}
NICHE: ${idea.niche}
LANGUAGE: ${language}

Write a complete faceless video script in ${language} for this idea.

CRITICAL: Your output MUST be valid JSON with EXACTLY this structure:
{
  "scenes": [
    {
      "number": 1,
      "duration": 5,
      "voiceover": "The narration text for this scene",
      "visualDescription": "What stock footage, animation, or visual to show",
      "onScreenText": "Text overlay shown on screen (short, punchy)"
    }
  ],
  "totalDuration": 60,
  "voiceoverFull": "The complete voiceover script as a single paragraph",
  "visualNotes": "General visual direction notes for the editor"
}

Rules:
- Create 8-15 scenes
- Each scene duration is in seconds (3-10 seconds per scene)
- Total duration should be 30-120 seconds
- Voiceover should be conversational and engaging
- Visual descriptions should reference specific stock footage types or animation styles
- On-screen text should be short and impactful (1-8 words)
- voiceoverFull should be the complete narration combined
- visualNotes should give the editor overall style direction

Output ONLY the JSON object, nothing else. No markdown, no explanation, no code blocks. Just raw JSON.`;
}
