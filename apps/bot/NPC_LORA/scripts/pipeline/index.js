/**
 * index.js
 *
 * Entry point do pipeline da LoRA de NPCs.
 *
 * Uso:
 *   node pipeline/index.js              — executa o pipeline completo
 *   node pipeline/index.js --report     — executa e salva relatório
 *   node pipeline/index.js --validate   — apenas valida
 *
 * Este script é reutilizável. Quando um novo NPC for colocado
 * dentro de dataset/, nenhuma linha de código precisa ser modificada.
 */

'use strict';

const path = require('path');
const fs = require('fs');
const { Pipeline } = require('./Pipeline');

// Parsear argumentos da linha de comando
const args = process.argv.slice(2);
const shouldSaveReport = args.includes('--report') || args.includes('-r');
const onlyValidate = args.includes('--validate') || args.includes('-v');

// Criar instância do pipeline
const pipeline = new Pipeline({
  basePath: path.resolve(__dirname, '..', '..'),
});

// Inicializar
pipeline.initialize();

// Executar
console.log('');
const report = pipeline.run();

// Salvar relatório de validação se solicitado
if (shouldSaveReport) {
  const reportPath = pipeline.saveValidationReport();
  console.log(`\nRelatório de validação salvo em: ${reportPath}`);
}

// Se apenas validação, exibir relatório detalhado
if (onlyValidate) {
  console.log('\n');
  console.log(pipeline.validator.getTextReport());
}

// Exibir resumo final
console.log('\n═══════════════════════════════════════════════════════════════');
console.log('RESUMO DO PIPELINE');
console.log('═══════════════════════════════════════════════════════════════');
console.log(`Personagens carregados: ${pipeline.getCharacterNames().length}`);
console.log(`Nomes: ${pipeline.getCharacterNames().join(', ') || 'Nenhum'}`);

const valSummary = pipeline.validationReport ? pipeline.validationReport.summary : null;
if (valSummary) {
  console.log(`Válidos: ${valSummary.validCharacters}/${valSummary.totalCharacters}`);
  console.log(`Erros: ${valSummary.totalErrors}`);
  console.log(`Avisos: ${valSummary.totalWarnings}`);
}
console.log('═══════════════════════════════════════════════════════════════\n');

// Exportar para uso como módulo
module.exports = { Pipeline };