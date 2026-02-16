// React & Hooks
import { useId, useTransition, useCallback, useMemo } from "react";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";

// External libraries
import { Plus } from "lucide-react";

// Types
import { type IAutomation } from "@shared/interfaces/automation.interface";

// UI Components
import { Button } from "@/components/ui/button";

// Custom UI Components
import { Table as TTable } from "@/components/table-ui/table";
import { AppCard } from "@/components/layout-ui/app-card";

// Local
import { AutomationFilters } from "./automation-filters";
import { automationItemViews } from "./automation-item-views";

// Stores
import { type TListHandlerStore, type TSingleHandlerStore } from "@/stores";

// Config
import { type TListHandlerComponentProps } from "@/@types/handler-types";
import type { TAutomationListData } from "@shared/types/automation.type";
import { useAuthUser } from "@/hooks/use-auth-user";
import { EUserLevels } from "@shared/enums";

export interface IAutomationListExtraProps { }

interface IAutomationListProps extends TListHandlerComponentProps<
    TListHandlerStore<IAutomation, TAutomationListData, IAutomationListExtraProps>,
    TSingleHandlerStore<IAutomation, any>
> { }

export default function AutomationList({
    storeKey,
    store,
    singleStore
}: IAutomationListProps) {
    // React 19: Essential IDs and transitions
    const componentId = useId();
    const [, startTransition] = useTransition();
    const { t } = useI18n();
    const { user } = useAuthUser();

    if (!store) {
        return <div>{buildSentence(t, 'list', 'store')} "{storeKey}" {buildSentence(t, 'not', 'found')}. {buildSentence(t, 'did', 'you', 'forget', 'to', 'register', 'it')}?</div>;
    }

    if (!singleStore) {
        return <div>{buildSentence(t, 'single', 'store')} "{storeKey}" {buildSentence(t, 'not', 'found')}. {buildSentence(t, 'did', 'you', 'forget', 'to', 'register', 'it')}?</div>;
    }

    const setAction = singleStore(state => state.setAction);
    const setListAction = store(state => state.setAction);

    // React 19: Smooth action transitions - memoized to prevent infinite loops
    const handleCreate = useCallback(() => {
        startTransition(() => {
            setAction('createOrUpdate');
        });
    }, [setAction, startTransition]);

    const handleEdit = useCallback((id: string) => {
        startTransition(() => {
            setAction('createOrUpdate', id);
        });
    }, [setAction, startTransition]);

    const handleDelete = useCallback((id: string) => {
        startTransition(() => {
            setListAction('delete', id);
        });
    }, [setListAction, startTransition]);

    const handleView = useCallback((id: string) => {
        startTransition(() => {
            setAction('view', id);
        });
    }, [setAction, startTransition]);

    const handleToggleStatus = useCallback((id: string) => {
        startTransition(() => {
            setAction('toggleStatus', id);
        });
    }, [setAction, startTransition]);

    const { columns } = useMemo(() => automationItemViews({
        handleEdit: user?.level && user.level <= EUserLevels.ADMIN ? handleEdit : undefined,
        handleDelete: user?.level && user.level <= EUserLevels.ADMIN ? handleDelete : undefined,
        handleView,
        handleToggleStatus: user?.level && user.level <= EUserLevels.ADMIN ? handleToggleStatus : undefined,
        componentId,
    }), [handleEdit, handleDelete, handleView, handleToggleStatus, componentId, user?.level]);

    return (
        <div data-component-id={componentId}>
            <div className="flex flex-1 justify-between items-start md:items-center gap-2 flex-wrap mb-4">
                <AutomationFilters store={store} />
                <div className="flex items-center gap-2">
                    {user?.level && user.level <= EUserLevels.ADMIN && (
                        <Button
                            onClick={handleCreate}
                            data-component-id={componentId}
                        >
                            <Plus /> <span className="hidden sm:inline capitalize">{buildSentence(t, 'new', 'automation')}</span>
                        </Button>
                    )}
                </div>
            </div>

            <AppCard className="px-0">
                <TTable<IAutomation>
                    listStore={store}
                    columns={columns}
                    emptyMessage={buildSentence(t, 'no', 'automations', 'found')}
                    showPagination={true}
                />
            </AppCard>
        </div>
    );
}
