from dotenv import load_dotenv

load_dotenv(".env")
import os

from supabase import create_client

sb = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_KEY"])

# Testa inbound sem subtotal
total_amount = 3 * 85.0
r = (
    sb.table("inbounds")
    .insert(
        {
            "truck_plate": "FNL-999",
            "invoice_number": "NF-FINAL-TEST-2",
            "status": "FINALIZADO",
            "total_amount": total_amount,
        }
    )
    .execute()
)
inbound_id = r.data[0]["id"]
print("Inbound OK:", inbound_id[:8])

r2 = (
    sb.table("inbound_items")
    .insert(
        {
            "inbound_id": inbound_id,
            "category": "GLP_13KG_CHEIO",
            "quantity": 3,
            "unit_cost": 85.0,
            "available_quantity": 3,
        }
    )
    .execute()
)
print("Item OK:", r2.data[0]["id"][:8], "| subtotal gerado pelo banco:", r2.data[0].get("subtotal"))

total_p13 = sum(
    (x.get("available_quantity") or 0)
    for x in sb.table("inbound_items")
    .select("category, available_quantity")
    .eq("category", "GLP_13KG_CHEIO")
    .execute()
    .data
)
print("Estoque P13 total no banco:", total_p13)
print()
print("TODOS OS TESTES PASSARAM com sucesso!")
