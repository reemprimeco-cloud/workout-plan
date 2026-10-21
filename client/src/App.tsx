import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { SocketProvider } from "./contexts/SocketContext";
import { SubscriptionProvider } from "./contexts/SubscriptionContext";
import Home from "./pages/Home";
import AdminPanel from "./pages/AdminPanel";
import { SubscriptionSuccess, SubscriptionError } from "./pages/SubscriptionResult";
import { LicenseGate } from "./components/LicenseGate";
import AuthPage from "./pages/AuthPage";
import Landing from "./pages/Landing";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import ProfileSetupPage from "./pages/ProfileSetupPage";
import { trpc } from "@/lib/trpc";
import AdminNotificationPopup from "./components/AdminNotificationPopup";
import LegalPage from "./pages/LegalPage";
import InstallPromptBanner from "./components/InstallPromptBanner";
import { useEffect } from "react";
import { useLanguage } from "./contexts/LanguageContext";

// Keyboard-aware layout: update CSS var when iOS keyboard opens/closes
function useKeyboardAwareLayout() {
  useEffect(() => {
    const vv = (window as any).visualViewport;
    if (!vv) return;
    const update = () => {
      document.documentElement.style.setProperty('--keyboard-height', `${window.innerHeight - vv.height}px`);
    };
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    update();
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
  }, []);
}

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/admin"} component={AdminPanel} />
      <Route path={"/subscription/success"} component={SubscriptionSuccess} />
      <Route path={"/subscription/error"} component={SubscriptionError} />
      <Route path={"/reset-password"} component={ResetPasswordPage} />
      <Route path={"/profile-setup"} component={ProfileSetupPage} />
      <Route path={"/privacy"} component={() => <LegalPage type="privacy" />} />
      <Route path={"/terms"} component={() => <LegalPage type="terms" />} />
      <Route path={"/signin"}>{() => { window.location.replace("/"); return null; }}</Route>
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

// Reads language from context and passes it to the banner
function InstallBannerWithLang() {
  const { lang } = useLanguage();
  return <InstallPromptBanner lang={lang as 'ar' | 'en'} />;
}

function AppWithSocket() {
  useKeyboardAwareLayout();
  const { data: currentUser, isLoading: authLoading } = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });
  // The web is not a storefront. Customers subscribe and train in the iPhone
  // app; the only pages that stay reachable without a session are the three
  // that cannot be gated without breaking something concrete:
  //
  //   /privacy, /terms   — submitted to Apple in the app's metadata and
  //                        checked during review
  //   /reset-password    — the app's "Forgot password?" email links here, so
  //                        gating it breaks recovery for every iPhone user
  //
  // /profile-setup is deliberately absent: it needs a session, and an
  // unauthenticated visitor is sent to sign in first.
  const isPublicPage = ["/reset-password", "/privacy", "/terms"].includes(window.location.pathname);
  const isAdminPage = window.location.pathname === "/admin";

  // While auth check is in progress, show a full-screen spinner to prevent
  // any flash of the home screen before we know if the user is logged in.
  if (authLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0F1E3D 0%, #1B2E5E 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{
          width: 48, height: 48,
          border: '4px solid rgba(123,184,212,0.3)',
          borderTop: '4px solid #7BB8D4',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // An unauthenticated visitor is asked to sign in, not sold to. The web no
  // longer carries a plan-selection step: prices and checkout live in the App
  // Store, so leading with a pricing screen here would quote a payment path
  // that is no longer reachable.
  const isLegalPage = ["/privacy", "/terms"].includes(window.location.pathname);
  if (!authLoading && !currentUser && !isPublicPage && !isAdminPage && !isLegalPage) {
    // The root is the marketing page: a stranger arriving from the App Store
    // listing should meet the product, not a login form. Any deeper path is
    // someone reaching for the app itself, so that gets the sign-in screen.
    const atRoot = window.location.pathname === "/";
    return (
      <TooltipProvider>
        <Toaster />
        {atRoot ? <Landing /> : <AuthPage />}
      </TooltipProvider>
    );
  }

  // Only redirect to profile setup for brand-new users who have NO name at all.
  // Existing registered users who already have a name go straight to the app.
  // Google/OAuth users always have a name from OAuth — never redirect them.
  const hasFullName = !!(currentUser as any)?.fullName;
  const hasAnyName = !!(currentUser as any)?.name;
  const isGoogleUser = (currentUser as any)?.loginMethod === 'google' || (currentUser as any)?.authProvider === 'google';
  const needsProfileSetup = !authLoading && currentUser && !isGoogleUser && !hasFullName && !hasAnyName;
  if (needsProfileSetup && window.location.pathname !== "/profile-setup") {
    window.location.href = "/profile-setup";
    return null;
  }

  return (
    <SocketProvider userId={(currentUser as any)?.id}>
      <SubscriptionProvider>
        <TooltipProvider>
          <Toaster />
          {/* Subscription gate: admin, public pages, and legal pages bypass it */}
          {isAdminPage || isPublicPage || isLegalPage
            ? <Router />
            : <LicenseGate><Router /></LicenseGate>
          }
          {/* In-app admin notification popups — shown to all authenticated users */}
          {currentUser && !isAdminPage && <AdminNotificationPopup />}
          {/* PWA install prompt — shown once on first visit, not on admin page */}
          {!isAdminPage && <InstallBannerWithLang />}
        </TooltipProvider>
      </SubscriptionProvider>
    </SocketProvider>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <LanguageProvider>
          <AppWithSocket />
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
