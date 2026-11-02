import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { formatRelativeDate } from './date'

describe('formatRelativeDate', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-15T12:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  const ago = (ms) => new Date(Date.now() - ms).toISOString()

  it('mostra "Agora" para data no futuro (relógio adiantado)', () => {
    expect(formatRelativeDate(ago(-60_000))).toBe('Agora')
  })

  it('mostra "Agora" para menos de 1 minuto', () => {
    expect(formatRelativeDate(ago(30_000))).toBe('Agora')
  })

  it('mostra minutos', () => {
    expect(formatRelativeDate(ago(5 * 60_000))).toBe('5min atrás')
  })

  it('mostra horas', () => {
    expect(formatRelativeDate(ago(3 * 3_600_000))).toBe('3h atrás')
  })

  it('mostra "Ontem" com 1 dia', () => {
    expect(formatRelativeDate(ago(25 * 3_600_000))).toBe('Ontem')
  })

  it('mostra dias até 1 semana', () => {
    expect(formatRelativeDate(ago(3 * 86_400_000))).toBe('3d atrás')
  })

  it('mostra semanas até 30 dias', () => {
    expect(formatRelativeDate(ago(10 * 86_400_000))).toBe('1sem atrás')
  })

  it('mostra data curta depois de 30 dias', () => {
    expect(formatRelativeDate(ago(60 * 86_400_000))).toMatch(/^\d{2}\/\d{2}$/)
  })
})
