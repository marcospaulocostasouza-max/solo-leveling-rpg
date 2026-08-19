const estilos = [
    {
        "nome": "Proficiência em Espadas",
        "arma": "Espadas ou semelhantes",
        "descricao": "O usuário se tornou um exímio especialista no uso de espadas e armas semelhantes. Seu domínio permite realizar movimentos precisos, controlar a distância dos golpes e utilizar a arma em qualquer situação de combate sem dificuldades.",
        "tecnica": "Coroa de Avalon",
        "custo_mana": 600,
        "requisitos": [
            "Realizar 20 treinos completos focados no manejo de Espadas.",
            "Participar de um duelo utilizando Espadas.",
            "Eliminar um Boss utilizando Espada em uma Dungeon Narrada.",
            "Utilizar Espadas ou semelhantes por no mínimo 15 níveis."
        ]
    },
    {
        "nome": "Proficiência em Kanabo",
        "arma": "Kanabo ou armas semelhantes",
        "descricao": "O usuário domina armas pesadas e brutais, transformando força física e controle de mana em ataques devastadores.",
        "tecnica": "Trovão de Raijin",
        "custo_mana": 600,
        "requisitos": [
            "Realizar 20 treinos completos focados no manejo de Kanabo.",
            "Participar de um duelo utilizando Kanabo.",
            "Eliminar um Boss utilizando Kanabo em uma Dungeon Narrada.",
            "Utilizar Kanabo ou semelhantes por no mínimo 15 níveis."
        ]
    },
    {
        "nome": "Proficiência em Katanas",
        "arma": "Katana ou semelhantes",
        "descricao": "O usuário domina as lâminas orientais, aprendendo movimentos rápidos, cortes precisos e técnicas baseadas em velocidade e controle.",
        "tecnica": "Iai do Vento Vazio",
        "custo_mana": 600,
        "requisitos": [
            "Realizar 20 treinos completos focados no manejo de Katana.",
            "Participar de um duelo utilizando Katana.",
            "Eliminar um Boss utilizando Katana em uma Dungeon Narrada.",
            "Utilizar Katana ou semelhantes por no mínimo 15 níveis."
        ]
    },
    {
        "nome": "Proficiência em Adagas",
        "arma": "Adagas ou semelhantes",
        "descricao": "O usuário domina pequenas lâminas utilizadas por assassinos e combatentes furtivos.",
        "tecnica": "Véu da Matança",
        "custo_mana": 600,
        "requisitos": [
            "Realizar 20 treinos completos focados no manejo de Adagas.",
            "Participar de um duelo utilizando Adagas.",
            "Eliminar um Boss utilizando Adaga em uma Dungeon Narrada.",
            "Utilizar Adagas ou semelhantes por no mínimo 15 níveis."
        ]
    },
    {
        "nome": "Proficiência em Lanças",
        "arma": "Lanças ou semelhantes",
        "descricao": "O usuário domina uma das armas mais versáteis já criadas.",
        "tecnica": "Investida de Randgriz",
        "custo_mana": 600,
        "requisitos": [
            "Realizar 20 treinos completos focados no manejo de Lanças.",
            "Participar de um duelo utilizando Lança.",
            "Eliminar um Boss utilizando Lança em uma Dungeon Narrada.",
            "Utilizar Lanças ou semelhantes por no mínimo 15 níveis."
        ]
    },
    {
        "nome": "Proficiência em Cajados e Orbes",
        "arma": "Cajados, Orbes ou Grimórios",
        "descricao": "O usuário alcança domínio máximo sobre seus instrumentos mágicos.",
        "tecnica": "Torrente Arcana",
        "custo_mana": 600,
        "requisitos": [
            "Realizar 20 treinos completos utilizando Cajados ou Orbes.",
            "Participar de um duelo utilizando arma mágica.",
            "Eliminar um Boss utilizando Cajado ou Orbe em uma Dungeon Narrada.",
            "Utilizar Cajado ou Orbe por no mínimo 15 níveis."
        ]
    },
    {
        "nome": "Proficiência em Arcos",
        "arma": "Arcos ou semelhantes",
        "descricao": "O usuário domina armas de longo alcance, aumentando sua precisão e percepção.",
        "tecnica": "Olhos de Águia",
        "custo_mana": 600,
        "requisitos": [
            "Realizar 20 treinos completos focados em Arcos.",
            "Participar de um duelo utilizando Arco.",
            "Eliminar um Boss utilizando Arco em uma Dungeon Narrada.",
            "Utilizar Arcos ou semelhantes por no mínimo 15 níveis."
        ]
    },
    {
        "nome": "Proficiência em Combate Desarmado",
        "arma": "Punhos e artes marciais",
        "descricao": "O usuário transforma o próprio corpo em sua principal arma.",
        "tecnica": "Ataque Perfeito",
        "custo_mana": 600,
        "requisitos": [
            "Realizar 20 treinos utilizando apenas os punhos.",
            "Vencer 3 batalhas consecutivas na arena.",
            "Nunca utilizar armas até o nível 15.",
            "Eliminar um Boss utilizando apenas as mãos em Dungeon Narrada."
        ]
    },
    {
        "nome": "Proficiência em Escudos",
        "arma": "Escudos",
        "descricao": "O usuário transforma a defesa em sua maior arma.",
        "tecnica": "Escudo Atordoante",
        "custo_mana": 600,
        "requisitos": [
            "Defender 30 aliados.",
            "Utilizar escudo por 15 níveis.",
            "Defender um ataque que levaria outro jogador à morte."
        ]
    },
    {
        "nome": "Proficiência em Foices",
        "arma": "Foices ou semelhantes",
        "descricao": "O usuário domina armas curvas e de grande alcance, combinando cortes amplos e movimentos imprevisíveis.",
        "tecnica": "Dança do Ceifador",
        "custo_mana": 600,
        "requisitos": [
            "Realizar 20 treinos completos utilizando Foices.",
            "Participar de um duelo utilizando Foice.",
            "Eliminar um Boss utilizando Foice em Dungeon Narrada.",
            "Utilizar Foice por no mínimo 15 níveis."
        ]
    },
    {
        "nome": "Proficiência em Correntes",
        "arma": "Correntes ou armas flexíveis",
        "descricao": "O usuário domina armas de movimento imprevisível, utilizando alcance, velocidade e controle.",
        "tecnica": "Domínio das Correntes",
        "custo_mana": 600,
        "requisitos": [
            "Realizar 20 treinos utilizando Correntes.",
            "Participar de um duelo utilizando Correntes.",
            "Eliminar um Boss utilizando Correntes em Dungeon Narrada.",
            "Utilizar Correntes por no mínimo 15 níveis."
        ]
    },
    {
        "nome": "Proficiência em Machados",
        "arma": "Machados ou semelhantes",
        "descricao": "O usuário domina armas pesadas de corte, realizando golpes brutais capazes de romper armaduras e escudos.",
        "tecnica": "Execução do Carrasco",
        "custo_mana": 600,
        "requisitos": [
            "Realizar 20 treinos completos utilizando Machados.",
            "Participar de um duelo utilizando Machados.",
            "Eliminar um Boss utilizando Machado em uma Dungeon Narrada.",
            "Utilizar Machados por no mínimo 15 níveis."
        ]
    },
    {
        "nome": "Proficiência em Martelos",
        "arma": "Martelos ou semelhantes",
        "descricao": "O usuário domina armas de impacto, destruindo defesas através de força bruta.",
        "tecnica": "Impacto Titânico",
        "custo_mana": 600,
        "requisitos": [
            "Realizar 20 treinos completos utilizando Martelos.",
            "Participar de um duelo utilizando Martelos.",
            "Eliminar um Boss utilizando Martelo em uma Dungeon Narrada.",
            "Utilizar Martelos por no mínimo 15 níveis."
        ]
    },
    {
        "nome": "Proficiência em Chicotes",
        "arma": "Chicotes ou semelhantes",
        "descricao": "Especialista em ataques de longo alcance utilizando armas flexíveis.",
        "tecnica": "Laço do Caçador",
        "custo_mana": 600,
        "requisitos": [
            "Realizar 20 treinos completos utilizando Chicotes.",
            "Participar de um duelo utilizando Chicotes.",
            "Eliminar um Boss utilizando Chicote em uma Dungeon Narrada.",
            "Utilizar Chicotes por no mínimo 15 níveis."
        ]
    },
    {
        "nome": "Proficiência em Manoplas",
        "arma": "Manoplas ou semelhantes",
        "descricao": "O usuário fortalece seus golpes corpo a corpo através de armas acopladas aos punhos.",
        "tecnica": "Punho Demolidor",
        "custo_mana": 600,
        "requisitos": [
            "Realizar 20 treinos completos utilizando Manoplas.",
            "Participar de um duelo utilizando Manoplas.",
            "Eliminar um Boss utilizando Manoplas em uma Dungeon Narrada.",
            "Utilizar Manoplas por no mínimo 15 níveis."
        ]
    },
    {
        "nome": "Proficiência em Bestas",
        "arma": "Bestas ou semelhantes",
        "descricao": "Especialista em armas de disparo mecânico de alta precisão.",
        "tecnica": "Disparo Perfurante",
        "custo_mana": 600,
        "requisitos": [
            "Realizar 20 treinos completos utilizando Bestas.",
            "Participar de um duelo utilizando Bestas.",
            "Eliminar um Boss utilizando Besta em uma Dungeon Narrada.",
            "Utilizar Bestas por no mínimo 15 níveis."
        ]
    },
    {
        "nome": "Proficiência em Bumerangues",
        "arma": "Bumerangues ou semelhantes",
        "descricao": "O usuário domina armas arremessáveis que retornam ao seu portador.",
        "tecnica": "Retorno Mortal",
        "custo_mana": 600,
        "requisitos": [
            "Realizar 20 treinos completos utilizando Bumerangues.",
            "Participar de um duelo utilizando Bumerangues.",
            "Eliminar um Boss utilizando Bumerangue em uma Dungeon Narrada.",
            "Utilizar Bumerangues por no mínimo 15 níveis."
        ]
    },
    {
        "nome": "Proficiência em Garras",
        "arma": "Garras ou semelhantes",
        "descricao": "Especialista em armas curtas focadas em velocidade e ataques consecutivos.",
        "tecnica": "Dilacerar",
        "custo_mana": 600,
        "requisitos": [
            "Realizar 20 treinos completos utilizando Garras.",
            "Participar de um duelo utilizando Garras.",
            "Eliminar um Boss utilizando Garras em uma Dungeon Narrada.",
            "Utilizar Garras por no mínimo 15 níveis."
        ]
    },
    {
        "nome": "Proficiência em Sabres",
        "arma": "Sabres ou semelhantes",
        "descricao": "Especialista em espadas curvas focadas em velocidade e fluidez.",
        "tecnica": "Lua Crescente",
        "custo_mana": 600,
        "requisitos": [
            "Realizar 20 treinos completos utilizando Sabres.",
            "Participar de um duelo utilizando Sabres.",
            "Eliminar um Boss utilizando Sabre em uma Dungeon Narrada.",
            "Utilizar Sabres por no mínimo 15 níveis."
        ]
    },
    {
        "nome": "Proficiência em Foices Duplas",
        "arma": "Foices Duplas ou semelhantes",
        "descricao": "Especialista em armas de duas lâminas curvas.",
        "tecnica": "Círculo da Morte",
        "custo_mana": 600,
        "requisitos": [
            "Realizar 20 treinos completos utilizando Foices Duplas.",
            "Participar de um duelo utilizando Foices Duplas.",
            "Eliminar um Boss utilizando Foices Duplas em uma Dungeon Narrada.",
            "Utilizar Foices Duplas por no mínimo 15 níveis."
        ]
    },
    {
        "nome": "Proficiência em Tridentes",
        "arma": "Tridentes ou semelhantes",
        "descricao": "O usuário domina armas de três pontas, equilibrando perfuração, defesa e controle de distância.",
        "tecnica": "Maré de Poseidon",
        "custo_mana": 600,
        "requisitos": [
            "Realizar 20 treinos completos utilizando Tridentes.",
            "Participar de um duelo utilizando Tridente.",
            "Eliminar um Boss utilizando Tridente em uma Dungeon Narrada.",
            "Utilizar Tridentes por no mínimo 15 níveis."
        ]
    },
    {
        "nome": "Proficiência em Clavas",
        "arma": "Clavas ou semelhantes",
        "descricao": "Especialista em armas simples de impacto, utilizando força bruta para esmagar adversários.",
        "tecnica": "Golpe Demolidor",
        "custo_mana": 600,
        "requisitos": [
            "Realizar 20 treinos completos utilizando Clavas.",
            "Participar de um duelo utilizando Clava.",
            "Eliminar um Boss utilizando Clava em Dungeon Narrada.",
            "Utilizar Clavas por no mínimo 15 níveis."
        ]
    },
    {
        "nome": "Proficiência em Floretes",
        "arma": "Floretes ou semelhantes",
        "descricao": "O usuário domina esgrima e ataques extremamente precisos.",
        "tecnica": "Estocada Fantasma",
        "custo_mana": 600,
        "requisitos": [
            "Realizar 20 treinos completos utilizando Floretes.",
            "Participar de um duelo utilizando Florete.",
            "Eliminar um Boss utilizando Florete em Dungeon Narrada.",
            "Utilizar Floretes por no mínimo 15 níveis."
        ]
    },
    {
        "nome": "Proficiência em Chakrams",
        "arma": "Chakrams ou semelhantes",
        "descricao": "Especialista em discos cortantes arremessáveis.",
        "tecnica": "Círculo Celestial",
        "custo_mana": 600,
        "requisitos": [
            "Realizar 20 treinos completos utilizando Chakrams.",
            "Participar de um duelo utilizando Chakrams.",
            "Eliminar um Boss utilizando Chakram em Dungeon Narrada.",
            "Utilizar Chakrams por no mínimo 15 níveis."
        ]
    },
    {
        "nome": "Proficiência em Luvas de Combate",
        "arma": "Luvas ou semelhantes",
        "descricao": "Especialista em artes marciais potencializadas por equipamentos.",
        "tecnica": "Punhos do Dragão",
        "custo_mana": 600,
        "requisitos": [
            "Realizar 20 treinos completos utilizando Luvas.",
            "Participar de um duelo utilizando Luvas.",
            "Eliminar um Boss utilizando Luvas em Dungeon Narrada.",
            "Utilizar Luvas por no mínimo 15 níveis."
        ]
    },
    {
        "nome": "Proficiência em Manguais",
        "arma": "Mangual ou semelhantes",
        "descricao": "Domina armas de corrente com esfera metálica, explorando movimentos imprevisíveis.",
        "tecnica": "Impacto Caótico",
        "custo_mana": 600,
        "requisitos": [
            "Realizar 20 treinos completos utilizando Mangual.",
            "Participar de um duelo utilizando Mangual.",
            "Eliminar um Boss utilizando Mangual em Dungeon Narrada.",
            "Utilizar Mangual por no mínimo 15 níveis."
        ]
    },
    {
        "nome": "Proficiência em Alabardas",
        "arma": "Alabardas ou semelhantes",
        "descricao": "Especialista em armas híbridas de corte e perfuração.",
        "tecnica": "Guarda Imperial",
        "custo_mana": 600,
        "requisitos": [
            "Realizar 20 treinos completos utilizando Alabardas.",
            "Participar de um duelo utilizando Alabarda.",
            "Eliminar um Boss utilizando Alabarda em Dungeon Narrada.",
            "Utilizar Alabardas por no mínimo 15 níveis."
        ]
    },
    {
        "nome": "Proficiência em Nunchakus",
        "arma": "Nunchakus ou semelhantes",
        "descricao": "Especialista em armas rápidas de curto alcance.",
        "tecnica": "Tempestade Giratória",
        "custo_mana": 600,
        "requisitos": [
            "Realizar 20 treinos completos utilizando Nunchakus.",
            "Participar de um duelo utilizando Nunchaku.",
            "Eliminar um Boss utilizando Nunchaku em Dungeon Narrada.",
            "Utilizar Nunchakus por no mínimo 15 níveis."
        ]
    },
    {
        "nome": "Proficiência em Tonfas",
        "arma": "Tonfas ou semelhantes",
        "descricao": "Especialista em armas defensivas utilizadas em combate próximo.",
        "tecnica": "Guarda Absoluta",
        "custo_mana": 600,
        "requisitos": [
            "Realizar 20 treinos completos utilizando Tonfas.",
            "Participar de um duelo utilizando Tonfas.",
            "Eliminar um Boss utilizando Tonfas em Dungeon Narrada.",
            "Utilizar Tonfas por no mínimo 15 níveis."
        ]
    },
    {
        "nome": "Proficiência em Kamas",
        "arma": "Kamas ou semelhantes",
        "descricao": "Especialista em pequenas foices extremamente velozes.",
        "tecnica": "Lua Sangrenta",
        "custo_mana": 600,
        "requisitos": [
            "Realizar 20 treinos completos utilizando Kamas.",
            "Participar de um duelo utilizando Kamas.",
            "Eliminar um Boss utilizando Kamas em Dungeon Narrada.",
            "Utilizar Kamas por no mínimo 15 níveis."
        ]
    },
    {
        "nome": "Proficiência em Rapieiras",
        "arma": "Rapieiras ou semelhantes",
        "descricao": "Especialista em ataques elegantes e extremamente precisos.",
        "tecnica": "Dança do Duelista",
        "custo_mana": 600,
        "requisitos": [
            "Realizar 20 treinos completos utilizando Rapieiras.",
            "Participar de um duelo utilizando Rapieira.",
            "Eliminar um Boss utilizando Rapieira em Dungeon Narrada.",
            "Utilizar Rapieiras por no mínimo 15 níveis."
        ]
    },
    {
        "nome": "Proficiência em Báculos",
        "arma": "Báculos ou semelhantes",
        "descricao": "Especialista em armas mágicas focadas em suporte e canalização.",
        "tecnica": "Canal Arcano",
        "custo_mana": 600,
        "requisitos": [
            "Realizar 20 treinos completos utilizando Báculos.",
            "Participar de um duelo utilizando Báculo.",
            "Eliminar um Boss utilizando Báculo em Dungeon Narrada.",
            "Utilizar Báculos por no mínimo 15 níveis."
        ]
    },
    {
        "nome": "Proficiência em Cimitarras",
        "arma": "Cimitarras ou semelhantes",
        "descricao": "Especialista em lâminas curvas voltadas para golpes fluidos.",
        "tecnica": "Vento do Deserto",
        "custo_mana": 600,
        "requisitos": [
            "Realizar 20 treinos completos utilizando Cimitarras.",
            "Participar de um duelo utilizando Cimitarra.",
            "Eliminar um Boss utilizando Cimitarra em Dungeon Narrada.",
            "Utilizar Cimitarras por no mínimo 15 níveis."
        ]
    },
    {
        "nome": "Proficiência em Picaretas de Guerra",
        "arma": "Picaretas ou semelhantes",
        "descricao": "Especialista em perfurar armaduras pesadas.",
        "tecnica": "Quebra-Ferro",
        "custo_mana": 600,
        "requisitos": [
            "Realizar 20 treinos completos utilizando Picaretas.",
            "Participar de um duelo utilizando Picareta.",
            "Eliminar um Boss utilizando Picareta em Dungeon Narrada.",
            "Utilizar Picaretas por no mínimo 15 níveis."
        ]
    },
    {
        "nome": "Proficiência em Bastões",
        "arma": "Bastões ou semelhantes",
        "descricao": "Especialista em combate versátil utilizando bastões longos.",
        "tecnica": "Vendaval Giratório",
        "custo_mana": 600,
        "requisitos": [
            "Realizar 20 treinos completos utilizando Bastões.",
            "Participar de um duelo utilizando Bastão.",
            "Eliminar um Boss utilizando Bastão em Dungeon Narrada.",
            "Utilizar Bastões por no mínimo 15 níveis."
        ]
    },
    {
        "nome": "Proficiência em Funda",
        "arma": "Fundas ou semelhantes",
        "descricao": "Especialista em projéteis simples de longo alcance.",
        "tecnica": "Pedra Meteórica",
        "custo_mana": 600,
        "requisitos": [
            "Realizar 20 treinos completos utilizando Fundas.",
            "Participar de um duelo utilizando Funda.",
            "Eliminar um Boss utilizando Funda em Dungeon Narrada.",
            "Utilizar Fundas por no mínimo 15 níveis."
        ]
    },
    {
        "nome": "Proficiência em Lâminas Duplas",
        "arma": "Lâminas Duplas ou semelhantes",
        "descricao": "Especialista em armas de duas extremidades cortantes.",
        "tecnica": "Cruz Carmesim",
        "custo_mana": 600,
        "requisitos": [
            "Realizar 20 treinos completos utilizando Lâminas Duplas.",
            "Participar de um duelo utilizando Lâminas Duplas.",
            "Eliminar um Boss utilizando Lâminas Duplas em Dungeon Narrada.",
            "Utilizar Lâminas Duplas por no mínimo 15 níveis."
        ]
    },
    {
        "nome": "Proficiência em Correntes com Foice",
        "arma": "Kusarigama ou semelhantes",
        "descricao": "Especialista em armas híbridas de corrente e foice.",
        "tecnica": "Lua Acorrentada",
        "custo_mana": 600,
        "requisitos": [
            "Realizar 20 treinos completos utilizando Kusarigamas.",
            "Participar de um duelo utilizando Kusarigama.",
            "Eliminar um Boss utilizando Kusarigama em Dungeon Narrada.",
            "Utilizar Kusarigamas por no mínimo 15 níveis."
        ]
    },
    {
        "nome": "Proficiência em Leques de Guerra",
        "arma": "Leques ou semelhantes",
        "descricao": "Especialista em armas ocultas utilizadas com velocidade e elegância.",
        "tecnica": "Vendaval Cortante",
        "custo_mana": 600,
        "requisitos": [
            "Realizar 20 treinos completos utilizando Leques.",
            "Participar de um duelo utilizando Leques.",
            "Eliminar um Boss utilizando Leques em Dungeon Narrada.",
            "Utilizar Leques por no mínimo 15 níveis."
        ]
    },
    {
        "nome": "Proficiência em Instrumentos Musicais",
        "arma": "Instrumentos Mágicos",
        "descricao": "Especialista em armas sonoras capazes de utilizar mana através da música.",
        "tecnica": "Sinfonia Arcana",
        "custo_mana": 600,
        "requisitos": [
            "Realizar 20 treinos completos utilizando Instrumentos Mágicos.",
            "Participar de um duelo utilizando Instrumentos.",
            "Eliminar um Boss utilizando Instrumento em Dungeon Narrada.",
            "Utilizar Instrumentos por no mínimo 15 níveis."
        ]
    },
    {
        "nome": "Proficiência em Pistolas",
        "arma": "Pistolas, revólveres e armas curtas",
        "descricao": "Especialista em armas de fogo curtas, saque rápido, precisão móvel e combate em curta e média distância.",
        "tecnica": "Réquiem do Saque Rápido",
        "custo_mana": 600,
        "requisitos": [
            "Realizar 20 treinos completos focados no manejo de Pistolas, revólveres e armas curtas.",
            "Participar de um duelo utilizando Pistolas, revólveres e armas curtas.",
            "Eliminar um Boss utilizando Pistolas, revólveres e armas curtas em uma Dungeon Narrada.",
            "Utilizar Pistolas, revólveres e armas curtas por no mínimo 15 níveis."
        ]
    },
    {
        "nome": "Proficiência em Escopetas",
        "arma": "Escopetas e espingardas de dispersão",
        "descricao": "Especialista em armas de dispersão, pressão a curta distância, recuo controlado e impacto em área.",
        "tecnica": "Coroa da Boca de Fogo",
        "custo_mana": 600,
        "requisitos": [
            "Realizar 20 treinos completos focados no manejo de Escopetas e espingardas de dispersão.",
            "Participar de um duelo utilizando Escopetas e espingardas de dispersão.",
            "Eliminar um Boss utilizando Escopetas e espingardas de dispersão em uma Dungeon Narrada.",
            "Utilizar Escopetas e espingardas de dispersão por no mínimo 15 níveis."
        ]
    },
    {
        "nome": "Proficiência em Fuzis",
        "arma": "Fuzis e rifles de assalto",
        "descricao": "Especialista em fogo sustentado, rajadas controladas, supressão e transição entre média e longa distância.",
        "tecnica": "Marcha do Arsenal",
        "custo_mana": 600,
        "requisitos": [
            "Realizar 20 treinos completos focados no manejo de Fuzis e rifles de assalto.",
            "Participar de um duelo utilizando Fuzis e rifles de assalto.",
            "Eliminar um Boss utilizando Fuzis e rifles de assalto em uma Dungeon Narrada.",
            "Utilizar Fuzis e rifles de assalto por no mínimo 15 níveis."
        ]
    },
    {
        "nome": "Proficiência em Rifles de Precisão",
        "arma": "Rifles de precisão e armas sniper",
        "descricao": "Especialista em tiro de extrema precisão, leitura de trajetória, preparação de posição e ataques de longo alcance.",
        "tecnica": "Olho de Longinus",
        "custo_mana": 600,
        "requisitos": [
            "Realizar 20 treinos completos focados no manejo de Rifles de precisão e armas sniper.",
            "Participar de um duelo utilizando Rifles de precisão e armas sniper.",
            "Eliminar um Boss utilizando Rifles de precisão e armas sniper em uma Dungeon Narrada.",
            "Utilizar Rifles de precisão e armas sniper por no mínimo 15 níveis."
        ]
    },
    {
        "nome": "Proficiência em Facas",
        "arma": "Facas de combate ou semelhantes",
        "descricao": "Especialista em facas de combate, cortes curtos, reversão de empunhadura e transições rápidas entre ataque e defesa.",
        "tecnica": "Rosário de Aço",
        "custo_mana": 600,
        "requisitos": [
            "Realizar 20 treinos completos focados no manejo de Facas de combate ou semelhantes.",
            "Participar de um duelo utilizando Facas de combate ou semelhantes.",
            "Eliminar um Boss utilizando Facas de combate ou semelhantes em uma Dungeon Narrada.",
            "Utilizar Facas de combate ou semelhantes por no mínimo 15 níveis."
        ]
    },
    {
        "nome": "Proficiência em Espadas Pesadas",
        "arma": "Espadões, claymores e espadas pesadas",
        "descricao": "Domínio de lâminas de grande porte, usando peso, inércia, postura e força para romper guardas e controlar espaço.",
        "tecnica": "Trono de Balmung",
        "custo_mana": 600,
        "requisitos": [
            "Realizar 20 treinos completos focados no manejo de Espadões, claymores e espadas pesadas.",
            "Participar de um duelo utilizando Espadões, claymores e espadas pesadas.",
            "Eliminar um Boss utilizando Espadões, claymores e espadas pesadas em uma Dungeon Narrada.",
            "Utilizar Espadões, claymores e espadas pesadas por no mínimo 15 níveis."
        ]
    },
    {
        "nome": "Proficiência em Espadas Pesadas Duplas",
        "arma": "Duas espadas pesadas ou espadões",
        "descricao": "Estilo extremo que usa duas lâminas pesadas ao mesmo tempo, alternando rotações, cruzamentos e pressão contínua.",
        "tecnica": "Gêmeas de Gram",
        "custo_mana": 600,
        "requisitos": [
            "Realizar 20 treinos completos focados no manejo de Duas espadas pesadas ou espadões.",
            "Participar de um duelo utilizando Duas espadas pesadas ou espadões.",
            "Eliminar um Boss utilizando Duas espadas pesadas ou espadões em uma Dungeon Narrada.",
            "Utilizar Duas espadas pesadas ou espadões por no mínimo 15 níveis."
        ]
    }
];

module.exports = estilos;
