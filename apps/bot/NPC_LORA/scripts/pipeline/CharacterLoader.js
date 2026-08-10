/**
 * CharacterLoader.js
 *
 * Detecta automaticamente todos os personagens existentes dentro de
 * NPC_LORA/dataset/ e carrega TODOS os arquivos de cada personagem.
 *
 * O sistema é totalmente automático:
 * - Novos NPCs colocados em dataset/ são detectados sem alterar código
 * - Novos arquivos .md dentro de uma pasta de NPC são carregados automaticamente
 * - Qualquer extensão de arquivo é suportada (.md, .txt, etc.)
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { CharacterModel } = require('./CharacterModel');
const { CharacterParser } = require('./CharacterParser');

/**
 * Classe CharacterLoader
 *
 * Responsável por escanear a pasta dataset/ e carregar todos os personagens.
 */
class CharacterLoader {
  /**
   * @param {string} datasetPath - Caminho para a pasta dataset/
   */
  constructor(datasetPath) {
    this.datasetPath = datasetPath;
    this.characters = [];      // Array de CharacterModel
    this.errors = [];          // Erros globais
    this.warnings = [];        // Avisos globais
  }

  /**
   * Escaneia a pasta dataset/ e retorna a lista de pastas de personagens.
   *
   * @returns {Array} Lista de nomes de pastas (ex: ['ophilia_clement', 'therion'])
   */
  detectCharacters() {
    if (!fs.existsSync(this.datasetPath)) {
      this.errors.push(`Diretório dataset não encontrado: ${this.datasetPath}`);
      return [];
    }

    const entries = fs.readdirSync(this.datasetPath, { withFileTypes: true });

    // Filtrar apenas diretórios (pastas de personagens)
    const characterDirs = entries
      .filter(entry => entry.isDirectory())
      .map(entry => entry.name)
      .sort();

    // Ignorar pastas que começam com _ (ex: _TEMPLATE)
    const filtered = characterDirs.filter(name => !name.startsWith('_'));

    return filtered;
  }

  /**
   * Carrega um único personagem a partir de sua pasta.
   *
   * @param {string} characterName - Nome da pasta do personagem
   * @returns {CharacterModel} Modelo do personagem carregado
   */
  loadCharacter(characterName) {
    const charDir = path.join(this.datasetPath, characterName);

    if (!fs.existsSync(charDir)) {
      const error = `Pasta do personagem não encontrada: ${charDir}`;
      this.errors.push(error);
      const model = new CharacterModel(characterName, charDir);
      model.errors.push(error);
      return model;
    }

    const model = new CharacterModel(characterName, charDir);
    model.loadedAt = new Date().toISOString();

    // Listar todos os arquivos na pasta do personagem
    let files;
    try {
      files = fs.readdirSync(charDir)
        .filter(f => fs.statSync(path.join(charDir, f)).isFile())
        .sort();
    } catch (err) {
      model.errors.push(`Erro ao ler diretório: ${err.message}`);
      return model;
    }

    if (files.length === 0) {
      model.warnings.push('Nenhum arquivo encontrado na pasta do personagem');
      return model;
    }

    // Carregar cada arquivo
    for (const fileName of files) {
      const filePath = path.join(charDir, fileName);

      // Ler o arquivo
      const { content, size, error } = CharacterParser.readFile(filePath);

      if (error) {
        model.errors.push(`Erro ao ler ${fileName}: ${error}`);
        continue;
      }

      // Adicionar ao modelo
      model.addFile(fileName, filePath, content, size);

      // Avisar se o arquivo estiver vazio
      if (size === 0 || content.trim().length === 0) {
        model.warnings.push(`Arquivo vazio: ${fileName}`);
      }
    }

    return model;
  }

  /**
   * Carrega TODOS os personagens encontrados em dataset/.
   *
   * @returns {Array} Array de CharacterModel
   */
  loadAll() {
    this.characters = [];
    this.errors = [];
    this.warnings = [];

    const characterNames = this.detectCharacters();

    if (characterNames.length === 0) {
      this.warnings.push('Nenhum personagem encontrado em dataset/');
      return [];
    }

    for (const name of characterNames) {
      const model = this.loadCharacter(name);
      this.characters.push(model);

      // Coletar erros e avisos globais
      if (model.errors.length > 0) {
        this.errors.push(...model.errors.map(e => `[${name}] ${e}`));
      }
      if (model.warnings.length > 0) {
        this.warnings.push(...model.warnings.map(w => `[${name}] ${w}`));
      }
    }

    return this.characters;
  }

  /**
   * Retorna um personagem específico pelo nome.
   *
   * @param {string} name - Nome da pasta do personagem
   * @returns {CharacterModel|null}
   */
  getCharacter(name) {
    return this.characters.find(c => c.name === name) || null;
  }

  /**
   * Retorna a lista de nomes de todos os personagens carregados.
   */
  getCharacterNames() {
    return this.characters.map(c => c.name);
  }

  /**
   * Retorna o número total de personagens carregados.
   */
  getCharacterCount() {
    return this.characters.length;
  }

  /**
   * Retorna um resumo geral do carregamento.
   */
  getSummary() {
    return {
      datasetPath: this.datasetPath,
      totalCharacters: this.characters.length,
      totalFiles: this.characters.reduce((sum, c) => sum + c.getFileCount(), 0),
      totalEmptyFiles: this.characters.reduce((sum, c) => sum + c.getEmptyFileCount(), 0),
      totalErrors: this.errors.length,
      totalWarnings: this.warnings.length,
      characters: this.characters.map(c => c.getSummary()),
    };
  }
}

module.exports = { CharacterLoader };