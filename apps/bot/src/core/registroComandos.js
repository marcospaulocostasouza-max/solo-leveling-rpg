/**
 * SISTEMA DE REGISTRO DE COMANDOS
 * 
 * Centraliza todos os comandos do bot com suas informações:
 * - nome: Nome do comando
 * - funcao: O que ele executa
 * - arquivo: Arquivo responsável
 * - descricao: Informações que ele exibe
 * - dependencias: Dependências necessárias
 * - ativo: Se está conectado corretamente
 */

const fs = require("fs");
const path = require("path");

function registrarTodosComandos() {
    const comandos = [
        // =====================================
        // SISTEMA INICIAL
        // =====================================
        {
            nome: "!iniciar",
            funcao: "Exibe boas vindas e lista de comandos básicos do sistema",
            arquivo: "iniciar.js",
            descricao: "Mensagem de boas vindas com os comandos disponíveis",
            dependencias: ["Nenhuma"],
            ativo: true,
            categoria: "Sistema Inicial"
        },
        {
            nome: "!arquiteto",
            funcao: "Exibe o indice principal de informacoes do RPG",
            arquivo: "arquiteto.js",
            descricao: "Apresenta as futuras areas Cacador, Ascensao, Associacoes, Biblioteca, Historia e Acervo",
            dependencias: ["Nenhuma"],
            ativo: true,
            categoria: "Sistema Inicial"
        },
        {
            nome: "!caçador / !cacador",
            funcao: "Exibe o menu de informações do personagem",
            arquivo: "cacador.js",
            descricao: "Reúne os comandos de ficha, nível, atributos, afinidade, equipamentos, inventário, passivas, títulos, técnicas e HP",
            dependencias: ["Nenhuma"],
            ativo: true,
            categoria: "Sistema Inicial"
        },
        {
            nome: "!ficha",
            funcao: "Exibe o modelo de ficha de personagem para preenchimento",
            arquivo: "ficha.js",
            descricao: "Template completo de ficha de personagem com todos os campos",
            dependencias: ["Nenhuma"],
            ativo: true,
            categoria: "Ficha"
        },
        {
            nome: "!sortear afinidade",
            funcao: "Sorteia um elemento elemental aleatório para o jogador",
            arquivo: "sortearAfinidade.js",
            descricao: "Sorteia elemento entre os disponíveis no sistema",
            dependencias: ["../../elementos/listaElementos.js"],
            ativo: true,
            categoria: "Ficha"
        },
        {
            nome: "!confirmar ficha",
            funcao: "Confirma a ficha preenchida e envia para análise dos ADMs",
            arquivo: "confirmarFicha.js",
            descricao: "Valida todos os campos, atributos e envia para aprovação",
            dependencias: [
                "../../utils/fichasTemp.js",
                "../../core/database.js",
                "../../utils/sortearAfinidade.js",
                "../../database/classes.json",
                "../../database/estilosluta.json",
                "../../database/initial_items.json",
                "../../database/elementos.json"
            ],
            ativo: true,
            categoria: "Ficha"
        },

        // =====================================
        // COMANDOS ADMINISTRATIVOS
        // =====================================
        {
            nome: "!avaliar ficha [nome]",
            funcao: "ADM visualiza a ficha completa de um jogador pendente",
            arquivo: "avaliarFicha.js",
            descricao: "Exibe a ficha completa do jogador para análise administrativa",
            dependencias: ["../../utils/fichasAvaliacao.js"],
            ativo: true,
            categoria: "Administrativo"
        },
        {
            nome: "!aprovar ficha [nome]",
            funcao: "ADM aprova a ficha e cria o jogador no banco de dados",
            arquivo: "aprovarFicha.js",
            descricao: "Aprova ficha, cria jogador no banco, calcula mana inicial",
            dependencias: ["../../utils/fichasAvaliacao.js", "../../core/database.js"],
            ativo: true,
            categoria: "Administrativo"
        },
        {
            nome: "!aprovada para classe avançada <jogador> <classe>",
            funcao: "ADM aprova a classe avançada escolhida pelo jogador",
            arquivo: "aprovadaClasseAvancada.js",
            descricao: "Aprova uma classe avançada para o jogador e aplica os bônus de atributos",
            dependencias: ["../../systems/advancedClassSystem.js"],
            ativo: true,
            categoria: "Administrativo"
        },
        {
            nome: "!avaliar ia [nome]",
            funcao: "IA analisa ficha e dá sugestões detalhadas de aprovação",
            arquivo: "avaliarIA.js",
            descricao: "Análise completa: nota, sugestões, distribuição de atributos e habilidade sugerida",
            dependencias: ["../../ia/arquiteturaIA.js", "../../core/database.js"],
            ativo: true,
            categoria: "Administrativo"
        },
        {
            nome: "!recusar [motivo] [nome]",
            funcao: "ADM recusa a ficha com um motivo específico",
            arquivo: "recusarFicha.js",
            descricao: "Recusa ficha com motivo e avisa o jogador no privado",
            dependencias: ["../../utils/fichasAvaliacao.js"],
            ativo: true,
            categoria: "Administrativo"
        },
        {
            nome: "!testegrupo",
            funcao: "Testa se o grupo está registrado no sistema",
            arquivo: "testeGrupo.js",
            descricao: "Verifica se o grupo atual está no banco",
            dependencias: ["../../core/database.js"],
            ativo: true,
            categoria: "Administrativo"
        },
        {
            nome: "!idgrupo",
            funcao: "Retorna o ID do grupo atual",
            arquivo: "idGrupo.js",
            descricao: "Mostra o identificador único do grupo no WhatsApp",
            dependencias: ["Nenhuma"],
            ativo: true,
            categoria: "Administrativo"
        },
        {
            nome: "!listar grupos",
            funcao: "Lista todos os grupos registrados no banco",
            arquivo: "listarGrupos.js",
            descricao: "Mostra todos os grupos cadastrados no sistema",
            dependencias: ["../../core/database.js"],
            ativo: true,
            categoria: "Administrativo"
        },
        {
            nome: "!vercomandos",
            funcao: "ADM verifica todos os comandos registrados e seus status",
            arquivo: "verComandos.js",
            descricao: "Analisa todos os comandos e retorna lista completa com status",
            dependencias: ["./registroComandos.js"],
            ativo: true,
            categoria: "Administrativo"
        },
        {
            nome: "!ver fila",
            funcao: "Exibe a lista de fichas pendentes na fila de aprovação",
            arquivo: "verFila.js",
            descricao: "Mostra nome, classe e data de envio de todas as fichas aguardando aprovação",
            dependencias: ["../../core/database.js"],
            ativo: true,
            categoria: "Administrativo"
        },
        {
            nome: "!admin afinidade <jogador> <elemento>",
            funcao: "ADM define/altera a afinidade elemental de um jogador",
            arquivo: "adminAfinidade.js",
            descricao: "Altera a afinidade no banco de dados do jogador e na ficha. Registra log administrativo.",
            dependencias: ["../../core/database.js", "../../database/elementos.json"],
            ativo: true,
            categoria: "Administrativo"
        },
        {
            nome: "!comandos grupo",
            funcao: "Exibe quais comandos estão disponíveis em cada grupo",
            arquivo: "gruposComandos.js",
            descricao: "Mostra todos os comandos organizados por grupo: Fichas, Aprovação, Comandos, ON, Dungeon, Loja e Minigames",
            dependencias: ["../../core/groupConfig.js"],
            ativo: true,
            categoria: "Informação"
        },
        {
            nome: "!consultar afinidade / !consultar elemento",
            funcao: "Exibe a afinidade elemental que o jogador possui",
            arquivo: "consultarAfinidade.js",
            descricao: "Mostra o elemento sorteado, categoria, raridade e bônus",
            dependencias: ["../../core/database.js", "../../database/elementos.json"],
            ativo: true,
            categoria: "Jogador"
        },
        {
            nome: "!treino aprovado <jogador> <tipo>",
            funcao: "ADM aprova atividade e distribui recompensas automaticamente",
            arquivo: "aprovarAtividade.js",
            descricao: "ADM aprova treinos, missões, dungeons ou batalhas. Calcula recompensa por rank e notifica jogador.",
            dependencias: ["../../core/database.js"],
            ativo: true,
            categoria: "Administrativo"
        },
        {
            nome: "!atividades / !historico",
            funcao: "Exibe histórico de atividades aprovadas do jogador",
            arquivo: "atividades.js",
            descricao: "Mostra contadores de treinos, missões, dungeons e totais de recompensas recebidas",
            dependencias: ["../../core/database.js"],
            ativo: true,
            categoria: "Jogador"
        },

        // =====================================
        // JOGADOR E CONSULTAS
        // =====================================
        {
            nome: "!jogador",
            funcao: "Exibe a ficha completa do jogador no banco de dados",
            arquivo: "jogador.js",
            descricao: "Mostra a ficha principal: atributos, classe, nível e mana",
            dependencias: ["../../core/database.js"],
            ativo: true,
            categoria: "Jogador"
        },
        {
            nome: "!regras",
            funcao: "Exibe as regras do sistema RPG",
            arquivo: "regras.js",
            descricao: "Mostra as regras e diretrizes do RPG",
            dependencias: ["Nenhuma"],
            ativo: true,
            categoria: "Informação"
        },
        {
            nome: "!classes",
            funcao: "Lista todas as classes disponíveis com descrições e bônus",
            arquivo: "classes.js",
            descricao: "Exibe cada classe: nome, descrição, bônus e foco",
            dependencias: ["../../utils/classes.js"],
            ativo: true,
            categoria: "Informação"
        },
        {
            nome: "!classe avançada / !classe avancada",
            funcao: "Mostra técnicas e informações das classes avançadas",
            arquivo: "classeAvancada.js",
            descricao: "Exibe todas as classes avançadas e suas respectivas técnicas",
            dependencias: ["../../tecnicas/avancadas/techniques.js"],
            ativo: true,
            categoria: "Informação"
        },
        {
            nome: "!tecnicas / !técnicas",
            funcao: "Lista todas as técnicas iniciais por classe",
            arquivo: "tecnicas.js",
            descricao: "Mostra técnicas: nome, categoria, tipo, custo, cooldown, nível",
            dependencias: [
                "../../tecnicas/iniciais/lutador.js",
                "../../tecnicas/iniciais/assassino.js",
                "../../tecnicas/iniciais/tanker.js",
                "../../tecnicas/iniciais/ranger.js",
                "../../tecnicas/iniciais/curador.js",
                "../../tecnicas/iniciais/magoElemental.js",
                "../../tecnicas/iniciais/magoInvocador.js",
                "../../tecnicas/iniciais/magoBarreira.js",
                "../../tecnicas/iniciais/magoMaldicao.js"
            ],
            ativo: true,
            categoria: "Informação"
        },
        {
            nome: "!estilos de luta",
            funcao: "Lista estilos de luta disponíveis com técnicas",
            arquivo: "estilosLuta.js",
            descricao: "Mostra estilo, arma, descrição, técnica, custo e requisitos",
            dependencias: ["../../core/database.js"],
            ativo: true,
            categoria: "Informação"
        },
        {
            nome: "!armasiniciais / !armas iniciais",
            funcao: "Lista armas iniciais disponíveis para escolha",
            arquivo: "armasiniciais.js",
            descricao: "Mostra armas básicas sem bônus para iniciar o jogo",
            dependencias: ["../../database/initial_items.json"],
            ativo: true,
            categoria: "Informação"
        },
        {
            nome: "!itens",
            funcao: "Lista todos os itens disponíveis no sistema",
            arquivo: "itens.js",
            descricao: "Mostra itens cadastrados no banco de dados",
            dependencias: ["../../database/itens.json"],
            ativo: true,
            categoria: "Informação"
        },

        // =====================================
        // SISTEMAS DE ATRIBUTOS
        // =====================================
        {
            nome: "!atributos físico / !atributos fisico",
            funcao: "Exibe detalhes dos atributos físicos (Força, Resistência, Agilidade)",
            arquivo: "atributos.js",
            descricao: "Explicação detalhada de Força, Resistência, Agilidade e suas passivas",
            dependencias: ["Nenhuma"],
            ativo: true,
            categoria: "Atributos"
        },
        {
            nome: "!atributos mágico / !atributos magico",
            funcao: "Exibe detalhes dos atributos mágicos (Inteligência, Sentidos, Poder Mágico)",
            arquivo: "atributos.js",
            descricao: "Explicação detalhada de Inteligência, Sentidos, Poder Mágico e passivas",
            dependencias: ["Nenhuma"],
            ativo: true,
            categoria: "Atributos"
        },
        {
            nome: "!atributos adicionais / !atributos suplementares",
            funcao: "Exibe atributos adicionais (Impacto, Nirvana, Percepção, Vitalidade)",
            arquivo: "atributos.js",
            descricao: "Sistema de Impacto, Nirvana, Percepção, Vitalidade e cálculos de dano",
            dependencias: ["Nenhuma"],
            ativo: true,
            categoria: "Atributos"
        },
        {
            nome: "!distribuir",
            funcao: "Distribui pontos de atributo recebidos por level up",
            arquivo: "distribuir.js",
            descricao: "Sistema de distribuição de pontos: +3 pontos por nível, recalcula atributos derivados",
            dependencias: ["../../core/database.js"],
            ativo: true,
            categoria: "Atributos"
        },
        {
            nome: "!apagar personagem",
            funcao: "Exclui permanentemente o personagem e reseta tudo",
            arquivo: "apagarPersonagem.js",
            descricao: "Exclui personagem completamente: atributos, inventário, técnicas, afinidades. Requer confirmação dupla.",
            dependencias: ["../../core/database.js"],
            ativo: true,
            categoria: "Jogador"
        },
        {
            nome: "!sortear dungeon",
            funcao: "Sistema de sorteio semanal de dungeon (uma vez por semana)",
            arquivo: "sortearDungeon.js",
            descricao: "Sistema semanal: verifica cooldown, sorteia raridade 1-5, busca dungeon e envia dados",
            dependencias: ["../../core/database.js"],
            ativo: true,
            categoria: "RPG"
        },

        // =====================================
        // SISTEMAS DE RPG
        // =====================================
        {
            nome: "!batalha [iniciar/atacar/usar/fugir]",
            funcao: "Sistema de combate contra monstros e inimigos",
            arquivo: "batalha.js",
            descricao: "Sistema completo de batalha com turnos, dano, mana e recompensas",
            dependencias: ["../../core/database.js", "../../systems/battleSystem.js"],
            ativo: true,
            categoria: "RPG"
        },
        {
            nome: "!inventario / !inv",
            funcao: "Exibe o inventário do jogador",
            arquivo: "inventario.js",
            descricao: "Mostra itens, equipamentos, armas e armaduras do jogador",
            dependencias: ["../../core/database.js", "../../systems/inventorySystem.js"],
            ativo: true,
            categoria: "RPG"
        },
        {
            nome: "!equipados",
            funcao: "Exibe todos os slots de equipamento do jogador",
            arquivo: "verSlots.js",
            descricao: "Mostra quais slots estão ocupados/livres e o item equipado em cada um",
            dependencias: ["../../core/database.js", "../../systems/atributoSystem.js"],
            ativo: true,
            categoria: "RPG"
        },
        {
            nome: "!equipar [item]",
            funcao: "Equipa um item do inventário",
            arquivo: "equipar.js",
            descricao: "Equipa armas, armaduras, escudos e acessórios",
            dependencias: ["../../core/database.js", "../../systems/inventorySystem.js"],
            ativo: true,
            categoria: "RPG"
        },
        {
            nome: "!desequipar [item]",
            funcao: "Desequipa um item equipado",
            arquivo: "desequipar.js",
            descricao: "Remove um equipamento ativo sem alterar o inventario",
            dependencias: ["../../core/database.js", "../../systems/atributoSystem.js"],
            ativo: true,
            categoria: "RPG"
        },
        {
            nome: "!usar [item]",
            funcao: "Usa um item consumível do inventário",
            arquivo: "usarItem.js",
            descricao: "Usa poções, pergaminhos e outros itens consumíveis",
            dependencias: ["../../core/database.js", "../../systems/inventorySystem.js"],
            ativo: true,
            categoria: "RPG"
        },
        {
            nome: "!vender <item>",
            funcao: "Vende um item do inventário de volta para a loja",
            arquivo: "vender.js",
            descricao: "Vende itens por 50% do valor original. Minérios vendem pelo valor cheio. Requer !confirmar venda.",
            dependencias: ["../../core/database.js", "../../systems/vendaSystem.js"],
            ativo: true,
            categoria: "RPG"
        },
        {
            nome: "!confirmar venda",
            funcao: "Confirma a venda pendente e adiciona Wons na conta",
            arquivo: "confirmarVenda.js",
            descricao: "Confirma venda iniciada com !vender. O valor cai diretamente na conta do jogador.",
            dependencias: ["../../core/database.js", "../../systems/vendaSystem.js", "../../systems/economySystem.js"],
            ativo: true,
            categoria: "RPG"
        },
        {
            nome: "!cancelar venda",
            funcao: "Cancela uma venda pendente",
            arquivo: "cancelarVenda.js",
            descricao: "Cancela venda iniciada com !vender. O item permanece no inventário.",
            dependencias: ["../../core/database.js"],
            ativo: true,
            categoria: "RPG"
        },
        {
            nome: "!abrir loja",
            funcao: "Exibe categorias e guia de compra da loja",
            arquivo: "abrirLoja.js",
            descricao: "Mostra categorias por rank, saldo atual e guia completo de como comprar",
            dependencias: ["../../core/database.js", "../../systems/economySystem.js"],
            ativo: true,
            categoria: "RPG"
        },
        {
            nome: "!comprar [item]",
            funcao: "Compra um item da loja",
            arquivo: "comprar.js",
            descricao: "Compra itens usando Won, adiciona ao inventário",
            dependencias: ["../../core/database.js", "../../systems/economySystem.js"],
            ativo: true,
            categoria: "RPG"
        },
        {
            nome: "!dungeon [iniciar/progresso/sair]",
            funcao: "Sistema de dungeons para explorar e farmar",
            arquivo: "dungeon.js",
            descricao: "Explora dungeons, enfrenta monstros e ganha recompensas",
            dependencias: ["../../core/database.js", "../../systems/battleSystem.js"],
            ativo: true,
            categoria: "RPG"
        },
        {
            nome: "!missao / !missoes",
            funcao: "Exibe as missões disponíveis do jogador",
            arquivo: "missoes.js",
            descricao: "Mostra missões ativas, progresso e recompensas",
            dependencias: ["../../core/database.js", "../../systems/questSystem.js"],
            ativo: true,
            categoria: "RPG"
        },
        {
            nome: "!guilda [lista/criar/entrar/info/membros/sair/transferir/dissolver]",
            funcao: "Sistema de guildas do jogo",
            arquivo: "guilda.js",
            descricao: "Explica guildas e gerencia criação, entrada, saída e liderança com custo, Rank e cooldown",
            dependencias: ["../../core/database.js", "../../systems/guildaSystem.js"],
            ativo: true,
            categoria: "RPG"
        },
        {
            nome: "!ranking / !rank",
            funcao: "Exibe o ranking dos jogadores",
            arquivo: "ranking.js",
            descricao: "Mostra jogadores por nível, experiência, Won",
            dependencias: ["../../core/database.js"],
            ativo: true,
            categoria: "RPG"
        },
        {
            nome: "!mvp",
            funcao: "Exibe o MVP da arena e o ranking de candidatos",
            arquivo: "mvp.js",
            descricao: "Mostra o líder atual do MVP, ranking e permite resetar o ciclo (ADM)",
            dependencias: ["../../core/database.js", "../../systems/arenaSystem.js"],
            ativo: true,
            categoria: "RPG"
        },
        {
            nome: "!nivel / !level",
            funcao: "Exibe informações de nível e progressão",
            arquivo: "nivel.js",
            descricao: "Mostra nível atual, XP, próximo nível e bônus",
            dependencias: ["../../core/database.js", "../../systems/levelSystem.js"],
            ativo: true,
            categoria: "RPG"
        },
        {
            nome: "!passivas",
            funcao: "Lista as passivas disponíveis por categoria",
            arquivo: "passivas.js",
            descricao: "Mostra todas as passivas do sistema organizadas por categoria",
            dependencias: ["../../database/data/passivas.json"],
            ativo: true,
            categoria: "Informação"
        },
        {
            nome: "!titulos",
            funcao: "Lista os títulos disponíveis por categoria",
            arquivo: "titulos.js",
            descricao: "Mostra todos os títulos do sistema organizados por categoria",
            dependencias: ["../../database/data/titulos.json"],
            ativo: true,
            categoria: "Informação"
        },
        {
            nome: "!meus titulos / !meus títulos",
            funcao: "Exibe os titulos conquistados pelo jogador",
            arquivo: "meusTitulos.js",
            descricao: "Mostra detalhes, raridade, efeitos e como equipar os titulos conquistados",
            dependencias: ["../../core/database.js", "../../database/data/titulos.json"],
            ativo: true,
            categoria: "Jogador"
        },
        {
            nome: "!afinidades / !todas as afinidades",
            funcao: "Exibe o catalogo completo de afinidades elementais",
            arquivo: "afinidades.js",
            descricao: "Mostra categoria, raridade, origem, bonus, vantagens e disponibilidade de todas as afinidades",
            dependencias: ["../../elementos/listaElementos.js"],
            ativo: true,
            categoria: "Informação"
        },
        {
            nome: "!habilidades",
            funcao: "Exibe as habilidades do jogador",
            arquivo: "habilidades.js",
            descricao: "Mostra técnicas, passivas e habilidades especiais do jogador",
            dependencias: ["../../core/database.js"],
            ativo: true,
            categoria: "Jogador"
        },
        {
            nome: "!loja armas",
            funcao: "Exibe armas disponíveis na loja",
            arquivo: "verLoja.js",
            descricao: "Mostra armas por rank. Use !arma 1 <rank> ou !arma 2 <rank> (1FP/2FP)",
            dependencias: ["../../core/database.js", "../../systems/economySystem.js"],
            ativo: true,
            categoria: "RPG"
        },
        {
            nome: "!comprar técnica [nome]",
            funcao: "Compra uma técnica usando Maestria (Força Interior)",
            arquivo: "comprarTecnica.js",
            descricao: "Compra técnicas da sua classe usando Maestria ganho por treino",
            dependencias: ["../../core/database.js"],
            ativo: true,
            categoria: "RPG"
        },
        {
            nome: "!treinar",
            funcao: "Realiza treino para ganhar Maestria (Força Interior)",
            arquivo: "treinar.js",
            descricao: "Ganha Maestria através de treinos, usado para comprar técnicas",
            dependencias: ["../../core/database.js"],
            ativo: true,
            categoria: "RPG"
        },
        {
            nome: "!maestria",
            funcao: "Explica a Maestria e mostra o saldo atual do jogador",
            arquivo: "treinar.js",
            descricao: "Explica como obter e usar Maestria, custos das técnicas, requisitos e comandos relacionados",
            dependencias: ["../../core/database.js"],
            ativo: true,
            categoria: "RPG"
        },
        // =====================================
        // SISTEMAS DO MUNDO
        // =====================================
        {
            nome: "!territorios",
            funcao: "Lista todos os territórios de Seul disponíveis",
            arquivo: "territorios.js",
            descricao: "Mostra territórios com valores, lucros semanais e donos atuais",
            dependencias: ["../../database/data/territorios.json"],
            ativo: true,
            categoria: "Mundo"
        },
        {
            nome: "!locais",
            funcao: "Lista locais especiais da Coreia do Sul",
            arquivo: "locais.js",
            descricao: "Mostra locais como Hallasan, Ilha das Memórias, Templos, etc",
            dependencias: ["../../database/data/locais.json"],
            ativo: true,
            categoria: "Mundo"
        },
        {
            nome: "!investimentos",
            funcao: "Lista investimentos disponíveis para guildas",
            arquivo: "investimentos.js",
            descricao: "Mostra opções de investimento em territórios com custos e buffs",
            dependencias: ["../../database/data/investimentos.json"],
            ativo: true,
            categoria: "Guilda"
        },
        {
            nome: "!mineracao",
            funcao: "Exibe o sistema de mineração em dungeons",
            arquivo: "mineracao.js",
            descricao: "Sistema de cristais, sorteios e premiações para mineradores",
            dependencias: ["Nenhuma"],
            ativo: true,
            categoria: "RPG"
        },
        {
            nome: "!arena",
            funcao: "Sistema de Arena PvP entre jogadores",
            arquivo: "arena.js",
            descricao: "Batalhas 1x1, regras, premiações por rank",
            dependencias: ["../../core/database.js"],
            ativo: true,
            categoria: "RPG"
        },
        {
            nome: "!fragmentos",
            funcao: "Sistema de Fragmentos dos Governantes",
            arquivo: "fragmentos.js",
            descricao: "Como se tornar um Fragmento, ranks, passivas e Skill Domínio",
            dependencias: ["Nenhuma"],
            ativo: true,
            categoria: "Poder"
        },
        {
            nome: "!governantes",
            funcao: "Lista os 16 Governantes disponíveis",
            arquivo: "governantes.js",
            descricao: "Mostra cada Governante, seu elemento e tema",
            dependencias: ["Nenhuma"],
            ativo: true,
            categoria: "Poder"
        },

        // =====================================
        // COMANDOS ADICIONAIS
        // =====================================
        {
            nome: "!admin / !adm / !+ / !- / !add / !rem",
            funcao: "Comandos administrativos de gerenciamento",
            arquivo: "admin.js",
            descricao: "Gerencia jogadores, classes, níveis e permissões. Requer privilégios de administrador.",
            dependencias: ["../../core/database.js", "../core/adminCore.js"],
            ativo: true,
            categoria: "Administrativo"
        },
        {
            nome: "!arquitetura",
            funcao: "Exibe sistema de arquitetura e construções",
            arquivo: "arquitetura.js",
            descricao: "Sistema de construção e gerenciamento de estruturas",
            dependencias: ["Nenhuma"],
            ativo: true,
            categoria: "Mundo"
        },
        {
            nome: "!bigorna",
            funcao: "Sistema de melhoramento de equipamentos",
            arquivo: "bigorna.js",
            descricao: "Melhora atributos de armas e armaduras",
            dependencias: ["Nenhuma"],
            ativo: true,
            categoria: "RPG"
        },
        {
            nome: "!caixa",
            funcao: "Sistema de caixas de recompensa",
            arquivo: "caixa.js",
            descricao: "Abrir caixas e ganhar itens aleatórios",
            dependencias: ["../../systems/diceSystem.js"],
            ativo: true,
            categoria: "RPG"
        },
        {
            nome: "!calcularbuff",
            funcao: "Calculadora de buffs e modificadores",
            arquivo: "calcularbuff.js",
            descricao: "Calcula bônus de atributos e efeitos",
            dependencias: ["Nenhuma"],
            ativo: true,
            categoria: "Ferramentas"
        },
        {
            nome: "!cargosa",
            funcao: "Sistema de cargas e capacidade",
            arquivo: "cargosa.js",
            descricao: "Gerencia carga máxima e penalidades",
            dependencias: ["Nenhuma"],
            ativo: true,
            categoria: "RPG"
        },
        {
            nome: "!dado",
            funcao: "Rolagem de dados",
            arquivo: "dado.js",
            descricao: "Rola dados de diferentes faces",
            dependencias: ["../../systems/diceSystem.js"],
            ativo: true,
            categoria: "Minigames"
        },
        {
            nome: "!dlc",
            funcao: "Conteúdo adicional e expansões",
            arquivo: "dlc.js",
            descricao: "Sistemas e conteúdos especiais",
            dependencias: ["Nenhuma"],
            ativo: true,
            categoria: "Informação"
        },
        {
            nome: "!encantamento",
            funcao: "Sistema de encantamentos",
            arquivo: "encantamento.js",
            descricao: "Adiciona efeitos mágicos a itens",
            dependencias: ["Nenhuma"],
            ativo: true,
            categoria: "RPG"
        },
        {
            nome: "!equipar titulo / !equipar título",
            funcao: "Equipa um título para o personagem",
            arquivo: "equiparTitulo.js",
            descricao: "Aplica título selecionado ao jogador",
            dependencias: ["../../core/database.js"],
            ativo: true,
            categoria: "Jogador"
        },
        {
            nome: "!fermentacao",
            funcao: "Sistema de fermentação e criação",
            arquivo: "fermentacao.js",
            descricao: "Cria itens através de fermentação",
            dependencias: ["Nenhuma"],
            ativo: true,
            categoria: "RPG"
        },
        {
            nome: "!guerra",
            funcao: "Sistema de guerras entre guildas",
            arquivo: "guerra.js",
            descricao: "Gerenciamento e execução de guerras",
            dependencias: ["../../core/database.js"],
            ativo: true,
            categoria: "Guilda"
        },
        {
            nome: "!hp",
            funcao: "Gerenciamento de HP e vida",
            arquivo: "hp.js",
            descricao: "Visualiza e gerencia pontos de vida",
            dependencias: ["Nenhuma"],
            ativo: true,
            categoria: "RPG"
        },
        {
            nome: "!materiais",
            funcao: "Sistema de materiais de crafting",
            arquivo: "materiais.js",
            descricao: "Lista e gerencia materiais",
            dependencias: ["Nenhuma"],
            ativo: true,
            categoria: "RPG"
        },
        {
            nome: "!membroa",
            funcao: "Gerenciamento de membros",
            arquivo: "membroa.js",
            descricao: "Adiciona/remove membros de guildas",
            dependencias: ["Nenhuma"],
            ativo: true,
            categoria: "Guilda"
        },
        {
            nome: "!minigames",
            funcao: "Sistema de minigames",
            arquivo: "minigames.js",
            descricao: "Jogos e entretenimento para jogadores",
            dependencias: ["../../systems/diceSystem.js", "../../systems/minigameSystem.js"],
            ativo: true,
            categoria: "Minigames"
        },
        {
            nome: "!monarcas",
            funcao: "Sistema de monarcas",
            arquivo: "monarcas.js",
            descricao: "Informações sobre os monarcas do RPG",
            dependencias: ["Nenhuma"],
            ativo: true,
            categoria: "Poder"
        },
        {
            nome: "!nucleos",
            funcao: "Sistema de núcleos de poder",
            arquivo: "nucleos.js",
            descricao: "Gerenciamento de núcleos e energias",
            dependencias: ["Nenhuma"],
            ativo: true,
            categoria: "Poder"
        },
        {
            nome: "!penalidade",
            funcao: "Sistema de penalidades",
            arquivo: "penalidade.js",
            descricao: "Visualiza e aplica penalidades",
            dependencias: ["Nenhuma"],
            ativo: true,
            categoria: "RPG"
        },
        {
            nome: "!pontuacao",
            funcao: "Sistema de pontuação",
            arquivo: "pontuacao.js",
            descricao: "Visualiza ranking e pontos",
            dependencias: ["Nenhuma"],
            ativo: true,
            categoria: "RPG"
        },
        {
            nome: "!portais",
            funcao: "Abre o menu de Portais e Dungeons",
            arquivo: "portais.js",
            descricao: "Reúne incursões, ficha de Dungeon, progressão, conclusão, escolhas e mineração",
            dependencias: ["Nenhuma"],
            ativo: true,
            categoria: "Mundo"
        },
        {
            nome: "!regeneracao",
            funcao: "Sistema de regeneração",
            arquivo: "regeneracao.js",
            descricao: "Recuperação de HP e mana",
            dependencias: ["Nenhuma"],
            ativo: true,
            categoria: "RPG"
        },
        {
            nome: "!submundo",
            funcao: "Sistema do submundo",
            arquivo: "submundo.js",
            descricao: "Área especial com desafios únicos",
            dependencias: ["Nenhuma"],
            ativo: true,
            categoria: "Mundo"
        },
        {
            nome: "!sucessores",
            funcao: "Sistema de sucessores",
            arquivo: "sucessores.js",
            descricao: "Gerenciamento de sucessores e herdeiros",
            dependencias: ["Nenhuma"],
            ativo: true,
            categoria: "RPG"
        },
        {
            nome: "!tecnicasClasse / !técnicasClasse",
            funcao: "Exibe técnicas de uma classe específica",
            arquivo: "tecnicasClasse.js",
            descricao: "Lista técnicas por classe inicial ou avançada",
            dependencias: ["../../tecnicas/iniciais/*.js", "../../tecnicas/avancadas/techniques.js"],
            ativo: true,
            categoria: "Informação"
        },
        {
            nome: "!token",
            funcao: "Sistema de tokens",
            arquivo: "token.js",
            descricao: "Moeda especial e sistema de tokens",
            dependencias: ["Nenhuma"],
            ativo: true,
            categoria: "Economia"
        },
        {
            nome: "!unicos",
            funcao: "Itens e sistemas únicos",
            arquivo: "unicos.js",
            descricao: "Conteúdo exclusivo e limitado",
            dependencias: ["Nenhuma"],
            ativo: true,
            categoria: "RPG"
        },
        // =====================================
        // NOVOS COMANDOS
        // =====================================
        {
            nome: "!saldo / !banco",
            funcao: "Exibe saldos do Banco Digital (Yulls) e Banco de Maestria",
            arquivo: "saldo.js",
            descricao: "Mostra Yulls (Won) e Maestria disponíveis. Use !saldo yulls ou !saldo maestria para detalhes.",
            dependencias: ["../../core/database.js"],
            ativo: true,
            categoria: "Jogador"
        },
        {
            nome: "!compra",
            funcao: "ADM registra compras da loja e gera ficha de compra",
            arquivo: "compra.js",
            descricao: "Registra compra: !compra Nome Item Preco. Lista: !compra listar @Nome. Cancela: !compra cancelar ID.",
            dependencias: ["../../core/database.js", "../core/adminCore.js"],
            ativo: true,
            categoria: "Administrativo"
        },
        {
            nome: "!minhas compras",
            funcao: "Jogador visualiza suas próprias compras registradas",
            arquivo: "compra.js",
            descricao: "Mostra histórico de compras do jogador com data, item e valor.",
            dependencias: ["../../core/database.js"],
            ativo: true,
            categoria: "Jogador"
        },
        {
            nome: "!avaliar rank <jogador> <rank>",
            funcao: "ADM concede rank ao jogador conforme requisitos de nível",
            arquivo: "avaliarRank.js",
            descricao: "Concede rank D (nvl15), C (nvl30), B (nvl60), A (nvl80) ou S (nvl100) com bônus automáticos.",
            dependencias: ["../../core/database.js", "../core/adminCore.js", "../../systems/levelSystem.js"],
            ativo: true,
            categoria: "Administrativo"
        },
        {
            nome: "!rank requisitos / !rank info",
            funcao: "Exibe requisitos de nível e bônus de cada rank",
            arquivo: "avaliarRank.js",
            descricao: "Mostra nível necessário e bônus (pontos + Won) para cada rank: E, D, C, B, A, S.",
            dependencias: ["../../systems/levelSystem.js"],
            ativo: true,
            categoria: "Informação"
        },
        // =====================================
        // SISTEMA DE DUNGEONS INSTANCIADAS
        // =====================================
        {
            nome: "!Desejar",
            funcao: "Sorteio semanal de Chave de Dungeon Instanciada (1 em 5 de chance)",
            arquivo: "desejar.js",
            descricao: "Sorteio semanal: 20% de chance de obter Chave de Dungeon. Cooldown semanal (reset segunda 00:01).",
            dependencias: ["../../core/database.js", "../../systems/dungeonInstanciadaSystem.js"],
            ativo: true,
            categoria: "Dungeon"
        },
        {
            nome: "!ficha de Dungeon",
            funcao: "Exibe a ficha da Dungeon Instanciada do jogador",
            arquivo: "fichaDungeon.js",
            descricao: "Mostra nome, descrição, tema, rank e participantes da dungeon. Copie e preencha com participantes.",
            dependencias: ["../../core/database.js", "../../systems/dungeonInstanciadaSystem.js"],
            ativo: true,
            categoria: "Dungeon"
        },
        {
            nome: "!concluir Dungeon",
            funcao: "Conclui a Dungeon Instanciada e valida participantes",
            arquivo: "concluirDungeon.js",
            descricao: "Reconhece ficha, valida participantes, rank e participação semanal. Aplica premiações gerais.",
            dependencias: ["../../core/database.js", "../../systems/dungeonInstanciadaSystem.js"],
            ativo: true,
            categoria: "Dungeon"
        },
        {
            nome: "!Escolho a opção número X",
            funcao: "Escolhe um prêmio extra da Dungeon Instanciada",
            arquivo: "escolherPremio.js",
            descricao: "Participantes escolhem prêmios extras (XP, Wons, Atributos, Maestria, Itens Misteriosos). Cada prêmio 1x por uso.",
            dependencias: ["../../core/database.js", "../../systems/dungeonInstanciadaSystem.js"],
            ativo: true,
            categoria: "Dungeon"
        },
        {
            nome: "!abrir dungeon",
            funcao: "Sorteia uma Dungeon da database baseada no rank da chave",
            arquivo: "abrirDungeon.js",
            descricao: "Sorteia aleatoriamente uma dungeon da database (700 masmorras) e vincula à chave do jogador.",
            dependencias: ["../../core/database.js", "../../systems/dungeonInstanciadaSystem.js", "../../systems/dungeonDatabaseLoader.js"],
            ativo: true,
            categoria: "Dungeon"
        },
        {
            nome: "!catalogo forja",
            funcao: "ADM verifica todos os comandos registrados e seus status",
            arquivo: "catalogoForja.js",
            descricao: "Exibe catálogo de itens forjados com Ligas e Materiais x Núcleos",
            dependencias: ["../../systems/forjaSystem.js"],
            ativo: true,
            categoria: "RPG"
        },
        {
            nome: "!ia [texto]",
            funcao: "Envia texto para a IA local (Ollama/Qwen) e retorna a resposta",
            arquivo: "ia.js",
            descricao: "Comando de teste para integração com IA via Ollama. Exemplo: !ia Olá",
            dependencias: ["../../ia/ollama.js"],
            ativo: true,
            categoria: "IA"
        },
        {
            nome: "!npc",
            funcao: "Explica o sistema narrativo de NPCs e como realizar cenas",
            arquivo: "npc.js",
            descricao: "Guia de memória, relacionamento, início, continuação e encerramento de interações com NPCs",
            dependencias: ["../../npc/interactionManager.js", "../../npc/conversationManager.js"],
            ativo: true,
            categoria: "Mundo"
        },
        {
            nome: "!peatz",
            funcao: "Abre o menu comercial apresentado por Peatz",
            arquivo: "peatz.js",
            descricao: "Apresenta as seções Skills, Loja Virtual e Drops",
            dependencias: [],
            ativo: true,
            categoria: "Economia"
        },
        {
            nome: "!ascensão",
            funcao: "Abre o menu de crescimento e evolução do jogador",
            arquivo: "ascensao.js",
            descricao: "Reúne progresso, penalidade, histórico, Classe Avançada, informações de rank e locais",
            dependencias: [],
            ativo: true,
            categoria: "Jogador"
        },
        {
            nome: "!associações",
            funcao: "Abre o menu de associações e organizações do mundo",
            arquivo: "associacoes.js",
            descricao: "Reúne guildas, ranks, membros, cargos, investimentos, guerras, MVP, Submundo e territórios",
            dependencias: [],
            ativo: true,
            categoria: "Mundo"
        },
        {
            nome: "!biblioteca",
            funcao: "Abre o menu de conhecimento e sistemas do RPG",
            arquivo: "biblioteca.js",
            descricao: "Reúne atributos, únicos, estilos de luta, passivas, títulos e Portais",
            dependencias: [],
            ativo: true,
            categoria: "Informação"
        },
        {
            nome: "!história",
            funcao: "Abre o menu narrativo de história e acontecimentos",
            arquivo: "historia.js",
            descricao: "Reúne missões, fragmentos, Monarcas, Governantes e Sucessores",
            dependencias: [],
            ativo: true,
            categoria: "Mundo"
        },
        {
            nome: "!acervo",
            funcao: "Abre o menu de personagens e relações do mundo",
            arquivo: "acervo.js",
            descricao: "Reúne amizade, missões de NPC, guia e listagem de NPCs, presentes e sistemas extras",
            dependencias: [],
            ativo: true,
            categoria: "Mundo"
        },
        {
            nome: "!skills",
            funcao: "Abre o menu de habilidades e técnicas do jogador",
            arquivo: "skills.js",
            descricao: "Reúne Maestria, Técnicas e consulta de Técnicas por classe",
            dependencias: [],
            ativo: true,
            categoria: "Poder"
        },
        {
            nome: "!loja virtual",
            funcao: "Abre o menu da loja virtual",
            arquivo: "lojaVirtual.js",
            descricao: "Reúne loja, itens, saldo, histórico de compras e indicação da futura DLC",
            dependencias: [],
            ativo: true,
            categoria: "Economia"
        },
        {
            nome: "!drops",
            funcao: "Abre o menu de recursos obtidos em batalhas e Dungeons",
            arquivo: "drops.js",
            descricao: "Reúne Núcleos, Materiais, lojas de recursos e Caixas",
            dependencias: [],
            ativo: true,
            categoria: "Economia"
        },
        {
            nome: "!listar npcs",
            funcao: "Lista todos os 75 NPCs carregados pelo sistema",
            arquivo: "listarNpcs.js",
            descricao: "Organiza os NPCs por categoria e apresenta nome, localização e comando individual",
            dependencias: ["../../npc/npcManager.js"],
            ativo: true,
            categoria: "Mundo"
        },
        {
            nome: "!ler história",
            funcao: "Abre o canal da história oficial do RPG",
            arquivo: "lerHistoria.js",
            descricao: "Apresenta o canal oficial onde prólogos, episódios e acontecimentos são publicados",
            dependencias: [], ativo: true, categoria: "Mundo"
        },
        {
            nome: "!dungeon semanal / !consultar dungeon semanal",
            funcao: "Consulta a Dungeon Semanal liberada",
            arquivo: "consultarDungeonSemanal.js",
            descricao: "Mostra tema, Rank, objetivos, regras, duração e recompensas da incursão semanal",
            dependencias: ["../../systems/weeklyDungeonSystem.js"], ativo: true, categoria: "Dungeon"
        },
        {
            nome: "!excluir item <nome> confirmar",
            funcao: "Remove um item do inventário do próprio jogador",
            arquivo: "excluirItem.js",
            descricao: "Exige nome completo e confirmação explícita antes de remover o vínculo do inventário",
            dependencias: [], ativo: true, categoria: "Jogador"
        }
    ];

    return comandos;
}

module.exports = { registrarTodosComandos };
