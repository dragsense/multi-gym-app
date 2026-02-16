import * as React from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { navItems } from "@/config/nav.config";
import { matchRoutePath } from "@/lib/utils";
import { useId, useMemo, useTransition } from "react";

interface StackedNavProps {
  className?: string;
  onBack?: () => void;
}

interface NavStack {
  title: string;
  items: typeof navItems;
  parent?: string;
}

export function StackedNav({ className, onBack }: StackedNavProps) {
  // React 19: Essential IDs and transitions
  const componentId = useId();
  const [, startTransition] = useTransition();
  
  const location = useLocation();
  const [navStack, setNavStack] = React.useState<NavStack[]>([
    { title: "Main Menu", items: navItems }
  ]);

  const currentLevel = navStack[navStack.length - 1];
  const isMainMenu = navStack.length === 1;

  // React 19: Smooth navigation transitions
  const handleItemClick = (item: typeof navItems[0]) => {
    if (item.children && item.children.length > 0) {
      startTransition(() => {
        // Push sub-menu to stack
        setNavStack(prev => [...prev, {
          title: item.title,
          items: item.children!.map(child => ({
            title: child.title,
            icon: child.icon,
            urls: [child.url],
            children: undefined
          })),
          parent: currentLevel.title
        }]);
      });
    }
  };

  const handleBack = () => {
    startTransition(() => {
      if (navStack.length > 1) {
        setNavStack(prev => prev.slice(0, -1));
      } else if (onBack) {
        onBack();
      }
    });
  };

  const NavItem = ({ item }: { item: typeof navItems[0] }) => {
    const isActive = item.urls?.some((url) => matchRoutePath(url, location.pathname));
    const hasChildren = item.children && item.children.length > 0;
    const Icon = item.icon;

    if (hasChildren) {
      return (
        <button
          onClick={() => handleItemClick(item)}
          className={cn(
            "flex items-center justify-between w-full p-4 rounded-xl transition-all duration-200",
            "hover:bg-muted/50 text-left"
          )}
        >
          <div className="flex items-center gap-3">
            {Icon && <Icon className="h-6 w-6 text-muted-foreground" />}
            <span className="font-medium">{item.title}</span>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </button>
      );
    }

    return (
      <Link
        to={item.urls[0]}
        className={cn(
          "flex items-center gap-3 p-4 rounded-xl transition-all duration-200",
          isActive
            ? "bg-primary/10 text-primary"
            : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
        )}
      >
        {Icon && <Icon className="h-6 w-6" />}
        <span className="font-medium">{item.title}</span>
      </Link>
    );
  };

  return (
    <div className={cn("flex flex-col h-full", className)} data-component-id={componentId}>
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b">
        {!isMainMenu && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="p-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        <div>
          <h2 className="font-semibold text-lg">{currentLevel.title}</h2>
          {!isMainMenu && (
            <p className="text-sm text-muted-foreground">
              {currentLevel.parent}
            </p>
          )}
        </div>
      </div>

      {/* Navigation Items */}
      <div className="flex-1 overflow-y-auto p-2">
        <div className="space-y-1">
          {currentLevel.items.map((item) => (
            <NavItem key={item.title} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
}
