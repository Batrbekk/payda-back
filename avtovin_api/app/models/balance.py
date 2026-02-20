from datetime import datetime
from uuid import uuid4

from sqlalchemy import String, Integer, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class BalanceTransaction(Base):
    __tablename__ = "balance_transactions"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid4()))
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id", ondelete="CASCADE"))
    amount: Mapped[int] = mapped_column(Integer)  # + earn, - spend
    type: Mapped[str] = mapped_column(String)  # CASHBACK_EARN | CASHBACK_SPEND
    description: Mapped[str] = mapped_column(String)
    visit_id: Mapped[str | None] = mapped_column(String, ForeignKey("visits.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    user = relationship("User", back_populates="balance_transactions")
    visit = relationship("Visit", back_populates="balance_transactions")
