import { describe, expect, test } from "bun:test";
import { BeliClient, BeliContractError, BeliHttpError } from "../src";

function json(value: unknown, status = 200): Response {
  return new Response(JSON.stringify(value), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("BeliClient", () => {
  test("uses caller-owned fetch without adding authentication", async () => {
    const calls: Array<{ url: URL; init?: RequestInit }> = [];
    const client = new BeliClient({
      fetch: async (input, init) => {
        calls.push({ url: new URL(String(input)), init });
        return json({ results: [{ id: "user-1", username: "will" }] });
      },
    });

    await expect(client.users.current()).resolves.toMatchObject({ id: "user-1" });
    expect(calls[0]?.url.pathname).toBe("/api/user/logged-in/");
    expect(new Headers(calls[0]?.init?.headers).has("Authorization")).toBe(false);
  });

  test("builds the targeted business score request", async () => {
    let requestUrl: URL | undefined;
    const client = new BeliClient({
      fetch: async (input) => {
        requestUrl = new URL(String(input));
        return json({
          results: [{ user_id: "friend", business_id: 42, value: 8.2, category: "RES" }],
          count: 1,
          score: 8.2,
        });
      },
    });

    const scores = await client.scores.forBusiness({ viewerId: "me", businessId: 42 });
    expect(scores.count).toBe(1);
    expect(requestUrl?.pathname).toBe("/api/scores/me/42/");
    expect(requestUrl?.searchParams.get("multi_category")).toBe("true");
    expect(requestUrl?.searchParams.get("business_likes_comments")).toBe("true");
  });

  test("normalizes targeted recommendation variants", async () => {
    let body: unknown;
    const client = new BeliClient({
      fetch: async (_input, init) => {
        body = JSON.parse(String(init?.body));
        return json({ results: [{ business: 42, expected_percentile_score: "7.6" }] });
      },
    });

    await expect(
      client.recommendations.score({ userId: "me", businessIds: [42] }),
    ).resolves.toEqual([{ business: 42, expected_percentile_score: "7.6", business_id: 42, expected_percentile: 7.6 }]);
    expect(body).toMatchObject({
      user: "me",
      businesses: [42],
      category: "RES",
      avg_only: true,
    });
  });

  test("combines community score values", async () => {
    const client = new BeliClient({
      fetch: async (input) => {
        const path = new URL(String(input)).pathname;
        return path.includes("databusinessfloat")
          ? json({ results: [{ value: "8.35" }] })
          : json({ count: 327 });
      },
    });

    await expect(client.businesses.communityScore(42)).resolves.toEqual({
      average: 8.35,
      count: 327,
    });
  });

  test("throws safe HTTP errors", async () => {
    const client = new BeliClient({
      fetch: async () => new Response("backend secret detail", { status: 429 }),
    });

    try {
      await client.users.following("me");
      throw new Error("expected request to fail");
    } catch (error) {
      expect(error).toBeInstanceOf(BeliHttpError);
      expect((error as Error).message).not.toContain("backend secret detail");
      expect((error as BeliHttpError).status).toBe(429);
    }
  });

  test("rejects malformed required envelopes", async () => {
    const client = new BeliClient({ fetch: async () => json({ nope: [] }) });
    await expect(client.users.following("me")).rejects.toBeInstanceOf(BeliContractError);
  });
});
