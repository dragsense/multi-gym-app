// React
import { useState, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// Components
import { AppCard } from "@/components/layout-ui/app-card";
import { Button } from "@/components/ui/button";
import {
  ExternalLink,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Unplug,
  RefreshCw,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// Services
import {
  createStripeConnectAccount,
  getStripeConnectStatus,
  getStripeOnboardingLink,
  disconnectStripeConnect,
} from "@/services/stripe-connect.api";

// Types
import type {
  StripeConnectCreateResponseDto,
  StripeConnectStatusDto,
} from "@shared/dtos";

export default function StripeConnectTab() {
  const queryClient = useQueryClient();
  const [onboardingUrl, setOnboardingUrl] = useState<string | null>(null);

  // Get Stripe Connect status
  const {
    data: connectStatus,
    isLoading: isLoadingStatus,
    refetch: refetchStatus,
  } = useQuery<StripeConnectStatusDto>({
    queryKey: ["stripe-connect-status"],
    queryFn: getStripeConnectStatus,
    retry: false,
  });

  // Create Stripe Connect account
  const { mutate: createAccount, isPending: isCreating } = useMutation({
    mutationFn: () =>
      createStripeConnectAccount({
        type: "express",
        country: "US",
      }),
    onSuccess: (data: StripeConnectCreateResponseDto) => {
      if (data.data?.onboardingUrl) {
        setOnboardingUrl(data.data.onboardingUrl);
        window.open(data.data.onboardingUrl, "_blank");
      }
      queryClient.invalidateQueries({ queryKey: ["stripe-connect-status"] });
    },
  });

  // Get new onboarding link
  const { mutate: refreshOnboardingLink, isPending: isRefreshing } =
    useMutation({
      mutationFn: getStripeOnboardingLink,
      onSuccess: (data: StripeConnectCreateResponseDto) => {
        if (data.data?.onboardingUrl) {
          setOnboardingUrl(data.data.onboardingUrl);
          window.open(data.data.onboardingUrl, "_blank");
        }
      },
    });

  // Disconnect Stripe Connect
  const { mutate: disconnect, isPending: isDisconnecting } = useMutation({
    mutationFn: disconnectStripeConnect,
    onSuccess: () => {
      setOnboardingUrl(null);
      queryClient.invalidateQueries({ queryKey: ["stripe-connect-status"] });
      queryClient.invalidateQueries({ queryKey: ["my-business"] });
    },
  });

  const handleConnect = useCallback(() => {
    createAccount();
  }, [createAccount]);

  const handleResumeOnboarding = useCallback(() => {
    refreshOnboardingLink();
  }, [refreshOnboardingLink]);

  const handleDisconnect = useCallback(() => {
    disconnect();
  }, [disconnect]);

  const handleRefreshStatus = useCallback(() => {
    refetchStatus();
  }, [refetchStatus]);

  const isComplete = connectStatus?.isComplete === true;
  const hasAccount = !!connectStatus?.stripeAccountId;
  const isIncomplete = hasAccount && !isComplete;

  if (isLoadingStatus) {
    return (
      <AppCard loading={true}>
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">
            Loading Stripe account status...
          </p>
        </div>
      </AppCard>
    );
  }

  return (
    <div className="space-y-6">
      {/* Connected and complete */}
      {isComplete && (
        <AppCard
          header={
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <h3 className="text-lg font-semibold">Stripe Account Connected</h3>
            </div>
          }
        >
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Your business is connected to Stripe and ready to accept payments.
            </p>

            {connectStatus?.account && (
              <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/20">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">
                    Account ID
                  </p>
                  <p className="font-mono text-sm mt-1">
                    {connectStatus.account.id}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">
                    Email
                  </p>
                  <p className="text-sm mt-1">{connectStatus.account.email}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">
                    Country
                  </p>
                  <p className="text-sm mt-1">
                    {connectStatus.account.country}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">
                    Type
                  </p>
                  <p className="text-sm mt-1 capitalize">
                    {connectStatus.account.type}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">
                    Charges
                  </p>
                  <p className="text-sm mt-1">
                    {connectStatus.account.charges_enabled ? (
                      <span className="text-green-600 flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Enabled
                      </span>
                    ) : (
                      <span className="text-yellow-600">Pending</span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">
                    Details Submitted
                  </p>
                  <p className="text-sm mt-1">
                    {connectStatus.account.details_submitted ? (
                      <span className="text-green-600 flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Complete
                      </span>
                    ) : (
                      <span className="text-yellow-600">Incomplete</span>
                    )}
                  </p>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefreshStatus}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh Status
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={isDisconnecting}
                  >
                    <Unplug className="mr-2 h-4 w-4" />
                    {isDisconnecting ? "Disconnecting..." : "Disconnect"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Disconnect Stripe Account?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will disconnect your Stripe account from the platform.
                      You will no longer be able to receive payments until you
                      connect a new account. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDisconnect}>
                      Disconnect
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </AppCard>
      )}

      {/* Account exists but incomplete */}
      {isIncomplete && (
        <AppCard
          header={
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <h3 className="text-lg font-semibold">
                Stripe Onboarding Incomplete
              </h3>
            </div>
          }
        >
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Your Stripe account has been created but the onboarding process is
              not complete. Please finish the setup on Stripe to start accepting
              payments.
            </p>

            {connectStatus?.account && (
              <div className="p-4 border rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800">
                <p className="text-sm">
                  Account ID:{" "}
                  <span className="font-mono">
                    {connectStatus.account.id}
                  </span>
                </p>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleResumeOnboarding}
                disabled={isRefreshing}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                {isRefreshing
                  ? "Generating link..."
                  : "Resume Stripe Onboarding"}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleRefreshStatus}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh Status
              </Button>
            </div>
          </div>
        </AppCard>
      )}

      {/* No account yet */}
      {!hasAccount && (
        <AppCard
          header={
            <div className="flex items-center gap-3">
              <CreditCard className="h-5 w-5 text-muted-foreground" />
              <h3 className="text-lg font-semibold">Connect Stripe Account</h3>
            </div>
          }
        >
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Connect your Stripe account to start receiving payments through the
              platform. You'll be redirected to Stripe to complete the secure
              onboarding process.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 border rounded-lg bg-muted/20">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-sm">
                  Accept credit & debit card payments
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-sm">
                  Automatic payouts to your bank account
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-sm">
                  Stripe handles compliance & security
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-sm">
                  No additional fees from our platform
                </span>
              </div>
            </div>

            <div className="pt-2">
              <Button onClick={handleConnect} disabled={isCreating}>
                {isCreating ? (
                  "Setting up..."
                ) : (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Connect with Stripe
                  </>
                )}
              </Button>
            </div>
          </div>
        </AppCard>
      )}
    </div>
  );
}
