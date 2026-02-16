// External Libraries
import { useShallow } from 'zustand/shallow';
import { useId, useTransition } from 'react';

// Components
import { AppCard } from "@/components/layout-ui/app-card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AppDialog } from "@/components/layout-ui/app-dialog";

// Types
import { type ILinkMember } from "@shared/interfaces/link-member.interface";

// Stores
import { type TSingleHandlerStore } from "@/stores";
import { type THandlerComponentProps } from "@/@types/handler-types";

// Hooks & Utils
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";

export type TLinkMemberViewExtraProps = {};

interface ILinkMemberViewProps extends THandlerComponentProps<TSingleHandlerStore<ILinkMember, TLinkMemberViewExtraProps>> {
}

export default function LinkMemberView({ storeKey, store }: ILinkMemberViewProps) {
    // React 19: Essential IDs and transitions
    const componentId = useId();
    const [, startTransition] = useTransition();
    const { t } = useI18n();

    if (!store) {
        return <div>{buildSentence(t, 'single', 'store')} "{storeKey}" {buildSentence(t, 'not', 'found')}. {buildSentence(t, 'did', 'you', 'forget', 'to', 'register', 'it')}?</div>;
    }

    const { response: linkMember, action, reset } = store(useShallow(state => ({
        response: state.response,
        action: state.action,
        reset: state.reset,
    })));

    if (!linkMember) {
        return null;
    }

    const handleCloseView = () => {
        startTransition(() => reset());
    };

    return (
        <Dialog open={action === 'view'} onOpenChange={handleCloseView} data-component-id={componentId}>
            <DialogContent className="min-w-4xl max-h-[90vh] overflow-y-auto">
                <AppDialog
                    title={buildSentence(t, 'link', 'member', 'details')}
                    description={buildSentence(t, 'view', 'detailed', 'information', 'about', 'this', 'link', 'member')}
                >
                    <LinkMemberDetailContent linkMember={linkMember} />
                </AppDialog>
            </DialogContent>
        </Dialog>
    );
}

interface ILinkMemberDetailContentProps {
    linkMember: ILinkMember;
}

function LinkMemberDetailContent({ linkMember }: ILinkMemberDetailContentProps) {
    // React 19: Essential IDs
    const componentId = useId();
    const { t } = useI18n();

    const primaryMember = linkMember.primaryMember;
    const linkedMember = linkMember.linkedMember;

    return (
        <div className="space-y-4" data-component-id={componentId}>
            {/* Header Card */}
            <AppCard
                header={
                    <div className="flex items-start justify-between gap-4">
                        <h2 className="text-2xl font-semibold truncate">
                            {buildSentence(t, 'link', 'member', 'details')}
                        </h2>
                    </div>
                }
            >
                <div className="space-y-4">
                    {/* Primary Member */}
                    {primaryMember && (
                        <div className="space-y-2">
                            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                                {buildSentence(t, 'primary', 'member')}
                            </h3>
                            <div className="text-sm">
                                <div className="font-medium">
                                    {primaryMember.user?.firstName} {primaryMember.user?.lastName}
                                </div>
                                <div className="text-muted-foreground">
                                    {primaryMember.user?.email}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Linked Member */}
                    {linkedMember && (
                        <div className="space-y-2">
                            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                                {buildSentence(t, 'linked', 'member')}
                            </h3>
                            <div className="text-sm">
                                <div className="font-medium">
                                    {linkedMember.user?.firstName} {linkedMember.user?.lastName}
                                </div>
                                <div className="text-muted-foreground">
                                    {linkedMember.user?.email}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* View Session Check */}
                    <div className="space-y-2">
                        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                            {buildSentence(t, 'session', 'check')}
                        </h3>
                        <div className="text-sm">
                            {linkMember.viewSessionCheck ? buildSentence(t, 'enabled') : buildSentence(t, 'disabled')}
                        </div>
                    </div>

                    {/* Notes */}
                    {linkMember.notes && (
                        <div className="space-y-2">
                            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                                {buildSentence(t, 'notes')}
                            </h3>
                            <div className="text-sm">{linkMember.notes}</div>
                        </div>
                    )}
                </div>
            </AppCard>
        </div>
    );
}
