# Auditoria das missões — 12/09/2026

Escopo: catálogo completo de NPCs, comandos de consulta/aceite/entrega/aprovação, persistência, recompensas e continuidade narrativa. Código e banco de produção não foram alterados nesta auditoria. As únicas operações no banco configurado foram consultas de leitura. Simulações de aceite usaram estado em memória.

## Diagnóstico principal confirmado no PostgreSQL

### Aceite quebrado por incompatibilidade de tipos

Em `apps/bot/src/systems/questSystem.js`, `aceitarMissao()` executa:

```sql
UPDATE missoes
SET status = 'ativa', oferecida_em = COALESCE(oferecida_em, datetime('now'))
...
```

O adaptador PostgreSQL converte `datetime('now')` em `CURRENT_TIMESTAMP`. A coluna `oferecida_em` é **TEXT**. O PostgreSQL rejeita os tipos diferentes dentro do `COALESCE`, mesmo quando já há uma oferta gravada. Reproduzido com um SELECT equivalente:

```text
COALESCE types text and timestamp with time zone cannot be matched
```

O UPDATE não acontece; a missão continua disponível. O comando captura o erro e responde com uma mensagem genérica de consulta, escondendo a causa real do aceite.

### Aprovação também quebrada por incompatibilidade de tipos

Em `apps/bot/src/systems/missionProgressService.js`, `concluir()` mistura `CURRENT_TIMESTAMP` com a coluna TEXT `reacao_npc_pendente_em` em um CASE. Reproduzido com SELECT equivalente:

```text
CASE types text and timestamp with time zone cannot be matched
```

Mesmo após superar as exigências de entrega e item cadastrado, a transação de aprovação falha. A transação reverte a tentativa, evitando pagamento parcial nessa rotina.

## Estado encontrado no banco e no catálogo

| Verificação | Resultado |
|---|---:|
| Arquivos de NPCs no catálogo | 72 |
| Missões nesses arquivos | 720 |
| IDs duplicados no catálogo | 0 |
| Arcos principais | 288 |
| Missões desbloqueadas com vínculo de 10% | 72 |
| Missões de 10% acima de Rank C | 0 |
| Missões com XP/Won inválidos no JSON | 0 |
| Missões com item não encontrado pela regra atual de aprovação | 648 |
| Nomes distintos desses itens ausentes | 231 |
| Registros na tabela principal `missoes` | 7 |
| Jogadores com esses registros | 3 |
| Ofertas já marcadas como apresentadas | 4 |
| Missões ativas, em avaliação ou completas nessa tabela | 0 |
| Definições no sistema legado `missions` | 3 |
| Participações no sistema legado `player_missions` | 0 |

As sete missões estão como `disponivel`. As quatro já oferecidas são de Cyrus, Galdera, Heidne e Elrica. Isso é compatível com o aceite falhando antes de salvar a mudança de estado. Não há evidência nesses dados de exclusão de missões já aceitas; não há registros ativos para comprovar perda de progresso.

Entre os sete registros, dois já possuem item que não existe em `itens`: **Bandagens de Emergência**, de Elrica, e **Núcleo de Mana Primordial**, de Galdera. No catálogo completo, o problema atinge 648 definições. A comparação foi feita pela mesma regra da aprovação: nome completo, desconsiderando maiúsculas/minúsculas. Não se deve resolver isso inventando itens ou retirando recompensas silenciosamente.

## Outros problemas confirmados

1. **O fluxo exige uma entrega que o usuário não quer tornar obrigatória.** O ADM só pode aprovar `em_avaliacao`. Para chegar a esse estado, o jogador precisa enviar `!entregar missão ...` com no mínimo 300 palavras. A aprovação direta de uma missão ativa é recusada. Ambos os bloqueios foram reproduzidos isoladamente.
2. **O número do catálogo não é o ID aceito pelo comando.** `!missoes npc ... 5` usa `numero_missao`, mas `!aceitar missão 5` procura o ID da linha em `missoes` ou o título/ID de origem. A missão 5 de Cyrus, por exemplo, está registrada com ID 28. A simulação confirmou a recusa pelo número e o aceite pelo título. As instruções do catálogo sugerem pedir ao NPC para iniciar a missão pelo número, mas a conversa narrativa não faz essa transição de estado.
3. **Múltiplas missões são permitidas no fluxo principal.** Não há limite global de uma missão ativa em `QuestSystem`. O teste em memória aceitou duas ofertas distintas e preservou ambas. O aceite sem título é deliberadamente recusado quando há mais de uma oferta, para não escolher por engano.
4. **O site e o bot mostram catálogos diferentes.** `/api/quests` consulta diretamente todas as linhas. Não exige `oferecida_em`; por isso pode mostrar as três missões ainda não oferecidas. O bot filtra essas missões e impede o aceite.
5. **A sincronização reescreve condições de missões em andamento.** Embora preserve status e progresso, atualiza objetivo, descrição, rank, XP, Won e item de toda missão não completa ao consultar o catálogo. Falta preservar a versão aceita da ficha, ou estabelecer uma migração explícita dessas condições.
6. **A sequência dos arcos não está sendo verificada corretamente.** Os registros guardam `tipo='arco'` e `categoria_missao='principal'`. As condições de oferta e aceite comparam `categoria_missao==='arco'`. As 288 definições de arco têm essa incompatibilidade; a checagem do capítulo anterior pode ser ignorada.
7. **Não existe recompensa de vínculo configurada nas fichas atuais.** Os 720 JSONs têm somente `xp`, `won` e `item` em `recompensas`. A aprovação não altera `npc_relationships`. Mudanças de relacionamento por cenas são outro mecanismo e não equivalem a um prêmio garantido de missão. É necessário definir o ganho na ficha e aplicá-lo uma única vez.
8. **A reação do NPC chega tarde ao contexto da IA.** A narrativa principal é gerada e gravada no histórico antes da consulta às conclusões pendentes. Depois, uma reação separada é anexada à mensagem. Assim, a fala principal pode contradizer a conclusão; a reação anexada também não entra pelo mesmo caminho de memória da narrativa principal.
9. **Existem duas fontes de missão.** `QuestSystem` usa `missoes` e os 720 JSONs; `missionManager` usa `missions/player_missions`. O motor legado, chamado pelo fallback de NPC, pode sugerir missões diferentes e restringe a oferta a uma ativa por NPC. A aprovação atual não conclui registros desse sistema legado.
10. **Identificação e registro administrativo são limitados.** O ADM é verificado por correspondência exata do número; o alvo por nome exato sem normalização de acentos/pontuação. A aprovação não grava o ADM responsável, uma referência da cena aprovada ou data própria da aprovação. São fragilidades verificadas no código, não causas reproduzidas para um jogador específico.
11. **A mensagem de aprovação omite parte dos prêmios.** Mostra XP e Won, mas não detalha item/cristais. Também falta inserir o XP aprovado no histórico específico `experiencia_historico` nessa rotina.

## Preservação e sistemas especiais

As missões ativas, em avaliação e completas não são filtradas por perda de vínculo no fluxo principal. O índice por jogador e missão de origem permite vários registros distintos. A consulta não apaga o progresso, mas uma falha na sincronização pode impedir exibir o catálogo inteiro.

O `missionManager` legado contém `INSERT OR REPLACE` ao iniciar: no SQLite pode reiniciar um registro; no adaptador PostgreSQL vira INSERT simples, sem atualizar conflitos. Não é o caminho de aceite dos sete registros atuais, mas não deve ser usado como substituto sem consolidar os estados.

Quests diárias de atividade são aprovadas por `aprovarAtividade` e registradas como atividades, fora do catálogo principal. Quests de classe avançada usam `QuestSystem.criarMissao()` já ativa; a aprovação da classe atualiza a classe, mas não conclui automaticamente a linha da missão. A integração dessas modalidades precisa preservar suas regras específicas e evitar pagamento duplo. Esta auditoria não executou aprovações reais dessas modalidades.

## Fluxo recomendado para a correção

1. O vínculo habilita uma oferta; o NPC a apresenta na cena e o sistema registra o envio.
2. O jogador aceita a missão por identificador inequívoco ou título. O sistema grava a versão da ficha e mantém todas as outras missões.
3. `!missões` e o site usam o mesmo catálogo, separando oferecidas, ativas e concluídas, com progresso e recompensas completos.
4. A cena ocorre com o ADM. O ADM aprova a missão ativa, indicando jogador, missão e referência da cena, sem exigir um segundo relato de 300 palavras do jogador.
5. Uma transação valida a permissão/estado, registra aprovação e prêmios, concede vínculo configurado e impede duplicação.
6. A próxima conversa recebe a conclusão aprovada no contexto **antes** da geração. O NPC reage, a reação entra na memória e o próximo capítulo só é liberado após cumprir seus requisitos.

Prioridade: corrigir os dois erros SQL; alinhar aprovação direta do ADM; reconciliar os itens das recompensas; unificar consulta e identificação; preservar a ficha aceita; corrigir sequência dos arcos; integrar vínculo e memória narrativa.

Não foram corrigidos código, catálogo ou banco nesta etapa. A auditoria reproduziu as falhas SQL em leitura e os bloqueios de fluxo em memória; não enviou mensagens, aceitou missões de jogadores nem distribuiu recompensas reais.
