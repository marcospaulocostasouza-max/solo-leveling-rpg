"use strict";
const {templates,renderers}=require("../presentation");
function renderAdmin(result){return renderers.whatsapp.render(templates.adminResult(result));}
module.exports={renderAdmin};
