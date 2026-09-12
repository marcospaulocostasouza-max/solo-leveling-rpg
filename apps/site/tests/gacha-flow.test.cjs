// DOM integration tests: no browser automation, real accounts, payments or database writes.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { JSDOM } = require('jsdom');
const rootDir = path.resolve(__dirname, '..');

function loader(overrides = {}) {
  const loaded = new Map();
  function load(file) {
    if (loaded.has(file)) return loaded.get(file).exports;
    const module = { exports: {} }; loaded.set(file, module);
    const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: {
      module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020, esModuleInterop: true,
    }}).outputText;
    const localRequire = name => {
      if (Object.hasOwn(overrides, name)) return overrides[name];
      if (name === 'server-only') return {};
      if (name.startsWith('@/') || name.startsWith('.')) {
        const base = name.startsWith('@/') ? path.join(rootDir, name.slice(2)) : path.resolve(path.dirname(file), name);
        const resolved = ['.tsx', '.ts', '.js'].map(ext => base + ext).find(candidate => fs.existsSync(candidate));
        if (resolved) return load(resolved);
      }
      return require(name);
    };
    vm.runInThisContext(`(function(require,module,exports){${source}\n})`, { filename: file })(localRequire, module, module.exports);
    return module.exports;
  }
  return load;
}

test('selection → single/ten pull → actual overlay lifecycle; duplicate clicks, cache and errors', async () => {
  const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', { url: 'http://localhost/gacha', pretendToBeVisual: true });
  global.window = dom.window; global.document = dom.window.document; global.HTMLElement = dom.window.HTMLElement;
  global.IS_REACT_ACT_ENVIRONMENT = true;
  const { createRoot } = require('react-dom/client');
  const { act } = React;
  const Hub = loader()(path.join(rootDir, 'components/GachaHub.tsx')).default;
  const banner = { id: 1, nome: 'Banner de teste', descricao: 'Fenda', imagem: '/api/gacha/banners/1/image?v=1', status: 'permanent', permanente: true };
  const detail = { selected: banner, pool: [], wallet: { cristais: 10000, fragmentos_invocacao: 0 }, pity: 0, history: [
    {id:1,reward_type:'XP',nome:'XP',quantidade:'200'},
    {id:2,reward_type:'MAESTRIA',nome:'MAESTRIA',quantidade:'25'},
    {id:3,reward_type:'WON',nome:'WON',quantidade:'20000'},
  ], guaranteeSet: true };
  const calls = []; let resolvePull; let refreshes = 0;
  const originalFetch = global.fetch;
  global.fetch = async (url, options) => {
    calls.push({ url, options });
    if (options?.method === 'POST') return new Promise(resolve => { resolvePull = resolve; });
    return Response.json(url.includes('bannerId') ? detail : { banners: [banner] });
  };
  const root = createRoot(document.getElementById('root'));
  const click = async button => { assert.ok(button, 'button exists'); await act(async () => button.click()); };
  const button = label => [...document.querySelectorAll('button')].find(b => b.textContent.includes(label));
  const wait = async (ms = 25) => { await act(async () => { await new Promise(resolve => setTimeout(resolve, ms)); }); };
  const result = count => ({ sucesso: true, operacaoId: calls.length, banner, quantidade: count, saldoAtual: 9000, pityDepois: count,
    resultados: Array.from({ length: count }, () => ({ tipo: 'XP', nome: 'XP', quantidade: 200, estrelas: 3 })) });
  try {
    await act(async () => root.render(React.createElement(React.StrictMode, null, React.createElement(Hub, { onRefresh: async () => { refreshes++; } }))));
    assert.equal(calls.length, 1, 'StrictMode deduplicates metadata GET');
    assert.match(document.querySelector('.gacha-preview img').getAttribute('src'), /width=640/);
    await act(async () => document.querySelector('.gacha-preview img').dispatchEvent(new window.Event('error')));
    assert.match(document.querySelector('.gacha-preview img').getAttribute('src'), /original=1/);
    await click(button('Explorar banner'));
    assert.equal(calls.length, 2, 'only selected detail fetched');
    assert.match(document.querySelector('.gacha-detail-hero img').getAttribute('src'), /width=1440/);
    await act(async () => document.querySelector('.gacha-detail-hero img').dispatchEvent(new window.Event('error')));
    assert.match(document.querySelector('.gacha-detail-hero img').getAttribute('src'), /original=1/);
    assert.match(document.querySelector('.gacha-history').textContent, /\+200 XP/);
    assert.match(document.querySelector('.gacha-history').textContent, /\+25 de maestria/);
    assert.match(document.querySelector('.gacha-history').textContent, /\+20\.000 won/);
    await click(button('Voltar aos banners')); await click(button('Explorar banner'));
    assert.equal(calls.length, 2, 'back and reopen use cached detail');
    await act(async () => { button('Invocação única').click(); button('Invocação única').click(); });
    assert.equal(calls.filter(x => x.options?.method === 'POST').length, 1);
    await wait();
    assert.ok(document.querySelector('[role=dialog]'), 'rift opens while request is pending');
    await wait(1100);
    assert.equal(document.querySelector('[role=dialog]').dataset.gachaPhase,'riftCharging');
    assert.equal(button('Continuar'),undefined,'no reward or continue before confirmed result');
    await act(async () => resolvePull(Response.json(result(1)))); await wait();
    let overlay = document.querySelector('[role=dialog]');
    assert.ok(overlay); assert.equal(overlay.parentElement, document.body, 'portal mounted at body');
    assert.equal(overlay.dataset.gachaPhase, 'riftCharging');
    assert.equal(refreshes, 0, 'parent refresh waits until Continue');
    await wait(710); assert.equal(overlay.dataset.gachaPhase, 'riftOpening');
    await wait(700); assert.equal(overlay.dataset.gachaPhase, 'rewardEmerging');
    await wait(620); assert.equal(overlay.dataset.gachaPhase, 'revealed');
    assert.match(overlay.textContent, /200/); assert.ok(document.body.classList.contains('gacha-reveal-open'));
    await click(button('Continuar')); assert.equal(document.querySelector('[role=dialog]'), null); assert.equal(refreshes, 1);
    assert.equal(document.querySelector('.gacha-result'),null,'no floating last-reward block');
    assert.ok(!document.body.textContent.includes('Atualizando saldo e histórico'),'refresh is silent');
    await click(button('Invocação ×10'));
    await act(async () => resolvePull(Response.json(result(10)))); await wait();
    await click(button('Pular'));
    assert.equal(document.querySelectorAll('.gacha-reveal-card').length, 10);
    assert.equal(button('Continuar'), undefined);
    await click(button('Revelar tudo')); await click(button('Continuar'));
    assert.equal(refreshes, 2);
    await click(button('Invocação única'));
    await act(async () => resolvePull(Response.json({ error: 'Saldo insuficiente' }, { status: 400 })));
    assert.equal(document.querySelector('[role=dialog]'), null);
    assert.match(document.querySelector('[role=alert]').textContent, /Saldo insuficiente/);
    assert.equal(button('Invocação única').disabled, false);
    await click(button('Invocação única'));
    await act(async () => resolvePull(Response.json({ ...result(1), resultados: [] })));
    assert.equal(document.querySelector('[role=dialog]'), null, 'malformed result never reveals fake prize');
    assert.match(document.querySelector('[role=alert]').textContent, /Resultado incompleto/);
  } finally { await act(async () => root.unmount()); global.fetch = originalFetch; dom.window.close(); }
});

test('public cache omits image payload/player data, selected-only validation, expiry and private balances', async () => {
  let validations = 0, reads = 0, now = Date.now();
  const originalNow = Date.now; Date.now = () => now;
  const banner = { id: 7, nome: 'Teste', descricao: 'Teste', ativo: 1, permanente: 0, inicio_em: new Date(now - 1000).toISOString(), fim_em: new Date(now + 5000).toISOString(), tem_imagem: 1 };
  const db = { all: async () => { reads++; return [banner]; }, get: async (_sql, [id]) => ({ cristais: id * 100, fragmentos_invocacao: 0, rank: 'E' }), consultarPityGacha: async () => 0, getHistoricoBanner: async () => [] };
  const service = { validarBanner: async id => { validations++; assert.equal(id, 7); return { valido: true, banner, pool: [] }; } };
  const api = loader({ './rpg': db, '../../bot/src/systems/gachaBannerService': service })(path.join(rootDir, 'lib/gacha-web.ts'));
  try {
    const [first, second] = await Promise.all([api.getGachaList(), api.getGachaList()]);
    assert.deepEqual(first, second); assert.equal(reads, 1); assert.equal(validations, 0);
    assert.match(first.banners[0].imagem, /^\/api\/gacha/); assert.equal(first.wallet, undefined);
    const a = await api.getGachaState(1, 7), b = await api.getGachaState(2, 7);
    assert.equal(validations, 1); assert.equal(a.wallet.cristais, 100); assert.equal(b.wallet.cristais, 200);
    now += 6000;
    assert.equal((await api.getGachaList()).banners.length, 0, 'expiry respected even while cached');
    await assert.rejects(api.getGachaState(1, 7), error => error.status === 410);
    await assert.rejects(api.getGachaState(1, NaN), error => error.status === 400);
    now += 31000; await api.getGachaList(); assert.equal(reads, 2, 'TTL refreshes admin metadata');
  } finally { Date.now = originalNow; }
});

test('banner art route authenticates, resizes stored art and preserves remote URL', async () => {
  const sharp = require('sharp');
  let player = null, source = '';
  const route = loader({ '@/lib/session': { currentPlayerId: async () => player }, '@/lib/rpg': { get: async () => ({ imagem: source }) } })(path.join(rootDir, 'app/api/gacha/banners/[bannerId]/image/route.ts'));
  const request = new Request('http://localhost/api/gacha/banners/1/image?width=640');
  const context = id => ({ params: Promise.resolve({ bannerId: String(id) }) });
  assert.equal((await route.GET(request, context(1))).status, 401);
  player = 1;
  source = 'data:image/png;base64,' + (await sharp({ create: { width: 1600, height: 900, channels: 3, background: '#221144' } }).png().toBuffer()).toString('base64');
  const response = await route.GET(request, context(1));
  assert.equal(response.status, 200);
  const metadata = await sharp(Buffer.from(await response.arrayBuffer())).metadata();
  assert.equal(metadata.width, 640); assert.equal(metadata.format, 'webp');
  const original = await route.GET(new Request('http://localhost/api/gacha/banners/1/image?original=1'),context(1));
  assert.equal(original.status,200);
  assert.equal(original.headers.get('content-type'),'image/png');
  assert.equal((await sharp(Buffer.from(await original.arrayBuffer())).metadata()).width,1600);
  const fallbackRoute = loader({ '@/lib/session': { currentPlayerId: async () => player }, '@/lib/rpg': { get: async () => ({imagem:source}) },
    sharp: () => {throw new Error('Native image processing unavailable');}
  })(path.join(rootDir,'app/api/gacha/banners/[bannerId]/image/route.ts'));
  const fallback = await fallbackRoute.GET(request,context(1));
  assert.equal(fallback.status,200);
  assert.equal(fallback.headers.get('content-type'),'image/png');
  assert.equal((await sharp(Buffer.from(await fallback.arrayBuffer())).metadata()).width,1600);
  source = 'https://example.com/banner.webp';
  const remote = await route.GET(request, context(2));
  assert.equal(remote.status, 302); assert.equal(remote.headers.get('location'), source);
  assert.equal((await route.GET(request, context('bad'))).status, 400);
});
