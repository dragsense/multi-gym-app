// External Libraries
import React, { useMemo, useId, useTransition } from "react";
import { Loader2, Plus, X } from "lucide-react";

// Types
import type { TFormHandlerStore } from "@/stores";
import type { TUpdateUserAvailabilityData, TUserAvailabilityData } from "@shared/types/user-availability.type";
import type { IUserAvailability } from "@shared/interfaces/user-availability.interface";

// Components
import { Button } from "@/components/ui/button";
import { ModalForm } from "@/components/form-ui/modal-form";
import type { THandlerComponentProps } from "@/@types/handler-types";
import type { FormInputs } from "@/hooks/use-input";
import { useInput } from "@/hooks/use-input";
import type { IMessageResponse } from "@shared/interfaces";
import type { TFieldConfigObject } from "@/@types/form/field-config.type";
import type { DayScheduleDto, TimeSlotDto } from "@shared/dtos/user-availability-dtos/user-availability.dto";

export interface IUserAvailabilityFormModalExtraProps {
  open: boolean;
  onClose: () => void;
}

interface IUserAvailabilityFormModalProps extends THandlerComponentProps<TFormHandlerStore<TUserAvailabilityData, IMessageResponse, IUserAvailabilityFormModalExtraProps>> {
}

const UserAvailabilityFormModal = React.memo(function UserAvailabilityFormModal({
  storeKey,
  store,
}: IUserAvailabilityFormModalProps) {
  // React 19: Essential IDs and transitions
  const componentId = useId();
  const [, startTransition] = useTransition();

  if (!store) {
    return `Form store "${storeKey}" not found. Did you forget to register it?`;
  }

  const isEditing = store((state) => state.isEditing)
  const open = store((state) => state.extra.open)
  const onClose = store((state) => state.extra.onClose)

  // React 19: Memoized fields for better performance
  const storeFields = store((state) => state.fields);

  // Helper function to create time slot buttons for all days
  const createTimeSlot = (dayFields: DayScheduleDto, day: string) => ({
    ...dayFields,
    subFields: {
      ...dayFields.subFields,
      timeSlots: {
        ...dayFields.subFields?.timeSlots,
        type: 'nestedArray' as const,
        className: "space-y-2",
        visible: (ctx: { values: TUserAvailabilityData }) => ctx.values.weeklySchedule?.[day]?.enabled,
        AddButton: ({ onClick }: { onClick: () => void }) => <Button type="button" onClick={onClick}><Plus /></Button>,
        RemoveButton: ({ onClick, index }: { onClick: () => void, index: number }) => <Button type="button" onClick={() => onClick(index)}><X /></Button>,
      }
    }
  });

  const fields = useMemo(() => ({
    ...storeFields,
    weeklySchedule: {
      ...storeFields.weeklySchedule,
      className: "space-y-4",
      subFields: {
        ...storeFields.weeklySchedule.subFields,
        monday: createTimeSlot(storeFields.weeklySchedule.subFields?.monday, 'monday'),
        tuesday: createTimeSlot(storeFields.weeklySchedule.subFields?.tuesday, 'tuesday'),
        wednesday: createTimeSlot(storeFields.weeklySchedule.subFields?.wednesday, 'wednesday'),
        thursday: createTimeSlot(storeFields.weeklySchedule.subFields?.thursday, 'thursday'),
        friday: createTimeSlot(storeFields.weeklySchedule.subFields?.friday, 'friday'),
        saturday: createTimeSlot(storeFields.weeklySchedule.subFields?.saturday, 'saturday'),
        sunday: createTimeSlot(storeFields.weeklySchedule.subFields?.sunday, 'sunday'),
      }
    },
    unavailablePeriods: {
      ...storeFields.unavailablePeriods,
      type: 'nestedArray' as const,
      AddButton: ({ onClick }: { onClick: () => void }) => <Button type="button" onClick={onClick}><Plus /></Button>,
      RemoveButton: ({ onClick, index }: { onClick: () => void, index: number }) => <Button type="button" onClick={() => onClick(index)}><X /></Button>,
      subFields: {
        ...storeFields.unavailablePeriods.subFields,
      }
    }
  } as TFieldConfigObject<TUserAvailabilityData>), [storeFields]);

  const inputs = useInput<TUserAvailabilityData>({
    fields,
    showRequiredAsterisk: true,
  }) as FormInputs<TUserAvailabilityData>;

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
        {isEditing ? "Update" : "Add"}
      </Button>
    </div>
  ), [componentId, isEditing, onClose]);

  return (
    <ModalForm<TUserAvailabilityData, IMessageResponse, IUserAvailabilityFormModalExtraProps>
      title={`${isEditing ? "Edit" : "Add"} User Availability`}
      description={`${isEditing ? "Edit" : "Add a new"} User Availability`}
      open={open}
      onOpenChange={onOpenChange}
      formStore={store}
      footerContent={formButtons}
      width="3xl"
    >
      <div className="space-y-8">
        {/* Weekly Schedule */}

        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            {inputs.weeklySchedule as React.ReactNode}
          </div>
        </div>


        {/* Unavailable Periods */}

        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            {inputs.unavailablePeriods as React.ReactNode}
          </div>
        </div>

      </div>
    </ModalForm>
  );
});

export default UserAvailabilityFormModal;