export const NICHES = [
  { value: 'health', label: 'Health & Wellness', icon: 'Heart', emoji: '❤️' },
  { value: 'facts', label: 'Facts & Trivia', icon: 'Lightbulb', emoji: '💡' },
  { value: 'horror', label: 'Horror & Scary', icon: 'Ghost', emoji: '👻' },
  { value: 'motivation', label: 'Motivation', icon: 'Flame', emoji: '🔥' },
  { value: 'finance', label: 'Finance & Money', icon: 'DollarSign', emoji: '💰' },
  { value: 'technology', label: 'Technology', icon: 'Cpu', emoji: '🤖' },
  { value: 'history', label: 'History', icon: 'Clock', emoji: '📜' },
  { value: 'science', label: 'Science', icon: 'Atom', emoji: '🔬' },
  { value: 'mystery', label: 'Mystery', icon: 'Search', emoji: '🔍' },
  { value: 'crime', label: 'True Crime', icon: 'AlertTriangle', emoji: '⚖️' },
  { value: 'psychology', label: 'Psychology', icon: 'Brain', emoji: '🧠' },
  { value: 'self-improvement', label: 'Self Improvement', icon: 'TrendingUp', emoji: '🚀' },
] as const;

export const SCRIPT_STYLES = [
  { value: 'storytelling', label: 'Storytelling', description: 'Engaging narrative format' },
  { value: 'controversial', label: 'Controversial', description: 'Provocative takes that spark debate' },
  { value: 'educational', label: 'Educational', description: 'Informative and value-packed' },
  { value: 'emotional', label: 'Emotional', description: 'Heart-touching and relatable' },
] as const;

export const SCRIPT_TONES = [
  { value: 'serious', label: 'Serious', description: 'Professional and authoritative' },
  { value: 'funny', label: 'Funny', description: 'Light-hearted and entertaining' },
  { value: 'dark', label: 'Dark', description: 'Mysterious and intense' },
  { value: 'energetic', label: 'Energetic', description: 'High-energy and hype' },
] as const;

// ─── TTS Providers ─────────────────────────────────────────────────
export const TTS_PROVIDERS = [
  { value: 'edge' as const, label: 'Microsoft Edge TTS', description: 'Free • Neural voices', badge: 'Free' },
  { value: 'google' as const, label: 'Google Cloud TTS', description: 'Premium • Neural2 voices', badge: 'Premium' },
] as const;

// ─── Edge TTS Voices ──────────────────────────────────────────────
export const EDGE_TTS_VOICES = [
  { value: 'gadis' as const, label: 'Gadis', description: '🇮🇩 Wanita Indonesia - Hangat' },
  { value: 'ardi' as const, label: 'Ardi', description: '🇮🇩 Pria Indonesia - Tegas' },
  { value: 'jenny' as const, label: 'Jenny', description: '🇺🇸 US Female - Friendly' },
  { value: 'guy' as const, label: 'Guy', description: '🇺🇸 US Male - Confident' },
  { value: 'aria' as const, label: 'Aria', description: '🇺🇸 US Female - Energetic' },
  { value: 'davis' as const, label: 'Davis', description: '🇺🇸 US Male - Professional' },
  { value: 'sonia' as const, label: 'Sonia', description: '🇬🇧 UK Female - Elegant' },
  { value: 'ryan' as const, label: 'Ryan', description: '🇬🇧 UK Male - British' },
] as const;

// ─── Google Cloud TTS Voices (Neural2) ───────────────────────────
export const GOOGLE_TTS_VOICES = [
  // Indonesian
  { value: 'gcp-ind-f1' as const, label: 'Siti', description: '🇮🇩 Indonesia - Perempuan Neural2' },
  { value: 'gcp-ind-f2' as const, label: 'Rina', description: '🇮🇩 Indonesia - Perempuan Neural2' },
  { value: 'gcp-ind-m1' as const, label: 'Budi', description: '🇮🇩 Indonesia - Laki-laki Neural2' },
  { value: 'gcp-ind-m2' as const, label: 'Andi', description: '🇮🇩 Indonesia - Laki-laki Neural2' },
  // US English
  { value: 'gcp-us-f1' as const, label: 'Amanda', description: '🇺🇸 US Female - Neural2' },
  { value: 'gcp-us-f2' as const, label: 'Sarah', description: '🇺🇸 US Female - Neural2' },
  { value: 'gcp-us-f3' as const, label: 'Olivia', description: '🇺🇸 US Female - Neural2' },
  { value: 'gcp-us-m1' as const, label: 'James', description: '🇺🇸 US Male - Neural2' },
  { value: 'gcp-us-m2' as const, label: 'Leo', description: '🇺🇸 US Male - Journey' },
  // British English
  { value: 'gcp-gb-f1' as const, label: 'Emma', description: '🇬🇧 UK Female - Neural2' },
  { value: 'gcp-gb-f2' as const, label: 'Lily', description: '🇬🇧 UK Female - Neural2' },
  { value: 'gcp-gb-m1' as const, label: 'Harry', description: '🇬🇧 UK Male - Neural2' },
  { value: 'gcp-gb-m2' as const, label: 'Oliver', description: '🇬🇧 UK Male - Neural2' },
] as const;

// ─── All TTS Voices (legacy, for backward compat) ─────────────────
export const TTS_VOICES = [
  ...EDGE_TTS_VOICES,
  ...GOOGLE_TTS_VOICES,
] as const;

export const THUMBNAIL_STYLES = [
  { value: 'clickbait', label: 'Clickbait', description: 'Eye-catching with big text' },
  { value: 'clean', label: 'Clean', description: 'Professional and minimal' },
  { value: 'minimal', label: 'Minimal', description: 'Simple and elegant' },
] as const;

export const PAYMENT_PLANS = [
  {
    value: 'pro',
    label: 'Pro Plan',
    price: 29000,
    credits: 50,
    features: ['50 credits/month', 'Priority generation', 'All AI features'],
  },
  {
    value: 'premium',
    label: 'Premium Plan',
    price: 79000,
    credits: 200,
    features: [
      '200 credits/month',
      'Priority generation',
      'All AI features',
      '1-Click Viral Mode',
      'Trend Analyzer',
      'Custom thumbnails',
    ],
  },
] as const;

export const PAYMENT_METHODS = [
  { value: 'qris', label: 'QRIS', description: 'Scan QR code to pay' },
  { value: 'bank_transfer', label: 'Bank Transfer', description: 'Transfer via bank' },
  { value: 'ewallet', label: 'E-Wallet', description: 'GoPay, OVO, Dana' },
] as const;

export const PLATFORMS = [
  { value: 'youtube', label: 'YouTube Shorts', icon: 'Youtube' },
  { value: 'tiktok', label: 'TikTok', icon: 'Music' },
  { value: 'instagram', label: 'Instagram Reels', icon: 'Instagram' },
] as const;
