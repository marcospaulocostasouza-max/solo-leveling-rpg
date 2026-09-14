const formatter=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'});
function start(date=new Date()){
 const parts=Object.fromEntries(formatter.formatToParts(date).map(p=>[p.type,p.value]));
 const monday=new Date(`${parts.year}-${parts.month}-${parts.day}T03:00:00.000Z`);
 monday.setUTCDate(monday.getUTCDate()-(monday.getUTCDay()+6)%7);
 return monday;
}
function next(date=new Date()){return new Date(start(date).getTime()+7*24*3600000);}
function key(date=new Date()){return start(date).toISOString().slice(0,10);}
module.exports={start,next,key};
