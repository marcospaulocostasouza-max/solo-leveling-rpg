# Especificação do Dataset da LoRA de NPCs

Este documento define oficialmente como cada arquivo do template deve ser preenchido. Ele serve como regra obrigatória para a criação de todos os NPCs da LoRA.

---

## Regras Gerais do Dataset

1. **Nunca contradizer informações anteriores** — Uma vez definida, uma informação não pode ser alterada ou negada em arquivos subsequentes.
2. **Toda personalidade deve refletir a história** — Os traços de personalidade devem ser consequência direta dos eventos vividos pelo personagem.
3. **Toda fala deve refletir a personalidade** — O estilo de diálogo deve ser coerente com os traços psicológicos definidos.
4. **Toda narrativa deve refletir o comportamento** — As cenas e exemplos devem demonstrar como o personagem age de acordo com sua personalidade e valores.
5. **Nunca criar fatos definitivos para lacunas narrativas** — As lacunas narrativas devem permanecer como espaços em aberto, sem inventar eventos concretos.
6. **Nunca alterar a identidade do personagem** — Nome, origem e características fundamentais definidas na identidade são imutáveis.
7. **Todo NPC deve ser consistente em qualquer situação** — Independentemente do contexto, cena ou interação, o personagem deve agir de forma coerente com tudo o que foi definido.

---

## Especificação por Arquivo

---

### 01_identity.md

**Objetivo do arquivo**
Definir a identidade fundamental e imutável do NPC — quem ele é em sua essência.

**Tipo de informação permitida**
- Nome completo e apelidos
- Raça/espécie
- Idade ou faixa etária
- Gênero
- Origem geográfica
- Classe ou profissão
- Título ou cargo ocupado
- Aparência física resumida

**Tipo de informação proibida**
- Histórias detalhadas (pertencem ao arquivo 03)
- Traços de personalidade (pertencem ao arquivo 04)
- Relações interpessoais (pertencem ao arquivo 11)
- Eventos narrativos específicos

**Nível de detalhamento esperado**
Médio. Suficiente para identificar o personagem univocamente, sem entrar em narrativa.

**Regras de consistência**
- A identidade, uma vez definida, não pode ser alterada em nenhum outro arquivo.
- Toda informação posterior deve referenciar a identidade de forma coerente.

**O que nunca deve ser inventado**
- Nome verdadeiro (se o personagem usa um codinome, o nome verdadeiro só deve ser definido se for canonicamente conhecido)
- Origem exata (se não for canonicamente definida, deve ser marcada como lacuna)

**O que pode ser desenvolvido livremente**
- Apelidos derivados do nome
- Descrição física complementar dentro do que já é conhecido

**Quantidade mínima recomendada de conteúdo**
- Pelo menos: nome, raça, idade, gênero, origem e classe/profissão.

---

### 02_summary.md

**Objetivo do arquivo**
Oferecer um resumo conciso do personagem — uma visão geral que qualquer leitor possa entender rapidamente.

**Tipo de informação permitida**
- Síntese de identidade (1-2 frases)
- Síntese de história (1-2 frases)
- Síntese de personalidade (1-2 frases)
- Síntese de objetivos (1 frase)
- Frase que captura a essência do personagem

**Tipo de informação proibida**
- Detalhes extensos de qualquer categoria
- Informações que não existem em outros arquivos
- Novos dados não cobertos pelos arquivos específicos

**Nível de detalhamento esperado**
Baixo. Este é um arquivo de visão geral, não de aprofundamento.

**Regras de consistência**
- O resumo deve refletir fielmente o conteúdo dos outros arquivos.
- Nenhuma informação nova deve ser introduzida aqui.

**O que nunca deve ser inventado**
- Qualquer dado que não esteja presente nos arquivos específicos.

**O que pode ser desenvolvido livremente**
- A forma de sintetizar as informações (estilo de escrita do resumo).

**Quantidade mínima recomendada de conteúdo**
- Pelo menos 5 frases: uma para cada área (identidade, história, personalidade, objetivo, essência).

---

### 03_history.md

**Objetivo do arquivo**
Documentar a história de vida do personagem — eventos, marcos e experiências que o moldaram.

**Tipo de informação permitida**
- Eventos de infância e formação
- Marcos de vida importantes
- Traumas e momentos de transformação
- Conquistas e derrotas
- Linha do tempo de eventos relevantes
- Contexto histórico em que o personagem viveu

**Tipo de informação proibida**
- Traços de personalidade abstratos sem conexão com eventos (pertencem ao arquivo 04)
- Diálogos específicos (pertencem ao arquivo 17)
- Relações detalhadas (pertencem ao arquivo 11, mas eventos que envolvem relações são permitidos)

**Nível de detalhamento esperado**
Alto. A história é a base de todo o personagem.

**Regras de consistência**
- Toda personalidade definida no arquivo 04 deve ter raiz em eventos deste arquivo.
- Toda fala definida no arquivo 06 deve ser coerente com a história.
- Eventos históricos não podem contradizer a identidade.

**O que nunca deve ser inventado**
- Eventos canonicamente estabelecidos não podem ser alterados.
- Se o personagem tem uma história canônica conhecida, ela deve ser respeitada integralmente.

**O que pode ser desenvolvido livremente**
- Eventos complementares que não contradizem a história canônica.
- Detalhes de eventos que são mencionados mas não detalhados no material original.

**Quantidade mínima recomendada de conteúdo**
- Pelo menos 5 eventos significativos distribuídos ao longo da vida do personagem.

---

### 04_personality.md

**Objetivo do arquivo**
Definir os traços psicológicos do personagem — como ele pensa, sente e reage.

**Tipo de informação permitida**
- Traços de personalidade principais
- Postura emocional dominante
- Formas de reagir a estímulos (medo, raiva, alegria, tristeza)
- Vícios e manias
- Crenças internas (não valores morais, que ficam no arquivo 07)
- Forma de tomar decisões
- Nível de racionalidade vs. emocionalidade

**Tipo de informação proibida**
- Eventos históricos detalhados (pertencem ao arquivo 03)
- Diálogos (pertencem ao arquivo 17)
- Valores morais e éticos (pertencem ao arquivo 07)
- Relações interpessoais (pertencem ao arquivo 11)

**Nível de detalhamento esperado**
Alto. A personalidade é o que torna o personagem único em suas interações.

**Regras de consistência**
- Cada traço de personalidade deve ter origem em um evento do arquivo 03.
- A personalidade deve ser coerente com a forma de fala definida no arquivo 06.
- Os exemplos de diálogo (arquivo 17) devem refletir esta personalidade.

**O que nunca deve ser inventado**
- Traços que contradizem a história canônica do personagem.
- Personalidade que não tem nenhuma conexão com eventos vividos.

**O que pode ser desenvolvido livremente**
- Aprofundamento psicológico de traços já estabelecidos.
- Subtraços derivados dos traços principais.

**Quantidade mínima recomendada de conteúdo**
- Pelo menos 5 traços de personalidade distintos com justificativa psicológica.

---

### 05_interpretation.md

**Objetivo do arquivo**
Definir como o personagem interpreta o mundo — sua lente cognitiva, visão de realidade e forma de processar informações.

**Tipo de informação permitida**
- Visão de mundo (otimista, pessimista, pragmática, etc.)
- Forma de interpretar situações sociais
- Como o personagem percebe autoridade, poder, justiça
- Como o personagem processa emoções alheias
- Filtros cognitivos (tendências de interpretação)
- Como o personagem lida com ambiguidade
- Como o personagem interpreta silêncios e subtextos

**Tipo de informação proibida**
- Valores morais explícitos (pertencem ao arquivo 07)
- Eventos históricos (pertencem ao arquivo 03)
- Diálogos (pertencem ao arquivo 17)

**Nível de detalhamento esperado**
Médio a alto. A interpretação define como o personagem reage a estímulos novos.

**Regras de consistência**
- A interpretação deve ser coerente com a personalidade (arquivo 04).
- A interpretação deve ter raiz na história (arquivo 03).
- Os exemplos de cena (arquivo 18) devem demonstrar esta interpretação em ação.

**O que nunca deve ser inventado**
- Visões de mundo que contradizem a história canônica.
- Interpretações que não são coerentes com a personalidade definida.

**O que pode ser desenvolvido livremente**
- Aprofundamento de como o personagem interpreta situações não canônicas.
- Filtros cognitivos derivados dos traços de personalidade.

**Quantidade mínima recomendada de conteúdo**
- Pelo menos 4 formas de interpretação de mundo distintas.

---

### 06_speech.md

**Objetivo do arquivo**
Definir o padrão de fala do personagem — como ele se comunica verbalmente.

**Tipo de informação permitida**
- Estilo de linguagem (formal, informal, coloquial, arcaico, etc.)
- Vocabulário frequente
- Expressões e bordões característicos
- Ritmo de fala (pausas, velocidade, cadência)
- Tiques verbais
- Estrutura de frases (longas, curtas, fragmentadas)
- Nível de formalidade em diferentes contextos
- Como o personagem se dirige a diferentes tipos de interlocutor

**Tipo de informação proibida**
- Diálogos completos (pertencem ao arquivo 17)
- Eventos históricos (pertencem ao arquivo 03)
- Traços de personalidade abstratos (pertencem ao arquivo 04)

**Nível de detalhamento esperado**
Médio a alto. A fala é a expressão mais visível da personalidade.

**Regras de consistência**
- O estilo de fala deve refletir a personalidade (arquivo 04).
- O estilo de fala deve ser coerente com a história (arquivo 03).
- Os exemplos de diálogo (arquivo 17) devem seguir este padrão.

**O que nunca deve ser inventado**
- Padrões de fala que contradizem a personalidade.
- Bordões ou expressões que não fazem sentido no contexto do personagem.

**O que pode ser desenvolvido livremente**
- Ampliação do vocabulário dentro do estilo definido.
- Variações de fala para diferentes contextos.

**Quantidade mínima recomendada de conteúdo**
- Pelo menos: estilo de linguagem, 3 expressões/bordões, ritmo de fala e nível de formalidade.

---

### 07_values.md

**Objetivo do arquivo**
Definir os valores morais e éticos do personagem — o que ele considera certo, errado, justo e injusto.

**Tipo de informação permitida**
- Princípios morais fundamentais
- Códigos de conduta pessoais
- O que o personagem considera inaceitável
- O que o personagem considera nobre ou virtuoso
- Conflitos morais internos
- Flexibilidade ou rigidez ética
- Como o personagem justifica suas ações

**Tipo de informação proibida**
- Traços de personalidade abstratos (pertencem ao arquivo 04)
- Eventos históricos (pertencem ao arquivo 03)
- Diálogos (pertencem ao arquivo 17)

**Nível de detalhamento esperado**
Médio. Os valores devem ser claros mas não excessivamente filosóficos.

**Regras de consistência**
- Os valores devem ter raiz na história (arquivo 03).
- Os valores devem ser coerentes com a personalidade (arquivo 04).
- As regras absolutas (arquivo 16) não podem contradizer os valores.

**O que nunca deve ser inventado**
- Valores que contradizem ações canonicamente estabelecidas.
- Princípios que não têm nenhuma conexão com a história.

**O que pode ser desenvolvido livremente**
- Aprofundamento de valores implícitos na história canônica.
- Conflitos morais derivados de eventos vividos.

**Quantidade mínima recomendada de conteúdo**
- Pelo menos 4 valores ou princípios morais distintos.

---

### 08_likes.md

**Objetivo do arquivo**
Documentar o que o personagem aprecia — gostos, preferências e afinidades.

**Tipo de informação permitida**
- Comidas, bebidas e objetos preferidos
- Atividades que disfruta
- Ambientes que prefere
- Tipos de pessoas que aprecia
- Hobbies e passatempos
- Sons, cheiros, sensações que gosta
- Temas de conversa que aprecia

**Tipo de informação proibida**
- Valores morais (pertencem ao arquivo 07)
- Eventos históricos (pertencem ao arquivo 03)
- Relações interpessoais detalhadas (pertencem ao arquivo 11)

**Nível de detalhamento esperado**
Médio. Suficiente para dar cor ao personagem sem se tornar uma lista exaustiva.

**Regras de consistência**
- Os gostos devem ser coerentes com a personalidade (arquivo 04).
- Os gostos devem fazer sentido com a história (arquivo 03).
- Os gostos não podem contradizer as aversões (arquivo 09).

**O que nunca deve ser inventado**
- Gostos que contradizem a história canônica.
- Preferências que não fazem sentido com a origem ou classe do personagem.

**O que pode ser desenvolvido livremente**
- Gostos complementares que não contradizem o material canônico.
- Preferências derivadas da personalidade.

**Quantidade mínima recomendada de conteúdo**
- Pelo menos 5 gostos ou preferências distintas.

---

### 09_dislikes.md

**Objetivo do arquivo**
Documentar o que o personagem repudia — aversões, desgostos e antipatias.

**Tipo de informação permitida**
- Comidas, bebidas e objetos que rejeita
- Atividades que detesta
- Ambientes que evita
- Tipos de pessoas que não suporta
- Situações que causam desconforto
- Sons, cheiros, sensações que repudia
- Temas de conversa que irritam

**Tipo de informação proibida**
- Valores morais (pertencem ao arquivo 07)
- Eventos históricos (pertencem ao arquivo 03)
- Traumas (pertencem ao arquivo 10)

**Nível de detalhamento esperado**
Médio. Suficiente para definir limites e desconfortos do personagem.

**Regras de consistência**
- As aversões devem ser coerentes com a personalidade (arquivo 04).
- As aversões devem fazer sentido com a história (arquivo 03).
- As aversões não podem contradizer os gostos (arquivo 08).

**O que nunca deve ser inventado**
- Aversões que contradizem a história canônica.
- Antipatias que não fazem sentido com a origem ou classe do personagem.

**O que pode ser desenvolvido livremente**
- Aversões complementares que não contradizem o material canônico.
- Desgostos derivados da personalidade.

**Quantidade mínima recomendada de conteúdo**
- Pelo menos 5 aversões ou desgostos distintos.

---

### 10_traumas.md

**Objetivo do arquivo**
Documentar os traumas psicológicos do personagem — feridas emocionais que afetam seu comportamento.

**Tipo de informação permitida**
- Eventos traumáticos específicos
- Gatilhos que reativam o trauma
- Reações psicológicas ao trauma
- Formas de lidar (coping) com o trauma
- Impacto do trauma no comportamento diário
- Progressão ou regressão do trauma ao longo do tempo

**Tipo de informação proibida**
- Traços de personalidade gerais (pertencem ao arquivo 04)
- Valores morais (pertencem ao arquivo 07)
- Diálogos (pertencem ao arquivo 17)

**Nível de detalhamento esperado**
Alto. Os traumas são centrais para entender o comportamento do personagem.

**Regras de consistência**
- Cada trauma deve ter origem em um evento do arquivo 03.
- Os traumas devem ser refletidos na personalidade (arquivo 04).
- Os traumas devem influenciar a forma de fala (arquivo 06).

**O que nunca deve ser inventado**
- Traumas que não têm evento de origem na história.
- Traumas que contradizem eventos canônicos.

**O que pode ser desenvolvido livremente**
- Aprofundamento psicológico de traumas implícitos.
- Gatilhos derivados de eventos traumáticos estabelecidos.

**Quantidade mínima recomendada de conteúdo**
- Pelo menos 2 traumas com gatilhos e reações definidos.

---

### 11_relationships.md

**Objetivo do arquivo**
Definir as relações interpessoais do personagem — vínculos, alianças, inimizades e afetos.

**Tipo de informação permitida**
- Relações familiares
- Relações de amizade
- Relações de inimizade e rivalidade
- Relações românticas
- Relações profissionais
- Hierarquias de confiança
- Sentimentos em relação a cada pessoa

**Tipo de informação proibida**
- Eventos históricos detalhados (pertencem ao arquivo 03)
- Diálogos (pertencem ao arquivo 17)
- Valores morais (pertencem ao arquivo 07)

**Nível de detalhamento esperado**
Médio a alto. As relações definem como o personagem interage socialmente.

**Regras de consistência**
- As relações devem ser coerentes com a história (arquivo 03).
- As relações devem refletir a personalidade (arquivo 04).
- As relações devem influenciar os exemplos de diálogo (arquivo 17).

**O que nunca deve ser inventado**
- Relações que contradizem o material canônico.
- Vínculos que não fazem sentido com a história do personagem.

**O que pode ser desenvolvido livremente**
- Aprofundamento de relações implícitas no material canônico.
- Dinâmicas relacionais derivadas da personalidade.

**Quantidade mínima recomendada de conteúdo**
- Pelo menos 3 relações distintas com sentimento e contexto definidos.

---

### 12_goals.md

**Objetivo do arquivo**
Definir os objetivos do personagem — o que ele busca, deseja e persegue.

**Tipo de informação permitida**
- Objetivos de curto prazo
- Objetivos de longo prazo
- Desejos pessoais
- Ambições profissionais
- Sonhos e aspirações
- Medos de fracasso
- O que o personagem está disposto a sacrificar

**Tipo de informação proibida**
- Eventos históricos (pertencem ao arquivo 03)
- Valores morais (pertencem ao arquivo 07)
- Diálogos (pertencem ao arquivo 17)

**Nível de detalhamento esperado**
Médio. Os objetivos devem ser claros e acionáveis.

**Regras de consistência**
- Os objetivos devem ter raiz na história (arquivo 03).
- Os objetivos devem ser coerentes com a personalidade (arquivo 04).
- Os objetivos devem refletir os valores (arquivo 07).

**O que nunca deve ser inventado**
- Objetivos que contradizem a história canônica.
- Metas que não fazem sentido com a personalidade do personagem.

**O que pode ser desenvolvido livremente**
- Objetivos intermediários derivados de metas canônicas.
- Desejos pessoais complementares que não contradizem o material original.

**Quantidade mínima recomendada de conteúdo**
- Pelo menos 3 objetivos (curto, médio e longo prazo).

---

### 13_knowledge.md

**Objetivo do arquivo**
Definir o conhecimento do personagem — o que ele sabe, o que estuda e quais áreas domina.

**Tipo de informação permitida**
- Áreas de especialização
- Conhecimentos práticos
- Conhecimentos acadêmicos ou teóricos
- Habilidades técnicas
- Idiomas que fala
- O que o personagem desconhece (limitações)
- Fontes de seu conhecimento (livros, mestres, experiência)

**Tipo de informação proibida**
- Eventos históricos (pertencem ao arquivo 03)
- Curiosidades (pertencem ao arquivo 14)
- Diálogos (pertencem ao arquivo 17)

**Nível de detalhamento esperado**
Médio. Suficiente para definir o que o personagem pode e não pode saber.

**Regras de consistência**
- O conhecimento deve ser coerente com a história (arquivo 03).
- O conhecimento deve refletir a classe/profissão definida na identidade (arquivo 01).
- O conhecimento não pode incluir informações que o personagem não teria como ter.

**O que nunca deve ser inventado**
- Conhecimentos que contradizem a história canônica.
- Especializações que não fazem sentido com a origem ou classe do personagem.

**O que pode ser desenvolvido livremente**
- Aprofundamento de áreas de conhecimento implícitas.
- Habilidades técnicas derivadas da profissão ou classe.

**Quantidade mínima recomendada de conteúdo**
- Pelo menos 3 áreas de conhecimento e 2 limitações.

---

### 14_curiosities.md

**Objetivo do arquivo**
Documentar curiosidades sobre o personagem — fatos menores que enriquecem a construção sem alterar a essência.

**Tipo de informação permitida**
- Hábitos pequenos e cotidianos
- Manias e tiques
- Preferências estéticas
- Histórias menores não centrais
- Fatos inusitados
- Conexões com elementos do mundo
- Detalhes que humanizam o personagem

**Tipo de informação proibida**
- Eventos centrais da história (pertencem ao arquivo 03)
- Traços de personalidade (pertencem ao arquivo 04)
- Valores morais (pertencem ao arquivo 07)

**Nível de detalhamento esperado**
Baixo a médio. Curiosidades são complementares, não centrais.

**Regras de consistência**
- As curiosidades não podem contradizer nenhum outro arquivo.
- As curiosidades devem ser coerentes com a personalidade (arquivo 04).

**O que nunca deve ser inventado**
- Curiosidades que contradizem o material canônico.
- Fatos que alteram a compreensão da história ou personalidade.

**O que pode ser desenvolvido livremente**
- Hábitos cotidianos derivados da personalidade.
- Pequenos detalhes que enriquecem o personagem sem alterar sua essência.

**Quantidade mínima recomendada de conteúdo**
- Pelo menos 5 curiosidades distintas.

---

### 15_narrative_gaps.md

**Objetivo do arquivo**
Identificar lacunas narrativas — pontos da história do personagem que são desconhecidos, ambíguos ou não definidos.

**Tipo de informação permitida**
- Períodos de vida não documentados
- Eventos ambíguos com múltiplas interpretações
- Informações canonicamente indefinidas
- Perguntas em aberto sobre o personagem
- Mistérios intencionais
- Áreas onde o personagem não tem certeza de si mesmo

**Tipo de informação proibida**
- Respostas definitivas para as lacunas (as lacunas devem permanecer em aberto)
- Eventos concretos inventados para preencher lacunas
- Qualquer informação que transforme uma lacuna em fato

**Nível de detalhamento esperado**
Médio. Suficiente para identificar onde existem espaços em aberto.

**Regras de consistência**
- As lacunas não podem contradizer eventos estabelecidos no arquivo 03.
- As lacunas devem ser marcadas como tal, nunca preenchidas com fatos.
- As lacunas podem ser referenciadas em outros arquivos, mas nunca resolvidas.

**O que nunca deve ser inventado**
- Qualquer fato definitivo para preencher uma lacuna.
- Eventos que resolvam uma ambiguidade canonicamente estabelecida.

**O que pode ser desenvolvido livremente**
- Identificação de novas lacunas derivadas da análise do material.
- Formulação de perguntas sobre pontos ambíguos.

**Quantidade mínima recomendada de conteúdo**
- Pelo menos 3 lacunas narrativas identificadas.

---

### 16_absolute_rules.md

**Objetivo do arquivo**
Definir regras absolutas do personagem — princípios inquebráveis que o NPC nunca violará sob nenhuma circunstância.

**Tipo de informação permitida**
- Regras de comportamento inquebráveis
- Linhas que o personagem nunca cruzará
- Princípios que não podem ser negociados
- Ações que o personagem jamais tomará
- Condições que o personagem nunca aceitará
- Promessas ou juramentos que o personagem mantém

**Tipo de informação proibida**
- Preferências ou gostos (pertencem ao arquivo 08)
- Valores morais gerais (pertencem ao arquivo 07)
- Eventos históricos (pertencem ao arquivo 03)

**Nível de detalhamento esperado**
Médio. As regras devem ser claras, específicas e acionáveis.

**Regras de consistência**
- As regras absolutas não podem contradizer os valores (arquivo 07).
- As regras absolutas devem ter raiz na história (arquivo 03).
- As regras absolutas devem ser respeitadas em todos os exemplos de diálogo (arquivo 17) e cena (arquivo 18).

**O que nunca deve ser inventado**
- Regras que contradizem ações canonicamente estabelecidas.
- Princípios que o personagem já violou no material canônico.

**O que pode ser desenvolvido livremente**
- Regras derivadas de eventos traumáticos (arquivo 10).
- Princípios derivados de valores estabelecidos (arquivo 07).

**Quantidade mínima recomendada de conteúdo**
- Pelo menos 3 regras absolutas inquebráveis.

---

### 17_dialog_examples.md

**Objetivo do arquivo**
Fornecer exemplos de diálogo que demonstram como o personagem fala em diferentes situações.

**Tipo de informação permitida**
- Diálogos em diferentes contextos (calmo, tenso, alegre, triste)
- Diálogos com diferentes tipos de interlocutor
- Respostas a perguntas comuns
- Reações verbais a situações extremas
- Monólogos internos
- Diálogos que demonstram traços de personalidade
- Diálogos que demonstram padrões de fala (arquivo 06)

**Tipo de informação proibida**
- Eventos históricos narrados (pertencem ao arquivo 03)
- Traços de personalidade abstratos (pertencem ao arquivo 04)
- Cenas narrativas sem diálogo (pertencem ao arquivo 18)

**Nível de detalhamento esperado**
Alto. Os exemplos de diálogo são o material principal de treino da LoRA.

**Regras de consistência**
- Os diálogos devem seguir o padrão de fala definido no arquivo 06.
- Os diálogos devem refletir a personalidade (arquivo 04).
- Os diálogos devem respeitar as regras absolutas (arquivo 16).
- Os diálogos devem ser coerentes com a história (arquivo 03).

**O que nunca deve ser inventado**
- Diálogos que contradizem o padrão de fala estabelecido.
- Diálogos que violam regras absolutas.
- Diálogos que contradizem a personalidade.

**O que pode ser desenvolvido livremente**
- Novos diálogos em situações não canônicas, desde que coerentes com o personagem.
- Variações de resposta para diferentes contextos.

**Quantidade mínima recomendada de conteúdo**
- Pelo menos 10 exemplos de diálogo cobrindo diferentes contextos e interlocutores.

---

### 18_scene_examples.md

**Objetivo do arquivo**
Fornecer exemplos de cenas narrativas que demonstram como o personagem age, pensa e reage em situações concretas.

**Tipo de informação permitida**
- Cenas de ação e combate
- Cenas de interação social
- Cenas de reflexão interna
- Cenas de tomada de decisão
- Cenas de reação emocional
- Cenas que demonstram interpretação de mundo (arquivo 05)
- Cenas que demonstram valores em ação (arquivo 07)
- Cenas que demonstram regras absolutas sendo respeitadas (arquivo 16)

**Tipo de informação proibida**
- Diálogos isolados sem contexto narrativo (pertencem ao arquivo 17)
- Eventos históricos canônicos (pertencem ao arquivo 03)
- Traços de personalidade abstratos (pertencem ao arquivo 04)

**Nível de detalhamento esperado**
Alto. As cenas são o material complementar de treino da LoRA, demonstrando o personagem em ação.

**Regras de consistência**
- As cenas devem refletir a personalidade (arquivo 04).
- As cenas devem respeitar as regras absolutas (arquivo 16).
- As cenas devem ser coerentes com a história (arquivo 03).
- As cenas devem demonstrar a interpretação de mundo (arquivo 05).
- A fala nas cenas deve seguir o padrão definido (arquivo 06).

**O que nunca deve ser inventado**
- Cenas que contradizem a história canônica.
- Cenas que violam regras absolutas.
- Cenas que contradizem a personalidade.

**O que pode ser desenvolvido livremente**
- Cenas em situações não canônicas, desde que coerentes com o personagem.
- Variações de comportamento em diferentes contextos.

**Quantidade mínima recomendada de conteúdo**
- Pelo menos 5 cenas cobrindo diferentes tipos de situação (ação, social, reflexão, decisão, emoção).

---

## Ordem de Preenchimento Recomendada

Os arquivos devem ser preenchidos na ordem numérica estabelecida, pois cada arquivo depende dos anteriores:

1. **01_identity.md** — base fundamental, imutável
2. **02_summary.md** — síntese de tudo (preencher por último é aceitável)
3. **03_history.md** — base para personalidade, traumas, valores
4. **04_personality.md** — derivada da história
5. **05_interpretation.md** — derivada da personalidade
6. **06_speech.md** — expressão da personalidade
7. **07_values.md** — derivado da história e personalidade
8. **08_likes.md** — complementar à personalidade
9. **09_dislikes.md** — complementar à personalidade
10. **10_traumas.md** — derivado da história
11. **11_relationships.md** — derivado da história e personalidade
12. **12_goals.md** — derivado de toda a construção
13. **13_knowledge.md** — derivado da história e identidade
14. **14_curiosities.md** — complementar a tudo
15. **15_narrative_gaps.md** — identificação de lacunas
16. **16_absolute_rules.md** — derivação de princípios
17. **17_dialog_examples.md** — aplicação de tudo em fala
18. **18_scene_examples.md** — aplicação de tudo em narrativa

---

## Nota Final

Este documento é a regra oficial para criação de todos os NPCs da LoRA. Qualquer desvio desta especificação compromete a consistência do dataset e, consequentemente, a qualidade do treinamento.