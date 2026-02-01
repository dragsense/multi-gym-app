// External Libraries
import { useShallow } from "zustand/shallow";
import { useId, useMemo, useTransition } from "react";

// Components
import { Badge } from "@/components/ui/badge";
import { AppCard } from "@/components/layout-ui/app-card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AppDialog } from "@/components/layout-ui/app-dialog";
import { User, Mail, Calendar, MapPin, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

// Types
import type { IStaff } from "@shared/interfaces/staff.interface";
import type { IUser } from "@shared/interfaces/user.interface";
import { EUserLevels } from "@shared/enums/user.enum";
import type { IRole } from "@shared/interfaces/role/role.interface";

// Stores
import { type TSingleHandlerStore } from "@/stores";
import { type THandlerComponentProps } from "@/@types/handler-types";
import type { ISingleHandlerState } from "@/@types/handler-types/single.type";

// Hooks & Utils
import { useUserSettings, useUserSettingsById } from "@/hooks/use-user-settings";
import { useAuthUser } from "@/hooks/use-auth-user";
import { formatDate } from "@/lib/utils";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";
import { getUserRole } from "@shared/lib/utils";
import { UserProfileInfo } from "../../users/view/user-profile-info";



interface IStaffViewProps extends THandlerComponentProps<TSingleHandlerStore<IStaff, any>> {
}

export default function StaffView({ storeKey, store }: IStaffViewProps) {
  const componentId = useId();
  const [, startTransition] = useTransition();
  const { t } = useI18n();

  const selector = useShallow(
    (state: ISingleHandlerState<IStaff, any>) => ({
      response: state.response,
      action: state.action,
      setAction: state.setAction,
      reset: state.reset,
    }),
  );

  const storeState = store ? store(selector) : null;

  if (!store) {
    return (
      <div>
        {buildSentence(t, "single", "store")} "{storeKey}"{" "}
        {buildSentence(t, "not", "found")}.{" "}
        {buildSentence(t, "did", "you", "forget", "to", "register", "it")}?
      </div>
    );
  }

  if (!storeState) return null;

  const { response: staff, action, setAction, reset } = storeState;
  if (!staff) return null;

  const handleCloseView = () => {
    startTransition(() => reset());
  };

  const onEdit = (staff: IStaff) => {
    startTransition(() => {
      setAction("createOrUpdate", (staff as any).user?.id ?? staff.id);
    });
  };

  const onDelete = (staff: IStaff) => {
    startTransition(() => {
      setAction("delete", (staff as any).user?.id ?? staff.id);
    });
  };

  const onUpdateProfile = (staff: IStaff) => {
    startTransition(() => {
      setAction("updateProfile", (staff as any).user?.id ?? staff.id);
    });
  };

  return (
    <Dialog
      open={action === "view"}
      onOpenChange={handleCloseView}
      data-component-id={componentId}
    >
      <DialogContent className="min-w-4xl max-h-[90vh] overflow-y-auto">
        <AppDialog
          title={buildSentence(t, "staff", "member", "details")}
          description={buildSentence(
            t,
            "view",
            "detailed",
            "information",
            "about",
            "this",
            "staff",
            "member",
          )}
        >
          <StaffDetailContent
            staff={staff}
            onEdit={onEdit}
            onDelete={onDelete}
            onUpdateProfile={onUpdateProfile}
          />
        </AppDialog>
      </DialogContent>
    </Dialog>
  );
}

interface IStaffDetailContentProps {
  staff: IStaff;
  onEdit: (staff: IStaff) => void;
  onDelete: (staff: IStaff) => void;
  onUpdateProfile: (staff: IStaff) => void;
}

function StaffDetailContent({
  staff,
  onEdit,
  onDelete,
  onUpdateProfile,
}: IStaffDetailContentProps) {
  const componentId = useId();
  const { settings } = useUserSettings();
  const { user: currentUser } = useAuthUser();
  const { t } = useI18n();

  const user: IUser | undefined = (staff as any).user;
  const userId = user?.id ?? staff.id;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userRoles = (user as any)?.roles as { role: IRole }[] | undefined;
  const isSuperAdmin = currentUser?.level === EUserLevels.SUPER_ADMIN;

  // Keep same behavior as other views (fetch settings when allowed)
  useUserSettingsById(userId, isSuperAdmin);

  const createdAt = user?.createdAt ?? staff.createdAt;
  const userCreationDate = useMemo(
    () => (createdAt ? formatDate(createdAt, settings) : ""),
    [createdAt, settings],
  );

  const roleColors = {
    [EUserLevels.SUPER_ADMIN]: "bg-red-100 text-red-800 border-red-200",
    [EUserLevels.STAFF]: "bg-blue-100 text-blue-800 border-blue-200",
    [EUserLevels.MEMBER]: "bg-green-100 text-green-800 border-green-200",
  } as const;

  const fullName = `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim();
  const email = user?.email ?? "";
  const isActive = !!user?.isActive;
  const level = user?.level;

  const isTrainer = (staff as any).isTrainer as boolean | undefined;
  const specialization = (staff as any).specialization as string | undefined;
  const experience = (staff as any).experience as number | undefined;
  const locationName = (staff as any).location?.name as string | undefined;

  return (
    <div className="space-y-4" data-component-id={componentId}>
      {/* Header Card */}
      <AppCard
        header={
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-semibold truncate">{fullName}</h2>
              <Badge variant={isActive ? "default" : "secondary"}>
                {isActive ? t("active") : t("inactive")}
              </Badge>
              {isTrainer !== undefined && (
                <Badge variant={isTrainer ? "default" : "secondary"}>
                  {isTrainer ? "Trainer" : "Staff"}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onUpdateProfile(staff)}
                className="gap-2"
              >
                <User className="w-4 h-4" />
                {buildSentence(t, "update", "profile") || "Update Profile"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(staff)}
                className="gap-2"
              >
                <Pencil className="w-4 h-4" />
                {buildSentence(t, "edit")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDelete(staff)}
                className="gap-2"
              >
                <Trash2 className="w-4 h-4" />
                {buildSentence(t, "delete")}
              </Button>
            </div>
          </div>
        }
      >
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Mail className="w-4 h-4" />
            <span className="font-medium text-foreground">{email}</span>
          </div>
          {userCreationDate && (
            <>
              <span>•</span>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                <span>
                  {buildSentence(t, "user", "since")} {userCreationDate}
                </span>
              </div>
            </>
          )}
        </div>
      </AppCard>

      {/* User Information and Personal Information - Two Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* User Information */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            {buildSentence(t, "user", "information")}
          </h3>
          <div className="space-y-3">
            {level !== undefined && (
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-muted-foreground shrink-0" />
                <div>
                  <div className="text-xs text-muted-foreground">{t("role")}</div>
                  <div className="font-medium">
                    <Badge className={`${roleColors[level as EUserLevels]} text-xs`}>
                      {getUserRole(level as number)}
                    </Badge>
                  </div>
                </div>
              </div>
            )}
            {userRoles && userRoles.length > 0 && (
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-muted-foreground shrink-0" />
                <div>
                  <div className="text-xs text-muted-foreground">
                    {buildSentence(t, "roles")}
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {userRoles.map((userRole, index) => (
                      <Badge key={index} variant="outline">
                        {userRole.role.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Personal Information */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            {buildSentence(t, "personal", "information")}
          </h3>
          <div className="space-y-3">
            {user?.dateOfBirth && (
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                <div>
                  <div className="text-xs text-muted-foreground">
                    {buildSentence(t, "date", "of", "birth")}
                  </div>
                  <div className="font-medium">
                    {formatDate(user.dateOfBirth, settings)}
                  </div>
                </div>
              </div>
            )}
            {user?.gender && (
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-muted-foreground shrink-0" />
                <div>
                  <div className="text-xs text-muted-foreground">{t("gender")}</div>
                  <div className="font-medium capitalize">{user.gender}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Staff Information */}
      {(specialization || experience !== undefined || locationName) && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            {buildSentence(t, "staff", "information") || "Staff Information"}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {specialization && (
              <div>
                <p className="text-xs text-muted-foreground">
                  {t("specialization") || "Specialization"}
                </p>
                <p className="font-medium">{specialization}</p>
              </div>
            )}
            {experience !== undefined && experience !== null && (
              <div>
                <p className="text-xs text-muted-foreground">
                  {t("experience") || "Experience"}
                </p>
                <p className="font-medium">{experience} {experience > 1 ? t("years") : t("year")}</p>
              </div>
            )}
            {locationName && (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">
                    {t("location") || "Location"}
                  </p>
                  <p className="font-medium">{locationName}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Profile Information */}
      <div>
        <UserProfileInfo userId={userId} />
      </div>
    </div>
  );
}
