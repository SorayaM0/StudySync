from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.core.database import get_db
from app.core.websocket_manager import manager
from app.models.membership import Membership
from app.models.note import Note
from app.models.user import User
from app.schemas.note import (
    NoteCreate,
    NoteResponse,
    NoteUpdate,
)


router = APIRouter(
    prefix="/spaces/{space_id}/notes",
    tags=["Notes"],
)


def verify_space_membership(
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


def get_accessible_note(
    space_id: int,
    note_id: int,
    current_user: User,
    db: Session,
) -> Note:
    verify_space_membership(
        space_id=space_id,
        current_user=current_user,
        db=db,
    )

    note = db.scalar(
        select(Note).where(
            Note.id == note_id,
            Note.space_id == space_id,
        )
    )

    if note is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Note not found.",
        )

    return note


@router.post(
    "",
    response_model=NoteResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_note(
    space_id: int,
    note_data: NoteCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Note:
    verify_space_membership(
        space_id=space_id,
        current_user=current_user,
        db=db,
    )

    note = Note(
        space_id=space_id,
        title=note_data.title.strip(),
        content=note_data.content,
        created_by=current_user.id,
    )

    db.add(note)
    db.commit()
    db.refresh(note)

    await manager.broadcast(
        space_id=space_id,
        message={
            "type": "note.created",
            "space_id": space_id,
            "note": NoteResponse.model_validate(note).model_dump(
                mode="json"
            ),
        },
    )

    return note


@router.get(
    "",
    response_model=list[NoteResponse],
)
def get_notes(
    space_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[Note]:
    verify_space_membership(
        space_id=space_id,
        current_user=current_user,
        db=db,
    )

    notes = db.scalars(
        select(Note)
        .where(Note.space_id == space_id)
        .order_by(Note.updated_at.desc())
    ).all()

    return list(notes)


@router.get(
    "/{note_id}",
    response_model=NoteResponse,
)
def get_note(
    space_id: int,
    note_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Note:
    return get_accessible_note(
        space_id=space_id,
        note_id=note_id,
        current_user=current_user,
        db=db,
    )


@router.patch(
    "/{note_id}",
    response_model=NoteResponse,
)
async def update_note(
    space_id: int,
    note_id: int,
    note_data: NoteUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Note:
    note = get_accessible_note(
        space_id=space_id,
        note_id=note_id,
        current_user=current_user,
        db=db,
    )

    update_data = note_data.model_dump(exclude_unset=True)

    if "title" in update_data and update_data["title"] is not None:
        note.title = update_data["title"].strip()

    if "content" in update_data and update_data["content"] is not None:
        note.content = update_data["content"]

    db.commit()
    db.refresh(note)

    await manager.broadcast(
        space_id=space_id,
        message={
            "type": "note.updated",
            "space_id": space_id,
            "note": NoteResponse.model_validate(note).model_dump(
                mode="json"
            ),
            "updated_by": current_user.id,
        },
    )

    return note


@router.delete(
    "/{note_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_note(
    space_id: int,
    note_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Response:
    note = get_accessible_note(
        space_id=space_id,
        note_id=note_id,
        current_user=current_user,
        db=db,
    )

    deleted_note_id = note.id

    db.delete(note)
    db.commit()

    await manager.broadcast(
        space_id=space_id,
        message={
            "type": "note.deleted",
            "space_id": space_id,
            "note_id": deleted_note_id,
            "deleted_by": current_user.id,
        },
    )

    return Response(
        status_code=status.HTTP_204_NO_CONTENT
    )