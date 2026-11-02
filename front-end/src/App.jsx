// ============================================
// APP — Componente Raiz
// ============================================

import { KanbanProvider } from './context/KanbanContext'
import KanbanLayout from './components/KanbanLayout'
// index.css = tokens de design (cores, fontes, reset)
import './index.css'
// App.css = layout e estilos dos componentes (sidebar, board, cards...)
import './App.css'

function App() {
  return (
    <KanbanProvider>
      <div className="app">
        <KanbanLayout />
      </div>
    </KanbanProvider>
  )
}

export default App