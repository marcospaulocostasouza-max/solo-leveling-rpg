"use strict";
const {paginate}=require("./whatsapp"); function render(input){return paginate(input,10000).join("\n\n").replace(/\*/g,"").replace(/^> /gm,"");} module.exports={render};
