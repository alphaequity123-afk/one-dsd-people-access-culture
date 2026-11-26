# Route smoke checks

Read-only checks that the main pages of both program views load. Nothing here posts, signs in or calls a provider.

## What is checked

`smoke-routes.mjs` requests each route and records:

- the HTTP status, following same-origin redirects (a route passes only if it ends at a 200 HTML page);
- whether the page has a non-empty `<h1>`;
- any `<svg>` other than a chart or map (`role="img"`/`role="group"`, or a legend swatch) and the paperclip icon on upload buttons;
- whether the header menu (`<nav aria-label="Program">`) reads Home, Practice, Leadership, Communities, Knowledge. The mobile-only "My work" link is listed separately;
- with `--log`, the error lines the server wrote while that route was requested.

Routes are the 19 front-door pages listed in the script plus 120 internal hrefs sampled at even intervals from the program catalog (`lib/program/catalog.ts`, `programCatalog()`), stored in `catalog-sample.json`.

## Run against both views locally

```sh
scripts/smoke/run-local-views.sh [out-dir] [port] [chunk-size]   # defaults: /tmp/pac-smoke 18931 8
```

This starts `next dev` on 127.0.0.1 once per chunk of routes for `PAC_STAFF_SCOPE=dsd` and then `one-dhs`, with a clean environment holding only the non-secret local-preview settings from `handoff/.env.example` (static content, in-memory store, no database URLs or keys, AI, research and scheduling off). The server is restarted between chunks because `next dev` holds every compiled route in memory and can run out of memory across all 139 routes; a cold compile of the first page alone takes about 8 to 10 GB. Before each start the script waits for `SMOKE_MIN_FREE_MB` (default 9000) of free memory, and if a server is killed mid-chunk it keeps the answered routes and retries the rest on a fresh server. Expect about an hour for both views on an otherwise idle machine. Results go to `<out-dir>/report-dsd.json` and `<out-dir>/report-one-dhs.json`; set `SMOKE_VIEWS=dsd` to run one view.

## Run against any running server

```sh
node scripts/smoke/smoke-routes.mjs http://127.0.0.1:8915 --label dsd --out report.json
node scripts/smoke/smoke-routes.mjs http://127.0.0.1:8915 --only /home,/ask        # a few routes
node scripts/smoke/smoke-routes.mjs http://127.0.0.1:8915 --log server.log --concurrency 1   # attach server errors
node scripts/smoke/smoke-routes.mjs --merge part1.json part2.json --out report.json
```

The exit code is 1 when any route fails. Each result in the report lists its `problems`.

## Resampling the catalog

The sample is fixed so runs are comparable. To resample after the catalog changes, dump `programCatalog()` to JSON (for example from a one-off vitest file that writes `programCatalog().map(i => ({ href: i.href }))`), then pass `--catalog dump.json [--sample 120]`, or regenerate `catalog-sample.json` from it.
