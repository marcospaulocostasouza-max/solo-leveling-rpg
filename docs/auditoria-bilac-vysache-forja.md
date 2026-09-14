# Auditoria de Bilac, Vysache e forja — 14/09/2026

## Correções aplicadas após a auditoria

- Novo `forjaTransactionService`: pagamento, consumo, criação, inventário, afinidade, histórico e conclusão da sessão na mesma transação. Travamento do jogador serializa confirmações; sessões concluídas não podem ser reutilizadas. O custo é comparado com o orçamento apresentado.
- Forja Nacional consome seu direito na mesma transação; falhas revertem todos os efeitos.
- Bilac escolhe entre receitas locais que correspondem aos slots com capacidade livre, considerando exclusão entre Arma 1 e Arma 2. Sem receita compatível, pede novos materiais ou liberação de slot. A disponibilidade é novamente conferida ao confirmar.
- Material é conferido por nome canônico e categoria de ingrediente, nunca por conteúdo do nome de uma arma. Equipados são excluídos. Núcleos antigos por rank correspondem às cores do catálogo.
- 36 ingredientes faltantes foram cadastrados; os 38 ingredientes oficiais foram conciliados e seus preços sincronizados. Catálogo de compra do bot também usa a fonte da forja. A integração é repetida de forma idempotente ao abrir a oficina em outro ambiente.
- Cada encomenda cria seu registro com atributos persistidos e identificação do ferreiro, sem reutilizar uma versão incompatível pelo nome. Preço de revenda deriva do custo pago.
- Parser rejeita zero, negativos e texto não numérico e soma linhas repetidas. Detector aceita ficha compacta. Sessão em banco passa a ser a fonte de verdade.
- Molduras aplicadas aos comandos da oficina; cabeçalhos e bônus indicam o ferreiro correto. Perfil antigo de Vysache alinhado à especialidade atual. Lista de alternativas limitada a dez para evitar mensagens enormes.
- O texto do efeito Nacional distingue os atributos fixos dos efeitos adicionais sujeitos a validação narrativa; não anuncia aplicação automática inexistente.

Validação: testes de confirmação simultânea, reversão integral após falha, equipamento excluído, slot bloqueado e Forja Nacional única. Uma forja completa foi validada no PostgreSQL real dentro de transação desfeita ao final, sem conceder item nem consumir recursos permanentemente. Conversas reais com Ollama e o ciclo completo de mensagens no WhatsApp ainda exigem teste após reiniciar o bot.

Revisão de comandos, reconhecimento de materiais, sessões, catálogo, economia, inventário, afinidade, Forja Nacional e dados dos NPCs. Consultas ao PostgreSQL e reproduções de funções sem concluir encomendas reais. Não foi realizada uma conversa com Ollama nem uma forja com cobrança real. O bot está ativo; contagens de sessões são uma fotografia do momento.

## Regras encontradas

Bilac: Rank E a B, bônus de 10% em itens do catálogo, custo base. Vysache: Rank A e S, bônus de 30%, custo multiplicado por 1,5. Desconto por afinidade de até 30%; cada forja comum aumenta afinidade de oficina em 1%. Vysache libera uma Forja Nacional ao passar de menos de 100% para 100%; custo nacional de 500.000 Won.

O catálogo possui 3.968 ligas e 1.536 receitas com núcleo, totalizando 5.504 receitas. Distribuição: E 24; D 88; C 704; B 1.160; A 752; S 2.776. São 32 materiais e seis cores de núcleo. Receitas não equivalem a itens já cadastrados.

## Falhas prioritárias

1. **Forja não é uma transação única.** `executarForja` debita Won, depois consome materiais, depois cria/entrega o item e depois atualiza afinidade e histórico. Reembolsos são compensações separadas e seus resultados não são conferidos. Uma interrupção pode deixar estado parcial. A sessão é encerrada posteriormente pelo comando. Solução: travar jogador e sessão e executar todas as alterações em uma transação.
2. **Confirmação concorrente pode repetir a encomenda.** Não existe consumo atômico da sessão nem identificador único de execução por sessão. Duas mensagens `!pode sim` podem encontrar a mesma etapa válida. Solução: confirmar exclusivamente a sessão apresentada e marcá-la concluída na mesma transação da entrega.
3. **Material pode ser um equipamento.** `itemCorrespondeAoMaterial('Espada de Ferro','Ferro')` retorna verdadeiro. A reserva lê qualquer item do inventário e não verifica categoria nem equipamento. Pode consumir uma arma e até item equipado como ingrediente. Solução: referências de materiais por ID/tipo, exclusão de equipados e validação também na retirada.
4. **Catálogo não integrado aos materiais do banco.** 27 dos 32 materiais não têm sequer correspondência nominal pelo reconhecedor atual: Cobre, Ouro, Arenito, Malaquita, Jade, Mithril, Adamantium, Oricalco, Aço Rúnico, Vidro de Dragão, Ébano, Mármore Negro, Gelo Verdadeiro, Hexita, Cristais Elementais, Cristais da Natureza, Cristais Espirituais, Tadenita, Eternium, Teixo, Grande Macieira, Madeira de Lei, Árvore Mallorn, Madeira de Bosmeri, Cerne, Yggdrasil e Árvore do Tesouro Adão. As cinco correspondências restantes não comprovam que sejam materiais válidos, devido à comparação abrangente. Solução: conciliar loja, catálogo e banco com IDs oficiais; conciliar núcleos por rank/cor, pois o inventário também usa nomes como `Nucleo de Monstro Rank C`.
5. **Item entregue pode divergir do anunciado.** `criarItemNoBanco` reutiliza o primeiro item de mesmo nome sem comparar rank, bônus, categoria ou origem. A mensagem mostra `dadosItem`, não a entidade reutilizada. Uma versão gerada por Bilac pode ser reutilizada por Vysache sem os 30% anunciados. Solução: identidade por receita, ferreiro e versão de atributos; mostrar os valores realmente persistidos.
6. **Forja Nacional vulnerável a concorrência e falha.** Disponibilidade é consultada antes da cobrança e consumida apenas após criar o item. Falha lançada na criação não passa pelo reembolso que só trata retorno vazio. Solução: reservar/consumir o direito nacional junto com pagamento e entrega na mesma transação.

## Fluxo e interpretação de materiais

- Sessões em memória têm prioridade sobre o banco em `obterSessao` e no reconhecedor. Encaminhamento, reinício e confirmação paralela podem trabalhar com etapa ou ferreiro antigos. Usar o banco como fonte de verdade.
- `executarForja` não confere o ID da sessão, etapa, propriedade da receita nem custo previamente apresentado. O preço é recalculado com a afinidade atual. Vincular execução ao orçamento confirmado; mudança relevante deve gerar nova confirmação.
- `parsearMateriais` transforma quantidade zero em um (`parseInt(valor) || 1`), aceita texto parcialmente numérico e sobrescreve material repetido. Reproduzido: `Material: Ferro / Quantidade: 0` resulta em `{ Ferro: 1 }`. Rejeitar valores inválidos e definir soma explícita de linhas repetidas.
- O parser aceita formato compacto `Ferro: 2`, mas o detector exige `material:` e `quantidade:`; esse formato não chega à análise no fluxo normal. Unificar detector e parser.
- A escolha entre várias receitas é automática: maior rank e primeira receita encontrada nesse rank. O jogador não seleciona entre as alternativas. Isso pode encaminhar ao outro ferreiro apesar de haver opção local. Exibir alternativas e confirmar receita/custo específicos.
- A recuperação da sessão persistida após reinício existe, mas só quando não existe sessão em memória.

## NPCs e apresentação

- A personalidade atual de Bilac é coerente com aprendiz enérgico, curioso e orgulhoso; encaminha A/S ao pai. Vysache é direto, exigente, reservado e respeita dedicação. Esses traços estão descritos nos JSONs atuais; fidelidade das respostas reais requer teste com a IA.
- `database/npc_vysache.json` ainda declara especialidade E a S, contradizendo o perfil atual e o bloqueio operacional A/S. Consolidar a fonte canônica.
- O reconhecedor emite erros com o nome Vysache mesmo durante sessão de Bilac. O comando de ficha de Bilac usa título fixo `FICHA DE VYSACHE`. Corrigir os nomes dinâmicos.
- As mensagens da oficina são enviadas diretamente e não usam `formatarMensagem`. Portanto, a moldura narrativa não cobre esses comandos. Aplicar o cabeçalho comum às falas da oficina.
- Afinidade de oficina (`npc_afinidade`) é distinta da relação narrativa. O menu deveria identificar a afinidade usada para descontos e Forja Nacional, para não prometer desbloqueio com vínculo de conversa.

## Bônus, slots e histórico

- O caminho de catálogo multiplica atributos por 1,1/1,3 e arredonda para baixo. O caminho genérico não aplica esses multiplicadores. Unificar ou explicar a diferença.
- A Forja Nacional chama categoria preferida de “proficiência”, mas a deduz da classe e escolhe uma categoria, não o estilo/arma da ficha. A promessa de 40% de proficiência não garante arma compatível com o jogador.
- O efeito nacional anuncia +50% de poder total e regeneração. O cadastro contém atributos fixos; esta auditoria não encontrou aplicação desses efeitos no fluxo da forja. Distinguir efeito narrativo de bônus automático e integrar onde aplicável.
- Itens novos da forja não recebem `preco`/`valor`; podem ficar sem valor de revenda. Definir política de preço explicitamente.
- Colunas de bônus existem no banco e são lidas pelo inventário. As categorias do catálogo correspondem aos slots conhecidos. Entrega real completa ainda precisa de teste após as correções.
- Histórico trata falha como retorno `false`, mas a execução ignora esse resultado. Afinidade e histórico não são registrados junto com a entrega em uma única transação.

## Verificação e limites

No primeiro levantamento, havia 12 sessões e nenhum registro em `npc_afinidade` ou `forja_historico`. Isso não prova ausência de forjas em outros ambientes nem identifica a causa de uma falha específica. Não há testes dedicados deste fluxo em `apps/bot/tests`; o Forge do Cardinal é outro sistema. As reproduções confirmaram conversão indevida de zero em um e aceitação de equipamento como material. Nenhuma encomenda foi concluída para esta auditoria.

Prioridade recomendada: integração de materiais e núcleos; execução atômica por sessão; Forja Nacional; identidade dos itens e valores persistidos; parser/seleção; fontes dos NPCs e molduras; testes de entrega, saldo insuficiente, reinício, encaminhamento e confirmação simultânea.
