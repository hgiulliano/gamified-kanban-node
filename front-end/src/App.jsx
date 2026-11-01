// ============================================
// APP — Componente Raiz do Front-end
// ============================================

import { KanbanProvider } from './context/KanbanContext'
import Board from './components/Board'
import './App.css'  // Estilos globais do Kanban

function App() {
  return (
    // 1. PROVIDER DO CONTEXTO — Envolve toda a app
    <KanbanProvider>
      <div className="app">
        {/* Header global */}
        <header className="app-header">
          <h1>🎮 Gamified Kanban</h1>
          <p className="app-subtitle">Arraste tasks, ganhe XP, suba de nível!</p>
        </header>

        {/* Main content */}
        <main className="app-main">
          <Board />
        </main>

        {/* Footer */}
        <footer className="app-footer">
          <p>Feito com React + Vite + @dnd-kit + Node.js/Express/PostgreSQL</p>
        </footer>
      </div>
    </KanbanProvider>
  )
}

export default App