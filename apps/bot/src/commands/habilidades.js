const MessageService = require("../core/messageService");

module.exports = async (msg) => {
    const mensagem = `
*═══ SUAS HABILIDADES ═══*

*─── Habilidades Ativas ───*
> Técnicas que podem ser usadas em combate
> Consomem mana e tem cooldown
> Equipe com !equipar <técnica>

*─── Habilidades Passivas ───*
> Bônus permanentes para o personagem
> Sao sempre ativas e nao exigem ativacao manual
> Consulte as suas com !minhas passivas

──────────────────────────
_Use !habilidades <nome> para ver detalhes_
`;
    await MessageService.send({ message: msg, text: mensagem });
};
