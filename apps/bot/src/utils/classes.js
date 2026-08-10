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
Diferente dos Lutadores, que enfrentam seus inimigos diretamente, o Assassino utiliza movimentacao, sentidos elevados e ataques precisos para encontrar brechas na defesa dos adversarios.
Sua maior vantagem esta na capacidade de identificar pontos vulneraveis e aplicar golpes criticos.
Porem, essa classe nao possui a mesma resistencia de combatentes focados em defesa, tornando necessario utilizar estrategia e inteligencia durante os combates.
Um Assassino experiente nao vence pela forca bruta, mas pela capacidade de atacar no momento perfeito.

`,

bonus:
"+50% no atributo Sentidos",
tecnica:
"Nirvana",
foco:
"Sentidos e Forca"

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
O Mago Elemental e uma classe especializada no controle dos elementos da natureza.
Seus usuarios utilizam mana para manipular forcas como fogo, agua, terra, vento, raio e planta.
Ao iniciar sua jornada, o jogador deve escolher seu primeiro elemento, sendo esse seu maior dominio.
Com sua evolucao podera aprender novos elementos, porem sua eficiencia sera menor comparada ao elemento principal.
Elementos disponiveis:
Fogo
Agua
Planta
Terra
Vento
Raio

`,
bonus:
"+50% no atributo Poder Magico",
foco:
"Poder Magico e Inteligencia"

},
"Mago de Maldicao": {
nome:"Mago de Maldicao",
descricao:`
O Mago de Maldicao e especializado em enfraquecer seus inimigos atraves de magia.
Enquanto outros magos procuram causar dano direto, essa classe utiliza tecnicas capazes de reduzir capacidades, limitar movimentos e controlar o campo de batalha.
Sao especialistas em estrategias, preparando o terreno para que seus aliados consigam derrotar inimigos mais fortes.
Um usuario dessa classe nao precisa ser o mais poderoso, pois sua forca esta em controlar a batalha.
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