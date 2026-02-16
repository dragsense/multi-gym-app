import { useQueryClient } from "@tanstack/react-query";

// Types
import type { ICheckin } from '@shared/interfaces/checkin.interface';

// Handlers
import { ListHandler, SingleHandler } from "@/handlers";

// Components
import { CheckinList, CheckinView } from "@/components/admin/checkins";

// Services
import { fetchCheckins, fetchCheckin, deleteCheckin } from '@/services/checkin.api';

// Page Components
import { CheckinForm, CheckinDelete } from "@/page-components/checkin";
import CheckinCheckout from "@/page-components/checkin/checkin-checkout";

// Layouts
import { PageInnerLayout } from "@/layouts";
import type { TCheckinListData } from "@shared/types/checkin.type";
import type { TCheckinViewExtraProps } from "@/components/admin/checkins/view/checkin-view";
import type { ICheckinListExtraProps } from "@/components/admin/checkins/list/checkin-list";
import { CheckinListDto } from "@shared/dtos";
import { getSelectedLocation } from "@/utils/location-storage";

export default function CheckinsPage() {
    const queryClient = useQueryClient();

    const CHECKINS_STORE_KEY = 'checkin';
    const location = getSelectedLocation()

    return (
        <PageInnerLayout Header={<Header />}>
            <SingleHandler<ICheckin>
                queryFn={fetchCheckin}
                initialParams={{
                    _relations: 'user, location, door, snapshots.image',
                    _select: 'user.email, user.firstName, user.lastName',
                }}

                storeKey={CHECKINS_STORE_KEY}
                SingleComponent={CheckinView}
                actionComponents={[
                    {
                        action: 'createOrUpdate',
                        comp: CheckinForm
                    },
                    {
                        action: 'checkout',
                        comp: CheckinCheckout
                    },
                    {
                        action: 'delete',
                        comp: CheckinDelete
                    },
                ]}
            />

            <ListHandler<ICheckin, TCheckinListData, ICheckinListExtraProps, ICheckin, TCheckinViewExtraProps>
                queryFn={(params) => fetchCheckins(params, location?.id)}
                initialParams={{
                    _relations: 'user, location, door,snapshots.image',
                    // _relations: 'user,snapshots.image',
                    _select: 'user.email, user.firstName, user.lastName',
                    sortBy: 'checkInTime',
                    sortOrder: 'DESC',
                }}

                ListComponent={CheckinList}
                deleteFn={deleteCheckin}
                onDeleteSuccess={() => queryClient.invalidateQueries({ queryKey: [CHECKINS_STORE_KEY + "-list"] })}

                dto={CheckinListDto}
                storeKey={CHECKINS_STORE_KEY}
                listProps={{}}
            />
        </PageInnerLayout>
    );
}

const Header = () => null;

