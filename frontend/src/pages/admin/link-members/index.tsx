import { useQueryClient } from "@tanstack/react-query";

// Types
import type { ILinkMember } from '@shared/interfaces/link-member.interface';

// Handlers
import { ListHandler } from "@/handlers";

// Components
import LinkMemberList from "@/components/admin/link-members/list/link-member-list";

// Services
import { fetchCurrentUserLinkMembers, deleteLinkMember } from '@/services/link-member.api';

// Layouts
import { PageInnerLayout } from "@/layouts";
import { LinkMemberListDto } from "@shared/dtos";
import type { TLinkMemberListData } from "@shared/types";
import type { ILinkMemberListExtraProps } from "@/components/admin/link-members/list/link-member-list";

export default function LinkMembersPage() {
    const queryClient = useQueryClient();

    const LINK_MEMBERS_STORE_KEY = 'link-member';

    
    return (
        <PageInnerLayout Header={<Header />}>
    
            <ListHandler<ILinkMember, TLinkMemberListData, ILinkMemberListExtraProps>
                queryFn={fetchCurrentUserLinkMembers}
                initialParams={{
                    _relations: 'primaryMember.user, linkedMember.user',
                    _select: 'primaryMember.user.email, primaryMember.user.firstName, primaryMember.user.lastName, linkedMember.user.email, linkedMember.user.firstName, linkedMember.user.lastName',
                    sortBy: 'createdAt',
                    sortOrder: 'DESC',
                }}
                ListComponent={LinkMemberList}
                dto={LinkMemberListDto}
                deleteFn={deleteLinkMember}
                onDeleteSuccess={() => queryClient.invalidateQueries({ queryKey: [LINK_MEMBERS_STORE_KEY + "-list"] })}

                storeKey={LINK_MEMBERS_STORE_KEY}
                listProps={{}}
            />
        </PageInnerLayout>
    );
}

const Header = () => null;
