-- ============================================================
-- MIGRAÇÃO: Simplificação e Desacoplamento do Schema
-- Projeto: mhxycuagyraepaxmpekg (Império do Gás)
-- Aplicar em: Supabase Dashboard → SQL Editor
-- ============================================================

-- ── ETAPA 1: Flatten clients (adicionar colunas diretas) ─────────────────────
ALTER TABLE clients ADD COLUMN IF NOT EXISTS name         TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS document     TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS phone        TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS trade_name   TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS person_type  TEXT DEFAULT 'FISICA';

-- Migrar dados da tabela people → clients
UPDATE clients c
SET
  name        = p.name,
  document    = p.document,
  phone       = p.phone,
  trade_name  = p.trade_name,
  person_type = COALESCE(p.person_type::text, 'FISICA')
FROM people p
WHERE c.person_id = p.id;

-- ── ETAPA 2: Reestruturar delivery_drivers ────────────────────────────────────
ALTER TABLE delivery_drivers ADD COLUMN IF NOT EXISTS name                  TEXT;
ALTER TABLE delivery_drivers ADD COLUMN IF NOT EXISTS document               TEXT;
ALTER TABLE delivery_drivers ADD COLUMN IF NOT EXISTS phone                  TEXT;
ALTER TABLE delivery_drivers ADD COLUMN IF NOT EXISTS commission_percentage  NUMERIC(5,2) DEFAULT 0;
ALTER TABLE delivery_drivers ADD COLUMN IF NOT EXISTS active                 BOOLEAN DEFAULT TRUE;
ALTER TABLE delivery_drivers ADD COLUMN IF NOT EXISTS created_at             TIMESTAMPTZ DEFAULT NOW();

-- Migrar dados de people para delivery_drivers (onde existir relação via orders)
-- (Se delivery_drivers tiver person_id, migrar de lá)
-- ALTER TABLE delivery_drivers ADD COLUMN IF NOT EXISTS person_id UUID;  -- só se não existir
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'delivery_drivers' AND column_name = 'person_id'
  ) THEN
    UPDATE delivery_drivers dd
    SET
      name     = p.name,
      document = p.document,
      phone    = p.phone
    FROM people p
    WHERE dd.person_id = p.id AND dd.name IS NULL;
  END IF;
END $$;

-- ── ETAPA 3: Flatten users ────────────────────────────────────────────────────
ALTER TABLE users ADD COLUMN IF NOT EXISTS name          TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;

UPDATE users u
SET name = p.name
FROM people p
WHERE u.person_id = p.id AND u.name IS NULL;

-- ── ETAPA 4: Adicionar client_id em addresses ─────────────────────────────────
ALTER TABLE addresses ADD COLUMN IF NOT EXISTS client_id     UUID REFERENCES clients(id);
ALTER TABLE addresses ADD COLUMN IF NOT EXISTS street        TEXT;
ALTER TABLE addresses ADD COLUMN IF NOT EXISTS number        TEXT;
ALTER TABLE addresses ADD COLUMN IF NOT EXISTS neighborhood  TEXT;
ALTER TABLE addresses ADD COLUMN IF NOT EXISTS city          TEXT;
ALTER TABLE addresses ADD COLUMN IF NOT EXISTS state         TEXT;
ALTER TABLE addresses ADD COLUMN IF NOT EXISTS zip_code      TEXT;

-- ── ETAPA 5: Criar tabela products ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name           TEXT NOT NULL,
  category       TEXT,
  current_price  NUMERIC(10,2) DEFAULT 0,
  stock_quantity INTEGER DEFAULT 0,
  active         BOOLEAN DEFAULT TRUE,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ── ETAPA 6: Criar tabela stock_movements ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS stock_movements (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id     UUID REFERENCES products(id),
  movement_type  TEXT NOT NULL CHECK (movement_type IN ('ENTRADA','SAIDA','AJUSTE')),
  quantity       INTEGER NOT NULL,
  notes          TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ── ETAPA 7: Criar tabela employees ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS employees (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  document    TEXT,
  phone       TEXT,
  email       TEXT,
  role        TEXT NOT NULL CHECK (role IN ('ENTREGADOR','SECRETARIO')),
  active      BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── ETAPA 8: Adicionar product_id em order_items ─────────────────────────────
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id);

-- ── ETAPA 9: Adicionar campo sale_type em orders (se não existir) ─────────────
-- (orders já tem sale_type conforme scan)

-- ── ETAPA 10: Seed de produtos iniciais (catálogo padrão gás) ─────────────────
INSERT INTO products (name, category, current_price, stock_quantity, active)
VALUES
  ('Botijão P13 (Cheio)',  'BOTIJAO', 115.00, 0, TRUE),
  ('Botijão P20 (Cheio)',  'BOTIJAO', 180.00, 0, TRUE),
  ('Cilindro P45 (Cheio)', 'CILINDRO', 450.00, 0, TRUE),
  ('Casco P13 (Vazio)',    'CASCO',    0.00,  0, TRUE)
ON CONFLICT DO NOTHING;

-- ── ETAPA 11: Habilitar RLS policies para service_role (acesso total) ─────────
ALTER TABLE products        ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees       ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "service_role full access products"
  ON products FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "service_role full access stock_movements"
  ON stock_movements FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "service_role full access employees"
  ON employees FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ── VERIFICAÇÃO FINAL ─────────────────────────────────────────────────────────
SELECT
  'clients'         AS tabela, count(*) FROM clients
UNION ALL SELECT 'delivery_drivers', count(*) FROM delivery_drivers
UNION ALL SELECT 'products',         count(*) FROM products
UNION ALL SELECT 'employees',        count(*) FROM employees
UNION ALL SELECT 'orders',           count(*) FROM orders;