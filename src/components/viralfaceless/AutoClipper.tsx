'use client';

import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Scissors,
  Upload,
  Link,
  Loader2,
  Download,
  Copy,
  Check,
  Play,
  Clock,
  TrendingUp,
  Star,
  Subtitles,
  Film,
  Sparkles,
  Youtube,
} from 'lucide-react';
import { toast } from 'sonner';
import { useStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';

// ─── Mock clip type ─────────────────────────────────────────────
interface DetectedClip {
  id: string;
  title: string;
  startTime: number;
  endTime: number;
  duration: string;
  engagementScore: number;
  isBestMoment: boolean;
  hasSubtitles: boolean;
  highlights: string[];
}

// ─── Mock data generator ───────────────────────────────────────
function generateMockClips(url: string): DetectedClip[] {
  const baseClips: Omit<DetectedClip, 'id'>[] = [
    {
      title: 'Attention-grabbing intro',
      startTime: 0,
      endTime: 12,
      duration: '0:12',
      engagementScore: 92,
      isBestMoment: true,
      hasSubtitles: true,
      highlights: ['Hook', 'Visual impact'],
    },
    {
      title: 'Key revelation moment',
      startTime: 14,
      endTime: 28,
      duration: '0:14',
      engagementScore: 88,
      isBestMoment: false,
      hasSubtitles: true,
      highlights: ['Emotional peak', 'Reveal'],
    },
    {
      title: 'Educational segment',
      startTime: 30,
      endTime: 52,
      duration: '0:22',
      engagementScore: 75,
      isBestMoment: false,
      hasSubtitles: true,
      highlights: ['Value content', 'Screen recording'],
    },
    {
      title: 'Controversial take',
      startTime: 55,
      endTime: 71,
      duration: '0:16',
      engagementScore: 95,
      isBestMoment: false,
      hasSubtitles: true,
      highlights: ['Debate bait', 'Strong opinion'],
    },
    {
      title: 'Proof / demonstration',
      startTime: 73,
      endTime: 88,
      duration: '0:15',
      engagementScore: 82,
      isBestMoment: false,
      hasSubtitles: false,
      highlights: ['Evidence', 'Visual proof'],
    },
    {
      title: 'Emotional climax',
      startTime: 90,
      endTime: 110,
      duration: '0:20',
      engagementScore: 97,
      isBestMoment: true,
      hasSubtitles: true,
      highlights: ['Emotional peak', 'Story arc'],
    },
    {
      title: 'Call to action moment',
      startTime: 112,
      endTime: 125,
      duration: '0:13',
      engagementScore: 70,
      isBestMoment: false,
      hasSubtitles: true,
      highlights: ['CTA', 'Subscribe prompt'],
    },
  ];

  return baseClips.map((clip, i) => ({
    ...clip,
    id: `clip-${i}-${Date.now()}`,
  }));
}

// ─── Analysis Steps ─────────────────────────────────────────────
const ANALYSIS_STEPS = [
  { label: 'Downloading video...', icon: '⬇️' },
  { label: 'Analyzing audio track...', icon: '🔊' },
  { label: 'Detecting scene changes...', icon: '🎬' },
  { label: 'Finding highlights...', icon: '⭐' },
  { label: 'Scoring engagement potential...', icon: '📊' },
  { label: 'Generating clips...', icon: '✂️' },
];

// ─── Engagement Score Color ─────────────────────────────────────
function scoreColor(score: number): string {
  if (score >= 90) return 'text-emerald-400';
  if (score >= 75) return 'text-amber-400';
  return 'text-red-400';
}

function scoreBg(score: number): string {
  if (score >= 90) return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
  if (score >= 75) return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
  return 'bg-red-500/15 text-red-400 border-red-500/30';
}

// ─── Clip Card ──────────────────────────────────────────────────
function ClipCard({
  clip,
  onToggleSubtitles,
}: {
  clip: DetectedClip;
  onToggleSubtitles: (id: string) => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(clip.title);
    setCopied(true);
    toast.success('Clip info copied!');
    setTimeout(() => setCopied(false), 2000);
  }, [clip.title]);

  const handleDownload = useCallback(() => {
    toast.info('Download starting...', {
      description: `"${clip.title}" - ${clip.duration}`,
    });
  }, [clip.title, clip.duration]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
    >
      <Card
        className={`p-4 transition-all ${
          clip.isBestMoment
            ? 'border-amber-500/30 shadow-lg shadow-amber-500/5'
            : ''
        }`}
      >
        <div className="flex gap-4">
          {/* Thumbnail placeholder */}
          <div className="w-28 h-20 rounded-lg bg-muted flex items-center justify-center shrink-0 overflow-hidden relative">
            <Film className="size-8 text-muted-foreground/50" />
            <div className="absolute bottom-1 right-1 bg-black/70 rounded px-1 py-0.5">
              <span className="text-[10px] text-white font-mono">
                {clip.duration}
              </span>
            </div>
            {clip.isBestMoment && (
              <div className="absolute top-1 left-1 bg-amber-500 rounded px-1 py-0.5">
                <span className="text-[9px] text-white font-bold flex items-center gap-0.5">
                  <Star className="size-2.5" /> BEST
                </span>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <h4 className="text-sm font-semibold text-foreground leading-tight">
                {clip.title}
              </h4>
              <Badge variant="outline" className={scoreBg(clip.engagementScore)}>
                <TrendingUp className="size-3 mr-1" />
                {clip.engagementScore}
              </Badge>
            </div>

            {/* Timeline marker */}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
              <Clock className="size-3" />
              <span>{clip.duration}</span>
              <span className="text-muted-foreground/50">•</span>
              <span>{clip.highlights.join(', ')}</span>
            </div>

            {/* Highlight tags */}
            <div className="flex flex-wrap gap-1 mb-3">
              {clip.highlights.map((h, i) => (
                <Badge
                  key={i}
                  variant="secondary"
                  className="text-[10px] px-1.5 py-0"
                >
                  {h}
                </Badge>
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCopy}
                className="h-7 px-2 text-muted-foreground hover:text-foreground"
              >
                {copied ? (
                  <Check className="size-3.5 text-emerald-400" />
                ) : (
                  <Copy className="size-3.5" />
                )}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDownload}
                className="h-7 px-2 text-muted-foreground hover:text-foreground"
              >
                <Download className="size-3.5" />
              </Button>
              <div className="ml-auto flex items-center gap-1.5">
                <Label
                  htmlFor={`subs-${clip.id}`}
                  className="text-xs text-muted-foreground cursor-pointer flex items-center gap-1"
                >
                  <Subtitles className="size-3" />
                  Subs
                </Label>
                <Switch
                  id={`subs-${clip.id}`}
                  checked={clip.hasSubtitles}
                  onCheckedChange={() => onToggleSubtitles(clip.id)}
                />
              </div>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

// ─── Main Component ─────────────────────────────────────────────
export default function AutoClipper() {
  const { user } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [videoUrl, setVideoUrl] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(-1);
  const [clips, setClips] = useState<DetectedClip[]>([]);
  const [inputMode, setInputMode] = useState<'url' | 'upload'>('url');

  // ── Toggle subtitles on a clip ───────────────────────────────
  const handleToggleSubtitles = useCallback((id: string) => {
    setClips((prev) =>
      prev.map((c) => (c.id === id ? { ...c, hasSubtitles: !c.hasSubtitles } : c))
    );
  }, []);

  // ── Analyze video ───────────────────────────────────────────
  const handleAnalyze = useCallback(async () => {
    if (inputMode === 'url' && !videoUrl.trim()) {
      toast.error('Please enter a video URL');
      return;
    }
    if (!user || user.credits < 1) {
      toast.error('Not enough credits! Purchase more to continue.');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisStep(0);
    setClips([]);

    try {
      // Simulate step-by-step progress
      for (let i = 0; i < ANALYSIS_STEPS.length; i++) {
        setAnalysisStep(i);
        await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 500));
      }

      // Generate mock clips
      const mockClips = generateMockClips(videoUrl || 'uploaded-video');
      setClips(mockClips);
      toast.success(`Found ${mockClips.length} viral clips!`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  }, [inputMode, videoUrl, user]);

  // ── Drag & Drop handlers ────────────────────────────────────
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('video/')) {
        toast.success(`Video "${file.name}" selected for analysis`);
      } else {
        toast.error('Please drop a video file (MP4, MOV, AVI)');
      }
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      toast.success(`Video "${file.name}" selected for analysis`);
    }
  }, []);

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Scissors className="size-6 text-purple-400" />
          Auto Clipper
        </h1>
        <p className="text-muted-foreground mt-1">
          Upload a video or paste a YouTube URL. AI will find the most viral moments and
          create clips automatically.
        </p>
      </div>

      {/* ── Input Mode Toggle ──────────────────────────────── */}
      <div className="flex gap-2">
        <Button
          variant={inputMode === 'url' ? 'default' : 'outline'}
          onClick={() => setInputMode('url')}
          className={inputMode === 'url' ? 'bg-purple-600 text-white' : ''}
          size="sm"
        >
          <Link className="size-4 mr-1.5" />
          YouTube URL
        </Button>
        <Button
          variant={inputMode === 'upload' ? 'default' : 'outline'}
          onClick={() => setInputMode('upload')}
          className={inputMode === 'upload' ? 'bg-purple-600 text-white' : ''}
          size="sm"
        >
          <Upload className="size-4 mr-1.5" />
          Upload File
        </Button>
      </div>

      {/* ── URL Input ──────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {inputMode === 'url' ? (
          <motion.div
            key="url-input"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
          >
            <Card>
              <CardContent className="py-4">
                <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
                  YouTube URL
                </Label>
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <Youtube className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      placeholder="https://youtube.com/watch?v=..."
                      className="pl-10"
                      disabled={isAnalyzing}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            key="upload-input"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
          >
            <Card>
              <CardContent className="py-4">
                <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
                  Upload Video
                </Label>
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                    isDragging
                      ? 'border-purple-500 bg-purple-500/10'
                      : 'border-border hover:border-purple-500/50 bg-muted/30'
                  }`}
                >
                  <Upload
                    className={`size-10 mx-auto mb-3 ${
                      isDragging ? 'text-purple-400' : 'text-muted-foreground'
                    }`}
                  />
                  <p className="text-sm font-medium text-foreground mb-1">
                    {isDragging
                      ? 'Drop your video here'
                      : 'Drag & drop your video here'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Supports MP4, MOV, AVI (max 500MB)
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Analyze Button ────────────────────────────────── */}
      <Button
        onClick={handleAnalyze}
        disabled={isAnalyzing || !user || user.credits < 1}
        className="w-full bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white shadow-lg shadow-purple-500/20 py-5 text-base"
      >
        {isAnalyzing ? (
          <Loader2 className="size-5 mr-2 animate-spin" />
        ) : (
          <Scissors className="size-5 mr-2" />
        )}
        Analyze Video
        {!isAnalyzing && user && (
          <span className="ml-2 text-xs opacity-70">(-1 credit)</span>
        )}
      </Button>

      {/* ── Analysis Progress ──────────────────────────────── */}
      <AnimatePresence>
        {isAnalyzing && analysisStep >= 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            <Card className="border-purple-500/20">
              <CardContent className="py-4 space-y-3">
                <div className="flex items-center gap-3">
                  <Loader2 className="size-5 text-purple-400 animate-spin" />
                  <span className="text-sm font-medium text-foreground">
                    AI is analyzing your video...
                  </span>
                </div>
                <Progress
                  value={((analysisStep + 1) / ANALYSIS_STEPS.length) * 100}
                  className="h-2"
                />
                <div className="space-y-2">
                  {ANALYSIS_STEPS.map((step, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-2 text-xs transition-colors ${
                        i <= analysisStep
                          ? 'text-foreground'
                          : 'text-muted-foreground/40'
                      }`}
                    >
                      <span>{step.icon}</span>
                      <span>{step.label}</span>
                      {i < analysisStep && (
                        <Check className="size-3 text-emerald-400 ml-auto" />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Results ───────────────────────────────────────── */}
      <AnimatePresence>
        {clips.length > 0 && !isAnalyzing && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {/* Results header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Sparkles className="size-5 text-amber-400" />
                  Detected Clips
                </h2>
                <p className="text-sm text-muted-foreground">
                  {clips.length} clips found •{' '}
                  {clips.filter((c) => c.isBestMoment).length} best moments
                </p>
              </div>
              <Badge
                variant="outline"
                className="bg-purple-500/15 text-purple-400 border-purple-500/30"
              >
                Avg Score: {Math.round(clips.reduce((a, c) => a + c.engagementScore, 0) / clips.length)}
              </Badge>
            </div>

            {/* Timeline overview */}
            <Card>
              <CardContent className="py-3">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">
                  Timeline Overview
                </Label>
                <div className="relative h-6 bg-muted rounded-lg overflow-hidden">
                  {clips.map((clip, i) => {
                    const totalDuration = Math.max(
                      ...clips.map((c) => c.endTime),
                      130
                    );
                    const left = (clip.startTime / totalDuration) * 100;
                    const width = ((clip.endTime - clip.startTime) / totalDuration) * 100;
                    const hue = (i * 47 + 280) % 360;
                    return (
                      <motion.div
                        key={clip.id}
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ delay: i * 0.08 }}
                        style={{
                          position: 'absolute',
                          left: `${left}%`,
                          width: `${width}%`,
                          top: 0,
                          bottom: 0,
                          transformOrigin: 'left',
                          backgroundColor:
                            clip.engagementScore >= 90
                              ? 'rgba(16, 185, 129, 0.5)'
                              : clip.engagementScore >= 75
                                ? 'rgba(245, 158, 11, 0.4)'
                                : 'rgba(239, 68, 68, 0.3)',
                        }}
                        className={`rounded-sm ${clip.isBestMoment ? 'ring-2 ring-amber-400/50' : ''}`}
                        title={clip.title}
                      />
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Clips List */}
            <div className="space-y-3">
              <AnimatePresence>
                {clips
                  .sort((a, b) => b.engagementScore - a.engagementScore)
                  .map((clip) => (
                    <ClipCard
                      key={clip.id}
                      clip={clip}
                      onToggleSubtitles={handleToggleSubtitles}
                    />
                  ))}
              </AnimatePresence>
            </div>

            <Separator />

            {/* Bulk actions */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
                onClick={() => toast.info('Downloading all clips...')}
              >
                <Download className="size-4 mr-2" />
                Download All Clips
              </Button>
              <Button
                variant="outline"
                className="flex-1 border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
                onClick={() =>
                  toast.success(
                    `${clips.filter((c) => c.hasSubtitles).length} clips with subtitles ready`
                  )
                }
              >
                <Subtitles className="size-4 mr-2" />
                Add Subtitles to All
              </Button>
            </div>

            {/* UI mock notice */}
            <div className="bg-muted/50 border border-dashed border-border rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground">
                🧪 <strong>UI Preview Mode</strong> — Actual video processing requires FFmpeg
                on the server. Clips shown are AI-generated suggestions based on the analysis
                pipeline.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
