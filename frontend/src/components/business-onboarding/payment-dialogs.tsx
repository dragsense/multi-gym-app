// React
import { useId } from "react";

// Components
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AppDialog } from "@/components/layout-ui/app-dialog";

interface IPaymentSuccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onContinue: () => void;
}

export function PaymentSuccessDialog({
  open,
  onOpenChange,
  onContinue,
}: IPaymentSuccessDialogProps) {
  const componentId = useId();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-component-id={componentId}>
        <AppDialog
          title="Payment Successful!"
          description="Your subscription payment has been processed successfully. Your business is now set up and ready to use."
          footerContent={
            <Button onClick={onContinue}>
              Continue to Dashboard
            </Button>
          }
        >
          <div />
        </AppDialog>
      </DialogContent>
    </Dialog>
  );
}

interface IPaymentErrorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  errorMessage?: string;
  onRetry: () => void;
  onContinueLater: () => void;
}

export function PaymentErrorDialog({
  open,
  onOpenChange,
  errorMessage,
  onRetry,
  onContinueLater,
}: IPaymentErrorDialogProps) {
  const componentId = useId();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-component-id={componentId}>
        <AppDialog
          title="Payment Failed"
          description={errorMessage || "There was an error processing your payment. Please try again."}
          footerContent={
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={onContinueLater}>
                Continue Later
              </Button>
              <Button onClick={onRetry}>
                Retry Payment
              </Button>
            </div>
          }
        >
          <div />
        </AppDialog>
      </DialogContent>
    </Dialog>
  );
}
