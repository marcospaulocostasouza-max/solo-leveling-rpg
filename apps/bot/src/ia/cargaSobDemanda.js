/**
 * ==========================================================
 * CARGA SOB DEMANDA
 * ==========================================================
 *
 * Módulo responsável por identificar quais informações adicionais
 * do NPC devem ser carregadas, baseado na mensagem do jogador.
 *
 * Princípio central:
 *
 * Uma pessoa não relembra toda sua vida antes de responder
 * uma pergunta simples. Primeiro ela entende. Depois responde.
 * Somente se necessário lembra de algo específico.
 *
 * Este módulo analisa a mensagem e decide quais dados são
 * realmente necessários para aquela conversa.
 *
 * NUNCA retorna dados. Apenas indica QUAIS dados carregar.
 *
 * Estrutura de dados carregáveis:
 * - historia: passado, infância, origem, memórias antigas
 * - objetivos: objetivos, valores, ambições
 * - missao: missão atual, quests, tarefas
 * - atributos: força, resistência, velocidade, sentidos, inteligência, poder mágico
 * - classe: classe, classe_avancada, rank, nível
 * - magia: elemento, habilidades mágicas, feitiços
 * - tecnicas: técnicas de combate, habilidades de luta
 * - equipamentos: armas, itens, inventário
 * - aparencia: descrição física, altura, peso
 * - estilo_luta: estilo de combate
 * - gostos: preferências, gostos e desgostos
 * - traumas: traumas e feridas emocionais
 * - relacionamentos_npc: relações com outros NPCs
 * - regras_interpretacao: regras de interpretação específicas do NPC
 * - lacunas_narrativas: lacunas abertas da história
 * - organizacao: vínculos com guildas/facções
 * - profissao: profissão e ocupação
 */

// ==========================================================
// PADRÕES DE DETECÇÃO POR CATEGORIA
// ==========================================================

const PADROES_CARGA = {
    // ==========================================
    // HISTÓRIA
    // ==========================================
    historia: {
        palavras: [
            'história', 'historia', 'passado', 'infância', 'infancia',
            'origem', 'jovem', 'primeiros anos', 'quando era', 'quando fui',
            'aconteceu', 'acontecimento', 'lenda', 'antigamente',
            'há muito tempo', 'ha muito tempo', 'no passado',
            'lembra quando', 'naquela época', 'naquela epoca',
            'como tudo começou', 'como tudo comecou', 'seu começo', 'seu comeco',
            'começo', 'comeco', 'antes de você', 'antes de voce',
            'lembra de', 'lembra do', 'lembra da', 'se lembra', 'recorda',
            'o que houve', 'o que aconteceu', 'o que acontecia',
            'sua vida', 'sua história', 'sua historia', 'sobre você', 'sobre voce',
            'me conte', 'me conta', 'conte-me', 'conte me', 'me fale',
            'antigamente', 'era uma vez', 'memória', 'memoria', 'flashback',
            'o passado', 'meu passado', 'seu passado'
        ],
        padroes: [
            /(conte|me conte|me conta|fale|me fale).*(história|historia|passado|origem|infância|infancia)/i,
            /(você|voce) (se )?lembra/i,
            /(qual|o que) (foi|era|aconteceu).*(passado|origem|antes)/i,
            /(como|quando).*(começou|comecou|iniciou|inicio)/i,
            /(o que|como) (você|voce) (era|fazia)/i,
            /(me conte|me conta).*(sua|sua|teu|tua)/i
        ]
    },

    // ==========================================
    // OBJETIVOS
    // ==========================================
    objetivos: {
        palavras: [
            'objetivo', 'objetivos', 'meta', 'metas', 'sonho', 'sonhos',
            'ambição', 'ambicao', 'ambições', 'ambicoes', 'aspiração', 'aspiracao',
            'o que quer', 'o que deseja', 'o que almeja', 'o que busca',
            'quer alcançar', 'quer alcancar', 'quer conquistar', 'plano',
            'planos', 'propósito', 'proposito', 'motivação', 'motivacao',
            'sonha em', 'sonha com', 'desejo', 'desejos', 'vontade',
            'qual seu objetivo', 'qual sua meta', 'o que você quer',
            'o que voce quer', 'seus planos', 'seu plano', 'suas ambições',
            'suas ambicoes', 'o que pretende', 'para onde vai'
        ],
        padroes: [
            /(qual|o que|quais) (é|e|são|sao) (seu|sua|seus|suas).*(objetivo|objetivos|meta|metas|sonho|sonhos|amb.*|plano|planos)/i,
            /(o que|qual) (você|voce) (quer|deseja|almeja|busca|pretende|planeja)/i,
            /(para onde|aonde) (você|voce) (vai|pretende ir|quer ir)/i,
            /(qual|o que) (é|e) (seu|sua) (propósito|proposito|motivação|motivacao|sonho)/i
        ]
    },

    // ==========================================
    // MISSÃO
    // ==========================================
    missao: {
        palavras: [
            'missão', 'missao', 'quest', 'tarefa', 'pedido', 'favor',
            'objetivo', 'recompensa', 'recompensas', 'aceito', 'aceitar',
            'recusar', 'concluir', 'completar', 'nova missão', 'nova missao',
            'qual missão', 'qual missao', 'tenho uma missão', 'tenho uma missao',
            'posso ajudar', 'o que precisa', 'preciso de você', 'preciso de voce',
            'precisa de ajuda', 'como posso ajudar', 'em que posso ajudar',
            'tem trabalho', 'tem serviço', 'tem servico', 'o que tem para mim'
        ],
        padroes: [
            /(aceito|aceitar|recusar|concluir|completar).*(missão|missao|quest|tarefa)/i,
            /(qual|quais) (é|e|são|sao) (a|as|minha|minhas) (missão|missao|tarefa|quest)/i,
            /(tenho|recebi|ganhei).*(missão|missao|quest|tarefa)/i,
            /(posso|como posso).*(ajudar|auxiliar|servir)/i,
            /(tem|há|ha).*(trabalho|serviço|servico|missão|missao|tarefa)/i,
            /(o que|qual).*(precisa|preciso).*(fazer|ajudar)/i
        ]
    },

    // ==========================================
    // ATRIBUTOS (força, poder, etc.)
    // ==========================================
    atributos: {
        palavras: [
            'força', 'forca', 'poder', 'poderia', 'fraqueza', 'resistência',
            'resistencia', 'velocidade', 'sentidos', 'inteligência', 'inteligencia',
            'poder mágico', 'poder magico', 'nível', 'nivel', 'level', 'exp',
            'rank', 'stats', 'status', 'atributos', 'pontos', 'habilidade',
            'habilidades', 'tão forte', 'tao forte', 'quão forte', 'quao forte',
            'o quanto', 'sua força', 'sua forca', 'seu poder', 'seu nível',
            'seu nivel', 'sua resistência', 'sua resistencia', 'sua velocidade',
            'seu rank', 'sua classe', 'qual sua força', 'qual sua forca',
            'qual seu poder', 'quão poderoso', 'quao poderoso', 'quão forte',
            'quao forte', 'é forte', 'e forte', 'é poderoso', 'e poderoso',
            'seu nível de', 'seu nivel de', 'sua inteligência', 'sua inteligencia',
            'sua sabedoria', 'sua destreza', 'sua agilidade', 'sua constituição',
            'sua constituicao', 'seu carisma', 'quão rápido', 'quao rapido'
        ],
        padroes: [
            /(qual|o que|quanto|quão|quao).*(força|forca|poder|nível|nivel|rank|classe|habilidade)/i,
            /(você|voce) (é|e) (forte|poderoso|fraco|rapido|rápido|resistente)/i,
            /(sua|seu|suas|seus).*(força|forca|poder|nível|nivel|rank|classe|habilidade|resistência|resistencia|velocidade)/i,
            /(quão|quanto|qual).*(forte|forte|poderoso|forte)/i
        ]
    },

    // ==========================================
    // CLASSE / COMBATE
    // ==========================================
    classe: {
        palavras: [
            'classe', 'caminho', 'vocação', 'vocacao', 'profissão', 'profissao',
            'guerreiro', 'mago', 'arqueiro', 'ladrão', 'ladrao', 'cavaleiro',
            'paladino', 'bárbaro', 'barbaro', 'feiticeiro', 'clérigo', 'clerigo',
            'druida', 'bardo', 'monge', 'assassino', 'ranger', 'soldado',
            'espadachim', 'lutador', 'classe avançada', 'classe avancada',
            'sua classe', 'sua vocação', 'sua vocacao', 'seu caminho',
            'o que você é', 'o que voce e', 'o que você faz', 'o que voce faz',
            'sua especialidade', 'seu papel', 'sua função', 'sua funcao'
        ],
        padroes: [
            /(qual|o que) (é|e) (sua|seu) (classe|voc.*|caminho|profiss.*)/i,
            /(você|voce) (é|e) (um|uma|o|a) (guerreiro|mago|arqueiro|ladrão|ladrao|classe)/i,
            /(qual|o que) (é|e) (a|o) (sua|seu) (classe|especialidade|papel)/i
        ]
    },

    // ==========================================
    // MAGIA
    // ==========================================
    magia: {
        palavras: [
            'magia', 'mágico', 'magico', 'mágica', 'magica', 'feitiço', 'feitico',
            'feitiços', 'feiticos', 'encantamento', 'encantamentos', 'arcano',
            'mana', 'elemento', 'elemental', 'raio', 'fogo', 'água', 'agua',
            'vento', 'terra', 'gelo', 'luz', 'escuridão', 'escuridao',
            'invocação', 'invocacao', 'conjuração', 'conjuracao', 'poder mágico',
            'poder magico', 'habilidade elemental', 'sua magia', 'seu elemento',
            'seus feitiços', 'seus feiticos', 'magias', 'feitiçaria', 'feiticaria',
            'feiticeiro', 'bruxo', 'bruxa', 'encantador', 'magia elemental'
        ],
        padroes: [
            /(qual|o que|quais) (é|e|são|sao) (sua|seu|suas|seus).*(magia|magico|mágico|elemento|feitiço|feitico)/i,
            /(você|voce) (usa|utiliza|pratica|domina).*(magia|magico|mágico|elemento|feitiço|feitico)/i,
            /(me conte|me conta|fale).*(magia|elemento|feitiço|feitico|poder)/i,
            /(você|voce) (é|e) (um|uma).*(mago|feiticeiro|encantador)/i
        ]
    },

    // ==========================================
    // TÉCNICAS
    // ==========================================
    tecnicas: {
        palavras: [
            'técnica', 'tecnica', 'técnicas', 'tecnicas', 'habilidade de luta',
            'habilidades de luta', 'golpe', 'golpes', 'ataque', 'ataques',
            'movimento', 'movimentos', 'estilo de luta', 'estilo_luta',
            'combate', 'lutar', 'luta', 'batalha', 'batalhar', 'treino',
            'treinar', 'duelo', 'técnica secreta', 'tecnica secreta',
            'técnica especial', 'tecnica especial', 'seu golpe', 'seu ataque',
            'seu estilo', 'como luta', 'como você luta', 'como voce luta',
            'sua técnica', 'sua tecnica', 'suas técnicas', 'suas tecnicas'
        ],
        padroes: [
            /(qual|quais|como) (é|e|são|sao).*(técnica|tecnica|técnicas|tecnicas|golpe|ataque|estilo)/i,
            /(você|voce) (luta|batalha|combate|briga).*(como|estilo|forma|jeito)/i,
            /(me mostra|mostre|ensina|ensine).*(técnica|tecnica|golpe|ataque|estilo)/i,
            /(quero|vamos|preciso).*(lutar|batalhar|treinar|duelar)/i
        ]
    },

    // ==========================================
    // EQUIPAMENTOS / INVENTÁRIO
    // ==========================================
    equipamentos: {
        palavras: [
            'arma', 'armas', 'espada', 'lâmina', 'lamina', 'adaga', 'machado',
            'lança', 'lanca', 'arco', 'escudo', 'armadura', 'elmo', 'capacete',
            'amuleto', 'anel', 'cajado', 'cetro', 'orbe', 'equipamento',
            'equipamentos', 'item', 'itens', 'inventário', 'inventario',
            'bolsa', 'mochila', 'poção', 'pocao', 'poções', 'pocoes',
            'elixir', 'artefato', 'artefatos', 'relíquia', 'reliquia',
            'sua arma', 'sua espada', 'seu equipamento', 'seu inventário',
            'seu inventario', 'seus itens', 'suas armas', 'qual sua arma',
            'que arma', 'o que carrega', 'o que carrega com você',
            'o que carrega com voce', 'o que tem na', 'o que tem no',
            'o que você usa', 'o que voce usa', 'seu item', 'sua ferramenta'
        ],
        padroes: [
            /(qual|o que|quais) (é|e|são|sao) (sua|seu|suas|seus).*(arma|armas|equipamento|inventário|inventario|item|itens)/i,
            /(você|voce) (usa|carrega|tem|possui).*(arma|arma|espada|equipamento|item|itens)/i,
            /(me mostra|mostre|me mostre).*(arma|equipamento|inventário|inventario)/i,
            /(o que|qual) (você|voce) (carrega|tem|guarda|traz)/i
        ]
    },

    // ==========================================
    // APARÊNCIA
    // ==========================================
    aparencia: {
        palavras: [
            'aparência', 'aparencia', 'roupas', 'roupa', 'cabelo', 'cabelos',
            'olhos', 'corpo', 'altura', 'vestido', 'armadura', 'visual',
            'cara', 'rosto', 'feições', 'feicoes', 'sorriso', 'semblante',
            'postura', 'físico', 'fisico', 'como você é', 'como voce e',
            'como você se parece', 'como voce se parece', 'sua aparência',
            'sua aparencia', 'você é bonito', 'voce e bonito', 'você é bonita',
            'voce e bonita', 'você é lindo', 'voce e lindo', 'sua altura',
            'sua roupa', 'suas roupas', 'seu cabelo', 'seus olhos',
            'me descreva', 'descreva', 'como é sua', 'como e sua'
        ],
        padroes: [
            /(como|qual) (é|e) (sua|seu|a|o).*(aparência|aparencia|visual|roupa|roupas|cabelo|corpo|altura|rosto)/i,
            /(você|voce) (é|e|parece).*(bonito|bonita|lindo|linda|alto|alta|grande)/i,
            /(me descreva|descreva|me fale).*(aparência|aparencia|visual|roupa|cabelo|olhos)/i,
            /(como|qual) (você|voce) (é|e|se parece).*(fisicamente|fisicamente|de aparência|de aparencia)/i
        ]
    },

    // ==========================================
    // GOSTOS / DESGOSTOS
    // ==========================================
    gostos: {
        palavras: [
            'gosta', 'gosto', 'gostos', 'desgosta', 'desgostos', 'prefere',
            'preferência', 'preferencia', 'preferências', 'preferencias',
            'comida favorita', 'comida preferida', 'cor favorita', 'hobby',
            'hobbies', 'passatempo', 'passatempos', 'gosta de fazer',
            'gosta de comer', 'gosta de ler', 'o que você gosta', 'o que voce gosta',
            'o que você curte', 'o que voce curte', 'sua comida',
            'seu hobby', 'seu passatempo', 'o que te faz feliz',
            'qual sua comida', 'qual sua cor', 'seu gosto', 'seus gostos'
        ],
        padroes: [
            /(o que|qual|quais) (você|voce) (gosta|curte|prefere|aprecia)/i,
            /(qual|o que) (é|e) (sua|seu).*(comida|cor|hobby|passatempo|gosto)/i,
            /(você|voce) (gosta|curte|prefere).*(fazer|comer|ler|ouvir|ver|lutar|combater)/i,
            /(o que|qual).*(te faz|te deixa).*(feliz|triste)/i
        ]
    },

    // ==========================================
    // TRAUMAS
    // ==========================================
    traumas: {
        palavras: [
            'trauma', 'traumas', 'magoa', 'mágoa', 'ferida', 'feridas',
            'cicatriz', 'cicatrizes', 'medo', 'medos', 'pesadelo', 'pesadelos',
            'tristeza', 'dor', 'sofrimento', 'perda', 'perdas', 'luto',
            'morte', 'morreu', 'falecimento', 'arrependimento',
            'arrependimentos', 'remorso', 'culpa', 'maior medo',
            'maior dor', 'seu trauma', 'sua ferida', 'sua perda',
            'o que te assusta', 'o que te machuca', 'o que te magoa',
            'o que te entristece', 'o que te dói', 'o que te doi',
            'seus medos', 'suas feridas', 'seus traumas', 'sua maior',
            'o pior momento', 'pior momento', 'algo ruim', 'te marcou'
        ],
        padroes: [
            /(qual|o que|quais) (é|e|são|sao) (seu|sua|seus|suas).*(trauma|medo|ferida|arrependimento|perda|dor)/i,
            /(você|voce) (tem|guarda|carrega).*(trauma|medo|ferida|magoa|mágoa|culpa|remorso)/i,
            /(o que|qual) (te|lhe).*(assusta|machuca|magoa|entristece|doi|dói|marcou|feriu)/i,
            /(já|alguma vez).*(perdeu|sofreu|chorou|morreu)/i
        ]
    },

    // ==========================================
    // RELACIONAMENTOS COM OUTROS NPCs
    // ==========================================
    relacionamentos_npc: {
        palavras: [
            'conhece', 'conhecia', 'relação', 'relacao', 'relações', 'relacoes',
            'amigo', 'amiga', 'amigos', 'inimigo', 'inimiga', 'inimigos',
            'rival', 'aliado', 'aliados', 'companheiro', 'companheiros',
            'parceiro', 'parceiros', 'irmão', 'irmao', 'irmã', 'irma',
            'pai', 'mãe', 'mae', 'filho', 'filha', 'família', 'familia',
            'se conhecem', 'se conhecia', 'são amigos', 'sao amigos',
            'você conhece', 'voce conhece', 'sua relação com', 'sua relacao com',
            'seu amigo', 'sua amiga', 'seu aliado', 'seu inimigo',
            'quem é', 'quem sao', 'quem são', 'vocês se conhecem',
            'voces se conhecem', 'como conheceu', 'como conhecia',
            'o que acha de', 'o que acha da', 'o que acha do',
            'o que pensa de', 'o que pensa da', 'o que pensa do',
            'gosta de', 'gosta do', 'gosta da', 'gosta dos', 'gosta das'
        ],
        padroes: [
            /(você|voce) (conhece|conhecia|sabe quem é|sabe quem e)/i,
            /(qual|o que) (é|e) (sua|seu).*(relação|relacao|amizade).*(com|de)/i,
            /(o que|como) (você|voce) (acha|pensa|considera).*(do|da|de|sobre)/i,
            /(você|voce) (é|e) (amigo|amiga|inimigo|inimiga|aliado|rival).*(do|da|de)/i,
            /(me conte|me conta|fale).*(sobre|de).*(amigo|amiga|inimigo|família|familia|relação|relacao)/i
        ]
    },

    // ==========================================
    // ORGANIZAÇÃO
    // ==========================================
    organizacao: {
        palavras: [
            'guilda', 'facção', 'faccao', 'clã', 'cla', 'aliança', 'alianca',
            'ordem', 'organização', 'organizacao', 'grupo', 'esquadrão',
            'esquadrao', 'tribo', 'sociedade', 'confraria', 'irmandade',
            'legião', 'legiao', 'exército', 'exercito', 'pertence',
            'faz parte', 'membro', 'membros', 'afiliado', 'vínculo', 'vinculo',
            'qual guilda', 'qual facção', 'qual faccao', 'qual clã', 'qual cla',
            'sua guilda', 'sua facção', 'sua faccao', 'seu clã', 'seu cla',
            'você pertence', 'voce pertence', 'a qual', 'a que grupo',
            'sua organização', 'sua organizacao', 'qual ordem'
        ],
        padroes: [
            /(qual|a qual) (é|e) (sua|seu) (guilda|facção|faccao|clã|cla|ordem|organização|organizacao)/i,
            /(você|voce) (pertence|faz parte|é membro|e membro).*(guilda|facção|faccao|clã|cla|ordem|organização|organizacao)/i,
            /(qual|o que) (é|e) (a|o) (sua|seu).*(organização|organizacao|afiliação|afiliacao|vínculo|vinculo)/i,
            /(me conte|me conta|fale).*(guilda|facção|faccao|clã|cla|ordem|organização|organizacao)/i
        ]
    },

    // ==========================================
    // PROFISSÃO
    // ==========================================
    profissao: {
        palavras: [
            'profissão', 'profissao', 'trabalho', 'ocupação', 'ocupacao',
            'emprego', 'emprego', 'carreira', 'ofício', 'oficio', 'ofício',
            'o que você faz', 'o que voce faz', 'o que você trabalha',
            'o que voce trabalha', 'onde trabalha', 'seu trabalho',
            'sua profissão', 'sua profissao', 'sua ocupação', 'sua ocupacao',
            'você trabalha', 'voce trabalha', 'você é caçador', 'voce e cacador',
            'você é hunter', 'voce e hunter', 'você é do que', 'voce e do que',
            'qual seu trabalho', 'qual sua profissão', 'qual sua profissao',
            'o que ganha a vida', 'como ganha a vida', 'meio de vida'
        ],
        padroes: [
            /(qual|o que) (é|e) (sua|seu) (profissão|profissao|trabalho|ocupação|ocupacao|ofício|oficio)/i,
            /(o que|como) (você|voce) (trabalha|faz|ganha a vida)/i,
            /(onde|como) (você|voce) (trabalha|ganha|sobrevive)/i,
            /(você|voce) (é|e) (caçador|cacador|pesquisador|professor|ferreiro|mercador)/i
        ]
    },

    // ==========================================
    // REGRAS DE INTERPRETAÇÃO
    // ==========================================
    regras_interpretacao: {
        palavras: [
            'regras', 'como age', 'como reage', 'como pensa', 'como se comporta',
            'como você age', 'como voce age', 'como você reage', 'como voce reage',
            'como você pensa', 'como voce pensa', 'o que faria', 'o que você faria',
            'o que voce faria', 'como agiria', 'o que você faria se',
            'o que voce faria se', 'se eu', 'se você', 'se voce',
            'o que você acha', 'o que voce acha', 'qual sua opinião',
            'qual sua opiniao', 'o que você faria numa', 'o que voce faria numa',
            'como você lidaria', 'como voce lidaria', 'como resolveria',
            'como você resolveria', 'como voce resolveria', 'sua atitude',
            'sua atitude seria'
        ],
        padroes: [
            /(o que|como) (você|voce) (faria|agiria|reagiria|lidaria|resolveria|pensaria|responderia)/i,
            /(o que|qual) (você|voce) (acha|pensa).*(sobre|de|que)/i,
            /(se|caso).*(o que|como).*(você|voce).*(faria|agiria|reagiria|lidaria|faz)/i,
            /(me diga|diga|me diz).*(o que|como).*(você|voce).*(faria|faz|agiria|age)/i
        ]
    },

    // ==========================================
    // LACUNAS NARRATIVAS (detalhes desconhecidos)
    // ==========================================
    lacunas_narrativas: {
        palavras: [
            'primeiro amor', 'comida favorita da infância', 'comida favorita da infancia',
            'maior vergonha', 'maior arrependimento', 'primeiro mestre',
            'infância', 'infancia', 'quando criança', 'quando era criança',
            'quando era crianca', 'quando jovem', 'sua infância', 'sua infancia',
            'sua família', 'sua familia', 'seu pai', 'sua mãe', 'sua mae',
            'seu irmão', 'seu irmao', 'sua irmã', 'sua irma', 'seu avô', 'seu avo',
            'sua avó', 'sua avo', 'sua criação', 'sua criacao', 'como foi criado',
            'como foi criar', 'quem te criou', 'quem criou você', 'quem criou voce',
            'onde nasceu', 'quando nasceu', 'como era sua vida'
        ],
        padroes: [
            /(quem|qual|o que|onde|quando).*(primeiro|primeira|maior|infância|infancia|família|familia)/i,
            /(conte|me conte|me conta|fale).*(infância|infancia|família|familia|criação|criacao)/i,
            /(você|voce) (nasceu|foi criado|foi criada|grew up).*(onde|em|quando|como)/i,
            /(qual|quem).*(seu|sua|teu|tua).*(primeiro|primeira|mestre|amor|vergonha|arrependimento)/i
        ]
    }
};

// ==========================================================
// DETECÇÃO DE NECESSIDADE DE CARGA
// ==========================================================

/**
 * Verifica se uma mensagem contém palavras-chave de uma categoria
 *
 * @param {string} mensagem - Mensagem normalizada
 * @param {Array<string>} palavras - Lista de palavras-chave
 * @returns {boolean} True se encontrou alguma palavra
 */
function contemPalavras(mensagem, palavras) {
    return palavras.some(palavra => mensagem.includes(palavra));
}

/**
 * Verifica se uma mensagem corresponde a algum padrão regex de uma categoria
 *
 * @param {string} mensagem - Mensagem normalizada
 * @param {Array<RegExp>} padroes - Lista de padrões regex
 * @returns {boolean} True se algum padrão corresponde
 */
function correspondePadrao(mensagem, padroes) {
    return padroes.some(padrao => padrao.test(mensagem));
}

/**
 * Detecta quais dados do NPC devem ser carregados
 * com base na mensagem do jogador
 *
 * @param {string} mensagem - Mensagem do jogador
 * @returns {Object} Map de categorias com boolean indicando necessidade
 */
function detectarCargaNecessaria(mensagem) {
    if (!mensagem || typeof mensagem !== 'string') {
        return _resultadoVazio();
    }

    const texto = mensagem.toLowerCase().trim();

    const resultado = {
        historia: false,
        objetivos: false,
        missao: false,
        atributos: false,
        classe: false,
        magia: false,
        tecnicas: false,
        equipamentos: false,
        aparencia: false,
        gostos: false,
        traumas: false,
        relacionamentos_npc: false,
        organizacao: false,
        profissao: false,
        regras_interpretacao: false,
        lacunas_narrativas: false
    };

    // Detectar cada categoria
    for (const [categoria, config] of Object.entries(PADROES_CARGA)) {
        if (contemPalavras(texto, config.palavras) || correspondePadrao(texto, config.padroes)) {
            resultado[categoria] = true;
        }
    }

    // Adicionar metadados
    resultado._dadosSolicitados = Object.entries(resultado)
        .filter(([_, valor]) => valor === true)
        .map(([categoria]) => categoria);

    resultado._temCargaSobDemanda = resultado._dadosSolicitados.length > 0;

    return resultado;
}

/**
 * Retorna resultado vazio (nenhuma carga necessária)
 *
 * @returns {Object} Resultado vazio
 */
function _resultadoVazio() {
    return {
        historia: false,
        objetivos: false,
        missao: false,
        atributos: false,
        classe: false,
        magia: false,
        tecnicas: false,
        equipamentos: false,
        aparencia: false,
        gostos: false,
        traumas: false,
        relacionamentos_npc: false,
        organizacao: false,
        profissao: false,
        regras_interpretacao: false,
        lacunas_narrativas: false,
        _dadosSolicitados: [],
        _temCargaSobDemanda: false
    };
}

/**
 * Extrai apenas os campos do NPC que devem ser carregados
 * basedo na detecção de carga necessária
 *
 * @param {Object} npc - Dados completos do NPC
 * @param {Object} deteccao - Resultado de detectarCargaNecessaria
 * @returns {Object} Campos do NPC carregados sob demanda
 */
function extrairCamposSobDemanda(npc, deteccao) {
    if (!npc) return {};

    const campos = {};

    // Mapeamento categoria → campos do NPC
    const mapeamento = {
        historia: ['historia', 'traumas', 'lacunas_narrativas'],
        objetivos: ['objetivos', 'valores'],
        missao: ['missoes', 'missaoAtual'],
        atributos: ['atributos', 'nivel', 'rank'],
        classe: ['classe', 'classe_avancada', 'rank', 'nivel'],
        magia: ['elemento', 'habilidade_unica'],
        tecnicas: ['tecnicas', 'estilo_luta'],
        equipamentos: ['equipamentos'],
        aparencia: ['aparencia', 'altura_peso'],
        gostos: ['gostos', 'desgostos'],
        traumas: ['traumas'],
        relacionamentos_npc: ['relacionamentos'],
        organizacao: ['organizacao', 'ocupacao'],
        profissao: ['profissao', 'ocupacao'],
        regras_interpretacao: ['regras_interpretacao'],
        lacunas_narrativas: ['lacunas_narrativas']
    };

    // Para cada categoria detectada, extrair os campos correspondentes
    for (const [categoria, camposNPC] of Object.entries(mapeamento)) {
        if (deteccao[categoria]) {
            for (const campo of camposNPC) {
                if (npc[campo] !== undefined) {
                    campos[campo] = npc[campo];
                }
            }
        }
    }

    return campos;
}

module.exports = {
    detectarCargaNecessaria,
    extrairCamposSobDemanda,
    PADROES_CARGA
};