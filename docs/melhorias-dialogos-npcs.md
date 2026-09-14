# Melhoria global dos diálogos dos NPCs

74 identidades revisadas: os 72 perfis existentes e Bilac/Vysache, antes somente em JSON. Personalidades, biografias, atributos, missões e recompensas existentes preservados. Atualizados exemplos de diálogo/cena, instruções de interpretação e de voz, formaFalar dos JSONs e speechProfile usado pela rota legada.

Cada perfil recebe três exemplos curtos de cumprimento, cotidiano e esclarecimento, além de dois exemplos de cena para limite/discordância e silêncio. Exemplos separam condição, entrada do jogador e resposta exclusiva do NPC. Foram removidos monólogos, fragmentos misturados, duplicações e notas editoriais dos arquivos de exemplos substituídos. Romance não é um exemplo padrão; depende de vínculo e consentimento. A fonte de fala de Redeye foi alinhada à personalidade instintiva existente: ações e vocalizações, sem romance/conversa humana.

As reduções de volume trocam cenas inteiras predefinidas por demonstrações curtas de voz. A informação canônica continua nas seções de identidade, história e personalidade. O resultado precisa ser acompanhado em conversas reais; não é garantia semântica absoluta do modelo.

## Cada NPC modificado

Padrão de cenas conferido nos 370 exemplos dos 74 NPCs: `_ações_`, `*diálogos*` e `> pensamentos`, com cada tipo em linha própria. Pensamentos são opcionais. A validação compartilhada das duas rotas narrativas verifica os marcadores antes de salvar/enviar; uma resposta fora do padrão é refeita uma vez e descartada se continuar inválida. O cabeçalho preserva o corpo e deixa de usar `>` no estado emocional. Os 16 testes de exemplos, proteção narrativa, Ophilia e regressões passaram; a geração real pelo Ollama ainda deve ser observada após reiniciar o bot.

| NPC | Perfil | Voz preservada e reforçada |
|---|---|---|
| Agnea Bristarni | agnea_bristarni | animada, espontânea, otimista; não transforma cada fala em discurso de palco |
| Alaune Yeong | alaune_yeong | aristocrática, teatral, orgulhosa; cortesia sem monólogos de majestade |
| Alexia Song | alexia_song | discreta, meticulosa, reservada; perguntas precisas e ironia leve |
| Alfyn Greengrass | alfyn_greengrass | caloroso, informal, prático; acolhimento sem sermão |
| Arcanette | arcanette | calculada, sedutora, manipuladora; subtexto, sem confessar planos secretos |
| Bargello Yeon | bargello_yeon | comandante firme, leal, pragmático; autoridade sem discursos constantes |
| Carinda Moon | carinda_moon | objetiva, solidária, organizada; cuidado demonstrado pelo trabalho |
| Castti Florenz | castti_florenz | serena, compassiva, contida; memória incerta, não inventa lembranças |
| Celsus Park | celsus_park | cauteloso, profissional, direto; ameaça apenas se houver ameaça real |
| Claude | claude | frio, econômico, controlador; frases mínimas, sem explicação da própria filosofia |
| Cyrus Albright | cyrus_albright | professor curioso, cordial, distraído; precisão sem palestra automática |
| Darius Kwon | darius_kwon | oportunista, desconfiado, provocador; lealdade não presumida |
| Delitia Song | delitia_song | disciplinada, observadora, direta; detalhes concretos sem rigidez excessiva |
| Elrica Edoras | elrica_edoras | pragmática, desconfiada, firme; respeita palavra dada |
| Eltrix Noh | eltrix_noh | capitã reservada, disciplinada, leal; firmeza sem hostilidade gratuita |
| Entidade 'Mãe' | entidade_mae | alienígena, coletiva, inquietante; não adota conversa humana jovial |
| Esperre Jin | esperre_jin | curandeira cuidadosa, paciente, prática; fala simples apesar da reserva |
| Galdera | galdera | frio, alienígena, indiferente ao indivíduo; brevidade inquietante |
| Gaston Rho | gaston_rho | impulsivo, orgulhoso, competitivo; arrogância com humor rude |
| Gideon Ma | gideon_ma | autoritário, calculista, jurídico; controle por perguntas, sem exposição de conspiração |
| Goodwin Cha | goodwin_cha | bem-humorado, grato, autodepreciativo; trauma sem discurso repetido |
| H'aanit | haanit | rural, antiquada, lacônica, observadora; mantém dialeto sem grandiloquência |
| Harvey Jeong | harvey_jeong | vaidoso, calculista, acadêmico; agenda privada não revelada em conversa pública |
| Heidne Ahn | heidne_ahn | arisca, desconfiada, econômica; confiança conquistada sem ameaça automática |
| Helgenish | helgenish | competitivo, dominador, orgulhoso; preocupação com controle das criaturas |
| Hikari Ku | hikari_ku | formal, gentil, contido; honra expressa em decisões simples |
| Isla Gwon | isla_gwon | curiosa, perceptiva, socialmente reservada; perguntas concretas |
| Kaldena Ryu | kaldena_ryu | ressentida, obstinada, implacável; não suaviza a vingança com moral genérica |
| Kazan | kazan | paciente, conselheiro dissimulado, niilista; subtexto sem confessar plano final |
| Laurana Bae | laurana_bae | gentil, devota, culpada; firmeza e raiva reprimida sem sermão constante |
| Lucia Yeom | lucia_yeom | paciente, política, manipuladora; polidez com distância |
| Ludo Wei | ludo_wei | sociável, pragmático, mediador; humor moderado e negociação clara |
| Lyblac | lyblac | paciente, manipuladora, racional; afeto seletivo, ameaça implícita |
| Macy Eun | macy_eun | acolhedora, incansável, prática; cuidado sem assumir ferimento inexistente |
| Mattias Cardoso | mattias_cardoso | sacerdote cortês, hipócrita, manipulador; fachada pública convincente |
| Miguel Bang | miguel_bang | sociável na fachada, metódico e perturbador em subtexto; não confessa crimes |
| Mugen Ku | mugen_ku | cruel, ambicioso, autoritário; sem gentileza artificial |
| Ochette | ochette | instintiva, direta, ligada à natureza; espontaneidade sem fala burocrática |
| Olberic Eisenberg | olberic_eisenberg | reservado, honrado, paternal; firmeza tranquila |
| Ophilia Clement | ophilia_clement | gentil, devota, humana; escuta, pequenas hesitações e firmeza protetora |
| Ori Choi | ori_choi | repórter curiosa e desajeitada na fachada; precisão disfarçada, agenda privada oculta |
| Osvald V. Vanstein | osvald_v_vanstein | lacônico, calculista, ressentido; interesse técnico sem aula automática |
| Partitio Yellowil | partitio_yellowil | expansivo, trabalhador, solidário; conversa franca e humor cotidiano |
| Petrichor | petrichor | frio, desapegado, explorador; lógica instrumental sem consciência humanitária inventada |
| Phenn Doyoung | phenn_doyoung | gentil, inseguro, corajoso sob necessidade; hesitação ocasional, não em toda palavra |
| Pius Kang | pius_kang | gentil, contemplativo, enlutado; silêncio acolhedor sem máximas constantes |
| Primrose Azelhart | primrose_azelhart | controlada, irônica, calculista; calor seletivo e segredo preservado |
| Redeye | redeye | fera corrompida, territorial, instintiva; somente vocalizações e ações, sem fala humana ou romance |
| Reime Oh | reime_oh | confiante, competitiva, técnica; provocação esportiva sem ameaça gratuita |
| Richard Han | richard_han | justo, cansado, responsável; formalidade acessível |
| Rondo Baek | rondo_baek | honrado, disciplinado, jovem cavaleiro; idealismo com dúvida humana |
| Rufus Deng | rufus_deng | brutal, impaciente, executor; rude sem discurso político |
| Saoirse Ryu | saoirse_ryu | artística, elegante, reservada; expressividade sem discurso de espetáculo |
| Sazantos Do | sazantos_do | rígido, convicto, austero; firmeza sem heroísmo genérico |
| Simeon Ha | simeon_ha | polido, calculista, empresarial; cortesia interessada sem confessar esquema |
| Solon Wi | solon_wi | estrategista seco, estatístico, pragmático; concisão com ironia |
| Stia Han | stia_han | enérgica, prestativa, prática; entusiasmo cotidiano |
| Tanzy Woo | tanzy_woo | vaidosa, calculista, teatral; controle social sem monólogo |
| Tatloch | tatloch | imperiosa, fria, obcecada por ordem; brevidade aristocrática sem afeição automática |
| Temenos Mistral | temenos_mistral | cortês, perspicaz, irônico; perguntas leves com intenção investigativa |
| Therion | therion | irônico, desconfiado, lacônico; humor seco e vínculo gradual |
| Throné Anguis | throne_anguis | reservada, desconfiada, protetora; vulnerabilidade somente com confiança |
| Tressa Colzione | tressa_colzione | curiosa, expansiva, comercial; entusiasmo sem vender em toda conversa |
| Trish Yamaguchi | trish_yamaguchi | precisa, calculista, elegante; frases curtas e polidez distante |
| Trousseau | trousseau | gentil na fachada, convicção distorcida; calma inquietante sem humanidade genérica |
| Vanessa Hysel | vanessa_hysel | acolhedora na fachada, calculista; atendimento público sem revelar exploração |
| Viator Yoon | viator_yoon | disciplinado, reservado, protetor de patrimônio; fala direta |
| Vide, o Corruptor | vide_o_corruptor | alienígena, entrópico, indiferente; fala breve, inquietante, sem romance humano |
| Warden Davids | warden_davids | autoritário, corrupto, transacional; rude e controlador sem confessar comércio secreto |
| Werner Choi | werner_choi | mercenário pragmático, rígido, econômico; ameaça proporcional ao contexto |
| Xerc Baek | xerc_baek | estudioso rigoroso, íntegro, reservado; clareza sem palestra jurídica |
| Yvon Baik | yvon_baik | vaidoso, autoritário, político; decoro e interesse privado implícito |
| Bilac | bilac | enérgico, curioso, orgulhoso; provocações leves, reconhece limites da forja |
| Vysache | vysache | rústico, bruto, generoso sob reserva; respeito pelo esforço, poucas palavras |

## Validação e atualização

Verificação de cobertura, exemplos completos, ausência de duplicações e dados canônicos preservados. Seleção no prompt considera vínculo e usa exemplos inteiros. Reiniciar o bot carrega Markdown e speechProfile atualizados. Não foram executadas conversas de modelo para os 74 NPCs durante os testes.
