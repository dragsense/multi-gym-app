import { useQueryClient } from "@tanstack/react-query";

// Types
import type { IAutomation } from '@shared/interfaces/automation.interface';

// Handlers
import { ListHandler, SingleHandler } from "@/handlers";

// Components
import { AutomationList, AutomationView } from "@/components/admin/automation";

// Services
import { fetchAutomations, fetchAutomation, deleteAutomation } from '@/services/automation.api';

// Page Components
import { AutomationForm, AutomationDelete, AutomationStatusUpdate } from "@/page-components/automation";

// Layouts
import { PageInnerLayout } from "@/layouts";
import type { TAutomationListData } from "@shared/types/automation.type";
import type { TAutomationViewExtraProps } from "@/components/admin/automation/view/automation-view";
import type { IAutomationListExtraProps } from "@/components/admin/automation/list/automation-list";
import { AutomationListDto } from "@shared/dtos";

export default function AutomationPage() {
    const queryClient = useQueryClient();

    const AUTOMATION_STORE_KEY = 'automation';

    return (
        <PageInnerLayout Header={<Header />}>
            <SingleHandler<IAutomation>
                queryFn={fetchAutomation}
                initialParams={{
                    _relations: 'emailTemplate',
                }}
                storeKey={AUTOMATION_STORE_KEY}
                SingleComponent={AutomationView}
                actionComponents={[
                    {
                        action: 'createOrUpdate',
                        comp: AutomationForm
                    },
                    {
                        action: 'delete',
                        comp: AutomationDelete
                    },
                    {
                        action: 'toggleStatus',
                        comp: AutomationStatusUpdate
                    },
                ]}
            />

            <ListHandler<IAutomation, TAutomationListData, IAutomationListExtraProps, IAutomation, TAutomationViewExtraProps>
                queryFn={(params) => fetchAutomations(params)}
                initialParams={{
                    _relations: 'emailTemplate',
                    sortBy: 'createdAt',
                    sortOrder: 'DESC',
                }}

                ListComponent={AutomationList}
                deleteFn={deleteAutomation}
                onDeleteSuccess={() => queryClient.invalidateQueries({ queryKey: [AUTOMATION_STORE_KEY + "-list"] })}

                dto={AutomationListDto}
                storeKey={AUTOMATION_STORE_KEY}
                listProps={{}}
            />
        </PageInnerLayout>
    );
}

const Header = () => null;
