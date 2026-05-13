import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { SocketProvider } from "./contexts/SocketContext";
import Home from "./pages/Home";
import AdminPanel from "./pages/AdminPanel";
import { LicenseGate } from "./components/LicenseGate";
import { trpc } from "@/lib/trpc";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/admin"} component={AdminPanel} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppWithSocket() {
  const { data: currentUser } = trpc.auth.me.useQuery();
  return (
    <SocketProvider userId={(currentUser as any)?.id}>
      <TooltipProvider>
        <Toaster />
        {window.location.pathname === '/admin'
          ? <Router />
          : <LicenseGate><Router /></LicenseGate>
        }
      </TooltipProvider>
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
