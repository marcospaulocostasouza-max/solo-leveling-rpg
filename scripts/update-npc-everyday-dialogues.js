const fs = require('fs'), path = require('path');
const { canonicalId } = require('../apps/bot/src/npc/npcIdentity');
const root = path.resolve(__dirname, '..');
const dataset = path.join(root, 'apps/bot/NPC_LORA/dataset');
const jsonRoot = path.join(root, 'apps/bot/src/npc/data');
const source = fs.readFileSync(path.join(__dirname,'npc-everyday-dialogues.txt'),'utf8');
const silenceActions = new Map(fs.readFileSync(path.join(__dirname,'npc-silence-actions.txt'),'utf8').trim().split(/\r?\n/).map(line=>line.split('|')));
const configs = new Map(source.trim().split(/\r?\n/).map(line => {
    const [id,voice,...responses] = line.split('|');
    if (responses.length!==4) throw new Error(`Exemplos incompletos: ${id}`);
    return [id,{voice,responses}];
}));
const files = fs.readdirSync(jsonRoot).filter(f=>f.endsWith('.json'));
const jsons = files.map(file=>({file,data:JSON.parse(fs.readFileSync(path.join(jsonRoot,file),'utf8'))}));
for (const folder of fs.readdirSync(dataset).filter(f=>!f.startsWith('_') && fs.statSync(path.join(dataset,f)).isDirectory())) {
    if (!configs.has(folder)) throw new Error(`NPC sem revisão individual: ${folder}`);
}
const speechPath=path.join(root,'apps/bot/src/ia/speechProfile.json');
const speeches=JSON.parse(fs.readFileSync(speechPath,'utf8'));
const changes=[];
for (const [id,config] of configs) {
    const matching=jsons.filter(j=>canonicalId(j.data.id || j.file.slice(0,-5))===id);
    const data=matching[0]?.data;
    if (!data) throw new Error(`Identidade JSON ausente: ${id}`);
    const name=data.nome;
    const dir=path.join(dataset,id);
    fs.mkdirSync(dir,{recursive:true});
    // Somente perfis antes ausentes recebem identidade e personalidade da fonte existente.
    if (!fs.existsSync(path.join(dir,'01_identity.md'))) fs.writeFileSync(path.join(dir,'01_identity.md'),`Nome: ${name}\nTítulo: ${data.titulo || ''}\nLocalização: ${data.localizacao || ''}\n`);
    if (!fs.existsSync(path.join(dir,'04_personality.md'))) fs.writeFileSync(path.join(dir,'04_personality.md'),data.personalidade || '');
    if (!fs.existsSync(path.join(dir,'03_history.md'))) fs.writeFileSync(path.join(dir,'03_history.md'),data.historia || '');
    const rules='Exemplos hipotéticos de voz, não acontecimentos do jogador. Nunca copie as falas. Adapte ao assunto real. Não invente ações, respostas ou sentimentos do jogador. Intimidade, romance, segredos e lembranças exigem vínculo, consentimento e memória registrados; não são concedidos por estes exemplos. Missões, itens e recompensas dependem exclusivamente do estado oficial, não de uma fala ilustrativa.';
    const speech=`# Forma de falar — ${name}\n\n${config.voice}.\n\nUse respostas proporcionais: cumprimentos e perguntas simples pedem falas breves; cenas emocionais ou explicações pedidas podem ser maiores. Preserve os valores e conflitos da personalidade original. Não mencione título, arma ou biografia como bordão. Não inicie toda conversa com ameaça. ${rules}\n`;
    fs.writeFileSync(path.join(dir,'06_speech.md'),speech);
    fs.writeFileSync(path.join(dir,'05_interpretation.md'),`# Interpretação — ${name}\n\nA personalidade e a história oficiais definem valores, conflitos e capacidade de comunicação. Voz: ${config.voice}.\n\nReaja ao que o jogador realmente escreveu. Não transforme apresentação, título ou técnica de assinatura em resposta padrão. Uma pergunta simples não exige discurso nem recusa automática. Demonstre tensão ou afeto por escolhas e gestos compatíveis com o contexto, sem atribuir sentimentos ao jogador. Facetas privadas não são confissões públicas: um manipulador mantém sua fachada, uma pessoa reservada revela informação gradualmente e uma entidade não humana não adquire hábitos humanos pelo vínculo. ${rules}\n`);
    const labels=['Primeiro encontro / cumprimento','Conversa casual / cotidiano','Esclarecer pedido / pergunta incompleta'];
    const inputs=['O jogador cumprimenta, sem ameaça ou intimidade prévia.','O jogador puxa um assunto cotidiano, sem solicitar explicação extensa.','O jogador faz um pedido ambíguo. Não adivinhar objeto, intenção ou resultado.'];
    const output=text=>text.startsWith('_')?text:`*${text}*`;
    const dialogs=config.responses.slice(0,3).map((text,i)=>`--- Diálogo ${i+1}: ${labels[i]} ---\nCondição: ${i===1?'convivência casual, sem intimidade presumida':'desconhecido; sem vínculo prévio obrigatório'}.\nEntrada do jogador: ${inputs[i]}\nResposta exclusiva do NPC:\n${output(text)}\n`).join('\n');
    fs.writeFileSync(path.join(dir,'17_dialog_examples.md'),`# Exemplos de diálogo — ${name}\n\n${rules}\n\n${dialogs}`);
    const refusal=config.responses[3];
    if (!silenceActions.has(id)) throw new Error(`Cena sem revisão individual: ${id}`);
    const silence=`_${name} ${silenceActions.get(id)}._`;
    fs.writeFileSync(path.join(dir,'18_scene_examples.md'),`# Exemplos de cena — ${name}\n\n${rules}\n\n--- Cena 1: Insistência / discordância / limite ---\nCondição: o jogador insiste num pedido incompatível com os limites descritos na personalidade; sem concluir missão nem transação.\nEntrada do jogador: uma proposta contrariando esses limites.\nResposta exclusiva do NPC:\n${output(refusal)}\n\n--- Cena 2: Silêncio / espera ---\nCondição: jogador em silêncio. O contexto real determina a postura; este exemplo não cria passado compartilhado.\nEntrada do jogador: pausa sem nova ação.\nResposta exclusiva do NPC:\n${silence}\n`);
    for (const entry of matching) {
        entry.data.formaFalar=config.voice;
        fs.writeFileSync(path.join(jsonRoot,entry.file),JSON.stringify(entry.data,null,2)+'\n');
        const key=entry.data.id || entry.file.slice(0,-5);
        speeches[key]={...(speeches[key] || {}),estilo:config.voice,comprimentoFrase:'proporcional ao pedido; curta em conversa cotidiana',vocabulario:config.voice,vicios:[],exemplos:config.responses.slice(0,3).map(output)};
    }
    changes.push({id,name,voice:config.voice,files:matching.map(j=>j.file)});
}
fs.writeFileSync(speechPath,JSON.stringify(speeches,null,2)+'\n');
let report='# Melhoria global dos diálogos dos NPCs\n\n74 identidades revisadas: os 72 perfis existentes e Bilac/Vysache, antes somente em JSON. Personalidades, biografias, atributos, missões e recompensas existentes preservados. Atualizados exemplos de diálogo/cena, instruções de voz, formaFalar dos JSONs e speechProfile usado pela rota legada.\n\nCada perfil recebe três exemplos curtos de cumprimento, cotidiano e esclarecimento, além de dois exemplos de cena para limite/discordância e silêncio. Exemplos separam condição, entrada do jogador e resposta exclusiva do NPC. Foram removidos monólogos, fragmentos misturados, duplicações e notas editoriais dos arquivos de exemplos substituídos. Romance não é um exemplo padrão; depende de vínculo e consentimento. A fonte de fala de Redeye foi alinhada à personalidade instintiva existente: ações e vocalizações, sem romance/conversa humana.\n\nAs reduções de volume trocam cenas inteiras predefinidas por demonstrações curtas de voz. A informação canônica continua nas seções de identidade, história e personalidade. O resultado precisa ser acompanhado em conversas reais; não é garantia semântica absoluta do modelo.\n\n## Cada NPC modificado\n\n| NPC | Perfil | Voz preservada e reforçada |\n|---|---|---|\n';
for (const c of changes) report+=`| ${c.name} | ${c.id} | ${c.voice} |\n`;
report+='\n## Validação e atualização\n\nVerificação de cobertura, exemplos completos, ausência de duplicações e dados canônicos preservados. Seleção no prompt considera vínculo e usa exemplos inteiros. Reiniciar o bot carrega Markdown e speechProfile atualizados. Não foram executadas conversas de modelo para os 74 NPCs durante os testes.\n';
fs.writeFileSync(path.join(root,'docs/melhorias-dialogos-npcs.md'),report);
console.log(`Atualizados ${changes.length} NPCs e ${changes.reduce((sum,c)=>sum+c.files.length,0)} JSONs suplementares.`);
