import { useQueryClient } from "@tanstack/react-query";
import { useId, useTransition } from "react";
import { useShallow } from "zustand/shallow";

// Types
import type { IAccessFeature } from '@shared/interfaces/access-feature.interface';

// Handlers
import { ListHandler, SingleHandler } from "@/handlers";

// Components
import { AccessFeaturesList } from "@/components/admin/memberships/access-features";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AppDialog } from "@/components/layout-ui/app-dialog";

// Services
import { fetchAccessFeatures, fetchAccessFeature, deleteAccessFeature } from '@/services/membership/access-feature.api';

// Page Components
import AccessFeaturesForm from "@/page-components/membership/access-features/access-features-form";

// Stores
import { type TListHandlerStore } from "@/stores";
import { type THandlerComponentProps } from "@/@types/handler-types";

// Types
import type { TAccessFeatureListData } from "@shared/types/access-feature.type";
import type { IAccessFeaturesListExtraProps } from "@/components/admin/memberships/access-features";
import { AccessFeatureListDto } from "@shared/dtos";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";

interface IAccessFeaturesModalProps extends THandlerComponentProps<TListHandlerStore<any, any, any>> { }

export default function AccessFeaturesModal({
  storeKey,
  store,
}: IAccessFeaturesModalProps) {
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

  const ACCESS_FEATURES_STORE_KEY = 'access-feature';

  const handleClose = () => {
    startTransition(() => {
      setAction('none');
    });
  };

  const isOpen = action === 'manageAccessFeatures';

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()} data-component-id={componentId}>
      <DialogContent className="min-w-4xl max-h-[90vh] overflow-y-auto">
        <AppDialog
          title={buildSentence(t, 'manage', 'access', 'features')}
          description={buildSentence(t, 'manage', 'access', 'features', 'for', 'memberships')}
        >
          <SingleHandler<IAccessFeature>
            queryFn={fetchAccessFeature}
            initialParams={{}}
            storeKey={ACCESS_FEATURES_STORE_KEY}
            SingleComponent={() => null}
            actionComponents={[
              {
                action: 'createOrUpdate',
                comp: AccessFeaturesForm
              },
            ]}
          />

          <ListHandler<IAccessFeature, TAccessFeatureListData, IAccessFeaturesListExtraProps, IAccessFeature, any>
            queryFn={fetchAccessFeatures}
            initialParams={{
              sortBy: 'createdAt',
              sortOrder: 'DESC',
            }}
            ListComponent={AccessFeaturesList}
            dto={AccessFeatureListDto}
            deleteFn={deleteAccessFeature}
            onDeleteSuccess={() => {
              startTransition(() => {
                queryClient.invalidateQueries({ queryKey: [ACCESS_FEATURES_STORE_KEY + "-list"] });
              });
            }}
            storeKey={ACCESS_FEATURES_STORE_KEY}
            listProps={{}}
          />
        </AppDialog>
      </DialogContent>
    </Dialog>
  );
}

