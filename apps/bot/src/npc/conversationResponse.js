const {formatarMensagem}=require('../utils/messageFormatter');
async function obterResposta({primary, fallback, npc, emotion, onFallback=()=>{}}) {
    let response;
    try { response=await primary(); }
    catch(error) {
        if(error.code==='NARRATIVE_INVALID') throw error;
        onFallback(error);
        // A rota legada já retorna uma mensagem com moldura.
        return formatarMensagem(npc,await fallback());
    }
    if(!response) return response;
    let state=null;
    try { state=await emotion(); }
    catch(error) { console.error('[NPC_CONVERSA] Estado emocional indisponível:',error.message); }
    // Erros após gerar/salvar não acionam outra geração.
    return formatarMensagem(npc,response,state);
}
function mensagemErro(error) {
    if(error.code==='NARRATIVE_INVALID') return 'A resposta do NPC não passou pela validação e foi descartada. Tente novamente; a resposta inválida não foi salva.';
    if(['ECONNREFUSED','ECONNRESET','ENOTFOUND'].includes(error.code)) return 'Não consegui conectar à IA agora. Verifique se o Ollama está disponível e tente novamente.';
    if(['ETIMEDOUT','ECONNABORTED'].includes(error.code)) return 'A IA demorou demais para responder. Tente novamente.';
    return 'Ocorreu um erro durante a conversa. Tente novamente.';
}
module.exports={obterResposta,mensagemErro};
