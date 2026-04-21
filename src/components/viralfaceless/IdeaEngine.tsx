'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  TrendingUp,
  Quote,
  Target,
  RefreshCw,
  Zap,
  ChevronDown,
  Check,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useStore } from '@/lib/store';
import { api } from '@/lib/api';
import { NICHES } from '@/lib/constants';
import type { NicheType, ViralIdea } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// ─── Helpers ────────────────────────────────────────────────────
function viralScoreColor(score: number): string {
  if (score >= 80) return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
  if (score >= 60) return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
  return 'bg-red-500/15 text-red-400 border-red-500/30';
}

function emotionColor(emotion: string): string {
  const colors: Record<string, string> = {
    awe: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    fear: 'bg-red-500/15 text-red-400 border-red-500/30',
    curiosity: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    anger: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
    inspiration: 'bg-pink-500/15 text-pink-400 border-pink-500/30',
    sadness: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
    surprise: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
    joy: 'bg-green-500/15 text-green-400 border-green-500/30',
    suspense: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
    disgust: 'bg-lime-500/15 text-lime-400 border-lime-500/30',
  };
  const key = emotion.toLowerCase();
  return colors[key] || 'bg-secondary text-secondary-foreground border-border';
}

// ─── 1-Click Viral Steps ────────────────────────────────────────
const VIRAL_STEPS = [
  { label: 'Analyzing niche trends...', icon: '📊' },
  { label: 'Generating viral ideas...', icon: '💡' },
  { label: 'Selecting best idea...', icon: '⭐' },
  { label: 'Writing script...', icon: '✍️' },
  { label: 'Done! Content ready.', icon: '🎉' },
];

// ─── Skeleton Loader ────────────────────────────────────────────
function IdeaSkeleton() {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
      <Skeleton className="h-5 w-3/4 mb-2" />
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-2/3 mb-3" />
      <div className="flex gap-2">
        <Skeleton className="h-8 w-20 rounded-md" />
        <Skeleton className="h-8 w-20 rounded-md" />
      </div>
    </Card>
  );
}

// ─── Idea Card ──────────────────────────────────────────────────
function IdeaCard({
  idea,
  isSelected,
  onSelect,
  onRegenerate,
}: {
  idea: ViralIdea;
  isSelected: boolean;
  onSelect: () => void;
  onRegenerate: () => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        className={`p-4 transition-all duration-200 cursor-pointer hover:border-purple-500/40 ${
          isSelected
            ? 'border-purple-500 shadow-lg shadow-purple-500/10'
            : ''
        }`}
        onClick={onSelect}
      >
        <div className="flex items-center justify-between mb-3">
          <Badge className={viralScoreColor(idea.viralScore)} variant="outline">
            <TrendingUp className="size-3 mr-1" />
            {idea.viralScore}/100
          </Badge>
          <Badge className={emotionColor(idea.targetEmotion)} variant="outline">
            <Target className="size-3 mr-1" />
            {idea.targetEmotion}
          </Badge>
        </div>

        <h3 className="font-bold text-foreground mb-2 leading-tight">
          {idea.title}
        </h3>

        <div className="bg-purple-500/10 border border-purple-500/20 rounded-md p-3 mb-3">
          <p className="text-purple-300 italic text-sm flex items-start gap-2">
            <Quote className="size-4 mt-0.5 shrink-0 text-purple-400" />
            {idea.hook}
          </p>
        </div>

        <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
          {idea.contentAngle}
        </p>

        <Separator className="mb-3" />

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            className="flex-1 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white"
            onClick={(e) => {
              e.stopPropagation();
              onSelect();
            }}
          >
            <Check className="size-3.5 mr-1" />
            Select
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              onRegenerate();
            }}
          >
            <RefreshCw className="size-3.5" />
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}

// ─── Main Component ─────────────────────────────────────────────
export default function IdeaEngine() {
  const {
    user,
    ideas,
    selectedIdea,
    currentNiche,
    ideasLoading,
    setCurrentNiche,
    setIdeas,
    setSelectedIdea,
    setIdeasLoading,
    setCurrentScript,
    setScriptLoading,
    setUser,
    setCurrentView,
  } = useStore();

  const [ideaCount, setIdeaCount] = useState(10);
  const [makeMoreExtreme, setMakeMoreExtreme] = useState(false);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);

  // 1-Click Viral Mode
  const [viralDialogOpen, setViralDialogOpen] = useState(false);
  const [viralStep, setViralStep] = useState(0);
  const [viralRunning, setViralRunning] = useState(false);

  // ── Generate Ideas ──────────────────────────────────────────────
  const handleGenerateIdeas = useCallback(async () => {
    if (!user || user.credits < 1) {
      toast.error('Not enough credits! Purchase more to continue.');
      return;
    }

    setIdeasLoading(true);
    try {
      const data = await api.ideas.generate(
        currentNiche,
        ideaCount,
        makeMoreExtreme
      );
      setIdeas(data.ideas || []);
      if (data.remainingCredits !== undefined) {
        setUser({ ...user, credits: data.remainingCredits });
      }
      toast.success(
        `Generated ${data.ideas?.length || ideaCount} ideas! Credits remaining: ${data.remainingCredits ?? user.credits - 1}`
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to generate ideas');
    } finally {
      setIdeasLoading(false);
    }
  }, [
    user,
    currentNiche,
    ideaCount,
    makeMoreExtreme,
    setIdeas,
    setIdeasLoading,
    setUser,
  ]);

  // ── Select Idea ────────────────────────────────────────────────
  const handleSelectIdea = useCallback(
    (idea: ViralIdea) => {
      setSelectedIdea(idea);
      toast.success('Idea selected! Go to Script Generator', {
        action: {
          label: 'Go to Scripts',
          onClick: () => setCurrentView('script-generator'),
        },
      });
    },
    [setSelectedIdea, setCurrentView]
  );

  // ── Regenerate Single Idea ─────────────────────────────────────
  const handleRegenerateIdea = useCallback(
    async (index: number) => {
      if (!user || user.credits < 1) {
        toast.error('Not enough credits to regenerate!');
        return;
      }

      setRegeneratingId(ideas[index]?.id || '');
      try {
        const data = await api.ideas.generate(currentNiche, 1, makeMoreExtreme);
        if (data.ideas && data.ideas.length > 0) {
          const newIdeas = [...ideas];
          newIdeas[index] = data.ideas[0];
          setIdeas(newIdeas);
          if (data.remainingCredits !== undefined) {
            setUser({ ...user, credits: data.remainingCredits });
          }
          toast.success('Idea regenerated!');
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to regenerate');
      } finally {
        setRegeneratingId(null);
      }
    },
    [user, ideas, currentNiche, makeMoreExtreme, setIdeas, setUser]
  );

  // ── 1-Click Viral Mode ─────────────────────────────────────────
  const handleOneClickViral = useCallback(async () => {
    if (!user || user.credits < 2) {
      toast.error('Need at least 2 credits for 1-Click Viral Mode!');
      return;
    }

    setViralDialogOpen(true);
    setViralRunning(true);
    setViralStep(0);

    try {
      // Step 1-2: Generate ideas
      setViralStep(1);
      const ideaData = await api.ideas.generate(currentNiche, 10, true);
      const generatedIdeas: ViralIdea[] = ideaData.ideas || [];
      setIdeas(generatedIdeas);

      // Step 2-3: Select best idea
      setViralStep(2);
      const bestIdea =
        generatedIdeas.sort((a, b) => b.viralScore - a.viralScore)[0] ||
        generatedIdeas[0];
      if (!bestIdea) throw new Error('No ideas generated');
      setSelectedIdea(bestIdea);

      // Step 3-4: Generate script
      setViralStep(3);
      setScriptLoading(true);
      const scriptData = await api.scripts.generate({
        ideaTitle: bestIdea.title,
        hook: bestIdea.hook,
        contentAngle: bestIdea.contentAngle,
        targetEmotion: bestIdea.targetEmotion,
        style: 'storytelling',
        tone: 'energetic',
      });
      setCurrentScript(scriptData.script);
      setScriptLoading(false);

      if (ideaData.remainingCredits !== undefined) {
        setUser({ ...user, credits: ideaData.remainingCredits });
      }

      // Done
      setViralStep(4);
      toast.success('🚀 Viral content ready! Script generated.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '1-Click Viral Mode failed');
      setScriptLoading(false);
    } finally {
      setViralRunning(false);
    }
  }, [
    user,
    currentNiche,
    setIdeas,
    setSelectedIdea,
    setCurrentScript,
    setScriptLoading,
    setUser,
  ]);

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Sparkles className="size-6 text-purple-400" />
          Viral Idea Engine
        </h1>
        <p className="text-muted-foreground mt-1">
          Generate viral content ideas powered by AI. Select a niche and let the
          algorithm find winning angles.
        </p>
      </div>

      {/* ── Niche Selector ─────────────────────────────────────── */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Select Your Niche
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {NICHES.map((niche) => {
            const isActive = currentNiche === niche.value;
            return (
              <motion.button
                key={niche.value}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setCurrentNiche(niche.value as NicheType)}
                className={`relative flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'border-purple-500 bg-purple-500/10 shadow-lg shadow-purple-500/10'
                    : 'border-border bg-card hover:border-purple-500/30'
                }`}
              >
                <span className="text-2xl">{niche.emoji}</span>
                <span
                  className={`text-xs font-medium text-center leading-tight ${
                    isActive ? 'text-purple-300' : 'text-muted-foreground'
                  }`}
                >
                  {niche.label}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="niche-active"
                    className="absolute inset-0 rounded-xl border-2 border-purple-500/50 pointer-events-none"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* ── Controls Row ───────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-4">
        <Button
          onClick={handleGenerateIdeas}
          disabled={ideasLoading || !user || user.credits < 1}
          className="bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white shadow-lg shadow-purple-500/20 px-6 py-5 text-base"
        >
          {ideasLoading ? (
            <Loader2 className="size-5 mr-2 animate-spin" />
          ) : (
            <Sparkles className="size-5 mr-2" />
          )}
          Generate Ideas
          {!ideasLoading && user && (
            <span className="ml-2 text-xs opacity-70">(-1 credit)</span>
          )}
        </Button>

        <div className="flex items-center gap-2">
          <Label className="text-sm text-muted-foreground">Count:</Label>
          <Select value={String(ideaCount)} onValueChange={(v) => setIdeaCount(Number(v))}>
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="15">15</SelectItem>
              <SelectItem value="20">20</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Switch
            id="extreme-toggle"
            checked={makeMoreExtreme}
            onCheckedChange={setMakeMoreExtreme}
          />
          <Label htmlFor="extreme-toggle" className="text-sm cursor-pointer">
            🔥 Make More Extreme
          </Label>
        </div>

        {user && (
          <span className="text-xs text-muted-foreground ml-auto">
            Credits: <span className="text-foreground font-semibold">{user.credits}</span>
          </span>
        )}
      </div>

      {/* ── Ideas Grid ─────────────────────────────────────────── */}
      {ideasLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: ideaCount > 12 ? 12 : ideaCount }).map((_, i) => (
            <IdeaSkeleton key={i} />
          ))}
        </div>
      ) : ideas.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {ideas.map((idea, index) => (
              <IdeaCard
                key={idea.id}
                idea={idea}
                isSelected={selectedIdea?.id === idea.id}
                onSelect={() => handleSelectIdea(idea)}
                onRegenerate={() => handleRegenerateIdea(index)}
              />
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <div className="text-5xl mb-4">💡</div>
          <h3 className="text-lg font-semibold text-foreground mb-1">
            No ideas yet
          </h3>
          <p className="text-muted-foreground text-sm">
            Select a niche and click &quot;Generate Ideas&quot; to get started
          </p>
        </motion.div>
      )}

      {/* ── 1-Click Viral Mode Button ──────────────────────────── */}
      <motion.div
        className="fixed bottom-6 right-6 z-50"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Button
          onClick={handleOneClickViral}
          disabled={viralRunning || !user || user.credits < 2}
          className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white shadow-2xl shadow-orange-500/30 px-6 py-6 text-base rounded-2xl"
          size="lg"
        >
          <Zap className="size-5 mr-2" />
          1-Click Viral Mode
          <span className="ml-2 text-xs opacity-70">(-2 credits)</span>
        </Button>
      </motion.div>

      {/* ── 1-Click Viral Dialog ───────────────────────────────── */}
      <Dialog open={viralDialogOpen} onOpenChange={setViralDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="size-5 text-amber-400" />
              1-Click Viral Mode
            </DialogTitle>
            <DialogDescription>
              AI is creating viral content for you automatically
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            {VIRAL_STEPS.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0.3, x: -10 }}
                animate={{
                  opacity: index <= viralStep ? 1 : 0.3,
                  x: 0,
                }}
                className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  index === viralStep && viralRunning
                    ? 'bg-purple-500/10 border border-purple-500/20'
                    : index < viralStep
                      ? 'bg-emerald-500/10 border border-emerald-500/20'
                      : 'bg-muted/50 border border-transparent'
                }`}
              >
                <span className="text-xl">{step.icon}</span>
                <span
                  className={`text-sm font-medium ${
                    index <= viralStep
                      ? 'text-foreground'
                      : 'text-muted-foreground'
                  }`}
                >
                  {step.label}
                </span>
                {index < viralStep && (
                  <Check className="size-4 text-emerald-400 ml-auto" />
                )}
                {index === viralStep && viralRunning && (
                  <Loader2 className="size-4 text-purple-400 ml-auto animate-spin" />
                )}
              </motion.div>
            ))}
          </div>

          {viralStep === 4 && !viralRunning && (
            <Button
              onClick={() => {
                setViralDialogOpen(false);
                setCurrentView('script-generator');
              }}
              className="w-full bg-gradient-to-r from-purple-600 to-purple-500 text-white"
            >
              View Script →
            </Button>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
