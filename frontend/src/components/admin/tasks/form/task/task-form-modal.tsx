// External Libraries
import React, {
  type ReactNode,
  useMemo,
  useId,
  useTransition,
  useState,
  useEffect,
  useCallback,
} from "react";
// Custom Hooks
import { type FormInputs, useInput } from "@/hooks/use-input";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";

// Types
import type { TFormHandlerStore } from "@/stores";
import type { TCreateTaskData } from "@shared/interfaces/task.interface";
import type { ITask } from "@shared/interfaces/task.interface";
import { RecurrenceConfigDto } from "@shared/dtos";
import { EScheduleFrequency } from "@shared/enums/schedule.enum";
import { useFormContext } from "react-hook-form";

// Components
import { ModalForm } from "@/components/form-ui/modal-form";
import type { THandlerComponentProps } from "@/@types/handler-types";
import type {
  TCustomInputWrapper,
  TFieldConfigObject,
} from "@/@types/form/field-config.type";
import { SearchableInputWrapper } from "@/components/shared-ui/searchable-input-wrapper";
import { useSearchableUsers, useSearchableLocations, useSearchableDoors } from "@/hooks/use-searchable";
import type { UserDto } from "@shared/dtos";
import type { IDoor } from "@shared/interfaces/door.interface";
import type { ILocation } from "@shared/interfaces/location.interface";
import { getSelectedLocation } from "@/utils/location-storage";
import { Stepper } from "@/components/shared-ui/stepper";
import { TaskFormSteps } from "@/components/admin/tasks/components/task-form-steps";
import { TaskFormNavigation } from "@/components/admin/tasks/components/task-form-navigation";
import { TaskConfirmModal } from "@/components/admin/tasks/components/task-confirm-modal";

// Custom component - must be defined before early return
const AssignedToSelect = React.memo((props: any) => {
  const searchableUsers = useSearchableUsers({});
  const { t } = useI18n();
  return (
    <SearchableInputWrapper<UserDto>
      {...props}
      modal={true}
      useSearchable={() => searchableUsers}
      getLabel={(item) => {
        if (!item) return buildSentence(t, "select", "user");
        return `${item.firstName} ${item.lastName} (${item.email})`;
      }}
      getKey={(item) => item.id.toString()}
      getValue={(item) => {
        return {
          id: item.id,
          firstName: item.firstName,
          lastName: item.lastName,
          email: item.email,
        };
      }}
      shouldFilter={false}
    />
  );
});

const LocationSelect = React.memo((props: TCustomInputWrapper) => {
  const searchableLocations = useSearchableLocations({});
  const { t } = useI18n();
  const selectedLocation = getSelectedLocation();
  
  // Set default value if location is selected in localStorage
  React.useEffect(() => {
    if (selectedLocation && !props.value && props.onChange) {
      props.onChange({
        id: selectedLocation.id,
        name: selectedLocation.name,
      } as ILocation);
    }
  }, [selectedLocation, props.value, props.onChange]);

  return (
    <SearchableInputWrapper<ILocation>
      {...props}
      modal={true}
      useSearchable={() => searchableLocations}
      getLabel={(item) => {
        if (!item) return buildSentence(t, 'select', 'location');
        return `${item.name}${item.address ? ` - ${item.address}` : ''}`;
      }}
      getKey={(item) => item.id.toString()}
      getValue={(item) => {
        return {
          id: item.id,
          name: item.name,
          address: item.address,
        } as ILocation;
      }}
      shouldFilter={false}
      disabled={!!selectedLocation || props.disabled}
    />
  );
});

const DoorSelect = React.memo((props: TCustomInputWrapper) => {
  const { watch } = useFormContext();
  const location = watch('location');
  const locationId = location?.id;
  const searchableDoors = useSearchableDoors({ locationId: locationId || undefined });
  const { t } = useI18n();
  
  return (
    <SearchableInputWrapper<IDoor>
      {...props}
      modal={true}
      useSearchable={() => searchableDoors}
      getLabel={(item) => {
        if (!item) return buildSentence(t, 'select', 'door');
        return item.name || item.id;
      }}
      getKey={(item) => item.id.toString()}
      getValue={(item) => {
        return {
          id: item.id,
          name: item.name,
          description: item.description,
          locationId: item.locationId,
        } as IDoor;
      }}
      shouldFilter={false}
      disabled={!locationId}
    />
  );
});

export interface ITaskFormModalExtraProps {
  open: boolean;
  onClose: () => void;
}

interface ITaskFormModalProps
  extends THandlerComponentProps<
    TFormHandlerStore<TCreateTaskData, ITask, ITaskFormModalExtraProps>
  > {}

const TaskFormModal = React.memo(function TaskFormModal({
  storeKey,
  store,
}: ITaskFormModalProps) {
  // React 19: Essential IDs and transitions
  const componentId = useId();
  const [, startTransition] = useTransition();
  const { t } = useI18n();

  // Stepper state
  const [currentStep, setCurrentStep] = useState(1);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Always call hooks unconditionally
  const isEditing = store ? store((state) => state.isEditing) : false;
  const isSubmitting = store ? store((state) => state.isSubmitting) : false;
  const open = store ? store((state) => state.extra.open) : false;
  const onClose = store ? store((state) => state.extra.onClose) : () => {};
  const storeFields = store ? store((state) => state.fields) : {};

  const oldTaskValues = store ? store((state) => state.values) : null;

  // Reset stepper when modal opens/closes
  useEffect(() => {
    if (open) {
      setCurrentStep(1);
      setShowConfirmModal(false);
    }
  }, [open]);

  // React 19: Memoized fields for better performance
  const fields = useMemo(
    () =>
      ({
        ...(storeFields as TFieldConfigObject<TCreateTaskData>),
        title: {
          ...(storeFields as TFieldConfigObject<TCreateTaskData>).title,
          label: buildSentence(t, "title"),
        },
        description: {
          ...(storeFields as TFieldConfigObject<TCreateTaskData>).description,
          label: buildSentence(t, "description"),
        },
        status: {
          ...(storeFields as TFieldConfigObject<TCreateTaskData>).status,
          label: buildSentence(t, "status"),
        },
        priority: {
          ...(storeFields as TFieldConfigObject<TCreateTaskData>).priority,
          label: buildSentence(t, "priority"),
        },
        startDateTime: {
          ...(storeFields as TFieldConfigObject<TCreateTaskData>).startDateTime,
          label: buildSentence(t, "start", "date", "and", "time"),
        },
        dueDate: {
          ...(storeFields as TFieldConfigObject<TCreateTaskData>).dueDate,
          label: buildSentence(t, "due", "date"),
        },
        assignedTo: {
          ...(storeFields as TFieldConfigObject<TCreateTaskData>).assignedTo,
          type: "custom" as const,
          label: buildSentence(t, "assigned", "to"),
          Component: AssignedToSelect,
        },
        location: {
          ...(storeFields as TFieldConfigObject<TCreateTaskData>).location,
          type: "custom" as const,
          Component: LocationSelect,
          label: buildSentence(t, 'location'),
          disabled: !!getSelectedLocation(),
        },
        door: {
          ...(storeFields as TFieldConfigObject<TCreateTaskData>).door,
          type: "custom" as const,
          Component: DoorSelect,
          label: buildSentence(t, 'door'),
        },
        tags: {
          ...(storeFields as TFieldConfigObject<TCreateTaskData>).tags,
          label: buildSentence(t, "tags"),
        },
        recurrenceEndDate: {
          ...(storeFields as TFieldConfigObject<TCreateTaskData>).recurrenceEndDate,
          visible: (ctx: { values: Record<string, unknown> }) =>
            ctx.values.enableRecurrence,
          label: buildSentence(t, "end", "date"),
        },
        enableRecurrence: {
          ...(storeFields as TFieldConfigObject<TCreateTaskData>).enableRecurrence,
          label: buildSentence(t, "enable", "recurrence"),
        },
        recurrenceConfig: {
          ...(storeFields as any).recurrenceConfig,
          subFields: {
            frequency: {
              ...(storeFields as any).recurrenceConfig.subFields.frequency,
              label: buildSentence(t, "frequency"),
            },
            weekDays: {
              ...(storeFields as any).recurrenceConfig.subFields.weekDays,
              label: buildSentence(t, "week", "days"),
            },
            monthDays: {
              ...(storeFields as any).recurrenceConfig.subFields.monthDays,
              label: buildSentence(t, "month", "days"),
            },
          },
          visible: (ctx: { values: Record<string, unknown> }) =>
            ctx.values.enableRecurrence,
          renderItem: (items: RecurrenceConfigDto) => {
            // Create a wrapper component that watches the frequency
            const RecurrenceConfigWrapper = () => {
              const { watch } = useFormContext<TCreateTaskData>();
              const frequency = watch("recurrenceConfig.frequency");
              const isWeekly = frequency === EScheduleFrequency.WEEKLY;
              const isMonthly = frequency === EScheduleFrequency.MONTHLY;

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {items.frequency as ReactNode}
                  {isWeekly && (items.weekDays as ReactNode)}
                  {isMonthly && (items.monthDays as ReactNode)}
                </div>
              );
            };
            return <RecurrenceConfigWrapper />;
          },
          label: buildSentence(t, "recurrence", "config"),
        },
      } as TFieldConfigObject<TCreateTaskData>),
    [storeFields, t]
  );

  const inputs = useInput<TCreateTaskData>({
    fields,
    showRequiredAsterisk: true,
  }) as FormInputs<TCreateTaskData>;

  // Navigation handlers
  const handlePrevious = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  const handleNext = useCallback((step: number) => {
    setCurrentStep(step);
  }, []);

  const handleConfirm = useCallback(() => {
    setShowConfirmModal(true);
  }, []);

  // React 19: Smooth modal state changes
  const onOpenChange = useCallback((state: boolean) => {
    if (state === false) {
      startTransition(() => {
        onClose();
      });
    }
  }, [onClose, startTransition]);

  // Early return check - must be after all hooks
  if (!store) {
    return (
      <div>
        {buildSentence(t, "form", "store")} "{storeKey}"{" "}
        {buildSentence(t, "not", "found")}.{" "}
        {buildSentence(t, "did", "you", "forget", "to", "register", "it")}?
      </div>
    );
  }

  return (
    <>
      <ModalForm<TCreateTaskData, ITask, ITaskFormModalExtraProps>
        title={buildSentence(t, isEditing ? "edit" : "add", "task")}
        description={buildSentence(t, isEditing ? "update" : "add", "a", "new", "task")}
        open={open}
        onOpenChange={onOpenChange}
        formStore={store}
        footerContent={
          <TaskFormNavigation
            currentStep={currentStep}
            isEditing={isEditing}
            isSubmitting={isSubmitting}
            onPrevious={handlePrevious}
            onNext={handleNext}
            onClose={onClose}
            onConfirm={handleConfirm}
            componentId={componentId}
            oldValues={oldTaskValues}
          />
        }
        width="5xl"
      >
        <div className="mb-6">
          <Stepper
            currentStep={currentStep}
            steps={[
              {
                label: buildSentence(t, "general", "information"),
                description: buildSentence(t, "title", "status", "description", "priority"),
              },
              {
                label: buildSentence(t, "assignment"),
                description: buildSentence(t, "assign", "user", "and", "tags"),
              },
              {
                label: buildSentence(t, "date", "and", "time"),
                description: buildSentence(t, "start", "date", "due", "date", "and", "recurrence"),
              },
            ]}
          />
        </div>

        <TaskFormSteps
          currentStep={currentStep}
          inputs={inputs}
          isEditing={isEditing}
        />
        <button type="submit" id="task-form-submit-button" hidden>
          Submit
        </button>
      </ModalForm>

      {/* Confirmation Modal - Must be inside Form context */}
      <TaskConfirmModal
        open={showConfirmModal}
        isEditing={isEditing}
        onOpenChange={setShowConfirmModal}
        isSubmitting={isSubmitting}
        onConfirm={() => {
          const button = document.querySelector(
            "#task-form-submit-button"
          ) as HTMLButtonElement;

          if (button) {
            button.click();
          }

          setShowConfirmModal(false);
        }}
      />
    </>
  );
});

export default TaskFormModal;

