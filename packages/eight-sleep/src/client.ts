import { EightSleepContractError } from "./errors";
import { EightSleepTransport } from "./transport";
import type {
  CreateEightSleepAlarm,
  EightSleepAlarm,
  EightSleepClientOptions,
  EightSleepDeviceResponse,
  EightSleepRecord,
  EightSleepRequestOptions,
  EightSleepTemperatureStatus,
  EightSleepTrendsResponse,
  EightSleepUser,
  EightSleepUserResponse,
  GetTrendsInput,
  UpdateEightSleepAlarm,
} from "./types";

export class EightSleepClient {
  readonly users: UsersResource;
  readonly devices: DevicesResource;
  readonly temperature: TemperatureResource;
  readonly sleep: SleepResource;
  readonly alarms: AlarmsResource;
  readonly household: HouseholdResource;
  private readonly transport: EightSleepTransport;

  constructor(options: EightSleepClientOptions = {}) {
    this.transport = new EightSleepTransport(options);
    this.users = new UsersResource(this.transport);
    this.devices = new DevicesResource(this.transport);
    this.temperature = new TemperatureResource(this.transport);
    this.sleep = new SleepResource(this.transport);
    this.alarms = new AlarmsResource(this.transport);
    this.household = new HouseholdResource(this.transport);
  }

  /** Escape hatch for endpoints not yet promoted into the clean SDK. */
  request<T = unknown>(path: string, options: EightSleepRequestOptions = {}): Promise<T> {
    return this.transport.request<T>(path, options);
  }
}

export class UsersResource {
  constructor(private readonly transport: EightSleepTransport) {}

  async current(signal?: AbortSignal): Promise<EightSleepUser> {
    return unwrapUser(await this.transport.request<EightSleepUserResponse>("/users/me", { signal }), "users.current");
  }

  async get(userId: string, signal?: AbortSignal): Promise<EightSleepUser> {
    return unwrapUser(await this.transport.request<EightSleepUserResponse>(`/users/${segment(userId)}`, { signal }), "users.get");
  }
}

export class DevicesResource {
  constructor(private readonly transport: EightSleepTransport) {}

  async get(deviceId: string, signal?: AbortSignal): Promise<EightSleepDeviceResponse> {
    const value = await this.transport.request<EightSleepDeviceResponse>(`/devices/${segment(deviceId)}`, { signal });
    if (!isRecord(value) || !isRecord(value.result)) {
      throw new EightSleepContractError("devices.get", "missing result");
    }
    return value;
  }

  peripherals(deviceId: string, signal?: AbortSignal): Promise<EightSleepRecord> {
    return this.transport.request(`/devices/${segment(deviceId)}/peripherals`, { signal });
  }

  online(deviceId: string, signal?: AbortSignal): Promise<EightSleepRecord> {
    return this.transport.request(`/devices/${segment(deviceId)}/online`, { signal });
  }
}

export class TemperatureResource {
  constructor(private readonly transport: EightSleepTransport) {}

  status(userId: string, signal?: AbortSignal): Promise<EightSleepTemperatureStatus> {
    return this.transport.request(`/users/${segment(userId)}/temperature`, { host: "app", signal });
  }

  async setPower(userId: string, on: boolean, signal?: AbortSignal): Promise<void> {
    await this.transport.request(`/users/${segment(userId)}/temperature`, {
      host: "app",
      method: "PUT",
      body: { currentState: { type: on ? "smart" : "off" } },
      signal,
    });
  }

  async setLevel(
    userId: string,
    level: number,
    options: { ensureSmart?: boolean; signal?: AbortSignal } = {},
  ): Promise<void> {
    if (!Number.isInteger(level) || level < -100 || level > 100) {
      throw new RangeError("Eight Sleep temperature level must be an integer from -100 to 100");
    }
    if (options.ensureSmart ?? true) await this.setPower(userId, true, options.signal);
    await this.transport.request(`/users/${segment(userId)}/temperature`, {
      host: "app",
      method: "PUT",
      body: { currentLevel: level },
      signal: options.signal,
    });
  }
}

export class SleepResource {
  constructor(private readonly transport: EightSleepTransport) {}

  trends(input: GetTrendsInput, signal?: AbortSignal): Promise<EightSleepTrendsResponse> {
    return this.transport.request(`/users/${segment(input.userId)}/trends`, {
      query: {
        from: input.from,
        to: input.to,
        tz: input.timeZone,
        "include-main": input.includeMain ?? false,
        "include-all-sessions": input.includeAllSessions ?? true,
        "model-version": input.modelVersion ?? "v2",
      },
      signal,
    });
  }

  intervals(userId: string, sessionId: string, signal?: AbortSignal): Promise<EightSleepRecord> {
    return this.transport.request(`/users/${segment(userId)}/intervals/${segment(sessionId)}`, { signal });
  }
}

export class AlarmsResource {
  constructor(private readonly transport: EightSleepTransport) {}

  async list(userId: string, signal?: AbortSignal): Promise<EightSleepAlarm[]> {
    const value = await this.transport.request<unknown>(`/users/${segment(userId)}/alarms`, { signal });
    if (!isRecord(value) || !Array.isArray(value.alarms)) {
      throw new EightSleepContractError("alarms.list", "missing alarms");
    }
    return value.alarms as EightSleepAlarm[];
  }

  async create(userId: string, alarm: CreateEightSleepAlarm, signal?: AbortSignal): Promise<EightSleepAlarm> {
    const value = await this.transport.request<unknown>(`/users/${segment(userId)}/alarms`, {
      method: "POST", body: alarm, signal,
    });
    return unwrapAlarm(value, "alarms.create");
  }

  async update(userId: string, alarmId: string, patch: UpdateEightSleepAlarm, signal?: AbortSignal): Promise<EightSleepAlarm> {
    const value = await this.transport.request<unknown>(`/users/${segment(userId)}/alarms/${segment(alarmId)}`, {
      method: "PATCH", body: patch, signal,
    });
    return unwrapAlarm(value, "alarms.update");
  }

  async delete(userId: string, alarmId: string, signal?: AbortSignal): Promise<void> {
    await this.transport.request(`/users/${segment(userId)}/alarms/${segment(alarmId)}`, { method: "DELETE", signal });
  }

  async snooze(userId: string, alarmId: string, signal?: AbortSignal): Promise<void> {
    await this.transport.request(`/users/${segment(userId)}/alarms/${segment(alarmId)}/snooze`, { method: "POST", body: {}, signal });
  }

  async dismiss(userId: string, alarmId: string, signal?: AbortSignal): Promise<void> {
    await this.transport.request(`/users/${segment(userId)}/alarms/${segment(alarmId)}/dismiss`, { method: "POST", body: {}, signal });
  }
}

export class HouseholdResource {
  constructor(private readonly transport: EightSleepTransport) {}

  summary(userId: string, signal?: AbortSignal): Promise<EightSleepRecord> {
    return this.get(userId, "summary", signal);
  }

  schedule(userId: string, signal?: AbortSignal): Promise<EightSleepRecord> {
    return this.get(userId, "schedule", signal);
  }

  currentSet(userId: string, signal?: AbortSignal): Promise<EightSleepRecord> {
    return this.get(userId, "current-set", signal);
  }

  guests(userId: string, signal?: AbortSignal): Promise<EightSleepRecord> {
    return this.get(userId, "guests", signal);
  }

  private get(userId: string, resource: string, signal?: AbortSignal): Promise<EightSleepRecord> {
    return this.transport.request(`/household/users/${segment(userId)}/${resource}`, { host: "app", signal });
  }
}

function unwrapUser(value: unknown, operation: string): EightSleepUser {
  if (!isRecord(value) || !isRecord(value.user) || typeof value.user.userId !== "string") {
    throw new EightSleepContractError(operation, "missing user");
  }
  return value.user as EightSleepUser;
}

function unwrapAlarm(value: unknown, operation: string): EightSleepAlarm {
  if (!isRecord(value) || !isRecord(value.alarm) || typeof value.alarm.id !== "string") {
    throw new EightSleepContractError(operation, "missing alarm");
  }
  return value.alarm as EightSleepAlarm;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function segment(value: string): string {
  if (!value) throw new TypeError("Eight Sleep resource IDs cannot be empty");
  return encodeURIComponent(value);
}
