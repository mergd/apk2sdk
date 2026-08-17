export type SegwayFetch = (
  input: string | URL | Request,
  init?: RequestInit,
) => Promise<Response>;

/** OMS gateway (`java1`/`java2`) vs PHP business API (`php`) from Server.json. */
export type SegwayHost = "oms" | "api";
export type SegwayMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
export type SegwayRecord = Record<string, unknown>;

export interface SegwayClientOptions {
  /** Caller-owned fetch. It must apply a valid session / bearer token. */
  fetch?: SegwayFetch;
  /**
   * OMS gateway base URL. Overseas production defaults to the EU gateway from
   * Segway Mobility 6.10.8 `assets/Server.json`.
   */
  omsBaseUrl?: string;
  /**
   * PHP / business API base URL. Overseas production defaults to the EU
   * `api-jhcx-v6` host from `assets/Server.json`.
   */
  apiBaseUrl?: string;
  /** Optional non-auth defaults. Auth headers are also accepted but never managed. */
  headers?: HeadersInit | (() => HeadersInit | Promise<HeadersInit>);
}

export interface SegwayRequestOptions {
  host?: SegwayHost;
  method?: SegwayMethod;
  query?: Record<string, string | number | boolean | null | undefined>;
  body?: unknown;
  signal?: AbortSignal;
  /** When false, return the raw JSON envelope instead of unwrapping `data`. */
  unwrap?: boolean;
}

export interface SegwayVehicle {
  /** Serial / frame number when present. */
  sn?: string;
  /** Wire number used by vehicle-basic-info (`wnumber`). */
  wnumber?: string;
  name?: string;
  model?: string;
  bleName?: string;
  [key: string]: unknown;
}

export interface SegwayVehicleBasicInfo {
  /** 32-char lowercase hex command ident used by BLE `cmd=0x64` frames. */
  ident?: string;
  sn?: string;
  wnumber?: string;
  [key: string]: unknown;
}

export interface GetVehicleBasicInfoInput {
  uid: string | number;
  /** Scooter serial / wire number (`wnumber` upstream). */
  serial: string;
}
