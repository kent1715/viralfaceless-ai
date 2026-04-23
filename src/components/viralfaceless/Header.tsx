'use client';

import { motion } from 'framer-motion';
import {
  Menu,
  Coins,
  Bell,
  LogOut,
  User,
  LayoutDashboard,
  Lightbulb,
  FileText,
  Mic,
  Video,
  Scissors,
  Image,
  Search,
  Calendar,
  Settings,
  Shield,
  Sparkles,
  CreditCard,
  Globe,
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { useI18n, type Language } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useIsMobile } from '@/hooks/use-mobile';
import type { ViewName } from '@/lib/types';

const viewLabelKeys: Record<ViewName, string> = {
  login: 'header.signIn',
  register: 'header.createAccount',
  dashboard: 'nav.dashboard',
  'idea-engine': 'nav.ideas',
  'script-generator': 'nav.scripts',
  'tts-engine': 'nav.tts',
  'video-generator': 'nav.videos',
  'auto-clipper': 'nav.clipper',
  'thumbnail-generator': 'nav.thumbnail',
  'seo-generator': 'nav.seo',
  'auto-posting': 'nav.posting',
  credits: 'nav.credits',
  admin: 'nav.admin',
  settings: 'nav.settings',
  'project-history': 'nav.projectHistory',
};

const viewIcons: Partial<Record<ViewName, React.ElementType>> = {
  dashboard: LayoutDashboard,
  'idea-engine': Lightbulb,
  'script-generator': FileText,
  'tts-engine': Mic,
  'video-generator': Video,
  'auto-clipper': Scissors,
  'thumbnail-generator': Image,
  'seo-generator': Search,
  'auto-posting': Calendar,
  credits: CreditCard,
  admin: Shield,
  settings: Settings,
  'project-history': FileText,
};

export default function Header() {
  const {
    user,
    currentView,
    sidebarOpen,
    setSidebarOpen,
    logout,
    setCurrentView,
  } = useStore();
  const { lang, setLang, t } = useI18n();
  const isMobile = useIsMobile();

  const pageTitle = t(viewLabelKeys[currentView] ?? 'nav.dashboard');
  const PageIcon = viewIcons[currentView] ?? LayoutDashboard;
  const pageHasIcon = currentView !== 'login' && currentView !== 'register';

  const userInitials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';

  const handleLogout = () => {
    logout();
  };

  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="sticky top-0 z-20 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl"
    >
      <div className="flex items-center justify-between h-14 px-4 lg:px-6">
        {/* Left side */}
        <div className="flex items-center gap-3">
          {/* Hamburger menu (mobile only) */}
          {isMobile && (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-foreground"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}

          {/* Desktop sidebar toggle */}
          {!isMobile && (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-muted-foreground hover:text-foreground"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu className="h-4 w-4" />
            </Button>
          )}

          {/* Page title */}
          <div className="flex items-center gap-2">
            {pageHasIcon && (
              <PageIcon className="h-4.5 w-4.5 text-purple-400" />
            )}
            <h1 className="text-base font-semibold text-foreground">
              {pageTitle}
            </h1>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Credits badge */}
          <Badge
            variant="outline"
            className="bg-yellow-500/10 text-yellow-300 border-yellow-500/30 px-2.5 py-1 text-xs font-semibold hidden sm:flex items-center gap-1.5"
          >
            <Coins className="w-3 h-3" />
            {user?.credits ?? 0}
          </Badge>

          {/* Notification bell */}
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-muted-foreground hover:text-foreground relative"
          >
            <Bell className="h-4 w-4" />
            {/* Notification dot */}
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-purple-500" />
          </Button>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Language switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Globe className="size-4" />
                <span className="text-[10px] font-bold ml-0.5">{lang === 'en' ? 'EN' : 'ID'}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setLang('en')} className={lang === 'en' ? 'bg-accent' : ''}>
                🇬🇧 English
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLang('id')} className={lang === 'id' ? 'bg-accent' : ''}>
                🇮🇩 Bahasa Indonesia
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center gap-2 h-9 px-2 hover:bg-accent"
              >
                <Avatar className="h-7 w-7 border border-border/50">
                  <AvatarFallback className="bg-gradient-to-br from-purple-500 to-violet-600 text-white text-[10px] font-semibold">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden sm:block text-sm font-medium text-foreground max-w-[120px] truncate">
                  {user?.name ?? t('nav.user')}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56 bg-card border-border/50"
            >
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium text-foreground">
                    {user?.name ?? t('nav.user')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {user?.email ?? ''}
                  </p>
                  <Badge
                    variant="outline"
                    className={`text-[10px] w-fit mt-1 ${
                      (user?.plan ?? 'free') === 'premium'
                        ? 'bg-gradient-to-r from-purple-500/20 to-violet-500/20 text-purple-300 border-purple-500/30'
                        : (user?.plan ?? 'free') === 'pro'
                        ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {(user?.plan ?? 'free').toUpperCase()} {t('header.plan')}
                  </Badge>
                </div>
              </DropdownMenuLabel>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={() => setCurrentView('dashboard')}
                className="text-muted-foreground focus:text-foreground cursor-pointer"
              >
                <LayoutDashboard className="mr-2 h-4 w-4" />
                {t('nav.dashboard')}
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => setCurrentView('credits')}
                className="text-muted-foreground focus:text-foreground cursor-pointer"
              >
                <Coins className="mr-2 h-4 w-4" />
                {t('nav.buyCredits')}
              </DropdownMenuItem>

              {user?.role === 'admin' && (
                <DropdownMenuItem
                  onClick={() => setCurrentView('admin')}
                  className="text-muted-foreground focus:text-foreground cursor-pointer"
                >
                  <Shield className="mr-2 h-4 w-4" />
                  {t('nav.admin')}
                </DropdownMenuItem>
              )}

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={handleLogout}
                className="text-red-400 focus:text-red-300 focus:bg-red-500/10 cursor-pointer"
              >
                <LogOut className="mr-2 h-4 w-4" />
                {t('nav.signOut')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </motion.header>
  );
}
