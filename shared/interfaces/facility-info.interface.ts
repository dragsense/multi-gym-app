import { FacilityInfoDto } from "../dtos/facility-info-dtos/facility-info.dto";

export interface IFacilityInfo extends FacilityInfoDto {}

export interface IFacilityInfoResponse {
  message: string;
  facilityInfo: IFacilityInfo;
}

