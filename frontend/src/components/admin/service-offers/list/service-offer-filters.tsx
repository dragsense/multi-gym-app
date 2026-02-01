import { useId } from "react";
import { useI18n } from "@/hooks/use-i18n";
import { Input } from "@/components/ui/input";
import { AppSelect } from "@/components/layout-ui/app-select";
import type { TListHandlerStore } from "@/stores";
import type { IServiceOffer } from "@shared/interfaces/service-offer.interface";
import { EServiceOfferStatus } from "@shared/enums/service-offer.enum";

interface IServiceOfferFiltersProps {
  store: TListHandlerStore<IServiceOffer, any, any>;
}

export function ServiceOfferFilters({ store }: IServiceOfferFiltersProps) {
  const componentId = useId();
  const { t } = useI18n();

  const filters = store((state) => state.filters);
  const setFilters = store((state) => state.setFilters);

  const statusOptions = [
    { value: EServiceOfferStatus.ACTIVE, label: t("active") || "Active" },
    { value: EServiceOfferStatus.INACTIVE, label: t("inactive") || "Inactive" },
  ];

  return (
    <div className="flex flex-wrap items-center gap-4 flex-1" data-component-id={componentId}>
      <Input
        placeholder={t("search") + " " + t("name") + "..."}
        value={filters?.name || ""}
        onChange={(e) => setFilters({ ...filters, name: e.target.value })}
        className="w-full md:w-64"
      />
      <AppSelect
        placeholder={t("status")}
        value={filters?.status || ""}
        onChange={(value) => setFilters({ ...filters, status: value as EServiceOfferStatus })}
        options={statusOptions}
        className="w-full md:w-48"
      />
    </div>
  );
}

