import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AppCard } from "@/components/layout-ui/app-card";
import {
    ShoppingCart,
    Image as ImageIcon,
    Package,
    DollarSign,
    Plus,
    Minus,
    Eye,
} from "lucide-react";
import type { IProduct } from "@shared/interfaces/products/product.interface";
import { useI18n } from "@/hooks/use-i18n";
import { useTransition } from "react";
import { SEGMENTS, ADMIN_ROUTES } from "@/config/routes.config";
import { useAuthUser } from "@/hooks/use-auth-user";
import { EAttributeType } from "@shared/enums";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addToCart } from "@/services/cart.api";
import { toast } from "sonner";
import { buildSentence } from "@/locales/translations";

interface IStoreProductCardProps {
    product: IProduct;
    onView?: (id: string) => void;
    componentId?: string;
}

export function StoreProductCard({ product, onView, componentId }: IStoreProductCardProps) {
    const { t } = useI18n();
    const { user } = useAuthUser();
    const queryClient = useQueryClient();
    const segment = SEGMENTS[user?.level ?? -1] ?? "/admin";
    const [, startTransition] = useTransition();

    // State
    const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});
    const [quantity, setQuantity] = useState(1);
    const [error, setError] = useState<string | null>(null);

    // Extract attribute groups
    const attributeGroups = useMemo(() => {
        if (!product?.variants?.length) return [];

        const groups = new Map<
            string,
            { id: string; name: string; type: string; values: Map<string, string> }
        >();

        product.variants.forEach((variant: any) => {
            (variant.attributeValues || []).forEach((av: any) => {
                const attrId = av.attribute?.id;
                const attrName = av.attribute?.name || "Unknown";
                const attrType = av.attribute?.type || "other";

                if (attrId) {
                    if (!groups.has(attrId)) {
                        groups.set(attrId, {
                            id: attrId,
                            name: attrName,
                            type: attrType,
                            values: new Map(),
                        });
                    }
                    groups.get(attrId)!.values.set(av.value, av.value);
                }
            });
        });

        return Array.from(groups.values());
    }, [product?.variants]);

    // Find matching variant
    const selectedVariant = useMemo(() => {
        if (!product?.variants?.length || Object.keys(selectedAttributes).length === 0) {
            return null;
        }

        return product.variants.find((variant: any) => {
            const variantAttrs = variant.attributeValues || [];
            return Object.entries(selectedAttributes).every(([attrId, value]) => {
                return variantAttrs.some(
                    (av: any) => av.attribute?.id === attrId && av.value === value
                );
            });
        });
    }, [product?.variants, selectedAttributes]);

    // Computed values
    const currentPrice = selectedVariant
        ? Number(selectedVariant.price ?? product?.defaultPrice ?? 0)
        : Number(product?.defaultPrice ?? 0);

    const currentStock = selectedVariant
        ? selectedVariant.quantity ?? 0
        : product?.totalQuantity ?? 0;

    const currentSku = selectedVariant ? selectedVariant.sku : product?.defaultSku;

    // Handlers
    const handleAttributeSelect = (attrId: string, value: string) => {
        setError(null);
        setSelectedAttributes((prev) => ({
            ...prev,
            [attrId]: value,
        }));
    };

    const addToCartMutation = useMutation({
        mutationFn: () =>
            addToCart({
                productId: product.id,
                productVariantId: selectedVariant?.id,
                quantity,
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["cart"] });
            toast.success(t("addedToCart") || "Added to cart");
            setQuantity(1);
            // Optional: Reset selection? leaving it for repeated adds
        },
        onError: (err: Error) => {
            toast.error(err?.message || buildSentence(t, "failed", "to", "add"));
        },
    });

    const handleAddToCart = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (product.variants && product.variants.length > 0) {
            // Validation: must select all attributes
            const missingAttributes = attributeGroups.filter(
                (g) => !selectedAttributes[g.id]
            );

            if (missingAttributes.length > 0) {
                setError(t("pleaseSelectOptions") || "Please select all options");
                return;
            }

            if (!selectedVariant) {
                setError(t("variantUnavailable") || "Combination unavailable");
                return;
            }
        }

        if (currentStock < quantity) {
            setError(t("outOfStock") || "Out of stock");
            return;
        }

        addToCartMutation.mutate();
    };

    const thumb = product.defaultImages?.[0];
    const thumbUrl = typeof thumb === "object" && thumb?.url ? thumb.url : null;
    const productDetailUrl = `${segment}/${ADMIN_ROUTES.STORE_PRODUCT.replace(":id", product.id)}`;

    return (
        <AppCard
            className="overflow-hidden hover:shadow-lg transition-all duration-200 flex flex-col h-full"
            data-component-id={componentId}
        >
            <Link to={productDetailUrl} className="block shrink-0">
                <div className="relative w-full aspect-[4/3] bg-muted rounded-t-lg overflow-hidden">
                    {thumbUrl ? (
                        <img
                            src={thumbUrl}
                            alt={product.name}
                            className="w-full h-full object-cover"
                            crossOrigin="anonymous"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon className="w-12 h-12 text-muted-foreground/50" />
                        </div>
                    )}
                </div>
            </Link>

            <div className="flex flex-col flex-1 p-4 gap-3">
                {/* Title */}
                <Link to={productDetailUrl} className="block">
                    <h3 className="font-semibold text-base line-clamp-2 hover:text-primary transition-colors">
                        {product.name}
                    </h3>
                </Link>

                {/* Price & Stock */}
                <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1 font-semibold text-primary">
                        <DollarSign className="h-4 w-4" />
                        <span>{currentPrice.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                        <Package className="h-4 w-4" />
                        <span>{currentStock}</span>
                    </div>
                </div>

                {/* Variants */}
                {attributeGroups.length > 0 && (
                    <div className="space-y-2 py-2 border-t border-b border-dashed">
                        {attributeGroups.map((group) => (
                            <div key={group.id} className="space-y-1">
                                <span className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
                                    {group.name}
                                </span>
                                <div className="flex flex-wrap gap-1.5">
                                    {Array.from(group.values.keys()).map((value) => {
                                        const isSelected = selectedAttributes[group.id] === value;
                                        const isColor = group.type === EAttributeType.COLOR;

                                        if (isColor) {
                                            return (
                                                <button
                                                    key={value}
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        handleAttributeSelect(group.id, value);
                                                    }}
                                                    className={`
                              w-6 h-6 rounded-full border shadow-sm transition-all
                              ${isSelected ? "ring-2 ring-primary ring-offset-1 scale-110" : "hover:scale-105"}
                            `}
                                                    style={{ backgroundColor: value }} // Assuming value is hex
                                                    title={value}
                                                />
                                            )
                                        }

                                        return (
                                            <button
                                                key={value}
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    handleAttributeSelect(group.id, value);
                                                }}
                                                className={`
                          px-2 py-0.5 rounded text-xs font-medium border transition-colors
                          ${isSelected
                                                        ? "bg-primary text-primary-foreground border-primary"
                                                        : "bg-background text-foreground border-input hover:bg-accent hover:text-accent-foreground"
                                                    }
                        `}
                                            >
                                                {value}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="flex-1" /> {/* Spacer */}

                {/* Error Message */}
                {error && <p className="text-xs text-red-500 font-medium animate-in fade-in slide-in-from-top-1">{error}</p>}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2">
                    {/* Quantity */}
                    <div className="flex items-center border rounded-md h-8 bg-background shrink-0">
                        <button
                            className="h-full px-2 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setQuantity(Math.max(1, quantity - 1));
                            }}
                            disabled={quantity <= 1}
                        >
                            <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center text-xs font-medium tabular-nums">
                            {quantity}
                        </span>
                        <button
                            className="h-full px-2 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setQuantity(Math.min(currentStock || 99, quantity + 1));
                            }}
                            disabled={quantity >= (currentStock || 99)}
                        >
                            <Plus className="w-3 h-3" />
                        </button>
                    </div>

                    {/* Add to Cart */}
                    <Button
                        size="sm"
                        className="flex-1 h-8 text-xs font-semibold"
                        onClick={handleAddToCart}
                        disabled={addToCartMutation.isPending || (currentStock === 0)}
                    >
                        {addToCartMutation.isPending ? (
                            <span className="animate-pulse">...</span>
                        ) : (
                            <>
                                <ShoppingCart className="w-3.5 h-3.5 mr-1.5" />
                                {t("add")}
                            </>
                        )}
                    </Button>

                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        asChild
                    >
                        <Link to={productDetailUrl} title={t("view")}>
                            <Eye className="w-4 h-4 text-muted-foreground" />
                        </Link>
                    </Button>
                </div>
            </div>
        </AppCard>
    );
}
