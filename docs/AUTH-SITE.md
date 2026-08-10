# Autenticacao do site via `!site`

## Fluxo

1. O jogador envia `!site` em conversa privada.
2. O bot localiza `jogadores.numero` no PostgreSQL e gera 32 bytes criptograficamente seguros.
3. Apenas o SHA-256 do token e salvo em `site_login_tokens`, com jogador associado, criacao e expiracao de 10 minutos.
4. O bot envia `SITE_URL/auth/token/<token>` em privado. O token nunca e registrado em log.
5. A pagina de token envia o valor para `POST /api/auth/consume` e o servidor calcula o hash.
6. Um `UPDATE ... WHERE used_at IS NULL AND expires_at > agora RETURNING player_id` consome o token atomicamente. Reuso, expiracao e concorrencia falham.
7. O servidor cria `site_sessions` com ID aleatorio, expiracao de sete dias e cookie `slrpg_session` httpOnly, SameSite=Lax e Secure em producao.
8. `/personagem` exige sessao; as rotas de API resolvem o jogador apenas pelo ID da sessao. Nenhuma rota aceita `player_id` do navegador.
9. `POST /api/auth/logout` revoga a sessao e expira o cookie.

## Variaveis de ambiente

```env
DATABASE_PROVIDER=postgres
DATABASE_URL_SERVERLESS=... # apenas servidor; nunca NEXT_PUBLIC_
SITE_URL=http://localhost:3000
```

Em producao, defina `SITE_URL` para a URL HTTPS da Vercel. A URL e configurada localmente por `npm run site:configure-url`.

## Testes executados

- `npm run test:site-auth`: criou um token para jogador existente, confirmou o jogador retornado, recusou reuso e recusou token expirado.
- `npm --prefix apps/site run build`: compilou `/auth/token/[token]`, `/personagem`, `/api/auth/consume` e `/api/auth/logout`.
- `/personagem` redireciona sem sessao pelo guard server-side; parametros de URL nao participam da resolucao do jogador.

## Arquivos principais

- `apps/bot/src/commands/site.js`
- `apps/site/lib/auth-token.ts`
- `apps/site/lib/session.ts`
- `apps/site/app/auth/token/[token]/page.tsx`
- `apps/site/app/personagem/page.tsx`
- `apps/site/app/api/auth/consume/route.ts`
- `apps/site/app/api/auth/logout/route.ts`

Nenhuma publicacao foi realizada.
