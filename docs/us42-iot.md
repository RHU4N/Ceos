# SCRUM-81 — Meu IoT Web

Rota `/iot`, acessível pelo sino Meu IoT na Navbar autenticada. Usa AuthContext, cookie HttpOnly, React Router e Axios existentes. O provider global permanece montado ao trocar de página e consulta notificações em um único ciclo de 15 s, pausado com a aba oculta.

Gestão, pareamento exibido uma vez, sensores dinâmicos, dashboard por dispositivo, gráficos SVG por unidade, histórico paginado/filtrado, leitura assíncrona e resultado persistido. Pedidos retornam 202 e não bloqueiam outras páginas. Notificações anteriores continuam na lista após reload. Não há promessa de Web Push com navegador fechado.

`REACT_APP_API_LOGIN_URL` continua sendo a única configuração necessária, apontando para Backend compatível. Nenhuma chave de Function, serviço ou dispositivo é mantida no navegador. Token de provisionamento só existe em estado temporário até fechar o painel.

Validação: `CI=true npm test -- --watchAll=false --runInBand` e `CI=true npm run build`. Os testes IoT cobrem gráfico/ausência, cadastro e Provider global com navegação entre rotas. A resolução CommonJS de React Router 7 no Jest foi explicitada, mantendo o Router existente. Corrigidos os avisos de variáveis sem uso em três calculadoras e a atribuição inválida de const na Estequiometria que impediam build CI.

[Arquitetura, contrato, limites, firmware, deploy/rollback e matriz Jira](https://github.com/RHU4N/ceos-mensageria/blob/feat/SCRUM-81-iot-multiusuario/docs/us42-platform.md).
