import requests

res = requests.post("http://localhost:8080/api/auth/login", json={"email": "admin@admin.com", "password": "123"})
token = res.json().get("access_token")

payload = {
    "name": "Teste Cliente",
    "document": "123.456.789-00",
    "phone": "3299999999",
    "email": "teste@teste.com",
    "person_type": "FISICA",
    "trade_name": "",
    "payment_deadline_days": 15,
    "active": True
}

res2 = requests.post(
    "http://localhost:8080/api/clients",
    json=payload,
    headers={"Authorization": f"Bearer {token}"}
)

print(res2.status_code)
print(res2.text)
