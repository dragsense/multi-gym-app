// React & Hooks
import { useState, useId, useTransition } from "react";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";

// External libraries
import { Plus, Clock, Star } from "lucide-react";

// Types
import { type IMembership } from "@shared/interfaces/membership.interface";

// UI Components
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent } from "@/components/ui/tabs";

// Custom UI Components
import { Table as TTable } from "@/components/table-ui/table";
import { List as TList } from "@/components/list-ui/list";
import { ViewToggle } from "@/components/shared-ui/view-toggle";

import { MembershipFilters } from "./membership-filters";
import { AppCard } from "@/components/layout-ui/app-card";

// Local
import { membershipItemViews as itemViews } from "./membership-item-views";

// Stores
import { type TListHandlerStore, type TSingleHandlerStore } from "@/stores";

// Config
import { type TListHandlerComponentProps } from "@/@types/handler-types";
import type { TMembershipListData } from "@shared/types/membership.type";
import type { TMembershipViewExtraProps } from "../view/membership-view";

export interface IMembershipListExtraProps { }

interface IMembershipListProps extends TListHandlerComponentProps<
    TListHandlerStore<IMembership, TMembershipListData, IMembershipListExtraProps>,
    TSingleHandlerStore<IMembership, TMembershipViewExtraProps>
> { }

type ViewType = "table" | "list";

export default function MembershipList({
    storeKey,
    store,
    singleStore
}: IMembershipListProps) {
    // React 19: Essential IDs and transitions
    const componentId = useId();
    const [, startTransition] = useTransition();
    const { t } = useI18n();

    if (!store) {
        return `${buildSentence(t, 'list', 'store')} "${storeKey}" ${buildSentence(t, 'not', 'found')}. ${buildSentence(t, 'did', 'you', 'forget', 'to', 'register', 'it')}?`;
    }

    if (!singleStore) {
        return `${buildSentence(t, 'single', 'store')} "${storeKey}" ${buildSentence(t, 'not', 'found')}. ${buildSentence(t, 'did', 'you', 'forget', 'to', 'register', 'it')}?`;
    }

    const setAction = singleStore(state => state.setAction);
    const setListAction = store(state => state.setAction);

    const [currentView, setCurrentView] = useState<ViewType>("table");

    // React 19: Smooth action transitions
    const handleCreate = () => {
        startTransition(() => {
            setAction('createOrUpdate');
        });
    };

    const handleEdit = (id: string) => {
        startTransition(() => {
            setAction('createOrUpdate', id);
        });
    }

    const handleDelete = (id: string) => {
        startTransition(() => {
            setAction('delete', id);
        });
    }

    const handleView = (id: string) => {
        startTransition(() => {
            setAction('view', id);
        });
    }

    const handleManageAccessHours = () => {
        startTransition(() => {
            setListAction('manageAccessHours');
        });
    }

    const handleManageAccessFeatures = () => {
        startTransition(() => {
            setListAction('manageAccessFeatures');
        });
    }

    const { columns, listItem } = itemViews({
        handleEdit,
        handleDelete,
        handleView,
    });

    return (
        <Tabs value={currentView} onValueChange={(value) => setCurrentView(value as ViewType)} data-component-id={componentId}>
            <div className="flex flex-1 justify-between items-start md:items-center gap-2 flex-wrap">
                <MembershipFilters store={store} />
                <div className="flex items-center gap-2">
                    <ViewToggle componentId={componentId} />
                    <Button
                        variant="outline"
                        onClick={handleManageAccessHours}
                        data-component-id={componentId}
                    >
                        <Clock className="h-4 w-4 mr-2" />
                        <span className="hidden sm:inline capitalize">{buildSentence(t, 'manage', 'access', 'hours')}</span>
                    </Button>
                    <Button
                        variant="outline"
                        onClick={handleManageAccessFeatures}
                        data-component-id={componentId}
                    >
                        <Star className="h-4 w-4 mr-2" />
                        <span className="hidden sm:inline capitalize">{buildSentence(t, 'manage', 'access', 'features')}</span>
                    </Button>
                    <Button
                        onClick={handleCreate}
                        data-component-id={componentId}
                    >
                        <Plus /> <span className="hidden sm:inline capitalize">{buildSentence(t, 'add', 'membership')}</span>
                    </Button>
                </div>
            </div>

            <TabsContent value="table">
                <AppCard className="px-0">
                    <TTable<IMembership>
                        listStore={store}
                        columns={columns}
                        emptyMessage={buildSentence(t, 'no', 'memberships', 'found')}
                        showPagination={true}
                    />
                </AppCard>
            </TabsContent>

            <TabsContent value="list">
                <div>
                    <TList<IMembership>
                        listStore={store}
                        emptyMessage={buildSentence(t, 'no', 'memberships', 'found')}
                        showPagination={true}
                        renderItem={listItem}
                    />
                </div>
            </TabsContent>
        </Tabs>
    );
}

