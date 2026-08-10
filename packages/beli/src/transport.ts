import { BeliContractError, BeliHttpError } from "./errors";
import type { BeliClientOptions, BeliFetch } from "./types";

export type BeliHost = "api" | "onboarding" | "recommendations";

export interface BeliRequestOptions {
  host?: BeliHost;
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  query?: Record<string, string | number | boolean | null | undefined>;
  body?: unknown;
  signal?: AbortSignal;
}

const DEFAULT_HOSTS = {
  api: "https://backoffice-service-t57o3dxfca-nn.a.run.app",
  onboarding: "https://backoffice-service-onboarding-t57o3dxfca-nn.a.run.app",
  recommendations: "https://backoffice-service-recs-t57o3dxfca-nn.a.run.app",
} as const;

export class BeliTransport {
  private readonly fetcher: BeliFetch;
  private readonly hosts: Record<BeliHost, string>;

  constructor(private readonly options: BeliClientOptions) {
    this.fetcher = options.fetch ?? globalThis.fetch.bind(globalThis);
    if (!this.fetcher) throw new Error("BeliClient requires a fetch implementation");
    this.hosts = {
      api: trimSlash(options.apiBaseUrl ?? DEFAULT_HOSTS.api),
      onboarding: trimSlash(options.onboardingBaseUrl ?? DEFAULT_HOSTS.onboarding),
      recommendations: trimSlash(
        options.recommendationsBaseUrl ?? DEFAULT_HOSTS.recommendations,
      ),
    };
  }

  async request<T>(path: string, options: BeliRequestOptions = {}): Promise<T> {
    const method = options.method ?? "GET";
    const url = new URL(this.hosts[options.host ?? "api"] + path);
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
    if (!response.ok) throw new BeliHttpError(response.status, method, path, text);
    if (!text) return undefined as T;
    try {
      return JSON.parse(text) as T;
    } catch {
      throw new BeliContractError(`${method} ${path}`, "response was not JSON");
    }
  }
}

function trimSlash(value: string): string {
  return value.replace(/\/+$/, "");
}
