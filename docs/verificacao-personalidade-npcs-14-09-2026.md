# Verificação de personalidade dos NPCs — 14/09/2026

Auditoria dos exemplos de diálogo/cena e das vozes dos 74 NPCs, comparados ao núcleo de personalidade em `04_personality.md`. Foram consultadas também história, valores e regras dos casos com desvios. Nenhum diálogo, personalidade, código ou banco de jogadores foi alterado nesta verificação.

O resultado é uma avaliação editorial das fontes e dos prompts, não uma certificação de respostas reais do Ollama. Os exemplos novos preservam diversas vozes, mas não são integralmente fiéis ao elenco. A afirmação anterior de preservação das personalidades foi ampla demais: manter o arquivo original intacto não prova que os exemplos o representam corretamente.

## Desvios identificados

| NPC | Evidência | Ajuste recomendado |
|---|---|---|
| Gaston Rho | Personalidade: fome insaciável, sem malícia calculada; história: anomalia biológica que devora rotas e itens. Voz nova: competidor orgulhoso. Exemplo: “Veio lutar ou veio olhar?” | Centrar ações e comunicação na fome e na natureza monstruosa; confirmar a capacidade de fala na identidade antes de escrever novas falas. |
| Entidade Mãe | Personalidade/história: voz maternal e sedutora, promete acolhimento para assimilar vítimas. Exemplos novos privilegiam uma coletividade abstrata: “Ouvimos sua presença.” | Recuperar falsa acolhida maternal sem transformar a entidade em curandeira genuína nem revelar sempre a assimilação. |
| Delitia Song | Personalidade: extremamente competitiva, desafia caçadores, esconde preocupação com o irmão. Voz nova: observadora disciplinada; exemplos centrados em trilha, vento e informação. | Incluir bravata e desafio cotidianos; preocupação com o irmão apenas quando o contexto justificar. |
| Gideon Ma | Personalidade/história: magistrado corrupto, extorsão e acusações fabricadas. Exemplo de limite: “Não considero uma acusação prova suficiente.” | Uma fachada jurídica pode ser coerente, mas esse exemplo não deve ensinar integridade como limite moral. Mostrar interesse e uso instrumental da autoridade. |
| Werner Choi | Personalidade: sacrifica laços por poder, considera lealdade fraqueza; história: vende informações e provoca massacre. Exemplo: “Não aceito mudar o combinado depois de começar.” O mesmo arquivo de personalidade manda proteger quem está ao seu lado sob pressão. | Distinguir interesse contratual de lealdade genuína; resolver a contradição antiga sobre proteção altruísta. |
| Viator Yoon | Personalidade: aperfeiçoamento da força, combate honesto, respeito a desafios. Voz nova prioriza patrimônio; diálogos e ação de silêncio giram em torno de ruína e retirada de objetos. | Equilibrar a ocupação/contexto da ruína com sua motivação de combate; a função não substitui o temperamento. |
| Saoirse Ryu | Personalidade: carismática, intuitiva, transforma tragédia em arte que inspira esperança. Voz nova: elegante e reservada. | Recuperar calor e percepção emocional sem voltar a discursos de espetáculo. |
| Solon Wi | Personalidade: sábio e paciente, longo prazo, minimização de perdas. Voz nova: seco e estatístico; exemplo: “Não vou chamar esperança de planejamento.” | Manter precisão e estratégia, mas incluir paciência e preocupação com perdas; evitar reduzir sabedoria a sarcasmo. |

## Facetas preservadas parcialmente

- **Rondo Baek:** honra e disciplina presentes, mas formalidade antiquada e rigidez dos juramentos pouco demonstradas. “Ainda fico nervoso antes de uma inspeção” é possível; sozinho não exemplifica seu traço principal.
- **Sazantos Do:** austeridade e vigília compatíveis, mas o exemplo de insistência privilegia convicção pessoal; a personalidade define proteção de rotas como dever. Usar decisões protetoras concretas.
- **Alaune Yeong:** realeza e orgulho aparecem, mas o acolhimento cordial a desconhecidos precisa ser condicionado. A personalidade descreve intrusos como usurpadores, além da corrupção vegetal.
- **Rufus Deng:** rudeza presente, porém a intimidação e o prazer na violência foram atenuados. Naturalidade não exige torná-lo um prestador neutro.
- **Isla Gwon:** curiosidade e percepção preservadas; falta demonstrar melhor a comunicação direta e sem filtros sociais.

## Contradições nas instruções antigas

**Vanessa Hysel:** a personalidade diz que finge compaixão enquanto lucra com o sofrimento que provoca, mas outro trecho do mesmo arquivo manda priorizar a proteção dos outros, colocando-se em risco. A fachada gentil dos exemplos novos é plausível; a instrução altruísta concorrente não é.

**Werner Choi:** o traço de sacrificar laços por poder compete com a instrução de proteger companheiros antes de si. As duas diretrizes podem produzir cenas opostas.

Há blocos repetidos de reações, valores e regras em diversos perfis. Repetição não prova contradição, mas reduz a especificidade: reações a medo, perda e provocação precisam derivar dos traços de cada NPC.

## Exemplos com boa correspondência de voz

Cyrus conserva distração e curiosidade acadêmica; Therion, ironia e desconfiança; H'aanit, dialeto antiquado e observação da mata; Alfyn, ajuda prática; Ophilia, acolhimento com firmeza; Primrose, controle e confiança seletiva; Mugen, autoridade cruel; Redeye, comunicação por ações e rosnados. Estes são exemplos de correspondência editorial, não garantia para todas as situações geradas.

## Fluxo de geração

Foram construídos **222 prompts**, três situações para cada um dos 74 NPCs, sem chamar o Ollama: cumprimento, pedido de ajuda e discordância, sem vínculo ou memória. Todos incluíram o nome e o início da personalidade canônica. Essa checagem confirma a presença das fontes, não sua interpretação pelo modelo nem a ausência de cortes no restante do contexto.

A rota principal inclui um bloco obrigatório de identidade/personalidade e exemplos selecionados. A rota legada também fornece núcleo e perfil de fala. Ambas têm orientações universais de brevidade/naturalidade; elas podem reduzir teatralidade, formalidade e diferenças entre entidades e humanos se a precedência da personalidade não estiver explícita.

A proteção compartilhada de respostas verifica idioma, identidade declarada, cópia longa e marcadores narrativos. **Ela não avalia semanticamente fidelidade à personalidade.** Uma fala educada, em português e bem formatada pode passar mesmo descaracterizando um NPC cruel.

Recomenda-se corrigir os desvios das fontes primeiro, explicitar que naturalidade respeita o caráter e depois avaliar respostas reais em situações de ajuda, ameaça, elogio, recusa, silêncio e vínculo alto. Preservar `_ações_`, `*diálogos*` e `> pensamentos`; não exigir todos os formatos em toda cena.
