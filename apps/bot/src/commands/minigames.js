const MessageService = require("../core/messageService");

/**
 * COMANDO: !minigame
 * Sistema Global de 10 Minigames.
 */
const db = require("../core/database");
const DiceSystem = require("../systems/diceSystem");
const MinigameSystem = require("../systems/minigameSystem");

const jogosAtivos = {};

module.exports = async (msg) => {
    const args = msg.body.split(" ");
    const subcmd = args[1] ? args[1].toLowerCase() : "lista";
    const numero = msg.author || msg.from;

    db.get("SELECT id, nome FROM jogadores WHERE numero = ?", [numero], async (err, jogador) => {
        if (!jogador) return MessageService.send({ message: msg, text: "*✖ Voce precisa ter uma ficha aprovada.*" });
        const jid = jogador.id;
        const jnome = jogador.nome;

        // LISTA DE MINIGAMES
        if (subcmd === "lista") {
            return MessageService.send({ message: msg, text: `*MINIGAMES DISPONIVEIS*\n${"=".repeat(25)}\n1. !minigame naval - Batalha Naval\n2. !minigame anime - Adivinhe o Anime\n3. !minigame tesouro - Caca ao Tesouro\n4. !minigame ppt - Pedra Papel Tesoura\n5. !minigame roleta - Roleta da Sorte\n6. !minigame quiz - Quiz do RPG\n7. !minigame memoria - Jogo da Memoria\n8. !minigame caixas - Sorte ou Azar\n9. !minigame corrida - Corrida\n10. !minigame labirinto - Labirinto` });
        }

        // ===== 1. BATALHA NAVAL =====
        if (subcmd === "naval") {
            const acao = args[2] ? args[2].toLowerCase() : "iniciar";

            if (acao === "iniciar") {
                const tabuleiro = [];
                for (let i = 0; i < 6; i++) {
                    tabuleiro[i] = ["~", "~", "~", "~", "~", "~"];
                }
                // Posicionar 3 navios aleatoriamente
                let navios = 0;
                while (navios < 3) {
                    const l = Math.floor(Math.random() * 6);
                    const c = Math.floor(Math.random() * 6);
                    if (tabuleiro[l][c] === "~") {
                        tabuleiro[l][c] = "N";
                        navios++;
                    }
                }
                jogosAtivos[`${jid}_naval`] = { tabuleiro, tentativas: 0, maxTentativas: 15, acertos: 0 };
                return MessageService.send({ message: msg, text: `*BATALHA NAVAL INICIADA!*\n${"=".repeat(20)}\nTabuleiro 6x6 com 3 navios.\nUse: !minigame naval [linha] [coluna]\nEx: !minigame naval 3 2\nTentativas: 0/15` });
            }

            if (acao === "sair") {
                delete jogosAtivos[`${jid}_naval`];
                return MessageService.send({ message: msg, text: "*Batalha Naval encerrada.*" });
            }

            // Ataque: !minigame naval [linha] [coluna]
            const linha = parseInt(args[2]) - 1;
            const coluna = parseInt(args[3]) - 1;
            const jogo = jogosAtivos[`${jid}_naval`];
            if (!jogo) return MessageService.send({ message: msg, text: "*✖ Inicie uma partida com: !minigame naval iniciar*" });
            if (isNaN(linha) || isNaN(coluna) || linha < 0 || linha > 5 || coluna < 0 || coluna > 5) {
                return MessageService.send({ message: msg, text: "*✖ Coordenadas invalidas. Use linha (1-6) e coluna (1-6)*" });
            }

            jogo.tentativas++;
            let resultado;
            if (jogo.tabuleiro[linha][coluna] === "N") {
                jogo.tabuleiro[linha][coluna] = "X";
                jogo.acertos++;
                resultado = "ACERTOU!";
            } else if (jogo.tabuleiro[linha][coluna] === "~") {
                jogo.tabuleiro[linha][coluna] = "O";
                resultado = "Errou...";
            } else {
                resultado = "Ja atacou aqui.";
            }

            if (jogo.acertos >= 3) {
                delete jogosAtivos[`${jid}_naval`];
                const recompensa = { xp: 200 + Math.floor(Math.random() * 300), won: 500 + Math.floor(Math.random() * 1500) };
                db.run("UPDATE jogadores SET experiencia = experiencia + ?, won = won + ? WHERE id = ?", [recompensa.xp, recompensa.won, jid]);
                return MessageService.send({ message: msg, text: `*VITORIA! VOCE DESTRUIU TODOS OS NAVIOS!*\n${"=".repeat(20)}\nTentativas: ${jogo.tentativas}\n+${recompensa.xp} XP\n+${recompensa.won.toLocaleString()} Won` });
            }

            if (jogo.tentativas >= jogo.maxTentativas) {
                delete jogosAtivos[`${jid}_naval`];
                return MessageService.send({ message: msg, text: `*DERROTA!* Acabaram as tentativas. Navios restantes: ${3 - jogo.acertos}` });
            }

            return MessageService.send({ message: msg, text: `*BATALHA NAVAL*\n${"=".repeat(15)}\nCoordenada (${linha + 1}, ${coluna + 1}): ${resultado}\nAcertos: ${jogo.acertos}/3 | Tentativas: ${jogo.tentativas}/${jogo.maxTentativas}` });
        }

        // ===== 2. ADIVINHE O ANIME =====
        if (subcmd === "anime") {
            const acao = args[2] ? args[2].toLowerCase() : "iniciar";

            if (acao === "iniciar") {
                const animes = MinigameSystem.bancoAnimes;
                const sorteado = animes[Math.floor(Math.random() * animes.length)];
                jogosAtivos[`${jid}_anime`] = { anime: sorteado, tentativas: 3 };
                return MessageService.send({ message: msg, text: `*ADIVINHE O ANIME!*\n${"=".repeat(20)}\nEmojis: ${sorteado.emojis}\n\nDigite o nome do anime!\nVoce tem 3 tentativas.\nUse: !minigame anime [nome]` });
            }

            if (acao === "sair") {
                delete jogosAtivos[`${jid}_anime`];
                return MessageService.send({ message: msg, text: "*Jogo encerrado.*" });
            }

            const jogo = jogosAtivos[`${jid}_anime`];
            if (!jogo) return MessageService.send({ message: msg, text: "*✖ Use: !minigame anime iniciar*" });

            const palpite = args.slice(2).join(" ").toLowerCase();
            if (palpite === jogo.anime.nome) {
                delete jogosAtivos[`${jid}_anime`];
                const recompensa = { xp: 300 + Math.floor(Math.random() * 200), won: 800 + Math.floor(Math.random() * 1200) };
                db.run("UPDATE jogadores SET experiencia = experiencia + ?, won = won + ? WHERE id = ?", [recompensa.xp, recompensa.won, jid]);
                return MessageService.send({ message: msg, text: `*ACERTOU!* O anime era ${jogo.anime.nome}!\n+${recompensa.xp} XP\n+${recompensa.won.toLocaleString()} Won` });
            } else {
                jogo.tentativas--;
                if (jogo.tentativas <= 0) {
                    delete jogosAtivos[`${jid}_anime`];
                    return MessageService.send({ message: msg, text: `*FIM DE JOGO!* O anime era: ${jogo.anime.nome}` });
                }
                return MessageService.send({ message: msg, text: `*Errou!* Tentativas restantes: ${jogo.tentativas}` });
            }
        }

        // ===== 3. CAÇA AO TESOURO =====
        if (subcmd === "tesouro") {
            const acao = args[2] ? args[2].toLowerCase() : "iniciar";

            if (acao === "iniciar") {
                const mapa = [
                    ["⬜", "⬜", "⬜", "⬜"],
                    ["⬜", "⬜", "⬜", "⬜"],
                    ["⬜", "⬜", "⬜", "⬜"],
                    ["⬜", "⬜", "⬜", "⬜"]
                ];
                const premio = Math.random() < 0.3 ? "💰" : (Math.random() < 0.5 ? "❌" : "⬜");
                const tesouroL = Math.floor(Math.random() * 4);
                const tesouroC = Math.floor(Math.random() * 4);
                jogosAtivos[`${jid}_tesouro`] = { mapa, tesouroL, tesouroC, premio, tentativas: 5, encontrou: false };
                return MessageService.send({ message: msg, text: `*CACA AO TESOURO!*\n${"=".repeat(15)}\n${mapa.map(l => l.join("")).join("\n")}\n\nEscolha uma posicao: !minigame tesouro [linha] [coluna]\n(1-4, 1-4)` });
            }

            const jogo = jogosAtivos[`${jid}_tesouro`];
            if (!jogo) return MessageService.send({ message: msg, text: "*✖ Use: !minigame tesouro iniciar*" });

            if (acao === "sair") {
                delete jogosAtivos[`${jid}_tesouro`];
                return MessageService.send({ message: msg, text: "*Caca ao Tesouro encerrada.*" });
            }

            const linha = parseInt(args[2]) - 1;
            const coluna = parseInt(args[3]) - 1;
            if (isNaN(linha) || isNaN(coluna) || linha < 0 || linha > 3 || coluna < 0 || coluna > 3) {
                return MessageService.send({ message: msg, text: "*✖ Coordenadas invalidas (1-4)*" });
            }

            jogo.tentativas--;
            let resultado;

            if (linha === jogo.tesouroL && coluna === jogo.tesouroC) {
                jogo.encontrou = true;
                resultado = "🎉 VOCE ENCONTROU O TESOURO!";
                jogo.mapa[linha][coluna] = "💰";
            } else {
                jogo.mapa[linha][coluna] = "❌";
                resultado = "Nada aqui...";
            }

            const mapaStr = jogo.mapa.map(l => l.join("")).join("\n");

            if (jogo.encontrou) {
                delete jogosAtivos[`${jid}_tesouro`];
                const recompensa = { xp: 500 + Math.floor(Math.random() * 500), won: 2000 + Math.floor(Math.random() * 3000) };
                db.run("UPDATE jogadores SET experiencia = experiencia + ?, won = won + ? WHERE id = ?", [recompensa.xp, recompensa.won, jid]);
                return MessageService.send({ message: msg, text: `*TESOURO ENCONTRADO!*\n${mapaStr}\n\n+${recompensa.xp} XP\n+${recompensa.won.toLocaleString()} Won` });
            }

            if (jogo.tentativas <= 0) {
                delete jogosAtivos[`${jid}_tesouro`];
                return MessageService.send({ message: msg, text: `*FIM DE JOGO!* Nao encontrou o tesouro.\n${mapaStr}` });
            }

            return MessageService.send({ message: msg, text: `*CACA AO TESOURO*\n${mapaStr}\n\n${resultado}\nTentativas: ${jogo.tentativas}` });
        }

        // ===== 4. PEDRA PAPEL TESOURA =====
        if (subcmd === "ppt") {
            const jogada = args[2] ? args[2].toLowerCase() : "";
            if (!["pedra", "papel", "tesoura"].includes(jogada)) {
                return MessageService.send({ message: msg, text: `*PEDRA PAPEL TESOURA*\n${"=".repeat(15)}\nEscolha: !minigame ppt pedra / papel / tesoura` });
            }

            const opcoes = ["pedra", "papel", "tesoura"];
            const botJogada = opcoes[Math.floor(Math.random() * 3)];
            let resultado;

            if (jogada === botJogada) {
                resultado = "EMPATE! Jogue novamente.";
                delete jogosAtivos[`${jid}_ppt`];
                return MessageService.send({ message: msg, text: `*PPT - EMPATE!*\nVoce: ${jogada}\nBot: ${botJogada}\n\nTente novamente!` });
            }

            if ((jogada === "pedra" && botJogada === "tesoura") ||
                (jogada === "papel" && botJogada === "pedra") ||
                (jogada === "tesoura" && botJogada === "papel")) {
                const recompensaV = { xp: 100 + Math.floor(Math.random() * 200), won: 300 + Math.floor(Math.random() * 700) };
                db.run("UPDATE jogadores SET experiencia = experiencia + ?, won = won + ? WHERE id = ?", [recompensaV.xp, recompensaV.won, jid]);
                return MessageService.send({ message: msg, text: `*VITORIA!*\nVoce: ${jogada}\nBot: ${botJogada}\n\n+${recompensaV.xp} XP\n+${recompensaV.won.toLocaleString()} Won` });
            } else {
                return MessageService.send({ message: msg, text: `*DERROTA!*\nVoce: ${jogada}\nBot: ${botJogada}\n\nTente novamente!` });
            }
        }

        // ===== 5. ROLETA DA SORTE =====
        if (subcmd === "roleta") {
            const premios = [
                { nome: "100 XP", xp: 100 },
                { nome: "500 Wons", won: 500 },
                { nome: "5 de Maestria", maestria: 5 },
                { nome: "200 XP + 300 Wons", xp: 200, won: 300 },
                { nome: "1000 Wons", won: 1000 },
                { nome: "Nada", texto: "Nada... Tente de novo!" },
                { nome: "Penalidade -50 Wons", won: -50 },
                { nome: "300 XP", xp: 300 },
                { nome: "Item Comum", texto: "Pocao de Cura!" },
                { nome: "50 de Maestria", maestria: 50 }
            ];
            const premio = premios[Math.floor(Math.random() * premios.length)];
            const updates = [];
            const params = [];

            if (premio.xp) { updates.push("experiencia = experiencia + ?"); params.push(premio.xp); }
            if (premio.won) { updates.push("won = won + ?"); params.push(premio.won); }
            if (premio.maestria) { updates.push("maestria = COALESCE(maestria, 0) + ?"); params.push(premio.maestria); }

            if (updates.length > 0) { params.push(jid); db.run(`UPDATE jogadores SET ${updates.join(", ")} WHERE id = ?`, params); }

            let txt = `*ROLETA DA SORTE*\n${"=".repeat(15)}\n🎰 Girando...\n\nResultado: ${premio.nome}\n`;
            if (premio.xp) txt += `+${premio.xp} XP\n`;
            if (premio.won) txt += `${premio.won > 0 ? "+" : ""}${premio.won.toLocaleString()} Won\n`;
            if (premio.maestria) txt += `+${premio.maestria} de Maestria\n`;
            if (premio.texto) txt += `${premio.texto}\n`;
            return MessageService.send({ message: msg, text: txt });
        }

        // ===== 6. QUIZ DO RPG =====
        if (subcmd === "quiz") {
            const acao = args[2] ? args[2].toLowerCase() : "iniciar";
            const perguntas = [
                { pergunta: "Qual o rank mais alto de cacador?", resposta: "s" },
                { pergunta: "Qual a classe que usa escudos e protege aliados?", resposta: "tanker" },
                { pergunta: "Qual a moeda oficial do RPG?", resposta: "won" },
                { pergunta: "Qual o elemento contrario de fogo?", resposta: "agua" },
                { pergunta: "O que significa DLC?", resposta: "downloadable content" },
                { pergunta: "Qual a capital da Coreia do Sul?", resposta: "seul" },
                { pergunta: "O que e um Monarca?", resposta: "entidade poderosa" },
                { pergunta: "Qual a montanha mais alta da Coreia do Sul?", resposta: "hallasan" },
                { pergunta: "O que e um Fragmento?", resposta: "poder dos governantes" },
                { pergunta: "Qual o dado padrao do sistema?", resposta: "d6" }
            ];

            if (acao === "iniciar") {
                const selecionadas = [];
                const indices = [...Array(perguntas.length).keys()];
                for (let i = 0; i < 5; i++) {
                    const idx = Math.floor(Math.random() * indices.length);
                    selecionadas.push(perguntas[indices[idx]]);
                    indices.splice(idx, 1);
                }
                jogosAtivos[`${jid}_quiz`] = { perguntas: selecionadas, atual: 0, acertos: 0 };
                const p = selecionadas[0];
                return MessageService.send({ message: msg, text: `*QUIZ DO RPG - Pergunta 1/5*\n${"=".repeat(20)}\n${p.pergunta}\n\nResponda com: !minigame quiz [resposta]` });
            }

            const jogo = jogosAtivos[`${jid}_quiz`];
            if (!jogo) return MessageService.send({ message: msg, text: "*✖ Use: !minigame quiz iniciar*" });
            if (acao === "sair") { delete jogosAtivos[`${jid}_quiz`]; return MessageService.send({ message: msg, text: "*Quiz encerrado.*" }); }

            const resposta = args.slice(2).join(" ").toLowerCase();
            const pAtual = jogo.perguntas[jogo.atual];

            if (resposta.includes(pAtual.resposta)) {
                jogo.acertos++;
            }

            jogo.atual++;

            if (jogo.atual >= jogo.perguntas.length) {
                delete jogosAtivos[`${jid}_quiz`];
                const xpFinal = jogo.acertos * 200;
                const wonFinal = jogo.acertos * 500;
                db.run("UPDATE jogadores SET experiencia = experiencia + ?, won = won + ? WHERE id = ?", [xpFinal, wonFinal, jid]);
                return MessageService.send({ message: msg, text: `*QUIZ FINALIZADO!*\n${"=".repeat(15)}\nAcertos: ${jogo.acertos}/5\n+${xpFinal} XP\n+${wonFinal.toLocaleString()} Won` });
            }

            const p = jogo.perguntas[jogo.atual];
            return MessageService.send({ message: msg, text: `*QUIZ DO RPG - Pergunta ${jogo.atual + 1}/5*\n${"=".repeat(20)}\n${p.pergunta}` });
        }

        // ===== 7. MEMÓRIA =====
        if (subcmd === "memoria") {
            const acao = args[2] ? args[2].toLowerCase() : "iniciar";

            if (acao === "iniciar") {
                const emojis = ["🔥", "💧", "⚡", "🌿", "💀", "⭐", "🌀", "💎"];
                const tamanho = 3 + Math.floor(Math.random() * 3); // 3-5
                const sequencia = [];
                for (let i = 0; i < tamanho; i++) {
                    sequencia.push(emojis[Math.floor(Math.random() * emojis.length)]);
                }
                jogosAtivos[`${jid}_memoria`] = { sequencia, exibido: false };
                setTimeout(() => {
                    if (jogosAtivos[`${jid}_memoria`]) {
                        jogosAtivos[`${jid}_memoria`].exibido = true;
                    }
                }, 3000);
                return MessageService.send({ message: msg, text: `*JOGO DA MEMORIA*\n${"=".repeat(15)}\nMemorize a sequencia:\n${sequencia.join(" ")}\n\nA sequencia foi ocultada!\nDigite: !minigame memoria [sequencia]` });
            }

            const jogo = jogosAtivos[`${jid}_memoria`];
            if (!jogo) return MessageService.send({ message: msg, text: "*✖ Use: !minigame memoria iniciar*" });

            if (acao === "sair") { delete jogosAtivos[`${jid}_memoria`]; return MessageService.send({ message: msg, text: "*Jogo encerrado.*" }); }

            const palpite = args.slice(2).join(" ");
            if (palpite === jogo.sequencia.join(" ")) {
                delete jogosAtivos[`${jid}_memoria`];
                const recompensa = { xp: jogo.sequencia.length * 200, won: jogo.sequencia.length * 500 };
                db.run("UPDATE jogadores SET experiencia = experiencia + ?, won = won + ? WHERE id = ?", [recompensa.xp, recompensa.won, jid]);
                return MessageService.send({ message: msg, text: `*ACERTOU!*\nSequencia: ${jogo.sequencia.join(" ")}\n+${recompensa.xp} XP\n+${recompensa.won.toLocaleString()} Won` });
            } else {
                delete jogosAtivos[`${jid}_memoria`];
                return MessageService.send({ message: msg, text: `*ERROU!*\nSequencia correta: ${jogo.sequencia.join(" ")}` });
            }
        }

        // ===== 8. SORTE OU AZAR =====
        if (subcmd === "caixas") {
            const acao = args[2] ? args[2].toLowerCase() : "";
            if (!acao || !["1", "2", "3", "4", "5"].includes(acao)) {
                return MessageService.send({ message: msg, text: `*SORTE OU AZAR*\n${"=".repeat(15)}\nEscolha uma caixa (1-5):\n📦 📦 📦 📦 📦\n!minigame caixas [1-5]` });
            }

            const resultados = [
                { nome: "5000 Wons!", won: 5000 },
                { nome: "1000 XP!", xp: 1000 },
                { nome: "Item Raro!", texto: "Voce ganhou um item misterioso!" },
                { nome: "Nada...", texto: "Caixa vazia." },
                { nome: "Armadilha! -200 Wons", won: -200 }
            ];
            const resultado = resultados[Math.floor(Math.random() * resultados.length)];

            const updates = [];
            const params = [];
            if (resultado.xp) { updates.push("experiencia = experiencia + ?"); params.push(resultado.xp); }
            if (resultado.won) { updates.push("won = won + ?"); params.push(resultado.won); }
            if (updates.length > 0) { params.push(jid); db.run(`UPDATE jogadores SET ${updates.join(", ")} WHERE id = ?`, params); }

            return MessageService.send({ message: msg, text: `*SORTE OU AZAR*\n${"=".repeat(15)}\nCaixa ${acao}:\n${resultado.nome}\n${resultado.texto || ""}\n${resultado.xp ? "+"+resultado.xp+" XP" : ""}\n${resultado.won ? (resultado.won > 0 ? "+" : "")+resultado.won.toLocaleString()+" Won" : ""}` });
        }

        // ===== 9. CORRIDA =====
        if (subcmd === "corrida") {
            const pilotos = ["🏃 Player", "🤖 Bot1", "🤖 Bot2", "🤖 Bot3", "🤖 Bot4"];
            const tempos = pilotos.map(() => Math.floor(Math.random() * 20) + 10);
            const vencedorIdx = tempos.indexOf(Math.min(...tempos));
            const vencedor = pilotos[vencedorIdx];

            let texto = `*CORRIDA!*\n${"=".repeat(15)}\n`;
            pilotos.forEach((p, i) => {
                texto += `${p}: ${tempos[i]}s\n`;
            });
            texto += `\n*VENCEDOR: ${vencedor}!*`;

            if (vencedorIdx === 0) {
                const recompensa = { xp: 500 + Math.floor(Math.random() * 500), won: 1000 + Math.floor(Math.random() * 2000) };
                db.run("UPDATE jogadores SET experiencia = experiencia + ?, won = won + ? WHERE id = ?", [recompensa.xp, recompensa.won, jid]);
                texto += `\n\nVoce venceu!\n+${recompensa.xp} XP\n+${recompensa.won.toLocaleString()} Won`;
            } else {
                texto += "\n\nTente novamente!";
            }

            return MessageService.send({ message: msg, text: texto });
        }

        // ===== 10. LABIRINTO =====
        if (subcmd === "labirinto") {
            const acao = args[2] ? args[2].toLowerCase() : "iniciar";

            if (acao === "iniciar") {
                const lab = [
                    ["⬛", "⬜", "⬜", "⬜"],
                    ["⬛", "⬛", "⬛", "⬜"],
                    ["⬜", "⬜", "⬛", "⬜"],
                    ["⬜", "⬛", "⬛", "🏁"]
                ];
                jogosAtivos[`${jid}_labirinto`] = { lab, jogador: [0, 0], passos: 0, maxPassos: 15 };
                return MessageService.send({ message: msg, text: `*LABIRINTO*\n${"=".repeat(15)}\n${lab.map(l => l.join("")).join("\n")}\n\nUse: !minigame labirinto [cima/baixo/esquerda/direita]\nChegue ate 🏁` });
            }

            const jogo = jogosAtivos[`${jid}_labirinto`];
            if (!jogo) return MessageService.send({ message: msg, text: "*✖ Use: !minigame labirinto iniciar*" });

            if (acao === "sair") { delete jogosAtivos[`${jid}_labirinto`]; return MessageService.send({ message: msg, text: "*Labirinto encerrado.*" }); }

            const dirs = { "cima": [-1, 0], "baixo": [1, 0], "esquerda": [0, -1], "direita": [0, 1] };
            const movimento = dirs[acao];
            if (!movimento) return MessageService.send({ message: msg, text: "*✖ Use: cima, baixo, esquerda ou direita*" });

            let [l, c] = jogo.jogador;
            const [dl, dc] = movimento;
            const nl = l + dl;
            const nc = c + dc;

            if (nl < 0 || nl > 3 || nc < 0 || nc > 3 || jogo.lab[nl][nc] === "⬛") {
                return MessageService.send({ message: msg, text: "*✖ Parede! Tente outra direcao.*" });
            }

            jogo.lab[l][c] = "⬜";
            jogo.jogador = [nl, nc];
            jogo.passos++;
            jogo.lab[nl][nc] = "🧑";

            if (nl === 3 && nc === 3) {
                delete jogosAtivos[`${jid}_labirinto`];
                const recompensa = { xp: 800 + Math.floor(Math.random() * 700), won: 3000 + Math.floor(Math.random() * 2000) };
                db.run("UPDATE jogadores SET experiencia = experiencia + ?, won = won + ? WHERE id = ?", [recompensa.xp, recompensa.won, jid]);
                return MessageService.send({ message: msg, text: `*VOCE ESCAPOU DO LABIRINTO!*\n${jogo.lab.map(l => l.join("")).join("\n")}\n\n+${recompensa.xp} XP\n+${recompensa.won.toLocaleString()} Won` });
            }

            if (jogo.passos >= jogo.maxPassos) {
                delete jogosAtivos[`${jid}_labirinto`];
                return MessageService.send({ message: msg, text: `*FIM DE JOGO!* Acabaram os passos.\n${jogo.lab.map(l => l.join("")).join("\n")}` });
            }

            return MessageService.send({ message: msg, text: `*LABIRINTO - Passo ${jogo.passos}/${jogo.maxPassos}*\n${jogo.lab.map(l => l.join("")).join("\n")}` });
        }

        return MessageService.send({ message: msg, text: "*Comando de minigame nao reconhecido. Use !minigame lista*" });
    });
};
