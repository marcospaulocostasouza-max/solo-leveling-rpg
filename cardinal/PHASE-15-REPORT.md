# Fase 15 — Cardinal Multimodal Reference Engine

Status: infraestrutura segura concluída e verificada; visão local permanece desativada por compatibilidade.

1. **Provider visual:** `DisabledVisionProvider` é o provider ativo; `VisionProvider` permanece desacoplado por interface (`analyze`/`health`) para futuro modelo local ou externo opt-in.
2. **Qwen atual:** `Qwen3.5-4B-Instruct-GGUF:Q4_K_M`, iniciado em `start-cardinal-model.ps1` com `--no-mmproj`.
3. **mmproj:** não foi instalado, baixado ou ativado. Não há evidência de mmproj compatível no runtime e 4 GB de VRAM não autorizam uma mudança arriscada sem benchmark/decisão explícita.
4. **RAM/VRAM:** nenhum consumo multimodal foi provocado; o estado é `DISABLED`, logo não existe benchmark de visão confiável a reportar.
5. **Fallback:** ingestão retorna uma análise `UNAVAILABLE` com orientação de descrição manual e `CARDINAL_VISION_UNAVAILABLE` no provider, sem afetar o Core.
6. **Ingestion:** aceita somente PNG, JPEG e WEBP após checagem da assinatura binária, limite configurável de tamanho e hash SHA-256.
7. **Classifier/schemas:** enumera tipos visuais e papéis de referência; a estrutura separa `OBSERVED`, `INFERRED`, `RESEARCHED` e `GENERATED`.
8. **Entity resolver/web bridge:** preparados por `reference_id` e provider adapter; identificação e confirmação web não são fingidas enquanto visão estiver desligada.
9. **Inspiração:** `Visual Inspiration Sheet` protege mecânicas: forma/cores/atmosfera podem inspirar Forge/Narrative, mas atributos, slot, raridade e efeito continuam no Knowledge/Forge.
10. **Storage/cache:** `visual_references` em SQLite deduplica por hash, guarda origem/role/análise e limpa EXIF/GPS/instruções de metadata.
11. **Segurança:** tamanho, formato real, hash, metadados, paths implícitos e texto malicioso são tratados como dados; nenhuma instrução de imagem pode mudar policies.
12. **Integrações:** a saída é compatível com Forge, Narrative, World e Developer através da ficha de inspiração; não foi conectado a criação/publicação automática.
13. **Interface/permissões:** não foram expostas em upload público enquanto não existe provider visual real e política de anexos autorizada.
14. **Configuração:** `.env.example` contém `CARDINAL_VISION_ENABLED=false`, provider disabled, limites de imagem, cache e TTL.
15. **Arquivos:** `cardinal/multimodal/index.js`, `cardinal/tests/cardinal-multimodal.test.js`, `CARDINAL_MULTIMODAL_GUIDE.md` e este relatório.
16. **Testes:** formato/limite, metadata, hash/cache, provider mock, separação observado/inferido e fallback.
17. **Verificação:** testes multimodal/web/narrative passaram com **11/11**.

Limitações e riscos: ainda não existe adapter de visão local validado, OCR, ingestão de anexos do bot, biblioteca visual, bridge automática com Web Research nem consumo de imagens externas. Ativar visão exige selecionar modelo+mmproj compatíveis, executar benchmark serializado em resolução limitada e confirmar estabilidade em 4 GB de VRAM. A Fase 16 não foi iniciada.
