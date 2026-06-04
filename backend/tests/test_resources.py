def seed_category(client, admin_headers):
    response = client.post(
        "/api/admin/categories",
        headers=admin_headers,
        json={"name": "课程", "slug": "course", "sort_order": 1, "status": "active"},
    )
    return response.json()


def sample_links():
    return [
        {
            "platform_type": "quark",
            "custom_title": "夸克主链",
            "url": "https://pan.quark.cn/s/demo",
        },
        {
            "platform_type": "baidu",
            "custom_title": "百度备用",
            "url": None,
        },
    ]


def test_public_resources_only_return_active_items(client, admin_headers):
    category = seed_category(client, admin_headers)
    client.post(
        "/api/admin/resources",
        headers=admin_headers,
        json={
            "title": "可见资源",
            "category_id": category["id"],
            "year": 2026,
            "description": "包含 PDF 资料",
            "tags": "pdf,课程",
            "links": sample_links(),
            "status": "active",
        },
    )
    client.post(
        "/api/admin/resources",
        headers=admin_headers,
        json={
            "title": "隐藏资源",
            "category_id": category["id"],
            "year": 2025,
            "description": "隐藏",
            "tags": "hidden",
            "links": sample_links(),
            "status": "hidden",
        },
    )

    response = client.get("/api/resources")

    assert response.status_code == 200
    payload = response.json()
    assert payload["total"] == 1
    assert payload["items"][0]["title"] == "可见资源"
    assert payload["items"][0]["year"] == 2026
    assert payload["items"][0]["copy_count_total"] == 0
    assert payload["items"][0]["links"][0]["copy_count"] == 0


def test_public_resources_can_search_by_keyword(client, admin_headers):
    category = seed_category(client, admin_headers)
    client.post(
        "/api/admin/resources",
        headers=admin_headers,
        json={
            "title": "考研英语 PDF",
            "category_id": category["id"],
            "year": 2027,
            "description": "红宝书资料合集",
            "tags": "考研,英语",
            "links": sample_links(),
            "status": "active",
        },
    )

    response = client.get("/api/resources", params={"keyword": "红宝书"})

    assert response.status_code == 200
    assert response.json()["total"] == 1


def test_resource_detail_rejects_non_active_resources(client, admin_headers):
    category = seed_category(client, admin_headers)
    resource = client.post(
        "/api/admin/resources",
        headers=admin_headers,
        json={
            "title": "隐藏资源",
            "category_id": category["id"],
            "year": 2024,
            "description": "desc",
            "tags": "hidden",
            "links": sample_links(),
            "status": "hidden",
        },
    ).json()

    response = client.get(f"/api/resources/{resource['id']}")

    assert response.status_code == 404


def test_resource_requires_valid_four_digit_year(client, admin_headers):
    category = seed_category(client, admin_headers)

    missing_year = client.post(
        "/api/admin/resources",
        headers=admin_headers,
        json={
            "title": "缺少年份",
            "category_id": category["id"],
            "description": "desc",
            "tags": "tag",
            "links": sample_links(),
            "status": "active",
        },
    )
    invalid_year = client.post(
        "/api/admin/resources",
        headers=admin_headers,
        json={
            "title": "非法年份",
            "category_id": category["id"],
            "year": 99,
            "description": "desc",
            "tags": "tag",
            "links": sample_links(),
            "status": "active",
        },
    )

    assert missing_year.status_code == 422
    assert invalid_year.status_code == 422


def test_public_and_admin_resources_can_filter_by_year(client, admin_headers):
    category = seed_category(client, admin_headers)
    client.post(
        "/api/admin/resources",
        headers=admin_headers,
        json={
            "title": "2026 资源",
            "category_id": category["id"],
            "year": 2026,
            "description": "desc",
            "tags": "tag",
            "links": sample_links(),
            "status": "active",
        },
    )
    client.post(
        "/api/admin/resources",
        headers=admin_headers,
        json={
            "title": "2025 资源",
            "category_id": category["id"],
            "year": 2025,
            "description": "desc",
            "tags": "tag",
            "links": sample_links(),
            "status": "active",
        },
    )

    public_response = client.get("/api/resources", params={"year": 2026})
    admin_response = client.get("/api/admin/resources", headers=admin_headers, params={"year": 2025})

    assert public_response.status_code == 200
    assert public_response.json()["total"] == 1
    assert public_response.json()["items"][0]["title"] == "2026 资源"
    assert admin_response.status_code == 200
    assert admin_response.json()["total"] == 1
    assert admin_response.json()["items"][0]["title"] == "2025 资源"


def test_admin_can_update_and_delete_resources(client, admin_headers):
    category = seed_category(client, admin_headers)
    resource = client.post(
        "/api/admin/resources",
        headers=admin_headers,
        json={
            "title": "原始资源",
            "category_id": category["id"],
            "year": 2023,
            "description": "desc",
            "tags": "tag",
            "links": sample_links(),
            "status": "active",
        },
    ).json()

    update_response = client.put(
        f"/api/admin/resources/{resource['id']}",
        headers=admin_headers,
        json={
            "title": "已更新资源",
            "category_id": category["id"],
            "year": 2024,
            "description": "new desc",
            "tags": "tag,new",
            "links": [
                {
                    "platform_type": "xunlei",
                    "custom_title": "迅雷更新链",
                    "url": "https://pan.xunlei.com/s/updated",
                }
            ],
            "status": "expired",
        },
    )
    delete_response = client.delete(
        f"/api/admin/resources/{resource['id']}",
        headers=admin_headers,
    )

    assert update_response.status_code == 200
    assert update_response.json()["title"] == "已更新资源"
    assert update_response.json()["year"] == 2024
    assert update_response.json()["links"][0]["platform_type"] == "xunlei"
    assert delete_response.status_code == 204


def test_resource_links_allow_multiple_platforms_and_optional_url(client, admin_headers):
    category = seed_category(client, admin_headers)

    create_response = client.post(
        "/api/admin/resources",
        headers=admin_headers,
        json={
            "title": "多平台资源",
            "category_id": category["id"],
            "year": 2026,
            "description": "desc",
            "tags": "tag",
            "links": sample_links(),
            "status": "active",
        },
    )

    assert create_response.status_code == 201
    payload = create_response.json()
    assert len(payload["links"]) == 2
    assert payload["links"][0]["platform_type"] == "quark"
    assert payload["links"][0]["custom_title"] == "夸克主链"
    assert payload["links"][0]["copy_count"] == 0
    assert payload["links"][1]["platform_type"] == "baidu"
    assert payload["links"][1]["url"] is None
    assert payload["copy_count_total"] == 0


def test_public_resource_link_copy_count_can_increment(client, admin_headers):
    category = seed_category(client, admin_headers)
    resource = client.post(
        "/api/admin/resources",
        headers=admin_headers,
        json={
            "title": "可复制资源",
            "category_id": category["id"],
            "year": 2026,
            "description": "desc",
            "tags": "tag",
            "links": sample_links(),
            "status": "active",
        },
    ).json()
    link_id = resource["links"][0]["id"]

    copy_response = client.post(f"/api/resources/{resource['id']}/links/{link_id}/copy")
    detail_response = client.get(f"/api/resources/{resource['id']}")

    assert copy_response.status_code == 200
    assert copy_response.json() == {"link_id": link_id, "copy_count": 1}
    assert detail_response.status_code == 200
    assert detail_response.json()["copy_count_total"] == 1
    assert detail_response.json()["links"][0]["copy_count"] == 1


def test_public_resource_link_copy_count_rejects_mismatched_link(client, admin_headers):
    category = seed_category(client, admin_headers)
    first_resource = client.post(
        "/api/admin/resources",
        headers=admin_headers,
        json={
            "title": "资源一",
            "category_id": category["id"],
            "year": 2026,
            "description": "desc",
            "tags": "tag",
            "links": sample_links(),
            "status": "active",
        },
    ).json()
    second_resource = client.post(
        "/api/admin/resources",
        headers=admin_headers,
        json={
            "title": "资源二",
            "category_id": category["id"],
            "year": 2025,
            "description": "desc",
            "tags": "tag",
            "links": sample_links(),
            "status": "active",
        },
    ).json()

    response = client.post(f"/api/resources/{first_resource['id']}/links/{second_resource['links'][0]['id']}/copy")

    assert response.status_code == 404


def test_public_resource_link_copy_count_rejects_non_active_resource(client, admin_headers):
    category = seed_category(client, admin_headers)
    resource = client.post(
        "/api/admin/resources",
        headers=admin_headers,
        json={
            "title": "隐藏复制资源",
            "category_id": category["id"],
            "year": 2024,
            "description": "desc",
            "tags": "tag",
            "links": sample_links(),
            "status": "hidden",
        },
    ).json()

    response = client.post(f"/api/resources/{resource['id']}/links/{resource['links'][0]['id']}/copy")

    assert response.status_code == 404


def test_admin_resource_update_preserves_existing_link_copy_count(client, admin_headers):
    category = seed_category(client, admin_headers)
    resource = client.post(
        "/api/admin/resources",
        headers=admin_headers,
        json={
            "title": "可编辑资源",
            "category_id": category["id"],
            "year": 2026,
            "description": "desc",
            "tags": "tag",
            "links": sample_links(),
            "status": "active",
        },
    ).json()
    first_link = resource["links"][0]
    client.post(f"/api/resources/{resource['id']}/links/{first_link['id']}/copy")

    update_response = client.put(
        f"/api/admin/resources/{resource['id']}",
        headers=admin_headers,
        json={
            "title": "可编辑资源",
            "category_id": category["id"],
            "year": 2026,
            "description": "new desc",
            "tags": "tag,new",
            "links": [
                {
                    "id": first_link["id"],
                    "platform_type": "quark",
                    "custom_title": "夸克主链-更新",
                    "url": "https://pan.quark.cn/s/demo-updated",
                    "sort_order": 0,
                }
            ],
            "status": "active",
        },
    )

    assert update_response.status_code == 200
    assert update_response.json()["links"][0]["copy_count"] == 1
    assert update_response.json()["copy_count_total"] == 1
