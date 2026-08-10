import { EightSleepContractError, EightSleepHttpError } from "./errors";
import type {
  EightSleepClientOptions,
  EightSleepFetch,
  EightSleepHost,
  EightSleepRequestOptions,
} from "./types";

const DEFAULT_HOSTS = {
  client: "https://client-api.8slp.net/v1",
  app: "https://app-api.8slp.net/v1",
} as const;

export class EightSleepTransport {
  private readonly fetcher: EightSleepFetch;
  private readonly hosts: Record<EightSleepHost, string>;

  constructor(private readonly options: EightSleepClientOptions) {
    const globalFetch = globalThis.fetch;
    this.fetcher = options.fetch ?? globalFetch?.bind(globalThis);
    if (!this.fetcher) throw new Error("EightSleepClient requires a fetch implementation");
    this.hosts = {
      client: trimSlash(options.clientBaseUrl ?? DEFAULT_HOSTS.client),
      app: trimSlash(options.appBaseUrl ?? DEFAULT_HOSTS.app),
    };
  }

  async request<T>(path: string, options: EightSleepRequestOptions = {}): Promise<T> {
    if (!path.startsWith("/")) throw new TypeError("Eight Sleep API paths must start with /");
    const method = options.method ?? "GET";
    const url = new URL(this.hosts[options.host ?? "client"] + path);
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
    if (!response.ok) throw new EightSleepHttpError(response.status, method, path, text);
    if (!text) return undefined as T;
    try {
      return JSON.parse(text) as T;
    } catch {
      throw new EightSleepContractError(`${method} ${path}`, "response was not JSON");
    }
  }
}

function trimSlash(value: string): string {
  return value.replace(/\/+$/, "");
}
