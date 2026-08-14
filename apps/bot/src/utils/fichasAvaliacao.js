/**
 * SISTEMA DE AVALIAÇÃO DE FICHAS
 * 
 * Analisa fichas pendentes e retorna resultado da avaliação.
 */

const elementos = require("../elementos/listaElementos");
const { obterClasseCanonica } = require("./normalizarClasse");

module.exports = {
    avaliar: function(ficha) {
        if (!ficha) {
            return { status: "ERRO", notas: ["Ficha não encontrada"] };
        }
        
        const dados = JSON.parse(ficha.dados || "{}");
        const notas = [];
        const erros = [];
        
        // Validar campos obrigatórios
        if (!dados.nome) erros.push("• Nome não informado");
        if (!dados.classe) erros.push("• Classe não informada");
        if (!dados.forca && dados.forca !== 0) erros.push("• Força não informada");
        if (!dados.resistencia && dados.resistencia !== 0) erros.push("• Resistência não informada");
        if (!dados.velocidade && dados.velocidade !== 0) erros.push("• Velocidade não informada");
        if (!dados.inteligencia && dados.inteligencia !== 0) erros.push("• Inteligência não informada");
        if (!dados.poder_magico && dados.poder_magico !== 0) erros.push("• Poder Mágico não informado");
        if (!dados.historia) erros.push("• História não informada");
        
        // Validar classe
        const classeValida = obterClasseCanonica(dados.classe);
        if (!classeValida && dados.classe) {
            erros.push(`• Classe "${dados.classe}" não encontrada no sistema`);
        }
        
        // Validar atributos (máximo 10 pontos cada)
        const atributos = ['forca', 'resistencia', 'velocidade', 'sentidos', 'inteligencia', 'poder_magico'];
        atributos.forEach(attr => {
            const valor = parseInt(dados[attr]) || 0;
            if (valor > 10) {
                erros.push(`• ${attr}: ${valor} (máximo 10 pontos)`);
            }
            if (valor < 0) {
                erros.push(`• ${attr}: ${valor} (valor negativo não permitido)`);
            }
        });
        
        // Validar soma dos atributos
        const somaAtributos = atributos.reduce((acc, attr) => acc + (parseInt(dados[attr]) || 0), 0);
        if (somaAtributos > 10) {
            erros.push(`• Total de pontos: ${somaAtributos}/10 (máximo 10 pontos distribuídos)`);
        }
        
        // Validar elemento (se informado)
        if (dados.elemento && !elementos[dados.elemento.toLowerCase()]) {
            notas.push(`⚠ Elemento "${dados.elemento}" não encontrado (será sorteado)`);
        }
        
        // Verificar comprimento da história
        if (dados.historia && dados.historia.length < 50) {
            notas.push("⚠ História muito curta (mínimo 50 caracteres)");
        }
        
        if (erros.length > 0) {
            return {
                status: "REPROVADO",
                notas: [...erros, ...notas]
            };
        }
        
        if (notas.length > 0) {
            return {
                status: "APROVADO COM RESSALVAS",
                notas: notas
            };
        }
        
        return {
            status: "APROVADO",
            notas: ["✓ Todos os campos estão corretos"]
        };
    }
};
