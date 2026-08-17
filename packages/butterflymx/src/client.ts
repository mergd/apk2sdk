import { ButterflyMxContractError } from "./errors";
import { ButterflyMxTransport } from "./transport";
import type {
  ButterflyMxAccessPoint,
  ButterflyMxBuilding,
  ButterflyMxClientOptions,
  ButterflyMxDevice,
  ButterflyMxDoorRelease,
  ButterflyMxRequestOptions,
  ButterflyMxTenant,
  ListByBuildingInput,
  ReleaseDoorInput,
} from "./types";

export class ButterflyMxClient {
  readonly tenants: TenantsResource;
  readonly buildings: BuildingsResource;
  readonly accessPoints: AccessPointsResource;
  readonly devices: DevicesResource;
  readonly doors: DoorsResource;
  private readonly transport: ButterflyMxTransport;

  constructor(options: ButterflyMxClientOptions = {}) {
    this.transport = new ButterflyMxTransport(options);
    this.tenants = new TenantsResource(this.transport);
    this.buildings = new BuildingsResource(this.transport);
    this.accessPoints = new AccessPointsResource(this.transport);
    this.devices = new DevicesResource(this.transport);
    this.doors = new DoorsResource(this.transport);
  }

  /** Escape hatch for endpoints not yet promoted into the clean SDK. */
  request<T = unknown>(path: string, options: ButterflyMxRequestOptions = {}): Promise<T> {
    return this.transport.request<T>(path, options);
  }
}

export class TenantsResource {
  constructor(private readonly transport: ButterflyMxTransport) {}

  list(options: { per?: number; signal?: AbortSignal } = {}): Promise<ButterflyMxTenant[]> {
    return this.transport.request("/v4/tenants", {
      query: { per: options.per ?? 100 },
      signal: options.signal,
    });
  }

  get(tenantId: number, signal?: AbortSignal): Promise<ButterflyMxTenant> {
    return this.transport.request(`/v4/tenants/${segment(tenantId)}`, { signal });
  }
}

export class BuildingsResource {
  constructor(private readonly transport: ButterflyMxTransport) {}

  list(options: { per?: number; signal?: AbortSignal } = {}): Promise<ButterflyMxBuilding[]> {
    return this.transport.request("/v4/buildings", {
      query: { per: options.per ?? 100 },
      signal: options.signal,
    });
  }

  get(buildingId: number, signal?: AbortSignal): Promise<ButterflyMxBuilding> {
    return this.transport.request(`/v4/buildings/${segment(buildingId)}`, { signal });
  }
}

export class AccessPointsResource {
  constructor(private readonly transport: ButterflyMxTransport) {}

  list(input: ListByBuildingInput, signal?: AbortSignal): Promise<ButterflyMxAccessPoint[]> {
    return this.transport.request("/v4/access_points", {
      query: {
        "q[building_id_eq]": input.buildingId,
        per: input.per ?? 100,
      },
      signal,
    });
  }

  get(accessPointId: number, signal?: AbortSignal): Promise<ButterflyMxAccessPoint> {
    return this.transport.request(`/v4/access_points/${segment(accessPointId)}`, { signal });
  }
}

export class DevicesResource {
  constructor(private readonly transport: ButterflyMxTransport) {}

  list(input: ListByBuildingInput, signal?: AbortSignal): Promise<ButterflyMxDevice[]> {
    return this.transport.request("/v4/devices", {
      query: {
        "q[building_id_eq]": input.buildingId,
        per: input.per ?? 100,
      },
      signal,
    });
  }

  get(deviceId: number, signal?: AbortSignal): Promise<ButterflyMxDevice> {
    return this.transport.request(`/v4/devices/${segment(deviceId)}`, { signal });
  }
}

export class DoorsResource {
  constructor(private readonly transport: ButterflyMxTransport) {}

  /**
   * Trigger a door / lock release (`POST /v4/door_release_requests`).
   * Pass exactly one of `accessPointId` or `deviceId`.
   */
  async release(input: ReleaseDoorInput, signal?: AbortSignal): Promise<ButterflyMxDoorRelease> {
    const door_release_request = releaseBody(input);
    const value = await this.transport.request<unknown>("/v4/door_release_requests", {
      method: "POST",
      body: { door_release_request },
      signal,
    });
    if (!isRecord(value) || typeof value.tenant_id !== "number") {
      throw new ButterflyMxContractError("doors.release", "missing door_release_request data");
    }
    return value as ButterflyMxDoorRelease;
  }
}

function releaseBody(input: ReleaseDoorInput): {
  tenant_id: number;
  access_point_id?: number;
  device_id?: number;
} {
  if ("accessPointId" in input && input.accessPointId !== undefined) {
    return { tenant_id: input.tenantId, access_point_id: input.accessPointId };
  }
  if ("deviceId" in input && input.deviceId !== undefined) {
    return { tenant_id: input.tenantId, device_id: input.deviceId };
  }
  const _exhaustive: never = input;
  return _exhaustive;
}

function segment(value: number): string {
  if (!Number.isInteger(value) || value <= 0) {
    throw new TypeError("ButterflyMX resource IDs must be positive integers");
  }
  return String(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
