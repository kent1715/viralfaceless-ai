'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic,
  Play,
  Pause,
  Download,
  Volume2,
  Loader2,
  Cloud,
  Monitor,
  Info,
} from 'lucide-react';
import { toast } from 'sonner';
import { useStore } from '@/lib/store';
import { api } from '@/lib/api';
import { TTS_PROVIDERS, EDGE_TTS_VOICES, GOOGLE_TTS_VOICES } from '@/lib/constants';
import type { TTSVoice, TTSProvider } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// ─── Waveform Bars Component ────────────────────────────────────
function WaveformBars({ isPlaying, barCount = 32 }: { isPlaying: boolean; barCount?: number }) {
  return (
    <div className="flex items-center justify-center gap-[2px] h-16">
      {Array.from({ length: barCount }).map((_, i) => (
        <motion.div
          key={i}
          className="w-[3px] rounded-full bg-purple-400"
          animate={
            isPlaying
              ? { height: [4, Math.random() * 48 + 8, 4] }
              : { height: 4 }
          }
          transition={
            isPlaying
              ? {
                  repeat: Infinity,
                  duration: 0.6 + Math.random() * 0.8,
                  delay: i * 0.03,
                  ease: 'easeInOut',
                }
              : { duration: 0.3 }
          }
        />
      ))}
    </div>
  );
}

// ─── Audio Player Component ─────────────────────────────────────
function AudioPlayer({ audioUrl, provider }: { audioUrl: string; provider: TTSProvider }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoading(false);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', () => {
      setIsLoading(false);
      toast.error('Failed to load audio');
    });

    return () => {
      audio.pause();
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [audioUrl]);

  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      if (intervalRef.current) clearInterval(intervalRef.current);
    } else {
      audioRef.current.play();
      intervalRef.current = setInterval(() => {
        setCurrentTime(audioRef.current?.currentTime || 0);
      }, 100);
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const handleSeek = useCallback((value: number[]) => {
    const time = value[0];
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  const handleDownload = useCallback(() => {
    const link = document.createElement('a');
    link.href = audioUrl;
    link.download = `viralfaceless-tts-${provider}-${Date.now()}.mp3`;
    link.click();
    toast.success('Audio download started!');
  }, [audioUrl, provider]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <Card className="border-purple-500/20 bg-purple-500/5">
      <CardContent className="pt-4 space-y-4">
        {/* Provider badge */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {provider === 'google' ? (
              <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30" variant="outline">
                <Cloud className="size-3 mr-1" />
                Google Cloud TTS
              </Badge>
            ) : (
              <Badge className="bg-blue-500/15 text-blue-400 border-blue-500/30" variant="outline">
                <Monitor className="size-3 mr-1" />
                Microsoft Edge TTS
              </Badge>
            )}
          </div>
        </div>

        {/* Waveform */}
        <WaveformBars isPlaying={isPlaying} />

        {/* Progress */}
        <div className="space-y-1">
          <Slider
            value={[currentTime]}
            min={0}
            max={duration || 100}
            step={0.1}
            onValueChange={handleSeek}
            className="cursor-pointer"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-3">
          <Button
            size="lg"
            className={`w-14 h-14 rounded-full shadow-lg text-white ${
              provider === 'google'
                ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 shadow-emerald-500/20'
                : 'bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 shadow-purple-500/20'
            }`}
            onClick={togglePlay}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="size-6 animate-spin" />
            ) : isPlaying ? (
              <Pause className="size-6" />
            ) : (
              <Play className="size-6 ml-0.5" />
            )}
          </Button>

          <Button
            size="icon"
            variant="outline"
            onClick={handleDownload}
            className="h-10 w-10"
          >
            <Download className="size-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Provider Tab Component ─────────────────────────────────────
function ProviderTab({
  provider,
  isActive,
  onClick,
}: {
  provider: typeof TTS_PROVIDERS[number];
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`relative flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all cursor-pointer flex-1 ${
        isActive
          ? provider.value === 'google'
            ? 'border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/10'
            : 'border-purple-500 bg-purple-500/10 shadow-lg shadow-purple-500/10'
          : 'border-border bg-card hover:border-muted-foreground/30'
      }`}
    >
      <div
        className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
          isActive
            ? provider.value === 'google'
              ? 'bg-emerald-500/20'
              : 'bg-purple-500/20'
            : 'bg-muted'
        }`}
      >
        {provider.value === 'google' ? (
          <Cloud className={`size-4 ${isActive ? 'text-emerald-400' : 'text-muted-foreground'}`} />
        ) : (
          <Monitor className={`size-4 ${isActive ? 'text-purple-400' : 'text-muted-foreground'}`} />
        )}
      </div>
      <div className="text-left">
        <p
          className={`text-sm font-semibold leading-tight ${
            isActive ? 'text-foreground' : 'text-muted-foreground'
          }`}
        >
          {provider.label}
        </p>
        <p className="text-[10px] text-muted-foreground">{provider.description}</p>
      </div>
      {provider.badge && (
        <Badge
          variant="outline"
          className={`ml-auto text-[10px] ${
            provider.badge === 'Free'
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
          }`}
        >
          {provider.badge}
        </Badge>
      )}
    </motion.button>
  );
}

// ─── Voice Card Component ───────────────────────────────────────
function VoiceCard({
  voice,
  isActive,
  provider,
  onSelect,
  onPreview,
}: {
  voice: { value: string; label: string; description: string };
  isActive: boolean;
  provider: TTSProvider;
  onSelect: () => void;
  onPreview: () => void;
}) {
  const accentColor = provider === 'google'
    ? 'border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/10'
    : 'border-purple-500 bg-purple-500/10 shadow-lg shadow-purple-500/10';
  const hoverColor = provider === 'google'
    ? 'hover:border-emerald-500/30'
    : 'hover:border-purple-500/30';
  const iconBg = isActive
    ? provider === 'google'
      ? 'bg-emerald-500/20'
      : 'bg-purple-500/20'
    : 'bg-muted';
  const iconColor = isActive
    ? provider === 'google'
      ? 'text-emerald-400'
      : 'text-purple-400'
    : 'text-muted-foreground';
  const textColor = isActive
    ? provider === 'google'
      ? 'text-emerald-300'
      : 'text-purple-300'
    : 'text-foreground';
  const layoutId = provider === 'google' ? 'voice-active-google' : 'voice-active-edge';

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
      className={`relative flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all cursor-pointer ${
        isActive ? accentColor : `border-border bg-card ${hoverColor}`
      }`}
    >
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${iconBg}`}>
        <Volume2 className={`size-5 ${iconColor}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${textColor}`}>{voice.label}</p>
        <p className="text-xs text-muted-foreground truncate">{voice.description}</p>
      </div>
      <Button
        size="icon"
        variant="ghost"
        className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
        onClick={(e) => {
          e.stopPropagation();
          onPreview();
        }}
      >
        <Play className="size-3" />
      </Button>
      {isActive && (
        <motion.div
          layoutId={layoutId}
          className={`absolute inset-0 rounded-xl border-2 pointer-events-none ${
            provider === 'google' ? 'border-emerald-500/40' : 'border-purple-500/40'
          }`}
          transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
        />
      )}
    </motion.button>
  );
}

// ─── Main Component ─────────────────────────────────────────────
export default function TTSEngine() {
  const {
    user,
    currentScript,
    ttsAudioUrl,
    ttsLoading,
    setTtsAudioUrl,
    setTtsLoading,
    setUser,
  } = useStore();

  const [text, setText] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<TTSProvider>('edge');
  const [selectedVoice, setSelectedVoice] = useState<TTSVoice>('gadis');
  const [speed, setSpeed] = useState(1.0);
  const [activeProvider, setActiveProvider] = useState<TTSProvider>('edge');

  // Voice lists based on current provider
  const currentVoices = selectedProvider === 'google' ? GOOGLE_TTS_VOICES : EDGE_TTS_VOICES;

  // Auto-select first voice when provider changes
  useEffect(() => {
    const voices = selectedProvider === 'google' ? GOOGLE_TTS_VOICES : EDGE_TTS_VOICES;
    if (voices.length > 0) {
      setSelectedVoice(voices[0].value as TTSVoice);
    }
  }, [selectedProvider]);

  // Populate text from current script when available
  useEffect(() => {
    if (currentScript?.fullScript && !text) {
      setText(currentScript.fullScript);
    }
  }, [currentScript, text]);

  // ── Generate TTS ──────────────────────────────────────────────
  const handleGenerateTTS = useCallback(async () => {
    if (!text.trim()) {
      toast.error('Please enter text to convert to speech');
      return;
    }
    if (!user || user.credits < 1) {
      toast.error('Not enough credits! Purchase more to continue.');
      return;
    }

    setTtsLoading(true);
    setTtsAudioUrl(null);

    try {
      const response = await api.tts.generate(text, selectedVoice, speed, selectedProvider);
      const blob = await response.blob();

      if (!blob.type.includes('audio') && blob.size < 200) {
        // Got an error response instead of audio
        const errData = await blob.json().catch(() => ({}));
        throw new Error((errData as { error?: string }).error || 'Failed to generate voice');
      }

      const url = URL.createObjectURL(blob);
      setTtsAudioUrl(url);
      setActiveProvider(selectedProvider);
      if (response.headers) {
        const remaining = response.headers.get('x-remaining-credits');
        if (remaining) {
          setUser({ ...user, credits: parseInt(remaining, 10) });
        }
      }
      toast.success(`${selectedProvider === 'google' ? 'Google Cloud TTS' : 'Edge TTS'} voice generated!`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to generate voice');
    } finally {
      setTtsLoading(false);
    }
  }, [text, selectedVoice, speed, selectedProvider, user, setTtsAudioUrl, setTtsLoading, setUser]);

  // ── Preview voice ─────────────────────────────────────────────
  const handlePreviewVoice = useCallback(async (voiceId: string) => {
    try {
      setTtsLoading(true);
      const response = await api.tts.generate(
        `Hi! This is a preview of the ${voiceId} voice. I hope you like it!`,
        voiceId as TTSVoice,
        1.0,
        selectedProvider
      );
      const blob = await response.blob();

      if (!blob.type.includes('audio') && blob.size < 200) {
        const errData = await blob.json().catch(() => ({}));
        throw new Error((errData as { error?: string }).error || 'Failed to preview');
      }

      const url = URL.createObjectURL(blob);
      setTtsAudioUrl(url);
      setActiveProvider(selectedProvider);
      toast.success(`Playing preview`);
    } catch {
      toast.error('Failed to play preview');
    } finally {
      setTtsLoading(false);
    }
  }, [selectedProvider, setTtsAudioUrl, setTtsLoading]);

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* ── Header ───────────────────────────────────────────── */}
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Mic className="size-6 text-purple-400" />
            Text-to-Speech Engine
          </h1>
          <p className="text-muted-foreground mt-1">
            Convert your scripts into natural-sounding voiceovers with AI-powered TTS.
          </p>
        </div>

        {/* ── Provider Selection ──────────────────────────────── */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              TTS Provider
            </Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="size-3.5 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <p><strong>Edge TTS</strong> — Free, Microsoft Neural voices via edge-tts</p>
                <p className="mt-1"><strong>Google Cloud TTS</strong> — Premium Neural2 voices (requires API key)</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="flex gap-3">
            {TTS_PROVIDERS.map((provider) => (
              <ProviderTab
                key={provider.value}
                provider={provider}
                isActive={selectedProvider === provider.value}
                onClick={() => setSelectedProvider(provider.value)}
              />
            ))}
          </div>
        </div>

        {/* ── Text Input ───────────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Script Text
            </Label>
            <span className="text-xs text-muted-foreground">
              {text.length} characters
            </span>
          </div>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={8}
            className="bg-background border-border text-sm resize-y"
            placeholder="Paste or type your script here... The AI will convert it to speech."
          />
        </div>

        {/* ── Voice Selection ──────────────────────────────────── */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Select Voice
            </Label>
            <Badge
              variant="outline"
              className={`text-[10px] ${
                selectedProvider === 'google'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-purple-500/10 text-purple-400 border-purple-500/30'
              }`}
            >
              {currentVoices.length} voices
            </Badge>
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedProvider}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3"
            >
              {currentVoices.map((voice) => (
                <VoiceCard
                  key={voice.value}
                  voice={voice}
                  isActive={selectedVoice === voice.value}
                  provider={selectedProvider}
                  onSelect={() => setSelectedVoice(voice.value as TTSVoice)}
                  onPreview={() => handlePreviewVoice(voice.value)}
                />
              ))}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── Speed Control ────────────────────────────────────── */}
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between mb-3">
              <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Speed Control
              </Label>
              <Badge variant="outline" className="font-mono">
                {speed.toFixed(1)}x
              </Badge>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-muted-foreground w-8">0.5x</span>
              <Slider
                value={[speed]}
                min={0.5}
                max={2.0}
                step={0.1}
                onValueChange={(v) => setSpeed(v[0])}
                className="flex-1"
              />
              <span className="text-xs text-muted-foreground w-8">2.0x</span>
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-[10px] text-muted-foreground">Slow</span>
              <span className="text-[10px] text-muted-foreground">Fast</span>
            </div>
          </CardContent>
        </Card>

        {/* ── Generate Button ──────────────────────────────────── */}
        <Button
          onClick={handleGenerateTTS}
          disabled={ttsLoading || !text.trim() || !user || user.credits < 1}
          className={`w-full text-white shadow-lg py-5 text-base ${
            selectedProvider === 'google'
              ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 shadow-emerald-500/20'
              : 'bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 shadow-purple-500/20'
          }`}
        >
          {ttsLoading ? (
            <Loader2 className="size-5 mr-2 animate-spin" />
          ) : (
            <Mic className="size-5 mr-2" />
          )}
          Generate Voice
          {!ttsLoading && user && (
            <span className="ml-2 text-xs opacity-70">(-1 credit)</span>
          )}
        </Button>

        {/* ── Loading State ────────────────────────────────────── */}
        <AnimatePresence>
          {ttsLoading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              <Card className="border-purple-500/20">
                <CardContent className="py-6 space-y-3">
                  <div className="flex items-center gap-3">
                    <Loader2 className="size-5 text-purple-400 animate-spin" />
                    <span className="text-sm font-medium text-foreground">
                      Generating voice with {selectedProvider === 'google' ? 'Google Cloud TTS' : 'Microsoft Edge TTS'}...
                    </span>
                  </div>
                  <Progress value={undefined} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {selectedProvider === 'google'
                      ? 'Google Cloud Neural2 AI is synthesizing natural speech'
                      : 'Microsoft Edge Neural TTS is converting your script'}
                  </p>
                </CardContent>
              </Card>
              <WaveformBars isPlaying={true} barCount={48} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Audio Player ─────────────────────────────────────── */}
        <AnimatePresence>
          {ttsAudioUrl && !ttsLoading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <AudioPlayer audioUrl={ttsAudioUrl} provider={activeProvider} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </TooltipProvider>
  );
}
