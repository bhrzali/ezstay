from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date
from app.core.database import get_db
from app.routers.auth import get_current_user
from app.services.booking_service import BookingService
from app.models.booking import Booking, PaymentStatus, BookingStatus
from pydantic import BaseModel

router = APIRouter()

class BookingCreate(BaseModel):
    apartment_id: int
    check_in_date: date
    check_out_date: date

class BookingResponse(BaseModel):
    id: int
    apartment_id: int
    user_id: int
    check_in_date: date
    check_out_date: date
    total_price: int
    payment_status: str
    booking_status: str
    payment_reference: Optional[str]
    created_at: str
    
    class Config:
        from_attributes = True
    
    @staticmethod
    def serialize_booking(booking):
        """Helper to serialize booking with proper datetime conversion"""
        return {
            "id": booking.id,
            "apartment_id": booking.apartment_id,
            "user_id": booking.user_id,
            "check_in_date": booking.check_in_date,
            "check_out_date": booking.check_out_date,
            "total_price": booking.total_price,
            "payment_status": booking.payment_status.value if hasattr(booking.payment_status, 'value') else str(booking.payment_status),
            "booking_status": booking.booking_status.value if hasattr(booking.booking_status, 'value') else str(booking.booking_status),
            "payment_reference": booking.payment_reference,
            "created_at": booking.created_at.isoformat() if booking.created_at else ''
        }

@router.post("/", response_model=BookingResponse)
@router.post("", response_model=BookingResponse)
async def create_booking(
    booking_data: BookingCreate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new booking with fake payment"""
    booking_service = BookingService(db)
    
    try:
        booking = booking_service.create_booking(
            apartment_id=booking_data.apartment_id,
            user_id=current_user.id,
            check_in=booking_data.check_in_date,
            check_out=booking_data.check_out_date
        )
        return BookingResponse.serialize_booking(booking)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create booking: {str(e)}")

@router.get("/me/", response_model=List[BookingResponse])
@router.get("/me", response_model=List[BookingResponse])
async def get_my_bookings(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user's bookings"""
    booking_service = BookingService(db)
    bookings = booking_service.get_user_bookings(current_user.id)
    return [BookingResponse.serialize_booking(booking) for booking in bookings]

@router.get("/{booking_id}", response_model=BookingResponse)
async def get_booking(
    booking_id: int,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get booking details"""
    booking_service = BookingService(db)
    booking = booking_service.get_booking(booking_id)
    
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Users can only see their own bookings
    if booking.user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="You don't have permission to view this booking")
    
    return BookingResponse.serialize_booking(booking)

@router.delete("/{booking_id}")
async def cancel_booking(
    booking_id: int,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Cancel a booking"""
    booking_service = BookingService(db)
    
    try:
        booking = booking_service.cancel_booking(booking_id, user_id=current_user.id if not current_user.is_admin else None)
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")
        return {"message": "Booking cancelled successfully"}
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))

@router.get("/apartments/{apartment_id}/availability")
async def check_availability(
    apartment_id: int,
    check_in: date = Query(...),
    check_out: date = Query(...),
    db: Session = Depends(get_db)
):
    """Check if apartment is available for given dates"""
    booking_service = BookingService(db)
    is_available = booking_service.check_availability(apartment_id, check_in, check_out)
    return {
        "apartment_id": apartment_id,
        "check_in": check_in,
        "check_out": check_out,
        "available": is_available
    }

