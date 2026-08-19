const classes = {

"Lutador": {

nome: "Lutador",

descricao: `
Como pode imaginar, o Lutador e a classe diretamente ligada ao combate fisico e ao confronto direto.
Sua principal caracteristica e dominar batalhas de curta distancia utilizando forca, tecnicas corporais e armas voltadas para o combate proximo.
Diferente de um Tanker, o Lutador nao possui como objetivo principal proteger aliados, mas sim pressionar o inimigo atraves de ataques constantes e grande poder ofensivo.
Um verdadeiro Lutador consegue transformar sua forca fisica em sua maior arma, sendo capaz de enfrentar inimigos poderosos sem depender de magia.
E uma classe recomendada para jogadores que desejam estar na linha de frente causando dano e participando ativamente dos combates.

`,
bonus:
"+50% no atributo Forca",
foco:
"Forca e Resistencia"

},

"Assassino": {
nome:"Assassino",

descricao:`
O Assassino e uma classe especializada em velocidade, precisao e eliminacao rapida.
O Assassino utiliza movimentacao veloz e ataques precisos para encontrar brechas na defesa dos adversarios.
Sua maior vantagem esta na capacidade de identificar pontos vulneraveis e aplicar golpes criticos.
Porem, essa classe nao possui a mesma resistencia de combatentes focados em defesa, tornando necessario utilizar estrategia e inteligencia durante os combates.
Um Assassino experiente nao vence pela forca bruta, mas pela capacidade de atacar no momento perfeito.

`,

bonus:
"+50% no atributo Velocidade",
tecnica:
"Nirvana",
foco:
"Velocidade e Forca"

},

"Tanker": {
nome:"Tanker",
descricao:`
O Tanker e a muralha de uma equipe.
Sua funcao principal e receber ataques, proteger seus aliados e permanecer em combate mesmo diante dos inimigos mais perigosos.
Essa classe possui grande resistencia e capacidade de sobrevivencia, utilizando sua defesa como sua principal arma.
Apesar de conseguir causar dano, seu verdadeiro potencial esta em suportar golpes que derrotariam outros jogadores.
Um Tanker experiente e aquele que consegue permanecer de pe quando todos os outros ja caıram.

`,
bonus:
"+50% no atributo Resistencia",
foco:
"Resistencia e Forca"

},

"Ranger": {
nome:"Ranger",
descricao:`
O Ranger e uma classe especializada em combate a distancia.
Seu principal estilo de luta envolve arcos, armas de longo alcance e tecnicas que permitem controlar a distancia entre ele e seus inimigos.
Diferente dos Magos, o Ranger continua sendo uma classe de combate marcial, podendo seguir caminhos diferentes conforme sua construcao.
Ao escolher essa classe, o jogador deve decidir qual sera sua especializacao:
Ranger Fisico:
Utiliza sua forca para aumentar o poder dos ataques a distancia.
Ranger Magico:
Utiliza seu poder magico para criar ataques de longa distancia utilizando mana.

`,
bonus:[
"Ranger Fisico: +50% Forca",
"Ranger Magico: +50% Poder Magico"
],
foco:
"Forca ou Poder Magico"

},

"Curador": {
nome:"Curador",
descricao:`
O Curador e uma classe focada em suporte, recuperacao e fortalecimento.
Sua funcao e manter seus aliados vivos durante batalhas dificeis atraves de tecnicas de cura, aprimoramentos e habilidades de suporte.
Grandes Curadores possuem capacidade suficiente para recuperar ferimentos graves e mudar completamente o resultado de uma batalha.
Apesar de nao possuir o maior poder ofensivo, sua presenca em uma equipe pode ser decisiva.

`,
bonus:
"+50% no atributo Inteligencia",
foco:
"Inteligencia e Poder Magico"

},
"Mago Elemental": {
nome:"Mago Elemental",
descricao:`
Magos que focam os elementos da natureza possuem uma grande variedade entre si.
Ao escolher Mago Elemental, o jogador recebe seu primeiro elemento, que sera sua afinidade base e o elemento de sua maestria.
A potencia de cada dominio funciona assim:
- Primeiro elemento: 100% do Poder Magico
- Segundo elemento: 75% do Poder Magico
- Terceiro elemento: 50% do Poder Magico
As afinidades adicionais seguem uma progressao separada: no nivel 35, o jogador pode sortear sua segunda afinidade; no nivel 70, pode sortear sua terceira afinidade.
Ao criar a ficha, a classe permanece registrada como Mago Elemental e a afinidade escolhida/sorteada sera registrada como seu elemento base.

`,
bonus:
"+50% no atributo Poder Magico",
foco:
"Poder Magico e Inteligencia"

},
"Mago de Maldicao": {
nome:"Mago de Maldicao",
descricao:`
Assim como existem aqueles que fortalecem seus aliados, existem os que causam enfraquecimentos.
Esses sao os Magos de Maldicao: cacadores focados em magias de controle de campo, reducao de capacidades e efeitos negativos.
Seu objetivo e enfraquecer o inimigo e limitar suas acoes para que seus aliados possam agir com vantagem.
`,
bonus:
"+50% no atributo Poder Magico",
foco:
"Poder Magico e Inteligencia"

},
"Mago de Barreira": {
nome:"Mago de Barreira",
descricao:`
O Mago de Barreira e especialista na criacao de estruturas magicas defensivas.
Suas habilidades permitem criar escudos, protecoes e areas de seguranca capazes de impedir ou reduzir ataques inimigos.
Essa classe e extremamente valorizada em grupos, pois consegue proteger aliados e controlar espacos durante batalhas.
Sua evolucao permite criar barreiras cada vez mais resistentes e complexas.

`,
bonus:
"+50% no atributo Poder Magico",
foco:
"Poder Magico e Inteligencia"

},
"Mago Invocador": {
nome:"Mago Invocador",
descricao:`
O Mago Invocador e uma classe que utiliza sua mana para trazer criaturas, entidades e construcoes magicas para o campo de batalha.
Diferente dos outros magos, seu poder nao depende apenas da propria forca, mas tambem das invocacoes que consegue controlar.
Com o tempo, pode comandar criaturas cada vez mais poderosas, tornando-se um verdadeiro comandante durante os combates.

`,
bonus:
"+50% no atributo Poder Magico",
foco:
"Poder Magico e Inteligencia"

}


};


module.exports = classes;
