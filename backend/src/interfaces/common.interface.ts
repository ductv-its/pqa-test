
export interface ISuccessResponse<T> {
  message: string;
  data: T;
}

export type Pagination<T> = {
  data: T;
  pagination: {
      current_page: number;
      limit: number;
      skip: number;
      total: number;
  };
};

export interface IResponseWriteFile {
  fileName: string;
  url: string;
}

export interface BackendErrorResponse {
  status: number,
  message: string,
}
