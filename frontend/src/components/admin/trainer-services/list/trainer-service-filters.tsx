import { useId } from "react";
import { useI18n } from "@/hooks/use-i18n";
import { Input } from "@/components/ui/input";
import { AppSelect } from "@/components/layout-ui/app-select";
import type { TListHandlerStore } from "@/stores";
import type { ITrainerService } from "@shared/interfaces/trainer-service.interface";
import { ETrainerServiceStatus } from "@shared/enums/trainer-service.enum";

interface ITrainerServiceFiltersProps {
  store: TListHandlerStore<ITrainerService, any, any>;
}

export function TrainerServiceFilters({ store }: ITrainerServiceFiltersProps) {
  const componentId = useId();
  const { t } = useI18n();

  const filters = store((state) => state.filters);
  const setFilters = store((state) => state.setFilters);

  const statusOptions = [
    { value: ETrainerServiceStatus.ACTIVE, label: t("active") || "Active" },
    { value: ETrainerServiceStatus.INACTIVE, label: t("inactive") || "Inactive" },
  ];

  return (
    <div className="flex flex-wrap items-center gap-4 flex-1" data-component-id={componentId}>
      <Input
        placeholder={t("search") + " " + t("title") + "..."}
        value={filters?.title || ""}
        onChange={(e) => setFilters({ ...filters, title: e.target.value })}
        className="w-full md:w-64"
      />
      <AppSelect
        placeholder={t("status")}
        value={filters?.status || ""}
        onChange={(value) => setFilters({ ...filters, status: value as ETrainerServiceStatus })}
        options={statusOptions}
        className="w-full md:w-48"
      />
    </div>
  );
}

