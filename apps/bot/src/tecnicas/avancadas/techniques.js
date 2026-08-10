/**
 * TÉCNICAS AVANÇADAS - VERSÃO CORRIGIDA
 * 
 * Apenas as técnicas enviadas pelo usuário.
 * Uma técnica por nível (40, 50, 60, 70, 80).
 */

const advancedTechniques = {
    // =====================================
    // HRYMIR
    // =====================================
    "Hrymir": [
        {
            nome: "Instrumento Divino",
            classe: "Hrymir",
            categoria: "Avançada",
            tipo: "Passiva",
            descricao: "Cada Instrumento Divino nasce de um pacto com um espírito solto. Para criá-lo, o Hrymir deve conceder dois nomes ao espírito: um nome humano, que sela a identidade da alma, e um nome de recipiente, que define a forma de sua nova existência. Este nome será gravado espiritualmente no corpo da alma, marcando-a como propriedade legítima do Hrymir. Ao completar o ritual, o espírito é imbuído em uma arma, armadura ou acessório, passando a ocupar o respectivo slot do personagem como equipamento vivo. Hrymir não pode usar armas ou acessórios convencionais, apenas Instrumentos Divinos podem preencher seus espaços de equipamento. A cada 15 dias, um novo espírito solto pode ser encontrado e convertido. Todos os Instrumentos Divinos evoluem com os atributos do usuário, ganhando poder proporcional a 20% de seu Poder Mágico ou Força. Ao se tornar um Hrymir, o jogador recebe imediatamente dois Instrumentos Divinos de sua escolha.",
            custo_mana: "11.000 MP",
            cooldown: 0,
            nivel_desbloqueio: 40
        },
        {
            nome: "Instrumento Divino: Forma Vessel",
            classe: "Hrymir",
            categoria: "Avançada",
            tipo: "Ativa",
            descricao: "O poder do Hrymir vai além da comunicação com os mortos. Com o Form Vessel, um Instrumento Divino é capaz de assumir formas físicas tangíveis, adaptando-se à vontade e necessidade do invocador. Ao entoar o nome selado do espírito, o recipiente se manifesta no mundo físico, transformando-se em um objeto específico: seja uma arma letal, uma peça de vestuário encantada ou até mesmo uma criatura viva. A forma escolhida pode permanecer ativa por até 7 turnos. Após isso, o instrumento retorna ao seu estado espiritual. Um único espírito só pode manter uma forma por vez.",
            custo_mana: "7.000 MP",
            cooldown: 5,
            nivel_desbloqueio: 50
        },
        {
            nome: "Instrumento Divino: Form Vessel-Blessed [Passiva]",
            classe: "Hrymir",
            categoria: "Avançada",
            tipo: "Passiva",
            descricao: "Há vínculos entre Hrymir e seus Instrumentos Divinos que transcendem o simples pacto espiritual. Blessed é a forma suprema de manifestação de um espírito vinculado, nascida do sacrifício, alimentada pela lealdade e selada no calor da morte. Ela não pode ser forçada, nem invocada por comando. Só se revela quando um Instrumento Divino, por sua própria vontade, escolhe arriscar tudo para proteger seu mestre. Ao assumir sua forma Vessel sob o efeito de Blessed, o Instrumento Divino recebe um impulso colossal: 80% dos atributos de Poder Mágico ou Força do usuário são transferidos diretamente para sua forma física. O espírito, ao escolher esse caminho, pode nunca mais retornar.",
            custo_mana: "Nulo",
            cooldown: 0,
            nivel_desbloqueio: 60
        },
        {
            nome: "Templo [Passiva]",
            classe: "Hrymir",
            categoria: "Avançada",
            tipo: "Passiva",
            descricao: "A técnica Templo é baseada no poder que vem da adoração e da crença das pessoas. Atributos permanentes são ganhos com base no número de pessoas que presenciam suas ações. A cada pessoa que testemunha sua presença ou escuta sua história, você ganha 10 pontos de atributo permanentes. A classe recebe um acréscimo de 25 atributos por cada up de tier. Se realizar feitos bondosos e heroicos diante de uma grande audiência, você poderá ganhar 50 pontos de atributo adicionais ao final do evento. Quando outros constroem um templo em sua homenagem, todos os que estão dentro ou nas proximidades recebem 40% de aumento em força ou poder mágico. Para cada Instrumento Divino guardado em seu templo, você ganha 20 pontos de atributo em poder mágico e força.",
            custo_mana: "Nulo",
            cooldown: 0,
            nivel_desbloqueio: 70,
            custo_won: "5.000.000 Wons para construir um templo"
        }
    ],

    // =====================================
    // FREYR
    // =====================================
    "Freyr": [
        {
            nome: "Majin",
            classe: "Freyr",
            categoria: "Avançada",
            tipo: "Ativa",
            descricao: "Os usuários da classe Freyr possuem uma afinidade única com espíritos negativos, conhecidos como Majins. Esses espíritos se originam dos sentimentos ruins mais profundos das pessoas. Ao ascender para a classe Freyr, o jogador ganha a habilidade de selar esses Majins, impedindo sua morte completa e prendendo-os dentro de objetos metálicos. Para dominar essa arma, o Freyr deve escolher entre dois métodos: Método do Dado (uma vez por semana, lançar um dado e escolher 4 números, se acertar 3 dos 4 o Majin se submete) ou Método das Cenas (interpretar 7 cenas únicas de interação com a arma, uma por dia). Freyr usa itens da loja normal para selar os Majins. Quando selado, a arma ganha status iguais a 30% dos status do Boss ou os pontos máximos de um equipamento único daquele rank.",
            custo_mana: "12.000 MP (Ascensão)",
            cooldown: 0,
            nivel_desbloqueio: 40
        },
        {
            nome: "Instrumento Demoníaco: Metal Vessel - Vessel Elemental",
            classe: "Freyr",
            categoria: "Avançada",
            tipo: "Ativa",
            descricao: "Metal Vessels são objetos de metal puro que servem como receptáculo para aprisionar Majins. Quando um Majin é selado, sua essência se funde ao objeto, tornando-o senciente. Cada Metal Vessel possui predisposição elemental. Vessel Elemental: O usuário dispara uma rajada reta de energia elemental com base na predisposição do Majin selado. Essa rajada percorre até 10 metros em linha reta, atravessando tudo em seu caminho. O tipo de dano e efeito secundário dependem do elemento do Majin.",
            custo_mana: "6.000 MP",
            cooldown: 0,
            nivel_desbloqueio: 50
        },
        {
            nome: "Equipamento Majin",
            classe: "Freyr",
            categoria: "Avançada",
            tipo: "Ativa",
            descricao: "Permite ao usuário assumir a forma humanoide comprimida do Majin selado em seu Metal Vessel. O usuário incorpora traços físicos do Majin: chifres, braços demoníacos, além de uma versão aprimorada do instrumento demoníaco. Durante a ativação, o Freyr recebe acesso direto às magias específicas daquele Majin e um aumento de 30% em Inteligência. Os atributos do equipamento escalam com base no Poder Mágico ou Força Base do usuário. Recebe também aumento adicional de 30% em Força ou Poder Mágico, dependendo de sua build principal.",
            custo_mana: "7.000 MP",
            cooldown: 0,
            custo_por_turno: "2.000 MP",
            nivel_desbloqueio: 60
        },
        {
            nome: "Equipamento Majin: Completo",
            classe: "Freyr",
            categoria: "Avançada",
            tipo: "Ativa",
            descricao: "A forma suprema da conexão entre um Freyr e seu Majin. O corpo do Freyr se transforma em uma versão humanoide e refinada da raça original do Majin, adornado com joias arcanas, marcas tribais reluzentes, e um ornamento central na testa representando o 'terceiro olho' dos Reis Demônios. O Freyr e o Majin compartilham uma consciência única. Permite utilizar magias e técnicas elementais com 70% de bônus de potência. Recebe +60% em todos os atributos físicos (Força, Agilidade, Resistência) e +50% em Inteligência. O equipamento Majin escala com Força ou Poder Mágico Base+30%.",
            custo_mana: "9.000 MP",
            cooldown: 0,
            custo_por_turno: "3.000 MP",
            nivel_desbloqueio: 70
        }
    ],

    // =====================================
    // BERSERK
    // =====================================
    "Berserk": [
        {
            nome: "Golpear",
            classe: "Berserk",
            categoria: "Avançada",
            tipo: "Física",
            descricao: "O jogador efetua 10 golpes contínuos para a frente, causando dano aos inimigos em um alcance de até 3 metros e rebatendo golpes físicos que tenham pelo menos 25% de atributos acima do seu. A resistência do alvo é ignorada em 4% por cada golpe contínuo acertado até um total de 40%. Efeitos mágicos não param o berseker e ignora quaisquer condições físicas e mágicas implementadas no seu corpo.",
            custo_mana: "2.000 MP",
            cooldown: 0,
            nivel_desbloqueio: 40
        },
        {
            nome: "A raiva me guia [Passiva/Ativa]",
            classe: "Berserk",
            categoria: "Avançada",
            tipo: "Passiva",
            descricao: "O berseker não sofre de efeitos colaterais físicos, não sofre efeitos de dor ao ser ferido, efeitos mágicos não o param (atordoar, congelar, imobilizar). Quando o berseker tomar um golpe fatal que o levaria a morte, entra em estado de 'Loucura'. Sofrendo todos efeitos mágicos que teria ignorado anteriormente, toda sensação dos ataques físicos volta em quádruplo da agonia. Gritando, virando uma verdadeira besta, aumentando seus atributos físicos 75% por dois turnos ganhando uma aura vermelha. Dentro desses dois turnos o berseker não pode morrer de forma alguma, regenerando membros perdidos. Pós esses 2 turnos, o berseker desmaia.",
            custo_mana: "Toda mana restante",
            cooldown: 0,
            nivel_desbloqueio: 50
        },
        {
            nome: "Besta implacável",
            classe: "Berserk",
            categoria: "Avançada",
            tipo: "Física",
            descricao: "O berseker recebe 'Golpes de concussão' como um aumento da sua extensão muscular, deixando as mãos com uma aura preta. Quando efetuar golpes precisos, impacta o inimigo arremessando longe e causando +50% de dano como impacto.",
            custo_mana: "4.000 MP",
            cooldown: 0,
            duracao: "2 turnos",
            nivel_desbloqueio: 60
        },
        {
            nome: "Punho da Destruição",
            classe: "Berserk",
            categoria: "Avançada",
            tipo: "Física",
            descricao: "Concentrando um ataque exclusivo num único alvo, quando efetuar esse golpe direto, o peso do corpo, rotação de movimento, tração e grande aumento de massa muscular tende fazer o berseker gerar uma onda de ar pela pressão imposta nos punhos, criando uma sensação de 'Destruição'. O golpe único consiste num soco direto que a cada 500 de MP gastos aumenta em 12 sua força física desse golpe e +5% de dano.",
            custo_mana: "500 MP a cada +12 de Força e 5% de dano",
            cooldown: 0,
            nivel_desbloqueio: 70
        },
        {
            nome: "O meu inimigo",
            classe: "Berserk",
            categoria: "Avançada",
            tipo: "Física",
            descricao: "Essa técnica não pode ser usada no primeiro turno, deve ser usada depois do quinto e gasta toda reserva de mana. Para cada 1% de mana restante dos 100%, aumenta o dano causado em 3% chegando até 300%. O berseker mira num único alvo, escolhendo-o desde início da batalha. Se até o quinto turno este alvo não estiver fora de batalha, o berseker pode avançar contra seu inimigo, ignorando qualquer efeito sobrepujado contra si [exceto morte]. Quando conseguir chegar em seu alvo, o pegará, jogando no chão e iniciando uma onda de golpes consecutivos (1% mana = 1 golpe), batendo-o no solo, pisando, socando sem parar até que esteja satisfeito.",
            custo_mana: "Todo MP",
            cooldown: 0,
            nivel_desbloqueio: 80
        }
    ],

    // =====================================
    // HERÓI DO ESCUDO
    // =====================================
    "Herói do Escudo": [
        {
            nome: "Cardinal Scale [Passiva]",
            classe: "Herói do Escudo",
            categoria: "Avançada",
            tipo: "Passiva",
            descricao: "Ao atingir esta etapa, o usuário fica impedido de equipar qualquer outra arma nos slots designados, sendo restrito exclusivamente ao uso de sua Arma Lendária. Essa arma, que pode assumir a forma de um Escudo, Espada, Lança ou Arco, é desbloqueada automaticamente ao alcançar esta progressão, tornando-se a única arma utilizável pelo portador.",
            custo_mana: "Nulo",
            cooldown: 0,
            nivel_desbloqueio: 40
        },
        {
            nome: "Mana Boost",
            classe: "Herói do Escudo",
            categoria: "Avançada",
            tipo: "Ativa",
            descricao: "Os heróis possuem uma energia especial chamada Mana Boost (MB), extraída automaticamente de suas Armas Lendárias. Ao canalizar MB na arma, os efeitos dos atributos e das técnicas são amplificados em 15%. Esse aprimoramento cresce progressivamente, aumentando na mesma proporção a cada 20 níveis. A barra de MB pode ser carregada uma única vez durante o combate. Uma vez aplicada a uma Arma Lendária, permanece vinculada até o fim do uso da técnica.",
            custo_mana: "5.000 MP",
            cooldown: 4,
            duracao: "4 Turnos",
            nivel_desbloqueio: 50
        },
        {
            nome: "Underworld Core",
            classe: "Herói do Escudo",
            categoria: "Avançada",
            tipo: "Ativa",
            descricao: "Permite ao usuário compartilhar os métodos de power-up de outras armas a partir do rank C. Armas, itens ou runas podem ser dissolvidos para forjar armas ou escudos que incorporem seus efeitos. Ao tocar outra arma do mesmo tipo e mantê-la por um turno inteiro, o usuário pode copiar ou clonar sua descrição. Núcleo de Boss: Ao utilizar absorção de núcleo, uma nova arma é forjada com características do boss derrotado. Armas Sacrificadas: Efeitos podem ser dissolvidos e incorporados (nerf: 1x a cada 3 semanas). Cópia: Copiar propriedades ao manter contato por 1 turno (nerf: 1x por semana).",
            custo_mana: "6.000-8.000 MP",
            cooldown: 0,
            nivel_desbloqueio: 60
        },
        {
            nome: "The Rise of the Hero [Passiva]",
            classe: "Herói do Escudo",
            categoria: "Avançada",
            tipo: "Passiva",
            descricao: "Quanto mais tempo a arma for utilizada, maiores serão os atributos e o rank dos itens vinculados a ela. Escudo: +10 em Resistência a cada semana de uso. Espada: +10 de Força a cada semana. Lança: +10 de Agilidade semanalmente. Arco: +10 de PM a cada semana.",
            custo_mana: "Nulo",
            cooldown: 0,
            nivel_desbloqueio: 70
        },
        {
            nome: "Weapon of Trial [Passiva]",
            classe: "Herói do Escudo",
            categoria: "Avançada",
            tipo: "Passiva",
            descricao: "Manifesta-se quando um herói enfrenta um trauma intenso durante uma batalha. A ativação ocorre automaticamente quando o herói está à beira da morte. Uma nova arma surge adaptada especificamente para o desafio, podendo ter propriedades que neutralizam as forças do inimigo. Enquanto ativa, o sangue do herói é estancado, impedindo morte imediata durante aquele combate específico.",
            custo_mana: "Nulo",
            cooldown: 0,
            nivel_desbloqueio: 80
        }
    ],

    // =====================================
    // CONSTRUTOR
    // =====================================
    "Construtor": [
        {
            nome: "Forjador",
            classe: "Construtor",
            categoria: "Avançada",
            tipo: "Suporte",
            descricao: "O construtor consegue criar itens que podem ir desde armaduras e espadas físicas. Os atributos da arma forjada vão de acordo com o rank dele (primeiro manda pra adm para aprovar a arma e dar os buffs). Para armas com efeitos mágicos, é necessário itens terciários que possuam tal efeito na hora da forja, ou o construtor pode utilizar de runas e as fundir com a arma.",
            custo_mana: "Nulo",
            cooldown: 0,
            nivel_desbloqueio: 40
        },
        {
            nome: "Identificar",
            classe: "Construtor",
            categoria: "Avançada",
            tipo: "Suporte",
            descricao: "Permite ao usuário identificar itens não identificados (necessário ter uma loja). Quanto maior o nível de Habilidade, maiores as chances de adicionar Buff nos status do item. Buff de 10% em ítens rank-C, 20% em rank-B, 30% em rank-A e 40% em Rank-S. Aumentar atributos não aumenta o rank dos itens.",
            custo_mana: "3.000 MP",
            cooldown: 0,
            nivel_desbloqueio: 50
        },
        {
            nome: "Expor Fraqueza",
            classe: "Construtor",
            categoria: "Avançada",
            tipo: "Física",
            descricao: "Após acertar o oponente com uma arma, o usuário é capaz de marcá-lo com uma marca. Essa marca dá um debuff de +25% de chance de levar um crítico. Caso alguém ataque o oponente no lugar marcado, o ataque ganha +60% de dano no local.",
            custo_mana: "3.500 MP",
            cooldown: 0,
            nivel_desbloqueio: 60
        },
        {
            nome: "Upgrader",
            classe: "Construtor",
            categoria: "Avançada",
            tipo: "Suporte",
            descricao: "Permite ao usuário aprimorar temporariamente todos os itens equipados com um buff de 10% a cada rank do ítem a partir do rank-C. O Buff dura 3 turnos.",
            custo_mana: "5.000 MP",
            cooldown: 0,
            duracao: "3 turnos",
            nivel_desbloqueio: 70
        },
        {
            nome: "Invocação Especial: Martelo de Guerra",
            classe: "Construtor",
            categoria: "Avançada",
            tipo: "Física",
            descricao: "Permite o Construtor invocar um martelo gigante exclusivo (aparência personalizada) para o campo de batalha. O martelo toma o slot de arma principal enquanto ativo. Possui força total de 2x da Força do usuário, mas para empunhá-lo, precisa ter no mínimo 80% do atributo do martelo em resistência.",
            custo_mana: "8.000 MP (invocação)",
            cooldown: 0,
            custo_por_turno: "3.000 MP",
            nivel_desbloqueio: 80
        }
    ],

    // =====================================
    // PALADINO
    // =====================================
    "Paladino": [
        {
            nome: "Poder Sagrado — Faith [Passiva]",
            classe: "Paladino",
            categoria: "Avançada",
            tipo: "Passiva",
            descricao: "O atributo 'Defesa' do usuário passa a ser convertido em 'Faith'. Esse atributo representa a fé sagrada manifestada fisicamente, transformando qualquer item com 'Defesa' em fontes diretas de Faith. O atributo Faith aprimora o poder sagrado, podendo ser somado ao Poder Mágico base na ativação de habilidades. Todas as técnicas que aumentam a Defesa também aumentam o Poder Mágico na mesma proporção.",
            custo_mana: "Nulo",
            cooldown: 0,
            nivel_desbloqueio: 40
        },
        {
            nome: "Excalibur",
            classe: "Paladino",
            categoria: "Avançada",
            tipo: "Mágica",
            descricao: "Reunindo energia mágica azulada e dourada ao redor de sua lâmina, o usuário conjura uma espada espiritual gigantesca sobre sua própria arma. Com um movimento veloz, desfere um corte à frente, liberando uma onda cortante de pura energia sagrada que percorre uma linha reta em alta velocidade. A onda cresce em poder conforme se desloca, ganhando +10% de Poder Mágico e +10% de Força para cada metro percorrido, com alcance total de 20 metros.",
            custo_mana: "1.000 MP (+500 MP a cada 2 metros adicionais)",
            cooldown: 0,
            nivel_desbloqueio: 50
        },
        {
            nome: "Santuário Iluminado",
            classe: "Paladino",
            categoria: "Avançada",
            tipo: "Defesa",
            descricao: "O usuário invoca um círculo mágico sagrado com 15 metros de raio, criando um campo brilhante e protetor. Todos os aliados dentro dessa área recebem +25% na Defesa Física e Mágica. O usuário acumula toda a DEF base combinada de cada aliado presente como dano adicional em seu próximo ataque.",
            custo_mana: "8.000 MP",
            cooldown: 0,
            nivel_desbloqueio: 60
        },
        {
            nome: "Punição de Fé",
            classe: "Paladino",
            categoria: "Avançada",
            tipo: "Defesa",
            descricao: "O usuário libera uma onda sagrada que afasta todos os inimigos ao redor, ignorando completamente seus atributos de resistência, força ou defesa. Conjura uma barreira de luz divina que dura 2 turnos, impedindo que qualquer inimigo entre na área protegida. Enquanto dentro da barreira, todos os aliados recebem a mesma Defesa que o usuário.",
            custo_mana: "5.000 MP",
            cooldown: 0,
            duracao: "2 turnos",
            nivel_desbloqueio: 70
        },
        {
            nome: "Cruz do Senhor!",
            classe: "Paladino",
            categoria: "Avançada",
            tipo: "Defesa",
            descricao: "O paladino conjura uma cruz sagrada de 3 metros envolta de seu escudo, formando uma barreira divina em uma direção escolhida por 1 turno. A cruz atrai e intercepta todos os projéteis e técnicas lançadas daquela direção. O primeiro ataque é completamente anulado, e os demais têm dano reduzido em 60%. O efeito se estende a qualquer aliado posicionado atrás do escudo.",
            custo_mana: "7.600 MP",
            cooldown: 0,
            duracao: "1 turno",
            nivel_desbloqueio: 80
        }
    ],

    // =====================================
    // ESCUDEIRO
    // =====================================
    "Escudeiro": [
        {
            nome: "Bandeira da Moral",
            classe: "Escudeiro",
            categoria: "Avançada",
            tipo: "Suporte",
            descricao: "Permite ao usuário invocar uma bandeira que eleva a moral do grupo. O Ataque dos aliados recebe um buff de 15% em cada estágio sobre uma área de 30m. 1 estágio pode ser obtido a cada 1 turno (máx: 3 estágios). Só pode invocar uma bandeira por turno.",
            custo_mana: "5.500 MP",
            cooldown: 0,
            nivel_desbloqueio: 40
        },
        {
            nome: "Melhoramento de Equipamento",
            classe: "Escudeiro",
            categoria: "Avançada",
            tipo: "Suporte",
            descricao: "Durante 2 turnos, o Escudeiro pode melhorar os atributos de companheiros ao colocar mana sobre seus equipamentos, rendendo um Buff de 20% nos status do equipamento. A cada equipamento aprimorado, o Escudeiro ganha +5% de XP acumulativo (máx: +80% de XP).",
            custo_mana: "3.000 MP por equipamento",
            cooldown: 0,
            nivel_desbloqueio: 50
        },
        {
            nome: "Vínculo de Dano",
            classe: "Escudeiro",
            categoria: "Avançada",
            tipo: "Física",
            descricao: "Permite que o usuário marque um inimigo e faça com que o dano daquele inimigo seja compartilhado para todos os outros inimigos em uma área de 15m. O dano compartilhado só funciona caso o inimigo marcado seja acertado pelo Ataque.",
            custo_mana: "6.000 MP",
            cooldown: 0,
            nivel_desbloqueio: 60
        },
        {
            nome: "Link Físico",
            classe: "Escudeiro",
            categoria: "Avançada",
            tipo: "Suporte",
            descricao: "Vincule o usuário junto dos membros de sua equipe. Enquanto Todos estiverem vinculados, todo o dano recebido por qualquer Membro em uma área de 10m será compartilhado. O vínculo permite dividir o dano pelo número de pessoas vinculadas (2: 50%, 3: 33%, 4: 25%). Pode ser quebrado por ataques com PM/FOR maior que a PM do usuário.",
            custo_mana: "3.000 MP por pessoa",
            cooldown: 0,
            nivel_desbloqueio: 70
        },
        {
            nome: "Linha do Companheirismo",
            classe: "Escudeiro",
            categoria: "Avançada",
            tipo: "Suporte",
            descricao: "Permite ao usuário compartilhar todas suas estatísticas com seus aliados em uma área de 15m. Não pode ser ativada com Link físico. A quantidade compartilhada é de 40%, mas caso o usuário já tenha completado 20 dungeons junto de seus companheiros, essa quantidade dobra para 80%.",
            custo_mana: "5.000 MP",
            cooldown: 0,
            nivel_desbloqueio: 80
        }
    ],

    // =====================================
    // UTHABITI
    // =====================================
    "Uthabiti": [
        {
            nome: "Flor da Cavalaria [Passiva]",
            classe: "Uthabiti",
            categoria: "Avançada",
            tipo: "Passiva",
            descricao: "Os ataques físicos do usuário causam dano com base na sua Defesa em vez do seu Ataque. O dano causado é igual ao valor atual da Defesa do usuário, ignorando completamente o valor de Ataque. Efeitos que aumentam ou reduzem a Defesa afetam diretamente o dano causado.",
            custo_mana: "Nulo",
            cooldown: 0,
            nivel_desbloqueio: 40
        },
        {
            nome: "Presença Inabalável",
            classe: "Uthabiti",
            categoria: "Avançada",
            tipo: "Física",
            descricao: "O usuário cria uma área mágica de 5x5 metros ao redor de si que prende os inimigos dentro dela, impedindo o uso de técnicas de escape ou saída. Se alguém tentar usar Dash dentro da área, será paralisado por 1 segundo. Qualquer um que tentar entrar na área será repelido e sofrerá o mesmo efeito de paralisia.",
            custo_mana: "7.750 MP",
            cooldown: 0,
            nivel_desbloqueio: 50
        },
        {
            nome: "Mais Inimigos, Mais cautela [Passiva]",
            classe: "Uthabiti",
            categoria: "Avançada",
            tipo: "Passiva",
            descricao: "Quando há 1/2/3/4 (ou mais) oponentes dentro da área de Presença Inabalável, o usuário ganha aumento de 8%/12%/16%/20% na sua Defesa, respectivamente. Máximo de até 200% de defesa.",
            custo_mana: "Nulo",
            cooldown: 0,
            nivel_desbloqueio: 60
        },
        {
            nome: "Choque em Área",
            classe: "Uthabiti",
            categoria: "Avançada",
            tipo: "Física",
            descricao: "O usuário golpeia o chão com força avassaladora, causando dano físico a todos os inimigos em uma área de 5x5 metros. Se houver inimigos paralisados na área, o usuário absorve 10% da mana de cada um e ganha +20% de Defesa por um turno para cada inimigo paralisado.",
            custo_mana: "7.500 MP",
            cooldown: 0,
            nivel_desbloqueio: 70
        },
        {
            nome: "Devoção",
            classe: "Uthabiti",
            categoria: "Avançada",
            tipo: "Defesa",
            descricao: "O usuário conjura um escudo mágico com 200% da sua Defesa, capaz de bloquear apenas ataques físicos direcionados a ele, durando 2 turnos. Durante esse período, não pode receber buffs externos, exceto os concedidos pela classe Uthabiti. Caso o escudo seja quebrado, o usuário recebe um buff de 400% de Defesa por 5 turnos, mas fica impossibilitado de usar técnicas mágicas ou passivas de outras classes.",
            custo_mana: "11.000 MP",
            cooldown: 0,
            nivel_desbloqueio: 80
        }
    ],

    // =====================================
    // MORAX
    // =====================================
    "Morax": [
        {
            nome: "Dominus Lapidis",
            classe: "Morax",
            categoria: "Avançada",
            tipo: "Física",
            descricao: "O usuário se envolve em uma armadura de pedra, aumentando seu tamanho em 3 metros e se transformando em um Golém de Pedra, ganhando 15% de Ataque e 30% de Defesa. Se houver inimigos próximos com armas de curto alcance, ganha 10% de Ataque adicional para cada um. Caso haja inimigos entre 10m e 20m com armas de longo alcance, ganha 10% de Defesa adicional para cada um. Dura 5 turnos.",
            custo_mana: "4.000 MP",
            cooldown: 0,
            duracao: "5 turnos",
            nivel_desbloqueio: 40
        },
        {
            nome: "Escudo de Jade",
            classe: "Morax",
            categoria: "Avançada",
            tipo: "Defesa",
            descricao: "O usuário cria um escudo esverdeado que absorve 150% do dano recebido de todos os elementos, protegendo-o por 2 turnos. Enquanto ativo, inimigos próximos têm sua resistência base reduzida em 25%. Além disso, 40% do dano recebido é convertido em Mana para o usuário.",
            custo_mana: "5.000 MP",
            cooldown: 0,
            duracao: "2 turnos",
            nivel_desbloqueio: 50
        },
        {
            nome: "Canal de Terra",
            classe: "Morax",
            categoria: "Avançada",
            tipo: "Mágica",
            descricao: "Por 4 turnos, após usar o Escudo de Jade, o usuário pode converter todo o dano físico causado em dano mágico de natureza terra e aumentar seu Ataque em 40%. Caso ativado após Dominus Lapidis ser desativado naturalmente, ganha uma aura explosiva que causa dano mágico de terra equivalente a 400% da sua Defesa + Inteligência, atingindo todos os inimigos próximos.",
            custo_mana: "6.500 MP",
            cooldown: 0,
            nivel_desbloqueio: 60
        },
        {
            nome: "Hasote Flutuante",
            classe: "Morax",
            categoria: "Avançada",
            tipo: "Física",
            descricao: "O usuário avança com agilidade em uma direção, utilizando uma lâmina para cortar os inimigos (150% de velocidade por 0.1 segundo). Inimigos do lado direito sofrem dano mágico equivalente ao seu Ataque, enquanto inimigos do lado esquerdo sofrem dano físico equivalente à sua Inteligência. Caso possua maestria em espada, pode utilizar duas lâminas simultaneamente, causando dano adicional que ignora 50% da defesa do alvo.",
            custo_mana: "6.000 MP",
            cooldown: 0,
            nivel_desbloqueio: 70
        },
        {
            nome: "Rei Oni",
            classe: "Morax",
            categoria: "Avançada",
            tipo: "Física",
            descricao: "Só pode ser ativada após todas as técnicas de Morax terem sido utilizadas pelo menos uma vez. O usuário manifesta uma forma poderosa, liberando dois chifres em sua testa. Durante a transformação, todo dano físico é combinado com dano mágico de terra. A velocidade de ataque aumenta em 20% para cada inimigo ou aliado dentro de 3 metros. A cada golpe acertado, a velocidade de ataque aumenta em 30% e a chance de crítico em 10%. Dura 5 turnos. Se ambos os chifres forem quebrados, a técnica é desativada. Se apenas um for quebrado, a taxa de crítico aumenta em 100% durante 2 turnos.",
            custo_mana: "7.000 MP",
            cooldown: 0,
            duracao: "5 turnos",
            nivel_desbloqueio: 80
        }
    ],

    // =====================================
    // VIKING
    // =====================================
    "Viking": [
        {
            nome: "Juramento de Sangue [Passiva]",
            classe: "Viking",
            categoria: "Avançada",
            tipo: "Passiva",
            descricao: "Os Vikings possuem a capacidade única de fundar um clã de irmãos de batalha, selando um pacto de sangue com até cinco aliados. Enquanto ativo, todos os membros do clã recebem 10% dos atributos de Força, Resistência e Agilidade do Viking original. A bênção desaparece caso o Viking caia em batalha. Vikings são os únicos capazes de empunhar dois machados pesados (armas 2fp) simultaneamente. Quando um machado é arremessado, o Viking pode chamá-lo de volta.",
            custo_mana: "Nulo",
            cooldown: 0,
            nivel_desbloqueio: 40
        },
        {
            nome: "Leviathan - Golpe do Leviathan",
            classe: "Viking",
            categoria: "Avançada",
            tipo: "Física",
            descricao: "Passivo: Todos os machados empunhados pelo Viking passam a ser embuídos com magia congelante. Ativo: O Viking mira em vários inimigos dentro de seu campo de visão antes de arremessar o machado encantado. Para cada turno de preparação, o machado ganha mais dois impactos em diferentes alvos. O machado percorre o campo em alta velocidade, batendo em cada inimigo antes de retornar à mão do usuário. Inimigos atingidos recebem congelamento leve por 1 turno e redução de 30% na agilidade. Aumento de +20% a cada turno carregado.",
            custo_mana: "5.000 MP",
            cooldown: 3,
            custo_por_turno_carregado: "2.000 MP",
            alcance: "20M",
            nivel_desbloqueio: 50
        },
        {
            nome: "Uivo do Viking",
            classe: "Viking",
            categoria: "Avançada",
            tipo: "Física",
            descricao: "O Viking solta um uivo primal, profundo e selvagem. Todos os inimigos em um raio de 5 metros são tomados por uma aura vermelha intensa, tendo sua agilidade reduzida em 30% por 2 turnos. Ao mesmo tempo, os aliados próximos são banhados por uma aura branca luminosa, recebendo um bônus de 25% em resistência contra qualquer tipo de dano por 2 turnos.",
            custo_mana: "4.000 MP",
            cooldown: 1,
            nivel_desbloqueio: 60
        },
        {
            nome: "Subjugar",
            classe: "Viking",
            categoria: "Avançada",
            tipo: "Física",
            descricao: "O usuário libera uma energia opressora capaz de colapsar as defesas do inimigo. Mira um único alvo e rouba completamente toda a resistência daquele inimigo, reduzindo esse atributo a zero por 1 turno. Ao mesmo tempo, a resistência roubada é duplicada e concedida ao usuário, transformando-o temporariamente em uma muralha viva. Ignora imunidades convencionais.",
            custo_mana: "10.000 MP",
            cooldown: 5,
            nivel_desbloqueio: 70
        },
        {
            nome: "Ragnarok",
            classe: "Viking",
            categoria: "Avançada",
            tipo: "Física",
            descricao: "O Viking ativa o poder ancestral do fim dos tempos, envolvendo seu corpo em uma aura azul-gelo e dourada. Recebe um bônus de 30% em resistência e se torna completamente imune a qualquer tipo de debuff (físicos, mentais ou mágicos). Permanece ativa por 1 turno, mas para cada debuff que seria aplicado, ganha turnos adicionais equivalentes à duração total desses efeitos negados. Acumulativo.",
            custo_mana: "7.000 MP",
            cooldown: 0,
            nivel_desbloqueio: 80
        }
    ],

    // =====================================
    // LÂMINA SOMBRIA
    // =====================================
    "Lâmina Sombria": [
        {
            nome: "Alucinação",
            classe: "Lâmina Sombria",
            categoria: "Avançada",
            tipo: "Física",
            descricao: "O Dark Blader emana sua mana para fora de seu corpo por 2 turnos, causando um efeito de alucinação criando clones de impressão devido a velocidade de movimentação. Através deles, ele pode se mover entre os clones escondendo sua presença, impedindo que técnicas de localização o afetem diretamente enquanto esta técnica estiver ativa.",
            custo_mana: "4.500 MP",
            cooldown: 0,
            nivel_desbloqueio: 40
        },
        {
            nome: "Sombra Infernal",
            classe: "Lâmina Sombria",
            categoria: "Avançada",
            tipo: "Física",
            descricao: "Ao utilizar uma lâmina, o usuário corta diretamente a sombra de um inimigo, separando a mesma do corpo. Danos causados à sombra são direcionados diretamente ao corpo do original. Este efeito desaparece quando o inimigo toca em sua sombra novamente. A sombra tem a mesma quantidade de resistência que o corpo do original. Após 2 turnos, a sombra volta para o corpo original.",
            custo_mana: "5.000 MP",
            cooldown: 0,
            nivel_desbloqueio: 50
        },
        {
            nome: "Conjuração de Sombra",
            classe: "Lâmina Sombria",
            categoria: "Avançada",
            tipo: "Física",
            descricao: "O usuário expande sua própria sombra dentro de 3 metros quadrados. Em um círculo de sombras, qualquer inimigo que esteja em contato com a sombra é paralisado por 1 segundo, e qualquer ataque feito pelo lâmina sombria é acertado no corpo daquele que estiver tocando mesmo que não tenha mirado diretamente nele.",
            custo_mana: "6.000 MP",
            cooldown: 0,
            nivel_desbloqueio: 60
        },
        {
            nome: "Grilhão das Sombras",
            classe: "Lâmina Sombria",
            categoria: "Avançada",
            tipo: "Física",
            descricao: "Ao fixar a lâmina na sombra de um inimigo no chão, eles o prendem e evitam que o tal se mova durante 1 turno. Enquanto preso no chão, o inimigo recebe diminuição de 30% na sua resistência e o Dark Blader recebe nesse mesmo valor em agilidade.",
            custo_mana: "4.000 MP",
            cooldown: 0,
            nivel_desbloqueio: 70
        },
        {
            nome: "Piscina Sombria",
            classe: "Lâmina Sombria",
            categoria: "Avançada",
            tipo: "Física",
            descricao: "O usuário pode deslizar para as sombras para se esconder, puxar os outros para as sombras, e viajar entre sombras, mesmo aquelas que estão distantes umas das outras. Inimigos colocados dentro de sua sombra são paralisados, caso seja acertado por um ataque eles são expulsos da sombra. Após 1 Turno dentro da sombra o inimigo também é expulso.",
            custo_mana: "5.500 MP",
            cooldown: 0,
            nivel_desbloqueio: 80
        }
    ],

    // =====================================
    // SWORD DANCER
    // =====================================
    "Sword Dancer": [
        {
            nome: "Canção do Leão",
            classe: "Sword Dancer",
            categoria: "Avançada",
            tipo: "Física",
            descricao: "O usuário dá um corte ágil com sua empunhadura dupla no inimigo enquanto passa por ele. O Ataque possui um dano padrão, mas caso acerte o inimigo, ganha um Buff temporário na velocidade do ataque. Esse efeito é acumulativo, sempre que acertar o inimigo de forma consecutiva, a velocidade do próximo Ataque aumenta (+10% a cada ataque consecutivo/máximo de 50%).",
            custo_mana: "3.000 MP",
            cooldown: 0,
            nivel_desbloqueio: 40
        },
        {
            nome: "Desfiguração",
            classe: "Sword Dancer",
            categoria: "Avançada",
            tipo: "Física",
            descricao: "Usando da empunhadura dupla para cortar o inimigo várias vezes de forma contínua, o usuário dilacera qualquer inimigo que se encontre à sua frente. Inimigos atingidos têm seu dano diminuído em 7% de forma acumulativa caso for atacar o usuário (máximo de 8 combos).",
            custo_mana: "3.000 MP",
            cooldown: 0,
            nivel_desbloqueio: 50
        },
        {
            nome: "Emboscada Fatal",
            classe: "Sword Dancer",
            categoria: "Avançada",
            tipo: "Física",
            descricao: "O usuário armazena mana em sua empunhadura dupla por 2 Turnos e a libera toda de uma vez no inimigo, esse Ataque dá 70% a mais de dano no oponente. Devido ao tempo para armazenar a energia, esse Ataque pode ser interrompido por Ataques inimigos. Para usar de forma segura, o usuário pode usar em conjunto com Habilidades furtivas.",
            custo_mana: "5.000 MP",
            cooldown: 0,
            nivel_desbloqueio: 60
        },
        {
            nome: "Desprezo Pelos Fracos",
            classe: "Sword Dancer",
            categoria: "Avançada",
            tipo: "Física",
            descricao: "Após ativar essa técnica, os ataques feitos pela lâmina do usuário possuem a capacidade de causar dano mágico adicional. Caso o inimigo já esteja com vários cortes no Corpo feitos pelo usuário, possui um dano adicional de +50% de dano ao usar essa técnica, mas só funciona caso o Oponente tenha o requisito de estar todo cortado pelo usuário.",
            custo_mana: "5.500 MP",
            cooldown: 0,
            nivel_desbloqueio: 70
        },
        {
            nome: "Marca Final",
            classe: "Sword Dancer",
            categoria: "Avançada",
            tipo: "Física",
            descricao: "Durante 1 turno, o usuário é capaz de aplicar uma marca em Todos os Oponentes em uma área de 10m, todos os Ataques acertados nos marcados durante aquele turno ficam marcados em forma de 'X' que aparecem no peito do oponente. Após o final do turno, as marcas nos peitos dos oponentes estouram, causando dano mágico aos marcados.",
            custo_mana: "5.500 MP",
            cooldown: 0,
            nivel_desbloqueio: 80
        }
    ],

    // =====================================
    // CORSÁRIO
    // =====================================
    "Corsário": [
        {
            nome: "Brutalidade [Passiva]",
            classe: "Corsário",
            categoria: "Avançada",
            tipo: "Passiva",
            descricao: "Permite com que qualquer objeto usado pelo usuário, seja tanto mágico ou físico, tenha a capacidade de ignorar 40% de PM qualquer técnica de defesa mágica e também ignorar 40% da defesa física do oponente.",
            custo_mana: "Nulo",
            cooldown: 0,
            nivel_desbloqueio: 40
        },
        {
            nome: "Diabo da Poeira",
            classe: "Corsário",
            categoria: "Avançada",
            tipo: "Física",
            descricao: "Usando de uma arma com lâmina, o usuário a arrasta pelo chão, criando uma Nuvem de poeira imbuída em energia mágica, que se mantém por 5 turnos. A nuvem possui uma área de 30m e enquanto estiver dentro dela, nenhuma habilidade de localização pode ser usada, e caso uma esteja ativada, será interrompida. Efeito aplicado tanto em oponentes quanto aliados.",
            custo_mana: "4.000 MP",
            cooldown: 0,
            nivel_desbloqueio: 50
        },
        {
            nome: "Gancho do Corsário",
            classe: "Corsário",
            categoria: "Avançada",
            tipo: "Física",
            descricao: "Permite ao usuário manipular sua própria mana para criar um gancho em sua mão direita. Uma vez que o gancho acertar uma arma/equipamento/item, o usuário consegue puxar o gancho e tomar aquele item de forma permanente, podendo roubar tanto item de Boss quanto de outros jogadores.",
            custo_mana: "4.500 MP",
            cooldown: 0,
            nivel_desbloqueio: 60
        },
        {
            nome: "Capitão Corsário",
            classe: "Corsário",
            categoria: "Avançada",
            tipo: "Suporte",
            descricao: "Permite ao usuário colocar uma bandeira que aumenta as habilidades de combate de todos os membros da equipe em uma área de 20m. A bandeira aumenta os ganhos de xp em 20% caso o usuário e seus companheiros tenham matado 100 Inimigos dentro da área. Caso for um Boss, podem acertar 100 golpes nele, aumentando o Buff para +40% de xp.",
            custo_mana: "6.000 MP",
            cooldown: 0,
            custo_por_turno: "2.000 MP",
            nivel_desbloqueio: 70
        },
        {
            nome: "Barril de Pólvora",
            classe: "Corsário",
            categoria: "Avançada",
            tipo: "Física",
            descricao: "Permite ao usuário invocar Barris de pólvora em um local/alvo em uma área de 25m. Caso o barril seja atingido, ele explode causando dano a Todos em uma área de 5m, e reduzirá a agilidade do Oponente em 25% por 1 Turno. Caso invoque vários barris alinhados e os explode, cada barril terá dano subsequente de +20% a cada explosão seguida. Dano escalado pela força do usuário.",
            custo_mana: "4.000 MP por barril",
            cooldown: 0,
            nivel_desbloqueio: 80
        }
    ],

    // =====================================
    // SHINOBI
    // =====================================
    "Shinobi": [
        {
            nome: "Kage Bunshin no Jutsu",
            classe: "Shinobi",
            categoria: "Avançada",
            tipo: "Mágica",
            descricao: "Permite ao usuário criar clones com base no total de mana. A cada 30 Pontos em Inteligência vc pode criar um Clone adicional. Todos os seus status são iguais a 75% dos atributos totais do usuário. Esses clones atacam qualquer inimigo em volta de forma automática e também replicam técnicas de ataque shinobi. Mana deles é 75% da do usuário.",
            custo_mana: "4.000 MP",
            cooldown: 0,
            nivel_desbloqueio: 40
        },
        {
            nome: "Henge no Jutsu",
            classe: "Shinobi",
            categoria: "Avançada",
            tipo: "Mágica",
            descricao: "Permite ao usuário se transformar em qualquer coisa: humanos, animais, plantas e até mesmo algo inanimado, como armas. Não ganha as habilidades daquilo, apenas a Aparência. O tamanho e inspiração para a transformação importam. Mesmo transformado mantém os atributos bases.",
            custo_mana: "2.500 MP a cada/até 5M em uma transformação",
            cooldown: 0,
            nivel_desbloqueio: 50
        },
        {
            nome: "Ninjutsu Próprio",
            classe: "Shinobi",
            categoria: "Avançada",
            tipo: "Mágica",
            descricao: "Ao atingir o nível 70, o praticante de ninjutsu desbloqueia a habilidade de criar uma técnica única ou aprimorar uma técnica existente até o nível 10 da sua classe base. A técnica evolui para uma versão de classe avançada, redefinida para o nível 1, mantendo os efeitos originais ampliado em 10 níveis, mas com incremento significativo no custo de chakra.",
            custo_mana: "5.000 MP (Inicial)",
            cooldown: 0,
            nivel_desbloqueio: 70
        },
        {
            nome: "Shunshin no Jutsu",
            classe: "Shinobi",
            categoria: "Avançada",
            tipo: "Física",
            descricao: "Permite ao usuário se movimentar em alta velocidade, tão rápido ao ponto de ser quase indetectável. Quanto mais mana gasta na hora do uso, maior será a velocidade proporcionada.",
            custo_mana: "1.000 MP a cada +10% de velocidade (Máx: 100% por 1 turno)",
            cooldown: 0,
            nivel_desbloqueio: 60
        },
        {
            nome: "Handoshīru no Jutsu",
            classe: "Shinobi",
            categoria: "Avançada",
            tipo: "Mágica",
            descricao: "O usuário usa selos de mão e canaliza mana em sua boca para criar qualquer característica Elementar primária: Fogo, Vento, Água, Terra e Raio. Pode jogar essas características de sua boca no inimigo em uma área de 20m, ou canalizar essas características em técnicas já existentes (cortes de água, raio, etc).",
            custo_mana: "5.000 MP",
            cooldown: 0,
            nivel_desbloqueio: 80
        }
    ],

    // =====================================
    // THANAKIR
    // =====================================
    "Thanakir": [
        {
            nome: "Vínculo a vida [Passiva]",
            classe: "Thanakir",
            categoria: "Avançada",
            tipo: "Passiva",
            descricao: "Recebendo: O usuário absorve efeitos de cura e escudos que seriam aplicados a ele, impedindo que se recupere ou ganhe escudos por 2 turnos. Causando: Quando aplicado a um inimigo, o vínculo impede qualquer tipo de cura ou escudo recebido por 2 turnos. Ao Ascender a Thanakir, o usuário libera um elemento originário. Todas as técnicas subsequentes terão efeitos adaptados ao elemento escolhido.",
            custo_mana: "Nulo",
            cooldown: 0,
            nivel_desbloqueio: 40
        },
        {
            nome: "Vigília do caçador",
            classe: "Thanakir",
            categoria: "Avançada",
            tipo: "Ativa",
            descricao: "Causa a si mesmo o vínculo da vida. Enquanto sob o efeito, o usuário recebe efeitos de buff de velocidade e ataque aumentados em 50% do efeito original (passivas não entram nesse cálculo). Durante dois turnos, quando o efeito acabar o vínculo da vida some e o usuário ganha 'Aura da Noite', que concede sua lâmina dano mágico do elemento originário.",
            custo_mana: "4.000 MP",
            cooldown: 0,
            nivel_desbloqueio: 50
        },
        {
            nome: "Ultimo Anoitecer [Passivo-Ativo]",
            classe: "Thanakir",
            categoria: "Avançada",
            tipo: "Física",
            descricao: "O usuário aplica a si mesmo o Vínculo da Vida, ganhando força proporcional à gravidade de seus ferimentos. Para ferimentos leves, buff de 40% de força; para ferimentos graves, 200% de força; em caso de ferimentos fatais, 700% de força por 1 segundo e 100% de chance de crítico. Caso não possua ferimentos, causa apenas o dano base de ataque.",
            custo_mana: "7.000 MP",
            cooldown: 0,
            nivel_desbloqueio: 60
        },
        {
            nome: "Decapitação",
            classe: "Thanakir",
            categoria: "Avançada",
            tipo: "Física",
            descricao: "O usuário avança rapidamente, causando dano cortante ou perfurante a um inimigo e marcando-o com o Vínculo à Vida, impedindo que ele receba qualquer tipo de cura ou escudo. Se Thanakir acertar o mesmo ferimento no mesmo local novamente, ganha 100% de chance de crítico.",
            custo_mana: "4.500 MP",
            cooldown: 0,
            nivel_desbloqueio: 70
        },
        {
            nome: "Devaneio da Ascensão",
            classe: "Thanakir",
            categoria: "Avançada",
            tipo: "Mágica",
            descricao: "Passivo: Quando o usuário e um inimigo estão ligados pelo Vínculo à Vida, o usuário ganha a capacidade de rastreá-lo sem falhas, ignorando ocultação ou invisibilidade. Ativo 1: Manifesta uma aura elemental baseada no elemento originário, concedendo imunidade completa ao elemento e aumentando penetração mágica. Ativo 2: Ao sacrificar ambos os vínculos, canaliza energia residual para sua arma, criando uma aura elemental. Todos os ataques cortantes recebem buff de 50% da soma de Inteligência + Força.",
            custo_mana: "5.000 MP para ativar",
            cooldown: 0,
            nivel_desbloqueio: 80
        }
    ],

    // =====================================
    // NIDHOGG
    // =====================================
    "Nidhogg": [
        {
            nome: "Sopro do Dragão",
            classe: "Nidhogg",
            categoria: "Avançada",
            tipo: "Mágica",
            descricao: "O usuário concentra uma enorme quantidade de mana em seu peito, comprimindo-a como o coração de uma fera ancestral. Libera uma rajada destrutiva pela boca, formada por chamas ou energia púrpura, que se espalha em linha reta e deixa um rastro ardente. Escala diretamente com o Poder Mágico do usuário. A cada 5.000 MP de mana consumida, o poder da técnica aumenta em 20%, acumulativamente.",
            custo_mana: "5.000 MP",
            cooldown: 0,
            nivel_desbloqueio: 40
        },
        {
            nome: "Garra do Dragão",
            classe: "Nidhogg",
            categoria: "Avançada",
            tipo: "Física",
            descricao: "O usuário canaliza sua mana em forma pura e agressiva, moldando-a em garras dracônicas envoltas por uma aura roxa intensa. Podem se manifestar sobre as mãos ou os pés, transformando cada ataque físico em um golpe carregado de força mística. Caso esteja empunhando uma arma, uma aura em forma de dente de dragão roxo envolve a lâmina, aumentando alcance e ferocidade. Os cortes carregam energia cortante, podendo rasgar até defesas espirituais ou mágicas frágeis.",
            custo_mana: "7.600 MP (8.500 MP com arma)",
            cooldown: 0,
            nivel_desbloqueio: 50
        },
        {
            nome: "Rasgo Espacial",
            classe: "Nidhogg",
            categoria: "Avançada",
            tipo: "Mágica",
            descricao: "Com um gesto preciso, o usuário corta o próprio espaço à sua frente, rasgando o tecido da realidade. O corte não causa dano imediato, mas cria uma fenda estática capaz de armazenar uma técnica previamente preparada. A qualquer momento, o usuário pode liberar a técnica contida. Se nenhuma técnica for selada, após 1 turno o vazio absorbe o vácuo, tornando-se uma lâmina espacial pura que corta inimigos que a atravessam.",
            custo_mana: "8.600 MP",
            cooldown: 3,
            nivel_desbloqueio: 60
        },
        {
            nome: "Força do Dragão",
            classe: "Nidhogg",
            categoria: "Avançada",
            tipo: "Física",
            descricao: "O usuário passa por uma transformação parcial: asas negras ou púrpuras se abrem às suas costas, garras afiadas crescem em suas mãos e pés, e escamas resistentes surgem como uma segunda pele. Durante 3 turnos, os atributos Resistência, Força e Agilidade aumentam em 70%, concedendo velocidade sobre-humana, força esmagadora e defesa quase impenetrável.",
            custo_mana: "9.000 MP",
            cooldown: 4,
            custo_por_turno: "3.000 MP",
            duracao: "3 Turnos",
            nivel_desbloqueio: 70
        },
        {
            nome: "Fenda do Dragão",
            classe: "Nidhogg",
            categoria: "Avançada",
            tipo: "Mágica",
            descricao: "Manipulando as frestas entre os reais com sua energia dracônica, o Nidhogg rasga temporariamente o tecido do espaço, criando fendas sutis e quase invisíveis. Pode se teletransportar instantaneamente para qualquer ponto num raio de até 2 metros. Pode trocar de posição com um objeto ou alvo pequeno, estendendo o alcance para 5 metros. Pode também trocar a posição de dois alvos distintos de porte pequeno.",
            custo_mana: "9.000 MP por TP (10.000 MP por troca)",
            cooldown: 0,
            nivel_desbloqueio: 80
        }
    ],

    // =====================================
    // PNEUMA-OUSIA
    // =====================================
    "Pneuma-Ousia": [
        {
            nome: "Shinsu [Passiva]",
            classe: "Pneuma-Ousia",
            categoria: "Avançada",
            tipo: "Passiva",
            descricao: "O usuário é abençoado pelos céus, ganhando a capacidade de manipular água divina. Sua arma se adapta à forma que ele deseja. Envolto por uma aura azul-clara, absorve a umidade do ambiente, ganhando diferentes atributos conforme as condições climáticas: Sol radioso (Resistência a fogo -50%, água +20%), Nuvens (+15% Velocidade, cura feridas leves), Chuvisco (cura status negativos), Chuvoso (dano água +50%, fogo -50%), Neve (+15% velocidade, aliados recebem cura leve), Granizo (inimigos recebem 10% do dano como gelo), Folha (+10% ataque, crítico +40%), Tempestuoso (+30% poder, 40% chance de paralisar).",
            custo_mana: "Nulo",
            cooldown: 0,
            nivel_desbloqueio: 40
        },
        {
            nome: "Nīdorurein",
            classe: "Pneuma-Ousia",
            categoria: "Avançada",
            tipo: "Mágica",
            descricao: "Caso esteja chovendo no campo de batalha, o assassino transforma as gotas de chuva em Shinsu que caem sobre o campo, cada uma carregada com uma bênção da deusa. As gotas se transformam em lâminas afiadas que causam dano igual a 40% da força do usuário, e têm chance de causar paralisia. A cada turno que passa, a porcentagem da chuva aumenta (40%, 50%, 60%... até 100%). Passiva: Se o inimigo estiver com paralisia, o Assassino ganha +20% na velocidade de ataques.",
            custo_mana: "5.000 MP",
            cooldown: 0,
            custo_por_turno: "2.500 MP",
            nivel_desbloqueio: 50
        },
        {
            nome: "Chēn no suberi",
            classe: "Pneuma-Ousia",
            categoria: "Avançada",
            tipo: "Física",
            descricao: "O usuário ganha a capacidade de correr sobre a água e deslizar entre poças. Enquanto ativa, ganha um buff de +60% em velocidade quando está correndo sobre a água, e caso possua poças no campo pode se mover rapidamente entre elas com 100% de velocidade.",
            custo_mana: "Nulo",
            cooldown: 0,
            custo_por_turno: "4.000 MP",
            nivel_desbloqueio: 60
        },
        {
            nome: "Ryusuizan",
            classe: "Pneuma-Ousia",
            categoria: "Avançada",
            tipo: "Mágica",
            descricao: "O usuário expande sua aura de água, criando uma esfera altamente pressurizada de até 1M ao seu redor. Durante 1 Turno inteiro, deve permanecer imóvel, canalizando a energia da água em sua arma. No momento da ativação, desfere um único corte em arco, liberando uma rajada de água devastadora com força equivalente a +150% do seu PM. Caso a lâmina atinja diretamente o inimigo, a pressão extrema faz com que o golpe ignore qualquer tipo de defesa, incluindo barreiras mágicas e resistências.",
            custo_mana: "8.000 MP",
            cooldown: 3,
            nivel_desbloqueio: 70
        }
    ],

    // =====================================
    // RASTREADOR
    // =====================================
    "Rastreador": [
        {
            nome: "Rastreador",
            classe: "Rastreador",
            categoria: "Avançada",
            tipo: "Física",
            descricao: "Permite ao usuário aplicar o debuff [rastreamento] ao oponente. Enquanto ativado, o dano final e taxa de crítico mínimas das habilidades do usuário são aumentadas em 50%, e caso aquele que está com o debuff não ache o usuário, o buff é aumentado para 90%. Caso o oponente estiver com [Stealth], o buff é automaticamente removido. Só pode aplicar em uma pessoa por vez. Dura 5 turnos.",
            custo_mana: "3.000 MP",
            cooldown: 0,
            nivel_desbloqueio: 40
        },
        {
            nome: "Ponto Cego",
            classe: "Rastreador",
            categoria: "Avançada",
            tipo: "Física",
            descricao: "Caso o usuário estiver com essa habilidade ativa e o inimigo não conseguir o localizar, os tiros do usuário podem aplicar [atordoamento] no inimigo, os deixando atordoados por 1 turno. Caso o inimigo esteja sobre o debuff [rastreamento], os ataques ganham +60% de dano.",
            custo_mana: "3.000 MP",
            cooldown: 0,
            nivel_desbloqueio: 50
        },
        {
            nome: "Olhos do Falcão",
            classe: "Rastreador",
            categoria: "Avançada",
            tipo: "Suporte",
            descricao: "Permite ao usuário manifestar um espírito de falcão através de sua mana. O falcão pode se mover em uma área de 100m e atacar àqueles fora de área de alcance, expandindo em até 150m. Dá um buff de aumentar a área de efeito dos ataques do usuário em +50m. Caso o usuário esteja mirando em um inimigo com [rastreamento], o alcance de área é retirado, permitindo atacar de qualquer distância.",
            custo_mana: "5.000 MP",
            cooldown: 0,
            nivel_desbloqueio: 60
        },
        {
            nome: "Caçador da Noite [Passiva]",
            classe: "Rastreador",
            categoria: "Avançada",
            tipo: "Passiva",
            descricao: "Enquanto o usuário manter a visão nas costas do inimigo, ganha um buff de +30% de velocidade de movimento e um dano adicional de +50% caso seus ataques sejam pelas costas. Caso o Oponente esteja sobre [rastreamento], o usuário se torna invisível para o Oponente.",
            custo_mana: "Nulo",
            cooldown: 0,
            nivel_desbloqueio: 70
        },
        {
            nome: "Tiro de Caça",
            classe: "Rastreador",
            categoria: "Avançada",
            tipo: "Física",
            descricao: "Só pode ser ativada uma vez por batalha. Utilizando de sua arma para disparar 3 tiros seguidos, o usuário encanta o 4° tiro com mana, que tem um bônus de 200% de acerto crítico, além de dano adicional de +30%. Se o 4° tiro acertar o oponente, o usuário ganhará +10% de velocidade até o final da batalha. Só funciona em 1 pessoa.",
            custo_mana: "7.000 MP",
            cooldown: 0,
            nivel_desbloqueio: 80
        }
    ],

    // =====================================
    // ANDARILHO
    // =====================================
    "Andarilho": [
        {
            nome: "Sombra Lenta",
            classe: "Andarilho",
            categoria: "Avançada",
            tipo: "Mágica",
            descricao: "O Andarilho conjura uma sombra negra que envolve o inimigo, causando lentidão em seus movimentos e reduzindo sua resistência em 40% por 3 turnos. Especialmente eficaz contra chefes ou em combates PvP quando o Andarilho estiver sozinho contra o adversário.",
            custo_mana: "3.500 MP",
            cooldown: 0,
            nivel_desbloqueio: 40
        },
        {
            nome: "Ascensão Solitária",
            classe: "Andarilho",
            categoria: "Avançada",
            tipo: "Física",
            descricao: "Quando enfrentando um chefe sozinho em uma dungeon, o Andarilho invoca a energia do seu próprio espírito viajante para aumentar temporariamente seus atributos em 50% por 3 turnos.",
            custo_mana: "5.500 MP",
            cooldown: 0,
            nivel_desbloqueio: 50
        },
        {
            nome: "Fome de Conhecimento",
            classe: "Andarilho",
            categoria: "Avançada",
            tipo: "Suporte",
            descricao: "Após derrotar um chefe de dungeon sozinho, o Andarilho pode gastar sua mana até o zero para aumentar o lucro ganho de XP em 10% para cada 2000 de mana gasto. Só é possível se pelo menos 50% da mana tiver sido gasta durante o combate com o chefe.",
            custo_mana: "4.000 MP+",
            cooldown: 0,
            nivel_desbloqueio: 60
        },
        {
            nome: "Equilíbrio da Maldição",
            classe: "Andarilho",
            categoria: "Avançada",
            tipo: "Física",
            descricao: "Em um combate PvP solo, o Andarilho pode invocar um equilíbrio de atributos ao se amaldiçoar temporariamente, aumentando seus próprios atributos para igualar os do oponente por 3 turnos. No entanto, impede que o Andarilho utilize qualquer magia durante esse período. Após o fim da técnica toda sua mana é reduzida em 70%.",
            custo_mana: "Nulo",
            cooldown: 0,
            nivel_desbloqueio: 70
        },
        {
            nome: "Emboscada Ágil",
            classe: "Andarilho",
            categoria: "Avançada",
            tipo: "Física",
            descricao: "O Andarilho se move rapidamente pelo terreno, utilizando sua destreza para se posicionar atrás de um alvo desavisado. Ao realizar um ataque furtivo, causa dano adicional de 50% e ganha temporariamente um aumento na velocidade de movimento de 15%. CD de 3 turnos.",
            custo_mana: "4.000 MP",
            cooldown: 3,
            nivel_desbloqueio: 80
        }
    ],

    // =====================================
    // PALHAÇO
    // =====================================
    "Palhaço": [
        {
            nome: "Circo do Palhaço",
            classe: "Palhaço",
            categoria: "Avançada",
            tipo: "Mágica",
            descricao: "Permite ao usuário criar um círculo em uma área de 20m. Todos os inimigos dentro do círculo recebem redução de 15% em sua velocidade. Caso o Usuário tente atacar os inimigos, ele é capaz de ficar invisível por 1 turno, enquanto os inimigos ficam imóveis por 1 Turno (efeito só funciona 1 vez por círculo).",
            custo_mana: "2.000 MP",
            cooldown: 0,
            nivel_desbloqueio: 40
        },
        {
            nome: "Clímax da Réplica",
            classe: "Palhaço",
            categoria: "Avançada",
            tipo: "Física",
            descricao: "Permite ao usuário multiplicar o número de adagas que segura, e as lançar no inimigo (multiplica para 5 Adagas). Caso uma das adagas acerte o oponente, as próximas 4 adagas vão em direção do inimigo de forma teleguiada. Caso uma adaga acerte as costas do inimigo, a velocidade dele é reduzida em 30% por 2 Turnos.",
            custo_mana: "3.500 MP",
            cooldown: 0,
            nivel_desbloqueio: 50
        },
        {
            nome: "Jogo de Adagas [Passiva]",
            classe: "Palhaço",
            categoria: "Avançada",
            tipo: "Passiva",
            descricao: "Sempre que o usuário atinge o inimigo pelas costas, o Ataque recebe um Buff de dano adicional de +30%. Nem habilidades ou técnicas de buff podem ser usadas quando o usuário usar a passiva.",
            custo_mana: "Nulo",
            cooldown: 0,
            nivel_desbloqueio: 60
        },
        {
            nome: "Truque de Mestre",
            classe: "Palhaço",
            categoria: "Avançada",
            tipo: "Mágica",
            descricao: "Permite ao usuário Conjurar uma capa mágica que pode ser usada para guardar itens. A capa também pode guardar Ataques mágicos usados no usuário, e caso o Ataque seja armazenado, o usuário pode usar esse Ataque da forma que quiser (caso a PM do Ataque for 30% maior que a PM do usuário, ele não pode armazenar).",
            custo_mana: "4.000 MP",
            cooldown: 0,
            nivel_desbloqueio: 70
        },
        {
            nome: "Caixinha de Truques",
            classe: "Palhaço",
            categoria: "Avançada",
            tipo: "Mágica",
            descricao: "Ativo 1: Cria uma caixa de onde pode tirar 20 Adagas. Todo inimigo que se aproxima em 2M sofre 'medo' ficando paralisado por 1 Turno (1 vez por caixa). Ativo 2: Cria um clone de si mesmo que pode atacar inimigos próximos de 15m. Ao morrer, explode atirando 20 adagas para todos os lados não afetando aliados nem o próprio usuário.",
            custo_mana: "6.000 MP",
            cooldown: 0,
            nivel_desbloqueio: 80
        }
    ],

    // =====================================
    // RAIJIN
    // =====================================
    "Raijin": [
        {
            nome: "Pena de Corvos [Passiva]",
            classe: "Raijin",
            categoria: "Avançada",
            tipo: "Passiva",
            descricao: "Os projéteis do usuário assumem a forma de corvos espectrais que perseguem seus alvos com precisão. Ao atingir um inimigo, o corvo deixa a marca 'Pena de Corvo', eletrificando-o e tornando-o vulnerável a efeitos adicionais. Essa marca amplifica interações elementares.",
            custo_mana: "Nulo",
            cooldown: 0,
            nivel_desbloqueio: 40
        },
        {
            nome: "Predador Estelar",
            classe: "Raijin",
            categoria: "Avançada",
            tipo: "Mágica",
            descricao: "Enquanto mira, raios crepitantes se acumulam na ponta do projétil. Um disparo totalmente energizado causa dano elétrico e paralisa o alvo por 1 segundo, além de aplicar a marca 'Pena de Corvo'. Se o inimigo já estiver marcado, o impacto gera uma explosão elétrica equivalente a 200% da força do usuário em um raio de 5 metros, aplicando a marca em inimigos próximos.",
            custo_mana: "7.500 MP",
            cooldown: 0,
            nivel_desbloqueio: 50
        },
        {
            nome: "Subjugação de Raios",
            classe: "Raijin",
            categoria: "Avançada",
            tipo: "Mágica",
            descricao: "O usuário dispara um poderoso projétil em forma de um corvo gigante de 3 metros, que persegue o inimigo antes de desencadear uma explosão elétrica massiva em um raio de 10 metros. Se o alvo estiver marcado com 'Pena de Corvo', o dano do impacto é aumentado em 300% do ataque. Inimigos marcados em um raio de 30 metros serão paralisados por 1 segundo. Durante esse instante, o usuário ganha a oportunidade de usar uma segunda técnica sem custo de mana.",
            custo_mana: "6.000 MP",
            cooldown: 0,
            nivel_desbloqueio: 60
        },
        {
            nome: "Testamento imóvel",
            classe: "Raijin",
            categoria: "Avançada",
            tipo: "Mágica",
            descricao: "O usuário dispara um projétil de tonalidade amarela, movendo-se mais rápido que qualquer outro, com velocidade proporcional à sua força. Ao atingir um inimigo, ele é paralisado por 1 segundo e marcado com 'Pena de Corvo'. Se o alvo já estiver marcado, a paralisia se estende para 5 segundos. Caso haja inimigos marcados em um raio de 30 metros, a energia do corvo salta entre eles, aplicando o mesmo efeito em cadeia.",
            custo_mana: "7.500 MP",
            cooldown: 0,
            nivel_desbloqueio: 70
        },
        {
            nome: "Milagre",
            classe: "Raijin",
            categoria: "Avançada",
            tipo: "Mágica",
            descricao: "O Raijin dispara uma flecha de pura energia que demarca um local de forma única. Ao ativar a técnica, ele se move instantaneamente na velocidade da luz até o ponto marcado, atravessando qualquer obstáculo. Todos os inimigos que estiverem no caminho, em um raio de até 3 metros ao redor da trajetória, são automaticamente marcados com 'Pena de Corvo'.",
            custo_mana: "8.000 MP",
            cooldown: 0,
            nivel_desbloqueio: 80
        }
    ],

    // =====================================
    // ARDITO
    // =====================================
    "Ardito": [
        {
            nome: "Pólvora Mágica",
            classe: "Ardito",
            categoria: "Avançada",
            tipo: "Mágica",
            descricao: "Usando de sua própria mana, o usuário consegue manifestar pólvora para gerar granadas de vários tipos. Granadas explodidas além do dano em área, também dão um debuff chamado 'pólvora'. O alcance das explosões podem ir de 5m até 20m. A cada rank, o tamanho da área aumenta em 10m e o dano ganha +10% acumulativo. Dano dado em PM.",
            custo_mana: "3.000 MP",
            cooldown: 0,
            nivel_desbloqueio: 40
        },
        {
            nome: "Ataque Explosivo",
            classe: "Ardito",
            categoria: "Avançada",
            tipo: "Física",
            descricao: "O usuário dá um dash em direção do Oponente, e caso o Oponente esteja sobre o debuff [pólvora], o Ataque do usuário causará um dano explosivo de +50% de dano e também ignora 30% da defesa do Oponente caso o ataque acerte.",
            custo_mana: "3.000 MP",
            cooldown: 0,
            nivel_desbloqueio: 50
        },
        {
            nome: "Adaga Explosiva",
            classe: "Ardito",
            categoria: "Avançada",
            tipo: "Física",
            descricao: "Imbuindo a adaga do usuário com mana, pode disparar ela em direção do Inimigo ou em um Local perto. Caso a adaga atinja algo física, ela explode, causando dano e debuff de -20% de velocidade em uma área de 10m. Caso o oponente atingido esteja sobre [pólvora], recebe +30% de dano a cada rank. Dano em PM.",
            custo_mana: "4.500 MP",
            cooldown: 0,
            nivel_desbloqueio: 60
        },
        {
            nome: "Louco por Explosões [Passiva]",
            classe: "Ardito",
            categoria: "Avançada",
            tipo: "Passiva",
            descricao: "Caso o usuário Ataque um inimigo que esteja sobre o debuff [pólvora], todos os Ataques do usuário possuem um aumento de +30m em seus ataques, além da taxa de chance de dano crítico ser aumentada para 100% quando marcado sobre o debuff [Pólvora].",
            custo_mana: "Nulo",
            cooldown: 0,
            nivel_desbloqueio: 70
        },
        {
            nome: "Massa Explosiva",
            classe: "Ardito",
            categoria: "Avançada",
            tipo: "Mágica",
            descricao: "O usuário pode misturar sua pólvora mágica com qualquer tipo de massa existente para enfim moldá-las com suas técnicas já existentes, para assim aumentar o alcance de suas Explosões.",
            custo_mana: "5.000 MP",
            cooldown: 0,
            nivel_desbloqueio: 80
        }
    ],

    // =====================================
    // HARMONIC
    // =====================================
    "Harmonic": [
        {
            nome: "Habitador do Demônio",
            classe: "Harmonic",
            categoria: "Avançada",
            tipo: "Mágica",
            descricao: "Esta técnica confere à arma do usuário a habilidade de absorver feitiços aliados, podendo posteriormente liberar essa magia em forma de um disparo elemental. Quando a arma acumula uma quantidade significativa de poder mágico, marcas começam a surgir e a brilhar. No momento do disparo, a arma desencadeia uma magia que reflete as propriedades do elemento assimilado. Se o projétil atingir um inimigo e permanecer nele por dois segundos, o Harmonic pode replicar a natureza mágica do disparo.",
            custo_mana: "5.000 MP",
            cooldown: 0,
            nivel_desbloqueio: 40
        },
        {
            nome: "Ressonância Elemental",
            classe: "Harmonic",
            categoria: "Avançada",
            tipo: "Mágica",
            descricao: "O Ranger se torna um manipulador do ambiente, absorvendo a energia elemental ao seu redor ao acertar um inimigo. Permite armazenar essa energia para aumentar o dano do próximo disparo, além de adicionar efeitos secundários. Nuvens: intensifica chuva ou gera trovões. Plantas: acelera crescimento criando espinhos ou curando aliados. Chamas: amplia explosões causando danos devastadores.",
            custo_mana: "4.000 MP",
            cooldown: 0,
            nivel_desbloqueio: 50
        },
        {
            nome: "Flecha da Ascensão",
            classe: "Harmonic",
            categoria: "Avançada",
            tipo: "Mágica",
            descricao: "Concentra a energia de todos os elementos ao seu redor em um único tiro devastador que causa dano massivo ao explodir em uma sequência de efeitos: incendiando o alvo, envenenando com vapores tóxicos, paralisando com descargas elétricas e empurrando com onda de força. Se algum aliado contribuiu com seu elemento, o dano e os efeitos são amplificados pelo bônus de inteligência desse aliado.",
            custo_mana: "5.000 MP",
            cooldown: 0,
            nivel_desbloqueio: 60
        },
        {
            nome: "Seta da Memória",
            classe: "Harmonic",
            categoria: "Avançada",
            tipo: "Mágica",
            descricao: "Harmonic possui a habilidade de armazenar e replicar técnicas elementais que seus adversários usam contra ela. Sempre que um inimigo lança uma habilidade elemental, Harmonic pode copiar essa técnica e utilizá-la como um ataque em um turno futuro (apenas 2 turnos após o uso original). O dano causado será baseado na própria inteligência ou força de Harmonic.",
            custo_mana: "5.750 MP",
            cooldown: 0,
            nivel_desbloqueio: 70
        },
        {
            nome: "Condensação Elemental",
            classe: "Harmonic",
            categoria: "Avançada",
            tipo: "Mágica",
            descricao: "Harmonic concentra um único elemento em uma flecha, que pode ser disparada mais tarde, acumulando poder com o tempo. A cada ataque elemental realizado anteriormente, a flecha liberada causa uma explosão que cresce em intensidade. Cada técnica de Harmonic utilizada aumenta a condensação em 10%, sem limite. Uma vez disparada, o bônus acumulado é zerado, liberando todo o poder armazenado.",
            custo_mana: "7.000 MP",
            cooldown: 0,
            nivel_desbloqueio: 80
        }
    ],

    // =====================================
    // CHEFE
    // =====================================
    "Chefe": [
        {
            nome: "Bolsa de Cozinha",
            classe: "Chefe",
            categoria: "Avançada",
            tipo: "Suporte",
            descricao: "Ao desbloquear a classe, o jogador ganha acesso a uma nova aba chamada 'Bolsa de Cozinha', que preserva magicamente petiscos e ingredientes. Deve reabastecer os ingredientes pelo menos 1 vez a cada 30 dias, comprando comidas especiais por 100.000 Wons ou passando 8 horas vasculhando comida. Qualquer coisa considerada minimamente comestível pode ser tratada como alimento.",
            custo_mana: "Nulo",
            cooldown: 0,
            nivel_desbloqueio: 40
        },
        {
            nome: "Petiscos",
            classe: "Chefe",
            categoria: "Avançada",
            tipo: "Suporte",
            descricao: "Permite ao usuário selecionar 3 petiscos. Um ser pode estar sobre o efeito de 3 petiscos por vez; se comer um 4°, todos os efeitos são desativados. Chips: +25% Agilidade. Nuggets: +25% Força. Rice balls: +25% Resistência. Roast: +25% Inteligência. Bean: +25% Poder Mágico. Onion: +25% Sentidos. Buffs duram 5 Turnos.",
            custo_mana: "5.000 MP por criação de petisco",
            cooldown: 0,
            nivel_desbloqueio: 50
        },
        {
            nome: "Imersão Alimentar [Passiva]",
            classe: "Chefe",
            categoria: "Avançada",
            tipo: "Passiva",
            descricao: "Técnica passiva exclusiva dos chefes. Permite absorver e armazenar mais nutrientes dentro de seu corpo do que uma pessoa normal, permitindo sobreviver por longos períodos sem comida ou água. Aumenta em 30% a resistência do usuário, permitindo sobreviver em ambientes hostis por vários dias.",
            custo_mana: "Nulo",
            cooldown: 0,
            nivel_desbloqueio: 60
        },
        {
            nome: "Garfo e Faca",
            classe: "Chefe",
            categoria: "Avançada",
            tipo: "Física",
            descricao: "Imbuindo a mão esquerda com mana, o usuário coloca a mão esquerda em posição de 'garra' (garfo) e a direita em posição de 'corte' (faca). O garfo e faca são extremamente afiados, sendo capazes de cortar e perfurar até mesmo o aço. +15% de força enquanto ativa.",
            custo_mana: "Nulo",
            cooldown: 0,
            nivel_desbloqueio: 70
        },
        {
            nome: "Recolher",
            classe: "Chefe",
            categoria: "Avançada",
            tipo: "Suporte",
            descricao: "Permite ao usuário recolher partes de animais e mobs derrotados para criar novos alimentos com efeitos providos das capacidades daquele mob. Uma capacidade permanente do mob tende a passar para aqueles que comeram o alimento. A 'transformação' dura 5 Turnos e buffa algum Status em específico em 60%, dependendo do tipo de mob/animal.",
            custo_mana: "5.000 MP",
            cooldown: 0,
            nivel_desbloqueio: 80
        }
    ],

    // =====================================
    // APOTECÁRIO
    // =====================================
    "Apotecário": [
        {
            nome: "Inspiração [Passiva]",
            classe: "Apotecário",
            categoria: "Avançada",
            tipo: "Passiva",
            descricao: "Ao evoluir de classe, ganha a capacidade de utilizar recursos de mobs para criar poções de diversos tipos, desde cura de ferimentos até poções que tornam muito mais forte fisicamente. Quanto maior o rank do usuário, maior será o dano das poções de veneno e o nível de cura. Poções de cura só curam pequenos cortes no início, e conforme o usuário evolui, pode curar até membros arrancados.",
            custo_mana: "Nulo",
            cooldown: 0,
            nivel_desbloqueio: 40
        },
        {
            nome: "Reabilitar",
            classe: "Apotecário",
            categoria: "Avançada",
            tipo: "Cura",
            descricao: "Permite ao usuário curar um aliado de todos os debuffs de status, além de os deixar sob efeito de imunidade a qualquer debuff por 2 turnos.",
            custo_mana: "4.000 MP",
            cooldown: 0,
            nivel_desbloqueio: 50
        },
        {
            nome: "Caridade de Dohter",
            classe: "Apotecário",
            categoria: "Avançada",
            tipo: "Suporte",
            descricao: "Permite ao usuário criar uma aura mágica em torno de um aliado. Uma vez que esse aliado recebe algum Buff ou beber de algum item consumível, todos os Buffs serão repassados para todos os aliados em uma área de 10m. Esses Buffs repassados duram 5 turnos.",
            custo_mana: "4.500 MP",
            cooldown: 0,
            nivel_desbloqueio: 60
        },
        {
            nome: "Vitória Inspiradora [Passiva]",
            classe: "Apotecário",
            categoria: "Avançada",
            tipo: "Passiva",
            descricao: "Toda vez que o usuário finalizar um monstro, recupera 30% da mana gasta em batalha. Quando um aliado curado pelo usuário finalizar um Boss, o usuário ganha +40% de XP adicional no final.",
            custo_mana: "Nulo",
            cooldown: 0,
            nivel_desbloqueio: 70
        },
        {
            nome: "Poção de Ether",
            classe: "Apotecário",
            categoria: "Avançada",
            tipo: "Suporte",
            descricao: "Permite ao usuário criar poções que podem estimular qualquer atributo. Efeitos duram 6 turnos e podem variar de 10% até 80% de Buff. Podem ser ingeridos vários de uma vez. Criação apenas fora de combate, gastando 100.000 Wons ou esperando 8h caçando ingredientes.",
            custo_mana: "5.000 MP",
            cooldown: 0,
            nivel_desbloqueio: 80
        }
    ],

    // =====================================
    // MÚSICO
    // =====================================
    "Músico": [
        {
            nome: "All Together Now",
            classe: "Músico",
            categoria: "Avançada",
            tipo: "Suporte",
            descricao: "Permite com que habilidades que normalmente possuem efeito em apenas 1 alvo, acabe por afetar todos os inimigos em uma área de 15m. Funciona tanto nas habilidades do usuário quanto nas habilidades de seus aliados.",
            custo_mana: "5.000 MP",
            cooldown: 0,
            nivel_desbloqueio: 40
        },
        {
            nome: "Hope",
            classe: "Músico",
            categoria: "Avançada",
            tipo: "Suporte",
            descricao: "Faz com que as técnicas de Buff tenham uma prolongação de +4 turnos de efeito em todos os aliados a uma área de 10m em torno do usuário. Caso o usuário mantenha o foco fazendo a música durar por 1 Turno inteiro sem interrupção, consegue usar sem gastar mana e os Buffs se tornam permanentes até o final da Batalha.",
            custo_mana: "4.500 MP",
            cooldown: 0,
            nivel_desbloqueio: 50
        },
        {
            nome: "Imprevisto",
            classe: "Músico",
            categoria: "Avançada",
            tipo: "Suporte",
            descricao: "Todos os aliados em uma área de 15m recebem um buff de 30% em PM e força, enquanto inimigos nessa mesma área recebem um debuff de -30% em velocidade e Resistência. Caso o usuário gaste o dobro de mana, ao final da dungeon tem chance de 1/5 de adquirir o dobro de XP.",
            custo_mana: "6.000 MP",
            cooldown: 0,
            nivel_desbloqueio: 60
        },
        {
            nome: "Músico Abençoado [Passiva]",
            classe: "Músico",
            categoria: "Avançada",
            tipo: "Passiva",
            descricao: "Toda vez que o usuário receber regeneração, seja de cura ou mana, recebe 10 pontos em Poder Mágico durante 3 turnos. Ao final de uma dungeon, é capaz de ganhar 1.5x Wons a mais.",
            custo_mana: "Nulo",
            cooldown: 0,
            nivel_desbloqueio: 70
        },
        {
            nome: "Just the Two Us [Passiva]",
            classe: "Músico",
            categoria: "Avançada",
            tipo: "Passiva",
            descricao: "Toda vez que o usuário for alvo de um ataque mágico e o Ataque acertar, pode recuperar 30% de sua mana, e o próximo Ataque mágico recebe +50% de PM. Ativação secreta: Caso esteja sob efeito de debuff durante o Ataque, o contra-Ataque pode ser feito usando 100% do PM.",
            custo_mana: "Nulo",
            cooldown: 0,
            nivel_desbloqueio: 80
        }
    ],

    // =====================================
    // ORÁCULO
    // =====================================
    "Oráculo": [
        {
            nome: "Energia Arcana",
            classe: "Oráculo",
            categoria: "Avançada",
            tipo: "Suporte",
            descricao: "Permite ao usuário aplicar um Buff de energia Arcana no usuário ou aliados. O Buff registra sua mana e inteligência atuais. Se a quantidade de mana gasta no Turno for igual ou maior que a inteligência registrada, o usuário recupera uma quantidade de mana igual a sua inteligência. Dura 2 turnos.",
            custo_mana: "3.500 MP",
            cooldown: 0,
            nivel_desbloqueio: 40
        },
        {
            nome: "Contra-Feitiço",
            classe: "Oráculo",
            categoria: "Avançada",
            tipo: "Mágica",
            descricao: "Remove ou cancela qualquer magia em área ativada pelo inimigo em uma área de 20m, enquanto aplica uma Magia em área do mesmo tamanho que reduz o dano que o usuário ou aliados iriam receber em 30% por 3 turnos.",
            custo_mana: "5.000 MP",
            cooldown: 0,
            nivel_desbloqueio: 50
        },
        {
            nome: "Poder Divino",
            classe: "Oráculo",
            categoria: "Avançada",
            tipo: "Passiva",
            descricao: "Habilidade exclusiva de oráculos. Ao atingir o avanço de classe, uma nova aba do sistema se abre. Pessoas na mesma equipe do usuário recebem um equilíbrio de nível e aumento caso estejam a 15m do usuário. Aliados abaixo do usuário sempre estarão a 5 níveis abaixo. Aliados acima sempre serão 5 níveis superior ao usuário.",
            custo_mana: "Nulo",
            cooldown: 0,
            nivel_desbloqueio: 60
        },
        {
            nome: "Mudança do Destino",
            classe: "Oráculo",
            categoria: "Avançada",
            tipo: "Mágica",
            descricao: "O usuário consegue interferir em feitiços físicos (bola de fogo, dragão de água e etc) que possuam menos PM que o usuário, podendo mudar a trajetória deles, fazendo os voltar contra o próprio mago/feiticeiro, ou usar para proteger um aliado.",
            custo_mana: "5.000 MP",
            cooldown: 0,
            nivel_desbloqueio: 70
        },
        {
            nome: "Reviravolta do Destino",
            classe: "Oráculo",
            categoria: "Avançada",
            tipo: "Mágica",
            descricao: "Permite ao usuário causar uma quantidade fixa de dano em um alvo, usando como base a mana máxima do usuário (dano: inteligência, zerando-a). O alvo recupera gradualmente a mana (10% por turno), correspondendo ao dobro da quantidade perdida no ataque. Só pode ser usado 2 vezes por combate.",
            custo_mana: "7.000 MP",
            cooldown: 0,
            nivel_desbloqueio: 80
        }
    ],

    // =====================================
    // ESTIGMAS
    // =====================================
    "Estigmas": [
        {
            nome: "Aukuras",
            classe: "Estigmas",
            categoria: "Avançada",
            tipo: "Mágica",
            descricao: "O sacerdote de Estigmas Conjura uma chama de tonalidade mais alaranjada do que outros magos de fogo. Essa chama adiciona 50% de dano em um Ataque, podendo ser tanto mágico quanto físico, mas precisa ser usada na hora em que o Ataque vai ser conjurado.",
            custo_mana: "4.500 MP",
            cooldown: 0,
            nivel_desbloqueio: 40
        },
        {
            nome: "Estigma Divino",
            classe: "Estigmas",
            categoria: "Avançada",
            tipo: "Mágica",
            descricao: "O usuário marca um estigma em um inimigo, causando dano mágico continuo com propriedade sagrada. O debuff [brilhante] fica marcado no inimigo durante 3 turnos, fazendo com que qualquer técnica que acerte o marcado consiga ignorar 40% da resistência dele.",
            custo_mana: "5.000 MP",
            cooldown: 0,
            nivel_desbloqueio: 50
        },
        {
            nome: "Piedade",
            classe: "Estigmas",
            categoria: "Avançada",
            tipo: "Mágica",
            descricao: "Permite ao usuário marcar os inimigos com um estigma, causando dano de luz de forma constante. O usuário consegue 'Estourar' o Estigma do Oponente, fazendo ele sofrer de um debuff de -45% em velocidade e PM.",
            custo_mana: "4.000 MP",
            cooldown: 0,
            nivel_desbloqueio: 60
        },
        {
            nome: "Véu reflexivo",
            classe: "Estigmas",
            categoria: "Avançada",
            tipo: "Defesa",
            descricao: "Durante o turno em que uma técnica do inimigo é conjurada, o usuário consegue marcar um aliado com um estigma, que dá a capacidade desse aliado refletir 1 ataque de magia Elemental de qualquer natureza.",
            custo_mana: "3.500 MP",
            cooldown: 0,
            nivel_desbloqueio: 70
        },
        {
            nome: "Auspícios de Aelfric",
            classe: "Estigmas",
            categoria: "Avançada",
            tipo: "Suporte",
            descricao: "A técnica mais poderosa da classe Estigmas. Marcando um aliado com um Estigma, esse aliado consegue ativar Habilidades 2 vezes sem ter o gasto duplicado, mantendo ambos os buff da técnica duplicada ativos. Dura 5 turnos. Só pode ser ativada em 3 aliados ou no próprio usuário.",
            custo_mana: "7.000 MP",
            cooldown: 0,
            nivel_desbloqueio: 80
        }
    ],

    // =====================================
    // NAZHIR
    // =====================================
    "Nazhir": [
        {
            nome: "Sacrilégio da Floresta",
            classe: "Nazhir",
            categoria: "Avançada",
            tipo: "Defesa",
            descricao: "O usuário invoca um poderoso escudo elemental, formado a partir de um dos elementos naturais (fogo, água, terra ou ar). Só pode ser quebrado por dano elemental do tipo oposto. O portador ganha 25% de resistência a todos os elementos, mas se receber dano de elemento contrário, o escudo é destruído imediatamente.",
            custo_mana: "5.000 MP",
            cooldown: 0,
            nivel_desbloqueio: 40
        },
        {
            nome: "Docile de Yggdrasil",
            classe: "Nazhir",
            categoria: "Avançada",
            tipo: "Defesa",
            descricao: "O usuário invoca um escudo elemental do chão, formado pelo mesmo tipo de elemento que está sendo defendido. Reflete projéteis do mesmo elemento, retornando-os ao atacante. Se um projétil de elemento contrário atingir, o escudo é quebrado. Se a inteligência do oponente for maior, o escudo se partirá.",
            custo_mana: "5.500 MP",
            cooldown: 0,
            nivel_desbloqueio: 50
        },
        {
            nome: "Vinha negra",
            classe: "Nazhir",
            categoria: "Avançada",
            tipo: "Defesa",
            descricao: "Invoca um escudo mágico de anulação, envolvendo o afetado com uma proteção negra que o torna imune a qualquer debuff mágico, bem como aos efeitos de técnicas passivas ou ativas inimigas, durante 2 turnos. Se uma técnica mágica cujo poder ultrapasse 25% da inteligência do Nazhir atingir, o escudo será quebrado.",
            custo_mana: "6.250 MP",
            cooldown: 0,
            nivel_desbloqueio: 60
        },
        {
            nome: "Caminhante Noturno",
            classe: "Nazhir",
            categoria: "Avançada",
            tipo: "Mágica",
            descricao: "O usuário dispara um projétil em forma de lua, que corta qualquer obstáculo em seu caminho. A intensidade aumenta conforme a quantidade de mana inserida, podendo crescer em tamanho até 10 metros e alcançar até 50 metros. A cada 3000 de mana, aumenta seu tamanho em mais 5M e alcance em 10.",
            custo_mana: "6.500 MP",
            cooldown: 0,
            nivel_desbloqueio: 70
        },
        {
            nome: "Maçã do Destino [Passiva]",
            classe: "Nazhir",
            categoria: "Avançada",
            tipo: "Passiva",
            descricao: "Aumenta sua resistência base em 15% a cada vez que concede um escudo a um aliado. Acumulativo. Enquanto acumulada, Nazhir não pode receber aumentos de resistência de outras fontes, limitando os buffs apenas a essa técnica.",
            custo_mana: "7.000 MP",
            cooldown: 0,
            nivel_desbloqueio: 80
        }
    ],

    // =====================================
    // CALAMITAS
    // =====================================
    "Calamitas": [
        {
            nome: "Ascenção a força",
            classe: "Calamitas",
            categoria: "Avançada",
            tipo: "Física",
            descricao: "O usuário cria uma área de 5M quadrados que amplia a força base de todos os aliados em +40%, além de aumentar sua própria força base de acordo com seu nível. A cada 10 níveis atingidos a partir da aquisição, o aumento de força do buff sobe em 10% adicionais.",
            custo_mana: "10.000 MP",
            cooldown: 0,
            custo_por_turno: "5.000 MP",
            nivel_desbloqueio: 40
        },
        {
            nome: "Retorno Critico [Passiva]",
            classe: "Calamitas",
            categoria: "Avançada",
            tipo: "Passiva",
            descricao: "Sempre que o usuário acerta um golpe crítico com seu punho, recupera mana com base em 20% do dano do ataque. Se o golpe atingir a região da cabeça, sempre será um crítico. Após realizar um ataque crítico, o dano base sofre um debuff de -50% por um turno.",
            custo_mana: "Nulo",
            cooldown: 0,
            nivel_desbloqueio: 50
        },
        {
            nome: "Sinergia Amplificada",
            classe: "Calamitas",
            categoria: "Avançada",
            tipo: "Suporte",
            descricao: "Enquanto o usuário estiver em contato com um aliado, qualquer buff físico que aumente o ataque de si mesmo ou do aliado será duplicado. Se o buff provier do Calamitas, o custo de mana será triplicado. Caso o buff seja concedido ao usuário por um aliado enquanto em contato, o custo do aliado será zerado, e o gasto será triplicado para o usuário.",
            custo_mana: "6.000 MP",
            cooldown: 0,
            nivel_desbloqueio: 60
        },
        {
            nome: "Fúria Transcendental",
            classe: "Calamitas",
            categoria: "Avançada",
            tipo: "Física",
            descricao: "Quando o usuário recebe cura ou escudo de qualquer fonte, pode optar por anular e ganhar um buff de ataque de 20%, com limite máximo de 100%. Dura 4 turnos, mas após ser ativado, a técnica não pode ser usada novamente por 3 turnos.",
            custo_mana: "6.000 MP",
            cooldown: 3,
            nivel_desbloqueio: 70
        },
        {
            nome: "Ritual das Estrelas Caídas",
            classe: "Calamitas",
            categoria: "Avançada",
            tipo: "Mágica",
            descricao: "Quando o usuário causa pelo menos 5 danos críticos durante o combate, ativa o Ritual das Estrelas Caídas. Permite que os membros da party realizem o sacrifício de itens para ganhar aumentos de atributos proporcionais ao rank e raridade. Rank-E: +25% (máx 5 itens), Rank-D: +50% (máx 5), Rank-C: +75% (máx 4), Rank-B: +125% (máx 3), Rank-A: +250% (máx 2), Rank-S: +350% (máx 2), Rank-SS: +450% (máx 1). Máximo de 7 itens sacrificados. Buff dura 3 turnos.",
            custo_mana: "30.000 MP",
            cooldown: 0,
            nivel_desbloqueio: 80
        }
    ],

    // =====================================
    // MAGO DE LUZ
    // =====================================
    "Mago de Luz": [
        {
            nome: "Sistema de Magos de Luz [Passiva]",
            classe: "Mago de Luz",
            categoria: "Avançada",
            tipo: "Passiva",
            descricao: "Os Magos de Luz possuem agilidade diretamente proporcional ao seu PM. Técnicas de Luz possuem duas vezes a agilidade proporcional ao PM. Gastos de mana são duplicados para todas as técnicas. Proibidos de técnicas que aumentem diretamente agilidade, resistência ou força. Sempre aliados do bem.",
            custo_mana: "Nulo",
            cooldown: 0,
            nivel_desbloqueio: 40
        },
        {
            nome: "Espadas de Luz",
            classe: "Mago de Luz",
            categoria: "Avançada",
            tipo: "Mágica",
            descricao: "O usuário invoca múltiplos fragmentos de luz ao seu redor, assumindo a forma de lâminas luminiscentes. Podem ser lançadas simultaneamente ou uma por vez. Invocar de 10 em 10 espadas, além delas terem 2.5M.",
            custo_mana: "4.000 MP (a cada 10 espadas)",
            cooldown: 0,
            custo_por_turno: "2.000 MP (a cada 10 espadas)",
            nivel_desbloqueio: 50
        },
        {
            nome: "Chicote de Luz do Julgamento",
            classe: "Mago de Luz",
            categoria: "Avançada",
            tipo: "Mágica",
            descricao: "O usuário convoca um chicote formado inteiramente de luz que se estende a partir de sua mão. Extremamente cortante, pode atingir alvos a uma grande distância, com alcance de até 50 metros.",
            custo_mana: "6.000 MP",
            cooldown: 0,
            custo_por_turno: "3.000 MP",
            nivel_desbloqueio: 60
        },
        {
            nome: "Raio do Castigo Divino",
            classe: "Mago de Luz",
            categoria: "Avançada",
            tipo: "Mágica",
            descricao: "O usuário concentra luz pura entre suas mãos, formando uma esfera brilhante. Após atingir seu ápice, libera de forma explosiva, criando uma imensa coluna de luz que avança em grande velocidade. Alcance de 30 metros. Dano adicional de 100% do PM.",
            custo_mana: "25.000 MP",
            cooldown: 6,
            nivel_desbloqueio: 70
        },
        {
            nome: "Centelha Final",
            classe: "Mago de Luz",
            categoria: "Avançada",
            tipo: "Mágica",
            descricao: "O usuário acumula energia luminosa em seu corpo, concentrando-a em um único ponto. Dispara um feixe de luz pura em linha reta, que ignora completamente qualquer resistência mágica. Alcance de 50 metros. Dano adicional de 200% do PM. Demora 2 Turnos para ser conjurado.",
            custo_mana: "35.000 MP",
            cooldown: 8,
            nivel_desbloqueio: 80
        }
    ],

    // =====================================
    // SAMURAI
    // =====================================
    "Samurai": [
        {
            nome: "Recuperação de MP [Passiva]",
            classe: "Samurai",
            categoria: "Avançada",
            tipo: "Passiva",
            descricao: "Ao receber dano de um inimigo, o usuário ganha mana igual a 5% do dano recebido. Além disso, se sofrer de algum debuff de status, o mesmo será anulado e seu PM e FOR serão aumentados em 20% todas as vezes.",
            custo_mana: "Nulo",
            cooldown: 0,
            nivel_desbloqueio: 40
        },
        {
            nome: "Fio da Navalha",
            classe: "Samurai",
            categoria: "Avançada",
            tipo: "Física",
            descricao: "Quando cortar um inimigo, interrompe o seu lançamento. Caso o feitiço já tenha sido lançado, um corte de vento é lançado podendo repelir a técnica caso ele tenha 50% a mais em FOR/PM.",
            custo_mana: "3.000 MP",
            cooldown: 0,
            nivel_desbloqueio: 50
        },
        {
            nome: "Sabre Samurai",
            classe: "Samurai",
            categoria: "Avançada",
            tipo: "Física",
            descricao: "Ao canalizar mana na espada, tanto o alcance como a capacidade de corte da lâmina são aprimorados, permitindo disparos de mana sempre que a lâmina for balançada. 25% do PM do usuário é incrementado na FOR.",
            custo_mana: "4.000 MP",
            cooldown: 0,
            nivel_desbloqueio: 60
        },
        {
            nome: "Espada do Conquistador",
            classe: "Samurai",
            categoria: "Avançada",
            tipo: "Física",
            descricao: "Carregue seu ataque até o final do próximo turno e lance um poderoso ataque de espada contra um único inimigo. Quanto mais longa a carga, mais potente será o ataque. Aumento de 30% por turno carregado, sem limite.",
            custo_mana: "4.000 MP por turno",
            cooldown: 0,
            nivel_desbloqueio: 70
        },
        {
            nome: "Espada Amplificada",
            classe: "Samurai",
            categoria: "Avançada",
            tipo: "Física",
            descricao: "Converte a Mana em poder ofensivo e a libera. É uma arma de energia diretiva que converte a Mana do samurai em luz. Libera energia de retenção de luz, rivalizando com todo o suprimento de mana do usuário. Dano baseado em FOR. +100 de Força para cada 10.000 MP.",
            custo_mana: "100% da mana",
            cooldown: 0,
            nivel_desbloqueio: 80
        }
    ],

    // =====================================
    // MONGE
    // =====================================
    "Monge": [
        {
            nome: "Ponte Espiritual [Passiva]",
            classe: "Monge",
            categoria: "Avançada",
            tipo: "Passiva",
            descricao: "Os ataques do monge são contabilizados por cada inimigo dentro de seu alcance. A Ponte Espiritual alveja inimigos a 5 metros, aumentando força e resistência em 10% a cada inimigo (máximo 50%). Ao realizar dois ataques consecutivos com a mão, o terceiro golpe recebe agilidade adicional de 100 pontos.",
            custo_mana: "Nulo",
            cooldown: 0,
            nivel_desbloqueio: 40
        },
        {
            nome: "Quebrador de Montanhas",
            classe: "Monge",
            categoria: "Avançada",
            tipo: "Física",
            descricao: "Ao conjurar, o monge recebe agilidade adicional de 30% e dano em PM em seus golpes (PM + FOR), adicionando efeito elemental de raios. Caso conjure em seguida da primeira ativação, ganha adicional de 20% de agilidade e ataques causam paralisia por 1 turno com efeitos de raios maiores.",
            custo_mana: "4.000 MP",
            cooldown: 0,
            nivel_desbloqueio: 50
        },
        {
            nome: "Investida Ardente",
            classe: "Monge",
            categoria: "Avançada",
            tipo: "Física",
            descricao: "O monge emana pelo seu corpo uma aura laranja que envolve o seu em torno como um touro. Aumenta sua resistência em 20% e impede qualquer efeito imobilizador por 3 segundos. Ignora qualquer técnica que faria o monge se mover contra sua vontade.",
            custo_mana: "4.500 MP",
            cooldown: 0,
            nivel_desbloqueio: 60
        },
        {
            nome: "Golpe de uma Polegada",
            classe: "Monge",
            categoria: "Avançada",
            tipo: "Física",
            descricao: "Estenda seu punho de perto para destruir o inimigo por dentro infligindo um ferimento interno. Ignora parte da defesa do inimigo [35%]. A Mana do inimigo será parcialmente consumida, com o monge absorvendo 10% da Mana por turno.",
            custo_mana: "5.000 MP",
            cooldown: 0,
            nivel_desbloqueio: 70
        },
        {
            nome: "Resplendor Noturno",
            classe: "Monge",
            categoria: "Avançada",
            tipo: "Física",
            descricao: "Uma das habilidades mais poderosas de classe. O usuário conjura uma quantia absurda de poder avassalador em torno de seu corpo formando a cabeça de um dragão em torno de si. Seu atributo força aumenta em 300 por um turno. A cada turno sua força amplia nesse mesmo valor, porém, pela força da técnica seus ossos quebrariam todas as vezes que vc golpear. [Poções não funcionam e o healer deve ser Rank S para curar-lo.]",
            custo_mana: "10.000 MP",
            cooldown: 0,
            nivel_desbloqueio: 80
        }
    ],

    // =====================================
    // INQUISITOR
    // =====================================
    "Inquisitor": [
        {
            nome: "Perseguição",
            classe: "Inquisitor",
            categoria: "Avançada",
            tipo: "Física",
            descricao: "Ameace os inimigos e projéteis de magia próximos para persegui-lo. Se houver um monstro chefe nas proximidades, o monstro chefe será ameaçado primeiro. Reduz a Resistência de inimigos ameaçados em 30%. Se o alvo for um monstro, a velocidade de movimento do Inquisitor aumenta e ele se torna imune a habilidades de debuff por 30 segundos. Se o alvo for um Mago, sua resistência mágica aumenta em 30%.",
            custo_mana: "4.000 MP por Alvo",
            cooldown: 0,
            nivel_desbloqueio: 40
        },
        {
            nome: "Postura Defensiva",
            classe: "Inquisitor",
            categoria: "Avançada",
            tipo: "Defesa",
            descricao: "Mantenha uma postura defensiva que possa bloquear com uma espada de uma ou duas mãos ataques inimigos. Você não pode fugir ou se mover enquanto mantém a postura e a resistência aumenta em 40%. Ao bloquear o ataque do inimigo, o buff [Detectar Fraqueza] é aplicado por 5 segundos, e o Cooldown da habilidade reduz. Durante o buff [Detectar Fraqueza], o dano final aumenta em 25% ao atacar o inimigo.",
            custo_mana: "2.000 MP por turno na postura",
            cooldown: 0,
            nivel_desbloqueio: 50
        },
        {
            nome: "Lanius Capture",
            classe: "Inquisitor",
            categoria: "Avançada",
            tipo: "Passiva",
            descricao: "Esta habilidade passiva causa dano com base no atributo FOR. Qualquer corte ou feridas feitas pelo usuário é dado o debuff [Silenciar] Impedindo que seu inimigo conjure qualquer feitiço por três turnos. [Depois que a passiva acabar sobre o inimigo, ela só podera ser feita novamente neste mesmo após 2 turnos]. Caso o inimigo seja um mago o silenciar dura um turno extra.",
            custo_mana: "Nulo",
            cooldown: 0,
            nivel_desbloqueio: 60
        },
        {
            nome: "Triagem Inquisidora",
            classe: "Inquisitor",
            categoria: "Avançada",
            tipo: "Física",
            descricao: "Passiva: Quando o personagem é infligido por qualquer debuff suas defesas físicas e elementais são aprimoradas em 15% [Max 30%]. O inquisidor absorverá dano de um único aliados que estiver perto da morte. Emanando uma aura negra sobre a lâmina dando um efeito ativo. Ativo: Ao portar uma arma pesada (espada longa, machado e etc) o portador pode usar 'Triagem', uma aura negra que cobre a lâmina qual permite que ele corte facilmente entre técnicas mágicas elementares conjuradas no campo. [Caso sua FOR/PM seja maior que a da técnica].",
            custo_mana: "3.500 MP",
            cooldown: 0,
            nivel_desbloqueio: 70
        },
        {
            nome: "Exterminador de Fadas",
            classe: "Inquisitor",
            categoria: "Avançada",
            tipo: "Física",
            descricao: "Uma técnica especial exclusiva de inquisidor, que permite que o mesmo envolva seu corpo em uma aura mágica de resistência igualitária ao PM. Qualquer inimigo que for atingido pelos golpes do inquisidor enquanto a técnica estiver ativa terão sua Mana vetada por 2 turnos. Caso o inimigo tenha ou já teve a classe 'Mago', todo sua mana seria reduzida em 10% a cada ferida causada. Magos com o debuff 'Silenciar' recebem dano equivalente ao PM do usuário em ataques cortantes.",
            custo_mana: "4.000 MP",
            cooldown: 0,
            nivel_desbloqueio: 80
        }
    ],

    // =====================================
    // ESGRIMISTA
    // =====================================
    "Esgrimista": [
        {
            nome: "Calda de Ferro",
            classe: "Esgrimista",
            categoria: "Avançada",
            tipo: "Física",
            descricao: "Ataque os inimigos à sua frente rapidamente com um florete. Aumenta o dano contra monstros chefes grandes em 20%. Acerto crítico em inimigos atordoados aumenta em 100%. Aplica-se com uma taxa de ataque crítico aumentada em 50% quando o ataque é atingido com precisão. [Na cabeça]",
            custo_mana: "Nulo",
            cooldown: 0,
            nivel_desbloqueio: 40
        },
        {
            nome: "Perfurar",
            classe: "Esgrimista",
            categoria: "Avançada",
            tipo: "Física",
            descricao: "Girando a ponta de sua espada, o esgrimista consegue desviar o ataque do inimigo. Bloqueia completamente o ataque do inimigo durante o movimento de seu braço, usando da rarpier para atingir o ponto fraco de equilíbrio da técnica a fazendo desviar. Quanto maior a arma maior o efeito.",
            custo_mana: "Nulo",
            cooldown: 0,
            nivel_desbloqueio: 50
        },
        {
            nome: "Rosário da Espada",
            classe: "Esgrimista",
            categoria: "Avançada",
            tipo: "Passiva",
            descricao: "Uma técnica passiva exclusiva de esgrimista, qual a cada golpe consecutivo de sua rarpier sua agilidade aumenta até o fim do combo. Técnicas podem ser usadas para aprimorar o número de golpes acertados. A cada golpe consecutivo acertado sua velocidade aumenta em 10% [11 golpes/110%], caso o combo seja interrompido a passiva é zerada, após o fim do combo o buff é zerado até o uso novamente.",
            custo_mana: "Nulo",
            cooldown: 0,
            nivel_desbloqueio: 60
        },
        {
            nome: "Avanço Rápido",
            classe: "Esgrimista",
            categoria: "Avançada",
            tipo: "Física",
            descricao: "O Esgrimista aumenta sua velocidade momentaneamente durante um único segundo até 100%, podendo se mover em uma única direção até 3 metros quadrado. Segurando sua espada a frente de seu corpo para penetrar a defesa do inimigo. O inimigo atingido pela ponta da espada tem 25% de resistência ignorada pelo golpe.",
            custo_mana: "4.000 MP",
            cooldown: 0,
            nivel_desbloqueio: 70
        },
        {
            nome: "En Garde",
            classe: "Esgrimista",
            categoria: "Avançada",
            tipo: "Defesa",
            descricao: "A técnica exclusiva de esgrimista. Uma habilidade em área expansiva que conjura uma barreira que afasta todos os inimigos exceto um qual seja de escolha do próprio esgrimista. Esse inimigo é obrigado a lutar 1x1 contra o esgrimista e a única forma da barreira sumir é um dos dois sendo derrotados. A barreira não pode ser quebrada por formas comuns de ataques ou ataques mágicos. O Esgrimista enquanto dentro da barreira só pode enfrentar o inimigo selecionado, e não pode abaixar a barreira até derrotar-lo.",
            custo_mana: "5.000 MP",
            cooldown: 0,
            nivel_desbloqueio: 80
        }
    ],

    // =====================================
    // ALCHEMIST
    // =====================================
    "Alquimista": [
        {
            nome: "Conhecimento de Mana",
            classe: "Alquimista",
            categoria: "Avançada",
            tipo: "Mágica",
            descricao: "A habilidade exclusiva de Alquimista, envolvendo apenas magia elemental. O usuário forma letras/runas de mana natural e as organiza para formar instruções de magia. Esses arranjos podem ser aplicados diretamente a um feitiço ou formar um círculo mágico maior. Instruções simples requerem apenas arranjos simples, mas designs mais complexos podem criar feitiços e efeitos mais poderosos. Quanto maior a ordem que vc da à um feitiço, maior o gasto de mana.",
            custo_mana: "3.000 MP, aumentando nessa quantia para arranjos maiores",
            cooldown: 0,
            nivel_desbloqueio: 40
        },
        {
            nome: "Círculo da Recomposição",
            classe: "Alquimista",
            categoria: "Avançada",
            tipo: "Mágica",
            descricao: "O mesmo pode conduzir círculos mágicos para controlar a terra abaixo de seus pés, dando de pequenas a grandes formatos para o uso no combate. Podendo formular desde armas detalhadas a armas simples de pedra. A criatividade do alquimista seria uma grande vantagem ao adquirir está técnica.",
            custo_mana: "4.500 MP por círculo",
            cooldown: 0,
            nivel_desbloqueio: 50
        },
        {
            nome: "Círculo de Compreensão",
            classe: "Alquimista",
            categoria: "Avançada",
            tipo: "Passiva",
            descricao: "Passiva única de alquimista. Utilizando de materiais reais o mesmo pode formar novos tipos de feitiços apartir de um estudo aprimorado sobre um elemento natural. Podendo criar fórmulas avançadas com o método de mana, o usuário consegue injetar magia dentro de experimentos para surgir novas possibilidades. Exemplo seria gerar gás para então queimar-lo e aumentar seu poderio. [Maestria em orbes e cajados 15/15]",
            custo_mana: "6.500 MP",
            cooldown: 0,
            nivel_desbloqueio: 60
        },
        {
            nome: "Círculo da Destruição",
            classe: "Alquimista",
            categoria: "Avançada",
            tipo: "Mágica",
            descricao: "Um círculo mágico conjurado para interferir diretamente na natureza de um material podendo torna-lo maleável. O material em si tem sua estrutura molecular quebrada e só pode ser impedida por magia. A magia diferente da ciência não pode ser interferida pela alquimia, porém caso o método de mana seja aplicado a interferência na magia ou no objeto é de acordo com o PM.",
            custo_mana: "5.000 MP",
            cooldown: 0,
            nivel_desbloqueio: 70
        },
        {
            nome: "Pedra Filosofal",
            classe: "Alquimista",
            categoria: "Avançada",
            tipo: "Suporte",
            descricao: "Um tabu entre os alquimista. Uma habilidade exclusiva de Alquimista, onde ao acumular 5 pedras de mana, de Boss, o mesmo consegue gerar uma pedra filosofal. A pedra em si é indestrutível e concede ao seu dono mana abundante. Quanto maior o número de pedras de boss do mesmo Rank você acumular e juntar, maior será a mana que a pedra criada ganhará. Lembrando que será 5 pedras do mesmo Rank para gerar uma pedra filosofal. [Só é possível equipar 4 por vez. Nos slots, de acessórios.]",
            custo_mana: "Nulo",
            cooldown: 0,
            nivel_desbloqueio: 80
        }
    ],

    // =====================================
    // GRANDE MAGO
    // =====================================
    "Grande Mago": [
        {
            nome: "Onda de Energia Escura",
            classe: "Grande Mago",
            categoria: "Avançada",
            tipo: "Mágica",
            descricao: "Acumulando uma quantidade de Mana muito grande na palma de suas mãos juntas, o mesmo consegue acumular uma esfera de energia azulada que é impulsionada em uma única direção. O alcance da técnica varia de 20 a 30m. A técnica pode se manter ativa gastando por turno afim de perfurar defesas.",
            custo_mana: "5.000 MP",
            cooldown: 0,
            custo_por_turno: "2.000 MP",
            nivel_desbloqueio: 40
        },
        {
            nome: "Lua Sombria",
            classe: "Grande Mago",
            categoria: "Avançada",
            tipo: "Mágica",
            descricao: "O usuário cria uma esfera de magia branca semelhante a uma lua gigantesca, a lua possui a eficácia que qualquer magia que a atingir ou tiver em seu caminho seja atravessada pela técnica. Uma vez que essa técnica possui um gasto muito alto, ela também mantém um equilíbrio entre defesa e ataque perfeito. Passiva Secreta: Gastando o triplo de mana nesta técnica, ela evolui para uma técnica conhecida como 'Aura Etérea', onde ela ganha uma camada de mana que anula dano físico tomado por um único turno.",
            custo_mana: "5.000 MP",
            cooldown: 0,
            nivel_desbloqueio: 50
        },
        {
            nome: "Ajuda Mágica",
            classe: "Grande Mago",
            categoria: "Avançada",
            tipo: "Passiva",
            descricao: "Passiva exclusiva de Grande Mago. Todos os ataques mágicos do usuário custam o dobro de mana ao serem utilizados, suas técnicas possuem velocidade adicional de acordo com o PM e Dano em poder mágico adicional dobrado. Uma vez que o grande mago conjurar uma magia, durante 2 segundos após o uso de uma técnica, ele pode conjurar uma segunda magia elemental logo em seguida com o triplo de mana para surpreender inimigos.",
            custo_mana: "Nulo",
            cooldown: 0,
            nivel_desbloqueio: 60
        },
        {
            nome: "Quebra de Barreira",
            classe: "Grande Mago",
            categoria: "Avançada",
            tipo: "Mágica",
            descricao: "Cria uma camada de mana carregada em torno de um cajado qual o grande mago carrega. O cajado ganha em atributo FOR temporariamente todo o PM do usuário para atacar inimigos, durante 2 turnos. Ao acertar o alvo, ele diminui sua defesa mágica em 25% por 2 turnos. Porém fica incapaz de usar outras magias.",
            custo_mana: "5.000 MP",
            cooldown: 0,
            nivel_desbloqueio: 70
        },
        {
            nome: "Poder Latente",
            classe: "Grande Mago",
            categoria: "Avançada",
            tipo: "Suporte",
            descricao: "Diferente de outras classes, grande mago ganha a capacidade de aumentar seus atributos em PM a cada turno com o Poder latente. Esse é um efeito de dentro do 'Sistema', uma espécie de barra de energia pontilhada do 1 ao 7, onde a cada turno de batalha se aumenta em um de poder latente. Cada barra de poder latente utilizado os efeitos variam de técnica para técnica. Técnicas de Turno: a cada dois de poder latente utilizado, aumenta um turno de uma técnica de auto buff. Técnicas de Dano: A cada 3 de poder latente utilizado a técnica aumenta em 25% em seu PM e aumenta seu alcance chegando a 50M. Passiva secreta: Ao consumir 7 de poder latente o usuário gera uma técnica exclusiva conhecida como Advento Estelar, onde ele conjura um único meteoro de forma gigantesca.",
            custo_mana: "15.000 MP",
            cooldown: 0,
            nivel_desbloqueio: 80
        }
    ],

    // =====================================
    // FEITICEIRO
    // =====================================
    "Feiticeiro": [
        {
            nome: "Capa de Energia Negra",
            classe: "Feiticeiro",
            categoria: "Avançada",
            tipo: "Suporte",
            descricao: "Uma camada de mana azulada sobre a pele, essa camada aumenta os atributos de resistência, agilidade e força e produz um grande poder de ataque para o mago. Diferente de outros efeitos, essa técnica pode ser utilizada para manter a camada indefinidamente pelo gasto ser muito baixo e o custo inicial bem alto. Enquanto não tiver em combate a mana se torna tão fina que parece ser invisível. Resistência aumentada em 45%, Força em 35% e Agilidade em 20%. Esses são os valores original da técnica, porém o feiticeiro consegue diminuir ou aumentar distribuindo igualmente os valores de porcentagem para se adequar a situação. O feiticeiro fica impossibilitado de utilizar qualquer outro feitiço ou magia, durante o efeito desta técnica.",
            custo_mana: "8.000 MP",
            cooldown: 0,
            custo_por_turno: "2.500 MP",
            nivel_desbloqueio: 40
        },
        {
            nome: "Energia Positiva",
            classe: "Feiticeiro",
            categoria: "Avançada",
            tipo: "Cura",
            descricao: "Ao acumular uma boa quantidade de Mana Negra, o usuário cria uma camada de mana positiva em torno de seu corpo que cura suas feridas leves e medianas de forma instantânea. Técnicas de auto buff não podem ser usadas enquanto está técnica está ativa e vice-versa. Para efeitos mais poderosos o gasto de mana será 4x maior. (Como regenerar um membro cortado).",
            custo_mana: "6.000 MP",
            cooldown: 0,
            nivel_desbloqueio: 50
        },
        {
            nome: "Magia Desarmante",
            classe: "Feiticeiro",
            categoria: "Avançada",
            tipo: "Mágica",
            descricao: "Uma vez que o usuário avança em direção a um inimigo com um varinha ou cajado, ele libera um raio avermelhado em direção às mãos do inimigo fazendo o mesmo soltar sua arma naquele segundo, uma técnica de efeito desarmante que pode ser usado para surpreender oponentes.",
            custo_mana: "5.000 MP",
            cooldown: 0,
            nivel_desbloqueio: 60
        },
        {
            nome: "Criadouro do Vazio",
            classe: "Feiticeiro",
            categoria: "Avançada",
            tipo: "Mágica",
            descricao: "Uma técnica onde em um único epicentro o feiticeiro armazena uma energia negra tão poderosa no local que se torna um vácuo forçando por si mesmo o ar ser pressionado, a área é corrigida e então todo e qualquer inimigo nesse alcance recebe um grande dano de sucção. Magias não são afetadas por essa técnica, pois são feitas por mana e ela afeta diretamente o mundo a sua volta, isso de certa forma torna a técnica eficaz contra a maioria das barreiras. A habilidade detém de uma área de 20m².",
            custo_mana: "6.000 MP",
            cooldown: 0,
            custo_por_turno: "2.000 MP",
            nivel_desbloqueio: 70
        },
        {
            nome: "Domínio de Mana",
            classe: "Feiticeiro",
            categoria: "Avançada",
            tipo: "Mágica",
            descricao: "O Usuário expande sua mana em sua volta manifestando sobre o espaço dentro de uma área de 10m o alcance de suas técnicas. Ofensivamente, a Zona de Mana pode ser canalizada em feitiços para aumentar seu tamanho, número e alcance. Também pode ser usada para lançar ataques em qualquer direção e de qualquer direção dentro do domínio. Feitiços podem ser criados ao redor de um alvo para impedi-los de escapar, dentro do feitiço de um inimigo para destruí-lo, ou atrás de um alvo para pegá-los de surpresa. O alcance da técnica pode ser ampliada de acordo com o Rank de usuário. Rank C — 10m, Rank B — 15m, Rank A — 30m, Rank S — 50m.",
            custo_mana: "10.000 MP",
            cooldown: 0,
            custo_por_turno: "5.000 MP",
            nivel_desbloqueio: 80
        }
    ],

    // =====================================
    // ARCHON
    // =====================================
    "Archon": [
        {
            nome: "Gnosis elemental",
            classe: "Archon",
            categoria: "Avançada",
            tipo: "Passiva",
            descricao: "O caminho para se tornar um Arconde, uma pessoa que detém em si a força suprema e absoluta sobre um elemento. No momento em que você pega essa habilidade, uma nova aba se abre para o usuário, a aba de chama [Os 7 Gnosis]. Os Gnosis são 7 itens místicos, no qual representam cada um dos 7 elementos. Cada Gnosis custa aproximadamente [2.000.000 Wons]. Os seguintes Gnosis disponíveis no sistema são: [🔥] Fogo: Disponível, [💧] Água: Disponível, [⛰️] Terra: Disponível, [⚡] Eletricidade: Disponível, [🌿] Planta: Disponível, [❄️] Gelo: Disponível, [🌪️] Vento: Disponível. Ao se tornar usuário de um Gnosis, o usuário recebe os seguintes buffs: [+500 Pontos em inteligência] e seus Ataques Elementais daquele elemento recebem um Buff de [+100% de dano]. Ao se tornar um Arconde, você perde o acesso às habilidades elementais dos elementos que o usuário não escolheu. Apenas [1] mago pode ter um Gnosis de cada elemento, então se alguém pegar o Gnosis de fogo, mais ninguém poderá ter ele até que o atual portador morra.",
            custo_mana: "Nulo",
            cooldown: 0,
            nivel_desbloqueio: 40
        },
        {
            nome: "Purificação do Arconde",
            classe: "Archon",
            categoria: "Avançada",
            tipo: "Suporte",
            descricao: "Atraves dos poderes concedidos pelo Gnosis, o usuário dessa habilidade consegue criar uma espécie de 'Capacidade de purificação', na qual permite com que o usuário consiga tirar [1] debuff, podendo ser tanto do usuário quanto de seus aliados. Para retirar totalmente o debuff, a [Inteligente do usuário precisa ser maior que a PM do inimigo]. Para curar um aliado de um debuff/efeito negativo, você precisa tocar nele.",
            custo_mana: "6.000 MP",
            cooldown: 0,
            nivel_desbloqueio: 50
        },
        {
            nome: "Personificação do Arconde",
            classe: "Archon",
            categoria: "Avançada",
            tipo: "Passiva",
            descricao: "Através do Gnosis que habita dentro do corpo do usuário, o receptáculo do Gnosis recebe um Buff físico passivo dependendo do elemento ao qual o Gnosis do usuário pertence. Abaixo estão os buffs físicos dos respectivos Gnosis: [🔥] Fogo: +40% em força, [💧] Água: +40% em Agilidade, [⛰️] Terra: +40% em resistência, [⚡] Eletricidade: +40% em Agilidade, [🌿] Planta: +40% em resistência, [❄️] Gelo: +40% em força, [🌪️] Vento: +40% em agilidade. Além disso, o Gnosis [Planta] possui um efeito passivo adicional, no qual se trata de uma cura de nível [Moderado], podendo curar ferimentos simples/músculos danificados de forma passiva e semiinstantânea.",
            custo_mana: "Nulo",
            cooldown: 0,
            nivel_desbloqueio: 60
        },
        {
            nome: "Essência da pura magia",
            classe: "Archon",
            categoria: "Avançada",
            tipo: "Mágica",
            descricao: "Sendo uma das habilidades mais básicas de um Arconde, o usuário gera através da mana uma sequência de círculos mágicos que vão se expandindo conforme o gasto de mana do usuário (Ex: O 1° círculo: 5M e 5.000MP. 2° círculo: 10M e 10.000MP. 3° círculo: 15M e 15.000MP e por aí vai. Cada círculo aumenta o tamanho em 5M e o custo de mana em 5.000MP). Quando o usuário terminar a conjuração de todos os círculos no qual o usuário julga necessário, o mesmo então dá o comando [Destrua tudo], ao dizer essas palavras, um grande pilar de energia então é criado, destruindo tudo dentro da área dos círculos. O pilar de energia em si não possui um elemento fixo, se adaptando ao 'Gnosis' na qual o usuário detém dentro de si. Cada círculo mágico criado dá um aumento de [+10%] na [PM] do usuário, com um limite máximo de [+100% de PM], vulgo 10 círculos mágicos. Essa habilidade é um feitiço de [Turno único]",
            custo_mana: "5.000 MP (+5.000MP Por círculo)",
            cooldown: 0,
            nivel_desbloqueio: 70
        },
        {
            nome: "Domínio do Arconde",
            classe: "Archon",
            categoria: "Avançada",
            tipo: "Mágica",
            descricao: "Sendo a habilidade assinatura de um Arconde, O domínio do Arconde faz com que, através do Gnosis dentro do corpo do usuário, ele consiga criar uma espécie de redoma através do elemento que o Gnosis detém. A Redoma criada pelo usuário possui uma área total de [50M], é dentro desse domínio, o usuário consegue transformar ou alterar as propriedades do ambiente material ao seu redor para corresponder à natureza do Gnosis, bem como manipular o material transformado da maneira que desejar. Essa capacidade de alteração de matéria não pode afetar seres vivos, só coisas inanimadas.",
            custo_mana: "50.000 MP",
            cooldown: 0,
            custo_por_turno: "20%",
            nivel_desbloqueio: 80
        }
    ],

    // =====================================
    // DRUIDA
    // =====================================
    "Druida": [
        {
            nome: "Conexão Com a Natureza",
            classe: "Druida",
            categoria: "Avançada",
            tipo: "Suporte",
            descricao: "Diferente de outras classes, a classe Druida e uma classe no qual possui uma grande conexão com a natureza, assim conseguindo manipulação a mana natural do ambiente com grande maestria e habilidade, assim o usuário consegue acelerar o processo de criação de plantas a sua volta, é também as manipular para Criar vinhas, madeira e outras coisas no qual podem ser explorado nas habilidades únicas. A manipulação do crescimento depende do ambiente a sua volta, afinal o usuário não cria árvores, mas sim apenas manipula seu crescimento e formato.",
            custo_mana: "3.500 MP",
            cooldown: 0,
            nivel_desbloqueio: 40
        },
        {
            nome: "Círculo Infinito",
            classe: "Druida",
            categoria: "Avançada",
            tipo: "Passiva",
            descricao: "Uma técnica passiva que permite com que os druidas gerem círculos contínuos de magia e técnica para sempre manter o inimigo ocupado com suas habilidades quase que limitadas de mana. Além de que, druidas podem regenerar [5%] de forma passiva ao absorver a mana do ambiente em sua volta, e caso o usuário esteja em uma floresta, esse efeito de regen de mana vai para [10%]. Ativa: Toda técnica mágica realizada por um Druida ou caso ele impulsione a técnica, ela se tornará um ciclo infinito, fazendo ela sempre se auto-restaurar para o início até que a mana do druida acabe.",
            custo_mana: "3.000 MP",
            cooldown: 0,
            nivel_desbloqueio: 50
        },
        {
            nome: "Transformação: Fênix Dourada",
            classe: "Druida",
            categoria: "Avançada",
            tipo: "Transformação",
            descricao: "O usuário consegue se transformar em um pássaro de fogo de tonalidade amarela de 5m de altura. Essa técnica dá ao Usuário uma capacidade de Regeneração a um nível absurdo, assim fazendo o usuário conseguir regenerar até mesmo membros arrancados através de suas chamas, mas também devido a isso ser uma habilidade mágica, o usuário precisa gastar mana para regenerar. Essa transformação permite ao usuário soltar bolas de fogo de suas asas e rajadas de fogo de seu bico. Atributos: +25% em PM e +30% em Inteligência",
            custo_mana: "5.000 MP",
            cooldown: 0,
            custo_por_turno: "3.000 MP",
            custo_cura: "2.500 MP",
            nivel_desbloqueio: 60
        },
        {
            nome: "Transformação: Cervo Fada",
            classe: "Druida",
            categoria: "Avançada",
            tipo: "Transformação",
            descricao: "Uma transformação menor que as outras, tendo apenas o tamanho de um Cervo normal, é considerada uma das transformações mais belas dos caçadores. No primeiro Turno de ativação, o usuário consegue carregar uma quantidade de energia do ambiente conhecida como 'GEO', a quantidade é uma característica que retira a mana do ambiente e acumula no usuário durante o turno no qual o usuário usa da transformação. No segundo turno, o usuário ganha um aumento de [30%] em poder mágico, resistência e velocidade. Essa técnica possui 3 estágios de ativação, onde a cada Turno carregado após a primeira ativação, ganha o buff novamente.",
            custo_mana: "6.000 MP",
            cooldown: 0,
            custo_por_turno: "3.500 MP",
            nivel_desbloqueio: 70
        },
        {
            nome: "Transformação: Lobo Faminto/transformação Sagrada",
            classe: "Druida",
            categoria: "Avançada",
            tipo: "Transformação",
            descricao: "— Homem: O Usuário consegue se transformar em um lobo cinzento que anda sobre duas patas de 15m de tamanho, caso o Druida transformado nessa forma for um homem, seu controle será muito mais forte. O lobo insaciável consegue acumular mana em sua boca, e então a libera em forma de rajadas de energia poderosas. Quando magias mais fracas que a resistência do usuário se aproximam do mesmo, o lobo pode devorar essas magias para recuperar sua mana de acordo com o gasto da Magia. Quando o usuário absorve uma técnica, ele recebe um aumento de dano de [30%] uma única vez. Atributos: +60% em resistência e força. — Mulher: Normalmente, mulheres druidas são mais fortes que os homens ao manifestarem suas transformações, por isso, ao invés de apenas se transformarem, elas se conectam diretamente com sua fera interior, podendo assim virar a própria fera em si. Sua forma não é definida pós ela toma a forma daquilo que o inimigo mais teme, assim ganhando os Poderes daquilo que ela se transformou. Quando transformada no pesadelo do inimigo, ele é afetado diretamente por seu córtex cerebral para sentir um medo indescritível do Druida, assim ficando paralisado por 3 Turnos devido ao medo indescritível. não tem escapatória para esse efeito já quê a habilidade entra na mente do oponente, fazendo ele sentir forçadamente esse medo indescritível de não importa qual seja seu medo. Quanto aos mobs do Tipo fera, essa técnica é Utilizada para o Druida se tornar a versão mágica do predador daquela criatura.",
            custo_mana: "8.000 MP",
            cooldown: 0,
            custo_por_turno: "4.500 MP",
            nivel_desbloqueio: 80
        }
    ],

    // =====================================
    // WARDEN
    // =====================================
    "Warden": [
        {
            nome: "Chama",
            classe: "Warden",
            categoria: "Avançada",
            tipo: "Passiva",
            descricao: "O Fogo Negro não queima apenas matéria, mas sim a própria vida. Seus ataques deixam queimaduras impossíveis de serem apagadas por meios normais, consumindo a vítima até sua completa erradicação. Esse fogo cresce conforme a vitalidade do inimigo diminui, tornando-se uma maldição ardente que impede qualquer forma de ressurreição ou reanimação. Para curar as chamas, o Healer precisa ter um poder mágico 50% maior do que o poder mágico do inimigo. Essa variação faz com que as habilidades de fogo do usuário gastem [+25%] de mana.",
            custo_mana: "Nulo",
            cooldown: 0,
            nivel_desbloqueio: 40
        },
        {
            nome: "Obscuro",
            classe: "Warden",
            categoria: "Avançada",
            tipo: "Passiva",
            descricao: "O Raio Negro é um trovão silencioso que não apenas queima, mas absorve luz e som, tornando seus ataques indetectáveis. Seu impacto desliga os nervos dos inimigos, causando paralisia progressiva e drenando sua energia vital. Além disso, sua natureza oculta faz com que esquivar-se dele seja praticamente impossível sem habilidades especiais. Essa variação faz com que as habilidades de raio do usuário gastem [+25%] de mana.",
            custo_mana: "Nulo",
            cooldown: 0,
            nivel_desbloqueio: 40
        },
        {
            nome: "Sal",
            classe: "Warden",
            categoria: "Avançada",
            tipo: "Passiva",
            descricao: "O Mar Negro não é feito de água comum, mas de sal vivo, uma substância corrosiva que seca qualquer ser vivo ao contato. Criaturas atingidas começam a cristalizar-se, transformando-se lentamente em estátuas de sal. Qualquer água tocada pelo Mar Negro torna-se inútil, Assim sendo naturalizada facilmente pelo Mar Negro. Essa variação faz com que as habilidades de água do usuário gastem [+25%] de mana.",
            custo_mana: "Nulo",
            cooldown: 0,
            nivel_desbloqueio: 40
        },
        {
            nome: "Eterno",
            classe: "Warden",
            categoria: "Avançada",
            tipo: "Passiva",
            descricao: "O Gelo Negro aprisiona o tempo dentro de sua frieza eterna. Diferente do gelo comum, que pode derreter, esse gelo nunca desaparece naturalmente e impede qualquer forma de regeneração ou recuperação. Criaturas congeladas por esse poder podem permanecer presas em um estado de estase perpétua, incapazes de pensar ou reagir até serem libertadas por um método extremamente raro. Para descongelar o gelo negro, e preciso da habilidade de Fogo negro. Essa variação faz com que as habilidades de Gelo do usuário gastem [+25%] de mana.",
            custo_mana: "Nulo",
            cooldown: 0,
            nivel_desbloqueio: 40
        },
        {
            nome: "Desmantelar",
            classe: "Warden",
            categoria: "Avançada",
            tipo: "Passiva",
            descricao: "A Terra Negra não cria montanhas, mas as desfaz. Seu poder reside na desintegração absoluta, fazendo com que qualquer estrutura, seja natural ou artificial, comece a desmoronar por dentro. Além disso, barreiras, armaduras e armas corroem gradualmente ao contato com essa força destrutiva. [Não funciona em seres com o sistema.] Essa variação faz com que as habilidades de Terra o usuário gastem [+50%] de mana.",
            custo_mana: "Nulo",
            cooldown: 0,
            nivel_desbloqueio: 40
        },
        {
            nome: "Decompor",
            classe: "Warden",
            categoria: "Avançada",
            tipo: "Passiva",
            descricao: "A Planta Negra é a antítese da vida, espalhando apodrecimento profundo por onde passa. Qualquer ser vivo tocado por essa magia começa a decompor-se por dentro, sofrendo dano contínuo e irreversível. Mesmo florestas inteiras podem ser transformadas em terrenos estéreis, e os afetados por essa maldição são incapazes de se curar, pois a podridão impede qualquer regeneração natural ou mágica. [Não funciona em seres com o sistema.] Essa variação faz com que as habilidades de planta do usuário gastem [+50%] de mana.",
            custo_mana: "Nulo",
            cooldown: 0,
            nivel_desbloqueio: 40
        },
        {
            nome: "Olhar do Abismo",
            classe: "Warden",
            categoria: "Avançada",
            tipo: "Mágica",
            descricao: "O Warden invoca uma manifestação do Submundo que fixa sua atenção em um alvo. Enquanto estiver sob o efeito dessa técnica, a vítima sente um peso esmagador sobre sua alma, reduzindo sua resistência em [35%] e tornando-a incapaz de recuperar mana de qualquer método.",
            custo_mana: "4.000 MP",
            cooldown: 0,
            nivel_desbloqueio: 50
        },
        {
            nome: "Ruína Iminente",
            classe: "Warden",
            categoria: "Avançada",
            tipo: "Mágica",
            descricao: "Ao ativar essa habilidade, o Warden marca o terreno ao seu redor com uma energia corrupta que se espalha lentamente, impregnando tudo ao seu alcance. Qualquer mago elemental aliado dentro dessa área sofrerá de um buff que altera seus feitiços elementais para o elemento da classe avançada warden.",
            custo_mana: "6.000 MP",
            cooldown: 0,
            custo_por_turno: "3.000 MP",
            nivel_desbloqueio: 60
        },
        {
            nome: "Ampliação Sonora",
            classe: "Warden",
            categoria: "Avançada",
            tipo: "Mágica",
            descricao: "Ampliação Sonora permite ao Warden gerar rajadas sonoras destrutivas ou amplificar sons existentes para criar ataques devastadores. Ele pode transformar um simples grito em uma onda de choque, tornar um sussurro ensurdecedor ou até redirecionar ataques sonoros inimigos, desestabilizando adversários e manipulando o campo de batalha com vibrações intensificadas. As vibrações causadas pelo usuário Possuem um dano igual a [PM+30%]",
            custo_mana: "3.000 MP (Por Ataque)",
            cooldown: 0,
            nivel_desbloqueio: 70
        },
        {
            nome: "Audição Sombria [Passivo]",
            classe: "Warden",
            categoria: "Avançada",
            tipo: "Passiva",
            descricao: "O Warden possui uma audição extremamente sensível, capaz de captar sons a quilômetros de distância. Com concentração, ele pode detectar até mesmo o som sutil de um arco sendo tensionado ou o clique de um gatilho, permitindo que antecipe ataques e rastreie inimigos com precisão absoluta, tornando-se praticamente impossível de ser surpreendido.",
            custo_mana: "Nulo",
            cooldown: 0,
            nivel_desbloqueio: 80
        }
    ],

    // =====================================
    // CATALYS
    // =====================================
    "Catalys": [
        {
            nome: "Efeito Elemental",
            classe: "Catalys",
            categoria: "Avançada",
            tipo: "Passiva",
            descricao: "Os efeitos elementais se mantêm ativos por um período de [2 turnos], variando conforme o tipo de ataque que os aplicou. Ao atingir um inimigo, este fica marcado com a aura correspondente ao elemento utilizado. É importante notar que, caso ocorra uma Reação Elemental, os efeitos serão removidos, embora certas condições possam permitir que alguns deles persistam após a reação, dependendo da natureza do ataque e do tipo de reação desencadeada. As reações elementais não possuem tempo de recarga, permitindo que sejam realizadas sempre que as condições certas forem atendidas. Entretanto, as habilidades responsáveis por aplicar esses efeitos têm seus próprios tempos de espera antes que possam ser utilizadas novamente. As marcas visuais dos elementos são as seguintes: Fogo: o inimigo brilhará em um intenso tom vermelho, Água: uma aura azulada envolverá a vítima, Raio: uma iluminação roxa começará a pulsar ao redor do oponente, Terra: o inimigo será cercado por uma radiação laranja, Gelo: um brilho frio e branco tomará conta do alvo, Vento: uma aura verde claro dançará ao redor do adversário. Através desdes elementos, o usuário consegue usar as capacidades das reações elementais.",
            custo_mana: "Nulo",
            cooldown: 0,
            nivel_desbloqueio: 40
        },
        {
            nome: "Vaporização",
            classe: "Catalys",
            categoria: "Avançada",
            tipo: "Mágica",
            descricao: "Vaporização é uma reação elemental que aumenta o dano de ataques de água ou fogo quando atingem inimigos marcados por esses elementos, aumentando o dano em [+45%]. O dano é influenciado pela soma do Ataque e poder mágico do personagem.",
            custo_mana: "4.000 MP",
            cooldown: 0,
            nivel_desbloqueio: 50
        },
        {
            nome: "Sobrecarga",
            classe: "Catalys",
            categoria: "Avançada",
            tipo: "Mágica",
            descricao: "Sobrecarga é causado em uma reação elemental de fogo e raio. A Sobrecarga aumenta o dano baseado apenas no nível e poder mágico do personagem. A cada [10 níveis], o personagem ganha [+30 pontos] adicionais em poder mágico para essa reação. Por exemplo: no nível 30, o poder mágico adicional é de 90 pontos ao causar uma sobrecarga. Os pontos só influenciam no [Dano da sobrecarga]",
            custo_mana: "4.000 MP",
            cooldown: 0,
            nivel_desbloqueio: 60
        },
        {
            nome: "Fusão",
            classe: "Catalys",
            categoria: "Avançada",
            tipo: "Mágica",
            descricao: "O dano de Fusão é um aspecto interessante que é influenciado pelo atributo PM. Esse dano resulta da interação entre os elementos Gelo e Fogo. A ordem em que esses elementos são aplicados desempenha um papel crucial no cálculo do dano. Se o segundo elemento aplicado for Gelo, o multiplicador de dano será de [1,5x]. No entanto, se o segundo elemento aplicado for Fogo, o multiplicador aumenta para [2x], resultando em um dano significativamente maior.",
            custo_mana: "5.000 MP",
            cooldown: 0,
            nivel_desbloqueio: 70
        },
        {
            nome: "Eletricamente Carregado",
            classe: "Catalys",
            categoria: "Avançada",
            tipo: "Mágica",
            descricao: "A habilidade 'Eletricamente Carregado' é uma Reação Elemental que ocorre quando um ataque de Raio atinge um alvo sob a influência de Água, ou quando um ataque de Água atinge um alvo eletrocutado. O dano causado por essa reação é determinado exclusivamente pelo poder mágico do personagem que a ativa. Além disso, a potência do dano aumenta à medida que você sobe de nível, recebendo um incremento de [18 pontos] de poder mágico a cada [5 níveis].",
            custo_mana: "3.000 MP",
            cooldown: 0,
            nivel_desbloqueio: 80
        }
    ],

    // =====================================
    // ARCANISTA
    // =====================================
    "Arcanista": [
        {
            nome: "Confecção Mágica",
            classe: "Arcanista",
            categoria: "Avançada",
            tipo: "Passiva",
            descricao: "Uma técnica mágica passiva de arcanista. Assim como o construtor no qual pode fazer itens físicos, os arcanistas devido ao seu alto nível de estudo, conseguem tornar itens físicos em mágicos, a partir de matérias mágicas já existentes. Utilizando de materiais específicos para encantar itens e os tornar tão poderoso quanto orbes, cajados, livros com propriedade mágicas e afins. Conferir [ #Encantamento ]",
            custo_mana: "Nulo",
            cooldown: 0,
            nivel_desbloqueio: 40
        },
        {
            nome: "Criador de Runas",
            classe: "Arcanista",
            categoria: "Avançada",
            tipo: "Suporte",
            descricao: "Uma habilidade exclusiva de arcanista, no qual permite ao usuário armazenar qualquer técnica do mesmo em formato de runas para as utilizar no combate, mas para isso, o usuário precisa desenhar em um local indicado. Caso o usuário armazene mana o suficiente, ele consegue gerar uma 'Runa mágica', e essas runas mágicas podem ser usadas por outros players para aprender a habilidade escrita na runa, mas caso o usuário morra, todas as runas aprendidas por aliados irão desaparecer.",
            custo_mana: "6.000 MP",
            cooldown: 0,
            nivel_desbloqueio: 50
        },
        {
            nome: "Maestria Arcana",
            classe: "Arcanista",
            categoria: "Avançada",
            tipo: "Passiva",
            descricao: "Habilidade passiva exclusiva da classe arcanista. Ao estudar por um longo tempo[7d] após avançar de classe, essa habilidade pode ser desenvolvida. Quando o usuário está em batalha, o mesmo ganha poder mágico bônus em suas técnicas de acordo com sua mana base, ganhando 10% de sua mana no poder Mágico da técnica. Um equilíbrio é mantido pela técnica, já que 10% do poder do usuário vai para sua inteligência/mana.",
            custo_mana: "Nulo",
            cooldown: 0,
            nivel_desbloqueio: 60
        },
        {
            nome: "Fluxo de Feitiço",
            classe: "Arcanista",
            categoria: "Avançada",
            tipo: "Mágica",
            descricao: "O usuário consegue gerar uma orbe de puro poder mágico que causa dano adicional igual a inteligência do usuário durante o Ataque. O fluxo mantém um debuff único conhecido como 'Rune', esse debuff tem a capacidade de armazenar magias, assim deixando as habilidades ativas do Oponente com delay, no qual elas só irão funcionar no próximo turno, mas ainda irá consumir a mana do Oponente como se ela fosse daquele Turno. Se essa técnica for conjurada no mesmo inimigo, ela irá se multiplicar para Todos os inimigos dentro de uma área de 10m.",
            custo_mana: "5.000 MP",
            cooldown: 0,
            nivel_desbloqueio: 70
        },
        {
            nome: "Runa Sobrecarregada",
            classe: "Arcanista",
            categoria: "Avançada",
            tipo: "Mágica",
            descricao: "Passivamente, as outras habilidades básicas do arcanista redefinem o Tempo de recarga e sobrecarga carregam o debuff fluxo. Quando o arcanista conjura sobrecarregar com 2 fluxos de Feitiços no mesmo inimigo, ele recebe um breve surto de velocidade de movimento[+20%]. Ao Conjurar, o arcanista arremessa uma carga de energia pura em linha reta, assim causando dano ao primeiro inimigo no qual a linha atingir. Se o alvo estiver afetado por sobrecarga, causa dano adicional de [+30%] e rebate para os próximos inimigos atingidos por sobrecarga.",
            custo_mana: "7.000 MP",
            cooldown: 0,
            nivel_desbloqueio: 80
        }
    ],

    // =====================================
    // TAOÍSTA
    // =====================================
    "Taoísta": [
        {
            nome: "Talismã de Encantamento",
            classe: "Taoísta",
            categoria: "Avançada",
            tipo: "Suporte",
            descricao: "Um pedaço de papel comum no qual ganha uma quantidade de mana sobrescrita em si, o tornando mais forte conforme o efeito no qual foi escrito no talismã. Essa classe consegue armazenar seus talismãs de efeitos de acordo com duas habilidades passivas e ativas para Conjurar algum efeito no momento de consumo do talismã. Uma vez que o talismã for usado, o usuário precisará criar outro talismã ou daquele mesmo talismã. O talismã pode ser controlado de forma Telecinética pelo taoista que o criou, Assim podendo gerar armadilhas e pressão nos inimigos[os talismãs de um taoista não podem ser destruídos por inimigos.]",
            custo_mana: "3.000 MP por talismã",
            cooldown: 0,
            nivel_desbloqueio: 40
        },
        {
            nome: "Talismã de Otoni",
            classe: "Taoísta",
            categoria: "Avançada",
            tipo: "Suporte",
            descricao: "Um talismã que pode armazenar elementos naturais e condições da natureza uma vez que foi colocado naquela condição pelo Elemental correspondente. O talismã em si funciona como um feitiço de Campo, no qual muda todo o ambiente com o elemento no qual foi armazenado no talismã. Ex: Caso o usuário esteja em uma nevasca, o usuário pode usar esse talismã para armazenar a nevasca para usá-la futuramente(isso é apenas um exemplo).",
            custo_mana: "5.000 MP",
            cooldown: 0,
            nivel_desbloqueio: 50
        },
        {
            nome: "Talismã de Ressonância",
            classe: "Taoísta",
            categoria: "Avançada",
            tipo: "Suporte",
            descricao: "Um talismã no qual o usuário utiliza em um único aliado. Uma vez que o taoista possuí uma ligação muito poderosa com o aliado ou amigo(1 semana de interação, Sendo pelo menos 2 Cenas de ambos por dia), ele cria uma runa permanentemente equipada que quando eles estão em contato físico, os 2 ganham um Buff de 80% em suas técnicas mágicas, além de compartilharem uma reserva de mana duplicada quando estão conectados. Essa ligação pode ser quebrada por terceiros, sendo impossível o taoista retirar a ligação por si só.",
            custo_mana: "5.000 MP",
            cooldown: 0,
            nivel_desbloqueio: 60
        },
        {
            nome: "Talismã da Purificação",
            classe: "Taoísta",
            categoria: "Avançada",
            tipo: "Suporte",
            descricao: "Um talismã cujo retira qualquer debuff e maldição realizado do inimigo quando é colocado no Aliado. Quanto maior o nível do taoista, maior será o efeito de negação de debuff. O taoista consegue utilizar desse talismã para criar barreiras, utilizando de vários talismãs em vários pontos em volta do usuário e de seus aliados, quando a barreira é erguida, ela impede qualquer coisa de a atravessar, o único jeito de desativar esse barreira e tirando todos os talismãs ao mesmo tempo.",
            custo_mana: "7.000 MP",
            cooldown: 0,
            nivel_desbloqueio: 70
        },
        {
            nome: "Nagumo: Reino dos Monarcas",
            classe: "Taoísta",
            categoria: "Avançada",
            tipo: "Mágica",
            descricao: "Um mundo repleto de destruição e morte. O taoista diferente de qualquer outra classe, tem uma ligação especial com a dimensão conhecida como 'Nagano', no qual essa dimensão é onde historicamente ocorreu antiga guerra entre os Monarcas e Governantes. àquele no qual chegou nesta dimensão está sujeito a morte facilmente caso encontrá-los. uma vez que o taoista possui consciência, ele apenas viajou ao mundo para observar o ambiente e para fuga. Cada vez que o taoista entrar na dimensão, ele tem uma chance de [1/20] de se encontrar com um monarca aleatório, e essa chance é sorteada pela adm. Nagano, pode ser Utilizada como uma dungeon para o usuário treinar. Uma vez por semana, ele pode utilizar desta técnica para enfrentar hordas de oponentes e ganhar XP equivalente a uma dungeon do seu Rank. Para o usuário diferenciar os mobs fracos dos mobs fortes, será necessário um alto nível de sentido[base]. Rank-C: será necessário 20 de sentidos, Rank-B: será necessário 30 de sentidos, Rank-A: será necessário 50 de sentidos, Rank-S: será necessário 100 de sentidos.",
            custo_mana: "8.000 MP",
            cooldown: 0,
            nivel_desbloqueio: 80
        }
    ],

    // =====================================
    // SÁBIO
    // =====================================
    "Sábio": [
        {
            nome: "Portal de Aparição",
            classe: "Sábio",
            categoria: "Avançada",
            tipo: "Mágica",
            descricao: "Teleporte-se para 3m para trás, deixando para trás uma aparição. A aparição permanece por um período de tempo[1 Turno] e recebe dano dos monstros em seu lugar e se move de acordo com a ordem do sábio. Danos direcionados a aparição, podem ser acumulados e então liberados de forma auto-explosiva.",
            custo_mana: "4.000 MP",
            cooldown: 0,
            nivel_desbloqueio: 40
        },
        {
            nome: "Compreensão da Dimensão",
            classe: "Sábio",
            categoria: "Avançada",
            tipo: "Mágica",
            descricao: "Uma técnica que lhe permite invadir uma Dungeon que esteja dentro de seu alcance de visão[30m]. O sábio consegue criar um portal que lhe guiará até dentro de uma Dungeon que esteja dentro de sua visão, sendo um dos únicos capazes de adentrar e invadir dungeons de outras guildas caso ele esteja próximo do local. Porém tome cuidado, não a câmeras dentro de uma Dungeon para filmar os acontecimentos. Sábio consegue entrar em dungeons vermelhas e sair de qualquer Dungeon quando quiser.",
            custo_mana: "7.000 MP",
            cooldown: 0,
            nivel_desbloqueio: 50
        },
        {
            nome: "Previsão do Espaço Tempo",
            classe: "Sábio",
            categoria: "Avançada",
            tipo: "Passiva",
            descricao: "Uma técnica no qual permite ao sábio sentir quando uma Dungeon irá surgir. Essa técnica em si é uma passiva exclusiva do usuário que aumenta seus sentidos ao ponto de deixar que antes mesmo de algo acontecer ou surgir, ele sentiria e reagiria no mesmo instante. Essa técnica permite que ele identifique rank de Dungeons sem nem mesmo ver, apenas sentindo a mana a sua volta. Os sábios sempre possuem cabelos brancos e comumente são velhos, pois pelos anos de estudo desenvolvem essas habilidades diferentes de qualquer outro mago. [60% em sentidos.]",
            custo_mana: "Nulo",
            cooldown: 0,
            nivel_desbloqueio: 60
        },
        {
            nome: "Renda Espacial",
            classe: "Sábio",
            categoria: "Avançada",
            tipo: "Mágica",
            descricao: "O sábio rasga o espaço ao redor de um inimigo causando dano mágico e um efeito de buff único conhecido como 'Crítico mágico'. Gastando uma boa quantidade de sua mana ele armazena uma mana de tonalidade roxa em sua mão e a balança rasgando todo o espaço tocado pela habilidade. Inimigos acertados recebem crítico mágico de 120%[ o mesmo do sistema de crítico]. Qualquer ataque mágico atingido durante 3 segundos no mesmo alvo que foi acertado por crítico mágico, também receberá o buff.",
            custo_mana: "7.000 MP",
            cooldown: 0,
            nivel_desbloqueio: 70
        },
        {
            nome: "Anjo Caído",
            classe: "Sábio",
            categoria: "Avançada",
            tipo: "Mágica",
            descricao: "Uma técnica simples porém eficaz, o sábio consegue conjurar portais que o teleporta para locais onde ele já esteve. O mesmo consegue ir para qualquer lugar criando um portal diretamente para onde um dia ele já foi, a técnica em si já é bem poderosa, porém ela dá aos aliados a possibilidade de ir junto a ele quando quiser.",
            custo_mana: "4.000 MP",
            cooldown: 0,
            nivel_desbloqueio: 80
        }
    ],

    // =====================================
    // MAGO RÚNICO
    // =====================================
    "Mago Rúnico": [
        {
            nome: "Método de Mana [Passivo]",
            classe: "Mago Rúnico",
            categoria: "Avançada",
            tipo: "Passiva",
            descricao: "Método de Mana, a técnica mágica única do mago Runico, o mago molda as runas e matrizes da mana natural do ambiente ao invés de puramente de seu próprio poder mágico; no entanto, esta técnica ainda requer que o mago tenha uma grande quantidade de poder mágicos. Como tal, os magos de tier C e abaixo são muito fracos para formar as runas corretamente. Ao utilizar esse método, todos os gastos de técnicas reduzem em [50%] do gasto de mana, porém caso seja Rank-C, a redução vai pra [25%]. Caso um jogador seja [15 níveis] abaixo do mago rúnico, ele pode se tornar seu aprendiz e adquirir essa passiva.",
            custo_mana: "Nulo",
            cooldown: 0,
            nivel_desbloqueio: 40
        },
        {
            nome: "Círculo do Chaos",
            classe: "Mago Rúnico",
            categoria: "Avançada",
            tipo: "Mágica",
            descricao: "O mago cria um círculo mágico à sua frente com um pentágono no centro, onde cada uma das cinco pontas brilha progressivamente a cada turno de carregamento. Para cada turno acumulado, a matriz concede [25%] de aumento no Poder Mágico(PM) da técnica que for lançada através dela. Se múltiplos feitiços forem disparados ao mesmo tempo, todos recebem esse bônus, tornando-se exponencialmente mais devastadores quanto maior for o tempo de carregamento. Porém, enquanto o usuário estiver carregando o círculo, ele não pode atacar.",
            custo_mana: "Aumenta o gasto do feitiço em 10% a cada turno carregando o círculo",
            cooldown: 0,
            nivel_desbloqueio: 50
        },
        {
            nome: "Marcas Rúnicas [passivo]",
            classe: "Mago Rúnico",
            categoria: "Avançada",
            tipo: "Passiva",
            descricao: "A cada 10 níveis, o Mago Rúnico pode inscrever permanentemente em sua pele feitiços próprios no formato de runas. Essas marcas concedem propriedades ampliadas, dobrando o alcance e triplicando o comprimento das técnicas seladas, também aumenta as capacidades do feitiço em [40%]. Além disso, sempre que o mago conjura um feitiço diretamente de seu corpo, as runas brilham em azul intenso, sinalizando o fluxo mágico aprimorado.",
            custo_mana: "Nulo",
            cooldown: 0,
            nivel_desbloqueio: 60
        },
        {
            nome: "Zero",
            classe: "Mago Rúnico",
            categoria: "Avançada",
            tipo: "Mágica",
            descricao: "O Mago Rúnico desenvolve a habilidade de converter magias de barreira em feitiços ofensivos. Sempre que conjurar uma barreira, ele pode optar por comprimi-la em uma esfera azulada altamente condensada, que é então disparada em linha reta com grande velocidade. A força do ataque depende da resistência original da barreira, tornando proteções mais poderosas em projéteis devastadores. Passiva secreta: Caso uma magia inimiga colida contra sua barreira no momento da ativação e o Poder Mágico (PM) do mago for superior ao da técnica adversária, ele pode absorver e fundir a magia inimiga à sua própria, amplificando ainda mais o ataque. Isso transforma a esfera em uma viga de energia altamente destrutiva, redirecionando o impacto de volta ao oponente com seu PM+PM da técnica do oponente.",
            custo_mana: "Custo do feitiço original+40%",
            cooldown: 0,
            nivel_desbloqueio: 70
        },
        {
            nome: "Runas Globais",
            classe: "Mago Rúnico",
            categoria: "Avançada",
            tipo: "Suporte",
            descricao: "A Runa Global é o ápice da magia rúnica, um item raro que só pode ser obtido por um Mago Rúnico ao derrotar um Boss de Dungeon usando o feitiço 'Zero'. Sempre que essa condição é atendida, o Boss obrigatoriamente deixa cair uma Runa Global, acompanhada de seu nome, representando a essência e os atributos da criatura. Ao esmagar a Runa Global, o mago absorve temporariamente todos os atributos do Boss, além de também ganhar uma aparência um pouco parecida com a do Boss durante três turnos. No entanto, essa runa é descartável e desaparece para sempre após o uso, sem possibilidade de reutilização. Além disso, as Runas Globais só podem ser adquiridas de Bosses narrados pela ADM, independentemente do Rank (E a S), garantindo que sua obtenção seja um efeito significativo. Aliados também podem esmagar a runa e usufruir de seus efeitos, permitindo estratégias colaborativas em combate. Caso a Runa Global seja utilizada na confecção de itens, seu efeito e atributos serão definidos exclusivamente pela ADM, tornando cada item criado a partir dela único e imprevisível.",
            custo_mana: "Nulo",
            cooldown: 0,
            nivel_desbloqueio: 80
        }
    ],

    // =====================================
    // DOMADOR
    // =====================================
    "Domador": [
        {
            nome: "Tempo das Bestas",
            classe: "Domador",
            categoria: "Avançada",
            tipo: "Suporte",
            descricao: "O domador concentra sua energia mágica, assim torcendo os fios da mente com os laços da natureza, para Assim subjugar as bestas selvagens ao seu comando. essa habilidade permite o domador influenciar e domar criaturas de níveis inferiores ao seu, podendo ser deste animais selvagens a monstros de baixo escalão. Para dominar um monstro é preciso gastar 4.000 de mana a cada 10 níveis nível da criatura[ex: Nível 50 -> 10.000 de mana pra domar][ O domador pode ensinar suas habilidades para a criatura domada. Após a etapa de dominação, a adm irá Criar a ficha da criatura para o player]",
            custo_mana: "4.000 MP [+4.000 MP a cada 10 níveis da criatura]",
            cooldown: 0,
            nivel_desbloqueio: 40
        },
        {
            nome: "Assimilação",
            classe: "Domador",
            categoria: "Avançada",
            tipo: "Suporte",
            descricao: "Uma habilidade exclusiva da classe domador. ao transferir sua alma para seu companheiro animal, o usuário consegue temporariamente habitar o Corpo do Animal como se fosse seu próprio corpo, assim podendo usar das magias e técnicas daquela criatura. Dura 5 turnos",
            custo_mana: "6.000 MP",
            cooldown: 0,
            nivel_desbloqueio: 50
        },
        {
            nome: "Conexão Perfeita",
            classe: "Domador",
            categoria: "Avançada",
            tipo: "Suporte",
            descricao: "A conexão Perfeita é uma poderosa habilidade de domador, no qual canaliza a conexão extremamente forte e única entre um Domador e sua criatura, assim permitindo com que eles combinem seus desejos e habilidades para formar um Ataque no qual transcende o limite daqueles 2. Podendo ser tanto uma técnica física ou mágica, ao serem combinadas, irão fazer uma soma entre os atributos de PM ou o AT do domador e da criatura, assim formando o dano final da técnica.",
            custo_mana: "7.000 MP",
            cooldown: 0,
            nivel_desbloqueio: 60
        },
        {
            nome: "Chamada de Matilha",
            classe: "Domador",
            categoria: "Avançada",
            tipo: "Suporte",
            descricao: "Uma habilidade passiva do domador, no qual quando o usuário assobiar, ele convoca uma grande quantidade de mobs que estão dentro da dungeon para ir em sua direção. Essa passiva permite que o Domador traga animais para suas armadilhas e facilite o trabalho de domá-los ou incapacitá-los.",
            custo_mana: "Nulo",
            cooldown: 0,
            nivel_desbloqueio: 70
        },
        {
            nome: "Evolução",
            classe: "Domador",
            categoria: "Avançada",
            tipo: "Suporte",
            descricao: "É uma transformação temporária no qual libera o verdadeiro poder que estava adormecido na criatura. A Evolução terá poderá mudar a aparência, a habilidade e suas estatísticas. A criatura volta ao seu estado normal após a batalha acabar ou caso seja derrotada. Somente uma criatura do domador pode evoluir pôr batalha. A criatura ganharia [+70%] em todos os atributos. Para evoluir uma criatura, o usuário precisa de uma pedra de mana originária da espécie da criatura no qual o usuário que evoluir[Só é possível pegar 5 pedras de mana da mesma criatura por dungeon.]",
            custo_mana: "10.000 MP",
            cooldown: 0,
            nivel_desbloqueio: 80
        }
    ],

    // =====================================
    // ONMYOUJI
    // =====================================
    "Onmyouji": [
        {
            nome: "Escritura do yin-yang",
            classe: "Onmyouji",
            categoria: "Avançada",
            tipo: "Mágica",
            descricao: "Imbuído seus dedos em energia mágica, o usuário é capaz de criar escrituras usando das habilidades do yin-yang, podendo criar as palavras tanto em uma superfície sólida quanto criar elas no próprio nada. As palavras do usuário podem ser usadas de forma ofensiva caso o usuário crie palavras que machucam usando da energia yin, como 'mal, Ataque, morra' e etc, também pode ser usado de forma defensiva ao criar palavras palavras boas usando com base a energia yang, como 'bem, defesa, viva' e etc. As palavras também são usadas para invocar os shikigamis ao escrever o nome deles usando a energia do yin-yang, mas a escritura não gasta mana caso ela seja usada para invocar shikigami(só a mana do gasto de invocação do shikigami irá contar). Só lembrando, você não escreve algo e aquilo vai acontecer de verdade, você apenas materializa a palavra em forma de energia yin-yang e usa para atacar o inimigo. A palavra começa com 1m de tamanho. Custo de ativação: 1.000 por palavra[+2.000 a cada+50cm no tamanho da palavra]",
            custo_mana: "1.000 MP por palavra",
            cooldown: 0,
            nivel_desbloqueio: 40
        },
        {
            nome: "Shikigami: Kijutsu-shi no Kitsune",
            classe: "Onmyouji",
            categoria: "Avançada",
            tipo: "Invocação",
            descricao: "O usuário invoca o espírito de uma raposa branca com uma cauda de ponta laranja. A raposa possui aproximadamente 90cm de altura. A raposa ilusionista possui a habilidade de Criar ilusões no Campo de batalha, o usuário pode manipular as ilusões e usar elas de forma estratégica tanto para suporte quanto para ataque. Os status da raposa tirando força e pm são iguais a [75%] do PM do usuário, força é igual a [50%] enquanto o pm da raposa é igual a [100%] do pm do usuário. E para o oponente cair na ilusão, a resistência dele precisa ser pelo menos de [80%] do PM da raposa. As ilusões só funcionam em uma área de 20M em torno da raposa. Custo de Invocação: 2.000. Custo por Turno: 40%",
            custo_mana: "2.000 MP",
            cooldown: 0,
            custo_por_turno: "40%",
            nivel_desbloqueio: 50
        },
        {
            nome: "Shikigami: Batorutātoru",
            classe: "Onmyouji",
            categoria: "Avançada",
            tipo: "Invocação",
            descricao: "O usuário invoca o espírito de uma tartaruga para a batalha. Diferente das tartarugas normais, a Batorutātoru é uma tartaruga um pouco humanoide que anda sobre 2 patas. tendo 5M de altura e pesando quase 300kg, a Batorutātoru possui olhos vermelhos e também é uma tartaruga de Batalha, no qual possui uma habilidade chamada 'terremoto' no qual sempre que a criatura se move, toda uma área de até 5M em volta da tartaruga treme. Os socos do Batorutātoru são tão fortes que se acertar, causam uma grande pressão de vento que empurra todo mundo em volta(3M) 2m para trás. Seu casco é forte o suficiente para fortes ataques. Todos os status da tartaruga tirando velocidade e resistência são igual a [75%] da PM do usuário, a velocidade é igual a [50%] e resistente igual a [100%]. Custo de Invocação: 5.000. Custo por turno: 40%",
            custo_mana: "5.000 MP",
            cooldown: 0,
            custo_por_turno: "40%",
            nivel_desbloqueio: 60
        },
        {
            nome: "Shikigami: Raijin Oni",
            classe: "Onmyouji",
            categoria: "Avançada",
            tipo: "Invocação",
            descricao: "O Usuário invoca o espírito maligno Raijin Oni, um poderoso oni capaz de controlar a eletricidade. O Raijin Oni é um ser humanoide com pele preta e um corpo cheio de músculos, possui chifres em sua cabeça e grandes braceletes em seus braços, sua altura é de aproximadamente 10m. A habilidade do Raijin Oni é conhecida como 'força do deus Raijin' no qual permite o oni usar de habilidades elétricas, podendo usar a eletricidade para criar poderosos ataques de raio. Os status do Raijin Oni tirando força e velocidade são iguais a [75%] do pm do usuário, força é igual a [100%] do pm enquanto velocidade é igual a [50%] do pm do usuário. e suas habilidades elétricas só funcionam em uma área de até 15m. Caso os Ataques de raio acertam o Oponente, se a defesa dele for menor que [90%] do pm do Raijin, o Oponente irá ficar paralisado por 1 Turno. Custo de Invocação: 6.000. Custo por turno: 40%",
            custo_mana: "6.000 MP",
            cooldown: 0,
            custo_por_turno: "40%",
            nivel_desbloqueio: 70
        },
        {
            nome: "Shikigami: Yuki-Onna",
            classe: "Onmyouji",
            categoria: "Avançada",
            tipo: "Invocação",
            descricao: "O usuário invoca o espírito daquela que é conhecida como a donzela das neves. Yuki-onna diferente dos demais shikigamis, possui uma aparência que se assemelha a aparência humana, longos cabelos brancos igual neve, sua pele também possui essa coloração. Seu longo vestido branco que cobre seu corpo junto das flores de gelo que se encontram em sua roupa dão um ar de algo majestoso para a shikigami. Seus olhos azuis esbranquiçados como gelo junto de sua expressão sem sentimentos fazem com que o espírito da donzela das Neves possua uma aparência deslumbrante. Diferente dos demais shikigamis no qual por Mais que possuam consciência, não podem falar, a Yuki-Onna além de conseguir pensar por si mesma, Também é capaz de falar e interagir com àqueles em sua volta, por mais que sua voz seja como um Gelo sem Qualquer sentimentos, seu tom fica um pouco mais caloroso enquanto está falando com seu invocador. A habilidade de Yuki-Onna se chama 'rainha de gelo' no qual tudo em volta da mesma que não seja humanos/Monstros e totalmente congelado em uma área de 15m², e enquanto a Yuki-Onna estiver nesse 'domínio' de Gelo, ela pode usar das habilidades de criação de gelo a vontade, podendo fazer Deste estacas de Gelo até mesmo poderosas Nevasca. e caso os Ataques da Yuki-Onna acertem o Inimigo, caso a resistência do Oponente for menor que [80%] da pm da shikigami, ele é congelado por 2 turnos. Todos os status da Yuki-Onna tirando pm e Resistência são iguais a [75%] do pm do usuário, a resistência é igual a [50%] do pm do usuário enquanto a pm da Yuki-Onna é igual a [100%] da pm do usuário. Custo de Invocação: 8.000. Custo por turno: 40%",
            custo_mana: "8.000 MP",
            cooldown: 0,
            custo_por_turno: "40%",
            nivel_desbloqueio: 80
        }
    ],

    // =====================================
    // BRUXO
    // =====================================
    "Bruxo": [
        {
            nome: "Invocação Demoníaca: Anjo Caído",
            classe: "Bruxo",
            categoria: "Avançada",
            tipo: "Invocação",
            descricao: "Diz-se que quem observa os olhos de um anjo caído, que brilham de um carmesim profundo, é completamente dominado pelo seu controle mental. O seu movimento especial Death Claw consiste em utilizar os braços extensíveis para forçar a sua vontade sob o corpo do adversário. Demônios do tipo anjo caído, contém de forte sensação das trevas e possuem sensibilidade fora do comum a inimigos escondidos nas sombras. Atributos: Poder Mágico: 55 + 80% PM do invocador, Inteligência: 35 + 80% PM do invocador, Agilidade: 40 + 80% PM do invocador.",
            custo_mana: "7.000 MP",
            cooldown: 0,
            nivel_desbloqueio: 40
        },
        {
            nome: "Braço do Demônio",
            classe: "Bruxo",
            categoria: "Avançada",
            tipo: "Mágica",
            descricao: "O bruxo desenha rapidamente um círculo mágico no chão, inscrevendo símbolos profanos e invocativos com gestos precisos de suas mãos. Uma vez que a energia é canalizada com sucesso, uma fenda sombria se abre dentro do círculo mágico. De dentro desta fenda emerge o Braço Infernal, um apêndice grotesco e sinistro revestido em chamas infernais e adornado com inscrições demoníacas. [O braço possui em Ataque e Resistência todo seu PM]",
            custo_mana: "8.000 MP",
            cooldown: 0,
            nivel_desbloqueio: 50
        },
        {
            nome: "Invocação Demoníaca: Terra Impura",
            classe: "Bruxo",
            categoria: "Avançada",
            tipo: "Invocação",
            descricao: "Uma habilidade campal expansiva do bruxo. Uma vez que inimigos morrem dentro do campo desta técnica eles podem ser usados como sacrificio para trazer demônios de alto rank. Quanto maior o numero de inimigos, ou maior o rank do inimigo ali morto. Usando mobs, humanos ou caçadores como sacrificio pode tornar o demonio invocado mais poderoso. Dependendo da classe ou tipo do sacrificio, o demônio invocado terá caracteristicas semelhantes. Você poderá dar o nome ao demônio invocado. Demônio de Rank C ao S. Terão sempre força única equivalente ao numero de ranks do sacrificio. Para invocar um demonio de rank C: Seria necessário 100mobs e um boss de rank B. Para invocar um demonio de rank B: Seria necessário 5 boss de rank B. Para invocar um demonio de rank A: Será necessário 2 boss de rank S. Para invocar um demonio de Rank S. Apenas após se tornar um monarca, e sacrificando um boss demonio rank S.",
            custo_mana: "7.000 MP (+2.000 MP por Rank acima)",
            cooldown: 0,
            nivel_desbloqueio: 60
        },
        {
            nome: "Mastema: Pólo da Agonia",
            classe: "Bruxo",
            categoria: "Avançada",
            tipo: "Mágica",
            descricao: "Invoca um pilar de escuridão semelhante a uma fumaça que causa dano constante aos inimigos que entram em contato com ele. O pilar de escuridão causa um efeito amaldiçoado e corrosivo, qualquer buff de recuperação de mana ou cura não funciona e aqueles dentro da escuridão são alvos prioritários, ou seja qualquer técnica que adentrar as trevas é direcionada diretamente ao inimigo. Possuí um alcance de 20m².",
            custo_mana: "8.000 MP",
            cooldown: 0,
            nivel_desbloqueio: 70
        },
        {
            nome: "Ascensão à Lorde Demônio",
            classe: "Bruxo",
            categoria: "Avançada",
            tipo: "Suporte",
            descricao: "É uma das habilidades mais poderosas das classes assim como a qual possui maior eficácia no quesito poder verdadeiro. Essa em si é uma habilidade que precisa ser evoluida com o passar dos níveis e das mortes causadas pelo bruxo para então evoluir para 'Lorde Demônio'. O sistema dado a um bruxo é guiado diferente de outras classes, para ascender a um lorde demônio é necessário ter requisitos uma vez que completos você ganha uma Classe avançada secreta. Requisitos: Ter matados pelo menos 100.000 almas em uma única dungeon. [Chave RankA/B], Conseguir a 'Semente do Lorde Demônio', pegando ela em uma dungeon rank B qual o boss final é um Demônio, Ter a Habilidade 'Rei Demônio!', Ser acima do nível 70. 6. Lorde Demônio. Descrição: Classe Avançada secreta de Bruxos que alcançam um domínio supremo sobre as artes das trevas e a invocação de demônios podem ascender à classe avançada secreta de Lorde Demônio. Como mestres do submundo e senhores das sombras, os Lordes Demônios comandam um poder infernal capaz de moldar a própria realidade e instilar o medo nos corações dos seus inimigos. Ganhando uma skill rank S dada pela administração, logo após o seu surgimento. [Você não poderá escolher, será dada pela Administração.] Atributos: Força: 60, Agilidade: 100, Resistência: 300, Inteligência: 150, Sentidos: 130, Poder Mágico: 200. Lorde Demônios não podem se tornar Monarcas.",
            custo_mana: "Nulo",
            cooldown: 0,
            nivel_desbloqueio: 80
        }
    ],

    // =====================================
    // MAGO DE IGNIÇÃO
    // =====================================
    "Mago de Ignição": [
        {
            nome: "Genoma Vazio",
            classe: "Mago de Ignição",
            categoria: "Avançada",
            tipo: "Suporte",
            descricao: "O Mago de Ignição possui a habilidade de extrair o 'Vazio' de uma pessoa, que é a manifestação física do coração e das ideias dessa pessoa, representando suas características mais profundas e pessoais. Cada Vazio é único, adaptando-se à personalidade, desejos e habilidades da pessoa de quem foi retirado, podendo se manifestar de diversas formas, como uma adaga demoníaca para um assassino sanguinário ou um cajado angelical para uma maga gentil. Essa habilidade é extremamente versátil, pois o Vazio carrega alguns atributos e o poder da pessoa de origem, tornando-o útil em praticamente qualquer situação. Contudo, o Vazio não pode ser extraído sem permissão, exceto se a pessoa estiver inconsciente. Ao equipar o 'Vazio' dessa pessoa, o usuário acaba por 'Ganhar' os atributos da pessoa. Atributos ganhos: Resistência, agilidade, poder mágico e força. Custo de mana: 5.000 MP. Duração: 5 Turnos. Recarga: 4 Turnos. Nerf: Uma vez que o Genoma do vazio for retirado de um aliado, o próprio recebe uma redução de 80% dos atributos Ataque, resistência, poder mágico e agilidade. A cada nível upado dessa técnica a redução cai em 6%.",
            custo_mana: "5.000 MP",
            cooldown: 0,
            nivel_desbloqueio: 40
        },
        {
            nome: "Manifestação da Ignição",
            classe: "Mago de Ignição",
            categoria: "Avançada",
            tipo: "Suporte",
            descricao: "A Manifestação da Ignição é uma habilidade que permite ao Mago de Ignição moldar sua magia em diversas máquinas e formas tecnológicas ao redor de seu corpo. Ele pode criar armas, defesas e meios de transporte temporários com essa habilidade, adaptando-se rapidamente às necessidades do momento. As armas e equipamentos gerados, como manoplas de ferro gigantes ou espadas de metal, são poderosos, mas podem ser destruídos durante o combate. No entanto, o Mago de Ignição é capaz de reformá-los rapidamente, tornando-o altamente resiliente e imprevisível. Sua habilidade de transformar magia em objetos físicos lhe dá uma grande flexibilidade estratégica, permitindo que ele seja tanto ofensivo quanto defensivo de forma eficiente. Os atributos das armas criadas pelo usuário são iguais a [70% da PM Base] do usuário, porém as armas não Possuem nenhum efeito é só tem [1 Status] na qual depende do formato dela (Ex: Armadura: Res. Espada: For. Botas: Agi. E por ai vai). [Só funciona em status físicos. Nada de PM ou inteligente]",
            custo_mana: "6.000 MP (por Item criado)",
            cooldown: 0,
            custo_por_turno: "30%",
            nivel_desbloqueio: 50
        },
        {
            nome: "Afinidade Evolutiva [Passivo]",
            classe: "Mago de Ignição",
            categoria: "Avançada",
            tipo: "Passiva",
            descricao: "O Mago de Ignição possui a habilidade de invocar diversas tecnologias de disparo para usar no campo de batalha, como canhões e armas de fogo mágicas, projetadas para penetrar defesas inimigas e causar destruição em massa. Essa afinidade lhe permite criar formas tecnológicas para se adaptar rapidamente às necessidades do combate. Ativo: Torre Evolutiva: O Mago de Ignição pode invocar até três torres evolutivas, que se posicionam no campo de batalha e disparam projéteis mágicos contra inimigos próximos [5M]. Cada torre pode disparar até três projéteis por turno, com o dano calculado com base no Poder Mágico (PM) do mago. Essas torres têm alta precisão e são eficazes contra alvos móveis, permitindo ao mago estabelecer um campo de defesa ofensivo e controlar a dinâmica da luta. A cada turno, as torretas vão evoluindo ainda mais, ganhando [+1M] por turno. Custo de mana: 4.000 MP (por Torreta). Custo por turno: 30%",
            custo_mana: "4.000 MP (por Torreta)",
            cooldown: 0,
            custo_por_turno: "30%",
            nivel_desbloqueio: 60
        },
        {
            nome: "Disrupção de Magia",
            classe: "Mago de Ignição",
            categoria: "Avançada",
            tipo: "Mágica",
            descricao: "O Mago de Ignição possui a habilidade de hackear qualquer tecnologia ao seu redor, independentemente de quem a controla. Ele pode visualizar câmeras de segurança, gerar imagens para esconder ações ou até desativar qualquer fonte de energia, tornando-se uma ameaça para qualquer infraestrutura digital. Além disso, sempre que uma técnica de eletricidade o atingir, ela será anulada, e o mago ganhará mana adicional proporcional à mana da técnica inimiga[50% da mana gastada no feitiço]. Esta passiva permite que ele controle qualquer tecnologia à distância de até 30 metros, incluindo sistemas de segurança e dispositivos tecnológicos ao seu redor. O Mago de Ignição também pode armazenar em seu sistema de jogador as tecnologias que ele mesmo criar, aprimorando suas próprias invenções. Ativo: Quando o Mago de Ignição conhece uma técnica de seu oponente, incluindo seu nome e efeitos completos, ele pode desativá-la antes que seja ativada. O mago libera uma rajada de energia para interromper a conjuração da magia, neutralizando a técnica e evitando o dano. Custo de mana: 5.000 MP (por anulação)",
            custo_mana: "5.000 MP (por anulação)",
            cooldown: 0,
            nivel_desbloqueio: 70
        },
        {
            nome: "Ultrapassando os Céus",
            classe: "Mago de Ignição",
            categoria: "Avançada",
            tipo: "Invocação",
            descricao: "Ultrapassando os Céus é o ápice do poder de um Mago de Ignição, permitindo-lhe invocar robôs mecha altamente avançados, capazes de atuar de forma autônoma ou como armaduras para o próprio mago. A cada rank conquistado, o Mago de Ignição ultrapassa os limites da tecnologia, ganhando mechas mais poderosos e versáteis, que oferecem novas formas de combate e resistência. Eles podem ser usados como armaduras ou agirem de forma independente, oferecendo suporte durante as batalhas com poder ofensivo moderado. Mecha Rank-C: O mago pode invocar até três mechas de 1,80m. Esses mechas são equipados com a capacidade de disparar mana condensada da sua mão e possuem os status iguais a [PM] do usuário. Custo de mana: 5.000 MP. Custo por turno: 30%. Mecha Rank-B: O mago pode invocar dois mechas de 5m de altura. Esses mechas são mais poderosos que os anteriores, com grande poder ofensivo. Além disso, o mago pode equipar um tipo de arma (arma de fogo ou branca) de sua escolha, como espadas, machados ou outros itens. A Agilidade, Sentidos e poder mágico do robô são iguais a [PM] do usuário, enquanto sua Força e Resistência são iguais a [PM+30%]. Custo de mana: 8.000 MP. Custo por turno: 30%. Mecha Rank-A: O mago agora pode invocar um único mecha de até 20m, um mecha colossal com poder ofensivo imenso. Como os anteriores, ele pode equipar uma arma personalizada (fogo ou branca), Além deles poderem ter uma Habilidade (Consultar adm para falar sobre a habilidade do mecha). A Agilidade, Sentidos e poder mágico do robô são iguais a [PM+15%] do usuário, enquanto sua Força e Resistência são iguais a [PM+50%]. Custo de mana: 12.000 MP. Custo por turno: 30%. Mecha Rank-S: O mago alcança o auge com a capacidade de invocar um mecha de até 70m. Este mecha gigantesco pode ser usado para enfrentar batalhas extremamente difíceis e parece invencível, embora seu custo de mana por turno seja altíssimo. Assim como os outros ranks, o mecha pode ser equipado com uma arma de fogo ou branca, Além de ter uma habilidade especial (Consultar adm). A Agilidade, Sentidos é poder mágico do robô são iguais a [PM+40%] do usuário, enquanto sua Força é igual a [PM+70%]. Resistência é igual a [PM+100%]. Custo de mana: 20.000 MP. Custo por turno: 30%. Regras: Porém, só é possível invocar um tipo de Tier por vez, e o mago deve escolher entre as versões de rank C, B, A ou S. Se invocar um mecha de rank C, não poderá invocar mechas de ranks superiores, e isso se aplica a todas as outras versões de rank também. Só pode invocar mechas do mesmo rank que o usuário.",
            custo_mana: "5.000 MP (Mecha Rank-C)",
            cooldown: 0,
            custo_por_turno: "30%",
            nivel_desbloqueio: 80
        }
    ],

    // =====================================
    // NECROMANTE
    // =====================================
    "Necromante": [
        {
            nome: "[Você escolhe o nome!]",
            classe: "Necromante",
            categoria: "Avançada",
            tipo: "Invocação",
            descricao: "A habilidade principal de um necromante, onde ele consegue trazer tropas de mobs de volta a vida sempre que desejar. Uma vez que foi trazido de volta a vida o mob não possui consciência nem inteligência, apenas segue ordens pré meditadas pelo necromante. Soldados podem ser reconstruídos gastando a mana equivalente para o renascimento. [Renascimento: 2% da mana por soldado]",
            custo_mana: "500 MP por mob",
            cooldown: 0,
            nivel_desbloqueio: 40
        },
        {
            nome: "Campo do Sussurro",
            classe: "Necromante",
            categoria: "Avançada",
            tipo: "Suporte",
            descricao: "Um feitiço de campo que aumenta todos os atributos de suas invocações em 15%. Inimigos dentro desse campo são afetados pelo renascimento caso morram dentro dos limites. Se o inimigo for muito maior que o rank do usuário o renascimento não funciona. A área do campo é de 30 metros de diâmetro.",
            custo_mana: "5.000 MP",
            cooldown: 0,
            nivel_desbloqueio: 50
        },
        {
            nome: "Abraço da Morte",
            classe: "Necromante",
            categoria: "Avançada",
            tipo: "Passiva",
            descricao: "Uma habilidade passiva de todo necromante, uma vez que ele chega próximo suficiente de um inimigo ele consegue sugar suas memórias ao inspirar pela sua boca a mana do adversário [Consegue absorver 1000MP por turno]. Em humanos e caçadores a técnica surtiria efeito em dobro, sugando suas memórias felizes e aprendizados do passado. [Técnica capaz de sugar a felicidade das pessoas, torna o necromante capaz de localizar memórias e aprender sobre seus inimigos, desde técnicas a ponto fracos. Aprender sobre as técnicas não quer dizer que você vai conseguir repetir-las] [Maestria em Foice 15/15]",
            custo_mana: "Nulo",
            cooldown: 0,
            nivel_desbloqueio: 60
        },
        {
            nome: "Sentença das Almas",
            classe: "Necromante",
            categoria: "Avançada",
            tipo: "Invocação",
            descricao: "Passiva: O necromante pode colher a alma de inimigos que morrerem perto dele, recebendo Armadura e Poder de Habilidade até o fim do combate [+2 de atributo em Resistência e Poder Mágico por alma]. Ativa: A cada 5 almas tomadas pelo próprio necromante, uma cova é montada no chão caso ele utilize a técnica nomeada de renascimento, onde todos os soldados irão voltar como fantasmas intangíveis que causam dano explosivo ao toque.",
            custo_mana: "5.000 MP (Ativa)",
            cooldown: 0,
            nivel_desbloqueio: 70
        },
        {
            nome: "Louvor das Ilhas",
            classe: "Necromante",
            categoria: "Avançada",
            tipo: "Invocação",
            descricao: "O necromante tem a possibilidade de recolher a alma de um Boss e Semi-boss para reviver-lo com a técnica nomeada(1). Tendo uma de três chances para trazer-lo de volta a vida, pedindo para um ADM sortear. O Boss diferente de outros possui uma semi consciência a serviço do necromante. O Boss e Semi-boss sempre começa dois rank's abaixo desde seu original. Ganha uma classificação de acordo com o rank qual pertence: Rank E — Soldado, Rank D — Soldado de Elite, Rank C — Cavaleiro, Rank B — Cavaleiro de Elite, Rank A — General, Rank S — Marechal, Rank SS — Grande Marechal. O Boss revivido ganha 10% de sua XP provindo de qualquer lugar.",
            custo_mana: "Nulo",
            cooldown: 0,
            nivel_desbloqueio: 80
        }
    ],

    // =====================================
    // TAUMATURGO
    // =====================================
    "Taumaturgo": [
        {
            nome: "Aceleração",
            classe: "Taumaturgo",
            categoria: "Avançada",
            tipo: "Passiva",
            descricao: "Uma habilidade passiva de Taumaturgo no qual aumenta a velocidade do usuário em 5% por turno enquanto estiver em combate. Quanto maior o tempo no qual a Batalha durar, maior será o Buff em seus atributos, já que essa passiva possui efeito Ilimitado, mas caso o usuário sofra de redução de velocidade, o efeito será negado, surtindo o buff contrário do que a redução causaria. Enquanto estiver em movimento durante o combate, o usuário acumula mana em suas armas, e caso o usuário acerte um dano crítico no Oponente, o Oponente sofrerá uma redução de [40%] em seus Sentidos até o final da Batalha.",
            custo_mana: "Nulo",
            cooldown: 0,
            nivel_desbloqueio: 40
        },
        {
            nome: "Diminuição e Aumento",
            classe: "Taumaturgo",
            categoria: "Avançada",
            tipo: "Mágica",
            descricao: "— Diminuição: Ao tocar em um inimigo, o usuário consegue aplicar uma redução de tamanho, assim tornando qualquer oponente em uma miniatura por 3 Turnos. O efeito pode variar de metros a centímetros mas isso era depender do nível do Taumaturgo[0,5m a cada 10 níveis. A cada 0,5m de diminuição, o oponente sofre um debuff de [-5%] em força e Resistência. Custo de Mana: 4.000 MP. — Aumento: Ao tocar em um aliado, o usuário consegue aplicar um aumento de tamanho, assim tornando qualquer aliado em um gigante por 3 Turnos. O efeito pode variar de metros a centímetros mas isso era depender do nível do Taumaturgo[0,5m a cada 10 níveis. A cada 0,5m de aumento, o oponente sofre um buff de [+5%] em força e Resistência. Custo de Mana: 4.000 MP",
            custo_mana: "4.000 MP",
            cooldown: 0,
            nivel_desbloqueio: 50
        },
        {
            nome: "Maldição Reversa",
            classe: "Taumaturgo",
            categoria: "Avançada",
            tipo: "Mágica",
            descricao: "Uma habilidade de contra-buff, no qual quando um buff de aumento de atributos for ativado em uma área de 10m em volta do usuário, o mesmo consegue ativar essa habilidade de forma Instantânea, no qual faz com que o Buff ativado se torne ume debuff proporcional ao Buff (Ex: +20% em força vira -20% em força). Esse debuff dura a quantidade de turnos originais no qual o Buff funcionaria.",
            custo_mana: "5.000 MP",
            cooldown: 0,
            nivel_desbloqueio: 60
        },
        {
            nome: "Queima de Mana",
            classe: "Taumaturgo",
            categoria: "Avançada",
            tipo: "Física",
            descricao: "Ao gastar uma grande quantidade de mana, o usuário consegue ampliar o tamanho de seu Corpo parcialmente ou totalmente, podendo chegar a centenas de metros. O usuário pode alterar o tamanho do seu Corpo livremente ao usar das capacidades desta técnica, e essas alterações duran por um longo período de tempo [9 Turnos]. Alterando o tamanho para ficar maior, o usuário ganha uma grande força de forma sobrenatural em seus ataques, ganhando 100 de força a cada 8.000 de mana gasto[0,5m de tamanho a cada 10 níveis].",
            custo_mana: "8.000 MP a cada +100 em força",
            cooldown: 0,
            nivel_desbloqueio: 70
        },
        {
            nome: "Controle Absoluto",
            classe: "Taumaturgo",
            categoria: "Avançada",
            tipo: "Suporte",
            descricao: "— passivo: Essa técnica é uma capacidade única no qual apenas os Taumaturgos possuem. Diferente das demais classes, os Taumaturgos possuem a capacidade de Redistribuir os atributos do sistema do jogador enquanto não estiver em batalha, assim podendo alterar seus status entre Oponentes e se adequar antes do combate para ser mais forte, resistente e etc, tudo depende da estratégia do usuário. Custo de Mana: Nulo. — Ativa: Ao tocar o Oponente, o usuário consegue igualar os Atributos de ambos consumindo uma boa quantidade de mana[dura 3 Turnos]. Caso um aliado queira, o usuário consegue alterar os atributos base de forma permanente do mesmo, podendo fazer uma redistribuição de pontos no Aliado em troco de 5 níveis do Taumaturgo. Custo de Mana: 8.000 MP. Custo de Redistribuição: -5 Níveis",
            custo_mana: "8.000 MP",
            cooldown: 0,
            nivel_desbloqueio: 80
        }
    ],

    // =====================================
    // BOKOR
    // =====================================
    "Bokor": [
        {
            nome: "Bwa Kayiman",
            classe: "Bokor",
            categoria: "Avançada",
            tipo: "Suporte",
            descricao: "O usuário cria um Círculo Mágico de 10m no qual fica em volta dele e de seus aliados. O círculo permanece por 3 turnos. O círculo aumenta a resistência dos aliados que estão dentro do círculo em [30%], além de remover todos os debuffs que estão sobre os aliados. A cada debuff removido pelo círculo, o usuário ganha [+10%] em Pm de forma acumulativa Durante 3 Turnos.",
            custo_mana: "4.000 MP",
            cooldown: 0,
            nivel_desbloqueio: 40
        },
        {
            nome: "Efigie",
            classe: "Bokor",
            categoria: "Avançada",
            tipo: "Mágica",
            descricao: "Uma técnica exclusiva de Bokor. Essa técnica permite ao usuário aplicar o debuff [Decair] dependendo da técnica o efeito muda. Ao usar essa habilidade, o boker absorve 5% da mana do inimigo a cada segundo que o mesmo estiver tocando, e caso o usuário absorva a mana do oponente por 3 segundos, a habilidade causa o debuff [Decair]. Inimigos que possuem esse debuff acabam por ter [10%] de sua mana sugada por segundo enquanto o usuário estiver usando efigie no oponente.",
            custo_mana: "3.000 MP",
            cooldown: 0,
            nivel_desbloqueio: 50
        },
        {
            nome: "Homem-Palha",
            classe: "Bokor",
            categoria: "Avançada",
            tipo: "Invocação",
            descricao: "Essa técnica permite ao usuário gerar uma grande quantidade de palha feita de mana, o bokor cria um grande monstro de palha no qual possui em todos os seus atributos iguais a mesma quantidade de seu PM. A criatura de palha invocada causa [Decair] em todos seus ataques quando acertados. Caso um inimigo já esteja afetado por [decair], e o homem de palha o acertar, ele fica paralisado por 1 turno. Enquanto essa técnica estiver ativa, o bokor não pode utilizar outras técnicas da classe avançada a não ser que o inimigo esteja sobre o debuff [decair].",
            custo_mana: "4.000 MP",
            cooldown: 0,
            nivel_desbloqueio: 60
        },
        {
            nome: "Espantalho",
            classe: "Bokor",
            categoria: "Avançada",
            tipo: "Suporte",
            descricao: "Técnica exclusiva da classe bokor. O usuário consegue redirecionar toda mana absorvida de um indivíduo para dentro de um boneco de palha. Após absorver pelo menos [30%] da mana de um inimigo, ele consegue armazenar dentro do boneco de palha. Esses bonecos estão aparentemente conectados à pessoa que representam e ao próprio bokor, permitindo que ele os use para se proteger de ferimentos e ataques inimigos.Golpes quando acertados no bokor, são redirecionados para a pessoa cujo o boneco representa apenas uma única vez. Ignora totalmente a resistência do oponente.",
            custo_mana: "3.500 MP",
            cooldown: 0,
            nivel_desbloqueio: 70
        },
        {
            nome: "Zombificação",
            classe: "Bokor",
            categoria: "Avançada",
            tipo: "Invocação",
            descricao: "Ao absorver 100% da mana de um inimigo, assim matando-o. O usuário consegue ativar esta técnica, fazendo com o Inimigo fique em um estado zumbificado, tornando-o um morto-vivo no qual não possui consciência e apenas é controlado pelo usuário. A zumbificação é causada apenas quando a mana do inimigo é zerada ao ponto dele ficar a beira da morte, caso ele gaste sua mana antes dele absorver [100%] a técnica não funcionará. O controle sobre os zumbis são [100%] efetivos, e possui consciência quase que compartilhada, podendo apenas ver pelos olhos porém não consegue controla-los, podendo apenas dar ordens simples. Como atacar ou defender.",
            custo_mana: "6.000 MP",
            cooldown: 0,
            nivel_desbloqueio: 80
        }
    ],

    // =====================================
    // MAGO DE ESCURIDÃO
    // =====================================
    "Mago de Escuridão": [
        {
            nome: "Receptor da Escuridão",
            classe: "Mago de Escuridão",
            categoria: "Avançada",
            tipo: "Mágica",
            descricao: "O Receptor da Escuridão é uma habilidade fundamental do Mago de Escuridão, que lhe permite embuir sua arma, orbe ou grimório com as forças sombrias da escuridão. Ao ativar essa habilidade, o mago pode liberar uma rajada de energia de escuridão simplesmente ao balançar sua arma ou realizar um movimento com seu grimório ou orbe. A rajada de energia escura gerada é extremamente poderosa, sendo capaz de atravessar qualquer tipo de magia, seja ela defensiva ou ofensiva, com facilidade.",
            custo_mana: "5.000 MP",
            cooldown: 0,
            custo_por_turno: "2.000 MP",
            nivel_desbloqueio: 40
        },
        {
            nome: "Casulo Negro",
            classe: "Mago de Escuridão",
            categoria: "Avançada",
            tipo: "Defesa",
            descricao: "Casulo Negro é uma técnica defensiva poderosa do Mago de Escuridão, que permite ao usuário criar uma esfera oca de escuridão ao seu redor, envolvendo-se, assim, em uma camada de proteção impenetrável. Esta esfera de escuridão não só defende o mago, mas também pode proteger aliados próximos, criando um campo de segurança contra ataques inimigos. Qualquer feitiço que entrar em contato com o Casulo Negro será completamente anulado, seja ele ofensivo ou defensivo, tornando o casulo uma barreira quase intransponível. Além disso, o usuário tem a capacidade de controlar o formato do casulo, adaptando-o conforme a situação. O mago pode liberar espinhos de escuridão para aumentar a defesa ou contra-atacar inimigos próximos, utilizando o casulo como uma arma tanto defensiva quanto ofensiva.",
            custo_mana: "7.000 MP",
            cooldown: 0,
            custo_por_turno: "4.000 MP",
            nivel_desbloqueio: 50
        },
        {
            nome: "Orbe da Verdade",
            classe: "Mago de Escuridão",
            categoria: "Avançada",
            tipo: "Mágica",
            descricao: "O Orbe da Verdade é uma pequena esfera negra criada pela magia de escuridão, que serve como uma ferramenta multifuncional para o Mago de Escuridão. Este orbe permite ao usuário canalizar qualquer outro elemento que ele possua, utilizando-o de maneira mais eficiente e poderosa através da esfera. O Orbe da Verdade pode expandir ou alterar sua forma conforme o desejo do usuário, oferecendo uma grande flexibilidade nas batalhas. Quando ativado, o orbe amplia o alcance de técnicas elementais do mago em até 10 metros, tornando-o uma ferramenta valiosa para expandir a área de efeito das magias. Além disso, magias de escuridão também recebem esse aumento de alcance, potencializando as capacidades do mago. O usuário tem a habilidade de invocar até 9 orbes ao mesmo tempo, cada um com o mesmo custo de gasto de mana original, permitindo uma maior versatilidade e quantidade de ataques. Quanto mais orbes invocados, mais poderoso se torna o mago, podendo lançar várias magias em diversas direções simultaneamente além de ampliar o alcance por cada orbe.",
            custo_mana: "5.000 MP (Por Orb)",
            cooldown: 0,
            custo_por_turno: "2.500 MP (por Orb)",
            nivel_desbloqueio: 60
        },
        {
            nome: "Atração e Repulsão",
            classe: "Mago de Escuridão",
            categoria: "Avançada",
            tipo: "Mágica",
            descricao: "— Atração: Esta técnica permite ao Mago de Escuridão se tornar o epicentro de uma poderosa força magnética de atração. Ao usar uma das mãos, o mago pode atrair alvos ou objetos em sua direção, puxando-os para perto de si ou movendo-os em suas proximidades. Quando ambas as mãos são utilizadas, a técnica se torna ainda mais versátil, permitindo que o mago atraia múltiplos alvos simultaneamente, podendo até mesmo redirecioná-los para colidir uns com os outros. Essa habilidade é excelente para distração ou para guiar inimigos diretamente para uma emboscada ou ataque específico. Com um alcance de até 10 metros. — Repulsão: A técnica de repulsão oferece ao mago a capacidade de liberar forças mágicas repulsivas a partir de seu corpo, através de duas formas principais. Quando utilizando uma das mãos, o mago dispara uma onda de repulsão mágica concentrada, capaz de ser disparada em linha reta até seu alvo, empurrando-o de volta com grande força. Quando utilizando ambas as mãos, a técnica libera uma explosão de magia repulsiva em todas as direções, com o usuário como epicentro, forçando qualquer inimigo ou objeto em um raio de até 10 metros a ser empurrado para longe. Essa habilidade é útil para afastar múltiplos inimigos, criando espaço ou desestabilizando a formação de ataques inimigos, além de poder ser usada para desviar ataques ou fugir de uma situação perigosa. Para conseguir usar o efeito de Repulsão no inimigo, a [PM] do usuário precisa ser maior que a [PM/FOR] do inimigo. Custo de mana: 6.000 MP {M.A} | 5.000 MP {M.R}. Custo por Turnos: 3.000 MP. Duração: 3 Turnos. Recarga: 4 Turnos",
            custo_mana: "6.000 MP {M.A} | 5.000 MP {M.R}",
            cooldown: 0,
            custo_por_turno: "3.000 MP",
            nivel_desbloqueio: 70
        },
        {
            nome: "Buraco negro",
            classe: "Mago de Escuridão",
            categoria: "Avançada",
            tipo: "Mágica",
            descricao: "O Buraco Negro é uma poderosa técnica de absorção desenvolvida pelo Mago de Escuridão, permitindo-lhe criar um buraco negro de tamanho médio no campo de batalha. Este buraco negro é capaz de atrair e absorver feitiços, neutralizando as magias inimigas ao engoli-las. Caso a magia absorvida tenha um usuário em contato direto com ela, o mago responsável pela magia ficará paralisado brevemente enquanto sua magia é sugada para dentro do buraco negro. Esse efeito de paralisia pode desestabilizar o inimigo, dando ao mago de escuridão a chance de realizar um contra-ataque ou ganhar tempo. O efeito de absorção do Buraco Negro possui um limite de alcance de cerca de 5 metros, o que significa que só pode atrair magias e objetos dentro dessa distância. No entanto, o buraco negro pode expandir seu tamanho ao duplicar a mana utilizável para aumentar seu poder de absorção. Essa expansão também permite que o mago controle o que o buraco negro absorve, podendo direcioná-lo para capturar feitiços, objetos ou até mesmo inimigos.",
            custo_mana: "10.000 MP",
            cooldown: 0,
            custo_por_turno: "50%",
            nivel_desbloqueio: 80
        }
    ]
};

module.exports = advancedTechniques;