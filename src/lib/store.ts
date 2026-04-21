import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  User,
  ViralIdea,
  Script,
  VideoPlan,
  SEOData,
  ThumbnailData,
  Project,
  ViewName,
  NicheType,
  PaymentRecord,
  AdminStats,
  ScheduledPost,
} from './types';

// ─── Store State Shape ──────────────────────────────────────────
interface AppState {
  // Auth
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;

  // Navigation
  currentView: ViewName;

  // Ideas
  ideas: ViralIdea[];
  selectedIdea: ViralIdea | null;
  currentNiche: NicheType;
  ideasLoading: boolean;

  // Scripts
  currentScript: Script | null;
  scriptLoading: boolean;

  // TTS
  ttsAudioUrl: string | null;
  ttsLoading: boolean;

  // Video
  videoPlan: VideoPlan | null;
  videoLoading: boolean;

  // Thumbnail
  thumbnails: ThumbnailData[];
  thumbnailLoading: boolean;

  // SEO
  seoData: SEOData[];
  seoLoading: boolean;

  // Projects
  projects: Project[];

  // Admin
  adminStats: AdminStats | null;
  scheduledPosts: ScheduledPost[];

  // Payment
  payments: PaymentRecord[];

  // UI
  sidebarOpen: boolean;

  // ─── Actions ───────────────────────────────────────────────
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  logout: () => void;
  setCurrentView: (view: ViewName) => void;
  setIdeas: (ideas: ViralIdea[]) => void;
  setSelectedIdea: (idea: ViralIdea | null) => void;
  setCurrentNiche: (niche: NicheType) => void;
  setIdeasLoading: (loading: boolean) => void;
  setCurrentScript: (script: Script | null) => void;
  setScriptLoading: (loading: boolean) => void;
  setTtsAudioUrl: (url: string | null) => void;
  setTtsLoading: (loading: boolean) => void;
  setVideoPlan: (plan: VideoPlan | null) => void;
  setVideoLoading: (loading: boolean) => void;
  setThumbnails: (thumbnails: ThumbnailData[]) => void;
  setThumbnailLoading: (loading: boolean) => void;
  setSeoData: (data: SEOData[]) => void;
  setSeoLoading: (loading: boolean) => void;
  setProjects: (projects: Project[]) => void;
  setAdminStats: (stats: AdminStats | null) => void;
  setScheduledPosts: (posts: ScheduledPost[]) => void;
  setPayments: (payments: PaymentRecord[]) => void;
  setSidebarOpen: (open: boolean) => void;
}

// ─── Default / Initial State ────────────────────────────────────
const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  currentView: 'login' as ViewName,
  ideas: [],
  selectedIdea: null,
  currentNiche: 'motivation' as NicheType,
  ideasLoading: false,
  currentScript: null,
  scriptLoading: false,
  ttsAudioUrl: null,
  ttsLoading: false,
  videoPlan: null,
  videoLoading: false,
  thumbnails: [],
  thumbnailLoading: false,
  seoData: [],
  seoLoading: false,
  projects: [],
  adminStats: null,
  scheduledPosts: [],
  payments: [],
  sidebarOpen: true,
};

// ─── Zustand Store ──────────────────────────────────────────────
export const useStore = create<AppState>()(
  persist(
    (set) => ({
      ...initialState,

      // Auth actions
      setUser: (user) =>
        set({ user, isAuthenticated: !!user }),

      setToken: (token) => {
        // Keep localStorage in sync for api.ts helper
        if (typeof window !== 'undefined') {
          if (token) {
            localStorage.setItem('vf_token', token);
          } else {
            localStorage.removeItem('vf_token');
          }
        }
        set({ token });
      },

      logout: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('vf_token');
        }
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          currentView: 'login',
          ideas: [],
          selectedIdea: null,
          currentScript: null,
          ttsAudioUrl: null,
          videoPlan: null,
          thumbnails: [],
          seoData: [],
          projects: [],
          adminStats: null,
          scheduledPosts: [],
          payments: [],
        });
      },

      // Navigation
      setCurrentView: (view) => set({ currentView: view }),

      // Ideas
      setIdeas: (ideas) => set({ ideas }),
      setSelectedIdea: (idea) => set({ selectedIdea: idea }),
      setCurrentNiche: (niche) => set({ currentNiche: niche }),
      setIdeasLoading: (loading) => set({ ideasLoading: loading }),

      // Scripts
      setCurrentScript: (script) => set({ currentScript: script }),
      setScriptLoading: (loading) => set({ scriptLoading: loading }),

      // TTS
      setTtsAudioUrl: (url) => set({ ttsAudioUrl: url }),
      setTtsLoading: (loading) => set({ ttsLoading: loading }),

      // Video
      setVideoPlan: (plan) => set({ videoPlan: plan }),
      setVideoLoading: (loading) => set({ videoLoading: loading }),

      // Thumbnail
      setThumbnails: (thumbnails) => set({ thumbnails }),
      setThumbnailLoading: (loading) => set({ thumbnailLoading: loading }),

      // SEO
      setSeoData: (data) => set({ seoData: data }),
      setSeoLoading: (loading) => set({ seoLoading: loading }),

      // Projects
      setProjects: (projects) => set({ projects }),

      // Admin
      setAdminStats: (stats) => set({ adminStats: stats }),
      setScheduledPosts: (posts) => set({ scheduledPosts: posts }),

      // Payments
      setPayments: (payments) => set({ payments }),

      // UI
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
    }),
    {
      name: 'viralfaceless-storage', // localStorage key
      // Only persist auth-related state and sidebar preference
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        currentView: state.currentView,
        currentNiche: state.currentNiche,
        sidebarOpen: state.sidebarOpen,
      }),
    }
  )
);
