# Ceos

- Create React App; use REACT_APP_API_LOGIN_URL and REACT_APP_API_MATH_URL. The legacy Math name is compatibility only.
- Vercel Login uses /api/login and the Azure rewrite. Math uses HTTPS without credentials. Production builds require both variables.
- Node 22 matches Vercel, CI and Docker. Use npm ci; npm test -- --watchAll=false --runInBand; npm run build with explicit public API destinations.
- JWT stays in HttpOnly cookies. Browser cache contains only owner ID and optional history; never cache tokens or full profiles.
- Compare Development, Preview and Production separately; validate a new Preview before removing old overrides. Preserve ceos-b.
- Use rg and targeted reads/tests, then full validation. Keep output bounded, reuse findings and avoid simple-task subagents.
- Never print .env, credentials, cookies or private payloads. Do not publish .vercel state, secrets or source maps.
- Reusable environment workflow: .agents/skills/ceos-env-audit/SKILL.md.
