// External Libraries
import { useId } from "react";

// Components
import {
  MapPin,
  Phone,
  CreditCard,
  AlertCircle,
  Globe,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

// Hooks
import { useUserProfile } from "@/hooks/use-user-profile";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";

// Types
interface IUserProfileInfoProps {
  userId: string | undefined;
}

/**
 * Reusable component to display user profile information with loading effect
 */
export function UserProfileInfo({ userId }: IUserProfileInfoProps) {
  const componentId = useId();
  const { t } = useI18n();

  const { profile, isLoading, error } = useUserProfile(userId);

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4" data-component-id={componentId}>
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          {buildSentence(t, 'profile', 'information')}
        </h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Skeleton className="w-4 h-4" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="w-4 h-4" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-4 w-40" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="w-4 h-4" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state or no profile
  if (error || !profile) {
    return (
      <div className="space-y-4" data-component-id={componentId}>
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          {buildSentence(t, 'profile', 'information')}
        </h3>
        <div className="text-sm text-muted-foreground">
          {buildSentence(t, 'no', 'profile', 'information', 'available')}
        </div>
      </div>
    );
  }

  // Profile data loaded
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-4" data-component-id={componentId}>
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          {buildSentence(t, 'profile', 'information')}
        </h3>
        <div className="space-y-3">
          {profile.rfid && (
            <div className="flex items-center gap-3">
              <CreditCard className="w-4 h-4 text-muted-foreground shrink-0" />
              <div>
                <div className="text-xs text-muted-foreground">{t('rfid')}</div>
                <div className="font-medium">{profile.rfid}</div>
              </div>
            </div>
          )}
          {profile.phoneNumber && (
            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
              <div>
                <div className="text-xs text-muted-foreground">
                  {buildSentence(t, 'phone', 'number')}
                </div>
                <div className="font-medium">{profile.phoneNumber}</div>
              </div>
            </div>
          )}
          {profile.address && (
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <div className="text-xs text-muted-foreground mb-1">{t('address')}</div>
                <div className="text-sm">{profile.address}</div>
              </div>
            </div>
          )}
          {(profile.city || profile.state || profile.zipCode || profile.country) && (
            <div className="flex items-start gap-3">
              <Globe className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <div className="text-xs text-muted-foreground mb-1">
                  {buildSentence(t, 'location')}
                </div>
                <div className="text-sm">
                  {[
                    profile.city,
                    profile.state,
                    profile.zipCode,
                    profile.country
                  ].filter(Boolean).join(', ') || buildSentence(t, 'not', 'specified')}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="space-y-4" data-component-id={componentId}>
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          {buildSentence(t, 'emergency', 'contact')}
        </h3>
        <div className="space-y-3">
          {profile.emergencyContactName && (
            <div className="flex items-center gap-3">
              <AlertCircle className="w-4 h-4 text-muted-foreground shrink-0" />
              <div>
                <div className="text-xs text-muted-foreground">{t('emergencyContactName')}</div>
                <div className="font-medium">{profile.emergencyContactName}</div>
              </div>
            </div>
          )}
          {profile.emergencyContactNumber && (
            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
              <div>
                <div className="text-xs text-muted-foreground">{t('emergencyContactNumber')}</div>
                <div className="font-medium">{profile.emergencyContactNumber}</div>
              </div>
            </div>
          )}
          {profile.emergencyContactRelationship && (
            <div className="flex items-center gap-3">
              <AlertCircle className="w-4 h-4 text-muted-foreground shrink-0" />
              <div>
                <div className="text-xs text-muted-foreground">{t('emergencyContactRelationship')}</div>
                <div className="font-medium">{profile.emergencyContactRelationship}</div>
              </div>
            </div>
          )}
          {profile.alternativeEmergencyContactNumber && (
            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
              <div>
                <div className="text-xs text-muted-foreground">{t('alternativeEmergencyContactNumber')}</div>
                <div className="font-medium">{profile.alternativeEmergencyContactNumber}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

