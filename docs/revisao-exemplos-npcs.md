# Revisão dos exemplos de diálogo dos NPCs — 13/09/2026

Esta revisão não altera exemplos, personalidades, regras nem código. Abrange os arquivos de diálogo e cena dos 72 perfis reais em NPC_LORA/dataset (excluindo _TEMPLATE), a estrutura das seções de personalidade/voz e a existência de fontes JSON suplementares de 75 NPCs. A inspeção combina leitura editorial de exemplos representativos de todos os perfis com verificação automatizada do conjunto. Os números de repetições abaixo contam somente falas literalmente repetidas no mesmo arquivo, após uniformizar espaços; não medem toda a redundância semântica. Alertas de tamanho não significam que todo o texto deva ser apagado.

## Opinião

O elenco tem bons conceitos, mas os exemplos ainda não sustentam vozes suficientemente distintas. Há excesso de discurso solene, apresentações ameaçadoras, menções à arma/título e explicações da própria filosofia. Muitos exemplos descrevem o que caracteriza o NPC em vez de mostrar como ele conversaria. A IA recebe vários moldes parecidos e pode reproduzir o molde mesmo quando deveria improvisar uma resposta ao jogador.

## Evidências gerais

- 45 dos 72 arquivos de diálogo possuem falas literalmente repetidas; 95 ocorrências adicionais detectadas.
- 26 perfis usam a mesma abertura de descrição de voz: “Registro: informal e direto, próximo da fala cotidiana.”
- 577,328 palavras no conjunto de diálogos e cenas. Volume não equivale a variedade.

- A seleção de exemplos em narrativeCore separa os textos por `---`, escolhe dois blocos e limita o conteúdo a 1500 caracteres. Muitos arquivos reúnem numerosos diálogos antes do primeiro separador; assim, um assunto encontrado no fim do bloco pode selecionar um bloco cujo começo mostra outro assunto. A truncagem pode cortar a fala e favorecer apresentações repetidas.
- A presença de outro personagem numa conversa não é automaticamente contaminação. O problema é apresentar suas falas sem separar claramente a entrada do interlocutor e a saída esperada do NPC.
- Arquivos com “REVISAR MANUALMENTE” carregam uma nota editorial junto ao exemplo. Há indícios de texto com codificação incorreta em Alexia e Ophilia. Isso merece saneamento antes de interpretar a voz.
- O cabeçalho de Ophilia contém “PERSONALITY REFERENCE”. É texto de instrução em inglês, não prova de que seus diálogos inteiros estejam em inglês. A auditoria não atribui todos os erros de idioma a esse cabeçalho.

## Casos que eu priorizaria

| NPC | Avaliação |
|---|---|
| Ophilia Clement | Melhores exemplos de escuta, hesitação, ações pequenas e falas curtas. A conversa inclui interlocutores, então precisa separar quem disse cada fala. Limpar notas editoriais/codificação e uniformizar o formato. |
| Cyrus Albright | Apenas cerca de 142 palavras de exemplos de diálogo, concentradas em fórmulas e ciência arcana. Precisa de cumprimentos, dúvida simples, discordância, recusa contextual e oferta/reação a missão. |
| Agnea Bristarni | Poucos exemplos, muito centrados em palco e declarações sobre o Povo; há fala de Ochette no arquivo. Faltam respostas cotidianas e atribuição clara de falante. |
| Redeye | Personalidade descreve instinto e ausência de malícia consciente, mas os exemplos incluem apresentação verbal, romance e raciocínio moral. Definir sua capacidade de linguagem pelo cânone e alinhar personalidade, voz e exemplos. |
| Claude | Há muitos rótulos de situação repetidos. Voz pede frases mínimas, enquanto parte do material se alonga em explicações. Manter frieza e concisão sem transformar toda conversa em ameaça. |
| Alexia Song | Identidade está mais coerente, mas tom dos exemplos é bastante cerimonioso para uma voz descrita como informal. Evitar explicações extensas e romance íntimo sem condição de vínculo. |
| Alaune Yeong | Título, linhagem e majestade aparecem em muitas situações; há fragmentos atribuídos a Alaune (Jovem). Separar versões/contextos e variar assuntos sem perder a postura aristocrática. |
| Trish Yamaguchi | Detectadas 30 falas adicionais literalmente repetidas. Limpeza de duplicação deve preceder expansão de exemplos. |
| Alfyn, Tressa e Therion | Primeiras falas já mostram diferenças úteis: acolhimento, entusiasmo comercial e ironia. Preservar essas diferenças, reduzindo a repetição em cenas longas. |
| Harvey, Vanessa, Mattias e demais manipuladores | Distinguir fala pública e pensamento/agenda privada. O NPC não deveria revelar automaticamente sua conspiração num cumprimento. Recusas podem refletir interesse próprio; isso não deve transformá-lo num protetor genérico. |

## Melhorias propostas

1. Um exemplo por situação, com contexto breve, estado do vínculo, entrada do jogador e resposta exclusiva do NPC.
2. Usar personalidade e biografia como fontes de informação, e exemplos como demonstrações curtas de voz. Evitar repetir título, arma ou passado em todas as respostas.
3. Variar comprimento e ritmo por personagem. Conversa casual costuma pedir uma ou duas falas; temas difíceis podem justificar uma cena maior.
4. Condicionar romance, confiança, conhecimento de segredos e lembranças ao estado real da interação.
5. Cobrir pedidos simples, jogador em silêncio, mal-entendido, mudança de assunto, discordância, recusa e missões, além de combate.
6. Retirar duplicações, notas editoriais e fragmentos de outros falantes usados como resposta do NPC. Separar conteúdo em português de metadados/instruções.
7. Selecionar exemplos inteiros por situação, sem cortar uma fala no meio. Depois testar conversas inéditas com todos os NPCs para avaliar fidelidade sem copiar os exemplos.

As verificações atuais de saída ajudam contra cópia literal e alguns padrões de inglês. Elas não resolvem, sozinhas, contradições de voz, interpretação de vínculo ou paráfrases. Não foram executadas 72 conversas novas com o modelo nesta revisão; o resultado é uma auditoria das fontes e da seleção de exemplos.

## Inventário por perfil

“Sem estes alertas” significa apenas que não foram encontrados os padrões medidos, e não certificação de qualidade narrativa.

| Perfil | Palavras em diálogos | Palavras em cenas | Alertas estruturais |
|---|---:|---:|---|
| agnea_bristarni | 233 | 218 | pouco material de diálogo; marcação de revisão no conteúdo |
| alaune_yeong | 1757 | 8768 | 1 repetição(ões) literal(is) de fala; diálogos agrupados em blocos grandes; cenas extensas; revisar repetição e segmentação |
| alexia_song | 1357 | 2480 | diálogos agrupados em blocos grandes; indício de codificação incorreta |
| alfyn_greengrass | 1503 | 7674 | diálogos agrupados em blocos grandes; cenas extensas; revisar repetição e segmentação |
| arcanette | 1598 | 4616 | 1 repetição(ões) literal(is) de fala; diálogos agrupados em blocos grandes |
| bargello_yeon | 1504 | 8502 | 2 repetição(ões) literal(is) de fala; diálogos agrupados em blocos grandes; cenas extensas; revisar repetição e segmentação |
| carinda_moon | 1554 | 8244 | 2 repetição(ões) literal(is) de fala; diálogos agrupados em blocos grandes; cenas extensas; revisar repetição e segmentação |
| castti_florenz | 1238 | 2121 | diálogos agrupados em blocos grandes |
| celsus_park | 1664 | 8583 | 1 repetição(ões) literal(is) de fala; diálogos agrupados em blocos grandes; cenas extensas; revisar repetição e segmentação |
| claude | 2035 | 4007 | 1 repetição(ões) literal(is) de fala |
| cyrus_albright | 142 | 211 | pouco material de diálogo; marcação de revisão no conteúdo |
| darius_kwon | 1589 | 8982 | 2 repetição(ões) literal(is) de fala; diálogos agrupados em blocos grandes; cenas extensas; revisar repetição e segmentação |
| delitia_song | 1288 | 2342 | diálogos agrupados em blocos grandes |
| elrica_edoras | 99 | 244 | pouco material de diálogo |
| eltrix_noh | 1346 | 8276 | 2 repetição(ões) literal(is) de fala; diálogos agrupados em blocos grandes; cenas extensas; revisar repetição e segmentação |
| entidade_mae | 126 | 1683 | pouco material de diálogo; marcação de revisão no conteúdo |
| esperre_jin | 1522 | 8894 | 2 repetição(ões) literal(is) de fala; diálogos agrupados em blocos grandes; cenas extensas; revisar repetição e segmentação |
| galdera | 76 | 118 | pouco material de diálogo |
| gaston_rho | 1948 | 8463 | 2 repetição(ões) literal(is) de fala; diálogos agrupados em blocos grandes; cenas extensas; revisar repetição e segmentação |
| gideon_ma | 1393 | 8553 | 1 repetição(ões) literal(is) de fala; diálogos agrupados em blocos grandes; cenas extensas; revisar repetição e segmentação |
| goodwin_cha | 1546 | 9376 | 2 repetição(ões) literal(is) de fala; diálogos agrupados em blocos grandes; cenas extensas; revisar repetição e segmentação |
| haanit | 2743 | 7759 | 1 repetição(ões) literal(is) de fala; cenas extensas; revisar repetição e segmentação |
| harvey_jeong | 1655 | 4698 | 1 repetição(ões) literal(is) de fala; diálogos agrupados em blocos grandes |
| heidne_ahn | 1409 | 8796 | 2 repetição(ões) literal(is) de fala; diálogos agrupados em blocos grandes; cenas extensas; revisar repetição e segmentação |
| helgenish | 1649 | 5951 | 2 repetição(ões) literal(is) de fala; diálogos agrupados em blocos grandes; cenas extensas; revisar repetição e segmentação |
| hikari_ku | 264 | 314 | pouco material de diálogo; marcação de revisão no conteúdo |
| isla_gwon | 1548 | 8613 | 2 repetição(ões) literal(is) de fala; diálogos agrupados em blocos grandes; cenas extensas; revisar repetição e segmentação |
| kaldena_ryu | 1497 | 3788 | diálogos agrupados em blocos grandes |
| kazan | 1535 | 4281 | 1 repetição(ões) literal(is) de fala; diálogos agrupados em blocos grandes |
| laurana_bae | 2839 | 16305 | 1 repetição(ões) literal(is) de fala; cenas extensas; revisar repetição e segmentação |
| lucia_yeom | 1507 | 10610 | 1 repetição(ões) literal(is) de fala; diálogos agrupados em blocos grandes; cenas extensas; revisar repetição e segmentação |
| ludo_wei | 1460 | 8427 | 2 repetição(ões) literal(is) de fala; diálogos agrupados em blocos grandes; cenas extensas; revisar repetição e segmentação |
| lyblac | 1386 | 7772 | diálogos agrupados em blocos grandes; cenas extensas; revisar repetição e segmentação |
| macy_eun | 1596 | 8772 | 1 repetição(ões) literal(is) de fala; diálogos agrupados em blocos grandes; cenas extensas; revisar repetição e segmentação |
| mattias_cardoso | 1248 | 8491 | 2 repetição(ões) literal(is) de fala; diálogos agrupados em blocos grandes; cenas extensas; revisar repetição e segmentação |
| miguel_bang | 1314 | 8733 | 1 repetição(ões) literal(is) de fala; diálogos agrupados em blocos grandes; cenas extensas; revisar repetição e segmentação |
| mugen_ku | 2986 | 2481 | 1 repetição(ões) literal(is) de fala |
| ochette | 1594 | 2695 | 1 repetição(ões) literal(is) de fala; diálogos agrupados em blocos grandes |
| olberic_eisenberg | 1484 | 8188 | diálogos agrupados em blocos grandes; cenas extensas; revisar repetição e segmentação |
| ophilia_clement | 3775 | 5306 | marcação de revisão no conteúdo; indício de codificação incorreta; cenas extensas; revisar repetição e segmentação |
| ori_choi | 1484 | 2829 | diálogos agrupados em blocos grandes |
| osvald_v_vanstein | 1363 | 8102 | diálogos agrupados em blocos grandes; cenas extensas; revisar repetição e segmentação |
| partitio_yellowil | 1520 | 2419 | diálogos agrupados em blocos grandes |
| petrichor | 1807 | 11231 | 2 repetição(ões) literal(is) de fala; diálogos agrupados em blocos grandes; cenas extensas; revisar repetição e segmentação |
| phenn_doyoung | 1617 | 8680 | 1 repetição(ões) literal(is) de fala; diálogos agrupados em blocos grandes; cenas extensas; revisar repetição e segmentação |
| pius_kang | 1510 | 8873 | 2 repetição(ões) literal(is) de fala; diálogos agrupados em blocos grandes; cenas extensas; revisar repetição e segmentação |
| primrose_azelhart | 1325 | 1508 | diálogos agrupados em blocos grandes |
| redeye | 1287 | 8195 | 2 repetição(ões) literal(is) de fala; diálogos agrupados em blocos grandes; cenas extensas; revisar repetição e segmentação |
| reime_oh | 1285 | 8928 | 1 repetição(ões) literal(is) de fala; diálogos agrupados em blocos grandes; cenas extensas; revisar repetição e segmentação |
| richard_han | 1506 | 2624 | diálogos agrupados em blocos grandes |
| rondo_baek | 1404 | 2580 | diálogos agrupados em blocos grandes |
| rufus_deng | 1452 | 8874 | 2 repetição(ões) literal(is) de fala; diálogos agrupados em blocos grandes; cenas extensas; revisar repetição e segmentação |
| saoirse_ryu | 1375 | 2509 | diálogos agrupados em blocos grandes |
| sazantos_do | 1274 | 8292 | 2 repetição(ões) literal(is) de fala; diálogos agrupados em blocos grandes; cenas extensas; revisar repetição e segmentação |
| simeon_ha | 1625 | 8762 | 1 repetição(ões) literal(is) de fala; diálogos agrupados em blocos grandes; cenas extensas; revisar repetição e segmentação |
| solon_wi | 1611 | 6630 | 2 repetição(ões) literal(is) de fala; diálogos agrupados em blocos grandes; cenas extensas; revisar repetição e segmentação |
| stia_han | 1664 | 2655 | diálogos agrupados em blocos grandes |
| tanzy_woo | 1547 | 5067 | 1 repetição(ões) literal(is) de fala; diálogos agrupados em blocos grandes; cenas extensas; revisar repetição e segmentação |
| tatloch | 1468 | 6263 | 2 repetição(ões) literal(is) de fala; diálogos agrupados em blocos grandes; cenas extensas; revisar repetição e segmentação |
| temenos_mistral | 1629 | 8709 | 1 repetição(ões) literal(is) de fala; diálogos agrupados em blocos grandes; cenas extensas; revisar repetição e segmentação |
| therion | 1560 | 8100 | diálogos agrupados em blocos grandes; cenas extensas; revisar repetição e segmentação |
| throne_anguis | 1694 | 8502 | 2 repetição(ões) literal(is) de fala; diálogos agrupados em blocos grandes; cenas extensas; revisar repetição e segmentação |
| tressa_colzione | 1634 | 12740 | diálogos agrupados em blocos grandes; cenas extensas; revisar repetição e segmentação |
| trish_yamaguchi | 2682 | 12378 | 30 repetição(ões) literal(is) de fala; diálogos agrupados em blocos grandes; cenas extensas; revisar repetição e segmentação |
| trousseau | 1464 | 8509 | 1 repetição(ões) literal(is) de fala; diálogos agrupados em blocos grandes; cenas extensas; revisar repetição e segmentação |
| vanessa_hysel | 1341 | 3951 | 2 repetição(ões) literal(is) de fala; diálogos agrupados em blocos grandes |
| viator_yoon | 1547 | 8777 | 1 repetição(ões) literal(is) de fala; diálogos agrupados em blocos grandes; cenas extensas; revisar repetição e segmentação |
| vide_o_corruptor | 1240 | 7625 | diálogos agrupados em blocos grandes; cenas extensas; revisar repetição e segmentação |
| warden_davids | 1661 | 10674 | 1 repetição(ões) literal(is) de fala; diálogos agrupados em blocos grandes; cenas extensas; revisar repetição e segmentação |
| werner_choi | 1395 | 2567 | diálogos agrupados em blocos grandes |
| xerc_baek | 1305 | 2466 | diálogos agrupados em blocos grandes |
| yvon_baik | 1419 | 15272 | 1 repetição(ões) literal(is) de fala; diálogos agrupados em blocos grandes; cenas extensas; revisar repetição e segmentação |

## Fontes JSON suplementares

Foram lidos os 75 arquivos JSON para conferir a existência de campos de exemplos/cenas; contagens de falas acima pertencem aos arquivos Markdown, que são a fonte principal da pipeline nova.

- agnea_bristarni: sem campos de exemplos/cenas no primeiro nível
- alaune_yeong: sem campos de exemplos/cenas no primeiro nível
- alexia_song: sem campos de exemplos/cenas no primeiro nível
- alfyn_greengrass: sem campos de exemplos/cenas no primeiro nível
- arcanette: sem campos de exemplos/cenas no primeiro nível
- bargello_yeon: sem campos de exemplos/cenas no primeiro nível
- bilac: sem campos de exemplos/cenas no primeiro nível
- carinda_moon: sem campos de exemplos/cenas no primeiro nível
- castti_florenz: sem campos de exemplos/cenas no primeiro nível
- celsus_park: sem campos de exemplos/cenas no primeiro nível
- claude: sem campos de exemplos/cenas no primeiro nível
- cyrus_albright: sem campos de exemplos/cenas no primeiro nível
- darius_kwon: sem campos de exemplos/cenas no primeiro nível
- delitia_song: sem campos de exemplos/cenas no primeiro nível
- elrica_edoras: sem campos de exemplos/cenas no primeiro nível
- eltrix_noh: sem campos de exemplos/cenas no primeiro nível
- entidade_mae: sem campos de exemplos/cenas no primeiro nível
- esperre_jin: sem campos de exemplos/cenas no primeiro nível
- galdera: sem campos de exemplos/cenas no primeiro nível
- gaston_rho: sem campos de exemplos/cenas no primeiro nível
- gideon_ma: sem campos de exemplos/cenas no primeiro nível
- goodwin_cha: sem campos de exemplos/cenas no primeiro nível
- haanit: sem campos de exemplos/cenas no primeiro nível
- harvey_jeong: sem campos de exemplos/cenas no primeiro nível
- heidne_ahn: sem campos de exemplos/cenas no primeiro nível
- helgenish: sem campos de exemplos/cenas no primeiro nível
- hikari_ku: sem campos de exemplos/cenas no primeiro nível
- isla_gwon: sem campos de exemplos/cenas no primeiro nível
- kaldena_ryu: sem campos de exemplos/cenas no primeiro nível
- kazan: sem campos de exemplos/cenas no primeiro nível
- laurana_bae: sem campos de exemplos/cenas no primeiro nível
- lucia_yeom: sem campos de exemplos/cenas no primeiro nível
- ludo_wei: sem campos de exemplos/cenas no primeiro nível
- lyblac: sem campos de exemplos/cenas no primeiro nível
- macy_eun: sem campos de exemplos/cenas no primeiro nível
- mattias_cardoso: sem campos de exemplos/cenas no primeiro nível
- miguel_bang: sem campos de exemplos/cenas no primeiro nível
- mugen_ku: sem campos de exemplos/cenas no primeiro nível
- ochette: sem campos de exemplos/cenas no primeiro nível
- olberic_eisenberg: sem campos de exemplos/cenas no primeiro nível
- ophilia: sem campos de exemplos/cenas no primeiro nível
- ophilia_clement: sem campos de exemplos/cenas no primeiro nível
- ori_choi: sem campos de exemplos/cenas no primeiro nível
- osvald_v_vanstein: sem campos de exemplos/cenas no primeiro nível
- partitio_yellowil: sem campos de exemplos/cenas no primeiro nível
- petrichor: sem campos de exemplos/cenas no primeiro nível
- phenn_doyoung: sem campos de exemplos/cenas no primeiro nível
- pius_kang: sem campos de exemplos/cenas no primeiro nível
- primrose_azelhart: sem campos de exemplos/cenas no primeiro nível
- redeye: sem campos de exemplos/cenas no primeiro nível
- reime_oh: sem campos de exemplos/cenas no primeiro nível
- richard_han: sem campos de exemplos/cenas no primeiro nível
- rondo_baek: sem campos de exemplos/cenas no primeiro nível
- rufus_deng: sem campos de exemplos/cenas no primeiro nível
- saoirse_ryu: sem campos de exemplos/cenas no primeiro nível
- sazantos_do: sem campos de exemplos/cenas no primeiro nível
- simeon_ha: sem campos de exemplos/cenas no primeiro nível
- solon_wi: sem campos de exemplos/cenas no primeiro nível
- stia_han: sem campos de exemplos/cenas no primeiro nível
- tanzy_woo: sem campos de exemplos/cenas no primeiro nível
- tatloch: sem campos de exemplos/cenas no primeiro nível
- temenos_mistral: sem campos de exemplos/cenas no primeiro nível
- therion: sem campos de exemplos/cenas no primeiro nível
- throne_anguis: sem campos de exemplos/cenas no primeiro nível
- tressa_colzione: sem campos de exemplos/cenas no primeiro nível
- trish_yamaguchi: sem campos de exemplos/cenas no primeiro nível
- trousseau: sem campos de exemplos/cenas no primeiro nível
- vanessa_hysel: sem campos de exemplos/cenas no primeiro nível
- viator_yoon: sem campos de exemplos/cenas no primeiro nível
- vide_o_corruptor: sem campos de exemplos/cenas no primeiro nível
- vysache: sem campos de exemplos/cenas no primeiro nível
- warden_davids: sem campos de exemplos/cenas no primeiro nível
- werner_choi: sem campos de exemplos/cenas no primeiro nível
- xerc_baek: sem campos de exemplos/cenas no primeiro nível
- yvon_baik: sem campos de exemplos/cenas no primeiro nível
