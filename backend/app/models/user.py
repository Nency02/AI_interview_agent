from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, EmailStr, BeforeValidator
from typing_extensions import Annotated

# Helper type to support MongoDB ObjectId serialization in Pydantic
PyObjectId = Annotated[str, BeforeValidator(str)]

class UserRegister(BaseModel):
    name: str = Field(..., min_length=2, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=6)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
    user_id: Optional[str] = None

class UserDB(BaseModel):
    id: Optional[PyObjectId] = Field(None, alias="_id")
    name: str
    email: str
    password: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
    }

class UserResponse(BaseModel):
    id: PyObjectId = Field(..., alias="id")
    name: str
    email: str
    created_at: datetime

    model_config = {
        "populate_by_name": True,
    }
