import httpx

url = "http://127.0.0.1:8000/agent/automations/test-user-001"

response = httpx.get(url)

print("✅ STATUS:", response.status_code)
print("📋 Automazioni disponibili:")
for auto in response.json().get("automations", []):
    print(f"🔧 {auto['title']} ({auto['id']})")
    print(f"   - Piano: {', '.join(auto['available_in'])}")
    print(f"   - Attiva: {'✅' if auto['enabled'] else '❌'}")
    print(f"   - Toggle: {'🟢' if auto['canToggle'] else '🔒'}")
    print()
