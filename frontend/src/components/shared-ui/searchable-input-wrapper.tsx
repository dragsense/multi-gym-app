// React & Hooks
import { useEffect, useState, useId, useMemo, useTransition } from "react";

// Types
import type { TCustomInputWrapper } from "@/@types/form/field-config.type";

// Components
import { AppComboBox } from "@/components/layout-ui/app-combo-box";

// Hooks
import { useSearchableResource } from "@/hooks/use-searchable";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";

export interface UserInputPropsWrapperProps<T> extends TCustomInputWrapper {
  multiple?: boolean;
  modal?: boolean;
  useSearchable: () => ReturnType<typeof useSearchableResource<T>>;
  getLabel: (item: T) => string | null;
  getKey: (item: T) => string;
  getValue: (item: T) => T;
  shouldFilter?: boolean;
}

export const SearchableInputWrapper = <T,>({
  value,
  onChange,
  disabled,
  multiple = false,
  modal = false,
  useSearchable,
  getLabel,
  getKey,
  getValue,
  shouldFilter = true,
}: UserInputPropsWrapperProps<T>) => {
  // React 19: Essential IDs and transitions
  const componentId = useId();
  const [, startTransition] = useTransition();
  const { t } = useI18n();

  const { response, isLoading, error, setFilters } = useSearchable();
  const [search, setSearch] = useState("");

  // React 19: Memoized search handler for better performance
  const handleSearchChange = useMemo(
    () => (newSearch: string) => {
      startTransition(() => {
        setSearch(newSearch);
      });
    },
    []
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters({ search });
    }, 300);

    return () => clearTimeout(timer);
  }, [search, setFilters]);

  return (
    <div data-component-id={componentId}>
      <AppComboBox<T>
        value={multiple ? value || [] : value ?? ""}
        getValue={getValue}
        onChange={onChange}
        items={response?.data || []}
        loading={isLoading}
        error={error?.message || null}
        getKey={getKey}
        getLabel={getLabel}
        search={search}
        onSearchChange={handleSearchChange}
        placeholder={buildSentence(t, "select")}
        multiple={multiple}
        modal={modal}
        disabled={disabled}
        shouldFilter={shouldFilter}
      />
    </div>
  );
};
