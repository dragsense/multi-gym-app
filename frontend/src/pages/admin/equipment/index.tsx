import { useQueryClient } from "@tanstack/react-query";

// Types
import type { IEquipment, TEquipmentResponse } from '@shared/interfaces/equipment-reservation.interface';

// Handlers
import { ListHandler, SingleHandler } from "@/handlers";

// Components
import { EquipmentList, EquipmentView } from "@/components/admin/equipment";

// Services
import { fetchEquipment, fetchEquipmentItem, deleteEquipment } from '@/services/equipment.api';

// Page Components
import { EquipmentForm } from "@/page-components/equipment";
import { EquipmentTypesModal } from "@/page-components/equipment/equipment-type";

// Layouts
import { PageInnerLayout } from "@/layouts";
import type { TEquipmentListData } from "@shared/types/equipment-reservation.type";
import type { IEquipmentListExtraProps } from "@/components/admin/equipment";
import { EquipmentListDto } from "@shared/dtos";
import { getSelectedLocation } from "@/utils/location-storage";

export default function EquipmentPage() {
    const queryClient = useQueryClient();
    const EQUIPMENT_STORE_KEY = 'equipment';
    const location = getSelectedLocation();

    return (
        <PageInnerLayout Header={<Header />}>
            <SingleHandler<IEquipment, TEquipmentResponse>
                queryFn={fetchEquipmentItem}
                initialParams={{
                    _relations: 'equipmentType, reservations',
                }}
                storeKey={EQUIPMENT_STORE_KEY}
                SingleComponent={EquipmentView}
                actionComponents={[
                    {
                        action: 'createOrUpdate',
                        comp: EquipmentForm
                    }
                ]}
            />

            <ListHandler<IEquipment, TEquipmentListData, IEquipmentListExtraProps, IEquipment, any>
                queryFn={(params) => fetchEquipment(params, location?.id)}
                initialParams={{
                    _relations: 'equipmentType',
                    sortBy: 'createdAt',
                    sortOrder: 'DESC',
                }}
                ListComponent={EquipmentList}
                deleteFn={deleteEquipment}
                onDeleteSuccess={() => queryClient.invalidateQueries({ queryKey: [EQUIPMENT_STORE_KEY + "-list"] })}
                dto={EquipmentListDto}
                storeKey={EQUIPMENT_STORE_KEY}
                listProps={{}}
                actionComponents={[
                    {
                        action: 'manageEquipmentTypes',
                        comp: EquipmentTypesModal
                    },
                ]}
            />
        </PageInnerLayout>
    );
}

function Header() {
    return null;
}
