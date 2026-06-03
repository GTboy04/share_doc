import logging
from contextlib import contextmanager

from fastapi.testclient import TestClient

from app.main import create_app
from app.core.logging import configure_application_logging


class ListHandler(logging.Handler):
    def __init__(self) -> None:
        super().__init__()
        self.records: list[logging.LogRecord] = []

    def emit(self, record: logging.LogRecord) -> None:
        self.records.append(record)


@contextmanager
def capture_app_logs():
    app_logger = logging.getLogger("app")
    handler = ListHandler()
    previous_level = app_logger.level
    app_logger.addHandler(handler)
    app_logger.setLevel(logging.INFO)
    try:
        yield handler.records
    finally:
        app_logger.removeHandler(handler)
        app_logger.setLevel(previous_level)


def test_public_request_submission_creates_pending_request(client):
    response = client.post(
        "/api/requests",
        json={
            "title": "求 Python 资料",
            "description": "想找一套 Python 实战教程",
            "contact_email": "user@example.com",
            "contact_text": "微信: demo",
        },
    )

    assert response.status_code == 201
    assert response.json()["status"] == "pending"


def test_public_request_requires_valid_email_when_present(client):
    response = client.post(
        "/api/requests",
        json={
            "title": "求资料",
            "description": "desc",
            "contact_email": "bad-email",
            "contact_text": "",
        },
    )

    assert response.status_code == 422


def test_admin_can_update_request_status_and_note(client, admin_headers):
    request_payload = client.post(
        "/api/requests",
        json={
            "title": "求资料",
            "description": "desc",
            "contact_email": "user@example.com",
            "contact_text": "QQ 12345",
        },
    ).json()

    response = client.put(
        f"/api/admin/requests/{request_payload['id']}",
        headers=admin_headers,
        json={"status": "processing", "admin_note": "处理中"},
    )

    assert response.status_code == 200
    assert response.json()["status"] == "processing"
    assert response.json()["admin_note"] == "处理中"


def test_notify_done_request_without_email_is_rejected(client, admin_headers):
    request_payload = client.post(
        "/api/requests",
        json={
            "title": "求资料",
            "description": "desc",
            "contact_email": None,
            "contact_text": "微信 demo",
        },
    ).json()
    client.put(
        f"/api/admin/requests/{request_payload['id']}",
        headers=admin_headers,
        json={"status": "done", "admin_note": "已处理"},
    )

    response = client.post(
        f"/api/admin/requests/{request_payload['id']}/notify",
        headers=admin_headers,
    )

    assert response.status_code == 400


def test_notify_done_request_marks_notification_timestamp(client, admin_headers):
    request_payload = client.post(
        "/api/requests",
        json={
            "title": "求资料",
            "description": "desc",
            "contact_email": "user@example.com",
            "contact_text": "微信 demo",
        },
    ).json()
    client.put(
        f"/api/admin/requests/{request_payload['id']}",
        headers=admin_headers,
        json={"status": "done", "admin_note": "已处理"},
    )

    response = client.post(
        f"/api/admin/requests/{request_payload['id']}/notify",
        headers=admin_headers,
    )

    assert response.status_code == 200
    assert response.json()["notified_at"] is not None


def test_admin_request_update_writes_audit_log(client, admin_headers, caplog):
    request_payload = client.post(
        "/api/requests",
        json={
            "title": "求资料",
            "description": "desc",
            "contact_email": "user@example.com",
            "contact_text": "微信 demo",
        },
    ).json()

    with capture_app_logs() as records:
        response = client.put(
            f"/api/admin/requests/{request_payload['id']}",
            headers=admin_headers,
            json={"status": "processing", "admin_note": "处理中"},
        )

    assert response.status_code == 200
    assert any(
        "updated admin request" in record.getMessage() and f"request_id={request_payload['id']}" in record.getMessage()
        for record in records
    )


def test_notify_done_request_writes_audit_log(client, admin_headers, monkeypatch, caplog):
    request_payload = client.post(
        "/api/requests",
        json={
            "title": "求资料",
            "description": "desc",
            "contact_email": "user@example.com",
            "contact_text": "微信 demo",
        },
    ).json()
    client.put(
        f"/api/admin/requests/{request_payload['id']}",
        headers=admin_headers,
        json={"status": "done", "admin_note": "已处理"},
    )
    monkeypatch.setattr("app.routers.admin_requests.mail_service.send_mail", lambda *args, **kwargs: None)

    with capture_app_logs() as records:
        response = client.post(
            f"/api/admin/requests/{request_payload['id']}/notify",
            headers=admin_headers,
        )

    assert response.status_code == 200
    assert any(
        "sent request completion notification" in record.getMessage()
        and f"request_id={request_payload['id']}" in record.getMessage()
        for record in records
    )


def test_app_startup_logs_settings_summary():
    app = create_app()

    with capture_app_logs() as records:
        with TestClient(app):
            pass

    assert any("loaded settings summary" in record.getMessage() for record in records)
    assert any("smtp_password_configured" in record.getMessage() for record in records)


def test_public_request_submission_writes_mail_flow_logs(client, monkeypatch):
    monkeypatch.setattr("app.routers.public_requests.mail_service.send_mail", lambda *args, **kwargs: None)

    with capture_app_logs() as records:
        response = client.post(
            "/api/requests",
            json={
                "title": "求 Python 资料",
                "description": "想找一套 Python 实战教程",
                "contact_email": "user@example.com",
                "contact_text": "微信: demo",
            },
        )

    assert response.status_code == 201
    assert any("received public request submission" in record.getMessage() for record in records)
    assert any("persisted public request" in record.getMessage() for record in records)
    assert any("sending admin request notification" in record.getMessage() for record in records)
    assert any("sent admin request notification" in record.getMessage() for record in records)


def test_configure_application_logging_replaces_managed_handlers_and_keeps_custom_ones():
    custom_handler = logging.NullHandler()
    old_managed_handler = logging.StreamHandler()
    setattr(old_managed_handler, "_app_logging_managed", True)
    app_logger = logging.getLogger("app")

    original_app_handlers = list(app_logger.handlers)
    original_app_level = app_logger.level
    original_app_propagate = app_logger.propagate

    app_logger.handlers = [custom_handler, old_managed_handler]
    app_logger.setLevel(logging.NOTSET)
    app_logger.propagate = True

    try:
        configure_application_logging()
        configured_handlers = list(app_logger.handlers)
        managed_handlers = [handler for handler in configured_handlers if getattr(handler, "_app_logging_managed", False)]

        configure_application_logging()

        assert custom_handler in app_logger.handlers
        assert old_managed_handler not in app_logger.handlers
        assert len(managed_handlers) == 1
        assert isinstance(managed_handlers[0], logging.StreamHandler)
        assert len([handler for handler in app_logger.handlers if getattr(handler, "_app_logging_managed", False)]) == 1
        assert app_logger.level == logging.INFO
        assert app_logger.propagate is False
    finally:
        app_logger.handlers = original_app_handlers
        app_logger.setLevel(original_app_level)
        app_logger.propagate = original_app_propagate
