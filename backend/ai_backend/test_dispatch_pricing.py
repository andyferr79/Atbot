import httpx

url = "http://127.0.0.1:8000/agent/dispatch"

payload = {
    "user_id": "test-user-001",
    "intent": "pricing",
    "context": {
        "user_id": "test-user-001",
        "property_id": "property-001",
        "current_price": 100,
        "occupancy_rate": 0.65,
        "competitor_prices": [95.0, 100.0, 102.5],
        "seasonality_factor": 1.2
    }
}

response = httpx.post(url, json=payload)

print(f"\n✅ STATUS: {response.status_code}")
print(f"📦 RESPONSE: {response.json()}")
