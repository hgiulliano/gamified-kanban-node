import test from 'node:test';
import assert from 'node:assert/strict';
import { pool, startServer } from '../server.js';

let server;
let baseUrl;
let userId;
const username = `test_${Date.now()}`;

const api = async (path, options = {}) => {
  const res = await fetch(`${baseUrl}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await res.json();
  return { status: res.status, data };
};

test('API: XP pago uma única vez e level up com sobra', async (t) => {
  server = startServer(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;

  t.after(async () => {
    if (userId) {
      await pool.query('DELETE FROM tasks WHERE user_id = $1', [userId]);
      await pool.query('DELETE FROM users WHERE id = $1', [userId]);
    }
    await new Promise((resolve) => server.close(resolve));
    await pool.end();
  });

  await t.test('cria usuário', async () => {
    const { status, data } = await api('/users', {
      method: 'POST',
      body: { username },
    });
    assert.equal(status, 201);
    assert.equal(data.username, username);
    assert.equal(data.level, 1);
    assert.equal(data.current_xp, 0);
    userId = data.id;
  });

  await t.test('GET /users lista usuário sem tasks', async () => {
    // Regressão: antes a sidebar derivava usuários das tasks e um usuário
    // recém-criado desaparecia ao recarregar.
    const { status, data } = await api('/users');
    assert.equal(status, 200);
    assert.ok(data.some((u) => u.id === userId));
  });

  await t.test('primeira conclusão paga 50 XP', async () => {
    const created = await api('/tasks', {
      method: 'POST',
      body: { title: `Task XP ${Date.now()}`, user_id: userId },
    });
    assert.equal(created.status, 201);

    const moved = await api(`/tasks/${created.data.id}/status`, {
      method: 'PATCH',
      body: { status: 'READY' },
    });

    assert.equal(moved.status, 200);
    assert.equal(moved.data.xp_gained, 50);
    assert.equal(moved.data.task.xp_awarded, true);
    assert.equal(moved.data.new_xp, 50);
    assert.equal(moved.data.level_up, false);

    // READY → REVIEW → READY não pode pagar de novo
    await api(`/tasks/${created.data.id}/status`, {
      method: 'PATCH',
      body: { status: 'REVIEW' },
    });
    const again = await api(`/tasks/${created.data.id}/status`, {
      method: 'PATCH',
      body: { status: 'READY' },
    });

    assert.equal(again.data.xp_gained, 0);
    assert.equal(again.data.new_xp, null);
  });

  await t.test('100 XP sobe de nível e o XP restante continua', async () => {
    const created = await api('/tasks', {
      method: 'POST',
      body: { title: `Task level ${Date.now()}`, user_id: userId },
    });

    const moved = await api(`/tasks/${created.data.id}/status`, {
      method: 'PATCH',
      body: { status: 'READY' },
    });

    assert.equal(moved.data.xp_gained, 50);
    assert.equal(moved.data.level_up, true);
    assert.equal(moved.data.new_level, 2);
    assert.equal(moved.data.new_xp, 0);

    const user = await api(`/users/${userId}`);
    assert.equal(user.data.level, 2);
    assert.equal(user.data.current_xp, 0);
  });
});
