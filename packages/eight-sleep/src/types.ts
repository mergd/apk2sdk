export type EightSleepFetch = (
  input: string | URL | Request,
  init?: RequestInit,
) => Promise<Response>;

export type EightSleepHost = "client" | "app";
export type EightSleepMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
export type EightSleepRecord = Record<string, unknown>;

export interface EightSleepClientOptions {
  /** Caller-owned fetch. It must apply a valid bearer token or other auth. */
  fetch?: EightSleepFetch;
  clientBaseUrl?: string;
  appBaseUrl?: string;
  /** Optional non-auth defaults. Auth headers are also accepted but never managed. */
  headers?: HeadersInit | (() => HeadersInit | Promise<HeadersInit>);
}

export interface EightSleepRequestOptions {
  host?: EightSleepHost;
  /** API path version, overriding the host's default v1 prefix. */
  version?: "v1" | "v2" | "v3";
  method?: EightSleepMethod;
  query?: Record<string, string | number | boolean | null | undefined>;
  body?: unknown;
  signal?: AbortSignal;
}

export interface EightSleepCurrentDevice {
  id?: string;
  side?: "left" | "right" | "solo" | string;
  [key: string]: unknown;
}

export interface EightSleepUser {
  userId: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  devices?: string[];
  currentDevice?: EightSleepCurrentDevice;
  [key: string]: unknown;
}

export interface EightSleepUserResponse {
  user: EightSleepUser;
  [key: string]: unknown;
}

export interface EightSleepDevice {
  id?: string;
  ownerId?: string;
  leftUserId?: string;
  rightUserId?: string;
  awaySides?: Record<string, string>;
  [key: string]: unknown;
}

export interface EightSleepDeviceResponse {
  result: EightSleepDevice;
  [key: string]: unknown;
}

export interface EightSleepTemperatureStatus {
  currentLevel?: number;
  currentState?: { type?: "smart" | "off" | string; [key: string]: unknown };
  smart?: EightSleepRecord | null;
  timeBased?: EightSleepRecord | null;
  [key: string]: unknown;
}

export interface EightSleepTrendSession {
  id?: string;
  timeseries?: EightSleepRecord;
  [key: string]: unknown;
}

export interface EightSleepTrendDay {
  day?: string;
  score?: number;
  presenceStart?: string;
  presenceDuration?: number;
  sleepDuration?: number;
  lightDuration?: number;
  deepDuration?: number;
  remDuration?: number;
  respiratoryRate?: number;
  heartRate?: number;
  latencyAsleepSeconds?: number;
  latencyOutSeconds?: number;
  sessions?: EightSleepTrendSession[];
  [key: string]: unknown;
}

export interface EightSleepTrendsResponse {
  days: EightSleepTrendDay[];
  [key: string]: unknown;
}

export interface GetTrendsInput {
  userId: string;
  from?: string;
  to?: string;
  timeZone: string;
  includeMain?: boolean;
  includeAllSessions?: boolean;
  modelVersion?: string;
}

export interface EightSleepAlarm {
  id: string;
  enabled: boolean;
  time: string;
  repeat?: { enabled?: boolean; weekDays?: Record<string, boolean>; [key: string]: unknown };
  vibration?: { enabled?: boolean; powerLevel?: number; pattern?: string; [key: string]: unknown };
  thermal?: { enabled?: boolean; level?: number; [key: string]: unknown };
  audio?: { enabled?: boolean; level?: number; trackId?: string | null; [key: string]: unknown };
  smart?: { lightSleepEnabled?: boolean; sleepCapEnabled?: boolean; sleepCapMinutes?: number; [key: string]: unknown };
  skipNext?: boolean;
  snoozing?: boolean;
  [key: string]: unknown;
}

export type CreateEightSleepAlarm = Omit<EightSleepAlarm, "id"> & { id?: string };
export type UpdateEightSleepAlarm = Partial<Omit<EightSleepAlarm, "id">>;
