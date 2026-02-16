// External Libraries
import { useShallow } from 'zustand/shallow';
import { useId, useMemo, useTransition } from 'react';

// Components
import { Badge } from "@/components/ui/badge";
import { AppCard } from "@/components/layout-ui/app-card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AppDialog } from "@/components/layout-ui/app-dialog";
import { User, Mail, Calendar, Building2, Phone, MapPin, Globe } from "lucide-react";

// Types
import { type IUser } from "@shared/interfaces/user.interface";
import { EUserLevels } from "@shared/enums/user.enum";

// Stores
import { type TSingleHandlerStore } from "@/stores";
import { type THandlerComponentProps } from "@/@types/handler-types";

// Hooks & Utils
import { useUserSettings, useUserSettingsById } from "@/hooks/use-user-settings";
import { useAuthUser } from "@/hooks/use-auth-user";
import { formatDate } from "@/lib/utils";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";
import { getUserRole } from "@shared/lib/utils";
import { UserProfileInfo } from "./user-profile-info";


export type TUserViewExtraProps = {
    level: number;
}

interface IUserViewProps extends THandlerComponentProps<TSingleHandlerStore<IUser, TUserViewExtraProps>> {
    // Component props for UserView
}

export default function UserView({ storeKey, store }: IUserViewProps) {
    // React 19: Essential IDs and transitions
    const componentId = useId();
    const [, startTransition] = useTransition();

    const storeState = store(useShallow(state => ({
        response: state.response,
        action: state.action,
        reset: state.reset,
    })));

    const { response: user, action, reset } = storeState || { response: null, action: '', reset: () => { } };

    const { t } = useI18n();
    
    if (!store) {
        return <div>{buildSentence(t, 'single', 'store')} "{storeKey}" {buildSentence(t, 'not', 'found')}. {buildSentence(t, 'did', 'you', 'forget', 'to', 'register', 'it')}?</div>;
    }

    if (!user) {
        return null;
    }

    const handleCloseView = () => {
        startTransition(() => reset());
    };

    return (
        <Dialog open={action === 'view'} onOpenChange={handleCloseView} data-component-id={componentId}>
            <DialogContent className="min-w-4xl max-h-[90vh] overflow-y-auto">
                <AppDialog
                    title={buildSentence(t, 'user', 'details')}
                    description={buildSentence(t, 'view', 'detailed', 'information', 'about', 'this', 'user')}
                >
                    <UserDetailContent user={user} />
                </AppDialog>
            </DialogContent>
        </Dialog>
    );
}

interface IUserDetailContentProps {
    user: IUser;
}

function UserDetailContent({ user }: IUserDetailContentProps) {
    // React 19: Essential IDs
    const componentId = useId();
    const { settings } = useUserSettings();
    const { user: currentUser } = useAuthUser();
    const { t } = useI18n();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const profile = (user as any).profile;
    const isSuperAdmin = currentUser?.level === EUserLevels.SUPER_ADMIN;

    // Fetch user settings if current user is SUPER_ADMIN
    const { settings: userSettings } = useUserSettingsById(user.id, isSuperAdmin);

    // React 19: Memoized user creation date for better performance
    const userCreationDate = useMemo(() =>
        formatDate(user.createdAt, settings),
        [user.createdAt, settings]
    );

    return (
        <div className="space-y-4" data-component-id={componentId}>
            {/* Header Card */}
            <AppCard
                header={
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3 mb-2">
                            <h2 className="text-2xl font-semibold truncate">
                                {user.firstName} {user.lastName}
                            </h2>
                            <Badge variant={user.isActive ? "default" : "secondary"}>
                                {user.isActive ? t('active') : t('inactive')}
                            </Badge>
                        </div>
                    </div>
                }
            >
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                        <Mail className="w-4 h-4" />
                        <span className="font-medium text-foreground">{user.email}</span>
                    </div>
                    <span>•</span>
                    <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" />
                        <span>{buildSentence(t, 'user', 'since')} {userCreationDate}</span>
                    </div>
                </div>
            </AppCard>

            {/* User Information and Personal Information - Two Columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* User Information */}
                <div className="space-y-4">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                        {buildSentence(t, 'user', 'information')}
                    </h3>
                    <div className="space-y-3">
                        {user.level && (
                            <div className="flex items-center gap-3">
                                <User className="w-4 h-4 text-muted-foreground shrink-0" />
                                <div>
                                    <div className="text-xs text-muted-foreground">{t('role')}</div>
                                    <div className="font-medium">{getUserRole(user.level)}</div>
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
                        {user.dateOfBirth && (
                            <div className="flex items-center gap-3">
                                <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                                <div>
                                    <div className="text-xs text-muted-foreground">
                                        {buildSentence(t, 'date', 'of', 'birth')}
                                    </div>
                                    <div className="font-medium">{formatDate(user.dateOfBirth, settings)}</div>
                                </div>
                            </div>
                        )}
                        {user.gender && (
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

            {/* Profile Information */}
            <div>
                <UserProfileInfo userId={user.id} />
            </div>

            {/* Business Settings - Only visible to SUPER_ADMIN */}
            {isSuperAdmin && userSettings?.business && (
                <AppCard
                    header={
                        <div className="flex items-center gap-2">
                            <Building2 className="w-5 h-5" />
                            <div>
                                <span className="font-semibold">{buildSentence(t, 'business', 'settings')}</span>
                                <p className="text-sm text-muted-foreground">{buildSentence(t, 'business', 'information', 'and', 'details')}</p>
                            </div>
                        </div>
                    }
                >
                    <div className="space-y-4">
                        {userSettings.business.businessName && (
                            <div className="flex items-center gap-3">
                                <div className="text-muted-foreground"><Building2 className="w-4 h-4" /></div>
                                <div className="flex-1">
                                    <span className="text-sm text-muted-foreground">{buildSentence(t, 'business', 'name')}:</span>
                                    <p className="font-medium">{userSettings.business.businessName}</p>
                                </div>
                            </div>
                        )}
                        {userSettings.business.businessEmail && (
                            <div className="flex items-center gap-3">
                                <div className="text-muted-foreground"><Mail className="w-4 h-4" /></div>
                                <div className="flex-1">
                                    <span className="text-sm text-muted-foreground">{buildSentence(t, 'business', 'email')}:</span>
                                    <p className="font-medium">{userSettings.business.businessEmail}</p>
                                </div>
                            </div>
                        )}
                        {userSettings.business.businessPhone && (
                            <div className="flex items-center gap-3">
                                <div className="text-muted-foreground"><Phone className="w-4 h-4" /></div>
                                <div className="flex-1">
                                    <span className="text-sm text-muted-foreground">{buildSentence(t, 'business', 'phone')}:</span>
                                    <p className="font-medium">{userSettings.business.businessPhone}</p>
                                </div>
                            </div>
                        )}
                        {userSettings.business.businessAddress && (
                            <div className="flex items-center gap-3">
                                <div className="text-muted-foreground"><MapPin className="w-4 h-4" /></div>
                                <div className="flex-1">
                                    <span className="text-sm text-muted-foreground">{buildSentence(t, 'business', 'address')}:</span>
                                    <p className="font-medium">{userSettings.business.businessAddress}</p>
                                </div>
                            </div>
                        )}
                        {userSettings.business.businessLogo && (
                            <div className="flex items-center gap-3">
                                <div className="text-muted-foreground"><Globe className="w-4 h-4" /></div>
                                <div className="flex-1">
                                    <span className="text-sm text-muted-foreground">{buildSentence(t, 'business', 'logo')}:</span>
                                    <p className="font-medium">
                                        <a
                                            href={userSettings.business.businessLogo}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:underline"
                                        >
                                            {userSettings.business.businessLogo}
                                        </a>
                                    </p>
                                </div>
                            </div>
                        )}
                        {!userSettings.business.businessName &&
                            !userSettings.business.businessEmail &&
                            !userSettings.business.businessPhone &&
                            !userSettings.business.businessAddress &&
                            !userSettings.business.businessLogo && (
                                <p className="text-sm text-muted-foreground">{buildSentence(t, 'no', 'business', 'settings', 'configured')}</p>
                            )}
                    </div>
                </AppCard>
            )}

        </div>
    );
}