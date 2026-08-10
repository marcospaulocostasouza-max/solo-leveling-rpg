/**
 * SCRIPT DE CORREÇÃO DO OLLAMA SERVICE
 * 
 * Corrige dois problemas que causam a mensagem "Não consegui responder no momento":
 * 1. Cache de respostas vazias
 * 2. extrairResposta removendo todo o conteúdo
 */

const fs = require('fs');
const path = require('path');

const arquivoPath = path.join(__dirname, '..', 'src', 'ia', 'ollamaService.js');
let conteudo = fs.readFileSync(arquivoPath, 'utf8');

// =====================================
// CORREÇÃO 1: Não cachear respostas vazias + Fallback
// =====================================

// Substituir a linha que extrai a resposta
const buscaExtrair = `const textoCompleto = resposta.data.response;
            const textoFinal = this.extrairResposta(textoCompleto, opcoes.thinking ?? false);`;

const substituiExtrair = `const textoCompleto = resposta.data.response || '';
            let textoFinal = this.extrairResposta(textoCompleto, opcoes.thinking ?? false);
            
            // FALLBACK: Se a extração removeu todo o conteúdo, usar o texto original
            if (!textoFinal && textoCompleto) {
                console.warn('[OllamaService] extrairResposta removeu todo o conteúdo. Usando texto original como fallback.');
                textoFinal = textoCompleto.trim();
            }`;

if (conteudo.includes(buscaExtrair)) {
    conteudo = conteudo.replace(buscaExtrair, substituiExtrair);
    console.log('✓ Correção 1 aplicada: Fallback quando extrairResposta remove todo o conteúdo');
} else {
    console.log('✗ Correção 1 não foi necessária (texto não encontrado)');
}

// =====================================
// CORREÇÃO 2: Não cachear respostas vazias
// =====================================

const buscaCache = `// Salvar no cache
            this.salvarCache(chaveCache, resultado);`;

const substituiCache = `// Salvar no cache APENAS se a resposta não for vazia
            if (textoFinal && textoFinal.length > 0) {
                this.salvarCache(chaveCache, resultado);
            } else {
                console.warn('[OllamaService] Resposta vazia não foi cacheada. Modelo pode estar sobrecarregado.');
            }`;

if (conteudo.includes(buscaCache)) {
    conteudo = conteudo.replace(buscaCache, substituiCache);
    console.log('✓ Correção 2 aplicada: Respostas vazias não são mais cacheadas');
} else {
    console.log('✗ Correção 2 não foi necessária (texto não encontrado)');
}

// =====================================
// CORREÇÃO 3: Limpar cache ao iniciar
// =====================================

const buscaLimparCache = `// =====================================
// INSTÂNCIA SINGLETON
// =====================================

const ollamaService = new OllamaService();`;

const substituiLimparCache = `// =====================================
// INSTÂNCIA SINGLETON
// =====================================

const ollamaService = new OllamaService();

// Limpar cache ao iniciar para evitar respostas vazias cacheadas
ollamaService.limparCache();
console.log('[OllamaService] Cache limpo na inicialização.');`;

if (conteudo.includes(buscaLimparCache)) {
    conteudo = conteudo.replace(buscaLimparCache, substituiLimparCache);
    console.log('✓ Correção 3 aplicada: Cache limpo na inicialização');
} else {
    console.log('✗ Correção 3 não foi necessária (texto não encontrado)');
}

// Salvar arquivo
fs.writeFileSync(arquivoPath, conteudo, 'utf8');
console.log('\n✓ Arquivo ollamaService.js corrigido com sucesso!');
console.log('  As seguintes correções foram aplicadas:');
console.log('  1. Fallback quando extrairResposta remove todo o conteúdo');
console.log('  2. Respostas vazias não são mais cacheadas');
console.log('  3. Cache é limpo na inicialização');
console.log('\n  Isso deve resolver a mensagem "Não consegui responder no momento".');