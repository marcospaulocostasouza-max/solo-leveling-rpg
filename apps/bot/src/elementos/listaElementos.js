const elementos = [

    // =====================================
    // ELEMENTOS NATURAIS
    // =====================================


    {
        nome:"Fogo",
        categoria:"Natural",
        origem:"Próprio",
        raridade:"Comum",
        sorteavel:true,
        bonusAfinidade:20,

        vantagens:[
            "Gelo",
            "Planta"
        ],

        bonusVantagem:30
    },


    {
        nome:"Água",
        categoria:"Natural",
        origem:"Próprio",
        raridade:"Comum",
        sorteavel:true,
        bonusAfinidade:20,

        vantagens:[
            "Fogo"
        ],

        bonusVantagem:30
    },


    {
        nome:"Terra",
        categoria:"Natural",
        origem:"Próprio",
        raridade:"Comum",
        sorteavel:true,
        bonusAfinidade:20,

        vantagens:[
            "Água"
        ],

        bonusVantagem:30
    },


    {
        nome:"Vento",
        categoria:"Natural",
        origem:"Próprio",
        raridade:"Comum",
        sorteavel:true,
        bonusAfinidade:20,

        vantagens:[
            "Fogo",
            "Terra",
            "Raio"
        ],

        bonusVantagem:30
    },


    {
        nome:"Raio",
        categoria:"Especial",
        origem:"Próprio",
        raridade:"Raro",
        sorteavel:true,
        bonusAfinidade:20,

        vantagens:[
            "Terra",
            "Água",
            "Planta",
            "Gelo",
            "Fogo"
        ],

        bonusVantagem:30
    },



    // =====================================
    // ELEMENTOS VARIANTES
    // =====================================


    {
        nome:"Gelo",
        categoria:"Variante",
        origem:"Água",
        raridade:"Incomum",
        sorteavel:true,
        bonusAfinidade:20,

        vantagens:[
            "Planta",
            "Vento"
        ],

        bonusVantagem:30
    },


    {
        nome:"Planta",
        categoria:"Variante",
        origem:"Terra",
        raridade:"Incomum",
        sorteavel:true,
        bonusAfinidade:20,

        vantagens:[
            "Terra"
        ],

        bonusVantagem:30
    },


    // =====================================
    // ELEMENTOS COMPOSTOS
    // Inspirados em liberações avançadas
    // =====================================


    {
        nome:"Metal",
        categoria:"Variante",
        origem:"Terra",
        raridade:"Raro",
        sorteavel:true,
        bonusAfinidade:20,

        vantagens:[
            "Terra",
            "Planta"
        ],

        bonusVantagem:30
    },


    {
        nome:"Cristal",
        categoria:"Variante",
        origem:"Terra",
        raridade:"Raro",
        sorteavel:true,
        bonusAfinidade:20,

        vantagens:[
            "Raio",
            "Água"
        ],

        bonusVantagem:30
    },


    {
        nome:"Areia",
        categoria:"Variante",
        origem:"Terra",
        raridade:"Raro",
        sorteavel:true,
        bonusAfinidade:20,

        vantagens:[
            "Água"
        ],

        bonusVantagem:30
    },


    {
        nome:"Fumaça",
        categoria:"Variante",
        origem:"Fogo + Vento",
        raridade:"Raro",
        sorteavel:true,
        bonusAfinidade:20,

        vantagens:[
            "Planta"
        ],

        bonusVantagem:30
    },


    {
        nome:"Madeira",
        categoria:"Variante",
        origem:"Água + Terra",
        raridade:"Muito Raro",
        sorteavel:true,
        bonusAfinidade:20,

        vantagens:[
            "Terra",
            "Água"
        ],

        bonusVantagem:30
    },



    {
        nome:"Lava",
        categoria:"Variante",
        origem:"Fogo + Terra",
        raridade:"Muito Raro",
        sorteavel:true,
        bonusAfinidade:20,

        vantagens:[
            "Gelo",
            "Planta",
            "Metal"
        ],

        bonusVantagem:30
    },


    {
        nome:"Tempestade",
        categoria:"Variante",
        origem:"Água + Vento + Raio",
        raridade:"Muito Raro",
        sorteavel:true,
        bonusAfinidade:20,

        vantagens:[
            "Fogo",
            "Terra"
        ],

        bonusVantagem:30
    },



    // =====================================
    // ELEMENTOS PRIMORDIAIS
    // =====================================


    {
        nome:"Luz",
        categoria:"Primordial",
        origem:"Próprio",
        raridade:"Lendário",
        sorteavel:false,
        bonusAfinidade:20,

        vantagens:[
            "Escuridão"
        ],

        bonusVantagem:75
    },


    {
        nome:"Escuridão",
        categoria:"Primordial",
        origem:"Próprio",
        raridade:"Lendário",
        sorteavel:false,
        bonusAfinidade:20,

        vantagens:[
            "Fogo",
            "Água",
            "Terra",
            "Vento",
            "Gelo",
            "Planta"
        ],

        bonusVantagem:30
    }


];


module.exports = elementos;