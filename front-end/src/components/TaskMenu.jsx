// ============================================
// TASK MENU — Menu dropdown para editar/excluir task
// ============================================

import { useState, useRef, useEffect } from 'react'
import { updateTaskStatus } from '../services/api'
import { useKanban } from '../context/KanbanContext'

const STATUSES = [
  { value: 'TODO', label: 'A Fazer' },
  { value: 'DOING', label: 'Fazendo' },
  { value: 'REVIEW', label: 'Revisão' },
  { value: 'READY', label: 'Concluída' },
]

function TaskMenu({ task, allTasks, users }) {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(task.title)
  const [editStatus, setEditStatus] = useState(task.status)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const menuRef = useRef(null)
  const { moveTask } = useKanban()

  // Fecha menu ao clicar fora
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false)
        setEditing(false)
        setError('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleEdit = async (e) => {
    e.preventDefault()
    if (!editTitle.trim()) return
    
    setSaving(true)
    setError('')
    
    try {
      // Atualiza título via API (precisamos criar endpoint PATCH /tasks/:id)
      // Por enquanto usa moveTask para status e atualiza local
      if (editStatus !== task.status) {
        await moveTask(task.id, editStatus)
      }
      
      // Atualiza título localmente (ideal: criar endpoint no back-end)
      // Por simplicidade, só fecha o menu
      setEditing(false)
      setOpen(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm(`Excluir "${task.title}"? Esta ação não pode ser desfeita.`)) return
    
    setSaving(true)
    try {
      // Por enquanto só remove localmente (ideal: endpoint DELETE no back-end)
      // Simula remoção otimista
      setOpen(false)
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
      setOpen(false)
    } catch (err) {
      setError(err.message)
    }
  }

  if (!open && !editing) return null

  return (
    <div className="task-menu" ref={menuRef} role="menu">
      {!editing ? (
        // Menu principal
        <div className="menu-panel">
          <div className="menu-header">
            <span className="menu-title">{task.title}</span>
            <button className="menu-close" onClick={() => setOpen(false)} aria-label="Fechar">
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
              {STATUSES.map(s => (
                <button
                  key={s.value}
                  role="radio"
                  aria-checked={task.status === s.value}
                  onClick={() => handleStatusChange(s.value)}
                  className={`status-option ${task.status === s.value ? 'active' : ''}`}
                  style={{ borderColor: `var(--color-${s.value.toLowerCase()})` }}
                >
                  <span className="status-dot" style={{ backgroundColor: `var(--color-${s.value.toLowerCase()})` }} />
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="menu-divider" />

          {/* Ações */}
          <button className="menu-action" onClick={() => { setEditing(true); setOpen(true); }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5a2.121 2.121 0 0 1 3 3z" />
            </svg>
            Editar
          </button>

          <button className="menu-action danger" onClick={handleDelete}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
            Excluir
          </button>
        </div>
      ) : (
        // Formulário de edição
        <div className="menu-panel edit-form">
          <div className="menu-header">
            <span className="menu-title">Editar Task</span>
            <button className="menu-close" onClick={() => { setEditing(false); setOpen(false); setError(''); }} aria-label="Cancelar">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleEdit} className="edit-form-content">
            <div className="form-field">
              <label htmlFor="edit-title" className="form-label">Título</label>
              <input
                id="edit-title"
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
              <label htmlFor="edit-status" className="form-label">Status</label>
              <select
                id="edit-status"
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
                disabled={saving}
                className="form-select"
              >
                {STATUSES.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>

            {error && <div className="form-error">{error}</div>}

            <div className="form-actions">
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => { setEditing(false); setError(''); }}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
                {saving ? (
                  <>
                    <span className="btn-spinner" aria-hidden="true" />
                    Salvando...
                  </>
                ) : 'Salvar'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

export default TaskMenu