#!/bin/bash
# ============================================
# ViralFaceless AI — EC2 Full Deploy Script
# Paste this entire script into your EC2 terminal
# ============================================
set +H  # Disable history expansion (! won't cause issues)

# Navigate to project
cd /home/ubuntu/viralfaceless-ai || cd ~/viralfaceless-ai || { echo "ERROR: Cannot find project directory"; exit 1; }

echo "=== Creating directories ==="
mkdir -p src/components/viralfaceless
mkdir -p src/components/ui
mkdir -p src/lib
mkdir -p src/hooks
mkdir -p src/app/api/ideas/generate
mkdir -p src/app/api/scripts/generate
mkdir -p src/app/api/analytics
mkdir -p src/app/api/auth/login
mkdir -p src/app/api/auth/register

# ============================================
# PRISMA SCHEMA
# ============================================
echo "=== Writing prisma/schema.prisma ==="
cat > prisma/schema.prisma << 'VFEOF'
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  password  String
  credits   Int      @default(10)
  plan      String   @default("free")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  ideas     ViralIdea[]
  scripts   Script[]
  analytics ViralAnalytics[]
}

model ViralIdea {
  id               String   @id @default(cuid())
  userId           String
  niche            String
  title            String
  hook             String
  emotionalTrigger Json
  viralityScore    Int      @default(0)
  curiosityScore   Int      @default(0)
  reason           String
  language         String   @default("en")
  createdAt        DateTime @default(now())

  user      User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  analytics ViralAnalytics[]
  scripts   Script[]

  @@index([userId])
  @@index([niche])
}

model Script {
  id        String   @id @default(cuid())
  ideaId    String
  userId    String
  content   Json
  language  String   @default("en")
  createdAt DateTime @default(now())

  idea ViralIdea @relation(fields: [ideaId], references: [id], onDelete: Cascade)
  user User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([ideaId])
  @@index([userId])
}

model ViralAnalytics {
  id          String   @id @default(cuid())
  ideaId      String
  userId      String
  platform    String
  ctr         Float    @default(0)
  retention   Float    @default(0)
  watchTime   Float    @default(0)
  likes       Int      @default(0)
  shares      Int      @default(0)
  comments    Int      @default(0)
  views       Int      @default(0)
  createdAt   DateTime @default(now())

  idea  ViralIdea @relation(fields: [ideaId], references: [id], onDelete: Cascade)
  user  User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([ideaId])
  @@index([platform])
  @@index([createdAt])
}
VFEOF

# ============================================
# NEXT CONFIG — NO standalone (fixes ChunkLoadError)
# ============================================
echo "=== Writing next.config.ts ==="
cat > next.config.ts << 'VFEOF'
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
VFEOF

# ============================================
# PACKAGE.JSON — Fixed scripts + all deps
# ============================================
echo "=== Writing package.json ==="
cat > package.json << 'VFEOF'
{
  "name": "viralfaceless-ai",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev -p 3000",
    "build": "next build",
    "start": "next start",
    "lint": "eslint .",
    "db:push": "prisma db push",
    "db:generate": "prisma generate"
  },
  "dependencies": {
    "@hookform/resolvers": "^5.1.1",
    "@prisma/client": "^6.11.1",
    "@radix-ui/react-avatar": "^1.1.10",
    "@radix-ui/react-label": "^2.1.7",
    "@radix-ui/react-select": "^2.2.5",
    "@radix-ui/react-separator": "^1.1.7",
    "@radix-ui/react-slot": "^1.2.3",
    "@radix-ui/react-tabs": "^1.1.12",
    "bcryptjs": "^2.4.3",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "framer-motion": "^12.23.2",
    "jsonwebtoken": "^9.0.2",
    "lucide-react": "^0.525.0",
    "next": "^16.1.1",
    "next-themes": "^0.4.6",
    "prisma": "^6.11.1",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "tailwind-merge": "^3.3.1",
    "tailwindcss-animate": "^1.0.7",
    "zustand": "^5.0.6"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "@types/bcryptjs": "^2.4.6",
    "@types/jsonwebtoken": "^9.0.9",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "eslint": "^9",
    "eslint-config-next": "^16.1.1",
    "tailwindcss": "^4",
    "tw-animate-css": "^1.3.5",
    "typescript": "^5"
  }
}
VFEOF

# ============================================
# LIB FILES
# ============================================
echo "=== Writing src/lib/utils.ts ==="
cat > src/lib/utils.ts << 'VFEOF'
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
VFEOF

echo "=== Writing src/lib/db.ts ==="
cat > src/lib/db.ts << 'VFEOF'
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
VFEOF

echo "=== Writing src/lib/auth.ts ==="
cat > src/lib/auth.ts << 'VFEOF'
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'vf-app-dev-secret-change-in-production';

export async function hashPassword(password: string): Promise<string> {
  return bcryptjs.hash(password, 12);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcryptjs.compare(password, hash);
}

export function signToken(payload: { userId: string; email: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): { userId: string; email: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
    return decoded;
  } catch {
    return null;
  }
}

export function getUserFromRequest(request: Request): { userId: string; email: string } | null {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.substring(7);
  return verifyToken(token);
}
VFEOF

echo "=== Writing src/lib/store.ts ==="
cat > src/lib/store.ts << 'VFEOF'
import { create } from 'zustand';

export interface IdeaItem {
  id: string;
  niche: string;
  title: string;
  hook: string;
  emotionalTrigger: string[];
  viralityScore: number;
  curiosityScore: number;
  reason: string;
  language: string;
  createdAt: string;
}

export interface ScriptItem {
  id: string;
  ideaId: string;
  content: {
    scenes: Array<{
      number: number;
      duration: number;
      voiceover: string;
      visualDescription: string;
      onScreenText: string;
    }>;
    totalDuration: number;
    voiceoverFull: string;
    visualNotes: string;
  };
  language: string;
  createdAt: string;
}

export interface UserState {
  id: string;
  email: string;
  name: string;
  credits: number;
  plan: string;
}

interface AppStore {
  user: UserState | null;
  token: string | null;
  setUser: (user: UserState, token: string) => void;
  logout: () => void;
  ideas: IdeaItem[];
  setIdeas: (ideas: IdeaItem[]) => void;
  addIdeas: (ideas: IdeaItem[]) => void;
  scripts: ScriptItem[];
  setScripts: (scripts: ScriptItem[]) => void;
  addScript: (script: ScriptItem) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  activeTab: 'generate' | 'ideas' | 'analytics';
  setActiveTab: (tab: 'generate' | 'ideas' | 'analytics') => void;
  selectedIdea: IdeaItem | null;
  setSelectedIdea: (idea: IdeaItem | null) => void;
  niche: string;
  setNiche: (niche: string) => void;
  language: string;
  setLanguage: (lang: string) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  user: null,
  token: null,
  setUser: (user, token) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('vf_token', token);
      localStorage.setItem('vf_user', JSON.stringify(user));
    }
    set({ user, token });
  },
  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('vf_token');
      localStorage.removeItem('vf_user');
    }
    set({
      user: null,
      token: null,
      ideas: [],
      scripts: [],
      activeTab: 'generate',
      selectedIdea: null,
      niche: '',
      language: 'en',
    });
  },
  ideas: [],
  setIdeas: (ideas) => set({ ideas }),
  addIdeas: (ideas) => set((state) => ({ ideas: [...ideas, ...state.ideas] })),
  scripts: [],
  setScripts: (scripts) => set({ scripts }),
  addScript: (script) => set((state) => ({ scripts: [...state.scripts, script] })),
  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),
  activeTab: 'generate',
  setActiveTab: (tab) => set({ activeTab: tab }),
  selectedIdea: null,
  setSelectedIdea: (idea) => set({ selectedIdea: idea }),
  niche: '',
  setNiche: (niche) => set({ niche }),
  language: 'en',
  setLanguage: (lang) => set({ language: lang }),
}));
VFEOF

# ============================================
# UI COMPONENTS
# ============================================
echo "=== Writing UI components ==="

cat > src/components/ui/button.tsx << 'VFEOF'
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
        destructive:
          "bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
VFEOF

cat > src/components/ui/badge.tsx << 'VFEOF'
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
        destructive:
          "border-transparent bg-destructive text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
VFEOF

cat > src/components/ui/separator.tsx << 'VFEOF'
"use client"

import * as React from "react"
import * as SeparatorPrimitive from "@radix-ui/react-separator"

import { cn } from "@/lib/utils"

function Separator({
  className,
  orientation = "horizontal",
  decorative = true,
  ...props
}: React.ComponentProps<typeof SeparatorPrimitive.Root>) {
  return (
    <SeparatorPrimitive.Root
      data-slot="separator"
      decorative={decorative}
      orientation={orientation}
      className={cn(
        "bg-border shrink-0 data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px",
        className
      )}
      {...props}
    />
  )
}

export { Separator }
VFEOF

cat > src/components/ui/tabs.tsx << 'VFEOF'
"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"

function Tabs({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  )
}

function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        "bg-muted text-muted-foreground inline-flex h-9 w-fit items-center justify-center rounded-lg p-[3px]",
        className
      )}
      {...props}
    />
  )
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "data-[state=active]:bg-background dark:data-[state=active]:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring dark:data-[state=active]:border-input dark:data-[state=active]:bg-input/30 text-foreground dark:text-muted-foreground inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:ring-[3px] focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:shadow-sm [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    />
  )
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1 outline-none", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
VFEOF

cat > src/components/ui/avatar.tsx << 'VFEOF'
"use client"

import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"

import { cn } from "@/lib/utils"

function Avatar({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Root>) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      className={cn(
        "relative flex size-8 shrink-0 overflow-hidden rounded-full",
        className
      )}
      {...props}
    />
  )
}

function AvatarImage({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Image>) {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={cn("aspect-square size-full", className)}
      {...props}
    />
  )
}

function AvatarFallback({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Fallback>) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn(
        "bg-muted flex size-full items-center justify-center rounded-full",
        className
      )}
      {...props}
    />
  )
}

export { Avatar, AvatarImage, AvatarFallback }
VFEOF

cat > src/components/ui/card.tsx << 'VFEOF'
import * as React from "react"

import { cn } from "@/lib/utils"

function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn(
        "bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm",
        className
      )}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn("leading-none font-semibold", className)}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-6", className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center px-6 [.border-t]:pt-6", className)}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}
VFEOF

cat > src/components/ui/input.tsx << 'VFEOF'
import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className
      )}
      {...props}
    />
  )
}

export { Input }
VFEOF

cat > src/components/ui/select.tsx << 'VFEOF'
"use client"

import * as React from "react"
import * as SelectPrimitive from "@radix-ui/react-select"
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react"

import { cn } from "@/lib/utils"

function Select({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Root>) {
  return <SelectPrimitive.Root data-slot="select" {...props} />
}

function SelectGroup({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Group>) {
  return <SelectPrimitive.Group data-slot="select-group" {...props} />
}

function SelectValue({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Value>) {
  return <SelectPrimitive.Value data-slot="select-value" {...props} />
}

function SelectTrigger({
  className,
  size = "default",
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger> & {
  size?: "sm" | "default"
}) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      data-size={size}
      className={cn(
        "border-input data-[placeholder]:text-muted-foreground [&_svg:not([class*='text-'])]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 dark:hover:bg-input/50 flex w-fit items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-2 text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 data-[size=default]:h-9 data-[size=sm]:h-8 *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDownIcon className="size-4 opacity-50" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
}

function SelectContent({
  className,
  children,
  position = "popper",
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Content>) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        data-slot="select-content"
        className={cn(
          "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 relative z-50 max-h-(--radix-select-content-available-height) min-w-[8rem] origin-(--radix-select-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-md border shadow-md",
          position === "popper" &&
            "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
          className
        )}
        position={position}
        {...props}
      >
        <SelectScrollUpButton />
        <SelectPrimitive.Viewport
          className={cn(
            "p-1",
            position === "popper" &&
              "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)] scroll-my-1"
          )}
        >
          {children}
        </SelectPrimitive.Viewport>
        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
}

function SelectLabel({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Label>) {
  return (
    <SelectPrimitive.Label
      data-slot="select-label"
      className={cn("text-muted-foreground px-2 py-1.5 text-xs", className)}
      {...props}
    />
  )
}

function SelectItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        "focus:bg-accent focus:text-accent-foreground [&_svg:not([class*='text-'])]:text-muted-foreground relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2",
        className
      )}
      {...props}
    >
      <span className="absolute right-2 flex size-3.5 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <CheckIcon className="size-4" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  )
}

function SelectSeparator({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Separator>) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={cn("bg-border pointer-events-none -mx-1 my-1 h-px", className)}
      {...props}
    />
  )
}

function SelectScrollUpButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollUpButton>) {
  return (
    <SelectPrimitive.ScrollUpButton
      data-slot="select-scroll-up-button"
      className={cn(
        "flex cursor-default items-center justify-center py-1",
        className
      )}
      {...props}
    >
      <ChevronUpIcon className="size-4" />
    </SelectPrimitive.ScrollUpButton>
  )
}

function SelectScrollDownButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownButton>) {
  return (
    <SelectPrimitive.ScrollDownButton
      data-slot="select-scroll-down-button"
      className={cn(
        "flex cursor-default items-center justify-center py-1",
        className
      )}
      {...props}
    >
      <ChevronDownIcon className="size-4" />
    </SelectPrimitive.ScrollDownButton>
  )
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
}
VFEOF

cat > src/components/ui/label.tsx << 'VFEOF'
"use client"

import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"

import { cn } from "@/lib/utils"

function Label({
  className,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn(
        "flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Label }
VFEOF

cat > src/components/ui/skeleton.tsx << 'VFEOF'
import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("bg-accent animate-pulse rounded-md", className)}
      {...props}
    />
  )
}

export { Skeleton }
VFEOF

# ============================================
# VIRALFACELESS COMPONENTS
# ============================================
echo "=== Writing viralfaceless components ==="

cat > src/components/viralfaceless/AppShell.tsx << 'VFEOF'
'use client';

import { useEffect, useRef, useSyncExternalStore } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Sparkles,
  Lightbulb,
  BarChart3,
  LogOut,
  Moon,
  Sun,
  Coins,
  Zap,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useAppStore } from '@/lib/store';
import { AuthForm } from './AuthForm';
import { IdeaGenerator } from './IdeaGenerator';
import { IdeasList } from './IdeasList';
import { ScriptPanel } from './ScriptPanel';
import { AnalyticsPanel } from './AnalyticsPanel';

const emptySubscribe = () => () => {};

function useHydrated() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}

export function AppShell() {
  const { user, token, logout, activeTab, setActiveTab, selectedIdea, setSelectedIdea, scripts } = useAppStore();
  const { theme, setTheme } = useTheme();
  const hydrated = useHydrated();
  const hasRestored = useRef(false);

  useEffect(() => {
    if (hasRestored.current) return;
    hasRestored.current = true;

    const storedToken = localStorage.getItem('vf_token');
    const storedUser = localStorage.getItem('vf_user');

    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        useAppStore.getState().setUser(parsedUser, storedToken);
      } catch {
        localStorage.removeItem('vf_token');
        localStorage.removeItem('vf_user');
      }
    }
  }, []);

  const activeScript = selectedIdea
    ? scripts.find((s) => s.ideaId === selectedIdea.id)
    : null;

  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="size-8 rounded-full border-2 border-emerald-500/30 border-t-emerald-500 animate-spin" />
      </div>
    );
  }

  if (!user || !token) {
    return <AuthForm />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="mx-auto max-w-4xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10">
              <Sparkles className="size-4 text-emerald-500" />
            </div>
            <h1 className="text-lg font-bold tracking-tight text-foreground">
              ViralFaceless AI
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="gap-1.5 px-2.5 py-1 text-xs">
              <Coins className="size-3 text-amber-500" />
              <span className="font-semibold">{user.credits}</span>
              <span className="text-muted-foreground hidden sm:inline">credits</span>
            </Badge>

            {user.plan !== 'free' && (
              <Badge className="bg-emerald-600 text-white text-xs">
                <Zap className="mr-1 size-3" />
                {user.plan.toUpperCase()}
              </Badge>
            )}

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="size-8"
            >
              {theme === 'dark' ? (
                <Sun className="size-4" />
              ) : (
                <Moon className="size-4" />
              )}
            </Button>

            <Avatar>
              <AvatarFallback className="text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                {(user.name || user.email).charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <Button variant="ghost" size="icon" onClick={logout} className="size-8">
              <LogOut className="size-4 text-muted-foreground" />
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-4xl px-4 py-6">
        <AnimatePresence mode="wait">
          {activeScript ? (
            <motion.div
              key="script"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <ScriptPanel
                script={activeScript}
                onBack={() => setSelectedIdea(null)}
              />
            </motion.div>
          ) : (
            <motion.div
              key="main"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Tabs
                value={activeTab}
                onValueChange={(v) => setActiveTab(v as 'generate' | 'ideas' | 'analytics')}
              >
                <TabsList className="w-full mb-6">
                  <TabsTrigger value="generate" className="flex-1 gap-1.5">
                    <Sparkles className="size-3.5" />
                    <span className="hidden sm:inline">Generate</span>
                  </TabsTrigger>
                  <TabsTrigger value="ideas" className="flex-1 gap-1.5">
                    <Lightbulb className="size-3.5" />
                    <span className="hidden sm:inline">My Ideas</span>
                  </TabsTrigger>
                  <TabsTrigger value="analytics" className="flex-1 gap-1.5">
                    <BarChart3 className="size-3.5" />
                    <span className="hidden sm:inline">Analytics</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="generate">
                  <IdeaGenerator />
                </TabsContent>

                <TabsContent value="ideas">
                  <IdeasList />
                </TabsContent>

                <TabsContent value="analytics">
                  <AnalyticsPanel />
                </TabsContent>
              </Tabs>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="border-t border-border/50 bg-background/80 backdrop-blur-md mt-auto">
        <div className="mx-auto max-w-4xl px-4 py-4 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            ViralFaceless AI — V11 Locked Schema
          </p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Powered by AI</span>
            <Separator orientation="vertical" className="h-3" />
            <span>&copy; 2025</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
VFEOF

cat > src/components/viralfaceless/AuthForm.tsx << 'VFEOF'
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Mail, Lock, User, Sparkles, ArrowRight } from 'lucide-react';
import { useAppStore } from '@/lib/store';

export function AuthForm() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const setUser = useAppStore((s) => s.setUser);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const body: Record<string, string> = { email, password };
      if (mode === 'register') body.name = name;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Something went wrong');
        return;
      }

      setUser(data.user, data.token);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="mb-8 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
            className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-emerald-500/10"
          >
            <Sparkles className="size-8 text-emerald-500" />
          </motion.div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            ViralFaceless AI
          </h1>
          <p className="mt-2 text-muted-foreground">
            AI-Powered Viral Content Generator for Faceless Channels
          </p>
        </div>

        <Card className="rounded-xl border-border/50 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">
              {mode === 'login' ? 'Welcome back' : 'Create account'}
            </CardTitle>
            <CardDescription>
              {mode === 'login'
                ? 'Sign in to continue generating viral ideas'
                : 'Start your journey to viral content'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <AnimatePresence mode="wait">
                {mode === 'register' && (
                  <motion.div
                    key="name"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-2"
                  >
                    <Label htmlFor="name">Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="name"
                        placeholder="Your name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="pl-9"
                        required={mode === 'register'}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="........"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9"
                    required
                    minLength={6}
                  />
                </div>
              </div>

              {error && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm text-rose-500"
                >
                  {error}
                </motion.p>
              )}

              <Button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                size="lg"
                disabled={loading}
              >
                {loading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                    className="size-4 rounded-full border-2 border-white/30 border-t-white"
                  />
                ) : (
                  <>
                    {mode === 'login' ? 'Sign In' : 'Create Account'}
                    <ArrowRight className="ml-1 size-4" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-4 text-center text-sm text-muted-foreground">
              {mode === 'login' ? (
                <>
                  Don&apos;t have an account?{' '}
                  <button
                    onClick={() => {
                      setMode('register');
                      setError('');
                    }}
                    className="font-medium text-emerald-600 hover:text-emerald-500 transition-colors"
                  >
                    Sign up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <button
                    onClick={() => {
                      setMode('login');
                      setError('');
                    }}
                    className="font-medium text-emerald-600 hover:text-emerald-500 transition-colors"
                  >
                    Sign in
                  </button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
VFEOF

cat > src/components/viralfaceless/IdeaGenerator.tsx << 'VFEOF'
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, Zap, AlertCircle } from 'lucide-react';
import { useAppStore, type IdeaItem } from '@/lib/store';

const NICHE_SUGGESTIONS = [
  'motivation',
  'finance',
  'tech',
  'health',
  'psychology',
  'crypto',
];

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'id', label: 'Indonesian' },
  { value: 'es', label: 'Spanish' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'ja', label: 'Japanese' },
  { value: 'ko', label: 'Korean' },
];

export function IdeaGenerator() {
  const { niche, setNiche, language, setLanguage, token, addIdeas, user, setIsLoading } = useAppStore();
  const [error, setError] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatedIdeas, setGeneratedIdeas] = useState<IdeaItem[]>([]);

  const handleGenerate = async () => {
    if (!niche.trim()) {
      setError('Please enter a niche');
      return;
    }
    if ((user?.credits ?? 0) < 3) {
      setError('Not enough credits. You need at least 3 credits.');
      return;
    }

    setError('');
    setGenerating(true);
    setIsLoading(true);

    try {
      const res = await fetch('/api/ideas/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ niche: niche.trim(), language }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          useAppStore.getState().logout();
          return;
        }
        setError(data.error || 'Failed to generate ideas');
        return;
      }

      const ideas: IdeaItem[] = data.ideas || [];
      addIdeas(ideas);
      setGeneratedIdeas(ideas);

      if (data.creditsRemaining !== undefined) {
        const currentUser = useAppStore.getState().user;
        if (currentUser) {
          useAppStore.getState().setUser({ ...currentUser, credits: data.creditsRemaining }, useAppStore.getState().token!);
        }
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setGenerating(false);
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="rounded-xl border-border/50 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="size-5 text-emerald-500" />
            Generate Viral Ideas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Niche / Topic
            </label>
            <Input
              placeholder="e.g., motivation, finance, tech..."
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              className="rounded-lg"
            />
            <div className="flex flex-wrap gap-2">
              {NICHE_SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => setNiche(s)}
                  className="rounded-full px-3 py-1 text-xs font-medium transition-colors bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 dark:text-emerald-400"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Language
            </label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((lang) => (
                  <SelectItem key={lang.value} value={lang.value}>
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 text-sm text-rose-500"
            >
              <AlertCircle className="size-4" />
              {error}
            </motion.div>
          )}

          <Button
            onClick={handleGenerate}
            disabled={generating}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
            size="lg"
          >
            {generating ? (
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                  className="size-4 rounded-full border-2 border-white/30 border-t-white"
                />
                Generating...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Zap className="size-4" />
                Generate Ideas (3 credits)
              </div>
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            Your balance: {user?.credits ?? 0} credits
          </p>
        </CardContent>
      </Card>

      {generatedIdeas.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">
            Generated Ideas
          </h3>
          <div className="space-y-3">
            {generatedIdeas.map((idea, index) => (
              <motion.div
                key={idea.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="rounded-xl border-border/50">
                  <CardContent className="p-4 space-y-3">
                    <h4 className="text-base font-semibold text-foreground">
                      {idea.title}
                    </h4>
                    <p className="text-sm italic text-emerald-600 dark:text-emerald-400">
                      &ldquo;{idea.hook}&rdquo;
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {idea.emotionalTrigger.map((trigger) => (
                        <Badge
                          key={trigger}
                          variant="secondary"
                          className="text-xs"
                        >
                          {trigger}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-4 text-sm">
                      <span className="text-muted-foreground">
                        Virality: <span className="font-semibold text-foreground">{idea.viralityScore}</span>
                      </span>
                      <span className="text-muted-foreground">
                        Curiosity: <span className="font-semibold text-foreground">{idea.curiosityScore}</span>
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{idea.reason}</p>
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
VFEOF

cat > src/components/viralfaceless/IdeasList.tsx << 'VFEOF'
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

      <div className="space-y-3 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
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
VFEOF

cat > src/components/viralfaceless/IdeaCard.tsx << 'VFEOF'
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, FileText } from 'lucide-react';
import { useAppStore, type IdeaItem } from '@/lib/store';

const TRIGGER_COLORS: Record<string, string> = {
  fear: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
  urgency: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  curiosity: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
  surprise: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
  anger: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
  joy: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  sadness: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
  nostalgia: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
  inspiration: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  greed: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  hope: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  fomo: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  envy: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
  pride: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
};

function getTriggerColor(trigger: string): string {
  const lower = trigger.toLowerCase();
  for (const [key, color] of Object.entries(TRIGGER_COLORS)) {
    if (lower.includes(key)) return color;
  }
  return 'bg-secondary text-secondary-foreground';
}

function getScoreColor(score: number): string {
  if (score >= 70) return 'bg-emerald-500';
  if (score >= 40) return 'bg-amber-500';
  return 'bg-rose-500';
}

function getScoreTextColor(score: number): string {
  if (score >= 70) return 'text-emerald-600 dark:text-emerald-400';
  if (score >= 40) return 'text-amber-600 dark:text-amber-400';
  return 'text-rose-600 dark:text-rose-400';
}

interface IdeaCardProps {
  idea: IdeaItem;
  onGenerateScript?: (idea: IdeaItem) => void;
}

export function IdeaCard({ idea, onGenerateScript }: IdeaCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [generating, setGenerating] = useState(false);
  const { token, user, addScript, setSelectedIdea } = useAppStore();

  const handleGenerateScript = async () => {
    if ((user?.credits ?? 0) < 5) {
      return;
    }
    setGenerating(true);
    try {
      const res = await fetch('/api/scripts/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ideaId: idea.id, language: idea.language }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          useAppStore.getState().logout();
          return;
        }
        return;
      }

      if (data.script) {
        addScript(data.script);
        setSelectedIdea(idea);

        if (data.creditsRemaining !== undefined) {
          const currentUser = useAppStore.getState().user;
          if (currentUser) {
            useAppStore.getState().setUser({ ...currentUser, credits: data.creditsRemaining }, useAppStore.getState().token!);
          }
        }
      }
    } catch {
      // silent
    } finally {
      setGenerating(false);
    }
  };

  const handleExternalGenerate = () => {
    if (onGenerateScript) {
      onGenerateScript(idea);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="rounded-xl border-border/50 shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-base font-bold text-foreground leading-tight">
              {idea.title}
            </h4>
            <button
              onClick={() => setExpanded(!expanded)}
              className="shrink-0 rounded-md p-1 hover:bg-muted transition-colors"
            >
              {expanded ? (
                <ChevronUp className="size-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="size-4 text-muted-foreground" />
              )}
            </button>
          </div>

          <p className="text-sm italic text-emerald-600 dark:text-emerald-400 leading-relaxed">
            &ldquo;{idea.hook}&rdquo;
          </p>

          <div className="flex flex-wrap gap-1.5">
            {idea.emotionalTrigger.map((trigger) => (
              <span
                key={trigger}
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getTriggerColor(trigger)}`}
              >
                {trigger}
              </span>
            ))}
          </div>

          <div className="space-y-2">
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Virality Score</span>
                <span className={`font-semibold ${getScoreTextColor(idea.viralityScore)}`}>
                  {idea.viralityScore}/100
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${idea.viralityScore}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className={`h-full rounded-full ${getScoreColor(idea.viralityScore)}`}
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Curiosity Score</span>
                <span className={`font-semibold ${getScoreTextColor(idea.curiosityScore)}`}>
                  {idea.curiosityScore}/100
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${idea.curiosityScore}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
                  className={`h-full rounded-full ${getScoreColor(idea.curiosityScore)}`}
                />
              </div>
            </div>
          </div>

          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-2 overflow-hidden"
              >
                <div className="pt-2 border-t border-border/50">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Reason</p>
                  <p className="text-sm text-foreground/80">{idea.reason}</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline" className="text-xs">
                    {idea.niche}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {idea.language.toUpperCase()}
                  </Badge>
                  <span className="text-xs">
                    {new Date(idea.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <Button
            onClick={onGenerateScript ? handleExternalGenerate : handleGenerateScript}
            disabled={generating}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white mt-2"
            size="default"
          >
            {generating ? (
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                  className="size-3.5 rounded-full border-2 border-white/30 border-t-white"
                />
                Generating...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <FileText className="size-4" />
                Generate Script (5 credits)
              </div>
            )}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
VFEOF

cat > src/components/viralfaceless/ScriptPanel.tsx << 'VFEOF'
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
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <MessageSquare className="size-3" />
                    Voiceover
                  </div>
                  <p className="text-sm text-foreground bg-muted/50 rounded-lg p-3 leading-relaxed">
                    {scene.voiceover}
                  </p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <Eye className="size-3" />
                    Visual Description
                  </div>
                  <p className="text-sm text-foreground/80">
                    {scene.visualDescription}
                  </p>
                </div>

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
VFEOF

cat > src/components/viralfaceless/AnalyticsPanel.tsx << 'VFEOF'
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

      {analytics.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-foreground">Recent Submissions</h4>
          <div className="space-y-2 max-h-96 overflow-y-auto">
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
VFEOF

# ============================================
# APP FILES
# ============================================
echo "=== Writing app files ==="

cat > src/app/page.tsx << 'VFEOF'
import { AppShell } from '@/components/viralfaceless/AppShell';

export default function Home() {
  return <AppShell />;
}
VFEOF

cat > src/app/layout.tsx << 'VFEOF'
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import './globals.css';

const inter = Inter({
  variable: '--font-sans',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'ViralFaceless AI',
  description: 'AI-Powered Viral Content Generator for Faceless Channels',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
VFEOF

cat > src/app/globals.css << 'VFEOF'
@import "tailwindcss";
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
  --color-sidebar-ring: var(--sidebar-ring);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar: var(--sidebar);
  --color-chart-5: var(--chart-5);
  --color-chart-4: var(--chart-4);
  --color-chart-3: var(--chart-3);
  --color-chart-2: var(--chart-2);
  --color-chart-1: var(--chart-1);
  --color-ring: var(--ring);
  --color-input: var(--input);
  --color-border: var(--border);
  --color-destructive: var(--destructive);
  --color-accent-foreground: var(--accent-foreground);
  --color-accent: var(--accent);
  --color-muted-foreground: var(--muted-foreground);
  --color-muted: var(--muted);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-secondary: var(--secondary);
  --color-primary-foreground: var(--primary-foreground);
  --color-primary: var(--primary);
  --color-popover-foreground: var(--popover-foreground);
  --color-popover: var(--popover);
  --color-card-foreground: var(--card-foreground);
  --color-card: var(--card);
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
}

:root {
  --radius: 0.625rem;
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.145 0 0);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.145 0 0);
  --primary: oklch(0.205 0 0);
  --primary-foreground: oklch(0.985 0 0);
  --secondary: oklch(0.97 0 0);
  --secondary-foreground: oklch(0.205 0 0);
  --muted: oklch(0.97 0 0);
  --muted-foreground: oklch(0.556 0 0);
  --accent: oklch(0.97 0 0);
  --accent-foreground: oklch(0.205 0 0);
  --destructive: oklch(0.577 0.245 27.325);
  --border: oklch(0.922 0 0);
  --input: oklch(0.922 0 0);
  --ring: oklch(0.708 0 0);
  --chart-1: oklch(0.646 0.222 41.116);
  --chart-2: oklch(0.6 0.118 184.704);
  --chart-3: oklch(0.398 0.07 227.392);
  --chart-4: oklch(0.828 0.189 84.429);
  --chart-5: oklch(0.769 0.188 70.08);
  --sidebar: oklch(0.985 0 0);
  --sidebar-foreground: oklch(0.145 0 0);
  --sidebar-primary: oklch(0.205 0 0);
  --sidebar-primary-foreground: oklch(0.985 0 0);
  --sidebar-accent: oklch(0.97 0 0);
  --sidebar-accent-foreground: oklch(0.205 0 0);
  --sidebar-border: oklch(0.922 0 0);
  --sidebar-ring: oklch(0.708 0 0);
}

.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  --card: oklch(0.205 0 0);
  --card-foreground: oklch(0.985 0 0);
  --popover: oklch(0.205 0 0);
  --popover-foreground: oklch(0.985 0 0);
  --primary: oklch(0.922 0 0);
  --primary-foreground: oklch(0.205 0 0);
  --secondary: oklch(0.269 0 0);
  --secondary-foreground: oklch(0.985 0 0);
  --muted: oklch(0.269 0 0);
  --muted-foreground: oklch(0.708 0 0);
  --accent: oklch(0.269 0 0);
  --accent-foreground: oklch(0.985 0 0);
  --destructive: oklch(0.704 0.191 22.216);
  --border: oklch(1 0 0 / 10%);
  --input: oklch(1 0 0 / 15%);
  --ring: oklch(0.556 0 0);
  --chart-1: oklch(0.488 0.243 264.376);
  --chart-2: oklch(0.696 0.17 162.48);
  --chart-3: oklch(0.769 0.188 70.08);
  --chart-4: oklch(0.627 0.265 303.9);
  --chart-5: oklch(0.645 0.246 16.439);
  --sidebar: oklch(0.205 0 0);
  --sidebar-foreground: oklch(0.985 0 0);
  --sidebar-primary: oklch(0.488 0.243 264.376);
  --sidebar-primary-foreground: oklch(0.985 0 0);
  --sidebar-accent: oklch(0.269 0 0);
  --sidebar-accent-foreground: oklch(0.985 0 0);
  --sidebar-border: oklch(1 0 0 / 10%);
  --sidebar-ring: oklch(0.556 0 0);
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
  }
}
VFEOF

# ============================================
# API ROUTES
# ============================================
echo "=== Writing API routes ==="

cat > src/app/api/ideas/generate/prompt.ts << 'VFEOF'
export interface IdeaOutput {
  title: string;
  hook: string;
  emotionalTrigger: string[];
  viralityScore: number;
  curiosityScore: number;
  reason: string;
}

export interface ScriptOutput {
  scenes: {
    number: number;
    duration: number;
    voiceover: string;
    visualDescription: string;
    onScreenText: string;
  }[];
  totalDuration: number;
  voiceoverFull: string;
  visualNotes: string;
}

export function buildIdeaPrompt(niche: string, language: string): string {
  return `You are a viral content strategist for faceless YouTube/TikTok channels.

You apply these 7 psychology rules:
1. Curiosity Gap Rule: Create information gaps viewers MUST close
2. Open Loop Rule: Start patterns brains auto-complete
3. Negativity Bias: Lead with potential loss or danger
4. Social Proof Trigger: Reference groups, trends, or consensus
5. Pattern Interrupt: Break expectations to force attention
6. Identity Resonance: Target self-concept and group belonging
7. Completion Drive: Start sequences viewers need to finish

NICHE: ${niche}
LANGUAGE: ${language}

Generate exactly 5 viral video ideas for the "${niche}" niche. Write all content in ${language}.

CRITICAL: Your output MUST be a valid JSON array with EXACTLY 5 objects. Each object MUST have ONLY these fields:
- "title" (string): scroll-stopping video title
- "hook" (string): first 3 seconds opener that grabs attention
- "emotionalTrigger" (string[]): which of the 7 psychology triggers are used
- "viralityScore" (number 0-100): predicted virality score
- "curiosityScore" (number 0-100): curiosity gap strength score
- "reason" (string): why this idea will go viral

DO NOT add any extra fields. ONLY the 6 fields listed above.

Output ONLY the JSON array, nothing else. No markdown, no explanation, no code blocks. Just raw JSON.`;
}

export function buildScriptPrompt(
  idea: { title: string; hook: string; niche: string },
  language: string
): string {
  return `You are a professional scriptwriter for faceless YouTube/TikTok channels.

You write scripts that use stock footage, animations, and voiceover — no on-camera personality needed.

VIDEO TITLE: ${idea.title}
VIDEO HOOK: ${idea.hook}
NICHE: ${idea.niche}
LANGUAGE: ${language}

Write a complete faceless video script in ${language} for this idea.

CRITICAL: Your output MUST be valid JSON with EXACTLY this structure:
{
  "scenes": [
    {
      "number": 1,
      "duration": 5,
      "voiceover": "The narration text for this scene",
      "visualDescription": "What stock footage, animation, or visual to show",
      "onScreenText": "Text overlay shown on screen (short, punchy)"
    }
  ],
  "totalDuration": 60,
  "voiceoverFull": "The complete voiceover script as a single paragraph",
  "visualNotes": "General visual direction notes for the editor"
}

Rules:
- Create 8-15 scenes
- Each scene duration is in seconds (3-10 seconds per scene)
- Total duration should be 30-120 seconds
- Voiceover should be conversational and engaging
- Visual descriptions should reference specific stock footage types or animation styles
- On-screen text should be short and impactful (1-8 words)
- voiceoverFull should be the complete narration combined
- visualNotes should give the editor overall style direction

Output ONLY the JSON object, nothing else. No markdown, no explanation, no code blocks. Just raw JSON.`;
}
VFEOF

cat > src/app/api/ideas/generate/route.ts << 'VFEOF'
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { buildIdeaPrompt } from './prompt';

async function callGroqApi(prompt: string): Promise<string> {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.AI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8,
      max_tokens: 4096,
      response_format: { type: 'json_object' },
    }),
  });
  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

function extractJson(text: string): any[] {
  try {
    const p = JSON.parse(text);
    return Array.isArray(p) ? p : p.ideas || [p];
  } catch {}

  const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (match) {
    try {
      const p = JSON.parse(match[1]);
      return Array.isArray(p) ? p : p.ideas || [p];
    } catch {}
  }

  const arrMatch = text.match(/\[[\s\S]*\]/);
  if (arrMatch) {
    try {
      return JSON.parse(arrMatch[0]);
    } catch {}
  }

  return [];
}

export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { niche, language = 'en' } = body;

    if (!niche) {
      return NextResponse.json({ error: 'Niche is required' }, { status: 400 });
    }

    const dbUser = await db.user.findUnique({ where: { id: user.userId } });
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (dbUser.credits < 3) {
      return NextResponse.json({ error: 'Insufficient credits. 3 credits required.' }, { status: 403 });
    }

    await db.user.update({
      where: { id: user.userId },
      data: { credits: dbUser.credits - 3 },
    });

    const prompt = buildIdeaPrompt(niche, language);

    let rawText: string;
    if (process.env.AI_API_KEY) {
      const wrappedPrompt = `Respond with a JSON object that has an "ideas" array.\n\n${prompt}`;
      rawText = await callGroqApi(wrappedPrompt);
    } else {
      return NextResponse.json({ error: 'AI_API_KEY not configured' }, { status: 500 });
    }

    const ideas = extractJson(rawText);

    if (!ideas || ideas.length === 0) {
      await db.user.update({
        where: { id: user.userId },
        data: { credits: dbUser.credits },
      });
      return NextResponse.json({ error: 'Failed to generate ideas. Please try again.' }, { status: 500 });
    }

    const mapped = ideas.map((raw: any) => ({
      niche,
      title: String(raw.title || ''),
      hook: String(raw.hook || ''),
      emotionalTrigger: Array.isArray(raw.emotionalTrigger) ? raw.emotionalTrigger : [],
      viralityScore: Math.min(100, Math.max(0, Number(raw.viralityScore) || 0)),
      curiosityScore: Math.min(100, Math.max(0, Number(raw.curiosityScore) || 0)),
      reason: String(raw.reason || ''),
      language,
      userId: user.userId,
    }));

    await db.viralIdea.createMany({ data: mapped });

    const updatedUser = await db.user.findUnique({ where: { id: user.userId } });

    return NextResponse.json({
      ideas: mapped,
      creditsRemaining: updatedUser?.credits ?? 0,
    }, { status: 200 });
  } catch (error) {
    console.error('Idea generation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
VFEOF

cat > src/app/api/ideas/route.ts << 'VFEOF'
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const skip = Math.max(0, Number(searchParams.get('skip')) || 0);
    const take = Math.min(50, Math.max(1, Number(searchParams.get('take')) || 20));

    const ideas = await db.viralIdea.findMany({
      where: { userId: user.userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      include: {
        _count: {
          select: { analytics: true },
        },
      },
    });

    const total = await db.viralIdea.count({
      where: { userId: user.userId },
    });

    return NextResponse.json({
      ideas,
      pagination: {
        total,
        skip,
        take,
        hasMore: skip + take < total,
      },
    }, { status: 200 });
  } catch (error) {
    console.error('Fetch ideas error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
VFEOF

cat > src/app/api/scripts/generate/route.ts << 'VFEOF'
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { buildScriptPrompt } from '@/app/api/ideas/generate/prompt';

async function callGroqApi(prompt: string): Promise<string> {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.AI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8,
      max_tokens: 4096,
      response_format: { type: 'json_object' },
    }),
  });
  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

function extractScriptJson(text: string): any | null {
  try {
    return JSON.parse(text);
  } catch {}

  const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (match) {
    try {
      return JSON.parse(match[1]);
    } catch {}
  }

  const objMatch = text.match(/\{[\s\S]*\}/);
  if (objMatch) {
    try {
      return JSON.parse(objMatch[0]);
    } catch {}
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { ideaId, language = 'en' } = body;

    if (!ideaId) {
      return NextResponse.json({ error: 'Idea ID is required' }, { status: 400 });
    }

    const idea = await db.viralIdea.findUnique({ where: { id: ideaId } });
    if (!idea) {
      return NextResponse.json({ error: 'Idea not found' }, { status: 404 });
    }

    if (idea.userId !== user.userId) {
      return NextResponse.json({ error: 'You do not own this idea' }, { status: 403 });
    }

    const dbUser = await db.user.findUnique({ where: { id: user.userId } });
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (dbUser.credits < 5) {
      return NextResponse.json({ error: 'Insufficient credits. 5 credits required for script generation.' }, { status: 403 });
    }

    await db.user.update({
      where: { id: user.userId },
      data: { credits: dbUser.credits - 5 },
    });

    const prompt = buildScriptPrompt(
      { title: idea.title, hook: idea.hook, niche: idea.niche },
      language
    );

    let rawText: string;
    if (process.env.AI_API_KEY) {
      rawText = await callGroqApi(prompt);
    } else {
      return NextResponse.json({ error: 'AI_API_KEY not configured' }, { status: 500 });
    }

    const scriptData = extractScriptJson(rawText);

    if (!scriptData || !scriptData.scenes) {
      await db.user.update({
        where: { id: user.userId },
        data: { credits: dbUser.credits },
      });
      return NextResponse.json({ error: 'Failed to generate script. Please try again.' }, { status: 500 });
    }

    const script = await db.script.create({
      data: {
        ideaId: idea.id,
        userId: user.userId,
        content: scriptData,
        language,
      },
    });

    const updatedUser = await db.user.findUnique({ where: { id: user.userId } });

    return NextResponse.json({
      script,
      creditsRemaining: updatedUser?.credits ?? 0,
    }, { status: 201 });
  } catch (error) {
    console.error('Script generation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
VFEOF

cat > src/app/api/analytics/route.ts << 'VFEOF'
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      ideaId,
      platform,
      ctr = 0,
      retention = 0,
      watchTime = 0,
      likes = 0,
      shares = 0,
      comments = 0,
      views = 0,
    } = body;

    if (!ideaId || !platform) {
      return NextResponse.json({ error: 'ideaId and platform are required' }, { status: 400 });
    }

    const validPlatforms = ['tiktok', 'youtube', 'instagram', 'twitter'];
    if (!validPlatforms.includes(platform)) {
      return NextResponse.json({ error: `Invalid platform. Must be one of: ${validPlatforms.join(', ')}` }, { status: 400 });
    }

    const idea = await db.viralIdea.findUnique({ where: { id: ideaId } });
    if (!idea) {
      return NextResponse.json({ error: 'Idea not found' }, { status: 404 });
    }

    if (idea.userId !== user.userId) {
      return NextResponse.json({ error: 'You do not own this idea' }, { status: 403 });
    }

    const analytics = await db.viralAnalytics.create({
      data: {
        ideaId,
        userId: user.userId,
        platform,
        ctr: Number(ctr) || 0,
        retention: Number(retention) || 0,
        watchTime: Number(watchTime) || 0,
        likes: Number(likes) || 0,
        shares: Number(shares) || 0,
        comments: Number(comments) || 0,
        views: Number(views) || 0,
      },
    });

    return NextResponse.json({ analytics }, { status: 201 });
  } catch (error) {
    console.error('Create analytics error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const platform = searchParams.get('platform') || undefined;
    const ideaId = searchParams.get('ideaId') || undefined;
    const skip = Math.max(0, Number(searchParams.get('skip')) || 0);
    const take = Math.min(50, Math.max(1, Number(searchParams.get('take')) || 20));

    const where: Record<string, any> = {
      userId: user.userId,
    };

    if (platform) {
      where.platform = platform;
    }

    if (ideaId) {
      where.ideaId = ideaId;
    }

    const analytics = await db.viralAnalytics.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      include: {
        idea: {
          select: {
            id: true,
            title: true,
            niche: true,
          },
        },
      },
    });

    const total = await db.viralAnalytics.count({ where });

    return NextResponse.json({
      analytics,
      pagination: {
        total,
        skip,
        take,
        hasMore: skip + take < total,
      },
    }, { status: 200 });
  } catch (error) {
    console.error('Fetch analytics error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
VFEOF

cat > src/app/api/auth/login/route.ts << 'VFEOF'
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { comparePassword, signToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const user = await db.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const isValid = await comparePassword(password, user.password);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const token = signToken({ userId: user.id, email: user.email });

    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json({ token, user: userWithoutPassword }, { status: 200 });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
VFEOF

cat > src/app/api/auth/register/route.ts << 'VFEOF'
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword, signToken } from '@/lib/auth';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name } = body;

    if (!email || !password || !name) {
      return NextResponse.json({ error: 'Email, password, and name are required' }, { status: 400 });
    }

    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const existingUser = await db.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    const hashedPassword = await hashPassword(password);
    const user = await db.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        credits: 10,
        plan: 'free',
      },
    });

    const token = signToken({ userId: user.id, email: user.email });

    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json({ token, user: userWithoutPassword }, { status: 201 });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
VFEOF

# ============================================
# DOCKERFILE — Updated (no standalone, use next start)
# ============================================
echo "=== Writing Dockerfile ==="
cat > Dockerfile << 'VFEOF'
FROM oven/bun:1
WORKDIR /app
COPY package.json bun.lock* ./
RUN bun install
COPY prisma ./prisma
RUN bunx prisma generate
COPY . .
RUN bun run build
RUN mkdir -p /app/data
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV DATABASE_URL="file:/app/data/prod.db"
CMD ["sh", "-c", "bunx prisma db push && bun run start"]
VFEOF

# ============================================
# .DOCKERIGNORE
# ============================================
echo "=== Writing .dockerignore ==="
cat > .dockerignore << 'VFEOF'
node_modules
.next
.git
data
*.db
VFEOF

# ============================================
# VERIFY & BUILD
# ============================================
echo ""
echo "=== All files written successfully ==="
echo ""
echo "Files created:"
find src -name "*.tsx" -o -name "*.ts" -o -name "*.css" | sort
echo ""
echo "Config files:"
ls -la next.config.ts package.json prisma/schema.prisma Dockerfile .dockerignore 2>/dev/null
echo ""
echo "=== Now rebuilding Docker ==="
echo ""

# Stop existing container
docker compose down 2>/dev/null || true

# Remove old bun.lock if exists (will be regenerated)
rm -f bun.lock

# Build and start
docker compose up -d --build

echo ""
echo "=== Done ==="
echo "Check status with: docker compose logs -f"
echo "Test with: curl http://localhost:3000"
