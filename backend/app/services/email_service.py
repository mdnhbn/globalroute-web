import smtplib
from email.message import EmailMessage

from app.config import settings


class EmailServiceNotConfigured(RuntimeError):
    pass


def send_verification_code(recipient: str, full_name: str, code: str) -> None:
    if not settings.email_verification_configured:
        raise EmailServiceNotConfigured("Email verification is not configured")

    message = EmailMessage()
    message["Subject"] = "Your GlobalRoute verification code"
    message["From"] = settings.SMTP_FROM_EMAIL
    message["To"] = recipient
    message.set_content(
        f"Hello {full_name},\n\n"
        f"Your GlobalRoute email verification code is: {code}\n\n"
        "This code expires in 10 minutes. If you did not create a GlobalRoute account, "
        "you can ignore this message.\n"
    )

    if settings.SMTP_USE_SSL:
        with smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15) as server:
            if settings.SMTP_USERNAME:
                server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
            server.send_message(message)
        return

    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15) as server:
        server.ehlo()
        server.starttls()
        server.ehlo()
        if settings.SMTP_USERNAME:
            server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
        server.send_message(message)
