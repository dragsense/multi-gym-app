// External Libraries
import { useId } from "react";

// Components
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

// Hooks
import { useSessionPaymentStatus } from "@/hooks/use-session-payment-status";
import { formatDateTime } from "@/lib/utils";
import { useUserSettings } from "@/hooks/use-user-settings";

// Types
interface ISessionPaymentStatusProps {
  sessionId: string;
  memberId: string;
  payNowButton: React.ReactNode;
}

/**
 * Reusable component to display session payment status with loading effect
 */
export function SessionPaymentStatus({
  sessionId,
  memberId,
  payNowButton,
}: ISessionPaymentStatusProps) {
  const componentId = useId();
  const { settings } = useUserSettings();
  const { data, isLoading, isError } = useSessionPaymentStatus({
    sessionId,
    memberId,
  });

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center gap-2" data-component-id={componentId}>
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Checking...</span>
      </div>
    );
  }

  // Error state or no data
  if (isError || !data) {
    return (
      <div className="flex items-center gap-2" data-component-id={componentId}>
        <Badge variant="outline" className="text-xs">
          Unknown
        </Badge>
      </div>
    );
  }

  // Paid state
  if (data.hasPaid) {
    return (
      <div className="flex items-center gap-2" data-component-id={componentId}>
        <CheckCircle2 className="w-4 h-4 text-green-600" aria-label="Paid" />
        <Badge
          variant="outline"
          className="text-xs bg-green-50 text-green-700 border-green-200"
        >
          Paid
        </Badge>
        {data?.paidAt && (
          <span className="text-xs text-muted-foreground">
            | Paid At: {formatDateTime(data.paidAt, settings)}
          </span>
        )}
      </div>
    );
  }

  // Not paid state
  return (
    <div className="flex items-center gap-2" data-component-id={componentId}>
      <XCircle className="w-4 h-4 text-red-600" />
      <Badge
        variant="outline"
        className="text-xs bg-red-50 text-red-700 border-red-200"
      >
        Not Paid
      </Badge>
      {payNowButton}
    </div>
  );
}
