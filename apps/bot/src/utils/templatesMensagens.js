/**
 * TEMPLATES DE MENSAGENS - PADRÃO VISUAL UNIFICADO
 * 
 * Sistema de templates padronizados para o bot.
 * Todas as mensagens seguem este padrão visual.
 */

const ehMagoElemental = classe => String(classe || "")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().trim() === "mago elemental";

const elementoPrimario = dados => dados.elemento || dados.afinidade_elemental || dados.afinidade || "N/A";

const templates = {
    // =====================================
    // ESTRUTURAS BASE
    // =====================================
    
    // Título principal
    titulo: (texto) => `*═══ ${texto} ═══*`,
    
    // Subtítulo
    subtitulo: (texto) => `\n*─── ${texto} ───*`,
    
    // Seção
    secao: (texto) => `\n*${texto}*`,
    
    // Campo de informação
    campo: (label, valor) => `> *${label}:* ${valor}`,
    
    // Divisor
    divisor: () => `──────────────────────────`,
    
    // Linha simples
    linha: () => `══════════════════════════`,
    
    // =====================================
    // STATUS
    // =====================================
    
    // Erro
    erro: (texto) => `*✖ ${texto}*`,
    
    // Sucesso
    sucesso: (texto) => `*✔ ${texto}*`,
    
    // Aviso
    aviso: (texto) => `*⚠ ${texto}*`,
    
    // Informação
    info: (texto) => `*ℹ ${texto}*`,
    
    // Destaque
    destaque: (texto) => `*❖ ${texto} ❖*`,
    
    // =====================================
    // MENSAGENS PADRÃO
    // =====================================
    
    // Jogador não encontrado
    jogadorNaoEncontrado: () => `${templates.titulo("JOGADOR NAO ENCONTRADO")}
${templates.divisor()}

Voce ainda nao possui uma ficha criada.

${templates.campo("Use", "!ficha para criar seu personagem")}

${templates.divisor()}`,
    
    // Acesso negado
    acessoNegado: () => `${templates.titulo("ACESSO NEGADO")}
${templates.divisor()}

Voce nao possui permissao para usar este comando.

${templates.divisor()}`,
    
    // =====================================
    // FICHA MODELO
    // =====================================
    
    fichaModelo: () => `${templates.titulo("FICHA DE PERSONAGEM")}
${templates.linha()}

${templates.secao("IDENTIDADE")}
${templates.campo("Nome", "_")}
${templates.campo("Idade", "_")}
${templates.campo("Gênero", "_")}
${templates.campo("Nacionalidade", "_")}
${templates.campo("Altura", "_")}
${templates.campo("Peso", "_")}

${templates.secao("PERSONALIDADE")}
${templates.campo("Personalidade", "_")}

${templates.secao("APARENCIA")}
${templates.campo("Aparencia", "_")}

${templates.secao("COMBATE")}
${templates.campo("Classe desejada", "_")}
${templates.campo("Estilo de luta / Proficiencia", "_")}
> Esta proficiencia sera definitiva; nao existe comando para troca-la.
${templates.campo("Arma inicial", "_")}
${templates.campo("Afinidade Elemental", "_")}

${templates.secao("ATRIBUTOS INICIAIS")}
> Distribua 10 pontos entre os atributos abaixo:
${templates.campo("Forca", "_")}
${templates.campo("Velocidade", "_")}
${templates.campo("Sentidos", "_")}
${templates.campo("Resistencia", "_")}
${templates.campo("Inteligencia", "_")}
${templates.campo("Poder Magico", "_")}

${templates.secao("HISTORIA")}
> Conte a origem do seu personagem...

${templates.secao("HABILIDADE UNICA")}
> (Preenchida pelo ADM apos aprovacao)

${templates.divisor()}
_Apos preencher, envie a ficha normalmente._
_O sistema ira reconhecer automaticamente._
_Use *!confirmar ficha* para enviar para aprovacao._`,

    // =====================================
    // FICHA RECONHECIDA
    // =====================================
    
    fichaReconhecida: (dados) => {
        let msg = `${templates.titulo("FICHA RECONHECIDA")}`;
        msg += `\n${templates.divisor()}`;
        msg += `\n${templates.campo("Nome", dados.nome)}`;
        msg += `\n${templates.campo("Idade", dados.idade || "N/A")}`;
        msg += `\n${templates.campo("Gênero", dados.genero || dados.sexo || "N/A")}`;
        msg += `\n${templates.campo("Nacionalidade", dados.nacionalidade || "N/A")}`;
        msg += `\n${templates.campo("Altura", dados.altura || "N/A")}`;
        msg += `\n${templates.campo("Peso", dados.peso || "N/A")}`;
        msg += `\n${templates.campo("Personalidade", dados.personalidade || "N/A")}`;
        msg += `\n${templates.campo("Aparencia", dados.aparencia || "Em avaliacao")}`;
        msg += `\n${templates.divisor()}`;
        msg += `\n${templates.campo("Classe desejada", dados.classe)}`;
        if (ehMagoElemental(dados.classe)) msg += `\n${templates.campo("Elemento Primário", elementoPrimario(dados))}`;
        msg += `\n${templates.campo("Estilo de luta", dados.estilo_luta || "N/A")}`;
        msg += `\n${templates.campo("Arma inicial", dados.arma || "N/A")}`;
        msg += `\n${templates.campo("Elemento/Afinidade", dados.elemento || "N/A")}`;
        msg += `\n${templates.divisor()}`;
        msg += `\n${templates.secao("ATRIBUTOS INICIAIS")}`;
        msg += `\n> Forca: ${dados.forca || 0} | Resistencia: ${dados.resistencia || 0} | Velocidade: ${dados.velocidade || 0}`;
        msg += `\n> Agilidade: ${dados.sentidos || dados.agilidade || 0} | Inteligencia: ${dados.inteligencia || 0} | Poder Magico: ${dados.poder_magico || 0}`;
        msg += `\n${templates.divisor()}`;
        msg += `\n${templates.campo("Historia", "Em avaliacao")}`;
        msg += `\n${templates.divisor()}`;
        msg += `\n_Use *!confirmar ficha* para enviar para aprovacao._`;
        return msg;
    },

    // =====================================
    // FICHA ENVIADA PARA APROVAÇÃO
    // =====================================
    
    fichaEnviadaAprovacao: (dados) => {
        let msg = `${templates.titulo("NOVA FICHA PARA AVALIACAO")}`;
        msg += `\n${templates.divisor()}`;
        msg += `\n${templates.campo("Nome", dados.nome)}`;
        msg += `\n${templates.campo("Idade", dados.idade || "N/A")}`;
        msg += `\n${templates.campo("Gênero", dados.genero || dados.sexo || "N/A")}`;
        msg += `\n${templates.campo("Nacionalidade", dados.nacionalidade || "N/A")}`;
        msg += `\n${templates.campo("Altura", dados.altura || "N/A")}`;
        msg += `\n${templates.campo("Peso", dados.peso || "N/A")}`;
        msg += `\n${templates.campo("Personalidade", dados.personalidade || "N/A")}`;
        msg += `\n${templates.campo("Aparencia", dados.aparencia || "Em avaliacao")}`;
        msg += `\n${templates.divisor()}`;
        msg += `\n${templates.campo("Classe desejada", dados.classe)}`;
        if (ehMagoElemental(dados.classe)) msg += `\n${templates.campo("Elemento Primário", elementoPrimario(dados))}`;
        msg += `\n${templates.campo("Estilo de luta", dados.estilo_luta || "N/A")}`;
        msg += `\n${templates.campo("Arma inicial", dados.arma || "N/A")}`;
        msg += `\n${templates.campo("Elemento/Afinidade", dados.elemento || "N/A")}`;
        msg += `\n${templates.divisor()}`;
        msg += `\n${templates.secao("ATRIBUTOS INICIAIS")}`;
        msg += `\n> Forca: ${dados.forca || 0} | Resistencia: ${dados.resistencia || 0} | Velocidade: ${dados.velocidade || 0}`;
        msg += `\n> Agilidade: ${dados.sentidos || dados.agilidade || 0} | Inteligencia: ${dados.inteligencia || 0} | Poder Magico: ${dados.poder_magico || 0}`;
        msg += `\n${templates.divisor()}`;
        msg += `\n${templates.campo("Historia", dados.historia || "Em avaliacao")}`;
        msg += `\n${templates.divisor()}`;
        msg += `\n> *Acoes:*`;
        msg += `\n> Use *!aprovar ficha ${dados.nome} [habilidade_unica]* para aprovar`;
        msg += `\n> Use *!recusar ficha ${dados.nome} [motivo]* para recusar`;
        return msg;
    },

    // =====================================
    // FICHA CONFIRMADA
    // =====================================
    
    fichaConfirmada: (dados) => {
        let msg = `${templates.titulo("FICHA ENVIADA PARA AVALIACAO")}`;
        msg += `\n${templates.divisor()}`;
        msg += `\n${templates.campo("Nome", dados.nome)}`;
        msg += `\n${templates.campo("Idade", dados.idade || "N/A")}`;
        msg += `\n${templates.campo("Gênero", dados.genero || dados.sexo || "N/A")}`;
        msg += `\n${templates.campo("Nacionalidade", dados.nacionalidade || "N/A")}`;
        msg += `\n${templates.campo("Altura", dados.altura || "N/A")}`;
        msg += `\n${templates.campo("Peso", dados.peso || "N/A")}`;
        msg += `\n${templates.campo("Personalidade", dados.personalidade || "N/A")}`;
        msg += `\n${templates.campo("Aparencia", dados.aparencia || "Em avaliacao")}`;
        msg += `\n${templates.divisor()}`;
        msg += `\n${templates.campo("Classe desejada", dados.classe)}`;
        if (ehMagoElemental(dados.classe)) msg += `\n${templates.campo("Elemento Primário", elementoPrimario(dados))}`;
        msg += `\n${templates.campo("Estilo de luta", dados.estilo_luta || "N/A")}`;
        msg += `\n${templates.campo("Arma inicial", dados.arma || "N/A")}`;
        msg += `\n${templates.campo("Elemento/Afinidade", dados.elemento || "N/A")}`;
        msg += `\n${templates.divisor()}`;
        msg += `\n${templates.secao("ATRIBUTOS INICIAIS")}`;
        msg += `\n> Forca: ${dados.forca || 0} | Resistencia: ${dados.resistencia || 0} | Velocidade: ${dados.velocidade || 0}`;
        msg += `\n> Agilidade: ${dados.sentidos || dados.agilidade || 0} | Inteligencia: ${dados.inteligencia || 0} | Poder Magico: ${dados.poder_magico || 0}`;
        msg += `\n${templates.divisor()}`;
        msg += `\n${templates.secao("HISTORIA DO PERSONAGEM")}`;
        msg += `\n${templates.info("Sua historia foi enviada para analise da administracao.")}`;
        msg += `\n_Status: Aguardando aprovacao de um ADM._`;
        msg += `\n${templates.divisor()}`;
        msg += `\n${templates.aviso("Aguarde a analise de um Administrador.")}`;
        msg += `\n_Voce sera notificado quando sua ficha for avaliada._`;
        return msg;
    },

    // =====================================
    // FICHA APROVADA
    // =====================================
    
    fichaAprovada: (dados, habilidadeUnica, hpMaximo, manaMaxima) => {
        let msg = `${templates.titulo("FICHA APROVADA")}`;
        msg += `\n${templates.divisor()}`;
        msg += `\n${templates.sucesso(`Parabens, ${dados.nome}!`)}`;
        msg += `\n_Sua ficha foi aprovada e voce ja pode jogar!_`;
        msg += `\n${templates.divisor()}`;
        msg += `\n${templates.destaque("HABILIDADE UNICA CRIADA")}`;
        msg += `\n> ${habilidadeUnica}`;
        msg += `\n${templates.divisor()}`;
        msg += `\n${templates.destaque("STATUS INICIAL")}`;
        msg += `\n> Rank: E | Nivel: 1`;
        msg += `\n> HP: ${hpMaximo} | Mana: ${manaMaxima}`;
        msg += `\n${templates.divisor()}`;
        msg += `\n_Use *!jogador* para ver sua ficha completa._`;
        msg += `\n_Boa jornada, Cacador!_`;
        return msg;
    },

    recadoPosAprovacao: (nomeJogador) => {
        let msg = `${templates.titulo("O SISTEMA RECONHECEU VOCE")}`;
        msg += `\n${templates.divisor()}`;
        msg += `\n> ANALISE DA HISTORIA: CONCLUIDA`;
        msg += `\n> REGISTRO DO JOGADOR: APROVADO`;
        msg += `\n> DESPERTAR: CONFIRMADO`;
        msg += `\n${templates.divisor()}`;
        msg += `\n\n*${nomeJogador}... sua existencia foi aceita pelo Sistema.*`;
        msg += `\n\nEu li sua historia. Observei suas escolhas, suas cicatrizes e o potencial oculto por tras delas.`;
        msg += `\n\nComo prova de que o Sistema reconheceu o seu caminho, uma *Habilidade Unica* condizente com sua historia foi concedida a voce.`;
        msg += `\n\nNao a desperdice. O poder que agora carrega podera ergue-lo acima dos demais... ou revelar que voce nunca foi digno dele.`;
        msg += `\n\nA partir deste momento, voce nao e mais um simples observador.`;
        msg += `\n*Voce e um Jogador.*`;
        msg += `\n\nSeu progresso pode comecar. Atravesse o portal abaixo, entre na comunidade e envie *!jogador* para contemplar sua ficha e a Habilidade Unica que lhe foi concedida:`;
        msg += `\nhttps://chat.whatsapp.com/IhaQVGW0beK3X4jrrfaWxo`;
        msg += `\n\n${templates.divisor()}`;
        msg += `\n> O SISTEMA ESTARA OBSERVANDO.`;
        return msg;
    },

    // =====================================
    // FICHA RECUSADA
    // =====================================
    
    fichaRecusada: (dados, motivo) => {
        let msg = `${templates.titulo("FICHA RECUSADA")}`;
        msg += `\n${templates.divisor()}`;
        msg += `\n${templates.campo("Jogador", dados.nome)}`;
        msg += `\n${templates.campo("Motivo", motivo)}`;
        msg += `\n${templates.divisor()}`;
        msg += `\n_Corrija os problemas e envie novamente._`;
        return msg;
    },

    // =====================================
    // BOAS-VINDAS
    // =====================================
    
    boasVindas: () => `${templates.titulo("UMA NOVA PRESENÇA FOI DETECTADA")}
${templates.linha()}

_*「 ARQUITETO 」*_
_— Então você atravessou os portões deste mundo, Jogador. A partir deste instante, cada escolha será registrada. Seu poder, sua classe e o caminho que seguirá ainda não foram definidos... mas o Sistema já reconheceu sua presença._

${templates.divisor()}

*SEU PRIMEIRO COMANDO*
> Digite *!Iniciar*

_O Sistema apresentará as instruções necessárias para criar seu personagem, preencher sua ficha e dar o primeiro passo em direção à sua ascensão._

${templates.divisor()}

_Levante-se, Jogador. Sua jornada começa quando o comando for executado._`,

    // =====================================
    // AVALIAÇÃO
    // =====================================
    
    avaliacao: (status, notas) => {
        let msg = `${templates.titulo("AVALIACAO DE FICHA")}`;
        msg += `\n${templates.divisor()}`;
        
        if (status === "APROVADO") {
            msg += `\n${templates.sucesso(status)}`;
        } else if (status === "REPROVADO") {
            msg += `\n${templates.erro(status)}`;
        } else {
            msg += `\n${templates.aviso(status)}`;
        }
        
        if (notas && notas.length > 0) {
            msg += `\n${templates.divisor()}`;
            msg += `\n${templates.secao("NOTAS")}`;
            notas.forEach(nota => {
                msg += `\n> ${nota}`;
            });
        }
        
        msg += `\n${templates.divisor()}`;
        return msg;
    },

    // =====================================
    // RECOMPENSA
    // =====================================
    
    recompensa: (jogadorNome, tipoAtividade, recompensaQi, recompensaXp, recompensaWon, mensagemExtra = '') => {
        let msg = `${templates.titulo("RECOMPENSA RECEBIDA")}`;
        msg += `\n${templates.divisor()}`;
        msg += `\nOla, *${jogadorNome}*!`;
        msg += `\nSua atividade foi aprovada!`;
        msg += `\n${templates.divisor()}`;
        msg += `\n*Atividade:* ${tipoAtividade}`;
        msg += `\n${templates.divisor()}`;
        msg += `\n*Voce recebeu:*`;
        if (recompensaQi > 0) msg += `\n> Maestria: +${recompensaQi}`;
        if (recompensaXp > 0) msg += `\n> XP: +${recompensaXp}`;
        if (recompensaWon > 0) msg += `\n> Won: +${recompensaWon}`;
        if (mensagemExtra) msg += `\n${mensagemExtra}`;
        msg += `\n${templates.divisor()}`;
        msg += `\n_Parabens e continue assim, Cacador!_`;
        return msg;
    }
};

module.exports = templates;
