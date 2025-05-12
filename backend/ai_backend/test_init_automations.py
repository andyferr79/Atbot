import httpx

url = "http://127.0.0.1:8000/agent/automations/init"

payload = {
    "user_id": "test-user-001",
    "plan": "gold"
}

response = httpx.post(url, params=payload)

print("✅ STATUS:", response.status_code)
print("📦 RESPONSE:", response.json())
