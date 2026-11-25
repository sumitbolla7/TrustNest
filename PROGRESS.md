# TrustNest progress

## Phase 0 — Repository baseline

- Confirmed the local branch is `main` and the configured origin is `https://github.com/sumitbolla7/TrustNest.git`. Initial remote inspection returned no refs.
- Reviewed the App Router pages and handlers, auth flow, models, dependencies, middleware, provider configuration, reference theme and listing fixture.
- Verified the upstream MIT notice and restored it in the repository. Updated product labels and documentation to TrustNest.
- Added secret-file exclusions and replaced sample contact details with reserved example values. The environment template holds placeholders and local URLs. Source and staged files were checked for common credential patterns.
- GitHub push protection identified an inherited Mapbox secret in the standalone property template. Removed it from the unpublished baseline, scanned the staged files for Mapbox tokens and made the template map optional with a configured public token.
- No Firebase integration or URL was found. The database client uses MongoDB and reads its connection string from the environment.
- Confirmed an affected Next.js version against the vendor advisory. See README.md for the findings and security requirements table.
- Functional tests, build verification and automated SAST were deferred. No application was deployed and no production database was accessed.

## Pending

- Review bundled media provenance before distributing the application.
- Confirm whether the original third-party Mapbox token has been revoked.

## Phase 1

- Verified the Phase 0 commit against origin/main. Updated the public brand and added a community services preview.
- Localised rental prices, types, address fields, dates and floor area. Added fictional examples for Dublin, Cork, Galway, Limerick and Waterford.
- Patched the framework and added environment validation, origin checks, request bounds, upload checks, security headers and public listing data minimisation.
- Clean install, lint, eight unit tests, environment check, production build and provider-free HTTP smoke passed. Full dependency audit reported three moderate development-only findings. The production-only audit reported zero.
- Provider-backed sign-in, two-account checks, upload and mapping await isolated credentials. Rate limiting, upload rollback, session revocation and fuller CSP remain open.
- Added GitHub application and security workflows with push, pull request and manual triggers. The security workflow is scheduled at 20:00 Europe/Dublin. Both definitions passed actionlint.
- Verified the local development server on loopback. Disabled automatic framework edits to the repository instructions. The first hosted application and Gitleaks jobs passed. Applied commit SHA pins to the action references reported by Semgrep.
- Hosted checks on `eb3b61b` passed for application validation, Semgrep, Gitleaks and production dependencies. The full audit remains failing because of three moderate findings in the development dependency tree. The next phase requires maintainer approval.
