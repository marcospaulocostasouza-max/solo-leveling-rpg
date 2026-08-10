/**
 * CharacterParser.js
 *
 * Parser modular que transforma o conteúdo de cada arquivo .md
 * em uma estrutura organizada em memória.
 *
 * O parser é genérico e funciona com qualquer arquivo de texto.
 * Ele identifica seções, bullet points, parágrafos e blocos de texto.
 *
 * Novos tipos de arquivo são automaticamente suportados sem alteração de código.
 */

'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Classe CharacterParser
 *
 * Responsável por ler e parsear arquivos de um personagem.
 */
class CharacterParser {
  /**
   * Lê um arquivo e retorna seu conteúdo bruto.
   *
   * @param {string} filePath - Caminho completo do arquivo
   * @returns {Object} { content, size, error }
   */
  static readFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const stats = fs.statSync(filePath);
      return {
        content,
        size: stats.size,
        error: null,
      };
    } catch (err) {
      return {
        content: '',
        size: 0,
        error: err.message,
      };
    }
  }

  /**
   * Parseia o conteúdo de um arquivo em uma estrutura organizada.
   *
   * Estrutura retornada:
   * {
   *   raw: string,           // Conteúdo bruto
   *   sections: Array,       // Seções identificadas por headers
   *   bullets: Array,        // Bullet points (•, -, *)
   *   paragraphs: Array,     // Parágrafos de texto corrido
   *   lines: Array,          // Linhas individuais
   *   wordCount: number,     // Contagem de palavras
   *   lineCount: number,     // Contagem de linhas
   * }
   *
   * @param {string} content - Conteúdo do arquivo
   * @returns {Object} Estrutura parseada
   */
  static parse(content) {
    if (!content || content.trim().length === 0) {
      return {
        raw: '',
        sections: [],
        bullets: [],
        paragraphs: [],
        lines: [],
        wordCount: 0,
        lineCount: 0,
      };
    }

    const lines = content.split(/\r?\n/);
    const sections = [];
    const bullets = [];
    const paragraphs = [];
    let currentSection = null;
    let currentParagraph = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Detectar seções (linhas que começam com # ou --- ou que parecem títulos)
      const headerMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);

      // Detectar separadores (---)
      const isSeparator = /^-{3,}$/.test(trimmed) || /^={3,}$/.test(trimmed) || /^═{3,}$/.test(trimmed);

      // Detectar bullet points (•, -, *, seguidos de espaço)
      const bulletMatch = trimmed.match(/^[•\-\*]\s+(.+)/);

      if (headerMatch) {
        // Salvar parágrafo anterior se existir
        if (currentParagraph.length > 0) {
          paragraphs.push(currentParagraph.join(' '));
          currentParagraph = [];
        }

        currentSection = {
          level: headerMatch[1].length,
          title: headerMatch[2].trim(),
          line: i,
          content: [],
        };
        sections.push(currentSection);
      } else if (isSeparator && sections.length > 0) {
        // Separador — finaliza a seção atual
        if (currentParagraph.length > 0) {
          paragraphs.push(currentParagraph.join(' '));
          currentParagraph = [];
        }
        currentSection = null;
      } else if (bulletMatch) {
        // Salvar parágrafo anterior se existir
        if (currentParagraph.length > 0) {
          paragraphs.push(currentParagraph.join(' '));
          currentParagraph = [];
        }

        const bullet = {
          text: bulletMatch[1].trim(),
          line: i,
        };
        bullets.push(bullet);

        if (currentSection) {
          currentSection.content.push({ type: 'bullet', text: bullet.text, line: i });
        }
      } else if (trimmed.length > 0) {
        // Texto corrido — adicionar ao parágrafo atual
        currentParagraph.push(trimmed);

        if (currentSection) {
          currentSection.content.push({ type: 'text', text: trimmed, line: i });
        }
      } else {
        // Linha vazia — finalizar parágrafo
        if (currentParagraph.length > 0) {
          paragraphs.push(currentParagraph.join(' '));
          currentParagraph = [];
        }
      }
    }

    // Finalizar último parágrafo
    if (currentParagraph.length > 0) {
      paragraphs.push(currentParagraph.join(' '));
    }

    // Contar palavras
    const wordCount = content.split(/\s+/).filter(w => w.length > 0).length;

    return {
      raw: content,
      sections,
      bullets,
      paragraphs,
      lines: lines.filter(l => l.trim().length > 0),
      wordCount,
      lineCount: lines.length,
    };
  }

  /**
   * Extrai pares chave-valor de um conteúdo (ex: "Nome Ophilia Clement").
   * Útil para arquivos de identidade.
   *
   * @param {string} content - Conteúdo do arquivo
   * @param {Array} keys - Lista de chaves conhecidas (ex: ['Nome', 'Idade', 'Raça'])
   * @returns {Object} Pares chave-valor
   */
  static extractKeyValuePairs(content, keys) {
    const result = {};

    for (const key of keys) {
      // Procurar "Key value" na mesma linha
      const regex = new RegExp(`^${key}\\s+(.+)$`, 'im');
      const match = content.match(regex);
      if (match) {
        result[key] = match[1].trim();
      }
    }

    return result;
  }

  /**
   * Extrai todos os bullet points de um conteúdo.
   *
   * @param {string} content - Conteúdo do arquivo
   * @returns {Array} Lista de textos dos bullet points
   */
  static extractBullets(content) {
    const parsed = CharacterParser.parse(content);
    return parsed.bullets.map(b => b.text);
  }

  /**
   * Extrai seções nomeadas (ex: "Infância e Adolescência" seguido de texto).
   *
   * @param {string} content - Conteúdo do arquivo
   * @returns {Object} { sectionName: content }
   */
  static extractNamedSections(content) {
    const parsed = CharacterParser.parse(content);
    const result = {};

    for (const section of parsed.sections) {
      result[section.title] = section.content
        .map(c => c.text)
        .join('\n');
    }

    return result;
  }

  /**
   * Verifica se um conteúdo está vazio.
   *
   * @param {string} content - Conteúdo do arquivo
   * @returns {boolean}
   */
  static isEmpty(content) {
    return !content || content.trim().length === 0;
  }

  /**
   * Retorna estatísticas de um conteúdo.
   *
   * @param {string} content - Conteúdo do arquivo
   * @returns {Object} { wordCount, lineCount, bulletCount, sectionCount, paragraphCount }
   */
  static getStats(content) {
    const parsed = CharacterParser.parse(content);
    return {
      wordCount: parsed.wordCount,
      lineCount: parsed.lineCount,
      bulletCount: parsed.bullets.length,
      sectionCount: parsed.sections.length,
      paragraphCount: parsed.paragraphs.length,
    };
  }
}

module.exports = { CharacterParser };