import type { Category, PaginatedResponse, Resource, UserRequest } from "../types";
import { getToken } from "./storage";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers ?? {});
  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(payload.detail ?? "Request failed");
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export const api = {
  listPublicResources: (params: URLSearchParams) =>
    request<PaginatedResponse<Resource>>(`/resources?${params.toString()}`),
  getPublicResource: (id: string) => request<Resource>(`/resources/${id}`),
  incrementResourceLinkCopyCount: (resourceId: number, linkId: number) =>
    request<{ link_id: number; copy_count: number }>(`/resources/${resourceId}/links/${linkId}/copy`, {
      method: "POST",
    }),
  listPublicCategories: () => request<{ items: Category[] }>("/categories"),
  submitRequest: (payload: Record<string, unknown>) =>
    request<UserRequest>("/requests", { method: "POST", body: JSON.stringify(payload) }),
  adminLogin: (payload: { username: string; password: string }) =>
    request<{ access_token: string; token_type: string }>("/admin/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  getAdminMe: () => request<{ id: number; username: string; created_at: string }>("/admin/auth/me"),
  listAdminResources: (params: URLSearchParams) =>
    request<PaginatedResponse<Resource>>(`/admin/resources?${params.toString()}`),
  createResource: (payload: Record<string, unknown>) =>
    request<Resource>("/admin/resources", { method: "POST", body: JSON.stringify(payload) }),
  updateResource: (id: string, payload: Record<string, unknown>) =>
    request<Resource>(`/admin/resources/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  deleteResource: (id: number) => request<void>(`/admin/resources/${id}`, { method: "DELETE" }),
  listAdminCategories: () => request<{ items: Category[] }>("/admin/categories"),
  createCategory: (payload: Record<string, unknown>) =>
    request<Category>("/admin/categories", { method: "POST", body: JSON.stringify(payload) }),
  updateCategory: (id: number, payload: Record<string, unknown>) =>
    request<Category>(`/admin/categories/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  deleteCategory: (id: number) => request<void>(`/admin/categories/${id}`, { method: "DELETE" }),
  listAdminRequests: (params: URLSearchParams) =>
    request<PaginatedResponse<UserRequest>>(`/admin/requests?${params.toString()}`),
  updateAdminRequest: (id: number, payload: Record<string, unknown>) =>
    request<UserRequest>(`/admin/requests/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  notifyAdminRequest: (id: number) => request<UserRequest>(`/admin/requests/${id}/notify`, { method: "POST" }),
};
