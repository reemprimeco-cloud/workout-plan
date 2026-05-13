import { useLocation, Link } from "wouter";
import { CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const NAVY = "#1B2E5E";

export function SubscriptionSuccess() {
  return (
    <div style={{ minHeight: "100vh", background: "#F0F4F8", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: "white", borderRadius: 24, padding: "48px 36px", maxWidth: 440, width: "100%", textAlign: "center", boxShadow: "0 8px 32px rgba(0,0,0,0.08)" }}>
        <CheckCircle size={64} color="#22c55e" style={{ marginBottom: 16 }} />
        <h1 style={{ fontSize: 26, fontWeight: 900, color: NAVY, margin: "0 0 8px" }}>Payment Successful!</h1>
        <p style={{ color: "#64748b", fontSize: 15, marginBottom: 32 }}>
          Your Prime Fit subscription is now active. Enjoy full access to all premium features.
        </p>
        <Link href="/">
          <Button style={{ background: NAVY, color: "white", fontWeight: 700, borderRadius: 12, padding: "12px 32px" }}>
            Go to App
          </Button>
        </Link>
      </div>
    </div>
  );
}

export function SubscriptionError() {
  return (
    <div style={{ minHeight: "100vh", background: "#F0F4F8", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: "white", borderRadius: 24, padding: "48px 36px", maxWidth: 440, width: "100%", textAlign: "center", boxShadow: "0 8px 32px rgba(0,0,0,0.08)" }}>
        <XCircle size={64} color="#ef4444" style={{ marginBottom: 16 }} />
        <h1 style={{ fontSize: 26, fontWeight: 900, color: NAVY, margin: "0 0 8px" }}>Payment Failed</h1>
        <p style={{ color: "#64748b", fontSize: 15, marginBottom: 32 }}>
          Something went wrong with your payment. Please try again or contact support at <strong>65068000</strong>.
        </p>
        <Link href="/pricing">
          <Button style={{ background: NAVY, color: "white", fontWeight: 700, borderRadius: 12, padding: "12px 32px" }}>
            Try Again
          </Button>
        </Link>
      </div>
    </div>
  );
}
