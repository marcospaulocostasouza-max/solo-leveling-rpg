/**
 * CharacterModel.js
 *
 * Define a estrutura de dados de um personagem carregado do dataset.
 * Cada arquivo .md do template é mapeado para uma propriedade deste modelo.
 *
 * O modelo é dinâmico — se novos arquivos forem adicionados ao template,
 * eles serão automaticamente carregados sem precisar modificar este código.
 */

'use strict';

const path = require('path');

/**
 * Mapeamento de nomes de arquivo para nomes de propriedade no modelo.
 * Ex: "01_identity.md" -> "identity"
 *
 * Novos arquivos seguem o padrão: NN_nome.md -> nome
 * Arquivos sem prefixo numérico (ex: personality_reference.txt) usam o nome direto.
 */
function fileNameToProperty(fileName) {
  // Remover extensão
  const baseName = path.basename(fileName, path.extname(fileName));

  // Se começa com número + underscore (ex: 01_identity), remover o prefixo
  const match = baseName.match(/^\d+_(.+)$/);
  if (match) {
    return match[1];
  }

  // Caso contrário, usar o nome direto (ex: personality_reference)
  return baseName;
}

/**
 * Mapeamento de propriedades para nomes amigáveis (para exibição em relatórios).
 */
const PROPERTY_LABELS = {
  identity: 'Identidade',
  summary: 'Resumo',
  history: 'História',
  personality: 'Personalidade',
  interpretation: 'Interpretação',
  speech: 'Forma de Falar',
  values: 'Valores',
  likes: 'Gostos',
  dislikes: 'Desgostos',
  traumas: 'Traumas',
  relationships: 'Relacionamentos',
  goals: 'Objetivos',
  knowledge: 'Conhecimentos',
  curiosities: 'Curiosidades',
  narrative_gaps: 'Lacunas Narrativas',
  absolute_rules: 'Regras Absolutas',
  dialog_examples: 'Exemplos de Diálogo',
  scene_examples: 'Exemplos de Cenas',
  personality_reference: 'Referência de Personalidade',
};

/**
 * Classe CharacterModel
 *
 * Representa um personagem completo carregado do dataset.
 */
class CharacterModel {
  /**
   * @param {string} name - Nome da pasta do personagem (ex: ophilia_clement)
   * @param {string} dirPath - Caminho completo para a pasta do personagem
   */
  constructor(name, dirPath) {
    this.name = name;
    this.dirPath = dirPath;

    // Metadados
    this.files = {};        // { propertyName: { fileName, filePath, content, size, isEmpty } }
    this.loadedAt = null;   // Timestamp de carregamento
    this.errors = [];       // Erros encontrados durante o carregamento
    this.warnings = [];     // Avisos (arquivos vazios, etc.)

    // Propriedades dinâmicas serão adicionadas via addFile()
  }

  /**
   * Adiciona um arquivo carregado ao modelo.
   *
   * @param {string} fileName - Nome do arquivo (ex: 01_identity.md)
   * @param {string} filePath - Caminho completo do arquivo
   * @param {string} content - Conteúdo do arquivo
   * @param {number} size - Tamanho em bytes
   */
  addFile(fileName, filePath, content, size) {
    const propertyName = fileNameToProperty(fileName);

    // Armazenar metadados do arquivo
    this.files[propertyName] = {
      fileName,
      filePath,
      content,
      size,
      isEmpty: size === 0 || content.trim().length === 0,
    };

    // Adicionar o conteúdo como propriedade direta do modelo
    this[propertyName] = content;
  }

  /**
   * Verifica se uma propriedade existe no modelo.
   */
  has(propertyName) {
    return this.files.hasOwnProperty(propertyName);
  }

  /**
   * Obtém o conteúdo de uma propriedade.
   */
  get(propertyName) {
    return this[propertyName] || null;
  }

  /**
   * Obtém o rótulo amigável de uma propriedade.
   */
  getLabel(propertyName) {
    return PROPERTY_LABELS[propertyName] || propertyName;
  }

  /**
   * Retorna a lista de todas as propriedades carregadas.
   */
  getProperties() {
    return Object.keys(this.files);
  }

  /**
   * Retorna a lista de propriedades que têm conteúdo.
   */
  getNonEmptyProperties() {
    return this.getProperties().filter(p => !this.files[p].isEmpty);
  }

  /**
   * Retorna a lista de propriedades vazias.
   */
  getEmptyProperties() {
    return this.getProperties().filter(p => this.files[p].isEmpty);
  }

  /**
   * Retorna o número total de arquivos carregados.
   */
  getFileCount() {
    return Object.keys(this.files).length;
  }

  /**
   * Retorna o número de arquivos com conteúdo.
   */
  getNonEmptyFileCount() {
    return this.getNonEmptyProperties().length;
  }

  /**
   * Retorna o número de arquivos vazios.
   */
  getEmptyFileCount() {
    return this.getEmptyProperties().length;
  }

  /**
   * Retorna um resumo do personagem.
   */
  getSummary() {
    return {
      name: this.name,
      dirPath: this.dirPath,
      totalFiles: this.getFileCount(),
      nonEmptyFiles: this.getNonEmptyFileCount(),
      emptyFiles: this.getEmptyFileCount(),
      errors: this.errors.length,
      warnings: this.warnings.length,
      properties: this.getProperties(),
    };
  }

  /**
   * Converte o modelo para um objeto serializável (para JSON).
   */
  toJSON() {
    const result = {
      name: this.name,
      dirPath: this.dirPath,
      loadedAt: this.loadedAt,
      files: {},
    };

    for (const [prop, meta] of Object.entries(this.files)) {
      result.files[prop] = {
        fileName: meta.fileName,
        size: meta.size,
        isEmpty: meta.isEmpty,
      };
      result[prop] = meta.content;
    }

    if (this.errors.length > 0) result.errors = this.errors;
    if (this.warnings.length > 0) result.warnings = this.warnings;

    return result;
  }
}

module.exports = { CharacterModel, fileNameToProperty, PROPERTY_LABELS };