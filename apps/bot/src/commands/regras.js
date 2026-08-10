const MessageService = require("../core/messageService");

module.exports = async (msg) => {

await MessageService.send({ message: msg, text: `
*═══ Regras do Sistema ═══*
────────────────────────══
*═══ Sobre as Cenas ═══*
> _Cinco (5) linhas por cena_
> _Tolerância de até quatro (4) linhas._
> _Falas não contam._
> _Vinte (20) linhas mínimas para realizar sua Quest Diária_

────────────────────────══
*═══ Inventar coisa do c ═══*
> _Se não está em nenhum dos sistemas, não inventa, certo amigão? "Ah mas tal pessoa falou" foda-se? Se não estiver no sistemas não pode._
> _Caso tenha algo errado nos sistemas, avise aos adms que iremos corrigir. Coisas podem mudar nos sistemas a qualquer momento._

────────────────────────══
*═══ Conteúdo sexual explícito ═══*
> _Hot deve ser no privado._
> _Hentai ou porno não vão ser aceitos, nem no ON nem no OFF._
> _Imagens de apelo sexual vão ter certa tolerância, mas nada que exagere ou mostre muitas coisas._

────────────────────────══
*═══ Troca de Classe ═══*
> _A troca de classe é permitida apenas uma (1) vez em um determinado personagem durante o decorrer do RPG, sendo necessário um texto de 300 palavras explicando a história do seu personagem desde o despertar dele. Uma vez que tenha mudado sua classe, você perderá TUDO relacionado a sua anterior._

────────────────────────══
*═══ Trocar de Aparência ═══*
> _A troca de Aparência é permitida. Por apenas 2 vezes, mas para isso é necessário avisar aos adms que quer trocar sua Aparência, portanto pense bem antes._

────────────────────────══
*═══ Se comprometeu com algo? Cumpra! ═══*
> _Isso é válido principalmente para eventos, estando válido a certa punição caso suma repentinamente e não tenha uma boa justificativa, atrasando o evento._

────────────────────────══
*═══ Copypast/flood ═══*
> _Repetir a mesma coisa consecutivamente sem sentido algum._

────────────────────────══
*═══ Spam/divulgação ═══*
> _Divulgar algo, um RPG, uma página, entre outros. É possível apenas no privado, caso o player em questão permita._

────────────────────────══
*═══ Floodar comando ═══*
> _Preciso nem explicar, né?_

────────────────────────══
*═══ Trapaças ═══*
> _Enganar, mentir, ou fazer qualquer coisa que tire o valor de alguém dentro do RPG apenas para seu favorecimento próprio. Ou até mesmo ficar zoando e mentindo sobre um sistema ou algo assim, obviamente vai acarretar no seu Ban._

────────────────────────══
*═══ Sejamos civilizados ═══*
> _Poderíamos ficar muito tempo aqui só para falar as regras, mas vou encurtar bastante: Seja civilizado. Seja paciente, não tente bancar o fodão, não denigra os demais, respeite os administradores e os membros. Caso haja alguma dúvida sobre qualquer sistema, vá diretamente ao administrador disponível, não manche a imagem do RPG apenas porque não achou o que procura ou simplesmente não entendeu._

────────────────────────══
*═══ Aparências do anime ═══*
> _Pela reutilização de personagens que iremos fazer, as aparências não podem ser próprias do anime._

────────────────────────══
*◉ Ação Oculta*
> _Famosa pelos player's, a Ação Oculta não é válida aqui, é necessário especificar o que se está fazendo e como, e, claro, é extremamente proibido meta-gaming, seu personagem não é você para ter os mesmos conhecimentos._
` });

};