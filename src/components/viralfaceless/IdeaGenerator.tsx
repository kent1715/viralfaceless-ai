'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, Zap, AlertCircle } from 'lucide-react';
import { useAppStore, type IdeaItem } from '@/lib/store';

const NICHE_SUGGESTIONS = [
  'motivation',
  'finance',
  'tech',
  'health',
  'psychology',
  'crypto',
];

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'id', label: 'Indonesian' },
  { value: 'es', label: 'Spanish' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'ja', label: 'Japanese' },
  { value: 'ko', label: 'Korean' },
];

export function IdeaGenerator() {
  const { niche, setNiche, language, setLanguage, token, addIdeas, user, setIsLoading } = useAppStore();
  const [error, setError] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatedIdeas, setGeneratedIdeas] = useState<IdeaItem[]>([]);

  const handleGenerate = async () => {
    if (!niche.trim()) {
      setError('Please enter a niche');
      return;
    }
    if ((user?.credits ?? 0) < 3) {
      setError('Not enough credits. You need at least 3 credits.');
      return;
    }

    setError('');
    setGenerating(true);
    setIsLoading(true);

    try {
      const res = await fetch('/api/ideas/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ niche: niche.trim(), language }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          useAppStore.getState().logout();
          return;
        }
        setError(data.error || 'Failed to generate ideas');
        return;
      }

      const ideas: IdeaItem[] = data.ideas || [];
      addIdeas(ideas);
      setGeneratedIdeas(ideas);

      // Update user credits in store
      if (data.creditsRemaining !== undefined) {
        const currentUser = useAppStore.getState().user;
        if (currentUser) {
          useAppStore.getState().setUser({ ...currentUser, credits: data.creditsRemaining }, useAppStore.getState().token!);
        }
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setGenerating(false);
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Generator Form */}
      <Card className="rounded-xl border-border/50 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="size-5 text-emerald-500" />
            Generate Viral Ideas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Niche Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Niche / Topic
            </label>
            <Input
              placeholder="e.g., motivation, finance, tech..."
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              className="rounded-lg"
            />
            <div className="flex flex-wrap gap-2">
              {NICHE_SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => setNiche(s)}
                  className="rounded-full px-3 py-1 text-xs font-medium transition-colors bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 dark:text-emerald-400"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Language Selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Language
            </label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((lang) => (
                  <SelectItem key={lang.value} value={lang.value}>
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 text-sm text-rose-500"
            >
              <AlertCircle className="size-4" />
              {error}
            </motion.div>
          )}

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={generating}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
            size="lg"
          >
            {generating ? (
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                  className="size-4 rounded-full border-2 border-white/30 border-t-white"
                />
                Generating...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Zap className="size-4" />
                Generate Ideas (3 credits)
              </div>
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            Your balance: {user?.credits ?? 0} credits
          </p>
        </CardContent>
      </Card>

      {/* Generated Ideas */}
      {generatedIdeas.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">
            Generated Ideas
          </h3>
          <div className="space-y-3">
            {generatedIdeas.map((idea, index) => (
              <motion.div
                key={idea.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="rounded-xl border-border/50">
                  <CardContent className="p-4 space-y-3">
                    <h4 className="text-base font-semibold text-foreground">
                      {idea.title}
                    </h4>
                    <p className="text-sm italic text-emerald-600 dark:text-emerald-400">
                      &ldquo;{idea.hook}&rdquo;
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {idea.emotionalTrigger.map((trigger) => (
                        <Badge
                          key={trigger}
                          variant="secondary"
                          className="text-xs"
                        >
                          {trigger}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-4 text-sm">
                      <span className="text-muted-foreground">
                        Virality: <span className="font-semibold text-foreground">{idea.viralityScore}</span>
                      </span>
                      <span className="text-muted-foreground">
                        Curiosity: <span className="font-semibold text-foreground">{idea.curiosityScore}</span>
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{idea.reason}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
