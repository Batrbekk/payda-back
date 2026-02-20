from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.otp import OtpCode
from app.models.user import User
from app.schemas.auth import (
    SendCodeRequest, SendCodeResponse,
    VerifyCodeRequest, VerifyCodeResponse, UserBrief,
    AdminLoginRequest, AdminLoginResponse, AdminUserBrief,
)
from app.services.auth_service import (
    generate_otp, create_token, verify_password, hash_password,
    TEST_PHONE,
)
from app.services.sms_service import send_sms

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/send-code", response_model=SendCodeResponse)
async def send_code(body: SendCodeRequest, db: AsyncSession = Depends(get_db)):
    phone = body.phone

    # Delete old OTP codes for this phone
    await db.execute(delete(OtpCode).where(OtpCode.phone == phone))

    # Check if test account
    is_test = phone == TEST_PHONE
    if not is_test:
        result = await db.execute(select(User).where(User.phone == phone, User.role == "SC_MANAGER"))
        if result.scalar_one_or_none():
            is_test = True

    code = "0000" if is_test else generate_otp()

    # Save OTP
    otp = OtpCode(
        phone=phone,
        code=code,
        expires_at=datetime.utcnow() + timedelta(minutes=5),
    )
    db.add(otp)
    await db.commit()

    # Send SMS (skip for test accounts)
    if not is_test:
        success = await send_sms(phone, code)
        if not success:
            raise HTTPException(status_code=502, detail="Не удалось отправить SMS. Попробуйте позже")

    return SendCodeResponse(message="Код отправлен", expires_in=300)


@router.post("/verify-code", response_model=VerifyCodeResponse)
async def verify_code(body: VerifyCodeRequest, db: AsyncSession = Depends(get_db)):
    if not body.phone or not body.code:
        raise HTTPException(status_code=400, detail="Телефон и код обязательны")

    # Find valid OTP
    now = datetime.utcnow()
    result = await db.execute(
        select(OtpCode)
        .where(
            OtpCode.phone == body.phone,
            OtpCode.code == body.code,
            OtpCode.verified == False,  # noqa: E712
            OtpCode.expires_at > now,
        )
        .order_by(OtpCode.created_at.desc())
        .limit(1)
    )
    otp = result.scalar_one_or_none()
    if not otp:
        raise HTTPException(status_code=401, detail="Неверный или просроченный код")

    # Mark OTP as verified
    otp.verified = True
    await db.flush()

    # Find or create user
    result = await db.execute(
        select(User)
        .where(User.phone == body.phone)
        .options(selectinload(User.cars), selectinload(User.service_center))
    )
    user = result.scalar_one_or_none()
    is_new_user = False

    if not user:
        user = User(phone=body.phone)
        db.add(user)
        await db.flush()
        await db.refresh(user, ["cars", "service_center"])
        is_new_user = True

    await db.commit()

    token = create_token(user.id, user.role)

    return VerifyCodeResponse(
        token=token,
        is_new_user=is_new_user,
        user=UserBrief(
            id=user.id,
            phone=user.phone,
            name=user.name,
            role=user.role,
            cars=[],
            service_center_id=user.service_center.id if user.service_center else None,
        ),
    )


@router.post("/admin-login", response_model=AdminLoginResponse)
async def admin_login(body: AdminLoginRequest, db: AsyncSession = Depends(get_db)):
    if not body.email or not body.password:
        raise HTTPException(status_code=400, detail="Введите email и пароль")

    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()

    if not user or user.role != "ADMIN" or not user.password:
        raise HTTPException(status_code=401, detail="Неверный email или пароль")

    if not verify_password(body.password, user.password):
        raise HTTPException(status_code=401, detail="Неверный email или пароль")

    # Auto-upgrade SHA256 → bcrypt
    if not user.password.startswith("$2"):
        user.password = hash_password(body.password)
        await db.commit()

    token = create_token(user.id, user.role)

    return AdminLoginResponse(
        token=token,
        user=AdminUserBrief(id=user.id, name=user.name, email=user.email, role=user.role),
    )


@router.post("/warranty-login", response_model=AdminLoginResponse)
async def warranty_login(body: AdminLoginRequest, db: AsyncSession = Depends(get_db)):
    if not body.email or not body.password:
        raise HTTPException(status_code=400, detail="Введите email и пароль")

    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()

    if not user or user.role not in ("WARRANTY_MANAGER", "ADMIN") or not user.password:
        raise HTTPException(status_code=401, detail="Неверный email или пароль")

    if not verify_password(body.password, user.password):
        raise HTTPException(status_code=401, detail="Неверный email или пароль")

    # Auto-upgrade SHA256 → bcrypt
    if not user.password.startswith("$2"):
        user.password = hash_password(body.password)
        await db.commit()

    token = create_token(user.id, user.role)

    return AdminLoginResponse(
        token=token,
        user=AdminUserBrief(id=user.id, name=user.name, email=user.email, role=user.role),
    )
