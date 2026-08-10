import { describe, expect, test } from "bun:test";
import {
  EightSleepClient,
  EightSleepHttpError,
} from "../src";

type RecordedRequest = { url: URL; init: RequestInit };

function mockClient(responses: Array<{ status?: number; body?: unknown }>) {
  const requests: RecordedRequest[] = [];
  const client = new EightSleepClient({
    headers: { Authorization: "Bearer test" },
    fetch: async (input, init = {}) => {
      requests.push({ url: new URL(String(input)), init });
      const next = responses.shift() ?? {};
      return new Response(next.body === undefined ? null : JSON.stringify(next.body), {
        status: next.status ?? 200,
        headers: next.body === undefined ? undefined : { "Content-Type": "application/json" },
      });
    },
  });
  return { client, requests };
}

describe("EightSleepClient", () => {
  test("loads and unwraps the current user", async () => {
    const { client, requests } = mockClient([{ body: { user: { userId: "user 1", firstName: "Ada" } } }]);

    expect(await client.users.current()).toEqual({ userId: "user 1", firstName: "Ada" });
    expect(requests[0]?.url.toString()).toBe("https://client-api.8slp.net/v1/users/me");
    expect(new Headers(requests[0]?.init.headers).get("Authorization")).toBe("Bearer test");
  });

  test("uses app API for status and encodes user IDs", async () => {
    const { client, requests } = mockClient([{ body: { currentLevel: -20, currentState: { type: "smart" } } }]);

    expect(await client.temperature.status("user/1")).toMatchObject({ currentLevel: -20 });
    expect(requests[0]?.url.toString()).toBe("https://app-api.8slp.net/v1/users/user%2F1/temperature");
  });

  test("sets smart mode before a temperature level", async () => {
    const { client, requests } = mockClient([{}, {}]);

    await client.temperature.setLevel("u1", 35);

    expect(requests).toHaveLength(2);
    expect(requests.map((request) => request.init.method)).toEqual(["PUT", "PUT"]);
    expect(requests.map((request) => JSON.parse(String(request.init.body)))).toEqual([
      { currentState: { type: "smart" } },
      { currentLevel: 35 },
    ]);
  });

  test("validates temperature levels without making a request", async () => {
    const { client, requests } = mockClient([]);

    await expect(client.temperature.setLevel("u1", 101)).rejects.toBeInstanceOf(RangeError);
    expect(requests).toHaveLength(0);
  });

  test("constructs the v2 trends query", async () => {
    const { client, requests } = mockClient([{ body: { days: [] } }]);

    await client.sleep.trends({
      userId: "u1",
      from: "2026-08-01",
      to: "2026-08-02",
      timeZone: "America/Los_Angeles",
    });

    expect(requests[0]?.url.pathname).toBe("/v1/users/u1/trends");
    expect(Object.fromEntries(requests[0]!.url.searchParams)).toEqual({
      from: "2026-08-01",
      to: "2026-08-02",
      tz: "America/Los_Angeles",
      "include-main": "false",
      "include-all-sessions": "true",
      "model-version": "v2",
    });
  });

  test("wraps alarms and exposes the raw request escape hatch", async () => {
    const alarm = { id: "a1", enabled: true, time: "07:00", daysOfWeek: [1], vibration: true };
    const { client, requests } = mockClient([
      { body: { alarms: [alarm] } },
      { body: { feature: true } },
    ]);

    expect(await client.alarms.list("u1")).toEqual([alarm]);
    expect(await client.request<{ feature: boolean }>("/release/features")).toEqual({ feature: true });
    expect(requests[1]?.url.toString()).toBe("https://client-api.8slp.net/v1/release/features");
  });

  test("throws a structured error with the response body", async () => {
    const { client } = mockClient([{ status: 429, body: { error: "slow down" } }]);

    try {
      await client.users.current();
      throw new Error("expected request to fail");
    } catch (error) {
      expect(error).toBeInstanceOf(EightSleepHttpError);
      expect(error).toMatchObject({ status: 429, method: "GET", path: "/users/me" });
      expect((error as EightSleepHttpError).responseBody).toContain("slow down");
    }
  });
});
