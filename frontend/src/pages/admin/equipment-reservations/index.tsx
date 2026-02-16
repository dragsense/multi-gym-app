import { useQueryClient } from "@tanstack/react-query";

// Types
import type { IEquipmentReservation } from '@shared/interfaces/equipment-reservation.interface';

// Handlers
import { ListHandler, SingleHandler } from "@/handlers";

// Components
import { EquipmentReservationList, EquipmentReservationView } from "@/components/admin/equipment-reservations";

// Services
import { fetchEquipmentReservations, fetchEquipmentReservation, deleteEquipmentReservation } from '@/services/equipment-reservation.api';

// Page Components
import { EquipmentReservationForm, EquipmentReservationDelete } from "@/page-components/equipment-reservation";

// Layouts
import { PageInnerLayout } from "@/layouts";
import type { TEquipmentReservationListData } from "@shared/types/equipment-reservation.type";
import type { IEquipmentReservationListExtraProps } from "@/components/admin/equipment-reservations";
import { EquipmentReservationListDto } from "@shared/dtos";

export default function EquipmentReservationsPage() {
    const queryClient = useQueryClient();
    const RESERVATIONS_STORE_KEY = 'equipment-reservation';

    return (
        <PageInnerLayout Header={<Header />}>
            <SingleHandler<IEquipmentReservation>
                queryFn={fetchEquipmentReservation}
                initialParams={{
                    _relations: 'equipment, equipment.equipmentType',
                }}
                storeKey={RESERVATIONS_STORE_KEY}
                SingleComponent={EquipmentReservationView}
                actionComponents={[
                    {
                        action: 'createOrUpdate',
                        comp: EquipmentReservationForm
                    },
                ]}
            />

            <ListHandler<IEquipmentReservation, TEquipmentReservationListData, IEquipmentReservationListExtraProps, IEquipmentReservation, any>
                queryFn={fetchEquipmentReservations}
                initialParams={{
                    _relations: 'equipment, equipment.equipmentType',
                    sortBy: 'createdAt',
                    sortOrder: 'DESC',
                }}
                ListComponent={EquipmentReservationList}
                deleteFn={deleteEquipmentReservation}
                onDeleteSuccess={() => queryClient.invalidateQueries({ queryKey: [RESERVATIONS_STORE_KEY + "-list"] })}
                dto={EquipmentReservationListDto}
                storeKey={RESERVATIONS_STORE_KEY}
                listProps={{}}
            />
        </PageInnerLayout>
    );
}

function Header() {
    return null;
}
