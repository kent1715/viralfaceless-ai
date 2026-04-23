'use client';

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Zap,
  Copy,
  Check,
  Mic,
  Video,
  ArrowLeft,
  Quote,
  Loader2,
  Sparkles,
  Volume2,
  Film,
} from 'lucide-react';
import { toast } from 'sonner';
import { useStore } from '@/lib/store';
import { api } from '@/lib/api';
import { SCRIPT_STYLES, SCRIPT_TONES } from '@/lib/constants';
import type { ScriptStyle, ScriptTone } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useI18n } from '@/lib/i18n';

// ─── Typing Animation Hook ──────────────────────────────────────
function useTypingEffect(text: string, speed: number = 15) {
  const [displayText, setDisplayText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const indexRef = useRef(0);
  const prevTextRef = useRef('');

  useEffect(() => {
    if (!text) return;
    // Only start typing if text changed
    const hasChanged = text !== prevTextRef.current;
    prevTextRef.current = text;

    if (!hasChanged) return;

    indexRef.current = 0;

    const interval = setInterval(() => {
      indexRef.current += 1;
      const partial = text.slice(0, indexRef.current);
      setDisplayText(partial);
      if (indexRef.current >= text.length) {
        clearInterval(interval);
        setIsTyping(false);
      }
    }, speed);

    // Use timeout(0) to batch the initial state updates
    const initTimeout = setTimeout(() => {
      setDisplayText('');
      setIsTyping(true);
    }, 0);

    return () => {
      clearInterval(interval);
      clearTimeout(initTimeout);
    };
  }, [text, speed]);

  return { displayText, isTyping };
}

// ─── Copy Button ────────────────────────────────────────────────
function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const { t } = useI18n();

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      toast.success(t('script.copied').replace('{label}', label || 'Text'));
      setTimeout(() => setCopied(false), 2000);
    });
  }, [text, label, t]);

  return (
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
  );
}

// ─── Script Section Card ────────────────────────────────────────
function ScriptSection({
  title,
  icon: Icon,
  content,
  displayContent,
  isTyping,
  color = 'purple',
}: {
  title: string;
  icon: React.ElementType;
  content: string;
  displayContent: string;
  isTyping: boolean;
  color?: string;
}) {
  const { t } = useI18n();
  const colorMap: Record<string, string> = {
    purple: 'border-purple-500/30 bg-purple-500/5',
    amber: 'border-amber-500/30 bg-amber-500/5',
    emerald: 'border-emerald-500/30 bg-emerald-500/5',
  };
  const iconColorMap: Record<string, string> = {
    purple: 'text-purple-400',
    amber: 'text-amber-400',
    emerald: 'text-emerald-400',
  };

  return (
    <Card className={`border ${colorMap[color] || colorMap.purple}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Icon className={`size-4 ${iconColorMap[color] || iconColorMap.purple}`} />
            {title}
          </CardTitle>
          {content && !isTyping && (
            <CopyButton text={content} label={title} />
          )}
        </div>
      </CardHeader>
      <CardContent>
        {displayContent ? (
          <div className="relative">
            <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
              {displayContent}
              {isTyping && (
                <motion.span
                  animate={{ opacity: [1, 0] }}
                  transition={{ repeat: Infinity, duration: 0.8 }}
                  className="inline-block w-0.5 h-4 bg-purple-400 ml-0.5 align-middle"
                />
              )}
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">
            {t('script.notGenerated')}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Style/Tone Option Card ─────────────────────────────────────
function OptionCard({
  value,
  currentValue,
  onChange,
  label,
  description,
  icon,
}: {
  value: string;
  currentValue: string;
  onChange: (value: string) => void;
  label: string;
  description: string;
  icon: string;
}) {
  const isActive = currentValue === value;
  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onChange(value)}
      className={`relative flex items-start gap-3 p-3 rounded-lg border-2 text-left transition-all cursor-pointer ${
        isActive
          ? 'border-purple-500 bg-purple-500/10'
          : 'border-border bg-card hover:border-purple-500/30'
      }`}
    >
      <RadioGroupItem
        value={value}
        checked={isActive}
        className="mt-0.5"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm">{icon}</span>
          <span className="text-sm font-semibold text-foreground">{label}</span>
        </div>
        <span className="text-xs text-muted-foreground">{description}</span>
      </div>
    </motion.button>
  );
}

// ─── Main Component ─────────────────────────────────────────────
export default function ScriptGenerator() {
  const { t } = useI18n();

  const {
    user,
    selectedIdea,
    currentScript,
    scriptLoading,
    setCurrentScript,
    setScriptLoading,
    setUser,
    setCurrentView,
  } = useStore();

  const [style, setStyle] = useState<ScriptStyle>('storytelling');
  const [tone, setTone] = useState<ScriptTone>('energetic');
  const [duration, setDuration] = useState('60');
  const [editedScript, setEditedScript] = useState('');
  const [showScript, setShowScript] = useState(false);

  // ── Translated styles & tones ─────────────────────────────────
  const scriptStyles = useMemo(() => SCRIPT_STYLES.map(s => ({
    ...s,
    label: t(`script.style.${s.value}`),
    description: t(`script.style.${s.value}Desc`),
  })), [t]);

  const scriptTones = useMemo(() => SCRIPT_TONES.map(tn => ({
    ...tn,
    label: t(`script.tone.${tn.value}`),
    description: t(`script.tone.${tn.value}Desc`),
  })), [t]);

  // Typing effects for each section
  const hookTyping = useTypingEffect(currentScript?.hook || '', 20);
  const contentTyping = useTypingEffect(currentScript?.mainContent || '', 10);
  const ctaTyping = useTypingEffect(currentScript?.cta || '', 20);

  // Sync edited script when script changes
  useEffect(() => {
    if (currentScript?.fullScript) {
      setEditedScript(currentScript.fullScript);
      setShowScript(true);
    }
  }, [currentScript]);

  // ── Generate Script ────────────────────────────────────────────
  const handleGenerateScript = useCallback(async () => {
    if (!selectedIdea) {
      toast.error(t('script.needIdea'));
      return;
    }
    if (!user || user.credits < 1) {
      toast.error(t('script.notEnoughCredits'));
      return;
    }

    setScriptLoading(true);
    setShowScript(false);
    setCurrentScript(null);

    try {
      const data = await api.scripts.generate({
        ideaTitle: selectedIdea.title,
        hook: selectedIdea.hook,
        contentAngle: selectedIdea.contentAngle,
        targetEmotion: selectedIdea.targetEmotion,
        style,
        tone,
      });
      setCurrentScript(data.script);
      if (data.remainingCredits !== undefined) {
        setUser({ ...user, credits: data.remainingCredits });
      }
      toast.success(t('script.generated'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('script.failed'));
    } finally {
      setScriptLoading(false);
    }
  }, [selectedIdea, user, style, tone, setCurrentScript, setScriptLoading, setUser, t]);

  // ── Hook Rewrite ───────────────────────────────────────────────
  const handleHookRewrite = useCallback(async () => {
    if (!currentScript || !user || user.credits < 1) {
      toast.error(t('script.notEnoughRewrite'));
      return;
    }

    setScriptLoading(true);
    try {
      const data = await api.scripts.generate({
        ideaTitle: currentScript.title || currentScript.hook,
        hook: currentScript.hook,
        contentAngle: 'make it more viral and attention-grabbing',
        targetEmotion: 'curiosity',
        style: currentScript.style as ScriptStyle,
        tone: currentScript.tone as ScriptTone,
      });
      if (data.script?.hook) {
        setCurrentScript({
          ...currentScript,
          hook: data.script.hook,
        });
      }
      if (data.remainingCredits !== undefined) {
        setUser({ ...user, credits: data.remainingCredits });
      }
      toast.success(t('script.rewritten'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('script.rewriteFailed'));
    } finally {
      setScriptLoading(false);
    }
  }, [currentScript, user, setCurrentScript, setScriptLoading, setUser, t]);

  // ── No idea selected state ─────────────────────────────────────
  if (!selectedIdea) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="size-6 text-purple-400" />
            {t('script.title')}
          </h1>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-20 text-center"
        >
          <div className="w-20 h-20 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-6">
            <Sparkles className="size-10 text-purple-400" />
          </div>
          <h3 className="text-xl font-semibold mb-2">{t('script.noIdea')}</h3>
          <p className="text-muted-foreground max-w-md mb-6">
            {t('script.noIdeaDesc')}
          </p>
          <Button
            onClick={() => setCurrentView('idea-engine')}
            className="bg-gradient-to-r from-purple-600 to-purple-500 text-white"
          >
            <ArrowLeft className="size-4 mr-2" />
            {t('script.goToIdeas')}
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Header with selected idea ─────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileText className="size-6 text-purple-400" />
          {t('script.title')}
        </h1>
        <Card className="mt-3 border-purple-500/20 bg-purple-500/5">
          <CardContent className="py-3">
            <p className="text-xs text-purple-400 font-semibold uppercase tracking-wider mb-1">
              {t('script.selectedIdea')}
            </p>
            <p className="font-semibold text-foreground">{selectedIdea.title}</p>
            <p className="text-sm text-muted-foreground italic flex items-start gap-1.5 mt-1">
              <Quote className="size-3.5 mt-0.5 text-purple-400 shrink-0" />
              {selectedIdea.hook}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── Configuration Panel ───────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('script.configuration')}</CardTitle>
          <CardDescription>{t('script.configDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Script Style */}
          <div>
            <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
              {t('script.style')}
            </Label>
            <RadioGroup
              value={style}
              onValueChange={(v) => setStyle(v as ScriptStyle)}
              className="grid grid-cols-1 sm:grid-cols-2 gap-3"
            >
              {scriptStyles.map((s) => (
                <OptionCard
                  key={s.value}
                  value={s.value}
                  currentValue={style}
                  onChange={(v) => setStyle(v as ScriptStyle)}
                  label={s.label}
                  description={s.description}
                  icon={
                    s.value === 'storytelling'
                      ? '📖'
                      : s.value === 'controversial'
                        ? '🔥'
                        : s.value === 'educational'
                          ? '📚'
                          : '💝'
                  }
                />
              ))}
            </RadioGroup>
          </div>

          <Separator />

          {/* Script Tone */}
          <div>
            <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
              {t('script.tone')}
            </Label>
            <RadioGroup
              value={tone}
              onValueChange={(v) => setTone(v as ScriptTone)}
              className="grid grid-cols-1 sm:grid-cols-2 gap-3"
            >
              {scriptTones.map((tn) => (
                <OptionCard
                  key={tn.value}
                  value={tn.value}
                  currentValue={tone}
                  onChange={(v) => setTone(v as ScriptTone)}
                  label={tn.label}
                  description={tn.description}
                  icon={
                    tn.value === 'serious'
                      ? '😐'
                      : tn.value === 'funny'
                        ? '😂'
                        : tn.value === 'dark'
                          ? '🌑'
                          : '⚡'
                  }
                />
              ))}
            </RadioGroup>
          </div>

          <Separator />

          {/* Duration */}
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
                {t('script.duration')}
              </Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 seconds</SelectItem>
                  <SelectItem value="45">45 seconds</SelectItem>
                  <SelectItem value="60">60 seconds</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Generate Button ───────────────────────────────────── */}
      <Button
        onClick={handleGenerateScript}
        disabled={scriptLoading || !user || user.credits < 1}
        className="w-full bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white shadow-lg shadow-purple-500/20 py-5 text-base"
      >
        {scriptLoading ? (
          <Loader2 className="size-5 mr-2 animate-spin" />
        ) : (
          <FileText className="size-5 mr-2" />
        )}
        {t('script.generate')}
        {!scriptLoading && user && (
          <span className="ml-2 text-xs opacity-70">{t('common.credit')}</span>
        )}
      </Button>

      {/* ── Script Output ─────────────────────────────────────── */}
      <AnimatePresence>
        {showScript && currentScript && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {/* Hook Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  {t('script.sections')}
                </h2>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleHookRewrite}
                  disabled={scriptLoading || !user || user.credits < 1}
                  className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10 hover:text-amber-300"
                >
                  <Zap className="size-3.5 mr-1" />
                  {t('script.hookRewrite')}
                  {!scriptLoading && user && (
                    <span className="ml-1 text-xs opacity-60">(-1)</span>
                  )}
                </Button>
              </div>

              <div className="space-y-3">
                <ScriptSection
                  title={t('script.hook')}
                  icon={Zap}
                  content={currentScript.hook || ''}
                  displayContent={hookTyping.displayText}
                  isTyping={hookTyping.isTyping}
                  color="amber"
                />
                <ScriptSection
                  title={t('script.mainContent')}
                  icon={Sparkles}
                  content={currentScript.mainContent || ''}
                  displayContent={contentTyping.displayText}
                  isTyping={contentTyping.isTyping}
                  color="purple"
                />
                <ScriptSection
                  title={t('script.cta')}
                  icon={Volume2}
                  content={currentScript.cta || ''}
                  displayContent={ctaTyping.displayText}
                  isTyping={ctaTyping.isTyping}
                  color="emerald"
                />
              </div>
            </div>

            <Separator />

            {/* Full Script (Editable) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  {t('script.fullScript')}
                </Label>
                <CopyButton text={editedScript} label={t('script.fullScript')} />
              </div>
              <Textarea
                value={editedScript}
                onChange={(e) => setEditedScript(e.target.value)}
                rows={10}
                className="bg-background border-border font-mono text-sm resize-y"
                placeholder={t('script.placeholder')}
              />
            </div>

            <Separator />

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => setCurrentView('tts-engine')}
                className="flex-1 bg-gradient-to-r from-purple-600 to-purple-500 text-white"
              >
                <Mic className="size-4 mr-2" />
                {t('script.generateVoice')}
              </Button>
              <Button
                onClick={() => setCurrentView('video-generator')}
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-500 text-white"
              >
                <Film className="size-4 mr-2" />
                {t('script.createVideo')}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Loading State (while generating) ──────────────────── */}
      {scriptLoading && !showScript && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <Loader2 className="size-8 text-purple-400 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">{t('script.generating')}</p>
          <div className="flex justify-center gap-1 mt-4">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 rounded-full bg-purple-400"
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                transition={{
                  repeat: Infinity,
                  duration: 1,
                  delay: i * 0.2,
                }}
              />
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
