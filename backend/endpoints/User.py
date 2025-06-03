from fastapi import APIRouter, HTTPException
from backend.data.DbContext import DbContext
from backend.data.DbUserContext import DbUserContext
from backend.sessions.session_manager import SessionManager
from pydantic import BaseModel


class UserRequest(BaseModel):
    User_Name: str
    User_Password: str


session_manager = SessionManager("user.db")  # or your user DB path
router = APIRouter()

session_manager.create_sessions_table()

@router.post("/api/create/user")
async def create_user(user_data: dict):
    try:
        db = DbContext()
        db.connect()
        if (db.insert_user(user_data)):
            return {"message": "User created successfully"}
        else:
            raise HTTPException(status_code=500, detail=f"Username already exists")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"{str(e)}")
    finally:
        db.close()



@router.post("/api/login")
async def login(user_data: UserRequest):
    db = DbUserContext()
    db.connect()
    user = db.get_user(user_data.User_Name, user_data.User_Password)
    if user:
        user_id = user["User_ID"] if isinstance(user, dict) else user[0]  # adjust as needed
        session_token = session_manager.create_session(user_id)
        db_user = DbUserContext()
        db_user.connect()
        user = db_user.get_user_by_id(user_id)
        user_name = user["User_Name"] if user else "Unknown"
        db_user.close()
        db.close()
        return {"session_token": session_token, "user_id": user_id, "user_name": user_name}
    else:
        db.close()
        raise HTTPException(status_code=401, detail="Invalid credentials")
