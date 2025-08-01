# tests/test_main.py
from fastapi.testclient import TestClient
import sys
print(sys.path)  # see where Python is looking
from app.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Content Generator Backend is running!"}

def test_protected_route_requires_auth():
    response = client.get("/templates/")
    assert response.status_code in [401, 403]  # Depending on your auth response

def test_root():
    response = client.get("/")
    assert response.status_code == 200

def test_add_memory():
    token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0dXNlciIsInJvbGUiOiJWaWV3ZXIiLCJleHAiOjE3NTE4ODkyODV9.xUOGGqyPZy2Q7HHM-X86UJjAKWWwxwI7Bi-U1mJT_08"
    payload = {
        "text": "This is a test memory from test_main.py"
    }
    response = client.post(
        "/memory/add",
        json=payload,
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "faiss_id" in data
    assert data["message"] == "Memory added"
