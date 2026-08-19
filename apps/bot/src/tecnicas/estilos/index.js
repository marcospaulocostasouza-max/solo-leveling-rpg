/** Registro de técnicas de Estilos de Luta. */
const espadas = require("./espadas");
const kanabo = require("./kanabo");
const katanas = require("./katanas");
const adagas = require("./adagas");
const lancas = require("./lancas");
const cajados_e_orbes = require("./cajados_e_orbes");
const arcos = require("./arcos");
const combate_desarmado = require("./combate_desarmado");
const escudos = require("./escudos");
const foices = require("./foices");
const correntes = require("./correntes");
const machados = require("./machados");
const martelos = require("./martelos");
const chicotes = require("./chicotes");
const manoplas = require("./manoplas");
const bestas = require("./bestas");
const bumerangues = require("./bumerangues");
const garras = require("./garras");
const sabres = require("./sabres");
const foices_duplas = require("./foices_duplas");
const tridentes = require("./tridentes");
const clavas = require("./clavas");
const floretes = require("./floretes");
const chakrams = require("./chakrams");
const luvas_de_combate = require("./luvas_de_combate");
const manguais = require("./manguais");
const alabardas = require("./alabardas");
const nunchakus = require("./nunchakus");
const tonfas = require("./tonfas");
const kamas = require("./kamas");
const rapieiras = require("./rapieiras");
const baculos = require("./baculos");
const cimitarras = require("./cimitarras");
const picaretas_de_guerra = require("./picaretas_de_guerra");
const bastoes = require("./bastoes");
const funda = require("./funda");
const laminas_duplas = require("./laminas_duplas");
const correntes_com_foice = require("./correntes_com_foice");
const leques_de_guerra = require("./leques_de_guerra");
const instrumentos_musicais = require("./instrumentos_musicais");
const pistolas = require("./pistolas");
const escopetas = require("./escopetas");
const fuzis = require("./fuzis");
const rifles_de_precisao = require("./rifles_de_precisao");
const facas = require("./facas");
const espadas_pesadas = require("./espadas_pesadas");
const espadas_pesadas_duplas = require("./espadas_pesadas_duplas");

const estilos = {
    espadas,
    kanabo,
    katanas,
    adagas,
    lancas,
    cajados_e_orbes,
    arcos,
    combate_desarmado,
    escudos,
    foices,
    correntes,
    machados,
    martelos,
    chicotes,
    manoplas,
    bestas,
    bumerangues,
    garras,
    sabres,
    foices_duplas,
    tridentes,
    clavas,
    floretes,
    chakrams,
    luvas_de_combate,
    manguais,
    alabardas,
    nunchakus,
    tonfas,
    kamas,
    rapieiras,
    baculos,
    cimitarras,
    picaretas_de_guerra,
    bastoes,
    funda,
    laminas_duplas,
    correntes_com_foice,
    leques_de_guerra,
    instrumentos_musicais,
    pistolas,
    escopetas,
    fuzis,
    rifles_de_precisao,
    facas,
    espadas_pesadas,
    espadas_pesadas_duplas,
};

function getTecnicasEstilo(nomeEstilo) {
    const chave = String(nomeEstilo || "")
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
    return estilos[chave] || null;
}
function listarEstilos() {
    return Object.keys(estilos).map(chave => ({
        chave, nome: estilos[chave].nome, descricao: estilos[chave].descricao_classe,
        categoria: estilos[chave].categoria || "Proficiencia"
    }));
}
module.exports = { estilos, getTecnicasEstilo, listarEstilos };
