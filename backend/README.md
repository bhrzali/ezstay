# EazyStay Backend

FastAPI backend for the apartment rental application.

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Copy `.env.example` to `.env` and configure:
```bash
cp ../.env.example .env
```

3. Start PostgreSQL database:
```bash
docker-compose up -d
```

4. Initialize database with users:
```bash
python -m app.scripts.init_db
```

5. Run the server:
```bash
uvicorn app.main:app --reload --port 8000
```

## API Endpoints

### Authentication
- `POST /api/auth/token` - Login and get access token
- `GET /api/auth/me` - Get current user info

### Apartments
- `GET /api/apartments` - List all apartments (with search filters)
- `GET /api/apartments/{id}` - Get apartment details
- `GET /api/apartments/{id}/images` - Get apartment images list
- `GET /api/apartments/{id}/images/{image_id}` - Get apartment image

### Admin
- `POST /api/admin/apartments` - Create new apartment (with images)
- `PUT /api/admin/apartments/{id}` - Update apartment
- `DELETE /api/admin/apartments/{id}` - Delete apartment
- `POST /api/admin/apartments/{id}/images` - Add images to apartment

## Architecture

The backend follows a clean architecture with:
- **Models**: SQLAlchemy models
- **Repositories**: Data access layer
- **Services**: Business logic layer
- **Routers**: API endpoints

