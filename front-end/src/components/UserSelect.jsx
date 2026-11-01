// ============================================
// USER SELECT — Dropdown para escolher usuário
// ============================================

function UserSelect({ 
  users,           // Array de users: [{ id, username, level, current_xp }, ...]
  selectedId,      // ID do user selecionado
  onChange,        // Função (userId) => void
  placeholder = 'Selecione um usuário...',
  disabled = false,
  required = true,
  className = '',
}) {
  // Se não há usuários, mostra mensagem
  if (!users || users.length === 0) {
    return (
      <select 
        disabled 
        className={`user-select ${className}`}
        aria-label={placeholder}
      >
        <option value="">Nenhum usuário cadastrado</option>
      </select>
    )
  }

  return (
    <div className="user-select-wrapper">
      <label htmlFor={`user-select-${selectedId || 'new'}`} className="visually-hidden">
        {placeholder}
      </label>
      
      <select
        id={`user-select-${selectedId || 'new'}`}
        value={selectedId || ''}
        onChange={(e) => onChange(Number(e.target.value) || null)}
        disabled={disabled}
        required={required}
        className={`user-select ${className}`}
        aria-label={placeholder}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        
        {users.map(user => (
          <option 
            key={user.id} 
            value={user.id}
            // Mostra level e XP no dropdown para contexto
          >
            {user.username} (Nv.{user.level} • {user.current_xp} XP)
          </option>
        ))}
      </select>
      
      {/* Ícone decorativo */}
      <span className="select-icon" aria-hidden="true">👤</span>
    </div>
  )
}

export default UserSelect