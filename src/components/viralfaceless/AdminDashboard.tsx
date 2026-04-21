'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  DollarSign,
  FileText,
  Folder,
  Search,
  Plus,
  Trash2,
  Loader2,
  Shield,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  UserPlus,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useStore } from '@/lib/store';
import { api } from '@/lib/api';
import type { AdminStats } from '@/lib/types';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  plan: string;
  credits: number;
  joinedAt: string;
}

const MOCK_STATS: AdminStats = {
  totalUsers: 1247,
  totalRevenue: 18500000,
  totalContent: 5632,
  activeProjects: 342,
};

const MOCK_USERS: AdminUser[] = [
  { id: 'u1', name: 'Alex Johnson', email: 'alex@email.com', plan: 'premium', credits: 180, joinedAt: '2025-01-10' },
  { id: 'u2', name: 'Sarah Kim', email: 'sarah@email.com', plan: 'pro', credits: 23, joinedAt: '2025-01-08' },
  { id: 'u3', name: 'Mike Chen', email: 'mike@email.com', plan: 'free', credits: 5, joinedAt: '2025-01-15' },
  { id: 'u4', name: 'Emily Davis', email: 'emily@email.com', plan: 'pro', credits: 45, joinedAt: '2025-01-05' },
  { id: 'u5', name: 'James Wilson', email: 'james@email.com', plan: 'free', credits: 0, joinedAt: '2025-01-18' },
  { id: 'u6', name: 'Lisa Wang', email: 'lisa@email.com', plan: 'premium', credits: 150, joinedAt: '2025-01-02' },
  { id: 'u7', name: 'David Brown', email: 'david@email.com', plan: 'pro', credits: 12, joinedAt: '2025-01-12' },
  { id: 'u8', name: 'Anna Lee', email: 'anna@email.com', plan: 'free', credits: 3, joinedAt: '2025-01-17' },
  { id: 'u9', name: 'Tom Garcia', email: 'tom@email.com', plan: 'premium', credits: 88, joinedAt: '2025-01-01' },
  { id: 'u10', name: 'Rina Sato', email: 'rina@email.com', plan: 'pro', credits: 50, joinedAt: '2025-01-09' },
  { id: 'u11', name: 'Chris Taylor', email: 'chris@email.com', plan: 'free', credits: 7, joinedAt: '2025-01-16' },
  { id: 'u12', name: 'Mia Patel', email: 'mia@email.com', plan: 'pro', credits: 30, joinedAt: '2025-01-07' },
];

const REVENUE_DATA = [
  { day: 'Mon', value: 2400000 },
  { day: 'Tue', value: 1800000 },
  { day: 'Wed', value: 3200000 },
  { day: 'Thu', value: 2900000 },
  { day: 'Fri', value: 4100000 },
  { day: 'Sat', value: 3500000 },
  { day: 'Sun', value: 2600000 },
];

const SIGNUP_DATA = [
  { day: 'Mon', value: 45 },
  { day: 'Tue', value: 32 },
  { day: 'Wed', value: 58 },
  { day: 'Thu', value: 41 },
  { day: 'Fri', value: 67 },
  { day: 'Sat', value: 52 },
  { day: 'Sun', value: 38 },
];

const PLAN_COLORS: Record<string, string> = {
  free: 'bg-gray-500/15 text-gray-400 border-gray-500/20',
  pro: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  premium: 'bg-purple-500/15 text-purple-400 border-purple-500/20',
};

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatCompact(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toString();
}

export default function AdminDashboard() {
  const { user, adminStats, setAdminStats } = useStore();
  const [stats, setStats] = useState<AdminStats>(adminStats || MOCK_STATS);
  const [users, setUsers] = useState<AdminUser[]>(MOCK_USERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [addCreditsDialogOpen, setAddCreditsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [creditsToAdd, setCreditsToAdd] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await api.admin.stats();
        setStats(data);
        setAdminStats(data);
      } catch {
        // Use mock data as fallback
      }
    };
    fetchStats();
  }, [setAdminStats]);

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleAddCredits = async () => {
    if (!selectedUser) return;
    const credits = parseInt(creditsToAdd);
    if (!credits || credits < 1) {
      toast.error('Please enter a valid number of credits');
      return;
    }

    setIsUpdating(true);
    try {
      await api.admin.updateUser(selectedUser.id, { creditsToAdd: credits });
      setUsers((prev) =>
        prev.map((u) =>
          u.id === selectedUser.id
            ? { ...u, credits: u.credits + credits }
            : u
        )
      );
      toast.success(`Added ${credits} credits to ${selectedUser.name}`);
      setAddCreditsDialogOpen(false);
      setCreditsToAdd('');
      setSelectedUser(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to add credits';
      toast.error(message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleChangePlan = async (userId: string, newPlan: string) => {
    setIsUpdating(true);
    try {
      await api.admin.updateUser(userId, { plan: newPlan });
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, plan: newPlan } : u))
      );
      toast.success(`Plan updated to ${newPlan}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update plan';
      toast.error(message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    setIsUpdating(true);
    try {
      setUsers((prev) => prev.filter((u) => u.id !== selectedUser.id));
      toast.success(`User ${selectedUser.name} deleted`);
      setDeleteDialogOpen(false);
      setSelectedUser(null);
    } catch {
      toast.error('Failed to delete user');
    } finally {
      setIsUpdating(false);
    }
  };

  const maxRevenue = Math.max(...REVENUE_DATA.map((d) => d.value));
  const maxSignups = Math.max(...SIGNUP_DATA.map((d) => d.value));

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <div className="rounded-lg bg-gradient-to-br from-red-600 to-orange-600 p-2.5">
          <Shield className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Platform overview and user management
          </p>
        </div>
      </motion.div>

      {/* Overview Stats */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              icon: <Users className="h-5 w-5" />,
              label: 'Total Users',
              value: stats.totalUsers.toLocaleString(),
              color: 'from-blue-600 to-cyan-600',
              shadowColor: 'shadow-blue-500/25',
            },
            {
              icon: <DollarSign className="h-5 w-5" />,
              label: 'Total Revenue',
              value: formatCompact(stats.totalRevenue),
              subtext: formatRupiah(stats.totalRevenue),
              color: 'from-green-600 to-emerald-600',
              shadowColor: 'shadow-green-500/25',
            },
            {
              icon: <FileText className="h-5 w-5" />,
              label: 'Content Generated',
              value: stats.totalContent.toLocaleString(),
              color: 'from-purple-600 to-pink-600',
              shadowColor: 'shadow-purple-500/25',
            },
            {
              icon: <Folder className="h-5 w-5" />,
              label: 'Active Projects',
              value: stats.activeProjects.toLocaleString(),
              color: 'from-orange-600 to-yellow-600',
              shadowColor: 'shadow-orange-500/25',
            },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 + index * 0.05 }}
            >
              <Card className="bg-card border-border">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className={`rounded-lg bg-gradient-to-br ${stat.color} p-2.5 shadow-lg ${stat.shadowColor}`}
                    >
                      <span className="text-white">{stat.icon}</span>
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  {stat.subtext && (
                    <p className="text-xs text-muted-foreground mt-0.5">{stat.subtext}</p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Quick Stats Charts */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Revenue Chart */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-400" />
                Revenue (Last 7 Days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-2 h-32">
                {REVENUE_DATA.map((item, i) => (
                  <div key={item.day} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs text-muted-foreground">
                      {formatCompact(item.value)}
                    </span>
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${(item.value / maxRevenue) * 100}%` }}
                      transition={{ duration: 0.6, delay: i * 0.08 }}
                      className="w-full rounded-t-md bg-gradient-to-t from-green-600 to-emerald-400 min-h-[4px]"
                    />
                    <span className="text-xs text-muted-foreground">{item.day}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* User Signups Chart */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-blue-400" />
                User Signups (Last 7 Days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-2 h-32">
                {SIGNUP_DATA.map((item, i) => (
                  <div key={item.day} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs text-muted-foreground">{item.value}</span>
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${(item.value / maxSignups) * 100}%` }}
                      transition={{ duration: 0.6, delay: i * 0.08 }}
                      className="w-full rounded-t-md bg-gradient-to-t from-blue-600 to-cyan-400 min-h-[4px]"
                    />
                    <span className="text-xs text-muted-foreground">{item.day}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* User Management */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="bg-card border-border">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                <Users className="h-4 w-4 text-purple-400" />
                User Management
                <span className="text-sm font-normal text-muted-foreground">
                  ({filteredUsers.length} users)
                </span>
              </CardTitle>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Search users..."
                  className="pl-9 bg-background border-border text-foreground"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-muted-foreground">Name</TableHead>
                    <TableHead className="text-muted-foreground">Email</TableHead>
                    <TableHead className="text-muted-foreground">Plan</TableHead>
                    <TableHead className="text-muted-foreground">Credits</TableHead>
                    <TableHead className="text-muted-foreground">Joined</TableHead>
                    <TableHead className="text-muted-foreground text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedUsers.map((u, index) => (
                    <motion.tr
                      key={u.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="border-border hover:bg-muted/30 transition-colors"
                    >
                      <TableCell className="text-sm font-medium text-foreground">
                        {u.name}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {u.email}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-xs capitalize ${PLAN_COLORS[u.plan] || PLAN_COLORS.free}`}
                        >
                          {u.plan}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-foreground font-medium">
                        {u.credits}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(u.joinedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedUser(u);
                              setCreditsToAdd('');
                              setAddCreditsDialogOpen(true);
                            }}
                            className="h-7 px-2 text-green-400 hover:text-green-300 hover:bg-green-500/10"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Credits
                          </Button>
                          <Select
                            value={u.plan}
                            onValueChange={(val) => handleChangePlan(u.id, val)}
                          >
                            <SelectTrigger className="h-7 w-24 text-xs bg-transparent border-border">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="free">Free</SelectItem>
                              <SelectItem value="pro">Pro</SelectItem>
                              <SelectItem value="premium">Premium</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedUser(u);
                              setDeleteDialogOpen(true);
                            }}
                            className="h-7 px-2 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </motion.tr>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </p>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => p - 1)}
                    className="h-8 px-2 border-border"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => p + 1)}
                    className="h-8 px-2 border-border"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Add Credits Dialog */}
      <Dialog open={addCreditsDialogOpen} onOpenChange={setAddCreditsDialogOpen}>
        <DialogContent className="bg-card border-border max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <Plus className="h-5 w-5 text-green-400" />
              Add Credits
            </DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-sm text-muted-foreground">User</p>
                <p className="text-foreground font-medium">{selectedUser.name}</p>
                <p className="text-xs text-muted-foreground">{selectedUser.email}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground">
                  Current Credits
                </Label>
                <p className="text-2xl font-bold text-foreground">
                  {selectedUser.credits}
                </p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground">
                  Credits to Add
                </Label>
                <Input
                  type="number"
                  value={creditsToAdd}
                  onChange={(e) => setCreditsToAdd(e.target.value)}
                  placeholder="Enter number of credits"
                  min={1}
                  className="bg-background border-border text-foreground"
                />
              </div>
              <DialogFooter className="gap-2">
                <Button
                  variant="outline"
                  onClick={() => setAddCreditsDialogOpen(false)}
                  className="border-border text-muted-foreground"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddCredits}
                  disabled={isUpdating || !creditsToAdd || parseInt(creditsToAdd) < 1}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold"
                >
                  {isUpdating ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="mr-2 h-4 w-4" />
                  )}
                  Add Credits
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-card border-border max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-400" />
              Delete User
            </DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Are you sure you want to delete{' '}
                <span className="text-foreground font-medium">{selectedUser.name}</span>? This
                action cannot be undone.
              </p>
              <DialogFooter className="gap-2">
                <Button
                  variant="outline"
                  onClick={() => setDeleteDialogOpen(false)}
                  className="border-border text-muted-foreground"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDeleteUser}
                  disabled={isUpdating}
                  variant="destructive"
                  className="bg-red-600 hover:bg-red-700"
                >
                  {isUpdating ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="mr-2 h-4 w-4" />
                  )}
                  Delete User
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
