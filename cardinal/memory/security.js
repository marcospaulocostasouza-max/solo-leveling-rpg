"use strict";
const SECRET_KEY=/token|password|senha|secret|api[_-]?key|authorization|cookie|credential/i;
const SECRET_VALUE=/(?:bearer\s+[a-z0-9._-]+|postgres(?:ql)?:\/\/[^\s:@]+:[^\s@]+@|(?:api[_-]?key|token|password|senha)\s*[:=]\s*[^\s,;]+)/gi;
function redact(value,key=""){if(SECRET_KEY.test(key))return"[REDACTED]";if(typeof value==="string")return value.replace(SECRET_VALUE,"[REDACTED]");if(Array.isArray(value))return value.map(v=>redact(v));if(value&&typeof value==="object")return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,redact(v,k)]));return value;}
function safeContent(value){return String(redact(String(value??""))).replace(/<think>[\s\S]*?<\/think>/gi,"").slice(0,12000).trim();}
module.exports={redact,safeContent,SECRET_KEY};
