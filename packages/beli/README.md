# `@mergd/beli`

Unofficial, typed TypeScript SDK for Beli's private mobile API.

```bash
npm install @mergd/beli
```

Authentication is out of scope. Supply a `fetch` implementation that already
adds the session information required by your environment:

```ts
import { BeliClient, type BeliFetch } from "@mergd/beli";

const authenticatedFetch: BeliFetch = (input, init) => {
  const headers = new Headers(init?.headers);
  headers.set("Authorization", `Bearer ${process.env.BELI_ACCESS_TOKEN}`);
  return fetch(input, { ...init, headers });
};

const beli = new BeliClient({ fetch: authenticatedFetch });

const business = await beli.businesses.get({ placeId: "ChIJ..." });
const friends = await beli.scores.forBusiness({
  viewerId: "your-beli-user-id",
  businessId: business.id,
});
```

## Resources

```ts
beli.users.current();
beli.users.following(userId);
beli.users.followers(userId);

beli.businesses.search({ term, viewerId, city, coords });
beli.businesses.get({ id });
beli.businesses.get({ placeId });
beli.businesses.communityScore(businessId);

beli.scores.forBusiness({ viewerId, businessId });
beli.scores.network(viewerId);

beli.lists.ranking({ userId, category: "RES" });
beli.lists.bookmarks({ userId, category: "RES" });

beli.recommendations.score({ userId, businessIds, category: "RES" });
beli.recommendations.all(userId);

beli.photos.forBusiness(businessId);
beli.photos.forUserBusiness(userId, businessId);
```

All methods that make requests accept an optional `AbortSignal` as their final
argument.

## Runtime behavior

The SDK performs JSON serialization, URL construction, basic response-contract
checks, and safe HTTP errors. It intentionally does not implement login, token
refresh, credential storage, retries, throttling, or caching. Those policies
belong to the caller-provided transport.

Private APIs can change without notice. This package is not affiliated with Beli.
