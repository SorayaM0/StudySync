from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.core.database import get_db
from app.models.membership import Membership
from app.models.study_space import StudySpace
from app.models.user import User
from app.schemas.study_space import (
    StudySpaceCreate,
    StudySpaceResponse,
    StudySpaceUpdate,
)


router = APIRouter(
    prefix="/spaces",
    tags=["Study Spaces"],
)


def get_accessible_study_space(
    space_id: int,
    current_user: User,
    db: Session,
) -> StudySpace:
    study_space = db.scalar(
        select(StudySpace)
        .join(
            Membership,
            Membership.space_id == StudySpace.id,
        )
        .where(
            StudySpace.id == space_id,
            Membership.user_id == current_user.id,
        )
    )

    if study_space is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Study space not found.",
        )

    return study_space


def get_owned_study_space(
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


@router.post(
    "",
    response_model=StudySpaceResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_study_space(
    space_data: StudySpaceCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> StudySpace:
    study_space = StudySpace(
        name=space_data.name.strip(),
        course_code=space_data.course_code.strip().upper(),
        description=(
            space_data.description.strip()
            if space_data.description
            else None
        ),
        owner_id=current_user.id,
    )

    db.add(study_space)
    db.flush()

    owner_membership = Membership(
        user_id=current_user.id,
        space_id=study_space.id,
        role="owner",
    )

    db.add(owner_membership)

    db.commit()
    db.refresh(study_space)

    return study_space


@router.get(
    "",
    response_model=list[StudySpaceResponse],
)
def get_study_spaces(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[StudySpace]:
    spaces = db.scalars(
        select(StudySpace)
        .join(
            Membership,
            Membership.space_id == StudySpace.id,
        )
        .where(
            Membership.user_id == current_user.id,
        )
        .order_by(StudySpace.created_at.desc())
    ).all()

    return list(spaces)


@router.get(
    "/{space_id}",
    response_model=StudySpaceResponse,
)
def get_study_space(
    space_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> StudySpace:
    return get_accessible_study_space(
        space_id=space_id,
        current_user=current_user,
        db=db,
    )


@router.patch(
    "/{space_id}",
    response_model=StudySpaceResponse,
)
def update_study_space(
    space_id: int,
    space_data: StudySpaceUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> StudySpace:
    study_space = get_owned_study_space(
        space_id=space_id,
        current_user=current_user,
        db=db,
    )

    update_data = space_data.model_dump(exclude_unset=True)

    if "name" in update_data and update_data["name"] is not None:
        study_space.name = update_data["name"].strip()

    if "course_code" in update_data and update_data["course_code"] is not None:
        study_space.course_code = update_data["course_code"].strip().upper()

    if "description" in update_data:
        description = update_data["description"]

        study_space.description = (
            description.strip()
            if description
            else None
        )

    db.commit()
    db.refresh(study_space)

    return study_space


@router.delete(
    "/{space_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_study_space(
    space_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Response:
    study_space = get_owned_study_space(
        space_id=space_id,
        current_user=current_user,
        db=db,
    )

    db.delete(study_space)
    db.commit()

    return Response(
        status_code=status.HTTP_204_NO_CONTENT
    )