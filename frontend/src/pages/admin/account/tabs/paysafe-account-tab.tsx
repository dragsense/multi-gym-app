// Components
import { AppCard } from "@/components/layout-ui/app-card";
import { Wallet } from "lucide-react";

export default function PaysafeAccountTab() {
  return (
    <AppCard
      header={
        <div className="flex items-center gap-3">
          <Wallet className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">Paysafe Account</h3>
        </div>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Your business uses Paysafe for payments. Card payments are processed
          securely via Paysafe.js (hosted fields) during checkout and
          subscription payment.
        </p>
        <p className="text-sm text-muted-foreground">
          You can change your payment processor in Settings → Payment processor
          if needed.
        </p>
      </div>
    </AppCard>
  );
}
