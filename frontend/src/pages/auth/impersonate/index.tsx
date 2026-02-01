// React & Hooks
import { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

// Services
import { validateImpersonation } from "@/services/auth.api";

// UI Components
import { AppCard } from "@/components/layout-ui/app-card";
import { Loader2, ShieldCheck, ShieldX } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ImpersonatePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const hasValidatedRef = useRef(false);

  useEffect(() => {
    const token = searchParams.get("token");
    
    // Prevent multiple calls - check if already validated
    if (hasValidatedRef.current) {
      return;
    }
    
    if (!token) {
      setStatus("error");
      setErrorMessage("No impersonation token provided");
      return;
    }

    // Mark as validated immediately to prevent duplicate calls
    hasValidatedRef.current = true;

    const validateToken = async () => {
      try {
        const response = await validateImpersonation(token);
        
        if (response.accessToken?.token) {
          queryClient.invalidateQueries({ queryKey: ["me"] });
          setStatus("success");
        } else {
          throw new Error("Failed to authenticate");
        }
      } catch (error: any) {
        setStatus("error");
        setErrorMessage(error?.message || "Invalid or expired impersonation token");
        toast.error("Authentication failed");
        // Reset ref on error so user can retry if needed
        hasValidatedRef.current = false;
      }
    };

    validateToken();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const renderHeader = () => (
    <div className="text-center">
      <div className="mx-auto mb-4">
        {status === "loading" && (
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        )}
        {status === "success" && (
          <ShieldCheck className="h-12 w-12 text-green-500" />
        )}
        {status === "error" && (
          <ShieldX className="h-12 w-12 text-destructive" />
        )}
      </div>
      <h2 className="text-xl font-semibold">
        {status === "loading" && "Authenticating..."}
        {status === "success" && "Authentication Successful"}
        {status === "error" && "Authentication Failed"}
      </h2>
      <p className="text-sm text-muted-foreground mt-2">
        {status === "loading" && "Please wait while we verify your credentials"}
        {status === "success" && "Redirecting to dashboard..."}
        {status === "error" && errorMessage}
      </p>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <AppCard 
        className="w-full max-w-md"
        header={renderHeader()}
      >
        {status === "error" && (
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              The impersonation link may have expired or is invalid.
            </p>
            <Button
              variant="outline"
              onClick={() => window.close()}
              className="text-primary hover:underline text-sm"
            >
              Close this window
            </Button>
          </div>
        )}
        {status !== "error" && <div />}
      </AppCard>
    </div>
  );
}
