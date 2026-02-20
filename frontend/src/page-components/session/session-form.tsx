// External Libraries
import { useShallow } from "zustand/shallow";
import { Loader2 } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useCallback, useId, useTransition } from "react";

// Handlers
import { FormHandler } from "@/handlers";

// Types
import { EVALIDATION_MODES } from "@/enums/form.enums";
import { type THandlerComponentProps } from "@/@types/handler-types";
import {
  type TSessionData,
  type TUpdateSessionData,
} from "@shared/types/session.type";
import {
  type ISession,
  type ISessionResponse,
} from "@shared/interfaces/session.interface";

// Store
import { type TSingleHandlerStore } from "@/stores";

// Components
import { SessionFormModal } from "@/components/admin";

// Services
import { createSession, updateSession } from "@/services/session.api";
import { strictDeepMerge } from "@/utils";
import { ESessionType } from "@shared/enums/session.enum";
import { CreateSessionDto, UpdateSessionDto } from "@shared/dtos/session-dtos";
import type { ISessionFormModalExtraProps } from "@/components/admin/sessions/form/session-form-modal";
import { EReminderType, EScheduleFrequency } from "@shared/enums";
import type { MemberDto, StaffDto, RecurrenceConfigDto, UserDto } from "@shared/dtos";
import type { ReminderDto } from "@shared/dtos/reminder-dtos";
import { useUserSettings } from "@/hooks/use-user-settings";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";
import type { IMember } from "@shared/interfaces/member.interface";
import type { IStaff } from "@shared/interfaces/staff.interface";
import { getCurrentUserStaff } from "@/services/staff.api";
import { getMyMember } from "@/services/member.api";

export type TSessionExtraProps = {
  [key: string]: any; // Allow additional properties for other action components
};

interface ISessionFormProps
  extends THandlerComponentProps<
    TSingleHandlerStore<ISession, TSessionExtraProps>
  > {}

export default function SessionForm({ storeKey, store }: ISessionFormProps) {
  // React 19: Essential IDs and transitions
  const componentId = useId();
  const [, startTransition] = useTransition();

  const queryClient = useQueryClient();
  const { settings } = useUserSettings();
  const { t } = useI18n();

  if (!store) {
    return (
      <div>
        {buildSentence(t, "single", "store")} "{storeKey}"{" "}
        {buildSentence(t, "not", "found")}.{" "}
        {buildSentence(t, "did", "you", "forget", "to", "register", "it")}?
      </div>
    );
  }


  
  // Fetch current user's member and trainer information
  const { data: member } = useQuery<IMember | null>({
    queryKey: ["myMember"],
    queryFn: getMyMember,
  });

  const { data: currentUserStaff } = useQuery<IStaff | null>({
    queryKey: ["currentUserStaff"],
    queryFn: getCurrentUserStaff,
  });

  const trainer = currentUserStaff?.isTrainer ? currentUserStaff : undefined; 

  const { action, response, isLoading, setAction, reset, extra } = store(
    useShallow((state) => ({
      action: state.action,
      response: state.response,
      isLoading: state.isLoading,
      setAction: state.setAction,
      reset: state.reset,
      extra: state.extra,
    }))
  );

  // Use default duration from settings if available
  const defaultDuration = (settings?.limits as any)?.sessionDurationDefault || 60;

  const getInitialTrainer = () => {
    if (trainer) {
      return {
        id: trainer.id,
        user: trainer.user ? {
          id: trainer.user.id,
          firstName: trainer.user.firstName,
          lastName: trainer.user.lastName,
          email: trainer.user.email,
        } : undefined,
      };
    }
    return null;
  };

  const INITIAL_VALUES: TSessionData | TUpdateSessionData = {
    title: "",
    description: "",
    startDateTime: undefined,
    duration: defaultDuration,
    trainer: getInitialTrainer() as StaffDto,
    members: member ? [{
      id: member.id,
      user: member.user ? {
        id: member.user.id,
        firstName: member.user.firstName,
        lastName: member.user.lastName,
        email: member.user.email,
      } : undefined,
    }] : [] as MemberDto[], // Will be validated to require at least one
    type: ESessionType.CUSTOM,
    location: undefined,
    locationText: "",
    price: undefined,
    useCustomPrice: false,
    customPrice: undefined,
    notes: "",
    reminderConfig: { reminderTypes: [EReminderType.EMAIL] } as ReminderDto,
    enableReminder: false,
    enableRecurrence: false,
    updateScope: undefined,
    recurrenceConfig: {
      frequency: EScheduleFrequency.ONCE,
      weekDays: [],
      monthDays: [],
    } as RecurrenceConfigDto,
    recurrenceEndDate: undefined,
  };

  // React 19: Memoized initial values with deferred processing
  const initialValues = useMemo(() => {
    const merged = strictDeepMerge<TSessionData | TUpdateSessionData>(
      INITIAL_VALUES,
      (response ?? {}) as Partial<TSessionData | TUpdateSessionData>
    );
    // If no duration in response, use default from settings
    if (!merged.duration) {
      merged.duration = defaultDuration;
    }
    return merged;
  }, [INITIAL_VALUES, response?.id, defaultDuration]);

  const handleClose = useCallback(() => {
    startTransition(() => {
      reset();
      setAction("none");
    });
  }, [reset, setAction, startTransition]);

  const isEditing = !!response?.id;

  const mutationFn = useMemo(() => {
    return isEditing ? updateSession(response.id) : createSession;
  }, [isEditing, response?.id]);

  // React 19: Memoized DTO to prevent unnecessary re-renders
  const dto = useMemo(() => {
    return isEditing ? UpdateSessionDto : CreateSessionDto;
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
      <FormHandler<
        TSessionData | TUpdateSessionData,
        ISessionResponse,
        ISessionFormModalExtraProps
      >
        mutationFn={mutationFn}
        FormComponent={SessionFormModal}
        storeKey={storeKey}
        initialValues={initialValues}
        dto={dto}
        validationMode={EVALIDATION_MODES.OnSubmit}
        isEditing={isEditing}
        onSuccess={() => {
          startTransition(() => {
            queryClient.invalidateQueries({
              queryKey: [storeKey + "-calendar"],
            });
            queryClient.invalidateQueries({
              queryKey: [storeKey + "-list"],
            });
            handleClose();
          });
        }}
        formProps={{
          open: action === "createOrUpdate",
          onClose: handleClose,
          member: member,
          trainer: trainer,
        }}
      />
    </div>
  );
}
