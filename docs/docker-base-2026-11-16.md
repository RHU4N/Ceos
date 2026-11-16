# Base Docker da entrega A02

O scan Docker Scout da base anterior nginx 1.27 Alpine encontrou 192 regras de vulnerabilidade, incluindo avisos repetidos por pacote. O digest do build anterior foi conferido nos logs do CI. A base estável 1.30.6 Alpine reduziu o relatório para 22 regras; ainda existem resíduos, portanto não se declara imagem livre de CVEs.

Esta alteração afeta somente o runtime da distribuição Docker. A produção atual usa Vercel, sem esta imagem Nginx. O build continua em Node 22; o nginx.conf e o conteúdo da aplicação são preservados. O workflow Docker smoke executa build, inicialização, HTTP 200 em rotas SPA profundas e exclusão de sentinelas sensíveis. Seu resultado deve ser conferido antes do merge.

Referência da versão estável e das correções: https://nginx.org/en/download.html e https://nginx.org/2026.html. Relatórios SARIF e análise por CVE estão no pacote local a02-20261116. Não foi alterada a imagem publicada nem instalado scanner novo.
