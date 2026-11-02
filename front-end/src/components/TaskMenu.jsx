// ============================================
// TASK MENU — Menu dropdown para editar/excluir task
// ============================================

import { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useKanban } from '../context/KanbanContext'

const STATUSES = [
  { value: 'TODO', label: 'A Fazer' },
  { value: 'DOING', label: 'Fazendo' },
  { value: 'REVIEW', label: 'Revisão' },
  { value: 'READY', label: 'Concluída' },
]

function TaskMenu({ task }) {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(task.title)
  const [editStatus, setEditStatus] = useState(task.status)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const menuRef = useRef(null)
  const panelRef = useRef(null)
  // Posição do painel (fixed). Renderizado em portal para não ser
  // cortado pelo overflow da coluna nem ficar atrás dos outros cards.
  const [pos, setPos] = useState(null)
  const { moveTask, editTask, removeTask } = useKanban()

  const openMenu = () => {
    // Sincroniza o formulário com o estado atual antes de abrir
    setEditTitle(task.title)
    setEditStatus(task.status)
    setOpen((v) => !v)
  }

  const updatePosition = useCallback(() => {
    const el = menuRef.current
    if (!el) return

    const rect = el.getBoundingClientRect()
    const width = Math.min(320, window.innerWidth - 24)
    // Alinha pela direita do botão, mas sem vazar da tela
    const left = Math.max(
      12,
      Math.min(rect.right - width, window.innerWidth - width - 12)
    )
    const top = rect.bottom + 8

    setPos({
      top,
      left,
      width,
      maxHeight: Math.max(180, window.innerHeight - top - 16),
    })
  }, [])

  // Mede a posição antes de pintar e mantém correta em scroll/resize
  useLayoutEffect(() => {
    if (!open) return

    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)

    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [open, updatePosition])

  // Fecha menu ao clicar fora (trigger ou painel)
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current?.contains(e.target)) return
      if (panelRef.current?.contains(e.target)) return
      setOpen(false)
      setEditing(false)
      setError('')
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Fecha com Esc
  useEffect(() => {
    if (!open) return
    function handleKey(e) {
      if (e.key === 'Escape') {
        setOpen(false)
        setEditing(false)
        setError('')
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open])

  const closeMenu = () => {
    setOpen(false)
    setEditing(false)
    setError('')
  }

  const handleEdit = async (e) => {
    e.preventDefault()
    const title = editTitle.trim()

    if (!title) {
      setError('O título não pode ficar vazio')
      return
    }

    setSaving(true)
    setError('')

    try {
      // 1) Título → PATCH /tasks/:id (persistido no banco)
      if (title !== task.title) {
        await editTask(task.id, { title })
      }
      // 2) Status → PATCH /tasks/:id/status (mantém a lógica de XP)
      if (editStatus !== task.status) {
        await moveTask(task.id, editStatus)
      }
      closeMenu()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm(`Excluir "${task.title}"? Esta ação não pode ser desfeita.`)) return

    setSaving(true)
    setError('')

    try {
      // DELETE /tasks/:id (persistido no banco)
      await removeTask(task.id)
      closeMenu()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleStatusChange = async (newStatus) => {
    if (newStatus === task.status) return
    try {
      await moveTask(task.id, newStatus)
      closeMenu()
    } catch (err) {
      setError(err.message)
    }
  }

  // Botão "⋮" que abre o menu (antes ele simplesmente não existia)
  const trigger = (
    <button
      type="button"
      className="menu-trigger"
      onClick={(e) => {
        e.stopPropagation()
        openMenu()
      }}
      // impede que o clique inicie o drag do card
      onPointerDown={(e) => e.stopPropagation()}
      aria-label="Ações da task"
      aria-expanded={open}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="5" r="1.5" />
        <circle cx="12" cy="12" r="1.5" />
        <circle cx="12" cy="19" r="1.5" />
      </svg>
    </button>
  )

  return (
    <div
      className="task-menu"
      ref={menuRef}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {trigger}

      {open && pos && createPortal(
        <div
          className="menu-panel"
          ref={panelRef}
          role="menu"
          style={{
            top: pos.top,
            left: pos.left,
            width: pos.width,
            maxHeight: pos.maxHeight,
          }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          {!editing ? (
            <>
              <div className="menu-header">
                <span className="menu-title">{task.title}</span>
                <button className="menu-close" onClick={closeMenu} aria-label="Fechar">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="menu-divider" />

              {/* Status rápido */}
              <div className="menu-section">
                <span className="menu-section-label">Mudar Status</span>
                <div className="status-options" role="radiogroup">
                  {STATUSES.map((s) => (
                    <button
                      key={s.value}
                      role="radio"
                      aria-checked={task.status === s.value}
                      onClick={() => handleStatusChange(s.value)}
                      className={`status-option ${task.status === s.value ? 'active' : ''}`}
                      style={{ borderColor: `var(--color-${s.value.toLowerCase()})` }}
                    >
                      <span
                        className="status-dot"
                        style={{ backgroundColor: `var(--color-${s.value.toLowerCase()})` }}
                      />
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="menu-divider" />

              {/* Ações */}
              <button
                className="menu-action"
                onClick={() => {
                  setEditing(true)
                  setError('')
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5a2.121 2.121 0 0 1 3 3z" />
                </svg>
                Editar
              </button>

              <button className="menu-action danger" onClick={handleDelete} disabled={saving}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
                Excluir
              </button>

              {error && <div className="form-error menu-error">{error}</div>}
            </>
          ) : (
            <>
              <div className="menu-header">
                <span className="menu-title">Editar Task</span>
                <button
                  className="menu-close"
                  onClick={() => {
                    setEditing(false)
                    setError('')
                  }}
                  aria-label="Voltar"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleEdit} className="edit-form-content">
                <div className="form-field">
                  <label htmlFor={`edit-title-${task.id}`} className="form-label">Título</label>
                  <input
                    id={`edit-title-${task.id}`}
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    maxLength={255}
                    disabled={saving}
                    className="form-input"
                    autoFocus
                  />
                </div>

                <div className="form-field">
                  <label htmlFor={`edit-status-${task.id}`} className="form-label">Status</label>
                  <select
                    id={`edit-status-${task.id}`}
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    disabled={saving}
                    className="form-select"
                  >
                    {STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>

                {error && <div className="form-error">{error}</div>}

                <div className="form-actions">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      setEditing(false)
                      setError('')
                    }}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
                    {saving ? (
                      <>
                        <span className="btn-spinner" aria-hidden="true" />
                        Salvando...
                      </>
                    ) : (
                      'Salvar'
                    )}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>,
        document.body
      )}
    </div>
  )
}

export default TaskMenu
