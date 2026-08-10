const MessageService = require("../core/messageService");

/**
 * COMANDO: !loja materiais
 *
 * Exibe o catálogo da Loja de Materiais do mercador.
 * Materiais classificados por Tier (1 a 5), incluindo metais, madeiras,
 * ingredientes e encantamentos.
 */

module.exports = async (msg) => {
    const mensagem = `
*─ Loja de Materiais 🪚 ─*

_Antes de mais nada, a loja a seguir contém materiais que não são todos os possíveis de se obter. A loja do mercador serve como um meio de fornecer e patrocinar todos os caçadores que abandonaram a vida de limpar RAIDs para se especializar na forja e encantamento de equipamentos. Aqui, estão reunidos os mais diversos materiais, classificados por Tier. Cada Tier varia de rank, definindo o quanto uma classe de craft pode comprar._

_Por se tratar de um meio mais acessível e fácil de se obter diversos materiais, Tiers altos só podem ser acessados por aqueles que investem no mercador, tendo que atingir metas específicas para liberar cada Tier e obter o passe para materiais mais raros e poderosos._

┈┈┈┈┈┈┈┈┈┈
*[Tier 1]*
*↳* Materiais ainda muito poderosos, mas básicos, encontrados em quase todos os portais e dungeons. Materiais classificados como *Rank E ao D*.

*[Tier 2]*
*↳* Materiais mais fortes, com aplicações específicas ou mais eficazes contra certos tipos de criaturas. Classificados como *Rank C*.

*[Tier 3]*
*↳* Materiais raros, mais difíceis de obter e trabalhados por classes avançadas. Classificados como *Rank B*.

*[Tier 4]*
*↳* Materiais de valor inestimável e extremamente poderosos. Acesso a esses materiais requer a forja de 5 itens de Tier 3. Classificados como *Rank A*.

*[Tier 5]*
*↳* Materiais lendários, de lendas e mitos, quase impossíveis de obter. Para utilizá-los, é necessário forjar 3 itens de Tier 4. Classificados como *Rank S*.
┈┈┈┈┈┈┈┈┈┈
_Inicialmente qualquer classe focada em craft começa no Tier 2, ao atingir o rank B irá para o 3._
_Para um tier ser desbloqueado, deve ter liberado o anterior primeiro, tendo que cumprir separadamente a condição de cada um._
┈┈┈┈┈┈┈┈┈┈
     _*Metais*_

    ┈໋┈̟╾ *Tier 1*
* *Couro* [E] [20K]
↳ Agilidade e leveza.
* *Latão* [E] [20K]
↳ Resistência e leveza.
* *Ferro* [D] [35K]
↳ Resistência física e durabilidade.
* *Cobre* [D] [35K]
↳ Inteligência e condução de energia mágica.

    ┈໋┈̟╾ *Tier 2 - [50.000₩]*
* *Aço*
↳ Força e resistência.
* *Ouro*
↳ Poder mágico e proteção contra maldições.
* *Arenito*
↳ Leveza e resistência a elementos naturais (terra, vento)
* *Malaquita*
↳ Inteligência e efeitos de cura ou regeneração.
* *Jade*
↳ Proteção espiritual e efeitos de sorte.

    ┈໋┈̟╾ *Tier 3 - [570.000₩]*
* *Mithril*
↳ Agilidade extrema e leveza, com resistência moderada.
* *Adamantium*
↳ Defesa máxima e resistência a danos mágicos.
* *Oricalco*
↳ Poder mágico elevado e resistência a elementos.
* *Aço Rúnico*
↳ Combinação de ataque físico e poder mágico.
* *Vidro de Dragão*
↳ Ataque elemental (fogo, gelo, etc.).

    ┈໋┈̟╾ *Tier 4 - [1.000.000₩]*
* *Relicário*
↳ Efeitos sagrados e proteção divina.
* *Ébano*
↳ Resistência a magias negras e escuridão.
* *Mármore Negro*
↳ Defesa física e resistência a venenos.

    ┈໋┈̟╾ *Tier 5 - [5M ₩]*
* *Gelo Verdadeiro*
↳ Controle de gelo e resistência ao frio.
* *Hexita*
↳ Efeitos de maldição ou manipulação de energia negativa.
* *Cristais Elementais*
↳ Poder mágico elemental (fogo, água, terra, vento).
* *Cristais da Natureza*
↳ Poder mágico elemental (Planta, raio e gelo).
* *Cristais Espirituais*
↳ Poder mágico elemental (Luz e escuridão).
* *Tadenita*
↳ Poder mágico caótico e imprevisível.

* *Eternium* [SS] [10M ₩]
↳ Durabilidade infinita e resistência a todos os danos.
* *Petricita* [SS] [??]
↳ Neutralização de magia e resistência mágica.
┈┈┈┈┈┈┈┈┈┈
     _*Madeira*_

    ┈໋┈̟╾ *Tier 2 - [80.000₩]*
* *Teixo*
↳ Madeira resistente e flexível, com propriedades mágicas relacionadas a cura e proteção. Muito utilizada para encantamentos de defesa e restauração.
* *Grande Macieira*
↳ Madeira de tonalidade dourada, conhecida por sua suavidade e força. Ideal para a criação de varinhas e bastões encantados.
* *Madeira de Lei*
↳ Madeira rara e com propriedades mágicas poderosas. Muito utilizada para itens de resistência superior e encantamentos de longo alcance.

    ┈໋┈̟╾ *Tier 3 - [570.000₩]*
* *Árvore Mallorn*
↳ Madeira de origem lendária, usada por antigos mestres artesãos para criar armas que resistem ao tempo e ao desgaste. Tem uma conexão profunda com as energias espirituais.
* *Madeira de Bosmeri*
↳ Uma madeira natural, resistente e com a habilidade de fortalecer encantamentos que envolvem a natureza e o espírito animal. Frequentemente utilizada para criação de arcos e flechas mágicas.

    ┈໋┈̟╾ *Tier 5 - [5M ₩]*
* *Cerne*
↳ Madeira rara e quase indestrutível, com veios dourados. Usada para criar armas e armaduras imunes ao desgaste. Sua flexibilidade e resistência a tornam ideal para fortificações e navios.
* *Yggdrasil*
↳ Madeira celestial, verde esmeralda com toques dourados. Regenera e cura ao toque. Usada em rituais e construção de templos sagrados. Armas feitas dela podem manipular energia vital.
* *Árvore do Tesouro Adão*
↳ Madeira densa e extremamente resistente, de cor escura com veios prateados. Usada em espadas e navios de guerra, sendo famosa por sua durabilidade e resistência.
┈┈┈┈┈┈┈┈┈┈

* *Garrafas de Água* [10x]
↳ 50.000
* *Garrafas de Água Salgada* [8x]
↳ 50.000
* *Garrafas de Água do Pântano* [7x]
↳ 50.000
* *Garrafas de Sangue* [5x]
↳ 50.000
* *Garrafas de Mercúrio* [10x]
↳ 50.000

> *_Ingredientes_*

- *Açúcar* [15.000]
↳ Grãos refinados que aceleram o metabolismo, aumentando a eficácia temporária do corpo. Usado para fazer poções de agilidade e vigor.
- *Ervas e Suplementos Naturais* (gengibre, guaraná, etc.) (x5 usos) [25.000]
↳ Mistura de ervas com propriedades estimulantes. Ingrediente base para poções de resistência e recuperação de energia.
- *Fatia de Melancia Reluzente* [30.000]
↳ Uma fatia brilhante de melancia embebida em magia. Favorece a regeneração e a vitalidade, sendo essencial para poções de cura leve.
- *Baiacu* [35.000]
↳ Peixe inflado de toxinas naturais e resistência à pressão. Usado para poções de respiração aquática e resistência a venenos.
- *Olho de Aranha* [20.000]
↳ Pequeno e viscoso, contém toxinas naturais. Usado para poções de veneno ou fraqueza.
- *Pé de Coelho* [28.000]
↳ Amuleto raro, associado à sorte e mobilidade. Utilizado para poções de pulo ou velocidade.
- *Pelagem de Yeti* [40.000]
↳ Extremamente espessa e resistente ao frio. Essencial para poções de resistência ao gelo e proteção contra baixas temperaturas.
- *Creme de Magma* [50.000]
↳ Substância viscosa e quente, que mantém sua energia mesmo longe do fogo. Essencial para poções de resistência ao calor e chamas.
- *Cenoura Dourada* [45.000]
↳ Um vegetal banhado em ouro arcano, conhecido por aprimorar os sentidos. Usado em poções de visão aguçada e percepção melhorada.
- *Pó Infernal* [55.000]
↳ Resquícios cristalizados de energia infernal. Ingrediente poderoso para poções de força e resistência ao fogo.
- *Lágrima de Demônio* [65.000]
↳ Essência etérea coletada de seres infernais. Ingrediente altamente raro, essencial para poções de regeneração acelerada.
- *Raiz de Mandrágora* [50.000]
↳ Planta com propriedades mágicas únicas, conhecida por emitir um grito estridente. Essencial para poções de cura intensa e resistência mental.
- *Sangue de Basilisco* [70.000]
↳ Fluido denso e venenoso, capaz de endurecer a carne. Ingrediente crucial para poções de petrificação parcial e resistência física.
- *Casco de Tartaruga Ancestral* [70.000]
↳ Fragmento de casco de uma tartaruga de eras antigas, infundido com magia protetora. Usado para poções de resistência física aprimorada, mas reduz a velocidade do usuário.
- *Membrana de Fantasma* [68.000]
↳ Tecido espectral coletado de criaturas entre os mundos. Aplicado em poções de levitação e voo temporário.
- *Escama de Serpente Mística* [65.000]
↳ Retirada de uma cobra mágica, concede maleabilidade ao corpo. Essencial para poções de esquiva e flexibilidade aumentada.
- *Essência de Vampiro* [70.000]
↳ Extraída de criaturas noturnas, potencializa a regeneração e sentidos aguçados. Base para poções de vitalidade e visão noturna.
- *Orbe de Luz Pura* [60.000]
↳ Energia condensada em forma de esfera brilhante. Essencial para poções de purificação e resistência contra maldições.
┈┈┈┈┈┈┈┈┈┈
     _*Encantamento*_

* *Lápis Lazuli* [200.000]
↳ Uma gema azulada impregnada de energia mágica pura. Essencial para infusões e encantamentos, amplificando os efeitos de itens e poções com propriedades místicas. Quanto maior sua pureza, maior a força do encantamento resultante.
    `;

    await MessageService.send({ message: msg, text: mensagem });
};