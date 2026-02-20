import { SessionDto } from '../dtos/session-dtos/session.dto';
import type { IMessageResponse } from './api/response.interface';

export interface ISession extends SessionDto { }
export interface ISessionResponse extends IMessageResponse {
  session: SessionDto;
}
