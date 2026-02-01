// hooks/use-searchable-resource.ts
import { useMemo, useDeferredValue } from "react";
import type { IListQueryParams } from "@shared/interfaces/api/param.interface";
import { useApiPaginatedQuery } from "./use-api-paginated-query";

import type { IUser } from "@shared/interfaces/user.interface";
import { fetchUsers } from "@/services/user.api";
import type { IMember, IPaginatedResponse, IPermission, IResource, IStaff, IAccessHour, IAccessFeature, IRole, IProductType } from "@shared/interfaces";
import { fetchMembers } from "@/services/member.api";
import { fetchPermissions, fetchResources, fetchRoles } from "@/services/roles.api";
import { fetchSubscriptions } from "@/services/subscription.api";
import { fetchAccessHours } from "@/services/membership/access-hour.api";
import { fetchAccessFeatures } from "@/services/membership/access-feature.api";
import { fetchEquipmentTypes } from "@/services/equipment-type.api";
import { fetchEquipment } from "@/services/equipment.api";
import type { IEquipmentType, IEquipment } from "@shared/interfaces/equipment-reservation.interface";
import type { ISubscription } from "@shared/interfaces/business";
import { fetchBannerImages } from "@/services/banner-image.api";
import type { IBannerImage } from "@shared/interfaces/advertisement.interface";
import { fetchServiceOffers } from "@/services/service-offer.api";
import type { IServiceOffer } from "@shared/interfaces/service-offer.interface";
import { fetchTrainerServices } from "@/services/trainer-service.api";
import type { ITrainerService } from "@shared/interfaces/trainer-service.interface";
import { fetchLocations } from "@/services/location.api";
import { fetchDoors, fetchDoorsByLocation } from "@/services/location/door.api";
import type { ILocation } from "@shared/interfaces/location.interface";
import type { IDoor } from "@shared/interfaces/door.interface";
import { fetchDeviceReaders } from "@/services/device-reader.api";
import type { IDeviceReader } from "@shared/interfaces/device-reader.interface";
import { fetchCameras } from "@/services/camera.api";
import type { ICamera } from "@shared/interfaces/camera.interface";
import { 
  } from "@shared/enums/trainer-service.enum";
import { fetchStaff } from "@/services/staff.api";
import { EServiceOfferStatus } from "@shared/enums/service-offer.enum";
import { fetchProductTypes, fetchAttributes, fetchAttributeValuesByAttribute } from "@/services/products";
import type { IAttribute, IAttributeValue } from "@shared/interfaces";

export function useSearchableResource<T>(
  key: string,
  fetcher: (params: IListQueryParams) => Promise<IPaginatedResponse<T>>,
  initialParams: IListQueryParams = { page: 1, limit: 10 }
) {
  // React 19: Memoized key for better performance
  const memoizedKey = useMemo(() => [key], [key]);

  // React 19: Deferred initial params for better performance
  const deferredInitialParams = useDeferredValue(initialParams);

  const { data, isLoading, error, setFilters } = useApiPaginatedQuery<T>(
    memoizedKey,
    fetcher,
    deferredInitialParams
  );

  // React 19: Memoized return value to prevent unnecessary re-renders
  return useMemo(() => ({
    response: data,
    isLoading,
    error,
    setFilters,
  }), [data, isLoading, error, setFilters]);
}



export function useSearchableUsers({ level, initialParams }: { level?: number, initialParams?: IListQueryParams }) {
  // React 19: Memoized key generation for better performance
  const memoizedKey = useMemo(() =>
    "searchable-users" + (level ? `-${level}` : ""),
    [level]
  );

  // React 19: Memoized fetcher for better performance
  const memoizedFetcher = useMemo(() =>
    (params: IListQueryParams) => fetchUsers(params, level),
    [level]
  );

  return useSearchableResource<IUser>(
    memoizedKey,
    memoizedFetcher,
    { ...initialParams }
  );
}


export function useSearchableTrainers({ initialParams }: { initialParams?: IListQueryParams }) {
  // React 19: Memoized key generation for better performance
  const memoizedKey = "searchable-trainers";

  // React 19: Memoized fetcher for better performance
  const memoizedFetcher = useMemo(() =>
    (params: IListQueryParams) => fetchStaff({
      ...params,
      _relations: 'user',
      _select: 'id, user.email, user.firstName, user.lastName',
      filters: {
        ...params.filters,
        isTrainer: true,
      },
    }),
    []);

  return useSearchableResource<IStaff>(
    memoizedKey,
    memoizedFetcher,
    initialParams
  );
}



export function useSearchableMembers({ initialParams }: { initialParams?: IListQueryParams }) {
  // React 19: Memoized key generation for better performance
  const memoizedKey = "searchable-members";

  // React 19: Memoized fetcher for better performance
  const memoizedFetcher = useMemo(() =>
    (params: IListQueryParams) => fetchMembers({
      ...params,
      _relations: 'user',
      _select: 'id, user.email, user.firstName, user.lastName',
    }),
    []);

  return useSearchableResource<IMember>(
    memoizedKey,
    memoizedFetcher,
    initialParams
  );
}


export function useSearchableResources({ initialParams }: { initialParams?: IListQueryParams }) {
  // React 19: Memoized key generation for better performance
  const memoizedKey = "searchable-resources";

  // React 19: Memoized fetcher for better performance
  const memoizedFetcher = useMemo(() =>
    (params: IListQueryParams) => fetchResources(params),
    []);

  return useSearchableResource<IResource>(
    memoizedKey,
    memoizedFetcher,
    initialParams
  );
}


export function useSearchablePermissions({ initialParams }: { initialParams?: IListQueryParams }) {
  // React 19: Memoized key generation for better performance
  const memoizedKey = "searchable-permissions";

  // React 19: Memoized fetcher for better performance
  const memoizedFetcher = useMemo(() =>
    (params: IListQueryParams) => fetchPermissions(params),
    []);

  return useSearchableResource<IPermission>(
    memoizedKey,
    memoizedFetcher,
    initialParams
  );
}

export function useSearchableRoles({ initialParams }: { initialParams?: IListQueryParams }) {
  // React 19: Memoized key generation for better performance
  const memoizedKey = "searchable-roles";

  // React 19: Memoized fetcher for better performance
  const memoizedFetcher = useMemo(() =>
    (params: IListQueryParams) => fetchRoles(params),
    []);

  return useSearchableResource<IRole>(
    memoizedKey,
    memoizedFetcher,
    initialParams
  );
}


export function useSearchableSubscriptions({ initialParams }: { initialParams?: IListQueryParams }) {
  // React 19: Memoized key generation for better performance
  const memoizedKey = "searchable-subscriptions";

  // React 19: Memoized fetcher for better performance
  const memoizedFetcher = useMemo(() =>
    (params: IListQueryParams) => fetchSubscriptions(params),
    []);

  return useSearchableResource<ISubscription>(
    memoizedKey,
    memoizedFetcher,
    initialParams
  );
}

export function useSearchableAccessHours({ initialParams }: { initialParams?: IListQueryParams }) {
  // React 19: Memoized key generation for better performance
  const memoizedKey = "searchable-access-hours";

  // React 19: Memoized fetcher for better performance
  const memoizedFetcher = useMemo(() =>
    (params: IListQueryParams) => fetchAccessHours({
      ...params,
      _select: 'id, name, startTime, endTime, daysOfWeek'
    }),
    []);

  return useSearchableResource<IAccessHour>(
    memoizedKey,
    memoizedFetcher,
    initialParams
  );
}

export function useSearchableAccessFeatures({ initialParams }: { initialParams?: IListQueryParams }) {
  // React 19: Memoized key generation for better performance
  const memoizedKey = "searchable-access-features";

  // React 19: Memoized fetcher for better performance
  const memoizedFetcher = useMemo(() =>
    (params: IListQueryParams) => fetchAccessFeatures({
      ...params,
      _select: 'id, name, description'
    }),
    []);

  return useSearchableResource<IAccessFeature>(
    memoizedKey,
    memoizedFetcher,
    initialParams
  );
}

export function useSearchableLocations({ initialParams }: { initialParams?: IListQueryParams }) {
  // React 19: Memoized key generation for better performance
  const memoizedKey = "searchable-locations";

  // React 19: Memoized fetcher for better performance
  const memoizedFetcher = useMemo(() =>
    (params: IListQueryParams) => fetchLocations(params),
    []);

  return useSearchableResource<ILocation>(
    memoizedKey,
    memoizedFetcher,
    initialParams
  );
}

export function useSearchableEquipmentTypes({ initialParams }: { initialParams?: IListQueryParams }) {
  // React 19: Memoized key generation for better performance
  const memoizedKey = "searchable-equipment-types";

  // React 19: Memoized fetcher for better performance
  const memoizedFetcher = useMemo(() =>
    (params: IListQueryParams) => fetchEquipmentTypes({
      ...params,
      _select: 'id, name, description',
    }),
    []);

  return useSearchableResource<IEquipmentType>(
    memoizedKey,
    memoizedFetcher,
    initialParams
  );
}

export function useSearchableEquipment({ initialParams }: { initialParams?: IListQueryParams }) {
  // React 19: Memoized key generation for better performance
  const memoizedKey = "searchable-equipment";

  // React 19: Memoized fetcher for better performance
  const memoizedFetcher = useMemo(() =>
    (params: IListQueryParams) => fetchEquipment({
      ...params,
      _relations: 'equipmentType',
    }),
    []);

  return useSearchableResource<IEquipment>(
    memoizedKey,
    memoizedFetcher,
    initialParams
  );
}

export function useSearchableDoors({ locationId, initialParams }: { locationId?: string, initialParams?: IListQueryParams }) {
  // React 19: Memoized key generation for better performance
  const memoizedKey = useMemo(() => `searchable-doors-${locationId || 'all'}`, [locationId]);

  // React 19: Memoized fetcher for better performance
  const memoizedFetcher = useMemo(() =>
    (params: IListQueryParams) => {
      if (locationId) {
        return fetchDoorsByLocation(locationId, params);
      }
      // When no locationId, fetch all doors (useful for multiple locations)
      return fetchDoors({
        ...params,
        _select: 'id, name, description, locationId'
      });
    },
    [locationId]);

  return useSearchableResource<IDoor>(
    memoizedKey,
    memoizedFetcher,
    initialParams
  );
}

export function useSearchableBannerImages({ initialParams }: { initialParams?: IListQueryParams }) {
  // React 19: Memoized key generation for better performance
  const memoizedKey = "searchable-banner-images";

  // React 19: Memoized fetcher for better performance
  const memoizedFetcher = useMemo(() =>
    (params: IListQueryParams) => fetchBannerImages({
      ...params,
      _relations: 'image',
      _select: 'id, name, createdAt, image.url, image.name'
    }),
    []);

  return useSearchableResource<IBannerImage>(
    memoizedKey,
    memoizedFetcher,
    initialParams
  );
}

export function useSearchableServiceOffers({ initialParams }: { initialParams?: IListQueryParams }) {
  // React 19: Memoized key generation for better performance
  const memoizedKey = "searchable-service-offers";

  // React 19: Memoized fetcher for better performance
  const memoizedFetcher = useMemo(() =>
    (params: IListQueryParams) => fetchServiceOffers({
      ...params,
      _relations: 'trainer.user,trainerService',
      filters: {
        ...params.filters,
        status: EServiceOfferStatus.ACTIVE,
      },
    }),
    []);

  return useSearchableResource<IServiceOffer>(
    memoizedKey,
    memoizedFetcher,
    initialParams
  );
}

export function useSearchableTrainerServices({ initialParams }: { initialParams?: IListQueryParams }) {
  // React 19: Memoized key generation for better performance
  const memoizedKey = "searchable-trainer-services";

  // React 19: Memoized fetcher for better performance
  const memoizedFetcher = useMemo(() =>
    (params: IListQueryParams) => fetchTrainerServices({
      ...params,
    }),
    []);

  return useSearchableResource<ITrainerService>(
    memoizedKey,
    memoizedFetcher,
    initialParams
  );
}

export function useSearchableProductTypes({ initialParams }: { initialParams?: IListQueryParams }) {
  const memoizedKey = "searchable-product-types";
  const memoizedFetcher = useMemo(
    () => (params: IListQueryParams) => fetchProductTypes(params),
    []
  );
  return useSearchableResource<IProductType>(
    memoizedKey,
    memoizedFetcher,
    initialParams
  );
}

export function useSearchableAttributes({ initialParams }: { initialParams?: IListQueryParams }) {
  const memoizedKey = "searchable-attributes";
  const memoizedFetcher = useMemo(
    () => (params: IListQueryParams) => fetchAttributes(params),
    []
  );
  return useSearchableResource<IAttribute>(
    memoizedKey,
    memoizedFetcher,
    initialParams
  );
}


export function useAttributeValues(attributeId: string, { initialParams }: { initialParams?: IListQueryParams }) {
  const memoizedKey = useMemo(
    () => `searchable-attribute-values-${attributeId}`,
    [attributeId]
  );
  const memoizedFetcher = useMemo(
    () => (params: IListQueryParams) => fetchAttributeValuesByAttribute(attributeId, params),
    [attributeId]
  );
  return useSearchableResource<IAttributeValue>(
    memoizedKey,
    memoizedFetcher,
    initialParams
  );
}


export function useSearchableCameras({ locationId, initialParams }: { locationId?: string, initialParams?: IListQueryParams }) {
  // React 19: Memoized key generation for better performance
  const memoizedKey = useMemo(() => `searchable-cameras-${locationId || 'all'}`, [locationId]);

  // React 19: Memoized fetcher for better performance
  const memoizedFetcher = useMemo(() =>
    (params: IListQueryParams) => fetchCameras({
      ...params,
      _select: 'id, name, description, locationId',
    }, locationId),
    [locationId]);

  return useSearchableResource<ICamera>(
    memoizedKey,
    memoizedFetcher,
    initialParams
  );
}

export function useSearchableDeviceReaders({ initialParams }: { initialParams?: IListQueryParams }) {
  // React 19: Memoized key generation for better performance
  const memoizedKey = "searchable-device-readers";

  // React 19: Memoized fetcher for better performance
  const memoizedFetcher = useMemo(() =>
    (params: IListQueryParams) => fetchDeviceReaders({
      ...params,
      _select: 'id, deviceName, macAddress'
    }),
    []);

  return useSearchableResource<IDeviceReader>(
    memoizedKey,
    memoizedFetcher,
    initialParams
  );
}
