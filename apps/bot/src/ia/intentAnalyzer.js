/**
 * ==========================================================
 * INTENT ANALYZER
 * ==========================================================
 *
 * Responsável por identificar automaticamente o tipo de mensagem
 * enviada pelo jogador, classificando-a em categorias como:
 *
 * - Conversação (cumprimento, despedida, casual, agradecimento)
 * - RPG (combate, missão, exploração, comércio, crafting...)
 * - NPC (personalidade, emoções, relacionamentos, romance...)
 * - História (passado, lore, guerras, política, facções...)
 * - Estratégia (planejamento, tática, investigação...)
 * - Filosofia (ética, moral, dilemas, opiniões...)
 * - Eventos Especiais (Boss, Evento Mundial, Julgamentos...)
 *
 * Princípios SOLID:
 * - Single Responsibility: apenas analisa intenções
 * - Open/Closed: novas categorias via configuração
 * - Dependency Injection: recebe configuração externa
 *
 * Este módulo NÃO decide se deve usar thinking.
 * Ele apenas classifica a mensagem.
 */

const fs = require('fs');
const path = require('path');

/**
 * ==========================================================
 * BASE DE CONHECIMENTO DE INTENÇÕES
 * ==========================================================
 *
 * Cada categoria possui palavras-chave, expressões e padrões
 * que ajudam a identificar a intenção do jogador.
 *
 * A pontuação é acumulativa: quanto mais evidências, maior
 * a confiança na categoria.
 */

const INTENCOES = {
    // ==========================================
    // CONVERSAÇÃO
    // ==========================================
    cumprimento: {
        categoria: 'cumprimento',
        grupo: 'conversacao',
        peso: 0,
        palavras: [
            'oi', 'ola', 'olá', 'eai', 'e aí', 'e ai', 'opa', 'salve',
            'bom dia', 'boa tarde', 'boa noite', 'hey', 'hello', 'hi',
            'bem vindo', 'bem-vindo', 'sou novo', 'cheguei'
        ],
        padroes: [/^(oi|ola|olá)\b/i, /^(bom dia|boa tarde|boa noite)\b/i]
    },

    despedida: {
        categoria: 'despedida',
        grupo: 'conversacao',
        peso: 0,
        palavras: [
            'tchau', 'adeus', 'até logo', 'ate logo', 'até mais', 'ate mais',
            'até amanhã', 'ate amanha', 'já vou', 'vou indo', 'preciso ir',
            'fui', 'flw', 'falou', 'nos vemos', 'te vejo depois'
        ],
        padroes: [/^(tchau|adeus)\b/i, /^(até logo|ate logo|até mais|ate mais)\b/i]
    },

    conversaCasual: {
        categoria: 'conversaCasual',
        grupo: 'conversacao',
        peso: 5,
        palavras: [
            'como vai', 'tudo bem', 'como você está', 'como voce esta',
            'que novidade', 'o que tem feito', 'como foi', 'e você', 'e voce',
            'tem novidades', 'me conta', 'conta ai', 'conta aí',
            'como está', 'como esta', 'está tudo', 'esta tudo',
            'tá bem', 'ta bem', 'tô bem', 'to bem'
        ],
        padroes: [
            /^(como vai|como você está|como voce esta)\b/i,
            /^(tudo bem|tudo bom)\b/i,
            /^(e você|e voce)\b/i
        ]
    },

    agradecimento: {
        categoria: 'agradecimento',
        grupo: 'conversacao',
        peso: 5,
        palavras: [
            'obrigado', 'obrigada', 'valeu', 'agradeço', 'agradeco',
            'muito obrigado', 'muito obrigada', 'grato', 'grata',
            'obrigadão', 'obrigadao', 'thanks', 'thank you'
        ],
        padroes: [/^(obrigado|obrigada|valeu|grato|grata)\b/i]
    },

    brincadeiras: {
        categoria: 'brincadeiras',
        grupo: 'conversacao',
        peso: 10,
        palavras: [
            'kkk', 'kkkk', 'haha', 'hehe', 'rsrs', 'hue', 'cara',
            'zoeira', 'brincadeira', 'zuando', 'meme', 'piada',
            'engraçado', 'engracado', 'divertido', 'rindo'
        ],
        padroes: [/k{2,}/i, /h+a+h+a+/i, /kkkk/i]
    },

    // ==========================================
    // RPG
    // ==========================================
    combate: {
        categoria: 'combate',
        grupo: 'rpg',
        peso: 15,
        palavras: [
            'atacar', 'lutar', 'batalha', 'combate', 'golpe', 'espada',
            'lâmina', 'lamina', 'magia', 'feitiço', 'feitico', 'poder',
            'inimigo', 'monstro', 'criatura', 'dungeon', 'masmorra',
            'matar', 'derrotar', 'vencer', 'enfrentar', 'lutar contra',
            'guerreiro', 'barbaro', 'atacan', 'defender', 'esquivar'
        ],
        padroes: [
            /(quero|vou|preciso) (atacar|lutar|enfrentar)/i,
            /(vencer|derrotar|matar) (o|a|os|as) (monstro|inimigo|chefe|boss)/i
        ]
    },

    missao: {
        categoria: 'missao',
        grupo: 'rpg',
        peso: 25,
        palavras: [
            'missão', 'missao', 'quest', 'tarefa', 'pedido', 'favor',
            'aceito', 'aceitar', 'recusar', 'concluir', 'completar',
            'objetivo', 'qual missão', 'qual missao', 'nova missão',
            'nova missao', 'tenho uma missão', 'tenho uma missao',
            'posso ajudar', 'o que precisa', 'preciso de você', 'preciso de voce'
        ],
        padroes: [
            /(aceito|aceitar) (a|a)?\s*(missão|missao)/i,
            /(qual|quais) (é|e) (a|minha) (missão|missao)/i,
            /(tenho|recebi|ganhei) (uma|nova) (missão|missao)/i
        ]
    },

    exploracao: {
        categoria: 'exploracao',
        grupo: 'rpg',
        peso: 15,
        palavras: [
            'explorar', 'exploração', 'exploracao', 'como chego',
            'onde fica', 'para onde', 'ir para', 'caminho', 'mapa',
            'região', 'regiao', 'lugar', 'mundo', 'cidade',
            'vila', 'portal', 'entrada', 'saída', 'saida',
            'gruta', 'floresta', 'montanha', 'deserto', 'ruínas', 'ruinas',
            'o que tem ali', 'quero conhecer', 'me mostre'
        ],
        padroes: [
            /(onde|como) (fica|chego|vou|ir) (para|ate|até)?/i,
            /(quero|vamos|vou) (explorar|conhecer|visitar)/i
        ]
    },

    comercio: {
        categoria: 'comercio',
        grupo: 'rpg',
        peso: 15,
        palavras: [
            'comprar', 'vender', 'preço', 'preco', 'quanto custa',
            'loja', 'mercador', 'negociar', 'troca', 'barganha',
            'moedas', 'ouro', 'dinheiro', 'pagamento', 'pagar',
            'item', 'itens', 'equipamento', 'arma', 'armadura',
            'poção', 'pocao', 'poções', 'pocoes', 'ferreiro', 'mercadoria'
        ],
        padroes: [
            /(quero|posso) (comprar|vender|negociar)/i,
            /(quanto|custa|preço|preco) (é|e|custa)/i
        ]
    },

    crafting: {
        categoria: 'crafting',
        grupo: 'rpg',
        peso: 20,
        palavras: [
            'forjar', 'crafitar', 'craft', 'criar item', 'fabricar',
            'melhorar', 'upar', 'evoluir arma', 'refinar', 'encantar',
            'materiais', 'recipe', 'receita', 'pedra', 'runas',
            'ferreiro', 'forja', 'artesão', 'artesao', 'alquimista'
        ],
        padroes: [
            /(quero|posso|vou) (forjar|crafitar|fabricar|melhorar)/i,
            /(como|o que) (eu )?preciso para (forjar|criar|fazer)/i
        ]
    },

    evolucao: {
        categoria: 'evolucao',
        grupo: 'rpg',
        peso: 30,
        palavras: [
            'evoluir', 'evolução', 'evolucao', 'subir de nível', 'subir de nivel',
            'upar', 'nivelar', 'nivel', 'nível', 'level', 'despertar',
            'ascender', 'ascensão', 'ascensao', 'força nova', 'forca nova',
            'poder novo', 'classe avançada', 'classe avancada', 'skills',
            'habilidades novas', 'técnicas novas', 'tecnicas novas'
        ],
        padroes: [
            /(quero|preciso|como) (evoluir|upar|despertar)/i,
            /(qual|o que) (é|e) (meu|minha) (próximo|proximo) (nível|nivel|passo)/i
        ]
    },

    inventario: {
        categoria: 'inventario',
        grupo: 'rpg',
        peso: 15,
        palavras: [
            'inventário', 'inventario', 'bolsa', 'mochila', 'itens',
            'meus itens', 'equipamentos', 'minhas armas', 'minhas poções',
            'pocoes', 'poções', 'to equipado', 'estou equipado',
            'qual minha arma', 'o que eu tenho'
        ],
        padroes: [
            /(meu|meus|minha|minhas) (inventário|inventario|itens|equipamentos)/i,
            /(o que|quais) (eu|tenho|possou)/i
        ]
    },

    // ==========================================
    // NPC (PESSOAL / RELACIONAMENTO)
    // ==========================================
    personalidade: {
        categoria: 'personalidade',
        grupo: 'npc',
        peso: 15,
        palavras: [
            'quem é você', 'quem e voce', 'me fale de você', 'me fale de voce',
            'sobre você', 'sobre voce', 'sua história', 'sua historia',
            'qual sua origem', 'de onde você vem', 'de onde voce vem',
            'você é', 'voce e', 'o que você é', 'o que voce e',
            'seu nome', 'você gosta', 'voce gosta', 'qual sua'
        ],
        padroes: [
            /(quem|o que) (é|e) você/,
            /(me fale|me conta|conte) (sobre|de) (você|voce)/,
            /(de onde|qual) (você|voce) (vem|e|é)/
        ]
    },

    emocao: {
        categoria: 'emocao',
        grupo: 'npc',
        peso: 10,
        palavras: [
            'como você se sente', 'como voce se sente', 'está sentindo',
            'esta sentindo', 'feliz', 'triste', 'com raiva', 'chateado',
            'preocupado', 'animado', 'aliviado', 'orgulhoso', 'com medo',
            'o que você sente', 'o que voce sente', 'seu sentimento',
            'está bem', 'esta bem', 'tá tudo certo', 'ta tudo certo'
        ],
        padroes: [
            /(como|o que) (você|voce) (sente|se sente|esta sentindo|está sentindo)/i
        ]
    },

    sentimentos: {
        categoria: 'sentimentos',
        grupo: 'npc',
        peso: 35,
        palavras: [
            'sentimento', 'sentimentos', 'coração', 'coracao', 'alma',
            'emoção', 'emocao', 'emoções', 'emocoes', 'felicidade',
            'tristeza', 'raiva', 'medo', 'amor', 'ódio', 'odio',
            'saudade', 'esperança', 'esperanca', 'dor', 'sofrimento'
        ],
        padroes: [
            /(o que|como) (você|voce) (sente|se sente|pensa) (sobre|de)/i
        ]
    },

    relacionamento: {
        categoria: 'relacionamento',
        grupo: 'npc',
        peso: 35,
        palavras: [
            'nosso relacionamento', 'nossa amizade', 'você confia em mim',
            'voce confia em mim', 'você gosta de mim', 'voce gosta de mim',
            'somos amigos', 'posso confiar em você', 'posso confiar em voce',
            'você me considera', 'voce me considera', 'o que você acha de mim',
            'o que voce acha de mim', 'como você me vê', 'como voce me ve',
            'somos próximos', 'somos proximos',
            'você matou', 'voce matou', 'você mataria', 'voce mataria',
            'você traiu', 'voce traiu', 'você trairia', 'voce trairia',
            'você mentiu', 'voce mentiu', 'você mentiria', 'voce mentiria'
        ],
        padroes: [
            /(você|voce) (confia|gosta|considera) (em)?\s*(mim|eu)/i,
            /(somos|eu e você|eu e voce) (amigos|próximos|proximos)/i,
            /(o que|como) (você|voce) (acha|pensa|ve|vê) (de|sobre) (mim|eu)/i,
            /(você|voce) (matou|mataria|traiu|trairia|mentiu|mentiria)/i
        ]
    },

    confianca: {
        categoria: 'confianca',
        grupo: 'npc',
        peso: 40,
        palavras: [
            'confiar', 'confiança', 'confianca', 'confio', 'confia',
            'segredo', 'guardar segredo', 'pode guardar', 'acreditar',
            'fidelidade', 'lealdade', 'enganar', 'mentir', 'trair',
            'traição', 'traicao', 'honestidade'
        ],
        padroes: [
            /(posso|você pode|voce pode) (confiar|acreditar)/i,
            /(você|voce) (vai|iria) (me )?(trair|enganar|mentir)/i
        ]
    },

    romance: {
        categoria: 'romance',
        grupo: 'npc',
        peso: 45,
        palavras: [
            'te amo', 'eu te amo', 'me apaixonei', 'gosto de você',
            'gosto de voce', 'você me ama', 'voce me ama', 'namorar',
            'namoro', 'casar', 'casamento', 'beijar', 'beijo',
            'paixão', 'paixao', 'romance', 'sentimento por você',
            'sentimento por voce', 'estou apaixonado', 'estou apaixonada',
            'quer ficar comigo', 'meu amor', 'querida', 'querido'
        ],
        padroes: [
            /(eu )?(te|ti) amo/i,
            /(você|voce) (me )?(ama|quer|aceita)/i,
            /(quero|gostaria) (namorar|ficar|casar) (com você|com voce)/i
        ]
    },

    amizade: {
        categoria: 'amizade',
        grupo: 'npc',
        peso: 35,
        palavras: [
            'amigo', 'amiga', 'amizade', 'melhor amigo', 'melhor amiga',
            'companheiro', 'companheira', 'parceiro', 'parceira',
            'podemos ser amigos', 'quer ser meu amigo', 'somos amigos',
            'você é meu amigo', 'voce e meu amigo', 'conte comigo'
        ],
        padroes: [
            /(quer|vamos|podemos) (ser|fazer) (amigos|amizade)/i,
            /(você|voce) (é|e) (meu|minha) (amigo|amiga)/i
        ]
    },

    // ==========================================
    // HISTÓRIA
    // ==========================================
    passado: {
        categoria: 'passado',
        grupo: 'historia',
        peso: 50,
        palavras: [
            'passado', 'antes', 'antigamente', 'há muito tempo', 'ha muito tempo',
            'o que houve', 'o que aconteceu', 'memória', 'memoria',
            'lembra', 'lembra-se', 'recorda', 'flashback', 'infância', 'infancia',
            'jovem', 'quando era', 'naquela época', 'naquela epoca',
            'desde quando', 'como tudo começou', 'como tudo comecou',
            'conte sua história', 'conte sua historia',
            'me conte sua história', 'me conte sua historia',
            'me conta sua história', 'me conta sua historia',
            'sua história', 'sua historia', 'sua origem'
        ],
        padroes: [
            /(qual|o que) (foi|era|aconteceu) (o|no|na) (passado|antes)/i,
            /(você|voce) (se )?lembra (de|do|da|quando)/i,
            /(conte|me conte|me conta) (sua|seu|tua|sua) (história|historia|infância|infancia|passado|origem)/i,
            /(conte|me conte|me conta) (sobre|de) (sua|seu) (história|historia|infância|infancia|passado|origem)/i
        ]
    },

    lore: {
        categoria: 'lore',
        grupo: 'historia',
        peso: 50,
        palavras: [
            'lore', 'conhecimento', 'saber', 'história do mundo', 'historia do mundo',
            'como funciona', 'qual a origem', 'o que é', 'o que sao', 'o que são',
            'me explique', 'me explica', 'explica', 'explicar', 'conhecimento antigo',
            'o que existe', 'quem são', 'quem sao', 'sobre o mundo'
        ],
        padroes: [
            /(me |pode )?(explicar|explica|explique) (sobre|de|como|por que)/i,
            /(qual|o que|quem) (é|e|são|sao|existe) (no|neste|nesse|aqui)/i
        ]
    },

    acontecimentos: {
        categoria: 'acontecimentos',
        grupo: 'historia',
        peso: 50,
        palavras: [
            'aconteceu', 'acontecimento', 'o que houve', 'o que está acontecendo',
            'o que esta acontecendo', 'notícias', 'noticias', 'novidades',
            'evento', 'situação', 'situacao', 'rumor', 'boato', 'fofoca',
            'comentam', 'dizem', 'disseram', 'falaram', 'recente'
        ],
        padroes: [
            /(o que|o que) (houve|aconteceu|está acontecendo|esta acontecendo)/i,
            /(tem|há|ha) (alguma|uma) (novidade|noticia|notícia|rumor)/i
        ]
    },

    guerra: {
        categoria: 'guerra',
        grupo: 'historia',
        peso: 55,
        palavras: [
            'guerra', 'batalha', 'conflito', 'invasão', 'invasao',
            'exército', 'exercito', 'soldados', 'frente de batalha',
            'guerreiro', 'estrategista', 'campo de batalha', 'cerco',
            'rebelião', 'rebeliao', 'revolta', 'conquista'
        ],
        padroes: [
            /(sobre|conte|o que houve) (a|na|nessa) (guerra|batalha|invasão|invasao)/i,
            /(quem|como|por que|porque) (venceu|perdeu|ganhou) (a|essa|esta) (guerra|batalha)/i
        ]
    },

    politica: {
        categoria: 'politica',
        grupo: 'historia',
        peso: 55,
        palavras: [
            'política', 'politica', 'governo', 'rei', 'rainha', 'imperador',
            'imperatriz', 'nobreza', 'lorde', 'senhor', 'assembleia',
            'conselho', 'coroa', 'trono', 'reino', 'reinado', 'sucessão',
            'sucessao', 'herdeiro', 'linhagem', 'corte', 'diplomacia'
        ],
        padroes: [
            /(quem|como|o que) (governa|comanda|lidera) (este|esse|aqui|o)/i,
            /(sobre|conte|fale) (da|de) (política|politica|coroa|reino)/i
        ]
    },

    faccoes: {
        categoria: 'faccoes',
        grupo: 'historia',
        peso: 50,
        palavras: [
            'facção', 'faccao', 'guilda', 'clã', 'cla', 'aliança', 'alianca',
            'ordem', 'seita', 'grupo', 'esquadrão', 'esquadrao', 'tribo',
            'organização', 'organizacao', 'grupo secreto', 'sociedade',
            'confraria', 'irmandade', 'legião', 'legiao'
        ],
        padroes: [
            /(sobre|conte|fale) (da|das|do|dos) (facção|faccao|guilda|clã|cla|ordem)/i,
            /(a qual|qual) (facção|faccao|guilda|clã|cla|ordem) (você|voce) (pertence|faz parte)/i
        ]
    },

    reinos: {
        categoria: 'reinos',
        grupo: 'historia',
        peso: 50,
        palavras: [
            'reino', 'reinos', 'domínio', 'dominio', 'território', 'territorio',
            'fronteira', 'província', 'provincia', 'região', 'regiao',
            'cidade', 'capital', 'vila', 'aldeia', 'templo', 'castelo',
            'quem governa', 'raio', 'poder do reino'
        ],
        padroes: [
            /(sobre|conte|fale) (do|dos|de) (reino|reinos|domínio|dominio)/i,
            /(qual|quais) (são|sao|existem) (os|as) (reinos|domínios|dominios|regiões|regioes)/i
        ]
    },

    // ==========================================
    // ESTRATÉGIA
    // ==========================================
    planejamento: {
        categoria: 'planejamento',
        grupo: 'estrategia',
        peso: 50,
        palavras: [
            'plano', 'planejar', 'planejamento', 'estratégia', 'estrategia',
            'tática', 'tatica', 'como devo', 'o que devo fazer', 'qual melhor',
            'qual o melhor', 'me aconselhe', 'me oriente', 'me guie',
            'qual caminho', 'o que você faria', 'o que voce faria',
            'como eu procedo', 'o que sugere', 'me dê uma ideia', 'me de uma ideia',
            'o que fazer', 'como agir', 'como proceder', 'me diga o que fazer'
        ],
        padroes: [
            /(me |você pode |voce pode )?(aconselhar|orientar|guiar|ajudar)/i,
            /(qual|como) (seria|devo|posso|posso) (o melhor|a melhor|proceder|agir|fazer)/i,
            /(o que|qual) (você|voce) (faria|sugere|recomenda|aconselha)/i,
            /(o que|como) (devo|posso|eu devo|eu posso) (fazer|agir|proceder|decidir|resolver)/i
        ]
    },

    tatica: {
        categoria: 'tatica',
        grupo: 'estrategia',
        peso: 50,
        palavras: [
            'tática', 'tatica', 'estratégia', 'estrategia', 'emboscada',
            'armadilha', 'flamejante', 'flanco', 'costas', 'fraqueza',
            'ponto fraco', 'como lutar', 'como vencer', 'como derrotar',
            'atrair', 'distrair', 'recuar', 'avançar', 'avancar',
            'posição', 'posicao', 'formação', 'formacao', 'cerco'
        ],
        padroes: [
            /(como) (eu )?(luto|lutaria|venço|venco|derroto|enfrento)/i,
            /(qual|o que) (é|e) (a) (melhor|melhor) (tática|tatica|estratégia|estrategia)/i
        ]
    },

    investigacao: {
        categoria: 'investigacao',
        grupo: 'estrategia',
        peso: 65,
        palavras: [
            'investigar', 'investigação', 'investigacao', 'investigador',
            'pista', 'evidência', 'evidencia', 'indício', 'indicio',
            'procurar', 'buscar', 'descobrir', 'desvendar', 'solucionar',
            'resolver', 'suspeito', 'perguntar', 'interrogar',
            'quem é o culpado', 'quem foi', 'descobriu', 'encontrar'
        ],
        padroes: [
            /(quero|preciso|vamos) (investigar|descobrir|desvendar|solucionar|resolver)/i,
            /(quem|o que|por que|porque|como) (fez|matou|roubou|trouxer)/i
        ]
    },

    resolucaoProblemas: {
        categoria: 'resolucaoProblemas',
        grupo: 'estrategia',
        peso: 45,
        palavras: [
            'problema', 'resolver', 'solução', 'solucao', 'como resolver',
            'o que fazer', 'socorro', 'ajuda', 'não sei', 'nao sei',
            'estou perdido', 'me ajude', 'me ajuda', 'sair dessa',
            'encrenca', 'apuros', 'dificuldade', 'complicado'
        ],
        padroes: [
            /(me )?(ajuda|ajude|socorro|salve)/i,
            /(não|nao) (sei|consigo) (o que|como) (fazer|resolver|sair)/i
        ]
    },

    // ==========================================
    // FILOSOFIA
    // ==========================================
    etica: {
        categoria: 'etica',
        grupo: 'filosofia',
        peso: 60,
        palavras: [
            'ético', 'etica', 'ético', 'certo', 'errado', 'correto',
            'moralmente', 'princípios', 'principios', 'código', 'codigo',
            'honra', 'justiça', 'justica', 'injusto', 'imoral',
            'aceitável', 'aceitavel', 'permitido', 'proibido'
        ],
        padroes: [
            /(é|e) (certo|errado|ético|etico|moral) (fazer|matar|roubar|mentir|trair)/i,
            /(o que|qual) (você|voce) (acha|pensa) (sobre|de) (ética|etica|moral|honra)/i
        ]
    },

    moral: {
        categoria: 'moral',
        grupo: 'filosofia',
        peso: 60,
        palavras: [
            'moral', 'moralidade', 'consciência', 'consciencia', 'dever',
            'obrigação', 'obrigacao', 'culpa', 'remorso', 'arrependimento',
            'perdão', 'perdao', 'redenção', 'redencao', 'sacrifício', 'sacrificio'
        ],
        padroes: [
            /(o que|qual) (é|e) (certo|errado|justo|moral) (aqui|nessa situação|nessa situacao)/i,
            /(você|voce) (teria|faria) (feito|matado|mentido|traído|traido)/i
        ]
    },

    dilema: {
        categoria: 'dilema',
        grupo: 'filosofia',
        peso: 60,
        palavras: [
            'dilema', 'escolha difícil', 'escolha dificil', 'decidir',
            'decidir entre', 'alternativa', 'qual escolho',
            'entre duas', 'não sei escolher', 'nao sei escolher',
            'preciso escolher', 'preciso decidir', 'o que é melhor',
            'ou isso ou aquilo', 'escolher entre', 'decisão difícil', 'decisao dificil'
        ],
        padroes: [
            /(não|nao) (sei|consigo) (escolher|decidir)/i,
            /(qual|o que|como) (escolho|devo escolher|devo decidir|decido)/i,
            /(entre|escolher entre) (a|as|o|os)?\s*(salvar|proteger|matar|trair|ajudar)/i
        ]
    },

    opniao: {
        categoria: 'opniao',
        grupo: 'filosofia',
        peso: 50,
        palavras: [
            'opinião', 'opiniao', 'você acha', 'voce acha', 'você pensa',
            'voce pensa', 'o que você acha', 'o que voce acha',
            'qual sua opinião', 'qual sua opiniao', 'me dê sua opinião',
            'me de sua opiniao', 'você concorda', 'voce concorda',
            'concorda', 'discorda', 'na sua visão', 'na sua visao'
        ],
        padroes: [
            /(o que|qual|como) (você|voce) (acha|pensa|vê|ve|enxerga)/i,
            /(você|voce) (concorda|discorda) (com|que)/i
        ]
    },

    // ==========================================
    // EVENTOS ESPECIAIS
    // ==========================================
    boss: {
        categoria: 'boss',
        grupo: 'eventosEspeciais',
        peso: 90,
        palavras: [
            'boss', 'chefe', 'criatura lendária', 'criatura lendaria',
            'monstro supremo', 'dragão', 'dragao', 'leviatã', 'leviata',
            'rei das dungeons', 'monarca', 'soberano', 'devorador',
            'ameaça suprema', 'ameaca suprema', 'inimigo colossal',
            'deus', 'deusa', 'semi-deus', 'semideus'
        ],
        padroes: [
            /(tem|existe|apareceu|é|e) (um|uma) (boss|chefe|dragão|dragao|deus|monarca)/i,
            /(vamos|precisamos|quero) (enfrentar|derrotar|matar) (o|a) (boss|chefe|dragão|dragao|monarca)/i
        ]
    },

    eventoMundial: {
        categoria: 'eventoMundial',
        grupo: 'eventosEspeciais',
        peso: 80,
        palavras: [
            'evento mundial', 'catástrofe', 'catastrofe', 'portal enorme',
            'apocalipse', 'colapso', 'mudança no mundo', 'mudanca no mundo',
            'anomalia', 'fenômeno', 'fenomeno', 'grande acontecimento',
            'armagedom', 'tragédia', 'tragedia', 'cataclisma'
        ],
        padroes: [
            /(o que|qual) (é|e) (esse|este) (evento|fenômeno|fenomeno|portal)/i,
            /(algo|coisa) (terrível|terrivel|estranho|diferente) (está|esta) (acontecendo|havendo)/i
        ]
    },

    missaoPrincipal: {
        categoria: 'missaoPrincipal',
        grupo: 'eventosEspeciais',
        peso: 75,
        palavras: [
            'missão principal', 'missao principal', 'destino', 'profecia',
            'escolhido', 'heroi', 'herói', 'salvar o mundo', 'salvar a todos',
            'fim dos tempos', 'começo do fim', 'comeco do fim', 'jornada',
            'chamado', 'propósito final', 'proposito final'
        ],
        padroes: [
            /(qual|o que) (é|e) (a|minha|nossa) (missão|missao) (principal|final|verdadeira)/i,
            /(preciso|devemos|temos) (salvar|proteger|enfrentar) (o mundo|todos|o destino)/i
        ]
    },

    julgamento: {
        categoria: 'julgamento',
        grupo: 'eventosEspeciais',
        peso: 85,
        palavras: [
            'julgamento', 'julgar', 'julgue', 'tribunal', 'sentença', 'sentenca',
            'condenar', 'absolver', 'veredito', 'meritório', 'meritorio',
            'culpado', 'inocente', 'júri', 'juri', 'juiz'
        ],
        padroes: [
            /(você|voce) (me )?(julga|condena|absolve)/i,
            /(qual|o que|como) (é|e) (seu) (julgamento|veredito|sentença|sentenca)/i
        ]
    },

    escolhaPermanente: {
        categoria: 'escolhaPermanente',
        grupo: 'eventosEspeciais',
        peso: 85,
        palavras: [
            'escolha permanente', 'decidir para sempre', 'sem volta',
            'não tem volta', 'nao tem volta', 'irreversível', 'irreversivel',
            'para sempre', 'marco', 'decisão final', 'decisao final',
            'nunca mais', 'consequência permanente', 'consequencia permanente'
        ],
        padroes: [
            /(essa|esta|essa) (escolha|decisão|decisao) (é|e) (permanente|irreversível|irreversivel|para sempre)/i,
            /(se) (eu )?(fizer|escolher|decidir) (isso|isto) (não|nao) (tem|terá|tera) (volta|jeito)/i
        ]
    }
};

/**
 * ==========================================================
 * INTENT ANALYZER
 * ==========================================================
 *
 * Classe principal que analisa a mensagem do jogador
 * e determina a intenção predominante.
 */

class IntentAnalyzer {
    constructor() {
        this.versoes = {
            normal: this._normalizarTexto,
            removidoAcentos: this._removerAcentos
        };
    }

    /**
     * Analisa a mensagem e retorna a intenção predominante
     *
     * @param {string} mensagem - Mensagem do jogador
     * @returns {Object} Resultado da análise de intenção
     */
    analisar(mensagem) {
        const inicio = Date.now();

        if (!mensagem || typeof mensagem !== 'string' || mensagem.trim().length === 0) {
            return this._resultadoVazio();
        }

        const textoNormalizado = this._normalizarTexto(mensagem);
        const textoLower = textoNormalizado.toLowerCase();
        const pontuacoes = this._calcularPontuacoes(textoLower);
        const impressaoDigital = this._calcularImpressaoDigital(textoLower);

        // Ordenar por pontuação (maior primeiro)
        const ordenado = pontuacoes
            .sort((a, b) => b.pontuacao - a.pontuacao);

        // Filtrar apenas intenções com pontuação > 0
        const comPontuacao = ordenado.filter(item => item.pontuacao > 0);
        const principal = comPontuacao[0] || {
            categoria: 'conversaCasual',
            grupo: 'conversacao',
            peso: 5,
            pontuacao: 0
        };
        const secundarias = comPontuacao.slice(1, 4).filter(item => item.pontuacao >= 10);

        // Confiança = proporção da pontuação principal vs total
        const totalPontuacao = comPontuacao.reduce((soma, item) => soma + item.pontuacao, 0);
        const confianca = totalPontuacao > 0
            ? Math.min(100, Math.round((principal.pontuacao / totalPontuacao) * 100))
            : 0;

        return {
            intencao: principal.categoria,
            intencaoPrincipal: principal.categoria,
            grupo: principal.grupo,
            categoria: principal.categoria,
            peso: principal.peso,
            pontuacao: principal.pontuacao,
            confianca: confianca,
            intencoesSecundarias: secundarias,
            todasPontuacoes: ordenado,
            detalhes: {
                palavrasEncontradas: this._contarPalavrasEncontradas(textoLower),
                tamanho: mensagem.trim().length,
                numPalavras: mensagem.trim().split(/\s+/).length,
                ehPergunta: this._ehPergunta(mensagem),
                ehExclamacao: this._ehExclamacao(mensagem),
                tempoAnalise: Date.now() - inicio
            }
        };
    }

    /**
     * Calcula a pontuação de cada intenção possível
     *
     * @param {string} texto - Mensagem normalizada (minúsculas)
     * @returns {Array} Lista de pontuações por intenção
     * @private
     */
    _calcularPontuacoes(texto) {
        const resultados = [];

        for (const [nome, intencao] of Object.entries(INTENCOES)) {
            let pontuacao = 0;
            const evidencias = [];
            const palavrasEncontradas = [];

            // 1. Palavras-chave diretas
            for (const palavra of intencao.palavras) {
                if (texto.includes(palavra)) {
                    pontuacao += 15;
                    evidencias.push(`palavra:${palavra}`);
                    palavrasEncontradas.push(palavra);
                }
            }

            // 2. Padrões regex
            for (const padrao of intencao.padroes) {
                if (padrao.test(texto)) {
                    pontuacao += 30;
                    evidencias.push(`padrão:${padrao}`);
                }
            }

            // 3. Bônus: mensagens curtas que são saudações/despedidas
            if (intencao.categoria === 'cumprimento' && texto.length <= 15) {
                pontuacao += 5;
            }

            resultados.push({
                categoria: nome,
                grupo: intencao.grupo,
                peso: intencao.peso,
                pontuacao: pontuacao,
                evidencias: evidencias,
                palavrasEncontradas: palavrasEncontradas
            });
        }

        return resultados;
    }

    /**
     * Calcula a "impressão digital" da mensagem para cache
     *
     * @param {string} texto - Texto normalizado
     * @returns {string} Hash simples da mensagem
     * @private
     */
    _calcularImpressaoDigital(texto) {
        let hash = 0;
        for (let i = 0; i < texto.length; i++) {
            const char = texto.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash |= 0; // Converter para 32-bit
        }
        return Math.abs(hash).toString(36);
    }

    /**
     * Normaliza o texto (minúsculas, remove espaços extras)
     *
     * @param {string} texto - Texto original
     * @returns {string} Texto normalizado
     * @private
     */
    _normalizarTexto(texto) {
        return texto
            .toLowerCase()
            .replace(/\s+/g, ' ')
            .trim();
    }

    /**
     * Remove acentos do texto
     *
     * @param {string} texto - Texto com acentos
     * @returns {string} Texto sem acentos
     * @private
     */
    _removerAcentos(texto) {
        return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    }

    /**
     * Verifica se a mensagem é uma pergunta
     *
     * @param {string} mensagem - Mensagem original
     * @returns {boolean} True se for pergunta
     * @private
     */
    _ehPergunta(mensagem) {
        if (mensagem.trim().endsWith('?')) return true;

        const padroesPergunta = [
            /\b(o que|qual|quais|como|onde|quando|quem|por que|porque|por quê)\b/i,
            /\b(você|voce|tu|vocês|voces)\b.*\?/i,
            /\b(pode|poderia|quer|iria|pode me|me conta|me fala)\b/i
        ];

        return padroesPergunta.some(padrao => padrao.test(mensagem));
    }

    /**
     * Verifica se a mensagem é exclamativa
     *
     * @param {string} mensagem - Mensagem original
     * @returns {boolean} True se for exclamativa
     * @private
     */
    _ehExclamacao(mensagem) {
        return mensagem.trim().includes('!');
    }

    /**
     * Conta quantas palavras-chave foram encontradas
     *
     * @param {string} texto - Texto normalizado
     * @returns {number} Total de palavras-chave encontradas
     * @private
     */
    _contarPalavrasEncontradas(texto) {
        let total = 0;
        for (const intencao of Object.values(INTENCOES)) {
            for (const palavra of intencao.palavras) {
                if (texto.includes(palavra)) {
                    total++;
                }
            }
        }
        return total;
    }

    /**
     * Retorna resultado vazio para mensagens inválidas
     *
     * @returns {Object} Resultado vazio
     * @private
     */
    _resultadoVazio() {
        return {
            intencao: 'conversaCasual',
            intencaoPrincipal: 'conversaCasual',
            grupo: 'conversacao',
            categoria: 'conversaCasual',
            peso: 5,
            pontuacao: 0,
            confianca: 0,
            intencoesSecundarias: [],
            todasPontuacoes: [],
            detalhes: {
                palavrasEncontradas: 0,
                tamanho: 0,
                numPalavras: 0,
                ehPergunta: false,
                ehExclamacao: false,
                tempoAnalise: 0
            }
        };
    }

    /**
     * Retorna a base de intenções (para debug/configuração)
     *
     * @returns {Object} Base de conhecimento de intenções
     */
    getBaseConhecimento() {
        return INTENCOES;
    }
}

// Instância singleton
const intentAnalyzer = new IntentAnalyzer();

module.exports = {
    IntentAnalyzer,
    intentAnalyzer,
    INTENCOES
};