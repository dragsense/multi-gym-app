import { useQueryClient } from "@tanstack/react-query";

// Types
import type { IReferralLink } from "@shared/interfaces/referral-link.interface";

// Handlers
import { ListHandler, SingleHandler } from "@/handlers";

// Components
import { ReferralLinkList } from "@/components/admin/referral-links/list";

// Services
import { fetchReferralLinks, fetchReferralLink, deleteReferralLink } from '@/services/referral-link.api';

// Page Components
import { ReferralLinkForm } from "@/page-components/referral-link/index";

// Layouts
import { PageInnerLayout } from "@/layouts";
import type { IReferralListExtraProps } from "@/components/admin/referral-links/list/referral-link-list";
import type { TReferralLinkListData } from "@shared/types/referral-link.type";
import { ReferralLinkListDto } from "@shared/dtos";

// Create a simple view component interface
interface TReferralLinkViewExtraProps {
    // Add any extra props if needed
}

export default function ReferralsPage() {
    const queryClient = useQueryClient();

    const REFERRALS_STORE_KEY = 'referral';

    return (
        <PageInnerLayout Header={<Header />}>
            <SingleHandler<IReferralLink, TReferralLinkViewExtraProps>
                queryFn={fetchReferralLink}
                initialParams={{
                    _relations: 'createdBy, createdBy.profile',
                    _select: 'createdBy.email, createdBy.profile.firstName, createdBy.profile.lastName',
                }}
                deleteFn={deleteReferralLink}
                storeKey={REFERRALS_STORE_KEY}
                onDeleteSuccess={() => queryClient.invalidateQueries({ queryKey: [REFERRALS_STORE_KEY + "-list"] })}
                SingleComponent={() => null}
                actionComponents={[
                    {
                        action: 'createOrUpdate',
                        comp: ReferralLinkForm
                    }
                ]}
            />

            <ListHandler<IReferralLink, TReferralLinkListData, IReferralListExtraProps, IReferralLink, TReferralLinkViewExtraProps>
                queryFn={fetchReferralLinks}

                ListComponent={ReferralLinkList}
                dto={ReferralLinkListDto}
                storeKey={REFERRALS_STORE_KEY}
                listProps={{}}
            />
        </PageInnerLayout>
    );
}


const Header = () => null;
