import smtplib
from email.message import EmailMessage

from app.core.config import get_settings
import logging


logger = logging.getLogger(__name__)


class MailService:
    def __init__(self) -> None:
        self.settings = get_settings()

    def send_mail(self, recipient: str, subject: str, body: str) -> None:
        logger.info(
            "mail send requested recipient=%s subject=%s settings=%s",
            recipient,
            subject,
            self.settings.log_safe_dict(),
        )
        if self.settings.smtp_suppress_send:
            logger.info("mail send skipped because smtp_suppress_send is enabled recipient=%s subject=%s", recipient, subject)
            return

        message = EmailMessage()
        message["Subject"] = subject
        message["From"] = self.settings.smtp_sender
        message["To"] = recipient
        message.set_content(body)

        logger.info(
            "opening smtp connection host=%s port=%s use_tls=%s recipient=%s",
            self.settings.smtp_host,
            self.settings.smtp_port,
            self.settings.smtp_use_tls,
            recipient,
        )
        with smtplib.SMTP(self.settings.smtp_host, self.settings.smtp_port, timeout=10) as smtp:
            if self.settings.smtp_use_tls:
                logger.info("starting smtp tls recipient=%s", recipient)
                smtp.starttls()
            if self.settings.smtp_username:
                logger.info("logging in to smtp username=%s recipient=%s", self.settings.smtp_username, recipient)
                smtp.login(self.settings.smtp_username, self.settings.smtp_password)
            logger.info("sending smtp message recipient=%s subject=%s", recipient, subject)
            smtp.send_message(message)
        logger.info("mail send completed recipient=%s subject=%s", recipient, subject)


mail_service = MailService()
