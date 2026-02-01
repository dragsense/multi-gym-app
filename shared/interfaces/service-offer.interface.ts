import { ServiceOfferDto } from "../dtos/service-offer-dtos/service-offer.dto";

export interface IServiceOffer extends ServiceOfferDto {}

export interface IServiceOfferResponse {
  message: string;
  serviceOffer: IServiceOffer;
}

