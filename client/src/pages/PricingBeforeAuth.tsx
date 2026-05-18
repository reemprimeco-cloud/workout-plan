// ============================================================
// PricingBeforeAuth — Prime Fit Pre-Auth Pricing Flow
//
// Flow:
//   1. Show Pricing page (plan selection)
//   2. After plan selected → show AuthPage (login/signup)
//   3. After successful auth → activate selected plan:
//      - free → call activateFreeSubscription
//      - paid → call createCheckout → redirect to MyFatoorah
//   4. Returning users with active subscription → skip pricing
// ============================================================
import { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import AuthPage from './AuthPage';
import PricingSelector from './PricingSelector';

// sessionStorage key for persisting plan selection across auth redirect
const PLAN_KEY = 'primefit_selected_plan';
const PERIOD_KEY = 'primefit_selected_period';

export type SelectedPlan = 'free' | 'prime_plus' | 'prime_pro';
export type SelectedPeriod = 'monthly' | 'yearly';

export default function PricingBeforeAuth() {
  const [step, setStep] = useState<'pricing' | 'auth'>('pricing');
  const [selectedPlan, setSelectedPlan] = useState<SelectedPlan | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<SelectedPeriod>('monthly');

  // Restore plan from sessionStorage (in case of page reload during auth)
  useEffect(() => {
    const savedPlan = sessionStorage.getItem(PLAN_KEY) as SelectedPlan | null;
    const savedPeriod = sessionStorage.getItem(PERIOD_KEY) as SelectedPeriod | null;
    if (savedPlan) {
      setSelectedPlan(savedPlan);
      setSelectedPeriod(savedPeriod ?? 'monthly');
      setStep('auth');
    }
  }, []);

  const handlePlanSelected = (plan: SelectedPlan, period: SelectedPeriod) => {
    setSelectedPlan(plan);
    setSelectedPeriod(period);
    // Persist so we survive any page reload during auth
    sessionStorage.setItem(PLAN_KEY, plan);
    sessionStorage.setItem(PERIOD_KEY, period);
    setStep('auth');
  };

  const handleBackToPricing = () => {
    sessionStorage.removeItem(PLAN_KEY);
    sessionStorage.removeItem(PERIOD_KEY);
    setSelectedPlan(null);
    setStep('pricing');
  };

  if (step === 'pricing') {
    return (
      <PricingSelector
        onPlanSelected={handlePlanSelected}
      />
    );
  }

  // step === 'auth'
  return (
    <PostAuthActivator
      selectedPlan={selectedPlan}
      selectedPeriod={selectedPeriod}
      onBackToPricing={handleBackToPricing}
    />
  );
}

// ── PostAuthActivator ─────────────────────────────────────────────────────────
// Renders AuthPage and, after successful login/signup, activates the selected plan
function PostAuthActivator({
  selectedPlan,
  selectedPeriod,
  onBackToPricing,
}: {
  selectedPlan: SelectedPlan | null;
  selectedPeriod: SelectedPeriod;
  onBackToPricing: () => void;
}) {
  const [authDone, setAuthDone] = useState(false);
  const utils = trpc.useUtils();

  const activateFree = trpc.subscription.activateFreeSubscription.useMutation({
    onSuccess: () => {
      sessionStorage.removeItem(PLAN_KEY);
      sessionStorage.removeItem(PERIOD_KEY);
      utils.auth.me.invalidate();
      utils.subscription.getStatus.invalidate();
      window.location.reload();
    },
    onError: (err) => {
      // Free trial already used or blocked — send to pricing, NOT into the app
      sessionStorage.removeItem(PLAN_KEY);
      sessionStorage.removeItem(PERIOD_KEY);
      // Redirect to pricing so user must choose a paid plan
      window.location.replace('/pricing');
    },
  });

  const createCheckout = trpc.subscription.createCheckout.useMutation({
    onSuccess: (data) => {
      sessionStorage.removeItem(PLAN_KEY);
      sessionStorage.removeItem(PERIOD_KEY);
      window.location.href = data.invoiceUrl;
    },
    onError: () => {
      // Checkout failed — send back to pricing, NOT into the app
      sessionStorage.removeItem(PLAN_KEY);
      sessionStorage.removeItem(PERIOD_KEY);
      window.location.replace('/pricing');
    },
  });

  const handleAuthSuccess = () => {
    setAuthDone(true);
  };

  // After auth succeeds, activate the plan
  useEffect(() => {
    if (!authDone) return;

    if (!selectedPlan || selectedPlan === 'free') {
      activateFree.mutate();
    } else {
      // Paid plan — go to MyFatoorah
      createCheckout.mutate({
        plan: selectedPlan as 'prime_plus' | 'prime_pro',
        period: selectedPeriod,
        origin: window.location.origin,
      });
    }
  }, [authDone]);

  const isProcessing = activateFree.isPending || createCheckout.isPending;

  if (isProcessing) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0F1E3D 0%, #1B2E5E 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: 16,
        fontFamily: 'Cairo, Tajawal, system-ui, sans-serif',
      }}>
        <div style={{
          width: 48, height: 48,
          border: '4px solid rgba(123,184,212,0.3)',
          borderTop: '4px solid #7BB8D4',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ color: '#A8D4E8', fontSize: 15, fontWeight: 600 }}>
          {selectedPlan === 'free' ? 'جاري تفعيل الاشتراك المجاني...' : 'جاري التوجيه لصفحة الدفع...'}
        </div>
      </div>
    );
  }

  return (
    <AuthPage
      onSuccess={handleAuthSuccess}
      onBackToPricing={onBackToPricing}
      selectedPlan={selectedPlan}
    />
  );
}
