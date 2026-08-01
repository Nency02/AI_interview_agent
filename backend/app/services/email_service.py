"""
Email Service - Sends interview report PDFs via SMTP.
Credentials are loaded from environment variables (never hardcoded).
"""
import os
import smtplib
import logging
import time
from email.mime.multipart import MIMEMultipart
from email.mime.text    import MIMEText
from email.mime.base    import MIMEBase
from email              import encoders
from typing             import Optional

from app.config import settings

logger = logging.getLogger(__name__)


class EmailAuthError(RuntimeError):
    """Raised when SMTP authentication fails."""

    def __init__(self, message: str):
        super().__init__(message)
        self.message = message


class EmailService:
    """
    Reusable SMTP email service.
    Configuration is read from environment variables via `settings`.
    """

    def __init__(self):
        self.smtp_host     = getattr(settings, "SMTP_HOST",     "")
        self.smtp_port     = int(getattr(settings, "SMTP_PORT", 587))
        self.smtp_username = getattr(settings, "SMTP_USERNAME", "")
        self.smtp_password = getattr(settings, "SMTP_PASSWORD", "")
        self.email_from    = getattr(settings, "EMAIL_FROM",    "")

    # ------------------------------------------------------------------ #
    #  Public API
    # ------------------------------------------------------------------ #
    def send_report_email(
        self,
        *,
        to_email:   str,
        user_name:  str,
        pdf_path:   str,
        user_id:    str,
        interview_id: str,
    ) -> bool:
        """
        Send the generated PDF report to `to_email`.

        Parameters
        ----------
        to_email      : recipient's email address
        user_name     : candidate's display name (used in salutation)
        pdf_path      : absolute path to the PDF file to attach
        user_id       : for log traceability
        interview_id  : for log traceability

        Returns True on success, False on failure.
        """
        start_ts = time.time()
        logger.info(
            f"[Email] Sending report email  user={user_id}  "
            f"interview={interview_id}  to={to_email}"
        )

        # ── Validation ──────────────────────────────────────────────────
        missing = self._check_config()
        if missing:
            logger.error(f"[Email] SMTP config missing: {missing}")
            return False

        if not os.path.isfile(pdf_path):
            logger.error(f"[Email] PDF not found at path: {pdf_path}")
            return False

        # ── Build the MIME message ───────────────────────────────────────
        msg = MIMEMultipart()
        msg["From"]    = self.email_from
        msg["To"]      = to_email
        msg["Subject"] = "Your AI Interview Report"

        body = self._build_body(user_name)
        msg.attach(MIMEText(body, "plain"))

        # ── Attach PDF ───────────────────────────────────────────────────
        with open(pdf_path, "rb") as f:
            part = MIMEBase("application", "octet-stream")
            part.set_payload(f.read())
        encoders.encode_base64(part)
        part.add_header(
            "Content-Disposition",
            f'attachment; filename="{os.path.basename(pdf_path)}"',
        )
        msg.attach(part)

        # ── Send via SMTP ────────────────────────────────────────────────
        try:
            with smtplib.SMTP(self.smtp_host, self.smtp_port, timeout=15) as server:
                server.ehlo()
                server.starttls()
                server.ehlo()
                server.login(self.smtp_username, self.smtp_password)
                server.sendmail(self.email_from, to_email, msg.as_string())

            elapsed = round(time.time() - start_ts, 2)
            logger.info(
                f"[Email] Sent successfully in {elapsed}s  "
                f"user={user_id}  interview={interview_id}"
            )
            return True

        except smtplib.SMTPAuthenticationError as exc:
            auth_hint = (
                "SMTP authentication failed. If you are using Gmail, use an "
                "App Password instead of your normal account password, and "
                "make sure 2-Step Verification is enabled."
            )
            logger.error(
                f"[Email] SMTP auth failed for user={user_id}: {exc}. {auth_hint}"
            )
            raise EmailAuthError(auth_hint) from exc
        except smtplib.SMTPConnectError as exc:
            logger.error(
                f"[Email] SMTP connection error for user={user_id}: {exc}"
            )
            return False
        except smtplib.SMTPException as exc:
            logger.error(
                f"[Email] SMTP error for user={user_id}: {exc}"
            )
            return False
        except Exception as exc:
            logger.error(
                f"[Email] Unexpected error for user={user_id}: {exc}"
            )
            return False

    # ------------------------------------------------------------------ #
    #  Helpers
    # ------------------------------------------------------------------ #
    def _check_config(self) -> Optional[str]:
        """Return a string describing missing fields, or None if all OK."""
        missing = []
        if not self.smtp_host:     missing.append("SMTP_HOST")
        if not self.smtp_username: missing.append("SMTP_USERNAME")
        if not self.smtp_password: missing.append("SMTP_PASSWORD")
        if not self.email_from:    missing.append("EMAIL_FROM")
        return ", ".join(missing) if missing else None

    @staticmethod
    def _build_body(user_name: str) -> str:
        return (
            f"Hello {user_name},\n\n"
            "Thank you for completing your AI mock interview.\n\n"
            "Your interview report has been generated successfully. "
            "The PDF report is attached to this email.\n\n"
            "Best of luck with your interview preparation!\n\n"
            "Regards,\n"
            "AI Interview Coach"
        )


# Module-level singleton for easy import
email_service = EmailService()
