import { SegwayApiError, SegwayContractError, SegwayHttpError } from "./errors";
import type {
  SegwayClientOptions,
  SegwayFetch,
  SegwayHost,
  SegwayRequestOptions,
} from "./types";

const DEFAULT_HOSTS = {
  oms: "https://eu-oms-gateway.ninebot.com",
  api: "https://api-jhcx-v6-eu.ninebot.com",
} as const;

export class SegwayTransport {
  private readonly fetcher: SegwayFetch;
  private readonly hosts: Record<SegwayHost, string>;

  constructor(private readonly options: SegwayClientOptions) {
    const globalFetch = globalThis.fetch;
    this.fetcher = options.fetch ?? globalFetch?.bind(globalThis);
    if (!this.fetcher) throw new Error("SegwayClient requires a fetch implementation");
    this.hosts = {
      oms: trimSlash(options.omsBaseUrl ?? DEFAULT_HOSTS.oms),
      api: trimSlash(options.apiBaseUrl ?? DEFAULT_HOSTS.api),
    };
  }

  async request<T>(path: string, options: SegwayRequestOptions = {}): Promise<T> {
    if (!path.startsWith("/")) throw new TypeError("Segway API paths must start with /");
    const method = options.method ?? "GET";
    const url = new URL(this.hosts[options.host ?? "oms"] + path);
    for (const [key, value] of Object.entries(options.query ?? {})) {
      if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
    }

    const defaults =
      typeof this.options.headers === "function"
        ? await this.options.headers()
        : this.options.headers;
    const headers = new Headers(defaults);
    headers.set("Accept", "application/json");
    const init: RequestInit = { method, headers, signal: options.signal };
    if (options.body !== undefined) {
      headers.set("Content-Type", "application/json; charset=UTF-8");
      init.body = JSON.stringify(options.body);
    }

    const response = await this.fetcher(url, init);
    const text = await response.text();
    if (!response.ok) throw new SegwayHttpError(response.status, method, path, text);
    if (!text) return undefined as T;

    let parsed: unknown;
    try {
      parsed = JSON.parse(text) as unknown;
    } catch {
      throw new SegwayContractError(`${method} ${path}`, "response was not JSON");
    }

    if (options.unwrap === false) return parsed as T;
    return unwrapEnvelope<T>(parsed, `${method} ${path}`);
  }
}

function unwrapEnvelope<T>(value: unknown, operation: string): T {
  if (!isRecord(value) || !("code" in value)) return value as T;

  const code = value.code;
  const ok =
    code === 0 ||
    code === "0" ||
    code === 1 ||
    code === "1" ||
    code === 200 ||
    code === "200";
  if (!ok) {
    const message =
      typeof value.msg === "string"
        ? value.msg
        : typeof value.message === "string"
          ? value.message
          : "request failed";
    throw new SegwayApiError(operation, code as string | number, message);
  }
  return ("data" in value ? value.data : value) as T;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function trimSlash(value: string): string {
  return value.replace(/\/+$/, "");
}
