// External Libraries
import { useShallow } from "zustand/shallow";
import { useId, useTransition, type ReactNode } from "react";

// Components
import { AppCard } from "@/components/layout-ui/app-card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AppDialog } from "@/components/layout-ui/app-dialog";
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  Pencil,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { buildSentence } from "@/locales/translations";
import { cn } from "@/lib/utils";

// Types
import { type IFacilityInfo } from "@shared/interfaces/facility-info.interface";
import { EFacilityInfoStatus } from "@shared/enums/facility-info.enum";

// Stores
import { type TSingleHandlerStore } from "@/stores";
import { type THandlerComponentProps } from "@/@types/handler-types";

// Hooks & Utils
import { useI18n } from "@/hooks/use-i18n";

export type TFacilityInfoViewExtraProps = {};

interface IFacilityInfoViewProps extends THandlerComponentProps<
  TSingleHandlerStore<IFacilityInfo, TFacilityInfoViewExtraProps>
> {}

const statusColors: Record<EFacilityInfoStatus, string> = {
  [EFacilityInfoStatus.ACTIVE]: "bg-green-100 text-green-800",
  [EFacilityInfoStatus.INACTIVE]: "bg-gray-100 text-gray-800",
};

export default function FacilityInfoView({
  storeKey,
  store,
}: IFacilityInfoViewProps) {
  const componentId = useId();
  const [, startTransition] = useTransition();
  const { t } = useI18n();

  if (!store) {
    return (
      <div>
        Single store "{storeKey}" not found. Did you forget to register it?
      </div>
    );
  }

  const {
    response: facilityInfo,
    action,
    setAction,
    reset,
  } = store(
    useShallow((state) => ({
      response: state.response,
      action: state.action,
      setAction: state.setAction,
      reset: state.reset,
    })),
  );

  if (!facilityInfo) {
    return null;
  }

  const handleCloseView = () => {
    startTransition(() => reset());
  };

  const onEdit = (facilityInfo: IFacilityInfo) => {
    startTransition(() => {
      setAction("createOrUpdate", facilityInfo.id);
    });
  };

  const onDelete = (facilityInfo: IFacilityInfo) => {
    startTransition(() => {
      setAction("delete", facilityInfo.id);
    });
  };

  const onUpdateStatus = (facilityInfo: IFacilityInfo) => {
    startTransition(() => {
      setAction("updateStatus", facilityInfo.id);
    });
  };

  return (
    <Dialog
      open={action === "view"}
      onOpenChange={handleCloseView}
      data-component-id={componentId}
    >
      <DialogContent className="min-w-2xl max-h-[90vh] overflow-y-auto">
        <AppDialog
        //   title={t("facilityInfoDetails")}
        //   description={t("viewDetailedInformationAboutThisFacility")}
        >
          <FacilityInfoDetailContent
            facilityInfo={facilityInfo}
            onEdit={onEdit}
            onDelete={onDelete}
            onUpdateStatus={onUpdateStatus}
          />
        </AppDialog>
      </DialogContent>
    </Dialog>
  );
}

interface IFacilityInfoDetailContentProps {
  facilityInfo: IFacilityInfo;
  onEdit: (facilityInfo: IFacilityInfo) => void;
  onDelete: (facilityInfo: IFacilityInfo) => void;
  onUpdateStatus: (facilityInfo: IFacilityInfo) => void;
}

function FacilityInfoDetailContent({
  facilityInfo,
  onEdit,
  onDelete,
  onUpdateStatus,
}: IFacilityInfoDetailContentProps) {
  const componentId = useId();
  const { t } = useI18n();

  return (
    <div className="space-y-6" data-component-id={componentId}>
      {/* Visual Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-accent/30 border border-accent/20">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-inner">
            <Building2 className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight">
              {t("facilityInfo")}
            </h2>
            <Badge
              className={cn(
                statusColors[facilityInfo.status],
                "px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest border-none shadow-sm",
              )}
            >
              {facilityInfo.status.replace("_", " ")}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onUpdateStatus(facilityInfo)}
            className="h-9 gap-2 text-xs font-semibold bg-background hover:bg-accent transition-all shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            {buildSentence(t, "update", "status")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(facilityInfo)}
            className="h-9 gap-2 text-xs font-semibold bg-background hover:bg-accent transition-all shadow-sm"
          >
            <Pencil className="w-3.5 h-3.5" />
            {t("edit")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(facilityInfo)}
            className="h-9 gap-2 text-xs font-semibold   hover:text-destructive"
          >
            <Trash2 className="w-3.5 h-3.5" />
            {t("delete")}
          </Button>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Contact Information */}
        <div className="flex flex-col gap-4 p-6 rounded-2xl border bg-card/50 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="flex items-center gap-2 pb-3 border-b border-muted">
            <div className="p-1.5 rounded-lg bg-primary/5">
              <Phone className="w-4 h-4 text-primary" />
            </div>
            <h3 className="text-xs font-bold uppercase">
              {buildSentence(t, "contact", "information")}
            </h3>
          </div>
          <div className="space-y-5 pt-2">
            <DetailItem
              icon={<Mail className="w-4 h-4" />}
              label={t("email")}
              value={facilityInfo.email}
            />
            <DetailItem
              icon={<Phone className="w-4 h-4" />}
              label={t("phone")}
              value={facilityInfo.phone}
            />
          </div>
        </div>

        {/* Location Information */}
        <div className="flex flex-col gap-4 p-6 rounded-2xl border bg-card/50 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="flex items-center gap-2 pb-3 border-b border-muted">
            <div className="p-1.5 rounded-lg bg-primary/5">
              <MapPin className="w-4 h-4 text-primary" />
            </div>
            <h3 className="text-xs font-bold uppercase">{t("location")}</h3>
          </div>
          <div className="pt-2">
            <DetailItem
              icon={<MapPin className="w-4 h-4" />}
              label={t("address")}
              value={facilityInfo.address}
              isAddress
            />
          </div>
        </div>
      </div>
    </div>
  );
}

const DetailItem = ({
  icon,
  label,
  value,
  isAddress,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  isAddress?: boolean;
}) => (
  <div className="flex items-start gap-4 group">
    <div className="mt-0.5 w-9 h-9 flex items-center justify-center rounded-xl bg-muted/40 border border-muted-foreground/10 text-muted-foreground  transition-all duration-300 shrink-0">
      {icon}
    </div>
    <div className="space-y-1 min-w-0 flex-1">
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
        {label}
      </p>
      <p
        className={cn(
          "text-sm font-medium  transition-colors  leading-normal break-words",
          isAddress && " font-normal ",
        )}
      >
        {value}
      </p>
    </div>
  </div>
);
