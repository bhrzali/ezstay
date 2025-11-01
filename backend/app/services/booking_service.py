from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date, timedelta
from app.repositories.booking_repository import BookingRepository
from app.repositories.apartment_repository import ApartmentRepository
from app.models.booking import Booking, PaymentStatus, BookingStatus
import secrets

class BookingService:
    def __init__(self, db: Session):
        self.repository = BookingRepository(db)
        self.apartment_repository = ApartmentRepository(db)
    
    def create_booking(
        self,
        apartment_id: int,
        user_id: int,
        check_in: date,
        check_out: date
    ) -> Booking:
        # Verify apartment exists
        apartment = self.apartment_repository.get_by_id(apartment_id)
        if not apartment:
            raise ValueError("Apartment not found")
        
        # Check dates are valid
        if check_in >= check_out:
            raise ValueError("Check-in date must be before check-out date")
        
        if check_in < date.today():
            raise ValueError("Check-in date cannot be in the past")
        
        # Check if dates are within apartment availability
        # Allow check_out to be equal to available_to (last day of availability)
        if check_in < apartment.available_from:
            raise ValueError(f"Check-in date must be on or after {apartment.available_from}")
        
        if check_out > apartment.available_to:
            raise ValueError(f"Check-out date must be on or before {apartment.available_to}")
        
        # Check if apartment is available (no overlapping bookings)
        # Only check confirmed/pending bookings, not cancelled ones
        is_available = self.repository.check_availability(apartment_id, check_in, check_out)
        if not is_available:
            # Get conflicting bookings for better error message
            all_bookings = self.repository.get_by_apartment_id(apartment_id)
            conflicting = [
                b for b in all_bookings
                if b.booking_status in [BookingStatus.PENDING, BookingStatus.CONFIRMED]
                and b.check_in_date < check_out
                and b.check_out_date > check_in
            ]
            if conflicting:
                dates_str = ", ".join([f"{b.check_in_date} to {b.check_out_date}" for b in conflicting])
                raise ValueError(f"Apartment is already booked for overlapping dates: {dates_str}")
            else:
                raise ValueError("Apartment is not available for the selected dates")
        
        # Calculate total price
        nights = (check_out - check_in).days
        total_price = apartment.price_per_month * (nights / 30)  # Pro-rated monthly price
        
        # Generate fake payment reference
        payment_reference = f"PAY-{secrets.token_hex(8).upper()}"
        
        booking_data = {
            "apartment_id": apartment_id,
            "user_id": user_id,
            "check_in_date": check_in,
            "check_out_date": check_out,
            "total_price": int(total_price),
            "payment_status": PaymentStatus.COMPLETED,  # Fake payment - always succeeds
            "booking_status": BookingStatus.CONFIRMED,
            "payment_reference": payment_reference
        }
        
        return self.repository.create(booking_data)
    
    def get_booking(self, booking_id: int) -> Optional[Booking]:
        return self.repository.get_by_id(booking_id)
    
    def get_user_bookings(self, user_id: int) -> List[Booking]:
        return self.repository.get_by_user_id(user_id)
    
    def get_all_bookings(self, skip: int = 0, limit: int = 100) -> List[Booking]:
        return self.repository.get_all(skip, limit)
    
    def get_apartment_bookings(self, apartment_id: int) -> List[Booking]:
        return self.repository.get_by_apartment_id(apartment_id)
    
    def cancel_booking(self, booking_id: int, user_id: Optional[int] = None) -> Optional[Booking]:
        booking = self.repository.get_by_id(booking_id)
        if not booking:
            return None
        
        # Check if user owns the booking (if user_id provided)
        if user_id and booking.user_id != user_id:
            raise ValueError("You don't have permission to cancel this booking")
        
        # Update booking status
        update_data = {
            "booking_status": BookingStatus.CANCELLED,
            "payment_status": PaymentStatus.REFUNDED if booking.payment_status == PaymentStatus.COMPLETED else booking.payment_status
        }
        
        return self.repository.update(booking_id, update_data)
    
    def check_availability(self, apartment_id: int, check_in: date, check_out: date) -> bool:
        return self.repository.check_availability(apartment_id, check_in, check_out)

