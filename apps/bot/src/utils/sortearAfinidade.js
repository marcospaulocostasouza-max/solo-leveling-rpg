const elementos = require("../elementos/listaElementos");

// ==============================
// SORTEAR AFINIDADE INICIAL
// ==============================

function sortearAfinidade() {
    try {
        const elementosSorteaveis = elementos.filter(
            elemento => elemento.sorteavel === true
        );



        let tabelaSorteio = [];



        elementosSorteaveis.forEach(elemento => {


            let chance = 0;



            switch(elemento.raridade) {


                case "Comum":
                    chance = 70;
                break;


                case "Incomum":
                    chance = 20;
                break;


                case "Raro":
                    chance = 8;
                break;


                case "Muito Raro":
                    chance = 2;
                break;


                case "Lendário":
                    chance = 1;
                break;


            }



            for(
                let i = 0;
                i < chance;
                i++
            ){

                tabelaSorteio.push(elemento);

            }


        });




        if(tabelaSorteio.length === 0){

            return null;

        }




        const resultado = tabelaSorteio[

            Math.floor(
                Math.random() *
                tabelaSorteio.length
            )

        ];



        return resultado;



    }
    catch(erro){


        console.log(
            "Erro ao sortear afinidade:",
            erro
        );


        return null;


    }


}



module.exports = sortearAfinidade;