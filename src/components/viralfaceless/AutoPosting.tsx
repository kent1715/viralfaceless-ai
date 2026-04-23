'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Clock,
  Youtube,
  Music,
  Instagram,
  CheckCircle2,
  Link2,
  Image as ImageIcon,
  Pencil,
  Trash2,
  Play,
  CalendarDays,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useStore } from '@/lib/store';
import { PLATFORMS } from '@/lib/constants';
import type { ScheduledPost } from '@/lib/types';
import { useI18n } from '@/lib/i18n';

const PLATFORM_ICONS: Record<string, React.ReactNode> = {
  youtube: <Youtube className="h-5 w-5" />,
  tiktok: <Music className="h-5 w-5" />,
  instagram: <Instagram className="h-5 w-5" />,
};

const MOCK_SCHEDULED_POSTS: ScheduledPost[] = [
  {
    id: '1',
    platform: 'youtube',
    title: '5 Habits That Changed My Life Forever',
    status: 'scheduled',
    scheduledAt: '2025-01-20T14:00:00Z',
  },
  {
    id: '2',
    platform: 'tiktok',
    title: 'This AI Tool Does What?!',
    status: 'published',
    publishedAt: '2025-01-18T10:00:00Z',
  },
  {
    id: '3',
    platform: 'instagram',
    title: 'Morning Routine of a Millionaire',
    status: 'draft',
  },
  {
    id: '4',
    platform: 'youtube',
    title: 'The Truth About Passive Income',
    status: 'scheduled',
    scheduledAt: '2025-01-22T16:00:00Z',
  },
  {
    id: '5',
    platform: 'tiktok',
    title: 'You Won\'t Believe What Happens Next...',
    status: 'published',
    publishedAt: '2025-01-15T08:00:00Z',
  },
];

export default function AutoPosting() {
  const { t } = useI18n();
  const { scheduledPosts, setScheduledPosts } = useStore();

  const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    draft: { label: t('posting.status.draft'), color: 'bg-gray-500/15 text-gray-400 border-gray-500/20' },
    scheduled: {
      label: t('posting.status.scheduled'),
      color: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20',
    },
    published: {
      label: t('posting.status.published'),
      color: 'bg-green-500/15 text-green-400 border-green-500/20',
    },
  };

  // Platform connections
  const [connectedPlatforms, setConnectedPlatforms] = useState<Record<string, boolean>>({
    youtube: false,
    tiktok: false,
    instagram: false,
  });

  // Post form
  const [postPlatform, setPostPlatform] = useState('');
  const [postTitle, setPostTitle] = useState('');
  const [postDescription, setPostDescription] = useState('');
  const [postTags, setPostTags] = useState('');
  const [postVideoUrl, setPostVideoUrl] = useState('');
  const [postThumbnailUrl, setPostThumbnailUrl] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [posts, setPosts] = useState<ScheduledPost[]>(MOCK_SCHEDULED_POSTS);

  const toggleConnection = (platform: string) => {
    setConnectedPlatforms((prev) => {
      const newVal = !prev[platform];
      const platformLabel = PLATFORMS.find((p) => p.value === platform)?.label || '';
      toast.success(
        newVal
          ? t('posting.platformConnected').replace('{platform}', platformLabel)
          : t('posting.platformDisconnected').replace('{platform}', platformLabel)
      );
      return { ...prev, [platform]: newVal };
    });
  };

  const handlePostNow = async () => {
    if (!postPlatform) {
      toast.error(t('posting.error.noPlatform'));
      return;
    }
    if (!postTitle.trim()) {
      toast.error(t('posting.error.noTitle'));
      return;
    }
    if (!connectedPlatforms[postPlatform]) {
      toast.error(t('posting.error.connectFirst').replace('{platform}', PLATFORMS.find((p) => p.value === postPlatform)?.label || ''));
      return;
    }

    setIsSubmitting(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const newPost: ScheduledPost = {
      id: Date.now().toString(),
      platform: postPlatform,
      title: postTitle,
      status: 'published',
      publishedAt: new Date().toISOString(),
    };

    setPosts((prev) => [newPost, ...prev]);
    setScheduledPosts(posts);
    toast.success(t('posting.error.published'));

    // Reset form
    setPostPlatform('');
    setPostTitle('');
    setPostDescription('');
    setPostTags('');
    setPostVideoUrl('');
    setPostThumbnailUrl('');
    setIsSubmitting(false);
  };

  const handleSchedule = async () => {
    if (!postPlatform || !postTitle.trim()) {
      toast.error(t('posting.error.fillFields'));
      return;
    }
    if (!scheduleDate || !scheduleTime) {
      toast.error(t('posting.error.noDatetime'));
      return;
    }
    if (!connectedPlatforms[postPlatform]) {
      toast.error(t('posting.error.connectFirst').replace('{platform}', PLATFORMS.find((p) => p.value === postPlatform)?.label || ''));
      return;
    }

    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const newPost: ScheduledPost = {
      id: Date.now().toString(),
      platform: postPlatform,
      title: postTitle,
      status: 'scheduled',
      scheduledAt: new Date(`${scheduleDate}T${scheduleTime}`).toISOString(),
    };

    setPosts((prev) => [newPost, ...prev]);
    setScheduledPosts(posts);
    toast.success(t('posting.error.scheduled'));

    setScheduleDate('');
    setScheduleTime('');
    setIsSubmitting(false);
  };

  const handleDelete = (id: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== id));
    toast.success(t('posting.error.deleted'));
  };

  const handlePublishNow = (id: string) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, status: 'published', publishedAt: new Date().toISOString() }
          : p
      )
    );
    toast.success(t('posting.error.publishedNow'));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <div className="rounded-lg bg-gradient-to-br from-blue-600 to-cyan-600 p-2.5">
          <Send className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('posting.title')}</h1>
          <p className="text-sm text-muted-foreground">
            {t('posting.subtitle')}
          </p>
        </div>
      </motion.div>

      {/* Platform Connections */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <h3 className="mb-3 text-sm font-medium text-muted-foreground">
          {t('posting.platformConnections')}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {PLATFORMS.map((platform) => {
            const isConnected = connectedPlatforms[platform.value];
            return (
              <Card
                key={platform.value}
                className={`border ${
                  isConnected
                    ? 'border-green-500/30 bg-green-500/5'
                    : 'border-border bg-card'
                }`}
              >
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`rounded-lg p-2 ${
                        isConnected ? 'bg-green-500/20 text-green-400' : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {PLATFORM_ICONS[platform.value]}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground text-sm">
                        {platform.label}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {isConnected ? t('posting.connected') : t('posting.notConnected')}
                      </p>
                    </div>
                  </div>
                  {isConnected ? (
                    <CheckCircle2 className="h-5 w-5 text-green-400" />
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleConnection(platform.value)}
                      className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10 hover:text-purple-300 text-xs"
                    >
                      <Link2 className="mr-1 h-3 w-3" />
                      {t('posting.connect')}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </motion.div>

      {/* Create Post Form */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="bg-card border-border">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
              <Pencil className="h-4 w-4 text-purple-400" />
              {t('posting.createPost')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Platform */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground">{t('posting.platform')}</Label>
                <Select value={postPlatform} onValueChange={setPostPlatform}>
                  <SelectTrigger className="bg-background border-border">
                    <SelectValue placeholder={t('posting.selectPlatform')} />
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

              {/* Title */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground">{t('posting.postTitle')}</Label>
                <Input
                  value={postTitle}
                  onChange={(e) => setPostTitle(e.target.value)}
                  placeholder={t('posting.postTitlePlaceholder')}
                  className="bg-background border-border text-foreground"
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">{t('posting.postDesc')}</Label>
              <Textarea
                value={postDescription}
                onChange={(e) => setPostDescription(e.target.value)}
                placeholder={t('posting.postDescPlaceholder')}
                rows={3}
                className="resize-none bg-background border-border text-foreground"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Tags */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground">{t('posting.tags')}</Label>
                <Input
                  value={postTags}
                  onChange={(e) => setPostTags(e.target.value)}
                  placeholder={t('posting.tagsPlaceholder')}
                  className="bg-background border-border text-foreground"
                />
              </div>

              {/* Video URL */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground">{t('posting.videoUrl')}</Label>
                <Input
                  value={postVideoUrl}
                  onChange={(e) => setPostVideoUrl(e.target.value)}
                  placeholder="https://..."
                  className="bg-background border-border text-foreground"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Thumbnail URL */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                  <ImageIcon className="h-3.5 w-3.5" />
                  {t('posting.thumbnailUrl')}
                </Label>
                <Input
                  value={postThumbnailUrl}
                  onChange={(e) => setPostThumbnailUrl(e.target.value)}
                  placeholder="https://..."
                  className="bg-background border-border text-foreground"
                />
              </div>

              {/* Schedule */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {t('posting.schedule')}
                </Label>
                <div className="flex gap-2">
                  <Input
                    type="date"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    className="bg-background border-border text-foreground flex-1"
                  />
                  <Input
                    type="time"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    className="bg-background border-border text-foreground w-32"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <Button
                onClick={handlePostNow}
                disabled={isSubmitting || !postPlatform || !postTitle.trim()}
                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold shadow-lg shadow-green-500/25"
              >
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Play className="mr-2 h-4 w-4" />
                )}
                {t('posting.postNow')}
              </Button>
              <Button
                onClick={handleSchedule}
                disabled={
                  isSubmitting || !postPlatform || !postTitle.trim() || !scheduleDate || !scheduleTime
                }
                className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold shadow-lg shadow-blue-500/25"
              >
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Clock className="mr-2 h-4 w-4" />
                )}
                {t('posting.scheduleBtn')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Scheduled Posts Table */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <Card className="bg-card border-border">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-400" />
              {t('posting.scheduledPosts')}
              <span className="text-sm font-normal text-muted-foreground">
                ({posts.length})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-muted-foreground">{t('posting.tablePlatform')}</TableHead>
                    <TableHead className="text-muted-foreground">{t('posting.tableTitle')}</TableHead>
                    <TableHead className="text-muted-foreground">{t('posting.tableStatus')}</TableHead>
                    <TableHead className="text-muted-foreground">{t('posting.tableDate')}</TableHead>
                    <TableHead className="text-muted-foreground text-right">{t('posting.tableActions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {posts.map((post, index) => {
                    const status = STATUS_CONFIG[post.status] || STATUS_CONFIG.draft;
                    const dateStr = post.scheduledAt
                      ? new Date(post.scheduledAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : post.publishedAt
                        ? new Date(post.publishedAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '-';

                    return (
                      <motion.tr
                        key={post.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="border-border hover:bg-muted/30 transition-colors"
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {PLATFORM_ICONS[post.platform]}
                            <span className="text-sm text-foreground capitalize">
                              {post.platform}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-foreground max-w-[200px] truncate">
                          {post.title}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`text-xs ${status.color}`}
                          >
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {dateStr}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {post.status === 'scheduled' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handlePublishNow(post.id)}
                                className="h-7 px-2 text-green-400 hover:text-green-300 hover:bg-green-500/10"
                              >
                                <Play className="h-3 w-3 mr-1" />
                                {t('posting.publish')}
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(post.id)}
                              className="h-7 px-2 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </motion.tr>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {posts.length === 0 && (
              <div className="flex flex-col items-center py-12 text-center">
                <Send className="h-10 w-10 text-muted-foreground/40 mb-3" />
                <p className="text-muted-foreground">{t('posting.noPosts')}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
