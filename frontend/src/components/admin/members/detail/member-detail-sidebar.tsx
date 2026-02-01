// React
import { useId, useMemo, useTransition } from "react";
import { useShallow } from "zustand/shallow";
import { QRCodeSVG } from "qrcode.react";

// Types
import type { IMember } from "@shared/interfaces/member.interface";
import type { TSingleHandlerStore } from "@/stores";
import type { TMemberViewExtraProps } from "@/components/admin/members/view/member-view";
import { EUserGender, EUserLevels } from "@shared/enums/user.enum";

// Components
import { AppCard } from "@/components/layout-ui/app-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Mail,
  Calendar,
  Phone,
  User,
  MapPin,
  CreditCard,
  Shield,
  FileText,
  Building,
  Edit,
  Target,
  Activity,
  Heart
} from "lucide-react";

// Hooks
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";
import { useUserSettings } from "@/hooks/use-user-settings";
import { useUserProfile } from "@/hooks/use-user-profile";
import { formatDate } from "@/lib/utils";

interface IMemberDetailSidebarProps {
  member: IMember;
  storeKey: string;
  store: TSingleHandlerStore<IMember, TMemberViewExtraProps>;
}

export function MemberDetailSidebar({ member, storeKey, store }: IMemberDetailSidebarProps) {
  const componentId = useId();
  const { t } = useI18n();
  const { settings } = useUserSettings();
  const [, startTransition] = useTransition();

  // User entity data (from member.user)
  const user = member.user;
  const userId = user?.id;

  // Fetch Profile entity data using hook
  const { profile, isLoading: isLoadingProfile } = useUserProfile(userId);

  // Get setAction from store
  const setAction = store(useShallow((state) => state.setAction));

  // Handle edit action
  const handleEdit = () => {
    startTransition(() => {
      setAction('createOrUpdate', member.id);
    });
  };

  const gender = user?.gender;

  // Get gender label
  const genderLabel = useMemo(() => {
    if (!gender) return '';
    const genderMap: Record<string, string> = {
      [EUserGender.MALE]: 'Male',
      [EUserGender.FEMALE]: 'Female',
      [EUserGender.OTHER]: 'Other',
      [EUserGender.PREFER_NOT_TO_SAY]: 'Prefer not to say',
    };
    return genderMap[gender] || gender;
  }, [gender]);

  // QR Code value - using member ID
  const qrValue = useMemo(() => JSON.stringify({ userId: member.id }), [userId]);

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
                  {(user as any)?.isVerified && (
                    <Badge variant="outline" className="text-xs">
                      {t('verified')}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleEdit}
              className="flex-shrink-0"
            >
              <Edit className="w-4 h-4 mr-2" />
              {t('edit')}
            </Button>
          </div>
        }
      >
        <div className="space-y-6">
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

              {/* User/Profile Entity: Gender */}
              {genderLabel && (
                <div className="flex items-center gap-2 text-sm">
                  <User className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-muted-foreground">{genderLabel}</span>
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

          {/* Profile Entity: RFID */}
          {profile?.rfid && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  RFID Tag
                </h3>
                <div className="text-sm font-mono">{profile.rfid}</div>
              </div>
            </>
          )}

          {/* Profile Entity: Emergency Contact */}
          {(profile?.emergencyContactName || profile?.emergencyContactNumber || profile?.emergencyContactRelationship) && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  {buildSentence(t, 'emergency', 'contact')}
                </h3>
                <div className="space-y-2">
                  {profile.emergencyContactName && (
                    <div className="text-sm font-medium">{profile.emergencyContactName}</div>
                  )}
                  {profile.emergencyContactRelationship && (
                    <div className="text-xs text-muted-foreground">{profile.emergencyContactRelationship}</div>
                  )}
                  {profile.emergencyContactNumber && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-3 h-3 text-muted-foreground" />
                      <span>{profile.emergencyContactNumber}</span>
                    </div>
                  )}
                  {profile.alternativeEmergencyContactNumber && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="w-3 h-3" />
                      <span>{profile.alternativeEmergencyContactNumber}</span>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Member Entity: Member Details */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
              <User className="w-4 h-4" />
              {buildSentence(t, 'member', 'details')}
            </h3>
            <div className="space-y-3">
              {/* Member Entity: Goal */}
              {member.goal ? (
                <div className="flex items-start gap-3">
                  <Target className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-xs text-muted-foreground mb-1">{t('goal')}</div>
                    <div className="text-sm font-medium">{member.goal}</div>
                  </div>
                </div>
              ) : null}

              {/* Member Entity: Fitness Level */}
              {member.fitnessLevel ? (
                <div className="flex items-start gap-3">
                  <Activity className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-xs text-muted-foreground mb-1">
                      {buildSentence(t, 'fitness', 'level')}
                    </div>
                    <div className="text-sm font-medium">{member.fitnessLevel}</div>
                  </div>
                </div>
              ) : null}

              {/* Member Entity: Medical Conditions */}
              {member.medicalConditions ? (
                <div className="flex items-start gap-3">
                  <Heart className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-xs text-muted-foreground mb-1">
                      {buildSentence(t, 'medical', 'conditions')}
                    </div>
                    <div className="text-sm">{member.medicalConditions}</div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          {/* Profile Entity: Documents */}
          {profile?.documents && profile.documents.length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Documents ({profile.documents.length})
                </h3>
                <div className="space-y-2">
                  {profile.documents.map((doc, idx) => (
                    <div key={idx} className="text-sm text-muted-foreground">
                      {doc.name || `Document ${idx + 1}`}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Profile Entity: Business */}
          {profile?.business && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
                  <Building className="w-4 h-4" />
                  Business
                </h3>
                <div className="text-sm font-medium">
                  {(profile.business as any)?.name || profile.business.id}
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* QR Code Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Member QR Code
            </h3>
            <div className="flex flex-col items-center gap-4">
              {/* QR Code */}
              <div className="w-48 h-48 border-2 border-muted-foreground/30 rounded-lg flex items-center justify-center bg-white p-4">
                <QRCodeSVG
                  value={qrValue}
                  size={180}
                  level="H"
                  includeMargin={false}
                />
              </div>
              <div className="text-center space-y-2 w-full">
                {userId && (
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">User ID</div>
                    <div className="text-sm font-mono font-semibold break-all">
                      {userId}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </AppCard>
    </div>
  );
}
