// React
import { useId, useMemo, useTransition } from "react";

// External Libraries
import { Search } from "lucide-react";

// Custom UI Components
import { Input } from "@/components/ui/input";

// Utilities
import { cn } from "@/lib/utils";


interface SearchProps {
  search: string
  onSearchChange: (searchTerm: string) => void
  className?: string
  placeholder?: string
 
}
export default function AppSearch({ placeholder, search, onSearchChange, className }: SearchProps) {
  // React 19: Essential IDs and transitions
  const componentId = useId();
  const [, startTransition] = useTransition();

  // React 19: Memoized placeholder for better performance
  const memoizedPlaceholder = useMemo(() => placeholder ?? "search...", [placeholder]);

  // React 19: Smooth search changes
  const handleSearchChange = (value: string) => {
    startTransition(() => {
      onSearchChange?.(value);
    });
  };

  return (
    <div className="relative" data-component-id={componentId}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 h-4 w-4 " />
      <Input
        value={search}
        placeholder={memoizedPlaceholder}
        onChange={(e) => handleSearchChange(e.target.value)}
        className={cn("pl-10", className)}
      />
    </div>
  )
}
