from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class NoteCreate(BaseModel):
    title: str = Field(
        min_length=1,
        max_length=200,
    )
    content: str = Field(
        default="",
        max_length=50000,
    )


class NoteUpdate(BaseModel):
    title: str | None = Field(
        default=None,
        min_length=1,
        max_length=200,
    )
    content: str | None = Field(
        default=None,
        max_length=50000,
    )


class NoteResponse(BaseModel):
    id: int
    space_id: int
    title: str
    content: str
    created_by: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)