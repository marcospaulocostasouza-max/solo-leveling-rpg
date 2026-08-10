const db = require("../core/database");
const buffsClasses = require("./buffsClasses");


module.exports = async function salvarJogador(dados) {


    const buff = buffsClasses[dados.classe] || {};



    const jogador = {


        numero: dados.numero,


        nome: dados.nome,

        idade: dados.idade,


        aparencia: dados.aparencia,

        altura: dados.altura,

        peso: dados.peso,

        nacionalidade: dados.nacionalidade,

        personalidade: dados.personalidade,

        historia: dados.historia,


        classe: dados.classe,



        // atributos base

        forca_base: dados.forca,

        resistencia_base: dados.resistencia,

        velocidade_base: dados.velocidade,

        sentidos_base: dados.sentidos,

        inteligencia_base: dados.inteligencia,

        poder_magico_base: dados.poder_magico,



        // buffs da classe

        forca_buff: buff.forca_buff || 0,

        resistencia_buff: buff.resistencia_buff || 0,

        velocidade_buff: buff.velocidade_buff || 0,

        sentidos_buff: buff.sentidos_buff || 0,

        inteligencia_buff: buff.inteligencia_buff || 0,

        poder_magico_buff: buff.poder_magico_buff || 0

    };




    db.run(`

        INSERT INTO jogadores (

            numero,

            nome,

            idade,

            aparencia,

            altura,

            peso,

            nacionalidade,

            personalidade,

            historia,

            classe,


            forca_base,

            resistencia_base,

            velocidade_base,

            sentidos_base,

            inteligencia_base,

            poder_magico_base,


            forca_buff,

            resistencia_buff,

            velocidade_buff,

            sentidos_buff,

            inteligencia_buff,

            poder_magico_buff


        )


        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)

    `,[


        jogador.numero,

        jogador.nome,

        jogador.idade,

        jogador.aparencia,

        jogador.altura,

        jogador.peso,

        jogador.nacionalidade,

        jogador.personalidade,

        jogador.historia,

        jogador.classe,


        jogador.forca_base,

        jogador.resistencia_base,

        jogador.velocidade_base,

        jogador.sentidos_base,

        jogador.inteligencia_base,

        jogador.poder_magico_base,


        jogador.forca_buff,

        jogador.resistencia_buff,

        jogador.velocidade_buff,

        jogador.sentidos_buff,

        jogador.inteligencia_buff,

        jogador.poder_magico_buff


    ], function(error){


        if(error){

            console.log("Erro ao salvar jogador:", error);

        } else {

            console.log("Jogador criado com sucesso!");

        }


    });



};