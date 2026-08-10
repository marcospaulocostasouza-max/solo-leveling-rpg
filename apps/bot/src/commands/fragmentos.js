const MessageService = require("../core/messageService");

/**
 * COMANDO: !fragmentos
 * 
 * Sistema de Fragmentos dos Governantes.
 */

module.exports = async (msg) => {
    const mensagem = `
*─ Fragmentos ✨ ─*

Os Fragmentos representam porções do poder dos Governantes, entidades superiores ligadas à Ordem e responsáveis por manter o equilíbrio do mundo. Aqueles que se tornam receptáculos desses fragmentos ganham um poder imenso, mas também assumem responsabilidades e missões específicas.

══════════════════════════

*SISTEMA DE FRAGMENTOS DOS GOVERNANTES*

*COMO SE TORNAR UM FRAGMENTO*
- Atributos Obrigatorio: 200 pontos em Resistencia OU 500 pontos somando todos atributos (20% em Resistencia)
- Apenas pontos de UP, Rank e bonus de classe (sem itens, skills, runas ou guilda)
- Feitos Heroicos: Enfrentar um Boss sozinho para salvar aliados
- Chamado do Governante: Se aprovado, recebe um Desafio do Governante

*RANKS DOS FRAGMENTOS*
- Fragmento da Luz Intensa (0/1): x2,5 atributos, 2 caminhos, Skill Dominio
- Fragmento da Luz Brilhante (0/5): x2,2 atributos, 1 caminho
- Fragmento da Luz sem Limite: x2 atributos (exceto resistencia), 1 caminho

*PASSIVAS*
- Luz Intensa: +20% dano em Dungeons do tipo, +30% resistencia
- Luz Brilhante: +15% dano, +20% resistencia
- Luz: +10% dano, +10% resistencia

*SKILL DOMINIO (Apenas Luz Intensa)*
Custo: 20% da Mana Maxima
Area: 75m de diametro
Duracao: 1 turno para cada 3.000 de Mana
Efeitos: +15% dano aliados, +20% velocidade/ataque fragmento, -15% inimigos
    `;
    
    await MessageService.send({ message: msg, text: mensagem });
};