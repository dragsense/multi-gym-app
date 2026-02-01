import { useNavigate } from "react-router-dom";
import { Lock, ArrowLeftRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppCard } from "@/components/layout-ui/app-card";
import { ROOT_ROUTE } from "@/config/routes.config";

export default function UnauthorizedPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50 p-6">
      <div className="w-full max-w-xl">
        <AppCard
          header={
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-muted/20 flex items-center justify-center">
                <Lock className="w-6 h-6 text-muted-foreground" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold">Access denied</h2>
                <p className="text-sm text-muted-foreground">
                  You don’t have permission to view this page.
                </p>
              </div>
            </div>
          }
          footer={
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-2 w-full">
              <Button
                onClick={() => navigate(-1)}
                className="flex-1 sm:flex-initial"
              >
                <ArrowLeftRight className="mr-2 h-4 w-4" />
                Go back
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate(ROOT_ROUTE)}
                className="flex-1 sm:flex-initial"
              >
                Return to home
              </Button>
            </div>
          }
        >
          <p className="text-sm text-muted-foreground">
            This resource is restricted. If you think this is a mistake, contact an admin or sign in with an account that has the necessary access.
          </p>
          <div className="pt-4 border-t border-muted/30 mt-4">
            <p className="text-xs text-muted-foreground">
              Need help? <span className="font-medium">Contact support</span> or check your account settings.
            </p>
          </div>
        </AppCard>
      </div>
    </div>
  );
}
