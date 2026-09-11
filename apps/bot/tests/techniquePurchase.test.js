"use strict";

// Default: isolated in-memory SQLite. --postgres: temporary tables on a
// dedicated one-connection pool; never purchase with real player records.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { createRequire } = require("node:module");
const root = path.resolve(__dirname, "../../..");
const postgres = process.argv.includes("--postgres");
if (postgres) require("dotenv").config({ path: path.join(root, ".env"), quiet: true });
process.env.DATABASE_PROVIDER = postgres ? "postgres" : "sqlite";
process.env.DATABASE_POOL_MAX = "1";

function load(file, replacements = {}) {
    const filename = path.join(root, file);
    const originalRequire = createRequire(filename);
    const module = { exports: {} };
    vm.runInNewContext(fs.readFileSync(filename, "utf8"), {
        require: name => replacements[name] || originalRequire(name), module,
        exports: module.exports, __dirname: path.dirname(filename), process, console
    }, { filename });
    return module.exports;
}

async function main() {
    let memory;
    const database = postgres ? require("../../../packages/database") : load("packages/database/index.js", {
        sqlite3: { verbose: () => ({ Database: function () {
            memory = new (require("sqlite3").Database)(":memory:");
            return memory;
        } }) },
        fs: { ...fs, readdirSync: () => [] }
    });
    const service = load("apps/bot/src/systems/techniquePurchaseSystem.js", {
        "../../../../packages/database": database
    });
    try {
        if (postgres) {
            const catalog = await database.all("SELECT nome,classe,categoria,custo_maestria,custo_qi FROM tecnicas");
            for (const technique of catalog) {
                assert(service.compativel({ classe: technique.classe, classe_avancada: technique.classe, estilo_luta: technique.classe }, technique), technique.nome);
                const cost = Number(technique.custo_maestria ?? technique.custo_qi ?? 0);
                assert(Number.isSafeInteger(cost) && cost >= 0, `Custo inválido: ${technique.nome}`);
            }
            console.log(`Catálogo: ${catalog.length} técnicas verificadas (compatibilidade e custo).`);
            await database.run("SET search_path TO pg_temp");
        }
        const temporary = postgres ? "TEMP " : "";
        await database.run(`CREATE ${temporary}TABLE jogadores (id INTEGER PRIMARY KEY, classe TEXT, classe_avancada TEXT, estilo_luta TEXT, nivel INTEGER, maestria INTEGER CHECK(maestria >= 0))`);
        await database.run(`CREATE ${temporary}TABLE tecnicas (id INTEGER PRIMARY KEY, nome TEXT, classe TEXT, categoria TEXT, nivel_desbloqueio INTEGER, custo_maestria INTEGER, custo_qi INTEGER)`);
        await database.run(`CREATE ${temporary}TABLE jogador_tecnicas (id ${postgres ? "SERIAL PRIMARY KEY" : "INTEGER PRIMARY KEY AUTOINCREMENT"}, jogador_id INTEGER REFERENCES jogadores(id), tecnica_id INTEGER REFERENCES tecnicas(id), nivel INTEGER, equipada INTEGER, experiencia INTEGER)`);
        // Intentionally no unique ownership index: player locking must prevent duplicates.
        await database.run(`CREATE ${temporary}TABLE historico_maestria (jogador_id INTEGER, descricao TEXT, valor INTEGER, data TEXT)`);
        await database.run("INSERT INTO jogadores VALUES (1,'Mago','Arquimago','Cajados e Orbes',100,100)");
        const { tecnicaInicial, tecnicas } = require("../src/tecnicas/estilos/cajados_e_orbes");
        const fixtures = [tecnicaInicial, tecnicas[0], { nome: "Teste inicial", classe: "Mago", categoria: "Inicial", nivel_desbloqueio: 1, custo_maestria: 10 }, { nome: "Teste avançada", classe: "Arquimago", categoria: "Avançada", nivel_desbloqueio: 1, custo_maestria: 20 }];
        for (const [i, t] of fixtures.entries()) await database.run("INSERT INTO tecnicas VALUES (?,?,?,?,?,?,?)", [i + 1,t.nome,t.classe,t.categoria,t.nivel_desbloqueio,t.custo_maestria,t.custo_qi ?? t.custo_maestria]);
        const buy = id => service.comprarTecnica({ id: 1, maestria: 9999 }, { id, custo_maestria: 0 });
        const balance = async () => Number((await database.get("SELECT maestria FROM jogadores WHERE id=1")).maestria);
        const owned = async () => Number((await database.get("SELECT COUNT(*) AS total FROM jogador_tecnicas")).total);
        const reset = async (amount = 100) => { await database.run("DELETE FROM jogador_tecnicas"); await database.run("UPDATE jogadores SET maestria=? WHERE id=1", [amount]); };

        const first = await buy(1);
        assert.equal(first.cost, 10); assert.equal(first.maestria, 90); assert.equal(first.nextCost, 20);
        assert.equal(await owned(), 1);
        await assert.rejects(buy(1), /já possui/); assert.equal(await balance(), 90);
        await buy(2); await buy(3); await buy(4); assert.equal(await balance(), 40);
        console.log("Compras de proficiência, inicial e avançada; custo real; duplicata: OK");

        await reset(9); await assert.rejects(buy(1), /Maestria insuficiente/);
        assert.equal(await balance(), 9); assert.equal(await owned(), 0);
        await reset();
        const originalTransaction = database.transaction;
        for (const failAt of ["run", "all"]) {
            database.transaction = work => originalTransaction(query => work({ ...query,
                [failAt]: async (sql, params) => {
                    if (failAt === "all" || sql.startsWith("INSERT INTO jogador_tecnicas")) throw new Error("falha simulada");
                    return query[failAt](sql, params);
                }
            }));
            await assert.rejects(buy(1), /falha simulada/);
            assert.equal(await balance(), 100); assert.equal(await owned(), 0);
        }
        database.transaction = originalTransaction;
        console.log("Saldo insuficiente e rollback após débito/entrega: OK");

        const duplicate = await Promise.allSettled([buy(1), buy(1)]);
        assert.equal(duplicate.filter(x => x.status === "fulfilled").length, 1);
        assert.equal(await balance(), 90); assert.equal(await owned(), 1);
        await reset(20);
        const competing = await Promise.allSettled([buy(1), buy(2)]);
        assert.equal(competing.filter(x => x.status === "fulfilled").length, 1);
        assert.equal(await owned(), 1); assert((await balance()) >= 0);
        await reset();
        const mixed = await Promise.allSettled([buy(1), database.purchaseTechnique(1, 1)]);
        assert.equal(mixed.filter(x => x.status === "fulfilled").length, 1);
        assert.equal(await balance(), 90); assert.equal(await owned(), 1);
        console.log(`Concorrência bot/bot e bot/site: OK (${postgres ? "PostgreSQL temporário" : "SQLite em memória"}).`);
    } finally {
        if (postgres) await require("../../../packages/database/postgres").close();
        else if (memory) await new Promise((resolve, reject) => memory.close(e => e ? reject(e) : resolve()));
    }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
