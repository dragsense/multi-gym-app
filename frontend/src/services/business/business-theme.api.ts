// Utils
import { BaseService } from "../base.service.api";
import { config } from "@/config";

// Types
import type { CreateBusinessThemeDto } from "@shared/dtos/business-dtos/business-theme.dto";
import type { IBusinessTheme } from "@shared/interfaces";

// Constants
const BUSINESS_THEME_API_PATH = "/business-theme";

// Create base service instance
const businessThemeService = new BaseService<any, any, any>(BUSINESS_THEME_API_PATH);

// Get current business theme
export const fetchCurrentBusinessTheme = (): Promise<IBusinessTheme | null> =>
  businessThemeService.getSingle<IBusinessTheme | null>(undefined, undefined, "/current");

// Create or update business theme with file uploads
export const upsertBusinessTheme = async (
  data: CreateBusinessThemeDto & {
    logoLight?: File | string | null;
    logoDark?: File | string | null;
    favicon?: File | string | null;
  }
): Promise<IBusinessTheme> => {
  return businessThemeService.postFormData<IBusinessTheme>(data as any);
};
