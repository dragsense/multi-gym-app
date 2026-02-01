import { useQueryClient } from "@tanstack/react-query";
import { useTransition, useId } from "react";

// Types
import type { ICamera } from '@shared/interfaces/camera.interface';
import type { THandlerComponentProps } from "@/@types/handler-types";
import type { TSingleHandlerStore } from "@/stores";

// Components
import { AppDialog } from "@/components/layout-ui/app-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

// Services
import { updateCameraStatus } from "@/services/camera.api";

// Hooks
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";
import { useShallow } from "zustand/react/shallow";
import type { ISingleHandlerState } from "@/stores";
import { useState } from "react";

type ICameraUpdateStatusProps = THandlerComponentProps<
  TSingleHandlerStore<ICamera, any>
>;

export default function CameraUpdateStatus({
  storeKey,
  store,
}: ICameraUpdateStatusProps) {
  const componentId = useId();
  const [, startTransition] = useTransition();
  const queryClient = useQueryClient();
  const { t } = useI18n();

  if (!store) {
    return null;
  }

  const selector = useShallow(
    (state: ISingleHandlerState<ICamera, any>) => ({
      response: state.response,
      action: state.action,
      setAction: state.setAction,
      reset: state.reset,
    })
  );

  const storeState = store(selector);
  const camera = storeState?.response;
  const action = storeState?.action;
  const setAction = storeState?.setAction;
  const reset = storeState?.reset;

  const [isActive, setIsActive] = useState(camera?.isActive ?? false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!storeState || action !== 'updateStatus' || !camera) {
    return null;
  }

  const handleClose = () => {
    startTransition(() => {
      reset?.();
    });
  };

  const handleUpdateStatus = async () => {
    setIsSubmitting(true);
    try {
      await updateCameraStatus(camera.id)({ isActive });
      startTransition(() => {
        queryClient.invalidateQueries({ queryKey: [storeKey + "-list"] });
        queryClient.invalidateQueries({ queryKey: [storeKey] });
        handleClose();
      });
    } catch (error) {
      console.error('Failed to update camera status:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={action === 'updateStatus'} onOpenChange={handleClose} data-component-id={componentId}>
      <DialogContent>
        <AppDialog
          title={buildSentence(t, "update", "camera", "status")}
          description={buildSentence(t, "change", "the", "active", "status", "of", "this", "camera")}
        >
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {buildSentence(t, "camera")}: <strong>{camera.name}</strong>
            </p>
            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={isActive}
                onCheckedChange={setIsActive}
                disabled={isSubmitting}
              />
              <Label htmlFor="isActive">
                {isActive ? buildSentence(t, "active") : buildSentence(t, "inactive")}
              </Label>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
                {buildSentence(t, "cancel")}
              </Button>
              <Button onClick={handleUpdateStatus} disabled={isSubmitting}>
                {buildSentence(t, "update")}
              </Button>
            </div>
          </div>
        </AppDialog>
      </DialogContent>
    </Dialog>
  );
}
