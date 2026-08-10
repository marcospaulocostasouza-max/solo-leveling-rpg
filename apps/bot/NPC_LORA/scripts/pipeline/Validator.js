/**
 * Validator.js
 *
 * Sistema de validação que verifica:
 * - Arquivos faltando (comparando com o template esperado)
 * - Arquivos vazios
 * - Erros de leitura
 * - Estrutura inválida
 *
 * Gera um relatório detalhado de validação.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { CharacterParser } = require('./CharacterParser');

/**
 * Lista de arquivos esperados no template padrão.
 * Se um personagem não tiver um destes arquivos, será marcado como faltando.
 *
 * NOTA: Esta lista pode ser estendida no futuro.
 * Arquivos não listados aqui ainda são carregados, mas não geram aviso de "faltando".
 */
const EXPECTED_FILES = [
  '01_identity.md',
  '02_summary.md',
  '03_history.md',
  '04_personality.md',
  '05_interpretation.md',
  '06_speech.md',
  '07_values.md',
  '08_likes.md',
  '09_dislikes.md',
  '10_traumas.md',
  '11_relationships.md',
  '12_goals.md',
  '13_knowledge.md',
  '14_curiosities.md',
  '15_narrative_gaps.md',
  '16_absolute_rules.md',
  '17_dialog_examples.md',
  '18_scene_examples.md',
];

/**
 * Classe Validator
 *
 * Valida personagens carregados e gera relatórios.
 */
class Validator {
  /**
   * @param {Array} expectedFiles - Lista de arquivos esperados (opcional)
   */
  constructor(expectedFiles = EXPECTED_FILES) {
    this.expectedFiles = expectedFiles;
    this.reports = [];
  }

  /**
   * Valida um único personagem.
   *
   * @param {CharacterModel} character - Personagem a validar
   * @returns {Object} Relatório de validação
   */
  validateCharacter(character) {
    const report = {
      character: character.name,
      valid: true,
      errors: [],
      warnings: [],
      info: [],
      stats: {
        totalFiles: character.getFileCount(),
        nonEmptyFiles: character.getNonEmptyFileCount(),
        emptyFiles: character.getEmptyFileCount(),
        missingFiles: [],
        unexpectedFiles: [],
      },
    };

    // 1. Verificar arquivos faltando
    const loadedFileNames = Object.values(character.files).map(f => f.fileName);
    for (const expected of this.expectedFiles) {
      if (!loadedFileNames.includes(expected)) {
        report.stats.missingFiles.push(expected);
        report.warnings.push(`Arquivo faltando: ${expected}`);
      }
    }

    // 2. Verificar arquivos inesperados (não no template, mas carregados)
    for (const fileName of loadedFileNames) {
      if (!this.expectedFiles.includes(fileName)) {
        report.stats.unexpectedFiles.push(fileName);
        report.info.push(`Arquivo não padrão carregado: ${fileName}`);
      }
    }

    // 3. Verificar arquivos vazios
    for (const [prop, meta] of Object.entries(character.files)) {
      if (meta.isEmpty) {
        report.warnings.push(`Arquivo vazio: ${meta.fileName}`);
      }
    }

    // 4. Verificar erros de leitura
    if (character.errors.length > 0) {
      for (const err of character.errors) {
        report.errors.push(err);
      }
    }

    // 5. Verificar estrutura do conteúdo (parse básico)
    for (const [prop, meta] of Object.entries(character.files)) {
      if (!meta.isEmpty) {
        const stats = CharacterParser.getStats(meta.content);

        // Verificar se o arquivo tem pelo menos algum conteúdo significativo
        if (stats.wordCount < 3) {
          report.warnings.push(`Conteúdo muito curto em ${meta.fileName} (${stats.wordCount} palavras)`);
        }
      }
    }

    // 6. Verificar se o personagem tem pelo menos identidade
    if (!character.has('identity') || (character.has('identity') && character.files.identity.isEmpty)) {
      report.errors.push('Personagem sem arquivo de identidade válido');
    }

    // Determinar validade geral
    if (report.errors.length > 0) {
      report.valid = false;
    }

    return report;
  }

  /**
   * Valida todos os personagens carregados.
   *
   * @param {Array} characters - Array de CharacterModel
   * @returns {Object} Relatório geral de validação
   */
  validateAll(characters) {
    this.reports = [];

    for (const character of characters) {
      const report = this.validateCharacter(character);
      this.reports.push(report);
    }

    return this.getGeneralReport();
  }

  /**
   * Gera um relatório geral consolidado.
   */
  getGeneralReport() {
    const totalCharacters = this.reports.length;
    const validCharacters = this.reports.filter(r => r.valid).length;
    const invalidCharacters = this.reports.filter(r => !r.valid).length;
    const totalErrors = this.reports.reduce((sum, r) => sum + r.errors.length, 0);
    const totalWarnings = this.reports.reduce((sum, r) => sum + r.warnings.length, 0);
    const totalMissingFiles = this.reports.reduce((sum, r) => sum + r.stats.missingFiles.length, 0);
    const totalEmptyFiles = this.reports.reduce((sum, r) => sum + r.stats.emptyFiles, 0);

    return {
      summary: {
        totalCharacters,
        validCharacters,
        invalidCharacters,
        totalErrors,
        totalWarnings,
        totalMissingFiles,
        totalEmptyFiles,
      },
      reports: this.reports,
    };
  }

  /**
   * Gera um relatório em formato de texto para exibição no console.
   */
  getTextReport() {
    const general = this.getGeneralReport();
    let output = '';

    output += '═══════════════════════════════════════════════════════════════\n';
    output += '              RELATÓRIO DE VALIDAÇÃO DO DATASET\n';
    output += '═══════════════════════════════════════════════════════════════\n\n';

    output += `Personagens encontrados: ${general.summary.totalCharacters}\n`;
    output += `Personagens válidos:     ${general.summary.validCharacters}\n`;
    output += `Personagens inválidos:   ${general.summary.invalidCharacters}\n`;
    output += `Total de erros:         ${general.summary.totalErrors}\n`;
    output += `Total de avisos:         ${general.summary.totalWarnings}\n`;
    output += `Arquivos faltando:      ${general.summary.totalMissingFiles}\n`;
    output += `Arquivos vazios:        ${general.summary.totalEmptyFiles}\n\n`;

    for (const report of this.reports) {
      const status = report.valid ? '✓ VÁLIDO' : '✗ INVÁLIDO';
      output += `─── ${report.character} [${status}] ───\n`;
      output += `  Arquivos: ${report.stats.totalFiles} total, ${report.stats.nonEmptyFiles} com conteúdo, ${report.stats.emptyFiles} vazios\n`;

      if (report.stats.missingFiles.length > 0) {
        output += `  Faltando: ${report.stats.missingFiles.join(', ')}\n`;
      }

      if (report.stats.unexpectedFiles.length > 0) {
        output += `  Extras:  ${report.stats.unexpectedFiles.join(', ')}\n`;
      }

      if (report.errors.length > 0) {
        output += `  Erros:\n`;
        for (const err of report.errors) {
          output += `    ✗ ${err}\n`;
        }
      }

      if (report.warnings.length > 0) {
        output += `  Avisos:\n`;
        for (const warn of report.warnings) {
          output += `    ⚠ ${warn}\n`;
        }
      }

      output += '\n';
    }

    output += '═══════════════════════════════════════════════════════════════\n';

    return output;
  }

  /**
   * Salva o relatório em arquivo.
   *
   * @param {string} outputPath - Caminho do arquivo de saída
   */
  saveReport(outputPath) {
    const textReport = this.getTextReport();
    fs.writeFileSync(outputPath, textReport, 'utf8');
    return outputPath;
  }
}

module.exports = { Validator, EXPECTED_FILES };