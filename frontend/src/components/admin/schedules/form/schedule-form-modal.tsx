// External Libraries
import React, { useId, useMemo, useTransition } from "react";
import { Loader2 } from "lucide-react";

// Custom Hooks
import { type FormInputs, useInput } from "@/hooks/use-input";

// Types
import type { TFormHandlerStore } from "@/stores";
import type { THandlerComponentProps } from "@/@types/handler-types";
import type { IMessageResponse } from "@shared/interfaces/api/response.interface";

// Components
import { Button } from "@/components/ui/button";
import { ModalForm } from "@/components/form-ui/modal-form";
import type { TScheduleData } from "@shared/types";

export interface IScheduleFormModalExtraProps {
  open: boolean;
  onClose: () => void;
}

interface IScheduleFormModalProps extends THandlerComponentProps<TFormHandlerStore<TScheduleData, IMessageResponse, IScheduleFormModalExtraProps>> { }

export const ScheduleFormModal = React.memo(function ScheduleFormModal({
  storeKey,
  store,
}: IScheduleFormModalProps) {
  // React 19: Essential IDs and transitions
  const componentId = useId();
  const [, startTransition] = useTransition();

  if (!store) {
    return `Form store "${storeKey}" not found. Did you forget to register it?`;
  }

  const open = store((state) => state.extra.open);
  const onClose = store((state) => state.extra.onClose);
  
  // React 19: Memoized fields for better performance
  const fields = useMemo(() => store((state) => state.fields), [store]);
  const isEditing = store((state) => state.isEditing);

  const inputs = useInput<TScheduleData>({
    fields,
    showRequiredAsterisk: true,
  }) as FormInputs<TScheduleData>;

  // React 19: Smooth modal state changes
  const onOpenChange = (state: boolean) => {
    if (state === false) {
      startTransition(() => {
        onClose();
      });
    }
  };

  // React 19: Memoized form buttons for better performance
  const formButtons = useMemo(() => (
    <div className="flex justify-end gap-2">
      <Button
        type="button"
        variant="outline"
        onClick={(e) => {
          e.preventDefault();
          startTransition(() => {
            onClose();
          });
        }}
        data-component-id={componentId}
      >
        Cancel
      </Button>
      <Button type="submit" disabled={false} data-component-id={componentId}>
        {false && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isEditing ? "Update Schedule" : "Create Schedule"}
      </Button>
    </div>
  ), [componentId, isEditing, onClose]);

  return (
    <ModalForm<TScheduleData, IMessageResponse, IScheduleFormModalExtraProps>
      title={isEditing ? "Edit Schedule" : "Create Schedule"}
      description={isEditing ? "Update schedule configuration" : "Create a new schedule"}
      open={open}
      onOpenChange={onOpenChange}
      formStore={store}
      footerContent={formButtons}
      width="3xl"
    >
      <div className="space-y-6">
        {/* Basic Info */}
        <div>
          <h3 className="text-sm font-semibold mb-3">Basic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {inputs.title}
            {inputs.action}
            {inputs.entityId}
          </div>
        </div>

        {/* Schedule Configuration */}
        <div>
          <h3 className="text-sm font-semibold mb-3">Schedule Configuration</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {inputs.frequency}
            {inputs.startDate as React.ReactNode}
            {inputs.endDate}
          </div>
        </div>

        {/* Time Configuration */}
        <div>
          <h3 className="text-sm font-semibold mb-3">Time Configuration</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {inputs.timeOfDay}
            {inputs.endTime}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {inputs.intervalValue}
            {inputs.intervalUnit}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            * If interval is set, schedule will run every X minutes/hours from timeOfDay to endTime
          </p>
        </div>

        {/* Frequency-Specific Fields */}
        <div>
          <h3 className="text-sm font-semibold mb-3">Frequency Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {inputs.weekDays}
            {inputs.monthDays}
            {inputs.months}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            * WEEKLY: Select weekDays | MONTHLY: Select monthDays | YEARLY: Select months (+ monthDays if specific days)
          </p>
        </div>

        {/* Additional Data */}
        <div>
          <h3 className="text-sm font-semibold mb-3">Additional Data (JSON)</h3>
          <div className="grid grid-cols-1 gap-4">
            {inputs.data}
          </div>
        </div>

        {/* Retry Configuration */}
        <div>
          <h3 className="text-sm font-semibold mb-3">Retry Configuration</h3>
          <div className="grid grid-cols-1 gap-4">
            {inputs.retryOnFailure}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {inputs.maxRetries}
            {inputs.retryDelayMinutes}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            * Enable retry on failure to automatically retry failed executions
          </p>
        </div>

      </div>
    </ModalForm>
  );
});


