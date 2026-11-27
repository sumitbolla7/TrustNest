# TrustNest Phase 6

National College of Ireland · Secure Web Development

## Delivered

- Navy and emerald design tokens, self-hosted Inter Variable typography, Lucide icons, shared buttons and fields, loading states and accessible native dialogs.
- Reworked homepage and navigation, with database-backed featured, recent and reviewed-landlord rentals. TrustNest review is a platform decision rather than official verification.
- Desktop search sidebar, mobile drawer, filters encoded in the URL and a detail back link that restores the validated search. Listing details include fullscreen photos and a text location when maps are unconfigured.
- Responsive tenant and landlord workspaces, administrator queue tabs with server-side filters and pagination, account password visibility, conversation sidebar and database-backed notification dropdown.
- Expanded Irish rental safety guidance, page metadata and Open Graph, sitemap, robots and no-index response headers for private areas.
- The gallery dialog corrected a close-control failure found by Playwright. It replaced two gallery dependencies. Maps load dynamically only when configured. Homepage and related cards skip database counts they do not display.

## Local evidence

| Check | Observed result |
| --- | --- |
| Installation and build | Lockfile resolved, lint passed, 15 unit tests passed, production build passed. |
| HTTP and SEO smoke | Public pages, protected redirects, response headers, sitemap exclusion and no-index headers passed. |
| MongoDB | Dedicated loopback server connected. Both connected suites passed with fictional accounts. Checks covered login/logout, listing creation/edit/approval/deletion, marking as rented, bookmarks, enquiries, viewing transitions, private messages, verification, scam reports, account suspension/reactivation, notification isolation and administrative audit. |
| Administration pagination | Search on a 16-record fixture returned one result on page two at 15 per page. Invalid page, section and status values were rejected. |
| Edge and Playwright | Homepage, responsive navigation, filters, detail links and gallery passed at 360, 390, 768, 1024, 1440 and 1920 px. Role checks covered tenant registration, landlord listing and photo preview/removal, administrator approval, bookmarks, enquiry reply and notification read controls. |
| GitHub checks | Application CI, Semgrep, Gitleaks and the production dependency audit passed on the implementation commit. The full audit still flags three moderate development advisories. [Application run](https://github.com/sumitbolla7/TrustNest/actions/runs/46029157719) · [Security run](https://github.com/sumitbolla7/TrustNest/actions/runs/46029157851) |
| Asset handling | JPEG/PNG decoding and re-encoding unit checks passed. Managed Cloudinary upload requires provider credentials. |

The optional browser suite expects a running local app using the same dedicated loopback demo database provided to the runner. It creates fictional accounts and records. Install the test harness with `npm install --prefix build/browser --no-save playwright-core`, then set `TRUSTNEST_BROWSER_EXECUTABLE`, `TRUSTNEST_DEMO_MONGODB_URI` and `TRUSTNEST_DEMO_DATABASE`. Run `npm run test:responsive`. `TRUSTNEST_BROWSER_ORIGIN` defaults to `http://localhost:3000`. The test harness lives in the ignored build directory. Connected HTTP suites use `TRUSTNEST_TEST_MONGO` and a production build.

### Performance measurements

Local production build, Edge at 1440 px, loopback MongoDB and default browser settings. Median of three new browser contexts after one warm-up per page. Script size sums encoded script response bodies. This is a local measurement, separate from hosted performance.

| Page | TTFB | DOMContentLoaded | Encoded scripts |
| --- | ---: | ---: | ---: |
| Homepage | 101 ms | 367 ms | 159 KiB |
| Dublin search | 31 ms | 318 ms | 160 KiB |
| Rental detail | 38 ms | 195 ms | 172 KiB |

The detail page measured 190 KiB of encoded scripts immediately before the native gallery change and 172 KiB afterwards in the same local benchmark.

## Release-readiness status

**83% by readiness checklist**, with 15 verified local groups and three external groups pending.

| Status | Groups |
| --- | --- |
| Verified locally (15) | Design system, homepage, navigation, search, detail, tenant workspace, landlord workspace, administration, accounts, messaging, notifications, safety and help, responsive coverage, build/SEO/performance, documentation and Git delivery |
| Awaiting external configuration (3) | Managed Cloudinary upload, account/map provider verification (Resend, optional Google OAuth and maps), protected Vercel and Atlas operation |

Public release still requires approval and Phase 7 security testing. See [deployment guide](DEPLOYMENT.md). Upstream attribution remains in the [README](../README.md).
