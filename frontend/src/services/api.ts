export const delay = (ms: number = 600) => new Promise(resolve => setTimeout(resolve, ms));

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
