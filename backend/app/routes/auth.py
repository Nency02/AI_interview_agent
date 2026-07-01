from datetime import timedelta
from fastapi import APIRouter, HTTPException, status, Depends
from app.database.mongodb import get_collection
from app.models.user import UserRegister, UserLogin, Token, UserDB, UserResponse
from app.services.auth_service import hash_password, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/api/auth", tags=["authentication"])

@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(user_in: UserRegister):
    users_col = await get_collection("users")
    
    # Check if user already exists
    existing_user = await users_col.find_one({"email": user_in.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email is already registered"
        )
    
    # Hash password and create User DB record
    hashed_pwd = hash_password(user_in.password)
    user_db = UserDB(
        name=user_in.name,
        email=user_in.email,
        password=hashed_pwd
    )
    
    # Insert to DB
    result = await users_col.insert_one(user_db.model_dump(by_alias=True, exclude_none=True))
    user_id = str(result.inserted_id)
    
    # Create Token
    access_token = create_access_token(data={"email": user_in.email, "user_id": user_id})
    return Token(access_token=access_token, token_type="bearer")

@router.post("/login", response_model=Token)
async def login(user_in: UserLogin):
    users_col = await get_collection("users")
    
    # Retrieve user
    user = await users_col.find_one({"email": user_in.email})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid email or password"
        )
    
    # Verify password
    if not verify_password(user_in.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid email or password"
        )
    
    # Generate Token
    user_id = str(user["_id"])
    access_token = create_access_token(data={"email": user["email"], "user_id": user_id})
    return Token(access_token=access_token, token_type="bearer")

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: UserResponse = Depends(get_current_user)):
    return current_user
