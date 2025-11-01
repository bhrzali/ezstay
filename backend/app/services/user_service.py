from sqlalchemy.orm import Session
from typing import Optional
from app.repositories.user_repository import UserRepository
from app.core.security import verify_password, get_password_hash
from app.models.user import User

class UserService:
    def __init__(self, db: Session):
        self.repository = UserRepository(db)
    
    def authenticate_user(self, username: str, password: str) -> Optional[User]:
        user = self.repository.get_by_username(username)
        if not user:
            return None
        if not verify_password(password, user.hashed_password):
            return None
        return user
    
    def get_user_by_id(self, user_id: int) -> Optional[User]:
        return self.repository.get_by_id(user_id)
    
    def get_user_by_username(self, username: str) -> Optional[User]:
        return self.repository.get_by_username(username)
    
    def create_user(self, username: str, password: str, is_admin: bool = False) -> User:
        hashed_password = get_password_hash(password)
        return self.repository.create(username, hashed_password, is_admin)
    
    def update_user_password(self, user_id: int, new_password: str) -> Optional[User]:
        hashed_password = get_password_hash(new_password)
        return self.repository.update(user_id, {"hashed_password": hashed_password})

