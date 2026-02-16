import { useId } from "react";
import { useI18n } from "@/hooks/use-i18n";
import { Input } from "@/components/ui/input";
import { AppSelect } from "@/components/layout-ui/app-select";
import type { TListHandlerStore } from "@/stores";
import type { IFacilityInfo } from "@shared/interfaces/facility-info.interface";
import { EFacilityInfoStatus } from "@shared/enums/facility-info.enum";

interface IFacilityInfoFiltersProps {
  store: TListHandlerStore<IFacilityInfo, any, any>;
}

export function FacilityInfoFilters({ store }: IFacilityInfoFiltersProps) {
  const componentId = useId();
  const { t } = useI18n();

  const filters = store((state) => state.filters);
  const setFilters = store((state) => state.setFilters);

  const statusOptions = [
    { value: EFacilityInfoStatus.ACTIVE, label: t("active") || "Active" },
    { value: EFacilityInfoStatus.INACTIVE, label: t("inactive") || "Inactive" },
  ];

  return (
    <div className="flex flex-wrap items-center gap-4 flex-1" data-component-id={componentId}>
      <Input
        placeholder={t("search") + " " + t("email") + "..."}
        value={filters?.email || ""}
        onChange={(e) => setFilters({ ...filters, email: e.target.value })}
        className="w-full md:w-64"
      />
      <AppSelect
        placeholder={t("status")}
        value={filters?.status || ""}
        onChange={(value) => setFilters({ ...filters, status: value as EFacilityInfoStatus })}
        options={statusOptions}
        className="w-full md:w-48"
      />
    </div>
  );
}

