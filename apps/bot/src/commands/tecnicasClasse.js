const MessageService = require("../core/messageService");

const db = require("../core/database");

function normalizar(valor) {
    return String(valor || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

function resolverConsultaClasse(nomeClasse) {
    const chave = normalizar(nomeClasse);
    const consultas = {
        // =====================================
        // CLASSES INICIAIS
        // =====================================
        "mago de barreira": { titulo: "Mago de Barreira", nomes: ["Mago de Barreira", "Mago Barreira"], padrao: "mago%barreira" },
        "mago barreira": { titulo: "Mago de Barreira", nomes: ["Mago de Barreira", "Mago Barreira"], padrao: "mago%barreira" },
        "mago de maldicao": { titulo: "Mago de Maldição", nomes: ["Mago de Maldição", "Mago Maldição"], padrao: "mago%maldi%" },
        "mago maldicao": { titulo: "Mago de Maldição", nomes: ["Mago de Maldição", "Mago Maldição"], padrao: "mago%maldi%" },
        "mago elemental": { titulo: "Mago Elemental", nomes: ["Mago Elemental"] },
        "mago elementar": { titulo: "Mago Elemental", nomes: ["Mago Elemental"] },
        "mago do elemento": { titulo: "Mago Elemental", nomes: ["Mago Elemental"] },
        "ranger fisico": { titulo: "Ranger Físico", nomes: ["Ranger"] },
        "ranger magico": { titulo: "Ranger Mágico", nomes: ["Ranger"] },

        // =====================================
        // ESTILOS DE LUTA - ARMAS
        // Cada comando de arma consulta as técnicas
        // do ESTILO DE LUTA correspondente (categoria Proficiencia)
        // =====================================
        "espada": { titulo: "Estilo de Luta - Espadas", estilo: "Espadas" },
        "espadas": { titulo: "Estilo de Luta - Espadas", estilo: "Espadas" },
        "espadachim": { titulo: "Estilo de Luta - Espadas", estilo: "Espadas" },
        "espadao": { titulo: "Estilo de Luta - Espadas Pesadas", estilo: "Espadas Pesadas" },
        "espadão": { titulo: "Estilo de Luta - Espadas Pesadas", estilo: "Espadas Pesadas" },
        "espadoes": { titulo: "Estilo de Luta - Espadas Pesadas", estilo: "Espadas Pesadas" },
        "espadões": { titulo: "Estilo de Luta - Espadas Pesadas", estilo: "Espadas Pesadas" },
        "espadas pesadas": { titulo: "Estilo de Luta - Espadas Pesadas", estilo: "Espadas Pesadas" },
        "espada pesada": { titulo: "Estilo de Luta - Espadas Pesadas", estilo: "Espadas Pesadas" },
        "espadas pesadas duplas": { titulo: "Estilo de Luta - Espadas Pesadas Duplas", estilo: "Espadas Pesadas Duplas" },
        "espados pesadas dupla": { titulo: "Estilo de Luta - Espadas Pesadas Duplas", estilo: "Espadas Pesadas Duplas" },
        "espadoes duplos": { titulo: "Estilo de Luta - Espadas Pesadas Duplas", estilo: "Espadas Pesadas Duplas" },
        "espadões duplos": { titulo: "Estilo de Luta - Espadas Pesadas Duplas", estilo: "Espadas Pesadas Duplas" },
        "kanabo": { titulo: "Estilo de Luta - Kanabo", estilo: "Kanabo" },
        "katana": { titulo: "Estilo de Luta - Katanas", estilo: "Katanas" },
        "katanas": { titulo: "Estilo de Luta - Katanas", estilo: "Katanas" },
        "adaga": { titulo: "Estilo de Luta - Adagas", estilo: "Adagas" },
        "adagas": { titulo: "Estilo de Luta - Adagas", estilo: "Adagas" },
        "faca": { titulo: "Estilo de Luta - Facas", estilo: "Facas" },
        "facas": { titulo: "Estilo de Luta - Facas", estilo: "Facas" },
        "arremesso": { titulo: "Estilo de Luta - Facas", estilo: "Facas" },
        "lanca": { titulo: "Estilo de Luta - Lanças", estilo: "Lanças" },
        "lança": { titulo: "Estilo de Luta - Lanças", estilo: "Lanças" },
        "lanças": { titulo: "Estilo de Luta - Lanças", estilo: "Lanças" },
        "lancas": { titulo: "Estilo de Luta - Lanças", estilo: "Lanças" },
        "cajado": { titulo: "Estilo de Luta - Cajados e Orbes", estilo: "Cajados e Orbes" },
        "cajados": { titulo: "Estilo de Luta - Cajados e Orbes", estilo: "Cajados e Orbes" },
        "cajados e orbes": { titulo: "Estilo de Luta - Cajados e Orbes", estilo: "Cajados e Orbes" },
        "cajado e orbe": { titulo: "Estilo de Luta - Cajados e Orbes", estilo: "Cajados e Orbes" },
        "orbe": { titulo: "Estilo de Luta - Cajados e Orbes", estilo: "Cajados e Orbes" },
        "orbes": { titulo: "Estilo de Luta - Cajados e Orbes", estilo: "Cajados e Orbes" },
        "grimorio": { titulo: "Estilo de Luta - Cajados e Orbes", estilo: "Cajados e Orbes" },
        "grimório": { titulo: "Estilo de Luta - Cajados e Orbes", estilo: "Cajados e Orbes" },
        "arco": { titulo: "Estilo de Luta - Arcos", estilo: "Arcos" },
        "arcos": { titulo: "Estilo de Luta - Arcos", estilo: "Arcos" },
        "pistola": { titulo: "Estilo de Luta - Pistolas", estilo: "Pistolas" },
        "pistolas": { titulo: "Estilo de Luta - Pistolas", estilo: "Pistolas" },
        "revolver": { titulo: "Estilo de Luta - Pistolas", estilo: "Pistolas" },
        "rifle": { titulo: "Estilo de Luta - Fuzis", estilo: "Fuzis" },
        "rifles": { titulo: "Estilo de Luta - Fuzis", estilo: "Fuzis" },
        "fuzil": { titulo: "Estilo de Luta - Fuzis", estilo: "Fuzis" },
        "fuzis": { titulo: "Estilo de Luta - Fuzis", estilo: "Fuzis" },
        "escopeta": { titulo: "Estilo de Luta - Escopetas", estilo: "Escopetas" },
        "escopetas": { titulo: "Estilo de Luta - Escopetas", estilo: "Escopetas" },
        "espingarda": { titulo: "Estilo de Luta - Escopetas", estilo: "Escopetas" },
        "sniper": { titulo: "Estilo de Luta - Rifles de Precisão", estilo: "Rifles de Precisão" },
        "rifle de precisao": { titulo: "Estilo de Luta - Rifles de Precisão", estilo: "Rifles de Precisão" },
        "rifles de precisao": { titulo: "Estilo de Luta - Rifles de Precisão", estilo: "Rifles de Precisão" },
        "rifles de precisão": { titulo: "Estilo de Luta - Rifles de Precisão", estilo: "Rifles de Precisão" },
        "punhos": { titulo: "Estilo de Luta - Combate Desarmado", estilo: "Combate Desarmado" },
        "punho": { titulo: "Estilo de Luta - Combate Desarmado", estilo: "Combate Desarmado" },
        "combate desarmado": { titulo: "Estilo de Luta - Combate Desarmado", estilo: "Combate Desarmado" },
        "artes marciais": { titulo: "Estilo de Luta - Combate Desarmado", estilo: "Combate Desarmado" },
        "escudo": { titulo: "Estilo de Luta - Escudos", estilo: "Escudos" },
        "escudos": { titulo: "Estilo de Luta - Escudos", estilo: "Escudos" },
        "foice": { titulo: "Estilo de Luta - Foices", estilo: "Foices" },
        "foices": { titulo: "Estilo de Luta - Foices", estilo: "Foices" },
        "corrente": { titulo: "Estilo de Luta - Correntes", estilo: "Correntes" },
        "correntes": { titulo: "Estilo de Luta - Correntes", estilo: "Correntes" },
        "machado": { titulo: "Estilo de Luta - Machados", estilo: "Machados" },
        "machados": { titulo: "Estilo de Luta - Machados", estilo: "Machados" },
        "martelo": { titulo: "Estilo de Luta - Martelos", estilo: "Martelos" },
        "martelos": { titulo: "Estilo de Luta - Martelos", estilo: "Martelos" },
        "chicote": { titulo: "Estilo de Luta - Chicotes", estilo: "Chicotes" },
        "chicotes": { titulo: "Estilo de Luta - Chicotes", estilo: "Chicotes" },
        "manopla": { titulo: "Estilo de Luta - Manoplas", estilo: "Manoplas" },
        "manoplas": { titulo: "Estilo de Luta - Manoplas", estilo: "Manoplas" },
        "besta": { titulo: "Estilo de Luta - Bestas", estilo: "Bestas" },
        "bestas": { titulo: "Estilo de Luta - Bestas", estilo: "Bestas" },
        "bumerangue": { titulo: "Estilo de Luta - Bumerangues", estilo: "Bumerangues" },
        "bumerangues": { titulo: "Estilo de Luta - Bumerangues", estilo: "Bumerangues" },
        "garra": { titulo: "Estilo de Luta - Garras", estilo: "Garras" },
        "garras": { titulo: "Estilo de Luta - Garras", estilo: "Garras" },
        "sabre": { titulo: "Estilo de Luta - Sabres", estilo: "Sabres" },
        "sabres": { titulo: "Estilo de Luta - Sabres", estilo: "Sabres" },
        "foices duplas": { titulo: "Estilo de Luta - Foices Duplas", estilo: "Foices Duplas" },
        "foices dupla": { titulo: "Estilo de Luta - Foices Duplas", estilo: "Foices Duplas" },
        "tridente": { titulo: "Estilo de Luta - Tridentes", estilo: "Tridentes" },
        "tridentes": { titulo: "Estilo de Luta - Tridentes", estilo: "Tridentes" },
        "clava": { titulo: "Estilo de Luta - Clavas", estilo: "Clavas" },
        "clavas": { titulo: "Estilo de Luta - Clavas", estilo: "Clavas" },
        "florete": { titulo: "Estilo de Luta - Floretes", estilo: "Floretes" },
        "floretes": { titulo: "Estilo de Luta - Floretes", estilo: "Floretes" },
        "chakram": { titulo: "Estilo de Luta - Chakrams", estilo: "Chakrams" },
        "chakrams": { titulo: "Estilo de Luta - Chakrams", estilo: "Chakrams" },
        "luvas": { titulo: "Estilo de Luta - Luvas de Combate", estilo: "Luvas de Combate" },
        "luvas de combate": { titulo: "Estilo de Luta - Luvas de Combate", estilo: "Luvas de Combate" },
        "mangual": { titulo: "Estilo de Luta - Manguais", estilo: "Manguais" },
        "manguais": { titulo: "Estilo de Luta - Manguais", estilo: "Manguais" },
        "alabarda": { titulo: "Estilo de Luta - Alabardas", estilo: "Alabardas" },
        "alabardas": { titulo: "Estilo de Luta - Alabardas", estilo: "Alabardas" },
        "nunchaku": { titulo: "Estilo de Luta - Nunchakus", estilo: "Nunchakus" },
        "nunchakus": { titulo: "Estilo de Luta - Nunchakus", estilo: "Nunchakus" },
        "tonfa": { titulo: "Estilo de Luta - Tonfas", estilo: "Tonfas" },
        "tonfas": { titulo: "Estilo de Luta - Tonfas", estilo: "Tonfas" },
        "kama": { titulo: "Estilo de Luta - Kamas", estilo: "Kamas" },
        "kamas": { titulo: "Estilo de Luta - Kamas", estilo: "Kamas" },
        "rapieira": { titulo: "Estilo de Luta - Rapieiras", estilo: "Rapieiras" },
        "rapieiras": { titulo: "Estilo de Luta - Rapieiras", estilo: "Rapieiras" },
        "baculo": { titulo: "Estilo de Luta - Báculos", estilo: "Báculos" },
        "báculo": { titulo: "Estilo de Luta - Báculos", estilo: "Báculos" },
        "báculos": { titulo: "Estilo de Luta - Báculos", estilo: "Báculos" },
        "baculos": { titulo: "Estilo de Luta - Báculos", estilo: "Báculos" },
        "cimitarra": { titulo: "Estilo de Luta - Cimitarras", estilo: "Cimitarras" },
        "cimitarras": { titulo: "Estilo de Luta - Cimitarras", estilo: "Cimitarras" },
        "picareta": { titulo: "Estilo de Luta - Picaretas de Guerra", estilo: "Picaretas de Guerra" },
        "picaretas": { titulo: "Estilo de Luta - Picaretas de Guerra", estilo: "Picaretas de Guerra" },
        "picaretas de guerra": { titulo: "Estilo de Luta - Picaretas de Guerra", estilo: "Picaretas de Guerra" },
        "bastao": { titulo: "Estilo de Luta - Bastões", estilo: "Bastões" },
        "bastão": { titulo: "Estilo de Luta - Bastões", estilo: "Bastões" },
        "bastões": { titulo: "Estilo de Luta - Bastões", estilo: "Bastões" },
        "bastoes": { titulo: "Estilo de Luta - Bastões", estilo: "Bastões" },
        "funda": { titulo: "Estilo de Luta - Funda", estilo: "Funda" },
        "fundas": { titulo: "Estilo de Luta - Funda", estilo: "Funda" },
        "laminas duplas": { titulo: "Estilo de Luta - Lâminas Duplas", estilo: "Lâminas Duplas" },
        "lâminas duplas": { titulo: "Estilo de Luta - Lâminas Duplas", estilo: "Lâminas Duplas" },
        "lamina dupla": { titulo: "Estilo de Luta - Lâminas Duplas", estilo: "Lâminas Duplas" },
        "lâmina dupla": { titulo: "Estilo de Luta - Lâminas Duplas", estilo: "Lâminas Duplas" },
        "kusarigama": { titulo: "Estilo de Luta - Correntes com Foice", estilo: "Correntes com Foice" },
        "correntes com foice": { titulo: "Estilo de Luta - Correntes com Foice", estilo: "Correntes com Foice" },
        "leques": { titulo: "Estilo de Luta - Leques de Guerra", estilo: "Leques de Guerra" },
        "leques de guerra": { titulo: "Estilo de Luta - Leques de Guerra", estilo: "Leques de Guerra" },
        "leque": { titulo: "Estilo de Luta - Leques de Guerra", estilo: "Leques de Guerra" },
        "instrumentos": { titulo: "Estilo de Luta - Instrumentos Musicais", estilo: "Instrumentos Musicais" },
        "instrumentos musicais": { titulo: "Estilo de Luta - Instrumentos Musicais", estilo: "Instrumentos Musicais" },
        "instrumento": { titulo: "Estilo de Luta - Instrumentos Musicais", estilo: "Instrumentos Musicais" }
    };
    if (/^mago (?:de |elemental )?(agua|fogo|gelo|terra|vento|raio)$/.test(chave)) {
        return { titulo: "Mago Elemental", nomes: ["Mago Elemental"] };
    }
    return consultas[chave] || { titulo: nomeClasse, nomes: [nomeClasse] };
}

module.exports = async (msg, nomeClasse) => {
    const consulta = resolverConsultaClasse(nomeClasse);

    // =====================================
    // BUSCA POR ESTILO DE LUTA (categoria Proficiencia)
    // =====================================
    if (consulta.estilo) {
        const estiloLower = String(consulta.estilo).toLowerCase();
        db.all(
            `SELECT * FROM tecnicas 
             WHERE LOWER(classe) = ? 
             ORDER BY nivel_desbloqueio ASC, nome ASC`,
            [estiloLower],
            async (err, tecnicas) => {
                if (err) {
                    console.log("Erro ao buscar tecnicas de estilo:", err);
                    return MessageService.send({ message: msg, text: "*✖ Erro interno ao buscar tecnicas.*" });
                }

                if (!tecnicas || tecnicas.length === 0) {
                    return MessageService.send({
                        message: msg,
                        text: `*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*\n*TÉCNICAS DE ESTILO DE LUTA: ${consulta.titulo.toUpperCase()}*\n*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*\n\n_Este estilo de luta ainda não possui técnicas registradas._\n\n_Cada classe possui suas próprias técnicas, e as técnicas de armas agora pertencem aos estilos de luta._\n\n> O jogador precisa ter a proficiência *${consulta.estilo}* na ficha para comprar estas técnicas.\n\n> Use *!comprar técnica <nome>* para adquirir técnicas deste estilo.\n\n────────────────────────══\n_Sistema Online_`
                    });
                }

                let mensagem = `
*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*
*TÉCNICAS DE ESTILO DE LUTA: ${consulta.titulo.toUpperCase()}*
*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*

`;

                tecnicas.forEach((tecnica, index) => {
                    const tipo = tecnica.passiva ? "Passiva" : tecnica.tipo || "Ativa";
                    mensagem += `*${index + 1}. ${tecnica.nome}*\n`;
                    mensagem += `> *Tipo:* ${tipo}\n`;
                    mensagem += `> *Custo:* ${tecnica.custo_mana || 0} MP\n`;
                    mensagem += `> *Cooldown:* ${tecnica.cooldown || 0} turno(s)\n`;
                    mensagem += `> *Nível:* ${tecnica.nivel_desbloqueio || 1}\n`;
                    mensagem += `> *Descrição:* ${(tecnica.descricao || "Sem descrição.").substring(0, 100)}${(tecnica.descricao || "").length > 100 ? "..." : ""}\n\n`;
                });

                mensagem += `
────────────────────────══
_Para comprar: !comprar técnica <nome>_
_Requer proficiência: ${consulta.estilo} na ficha_
_Sistema Online_
`;

                await MessageService.send({ message: msg, text: mensagem });
            }
        );
        return;
    }

    // =====================================
    // BUSCA POR CLASSE (comportamento original)
    // =====================================
    const placeholders = consulta.nomes.map(() => "?").join(", ");
    const sql = consulta.padrao
        ? "SELECT * FROM tecnicas WHERE LOWER(classe) LIKE ? ORDER BY nivel_desbloqueio ASC, nome ASC"
        : `SELECT * FROM tecnicas WHERE LOWER(classe) IN (${placeholders}) ORDER BY nivel_desbloqueio ASC, nome ASC`;
    const parametros = consulta.padrao ? [consulta.padrao] : consulta.nomes.map(nome => nome.toLowerCase());

    db.all(
        sql,
        parametros,
        async (err, tecnicas) => {
            if (err) {
                console.log("Erro ao buscar tecnicas:", err);
                return MessageService.send({ message: msg, text: "*✖ Erro interno ao buscar tecnicas.*" });
            }

            if (!tecnicas || tecnicas.length === 0) {
                return MessageService.send({ message: msg, text: `*✖ Nenhuma tecnica encontrada para a classe ${consulta.titulo}.*` });
            }

            let mensagem = `
*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*
*TÉCNICAS: ${consulta.titulo.toUpperCase()}*
*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*

`;

            tecnicas.forEach((tecnica, index) => {
                const tipo = tecnica.passiva ? "Passiva" : tecnica.tipo || "Ativa";
                mensagem += `*${index + 1}. ${tecnica.nome}*\n`;
                mensagem += `> *Tipo:* ${tipo}\n`;
                mensagem += `> *Custo:* ${tecnica.custo_mana || 0} MP\n`;
                mensagem += `> *Cooldown:* ${tecnica.cooldown || 0} turno(s)\n`;
                mensagem += `> *Nível:* ${tecnica.nivel_desbloqueio || 1}\n`;
                mensagem += `> *Descrição:* ${(tecnica.descricao || "Sem descrição.").substring(0, 100)}${(tecnica.descricao || "").length > 100 ? "..." : ""}\n\n`;
            });

            mensagem += `
────────────────────────══
_Sistema Online_
`;

            await MessageService.send({ message: msg, text: mensagem });
        }
    );
};

module.exports.resolverConsultaClasse = resolverConsultaClasse;