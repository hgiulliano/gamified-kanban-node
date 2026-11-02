// ============================================
// XP — Regras de recompensa e level up
// ============================================
//
// 1 task concluída (READY) = 50 XP
// 100 XP = 1 nível. O XP que sobra continua valendo para o próximo nível.
//
// Exemplo: nível 3 com 80 XP ganha 50 → 130 XP → nível 4 com 30 XP.

export const XP_PER_TASK = 50;
export const XP_PER_LEVEL = 100;

/**
 * Aplica XP a um usuário e resolve os level ups.
 *
 * @param {number} level      Nível atual
 * @param {number} currentXp  XP atual (0-99)
 * @param {number} gained     XP ganho agora
 * @returns {{ level: number, currentXp: number, levelUp: boolean }}
 */
export function applyXp(level, currentXp, gained) {
  let newLevel = Number(level);
  let newXp = Number(currentXp) + Number(gained);
  let levelUp = false;

  while (newXp >= XP_PER_LEVEL) {
    newXp -= XP_PER_LEVEL;
    newLevel += 1;
    levelUp = true;
  }

  return { level: newLevel, currentXp: newXp, levelUp };
}
