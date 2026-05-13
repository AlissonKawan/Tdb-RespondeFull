import { apiClient, ApiError, request } from './apiClient';
import type { ApiRequestOptions } from '../types/api';

export { ApiError };

export function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  return request<T>(path, options);
}

export function apiGet<T>(path: string, options?: ApiRequestOptions): Promise<T> {
  return apiClient.get<T>(path, options);
}
