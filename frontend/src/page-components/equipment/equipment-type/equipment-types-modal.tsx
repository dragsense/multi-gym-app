import { useQueryClient } from "@tanstack/react-query";
import { useId, useTransition } from "react";
import { useShallow } from "zustand/shallow";

// Types
import type { IEquipmentType } from '@shared/interfaces/equipment-reservation.interface';

// Handlers
import { ListHandler, SingleHandler } from "@/handlers";

// Components
import { EquipmentTypesList } from "@/components/admin/equipment-types";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AppDialog } from "@/components/layout-ui/app-dialog";

// Services
import { fetchEquipmentTypes, fetchEquipmentType, deleteEquipmentType } from '@/services/equipment-type.api';

// Page Components
import EquipmentTypeForm from "@/page-components/equipment/equipment-type/equipment-type-form";

// Stores
import { type TListHandlerStore } from "@/stores";
import { type THandlerComponentProps } from "@/@types/handler-types";

// Types
import type { TEquipmentTypeListData } from "@shared/types/equipment-reservation.type";
import type { IEquipmentTypesListExtraProps } from "@/components/admin/equipment-types";
import { EquipmentTypeListDto } from "@shared/dtos";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";

interface IEquipmentTypesModalProps extends THandlerComponentProps<TListHandlerStore<any, any, any>> { }

export default function EquipmentTypesModal({
  storeKey,
  store,
}: IEquipmentTypesModalProps) {
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

  const EQUIPMENT_TYPES_STORE_KEY = 'equipment-type';

  const handleClose = () => {
    startTransition(() => {
      setAction('none');
    });
  };

  const isOpen = action === 'manageEquipmentTypes';

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()} data-component-id={componentId}>
      <DialogContent className="min-w-4xl max-h-[90vh] overflow-y-auto">
        <AppDialog
          title={buildSentence(t, 'manage', 'equipment', 'types')}
          description={buildSentence(t, 'manage', 'equipment', 'types', 'for', 'equipment', 'reservations')}
        >
          <SingleHandler<IEquipmentType>
            queryFn={fetchEquipmentType}
            initialParams={{}}
            storeKey={EQUIPMENT_TYPES_STORE_KEY}
            SingleComponent={() => null}
            actionComponents={[
              {
                action: 'createOrUpdate',
                comp: EquipmentTypeForm
              },
            ]}
          />

          <ListHandler<IEquipmentType, TEquipmentTypeListData, IEquipmentTypesListExtraProps, IEquipmentType, any>
            queryFn={fetchEquipmentTypes}
            initialParams={{
              sortBy: 'createdAt',
              sortOrder: 'DESC',
            }}
            ListComponent={EquipmentTypesList}
            dto={EquipmentTypeListDto}
            deleteFn={deleteEquipmentType}
            onDeleteSuccess={() => {
              startTransition(() => {
                queryClient.invalidateQueries({ queryKey: [EQUIPMENT_TYPES_STORE_KEY + "-list"] });
              });
            }}
            storeKey={EQUIPMENT_TYPES_STORE_KEY}
            listProps={{}}
          />
        </AppDialog>
      </DialogContent>
    </Dialog>
  );
}
