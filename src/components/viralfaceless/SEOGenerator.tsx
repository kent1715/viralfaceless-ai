'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Copy,
  Check,
  Plus,
  X,
  Loader2,
  Hash,
  Type,
  AlignLeft,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useStore } from '@/lib/store';
import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { PLATFORMS } from '@/lib/constants';
import type { SEOData } from '@/lib/types';

const PLATFORM_LIMITS: Record<string, { title: number; desc: number }> = {
  youtube: { title: 100, desc: 5000 },
  tiktok: { title: 150, desc: 300 },
  instagram: { title: 2200, desc: 2200 },
};

const PLATFORM_LABELS: Record<string, string> = {
  youtube: 'YouTube Shorts',
  tiktok: 'TikTok',
  instagram: 'Instagram Reels',
};

export default function SEOGenerator() {
  const { t } = useI18n();
  const {
    seoData,
    setSeoData,
    seoLoading,
    setSeoLoading,
    currentScript,
    currentNiche,
    user,
  } = useStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [niche, setNiche] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([
    'youtube',
    'tiktok',
    'instagram',
  ]);
  const [activeTab, setActiveTab] = useState('youtube');
  const [editingTitle, setEditingTitle] = useState<Record<string, string>>({});
  const [editingDesc, setEditingDesc] = useState<Record<string, string>>({});
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [newHashtag, setNewHashtag] = useState<Record<string, string>>({});
  const [typingText, setTypingText] = useState('');

  // Pre-fill from current script
  useEffect(() => {
    if (currentScript?.title && !title) setTitle(currentScript.title);
    if (currentScript?.mainContent && !description)
      setDescription(currentScript.mainContent.substring(0, 200));
    if (currentNiche && !niche) setNiche(currentNiche);
  }, [currentScript, currentNiche, title, description, niche]);

  // Sync edits back to seoData
  useEffect(() => {
    if (seoData.length === 0) return;
    setSeoData(
      seoData.map((d) => ({
        ...d,
        title: editingTitle[d.platform] ?? d.title,
        description: editingDesc[d.platform] ?? d.description,
      }))
    );
  }, [editingTitle, editingDesc]);

  const togglePlatform = (platform: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform]
    );
  };

  const handleGenerate = async () => {
    if (!title.trim()) {
      toast.error(t('seo.noTitle'));
      return;
    }
    if (selectedPlatforms.length === 0) {
      toast.error(t('seo.noPlatform'));
      return;
    }
    if (!user || user.credits < 1) {
      toast.error(t('seo.notEnoughCredits'));
      return;
    }

    setSeoLoading(true);
    setTypingText('');
    try {
      const data = await api.seo.generate(
        title.trim(),
        description.trim() || undefined,
        niche.trim() || undefined,
        selectedPlatforms
      );
      const newSeoData: SEOData[] = data.seoData;
      setSeoData(newSeoData);
      setEditingTitle({});
      setEditingDesc({});
      setActiveTab(selectedPlatforms[0]);
      toast.success(t('seo.generated'));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('seo.failed');
      toast.error(message);
    } finally {
      setSeoLoading(false);
      setTypingText('');
    }
  };

  // Typing animation while loading
  useEffect(() => {
    if (!seoLoading) {
      setTypingText('');
      return;
    }
    const words = [
      t('seo.analyzingKeywords'),
      t('seo.optimizingTitles'),
      t('seo.generatingHashtags'),
      t('seo.craftingDescs'),
      t('seo.boostingSeo'),
    ];
    let idx = 0;
    const interval = setInterval(() => {
      idx = (idx + 1) % words.length;
      setTypingText(words[idx]);
    }, 800);
    return () => clearInterval(interval);
  }, [seoLoading, t]);

  const copyToClipboard = async (text: string, fieldId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldId);
      toast.success(t('seo.copied'));
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      toast.error(t('seo.copyFailed'));
    }
  };

  const copyAllForPlatform = (platform: string) => {
    const data = seoData.find((d) => d.platform === platform);
    if (!data) return;
    const all = `${data.title}\n\n${data.description}\n\n${data.hashtags.join(' ')}`;
    copyToClipboard(all, `all-${platform}`);
  };

  const removeHashtag = (platform: string, tag: string) => {
    const data = seoData.find((d) => d.platform === platform);
    if (!data) return;
    setSeoData(
      seoData.map((d) =>
        d.platform === platform
          ? { ...d, hashtags: d.hashtags.filter((h) => h !== tag) }
          : d
      )
    );
  };

  const addHashtag = (platform: string) => {
    const tag = (newHashtag[platform] || '').trim();
    if (!tag) return;
    const data = seoData.find((d) => d.platform === platform);
    if (!data) return;
    const hashtag = tag.startsWith('#') ? tag : `#${tag}`;
    setSeoData(
      seoData.map((d) =>
        d.platform === platform
          ? { ...d, hashtags: [...d.hashtags, hashtag] }
          : d
      )
    );
    setNewHashtag((prev) => ({ ...prev, [platform]: '' }));
  };

  const CharCount = ({
    text,
    limit,
    label,
  }: {
    text: string;
    limit: number;
    label: string;
  }) => {
    const pct = (text.length / limit) * 100;
    const color =
      pct > 90 ? 'text-red-400' : pct > 70 ? 'text-yellow-400' : 'text-muted-foreground';
    return (
      <span className={`text-xs ${color}`}>
        {text.length}/{limit} {label}
      </span>
    );
  };

  const renderPlatformTab = (platform: string) => {
    const data = seoData.find((d) => d.platform === platform);
    if (!data) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Search className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground">
            {t('seo.generateFirst').replace('{platform}', PLATFORM_LABELS[platform])}
          </p>
        </div>
      );
    }

    const limits = PLATFORM_LIMITS[platform] || { title: 100, desc: 5000 };
    const currentTitle = editingTitle[platform] ?? data.title;
    const currentDesc = editingDesc[platform] ?? data.description;

    return (
      <motion.div
        key={platform}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        {/* Title */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Type className="h-4 w-4 text-purple-400" />
              {t('seo.optimizedTitle')}
            </Label>
            <div className="flex items-center gap-2">
              <CharCount text={currentTitle} limit={limits.title} label={t('seo.chars')} />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(currentTitle, `title-${platform}`)}
                className="h-7 px-2"
              >
                {copiedField === `title-${platform}` ? (
                  <Check className="h-3 w-3 text-green-400" />
                ) : (
                  <Copy className="h-3 w-3 text-muted-foreground" />
                )}
              </Button>
            </div>
          </div>
          <Input
            value={currentTitle}
            onChange={(e) =>
              setEditingTitle((prev) => ({ ...prev, [platform]: e.target.value }))
            }
            className="bg-background border-border text-foreground"
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2 text-sm font-medium text-foreground">
              <AlignLeft className="h-4 w-4 text-purple-400" />
              {t('seo.optimizedDesc')}
            </Label>
            <div className="flex items-center gap-2">
              <CharCount text={currentDesc} limit={limits.desc} label={t('seo.chars')} />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(currentDesc, `desc-${platform}`)}
                className="h-7 px-2"
              >
                {copiedField === `desc-${platform}` ? (
                  <Check className="h-3 w-3 text-green-400" />
                ) : (
                  <Copy className="h-3 w-3 text-muted-foreground" />
                )}
              </Button>
            </div>
          </div>
          <Textarea
            value={currentDesc}
            onChange={(e) =>
              setEditingDesc((prev) => ({ ...prev, [platform]: e.target.value }))
            }
            rows={4}
            className="resize-none bg-background border-border text-foreground"
          />
        </div>

        {/* Hashtags */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Hash className="h-4 w-4 text-purple-400" />
              {t('seo.hashtags')}
              <span className="text-xs text-muted-foreground font-normal">
                ({data.hashtags.length})
              </span>
            </Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                copyToClipboard(data.hashtags.join(' '), `hashtags-${platform}`)
              }
              className="h-7 px-2"
            >
              {copiedField === `hashtags-${platform}` ? (
                <Check className="h-3 w-3 text-green-400" />
              ) : (
                <Copy className="h-3 w-3 text-muted-foreground" />
              )}
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {data.hashtags.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="cursor-pointer bg-purple-500/10 text-purple-300 border border-purple-500/20 hover:bg-red-500/10 hover:text-red-300 hover:border-red-500/20 transition-colors"
                onClick={() => removeHashtag(platform, tag)}
              >
                {tag}
                <X className="ml-1 h-3 w-3" />
              </Badge>
            ))}
            <div className="flex items-center gap-1">
              <Input
                value={newHashtag[platform] || ''}
                onChange={(e) =>
                  setNewHashtag((prev) => ({ ...prev, [platform]: e.target.value }))
                }
                onKeyDown={(e) => e.key === 'Enter' && addHashtag(platform)}
                placeholder={t('seo.addTag')}
                className="h-7 w-24 bg-transparent border-border text-xs"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => addHashtag(platform)}
                className="h-7 w-7 p-0 text-purple-400 hover:text-purple-300"
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>

        {/* Copy All */}
        <Button
          variant="outline"
          onClick={() => copyAllForPlatform(platform)}
          className="w-full border-purple-500/30 hover:bg-purple-500/10 text-purple-300 hover:text-purple-200"
        >
          <Copy className="mr-2 h-4 w-4" />
          {t('seo.copyAll').replace('{platform}', PLATFORM_LABELS[platform])}
        </Button>
      </motion.div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <div className="rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 p-2.5">
          <Search className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('seo.title')}</h1>
          <p className="text-sm text-muted-foreground">
            {t('seo.subtitle')}
          </p>
        </div>
      </motion.div>

      {/* Input Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <Card className="bg-card border-border">
          <CardContent className="space-y-4 p-5">
            {/* Title */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">{t('seo.contentTitle')}</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('seo.titlePlaceholder')}
                className="bg-background border-border text-foreground"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">
                {t('seo.description')}
              </Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('seo.descPlaceholder')}
                rows={3}
                className="resize-none bg-background border-border text-foreground"
              />
            </div>

            {/* Niche */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">{t('seo.niche')}</Label>
              <Input
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
                placeholder={t('seo.nichePlaceholder')}
                className="bg-background border-border text-foreground"
              />
            </div>

            {/* Platform Select */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">{t('seo.targetPlatforms')}</Label>
              <div className="flex flex-wrap gap-2">
                {PLATFORMS.map((platform) => (
                  <Badge
                    key={platform.value}
                    variant="outline"
                    className={`cursor-pointer transition-all py-1.5 px-3 ${
                      selectedPlatforms.includes(platform.value)
                        ? 'bg-purple-500/15 text-purple-300 border-purple-500/40'
                        : 'bg-muted/50 text-muted-foreground border-border hover:border-purple-500/30'
                    }`}
                    onClick={() => togglePlatform(platform.value)}
                  >
                    {selectedPlatforms.includes(platform.value) && (
                      <Check className="mr-1.5 h-3 w-3" />
                    )}
                    {platform.label}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Generate Button */}
            <Button
              onClick={handleGenerate}
              disabled={seoLoading || !title.trim() || selectedPlatforms.length === 0}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold h-11 shadow-lg shadow-purple-500/25"
            >
              {seoLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {typingText || t('seo.generating')}
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  {t('seo.generate')}
                  <span className="ml-2 rounded-full bg-white/20 px-2 py-0.5 text-xs">
                    {t('common.credit')}
                  </span>
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Results */}
      <AnimatePresence mode="wait">
        {seoData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-card border-border">
              <CardContent className="p-5">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="bg-muted w-full">
                    {seoData.map((d) => (
                      <TabsTrigger
                        key={d.platform}
                        value={d.platform}
                        className="flex-1 data-[state=active]:bg-purple-600 data-[state=active]:text-white"
                      >
                        {PLATFORM_LABELS[d.platform] || d.platform}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  {seoData.map((d) => (
                    <TabsContent key={d.platform} value={d.platform} className="mt-4">
                      {renderPlatformTab(d.platform)}
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty State */}
      {seoData.length === 0 && !seoLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <div className="rounded-2xl bg-muted/50 p-6 mb-4">
            <Search className="h-12 w-12 text-muted-foreground/50" />
          </div>
          <h3 className="text-lg font-medium text-foreground">{t('seo.noData')}</h3>
          <p className="mt-1 text-sm text-muted-foreground max-w-sm">
            {t('seo.noDataDesc')}
          </p>
        </motion.div>
      )}
    </div>
  );
}
