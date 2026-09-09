/**
 * Leitura canônica de cenas enviadas a NPCs.
 *
 * Convenção do RPG:
 *   _ação visível_
 *   *fala audível*
 *   > pensamento privado
 *
 * Texto fora dessas marcações é preservado, mas nunca é promovido a fala,
 * ação ou pensamento por inferência. Isso evita que um NPC responda a uma
 * ação como se ela tivesse sido dita pelo jogador.
 */

function limpar(texto) {
    return String(texto || '').replace(/\s+/g, ' ').trim();
}

function adicionar(segmentos, tipo, texto) {
    const conteudo = limpar(texto);
    if (conteudo) segmentos.push({ tipo, texto: conteudo });
}

function analisarCena(texto) {
    const original = String(texto || '').replace(/\r\n/g, '\n');
    const segmentos = [];

    for (const linha of original.split('\n')) {
        const pensamento = linha.match(/^\s*>\s?(.*)$/);
        if (pensamento) {
            adicionar(segmentos, 'pensamento', pensamento[1]);
            continue;
        }

        let buffer = '';
        let aberto = null;
        let conteudo = '';
        const descarregar = () => {
            adicionar(segmentos, 'texto_livre', buffer);
            buffer = '';
        };

        for (let indice = 0; indice < linha.length; indice += 1) {
            const caractere = linha[indice];
            const anterior = linha[indice - 1];
            if ((caractere === '_' || caractere === '*') && anterior === '\\') {
                if (aberto) conteudo = `${conteudo.slice(0, -1)}${caractere}`;
                else buffer = `${buffer.slice(0, -1)}${caractere}`;
                continue;
            }
            if (!aberto && (caractere === '_' || caractere === '*')) {
                descarregar();
                aberto = caractere;
                conteudo = '';
                continue;
            }
            if (aberto && caractere === aberto) {
                adicionar(segmentos, aberto === '_' ? 'acao' : 'fala', conteudo);
                aberto = null;
                conteudo = '';
                continue;
            }
            if (aberto) conteudo += caractere;
            else buffer += caractere;
        }
        if (aberto) buffer += `${aberto}${conteudo}`;
        descarregar();
    }

    const porTipo = tipo => segmentos.filter(item => item.tipo === tipo).map(item => item.texto);
    return {
        original,
        segmentos,
        acoes: porTipo('acao'),
        falas: porTipo('fala'),
        pensamentos: porTipo('pensamento'),
        textoLivre: porTipo('texto_livre'),
        possuiConteudoObservavel: segmentos.some(item => item.tipo === 'acao' || item.tipo === 'fala')
    };
}

function lista(itens, rotulo, transformar = valor => valor) {
    if (!itens.length) return '';
    return `${rotulo}:\n${itens.map(item => `- ${transformar(item)}`).join('\n')}`;
}

function formatarCenaParaPrompt(cenaOuTexto, opcoes = {}) {
    const cena = typeof cenaOuTexto === 'string' ? analisarCena(cenaOuTexto) : cenaOuTexto;
    const partes = [
        lista(cena.acoes, 'AÇÕES VISÍVEIS AO NPC', item => `_${item}_`),
        lista(cena.falas, 'FALAS AUDÍVEIS AO NPC', item => `*"${item}"*`),
        lista(cena.pensamentos, 'PENSAMENTOS PRIVADOS DO JOGADOR — O NPC NÃO OUVE, NÃO LÊ E NÃO PODE REAGIR A ELES', item => `> ${item}`)
    ];
    if (opcoes.incluirTextoLivre !== false) {
        partes.push(lista(cena.textoLivre, 'TEXTO FORA DO MOLDE — NÃO ASSUMA QUE FOI FALA, AÇÃO OU PENSAMENTO', item => item));
    }
    return partes.filter(Boolean).join('\n\n') || 'Nenhuma ação, fala ou pensamento legível foi informado.';
}

function textoObservavelParaAnalise(cenaOuTexto) {
    const cena = typeof cenaOuTexto === 'string' ? analisarCena(cenaOuTexto) : cenaOuTexto;
    // Somente fala marcada é linguagem dirigida ao NPC. Texto livre pode ser
    // exibido para pedir correção, mas não deve gerar intenção, memória ou
    // conhecimento compartilhado.
    return cena.falas.join(' ').trim();
}

function textoVisivelParaContexto(cenaOuTexto) {
    const cena = typeof cenaOuTexto === 'string' ? analisarCena(cenaOuTexto) : cenaOuTexto;
    return [...cena.acoes, ...cena.falas].join(' ').trim();
}

module.exports = { analisarCena, formatarCenaParaPrompt, textoObservavelParaAnalise, textoVisivelParaContexto };
