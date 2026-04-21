'use client';

import { motion } from 'framer-motion';
import {
  Coins,
  Folder,
  FileText,
  Crown,
  Zap,
  Lightbulb,
  FileEdit,
  Mic,
  Video,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { ViewName } from '@/lib/types';

// ─── Animation Variants ────────────────────────────────────────────
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
};

// ─── Trending Niches (Mock Data) ───────────────────────────────────
const trendingNiches = [
  { niche: 'Motivation', trend: 'up', change: '+24%', score: 92 },
  { niche: 'Finance', trend: 'up', change: '+18%', score: 87 },
  { niche: 'True Crime', trend: 'up', change: '+31%', score: 95 },
  { niche: 'Psychology', trend: 'down', change: '-5%', score: 72 },
  { niche: 'Technology', trend: 'up', change: '+12%', score: 80 },
  { niche: 'Health', trend: 'down', change: '-3%', score: 68 },
];

// ─── Quick Actions ─────────────────────────────────────────────────
const quickActions: {
  label: string;
  description: string;
  icon: React.ElementType;
  view: ViewName;
  color: string;
  bg: string;
}[] = [
  {
    label: 'Generate Ideas',
    description: 'AI-powered viral content ideas',
    icon: Lightbulb,
    view: 'idea-engine',
    color: 'text-yellow-400',
    bg: 'bg-yellow-400/10',
  },
  {
    label: 'Create Script',
    description: 'Write engaging scripts',
    icon: FileEdit,
    view: 'script-generator',
    color: 'text-blue-400',
    bg: 'bg-blue-400/10',
  },
  {
    label: 'Generate Voice',
    description: 'Text-to-speech narration',
    icon: Mic,
    view: 'tts-engine',
    color: 'text-green-400',
    bg: 'bg-green-400/10',
  },
  {
    label: 'Create Video',
    description: 'Full video production plan',
    icon: Video,
    view: 'video-generator',
    color: 'text-purple-400',
    bg: 'bg-purple-400/10',
  },
];

// ─── Component ──────────────────────────────────────────────────────
export default function Dashboard() {
  const { user, projects, setCurrentView, setSidebarOpen } = useStore();

  const contentGenerated = projects.reduce(
    (sum, p) => sum + (p.creditsUsed || 0),
    0
  );

  const stats = [
    {
      label: 'Total Credits',
      value: user?.credits ?? 0,
      icon: Coins,
      color: 'text-yellow-400',
      bg: 'bg-yellow-400/10',
      borderColor: 'border-yellow-500/20',
    },
    {
      label: 'Projects Created',
      value: projects.length,
      icon: Folder,
      color: 'text-blue-400',
      bg: 'bg-blue-400/10',
      borderColor: 'border-blue-500/20',
    },
    {
      label: 'Content Generated',
      value: contentGenerated,
      icon: FileText,
      color: 'text-green-400',
      bg: 'bg-green-400/10',
      borderColor: 'border-green-500/20',
    },
    {
      label: 'Current Plan',
      value: (user?.plan ?? 'free').charAt(0).toUpperCase() + (user?.plan ?? 'free').slice(1),
      icon: Crown,
      color: 'text-purple-400',
      bg: 'bg-purple-400/10',
      borderColor: 'border-purple-500/20',
      isBadge: true,
    },
  ];

  const handleNavigate = (view: ViewName) => {
    setCurrentView(view);
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Welcome Header */}
      <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Welcome back, {user?.name?.split(' ')[0] ?? 'Creator'} 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            Here&apos;s what&apos;s happening with your content studio
          </p>
        </div>
        <Badge
          variant="outline"
          className="self-start sm:self-auto bg-yellow-500/10 text-yellow-300 border-yellow-500/30 px-3 py-1.5 text-sm font-semibold flex items-center gap-1.5"
        >
          <Coins className="w-3.5 h-3.5" />
          {user?.credits ?? 0} Credits
        </Badge>
      </motion.div>

      {/* Stats Cards */}
      <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.05, duration: 0.4 }}
          >
            <Card
              className={`border ${stat.borderColor} bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-colors duration-200`}
            >
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-2xl font-bold text-foreground">
                        {stat.isBadge ? stat.value : stat.value}
                      </span>
                    </div>
                  </div>
                  <div
                    className={`inline-flex items-center justify-center w-10 h-10 rounded-xl ${stat.bg}`}
                  >
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* 1-Click Viral Mode CTA */}
      <motion.div variants={item}>
        <Card className="overflow-hidden border-purple-500/20 bg-gradient-to-r from-purple-600/10 via-violet-600/10 to-indigo-600/10">
          <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 shadow-lg shadow-purple-500/25"
              >
                <Zap className="w-6 h-6 text-white" />
              </motion.div>
              <div>
                <h3 className="font-bold text-foreground text-lg">
                  1-Click Viral Mode
                </h3>
                <p className="text-sm text-muted-foreground">
                  Generate ideas, scripts, voice, and video automatically
                </p>
              </div>
            </div>
            <Button
              onClick={() => handleNavigate('idea-engine')}
              className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white shadow-lg shadow-purple-500/25 transition-all duration-300 hover:shadow-purple-500/40 whitespace-nowrap"
              size="lg"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Start Creating
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={item}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Quick Actions</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, i) => (
            <motion.button
              key={action.label}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleNavigate(action.view)}
              className="text-left"
            >
              <Card className="h-full border-border/50 bg-card/50 hover:bg-card/80 hover:border-purple-500/20 transition-all duration-200 cursor-pointer group">
                <CardContent className="p-5">
                  <div
                    className={`inline-flex items-center justify-center w-10 h-10 rounded-xl ${action.bg} mb-3 group-hover:scale-110 transition-transform duration-200`}
                  >
                    <action.icon className={`w-5 h-5 ${action.color}`} />
                  </div>
                  <h3 className="font-semibold text-foreground text-sm">
                    {action.label}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {action.description}
                  </p>
                </CardContent>
              </Card>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Recent Projects + Trend Analyzer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Projects */}
        <motion.div variants={item} className="lg:col-span-2">
          <Card className="border-border/50 bg-card/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Recent Projects</CardTitle>
                  <CardDescription className="text-sm mt-1">
                    Your latest content projects
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-foreground"
                  onClick={() => handleNavigate('project-history')}
                >
                  View all
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {projects.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <Folder className="w-10 h-10 text-muted-foreground/40 mb-3" />
                  <p className="text-sm text-muted-foreground">
                    No projects yet
                  </p>
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    Start by generating viral ideas
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4 border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
                    onClick={() => handleNavigate('idea-engine')}
                  >
                    <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                    Get Started
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {projects.slice(0, 5).map((project, i) => (
                    <motion.div
                      key={project.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + i * 0.05, duration: 0.3 }}
                      className="flex items-center justify-between p-3 rounded-lg bg-background/50 hover:bg-background/80 transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                          <FileText className="w-4 h-4 text-purple-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {project.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {project.niche ?? 'General'} · {project.creditsUsed} credits
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge
                          variant="outline"
                          className={`text-[10px] px-2 py-0.5 ${
                            project.status === 'completed'
                              ? 'bg-green-500/10 text-green-300 border-green-500/30'
                              : project.status === 'in_progress'
                              ? 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {project.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Trend Analyzer */}
        <motion.div variants={item}>
          <Card className="border-border/50 bg-card/50 h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-purple-400" />
                Trend Analyzer
              </CardTitle>
              <CardDescription className="text-sm">
                Trending niches right now
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {trendingNiches.map((trend, i) => (
                  <motion.div
                    key={trend.niche}
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + i * 0.06, duration: 0.3 }}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-background/50 hover:bg-background/80 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xs text-muted-foreground/60 font-mono w-4 text-right">
                        {i + 1}
                      </span>
                      <span className="text-sm font-medium text-foreground truncate">
                        {trend.niche}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {/* Mini sparkline bars */}
                      <div className="flex items-end gap-[2px] h-4">
                        {[40, 65, 45, 80, 55, 70, trend.score].map(
                          (h, j) => (
                            <motion.div
                              key={j}
                              initial={{ height: 0 }}
                              animate={{ height: `${h * 0.04}rem` }}
                              transition={{
                                delay: 0.6 + i * 0.06 + j * 0.03,
                                duration: 0.3,
                              }}
                              className={`w-[3px] rounded-sm ${
                                trend.trend === 'up'
                                  ? 'bg-green-500/60'
                                  : 'bg-red-500/60'
                              }`}
                            />
                          )
                        )}
                      </div>
                      <div
                        className={`flex items-center gap-0.5 text-xs font-medium ${
                          trend.trend === 'up'
                            ? 'text-green-400'
                            : 'text-red-400'
                        }`}
                      >
                        {trend.trend === 'up' ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : (
                          <TrendingDown className="w-3 h-3" />
                        )}
                        {trend.change}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <Separator className="my-4 opacity-50" />

              <Button
                variant="outline"
                size="sm"
                className="w-full border-purple-500/30 text-purple-400 hover:bg-purple-500/10 hover:text-purple-300"
                onClick={() => handleNavigate('idea-engine')}
              >
                <Lightbulb className="w-3.5 h-3.5 mr-1.5" />
                Explore Trending Ideas
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
