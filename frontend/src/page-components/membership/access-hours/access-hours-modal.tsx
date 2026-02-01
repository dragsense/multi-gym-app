import { useQueryClient } from "@tanstack/react-query";
import { useId, useTransition } from "react";
import { useShallow } from "zustand/shallow";

// Types
import type { IAccessHour } from '@shared/interfaces/access-hour.interface';

// Handlers
import { ListHandler, SingleHandler } from "@/handlers";

// Components
import { AccessHoursList } from "@/components/admin/memberships/access-hours";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AppDialog } from "@/components/layout-ui/app-dialog";

// Services
import { fetchAccessHours, fetchAccessHour, deleteAccessHour } from '@/services/membership/access-hour.api';

// Page Components
import AccessHoursForm from "@/page-components/membership/access-hours/access-hours-form";

// Stores
import { type TListHandlerStore } from "@/stores";
import { type THandlerComponentProps } from "@/@types/handler-types";

// Types
import type { TAccessHourListData } from "@shared/types/access-hour.type";
import type { IAccessHoursListExtraProps } from "@/components/admin/memberships/access-hours";
import { AccessHourListDto } from "@shared/dtos";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";

interface IAccessHoursModalProps extends THandlerComponentProps<TListHandlerStore<any, any, any>> { }

export default function AccessHoursModal({
  storeKey,
  store,
}: IAccessHoursModalProps) {
  const componentId = useId();
  const [, startTransition] = useTransition();
  const queryClient = useQueryClient();
  const { t } = useI18n();

  if (!store) {
    return null;
  }

  const { action, setAction } = store(useShallow(state => ({
    action: state.action,
    setAction: state.setAction,
  })));

  const ACCESS_HOURS_STORE_KEY = 'access-hour';

  const handleClose = () => {
    startTransition(() => {
      setAction('none');
    });
  };

  const isOpen = action === 'manageAccessHours';

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()} data-component-id={componentId}>
      <DialogContent className="min-w-4xl max-h-[90vh] overflow-y-auto">
        <AppDialog
          title={buildSentence(t, 'manage', 'access', 'hours')}
        >
          <SingleHandler<IAccessHour>
            queryFn={fetchAccessHour}
            initialParams={{}}
            storeKey={ACCESS_HOURS_STORE_KEY}
            SingleComponent={() => null}
            actionComponents={[
              {
                action: 'createOrUpdate',
                comp: AccessHoursForm
              },
            ]}
          />

          <ListHandler<IAccessHour, TAccessHourListData, IAccessHoursListExtraProps, IAccessHour, any>
            queryFn={fetchAccessHours}
            initialParams={{
              sortBy: 'createdAt',
              sortOrder: 'DESC',
            }}
            ListComponent={AccessHoursList}
            deleteFn={deleteAccessHour}
            onDeleteSuccess={() => {
              startTransition(() => {
                queryClient.invalidateQueries({ queryKey: [ACCESS_HOURS_STORE_KEY + "-list"] });
              });
            }}
            dto={AccessHourListDto}
            storeKey={ACCESS_HOURS_STORE_KEY}
            listProps={{}}
          />
        </AppDialog>
      </DialogContent>
    </Dialog>
  );
}

