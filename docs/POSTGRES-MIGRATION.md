# Migração para PostgreSQL/Supabase

## Estado atual

SQLite continua a fonte ativa até a migração e verificação concluírem. O backup e hash estão em
`backups/database/MIGRATION-METADATA.md`.

## Execução

Com `DATABASE_URL` disponível apenas no ambiente local/server-side, os scripts carregam `.env`
com `dotenv` sem imprimir o valor. Para serverless, `DATABASE_URL_SERVERLESS` tem precedência no
cliente PostgreSQL e deve apontar para o pooler apropriado:

```powershell
npm run db:audit
npm run db:migrate
npm run db:verify
```

O migrador abre SQLite em modo somente leitura, cria tabelas PostgreSQL compatíveis, preserva IDs
e valores, não executa `DELETE` e usa `migration_history` para evitar repetição. Não revele a URL
nem use `NEXT_PUBLIC_DATABASE_URL`.

## Rollback

Enquanto o provider PostgreSQL não for validado, mantenha SQLite. O backup não deve ser alterado.
Se um teste PostgreSQL falhar, corrija a migration e rode a verificação; não substitua o arquivo
SQLite por dados externos.
