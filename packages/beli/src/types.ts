export type BeliId = number;
export type BeliUserId = string;
export type BeliCategory = "RES" | "BAR" | "COFFEE" | "BAK" | "DESSERT" | string;
export type BeliFetch = (
  input: string | URL | Request,
  init?: RequestInit,
) => Promise<Response>;

export interface BeliUser {
  id: BeliUserId;
  username: string;
  full_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  profile_photo?: string | null;
  photo?: string | null;
  home_city?: string | null;
  [key: string]: unknown;
}

export interface BeliBusiness {
  id: BeliId;
  name: string;
  place_id?: string | null;
  city?: string | null;
  neighborhood?: string | null;
  country?: string | null;
  lat?: number | null;
  lng?: number | null;
  price?: number | null;
  website?: string | null;
  phone_number?: string | null;
  cuisines?: string[];
  default_category?: BeliCategory;
  summary?: string | null;
  [key: string]: unknown;
}

export interface BeliSearchPrediction {
  place_id: string;
  business?: BeliId | null;
  distance_meters?: number | null;
  structured_formatting?: {
    main_text?: string;
    secondary_text?: string;
  };
  [key: string]: unknown;
}

export interface BeliScore {
  user_id: BeliUserId;
  business_id: BeliId;
  value: number;
  category: BeliCategory;
  num_visits?: number;
  labels?: string[];
  [key: string]: unknown;
}

export interface BeliBusinessScores {
  results: BeliScore[];
  count?: number;
  score?: number | null;
}

export interface BeliRankingEntry {
  id: BeliId;
  user: BeliUserId;
  business: BeliBusiness;
  score?: number | null;
  value?: number | null;
  category?: BeliCategory;
  visit_dates?: string[];
  [key: string]: unknown;
}

export interface BeliBookmarkEntry {
  id: BeliId;
  user: BeliUserId;
  business: BeliBusiness;
  [key: string]: unknown;
}

export type BeliBookmarks = Record<string, BeliBookmarkEntry[]>;

export interface BeliRecommendation {
  business_id: BeliId;
  expected_percentile: number;
  [key: string]: unknown;
}

export interface BeliPhoto {
  id: BeliId;
  user?: BeliUserId;
  business?: BeliId;
  image?: string | null;
  thumbnail?: string | null;
  bb_image?: string | null;
  bb_thumbnail?: string | null;
  description?: string | null;
  order?: number | null;
  status?: string | null;
  [key: string]: unknown;
}

export interface BeliCommunityScore {
  average: number | null;
  count: number | null;
}

export interface SearchBusinessesInput {
  term: string;
  viewerId: BeliUserId;
  city?: string;
  coords?: string;
}

export type GetBusinessInput = { id: BeliId } | { placeId: string };

export interface GetBusinessScoresInput {
  viewerId: BeliUserId;
  businessId: BeliId;
  multiCategory?: boolean;
  includeLikesAndComments?: boolean;
}

export interface GetListInput {
  userId: BeliUserId;
  category?: BeliCategory;
}

export interface GetRecommendationInput {
  userId: BeliUserId;
  businessIds: BeliId[];
  category?: BeliCategory;
}

export interface BeliClientOptions {
  /** A caller-owned fetch implementation. Apply authentication outside the SDK. */
  fetch?: BeliFetch;
  apiBaseUrl?: string;
  onboardingBaseUrl?: string;
  recommendationsBaseUrl?: string;
  /** Optional non-auth defaults such as application metadata. */
  headers?: HeadersInit | (() => HeadersInit | Promise<HeadersInit>);
}
