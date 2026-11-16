# Integração de imagens A02

REACT_APP_SITE_ASSETS_MODE=azure ativa o carregamento das ilustrações pelo gateway /assets/site da LoginAPI, usando loginApiUrl e o proxy Vercel existente. Sem essa configuração o comportamento anterior é preservado. Em erro de imagem há fallback para o mesmo arquivo local, sem alteração de identidade visual ou dimensões.

As imagens já existentes foram mantidas. Nenhuma chave, connection string ou SAS entra no React. O container Azure permanece privado e o backend permite somente nomes predefinidos. Antes de ativar a configuração em Preview/Production, publicar e validar o PR do backend, sua identidade gerenciada e o RBAC mínimo no container ceos-files.

POC realizada com build React e gateway locais acessando o Blob Azure real: 12 imagens com hashes iguais aos arquivos do site e 28 verificações de navegador aprovadas em desktop/tablet/mobile. Essa evidência não significa que o frontend de produção já usa Blob. A ativação exige aprovação de publicação e validação do gateway publicado. Nenhuma mudança nos destinos das APIs ou nas cores/fontes foi feita.
