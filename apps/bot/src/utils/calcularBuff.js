module.exports = function calcularBuff(classe, atributos){


    const buff = {
        forca: 0,
        resistencia: 0,
        velocidade: 0,
        sentidos: 0,
        inteligencia: 0,
        poder_magico: 0
    };



    switch(classe){


        case "Lutador":

            buff.forca = Math.floor(atributos.forca * 0.5);

            break;



        case "Assassino":

            buff.sentidos = Math.floor(atributos.sentidos * 0.5);

            break;



        case "Tank":

            buff.resistencia = Math.floor(atributos.resistencia * 0.5);

            break;



        case "Ranger Físico":

            buff.forca = Math.floor(atributos.forca * 0.5);

            break;



        case "Ranger Mágico":

            buff.poder_magico = Math.floor(atributos.poder_magico * 0.5);

            break;



        case "Curador":

            buff.inteligencia = Math.floor(atributos.inteligencia * 0.5);

            break;



        case "Mago Elemental":

            buff.poder_magico = Math.floor(atributos.poder_magico * 0.5);

            break;



        case "Mago Invocador":

            buff.poder_magico = Math.floor(atributos.poder_magico * 0.5);

            break;



        case "Mago Barreira":

            buff.poder_magico = Math.floor(atributos.poder_magico * 0.5);

            break;



        case "Mago Maldição":

            buff.poder_magico = Math.floor(atributos.poder_magico * 0.5);

            break;



    }



    return buff;


};