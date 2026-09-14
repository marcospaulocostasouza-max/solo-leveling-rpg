const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path'),vm=require('vm');
const ts=require('typescript');
function load(relative,overrides){const file=path.resolve(__dirname,'..',relative),module={exports:{}};const source=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2020,esModuleInterop:true}}).outputText;vm.runInThisContext(`(function(require,module,exports){${source}\n})`,{filename:file})(name=>Object.hasOwn(overrides,name)?overrides[name]:require(name),module,module.exports);return module.exports;}
test('API usa sessão e aceita apenas código',async()=>{
 let player=null,calls=0,args;
 const route=load('app/api/redeem/route.ts',{'@/lib/session':{currentPlayerId:async()=>player},'../../../../../packages/database/redeem':{getService:()=>({claim:async(...values)=>{calls++;args=values;return {success:true,rewards:[]};}})}});
 const request=body=>new Request('http://localhost/api/redeem',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
 assert.equal((await route.POST(request({code:'SOLO'}))).status,401);
 player=123;
 assert.equal((await route.POST(request({code:'SOLO',playerId:999,rewards:[{amount:999}]}))).status,400);assert.equal(calls,0);
 assert.equal((await route.POST(request({code:'SOLO'}))).status,200);assert.deepEqual(args,[123,'SOLO']);
});
test('formulário em viewport mobile impede duplo envio e mostra quantidades',async()=>{
 const {JSDOM}=require('jsdom'),React=require('react');
 const dom=new JSDOM('<!doctype html><div id="root"></div>',{url:'http://localhost/resgatar-codigo',pretendToBeVisual:true});
 const saved={window:global.window,document:global.document,fetch:global.fetch,act:global.IS_REACT_ACT_ENVIRONMENT};
 global.window=dom.window;global.document=dom.window.document;global.IS_REACT_ACT_ENVIRONMENT=true;Object.defineProperty(dom.window,'innerWidth',{value:375});
 const {createRoot}=require('react-dom/client'),{act}=React;
 const Code=load('components/RedeemCode.tsx',{}).default;
 let resolve,calls=0,payload;
 global.fetch=async(url,options)=>{calls++;payload=JSON.parse(options.body);return new Promise(r=>{resolve=r;});};
 const root=createRoot(document.getElementById('root'));
 try{
  await act(async()=>root.render(React.createElement(Code)));
  const input=document.querySelector('input');
  await act(async()=>{Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set.call(input,'SOLO');input.dispatchEvent(new window.Event('input',{bubbles:true}));});
  const form=document.querySelector('form');await act(async()=>{form.dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true}));form.dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true}));});
  assert.equal(calls,1);assert.deepEqual(payload,{code:'SOLO'});assert.ok(document.querySelector('button').disabled);
  await act(async()=>resolve(Response.json({success:true,message:'Código resgatado com sucesso.',rewards:[{tipo:'XP',nome:'XP',quantidade:500},{tipo:'WON',nome:'WON',quantidade:100000}]})));
  assert.match(document.body.textContent,/500 XP/);assert.match(document.body.textContent,/100\.000 WON/);assert.equal(input.value,'');
  global.fetch=async()=>Response.json({success:false,message:'Você já resgatou este código.'},{status:400});
  await act(async()=>{Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set.call(input,'SOLO');input.dispatchEvent(new window.Event('input',{bubbles:true}));});
  await act(async()=>form.dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true})));
  assert.equal(input.value,'SOLO');assert.match(document.body.textContent,/já resgatou/);
 }finally{await act(async()=>root.unmount());dom.window.close();global.window=saved.window;global.document=saved.document;global.fetch=saved.fetch;global.IS_REACT_ACT_ENVIRONMENT=saved.act;}
});
