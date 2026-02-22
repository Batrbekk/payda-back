import httpx

from app.config import settings


async def send_telegram(text: str) -> bool:
    """Send a message to the configured Telegram group chat."""
    if not settings.telegram_bot_token or not settings.telegram_chat_id:
        return False

    url = f"https://api.telegram.org/bot{settings.telegram_bot_token}/sendMessage"
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(url, json={
                "chat_id": settings.telegram_chat_id,
                "text": text,
                "parse_mode": "HTML",
            })
            return resp.status_code == 200
    except Exception:
        return False


def format_warranty_message(
    contract_number: str,
    client_name: str,
    phone: str,
    brand: str,
    model: str,
    year: int,
    vin: str,
    start_date: str,
    end_date: str,
    manager_name: str | None = None,
) -> str:
    lines = [
        "🆕 <b>Новая гарантия</b>",
        "",
        f"📋 ГРНЗ / Договор: <b>{contract_number}</b>",
        f"👤 Клиент: {client_name}",
        f"📞 Телефон: {phone}",
        f"🚗 Авто: {brand} {model} {year}",
        f"🔢 VIN: {vin}",
        f"📅 Период: {start_date} — {end_date}",
    ]
    if manager_name:
        lines.append(f"👷 Менеджер: {manager_name}")
    return "\n".join(lines)
