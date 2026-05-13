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
import { trpc } from "@/lib/trpc";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/admin"} component={AdminPanel} />
      <Route path={"/pricing"} component={Pricing} />
      <Route path={"/subscription/success"} component={SubscriptionSuccess} />
      <Route path={"/subscription/error"} component={SubscriptionError} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppWithSocket() {
  const { data: currentUser } = trpc.auth.me.useQuery();
  const isPublicPage = ["/pricing", "/subscription/success", "/subscription/error"].includes(window.location.pathname);
  return (
    <SocketProvider userId={(currentUser as any)?.id}>
      <SubscriptionProvider>
        <TooltipProvider>
          <Toaster />
          {(window.location.pathname === "/admin" || isPublicPage)
            ? <Router />
            : <LicenseGate><Router /></LicenseGate>
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
