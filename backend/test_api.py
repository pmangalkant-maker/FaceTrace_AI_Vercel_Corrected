"""
Automated Python test suite for FaceTrace AI FastAPI backend.
Run with: pytest backend/test_api.py
"""
import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "disclaimer" in data

def test_list_cases_endpoint():
    response = client.get("/api/cases")
    assert response.status_code == 200
    data = response.json()
    assert "cases" in data
    assert "total" in data

if __name__ == "__main__":
    pytest.main(["-v", __file__])
