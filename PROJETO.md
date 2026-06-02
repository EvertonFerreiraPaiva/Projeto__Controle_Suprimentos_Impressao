# PROJETO — Sistema de Controle de Suprimentos de Impressão

## 1. Visão Geral

### Objetivo do sistema
Sistema web para controle de suprimentos de impressão (toners, fusores e kits de imagem Lexmark), permitindo gerenciar produtos e movimentações entre setores, com autenticação de usuários e dashboard com indicadores.

### Escopo
- Aplicação front-end pura (HTML, CSS, JavaScript) hospedada no **GitHub Pages**.
- Estilização com **Tailwind CSS** via CDN.
- Gráficos com **Chart.js** via CDN.
- Back-end como serviço via **Supabase** (autenticação + banco de dados PostgreSQL com API REST).
- Chamadas à API REST do Supabase com `fetch()` puro — sem SDK.
- Totalmente responsivo.

### Funcionalidades principais
- Autenticação (cadastro e login de usuários)
- CRUD de suprimentos
- Registro de movimentações entre setores (origem → destino)
- Dashboard com cards de indicadores e gráfico de barras
- Área restrita (exige login para acessar)

---

## 2. Requisitos do Trabalho

| Requisito | Como será atendido |
|---|---|
| **Login** | `POST {SUPABASE_URL}/auth/v1/token?grant_type=password` com `fetch()` |
| **Cadastro de usuários** | `POST {SUPABASE_URL}/auth/v1/signup` com `fetch()` |
| **Área restrita** | Armazena token no `localStorage`; se ausente, redireciona para login |
| **CRUD completo** | Produtos: criar, listar, editar, excluir via `fetch()` na API REST do Supabase |
| **API REST do Supabase** | Chamadas HTTP com `fetch()` usando `Authorization: Bearer <token>` + `apikey` |
| **Operações assíncronas** | `async/await` em todas as chamadas `fetch()` |
| **Duas tabelas** | `produtos` e `movimentacoes` |
| **Uma tabela com ≥ 5 atributos** | `produtos` terá 7 atributos |
| **Foreign Key** | `movimentacoes.produto_id` → `produtos.id` |
| **Tailwind CSS** | CDN do Tailwind CSS aplicado em todas as páginas |
| **GitHub Pages** | Repositório público com branch `gh-pages` ou pasta `docs/` |

---

## 3. Modelagem do Banco

### Tabela: `produtos`

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | `bigint` PK (auto increment) | Chave primária gerada automaticamente |
| `codigo` | `text` NOT NULL | Código do fabricante (ex: 56F4H00) |
| `descricao` | `text` NOT NULL | Nome descritivo do suprimento |
| `tipo` | `text` NOT NULL | Toner, Fusor ou Kit de Imagem |
| `fabricante` | `text` NOT NULL | Fabricante (Lexmark) |
| `quantidade` | `integer` NOT NULL | Quantidade em estoque |
| `localizacao` | `text` | Local físico onde o item está armazenado |
| `created_at` | `timestamptz` | Data de criação (padrão `now()`) |

### Tabela: `movimentacoes`

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | `bigint` PK (auto increment) | Chave primária gerada automaticamente |
| `produto_id` | `bigint` FK → `produtos.id` | Suprimento movimentado |
| `origem` | `text` NOT NULL | Setor de origem (ex: Compras) |
| `destino` | `text` NOT NULL | Setor de destino (ex: Estoque, RH) |
| `quantidade` | `integer` NOT NULL | Quantidade movimentada |
| `observacao` | `text` | Observação opcional |
| `created_at` | `timestamptz` | Data da movimentação (padrão `now()`) |

### Relacionamento
- `movimentacoes.produto_id` → `produtos.id` (1:N).
- Um suprimento pode ter várias movimentações.
- Uma movimentação pertence a um único suprimento.
- A exclusão de um suprimento é bloqueada se houver movimentações vinculadas.

---

## 4. Fluxo de Navegação

```
[Login]
   |
   v
[Dashboard] ←──────────────────────────┐
   |                                    |
   v                                    |
[Cadastro de Suprimentos] ── após salvar┘
   |
   v
[Listagem de Suprimentos]
   |
   v
[Editar / Excluir Suprimento] ── após ação┘
   |
   v
[Movimentações] ─── após salvar ────────┘
   |
   v
[Dashboard] (atualizado)
   |
   v
[Logout] → [Login]
```

---

## 5. Estrutura de Pastas

```
/
├── index.html              ← Login
├── cadastro.html           ← Cadastro de usuário
├── dashboard.html          ← Dashboard + CRUD
├── assets/
│   ├── css/
│   │   └── style.css       ← Customizações extras
│   └── js/
│       ├── config.js       ← URL e chave anônima do Supabase
│       ├── auth.js         ← Login, cadastro, logout com fetch()
│       ├── api.js          ← Funções genéricas de CRUD com fetch()
│       ├── produtos.js     ← Operações específicas de suprimentos
│       ├── movimentacoes.js← Operações específicas de movimentações
│       └── dashboard.js    ← Cards e gráfico com Chart.js
├── PROJETO.md              ← Este documento
└── README.md               ← Instruções de uso
```

---

## 6. Estrutura das Telas

### 6.1 `index.html` (Login)

**Função:** Autenticar usuário existente.

**Campos:**
- E-mail (`input type="email"`)
- Senha (`input type="password"`)

**Botões:**
- "Entrar" — valida campos e faz requisição `POST` ao endpoint de token do Supabase
- "Criar conta" — link para `cadastro.html`

**Comportamento:**
- Se já possui token salvo, redireciona para `dashboard.html`
- Exibe mensagem de erro se credenciais inválidas
- Em caso de sucesso, salva o token no `localStorage`

---

### 6.2 `cadastro.html` (Cadastro de Usuário)

**Função:** Registrar novo usuário.

**Campos:**
- Nome (`input type="text"`)
- E-mail (`input type="email"`)
- Senha (`input type="password"`, mínimo 6 caracteres)
- Confirmar senha (`input type="password"`)

**Botões:**
- "Cadastrar" — valida, faz requisição `POST` ao endpoint de signup, redireciona para login
- "Voltar" — link para `index.html`

**Comportamento:**
- Valida se senhas conferem
- Exibe mensagem de sucesso/erro

---

### 6.3 `dashboard.html` (Área Restrita)

**Função:** Página principal após login. Contém CRUD e indicadores.

**Seções:**

1. **Topo:** Logo + botão "Sair"

2. **Cards de indicadores:**
   - Total de suprimentos cadastrados
   - Quantidade total em estoque
   - Total de movimentações
   - Suprimento com menor estoque

3. **Gráfico de barras:** Chart.js mostrando quantidade de movimentações por destino

4. **Gestão de Suprimentos:**
   - Botão "Novo Suprimento" abre formulário modal
   - Tabela listando: código, descrição, tipo, fabricante, quantidade, localização, ações (editar/excluir)

5. **Gestão de Movimentações:**
   - Botão "Nova Movimentação" abre formulário modal
     - Select de suprimento (carregado da tabela produtos)
     - Origem (texto)
     - Destino (texto)
     - Quantidade
     - Observação
   - Tabela listando movimentações recentes

**Campos do modal "Novo Suprimento":**
- Código (`text`)
- Descrição (`text`)
- Tipo (`select`: Toner, Fusor, Kit de Imagem)
- Fabricante (`text`, pré-preenchido como Lexmark)
- Quantidade (`number`)
- Localização (`text`)

**Campos do modal "Nova Movimentação":**
- Suprimento (`select` — carregado dinamicamente)
- Origem (`text`)
- Destino (`text`)
- Quantidade (`number`)
- Observação (`textarea`)

---

## 7. Dashboard

### Cards (4 cards lado a lado)

| Card | Fonte de dados |
|---|---|
| **Suprimentos** | `GET /rest/v1/produtos?select=count` |
| **Total em estoque** | `GET /rest/v1/produtos?select=quantidade` (soma no JS) |
| **Movimentações** | `GET /rest/v1/movimentacoes?select=count` |
| **Menor estoque** | `GET /rest/v1/produtos?order=quantidade.asc&limit=1` |

### Gráfico

- **Tipo:** Barras verticais com Chart.js (CDN)
- **Eixo X:** Destinos das movimentações
- **Eixo Y:** Quantidade de movimentações por destino
- **Simplicidade:** 3–6 barras, paleta de cores automática do Chart.js

---

## 8. Integração com Supabase

Todas as requisições usam `fetch()` puro com os headers:
- `apikey`: chave anônima do Supabase
- `Authorization: Bearer {token}` (token do usuário logado)
- `Content-Type: application/json`

### Operações REST necessárias

| Operação | Método / Endpoint | Finalidade |
|---|---|---|
| **Login** | `POST {URL}/auth/v1/token?grant_type=password` | Autenticar usuário |
| **Cadastro** | `POST {URL}/auth/v1/signup` | Registrar novo usuário |
| **Logout** | Remove token do `localStorage` | Encerrar sessão |
| **Listar suprimentos** | `GET {URL}/rest/v1/produtos?order=created_at.desc` | Listar todos os suprimentos |
| **Inserir suprimento** | `POST {URL}/rest/v1/produtos` | Criar novo suprimento |
| **Atualizar suprimento** | `PATCH {URL}/rest/v1/produtos?id=eq.{id}` | Editar suprimento |
| **Excluir suprimento** | `DELETE {URL}/rest/v1/produtos?id=eq.{id}` | Remover suprimento |
| **Listar movimentações** | `GET {URL}/rest/v1/movimentacoes?select=*,produtos(codigo,descricao)&order=created_at.desc` | Listar com código e descrição do suprimento |
| **Inserir movimentação** | `POST {URL}/rest/v1/movimentacoes` | Registrar movimentação |
| **Excluir movimentação** | `DELETE {URL}/rest/v1/movimentacoes?id=eq.{id}` | Remover movimentação |
| **Atualizar quantidade** | `PATCH {URL}/rest/v1/produtos?id=eq.{id}` | Atualizar saldo ao movimentar |
| **Cards do dashboard** | `GET {URL}/rest/v1/produtos` + `GET {URL}/rest/v1/movimentacoes` | Calcular indicadores no JS |

---

## 9. Plano de Desenvolvimento

### Etapa 1 — Setup
1. Criar repositório no GitHub e habilitar GitHub Pages
2. Criar projeto no Supabase (apenas criar as tabelas via SQL editor)
3. Criar estrutura de pastas e arquivos HTML vazios

### Etapa 2 — Autenticação
4. Criar `config.js` com a URL e chave anônima do Supabase
5. Implementar `auth.js`: login, cadastro, logout com `fetch()`
6. Criar `index.html` com formulário de login
7. Criar `cadastro.html` com formulário de cadastro
8. Implementar proteção de rota em `dashboard.html` (verifica token no `localStorage`)

### Etapa 3 — CRUD Suprimentos
9. Implementar `api.js` com funções genéricas `get`, `post`, `patch`, `del` usando `fetch()`
10. Implementar `produtos.js`: criar, listar, atualizar, excluir
11. Criar tabela e modal no HTML de `dashboard.html`

### Etapa 4 — Movimentações
12. Implementar `movimentacoes.js`: criar e listar movimentações
13. Atualizar quantidade do suprimento ao registrar movimentação
14. Criar modal e tabela no HTML

### Etapa 5 — Dashboard
15. Implementar cards de indicadores em `dashboard.js`
16. Implementar gráfico de barras com Chart.js
17. Conectar cards e gráfico ao HTML de `dashboard.html`

### Etapa 6 — Finalização
18. Testar fluxo completo: cadastro → login → CRUD → movimentações → dashboard
19. Aplicar estilos finais com Tailwind CSS (responsivo)
20. Publicar no GitHub Pages e validar funcionamento
