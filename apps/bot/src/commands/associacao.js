const MessageService = require("../core/messageService");

/**
 * SISTEMA DA ASSOCIAÇÃO DE CAÇADORES
 * 
 * Comandos:
 *   !membroa - Informações sobre a Associação
 *   !cargosa - Lista de cargos e salários
 *   !aprovado associação <Nome> - ADM aprova ingresso
 *   !sair associação - Jogador solicita saída
 * 
 * Regras:
 * - Ingresso não é automático
 * - Jogador precisa fazer cena no grupo ON
 * - ADM aprova com !aprovado associação <Nome>
 * - Sair da Associação tem consequências narrativas
 */

const db = require("../core/database");
const JogadorCore = require("../core/jogadorCore");
const adminCore = require("../core/adminCore");

// =====================================
// TABELA DE CARGOS E SALÁRIOS
// =====================================
const CARGOS_ASSOCIACAO = {
    "Recruta Interno": { salario: 20000, pontos: 0, requisito_nivel: 1, itens: "E-D" },
    "Recruta Campo": { salario: 25000, pontos: 20, requisito_nivel: 10, itens: "E-D" },
    "Soldado Interno": { salario: 30000, pontos: 20, requisito_nivel: 20, itens: "E-C" },
    "Soldado Campo": { salario: 40000, pontos: 20, requisito_nivel: 30, itens: "E-C" },
    "Supervisor Interno": { salario: 60000, pontos: 20, requisito_nivel: 40, itens: "E-D-C-1B" },
    "Supervisor Campo": { salario: 65000, pontos: 20, requisito_nivel: 50, itens: "E-D-C-B" },
    "Especial Interno": { salario: 100000, pontos: 20, requisito_nivel: 60, itens: "E-D-C-B" },
    "Especial Campo": { salario: 150000, pontos: 20, requisito_nivel: 70, itens: "E-D-C-B-1A" },
    "Alto Supervisor I": { salario: 200000, pontos: 20, requisito_nivel: 80, itens: "Todos" },
    "Alto Supervisor II": { salario: 200000, pontos: 20, requisito_nivel: 90, itens: "Todos" }
};

// Cargos em ordem crescente
const CARGOS_ORDEM = Object.keys(CARGOS_ASSOCIACAO);

module.exports = async (msg) => {
    const texto = msg.body.toLowerCase().trim();
    const numero = msg.author || msg.from;
    
    // =====================================
    // !membroa - Informações sobre a Associação
    // =====================================
    if (texto === "!membroa") {
        const jogador = await JogadorCore.buscarPorNumero(numero);
        let membroInfo = "";
        
        if (jogador) {
            const membro = await new Promise((resolve) => {
                db.get("SELECT * FROM associacao_membros WHERE jogador_id = ? AND ativo = 1", [jogador.id], (err, row) => {
                    resolve(row);
                });
            });
            
            if (membro) {
                membroInfo = `
══════════════════════════
*VOCÊ É MEMBRO DA ASSOCIAÇÃO!*
> Cargo: ${membro.cargo || "Recruta"}
> Salário Semanal: ${(membro.salario_semanal || 20000).toLocaleString()} Won
> Membro desde: ${membro.data_entrada || "N/A"}
            `;
            }
        }
        
        await MessageService.send({ message: msg, text: `
*═══ ASSOCIAÇÃO DE CAÇADORES ═══*

A Associação de Caçadores é uma organização governamental que gerencia e coordena as atividades dos caçadores. É uma alternativa para quem não quer entrar em guilda, oferecendo suporte, salário, recursos e proteção legal para Caçadores independentes.

══════════════════════════

*REQUISITOS*
1. Rank D mínimo
2. Sem antecedentes criminais
3. Sem vínculo com guildas
4. Passar em avaliação da Associação

*COMO ENTRAR*
1. Faça uma cena no grupo ON demonstrando seu valor
2. Um ADM avaliará e usará: *!aprovado associação <Nome>*
3. Após a aprovação, você será registrado automaticamente

*BENEFÍCIOS*
- Salário semanal em Wons (baseado no cargo)
- Acesso a missões exclusivas
- Itens da Associação
- Suporte em missões oficiais${membroInfo}

*PARA SAIR*
Use *!sair associação* (necessita confirmação)
_Atenção: Sair da Associação possui consequências narrativas!_

══════════════════════════
_Digite !cargosa para ver a lista de cargos e salários._
        ` });
        return;
    }
    
    // =====================================
    // !cargosa - Lista de cargos e salários
    // =====================================
    if (texto === "!cargosa") {
        let mensagem = `
*═══ CARGOS DA ASSOCIAÇÃO ═══*

Os cargos são definidos conforme o nível e desempenho do caçador.
Salários são pagos automaticamente toda semana.

══════════════════════════
        `;
        
        CARGOS_ORDEM.forEach((cargo, index) => {
            const info = CARGOS_ASSOCIACAO[cargo];
            mensagem += `
${index + 1}. *${cargo}*
   > Salário: ${info.salario.toLocaleString()} Won/sem
   > Nível mínimo: ${info.requisito_nivel}
   > Acesso a itens: ${info.itens}
   > Bônus de atributo: +${info.pontos} pts
            `;
        });
        
        mensagem += `
══════════════════════════
*OBS:* Pontos adquiridos completando missões em nome da Associação.
_Para entrar, faça uma cena no ON e aguarde aprovação de um ADM._
        `;
        
        await MessageService.send({ message: msg, text: mensagem });
        return;
    }
    
    // =====================================
    // !aprovado associação <Nome> - ADM aprova ingresso
    // =====================================
    if (texto.startsWith("!aprovado associacao") || texto.startsWith("!aprovado associação")) {
        // Verificar se é admin
        const admin = await adminCore.isAdmin(numero);
        if (!admin) {
            return MessageService.send({ message: msg, text: `*═══ ACESSO NEGADO ═══*
Você não tem permissão para usar este comando.` });
        }
        
        const nomeJogador = texto
            .replace(/^!aprovado associacao|^!aprovado associação/, "")
            .trim();
        
        if (!nomeJogador) {
            return MessageService.send({ message: msg, text: `*═══ USO INCORRETO ═══*
Use: *!aprovado associação <Nome do Jogador>*
Exemplo: *!aprovado associação Sung Jin Woo*` });
        }
        
        // Buscar jogador
        const jogador = await JogadorCore.buscarPorNomeLike(nomeJogador);
        if (!jogador) {
            return MessageService.send({ message: msg, text: `*✖ Jogador "${nomeJogador}" não encontrado.*` });
        }
        
        // Verificar se já é membro
        const membroExistente = await new Promise((resolve) => {
            db.get("SELECT * FROM associacao_membros WHERE jogador_id = ?", [jogador.id], (err, row) => {
                resolve(row);
            });
        });
        
        if (membroExistente && membroExistente.ativo) {
            return MessageService.send({ message: msg, text: `*✖ ${jogador.nome} já é membro da Associação!*` });
        }
        
        // Determinar cargo inicial baseado no nível
        let cargoInicial = "Recruta Interno";
        for (let i = CARGOS_ORDEM.length - 1; i >= 0; i--) {
            const cargo = CARGOS_ORDEM[i];
            const info = CARGOS_ASSOCIACAO[cargo];
            if (jogador.nivel >= info.requisito_nivel) {
                cargoInicial = cargo;
                break;
            }
        }
        
        const salario = CARGOS_ASSOCIACAO[cargoInicial].salario;
        const dataAtual = new Date().toISOString();
        
        // Registrar na associação
        if (membroExistente) {
            // Reativar membro
            await new Promise((resolve) => {
                db.run(
                    `UPDATE associacao_membros SET ativo = 1, cargo = ?, salario_semanal = ?, data_entrada = ? WHERE jogador_id = ?`,
                    [cargoInicial, salario, dataAtual, jogador.id],
                    (err) => resolve()
                );
            });
        } else {
            // Novo membro
            await new Promise((resolve) => {
                db.run(
                    `INSERT INTO associacao_membros (jogador_id, cargo, data_entrada, salario_semanal, ativo) VALUES (?, ?, ?, ?, 1)`,
                    [jogador.id, cargoInicial, dataAtual, salario],
                    (err) => resolve()
                );
            });
        }
        
        // Registrar log
        if (adminCore.registrarLog) {
            adminCore.registrarLog(numero, admin.nome || "Admin", "associacao_aprovado", jogador.nome, `Ingresso na Associação como ${cargoInicial}`, "", cargoInicial);
        }
        
        await MessageService.send({ message: msg, text: `
*═══ MEMBRO APROVADO NA ASSOCIAÇÃO! ═══*

*Jogador:* ${jogador.nome}
*Cargo:* ${cargoInicial}
*Salário Semanal:* ${salario.toLocaleString()} Won

*Benefícios concedidos:*
> Acesso a missões da Associação
> Salário semanal automático
> Suporte da Associação

══════════════════════════
_O jogador foi notificado sobre a aprovação._
        ` });
        
        return;
    }
    
    // =====================================
    // !sair associação - Jogador solicita saída
    // =====================================
    if (texto.startsWith("!sair associação") || texto.startsWith("!sair associacao")) {
        const args = texto.split(" ");
        const temConfirmacao = args.includes("confirmar") || args.includes("sim") || args.includes("--confirmar");
        
        const jogador = await JogadorCore.buscarPorNumero(numero);
        if (!jogador) {
            return MessageService.send({ message: msg, text: "*═══ Você precisa criar uma ficha primeiro! ═══*" });
        }
        
        // Verificar se é membro
        const membro = await new Promise((resolve) => {
            db.get("SELECT * FROM associacao_membros WHERE jogador_id = ? AND ativo = 1", [jogador.id], (err, row) => {
                resolve(row);
            });
        });
        
        if (!membro) {
            return MessageService.send({ message: msg, text: "*═══ Você não é membro da Associação! ═══*" });
        }
        
        // Se não confirmou, mostrar aviso
        if (!temConfirmacao) {
            return MessageService.send({ message: msg, text: `
*═══ CONFIRMAÇÃO NECESSÁRIA ═══*

*Você realmente deseja sair da Associação de Caçadores?*

*⚠ AVISO IMPORTANTE ═══*
Abandonar a Associação possui *consequências narrativas*!
Você perderá todos os benefícios:
> Salário semanal de ${(membro.salario_semanal || 0).toLocaleString()} Won
> Acesso a missões exclusivas
> Suporte e recursos da Associação
> Cargo de ${membro.cargo || "Recruta"}

*PARA CONFIRMAR:*
Use: *!sair associação confirmar*

_Pense bem antes de tomar esta decisão._
            ` });
        }
        
        // Confirmou a saída
        // Remover da associação
        await new Promise((resolve) => {
            db.run(
                `UPDATE associacao_membros SET ativo = 0 WHERE jogador_id = ?`,
                [jogador.id],
                (err) => resolve()
            );
        });
        
        // Registrar log
        if (adminCore.registrarLog) {
            const adminInfo = await adminCore.getAdminLevel ? await adminCore.getAdminLevel(numero) : null;
            adminCore.registrarLog(numero, adminInfo?.nome || "Sistema", "associacao_saida", jogador.nome, "Saiu da Associação", membro.cargo, "Inativo");
        }
        
        await MessageService.send({ message: msg, text: `
*═══ SAÍDA DA ASSOCIAÇÃO CONFIRMADA ═══*

*${jogador.nome}* não é mais membro da Associação de Caçadores.

*Benefícios removidos:*
> Salário semanal cancelado
> Acesso a missões exclusivas revogado
> Cargos e permissões removidos

*⚠ CONSEQUÊNCIAS NARRATIVAS ═══*
Sua decisão de abandonar a Associação poderá ter repercussões
durante a história do RPG. Fique atento às consequências!

══════════════════════════
_Caso deseje retornar, será necessário uma nova aprovação._
        ` });
        
        return;
    }
};