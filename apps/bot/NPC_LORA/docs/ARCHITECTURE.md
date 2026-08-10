# Arquitetura do Pipeline da LoRA de NPCs

## Visão Geral

O pipeline é um sistema modular e reutilizável que gerencia o ciclo de vida de datasets de personagens para treinamento de LoRA. Ele detecta automaticamente personagens, carrega seus arquivos, parseia o conteúdo, valida a estrutura e prepara os dados para futura geração de dataset JSONL.

### Princípios de Design

1. **Detecção Automática** — Novos NPCs colocados em `dataset/` são detectados sem alterar código
2. **Parser Modular** — Cada arquivo é transformado em uma estrutura organizada em memória
3. **Validação Completa** — Verifica arquivos faltando, vazios, erros de leitura e estrutura inválida
4. **Extensibilidade** — Novos tipos de arquivo são automaticamente suportados
5. **Reutilização** — Todo o código é reutilizável para qualquer NPC

---

## Estrutura de Arquivos

```
NPC_LORA/
│
├── dataset/                          # Pastas de personagens
│   ├── _TEMPLATE/                   # Template vazio (ignorado pelo pipeline)
│   └── ophilia_clement/             # Personagem
│       ├── 01_identity.md
│       ├── 02_summary.md
│       ├── ...
│       └── 18_scene_examples.md
│
├── output/                           # Saída de datasets JSONL
│   └── ophilia_clement_dataset.jsonl
│
├── scripts/
│   ├── convert_to_jsonl.js           # Conversor de Markdown para JSONL
│   └── pipeline/                     # Pipeline modular
│       ├── index.js                  # Entry point
│       ├── Pipeline.js               # Orquestrador principal
│       ├── CharacterLoader.js        # Detector e carregador de NPCs
│       ├── CharacterParser.js        # Parser de conteúdo
│       ├── CharacterModel.js         # Modelo de dados
│       └── Validator.js              # Sistema de validação
│
├── logs/                             # Relatórios de validação
├── checkpoints/                      # Checkpoints de treinamento
├── configs/                          # Configurações de treinamento
├── models/                           # Modelos treinados
└── docs/                             # Documentação
    ├── DATASET_SPECIFICATION.md      # Especificação do dataset
    └── ARCHITECTURE.md               # Este arquivo
```

---

## Componentes

### 1. CharacterModel (`CharacterModel.js`)

**Responsabilidade:** Definir a estrutura de dados de um personagem carregado.

**Características:**
- Mapeia nomes de arquivo para propriedades (ex: `01_identity.md` → `identity`)
- Armazena metadados de cada arquivo (nome, caminho, conteúdo, tamanho, vazio?)
- Suporta propriedades dinâmicas — novos arquivos são automaticamente mapeados
- Fornece métodos de consulta (has, get, getProperties, getSummary, toJSON)

**Estrutura em memória:**
```
CharacterModel
├── name: string                    # Nome da pasta (ex: ophilia_clement)
├── dirPath: string                 # Caminho completo
├── files: Object                   # Metadados de cada arquivo
│   ├── identity: { fileName, filePath, content, size, isEmpty }
│   ├── summary: { ... }
│   ├── history: { ... }
│   └── ...
├── identity: string                 # Conteúdo direto (atalho)
├── summary: string                  # Conteúdo direto (atalho)
├── ...
├── errors: Array                    # Erros de carregamento
└── warnings: Array                 # Avisos (arquivos vazios, etc.)
```

### 2. CharacterParser (`CharacterParser.js`)

**Responsabilidade:** Ler e parsear arquivos de texto em estruturas organizadas.

**Funcionalidades:**
- `readFile(filePath)` — Lê um arquivo e retorna conteúdo, tamanho e erro
- `parse(content)` — Parseia conteúdo em seções, bullets, parágrafos e linhas
- `extractKeyValuePairs(content, keys)` — Extrai pares chave-valor
- `extractBullets(content)` — Extrai bullet points
- `extractNamedSections(content)` — Extrai seções nomeadas
- `getStats(content)` — Retorna estatísticas (palavras, linhas, bullets, seções, parágrafos)
- `isEmpty(content)` — Verifica se conteúdo está vazio

**Estrutura de saída do parse:**
```
{
  raw: string,           # Conteúdo bruto
  sections: Array,       # Seções (headers markdown)
  bullets: Array,        # Bullet points (•, -, *)
  paragraphs: Array,     # Parágrafos de texto corrido
  lines: Array,          # Linhas não vazias
  wordCount: number,     # Total de palavras
  lineCount: number,     # Total de linhas
}
```

### 3. CharacterLoader (`CharacterLoader.js`)

**Responsabilidade:** Detectar e carregar todos os personagens em `dataset/`.

**Características:**
- `detectCharacters()` — Escaneia `dataset/` e retorna lista de pastas de personagens
- `loadCharacter(name)` — Carrega um personagem específico
- `loadAll()` — Carrega todos os personagens encontrados
- Ignora pastas que começam com `_` (ex: `_TEMPLATE`)
- Carrega qualquer tipo de arquivo (`.md`, `.txt`, etc.)
- Coleta erros e avisos globais

**Fluxo de carregamento:**
1. Escanear `dataset/` em busca de diretórios
2. Filtrar pastas que começam com `_`
3. Para cada pasta, listar todos os arquivos
4. Ler cada arquivo e adicionar ao `CharacterModel`
5. Registrar erros e avisos

### 4. Validator (`Validator.js`)

**Responsabilidade:** Validar personagens carregados e gerar relatórios.

**Verificações:**
- **Arquivos faltando** — Compara com lista de arquivos esperados do template
- **Arquivos vazios** — Identifica arquivos sem conteúdo
- **Erros de leitura** — Registra erros encontrados durante o carregamento
- **Estrutura inválida** — Verifica se o conteúdo tem pelo menos 3 palavras
- **Identidade obrigatória** — Verifica se o personagem tem arquivo de identidade válido
- **Arquivos inesperados** — Identifica arquivos não padrão (mas ainda os carrega)

**Relatório gerado:**
```
═══════════════════════════════════════════════════════════════
              RELATÓRIO DE VALIDAÇÃO DO DATASET
═══════════════════════════════════════════════════════════════

Personagens encontrados: 1
Personagens válidos:     1
Personagens inválidos:   0
Total de erros:         0
Total de avisos:         0
Arquivos faltando:      0
Arquivos vazios:        0

─── ophilia_clement [✓ VÁLIDO] ───
  Arquivos: 18 total, 18 com conteúdo, 0 vazios
═══════════════════════════════════════════════════════════════
```

### 5. Pipeline (`Pipeline.js`)

**Responsabilidade:** Orquestrar todo o fluxo do pipeline.

**Etapas:**
1. **Inicializar** — Garantir que as pastas necessárias existem
2. **Carregar** — Detectar e carregar todos os personagens
3. **Validar** — Validar todos os personagens carregados
4. **Preparar** — Organizar dados para futura geração de dataset JSONL

**Métodos principais:**
- `run()` — Executa o pipeline completo
- `prepareForDatasetGeneration()` — Prepara dados sem gerar JSONL
- `generateReport()` — Gera relatório completo
- `saveValidationReport()` — Salva relatório em arquivo
- `getCharacter(name)` — Retorna um personagem específico
- `getCharacters()` — Retorna todos os personagens
- `getCharacterNames()` — Retorna lista de nomes

### 6. index.js (Entry Point)

**Responsabilidade:** Ponto de entrada para execução via linha de comando.

**Uso:**
```bash
# Executar pipeline completo
node scripts/pipeline/index.js

# Executar e salvar relatório de validação
node scripts/pipeline/index.js --report

# Apenas validar
node scripts/pipeline/index.js --validate
```

---

## Fluxo de Dados

```
dataset/
  └── ophilia_clement/
      ├── 01_identity.md          ─┐
      ├── 02_summary.md            │
      ├── 03_history.md            │
      ├── ...                      ├─→ CharacterLoader.loadAll()
      └── 18_scene_examples.md    ─┘          │
                                              ↓
                                    CharacterModel (por NPC)
                                              │
                                              ↓
                                    Validator.validateAll()
                                              │
                                              ↓
                                    Relatório de Validação
                                              │
                                              ↓
                                    Pipeline.prepareForDatasetGeneration()
                                              │
                                              ↓
                                    Dados preparados (para futura
                                    geração de JSONL)
```

---

## Como Adicionar um Novo NPC

1. Criar uma pasta em `dataset/` com o nome do personagem:
   ```
   dataset/novo_personagem/
   ```

2. Copiar os arquivos do template:
   ```
   dataset/novo_personagem/01_identity.md
   dataset/novo_personagem/02_summary.md
   ...
   dataset/novo_personagem/18_scene_examples.md
   ```

3. Preencher os arquivos com o conteúdo do personagem.

4. Executar o pipeline:
   ```bash
   node scripts/pipeline/index.js
   ```

**Nenhuma linha de código precisa ser modificada.** O sistema detecta automaticamente o novo personagem.

---

## Como Adicionar um Novo Tipo de Arquivo

1. Criar o arquivo dentro da pasta do personagem:
   ```
   dataset/ophilia_clement/19_new_file.md
   ```

2. O pipeline carregará automaticamente o arquivo e o mapeará para a propriedade `new_file`.

**Nenhuma alteração de código é necessária.** O parser é genérico e funciona com qualquer arquivo de texto.

---

## Arquivos Esperados no Template

O validador verifica a presença dos seguintes arquivos:

| # | Arquivo | Propriedade |
|---|---------|-------------|
| 01 | `01_identity.md` | `identity` |
| 02 | `02_summary.md` | `summary` |
| 03 | `03_history.md` | `history` |
| 04 | `04_personality.md` | `personality` |
| 05 | `05_interpretation.md` | `interpretation` |
| 06 | `06_speech.md` | `speech` |
| 07 | `07_values.md` | `values` |
| 08 | `08_likes.md` | `likes` |
| 09 | `09_dislikes.md` | `dislikes` |
| 10 | `10_traumas.md` | `traumas` |
| 11 | `11_relationships.md` | `relationships` |
| 12 | `12_goals.md` | `goals` |
| 13 | `13_knowledge.md` | `knowledge` |
| 14 | `14_curiosities.md` | `curiosities` |
| 15 | `15_narrative_gaps.md` | `narrative_gaps` |
| 16 | `16_absolute_rules.md` | `absolute_rules` |
| 17 | `17_dialog_examples.md` | `dialog_examples` |
| 18 | `18_scene_examples.md` | `scene_examples` |

Arquivos adicionais (fora desta lista) são carregados mas marcados como "não padrão" no relatório.

---

## Preparação para Geração de Dataset

O método `prepareForDatasetGeneration()` retorna uma estrutura pronta para consumo:

```
{
  totalCharacters: number,
  totalFiles: number,
  characters: [
    {
      name: string,
      dirPath: string,
      files: {
        identity: { fileName, filePath, content, stats },
        summary: { ... },
        ...
      }
    }
  ]
}
```

Esta estrutura pode ser consumida por uma futura etapa de geração de JSONL sem precisar reler os arquivos do disco.

---

## Dependências

O pipeline não possui dependências externas. Usa apenas módulos nativos do Node.js:
- `fs` — Sistema de arquivos
- `path` — Manipulação de caminhos

---

## Compatibilidade

- **Node.js** 12+ (recomendado 14+)
- **Sistema Operacional** Windows, Linux, macOS
- **Encoding** UTF-8