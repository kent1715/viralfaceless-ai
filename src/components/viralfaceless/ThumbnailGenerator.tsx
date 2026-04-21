'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Image as ImageIcon,
  Sparkles,
  Zap,
  Minimize2,
  Download,
  RefreshCw,
  Star,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { useStore } from '@/lib/store';
import { api } from '@/lib/api';
import { THUMBNAIL_STYLES } from '@/lib/constants';
import type { ThumbnailData } from '@/lib/types';

const STYLE_ICONS: Record<string, React.ReactNode> = {
  clickbait: <Zap className="h-6 w-6" />,
  clean: <Sparkles className="h-6 w-6" />,
  minimal: <Minimize2 className="h-6 w-6" />,
};

export default function ThumbnailGenerator() {
  const {
    thumbnails,
    setThumbnails,
    thumbnailLoading,
    setThumbnailLoading,
    currentScript,
    user,
  } = useStore();

  const [prompt, setPrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState<string>('clickbait');

  // Pre-fill prompt from current script title
  useEffect(() => {
    if (currentScript?.title && !prompt) {
      setPrompt(currentScript.title);
    }
  }, [currentScript, prompt]);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('Please describe your thumbnail concept');
      return;
    }
    if (!user || user.credits < 1) {
      toast.error('Not enough credits. Please buy more credits.');
      return;
    }

    setThumbnailLoading(true);
    try {
      const data = await api.thumbnails.generate(prompt.trim(), selectedStyle);
      const newThumbnail: ThumbnailData = {
        base64: data.thumbnail.base64,
        prompt: data.thumbnail.prompt,
        style: data.thumbnail.style,
      };
      setThumbnails([...thumbnails, newThumbnail]);
      toast.success('Thumbnail generated!');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to generate thumbnail';
      toast.error(message);
    } finally {
      setThumbnailLoading(false);
    }
  };

  const handleDownload = (thumbnail: ThumbnailData, index: number) => {
    const link = document.createElement('a');
    link.href = `data:image/png;base64,${thumbnail.base64}`;
    link.download = `thumbnail-${index + 1}.png`;
    link.click();
    toast.success('Thumbnail downloaded!');
  };

  const handleRegenerate = async (thumbnail: ThumbnailData, index: number) => {
    if (!user || user.credits < 1) {
      toast.error('Not enough credits. Please buy more credits.');
      return;
    }

    setThumbnailLoading(true);
    try {
      const data = await api.thumbnails.generate(thumbnail.prompt, thumbnail.style);
      const updated = [...thumbnails];
      updated[index] = {
        base64: data.thumbnail.base64,
        prompt: data.thumbnail.prompt,
        style: data.thumbnail.style,
      };
      setThumbnails(updated);
      toast.success('Thumbnail regenerated!');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to regenerate';
      toast.error(message);
    } finally {
      setThumbnailLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <div className="rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 p-2.5">
          <ImageIcon className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Thumbnail Generator</h1>
          <p className="text-sm text-muted-foreground">
            Create eye-catching thumbnails for your viral content
          </p>
        </div>
      </motion.div>

      {/* Prompt Input */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe your thumbnail concept... e.g. 'Dark mysterious background with glowing text saying YOU WON'T BELIEVE THIS'"
          className="min-h-[120px] resize-none bg-background border-border text-foreground placeholder:text-muted-foreground/50 focus:ring-purple-500/50"
        />
      </motion.div>

      {/* Style Selection */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h3 className="mb-3 text-sm font-medium text-muted-foreground">Choose Style</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {THUMBNAIL_STYLES.map((style) => (
            <Card
              key={style.value}
              onClick={() => setSelectedStyle(style.value)}
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                selectedStyle === style.value
                  ? 'border-2 border-purple-500 bg-purple-500/5 shadow-purple-500/20 shadow-lg'
                  : 'border-border bg-card hover:border-purple-500/50'
              }`}
            >
              <CardContent className="flex items-center gap-3 p-4">
                <div
                  className={`rounded-lg p-2 ${
                    selectedStyle === style.value
                      ? 'bg-purple-500/20 text-purple-400'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {STYLE_ICONS[style.value]}
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm">{style.label}</p>
                  <p className="text-xs text-muted-foreground">{style.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>

      {/* Generate Button */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <Button
          onClick={handleGenerate}
          disabled={thumbnailLoading || !prompt.trim()}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold h-12 text-base shadow-lg shadow-purple-500/25 transition-all"
        >
          {thumbnailLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Generating thumbnail...
            </>
          ) : (
            <>
              <ImageIcon className="mr-2 h-5 w-5" />
              Generate Thumbnail
              <span className="ml-2 rounded-full bg-white/20 px-2 py-0.5 text-xs">
                -1 credit
              </span>
            </>
          )}
        </Button>
      </motion.div>

      {/* Results Gallery */}
      <AnimatePresence mode="wait">
        {thumbnails.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-foreground">
              <Star className="h-5 w-5 text-yellow-500" />
              Generated Thumbnails
              <span className="text-sm font-normal text-muted-foreground">
                ({thumbnails.length})
              </span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {thumbnails.map((thumbnail, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="overflow-hidden border-border bg-card group">
                    <div className="relative aspect-video overflow-hidden bg-muted">
                      <img
                        src={`data:image/png;base64,${thumbnail.base64}`}
                        alt={thumbnail.prompt}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                    <CardContent className="p-3 space-y-2">
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {thumbnail.prompt}
                      </p>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span className="rounded bg-muted px-1.5 py-0.5 capitalize">
                          {thumbnail.style}
                        </span>
                      </div>
                      <div className="flex gap-2 pt-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(thumbnail, index)}
                          className="flex-1 h-8 text-xs border-border hover:bg-purple-500/10 hover:text-purple-400 hover:border-purple-500/50"
                        >
                          <Download className="mr-1 h-3 w-3" />
                          Download
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            toast.success('Thumbnail set as post thumbnail!');
                          }}
                          className="flex-1 h-8 text-xs border-border hover:bg-green-500/10 hover:text-green-400 hover:border-green-500/50"
                        >
                          <Star className="mr-1 h-3 w-3" />
                          Set as Post
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRegenerate(thumbnail, index)}
                          disabled={thumbnailLoading}
                          className="h-8 w-8 p-0 border-border hover:bg-blue-500/10 hover:text-blue-400 hover:border-blue-500/50"
                        >
                          <RefreshCw className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty State */}
      {thumbnails.length === 0 && !thumbnailLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <div className="rounded-2xl bg-muted/50 p-6 mb-4">
            <ImageIcon className="h-12 w-12 text-muted-foreground/50" />
          </div>
          <h3 className="text-lg font-medium text-foreground">No thumbnails yet</h3>
          <p className="mt-1 text-sm text-muted-foreground max-w-sm">
            Describe your thumbnail concept above and click generate to create stunning
            AI-powered thumbnails.
          </p>
        </motion.div>
      )}
    </div>
  );
}
