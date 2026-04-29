'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, FileText } from 'lucide-react';
import { useAppStore, type IdeaItem } from '@/lib/store';

const TRIGGER_COLORS: Record<string, string> = {
  fear: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
  urgency: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  curiosity: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
  surprise: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
  anger: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
  joy: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  sadness: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
  nostalgia: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
  inspiration: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  greed: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  hope: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  fomo: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  envy: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
  pride: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
};

function getTriggerColor(trigger: string): string {
  const lower = trigger.toLowerCase();
  for (const [key, color] of Object.entries(TRIGGER_COLORS)) {
    if (lower.includes(key)) return color;
  }
  return 'bg-secondary text-secondary-foreground';
}

function getScoreColor(score: number): string {
  if (score >= 70) return 'bg-emerald-500';
  if (score >= 40) return 'bg-amber-500';
  return 'bg-rose-500';
}

function getScoreTextColor(score: number): string {
  if (score >= 70) return 'text-emerald-600 dark:text-emerald-400';
  if (score >= 40) return 'text-amber-600 dark:text-amber-400';
  return 'text-rose-600 dark:text-rose-400';
}

interface IdeaCardProps {
  idea: IdeaItem;
  onGenerateScript?: (idea: IdeaItem) => void;
}

export function IdeaCard({ idea, onGenerateScript }: IdeaCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [generating, setGenerating] = useState(false);
  const { token, user, addScript, setSelectedIdea } = useAppStore();

  const handleGenerateScript = async () => {
    if ((user?.credits ?? 0) < 5) {
      return;
    }
    setGenerating(true);
    try {
      const res = await fetch('/api/scripts/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ideaId: idea.id, language: idea.language }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          useAppStore.getState().logout();
          return;
        }
        return;
      }

      if (data.script) {
        addScript(data.script);
        setSelectedIdea(idea);

        // Update user credits in store
        if (data.creditsRemaining !== undefined) {
          const currentUser = useAppStore.getState().user;
          if (currentUser) {
            useAppStore.getState().setUser({ ...currentUser, credits: data.creditsRemaining }, useAppStore.getState().token!);
          }
        }
      }
    } catch {
      // silent
    } finally {
      setGenerating(false);
    }
  };

  const handleExternalGenerate = () => {
    if (onGenerateScript) {
      onGenerateScript(idea);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="rounded-xl border-border/50 shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-4 space-y-3">
          {/* Title */}
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-base font-bold text-foreground leading-tight">
              {idea.title}
            </h4>
            <button
              onClick={() => setExpanded(!expanded)}
              className="shrink-0 rounded-md p-1 hover:bg-muted transition-colors"
            >
              {expanded ? (
                <ChevronUp className="size-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="size-4 text-muted-foreground" />
              )}
            </button>
          </div>

          {/* Hook */}
          <p className="text-sm italic text-emerald-600 dark:text-emerald-400 leading-relaxed">
            &ldquo;{idea.hook}&rdquo;
          </p>

          {/* Emotional Triggers */}
          <div className="flex flex-wrap gap-1.5">
            {idea.emotionalTrigger.map((trigger) => (
              <span
                key={trigger}
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getTriggerColor(trigger)}`}
              >
                {trigger}
              </span>
            ))}
          </div>

          {/* Scores */}
          <div className="space-y-2">
            {/* Virality Score */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Virality Score</span>
                <span className={`font-semibold ${getScoreTextColor(idea.viralityScore)}`}>
                  {idea.viralityScore}/100
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${idea.viralityScore}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className={`h-full rounded-full ${getScoreColor(idea.viralityScore)}`}
                />
              </div>
            </div>

            {/* Curiosity Score */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Curiosity Score</span>
                <span className={`font-semibold ${getScoreTextColor(idea.curiosityScore)}`}>
                  {idea.curiosityScore}/100
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${idea.curiosityScore}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
                  className={`h-full rounded-full ${getScoreColor(idea.curiosityScore)}`}
                />
              </div>
            </div>
          </div>

          {/* Expanded Content */}
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-2 overflow-hidden"
              >
                <div className="pt-2 border-t border-border/50">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Reason</p>
                  <p className="text-sm text-foreground/80">{idea.reason}</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline" className="text-xs">
                    {idea.niche}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {idea.language.toUpperCase()}
                  </Badge>
                  <span className="text-xs">
                    {new Date(idea.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Generate Script Button */}
          <Button
            onClick={onGenerateScript ? handleExternalGenerate : handleGenerateScript}
            disabled={generating}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white mt-2"
            size="default"
          >
            {generating ? (
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                  className="size-3.5 rounded-full border-2 border-white/30 border-t-white"
                />
                Generating...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <FileText className="size-4" />
                Generate Script (5 credits)
              </div>
            )}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
