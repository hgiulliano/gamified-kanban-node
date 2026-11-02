// ============================================
// KANBAN LAYOUT — Layout principal com sidebar de usuário
// ============================================

import { useState } from 'react'
import { useKanban } from '../context/KanbanContext'
import Board from './Board'
import UserProfile from './UserProfile'
import TaskForm from './TaskForm'
import UserSelect from './UserSelect'
import { createUser, getUser } from '../services/api'

function KanbanLayout() {
  const { users, addUser, loading: usersLoading } = useKanban()
  const [showProfile, setShowProfile] = useState(false)
  const [showUserForm, setShowUserForm] = useState(false)
  const [newUsername, setNewUsername] = useState('')
  const [userFormError, setUserFormError] = useState('')

  const handleCreateUser = async (e) => {
    e.preventDefault()
    const username = newUsername.trim()
    if (!username) return
    if (username.length < 3 || username.length > 30) {
      setUserFormError('Username deve ter entre 3 e 30 caracteres')
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
          {users.length === 0 ? (
            <div className="sidebar-empty">
              <p>Nenhum usuário cadastrado</p>
              <button className="btn btn-primary btn-sm" onClick={() => setShowUserForm(true)}>
                Criar Primeiro Usuário
              </button>
            </div>
          ) : (
            <>
              <UserProfile users={users} />
              <div className="sidebar-divider" />
              <form onSubmit={handleCreateUser} className="user-form">
                <h3 className="form-section-title">Novo Usuário</h3>
                <div className="form-field">
                  <label htmlFor="new-username" className="visually-hidden">Username</label>
                  <input
                    id="new-username"
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="username"
                    maxLength={30}
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
            </>
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
          </div>
          <div className="header-right">
            <TaskForm users={users} />
          </div>
        </header>
        <Board />
      </main>
    </div>
  )
}

export default KanbanLayout