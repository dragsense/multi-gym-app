// External Libraries
import React, { useId, useMemo, useTransition, useState, useCallback, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useFormContext } from "react-hook-form";

// Custom Hooks
import { type FormInputs, useInput } from "@/hooks/use-input";

// Types
import type { TFormHandlerStore } from "@/stores";
import type { TUpdateProfileData } from "@shared/types/user.type";
import type { IMessageResponse } from "@shared/interfaces/api/response.interface";

// Components
import { Button } from "@/components/ui/button";
import { ModalForm } from "@/components/form-ui/modal-form";
import type { THandlerComponentProps } from "@/@types/handler-types";
import FileUpload from "@/components/shared-ui/file-upload";
import type { IFileUpload } from "@shared/interfaces/file-upload.interface";
import MultiFileUpload from "@/components/shared-ui/multi-file-upload";
import type { TFieldConfigObject } from "@/@types/form/field-config.type";
import { FormErrors } from "@/components/shared-ui/form-errors";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";

/** Tracks removed document IDs and syncs to form; splits value into new vs uploaded so removing one doc only removes that one and state persists on save. */
const MultiFileUploadWithRemove = ({
  value,
  onChange,
}: {
  value: File[] | IFileUpload[] | undefined;
  onChange: (file: File[] | null) => void;
}) => {
  const [uploadedFiles, setUploadedFiles] = useState<IFileUpload[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [removedDocumentIds, setRemovedDocumentIds] = useState<string[]>([]);
  const { setValue } = useFormContext();

  useEffect(() => {
    if (!value) return;
    const files = value as File[] | IFileUpload[];
    const _newFiles = files.filter((file) => file instanceof File);
    const _uploadedFiles = files.filter(
      (file) =>
        typeof file === "object" && "id" in file && typeof file.id === "string"
    );
    setNewFiles(_newFiles as File[]);
    if (_uploadedFiles.length > 0) {
      setUploadedFiles(_uploadedFiles as IFileUpload[]);
    }
    // Reset removals when opening a different profile (new value)
    setRemovedDocumentIds([]);
  }, [value]);

  useEffect(() => {
    setValue("removedDocumentIds", removedDocumentIds);
  }, [removedDocumentIds, setValue]);

  const handleRemove = useCallback((file: IFileUpload) => {
    if (file && "id" in file && typeof file.id === "string") {
      setRemovedDocumentIds((prev) =>
        prev.includes(file.id) ? prev : [...prev, file.id]
      );
    }
  }, []);

  return (
    <MultiFileUpload
      value={newFiles}
      removedDocumentIds={removedDocumentIds}
      uploadedFiles={uploadedFiles}
      onChange={onChange}
      onRemove={handleRemove}
    />
  );
};



export interface IProfileFormModalExtraProps {
  open: boolean;
  onClose: () => void;
}

interface IProfileFormModalProps extends THandlerComponentProps<TFormHandlerStore<TUpdateProfileData, IMessageResponse, IProfileFormModalExtraProps>> {
}

const ProfileFormModal = React.memo(function ProfileFormModal({
  storeKey,
  store,
}: IProfileFormModalProps) {
  // React 19: Essential IDs and transitions
  const componentId = useId();
  const [, startTransition] = useTransition();
  const { t } = useI18n();
  if (!store) {
    return (
      <div>
      {buildSentence(t, 'form', 'store')} "{storeKey}" {buildSentence(t, 'not', 'found')}. {buildSentence(t, 'did', 'you', 'forget', 'to', 'register', 'it')}?
    </div>
    );
  }

  const open = store((state) => state.extra.open)
  const onClose = store((state) => state.extra.onClose)

  const storeFields = store((state) => state.fields)

  // React 19: Memoized fields for better performance (labels/placeholders aligned with account profile tab)
  const fields = useMemo(() => ({
    ...storeFields,
    phoneNumber: {
      ...storeFields.phoneNumber,
      label: t('phoneNumber'),
      placeholder: t('enterPhoneNumber'),
    },
    address: {
      ...storeFields.address,
      label: t('address'),
      placeholder: t('enterAddress'),
    },
    rfid: {
      ...storeFields.rfid,
      label: t('rfid'),
      placeholder: t('enterRfid'),
    },
    state: {
      ...storeFields.state,
      label: t('state'),
      placeholder: t('enterState'),
    },
    city: {
      ...storeFields.city,
      label: t('city'),
      placeholder: t('enterCity'),
    },
    zipCode: {
      ...storeFields.zipCode,
      label: t('zipCode'),
      placeholder: t('enterZipCode'),
    },
    country: {
      ...storeFields.country,
      label: t('country'),
      placeholder: t('enterCountry'),
    },
    emergencyContactName: {
      ...storeFields.emergencyContactName,
      label: t('emergencyContactName'),
      placeholder: t('enterEmergencyContactName'),
    },
    emergencyContactNumber: {
      ...storeFields.emergencyContactNumber,
      label: t('emergencyContactNumber'),
      placeholder: t('enterEmergencyContactNumber'),
    },
    emergencyContactRelationship: {
      ...storeFields.emergencyContactRelationship,
      label: t('emergencyContactRelationship'),
      placeholder: t('enterEmergencyContactRelationship'),
    },
    alternativeEmergencyContactNumber: {
      ...storeFields.alternativeEmergencyContactNumber,
      label: t('alternativeEmergencyContactNumber'),
      placeholder: t('enterAlternativeEmergencyContactNumber'),
    },
    image: {
      ...storeFields.image,
      type: 'custom' as const,
      Component: ({ value, onChange }: { value: File | IFileUpload | null, onChange: (file: File | null) => void }) => <FileUpload value={value} onChange={onChange} />
    },
    documents: {
      ...storeFields.documents,
      type: 'custom' as const,
      Component: ({ value, onChange }: { value: File[] | IFileUpload[] | undefined; onChange: (file: File[] | null) => void }) => (
        <MultiFileUploadWithRemove value={value} onChange={onChange} />
      ),
    },
  } as TFieldConfigObject<TUpdateProfileData>), [storeFields]);

  const inputs = useInput<TUpdateProfileData>({
    fields,
    showRequiredAsterisk: true,
  }) as FormInputs<TUpdateProfileData>;


  const onOpenChange = (state: boolean) => {
    if (state === false) {
      startTransition(() => onClose());
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
          startTransition(() => onClose());
        }}
      >
        {t('cancel')}
      </Button>
      <Button type="submit" disabled={false}>
        {false && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {t('updateProfile')}
      </Button>
    </div>
  ), [onClose]);


  return <>
    <ModalForm<TUpdateProfileData, IMessageResponse, IProfileFormModalExtraProps>
      title={t('editProfile')}
      description={t('updateProfileInformation')}
      open={open}
      onOpenChange={onOpenChange}
      formStore={store}
      footerContent={formButtons}
      width="3xl"
      data-component-id={componentId}
    >
      <div className="space-y-8">
        {/* Basic Info */}
        <div>
          <h3 className="text-sm font-semibold mb-3">{t('basicInfo')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {inputs.phoneNumber}
            {inputs.address}
            {inputs.rfid}
            {inputs.state}
            {inputs.city}
            {inputs.zipCode}
            {inputs.country}
          </div>
        </div>


        {/* Emergency Contact */}
        <div>
          <h3 className="text-sm font-semibold mb-3">{t('emergencyContact')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {inputs.emergencyContactName}
            {inputs.emergencyContactNumber}
            {inputs.emergencyContactRelationship}
            {inputs.alternativeEmergencyContactNumber}
          </div>
        </div>

        {/* Profile Image */}
        <div>
          <h3 className="text-sm font-semibold mb-3">{t('profileImage')}</h3>
          <div className="grid grid-cols-1 gap-6 items-start">
            {inputs.image as React.ReactNode}
          </div>
        </div>

        {/* Documents */}
        <div>
          <h3 className="text-sm font-semibold mb-3">{t('documents')} (Max 10)</h3>
          <div className="grid grid-cols-1 gap-6 items-start">
            {inputs.documents as React.ReactNode}
          </div>
        </div>

      </div>
    </ModalForm>

  </>
});

export default ProfileFormModal;

