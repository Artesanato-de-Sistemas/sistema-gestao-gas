import requests

res = requests.post("http://localhost:8080/api/auth/login", json={"email": "admin@admin.com", "password": "123"})
token = res.json().get("access_token")

res2 = requests.get(
    "http://localhost:8080/api/clients",
    headers={"Authorization": f"Bearer {token}"}
)

print(res2.status_code)
print(res2.text)
