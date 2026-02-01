import { TQueryParams } from '../../types/api/param.type';


export interface IListQueryParams {

  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
  filters?: TQueryParams;
  _relations?: string;
  _select?: string;
  _searchable?: string;
  _countable?: string;
}
