'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Video,
  Film,
  Clapperboard,
  Subtitles,
  Image as ImageIcon,
  Scissors,
  Type,
  Download,
  Loader2,
  Check,
  Clock,
  Zap,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { useStore } from '@/lib/store';
import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import type { VideoPlan, SubtitleSegment, BRollSuggestion } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// ─── Video Styles ───────────────────────────────────────────────
const VIDEO_STYLES = [
  { value: 'cinematic', labelKey: 'video.style.cinematic', icon: '🎬', descKey: 'video.style.cinematicDesc' },
  { value: 'tiktok-fast', labelKey: 'video.style.tiktok', icon: '⚡', descKey: 'video.style.tiktokDesc' },
  { value: 'documentary', labelKey: 'video.style.documentary', icon: '📹', descKey: 'video.style.documentaryDesc' },
  { value: 'minimal', labelKey: 'video.style.minimal', icon: '✨', descKey: 'video.style.minimalDesc' },
] as const;

// ─── Generation Steps ───────────────────────────────────────────
const GEN_STEPS = [
  { labelKey: 'video.analyzing', icon: '📝' },
  { labelKey: 'video.genSubtitles', icon: '💬' },
  { labelKey: 'video.matchingBroll', icon: '🎬' },
  { labelKey: 'video.planningCuts', icon: '✂️' },
  { labelKey: 'video.finalizing', icon: '✅' },
];

// ─── Format timestamp ───────────────────────────────────────────
function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// ─── Subtitle Timeline Component ────────────────────────────────
function SubtitleTimeline({ subtitles, cutPoints }: { subtitles: SubtitleSegment[]; cutPoints: number[] }) {
  const { t } = useI18n();
  if (!subtitles.length) return null;
  const maxTime = Math.max(...subtitles.map((s) => s.endTime), 60);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Subtitles className="size-4 text-purple-400" />
          {t('video.subtitles')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Visual timeline bar */}
        <div className="relative h-8 bg-muted rounded-lg overflow-hidden mb-4">
          {subtitles.map((sub, i) => {
            const left = (sub.startTime / maxTime) * 100;
            const width = ((sub.endTime - sub.startTime) / maxTime) * 100;
            const hue = (i * 47) % 360;
            return (
              <motion.div
                key={i}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: i * 0.05, duration: 0.3 }}
                style={{
                  position: 'absolute',
                  left: `${left}%`,
                  width: `${width}%`,
                  top: 0,
                  bottom: 0,
                  transformOrigin: 'left',
                }}
                className={`rounded-sm ${
                  sub.highlight
                    ? 'bg-purple-500/60 border-y-2 border-purple-400'
                    : `bg-purple-400/30`
                }`}
              />
            );
          })}
          {/* Cut point markers */}
          {cutPoints.map((point, i) => {
            const left = (point / maxTime) * 100;
            return (
              <div
                key={`cut-${i}`}
                className="absolute top-0 bottom-0 w-0.5 bg-red-400 z-10"
                style={{ left: `${left}%` }}
              >
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-red-400 rounded-full" />
              </div>
            );
          })}
        </div>

        {/* Time markers */}
        <div className="flex justify-between text-[10px] text-muted-foreground mb-3">
          <span>0:00</span>
          <span>{formatTime(maxTime / 4)}</span>
          <span>{formatTime(maxTime / 2)}</span>
          <span>{formatTime((maxTime * 3) / 4)}</span>
          <span>{formatTime(maxTime)}</span>
        </div>

        {/* Subtitle list */}
        <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
          {subtitles.map((sub, i) => (
            <div
              key={i}
              className={`flex items-start gap-2 p-2 rounded-md text-sm ${
                sub.highlight
                  ? 'bg-purple-500/10 border border-purple-500/20'
                  : 'bg-muted/50'
              }`}
            >
              <span className="text-xs text-muted-foreground font-mono whitespace-nowrap mt-0.5">
                {formatTime(sub.startTime)} - {formatTime(sub.endTime)}
              </span>
              <span className="text-foreground/90">{sub.text}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── B-Roll Suggestions Component ───────────────────────────────
function BRollSuggestions({ bRolls }: { bRolls: BRollSuggestion[] }) {
  const { t } = useI18n();
  if (!bRolls.length) return null;

  const COLORS = [
    'border-blue-500/20 bg-blue-500/5',
    'border-amber-500/20 bg-amber-500/5',
    'border-emerald-500/20 bg-emerald-500/5',
    'border-pink-500/20 bg-pink-500/5',
    'border-cyan-500/20 bg-cyan-500/5',
    'border-violet-500/20 bg-violet-500/5',
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <ImageIcon className="size-4 text-amber-400" />
          {t('video.brollSuggestions')}
          <Badge variant="outline" className="ml-auto">{t('video.matches').replace('{n}', bRolls.length.toString())}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {bRolls.map((bRoll, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`border rounded-lg p-3 ${COLORS[i % COLORS.length]}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground font-mono mb-1">
                    @{formatTime(bRoll.timestamp)}
                  </p>
                  <p className="text-sm text-foreground/80 italic mb-1">
                    &quot;{bRoll.sentence}&quot;
                  </p>
                  <div className="flex items-center gap-1.5">
                    <Film className="size-3 text-amber-400" />
                    <p className="text-sm font-medium text-foreground">
                      {bRoll.footageDescription}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Keyword Highlights ─────────────────────────────────────────
function KeywordHighlights({ keywords }: { keywords: string[] }) {
  const { t } = useI18n();
  if (!keywords.length) return null;

  const COLORS = [
    'bg-purple-500/15 text-purple-400 border-purple-500/30',
    'bg-blue-500/15 text-blue-400 border-blue-500/30',
    'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    'bg-amber-500/15 text-amber-400 border-amber-500/30',
    'bg-pink-500/15 text-pink-400 border-pink-500/30',
    'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Type className="size-4 text-cyan-400" />
          {t('video.keywordHighlights')}
          <Badge variant="outline" className="ml-auto">{t('video.keywords').replace('{n}', keywords.length.toString())}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {keywords.map((kw, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
            >
              <Badge
                variant="outline"
                className={`text-xs ${COLORS[i % COLORS.length]}`}
              >
                {kw}
              </Badge>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Summary Card ───────────────────────────────────────────────
function SummaryCard({ plan }: { plan: VideoPlan }) {
  const { t } = useI18n();
  const totalDuration = plan.subtitles.length
    ? Math.max(...plan.subtitles.map((s) => s.endTime))
    : 0;
  const cutCount = plan.cutPoints.length;
  const bRollCount = plan.bRolls.length;

  return (
    <Card className="border-purple-500/20 bg-gradient-to-r from-purple-500/5 to-transparent">
      <CardContent className="py-4">
        <h3 className="text-sm font-semibold text-purple-400 uppercase tracking-wider mb-3">
          {t('video.summary')}
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Clock className="size-4 text-foreground" />
            </div>
            <p className="text-lg font-bold text-foreground">{formatTime(totalDuration)}</p>
            <p className="text-xs text-muted-foreground">{t('video.duration')}</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Scissors className="size-4 text-foreground" />
            </div>
            <p className="text-lg font-bold text-foreground">{cutCount}</p>
            <p className="text-xs text-muted-foreground">{t('video.cutPoints')}</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Film className="size-4 text-foreground" />
            </div>
            <p className="text-lg font-bold text-foreground">{bRollCount}</p>
            <p className="text-xs text-muted-foreground">{t('video.broll')}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Component ─────────────────────────────────────────────
export default function VideoGenerator() {
  const { t } = useI18n();
  const {
    user,
    currentScript,
    videoPlan,
    videoLoading,
    setVideoPlan,
    setVideoLoading,
    setUser,
  } = useStore();

  const [scriptText, setScriptText] = useState('');
  const [videoStyle, setVideoStyle] = useState('tiktok-fast');
  const [genStep, setGenStep] = useState(-1);

  // Populate from current script
  useEffect(() => {
    if (currentScript?.fullScript && !scriptText) {
      setScriptText(currentScript.fullScript);
    }
  }, [currentScript, scriptText]);

  // ── Generate Video Plan ──────────────────────────────────────
  const handleGeneratePlan = useCallback(async () => {
    const textToUse = scriptText || currentScript?.fullScript;
    if (!textToUse?.trim()) {
      toast.error(t('video.needScript'));
      return;
    }
    if (!user || user.credits < 1) {
      toast.error(t('video.notEnoughCredits'));
      return;
    }

    setVideoLoading(true);
    setVideoPlan(null);
    setGenStep(0);

    try {
      // Simulate step progression
      const stepTimer = setInterval(() => {
        setGenStep((prev) => {
          if (prev >= GEN_STEPS.length - 1) {
            clearInterval(stepTimer);
            return prev;
          }
          return prev + 1;
        });
      }, 800);

      const data = await api.videos.generate(textToUse, videoStyle);
      clearInterval(stepTimer);
      setGenStep(GEN_STEPS.length - 1);

      setVideoPlan(data.videoPlan);
      if (data.remainingCredits !== undefined) {
        setUser({ ...user, credits: data.remainingCredits });
      }
      toast.success(t('video.generated'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('video.failed'));
    } finally {
      setVideoLoading(false);
    }
  }, [scriptText, currentScript, videoStyle, user, setVideoPlan, setVideoLoading, setUser, t]);

  // ── Export Plan ──────────────────────────────────────────────
  const handleExportPlan = useCallback(() => {
    if (!videoPlan) return;
    const json = JSON.stringify(videoPlan, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `video-plan-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(t('video.exported'));
  }, [videoPlan, t]);

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Video className="size-6 text-purple-400" />
          {t('video.title')}
        </h1>
        <p className="text-muted-foreground mt-1">
          {t('video.subtitle')}
        </p>
      </div>

      {/* ── Script Input ───────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clapperboard className="size-4 text-purple-400" />
            {t('video.script')}
          </CardTitle>
          <CardDescription>
            {currentScript?.fullScript
              ? t('video.usingScript')
              : t('video.pasteScript')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={scriptText || currentScript?.fullScript || ''}
            onChange={(e) => setScriptText(e.target.value)}
            rows={6}
            className="bg-background border-border text-sm resize-y"
            placeholder={t('video.pastePlaceholder')}
          />
        </CardContent>
      </Card>

      {/* ── Video Style ────────────────────────────────────── */}
      <div>
        <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 block">
          {t('video.style')}
        </Label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {VIDEO_STYLES.map((vs) => {
            const isActive = videoStyle === vs.value;
            return (
              <motion.button
                key={vs.value}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setVideoStyle(vs.value)}
                className={`relative flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all cursor-pointer ${
                  isActive
                    ? 'border-purple-500 bg-purple-500/10 shadow-lg shadow-purple-500/10'
                    : 'border-border bg-card hover:border-purple-500/30'
                }`}
              >
                <span className="text-2xl">{vs.icon}</span>
                <span className={`text-xs font-semibold ${isActive ? 'text-purple-300' : 'text-foreground'}`}>
                  {t(vs.labelKey)}
                </span>
                <span className="text-[10px] text-muted-foreground text-center leading-tight">
                  {t(vs.descKey)}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* ── Generate Button ────────────────────────────────── */}
      <Button
        onClick={handleGeneratePlan}
        disabled={videoLoading || !user || user.credits < 1}
        className="w-full bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white shadow-lg shadow-purple-500/20 py-5 text-base"
      >
        {videoLoading ? (
          <Loader2 className="size-5 mr-2 animate-spin" />
        ) : (
          <Video className="size-5 mr-2" />
        )}
        {t('video.generate')}
        {!videoLoading && user && (
          <span className="ml-2 text-xs opacity-70">{t('common.credit')}</span>
        )}
      </Button>

      {/* ── Loading Steps ──────────────────────────────────── */}
      <AnimatePresence>
        {videoLoading && genStep >= 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-2"
          >
            {GEN_STEPS.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0.3 }}
                animate={{ opacity: i <= genStep ? 1 : 0.3 }}
                className={`flex items-center gap-3 p-2.5 rounded-lg transition-colors ${
                  i === genStep
                    ? 'bg-purple-500/10 border border-purple-500/20'
                    : i < genStep
                      ? 'bg-emerald-500/5'
                      : 'bg-muted/30'
                }`}
              >
                <span className="text-base">{step.icon}</span>
                <span
                  className={`text-sm ${
                    i <= genStep ? 'text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  {t(step.labelKey)}
                </span>
                {i < genStep && <Check className="size-4 text-emerald-400 ml-auto" />}
                {i === genStep && (
                  <Loader2 className="size-4 text-purple-400 ml-auto animate-spin" />
                )}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Video Plan Output ──────────────────────────────── */}
      <AnimatePresence>
        {videoPlan && !videoLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {/* Summary */}
            <SummaryCard plan={videoPlan} />

            {/* Subtitles Timeline */}
            <SubtitleTimeline
              subtitles={videoPlan.subtitles}
              cutPoints={videoPlan.cutPoints}
            />

            {/* B-Roll Suggestions */}
            <BRollSuggestions bRolls={videoPlan.bRolls} />

            {/* Keywords */}
            <KeywordHighlights keywords={videoPlan.keywordHighlights} />

            {/* Export */}
            <Button
              onClick={handleExportPlan}
              variant="outline"
              className="w-full border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
            >
              <Download className="size-4 mr-2" />
              {t('video.exportJson')}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
