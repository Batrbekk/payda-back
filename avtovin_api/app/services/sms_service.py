from twilio.rest import Client

from app.config import settings

_client = None


def _get_client() -> Client:
    global _client
    if _client is None:
        _client = Client(settings.twilio_account_sid, settings.twilio_auth_token)
    return _client


def send_verification(phone: str, channel: str = "whatsapp") -> bool:
    """Send OTP via Twilio Verify. Channel: 'whatsapp' or 'sms'."""
    try:
        client = _get_client()
        verification = client.verify.v2.services(
            settings.twilio_verify_sid
        ).verifications.create(
            to=phone,
            channel=channel,
        )
        return verification.status == "pending"
    except Exception as e:
        print(f"Twilio send error: {e}")
        # Fallback to SMS if WhatsApp fails
        if channel == "whatsapp":
            return send_verification(phone, channel="sms")
        return False


def check_verification(phone: str, code: str) -> bool:
    """Check OTP code via Twilio Verify."""
    try:
        client = _get_client()
        check = client.verify.v2.services(
            settings.twilio_verify_sid
        ).verification_checks.create(
            to=phone,
            code=code,
        )
        return check.status == "approved"
    except Exception as e:
        print(f"Twilio check error: {e}")
        return False


# Legacy function kept for backward compatibility
async def send_sms(phone: str, code: str) -> bool:
    """Legacy SMS via SMSC — kept as backup."""
    import httpx
    text = f"SRA: Ваш код подтверждения: {code}"
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(
                "https://smsc.kz/sys/send.php",
                params={
                    "login": settings.smsc_login,
                    "psw": settings.smsc_password,
                    "phones": phone,
                    "mes": text,
                    "fmt": 3,
                    "charset": "utf-8",
                },
            )
            data = resp.json()
            return "id" in data
    except Exception:
        return False
