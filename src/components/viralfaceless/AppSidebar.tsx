'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  LayoutDashboard,
  Lightbulb,
  FileText,
  Mic,
  Video,
  Scissors,
  Image,
  Search,
  Calendar,
  Coins,
  Settings,
  Shield,
  LogOut,
  ChevronLeft,
  X,
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import type { ViewName } from '@/lib/types';

interface NavItem {
  view: ViewName;
  labelKey: string;
  icon: React.ElementType;
  adminOnly?: boolean;
}

const mainNavItems: NavItem[] = [
  { view: 'dashboard', labelKey: 'nav.dashboard', icon: LayoutDashboard },
  { view: 'idea-engine', labelKey: 'nav.ideas', icon: Lightbulb },
  { view: 'script-generator', labelKey: 'nav.scripts', icon: FileText },
  { view: 'tts-engine', labelKey: 'nav.tts', icon: Mic },
  { view: 'video-generator', labelKey: 'nav.videos', icon: Video },
  { view: 'auto-clipper', labelKey: 'nav.clipper', icon: Scissors },
  { view: 'thumbnail-generator', labelKey: 'nav.thumbnail', icon: Image },
  { view: 'seo-generator', labelKey: 'nav.seo', icon: Search },
  { view: 'auto-posting', labelKey: 'nav.posting', icon: Calendar },
  { view: 'credits', labelKey: 'nav.credits', icon: Coins },
];

const adminNavItems: NavItem[] = [
  { view: 'settings', labelKey: 'nav.settings', icon: Settings },
  { view: 'admin', labelKey: 'nav.admin', icon: Shield, adminOnly: true },
];

function NavButton({
  item,
  isActive,
  onClick,
}: {
  item: NavItem;
  isActive: boolean;
  onClick: () => void;
}) {
  const { t } = useI18n();
  const Icon = item.icon;

  return (
    <motion.div whileTap={{ scale: 0.97 }}>
      <button
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative
          ${
            isActive
              ? 'bg-gradient-to-r from-purple-600/20 to-violet-600/10 text-purple-300 border border-purple-500/20'
              : 'text-muted-foreground hover:text-foreground hover:bg-accent'
          }`}
      >
        <Icon
          className={`h-4.5 w-4.5 flex-shrink-0 ${
            isActive ? 'text-purple-400' : 'text-muted-foreground group-hover:text-foreground'
          }`}
        />
        <span className="truncate">{t(item.labelKey)}</span>
        {isActive && (
          <motion.div
            layoutId="sidebar-active"
            className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-purple-500"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />
        )}
      </button>
    </motion.div>
  );
}

function SidebarContent({
  onNavigate,
}: {
  onNavigate?: (view: ViewName) => void;
}) {
  const {
    user,
    currentView,
    setCurrentView,
    logout,
    sidebarOpen,
    setSidebarOpen,
  } = useStore();
  const { t } = useI18n();
  const isMobile = useIsMobile();

  const handleNavClick = (view: ViewName) => {
    setCurrentView(view);
    if (isMobile && onNavigate) {
      onNavigate(view);
    }
  };

  const handleLogout = () => {
    logout();
    if (isMobile && onNavigate) {
      onNavigate('login');
    }
  };

  const userInitials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';

  const planColors: Record<string, string> = {
    free: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
    pro: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    premium: 'bg-gradient-to-r from-purple-500/20 to-violet-500/20 text-purple-300 border-purple-500/30',
  };

  return (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="flex items-center justify-between px-4 py-5">
        <div className="flex items-center gap-2.5">
          <div className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500 to-violet-600 shadow-md shadow-purple-500/20">
            <Sparkles className="w-4.5 h-4.5 text-white" />
          </div>
          <span className="font-bold text-foreground text-[15px] tracking-tight">
            {t('brand.name')}
          </span>
        </div>
        {!isMobile && sidebarOpen && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={() => setSidebarOpen(false)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}
      </div>

      <Separator className="opacity-50" />

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-3">
        <div className="space-y-1">
          {mainNavItems.map((item) => (
            <NavButton
              key={item.view}
              item={item}
              isActive={currentView === item.view}
              onClick={() => handleNavClick(item.view)}
            />
          ))}
        </div>

        {/* Admin section */}
        {user?.role === 'admin' && (
          <>
            <Separator className="my-3 opacity-50" />
            <p className="text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-wider px-3 mb-2">
              {t('nav.adminSection')}
            </p>
            <div className="space-y-1">
              {adminNavItems.map((item) => (
                <NavButton
                  key={item.view}
                  item={item}
                  isActive={currentView === item.view}
                  onClick={() => handleNavClick(item.view)}
                />
              ))}
            </div>
          </>
        )}
      </ScrollArea>

      {/* Credits */}
      <div className="px-4 py-3">
        <div className="flex items-center justify-between p-3 rounded-xl bg-card border border-border/50">
          <div className="flex items-center gap-2">
            <Coins className="h-4 w-4 text-yellow-400" />
            <span className="text-sm font-medium text-foreground">{t('nav.credits')}</span>
          </div>
          <Badge
            variant="outline"
            className="bg-yellow-500/10 text-yellow-300 border-yellow-500/30 font-semibold"
          >
            {user?.credits ?? 0}
          </Badge>
        </div>
      </div>

      <Separator className="opacity-50" />

      {/* User info + Logout */}
      <div className="px-4 py-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9 border border-border/50">
            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-violet-600 text-white text-xs font-semibold">
              {userInitials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {user?.name ?? t('nav.user')}
            </p>
            <Badge
              variant="outline"
              className={`text-[10px] px-1.5 py-0 ${
                planColors[user?.plan ?? 'free'] ?? planColors.free
              }`}
            >
              {(user?.plan ?? 'free').toUpperCase()}
            </Badge>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">{t('nav.signOut')}</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}

export default function AppSidebar() {
  const { sidebarOpen, setSidebarOpen } = useStore();
  const { t } = useI18n();
  const isMobile = useIsMobile();

  // Mobile sidebar - Sheet
  if (isMobile) {
    return (
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="fixed top-3 left-3 z-50 h-9 w-9 text-foreground lg:hidden"
          >
            <LayoutDashboard className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0 bg-card border-border/50">
          <SheetHeader className="sr-only">
            <SheetTitle>{t('nav.navigation')}</SheetTitle>
          </SheetHeader>
          <SidebarContent />
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop sidebar
  return (
    <AnimatePresence mode="wait">
      {sidebarOpen && (
        <motion.aside
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 256, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed left-0 top-0 bottom-0 z-30 border-r border-border/50 bg-card/80 backdrop-blur-xl overflow-hidden flex-shrink-0"
        >
          <div className="w-64 h-full">
            <SidebarContent />
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
