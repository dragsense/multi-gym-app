import { useQueryClient } from "@tanstack/react-query";

// Types
import type { IUser } from '@shared/interfaces/user.interface';

// Handlers
import { ListHandler, SingleHandler } from "@/handlers";

// Components
import { StaffList, StaffView } from "@/components/admin/staff";

// Services
import { fetchStaff, fetchStaffMember, deleteStaff } from '@/services/staff.api';

// Page Components
import { StaffForm } from "@/page-components/staff";
import { ProfileForm } from "@/page-components";

// Layouts
import { PageInnerLayout } from "@/layouts";
import { EUserLevels } from "@shared/enums";
import type { IStaffListExtraProps } from "@/components/admin/staff/list/staff-list";
import type { TStaffListData } from "@shared/types/staff.type";
import { StaffListDto } from "@shared/dtos";
import type { IStaff } from "@shared/interfaces/staff.interface";

export default function StaffPage() {
    const queryClient = useQueryClient();

    const STAFF_STORE_KEY = 'staff';

    return (
        <PageInnerLayout Header={<Header />}>
            <SingleHandler<IStaff>
                queryFn={fetchStaffMember}
                initialParams={{
                    _relations: "user.roles.role, user.permissions.permission",
                    _select: "user.roles.id, user.roles.role.name, user.permissions.id, user.permissions.permission.name, user.permissions.permission.displayName",
                }}
                storeKey={STAFF_STORE_KEY}
                SingleComponent={StaffView}
                actionComponents={[
                    {
                        action: 'createOrUpdate',
                        comp: StaffForm
                    },
                ]}
            />

            <ListHandler<IStaff, TStaffListData, IStaffListExtraProps>
                queryFn={fetchStaff}
                initialParams={{
                    _relations: "user.roles.role",
                    _select: "user.roles.role.name",
                    sortBy: 'createdAt',
                    sortOrder: 'DESC',
                }}
                deleteFn={deleteStaff}
                onDeleteSuccess={() => queryClient.invalidateQueries({ queryKey: [STAFF_STORE_KEY + "-list"] })}

                ListComponent={StaffList}
                dto={StaffListDto}
                storeKey={STAFF_STORE_KEY}
                listProps={{}}
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
