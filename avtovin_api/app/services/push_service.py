import os

from app.config import settings

_firebase_initialized = False


def _init_firebase():
    global _firebase_initialized
    if _firebase_initialized:
        return True

    creds_path = settings.firebase_credentials_path
    if not creds_path or not os.path.exists(creds_path):
        return False

    import firebase_admin
    from firebase_admin import credentials

    cred = credentials.Certificate(creds_path)
    firebase_admin.initialize_app(cred)
    _firebase_initialized = True
    return True


async def send_push(fcm_token: str, title: str, body: str, data: dict | None = None):
    if not _init_firebase():
        return False

    from firebase_admin import messaging

    message = messaging.Message(
        notification=messaging.Notification(title=title, body=body),
        data=data or {},
        token=fcm_token,
    )

    try:
        messaging.send(message)
        return True
    except Exception:
        return False
