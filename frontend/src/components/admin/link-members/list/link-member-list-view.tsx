// React
import { useId, useCallback, useTransition } from "react";

// Types
import type { ILinkMember } from "@shared/interfaces/link-member.interface";
import type { TListHandlerStore } from "@/stores";

// Components
import { AppCard } from "@/components/layout-ui/app-card";
import { Badge } from "@/components/ui/badge";
import { List as TList } from "@/components/list-ui/list";
import { useShallow } from "zustand/react/shallow";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";
import { Link2, User, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ILinkMemberListProps {
    storeKey: string;
    store: TListHandlerStore<ILinkMember, any, any>;
}

export function LinkMemberList({ storeKey, store }: ILinkMemberListProps) {
    const componentId = useId();
    const { t } = useI18n();
    const [, startTransition] = useTransition();

    const setAction = store(useShallow((state) => state.setAction));

    const pagination = store(useShallow((state) => state.pagination));

    const handleDelete = (id: string) => {
        startTransition(() => {
            setAction('delete', id);
        });
    };

    const handleToggleViewSession = (id: string) => {
        startTransition(() => {
            setAction('toggleViewSession', id);
        });
    };


    const renderItem = useCallback((item: ILinkMember) => {
        const linkedMember = item.linkedMember;

        return (
            <div
                key={item.id}
                data-component-id={componentId}
                className="rounded-lg border border-muted p-5 space-y-3 hover:shadow-md transition-shadow"
            >
                <div className="space-y-4">
                    <div className="flex items-start gap-3">
                        <Link2 className="h-5 w-5 text-muted-foreground" />
                        <div>
                            <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <h4 className="text-sm font-semibold text-foreground">
                                    {linkedMember?.user?.firstName} {linkedMember?.user?.lastName}
                                </h4>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {linkedMember?.user?.email}
                            </p>
                        </div>
                        <Button variant="ghost" className="h-8 w-8 p-0" data-component-id={componentId} onClick={() => handleDelete(item.id)}>
                            <XCircle className="h-4 w-4 text-red-500" />
                        </Button>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleViewSession(item.id)}
                            className="h-auto p-1"
                        >
                            {item.viewSessionCheck ? (
                                <Badge variant="default" className="gap-1 cursor-pointer">
                                    <CheckCircle2 className="h-3 w-3" />
                                    {buildSentence(t, "session", "check", "enabled")}
                                </Badge>
                            ) : (
                                <Badge variant="outline" className="gap-1 cursor-pointer">
                                    <XCircle className="h-3 w-3" />
                                    {buildSentence(t, "session", "check", "disabled")}
                                </Badge>
                            )}
                        </Button>
                    </div>
                </div>

                {item.notes && (
                    <div className="pt-2 border-t">
                        <p className="text-sm text-muted-foreground">{item.notes}</p>
                    </div>
                )}
            </div>
        );
    }, [componentId, t]);


    return (
        <AppCard
            header={
                <div className="flex items-center gap-3">
                    <Link2 className="h-5 w-5 text-muted-foreground" />
                    <div>
                        <h3 className="text-lg font-semibold">{buildSentence(t, "link", "members")}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            {pagination.total} {pagination.total === 1 ? "link" : "links"} total
                        </p>
                    </div>
                </div>
            }
            data-component-id={componentId}
        >
            <TList<ILinkMember>
                listStore={store}
                emptyMessage={buildSentence(t, "no", "link", "members", "found")}
                showPagination={true}
                renderItem={renderItem}
                className="space-y-4"
                rowClassName="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3"
            />
        </AppCard>
    );
}
