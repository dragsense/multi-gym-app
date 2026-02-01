import { DatabaseConnectionDto, DatabaseConnectionListDto } from '../dtos';
import { IMessageResponse } from './api/response.interface';

export interface IDatabaseConnection extends DatabaseConnectionDto {}

export interface IDatabaseConnectionResponse extends IMessageResponse {}
