// Utils
import { apiRequest } from "@/utils/fetcher";
import { BaseService } from "./base.service.api";

// Types
import type {
    IMessageResponse,
    IPaginatedResponse,
} from "@shared/interfaces/api/response.interface";
import type { IListQueryParams } from "@shared/interfaces/api/param.interface";
import { CreateAutomationDto, UpdateAutomationDto, AutomationDto } from "@shared/dtos";
import { EAutomationStatus } from "@shared/enums";

// Constants
const AUTOMATIONS_API_PATH = "/automations";

// Create base service instance
const automationService = new BaseService<
    AutomationDto,
    CreateAutomationDto,
    UpdateAutomationDto
>(AUTOMATIONS_API_PATH);

// Re-export common CRUD operations
export const fetchAutomations = (params: IListQueryParams) => automationService.get(params);
export const fetchAutomation = (id: string, params: IListQueryParams) => automationService.getSingle(id, params);
export const deleteAutomation = (id: string) => automationService.delete(id);

// Automation-specific methods
export const createAutomation = (data: CreateAutomationDto) =>
    automationService.post(data);

export const updateAutomation = (id: string) => automationService.patch(id);

// Toggle automation status
export const toggleAutomationStatus = (id: string, status: EAutomationStatus) =>
    apiRequest<IMessageResponse & { automation: AutomationDto }>(
        `${AUTOMATIONS_API_PATH}/${id}/status`,
        "PATCH",
        { status }
    );
