# Ceos Frontend (ceosFront)

Breve descrição
----------------
Frontend da aplicação CEOS — coleção de calculadoras científicas e educacionais (Matemática, Física, Química, etc.). Fornece interfaces para cálculos, histórico de operações, exportação de resultados e acessibilidade (TTS — text-to-speech).

Principais funcionalidades
-------------------------
- Conjunto de páginas para cálculos científicos (Estatística, Dinâmica, Energia, Cinetica, Matemática Financeira, Química, etc.).
- Sistema de histórico (salva operações por usuário, exporta em JSON/CSV, copia/abre entradas).
- Cartões de exemplo/explicação reutilizáveis (componente `ExplanationCard`).
- Acessibilidade: suporte a TTS (hook `useTTS`).

Colaboradores
-------------
- Substitua pelos nomes reais dos integrantes do grupo:
	- João Silva
	- Maria Souza
	- Carlos Pereira

URL pública
-----------
Adicione aqui a URL pública do deploy (ex.: `https://seu-app-onrender.app`).


Observações
-----------
- Atualize `Colaboradores` e `URL pública` com as informações do seu grupo.
- Adapte as instruções de deploy caso você use uma plataforma específica.
- React Icons

## Como executar

1. Clone o repositório
2. Instale as dependências com `npm install`
3. Inicie o projeto com `npm start`

## Autores

Este site foi desenvolvido por:

- Rhuan
- Leonardo
- Mauricio
- Vitor

## Contato

Email de suporte: ceoscalculadora.suporte@gmail.com

Acesse: [https://ceos-puce.vercel.app/](https://ceos-puce.vercel.app/)

Nota: pequena alteração para testar o push.

## Testes e CI

- Testes unitários: Jest (arquivos em `src/__tests__`).
- Performance smoke: `k6` em `tests/perf/k6_test.js` (usado em CI).
- Segurança: Snyk + `npm audit` workflows estão configurados em `.github/workflows/`.
- Deploy: `ceosFront` é configurado para deploy via Vercel (hook opcional no workflow).



