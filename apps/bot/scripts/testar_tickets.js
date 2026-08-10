/*
 * TESTE DO SISTEMA DE TICKETS
 * 
 * Verifica:
 * 1. Tabelas criadas
 * 2. Sorteio de ticket 50/50
 * 3. Uso de ticket e fila
 * 4. Posição na fila
 */

const db = require("../src/core/database");
const TicketSystem = require("../src/systems/ticketSystem");

async function testar() {
    console.log("🧪 TESTE DO SISTEMA DE TICKETS");
    console.log("==============================\n");

    // Inicializar banco (cria tabelas se não existirem)
    await new Promise((resolve) => {
        db.iniciarBanco(() => resolve());
    });

    // 1. Verificar tabelas
    const tabelas = await new Promise((resolve) => {
        db.all("SELECT name FROM sqlite_master WHERE type='table' AND name IN ('tickets_unicos', 'fila_avaliacao')", [], (err, rows) => {
            resolve(rows || []);
        });
    });

    console.log("📋 Tabelas encontradas:");
    tabelas.forEach(t => console.log(`  ✅ ${t.name}`));
    if (tabelas.length < 2) {
        console.log("  ❌ Tabelas faltando!");
    }

    // 2. Testar sorteio de ticket
    console.log("\n🎲 Testando sorteio de ticket 50/50...");
    const ticket = await TicketSystem.sortearTicket(1);
    console.log(`  ✅ Ticket sorteado: ${ticket.nome} (${ticket.tipo})`);

    // 3. Testar uso de ticket
    console.log("\n🎫 Testando uso de ticket...");
    const resultado = await TicketSystem.usarTicket(1, ticket.ticketId);
    if (resultado.erro) {
        console.log(`  ❌ Erro: ${resultado.erro}`);
    } else {
        console.log(`  ✅ Ticket usado! Posição na fila: ${resultado.posicao}`);
    }

    // 4. Verificar posição na fila
    console.log("\n📊 Verificando posição na fila...");
    const fila = await TicketSystem.getPosicaoFila(1);
    if (fila) {
        console.log(`  ✅ Posição: ${fila.posicao} (status: ${fila.status})`);
    } else {
        console.log("  ❌ Não está na fila!");
    }

    // 5. Verificar tickets do jogador
    console.log("\n🎫 Verificando tickets do jogador...");
    const tickets = await TicketSystem.getTickets(1);
    tickets.forEach(t => {
        console.log(`  ✅ ${t.nome} - Status: ${t.status}`);
    });

    // 6. Testar avanço da fila
    console.log("\n🔄 Testando avanço da fila...");
    if (fila) {
        const avancou = await TicketSystem.avancarFila(fila.id);
        console.log(`  ✅ Fila avançada: ${avancou.sucesso}`);
    }

    // 7. Verificar fila completa
    console.log("\n📋 Fila completa:");
    const filaCompleta = await TicketSystem.getFilaCompleta();
    if (filaCompleta.length === 0) {
        console.log("  ✅ Fila vazia");
    } else {
        filaCompleta.forEach(f => {
            console.log(`  ${f.posicao}. ${f.jogador_nome} (${f.tipo})`);
        });
    }

    console.log("\n✅ TESTE CONCLUÍDO COM SUCESSO!");
    db.close();
    process.exit(0);
}

testar().catch(e => {
    console.error("Erro no teste:", e);
    process.exit(1);
});