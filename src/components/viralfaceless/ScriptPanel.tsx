'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  Clock,
  Eye,
  MessageSquare,
  Type,
  Film,
  FileText,
} from 'lucide-react';
import type { ScriptItem } from '@/lib/store';

interface ScriptPanelProps {
  script: ScriptItem;
  onBack: () => void;
}

export function ScriptPanel({ script, onBack }: ScriptPanelProps) {
  const { content } = script;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <h3 className="text-lg font-bold text-foreground">Generated Script</h3>
          <p className="text-sm text-muted-foreground">
            Total duration:{' '}
            <span className="font-medium text-emerald-600 dark:text-emerald-400">
              {content.totalDuration}s
            </span>
          </p>
        </div>
      </div>

      {/* Scene Breakdown */}
      <div className="space-y-3">
        {content.scenes.map((scene, index) => (
          <motion.div
            key={scene.number}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
          >
            <Card className="rounded-xl border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Film className="size-4 text-emerald-500" />
                  Scene {scene.number}
                  <Badge variant="secondary" className="ml-auto text-xs">
                    <Clock className="mr-1 size-3" />
                    {scene.duration}s
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Voiceover */}
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <MessageSquare className="size-3" />
                    Voiceover
                  </div>
                  <p className="text-sm text-foreground bg-muted/50 rounded-lg p-3 leading-relaxed">
                    {scene.voiceover}
                  </p>
                </div>

                {/* Visual Description */}
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <Eye className="size-3" />
                    Visual Description
                  </div>
                  <p className="text-sm text-foreground/80">
                    {scene.visualDescription}
                  </p>
                </div>

                {/* On-Screen Text */}
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <Type className="size-3" />
                    On-Screen Text
                  </div>
                  <p className="text-sm font-medium text-amber-600 dark:text-amber-400 bg-amber-500/5 rounded-lg p-2.5">
                    {scene.onScreenText}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Separator />

      {/* Full Voiceover */}
      <Card className="rounded-xl border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <FileText className="size-4 text-emerald-500" />
            Full Voiceover Script
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-foreground leading-relaxed whitespace-pre-line bg-muted/50 rounded-lg p-4">
            {content.voiceoverFull}
          </p>
        </CardContent>
      </Card>

      {/* Visual Notes */}
      {content.visualNotes && (
        <Card className="rounded-xl border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Eye className="size-4 text-amber-500" />
              Visual Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-line">
              {content.visualNotes}
            </p>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}
