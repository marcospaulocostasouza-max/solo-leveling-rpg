"use strict";
const path=require("path");
function bool(name,fallback){return process.env[name]==null?fallback:process.env[name]==="true";}
function positive(name,fallback){const value=Number(process.env[name]);return Number.isFinite(value)&&value>0?value:fallback;}
function loadMemoryConfig(options={}){const root=path.resolve(options.root||process.cwd());return{enabled:options.enabled??bool("CARDINAL_MEMORY_ENABLED",true),dbPath:options.dbPath||path.join(root,"cardinal/cache/memory.db"),auditPath:options.auditPath||path.join(root,"cardinal/logs/memory-audit.jsonl"),rawRetentionDays:options.rawRetentionDays||positive("CARDINAL_MEMORY_RAW_RETENTION_DAYS",14),sessionTtlMs:options.sessionTtlMs||positive("CARDINAL_MEMORY_SESSION_TTL",86400000),autoSaveDecisions:options.autoSaveDecisions??bool("CARDINAL_MEMORY_AUTO_SAVE_DECISIONS",true),maxContextItems:options.maxContextItems||positive("CARDINAL_MEMORY_MAX_CONTEXT_ITEMS",8),maxContextChars:options.maxContextChars||12000,summarizationEnabled:options.summarizationEnabled??bool("CARDINAL_MEMORY_SUMMARIZATION_ENABLED",true)};}
module.exports={loadMemoryConfig};
