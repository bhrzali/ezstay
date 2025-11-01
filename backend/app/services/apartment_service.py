from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date
from app.repositories.apartment_repository import ApartmentRepository
from app.models.apartment import Apartment

class ApartmentService:
    def __init__(self, db: Session):
        self.repository = ApartmentRepository(db)
    
    def create_apartment(self, apartment_data: dict) -> Apartment:
        return self.repository.create(apartment_data)
    
    def get_apartment(self, apartment_id: int) -> Optional[Apartment]:
        return self.repository.get_by_id(apartment_id)
    
    def get_all_apartments(self, skip: int = 0, limit: int = 100) -> List[Apartment]:
        return self.repository.get_all(skip, limit)
    
    def search_apartments(
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
        return self.repository.search(
            city=city,
            min_price=min_price,
            max_price=max_price,
            available_from=available_from,
            available_to=available_to,
            bedrooms=bedrooms,
            skip=skip,
            limit=limit
        )
    
    def update_apartment(self, apartment_id: int, apartment_data: dict) -> Optional[Apartment]:
        return self.repository.update(apartment_id, apartment_data)
    
    def delete_apartment(self, apartment_id: int) -> bool:
        return self.repository.delete(apartment_id)
    
    def add_apartment_image(self, apartment_id: int, image_data: bytes, image_name: str):
        return self.repository.add_image(apartment_id, image_data, image_name)
    
    def get_apartment_images(self, apartment_id: int):
        return self.repository.get_images(apartment_id)
    
    def delete_apartment_image(self, image_id: int) -> bool:
        return self.repository.delete_image(image_id)

