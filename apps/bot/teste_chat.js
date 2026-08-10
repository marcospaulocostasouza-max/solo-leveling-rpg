// Teste rápido do /api/chat com think=false
const http = require('http');

const payload = JSON.stringify({
  model: 'qwen3:4b-thinking-2507-q4_K_M',
  messages: [
    {
      role: 'user',
      content: 'Responda em português brasileiro com uma cena curta de RPG entre Ophilia e Irelia. Não controle Irelia. Escreva uma cena narrativa curta.'
    }
  ],
  think: false,
  stream: false,
  options: {
    num_ctx: 4096,
    num_predict: 300
  }
});

const req = http.request({
  hostname: 'localhost',
  port: 11434,
  path: '/api/chat',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload)
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      console.log('=== RESPOSTA /api/chat (think=false) ===');
      console.log('Message role:', json.message?.role);
      console.log('Message content:', json.message?.content);
      console.log('Message thinking:', json.message?.thinking ? 'PRESENTE' : 'ausente');
      console.log('Done:', json.done);
      console.log('Eval count:', json.eval_count);
      console.log('Eval duration ms:', json.eval_duration ? Math.round(json.eval_duration / 1e6) : null);
    } catch (e) {
      console.log('RAW:', data);
    }
  });
});

req.on('error', (e) => {
  console.error('Erro:', e.message);
});

req.write(payload);
req.end();