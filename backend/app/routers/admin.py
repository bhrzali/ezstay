from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date
from app.core.database import get_db
from app.routers.auth import get_current_admin_user
from app.services.apartment_service import ApartmentService
from app.models.apartment import Apartment
from pydantic import BaseModel

router = APIRouter()

class ApartmentCreate(BaseModel):
    title: str
    description: Optional[str] = None
    address: str
    city: str
    price_per_month: int
    available_from: date
    available_to: date
    bedrooms: int
    bathrooms: int

class ApartmentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    price_per_month: Optional[int] = None
    available_from: Optional[date] = None
    available_to: Optional[date] = None
    bedrooms: Optional[int] = None
    bathrooms: Optional[int] = None

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

@router.post("/apartments", response_model=ApartmentResponse)
async def create_apartment(
    title: str = Form(...),
    description: Optional[str] = Form(None),
    address: str = Form(...),
    city: str = Form(...),
    price_per_month: int = Form(...),
    available_from: date = Form(...),
    available_to: date = Form(...),
    bedrooms: int = Form(...),
    bathrooms: int = Form(...),
    images: List[UploadFile] = File([]),
    current_user = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    apartment_service = ApartmentService(db)
    
    apartment_data = {
        "title": title,
        "description": description,
        "address": address,
        "city": city,
        "price_per_month": price_per_month,
        "available_from": available_from,
        "available_to": available_to,
        "bedrooms": bedrooms,
        "bathrooms": bathrooms,
        "created_by": current_user.id
    }
    
    apartment = apartment_service.create_apartment(apartment_data)
    
    # Add images
    for image in images:
        image_data = await image.read()
        apartment_service.add_apartment_image(
            apartment.id,
            image_data,
            image.filename or "image.jpg"
        )
    
    return apartment

@router.put("/apartments/{apartment_id}", response_model=ApartmentResponse)
async def update_apartment(
    apartment_id: int,
    apartment_update: ApartmentUpdate,
    current_user = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    apartment_service = ApartmentService(db)
    
    update_data = apartment_update.dict(exclude_unset=True)
    apartment = apartment_service.update_apartment(apartment_id, update_data)
    
    if not apartment:
        raise HTTPException(status_code=404, detail="Apartment not found")
    
    return apartment

@router.delete("/apartments/{apartment_id}")
async def delete_apartment(
    apartment_id: int,
    current_user = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    apartment_service = ApartmentService(db)
    success = apartment_service.delete_apartment(apartment_id)
    
    if not success:
        raise HTTPException(status_code=404, detail="Apartment not found")
    
    return {"message": "Apartment deleted successfully"}

@router.post("/apartments/{apartment_id}/images")
async def add_apartment_images(
    apartment_id: int,
    images: List[UploadFile] = File(...),
    current_user = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    apartment_service = ApartmentService(db)
    apartment = apartment_service.get_apartment(apartment_id)
    
    if not apartment:
        raise HTTPException(status_code=404, detail="Apartment not found")
    
    uploaded_images = []
    for image in images:
        image_data = await image.read()
        img = apartment_service.add_apartment_image(
            apartment_id,
            image_data,
            image.filename or "image.jpg"
        )
        uploaded_images.append({
            "id": img.id,
            "image_name": img.image_name
        })
    
    return {"message": "Images uploaded successfully", "images": uploaded_images}

@router.delete("/apartments/{apartment_id}/images/{image_id}")
async def delete_apartment_image(
    apartment_id: int,
    image_id: int,
    current_user = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Delete an apartment image"""
    apartment_service = ApartmentService(db)
    apartment = apartment_service.get_apartment(apartment_id)
    
    if not apartment:
        raise HTTPException(status_code=404, detail="Apartment not found")
    
    success = apartment_service.delete_apartment_image(image_id)
    if not success:
        raise HTTPException(status_code=404, detail="Image not found")
    
    return {"message": "Image deleted successfully"}

@router.get("/bookings/", response_model=List[dict])
@router.get("/bookings", response_model=List[dict])
async def get_all_bookings(
    skip: int = Query(0),
    limit: int = Query(100),
    current_user = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Get all bookings (admin only)"""
    from app.services.booking_service import BookingService
    booking_service = BookingService(db)
    bookings = booking_service.get_all_bookings(skip=skip, limit=limit)
    
    return [
        {
            "id": booking.id,
            "apartment_id": booking.apartment_id,
            "apartment_title": booking.apartment.title if booking.apartment else None,
            "user_id": booking.user_id,
            "user_username": booking.user.username if booking.user else None,
            "check_in_date": booking.check_in_date,
            "check_out_date": booking.check_out_date,
            "total_price": booking.total_price,
            "payment_status": booking.payment_status.value,
            "booking_status": booking.booking_status.value,
            "payment_reference": booking.payment_reference,
            "created_at": booking.created_at.isoformat() if booking.created_at else None
        }
        for booking in bookings
    ]

