import { describe, expect, test } from "bun:test";
import {
  ButterflyMxClient,
  ButterflyMxHttpError,
} from "../src";

type RecordedRequest = { url: URL; init: RequestInit };

function mockClient(
  responses: Array<{ status?: number; body?: unknown }>,
  options: { env?: "production" | "sandbox" } = {},
) {
  const requests: RecordedRequest[] = [];
  const client = new ButterflyMxClient({
    env: options.env,
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

describe("ButterflyMxClient", () => {
  test("lists tenants and unwraps data", async () => {
    const tenant = { id: 1, building_id: 9, first_name: "Ada" };
    const { client, requests } = mockClient([{ body: { data: [tenant] } }]);

    expect(await client.tenants.list()).toEqual([tenant]);
    expect(requests[0]?.url.toString()).toBe("https://api.butterflymx.com/v4/tenants?per=100");
    expect(new Headers(requests[0]?.init.headers).get("Authorization")).toBe("Bearer test");
  });

  test("filters access points by building", async () => {
    const { client, requests } = mockClient([{ body: { data: [] } }]);

    await client.accessPoints.list({ buildingId: 11879 });
    expect(Object.fromEntries(requests[0]!.url.searchParams)).toEqual({
      "q[building_id_eq]": "11879",
      per: "100",
    });
  });

  test("releases an access point door", async () => {
    const release = {
      id: 9,
      tenant_id: 567,
      access_point_id: 123,
      device_id: null,
      release_method: "api",
    };
    const { client, requests } = mockClient([{ status: 201, body: { data: release } }]);

    expect(await client.doors.release({ tenantId: 567, accessPointId: 123 })).toEqual(release);
    expect(requests[0]?.url.toString()).toBe("https://api.butterflymx.com/v4/door_release_requests");
    expect(requests[0]?.init.method).toBe("POST");
    expect(JSON.parse(String(requests[0]?.init.body))).toEqual({
      door_release_request: { tenant_id: 567, access_point_id: 123 },
    });
  });

  test("releases a device lock on sandbox", async () => {
    const release = { id: 10, tenant_id: 1, device_id: 99, access_point_id: null };
    const { client, requests } = mockClient([{ status: 201, body: { data: release } }], {
      env: "sandbox",
    });

    await client.doors.release({ tenantId: 1, deviceId: 99 });
    expect(requests[0]?.url.origin).toBe("https://api.na.sandbox.butterflymx.com");
    expect(JSON.parse(String(requests[0]?.init.body))).toEqual({
      door_release_request: { tenant_id: 1, device_id: 99 },
    });
  });

  test("exposes the raw request escape hatch", async () => {
    const { client, requests } = mockClient([{ body: { data: { id: 7 } } }]);

    expect(await client.request<{ id: number }>("/v4/buildings/7")).toEqual({ id: 7 });
    expect(requests[0]?.url.pathname).toBe("/v4/buildings/7");
  });

  test("throws a structured HTTP error", async () => {
    const { client } = mockClient([{ status: 401, body: { errors: [{ messages: "Unauthorized" }] } }]);

    try {
      await client.tenants.list();
      throw new Error("expected request to fail");
    } catch (error) {
      expect(error).toBeInstanceOf(ButterflyMxHttpError);
      expect((error as ButterflyMxHttpError).status).toBe(401);
    }
  });
});
