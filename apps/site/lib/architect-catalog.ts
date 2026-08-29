export type ArchitectEntry = {
  id: string;
  title: string;
  command: string;
  functionText: string;
  description: string;
  source: string;
  href?: string;
  siteStatus: 'functional' | 'linked' | 'bot-only';
  note?: string;
};

export type ArchitectCategory = {
  id: string;
  title: string;
  eyebrow: string;
  intro: string;
  botText: string;
  entries: ArchitectEntry[];
};

const e = (
  id: string,
  title: string,
  command: string,
  functionText: string,
  description: string,
  source: string,
  siteStatus: ArchitectEntry['siteStatus'],
  href?: string,
  note?: string,
): ArchitectEntry => ({ id, title, command, functionText, description, source, siteStatus, href, note });

export const architectCategories: ArchitectCategory[] = [
  {
    id: 'cacador',
    title: 'Caçador',
    eyebrow: 'REGISTRO DO JOGADOR',
    intro: 'Este é o seu espaço, Jogador. Aqui estão reunidas todas as informações que definem quem você é neste mundo: seus atributos, classe, afinidade, equipamentos, títulos, poderes e demais características do seu personagem.',
    botText: `_*「 CAÇADOR 」*_\n_— Este é o seu espaço, Jogador. Aqui estão reunidas todas as informações que definem quem você é neste mundo: seus atributos, classe, afinidade, equipamentos, títulos, poderes e demais características do seu personagem. Conheça aquilo que possui, entenda suas capacidades e esteja sempre preparado para o que surgir diante de você._\n\n_*Comandos:*_\n_• !Jogador_\n_• !Nível_\n_• !Distribuir_\n_• !Consultar Afinidade_\n_• !Equipados_\n_• !Inventário_\n_• !Minhas Passivas_\n_• !Meus Títulos_\n_• !Minhas Técnicas_\n_• !Distribuir_\n_• !Consultar Afinidade_\n_• !Hp_`,
    entries: [
      e('jogador','Meu Personagem','!Jogador','Exibe a ficha principal do jogador','Mostra a ficha principal: atributos, classe, nível e mana.','jogador.js','functional','/personagem'),
      e('nivel','Nível','!Nível','Exibe informações de nível e progressão','Mostra nível atual, XP, próximo nível e bônus.','nivel.js','linked','/personagem','A ficha do site já exibe nível e progresso do personagem.'),
      e('distribuir','Distribuir Atributos','!Distribuir','Distribui pontos de atributo recebidos por level up','Sistema de distribuição de pontos: +3 pontos por nível, recalcula atributos derivados.','distribuir.js','bot-only',undefined,'A distribuição continua no bot até a ação web ser ligada ao mesmo serviço transacional.'),
      e('afinidade','Consultar Afinidade','!Consultar Afinidade','Exibe a afinidade elemental que o jogador possui','Mostra o elemento sorteado, categoria, raridade e bônus.','consultarAfinidade.js','linked','/personagem'),
      e('equipados','Equipados','!Equipados','Exibe todos os slots de equipamento do jogador','Mostra quais slots estão ocupados/livres e o item equipado em cada um.','verSlots.js','functional','/equipamentos'),
      e('inventario','Inventário','!Inventário','Exibe o inventário do jogador','Mostra itens, equipamentos, armas e armaduras do jogador.','inventario.js','functional','/inventario'),
      e('minhas-passivas','Minhas Passivas','!Minhas Passivas','Exibe as passivas registradas no personagem','Todas as passivas conquistadas ficam sempre ativas; cada registro informa descrição e buffs.','passivas.js','linked','/titulos'),
      e('meus-titulos','Meus Títulos','!Meus Títulos','Exibe os títulos conquistados pelo jogador','Mostra detalhes, raridade, efeitos e como equipar os títulos conquistados.','meusTitulos.js','linked','/titulos'),
      e('minhas-tecnicas','Minhas Técnicas','!Minhas Técnicas','Exibe as técnicas aprendidas pelo personagem','Organiza técnicas em Classe, Classe avançada, Estilos de luta e Outras.','minhasTecnicas.js','functional','/habilidades'),
      e('hp','HP','!Hp','Gerenciamento de HP e vida','Visualiza e gerencia pontos de vida.','hp.js','linked','/personagem'),
    ],
  },
  {
    id: 'ascensao',
    title: 'Ascensão',
    eyebrow: 'EVOLUÇÃO E PROGRESSÃO',
    intro: 'Poder não é algo que permanece estagnado, Jogador. Aqui encontrará tudo relacionado ao seu crescimento: evolução, níveis, progressão e os diferentes caminhos para alcançar novos patamares.',
    botText: `_*「 ASCENSÃO 」*_\n_— Poder não é algo que permanece estagnado, Jogador. Aqui encontrará tudo relacionado ao seu crescimento: evolução, níveis, progressão e os diferentes caminhos para alcançar novos patamares. Supere seus limites, fortaleça-se e prove até onde é capaz de chegar._\n\n_*Comandos:*_\n_• !Progresso_\n_• !Penalidade_\n_• !Histórico_\n_• !Classe Avançada *(disponível no nível 40)*_\n_• !Rank Info_\n_• !Locais_`,
    entries: [
      e('progresso','Progresso','!Progresso','Explica as formas oficiais de evolução narrativa','Reúne Quest Diária, Missões Narradas, Treino de Maestria, Treino Conjunto, Interação e One-Post, com recompensas registradas após validação.','progresso.js','bot-only'),
      e('penalidade','Penalidade','!Penalidade','Sistema de penalidades','Visualiza e aplica penalidades; o desafio exige nível 10 e verifica atividades recentes antes de liberar elegibilidade.','penalidade.js','bot-only'),
      e('historico','Histórico','!Histórico','Exibe histórico de atividades aprovadas do jogador','Mostra contadores de treinos, missões, dungeons e totais de recompensas recebidas.','atividades.js','bot-only'),
      e('classe-avancada','Classe Avançada','!Classe Avançada','Exibe e conduz o sistema de Classe Avançada','A quest de Classe Avançada é liberada no nível 40; a progressão fica bloqueada até a conclusão da escolha.','classeAvancada.js','bot-only'),
      e('rank-info','Rank Info','!Rank Info','Exibe requisitos de nível e bônus de cada rank','Mostra nível necessário e bônus (pontos + Won) para cada rank: E, D, C, B, A, S.','avaliarRank.js','bot-only'),
      e('locais','Locais','!Locais','Lista locais especiais da Coreia do Sul','Mostra locais como Hallasan, Ilha das Memórias, Templos e outros pontos especiais do mundo.','locais.js','functional','/mapa'),
    ],
  },
  {
    id: 'associacoes',
    title: 'Associações',
    eyebrow: 'GUILDAS E ORGANIZAÇÕES',
    intro: 'Este mundo não pertence apenas aos Caçadores, Jogador. Guildas, organizações, facções e até aqueles que agem no Submundo possuem seus próprios interesses e influência.',
    botText: `_*「 ASSOCIAÇÕES 」*_\n_— Este mundo não pertence apenas aos Caçadores, Jogador. Guildas, organizações, facções e até aqueles que agem no Submundo possuem seus próprios interesses e influência. Aqui encontrará tudo relacionado a essas associações, seus membros, conflitos, alianças e caminhos para fazer parte delas._\n\n_*Comandos:*_\n_• !Guilda *(criar/entrar/sair/info)*_\n_• !Rank_\n_• !Membroa_\n_• !Cargosa_\n_• !Investimentos_\n_• !Guerra_\n_• !MVP_\n_• !Submundo_\n_• !Territórios_`,
    entries: [
      e('guilda','Guilda','!Guilda','Sistema de guildas do jogo','Explica guildas e gerencia criação, entrada, saída e liderança com custo, Rank e cooldown.','guilda.js','functional','/guilda'),
      e('rank','Rank / Ranking','!Rank','Exibe o ranking dos jogadores','Mostra jogadores por nível, experiência e Won.','ranking.js','bot-only'),
      e('membroa','Membros','!Membroa','Gerenciamento de membros','Adiciona/remove membros de guildas.','membroa.js','bot-only'),
      e('cargosa','Cargos','!Cargosa','Sistema de cargas e capacidade','Gerencia carga máxima e penalidades.','cargosa.js','bot-only'),
      e('investimentos','Investimentos','!Investimentos','Lista investimentos disponíveis para guildas','Mostra opções de investimento em territórios com custos e buffs.','investimentos.js','bot-only'),
      e('guerra','Guerra','!Guerra','Sistema de guerras entre guildas','Gerenciamento e execução de guerras.','guerra.js','bot-only'),
      e('mvp','MVP','!MVP','Exibe o MVP e ranking de candidatos','Mostra o líder atual do MVP, ranking e permite resetar o ciclo para administração.','mvp.js','bot-only'),
      e('submundo','Submundo','!Submundo','Sistema do Submundo','Área especial com desafios únicos.','submundo.js','bot-only'),
      e('territorios','Territórios','!Territórios','Lista territórios e suas informações','Mostra territórios com valores, lucros semanais e donos atuais.','territorios.js','functional','/mapa'),
    ],
  },
  {
    id: 'biblioteca',
    title: 'Biblioteca',
    eyebrow: 'REGRAS E CONHECIMENTO',
    intro: 'Conhecimento pode ser tão valioso quanto poder, Jogador. Aqui estão reunidas as informações essenciais sobre este mundo, suas regras, sistemas e mecânicas.',
    botText: `_*「 BIBLIOTECA 」*_\n_— Conhecimento pode ser tão valioso quanto poder, Jogador. Aqui estão reunidas as informações essenciais sobre este mundo, suas regras, sistemas, mecânicas e tudo aquilo que poderá encontrar durante sua jornada. Antes de avançar às cegas, descubra como este mundo realmente funciona._\n\n_*Comandos:*_\n_• !Atributos Físicos_\n_• !Atributos Mágicos_\n_• !Atributos Adicionais_\n_• !Únicos_\n_• !Estilos de Luta_\n_• !Passivas_\n_• !Títulos_\n_• !Portais_`,
    entries: [
      e('atributos-fisicos','Atributos Físicos','!Atributos Físicos','Explica os atributos físicos do Sistema','Força representa potência corporal; Resistência, durabilidade; Velocidade, deslocamento e reflexos; Sentidos, percepção, precisão e rastreamento.','atributos.js','linked','/personagem'),
      e('atributos-magicos','Atributos Mágicos','!Atributos Mágicos','Explica os atributos mágicos do Sistema','Inteligência participa do controle/eficiência de energia e Mana máxima; Poder Mágico define potência quando a técnica assim determinar.','atributos.js','linked','/personagem'),
      e('atributos-adicionais','Atributos Adicionais','!Atributos Adicionais','Exibe atributos adicionais e cálculos derivados','Sistema de Impacto, Nirvana, Percepção, Vitalidade e cálculos de dano conforme a implementação atual do bot.','atributos.js','bot-only'),
      e('unicos','Únicos','!Únicos','Itens e sistemas únicos','Conteúdo exclusivo e limitado.','unicos.js','bot-only'),
      e('estilos-luta','Estilos de Luta','!Estilos de Luta','Lista estilos de luta disponíveis com técnicas','Mostra estilo, arma, descrição, técnica, custo e requisitos.','estilosLuta.js','linked','/habilidades'),
      e('passivas','Passivas','!Passivas','Lista as passivas disponíveis por categoria','Passivas são capacidades permanentes conquistadas na jornada de um Caçador e ficam sempre ativas quando registradas.','passivas.js','linked','/titulos'),
      e('titulos','Títulos','!Títulos','Lista os títulos disponíveis por categoria','Mostra todos os títulos do sistema organizados por categoria.','titulos.js','functional','/titulos'),
      e('portais','Portais','!Portais','Abre o menu de Portais e Dungeons','Reúne incursões, ficha de Dungeon, progressão, conclusão, escolhas e mineração.','portais.js','functional','/mapa'),
    ],
  },
  {
    id: 'historia',
    title: 'História',
    eyebrow: 'CRÔNICAS DO MUNDO',
    intro: 'Sua jornada não será feita apenas de batalhas, Jogador. Aqui encontrará missões, capítulos e acontecimentos que conduzem a narrativa deste mundo.',
    botText: `_*「 HISTÓRIA 」*_\n_— Sua jornada não será feita apenas de batalhas, Jogador. Aqui encontrará missões, capítulos e acontecimentos que conduzem a narrativa deste mundo._\n\n_*Comandos:*_\n_• !Ler História_\n_• !Missões_\n_• !Fragmentos_\n_• !Monarcas_\n_• !Governantes_\n_• !Sucessores_`,
    entries: [
      e('ler-historia','Ler História','!Ler História','Abre o canal da história oficial do RPG','Apresenta o canal oficial onde prólogos, episódios e acontecimentos são publicados.','lerHistoria.js','bot-only'),
      e('missoes','Missões','!Missões','Exibe as missões disponíveis do jogador','Mostra missões ativas, progresso e recompensas.','missoes.js','functional','/missoes'),
      e('fragmentos','Fragmentos','!Fragmentos','Sistema de Fragmentos dos Governantes','Como se tornar um Fragmento, ranks, passivas e Skill Domínio.','fragmentos.js','bot-only'),
      e('monarcas','Monarcas','!Monarcas','Sistema de Monarcas','Informações sobre os Monarcas do RPG.','monarcas.js','bot-only'),
      e('governantes','Governantes','!Governantes','Lista os Governantes disponíveis','Mostra cada Governante, seu elemento e tema.','governantes.js','bot-only'),
      e('sucessores','Sucessores','!Sucessores','Sistema de sucessores','Gerenciamento de sucessores e herdeiros.','sucessores.js','bot-only'),
    ],
  },
  {
    id: 'dungeon',
    title: 'Dungeon Semanal',
    eyebrow: 'INCURSÃO ESPECIAL',
    intro: 'Consulte a incursão especial liberada, seus objetivos, regras e recompensas.',
    botText: `_*「 DUNGEON SEMANAL 」*_ — Consulte a incursão especial liberada, seus objetivos, regras e recompensas.\n*Use: !Consultar Dungeon Semanal*`,
    entries: [
      e('dungeon-semanal','Consultar Dungeon Semanal','!Consultar Dungeon Semanal','Consulta a Dungeon Semanal liberada','Mostra tema, Rank, objetivos, regras, duração e recompensas da incursão semanal.','consultarDungeonSemanal.js','functional','/dungeons'),
      e('abrir-dungeon','Abrir Dungeon','!Abrir Dungeon','Abre uma Dungeon vinculada à chave do jogador','Sorteia aleatoriamente uma dungeon da database e vincula à chave do jogador.','abrirDungeon.js','bot-only'),
      e('concluir-dungeon','Concluir Dungeon','!Concluir Dungeon','Valida e conclui uma Dungeon','Reconhece ficha, valida participantes, rank e participação semanal e aplica premiações gerais.','concluirDungeon.js','bot-only'),
      e('ficha-dungeon','Ficha de Dungeon','!Ficha de Dungeon','Exibe o modelo de ficha da Dungeon','Mostra nome, descrição, tema, rank e participantes para preenchimento.','fichaDungeon.js','bot-only'),
    ],
  },
  {
    id: 'acervo',
    title: 'Acervo',
    eyebrow: 'NPCS, RELAÇÕES E OFÍCIOS',
    intro: 'Aqui estão informações sobre personagens, interações, relações e missões ligadas àqueles que habitam este mundo.',
    botText: `_*「 ACERVO 」*_\n_— Aqui estão informações sobre personagens, interações, relações e missões ligadas àqueles que habitam este mundo._\n\n_*Comandos:*_\n_• !Amizade_\n_• !Npc — guia completo de interação_\n_• !Listar Npcs — lista completa de NPCs_\n\n_*Extras:*_\n_• !Fermentação_\n_• !Bigorna_\n_• !Encantamento_\n\n_*Profissionais:*_\n_• Ferreiro Bilac — !Olá Bilac_\n\n_Bilac trabalha com forjas de Rank E a B. Abra a oficina e siga as instruções do Sistema._`,
    entries: [
      e('amizade','Amizade','!Amizade','Consulta vínculo e hostilidade com NPCs','Lista relações concluídas e permite consultar vínculo, hostilidade, informações conhecidas e resumo da última cena.','amizade.js','linked','/npcs'),
      e('npc','NPC','!Npc','Explica o sistema narrativo de NPCs e como realizar cenas','Guia de memória, relacionamento, início, continuação e encerramento de interações com NPCs.','npc.js','functional','/npcs'),
      e('listar-npcs','Listar NPCs','!Listar Npcs','Lista todos os NPCs carregados pelo sistema','Organiza os NPCs por categoria e apresenta nome, localização e comando individual.','listarNpcs.js','functional','/npcs'),
      e('fermentacao','Fermentação','!Fermentação','Sistema de fermentação e criação','Cria itens através de fermentação.','fermentacao.js','bot-only'),
      e('bigorna','Bigorna','!Bigorna','Sistema de melhoramento de equipamentos','Recurso exclusivo da classe avançada Ferreiro; a forja usa materiais e cena aprovada pela mesa.','bigorna.js','bot-only'),
      e('encantamento','Encantamento','!Encantamento','Sistema de encantamentos','Recurso exclusivo da classe avançada Arcanista; registra propostas de efeito para aprovação narrativa.','encantamento.js','bot-only'),
      e('bilac','Ferreiro Bilac','!Olá Bilac','Abre a oficina do Ferreiro Bilac','Bilac trabalha com forjas de Rank E a B. Abra a oficina e siga as instruções do Sistema.','acervo.js','bot-only'),
    ],
  },
];

export const complementarySystems: ArchitectEntry[] = [
  e('gacha','Gacha','!Gacha','Lista Banners, mostra detalhes e realiza 1 ou 10 giros','Use !gacha girar <id> ou !gacha girar10 <id>; custos de 100 e 1.000 Cristais.','gacha.js','functional','/gacha'),
  e('skills','Skills','!Skills','Abre o menu de habilidades e técnicas do jogador','Reúne Maestria, Técnicas e consulta de Técnicas por classe.','skills.js','functional','/habilidades'),
  e('loja-virtual','Loja Virtual','!Loja Virtual','Abre o menu da loja virtual','Reúne loja, itens, saldo, histórico de compras e indicação da futura DLC.','lojaVirtual.js','functional','/loja'),
  e('drops','Drops','!Drops','Abre o menu de recursos obtidos em batalhas e Dungeons','Reúne Núcleos, Materiais, lojas de recursos e Caixas.','drops.js','linked','/inventario'),
];

export const architectRootText = `_*「 ARQUITETO 」*_\n_— Veja aqui aquilo que procura. Você, Jogador, entrou em um mundo tomado por Portais, Dungeons, Caçadores e criaturas que desafiam a compreensão humana. Em Solo Leveling: Ragnarok, poder, conhecimento e escolhas determinam até onde você chegará, e existem forças muito maiores agindo nas sombras. Antes de seguir adiante, saiba onde está se metendo — procure aqui aquilo que deseja saber._`;
