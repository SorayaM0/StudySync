from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr


class MembershipCreate(BaseModel):
    email: EmailStr


class MembershipResponse(BaseModel):
    id: int
    user_id: int
    space_id: int
    role: str
    joined_at: datetime

    model_config = ConfigDict(from_attributes=True)


class MemberResponse(BaseModel):
    membership_id: int
    user_id: int
    email: EmailStr
    display_name: str
    role: str
    joined_at: datetime