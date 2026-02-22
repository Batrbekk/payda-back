import json
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


async def send_telegram_documents(file_paths: list[str], caption: str = "") -> bool:
    """Send multiple documents in a single Telegram message using sendMediaGroup."""
    if not settings.telegram_bot_token or not settings.telegram_chat_id:
        return False
    if not file_paths:
        return False

    # Single file — use sendDocument for simplicity
    if len(file_paths) == 1:
        url = f"https://api.telegram.org/bot{settings.telegram_bot_token}/sendDocument"
        try:
            async with httpx.AsyncClient(timeout=30) as client:
                with open(file_paths[0], "rb") as f:
                    fname = file_paths[0].split("/")[-1]
                    resp = await client.post(url, data={
                        "chat_id": settings.telegram_chat_id,
                        "caption": caption[:1024] if caption else "",
                    }, files={"document": (fname, f)})
                return resp.status_code == 200
        except Exception:
            return False

    # Multiple files — sendMediaGroup (up to 10 at a time)
    url = f"https://api.telegram.org/bot{settings.telegram_bot_token}/sendMediaGroup"
    try:
        media = []
        files_dict = {}
        for i, fp in enumerate(file_paths[:10]):
            attach_key = f"file{i}"
            fname = fp.split("/")[-1]
            files_dict[attach_key] = (fname, open(fp, "rb"))
            item = {"type": "document", "media": f"attach://{attach_key}"}
            if i == 0 and caption:
                item["caption"] = caption[:1024]
            media.append(item)

        async with httpx.AsyncClient(timeout=60) as client:
            resp = await client.post(url, data={
                "chat_id": settings.telegram_chat_id,
                "media": json.dumps(media),
            }, files=files_dict)

        # Close all file handles
        for fh in files_dict.values():
            fh[1].close()

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
