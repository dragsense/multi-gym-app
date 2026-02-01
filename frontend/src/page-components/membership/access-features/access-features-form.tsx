// External Libraries
import { useShallow } from 'zustand/shallow';
import { Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useCallback, useId, useTransition, useDeferredValue } from "react";

// Handlers
import { FormHandler } from "@/handlers";

// Types
import { EVALIDATION_MODES } from "@/enums/form.enums";
import { type THandlerComponentProps } from "@/@types/handler-types";
import { type IAccessFeature } from "@shared/interfaces/access-feature.interface";
import { type IMessageResponse } from "@shared/interfaces/api/response.interface";

// Store
import { type TSingleHandlerStore } from "@/stores";

// Components
import { AccessFeaturesFormModal, type IAccessFeaturesFormModalExtraProps } from "@/components/admin/memberships/access-features";

// Services
import { createAccessFeature, updateAccessFeature } from "@/services/membership/access-feature.api";
import { strictDeepMerge } from "@/utils";
import { CreateAccessFeatureDto, UpdateAccessFeatureDto } from "@shared/dtos";
import type { TAccessFeatureData } from '@shared/types/access-feature.type';
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";

export type TAccessFeaturesExtraProps = {};

interface IAccessFeaturesFormProps extends THandlerComponentProps<TSingleHandlerStore<IAccessFeature, TAccessFeaturesExtraProps>> { }

export default function AccessFeaturesForm({
  storeKey,
  store,
}: IAccessFeaturesFormProps) {
  // React 19: Essential IDs and transitions
  const componentId = useId();
  const [, startTransition] = useTransition();

  const queryClient = useQueryClient();
  const { t } = useI18n();

  if (!store) {
    return <div>{buildSentence(t, 'single', 'store')} "{storeKey}" {buildSentence(t, 'not', 'found')}. {buildSentence(t, 'did', 'you', 'forget', 'to', 'register', 'it')}?</div>;
  }

  const { action, response, isLoading, setAction, reset } = store(useShallow(state => ({
    action: state.action,
    response: state.response,
    isLoading: state.isLoading,
    setAction: state.setAction,
    reset: state.reset
  })));



  const INITIAL_VALUES: TAccessFeatureData = {
    name: "",
    description: "",
  };

  // React 19: Memoized initial values with deferred processing
  const initialValues = useMemo(() => {
    return strictDeepMerge<TAccessFeatureData>(INITIAL_VALUES, response ?? {});
  }, [INITIAL_VALUES, response?.id]);

  // React 19: Enhanced handler with transitions
  const handleClose = useCallback(() => {
    startTransition(() => {
      reset();
      setAction('none');
    });
  }, [reset, setAction, startTransition]);

  const isEditing = !!response?.id;

  const mutationFn = useMemo(() => {
    return isEditing ? updateAccessFeature(response.id) : createAccessFeature;
  }, [isEditing, response?.id]);

  const dto = useMemo(() => {
    return isEditing ? UpdateAccessFeatureDto : CreateAccessFeatureDto;
  }, [isEditing]);

  if (isLoading) {
    return (
      <div className="absolute inset-0 z-30 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }


  return (
    <div data-component-id={componentId}>
      <FormHandler<TAccessFeatureData, IMessageResponse, IAccessFeaturesFormModalExtraProps>
        mutationFn={mutationFn}
        FormComponent={AccessFeaturesFormModal}
        storeKey={storeKey}
        initialValues={initialValues}
        dto={dto}
        validationMode={EVALIDATION_MODES.OnSubmit}
        isEditing={isEditing}
        onSuccess={() => {
          startTransition(() => {
            queryClient.invalidateQueries({ queryKey: [storeKey + "-list"] });
            handleClose();
          });
        }}
        formProps={{
          open: action === 'createOrUpdate',
          onClose: handleClose,
        }}
      />
    </div>
  );
}

