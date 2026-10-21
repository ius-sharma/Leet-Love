# Private Google beta and waitlist

The public routes are `/`, `/login`, `/signup`, and `/waitlist`. Learning routes,
the problem explorer, the studio, and shared explanation routes now require the
invited Google account. Other visitors can use the landing preview and join the
waitlist. The signup screen is an invited Google flow, not open registration.

The sole allowed account is `sharmaeditzayush@gmail.com`. Matching is case-insensitive
after trimming; Gmail dot aliases and plus aliases are deliberately not expanded.
The typed email is only a routing hint. Authorization uses the Supabase-verified
user, confirmed email, verified Google identity email, and the verified JWT's OAuth
authentication method. A claimed email in editable user metadata never grants access.

## Create and configure the project

1. Create a **dedicated** Supabase project for LeetLove. The database migration
   restricts that project's Auth users and sessions; do not use a shared project.
2. Apply migrations `001`, `002`, `003_private_beta_auth.sql`, and `004_waitlist.sql`
   in filename order in the Supabase SQL editor. The `003` triggers block other
   accounts from being created and block new non-owner sessions. They also reject
   changing the owner's email away from the approved address. Do not enable auth
   before installing them. Existing foreign users/tokens, if any, need an explicit
   administrator review/revocation; none are deleted automatically by this change.
3. In Google Cloud, configure a web OAuth client and a consent screen. During
   testing, add only the approved owner as a Google test user. Add the Supabase
   callback `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback` to the Google
   client's authorized redirect URIs.
4. In Supabase Authentication, enable **Google** with that client ID and secret.
   Disable email/password, anonymous auth, and every other provider. This app
   never requests email passwords or Google's password.
5. Optional but recommended: register `public.leetlove_before_user_created` under
   Authentication → Hooks → Before User Created for a friendly rejection. The
   database insert/session triggers already enforce restrictions independently.
6. Set Supabase's Site URL to `http://127.0.0.1:3010` locally. Add
   `http://127.0.0.1:3010/auth/callback` to its redirect allow list. In production,
   use the real HTTPS domain instead. Do not use wildcard production redirects.
7. Copy `config/studio.env.example` to `.env.local` and set:

   ```dotenv
   SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
   SUPABASE_ANON_KEY=YOUR_PUBLIC_ANON_OR_PUBLISHABLE_KEY
   SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVER_ONLY_SERVICE_ROLE_KEY
   AUTH_SITE_URL=http://127.0.0.1:3010
   LEETLOVE_AUTH_ENABLED=true
   LEETLOVE_WAITLIST_ENABLED=true
   ```

   Use the same values in Vercel environment settings, with the production HTTPS
   URL for `AUTH_SITE_URL`. Keep the service-role key server-only. Never commit
   `.env.local` or paste secret keys into a chat. E2B/Groq are only needed for
   execution/story generation; they are not required for login or the waitlist.
8. Restart the server. Sign in on `/login` with the invited Google identity.

Official references: [Supabase SSR setup](https://supabase.com/docs/guides/auth/server-side/creating-a-client?queryGroups=framework&framework=nextjs),
[Google OAuth](https://supabase.com/docs/guides/auth/social-login/auth-google), and
[before-user-created hook](https://supabase.com/docs/guides/auth/auth-hooks/before-user-created-hook).

## What is enforced

- Supabase SSR handles PKCE and cookie sessions. Next.js `proxy.ts` refreshes and
  checks sessions for private routes. Server layouts repeat authorization at the
  render boundary. Private responses are not cached.
- Existing studio and array APIs independently verify the user and OAuth session,
  including explicit bearer tokens. The old password/signup form has been removed.
- The former direct authenticated read of `solution_jobs` is revoked. Other
  application tables and the waitlist are inaccessible to anon/authenticated roles;
  owner-checked APIs use the server-only service role.
- OAuth initiation and logout are same-origin POSTs. Callback destinations are
  restricted to local learning routes. The callback clears non-owner sessions.
- The waitlist saves normalized email, consent version, and timestamp. It creates
  no Auth user and grants no access. Inserts are server-only, idempotent, and
  rate-limited atomically to 100 attempts per hour overall and 3 per email/hour.
  The API provides the same success response for new and existing entries. The
  form includes a honeypot and requires explicit consent. No email is sent.
- Missing configuration fails closed. Login is disabled; waitlist enrollment never
  claims success until Supabase confirms persistence.

## Verification

`npm test` covers email aliases, verified identity and session policy, redirect
validation, and waitlist validation. It also executes the new SQL migrations in
an embedded PostgreSQL engine against Auth-shaped fixture tables, checking user/
session rejection, revoked grants, duplicate enrollment, and rate limits. This
tests SQL behavior but does not replace a managed Supabase integration check.
`npm run build` checks production routes.

With the local server running:

```powershell
$env:ARRAYS_TEST_URL='http://127.0.0.1:3010'
npx playwright test tests/e2e/auth.spec.ts tests/e2e/landing.spec.ts --workers=1
```

The old array browser journeys now require a real owner browser-state file using
`LEETLOVE_E2E_OWNER_STATE`. They are skipped without that file; no auth bypass was
added for tests. Never commit the state file, which contains session credentials.

Before enabling live access, verify in the configured project:

1. The owner's Google account signs in and can access the workspace and private APIs.
2. A different account fails even when posting the owner's email as its hint.
3. Direct Supabase signup with another email is rejected by the database restriction.
4. Existing non-owner tokens cannot access APIs or read tables directly.
5. A waitlist email is persisted once, repeated enrollment stays private, and limits
   reject excessive attempts. Failed persistence never shows a confirmation.
6. Logout clears access; expired sessions refresh correctly. Production callbacks
   return only to the configured domain and approved local path.

These live checks require the new project and OAuth credentials. They cannot be
certified by the local unit/UI checks or by mocked browser sessions.
