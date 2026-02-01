// External Libraries
import { useCallback, useMemo, useId, useTransition, useDeferredValue } from "react";
import { useShallow } from 'zustand/shallow';
import { Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

// Types
import { type TListHandlerComponentProps } from "@/@types/handler-types";
import type { IWorker } from '@shared/interfaces';

// Store
import { type TListHandlerStore } from "@/stores";

// Components
import { AppDialog } from '@/components/layout-ui/app-dialog';
import { Button } from "@/components/ui/button";
import { pauseWorker } from '@/services/worker.api';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface IPauseWorkerProps extends TListHandlerComponentProps<TListHandlerStore<IWorker, any, any>> { }

export default function PauseWorker({
  storeKey,
  store
}: IPauseWorkerProps) {
  // React 19: Essential IDs and transitions
  const componentId = useId();
  const [isPending, startTransition] = useTransition();

  const queryClient = useQueryClient();

  if (!store) {
    return <div>List store "{storeKey}" not found. Did you forget to register it?</div>;
  }

  const { action, setAction, payload } = store(useShallow(state => ({
    action: state.action,
    setAction: state.setAction,
    payload: state.payload,
  })));

  // React 19: Deferred payload for performance
  const deferredPayload = useDeferredValue(payload);

  // React 19: Enhanced async handler with transitions
  const handlePause = useCallback(async () => {
    startTransition(async () => {
      try {
        await pauseWorker(deferredPayload);
        queryClient.invalidateQueries({ queryKey: [`${storeKey}-list`] });
        setAction('none');
      } catch (error) {
        console.error('Failed to pause worker:', error);
      }
    });
  }, [deferredPayload, queryClient, storeKey, setAction, startTransition]);

  // React 19: Enhanced dialog props with transitions
  const dialogProps = useMemo(() => ({
    open: action === 'pauseWorker',
    onOpenChange: (state: boolean) => {
      startTransition(() => {
        if (!state) {
          setAction('none');
        }
      });
    }
  }), [action, setAction, startTransition]);

  return (
    <Dialog data-component-id={componentId} {...dialogProps}>
      <DialogContent>
        <AppDialog
          title="Pause Worker"
          description={`Are you sure you want to pause the worker "${deferredPayload}"? This will stop processing tasks.`}
        >
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => startTransition(() => setAction('none'))}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handlePause}
              disabled={isPending}
            >
              {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Pause Worker
            </Button>
          </div>
        </AppDialog>
      </DialogContent>
    </Dialog>
  );
}
