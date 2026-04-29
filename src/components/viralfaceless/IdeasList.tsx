'use client';

import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { IdeaCard } from './IdeaCard';
import { Sparkles, RefreshCw } from 'lucide-react';
import { useAppStore, type IdeaItem } from '@/lib/store';

export function IdeasList() {
  const { token, setIdeas, setActiveTab, addIdeas } = useAppStore();
  const ideas = useAppStore((s) => s.ideas);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    const doFetch = async () => {
      try {
        const res = await fetch('/api/ideas?skip=0&take=20', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          if (res.status === 401) {
            useAppStore.getState().logout();
          }
          return;
        }

        const data = await res.json();
        const fetchedIdeas: IdeaItem[] = (data.ideas || []).map((idea: Record<string, unknown>) => ({
          ...idea,
          emotionalTrigger: Array.isArray(idea.emotionalTrigger) ? idea.emotionalTrigger : [],
        }));
        setIdeas(fetchedIdeas);
        setHasMore(data.pagination?.hasMore ?? false);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };

    doFetch();
  }, [token, setIdeas]);

  const handleLoadMore = async () => {
    const nextPage = page + 1;
    setPage(nextPage);
    try {
      const skip = nextPage * 20;
      const res = await fetch(`/api/ideas?skip=${skip}&take=20`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        const fetchedIdeas: IdeaItem[] = (data.ideas || []).map((idea: Record<string, unknown>) => ({
          ...idea,
          emotionalTrigger: Array.isArray(idea.emotionalTrigger) ? idea.emotionalTrigger : [],
        }));
        addIdeas(fetchedIdeas);
        setHasMore(data.pagination?.hasMore ?? false);
      }
    } catch {
      // silent
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    fetchedRef.current = false;
    setPage(1);
    setHasMore(true);
    const doRefresh = async () => {
      try {
        const res = await fetch('/api/ideas?skip=0&take=20', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          const fetchedIdeas: IdeaItem[] = (data.ideas || []).map((idea: Record<string, unknown>) => ({
            ...idea,
            emotionalTrigger: Array.isArray(idea.emotionalTrigger) ? idea.emotionalTrigger : [],
          }));
          setIdeas(fetchedIdeas);
          setHasMore(data.pagination?.hasMore ?? false);
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };
    doRefresh();
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="rounded-xl border-border/50">
            <CardContent className="p-4 space-y-3">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <div className="flex gap-2">
                <Skeleton className="h-5 w-14 rounded-full" />
                <Skeleton className="h-5 w-14 rounded-full" />
                <Skeleton className="h-5 w-14 rounded-full" />
              </div>
              <Skeleton className="h-2 w-full rounded-full" />
              <Skeleton className="h-2 w-full rounded-full" />
              <Skeleton className="h-9 w-full rounded-lg" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (ideas.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center py-16 text-center"
      >
        <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-emerald-500/10">
          <Sparkles className="size-8 text-emerald-500" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">No ideas yet</h3>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Generate your first viral ideas to get started on your faceless channel journey.
        </p>
        <Button
          onClick={() => setActiveTab('generate')}
          className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          <Sparkles className="mr-2 size-4" />
          Generate Ideas
        </Button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">
          My Ideas ({ideas.length})
        </h3>
        <Button variant="ghost" size="icon" onClick={handleRefresh}>
          <RefreshCw className="size-4" />
        </Button>
      </div>

      <div className="space-y-3 max-h-[calc(100vh-280px)] overflow-y-auto pr-1 custom-scrollbar">
        {ideas.map((idea, index) => (
          <motion.div
            key={idea.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <IdeaCard idea={idea} />
          </motion.div>
        ))}

        {hasMore && (
          <div className="flex justify-center pt-4">
            <Button variant="outline" onClick={handleLoadMore}>
              Load More
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
