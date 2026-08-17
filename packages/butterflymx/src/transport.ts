import { ButterflyMxContractError, ButterflyMxHttpError } from "./errors";
import type {
  ButterflyMxClientOptions,
  ButterflyMxEnv,
  ButterflyMxFetch,
  ButterflyMxRequestOptions,
} from "./types";

const API_HOSTS = {
  production: "https://api.butterflymx.com",
  sandbox: "https://api.na.sandbox.butterflymx.com",
} as const satisfies Record<ButterflyMxEnv, string>;

export class ButterflyMxTransport {
  private readonly fetcher: ButterflyMxFetch;
  private readonly baseUrl: string;

  constructor(private readonly options: ButterflyMxClientOptions) {
    const globalFetch = globalThis.fetch;
    this.fetcher = options.fetch ?? globalFetch?.bind(globalThis);
    if (!this.fetcher) throw new Error("ButterflyMxClient requires a fetch implementation");
    this.baseUrl = trimSlash(options.baseUrl ?? API_HOSTS[options.env ?? "production"]);
  }

  async request<T>(path: string, options: ButterflyMxRequestOptions = {}): Promise<T> {
    if (!path.startsWith("/")) throw new TypeError("ButterflyMX API paths must start with /");
    const method = options.method ?? "GET";
    const url = new URL(this.baseUrl + path);
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
      headers.set("Content-Type", "application/json");
      init.body = JSON.stringify(options.body);
    }

    const response = await this.fetcher(url, init);
    const text = await response.text();
    if (!response.ok) throw new ButterflyMxHttpError(response.status, method, path, text);
    if (!text) return undefined as T;

    let parsed: unknown;
    try {
      parsed = JSON.parse(text) as unknown;
    } catch {
      throw new ButterflyMxContractError(`${method} ${path}`, "response was not JSON");
    }

    if (options.unwrap === false) return parsed as T;
    return unwrapData<T>(parsed);
  }
}

function unwrapData<T>(value: unknown): T {
  if (isRecord(value) && "data" in value) return value.data as T;
  return value as T;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function trimSlash(value: string): string {
  return value.replace(/\/+$/, "");
}
