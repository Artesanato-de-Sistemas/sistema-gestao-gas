"""
scan_schema.py — Mapeamento completo do schema atual do Supabase
"""
import os, re, json
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
}

# 1. OpenAPI spec (tabelas e colunas)
print("\n=== SCHEMA VIA OPENAPI ===")
r = httpx.get(f"{BASE}/rest/v1/", headers=HEADERS, timeout=15)
spec = r.json()
paths = spec.get("paths", {})
defs  = spec.get("definitions", {})

tables = {}
for path, methods in paths.items():
    tbl = path.lstrip("/")
    if not tbl or "rpc" in tbl:
        continue
    get_info = methods.get("get", {})
    params = [p["name"] for p in get_info.get("parameters", []) if p.get("in") == "query" and p["name"] not in ("order","limit","offset","select")]
    tables[tbl] = params

for tbl, cols in sorted(tables.items()):
    print(f"\n  TABLE: {tbl}")
    if cols:
        print(f"    cols: {', '.join(cols)}")

# 2. Pegar 1 row de cada tabela para ver colunas reais
print("\n\n=== COLUNAS REAIS (primeiro registro) ===")
for tbl in sorted(tables.keys()):
    r2 = httpx.get(f"{BASE}/rest/v1/{tbl}?limit=1", headers=HEADERS, timeout=10)
    if r2.status_code == 200 and r2.json():
        cols = list(r2.json()[0].keys())
        print(f"  {tbl}: {cols}")
    elif r2.status_code == 200:
        print(f"  {tbl}: [] (vazia)")
    else:
        print(f"  {tbl}: ERRO {r2.status_code}")

print("\nDone.")
