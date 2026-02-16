// Utils
import { BaseService } from "./base.service.api";

// Types
import type { IListQueryParams } from "@shared/interfaces/api/param.interface";
import type { IDatabaseConnection } from "@shared/interfaces";

// Constants
const DATABASE_API_PATH = "/database";

// Create base service instance
const databaseService = new BaseService<
  IDatabaseConnection,
  never,
  never
>(DATABASE_API_PATH);

// Re-export common CRUD operations
export const fetchDatabaseConnections = (params: IListQueryParams) =>
  databaseService.get<IDatabaseConnection>(params, "/connections");
