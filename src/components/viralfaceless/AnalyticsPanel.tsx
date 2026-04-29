'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BarChart3,
  TrendingUp,
  Eye,
  Heart,
  Share2,
  MousePointerClick,
  Clock,
  Send,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';

interface AnalyticsData {
  id: string;
  ideaId: string;
  ideaTitle: string;
  platform: string;
  ctr: number;
  retention: number;
  watchTime: number;
  likes: number;
  shares: number;
  comments: number;
  views: number;
  createdAt: string;
}

const PLATFORMS = [
  { value: 'tiktok', label: 'TikTok', color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400' },
  { value: 'youtube', label: 'YouTube', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
  { value: 'instagram', label: 'Instagram', color: 'bg-violet-500/10 text-violet-600 dark:text-violet-400' },
  { value: 'twitter', label: 'Twitter/X', color: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400' },
];

function getPlatformColor(platform: string): string {
  return PLATFORMS.find((p) => p.value === platform)?.color || 'bg-secondary text-secondary-foreground';
}

export function AnalyticsPanel() {
  const { token, ideas } = useAppStore();
  const [analytics, setAnalytics] = useState<AnalyticsData[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedIdeaId, setSelectedIdeaId] = useState('');
  const [form, setForm] = useState({
    platform: 'tiktok',
    ctr: '',
    retention: '',
    watchTime: '',
    likes: '',
    shares: '',
    comments: '',
    views: '',
  });

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await fetch('/api/analytics', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          const mapped: AnalyticsData[] = (data.analytics || []).map((a: Record<string, unknown>) => ({
            id: a.id as string,
            ideaId: (a.ideaId as string) || '',
            ideaTitle: (a.idea as Record<string, unknown>)?.title as string || 'Unknown',
            platform: a.platform as string,
            ctr: a.ctr as number,
            retention: a.retention as number,
            watchTime: a.watchTime as number,
            likes: a.likes as number,
            shares: a.shares as number,
            comments: a.comments as number,
            views: a.views as number,
            createdAt: a.createdAt as string,
          }));
          setAnalytics(mapped);
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIdeaId) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ideaId: selectedIdeaId,
          platform: form.platform,
          ctr: parseFloat(form.ctr) || 0,
          retention: parseFloat(form.retention) || 0,
          watchTime: parseFloat(form.watchTime) || 0,
          likes: parseInt(form.likes) || 0,
          shares: parseInt(form.shares) || 0,
          comments: parseInt(form.comments) || 0,
          views: parseInt(form.views) || 0,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const a = data.analytics;
        if (a) {
          const mapped: AnalyticsData = {
            id: a.id,
            ideaId: a.ideaId || selectedIdeaId,
            ideaTitle: ideas.find((i) => i.id === selectedIdeaId)?.title || 'Unknown',
            platform: a.platform,
            ctr: a.ctr,
            retention: a.retention,
            watchTime: a.watchTime,
            likes: a.likes,
            shares: a.shares,
            comments: a.comments,
            views: a.views,
            createdAt: a.createdAt,
          };
          setAnalytics((prev) => [mapped, ...prev]);
        }
        setForm({
          platform: 'tiktok',
          ctr: '',
          retention: '',
          watchTime: '',
          likes: '',
          shares: '',
          comments: '',
          views: '',
        });
      }
    } catch {
      // silent
    } finally {
      setSubmitting(false);
    }
  };

  // Aggregate stats
  const totalViews = analytics.reduce((sum, a) => sum + a.views, 0);
  const totalLikes = analytics.reduce((sum, a) => sum + a.likes, 0);
  const totalShares = analytics.reduce((sum, a) => sum + a.shares, 0);
  const totalComments = analytics.reduce((sum, a) => sum + a.comments, 0);
  const avgCtr = analytics.length > 0
    ? analytics.reduce((sum, a) => sum + a.ctr, 0) / analytics.length
    : 0;
  const avgRetention = analytics.length > 0
    ? analytics.reduce((sum, a) => sum + a.retention, 0) / analytics.length
    : 0;

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Total Views', value: totalViews.toLocaleString(), icon: Eye, color: 'text-emerald-500' },
          { label: 'Total Likes', value: totalLikes.toLocaleString(), icon: Heart, color: 'text-rose-500' },
          { label: 'Total Shares', value: totalShares.toLocaleString(), icon: Share2, color: 'text-amber-500' },
          { label: 'Avg CTR', value: `${avgCtr.toFixed(1)}%`, icon: TrendingUp, color: 'text-violet-500' },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="rounded-xl border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <stat.icon className={`size-4 ${stat.color}`} />
                  <span className="text-xs text-muted-foreground">{stat.label}</span>
                </div>
                <p className="text-xl font-bold text-foreground">{stat.value}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Performance Chart Visualization */}
      {analytics.length > 0 && (
        <Card className="rounded-xl border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <BarChart3 className="size-4 text-emerald-500" />
              Performance Overview
            </CardTitle>
            <CardDescription>Avg Retention: {avgRetention.toFixed(1)}% | Total Comments: {totalComments.toLocaleString()}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.slice(0, 8).map((item, index) => (
                <div key={item.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className={`text-xs ${getPlatformColor(item.platform)}`}>
                        {item.platform}
                      </Badge>
                      <span className="text-muted-foreground truncate max-w-[120px] sm:max-w-[200px]">
                        {item.ideaTitle}
                      </span>
                    </div>
                    <span className="font-medium text-foreground">{item.views.toLocaleString()} views</span>
                  </div>
                  <div className="flex h-2 overflow-hidden rounded-full bg-muted">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(item.retention, 100)}%` }}
                      transition={{ duration: 0.6, delay: index * 0.05 }}
                      className="bg-emerald-500"
                    />
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(item.ctr * 10, 100 - Math.min(item.retention, 100))}%` }}
                      transition={{ duration: 0.6, delay: index * 0.05 + 0.1 }}
                      className="bg-amber-500"
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-4 mt-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <div className="size-2 rounded-full bg-emerald-500" />
                Retention
              </div>
              <div className="flex items-center gap-1.5">
                <div className="size-2 rounded-full bg-amber-500" />
                CTR
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Submit Analytics Form */}
      <Card className="rounded-xl border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <MousePointerClick className="size-4 text-amber-500" />
            Submit Analytics
          </CardTitle>
          <CardDescription>
            Track your content performance for self-learning optimization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Idea Selection */}
            <div className="space-y-2">
              <Label>Select Idea</Label>
              <Select value={selectedIdeaId} onValueChange={setSelectedIdeaId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose an idea..." />
                </SelectTrigger>
                <SelectContent>
                  {ideas.map((idea) => (
                    <SelectItem key={idea.id} value={idea.id}>
                      {idea.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Platform */}
            <div className="space-y-2">
              <Label>Platform</Label>
              <Select value={form.platform} onValueChange={(v) => setForm((f) => ({ ...f, platform: v }))}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLATFORMS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">CTR (%)</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="0.0"
                  value={form.ctr}
                  onChange={(e) => setForm((f) => ({ ...f, ctr: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Retention (%)</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="0.0"
                  value={form.retention}
                  onChange={(e) => setForm((f) => ({ ...f, retention: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Watch Time (s)</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="0"
                  value={form.watchTime}
                  onChange={(e) => setForm((f) => ({ ...f, watchTime: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Views</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={form.views}
                  onChange={(e) => setForm((f) => ({ ...f, views: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Likes</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={form.likes}
                  onChange={(e) => setForm((f) => ({ ...f, likes: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Shares</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={form.shares}
                  onChange={(e) => setForm((f) => ({ ...f, shares: e.target.value }))}
                />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs">Comments</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={form.comments}
                  onChange={(e) => setForm((f) => ({ ...f, comments: e.target.value }))}
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={submitting || !selectedIdeaId}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {submitting ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                  className="size-4 rounded-full border-2 border-white/30 border-t-white"
                />
              ) : (
                <div className="flex items-center gap-2">
                  <Send className="size-4" />
                  Submit Analytics
                </div>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Recent Analytics */}
      {analytics.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-foreground">Recent Submissions</h4>
          <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
            {analytics.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <Card className="rounded-lg border-border/30">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-foreground truncate max-w-[60%]">
                        {item.ideaTitle}
                      </span>
                      <Badge variant="secondary" className={`text-xs ${getPlatformColor(item.platform)}`}>
                        {item.platform}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Eye className="size-3" />
                        {item.views}
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart className="size-3" />
                        {item.likes}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="size-3" />
                        {item.watchTime}s
                      </span>
                      <span className="flex items-center gap-1">
                        <TrendingUp className="size-3" />
                        {item.ctr}%
                      </span>
                    </div>
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
