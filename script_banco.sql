-- ==========================================================
-- OURO VERDE - Script COMPLETO do banco (PostgreSQL)
-- Rode no banco "ouro_verde":
--   psql -U postgres -d ouro_verde -f script_banco.sql
-- ATENCAO: apaga e recria todas as tabelas.
-- (Substitui os antigos admin_setup.sql e implementacao_ouro_verde.sql)
-- ==========================================================

DROP TABLE IF EXISTS parcela;
DROP TABLE IF EXISTS reserva_material;
DROP TABLE IF EXISTS reserva CASCADE;
DROP TABLE IF EXISTS telefone_cliente;
DROP TABLE IF EXISTS cliente CASCADE;
DROP TABLE IF EXISTS servico CASCADE;
DROP TABLE IF EXISTS material CASCADE;
DROP TABLE IF EXISTS categoria_material CASCADE;
DROP TABLE IF EXISTS administrador;

CREATE TABLE administrador (
    id_admin SERIAL PRIMARY KEY,
    nome     VARCHAR(100) NOT NULL,
    email    VARCHAR(100) UNIQUE NOT NULL,
    senha    VARCHAR(255) NOT NULL
);

CREATE TABLE categoria_material (
    id_categoria SERIAL PRIMARY KEY,
    nome         VARCHAR(100) NOT NULL
);

-- quantidade_estoque = quantas unidades a empresa POSSUI.
-- A disponibilidade em uma data e calculada:
--   estoque - soma do que ja esta reservado (nao cancelado) naquela data.
CREATE TABLE material (
    id_material        SERIAL PRIMARY KEY,
    id_categoria       INT NOT NULL,
    nome               VARCHAR(100) NOT NULL,
    quantidade_estoque INT NOT NULL CHECK (quantidade_estoque >= 0),
    preco_unitario     NUMERIC(10, 2) NOT NULL CHECK (preco_unitario >= 0),
    url_imagem         VARCHAR(255),
    CONSTRAINT fk_categoria FOREIGN KEY (id_categoria) REFERENCES categoria_material(id_categoria)
);

CREATE TABLE servico (
    id_servico SERIAL PRIMARY KEY,
    nome       VARCHAR(100) NOT NULL,
    descricao  TEXT,
    preco_base NUMERIC(10, 2) NOT NULL CHECK (preco_base >= 0),
    url_imagem VARCHAR(255)
);

CREATE TABLE cliente (
    id_cliente SERIAL PRIMARY KEY,
    nome       VARCHAR(150) NOT NULL,
    cpf_cnpj   VARCHAR(20) UNIQUE NOT NULL,
    email      VARCHAR(150) UNIQUE NOT NULL,
    senha      VARCHAR(255) NOT NULL,
    rua        VARCHAR(150),
    numero     VARCHAR(20),
    bairro     VARCHAR(100),
    cidade     VARCHAR(100),
    cep        VARCHAR(20)
);

CREATE TABLE telefone_cliente (
    id_telefone SERIAL PRIMARY KEY,
    id_cliente  INT NOT NULL,
    numero      VARCHAR(20) NOT NULL,
    CONSTRAINT fk_cliente_telefone FOREIGN KEY (id_cliente) REFERENCES cliente(id_cliente) ON DELETE CASCADE
);

-- status: PENDENTE, CONFIRMADO, EM_ANDAMENTO, CONCLUIDO, CANCELADO
-- tipo_entrega: ENTREGA ou RETIRADA
-- forma_pagamento: PIX ou PRESENCIAL
CREATE TABLE reserva (
    id_reserva       SERIAL PRIMARY KEY,
    id_cliente       INT NOT NULL,
    id_servico       INT NOT NULL,
    data_solicitacao DATE DEFAULT CURRENT_DATE,
    data_evento      DATE NOT NULL,
    data_hora_evento TIMESTAMP,
    status           VARCHAR(50) NOT NULL,
    tipo_entrega     VARCHAR(20) NOT NULL DEFAULT 'RETIRADA',
    forma_pagamento  VARCHAR(20) NOT NULL DEFAULT 'PIX',
    valor_total      NUMERIC(10, 2),
    CONSTRAINT fk_cliente_reserva FOREIGN KEY (id_cliente) REFERENCES cliente(id_cliente),
    CONSTRAINT fk_servico_reserva FOREIGN KEY (id_servico) REFERENCES servico(id_servico)
);

CREATE TABLE reserva_material (
    id_reserva         INT NOT NULL,
    id_material        INT NOT NULL,
    quantidade_alocada INT NOT NULL CHECK (quantidade_alocada > 0),
    preco_no_momento   NUMERIC(10, 2) NOT NULL,
    PRIMARY KEY (id_reserva, id_material),
    CONSTRAINT fk_reserva_mat FOREIGN KEY (id_reserva) REFERENCES reserva(id_reserva) ON DELETE CASCADE,
    CONSTRAINT fk_material_res FOREIGN KEY (id_material) REFERENCES material(id_material)
);

CREATE TABLE parcela (
    id_reserva       INT NOT NULL,
    numero_parcela   INT NOT NULL,
    data_vencimento  DATE NOT NULL,
    valor_parcela    NUMERIC(10, 2) NOT NULL,
    status_pagamento VARCHAR(50) NOT NULL DEFAULT 'PENDENTE',
    data_pagamento   DATE,
    PRIMARY KEY (id_reserva, numero_parcela),
    CONSTRAINT fk_reserva_parcela FOREIGN KEY (id_reserva) REFERENCES reserva(id_reserva) ON DELETE CASCADE
);

-- ==========================================================
-- DADOS DE EXEMPLO
-- ==========================================================

-- Admin de teste: admin@ouroverde.com / 123456
INSERT INTO administrador (nome, email, senha) VALUES
    ('Administrador', 'admin@ouroverde.com', '123456');

INSERT INTO categoria_material (nome) VALUES
    ('Móveis'),
    ('Decoração'),
    ('Iluminação');

INSERT INTO material (id_categoria, nome, preco_unitario, quantidade_estoque, url_imagem) VALUES
    (1, 'Sofá Marrom Premium', 150.00, 10, 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80'),
    (1, 'Cadeira de Ferro', 15.00, 100, 'https://images.unsplash.com/photo-1506434304575-faa2220138dc?auto=format&fit=crop&w=800&q=80'),
    (1, 'Mesa de Madeira Rústica', 80.00, 20, 'https://images.unsplash.com/photo-1604578762246-41134e37f9cc?auto=format&fit=crop&w=800&q=80'),
    (2, 'Arranjo de Flores Brancas', 45.00, 30, 'https://images.unsplash.com/photo-1563241527-3004b7be0ffd?auto=format&fit=crop&w=800&q=80'),
    (3, 'Cortina de LED Cascata', 60.00, 15, 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=800&q=80');

-- O primeiro servico (preco 0) e usado quando o cliente so quer alugar materiais,
-- sem locar um espaco. Assim a reserva sempre tem um servico (regra do MER).
INSERT INTO servico (nome, descricao, preco_base, url_imagem) VALUES
    ('Somente Locação de Materiais', 'Aluguel apenas dos itens do carrinho, sem locação de espaço', 0.00, NULL),
    ('Salão Ouro', 'Salão principal climatizado para grandes eventos e casamentos', 1500.00, 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=800&q=80'),
    ('Espaço Jardim', 'Área externa arborizada, ideal para eventos diurnos', 800.00, 'https://images.unsplash.com/photo-1530103862676-de8c9de0f8db?auto=format&fit=crop&w=800&q=80'),
    ('Área de Churrasco', 'Espaço com piscina e churrasqueira para confraternizações', 500.00, 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=800&q=80');

-- Clientes de teste (senha: senha123)
INSERT INTO cliente (nome, cpf_cnpj, email, senha, cep, rua, numero, bairro, cidade) VALUES
    ('Maria Larissa', '111.222.333-44', 'larissa@email.com', 'senha123', '63700-000', 'Rua Doutor Moreira da Rocha', '100', 'Centro', 'Crateús'),
    ('João Pedro', '555.666.777-88', 'joao@email.com', 'senha123', '63700-000', 'Rua Firmino Rosa', '250', 'Fátima', 'Crateús'),
    ('Empresa Eventos S/A', '12.345.678/0001-90', 'contato@eventos.com', 'senha123', '63700-000', 'Av. Sargento Hermínio', '1500', 'São Vicente', 'Crateús');

INSERT INTO telefone_cliente (id_cliente, numero) VALUES
    (1, '(88) 99999-0001'),
    (2, '(88) 99999-0002'),
    (3, '(88) 3691-0000');
