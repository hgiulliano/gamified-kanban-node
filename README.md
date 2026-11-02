# Gamified Kanban

Quadro Kanban com 4 colunas (`TODO` → `DOING` → `REVIEW` → `READY`).
Chegar em `READY` concede **50 XP** e cada **100 XP sobe um nível** (o restante carrega para o próximo nível).

Toda task paga XP **uma única vez** — não dá para farmar XP mexendo a mesma task de `READY` para `REVIEW` e de volta.

## Por que este projeto existe

Esta aplicação foi construída com apoio de IA (OpenCode) como um exercício prático de **aprender a usar ferramentas de IA como revisor de código e intermediário entre ideia e implementação**, no contexto do mercado de trabalho. A ideia não era apenas ter um app pronto, mas entender como:

- Descrever requisitos para uma IA de forma que o resultado funcione;
- Revisar o código gerado (bugs de render, cache do Vite, fusos horários no banco, race conditions de XP);
- Pedi pequenos PRs para a IA, revisar o diff e testar no navegador real;
- Conectar front-end, back-end e banco de dados com responsabilidade.

O app é **vibecodado** com propósito: usar essa nova categoria de ferramenta de forma crítica e consciente.

## Stack

| Camada | Tecnologia |
|--------|------------|
| Back-end | Node 22 + Express + `pg` (PostgreSQL 15) |
| Front-end | React 19 + Vite + `@dnd-kit` |
| Banco | PostgreSQL 15 (Docker) |
| Testes | `node:test` (back) + Vitest (front) |
| Estilização | CSS puro (IBM Plex, design system com variáveis CI) |
| CI | GitHub Actions |

## Como rodar localmente

### Com Docker Compose (recomendado)

```bash
# 1. Copie os exemplos de variáveis de ambiente
cp back-end/.env.example back-end/.env
cp front-end/.env.example front-end/.env

# 2. Suba tudo
docker compose up --build
```

Acessos:
- App: http://localhost:8080
- API: http://localhost:3000
- Postgres (host): localhost:5433

Usuários de seed já criados: `demo_ana` e `demo_bruno` (senha não é necessária, não há login).

### Sem Docker

```bash
# Back-end
cd back-end
cp .env.example .env   # ajuste DB_HOST/DB_PORT se necessário
npm ci
npm run migrate        # aplica migrations no Postgres rodando
npm run seed           # dados de exemplo
npm run dev            # :3000

# Front-end (novo terminal)
cd front-end
cp .env.example .env
npm ci
npm run dev            # :5173
```

## Rotas da API

| Método | Caminho | Descrição |
|--------|---------|-----------|
| `GET` | `/health` | Healthcheck |
| `GET` | `/users` | Lista todos os usuários (XP, nível) |
| `GET` | `/users/:id` | Usuário por ID |
| `POST` | `/users` | Cria usuário (3–50 chars, alfanumérico + `_`/`-`) |
| `GET` | `/tasks` | Lista todas as tasks com dados do usuário |
| `POST` | `/tasks` | Cria task |
| `PATCH` | `/tasks/:id` | Edita título |
| `PATCH` | `/tasks/:id/status` | Muda status + concede XP se for `READY` (uma vez) |
| `DELETE` | `/tasks/:id` | Exclui task |

## Regras de negócio

- **Colunas**: `TODO`, `DOING`, `REVIEW`, `READY`.
- **XP**: `READY` = +50 XP. Cada 100 XP = nível +1. O que sobra continua para o próximo nível.
- **Idempotência de XP**: a coluna `tasks.xp_awarded` impede pagar duas vezes pela mesma task.
- **Datas**: `created_at` armazena `TIMESTAMPTZ` (UTC). Nada de "-1d atrás" por fuso horário.
- **Board**: mostra apenas as tasks do usuário selecionado na sidebar.
- **Sem emojis na UI**: fonte IBM Plex, cores padronizadas, responsivo.

## Testes

```bash
# Back-end
cd back-end
npm test            # node:test (regras de XP + API de ponta a ponta)

# Front-end
cd front-end
npm test            # Vitest (helpers de data)
npm run build       # verifica compilação
npm run lint        # oxlint
```

## Estrutura de pastas

```
.
├── back-end/
│   ├── lib/xp.js            # regras de XP e level up (testável isoladamente)
│   ├── server.js            # Express + rotas + Pool
│   ├── scripts/migrate.js   # aplica migrations SQL
│   ├── scripts/seed.js      # dados de demonstração
│   ├── migrations/          # SQL versionado
│   ├── test/                # testes de integração
│   ├── Dockerfile
│   ├── .env.example
│   └── package.json
├── front-end/
│   ├── src/
│   │   ├── context/KanbanContext.jsx   # estado global + selecionado do usuário
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
├── docker-compose.yml        # sobe db + api + web
├── .github/workflows/ci.yml  # lint + testes + build em cada push
├── LICENSE (MIT)
└── README.md
```

## Linguagem

Este README e o código estão em português do Brasil, porque o projeto foi desenvolvido em português com o acompanhamento da IA.

---

Feito com OpenCode + Node + React + PostgreSQL. Se quiser contribuir, abra uma issue ou PR.