# TrustNest security policy

## Reporting a vulnerability

Contact the repository maintainer, `sumitbolla7`, through GitHub private vulnerability reporting if enabled. If private reporting is unavailable, contact the maintainer privately through a verified channel listed on their GitHub profile. Keep vulnerability details and personal data out of public issues and pull requests.

Include the affected commit or version, component, observed impact, and enough redacted detail for triage. Use test accounts and synthetic data. Coordinate public disclosure with the maintainer.

## Current security status

TrustNest is in local development. No release has been designated as supported. The inherited Next.js version is affected by [CVE-2025-29927](https://github.com/vercel/next.js/security/advisories/GHSA-f82v-jwr5-mffw). Complete runtime verification and the security work described in README.md before deployment.

Keep OAuth secrets, database URLs, signing secrets and server-side API credentials in local environment files or an approved secret store. If a credential is exposed, revoke or rotate it with its provider and notify the maintainer privately.
