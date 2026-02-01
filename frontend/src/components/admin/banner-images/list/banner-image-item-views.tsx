import { Eye, Pencil, Trash2, Image as ImageIcon, Calendar } from "lucide-react";
import { useTransition } from "react";

// Types
import { type IBannerImage } from "@shared/interfaces/advertisement.interface";
import type { IUserSettings } from "@shared/interfaces/settings.interface";

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

export const itemViews = ({
  handleEdit,
  handleDelete,
  handleView,
  settings,
  componentId = "banner-image-item-views",
}: IItemViewArgs) => {
  // React 19: Essential IDs and transitions - MUST be called at top level
  const [, startTransition] = useTransition();
  const { t } = useI18n();

  const listItem = (item: IBannerImage) => {
    return (
      <AppCard 
        key={item.id}
        className="hover:shadow-md transition-shadow"
        data-component-id={componentId}
      >
        <div className="flex flex-col gap-4">
          {/* Banner Image Preview */}
          {item.image?.url ? (
            <div className="w-full">
              <div className="relative w-full h-full rounded-lg overflow-hidden border border-gray-200">
                <img
                  src={item.image.url}
                  alt={item.name}
                  className="w-full h-full object-cover object-top"
                  crossOrigin="anonymous"
                />
              </div>
            </div>
          ) : (
            <div className="w-full h-32 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center">
              <ImageIcon className="w-8 h-8 text-gray-400" />
            </div>
          )}

          {/* Title and Badges */}
          <div className="flex-1 w-full">
            <h3 className="font-semibold text-lg text-gray-900 mb-2">
              {item.name}
            </h3>
            <div className="flex items-center gap-2 flex-wrap mb-3">
              {item.image ? (
                <Badge variant="outline" className="text-xs">
                  {t('imageAvailable')}
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-xs">
                  {t('noImage')}
                </Badge>
              )}
            </div>

            {/* Details */}
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{t('created')}: {formatDate(item.createdAt, settings)}</span>
              </div>
            </div>

            {/* Image Info */}
            {item.image && (
              <div className="p-2 mb-3">
                <div className="text-xs text-muted-foreground">
                  <span className="font-medium">{t('file')}:</span> {item.image.name || t('na')}
                </div>
                {item.image.url && (
                  <a 
                    href={item.image.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline block mt-1"
                  >
                    {t('viewFullImage')}
                  </a>
                )}
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

