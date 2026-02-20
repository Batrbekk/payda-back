import httpx

from app.config import settings


async def send_sms(phone: str, code: str) -> bool:
    recipient = phone.lstrip("+")
    text = f"Payda: Ваш код подтверждения: {code}"

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(
                f"{settings.mobizon_api_url}/service/message/sendSmsMessage",
                params={
                    "apiKey": settings.mobizon_api_key,
                    "recipient": recipient,
                    "text": text,
                    "output": "json",
                },
            )
            data = resp.json()
            return data.get("code") == 0
    except Exception:
        return False
