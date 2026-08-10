import { BeliContractError } from "./errors";
import { BeliTransport } from "./transport";
import type {
  BeliBookmarkEntry,
  BeliBookmarks,
  BeliBusiness,
  BeliBusinessScores,
  BeliClientOptions,
  BeliCommunityScore,
  BeliPhoto,
  BeliRankingEntry,
  BeliRecommendation,
  BeliScore,
  BeliSearchPrediction,
  BeliUser,
  BeliUserId,
  GetBusinessInput,
  GetBusinessScoresInput,
  GetListInput,
  GetRecommendationInput,
  SearchBusinessesInput,
} from "./types";

export class BeliClient {
  readonly users: UsersResource;
  readonly businesses: BusinessesResource;
  readonly scores: ScoresResource;
  readonly lists: ListsResource;
  readonly recommendations: RecommendationsResource;
  readonly photos: PhotosResource;

  constructor(options: BeliClientOptions = {}) {
    const transport = new BeliTransport(options);
    this.users = new UsersResource(transport);
    this.businesses = new BusinessesResource(transport);
    this.scores = new ScoresResource(transport);
    this.lists = new ListsResource(transport);
    this.recommendations = new RecommendationsResource(transport);
    this.photos = new PhotosResource(transport);
  }
}

export class UsersResource {
  constructor(private readonly transport: BeliTransport) {}

  async current(options: { signal?: AbortSignal } = {}): Promise<BeliUser> {
    const value = await this.transport.request<unknown>("/api/user/logged-in/", {
      host: "onboarding",
      signal: options.signal,
    });
    const users = results<BeliUser>(value, "users.current");
    const user = users[0];
    if (!user || typeof user.id !== "string" || typeof user.username !== "string") {
      throw new BeliContractError("users.current", "missing current user");
    }
    return user;
  }

  async following(userId: BeliUserId, signal?: AbortSignal): Promise<BeliUser[]> {
    const value = await this.transport.request<unknown>(`/api/following/${userId}/`, { signal });
    return results<BeliUser>(value, "users.following");
  }

  async followers(userId: BeliUserId, signal?: AbortSignal): Promise<BeliUser[]> {
    const value = await this.transport.request<unknown>(`/api/followers/${userId}/`, { signal });
    return results<BeliUser>(value, "users.followers");
  }
}

export class BusinessesResource {
  constructor(private readonly transport: BeliTransport) {}

  async search(input: SearchBusinessesInput, signal?: AbortSignal): Promise<BeliSearchPrediction[]> {
    const value = await this.transport.request<unknown>("/api/search-app/", {
      query: {
        term: input.term,
        user: input.viewerId,
        city: input.city ?? "",
        coords: input.coords ?? " ",
      },
      signal,
    });
    if (!isRecord(value) || !Array.isArray(value.predictions)) {
      throw new BeliContractError("businesses.search", "missing predictions");
    }
    return value.predictions as BeliSearchPrediction[];
  }

  async get(input: GetBusinessInput, signal?: AbortSignal): Promise<BeliBusiness> {
    const query = "id" in input ? { id: input.id } : { place_id: input.placeId };
    const value = await this.transport.request<unknown>("/api/business/", {
      query: { ...query, from_business_page: true },
      signal,
    });
    const business =
      isRecord(value) && Array.isArray(value.results) ? value.results[0] : value;
    if (!isRecord(business) || typeof business.id !== "number" || typeof business.name !== "string") {
      throw new BeliContractError("businesses.get", "missing business");
    }
    return business as BeliBusiness;
  }

  async communityScore(businessId: number, signal?: AbortSignal): Promise<BeliCommunityScore> {
    const [averageValue, countValue] = await Promise.all([
      this.transport.request<unknown>("/api/databusinessfloat-sparse/", {
        query: { business: businessId, field__name: "AVGBUSINESSSCORE" },
        signal,
      }),
      this.transport.request<unknown>(`/api/business-count-rated/${businessId}/`, { signal }),
    ]);
    const average = isRecord(averageValue) && Array.isArray(averageValue.results)
      ? numeric(isRecord(averageValue.results[0]) ? averageValue.results[0].value : null)
      : null;
    const count = isRecord(countValue) ? numeric(countValue.count) : null;
    return { average, count };
  }
}

export class ScoresResource {
  constructor(private readonly transport: BeliTransport) {}

  async forBusiness(
    input: GetBusinessScoresInput,
    signal?: AbortSignal,
  ): Promise<BeliBusinessScores> {
    const value = await this.transport.request<unknown>(
      `/api/scores/${input.viewerId}/${input.businessId}/`,
      {
        query: {
          multi_category: input.multiCategory ?? true,
          business_likes_comments: input.includeLikesAndComments ?? true,
        },
        signal,
      },
    );
    if (Array.isArray(value)) return { results: value as BeliScore[] };
    if (!isRecord(value) || !Array.isArray(value.results)) {
      throw new BeliContractError("scores.forBusiness", "missing results");
    }
    return value as unknown as BeliBusinessScores;
  }

  async network(viewerId: BeliUserId, signal?: AbortSignal): Promise<BeliScore[]> {
    const value = await this.transport.request<unknown>(`/api/scores/${viewerId}/`, { signal });
    if (Array.isArray(value)) return value as BeliScore[];
    return results<BeliScore>(value, "scores.network");
  }
}

export class ListsResource {
  constructor(private readonly transport: BeliTransport) {}

  async ranking(input: GetListInput, signal?: AbortSignal): Promise<BeliRankingEntry[]> {
    const value = await this.transport.request<unknown>("/api/get-ranking/", {
      query: { user: input.userId, category: input.category ?? "RES" },
      signal,
    });
    return results<BeliRankingEntry>(value, "lists.ranking");
  }

  async bookmarks(input: GetListInput, signal?: AbortSignal): Promise<BeliBookmarks> {
    const value = await this.transport.request<unknown>("/api/get-bookmark/", {
      query: { user: input.userId, category: input.category ?? "RES" },
      signal,
    });
    if (!isRecord(value)) throw new BeliContractError("lists.bookmarks", "expected an object");
    for (const entries of Object.values(value)) {
      if (!Array.isArray(entries)) {
        throw new BeliContractError("lists.bookmarks", "expected category arrays");
      }
    }
    return value as BeliBookmarks;
  }
}

export class RecommendationsResource {
  constructor(private readonly transport: BeliTransport) {}

  async score(
    input: GetRecommendationInput,
    signal?: AbortSignal,
  ): Promise<BeliRecommendation[]> {
    const value = await this.transport.request<unknown>("/api/rec-score/", {
      method: "POST",
      body: {
        user: input.userId,
        businesses: input.businessIds,
        category: input.category ?? "RES",
        avg_only: true,
        return_expected_percentiles: true,
        allow_databusinessfloat_fallback: true,
      },
      signal,
    });
    return recommendations(value, "recommendations.score");
  }

  async all(userId: BeliUserId, signal?: AbortSignal): Promise<BeliRecommendation[]> {
    const value = await this.transport.request<unknown>(`/api/recs/${userId}/`, {
      host: "recommendations",
      signal,
    });
    return recommendations(value, "recommendations.all");
  }
}

export class PhotosResource {
  constructor(private readonly transport: BeliTransport) {}

  async forBusiness(businessId: number, signal?: AbortSignal): Promise<BeliPhoto[]> {
    const value = await this.transport.request<unknown>(
      `/api/members-business-photo/${businessId}/`,
      { query: { page: 1, page_size: 100, menu_vibes: true }, signal },
    );
    return activePhotos(results<BeliPhoto>(value, "photos.forBusiness"));
  }

  async forUserBusiness(
    userId: BeliUserId,
    businessId: number,
    signal?: AbortSignal,
  ): Promise<BeliPhoto[]> {
    const value = await this.transport.request<unknown>("/api/user-business-photo/", {
      query: { user: userId, business: businessId },
      signal,
    });
    if (!isRecord(value)) throw new BeliContractError("photos.forUserBusiness", "missing results");
    const list = Array.isArray(value.results) ? value.results : value.results ? [value.results] : [];
    return activePhotos(list as BeliPhoto[]);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function results<T>(value: unknown, operation: string): T[] {
  if (!isRecord(value) || !Array.isArray(value.results)) {
    throw new BeliContractError(operation, "missing results array");
  }
  return value.results as T[];
}

function numeric(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return null;
}

function recommendations(value: unknown, operation: string): BeliRecommendation[] {
  const list = Array.isArray(value)
    ? value
    : isRecord(value) && Array.isArray(value.results)
      ? value.results
      : null;
  if (!list) throw new BeliContractError(operation, "missing recommendation list");
  return list.flatMap((item) => {
    if (!isRecord(item)) return [];
    const businessId = numeric(item.business_id) ?? numeric(item.business);
    const score = numeric(item.expected_percentile) ?? numeric(item.expected_percentile_score);
    return businessId === null || score === null
      ? []
      : [{ ...item, business_id: businessId, expected_percentile: score } as BeliRecommendation];
  });
}

function activePhotos(photos: BeliPhoto[]): BeliPhoto[] {
  return photos.filter((photo) => (photo.status ?? "ACTIVE") !== "DELETED");
}
