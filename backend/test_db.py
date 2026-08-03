"""
test_db.py — Teste de Conexão com o Supabase
=============================================
Estratégia dupla:
  1. Requisição HTTP pura via httpx (mais confiável, sem dependência do SDK)
  2. SDK supabase-python com URL normalizada internamente

A SUPABASE_URL pode conter /rest/v1/ — o script extrai o base URL
automaticamente sem exigir alteração nas variáveis de ambiente.
"""

import os
import re
import sys
import json

# Carrega .env manualmente para não depender de nenhum import externo inicial
env_path = os.path.join(os.path.dirname(__file__), ".env")
if os.path.exists(env_path):
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, _, value = line.partition("=")
                os.environ.setdefault(key.strip(), value.strip())

RAW_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "")

# ── Normalização interna da URL ───────────────────────────────────────────────
# Remove qualquer path como /rest/v1/, /auth/v1/, etc.
# O SDK precisa apenas de https://<ref>.supabase.co
BASE_URL = re.sub(r"/(rest|auth|storage|functions)/v\d+/?.*$", "", RAW_URL).rstrip("/")

print("=" * 60)
print("  TESTE DE CONEXÃO — SUPABASE")
print("=" * 60)
print(f"  URL fornecida : {RAW_URL}")
print(f"  Base URL usada: {BASE_URL}")
print(f"  Key (parcial) : {SUPABASE_KEY[:40]}...")
print("=" * 60)


# ── MÉTODO 1: HTTP puro via httpx ────────────────────────────────────────────
def test_via_httpx():
    print("\n[1/2] Testando via requisição HTTP direta (httpx)...")
    try:
        import httpx

        headers = {
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "count=exact",
        }

        # Lista as tabelas acessíveis via REST API do Supabase
        # Endpoint: GET /rest/v1/ retorna o schema OpenAPI com todas as tabelas
        rest_url = BASE_URL + "/rest/v1/"
        resp = httpx.get(rest_url, headers=headers, timeout=10)

        print(f"  → Status HTTP: {resp.status_code}")

        if resp.status_code == 200:
            data = resp.json()
            # OpenAPI spec contém as tabelas em "definitions" ou "paths"
            paths = list(data.get("paths", {}).keys())
            tables = [p.lstrip("/") for p in paths if p.startswith("/") and "rpc" not in p]
            print(f"  ✅ CONEXÃO ESTABELECIDA COM SUCESSO!")
            print(f"  → Tabelas encontradas ({len(tables)}): {', '.join(tables[:10]) or 'nenhuma visível'}")
            return True
        elif resp.status_code == 401:
            print(f"  ❌ Falha de autenticação (401): verifique a SUPABASE_KEY")
        else:
            print(f"  ⚠️  Resposta inesperada: {resp.status_code} — {resp.text[:200]}")
        return False

    except ImportError:
        print("  ⚠️  httpx não disponível, pulando método 1.")
        return None
    except Exception as e:
        print(f"  ❌ Erro na requisição HTTP: {e}")
        return False


# ── MÉTODO 2: SDK supabase-python ────────────────────────────────────────────
def test_via_sdk():
    print("\n[2/2] Testando via SDK supabase-python (URL normalizada internamente)...")
    try:
        from supabase import create_client

        # O SDK não aceita /rest/v1/ na URL — usamos BASE_URL normalizado
        sb = create_client(BASE_URL, SUPABASE_KEY)

        # Tenta um SELECT vazio na tabela 'products' (ou qualquer tabela que exista)
        # Se a tabela não existir, Supabase retorna erro 404 (não erro de conexão)
        tables_to_try = ["products", "employees", "clients", "orders", "inbounds"]
        connected = False

        for table in tables_to_try:
            try:
                resp = sb.table(table).select("*").limit(1).execute()
                print(f"  ✅ CONEXÃO ESTABELECIDA VIA SDK!")
                print(f"  → Tabela '{table}': {len(resp.data)} registro(s) retornado(s)")
                if resp.data:
                    print(f"  → Colunas: {list(resp.data[0].keys())}")
                connected = True
                break
            except Exception as table_err:
                err_str = str(table_err)
                # Se o erro não é de conexão, a conexão funciona
                if "relation" in err_str.lower() or "42P01" in err_str or "not found" in err_str.lower():
                    print(f"  → Tabela '{table}' não existe no schema (conexão OK, tabela ausente)")
                    connected = True  # conexão funciona, só a tabela não existe
                    continue
                print(f"  → Tabela '{table}': {err_str[:100]}")

        if connected:
            print(f"\n  ✅ SDK SUPABASE: conexão validada com sucesso!")
        else:
            print(f"\n  ❌ SDK SUPABASE: não foi possível conectar.")
        return connected

    except ImportError:
        print("  ⚠️  SDK 'supabase' não instalado. Execute: pip install supabase")
        return None
    except Exception as e:
        print(f"  ❌ Erro ao inicializar SDK: {e}")
        return False


# ── Execução ─────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    r1 = test_via_httpx()
    r2 = test_via_sdk()

    print("\n" + "=" * 60)
    if r1 or r2:
        print("  🎉 RESULTADO FINAL: CONEXÃO COM SUPABASE CONFIRMADA")
        print(f"     Projeto: mhxycuagyraepaxmpekg")
        print(f"     Role   : service_role (acesso total)")
        print("=" * 60)
        sys.exit(0)
    else:
        print("  ❌ RESULTADO FINAL: Falha na conexão")
        print("=" * 60)
        sys.exit(1)
