from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import date
from app.core.database import get_db
from app.routers.auth import get_current_user
from app.services.apartment_service import ApartmentService
from app.models.apartment import Apartment, ApartmentImage
from pydantic import BaseModel

router = APIRouter()

class ApartmentResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    address: str
    city: str
    price_per_month: int
    available_from: date
    available_to: date
    bedrooms: int
    bathrooms: int
    created_by: int
    
    class Config:
        from_attributes = True

# Handle both with and without trailing slash
@router.get("", response_model=list[ApartmentResponse])
@router.get("/", response_model=list[ApartmentResponse])
async def list_apartments(
    city: Optional[str] = Query(None),
    min_price: Optional[int] = Query(None),
    max_price: Optional[int] = Query(None),
    available_from: Optional[date] = Query(None),
    available_to: Optional[date] = Query(None),
    bedrooms: Optional[int] = Query(None),
    skip: int = Query(0),
    limit: int = Query(100),
    db: Session = Depends(get_db)
):
    apartment_service = ApartmentService(db)
    if any([city, min_price, max_price, available_from, available_to, bedrooms]):
        apartments = apartment_service.search_apartments(
            city=city,
            min_price=min_price,
            max_price=max_price,
            available_from=available_from,
            available_to=available_to,
            bedrooms=bedrooms,
            skip=skip,
            limit=limit
        )
    else:
        apartments = apartment_service.get_all_apartments(skip=skip, limit=limit)
    return apartments

@router.get("/{apartment_id}", response_model=ApartmentResponse)
async def get_apartment(apartment_id: int, db: Session = Depends(get_db)):
    apartment_service = ApartmentService(db)
    apartment = apartment_service.get_apartment(apartment_id)
    if not apartment:
        raise HTTPException(status_code=404, detail="Apartment not found")
    return apartment

@router.get("/{apartment_id}/images")
async def get_apartment_images(apartment_id: int, db: Session = Depends(get_db)):
    apartment_service = ApartmentService(db)
    apartment = apartment_service.get_apartment(apartment_id)
    if not apartment:
        raise HTTPException(status_code=404, detail="Apartment not found")
    
    images = apartment_service.get_apartment_images(apartment_id)
    return [
        {
            "id": img.id,
            "image_name": img.image_name,
            "created_at": img.created_at
        }
        for img in images
    ]

@router.get("/{apartment_id}/images/{image_id}")
async def get_apartment_image(
    apartment_id: int,
    image_id: int,
    db: Session = Depends(get_db)
):
    apartment_service = ApartmentService(db)
    apartment = apartment_service.get_apartment(apartment_id)
    if not apartment:
        raise HTTPException(status_code=404, detail="Apartment not found")
    
    images = apartment_service.get_apartment_images(apartment_id)
    image = next((img for img in images if img.id == image_id), None)
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")
    
    from fastapi.responses import Response
    return Response(content=image.image_data, media_type="image/jpeg")

