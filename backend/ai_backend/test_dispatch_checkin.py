import httpx

url = "http://localhost:8000/agent/dispatch"

payload = {
    "user_id": "test-user-001",
    "intent": "pricing",
    "context": {
        "user_id": "test-user-001",
        "property_id": "property-001",
        "current_price": 120.0,
        "occupancy_rate": 0.65,
        "competitor_prices": [110.0, 115.0, 130.0],
        "seasonality_factor": 1.2
    }
}

response = httpx.post(url, json=payload)

print("✅ STATUS:", response.status_code)
print("📦 RESPONSE:", response.json())
