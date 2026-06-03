export type CategoryStatus = "active" | "hidden";
export type ResourceStatus = "active" | "hidden" | "expired";
export type RequestStatus = "pending" | "processing" | "done" | "ignored";
export type ResourceLinkPlatform = "quark" | "baidu" | "xunlei" | "custom";

export interface Category {
  id: number;
  name: string;
  slug: string;
  sort_order: number;
  status: CategoryStatus;
}

export interface ResourceLink {
  id: number;
  platform_type: ResourceLinkPlatform;
  platform_label: string;
  custom_title: string;
  url: string | null;
  sort_order: number;
}

export interface Resource {
  id: number;
  title: string;
  year: number;
  description: string;
  tags: string;
  links: ResourceLink[];
  status: ResourceStatus;
  category: Category;
  created_at: string;
  updated_at: string;
}

export interface UserRequest {
  id: number;
  title: string;
  description: string;
  contact_email: string | null;
  contact_text: string;
  status: RequestStatus;
  admin_note: string;
  notified_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}
