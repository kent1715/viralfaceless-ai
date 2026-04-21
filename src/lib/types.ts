// ===== Role & Plan Types =====
export type UserRole = 'user' | 'admin';
export type UserPlan = 'free' | 'pro' | 'premium';

// ===== Navigation =====
export type ViewName =
  | 'login'
  | 'register'
  | 'dashboard'
  | 'idea-engine'
  | 'script-generator'
  | 'tts-engine'
  | 'video-generator'
  | 'auto-clipper'
  | 'thumbnail-generator'
  | 'seo-generator'
  | 'auto-posting'
  | 'credits'
  | 'admin'
  | 'settings'
  | 'project-history';

// ===== User =====
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  plan: UserPlan;
  credits: number;
  avatar?: string;
}

// ===== Ideas =====
export interface ViralIdea {
  id: string;
  title: string;
  hook: string;
  contentAngle: string;
  targetEmotion: string;
  viralScore: number;
  niche: string;
  isSelected: boolean;
}

// ===== Scripts =====
export interface Script {
  id: string;
  title: string;
  hook: string;
  mainContent: string;
  cta: string;
  style: string;
  tone: string;
  duration: string;
  fullScript: string;
}

// ===== Video Plan =====
export interface VideoPlan {
  id?: string;
  subtitles: SubtitleSegment[];
  bRolls: BRollSuggestion[];
  cutPoints: number[];
  keywordHighlights: string[];
}

export interface SubtitleSegment {
  text: string;
  startTime: number;
  endTime: number;
  highlight?: boolean;
}

export interface BRollSuggestion {
  sentence: string;
  footageDescription: string;
  timestamp: number;
}

// ===== SEO =====
export interface SEOData {
  title: string;
  description: string;
  hashtags: string[];
  platform: string;
}

// ===== Thumbnail =====
export interface ThumbnailData {
  base64: string;
  prompt: string;
  style: string;
}

// ===== Projects =====
export interface Project {
  id: string;
  title: string;
  niche?: string;
  status: string;
  creditsUsed: number;
  createdAt: string;
}

// ===== Payments =====
export interface PaymentRecord {
  id: string;
  amount: number;
  method: string;
  creditsAdded: number;
  status: string;
  createdAt: string;
}

// ===== Admin =====
export interface AdminStats {
  totalUsers: number;
  totalRevenue: number;
  totalContent: number;
  activeProjects: number;
}

export interface ScheduledPost {
  id: string;
  platform: string;
  title: string;
  status: string;
  scheduledAt?: string;
  publishedAt?: string;
}

// ===== Enum-like types =====
export type NicheType =
  | 'health'
  | 'facts'
  | 'horror'
  | 'motivation'
  | 'finance'
  | 'technology'
  | 'history'
  | 'science'
  | 'mystery'
  | 'crime'
  | 'psychology'
  | 'self-improvement';

export type ScriptStyle = 'storytelling' | 'controversial' | 'educational' | 'emotional';
export type ScriptTone = 'serious' | 'funny' | 'dark' | 'energetic';

export type TTSVoice = 'tongtong' | 'chuichui' | 'xiaochen' | 'jam' | 'kazi' | 'douji' | 'luodo';
export type ThumbnailStyle = 'clickbait' | 'clean' | 'minimal';
export type PaymentMethod = 'qris' | 'bank_transfer' | 'ewallet';
