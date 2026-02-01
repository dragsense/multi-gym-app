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
  TMemberData,
  TUpdateMemberData,
} from "@shared/types/member.type";
import type { TMemberResponse } from "@shared/interfaces/member.interface";

// Components
import { ModalForm } from "@/components/form-ui/modal-form";
import type { THandlerComponentProps } from "@/@types/handler-types";
import type { TProfileData, TUserData } from "@shared/types";
import { addRenderItem } from "@/lib/fields/dto-to-feilds";
import type { TCustomInputWrapper, TFieldConfigObject } from "@/@types/form/field-config.type";
import { Stepper } from "@/components/shared-ui/stepper";
import { MemberFormSteps } from "../components/member-form-steps";
import { MemberFormNavigation } from "../components/member-form-navigation";
import { MemberConfirmModal } from "../components/member-confirm-modal";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";
import { StarRatingInput } from "@/components/shared-ui/star-rating-input";

// Custom component - must be defined before early return
const FitnessLevelStarRating = React.memo((props: TCustomInputWrapper) => {
  const { value, onChange } = props;

  // Convert fitness level string to number for star rating
  const fitnessLevelNumber = React.useMemo(() => {
    if (!value) return 0;
    const num = typeof value === 'string' ? parseInt(value, 10) : value;
    return isNaN(num) ? 0 : num;
  }, [value]);

  const handleChange = React.useCallback(
    (rating: number) => {
      onChange?.(rating.toString());
    },
    [onChange]
  );

  return (
    <StarRatingInput
      value={fitnessLevelNumber}
      onChange={handleChange}
      maxStars={5}
    />
  );
});

export interface IMemberFormModalExtraProps {
  open: boolean;
  onClose: () => void;
}

interface IMemberFormModalProps
  extends THandlerComponentProps<
    TFormHandlerStore<TMemberData, TMemberResponse, IMemberFormModalExtraProps>
  > { }

const MemberFormModal = React.memo(function MemberFormModal({
  storeKey,
  store,
}: IMemberFormModalProps) {
  // React 19: Essential IDs and transitions
  const componentId = useId();
  const [, startTransition] = useTransition();
  const { t } = useI18n();

  // Stepper state
  const [currentStep, setCurrentStep] = useState(1);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  if (!store) {
    return `${buildSentence(t, "form", "store")} "${storeKey}" ${buildSentence(t, "not", "found")}. ${buildSentence(t, "did", "you", "forget", "to", "register", "it")}?`;
  }

  // Always call hooks unconditionally
  const isEditing = store ? store((state) => state.isEditing) : false;
  const isSubmitting = store ? store((state) => state.isSubmitting) : false;
  const open = store ? store((state) => state.extra.open) : false;
  const onClose = store ? store((state) => state.extra.onClose) : () => { };
  const storeFields = store ? store((state) => state.fields) : {};

  // Reset stepper when modal opens/closes
  useEffect(() => {
    if (open) {
      setCurrentStep(1);
      setShowConfirmModal(false);
    }
  }, [open]);
//Introducing new useMemo Hook to add placeholders



const configuredFields = useMemo(() => {
  const f = storeFields as TFieldConfigObject<
    TMemberData | TUpdateMemberData
  >;

  const userField = f.user as
    | (TFieldConfigObject<TUserData> & { subFields: Record<string, any> })
    | undefined;

  return {
    ...f,
    user: userField
      ? {
          ...userField,
          subFields: {
            ...userField.subFields,
            email: {
              ...userField.subFields.email,
              placeholder: buildSentence(t, "enter", "email"),
              
            },
            firstName: {
              ...userField.subFields.firstName,
              placeholder: buildSentence(t, "first", "name"),
              label:buildSentence(t,"first","name")
            },
            lastName: {
              ...userField.subFields.lastName,
              placeholder: buildSentence(t, "last", "name"),
              label:buildSentence(t, "last", "name"), 
            },
            dateOfBirth:{
              ...userField.subFields.dateOfBirth,
              label:buildSentence(t, "date","of birth"),
            }

          },
          label:"",
        }
      : undefined,
    fitnessLevel: {
      ...f.fitnessLevel,
      label: buildSentence(t, "fitness", "level"),
    },
    goal:{
      ...f.goal,
      placeholder:buildSentence(t, "enter", "goal"),
    },
    medicalConditions:{
      ...f.medicalConditions,
      placeholder:buildSentence(t, "enter", "medical","condition"),
      label:buildSentence(t,"medical","condition"),
    }

  };
}, [storeFields, t]);



  // React 19: Memoized fields for better performance
  const fields = useMemo(() => {
    const fieldsWithRenderers = configuredFields

    return {
      ...fieldsWithRenderers,
      user: {
        ...(fieldsWithRenderers.user || {}),
        renderItem: (item: FormInputs<TUserData>) => (
          <div className="space-y-4">
             {item.email}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              {item.firstName}
              {item.lastName}
              {item.dateOfBirth}
              {item.gender}
            </div>
          </div>
        ),
        subFields: {
          ...(fieldsWithRenderers.user?.subFields || {}),
          profile: {
            ...(fieldsWithRenderers.user?.subFields?.profile || {}),
            renderItem: (item: FormInputs<TProfileData>) => (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                {item.rfid}
                {item.phoneNumber}
                {item.address}
                {item.city}
                {item.state}
                {item.zipCode}
                {item.country}
                {item.emergencyContactName}
                {item.emergencyContactNumber}
                {item.emergencyContactRelationship}
                {item.notes}
                {item.image}
                {item.documents}
                {item.business}
              </div>
            ),
          },
        },
      },
      fitnessLevel: {
        ...(fieldsWithRenderers.fitnessLevel || {}),
        type: "custom" as const,
        Component: FitnessLevelStarRating,
        label: buildSentence(t, "fitness", "level"),
      },
    } as TFieldConfigObject<TMemberData | TUpdateMemberData>;
  }, [storeFields, t]);

  const inputs = useInput<TMemberData | TUpdateMemberData>({
    fields,
    showRequiredAsterisk: true,
  }) as FormInputs<TMemberData | TUpdateMemberData>;

  // React 19: Smooth modal state changes
  const onOpenChange = (state: boolean) => {
    if (state === false) {
      startTransition(() => {
        onClose();
      });
    }
  };

  const handlePrevious = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  const handleNext = useCallback(
    (step: number) => {
      setCurrentStep(step);
    },
    []
  );

  const handleConfirm = useCallback(() => {
    setShowConfirmModal(true);
  }, []);

  const handleFinalConfirm = useCallback(() => {
    // Trigger form submission
    const submitButton = document.getElementById("member-form-submit-button");
    if (submitButton) {
      submitButton.click();
    }
    setShowConfirmModal(false);
    
  }, []);


  return (
    <>
      <ModalForm<
        TMemberData,
        TMemberResponse,
        IMemberFormModalExtraProps
      >
        title={buildSentence(t, isEditing ? "edit" : "add", "member")}
        open={open}
        onOpenChange={onOpenChange}
        formStore={store}
        footerContent={
          <MemberFormNavigation
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
                label: buildSentence(t, "basic", "information"),
                description: buildSentence(
                  t,
                  "email",
                  "name",
                  "date",
                  "of",
                  "birth",
                  "gender"
                ),
              },
              {
                label: buildSentence(t, "member", "details"),
                description: buildSentence(
                  t,
                  "goal",
                  "fitness",
                  "level",
                  "medical",
                  "conditions"
                ),
              },
            ]}
          />
        </div>

        <MemberFormSteps
          currentStep={currentStep}
          inputs={inputs}
          isEditing={isEditing}
        />
        <button type="submit" id="member-form-submit-button" hidden>
          Submit
        </button>
      </ModalForm>

      {/* Confirmation Modal */}
      <MemberConfirmModal
        open={showConfirmModal}
        isEditing={isEditing}
        onOpenChange={setShowConfirmModal}
        isSubmitting={isSubmitting}
        onConfirm={handleFinalConfirm}
      />
    </>
  );
});

export { MemberFormModal };

