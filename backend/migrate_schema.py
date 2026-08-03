"""
migrate_schema.py — Migração do banco Supabase
Executa as DDL via /rest/v1/rpc/exec_sql ou via pg_dump workaround.

Como o Supabase não expõe DDL direto via REST, usamos o endpoint
de RPC para executar SQL arbitrário com service_role.
"""
import os, re, json, sys
import httpx

env_path = os.path.join(os.path.dirname(__file__), ".env")
if os.path.exists(env_path):
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, _, v = line.partition("=")
                os.environ.setdefault(k.strip(), v.strip())

RAW_URL = os.environ["SUPABASE_URL"]
KEY     = os.environ["SUPABASE_KEY"]
BASE    = re.sub(r"/(rest|auth|storage|functions)/v\d+/?.*$", "", RAW_URL).rstrip("/")

HEADERS = {
    "apikey": KEY,
    "Authorization": f"Bearer {KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation",
}


def exec_sql(sql: str, label: str = "") -> dict:
    """Executa SQL via função RPC exec_sql (precisa existir no Supabase)."""
    r = httpx.post(
        f"{BASE}/rest/v1/rpc/exec_sql",
        headers=HEADERS,
        json={"sql": sql},
        timeout=30,
    )
    status = "✅" if r.status_code in (200, 204) else "❌"
    print(f"  {status} [{r.status_code}] {label}")
    if r.status_code not in (200, 204):
        print(f"     → {r.text[:300]}")
    return {"status": r.status_code, "body": r.text}


# ── Migração em etapas ────────────────────────────────────────────────────────

MIGRATIONS = [

    # ── ETAPA 1: Adicionar colunas diretas em clients ─────────────────────────
    ("ADD clients.name",
     """ALTER TABLE clients ADD COLUMN IF NOT EXISTS name TEXT;"""),

    ("ADD clients.document",
     """ALTER TABLE clients ADD COLUMN IF NOT EXISTS document TEXT;"""),

    ("ADD clients.phone",
     """ALTER TABLE clients ADD COLUMN IF NOT EXISTS phone TEXT;"""),

    ("ADD clients.trade_name",
     """ALTER TABLE clients ADD COLUMN IF NOT EXISTS trade_name TEXT;"""),

    ("ADD clients.person_type",
     """ALTER TABLE clients ADD COLUMN IF NOT EXISTS person_type TEXT DEFAULT 'FISICA';"""),

    # ── ETAPA 2: Popular clients com dados de people ──────────────────────────
    ("POPULATE clients from people",
     """
     UPDATE clients c
     SET
       name        = p.name,
       document    = p.document,
       phone       = p.phone,
       trade_name  = p.trade_name,
       person_type = COALESCE(p.person_type::text, 'FISICA')
     FROM people p
     WHERE c.person_id = p.id;
     """),

    # ── ETAPA 3: Reestruturar delivery_drivers ────────────────────────────────
    ("ADD delivery_drivers.name",
     """ALTER TABLE delivery_drivers ADD COLUMN IF NOT EXISTS name TEXT;"""),

    ("ADD delivery_drivers.document",
     """ALTER TABLE delivery_drivers ADD COLUMN IF NOT EXISTS document TEXT;"""),

    ("ADD delivery_drivers.phone",
     """ALTER TABLE delivery_drivers ADD COLUMN IF NOT EXISTS phone TEXT;"""),

    ("ADD delivery_drivers.commission_percentage",
     """ALTER TABLE delivery_drivers ADD COLUMN IF NOT EXISTS commission_percentage NUMERIC(5,2) DEFAULT 0;"""),

    ("ADD delivery_drivers.active",
     """ALTER TABLE delivery_drivers ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT TRUE;"""),

    ("ADD delivery_drivers.created_at",
     """ALTER TABLE delivery_drivers ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();"""),

    # ── ETAPA 4: Reestruturar users ───────────────────────────────────────────
    ("ADD users.name",
     """ALTER TABLE users ADD COLUMN IF NOT EXISTS name TEXT;"""),

    ("ADD users.password_hash",
     """ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;"""),

    ("POPULATE users.name from people",
     """
     UPDATE users u
     SET name = p.name
     FROM people p
     WHERE u.person_id = p.id AND u.name IS NULL;
     """),

    # ── ETAPA 5: Adicionar client_id em addresses ─────────────────────────────
    ("ADD addresses.client_id",
     """ALTER TABLE addresses ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id);"""),

    ("ADD addresses.street",
     """ALTER TABLE addresses ADD COLUMN IF NOT EXISTS street TEXT;"""),

    ("ADD addresses.number",
     """ALTER TABLE addresses ADD COLUMN IF NOT EXISTS number TEXT;"""),

    ("ADD addresses.neighborhood",
     """ALTER TABLE addresses ADD COLUMN IF NOT EXISTS neighborhood TEXT;"""),

    ("ADD addresses.city",
     """ALTER TABLE addresses ADD COLUMN IF NOT EXISTS city TEXT;"""),

    ("ADD addresses.state",
     """ALTER TABLE addresses ADD COLUMN IF NOT EXISTS state TEXT;"""),

    ("ADD addresses.zip_code",
     """ALTER TABLE addresses ADD COLUMN IF NOT EXISTS zip_code TEXT;"""),

    # ── ETAPA 6: Adicionar products table (necessária para o catálogo) ────────
    ("CREATE TABLE products IF NOT EXISTS",
     """
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
     """),

    # ── ETAPA 7: Adicionar stock_movements table ──────────────────────────────
    ("CREATE TABLE stock_movements IF NOT EXISTS",
     """
     CREATE TABLE IF NOT EXISTS stock_movements (
       id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       product_id     UUID REFERENCES products(id),
       movement_type  TEXT NOT NULL CHECK (movement_type IN ('ENTRADA','SAIDA','AJUSTE')),
       quantity       INTEGER NOT NULL,
       notes          TEXT,
       created_at     TIMESTAMPTZ DEFAULT NOW()
     );
     """),

    # ── ETAPA 8: Adicionar employees table ───────────────────────────────────
    ("CREATE TABLE employees IF NOT EXISTS",
     """
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
     """),

]

print("=" * 60)
print("  MIGRAÇÃO DO SCHEMA — SUPABASE")
print("=" * 60)
print(f"\n  Projeto: mhxycuagyraepaxmpekg")
print(f"  Etapas : {len(MIGRATIONS)}\n")

success = 0
failed  = 0

for label, sql in MIGRATIONS:
    result = exec_sql(sql.strip(), label)
    if result["status"] in (200, 204):
        success += 1
    else:
        failed += 1

print(f"\n{'='*60}")
print(f"  Resultado: {success} OK | {failed} FALHOU")
print(f"{'='*60}")

if failed > 0:
    print("\n⚠️  Algumas etapas falharam (provavelmente exec_sql RPC não existe).")
    print("   Gerando SQL para execução manual no Supabase SQL Editor...")
    all_sql = "\n\n".join(sql for _, sql in MIGRATIONS)
    with open("migration.sql", "w") as f:
        f.write("-- Migration gerada automaticamente\n\n")
        f.write(all_sql)
    print("   → Arquivo 'migration.sql' criado.")
    sys.exit(1)

print("\n✅ Migração concluída com sucesso!")
