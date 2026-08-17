import { describe, expect, test } from "bun:test";
import {
  SegwayApiError,
  SegwayClient,
  SegwayHttpError,
} from "../src";

type RecordedRequest = { url: URL; init: RequestInit };

function mockClient(responses: Array<{ status?: number; body?: unknown }>) {
  const requests: RecordedRequest[] = [];
  const client = new SegwayClient({
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

describe("SegwayClient", () => {
  test("lists vehicles from the OMS my-vehicle endpoint", async () => {
    const vehicle = { sn: "S1DTEST000001", wnumber: "S1DTEST000001", name: "Rack" };
    const { client, requests } = mockClient([{ body: { code: 1, data: [vehicle] } }]);

    expect(await client.vehicles.list()).toEqual([vehicle]);
    expect(requests[0]?.url.toString()).toBe(
      "https://eu-oms-gateway.ninebot.com/app-api/device/bind/v2/my-vehicle",
    );
    expect(requests[0]?.init.method).toBe("POST");
    expect(new Headers(requests[0]?.init.headers).get("Authorization")).toBe("Bearer test");
  });

  test("fetches vehicle-basic-info and normalizes ident", async () => {
    const { client, requests } = mockClient([
      { body: { code: 0, data: { ident: "FFEEDDCCBBAA99887766554433221100", wnumber: "S1" } } },
    ]);

    expect(await client.vehicles.ident({ uid: "42", serial: "S1" })).toBe(
      "ffeeddccbbaa99887766554433221100",
    );
    expect(requests[0]?.url.toString()).toBe(
      "https://api-jhcx-v6-eu.ninebot.com/vehicle/vehicle/vehicle-basic-info",
    );
    expect(JSON.parse(String(requests[0]?.init.body))).toEqual({ uid: "42", wnumber: "S1" });
  });

  test("surfaces upstream business codes", async () => {
    const { client } = mockClient([{ body: { code: 401, msg: "login required" } }]);

    try {
      await client.vehicles.list();
      throw new Error("expected request to fail");
    } catch (error) {
      expect(error).toBeInstanceOf(SegwayApiError);
      expect((error as SegwayApiError).apiMessage).toBe("login required");
    }
  });

  test("exposes the raw request escape hatch", async () => {
    const { client, requests } = mockClient([{ body: { code: 1, data: { ok: true } } }]);

    expect(await client.request<{ ok: boolean }>("/app-api/device/bind/is-binding", {
      host: "oms",
      method: "POST",
      body: {},
    })).toEqual({ ok: true });
    expect(requests[0]?.url.pathname).toBe("/app-api/device/bind/is-binding");
  });

  test("throws a structured HTTP error", async () => {
    const { client } = mockClient([{ status: 503, body: { error: "down" } }]);

    try {
      await client.vehicles.list();
      throw new Error("expected request to fail");
    } catch (error) {
      expect(error).toBeInstanceOf(SegwayHttpError);
      expect((error as SegwayHttpError).status).toBe(503);
    }
  });
});
