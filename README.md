# Gamified Kanban

Quadro Kanban gamificado com 4 colunas — **TODO → DOING → REVIEW → READY**.
Ao levar uma task para **READY**, o usuário ganha **50 XP**. A cada **100 XP**, sobe um nível; o restante carrega para o próximo nível.

Cada task paga XP **uma única vez**. Não dá para "farmar" XP movendo a mesma task de READY para REVIEW e de volta.

---

## Índice

- [O que o app faz](#o-que-o-app-faz)
- [Por que este projeto existe](#por-que-este-projeto-existe)
- [Stack](#stack)
- [Como rodar](#como-rodar)
- [Rotas da API](#rotas-da-api)
- [Regras de negócio](#regras-de-negócio)
- [Testes](#testes)
- [Estrutura de pastas](#estrutura-de-pastas)
- [Licença](#licença)

---

## O que o app faz

O quadro mostra apenas as tasks do usuário selecionado na sidebar. Cada coluna tem cor própria e o usuário ativo aparece no cabeçalho.

Cada task tem um botão "⋮" que abre um menu para editar o título, mudar o status ou excluir. O menu é renderizado em um portal fora da coluna, então nunca fica escondido atrás dos cards.

<div style="display:flex; gap:16px; flex-wrap:wrap; justify-content:center; margin:24px 0;">
  <div style="max-width:48%;">
    <img src="docs/screenshots/01-board-principal.png" alt="Board principal" style="width:100%; border-radius:8px; border:1px solid #e2e8f0;" />
    <p style="text-align:center; font-size:0.9rem; color:#64748b; margin-top:8px;">Board principal — tarefas filtradas pelo usuário selecionado</p>
  </div>
  <div style="max-width:48%;">
    <img src="docs/screenshots/02-menu-aberto.png" alt="Menu de ações" style="width:100%; border-radius:8px; border:1px solid #e2e8f0;" />
    <p style="text-align:center; font-size:0.9rem; color:#64748b; margin-top:8px;">Menu de ações aberto sobre uma task</p>
  </div>
</div>

---

## Por que este projeto existe

Este app foi construído com apoio de IA (OpenCode) como um exercício prático de **aprender a usar ferramentas de IA como revisor de código e intermediário entre ideia e implementação**, no contexto do mercado de trabalho.

A ideia não era apenas ter um app pronto, mas entender como:

- Descrever requisitos para uma IA de forma que o resultado funcione;
- Revisar o código gerado (bugs de render, cache do Vite, fusos horários no banco, race conditions de XP);
- Pedir pequenos PRs para a IA, revisar o diff e testar no navegador real;
- Conectar front-end, back-end e banco de dados com responsabilidade.

O app é **vibecodado com propósito**: usar essa nova categoria de ferramenta de forma crítica e consciente.

---

## Stack

| Camada | Tecnologia |
|--------|------------|
| Back-end | Node 22 + Express + `pg` |
| Front-end | React 19 + Vite + `@dnd-kit` |
| Banco | PostgreSQL 15 (Docker) |
| Testes | `node:test` (back) + Vitest (front) |
| Estilização | CSS puro (IBM Plex, design system com variáveis) |
| Deploy | Docker Compose + Nginx |
| CI | GitHub Actions |

---

## Como rodar

### Com Docker Compose (recomendado)

```bash
git clone https://github.com/hgiulliano/gamified-kanban-node.git
cd gamified-kanban-node

cp back-end/.env.example back-end/.env
cp front-end/.env.example front-end/.env

docker compose up --build
```

Acessos:
- **App**: http://localhost:8080
- **API**: http://localhost:3000
- **Postgres (host)**: localhost:5433

Usuários de seed criados automaticamente: `demo_ana` e `demo_bruno`.

### Sem Docker

```bash
# Back-end
cd back-end
cp .env.example .env
npm ci
npm run migrate   # aplica migrations no Postgres
npm run seed      # dados de exemplo (opcional)
npm run dev       # :3000

# Front-end (novo terminal)
cd front-end
cp .env.example .env
npm ci
npm run dev       # :5173
```

---

## Rotas da API

| Método | Caminho | Descrição |
|--------|---------|-----------|
| `GET` | `/health` | Healthcheck |
| `GET` | `/users` | Lista todos os usuários (nível, XP) |
| `GET` | `/users/:id` | Usuário por ID |
| `POST` | `/users` | Cria usuário (3–50 chars, alfanumérico + `_`/`-`) |
| `GET` | `/tasks` | Lista todas as tasks com dados do usuário |
| `POST` | `/tasks` | Cria task |
| `PATCH` | `/tasks/:id` | Edita título |
| `PATCH` | `/tasks/:id/status` | Muda status + concede XP se for `READY` (uma vez) |
| `DELETE` | `/tasks/:id` | Exclui task |

---

## Regras de negócio

- **Colunas**: `TODO`, `DOING`, `REVIEW`, `READY`
- **XP**: `READY` = +50 XP. Cada 100 XP = nível +1. O que sobra continua para o próximo nível
- **XP idempotente**: a coluna `tasks.xp_awarded` impede pagar duas vezes pela mesma task
- **Datas**: `created_at` armazena `TIMESTAMPTZ` (UTC). Nada de "-1d atrás" por fuso horário
- **Board**: mostra apenas as tasks do usuário selecionado na sidebar
- **UI**: sem emojis, fonte IBM Plex, cores padronizadas, responsivo

---

## Testes

```bash
# Back-end (node:test — regras de XP + API de ponta a ponta)
cd back-end
npm test

# Front-end (Vitest — helpers de data)
cd front-end
npm test

# Verificar compilação
npm run build

# Lint
npm run lint
```

---

## Estrutura de pastas

```
.
├── back-end/
│   ├── lib/xp.js            # regras de XP e level up (testável isoladamente)
│   ├── server.js            # Express + rotas + Pool
│   ├── scripts/migrate.js   # aplica migrations SQL (npm run migrate)
│   ├── scripts/seed.js      # dados de demonstração (npm run seed)
│   ├── migrations/          # SQL versionado
│   ├── test/                # testes de integração
│   ├── Dockerfile
│   ├── .env.example
│   └── package.json
├── front-end/
│   ├── src/
│   │   ├── context/KanbanContext.jsx   # estado global + usuário selecionado
│   │   ├── components/                 # Board, Column, TaskCard, TaskMenu...
│   │   ├── services/api.js             # camada de fetch
│   │   └── utils/date.js               # datas relativas (testável)
│   │   ├── App.jsx
│   │   ├── App.css
│   │   └── index.css
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── .env.example
│   └── vite.config.js
├── docs/screenshots/          # imagens do README
├── docker-compose.yml         # sobe db + api + web
├── .github/workflows/ci.yml   # lint + testes + build em cada push
├── LICENSE (MIT)
└── README.md
```

---

## Licença

MIT — sinta-se livre para usar, estudar e adaptar.

---

Feito com OpenCode + Node + React + PostgreSQL, em português do Brasil.