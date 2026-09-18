import { register } from 'node:module';
register('./hooks.mjs', import.meta.url);

process.env.PORT = '4123';
process.env.JWT_SECRET = 'teste';

await import('../src/index.js');
await new Promise((r) => setTimeout(r, 400));

const BASE = 'http://localhost:4123/api';
let passed = 0;
let failed = 0;

async function call(method, path, { body, token } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = res.status === 204 ? null : await res.json().catch(() => null);
  return { status: res.status, data };
}

function check(label, condition, extra) {
  if (condition) {
    passed++;
    console.log(`  ok   ${label}`);
  } else {
    failed++;
    console.log(`  FAIL ${label}`, extra ? JSON.stringify(extra).slice(0, 300) : '');
  }
}

console.log('\n--- basico ---');
let r = await call('GET', '/health');
check('GET /health responde 200', r.status === 200 && r.data.ok, r.data);

r = await call('GET', '/rota-que-nao-existe');
check('rota inexistente devolve 404 json', r.status === 404 && r.data.error, r.data);

console.log('\n--- auth ---');
r = await call('POST', '/auth/register', { body: { name: 'A', email: 'nao-email', password: '123' } });
check('cadastro invalido devolve 400 com detalhes', r.status === 400 && r.data.details?.length === 3, r.data);

r = await call('POST', '/auth/register', {
  body: { name: 'Leticia', email: 'Leticia@Teste.com', password: 'senha123' },
});
check('cadastro valido devolve 201 + token', r.status === 201 && !!r.data.token, r.data);
check('e-mail e normalizado em minusculas', r.data?.user?.email === 'leticia@teste.com', r.data);
check('hash da senha nao vaza na resposta', !JSON.stringify(r.data).includes('passwordHash'), r.data);
const token = r.data.token;

r = await call('POST', '/auth/register', {
  body: { name: 'Outra', email: 'leticia@teste.com', password: 'senha123' },
});
check('e-mail duplicado devolve 409', r.status === 409, r.data);

r = await call('POST', '/auth/login', { body: { email: 'leticia@teste.com', password: 'errada' } });
check('senha errada devolve 401', r.status === 401, r.data);

r = await call('POST', '/auth/login', { body: { email: 'leticia@teste.com', password: 'senha123' } });
check('login correto devolve 200 + token', r.status === 200 && !!r.data.token, r.data);

r = await call('GET', '/auth/me');
check('rota protegida sem token devolve 401', r.status === 401, r.data);

r = await call('GET', '/auth/me', { token });
check('GET /auth/me com token devolve o usuario', r.data?.user?.email === 'leticia@teste.com', r.data);

console.log('\n--- eventos ---');
r = await call('POST', '/events', { token, body: { name: 'X', type: 'inexistente', date: '2026-01-01' } });
check('tipo de evento invalido devolve 400', r.status === 400, r.data);

r = await call('POST', '/events', {
  token,
  body: { name: 'Formatura Enfermagem', type: 'formatura', date: '2026-12-10', city: 'Rio' },
});
check('criar evento devolve 201', r.status === 201, r.data);
check('evento ganha publicCode', !!r.data?.event?.publicCode, r.data);
check(
  'formatura vem com features certas',
  r.data?.event?.features?.includes('mesas') && !r.data?.event?.features?.includes('presentes'),
  r.data?.event?.features
);
const eventId = r.data.event.id;

r = await call('GET', '/events', { token });
check('listar eventos devolve o criado', r.data?.events?.length === 1, r.data);

r = await call('GET', `/events/${eventId}`, { token });
check('detalhe do evento traz summary', !!r.data?.summary?.guests, r.data);

r = await call('PATCH', `/events/${eventId}`, { token, body: { name: 'Formatura 2026' } });
check('patch parcial troca o nome', r.data?.event?.name === 'Formatura 2026', r.data?.event);
check('patch parcial nao apaga a cidade', r.data?.event?.city === 'Rio', r.data?.event);
check('patch parcial nao apaga o horario', r.data?.event?.time === '19:00', r.data?.event);

r = await call('PATCH', `/events/${eventId}`, { token, body: { isPublished: true } });
check('publicar o evento funciona', r.data?.event?.isPublished === true, r.data?.event);
const publicCode = r.data.event.publicCode;

r = await call('GET', `/public/events/${publicCode}`);
check('pagina publica abre depois de publicado', r.status === 200, r.data);
check('pagina publica nao lista convidados', !JSON.stringify(r.data).includes('inviteToken'), r.data);

console.log('\n--- isolamento entre usuarios ---');
r = await call('POST', '/auth/register', {
  body: { name: 'Intruso', email: 'intruso@teste.com', password: 'senha123' },
});
const tokenIntruso = r.data.token;

r = await call('GET', `/events/${eventId}`, { token: tokenIntruso });
check('outro usuario nao acessa o evento (403)', r.status === 403, r.data);

r = await call('DELETE', `/events/${eventId}`, { token: tokenIntruso });
check('outro usuario nao apaga o evento (403)', r.status === 403, r.data);

console.log('\n--- convidados ---');
r = await call('POST', `/events/${eventId}/guests`, { token, body: { name: 'Ana Paula' } });
check('criar convidado devolve 201', r.status === 201, r.data);
check('convidado ganha inviteToken', !!r.data?.guest?.inviteToken, r.data);
const inviteToken = r.data.guest.inviteToken;
const guestId = r.data.guest.id;

r = await call('POST', `/events/${eventId}/guests/import`, {
  token,
  body: { guests: [{ name: 'Bruno' }, { name: 'Carla' }, { name: 'ana paula' }] },
});
check('import cria 2 e pula o repetido', r.data?.createdCount === 2 && r.data?.skipped?.length === 1, r.data);

r = await call('GET', `/events/${eventId}/guests`, { token });
check('listar convidados traz 3', r.data?.guests?.length === 3, r.data?.stats);

r = await call('POST', `/events/${eventId}/guests/${guestId}/checkin`, { token });
check('check-in marca presenca', r.data?.guest?.checkedIn === true, r.data);

console.log('\n--- convite publico e rsvp ---');
r = await call('GET', `/public/invite/${inviteToken}`);
check('convidado abre o convite sem login', r.status === 200 && r.data?.guest?.name === 'Ana Paula', r.data);
check('convite nao expoe outros convidados', !JSON.stringify(r.data).includes('Bruno'), r.data);

r = await call('POST', `/public/invite/${inviteToken}/rsvp`, {
  body: { rsvp: 'confirmed', plusOne: true, plusOneName: 'Carlos', companions: 1 },
});
check('rsvp confirma presenca', r.data?.guest?.rsvp === 'confirmed', r.data);

r = await call('GET', `/events/${eventId}/guests`, { token });
check('headcount soma acompanhantes (1+1+1=3)', r.data?.stats?.headcount === 3, r.data?.stats);

r = await call('POST', `/public/invite/${inviteToken}/rsvp`, { body: { rsvp: 'talvez' } });
check('rsvp com valor invalido devolve 400', r.status === 400, r.data);

r = await call('GET', '/public/invite/token-que-nao-existe');
check('convite inexistente devolve 404', r.status === 404, r.data);

console.log('\n--- presentes ---');
r = await call('POST', `/events/${eventId}/gifts`, {
  token,
  body: { name: 'Jogo de panelas', options: [{ store: 'Loja A', price: 899.9 }] },
});
check('criar presente devolve 201', r.status === 201, r.data);
const giftId = r.data.gift.id;

r = await call('POST', `/public/gifts/${giftId}/reserve`, { body: { inviteToken } });
check('convidado reserva o presente', r.status === 200 && r.data?.gift?.taken === true, r.data);

r = await call('POST', `/public/gifts/${giftId}/reserve`, { body: { name: 'Outra pessoa' } });
check('segunda reserva do mesmo presente devolve 409', r.status === 409, r.data);

r = await call('POST', `/events/${eventId}/gifts`, { token, body: { name: 'Liquidificador' } });
const gift2 = r.data.gift.id;
r = await call('POST', `/public/gifts/${gift2}/reserve`, { body: {} });
check('reservar sem nome nem convite devolve 400', r.status === 400, r.data);

r = await call('GET', `/events/${eventId}/gifts`, { token });
check('presente criado com opcao guarda a opcao', r.data?.gifts?.[0]?.options?.length === 1, r.data?.gifts?.[0]);

console.log('\n--- marketplace ---');
r = await call('POST', '/vendors', {
  token: tokenIntruso,
  body: { businessName: 'Doce Encanto Confeitaria', category: 'doces', city: 'Rio de Janeiro' },
});
check('criar perfil de fornecedor devolve 201', r.status === 201, r.data);
check('slug e gerado sem acento', r.data?.vendor?.slug === 'doce-encanto-confeitaria', r.data?.vendor);
const vendorSlug = r.data.vendor.slug;

r = await call('POST', '/vendors', {
  token: tokenIntruso,
  body: { businessName: 'Outra', category: 'doces', city: 'Rio' },
});
check('segundo perfil para o mesmo usuario devolve 409', r.status === 409, r.data);

r = await call('POST', '/vendors', { token, body: { businessName: 'X', category: 'nao-existe', city: 'Rio' } });
check('categoria invalida devolve 400', r.status === 400, r.data);

r = await call('GET', '/vendors?category=doces');
check('busca por categoria acha o fornecedor', r.data?.vendors?.length === 1, r.data);

r = await call('GET', '/vendors?category=buffet');
check('busca por categoria errada volta vazia', r.data?.vendors?.length === 0, r.data);

r = await call('GET', `/vendors/${vendorSlug}`);
check('perfil publico abre pelo slug', r.status === 200, r.data);

r = await call('GET', '/vendors/me', { token: tokenIntruso });
check('fornecedor ve o proprio perfil', r.status === 200, r.data);

r = await call('GET', '/vendors/me', { token });
check('quem nao e fornecedor recebe 404 em /vendors/me', r.status === 404, r.data);

r = await call('POST', `/vendors/${vendorSlug}/quotes`, {
  body: { name: 'Maria', email: 'maria@teste.com', message: 'Quero orcamento para 100 pessoas' },
});
check('pedir orcamento sem login funciona', r.status === 201, r.data);

r = await call('GET', '/vendors/me/quotes', { token: tokenIntruso });
check('fornecedor ve o orcamento recebido', r.data?.quotes?.length === 1, r.data);

r = await call('POST', `/vendors/${vendorSlug}/reviews`, { token: tokenIntruso, body: { rating: 5 } });
check('fornecedor nao avalia a si mesmo (403)', r.status === 403, r.data);

r = await call('POST', `/vendors/${vendorSlug}/reviews`, { token, body: { rating: 4, comment: 'Otimo' } });
check('avaliacao atualiza a media', r.data?.vendor?.ratingAvg === 4 && r.data?.vendor?.reviewCount === 1, r.data);

r = await call('POST', `/vendors/${vendorSlug}/reviews`, { token, body: { rating: 9 } });
check('nota fora de 1-5 devolve 400', r.status === 400, r.data);

console.log(`\n=== ${passed} passaram, ${failed} falharam ===\n`);
process.exit(failed ? 1 : 0);
