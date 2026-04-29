import { create } from 'zustand';

// LOCKED SCHEMA — matches Prisma exactly
export interface IdeaItem {
  id: string;
  niche: string;
  title: string;
  hook: string;
  emotionalTrigger: string[];  // NOT string — array
  viralityScore: number;       // 0-100
  curiosityScore: number;      // 0-100
  reason: string;
  language: string;
  createdAt: string;
}

export interface ScriptItem {
  id: string;
  ideaId: string;
  content: {
    scenes: Array<{
      number: number;
      duration: number;
      voiceover: string;
      visualDescription: string;
      onScreenText: string;
    }>;
    totalDuration: number;
    voiceoverFull: string;
    visualNotes: string;
  };
  language: string;
  createdAt: string;
}

export interface UserState {
  id: string;
  email: string;
  name: string;
  credits: number;
  plan: string;
}

interface AppStore {
  // Auth
  user: UserState | null;
  token: string | null;
  setUser: (user: UserState, token: string) => void;
  logout: () => void;

  // Ideas
  ideas: IdeaItem[];
  setIdeas: (ideas: IdeaItem[]) => void;
  addIdeas: (ideas: IdeaItem[]) => void;

  // Scripts
  scripts: ScriptItem[];
  setScripts: (scripts: ScriptItem[]) => void;
  addScript: (script: ScriptItem) => void;

  // UI State
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  activeTab: 'generate' | 'ideas' | 'analytics';
  setActiveTab: (tab: 'generate' | 'ideas' | 'analytics') => void;
  selectedIdea: IdeaItem | null;
  setSelectedIdea: (idea: IdeaItem | null) => void;

  // Niche input
  niche: string;
  setNiche: (niche: string) => void;
  language: string;
  setLanguage: (lang: string) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  // Auth
  user: null,
  token: null,
  setUser: (user, token) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('vf_token', token);
      localStorage.setItem('vf_user', JSON.stringify(user));
    }
    set({ user, token });
  },
  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('vf_token');
      localStorage.removeItem('vf_user');
    }
    set({
      user: null,
      token: null,
      ideas: [],
      scripts: [],
      activeTab: 'generate',
      selectedIdea: null,
      niche: '',
      language: 'en',
    });
  },

  // Ideas
  ideas: [],
  setIdeas: (ideas) => set({ ideas }),
  addIdeas: (ideas) => set((state) => ({ ideas: [...ideas, ...state.ideas] })),

  // Scripts
  scripts: [],
  setScripts: (scripts) => set({ scripts }),
  addScript: (script) => set((state) => ({ scripts: [...state.scripts, script] })),

  // UI State
  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),
  activeTab: 'generate',
  setActiveTab: (tab) => set({ activeTab: tab }),
  selectedIdea: null,
  setSelectedIdea: (idea) => set({ selectedIdea: idea }),

  // Niche input
  niche: '',
  setNiche: (niche) => set({ niche }),
  language: 'en',
  setLanguage: (lang) => set({ language: lang }),
}));
