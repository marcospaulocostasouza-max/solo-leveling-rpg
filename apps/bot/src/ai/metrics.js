const fs = require('fs');
const path = require('path');
const LOG_FILE = path.resolve(__dirname, '..', '..', 'logs', 'ai-performance.jsonl');

function report(data) {
  const line = {
    at: new Date().toISOString(), npc: data.npcId, cache: data.context.metrics.npcCache,
    retrievalMs: data.retrievalMs, contextMs: data.context.metrics.contextMs, promptMs: data.promptMs,
    pipelineMs: data.pipelineMs, qwenMs: data.qwenMs, totalMs: data.totalMs,
    inputTokens: data.prompt.tokens, outputTokens: data.outputTokens, thinking: data.thinking ?? false,
    files: data.context.metrics.sourceFiles, memories: data.context.memories.map(item => item.id), blocks: data.prompt.blocks
  };
  console.log(`[AI] Pipeline ${line.pipelineMs} ms | Qwen ${line.qwenMs} ms | Total ${line.totalMs} ms | input ~${line.inputTokens} tok | output ~${line.outputTokens} tok | cache ${line.cache}`);
  console.log(`[AI] Contexto: ${JSON.stringify(line.blocks)} | memórias: ${line.memories.length} | arquivos: ${line.files.length}`);
  try { fs.appendFileSync(LOG_FILE, `${JSON.stringify(line)}\n`, 'utf8'); } catch (error) { console.error('[AI] Performance log:', error.message); }
  return line;
}
module.exports = { report };
