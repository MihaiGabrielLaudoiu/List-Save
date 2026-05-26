'use strict';
/**
 * Tests de integración para la API de List & Save.
 * Ejecutar con: node backend/tests/api.test.js
 * Requiere el servidor corriendo en BASE_URL.
 */

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

let passed = 0;
let failed = 0;
let authCookie = '';

function ok(label, condition, detail) {
  if (condition) {
    console.log('  ✓', label);
    passed++;
  } else {
    console.error('  ✗', label, detail ? `(${detail})` : '');
    failed++;
  }
}

async function request(method, path, body, cookie) {
  const headers = { 'Content-Type': 'application/json' };
  if (cookie) headers['Cookie'] = cookie;
  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(BASE_URL + path, opts);
  let json = null;
  try { json = await res.json(); } catch (_) {}
  return { status: res.status, json, headers: res.headers };
}

// ──────────────────────────────────────────────────────────────────────────────
// Helpers de sección
// ──────────────────────────────────────────────────────────────────────────────
async function testHealth() {
  console.log('\n── Health ──────────────────────────────────────────');
  const { status, json } = await request('GET', '/health');
  ok('GET /health → 200', status === 200);
  ok('Respuesta ok', json && (json.status === 'ok' || json.ok === true), JSON.stringify(json));
}

async function testProducts() {
  console.log('\n── Productos ───────────────────────────────────────');

  const { status: s1, json: j1 } = await request('GET', '/api/products/comparator-options');
  ok('GET /api/products/comparator-options → 200', s1 === 200);
  ok('Devuelve items[]', j1 && Array.isArray(j1.items), JSON.stringify(j1));
  ok('Al menos 1 producto', j1 && j1.items && j1.items.length > 0);

  const { status: s2, json: j2 } = await request('GET', '/api/products/sources');
  ok('GET /api/products/sources → 200', s2 === 200);
  ok('Devuelve sources[]', j2 && Array.isArray(j2.sources));

  const { status: s3, json: j3 } = await request('GET', '/api/products/catalog');
  ok('GET /api/products/catalog → 200', s3 === 200, `status=${s3}`);
}

async function testStats() {
  console.log('\n── Estadísticas ────────────────────────────────────');
  const { status, json } = await request('GET', '/api/stats/catalog');
  ok('GET /api/stats/catalog → 200', status === 200, `status=${status}`);
  ok('Devuelve kpis', json && json.kpis !== undefined, JSON.stringify(json));
  ok('kpis.productos >= 0', json && json.kpis && Number(json.kpis.productos) >= 0);
}

async function testAuth() {
  console.log('\n── Auth ────────────────────────────────────────────');

  // Login incorrecto
  const { status: s1, json: j1 } = await request('POST', '/api/auth/login', {
    email: 'inexistente@test.com',
    password: 'wrongpassword'
  });
  ok('POST /api/auth/login credenciales erróneas → 401', s1 === 401, `status=${s1}`);

  // Login correcto (usuario demo)
  const { status: s2, json: j2, headers } = await request('POST', '/api/auth/login', {
    email: 'admin@listandsave.com',
    password: 'Admin1234'
  });
  ok('POST /api/auth/login demo → 200', s2 === 200, `status=${s2} msg=${j2 && j2.message}`);

  if (s2 === 200) {
    const setCookie = headers.get('set-cookie');
    if (setCookie) authCookie = setCookie.split(';')[0];
    ok('Respuesta incluye user', j2 && j2.user !== undefined);
  }

  // Me sin auth
  const { status: s3 } = await request('GET', '/api/auth/me');
  ok('GET /api/auth/me sin cookie → 401', s3 === 401, `status=${s3}`);

  // Me con auth
  if (authCookie) {
    const { status: s4, json: j4 } = await request('GET', '/api/auth/me', null, authCookie);
    ok('GET /api/auth/me con cookie → 200', s4 === 200, `status=${s4}`);
    ok('Devuelve email', j4 && j4.user && j4.user.email !== undefined, JSON.stringify(j4));
  }
}

async function testLists() {
  console.log('\n── Listas ──────────────────────────────────────────');

  // Sin auth
  const { status: s1 } = await request('GET', '/api/lists/mine');
  ok('GET /api/lists/mine sin auth → 401', s1 === 401, `status=${s1}`);

  if (authCookie) {
    const { status: s2, json: j2 } = await request('GET', '/api/lists/mine', null, authCookie);
    ok('GET /api/lists/mine con auth → 200', s2 === 200, `status=${s2}`);
    ok('Devuelve array', j2 && (Array.isArray(j2) || Array.isArray(j2.items) || j2.cabecera !== undefined));
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Main
// ──────────────────────────────────────────────────────────────────────────────
(async () => {
  console.log(`\nList & Save — API Tests`);
  console.log(`Servidor: ${BASE_URL}`);
  console.log('─'.repeat(50));

  try {
    await testHealth();
    await testProducts();
    await testStats();
    await testAuth();
    await testLists();
  } catch (err) {
    console.error('\nError fatal en los tests:', err.message);
    failed++;
  }

  console.log('\n' + '─'.repeat(50));
  console.log(`Resultado: ${passed} pasados, ${failed} fallados`);
  if (failed > 0) {
    console.error('❌ Algunos tests han fallado');
    process.exit(1);
  } else {
    console.log('✅ Todos los tests han pasado');
    process.exit(0);
  }
})();
