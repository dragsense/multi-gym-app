import { BannerImageDto, AdvertisementDto, CreateBannerImageDto, UpdateBannerImageDto, CreateAdvertisementDto, UpdateAdvertisementDto } from '../dtos/advertisement-dtos';
import type { IMessageResponse } from './api/response.interface';

export interface IBannerImage extends BannerImageDto {}
export interface IAdvertisement extends AdvertisementDto {}

export interface IBannerImageResponse extends IMessageResponse {
  bannerImage: BannerImageDto;
}

export interface IAdvertisementResponse extends IMessageResponse {
  advertisement: AdvertisementDto;
}

