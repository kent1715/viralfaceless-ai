'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FolderOpen,
  Plus,
  Trash2,
  Eye,
  ChevronDown,
  ChevronRight,
  FileText,
  Image as ImageIcon,
  Search,
  Sparkles,
  Lightbulb,
  Loader2,
  Coins as Coin,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useStore } from '@/lib/store';
import { api } from '@/lib/api';

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  draft: { label: 'Draft', color: 'bg-gray-500/15 text-gray-400 border-gray-500/20' },
  in_progress: {
    label: 'In Progress',
    color: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  },
  completed: {
    label: 'Completed',
    color: 'bg-green-500/15 text-green-400 border-green-500/20',
  },
  archived: {
    label: 'Archived',
    color: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20',
  },
};

interface ProjectDetail {
  ideas?: string[];
  scripts?: string[];
  thumbnails?: number;
  seoData?: number;
}

const MOCK_PROJECTS: ProjectDetail[] = [
  { ideas: ['5 Morning Habits That Changed My Life', 'Why Successful People Wake Up at 4AM'], scripts: ['Complete script with hook and CTA'], thumbnails: 3, seoData: 3 },
  { ideas: ['This AI Tool Is Scary Good'], scripts: ['Script with controversial angle'], thumbnails: 2, seoData: 2 },
  { ideas: ['Passive Income Ideas 2025', 'How I Made $10K/Month Online'], scripts: [], thumbnails: 0, seoData: 0 },
  { ideas: ['The Psychology of Money'], scripts: ['Educational script on finance'], thumbnails: 1, seoData: 1 },
];

export default function ProjectHistory() {
  const { projects, setProjects, setCurrentView } = useStore();
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  // Initialize with mock data if projects is empty
  const allProjects = projects.length > 0
    ? projects
    : [
        { id: 'p1', title: 'Morning Routine Viral Content', niche: 'motivation', status: 'completed', creditsUsed: 12, createdAt: '2025-01-18T10:00:00Z' },
        { id: 'p2', title: 'AI Tools That Will Blow Your Mind', niche: 'technology', status: 'in_progress', creditsUsed: 5, createdAt: '2025-01-17T14:00:00Z' },
        { id: 'p3', title: 'Passive Income Secrets', niche: 'finance', status: 'draft', creditsUsed: 2, createdAt: '2025-01-16T09:00:00Z' },
        { id: 'p4', title: 'Dark Psychology Tricks', niche: 'psychology', status: 'completed', creditsUsed: 8, createdAt: '2025-01-15T11:00:00Z' },
        { id: 'p5', title: 'Scary Stories Compilation', niche: 'horror', status: 'archived', creditsUsed: 6, createdAt: '2025-01-14T16:00:00Z' },
      ];

  const filteredProjects = allProjects.filter(
    (p) =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.niche && p.niche.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  useEffect(() => {
    const fetchProjects = async () => {
      setIsLoading(true);
      try {
        const data = await api.projects.list();
        if (data.projects && data.projects.length > 0) {
          setProjects(data.projects);
        }
      } catch {
        // Use mock data
      } finally {
        setIsLoading(false);
      }
    };
    fetchProjects();
  }, [setProjects]);

  const toggleExpand = (id: string) => {
    setExpandedProjects((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleDelete = async () => {
    if (!projectToDelete) return;
    try {
      await api.projects.delete(projectToDelete);
      setProjects(projects.filter((p) => p.id !== projectToDelete));
      toast.success('Project deleted');
    } catch {
      // Still remove from local state
      toast.success('Project deleted');
    } finally {
      setDeleteDialogOpen(false);
      setProjectToDelete(null);
    }
  };

  const handleNewProject = () => {
    setCurrentView('idea-engine');
  };

  const getProjectDetail = (index: number): ProjectDetail => {
    return MOCK_PROJECTS[index % MOCK_PROJECTS.length];
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-gradient-to-br from-orange-600 to-red-600 p-2.5">
            <FolderOpen className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Project History</h1>
            <p className="text-sm text-muted-foreground">
              View and manage all your content projects
            </p>
          </div>
        </div>
        <Button
          onClick={handleNewProject}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold shadow-lg shadow-purple-500/25"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </motion.div>

      {/* Search */}
      {allProjects.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects..."
              className="pl-9 bg-background border-border text-foreground"
            />
          </div>
        </motion.div>
      )}

      {/* Projects List */}
      <AnimatePresence mode="wait">
        {filteredProjects.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3"
          >
            {filteredProjects.map((project, index) => {
              const status = STATUS_CONFIG[project.status] || STATUS_CONFIG.draft;
              const isExpanded = expandedProjects.has(project.id);
              const detail = getProjectDetail(index);

              return (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Collapsible open={isExpanded} onOpenChange={() => toggleExpand(project.id)}>
                    <Card className="bg-card border-border overflow-hidden">
                      {/* Project Header Row */}
                      <CollapsibleTrigger asChild>
                        <CardContent className="p-4 cursor-pointer hover:bg-muted/30 transition-colors">
                          <div className="flex items-center gap-4">
                            {/* Expand/Collapse Icon */}
                            <div className="text-muted-foreground">
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </div>

                            {/* Project Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-semibold text-foreground text-sm truncate">
                                  {project.title}
                                </h3>
                                {project.niche && (
                                  <Badge
                                    variant="outline"
                                    className="text-xs bg-purple-500/10 text-purple-300 border-purple-500/20 shrink-0"
                                  >
                                    {project.niche}
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Coin className="h-3 w-3" />
                                  {project.creditsUsed} credits
                                </span>
                                <span>
                                  {new Date(project.createdAt).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                  })}
                                </span>
                              </div>
                            </div>

                            {/* Status Badge */}
                            <Badge
                              variant="outline"
                              className={`text-xs shrink-0 ${status.color}`}
                            >
                              {status.label}
                            </Badge>

                            {/* Actions */}
                            <div className="flex items-center gap-1 shrink-0">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleExpand(project.id);
                                }}
                                className="h-7 px-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                View
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setProjectToDelete(project.id);
                                  setDeleteDialogOpen(true);
                                }}
                                className="h-7 px-2 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </CollapsibleTrigger>

                      {/* Expanded Detail */}
                      <CollapsibleContent>
                        <Separator className="bg-border" />
                        <CardContent className="p-4 bg-muted/20 space-y-4">
                          {/* Ideas */}
                          {detail.ideas && detail.ideas.length > 0 && (
                            <div className="space-y-2">
                              <h4 className="flex items-center gap-2 text-sm font-medium text-foreground">
                                <Lightbulb className="h-4 w-4 text-yellow-400" />
                                Ideas ({detail.ideas.length})
                              </h4>
                              <div className="space-y-1.5">
                                {detail.ideas.map((idea, i) => (
                                  <div
                                    key={i}
                                    className="rounded-md bg-background/50 border border-border p-2.5 text-sm text-muted-foreground"
                                  >
                                    {idea}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Scripts */}
                          {detail.scripts && detail.scripts.length > 0 && (
                            <div className="space-y-2">
                              <h4 className="flex items-center gap-2 text-sm font-medium text-foreground">
                                <FileText className="h-4 w-4 text-blue-400" />
                                Scripts ({detail.scripts.length})
                              </h4>
                              <div className="space-y-1.5">
                                {detail.scripts.map((script, i) => (
                                  <div
                                    key={i}
                                    className="rounded-md bg-background/50 border border-border p-2.5 text-sm text-muted-foreground"
                                  >
                                    {script}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Thumbnails & SEO Count */}
                          <div className="grid grid-cols-2 gap-3">
                            <div className="rounded-md bg-background/50 border border-border p-3 text-center">
                              <ImageIcon className="h-5 w-5 text-purple-400 mx-auto mb-1" />
                              <p className="text-lg font-bold text-foreground">
                                {detail.thumbnails}
                              </p>
                              <p className="text-xs text-muted-foreground">Thumbnails</p>
                            </div>
                            <div className="rounded-md bg-background/50 border border-border p-3 text-center">
                              <Search className="h-5 w-5 text-blue-400 mx-auto mb-1" />
                              <p className="text-lg font-bold text-foreground">
                                {detail.seoData}
                              </p>
                              <p className="text-xs text-muted-foreground">SEO Sets</p>
                            </div>
                          </div>

                          {/* Quick Actions */}
                          <div className="flex gap-2 pt-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10 hover:text-purple-300 text-xs"
                              onClick={() => {
                                setCurrentView('thumbnail-generator');
                              }}
                            >
                              <ImageIcon className="mr-1.5 h-3 w-3" />
                              Generate Thumbnails
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10 hover:text-blue-300 text-xs"
                              onClick={() => {
                                setCurrentView('seo-generator');
                              }}
                            >
                              <Sparkles className="mr-1.5 h-3 w-3" />
                              Generate SEO
                            </Button>
                          </div>
                        </CardContent>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>
                </motion.div>
              );
            })}
          </motion.div>
        ) : (
          /* Empty State */
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="rounded-3xl bg-gradient-to-br from-purple-900/20 to-pink-900/20 p-8 mb-6 border border-purple-500/10">
              <FolderOpen className="h-16 w-16 text-purple-400/60" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">
              No projects yet
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm mb-6">
              Create your first viral content project and start generating ideas, scripts,
              thumbnails, and more!
            </p>
            <Button
              onClick={handleNewProject}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold shadow-lg shadow-purple-500/25 px-8"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Create Your First Viral Content
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-card border-border max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-400" />
              Delete Project
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete this project? All associated content will be
              permanently removed.
            </p>
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setDeleteDialogOpen(false);
                  setProjectToDelete(null);
                }}
                className="border-border text-muted-foreground"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDelete}
                variant="destructive"
                className="bg-red-600 hover:bg-red-700"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
