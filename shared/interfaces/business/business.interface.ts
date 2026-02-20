import { BusinessThemeDto } from '../../dtos/business-dtos/business-theme.dto';
import { BusinessDto } from '../../dtos';
import type { IMessageResponse } from '../api/response.interface';

export interface IBusiness extends BusinessDto { }
export interface IBusinessResponse extends IMessageResponse {
    Business: BusinessDto;
}

export interface IBusinessTheme extends BusinessThemeDto { }    