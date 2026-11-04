from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.core.database import get_db
from app.models.membership import Membership
from app.models.study_space import StudySpace
from app.models.user import User
from app.schemas.membership import (
    MemberResponse,
    MembershipCreate,
    MembershipResponse,
)


router = APIRouter(
    prefix="/spaces",
    tags=["Memberships"],
)


def get_owned_space(
    space_id: int,
    current_user: User,
    db: Session,
) -> StudySpace:
    study_space = db.scalar(
        select(StudySpace).where(
            StudySpace.id == space_id,
            StudySpace.owner_id == current_user.id,
        )
    )

    if study_space is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Study space not found.",
        )

    return study_space


def get_space_membership(
    space_id: int,
    current_user: User,
    db: Session,
) -> Membership:
    membership = db.scalar(
        select(Membership).where(
            Membership.space_id == space_id,
            Membership.user_id == current_user.id,
        )
    )

    if membership is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Study space not found.",
        )

    return membership


@router.post(
    "/{space_id}/members",
    response_model=MembershipResponse,
    status_code=status.HTTP_201_CREATED,
)
def add_member(
    space_id: int,
    member_data: MembershipCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Membership:
    get_owned_space(
        space_id=space_id,
        current_user=current_user,
        db=db,
    )

    normalized_email = member_data.email.lower()

    user = db.scalar(
        select(User).where(User.email == normalized_email)
    )

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No registered user was found with that email.",
        )

    existing_membership = db.scalar(
        select(Membership).where(
            Membership.space_id == space_id,
            Membership.user_id == user.id,
        )
    )

    if existing_membership is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User is already a member of this study space.",
        )

    membership = Membership(
        user_id=user.id,
        space_id=space_id,
        role="member",
    )

    db.add(membership)
    db.commit()
    db.refresh(membership)

    return membership


@router.get(
    "/{space_id}/members",
    response_model=list[MemberResponse],
)
def get_members(
    space_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[MemberResponse]:
    get_space_membership(
        space_id=space_id,
        current_user=current_user,
        db=db,
    )

    rows = db.execute(
        select(Membership, User)
        .join(User, User.id == Membership.user_id)
        .where(Membership.space_id == space_id)
        .order_by(Membership.joined_at.asc())
    ).all()

    return [
        MemberResponse(
            membership_id=membership.id,
            user_id=user.id,
            email=user.email,
            display_name=user.display_name,
            role=membership.role,
            joined_at=membership.joined_at,
        )
        for membership, user in rows
    ]