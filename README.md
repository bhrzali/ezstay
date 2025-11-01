# EazyStay - Apartment Rental Application

A full-stack application for finding and managing apartment rentals, built with Next.js (frontend) and FastAPI (backend).

## Project Structure

```
rentaplace/
├── backend/          # FastAPI backend
│   ├── app/
│   │   ├── core/     # Configuration, database, security
│   │   ├── models/   # SQLAlchemy models
│   │   ├── repositories/  # Data access layer
│   │   ├── services/      # Business logic layer
│   │   ├── routers/       # API endpoints
│   │   └── scripts/       # Utility scripts
│   └── requirements.txt
├── frontend/         # Next.js frontend
│   ├── app/          # Next.js app router
│   └── package.json
├── docker-compose.yml
└── .env.example
```

## Features

- **User Management**: Users configured from .env file with encrypted passwords
- **Admin Dashboard**: Admin can create, update, and delete apartments
- **Apartment Search**: Search apartments by city, price range, availability, etc.
- **Image Upload**: Upload multiple images for apartments (stored as binary in DB)
- **Clean Architecture**: Repository pattern with separation of concerns

## Setup Instructions

### Prerequisites

- Python 3.9+
- Node.js 18+
- Docker and Docker Compose

### 1. Environment Setup

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Edit `.env` and set:
- `USERS`: Comma-separated list of usernames (first user is admin)
- `ADMIN_PASSWORD`: Password for all users (will be hashed)
- `SECRET_KEY`: A secure random string for JWT tokens
- `DATABASE_URL`: PostgreSQL connection string

### 2. Database Setup

Start PostgreSQL database:

```bash
docker-compose up -d
```

### 3. Backend Setup

```bash
cd backend
pip install -r requirements.txt
python -m app.scripts.init_db
```

This will create the database tables and initialize users from `.env`.

### 4. Frontend Setup

```bash
cd frontend
npm install
```

### 5. Running the Application

#### Option A: Local Development (Separate processes)

**Backend (API Server):**
```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

**Frontend (Development Server):**
```bash
cd frontend
npm run dev
```

#### Option B: Docker Compose

Run both database and backend in Docker:

```bash
# Start database and backend
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop services
docker-compose down
```

**Note:** The backend uses `postgres` as the database hostname (Docker service name), not `localhost`. This is configured automatically in docker-compose.yml.

#### Option C: Docker Backend Only

If you want to run only the backend in Docker (with local PostgreSQL):

```bash
cd backend
docker build -t ezstay-backend .
docker run -p 8000:8000 \
  -e DATABASE_URL=postgresql://rentaplace_user:rentaplace_password@host.docker.internal:5432/rentaplace_db \
  -e USERS=admin,user1,user2 \
  -e ADMIN_PASSWORD=admin123 \
  -e SECRET_KEY=your-secret-key \
  ezstay-backend
```

**Access:**
- Frontend: http://localhost:3000 (when running locally)
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs (Swagger UI)
- API Docs: http://localhost:8000/redoc (ReDoc)

## API Endpoints

### Authentication
- `POST /api/auth/token` - Login (OAuth2 form data: username, password)
- `GET /api/auth/me` - Get current user info (requires auth)

### Apartments
- `GET /api/apartments` - List apartments (with optional filters)
  - Query params: `city`, `min_price`, `max_price`, `available_from`, `available_to`, `bedrooms`
- `GET /api/apartments/{id}` - Get apartment details
- `GET /api/apartments/{id}/images` - List apartment images
- `GET /api/apartments/{id}/images/{image_id}` - Get image (returns binary)

### Admin
- `POST /api/admin/apartments` - Create apartment (multipart/form-data with images)
- `PUT /api/admin/apartments/{id}` - Update apartment
- `DELETE /api/admin/apartments/{id}` - Delete apartment
- `POST /api/admin/apartments/{id}/images` - Add images to apartment

## Default Login

After running `init_db`, you can login with:
- **Username**: First user from `USERS` in `.env` (default: `admin`)
- **Password**: `ADMIN_PASSWORD` from `.env`

## Architecture

The backend follows a clean architecture pattern:

- **Models**: SQLAlchemy ORM models (`app/models/`)
- **Repositories**: Data access layer (`app/repositories/`)
- **Services**: Business logic layer (`app/services/`)
- **Routers**: API endpoints (`app/routers/`)

This separation ensures:
- Testability
- Maintainability
- Scalability
- Clear separation of concerns

## Future Improvements

- [ ] Replace binary image storage with cloud storage (S3, Azure Blob, etc.)
- [ ] Implement proper user registration and authentication flow
- [ ] Add user favorites/bookmarks
- [ ] Add booking/reservation system
- [ ] Add email notifications
- [ ] Add pagination for apartment listings
- [ ] Add image optimization and thumbnails

