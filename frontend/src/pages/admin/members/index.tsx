import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

// Types
import type { IMember } from '@shared/interfaces/member.interface';

// Handlers
import { ListHandler, SingleHandler } from "@/handlers";

// Components
import { MemberList, MemberView } from "@/components/admin";

// Services
import { fetchMembers, fetchMember, deleteMember } from '@/services/member.api';

// Page Components
import { MemberForm, ProfileForm } from "@/page-components";

// Layouts
import { PageInnerLayout } from "@/layouts";
import { EUserLevels } from "@shared/enums";
import type { TMemberListData } from "@shared/types";
import type { TMemberViewExtraProps } from "@/components/admin/members/view/member-view";
import type { IMemberListExtraProps } from "@/components/admin/members/list/member-list";
import { MemberListDto } from "@shared/dtos";

export default function MembersPage() {
    const queryClient = useQueryClient();

    const MEMBERS_STORE_KEY = 'member';

    return (
        <PageInnerLayout Header={<Header />}>
            <SingleHandler<IMember>
                queryFn={fetchMember}
                initialParams={{
                    _relations: 'user',
                }}

                storeKey={MEMBERS_STORE_KEY}
                SingleComponent={MemberView}
                actionComponents={[
                    {
                        action: 'createOrUpdate',
                        comp: MemberForm
                    },

                ]}
            />

            <ListHandler<IMember, TMemberListData, IMemberListExtraProps, IMember, TMemberViewExtraProps>
                queryFn={fetchMembers}
                initialParams={{
                    _relations: 'user',
                    _select: 'user.email, user.isActive, user.firstName, user.lastName',
                    sortBy: 'createdAt',
                    sortOrder: 'DESC',
                }}
                ListComponent={MemberList}
                dto={MemberListDto}
                deleteFn={deleteMember}
                onDeleteSuccess={() => queryClient.invalidateQueries({ queryKey: [MEMBERS_STORE_KEY + "-list"] })}

                storeKey={MEMBERS_STORE_KEY}
                listProps={{
                    level: EUserLevels.MEMBER
                }}
                actionComponents={[
                    {
                        action: 'updateProfile',
                        comp: ProfileForm
                    }
                ]}
            />
        </PageInnerLayout>
    );
}

const Header = () => null;
