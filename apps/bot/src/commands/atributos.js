const MessageService=require("../core/messageService");
module.exports=async msg=>MessageService.send({message:msg,text:`_*「 SISTEMA DE ATRIBUTOS 」*_
_— Atributos representam capacidades mensuráveis do personagem. O valor base pertence à ficha; o valor total inclui bônus válidos._

_*ATRIBUTOS FÍSICOS:*_
_• Força — potência corporal, impacto, empurrões e capacidade de carga._
_• Resistência — durabilidade, defesa física e base da Vida máxima._
_• Velocidade — deslocamento, reflexos, iniciativa e execução de movimentos._
_• Sentidos — percepção, precisão, rastreamento e leitura de ameaças._

_*ATRIBUTOS MÁGICOS:*_
_• Inteligência — controle e eficiência da energia; participa do cálculo de Mana máxima._
_• Poder Mágico — potência de feitiços, técnicas mágicas, barreiras e curas quando a técnica assim determinar._

_*COMO O TOTAL É FORMADO:*_
_Atributo total = base + bônus da classe inicial + buffs registrados + equipamentos equipados._

_• A cada nível: +1 automático em cada atributo e +3 pontos livres._
_• Pontos livres são aplicados com !Distribuir._
_• A classe inicial concede +50% sobre seu atributo principal._
_• Equipamentos só concedem bônus quando estão equipados._
_• Passivas são sempre ativas, mas só alteram números quando o efeito estiver integrado ao cálculo._

_*HP E MP:*_
_• Vida máxima usa Resistência total e nível._
_• Mana máxima usa Inteligência total e nível._
_• Quest Diária, level-up e o ciclo natural de 48 horas recuperam HP/MP totalmente._

_*CONSULTAS:*_
_• !Jogador — ficha e valores atuais._
_• !Distribuir — saldo e distribuição de pontos._
_• !Faixa de Atributos — classificação dos valores finais._
_• !FCombate — comparação entre personagens._

_Atributo alto não inventa efeitos: cada técnica, item ou regra informa como o valor é utilizado._`});
