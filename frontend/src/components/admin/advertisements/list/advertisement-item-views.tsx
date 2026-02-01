import { Eye, Pencil, Trash2, Calendar, Link as LinkIcon, Megaphone } from "lucide-react";
import { useTransition } from "react";

// Types
import { type IAdvertisement } from "@shared/interfaces/advertisement.interface";
import type { IUserSettings } from "@shared/interfaces/settings.interface";
import { EAdvertisementStatus } from "@shared/enums/advertisement.enum";

// Components
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AppCard } from "@/components/layout-ui/app-card";

// Utils
import { formatDate } from "@/lib/utils";
import { useI18n } from "@/hooks/use-i18n";

interface IItemViewArgs {
  handleEdit: (id: string) => void;
  handleDelete: (id: string) => void;
  handleView: (id: string) => void;
  settings?: IUserSettings;
  componentId?: string;
}

const getStatusBadgeVariant = (status: EAdvertisementStatus) => {
  switch (status) {
    case EAdvertisementStatus.ACTIVE:
      return "default";
    case EAdvertisementStatus.DRAFT:
      return "secondary";
    case EAdvertisementStatus.INACTIVE:
      return "outline";
    case EAdvertisementStatus.EXPIRED:
      return "destructive";
    default:
      return "outline";
  }
};

export const itemViews = ({
  handleEdit,
  handleDelete,
  handleView,
  settings,
  componentId = "advertisement-item-views",
}: IItemViewArgs) => {
  // React 19: Essential IDs and transitions - MUST be called at top level
  const [, startTransition] = useTransition();
  const { t } = useI18n();

  const listItem = (item: IAdvertisement) => {
    const isExpired = new Date(item.endDate) < new Date();

    return (
      <AppCard 
        key={item.id}
        className="hover:shadow-md transition-shadow"
        data-component-id={componentId}
      >
        <div className="flex flex-col gap-4">
          {/* Banner Image Preview */}
          {item.bannerImage?.image?.url && (
            <div className="w-full">
              <div className="relative w-full h-full rounded-lg overflow-hidden border border-gray-200">
                <img
                  src={item.bannerImage.image.url}
                  alt={item.title}
                  className="w-full h-full object-cover object-top"
                  crossOrigin="anonymous"
                />
              </div>
            </div>
          )}

          {/* Title and Badges */}
          <div className="flex-1 w-full">
            <h3 className="font-semibold text-lg text-gray-900 mb-2">
              {item.title}
            </h3>
            <div className="flex items-center gap-2 flex-wrap mb-3">
              <Badge variant={getStatusBadgeVariant(item.status)} className="text-xs">
                {item.status}
              </Badge>
              {isExpired && (
                <Badge variant="destructive" className="text-xs">
                  {t('expired')}
                </Badge>
              )}
              {item.bannerImage && (
                <Badge variant="outline" className="text-xs">
                  {t('hasBanner')}
                </Badge>
              )}
            </div>

            {/* Details */}
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{t('start')}: {formatDate(item.startDate, settings)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{t('end')}: {formatDate(item.endDate, settings)}</span>
              </div>
              {item.websiteLink && (
                <div className="flex items-center gap-2">
                  <LinkIcon className="h-4 w-4" />
                  <a 
                    href={item.websiteLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {t('visitLink')}
                  </a>
                </div>
              )}
            </div>

            {/* Banner Image Info */}
            {item.bannerImage && (
              <div className="p-2 mb-3">
                <div className="text-xs text-muted-foreground">
                  <span className="font-medium">{t('banner')}:</span> {item.bannerImage.name || t('na')}
                </div>
              </div>
            )}
          </div>

          {/* Actions at Bottom */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => startTransition(() => handleView(item.id))}
              title={t('view')}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => startTransition(() => handleEdit(item.id))}
              title={t('edit')}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => startTransition(() => handleDelete(item.id))}
              title={t('delete')}
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        </div>
      </AppCard>
    );
  };

  return { listItem };
};

