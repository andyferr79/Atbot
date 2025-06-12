from ai_backend.ai_server import app

import pytest
from fastapi.testclient import TestClient
from ai_backend.ai_server import app

client = TestClient(app)

def test_chat_endpoint():
    payload = {
        "user_message": "Ciao, fammi un esempio di report.",
        "session_id": "test-session-id",
        "user_id": "test-user-id"
    }

    response = client.post("/chat", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "response" in data
    assert isinstance(data["response"], str)
    assert len(data["response"]) > 0
