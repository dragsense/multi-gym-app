import { useId } from "react";
import { useI18n } from "@/hooks/use-i18n";
import { Input } from "@/components/ui/input";
import { AppSelect } from "@/components/layout-ui/app-select";
import type { TListHandlerStore } from "@/stores";
import type { IDeviceReader } from "@shared/interfaces/device-reader.interface";
import { EDeviceReaderStatus } from "@shared/enums/device-reader.enum";

interface IDeviceReaderFiltersProps {
  store: TListHandlerStore<IDeviceReader, any, any>;
}

export function DeviceReaderFilters({ store }: IDeviceReaderFiltersProps) {
  const componentId = useId();
  const { t } = useI18n();

  const filters = store((state) => state.filters);
  const setFilters = store((state) => state.setFilters);

  const statusOptions = [
    { value: EDeviceReaderStatus.ACTIVE, label: t("active") || "Active" },
    { value: EDeviceReaderStatus.INACTIVE, label: t("inactive") || "Inactive" },
    { value: EDeviceReaderStatus.MAINTENANCE, label: t("maintenance") || "Maintenance" },
  ];

  return (
    <div className="flex flex-wrap items-center gap-4 flex-1" data-component-id={componentId}>
      <Input
        placeholder={t("search") + " " + t("deviceName") + "..."}
        value={filters?.deviceName || ""}
        onChange={(e) => setFilters({ ...filters, deviceName: e.target.value })}
        className="w-full md:w-64"
      />
      <AppSelect
        placeholder={t("status")}
        value={filters?.status || ""}
        onChange={(value) => setFilters({ ...filters, status: value as EDeviceReaderStatus })}
        options={statusOptions}
        className="w-full md:w-48"
      />
    </div>
  );
}

