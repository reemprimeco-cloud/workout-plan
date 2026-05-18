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
import Pricing from "./pages/Pricing";
import { SubscriptionSuccess, SubscriptionError } from "./pages/SubscriptionResult";
import { LicenseGate } from "./components/LicenseGate";
import AuthPage from "./pages/AuthPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import ProfileSetupPage from "./pages/ProfileSetupPage";
import { trpc } from "@/lib/trpc";
import AdminNotificationPopup from "./components/AdminNotificationPopup";
import PricingBeforeAuth from "./pages/PricingBeforeAuth";
import LegalPage from "./pages/LegalPage";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/admin"} component={AdminPanel} />
      <Route path={"/pricing"} component={Pricing} />
      <Route path={"/subscription/success"} component={SubscriptionSuccess} />
      <Route path={"/subscription/error"} component={SubscriptionError} />
      <Route path={"/reset-password"} component={ResetPasswordPage} />
      <Route path={"/profile-setup"} component={ProfileSetupPage} />
      <Route path={"/privacy"} component={() => <LegalPage type="privacy" />} />
      <Route path={"/terms"} component={() => <LegalPage type="terms" />} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppWithSocket() {
  const { data: currentUser, isLoading: authLoading } = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });
  // /profile-setup is NOT a public page — users must be logged in to access it.
  // Unauthenticated visitors hitting /profile-setup will be redirected to AuthPage first.
  const isPublicPage = ["/pricing", "/subscription/success", "/subscription/error", "/reset-password", "/privacy", "/terms"].includes(window.location.pathname);
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

  // For unauthenticated users on non-public pages: show Pricing first, then Auth
  if (!authLoading && !currentUser && !isPublicPage && !isAdminPage) {
    return (
      <TooltipProvider>
        <Toaster />
        <PricingBeforeAuth />
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
          {/* Subscription gate: admin and public pages bypass it */}
          {isAdminPage || isPublicPage
            ? <Router />
            : <LicenseGate><Router /></LicenseGate>
          }
          {/* In-app admin notification popups — shown to all authenticated users */}
          {currentUser && !isAdminPage && <AdminNotificationPopup />}
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
