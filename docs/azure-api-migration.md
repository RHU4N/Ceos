# Migração das APIs para Azure

Na branch `chore/azure-api-migration`, o Preview usa estas variáveis de build:

| Variável | Valor |
| --- | --- |
| `REACT_APP_API_MATH_URL` | `https://mathapi-ceos.azurewebsites.net` |
| `REACT_APP_API_LOGIN_URL` | `/api/login` |

O rewrite de `vercel.json` encaminha `/api/login/:path*` para a LoginAPI Azure. Autenticação, perfil e IoT continuam usando o mesmo cliente com `withCredentials`; JWTs permanecem em cookies HttpOnly. O backend deve permitir a origem HTTPS exata do Preview em `CORS_ORIGINS`, compartilhada com a proteção CSRF, sem curingas. Nenhum segredo deve entrar em variáveis `REACT_APP_*`.

O Create React App incorpora as URLs no build. Alterar variáveis exige um novo build; promover um artefato antigo não substitui seus valores. As variáveis do Preview devem ser restritas a esta branch. A produção só recebe as URLs novas depois dos testes HTTP, CI, MongoDB, IoT, mensageria e navegador no Preview.

## Dependências e validação

As correções das APIs estão nos PRs [MathAPI #15](https://github.com/RHU4N/MathAPI/pull/15) e [LoginAPICeos #14](https://github.com/RHU4N/LoginAPICeos/pull/14). Esta branch preserva as correções de corrida/indisponibilidade de sessão do [Ceos #11](https://github.com/RHU4N/Ceos/pull/11).

Validação local com as URLs acima: `npm ci`, `CI=true npm test -- --watchAll=false --runInBand` e `CI=true npm run build`. A revisão em navegador deve incluir login, cadastro técnico, refresh, logout, cálculos, histórico, favoritos, Meu IoT, dashboard, READ_ONCE e notificações, verificando Network e rejeição de cookies. Sem navegador, a promoção fica bloqueada.

## Rollback coordenado

Antes da migração, a produção usava o commit `e72bc69c6fa181f33bcdb64bfc476e98dcd15ad2` e o deployment `dpl_6NmsaHBtjM5JVEne355XCKA2uxtX`. URLs anteriores: Login `https://loginapiceos.onrender.com` e Math `https://mathapi.onrender.com`; o rewrite anterior apontava para `https://loginapiceos.onrender.com/:path*`.

Se houver regressão após uma promoção, restaure o rewrite e as duas URLs de build em conjunto, gere um novo build de produção e valide login e cálculo. Se a Function também precisar voltar, restaure apenas `CEOS_BACKEND_URL=https://loginapiceos.onrender.com` em `func-ceos-iot-v0kc1f`. Não restaure documentos MongoDB, filas ou credenciais antigas; preserve ownership, medições e notificações. Os dois backends devem consultar a mesma persistência antes de qualquer mudança de destino.
