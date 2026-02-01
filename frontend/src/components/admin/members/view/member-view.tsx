// External Libraries
import { useShallow } from 'zustand/shallow';
import { useId, useMemo, useTransition, useState } from 'react';

// Components
import { Badge } from "@/components/ui/badge";
import { AppCard } from "@/components/layout-ui/app-card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AppDialog } from "@/components/layout-ui/app-dialog";
import { Button } from "@/components/ui/button";
import { 
  User, 
  MapPin, 
  Phone, 
  Target, 
  Activity, 
  Heart, 
  Mail, 
  Calendar,
  CreditCard,
  AlertCircle,
  FileText,
  Star,
  Building2,
  Globe
} from "lucide-react";

// Types
import { type IMember } from "@shared/interfaces/member.interface";

// Stores
import { type TSingleHandlerStore } from "@/stores";
import { type THandlerComponentProps } from "@/@types/handler-types";

// Hooks & Utils
import { useUserSettings } from "@/hooks/use-user-settings";
import { useUserProfile } from "@/hooks/use-user-profile";
import { formatDate } from "@/lib/utils";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";
import { UserProfileInfo } from '@/components/admin/users/view/user-profile-info';

export type TMemberViewExtraProps = {
    level: number;
}

interface IMemberViewProps extends THandlerComponentProps<TSingleHandlerStore<IMember, TMemberViewExtraProps>> {
}

export default function MemberView({ storeKey, store }: IMemberViewProps) {
    // React 19: Essential IDs and transitions
    const componentId = useId();
    const [, startTransition] = useTransition();
    const { t } = useI18n();

    if (!store) {
        return <div>{buildSentence(t, 'single', 'store')} "{storeKey}" {buildSentence(t, 'not', 'found')}. {buildSentence(t, 'did', 'you', 'forget', 'to', 'register', 'it')}?</div>;
    }

    const { response: member, action, reset } = store(useShallow(state => ({
        response: state.response,
        action: state.action,
        reset: state.reset,
    })));

    if (!member) {
        return null;
    }

    const handleCloseView = () => {
        startTransition(() => reset());
    };

    return (
        <Dialog open={action === 'view'} onOpenChange={handleCloseView} data-component-id={componentId}>
            <DialogContent className="min-w-4xl max-h-[90vh] overflow-y-auto">
                <AppDialog
                    title={buildSentence(t, 'member', 'details')}
                    description={buildSentence(t, 'view', 'detailed', 'information', 'about', 'this', 'member')}
                >
                    <ClientDetailContent member={member} />
                </AppDialog>
            </DialogContent>
        </Dialog>
    );
}

interface IMemberDetailContentProps {
    member: IMember;
}

function ClientDetailContent({ member }: IMemberDetailContentProps) {
    // React 19: Essential IDs
    const componentId = useId();
    const { t } = useI18n();
    const { settings } = useUserSettings();

    const user = member.user;
    const userId = user?.id;

    // React 19: Memoized dates for better performance
    const clientCreationDate = useMemo(() =>
        member.createdAt ? formatDate(member.createdAt, settings) : '',
        [member.createdAt, settings]
    );

    const dateOfBirth = useMemo(() =>
        user?.dateOfBirth ? formatDate(user.dateOfBirth, settings) : '',
        [user?.dateOfBirth, settings]
    );

    // Convert fitness level to number for star display
    const fitnessLevelNumber = useMemo(() => {
        if (!member.fitnessLevel) return 0;
        const num = parseInt(member.fitnessLevel, 10);
        return isNaN(num) ? 0 : num;
    }, [member.fitnessLevel]);

    return (
        <div className="space-y-4" data-component-id={componentId}>
            {/* Header Card */}
            <AppCard
                header={
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3 mb-2">
                            <h2 className="text-2xl font-semibold truncate">
                                {user?.firstName} {user?.lastName}
                            </h2>
                            <Badge variant={member.isActive ? "default" : "secondary"}>
                                {member.isActive ? t('active') : t('inactive')}
                            </Badge>
                        </div>
                    </div>
                }
            >
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                        <Mail className="w-4 h-4" />
                        <span className="font-medium text-foreground">{user?.email}</span>
                    </div>
                    <span>•</span>
                    <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" />
                        <span>{buildSentence(t, 'member', 'since')} {clientCreationDate}</span>
                    </div>
                </div>
            </AppCard>

            {/* Member Details and Personal Information - Two Columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Member Information */}
                <div className="space-y-4">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                        {buildSentence(t, 'member', 'information')}
                    </h3>
                    <div className="space-y-3">
                        {member.goal && (
                            <div className="flex items-center gap-3">
                                <Target className="w-4 h-4 text-muted-foreground shrink-0" />
                                <div>
                                    <div className="text-xs text-muted-foreground">{t('goal')}</div>
                                    <div className="font-medium">{member.goal}</div>
                                </div>
                            </div>
                        )}
                        {member.fitnessLevel && (
                            <div className="flex items-center gap-3">
                                <Activity className="w-4 h-4 text-muted-foreground shrink-0" />
                                <div>
                                    <div className="text-xs text-muted-foreground mb-1">
                                        {buildSentence(t, 'fitness', 'level')}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {Array.from({ length: 5 }, (_, index) => {
                                            const starValue = index + 1;
                                            const isFilled = starValue <= fitnessLevelNumber;
                                            return (
                                                <Star
                                                    key={index}
                                                    className={`h-4 w-4 ${
                                                        isFilled
                                                            ? "fill-yellow-400 text-yellow-400"
                                                            : "fill-none text-muted-foreground"
                                                    }`}
                                                />
                                            );
                                        })}
                                        <span className="ml-2 text-sm text-muted-foreground">
                                            ({fitnessLevelNumber}/5)
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                        {member.medicalConditions && (
                            <div className="flex items-start gap-3">
                                <Heart className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                                <div>
                                    <div className="text-xs text-muted-foreground mb-1">
                                        {buildSentence(t, 'medical', 'conditions')}
                                    </div>
                                    <div className="text-sm">{member.medicalConditions}</div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Personal Information */}
                <div className="space-y-4">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                        {buildSentence(t, 'personal', 'information')}
                    </h3>
                    <div className="space-y-3">
                        {dateOfBirth && (
                            <div className="flex items-center gap-3">
                                <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                                <div>
                                    <div className="text-xs text-muted-foreground">
                                        {buildSentence(t, 'date', 'of', 'birth')}
                                    </div>
                                    <div className="font-medium">{dateOfBirth}</div>
                                </div>
                            </div>
                        )}
                        {user?.gender && (
                            <div className="flex items-center gap-3">
                                <User className="w-4 h-4 text-muted-foreground shrink-0" />
                                <div>
                                    <div className="text-xs text-muted-foreground">{t('gender')}</div>
                                    <div className="font-medium capitalize">{user.gender}</div>
                                </div>
                            </div>
                        )}
                     
                    </div>
                </div>
            </div>

            {/* Profile Information and Emergency Contact - Two Columns */}
            <div>
                {/* Profile Information */}
               <UserProfileInfo userId={userId} />
            </div>
        </div>
    );
}
