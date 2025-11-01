# Database Initialization Scripts

## init_db.py

Initializes the database with users from `.env` and seeds sample apartments with images.

**Usage:**
```bash
cd backend
python -m app.scripts.init_db
```

**What it does:**
1. Creates database tables
2. Creates users from `USERS` in `.env` (first user is admin)
3. Seeds 5 sample apartments with details:
   - Modern Studio in Downtown (New York)
   - Spacious 2BR Apartment (San Francisco)
   - Cozy 1BR Near Park (Chicago)
   - Luxury 3BR Penthouse (Los Angeles)
   - Quaint 2BR Cottage (Seattle)
4. Loads images from `sample_images/` folder if available

**Note:** Apartments will be created even if images are missing. Images are loaded from the `sample_images/` directory if available.

## download_sample_images.py

Downloads sample apartment images from Unsplash.

**Usage:**
```bash
cd backend
python -m app.scripts.download_sample_images
```

**What it does:**
- Downloads 10 sample apartment images (2 per apartment)
- Saves them to `backend/app/scripts/sample_images/`
- Images are downloaded from Unsplash (requires internet connection)

**Note:** You can also manually add images to the `sample_images/` folder. The images should be named:
- `apartment1_1.jpg`, `apartment1_2.jpg`
- `apartment2_1.jpg`, `apartment2_2.jpg`
- `apartment3_1.jpg`, `apartment3_2.jpg`
- `apartment4_1.jpg`, `apartment4_2.jpg`
- `apartment5_1.jpg`, `apartment5_2.jpg`

## Setup Workflow

1. **First time setup:**
   ```bash
   # Download sample images
   python -m app.scripts.download_sample_images
   
   # Initialize database with users and apartments
   python -m app.scripts.init_db
   ```

2. **Re-running init_db:**
   - Users are skipped if they already exist
   - Apartments are skipped if they already exist (based on title)
   - Safe to run multiple times

