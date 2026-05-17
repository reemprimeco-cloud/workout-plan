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
  const isPublicPage = ["/pricing", "/subscription/success", "/subscription/error", "/reset-password", "/profile-setup"].includes(window.location.pathname);
  const isAdminPage = window.location.pathname === "/admin";
  const useLicense = new URLSearchParams(window.location.search).get('use_license') === '1';

  // Show auth page for unauthenticated users (not on public/admin pages)
  if (!authLoading && !currentUser && !isPublicPage && !isAdminPage) {
    if (useLicense) {
      // Legacy license code flow
      return (
        <SocketProvider userId={undefined}>
          <SubscriptionProvider>
            <TooltipProvider>
              <Toaster />
              <LicenseGate><Router /></LicenseGate>
            </TooltipProvider>
          </SubscriptionProvider>
        </SocketProvider>
      );
    }
    return (
      <TooltipProvider>
        <Toaster />
        <AuthPage />
      </TooltipProvider>
    );
  }

  // Redirect to profile setup if user is logged in but profile is incomplete
  if (!authLoading && currentUser && window.location.pathname !== "/profile-setup" && !(currentUser as any)?.fullName) {
    window.location.href = "/profile-setup";
    return null;
  }

  return (
    <SocketProvider userId={(currentUser as any)?.id}>
      <SubscriptionProvider>
        <TooltipProvider>
          <Toaster />
          {(isAdminPage || isPublicPage)
            ? <Router />
            : <Router />
          }
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
