from sqlalchemy.orm import Session
from typing import Optional
from app.models.user import User

class UserRepository:
    def __init__(self, db: Session):
        self.db = db
    
    def get_by_username(self, username: str) -> Optional[User]:
        return self.db.query(User).filter(User.username == username).first()
    
    def get_by_id(self, user_id: int) -> Optional[User]:
        return self.db.query(User).filter(User.id == user_id).first()
    
    def create(self, username: str, hashed_password: str, is_admin: bool = False) -> User:
        user = User(username=username, hashed_password=hashed_password, is_admin=is_admin)
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user
    
    def get_all(self):
        return self.db.query(User).all()
    
    def update(self, user_id: int, user_data: dict) -> Optional[User]:
        user = self.get_by_id(user_id)
        if not user:
            return None
        
        for key, value in user_data.items():
            setattr(user, key, value)
        
        self.db.commit()
        self.db.refresh(user)
        return user

