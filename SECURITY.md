# TrustNest security policy

## Reporting a vulnerability

Contact the repository maintainer, `sumitbolla7`, through GitHub private vulnerability reporting if enabled. If private reporting is unavailable, contact the maintainer privately through a verified channel listed on their GitHub profile. Keep vulnerability details and personal data out of public issues and pull requests.

Include the affected commit or version, component, observed impact, and enough redacted detail for triage. Use test accounts and synthetic data. Coordinate public disclosure with the maintainer.

## Current security status

TrustNest is in local development. No release has been designated as supported. The Phase 0 Next.js dependency was affected by [CVE-2025-29927](https://github.com/vercel/next.js/security/advisories/GHSA-f82v-jwr5-mffw). Phase 1 replaces the inherited dependency and adds origin validation, request bounds, explicit session expiry and security headers. Phase 3 adds a public field allowlist, owner-scoped changes, MongoDB-backed authenticated rate limits and photo decoding. Complete provider-backed verification and the security work in README.md before any public deployment.

Keep OAuth secrets, database URLs, signing secrets and server-side API credentials in local environment files or an approved secret store. If a credential is exposed, revoke or rotate it with its provider and notify the maintainer privately.
