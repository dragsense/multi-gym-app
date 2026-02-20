// External Libraries
import { useId, useTransition, useRef, useEffect } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { useShallow } from "zustand/shallow";
import { Loader2 } from "lucide-react";
import type { IAutomation } from "@shared/interfaces/automation.interface";
import type { TSingleHandlerStore } from "@/stores";
import type { THandlerComponentProps } from "@/@types/handler-types";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";
import { toast } from "sonner";
import { EAutomationStatus } from "@shared/enums";
import { toggleAutomationStatus, fetchAutomation } from "@/services/automation.api";

interface IAutomationStatusUpdateProps extends THandlerComponentProps<TSingleHandlerStore<IAutomation, any>> {}

export default function AutomationStatusUpdate({ storeKey, store }: IAutomationStatusUpdateProps) {
  const componentId = useId();
  const [, startTransition] = useTransition();
  const queryClient = useQueryClient();
  const { t } = useI18n();
  
  // Track processed actions to prevent duplicate requests
  const processedActionRef = useRef<string | null>(null);
  const isProcessingRef = useRef(false);

  if (!store) {
    return null;
  }

  const { action, payload, response, setAction, reset } = store(
    useShallow((state) => ({
      action: state.action,
      payload: state.payload,
      response: state.response,
      setAction: state.setAction,
      reset: state.reset,
    }))
  );

  const mutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: EAutomationStatus }) => {
      return toggleAutomationStatus(id, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [storeKey] });
      queryClient.invalidateQueries({ queryKey: [storeKey + "-list"] });
      toast.success(buildSentence(t, "automation", "status", "updated", "successfully"));
      
      // Reset processing flags
      isProcessingRef.current = false;
      processedActionRef.current = null;
      
      startTransition(() => {
        reset();
        setAction("none");
      });
    },
    onError: (error: any) => {
      toast.error(
        error?.message || buildSentence(t, "failed", "to", "update", "automation", "status"),
      );
      
      // Reset processing flags
      isProcessingRef.current = false;
      processedActionRef.current = null;
      
      startTransition(() => {
        reset();
        setAction("none");
      });
    },
  });

  // Process toggleStatus action only once per unique action+payload combination
  useEffect(() => {
    // Only process if:
    // 1. Action is toggleStatus
    // 2. Payload exists and is a string
    // 3. Not already processing
    // 4. This specific action hasn't been processed yet
    const actionKey = action === "toggleStatus" && payload ? `${action}-${payload}` : null;
    
    if (
      action === "toggleStatus" && 
      payload && 
      typeof payload === "string" && 
      !mutation.isPending &&
      !isProcessingRef.current &&
      processedActionRef.current !== actionKey
    ) {
      // Mark as processing
      isProcessingRef.current = true;
      processedActionRef.current = actionKey || null;

      // Try to use response from store first (if available and matches payload)
      const automationFromStore = response?.id === payload ? response : null;
      
      if (automationFromStore && automationFromStore.status !== undefined) {
        // Use automation from store - no need to fetch
        const newStatus = automationFromStore.status === EAutomationStatus.ACTIVE
          ? EAutomationStatus.INACTIVE
          : EAutomationStatus.ACTIVE;
        
        mutation.mutate({ id: payload, status: newStatus });
      } else {
        // Fetch the automation to get current status
        fetchAutomation(payload, { _relations: 'emailTemplate' })
          .then((automation) => {
            if (automation && !mutation.isPending) {
              // Determine new status (toggle)
              const newStatus = automation.status === EAutomationStatus.ACTIVE
                ? EAutomationStatus.INACTIVE
                : EAutomationStatus.ACTIVE;
              
              // Update status
              mutation.mutate({ id: payload, status: newStatus });
            } else {
              // Reset if mutation already completed
              isProcessingRef.current = false;
              processedActionRef.current = null;
            }
          })
          .catch((error) => {
            toast.error(
              error?.message || buildSentence(t, "failed", "to", "load", "automation"),
            );
            
            // Reset processing flags
            isProcessingRef.current = false;
            processedActionRef.current = null;
            
            startTransition(() => {
              reset();
              setAction("none");
            });
          });
      }
    }
    
    // Reset processing flag when action changes away from toggleStatus
    if (action !== "toggleStatus") {
      isProcessingRef.current = false;
      if (action === "none") {
        processedActionRef.current = null;
      }
    }
  }, [action, payload, response, mutation, reset, setAction, startTransition, t, storeKey]);

  // Show loading indicator while processing
  if (action === "toggleStatus" && (mutation.isPending || isProcessingRef.current)) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" data-component-id={componentId}>
        <div className="bg-white rounded-lg p-6 flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>{buildSentence(t, "updating", "automation", "status")}...</span>
        </div>
      </div>
    );
  }

  return null;
}
