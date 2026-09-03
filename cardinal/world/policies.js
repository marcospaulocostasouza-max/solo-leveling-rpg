"use strict";
const RISK={READ:"LOW",EVENT_ACTIVATION:"MEDIUM",DUNGEON_SPAWN:"HIGH",NPC_APPEARANCE:"MEDIUM",BANNER_ACTIVATION:"HIGH",TERRITORY_CHANGE:"HIGH",WORLD_RESET:"CRITICAL"};
function validate(action,input={}){const issues=[];if(action==="TERRITORY_CHANGE"&&/seoul|seul/i.test(input.location||input.territory||""))issues.push({code:"WORLD_PROTECTED_TERRITORY",severity:"HIGH"});if(input.start_at&&input.end_at&&new Date(input.end_at)<=new Date(input.start_at))issues.push({code:"WORLD_INVALID_PERIOD",severity:"HIGH"});if(action==="WORLD_RESET")issues.push({code:"WORLD_CRITICAL_CONFIRMATION_REQUIRED",severity:"CRITICAL"});return{valid:!issues.length,risk:RISK[action]||"MEDIUM",issues};}
module.exports={RISK,validate};
