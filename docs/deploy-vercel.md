# Implantação do site na Vercel

O projeto Vercel deve usar `apps/site` como Root Directory e permitir a inclusão de arquivos fora dessa pasta no Build Step, pois as rotas importam `packages`, serviços do bot e Cardinal.

O arquivo `apps/site/vercel.json` configura o Install Command para executar `scripts/install-site-deployment.js`. Ele instala com `npm ci` as dependências da raiz e do site, usando os dois lockfiles, e verifica a resolução de `pg`, `sqlite3` e `next` a partir dos arquivos que os importam.

Isso corrige os cinco erros `Module not found` do log da implantação do commit `b3ab64e`: `pg` em `packages/database/postgres.js` e `sqlite3` no banco do bot e nos módulos de conhecimento, memória e mundo do Cardinal. Instalar somente `apps/site` não disponibiliza dependências aos arquivos externos àquela pasta.

Para verificar as instalações existentes sem reinstalar: `node scripts/install-site-deployment.js --check`.

Depois de enviar a correção ao repositório conectado, crie uma implantação do novo commit. Para publicar arquivos locais com a CLI, vincule a raiz do repositório ao projeto Vercel existente, configurado com Root Directory `apps/site`, e execute `npx vercel deploy --prod` na raiz. Não recrie uma implantação do commit antigo esperando incluir arquivos novos.

A correção da instalação não configura o banco de produção nem publica automaticamente o site. Cardinal usa modelo e armazenamento locais; o sucesso do build não demonstra disponibilidade do modelo na Vercel.

## Compatibilidade do binário SQLite

A implantação `5d6a579` instalou corretamente as dependências, mas o binário Linux de `sqlite3@6.0.1` falhou por exigir `GLIBC_2.38`. A dependência da raiz foi fixada em `sqlite3@5.1.7`, junto com o lockfile, para utilizar o binário anterior. O instalador também carrega o módulo nativo, detectando incompatibilidade já na instalação. A confirmação final de compatibilidade deve ser feita no novo deploy Linux da Vercel; um build Windows não comprova essa compatibilidade.
