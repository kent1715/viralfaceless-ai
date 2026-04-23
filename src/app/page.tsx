'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/lib/store';
import { api } from '@/lib/api';
import { AnimatePresence, motion } from 'framer-motion';
import { Toaster } from '@/components/ui/sonner';
import { Loader2 } from 'lucide-react';

// Auth
import LoginForm from '@/components/viralfaceless/LoginForm';
import RegisterForm from '@/components/viralfaceless/RegisterForm';

// Layout
import AppSidebar from '@/components/viralfaceless/AppSidebar';
import Header from '@/components/viralfaceless/Header';

// Pages
import Dashboard from '@/components/viralfaceless/Dashboard';
import IdeaEngine from '@/components/viralfaceless/IdeaEngine';
import ScriptGenerator from '@/components/viralfaceless/ScriptGenerator';
import TTSEngine from '@/components/viralfaceless/TTSEngine';
import VideoGenerator from '@/components/viralfaceless/VideoGenerator';
import AutoClipper from '@/components/viralfaceless/AutoClipper';
import ThumbnailGenerator from '@/components/viralfaceless/ThumbnailGenerator';
import SEOGenerator from '@/components/viralfaceless/SEOGenerator';
import AutoPosting from '@/components/viralfaceless/AutoPosting';
import CreditDashboard from '@/components/viralfaceless/CreditDashboard';
import AdminDashboard from '@/components/viralfaceless/AdminDashboard';
import ProjectHistory from '@/components/viralfaceless/ProjectHistory';

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' as const } },
  exit: { opacity: 0, y: -12, transition: { duration: 0.15, ease: 'easeIn' as const } },
};

function ViewRouter() {
  const currentView = useStore((s) => s.currentView);

  const views: Record<string, React.ReactNode> = {
    dashboard: <Dashboard />,
    'idea-engine': <IdeaEngine />,
    'script-generator': <ScriptGenerator />,
    'tts-engine': <TTSEngine />,
    'video-generator': <VideoGenerator />,
    'auto-clipper': <AutoClipper />,
    'thumbnail-generator': <ThumbnailGenerator />,
    'seo-generator': <SEOGenerator />,
    'auto-posting': <AutoPosting />,
    credits: <CreditDashboard />,
    admin: <AdminDashboard />,
    'project-history': <ProjectHistory />,
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentView}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="flex-1 overflow-auto"
      >
        {views[currentView] || <Dashboard />}
      </motion.div>
    </AnimatePresence>
  );
}

export default function Home() {
  const {
    isAuthenticated,
    currentView,
    sidebarOpen,
    setUser,
    setToken,
    setCurrentView,
    setProjects,
  } = useStore();

  const [isLoading, setIsLoading] = useState(true);

  // Check auth on mount
  useEffect(() => {
    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('vf_token')
        : null;

    if (token) {
      api.auth
        .me()
        .then((data) => {
          if (data.user) {
            setUser(data.user);
            setToken(token);
            setCurrentView('dashboard');
          }
        })
        .catch(() => {
          // Token invalid
          localStorage.removeItem('vf_token');
          setCurrentView('login');
        })
        .finally(() => setIsLoading(false));
    } else {
      // Use microtask to avoid synchronous setState in effect
      queueMicrotask(() => setIsLoading(false));
    }
  }, [setUser, setToken, setCurrentView]);

  // Fetch projects when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      api.projects
        .list()
        .then((data) => {
          if (data.projects) setProjects(data.projects);
        })
        .catch(() => {});
    }
  }, [isAuthenticated, setProjects]);

  // Loading screen
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-white"
              >
                <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
                <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
                <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
                <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
              </svg>
            </div>
            <div className="absolute -inset-2 rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-700/20 animate-ping" />
          </div>
          <p className="text-muted-foreground text-sm font-medium">
            Loading ViralFaceless AI...
          </p>
          <Loader2 className="h-5 w-5 animate-spin text-violet-500" />
        </div>
      </div>
    );
  }

  // Auth pages
  if (!isAuthenticated) {
    if (currentView === 'register') {
      return <RegisterForm />;
    }
    return <LoginForm />;
  }

  // Main app layout
  return (
    <div className="min-h-screen flex bg-background">
      <AppSidebar />
      <div className={`flex-1 flex flex-col min-h-screen overflow-hidden transition-all duration-300 ${sidebarOpen ? 'md:ml-64' : ''}`}>
        <Header />
        <main className="flex-1 overflow-auto">
          <ViewRouter />
        </main>
        {/* Sticky Footer */}
        <footer className="border-t border-border bg-card px-6 py-3 mt-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
            <p>© 2025 ViralFaceless AI. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <span className="hover:text-foreground cursor-pointer transition-colors">
                Terms
              </span>
              <span className="hover:text-foreground cursor-pointer transition-colors">
                Privacy
              </span>
              <span className="hover:text-foreground cursor-pointer transition-colors">
                Support
              </span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
