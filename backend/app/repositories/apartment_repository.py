from sqlalchemy.orm import Session
from typing import List, Optional
from app.models.apartment import Apartment, ApartmentImage
from datetime import date

class ApartmentRepository:
    def __init__(self, db: Session):
        self.db = db
    
    def create(self, apartment_data: dict) -> Apartment:
        apartment = Apartment(**apartment_data)
        self.db.add(apartment)
        self.db.commit()
        self.db.refresh(apartment)
        return apartment
    
    def get_by_id(self, apartment_id: int) -> Optional[Apartment]:
        return self.db.query(Apartment).filter(Apartment.id == apartment_id).first()
    
    def get_all(self, skip: int = 0, limit: int = 100) -> List[Apartment]:
        return self.db.query(Apartment).offset(skip).limit(limit).all()
    
    def search(
        self,
        city: Optional[str] = None,
        min_price: Optional[int] = None,
        max_price: Optional[int] = None,
        available_from: Optional[date] = None,
        available_to: Optional[date] = None,
        bedrooms: Optional[int] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[Apartment]:
        query = self.db.query(Apartment)
        
        if city:
            query = query.filter(Apartment.city.ilike(f"%{city}%"))
        if min_price:
            query = query.filter(Apartment.price_per_month >= min_price)
        if max_price:
            query = query.filter(Apartment.price_per_month <= max_price)
        if available_from:
            query = query.filter(Apartment.available_from <= available_from)
        if available_to:
            query = query.filter(Apartment.available_to >= available_to)
        if bedrooms:
            query = query.filter(Apartment.bedrooms >= bedrooms)
        
        return query.offset(skip).limit(limit).all()
    
    def update(self, apartment_id: int, apartment_data: dict) -> Optional[Apartment]:
        apartment = self.get_by_id(apartment_id)
        if not apartment:
            return None
        
        for key, value in apartment_data.items():
            setattr(apartment, key, value)
        
        self.db.commit()
        self.db.refresh(apartment)
        return apartment
    
    def delete(self, apartment_id: int) -> bool:
        apartment = self.get_by_id(apartment_id)
        if not apartment:
            return False
        
        self.db.delete(apartment)
        self.db.commit()
        return True
    
    def add_image(self, apartment_id: int, image_data: bytes, image_name: str) -> ApartmentImage:
        image = ApartmentImage(
            apartment_id=apartment_id,
            image_data=image_data,
            image_name=image_name
        )
        self.db.add(image)
        self.db.commit()
        self.db.refresh(image)
        return image
    
    def get_images(self, apartment_id: int) -> List[ApartmentImage]:
        return self.db.query(ApartmentImage).filter(
            ApartmentImage.apartment_id == apartment_id
        ).all()
    
    def delete_image(self, image_id: int) -> bool:
        image = self.db.query(ApartmentImage).filter(ApartmentImage.id == image_id).first()
        if not image:
            return False
        
        self.db.delete(image)
        self.db.commit()
        return True

