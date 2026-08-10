/**
 * SCHEDULER - DAILY ROUTINE
 *
 * Gerencia as rotinas diarias de cada NPC.
 * Cada NPC possui uma rotina com horarios e acoes.
 * O Scheduler determina qual acao o NPC esta realizando
 * em um determinado horario.
 *
 * NAO utiliza IA. Apenas gerencia horarios e acoes.
 */

const rotinasCache = {};

function cadastrarRotina(npcId, rotina) {
    if (!npcId || !Array.isArray(rotina)) return false;
    const ordenada = rotina.sort((a, b) => a.hora - b.hora);
    rotinasCache[npcId] = ordenada;
    return true;
}

function carregarRotinaDoNPC(npc) {
    if (!npc || !npc.id) return null;
    if (rotinasCache[npc.id]) return rotinasCache[npc.id];
    if (npc.rotina && Array.isArray(npc.rotina)) {
        cadastrarRotina(npc.id, npc.rotina);
        return rotinasCache[npc.id];
    }
    return null;
}

function obterRotinaAtual(npcId, hora) {
    const rotina = rotinasCache[npcId];
    if (!rotina || rotina.length === 0) return null;
    const h = Math.max(0, Math.min(23, parseInt(hora) || 0));
    let blocoAtual = null;
    for (const bloco of rotina) {
        if (bloco.hora <= h) { blocoAtual = bloco; }
        else { break; }
    }
    if (!blocoAtual && rotina.length > 0) { blocoAtual = rotina[rotina.length - 1]; }
    return blocoAtual;
}

function estaDisponivel(npcId, hora) {
    const rotinaAtual = obterRotinaAtual(npcId, hora);
    if (!rotinaAtual) return true;
    if (rotinaAtual.disponivel !== undefined) return rotinaAtual.disponivel;
    const acao = (rotinaAtual.acao || "").toLowerCase();
    if (acao.includes("dorm") || acao.includes("descans")) return false;
    return true;
}

function obterHoraAtual() {
    return new Date().getHours();
}

function obterContextoRotina(npcId, hora) {
    const h = hora !== undefined ? hora : obterHoraAtual();
    const rotinaAtual = obterRotinaAtual(npcId, h);
    const disponivel = estaDisponivel(npcId, h);
    return {
        hora: h,
        acao: rotinaAtual ? rotinaAtual.acao : "Desconhecida",
        descricao: rotinaAtual ? rotinaAtual.descricao : null,
        disponivel: disponivel,
        rotinaAtual: rotinaAtual
    };
}

function listarRotinas() {
    return { ...rotinasCache };
}

function removerRotina(npcId) {
    delete rotinasCache[npcId];
}

// ROTINA PADRAO DA OPHILIA
cadastrarRotina("ophilia", [
    { hora: 6, acao: "Oracoes", descricao: "Ophilia realiza suas oracoes matinais no templo.", disponivel: false },
    { hora: 8, acao: "Atende fieis", descricao: "Ophilia atende os fiéis que visitam o templo.", disponivel: true },
    { hora: 11, acao: "Visita enfermaria", descricao: "Ophilia visita a enfermaria para curar os feridos.", disponivel: true },
    { hora: 14, acao: "Treina magia de luz", descricao: "Ophilia treina suas habilidades de magia de luz.", disponivel: false },
    { hora: 17, acao: "Recebe cacadores", descricao: "Ophilia recebe cacadores que buscam cura ou orientacao.", disponivel: true },
    { hora: 21, acao: "Descansa", descricao: "Ophilia se recolhe para descansar apos um longo dia.", disponivel: false },
    { hora: 23, acao: "Dormindo", descricao: "Ophilia esta dormindo em seus aposentos.", disponivel: false }
]);

// ROTINA PADRAO DO VYSACHE
cadastrarRotina("vysache", [
    { hora: 5, acao: "Acorda e prepara a forja", descricao: "Vysache acorda cedo e prepara a forja para o dia.", disponivel: false },
    { hora: 7, acao: "Forja itens", descricao: "Vysache forja itens para os cacadores.", disponivel: true },
    { hora: 12, acao: "Almoca", descricao: "Vysache faz uma pausa para almocar.", disponivel: false },
    { hora: 13, acao: "Forja itens", descricao: "Vysache continua forjando itens.", disponivel: true },
    { hora: 18, acao: "Fecha a forja", descricao: "Vysache fecha a forja e organiza as ferramentas.", disponivel: true },
    { hora: 20, acao: "Descansa", descricao: "Vysache descansa em casa.", disponivel: false },
    { hora: 22, acao: "Dormindo", descricao: "Vysache esta dormindo.", disponivel: false }
]);

// =====================================
// ROTINAS DOS NOVOS NPCs
// =====================================

// ROTINA PADRAO DO OPHILIA CLEMENT
cadastrarRotina("ophilia_clement", [
    { hora: 6, acao: "Acorda e se prepara", descricao: "Ophilia Clement acorda e se prepara para o dia.", disponivel: false },
    { hora: 8, acao: "Atende cacadores", descricao: "Ophilia Clement atende cacadores que buscam ajuda.", disponivel: true },
    { hora: 12, acao: "Almoca", descricao: "Ophilia Clement faz uma pausa para almocar.", disponivel: false },
    { hora: 13, acao: "Treina habilidades", descricao: "Ophilia Clement treina suas habilidades de combate.", disponivel: true },
    { hora: 18, acao: "Atende novamente", descricao: "Ophilia Clement retoma o atendimento aos cacadores.", disponivel: true },
    { hora: 21, acao: "Descansa", descricao: "Ophilia Clement descansa apos um longo dia.", disponivel: false },
    { hora: 23, acao: "Dormindo", descricao: "Ophilia Clement esta dormindo.", disponivel: false }
]);

// ROTINA PADRAO DO CYRUS ALBRIGHT
cadastrarRotina("cyrus_albright", [
    { hora: 6, acao: "Acorda e se prepara", descricao: "Cyrus Albright acorda e se prepara para o dia.", disponivel: false },
    { hora: 8, acao: "Atende cacadores", descricao: "Cyrus Albright atende cacadores que buscam ajuda.", disponivel: true },
    { hora: 12, acao: "Almoca", descricao: "Cyrus Albright faz uma pausa para almocar.", disponivel: false },
    { hora: 13, acao: "Treina habilidades", descricao: "Cyrus Albright treina suas habilidades de combate.", disponivel: true },
    { hora: 18, acao: "Atende novamente", descricao: "Cyrus Albright retoma o atendimento aos cacadores.", disponivel: true },
    { hora: 21, acao: "Descansa", descricao: "Cyrus Albright descansa apos um longo dia.", disponivel: false },
    { hora: 23, acao: "Dormindo", descricao: "Cyrus Albright esta dormindo.", disponivel: false }
]);

// ROTINA PADRAO DO TRESSA COLZIONE
cadastrarRotina("tressa_colzione", [
    { hora: 6, acao: "Acorda e se prepara", descricao: "Tressa Colzione acorda e se prepara para o dia.", disponivel: false },
    { hora: 8, acao: "Atende cacadores", descricao: "Tressa Colzione atende cacadores que buscam ajuda.", disponivel: true },
    { hora: 12, acao: "Almoca", descricao: "Tressa Colzione faz uma pausa para almocar.", disponivel: false },
    { hora: 13, acao: "Treina habilidades", descricao: "Tressa Colzione treina suas habilidades de combate.", disponivel: true },
    { hora: 18, acao: "Atende novamente", descricao: "Tressa Colzione retoma o atendimento aos cacadores.", disponivel: true },
    { hora: 21, acao: "Descansa", descricao: "Tressa Colzione descansa apos um longo dia.", disponivel: false },
    { hora: 23, acao: "Dormindo", descricao: "Tressa Colzione esta dormindo.", disponivel: false }
]);

// ROTINA PADRAO DO OLBERIC EISENBERG
cadastrarRotina("olberic_eisenberg", [
    { hora: 6, acao: "Acorda e se prepara", descricao: "Olberic Eisenberg acorda e se prepara para o dia.", disponivel: false },
    { hora: 8, acao: "Atende cacadores", descricao: "Olberic Eisenberg atende cacadores que buscam ajuda.", disponivel: true },
    { hora: 12, acao: "Almoca", descricao: "Olberic Eisenberg faz uma pausa para almocar.", disponivel: false },
    { hora: 13, acao: "Treina habilidades", descricao: "Olberic Eisenberg treina suas habilidades de combate.", disponivel: true },
    { hora: 18, acao: "Atende novamente", descricao: "Olberic Eisenberg retoma o atendimento aos cacadores.", disponivel: true },
    { hora: 21, acao: "Descansa", descricao: "Olberic Eisenberg descansa apos um longo dia.", disponivel: false },
    { hora: 23, acao: "Dormindo", descricao: "Olberic Eisenberg esta dormindo.", disponivel: false }
]);

// ROTINA PADRAO DO PRIMROSE AZELHART
cadastrarRotina("primrose_azelhart", [
    { hora: 6, acao: "Acorda e se prepara", descricao: "Primrose Azelhart acorda e se prepara para o dia.", disponivel: false },
    { hora: 8, acao: "Atende cacadores", descricao: "Primrose Azelhart atende cacadores que buscam ajuda.", disponivel: true },
    { hora: 12, acao: "Almoca", descricao: "Primrose Azelhart faz uma pausa para almocar.", disponivel: false },
    { hora: 13, acao: "Treina habilidades", descricao: "Primrose Azelhart treina suas habilidades de combate.", disponivel: true },
    { hora: 18, acao: "Atende novamente", descricao: "Primrose Azelhart retoma o atendimento aos cacadores.", disponivel: true },
    { hora: 21, acao: "Descansa", descricao: "Primrose Azelhart descansa apos um longo dia.", disponivel: false },
    { hora: 23, acao: "Dormindo", descricao: "Primrose Azelhart esta dormindo.", disponivel: false }
]);

// ROTINA PADRAO DO ALFYN GREENGRASS
cadastrarRotina("alfyn_greengrass", [
    { hora: 6, acao: "Acorda e se prepara", descricao: "Alfyn Greengrass acorda e se prepara para o dia.", disponivel: false },
    { hora: 8, acao: "Atende cacadores", descricao: "Alfyn Greengrass atende cacadores que buscam ajuda.", disponivel: true },
    { hora: 12, acao: "Almoca", descricao: "Alfyn Greengrass faz uma pausa para almocar.", disponivel: false },
    { hora: 13, acao: "Treina habilidades", descricao: "Alfyn Greengrass treina suas habilidades de combate.", disponivel: true },
    { hora: 18, acao: "Atende novamente", descricao: "Alfyn Greengrass retoma o atendimento aos cacadores.", disponivel: true },
    { hora: 21, acao: "Descansa", descricao: "Alfyn Greengrass descansa apos um longo dia.", disponivel: false },
    { hora: 23, acao: "Dormindo", descricao: "Alfyn Greengrass esta dormindo.", disponivel: false }
]);

// ROTINA PADRAO DO THERION
cadastrarRotina("therion", [
    { hora: 6, acao: "Acorda e se prepara", descricao: "Therion acorda e se prepara para o dia.", disponivel: false },
    { hora: 8, acao: "Atende cacadores", descricao: "Therion atende cacadores que buscam ajuda.", disponivel: true },
    { hora: 12, acao: "Almoca", descricao: "Therion faz uma pausa para almocar.", disponivel: false },
    { hora: 13, acao: "Treina habilidades", descricao: "Therion treina suas habilidades de combate.", disponivel: true },
    { hora: 18, acao: "Atende novamente", descricao: "Therion retoma o atendimento aos cacadores.", disponivel: true },
    { hora: 21, acao: "Descansa", descricao: "Therion descansa apos um longo dia.", disponivel: false },
    { hora: 23, acao: "Dormindo", descricao: "Therion esta dormindo.", disponivel: false }
]);

// ROTINA PADRAO DO H'AANIT
cadastrarRotina("haanit", [
    { hora: 6, acao: "Acorda e se prepara", descricao: "H'aanit acorda e se prepara para o dia.", disponivel: false },
    { hora: 8, acao: "Atende cacadores", descricao: "H'aanit atende cacadores que buscam ajuda.", disponivel: true },
    { hora: 12, acao: "Almoca", descricao: "H'aanit faz uma pausa para almocar.", disponivel: false },
    { hora: 13, acao: "Treina habilidades", descricao: "H'aanit treina suas habilidades de combate.", disponivel: true },
    { hora: 18, acao: "Atende novamente", descricao: "H'aanit retoma o atendimento aos cacadores.", disponivel: true },
    { hora: 21, acao: "Descansa", descricao: "H'aanit descansa apos um longo dia.", disponivel: false },
    { hora: 23, acao: "Dormindo", descricao: "H'aanit esta dormindo.", disponivel: false }
]);

// ROTINA PADRAO DO HIKARI KU
cadastrarRotina("hikari_ku", [
    { hora: 6, acao: "Acorda e se prepara", descricao: "Hikari Ku acorda e se prepara para o dia.", disponivel: false },
    { hora: 8, acao: "Atende cacadores", descricao: "Hikari Ku atende cacadores que buscam ajuda.", disponivel: true },
    { hora: 12, acao: "Almoca", descricao: "Hikari Ku faz uma pausa para almocar.", disponivel: false },
    { hora: 13, acao: "Treina habilidades", descricao: "Hikari Ku treina suas habilidades de combate.", disponivel: true },
    { hora: 18, acao: "Atende novamente", descricao: "Hikari Ku retoma o atendimento aos cacadores.", disponivel: true },
    { hora: 21, acao: "Descansa", descricao: "Hikari Ku descansa apos um longo dia.", disponivel: false },
    { hora: 23, acao: "Dormindo", descricao: "Hikari Ku esta dormindo.", disponivel: false }
]);

// ROTINA PADRAO DO AGNEA BRISTARNI
cadastrarRotina("agnea_bristarni", [
    { hora: 6, acao: "Acorda e se prepara", descricao: "Agnea Bristarni acorda e se prepara para o dia.", disponivel: false },
    { hora: 8, acao: "Atende cacadores", descricao: "Agnea Bristarni atende cacadores que buscam ajuda.", disponivel: true },
    { hora: 12, acao: "Almoca", descricao: "Agnea Bristarni faz uma pausa para almocar.", disponivel: false },
    { hora: 13, acao: "Treina habilidades", descricao: "Agnea Bristarni treina suas habilidades de combate.", disponivel: true },
    { hora: 18, acao: "Atende novamente", descricao: "Agnea Bristarni retoma o atendimento aos cacadores.", disponivel: true },
    { hora: 21, acao: "Descansa", descricao: "Agnea Bristarni descansa apos um longo dia.", disponivel: false },
    { hora: 23, acao: "Dormindo", descricao: "Agnea Bristarni esta dormindo.", disponivel: false }
]);

// ROTINA PADRAO DO CASTTI FLORENZ
cadastrarRotina("castti_florenz", [
    { hora: 6, acao: "Acorda e se prepara", descricao: "Castti Florenz acorda e se prepara para o dia.", disponivel: false },
    { hora: 8, acao: "Atende cacadores", descricao: "Castti Florenz atende cacadores que buscam ajuda.", disponivel: true },
    { hora: 12, acao: "Almoca", descricao: "Castti Florenz faz uma pausa para almocar.", disponivel: false },
    { hora: 13, acao: "Treina habilidades", descricao: "Castti Florenz treina suas habilidades de combate.", disponivel: true },
    { hora: 18, acao: "Atende novamente", descricao: "Castti Florenz retoma o atendimento aos cacadores.", disponivel: true },
    { hora: 21, acao: "Descansa", descricao: "Castti Florenz descansa apos um longo dia.", disponivel: false },
    { hora: 23, acao: "Dormindo", descricao: "Castti Florenz esta dormindo.", disponivel: false }
]);

// ROTINA PADRAO DO OSVALD V. VANSTEIN
cadastrarRotina("osvald_v_vanstein", [
    { hora: 6, acao: "Acorda e se prepara", descricao: "Osvald V. Vanstein acorda e se prepara para o dia.", disponivel: false },
    { hora: 8, acao: "Atende cacadores", descricao: "Osvald V. Vanstein atende cacadores que buscam ajuda.", disponivel: true },
    { hora: 12, acao: "Almoca", descricao: "Osvald V. Vanstein faz uma pausa para almocar.", disponivel: false },
    { hora: 13, acao: "Treina habilidades", descricao: "Osvald V. Vanstein treina suas habilidades de combate.", disponivel: true },
    { hora: 18, acao: "Atende novamente", descricao: "Osvald V. Vanstein retoma o atendimento aos cacadores.", disponivel: true },
    { hora: 21, acao: "Descansa", descricao: "Osvald V. Vanstein descansa apos um longo dia.", disponivel: false },
    { hora: 23, acao: "Dormindo", descricao: "Osvald V. Vanstein esta dormindo.", disponivel: false }
]);

// ROTINA PADRAO DO PARTITIO YELLOWIL
cadastrarRotina("partitio_yellowil", [
    { hora: 6, acao: "Acorda e se prepara", descricao: "Partitio Yellowil acorda e se prepara para o dia.", disponivel: false },
    { hora: 8, acao: "Atende cacadores", descricao: "Partitio Yellowil atende cacadores que buscam ajuda.", disponivel: true },
    { hora: 12, acao: "Almoca", descricao: "Partitio Yellowil faz uma pausa para almocar.", disponivel: false },
    { hora: 13, acao: "Treina habilidades", descricao: "Partitio Yellowil treina suas habilidades de combate.", disponivel: true },
    { hora: 18, acao: "Atende novamente", descricao: "Partitio Yellowil retoma o atendimento aos cacadores.", disponivel: true },
    { hora: 21, acao: "Descansa", descricao: "Partitio Yellowil descansa apos um longo dia.", disponivel: false },
    { hora: 23, acao: "Dormindo", descricao: "Partitio Yellowil esta dormindo.", disponivel: false }
]);

// ROTINA PADRAO DO OCHETTE
cadastrarRotina("ochette", [
    { hora: 6, acao: "Acorda e se prepara", descricao: "Ochette acorda e se prepara para o dia.", disponivel: false },
    { hora: 8, acao: "Atende cacadores", descricao: "Ochette atende cacadores que buscam ajuda.", disponivel: true },
    { hora: 12, acao: "Almoca", descricao: "Ochette faz uma pausa para almocar.", disponivel: false },
    { hora: 13, acao: "Treina habilidades", descricao: "Ochette treina suas habilidades de combate.", disponivel: true },
    { hora: 18, acao: "Atende novamente", descricao: "Ochette retoma o atendimento aos cacadores.", disponivel: true },
    { hora: 21, acao: "Descansa", descricao: "Ochette descansa apos um longo dia.", disponivel: false },
    { hora: 23, acao: "Dormindo", descricao: "Ochette esta dormindo.", disponivel: false }
]);

// ROTINA PADRAO DO TEMENOS MISTRAL
cadastrarRotina("temenos_mistral", [
    { hora: 6, acao: "Acorda e se prepara", descricao: "Temenos Mistral acorda e se prepara para o dia.", disponivel: false },
    { hora: 8, acao: "Atende cacadores", descricao: "Temenos Mistral atende cacadores que buscam ajuda.", disponivel: true },
    { hora: 12, acao: "Almoca", descricao: "Temenos Mistral faz uma pausa para almocar.", disponivel: false },
    { hora: 13, acao: "Treina habilidades", descricao: "Temenos Mistral treina suas habilidades de combate.", disponivel: true },
    { hora: 18, acao: "Atende novamente", descricao: "Temenos Mistral retoma o atendimento aos cacadores.", disponivel: true },
    { hora: 21, acao: "Descansa", descricao: "Temenos Mistral descansa apos um longo dia.", disponivel: false },
    { hora: 23, acao: "Dormindo", descricao: "Temenos Mistral esta dormindo.", disponivel: false }
]);

// ROTINA PADRAO DO THRONÉ ANGUIS
cadastrarRotina("throne_anguis", [
    { hora: 6, acao: "Acorda e se prepara", descricao: "Throné Anguis acorda e se prepara para o dia.", disponivel: false },
    { hora: 8, acao: "Atende cacadores", descricao: "Throné Anguis atende cacadores que buscam ajuda.", disponivel: true },
    { hora: 12, acao: "Almoca", descricao: "Throné Anguis faz uma pausa para almocar.", disponivel: false },
    { hora: 13, acao: "Treina habilidades", descricao: "Throné Anguis treina suas habilidades de combate.", disponivel: true },
    { hora: 18, acao: "Atende novamente", descricao: "Throné Anguis retoma o atendimento aos cacadores.", disponivel: true },
    { hora: 21, acao: "Descansa", descricao: "Throné Anguis descansa apos um longo dia.", disponivel: false },
    { hora: 23, acao: "Dormindo", descricao: "Throné Anguis esta dormindo.", disponivel: false }
]);

// ROTINA PADRAO DO LYBLAC
cadastrarRotina("lyblac", [
    { hora: 0, acao: "Vigilancia", descricao: "Lyblac observa seus dominios nas sombras.", disponivel: false },
    { hora: 6, acao: "Planejamento", descricao: "Lyblac planeja seus proximos movimentos.", disponivel: false },
    { hora: 12, acao: "Manipulacao", descricao: "Lyblac manipula aliados e inimigos nos bastidores.", disponivel: true },
    { hora: 18, acao: "Execucao", descricao: "Lyblac executa seus planos sombrios.", disponivel: true },
    { hora: 22, acao: "Recolhimento", descricao: "Lyblac se recolhe para recuperar forcas.", disponivel: false }
]);

// ROTINA PADRAO DO GALDERA
cadastrarRotina("galdera", [
    { hora: 0, acao: "Vigilancia", descricao: "Galdera observa seus dominios nas sombras.", disponivel: false },
    { hora: 6, acao: "Planejamento", descricao: "Galdera planeja seus proximos movimentos.", disponivel: false },
    { hora: 12, acao: "Manipulacao", descricao: "Galdera manipula aliados e inimigos nos bastidores.", disponivel: true },
    { hora: 18, acao: "Execucao", descricao: "Galdera executa seus planos sombrios.", disponivel: true },
    { hora: 22, acao: "Recolhimento", descricao: "Galdera se recolhe para recuperar forcas.", disponivel: false }
]);

// ROTINA PADRAO DO VIDE, O CORRUPTOR
cadastrarRotina("vide_o_corruptor", [
    { hora: 0, acao: "Vigilancia", descricao: "Vide, o Corruptor observa seus dominios nas sombras.", disponivel: false },
    { hora: 6, acao: "Planejamento", descricao: "Vide, o Corruptor planeja seus proximos movimentos.", disponivel: false },
    { hora: 12, acao: "Manipulacao", descricao: "Vide, o Corruptor manipula aliados e inimigos nos bastidores.", disponivel: true },
    { hora: 18, acao: "Execucao", descricao: "Vide, o Corruptor executa seus planos sombrios.", disponivel: true },
    { hora: 22, acao: "Recolhimento", descricao: "Vide, o Corruptor se recolhe para recuperar forcas.", disponivel: false }
]);

// ROTINA PADRAO DO TROUSSEAU
cadastrarRotina("trousseau", [
    { hora: 0, acao: "Vigilancia", descricao: "Trousseau observa seus dominios nas sombras.", disponivel: false },
    { hora: 6, acao: "Planejamento", descricao: "Trousseau planeja seus proximos movimentos.", disponivel: false },
    { hora: 12, acao: "Manipulacao", descricao: "Trousseau manipula aliados e inimigos nos bastidores.", disponivel: true },
    { hora: 18, acao: "Execucao", descricao: "Trousseau executa seus planos sombrios.", disponivel: true },
    { hora: 22, acao: "Recolhimento", descricao: "Trousseau se recolhe para recuperar forcas.", disponivel: false }
]);


// ROTINA PADRAO DO ALAUNE YEONG
cadastrarRotina("alaune_yeong", [
    { hora: 0, acao: "Vigilancia", descricao: "Alaune Yeong observa seus dominios nas sombras.", disponivel: false },
    { hora: 6, acao: "Planejamento", descricao: "Alaune Yeong planeja seus proximos movimentos.", disponivel: false },
    { hora: 12, acao: "Manipulacao", descricao: "Alaune Yeong manipula aliados e inimigos nos bastidores.", disponivel: true },
    { hora: 18, acao: "Execucao", descricao: "Alaune Yeong executa seus planos sombrios.", disponivel: true },
    { hora: 22, acao: "Recolhimento", descricao: "Alaune Yeong se recolhe para recuperar forcas.", disponivel: false }
]);

// ROTINA PADRAO DO ALEXIA SONG
cadastrarRotina("alexia_song", [
    { hora: 6, acao: "Acorda e se prepara", descricao: "Alexia Song acorda e se prepara para o dia.", disponivel: false },
    { hora: 8, acao: "Atende cacadores", descricao: "Alexia Song atende cacadores que buscam ajuda.", disponivel: true },
    { hora: 12, acao: "Almoca", descricao: "Alexia Song faz uma pausa para almocar.", disponivel: false },
    { hora: 13, acao: "Treina habilidades", descricao: "Alexia Song treina suas habilidades de combate.", disponivel: true },
    { hora: 18, acao: "Atende novamente", descricao: "Alexia Song retoma o atendimento aos cacadores.", disponivel: true },
    { hora: 21, acao: "Descansa", descricao: "Alexia Song descansa apos um longo dia.", disponivel: false },
    { hora: 23, acao: "Dormindo", descricao: "Alexia Song esta dormindo.", disponivel: false }
]);

// ROTINA PADRAO DO ARCANETTE
cadastrarRotina("arcanette", [
    { hora: 0, acao: "Vigilancia", descricao: "Arcanette observa seus dominios nas sombras.", disponivel: false },
    { hora: 6, acao: "Planejamento", descricao: "Arcanette planeja seus proximos movimentos.", disponivel: false },
    { hora: 12, acao: "Manipulacao", descricao: "Arcanette manipula aliados e inimigos nos bastidores.", disponivel: true },
    { hora: 18, acao: "Execucao", descricao: "Arcanette executa seus planos sombrios.", disponivel: true },
    { hora: 22, acao: "Recolhimento", descricao: "Arcanette se recolhe para recuperar forcas.", disponivel: false }
]);

// ROTINA PADRAO DO BARGELLO YEON
cadastrarRotina("bargello_yeon", [
    { hora: 6, acao: "Acorda e se prepara", descricao: "Bargello Yeon acorda e se prepara para o dia.", disponivel: false },
    { hora: 8, acao: "Atende cacadores", descricao: "Bargello Yeon atende cacadores que buscam ajuda.", disponivel: true },
    { hora: 12, acao: "Almoca", descricao: "Bargello Yeon faz uma pausa para almocar.", disponivel: false },
    { hora: 13, acao: "Treina habilidades", descricao: "Bargello Yeon treina suas habilidades de combate.", disponivel: true },
    { hora: 18, acao: "Atende novamente", descricao: "Bargello Yeon retoma o atendimento aos cacadores.", disponivel: true },
    { hora: 21, acao: "Descansa", descricao: "Bargello Yeon descansa apos um longo dia.", disponivel: false },
    { hora: 23, acao: "Dormindo", descricao: "Bargello Yeon esta dormindo.", disponivel: false }
]);

// ROTINA PADRAO DO CARINDA MOON
cadastrarRotina("carinda_moon", [
    { hora: 6, acao: "Acorda e se prepara", descricao: "Carinda Moon acorda e se prepara para o dia.", disponivel: false },
    { hora: 8, acao: "Atende cacadores", descricao: "Carinda Moon atende cacadores que buscam ajuda.", disponivel: true },
    { hora: 12, acao: "Almoca", descricao: "Carinda Moon faz uma pausa para almocar.", disponivel: false },
    { hora: 13, acao: "Treina habilidades", descricao: "Carinda Moon treina suas habilidades de combate.", disponivel: true },
    { hora: 18, acao: "Atende novamente", descricao: "Carinda Moon retoma o atendimento aos cacadores.", disponivel: true },
    { hora: 21, acao: "Descansa", descricao: "Carinda Moon descansa apos um longo dia.", disponivel: false },
    { hora: 23, acao: "Dormindo", descricao: "Carinda Moon esta dormindo.", disponivel: false }
]);

// ROTINA PADRAO DO CELSUS PARK
cadastrarRotina("celsus_park", [
    { hora: 6, acao: "Acorda e se prepara", descricao: "Celsus Park acorda e se prepara para o dia.", disponivel: false },
    { hora: 8, acao: "Atende cacadores", descricao: "Celsus Park atende cacadores que buscam ajuda.", disponivel: true },
    { hora: 12, acao: "Almoca", descricao: "Celsus Park faz uma pausa para almocar.", disponivel: false },
    { hora: 13, acao: "Treina habilidades", descricao: "Celsus Park treina suas habilidades de combate.", disponivel: true },
    { hora: 18, acao: "Atende novamente", descricao: "Celsus Park retoma o atendimento aos cacadores.", disponivel: true },
    { hora: 21, acao: "Descansa", descricao: "Celsus Park descansa apos um longo dia.", disponivel: false },
    { hora: 23, acao: "Dormindo", descricao: "Celsus Park esta dormindo.", disponivel: false }
]);

// ROTINA PADRAO DO CLAUDE
cadastrarRotina("claude", [
    { hora: 0, acao: "Vigilancia", descricao: "Claude observa seus dominios nas sombras.", disponivel: false },
    { hora: 6, acao: "Planejamento", descricao: "Claude planeja seus proximos movimentos.", disponivel: false },
    { hora: 12, acao: "Manipulacao", descricao: "Claude manipula aliados e inimigos nos bastidores.", disponivel: true },
    { hora: 18, acao: "Execucao", descricao: "Claude executa seus planos sombrios.", disponivel: true },
    { hora: 22, acao: "Recolhimento", descricao: "Claude se recolhe para recuperar forcas.", disponivel: false }
]);

// ROTINA PADRAO DO DARIUS KWON
cadastrarRotina("darius_kwon", [
    { hora: 0, acao: "Vigilancia", descricao: "Darius Kwon observa seus dominios nas sombras.", disponivel: false },
    { hora: 6, acao: "Planejamento", descricao: "Darius Kwon planeja seus proximos movimentos.", disponivel: false },
    { hora: 12, acao: "Manipulacao", descricao: "Darius Kwon manipula aliados e inimigos nos bastidores.", disponivel: true },
    { hora: 18, acao: "Execucao", descricao: "Darius Kwon executa seus planos sombrios.", disponivel: true },
    { hora: 22, acao: "Recolhimento", descricao: "Darius Kwon se recolhe para recuperar forcas.", disponivel: false }
]);

// ROTINA PADRAO DO DELITIA SONG
cadastrarRotina("delitia_song", [
    { hora: 6, acao: "Acorda e se prepara", descricao: "Delitia Song acorda e se prepara para o dia.", disponivel: false },
    { hora: 8, acao: "Atende cacadores", descricao: "Delitia Song atende cacadores que buscam ajuda.", disponivel: true },
    { hora: 12, acao: "Almoca", descricao: "Delitia Song faz uma pausa para almocar.", disponivel: false },
    { hora: 13, acao: "Treina habilidades", descricao: "Delitia Song treina suas habilidades de combate.", disponivel: true },
    { hora: 18, acao: "Atende novamente", descricao: "Delitia Song retoma o atendimento aos cacadores.", disponivel: true },
    { hora: 21, acao: "Descansa", descricao: "Delitia Song descansa apos um longo dia.", disponivel: false },
    { hora: 23, acao: "Dormindo", descricao: "Delitia Song esta dormindo.", disponivel: false }
]);

// ROTINA PADRAO DO ELRICA EDORAS
cadastrarRotina("elrica_edoras", [
    { hora: 6, acao: "Acorda e se prepara", descricao: "Elrica Edoras acorda e se prepara para o dia.", disponivel: false },
    { hora: 8, acao: "Atende cacadores", descricao: "Elrica Edoras atende cacadores que buscam ajuda.", disponivel: true },
    { hora: 12, acao: "Almoca", descricao: "Elrica Edoras faz uma pausa para almocar.", disponivel: false },
    { hora: 13, acao: "Treina habilidades", descricao: "Elrica Edoras treina suas habilidades de combate.", disponivel: true },
    { hora: 18, acao: "Atende novamente", descricao: "Elrica Edoras retoma o atendimento aos cacadores.", disponivel: true },
    { hora: 21, acao: "Descansa", descricao: "Elrica Edoras descansa apos um longo dia.", disponivel: false },
    { hora: 23, acao: "Dormindo", descricao: "Elrica Edoras esta dormindo.", disponivel: false }
]);

// ROTINA PADRAO DO ELTRIX NOH
cadastrarRotina("eltrix_noh", [
    { hora: 6, acao: "Acorda e se prepara", descricao: "Eltrix Noh acorda e se prepara para o dia.", disponivel: false },
    { hora: 8, acao: "Atende cacadores", descricao: "Eltrix Noh atende cacadores que buscam ajuda.", disponivel: true },
    { hora: 12, acao: "Almoca", descricao: "Eltrix Noh faz uma pausa para almocar.", disponivel: false },
    { hora: 13, acao: "Treina habilidades", descricao: "Eltrix Noh treina suas habilidades de combate.", disponivel: true },
    { hora: 18, acao: "Atende novamente", descricao: "Eltrix Noh retoma o atendimento aos cacadores.", disponivel: true },
    { hora: 21, acao: "Descansa", descricao: "Eltrix Noh descansa apos um longo dia.", disponivel: false },
    { hora: 23, acao: "Dormindo", descricao: "Eltrix Noh esta dormindo.", disponivel: false }
]);

// ROTINA PADRAO DO ENTIDADE 'MÃE'
cadastrarRotina("entidade_mae", [
    { hora: 0, acao: "Vigilancia", descricao: "Entidade 'Mãe' observa seus dominios nas sombras.", disponivel: false },
    { hora: 6, acao: "Planejamento", descricao: "Entidade 'Mãe' planeja seus proximos movimentos.", disponivel: false },
    { hora: 12, acao: "Manipulacao", descricao: "Entidade 'Mãe' manipula aliados e inimigos nos bastidores.", disponivel: true },
    { hora: 18, acao: "Execucao", descricao: "Entidade 'Mãe' executa seus planos sombrios.", disponivel: true },
    { hora: 22, acao: "Recolhimento", descricao: "Entidade 'Mãe' se recolhe para recuperar forcas.", disponivel: false }
]);

// ROTINA PADRAO DO ESPERRE JIN
cadastrarRotina("esperre_jin", [
    { hora: 6, acao: "Acorda e se prepara", descricao: "Esperre Jin acorda e se prepara para o dia.", disponivel: false },
    { hora: 8, acao: "Atende cacadores", descricao: "Esperre Jin atende cacadores que buscam ajuda.", disponivel: true },
    { hora: 12, acao: "Almoca", descricao: "Esperre Jin faz uma pausa para almocar.", disponivel: false },
    { hora: 13, acao: "Treina habilidades", descricao: "Esperre Jin treina suas habilidades de combate.", disponivel: true },
    { hora: 18, acao: "Atende novamente", descricao: "Esperre Jin retoma o atendimento aos cacadores.", disponivel: true },
    { hora: 21, acao: "Descansa", descricao: "Esperre Jin descansa apos um longo dia.", disponivel: false },
    { hora: 23, acao: "Dormindo", descricao: "Esperre Jin esta dormindo.", disponivel: false }
]);

// ROTINA PADRAO DO GASTON RHO
cadastrarRotina("gaston_rho", [
    { hora: 0, acao: "Vigilancia", descricao: "Gaston Rho observa seus dominios nas sombras.", disponivel: false },
    { hora: 6, acao: "Planejamento", descricao: "Gaston Rho planeja seus proximos movimentos.", disponivel: false },
    { hora: 12, acao: "Manipulacao", descricao: "Gaston Rho manipula aliados e inimigos nos bastidores.", disponivel: true },
    { hora: 18, acao: "Execucao", descricao: "Gaston Rho executa seus planos sombrios.", disponivel: true },
    { hora: 22, acao: "Recolhimento", descricao: "Gaston Rho se recolhe para recuperar forcas.", disponivel: false }
]);

// ROTINA PADRAO DO GIDEON MA
cadastrarRotina("gideon_ma", [
    { hora: 0, acao: "Vigilancia", descricao: "Gideon Ma observa seus dominios nas sombras.", disponivel: false },
    { hora: 6, acao: "Planejamento", descricao: "Gideon Ma planeja seus proximos movimentos.", disponivel: false },
    { hora: 12, acao: "Manipulacao", descricao: "Gideon Ma manipula aliados e inimigos nos bastidores.", disponivel: true },
    { hora: 18, acao: "Execucao", descricao: "Gideon Ma executa seus planos sombrios.", disponivel: true },
    { hora: 22, acao: "Recolhimento", descricao: "Gideon Ma se recolhe para recuperar forcas.", disponivel: false }
]);

// ROTINA PADRAO DO GOODWIN CHA
cadastrarRotina("goodwin_cha", [
    { hora: 6, acao: "Acorda e se prepara", descricao: "Goodwin Cha acorda e se prepara para o dia.", disponivel: false },
    { hora: 8, acao: "Atende cacadores", descricao: "Goodwin Cha atende cacadores que buscam ajuda.", disponivel: true },
    { hora: 12, acao: "Almoca", descricao: "Goodwin Cha faz uma pausa para almocar.", disponivel: false },
    { hora: 13, acao: "Treina habilidades", descricao: "Goodwin Cha treina suas habilidades de combate.", disponivel: true },
    { hora: 18, acao: "Atende novamente", descricao: "Goodwin Cha retoma o atendimento aos cacadores.", disponivel: true },
    { hora: 21, acao: "Descansa", descricao: "Goodwin Cha descansa apos um longo dia.", disponivel: false },
    { hora: 23, acao: "Dormindo", descricao: "Goodwin Cha esta dormindo.", disponivel: false }
]);

// ROTINA PADRAO DO HARVEY JEONG
cadastrarRotina("harvey_jeong", [
    { hora: 0, acao: "Vigilancia", descricao: "Harvey Jeong observa seus dominios nas sombras.", disponivel: false },
    { hora: 6, acao: "Planejamento", descricao: "Harvey Jeong planeja seus proximos movimentos.", disponivel: false },
    { hora: 12, acao: "Manipulacao", descricao: "Harvey Jeong manipula aliados e inimigos nos bastidores.", disponivel: true },
    { hora: 18, acao: "Execucao", descricao: "Harvey Jeong executa seus planos sombrios.", disponivel: true },
    { hora: 22, acao: "Recolhimento", descricao: "Harvey Jeong se recolhe para recuperar forcas.", disponivel: false }
]);

// ROTINA PADRAO DO HEIDNE AHN
cadastrarRotina("heidne_ahn", [
    { hora: 6, acao: "Acorda e se prepara", descricao: "Heidne Ahn acorda e se prepara para o dia.", disponivel: false },
    { hora: 8, acao: "Atende cacadores", descricao: "Heidne Ahn atende cacadores que buscam ajuda.", disponivel: true },
    { hora: 12, acao: "Almoca", descricao: "Heidne Ahn faz uma pausa para almocar.", disponivel: false },
    { hora: 13, acao: "Treina habilidades", descricao: "Heidne Ahn treina suas habilidades de combate.", disponivel: true },
    { hora: 18, acao: "Atende novamente", descricao: "Heidne Ahn retoma o atendimento aos cacadores.", disponivel: true },
    { hora: 21, acao: "Descansa", descricao: "Heidne Ahn descansa apos um longo dia.", disponivel: false },
    { hora: 23, acao: "Dormindo", descricao: "Heidne Ahn esta dormindo.", disponivel: false }
]);

// ROTINA PADRAO DO HELGENISH
cadastrarRotina("helgenish", [
    { hora: 0, acao: "Vigilancia", descricao: "Helgenish observa seus dominios nas sombras.", disponivel: false },
    { hora: 6, acao: "Planejamento", descricao: "Helgenish planeja seus proximos movimentos.", disponivel: false },
    { hora: 12, acao: "Manipulacao", descricao: "Helgenish manipula aliados e inimigos nos bastidores.", disponivel: true },
    { hora: 18, acao: "Execucao", descricao: "Helgenish executa seus planos sombrios.", disponivel: true },
    { hora: 22, acao: "Recolhimento", descricao: "Helgenish se recolhe para recuperar forcas.", disponivel: false }
]);

// ROTINA PADRAO DO ISLA GWON
cadastrarRotina("isla_gwon", [
    { hora: 6, acao: "Acorda e se prepara", descricao: "Isla Gwon acorda e se prepara para o dia.", disponivel: false },
    { hora: 8, acao: "Atende cacadores", descricao: "Isla Gwon atende cacadores que buscam ajuda.", disponivel: true },
    { hora: 12, acao: "Almoca", descricao: "Isla Gwon faz uma pausa para almocar.", disponivel: false },
    { hora: 13, acao: "Treina habilidades", descricao: "Isla Gwon treina suas habilidades de combate.", disponivel: true },
    { hora: 18, acao: "Atende novamente", descricao: "Isla Gwon retoma o atendimento aos cacadores.", disponivel: true },
    { hora: 21, acao: "Descansa", descricao: "Isla Gwon descansa apos um longo dia.", disponivel: false },
    { hora: 23, acao: "Dormindo", descricao: "Isla Gwon esta dormindo.", disponivel: false }
]);

// ROTINA PADRAO DO KALDENA RYU
cadastrarRotina("kaldena_ryu", [
    { hora: 0, acao: "Vigilancia", descricao: "Kaldena Ryu observa seus dominios nas sombras.", disponivel: false },
    { hora: 6, acao: "Planejamento", descricao: "Kaldena Ryu planeja seus proximos movimentos.", disponivel: false },
    { hora: 12, acao: "Manipulacao", descricao: "Kaldena Ryu manipula aliados e inimigos nos bastidores.", disponivel: true },
    { hora: 18, acao: "Execucao", descricao: "Kaldena Ryu executa seus planos sombrios.", disponivel: true },
    { hora: 22, acao: "Recolhimento", descricao: "Kaldena Ryu se recolhe para recuperar forcas.", disponivel: false }
]);

// ROTINA PADRAO DO KAZAN
cadastrarRotina("kazan", [
    { hora: 0, acao: "Vigilancia", descricao: "Kazan observa seus dominios nas sombras.", disponivel: false },
    { hora: 6, acao: "Planejamento", descricao: "Kazan planeja seus proximos movimentos.", disponivel: false },
    { hora: 12, acao: "Manipulacao", descricao: "Kazan manipula aliados e inimigos nos bastidores.", disponivel: true },
    { hora: 18, acao: "Execucao", descricao: "Kazan executa seus planos sombrios.", disponivel: true },
    { hora: 22, acao: "Recolhimento", descricao: "Kazan se recolhe para recuperar forcas.", disponivel: false }
]);

// ROTINA PADRAO DO LAURANA BAE
cadastrarRotina("laurana_bae", [
    { hora: 6, acao: "Acorda e se prepara", descricao: "Laurana Bae acorda e se prepara para o dia.", disponivel: false },
    { hora: 8, acao: "Atende cacadores", descricao: "Laurana Bae atende cacadores que buscam ajuda.", disponivel: true },
    { hora: 12, acao: "Almoca", descricao: "Laurana Bae faz uma pausa para almocar.", disponivel: false },
    { hora: 13, acao: "Treina habilidades", descricao: "Laurana Bae treina suas habilidades de combate.", disponivel: true },
    { hora: 18, acao: "Atende novamente", descricao: "Laurana Bae retoma o atendimento aos cacadores.", disponivel: true },
    { hora: 21, acao: "Descansa", descricao: "Laurana Bae descansa apos um longo dia.", disponivel: false },
    { hora: 23, acao: "Dormindo", descricao: "Laurana Bae esta dormindo.", disponivel: false }
]);

// ROTINA PADRAO DO LUCIA YEOM
cadastrarRotina("lucia_yeom", [
    { hora: 0, acao: "Vigilancia", descricao: "Lucia Yeom observa seus dominios nas sombras.", disponivel: false },
    { hora: 6, acao: "Planejamento", descricao: "Lucia Yeom planeja seus proximos movimentos.", disponivel: false },
    { hora: 12, acao: "Manipulacao", descricao: "Lucia Yeom manipula aliados e inimigos nos bastidores.", disponivel: true },
    { hora: 18, acao: "Execucao", descricao: "Lucia Yeom executa seus planos sombrios.", disponivel: true },
    { hora: 22, acao: "Recolhimento", descricao: "Lucia Yeom se recolhe para recuperar forcas.", disponivel: false }
]);

// ROTINA PADRAO DO LUDO WEI
cadastrarRotina("ludo_wei", [
    { hora: 6, acao: "Acorda e se prepara", descricao: "Ludo Wei acorda e se prepara para o dia.", disponivel: false },
    { hora: 8, acao: "Atende cacadores", descricao: "Ludo Wei atende cacadores que buscam ajuda.", disponivel: true },
    { hora: 12, acao: "Almoca", descricao: "Ludo Wei faz uma pausa para almocar.", disponivel: false },
    { hora: 13, acao: "Treina habilidades", descricao: "Ludo Wei treina suas habilidades de combate.", disponivel: true },
    { hora: 18, acao: "Atende novamente", descricao: "Ludo Wei retoma o atendimento aos cacadores.", disponivel: true },
    { hora: 21, acao: "Descansa", descricao: "Ludo Wei descansa apos um longo dia.", disponivel: false },
    { hora: 23, acao: "Dormindo", descricao: "Ludo Wei esta dormindo.", disponivel: false }
]);

// ROTINA PADRAO DO MACY EUN
cadastrarRotina("macy_eun", [
    { hora: 6, acao: "Acorda e se prepara", descricao: "Macy Eun acorda e se prepara para o dia.", disponivel: false },
    { hora: 8, acao: "Atende cacadores", descricao: "Macy Eun atende cacadores que buscam ajuda.", disponivel: true },
    { hora: 12, acao: "Almoca", descricao: "Macy Eun faz uma pausa para almocar.", disponivel: false },
    { hora: 13, acao: "Treina habilidades", descricao: "Macy Eun treina suas habilidades de combate.", disponivel: true },
    { hora: 18, acao: "Atende novamente", descricao: "Macy Eun retoma o atendimento aos cacadores.", disponivel: true },
    { hora: 21, acao: "Descansa", descricao: "Macy Eun descansa apos um longo dia.", disponivel: false },
    { hora: 23, acao: "Dormindo", descricao: "Macy Eun esta dormindo.", disponivel: false }
]);

// ROTINA PADRAO DO MATTIAS CARDOSO
cadastrarRotina("mattias_cardoso", [
    { hora: 0, acao: "Vigilancia", descricao: "Mattias Cardoso observa seus dominios nas sombras.", disponivel: false },
    { hora: 6, acao: "Planejamento", descricao: "Mattias Cardoso planeja seus proximos movimentos.", disponivel: false },
    { hora: 12, acao: "Manipulacao", descricao: "Mattias Cardoso manipula aliados e inimigos nos bastidores.", disponivel: true },
    { hora: 18, acao: "Execucao", descricao: "Mattias Cardoso executa seus planos sombrios.", disponivel: true },
    { hora: 22, acao: "Recolhimento", descricao: "Mattias Cardoso se recolhe para recuperar forcas.", disponivel: false }
]);

// ROTINA PADRAO DO MIGUEL BANG
cadastrarRotina("miguel_bang", [
    { hora: 0, acao: "Vigilancia", descricao: "Miguel Bang observa seus dominios nas sombras.", disponivel: false },
    { hora: 6, acao: "Planejamento", descricao: "Miguel Bang planeja seus proximos movimentos.", disponivel: false },
    { hora: 12, acao: "Manipulacao", descricao: "Miguel Bang manipula aliados e inimigos nos bastidores.", disponivel: true },
    { hora: 18, acao: "Execucao", descricao: "Miguel Bang executa seus planos sombrios.", disponivel: true },
    { hora: 22, acao: "Recolhimento", descricao: "Miguel Bang se recolhe para recuperar forcas.", disponivel: false }
]);

// ROTINA PADRAO DO MUGEN KU
cadastrarRotina("mugen_ku", [
    { hora: 0, acao: "Vigilancia", descricao: "Mugen Ku observa seus dominios nas sombras.", disponivel: false },
    { hora: 6, acao: "Planejamento", descricao: "Mugen Ku planeja seus proximos movimentos.", disponivel: false },
    { hora: 12, acao: "Manipulacao", descricao: "Mugen Ku manipula aliados e inimigos nos bastidores.", disponivel: true },
    { hora: 18, acao: "Execucao", descricao: "Mugen Ku executa seus planos sombrios.", disponivel: true },
    { hora: 22, acao: "Recolhimento", descricao: "Mugen Ku se recolhe para recuperar forcas.", disponivel: false }
]);

// ROTINA PADRAO DO ORI CHOI
cadastrarRotina("ori_choi", [
    { hora: 0, acao: "Vigilancia", descricao: "Ori Choi observa seus dominios nas sombras.", disponivel: false },
    { hora: 6, acao: "Planejamento", descricao: "Ori Choi planeja seus proximos movimentos.", disponivel: false },
    { hora: 12, acao: "Manipulacao", descricao: "Ori Choi manipula aliados e inimigos nos bastidores.", disponivel: true },
    { hora: 18, acao: "Execucao", descricao: "Ori Choi executa seus planos sombrios.", disponivel: true },
    { hora: 22, acao: "Recolhimento", descricao: "Ori Choi se recolhe para recuperar forcas.", disponivel: false }
]);

// ROTINA PADRAO DO PETRICHOR
cadastrarRotina("petrichor", [
    { hora: 0, acao: "Vigilancia", descricao: "Petrichor observa seus dominios nas sombras.", disponivel: false },
    { hora: 6, acao: "Planejamento", descricao: "Petrichor planeja seus proximos movimentos.", disponivel: false },
    { hora: 12, acao: "Manipulacao", descricao: "Petrichor manipula aliados e inimigos nos bastidores.", disponivel: true },
    { hora: 18, acao: "Execucao", descricao: "Petrichor executa seus planos sombrios.", disponivel: true },
    { hora: 22, acao: "Recolhimento", descricao: "Petrichor se recolhe para recuperar forcas.", disponivel: false }
]);

// ROTINA PADRAO DO PHENN DOYOUNG
cadastrarRotina("phenn_doyoung", [
    { hora: 6, acao: "Acorda e se prepara", descricao: "Phenn Doyoung acorda e se prepara para o dia.", disponivel: false },
    { hora: 8, acao: "Atende cacadores", descricao: "Phenn Doyoung atende cacadores que buscam ajuda.", disponivel: true },
    { hora: 12, acao: "Almoca", descricao: "Phenn Doyoung faz uma pausa para almocar.", disponivel: false },
    { hora: 13, acao: "Treina habilidades", descricao: "Phenn Doyoung treina suas habilidades de combate.", disponivel: true },
    { hora: 18, acao: "Atende novamente", descricao: "Phenn Doyoung retoma o atendimento aos cacadores.", disponivel: true },
    { hora: 21, acao: "Descansa", descricao: "Phenn Doyoung descansa apos um longo dia.", disponivel: false },
    { hora: 23, acao: "Dormindo", descricao: "Phenn Doyoung esta dormindo.", disponivel: false }
]);

// ROTINA PADRAO DO PIUS KANG
cadastrarRotina("pius_kang", [
    { hora: 6, acao: "Acorda e se prepara", descricao: "Pius Kang acorda e se prepara para o dia.", disponivel: false },
    { hora: 8, acao: "Atende cacadores", descricao: "Pius Kang atende cacadores que buscam ajuda.", disponivel: true },
    { hora: 12, acao: "Almoca", descricao: "Pius Kang faz uma pausa para almocar.", disponivel: false },
    { hora: 13, acao: "Treina habilidades", descricao: "Pius Kang treina suas habilidades de combate.", disponivel: true },
    { hora: 18, acao: "Atende novamente", descricao: "Pius Kang retoma o atendimento aos cacadores.", disponivel: true },
    { hora: 21, acao: "Descansa", descricao: "Pius Kang descansa apos um longo dia.", disponivel: false },
    { hora: 23, acao: "Dormindo", descricao: "Pius Kang esta dormindo.", disponivel: false }
]);

// ROTINA PADRAO DO REDEYE
cadastrarRotina("redeye", [
    { hora: 0, acao: "Vigilancia", descricao: "Redeye observa seus dominios nas sombras.", disponivel: false },
    { hora: 6, acao: "Planejamento", descricao: "Redeye planeja seus proximos movimentos.", disponivel: false },
    { hora: 12, acao: "Manipulacao", descricao: "Redeye manipula aliados e inimigos nos bastidores.", disponivel: true },
    { hora: 18, acao: "Execucao", descricao: "Redeye executa seus planos sombrios.", disponivel: true },
    { hora: 22, acao: "Recolhimento", descricao: "Redeye se recolhe para recuperar forcas.", disponivel: false }
]);

// ROTINA PADRAO DO REIME OH
cadastrarRotina("reime_oh", [
    { hora: 6, acao: "Acorda e se prepara", descricao: "Reime Oh acorda e se prepara para o dia.", disponivel: false },
    { hora: 8, acao: "Atende cacadores", descricao: "Reime Oh atende cacadores que buscam ajuda.", disponivel: true },
    { hora: 12, acao: "Almoca", descricao: "Reime Oh faz uma pausa para almocar.", disponivel: false },
    { hora: 13, acao: "Treina habilidades", descricao: "Reime Oh treina suas habilidades de combate.", disponivel: true },
    { hora: 18, acao: "Atende novamente", descricao: "Reime Oh retoma o atendimento aos cacadores.", disponivel: true },
    { hora: 21, acao: "Descansa", descricao: "Reime Oh descansa apos um longo dia.", disponivel: false },
    { hora: 23, acao: "Dormindo", descricao: "Reime Oh esta dormindo.", disponivel: false }
]);

// ROTINA PADRAO DO RICHARD HAN
cadastrarRotina("richard_han", [
    { hora: 6, acao: "Acorda e se prepara", descricao: "Richard Han acorda e se prepara para o dia.", disponivel: false },
    { hora: 8, acao: "Atende cacadores", descricao: "Richard Han atende cacadores que buscam ajuda.", disponivel: true },
    { hora: 12, acao: "Almoca", descricao: "Richard Han faz uma pausa para almocar.", disponivel: false },
    { hora: 13, acao: "Treina habilidades", descricao: "Richard Han treina suas habilidades de combate.", disponivel: true },
    { hora: 18, acao: "Atende novamente", descricao: "Richard Han retoma o atendimento aos cacadores.", disponivel: true },
    { hora: 21, acao: "Descansa", descricao: "Richard Han descansa apos um longo dia.", disponivel: false },
    { hora: 23, acao: "Dormindo", descricao: "Richard Han esta dormindo.", disponivel: false }
]);

// ROTINA PADRAO DO RONDO BAEK
cadastrarRotina("rondo_baek", [
    { hora: 6, acao: "Acorda e se prepara", descricao: "Rondo Baek acorda e se prepara para o dia.", disponivel: false },
    { hora: 8, acao: "Atende cacadores", descricao: "Rondo Baek atende cacadores que buscam ajuda.", disponivel: true },
    { hora: 12, acao: "Almoca", descricao: "Rondo Baek faz uma pausa para almocar.", disponivel: false },
    { hora: 13, acao: "Treina habilidades", descricao: "Rondo Baek treina suas habilidades de combate.", disponivel: true },
    { hora: 18, acao: "Atende novamente", descricao: "Rondo Baek retoma o atendimento aos cacadores.", disponivel: true },
    { hora: 21, acao: "Descansa", descricao: "Rondo Baek descansa apos um longo dia.", disponivel: false },
    { hora: 23, acao: "Dormindo", descricao: "Rondo Baek esta dormindo.", disponivel: false }
]);

// ROTINA PADRAO DO RUFUS DENG
cadastrarRotina("rufus_deng", [
    { hora: 0, acao: "Vigilancia", descricao: "Rufus Deng observa seus dominios nas sombras.", disponivel: false },
    { hora: 6, acao: "Planejamento", descricao: "Rufus Deng planeja seus proximos movimentos.", disponivel: false },
    { hora: 12, acao: "Manipulacao", descricao: "Rufus Deng manipula aliados e inimigos nos bastidores.", disponivel: true },
    { hora: 18, acao: "Execucao", descricao: "Rufus Deng executa seus planos sombrios.", disponivel: true },
    { hora: 22, acao: "Recolhimento", descricao: "Rufus Deng se recolhe para recuperar forcas.", disponivel: false }
]);

// ROTINA PADRAO DO SAOIRSE RYU
cadastrarRotina("saoirse_ryu", [
    { hora: 6, acao: "Acorda e se prepara", descricao: "Saoirse Ryu acorda e se prepara para o dia.", disponivel: false },
    { hora: 8, acao: "Atende cacadores", descricao: "Saoirse Ryu atende cacadores que buscam ajuda.", disponivel: true },
    { hora: 12, acao: "Almoca", descricao: "Saoirse Ryu faz uma pausa para almocar.", disponivel: false },
    { hora: 13, acao: "Treina habilidades", descricao: "Saoirse Ryu treina suas habilidades de combate.", disponivel: true },
    { hora: 18, acao: "Atende novamente", descricao: "Saoirse Ryu retoma o atendimento aos cacadores.", disponivel: true },
    { hora: 21, acao: "Descansa", descricao: "Saoirse Ryu descansa apos um longo dia.", disponivel: false },
    { hora: 23, acao: "Dormindo", descricao: "Saoirse Ryu esta dormindo.", disponivel: false }
]);

// ROTINA PADRAO DO SAZANTOS DO
cadastrarRotina("sazantos_do", [
    { hora: 6, acao: "Acorda e se prepara", descricao: "Sazantos Do acorda e se prepara para o dia.", disponivel: false },
    { hora: 8, acao: "Atende cacadores", descricao: "Sazantos Do atende cacadores que buscam ajuda.", disponivel: true },
    { hora: 12, acao: "Almoca", descricao: "Sazantos Do faz uma pausa para almocar.", disponivel: false },
    { hora: 13, acao: "Treina habilidades", descricao: "Sazantos Do treina suas habilidades de combate.", disponivel: true },
    { hora: 18, acao: "Atende novamente", descricao: "Sazantos Do retoma o atendimento aos cacadores.", disponivel: true },
    { hora: 21, acao: "Descansa", descricao: "Sazantos Do descansa apos um longo dia.", disponivel: false },
    { hora: 23, acao: "Dormindo", descricao: "Sazantos Do esta dormindo.", disponivel: false }
]);

// ROTINA PADRAO DO SIMEON HA
cadastrarRotina("simeon_ha", [
    { hora: 0, acao: "Vigilancia", descricao: "Simeon Ha observa seus dominios nas sombras.", disponivel: false },
    { hora: 6, acao: "Planejamento", descricao: "Simeon Ha planeja seus proximos movimentos.", disponivel: false },
    { hora: 12, acao: "Manipulacao", descricao: "Simeon Ha manipula aliados e inimigos nos bastidores.", disponivel: true },
    { hora: 18, acao: "Execucao", descricao: "Simeon Ha executa seus planos sombrios.", disponivel: true },
    { hora: 22, acao: "Recolhimento", descricao: "Simeon Ha se recolhe para recuperar forcas.", disponivel: false }
]);

// ROTINA PADRAO DO SOLON WI
cadastrarRotina("solon_wi", [
    { hora: 6, acao: "Acorda e se prepara", descricao: "Solon Wi acorda e se prepara para o dia.", disponivel: false },
    { hora: 8, acao: "Atende cacadores", descricao: "Solon Wi atende cacadores que buscam ajuda.", disponivel: true },
    { hora: 12, acao: "Almoca", descricao: "Solon Wi faz uma pausa para almocar.", disponivel: false },
    { hora: 13, acao: "Treina habilidades", descricao: "Solon Wi treina suas habilidades de combate.", disponivel: true },
    { hora: 18, acao: "Atende novamente", descricao: "Solon Wi retoma o atendimento aos cacadores.", disponivel: true },
    { hora: 21, acao: "Descansa", descricao: "Solon Wi descansa apos um longo dia.", disponivel: false },
    { hora: 23, acao: "Dormindo", descricao: "Solon Wi esta dormindo.", disponivel: false }
]);

// ROTINA PADRAO DO STIA HAN
cadastrarRotina("stia_han", [
    { hora: 6, acao: "Acorda e se prepara", descricao: "Stia Han acorda e se prepara para o dia.", disponivel: false },
    { hora: 8, acao: "Atende cacadores", descricao: "Stia Han atende cacadores que buscam ajuda.", disponivel: true },
    { hora: 12, acao: "Almoca", descricao: "Stia Han faz uma pausa para almocar.", disponivel: false },
    { hora: 13, acao: "Treina habilidades", descricao: "Stia Han treina suas habilidades de combate.", disponivel: true },
    { hora: 18, acao: "Atende novamente", descricao: "Stia Han retoma o atendimento aos cacadores.", disponivel: true },
    { hora: 21, acao: "Descansa", descricao: "Stia Han descansa apos um longo dia.", disponivel: false },
    { hora: 23, acao: "Dormindo", descricao: "Stia Han esta dormindo.", disponivel: false }
]);

// ROTINA PADRAO DO TANZY WOO
cadastrarRotina("tanzy_woo", [
    { hora: 0, acao: "Vigilancia", descricao: "Tanzy Woo observa seus dominios nas sombras.", disponivel: false },
    { hora: 6, acao: "Planejamento", descricao: "Tanzy Woo planeja seus proximos movimentos.", disponivel: false },
    { hora: 12, acao: "Manipulacao", descricao: "Tanzy Woo manipula aliados e inimigos nos bastidores.", disponivel: true },
    { hora: 18, acao: "Execucao", descricao: "Tanzy Woo executa seus planos sombrios.", disponivel: true },
    { hora: 22, acao: "Recolhimento", descricao: "Tanzy Woo se recolhe para recuperar forcas.", disponivel: false }
]);

// ROTINA PADRAO DO TATLOCH
cadastrarRotina("tatloch", [
    { hora: 0, acao: "Vigilancia", descricao: "Tatloch observa seus dominios nas sombras.", disponivel: false },
    { hora: 6, acao: "Planejamento", descricao: "Tatloch planeja seus proximos movimentos.", disponivel: false },
    { hora: 12, acao: "Manipulacao", descricao: "Tatloch manipula aliados e inimigos nos bastidores.", disponivel: true },
    { hora: 18, acao: "Execucao", descricao: "Tatloch executa seus planos sombrios.", disponivel: true },
    { hora: 22, acao: "Recolhimento", descricao: "Tatloch se recolhe para recuperar forcas.", disponivel: false }
]);

// ROTINA PADRAO DO TRISH YAMAGUCHI
cadastrarRotina("trish_yamaguchi", [
    { hora: 0, acao: "Vigilancia", descricao: "Trish Yamaguchi observa seus dominios nas sombras.", disponivel: false },
    { hora: 6, acao: "Planejamento", descricao: "Trish Yamaguchi planeja seus proximos movimentos.", disponivel: false },
    { hora: 12, acao: "Manipulacao", descricao: "Trish Yamaguchi manipula aliados e inimigos nos bastidores.", disponivel: true },
    { hora: 18, acao: "Execucao", descricao: "Trish Yamaguchi executa seus planos sombrios.", disponivel: true },
    { hora: 22, acao: "Recolhimento", descricao: "Trish Yamaguchi se recolhe para recuperar forcas.", disponivel: false }
]);

// ROTINA PADRAO DO VANESSA HYSEL
cadastrarRotina("vanessa_hysel", [
    { hora: 0, acao: "Vigilancia", descricao: "Vanessa Hysel observa seus dominios nas sombras.", disponivel: false },
    { hora: 6, acao: "Planejamento", descricao: "Vanessa Hysel planeja seus proximos movimentos.", disponivel: false },
    { hora: 12, acao: "Manipulacao", descricao: "Vanessa Hysel manipula aliados e inimigos nos bastidores.", disponivel: true },
    { hora: 18, acao: "Execucao", descricao: "Vanessa Hysel executa seus planos sombrios.", disponivel: true },
    { hora: 22, acao: "Recolhimento", descricao: "Vanessa Hysel se recolhe para recuperar forcas.", disponivel: false }
]);

// ROTINA PADRAO DO VIATOR YOON
cadastrarRotina("viator_yoon", [
    { hora: 6, acao: "Acorda e se prepara", descricao: "Viator Yoon acorda e se prepara para o dia.", disponivel: false },
    { hora: 8, acao: "Atende cacadores", descricao: "Viator Yoon atende cacadores que buscam ajuda.", disponivel: true },
    { hora: 12, acao: "Almoca", descricao: "Viator Yoon faz uma pausa para almocar.", disponivel: false },
    { hora: 13, acao: "Treina habilidades", descricao: "Viator Yoon treina suas habilidades de combate.", disponivel: true },
    { hora: 18, acao: "Atende novamente", descricao: "Viator Yoon retoma o atendimento aos cacadores.", disponivel: true },
    { hora: 21, acao: "Descansa", descricao: "Viator Yoon descansa apos um longo dia.", disponivel: false },
    { hora: 23, acao: "Dormindo", descricao: "Viator Yoon esta dormindo.", disponivel: false }
]);

// ROTINA PADRAO DO WARDEN DAVIDS
cadastrarRotina("warden_davids", [
    { hora: 0, acao: "Vigilancia", descricao: "Warden Davids observa seus dominios nas sombras.", disponivel: false },
    { hora: 6, acao: "Planejamento", descricao: "Warden Davids planeja seus proximos movimentos.", disponivel: false },
    { hora: 12, acao: "Manipulacao", descricao: "Warden Davids manipula aliados e inimigos nos bastidores.", disponivel: true },
    { hora: 18, acao: "Execucao", descricao: "Warden Davids executa seus planos sombrios.", disponivel: true },
    { hora: 22, acao: "Recolhimento", descricao: "Warden Davids se recolhe para recuperar forcas.", disponivel: false }
]);

// ROTINA PADRAO DO WERNER CHOI
cadastrarRotina("werner_choi", [
    { hora: 0, acao: "Vigilancia", descricao: "Werner Choi observa seus dominios nas sombras.", disponivel: false },
    { hora: 6, acao: "Planejamento", descricao: "Werner Choi planeja seus proximos movimentos.", disponivel: false },
    { hora: 12, acao: "Manipulacao", descricao: "Werner Choi manipula aliados e inimigos nos bastidores.", disponivel: true },
    { hora: 18, acao: "Execucao", descricao: "Werner Choi executa seus planos sombrios.", disponivel: true },
    { hora: 22, acao: "Recolhimento", descricao: "Werner Choi se recolhe para recuperar forcas.", disponivel: false }
]);

// ROTINA PADRAO DO XERC BAEK
cadastrarRotina("xerc_baek", [
    { hora: 6, acao: "Acorda e se prepara", descricao: "Xerc Baek acorda e se prepara para o dia.", disponivel: false },
    { hora: 8, acao: "Atende cacadores", descricao: "Xerc Baek atende cacadores que buscam ajuda.", disponivel: true },
    { hora: 12, acao: "Almoca", descricao: "Xerc Baek faz uma pausa para almocar.", disponivel: false },
    { hora: 13, acao: "Treina habilidades", descricao: "Xerc Baek treina suas habilidades de combate.", disponivel: true },
    { hora: 18, acao: "Atende novamente", descricao: "Xerc Baek retoma o atendimento aos cacadores.", disponivel: true },
    { hora: 21, acao: "Descansa", descricao: "Xerc Baek descansa apos um longo dia.", disponivel: false },
    { hora: 23, acao: "Dormindo", descricao: "Xerc Baek esta dormindo.", disponivel: false }
]);

// ROTINA PADRAO DO YVON BAIK
cadastrarRotina("yvon_baik", [
    { hora: 0, acao: "Vigilancia", descricao: "Yvon Baik observa seus dominios nas sombras.", disponivel: false },
    { hora: 6, acao: "Planejamento", descricao: "Yvon Baik planeja seus proximos movimentos.", disponivel: false },
    { hora: 12, acao: "Manipulacao", descricao: "Yvon Baik manipula aliados e inimigos nos bastidores.", disponivel: true },
    { hora: 18, acao: "Execucao", descricao: "Yvon Baik executa seus planos sombrios.", disponivel: true },
    { hora: 22, acao: "Recolhimento", descricao: "Yvon Baik se recolhe para recuperar forcas.", disponivel: false }
]);

module.exports = {
    cadastrarRotina,
    carregarRotinaDoNPC,
    obterRotinaAtual,
    estaDisponivel,
    obterHoraAtual,
    obterContextoRotina,
    listarRotinas,
    removerRotina
};