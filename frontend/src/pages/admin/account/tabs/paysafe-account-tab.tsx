import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AppCard } from "@/components/layout-ui/app-card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertCircle,
  CheckCircle2,
  Link2,
  RefreshCw,
  Unplug,
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
import { toast } from "sonner";
import type { PaysafeConnectStatusDto } from "@shared/dtos";
import {
  createPaysafeApplication,
  disconnectPaysafeConnect,
  getPaysafeConnectStatus,
  refreshPaysafeConnectStatus,
} from "@/services/paysafe-connect.api";

export default function PaysafeAccountTab() {
  const queryClient = useQueryClient();
  const [rawJson, setRawJson] = useState<string>("{}");

  const {
    data: status,
    isLoading,
    refetch,
  } = useQuery<PaysafeConnectStatusDto>({
    queryKey: ["paysafe-connect-status"],
    queryFn: getPaysafeConnectStatus,
    retry: false,
  });

  const connected = status?.connected === true;

  const parsedPayload = useMemo(() => {
    try {
      const v = JSON.parse(rawJson);
      return v && typeof v === "object" ? (v as Record<string, any>) : null;
    } catch {
      return null;
    }
  }, [rawJson]);

  const { mutate: connect, isPending: isConnecting } = useMutation({
    mutationFn: async () => {
      if (!parsedPayload) {
        throw new Error("Invalid JSON payload");
      }
      return createPaysafeApplication({ payload: parsedPayload });
    },
    onSuccess: (res) => {
      toast.success(res.message || "Paysafe application created");
      queryClient.invalidateQueries({ queryKey: ["paysafe-connect-status"] });
      queryClient.invalidateQueries({ queryKey: ["my-business"] });
    },
    onError: (e: any) => {
      toast.error(e?.message || "Failed to create Paysafe application");
    },
  });

  const { mutate: refresh, isPending: isRefreshing } = useMutation({
    mutationFn: refreshPaysafeConnectStatus,
    onSuccess: (res) => {
      toast.success(res.message || "Status refreshed");
      queryClient.invalidateQueries({ queryKey: ["paysafe-connect-status"] });
    },
    onError: (e: any) => {
      toast.error(e?.message || "Failed to refresh status");
    },
  });

  const { mutate: disconnect, isPending: isDisconnecting } = useMutation({
    mutationFn: disconnectPaysafeConnect,
    onSuccess: (res) => {
      toast.success(res.message || "Disconnected");
      queryClient.invalidateQueries({ queryKey: ["paysafe-connect-status"] });
      queryClient.invalidateQueries({ queryKey: ["my-business"] });
    },
    onError: (e: any) => {
      toast.error(e?.message || "Failed to disconnect");
    },
  });

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  if (isLoading) {
    return (
      <AppCard loading={true}>
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading Paysafe status…</p>
        </div>
      </AppCard>
    );
  }

  if (connected) {
    return (
      <div className="space-y-6">
        <AppCard
          header={
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <h3 className="text-lg font-semibold">Paysafe Connected</h3>
            </div>
          }
        >
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Your business has a Paysafe application linked. This uses Paysafe
              Applications API for merchant onboarding.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/20">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  Application ID
                </p>
                <p className="font-mono text-sm mt-1 break-all">
                  {status.applicationId}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  Status
                </p>
                <p className="text-sm mt-1">{status.status ?? "unknown"}</p>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" size="sm" onClick={() => refresh()} disabled={isRefreshing}>
                <RefreshCw className="mr-2 h-4 w-4" />
                {isRefreshing ? "Refreshing…" : "Refresh Status"}
              </Button>
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Reload
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={isDisconnecting}
                  >
                    <Unplug className="mr-2 h-4 w-4" />
                    {isDisconnecting ? "Disconnecting…" : "Disconnect"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Disconnect Paysafe?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This only unlinks the application from this business in
                      our database. It does not delete the application at
                      Paysafe.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => disconnect()}>
                      Disconnect
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </AppCard>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AppCard
        header={
          <div className="flex items-center gap-3">
            <Link2 className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold">Connect Paysafe</h3>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Create a Paysafe merchant application using the{" "}
            <a
              className="underline"
              href="https://developer.paysafe.com/en/api-docs/applications-api/overview/"
              target="_blank"
              rel="noreferrer"
            >
              Applications API docs
            </a>
            . Required fields depend on region and business type, so we accept a
            raw JSON payload.
          </p>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <AlertCircle className="h-4 w-4" />
              <span>Paste the POST `/merchant/v1/applications` payload.</span>
            </div>
            <Textarea
              value={rawJson}
              onChange={(e) => setRawJson(e.target.value)}
              rows={10}
              className="font-mono"
              placeholder='{\n  "your": "payload"\n}'
            />
            {!parsedPayload && (
              <p className="text-sm text-destructive">Invalid JSON.</p>
            )}
          </div>

          <div className="pt-2">
            <Button onClick={() => connect()} disabled={isConnecting || !parsedPayload}>
              {isConnecting ? (
                "Creating…"
              ) : (
                <>
                  <Link2 className="mr-2 h-4 w-4" />
                  Create Paysafe Application
                </>
              )}
            </Button>
          </div>
        </div>
      </AppCard>
    </div>
  );
}

