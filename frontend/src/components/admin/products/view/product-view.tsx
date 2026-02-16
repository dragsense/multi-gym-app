import { useShallow } from "zustand/shallow";
import { useId, useTransition } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AppDialog } from "@/components/layout-ui/app-dialog";
import { AppCard } from "@/components/layout-ui/app-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Package,
  DollarSign,
  Pencil,
  Trash2,
  Image as ImageIcon,
  FileText,
  Calendar,
  Tag,
} from "lucide-react";
import type { IProduct } from "@shared/interfaces/products/product.interface";
import type { TSingleHandlerStore } from "@/stores";
import type { THandlerComponentProps } from "@/@types/handler-types";
import { useI18n } from "@/hooks/use-i18n";
import { useUserSettings } from "@/hooks/use-user-settings";
import { formatDate } from "@/lib/utils";
import { buildSentence } from "@/locales/translations";
import { EAttributeType } from "@shared/enums";

export type TProductViewExtraProps = Record<string, unknown>;

interface IProductViewProps
  extends THandlerComponentProps<TSingleHandlerStore<IProduct, TProductViewExtraProps>> {}

export default function ProductView({ storeKey, store }: IProductViewProps) {
  const componentId = useId();
  const [, startTransition] = useTransition();
  const { t } = useI18n();

  if (!store) {
    return (
      <div>
        {buildSentence(t, "single", "store")} "{storeKey}" {buildSentence(t, "not", "found")}.
      </div>
    );
  }

  const { response: product, action, reset, setAction } = store(
    useShallow((s) => ({
      response: s.response,
      action: s.action,
      reset: s.reset,
      setAction: s.setAction,
    }))
  );

  if (!product) return null;

  const handleCloseView = () => {
    startTransition(() => reset());
  };

  const onEdit = () => {
    startTransition(() => setAction("createOrUpdate", product.id));
  };

  const onDelete = () => {
    startTransition(() => setAction("delete", product.id));
  };

  return (
    <Dialog open={action === "view"} onOpenChange={handleCloseView} data-component-id={componentId}>
      <DialogContent className="min-w-5xl max-h-[90vh] overflow-y-auto">
        <AppDialog
          title={t("productDetails")}
          description={t("viewDetailedInformationAboutThisProduct")}
        >
          <ProductDetailContent product={product} onEdit={onEdit} onDelete={onDelete} />
        </AppDialog>
      </DialogContent>
    </Dialog>
  );
}

interface IProductDetailContentProps {
  product: IProduct;
  onEdit: () => void;
  onDelete: () => void;
}

function ProductDetailContent({ product, onEdit, onDelete }: IProductDetailContentProps) {
  const componentId = useId();
  const { t } = useI18n();
  const { settings } = useUserSettings();
  const thumb = product.defaultImages?.[0];
  const thumbUrl = typeof thumb === "object" && thumb?.url ? thumb.url : null;

  return (
    <div className="space-y-4" data-component-id={componentId}>
      <AppCard
        header={
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-2xl font-semibold truncate">{product.name}</h2>
              <Badge variant={product.isActive ? "default" : "secondary"}>
                {product.isActive ? t("active") : t("inactive")}
              </Badge>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button variant="outline" size="sm" onClick={onEdit} className="gap-2">
                <Pencil className="w-4 h-4" />
                {buildSentence(t, "edit")}
              </Button>
              <Button variant="outline" size="sm" onClick={onDelete} className="gap-2">
                <Trash2 className="w-4 h-4" />
                {buildSentence(t, "delete")}
              </Button>
            </div>
          </div>
        }
      >
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <DollarSign className="w-4 h-4" />
            <span className="font-semibold text-foreground">{Number(product.defaultPrice ?? 0).toFixed(2)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Package className="w-4 h-4" />
            <span>{t("qty")}: {product.totalQuantity ?? 0}</span>
          </div>
          {product.createdAt && (
            <>
              <span>•</span>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(product.createdAt, settings as any)}</span>
              </div>
            </>
          )}
        </div>
      </AppCard>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            {t("productInformation")}
          </h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Package className="w-4 h-4 text-muted-foreground shrink-0" />
              <div>
                <div className="text-xs text-muted-foreground">{t("name")}</div>
                <div className="font-medium">{product.name}</div>
              </div>
            </div>
            {product.defaultSku && (
              <div className="flex items-center gap-3">
                <Tag className="w-4 h-4 text-muted-foreground shrink-0" />
                <div>
                  <div className="text-xs text-muted-foreground">{t("defaultSku")}</div>
                  <div className="font-medium">{product.defaultSku}</div>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3">
              <DollarSign className="w-4 h-4 text-muted-foreground shrink-0" />
              <div>
                <div className="text-xs text-muted-foreground">{t("defaultPrice")}</div>
                <div className="font-medium">{Number(product.defaultPrice ?? 0).toFixed(2)}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Package className="w-4 h-4 text-muted-foreground shrink-0" />
              <div>
                <div className="text-xs text-muted-foreground">{t("totalQuantity")}</div>
                <div className="font-medium">{product.totalQuantity ?? 0}</div>
              </div>
            </div>
            {product.description && (
              <div className="flex items-start gap-3">
                <FileText className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs text-muted-foreground mb-1">{t("description")}</div>
                  <div className="text-sm" dangerouslySetInnerHTML={{ __html: product.description }} />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            {t("images")}
          </h3>
          {product.defaultImages?.length ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {product.defaultImages.map((img, idx) => {
                const url = typeof img === "object" && (img as any)?.url ? (img as any).url : null;
                if (!url) return null;
                return (
                  <div key={idx} className="aspect-square rounded-lg overflow-hidden border bg-muted">
                    <img src={url} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" />
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="aspect-video rounded-lg border bg-muted flex items-center justify-center">
              <ImageIcon className="w-10 h-10 text-muted-foreground/50" />
            </div>
          )}
          
          {product.variants?.length ? (
            <div className="pt-4 border-t">
              <VariantsDisplay variants={product.variants} t={t} />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// Helper function to normalize color values (handles hex, rgb, color names)
function normalizeColor(colorValue: string): string {
  if (!colorValue) return "#000000";
  
  // If it's already a valid hex color
  if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(colorValue)) {
    return colorValue;
  }
  
  // If it's rgb/rgba format
  if (colorValue.startsWith("rgb")) {
    return colorValue;
  }
  
  // Try to convert color name to hex (basic common colors)
  const colorMap: Record<string, string> = {
    red: "#FF0000",
    green: "#00FF00",
    blue: "#0000FF",
    yellow: "#FFFF00",
    orange: "#FFA500",
    purple: "#800080",
    pink: "#FFC0CB",
    black: "#000000",
    white: "#FFFFFF",
    gray: "#808080",
    grey: "#808080",
    brown: "#A52A2A",
    cyan: "#00FFFF",
    magenta: "#FF00FF",
  };
  
  const lowerColor = colorValue.toLowerCase().trim();
  return colorMap[lowerColor] || colorValue;
}

interface IVariantsDisplayProps {
  variants: any[];
  t: (key: string) => string;
}

function VariantsDisplay({ variants, t }: IVariantsDisplayProps) {
  // Get all unique attributes from all variants to create dynamic columns
  const allAttributes = new Map<string, { name: string; type: string }>();
  
  variants.forEach((variant: any) => {
    (variant.attributeValues || []).forEach((av: any) => {
      const attrId = av.attribute?.id;
      if (attrId && !allAttributes.has(attrId)) {
        allAttributes.set(attrId, {
          name: av.attribute.name || "Unknown",
          type: av.attribute.type || "other",
        });
      }
    });
  });

  const attributeColumns = Array.from(allAttributes.entries());

  return (
    <div className="space-y-3 pt-4 border-t">
      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
        {t("variants")} ({variants.length})
      </h3>
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px]">{t("sku")}</TableHead>
              <TableHead className="w-[100px]">{t("price")}</TableHead>
              <TableHead className="w-[80px]">{t("quantity")}</TableHead>
              {attributeColumns.map(([attrId, attr]) => (
                <TableHead key={attrId} className="min-w-[120px]">
                  {attr.name}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {variants.map((variant: any) => (
              <VariantRow
                key={variant.id}
                variant={variant}
                attributeColumns={attributeColumns}
                t={t}
              />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

interface IVariantRowProps {
  variant: any;
  attributeColumns: Array<[string, { name: string; type: string }]>;
  t: (key: string) => string;
}

function VariantRow({ variant, attributeColumns, t }: IVariantRowProps) {
  const attributeValues = variant.attributeValues || [];
  
  // Create a map of attribute ID to values for quick lookup
  const attrValueMap = new Map<string, any[]>();
  attributeValues.forEach((av: any) => {
    const attrId = av.attribute?.id;
    if (attrId) {
      if (!attrValueMap.has(attrId)) {
        attrValueMap.set(attrId, []);
      }
      attrValueMap.get(attrId)!.push(av);
    }
  });

  return (
    <TableRow>
      <TableCell className="font-medium text-sm">{variant.sku}</TableCell>
      <TableCell className="text-sm">
        <div className="flex items-center gap-1">
          <DollarSign className="w-3.5 h-3.5 text-muted-foreground" />
          {Number(variant.price ?? 0).toFixed(2)}
        </div>
      </TableCell>
      <TableCell className="text-sm">
        <div className="flex items-center gap-1">
          <Package className="w-3.5 h-3.5 text-muted-foreground" />
          {variant.quantity ?? 0}
        </div>
      </TableCell>
      {attributeColumns.map(([attrId, attr]) => {
        const values = attrValueMap.get(attrId) || [];
        const isColor = attr.type === EAttributeType.COLOR;
        
        return (
          <TableCell key={attrId} className="text-sm">
            {values.length > 0 ? (
              <div className="flex items-center gap-1.5 flex-wrap">
                {values.map((av: any, idx: number) => {
                  return (
                    <div key={idx} className="flex items-center gap-1.5">
                      {isColor && (
                        <div
                          className="w-4 h-4 rounded border border-border shrink-0"
                          style={{ backgroundColor: av.value }}
                          title={av.value}
                        />
                      )}
                      <span className="text-xs">{av.value}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <span className="text-muted-foreground text-xs">—</span>
            )}
          </TableCell>
        );
      })}

    </TableRow>
  );
}
