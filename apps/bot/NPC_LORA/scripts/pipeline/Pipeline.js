/**
 * Pipeline.js
 *
 * Orquestra todo o fluxo do pipeline da LoRA:
 * 1. Detecta personagens em dataset/
 * 2. Carrega todos os arquivos de cada personagem
 * 3. Valida a estrutura de cada personagem
 * 4. Prepara os dados para futura geração de dataset JSONL
 *
 * Nesta etapa NÃO gera JSONL — apenas deixa tudo preparado.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { CharacterLoader } = require('./CharacterLoader');
const { CharacterParser } = require('./CharacterParser');
const { Validator } = require('./Validator');

/**
 * Classe Pipeline
 *
 * Ponto de entrada principal do sistema de pipeline da LoRA.
 */
class Pipeline {
  /**
   * @param {Object} options - Configurações do pipeline
   * @param {string} options.basePath - Caminho base do projeto NPC_LORA
   * @param {string} options.datasetPath - Caminho para a pasta dataset/
   * @param {string} options.outputPath - Caminho para a pasta output/
   * @param {string} options.logsPath - Caminho para a pasta logs/
   */
  constructor(options = {}) {
    // Caminhos padrão baseados na localização deste arquivo
    const defaultBase = path.resolve(__dirname, '..', '..');

    this.basePath = options.basePath || defaultBase;
    this.datasetPath = options.datasetPath || path.join(this.basePath, 'dataset');
    this.outputPath = options.outputPath || path.join(this.basePath, 'output');
    this.logsPath = options.logsPath || path.join(this.basePath, 'logs');

    // Componentes
    this.loader = new CharacterLoader(this.datasetPath);
    this.validator = new Validator();
    this.characters = [];
    this.validationReport = null;

    // Estado
    this.initialized = false;
  }

  /**
   * Inicializa o pipeline — garante que as pastas necessárias existem.
   */
  initialize() {
    // Garantir que as pastas existem
    const dirs = [this.datasetPath, this.outputPath, this.logsPath];
    for (const dir of dirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }

    this.initialized = true;
    return this;
  }

  /**
   * Executa o pipeline completo:
   * 1. Carrega todos os personagens
   * 2. Valida todos os personagens
   * 3. Retorna o relatório
   *
   * @returns {Object} Relatório completo do pipeline
   */
  run() {
    if (!this.initialized) {
      this.initialize();
    }

    console.log('[Pipeline] Iniciando execução...');
    console.log(`[Pipeline] Dataset: ${this.datasetPath}`);
    console.log(`[Pipeline] Output: ${this.outputPath}`);
    console.log('');

    // Etapa 1: Detectar e carregar personagens
    console.log('[Pipeline] Etapa 1: Detectando e carregando personagens...');
    this.characters = this.loader.loadAll();
    console.log(`[Pipeline] ${this.loader.getCharacterCount()} personagem(ns) carregado(s)`);

    for (const char of this.characters) {
      const status = char.errors.length > 0 ? 'ERRO' : 'OK';
      console.log(`  [${char.name}] ${char.getFileCount()} arquivos, ${char.getNonEmptyFileCount()} com conteúdo, ${char.getEmptyFileCount()} vazios [${status}]`);
    }
    console.log('');

    // Etapa 2: Validar personagens
    console.log('[Pipeline] Etapa 2: Validando personagens...');
    this.validationReport = this.validator.validateAll(this.characters);

    const summary = this.validationReport.summary;
    console.log(`[Pipeline] Validação concluída:`);
    console.log(`  Válidos: ${summary.validCharacters}/${summary.totalCharacters}`);
    console.log(`  Erros: ${summary.totalErrors}`);
    console.log(`  Avisos: ${summary.totalWarnings}`);
    console.log(`  Arquivos faltando: ${summary.totalMissingFiles}`);
    console.log(`  Arquivos vazios: ${summary.totalEmptyFiles}`);
    console.log('');

    // Etapa 3: Preparar dados para futura geração de dataset
    console.log('[Pipeline] Etapa 3: Preparando dados para geração de dataset...');
    const preparedData = this.prepareForDatasetGeneration();
    console.log(`[Pipeline] Dados preparados: ${preparedData.totalCharacters} personagens, ${preparedData.totalFiles} arquivos com conteúdo`);
    console.log('');

    // Gerar relatório final
    const report = this.generateReport();
    console.log('[Pipeline] Relatório gerado.');
    console.log('[Pipeline] Execução concluída.');

    return report;
  }

  /**
   * Prepara os dados carregados para futura geração de dataset JSONL.
   *
   * NÃO gera JSONL — apenas organiza os dados em uma estrutura
   * que uma futura etapa pode consumir.
   *
   * @returns {Object} Dados preparados
   */
  prepareForDatasetGeneration() {
    const preparedCharacters = [];

    for (const character of this.characters) {
      const prepared = {
        name: character.name,
        dirPath: character.dirPath,
        files: {},
      };

      for (const [prop, meta] of Object.entries(character.files)) {
        if (!meta.isEmpty) {
          prepared.files[prop] = {
            fileName: meta.fileName,
            filePath: meta.filePath,
            content: meta.content,
            stats: CharacterParser.getStats(meta.content),
          };
        }
      }

      preparedCharacters.push(prepared);
    }

    return {
      totalCharacters: preparedCharacters.length,
      totalFiles: preparedCharacters.reduce((sum, c) => sum + Object.keys(c.files).length, 0),
      characters: preparedCharacters,
    };
  }

  /**
   * Gera um relatório completo do pipeline.
   */
  generateReport() {
    return {
      timestamp: new Date().toISOString(),
      paths: {
        base: this.basePath,
        dataset: this.datasetPath,
        output: this.outputPath,
        logs: this.logsPath,
      },
      loading: this.loader.getSummary(),
      validation: this.validationReport,
      characters: this.characters.map(c => ({
        name: c.name,
        files: c.getProperties().map(p => ({
          property: p,
          label: c.getLabel(p),
          fileName: c.files[p].fileName,
          size: c.files[p].size,
          isEmpty: c.files[p].isEmpty,
        })),
        errors: c.errors,
        warnings: c.warnings,
      })),
    };
  }

  /**
   * Salva o relatório de validação em arquivo.
   *
   * @param {string} fileName - Nome do arquivo (opcional)
   * @returns {string} Caminho do arquivo salvo
   */
  saveValidationReport(fileName = null) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportName = fileName || `validation_report_${timestamp}.txt`;
    const reportPath = path.join(this.logsPath, reportName);

    if (!fs.existsSync(this.logsPath)) {
      fs.mkdirSync(this.logsPath, { recursive: true });
    }

    this.validator.saveReport(reportPath);
    console.log(`[Pipeline] Relatório salvo em: ${reportPath}`);

    return reportPath;
  }

  /**
   * Retorna um personagem específico pelo nome.
   */
  getCharacter(name) {
    return this.loader.getCharacter(name);
  }

  /**
   * Retorna todos os personagens carregados.
   */
  getCharacters() {
    return this.characters;
  }

  /**
   * Retorna a lista de nomes de personagens.
   */
  getCharacterNames() {
    return this.loader.getCharacterNames();
  }
}

module.exports = { Pipeline };