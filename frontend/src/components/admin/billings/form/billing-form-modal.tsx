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
import type { TBillingData } from "@shared/types/billing.type";
import type { IBillingResponse } from "@shared/interfaces/billing.interface";

// Components
import { ModalForm } from "@/components/form-ui/modal-form";
import type { THandlerComponentProps } from "@/@types/handler-types";
import { SearchableInputWrapper } from "@/components/shared-ui/searchable-input-wrapper";
import { useSearchableUsers } from "@/hooks/use-searchable";
import type {
  TCustomInputWrapper,
  TFieldConfigObject,
} from "@/@types/form/field-config.type";
import type { ReminderDto } from "@shared/dtos/reminder-dtos";
import type { UserDto } from "@shared/dtos";
import type { IUser } from "@shared/interfaces/user.interface";
import { Stepper } from "@/components/shared-ui/stepper";
import { BillingFormSteps } from "../components/billing-form-steps";
import { BillingFormNavigation } from "../components/billing-form-navigation";
import { BillingConfirmModal } from "../components/billing-confirm-modal";

// Custom component - must be defined before early return
const RecipientUserSelect = React.memo((props: TCustomInputWrapper) => {
  const searchableUsers = useSearchableUsers({});
  const { t } = useI18n();
  return (
    <SearchableInputWrapper<UserDto>
      {...props}
      modal={true}
      useSearchable={() => searchableUsers}
      getLabel={(item) => {
        if (!item) return buildSentence(t, "select", "recipient");
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

export interface IBillingFormModalExtraProps {
  open: boolean;
  onClose: () => void;
  user?: IUser;
}

type IBillingFormModalProps = THandlerComponentProps<
  TFormHandlerStore<TBillingData, IBillingResponse, IBillingFormModalExtraProps>
>;

const BillingFormModal = React.memo(function BillingFormModal({
  storeKey,
  store,
}: IBillingFormModalProps) {
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
  const user = store ? store((state) => state.extra.user) : undefined;
  const storeFields = store ? store((state) => state.fields) : {};

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
        ...(storeFields as TFieldConfigObject<TBillingData>),
        title: {
          ...(storeFields as TFieldConfigObject<TBillingData>).title,
          label: buildSentence(t, "title"),
          placeholder: t("title"),
        },
        description: {
          ...(storeFields as TFieldConfigObject<TBillingData>).description,
          label: buildSentence(t, "description"),
          placeholder: buildSentence(t,"enter","description"),
        },
        issueDate: {
          ...(storeFields as TFieldConfigObject<TBillingData>).issueDate,
          label: buildSentence(t, "issue", "date"),
        },
        dueDate: {
          ...(storeFields as TFieldConfigObject<TBillingData>).dueDate,
          label: buildSentence(t, "due", "date"),
        },
        type: {
          ...(storeFields as TFieldConfigObject<TBillingData>).type,
          label: buildSentence(t, "type"),
        },
        recurrence: {
          ...(storeFields as TFieldConfigObject<TBillingData>).recurrence,
          label: buildSentence(t, "recurrence"),
        },
        notes: {
          ...(storeFields as TFieldConfigObject<TBillingData>).notes,
          label: buildSentence(t, "notes"),
          placeholder:buildSentence(t,"notes")
        },
        recipientUser: {
          ...(storeFields as TFieldConfigObject<TBillingData>).recipientUser,
          type: "custom" as const,
          label: buildSentence(t, "recipient", "user"),
          Component: RecipientUserSelect,
          disabled: !!user,
        },
        enableReminder: {
          ...(storeFields as TFieldConfigObject<TBillingData>).enableReminder,
          label: buildSentence(t, "enable", "reminder"),
        },
        isCashable: {
          ...(storeFields as TFieldConfigObject<TBillingData>).isCashable,
          label: buildSentence(t, "allow", "cash", "payment"),
        },
        lineItems: {
          ...(storeFields as TFieldConfigObject<TBillingData>).lineItems,
          label: "",
          subFields: {
            ...(storeFields as TFieldConfigObject<TBillingData>).lineItems
              .subFields,

            description:{
              ...(storeFields as TFieldConfigObject<TBillingData>).lineItems.subFields.description,
              placeholder:buildSentence(t,"description")
            },
            unitPrice: {
              ...(storeFields as TFieldConfigObject<TBillingData>).lineItems
                .subFields.unitPrice,
              label: buildSentence(t, "unit", "price"),
              placeholder:buildSentence(t,"unit price"),
              required:true,
            },
            quantity: {
              ...(storeFields as TFieldConfigObject<TBillingData>).lineItems
                .subFields.quantity,
              label: buildSentence(t, "quantity"),
              placeholder:buildSentence(t,"quantity")
            },
          },
        },
        reminderConfig: {
          ...(storeFields as TFieldConfigObject<TBillingData>).reminderConfig,
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
        },
      } as TFieldConfigObject<TBillingData>),
    [storeFields, t, RecipientUserSelect]
  );

  const inputs = useInput<TBillingData>({
    fields,
    showRequiredAsterisk: true,
  }) as FormInputs<TBillingData>;

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

  const handleFinalConfirm = useCallback(() => {
    const button = document.querySelector(
      "#billing-form-submit-button"
    ) as HTMLButtonElement;

    if (button) {
      button.click();
    }
    setShowConfirmModal(false);
  }, []);

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

  // React 19: Smooth modal state changes
  const onOpenChange = (state: boolean) => {
    if (state === false) {
      startTransition(() => {
        onClose();
      });
    }
  };

  return (
    <>
      <ModalForm<TBillingData, IBillingResponse, IBillingFormModalExtraProps>
        title={buildSentence(t, isEditing ? "edit" : "add", "billing")}
        //description={buildSentence(t, isEditing ? "edit" : "add", "billing")}
        open={open}
        onOpenChange={onOpenChange}
        formStore={store}
        footerContent={
          <BillingFormNavigation
            currentStep={currentStep}
            isEditing={isEditing}
            isSubmitting={isSubmitting}
            onPrevious={handlePrevious}
            onNext={handleNext}
            onClose={onClose}
            onConfirm={handleConfirm}
            componentId={componentId}
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
                description: buildSentence(
                  t,
                  "title",
                  "type",
                  "description",
                  "dates"
                ),
              },
              {
                label: buildSentence(t, "line", "items"),
                description: buildSentence(
                  t,
                  "add",
                  "billing",
                  "line",
                  "items",
                  "or",
                  "amount"
                ),
              },
              {
                label: t("details"),
                description: buildSentence(
                  t,
                  "recipient",
                  "notes",
                  "reminders"
                ),
              },
            ]}
          />
        </div>

        <BillingFormSteps
          currentStep={currentStep}
          inputs={inputs}
          isEditing={isEditing}
        />
        <button type="submit" id="billing-form-submit-button" hidden>
          Submit
        </button>
      </ModalForm>

      {/* Confirmation Modal */}
      <BillingConfirmModal
        open={showConfirmModal}
        isEditing={isEditing}
        onOpenChange={setShowConfirmModal}
        isSubmitting={isSubmitting}
        onConfirm={handleFinalConfirm}
      />
    </>
  );
});

export default BillingFormModal;
