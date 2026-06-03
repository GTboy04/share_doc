def test_login_returns_token_for_valid_credentials(client, admin_user):
    response = client.post(
        "/api/admin/auth/login",
        json={"username": admin_user.username, "password": "password123"},
    )

    assert response.status_code == 200
    assert response.json()["access_token"]
    assert response.json()["token_type"] == "bearer"


def test_login_rejects_invalid_password(client, admin_user):
    response = client.post(
        "/api/admin/auth/login",
        json={"username": admin_user.username, "password": "wrong"},
    )

    assert response.status_code == 401


def test_me_requires_authenticated_admin(client):
    response = client.get("/api/admin/auth/me")

    assert response.status_code == 401


def test_me_returns_current_admin(client, admin_headers):
    response = client.get("/api/admin/auth/me", headers=admin_headers)

    assert response.status_code == 200
    assert response.json()["username"] == "admin"
