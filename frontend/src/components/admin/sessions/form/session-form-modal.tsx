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

// Types
import type { TFormHandlerStore } from "@/stores";
import type {
  TSessionData,
  TUpdateSessionData,
} from "@shared/types/session.type";
import type { ISessionResponse } from "@shared/interfaces/session.interface";

// Components
import { ModalForm } from "@/components/form-ui/modal-form";
import type { THandlerComponentProps } from "@/@types/handler-types";
import { SearchableInputWrapper } from "@/components/shared-ui/searchable-input-wrapper";
import type {
  TCustomInputWrapper,
  TFieldConfigObject,
} from "@/@types/form/field-config.type";
import type { MemberDto, StaffDto } from "@shared/dtos";
import type { ILocation } from "@shared/interfaces/location.interface";
import type { ReminderDto } from "@shared/dtos/reminder-dtos";
import type { RecurrenceConfigDto } from "@shared/dtos/recurrence-dtos";
import {
  useSearchableMembers,
  useSearchableTrainers,
  useSearchableLocations,
} from "@/hooks/use-searchable";
import type { ServiceOfferDto } from "@shared/dtos/service-offer-dtos";
import { useAuthUser } from "@/hooks/use-auth-user";
import { useUserSettings } from "@/hooks/use-user-settings";
import { EUserLevels } from "@shared/enums";
import { EScheduleFrequency } from "@shared/enums/schedule.enum";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";
import { Stepper } from "@/components/shared-ui/stepper";
import { SessionDateTimePicker } from "../components/session-datetime-picker";
import { SessionConfirmModal } from "../components/session-confirm-modal";
import { SessionFormSteps } from "../components/session-form-steps";
import { SessionFormNavigation } from "../components/session-form-navigation";
import { SessionUpdateScopeModal } from "../components/session-update-scope-modal";
import { SessionRescheduleReasonModal } from "../components/session-reschedule-reason-modal";
import { useFormContext } from "react-hook-form";
import { EUpdateSessionScope } from "@shared/enums/session.enum";
import { ServiceOfferListSelector } from "../components/service-offer-list-selector";
import type { IServiceOffer } from "@shared/interfaces/service-offer.interface";
import { getSelectedLocation } from "@/utils/location-storage";

// Custom components - must be defined before early return
const TrainerSelect = React.memo((props: TCustomInputWrapper) => {
  const searchableTrainers = useSearchableTrainers({});
  return (
    <SearchableInputWrapper<StaffDto>
      {...props}
      modal={true}
      useSearchable={() => searchableTrainers}
      getLabel={(item) => {
        if (!item?.user?.firstName) return null;
        return `${item.user?.firstName} ${item.user?.lastName} (${item.user?.email})`;
      }}
      getKey={(item) => item.id.toString()}
      getValue={(item) => {
        return { id: item.id, user: item.user };
      }}
      shouldFilter={false}
    />
  );
});

const MembersSelect = React.memo((props: TCustomInputWrapper) => {
  const searchableMembers = useSearchableMembers({});
  return (
    <SearchableInputWrapper<MemberDto>
      {...props}
      modal={true}
      useSearchable={() => searchableMembers}
      getLabel={(item) => {
        if (!item?.user?.firstName) return null;

        return `${item.user?.firstName} ${item.user?.lastName} (${item.user?.email})`;
      }}
      getKey={(item) => item.id.toString()}
      getValue={(item) => {
        return { id: item.id, user: item.user };
      }}
      shouldFilter={false}
      multiple={true}
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

// SessionDateTimeSelect component
const SessionDateTimeSelect = React.memo((props: TCustomInputWrapper) => {
  return <SessionDateTimePicker {...props} />;
});

// ServiceOfferSelect component
const ServiceOfferSelect = React.memo((props: TCustomInputWrapper) => {
  const { setValue, watch } = useFormContext<TSessionData | TUpdateSessionData>();
  
  const handleServiceOfferChange = (value: IServiceOffer | null) => {
    props.onChange(value);
    
    // Set duration to 60 if service offer is selected and duration is not set
    if (value && !watch("duration")) {
      setValue("duration", 60, { shouldValidate: false });
    }
  };
  
  return (
    <ServiceOfferListSelector
      value={(props.value as IServiceOffer) || null}
      onChange={handleServiceOfferChange}
      disabled={props.disabled}
    />
  );
});

import type { IMember } from "@shared/interfaces/member.interface";
import type { IStaff } from "@shared/interfaces/staff.interface";

export interface ISessionFormModalExtraProps {
  open: boolean;
  onClose: () => void;
  member?: IMember;
  trainer?: IStaff;
}

interface ISessionFormModalProps
  extends THandlerComponentProps<
    TFormHandlerStore<
      TSessionData | TUpdateSessionData,
      ISessionResponse,
      ISessionFormModalExtraProps
    >
  > {}

const SessionFormModal = React.memo(function SessionFormModal({
  storeKey,
  store,
}: ISessionFormModalProps) {
  // React 19: Essential IDs and transitions
  const componentId = useId();
  const [, startTransition] = useTransition();

  const { user } = useAuthUser();
  const { settings } = useUserSettings();
  const { t } = useI18n();

  // Stepper state
  const [currentStep, setCurrentStep] = useState(1);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showUpdateScopeModal, setShowUpdateScopeModal] = useState(false);
  const [showRescheduleReasonModal, setShowRescheduleReasonModal] =
    useState(false);
  const [confirmModalData, setConfirmModalData] = useState({
    isRecurringSession: false,
    hasDateChanged: false,
  });
  
  // Get store values safely
  const limits = settings?.limits;
  const isSubmitting = store ? store((state) => state.isSubmitting) : false;
  const isEditing = store ? store((state) => state.isEditing) : false;
  const open = store ? store((state) => state.extra.open) : false;
  const onClose = store ? store((state) => state.extra.onClose) : () => {};
  const member = store ? store((state) => state.extra.member) : null;
  const trainer = store ? store((state) => state.extra.trainer) : null;
  const storeFields = store ? store((state) => state.fields) : {};

  const oldSessionValues = store ? store((state) => state.values) : null;
  // Reset stepper and modals when modal opens/closes
  useEffect(() => {
    if (open) {
      setCurrentStep(1);
      setShowConfirmModal(false);
      setShowUpdateScopeModal(false);
      setShowRescheduleReasonModal(false);
    }
  }, [open]);

  // React 19: Memoized fields for better performance
  const fields = useMemo(() => {
    if (!store || !storeFields || typeof storeFields !== "object") {
      return {} as TFieldConfigObject<TSessionData | TUpdateSessionData>;
    }
    return {
      ...storeFields,
      title: {
        ...(storeFields as any).title,
        placeholder: t("title"),
      },
      description: {
        ...(storeFields as any).description,
        placeholder: t("Enter a description (max 500 characters)"),
      },
      location: {
        ...(storeFields as any).location,
        type: "custom" as const,
        Component: LocationSelect,
        label: buildSentence(t, 'location'),
        disabled: !!getSelectedLocation(),
      },
      locationText: {
        ...(storeFields as any).locationText,
        placeholder: t("location"),
      },
  
      notes: {
        ...(storeFields as any).notes,
        placeholder: t("notes"),
      },
      duration: {
        ...(storeFields as any).duration,
        label: t("duration") + " (" + t("minutes") + ")",
        placeholder: t("duration"),
      },
      type: {
        ...(storeFields as any).type,
        placeholder: t("type"),
      },
      trainer: {
        ...(storeFields as any).trainer,
        type: "custom" as const,
        Component: TrainerSelect,
        visible: () => user?.level !== EUserLevels.STAFF,
        disabled: !!trainer,
      },
      members: {
        ...(storeFields as any).members,
        type: "custom" as const,
        Component: MembersSelect,
        disabled: !!member,
      },
      serviceOffer: {
        ...(storeFields as any).serviceOffer,
        name: "serviceOffer", // Ensure name is set
        type: "custom" as const,
        Component: ServiceOfferSelect,
        label: buildSentence(t, "select", "service", "offer"),
        visible: (ctx: { values: Record<string, unknown> }) =>
          ctx.values.useCustomPrice !== true,
        subFields: undefined, // Remove subFields since we're using custom component
      },
      useCustomPrice: {
        ...(storeFields as any).useCustomPrice,
        label: buildSentence(t, "use", "custom", "price"),
        disabled: !!member,
        visible: () => !member
      },
      customPrice: {
        ...(storeFields as any).customPrice,
        placeholder: t("customPrice"),
        visible: (ctx: { values: Record<string, unknown> }) =>
          ctx.values.useCustomPrice === true,
        
      },
      startDateTime: {
        ...(storeFields as any).startDateTime,
        type: "custom" as const,
        Component: SessionDateTimeSelect,
        label: buildSentence(t, "start", "date", "and", "time"),
      },
      enableReminder: {
        ...(storeFields as any).enableReminder,
        label: buildSentence(t, "enable", "reminder"),
        disabled: !!member,
        visible: () => !member
      },
      reminderConfig: {
        ...(storeFields as any).reminderConfig,
        subFields: {
          sendBefore: {
            ...(storeFields as any).reminderConfig.subFields.sendBefore,
            label: buildSentence(t, "send", "before"),
          },
          reminderTypes: {
            ...(storeFields as any).reminderConfig.subFields.reminderTypes,
            label: buildSentence(t, "reminder", "types"),
          },
        },
        visible: (ctx: { values: Record<string, unknown> }) =>
          ctx.values.enableReminder,
        renderItem: (items: ReminderDto) => {
          return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {items.sendBefore as ReactNode}
              {items.reminderTypes as ReactNode}
            </div>
          );
        },
        label: buildSentence(t, "reminders"),
      },
      recurrenceEndDate: {
        ...(storeFields as any).recurrenceEndDate,
        visible: (ctx: { values: Record<string, unknown> }) =>
          ctx.values.enableRecurrence,
        label: buildSentence(t, "end", "date"),
        
      },
      enableRecurrence: {
        ...(storeFields as any).enableRecurrence,
        label: buildSentence(t, "enable", "recurrence"),
        disabled: !!member,
        visible: () => !member
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
            const { watch } = useFormContext<
              TSessionData | TUpdateSessionData
            >();
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
    } as TFieldConfigObject<TSessionData | TUpdateSessionData>;
  }, [store, storeFields, user?.level, t]);

  const inputs = useInput<TSessionData | TUpdateSessionData>({
    fields,
    showRequiredAsterisk: true,
  }) as FormInputs<TSessionData | TUpdateSessionData>;

  // Navigation handlers
  const handlePrevious = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  const handleNext = useCallback((step: number) => {
    setCurrentStep(step);
  }, []);

  const handleConfirm = useCallback(
    (isRecurringSession: boolean, hasDateChanged: boolean) => {
      setConfirmModalData({
        isRecurringSession,
        hasDateChanged,
      });

      if (hasDateChanged) {
        setShowRescheduleReasonModal(true);
      } else {
        if (isRecurringSession && isEditing) {
          setShowUpdateScopeModal(true);
        } else {
          setShowConfirmModal(true);
        }
      }
    },
    [isEditing]
  );

  // React 19: Smooth modal state changes
  const onOpenChange = (state: boolean) => {
    if (state === false) {
      startTransition(() => {
        onClose();
      });
    }
  };

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
      <ModalForm<
        TSessionData | TUpdateSessionData,
        ISessionResponse,
        ISessionFormModalExtraProps
      >
        title={buildSentence(t, isEditing ? "edit" : "add", "session")}
        open={open}
        onOpenChange={onOpenChange}
        formStore={store}
        footerContent={
          <SessionFormNavigation
            currentStep={currentStep}
            isEditing={isEditing}
            isSubmitting={isSubmitting}
            onPrevious={handlePrevious}
            onNext={handleNext}
            onClose={onClose}
            onConfirm={handleConfirm}
            componentId={componentId}
            oldValues={oldSessionValues}
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
                description: buildSentence(t, "title", "type", "description"),
              },
              {
                label: t("participants"),
                description: buildSentence(t, "trainer", "and", "members"),
              },
              {
                label: t("details"),
                description: buildSentence(t, "price", "notes", "reminders"),
              },
              {
                label: buildSentence(t, "date", "and", "time"),
                description: buildSentence(t, "select", "available", "slot"),
              },
            ]}
          />
        </div>

        <SessionFormSteps
          currentStep={currentStep}
          inputs={inputs}
          isEditing={isEditing}
          limits={limits ? { maxClientsPerSession: limits.maxMembersPerSession } : undefined}
        />
        <button type="submit" id="session-form-submit-button" hidden>
          Submit
        </button>
      </ModalForm>

      {/* Reschedule Reason Modal - Shows when date/time changed */}
      {isEditing && (
        <SessionRescheduleReasonModal
          open={showRescheduleReasonModal}
          onOpenChange={setShowRescheduleReasonModal}
          setShowUpdateScopeModal={setShowUpdateScopeModal}
          setShowConfirmModal={setShowConfirmModal}
          isRecurringSession={confirmModalData.isRecurringSession}
        />
      )}

      {/* Update Scope Modal - Shows first when editing */}
      {isEditing && (
        <SessionUpdateScopeModalWrapper
          open={showUpdateScopeModal}
          onOpenChange={setShowUpdateScopeModal}
          hasDateChanged={confirmModalData.hasDateChanged}
          setShowConfirmModal={setShowConfirmModal}
        />
      )}

      {/* Confirmation Modal - Must be inside Form context */}
      <SessionConfirmModal
        open={showConfirmModal}
        isEditing={isEditing}
        onOpenChange={setShowConfirmModal}
        isSubmitting={isSubmitting}
        onConfirm={() => {
          const button = document.querySelector(
            "#session-form-submit-button"
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

// Wrapper component for SessionUpdateScopeModal to handle form values and onSelect
const SessionUpdateScopeModalWrapper = React.memo(
  function SessionUpdateScopeModalWrapper({
    open,
    onOpenChange,
    hasDateChanged,
    setShowConfirmModal,
  }: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    hasDateChanged: boolean;
    setShowConfirmModal: (show: boolean) => void;
  }) {
    const { setValue } = useFormContext<TSessionData | TUpdateSessionData>();

    const handleSelect = useCallback(
      (scope: EUpdateSessionScope) => {
        setValue("updateScope" as keyof TUpdateSessionData, scope);
        setShowConfirmModal(true);
      },
      [setValue, setShowConfirmModal]
    );

    return (
      <SessionUpdateScopeModal
        open={open}
        onOpenChange={onOpenChange}
        hasDateChanged={hasDateChanged}
        onSelect={handleSelect}
      />
    );
  }
);

export default SessionFormModal;
