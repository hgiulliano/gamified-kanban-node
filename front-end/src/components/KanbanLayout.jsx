// ============================================
// KANBAN LAYOUT — Layout principal com sidebar de usuário
// ============================================

import { useState } from 'react'
import { useKanban } from '../context/KanbanContext'
import Board from './Board'
import UserProfile from './UserProfile'
import TaskForm from './TaskForm'

function KanbanLayout() {
  const { users, addUser, refresh, selectedUser } = useKanban()
  const [showProfile, setShowProfile] = useState(false)
  const [showUserForm, setShowUserForm] = useState(false)
  const [newUsername, setNewUsername] = useState('')
  const [userFormError, setUserFormError] = useState('')

  // O formulário de novo usuário só aparece quando pedido (ou se não há usuários)
  const userFormVisible = showUserForm || users.length === 0

  const handleCreateUser = async (e) => {
    e.preventDefault()
    const username = newUsername.trim()
    if (!username) return
    if (username.length < 3 || username.length > 50) {
      setUserFormError('Username deve ter entre 3 e 50 caracteres')
      return
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      setUserFormError('Apenas letras, números, _ e -')
      return
    }
    try {
      setUserFormError('')
      await addUser(username)
      setNewUsername('')
      setShowUserForm(false)
    } catch (err) {
      setUserFormError(err.message)
    }
  }

  return (
    <div className="kanban-layout">
      {/* Sidebar - Perfil do Usuário */}
      <aside className={`sidebar ${showProfile ? 'open' : ''}`} aria-label="Perfil do usuário">
        <div className="sidebar-header">
          <h2 className="sidebar-title">Sessão do Usuário</h2>
          <button
            className="sidebar-toggle"
            onClick={() => setShowProfile(!showProfile)}
            aria-expanded={showProfile}
            aria-label={showProfile ? 'Fechar perfil' : 'Abrir perfil'}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {showProfile ? (
                <path d="M18 6 6 18M6 6l12 12" />
              ) : (
                <path d="M6 9l6 6 6-6" />
              )}
            </svg>
          </button>
        </div>

        <div className="sidebar-content">
          {users.length > 0 && <UserProfile users={users} />}

          <div className="sidebar-divider" />

          {userFormVisible ? (
            <form onSubmit={handleCreateUser} className="user-form">
              <div className="form-section-header">
                <h3 className="form-section-title">Novo Usuário</h3>
                {users.length > 0 && (
                  <button
                    type="button"
                    className="menu-close"
                    onClick={() => {
                      setShowUserForm(false)
                      setUserFormError('')
                      setNewUsername('')
                    }}
                    aria-label="Cancelar"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 6 6 18M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              <div className="form-field">
                <label htmlFor="new-username" className="visually-hidden">Username</label>
                <input
                  id="new-username"
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="username"
                  maxLength={50}
                  className={`form-input ${userFormError ? 'error' : ''}`}
                  aria-describedby={userFormError ? 'user-error' : undefined}
                  aria-invalid={!!userFormError}
                />
                {userFormError && (
                  <span id="user-error" className="field-error">{userFormError}</span>
                )}
              </div>
              <button type="submit" className="btn btn-primary btn-block btn-sm">
                Criar Usuário
              </button>
            </form>
          ) : (
            <button
              type="button"
              className="btn btn-secondary btn-block btn-sm"
              onClick={() => setShowUserForm(true)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Novo Usuário
            </button>
          )}
        </div>
      </aside>

      {/* Overlay para fechar sidebar no mobile */}
      {showProfile && (
        <div
          className="sidebar-overlay"
          onClick={() => setShowProfile(false)}
          aria-hidden="true"
        />
      )}

      {/* Main Content */}
      <main className="main-content" role="main">
        <header className="main-header">
          <div className="header-left">
            <button
              className="mobile-menu-btn"
              onClick={() => setShowProfile(true)}
              aria-label="Abrir perfil do usuário"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </button>
            <h1 className="app-title">Gamified Kanban</h1>
            {selectedUser && (
              <span className="header-user" title="Tasks visíveis no quadro">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                {selectedUser.username}
              </span>
            )}
          </div>
          <div className="header-right">
            <button className="btn btn-secondary btn-sm" onClick={refresh} type="button">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M21 12a9 9 0 1 1-3-6.7" />
                <path d="M21 3v6h-6" />
              </svg>
              Atualizar
            </button>
          </div>
        </header>

        {/* Formulário de criação fica acima do quadro, fora do header sticky */}
        <div className="board-toolbar">
          <TaskForm />
        </div>

        <Board />
      </main>
    </div>
  )
}

export default KanbanLayout