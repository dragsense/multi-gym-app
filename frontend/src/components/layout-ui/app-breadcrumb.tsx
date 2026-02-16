// React & Hooks
import { Link, useLocation } from "react-router-dom";
import { useMemo } from "react";

// External Libraries
import { ChevronRight, Home, ChevronLeft } from "lucide-react";

// Config
import { ROUTE_TITLES, SEGMENTS, ROOT_ROUTE } from "@/config/routes.config";

// Hooks
import { useAuthUser } from "@/hooks/use-auth-user";
import { useI18n } from "@/hooks/use-i18n";

interface BreadcrumbItem {
    label: string;
    path: string;
}

export function AppBreadcrumb() {
    const location = useLocation();
    const { user } = useAuthUser();
    const { t, direction } = useI18n();

    const breadcrumbs = useMemo(() => {
        if (!user) return [];

        const segment = SEGMENTS[user.level ?? -1];
        if (!segment) return [];

        const pathParts = location.pathname.split("/").filter(Boolean);
        const segmentPart = segment.replace(/^\//, "");

        const items: BreadcrumbItem[] = [
            { label: t('home'), path: ROOT_ROUTE },
        ];

        let currentPath = "";

        pathParts.forEach((part) => {
            currentPath += `/${part}`;

            if (part === segmentPart) {
                return;
            }

            const relativePath = currentPath.replace(segment, "").replace(/^\//, "");
            const titleKey = ROUTE_TITLES[relativePath];
            const label = titleKey ? t(titleKey) : part.charAt(0).toUpperCase() + part.slice(1).replace(/-/g, " ");

            items.push({
                label,
                path: currentPath,
            });
        });

        return items;
    }, [location.pathname, user, t]);

    if (breadcrumbs.length <= 1) return null;

    const ChevronIcon = direction === 'rtl' ? ChevronLeft : ChevronRight;

    return (
        <nav className="flex items-center gap-2 text-sm text-muted-foreground" aria-label="Breadcrumb" dir={direction}>
            {breadcrumbs.map((crumb, index) => {
                const isLast = index === breadcrumbs.length - 1;
                return (
                    <div key={crumb.path} className="flex items-center gap-2">
                        {index === 0 ? (
                            <Link to={crumb.path} className="hover:text-foreground transition-colors">
                                <Home className="h-4 w-4" />
                            </Link>
                        ) : (
                            <>
                                <ChevronIcon className="h-4 w-4" />
                                {isLast ? (
                                    <span className="text-foreground font-medium">{crumb.label}</span>
                                ) : (
                                    <Link to={crumb.path} className="hover:text-foreground transition-colors">
                                        {crumb.label}
                                    </Link>
                                )}
                            </>
                        )}
                    </div>
                );
            })}
        </nav>
    );
}
