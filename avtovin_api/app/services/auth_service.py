import hashlib
import random
from datetime import datetime, timedelta, timezone

from jose import jwt
from passlib.hash import bcrypt

from app.config import settings

TEST_PHONE = "+77760047836"


def generate_otp() -> str:
    return str(random.randint(1000, 9999))


def create_token(user_id: str, role: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user_id,
        "role": role,
        "iat": now,
        "exp": now + timedelta(days=settings.jwt_expire_days),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def verify_password(plain: str, hashed: str) -> bool:
    # Try bcrypt first
    if hashed.startswith("$2"):
        return bcrypt.verify(plain, hashed)
    # Fallback: SHA256 (legacy from Next.js)
    sha256_hash = hashlib.sha256(plain.encode()).hexdigest()
    return sha256_hash == hashed


def hash_password(plain: str) -> str:
    return bcrypt.hash(plain)
