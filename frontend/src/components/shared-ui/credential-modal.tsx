import { Button } from "@/components/ui/button";
import { Copy, Check, X } from "lucide-react";
import { useState, useId, useMemo, useTransition } from "react";
import { AppDialog } from "@/components/layout-ui/app-dialog";
import { toast } from "sonner";
import { Dialog, DialogContent } from "@/components/ui/dialog";

type CredentialModalProps = {
  open: boolean;
  onOpenChange: (state: boolean) => void;
  closeModal: () => void;
  email: string;
  password: string;
};

export function CredentialModal({
  open,
  onOpenChange,
  closeModal,
  email,
  password,
}: CredentialModalProps) {
  // React 19: Essential IDs and transitions
  const componentId = useId();
  const [, startTransition] = useTransition();
  
  const [copied, setCopied] = useState(false);
  const rootUrl = window.location.origin;
  const loginUrl = `${rootUrl}/login`;

  // React 19: Memoized credentials text for better performance
  const credentialsText = useMemo(() => 
    `Account Details\n\nEmail: ${email}\nPassword: ${password}\n\nLogin URL: ${loginUrl}`,
    [email, password, loginUrl]
  );

  // React 19: Smooth copy operation
  const copyAllCredentials = () => {
    startTransition(() => {
      navigator.clipboard.writeText(credentialsText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("All credentials copied to clipboard");
    });
  };

  return (
    <Dialog open={open}
      onOpenChange={onOpenChange}>
      <DialogContent data-component-id={componentId}>
        <AppDialog
          title="Customer Account Created"
          description="Credentials have been sent to the user's email."

        >
          <div className="space-y-6">
            <div className="border rounded-lg p-4 bg-muted/50 relative">
              <div className="absolute top-3 right-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={copyAllCredentials}
                >
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-1">Login Credentials</h4>
                  <p className="text-sm text-muted-foreground">
                    Share these details securely with the customer
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-muted-foreground">Email</label>
                    <div className="p-2 bg-background rounded-md border font-mono text-sm">
                      {email}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-muted-foreground">Password</label>
                    <div className="p-2 bg-background rounded-md border font-mono text-sm">
                      {password}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-muted-foreground">Login URL</label>
                    <div className="p-2 bg-background rounded-md border font-mono text-sm">
                      {loginUrl}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between gap-2">
              <Button variant="outline" onClick={closeModal}>
                Close
              </Button>
              <Button
                onClick={() => {
                  startTransition(() => {
                    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(credentialsText)}`;
                    window.open(whatsappUrl, "_blank");
                  });
                }}
              >
                Share via WhatsApp
              </Button>
            </div>
          </div>
        </AppDialog>
      </DialogContent>
    </Dialog>

  );
}