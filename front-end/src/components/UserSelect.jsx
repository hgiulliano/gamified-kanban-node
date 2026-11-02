// ============================================
// USER SELECT — Dropdown de usuários
// ============================================

function UserSelect({ users, selectedId, onChange, placeholder = 'Selecione...', className = '' }) {
  if (!users || users.length === 0) {
    return (
      <select disabled className={`user-select ${className}`} aria-label={placeholder}>
        <option value="">Nenhum usuário</option>
      </select>
    )
  }

  return (
    <div className="user-select-wrapper">
      <select
        value={selectedId || ''}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
        className={`user-select ${className}`}
        aria-label={placeholder}
      >
        <option value="" disabled>{placeholder}</option>
        {users.map(user => (
          <option key={user.id} value={user.id}>
            {user.username} (Nv.{user.level})
          </option>
        ))}
      </select>
      <span className="select-icon" aria-hidden="true">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </span>
    </div>
  )
}

export default UserSelect