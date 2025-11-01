"""
Initialize database with users from .env file and seed sample apartments
Run this script to create initial users and sample apartments in the database
"""
import sys
from pathlib import Path
from datetime import date, timedelta
from datetime import datetime

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from app.core.database import SessionLocal, engine, Base
from sqlalchemy.orm import Session
from app.core.config import settings
from app.services.user_service import UserService
from app.services.apartment_service import ApartmentService
from app.core.security import get_password_hash

def load_image_from_file(filepath: Path) -> bytes:
    """Load image file and return as bytes"""
    try:
        with open(filepath, 'rb') as f:
            return f.read()
    except Exception as e:
        print(f"Warning: Could not load image {filepath}: {e}")
        return None

def init_db():
    # Create tables
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        user_service = UserService(db)
        apartment_service = ApartmentService(db)
        
        # Get users from config
        users = settings.user_list
        admin_password = settings.ADMIN_PASSWORD
        
        # Create users
        admin_user = None
        for i, username in enumerate(users):
            # Check if user already exists
            existing_user = user_service.get_user_by_username(username)
            if existing_user:
                print(f"User '{username}' already exists, skipping...")
                if i == 0:
                    admin_user = existing_user
                continue
            
            # First user is admin
            is_admin = (i == 0)
            password = admin_password if is_admin else admin_password  # Use admin password for all users for now
            
            user = user_service.create_user(username, password, is_admin=is_admin)
            print(f"Created user '{username}' (admin: {is_admin})")
            if is_admin:
                admin_user = user
        
        if not admin_user:
            admin_user = user_service.get_user_by_username(users[0])
        
        print("\nDatabase initialized successfully!")
        print(f"Admin user: {users[0]}")
        print(f"Password: {admin_password}")
        
        # Seed sample apartments
        print("\nSeeding sample apartments...")
        seed_apartments(db, apartment_service, admin_user.id)
        
    except Exception as e:
        print(f"Error initializing database: {e}")
        raise
    finally:
        db.close()

def seed_apartments(db: Session, apartment_service: ApartmentService, admin_user_id: int):
    """Seed database with sample apartments"""
    script_dir = Path(__file__).parent
    images_dir = script_dir / "sample_images"
    
    today = date.today()
    sample_apartments = [
        # Existing apartments - keeping them for continuity
        {
            "title": "Modern Studio in Downtown",
            "description": "Beautiful modern studio apartment in the heart of downtown. Recently renovated with modern amenities. Perfect for professionals. Close to public transport and shopping centers.",
            "address": "123 Main Street",
            "city": "New York",
            "price_per_month": 2500,
            "available_from": today,
            "available_to": today + timedelta(days=365),
            "bedrooms": 1,
            "bathrooms": 1,
            "images": ["apartment1_1.jpg", "apartment1_2.jpg"]
        },
        {
            "title": "Spacious 2BR Apartment",
            "description": "Large 2-bedroom apartment with lots of natural light. Features modern kitchen, hardwood floors, and a private balcony. Located in a quiet neighborhood with easy access to the city center.",
            "address": "456 Oak Avenue",
            "city": "San Francisco",
            "price_per_month": 3800,
            "available_from": today + timedelta(days=30),
            "available_to": today + timedelta(days=395),
            "bedrooms": 2,
            "bathrooms": 2,
            "images": ["apartment2_1.jpg", "apartment2_2.jpg"]
        },
        {
            "title": "Cozy 1BR Near Park",
            "description": "Charming one-bedroom apartment located near the park. Perfect for nature lovers. Includes parking space and storage. Pet-friendly building.",
            "address": "789 Park Boulevard",
            "city": "Chicago",
            "price_per_month": 1800,
            "available_from": today + timedelta(days=14),
            "available_to": today + timedelta(days=379),
            "bedrooms": 1,
            "bathrooms": 1,
            "images": ["apartment3_1.jpg", "apartment3_2.jpg"]
        },
        {
            "title": "Luxury 3BR Penthouse",
            "description": "Stunning penthouse apartment with panoramic city views. Features high-end finishes, private terrace, and premium amenities. Building includes gym, pool, and concierge service.",
            "address": "101 Skyline Drive",
            "city": "Los Angeles",
            "price_per_month": 6500,
            "available_from": today + timedelta(days=60),
            "available_to": today + timedelta(days=425),
            "bedrooms": 3,
            "bathrooms": 3,
            "images": ["apartment4_1.jpg", "apartment4_2.jpg"]
        },
        {
            "title": "Quaint 2BR Cottage",
            "description": "Adorable 2-bedroom cottage in a peaceful residential area. Features a lovely garden and covered porch. Perfect for families. Close to schools and parks.",
            "address": "222 Garden Lane",
            "city": "Seattle",
            "price_per_month": 2200,
            "available_from": today + timedelta(days=45),
            "available_to": today + timedelta(days=410),
            "bedrooms": 2,
            "bathrooms": 1,
            "images": ["apartment5_1.jpg", "apartment5_2.jpg"]
        },
        # Budget apartments (under $2000)
        {
            "title": "Budget Studio - Central Location",
            "description": "Affordable studio apartment in central location. Compact but efficient layout. Perfect for students or young professionals. Walking distance to public transport.",
            "address": "334 Elm Street",
            "city": "Boston",
            "price_per_month": 1200,
            "available_from": today + timedelta(days=7),
            "available_to": today + timedelta(days=240),
            "bedrooms": 0,
            "bathrooms": 1,
            "images": ["apartment6_1.jpg", "apartment6_2.jpg"]
        },
        {
            "title": "Economy 1BR Apartment",
            "description": "Value-priced one-bedroom in friendly neighborhood. Recently painted and clean. Includes basic appliances and shared laundry facilities. Great starter apartment.",
            "address": "567 Maple Avenue",
            "city": "Austin",
            "price_per_month": 950,
            "available_from": today + timedelta(days=21),
            "available_to": today + timedelta(days=300),
            "bedrooms": 1,
            "bathrooms": 1,
            "images": ["apartment7_1.jpg", "apartment7_2.jpg"]
        },
        {
            "title": "Cozy Studio Loft",
            "description": "Unique loft-style studio with high ceilings and large windows. Industrial design elements. Located in trendy arts district. Monthly parking available.",
            "address": "890 Industrial Way",
            "city": "Portland",
            "price_per_month": 1450,
            "available_from": today + timedelta(days=0),
            "available_to": today + timedelta(days=180),
            "bedrooms": 0,
            "bathrooms": 1,
            "images": ["apartment8_1.jpg", "apartment8_2.jpg"]
        },
        # Mid-range apartments ($2000-$4000)
        {
            "title": "Bright 2BR with Balcony",
            "description": "Sunny 2-bedroom apartment with private balcony overlooking the city. Updated kitchen and bathrooms. In-unit washer/dryer. Secure building with elevator.",
            "address": "111 River Road",
            "city": "Denver",
            "price_per_month": 2400,
            "available_from": today + timedelta(days=14),
            "available_to": today + timedelta(days=365),
            "bedrooms": 2,
            "bathrooms": 2,
            "images": ["apartment9_1.jpg", "apartment9_2.jpg"]
        },
        {
            "title": "Modern 1BR Downtown",
            "description": "Contemporary one-bedroom in prime downtown location. Open floor plan, granite countertops, stainless steel appliances. Rooftop access with city views.",
            "address": "222 Commerce Street",
            "city": "Miami",
            "price_per_month": 3200,
            "available_from": today + timedelta(days=30),
            "available_to": today + timedelta(days=450),
            "bedrooms": 1,
            "bathrooms": 1,
            "images": ["apartment10_1.jpg", "apartment10_2.jpg"]
        },
        {
            "title": "Family-Friendly 3BR",
            "description": "Spacious 3-bedroom apartment perfect for families. Large living room, modern kitchen, and extra storage. Located in quiet neighborhood near schools.",
            "address": "333 School Lane",
            "city": "Atlanta",
            "price_per_month": 2800,
            "available_from": today + timedelta(days=60),
            "available_to": today + timedelta(days=500),
            "bedrooms": 3,
            "bathrooms": 2,
            "images": ["apartment11_1.jpg", "apartment11_2.jpg"]
        },
        {
            "title": "Stylish 2BR Loft",
            "description": "Converted warehouse loft with exposed brick and high ceilings. Two bedrooms with flexible floor plan. Walking distance to restaurants and nightlife.",
            "address": "444 Warehouse District",
            "city": "Nashville",
            "price_per_month": 2100,
            "available_from": today + timedelta(days=45),
            "available_to": today + timedelta(days=330),
            "bedrooms": 2,
            "bathrooms": 2,
            "images": ["apartment12_1.jpg", "apartment12_2.jpg"]
        },
        {
            "title": "Comfortable 1BR with Garden",
            "description": "Ground-floor one-bedroom with private garden space. Updated kitchen and bathroom. Pet-friendly. Includes parking and storage unit.",
            "address": "555 Green Street",
            "city": "Phoenix",
            "price_per_month": 1650,
            "available_from": today + timedelta(days=0),
            "available_to": today + timedelta(days=270),
            "bedrooms": 1,
            "bathrooms": 1,
            "images": ["apartment13_1.jpg", "apartment13_2.jpg"]
        },
        # Premium apartments ($4000-$6000)
        {
            "title": "Luxury 2BR High-Rise",
            "description": "Premium 2-bedroom in modern high-rise building. Floor-to-ceiling windows, gourmet kitchen, marble bathrooms. Building amenities include gym, pool, and concierge.",
            "address": "666 Tower Boulevard",
            "city": "New York",
            "price_per_month": 5200,
            "available_from": today + timedelta(days=90),
            "available_to": today + timedelta(days=600),
            "bedrooms": 2,
            "bathrooms": 2,
            "images": ["apartment14_1.jpg", "apartment14_2.jpg"]
        },
        {
            "title": "Designer 3BR Penthouse",
            "description": "Exclusive penthouse with private rooftop terrace. Designer finishes throughout, smart home technology, wine storage. Panoramic city and water views.",
            "address": "777 Skybridge Avenue",
            "city": "San Francisco",
            "price_per_month": 8500,
            "available_from": today + timedelta(days=120),
            "available_to": today + timedelta(days=720),
            "bedrooms": 3,
            "bathrooms": 3,
            "images": ["apartment15_1.jpg", "apartment15_2.jpg"]
        },
        {
            "title": "Elegant 2BR Victorian",
            "description": "Beautifully restored Victorian-era apartment with original character. High ceilings, hardwood floors, fireplace. Modern updates blend seamlessly with historic charm.",
            "address": "888 Heritage Lane",
            "city": "Boston",
            "price_per_month": 4500,
            "available_from": today + timedelta(days=30),
            "available_to": today + timedelta(days=480),
            "bedrooms": 2,
            "bathrooms": 2,
            "images": ["apartment16_1.jpg", "apartment16_2.jpg"]
        },
        {
            "title": "Modern 1BR Waterfront",
            "description": "Stunning waterfront 1-bedroom with private balcony. Open kitchen with island, walk-in closet, spa-like bathroom. Direct access to waterfront promenade.",
            "address": "999 Harbor View",
            "city": "Seattle",
            "price_per_month": 3800,
            "available_from": today + timedelta(days=15),
            "available_to": today + timedelta(days=360),
            "bedrooms": 1,
            "bathrooms": 1,
            "images": ["apartment17_1.jpg", "apartment17_2.jpg"]
        },
        {
            "title": "Spacious 4BR Family Home",
            "description": "Large 4-bedroom apartment ideal for families. Multiple living areas, updated kitchen, backyard access. Quiet residential street. Excellent schools nearby.",
            "address": "1000 Family Circle",
            "city": "Chicago",
            "price_per_month": 4200,
            "available_from": today + timedelta(days=45),
            "available_to": today + timedelta(days=540),
            "bedrooms": 4,
            "bathrooms": 3,
            "images": ["apartment18_1.jpg", "apartment18_2.jpg"]
        },
        # Short-term availability (3-6 months)
        {
            "title": "Short-Term 1BR Furnished",
            "description": "Fully furnished one-bedroom available for short-term rental. Includes all furniture, appliances, and linens. Perfect for temporary relocation or extended stay.",
            "address": "1101 Short Stay Street",
            "city": "Las Vegas",
            "price_per_month": 1800,
            "available_from": today + timedelta(days=0),
            "available_to": today + timedelta(days=120),
            "bedrooms": 1,
            "bathrooms": 1,
            "images": ["apartment19_1.jpg", "apartment19_2.jpg"]
        },
        {
            "title": "Temporary 2BR Sublet",
            "description": "2-bedroom available for 6-month sublet. Clean and well-maintained. All utilities included. Great for work assignment or travel.",
            "address": "1202 Temp Place",
            "city": "Houston",
            "price_per_month": 1950,
            "available_from": today + timedelta(days=30),
            "available_to": today + timedelta(days=210),
            "bedrooms": 2,
            "bathrooms": 2,
            "images": ["apartment20_1.jpg", "apartment20_2.jpg"]
        },
        # Long-term availability (over 1 year)
        {
            "title": "Stable 2BR Rental",
            "description": "Well-maintained 2-bedroom with long-term availability. Stable rental with excellent landlord. Recent renovations. Quiet building.",
            "address": "1303 Stable Road",
            "city": "Indianapolis",
            "price_per_month": 1600,
            "available_from": today + timedelta(days=60),
            "available_to": today + timedelta(days=730),
            "bedrooms": 2,
            "bathrooms": 1,
            "images": ["apartment21_1.jpg", "apartment21_2.jpg"]
        },
        {
            "title": "Extended Lease 3BR",
            "description": "Generous 3-bedroom available for extended lease term. Competitive pricing for long-term tenants. Flexible lease terms available.",
            "address": "1404 Longterm Lane",
            "city": "Charlotte",
            "price_per_month": 2400,
            "available_from": today + timedelta(days=90),
            "available_to": today + timedelta(days=1095),
            "bedrooms": 3,
            "bathrooms": 2,
            "images": ["apartment22_1.jpg", "apartment22_2.jpg"]
        },
        # Immediate availability
        {
            "title": "Ready Now - 1BR Studio",
            "description": "Available immediately! Clean studio apartment ready for move-in. Quick approval process. Located near university campus.",
            "address": "1505 Quick Move",
            "city": "Minneapolis",
            "price_per_month": 1100,
            "available_from": today,
            "available_to": today + timedelta(days=365),
            "bedrooms": 0,
            "bathrooms": 1,
            "images": ["apartment23_1.jpg", "apartment23_2.jpg"]
        },
        {
            "title": "Move-In Ready 2BR",
            "description": "Move-in ready 2-bedroom available today. Fresh paint, new carpet, updated appliances. Quick move-in possible with pre-approval.",
            "address": "1606 Immediate Avenue",
            "city": "Tampa",
            "price_per_month": 1750,
            "available_from": today,
            "available_to": today + timedelta(days=420),
            "bedrooms": 2,
            "bathrooms": 2,
            "images": ["apartment24_1.jpg", "apartment24_2.jpg"]
        },
        # Future availability (3+ months out)
        {
            "title": "Pre-Lease 2BR New Build",
            "description": "Brand new 2-bedroom in upcoming development. Reserve now for future availability. Modern amenities, energy-efficient design.",
            "address": "1707 Future Street",
            "city": "Raleigh",
            "price_per_month": 2200,
            "available_from": today + timedelta(days=180),
            "available_to": today + timedelta(days=730),
            "bedrooms": 2,
            "bathrooms": 2,
            "images": ["apartment25_1.jpg", "apartment25_2.jpg"]
        },
        {
            "title": "Pre-Construction 3BR",
            "description": "Luxury 3-bedroom in pre-construction phase. Available for booking now with future move-in date. Premium finishes and smart home features included.",
            "address": "1808 PreBuild Drive",
            "city": "Orlando",
            "price_per_month": 3500,
            "available_from": today + timedelta(days=210),
            "available_to": today + timedelta(days=800),
            "bedrooms": 3,
            "bathrooms": 3,
            "images": ["apartment26_1.jpg", "apartment26_2.jpg"]
        },
    ]
    
    created_count = 0
    for apt_data in sample_apartments:
        # Check if apartment with same title already exists
        existing_apartments = apartment_service.get_all_apartments()
        if any(apt.title == apt_data["title"] for apt in existing_apartments):
            print(f"  Apartment '{apt_data['title']}' already exists, skipping...")
            continue
        
        # Extract images list before creating apartment
        image_files = apt_data.pop("images")
        
        # Create apartment
        apt_data["created_by"] = admin_user_id
        apartment = apartment_service.create_apartment(apt_data)
        print(f"  Created apartment: {apartment.title} ({apartment.city})")
        
        # Add images if available
        if images_dir.exists():
            for img_file in image_files:
                img_path = images_dir / img_file
                if img_path.exists():
                    image_data = load_image_from_file(img_path)
                    if image_data:
                        apartment_service.add_apartment_image(
                            apartment.id,
                            image_data,
                            img_file
                        )
                    else:
                        print(f"    Warning: Could not load image {img_file}")
                else:
                    print(f"    Warning: Image file not found: {img_file}")
        else:
            print(f"    Warning: Sample images directory not found: {images_dir}")
            print(f"    Run 'python -m app.scripts.download_sample_images' to download images")
        
        created_count += 1
    
    print(f"\nSeeded {created_count} apartments with images!")

if __name__ == "__main__":
    init_db()

