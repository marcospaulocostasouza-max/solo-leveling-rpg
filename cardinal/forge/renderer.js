"use strict";
const {templates,renderers}=require("../presentation");
function renderValidation(validation){return(validation?.valid?["✓ Estrutura aprovada"]:["× Estrutura inválida"]).concat((validation?.errors||[]).map(e=>`× ${e.message||e}`),(validation?.warnings||[]).map(e=>`! ${e.message||e}`)).join("\n");}
function renderDraft(draft){return renderers.whatsapp.render(templates.forgeResult(draft));}
module.exports={renderValidation,renderDraft};
