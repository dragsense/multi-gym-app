export interface IMessageResponse {
  message: string;
}

export interface IApiResponse<T = any> extends IMessageResponse {
  data: T;
  success: boolean;
}

export interface IListPaginationState {
  total: number;
  page: number;
  limit: number;
  lastPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  
}

export interface IPaginatedResponse<T> extends IListPaginationState {
  data: T[];

}