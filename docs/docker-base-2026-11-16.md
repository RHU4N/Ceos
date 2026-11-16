# Base Docker da entrega A02

O scan Docker Scout da base anterior nginx 1.27 Alpine encontrou 192 regras de vulnerabilidade, incluindo avisos repetidos por pacote. O digest do build anterior foi conferido nos logs do CI. A base estável 1.30.6 Alpine reduziu o relatório para 22 regras; ainda existem resíduos, portanto não se declara imagem livre de CVEs.

Esta alteração afeta somente o runtime da distribuição Docker. A produção atual usa Vercel, sem esta imagem Nginx. O build continua em Node 22; o nginx.conf e o conteúdo da aplicação são preservados. O workflow Docker smoke executa build, inicialização, HTTP 200 em rotas SPA profundas e exclusão de sentinelas sensíveis. Seu resultado deve ser conferido antes do merge.

Referência da versão estável e das correções: https://nginx.org/en/download.html e https://nginx.org/2026.html. Relatórios SARIF e análise por CVE estão no pacote local a02-20261116. Não foi alterada a imagem publicada nem instalado scanner novo.

## Revalidação incremental de 16/11/2026

O branch recebeu a main `54144f9` por merge, mantendo como ancestrais os dois commits originais `f667b66` e `0e334c7`. A proposta agora usa a variante oficial estável `nginx:1.30.6-alpine-slim`, fixada pelo digest multiarch `sha256:e2355aa95529a7999dad94ddcb45a8768abf6fb0b204c93b1a3ffce477d7b893`, e mantém a atualização dos pacotes Alpine. XML/XSLT não são usados pelo servidor estático nem instalados nessa variante; a configuração nginx.conf permanece idêntica. Node 22, as exclusões de arquivos sensíveis e os testes existentes foram preservados.

O argumento público opcional `REACT_APP_SITE_ASSETS_MODE` permite selecionar Blob no build Docker; o default continua local, com o mesmo fallback da aplicação. O build com Azure/Blob passou em 26 verificações reais de imagens e responsividade, sem gravações de domínio. O Docker smoke completo passou para build Node 22, rotas SPA, ausência de source maps e exclusão das sentinelas sensíveis.

O SARIF completo da imagem final com Blob registra **6 regras: 0 críticas, 1 alta, 0 moderadas e 5 baixas**. Não se declara zero alertas. Os cinco baixos dizem respeito a OpenSSL 3.5.9-r0 e permanecem documentados. O único alto é `CVE-2026-107891` em musl 1.2.6-r3: o Scout sugere r6, mas o [secdb oficial Alpine 3.24](https://secdb.alpinelinux.org/v3.24/main.json) e o [APKBUILD oficial da distribuição](https://github.com/alpinelinux/aports/blob/3.24-stable/main/musl/APKBUILD) registram o backport em **1.2.6-r3**. O patch `CVE-2026-107891.patch` integra a receita e seu SHA-512 foi conferido. O pacote instalado foi verificado na imagem. Trata-se de divergência de versão corrigida no scanner; o alerta bruto permanece no SARIF, sem supressão ou desativação do scanner.

O [aviso do mantenedor musl](https://www.openwall.com/lists/musl/2026/10/21/1) descreve overflow ao compilar expressões regulares não confiáveis com `regcomp`. A correção distribuída pelo Alpine é a evidência principal de mitigação; não se baseia somente na hipótese de ausência de uso. Os riscos XML anteriores foram eliminados pela ausência dos pacotes na variante slim, sem substituir o Nginx estável por software sem suporte.

Os logs, SARIFs integrais, digest, pacote exato testado e evidências Blob estão em `branch-cleanup-20261116/incremental` no workspace. O artefato exportado pelo CI também deve ser conferido pelo SHA do PR antes do merge. Qualquer nova alta/moderada sem correção ou mitigação demonstrada bloqueia a integração. Esta imagem continua separada da hospedagem Vercel; o merge normal na main aciona os workflows e a publicação Vercel existente, sem republicar as APIs Azure ou a Function.
