def test_public_categories_only_return_active_items(client, db_session, admin_headers):
    response = client.post(
        "/api/admin/categories",
        headers=admin_headers,
        json={"name": "考研", "slug": "kaoyan", "sort_order": 1, "status": "active"},
    )
    active_id = response.json()["id"]
    client.post(
        "/api/admin/categories",
        headers=admin_headers,
        json={"name": "隐藏", "slug": "hidden", "sort_order": 2, "status": "hidden"},
    )

    response = client.get("/api/categories")

    assert response.status_code == 200
    assert response.json()["items"] == [
        {
            "id": active_id,
            "name": "考研",
            "slug": "kaoyan",
            "sort_order": 1,
            "status": "active",
        }
    ]


def test_category_slug_must_be_unique(client, admin_headers):
    payload = {"name": "考研", "slug": "kaoyan", "sort_order": 1, "status": "active"}
    client.post("/api/admin/categories", headers=admin_headers, json=payload)

    response = client.post("/api/admin/categories", headers=admin_headers, json=payload)

    assert response.status_code == 409


def test_category_delete_blocked_when_in_use(client, admin_headers):
    category = client.post(
        "/api/admin/categories",
        headers=admin_headers,
        json={"name": "软件", "slug": "software", "sort_order": 1, "status": "active"},
    ).json()
    client.post(
        "/api/admin/resources",
        headers=admin_headers,
        json={
            "title": "资源 A",
            "category_id": category["id"],
            "year": 2026,
            "description": "desc",
            "tags": "a,b",
            "links": [
                {
                    "platform_type": "quark",
                    "custom_title": "夸克主链",
                    "url": "https://pan.quark.cn/s/demo",
                }
            ],
            "status": "active",
        },
    )

    response = client.delete(f"/api/admin/categories/{category['id']}", headers=admin_headers)

    assert response.status_code == 409
