# CEOS Web — Calculadora Universal

Aplicação web do **CEOS — Calculadora Universal**, projeto integrador da Fatec Cotia. Reúne calculadoras de
Matemática, Física e Química com explicação passo a passo, conta de usuário com histórico, favoritos e funções
personalizadas, e um painel para os dispositivos IoT (ESP32) associados à conta.

**Aplicação publicada:** https://ceos-puce.vercel.app/

## Papel no ecossistema CEOS

| Repositório | Função |
|---|---|
| **Ceos (este)** | Interface web (React), hospedada na Vercel |
| [CeosApp](https://github.com/RHU4N/CeosApp) | Aplicativo Android (React Native + Expo) com as mesmas funcionalidades |
| [LoginAPICeos](https://github.com/RHU4N/LoginAPICeos) | Autenticação, histórico, favoritos, funções personalizadas, dispositivos e medições IoT |
| [MathAPI](https://github.com/RHU4N/MathAPI) | Cálculos (API sem estado) |
| [ceos-mensageria](https://github.com/RHU4N/ceos-mensageria) | Ingestão IoT: firmware ESP32/Wokwi, Azure Functions e Queue Storage |

## Funcionalidades

- **12 calculadoras**, todas com cálculo feito pela MathAPI:
  - Matemática: Função (1º e 2º grau), Matrizes, Análise Combinatória, Estatística e Matemática Financeira.
  - Física: Cinemática, Dinâmica, Energia e Ponto de Orvalho.
  - Química: Soluções, Estequiometria e Termoquímica.
- **Explicação dos resultados**: fórmula, substituição e resolução, com números em pt-BR. Os erros de validação
  mostram a mensagem da API (por exemplo, "O intervalo de tempo deve ser diferente de zero.").
- **Conta de usuário**: cadastro, login, logout, edição de perfil e troca de senha.
  - A sessão usa cookies HttpOnly emitidos pela LoginAPICeos; nenhum token fica no `localStorage`.
  - Na Vercel, as chamadas passam pelo proxy `/api/login`, no mesmo domínio da aplicação.
- **Histórico** de cálculos por usuário: listar, excluir item, limpar tudo e exportar em JSON ou CSV.
- **Favoritos** (calculadoras e funções) e **funções personalizadas**: criar, validar, editar, executar e excluir
  fórmulas como `0.5 * m * v^2`.
- **Meu IoT**:
  - associação de dispositivo pelo código `XXXX-XXXX` exibido no ESP32, sem copiar tokens;
  - lista de dispositivos com estado de conexão;
  - painel com temperatura, umidade e pressão, histórico, pedidos de leitura e notificações;
  - opções para desconectar e remover um dispositivo.
- **Ponto de orvalho com dados IoT**: a calculadora pode usar a temperatura e a umidade de uma medição real do
  dispositivo.
- **Acessibilidade**: leitura em voz alta (TTS, hook `useTTS`), `lang="pt-BR"`, textos alternativos nas
  ilustrações e layout responsivo até 360 px.
  - Na homologação de 28/11/2026, o axe-core (WCAG 2 A/AA) não apontou violações nas páginas inicial, catálogo,
    Função e Login.
- **Ilustrações** servidas pela LoginAPICeos a partir de um contêiner privado do Azure Blob Storage.

## Tecnologias

- React 19 com **Create React App** (`react-scripts` 5)
- React Router 7 e Axios
- Bootstrap (via CDN)
- Jest e Testing Library
- Docker com Nginx, para execução em contêiner
- Vercel, para hospedagem

## Arquitetura

```text
Navegador ──► Vercel (build estático do React)
   │            └─ rewrite /api/login/* ──► LoginAPICeos (Azure App Service) ──► MongoDB Atlas / Azure Blob
   └──────────────────────────────────────► MathAPI (Azure App Service)
```

O código segue camadas:

- `domain`: casos de uso e regras de apresentação;
- `infrastructure`: clientes HTTP e repositórios;
- `presentation`: páginas, componentes e IoT.

`src/config/resolveApiConfig.js` valida as URLs das APIs no build. Em build hospedado, recusa `localhost`, HTTP
sem TLS e variáveis com nome de segredo.

## Estrutura de pastas

```text
src/
  config/            resolução e validação das URLs das APIs
  constants/         catálogo das 12 calculadoras
  domain/            casos de uso e regras (inclui pareamento do ponto de orvalho com IoT)
  infrastructure/    clientes da MathAPI e da LoginAPICeos (apiClient, mathApiClient, iotApi)
  presentation/      páginas, componentes, contexto de sessão e módulo IoT
  __tests__/         testes Jest
public/              HTML base e imagens estáticas
scripts/             start/build com validação de configuração e verificações do toolchain
docs/                notas técnicas (migração para Azure, Blob, IoT, auditorias)
```

## Pré-requisitos

- Node.js 22 (ver `.nvmrc`) e npm.
- Acesso às APIs. Para usar as APIs publicadas não é preciso executar nada além deste projeto.

## Instalação e execução local

```bash
git clone https://github.com/RHU4N/Ceos.git
cd Ceos
npm ci
cp .env.example .env    # no PowerShell: Copy-Item .env.example .env
npm start               # http://localhost:3000
```

Variáveis (somente URLs públicas; nunca coloque segredos em `REACT_APP_*`):

| Variável | Uso |
|---|---|
| `REACT_APP_API_MATH_URL` | URL da MathAPI (ex.: `https://mathapi-ceos.azurewebsites.net` ou `http://localhost:8080`) |
| `REACT_APP_API_LOGIN_URL` | URL da LoginAPICeos (ex.: `http://localhost:8081`). Na Vercel, use `/api/login` |

Atenção ao usar `localhost:3000` com a LoginAPICeos local: inclua `http://localhost:3000` em `CORS_ORIGIN` no
`.env` da API. Apontar a Web local para as APIs de produção grava dados reais (histórico, favoritos, IoT).

## Testes e build

```bash
npm run lint                           # ESLint (react-app + regras de testes), sem avisos tolerados
CI=true npm test -- --watchAll=false   # PowerShell: $env:CI="true"; npm test -- --watchAll=false
npm run build                          # exige REACT_APP_API_MATH_URL e REACT_APP_API_LOGIN_URL definidos
```

Em 28/11/2026 foram 100 testes em 23 suítes, todos aprovados. Docker: `docker compose up --build` (detalhes em
[DOCKER.md](DOCKER.md)).

GitHub Actions ativos:

- `CI - ceosFront`: lint, testes, build e smoke do build servido;
- `Docker smoke`;
- `Security - npm audit (ceosFront)`;
- `Security - Snyk (ceosFront)`;
- `CodeQL - Analysis (ceosFront)`.

## Deploy

A Vercel publica automaticamente o branch `main`. Configuração da produção:

- `REACT_APP_API_LOGIN_URL=/api/login`;
- `REACT_APP_API_MATH_URL=https://mathapi-ceos.azurewebsites.net`;
- o rewrite em [`vercel.json`](vercel.json) encaminha `/api/login/*` para `https://loginapi-ceos.azurewebsites.net`.

Histórico da migração: [docs/azure-api-migration.md](docs/azure-api-migration.md). As URLs antigas do Render
foram substituídas pela Azure e não são mais usadas.

## Limitações conhecidas

- A recuperação de senha por e-mail não está disponível, porque a LoginAPICeos não tem essa rota. A troca de
  senha é feita em **Editar perfil**, após o login.
- A página usa o Microsoft Clarity (analytics de terceiros).
- O Create React App não recebe mais atualizações do mantenedor; migrar o build (por exemplo, para Vite) é uma
  evolução futura.

## Links

- Aplicação: https://ceos-puce.vercel.app/
- LoginAPICeos: https://loginapi-ceos.azurewebsites.net/health
- MathAPI: https://mathapi-ceos.azurewebsites.net/
- Aplicativo Android: https://github.com/RHU4N/CeosApp/releases/latest

## Equipe

Projeto Integrador VI — Fatec Cotia:

- Leonardo Torres
- Maurício Maia
- Rhuan Silva
- Vitor Bastos

Outras contribuições pontuais estão no
[histórico de contribuidores](https://github.com/RHU4N/Ceos/graphs/contributors).

Contato: ceoscalculadora.suporte@gmail.com

## Licença

Este repositório não declara licença. Todos os direitos estão reservados aos autores.
