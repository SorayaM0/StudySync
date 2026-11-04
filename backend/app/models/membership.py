from datetime import datetime

from sqlalchemy import (
    DateTime,
    ForeignKey,
    String,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Membership(Base):
    __tablename__ = "memberships"

    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "space_id",
            name="uq_membership_user_space",
        ),
    )

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True,
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    space_id: Mapped[int] = mapped_column(
        ForeignKey("study_spaces.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    role: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="member",
    )

    joined_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )