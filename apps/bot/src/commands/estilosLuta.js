const MessageService = require("../core/messageService");

const db = require("../core/database");

module.exports = async (msg) => {

    // Buscar estilos do banco de dados
    const estilos = await new Promise((resolve, reject) => {
        db.all("SELECT * FROM estilos_luta", (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows || []);
            }
        });
    });

    if (estilos.length === 0) {
        await MessageService.send({ message: msg, text: "*✖ Nenhum estilo de luta encontrado.*" });
        return;
    }

    let mensagem = `
*ESTILOS DE LUTA DISPONIVEIS*
═
`;

    estilos.forEach((estilo, index) => {

        const requisitos = JSON.parse(estilo.requisitos || "[]");

        mensagem += `
═
*${index + 1} - ${estilo.nome}*
> Arma: ${estilo.arma || "Nao informado"}
> Descricao: ${estilo.descricao || "Sem descricao cadastrada."}
> Tecnica: ${estilo.tecnica_nome || "Nenhuma tecnica definida."}
> Custo de Mana: ${estilo.custo_mana || 0} MP

*Requisitos:*
`;

        if (requisitos.length > 0) {
            requisitos.forEach((req) => {
                mensagem += `> ${req}\n`;
            });
        } else {
            mensagem += `> Nenhum requisito cadastrado.\n`;
        }

    });

    mensagem += `
═
*PROFICIENCIA DEFINIDA PELA FICHA*
> O estilo de luta nao e escolhido por comando.
> A proficiencia informada no campo *Estilo de luta* da ficha e a que sera registrada.
═
_Sistema de Combate_
`;

    await MessageService.send({ message: msg, text: mensagem });

};
