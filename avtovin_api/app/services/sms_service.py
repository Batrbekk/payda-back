import httpx

from app.config import settings


async def send_sms(phone: str, code: str) -> bool:
    text = f"Payda: Ваш код подтверждения: {code}"

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
