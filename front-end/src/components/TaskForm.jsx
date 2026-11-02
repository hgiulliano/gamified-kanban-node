// ============================================
// TASK FORM — Formulário para criar nova task
// ============================================

import { useState } from 'react'
import UserSelect from './UserSelect'

function TaskForm({ users, onSubmit }) {
  const [title, setTitle] = useState('')
  const [userId, setUserId] = useState(users[0]?.id || null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const charCount = title.length
  const isValid = title.trim().length > 0 && title.length <= 255 && userId !== null

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!isValid) {
      setError('Preencha todos os campos')
      return
    }
    try {
      setSubmitting(true)
      setError('')
      await onSubmit(title.trim(), userId)
      setTitle('')
      setUserId(users[0]?.id || null)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="task-form" noValidate>
      <div className="form-row">
        <div className="form-field">
          <label htmlFor="task-title" className="form-label">Nova Task</label>
          <div className="input-wrapper">
            <input
              type="text"
              id="task-title"
              value={title}
              onChange={(e) => { setTitle(e.target.value); setError(''); }}
              placeholder="O que precisa ser feito?"
              maxLength={255}
              disabled={submitting}
              className={`form-input ${charCount > 255 ? 'error' : ''}`}
              aria-describedby={charCount > 0 ? 'char-count' : undefined}
            />
            <span 
              id="char-count" 
              className={`char-count ${charCount > 240 ? 'warning' : ''} ${charCount > 255 ? 'error' : ''}`}
            >
              {charCount}/255
            </span>
          </div>
        </div>

        <div className="form-field">
          <label htmlFor="task-user" className="form-label">Responsável</label>
          <UserSelect
            users={users}
            selectedId={userId}
            onChange={setUserId}
            placeholder="Selecione..."
            className={!userId && users.length > 0 ? 'error' : ''}
          />
        </div>
      </div>

      <div className="form-actions">
        <button
          type="submit"
          disabled={!isValid || submitting || users.length === 0}
          className="btn btn-primary"
          aria-busy={submitting}
        >
          {submitting ? (
            <>
              <span className="btn-spinner" aria-hidden="true" />
              Criando...
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Nova Task
            </>
          )}
        </button>

        {error && <div className="form-error" role="alert">{error}</div>}
        {users.length === 0 && <p className="form-hint">Crie um usuário primeiro</p>}
      </div>
    </form>
  )
}

export default TaskForm