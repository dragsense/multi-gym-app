import { useQueryClient } from "@tanstack/react-query";
import { useId, useTransition } from "react";
import { useShallow } from "zustand/shallow";

// Types
import type { IDoor } from '@shared/interfaces/door.interface';
import type { ILocation } from '@shared/interfaces/location.interface';

// Handlers
import { ListHandler, SingleHandler } from "@/handlers";

// Components
import { DoorsList } from "@/components/admin/locations/doors";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AppDialog } from "@/components/layout-ui/app-dialog";

// Services
import { fetchDoors, fetchDoorsByLocation, fetchDoor, deleteDoor } from '@/services/location/door.api';

// Page Components
import DoorsForm from "@/page-components/location/doors/doors-form";

// Stores
import { type TListHandlerStore } from "@/stores";
import { type THandlerComponentProps } from "@/@types/handler-types";

// Types
import type { TDoorListData } from "@shared/types/door.type";
import type { IDoorsListExtraProps } from "@/components/admin/locations/doors";
import type { TDoorsExtraProps } from "@/page-components/location/doors/doors-form";
import { DoorListDto } from "@shared/dtos";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";

interface IDoorsModalProps extends THandlerComponentProps<TListHandlerStore<any, any, any>> { }

export default function DoorsModal({
    storeKey,
    store,
}: IDoorsModalProps) {
    const componentId = useId();
    const [, startTransition] = useTransition();
    const queryClient = useQueryClient();
    const { t } = useI18n();

    if (!store) {
        return null;
    }

    const { action, setAction, extra } = store(useShallow(state => ({
        action: state.action,
        setAction: state.setAction,
        extra: state.extra,
    })));

    const DOORS_STORE_KEY = 'door';

    // Get locationId from the location list store's extra
    const locationId = extra?.locationId;

    const handleClose = () => {
        startTransition(() => {
            setAction('none');
        });
    };

    const isOpen = action === 'manageDoors';

    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()} data-component-id={componentId}>
            <DialogContent className="min-w-4xl max-h-[90vh] overflow-y-auto">
                <AppDialog
                    title={buildSentence(t, 'manage', 'doors')}
                    description={buildSentence(t, 'manage', 'doors', 'for', 'location')}
                >
                    <SingleHandler<IDoor, TDoorsExtraProps>
                        queryFn={fetchDoor}
                        initialParams={{}}
                        storeKey={DOORS_STORE_KEY}
                        SingleComponent={() => null}
                        actionComponents={[
                            {
                                action: 'createOrUpdate',
                                comp: DoorsForm
                            },
                        ]}
                        singleProps={{
                            locationId: locationId,
                        }}
                    />

                    <ListHandler<IDoor, TDoorListData, IDoorsListExtraProps, IDoor, any>
                        queryFn={(params) => {
                            if (locationId) {
                                return fetchDoorsByLocation(locationId, params);
                            }
                            return new Promise((resolve, reject) => reject(new Error('Location ID is required')));
                        }}
                        initialParams={{
                            sortBy: 'createdAt',
                            sortOrder: 'DESC',
                            _relations: 'deviceReader',
                        }}
                        ListComponent={DoorsList}
                        dto={DoorListDto}
                        deleteFn={deleteDoor}
                        onDeleteSuccess={() => {
                            startTransition(() => {
                                queryClient.invalidateQueries({ queryKey: [DOORS_STORE_KEY + "-list"] });
                            });
                        }}
                        storeKey={DOORS_STORE_KEY}
                        listProps={{}}
                    />
                </AppDialog>
            </DialogContent>
        </Dialog>
    );
}
