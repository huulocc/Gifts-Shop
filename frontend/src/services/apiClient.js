import { normalizeApiError } from "./normalizers.js";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

export const useMockApi =
  import.meta.env.VITE_USE_MOCK_API === "true" ||
  (!API_BASE_URL && import.meta.env.DEV);

// Keep unfinished storefront APIs mocked while Auth + Manage Cart use the real backend.
export const useRealCartApi = import.meta.env.VITE_USE_REAL_CART_API === "true";

export class ApiError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = "ApiError";
    this.code = options.code || "REQUEST_FAILED";
    this.status = options.status || 500;
    this.fields = options.fields || {};
  }
}

export function toApiError(error) {
  const normalized = normalizeApiError(error);
  return new ApiError(normalized.message, normalized);
}

export async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.headers || {}),
    },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  let payload = null;
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    payload = await response.json();
  }

  if (!response.ok) {
    throw toApiError({ ...(payload || {}), status: response.status });
  }

  return payload && Object.prototype.hasOwnProperty.call(payload, "data")
    ? payload.data
    : payload;
}

export function buildQuery(params = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      search.set(key, value);
    }
  });
  const query = search.toString();
  return query ? `?${query}` : "";
}
