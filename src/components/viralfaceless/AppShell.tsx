'use client';

import { useEffect, useRef, useSyncExternalStore } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Sparkles,
  Lightbulb,
  BarChart3,
  LogOut,
  Moon,
  Sun,
  Coins,
  Zap,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useAppStore } from '@/lib/store';
import { AuthForm } from './AuthForm';
import { IdeaGenerator } from './IdeaGenerator';
import { IdeasList } from './IdeasList';
import { ScriptPanel } from './ScriptPanel';
import { AnalyticsPanel } from './AnalyticsPanel';

const emptySubscribe = () => () => {};

function useHydrated() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}

export function AppShell() {
  const { user, token, logout, activeTab, setActiveTab, selectedIdea, setSelectedIdea, scripts } = useAppStore();
  const { theme, setTheme } = useTheme();
  const hydrated = useHydrated();
  const hasRestored = useRef(false);

  // Restore auth from localStorage on mount
  useEffect(() => {
    if (hasRestored.current) return;
    hasRestored.current = true;

    const storedToken = localStorage.getItem('vf_token');
    const storedUser = localStorage.getItem('vf_user');

    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        useAppStore.getState().setUser(parsedUser, storedToken);
      } catch {
        localStorage.removeItem('vf_token');
        localStorage.removeItem('vf_user');
      }
    }
  }, []);

  // Find the script for the selected idea
  const activeScript = selectedIdea
    ? scripts.find((s) => s.ideaId === selectedIdea.id)
    : null;

  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="size-8 rounded-full border-2 border-emerald-500/30 border-t-emerald-500 animate-spin" />
      </div>
    );
  }

  if (!user || !token) {
    return <AuthForm />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="mx-auto max-w-4xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10">
              <Sparkles className="size-4 text-emerald-500" />
            </div>
            <h1 className="text-lg font-bold tracking-tight text-foreground">
              ViralFaceless AI
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {/* Credits */}
            <Badge variant="secondary" className="gap-1.5 px-2.5 py-1 text-xs">
              <Coins className="size-3 text-amber-500" />
              <span className="font-semibold">{user.credits}</span>
              <span className="text-muted-foreground hidden sm:inline">credits</span>
            </Badge>

            {/* Plan */}
            {user.plan !== 'free' && (
              <Badge className="bg-emerald-600 text-white text-xs">
                <Zap className="mr-1 size-3" />
                {user.plan.toUpperCase()}
              </Badge>
            )}

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="size-8"
            >
              {theme === 'dark' ? (
                <Sun className="size-4" />
              ) : (
                <Moon className="size-4" />
              )}
            </Button>

            {/* User */}
            <Avatar size="sm">
              <AvatarFallback className="text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                {(user.name || user.email).charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            {/* Logout */}
            <Button variant="ghost" size="icon" onClick={logout} className="size-8">
              <LogOut className="size-4 text-muted-foreground" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 mx-auto w-full max-w-4xl px-4 py-6">
        <AnimatePresence mode="wait">
          {activeScript ? (
            <motion.div
              key="script"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <ScriptPanel
                script={activeScript}
                onBack={() => setSelectedIdea(null)}
              />
            </motion.div>
          ) : (
            <motion.div
              key="main"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Tabs
                value={activeTab}
                onValueChange={(v) => setActiveTab(v as 'generate' | 'ideas' | 'analytics')}
              >
                <TabsList className="w-full mb-6">
                  <TabsTrigger value="generate" className="flex-1 gap-1.5">
                    <Sparkles className="size-3.5" />
                    <span className="hidden sm:inline">Generate</span>
                  </TabsTrigger>
                  <TabsTrigger value="ideas" className="flex-1 gap-1.5">
                    <Lightbulb className="size-3.5" />
                    <span className="hidden sm:inline">My Ideas</span>
                  </TabsTrigger>
                  <TabsTrigger value="analytics" className="flex-1 gap-1.5">
                    <BarChart3 className="size-3.5" />
                    <span className="hidden sm:inline">Analytics</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="generate">
                  <IdeaGenerator />
                </TabsContent>

                <TabsContent value="ideas">
                  <IdeasList />
                </TabsContent>

                <TabsContent value="analytics">
                  <AnalyticsPanel />
                </TabsContent>
              </Tabs>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-background/80 backdrop-blur-md mt-auto">
        <div className="mx-auto max-w-4xl px-4 py-4 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            ViralFaceless AI — V11 Locked Schema
          </p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Powered by AI</span>
            <Separator orientation="vertical" className="h-3" />
            <span>&copy; 2025</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
