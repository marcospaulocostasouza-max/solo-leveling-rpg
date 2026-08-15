const MessageService=require("../core/messageService");
module.exports=async msg=>MessageService.send({message:msg,text:`_*「 NPCs 」*_
_— NPCs são personagens narrativos do Sistema. Cada um possui identidade, personalidade, objetivos, memória e uma relação separada com cada jogador._

_*COMO CENAR:*_
_Escreva o comando do NPC na primeira linha e toda a cena abaixo dele._

*Exemplo:*
!ophilia
*Aproximo-me com cautela.*
— Ophilia, preciso falar com você.

_Para continuar, repita o comando e escreva a continuação abaixo. Só é permitida uma cena ativa por jogador. Cenas abandonadas por mais de 24 horas são encerradas automaticamente._

_*COMANDOS:*_
_• !Listar Npcs — mostra NPCs, locais e comandos._
_• !Amizade — mostra seus relacionamentos._
_• !Amizade <NPC> — consulta vínculo e hostilidade._
_• !Missões NPC <id> — consulta missões daquele NPC._
_• !Aceitar Missão <nome> — aceita uma missão liberada em conversa ou por outra fonte._
_• !Presentear <id_do_npc> <item> — oferece um item do inventário._
_• !Fim de Interação — encerra a cena ativa._
_• !Fim de Interação <NPC> — encerra informando o NPC._

_*PROFISSIONAIS:*_
_• Ferreiro Bilac — !Olá Bilac — forjas Rank E a B._

_Ao encerrar, o Sistema atualiza relacionamento e memória quando aplicável. Dados de outros jogadores nunca pertencem à sua cena._`});
