# Relatório — Cardinal Core Fase 1

Data da validação: 2026-09-03.

## Arquitetura encontrada

- Bot: Node.js/CommonJS, `whatsapp-web.js`, comandos em `apps/bot/src/commands` e roteamento central em `apps/bot/src/core/commandHandler.js`.
- Banco: PostgreSQL em produção com camada de compatibilidade SQLite em `packages/database`.
- Site: Next.js 16, React 19 e TypeScript em `apps/site`.
- IA existente: Ollama/axios em `apps/bot/src/ia`; fluxo narrativo e memória dos NPCs em `apps/bot/src/ai` e `apps/bot/src/npc`.
- Logs existentes: predominantemente console e logs específicos de subsistemas. O Cardinal usa JSON Lines próprio, sem salvar prompts.

## Cardinal implementado

Fluxo: projeto -> `CardinalClient` -> HTTP OpenAI compatível -> `llama-server` local -> Qwen3.5-4B-Instruct Q4_K_M.

- Endpoint: `http://127.0.0.1:8088`.
- Contexto: 8192 tokens.
- GPU offload inicial: 20 camadas.
- Thinking desativado nas requisições para impedir respostas vazias quando o orçamento de saída é curto.
- Sem ferramentas administrativas, RAG, banco, NPCs, site ou comandos do RPG nesta fase.

## Ambiente e medições

- Windows 11 Enterprise 64-bit.
- CPU Intel Core i5-10400F, 6 núcleos/12 threads.
- RAM instalada: 15,87 GiB.
- GPU NVIDIA GeForce GTX 1650, 4096 MiB de VRAM.
- Runtime testado: llama.cpp build 10516 (`b95502ba9`), CUDA 13.3.
- Modelo existente: `openresearchtools/Qwen3.5-4B-Instruct-GGUF`, Q4_K_M, 2.708.804.384 bytes (aprox. 2,52 GiB).
- Processo aquecido: cerca de 3.948 MiB de working set e 4.099 MiB privados.
- VRAM total observada: cerca de 2.983 MiB de 4.096 MiB.
- Geração observada no log: aproximadamente 10–11 tokens/s.
- Health check: `{"status":"ok"}`.
- Teste em português: aprovado.
- Teste estruturado: JSON válido, 30 tokens em 3,46 s no cliente (8,68 tokens/s incluindo o tempo total da requisição).

## Limitações

- O primeiro teste foi lento porque thinking ainda estava ativo; isso foi corrigido no cliente.
- O servidor informa CORS amplo, porém está ligado exclusivamente a `127.0.0.1`. Não deve ser alterado para `0.0.0.0`.
- Com 4 GB de VRAM, aumentar camadas ou contexto pode causar falta de memória. O padrão conservador deve ser mantido até nova medição.
- Um GGUF IQ4_XS baixado durante o pedido anterior permanece ignorado em `cardinal/models`; não é usado pelo Cardinal desta fase.
