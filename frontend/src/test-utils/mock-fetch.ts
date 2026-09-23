type MockRoute = {
  method?: string;
  /** Substring or pattern matched against the request URL. */
  match: string | RegExp;
  status?: number;
  body?: unknown;
};

export type FetchCall = { url: string; method: string; body?: unknown };

/**
 * Installs a route-matching global.fetch mock, the same shape every screen's
 * `fetch(url, { method, body })` calls expect. Returns the list of calls made so
 * far — e2e tests assert on this to confirm the right POST/PATCH/DELETE body was
 * sent, not just that "some" request happened.
 */
export function mockFetchRoutes(routes: MockRoute[]) {
  const calls: FetchCall[] = [];

  global.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = (init?.method ?? "GET").toUpperCase();
    const body =
      typeof init?.body === "string" ? JSON.parse(init.body) : undefined;
    calls.push({ url, method, body });

    // Prefers the most specific match (by substring length) rather than array
    // order — "/api/taxes/3" and "/api/taxes/3/transactions" both match a
    // transactions-endpoint URL, and callers shouldn't have to order routes
    // narrowest-first to get the right one.
    const matching = routes.filter(
      (r) =>
        (!r.method || r.method.toUpperCase() === method) &&
        (typeof r.match === "string" ? url.includes(r.match) : r.match.test(url)),
    );
    const route = matching.sort(
      (a, b) =>
        (typeof b.match === "string" ? b.match.length : 0) -
        (typeof a.match === "string" ? a.match.length : 0),
    )[0];

    if (!route) {
      throw new Error(`mockFetchRoutes: no route matched ${method} ${url}`);
    }

    const status = route.status ?? 200;
    return {
      ok: status < 400,
      status,
      json: async () => route.body,
    } as Response;
  }) as jest.Mock;

  return { calls };
}
