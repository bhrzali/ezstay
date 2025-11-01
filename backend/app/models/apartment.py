from sqlalchemy import Column, Integer, String, DateTime, Text, LargeBinary, ForeignKey, Date
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class Apartment(Base):
    __tablename__ = "apartments"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text)
    address = Column(String, nullable=False)
    city = Column(String, nullable=False)
    price_per_month = Column(Integer, nullable=False)
    available_from = Column(Date, nullable=False)
    available_to = Column(Date, nullable=False)
    bedrooms = Column(Integer, nullable=False)
    bathrooms = Column(Integer, nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Store images as binary for now
    images = relationship("ApartmentImage", back_populates="apartment", cascade="all, delete-orphan")

class ApartmentImage(Base):
    __tablename__ = "apartment_images"
    
    id = Column(Integer, primary_key=True, index=True)
    apartment_id = Column(Integer, ForeignKey("apartments.id"), nullable=False)
    image_data = Column(LargeBinary, nullable=False)
    image_name = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    apartment = relationship("Apartment", back_populates="images")

