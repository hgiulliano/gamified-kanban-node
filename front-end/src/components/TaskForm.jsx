// ============================================
// TASK FORM — Formulário para criar nova task
// ============================================

import { useState } from 'react'
import UserSelect from './UserSelect'

function TaskForm({ onSubmit, users }) {
  // Estado local do formulário
  const [title, setTitle] = useState('')
  const [userId, setUserId] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  // Validação em tempo real
  const titleError = title.length > 0 && title.length > 255 
    ? 'Máximo 255 caracteres' 
    : null
  
  const userError = !userId && users.length > 0 
    ? 'Selecione um usuário' 
    : null

  const isValid = title.trim().length > 0 && title.length <= 255 && userId !== null

  // Handler de submit
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!isValid) {
      setError('Preencha todos os campos corretamente')
      return
    }

    try {
      setSubmitting(true)
      setError(null)
      await onSubmit(title.trim(), userId)
      
      // Limpa formulário após sucesso
      setTitle('')
      setUserId(null)
    } catch (err) {
      // Erro já vem da API via contexto
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  // Contador de caracteres
  const charCount = title.length

  return (
    <form onSubmit={handleSubmit} className="task-form" noValidate>
      <div className="form-row">
        {/* Input do título */}
        <div className="form-field">
          <label htmlFor="task-title" className="form-label">
            Nova Task
          </label>
          <div className="input-wrapper">
            <input
              type="text"
              id="task-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="O que precisa ser feito?"
              maxLength={255}
              disabled={submitting}
              className={`form-input ${titleError ? 'error' : ''} ${!title && error ? 'error' : ''}`}
              aria-describedby={titleError ? 'title-error' : charCount > 0 ? 'title-count' : undefined}
              aria-invalid={!!titleError || (!title && error)}
            />
            {/* Contador de caracteres */}
            <span 
              id="title-count" 
              className={`char-count ${titleError ? 'error' : ''}`}
              aria-live="polite"
            >
              {charCount}/255
            </span>
            {titleError && (
              <span id="title-error" className="field-error" role="alert">
                {titleError}
              </span>
            )}
          </div>
        </div>

        {/* Dropdown de usuário */}
        <div className="form-field">
          <label htmlFor="task-user" className="form-label">
            Responsável
          </label>
          <UserSelect
            users={users}
            selectedId={userId}
            onChange={setUserId}
            placeholder="Quem fará esta task?"
            required
            className={userError ? 'error' : ''}
          />
          {userError && (
            <span className="field-error" role="alert">
              {userError}
            </span>
          )}
        </div>
      </div>

      {/* Botão de submit + erro global */}
      <div className="form-actions">
        <button
          type="submit"
          disabled={!isValid || submitting || users.length === 0}
          className="btn btn-primary"
          aria-busy={submitting}
        >
          {submitting ? (
            <>
              <span className="btn-spinner" aria-hidden="true"></span>
              Criando...
            </>
          ) : (
            '➕ Adicionar Task'
          )}
        </button>

        {error && (
          <div className="form-error" role="alert">
            {error}
          </div>
        )}

        {users.length === 0 && (
          <p className="form-hint">
            👆 Cadastre um usuário primeiro para criar tasks
          </p>
        )}
      </div>
    </form>
  )
}

export default TaskForm