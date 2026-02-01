// Utils
import { BaseService } from "./base.service.api";

// Types
import type { IListQueryParams } from "@shared/interfaces/api/param.interface";
import type { IServiceOffer, IServiceOfferResponse } from "@shared/interfaces/service-offer.interface";
import type { TCreateServiceOfferData, TUpdateServiceOfferData } from "@shared/types/service-offer.type";
import type { IMessageResponse } from "@shared/interfaces/api/response.interface";

// Constants
const SERVICE_OFFER_API_PATH = "/service-offers";

// Create base service instance
const serviceOfferService = new BaseService<
  IServiceOffer,
  TCreateServiceOfferData,
  TUpdateServiceOfferData
>(SERVICE_OFFER_API_PATH);

// Re-export common CRUD operations
export const fetchServiceOffers = (params: IListQueryParams) =>
  serviceOfferService.get<IServiceOffer>(params);

export const fetchServiceOffer = (id: string, params?: Record<string, any>) =>
  serviceOfferService.getSingle<IServiceOffer>(id, params);

export const createServiceOffer = (data: TCreateServiceOfferData) =>
  serviceOfferService.post<IServiceOfferResponse>(data);

export const updateServiceOffer = (id: string) => (data: TUpdateServiceOfferData) =>
  serviceOfferService.patch<IMessageResponse>(id)(data);

export const deleteServiceOffer = (id: string) =>
  serviceOfferService.delete(id);

export const updateServiceOfferStatus = (id: string) => (data: { status: string; message?: string }) =>
  serviceOfferService.patch<IMessageResponse>(id)(data, undefined, "/status");

