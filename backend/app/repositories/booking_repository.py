from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date, datetime
from app.models.booking import Booking, PaymentStatus, BookingStatus

class BookingRepository:
    def __init__(self, db: Session):
        self.db = db
    
    def create(self, booking_data: dict) -> Booking:
        booking = Booking(**booking_data)
        self.db.add(booking)
        self.db.commit()
        self.db.refresh(booking)
        return booking
    
    def get_by_id(self, booking_id: int) -> Optional[Booking]:
        return self.db.query(Booking).filter(Booking.id == booking_id).first()
    
    def get_by_user_id(self, user_id: int) -> List[Booking]:
        return self.db.query(Booking).filter(Booking.user_id == user_id).order_by(Booking.created_at.desc()).all()
    
    def get_all(self, skip: int = 0, limit: int = 100) -> List[Booking]:
        return self.db.query(Booking).order_by(Booking.created_at.desc()).offset(skip).limit(limit).all()
    
    def search(
        self,
        search_text: Optional[str] = None,
        booking_status: Optional[str] = None,
        payment_status: Optional[str] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[Booking]:
        from sqlalchemy import or_
        from app.models.user import User
        from app.models.apartment import Apartment
        
        query = self.db.query(Booking).join(Apartment).join(User)
        
        if search_text:
            search_pattern = f"%{search_text}%"
            query = query.filter(
                or_(
                    Apartment.title.ilike(search_pattern),
                    User.username.ilike(search_pattern),
                    Booking.payment_reference.ilike(search_pattern)
                )
            )
        
        if booking_status:
            try:
                status_enum = BookingStatus[booking_status.lower()]
                query = query.filter(Booking.booking_status == status_enum)
            except KeyError:
                pass  # Invalid status, ignore
        
        if payment_status:
            try:
                payment_enum = PaymentStatus[payment_status.lower()]
                query = query.filter(Booking.payment_status == payment_enum)
            except KeyError:
                pass  # Invalid status, ignore
        
        return query.order_by(Booking.created_at.desc()).offset(skip).limit(limit).all()
    
    def get_by_apartment_id(self, apartment_id: int) -> List[Booking]:
        return self.db.query(Booking).filter(Booking.apartment_id == apartment_id).all()
    
    def check_availability(
        self,
        apartment_id: int,
        check_in: date,
        check_out: date,
        exclude_booking_id: Optional[int] = None
    ) -> bool:
        """Check if apartment is available for given dates"""
        from sqlalchemy import and_
        
        # Two date ranges overlap if: start1 < end2 AND end1 > start2
        # For bookings: [check_in, check_out) overlaps with [existing_check_in, existing_check_out)
        # if: check_in < existing_check_out AND check_out > existing_check_in
        query = self.db.query(Booking).filter(
            Booking.apartment_id == apartment_id,
            Booking.booking_status.in_([BookingStatus.PENDING, BookingStatus.CONFIRMED]),
            and_(
                check_in < Booking.check_out_date,
                check_out > Booking.check_in_date
            )
        )
        
        if exclude_booking_id:
            query = query.filter(Booking.id != exclude_booking_id)
        
        conflicting_booking = query.first()
        return conflicting_booking is None
    
    def update(self, booking_id: int, booking_data: dict) -> Optional[Booking]:
        booking = self.get_by_id(booking_id)
        if not booking:
            return None
        
        for key, value in booking_data.items():
            setattr(booking, key, value)
        
        booking.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(booking)
        return booking
    
    def delete(self, booking_id: int) -> bool:
        booking = self.get_by_id(booking_id)
        if not booking:
            return False
        
        self.db.delete(booking)
        self.db.commit()
        return True

