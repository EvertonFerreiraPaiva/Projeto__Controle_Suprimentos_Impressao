-- ============================================================
-- SCRIPT DE CRIAÇÃO DO BANCO DE DADOS
-- Sistema de Controle de Suprimentos de Impressão
-- PostgreSQL compatível com Supabase
-- ============================================================

-- ============================================================
-- 1. REMOÇÃO DA ESTRUTURA ANTIGA
-- ============================================================

-- Remove a tabela movimentacoes primeiro, pois depende de produtos.
DROP TABLE IF EXISTS movimentacoes;

-- Remove a tabela produtos após remover a dependente.
DROP TABLE IF EXISTS produtos;

-- Comentário: a ordem importa por causa da foreign key.
-- Se existisse outra ordem, o banco impediria a exclusão.


-- ============================================================
-- 2. CRIAÇÃO DA TABELA PRODUTOS
-- ============================================================

CREATE TABLE produtos (
    id          BIGINT  GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    codigo      TEXT    NOT NULL UNIQUE,
    descricao   TEXT    NOT NULL,
    tipo        TEXT    NOT NULL CHECK (tipo IN ('Toner', 'Fusor', 'Kit de Imagem')),
    fabricante  TEXT    NOT NULL,
    quantidade  INTEGER NOT NULL CHECK (quantidade >= 0),
    localizacao TEXT,
    created_at  TIMESTAMPTZ DEFAULT now()
);

-- Comentários explicativos:
--   id          : Chave primária com auto incremento (bigint)
--   codigo      : Código do fabricante (ex: 56F4H00, 40X8421)
--   descricao   : Nome descritivo do suprimento
--   tipo        : Toner, Fusor ou Kit de Imagem
--   fabricante  : Fabricante do suprimento (Lexmark)
--   quantidade  : Quantidade atual em estoque
--   localizacao : Local físico onde o item está armazenado (ex: Prateleira A1)
--   created_at  : Data/hora de criação, preenchida automaticamente


-- ============================================================
-- 3. CRIAÇÃO DA TABELA MOVIMENTAÇÕES
-- ============================================================

CREATE TABLE movimentacoes (
    id          BIGINT  GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    produto_id  BIGINT  NOT NULL,
    origem      TEXT    NOT NULL,
    destino     TEXT    NOT NULL,
    quantidade  INTEGER NOT NULL CHECK (quantidade > 0),
    observacao  TEXT,
    created_at  TIMESTAMPTZ DEFAULT now(),

    -- Definição da chave estrangeira
    CONSTRAINT fk_movimentacoes_produto
        FOREIGN KEY (produto_id)
        REFERENCES produtos(id)
        ON DELETE RESTRICT
);

-- Comentários explicativos:
--   id          : Chave primária com auto incremento (bigint)
--   produto_id  : Chave estrangeira para produtos.id
--   origem      : Setor de origem da movimentação (ex: Compras)
--   destino     : Setor de destino da movimentação (ex: Estoque, RH)
--   quantidade  : Quantidade movimentada, deve ser maior que zero
--   observacao  : Observação opcional sobre a movimentação
--   created_at  : Data/hora de criação, preenchida automaticamente
--   ON DELETE RESTRICT : Impede excluir produto com movimentações vinculadas


-- ============================================================
-- 4. CRIAÇÃO DE ÍNDICES
-- ============================================================

-- Índice para a chave estrangeira (acelera consultas por produto)
CREATE INDEX idx_movimentacoes_produto_id ON movimentacoes(produto_id);

-- Índice para consultas por destino (usado no gráfico do dashboard)
CREATE INDEX idx_movimentacoes_destino ON movimentacoes(destino);

-- Índice para ordenação por quantidade (usado no card "menor estoque")
CREATE INDEX idx_produtos_quantidade ON produtos(quantidade);


-- ============================================================
-- 5. REGISTROS DE EXEMPLO PARA TESTES
-- ============================================================

-- 5.1 Inserção de suprimentos Lexmark

INSERT INTO produtos (codigo, descricao, tipo, fabricante, quantidade, localizacao) VALUES
    ('56F4H00', 'Toner Lexmark Preto ALTA CAPACIDADE',  'Toner',         'Lexmark', 15, 'Prateleira A1'),
    ('56F0Z00', 'Kit de Imagem Lexmark',                'Kit de Imagem', 'Lexmark',  5, 'Prateleira A2'),
    ('40X8421', 'Fusor Lexmark 220V',                    'Fusor',         'Lexmark',  3, 'Prateleira B1'),
    ('56F3H00', 'Toner Lexmark Ciano ALTA CAPACIDADE',  'Toner',         'Lexmark',  8, 'Prateleira A1'),
    ('56F2H00', 'Toner Lexmark Amarelo ALTA CAPACIDADE','Toner',         'Lexmark',  8, 'Prateleira A1'),
    ('56F1H00', 'Toner Lexmark Magenta ALTA CAPACIDADE', 'Toner',         'Lexmark',  8, 'Prateleira A1');


-- 5.2 Inserção de movimentações entre setores

INSERT INTO movimentacoes (produto_id, origem, destino, quantidade, observacao) VALUES
    (1, 'Compras',   'Estoque',   15, 'Compra inicial de toners pretos'),
    (2, 'Compras',   'Estoque',    5, 'Compra inicial de kits de imagem'),
    (3, 'Compras',   'Estoque',    3, 'Compra inicial de fusores'),
    (4, 'Compras',   'Estoque',    8, 'Compra inicial de toners ciano'),
    (5, 'Compras',   'Estoque',    8, 'Compra inicial de toners amarelo'),
    (6, 'Compras',   'Estoque',    8, 'Compra inicial de toners magenta'),
    (1, 'Estoque',   'RH',         2, 'Solicitação do RH para impressão de documentos'),
    (1, 'Estoque',   'Produção',   3, 'Solicitação da Produção'),
    (2, 'Estoque',   'RH',         1, 'Troca de kit de imagem no RH'),
    (3, 'Estoque',   'Produção',   1, 'Substituição de fusor com defeito'),
    (4, 'Estoque',   'Financeiro', 2, 'Solicitação do Financeiro'),
    (5, 'Estoque',   'Financeiro', 1, 'Solicitação do Financeiro'),
    (6, 'Estoque',   'RH',         1, 'Solicitação do RH'),
    (4, 'Estoque',   'Produção',   2, 'Solicitação da Produção');


-- ============================================================
-- 6. CONFIGURAÇÃO DE PERMISSÕES (RLS) PARA SUPABASE
-- ============================================================
--
-- O Supabase exige que as tabelas tenham Row Level Security (RLS)
-- ativado para que requisições REST autenticadas funcionem.
--
-- Execute os comandos abaixo no SQL Editor do Supabase APÓS
-- criar as tabelas e inserir os registros de exemplo.
--
-- 6.1 Ativar RLS nas tabelas
--
-- ALTER TABLE produtos      ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE movimentacoes ENABLE ROW LEVEL SECURITY;
--
-- 6.2 Política que libera todas as operações (SELECT, INSERT,
--     UPDATE, DELETE) para qualquer usuário autenticado
--
-- CREATE POLICY "Acesso total a produtos" ON produtos
--     FOR ALL
--     USING (auth.role() = 'authenticated')
--     WITH CHECK (auth.role() = 'authenticated');
--
-- CREATE POLICY "Acesso total a movimentacoes" ON movimentacoes
--     FOR ALL
--     USING (auth.role() = 'authenticated')
--     WITH CHECK (auth.role() = 'authenticated');
--
-- 6.3 Alternativa mais simples (desabilitar RLS)
--
-- Caso o professor permita, você pode simplesmente desabilitar
-- o RLS no Dashboard do Supabase:
--   Authentication > Policies > desmarcar "Enable RLS"
--   para ambas as tabelas.
--
-- Isso faz com que qualquer requisição com a chave anônima
-- + token de autenticação possa ler e escrever sem políticas
-- adicionais.
--
-- ============================================================
