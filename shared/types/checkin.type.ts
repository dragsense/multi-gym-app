import { CheckinDto, CreateCheckinDto, UpdateCheckinDto } from "../dtos/checkin-dtos";
import type { ICheckin } from "../interfaces/checkin.interface";
import type { IPaginatedResponse } from "../interfaces/api/response.interface";
import type { IListQueryParams } from "../interfaces/api/param.interface";

export type TCheckinData = CreateCheckinDto | UpdateCheckinDto;
export type TCheckinListData = CheckinDto;
export type TCheckinPaginatedResponse = IPaginatedResponse<ICheckin>;

