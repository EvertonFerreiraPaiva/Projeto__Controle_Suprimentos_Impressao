# Controle de Suprimentos de Impressão

Sistema web desenvolvido para gerenciamento de suprimentos de impressão (toners, fusores e kits de imagem), utilizando HTML, Tailwind CSS, JavaScript e Supabase.

## Funcionalidades

* Cadastro de usuários
* Login e autenticação
* Área restrita
* CRUD de suprimentos
* Registro de movimentações
* Dashboard com indicadores
* Gráfico de movimentações por destino
* Integração com API REST do Supabase

## Tecnologias

* HTML5
* Tailwind CSS
* JavaScript (ES6)
* Supabase REST API
* Chart.js

## Estrutura do Projeto

```text
/
├── index.html
├── cadastro.html
├── dashboard.html
├── assets/
│   └── js/
│       ├── config.js
│       ├── auth.js
│       ├── suprimentos.js
│       ├── movimentacoes.js
│       └── dashboard.js
├── README.md
└── banco.sql
```

## Configuração

1. Criar projeto no Supabase.
2. Executar o script SQL disponível em `banco.sql`.
3. Configurar `SUPABASE_URL` e `SUPABASE_ANON_KEY` em `assets/js/config.js`.
4. Publicar o projeto em GitHub Pages.

## Autor
Everton Kauan Ferreira de Paiva
Trabalho desenvolvido para a disciplina de Programação para Internet da Fatec Itu.
