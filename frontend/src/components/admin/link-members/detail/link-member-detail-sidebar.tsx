// React
import { useId, useMemo } from "react";
import { useShallow } from "zustand/shallow";

// Types
import type { ILinkMember } from "@shared/interfaces/link-member.interface";
import type { IMember } from "@shared/interfaces/member.interface";
import type { TSingleHandlerStore } from "@/stores";
import type { TLinkMemberViewExtraProps } from "@/components/admin/link-members/view/link-member-view";

// Components
import { AppCard } from "@/components/layout-ui/app-card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Mail,
  Calendar,
  Phone,
  User,
  MapPin,
  Shield,
  Link2,
  CheckCircle2,
  XCircle,
} from "lucide-react";

// Hooks
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";
import { useUserSettings } from "@/hooks/use-user-settings";
import { useUserProfile } from "@/hooks/use-user-profile";
import { formatDate } from "@/lib/utils";
import { EUserLevels } from "@shared/enums";

interface ILinkMemberDetailSidebarProps {
  linkMember: ILinkMember;
  member: IMember;
  storeKey: string;
  store: TSingleHandlerStore<ILinkMember, TLinkMemberViewExtraProps>;
}

export function LinkMemberDetailSidebar({ linkMember, member, storeKey, store }: ILinkMemberDetailSidebarProps) {
  const componentId = useId();
  const { t } = useI18n();
  const { settings } = useUserSettings();

  // User entity data (from member.user)
  const user = member.user;
  const userId = user?.id;

  // Fetch Profile entity data using hook
  const { profile, isLoading: isLoadingProfile } = useUserProfile(userId);

  // Get primary member info
  const primaryMember = linkMember.primaryMember;
  const isPrimary = primaryMember?.id === member.id;

  return (
    <div data-component-id={componentId}>
      <AppCard
        header={
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                {profile?.image ? (
                  <img
                    src={profile.image.url}
                    alt={`${user?.firstName} ${user?.lastName}`}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <User className="w-8 h-8 text-primary" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-semibold truncate">
                  {user?.firstName} {user?.lastName}
                </h2>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <Badge variant={member.user?.isActive ? "default" : "secondary"}>
                    {member.user?.isActive ? t('active') : t('inactive')}
                  </Badge>
                  {isPrimary && (
                    <Badge variant="outline" className="text-xs">
                      {buildSentence(t, 'primary', 'member')}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        }
      >
        <div className="space-y-6">
          {/* Link Member Info */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
              <Link2 className="w-4 h-4" />
              {buildSentence(t, 'link', 'information')}
            </h3>
            <div className="space-y-2">
              {linkMember.viewSessionCheck ? (
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span className="text-muted-foreground">
                    {buildSentence(t, 'session', 'check', 'enabled')}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm">
                  <XCircle className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {buildSentence(t, 'session', 'check', 'disabled')}
                  </span>
                </div>
              )}
              {linkMember.notes && (
                <div className="text-sm text-muted-foreground mt-2">
                  {linkMember.notes}
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* User & Profile: Basic Information */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {buildSentence(t, 'basic', 'information')}
            </h3>
            <div className="space-y-2">
              {/* User Entity: Email */}
              {user?.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-muted-foreground">{user.email}</span>
                </div>
              )}

              {/* Profile Entity: Phone Number */}
              {profile?.phoneNumber && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-muted-foreground">{profile.phoneNumber}</span>
                </div>
              )}

              {/* User/Profile Entity: Date of Birth */}
              {user?.dateOfBirth && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-muted-foreground">{formatDate(user.dateOfBirth, settings)}</span>
                </div>
              )}

              {/* User Entity: Level */}
              {user?.level !== undefined && (
                <div className="flex items-center gap-2 text-sm">
                  <Shield className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-muted-foreground">
                    Role: {EUserLevels[user.level]}
                  </span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Profile Entity: Address Information */}
          {(profile?.address || profile?.city || profile?.state || profile?.zipCode || profile?.country) && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                {buildSentence(t, 'address', 'information')}
              </h3>
              <div className="space-y-2">
                {profile.address && (
                  <div className="text-sm">{profile.address}</div>
                )}
                {(profile.city || profile.state || profile.zipCode) && (
                  <div className="text-sm text-muted-foreground">
                    {[profile.city, profile.state, profile.zipCode].filter(Boolean).join(', ')}
                  </div>
                )}
                {profile.country && (
                  <div className="text-sm text-muted-foreground">{profile.country}</div>
                )}
              </div>
            </div>
          )}
        </div>
      </AppCard>
    </div>
  );
}
