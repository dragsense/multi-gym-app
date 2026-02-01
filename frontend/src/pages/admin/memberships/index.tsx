import { useQueryClient } from "@tanstack/react-query";

// Types
import type { IMembership } from '@shared/interfaces/membership.interface';

// Handlers
import { ListHandler, SingleHandler } from "@/handlers";

// Components
import { MembershipList, MembershipView } from "@/components/admin";

// Services
import { fetchMemberships, fetchMembership, deleteMembership } from '@/services/membership/membership.api';

// Page Components
import { MembershipForm, AccessHoursModal, AccessFeaturesModal } from "@/page-components";
import MembershipTermsAndConditions from "@/page-components/membership/membership-terms-and-conditions";

// Layouts
import { PageInnerLayout } from "@/layouts";
import type { TMembershipListData } from "@shared/types/membership.type";
import type { TMembershipViewExtraProps } from "@/components/admin/memberships/view/membership-view";
import type { IMembershipListExtraProps } from "@/components/admin/memberships/list/membership-list";
import { MembershipListDto } from "@shared/dtos";

export default function MembershipsPage() {
    const queryClient = useQueryClient();

    const MEMBERSHIPS_STORE_KEY = 'membership';

    return (
        <PageInnerLayout Header={<Header />}>
            <SingleHandler<IMembership>
                queryFn={fetchMembership}
                initialParams={{
                    _relations: 'doors',
                }}
                storeKey={MEMBERSHIPS_STORE_KEY}
                SingleComponent={MembershipView}
                actionComponents={[
                    {
                        action: 'createOrUpdate',
                        comp: MembershipForm
                    },
                    {
                        action: 'updateTermsAndConditions',
                        comp: MembershipTermsAndConditions
                    },
                ]}
            />

            <ListHandler<IMembership, TMembershipListData, IMembershipListExtraProps, IMembership, TMembershipViewExtraProps>
                queryFn={fetchMemberships}
                initialParams={{
                    sortBy: 'createdAt',
                    sortOrder: 'DESC',
                    _select: 'id, enabled, title, price, pricePeriod, billingFrequency, sortOrder, calculatedPrice',
                }}
                ListComponent={MembershipList}
                deleteFn={deleteMembership}
                onDeleteSuccess={() => queryClient.invalidateQueries({ queryKey: [MEMBERSHIPS_STORE_KEY + "-list"] })}

                dto={MembershipListDto}
                storeKey={MEMBERSHIPS_STORE_KEY}
                listProps={{}}
                actionComponents={[
                    {
                        action: 'manageAccessHours',
                        comp: AccessHoursModal
                    },
                    {
                        action: 'manageAccessFeatures',
                        comp: AccessFeaturesModal
                    },
                ]}
            />
        </PageInnerLayout>
    );
}

const Header = () => null;

