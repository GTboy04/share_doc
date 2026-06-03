import logging
from logging.config import dictConfig


def configure_application_logging() -> None:
    app_logger = logging.getLogger("app")
    preserved_handlers = [handler for handler in app_logger.handlers if not getattr(handler, "_app_logging_managed", False)]

    dictConfig(
        {
            "version": 1,
            "disable_existing_loggers": False,
            "formatters": {
                "standard": {
                    "format": "%(asctime)s %(levelname)s [%(name)s] %(message)s",
                }
            },
            "handlers": {
                "console": {
                    "class": "logging.StreamHandler",
                    "formatter": "standard",
                    "stream": "ext://sys.stderr",
                }
            },
            "loggers": {
                "app": {
                    "handlers": ["console"],
                    "level": "INFO",
                    "propagate": False,
                }
            },
        }
    )

    app_logger = logging.getLogger("app")
    for handler in app_logger.handlers:
        setattr(handler, "_app_logging_managed", True)
    for handler in preserved_handlers:
        if handler not in app_logger.handlers:
            app_logger.addHandler(handler)

    app_logger.info("application logging configured")
