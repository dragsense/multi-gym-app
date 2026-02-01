import { CheckinDto, CreateCheckinDto, UpdateCheckinDto } from "../dtos/checkin-dtos";
import { ICheckin } from "../interfaces/checkin.interface";
import { IPaginatedResponse } from "../interfaces/api/response.interface";
import { IListQueryParams } from "../interfaces/api/param.interface";

export type TCheckinData = CreateCheckinDto | UpdateCheckinDto;
export type TCheckinListData = CheckinDto;
export type TCheckinPaginatedResponse = IPaginatedResponse<ICheckin>;

