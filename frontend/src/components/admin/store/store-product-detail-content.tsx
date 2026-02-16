import { useId, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { AppCard } from "@/components/layout-ui/app-card";
import { Button } from "@/components/ui/button";
import {
    Image as ImageIcon,
    Tag,
    ShoppingCart,
    ArrowLeft,
    Plus,
    Minus,
} from "lucide-react";
import type { IProduct } from "@shared/interfaces/products/product.interface";
import { useI18n } from "@/hooks/use-i18n";
import { SEGMENTS, ADMIN_ROUTES } from "@/config/routes.config";
import { useAuthUser } from "@/hooks/use-auth-user";
import { EAttributeType } from "@shared/enums";

interface IStoreProductDetailContentProps {
    product: IProduct | undefined;
    isLoading?: boolean;
    onAddToCart?: (variantId?: string, quantity?: number) => void;
}

export default function StoreProductDetailContent({
    product,
    isLoading,
    onAddToCart,
}: IStoreProductDetailContentProps) {
    const componentId = useId();
    const { t } = useI18n();
    const { user } = useAuthUser();
    const segment = SEGMENTS[user?.level ?? -1] ?? "/admin";

    // State for selected variant attributes and quantity
    const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});
    const [quantity, setQuantity] = useState(1);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [error, setError] = useState<string | null>(null);

    // Extract attribute groups from variants
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
                    // Use value as both key and display
                    groups.get(attrId)!.values.set(av.value, av.value);
                }
            });
        });

        return Array.from(groups.values());
    }, [product?.variants]);



    // Find matching variant based on selected attributes
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

    // Calculate current price based on selected variant
    const currentPrice = useMemo(() => {
        if (selectedVariant) {
            return Number(selectedVariant.price ?? product?.defaultPrice ?? 0);
        }
        return Number(product?.defaultPrice ?? 0);
    }, [selectedVariant, product?.defaultPrice]);

    // Calculate current stock
    const currentStock = useMemo(() => {
        if (selectedVariant) {
            return selectedVariant.quantity ?? 0;
        }
        return product?.totalQuantity ?? 0;
    }, [selectedVariant, product?.totalQuantity]);

    // Current SKU
    const currentSku = useMemo(() => {
        if (selectedVariant) {
            return selectedVariant.sku;
        }
        return product?.defaultSku;
    }, [selectedVariant, product?.defaultSku]);

    const handleAttributeSelect = (attrId: string, value: string) => {
        setError(null);
        setSelectedAttributes((prev) => ({
            ...prev,
            [attrId]: value,
        }));
    };

    const handleAddToCartClick = () => {
        if (!onAddToCart) return;

        if (attributeGroups.length > 0) {
            const missingAttributes = attributeGroups.filter(g => !selectedAttributes[g.id]);
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

        onAddToCart(selectedVariant?.id, quantity);
    };

    if (isLoading) {
        return (
            <div className="space-y-4" data-component-id={componentId}>
                <AppCard loading>{null}</AppCard>
            </div>
        );
    }

    if (!product) {
        return (
            <div data-component-id={componentId}>
                <AppCard>
                    <div className="p-8 text-center text-muted-foreground">
                        <p>{t("productNotFound") || "Product not found."}</p>
                    </div>
                </AppCard>
            </div>
        );
    }

    // Get images
    const images = product.defaultImages || [];
    const currentImage =
        images[selectedImageIndex] &&
            typeof images[selectedImageIndex] === "object" &&
            (images[selectedImageIndex] as any)?.url
            ? (images[selectedImageIndex] as any).url
            : null;

    return (
        <div className="space-y-6" data-component-id={componentId}>
            {/* Back Button */}
            <div>
                <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-foreground">
                    <Link to={`${segment}/${ADMIN_ROUTES.STORE}`}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        {t("backToStore") || "Back to Store"}
                    </Link>
                </Button>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-1">
                {/* Left Column - Images */}
                <div className="flex gap-4">
                    {/* Main Image - Fixed Square */}
                    <div className="w-[550px] h-[550px] rounded-lg overflow-hidden border bg-muted shrink-0">
                        {currentImage ? (
                            <img
                                src={currentImage}
                                alt={product.name}
                                className="w-full h-full object-contain bg-white"
                                crossOrigin="anonymous"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-muted">
                                <ImageIcon className="w-20 h-20 text-muted-foreground/30" />
                            </div>
                        )}
                    </div>

                    {/* Thumbnails - Vertical Column on Right */}
                    {images.length > 1 && (
                        <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto">
                            {images.slice(0, 6).map((img, idx) => {
                                const url =
                                    typeof img === "object" && (img as any)?.url
                                        ? (img as any).url
                                        : null;
                                if (!url) return null;
                                return (
                                    <button
                                        key={idx}
                                        onClick={() => setSelectedImageIndex(idx)}
                                        className={`
                                            w-16 h-16 rounded-md overflow-hidden border-2 bg-white shrink-0 
                                            transition-all duration-200
                                            ${selectedImageIndex === idx
                                                ? "border-primary ring-2 ring-primary/20"
                                                : "border-border hover:border-primary/50"
                                            }
                                        `}
                                    >
                                        <img
                                            src={url}
                                            alt=""
                                            className="w-full h-full object-contain"
                                            crossOrigin="anonymous"
                                        />
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Right Column - Product Details */}
                <div className="space-y-6">
                    {/* Product Name */}
                    <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
                        {product.name}
                    </h1>

                    {/* Price */}
                    <div className="text-3xl lg:text-4xl font-bold text-primary">
                        ${currentPrice.toFixed(2)}
                    </div>

                    {/* Stock & SKU */}
                    <div className="flex items-center gap-3 text-sm">
                        <div className="flex items-center gap-2 text-green-600">
                            {/* Glowing green dot */}
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                            </span>
                            <span className="font-medium">{t("inStock") || "In Stock"} ({currentStock})</span>
                        </div>
                        {currentSku && (
                            <>
                                <span className="text-muted-foreground">•</span>
                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                    <Tag className="w-4 h-4" />
                                    <span>SKU: {currentSku}</span>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Variant Selectors */}
                    {attributeGroups.length > 0 && (
                        <div className="space-y-5 py-4 border-t border-b">
                            {attributeGroups.map((group) => {
                                const isColor = group.type === EAttributeType.COLOR;
                                const valuesArray = Array.from(group.values.keys());
                                const selectedValue = selectedAttributes[group.id];

                                return (
                                    <div key={group.id} className="space-y-2">
                                        {/* Label with selected value */}
                                        <div className="text-sm font-medium">
                                            {group.name}:{" "}
                                            <span className="text-primary font-semibold">
                                                {selectedValue || valuesArray[0]}
                                            </span>
                                        </div>

                                        {/* Selection Buttons */}
                                        <div className="flex flex-wrap gap-2">
                                            {valuesArray.map((value) => {
                                                const isSelected = selectedValue === value;

                                                if (isColor) {
                                                    // Color swatch button
                                                    return (
                                                        <button
                                                            key={value}
                                                            onClick={() => handleAttributeSelect(group.id, value)}
                                                            className={`
                                                                w-8 h-8 rounded-full border shadow-sm transition-all
                                                                ${isSelected
                                                                    ? "ring-2 ring-primary ring-offset-2 scale-110"
                                                                    : "hover:scale-110"
                                                                }
                                                            `}
                                                            style={{ backgroundColor: value }}
                                                            title={value}
                                                        />
                                                    );
                                                }

                                                // Regular button (for size, etc.)
                                                return (
                                                    <button
                                                        key={value}
                                                        onClick={() => handleAttributeSelect(group.id, value)}
                                                        className={`
                              min-w-[40px] px-3 py-1.5 rounded-md text-sm font-medium border-2 transition-all
                              ${isSelected
                                                                ? "border-primary bg-primary text-primary-foreground"
                                                                : "border-border bg-background hover:border-primary/50"
                                                            }
                            `}
                                                    >
                                                        {value}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Quantity Selector with Plus/Minus */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">{t("quantity") || "Quantity"}</label>
                        <div className="flex items-center gap-3">
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-10 w-10 rounded-md"
                                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                                disabled={quantity <= 1}
                            >
                                <Minus className="w-4 h-4" />
                            </Button>
                            <span className="w-12 text-center text-lg font-semibold tabular-nums">
                                {quantity}
                            </span>
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-10 w-10 rounded-md"
                                onClick={() => setQuantity((q) => Math.min(currentStock || 99, q + 1))}
                                disabled={quantity >= (currentStock || 99)}
                            >
                                <Plus className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Add to Cart Button */}
                    {error && (
                        <div className="text-red-500 font-medium text-sm animate-in fade-in slide-in-from-top-1">
                            {error}
                        </div>
                    )}
                    <Button
                        onClick={handleAddToCartClick}
                        size="lg"
                        className="w-full h-12 text-base font-semibold"
                        disabled={currentStock === 0}
                    >
                        <ShoppingCart className="w-5 h-5 mr-2" />
                        {t("addToCart") || "Add to Cart"} - ${(currentPrice * quantity).toFixed(2)}
                    </Button>

                    {/* Description */}
                    {product.description && (
                        <div className="pt-4">
                            <h3 className="text-sm font-semibold uppercase tracking-wide mb-3">
                                {t("description") || "Description"}
                            </h3>
                            <div
                                className="text-sm text-muted-foreground leading-relaxed break-words"
                                dangerouslySetInnerHTML={{ __html: product.description }}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Related products are rendered at page-component level */}

            {/* Bottom Navigation */}
            <div className="flex justify-center pt-6 border-t">
                <Button variant="outline" asChild>
                    <Link to={`${segment}/${ADMIN_ROUTES.STORE}`}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        {t("continueShopping") || "Continue Shopping"}
                    </Link>
                </Button>
            </div>
        </div>
    );
}
