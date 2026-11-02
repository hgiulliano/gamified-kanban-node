import test from 'node:test';
import assert from 'node:assert/strict';
import { applyXp, XP_PER_TASK, XP_PER_LEVEL } from '../lib/xp.js';

test('50 XP sem level up mantém o nível', () => {
  const result = applyXp(1, 0, XP_PER_TASK);
  assert.deepEqual(result, { level: 1, currentXp: 50, levelUp: false });
});

test('100 XP sobe um nível e zera o XP', () => {
  const result = applyXp(1, 50, XP_PER_TASK);
  assert.deepEqual(result, { level: 2, currentXp: 0, levelUp: true });
});

test('XP que sobra continua para o próximo nível', () => {
  const result = applyXp(1, 80, XP_PER_TASK);
  assert.deepEqual(result, { level: 2, currentXp: 30, levelUp: true });
});

test('é possível subir mais de um nível de uma vez', () => {
  // 90 + 250 = 340 → 3 níveis e sobram 40
  const result = applyXp(1, 90, 250);
  assert.deepEqual(result, { level: 4, currentXp: 40, levelUp: true });
});

test('cada nível custa exatamente XP_PER_LEVEL', () => {
  const result = applyXp(5, 0, XP_PER_LEVEL);
  assert.equal(result.level, 6);
  assert.equal(result.currentXp, 0);
});
