import { useSubscription } from "@/contexts/SubscriptionContext";
import { Button } from "@/components/ui/button";
import { APP_STORE_URL } from "@/lib/appStore";
import { Lock } from "lucide-react";
import { Link } from "wouter";
import type { ReactNode } from "react";

interface PremiumGateProps {
  feature: string;
  children: ReactNode;
  /** Optional custom message */
  message?: string;
  /** If true, renders children but with a blurred overlay instead of hiding */
  blur?: boolean;
}

export function PremiumGate({ feature, children, message, blur = false }: PremiumGateProps) {
  const { hasFeature, isLoading } = useSubscription();

  if (isLoading) return null;

  if (hasFeature(feature)) {
    return <>{children}</>;
  }

  const lockMessage = message ?? "This feature needs a Prime Plus or Prime Pro subscription. Subscriptions are purchased in the Prime Fit iPhone app.";

  if (blur) {
    return (
      <div className="relative">
        <div className="pointer-events-none select-none blur-sm opacity-50">
          {children}
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/60 rounded-lg gap-3 p-4">
          <Lock className="w-8 h-8 text-muted-foreground" />
          <p className="text-sm text-center text-muted-foreground max-w-xs">{lockMessage}</p>
          <a href={APP_STORE_URL} target="_blank" rel="noopener noreferrer">
            <Button size="sm" className="bg-[#1B2E5E] hover:bg-[#0F1E3D] text-white">
              Get the app
            </Button>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12 px-6 text-center rounded-xl border border-dashed border-border bg-muted/30">
      <div className="w-14 h-14 rounded-full bg-[#1B2E5E]/10 flex items-center justify-center">
        <Lock className="w-7 h-7 text-[#1B2E5E]" />
      </div>
      <div>
        <h3 className="font-semibold text-foreground mb-1">Premium Feature</h3>
        <p className="text-sm text-muted-foreground max-w-sm">{lockMessage}</p>
      </div>
      <a href={APP_STORE_URL} target="_blank" rel="noopener noreferrer">
        <Button className="bg-[#1B2E5E] hover:bg-[#0F1E3D] text-white">
          Get the app
        </Button>
      </a>
    </div>
  );
}
