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

export const TTS_VOICES = [
  { value: 'gadis', label: 'Gadis', description: '🇮🇩 Wanita Indonesia - Hangat' },
  { value: 'ardi', label: 'Ardi', description: '🇮🇩 Pria Indonesia - Tegas' },
  { value: 'jenny', label: 'Jenny', description: '🇺🇸 US Female - Friendly' },
  { value: 'guy', label: 'Guy', description: '🇺🇸 US Male - Confident' },
  { value: 'aria', label: 'Aria', description: '🇺🇸 US Female - Energetic' },
  { value: 'davis', label: 'Davis', description: '🇺🇸 US Male - Professional' },
  { value: 'sonia', label: 'Sonia', description: '🇬🇧 UK Female - Elegant' },
  { value: 'ryan', label: 'Ryan', description: '🇬🇧 UK Male - British' },
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
