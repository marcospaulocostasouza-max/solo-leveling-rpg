/*
 * CORREÇÃO DE SLOTS NO BANCO DE DADOS
 * 
 * Corrige as categorias legadas dos itens iniciais para os slots padronizados:
 * - "Consumivel" → "Item de Apoio"
 * - "Armadura" → "Corpo"
 * - "Arma" → "Arma 1"
 * - "Acessorio" → "Acessórios"
 * - "Slot de Cabeça" → "Cabeça"
 * - "Slot de Corpo" → "Corpo"
 * - "Slot de Pernas" → "Pernas"
 * - "Slot de Pés" → "Pés"
 * - "Slot de Acessórios" → "Acessórios"
 * - "Itens de Apoio" → "Item de Apoio"
 */

const db = require("../src/core/database");

const MAPA_CORRECAO = {
    "consumivel": "Item de Apoio",
    "consumível": "Item de Apoio",
    "armadura": "Corpo",
    "arma": "Arma 1",
    "acessorio": "Acessórios",
    "acessório": "Acessórios",
    "slot de cabeça": "Cabeça",
    "slot de corpo": "Corpo",
    "slot de pernas": "Pernas",
    "slot de pés": "Pés",
    "slot de pes": "Pés",
    "slot de acessórios": "Acessórios",
    "slot de acessorios": "Acessórios",
    "itens de apoio": "Item de Apoio"
};

const SLOTS_VALIDOS = [
    "Cabeça", "Corpo", "Pernas", "Pés", "Acessórios", "Item de Apoio", "Arma 1", "Arma 2"
];

console.log("🔧 CORRIGINDO SLOTS NO BANCO DE DADOS");
console.log("======================================\n");

// Buscar todos os itens
db.all("SELECT id, nome, categoria FROM itens", [], (err, itens) => {
    if (err) {
        console.error("❌ Erro ao buscar itens:", err.message);
        process.exit(1);
    }
    
    console.log(`📋 Total de itens no banco: ${itens.length}\n`);
    
    let corrigidos = 0;
    let jaCorretos = 0;
    let erros = [];
    
    for (const item of itens) {
        const categoria = item.categoria || "";
        const categoriaLower = categoria.toLowerCase().trim();
        
        // Já está correto?
        if (SLOTS_VALIDOS.includes(categoria)) {
            jaCorretos++;
            continue;
        }
        
        // Verificar se precisa correção
        const novoSlot = MAPA_CORRECAO[categoriaLower];
        if (novoSlot) {
            db.run(
                "UPDATE itens SET categoria = ? WHERE id = ?",
                [novoSlot, item.id],
                function(err2) {
                    if (err2) {
                        erros.push(`Erro ao corrigir item "${item.nome}" (ID ${item.id}): ${err2.message}`);
                    } else {
                        console.log(`✅ "${item.nome}" (ID ${item.id}): "${categoria}" → "${novoSlot}"`);
                        corrigidos++;
                    }
                }
            );
        } else {
            erros.push(`⚠️ Item "${item.nome}" (ID ${item.id}) tem categoria desconhecida: "${categoria}"`);
        }
    }
    
    // Aguardar operações de escrita terminarem
    setTimeout(() => {
        console.log("\n══════════════════════════════════════");
        console.log("📊 RESULTADO DA CORREÇÃO");
        console.log("══════════════════════════════════════");
        console.log(`✅ Itens corrigidos: ${corrigidos}`);
        console.log(`ℹ️ Itens já corretos: ${jaCorretos}`);
        
        if (erros.length > 0) {
            console.log(`\n❌ ${erros.length} PROBLEMAS:\n`);
            erros.forEach(e => console.log(`  - ${e}`));
        }
        
        console.log("\n");
        
        // Verificação final
        db.all("SELECT categoria, COUNT(*) as total FROM itens GROUP BY categoria", [], (err3, categorias) => {
            if (err3) return;
            
            console.log("📊 Distribuição final por slot:");
            for (const cat of categorias) {
                const status = SLOTS_VALIDOS.includes(cat.categoria) ? "✅" : "❌";
                console.log(`  ${status} ${cat.categoria}: ${cat.total} itens`);
            }
            
            db.close();
            process.exit(erros.length > 0 ? 1 : 0);
        });
    }, 500);
});