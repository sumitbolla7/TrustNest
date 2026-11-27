# TrustNest deployment guide

TrustNest is prepared for a manually initiated, access-controlled Vercel preview. Keep automatic Git deployment off in `vercel.json`. Public release requires maintainer approval and the Phase 7 security review. The academic preview can use Vercel Hobby and a dedicated eligible Atlas free-tier database. Provider quotas and free-tier eligibility apply.

## 1. Prepare the reviewed commit

Use Node.js 24 and run `npm ci`, `npm run lint`, `npm test`, `npm run build` and `npm run test:smoke`. See [Phase 6 verification](PHASE-6.md) for the connected and browser suites. Run `npm run scan:secrets` after staging any configuration changes. Confirm the checkout matches the reviewed commit in GitHub.

## 2. Configure MongoDB Atlas

1. Create a separate project and database for the synthetic preview. Use a database name such as `trustnest_demo_preview`. Keep local, preview and production credentials separate.
2. Create a database user with read/write access only to the preview database. Use Atlas TLS connection settings and a long random password. Store the application URI as `MONGODB_URI` in Vercel Preview variables.
3. Apply your approved Atlas network access policy. Vercel Hobby can use dynamic outbound addresses. If the existing access policy cannot admit them, the provider-free sample preview can run while an approved network path is arranged. A broad allowlist and elevated default database credentials require separate review.
4. Seed only the dedicated demo database. Set the guarded seed variables described in [README](../README.md), then run `npm run seed:demo -- --confirm-demo`. Create a fictional administrator using the guarded account seeder.

[MongoDB Atlas and Vercel](https://www.mongodb.com/docs/atlas/reference/partner-integrations/vercel/) · [Atlas authorisation guidance](https://www.mongodb.com/docs/atlas/architecture/current/auth/authorization/)

## 3. Create the protected Vercel project

1. Use the maintainer's account to run `npx vercel login` and `npx vercel project add`. Link the existing workspace with `npx vercel link`. Select Next.js, Node.js 24 and the repository root.
2. Configure **Vercel Authentication** with **Standard Protection** before issuing a preview. Connect only `sumitbolla7/TrustNest` if enabling the Git integration. Keep automatic deployments disabled and use a reviewed commit.
3. Set Preview variables in the dashboard. Keep secrets out of Git and terminal command history.

| Configuration | Preview variables |
| --- | --- |
| Required for connected operation | `MONGODB_URI`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL` |
| Canonical origin and share links | `NEXT_PUBLIC_DOMAIN` |
| Managed photographs | `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` |
| Credential email | `RESEND_API_KEY`, `TRUSTNEST_EMAIL_FROM`, `TRUSTNEST_REQUIRE_VERIFIED_EMAIL=true` |
| Optional Google OAuth | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` |
| Optional maps | `NEXT_PUBLIC_MAPBOX_TOKEN`, `NEXT_PUBLIC_GOOGLE_GEOCODING_API_KEY` |

Run `npx vercel deploy` after protection and account approvals. Vercel prints the generated HTTPS `vercel.app` URL. Open it from a separate signed-out browser and confirm that Vercel Authentication blocks unauthorised access. Use an already protected stable preview URL for `NEXTAUTH_URL` and `NEXT_PUBLIC_DOMAIN`. Update Preview variables and redeploy if the initial URL differs. If enabling Google, register that exact HTTPS origin plus `/api/auth/callback/google` with Google before testing sign-in. Avoid promoting the preview because Hobby Standard Protection leaves the production domain public.

[Vercel CLI deployment](https://vercel.com/docs/cli/deploy) · [Vercel deployment environments](https://vercel.com/docs/deployments/environments) · [Vercel deployment protection](https://vercel.com/docs/deployment-protection)

## 4. Validate and operate the preview

Check the sitemap and robots output, verify private pages return no-index directives, and test authentication and role separation independently of crawler controls. Verify database connectivity, account email delivery, the live managed-photo upload, and hosted cookies with fictional accounts. Review provider logs and three-role functional checks before Phase 7. Record the exact commit and preview URL. For a rollback, redeploy the last verified commit to the protected preview and repeat the access check.

Local credentials, test databases, logs and inherited reference media are excluded from the CLI upload by `.vercelignore`. Current setup and rollback rationale are recorded in [hosting.md](hosting.md).
