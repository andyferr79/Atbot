import httpx

url = "http://localhost:8000/agent/dispatch"

payload = {
    "user_id": "test-user-001",
    "intent": "report",
    "context": {
        "session_id": "test-session-123",
        "content": "Questo è un report generato automaticamente dal test."
    }
}

response = httpx.post(url, json=payload)

print("✅ STATUS:", response.status_code)
print("📦 RESPONSE:", response.json())
