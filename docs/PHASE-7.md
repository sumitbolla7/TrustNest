# TrustNest Phase 7 evidence

National College of Ireland · Secure Web Development

## Irish photo library and demonstration data

TrustNest contains 80 distinct WebPs. The library includes Irish terraces, Georgian streetscapes, houses, cottages, apartment buildings and a student residence, plus illustrative kitchens, living rooms, bedrooms and bathrooms. The homepage adds a Dublin Georgian terrace and five city photos. Interior photographs depict separate examples and the demonstration listings are fictional. They do not describe the availability or interior of the pictured address.

Licence and creator information was checked against each Commons file record before download. Some Geograph files were retrieved from the original Geograph photo page using the publisher’s unwatermarked image. The [credits](../IMAGE_CREDITS.md) and [in-app attribution page](../app/photo-credits/page.jsx) give the source, creator, licence, changes and share-alike requirement. No marketplace listing photos or Street View screenshots were used.

The assets total about 8.2 MiB. Median size is 79 KiB and the maximum is 279 KiB. Smaller originals were kept at their available dimensions. Sharp decoded all assets and confirmed unique content hashes and the absence of embedded EXIF, IPTC and XMP. All 80 assets returned HTTP 200 locally and a sample hero image resolved through the Next.js image optimiser. The photo gallery supports labelled thumbnails, a photo count, keyboard navigation, swipe and a graceful fallback.

The dedicated loopback MongoDB demonstration database gained 15 fictional records. Reseeding matched the same 45 stable IDs with zero new records. All 26 counties are represented and each fictional record has a unique cover and three credited photos. No fixture contains a private address, phone number, owner or contact name. The existing seeder continued to match only its labelled fixture IDs.

## Security requirements and observed results

All connected checks used synthetic accounts and databases on loopback. Run a production build, set `TRUSTNEST_TEST_MONGO` to a dedicated local daemon, and run `npm run test:db` and `npm run test:phase5`. `npm test` also exercises the request validators and photo library.

| ID | Requirement | Observed evidence | Status |
| --- | --- | --- | --- |
| SEC-01 | Authentication and credential security | Credential registration/login/logout, rejection of public admin registration, synthetic one-use verification/reset tokens, and password-change revocation passed. | Verified locally. Real email delivery and Google OAuth require configuration. |
| SEC-02 | Authorization and ownership | Two-account saved-rental, enquiry, conversation, viewing and listing-isolation checks passed. Non-admin moderation was rejected. Moderator changes produced audit records. | Verified locally. |
| SEC-03 | Secure session management | Local session cookie includes HttpOnly and SameSite=Lax. Password changes, reset and suspension invalidated older sessions. | Verified locally. HTTPS Secure-cookie behaviour awaits protected deployment. |
| SEC-04 | Input allowlisting and injection prevention | Per-action JSON keys and declared content types are enforced. Unknown request keys, repeated scalar rental fields and excessive actual body bytes are rejected. Privileged multipart fields are excluded from the explicit listing document. Existing filter and escaped-output checks passed. | Verified locally. |
| SEC-05 | Configuration, logging and error handling | Environment checks reported variable names without values. Same-origin writes and defensive response headers passed HTTP checks. Provider errors are generic on the exercised paths. Targeted staged secret scanning passed. | Verified locally. Hosted provider logs and configuration await protected deployment. |

**Additional checks.** Only confirmed JPEG/PNG input is accepted for rental uploads, decoded and re-encoded before storage. Malformed photo data was rejected at the authenticated endpoint. In-app file selection, preview and removal passed in Edge. A valid image reached the managed-storage boundary and produced the expected unavailable response with Cloudinary disabled. The live storage round trip remains unverified. Authenticated enquiry throttling, private field omission, audit logging and isolated database persistence passed.

## Functional and browser results

- Lint, production build, 20 unit tests, provider-free smoke, both connected MongoDB suites and the staged secret scan passed.
- Edge and Playwright exercised the site at 360, 390, 768, 1024, 1440 and 1920 px. Browser checks covered filters and return links, gallery interaction including swipe, registration, listing approval, bookmarks, messaging, notifications and reporting.
- Connected suites verified property creation/editing/deletion, tenant/owner isolation, viewing changes, landlord review, administrative actions and persistence. The local development server is at `http://localhost:3000`.
- The production-only npm audit reported zero advisories. The full audit reported three moderate development-only findings in glob, minimatch and sucrase.

## Remaining release gates

Configure the managed photo, email and optional OAuth/map providers in a protected Vercel and Atlas preview. Verify hosted authentication cookies, database connectivity and upload delivery there. Public release remains subject to maintainer approval. See the [deployment guide](DEPLOYMENT.md).
