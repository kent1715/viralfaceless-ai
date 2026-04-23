'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Coins as Coin,
  Plus,
  Crown,
  Star,
  Check,
  Loader2,
  QrCode,
  Building2,
  Wallet,
  TrendingUp,
  ShoppingCart,
  Sparkles,
  Gift,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useStore } from '@/lib/store';
import { api } from '@/lib/api';
import { PAYMENT_PLANS, PAYMENT_METHODS } from '@/lib/constants';
import type { PaymentRecord } from '@/lib/types';
import { useI18n } from '@/lib/i18n';

const METHOD_ICONS: Record<string, React.ReactNode> = {
  qris: <QrCode className="h-5 w-5" />,
  bank_transfer: <Building2 className="h-5 w-5" />,
  ewallet: <Wallet className="h-5 w-5" />,
};

const MOCK_PAYMENTS: PaymentRecord[] = [
  {
    id: 'pay1',
    amount: 29000,
    method: 'qris',
    creditsAdded: 50,
    status: 'success',
    createdAt: '2025-01-15T10:00:00Z',
  },
  {
    id: 'pay2',
    amount: 79000,
    method: 'bank_transfer',
    creditsAdded: 200,
    status: 'success',
    createdAt: '2025-01-10T08:00:00Z',
  },
  {
    id: 'pay3',
    amount: 29000,
    method: 'ewallet',
    creditsAdded: 50,
    status: 'pending',
    createdAt: '2025-01-18T14:00:00Z',
  },
];

const USAGE_ITEMS = [
  { key: 'credits.usage.ideas', count: 5 },
  { key: 'credits.usage.scripts', count: 3 },
  { key: 'credits.usage.tts', count: 4 },
  { key: 'credits.usage.thumbnails', count: 2 },
  { key: 'credits.usage.seo', count: 2 },
];

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function CreditDashboard() {
  const { t } = useI18n();
  const { user, setPayments, payments } = useStore();
  const [creditBalance, setCreditBalance] = useState(user?.credits || 0);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<(typeof PAYMENT_PLANS)[number] | null>(
    null
  );
  const [selectedMethod, setSelectedMethod] = useState('qris');
  const [customCredits, setCustomCredits] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const [paymentHistory, setPaymentHistory] = useState<PaymentRecord[]>(MOCK_PAYMENTS);

  const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    pending: { label: t('credits.status.pending'), color: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20' },
    success: { label: t('credits.status.success'), color: 'bg-green-500/15 text-green-400 border-green-500/20' },
    failed: { label: t('credits.status.failed'), color: 'bg-red-500/15 text-red-400 border-red-500/20' },
  };

  // Fetch credits balance on mount
  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const data = await api.credits.balance();
        setCreditBalance(data.credits ?? user?.credits ?? 0);
      } catch {
        // Use local user credits as fallback
        setCreditBalance(user?.credits || 0);
      }
    };
    fetchBalance();
  }, [user?.credits]);

  const handleBuyPlan = (plan: (typeof PAYMENT_PLANS)[number]) => {
    setSelectedPlan(plan);
    setCustomCredits('');
    setSelectedMethod('qris');
    setPaymentSuccess(false);
    setPaymentDialogOpen(true);
  };

  const handleBuyCustom = () => {
    const amount = parseInt(customCredits);
    if (!amount || amount < 1) {
      toast.error(t('credits.error.invalidAmount'));
      return;
    }
    setSelectedPlan(null);
    setSelectedMethod('qris');
    setPaymentSuccess(false);
    setPaymentDialogOpen(true);
  };

  const handleConfirmPayment = async () => {
    setIsProcessing(true);
    try {
      const credits = selectedPlan ? selectedPlan.credits : parseInt(customCredits);
      const price = selectedPlan ? selectedPlan.price : credits * 1000;

      const data = await api.payments.create(price, selectedMethod);

      // Mock success flow with 2 second delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setPaymentSuccess(true);
      setCreditBalance((prev) => prev + credits);

      const newPayment: PaymentRecord = {
        id: data.payment?.id || Date.now().toString(),
        amount: price,
        method: selectedMethod,
        creditsAdded: credits,
        status: 'success',
        createdAt: new Date().toISOString(),
      };
      setPaymentHistory((prev) => [newPayment, ...prev]);
      setPayments(paymentHistory);

      toast.success(t('credits.success.added').replace('{n}', String(credits)));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('credits.paymentFailed');
      toast.error(message);
    } finally {
      setIsProcessing(false);
    }
  };

  const progressToNext = creditBalance % 50;
  const progressPct = (progressToNext / 50) * 100;
  const creditsToNext = 50 - progressToNext;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <div className="rounded-lg bg-gradient-to-br from-yellow-500 to-orange-600 p-2.5">
          <Coin className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('credits.title')}</h1>
          <p className="text-sm text-muted-foreground">
            {t('credits.subtitle')}
          </p>
        </div>
      </motion.div>

      {/* Current Credits Display */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <Card className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 border-purple-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">{t('credits.available')}</p>
                <div className="flex items-center gap-3">
                  <Coin className="h-8 w-8 text-yellow-400" />
                  <span className="text-4xl font-bold text-foreground">
                    {creditBalance}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <Gift className="h-8 w-8 text-purple-400 mb-1" />
                <p className="text-xs text-muted-foreground">
                  {t('credits.toNextReward').replace('{n}', String(creditsToNext))}
                </p>
              </div>
            </div>
            <Progress
              value={progressPct}
              className="h-2 bg-muted [&>div]:bg-gradient-to-r [&>div]:from-purple-500 [&>div]:to-pink-500"
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* Usage History */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-400" />
              {t('credits.recentUsage')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {USAGE_ITEMS.map((item) => (
                <div key={item.key} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{t(item.key)}</span>
                  <div className="flex items-center gap-2 flex-1 mx-4">
                    <div className="h-2 flex-1 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(item.count / 5) * 100}%` }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
                      />
                    </div>
                  </div>
                  <span className="text-sm font-medium text-foreground">{item.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Buy Credits */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <ShoppingCart className="h-4 w-4" />
          {t('credits.buyCredits')}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {PAYMENT_PLANS.map((plan) => (
            <Card
              key={plan.value}
              className={`border bg-card transition-all hover:shadow-lg ${
                plan.value === 'premium'
                  ? 'border-purple-500/40 shadow-purple-500/10'
                  : 'border-border'
              }`}
            >
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {plan.value === 'premium' ? (
                      <Crown className="h-5 w-5 text-yellow-400" />
                    ) : (
                      <Star className="h-5 w-5 text-blue-400" />
                    )}
                    <h3 className="font-bold text-foreground">{plan.label}</h3>
                  </div>
                  {plan.value === 'premium' && (
                    <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs">
                      {t('credits.popular')}
                    </Badge>
                  )}
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-foreground">
                    {formatRupiah(plan.price)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Coin className="h-4 w-4 text-yellow-400" />
                  <span className="text-lg font-semibold text-purple-300">
                    {plan.credits} credits
                  </span>
                </div>

                <Separator className="bg-border" />

                <ul className="space-y-1.5">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-center gap-2 text-sm text-muted-foreground"
                    >
                      <Check className="h-3.5 w-3.5 text-green-400 shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => handleBuyPlan(plan)}
                  className={`w-full font-semibold ${
                    plan.value === 'premium'
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg shadow-purple-500/25'
                      : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg shadow-blue-500/25'
                  }`}
                >
                  {plan.value === 'premium' ? (
                    <>
                      <Crown className="mr-2 h-4 w-4" />
                      {t('credits.upgrade')}
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      {t('credits.buyNow')}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Custom Credits */}
        <Card className="bg-card border-border mt-4">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex-1 space-y-2">
                <Label className="text-sm font-medium text-foreground">
                  {t('credits.customCredits')}
                </Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={customCredits}
                    onChange={(e) => setCustomCredits(e.target.value)}
                    placeholder={t('credits.enterAmount')}
                    min={1}
                    className="bg-background border-border text-foreground"
                  />
                  <Button
                    onClick={handleBuyCustom}
                    disabled={!customCredits || parseInt(customCredits) < 1}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold whitespace-nowrap"
                  >
                    <Coin className="mr-2 h-4 w-4" />
                    {t('credits.buy')}
                  </Button>
                </div>
                {customCredits && parseInt(customCredits) > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {t('credits.total')}{' '}
                    <span className="text-foreground font-medium">
                      {formatRupiah(parseInt(customCredits) * 1000)}
                    </span>
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Payment Method Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              {paymentSuccess ? (
                <>
                  <Sparkles className="h-5 w-5 text-yellow-400" />
                  {t('credits.paymentSuccess')}
                </>
              ) : (
                <>
                  <Wallet className="h-5 w-5 text-purple-400" />
                  {t('credits.completePayment')}
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          <AnimatePresence mode="wait">
            {paymentSuccess ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center py-6 text-center"
              >
                <div className="rounded-full bg-green-500/20 p-4 mb-4">
                  <Check className="h-10 w-10 text-green-400" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-1">
                  {t('credits.creditsAdded')}
                </h3>
                <p className="text-2xl font-bold text-purple-400 mb-2">
                  +{selectedPlan ? selectedPlan.credits : customCredits} credits
                </p>
                <p className="text-sm text-muted-foreground mb-6">
                  {t('credits.creditsAddedToAccount')}
                </p>
                <Button
                  onClick={() => setPaymentDialogOpen(false)}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                >
                  {t('credits.done')}
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-4"
              >
                {/* Order Summary */}
                <div className="rounded-lg bg-muted/50 p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t('credits.plan')}</span>
                    <span className="text-foreground font-medium">
                      {selectedPlan
                        ? selectedPlan.label
                        : `Custom (${customCredits} credits)`}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t('credits.credits')}</span>
                    <span className="text-foreground font-medium">
                      {selectedPlan ? selectedPlan.credits : customCredits}
                    </span>
                  </div>
                  <Separator className="bg-border" />
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-foreground">{t('credits.total')}</span>
                    <span className="text-lg font-bold text-foreground">
                      {formatRupiah(
                        selectedPlan
                          ? selectedPlan.price
                          : (parseInt(customCredits) || 0) * 1000
                      )}
                    </span>
                  </div>
                </div>

                {/* Payment Method */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-foreground">
                    {t('credits.paymentMethod')}
                  </Label>
                  <RadioGroup
                    value={selectedMethod}
                    onValueChange={setSelectedMethod}
                    className="space-y-2"
                  >
                    {PAYMENT_METHODS.map((method) => (
                      <label
                        key={method.value}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                          selectedMethod === method.value
                            ? 'border-purple-500/50 bg-purple-500/5'
                            : 'border-border bg-background hover:border-purple-500/30'
                        }`}
                      >
                        <RadioGroupItem value={method.value} className="border-border" />
                        <div className="flex items-center gap-2 text-muted-foreground">
                          {METHOD_ICONS[method.value]}
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {method.label}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {method.description}
                            </p>
                          </div>
                        </div>
                      </label>
                    ))}
                  </RadioGroup>
                </div>

                <DialogFooter className="gap-2 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setPaymentDialogOpen(false)}
                    className="border-border text-muted-foreground"
                  >
                    {t('credits.cancel')}
                  </Button>
                  <Button
                    onClick={handleConfirmPayment}
                    disabled={isProcessing}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t('credits.processing')}
                      </>
                    ) : (
                      <>
                        <Wallet className="mr-2 h-4 w-4" />
                        {t('credits.confirmPayment')}
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>

      {/* Payment History */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="bg-card border-border">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-purple-400" />
              {t('credits.history')}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-muted-foreground">{t('credits.historyDate')}</TableHead>
                    <TableHead className="text-muted-foreground">{t('credits.historyAmount')}</TableHead>
                    <TableHead className="text-muted-foreground">{t('credits.historyMethod')}</TableHead>
                    <TableHead className="text-muted-foreground">{t('credits.historyCredits')}</TableHead>
                    <TableHead className="text-muted-foreground">{t('credits.historyStatus')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paymentHistory.map((payment, index) => {
                    const status = STATUS_CONFIG[payment.status] || STATUS_CONFIG.pending;
                    return (
                      <motion.tr
                        key={payment.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="border-border hover:bg-muted/30 transition-colors"
                      >
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(payment.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </TableCell>
                        <TableCell className="text-sm text-foreground font-medium">
                          {formatRupiah(payment.amount)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground capitalize">
                          {payment.method.replace('_', ' ')}
                        </TableCell>
                        <TableCell className="text-sm text-purple-300 font-medium">
                          +{payment.creditsAdded}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`text-xs ${status.color}`}
                          >
                            {status.label}
                          </Badge>
                        </TableCell>
                      </motion.tr>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {paymentHistory.length === 0 && (
              <div className="flex flex-col items-center py-12 text-center">
                <ShoppingCart className="h-10 w-10 text-muted-foreground/40 mb-3" />
                <p className="text-muted-foreground">{t('credits.noHistory')}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
