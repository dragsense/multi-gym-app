import type { IMessageResponse } from './api/response.interface';
import { AutomationDto } from '../dtos/automation-dtos';

export interface IAutomation extends AutomationDto { }

export type TAutomationResponse = { automation: IAutomation } & IMessageResponse;
