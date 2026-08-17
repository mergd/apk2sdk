export type ButterflyMxFetch = (
  input: string | URL | Request,
  init?: RequestInit,
) => Promise<Response>;

export type ButterflyMxEnv = "production" | "sandbox";
export type ButterflyMxMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
export type ButterflyMxRecord = Record<string, unknown>;

export interface ButterflyMxClientOptions {
  /** Caller-owned fetch. It must apply a valid bearer token. */
  fetch?: ButterflyMxFetch;
  /** Defaults to production. Sandbox uses `api.na.sandbox.butterflymx.com`. */
  env?: ButterflyMxEnv;
  /** Override the API origin entirely (wins over `env`). */
  baseUrl?: string;
  /** Optional non-auth defaults. Auth headers are also accepted but never managed. */
  headers?: HeadersInit | (() => HeadersInit | Promise<HeadersInit>);
}

export interface ButterflyMxRequestOptions {
  method?: ButterflyMxMethod;
  query?: Record<string, string | number | boolean | null | undefined>;
  body?: unknown;
  signal?: AbortSignal;
  /** When false, return the raw JSON envelope instead of unwrapping `data`. */
  unwrap?: boolean;
}

export interface ButterflyMxTenant {
  id: number;
  building_id: number;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  [key: string]: unknown;
}

export interface ButterflyMxBuilding {
  id: number;
  name?: string;
  [key: string]: unknown;
}

export interface ButterflyMxAccessPoint {
  id: number;
  name: string;
  building_id: number;
  device_ids?: number[];
  [key: string]: unknown;
}

export interface ButterflyMxDevice {
  id: number;
  name: string;
  building_id: number;
  type?: string | null;
  model?: string | null;
  [key: string]: unknown;
}

export interface ButterflyMxDoorRelease {
  id?: number;
  guid?: string;
  tenant_id: number;
  access_point_id?: number | null;
  device_id?: number | null;
  release_method?: string;
  [key: string]: unknown;
}

export type ReleaseDoorInput =
  | { tenantId: number; accessPointId: number; deviceId?: never }
  | { tenantId: number; deviceId: number; accessPointId?: never };

export interface ListByBuildingInput {
  buildingId: number;
  per?: number;
}
