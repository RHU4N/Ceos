---
name: ceos-env-audit
description: Audit CEOS environment destinations, CRA public variables and deployment consistency with focused tests and secret-safe output.
---

1. Check branch, SHA, status and applicable AGENTS.md; preserve unrelated work.
2. Use rg to locate process.env references, deployment configuration and relevant workflows. Read matching sections first.
3. Compare variable names and public destinations with authenticated deployment metadata. Report presence only for private settings; never print .env contents, tokens, cookies, connection strings or credentials.
4. CRA uses REACT_APP_API_MATH_URL and REACT_APP_API_LOGIN_URL. REACT_APP_MATH_API_URL is deprecated compatibility. Public prefixes must never contain secrets.
5. Production builds must reject missing API destinations. Keep explicit local settings and development/test defaults. On Vercel, Login uses /api/login with the Azure rewrite; Math uses HTTPS without credentials.
6. Compare Production, Preview, Development and branch overrides separately. Changes affect future builds. Preserve production and legacy projects unless authorized. Validate a general Preview before removing obsolete overrides.
7. Verify HttpOnly session cookies, Login credentials, Math without credentials and minimal account-scoped cache. Check exact CORS/CSRF origins; never loosen them with wildcards.
8. Run focused tests, required full checks and a production build. Inspect artifact paths and sanitized secret scan counts. Use isolated integration databases. Hosted smoke tests must not alter users, history, queues or IoT data.
9. Review Node versions, failing or ignored checks and duplicate deployment triggers. Preserve Git deployment automation. Do not add dependencies or force audit fixes without evidence.
10. Return a short report: confirmed problems, applied fixes, tests, pending work and commits/PRs. Distinguish live configuration from unpublished code.
