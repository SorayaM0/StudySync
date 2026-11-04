from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class StudySpaceCreate(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    course_code: str = Field(min_length=1, max_length=50)
    description: str | None = Field(
        default=None,
        max_length=1000,
    )


class StudySpaceUpdate(BaseModel):
    name: str | None = Field(
        default=None,
        min_length=1,
        max_length=150,
    )
    course_code: str | None = Field(
        default=None,
        min_length=1,
        max_length=50,
    )
    description: str | None = Field(
        default=None,
        max_length=1000,
    )


class StudySpaceResponse(BaseModel):
    id: int
    name: str
    course_code: str
    description: str | None
    owner_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)