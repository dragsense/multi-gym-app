import { LocationDto } from "../dtos/location-dtos/location.dto";

export interface ILocation extends LocationDto {}

export interface ILocationResponse {
  message: string;
  location: ILocation;
}

