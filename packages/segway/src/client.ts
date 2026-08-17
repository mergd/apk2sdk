import { SegwayContractError } from "./errors";
import { SegwayTransport } from "./transport";
import type {
  GetVehicleBasicInfoInput,
  SegwayClientOptions,
  SegwayRequestOptions,
  SegwayVehicle,
  SegwayVehicleBasicInfo,
} from "./types";

export class SegwayClient {
  readonly vehicles: VehiclesResource;
  private readonly transport: SegwayTransport;

  constructor(options: SegwayClientOptions = {}) {
    this.transport = new SegwayTransport(options);
    this.vehicles = new VehiclesResource(this.transport);
  }

  /** Escape hatch for endpoints not yet promoted into the clean SDK. */
  request<T = unknown>(path: string, options: SegwayRequestOptions = {}): Promise<T> {
    return this.transport.request<T>(path, options);
  }
}

export class VehiclesResource {
  constructor(private readonly transport: SegwayTransport) {}

  /**
   * Bound vehicles for the authenticated account.
   * Path: `POST /app-api/device/bind/v2/my-vehicle` on the OMS gateway.
   */
  async list(signal?: AbortSignal): Promise<SegwayVehicle[]> {
    const value = await this.transport.request<unknown>("/app-api/device/bind/v2/my-vehicle", {
      host: "oms",
      method: "POST",
      body: {},
      signal,
    });
    return asVehicleList(value, "vehicles.list");
  }

  /**
   * Cloud vehicle record including the BLE command `ident`.
   * Path: `POST /vehicle/vehicle/vehicle-basic-info` on the PHP API host.
   */
  async basicInfo(input: GetVehicleBasicInfoInput, signal?: AbortSignal): Promise<SegwayVehicleBasicInfo> {
    const value = await this.transport.request<unknown>("/vehicle/vehicle/vehicle-basic-info", {
      host: "api",
      method: "POST",
      body: { uid: input.uid, wnumber: input.serial },
      signal,
    });
    if (!isRecord(value)) {
      throw new SegwayContractError("vehicles.basicInfo", "expected object");
    }
    return value as SegwayVehicleBasicInfo;
  }

  /**
   * Convenience wrapper that returns only the 32-char hex `ident`.
   * Throws if the cloud response does not include a well-formed ident.
   */
  async ident(input: GetVehicleBasicInfoInput, signal?: AbortSignal): Promise<string> {
    const info = await this.basicInfo(input, signal);
    if (typeof info.ident !== "string" || !/^[0-9a-fA-F]{32}$/.test(info.ident)) {
      throw new SegwayContractError("vehicles.ident", "missing 32-char hex ident");
    }
    return info.ident.toLowerCase();
  }
}

function asVehicleList(value: unknown, operation: string): SegwayVehicle[] {
  if (Array.isArray(value)) return value as SegwayVehicle[];
  if (isRecord(value)) {
    for (const key of ["list", "vehicles", "deviceList", "myVehicleList"]) {
      const nested = value[key];
      if (Array.isArray(nested)) return nested as SegwayVehicle[];
    }
  }
  throw new SegwayContractError(operation, "missing vehicle list");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
