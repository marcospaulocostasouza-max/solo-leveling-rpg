/**
 * Conversor de Dataset Markdown para JSONL
 *
 * Lê todos os arquivos Markdown de um NPC e converte em exemplos
 * de treinamento no formato JSONL (compatível com Qwen).
 *
 * Uso: node convert_to_jsonl.js [npc_folder_name]
 * Exemplo: node convert_to_jsonl.js ophilia_clement
 */

const fs = require('fs');
const path = require('path');

// =====================================================================
// CONFIGURAÇÃO
// =====================================================================

const npcName = process.argv[2] || 'ophilia_clement';
const inputDir = path.join(__dirname, '..', 'dataset', npcName);
const outputDir = path.join(__dirname, '..', 'output');
const outputPath = path.join(outputDir, `${npcName.replace(/_/g, '_')}_dataset.jsonl`);

// Garantir que a pasta de output existe
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// =====================================================================
// GERADOR DE PERGUNTAS POR TIPO DE ARQUIVO
// =====================================================================

const questionGenerators = {
  '01_identity.md': (content) => {
    const examples = [];
    const lines = content.split('\n').filter(l => l.trim() && !l.startsWith('#'));

    // Cabeçalho
    const headerMatch = content.match(/^(.+)$/m);
    if (headerMatch) {
      const header = headerMatch[1].trim();
      examples.push(...generateVariations(
        [
          'Quem é você?',
          'Como você se chama?',
          'Qual é o seu nome?',
          'Me diga seu nome.',
          'Você é quem?',
          'Identifique-se.'
        ],
        header
      ));
    }

    // Nome
    const nomeMatch = content.match(/Nome\s+(.+)/);
    if (nomeMatch) {
      const nome = nomeMatch[1].trim();
      examples.push(...generateVariations(
        [
          'Qual é o seu nome completo?',
          'Como as pessoas te chamam?',
          'Qual nome você usa?',
          'Seu nome verdadeiro é qual?'
        ],
        `Meu nome é ${nome}.`
      ));
    }

    // Idade
    const idadeMatch = content.match(/Idade\s+(.+)/);
    if (idadeMatch) {
      const idade = idadeMatch[1].trim();
      examples.push(...generateVariations(
        [
          'Qual é a sua idade?',
          'Quantos anos você tem?',
          'Você tem que idade?',
          'Pode me dizer sua idade?'
        ],
        `Tenho ${idade} anos.`
      ));
    }

    // Raça
    const racaMatch = content.match(/Raça\s+(.+)/);
    if (racaMatch) {
      const raca = racaMatch[1].trim();
      examples.push(...generateVariations(
        [
          'Qual é a sua raça?',
          'O que você é em termos de raça?',
          'Você é de qual raça?',
          'Pode me dizer sua raça?'
        ],
        `Sou ${raca}.`
      ));
    }

    // Nacionalidade
    const nacMatch = content.match(/Nacionalidade\s+(.+)/);
    if (nacMatch) {
      const nac = nacMatch[1].trim();
      examples.push(...generateVariations(
        [
          'De onde você é?',
          'Qual é a sua nacionalidade?',
          'Você é de onde?',
          'Qual sua origem?'
        ],
        nac
      ));
    }

    // Classe
    const classeMatch = content.match(/Classe\s+(.+)/);
    if (classeMatch) {
      const classe = classeMatch[1].trim();
      examples.push(...generateVariations(
        [
          'Qual é a sua classe?',
          'Você é de qual classe?',
          'Qual classe você pertence?',
          'Me diga sua classe.'
        ],
        classe
      ));
    }

    // Ocupação
    const ocupMatch = content.match(/Ocupação\s+(.+)/);
    if (ocupMatch) {
      const ocup = ocupMatch[1].trim();
      examples.push(...generateVariations(
        [
          'Qual é a sua ocupação?',
          'O que você faz?',
          'Em que você trabalha?',
          'Qual sua profissão?'
        ],
        ocup
      ));
    }

    // Organização
    const orgMatch = content.match(/Organização\/Guilda\s+(.+)/);
    if (orgMatch) {
      const org = orgMatch[1].trim();
      examples.push(...generateVariations(
        [
          'Você pertence a alguma guilda?',
          'Qual é sua organização?',
          'Você tem vínculo com alguma guilda?',
          'De que organização você faz parte?'
        ],
        org
      ));
    }

    // Elemento
    const elemMatch = content.match(/Elemento\s+(.+)/);
    if (elemMatch) {
      const elem = elemMatch[1].trim();
      examples.push(...generateVariations(
        [
          'Qual é o seu elemento?',
          'Seu elemento é qual?',
          'Você tem afinidade com qual elemento?',
          'Qual elemento você domina?'
        ],
        elem
      ));
    }

    // Resumo geral de identidade
    examples.push(...generateVariations(
      [
        'Me fale sobre você.',
        'Quem é você exatamente?',
        'Se apresente.',
        'Pode se apresentar?',
        'Fale sobre quem você é.'
      ],
      content.split('\n').filter(l => l.trim() && !l.startsWith('#')).join('\n')
    ));

    return examples;
  },

  '02_summary.md': (content) => {
    const text = content.split('\n').filter(l => l.trim() && !l.startsWith('#')).join('\n');
    return generateVariations(
      [
        'Me dê um resumo sobre você.',
        'Resuma quem você é.',
        'Pode me dar uma visão geral sobre você?',
        'Quem é você em resumo?',
        'Me conte brevemente sobre você.',
        'Se apresente em poucas palavras.',
        'Faça um resumo da sua persona.',
        'Descreva-se de forma resumida.'
      ],
      text
    );
  },

  '03_history.md': (content) => {
    const examples = [];
    const text = content.split('\n').filter(l => l.trim() && !l.startsWith('#')).join('\n');

    // Resumo geral da história
    examples.push(...generateVariations(
      [
        'Conte-me sobre sua história.',
        'Qual é a sua história de vida?',
        'Me fale sobre seu passado.',
        'Como foi sua vida até aqui?',
        'Quero saber sobre sua história.',
        'De onde você veio?',
        'Me conte sua origem.',
        'Como você chegou até aqui?'
      ],
      text
    ));

    // Infância
    const infanciaMatch = content.match(/Infância e Adolescência\n([\s\S]*?)(?=\n[A-Z]|\n\d\.|$)/);
    if (infanciaMatch) {
      const infancia = infanciaMatch[1].trim();
      examples.push(...generateVariations(
        [
          'Como foi sua infância?',
          'Me fale sobre quando você era criança.',
          'Como você cresceu?',
          'Como foi sua adolescência?',
          'Fale sobre sua criação.'
        ],
        infancia
      ));
    }

    // Vida atual
    const vidaMatch = content.match(/Vida atual\n([\s\S]*?)(?=\n[A-Z]|\n\d\.|$)/);
    if (vidaMatch) {
      const vida = vidaMatch[1].trim();
      examples.push(...generateVariations(
        [
          'Como é sua vida atual?',
          'O que você faz hoje em diaça?',
          'Me conte sobre sua vida agora.',
          'Como está sua vida atualmente?'
        ],
        vida
      ));
    }

    // Eventos marcantes
    const eventosMatch = content.match(/Eventos marcantes\n([\s\S]*?)$/);
    if (eventosMatch) {
      const eventos = eventosMatch[1].trim();
      examples.push(...generateVariations(
        [
          'Quais foram os eventos mais marcantes da sua vida?',
          'O que mais te marcou?',
          'Teve algum evento importante na sua vida?',
          'Me fale sobre momentos importantes para você.'
        ],
        eventos
      ));
    }

    return examples;
  },

  '04_personality.md': (content) => {
    const examples = [];
    const text = content.split('\n').filter(l => l.trim() && !l.startsWith('#')).join('\n');

    // Personalidade geral
    examples.push(...generateVariations(
      [
        'Como é sua personalidade?',
        'Como você descreveria a si mesma?',
        'Quais são seus traços de personalidade?',
        'Me descreva sua personalidade.',
        'Como você é por dentro?'
      ],
      text
    ));

    // Reações específicas
    const reactions = [
      { pattern: /Sob pressão:\s*(.+)/, questions: ['Como você age sob pressão?', 'O que você faz quando está sob pressão?', 'Como você reage sob pressão?'] },
      { pattern: /Diante da perda:\s*(.+)/, questions: ['Como você lida com perdas?', 'O que você faz quando perde algo?', 'Como você reage à perda?'] },
      { pattern: /Diante do fracasso:\s*(.+)/, questions: ['Como você reage ao fracasso?', 'O que acontece quando você falha?', 'Como você lida com o fracasso?'] },
      { pattern: /Diante do sucesso:\s*(.+)/, questions: ['Como você reage ao sucesso?', 'O que você faz quando tem sucesso?', 'Como você celebra vitórias?'] },
      { pattern: /Quando elogiado\(a\):\s*(.+)/, questions: ['Como você reage a elogios?', 'O que você faz quando te elogiam?', 'Como você lida com elogios?'] },
      { pattern: /Quando provocado\(a\):\s*(.+)/, questions: ['Como você reage a provocações?', 'O que você faz quando te provocam?', 'Como você lida com provocações?'] },
      { pattern: /Quando sente medo:\s*(.+)/, questions: ['Como você reage quando sente medo?', 'O que você faz quando está com medo?', 'Como você lida com o medo?'] }
    ];

    for (const { pattern, questions } of reactions) {
      const match = content.match(pattern);
      if (match) {
        examples.push(...generateVariations(questions, match[1].trim()));
      }
    }

    return examples;
  },

  '05_interpretation.md': (content) => {
    const examples = [];
    const text = content.split('\n').filter(l => l.trim() && !l.startsWith('#')).join('\n');

    examples.push(...generateVariations(
      [
        'Como você interpreta o mundo ao seu redor?',
        'Qual é sua visão de mundo?',
        'Como você processa as coisas que acontecem ao seu redor?',
        'Como você enxerga a realidade?'
      ],
      text
    ));

    // Nota de fidelidade
    const notaMatch = content.match(/Nota de fidelidade ao canon:\s*([\s\S]*?)$/);
    if (notaMatch) {
      examples.push(...generateVariations(
        [
          'Como você fala no original?',
          'Qual é o seu tom de voz canônico?',
          'Como é sua forma de falar no material original?'
        ],
        notaMatch[1].trim()
      ));
    }

    return examples;
  },

  '06_speech.md': (content) => {
    const examples = [];
    const text = content.split('\n').filter(l => l.trim() && !l.startsWith('#')).join('\n');

    // Forma de falar geral
    examples.push(...generateVariations(
      [
        'Como você fala?',
        'Qual é o seu jeito de falar?',
        'Descreva sua forma de falar.',
        'Como é seu padrão de fala?',
        'Me fale sobre como você se comunica.'
      ],
      text
    ));

    // Seções específicas
    const sections = [
      { header: 'Abertura da conversa', questions: ['Como você começa uma conversa?', 'Como você abre um diálogo?', 'Você costuma iniciar conversas como?'] },
      { header: 'Registro, vocabulário', questions: ['Qual é seu vocabulário?', 'Como é seu registro de fala?', 'Que tipo de palavras você usa?'] },
      { header: 'Postura conversacional', questions: ['Como é sua postura em conversas?', 'Como você se porta em uma conversa?', 'Qual sua postura conversacional?'] },
      { header: 'Como fala com diferentes', questions: ['Como você fala com pessoas diferentes?', 'Você muda seu jeito de falar dependendo de quem é?', 'Como você se dirige a diferentes interlocutores?'] },
      { header: 'Expressão emocional', questions: ['Como você expressa emoções pela fala?', 'Suas emoções aparecem na sua voz?', 'Como suas emoções afetam sua fala?'] },
      { header: 'Ironia, humor', questions: ['Você usa ironia ou humor?', 'Como você reage a provocações em conversa?', 'Você faz piadas?'] }
    ];

    for (const { header, questions } of sections) {
      const regex = new RegExp(`${header}[\\s\\S]*?\\n([\\s\\S]*?)(?=\\n[A-Z]|$)`, 'i');
      const match = content.match(regex);
      if (match) {
        examples.push(...generateVariations(questions, match[1].trim()));
      }
    }

    return examples;
  },

  '07_values.md': (content) => {
    const text = content.split('\n').filter(l => l.trim() && !l.startsWith('#')).join('\n');
    return generateVariations(
      [
        'Quais são seus valores?',
        'No que você acredita?',
        'Quais são seus princípios morais?',
        'O que é importante para você?',
        'Quais valores você defende?',
        'O que você valoriza acima de tudo?',
        'Quais são seus códigos de conduta?'
      ],
      text
    );
  },

  '08_likes.md': (content) => {
    const text = content.split('\n').filter(l => l.trim() && !l.startsWith('#')).join('\n');
    return generateVariations(
      [
        'Do que você gosta?',
        'Quais são suas preferências?',
        'O que você aprecia?',
        'Me fale sobre o que você gosta.',
        'Quais são seus gostos?',
        'O que você mais gosta?'
      ],
      text
    );
  },

  '09_dislikes.md': (content) => {
    const text = content.split('\n').filter(l => l.trim() && !l.startsWith('#')).join('\n');
    return generateVariations(
      [
        'Do que você não gosta?',
        'Quais são suas aversões?',
        'O que você repudia?',
        'Me fale sobre o que você desgosta.',
        'O que te incomoda?',
        'Quais são seus desgostos?'
      ],
      text
    );
  },

  '10_traumas.md': (content) => {
    const examples = [];
    const text = content.split('\n').filter(l => l.trim() && !l.startsWith('#')).join('\n');

    examples.push(...generateVariations(
      [
        'Quais são seus traumas?',
        'Você tem algum trauma?',
        'O que te marcou negativamente?',
        'Me fale sobre seus traumas.',
        'O que te assombra do passado?'
      ],
      text
    ));

    // Efeito no comportamento
    const efeitoMatch = content.match(/Efeito no comportamento:\s*(.+)/);
    if (efeitoMatch) {
      examples.push(...generateVariations(
        [
          'Como seus traumas afetam seu comportamento?',
          'Seus traumas mudam como você age?',
          'Qual o impacto dos seus traumas em você?'
        ],
        efeitoMatch[1].trim()
      ));
    }

    return examples;
  },

  '11_relationships.md': (content) => {
    const text = content.split('\n').filter(l => l.trim() && !l.startsWith('#')).join('\n');
    return generateVariations(
      [
        'Quais são seus relacionamentos importantes?',
        'Você tem relacionamentos significativos?',
        'Me fale sobre suas relações.',
        'Quem é importante para você?',
        'Tem alguém próximo a você?'
      ],
      text
    );
  },

  '12_goals.md': (content) => {
    const examples = [];
    const text = content.split('\n').filter(l => l.trim() && !l.startsWith('#')).join('\n');

    examples.push(...generateVariations(
      [
        'Quais são seus objetivos?',
        'O que você busca?',
        'Quais são suas metas?',
        'O que você quer alcançar?',
        'Me fale sobre seus sonhos.',
        'Qual é seu propósito?'
      ],
      text
    ));

    // Objetivo atual
    const atualMatch = content.match(/Objetivo atual:\s*(.+)/);
    if (atualMatch) {
      examples.push(...generateVariations(
        ['Qual é seu objetivo agora?', 'O que você busca atualmente?', 'Sua meta atual é qual?'],
        atualMatch[1].trim()
      ));
    }

    // Maior medo
    const medoMatch = content.match(/Maior medo:\s*(.+)/);
    if (medoMatch) {
      examples.push(...generateVariations(
        ['Qual é seu maior medo?', 'Do que você mais tem medo?', 'O que te assusta mais?'],
        medoMatch[1].trim()
      ));
    }

    return examples;
  },

  '13_knowledge.md': (content) => {
    const text = content.split('\n').filter(l => l.trim() && !l.startsWith('#')).join('\n');
    return generateVariations(
      [
        'O que você sabe?',
        'Quais são seus conhecimentos?',
        'Em que você é especialista?',
        'Me fale sobre o que você domina.',
        'Quais são suas habilidades?',
        'O que você estudou?'
      ],
      text
    );
  },

  '14_curiosities.md': (content) => {
    const text = content.split('\n').filter(l => l.trim() && !l.startsWith('#')).join('\n');
    return generateVariations(
      [
        'Me conte uma curiosidade sobre você.',
        'Tem algo curioso sobre você?',
        'Fatos inusitados sobre você?',
        'Me diga algo interessante sobre você.',
        'Quais curiosidades sobre você?'
      ],
      text
    );
  },

  '15_narrative_gaps.md': (content) => {
    const examples = [];
    const text = content.split('\n').filter(l => l.trim() && !l.startsWith('#')).join('\n');

    examples.push(...generateVariations(
      [
        'O que você não sabe sobre si mesma?',
        'Tem algo que você não conhece sobre seu passado?',
        'Existem lacunas na sua história?',
        'O que é desconhecido sobre você?'
      ],
      text
    ));

    // Lacunas individuais
    const lacunas = [
      { pattern: /Primeiro amor:\s*(.+)/, questions: ['Quem foi seu primeiro amor?', 'Você se apaixonou por alguém?'] },
      { pattern: /Comida favorita da infância:\s*(.+)/, questions: ['Qual era sua comida favorita na infância?', 'Do que você gostava de comer quando criança?'] },
      { pattern: /Maior vergonha:\s*(.+)/, questions: ['Qual é sua maior vergonha?', 'Do que você mais se envergonha?'] },
      { pattern: /Maior arrependimento:\s*(.+)/, questions: ['Qual é seu maior arrependimento?', 'Do que você mais se arrepende?'] },
      { pattern: /Primeiro mestre:\s*(.+)/, questions: ['Quem foi seu primeiro mestre?', 'Quem te ensinou primeiro?'] }
    ];

    for (const { pattern, questions } of lacunas) {
      const match = content.match(pattern);
      if (match) {
        examples.push(...generateVariations(questions, match[1].trim()));
      }
    }

    return examples;
  },

  '16_absolute_rules.md': (content) => {
    const text = content.split('\n').filter(l => l.trim() && !l.startsWith('#')).join('\n');
    return generateVariations(
      [
        'Quais são suas regras absolutas?',
        'O que você nunca faria?',
        'Quais princípios são inquebráveis para você?',
        'Tem algo que você nunca violaria?',
        'Quais são suas regras de conduta?'
      ],
      text
    );
  },

  '17_dialog_examples.md': (content) => {
    // Arquivo vazio - sem exemplos
    return [];
  },

  '18_scene_examples.md': (content) => {
    // Arquivo vazio - sem exemplos
    return [];
  }
};

// =====================================================================
// GERADOR DE VARIAÇÕES
// =====================================================================

function generateVariations(questions, answer) {
  return questions.map(q => ({
    messages: [
      { role: 'user', content: q },
      { role: 'assistant', content: answer }
    ]
  }));
}

// =====================================================================
// PARSER DE CONTEÚDO GENÉRICO
// =====================================================================

function parseGenericContent(filename, content) {
  const generator = questionGenerators[filename];
  if (generator) {
    return generator(content);
  }

  // Fallback genérico
  const text = content.split('\n').filter(l => l.trim() && !l.startsWith('#')).join('\n');
  if (!text.trim()) return [];

  return generateVariations(
    [
      `Me fale sobre o conteúdo de ${filename}.`,
      `O que há no arquivo ${filename}?`,
      `Pode me explicar sobre ${filename.replace('.md', '')}?`
    ],
    text
  );
}

// =====================================================================
// CONVERSÃO DE BULLET POINTS EM EXEMPLOS INDIVIDUAIS
// =====================================================================

function parseBulletPoints(content, topicName) {
  const examples = [];
  const bulletRegex = /[•\-]\s*(.+)/g;
  let match;

  while ((match = bulletRegex.exec(content)) !== null) {
    const bullet = match[1].trim();
    if (bullet.length < 5) continue;

    examples.push(...generateVariations(
      [
        `Me fale sobre ${topicName}.`,
        `O que você pode dizer sobre ${topicName}?`,
        `Pode comentar sobre ${topicName}?`
      ],
      bullet
    ));
  }

  return examples;
}

// =====================================================================
// FUNÇÃO PRINCIPAL
// =====================================================================

function convert() {
  console.log(`\n[Conversor] Iniciando conversão para: ${npcName}`);
  console.log(`[Conversor] Diretório de entrada: ${inputDir}`);
  console.log(`[Conversor] Arquivo de saída: ${outputPath}\n`);

  // Verificar se o diretório existe
  if (!fs.existsSync(inputDir)) {
    console.error(`[Erro] Diretório não encontrado: ${inputDir}`);
    process.exit(1);
  }

  // Ler todos os arquivos .md
  const files = fs.readdirSync(inputDir)
    .filter(f => f.endsWith('.md'))
    .sort();

  console.log(`[Conversor] Arquivos encontrados: ${files.length}`);

  let allExamples = [];
  let fileStats = [];

  for (const file of files) {
    const filePath = path.join(inputDir, file);
    const content = fs.readFileSync(filePath, 'utf8');

    // Verificar se o arquivo tem conteúdo
    const hasContent = content.trim().length > 0;

    if (!hasContent) {
      fileStats.push({ file, examples: 0, empty: true });
      console.log(`  [${file}] — vazio, pulando`);
      continue;
    }

    // Gerar exemplos usando o gerador específico ou genérico
    let examples = parseGenericContent(file, content);

    // Adicionar exemplos de bullet points individuais
    const topicName = file.replace(/^\d+_/, '').replace('.md', '').replace(/_/g, ' ');
    const bulletExamples = parseBulletPoints(content, topicName);

    // Combinar exemplos (sem duplicar)
    allExamples = allExamples.concat(examples);
    allExamples = allExamples.concat(bulletExamples);

    fileStats.push({ file, examples: examples.length + bulletExamples.length, empty: false });
    console.log(`  [${file}] — ${examples.length + bulletExamples.length} exemplos gerados`);
  }

  // Adicionar exemplos cruzados (cross-reference questions)
  console.log('\n[Conversor] Gerando exemplos cruzados...');

  // Exemplos que combinam múltiplas informações
  const crossExamples = generateCrossReferenceExamples(inputDir);
  allExamples = allExamples.concat(crossExamples);
  console.log(`  [cross-reference] — ${crossExamples.length} exemplos gerados`);

  // Remover duplicatas exatas
  const seen = new Set();
  const uniqueExamples = allExamples.filter(ex => {
    const key = JSON.stringify(ex);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  console.log(`\n[Conversor] Total de exemplos: ${allExamples.length}`);
  console.log(`[Conversor] Após remover duplicatas: ${uniqueExamples.length}`);

  // Escrever JSONL
  const jsonlContent = uniqueExamples.map(ex => JSON.stringify(ex)).join('\n');
  fs.writeFileSync(outputPath, jsonlContent, 'utf8');

  console.log(`\n[Conversor] Arquivo salvo em: ${outputPath}`);
  console.log(`[Conversor] Tamanho: ${(Buffer.byteLength(jsonlContent) / 1024).toFixed(2)} KB\n`);

  // Relatório final
  console.log('=== RELATÓRIO ===');
  console.log(`NPC: ${npcName}`);
  console.log(`Arquivos processados: ${files.length}`);
  console.log(`Arquivos com conteúdo: ${fileStats.filter(s => !s.empty).length}`);
  console.log(`Arquivos vazios: ${fileStats.filter(s => s.empty).length}`);
  console.log(`Total de exemplos: ${uniqueExamples.length}`);
  console.log('');

  for (const stat of fileStats) {
    const status = stat.empty ? 'VAZIO' : `${stat.examples} exemplos`;
    console.log(`  ${stat.file}: ${status}`);
  }
}

// =====================================================================
// EXEMPLOS DE REFERÊNCIA CRUZADA
// =====================================================================

function generateCrossReferenceExamples(inputDir) {
  const examples = [];

  // Ler arquivos específicos para gerar perguntas combinadas
  const readFile = (name) => {
    const filePath = path.join(inputDir, name);
    if (!fs.existsSync(filePath)) return null;
    const content = fs.readFileSync(filePath, 'utf8');
    return content.split('\n').filter(l => l.trim() && !l.startsWith('#')).join('\n');
  };

  const identity = readFile('01_identity.md');
  const summary = readFile('02_summary.md');
  const history = readFile('03_history.md');
  const personality = readFile('04_personality.md');
  const speech = readFile('06_speech.md');
  const values = readFile('07_values.md');
  const goals = readFile('12_goals.md');
  const traumas = readFile('10_traumas.md');

  // Combinações de identidade + personalidade
  if (identity && personality) {
    const nomeMatch = identity.match(/Nome\s+(.+)/);
    const nome = nomeMatch ? nomeMatch[1].trim() : 'Ophilia Clement';

    examples.push(...generateVariations(
      [
        `Quem é ${nome}?`,
        `Me fale sobre ${nome}.`,
        `${nome} é quem?`,
        `Descreva ${nome} para mim.`
      ],
      `${identity}\n\n${personality}`
    ));
  }

  // Combinações de história + personalidade
  if (history && personality) {
    examples.push(...generateVariations(
      [
        'Como seu passado moldou quem você é?',
        'Sua história influenciou sua personalidade?',
        'Como seus eventos de vida te tornaram quem você é?'
      ],
      `${history}\n\n${personality}`
    ));
  }

  // Combinações de traumas + personalidade
  if (traumas && personality) {
    examples.push(...generateVariations(
      [
        'Como seus traumas afetaram sua personalidade?',
        'Seus traumas mudaram quem você é?',
        'Qual a relação entre seus traumas e sua personalidade?'
      ],
      `${traumas}\n\n${personality}`
    ));
  }

  // Combinações de valores + fala
  if (values && speech) {
    examples.push(...generateVariations(
      [
        'Como seus valores aparecem na sua forma de falar?',
        'Seus valores influenciam como você fala?',
        'Sua fala reflete seus valores?'
      ],
      `${values}\n\n${speech}`
    ));
  }

  // Combinações de objetivos + história
  if (goals && history) {
    examples.push(...generateVariations(
      [
        'Como sua história levou aos seus objetivos?',
        'Seus objetivos vêm do seu passado?',
        'O que na sua história te motivou a buscar seus objetivos?'
      ],
      `${goals}\n\n${history}`
    ));
  }

  // Resumo completo do personagem
  const allContent = [identity, summary, history, personality, values, goals].filter(Boolean).join('\n\n');
  if (allContent.trim()) {
    examples.push(...generateVariations(
      [
        'Me fale tudo sobre você.',
        'Quero conhecer você completamente.',
        'Se apresente de forma completa.',
        'Me conte tudo sobre quem você é.'
      ],
      allContent
    ));
  }

  return examples;
}

// =====================================================================
// EXECUTAR
// =====================================================================

convert();